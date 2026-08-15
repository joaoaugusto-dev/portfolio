import { revalidatePath } from "next/cache";

// ponytail: sem segredo — pior caso é alguém forçar um revalidate de graça, custo baixo.
export async function POST() {
  revalidatePath("/");
  return Response.json({ revalidated: true });
}
