export type Filtros={busca:string;modalidade:string;area:string;dia:string;ordem:'horario'|'titulo'};
type ProjetoCatalogo={id:string;titulo:string;area_tematica:string;data:string;inicio:string;local:string;modalidade:string};
export const normalizar=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const formatarData=(s:string)=>s.split('-').reverse().join('/');
export function filtrarProjetos<T extends ProjetoCatalogo>(projetos:readonly T[], f:Filtros):T[]{
 const termos=normalizar(f.busca).split(/\s+/).filter(Boolean);
 return projetos.filter(p=>{
 const texto=normalizar([p.titulo,p.area_tematica,p.local,p.id,p.modalidade].join(' '));
 return termos.every(t=>texto.includes(t))&&(!f.modalidade||p.id.startsWith(f.modalidade+'-'))&&(!f.area||p.area_tematica===f.area)&&(!f.dia||p.data===f.dia)
 }).sort((a,b)=>f.ordem==='titulo'?a.titulo.localeCompare(b.titulo,'pt-BR')||a.id.localeCompare(b.id):a.data.localeCompare(b.data)||a.inicio.localeCompare(b.inicio)||a.id.localeCompare(b.id));
}

/**
 * Sugestões exclusivas de títulos; pesquisa normal permanece livre para área, local ou ID.
 * A classificação prioriza começo do título, início de palavra e depois ocorrência interna.
 */
export function sugerirProjetos<T extends ProjetoCatalogo>(projetos:readonly T[], texto:string, limite=5):T[]{
 const q=normalizar(texto);
 if(q.length<2||q.length>120||limite<=0)return [];
 const pontuar=(titulo:string)=>{
   const t=normalizar(titulo);
   if(t===q)return -1;
   if(t.startsWith(q))return 0;
   if(t.split(/\s+/).some(p=>p.startsWith(q)))return 1;
   return t.includes(q)?2:99;
 };
 return projetos.filter(p=>pontuar(p.titulo)<99).sort((a,b)=>
   pontuar(a.titulo)-pontuar(b.titulo)||a.titulo.localeCompare(b.titulo,'pt-BR')||a.id.localeCompare(b.id)
 ).slice(0,Math.min(8,limite));
}
/** Completa apenas quando a sequência digitada corresponde literalmente ao prefixo. */
export function restanteTitulo(titulo:string, texto:string):string{
 const q=texto.trim();
 if(q.length<2||!titulo.toLocaleLowerCase('pt-BR').startsWith(q.toLocaleLowerCase('pt-BR')))return '';
 return titulo.slice(q.length);
}
