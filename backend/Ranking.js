
function obterRanking(modalidade) {
  if (!['NAC', 'EXT'].includes(modalidade)) {
    throw new Error('Modalidade inválida.');
  }

  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  const planilha = SpreadsheetApp.openById(id);

  const projetos = planilha
    .getSheetByName('Projetos')
    .getDataRange()
    .getValues()
    .slice(1)
    .filter(p => String(p[0]).startsWith(modalidade + '-'));

  const avaliacoes = planilha
    .getSheetByName('Avaliacoes')
    .getDataRange()
    .getValues()
    .slice(1)
    .filter(a => a[9] === 'VALIDO');

  const ranking = projetos.map(p => {
    const votos = avaliacoes.filter(a => a[2] === p[0]);
    const total = votos.length;

    function media(coluna) {
      if (!total) return null;

      return votos.reduce(
        (soma, voto) => soma + Number(voto[coluna]),
        0
      ) / total;
    }

    return {
      id: p[0],
      titulo: p[1],
      modalidade: p[2],
      total_avaliacoes: total,
      media_final: total >= 5 ? media(7) : null,
      medias_criterios: total >= 5 ? {
        criatividade: media(3),
        clareza: media(4),
        relevancia: media(5),
        demonstracao: media(6)
      } : null,
      elegivel: total >= 5,
      posicao: null,
      status: total >= 5
        ? 'CLASSIFICADO'
        : 'Aguardando amostra mínima'
    };
  });

  ranking.sort((a, b) => {
    if (a.elegivel !== b.elegivel) {
      return a.elegivel ? -1 : 1;
    }

    if (a.elegivel && b.elegivel) {
      const diferenca = b.media_final - a.media_final;

      if (Math.abs(diferenca) > 0.000000001) {
        return diferenca;
      }
    }

    return a.id.localeCompare(b.id);
  });

  let posicao = 0;

  ranking.forEach(projeto => {
    if (projeto.elegivel) {
      projeto.posicao = ++posicao;
    }
  });

  return {
    modalidade: modalidade,
    atualizado_em: new Date().toISOString(),
    minimo_avaliacoes: 5,
    projetos: ranking
  };
}

function testarRanking() {
  const nacional = obterRanking('NAC');
  const extensao = obterRanking('EXT');

  if (nacional.projetos.length !== 24) {
    throw new Error('Quantidade nacional incorreta.');
  }

  if (extensao.projetos.length !== 22) {
    throw new Error('Quantidade de extensão incorreta.');
  }

  const projetos = [
    ...nacional.projetos,
    ...extensao.projetos
  ];

  const invalido = projetos.some(p =>
    p.total_avaliacoes < 5 &&
    (p.posicao !== null || p.media_final !== null)
  );

  if (invalido) {
    throw new Error('Regra de amostra mínima violada.');
  }

  Logger.log('PASS: 24 projetos nacionais.');
  Logger.log('PASS: 22 projetos de extensão.');
  Logger.log('PASS: modalidades separadas.');
  Logger.log('PASS: regra de amostra mínima.');
  Logger.log('Testes iniciais do ranking aprovados!');
}
