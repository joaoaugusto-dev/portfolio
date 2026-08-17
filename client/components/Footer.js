import { T } from "./I18n";
import { tx } from "@/lib/siteText";

export default function Footer({ texts }) {
  const name = tx(texts, "footer.name", "João Augusto de Freitas");
  const rights = tx(texts, "footer.rights", "Todos os direitos reservados.", "All rights reserved.");

  return (
    // pb extra no celular: a doca de navegação flutua por cima do rodapé.
    <footer className="border-t border-white/5 px-6 pb-28 pt-10 text-center text-sm text-muted md:pb-10">
      <a
        href="#top"
        className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted transition-all hover:-translate-y-1 hover:border-accent hover:text-accent-2"
        aria-label="Voltar ao topo"
      >
        <i className="fa-solid fa-arrow-up" aria-hidden />
      </a>
      <p>
        &copy; {new Date().getFullYear()} {name.pt}. <T pt={rights.pt} en={rights.en} />
      </p>
    </footer>
  );
}
