// Confere o bucket de ponta a ponta: envio em stream, HEAD, Range, leitura, 404 e remoção.
//   node scripts/check-storage.js   (com BUCKET_URL/NAME/TOKEN no ambiente — ex.: dentro do container)
require("dotenv").config();
const assert = require("assert");
const { Readable } = require("stream");
const s = require("../src/lib/storage");

(async () => {
  const key = "selftest/v.mp4";
  const data = Buffer.from("0123456789".repeat(1000));
  await s.uploadObject(key, Readable.from([data.subarray(0, 4000), data.subarray(4000)]), "video/mp4", data.length);
  assert.equal((await s.headObject(key)).contentLength, data.length);
  const read = async (range) => {
    const obj = await s.streamObject(key, range);
    const chunks = [];
    for await (const c of obj.stream) chunks.push(c);
    return { ...obj, body: Buffer.concat(chunks) };
  };
  const part = await read("bytes=10-19");
  assert.equal(part.body.toString(), "0123456789");
  assert.equal(part.contentRange, "bytes 10-19/10000");
  assert.equal((await read()).body.length, data.length);
  assert.equal(await s.streamObject("selftest/nada.jpg"), null);
  await s.deleteObjects(["selftest"]);
  assert.equal(await s.headObject(key), null);
  console.log("storage OK");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
