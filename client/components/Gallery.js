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

// Até 4 fotos empilhadas em ângulos diferentes; as de trás ficam mais escuras e
// ganham cor no hover, quando o álbum abre em leque e a da frente sobe.
// Movimentos curtos de propósito: o leque tem que ficar dentro da margem da pilha, sem encostar no texto.
const STACK_POS = [
  "z-40 -rotate-2 group-hover:rotate-0 group-hover:scale-105 group-hover:-translate-y-1",
  "z-30 rotate-[5deg] translate-x-1 brightness-75 group-hover:rotate-[9deg] group-hover:translate-x-3 group-hover:brightness-100",
  "z-20 -rotate-[5deg] -translate-x-1 brightness-75 group-hover:-rotate-[9deg] group-hover:-translate-x-3 group-hover:brightness-100",
  "z-10 rotate-[10deg] translate-y-1 brightness-50 group-hover:rotate-[14deg] group-hover:translate-x-1 group-hover:translate-y-2 group-hover:brightness-90",
];

// Cada evento inclina a pilha de um jeito, pra a lista não parecer carimbada.
const TILTS = [-3, 2, -1, 3, -2];

function PhotoStack({ items, tilt = 0 }) {
  const shown = items.slice(0, 4);
  return (
    <span
      className="relative mx-4 h-20 w-28 shrink-0 sm:mx-5 sm:h-28 sm:w-40"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {/* fita adesiva na foto da frente */}
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 z-50 h-4 w-12 -translate-x-1/2 rotate-[-5deg] rounded-sm bg-white/25 shadow-sm backdrop-blur-sm transition-transform duration-500 group-hover:-translate-y-2"
      />
      <span
        aria-hidden
        className="absolute -inset-3 rounded-full bg-accent/30 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />
      {shown.map((it, i) => (
        <span
          key={it.id}
          className={`absolute inset-0 overflow-hidden rounded-lg shadow-xl shadow-black/70 ring-1 ring-white/30 transition-all duration-500 ease-out ${STACK_POS[i]}`}
        >
          <Image src={it.image} alt="" fill sizes="160px" className="object-cover" />
        </span>
      ))}
      {items.length > 4 && (
        <span className="absolute -bottom-2 -right-2 z-50 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white shadow-lg">
          +{items.length - 4}
        </span>
      )}
    </span>
  );
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
                    className="group relative block h-full w-full cursor-zoom-in overflow-hidden rounded-xl shadow-lg shadow-black/50 ring-1 ring-white/20 transition-shadow hover:ring-accent/70"
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
  const [open, setOpen] = useState(null);
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

        {/* Álbuns recolhidos: a home não cresce com o número de fotos, e as
            imagens de cada evento só carregam quando ele é aberto. */}
        <div className="divide-y divide-white/5">
          {groups.map((g, gi) => {
            const id = g.key || `sem-evento-${gi}`;
            const isOpen = open === id;
            return (
              <Reveal key={id}>
                <div>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : id)}
                    aria-expanded={isOpen}
                    className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl p-3 text-left transition-colors hover:bg-white/[0.03] sm:p-5`}
                  >
                    <PhotoStack items={g.items} tilt={TILTS[gi % TILTS.length]} />
                    <span className="relative min-w-0 flex-1">
                      <span className="block text-lg font-semibold sm:text-xl">
                        {g.eventName ? (
                          // sem tradução cadastrada, o inglês cai no nome em PT
                          <T pt={g.eventName} en={g.eventNameEn || g.eventName} />
                        ) : (
                          <T pt="Outras fotos" en="Other photos" />
                        )}
                      </span>
                      <span className="block text-sm text-muted">
                        {g.eventDate && `${formatEventDate(g.eventDate, lang)} · `}
                        <T
                          pt={`${g.items.length} ${g.items.length === 1 ? "foto" : "fotos"}`}
                          en={`${g.items.length} ${g.items.length === 1 ? "photo" : "photos"}`}
                        />
                      </span>
                    </span>
                    {g.eventDate && (
                      // mm/aa: âncora de leitura da linha do tempo, sempre no mesmo lugar
                      <span
                        aria-hidden
                        className="hidden select-none text-4xl font-black leading-none text-accent-2/50 transition-colors duration-500 group-hover:text-accent-2 sm:block"
                      >
                        {g.eventDate.slice(5, 7)}/{g.eventDate.slice(2, 4)}
                      </span>
                    )}
                    <i
                      className={`fa-solid fa-chevron-down shrink-0 text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-5 pt-2 sm:px-4">
                          <Mosaic items={g.items} onZoom={setZoomed} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
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
