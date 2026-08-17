"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocialLinks, api, FRESH } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import useReorder from "@/lib/useReorder";
import { Spot, Toast, useToast } from "@/components/Fx";
import IconPicker from "@/components/admin/IconPicker";
import iconListSocial from "@/components/admin/iconListSocial";

const empty = { label: "", href: "", icon: "fa-solid fa-link" };

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

export default function SocialLinksAdmin({ token }) {
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, notify] = useToast();
  const { dirty, saving: reordering, moveUp, moveDown, save: saveOrder } = useReorder(links, setLinks, persistOrder);

  async function refresh() {
    setLoading(true);
    try {
      setLinks(await getSocialLinks(FRESH));
      setError("");
    } catch (err) {
      setError(`Não consegui carregar as redes sociais: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function persistOrder() {
    try {
      setLinks(await api.reorderSocialLinks(token, links.map((l) => l.id)));
      notify("Ordem salva");
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      setError(err.message);
      refresh();
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  function startEdit(l) {
    setEditingId(l.id);
    setForm({ ...l });
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
      if (editingId) await api.updateSocialLink(token, editingId, form);
      else await api.createSocialLink(token, { ...form, order: links.length });
      notify(editingId ? "Rede social atualizada" : "Rede social adicionada");
      resetForm();
      refresh();
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta rede social?")) return;
    try {
      await api.deleteSocialLink(token, id);
      notify("Rede social excluída");
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
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
          {editingId ? "Editar rede social" : "Nova rede social"}
        </h2>

        <div>
          <label className="mb-1 block text-sm text-muted">Nome</label>
          <input
            required
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="WhatsApp, GitHub, Instagram..."
            className={field}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Link</label>
          <input
            required
            value={form.href}
            onChange={(e) => setForm({ ...form, href: e.target.value })}
            placeholder="https://... ou mailto:..."
            className={field}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Ícone</label>
          <IconPicker list={iconListSocial} value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary sheen flex-1 py-2.5 text-sm disabled:opacity-50"
          >
            {saving && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
            {editingId ? "Salvar alterações" : "Adicionar rede social"}
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
            Redes sociais <span className="text-muted">({links.length})</span>
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
        <p className="-mt-1 text-xs text-muted">
          Use as setas para mudar a ordem de exibição. &quot;Email&quot; e &quot;WhatsApp&quot; também
          alimentam os botões da seção de contato — mantenha esses nomes exatos se quiser só trocar o link.
        </p>

        {loading &&
          [0, 1, 2].map((i) => <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-surface/70" />)}

        <AnimatePresence initial={false}>
          {links.map((l, i) => (
            <motion.div
              key={l.id}
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
                  disabled={i === links.length - 1}
                  aria-label="Mover para baixo"
                  className="flex h-5 w-7 items-center justify-center rounded border border-white/10 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent-2 disabled:pointer-events-none disabled:opacity-30"
                >
                  <i className="fa-solid fa-chevron-down" aria-hidden />
                </motion.button>
              </div>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background text-lg text-accent-2">
                <i className={l.icon} aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.label}</p>
                <p className="truncate text-xs text-muted">{l.href}</p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => startEdit(l)}
                  aria-label="Editar"
                  className="h-9 w-9 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i className="fa-solid fa-pen" aria-hidden />
                </button>
                <button
                  onClick={() => handleDelete(l.id)}
                  aria-label="Excluir"
                  className="h-9 w-9 rounded-lg border border-red-500/30 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <i className="fa-solid fa-trash" aria-hidden />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && !links.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">
            Nenhuma rede social ainda. Adicione a primeira ao lado.
          </p>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
