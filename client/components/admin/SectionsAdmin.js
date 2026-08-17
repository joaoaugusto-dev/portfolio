"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getHomeSections, api, FRESH } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import useReorder from "@/lib/useReorder";
import { Toast, useToast } from "@/components/Fx";

const sectionMeta = {
  about: { label: "Sobre Mim", icon: "fa-solid fa-user" },
  gallery: { label: "Galeria", icon: "fa-solid fa-images" },
  skills: { label: "Habilidades", icon: "fa-solid fa-layer-group" },
  projects: { label: "Projetos", icon: "fa-solid fa-diagram-project" },
  journey: { label: "Jornada", icon: "fa-solid fa-route" },
  courses: { label: "Cursos", icon: "fa-solid fa-graduation-cap" },
  contact: { label: "Contato", icon: "fa-solid fa-paper-plane" },
};

export default function SectionsAdmin({ token }) {
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState(null);
  const [toast, notify] = useToast();
  const { dirty, saving: reordering, moveUp, moveDown, save: saveOrder } = useReorder(
    sections,
    setSections,
    persistOrder,
  );

  async function refresh() {
    setLoading(true);
    try {
      setSections(await getHomeSections(FRESH));
      setError("");
    } catch (err) {
      setError(`Não consegui carregar as seções: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function persistOrder() {
    try {
      setSections(await api.reorderHomeSections(token, sections.map((s) => s.key)));
      notify("Ordem salva");
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      setError(err.message);
      refresh();
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  async function toggleVisible(s) {
    setTogglingKey(s.key);
    try {
      const updated = await api.setHomeSectionVisible(token, s.key, !s.visible);
      setSections((list) => list.map((x) => (x.key === s.key ? updated : x)));
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setTogglingKey(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Seções da home <span className="text-muted">({sections.length})</span>
        </h2>
        <AnimatePresence>
          {dirty && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={saveOrder}
              disabled={reordering}
              className="btn btn-primary sheen shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {reordering && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
              {reordering ? "Salvando..." : "Salvar ordem"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <p className="-mt-1 text-xs text-muted">
        Use as setas para mudar a ordem na home e o interruptor para esconder uma seção sem excluir o
        conteúdo dela. Menu, topo e rodapé não entram aqui.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface/70" />)}

      <AnimatePresence initial={false}>
        {sections.map((s, i) => {
          const meta = sectionMeta[s.key] || { label: s.key, icon: "fa-solid fa-square" };
          return (
            <motion.div
              key={s.key}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              className={`flex items-center gap-3 rounded-xl border border-white/5 bg-surface p-2.5 transition-opacity ${
                s.visible ? "" : "opacity-50"
              }`}
            >
              <div className="flex shrink-0 flex-col gap-0.5">
                <motion.button
                  type="button"
                  whileTap={{ y: -2 }}
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  aria-label="Mover para cima"
                  className="flex h-5 w-7 items-center justify-center rounded border border-white/10 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent-2 disabled:pointer-events-none disabled:opacity-30"
                >
                  <i className="fa-solid fa-chevron-up" aria-hidden />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ y: 2 }}
                  onClick={() => moveDown(i)}
                  disabled={i === sections.length - 1}
                  aria-label="Mover para baixo"
                  className="flex h-5 w-7 items-center justify-center rounded border border-white/10 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent-2 disabled:pointer-events-none disabled:opacity-30"
                >
                  <i className="fa-solid fa-chevron-down" aria-hidden />
                </motion.button>
              </div>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background text-accent-2">
                <i className={meta.icon} aria-hidden />
              </span>

              <p className="min-w-0 flex-1 truncate font-medium">{meta.label}</p>

              <button
                type="button"
                onClick={() => toggleVisible(s)}
                disabled={togglingKey === s.key}
                aria-pressed={s.visible}
                aria-label={s.visible ? "Esconder seção" : "Mostrar seção"}
                className="flex shrink-0 items-center gap-2 disabled:opacity-50"
              >
                <span
                  className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                    s.visible ? "bg-accent" : "bg-white/10"
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className={`h-5 w-5 rounded-full bg-white ${s.visible ? "ml-auto" : ""}`}
                  />
                </span>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
}
