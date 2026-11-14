
function gerarHash_(codigo) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    codigo,
    Utilities.Charset.UTF_8
  ).map(byte => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function calcularNota_(notas) {
  if (
    !Array.isArray(notas) ||
    notas.length !== 4 ||
    !notas.every(n =>
      Number.isInteger(n) && n >= 1 && n <= 5
    )
  ) {
    throw new Error('As quatro notas devem ser inteiras de 1 a 5.');
  }

  const pesos = [30, 30, 25, 15];

  return notas.reduce(
    (total, nota, i) => total + nota * pesos[i],
    0
  ) / 100;
}

function testarSeguranca_() {
  const nota = calcularNota_([4, 5, 4, 3]);

  if (nota !== 4.15) {
    throw new Error('Falha no cálculo ponderado.');
  }

  const hash = gerarHash_('EXEMPLO-SINTETICO');

  if (
    hash.length !== 64 ||
    hash !== gerarHash_('EXEMPLO-SINTETICO')
  ) {
    throw new Error('Falha na geração do hash.');
  }

  let rejeitou = false;

  try {
    calcularNota_([0, 5, 4, 3]);
  } catch (erro) {
    rejeitou = true;
  }

  if (!rejeitou) {
    throw new Error('Uma nota inválida foi aceita.');
  }

  Logger.log('PASS: cálculo ponderado = ' + nota);
  Logger.log('PASS: geração de hash SHA-256');
  Logger.log('PASS: rejeição de notas inválidas');
  Logger.log('Todos os testes iniciais passaram!');
}
