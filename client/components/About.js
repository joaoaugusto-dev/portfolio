import Reveal from "./Reveal";
import SocialLinks from "./SocialLinks";
import { T } from "./I18n";
import { Spot, Counter } from "./Fx";
import { tx } from "@/lib/siteText";

function yearsSince(date) {
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const hasHadAnniversaryThisYear =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hasHadAnniversaryThisYear) years--;
  return years;
}

const bulletIcons = ["fa-solid fa-user-graduate", "fa-solid fa-graduation-cap", "fa-solid fa-book"];

export default function About({ texts, socialLinks = [], githubRepoCount, fallbackProjectCount = 0, courseCount = 0 }) {
  const name = tx(texts, "about.name", "João Augusto de Freitas");
  const roleTagline = tx(
    texts,
    "about.roleTagline",
    "Desenvolvedor de software em São João da Boa Vista - SP",
    "Software developer based in São João da Boa Vista, Brazil",
  );
  const bulletsRaw = tx(
    texts,
    "about.bullets",
    "Estudante de Análise e Desenvolvimento de Sistemas na UNIFEOB (previsão de conclusão 2027).\nEnsino Médio com Curso Técnico em Informática para Internet na ETEC de Vargem Grande do Sul — concluído em 2024.",
    "Systems Analysis and Development student at UNIFEOB (expected graduation 2027).\nHigh School with Technical Course in Internet Informatics at ETEC de Vargem Grande do Sul — completed in 2024.",
  );
  const devSinceRaw = tx(texts, "about.devSince", "2022-02-01");
  const contactsHeading = tx(texts, "about.contactsHeading", "Contatos", "Contacts");
  const statGithub = tx(texts, "about.statGithubLabel", "Projetos no GitHub", "GitHub projects");
  const statYears = tx(texts, "about.statYearsLabel", "Anos de experiência", "Years of experience");
  const statCourses = tx(texts, "about.statCoursesLabel", "Cursos e formações", "Courses & education");

  const bulletsPt = bulletsRaw.pt.split("\n").filter(Boolean);
  const bulletsEn = bulletsRaw.en.split("\n").filter(Boolean);

  const parsedDevSince = new Date(devSinceRaw.pt);
  const devSince = Number.isNaN(parsedDevSince.getTime()) ? new Date(2022, 1, 1) : parsedDevSince;

  const githubHref = socialLinks.find((s) => s.label === "GitHub")?.href || "https://github.com/joaoaugusto-dev";

  const stats = [
    {
      value: githubRepoCount ?? fallbackProjectCount,
      pt: statGithub.pt,
      en: statGithub.en,
      href: githubHref,
      external: true,
    },
    {
      value: yearsSince(devSince),
      suffix: "+",
      pt: statYears.pt,
      en: statYears.en,
      href: "#jornada",
    },
    {
      value: courseCount,
      pt: statCourses.pt,
      en: statCourses.en,
      // Jornada e Cursos ficam lado a lado no scroll: entrar por #jornada dá pra ver as duas.
      href: "#jornada",
    },
  ];

  return (
    <section id="sobre" className="scroll-mt-2 px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="section-title mb-10 text-4xl font-bold">
            <T pt="Sobre Mim" en="About Me" />
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <Spot className="border border-white/5 bg-surface/60 p-8 text-left sm:p-10">
            <p className="mb-1 text-xl font-medium">{name.pt}</p>
            <p className="mb-6 text-base text-accent-2">
              <T pt={roleTagline.pt} en={roleTagline.en} />
            </p>
            <ul className="space-y-4 border-t border-white/5 pt-6">
              {bulletsPt.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-base leading-relaxed text-muted">
                  <i className={`${bulletIcons[i % bulletIcons.length]} mt-1 shrink-0 text-accent-2`} aria-hidden />
                  <T pt={line} en={bulletsEn[i] ?? line} />
                </li>
              ))}
            </ul>
          </Spot>
        </Reveal>

        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map(({ value, suffix = "", pt, en, href, external }, i) => (
            <Reveal key={pt} delay={0.15 + i * 0.08}>
              <Spot
                as="a"
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="group block h-full border border-white/5 bg-surface/50 px-3 py-5 transition-colors hover:border-accent/40"
              >
                <p className="text-3xl font-bold text-accent-2 sm:text-4xl">
                  <Counter to={value} suffix={suffix} />
                </p>
                <p className="mt-1 text-xs leading-snug text-muted sm:text-sm group-hover:text-foreground">
                  <T pt={pt} en={en} />
                </p>
              </Spot>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10">
          <h3 className="eyebrow mb-4">
            <T pt={contactsHeading.pt} en={contactsHeading.en} />
          </h3>
          <SocialLinks items={socialLinks} />
        </Reveal>
      </div>
    </section>
  );
}
