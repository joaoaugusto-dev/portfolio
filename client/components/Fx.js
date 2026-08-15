"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";

// ponytail: todos os efeitos "de base" moram aqui. São quatro primitivas pequenas
// usadas pelo site inteiro — separar em quatro arquivos só somaria imports.

/* -------------------------------------------------------------------------- */
/*  Campo de partículas + luz do ponteiro (uma camada fixa, atrás de tudo)     */
/* -------------------------------------------------------------------------- */

export default function Fx() {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    // Celular: menos partículas, sem as linhas de constelação (é o que enche a
    // fila de pintura em GPU integrada) e sem a luz que segue o ponteiro.
    const coarse = matchMedia("(hover: none)").matches;

    let w = 0, h = 0, parts = [], rings = [], raf = 0;
    const pointer = { x: -999, y: -999 };

    function resize() {
      // A barra de URL do celular entra e sai o tempo todo disparando `resize`.
      // Sem esse filtro, o campo inteiro era recriado a cada rolagem.
      if (w === innerWidth && Math.abs(h - innerHeight) < 140) return;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = innerWidth;
      h = innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(coarse ? 18 : 54, (w * h) / 26000));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.13,
        vy: (Math.random() - 0.5) * 0.13,
        r: Math.random() * 1.5 + 0.7,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        // Empurrão suave: as partículas abrem caminho pro cursor e voltam sozinhas.
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000 && d2 > 1) {
          const f = (1 - d2 / 14000) * 0.5;
          p.x += (dx / Math.sqrt(d2)) * f;
          p.y += (dy / Math.sqrt(d2)) * f;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(199,155,224,0.38)";
        ctx.fill();
      }

      if (!coarse) {
        ctx.lineWidth = 1;
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            const dx = parts[i].x - parts[j].x;
            const dy = parts[i].y - parts[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 > 15000) continue;
            ctx.strokeStyle = `rgba(155,89,182,${0.16 * (1 - d2 / 15000)})`;
            ctx.beginPath();
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
          }
        }

        // Teia até o ponteiro: as mesmas linhas de constelação, só que partindo do cursor.
        const reach = 26000;
        for (const p of parts) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > reach) continue;
          ctx.strokeStyle = `rgba(199,155,224,${0.4 * (1 - d2 / reach)})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      // Onda de clique: todo toque na tela devolve alguma coisa.
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.t += 0.028;
        if (r.t >= 1) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.t * 120, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(199,155,224,${0.35 * (1 - r.t)})`;
        ctx.lineWidth = 2 * (1 - r.t);
        ctx.stroke();
      }

      raf = requestAnimationFrame(frame);
    }

    let ticking = false;
    function onMove(e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (coarse || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // Uma escrita por frame; quem lê são só gradientes CSS (nada re-renderiza).
        document.documentElement.style.setProperty("--mx", `${(e.clientX / innerWidth) * 100}%`);
        document.documentElement.style.setProperty("--my", `${(e.clientY / innerHeight) * 100}%`);
        ticking = false;
      });
    }
    const onLeave = () => { pointer.x = pointer.y = -999; };
    const onDown = (e) => rings.length < 6 && rings.push({ x: e.clientX, y: e.clientY, t: 0 });
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    addEventListener("resize", resize);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <canvas
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[-2] h-full w-full"
      />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card com luz e borda que seguem o ponteiro                                */
/* -------------------------------------------------------------------------- */

export function Spot({ as: Tag = "div", className = "", children, ...rest }) {
  const rect = useRef(null);

  // Mede na entrada, não a cada movimento: getBoundingClientRect no meio do
  // pointermove forçaria recálculo de layout 60x por segundo.
  function enter(e) {
    if (e.pointerType !== "mouse") return;
    rect.current = e.currentTarget.getBoundingClientRect();
  }
  function move(e) {
    const r = rect.current;
    if (!r) return;
    e.currentTarget.style.setProperty("--px", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--py", `${e.clientY - r.top}px`);
  }

  return (
    <Tag onPointerEnter={enter} onPointerMove={move} className={`spot ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  Elemento que "puxa" o cursor                                              */
/* -------------------------------------------------------------------------- */

export function Magnetic({ children, strength = 0.3, className = "" }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  function move(e) {
    if (reduced || e.pointerType !== "mouse") return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }
  function leave() {
    ref.current.style.transform = "";
  }

  return (
    <span
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`inline-block will-change-transform ${className}`}
      style={{ transition: "transform .4s var(--ease-out)" }}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Número que conta ao entrar na tela                                        */
/* -------------------------------------------------------------------------- */

export function Counter({ to, duration = 1400, suffix = "", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {reduced ? to : n}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Aviso flutuante do painel                                                 */
/* -------------------------------------------------------------------------- */

export function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium shadow-xl backdrop-blur ${
            toast.type === "error"
              ? "bg-red-500/15 text-red-300 ring-1 ring-red-500/40"
              : "bg-accent/20 text-accent-2 ring-1 ring-accent/50"
          }`}
          role="status"
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  function show(msg, type = "ok") {
    clearTimeout(timer.current);
    setToast({ msg, type, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, show];
}
