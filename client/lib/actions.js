"use server";
import { revalidatePath } from "next/cache";

// Server Function em vez de Route Handler: revalidatePath num Route Handler só
// marca a rota como stale pra revalidar na PRÓXIMA visita (Next 16), então com
// pouco tráfego a home ficava velha por muito tempo. Como Server Function, a
// revalidação acontece na hora da chamada.
export async function revalidateHome() {
  revalidatePath("/");
}
