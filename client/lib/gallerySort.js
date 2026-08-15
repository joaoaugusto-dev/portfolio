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
