"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";
import SocialLinks, { socials } from "./SocialLinks";
import { T } from "./I18n";
import { Magnetic } from "./Fx";

const EMAIL = "contato@joaoaugusto.dev";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  function copy() {
    // O `?.` na promise importa: sem HTTPS o clipboard não existe e o .then estouraria.
    navigator.clipboard?.writeText(EMAIL)?.then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <section id="contato" className="relative scroll-mt-2 overflow-hidden bg-surface/40 px-6 py-24 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(600px circle at 50% 100%, rgba(155,89,182,0.18), transparent 65%)",
        }}
      />
      <Reveal>
        <h2 className="section-title mb-6 text-4xl font-bold">
          <T pt="Vamos Conversar?" en="Let's Talk?" />
        </h2>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Magnetic strength={0.35}>
            <a
              href="https://wa.me/5519994943031"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary sheen"
            >
              <i className="fab fa-whatsapp text-lg" aria-hidden />
              <T pt="Chamar no WhatsApp" en="Message on WhatsApp" />
            </a>
          </Magnetic>

          {/* Copiar o e-mail sem sair da página — um clique, uma confirmação. */}
          <button onClick={copy} className="btn btn-ghost font-mono text-sm" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={String(copied)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <i
                  className={`fa-solid ${copied ? "fa-check text-accent-2" : "fa-copy"}`}
                  aria-hidden
                />
                {copied ? <T pt="E-mail copiado!" en="E-mail copied!" /> : EMAIL}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <p className="mb-5 mt-12 text-base text-accent-2">
          <T pt="Ou me encontre em:" en="Or find me at:" />
        </p>
        <SocialLinks large items={socials.filter((s) => s.label !== "WhatsApp" && s.label !== "Email")} />
      </Reveal>
    </section>
  );
}
