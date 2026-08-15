import Reveal from "./Reveal";
import SocialLinks from "./SocialLinks";
import { T } from "./I18n";
import { Spot, Counter } from "./Fx";

// Início da jornada como dev — usado pra calcular "anos de experiência" sozinho, sem editar à mão todo ano.
const DEV_SINCE = new Date(2022, 1, 1);

function yearsSince(date) {
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const hasHadAnniversaryThisYear =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hasHadAnniversaryThisYear) years--;
  return years;
}

export default function About({ githubRepoCount, fallbackProjectCount = 0, courseCount = 0 }) {
  const stats = [
    {
      value: githubRepoCount ?? fallbackProjectCount,
      pt: "Projetos no GitHub",
      en: "GitHub projects",
      href: "https://github.com/joaoaugusto-dev",
      external: true,
    },
    {
      value: yearsSince(DEV_SINCE),
      suffix: "+",
      pt: "Anos de experiência",
      en: "Years of experience",
      href: "#jornada",
    },
    {
      value: courseCount,
      pt: "Cursos e formações",
      en: "Courses & education",
      // Jornada e Cursos ficam lado a lado no scroll: entrar por #jornada dá pra ver as duas.
      href: "#jornada",
    },
  ];

  return (
    <section id="sobre" className="scroll-mt-4 px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="eyebrow mb-3">
            <T pt="Quem fala" en="Who's writing" />
          </p>
          <h2 className="section-title mb-10 text-4xl font-bold">
            <T pt="Sobre Mim" en="About Me" />
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <Spot className="border border-white/5 bg-surface/60 p-8 text-left sm:p-10">
            <p className="mb-1 text-xl font-medium">João Augusto de Freitas</p>
            <p className="mb-6 text-base text-accent-2">
              <T
                pt="Desenvolvedor de software em São João da Boa Vista - SP"
                en="Software developer based in São João da Boa Vista, Brazil"
              />
            </p>
            <ul className="space-y-4 border-t border-white/5 pt-6">
              <li className="flex items-start gap-3 text-base leading-relaxed text-muted">
                <i className="fa-solid fa-user-graduate mt-1 shrink-0 text-accent-2" aria-hidden />
                <T
                  pt="Estudante de Análise e Desenvolvimento de Sistemas na UNIFEOB (previsão de conclusão 2027)."
                  en="Systems Analysis and Development student at UNIFEOB (expected graduation 2027)."
                />
              </li>
              <li className="flex items-start gap-3 text-base leading-relaxed text-muted">
                <i className="fa-solid fa-graduation-cap mt-1 shrink-0 text-accent-2" aria-hidden />
                <T
                  pt="Ensino Médio com Curso Técnico em Informática para Internet na ETEC de Vargem Grande do Sul — concluído em 2024."
                  en="High School with Technical Course in Internet Informatics at ETEC de Vargem Grande do Sul — completed in 2024."
                />
              </li>
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
            <T pt="Contatos" en="Contacts" />
          </h3>
          <SocialLinks />
        </Reveal>
      </div>
    </section>
  );
}
