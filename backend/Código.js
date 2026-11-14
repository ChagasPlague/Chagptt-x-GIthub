function testarConexao() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  if (!id) {
    throw new Error('SPREADSHEET_ID não configurado.');
  }

  const planilha = SpreadsheetApp.openById(id);

  const abas = [
    'Projetos',
    'Codigos',
    'Avaliacoes',
    'Configuracao'
  ];

  abas.forEach(nome => {
    if (!planilha.getSheetByName(nome)) {
      throw new Error('Aba não encontrada: ' + nome);
    }
  });

  Logger.log('Conexão estabelecida com sucesso!');
  Logger.log('Planilha: ' + planilha.getName());
}
