const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Os fetches de conteúdo vão sem cache de propósito. Antes tinham
// `next: { revalidate: 60 }`, e o Data Cache do Next ficava servindo a resposta
// velha da API: a home até regenerava (a Vercel voltava na origem), só que
// renderizava em cima de dados antigos — o site travou em 9 fotos com 13 no
// banco. Sem Data Cache sobra uma camada só de cache, a da página (ISR, ver
// `revalidate` em app/page.js), que é a que comprovadamente funciona.

export async function getMedia(name) {
  const res = await fetch(`${API_URL}/api/files/meta/${encodeURIComponent(name)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Mídia não encontrada");
  return res.json();
}

export async function getProjects() {
  const res = await fetch(`${API_URL}/api/projects`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

export async function getCourses() {
  const res = await fetch(`${API_URL}/api/courses`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load courses");
  return res.json();
}

export async function getJourney() {
  const res = await fetch(`${API_URL}/api/journey`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load journey");
  return res.json();
}

export async function getGallery() {
  const res = await fetch(`${API_URL}/api/gallery`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load gallery");
  return res.json();
}

export async function getGithubStats(username = "joaoaugusto-dev") {
  const res = await fetch(`https://api.github.com/users/${username}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to load GitHub stats");
  const data = await res.json();
  return { publicRepos: data.public_repos ?? 0 };
}

async function authedFetch(path, token, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  createProject: (token, data) =>
    authedFetch("/api/projects", token, { method: "POST", body: JSON.stringify(data) }),
  updateProject: (token, id, data) =>
    authedFetch(`/api/projects/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (token, id) =>
    authedFetch(`/api/projects/${id}`, token, { method: "DELETE" }),
  reorderProjects: (token, ids) =>
    authedFetch("/api/projects/reorder", token, { method: "PUT", body: JSON.stringify({ ids }) }),
  createCourse: (token, data) =>
    authedFetch("/api/courses", token, { method: "POST", body: JSON.stringify(data) }),
  updateCourse: (token, id, data) =>
    authedFetch(`/api/courses/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
  deleteCourse: (token, id) =>
    authedFetch(`/api/courses/${id}`, token, { method: "DELETE" }),
  reorderCourses: (token, ids) =>
    authedFetch("/api/courses/reorder", token, { method: "PUT", body: JSON.stringify({ ids }) }),
  createJourneyItem: (token, data) =>
    authedFetch("/api/journey", token, { method: "POST", body: JSON.stringify(data) }),
  updateJourneyItem: (token, id, data) =>
    authedFetch(`/api/journey/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
  deleteJourneyItem: (token, id) =>
    authedFetch(`/api/journey/${id}`, token, { method: "DELETE" }),
  reorderJourneyItems: (token, ids) =>
    authedFetch("/api/journey/reorder", token, { method: "PUT", body: JSON.stringify({ ids }) }),
  createGalleryItem: (token, data) =>
    authedFetch("/api/gallery", token, { method: "POST", body: JSON.stringify(data) }),
  updateGalleryItem: (token, id, data) =>
    authedFetch(`/api/gallery/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
  deleteGalleryItem: (token, id) =>
    authedFetch(`/api/gallery/${id}`, token, { method: "DELETE" }),
  uploadCover: (token, file) => {
    const form = new FormData();
    form.append("file", file);
    return authedFetch("/api/covers", token, { method: "POST", body: form });
  },
  listFiles: (token) => authedFetch("/api/files", token),
  getStorageUsage: (token) => authedFetch("/api/files/usage", token),
  // O arquivo vai direto do navegador pro R2 (URL assinada) — nunca passa pela
  // memória do servidor, essencial pra vídeo grande não derrubar o Render. XHR
  // em vez de fetch pro PUT porque é o único jeito de ler progresso real de
  // bytes enviados (fetch não expõe upload progress em todo navegador relevante).
  uploadFile: async (token, file, { name, title, description } = {}, onProgress) => {
    const presign = await authedFetch("/api/files/presign", token, {
      method: "POST",
      body: JSON.stringify({ filename: file.name, mimetype: file.type || "application/octet-stream", size: file.size, name }),
    });

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presign.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded, e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Falha ao enviar pro storage (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Falha de rede no upload"));
      xhr.send(file);
    });

    return authedFetch("/api/files/complete", token, {
      method: "POST",
      body: JSON.stringify({ name: presign.name, title, description }),
    });
  },
  updateFile: (token, name, data) =>
    authedFetch(`/api/files/${encodeURIComponent(name)}`, token, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteFile: (token, name) =>
    authedFetch(`/api/files/${encodeURIComponent(name)}`, token, { method: "DELETE" }),
  // `image`: Blob/File pra usar como miniatura direto. `atSeconds`: pede pro
  // servidor recortar o frame nesse instante do vídeo já enviado (alternativa
  // caso o recorte no browser, via canvas, não seja possível).
  setPoster: (token, name, { image, atSeconds } = {}) => {
    const form = new FormData();
    if (image) form.append("file", image, "poster.jpg");
    if (atSeconds != null) form.append("atSeconds", String(atSeconds));
    return authedFetch(`/api/files/${encodeURIComponent(name)}/poster`, token, { method: "POST", body: form });
  },
};
