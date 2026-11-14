// Chamado somente dentro do ScriptLock. Limite global, sem IP ou fingerprint.
function limitarTentativas_() {
  const cache = CacheService.getScriptCache();
  const janela = Math.floor(Date.now() / 60000);
  const chave = 'envios:v1:' + janela;
  const total = Number(cache.get(chave) || 0);
  if (total >= 120) {
    throw new Error('Muitas solicitações. Tente novamente em um minuto.');
  }
  cache.put(chave, String(total + 1), 120);
}
