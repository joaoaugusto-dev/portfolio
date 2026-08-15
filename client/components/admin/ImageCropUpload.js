"use client";
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { api } from "@/lib/api";

const PRESETS = [
  ["original", "Original"],
  [1, "Quadrado"],
  [4 / 5, "Retrato"],
  [16 / 9, "Paisagem"],
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

async function cropToBlob(src, area) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

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
  const [aspect, setAspect] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const inputRef = useRef(null);

  async function pick(file) {
    if (!file) return;
    setError("");
    const url = URL.createObjectURL(file);
    const img = await loadImage(url).catch(() => null);
    const naturalAspect = img ? img.naturalWidth / img.naturalHeight : 1;
    setAspect(naturalAspect);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setPicked({ file, url, naturalAspect });
    setCropping(false);
  }

  const onCropComplete = useCallback((_, croppedAreaPixels) => setArea(croppedAreaPixels), []);

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

  async function confirmCrop() {
    if (!area) return;
    const blob = await cropToBlob(picked.url, area);
    send(blob);
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-4 backdrop-blur-sm"
          >
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black">
              <Cropper
                image={picked.url}
                crop={crop}
                zoom={zoom}
                aspect={aspect === "original" ? picked.naturalAspect : aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mx-auto mt-4 flex flex-wrap justify-center gap-2">
              {PRESETS.map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setAspect(value === "original" ? picked.naturalAspect : value)}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent-2"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mx-auto mt-3 flex w-full max-w-md items-center gap-3">
              <i className="fa-solid fa-magnifying-glass-minus text-muted" aria-hidden />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <i className="fa-solid fa-magnifying-glass-plus text-muted" aria-hidden />
            </div>

            <div className="mx-auto mt-4 flex gap-3">
              <button type="button" onClick={() => setCropping(false)} className="btn btn-ghost py-2.5 text-sm">
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmCrop}
                disabled={uploading || !area}
                className="btn btn-primary sheen py-2.5 text-sm disabled:opacity-50"
              >
                {uploading && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
                Cortar e enviar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
