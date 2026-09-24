"use client";
import { useEffect, useState } from "react";
import { getNews, api, FRESH } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import { Spot, Toast, useToast } from "@/components/Fx";
import CoverUpload from "@/components/admin/CoverUpload";

const empty = { titlePt: "", titleEn: "", outlet: "", url: "", image: "", date: "" };

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

const STALE = "Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.";

export default function NewsAdmin({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, notify] = useToast();

  async function refresh() {
    setLoading(true);
    try {
      setItems(await getNews(FRESH));
      setError("");
    } catch (err) {
      setError(`Não consegui carregar as notícias: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  function startEdit(n) {
    setEditingId(n.id);
    setForm({ ...empty, ...Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v ?? ""])) });
    if (innerWidth < 1024) scrollTo({ top: 0, behavior: "smooth" }); // no desktop o form é sticky
  }

  function resetForm() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    // date vazia vira null: DATEONLY não aceita string vazia.
    const data = { ...form, date: form.date || null };
    try {
      if (editingId) await api.updateNews(token, editingId, data);
      else await api.createNews(token, data);
      notify(editingId ? "Notícia atualizada" : "Notícia adicionada");
      resetForm();
      refresh();
      revalidateHome().catch(() => notify(STALE, "error"));
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta notícia?")) return;
    try {
      await api.deleteNews(token, id);
      notify("Notícia excluída");
      revalidateHome().catch(() => notify(STALE, "error"));
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
          {editingId ? "Editar notícia" : "Nova notícia"}
        </h2>

        <div>
          <label className="mb-1 block text-sm text-muted">Título (PT)</label>
          <input required value={form.titlePt} onChange={(e) => setForm({ ...form, titlePt: e.target.value })} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Título (EN) — opcional, cai no PT</label>
          <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className={field} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Veículo</label>
            <input required value={form.outlet} onChange={(e) => setForm({ ...form, outlet: e.target.value })} placeholder="Jornal da Cidade" className={field} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Data</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Link da matéria</label>
          <input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className={field} />
        </div>

        <CoverUpload token={token} value={form.image} onChange={(image) => setForm({ ...form, image })} />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary sheen flex-1 py-2.5 text-sm disabled:opacity-50">
            {saving && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
            {editingId ? "Salvar alterações" : "Adicionar notícia"}
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
          Notícias <span className="text-muted">({items.length})</span>
        </h2>
        <p className="-mt-1 text-xs text-muted">Ordenadas por data, da mais recente para a mais antiga.</p>

        {loading && [0, 1].map((i) => <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-surface/70" />)}

        {items.map((n) => (
          <div key={n.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface p-2.5">
            {n.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura da API, sem otimização
              <img src={n.image} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                <i className="fa-solid fa-newspaper" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{n.titlePt}</p>
              <p className="text-xs text-muted">
                {n.outlet}
                {n.date && ` · ${n.date.split("-").reverse().join("/")}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button onClick={() => startEdit(n)} aria-label="Editar" className="h-9 w-9 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2">
                <i className="fa-solid fa-pen" aria-hidden />
              </button>
              <button onClick={() => handleDelete(n.id)} aria-label="Excluir" className="h-9 w-9 rounded-lg border border-red-500/30 text-sm text-red-400 transition-colors hover:bg-red-500/10">
                <i className="fa-solid fa-trash" aria-hidden />
              </button>
            </div>
          </div>
        ))}

        {!loading && !items.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">
            Nenhuma notícia ainda. Adicione a primeira ao lado.
          </p>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
