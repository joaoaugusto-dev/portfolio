"use server";
import { revalidatePath } from "next/cache";

// Server Function em vez de Route Handler: revalidatePath num Route Handler só
// marca a rota como stale pra revalidar na PRÓXIMA visita (Next 16), então com
// pouco tráfego a home ficava velha por muito tempo. Como Server Function, a
// revalidação acontece na hora da chamada.
export async function revalidateHome() {
  // "layout" em vez do padrão "page": limpa também o cache de cliente e os
  // dados abaixo do layout raiz, que é onde a home busca projetos, cursos,
  // jornada e galeria.
  revalidatePath("/", "layout");
}
