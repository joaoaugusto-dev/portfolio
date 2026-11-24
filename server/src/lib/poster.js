const { spawn } = require("child_process");
const dns = require("dns");
const ffmpegPath = require("ffmpeg-static");
const sharp = require("sharp");
const { objectUrl, httpHeaders } = require("./storage");

// Extrai um frame do vídeo direto do bucket, por HTTP: o ffmpeg pede por Range só
// o índice e o trecho do instante pedido — o vídeo nunca passa inteiro pela
// memória do processo (antes era baixado todo e mandado por pipe). Devolve um
// JPEG já redimensionado pelo sharp.
//
// O ffmpeg-static é binário estático e dá SIGSEGV ao resolver um nome
// (host.containers.internal, no container): o Node resolve e passa o IP.
async function grabFrame(key, atSeconds) {
  const url = new URL(objectUrl(key));
  url.hostname = (await dns.promises.lookup(url.hostname, { family: 4 })).address;
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      "-headers", httpHeaders,
      "-ss", String(atSeconds),
      "-i", url.href,
      "-frames:v", "1",
      "-f", "image2",
      "-vcodec", "mjpeg",
      "pipe:1",
    ]);
    const chunks = [];
    ff.stdout.on("data", (c) => chunks.push(c));
    ff.stderr.resume(); // log do ffmpeg descartado; sem ler, o pipe enche e trava
    ff.on("error", reject);
    ff.on("close", (code, signal) => {
      const out = Buffer.concat(chunks);
      if (out.length) resolve(out);
      else reject(new Error(`ffmpeg saiu com ${signal || `código ${code}`} sem gerar frame`));
    });
  });
}

function compressPoster(buffer) {
  return sharp(buffer).resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
}

async function extractFrameAt(key, atSeconds) {
  return compressPoster(await grabFrame(key, Math.max(0, atSeconds)));
}

async function extractPoster(key) {
  // 1s evita o primeiro frame (às vezes um flash preto); clipes bem curtos
  // caem pro frame inicial.
  const frame = await grabFrame(key, 1).catch(() => grabFrame(key, 0));
  return compressPoster(frame);
}

module.exports = { extractPoster, extractFrameAt, compressPoster };
