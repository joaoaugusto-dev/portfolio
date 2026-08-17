"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";
import SocialLinks from "./SocialLinks";
import { T } from "./I18n";
import { Magnetic } from "./Fx";
import { tx } from "@/lib/siteText";

export default function Contact({ texts, socialLinks = [] }) {
  const [copied, setCopied] = useState(false);

  const heading = tx(texts, "contact.heading", "Vamos Conversar?", "Let's Talk?");
  const whatsappCta = tx(texts, "contact.whatsappCta", "Chamar no WhatsApp", "Message on WhatsApp");
  const emailCopiedMsg = tx(texts, "contact.emailCopied", "E-mail copiado!", "E-mail copied!");
  const findMe = tx(texts, "contact.findMe", "Ou me encontre em:", "Or find me at:");

  const whatsapp = socialLinks.find((s) => s.label === "WhatsApp");
  const emailLink = socialLinks.find((s) => s.label === "Email");
  const email = emailLink?.href?.replace(/^mailto:/, "") || "";
  const others = socialLinks.filter((s) => s.label !== "WhatsApp" && s.label !== "Email");

  function copy() {
    // O `?.` na promise importa: sem HTTPS o clipboard não existe e o .then estouraria.
    navigator.clipboard?.writeText(email)?.then(() => {
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
          <T pt={heading.pt} en={heading.en} />
        </h2>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {whatsapp && (
            <Magnetic strength={0.35}>
              <a
                href={whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary sheen"
              >
                <i className={`${whatsapp.icon} text-lg`} aria-hidden />
                <T pt={whatsappCta.pt} en={whatsappCta.en} />
              </a>
            </Magnetic>
          )}

          {/* Copiar o e-mail sem sair da página — um clique, uma confirmação. */}
          {email && (
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
                  {copied ? <T pt={emailCopiedMsg.pt} en={emailCopiedMsg.en} /> : email}
                </motion.span>
              </AnimatePresence>
            </button>
          )}
        </div>

        <p className="mb-5 mt-12 text-base text-accent-2">
          <T pt={findMe.pt} en={findMe.en} />
        </p>
        <SocialLinks large items={others} />
      </Reveal>
    </section>
  );
}
