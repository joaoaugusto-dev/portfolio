import { proxyBinary } from "@/lib/api";

// Arquivo cru de /midia/<slug>. O Range do navegador vai junto: é o que deixa o
// <video> tocar e arrastar a barra sem baixar tudo de novo.
export async function GET(req, { params }) {
  const { name } = await params;
  return proxyBinary(`/api/files/raw/${encodeURIComponent(name)}`, req.headers.get("range"));
}
