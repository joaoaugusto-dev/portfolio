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
import { getProjects, getCourses, getJourney, getGithubStats, getGallery } from "@/lib/api";

// Único cache que sobrou da home: a página é regerada no máximo a cada 60s, e
// cada regeneração busca os dados na API sem cache (ver lib/api.js).
export const revalidate = 60;

export default async function Home() {
  const [projects, courses, journey, github, gallery] = await Promise.all([
    getProjects().catch(() => []),
    getCourses().catch(() => []),
    getJourney().catch(() => []),
    getGithubStats().catch(() => null),
    getGallery().catch(() => []),
  ]);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About
          githubRepoCount={github?.publicRepos}
          fallbackProjectCount={projects.length}
          courseCount={courses.length + journey.length}
        />
        <Gallery items={gallery} />
        <Skills />
        <ProjectsGrid projects={projects} />
        <Timeline items={journey} />
        <Courses courses={courses} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
