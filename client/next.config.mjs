/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SUPABASE_HOSTNAME = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  // /midia/<nome> é a página da mídia (app/midia/[name]); os bytes saem em
  // /midia/<nome>/arquivo, reescrito pra API. Tudo no domínio do site — o
  // Supabase nunca aparece, e por ser same-origin não precisa de remotePatterns.
  async rewrites() {
    return [{ source: "/midia/:name/arquivo", destination: `${API_URL}/api/files/raw/:name` }];
  },
  // Capas de curso/projeto (bucket "covers") saem direto da Supabase Storage,
  // sem passar pelo rewrite acima — next/image precisa do host liberado.
  images: {
    remotePatterns: SUPABASE_HOSTNAME
      ? [{ protocol: "https", hostname: SUPABASE_HOSTNAME, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
