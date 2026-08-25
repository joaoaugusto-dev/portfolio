import { proxyBinary } from "@/lib/api";

export async function GET(_req, { params }) {
  const { name } = await params;
  const res = await proxyBinary(`/api/files/raw/${encodeURIComponent(name)}`);
  return new Response(res.body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/octet-stream",
      "cache-control": res.headers.get("cache-control") || "public, max-age=3600",
    },
  });
}
