"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Reveal from "./Reveal";
import { T } from "./I18n";
import { Spot } from "./Fx";

export default function Courses({ courses = [] }) {
  const [zoomed, setZoomed] = useState(null);

  if (!courses.length) return null;

  return (
    <section id="cursos" className="scroll-mt-2 bg-surface/40 px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h2 className="section-title mb-12 text-4xl font-bold">
            <T pt="Cursos Complementares" en="Complementary Courses" />
          </h2>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-6">
          {courses.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.1} className="w-full sm:w-[calc(50%-0.75rem)]">
              <Spot className="group h-full overflow-hidden border border-white/5 bg-surface">
                {/* Miniatura clicável: abre em tela cheia, igual ao esquema do site antigo. */}
                <button
                  type="button"
                  onClick={() => setZoomed(c)}
                  aria-label="Ampliar imagem"
                  className="relative block aspect-video w-full cursor-zoom-in overflow-hidden"
                >
                  <Image
                    src={c.image}
                    alt={c.titlePt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-80" />
                  <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs text-accent-2 backdrop-blur">
                    <i className="fa-solid fa-clock text-[0.65rem]" aria-hidden />
                    <T pt={c.durationPt} en={c.durationEn} />
                  </span>
                  <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent/90 text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                    <i className="fa-solid fa-magnifying-glass-plus text-sm" aria-hidden />
                  </span>
                </button>
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-semibold">
                    <T pt={c.titlePt} en={c.titleEn} />
                  </h3>
                  <p className="mb-3 text-sm text-accent-2/80">{c.platform}</p>
                  <p className="text-base text-muted">
                    <T pt={c.descPt} en={c.descEn} />
                  </p>
                </div>
              </Spot>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl overflow-hidden rounded-2xl border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- tamanho natural da imagem, sem recorte nem grade de sizes */}
              <img
                src={zoomed.image}
                alt={zoomed.titlePt}
                className="max-h-[85vh] w-auto max-w-full object-contain"
              />
            </motion.div>
            <button
              onClick={() => setZoomed(null)}
              aria-label="Fechar"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-surface/80 text-lg text-foreground transition-colors hover:border-accent hover:text-accent-2"
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
