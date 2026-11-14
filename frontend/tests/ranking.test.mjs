import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
test('ranking usa média, amostra mínima, separação e desempate determinístico',()=>{
 const projetos=[['id','titulo','modalidade'],['NAC-001','A','NAC'],['NAC-002','B','NAC'],['NAC-003','C','NAC'],['NAC-004','D','NAC'],['EXT-001','E','EXT']];
 const votos=[['id','hash','projeto','c','cl','r','d','nota','data','status']];
 function add(id,n,nota,status='VALIDO'){for(let i=0;i<n;i++)votos.push(['req'+votos.length,'h'+i,id,nota,nota,nota,nota,nota,'',status]);}
 add('NAC-001',5,5);add('NAC-002',12,4);add('NAC-003',4,5);add('NAC-003',1,5,'INVALIDO');add('NAC-004',6,5);add('EXT-001',7,5);
 const context=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:()=>'fake'})},SpreadsheetApp:{openById:()=>({getSheetByName:n=>({getDataRange:()=>({getValues:()=>n==='Projetos'?projetos:votos})})})}});
 vm.runInContext(readFileSync(new URL('../../backend/Ranking.js',import.meta.url),'utf8'),context);
 const r=context.calcularRanking_('NAC').projetos;
 assert.deepEqual(Array.from(r,x=>x.id),['NAC-001','NAC-004','NAC-002','NAC-003']);
 assert.deepEqual(Array.from(r,x=>x.posicao),[1,2,3,null]);assert.equal(r[2].total_avaliacoes,12);assert.equal(r[3].total_avaliacoes,4);assert.equal(r[3].media_final,null);assert.equal(context.calcularRanking_('EXT').projetos.length,1);
});