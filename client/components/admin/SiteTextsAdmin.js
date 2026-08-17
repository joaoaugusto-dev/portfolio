"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSiteTexts, api, FRESH } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import { Spot, Toast, useToast } from "@/components/Fx";

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

const groupLabels = {
  hero: "Topo (Hero)",
  about: "Sobre Mim",
  contact: "Contato",
  footer: "Rodapé",
  nav: "Menu",
  geral: "Geral",
};

const emptyNew = { key: "", group: "geral", label: "", pt: "", en: "" };

export default function SiteTextsAdmin({ token }) {
  const [texts, setTexts] = useState([]);
  const [drafts, setDrafts] = useState({}); // { [id]: { pt, en } } — só enquanto o usuário mexe, antes de salvar
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyNew);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, notify] = useToast();

  async function refresh() {
    setLoading(true);
    try {
      setTexts(await getSiteTexts(FRESH));
      setDrafts({});
      setError("");
    } catch (err) {
      setError(`Não consegui carregar os textos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  function current(id) {
    const t = texts.find((x) => x.id === id);
    return drafts[id] || { pt: t?.pt ?? "", en: t?.en ?? "" };
  }

  function editDraft(id, key, value) {
    setDrafts((d) => ({ ...d, [id]: { ...current(id), [key]: value } }));
  }

  function isDirty(t) {
    const d = drafts[t.id];
    return !!d && (d.pt !== t.pt || d.en !== t.en);
  }

  async function saveRow(t) {
    const d = drafts[t.id];
    if (!d) return;
    setSavingId(t.id);
    try {
      const updated = await api.updateSiteText(token, t.id, { pt: d.pt, en: d.en });
      setTexts((list) => list.map((x) => (x.id === t.id ? updated : x)));
      setDrafts((ds) => {
        const next = { ...ds };
        delete next[t.id];
        return next;
      });
      notify("Texto salvo");
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id) {
    if (
      !confirm(
        "Excluir este texto? Se ele ainda for usado em alguma seção, o site volta a mostrar o valor padrão do código.",
      )
    )
      return;
    setDeletingId(id);
    try {
      await api.deleteSiteText(token, id);
      notify("Texto excluído");
      refresh();
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createSiteText(token, form);
      notify("Texto adicionado");
      setForm(emptyNew);
      setAdding(false);
      refresh();
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
  }

  const groups = [...new Set(texts.map((t) => t.group))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Textos do site</h2>
          <p className="text-xs text-muted">
            Edite os campos e clique no botão que aparece ao lado de cada texto alterado pra salvar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="btn btn-ghost shrink-0 px-3 py-2 text-sm"
        >
          <i className={`fa-solid ${adding ? "fa-xmark" : "fa-plus"}`} aria-hidden />
          <span className="ml-2 hidden sm:inline">{adding ? "Cancelar" : "Novo texto"}</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Spot as="form" onSubmit={handleAdd} className="space-y-3 border border-white/5 bg-surface p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-muted">Chave (identifica o texto no código)</label>
                  <input
                    required
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    placeholder="ex.: hero.tagline"
                    className={`${field} font-mono text-sm`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">Grupo</label>
                  <input
                    required
                    value={form.group}
                    onChange={(e) => setForm({ ...form, group: e.target.value })}
                    placeholder="hero, about, contact..."
                    className={field}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Descrição (pra você lembrar o que é)</label>
                <input
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className={field}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-muted">PT</label>
                  <textarea
                    required
                    rows={2}
                    value={form.pt}
                    onChange={(e) => setForm({ ...form, pt: e.target.value })}
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">EN</label>
                  <textarea
                    required
                    rows={2}
                    value={form.en}
                    onChange={(e) => setForm({ ...form, en: e.target.value })}
                    className={field}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" className="btn btn-primary sheen w-full py-2.5 text-sm">
                Adicionar texto
              </button>
            </Spot>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && [0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface/70" />)}

      {groups.map((g) => (
        <div key={g} className="space-y-3">
          <h3 className="eyebrow">{groupLabels[g] || g}</h3>
          <div className="space-y-2">
            {texts
              .filter((t) => t.group === g)
              .map((t) => {
                const d = current(t.id);
                const dirty = isDirty(t);
                return (
                  <div key={t.id} className="rounded-xl border border-white/5 bg-surface p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm text-muted">{t.label}</p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <AnimatePresence>
                          {dirty && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              type="button"
                              onClick={() => saveRow(t)}
                              disabled={savingId === t.id}
                              className="btn btn-primary sheen px-3 py-1 text-xs disabled:opacity-50"
                            >
                              {savingId === t.id && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
                              {savingId === t.id ? "Salvando..." : "Salvar"}
                            </motion.button>
                          )}
                        </AnimatePresence>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          aria-label="Excluir"
                          className="h-8 w-8 rounded-lg border border-red-500/30 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <i
                            className={`fa-solid ${deletingId === t.id ? "fa-circle-notch fa-spin" : "fa-trash"}`}
                            aria-hidden
                          />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <textarea
                        rows={d.pt.length > 80 ? 3 : 1}
                        value={d.pt}
                        onChange={(e) => editDraft(t.id, "pt", e.target.value)}
                        placeholder="PT"
                        className={`${field} text-sm`}
                      />
                      <textarea
                        rows={d.en.length > 80 ? 3 : 1}
                        value={d.en}
                        onChange={(e) => editDraft(t.id, "en", e.target.value)}
                        placeholder="EN"
                        className={`${field} text-sm`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <Toast toast={toast} />
    </div>
  );
}
