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
import {
  getProjects,
  getCourses,
  getJourney,
  getGithubStats,
  getGallery,
  getSiteTexts,
  getSocialLinks,
  getSkills,
  getHomeSections,
} from "@/lib/api";

// Único cache que sobrou da home: a página é regerada no máximo a cada 60s, e
// cada regeneração busca os dados na API sem cache (ver lib/api.js).
export const revalidate = 60;

// Ordem fixa de fallback: se a API do banco de seções estiver fora do ar ou a
// tabela ainda não tiver sido semeada, a home cai nessa ordem em vez de sumir
// seções inteiras.
const DEFAULT_ORDER = ["about", "gallery", "skills", "projects", "journey", "courses", "contact"];

export default async function Home() {
  const [projects, courses, journey, github, gallery, siteTexts, socialLinks, skills, homeSections] =
    await Promise.all([
      getProjects().catch(() => []),
      getCourses().catch(() => []),
      getJourney().catch(() => []),
      getGithubStats().catch(() => null),
      getGallery().catch(() => []),
      getSiteTexts().catch(() => []),
      getSocialLinks().catch(() => []),
      getSkills().catch(() => []),
      getHomeSections().catch(() => []),
    ]);

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
