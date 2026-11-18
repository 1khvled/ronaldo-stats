import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Every figure rendered into the rail is read from the JSON database. Nothing
// is typed in here: a new goal, a new club season or a new trophy flows
// through automatically the next time this script runs.
const ronaldo = JSON.parse(fs.readFileSync(path.join(rootDir, "public", "data", "ronaldo-data.json"), "utf8"));
const TOTAL_GOALS = ronaldo.totals?.combined?.goals ?? 0;
const clubGoals = (name) => (ronaldo.clubSeasons || [])
  .filter((s) => s.club === name)
  .reduce((n, s) => n + (s.goals || 0), 0);
const RM_GOALS = clubGoals("Real Madrid");
const UCL_GOALS = (ronaldo.byCompetition || [])
  .filter((c) => c.competition === "UEFA Champions League")
  .reduce((n, c) => n + (c.goals || 0), 0);
const TROPHIES = (ronaldo.trophies || [])
  .filter((t) => t.team !== "Individual")
  .reduce((n, t) => n + (t.years?.length ?? 0), 0);

const NAV_LABELS = {
  en: {
    badgeAria: "RonaldoStats home",
    brandSub: `${TOTAL_GOALS} Career Goals`,
    collapseAria: "Collapse navigation",
    langName: "English",
    langTag: "EN",
    langSelectAria: "Select Language (English)",
    langSelectTitle: "Select Language",
    searchLabel: "Search",
    searchAria: "Open command palette",
    grpLive: "Hubs & Live",
    grpRivals: "Rivalries & Cups",
    grpArchive: "Career Archive",
    home: "Home",
    ronaldo: "vs Messi",
    madrid: "vs Real Madrid",
    ucl: "UCL Hub",
    byyear: "Goals by Year",
    byseason: "Goals by Season",
    dashboard: "Dashboard",
    timeline: "Through the Years",
    achievements: "Trophies",
    gear: "Ronaldo Gear",
    themeToggle: "Toggle dark mode",
    darkMode: "Dark mode"
  },
  es: {
    badgeAria: "Inicio RonaldoStats",
    brandSub: `${TOTAL_GOALS} goles de carrera`,
    collapseAria: "Contraer navegación",
    langName: "Español",
    langTag: "ES",
    langSelectAria: "Seleccionar idioma (Español)",
    langSelectTitle: "Seleccionar idioma",
    searchLabel: "Buscar",
    searchAria: "Abrir paleta de comandos",
    grpLive: "Centros y en vivo",
    grpRivals: "Rivales y copas",
    grpArchive: "Archivo de carrera",
    home: "Inicio",
    ronaldo: "vs Messi",
    madrid: "vs Real Madrid",
    ucl: "Champions League",
    byyear: "Goles por Año",
    byseason: "Temporadas",
    dashboard: "Panel",
    timeline: "Historia",
    achievements: "Trofeos",
    gear: "Tienda Ronaldo",
    themeToggle: "Cambiar tema",
    darkMode: "Modo oscuro"
  },
  pt: {
    badgeAria: "RonaldoStats",
    brandSub: `${TOTAL_GOALS} gols de carreira`,
    collapseAria: "Recolher navegação",
    langName: "Português",
    langTag: "PT",
    langSelectAria: "Selecionar idioma (Português)",
    langSelectTitle: "Selecionar idioma",
    searchLabel: "Pesquisar",
    searchAria: "Abrir paleta de comandos",
    grpLive: "Centros e ao vivo",
    grpRivals: "Rivais e copas",
    grpArchive: "Arquivo da carreira",
    home: "Início",
    ronaldo: "vs Messi",
    madrid: "vs Real Madrid",
    ucl: "Champions League",
    byyear: "Gols por Ano",
    byseason: "Temporadas",
    dashboard: "Painel",
    timeline: "História",
    achievements: "Troféus",
    gear: "Loja Ronaldo",
    themeToggle: "Alternar tema",
    darkMode: "Modo escuro"
  },
  fr: {
    badgeAria: "Accueil RonaldoStats",
    brandSub: `${TOTAL_GOALS} buts de carrière`,
    collapseAria: "Réduire la navigation",
    langName: "Français",
    langTag: "FR",
    langSelectAria: "Changer de langue (Français)",
    langSelectTitle: "Changer de langue",
    searchLabel: "Rechercher",
    searchAria: "Ouvrir la palette de commandes",
    grpLive: "Hubs et en direct",
    grpRivals: "Rivaux et coupes",
    grpArchive: "Archives de carrière",
    home: "Accueil",
    ronaldo: "vs Messi",
    madrid: "vs Real Madrid",
    ucl: "Ligue des Champions",
    byyear: "Buts par Année",
    byseason: "Saisons",
    dashboard: "Tableau de bord",
    timeline: "Histoire",
    achievements: "Trophées",
    gear: "Boutique Ronaldo",
    themeToggle: "Basculer le thème",
    darkMode: "Mode sombre"
  },
  ro: {
    badgeAria: "Acasă RonaldoStats",
    brandSub: `${TOTAL_GOALS} goluri în carieră`,
    collapseAria: "Restrânge navigarea",
    langName: "Română",
    langTag: "RO",
    langSelectAria: "Selectează limba (Română)",
    langSelectTitle: "Selectează limba",
    searchLabel: "Caută",
    searchAria: "Deschide paleta de comenzi",
    grpLive: "Huburi și live",
    grpRivals: "Rivalități și cupe",
    grpArchive: "Arhiva carierei",
    home: "Acasă",
    ronaldo: "vs Messi",
    madrid: "vs Real Madrid",
    ucl: "Champions League",
    byyear: "Goluri pe An",
    byseason: "Sezoane",
    dashboard: "Panou",
    timeline: "Carieră",
    achievements: "Trofee",
    gear: "Magazin Ronaldo",
    themeToggle: "Comutare temă",
    darkMode: "Mod întunecat"
  },
  uz: {
    badgeAria: "RonaldoStats bosh sahifa",
    brandSub: `${TOTAL_GOALS} martaba goli`,
    collapseAria: "Navigatsiyani kichraytirish",
    langName: "Oʻzbekcha",
    langTag: "UZ",
    langSelectAria: "Tilni tanlang (Oʻzbekcha)",
    langSelectTitle: "Tilni tanlang",
    searchLabel: "Qidirish",
    searchAria: "Buyruqlar palitrasini ochish",
    grpLive: "Markazlar va jonli",
    grpRivals: "Raqobat va kuboklar",
    grpArchive: "Martaba arxivi",
    home: "Bosh sahifa",
    ronaldo: "Messiga qarshi",
    madrid: "Real Madridga qarshi",
    ucl: "Champions League",
    byyear: "Yillar boʻyi",
    byseason: "Mavsum boʻyi",
    dashboard: "Boshqaruv paneli",
    timeline: "Martaba tarixi",
    achievements: "Yutuqlar",
    gear: "Ronaldo doʻkoni",
    themeToggle: "Mavzuni almashtirish",
    darkMode: "Qorongʻu rejim"
  },
  ar: {
    badgeAria: "الرئيسية RonaldoStats",
    brandSub: `${TOTAL_GOALS} هدفاً في المسيرة`,
    collapseAria: "طي شريط التنقل",
    langName: "العربية",
    langTag: "AR",
    langSelectAria: "اختر اللغة (العربية)",
    langSelectTitle: "اختر اللغة",
    searchLabel: "بحث",
    searchAria: "فتح لوحة الأوامر",
    grpLive: "المراكز والمباشر",
    grpRivals: "المنافسات والكؤوس",
    grpArchive: "أرشيف المسيرة",
    home: "الرئيسية",
    ronaldo: "ضد ميسي",
    madrid: "ضد ريال مدريد",
    ucl: "دوري أبطال أوروبا",
    byyear: "الأهداف سنوياً",
    byseason: "الأهداف بالموسم",
    dashboard: "لوحة البيانات",
    timeline: "مسيرة الأهداف",
    achievements: "الألقاب",
    gear: "متجر رونالدو",
    themeToggle: "تبديل الوضع",
    darkMode: "الوضع الداكن"
  }
};

