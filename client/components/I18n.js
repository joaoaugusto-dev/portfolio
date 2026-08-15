"use client";
import { createContext, useContext, useEffect, useState } from "react";

// ponytail: no dictionary file — <T pt="..." en="..." /> keeps both strings at the
// point of use, so there are no keys to keep in sync. PT renders on the server
// (SEO), EN is a client swap — same behaviour as the old static site.
const Ctx = createContext({ lang: "pt", setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLang] = useState("pt");

  useEffect(() => {
    // Só dá pra ler URL/localStorage/navigator depois de montar, senão o HTML do
    // servidor (sempre PT) não bate com o do cliente.
    const valid = (v) => (v === "pt" || v === "en" ? v : null);
    let saved = null;
    try { saved = localStorage.getItem("lang"); } catch {}
    const nav = navigator.languages?.[0] || navigator.language || "pt";
    const detected =
      valid(new URLSearchParams(location.search).get("lang")) ||
      valid(saved) ||
      (nav.toLowerCase().startsWith("pt") ? "pt" : "en");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detecção só existe no cliente
    setLang(detected);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    try { localStorage.setItem("lang", lang); } catch {}
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

export function T({ pt, en }) {
  const { lang } = useLang();
  return lang === "en" && en != null ? en : pt;
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full border border-white/10 overflow-hidden text-xs">
      {["pt", "en"].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1 transition-colors ${
            lang === l ? "bg-accent text-white" : "text-muted hover:text-accent-2"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
