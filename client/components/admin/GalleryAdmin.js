"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGallery, api } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import useDragReorder from "@/lib/useDragReorder";
import { Spot, Toast, useToast } from "@/components/Fx";
import ImageCropUpload from "@/components/admin/ImageCropUpload";

const empty = { image: "", width: null, height: null, captionPt: "", captionEn: "", eventName: "", eventDate: "" };

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

export default function GalleryAdmin({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, notify] = useToast();
  const { dragging, start, move, end } = useDragReorder(setItems, saveOrder);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await getGallery());
      setError("");
    } catch (err) {
      setError(`Não consegui carregar a galeria: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function saveOrder() {
    try {
      setItems(await api.reorderGalleryItems(token, items.map((it) => it.id)));
      notify("Ordem salva");
      revalidateHome().catch(() => notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"));
    } catch (err) {
      setError(err.message);
      refresh();
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  function startEdit(it) {
    setEditingId(it.id);
    setForm({ ...empty, ...it, eventDate: it.eventDate?.slice(0, 10) || "" });
    scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.image) {
      setError("Escolha uma foto antes de salvar.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (editingId) await api.updateGalleryItem(token, editingId, form);
      else await api.createGalleryItem(token, { ...form, order: items.length });
      notify(editingId ? "Foto atualizada" : "Foto adicionada");
      resetForm();
      refresh();
      revalidateHome().catch(() => notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"));
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta foto?")) return;
    try {
      await api.deleteGalleryItem(token, id);
      notify("Foto excluída");
      revalidateHome().catch(() => notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"));
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
    refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <Spot
        as="form"
        onSubmit={handleSubmit}
        className="h-fit space-y-4 border border-white/5 bg-surface p-5 sm:p-6 lg:sticky lg:top-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <i className={`fa-solid ${editingId ? "fa-pen" : "fa-plus"} text-accent-2`} aria-hidden />
          {editingId ? "Editar foto" : "Nova foto"}
        </h2>

        <ImageCropUpload
          token={token}
          value={form.image}
          onChange={(image, meta = {}) => setForm({ ...form, image, width: meta.width ?? null, height: meta.height ?? null })}
        />
        <p className="-mt-2 text-xs text-muted">
          A colagem no site se encaixa sozinha pela proporção de cada foto — não precisa cortar pra
          um formato fixo.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Evento / projeto</label>
            <input
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
              placeholder="Opcional — agrupa fotos do mesmo evento na home"
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Data do evento</label>
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              className={field}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Legenda (PT)</label>
            <input
              value={form.captionPt}
              onChange={(e) => setForm({ ...form, captionPt: e.target.value })}
              placeholder="Opcional"
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Legenda (EN)</label>
            <input
              value={form.captionEn}
              onChange={(e) => setForm({ ...form, captionEn: e.target.value })}
              placeholder="Opcional"
              className={field}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary sheen flex-1 py-2.5 text-sm disabled:opacity-50"
          >
            {saving && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
            {editingId ? "Salvar alterações" : "Adicionar foto"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-ghost py-2.5 text-sm">
              Cancelar
            </button>
          )}
        </div>
      </Spot>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Galeria <span className="text-muted">({items.length})</span>
        </h2>
        <p className="-mt-1 text-xs text-muted">
          Arraste pelo <i className="fa-solid fa-grip-vertical" aria-hidden /> para mudar a posição na
          seção do site. Fotos consecutivas com o mesmo evento viram uma seção com título na home.
        </p>

        {loading &&
          [0, 1].map((i) => <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-surface/70" />)}

        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              layout={dragging === null}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              data-drag-index={i}
              className={`flex items-center gap-3 rounded-xl border bg-surface p-2.5 transition-colors ${
                dragging === i ? "border-accent shadow-lg shadow-accent/20" : "border-white/5"
              }`}
            >
              <span
                onPointerDown={(e) => start(e, i)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                title="Arraste para reordenar"
                className="touch-none cursor-grab px-1 text-muted transition-colors hover:text-accent-2 active:cursor-grabbing"
              >
                <i className="fa-solid fa-grip-vertical" aria-hidden />
              </span>

              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura da API, sem otimização
                <img src={it.image} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                  <i className="fa-solid fa-image" aria-hidden />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{it.eventName || "Sem evento"}</p>
                <p className="text-xs text-muted">
                  {it.eventDate?.slice(0, 10) || "sem data"} · posição {i + 1}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => startEdit(it)}
                  aria-label="Editar"
                  className="h-9 w-9 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i className="fa-solid fa-pen" aria-hidden />
                </button>
                <button
                  onClick={() => handleDelete(it.id)}
                  aria-label="Excluir"
                  className="h-9 w-9 rounded-lg border border-red-500/30 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <i className="fa-solid fa-trash" aria-hidden />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && !items.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">
            Nenhuma foto ainda. Adicione a primeira ao lado.
          </p>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