function generateRailHtml(lang, activeSlug) {
  const L = NAV_LABELS[lang] || NAV_LABELS.en;
  const isAct = (slug) => activeSlug === slug;
  const onAria = (slug) => isAct(slug) ? ' aria-current="page" class="on"' : '';

  const uclLink = lang === "en" ? "/en/champions-league" : `/${lang}/champions-league`;

  return `<aside aria-label="Navigation" class="rail">
<div class="rail-head">
  <a aria-label="${L.badgeAria}" class="rail-badge" href="/${lang}"><img class="rail-mark" src="/img/logo-cr7.webp" alt="" width="36" height="36" /><img class="rail-banner" src="/img/banner-ronaldostats.webp" alt="" width="1200" height="400" /><span class="rail-word"><span class="rail-word-main">Ronaldo<b>Stats</b></span><small class="rail-word-sub" data-rail-goals-sub="1">${L.brandSub}</small></span></a>
  <button type="button" class="rail-collapse-btn" id="rail-collapse-btn" aria-label="${L.collapseAria}" aria-expanded="true" title="${L.collapseAria}"><span class="rail-collapse-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"></rect><line x1="9" y1="3" x2="9" y2="21"></line><polyline points="15 9 12 12 15 15"></polyline></svg></span></button>
</div>
<div class="rail-tools-stack">
  <button type="button" class="rail-search-btn" data-open-cmd="1" aria-label="${L.searchAria}" title="${L.searchAria}"><svg class="rail-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7.5"></circle><line x1="20.5" y1="20.5" x2="16.3" y2="16.3"></line></svg><span class="rail-search-label">${L.searchLabel}</span><span class="rail-search-kbd">Ctrl K</span></button>
</div>
<nav aria-label="Primary">
<span class="rail-nav-group-label" aria-hidden="true">${L.grpLive}</span>
<a${onAria("home")} href="/${lang}" aria-label="${L.home}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M3 11.5 12 3l9 8.5"></path><path d="M5.5 10.5V21h5v-6h3v6h5V10.5"></path></svg><span class="rail-link-text">${L.home}</span><span class="rail-item-meta is-live">${TOTAL_GOALS}</span></a>
<span class="rail-nav-group-label" aria-hidden="true">${L.grpRivals}</span>
<a${onAria("ronaldo-vs-messi")} href="/${lang}/ronaldo-vs-messi" aria-label="${L.ronaldo}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path><path d="M18 8l4 4-4 4"></path></svg><span class="rail-link-text">${L.ronaldo}</span><span class="rail-item-meta">H2H</span></a>
<a${onAria("real-madrid")} href="/${lang}/real-madrid" aria-label="${L.madrid}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path></svg><span class="rail-link-text">${L.madrid}</span><span class="rail-item-meta tnum">${RM_GOALS}G</span></a>
<a${onAria("champions-league")} href="${uclLink}" aria-label="${L.ucl}"><svg aria-hidden="true" viewbox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span class="rail-link-text">${L.ucl}</span><span class="rail-item-meta tnum">${UCL_GOALS}G</span></a>
<span class="rail-nav-group-label" aria-hidden="true">${L.grpArchive}</span>
<a${onAria("byyear")} href="/${lang}/goalsbyyear" aria-label="${L.byyear}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="15.5" rx="2.5" width="17" x="3.5" y="5"></rect><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"></path></svg><span class="rail-link-text">${L.byyear}</span></a>
<a${onAria("byseason")} href="/${lang}/goalsbyseason" aria-label="${L.byseason}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="13"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="13"></rect></svg><span class="rail-link-text">${L.byseason}</span></a>
<a${onAria("dashboard")} href="/${lang}/dashboard" aria-label="${L.dashboard}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M3.5 20.5h17"></path><path d="M6.5 20v-7M12 20V5M17.5 20v-10"></path></svg><span class="rail-link-text">${L.dashboard}</span></a>
<a${onAria("timeline")} href="/${lang}/timeline" aria-label="${L.timeline}"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg><span class="rail-link-text">${L.timeline}</span><span class="rail-item-meta">2002–26</span></a>
<a${onAria("achievements")} href="/${lang}/trophies" aria-label="${L.achievements}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M8 3.5h8V9a4 4 0 0 1-8 0V3.5Z"></path><path d="M8 5H4.5A1.5 1.5 0 0 0 6 10H8M16 5h3.5A1.5 1.5 0 0 1 18 10h-2M12 13v3.5M8.5 20.5h7M10 16.5h4V20h-4z"></path></svg><span class="rail-link-text">${L.achievements}</span><span class="rail-item-meta tnum">${TROPHIES}</span></a>
<a${onAria("gear")} href="/${lang}/gear" aria-label="${L.gear}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg><span class="rail-link-text">${L.gear}</span></a>
</nav>
<div class="rail-footer">
  <div class="rail-lang-wrap">
    <button type="button" class="rail-lang-btn" id="rail-lang-btn" aria-label="${L.langSelectAria}" title="${L.langSelectTitle}">
      <svg class="rail-lang-globe" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      <span class="rail-lang-label">${L.langName}</span>
      <span class="rail-lang-tag">${L.langTag}</span>
    </button>
  </div>
  <button aria-label="${L.themeToggle}" class="theme-toggle" id="theme-toggle" title="${L.themeToggle}" type="button">
    <svg aria-hidden="true" class="sun-icon" viewbox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
    <svg aria-hidden="true" class="moon-icon" viewbox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    <span class="theme-label">${L.darkMode}</span>
  </button>
</div>
</aside>`;
}

