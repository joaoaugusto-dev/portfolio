"use client";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

const PRESETS = [
  ["original", "Original"],
  [1, "Quadrado"],
  [4 / 5, "Retrato"],
  [16 / 9, "Paisagem"],
];

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

export async function cropToBlob(src, area) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

// Tela cheia de recorte, usada tanto no envio de uma foto só
// (ImageCropUpload) quanto no envio em massa da galeria (GalleryAdmin).
// Devolve o Blob recortado em onConfirm; quem chama decide o que fazer com ele.
export default function CropModal({ src, naturalAspect = 1, busy = false, confirmLabel = "Cortar", onCancel, onConfirm }) {
  const [aspect, setAspect] = useState(naturalAspect);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => setArea(croppedAreaPixels), []);

  async function confirm() {
    if (!area) return;
    onConfirm(await cropToBlob(src, area));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-4 backdrop-blur-sm"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect === "original" ? naturalAspect : aspect}
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
            onClick={() => setAspect(value === "original" ? naturalAspect : value)}
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
        <button type="button" onClick={onCancel} className="btn btn-ghost py-2.5 text-sm">
          Voltar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={busy || !area}
          className="btn btn-primary sheen py-2.5 text-sm disabled:opacity-50"
        >
          {busy && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
          {confirmLabel}
        </button>
      </div>
    </motion.div>
  );
}
