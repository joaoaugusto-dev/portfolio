"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGallery, api } from "@/lib/api";
import { revalidateHome } from "@/lib/actions";
import { sortGalleryByDate, groupByEvent, formatEventDate, eventKey } from "@/lib/gallerySort";
import { Spot, Toast, useToast } from "@/components/Fx";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import CropModal, { loadImage } from "@/components/admin/CropModal";

const emptyEvent = { eventName: "", eventNameEn: "", eventDate: "" };
const emptyItem = { image: "", width: null, height: null, captionPt: "", captionEn: "", ...emptyEvent };

const field =
  "w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)]";

// Só os campos que definem a "pasta" — usado ao mover foto e ao renomear grupo.
function eventOf(o) {
  return { eventName: o.eventName || "", eventNameEn: o.eventNameEn || "", eventDate: o.eventDate || "" };
}

export default function GalleryAdmin({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, notify] = useToast();

  // Adição em massa: os dados do evento valem pro lote inteiro, a legenda é de
  // cada foto.
  const [event, setEvent] = useState(emptyEvent);
  const [picked, setPicked] = useState([]); // { uid, file, url, captionPt, captionEn }
  const [progress, setProgress] = useState(null); // { done, total } enquanto envia
  const [over, setOver] = useState(false);
  const [cropping, setCropping] = useState(null); // foto do lote sendo recortada
  const fileRef = useRef(null);

  // Edição de uma foto só (null = formulário está no modo lote).
  const [editing, setEditing] = useState(null);

  // Pasta sendo renomeada e pastas recolhidas.
  const [renaming, setRenaming] = useState(null); // { key, ...evento }
  const [closed, setClosed] = useState({});

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  function syncHome() {
    revalidateHome().catch(() =>
      notify("Salvo, mas não consegui atualizar a home — atualize a página do admin e tente de novo.", "error"),
    );
  }

  // ---------- adição em massa ----------

  async function addFiles(list) {
    const novos = await Promise.all(
      [...list]
        .filter((f) => f.type.startsWith("image/"))
        .map(async (file) => {
          const url = URL.createObjectURL(file);
          const img = await loadImage(url).catch(() => null);
          return {
            uid: `${file.name}-${file.size}-${Math.random()}`,
            file,
            url,
            naturalAspect: img ? img.naturalWidth / img.naturalHeight : 1,
            captionPt: "",
            captionEn: "",
          };
        }),
    );
    if (novos.length) setPicked((p) => [...p, ...novos]);
  }

  // Troca o arquivo da foto pelo recorte, ainda antes de enviar — o upload no
  // submit usa p.file, então não muda mais nada no fluxo.
  async function applyCrop(blob) {
    const url = URL.createObjectURL(blob);
    const img = await loadImage(url).catch(() => null);
    setPicked((l) =>
      l.map((x) => {
        if (x.uid !== cropping.uid) return x;
        URL.revokeObjectURL(x.url);
        return { ...x, file: blob, url, naturalAspect: img ? img.naturalWidth / img.naturalHeight : x.naturalAspect };
      }),
    );
    setCropping(null);
  }

  function removePicked(uid) {
    setPicked((p) => {
      const alvo = p.find((x) => x.uid === uid);
      if (alvo) URL.revokeObjectURL(alvo.url);
      return p.filter((x) => x.uid !== uid);
    });
  }

  function clearPicked() {
    picked.forEach((p) => URL.revokeObjectURL(p.url));
    setPicked([]);
  }

  async function handleBulkSubmit(e) {
    e.preventDefault();
    if (!picked.length) {
      setError("Escolha pelo menos uma foto.");
      return;
    }
    setError("");
    setProgress({ done: 0, total: picked.length });
    let enviadas = 0;
    try {
      // Uma de cada vez de propósito: o backend é free tier, e assim o contador
      // mostra progresso real em vez de tudo travar junto.
      for (const p of picked) {
        const { url, width, height } = await api.uploadCover(token, p.file);
        await api.createGalleryItem(token, {
          image: url,
          width,
          height,
          captionPt: p.captionPt,
          captionEn: p.captionEn,
          ...event,
        });
        enviadas += 1;
        setProgress({ done: enviadas, total: picked.length });
      }
      notify(picked.length === 1 ? "Foto adicionada" : `${picked.length} fotos adicionadas`);
      clearPicked();
    } catch (err) {
      // Só as que ainda não subiram continuam na lista — senão tentar de novo
      // subiria duplicado o que já entrou.
      setPicked((l) => {
        l.slice(0, enviadas).forEach((x) => URL.revokeObjectURL(x.url));
        return l.slice(enviadas);
      });
      setError(`Enviei ${enviadas} de ${picked.length} e parei: ${err.message}. As que faltam continuam na lista.`);
      notify(err.message, "error");
    } finally {
      setProgress(null);
      if (enviadas) {
        refresh();
        syncHome();
      }
    }
  }

  // ---------- edição de uma foto ----------

  function startEdit(it) {
    setEditing({ ...emptyItem, ...it, eventDate: it.eventDate?.slice(0, 10) || "" });
    scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editing.image) {
      setError("Escolha uma foto antes de salvar.");
      return;
    }
    setError("");
    try {
      await api.updateGalleryItem(token, editing.id, editing);
      notify("Foto atualizada");
      setEditing(null);
      refresh();
      syncHome();
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta foto?")) return;
    try {
      await api.deleteGalleryItem(token, id);
      notify("Foto excluída");
      syncHome();
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
    refresh();
  }

  // ---------- pastas ----------

  async function moveTo(it, destino) {
    try {
      await api.updateGalleryItem(token, it.id, eventOf(destino));
      notify(destino.eventName ? `Movida para "${destino.eventName}"` : "Movida para fora das pastas");
      refresh();
      syncHome();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function saveRename() {
    const alvo = items.filter((it) => eventKey(it) === renaming.key);
    try {
      // Sem endpoint de update em lote no backend; são poucas fotos por pasta,
      // então um PUT por foto resolve sem inventar rota nova.
      for (const it of alvo) await api.updateGalleryItem(token, it.id, eventOf(renaming));
      notify("Pasta atualizada");
      setRenaming(null);
      refresh();
      syncHome();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  const folders = groupByEvent(sortGalleryByDate(items));
  const destinos = folders.filter((f) => f.key);
  const enviando = progress !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      {editing ? (
        <Spot
          as="form"
          onSubmit={handleEditSubmit}
          className="h-fit space-y-4 border border-white/5 bg-surface p-5 sm:p-6 lg:sticky lg:top-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <i className="fa-solid fa-pen text-accent-2" aria-hidden />
            Editar foto
          </h2>

          <ImageCropUpload
            token={token}
            value={editing.image}
            onChange={(image, meta = {}) =>
              setEditing({ ...editing, image, width: meta.width ?? null, height: meta.height ?? null })
            }
          />

          <EventFields value={editing} onChange={(v) => setEditing({ ...editing, ...v })} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">Legenda (PT)</label>
              <input
                value={editing.captionPt}
                onChange={(e) => setEditing({ ...editing, captionPt: e.target.value })}
                placeholder="Opcional"
                className={field}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Legenda (EN)</label>
              <input
                value={editing.captionEn}
                onChange={(e) => setEditing({ ...editing, captionEn: e.target.value })}
                placeholder="Opcional"
                className={field}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary sheen flex-1 py-2.5 text-sm">
              Salvar alterações
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost py-2.5 text-sm">
              Cancelar
            </button>
          </div>
        </Spot>
      ) : (
        <Spot
          as="form"
          onSubmit={handleBulkSubmit}
          className="h-fit space-y-4 border border-white/5 bg-surface p-5 sm:p-6 lg:sticky lg:top-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <i className="fa-solid fa-images text-accent-2" aria-hidden />
            Adicionar fotos
          </h2>

          <EventFields value={event} onChange={(v) => setEvent({ ...event, ...v })} />
          <p className="-mt-2 text-xs text-muted">
            Os dados do evento valem pra todas as fotos deste envio — a legenda é individual.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => !enviando && fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
              over ? "scale-[1.01] border-accent bg-accent/5" : "border-white/15 hover:border-accent/60"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <i className="fa-solid fa-cloud-arrow-up mb-2 block text-2xl text-accent-2" aria-hidden />
            <p className="text-sm text-muted">Arraste várias fotos aqui ou clique para escolher</p>
          </div>

          {picked.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {picked.length} {picked.length === 1 ? "foto escolhida" : "fotos escolhidas"}
                </span>
                <button type="button" onClick={clearPicked} className="text-xs text-muted hover:text-red-400">
                  limpar
                </button>
              </div>

              {picked.map((p) => (
                <div key={p.uid} className="flex gap-2 rounded-xl border border-white/5 bg-background p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- prévia local, ainda não enviada */}
                  <img src={p.url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <input
                      value={p.captionPt}
                      onChange={(e) =>
                        setPicked((l) => l.map((x) => (x.uid === p.uid ? { ...x, captionPt: e.target.value } : x)))
                      }
                      placeholder="Legenda (PT) — opcional"
                      className={`${field} py-1.5 text-sm`}
                    />
                    <input
                      value={p.captionEn}
                      onChange={(e) =>
                        setPicked((l) => l.map((x) => (x.uid === p.uid ? { ...x, captionEn: e.target.value } : x)))
                      }
                      placeholder="Legenda (EN) — opcional"
                      className={`${field} py-1.5 text-sm`}
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCropping(p)}
                      aria-label="Cortar esta foto"
                      title="Cortar"
                      className="h-8 w-8 rounded-lg border border-white/10 text-sm text-muted transition-colors hover:border-accent hover:text-accent-2"
                    >
                      <i className="fa-solid fa-crop-simple" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePicked(p.uid)}
                      aria-label="Tirar da lista"
                      className="h-8 w-8 rounded-lg border border-white/10 text-sm text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
                    >
                      <i className="fa-solid fa-xmark" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={enviando || !picked.length}
            className="btn btn-primary sheen w-full py-2.5 text-sm disabled:opacity-50"
          >
            {enviando && <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />}
            {enviando
              ? `Enviando ${progress.done}/${progress.total}...`
              : `Enviar ${picked.length || ""} ${picked.length === 1 ? "foto" : "fotos"}`.trim()}
          </button>
        </Spot>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Pastas <span className="text-muted">({items.length} fotos)</span>
        </h2>
        <p className="-mt-2 text-xs text-muted">
          Cada pasta é um evento e vira uma seção na home, da data mais recente pra mais antiga. Fotos
          sem evento ficam soltas no fim.
        </p>

        {loading && [0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-surface/70" />)}

        {folders.map((f) => (
          <div key={f.key || "sem-evento"} className="rounded-xl border border-white/5 bg-surface">
            {renaming?.key === f.key ? (
              <div className="space-y-3 border-b border-white/5 p-3">
                <EventFields value={renaming} onChange={(v) => setRenaming({ ...renaming, ...v })} />
                <div className="flex gap-2">
                  <button onClick={saveRename} className="btn btn-primary sheen flex-1 py-2 text-sm">
                    Aplicar às {f.items.length} fotos
                  </button>
                  <button onClick={() => setRenaming(null)} className="btn btn-ghost py-2 text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-b border-white/5 p-3">
                <button
                  onClick={() => setClosed({ ...closed, [f.key]: !closed[f.key] })}
                  aria-label={closed[f.key] ? "Abrir pasta" : "Fechar pasta"}
                  className="text-accent-2"
                >
                  <i className={`fa-solid ${closed[f.key] ? "fa-folder" : "fa-folder-open"}`} aria-hidden />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{f.eventName || "Sem evento"}</p>
                  <p className="text-xs text-muted">
                    {f.eventDate ? formatEventDate(f.eventDate) : "sem data"} · {f.items.length}{" "}
                    {f.items.length === 1 ? "foto" : "fotos"}
                    {f.eventNameEn ? ` · EN: ${f.eventNameEn}` : ""}
                  </p>
                </div>
                {f.key && (
                  <button
                    onClick={() => setRenaming({ key: f.key, ...eventOf(f) })}
                    aria-label="Editar pasta"
                    className="h-9 w-9 shrink-0 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2"
                  >
                    <i className="fa-solid fa-pen" aria-hidden />
                  </button>
                )}
              </div>
            )}

            <AnimatePresence initial={false}>
              {!closed[f.key] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 p-3">
                    {f.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-2.5 rounded-lg bg-background p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura da API, sem otimização */}
                        <img src={it.image} alt="" className="h-11 w-16 shrink-0 rounded object-cover" />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{it.captionPt || <span className="text-muted">sem legenda</span>}</p>
                          <select
                            value={eventKey(it) || ""}
                            onChange={(e) => {
                              const alvo = destinos.find((d) => d.key === e.target.value);
                              moveTo(it, alvo || emptyEvent);
                            }}
                            aria-label="Mover para a pasta"
                            className="mt-1 w-full max-w-full truncate rounded-lg border border-white/10 bg-surface px-2 py-1 text-xs text-muted outline-none focus:border-accent"
                          >
                            {destinos.map((d) => (
                              <option key={d.key} value={d.key}>
                                {d.eventName} — {d.eventDate ? formatEventDate(d.eventDate) : "sem data"}
                              </option>
                            ))}
                            <option value="">Sem evento</option>
                          </select>
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
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {!loading && !items.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">
            Nenhuma foto ainda. Adicione as primeiras ao lado.
          </p>
        )}
      </div>

      <AnimatePresence>
        {cropping && (
          <CropModal
            src={cropping.url}
            naturalAspect={cropping.naturalAspect}
            confirmLabel="Usar recorte"
            onCancel={() => setCropping(null)}
            onConfirm={applyCrop}
          />
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
}

function EventFields({ value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm text-muted">Evento / projeto (PT)</label>
        <input
          value={value.eventName || ""}
          onChange={(e) => onChange({ eventName: e.target.value })}
          placeholder="Opcional — agrupa as fotos"
          className={field}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Evento / projeto (EN)</label>
        <input
          value={value.eventNameEn || ""}
          onChange={(e) => onChange({ eventNameEn: e.target.value })}
          placeholder="Vazio usa o nome em PT"
          className={field}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm text-muted">Data do evento</label>
        <input
          type="date"
          value={value.eventDate || ""}
          onChange={(e) => onChange({ eventDate: e.target.value })}
          className={field}
        />
      </div>
    </div>
  );
}
