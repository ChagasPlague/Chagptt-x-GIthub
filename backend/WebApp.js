
function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Universo IF Avalia')
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1'
    );
}

function obterProjetos() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  const planilha = SpreadsheetApp.openById(id);

  const registros = planilha
    .getSheetByName('Projetos')
    .getDataRange()
    .getDisplayValues()
    .slice(1);

  return registros.map(p => ({
    id: p[0],
    titulo: p[1],
    modalidade: p[2],
    area_tematica: p[3],
    data: p[4],
    inicio: p[5],
    fim: p[6],
    formato: p[7],
    local: p[8]
  }));
}

function obterStatusVotacao() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  const planilha = SpreadsheetApp.openById(id);

  const config = Object.fromEntries(
    planilha.getSheetByName('Configuracao')
      .getDataRange()
      .getValues()
      .slice(1)
  );

  const agora = Date.now();

  const inicio = config.inicio_votacao
    ? new Date(config.inicio_votacao).getTime()
    : -Infinity;

  const fim = config.fim_votacao
    ? new Date(config.fim_votacao).getTime()
    : Infinity;

  return {
    aberta: config.votacao_aberta === true &&
      config.modo === 'DEMONSTRACAO' &&
      agora >= inicio &&
      agora <= fim,
    modo: String(config.modo),
    versao: String(config.versao_catalogo)
  };
}

function testarWebApp_() {
  const projetos = obterProjetos();
  const status = obterStatusVotacao();

  if (projetos.length !== 46) {
    throw new Error('Catálogo incompleto.');
  }

  if (status.aberta) {
    throw new Error('A votação deveria estar fechada.');
  }

  Logger.log('PASS: 46 projetos disponíveis.');
  Logger.log('PASS: leitura das configurações.');
  Logger.log('PASS: votação fechada.');
  Logger.log('Controlador WebApp funcionando!');
}


function testarInterface_() {
  const html = doGet();

  if (!html.getContent().includes('Universo IF Avalia')) {
    throw new Error('Interface não encontrada.');
  }

  Logger.log('PASS: arquivo Index.html carregado.');
  Logger.log('PASS: interface WebApp renderizada.');
}