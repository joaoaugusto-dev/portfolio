// O SDK do R2 (AWS S3 v3) lança exceção em erro, ao contrário do SDK do Supabase
// que devolvia {data, error}. Express 4 não pega rejeição de Promise sozinho —
// sem isso, qualquer falha (rede, credencial, timeout) num handler async vira
// unhandled rejection e derruba o processo inteiro, não só aquela requisição.
// Embrulha o handler e manda o erro pro middleware de erro em vez de deixar estourar.
function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncRoute;
