
function gerarCodigosDemonstracao() {
  const quantidade = 10;

  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  const planilha = SpreadsheetApp.openById(id);
  const aba = planilha.getSheetByName('Codigos');
  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const registros = [];
    const codigos = [];

    for (let i = 0; i < quantidade; i++) {
      const codigo = Utilities.getUuid()
        .replace(/-/g, '')
        .toUpperCase();

      registros.push([
        gerarHash_(codigo),
        true,
        new Date()
      ]);

      codigos.push(codigo);
    }

    const arquivo = DriveApp.createFile(
      'Codigos-DEMO-' + Utilities.getUuid() + '.txt',
      codigos.join('\n'),
      MimeType.PLAIN_TEXT
    );

    aba.getRange(
      aba.getLastRow() + 1,
      1,
      registros.length,
      3
    ).setValues(registros);

    SpreadsheetApp.flush();

    Logger.log('PASS: 10 códigos cadastrados.');
    Logger.log('Arquivo privado criado no Google Drive.');
    Logger.log('Nome do arquivo: ' + arquivo.getName());

  } finally {
    lock.releaseLock();
  }
}

