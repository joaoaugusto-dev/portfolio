// Migração única: copia tudo que está no Storage do Supabase (bucket de
// Arquivos + bucket de capas) pro R2, e reescreve as URLs de capa gravadas em
// Project/Course (elas guardam a URL inteira, ao contrário de Media, que só
// guarda a chave — ver comentário em routes/covers.js).
//
// Roda uma vez, à mão: `npm run migrate:r2` (precisa de SUPABASE_URL/
// SUPABASE_SERVICE_ROLE_KEY *e* R2_* no .env ao mesmo tempo — não apaga nada
// do Supabase, só lê de lá e escreve no R2).
require("dotenv").config();
const supabase = require("../src/supabase");
const sequelize = require("../src/db");
const { uploadObject } = require("../src/lib/r2");
const { addUsage } = require("../src/lib/storageCap");
const Project = require("../src/models/Project");
const Course = require("../src/models/Course");

const uploadsBucket = process.env.SUPABASE_BUCKET || "uploads";
const coversBucket = process.env.SUPABASE_COVERS_BUCKET || "covers";

async function migrateMediaFiles() {
  const { data: objects, error } = await supabase.storage.from(uploadsBucket).list("", { limit: 1000 });
  if (error) throw error;
  console.log(`\nArquivos (bucket "${uploadsBucket}"): ${objects.length} objeto(s)`);

  for (const obj of objects) {
    const { data, error: dlErr } = await supabase.storage.from(uploadsBucket).download(obj.name);
    if (dlErr) {
      console.error(`  ! pulei "${obj.name}": ${dlErr.message}`);
      continue;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    await uploadObject(obj.name, buffer, data.type || "application/octet-stream");
    await addUsage(buffer.length);
    console.log(`  ok  ${obj.name} (${(buffer.length / 1024).toFixed(0)}KB)`);
  }
}

// "https://xxx.supabase.co/storage/v1/object/public/covers/<chave>.webp" -> "<chave>.webp"
function coverKeyFromUrl(url) {
  const marker = `/object/public/${coversBucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

async function migrateCoversAndRewriteUrls() {
  console.log(`\nCapas (bucket "${coversBucket}") referenciadas em Project/Course:`);
  for (const [Model, field] of [
    [Project, "imageUrl"],
    [Course, "image"],
  ]) {
    const rows = await Model.findAll();
    for (const row of rows) {
      const url = row[field];
      const key = url && coverKeyFromUrl(url);
      if (!key) continue; // já é caminho local (/images/...) ou já migrado

      const { data, error } = await supabase.storage.from(coversBucket).download(key);
      if (error) {
        console.error(`  ! pulei "${key}" (${Model.name}#${row.id}): ${error.message}`);
        continue;
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      await uploadObject(`covers/${key}`, buffer, data.type || "image/webp");
      await addUsage(buffer.length);
      await row.update({ [field]: `/api/covers/${key}` });
      console.log(`  ok  ${key} (${(buffer.length / 1024).toFixed(0)}KB) -> ${Model.name}#${row.id}`);
    }
  }
}

(async () => {
  await sequelize.authenticate();
  await migrateMediaFiles();
  await migrateCoversAndRewriteUrls();
  console.log("\nMigração concluída. Confira os buckets antigos no Supabase antes de apagá-los.");
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
