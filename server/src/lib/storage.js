const { Readable } = require("stream");

// Bucket do painel de hospedagem: o painel injeta BUCKET_URL, BUCKET_NAME e
// BUCKET_TOKEN quando o bucket é ligado ao app. Não é S3 — é a API HTTP do
// painel, com Bearer. Privado: nenhum arquivo sai direto daqui pro navegador,
// tudo passa proxiado pela API (routes/files.js e covers.js). Capas ficam no
// prefixo "covers/"; mídia na raiz, com a mesma chave de antes.
const base = (process.env.BUCKET_URL || "").replace(/\/+$/, "");
const bucket = process.env.BUCKET_NAME;
const token = process.env.BUCKET_TOKEN;
if (!base || !bucket || !token) throw new Error("BUCKET_URL, BUCKET_NAME e BUCKET_TOKEN são obrigatórios");

const q = (key) => `id=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`;

function call(path, init = {}) {
  return fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "X-Requested-With": "hosting", ...init.headers },
  });
}

// `body`: Buffer, ou um stream (o req de um upload) — nesse caso `size` é
// obrigatório: a API do bucket recusa envio sem Content-Length (413 em chunked).
async function uploadObject(key, body, contentType, size = body.length) {
  const res = await call(`/api/bucket/upload?${q(key)}`, {
    method: "POST",
    headers: { "Content-Type": contentType, "Content-Length": String(size) },
    body: Buffer.isBuffer(body) ? body : Readable.toWeb(body),
    duplex: "half",
  });
  if (!res.ok) throw new Error(`bucket: envio falhou (${res.status})`);
}

// null quando o objeto não existe — quem chama trata como 404, não como erro.
// `range` (ex.: "bytes=0-1023") é repassado como está: a API do bucket responde
// 206 com Content-Range, que é o que o <video> precisa pra tocar e arrastar a barra.
async function get(key, range, method = "GET") {
  const res = await call(`/api/bucket/file?${q(key)}`, { method, headers: range ? { Range: range } : {} });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`bucket: leitura falhou (${res.status})`);
  const len = res.headers.get("content-length");
  return {
    res,
    contentType: res.headers.get("content-type"),
    contentLength: len == null ? undefined : Number(len),
    contentRange: res.headers.get("content-range") || undefined,
  };
}

async function downloadObject(key, range) {
  const obj = await get(key, range);
  if (!obj) return null;
  const { res, ...meta } = obj;
  return { ...meta, buffer: Buffer.from(await res.arrayBuffer()) };
}

// Pro /raw de vídeo/arquivo: devolve o stream pra dar pipe direto na resposta,
// sem bufferizar. Destruir o stream (cliente cancelou um seek) cancela o fetch
// do bucket junto, em vez de continuar baixando o resto do arquivo à toa.
async function streamObject(key, range) {
  const obj = await get(key, range);
  if (!obj) return null;
  const { res, ...meta } = obj;
  return { ...meta, stream: Readable.fromWeb(res.body) };
}

async function headObject(key) {
  const obj = await get(key, undefined, "HEAD");
  if (!obj) return null;
  const { res, ...meta } = obj;
  return meta;
}

// Apagar o que já não existe conta como feito (404), igual ao S3.
async function deleteObjects(keys) {
  for (const key of keys.filter(Boolean)) {
    const res = await call("/api/bucket/rm", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id: bucket, key }).toString(),
    });
    if (!res.ok && res.status !== 404) throw new Error(`bucket: remoção falhou (${res.status})`);
  }
}

module.exports = { uploadObject, downloadObject, streamObject, deleteObjects, headObject };
