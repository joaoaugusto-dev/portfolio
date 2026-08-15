const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getMedia(name) {
  const res = await fetch(`${API_URL}/api/files/meta/${encodeURIComponent(name)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Mídia não encontrada");
  return res.json();
}

export async function getProjects() {
  const res = await fetch(`${API_URL}/api/projects`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

export async function getCourses() {
  const res = await fetch(`${API_URL}/api/courses`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load courses");
  return res.json();
}

export async function getJourney() {
  const res = await fetch(`${API_URL}/api/journey`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load journey");
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
  uploadCover: (token, file) => {
    const form = new FormData();
    form.append("file", file);
    return authedFetch("/api/covers", token, { method: "POST", body: form });
  },
  listFiles: (token) => authedFetch("/api/files", token),
  // XHR em vez de fetch: é o único jeito de ler progresso real de bytes enviados
  // (fetch não expõe upload progress em todo navegador relevante).
  uploadFile: (token, file, { name, title, description } = {}, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    if (name) form.append("name", name);
    if (title) form.append("title", title);
    if (description) form.append("description", description);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/api/files`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded, e.total);
      };
      xhr.onload = () => {
        let body = {};
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          // resposta vazia (204) ou não-JSON
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(body);
        else reject(new Error(body.error || `Request failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Falha de rede no upload"));
      xhr.send(form);
    });
  },
  updateFile: (token, name, data) =>
    authedFetch(`/api/files/${encodeURIComponent(name)}`, token, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteFile: (token, name) =>
    authedFetch(`/api/files/${encodeURIComponent(name)}`, token, { method: "DELETE" }),
};
