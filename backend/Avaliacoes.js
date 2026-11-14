
function registrarAvaliacao(dados) {
  if (!dados || typeof dados !== 'object') {
    throw new Error('Dados inválidos.');
  }

  const codigo = String(dados.codigo || '')
    .trim()
    .toUpperCase();

  const projeto = String(dados.id_projeto || '').trim();
  const requisicao = String(dados.id_requisicao || '').trim();

  if (!/^[A-F0-9]{32}$/.test(codigo)) {
    throw new Error('Código de avaliação inválido.');
  }

  if (!/^(NAC|EXT)-\d{3}$/.test(projeto)) {
    throw new Error('Projeto inválido.');
  }

  if (!/^[a-zA-Z0-9-]{16,64}$/.test(requisicao)) {
    throw new Error('Identificador de requisição inválido.');
  }

  const notaFinal = calcularNota_(dados.notas);
  const hash = gerarHash_(codigo);

  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  const planilha = SpreadsheetApp.openById(id);
  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const configuracao = Object.fromEntries(
      planilha.getSheetByName('Configuracao')
        .getDataRange()
        .getValues()
        .slice(1)
    );

    const projetos = planilha
      .getSheetByName('Projetos')
      .getDataRange()
      .getValues()
      .slice(1);

    const codigos = planilha
      .getSheetByName('Codigos')
      .getDataRange()
      .getValues()
      .slice(1);

    const aba = planilha.getSheetByName('Avaliacoes');

    const avaliacoes = aba
      .getDataRange()
      .getValues()
      .slice(1);

    if (!projetos.some(p => p[0] === projeto)) {
      throw new Error('Projeto não encontrado.');
    }

    const autorizado = codigos.some(c =>
      c[0] === hash && c[1] === true
    );

    if (!autorizado) {
      throw new Error('Código não autorizado.');
    }

    const anterior = avaliacoes.find(a =>
      a[0] === requisicao
    );

    if (anterior) {
      const mesmasNotas = dados.notas.every(
        (n, i) => n === anterior[i + 3]
      );

      if (
        anterior[1] === hash &&
        anterior[2] === projeto &&
        mesmasNotas &&
        anterior[9] === 'VALIDO'
      ) {
        return {
          sucesso: true,
          recibo: requisicao,
          nota: anterior[7],
          repeticao: true
        };
      }

      throw new Error('Requisição conflitante.');
    }

    if (configuracao.votacao_aberta !== true) {
      throw new Error('A votação está fechada.');
    }

    if (configuracao.modo !== 'DEMONSTRACAO') {
      throw new Error('Modo de votação indisponível.');
    }

    const agora = new Date();

    if (configuracao.inicio_votacao) {
      const inicio = new Date(configuracao.inicio_votacao);

      if (isNaN(inicio.getTime()) || agora < inicio) {
        throw new Error('Votação fora do período.');
      }
    }

    if (configuracao.fim_votacao) {
      const fim = new Date(configuracao.fim_votacao);

      if (isNaN(fim.getTime()) || agora > fim) {
        throw new Error('Votação fora do período.');
      }
    }

    const duplicado = avaliacoes.some(a =>
      a[1] === hash &&
      a[2] === projeto &&
      a[9] === 'VALIDO'
    );

    if (duplicado) {
      throw new Error('Você já avaliou este projeto.');
    }

    const registro = [
      requisicao,
      hash,
      projeto,
      ...dados.notas,
      notaFinal,
      agora,
      'VALIDO'
    ];

    const linha = aba.getLastRow() + 1;

    aba.getRange(linha, 1, 1, registro.length)
      .setValues([registro]);

    SpreadsheetApp.flush();

    const gravado = aba
      .getRange(linha, 1, 1, registro.length)
      .getValues()[0];

    const confirmado = registro.every((valor, i) =>
      valor instanceof Date
        ? gravado[i] instanceof Date &&
          gravado[i].getTime() === valor.getTime()
        : gravado[i] === valor
    );

    if (!confirmado) {
      throw new Error('Não foi possível confirmar a gravação.');
    }

    return {
      sucesso: true,
      recibo: requisicao,
      nota: notaFinal,
      repeticao: false
    };

  } finally {
    lock.releaseLock();
  }
}
