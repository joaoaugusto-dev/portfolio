"use client";
import { useRef, useState } from "react";

// Pointer Events em vez de HTML5 Drag and Drop: a API nativa (draggable,
// onDragStart/onDragEnter) não existe em touch, então arrastar pra reordenar
// simplesmente não funcionava no celular. Pointer Events cobre mouse e touch
// com o mesmo código.
export default function useDragReorder(setList, onDrop) {
  const dragFrom = useRef(null);
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

  function start(e, index) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragFrom.current = index;
    setDragging(index);
  }

  function move(e) {
    if (dragFrom.current === null) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-drag-index]");
    if (!target) return;
    moveTo(Number(target.dataset.dragIndex));
  }

  function end() {
    if (dragFrom.current === null) return;
    dragFrom.current = null;
    setDragging(null);
    onDrop();
  }

  return { dragging, start, move, end };
}
