"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function MediaImage({ src, alt }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label="Ampliar imagem"
        className="group relative block w-full cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- servido pela API, sem otimização */}
        <img src={src} alt={alt} className="w-full h-auto" onContextMenu={(e) => e.preventDefault()} />
        <span className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-accent/90 px-3 py-2 text-xs text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
          <i className="fa-solid fa-magnifying-glass-plus text-sm" aria-hidden />
          Ampliar
        </span>
      </button>

      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- tamanho natural da imagem, sem recorte nem grade de sizes */}
              <img
                src={src}
                alt={alt}
                className="max-h-[90vh] w-auto max-w-full object-contain"
                onContextMenu={(e) => e.preventDefault()}
              />
            </motion.div>
            <button
              onClick={() => setZoomed(false)}
              aria-label="Fechar"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-surface/80 text-lg text-foreground transition-colors hover:border-accent hover:text-accent-2"
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
