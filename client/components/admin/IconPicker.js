"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import ICONS from "./iconList";

// Aceita "fa-solid fa-graduation-cap" (formato salvo) — pega o último token
// (funciona pra qualquer estilo: fa-solid, fa-brands, fa-regular).
const slugOf = (value) => value?.trim().split(/\s+/).pop()?.replace("fa-", "") || "";

export default function IconPicker({ value, onChange, list = ICONS }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Portal pro <body>: o botão vive dentro do form ".spot", que ganha
  // `transform` no hover (Fx.js) — isso vira containing block de `fixed` e
  // fazia o modal pular de centralizado pra colado na lateral do form.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag, precisa rodar só client-side
    setMounted(true);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(([slug, keywords]) => slug.includes(q) || keywords.includes(q));
  }, [query, list]);

  function pick(slug, prefix = "fa-solid") {
    onChange(`${prefix} fa-${slug}`);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-background px-3 py-2 text-left outline-none transition-all duration-300 hover:border-accent/50 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-lg text-accent-2">
          <i className={value || "fa-solid fa-icons"} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-muted">{slugOf(value) || "Escolher ícone"}</span>
        <i className="fa-solid fa-chevron-down shrink-0 text-xs text-muted" aria-hidden />
      </button>

      {mounted && createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-surface p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass text-muted" aria-hidden />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar ícone (ex: código, formatura, foguete)"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="text-muted transition-colors hover:text-foreground"
                >
                  <i className="fa-solid fa-xmark" aria-hidden />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5">
                {results.map(([slug, , prefix = "fa-solid"]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => pick(slug, prefix)}
                    title={slug}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:border-accent hover:text-accent-2 ${
                      slugOf(value) === slug ? "border-accent bg-accent/10 text-accent-2" : "border-white/5 text-muted"
                    }`}
                  >
                    <i className={`${prefix} fa-${slug} text-xl`} aria-hidden />
                    <span className="w-full truncate text-[0.65rem] leading-tight">{slug}</span>
                  </button>
                ))}
                {!results.length && (
                  <p className="col-span-full py-6 text-center text-sm text-muted">Nenhum ícone encontrado.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
}
