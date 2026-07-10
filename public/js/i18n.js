// ===== Lightweight i18n =====================================================
// The HTML is authored in Portuguese (the default). We cache that original text
// on load and only supply the English overrides here — so PT never duplicates.
// [data-i18n]      -> swaps textContent
// [data-i18n-html] -> swaps innerHTML (blocks with <strong>, <br>, emojis, links)
// Language priority: ?lang= URL param  >  saved choice  >  browser language.

const I18N = {
    en: {
        text: {
            // Navbar
            nav_sobre: "About",
            nav_skills: "Skills",
            nav_projetos: "Projects",
            nav_jornada: "Journey",
            nav_cursos: "Courses",
            nav_contato: "Contact",
            // Hero
            hero_sub: "Software Developer — Flutter, Node.js, & more!",
            hero_cta1: "View Projects",
            hero_cta2: "Let's Talk",
            // About
            about_title: "About Me",
            contacts_label: "Contacts:",
            // Skills
            skills_title: "Skills",
            skills_tech: "Technologies",
            skills_soft: "Soft Skills",
            soft_teamwork: "Teamwork",
            soft_dev: "Systems Development",
            soft_pm: "Project Management",
            soft_emerging: "Emerging Technologies",
            soft_data: "Data Analysis",
            soft_multi: "Multidisciplinary Work",
            soft_innov: "Innovation",
            soft_problem: "Problem Solving",
            // Projects
            projects_title: "My Projects",
            filter_relevance: "Sort by Relevance",
            filter_date: "Sort by Date",
            badge_featured: "Featured Project",
            btn_goto: "Go to project",
            // Timeline
            timeline_title: "Timeline",
            tl_1_desc: "High School with Technical Course in Internet Informatics",
            tl_2_period: "2025 - Present",
            tl_2_desc: "Systems Analysis and Development",
            // Courses
            courses_title: "Complementary Courses",
            course1_title: "HTML5 Course (with CSS & JavaScript basics)",
            course2_title: "MySQL Course (Relational Database)",
            // Contact
            contact_title: "Let's Talk?",
            contact_find: "Or find me at:",
            // Footer
            rights: "All rights reserved.",
            // SEO / head
            title: "João Augusto de Freitas | Software Developer",
            meta_desc: "Portfolio of João Augusto de Freitas, full-stack software developer specialized in Flutter, Node.js, NestJS and ESP32/IoT. See projects, skills and journey."
        },
        html: {
            about_desc:
                "Systems Analysis and Development student at UNIFEOB (expected graduation 2027)<br>\n" +
                "                    High School with Technical Course in Internet Informatics - Completed in 2024",

            proj_sidera:
                "🏢 <strong>Partner Company:</strong> <a href=\"https://www.soufer.com.br/\" target=\"_blank\" onclick=\"event.stopPropagation()\" aria-label=\"Soufer official website\" style=\"display: inline-flex; align-items: center; vertical-align: middle; text-decoration: none;\">" +
                "<img src=\"./public/images/Logo_Soufer.png\" alt=\"Soufer\" style=\"height: 26px; width: auto; display: block;\"></a><br><br>" +
                "💡 <strong>Goal:</strong> Validate metal parts on the factory floor with assisted dimensional inspection, traceability and automated reports.<br><br>" +
                "📋 <strong>Description:</strong> Flutter app for assisted dimensional inspection that uses computer vision and physical markers to compare measurements, record evidence and support production decision-making.<br><br>" +
                "🛠️ <strong>Technologies:</strong> Flutter, Dart, computer vision, Supabase<br><br>" +
                "📅 <strong>Work Period:</strong> February/2026 - May/2026.",

            proj_iot:
                "💡 <strong>Goal:</strong> Optimize energy use with smart climate control and lighting through <strong>presence detection</strong> in a factory environment.<br><br>" +
                "📋 <strong>Description:</strong> IoT system with real-time reading of <strong>temperature</strong>, <strong>humidity</strong>, <strong>light</strong> and <strong>presence</strong>, automatically switching lights and air conditioners as needed. Includes <strong>RFID/NFC</strong> for authentication and a web-accessible <strong>dashboard (HMI)</strong>.<br><br>" +
                "🛠️ <strong>Technologies:</strong> ESP32 (C++/Wi‑Fi), DHT22, LDR, IR, RFID/NFC, <strong>Node.js</strong>, <strong>JavaScript</strong>, EJS, <strong>HTML5</strong>, <strong>CSS3</strong>, <strong>Bootstrap</strong>, Figma, Relays.<br><br>" +
                "🤝 <strong>Partnership:</strong> Project carried out with support from <strong>PackBag</strong> in the context of the <strong>UNIFEOB PI</strong>.<br><br>" +
                "📅 <strong>Work Period:</strong> February/2025 to June/2025.",

            proj_bolso:
                "💡 <strong>Challenge:</strong> 79% of Brazilian families were in debt in 2023.<br><br>" +
                "✅ <strong>Solution:</strong> Web platform to track expenses, income and goals. Visual reports (Chart.js), automatic reminders, accessibility (VLibras) and a Gemini AI assistant.<br><br>" +
                "🛠️ <strong>Technologies:</strong> HTML5, CSS3, JavaScript, Node.js, MySQL and Bootstrap.<br><br>" +
                "📅 <strong>Work Period:</strong> October/2023 to December/2024.<br><br>" +
                "🚀 Turning financial data into conscious decisions for a secure future! 💸",

            proj_amendoeira:
                "💡 <strong>Goal:</strong> Build my first personal project to sharpen my <strong>HTML, CSS and Bootstrap</strong> skills, creating a responsive website to help plan the store my mother intended to launch.<br><br>" +
                "📋 <strong>Description:</strong> Creation of an intuitive and visually appealing website, with <strong>responsive design</strong> and good layout organization. The project served as hands-on experience for front-end development and efficient interface structuring.<br><br>" +
                "📅 <strong>Work Period:</strong> September/2023<br><br>" +
                "🛠️ <strong>Technologies:</strong> <strong>HTML5, CSS3, Bootstrap</strong><br><br>",

            proj_art:
                "💡 <strong>Goal:</strong> Refine layout organization skills with <strong>Bootstrap</strong> and integration with <strong>Pixabay</strong>.<br><br>" +
                "📋 <strong>Description:</strong> Web application that simulates a digital art gallery, displaying images in an organized and visually appealing way.<br><br>" +
                "📅 <strong>Work Period:</strong> August/2023.<br><br>" +
                "🛠️ <strong>Technologies:</strong> HTML5, CSS3, Bootstrap, Pixabay.<br><br>",

            proj_capivara:
                "💡 <strong>Goal:</strong> Improve <strong>JavaScript</strong> skills, with special emphasis on using the <strong>DOM API</strong> for dynamic element manipulation.<br><br>" +
                "📋 <strong>Description:</strong> Game inspired by \"Flappy Bird\", where the <strong>DOM API</strong> is essential to control the interaction and dynamics of on-screen elements, delivering an interactive gaming experience with a capybara theme.<br><br>" +
                "📅 <strong>Work Period:</strong> September/2023.<br><br>" +
                "🛠️ <strong>Technologies:</strong> JavaScript, HTML5, CSS3, Bootstrap.<br><br>",

            proj_craft:
                "💡 <strong>Goal:</strong> Develop and improve skills in <strong>page planning</strong>, front-end and Bootstrap usage.<br><br>" +
                "📋 <strong>Description:</strong> Fictional page simulating the website of a company specialized in server hosting.<br><br>" +
                "📅 <strong>Work Period:</strong> November/2023.<br><br>" +
                "🛠️ <strong>Technologies:</strong> HTML5, CSS3, JavaScript, Bootstrap.<br><br>",

            proj_etec:
                "💡 <strong>Goal:</strong> Develop a platform for managing school activities.<br><br>" +
                "📋 <strong>Description:</strong> Web application that lets students and teachers manage school tasks, events and announcements.<br><br>" +
                "📅 <strong>Work Period:</strong> July/2023.<br><br>" +
                "🛠️ <strong>Technologies:</strong> HTML5, CSS3, JavaScript and Bootstrap<br><br>",

            proj_mosquito:
                "💡 <strong>Goal:</strong> Create an educational game to raise awareness about dengue.<br><br>" +
                "📋 <strong>Description:</strong> Interactive game where players must eliminate mosquito breeding spots and learn about dengue prevention.<br><br>" +
                "📅 <strong>Work Period:</strong> June/2023.<br><br>" +
                "🛠️ <strong>Technologies:</strong> HTML5, CSS3, JavaScript and Bootstrap.<br><br>",

            proj_glass:
                "💡 <strong>Goal:</strong> Explore Google Glass features in a hands-on project.<br><br>" +
                "📋 <strong>Description:</strong> Application demonstrating Google Glass use in different scenarios, such as navigation, translation and object recognition. This project was developed as part of the <a href=\"#cursos\" class=\"text-primary\" onclick=\"event.stopPropagation()\">HTML5 Course</a> from Curso em Vídeo.<br><br>" +
                "📅 <strong>Work Period:</strong> February/2023.<br><br>" +
                "🛠️ <strong>Technologies:</strong> HTML5, CSS3, JavaScript.<br><br>",

            proj_culinaria:
                "💡 <strong>Goal:</strong> Improve knowledge and practice in <strong>web accessibility</strong>.<br><br>" +
                "📋 <strong>Description:</strong> Web application presenting recipes, tips and resources to make cooking more accessible and inclusive.<br><br>" +
                "📅 <strong>Work Period:</strong> November/2024.<br><br>" +
                "🛠️ <strong>Technologies:</strong> HTML5, CSS3, JavaScript, Bootstrap and VLibras.<br><br>",

            course1_desc:
                "<strong>Platform:</strong> Curso em Vídeo<br>\n" +
                "                                <strong>Duration:</strong> 40 hours<br>\n" +
                "                                <strong>Description:</strong> HTML5 course, focusing mainly on HTML but also introducing basic CSS and JavaScript concepts for building web pages.",

            course2_desc:
                "<strong>Platform:</strong> Curso em Vídeo<br>\n" +
                "                                <strong>Duration:</strong> 40 hours<br>\n" +
                "                                <strong>Description:</strong> Complete MySQL course, covering data modeling, SQL queries and administration of relational databases for modern applications.",

            contact_wpp: "<i class=\"fab fa-whatsapp me-2\"></i>Message on WhatsApp"
        }
    }
};

