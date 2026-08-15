import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import ProjectsGrid from "@/components/ProjectsGrid";
import Timeline from "@/components/Timeline";
import Courses from "@/components/Courses";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { getProjects, getCourses, getJourney, getGithubStats } from "@/lib/api";

export default async function Home() {
  const [projects, courses, journey, github] = await Promise.all([
    getProjects().catch(() => []),
    getCourses().catch(() => []),
    getJourney().catch(() => []),
    getGithubStats().catch(() => null),
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
