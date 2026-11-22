import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {sugerirProjetos,restanteTitulo,filtrarProjetos} from '../src/catalogo.ts';
const projetos=JSON.parse(readFileSync(new URL('../src/data/projetos.json',import.meta.url),'utf8'));
const f={busca:'',modalidade:'',area:'',dia:'',ordem:'horario'};
test('prefixo Cons sugere Construindo e completa o restante',()=>{
 const s=sugerirProjetos(projetos,'Cons');
 assert.ok(s.length>0);assert.equal(s[0].id,'EXT-001');
 assert.ok(s[0].titulo.toLocaleUpperCase('pt-BR').startsWith('CONSTRUINDO'));
 assert.equal(restanteTitulo(s[0].titulo,'Cons'),s[0].titulo.slice(4));
 assert.equal(filtrarProjetos(projetos,{...f,busca:s[0].titulo})[0].id,'EXT-001');
});
test('sugestões não afetam busca por área, código e sem acentos',()=>{
 assert.deepEqual(sugerirProjetos(projetos,'c'),[]);
 assert.ok(filtrarProjetos(projetos,{...f,busca:'ext-001'}).length===1);
 assert.ok(filtrarProjetos(projetos,{...f,busca:'ciencias sociais'}).length>0);
 assert.equal(restanteTitulo('CONSTRUINDO UMA COMUNIDADE','leitura'),'');
 assert.equal(sugerirProjetos(projetos,'ZZZZZZZZ').length,0);
 assert.ok(sugerirProjetos(projetos,'leitura').length>0);
 assert.ok(sugerirProjetos(projetos,'cons',2).length<=2);
});
test('filtros recolhem e busca mostra apenas texto cinza, sem aba de sugestões',()=>{
 const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
 assert.match(app,/id="filtros" className="filters" hidden=\{!filtrosAbertos\}/);
 assert.match(app,/aria-expanded=\{filtrosAbertos\}/);
 assert.match(css,/\.filters\[hidden\]\{display:none!important\}/);
 assert.match(app,/className="search-ghost"/);
 assert.match(app,/onKeyDown=\{teclado\}/);
 assert.match(app,/e.key==='Tab'\|\|e.key==='Enter'/);
 assert.doesNotMatch(app, /search-suggestions|role="listbox"|aria-activedescendant|role="combobox"/);
 assert.doesNotMatch(css, /\.search-suggestions\{|\.search-suggestion\{/);
});
