import { proxyBinary } from "@/lib/api";

export async function GET(req, { params }) {
  const { name } = await params;
  const res = await proxyBinary(`/api/files/raw/${encodeURIComponent(name)}`, req.headers.get("range"));
  const headers = {
    "content-type": res.headers.get("content-type") || "application/octet-stream",
    "cache-control": res.headers.get("cache-control") || "public, max-age=3600",
  };
  // Sem repassar esses dois, o navegador nunca aprende que dá pra pedir só um
  // pedaço — sem Accept-Ranges ele nem tenta Range de novo, e sem Content-Range
  // ele não sabe que a resposta é só o pedaço pedido, não o arquivo inteiro.
  const acceptRanges = res.headers.get("accept-ranges");
  const contentRange = res.headers.get("content-range");
  const contentLength = res.headers.get("content-length");
  if (acceptRanges) headers["accept-ranges"] = acceptRanges;
  if (contentRange) headers["content-range"] = contentRange;
  if (contentLength) headers["content-length"] = contentLength;
  return new Response(res.body, { status: res.status, headers });
}
