"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { T } from "./I18n";
import { Magnetic } from "./Fx";

const STACK = ["Flutter", "Node.js", "NestJS", "ESP32", "Supabase"];

// Cada letra é um alvo: entra escalonada e reage ao passar o mouse.
function Letters({ text, from = 0, className = "" }) {
  let i = from;
  return text.split(" ").map((word, w) => (
    <span key={w} className="inline-block whitespace-nowrap">
      {[...word].map((ch) => (
        <span
          key={i}
          className={`rise inline-block transition-transform duration-300 hover:-translate-y-1.5 ${className}`}
          style={{ animationDelay: `${0.15 + i++ * 0.03}s` }}
        >
          {ch}
        </span>
      ))}
      {w < text.split(" ").length - 1 && <span className="inline-block w-[0.28em]" />}
    </span>
  ));
}

export default function Hero() {
  const [n, setN] = useState(0);
  const avatar = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setN((v) => v + 1), 2200);
    return () => clearInterval(id);
  }, [reduced]);

  // Inclina o retrato seguindo o ponteiro pela seção inteira (só no desktop).
  function tilt(e) {
    if (reduced || e.pointerType !== "mouse" || !avatar.current) return;
    const x = (e.clientX / innerWidth - 0.5) * 18;
    const y = (e.clientY / innerHeight - 0.5) * 14;
    avatar.current.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${-y}deg)`;
  }

  return (
    <section
      id="top"
      onPointerMove={tilt}
      onPointerLeave={() => avatar.current && (avatar.current.style.transform = "")}
      className="relative overflow-hidden px-6 pt-20 pb-24 text-center sm:pt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background: "radial-gradient(650px circle at 50% 0%, var(--accent-dim) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto mb-7 mt-4 h-[150px] w-[150px]">
        <div
          ref={avatar}
          className="relative h-full w-full transition-transform duration-500 ease-out will-change-transform"
        >
          <motion.div
            className="absolute -inset-1 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, var(--accent), #c79be0, #6c3483, var(--accent))",
            }}
            animate={reduced ? {} : { rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <div
            className="absolute -inset-4 rounded-full bg-accent opacity-40 blur-2xl"
            style={{ animation: reduced ? "none" : "floaty 4s ease-in-out infinite" }}
          />
          <Image
            src="/images/me.png"
            alt="João Augusto de Freitas, Desenvolvedor de Software"
            fill
            sizes="150px"
            priority
            className="relative rounded-full border-4 border-background object-cover"
          />
        </div>
      </div>

      <p className="rise eyebrow mb-4" style={{ animationDelay: "0.1s" }}>
        <T pt="Olá, eu sou" en="Hello, I'm" />
      </p>

      <h1 className="mb-5 text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-7xl">
        <Letters text="João Augusto" />
        <br />
        <span className="gradient-text">
          <Letters text="de Freitas" from={12} />
        </span>
      </h1>

      <p className="rise mx-auto mb-3 max-w-2xl text-lg text-muted sm:text-xl" style={{ animationDelay: "0.5s" }}>
        <T
          pt="Desenvolvedor de Software em São João da Boa Vista - SP"
          en="Software Developer based in São João da Boa Vista, Brazil"
        />
      </p>

      <p
        className="rise mb-9 flex items-center justify-center gap-2 text-base text-muted"
        style={{ animationDelay: "0.58s" }}
      >
        <T pt="construindo com" en="building with" />
        <span className="relative inline-flex h-6 min-w-[7.5rem] justify-start overflow-hidden text-left">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={n}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute font-mono font-medium text-accent-2"
            >
              {STACK[n % STACK.length]}
            </motion.span>
          </AnimatePresence>
        </span>
      </p>

      <div className="rise flex flex-wrap justify-center gap-4" style={{ animationDelay: "0.66s" }}>
        <Magnetic>
          <a href="#projetos" className="btn btn-primary sheen">
            <T pt="Ver Projetos" en="View Projects" />
            <i className="fa-solid fa-arrow-down text-xs" aria-hidden />
          </a>
        </Magnetic>
        <Magnetic>
          <a href="#contato" className="btn btn-ghost">
            <T pt="Vamos Conversar" en="Let's Talk" />
          </a>
        </Magnetic>
      </div>

      <a
        href="#sobre"
        aria-label="Rolar para a próxima seção"
        className="rise mx-auto mt-14 hidden h-10 w-6 items-start justify-center rounded-full border border-white/15 p-1.5 sm:flex"
        style={{ animationDelay: "0.8s" }}
      >
        <span
          className="h-2 w-1 rounded-full bg-accent-2"
          style={{ animation: reduced ? "none" : "floaty 1.8s ease-in-out infinite" }}
        />
      </a>
    </section>
  );
}
