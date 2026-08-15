-- Rode isso no Supabase: Project > SQL Editor > New query > Run.
-- Cria as tabelas de cursos complementares e da jornada (linha do tempo), com as mesmas
-- colunas que o Sequelize espera (server/src/models/Course.js e JourneyItem.js), e semeia
-- com o conteúdo que antes estava fixo em Courses.js e Timeline.js.

create table if not exists "Courses" (
  "id" serial primary key,
  "titlePt" varchar(255) not null,
  "titleEn" varchar(255) not null,
  "image" varchar(255),
  "platform" varchar(255),
  "durationPt" varchar(255),
  "durationEn" varchar(255),
  "descPt" text,
  "descEn" text,
  "order" integer default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists courses_order_idx on "Courses" ("order");

insert into "Courses" ("titlePt", "titleEn", "image", "platform", "durationPt", "durationEn", "descPt", "descEn", "order", "createdAt", "updatedAt")
select * from (values
  ('Curso de HTML5 (com noções de CSS e JavaScript)', 'HTML5 Course (with CSS & JavaScript basics)',
   '/images/html5.webp', 'Curso em Vídeo', '40 horas', '40 hours',
   'Curso de HTML5, abordando principalmente HTML, mas também introduzindo conceitos básicos de CSS e JavaScript para a construção de páginas web.',
   'HTML5 course, focusing mainly on HTML but also introducing basic CSS and JavaScript concepts for building web pages.',
   0, now(), now()),

  ('Curso de MySQL (Banco de Dados Relacional)', 'MySQL Course (Relational Database)',
   '/images/mysql.webp', 'Curso em Vídeo', '40 horas', '40 hours',
   'Curso completo de MySQL, abordando a modelagem de dados, consultas SQL e administração de bancos relacionais para aplicações modernas.',
   'Complete MySQL course, covering data modeling, SQL queries and administration of relational databases for modern applications.',
   1, now(), now())
) as v("titlePt", "titleEn", "image", "platform", "durationPt", "durationEn", "descPt", "descEn", "order", "createdAt", "updatedAt")
where not exists (select 1 from "Courses");

create table if not exists "JourneyItems" (
  "id" serial primary key,
  "icon" varchar(255) default 'fa-solid fa-code',
  "periodPt" varchar(255) not null,
  "periodEn" varchar(255) not null,
  "titlePt" varchar(255) not null,
  "titleEn" varchar(255) not null,
  "schoolPt" varchar(255) not null,
  "schoolEn" varchar(255) not null,
  "notePt" varchar(255),
  "noteEn" varchar(255),
  "tags" varchar(255)[] default '{}',
  "live" boolean default false,
  "order" integer default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists journey_items_order_idx on "JourneyItems" ("order");

insert into "JourneyItems" ("icon", "periodPt", "periodEn", "titlePt", "titleEn", "schoolPt", "schoolEn", "notePt", "noteEn", "tags", "live", "order", "createdAt", "updatedAt")
select * from (values
  ('fa-solid fa-graduation-cap', '2022 — 2024', '2022 — 2024',
   'Ensino Médio com Técnico em Informática para Internet', 'High School with Technical Course in Internet Informatics',
   'ETEC de Vargem Grande do Sul', 'ETEC de Vargem Grande do Sul',
   'Concluído em 2024', 'Completed in 2024',
   array['HTML5', 'CSS3', 'JavaScript', 'MySQL'], false, 0, now(), now()),

  ('fa-solid fa-user-graduate', '2025 — Atualmente', '2025 — Present',
   'Análise e Desenvolvimento de Sistemas', 'Systems Analysis and Development',
   'UNIFEOB', 'UNIFEOB',
   'Previsão de conclusão em 2027', 'Expected graduation in 2027',
   array['Full-stack', 'Mobile', 'Banco de dados'], false, 1, now(), now()),

  ('fa-solid fa-code', 'Hoje', 'Today',
   'Construindo e aprendendo em público', 'Building and learning in public',
   'Projetos próprios', 'Personal projects',
   'Flutter, Node.js e ESP32/IoT', 'Flutter, Node.js and ESP32/IoT',
   array['Flutter', 'Node.js', 'ESP32'], true, 2, now(), now())
) as v("icon", "periodPt", "periodEn", "titlePt", "titleEn", "schoolPt", "schoolEn", "notePt", "noteEn", "tags", "live", "order", "createdAt", "updatedAt")
where not exists (select 1 from "JourneyItems");
