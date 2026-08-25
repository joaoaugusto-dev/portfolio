/** @type {import('next').NextConfig} */
// Mesmo principal do lib/api.js, mesma variável. Aqui NÃO tem reserva: rewrite é
// config estática, resolvida no build — não dá pra trocar de host quando um cai.
// Se o servidor caseiro sair do ar, as imagens quebram mas a home continua
// renderizando (os dados dela têm failover). É o lado certo pra ceder: dado é
// conteúdo, capa é enfeite.
//
// O throw é o mesmo motivo do lib/api.js: sem a variável, os destinos abaixo
// viravam `undefined/api/covers/...` e TODA imagem quebrava calada. E como o
// next.config é a primeira coisa que o build lê, o erro aparece antes de tudo.
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL não definida (next.config.mjs). Defina a URL da API — " +
      "dev: http://localhost:4000. Veja client/.env.local.example.",
  );
}

// Barra no fim removida: com ela os destinos virariam `https://host//api/covers/...`.
const API_URL = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");

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

  // /midia/<nome> é a página da mídia (app/midia/[name]); os bytes saem em
  // /midia/<nome>/arquivo, reescrito pra API. /api/covers/<chave> é a mesma
  // ideia pras capas de projeto/curso. Tudo no domínio do site — o storage (R2)
  // nunca aparece, e por ser same-origin não precisa de images.remotePatterns.
  async rewrites() {
    return [
      { source: "/midia/:name/arquivo", destination: `${API_URL}/api/files/raw/:name` },
      { source: "/midia/:name/arquivo/poster", destination: `${API_URL}/api/files/raw/:name/poster` },
      { source: "/api/covers/:key", destination: `${API_URL}/api/covers/:key` },
    ];
  },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