(function () {
    const originalText = new Map();
    const originalHtml = new Map();
    const originalTitle = document.title;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // SEO meta tags kept in sync with the active language
    const metaDesc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    const orig = {
        desc: metaDesc && metaDesc.content,
        ogTitle: ogTitle && ogTitle.content,
        ogDesc: ogDesc && ogDesc.content,
        ogLocale: ogLocale && ogLocale.content,
        twTitle: twTitle && twTitle.content,
        twDesc: twDesc && twDesc.content
    };

    function cacheOriginals() {
        document.querySelectorAll('[data-i18n]').forEach(el => originalText.set(el, el.textContent));
        document.querySelectorAll('[data-i18n-html]').forEach(el => originalHtml.set(el, el.innerHTML));
    }

    function setMeta(el, val) { if (el && val != null) el.content = val; }

    function swap(lang) {
        const d = I18N.en;
        const en = lang === 'en';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const k = el.dataset.i18n;
            el.textContent = (en && d.text[k] != null) ? d.text[k] : originalText.get(el);
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const k = el.dataset.i18nHtml;
            el.innerHTML = (en && d.html[k] != null) ? d.html[k] : originalHtml.get(el);
        });
        document.documentElement.lang = en ? 'en' : 'pt-BR';
        document.title = en ? d.text.title : originalTitle;
        setMeta(metaDesc, en ? d.text.meta_desc : orig.desc);
        setMeta(ogTitle, en ? d.text.title : orig.ogTitle);
        setMeta(ogDesc, en ? d.text.meta_desc : orig.ogDesc);
        setMeta(ogLocale, en ? 'en_US' : orig.ogLocale);
        setMeta(twTitle, en ? d.text.title : orig.twTitle);
        setMeta(twDesc, en ? d.text.meta_desc : orig.twDesc);
    }

    // Slide the toggle thumb + button states immediately (independent of the text swap)
    function markButtons(lang) {
        const sw = document.querySelector('.lang-switch');
        if (sw) sw.dataset.active = lang;
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const on = btn.dataset.lang === lang;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    function apply(lang, animate) {
        markButtons(lang);
        if (animate && !prefersReduced) {
            // Subtle fade+blur dip; text is swapped while it's invisible mid-animation.
            document.body.classList.add('lang-swapping');
            setTimeout(() => swap(lang), 210);
            setTimeout(() => document.body.classList.remove('lang-swapping'), 490);
        } else {
            swap(lang);
        }
        try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }
    }

    function detectLang() {
        const param = new URLSearchParams(location.search).get('lang');
        if (param === 'pt' || param === 'en') return param;
        let saved = null;
        try { saved = localStorage.getItem('lang'); } catch (e) { /* ignore */ }
        if (saved === 'pt' || saved === 'en') return saved;
        const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'pt';
        return nav.toLowerCase().startsWith('pt') ? 'pt' : 'en';
    }

    function updateUrl(lang) {
        try {
            const url = new URL(location.href);
            url.searchParams.set('lang', lang);
            history.replaceState(null, '', url);
        } catch (e) { /* ignore */ }
    }

    document.addEventListener('DOMContentLoaded', () => {
        cacheOriginals();
        apply(detectLang(), false);
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (document.documentElement.lang === (lang === 'en' ? 'en' : 'pt-BR')) return;
                apply(lang, true);
                updateUrl(lang);
            });
        });
    });
})();
