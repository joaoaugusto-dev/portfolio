"use server";
import { revalidatePath, updateTag } from "next/cache";

// Chamada pelo admin depois de cada gravação.
//
// Server Function em vez de Route Handler: revalidatePath num Route Handler só
// marca a rota como stale pra revalidar na PRÓXIMA visita (Next 16), então com
// pouco tráfego a home ficava velha por muito tempo.
//
// As duas chamadas fazem coisas DIFERENTES e as duas são necessárias (é o padrão
// documentado em next/dist/docs .../revalidatePath.md, "Building revalidation
// utilities"):
//
// - revalidatePath limpa a rota "/" e o cache de cliente abaixo do layout raiz.
//   Sozinho ele re-renderizava a home... e remontava com os MESMOS dados velhos,
//   porque o Data Cache (os fetch de lib/api.js) não é invalidado por caminho.
//   Era isso que fazia salvar no painel parecer que não mudava nada.
//
// - updateTag derruba a tag "home" que marca esses fetch. Escolhido em vez de
//   revalidateTag de propósito: revalidateTag marca como stale e serve o velho
//   enquanto busca o novo — ou seja, você recarregaria e ainda veria o antigo.
//   updateTag EXPIRA na hora, então a primeira visita depois de salvar já espera
//   o dado novo. É o caso "read-your-own-writes" dos docs, que é exatamente o
//   seu: salvou, abriu a home, tem que estar lá.
//
// updateTag só existe dentro de Server Action — mais um motivo pra isso não ser
// um Route Handler.
export async function revalidateHome() {
  updateTag("home");
  revalidatePath("/", "layout");
}
