const StorageUsage = require("../models/StorageUsage");

// Cloudflare anuncia 10GB grátis no R2; travo em 9GB (decimal) de margem — cobre
// a diferença entre GB decimal/binário e qualquer coisa que eu não tenha somado
// certinho (ex.: um upload que falhou no meio e deixou lixo). Passar disso é opt-in
// (mudar essa constante), nunca por acidente.
const CAP_BYTES = 9 * 1000 * 1000 * 1000;

async function getRow() {
  const [row] = await StorageUsage.findOrCreate({ where: { id: 1 }, defaults: { bytesUsed: 0 } });
  return row;
}

async function currentUsage() {
  return Number((await getRow()).bytesUsed);
}

// Chame ANTES de gerar qualquer URL de upload — barra a operação de vez, não só
// avisa depois. `err.status = 507` (Insufficient Storage) pra rota devolver o
// código certo sem cada chamador ter que saber o número de cor.
async function ensureRoom(extraBytes) {
  const used = await currentUsage();
  if (used + extraBytes > CAP_BYTES) {
    const err = new Error(
      `Limite de armazenamento (${(CAP_BYTES / 1e9).toFixed(1)}GB de 10GB grátis do R2) seria ultrapassado. Apague arquivos antigos antes de enviar mais.`
    );
    err.status = 507;
    throw err;
  }
}

async function addUsage(bytes) {
  if (bytes > 0) await (await getRow()).increment("bytesUsed", { by: bytes });
}

// Não deixa o contador ir negativo por causa de alguma diferença de contagem —
// prefiro superestimar o uso (trava um pouco cedo) a subestimar (deixa passar).
async function removeUsage(bytes) {
  if (bytes <= 0) return;
  const row = await getRow();
  await row.decrement("bytesUsed", { by: Math.min(bytes, Number(row.bytesUsed)) });
}

module.exports = { CAP_BYTES, currentUsage, ensureRoom, addUsage, removeUsage };
