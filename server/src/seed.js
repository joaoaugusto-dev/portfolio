require("dotenv").config();
const sequelize = require("./db");
const Project = require("./models/Project");

// Extracted from the original static index.html project cards.
const projects = [
  {
    title: "Sidera Predict",
    imageUrl: "/images/SideraPredict.webp",
    link: "https://github.com/joaoaugusto-dev/pi-2026.1",
    featured: true,
    projectDate: "2026-05-31",
    order: 0,
    description:
      "🏢 <strong>Empresa Parceira:</strong> Soufer<br><br>💡 <strong>Objetivo:</strong> Validar peças metálicas no chão de fábrica com inspeção dimensional assistida, rastreabilidade e relatórios automatizados.<br><br>📋 <strong>Descrição:</strong> Aplicativo Flutter para inspeção dimensional assistida, que usa visão computacional e marcadores físicos para comparar medidas, registrar evidências e apoiar a tomada de decisão na produção.<br><br>🛠️ <strong>Tecnologias:</strong> Flutter, Dart, visão computacional, Supabase<br><br>📅 <strong>Período Trabalhado:</strong> Fevereiro/2026 - Maio/2026.",
  },
  {
    title: "Automação IoT UNIFEOB-PackBag",
    imageUrl: "/images/pi-2025-1.webp",
    link: "https://github.com/joaoaugusto-dev/projeto-pi",
    featured: true,
    projectDate: "2025-06-01",
    order: 1,
    description:
      "💡 <strong>Objetivo:</strong> Otimizar energia com climatização e iluminação inteligentes por detecção de presença em ambiente fabril.<br><br>📋 <strong>Descrição:</strong> Sistema IoT com leitura em tempo real de temperatura, umidade, luminosidade e presença, acionando automaticamente luzes e climatizadores. Inclui RFID/NFC para autenticação e dashboard (IHM) acessível via web.<br><br>🛠️ <strong>Tecnologias:</strong> ESP32 (C++/Wi-Fi), DHT22, LDR, IR, RFID/NFC, Node.js, JavaScript, EJS, HTML5, CSS3, Bootstrap, Figma, Relés.<br><br>🤝 <strong>Parceria:</strong> Projeto realizado com apoio da PackBag no contexto do PI UNIFEOB.<br><br>📅 <strong>Período Trabalhado:</strong> Fevereiro/2025 a Junho/2025.",
  },
  {
    title: "Bolso Inteligente",
    imageUrl: "/images/paginainicialbolsointeligente.webp",
    link: "https://bolsointeligente.netlify.app/",
    featured: true,
    projectDate: "2024-12-01",
    order: 2,
    description:
      "💡 <strong>Desafio:</strong> 79% das famílias brasileiras estavam endividadas em 2023.<br><br>✅ <strong>Solução:</strong> Plataforma web para cadastro de despesas, receitas e metas. Relatórios visuais (Chart.js), lembretes automáticos, acessibilidade (VLibras) e assistente com IA Gemini.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript, Node.js, MySQL e Bootstrap.<br><br>📅 <strong>Período Trabalhado:</strong> Outubro/2023 a Dezembro/2024.",
  },
  {
    title: "Amendoeira",
    imageUrl: "/images/siteamendoeira.webp",
    link: "https://amendoeiraoficial.netlify.app",
    featured: false,
    projectDate: "2023-09-01",
    order: 3,
    description:
      "💡 <strong>Objetivo:</strong> Desenvolver meu primeiro projeto pessoal para aprimorar habilidades em HTML, CSS e Bootstrap, criando um site responsivo para auxiliar no planejamento da loja que minha mãe pretendia lançar.<br><br>📋 <strong>Descrição:</strong> Site intuitivo e visualmente atrativo, com design responsivo e boa organização de layout.<br><br>📅 <strong>Período Trabalhado:</strong> Setembro/2023<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, Bootstrap",
  },
  {
    title: "ArtEmotion",
    imageUrl: "/images/artemotion.webp",
    link: "https://artemotion.netlify.app/",
    featured: false,
    projectDate: "2023-08-01",
    order: 4,
    description:
      "💡 <strong>Objetivo:</strong> Refinar habilidades em organização de layouts com Bootstrap e integração com o Pixabay.<br><br>📋 <strong>Descrição:</strong> Aplicação web que simula uma galeria de arte digital.<br><br>📅 <strong>Período Trabalhado:</strong> Agosto/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, Bootstrap, Pixabay.",
  },
  {
    title: "Capivara nas Alturas",
    imageUrl: "/images/capivaranasalturas.webp",
    link: "https://capivaranasalturas.netlify.app/",
    featured: false,
    projectDate: "2023-09-01",
    order: 5,
    description:
      "💡 <strong>Objetivo:</strong> Aprimorar habilidades em JavaScript, com ênfase no uso do Método DOM.<br><br>📋 <strong>Descrição:</strong> Jogo inspirado no 'Flappy Bird', com temática de capivaras.<br><br>📅 <strong>Período Trabalhado:</strong> Setembro/2023.<br><br>🛠️ <strong>Tecnologias:</strong> JavaScript, HTML5, CSS3, Bootstrap.",
  },
  {
    title: "Craft Server",
    imageUrl: "/images/paginainicialcraftserver.webp",
    link: "https://craftserver.netlify.app/",
    featured: false,
    projectDate: "2023-11-01",
    order: 6,
    description:
      "💡 <strong>Objetivo:</strong> Desenvolver e aprimorar habilidades em planejamento de páginas, front-end e uso do Bootstrap.<br><br>📋 <strong>Descrição:</strong> Página fictícia que simula o site de uma empresa de hospedagem de servidores.<br><br>📅 <strong>Período Trabalhado:</strong> Novembro/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript, Bootstrap.",
  },
  {
    title: "Etec Life",
    imageUrl: "/images/siteeteclife.webp",
    link: "https://eteclife.netlify.app/",
    featured: false,
    projectDate: "2023-07-01",
    order: 7,
    description:
      "💡 <strong>Objetivo:</strong> Desenvolver uma plataforma para gestão de atividades escolares.<br><br>📋 <strong>Descrição:</strong> Aplicação web que permite aos alunos e professores gerenciar tarefas, eventos e comunicados escolares.<br><br>📅 <strong>Período Trabalhado:</strong> Julho/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript e Bootstrap",
  },
  {
    title: "Mata Mosquito",
    imageUrl: "/images/sitematamosquito.webp",
    link: "https://mata-mosquito-jogu.netlify.app/",
    featured: false,
    projectDate: "2023-06-01",
    order: 8,
    description:
      "💡 <strong>Objetivo:</strong> Criar um jogo educativo para conscientização sobre a dengue.<br><br>📋 <strong>Descrição:</strong> Jogo interativo onde os jogadores devem eliminar focos de mosquito e aprender sobre prevenção.<br><br>📅 <strong>Período Trabalhado:</strong> Junho/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript e Bootstrap.",
  },
  {
    title: "Google Glass",
    imageUrl: "/images/sitegoogleglass.webp",
    link: "https://google-glass-guanabara.netlify.app/",
    featured: false,
    projectDate: "2023-02-01",
    order: 9,
    description:
      "💡 <strong>Objetivo:</strong> Explorar as funcionalidades do Google Glass em um projeto prático.<br><br>📋 <strong>Descrição:</strong> Aplicação que demonstra o uso do Google Glass em diferentes cenários. Desenvolvido no Curso de HTML5 do Curso em Vídeo.<br><br>📅 <strong>Período Trabalhado:</strong> Fevereiro/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript.",
  },
  {
    title: "Culinária sem Barreiras",
    imageUrl: "/images/paginainicialculinaria.webp",
    link: "https://culinariasembarreiras.netlify.app/",
    featured: false,
    projectDate: "2024-11-01",
    order: 10,
    description:
      "💡 <strong>Objetivo:</strong> Aprimorar conhecimentos e práticas em acessibilidade na web.<br><br>📋 <strong>Descrição:</strong> Aplicação web que apresenta receitas, dicas e recursos para tornar a cozinha mais acessível e inclusiva.<br><br>📅 <strong>Período Trabalhado:</strong> Novembro/2024.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript, Bootstrap e VLibras.",
  },
];

async function run() {
  await sequelize.sync();
  const count = await Project.count();
  if (count > 0) {
    console.log(`Projects table already has ${count} rows — skipping seed.`);
    return process.exit(0);
  }
  await Project.bulkCreate(projects);
  console.log(`Seeded ${projects.length} projects.`);
  process.exit(0);
}

run();
