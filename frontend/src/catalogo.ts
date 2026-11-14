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
