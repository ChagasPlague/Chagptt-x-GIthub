import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read = name => readFileSync(new URL('../../backend/'+name+'.js',import.meta.url),'utf8');
test('nota ponderada e validação no servidor',()=>{
 const c=vm.createContext({});
 vm.runInContext(read('Security'),c);
 assert.equal(c.calcularNota_([4,5,4,3]),4.15);
 for(const n of [[0,5,4,3],[1.5,2,3,4],[1,2,3],['1',2,3,4],[6,2,3,4]]) assert.throws(()=>c.calcularNota_(n));
});
test('limite global por janela com cache simulado',()=>{
 const store=new Map();
 const c=vm.createContext({CacheService:{getScriptCache:()=>({get:k=>store.get(k),put:(k,v)=>store.set(k,v)})},Date:{now:()=>60000}});
 vm.runInContext(read('Limites'),c);
 for(let i=0;i<120;i++) c.limitarTentativas_();
 assert.throws(()=>c.limitarTentativas_(),/Muitas solicitações/);
});
test('somente funções públicas esperadas',()=>{
 const names=['Avaliacoes','Catalogo','Codigos','Código','Database','Security','Testes','Ranking','WebApp','Limites'];
 const publics=names.flatMap(n=>[...read(n).matchAll(/^function\s+(\w+)\s*\(/gm)].map(m=>m[1])).filter(n=>!n.endsWith('_')).sort();
 assert.deepEqual(publics,['doGet','obterProjetos','obterRanking','obterStatusVotacao','registrarAvaliacao'].sort());
});
