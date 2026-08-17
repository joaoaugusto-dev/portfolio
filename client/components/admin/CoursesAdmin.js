"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCourses, api, FRESH } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import useReorder from "@/lib/useReorder";
import { Spot, Toast, useToast } from "@/components/Fx";
import CoverUpload from "@/components/admin/CoverUpload";

const empty = {
  titlePt: "",
  titleEn: "",
  image: "",
  platform: "",
  durationPt: "",
  durationEn: "",
  descPt: "",
  descEn: "",
};

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

export default function CoursesAdmin({ token }) {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, notify] = useToast();
  const { dirty, saving: reordering, moveUp, moveDown, save: saveOrder } = useReorder(courses, setCourses, persistOrder);

  async function refresh() {
    setLoading(true);
    try {
      setCourses(await getCourses(FRESH));
      setError("");
    } catch (err) {
      setError(`Não consegui carregar os cursos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function persistOrder() {
    try {
      setCourses(await api.reorderCourses(token, courses.map((c) => c.id)));
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

  function startEdit(c) {
    setEditingId(c.id);
    setForm({ ...c });
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
      if (editingId) await api.updateCourse(token, editingId, form);
      else await api.createCourse(token, { ...form, order: courses.length });
      notify(editingId ? "Curso atualizado" : "Curso adicionado");
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
    if (!confirm("Excluir este curso?")) return;
    try {
      await api.deleteCourse(token, id);
      notify("Curso excluído");
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
          {editingId ? "Editar curso" : "Novo curso"}
        </h2>

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

        <CoverUpload token={token} value={form.image} onChange={(image) => setForm({ ...form, image })} />

        <div>
          <label className="mb-1 block text-sm text-muted">Plataforma</label>
          <input
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
            placeholder="Curso em Vídeo"
            className={field}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Duração (PT)</label>
            <input
              value={form.durationPt}
              onChange={(e) => setForm({ ...form, durationPt: e.target.value })}
              placeholder="40 horas"
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Duração (EN)</label>
            <input
              value={form.durationEn}
              onChange={(e) => setForm({ ...form, durationEn: e.target.value })}
              placeholder="40 hours"
              className={field}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Descrição (PT)</label>
          <textarea
            required
            rows={3}
            value={form.descPt}
            onChange={(e) => setForm({ ...form, descPt: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Descrição (EN)</label>
          <textarea
            required
            rows={3}
            value={form.descEn}
            onChange={(e) => setForm({ ...form, descEn: e.target.value })}
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
            {editingId ? "Salvar alterações" : "Adicionar curso"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-ghost py-2.5 text-sm">
              Cancelar
            </button>
          )}
        </div>
      </Spot>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Cursos <span className="text-muted">({courses.length})</span>
          </h2>
          <AnimatePresence>
            {dirty && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={saveOrder}
                disabled={reordering}
                className="btn btn-primary sheen shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {reordering && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
                {reordering ? "Salvando..." : "Salvar ordem"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <p className="-mt-1 text-xs text-muted">Use as setas para mudar a posição na seção do site.</p>

        {loading &&
          [0, 1].map((i) => <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-surface/70" />)}

        <AnimatePresence initial={false}>
          {courses.map((c, i) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface p-2.5"
            >
              <div className="flex shrink-0 flex-col gap-0.5">
                <motion.button
                  type="button"
                  whileTap={{ y: -2 }}
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  aria-label="Mover para cima"
                  className="flex h-5 w-7 items-center justify-center rounded border border-white/10 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent-2 disabled:pointer-events-none disabled:opacity-30"
                >
                  <i className="fa-solid fa-chevron-up" aria-hidden />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ y: 2 }}
                  onClick={() => moveDown(i)}
                  disabled={i === courses.length - 1}
                  aria-label="Mover para baixo"
                  className="flex h-5 w-7 items-center justify-center rounded border border-white/10 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent-2 disabled:pointer-events-none disabled:opacity-30"
                >
                  <i className="fa-solid fa-chevron-down" aria-hidden />
                </motion.button>
              </div>

              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura da API, sem otimização
                <img src={c.image} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                  <i className="fa-solid fa-image" aria-hidden />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.titlePt}</p>
                <p className="text-xs text-muted">
                  {c.platform} · posição {i + 1}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => startEdit(c)}
                  aria-label="Editar"
                  className="h-9 w-9 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i className="fa-solid fa-pen" aria-hidden />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label="Excluir"
                  className="h-9 w-9 rounded-lg border border-red-500/30 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <i className="fa-solid fa-trash" aria-hidden />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && !courses.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">
            Nenhum curso ainda. Adicione o primeiro ao lado.
          </p>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
