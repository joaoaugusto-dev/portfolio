"use client";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Reveal from "./Reveal";
import { T } from "./I18n";
import { Spot } from "./Fx";
import { skillCats } from "@/lib/skillCats";

export default function Skills({ tech = [], soft = [] }) {
  const [cat, setCat] = useState("all");
  const reduced = useReducedMotion();
  const list = cat === "all" ? tech : tech.filter((t) => t.cat === cat);

  return (
    <section id="skills" className="scroll-mt-2 bg-surface/30 px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h2 className="section-title mb-10 text-4xl font-bold">
            <T pt="Habilidades" en="Skills" />
          </h2>
        </Reveal>

        <Reveal delay={0.05} className="mb-8 flex flex-wrap justify-center gap-2">
          {skillCats.map(([value, pt, en]) => (
            <button key={value} onClick={() => setCat(value)} data-on={cat === value} className="pill">
              {cat === value && (
                <motion.span
                  layoutId="skill-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-accent shadow-lg shadow-accent/30"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <T pt={pt} en={en} />
            </button>
          ))}
        </Reveal>

        <motion.div layout className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {list.map((t) => (
              <motion.div
                key={t.id}
                layout={!reduced}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]"
              >
                <Spot className="group h-full border border-white/5 bg-surface p-4 text-center sm:p-5">
                  <i
                    className={`${t.icon} mb-3 block text-4xl text-accent-2 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110 sm:text-5xl`}
                    aria-hidden
                  />
                  <h4 className="text-sm font-medium sm:text-base">{t.name}</h4>
                  <p className="mt-1 text-xs leading-snug text-muted">
                    <T pt={t.pt} en={t.en} />
                  </p>
                </Spot>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <Reveal className="mt-16">
          <h3 className="eyebrow mb-6 text-center">
            <T pt="Habilidades Interpessoais" en="Soft Skills" />
          </h3>
          {/* Estático e centralizado: nada rolando pra atrapalhar a leitura. */}
          <div className="flex flex-wrap justify-center gap-3">
            {soft.map((s) => (
              <span
                key={s.id}
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-surface-2 px-5 py-2.5 text-sm font-medium text-foreground/90 shadow-sm transition-colors hover:border-accent/60"
              >
                <i className={`${s.icon} text-accent-2`} aria-hidden />
                <T pt={s.pt} en={s.en} />
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
