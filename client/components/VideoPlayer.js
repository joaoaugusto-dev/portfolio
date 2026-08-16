"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fmt = (s) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

// Sem nenhum "progress" (bytes novos chegando) por esse tempo enquanto o
// vídeo está travado esperando dado, a conexão caiu de verdade — não é só
// uma rede lenta buferizando.
const STALL_TIMEOUT = 10000;

export default function VideoPlayer({ src, poster, title }) {
  const videoRef = useRef(null);
  const barRef = useRef(null);
  const hideTimer = useRef(null);
  const stallTimer = useRef(null);
  const wantsPlay = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  // Começa mudo: é a única forma de o navegador deixar autoplay tocar assim
  // que a página abre. O botão de som já resolve destravar o áudio depois.
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // Começa true: a página abre e já queremos o loading visível antes de
  // qualquer evento do <video> disparar.
  const [loading, setLoading] = useState(true);
  const [connectionLost, setConnectionLost] = useState(false);

  function clearStallTimer() {
    clearTimeout(stallTimer.current);
    stallTimer.current = null;
  }

  function armStallTimer() {
    clearStallTimer();
    stallTimer.current = setTimeout(() => setConnectionLost(true), STALL_TIMEOUT);
  }

  // Toca assim que der — o navegador já buferiza progressivamente sozinho
  // enquanto passa, sem precisar esperar um buffer mínimo antes de começar.
  // Se não tiver dado nenhum ainda, o próprio <video> dispara "waiting" (ver
  // abaixo), que é o que liga o loading.
  function requestPlay() {
    const v = videoRef.current;
    wantsPlay.current = true;
    setConnectionLost(false);
    v.play().catch(() => {
      // Navegador recusou o autoplay (modo economia de dados, política mais
      // estrita, etc.) — sem isso o loading ficava girando pra sempre. Volta
      // pro botão de play parado, esperando um clique.
      wantsPlay.current = false;
      setLoading(false);
    });
  }

  function togglePlay() {
    const v = videoRef.current;
    if (v.paused) requestPlay();
    else {
      wantsPlay.current = false;
      v.pause();
    }
  }

  function retryConnection() {
    const v = videoRef.current;
    const resumeAt = v.currentTime;
    v.load();
    v.currentTime = resumeAt;
    requestPlay();
  }

  function seekTo(clientX) {
    const bar = barRef.current;
    const v = videoRef.current;
    if (!bar || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setTime(v.currentTime);
  }

  function scheduleHide() {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2200);
  }

  useEffect(() => {
    const v = videoRef.current;
    const onTime = () => setTime(v.currentTime);
    const onDuration = () => setDuration(v.duration);
    const onProgress = () => {
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
      // Byte chegou: a rede está viva, não é queda de conexão — só adia o prazo.
      if (wantsPlay.current) clearStallTimer();
    };
    // "playing" (não "play"): dispara quando o vídeo REALMENTE está exibindo
    // quadros, não só quando play() foi chamado — é o sinal certo de tirar o loading.
    const onPlaying = () => {
      setPlaying(true);
      setLoading(false);
      clearStallTimer();
    };
    const onPause = () => setPlaying(false);
    // Travou por falta de dado — no início ou no meio do vídeo. O navegador
    // retoma sozinho assim que tiver o suficiente; só mostramos o loading
    // enquanto isso e armamos o prazo de "conexão caiu" nesse meio-tempo.
    const onWaiting = () => {
      if (wantsPlay.current) {
        setLoading(true);
        armStallTimer();
      }
    };
    const onError = () => {
      if (wantsPlay.current) setConnectionLost(true);
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDuration);
    v.addEventListener("progress", onProgress);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDuration);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("error", onError);
      clearStallTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- armStallTimer só usa refs e setState estáveis, recriar por render não muda o comportamento
  }, []);

  // Autoplay ao entrar na página — sem esperar clique nenhum. Toca o
  // elemento de vídeo (sistema externo), não é estado sincronizado do React.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o <video>, único jeito de tocar assim que a página abre
    requestPlay();
  }, []);

  useEffect(() => {
    const onScrub = (e) => scrubbing && seekTo(e.touches ? e.touches[0].clientX : e.clientX);
    const onScrubEnd = () => setScrubbing(false);
    window.addEventListener("mousemove", onScrub);
    window.addEventListener("mouseup", onScrubEnd);
    window.addEventListener("touchmove", onScrub);
    window.addEventListener("touchend", onScrubEnd);
    return () => {
      window.removeEventListener("mousemove", onScrub);
      window.removeEventListener("mouseup", onScrubEnd);
      window.removeEventListener("touchmove", onScrub);
      window.removeEventListener("touchend", onScrubEnd);
    };
  }, [scrubbing]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const progressPct = duration ? (time / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      className="relative w-full aspect-video bg-black overflow-hidden select-none group"
      onMouseMove={() => {
        setShowControls(true);
        scheduleHide();
      }}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        playsInline
        muted={muted}
        // Autoplay já força o carregamento de qualquer forma — preload é só
        // uma dica pra quando NÃO tem play() automático, então não muda nada aqui.
        preload="metadata"
        onVolumeChange={(e) => {
          setVolume(e.target.volume);
          setMuted(e.target.muted);
        }}
        // ponytail: sem <track>/legendas — o portfólio não tem vídeos com fala que precisem.
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Play/pause central, com pulso suave ao pausar */}
      <AnimatePresence>
        {!playing && !loading && !connectionLost && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span className="w-20 h-20 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              <i className="fa-solid fa-play text-3xl text-white ml-1" aria-hidden />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carregando buffer — no início ou depois de esvaziar no meio do vídeo */}
      <AnimatePresence>
        {loading && !connectionLost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
          >
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-white/90" aria-hidden />
            <span className="text-xs text-white/70">Carregando...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conexão caiu no meio do carregamento — dá pra tentar de novo do mesmo ponto */}
      <AnimatePresence>
        {connectionLost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-4 text-center"
          >
            <i className="fa-solid fa-wifi text-3xl text-white/80" aria-hidden />
            <p className="text-sm text-white/80">Perdemos a conexão com o vídeo.</p>
            <button
              onClick={retryConnection}
              className="rounded-lg border border-white/25 px-4 py-1.5 text-sm text-white transition-colors hover:border-accent-2 hover:text-accent-2"
            >
              <i className="fa-solid fa-rotate mr-2" aria-hidden />
              Tentar de novo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de controles */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls || !playing ? 1 : 0, y: showControls || !playing ? 0 : 8 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/80 to-transparent"
      >
        <div
          ref={barRef}
          onMouseDown={(e) => {
            setScrubbing(true);
            seekTo(e.clientX);
          }}
          onTouchStart={(e) => {
            setScrubbing(true);
            seekTo(e.touches[0].clientX);
          }}
          className="relative h-3 flex items-center cursor-pointer group/bar mb-2"
        >
          <div className="w-full h-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white/35" style={{ width: `${bufferedPct}%` }} />
          </div>
          <div
            className="absolute left-0 h-1 rounded-full bg-accent-2"
            style={{ width: `${progressPct}%` }}
          />
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-accent-2 shadow"
            animate={{ left: `calc(${progressPct}% - 6px)` }}
            transition={{ duration: scrubbing ? 0 : 0.1 }}
          />
        </div>

        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproduzir"} className="hover:text-accent-2">
            <i className={`fa-solid ${playing ? "fa-pause" : "fa-play"}`} aria-hidden />
          </button>

          <button
            onClick={() => (videoRef.current.muted = !videoRef.current.muted)}
            aria-label={muted ? "Ativar som" : "Mudo"}
            className="hover:text-accent-2"
          >
            <i
              className={`fa-solid ${muted || volume === 0 ? "fa-volume-xmark" : volume < 0.5 ? "fa-volume-low" : "fa-volume-high"}`}
              aria-hidden
            />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => {
              videoRef.current.volume = Number(e.target.value);
              videoRef.current.muted = false;
            }}
            className="w-16 accent-[var(--accent-2)]"
            aria-label="Volume"
          />

          <span className="text-xs tabular-nums text-white/80 ml-1">
            {fmt(time)} / {fmt(duration)}
          </span>

          <span className="flex-1" />

          <button
            onClick={() => {
              const el = videoRef.current.parentElement;
              if (fullscreen) document.exitFullscreen();
              else el.requestFullscreen();
            }}
            aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            className="hover:text-accent-2"
          >
            <i className={`fa-solid ${fullscreen ? "fa-compress" : "fa-expand"}`} aria-hidden />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
