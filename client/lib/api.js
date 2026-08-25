// Os dois hosts vêm do ambiente. NEXT_PUBLIC_* é trocado por string literal no
// BUILD — não custa nada em runtime, é igual a uma constante — mas por isso mesmo
// mudar o valor na Vercel só vale depois de um redeploy.
//
// NEXT_PUBLIC_API_URL     principal. Em dev: http://localhost:4000
// NEXT_PUBLIC_API_URL_2   reserva. Em dev: não defina (ver abaixo)
//
// Em produção o principal é o servidor caseiro (~0,11s por endpoint, contra
// 0,45-1,7s do Render) e a reserva é o Render. HTTPS nos dois, nunca HTTP: o
// painel do admin chama a API do navegador, e página https buscando http é
// mixed content — o browser bloqueia e o admin para de salvar.
const RAW_PRIMARY = process.env.NEXT_PUBLIC_API_URL;
const RAW_FALLBACK = process.env.NEXT_PUBLIC_API_URL_2;

// Explode no build, não em produção. Sem isso, variável faltando produzia
// `undefined/api/projects`: a home renderizava vazia, ia pro cache assim, e nada
// no log dizia o porquê. Falhar aqui transforma um site quebrado em silêncio num
// deploy que não passa, com o motivo escrito.
if (!RAW_PRIMARY) {
  throw new Error(
    "NEXT_PUBLIC_API_URL não definida. Defina a URL da API (dev: http://localhost:4000). " +
      "Opcional: NEXT_PUBLIC_API_URL_2 como reserva, usada se a principal cair.",
  );
}

// Barra no fim removida: com ela toda chamada virava `https://host//api/projects`,
// e servidor com barra dupla pode responder 404. É erro que só aparece depois de
// deployado, porque quem digita a variável não vê a concatenação.
const trim = (u) => u.replace(/\/+$/, "");

const API_URL = trim(RAW_PRIMARY);

// Sem reserva definida, não tem failover — é o caso de dev: se o seu server local
// não estiver de pé, é pra dar erro na cara, não pra ler silenciosamente os dados
// de produção achando que são os seus. O filtro de igualdade evita que uma reserva
// idêntica à principal faça o mesmo host ser tentado duas vezes.
const HOSTS = [...new Set([API_URL, RAW_FALLBACK && trim(RAW_FALLBACK)].filter(Boolean))];

// GET no principal; se ele falhar, no reserva.
//
// Só troca de host em erro de REDE ou 5xx. 404/4xx é resposta definitiva de um
// servidor saudável e fica onde está — importa agora, porque /api/home só existe
// depois que o server for deployado: sem essa regra toda visita iria bater no
// Render à toa antes de cair no caminho antigo.
//
// Sem timeout de propósito: o principal está atrás do Cloudflare, então origem
// fora do ar vira 5xx rápido (522/523), não conexão pendurada.
async function getJSON(path, opts) {
  let last;
  for (const base of HOSTS) {
    let res;
    try {
      res = await fetch(`${base}${path}`, opts);
    } catch (err) {
      last = err; // host inalcançável: tenta o próximo
      continue;
    }
    if (res.ok) return res.json();
    last = new Error(`${path} respondeu ${res.status}`);
    if (res.status < 500) throw last; // 4xx: resposta definitiva, não troca de host
  }
  throw last;
}

// `no-store` aqui não deixava só o Data Cache de fora: ele marca a rota inteira
// como dinâmica. O `revalidate = 60` da home virava enfeite (`next build`
// mostrava `ƒ /`, não ISR) e TODA visita renderizava na hora, esperando a API
// no Render — que no plano free dorme depois de 15min e acorda em segundos.
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

// Uma chamada em vez de oito. As 8 rotas individuais continuam existindo (o admin
// usa cada uma), então se esta falhar — API antiga ainda no ar, deploy pela metade —
// a home cai no caminho antigo em vez de aparecer vazia.
export async function getHome(opts = CACHED) {
  try {
    return await getJSON("/api/home", opts);
  } catch {
    const [projects, courses, journey, gallery, socialLinks, skills, siteTexts, homeSections] =
      await Promise.all([
        getProjects(opts).catch(() => []),
        getCourses(opts).catch(() => []),
        getJourney(opts).catch(() => []),
        getGallery(opts).catch(() => []),
        getSocialLinks(opts).catch(() => []),
        getSkills(opts).catch(() => []),
        getSiteTexts(opts).catch(() => []),
        getHomeSections(opts).catch(() => []),
      ]);
    return { projects, courses, journey, gallery, socialLinks, skills, siteTexts, homeSections };
  }
}

export async function getProjects(opts = CACHED) {
  return getJSON("/api/projects", opts);
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

async function authedFetch(path, token, options = {}) {
  const init = {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  // Leitura do admin cai pro reserva igual à home. GRAVAÇÃO não: os dois hosts
  // falam com o MESMO banco, então repetir um POST/PUT que talvez já tenha sido
  // processado (a resposta é que se perdeu) duplicaria o registro. Se o principal
  // estiver fora, o admin dá erro e você tenta de novo — é o comportamento certo.
  const hosts = options.method && options.method !== "GET" ? [API_URL] : HOSTS;

  let res, last;
  for (const base of hosts) {
    try {
      res = await fetch(`${base}${path}`, init);
    } catch (err) {
      last = err;
      res = undefined;
      continue;
    }
    if (res.ok || res.status < 500) break;
    last = new Error(`Request failed (${res.status})`);
  }
  if (!res) throw last;

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
