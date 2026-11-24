const StorageUsage = require("../models/StorageUsage");

// O bucket mora no disco do servidor caseiro, dividido com os outros apps.
// Padrão 2GB: quando migrei, os dados do hosting ficavam no / (~4,5GB livres).
// Quando forem pro disco grande (/srv/armazenamento, ~586GB), suba STORAGE_CAP_GB
// no app — opt-in depois de olhar o `df -h`, nunca por acidente.
const CAP_BYTES = Number(process.env.STORAGE_CAP_GB || 2) * 1000 * 1000 * 1000;

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
      `Limite de armazenamento (${(CAP_BYTES / 1e9).toFixed(1)}GB) seria ultrapassado. Apague arquivos antigos antes de enviar mais.`
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
