const SocialLink = require("./models/SocialLink");
const Skill = require("./models/Skill");
const SiteText = require("./models/SiteText");
const HomeSection = require("./models/HomeSection");

// Conteúdo que virou editável no admin, populado uma vez só (por tabela vazia)
// com o que já estava hardcoded nos componentes antes dessa migração — assim
// o site não muda de aparência no primeiro boot com as tabelas novas.

const socialLinks = [
  { label: "Email", href: "mailto:contato@joaoaugusto.dev", icon: "fa-solid fa-envelope", order: 0 },
  { label: "WhatsApp", href: "https://api.whatsapp.com/send?phone=5519994943031", icon: "fa-brands fa-whatsapp", order: 1 },
  { label: "GitHub", href: "https://github.com/joaoaugusto-dev", icon: "fa-brands fa-github", order: 2 },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jo%C3%A3o-augusto-de-freitas/", icon: "fa-brands fa-linkedin", order: 3 },
  { label: "Instagram", href: "https://www.instagram.com/joao_augusto.dev", icon: "fa-brands fa-instagram", order: 4 },
];

const skills = [
  { type: "tech", icon: "fab fa-flutter", name: "Flutter", cat: "mobile", pt: "apps Android e iOS", en: "Android & iOS apps", order: 0 },
  { type: "tech", icon: "fab fa-dart-lang", name: "Dart", cat: "mobile", pt: "a linguagem do Flutter", en: "the Flutter language", order: 1 },
  { type: "tech", icon: "fab fa-js-square", name: "JavaScript", cat: "front", pt: "web de ponta a ponta", en: "end-to-end web", order: 2 },
  { type: "tech", icon: "fab fa-html5", name: "HTML5", cat: "front", pt: "estrutura semântica", en: "semantic structure", order: 3 },
  { type: "tech", icon: "fab fa-css3-alt", name: "CSS3", cat: "front", pt: "layout e animação", en: "layout & animation", order: 4 },
  { type: "tech", icon: "fab fa-bootstrap", name: "Bootstrap", cat: "front", pt: "protótipo em pé rápido", en: "quick prototypes", order: 5 },
  { type: "tech", icon: "fab fa-figma", name: "Figma", cat: "front", pt: "desenho das telas", en: "screen design", order: 6 },
  { type: "tech", icon: "fab fa-node-js", name: "Node.js", cat: "back", pt: "APIs e serviços", en: "APIs & services", order: 7 },
  { type: "tech", icon: "fa-solid fa-server", name: "NestJS", cat: "back", pt: "back-end organizado", en: "structured back-end", order: 8 },
  { type: "tech", icon: "fab fa-linux", name: "Linux", cat: "back", pt: "onde tudo roda", en: "where it all runs", order: 9 },
  { type: "tech", icon: "fa-solid fa-database", name: "Supabase", cat: "dados", pt: "banco, auth e storage", en: "database, auth & storage", order: 10 },
  { type: "tech", icon: "fa-solid fa-fire", name: "Firebase", cat: "dados", pt: "tempo real e auth", en: "realtime & auth", order: 11 },
  { type: "tech", icon: "fas fa-database", name: "MySQL", cat: "dados", pt: "modelagem relacional", en: "relational modeling", order: 12 },
  { type: "tech", icon: "fa-solid fa-microchip", name: "ESP32", cat: "hard", pt: "IoT e hardware conectado", en: "IoT & connected hardware", order: 13 },
  { type: "soft", icon: "fas fa-users", pt: "Trabalho em Grupo", en: "Teamwork", order: 0 },
  { type: "soft", icon: "fas fa-laptop-code", pt: "Desenvolvimento de Sistemas", en: "Systems Development", order: 1 },
  { type: "soft", icon: "fas fa-tasks", pt: "Gestão de Projetos", en: "Project Management", order: 2 },
  { type: "soft", icon: "fas fa-microchip", pt: "Tecnologias Emergentes", en: "Emerging Technologies", order: 3 },
  { type: "soft", icon: "fas fa-chart-line", pt: "Análise de Dados", en: "Data Analysis", order: 4 },
  { type: "soft", icon: "fas fa-people-arrows", pt: "Trabalho Multidisciplinar", en: "Multidisciplinary Work", order: 5 },
  { type: "soft", icon: "fas fa-lightbulb", pt: "Inovação", en: "Innovation", order: 6 },
  { type: "soft", icon: "fas fa-puzzle-piece", pt: "Resolução de Problemas", en: "Problem Solving", order: 7 },
];

