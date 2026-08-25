import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Gallery from "@/components/Gallery";
import Skills from "@/components/Skills";
import ProjectsGrid from "@/components/ProjectsGrid";
import Timeline from "@/components/Timeline";
import Courses from "@/components/Courses";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { getHome, getGithubStats } from "@/lib/api";

// Duas camadas de cache, as duas com 60s e as duas invalidadas juntas quando o
// admin salva (lib/actions.js): esta, do HTML da página, e a dos fetch em
// lib/api.js (tag "home"). Com `expireTime: 3600` no next.config.mjs, o
// Cache-Control que vai pro CDN vira s-maxage=60, stale-while-revalidate=3540 —
// passados 60s o CDN serve a cópia velha NA HORA e revalida em background, em
// vez de segurar a resposta enquanto renderiza.
export const revalidate = 60;

// Ordem fixa de fallback: se a API do banco de seções estiver fora do ar ou a
// tabela ainda não tiver sido semeada, a home cai nessa ordem em vez de sumir
// seções inteiras.
const DEFAULT_ORDER = ["about", "gallery", "skills", "projects", "journey", "courses", "contact"];

export default async function Home() {
  // Duas chamadas, não nove: getHome() traz as 8 listas da API numa requisição só
  // (ver server/src/routes/home.js). Cada uma dessas 8 antes pagava DNS + TLS +
  // wake-up do Render por conta própria, 0,45s a 1,7s cada — e esse render é
  // bloqueante pra quem cai num cache expirado, e pro admin logo depois de salvar.
  const [home, github] = await Promise.all([
    getHome().catch(() => ({})),
    getGithubStats().catch(() => null),
  ]);

  const {
    projects = [],
    courses = [],
    journey = [],
    gallery = [],
    siteTexts = [],
    socialLinks = [],
    skills = [],
    homeSections = [],
  } = home;

  // getHome() já cai nas 8 rotas antigas se /api/home falhar, e cada uma delas tem
  // .catch(() => []) pra uma seção fora do ar não derrubar a home inteira. Mas se
  // TUDO voltou vazio a API caiu, e renderizar assim gravaria
  // uma home vazia no CDN por até `expireTime`. Lançar aqui faz o ISR descartar a
  // revalidação e continuar servindo a última versão boa.
  // A checagem NÃO vale no `next build`: lá, lançar quebraria o deploy inteiro em
  // vez de preservar cache (não existe cache anterior ainda).
  if (
    process.env.NEXT_PHASE !== "phase-production-build" &&
    !projects.length && !skills.length && !siteTexts.length
  ) {
    throw new Error("API indisponível: mantendo a versão anterior em cache");
  }

  const texts = Object.fromEntries(siteTexts.map((t) => [t.key, { pt: t.pt, en: t.en }]));
  const tech = skills.filter((s) => s.type === "tech");
  const soft = skills.filter((s) => s.type === "soft");

  const sectionEls = {
    about: (
      <About
        key="about"
        texts={texts}
        socialLinks={socialLinks}
        githubRepoCount={github?.publicRepos}
        fallbackProjectCount={projects.length}
        courseCount={courses.length + journey.length}
      />
    ),
    gallery: <Gallery key="gallery" items={gallery} />,
    skills: <Skills key="skills" tech={tech} soft={soft} />,
    projects: <ProjectsGrid key="projects" projects={projects} />,
    journey: <Timeline key="journey" items={journey} />,
    courses: <Courses key="courses" courses={courses} />,
    contact: <Contact key="contact" texts={texts} socialLinks={socialLinks} />,
  };

  const order = homeSections.length
    ? homeSections
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order)
        .map((s) => s.key)
    : DEFAULT_ORDER;

  return (
    <>
      <Nav texts={texts} />
      <main>
        <Hero texts={texts} />
        {order.map((key) => sectionEls[key]).filter(Boolean)}
      </main>
      <Footer texts={texts} />
    </>
  );
}
