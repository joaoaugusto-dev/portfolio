import { proxyBinary } from "@/lib/api";

// Capa no domínio do site, proxiada da API (ver proxyBinary).
export async function GET(_req, { params }) {
  const { key } = await params;
  return proxyBinary(`/api/covers/${encodeURIComponent(key)}`);
}
