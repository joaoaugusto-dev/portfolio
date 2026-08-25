import { proxyBinary } from "@/lib/api";

// Rota dinâmica no lugar do rewrite estático (next.config.mjs não faz mais esse
// destino): rewrite resolve o host no build e não troca se o principal cair.
// Isso aqui troca, igual à home.
export async function GET(_req, { params }) {
  const { key } = await params;
  const res = await proxyBinary(`/api/covers/${encodeURIComponent(key)}`);
  return new Response(res.body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/octet-stream",
      "cache-control": res.headers.get("cache-control") || "public, max-age=3600",
    },
  });
}
