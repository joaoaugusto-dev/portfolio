-- Rode isso no Supabase: Project > SQL Editor > New query > Run.
-- Cria a tabela de projetos com as mesmas colunas que o Sequelize (server/src/models/Project.js) espera,
-- e já insere os 11 projetos originais do portfólio.
--
-- Armazenamento (arquivos de mídia e capas) não fica no Supabase — vai pro Cloudflare R2,
-- configurado só por variáveis de ambiente (ver server/.env.example e o README). Não precisa
-- de bucket nem de SQL nenhum pra isso.

create table if not exists "Projects" (
  "id" serial primary key,
  "title" varchar(255) not null,
  "description" text not null,
  "imageUrl" varchar(255),
  "link" varchar(255),
  "featured" boolean default false,
  "projectDate" date not null,
  "order" integer default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists projects_order_idx on "Projects" ("order");

insert into "Projects" ("title", "description", "imageUrl", "link", "featured", "projectDate", "order", "createdAt", "updatedAt")
select * from (values
  ('Sidera Predict',
   '🏢 <strong>Empresa Parceira:</strong> Soufer<br><br>💡 <strong>Objetivo:</strong> Validar peças metálicas no chão de fábrica com inspeção dimensional assistida, rastreabilidade e relatórios automatizados.<br><br>📋 <strong>Descrição:</strong> Aplicativo Flutter para inspeção dimensional assistida, que usa visão computacional e marcadores físicos para comparar medidas, registrar evidências e apoiar a tomada de decisão na produção.<br><br>🛠️ <strong>Tecnologias:</strong> Flutter, Dart, visão computacional, Supabase<br><br>📅 <strong>Período Trabalhado:</strong> Fevereiro/2026 - Maio/2026.',
   '/images/SideraPredict.webp', 'https://github.com/joaoaugusto-dev/pi-2026.1', true, date '2026-05-31', 0, now(), now()),

  ('Automação IoT UNIFEOB-PackBag',
   '💡 <strong>Objetivo:</strong> Otimizar energia com climatização e iluminação inteligentes por detecção de presença em ambiente fabril.<br><br>📋 <strong>Descrição:</strong> Sistema IoT com leitura em tempo real de temperatura, umidade, luminosidade e presença, acionando automaticamente luzes e climatizadores. Inclui RFID/NFC para autenticação e dashboard (IHM) acessível via web.<br><br>🛠️ <strong>Tecnologias:</strong> ESP32 (C++/Wi-Fi), DHT22, LDR, IR, RFID/NFC, Node.js, JavaScript, EJS, HTML5, CSS3, Bootstrap, Figma, Relés.<br><br>🤝 <strong>Parceria:</strong> Projeto realizado com apoio da PackBag no contexto do PI UNIFEOB.<br><br>📅 <strong>Período Trabalhado:</strong> Fevereiro/2025 a Junho/2025.',
   '/images/pi-2025-1.webp', 'https://github.com/joaoaugusto-dev/projeto-pi', true, date '2025-06-01', 1, now(), now()),

  ('Bolso Inteligente',
   '💡 <strong>Desafio:</strong> 79% das famílias brasileiras estavam endividadas em 2023.<br><br>✅ <strong>Solução:</strong> Plataforma web para cadastro de despesas, receitas e metas. Relatórios visuais (Chart.js), lembretes automáticos, acessibilidade (VLibras) e assistente com IA Gemini.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript, Node.js, MySQL e Bootstrap.<br><br>📅 <strong>Período Trabalhado:</strong> Outubro/2023 a Dezembro/2024.',
   '/images/paginainicialbolsointeligente.webp', 'https://bolsointeligente.netlify.app/', true, date '2024-12-01', 2, now(), now()),

  ('Amendoeira',
   '💡 <strong>Objetivo:</strong> Desenvolver meu primeiro projeto pessoal para aprimorar habilidades em HTML, CSS e Bootstrap, criando um site responsivo para auxiliar no planejamento da loja que minha mãe pretendia lançar.<br><br>📋 <strong>Descrição:</strong> Site intuitivo e visualmente atrativo, com design responsivo e boa organização de layout.<br><br>📅 <strong>Período Trabalhado:</strong> Setembro/2023<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, Bootstrap',
   '/images/siteamendoeira.webp', 'https://amendoeiraoficial.netlify.app', false, date '2023-09-01', 3, now(), now()),

  ('ArtEmotion',
   '💡 <strong>Objetivo:</strong> Refinar habilidades em organização de layouts com Bootstrap e integração com o Pixabay.<br><br>📋 <strong>Descrição:</strong> Aplicação web que simula uma galeria de arte digital.<br><br>📅 <strong>Período Trabalhado:</strong> Agosto/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, Bootstrap, Pixabay.',
   '/images/artemotion.webp', 'https://artemotion.netlify.app/', false, date '2023-08-01', 4, now(), now()),

  ('Capivara nas Alturas',
   '💡 <strong>Objetivo:</strong> Aprimorar habilidades em JavaScript, com ênfase no uso do Método DOM.<br><br>📋 <strong>Descrição:</strong> Jogo inspirado no ''Flappy Bird'', com temática de capivaras.<br><br>📅 <strong>Período Trabalhado:</strong> Setembro/2023.<br><br>🛠️ <strong>Tecnologias:</strong> JavaScript, HTML5, CSS3, Bootstrap.',
   '/images/capivaranasalturas.webp', 'https://capivaranasalturas.netlify.app/', false, date '2023-09-01', 5, now(), now()),

  ('Craft Server',
   '💡 <strong>Objetivo:</strong> Desenvolver e aprimorar habilidades em planejamento de páginas, front-end e uso do Bootstrap.<br><br>📋 <strong>Descrição:</strong> Página fictícia que simula o site de uma empresa de hospedagem de servidores.<br><br>📅 <strong>Período Trabalhado:</strong> Novembro/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript, Bootstrap.',
   '/images/paginainicialcraftserver.webp', 'https://craftserver.netlify.app/', false, date '2023-11-01', 6, now(), now()),

  ('Etec Life',
   '💡 <strong>Objetivo:</strong> Desenvolver uma plataforma para gestão de atividades escolares.<br><br>📋 <strong>Descrição:</strong> Aplicação web que permite aos alunos e professores gerenciar tarefas, eventos e comunicados escolares.<br><br>📅 <strong>Período Trabalhado:</strong> Julho/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript e Bootstrap',
   '/images/siteeteclife.webp', 'https://eteclife.netlify.app/', false, date '2023-07-01', 7, now(), now()),

  ('Mata Mosquito',
   '💡 <strong>Objetivo:</strong> Criar um jogo educativo para conscientização sobre a dengue.<br><br>📋 <strong>Descrição:</strong> Jogo interativo onde os jogadores devem eliminar focos de mosquito e aprender sobre prevenção.<br><br>📅 <strong>Período Trabalhado:</strong> Junho/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript e Bootstrap.',
   '/images/sitematamosquito.webp', 'https://mata-mosquito-jogu.netlify.app/', false, date '2023-06-01', 8, now(), now()),

  ('Google Glass',
   '💡 <strong>Objetivo:</strong> Explorar as funcionalidades do Google Glass em um projeto prático.<br><br>📋 <strong>Descrição:</strong> Aplicação que demonstra o uso do Google Glass em diferentes cenários. Desenvolvido no Curso de HTML5 do Curso em Vídeo.<br><br>📅 <strong>Período Trabalhado:</strong> Fevereiro/2023.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript.',
   '/images/sitegoogleglass.webp', 'https://google-glass-guanabara.netlify.app/', false, date '2023-02-01', 9, now(), now()),

  ('Culinária sem Barreiras',
   '💡 <strong>Objetivo:</strong> Aprimorar conhecimentos e práticas em acessibilidade na web.<br><br>📋 <strong>Descrição:</strong> Aplicação web que apresenta receitas, dicas e recursos para tornar a cozinha mais acessível e inclusiva.<br><br>📅 <strong>Período Trabalhado:</strong> Novembro/2024.<br><br>🛠️ <strong>Tecnologias:</strong> HTML5, CSS3, JavaScript, Bootstrap e VLibras.',
   '/images/paginainicialculinaria.webp', 'https://culinariasembarreiras.netlify.app/', false, date '2024-11-01', 10, now(), now())
) as v("title", "description", "imageUrl", "link", "featured", "projectDate", "order", "createdAt", "updatedAt")
where not exists (select 1 from "Projects");