function updateFileRail(filePath, lang, activeSlug) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf8");

  const railRegex = /<aside[^>]*class=["'][^"']*rail[^"']*["'][^>]*>[\s\S]*?<\/aside>/i;
  if (!railRegex.test(content)) {
    console.warn(`No rail found in ${filePath}`);
    return;
  }

  const newRail = generateRailHtml(lang, activeSlug);
  content = content.replace(railRegex, newRail);

  fs.writeFileSync(filePath, content, "utf8");
}

// The ten English shells. Localized shells are generated from these by
// scripts/generate-i18n-pages.mjs — this script deliberately leaves <lang>/
// pages (and everything outside the <aside class="rail"> block) untouched.
const PAGES_MAP = {
  "index.html": "home",
  "dashboard.html": "dashboard",
  "goalsbyyear.html": "byyear",
  "goalsbyseason.html": "byseason",
  "timeline.html": "timeline",
  "trophies.html": "achievements",
  "ronaldo-vs-messi.html": "ronaldo-vs-messi",
  "real-madrid.html": "real-madrid",
  "champions-league.html": "champions-league",
  "gear.html": "gear"
};

for (const [file, slug] of Object.entries(PAGES_MAP)) {
  updateFileRail(path.join(rootDir, file), "en", slug);
}

console.log("Unified and updated the 2.0 rail navigation in all 10 English shells!");
