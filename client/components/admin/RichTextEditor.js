"use client";
import { useEffect, useRef } from "react";

const buttons = [
  { cmd: "bold", icon: "fa-bold", label: "Negrito" },
  { cmd: "italic", icon: "fa-italic", label: "Itálico" },
];

// contentEditable + execCommand: sem lib de rich text pra só negrito/itálico.
export default function RichTextEditor({ value, onChange, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, [value]);

  return (
    <div className={className}>
      <div className="mb-1.5 flex gap-1">
        {buttons.map(({ cmd, icon, label }) => (
          <button
            key={cmd}
            type="button"
            aria-label={label}
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              document.execCommand(cmd);
              ref.current?.focus();
              onChange(ref.current?.innerHTML || "");
            }}
            className="h-8 w-8 rounded-lg border border-white/10 text-sm transition-colors hover:border-accent hover:text-accent-2"
          >
            <i className={`fa-solid ${icon}`} aria-hidden />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.13)] [&_strong]:font-bold [&_em]:italic"
        style={{ minHeight: "7.5rem" }}
      />
    </div>
  );
}