const siteTexts = [
  { key: "hero.nameLine1", group: "hero", label: "Nome — primeira linha", pt: "João Augusto", en: "João Augusto", order: 0 },
  { key: "hero.nameLine2", group: "hero", label: "Nome — segunda linha", pt: "de Freitas", en: "de Freitas", order: 1 },
  { key: "hero.tagline", group: "hero", label: "Frase abaixo do nome", pt: "Desenvolvedor de Software em São João da Boa Vista - SP", en: "Software Developer based in São João da Boa Vista, Brazil", order: 2 },
  { key: "hero.buildingWith", group: "hero", label: "Frase antes da tecnologia rotativa", pt: "construindo com", en: "building with", order: 3 },
  { key: "hero.stack", group: "hero", label: "Tecnologias da lista rotativa (separadas por vírgula)", pt: "Flutter, Node.js, NestJS, ESP32, Supabase", en: "Flutter, Node.js, NestJS, ESP32, Supabase", order: 4 },
  { key: "hero.ctaProjects", group: "hero", label: "Botão: ver projetos", pt: "Ver Projetos", en: "View Projects", order: 5 },
  { key: "hero.ctaContact", group: "hero", label: "Botão: ir para contato", pt: "Vamos Conversar", en: "Let's Talk", order: 6 },

  { key: "about.name", group: "about", label: "Nome exibido no card Sobre Mim", pt: "João Augusto de Freitas", en: "João Augusto de Freitas", order: 0 },
  { key: "about.roleTagline", group: "about", label: "Frase abaixo do nome no card", pt: "Desenvolvedor de software em São João da Boa Vista - SP", en: "Software developer based in São João da Boa Vista, Brazil", order: 1 },
  { key: "about.bullets", group: "about", label: "Formação (uma linha por item)", pt: "Estudante de Análise e Desenvolvimento de Sistemas na UNIFEOB (previsão de conclusão 2027).\nEnsino Médio com Curso Técnico em Informática para Internet na ETEC de Vargem Grande do Sul — concluído em 2024.", en: "Systems Analysis and Development student at UNIFEOB (expected graduation 2027).\nHigh School with Technical Course in Internet Informatics at ETEC de Vargem Grande do Sul — completed in 2024.", order: 2 },
  { key: "about.devSince", group: "about", label: "Data de início como dev (AAAA-MM-DD) — usada pra calcular 'anos de experiência'", pt: "2022-02-01", en: "2022-02-01", order: 3 },
  { key: "about.statGithubLabel", group: "about", label: "Legenda do card: projetos no GitHub", pt: "Projetos no GitHub", en: "GitHub projects", order: 4 },
  { key: "about.statYearsLabel", group: "about", label: "Legenda do card: anos de experiência", pt: "Anos de experiência", en: "Years of experience", order: 5 },
  { key: "about.statCoursesLabel", group: "about", label: "Legenda do card: cursos e formações", pt: "Cursos e formações", en: "Courses & education", order: 6 },
  { key: "about.contactsHeading", group: "about", label: "Título acima das redes sociais", pt: "Contatos", en: "Contacts", order: 7 },

  { key: "contact.heading", group: "contact", label: "Título da seção de contato", pt: "Vamos Conversar?", en: "Let's Talk?", order: 0 },
  { key: "contact.whatsappCta", group: "contact", label: "Botão do WhatsApp", pt: "Chamar no WhatsApp", en: "Message on WhatsApp", order: 1 },
  { key: "contact.emailCopied", group: "contact", label: "Mensagem ao copiar o e-mail", pt: "E-mail copiado!", en: "E-mail copied!", order: 2 },
  { key: "contact.findMe", group: "contact", label: "Frase acima das redes sociais", pt: "Ou me encontre em:", en: "Or find me at:", order: 3 },

  { key: "footer.name", group: "footer", label: "Nome no copyright", pt: "João Augusto de Freitas", en: "João Augusto de Freitas", order: 0 },
  { key: "footer.rights", group: "footer", label: "Texto de direitos reservados", pt: "Todos os direitos reservados.", en: "All rights reserved.", order: 1 },

  { key: "nav.wordmark", group: "nav", label: 'Nome no topo do menu (antes de ".dev")', pt: "JOÃO AUGUSTO", en: "JOÃO AUGUSTO", order: 0 },
];

const homeSections = [
  { key: "about", order: 0, visible: true },
  { key: "gallery", order: 1, visible: true },
  { key: "skills", order: 2, visible: true },
  { key: "projects", order: 3, visible: true },
  { key: "journey", order: 4, visible: true },
  { key: "courses", order: 5, visible: true },
  { key: "contact", order: 6, visible: true },
];

// Idempotente: só popula uma tabela se ela estiver vazia, então é seguro
// rodar em todo boot (sem precisar de uma ferramenta de migration separada).
async function seed() {
  if (!(await SocialLink.count())) await SocialLink.bulkCreate(socialLinks);
  if (!(await Skill.count())) await Skill.bulkCreate(skills);
  if (!(await SiteText.count())) await SiteText.bulkCreate(siteTexts);
  if (!(await HomeSection.count())) await HomeSection.bulkCreate(homeSections);
}

module.exports = seed;
