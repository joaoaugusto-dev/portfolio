const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Cloudflare R2: API compatível com S3, sem taxa de egress e sem o teto de 50MB
// por objeto que o Storage do Supabase trava no plano free. Um bucket só, com
// prefixo "covers/" pra separar capas dos arquivos de mídia (que ficam na raiz,
// mesma chave que tinham no Supabase — importante pra migração ser 1:1).
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET || "portfolio";

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function uploadObject(key, body, contentType) {
  await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

// null quando o objeto não existe — quem chama trata como 404, não como erro.
// `range` (ex.: "bytes=0-1023") pede só um pedaço — sem isso, TODO seek num
// <video> (tocar, arrastar a barra, escolher frame) baixava o arquivo inteiro
// de novo a cada vez, tanto do R2 quanto do navegador pro servidor.
async function downloadObject(key, range) {
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key, ...(range ? { Range: range } : {}) }));
    return {
      buffer: await streamToBuffer(res.Body),
      contentType: res.ContentType,
      contentLength: res.ContentLength,
      contentRange: res.ContentRange,
    };
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

// Pro /raw de vídeo/arquivo: NÃO baixa tudo pra memória antes de responder — só
// devolve o stream, pra dar pipe direto na resposta HTTP. Isso importa porque o
// navegador pede ranges "abertos" tipo bytes=0-fim-do-arquivo (comum ao carregar
// um <video>) e cancela na hora que você arrasta a barra pra outro ponto; com
// buffer, o servidor já tinha baixado o resto inteiro do R2 antes de descartar —
// com stream, o cancelamento do lado do cliente corta o download do R2 também.
async function streamObject(key, range) {
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key, ...(range ? { Range: range } : {}) }));
    return {
      stream: res.Body,
      contentType: res.ContentType,
      contentLength: res.ContentLength,
      contentRange: res.ContentRange,
    };
  } catch (err) {
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

async function deleteObjects(keys) {
  const Objects = keys.filter(Boolean).map((Key) => ({ Key }));
  if (!Objects.length) return;
  await r2.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects } }));
}

async function headObject(key) {
  try {
    return await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

// URL assinada de PUT: o navegador sobe o arquivo direto pro R2, sem passar pela
// memória do servidor — é o que permite arquivo grande sem estourar o Render.
function presignPutUrl(key, contentType, expiresIn = 900) {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(r2, cmd, { expiresIn });
}

module.exports = { uploadObject, downloadObject, streamObject, deleteObjects, headObject, presignPutUrl };
