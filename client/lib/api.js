// O host vem do ambiente. NEXT_PUBLIC_* é trocado por string literal no
// BUILD — não custa nada em runtime, é igual a uma constante — mas por isso mesmo
// mudar o valor só vale depois de um novo build (deploy).
//
// NEXT_PUBLIC_API_URL     principal. Em dev: http://localhost:4000
// API_INTERNAL_URL        só no servidor (não é NEXT_PUBLIC, lida em runtime)
//
// Em produção a API é o servidor caseiro. HTTPS, nunca HTTP: o painel do admin
// chama a API do navegador, e página https buscando http é mixed content — o
// browser bloqueia e o admin para de salvar.
//
// API_INTERNAL_URL: o Next roda no mesmo servidor que a API, então do lado do
// servidor ele fala com ela direto pela rede interna, sem dar a volta pela
// Cloudflare. E é isso que deixa a API distinguir o Next (sem X-Forwarded-For)
// de um visitante no limite de taxa das imagens — ver routes/files.js.
const RAW_PRIMARY =
  (typeof window === "undefined" && process.env.API_INTERNAL_URL) || process.env.NEXT_PUBLIC_API_URL;

// Explode no build, não em produção. Sem isso, variável faltando produzia
// `undefined/api/projects`: a home renderizava vazia, ia pro cache assim, e nada
// no log dizia o porquê. Falhar aqui transforma um site quebrado em silêncio num
// deploy que não passa, com o motivo escrito.
if (!RAW_PRIMARY) {
  throw new Error(
    "NEXT_PUBLIC_API_URL não definida. Defina a URL da API (dev: http://localhost:4000).",
  );
}

// Barra no fim removida: com ela toda chamada virava `https://host//api/projects`,
// e servidor com barra dupla pode responder 404. É erro que só aparece depois de
// deployado, porque quem digita a variável não vê a concatenação.
const trim = (u) => u.replace(/\/+$/, "");

const API_URL = trim(RAW_PRIMARY);

// Repassa um GET binário (imagem/vídeo/pdf) em streaming, sem dar parse. Usado pelas rotas de proxy de capas/mídia, que deixam os links no domínio
// do site. `range` repassa o Range do navegador — sem isso todo seek de vídeo
// voltava como GET completo (200, do zero) e o <video> reiniciava do início.
//
// Os cabeçalhos passam por lista fechada. Inclui os de segurança: a API força
// download (content-disposition) e nosniff em SVG/HTML enviados, pra não rodarem
// script no domínio do site — descartar esses dois aqui anulava a proteção.
// Sem cache-control inventado: um 404 não pode ficar preso em cache.
const PASS = ["content-type", "content-length", "content-range", "accept-ranges", "cache-control", "content-disposition", "x-content-type-options"];

export async function proxyBinary(path, range) {
  const res = await fetch(`${API_URL}${path}`, range ? { headers: { range } } : undefined);
  const headers = {};
  for (const h of PASS) if (res.headers.has(h)) headers[h] = res.headers.get(h);
  return new Response(res.body, { status: res.status, headers });
}

// Sem timeout de propósito: pela rede interna a API responde ou recusa na hora;
// pela Cloudflare, origem fora do ar vira 5xx rápido (522/523).
async function getJSON(path, opts) {
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) throw new Error(`${path} respondeu ${res.status}`);
  return res.json();
}

// `no-store` aqui não deixava só o Data Cache de fora: ele marca a rota inteira
// como dinâmica. O `revalidate = 60` da home virava enfeite (`next build`
// mostrava `ƒ /`, não ISR) e TODA visita renderizava na hora, esperando a API
// (na época num plano free que dormia depois de 15min e levava segundos pra acordar).
// Era o TTFB de 4,4s no mobile.
//
// `tags: ["home"]` é o que faz o botão salvar do admin funcionar de verdade.
// `revalidatePath("/")` limpa o Full Route Cache, mas a invalidação do Data Cache
// (o que guarda ESTES fetch) por caminho é a parte que não dá pra contar — era
// por isso que salvar no painel parecia não mudar nada: a rota re-renderizava e
// tornava a montar a página com os MESMOS dados velhos daqui. Com uma tag
// explícita, o `updateTag("home")` de lib/actions.js derruba as duas camadas
// juntas, sempre.
const CACHED = { next: { revalidate: 60, tags: ["home"] } };

// O admin lê pra editar: precisa do banco agora, não de até 60s atrás.
export const FRESH = { cache: "no-store" };

export async function getMedia(name) {
  return getJSON(`/api/files/meta/${encodeURIComponent(name)}`, { cache: "no-store" });
}

// Uma chamada em vez de oito (ver server/src/routes/home.js). As rotas
// individuais continuam existindo porque o admin usa cada uma.
export async function getHome(opts = CACHED) {
  return getJSON("/api/home", opts);
}

export async function getProjects(opts = CACHED) {
  return getJSON("/api/projects", opts);
}

export async function getNews(opts = CACHED) {
  return getJSON("/api/news", opts);
}

export async function getCourses(opts = CACHED) {
  return getJSON("/api/courses", opts);
}

export async function getJourney(opts = CACHED) {
  return getJSON("/api/journey", opts);
}

export async function getGallery(opts = CACHED) {
  return getJSON("/api/gallery", opts);
}

export async function getSocialLinks(opts = CACHED) {
  return getJSON("/api/social-links", opts);
}

export async function getSkills(opts = CACHED) {
  return getJSON("/api/skills", opts);
}

