"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Reveal from "./Reveal";
import { T, useLang } from "./I18n";
import { Spot } from "./Fx";
import sanitizeHtml from "@/lib/sanitizeHtml";

const sorts = [
  ["order", "Relevância", "Relevance"],
  ["date", "Recentes", "Newest"],
];

function formatDate(value, lang) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ProjectsGrid({ projects }) {
  const [sortBy, setSortBy] = useState("order");
  const [selected, setSelected] = useState(null);
  const reduced = useReducedMotion();
  const { lang } = useLang();

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const sorted = useMemo(() => {
    const list = [...projects];
    if (sortBy === "date") list.sort((a, b) => new Date(b.projectDate) - new Date(a.projectDate));
    else list.sort((a, b) => a.order - b.order);
    return list;
  }, [projects, sortBy]);

  return (
    <section id="projetos" className="scroll-mt-2 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="section-title mb-10 text-4xl font-bold">
            <T pt="Meus Projetos" en="My Projects" />
          </h2>
        </Reveal>

        {sorted.length > 1 && (
          <Reveal delay={0.05} className="mb-12 flex justify-center">
            <div className="flex gap-1 rounded-full border border-white/10 bg-surface/60 p-1">
              {sorts.map(([value, pt, en]) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  data-on={sortBy === value}
                  className="pill px-4 py-1.5"
                >
                  {sortBy === value && (
                    <motion.span
                      layoutId="sort-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-accent shadow-lg shadow-accent/30"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <T pt={pt} en={en} />
                </button>
              ))}
            </div>
          </Reveal>
        )}

        <div className="flex flex-wrap justify-center gap-6">
          <AnimatePresence mode="popLayout">
            {sorted.map((p, i) => (
              <motion.div
                key={p.id}
                layout={!reduced}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              >
                <Spot
                  as="div"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(p);
                    }
                  }}
                  className="group flex h-full flex-col overflow-hidden border border-white/5 bg-surface cursor-pointer"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {p.imageUrl && (
                      <Image
                        src={p.imageUrl}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                      />
                    )}
                    {/* Véu que abre no hover — a imagem "acende" ao passar o mouse. */}
                    <span className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-40" />
                    {p.featured && (
                      <span className="sheen absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white shadow-lg shadow-accent/40">
                        <i className="fa-solid fa-star mr-1 text-[0.65rem]" aria-hidden />
                        <T pt="Destaque" en="Featured" />
                      </span>
                    )}
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Visit project"
                      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 transition-transform hover:scale-110"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden />
                    </a>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-1 text-lg font-semibold transition-colors group-hover:text-accent-2">
                      {p.title}
                    </h3>
                    {p.projectDate && (
                      <p className="mb-2 text-xs text-muted">{formatDate(p.projectDate, lang)}</p>
                    )}
                    <div
                      className="line-clamp-4 flex-1 text-base text-muted [&_strong]:text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.description) }}
                    />
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent">
                      <T pt="Ver mais" en="See more" />
                      <i
                        className="fa-solid fa-arrow-right text-xs transition-transform duration-300 group-hover:translate-x-1.5"
                        aria-hidden
                      />
                    </span>
                  </div>
                </Spot>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!sorted.length && (
          <p className="text-center text-muted">
            <T
              pt="Os projetos estão fora do ar por um instante. Volte já já!"
              en="Projects are momentarily unavailable. Check back soon!"
            />
          </p>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              style={{ transformOrigin: "center" }}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-surface"
              initial={reduced ? { opacity: 0 } : { scaleY: 0.006, opacity: 1 }}
              animate={reduced ? { opacity: 1 } : { scaleY: 1, opacity: 1 }}
              exit={
                reduced
                  ? { opacity: 0 }
                  : { scaleY: 0.006, opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }
              }
              transition={
                reduced
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 700, damping: 22, mass: 0.7 }
              }
            >
              <button
                onClick={() => setSelected(null)}
                aria-label="Fechar"
                className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>

              <div className="max-h-[90vh] overflow-y-auto">
                {selected.imageUrl && (
                  <div className="relative aspect-video">
                    <Image
                      src={selected.imageUrl}
                      alt={selected.title}
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-semibold">{selected.title}</h3>
                  {selected.projectDate && (
                    <p className="mt-1 text-sm text-muted">{formatDate(selected.projectDate, lang)}</p>
                  )}
                  <div
                    className="mt-4 text-base text-muted [&_strong]:text-foreground/80"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.description) }}
                  />
                  <a
                    href={selected.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/40 transition-transform hover:scale-105"
                  >
                    <T pt="Ir para o projeto" en="Go to project" />
                    <i className="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
