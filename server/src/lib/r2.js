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
async function downloadObject(key) {
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return { buffer: await streamToBuffer(res.Body), contentType: res.ContentType };
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

module.exports = { uploadObject, downloadObject, deleteObjects, headObject, presignPutUrl };
