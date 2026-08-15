"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProjects, api } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import { Spot, Toast, useToast } from "@/components/Fx";
import CoverUpload from "@/components/admin/CoverUpload";
import RichTextEditor from "@/components/admin/RichTextEditor";

const empty = { title: "", description: "", imageUrl: "", link: "", featured: false, projectDate: "", order: 0 };

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

export default function ProjectsAdmin({ token }) {
  const [projects, setProjects] = useState([]);
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
      setProjects(await getProjects());
      setError("");
    } catch (err) {
      // Antes isso virava uma lista vazia em silêncio e parecia "não tem projeto".
      setError(`Não consegui carregar os projetos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Drag & drop nativo — reordena localmente e persiste a ordem ao soltar.
  function onDragEnter(to) {
    const from = dragFrom.current;
    if (from === null || from === to) return;
    setProjects((list) => {
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
      setProjects(await api.reorderProjects(token, projects.map((p) => p.id)));
      notify("Ordem salva");
      revalidateHome();
    } catch (err) {
      setError(err.message);
      refresh();
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ ...p, projectDate: p.projectDate?.slice(0, 10) });
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
      // Sem campo "Ordem" no formulário: projeto novo entra no fim, depois é arrastado.
      if (editingId) await api.updateProject(token, editingId, form);
      else await api.createProject(token, { ...form, order: projects.length });
      notify(editingId ? "Projeto atualizado" : "Projeto adicionado");
      resetForm();
      refresh();
      revalidateHome();
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este projeto?")) return;
    try {
      await api.deleteProject(token, id);
      notify("Projeto excluído");
      revalidateHome();
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
          {editingId ? "Editar projeto" : "Novo projeto"}
        </h2>

        <div>
          <label className="mb-1 block text-sm text-muted">Título</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={field}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Descrição</label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => setForm({ ...form, description: html })}
          />
        </div>

        <CoverUpload
          token={token}
          value={form.imageUrl}
          onChange={(imageUrl) => setForm({ ...form, imageUrl })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Link do projeto</label>
            <input
              required
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Data</label>
            <input
              type="date"
              required
              value={form.projectDate}
              onChange={(e) => setForm({ ...form, projectDate: e.target.value })}
              className={field}
            />
          </div>
        </div>

        {/* Interruptor no lugar do checkbox: o estado se lê de longe. */}
        <button
          type="button"
          onClick={() => setForm({ ...form, featured: !form.featured })}
          aria-pressed={form.featured}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm transition-colors hover:border-accent/50"
        >
          <span className="flex items-center gap-2">
            <i
              className={`fa-solid fa-star ${form.featured ? "text-accent-2" : "text-muted/40"}`}
              aria-hidden
            />
            Projeto destaque
          </span>
          <span
            className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
              form.featured ? "bg-accent" : "bg-white/10"
            }`}
          >
            <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={`h-5 w-5 rounded-full bg-white ${form.featured ? "ml-auto" : ""}`}
            />
          </span>
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary sheen flex-1 py-2.5 text-sm disabled:opacity-50"
          >
            {saving && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
            {editingId ? "Salvar alterações" : "Adicionar projeto"}
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
          Projetos <span className="text-muted">({projects.length})</span>
        </h2>
        <p className="-mt-1 text-xs text-muted">
          Arraste pelo <i className="fa-solid fa-grip-vertical" aria-hidden /> para mudar a posição no
          modo &quot;Relevância&quot; do site. O modo &quot;Data&quot; usa a data do projeto.
        </p>

        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-surface/70" />
          ))}

        <AnimatePresence initial={false}>
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
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

              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura da API, sem otimização
                <img src={p.imageUrl} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                  <i className="fa-solid fa-image" aria-hidden />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {p.featured && <i className="fa-solid fa-star text-xs text-accent-2" aria-hidden />}
                  {p.title}
                </p>
                <p className="text-xs text-muted">
                  {p.projectDate?.slice(0, 10)} · posição {i + 1}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => startEdit(p)}
                  aria-label="Editar"
                  className="h-9 w-9 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i className="fa-solid fa-pen" aria-hidden />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  aria-label="Excluir"
                  className="h-9 w-9 rounded-lg border border-red-500/30 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <i className="fa-solid fa-trash" aria-hidden />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && !projects.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">
            Nenhum projeto ainda. Adicione o primeiro ao lado.
          </p>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
