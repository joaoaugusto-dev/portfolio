"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSkills, api, FRESH } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import useReorder from "@/lib/useReorder";
import { Spot, Toast, useToast } from "@/components/Fx";
import IconPicker from "@/components/admin/IconPicker";
import iconListTech from "@/components/admin/iconListTech";
import { skillCats } from "@/lib/skillCats";

const empty = { type: "tech", name: "", icon: "fa-brands fa-flutter", cat: "mobile", pt: "", en: "" };

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

const cats = skillCats.slice(1); // sem "Tudo" — é só um filtro de exibição, não uma categoria real

export default function SkillsAdmin({ token }) {
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, notify] = useToast();

  const techList = skills.filter((s) => s.type === "tech");
  const softList = skills.filter((s) => s.type === "soft");

  function setTechList(next) {
    setSkills((all) => [...next, ...all.filter((s) => s.type !== "tech")]);
  }
  function setSoftList(next) {
    setSkills((all) => [...all.filter((s) => s.type !== "soft"), ...next]);
  }

  async function persistOrder(type) {
    const ids = (type === "tech" ? techList : softList).map((s) => s.id);
    try {
      setSkills(await api.reorderSkills(token, ids));
      notify("Ordem salva");
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      setError(err.message);
      refresh();
    }
  }

  const tech = useReorder(techList, setTechList, () => persistOrder("tech"));
  const soft = useReorder(softList, setSoftList, () => persistOrder("soft"));

  async function refresh() {
    setLoading(true);
    try {
      setSkills(await getSkills(FRESH));
      setError("");
    } catch (err) {
      setError(`Não consegui carregar as habilidades: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(s) {
    setEditingId(s.id);
    setForm({ type: s.type, name: s.name || "", icon: s.icon, cat: s.cat || "mobile", pt: s.pt, en: s.en });
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
      const payload =
        form.type === "tech"
          ? form
          : { type: "soft", icon: form.icon, pt: form.pt, en: form.en, name: null, cat: null };
      if (editingId) await api.updateSkill(token, editingId, payload);
      else await api.createSkill(token, { ...payload, order: skills.filter((s) => s.type === form.type).length });
      notify(editingId ? "Habilidade atualizada" : "Habilidade adicionada");
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
    if (!confirm("Excluir esta habilidade?")) return;
    try {
      await api.deleteSkill(token, id);
      notify("Habilidade excluída");
      revalidateHome().catch(() =>
        notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
      );
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
    refresh();
  }

  function Row({ s, i, list, group }) {
    return (
      <motion.div
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
            onClick={() => group.moveUp(i)}
            disabled={i === 0}
            aria-label="Mover para cima"
            className="flex h-5 w-7 items-center justify-center rounded border border-white/10 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent-2 disabled:pointer-events-none disabled:opacity-30"
          >
            <i className="fa-solid fa-chevron-up" aria-hidden />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ y: 2 }}
            onClick={() => group.moveDown(i)}
            disabled={i === list.length - 1}
            aria-label="Mover para baixo"
            className="flex h-5 w-7 items-center justify-center rounded border border-white/10 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent-2 disabled:pointer-events-none disabled:opacity-30"
          >
            <i className="fa-solid fa-chevron-down" aria-hidden />
          </motion.button>
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background text-lg text-accent-2">
          <i className={s.icon} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{s.name || s.pt}</p>
          <p className="truncate text-xs text-muted">{s.name ? s.pt : s.en}</p>
        </div>

        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={() => startEdit(s)}
            aria-label="Editar"
            className="h-9 w-9 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2"
          >
            <i className="fa-solid fa-pen" aria-hidden />
          </button>
          <button
            onClick={() => handleDelete(s.id)}
            aria-label="Excluir"
            className="h-9 w-9 rounded-lg border border-red-500/30 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <i className="fa-solid fa-trash" aria-hidden />
          </button>
        </div>
      </motion.div>
    );
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
          {editingId ? "Editar habilidade" : "Nova habilidade"}
        </h2>

        <div className="flex gap-2">
          {[
            ["tech", "Técnica"],
            ["soft", "Comportamental"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm({ ...form, type: value })}
              data-on={form.type === value}
              className="pill flex-1"
            >
              {label}
            </button>
          ))}
        </div>

        {form.type === "tech" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Flutter, Node.js..."
                className={field}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Categoria</label>
              <select
                value={form.cat}
                onChange={(e) => setForm({ ...form, cat: e.target.value })}
                className={field}
              >
                {cats.map(([value, pt]) => (
                  <option key={value} value={value}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-muted">Ícone</label>
          <IconPicker
            list={form.type === "tech" ? iconListTech : undefined}
            value={form.icon}
            onChange={(icon) => setForm({ ...form, icon })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">{form.type === "tech" ? "Uso (PT)" : "Nome (PT)"}</label>
            <input
              required
              value={form.pt}
              onChange={(e) => setForm({ ...form, pt: e.target.value })}
              placeholder={form.type === "tech" ? "apps Android e iOS" : "Trabalho em Grupo"}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">{form.type === "tech" ? "Uso (EN)" : "Nome (EN)"}</label>
            <input
              required
              value={form.en}
              onChange={(e) => setForm({ ...form, en: e.target.value })}
              placeholder={form.type === "tech" ? "Android & iOS apps" : "Teamwork"}
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
            {editingId ? "Salvar alterações" : "Adicionar habilidade"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-ghost py-2.5 text-sm">
              Cancelar
            </button>
          )}
        </div>
      </Spot>

      <div className="space-y-8">
        {loading && [0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface/70" />)}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Técnicas <span className="text-muted">({techList.length})</span>
            </h2>
            <AnimatePresence>
              {tech.dirty && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={tech.save}
                  disabled={tech.saving}
                  className="btn btn-primary sheen shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {tech.saving && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
                  {tech.saving ? "Salvando..." : "Salvar ordem"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence initial={false}>
            {techList.map((s, i) => (
              <Row key={s.id} s={s} i={i} list={techList} group={tech} />
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Comportamentais <span className="text-muted">({softList.length})</span>
            </h2>
            <AnimatePresence>
              {soft.dirty && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={soft.save}
                  disabled={soft.saving}
                  className="btn btn-primary sheen shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {soft.saving && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
                  {soft.saving ? "Salvando..." : "Salvar ordem"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence initial={false}>
            {softList.map((s, i) => (
              <Row key={s.id} s={s} i={i} list={softList} group={soft} />
            ))}
          </AnimatePresence>
        </div>

        {!loading && !skills.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">
            Nenhuma habilidade ainda. Adicione a primeira ao lado.
          </p>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