export async function getSiteTexts(opts = CACHED) {
  return getJSON("/api/site-texts", opts);
}

export async function getHomeSections(opts = CACHED) {
  return getJSON("/api/home-sections", opts);
}

export async function getGithubStats(username = "joaoaugusto-dev") {
  const res = await fetch(`https://api.github.com/users/${username}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to load GitHub stats");
  const data = await res.json();
  return { publicRepos: data.public_repos ?? 0 };
}

export const TOKEN_KEY = "admin_token";

export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Falha no login (${res.status})`);
  return body;
}

async function authedFetch(path, token, options = {}) {
  const init = {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  const res = await fetch(`${API_URL}${path}`, init);

  // Token vencido ou inválido (ex.: JWT_SECRET trocado): volta pro login em vez
  // de deixar o painel aberto dando erro em todo salvar.
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    location.reload();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// 50MB: metade do teto da Cloudflare por requisição, com folga.
const UPLOAD_CHUNK = 50 * 1024 * 1024;

// Um pedaço do arquivo num PUT. XHR em vez de fetch porque é o único jeito de
// ler progresso real de bytes enviados. Nunca rejeita: devolve { status, body }
// (status 0 = falha de rede) e quem chama decide se reenvia.
function putChunk(url, token, type, file, start, end, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", type);
    xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${file.size}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded);
    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => resolve({ status: 0, body: {} });
    xhr.send(file.slice(start, end));
  });
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
  createNews: (token, data) =>
    authedFetch("/api/news", token, { method: "POST", body: JSON.stringify(data) }),
  updateNews: (token, id, data) =>
    authedFetch(`/api/news/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
  deleteNews: (token, id) =>
    authedFetch(`/api/news/${id}`, token, { method: "DELETE" }),
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
  reorderGallery: (token, ids) =>
    authedFetch("/api/gallery/reorder", token, { method: "PUT", body: JSON.stringify({ ids }) }),
  createSocialLink: (token, data) =>
    authedFetch("/api/social-links", token, { method: "POST", body: JSON.stringify(data) }),
  updateSocialLink: (token, id, data) =>
    authedFetch(`/api/social-links/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
  deleteSocialLink: (token, id) =>
    authedFetch(`/api/social-links/${id}`, token, { method: "DELETE" }),
  reorderSocialLinks: (token, ids) =>
    authedFetch("/api/social-links/reorder", token, { method: "PUT", body: JSON.stringify({ ids }) }),
  createSkill: (token, data) =>
    authedFetch("/api/skills", token, { method: "POST", body: JSON.stringify(data) }),
  updateSkill: (token, id, data) =>
    authedFetch(`/api/skills/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
  deleteSkill: (token, id) =>
    authedFetch(`/api/skills/${id}`, token, { method: "DELETE" }),
  reorderSkills: (token, ids) =>
    authedFetch("/api/skills/reorder", token, { method: "PUT", body: JSON.stringify({ ids }) }),
  createSiteText: (token, data) =>
    authedFetch("/api/site-texts", token, { method: "POST", body: JSON.stringify(data) }),
  updateSiteText: (token, id, data) =>
    authedFetch(`/api/site-texts/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
  deleteSiteText: (token, id) =>
    authedFetch(`/api/site-texts/${id}`, token, { method: "DELETE" }),
  reorderHomeSections: (token, keys) =>
    authedFetch("/api/home-sections/reorder", token, { method: "PUT", body: JSON.stringify({ keys }) }),
  setHomeSectionVisible: (token, key, visible) =>
    authedFetch(`/api/home-sections/${encodeURIComponent(key)}/visible`, token, {
      method: "PUT",
      body: JSON.stringify({ visible }),
    }),
  uploadCover: (token, file) => {
    const form = new FormData();
    form.append("file", file);
    return authedFetch("/api/covers", token, { method: "POST", body: form });
  },
  listFiles: (token) => authedFetch("/api/files", token),
  getStorageUsage: (token) => authedFetch("/api/files/usage", token),
  // O arquivo vai em PUTs pra API (ver putChunk), que junta e manda pro bucket
  // em streaming — nunca fica inteiro na memória do servidor.
  uploadFile: async (token, file, { name, title, description } = {}, onProgress) => {
    const presign = await authedFetch("/api/files/presign", token, {
      method: "POST",
      body: JSON.stringify({ filename: file.name, mimetype: file.type || "application/octet-stream", size: file.size, name }),
    });

    // Em pedaços: o túnel da Cloudflare recusa corpo acima de 100MB por
    // requisição. Pedaço que falha por rede/5xx é reenviado (até 3 vezes); se o
    // servidor responde 409 { received }, o envio continua de onde ele parou.
    const url = `${API_URL}${presign.uploadUrl}`;
    const type = file.type || "application/octet-stream";
    let offset = 0;
    let tries = 0;
    while (offset < file.size) {
      const end = Math.min(offset + UPLOAD_CHUNK, file.size);
      const r = await putChunk(url, token, type, file, offset, end, (sent) => onProgress?.(offset + sent, file.size));
      if (r.status === 202 || r.status === 204) {
        offset = end;
        tries = 0;
      } else if (r.status === 409 && typeof r.body.received === "number") {
        offset = r.body.received;
      } else if ((r.status === 0 || r.status >= 500) && ++tries <= 3) {
        await new Promise((ok) => setTimeout(ok, 2000 * tries));
      } else {
        throw new Error(r.body.error || (r.status ? `Falha ao enviar o arquivo (${r.status})` : "Falha de rede no upload"));
      }
    }

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
