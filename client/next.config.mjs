/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const nextConfig = {
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
