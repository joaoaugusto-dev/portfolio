"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Reveal from "./Reveal";
import { T } from "./I18n";
import { Spot } from "./Fx";
import sanitizeHtml from "@/lib/sanitizeHtml";

const sorts = [
  ["order", "Relevância", "Relevance"],
  ["date", "Recentes", "Newest"],
];

export default function ProjectsGrid({ projects }) {
  const [sortBy, setSortBy] = useState("order");
  const reduced = useReducedMotion();

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
                  as="a"
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col overflow-hidden border border-white/5 bg-surface"
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
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-accent-2">
                      {p.title}
                    </h3>
                    <div
                      className="line-clamp-4 flex-1 text-base text-muted [&_strong]:text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.description) }}
                    />
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent">
                      <T pt="Ir para o projeto" en="Go to project" />
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
    </section>
  );
}
