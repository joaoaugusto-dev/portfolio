"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getJourney, api } from "@/lib/api";
import { Spot, Toast, useToast } from "@/components/Fx";
import IconPicker from "./IconPicker";

const empty = {
  icon: "fa-solid fa-code",
  periodPt: "",
  periodEn: "",
  titlePt: "",
  titleEn: "",
  schoolPt: "",
  schoolEn: "",
  notePt: "",
  noteEn: "",
  tags: "",
  live: false,
};

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

const toForm = (item) => ({ ...item, tags: (item.tags || []).join(", ") });
const toPayload = (form) => ({
  ...form,
  tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
});

export default function JourneyAdmin({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dragFrom = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [toast, notify] = useToast();

  async function refresh() {
    setLoading(true);
    try {
      setItems(await getJourney());
      setError("");
    } catch (err) {
      setError(`Não consegui carregar a jornada: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function onDragEnter(to) {
    const from = dragFrom.current;
    if (from === null || from === to) return;
    setItems((list) => {
      const next = [...list];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });
    dragFrom.current = to;
    setDragging(to);
  }

  async function saveOrder() {
    dragFrom.current = null;
    setDragging(null);
    try {
      setItems(await api.reorderJourneyItems(token, items.map((i) => i.id)));
      notify("Ordem salva");
    } catch (err) {
      setError(err.message);
      refresh();
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  function startEdit(item) {
    setEditingId(item.id);
    setForm(toForm(item));
    scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId) await api.updateJourneyItem(token, editingId, payload);
      else await api.createJourneyItem(token, { ...payload, order: items.length });
      notify(editingId ? "Item atualizado" : "Item adicionado");
      resetForm();
      refresh();
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este item da jornada?")) return;
    try {
      await api.deleteJourneyItem(token, id);
      notify("Item excluído");
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
          {editingId ? "Editar item" : "Novo item da jornada"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Ícone</label>
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setForm({ ...form, live: !form.live })}
              aria-pressed={form.live}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-2.5 text-sm transition-colors hover:border-accent/50"
            >
              <span className="flex items-center gap-2">
                <i
                  className={`fa-solid fa-satellite-dish ${form.live ? "text-accent-2" : "text-muted/40"}`}
                  aria-hidden
                />
                Em andamento
              </span>
              <span
                className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                  form.live ? "bg-accent" : "bg-white/10"
                }`}
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className={`h-5 w-5 rounded-full bg-white ${form.live ? "ml-auto" : ""}`}
                />
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Período (PT)</label>
            <input
              required
              value={form.periodPt}
              onChange={(e) => setForm({ ...form, periodPt: e.target.value })}
              placeholder="2025 — Atualmente"
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Período (EN)</label>
            <input
              required
              value={form.periodEn}
              onChange={(e) => setForm({ ...form, periodEn: e.target.value })}
              placeholder="2025 — Present"
              className={field}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Título (PT)</label>
            <input
              required
              value={form.titlePt}
              onChange={(e) => setForm({ ...form, titlePt: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Título (EN)</label>
            <input
              required
              value={form.titleEn}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
              className={field}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Instituição / escola (PT)</label>
            <input
              required
              value={form.schoolPt}
              onChange={(e) => setForm({ ...form, schoolPt: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Instituição / escola (EN)</label>
            <input
              required
              value={form.schoolEn}
              onChange={(e) => setForm({ ...form, schoolEn: e.target.value })}
              className={field}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Nota (PT)</label>
            <input
              value={form.notePt}
              onChange={(e) => setForm({ ...form, notePt: e.target.value })}
              placeholder="Concluído em 2024"
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Nota (EN)</label>
            <input
              value={form.noteEn}
              onChange={(e) => setForm({ ...form, noteEn: e.target.value })}
              placeholder="Completed in 2024"
              className={field}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Tags (separadas por vírgula)</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Flutter, Node.js, ESP32"
            className={field}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary sheen flex-1 py-2.5 text-sm disabled:opacity-50"
          >
            {saving && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
            {editingId ? "Salvar alterações" : "Adicionar item"}
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
          Jornada <span className="text-muted">({items.length})</span>
        </h2>
        <p className="-mt-1 text-xs text-muted">
          Arraste pelo <i className="fa-solid fa-grip-vertical" aria-hidden /> para mudar a ordem
          cronológica exibida no site.
        </p>

        {loading &&
          [0, 1, 2].map((i) => <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-surface/70" />)}

        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              layout={dragging === null}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => onDragEnter(i)}
              className={`flex items-center gap-3 rounded-xl border bg-surface p-2.5 transition-colors ${
                dragging === i ? "border-accent shadow-lg shadow-accent/20" : "border-white/5"
              }`}
            >
              <span
                draggable
                onDragStart={(e) => {
                  dragFrom.current = i;
                  setDragging(i);
                  e.dataTransfer.setDragImage(e.currentTarget.parentElement, 20, 20);
                }}
                onDragEnd={saveOrder}
                title="Arraste para reordenar"
                className="cursor-grab px-1 text-muted transition-colors hover:text-accent-2 active:cursor-grabbing"
              >
                <i className="fa-solid fa-grip-vertical" aria-hidden />
              </span>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background text-accent-2">
                <i className={item.icon} aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {item.live && <i className="fa-solid fa-satellite-dish text-xs text-accent-2" aria-hidden />}
                  {item.titlePt}
                </p>
                <p className="truncate text-xs text-muted">
                  {item.periodPt} · posição {i + 1}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => startEdit(item)}
                  aria-label="Editar"
                  className="h-9 w-9 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i className="fa-solid fa-pen" aria-hidden />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
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
            Nenhum item ainda. Adicione o primeiro ao lado.
          </p>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
