"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Spot, Toast, useToast } from "@/components/Fx";

const kinds = [
  ["all", "Todos", "fa-solid fa-layer-group"],
  ["image", "Imagens", "fa-solid fa-image"],
  ["video", "Vídeos", "fa-solid fa-film"],
  ["pdf", "PDFs", "fa-solid fa-file-pdf"],
  ["other", "Outros", "fa-solid fa-file"],
];

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

// Só pra mostrar como o nome vai ficar; quem manda é o slugify do servidor.
const slugPreview = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const iconOf = (kind) =>
  ({
    image: "fa-solid fa-image",
    video: "fa-solid fa-film",
    pdf: "fa-solid fa-file-pdf",
  })[kind] || "fa-solid fa-file";

function formatSize(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

export default function FilesAdmin({ token }) {
  const [files, setFiles] = useState([]);
  const [kind, setKind] = useState("all");
  const [progress, setProgress] = useState(null); // { index, count, fileName, loaded, total, phase }
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const [copiedName, setCopiedName] = useState("");
  const [form, setForm] = useState({ name: "", title: "", description: "" });
  const [editing, setEditing] = useState(null); // { name, title, description }
  const inputRef = useRef(null);
  const [toast, notify] = useToast();

  async function refresh() {
    setFiles(await api.listFiles(token).catch((err) => {
      setError(err.message);
      return [];
    }));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  async function handleFiles(fileList) {
    const list = [...fileList];
    if (!list.length) return;
    const totalBytes = list.reduce((sum, f) => sum + f.size, 0);
    setProgress({ index: 0, count: list.length, fileName: list[0].name, loaded: 0, total: totalBytes, phase: "uploading" });
    setError("");
    try {
      // Nome/título/descrição valem pra um arquivo por vez; em lote usa o nome original.
      let sentBefore = 0;
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setProgress((p) => ({ ...p, index: i, fileName: file.name, phase: "uploading" }));
        await api.uploadFile(token, file, list.length === 1 ? form : {}, (loaded, fileTotal) => {
          setProgress((p) => ({
            ...p,
            loaded: sentBefore + loaded,
            // request body inteiro já saiu, mas a resposta ainda não voltou: o server
            // está processando (upload pro Supabase Storage) — daí pra frente é indeterminado.
            phase: loaded >= fileTotal ? "processing" : "uploading",
          }));
        });
        sentBefore += file.size;
      }
      setForm({ name: "", title: "", description: "" });
      await refresh();
      notify(list.length === 1 ? "Arquivo enviado" : `${list.length} arquivos enviados`);
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    } finally {
      setProgress(null);
    }
  }

  async function handleDelete(name) {
    if (!confirm("Excluir este arquivo?")) return;
    try {
      await api.deleteFile(token, name);
      notify("Arquivo excluído");
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
    refresh();
  }

  function copy(file, path) {
    navigator.clipboard.writeText(`${location.origin}${path}`);
    setCopiedName(file.name + path);
    notify("Link copiado");
    setTimeout(() => setCopiedName(""), 1500);
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await api.updateFile(token, editing.name, {
        title: editing.title,
        description: editing.description,
      });
      setEditing(null);
      notify("Alterações salvas");
      refresh();
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
  }

  const visible = kind === "all" ? files : files.filter((f) => f.kind === kind);
  const uploading = !!progress;
  const uploadPct = progress?.total ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0;

  return (
    <div>
      <Spot className="mb-4 space-y-3 border border-white/5 bg-surface p-5">
        <p className="text-sm text-muted">
          Preenchido antes de enviar. Vale para um arquivo por vez — em lote, cada um usa o
          próprio nome.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Endereço (opcional)</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="sidera-predict"
              className={field}
            />
            <span className="mt-1 block text-xs text-muted">
              <code className="text-accent-2">
                /midia/{slugPreview(form.name) || "nome-do-arquivo"}
              </code>
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Título</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Sidera Predict — inspeção dimensional"
              className={field}
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Descrição</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="O que aparece na página da mídia."
            className={field}
          />
        </label>
      </Spot>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!uploading) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`mb-8 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
          uploading ? "cursor-wait opacity-60" : ""
        } ${over ? "scale-[1.01] border-accent bg-accent/5" : "border-white/15 hover:border-accent/60"}`}
      >
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

        <motion.i
          animate={over ? { y: -6, scale: 1.15 } : { y: 0, scale: 1 }}
          className={`fa-solid ${uploading ? "fa-circle-notch fa-spin" : "fa-cloud-arrow-up"} mb-3 block text-3xl text-accent-2`}
          aria-hidden
        />
        <p className="text-muted">
          {uploading ? "Enviando..." : "Arraste arquivos aqui ou clique para escolher"}
        </p>
        <p className="mt-1 text-xs text-muted">
          Imagens, vídeos, PDFs e outros — até 200MB por arquivo
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-surface/60 p-1 sm:w-fit">
        {kinds.map(([value, label, icon]) => (
          <button
            key={value}
            onClick={() => setKind(value)}
            data-on={kind === value}
            className="pill flex items-center gap-2 px-3 py-1.5"
          >
            {kind === value && (
              <motion.span
                layoutId="files-pill"
                className="absolute inset-0 -z-10 rounded-lg bg-accent shadow-lg shadow-accent/25"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <i className={icon} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((f) => (
            <motion.div
              key={f.name}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-surface px-4 py-3 transition-colors hover:border-accent/40"
            >
              {f.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura da API, sem otimização
                <img src={f.url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
              ) : (
                <i className={`${iconOf(f.kind)} w-9 shrink-0 text-center text-xl text-accent-2`} aria-hidden />
              )}

              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm" title={f.title}>
                  {f.title}
                </p>
                <p className="truncate text-xs text-muted">
                  {f.pageUrl} · {formatSize(f.size)}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                <a
                  href={f.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir página"
                  title="Abrir página"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-xs transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i className="fa-solid fa-up-right-from-square" aria-hidden />
                </a>
                <button
                  onClick={() => setEditing({ name: f.name, title: f.title, description: f.description || "" })}
                  aria-label="Editar"
                  title="Editar"
                  className="h-9 w-9 rounded-lg border border-white/10 text-xs transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i className="fa-solid fa-pen" aria-hidden />
                </button>
                <button
                  onClick={() => copy(f, f.pageUrl)}
                  title="Link da página, pra compartilhar"
                  className="h-9 rounded-lg border border-white/10 px-2.5 text-xs transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i
                    className={`fa-solid ${copiedName === f.name + f.pageUrl ? "fa-check text-accent-2" : "fa-link"}`}
                    aria-hidden
                  />
                  <span className="ml-1.5 hidden sm:inline">Link</span>
                </button>
                <button
                  onClick={() => copy(f, f.url)}
                  title="Link direto do arquivo, pra usar em imageUrl de projeto"
                  className="h-9 rounded-lg border border-white/10 px-2.5 text-xs transition-colors hover:border-accent hover:text-accent-2"
                >
                  <i
                    className={`fa-solid ${copiedName === f.name + f.url ? "fa-check text-accent-2" : "fa-paperclip"}`}
                    aria-hidden
                  />
                  <span className="ml-1.5 hidden sm:inline">Direto</span>
                </button>
                <button
                  onClick={() => handleDelete(f.name)}
                  aria-label="Excluir"
                  title="Excluir"
                  className="h-9 w-9 rounded-lg border border-red-500/30 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <i className="fa-solid fa-trash" aria-hidden />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!visible.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">
            Nenhum arquivo aqui ainda.
          </p>
        )}
      </div>

      <AnimatePresence>
        {progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-surface p-6 text-center"
            >
              <motion.i
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="fa-solid fa-circle-notch mx-auto block text-3xl text-accent-2"
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium">
                  {progress.count > 1 ? `Arquivo ${progress.index + 1} de ${progress.count}` : "Enviando arquivo"}
                </p>
                <p className="mt-1 truncate text-xs text-muted" title={progress.fileName}>
                  {progress.fileName}
                </p>
              </div>

              <div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                    animate={
                      progress.phase === "processing"
                        ? { width: "100%", opacity: [0.4, 1, 0.4] }
                        : { width: `${uploadPct}%`, opacity: 1 }
                    }
                    transition={
                      progress.phase === "processing"
                        ? { opacity: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } }
                        : { width: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
                    }
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {progress.phase === "processing"
                    ? "Processando no servidor..."
                    : `${formatSize(progress.loaded)} de ${formatSize(progress.total)} (${uploadPct}%)`}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          >
            <motion.form
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={saveEdit}
              className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-surface p-6"
            >
              <h3 className="font-semibold">Editar {editing.name}</h3>
              <label className="block">
                <span className="mb-1 block text-sm text-muted">Título</span>
                <input
                  required
                  autoFocus
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className={field}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-muted">Descrição</span>
                <textarea
                  rows={4}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className={field}
                />
              </label>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary sheen py-2.5 text-sm">
                  Salvar
                </button>
                <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost py-2.5 text-sm">
                  Cancelar
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
}
