"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { T, LangSwitch } from "./I18n";

const BITS = [
  "fa-solid fa-laptop-code", "fa-solid fa-keyboard", "fa-solid fa-desktop",
  "fa-solid fa-code", "fa-solid fa-terminal", "fa-solid fa-bug",
  "fa-solid fa-microchip", "fa-solid fa-database",
];
const GLYPHS = ["{}", "</>", ";", "$", "#", "()", "=>", "[]", "&&", "0", "1"];

const links = [
  ["sobre", "Sobre", "About", "fa-solid fa-user"],
  ["skills", "Habilidades", "Skills", "fa-solid fa-code"],
  ["projetos", "Projetos", "Projects", "fa-solid fa-diagram-project"],
  ["jornada", "Jornada", "Journey", "fa-solid fa-route"],
  ["cursos", "Cursos", "Courses", "fa-solid fa-graduation-cap"],
  ["contato", "Contato", "Contact", "fa-solid fa-paper-plane"],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [hideDock, setHideDock] = useState(false);
  const bar = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const taps = useRef({ count: 0, timer: null });
  const [bursts, setBursts] = useState([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const y = scrollY;
      setScrolled(y > 8);
      // scaleX em vez de width: a barra de progresso não reflui a página a cada pixel.
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      setHideDock(y > last + 4 && y > 300);
      last = y;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // Marca a seção que está no meio da tela — sem listener de scroll extra.
  useEffect(() => {
    if (!isHome) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    for (const [id] of links) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [isHome]);

  // Cada clique solta uma explosãozinha de elementos de dev por trás do nome.
  function burst(strength) {
    if (reduced) return;
    const n = 6 + Math.round(strength * 6);
    const id = Date.now() + Math.random();
    const particles = Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 45 + Math.random() * 55 + strength * 40;
      const isIcon = Math.random() < 0.45;
      return {
        i,
        icon: isIcon ? BITS[Math.floor(Math.random() * BITS.length)] : null,
        glyph: isIcon ? null : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 10, // leve empurrão pra cima
        rotate: (Math.random() - 0.5) * 240,
        scale: 0.7 + Math.random() * 0.8,
      };
    });
    setBursts((b) => [...b, { id, particles }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 900);
  }

  // Easter egg: 10 cliques no nome abrem a área restrita (sem link visível).
  function onNameClick() {
    clearTimeout(taps.current.timer);
    taps.current.count += 1;
    burst(taps.current.count / 10);
    if (taps.current.count >= 10) {
      taps.current.count = 0;
      router.push("/estudio");
      return;
    }
    taps.current.timer = setTimeout(() => (taps.current.count = 0), 1200);
  }

  const wordmark = (
    <>
      JOÃO AUGUSTO<span className="gradient-text">.dev</span>
    </>
  );

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "glass border-b border-accent/10" : "bg-transparent"
        }`}
      >
        <div
          ref={bar}
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-accent-deep via-accent to-accent-2"
          aria-hidden
        />
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {isHome ? (
            <button
              type="button"
              onClick={onNameClick}
              aria-label="João Augusto .dev"
              className="relative cursor-pointer select-none font-semibold tracking-tight"
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <AnimatePresence>
                  {bursts.map((b) =>
                    b.particles.map((p) => (
                      <motion.span
                        key={`${b.id}-${p.i}`}
                        className="absolute text-xs text-accent-2/80"
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
                        animate={{ x: p.x, y: p.y, scale: p.scale, opacity: [0, 1, 0], rotate: p.rotate }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {p.icon ? <i className={p.icon} aria-hidden /> : p.glyph}
                      </motion.span>
                    ))
                  )}
                </AnimatePresence>
              </span>
              <span className="relative">{wordmark}</span>
            </button>
          ) : (
            // Fora da home não tem o que a nav do meio ofereceria (âncoras de seção,
            // troca de idioma) nem o easter egg — clicar no nome só volta pro portfólio.
            <Link href="/" className="font-semibold tracking-tight">
              {wordmark}
            </Link>
          )}

          {isHome && (
            <>
              <div className="hidden items-center gap-1 text-sm text-muted md:flex">
                {links.map(([id, pt, en]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="relative rounded-full px-3 py-1.5 transition-colors hover:text-accent-2"
                    style={active === id ? { color: "var(--foreground)" } : undefined}
                  >
                    {active === id && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-accent/18 ring-1 ring-accent/30"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <T pt={pt} en={en} />
                  </a>
                ))}
              </div>
              <LangSwitch />
            </>
          )}
        </nav>
      </header>

      {/* Doca inferior: no celular a nav do topo não cabe, e o polegar chega aqui. */}
      {isHome && (
        <motion.nav
          aria-label="Seções"
          animate={{ y: hideDock ? 120 : 0, opacity: hideDock ? 0 : 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass fixed inset-x-3 bottom-3 z-50 flex items-center justify-between rounded-2xl border border-white/10 px-1.5 py-1.5 shadow-2xl shadow-black/50 md:hidden"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          {links.map(([id, pt, en, icon]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-label={pt}
              className="relative flex h-11 flex-1 items-center justify-center rounded-xl text-base transition-colors"
              style={{ color: active === id ? "var(--accent-2)" : "var(--muted)" }}
            >
              {active === id && (
                <motion.span
                  layoutId="dock-pill"
                  className="absolute inset-0 rounded-xl bg-accent/20"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <i className={`${icon} relative`} aria-hidden />
              <span className="sr-only">
                <T pt={pt} en={en} />
              </span>
            </a>
          ))}
        </motion.nav>
      )}
    </>
  );
}
