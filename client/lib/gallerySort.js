// Mais recente primeiro; sem data vai pro fim. "YYYY-MM-DD" compara certo
// como string, sem precisar passar por Date. Usado na home (Gallery.js) e no
// admin (GalleryAdmin.js) pra mostrarem a mesma ordem.
export function sortGalleryByDate(items) {
  return [...items].sort((a, b) => {
    if (!a.eventDate && !b.eventDate) return 0;
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return b.eventDate.localeCompare(a.eventDate);
  });
}

// Chave da "pasta": nome do evento + data. Só o nome PT entra na chave — o
// nome EN é tradução da mesma pasta, não outra pasta.
export function eventKey(it) {
  return it.eventName ? `${it.eventName}|${it.eventDate || ""}` : null;
}

// Agrupa por corridas consecutivas do mesmo evento — o array já chega ordenado
// por data (mais recente primeiro), então fotos do mesmo evento sempre ficam
// adjacentes. Fotos sem evento caem num grupo sem título (key null).
export function groupByEvent(items) {
  const groups = [];
  for (const it of items) {
    const key = eventKey(it);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(it);
    else
      groups.push({
        key,
        eventName: it.eventName,
        eventNameEn: it.eventNameEn,
        eventDate: it.eventDate,
        items: [it],
      });
  }
  return groups;
}

// "YYYY-MM-DD" -> Date local, sem passar por UTC (evita cair no dia anterior
// em fusos negativos, tipo Brasil).
export function formatEventDate(dateStr, lang = "pt") {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
