/** @type {import('next').NextConfig} */
// Imagens/vídeo/pdf não passam mais por rewrite estático (era resolvido no
// build, sem failover — servidor caseiro caindo quebrava toda imagem mesmo
// com a home no ar). Agora são rotas de verdade: app/api/covers/[key] e
// app/midia/[name]/arquivo(+poster), que chamam proxyBinary (lib/api.js) e
// trocam de host em runtime, igual aos dados da home.
const nextConfig = {
  // Teto de quanto tempo o CDN pode servir uma página vencida. Passado esse
  // tempo o CDN não pode mais servir o stale: ele revalida BLOQUEANDO — renderiza
  // a home e espera as 9 chamadas da API antes de responder (x-vercel-cache:
  // REVALIDATED, 3,4s de TTFB, medido). Com 120s, num site de baixo tráfego quase
  // toda visita real caía nesse caminho: era o FCP/LCP de 4s.
  //
  // O padrão do Next é 1 ANO, o que trava a home num deploy se a revalidação em
  // background falhar pra sempre. 1h é o meio-termo: no máximo uma visita por
  // hora paga o render, o resto sai do CDN em ~100ms.
  expireTime: 3600,

  turbopack: {
    root: import.meta.dirname,
  },

  // Default do Next tem 8 deviceSizes (até 3840, pensado pra 4K) e 8
  // imageSizes. Cada combinação de imagem+tamanho conta como uma
  // transformação cobrada; num portfólio de baixo tráfego isso gera
  // variantes que quase ninguém pede. Cortado pro que os `sizes` usados
  // em Hero/Gallery/ProjectsGrid/Courses realmente cobrem: mobile até
  // desktop 1920 (sem 2K/4K) e só os dois imageSizes que o ícone fixo
  // de 150px do Hero usa (1x/2x/3x DPR caem em 256 ou 384).
  images: {
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [256, 384],
  },
};

export default nextConfig;
