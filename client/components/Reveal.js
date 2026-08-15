"use client";
import { motion, useReducedMotion } from "framer-motion";

export default function Reveal({ children, delay = 0, className = "", y = 26, scale = 1 }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      // ponytail: só opacity + transform. Blur/filter ficaria mais bonito, mas é o
      // efeito que derruba o frame rate em celular — e são dezenas de Reveal na página.
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
