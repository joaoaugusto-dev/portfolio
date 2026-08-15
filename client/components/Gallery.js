"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Reveal from "./Reveal";
import { T, useLang } from "./I18n";
import { sortGalleryByDate } from "@/lib/gallerySort";

// Agrupa por corridas consecutivas do mesmo evento (nome + data) — o array já
// chega ordenado por data (mais recente primeiro), então itens do mesmo
// evento sempre ficam adjacentes. Fotos sem evento caem numa "seção" sem
// título, iguais a antes dessa feature.
function groupByEvent(items) {
  const groups = [];
  for (const it of items) {
    const key = it.eventName ? `${it.eventName}|${it.eventDate || ""}` : null;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(it);
    else groups.push({ key, eventName: it.eventName, eventDate: it.eventDate, items: [it] });
  }
  return groups;
}

// "YYYY-MM-DD" -> Date local, sem passar por UTC (evita cair no dia anterior
// em fusos negativos, tipo Brasil).
function formatEventDate(dateStr, lang) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function Mosaic({ items, onZoom }) {
  // Colunas nativas do CSS sempre reservam N trilhas, mesmo com poucas fotos —
  // sem isso, 1 ou 2 fotos ficam grudadas na esquerda em vez de centralizadas.
  const cols = Math.min(items.length, 3);
  const colsClass = cols >= 3 ? "columns-2 sm:columns-3" : cols === 2 ? "columns-2" : "columns-1";
  const maxWidth = cols === 1 ? "max-w-sm" : cols === 2 ? "max-w-2xl" : "max-w-3xl";

  return (
    <div className={`mx-auto ${colsClass} ${maxWidth} gap-3 sm:gap-4`}>
      {items.map((it, i) => (
        <Reveal key={it.id} delay={Math.min(i, 6) * 0.06} className="mb-3 break-inside-avoid sm:mb-4">
          <button
            type="button"
            onClick={() => onZoom(it)}
            aria-label="Ampliar imagem"
            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/5"
            style={{ aspectRatio: it.width && it.height ? `${it.width} / ${it.height}` : "4 / 3" }}
          >
            <Image
              src={it.image}
              alt={it.captionPt || ""}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {(it.captionPt || it.captionEn) && (
              <>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-1 text-left text-sm text-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <T pt={it.captionPt} en={it.captionEn} />
                </span>
              </>
            )}
          </button>
        </Reveal>
      ))}
    </div>
  );
}

export default function Gallery({ items = [] }) {
  const [zoomed, setZoomed] = useState(null);
  const { lang } = useLang();

  if (!items.length) return null;

  const groups = groupByEvent(sortGalleryByDate(items));

  return (
    <section id="galeria" className="scroll-mt-2 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="section-title mb-12 text-4xl font-bold">
            <T pt="Eventos & Apresentações" en="Events & Talks" />
          </h2>
        </Reveal>

        {/* Colunas nativas do CSS: cada foto entra na ordem, o navegador vai
            preenchendo a coluna mais curta primeiro — mosaico tipo Pinterest,
            sem grid fixo nem corte forçado, usando a proporção real de cada foto. */}
        <div className="space-y-10">
          {groups.map((g, gi) => (
            <div key={g.key || `sem-evento-${gi}`}>
              {g.eventName && (
                <Reveal>
                  <h3 className="mb-4 text-center text-lg font-semibold text-foreground">
                    {g.eventName}
                    {g.eventDate && (
                      <span className="ml-2 font-normal text-muted">— {formatEventDate(g.eventDate, lang)}</span>
                    )}
                  </h3>
                </Reveal>
              )}
              <Mosaic items={g.items} onZoom={setZoomed} />
            </div>
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
                alt={zoomed.captionPt || ""}
                className="max-h-[85vh] w-auto max-w-full object-contain"
              />
              {(zoomed.captionPt || zoomed.captionEn) && (
                <p className="bg-surface px-4 py-3 text-sm text-muted">
                  <T pt={zoomed.captionPt} en={zoomed.captionEn} />
                </p>
              )}
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
