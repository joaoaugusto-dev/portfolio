"use client";
import { useRef, useState } from "react";

// Pointer Events em vez de HTML5 Drag and Drop: a API nativa (draggable,
// onDragStart/onDragEnter) não existe em touch, então arrastar pra reordenar
// simplesmente não funcionava no celular. Pointer Events cobre mouse e touch
// com o mesmo código.
// `group` é opcional — só entra quando a página tem várias listas soltas na
// tela ao mesmo tempo (ex.: uma por pasta), pra arrastar não pular de uma
// lista pra outra ao passar o ponteiro por cima.
export default function useDragReorder(setList, onDrop) {
  const dragFrom = useRef(null);
  const dragGroup = useRef(null);
  const [dragging, setDragging] = useState(null);

  function moveTo(to) {
    const from = dragFrom.current;
    if (from === null || from === to) return;
    setList((list) => {
      const next = [...list];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });
    dragFrom.current = to;
    setDragging(to);
  }

  function start(e, index, group = null) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragFrom.current = index;
    dragGroup.current = group;
    setDragging(index);
  }

  function move(e) {
    if (dragFrom.current === null) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-drag-index]");
    if (!target) return;
    if (dragGroup.current !== null && target.dataset.dragGroup !== dragGroup.current) return;
    moveTo(Number(target.dataset.dragIndex));
  }

  function end() {
    if (dragFrom.current === null) return;
    dragFrom.current = null;
    dragGroup.current = null;
    setDragging(null);
    onDrop();
  }

  return { dragging, start, move, end };
}
