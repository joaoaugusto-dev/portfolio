"use client";
import { useState } from "react";

function moved(list, from, to) {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

// Setas em vez de arrastar: o gesto de pointer drag ficava instável (touch
// perdia o alvo, mouse pulava item), e salvar a cada solta do dedo dava erro
// de rede toda hora. Aqui mover só mexe no estado local e marca "dirty" — só
// vai pro servidor quando o usuário clica em "Salvar ordem", uma vez, com o
// array inteiro.
export default function useReorder(list, setList, onSave) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function move(i, dir) {
    const to = i + dir;
    if (to < 0 || to >= list.length) return;
    setList(moved(list, i, to));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      await onSave();
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return { dirty, saving, moveUp: (i) => move(i, -1), moveDown: (i) => move(i, 1), save };
}
