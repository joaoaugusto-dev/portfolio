"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
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
  const [posterEditing, setPosterEditing] = useState(null); // arquivo já no servidor (kind video)
  const [usage, setUsage] = useState(null); // { bytesUsed, capBytes }
  const [pending, setPending] = useState([]); // File[] selecionados, aguardando confirmação de envio
  const [pendingPoster, setPendingPoster] = useState(null); // { blob, url } escolhido localmente (só 1 vídeo)
  const [pickingPoster, setPickingPoster] = useState(false);
  const [posterDecided, setPosterDecided] = useState(false); // true só depois que o usuário escolheu ou pulou de propósito
  const inputRef = useRef(null);
  const [toast, notify] = useToast();

  useEffect(() => () => pendingPoster?.url && URL.revokeObjectURL(pendingPoster.url), [pendingPoster]);

  async function refresh() {
    setFiles(await api.listFiles(token).catch((err) => {
      setError(err.message);
      return [];
    }));
    setUsage(await api.getStorageUsage(token).catch(() => null));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  // Só encosta os arquivos escolhidos — nada sobe ainda. Se for 1 vídeo, abre o
  // escolhedor de miniatura na hora, direto do arquivo local (sem rede
  // nenhuma), pra confirmar tudo (título, descrição, miniatura) antes de enviar.
  function stageFiles(fileList) {
    const list = [...fileList];
    if (!list.length) return;
    setPending(list);
    setPendingPoster(null);
    setPickingPoster(list.length === 1 && list[0].type.startsWith("video/"));
    setPosterDecided(false);
    setError("");
  }

  function cancelPending() {
    setPending([]);
    setPendingPoster(null);
    setPickingPoster(false);
    setPosterDecided(false);
  }

  // Nada sobe faltando o que devia — título e (se for 1 vídeo) uma decisão
  // sobre a miniatura, nem que seja "usar o frame automático" de propósito.
  // Em vez de cair num valor padrão em silêncio, avisa o que falta e trava o
  // botão até resolver.
  function missingBeforeUpload() {
    if (pending.length !== 1) return [];
    const missing = [];
    if (!form.title.trim()) missing.push("título");
    if (pending[0].type.startsWith("video/") && !posterDecided) missing.push("miniatura");
    return missing;
  }

  async function confirmUpload() {
    const missing = missingBeforeUpload();
    if (missing.length) {
      notify(`Falta preencher: ${missing.join(", ")}`, "error");
      return;
    }
    const list = pending;
    const poster = pendingPoster;
    if (!list.length) return;
    setPending([]);
    setPendingPoster(null);
    setPickingPoster(false);
    setPosterDecided(false);
    const totalBytes = list.reduce((sum, f) => sum + f.size, 0);
    setProgress({ index: 0, count: list.length, fileName: list[0].name, loaded: 0, total: totalBytes, phase: "uploading" });
    setError("");
    try {
      // Nome/título/descrição valem pra um arquivo por vez; em lote usa o nome original.
      let sentBefore = 0;
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setProgress((p) => ({ ...p, index: i, fileName: file.name, phase: "uploading" }));
        const created = await api.uploadFile(token, file, list.length === 1 ? form : {}, (loaded, fileTotal) => {
          setProgress((p) => ({
            ...p,
            loaded: sentBefore + loaded,
            // bytes todos no R2, mas falta confirmar (/complete) e, se for vídeo,
            // gerar a miniatura no servidor — daí pra frente é indeterminado.
            phase: loaded >= fileTotal ? "processing" : "uploading",
          }));
        });
        if (list.length === 1 && created?.kind === "video" && poster) {
          await api.setPoster(token, created.name, { image: poster.blob });
        }
        sentBefore += file.size;
      }
      setForm({ name: "", title: "", description: "" });
      await refresh();
      notify(list.length === 1 ? "Arquivo enviado" : `${list.length} arquivos enviados`);
      revalidateHome().catch(() => notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"));
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
      revalidateHome().catch(() => notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"));
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
      revalidateHome().catch(() => notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"));
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
  }

  const visible = kind === "all" ? files : files.filter((f) => f.kind === kind);
  const uploading = !!progress;
  const uploadPct = progress?.total ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0;

  const usagePct = usage ? Math.min(100, (usage.bytesUsed / usage.capBytes) * 100) : 0;

  return (
    <div>
      {usage && (
        <div className="mb-4 space-y-1.5 rounded-xl border border-white/5 bg-surface px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Armazenamento (R2)</span>
            <span className={usagePct > 90 ? "font-medium text-red-400" : ""}>
              {formatSize(usage.bytesUsed)} de {formatSize(usage.capBytes)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                usagePct > 90 ? "bg-red-400" : "bg-gradient-to-r from-accent to-accent-2"
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      )}

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
          if (!uploading) stageFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`mb-8 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
          uploading ? "cursor-wait opacity-60" : ""
        } ${over ? "scale-[1.01] border-accent bg-accent/5" : "border-white/15 hover:border-accent/60"}`}
      >
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => stageFiles(e.target.files)} />

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

      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-8 space-y-3 rounded-2xl border border-white/10 bg-surface p-5"
          >
            <p className="text-sm">
              {pending.length === 1 ? pending[0].name : `${pending.length} arquivos selecionados`}
              <span className="ml-2 text-xs text-muted">{formatSize(pending.reduce((s, f) => s + f.size, 0))}</span>
            </p>

            {pickingPoster && (
              <LocalPosterPicker
                file={pending[0]}
                onConfirm={(blob) => {
                  setPendingPoster((prev) => {
                    if (prev?.url) URL.revokeObjectURL(prev.url);
                    return { blob, url: URL.createObjectURL(blob) };
                  });
                  setPickingPoster(false);
                  setPosterDecided(true);
                }}
                onSkip={() => {
                  setPickingPoster(false);
                  setPosterDecided(true);
                }}
              />
            )}

            {!pickingPoster && pending.length === 1 && pending[0].type.startsWith("video/") && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/60 p-3">
                {pendingPoster ? (
                  // eslint-disable-next-line @next/next/no-img-element -- preview local da miniatura escolhida
                  <img src={pendingPoster.url} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <i className="fa-solid fa-image w-20 shrink-0 text-center text-lg text-muted" aria-hidden />
                )}
                <p className="flex-1 text-xs text-muted">
                  {pendingPoster ? "Miniatura escolhida." : "Sem miniatura — vai usar o frame automático em 1s."}
                </p>
                <button type="button" onClick={() => setPickingPoster(true)} className="btn btn-ghost py-1.5 text-xs">
                  {pendingPoster ? "Trocar" : "Escolher"}
                </button>
              </div>
            )}

            {!pickingPoster && pending.length === 1 && missingBeforeUpload().length > 0 && (
              <p className="text-xs text-amber-400">
                <i className="fa-solid fa-triangle-exclamation mr-1.5" aria-hidden />
                Falta preencher: {missingBeforeUpload().join(", ")}.
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmUpload}
                disabled={!pickingPoster && missingBeforeUpload().length > 0}
                className="btn btn-primary sheen py-2.5 text-sm disabled:opacity-50"
              >
                Enviar
              </button>
              <button type="button" onClick={cancelPending} className="btn btn-ghost py-2.5 text-sm">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {f.kind === "image" || (f.kind === "video" && f.posterUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura da API, sem otimização
                <img src={f.kind === "image" ? f.url : f.posterUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
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
                {f.kind === "video" && (
                  <button
                    onClick={() => setPosterEditing(f)}
                    aria-label="Escolher miniatura"
                    title="Escolher miniatura"
                    className="h-9 w-9 rounded-lg border border-white/10 text-xs transition-colors hover:border-accent hover:text-accent-2"
                  >
                    <i className="fa-solid fa-image" aria-hidden />
                  </button>
                )}
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

      <AnimatePresence>
        {posterEditing && (
          <PosterPicker
            file={posterEditing}
            token={token}
            notify={notify}
            onClose={() => setPosterEditing(null)}
            onSaved={(media) => {
              setFiles((fs) => fs.map((x) => (x.name === media.name ? { ...x, ...media } : x)));
              setPosterEditing(null);
            }}
          />
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
}

const fmtTime = (s) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

// Escolhedor de miniatura embutido no passo de seleção, antes de qualquer
// upload: o <video> aponta pro arquivo local (blob: URL), então arrastar a
// linha do tempo não depende de rede nem do servidor — é só decodificação no
// próprio navegador, sem o custo de ida-e-volta que travava a versão anterior
// (que buscava frames de um vídeo já hospedado no R2).
const STRIP_COUNT = 14;

function LocalPosterPicker({ file, onConfirm, onSkip }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stripRef = useRef(null);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("frame");
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [ready, setReady] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [thumbs, setThumbs] = useState([]);
  const [building, setBuilding] = useState(false);

  // Criação e revogação emparelhadas no mesmo efeito — se ficarem em efeitos
  // separados, o Strict Mode do React (dev) simula montar/desmontar/montar de
  // novo e a revogação do primeiro "desmonte" mata a blob: URL antes dela
  // chegar a ser usada de verdade (ERR_FILE_NOT_FOUND no <video>).
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  useEffect(() => () => uploadPreview && URL.revokeObjectURL(uploadPreview), [uploadPreview]);

  // Tira do vídeo local, tipo linha do tempo de editor: pega STRIP_COUNT
  // frames espalhados no vídeo, seekando o mesmo <video> em sequência (rápido
  // porque o blob já está todo decodificável na memória, sem rede envolvida).
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    async function build() {
      setBuilding(true);
      const v = videoRef.current;
      const canvas = document.createElement("canvas");
      // Grande o bastante pra não borrar em tela HiDPI: a faixa estica cada
      // miniatura por CSS, e num monitor 2x isso vira upscale real se a fonte
      // for pequena demais — daqui é só downscale do vídeo, local e barato.
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      const out = [];
      for (let i = 0; i < STRIP_COUNT; i++) {
        if (cancelled) return;
        const t = ((i + 0.5) / STRIP_COUNT) * duration;
        await new Promise((resolve) => {
          const onSeeked = () => {
            v.removeEventListener("seeked", onSeeked);
            resolve();
          };
          v.addEventListener("seeked", onSeeked);
          v.currentTime = t;
        });
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        // PNG (sem perda) em vez de JPEG: no tamanho da tira (96x54) o arquivo
        // continua minúsculo, e sem quantização/JPEG a decodificação é até
        // mais simples pro navegador — local não precisa economizar aqui.
        out.push(canvas.toDataURL("image/png"));
      }
      if (cancelled) return;
      setThumbs(out);
      v.currentTime = time;
      setBuilding(false);
    }
    build();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reconstrói quando o vídeo fica pronto
  }, [ready]);

  function timeFromEvent(e) {
    const el = stripRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  function scrubTo(t) {
    setTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }

  function startDrag(e) {
    if (building) return;
    scrubTo(timeFromEvent(e));
    const move = (ev) => scrubTo(timeFromEvent(ev));
    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  function pickUpload(f) {
    if (!f) {
      setUploadFile(null);
      setUploadPreview("");
      return;
    }
    setUploadFile(f);
    setUploadPreview(URL.createObjectURL(f));
  }

  function confirm() {
    if (mode === "upload") {
      if (uploadFile) onConfirm(uploadFile);
      return;
    }
    const v = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0);
    canvas.toBlob((b) => b && onConfirm(b), "image/jpeg", 0.92);
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-background/60 p-4">
      <div className="flex gap-1 rounded-xl border border-white/10 bg-surface p-1 text-sm">
        <button type="button" onClick={() => setMode("frame")} data-on={mode === "frame"} className="pill flex-1">
          Escolher frame
        </button>
        <button type="button" onClick={() => setMode("upload")} data-on={mode === "upload"} className="pill flex-1">
          Enviar imagem
        </button>
      </div>

      {mode === "frame" ? (
        <div className="space-y-2">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
            {url && (
              <video
                ref={videoRef}
                src={url}
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-contain"
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  setReady(true);
                }}
              />
            )}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <i className="fa-solid fa-circle-notch fa-spin text-lg text-accent-2" aria-hidden />
              </div>
            )}
          </div>

          <div
            ref={stripRef}
            onMouseDown={startDrag}
            onTouchStart={(e) => !building && scrubTo(timeFromEvent(e))}
            onTouchMove={(e) => !building && scrubTo(timeFromEvent(e))}
            className={`relative flex h-16 select-none overflow-hidden rounded-lg border border-white/10 bg-black ${
              building ? "cursor-wait" : "cursor-pointer"
            }`}
          >
            {thumbs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura local (canvas), sem otimização
              <img key={i} src={src} alt="" draggable={false} className="h-full flex-1 object-cover" />
            ))}
            {building && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs text-muted">
                Gerando prévia...
              </div>
            )}
            {ready && duration > 0 && (
              <div
                className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent-2 shadow-[0_0_6px_rgba(155,89,182,0.8)]"
                style={{ left: `${(time / duration) * 100}%` }}
              />
            )}
          </div>

          <p className="text-center text-xs tabular-nums text-muted">
            {fmtTime(time)} / {fmtTime(duration)}
          </p>
          <canvas ref={canvasRef} hidden />
        </div>
      ) : (
        <label className="flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/15 bg-black hover:border-accent/60">
          <input type="file" accept="image/*" hidden onChange={(e) => pickUpload(e.target.files?.[0] || null)} />
          {uploadPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview local, sem otimização
            <img src={uploadPreview} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-sm text-muted">Clique para escolher uma imagem</span>
          )}
        </label>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={mode === "frame" ? !ready : !uploadFile}
          className="btn btn-primary py-2 text-xs disabled:opacity-50"
        >
          Usar esta miniatura
        </button>
        <button type="button" onClick={onSkip} className="btn btn-ghost py-2 text-xs">
          Usar frame automático
        </button>
      </div>
    </div>
  );
}

// Modal de miniatura: ou arrasta a linha do tempo do próprio vídeo (o frame
// atual é recortado no browser via canvas — nada de vídeo sobe de novo pro
// servidor), ou envia uma imagem pronta. Os dois caminhos terminam comprimidos
// no servidor (setPoster -> sharp), então o que sobe daqui pode vir cru.
//
// O <video> aqui é sempre o real (não uma tira pré-renderizada em baixa
// resolução): a rota /raw/:name do servidor agora respeita Range, então o
// navegador só busca os pedaços do arquivo que precisa pra cada seek, em vez
// de baixar o vídeo inteiro de novo a cada arraste — arrastar sem travar não
// depende mais de pré-processar nada.
function PosterPicker({ file, token, onClose, onSaved, notify }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stripRef = useRef(null);
  const objectUrlRef = useRef(null);
  const seekTimer = useRef(null);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState("frame"); // "frame" | "upload"
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [thumbs, setThumbs] = useState([]);
  const [building, setBuilding] = useState(false);

  // O texto do tempo acompanha o arraste na hora; o seek de verdade no vídeo
  // (que baixa bytes novos do servidor) espera o dedo parar por um instante —
  // sem isso, cada pixel arrastado vira uma requisição de Range.
  function scrub(t) {
    setTime(t);
    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      if (videoRef.current) videoRef.current.currentTime = t;
    }, 120);
  }

  useEffect(() => () => clearTimeout(seekTimer.current), []);

  // Mesma tira de miniaturas do escolhedor pré-upload, só que aqui os frames
  // vêm do servidor (Range por trás) em vez de um blob local — inevitável
  // pra um vídeo que já está no R2, mas ainda é STRIP_COUNT pedidos, não o
  // arquivo inteiro de novo a cada arraste.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    async function build() {
      setBuilding(true);
      const v = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      const out = [];
      for (let i = 0; i < STRIP_COUNT; i++) {
        if (cancelled) return;
        const t = ((i + 0.5) / STRIP_COUNT) * duration;
        await new Promise((resolve) => {
          const onSeeked = () => {
            v.removeEventListener("seeked", onSeeked);
            resolve();
          };
          v.addEventListener("seeked", onSeeked);
          v.currentTime = t;
        });
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        out.push(canvas.toDataURL("image/png"));
      }
      if (cancelled) return;
      setThumbs(out);
      v.currentTime = time;
      setBuilding(false);
    }
    build();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reconstrói quando o vídeo fica pronto
  }, [ready]);

  function timeFromEvent(e) {
    const el = stripRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  function startDrag(e) {
    if (building) return;
    scrub(timeFromEvent(e));
    const move = (ev) => scrub(timeFromEvent(ev));
    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  function pickUpload(f) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    if (!f) {
      setUploadFile(null);
      setUploadPreview("");
      return;
    }
    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;
    setUploadFile(f);
    setUploadPreview(url);
  }

  useEffect(() => () => objectUrlRef.current && URL.revokeObjectURL(objectUrlRef.current), []);

  async function save() {
    setSaving(true);
    try {
      let image;
      if (mode === "upload") {
        if (!uploadFile) throw new Error("Escolha uma imagem");
        image = uploadFile;
      } else {
        const v = videoRef.current;
        // O seek real é debounced (scrub()) — se salvar antes dele disparar, o
        // vídeo ainda pode estar num instante anterior ao mostrado no texto.
        // Garante que bate certinho antes de capturar.
        clearTimeout(seekTimer.current);
        if (Math.abs(v.currentTime - time) > 0.05) {
          await new Promise((resolve) => {
            const onSeeked = () => {
              v.removeEventListener("seeked", onSeeked);
              resolve();
            };
            v.addEventListener("seeked", onSeeked);
            v.currentTime = time;
          });
        }
        const canvas = canvasRef.current;
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        canvas.getContext("2d").drawImage(v, 0, 0);
        image = await new Promise((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao capturar o frame"))), "image/jpeg", 0.92)
        );
      }
      const media = await api.setPoster(token, file.name, { image });
      notify("Miniatura atualizada");
      onSaved(media);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-surface p-6"
      >
        <h3 className="font-semibold">Miniatura de {file.title}</h3>

        {file.posterUrl && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura atual, sem otimização */}
            <img src={file.posterUrl} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
            <p className="text-xs text-muted">Miniatura atual — escolha outra abaixo pra trocar.</p>
          </div>
        )}

        <div className="flex gap-1 rounded-xl border border-white/10 bg-background/60 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("frame")}
            data-on={mode === "frame"}
            className="pill flex-1"
          >
            Escolher frame
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            data-on={mode === "upload"}
            className="pill flex-1"
          >
            Enviar imagem
          </button>
        </div>

        {mode === "frame" ? (
          <div className="space-y-2">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <video
                ref={videoRef}
                src={file.url}
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-contain"
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  setReady(true);
                }}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <i className="fa-solid fa-circle-notch fa-spin text-lg text-accent-2" aria-hidden />
                </div>
              )}
            </div>

            <div
              ref={stripRef}
              onMouseDown={startDrag}
              onTouchStart={(e) => !building && scrub(timeFromEvent(e))}
              onTouchMove={(e) => !building && scrub(timeFromEvent(e))}
              className={`relative flex h-16 select-none overflow-hidden rounded-lg border border-white/10 bg-black ${
                building ? "cursor-wait" : "cursor-pointer"
              }`}
            >
              {thumbs.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura da tira, sem otimização
                <img key={i} src={src} alt="" draggable={false} className="h-full flex-1 object-cover" />
              ))}
              {building && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs text-muted">
                  Gerando prévia...
                </div>
              )}
              {ready && duration > 0 && (
                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent-2 shadow-[0_0_6px_rgba(155,89,182,0.8)]"
                  style={{ left: `${(time / duration) * 100}%` }}
                />
              )}
            </div>

            <p className="text-center text-xs tabular-nums text-muted">
              {fmtTime(time)} / {fmtTime(duration)}
            </p>
            <canvas ref={canvasRef} hidden />
          </div>
        ) : (
          <div className="space-y-2">
            <label
              className="flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/15 bg-black hover:border-accent/60"
            >
              <input type="file" accept="image/*" hidden onChange={(e) => pickUpload(e.target.files?.[0] || null)} />
              {uploadPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview local, sem otimização
                <img src={uploadPreview} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-sm text-muted">Clique para escolher uma imagem</span>
              )}
            </label>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || (mode === "frame" ? !ready : !uploadFile)}
            className="btn btn-primary sheen py-2.5 text-sm disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Usar esta miniatura"}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost py-2.5 text-sm">
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
