
function inicializarBanco() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  if (!id) {
    throw new Error('SPREADSHEET_ID não configurado.');
  }

  const planilha = SpreadsheetApp.openById(id);
  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const estrutura = {
      Projetos: [
        'id',
        'titulo',
        'modalidade',
        'area_tematica',
        'data',
        'inicio',
        'fim',
        'formato',
        'local',
        'fontes'
      ],

      Codigos: [
        'hash_codigo',
        'ativo',
        'criado_em'
      ],

      Avaliacoes: [
        'id_requisicao',
        'hash_codigo',
        'id_projeto',
        'criatividade',
        'clareza',
        'relevancia',
        'demonstracao',
        'nota_final',
        'timestamp',
        'status'
      ],

      Configuracao: [
        'chave',
        'valor'
      ]
    };

    Object.entries(estrutura).forEach(([nome, colunas]) => {
      let aba = planilha.getSheetByName(nome);

      if (!aba) {
        aba = planilha.insertSheet(nome);
      }

      const intervalo = aba.getRange(
        1, 1, 1, colunas.length
      );

      if (aba.getLastRow() === 0) {
        intervalo.setValues([colunas]);
      } else {
        const atual = intervalo.getValues()[0];

        if (JSON.stringify(atual) !== JSON.stringify(colunas)) {
          throw new Error(
            'Cabeçalho incompatível na aba: ' + nome
          );
        }
      }

      intervalo
        .setBackground('#166534')
        .setFontColor('#ffffff')
        .setFontWeight('bold');

      aba.setFrozenRows(1);
      aba.autoResizeColumns(1, colunas.length);

      Logger.log('Tabela preparada: ' + nome);
    });

    const config = planilha.getSheetByName('Configuracao');

    if (config.getLastRow() === 1) {
      const dados = [
        ['votacao_aberta', false],
        ['modo', 'DEMONSTRACAO'],
        ['minimo_ranking', 5],
        ['versao_catalogo', '1.0'],
        ['inicio_votacao', ''],
        ['fim_votacao', '']
      ];

      config.getRange(2, 1, dados.length, 2)
        .setValues(dados);
    }

    SpreadsheetApp.flush();

    Logger.log('Banco inicializado com sucesso!');
  } finally {
    lock.releaseLock();
  }
}
