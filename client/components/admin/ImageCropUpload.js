"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import CropModal, { loadImage } from "@/components/admin/CropModal";

// Upload de foto da galeria. Por padrão sobe a imagem inteira, sem cortar — a
// colagem do site já se vira com a proporção original de cada foto (ver
// Gallery.js). O corte aqui é só pra quem QUER recompor o enquadramento antes
// de enviar; nunca é obrigatório.
export default function ImageCropUpload({ token, value, onChange }) {
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(null); // { file, url, naturalAspect }
  const [cropping, setCropping] = useState(false);
  const inputRef = useRef(null);

  async function pick(file) {
    if (!file) return;
    setError("");
    const url = URL.createObjectURL(file);
    const img = await loadImage(url).catch(() => null);
    setPicked({ file, url, naturalAspect: img ? img.naturalWidth / img.naturalHeight : 1 });
    setCropping(false);
  }

  function cancelPicked() {
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked(null);
    setCropping(false);
  }

  async function send(blob) {
    setUploading(true);
    setError("");
    try {
      const { url, width, height } = await api.uploadCover(token, blob);
      onChange(url, { width, height });
      cancelPicked();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function useOriginal() {
    send(picked.file);
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-muted">Foto</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files[0]);
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
          onChange={(e) => pick(e.target.files[0])}
        />
        <i
          className={`fa-solid ${uploading ? "fa-circle-notch fa-spin" : "fa-cloud-arrow-up"} mb-2 block text-2xl text-accent-2`}
          aria-hidden
        />
        <p className="text-sm text-muted">
          {uploading ? "Enviando..." : "Arraste uma foto aqui ou clique para escolher"}
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <AnimatePresence>
        {value && !picked && (
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
                className="max-h-64 w-full rounded-xl border border-white/10 object-contain bg-background"
              />
              <button
                type="button"
                onClick={() => onChange("", {})}
                aria-label="Remover imagem"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition-colors hover:bg-red-500/80"
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prévia da foto recém-escolhida, ainda não enviada: usar como está ou cortar. */}
      <AnimatePresence>
        {picked && !cropping && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- prévia local, ainda não enviada */}
              <img
                src={picked.url}
                alt=""
                className="max-h-64 w-full rounded-xl border border-white/10 object-contain bg-background"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={useOriginal}
                  disabled={uploading}
                  className="btn btn-primary sheen flex-1 py-2 text-sm disabled:opacity-50"
                >
                  {uploading && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
                  Usar assim, sem cortar
                </button>
                <button
                  type="button"
                  onClick={() => setCropping(true)}
                  disabled={uploading}
                  className="btn btn-ghost py-2 text-sm"
                >
                  <i className="fa-solid fa-crop-simple" aria-hidden />
                </button>
                <button type="button" onClick={cancelPicked} className="btn btn-ghost py-2 text-sm">
                  <i className="fa-solid fa-xmark" aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {picked && cropping && (
          <CropModal
            src={picked.url}
            naturalAspect={picked.naturalAspect}
            busy={uploading}
            confirmLabel="Cortar e enviar"
            onCancel={() => setCropping(false)}
            onConfirm={send}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
