"use client";
import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import { T, useLang } from "./I18n";
import { Spot } from "./Fx";
import { formatEventDate } from "@/lib/gallerySort";

const VISIBLE = 3;

export default function News({ items = [] }) {
  const [all, setAll] = useState(false);
  const { lang } = useLang();

  if (!items.length) return null;
  const shown = all ? items : items.slice(0, VISIBLE);

  return (
    <section id="midia" className="scroll-mt-2 bg-surface/40 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="section-title mb-12 text-4xl font-bold">
            <T pt="Na Mídia" en="In the Press" />
          </h2>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-6">
          {shown.map((n, i) => (
            <Reveal key={n.id} delay={(i % VISIBLE) * 0.1} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
              <Spot className="group h-full overflow-hidden border border-white/5 bg-surface">
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col">
                  {n.image && (
                    <span className="relative block aspect-video w-full overflow-hidden">
                      <Image
                        src={n.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </span>
                  )}
                  <span className="flex flex-1 flex-col p-5">
                    <span className="mb-2 text-sm text-accent-2/80">
                      {n.outlet}
                      {n.date && <span className="text-muted"> · {formatEventDate(n.date, lang)}</span>}
                    </span>
                    <span className="mb-4 text-lg font-semibold leading-snug">
                      <T pt={n.titlePt} en={n.titleEn || n.titlePt} />
                    </span>
                    <span className="mt-auto text-sm text-accent-2">
                      <T pt="Ler matéria" en="Read article" />{" "}
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden />
                    </span>
                  </span>
                </a>
              </Spot>
            </Reveal>
          ))}
        </div>

        {items.length > VISIBLE && (
          <div className="mt-10 text-center">
            <button type="button" onClick={() => setAll(!all)} className="btn btn-ghost px-5 py-2 text-sm">
              {all ? <T pt="Mostrar menos" en="Show less" /> : <T pt={`Ver todas (${items.length})`} en={`See all (${items.length})`} />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
