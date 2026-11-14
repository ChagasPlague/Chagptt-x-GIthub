
function testarBackend_() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  const planilha = SpreadsheetApp.openById(id);

  const config = planilha.getSheetByName('Configuracao');
  const codigos = planilha.getSheetByName('Codigos');
  const avaliacoes = planilha.getSheetByName('Avaliacoes');

  const valoresConfig = config.getDataRange().getValues();

  const linhaAberta = valoresConfig.findIndex(
    r => r[0] === 'votacao_aberta'
  ) + 1;

  const modo = valoresConfig.find(
    r => r[0] === 'modo'
  );

  if (!linhaAberta || !modo || modo[1] !== 'DEMONSTRACAO') {
    throw new Error('Configuração incompatível com os testes.');
  }

  const celulaAberta = config.getRange(linhaAberta, 2);

  if (celulaAberta.getValue() !== false) {
    throw new Error('Feche a votação antes de testar.');
  }

  const codigo = Utilities.getUuid()
    .replace(/-/g, '')
    .toUpperCase();

  const hash = gerarHash_(codigo);

  const requisicoes = new Set();
  let aprovados = 0;

  function criarDados(projeto, notas = [4, 5, 4, 3]) {
    const requisicao = 'TESTE-' + Utilities.getUuid();
    requisicoes.add(requisicao);

    return {
      codigo: codigo,
      id_projeto: projeto,
      id_requisicao: requisicao,
      notas: notas
    };
  }

  function verificar(condicao, descricao) {
    if (!condicao) {
      throw new Error('FAIL: ' + descricao);
    }

    aprovados++;
    Logger.log('PASS: ' + descricao);
  }

  function verificarRejeicao(dados, mensagem, descricao) {
    let rejeitado = false;

    try {
      registrarAvaliacao(dados);
    } catch (erro) {
      rejeitado = erro.message.includes(mensagem);
    }

    verificar(rejeitado, descricao);
  }

  function contarVotosTeste() {
    return avaliacoes.getDataRange()
      .getValues()
      .slice(1)
      .filter(r => r[1] === hash)
      .length;
  }

  try {
    codigos.appendRow([hash, true, new Date()]);

    // Teste 1: votação fechada.
    verificarRejeicao(
      criarDados('NAC-001'),
      'fechada',
      'Votação fechada respeitada'
    );

    // Abre temporariamente para os testes.
    celulaAberta.setValue(true);
    SpreadsheetApp.flush();

    // Teste 2: primeiro projeto.
    const dadosA = criarDados('NAC-001');
    const respostaA = registrarAvaliacao(dadosA);

    verificar(
      respostaA.sucesso === true &&
      respostaA.nota === 4.15 &&
      respostaA.recibo === dadosA.id_requisicao,
      'Primeira avaliação aceita com recibo'
    );

    // Teste 3: mesmo código, outro projeto.
    const dadosB = criarDados('NAC-002');
    const respostaB = registrarAvaliacao(dadosB);

    verificar(
      respostaB.sucesso === true,
      'Mesmo código pode avaliar outro projeto'
    );

    // Teste 4: duplicidade.
    verificarRejeicao(
      criarDados('NAC-001'),
      'já avaliou',
      'Voto duplicado bloqueado'
    );

    // Teste 5: idempotência.
    const repeticao = registrarAvaliacao(dadosA);

    verificar(
      repeticao.sucesso === true &&
      repeticao.repeticao === true &&
      repeticao.recibo === respostaA.recibo,
      'Repetição retorna o mesmo recibo'
    );

    // Teste 6: notas inválidas.
    verificarRejeicao(
      criarDados('NAC-003', [0, 5, 4, 3]),
      'notas',
      'Notas inválidas rejeitadas'
    );

    // Teste 7: projeto inexistente.
    verificarRejeicao(
      criarDados('NAC-999'),
      'não encontrado',
      'Projeto inexistente rejeitado'
    );

    // Teste 8: código não autorizado.
    const invalido = criarDados('NAC-003');

    invalido.codigo = Utilities.getUuid()
      .replace(/-/g, '')
      .toUpperCase();

    verificarRejeicao(
      invalido,
      'não autorizado',
      'Código não autorizado rejeitado'
    );

    // Teste 9: conferir quantidade gravada.
    verificar(
      contarVotosTeste() === 2,
      'Exatamente duas avaliações gravadas'
    );

  } finally {
    // Fecha a votação novamente.
    celulaAberta.setValue(false);
    SpreadsheetApp.flush();

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      // Remove exclusivamente avaliações deste teste.
      const registros = avaliacoes.getDataRange()
        .getValues();

      for (let i = registros.length - 1; i >= 1; i--) {
        if (
          registros[i][1] === hash &&
          requisicoes.has(registros[i][0])
        ) {
          avaliacoes.deleteRow(i + 1);
        }
      }

      // Remove exclusivamente o código temporário.
      const lista = codigos.getDataRange().getValues();

      for (let i = lista.length - 1; i >= 1; i--) {
        if (lista[i][0] === hash) {
          codigos.deleteRow(i + 1);
        }
      }

      SpreadsheetApp.flush();

      Logger.log('Limpeza dos registros concluída.');
      Logger.log('Votação novamente fechada.');

    } finally {
      lock.releaseLock();
    }
  }

  Logger.log('RESULTADO: ' + aprovados + '/9 testes aprovados.');
}
