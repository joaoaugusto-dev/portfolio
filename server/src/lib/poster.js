const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const sharp = require("sharp");

// Extrai um frame perto do início do vídeo (1s, ou o mais cedo possível em
// clipes curtos) direto do buffer via pipe — sem tocar o disco — e devolve
// um JPEG já redimensionado pro tamanho de thumbnail com o sharp (já era
// dependência do projeto, então nada novo entra só pra isso).
function grabFrame(buffer, atSeconds) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      "-ss", String(atSeconds),
      "-i", "pipe:0",
      "-frames:v", "1",
      "-f", "image2",
      "-vcodec", "mjpeg",
      "pipe:1",
    ]);
    const chunks = [];
    ff.stdout.on("data", (c) => chunks.push(c));
    ff.on("error", reject);
    ff.on("close", (code) => {
      const out = Buffer.concat(chunks);
      if (out.length) resolve(out);
      else reject(new Error(`ffmpeg saiu com código ${code} sem gerar frame`));
    });
    ff.stdin.on("error", () => {}); // vídeo curto: ffmpeg pode fechar stdin antes do buffer terminar
    ff.stdin.write(buffer);
    ff.stdin.end();
  });
}

function compressPoster(buffer) {
  return sharp(buffer).resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
}

async function extractFrameAt(buffer, atSeconds) {
  const frame = await grabFrame(buffer, Math.max(0, atSeconds));
  return compressPoster(frame);
}

async function extractPoster(buffer) {
  // 1s evita o primeiro frame (às vezes um flash preto); clipes bem curtos
  // caem pro frame inicial.
  const frame = await grabFrame(buffer, 1).catch(() => grabFrame(buffer, 0));
  return compressPoster(frame);
}

module.exports = { extractPoster, extractFrameAt, compressPoster };
