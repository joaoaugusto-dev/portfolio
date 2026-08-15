// Dados puros: o <Skills/> é client (tem filtro), mas o <About/> roda no servidor e
// só quer o total. Módulo separado pra não importar um client component lá.

export const cats = [
  ["all", "Tudo", "All"],
  ["mobile", "Mobile", "Mobile"],
  ["front", "Front-end", "Front-end"],
  ["back", "Back-end", "Back-end"],
  ["dados", "Dados", "Data"],
  ["hard", "Hardware", "Hardware"],
];

// A linha `use` é o que a tecnologia faz no meu dia a dia — é o que interessa
// pra quem lê, mais do que uma barrinha de "nível" inventada.
export const tech = [
  { icon: "fab fa-flutter", name: "Flutter", cat: "mobile", pt: "apps Android e iOS", en: "Android & iOS apps" },
  { icon: "fab fa-dart-lang", name: "Dart", cat: "mobile", pt: "a linguagem do Flutter", en: "the Flutter language" },
  { icon: "fab fa-js-square", name: "JavaScript", cat: "front", pt: "web de ponta a ponta", en: "end-to-end web" },
  { icon: "fab fa-html5", name: "HTML5", cat: "front", pt: "estrutura semântica", en: "semantic structure" },
  { icon: "fab fa-css3-alt", name: "CSS3", cat: "front", pt: "layout e animação", en: "layout & animation" },
  { icon: "fab fa-bootstrap", name: "Bootstrap", cat: "front", pt: "protótipo em pé rápido", en: "quick prototypes" },
  { icon: "fab fa-figma", name: "Figma", cat: "front", pt: "desenho das telas", en: "screen design" },
  { icon: "fab fa-node-js", name: "Node.js", cat: "back", pt: "APIs e serviços", en: "APIs & services" },
  { icon: "fa-solid fa-server", name: "NestJS", cat: "back", pt: "back-end organizado", en: "structured back-end" },
  { icon: "fab fa-linux", name: "Linux", cat: "back", pt: "onde tudo roda", en: "where it all runs" },
  { icon: "fa-solid fa-database", name: "Supabase", cat: "dados", pt: "banco, auth e storage", en: "database, auth & storage" },
  { icon: "fa-solid fa-fire", name: "Firebase", cat: "dados", pt: "tempo real e auth", en: "realtime & auth" },
  { icon: "fas fa-database", name: "MySQL", cat: "dados", pt: "modelagem relacional", en: "relational modeling" },
  { icon: "fa-solid fa-microchip", name: "ESP32", cat: "hard", pt: "IoT e hardware conectado", en: "IoT & connected hardware" },
];

export const soft = [
  ["fas fa-users", "Trabalho em Grupo", "Teamwork"],
  ["fas fa-laptop-code", "Desenvolvimento de Sistemas", "Systems Development"],
  ["fas fa-tasks", "Gestão de Projetos", "Project Management"],
  ["fas fa-microchip", "Tecnologias Emergentes", "Emerging Technologies"],
  ["fas fa-chart-line", "Análise de Dados", "Data Analysis"],
  ["fas fa-people-arrows", "Trabalho Multidisciplinar", "Multidisciplinary Work"],
  ["fas fa-lightbulb", "Inovação", "Innovation"],
  ["fas fa-puzzle-piece", "Resolução de Problemas", "Problem Solving"],
];
