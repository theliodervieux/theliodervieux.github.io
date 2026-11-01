/* ════════════════════════════════════════════════════════════════════
   APP — navigation, affichage des pages, langue, thème, aperçus
   Le contenu se modifie dans js/data.js
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SITE = window.SITE, PROJECTS = window.PROJECTS, COMP = window.COMPETENCES, TEXTS = window.TEXTS, UI = window.UI;
  var M = window.Motion;
  var root = document.documentElement;
  var main = document.getElementById('main');

  /* ── État ──────────────────────────────────────────────────────── */
  var state = {
    lang: root.lang === 'en' ? 'en' : 'fr',
    view: null,
    slug: null,
    reviewOpen: false,
    reviewTab: 'but1',
    cleanups: []
  };
  var scrollMemory = {};
  var navByClick = false;
  var firstRender = true;

  /* ── Utilitaires ───────────────────────────────────────────────── */
  function t(key, vars) {
    var s = (UI[state.lang] && UI[state.lang][key]);
    if (s === undefined) s = UI.fr[key];
    if (vars) Object.keys(vars).forEach(function (k) { s = String(s).replace('{' + k + '}', vars[k]); });
    return s;
  }
  function L(obj) { return obj ? (obj[state.lang] !== undefined ? obj[state.lang] : obj.fr) : ''; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function fileUrl(p) { return p.split('/').map(encodeURIComponent).join('/'); }

  function age() {
    var b = new Date(SITE.birthDate + 'T00:00:00'), n = new Date();
    var a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  }
  function butYear() {
    var s = new Date(SITE.butStart + 'T00:00:00'), n = new Date();
    var months = (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth());
    return Math.min(3, Math.max(1, Math.floor(months / 12) + 1));
  }
  function fmtDate(iso) {
    var d = new Date(iso + 'T12:00:00');
    return cap(new Intl.DateTimeFormat(state.lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'long', year: 'numeric' }).format(d));
  }
  function schoolYear(but) {
    var y = new Date(SITE.butStart).getFullYear() + but - 1;
    return y + '–' + (y + 1);
  }
  function butLabel(p) {
    return state.lang === 'fr' ? 'BUT ' + p.but + ' · Semestre ' + p.semester : 'Year ' + p.but + ' · Semester ' + p.semester;
  }
  function sorted() { return PROJECTS.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }); }
  function allTools() {
    var count = {};
    PROJECTS.forEach(function (p) { p.tools.forEach(function (x) { count[x] = (count[x] || 0) + 1; }); });
    return Object.keys(count).sort(function (a, b) { return count[b] - count[a] || a.localeCompare(b); });
  }
  function md(src) {
    var lines = esc(src).split('\n'), out = [], list = false, para = [];
    function flushP() { if (para.length) { out.push('<p>' + para.join(' ') + '</p>'); para = []; } }
    function flushL() { if (list) { out.push('</ul>'); list = false; } }
    lines.forEach(function (raw) {
      var line = raw.trim().replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (!line) { flushP(); flushL(); return; }
      if (line.indexOf('## ') === 0) { flushP(); flushL(); out.push('<h2>' + line.slice(3) + '</h2>'); return; }
      if (line.indexOf('- ') === 0) { flushP(); if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + line.slice(2) + '</li>'); return; }
      flushL(); para.push(line);
    });
    flushP(); flushL();
    return out.join('');
  }

  /* ── Icônes ────────────────────────────────────────────────────── */
  var I = {
    arrow: '<svg class="i-arrow" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    arrowL: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
    arrowUR: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>',
    eye: '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    dl: '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',
    doc: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    mail: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    copy: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    chevron: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    plus: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    target: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    mountain: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 20 6.5-11 4 6.5L16 12l5 8Z"/><path d="M14 5V2l3 1.5L14 5"/></svg>',
    team: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 4.8"/></svg>',
    trophy: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>',
    compass: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/></svg>'
  };

  /* ── Composants ────────────────────────────────────────────────── */
  function compPill(id) { return '<span class="pill pill--' + id + '">' + esc(L(COMP[id].short)) + '</span>'; }

  function card(p, big, i) {
    var comps = p.competences.map(function (c) { return compPill(c.id); }).join('');
    return '<a class="card' + (big ? ' card--big' : '') + '" href="#/projets/' + p.slug + '" data-slug="' + p.slug + '" data-flip="' + p.slug + '" data-reveal style="--d:' + (i || 0) % 3 + '">' +
      '<div class="card__media"><img src="' + p.thumb + '" alt="" loading="lazy" decoding="async"><span class="card__go">' + I.arrowUR + '</span></div>' +
      '<div class="card__body">' +
        '<div class="pills">' + comps + '</div>' +
        '<h3 class="card__title">' + esc(L(p.title)) + '</h3>' +
        '<p class="card__desc">' + esc(L(p.short)) + '</p>' +
        '<div class="card__meta"><span>' + esc(p.tools.slice(0, 4).join(' · ')) + '</span><b>' + fmtDate(p.date) + '</b></div>' +
      '</div></a>';
  }

  function cvButtons(cls) {
    if (SITE.cv.available) {
      return '<button type="button" class="btn btn--olive ' + (cls || '') + '" data-preview-cv>' + I.eye + '<span>' + t('preview') + '</span></button>' +
        '<a class="btn btn--ghost ' + (cls || '') + '" href="' + SITE.cv.path + '" download="CV - Thelio Dervieux.pdf">' + I.dl + '<span>' + t('download') + '</span></a>';
    }
    return '<button type="button" class="btn btn--olive ' + (cls || '') + '" aria-disabled="true" data-cv-soon>' + I.eye + '<span>' + t('preview') + '</span></button>' +
      '<button type="button" class="btn btn--ghost ' + (cls || '') + '" aria-disabled="true" data-cv-soon>' + I.dl + '<span>' + t('download') + '</span></button>';
  }

  /* ════════════════════════════════════════════════════════════════
     VUE : ACCUEIL
     ════════════════════════════════════════════════════════════════ */
  function viewHome() {
    var n = butYear();
    var intro = L(TEXTS.heroIntro).replace('{year}', t('ordinal')[n - 1]).replace('{Year}', cap(t('ordinal')[n - 1]));
    var nameRows = ['Thélio', 'Dervieux'].map(function (w, r) {
      return '<span class="row">' + w.split('').map(function (c, i) { return '<span class="ch" style="--i:' + (i + r * 6) + '">' + c + '</span>'; }).join('') + '</span>';
    }).join('');
    var featured = sorted().filter(function (p) { return p.featured; }).slice(0, 6);
    var tools = allTools();
    var colors = ['var(--olive)', 'var(--ochre)', 'var(--clay)'];
    var mq = function (list, off) { return list.map(function (x, i) { return '<span class="marquee__item"><i style="--c:' + colors[(i + off) % 3] + '"></i>' + esc(x) + '</span>'; }).join(''); };
    var half = Math.ceil(tools.length / 2);

    var about = L(TEXTS.about).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var path = TEXTS.timeline.map(function (s, i) {
      return '<li class="' + (s.current ? 'is-current' : '') + '" style="--i:' + i + '"><span class="journey__years">' + esc(L(s.years)) + '</span><strong>' + esc(L(s.title)) + '</strong><small>' + esc(L(s.place)) + '</small></li>';
    }).join('');
    var facts = TEXTS.facts.map(function (f) {
      return '<div' + (f.highlight ? ' class="is-hl"' : '') + '><dt>' + esc(L(f.k)) + '</dt><dd>' + esc(L(f.v).replace('{age}', age()).replace('{year}', t('ordinalShort')[n - 1])) + '</dd></div>';
    }).join('');
    var values = TEXTS.values.map(function (v, i) {
      return '<article class="value" data-reveal style="--d:' + i + '"><span class="value__icon">' + I[v.icon] + '</span><h4>' + esc(L(v.title)) + '</h4><p>' + esc(L(v.text)) + '</p></article>';
    }).join('');


    var cvHero = SITE.cv.available
      ? '<button type="button" class="btn btn--card" data-preview-cv>' + I.doc + '<span>' + t('heroCv') + '</span></button>'
      : '<a class="btn btn--card" href="#/contact">' + I.doc + '<span>' + t('heroCv') + '</span></a>';

    return '' +
    '<section class="wrap hero" id="accueil">' +
      '<div class="hero__card"><div class="hero__bg" aria-hidden="true">' + M.plotSVG() + '</div>' +
        '<div class="hero__text">' +
          '<span class="hero__badge"><span class="pulse" aria-hidden="true"></span>' + (SITE.internship ? esc(L(SITE.internship)) : t('heroBadge')) + '</span>' +
          '<h1 class="hero__name" aria-label="Thélio Dervieux"><span aria-hidden="true">' + nameRows + '</span></h1>' +
          '<p class="hero__intro" data-reveal style="--d:5">' + esc(intro) + '</p>' +
          '<div class="hero__cta" data-reveal style="--d:7">' +
            '<a class="btn btn--olive" href="#/projets" data-magnetic><span>' + t('heroCta') + '</span>' + I.arrow + '</a>' + cvHero +
          '</div>' +
        '</div>' +
        '<div class="hero__visual">' +
          '<div class="portrait">' +
            '<div class="portrait__back" aria-hidden="true"></div>' +
            '<div class="portrait__img"><img src="' + SITE.photo + '" alt="' + (state.lang === 'fr' ? 'Photo de Thélio Dervieux' : 'Photo of Thélio Dervieux') + '" fetchpriority="high"></div>' +
            '<span class="sticker sticker--a">' + age() + ' ' + t('years') + '</span>' +
            '<span class="sticker sticker--b">' + t('stickerPlace') + '</span>' +
            '<span class="sticker sticker--c">' + t('butYear', { n: t('ordinalShort')[n - 1] }) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="stats">' +
        '<div class="stat" data-reveal style="--d:0"><span class="stat__n" data-count="' + PROJECTS.length + '">0</span><span class="stat__l">' + t('statProjects') + '</span></div>' +
        '<div class="stat" data-reveal style="--d:1"><span class="stat__n" data-count="3">0</span><span class="stat__l">' + t('statSkills') + '</span></div>' +
        '<div class="stat" data-reveal style="--d:2"><span class="stat__n" data-count="' + tools.length + '">0</span><span class="stat__l">' + t('statTools') + '</span></div>' +
      '</div>' +
    '</section>' +

    '<section class="marquee" aria-label="' + esc(t('toolsBand')) + '">' +
      '<p class="marquee__label">' + t('toolsBand') + '</p>' +
      '<div class="marquee__track"><div class="marquee__row">' + mq(tools.slice(0, half), 0) + '</div></div>' +
      '<div class="marquee__track"><div class="marquee__row marquee__row--alt">' + mq(tools.slice(half), 1) + '</div></div>' +
    '</section>' +

    '<section class="wrap section" id="apropos">' +
      '<div class="section-head"><div><span class="kicker">' + t('navAbout') + '</span><h2 class="title-xl" data-split>' + t('aboutTitle') + '</h2></div></div>' +
      '<div class="about-stack">' +
        '<div class="about">' +
          '<div class="panel about__text" data-reveal>' + about + '</div>' +
          '<aside class="panel about__brief" data-reveal style="--d:1"><h3>' + t('aboutBrief') + '</h3><dl class="facts">' + facts + '</dl></aside>' +
        '</div>' +
        '<div class="panel journey" data-reveal><h3>' + t('aboutPath') + '</h3>' +
          '<ol class="journey__list"><span class="journey__track" aria-hidden="true"><span></span></span>' + path + '</ol></div>' +
        '<div class="values-wrap"><h3 class="sub-title" data-reveal>' + t('aboutValues') + '</h3><div class="values">' + values + '</div></div>' +
      '</div>' +
    '</section>' +

    '<section class="wrap section" id="projets-home">' +
      '<div class="section-head"><div><span class="kicker">' + t('navProjects') + '</span><h2 class="title-xl" data-split>' + t('featuredTitle') + '</h2></div>' +
        '<a class="btn btn--ink" href="#/projets" data-magnetic><span>' + t('featuredAll', { n: PROJECTS.length }) + '</span>' + I.arrow + '</a></div>' +
      '<div class="grid grid--home">' + featured.map(function (p, i) { return card(p, i === 0, i); }).join('') + '</div>' +
    '</section>' +

    '<section class="wrap section" id="bilan">' + reviewHTML() + '</section>' +

    '<section class="wrap section" id="contact">' +
      '<div class="contact">' +
        '<div class="panel contact__mail" data-reveal>' +
          '<span class="contact__icon">' + I.mail + '</span>' +
          '<span class="kicker">' + t('contactKicker') + '</span>' +
          '<h2 class="contact__title" data-split>' + t('contactTitle') + '</h2>' +
          '<a class="contact__link" href="mailto:' + SITE.email + '">' + SITE.email + '</a>' +
          '<div class="contact__actions">' +
            '<a class="btn btn--olive btn--sm" href="mailto:' + SITE.email + '" data-magnetic>' + I.mail.replace('width="24" height="24"', 'width="16" height="16"') + '<span>' + (state.lang === 'fr' ? 'Écrire un e-mail' : 'Send an email') + '</span></a>' +
            '<button type="button" class="btn btn--ghost btn--sm" data-copy>' + I.copy + '<span>' + t('copy') + '</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="panel contact__cv" data-reveal style="--d:1">' +
          '<div class="cv-sheet" aria-hidden="true"><span></span><span></span><span><i></i><i></i><i></i><i></i><i></i></span></div>' +
          '<h3>' + t('cvTitle') + '</h3>' +
          '<p>' + (SITE.cv.available ? t('cvSub') : t('cvSoon')) + '</p>' +
          '<div class="contact__actions">' + cvButtons('btn--sm') + '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function reviewHTML() {
    var tabs = TEXTS.bilans.map(function (b) {
      return '<button type="button" role="tab" data-tab="' + b.id + '" aria-selected="' + (state.reviewTab === b.id) + '">' + esc(L(b.label)) + (b.upcoming ? '<small>' + (state.lang === 'fr' ? 'à venir' : 'soon') + '</small>' : '') + '</button>';
    }).join('');
    var b = TEXTS.bilans.filter(function (x) { return x.id === state.reviewTab; })[0];
    var body;
    if (b.upcoming) {
      body = '<p class="review__soon">' + t('reviewSoon') + '</p>';
    } else {
      var words = L(b.quote).split(/\s+/).map(function (w) { return '<span class="qw">' + esc(w) + '</span>'; }).join(' ');
      var items = b.sections.map(function (sec, i) {
        return '<article class="review__item" data-reveal style="--d:' + (i % 2) + '">' +
          '<span class="review__num" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<h3>' + esc(L(sec.title)) + '</h3>' +
          '<p>' + esc(L(sec.text)) + '</p></article>';
      }).join('');
      body = '<blockquote class="review__quote"><span class="review__mark" aria-hidden="true">“</span>' + words + '</blockquote>' +
        '<div class="review__sections">' + items + '</div>';
    }
    return '<div class="review" data-reveal="scale">' +
      '<div class="review__top"><div><span class="kicker review__kicker">' + t('reviewKicker') + '</span>' +
      '<h2 class="title-lg">' + esc(L(b.title || TEXTS.bilans[0].title)) + '</h2></div>' +
      '<div class="tabs" role="tablist">' + tabs + '</div></div>' + body + '</div>';
  }

  function mountHome() {
    var hero = main.querySelector('.hero');
    main.querySelectorAll('[data-split]').forEach(function (el) { M.splitWords(el); });
    M.heroInteractions(hero);
    if ('IntersectionObserver' in window) {
      var hio = new IntersectionObserver(function (en) { hero.classList.toggle('is-paused', !en[0].isIntersecting); });
      hio.observe(hero);
      state.cleanups.push(function () { hio.disconnect(); });
    }
    state.cleanups.push(M.marquee(main.querySelector('.marquee')));

    // Compteurs
    main.querySelectorAll('[data-count]').forEach(function (el) {
      el.closest('[data-reveal]').addEventListener('reveal', function () { M.countUp(el, +el.dataset.count); }, { once: true });
    });

    // Frise : la ligne se remplit au défilement
    var tl = main.querySelector('.journey__list');
    var items = tl ? tl.querySelectorAll('li') : [];
    var tlFn = M.onScroll(function () {
      if (!tl) return;
      var r = tl.getBoundingClientRect(), vh = innerHeight;
      var p = M.reduced() ? 1 : Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.55)));
      tl.style.setProperty('--tp', p.toFixed(3));
      items.forEach(function (li, i) { li.classList.toggle('is-lit', p >= i / Math.max(1, items.length - 1) - 0.02); });
    });
    state.cleanups.push(function () { M.offScroll(tlFn); });

    bindReview();

    // Le héros s'anime après l'intro
    var start = function () {
      hero.classList.add('is-in');
      M.observe(main);
      setTimeout(function () { hero.classList.add('is-settled'); }, 2600);
    };
    if (firstRender) M.intro(start); else requestAnimationFrame(start);
  }

  function bindReview() {
    var sec = main.querySelector('#bilan');
    if (!sec) return;
    sec.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.reviewTab = b.dataset.tab;
        sec.innerHTML = reviewHTML();
        sec.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
        bindReview();
        sec.querySelector('[data-tab="' + state.reviewTab + '"]').focus();
      });
    });
    M.observe(sec);
    // Les mots de la citation s'allument au fil du défilement
    var words = sec.querySelectorAll('.qw');
    if (state.quoteFn) M.offScroll(state.quoteFn);
    if (!words.length) return;
    if (M.reduced()) { words.forEach(function (w) { w.classList.add('on'); }); return; }
    var quote = sec.querySelector('.review__quote');
    state.quoteFn = M.onScroll(function () {
      var r = quote.getBoundingClientRect(), vh = innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5)));
      var lit = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < lit); });
    });
    state.cleanups.push(function () { M.offScroll(state.quoteFn); });
  }

  /* ════════════════════════════════════════════════════════════════
     VUE : TOUS LES PROJETS
     ════════════════════════════════════════════════════════════════ */
  var filters = { q: '', c: 'all', y: 'all' };

  function viewProjects(query) {
    filters.q = query.get('q') || '';
    filters.c = query.get('c') || 'all';
    filters.y = query.get('y') || 'all';
    var segC = [['all', t('all')], ['C1', L(COMP.C1.short)], ['C2', L(COMP.C2.short)], ['C3', L(COMP.C3.short)]];
    var dot = { C1: 'var(--olive)', C2: 'var(--ochre)', C3: 'var(--clay)' };
    var segY = [['all', t('all')], ['1', state.lang === 'fr' ? 'BUT 1' : 'Year 1'], ['2', state.lang === 'fr' ? 'BUT 2' : 'Year 2']];
    return '<section class="wrap page-head">' +
      '<span class="kicker">' + t('navProjects') + '</span>' +
      '<h1 class="title-xl" data-split>' + t('allTitle') + '</h1>' +
      '<p class="lead" data-reveal style="--d:3;margin-top:18px">' + t('allIntro') + '</p>' +
      '<div class="filters" data-reveal style="--d:4">' +
        '<label class="search">' + I.search + '<span class="sr-only">' + t('search') + '</span><input type="search" id="q" placeholder="' + esc(t('search')) + '" value="' + esc(filters.q) + '" autocomplete="off"></label>' +
        '<div class="seg" role="group" aria-label="' + t('filterSkill') + '" data-group="c"><span class="seg__thumb" aria-hidden="true"></span>' +
          segC.map(function (s) { return '<button type="button" data-v="' + s[0] + '" aria-pressed="' + (filters.c === s[0]) + '">' + (dot[s[0]] ? '<i style="background:' + dot[s[0]] + '"></i>' : '') + esc(s[1]) + '</button>'; }).join('') + '</div>' +
        '<div class="seg" role="group" aria-label="' + t('filterYear') + '" data-group="y"><span class="seg__thumb" aria-hidden="true"></span>' +
          segY.map(function (s) { return '<button type="button" data-v="' + s[0] + '" aria-pressed="' + (filters.y === s[0]) + '">' + esc(s[1]) + '</button>'; }).join('') + '</div>' +
      '</div>' +
      '<p class="count" id="count" aria-live="polite"></p>' +
      '<div class="grid" id="all-grid"></div>' +
    '</section>';
  }

  function filtered() {
    var q = filters.q.trim().toLowerCase();
    return sorted().filter(function (p) {
      if (filters.c !== 'all' && !p.competences.some(function (c) { return c.id === filters.c; })) return false;
      if (filters.y !== 'all' && String(p.but) !== filters.y) return false;
      if (!q) return true;
      var hay = [L(p.title), L(p.short), p.tools.join(' '), p.competences.map(function (c) { return L(COMP[c.id].short); }).join(' ')].join(' ').toLowerCase();
      hay = hay.normalize ? hay.normalize('NFD').replace(/[̀-ͯ]/g, '') : hay;
      var qq = q.normalize ? q.normalize('NFD').replace(/[̀-ͯ]/g, '') : q;
      return qq.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    });
  }

  function renderGrid(animate) {
    var grid = document.getElementById('all-grid');
    if (!grid) return;
    var list = filtered();
    var build = function () {
      if (!list.length) {
        var msg = filters.y === '2' ? t('upcomingYear') : t('noResult');
        grid.innerHTML = '<div class="empty"><p>' + msg + '</p><button type="button" class="btn btn--ink btn--sm" data-reset>' + t('reset') + '</button></div>';
      } else {
        var html = '', lastBut = null;
        list.forEach(function (p, i) {
          if (p.but !== lastBut) {
            html += '<div class="year-head" data-flip="year-' + p.but + '">' + (state.lang === 'fr' ? 'BUT ' + p.but : 'Year ' + p.but) + ' · ' + schoolYear(p.but) + '</div>';
            lastBut = p.but;
          }
          html += card(p, false, i);
        });
        grid.innerHTML = html;
        grid.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); el.removeAttribute('data-reveal'); });
        grid.querySelectorAll('.card').forEach(function (c) { M.tilt(c); });
      }
      var n = list.length;
      document.getElementById('count').textContent = (n > 1 ? t('foundPlural') : t('found')).replace('{n}', n);
      var r = grid.querySelector('[data-reset]');
      if (r) r.addEventListener('click', function () { filters = { q: '', c: 'all', y: 'all' }; syncFilters(); });
    };
    if (animate) M.flip(grid, build); else build();
  }

  function syncFilters() {
    var qs = [];
    if (filters.q) qs.push('q=' + encodeURIComponent(filters.q));
    if (filters.c !== 'all') qs.push('c=' + filters.c);
    if (filters.y !== 'all') qs.push('y=' + filters.y);
    history.replaceState(null, '', '#/projets' + (qs.length ? '?' + qs.join('&') : ''));
    var input = document.getElementById('q');
    if (input && input.value !== filters.q) input.value = filters.q;
    main.querySelectorAll('.seg').forEach(function (g) {
      g.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(filters[g.dataset.group] === b.dataset.v)); });
      M.moveThumb(g);
    });
    renderGrid(true);
  }

  function mountProjects() {
    main.querySelectorAll('[data-split]').forEach(function (el) { M.splitWords(el); });
    renderGrid(false);
    // Les cartes initiales apparaissent en cascade
    if (!M.reduced()) main.querySelectorAll('#all-grid > *').forEach(function (el, i) {
      el.animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 250 + i * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
    var input = document.getElementById('q'), timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { filters.q = input.value; syncFilters(); }, 140);
    });
    main.querySelectorAll('.seg').forEach(function (g) {
      requestAnimationFrame(function () { M.moveThumb(g); });
      g.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { filters[g.dataset.group] = b.dataset.v; syncFilters(); });
      });
    });
    var onResize = function () { main.querySelectorAll('.seg').forEach(M.moveThumb); };
    window.addEventListener('resize', onResize);
    state.cleanups.push(function () { window.removeEventListener('resize', onResize); });
    M.observe(main);
  }

  /* ════════════════════════════════════════════════════════════════
     VUE : PROJET
     ════════════════════════════════════════════════════════════════ */
  function neighbours(slug) {
    var list = sorted(), i = list.map(function (p) { return p.slug; }).indexOf(slug);
    return { prev: list[(i - 1 + list.length) % list.length], next: list[(i + 1) % list.length], index: i, total: list.length };
  }

  function viewProject(p) {
    var nb = neighbours(p.slug);
    var facts = [{ k: t('date'), v: fmtDate(p.date) }, { k: state.lang === 'fr' ? 'Cadre' : 'Setting', v: butLabel(p) }]
      .concat((p.facts || []).map(function (f) { return { k: L(f.k), v: L(f.v) }; }));
    var skills = p.competences.map(function (c, i) {
      var C = COMP[c.id];
      return '<article class="skill skill--' + c.id + '" data-reveal style="--d:' + i + '">' +
        '<span class="skill__tag">' + esc(L(C.short)) + '</span>' +
        '<h3>' + esc(L(C.name)) + '</h3>' +
        '<p>' + esc(L(c.proof)) + '</p>' +
        '<details class="skill__acs"><summary>' + I.plus + t('acLabel') + ' (' + c.acs.length + ')</summary><ul>' +
          c.acs.map(function (a) { return '<li><code>' + a + '</code><span>' + esc(L(C.acs[a])) + '</span></li>'; }).join('') +
        '</ul></details></article>';
    }).join('');
    var files = (p.files || []).map(function (f, i) {
      var name = L(f.name);
      var canPreview = f.type === 'PDF' || f.type === 'PNG' || f.type === 'JPG';
      return '<li class="file"><span class="file__badge file__badge--' + f.type + '">' + f.type + '</span>' +
        '<span class="file__name">' + esc(name) + '</span>' +
        (canPreview ? '<button type="button" class="icon-btn" data-preview="' + i + '" aria-label="' + esc(t('preview') + ' : ' + name) + '">' + I.eye + '</button>' : '') +
        '<a class="icon-btn icon-btn--dl" href="' + fileUrl(f.path) + '" download="' + esc(f.dl || f.path.split('/').pop()) + '" aria-label="' + esc(t('download') + ' : ' + name) + '">' + I.dl + '</a></li>';
    }).join('');
    var gallery = (p.gallery || []).length ? '<section class="panel" data-reveal><h2 class="h">' + t('gallery') + '</h2><div class="gallery">' +
      p.gallery.map(function (g, i) { return '<figure style="margin:0"><button type="button" data-gallery="' + i + '"><img src="' + fileUrl(g.src) + '" alt="' + esc(L(g.caption)) + '" loading="lazy"><figcaption>' + esc(L(g.caption)) + '</figcaption></button></figure>'; }).join('') +
      '</div></section>' : '';
    var pn = function (q, dir) {
      return '<a class="' + (dir === 'next' ? 'pn--next' : '') + '" href="#/projets/' + q.slug + '" data-slug="' + q.slug + '" data-reveal style="--d:' + (dir === 'next' ? 1 : 0) + '">' +
        '<img src="' + q.thumb + '" alt="" loading="lazy"><span><small>' + (dir === 'next' ? t('nextProject') + ' →' : '← ' + t('prevProject')) + '</small><strong>' + esc(L(q.title)) + '</strong></span></a>';
    };
    var role = (p.facts || []).filter(function (f) { return /rôle|role/i.test(f.k.fr); })[0];

    return '<div class="wrap p-top">' +
        '<a class="btn btn--card btn--sm" href="#/projets">' + I.arrowL + '<span>' + t('back') + '</span></a>' +
        '<div class="p-top__nav"><a class="btn btn--card btn--sm" href="#/projets/' + nb.prev.slug + '" data-slug="' + nb.prev.slug + '" aria-label="' + esc(t('prevProject') + ' : ' + L(nb.prev.title)) + '">← <span>' + t('prev') + '</span></a>' +
        '<a class="btn btn--ink btn--sm" href="#/projets/' + nb.next.slug + '" data-slug="' + nb.next.slug + '" aria-label="' + esc(t('nextProject') + ' : ' + L(nb.next.title)) + '"><span>' + t('next') + '</span> →</a></div>' +
      '</div>' +
      '<section class="wrap"><div class="p-hero">' +
        '<div class="p-hero__chips" data-reveal>' +
          '<span class="chip">' + t('project') + ' ' + String(nb.index + 1).padStart(2, '0') + ' / ' + nb.total + '</span>' +
          '<span class="chip">' + fmtDate(p.date) + '</span>' +
          '<span class="chip">' + butLabel(p) + '</span>' +
          (role ? '<span class="chip chip--olive">' + esc(L(role.k)) + ' : ' + esc(L(role.v)) + '</span>' : '') +
        '</div>' +
        '<h1 class="p-hero__title" data-split>' + esc(L(p.title)) + '</h1>' +
        '<div class="p-hero__media"><img src="' + p.thumb + '" alt="" id="p-media"></div>' +
      '</div></section>' +
      '<section class="wrap p-body">' +
        '<div class="p-main">' +
          '<article class="panel prose" data-reveal>' + md(L(p.long)) + '</article>' +
          '<section class="panel" data-reveal><h2 class="h">' + t('skillsTitle') + '</h2><p class="side-hint" style="margin:0">' + t('skillsSub') + '</p><div class="skills">' + skills + '</div></section>' +
          gallery +
        '</div>' +
        '<aside class="p-side">' +
          '<section class="panel" data-reveal="left"><dl class="facts">' + facts.map(function (f) { return '<div><dt>' + esc(f.k) + '</dt><dd>' + esc(f.v) + '</dd></div>'; }).join('') + '</dl></section>' +
          '<section class="panel" data-reveal="left" style="--d:1"><h2>' + t('tools') + '</h2><div class="pills">' + p.tools.map(function (x) { return '<span class="pill pill--tool">' + esc(x) + '</span>'; }).join('') + '</div></section>' +
          (files ? '<section class="panel" data-reveal="left" style="--d:2"><h2>' + t('files') + '</h2><p class="side-hint">' + t('filesHint') + '</p><ul class="files">' + files + '</ul></section>' : '') +
        '</aside>' +
      '</section>' +
      '<nav class="wrap pn" aria-label="' + (state.lang === 'fr' ? 'Autres projets' : 'Other projects') + '">' + pn(nb.prev, 'prev') + pn(nb.next, 'next') + '</nav>' +
      '<p class="wrap key-hint">' + t('keyHint') + '</p>';
  }

  function mountProject(p) {
    main.querySelectorAll('[data-split]').forEach(function (el) { M.splitWords(el, 150); });
    main.querySelectorAll('[data-preview]').forEach(function (b) {
      b.addEventListener('click', function () { openFile(p.files[+b.dataset.preview]); });
    });
    main.querySelectorAll('[data-gallery]').forEach(function (b) {
      b.addEventListener('click', function () { var g = p.gallery[+b.dataset.gallery]; openFile({ type: 'PNG', path: g.src, name: g.caption }); });
    });
    var nb = neighbours(p.slug);
    var onKey = function (e) {
      if (e.target.closest('input, textarea') || viewer.open || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') { navByClick = true; markMedia(nb.next.slug); location.hash = '#/projets/' + nb.next.slug; }
      if (e.key === 'ArrowLeft') { navByClick = true; markMedia(nb.prev.slug); location.hash = '#/projets/' + nb.prev.slug; }
    };
    document.addEventListener('keydown', onKey);
    state.cleanups.push(function () { document.removeEventListener('keydown', onKey); });
    if (!M.reduced()) {
      var media = main.querySelector('.p-hero__media img');
      var par = M.onScroll(function (y) { if (media) media.style.transform = 'scale(1.06) translateY(' + Math.min(y * 0.06, 40).toFixed(1) + 'px)'; });
      state.cleanups.push(function () { M.offScroll(par); });
    }
    M.observe(main);
  }

  /* ════════════════════════════════════════════════════════════════
     VUE : 404
     ════════════════════════════════════════════════════════════════ */
  function viewNotFound() {
    return window.NotFoundView({ t: t, base: '#/', plot: M.plotSVG() });
  }

  /* ════════════════════════════════════════════════════════════════
     ROUTEUR
     ════════════════════════════════════════════════════════════════ */
  var SECTIONS = { 'a-propos': 'apropos', 'bilan': 'bilan', 'contact': 'contact' };
  var LEGACY = { accueil: '/', apropos: '/a-propos', projets: '/projets', bilan: '/bilan', contact: '/contact' };

  function parse() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (LEGACY[h]) { history.replaceState(null, '', '#' + LEGACY[h]); h = LEGACY[h]; }
    var parts = h.split('?'), path = parts[0] || '/', query = new URLSearchParams(parts[1] || '');
    var seg = path.split('/').filter(Boolean);
    if (!seg.length) return { view: 'home', query: query };
    if (SECTIONS[seg[0]] && seg.length === 1) return { view: 'home', section: SECTIONS[seg[0]], query: query };
    if (seg[0] === 'projets' && seg.length === 1) return { view: 'projects', query: query };
    if (seg[0] === 'projets' && seg.length === 2) {
      var p = PROJECTS.filter(function (x) { return x.slug === seg[1]; })[0];
      if (p) return { view: 'project', project: p, query: query };
    }
    return { view: '404', query: query };
  }

  function navKey(r) {
    if (r.view === 'projects' || r.view === 'project') return 'projects';
    if (r.view === 'home') return ({ apropos: 'about', bilan: 'review', contact: 'contact' })[r.section] || 'home';
    return null;
  }

  function scrollToSection(id, smooth) {
    var el = id ? document.getElementById(id) : null;
    var top = el ? el.getBoundingClientRect().top + scrollY - 96 : 0;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth && !M.reduced() ? 'smooth' : 'instant' });
  }

  function cleanup() { state.cleanups.forEach(function (fn) { try { fn && fn(); } catch (e) {} }); state.cleanups = []; }

  function render(r, opts) {
    opts = opts || {};
    cleanup();
    if (firstRender && r.view !== 'home') { var it = document.getElementById('intro'); if (it) it.remove(); }
    state.view = r.view;
    state.slug = r.project ? r.project.slug : null;
    if (r.view === 'home') { main.innerHTML = viewHome(); mountHome(); document.title = 'Thélio Dervieux — Portfolio'; }
    else if (r.view === 'projects') { main.innerHTML = viewProjects(r.query); mountProjects(); document.title = t('navProjects') + ' — Thélio Dervieux'; }
    else if (r.view === 'project') { main.innerHTML = viewProject(r.project); mountProject(r.project); document.title = L(r.project.title) + ' — Thélio Dervieux'; }
    else { main.innerHTML = viewNotFound(); document.title = '404 — Thélio Dervieux'; M.observe(main); }

    // Liens et effets communs
    main.querySelectorAll('[data-magnetic]').forEach(function (b) { M.magnetic(b); });
    main.querySelectorAll('.card').forEach(function (c) { M.tilt(c); });
    main.querySelectorAll('[data-preview-cv]').forEach(function (b) { b.addEventListener('click', openCV); });
    main.querySelectorAll('[data-cv-soon]').forEach(function (b) { b.addEventListener('click', function () { toast(t('cvSoon')); }); });
    main.querySelectorAll('[data-copy]').forEach(function (b) { b.addEventListener('click', copyEmail); });

    setActiveNav(navKey(r));
    if (opts.scroll === 'keep') { /* garder la position */ }
    else if (typeof opts.scroll === 'number') window.scrollTo({ top: opts.scroll, behavior: 'instant' });
    else if (r.section) scrollToSection(r.section, false);
    else window.scrollTo({ top: 0, behavior: 'instant' });
    M.tick();
  }

  // Donne le même nom de transition à la miniature cliquée et à l'image du projet
  function markMedia(slug) {
    document.querySelectorAll('[style*="view-transition-name"]').forEach(function (el) { el.style.viewTransitionName = ''; });
    if (!slug) return;
    var img = document.querySelector('.card[data-slug="' + slug + '"] .card__media img') || document.querySelector('#p-media');
    if (img) img.style.viewTransitionName = 'project-media';
  }

  function route() {
    var r = parse();
    var from = state.view, fromKey = state.lastHash;
    var key = location.hash || '#/';
    if (fromKey) scrollMemory[fromKey.split('?')[0]] = scrollY;
    state.lastHash = key;

    // Même page d'accueil : on fait juste défiler
    if (from === 'home' && r.view === 'home') {
      setActiveNav(navKey(r));
      scrollToSection(r.section, true);
      navByClick = false;
      return;
    }
    var restore = !navByClick && scrollMemory[key.split('?')[0]] !== undefined ? scrollMemory[key.split('?')[0]] : undefined;
    var opts = { scroll: restore };
    navByClick = false;

    if (firstRender) { render(r, opts); firstRender = false; return; }

    var update = function () {
      render(r, opts);
      if (r.view === 'project') { var m = document.getElementById('p-media'); if (m) m.style.viewTransitionName = 'project-media'; }
      if (from === 'project' && r.view !== 'project' && state.prevSlug) {
        var c = document.querySelector('.card[data-slug="' + state.prevSlug + '"] .card__media img');
        if (c) c.style.viewTransitionName = 'project-media';
      }
    };
    state.prevSlug = from === 'project' ? (fromKey || '').split('/').pop() : null;
    if (from === 'project' && !document.querySelector('[style*="project-media"]')) {
      var pm = document.getElementById('p-media'); if (pm) pm.style.viewTransitionName = 'project-media';
    }
    var vt = M.pageTransition(update);
    var done = function () { document.querySelectorAll('img').forEach(function (i) { i.style.viewTransitionName = ''; }); main.focus({ preventScroll: true }); };
    if (vt) vt.finished.finally(done); else done();
  }

  /* ── Navigation : pastille active, scroll-spy ──────────────────── */
  var indicator = document.getElementById('nav-indicator');
  function setActiveNav(key) {
    state.navKey = key;
    var active = null;
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      var on = a.dataset.nav === key;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      if (on && a.classList.contains('nav__link')) active = a;
    });
    M.moveIndicator(indicator, active);
  }

  var spyIds = [['accueil', 'home'], ['apropos', 'about'], ['projets-home', 'projects'], ['bilan', 'review'], ['contact', 'contact']];
  M.onScroll(function (y, v) {
    // Progression de lecture
    var h = document.documentElement.scrollHeight - innerHeight;
    var p = h > 0 ? y / h : 0;
    document.getElementById('nav-progress').style.setProperty('--p', p.toFixed(4));
    var tt = document.getElementById('to-top');
    tt.style.setProperty('--p', p.toFixed(4));
    tt.classList.toggle('is-visible', y > 700);
    // La barre se cache quand on descend, revient quand on remonte
    var wrap = document.getElementById('nav-wrap');
    if (!document.body.classList.contains('menu-open')) {
      if (y > 240 && v > 6) wrap.classList.add('is-hidden');
      else if (v < -6 || y < 240) wrap.classList.remove('is-hidden');
    }
    // Section visible sur l'accueil
    if (state.view === 'home') {
      var current = 'home';
      spyIds.forEach(function (s) {
        var el = document.getElementById(s[0]);
        if (el && el.getBoundingClientRect().top < innerHeight * 0.4) current = s[1];
      });
      if (current !== state.navKey) setActiveNav(current);
    }
  });
  window.addEventListener('resize', function () { setActiveNav(state.navKey); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setActiveNav(state.navKey); });

  // Les clics sur les liens internes
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#/"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    navByClick = true;
    closeMenu();
    if (a.dataset.slug) markMedia(a.dataset.slug);
    if (a.getAttribute('href') === location.hash || (a.getAttribute('href') === '#/' && !location.hash)) {
      e.preventDefault();
      var r = parse();
      if (r.view === 'home') { scrollToSection(r.section, true); setActiveNav(navKey(r)); }
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      navByClick = false;
    }
  });
  window.addEventListener('hashchange', route);

  /* ── Menu mobile ───────────────────────────────────────────────── */
  var menuBtn = document.getElementById('menu-btn'), menu = document.getElementById('mobile-menu');
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    document.getElementById('nav-wrap').classList.remove('is-hidden');
  }
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 700);
  }
  menuBtn.addEventListener('click', function () { menu.classList.contains('is-open') ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ── Langue ────────────────────────────────────────────────────── */
  function applyStaticI18n() {
    root.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    var lb = document.getElementById('lang-btn');
    lb.textContent = state.lang === 'fr' ? 'EN' : 'FR';
    updateThemeLabel();
  }
  document.getElementById('lang-btn').addEventListener('click', function () {
    state.lang = state.lang === 'fr' ? 'en' : 'fr';
    try { localStorage.setItem('lang', state.lang); } catch (e) {}
    var y = scrollY;
    var r = parse();
    M.pageTransition(function () {
      applyStaticI18n();
      r.section = null;
      render(r, { scroll: y });
      var hero = main.querySelector('.hero'); if (hero) hero.classList.add('is-in');
      main.querySelectorAll('[data-reveal], .split, [data-observe]').forEach(function (el) {
        if (el.getBoundingClientRect().top < innerHeight && !el.classList.contains('is-in')) { el.classList.add('is-in'); el.dispatchEvent(new CustomEvent('reveal')); }
      });
    });
  });

  /* ── Thème ─────────────────────────────────────────────────────── */
  var themeBtn = document.getElementById('theme-btn');
  function updateThemeLabel() {
    themeBtn.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? t('themeLight') : t('themeDark'));
  }
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    M.themeTransition(themeBtn, function () {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      updateThemeLabel();
    });
  });

  /* ── Aperçu de documents ───────────────────────────────────────── */
  var viewer = document.getElementById('viewer');
  var vBody = document.getElementById('viewer-body');
  function openFile(f) {
    var name = L(f.name);
    var url = fileUrl(f.path);
    document.getElementById('viewer-title').textContent = name;
    var dl = document.getElementById('viewer-dl');
    dl.href = url;
    dl.setAttribute('download', f.dl || f.path.split('/').pop());
    if (f.type === 'PDF') {
      var canShow = navigator.pdfViewerEnabled !== false && !(window.matchMedia('(pointer: coarse)').matches && navigator.pdfViewerEnabled === undefined);
      vBody.innerHTML = canShow
        ? '<iframe src="' + url + '#view=FitH" title="' + esc(name) + '"></iframe>'
        : '<div class="viewer__fallback"><p>' + t('pdfFallback') + '</p><a class="btn btn--olive" href="' + url + '" target="_blank" rel="noopener">' + t('pdfOpenTab') + '</a></div>';
    } else {
      vBody.innerHTML = '<img src="' + url + '" alt="' + esc(name) + '">';
    }
    if (typeof viewer.showModal === 'function') viewer.showModal(); else window.open(url, '_blank');
    document.body.style.overflow = 'hidden';
  }
  function openCV() {
    openFile({ type: 'PDF', path: SITE.cv.path, name: { fr: 'Curriculum Vitæ — Thélio Dervieux', en: 'Resume — Thélio Dervieux' }, dl: 'CV - Thelio Dervieux.pdf' });
  }
  function closeViewer() {
    if (!viewer.open) return;
    if (M.reduced()) { viewer.close(); return; }
    viewer.classList.add('is-closing');
    setTimeout(function () { viewer.classList.remove('is-closing'); viewer.close(); }, 280);
  }
  viewer.addEventListener('close', function () { vBody.innerHTML = ''; document.body.style.overflow = ''; });
  viewer.addEventListener('cancel', function (e) { e.preventDefault(); closeViewer(); });
  viewer.addEventListener('click', function (e) { if (e.target === viewer) closeViewer(); });
  document.getElementById('viewer-close').addEventListener('click', closeViewer);

  /* ── Petits plus ───────────────────────────────────────────────── */
  var toastEl = document.getElementById('toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }
  function copyEmail() {
    var done = function () { toast(t('copied')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(SITE.email).then(done, function () { toast(SITE.email); });
    else toast(SITE.email);
  }
  document.getElementById('to-top').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: M.reduced() ? 'instant' : 'smooth' }); });
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ── Démarrage ─────────────────────────────────────────────────── */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  applyStaticI18n();
  route();
})();
