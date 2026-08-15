"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fmt = (s) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

export default function VideoPlayer({ src, title }) {
  const videoRef = useRef(null);
  const barRef = useRef(null);
  const hideTimer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  function togglePlay() {
    const v = videoRef.current;
    if (v.paused) v.play();
    else v.pause();
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
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDuration);
    v.addEventListener("progress", onProgress);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDuration);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
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
        className="w-full h-full"
        playsInline
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
        {!playing && (
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
