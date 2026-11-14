// Todas as operações administrativas validam a identidade no servidor.
function exigirAdmin_() {
  const autorizado = String(PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '').trim().toLowerCase();
  const ativo = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const efetivo = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (!autorizado || !ativo || ativo !== autorizado || efetivo !== autorizado) {
    throw new Error('Acesso administrativo não autorizado.');
  }
}
function adminComLock_(fn) {
  exigirAdmin_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) throw new Error('Banco não configurado.');
    return fn(SpreadsheetApp.openById(id));
  } finally { lock.releaseLock(); }
}
function adminLinhas_(planilha, nome) {
  return planilha.getSheetByName(nome).getDataRange().getValues().slice(1);
}
function adminConfig_(planilha) {
  const aba=planilha.getSheetByName('Configuracao');
  const linhas=aba.getDataRange().getValues().slice(1);
  const config=Object.fromEntries(linhas);
  for(const chave of ['votacao_aberta','modo','inicio_votacao','fim_votacao']) {
    if(linhas.filter(l=>l[0]===chave).length!==1) throw new Error('Configuração ausente ou duplicada: '+chave);
  }
  return {aba,linhas,config};
}
function adminDataIso_(v) {
  if(!v) return '';
  const d=new Date(v);
  return Number.isFinite(d.getTime())?d.toISOString():null;
}
function adminPeriodo_(inicio,fim) {
  function ler(v) {
    if(v==='') return '';
    if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00-03:00$/.test(v)) throw new Error('Data inválida; utilize horário de Fortaleza.');
    const d=new Date(v);
    if(!Number.isFinite(d.getTime())||Utilities.formatDate(d,'America/Fortaleza',"yyyy-MM-dd'T'HH:mm:ss")!==v.slice(0,19)) throw new Error('Data inválida.');
    return d;
  }
  const a=ler(inicio),z=ler(fim);
  if(a&&z&&a.getTime()>z.getTime()) throw new Error('O início deve anteceder o fim.');
  return [a,z];
}
function adminResumo_ (planilha) {
  const {config}=adminConfig_(planilha);
  const codigos=adminLinhas_(planilha,'Codigos');
  const ranking=['NAC','EXT'].map(m=>calcularRanking_(m)).flatMap(r=>r.projetos);
  const inicio=adminDataIso_(config.inicio_votacao),fim=adminDataIso_(config.fim_votacao);
  const agora=Date.now();
  const aberta=config.votacao_aberta===true&&config.modo==='DEMONSTRACAO'&&inicio!==null&&fim!==null&&(!inicio||agora>=Date.parse(inicio))&&(!fim||agora<=Date.parse(fim));
  const ativos=codigos.filter(c=>c[1]===true).length;
  return {
    configuracao:{aberta,habilitada:config.votacao_aberta===true,modo:String(config.modo),inicio,fim,minimo:5},
    totais:{projetos:ranking.length,avaliacoes:ranking.reduce((s,p)=>s+p.total_avaliacoes,0),codigos:codigos.length,ativos,classificados:ranking.filter(p=>p.elegivel).length},
    modalidades:['NAC','EXT'].map(m=>({id:m,projetos:ranking.filter(p=>p.id.startsWith(m+'-')).length,avaliacoes:ranking.filter(p=>p.id.startsWith(m+'-')).reduce((s,p)=>s+p.total_avaliacoes,0)})),
    projetos:ranking.map(p=>({id:p.id,titulo:p.titulo,modalidade:p.modalidade,total:p.total_avaliacoes,media:p.media_final,posicao:p.posicao,elegivel:p.elegivel})),
    atualizado_em:new Date().toISOString()
  };
}
function adminObterPainel() { return adminComLock_(adminResumo_); }
function adminListarCodigos() {
  return adminComLock_(p=>adminLinhas_(p,'Codigos').filter(c=>/^[a-f0-9]{64}$/.test(String(c[0]))).map(c=>({referencia:String(c[0]).slice(0,16),ativo:c[1]===true,criado_em:adminDataIso_(c[2])})));
}
function adminGerarCodigos(quantidade) {
  return adminComLock_(p=>{
    if(!Number.isInteger(quantidade)||quantidade<1||quantidade>100) throw new Error('Informe uma quantidade inteira de 1 a 100.');
    if(adminConfig_(p).config.modo!=='DEMONSTRACAO') throw new Error('Somente o modo de demonstração está disponível.');
    const aba=p.getSheetByName('Codigos');
    const existentes=new Set(adminLinhas_(p,'Codigos').map(c=>String(c[0])));
    const codigos=[],registros=[],agora=new Date();
    for(let i=0;i<quantidade;i++){
      const codigo=Utilities.getUuid().replace(/-/g,'').toUpperCase();
      const hash=gerarHash_(codigo);
      if(existentes.has(hash)) throw new Error('Colisão de código; nenhum lote foi gravado.');
      existentes.add(hash);codigos.push({codigo,referencia:hash.slice(0,16)});registros.push([hash,true,agora]);
    }
    const faixa=aba.getRange(aba.getLastRow()+1,1,registros.length,3);
    faixa.setValues(registros);SpreadsheetApp.flush();
    const gravados=faixa.getValues();
    if(!gravados.every((r,i)=>r[0]===registros[i][0]&&r[1]===true)) throw new Error('Gravação não confirmada. Verifique a lista antes de gerar outro lote.');
    // Códigos originais são retornados uma única vez à conta autorizada, nunca registrados em logs.
    return {codigos};
  });
}
function adminDesativarCodigo(referencia) {
  return adminComLock_(p=>{
    if(typeof referencia!=='string'||!/^[a-f0-9]{16}$/.test(referencia)) throw new Error('Referência inválida.');
    const aba=p.getSheetByName('Codigos'),linhas=adminLinhas_(p,'Codigos');
    const indices=linhas.map((c,i)=>String(c[0]).startsWith(referencia)?i:-1).filter(i=>i>=0);
    if(indices.length!==1) throw new Error('Código não encontrado ou referência ambígua.');
    const celula=aba.getRange(indices[0]+2,2);
    celula.setValue(false);SpreadsheetApp.flush();
    if(celula.getValue()!==false) throw new Error('Alteração não confirmada.');
    return {sucesso:true};
  });
}
function adminDefinirVotacao(abrir,confirmacao) {
  return adminComLock_(p=>{
    if(typeof abrir!=='boolean'||confirmacao!==(abrir?'ABRIR DEMONSTRACAO':'FECHAR')) throw new Error('Confirmação inválida.');
    const {aba,linhas,config}=adminConfig_(p);
    if(abrir){
      if(config.modo!=='DEMONSTRACAO') throw new Error('Somente a demonstração pode ser aberta.');
      const a=adminDataIso_(config.inicio_votacao),z=adminDataIso_(config.fim_votacao),agora=Date.now();
      if(a===null||z===null||(a&&agora<Date.parse(a))||(z&&agora>Date.parse(z))) throw new Error('Fora do período permitido. Ajuste as configurações.');
    }
    const celula=aba.getRange(linhas.findIndex(l=>l[0]==='votacao_aberta')+2,2);
    celula.setValue(abrir);SpreadsheetApp.flush();
    if(celula.getValue()!==abrir) throw new Error('Alteração não confirmada.');
    return {sucesso:true,habilitada:abrir};
  });
}
function adminSalvarPeriodo(inicio,fim) {
  return adminComLock_(p=>{
    const {aba,linhas,config}=adminConfig_(p);
    if(config.votacao_aberta===true) throw new Error('Feche a votação antes de ajustar o período.');
    const [a,z]=adminPeriodo_(inicio,fim);
    aba.getRange(linhas.findIndex(l=>l[0]==='inicio_votacao')+2,2).setValue(a);
    aba.getRange(linhas.findIndex(l=>l[0]==='fim_votacao')+2,2).setValue(z);
    SpreadsheetApp.flush();
    return {sucesso:true};
  });
}
function adminCsvCampo_(valor) {
  let s=valor===null||valor===undefined?'':String(valor);
  // Neutraliza fórmulas ao abrir o CSV em aplicativos de planilha.
  if(/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(s)) s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
function adminExportarResultados() {
  return adminComLock_(p=>{
    const r=adminResumo_(p);
    const linhas=[['id','titulo','modalidade','avaliacoes_validas','media_final','posicao','classificado'],...r.projetos.map(x=>[x.id,x.titulo,x.modalidade,x.total,x.media===null?'':x.media.toFixed(4).replace('.',','),x.posicao,x.elegivel?'SIM':'NAO'])];
    return {csv:linhas.map(l=>l.map(adminCsvCampo_).join(';')).join('\r\n')};
  });
}
