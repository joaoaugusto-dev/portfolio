"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Reveal from "./Reveal";
import { T, useLang } from "./I18n";
import { sortGalleryByDate, groupByEvent, formatEventDate } from "@/lib/gallerySort";

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function Mosaic({ items, onZoom }) {
  // No máximo 2 colunas — agora que cada seção já é um evento (geralmente
  // poucas fotos), 3 colunas ficava largo demais.
  //
  // Layout "justificado" (tipo Flickr/Google Fotos) em vez de grid com caixa
  // fixa: cada linha tem sua própria altura, calculada pra soma das larguras
  // das fotos (na proporção real de cada uma) preencher exatamente a largura
  // da linha. `flex-grow` proporcional à proporção de cada foto faz a
  // distribuição; `aspect-ratio` na linha (soma das proporções) faz a altura
  // bater certinho — então a caixa de cada foto fica com a MESMA proporção da
  // foto, sem sobrar vão (grid comum) nem cortar além do que já foi definido
  // no recorte do admin (`object-cover`, que corta pra preencher). A ordem
  // continua estritamente a da lista: linha por linha, esquerda pra direita.
  const cols = Math.min(items.length, 2);
  const maxWidth = cols === 2 ? "max-w-2xl" : "max-w-sm";
  const rows = chunk(items, cols);

  return (
    <div className={`mx-auto ${maxWidth} space-y-3 sm:space-y-4`}>
      {rows.map((row, ri) => {
        const ars = row.map((it) => (it.width && it.height ? it.width / it.height : 4 / 3));
        const sumAr = ars.reduce((a, b) => a + b, 0);
        return (
          <div key={row[0].id} className="flex gap-3 sm:gap-4" style={{ aspectRatio: sumAr }}>
            {row.map((it, i) => (
              <div key={it.id} className="min-w-0" style={{ flexGrow: ars[i], flexBasis: 0 }}>
                <Reveal delay={Math.min(ri * cols + i, 6) * 0.06} className="h-full">
                  <button
                    type="button"
                    onClick={() => onZoom(it)}
                    aria-label="Ampliar imagem"
                    className="group relative block h-full w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/5"
                  >
                    <Image
                      src={it.image}
                      alt={it.captionPt || ""}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
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
              </div>
            ))}
          </div>
        );
      })}
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

        <div className="space-y-10">
          {groups.map((g, gi) => (
            <div key={g.key || `sem-evento-${gi}`}>
              {g.eventName && (
                <Reveal>
                  <h3 className="mb-4 text-center text-lg font-semibold text-foreground">
                    {/* sem tradução cadastrada, o inglês cai no nome em PT */}
                    <T pt={g.eventName} en={g.eventNameEn || g.eventName} />
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
