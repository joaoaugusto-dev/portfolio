import { proxyBinary } from "@/lib/api";

export async function GET(_req, { params }) {
  const { name } = await params;
  return proxyBinary(`/api/files/raw/${encodeURIComponent(name)}/poster`);
}
