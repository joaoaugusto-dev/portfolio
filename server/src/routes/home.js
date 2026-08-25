const express = require("express");
const Project = require("../models/Project");
const Course = require("../models/Course");
const JourneyItem = require("../models/JourneyItem");
const GalleryItem = require("../models/GalleryItem");
const SocialLink = require("../models/SocialLink");
const Skill = require("../models/Skill");
const SiteText = require("../models/SiteText");
const HomeSection = require("../models/HomeSection");

const router = express.Router();

// Tudo que a home precisa, numa requisição só.
//
// Antes o render buscava as 8 listas em 8 chamadas HTTP separadas. Elas saíam em
// paralelo no `Promise.all`, mas cada uma pagava DNS + TLS + wake-up do Render por
// conta própria: de 0,45s a 1,7s cada, medido. Como o render da home é bloqueante
// pra quem cai num cache expirado (e pro admin logo depois de salvar), isso era o
// grosso do TTFB de 3,4s.
//
// Aqui as 8 consultas são o que sempre foram — `findAll` sem join — só que num
// processo só, sobre a conexão de banco já aberta. Uma ida e volta em vez de oito.
//
// As rotas individuais continuam existindo: o admin usa cada uma, e `lib/api.js`
// cai nelas se esta falhar.
router.get("/", async (req, res) => {
  const [projects, courses, journey, gallery, socialLinks, skills, siteTexts, homeSections] =
    await Promise.all([
      Project.findAll({ order: [["order", "ASC"]] }),
      Course.findAll({ order: [["order", "ASC"]] }),
      JourneyItem.findAll({ order: [["order", "ASC"]] }),
      GalleryItem.findAll({ order: [["order", "ASC"], ["createdAt", "ASC"]] }),
      SocialLink.findAll({ order: [["order", "ASC"]] }),
      Skill.findAll({ order: [["order", "ASC"]] }),
      SiteText.findAll({ order: [["group", "ASC"], ["order", "ASC"], ["id", "ASC"]] }),
      HomeSection.findAll({ order: [["order", "ASC"]] }),
    ]);

  res.json({ projects, courses, journey, gallery, socialLinks, skills, siteTexts, homeSections });
});

module.exports = router;
