"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

// Upload direto de capa (curso/projeto): o servidor comprime e converte pra webp
// e devolve a URL final — o campo abaixo só guarda o resultado.
export default function CoverUpload({ token, value, onChange }) {
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function send(file) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { url } = await api.uploadCover(token, file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-muted">Imagem</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          send(e.dataTransfer.files[0]);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
          over ? "scale-[1.01] border-accent bg-accent/5" : "border-white/15 hover:border-accent/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => send(e.target.files[0])}
        />
        <i
          className={`fa-solid ${uploading ? "fa-circle-notch fa-spin" : "fa-cloud-arrow-up"} mb-2 block text-2xl text-accent-2`}
          aria-hidden
        />
        <p className="text-sm text-muted">
          {uploading ? "Enviando..." : "Arraste uma imagem aqui ou clique para escolher"}
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- prévia da imagem já enviada */}
              <img
                src={value}
                alt=""
                className="aspect-video w-full rounded-xl border border-white/10 object-cover"
              />
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Remover imagem"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition-colors hover:bg-red-500/80"
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
