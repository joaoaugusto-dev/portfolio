/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const nextConfig = {
  // Teto de quanto tempo o CDN pode servir uma página vencida. O padrão do Next
  // é 1 ANO: se a revalidação em background falhar (função com erro, timeout,
  // backoff da Vercel), a home congela e só volta a mudar num deploy novo — foi
  // exatamente o que aconteceu aqui. Com 120s, passado esse tempo o CDN é
  // obrigado a renderizar na hora, então nada fica velho por mais que isso.
  expireTime: 120,

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
