import {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import projetos from './data/projetos.json';
import {filtrarProjetos, formatarData, type Filtros} from './catalogo';

const somenteCatalogo=import.meta.env.VITE_CATALOG_ONLY==='true';
const backend=import.meta.env.VITE_APPS_SCRIPT_URL as string|undefined;
const url=!somenteCatalogo && backend && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(backend)?backend:undefined;
const areas=[...new Set(projetos.map(p=>p.area_tematica))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
const dias=[...new Set(projetos.map(p=>p.data))].sort();
const inicial: Filtros={busca:'',modalidade:'',area:'',dia:'',ordem:'horario'};
const nacional=projetos.filter(p=>p.id.startsWith('NAC-')).length;
const extensao=projetos.length-nacional;
type Projeto=typeof projetos[number];
type Icone='search'|'arrow'|'back'|'calendar'|'pin'|'moon'|'sun'|'grid'|'clock'|'info'|'book'|'close';
const desenhos:Record<Icone,ReactNode>={
 search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
 arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>,
 back:<path d="M19 12H5m6-6-6 6 6 6"/>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
 pin:<><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
 moon:<path d="M20 15a9 9 0 0 1-11-11A9 9 0 1 0 20 15Z"/>,
 sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
 grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
 info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9h.01"/></>,
 book:<><path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14"/></>,
 close:<path d="m6 6 12 12M18 6 6 18"/>
};
function Icon({name}:{name:Icone}){return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{desenhos[name]}</svg>}
function Marca(){return <svg className="marca" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#176448"/><circle cx="20" cy="20" r="11" stroke="#c1efbe" strokeWidth="1.5" fill="none"/><ellipse cx="20" cy="20" rx="16" ry="6" transform="rotate(-40 20 20)" stroke="#effff0" strokeWidth="1.5" fill="none"/><circle cx="20" cy="20" r="3" fill="#e4f4a4"/><circle cx="30" cy="11" r="2" fill="#e4f4a4"/></svg>}
function temaInicial(){try{const t=localStorage.getItem('universo-tema');if(t==='dark'||t==='light')return t}catch{}return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
function Tag({p}:{p:Projeto}){return <span className={'tag '+(p.id.startsWith('NAC-')?'nacional':'extensao')}>{p.modalidade}</span>}
function Cartao({p}:{p:Projeto}){return <article className="project"><div className="project-top"><Tag p={p}/><span className="project-id">{p.id}</span></div><h3>{p.titulo}</h3><p className="area">{p.area_tematica}</p><div className="metadata"><span><Icon name="calendar"/>{formatarData(p.data)} · {p.inicio}–{p.fim}</span><span><Icon name="pin"/>{p.local}</span></div><a className="project-link" href={'#projeto/'+p.id} aria-label={'Ver detalhes de '+p.titulo}>Ver detalhes <Icon name="arrow"/></a></article>}
export default function App(){
 const [filtros,setFiltros]=useState<Filtros>(inicial);
 const [rota,setRota]=useState(location.hash.slice(1)||'projetos');
 const [tema,setTema]=useState(temaInicial);
 const [pagina,setPagina]=useState(1);
 const [filtrosAbertos,setFiltrosAbertos]=useState(false);
 const detalhe=projetos.find(p=>rota==='projeto/'+p.id);
 const filtrados=useMemo(()=>filtrarProjetos(projetos,filtros),[filtros]);
 const quantidade=12;
 const totalPaginas=Math.max(1,Math.ceil(filtrados.length/quantidade));
 const atual=Math.min(pagina,totalPaginas);
 const exibidos=filtrados.slice((atual-1)*quantidade,atual*quantidade);
 const ativos=Number(!!filtros.modalidade)+Number(!!filtros.area)+Number(!!filtros.dia);
 const atualizar=<K extends keyof Filtros>(chave:K,valor:Filtros[K])=>{setFiltros(f=>({...f,[chave]:valor}));setPagina(1)};
 const limpar=()=>{setFiltros(inicial);setPagina(1)};
 useEffect(()=>{const f=()=>setRota(location.hash.slice(1)||'projetos');window.addEventListener('hashchange',f);return()=>window.removeEventListener('hashchange',f)},[]);
 useEffect(()=>{document.documentElement.dataset.theme=tema;try{localStorage.setItem('universo-tema',tema)}catch{}},[tema]);
 useEffect(()=>{document.getElementById('conteudo')?.focus();window.scrollTo(0,0)},[rota]);
 const navegarPagina=(p:number)=>{setPagina(p);document.getElementById('resultados')?.focus();document.getElementById('resultados')?.scrollIntoView({block:'start'})};
 const rotas=[['projetos','Projetos'],['sobre','Sobre'],...(!somenteCatalogo?[['avaliar','Avaliar'],['ranking','Ranking']]:[])];
 return <>
 <a className="skip" href="#conteudo" onClick={e=>{e.preventDefault();document.getElementById('conteudo')?.focus()}}>Ir para o conteúdo</a>
 <header className="site-header"><div className="wrap header-inner"><a className="brand" href="#projetos"><Marca/><span><strong>Universo IF Avalia</strong><small>Ciência e extensão</small></span></a><div className="header-actions"><nav aria-label="Navegação principal">{rotas.map(([id,label])=><a key={id} href={'#'+id} aria-current={rota===id||(id==='projetos'&&!!detalhe)||rota.startsWith(id+'/')?'page':undefined}>{label}</a>)}</nav><button type="button" className="theme" onClick={()=>setTema(t=>t==='dark'?'light':'dark')} aria-label={tema==='dark'?'Ativar tema claro':'Ativar tema escuro'} title={tema==='dark'?'Tema claro':'Tema escuro'}><Icon name={tema==='dark'?'sun':'moon'}/></button></div></div></header>
 <main id="conteudo" tabIndex={-1} className="wrap main">
 {detalhe?<><a className="back" href="#projetos"><Icon name="back"/> Voltar ao catálogo</a><article className="detail panel"><div className="project-top"><Tag p={detalhe}/><span className="project-id">{detalhe.id}</span></div><h1>{detalhe.titulo}</h1><p className="area">{detalhe.area_tematica}</p><dl className="detail-grid"><div><dt><Icon name="calendar"/> Data</dt><dd>{formatarData(detalhe.data)}</dd></div><div><dt><Icon name="clock"/> Horário</dt><dd>{detalhe.inicio}–{detalhe.fim}</dd></div><div><dt><Icon name="pin"/> Local</dt><dd>{detalhe.local}</dd></div><div><dt><Icon name="book"/> Formato</dt><dd>{detalhe.formato}</dd></div></dl>{!somenteCatalogo&&<a className="btn" href={'#avaliar/'+detalhe.id}>Avaliar este projeto <Icon name="arrow"/></a>}</article></>:rota==='sobre'?<article className="detail panel"><p className="eyebrow">O PROJETO</p><h1>Sobre o Universo IF Avalia</h1><p>Um protótipo acadêmico de participação popular educativa para conhecer os trabalhos da Mostra Nacional e da Mostra de Extensão.</p><p>O catálogo reúne 46 projetos, com informações de data, horário, local e área temática. Os dados vêm da programação fornecida à equipe.</p><p>Este sistema não representa o julgamento oficial do evento. {somenteCatalogo?'Nesta versão, somente a consulta ao catálogo está disponível.':'Avaliações e ranking dependem da configuração do ambiente privado.'}</p><a className="btn" href="#projetos">Explorar projetos <Icon name="arrow"/></a><section className="share-catalog"><img src={import.meta.env.BASE_URL+'catalogo-qr.svg'} alt="QR Code para acessar o catálogo público" width="128" height="128"/><div><h2>Compartilhe o catálogo</h2><p>Use a câmera do celular para acessar o endereço público ou baixe o QR Code para materiais de divulgação.</p><a href={import.meta.env.BASE_URL+'catalogo-qr.svg'} download="universo-if-avalia-qr.svg">Baixar QR Code (SVG)</a><br/><a href="https://chagasplague.github.io/Chagptt-x-GIthub/">Abrir endereço público</a></div></section></article>:!somenteCatalogo&&(rota==='ranking'||rota==='avaliar'||rota.startsWith('avaliar/'))?<article className="detail panel"><a className="back" href="#projetos"><Icon name="back"/> Voltar ao catálogo</a><h1>{rota==='ranking'?'Ranking':'Avaliar projeto'}</h1>{rota.startsWith('avaliar/')&&<p>{projetos.find(p=>p.id===rota.split('/')[1])?.titulo}</p>}<p>As operações de avaliação e ranking utilizam o ambiente privado do Google Apps Script.</p>{url?<a className="btn" href={url+(rota==='ranking'?'?pagina=ranking':'?pagina=avaliar'+(rota.startsWith('avaliar/')?'&projeto='+encodeURIComponent(rota.split('/')[1]):''))}>Abrir {rota==='ranking'?'ranking':'avaliação'} <Icon name="arrow"/></a>:<p role="status">Integração ainda não configurada. Nenhuma avaliação será enviada.</p>}</article>:<>
 <section className="hero"><div className="hero-content"><p className="eyebrow"><span className="event-dot"/> 17 — 18 NOVEMBRO 2026</p><h1>Ideias que transformam.</h1><p>Descubra os projetos, horários e locais das mostras de ciência e extensão.</p></div><svg className="orbit" viewBox="0 0 260 200" aria-hidden="true"><g fill="none" stroke="#a9dfad" strokeWidth="1.2"><circle cx="130" cy="100" r="65"/><circle cx="130" cy="100" r="90" opacity=".35"/><ellipse cx="130" cy="100" rx="118" ry="41" transform="rotate(-36 130 100)"/><ellipse cx="130" cy="100" rx="105" ry="36" transform="rotate(40 130 100)" opacity=".5"/></g><circle cx="130" cy="100" r="17" fill="#d4ed9a"/><circle cx="207" cy="49" r="7" fill="#f1facd"/><circle cx="56" cy="53" r="4" fill="#a9dfad"/><circle cx="180" cy="155" r="5" fill="#a9dfad"/></svg></section>
 <section className="stats" aria-label="Resumo do catálogo">{[[projetos.length,'Projetos'],[nacional,'Nacional'],[extensao,'Extensão']].map(([n,t])=><div key={t}><strong>{n}</strong><span>{t}</span></div>)}</section>
 <section className="catalog" aria-labelledby="catalog-title"><div className="section-head"><div><p className="eyebrow">CATÁLOGO</p><h2 id="catalog-title">Explore os projetos</h2></div><span className="edition">Edição 2026</span></div>
 <div className="filter-panel panel"><div className="search-row"><label className="search"><span className="sr-only">Buscar projetos</span><Icon name="search"/><input type="search" placeholder="Título, área, local ou código..." value={filtros.busca} onChange={e=>atualizar('busca',e.target.value)}/></label><button className="filter-toggle" type="button" aria-expanded={filtrosAbertos} aria-controls="filtros" onClick={()=>setFiltrosAbertos(v=>!v)}>Filtros{ativos>0?' ('+ativos+')':''} <span aria-hidden="true">{filtrosAbertos?'−':'+'}</span></button></div>
 <div id="filtros" className={'filters '+(filtrosAbertos?'open':'')}><label>Modalidade<select value={filtros.modalidade} onChange={e=>atualizar('modalidade',e.target.value)}><option value="">Todas</option><option value="NAC">Mostra Nacional</option><option value="EXT">Mostra de Extensão</option></select></label><label>Área temática<select value={filtros.area} onChange={e=>atualizar('area',e.target.value)}><option value="">Todas</option>{areas.map(a=><option key={a}>{a}</option>)}</select></label><label>Data<select value={filtros.dia} onChange={e=>atualizar('dia',e.target.value)}><option value="">Todos os dias</option>{dias.map(d=><option key={d} value={d}>{formatarData(d)}</option>)}</select></label></div></div>
 <div className="results" id="resultados" tabIndex={-1}><p role="status"><strong>{filtrados.length}</strong> {filtrados.length===1?'projeto encontrado':'projetos encontrados'}</p><div className="results-actions">{(ativos>0||filtros.busca||filtros.ordem!=='horario')&&<button className="text-button" onClick={limpar}>Limpar filtros</button>}<label className="sort"><span>Ordenar</span><select value={filtros.ordem} onChange={e=>atualizar('ordem',e.target.value as Filtros['ordem'])}><option value="horario">Data e horário</option><option value="titulo">Título A–Z</option></select></label></div></div>
 {exibidos.length?<><div className="project-grid">{exibidos.map(p=><Cartao p={p} key={p.id}/>)}</div>{totalPaginas>1&&<div className="pagination" aria-label="Paginação"><button disabled={atual===1} onClick={()=>navegarPagina(atual-1)}><Icon name="back"/> Anterior</button><span>Página {atual} de {totalPaginas}</span><button disabled={atual===totalPaginas} onClick={()=>navegarPagina(atual+1)}>Próxima <Icon name="arrow"/></button></div>}</>:<div className="empty panel"><Icon name="search"/><h3>Nenhum projeto encontrado</h3><p>Tente outro termo ou altere os filtros.</p><button className="btn" onClick={limpar}>Limpar filtros</button></div>}
 </section></>}
 </main><footer><div className="wrap footer-inner"><span><Icon name="info"/> Protótipo acadêmico — não é julgamento oficial do evento.</span><a href="#sobre">Sobre o projeto</a></div></footer></>
}
