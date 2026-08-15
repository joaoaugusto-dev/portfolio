"use client";
import { useRef } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import Reveal from "./Reveal";
import { T } from "./I18n";
import { Spot } from "./Fx";

export default function Timeline({ items = [] }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 65%"],
  });
  // Motion value puro: a trilha repinta sozinha, nenhum componente re-renderiza.
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.3 });

  if (!items.length) return null;

  return (
    <section id="jornada" className="scroll-mt-4 px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="eyebrow mb-3 text-center">
            <T pt="Linha do tempo" en="Timeline" />
          </p>
          <h2 className="section-title mb-16 text-4xl font-bold">
            <T pt="Jornada" en="Journey" />
          </h2>
        </Reveal>

        <div ref={ref} className="relative space-y-10 md:space-y-4">
          {/* Trilho: cinza por baixo, gradiente por cima crescendo com a rolagem. */}
          <div className="absolute bottom-0 left-4 top-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2">
            <motion.div
              className="absolute inset-0 origin-top bg-gradient-to-b from-accent-2 via-accent to-accent-deep"
              style={{ scaleY: reduced ? 1 : fill }}
            />
          </div>

          {items.map((item, i) => {
            const left = i % 2 === 0;
            return (
              <div
                key={item.id}
                className={`relative pl-12 md:w-1/2 md:pl-0 ${
                  left ? "md:pr-12 md:text-right" : "md:ml-auto md:pl-12"
                }`}
              >
                <motion.span
                  initial={reduced ? false : { scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  className={`absolute top-7 z-10 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-accent ring-4 ring-background ${
                    left ? "left-4 md:left-auto md:right-0 md:translate-x-1/2" : "left-4 md:left-0"
                  }`}
                >
                  {item.live && (
                    <span
                      className="absolute h-full w-full rounded-full bg-accent-2"
                      style={{ animation: "pulseRing 2.2s ease-out infinite" }}
                    />
                  )}
                </motion.span>

                <Reveal delay={0.05} y={20}>
                  <Spot className="border border-white/5 bg-surface/60 p-6">
                    <div
                      className={`mb-3 flex items-center gap-3 ${left ? "md:flex-row-reverse" : ""}`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-2">
                        <i className={item.icon} aria-hidden />
                      </span>
                      <span className="font-mono text-sm font-semibold text-accent-2">
                        <T pt={item.periodPt} en={item.periodEn} />
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold leading-snug">
                      <T pt={item.titlePt} en={item.titleEn} />
                    </h3>
                    <p className="mt-1 text-base text-muted">
                      <T pt={item.schoolPt} en={item.schoolEn} />
                    </p>
                    <p className="mt-0.5 text-sm text-muted/70">
                      <T pt={item.notePt} en={item.noteEn} />
                    </p>

                    <div className={`mt-4 flex flex-wrap gap-2 ${left ? "md:justify-end" : ""}`}>
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs text-accent-2"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Spot>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
