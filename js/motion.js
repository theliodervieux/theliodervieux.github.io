/* ════════════════════════════════════════════════════════════════════
   MOTION — toutes les animations du site
   Chaque effet respecte le réglage système « réduire les animations ».
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var M = {};
  M.reduced = function () { return reduceMQ.matches; };
  M.fine = function () { return fineMQ.matches; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ── Boucle de défilement unique (rAF) ─────────────────────────── */
  var scrollFns = [];
  var lastY = window.scrollY, velocity = 0, ticking = false;
  function onScrollFrame() {
    ticking = false;
    var y = window.scrollY;
    velocity = y - lastY;
    lastY = y;
    for (var i = 0; i < scrollFns.length; i++) scrollFns[i](y, velocity);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  window.addEventListener('resize', function () { requestAnimationFrame(onScrollFrame); });
  M.onScroll = function (fn) { scrollFns.push(fn); fn(window.scrollY, 0); return fn; };
  M.offScroll = function (fn) { scrollFns = scrollFns.filter(function (f) { return f !== fn; }); };
  M.velocity = function () { return velocity; };
  M.tick = onScrollFrame;

  /* ── Apparition au défilement ──────────────────────────────────── */
  var io = null;
  M.observe = function (root) {
    root = root || document;
    var els = root.querySelectorAll('[data-reveal], .split, [data-observe]');
    if (M.reduced() || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); el.dispatchEvent(new CustomEvent('reveal')); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            e.target.dispatchEvent(new CustomEvent('reveal'));
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    }
    els.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
  };

  /* ── Découpe d'un titre en mots (révélation mot à mot) ─────────── */
  M.splitWords = function (el, delay) {
    if (!el || el.dataset.splitDone) return;
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
    el.classList.add('split');
    if (delay) el.style.setProperty('--d0', delay + 'ms');
    el.dataset.splitDone = '1';
  };

  /* ── Compteur animé ────────────────────────────────────────────── */
  M.countUp = function (el, to, duration) {
    if (M.reduced()) { el.textContent = to; return; }
    duration = duration || 1600;
    var start = null;
    function step(t) {
      if (!start) start = t;
      var p = clamp((t - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  /* ── Boutons « magnétiques » ───────────────────────────────────── */
  M.magnetic = function (el, strength) {
    if (!el || el.dataset.mag || M.reduced() || !M.fine()) return;
    el.dataset.mag = '1';
    strength = strength || 0.28;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--bx', ((x - r.width / 2) * strength).toFixed(1) + 'px');
      el.style.setProperty('--by', ((y - r.height / 2) * strength * 1.2).toFixed(1) + 'px');
      el.style.setProperty('--mx', x + 'px');
      el.style.setProperty('--my', y + 'px');
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--bx', '0px');
      el.style.setProperty('--by', '0px');
    });
  };

  /* ── Cartes inclinables en 3D avec reflet ──────────────────────── */
  M.tilt = function (el, max) {
    if (!el || el.dataset.tilt || M.reduced() || !M.fine()) return;
    el.dataset.tilt = '1';
    max = max || 6;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transition = 'transform .15s ease-out, box-shadow .5s';
      el.style.setProperty('--rx', ((0.5 - y) * max).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((x - 0.5) * max * 1.2).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function () {
      el.style.transition = '';
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  };

  /* ── Bandeau défilant à vitesse constante (animation CSS, très fluide) ── */
  M.marquee = function (wrap) {
    if (!wrap) return function () {};
    var rows = Array.prototype.slice.call(wrap.querySelectorAll('.marquee__row'));
    var SPEED = 45; // pixels par seconde
    function build() {
      rows.forEach(function (row) {
        if (!row.dataset.base) row.dataset.base = row.innerHTML;
        var base = row.dataset.base, html = base;
        row.innerHTML = html;
        // On répète la liste jusqu'à dépasser la largeur de l'écran, puis on double pour boucler sans saut
        var guard = 0;
        while (row.scrollWidth < window.innerWidth + 200 && guard++ < 20) { html += base; row.innerHTML = html; }
        row.innerHTML = html + html;
        row.style.setProperty('--dur', ((row.scrollWidth / 2) / SPEED).toFixed(1) + 's');
      });
    }
    build();
    var w = window.innerWidth, timer;
    function onResize() {
      if (Math.abs(window.innerWidth - w) < 40) return;
      w = window.innerWidth; clearTimeout(timer); timer = setTimeout(build, 200);
    }
    window.addEventListener('resize', onResize);
    return function destroy() { window.removeEventListener('resize', onResize); };
  };

  /* ── Parallaxe du portrait et autocollants déplaçables ─────────── */
  M.heroInteractions = function (hero) {
    if (!hero) return;
    var portrait = hero.querySelector('.portrait');
    var stickers = Array.prototype.slice.call(hero.querySelectorAll('.sticker'));
    if (!M.reduced() && M.fine() && portrait) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        portrait.style.setProperty('--tx', (x * 14).toFixed(1) + 'px');
        portrait.style.setProperty('--ty', (y * 14).toFixed(1) + 'px');
        stickers.forEach(function (s, i) {
          var depth = [26, -20, 16][i] || 12;
          s.style.setProperty('--px', (x * depth).toFixed(1) + 'px');
          s.style.setProperty('--py', (y * depth).toFixed(1) + 'px');
        });
      });
      hero.addEventListener('pointerleave', function () {
        portrait.style.setProperty('--tx', '0px'); portrait.style.setProperty('--ty', '0px');
        stickers.forEach(function (s) { s.style.setProperty('--px', '0px'); s.style.setProperty('--py', '0px'); });
      });
    }
    // On peut attraper les autocollants : ils reviennent en place avec un effet ressort
    stickers.forEach(function (s) {
      var sx = 0, sy = 0, dragging = false;
      s.addEventListener('pointerdown', function (e) {
        dragging = true; sx = e.clientX; sy = e.clientY;
        s.setPointerCapture(e.pointerId);
        s.classList.add('is-dragging');
      });
      s.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        s.style.setProperty('--dx', (e.clientX - sx) + 'px');
        s.style.setProperty('--dy', (e.clientY - sy) + 'px');
      });
      function release() {
        if (!dragging) return;
        dragging = false;
        s.classList.remove('is-dragging');
        s.style.setProperty('--dx', '0px');
        s.style.setProperty('--dy', '0px');
      }
      s.addEventListener('pointerup', release);
      s.addEventListener('pointercancel', release);
    });
  };

  /* ── Nuage de points + droite de régression dessinée (héros) ───── */
  M.plotSVG = function () {
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var pts = [];
    for (var i = 0; i < 64; i++) {
      var x = 40 + rnd() * 920;
      var y = 520 - x * 0.42 + (rnd() - 0.5) * 190;
      pts.push('<circle class="dot" style="--i:' + i + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (4 + rnd() * 5).toFixed(1) + '" fill="currentColor"/>');
    }
    return '<svg class="hero__plot" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-observe>' +
      '<g stroke="currentColor" stroke-width="1" opacity=".35">' +
      [100, 200, 300, 400, 500].map(function (y) { return '<line x1="0" x2="1000" y1="' + y + '" y2="' + y + '" stroke-dasharray="4 10"/>'; }).join('') +
      '</g>' + pts.join('') +
      '<path class="fit" pathLength="1" d="M 0 540 C 250 430, 600 300, 1000 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
      '</svg>';
  };

  /* ── Indicateur de la navigation qui glisse ────────────────────── */
  M.moveIndicator = function (indicator, link) {
    if (!indicator) return;
    if (!link || !link.offsetParent) { indicator.style.opacity = '0'; return; }
    indicator.style.opacity = '1';
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
  };

  /* ── Pastille glissante d'un groupe de boutons ─────────────────── */
  M.moveThumb = function (group) {
    var thumb = group.querySelector('.seg__thumb');
    var on = group.querySelector('[aria-pressed="true"]');
    if (!thumb || !on) return;
    thumb.style.width = on.offsetWidth + 'px';
    thumb.style.transform = 'translate(' + on.offsetLeft + 'px,' + (on.offsetTop - 5) + 'px)';
  };

  /* ── Transitions de page (View Transitions API si disponible) ──── */
  M.pageTransition = function (update) {
    if (document.startViewTransition && !M.reduced()) {
      return document.startViewTransition(update);
    }
    update();
    return null;
  };

  /* ── Changement de thème en cercle depuis le bouton ────────────── */
  M.themeTransition = function (btn, update) {
    if (!document.startViewTransition || M.reduced()) { update(); return; }
    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var root = document.documentElement;
    root.style.setProperty('--vt-x', x + 'px');
    root.style.setProperty('--vt-y', y + 'px');
    root.style.setProperty('--vt-r', radius + 'px');
    root.classList.add('vt-theme');
    var t = document.startViewTransition(update);
    t.finished.finally(function () { root.classList.remove('vt-theme'); });
  };

  /* ── FLIP : les cartes glissent vers leur nouvelle place ───────── */
  M.flip = function (container, mutate) {
    if (M.reduced() || !container.animate) { mutate(); return; }
    var before = {};
    container.querySelectorAll('[data-flip]').forEach(function (el) { before[el.dataset.flip] = el.getBoundingClientRect(); });
    mutate();
    container.querySelectorAll('[data-flip]').forEach(function (el, i) {
      var b = before[el.dataset.flip];
      var a = el.getBoundingClientRect();
      if (b) {
        var dx = b.left - a.left, dy = b.top - a.top;
        if (dx || dy) el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
      } else {
        el.animate([{ opacity: 0, transform: 'scale(.9) translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: Math.min(i, 8) * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      }
    });
  };

  /* ── Écran d'introduction ──────────────────────────────────────── */
  M.intro = function (done) {
    var el = document.getElementById('intro');
    var seen = false;
    try { seen = sessionStorage.getItem('introSeen') === '1'; } catch (e) {}
    if (!el || seen || M.reduced()) { if (el) el.remove(); done(); return; }
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
    var k = 0;
    el.querySelectorAll('.intro__line').forEach(function (line) {
      var txt = line.textContent;
      line.innerHTML = txt.split('').map(function (c) {
        return '<span style="animation-delay:' + (k++ * 45) + 'ms">' + c + '</span>';
      }).join('');
    });
    el.classList.add('is-playing');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { document.documentElement.style.overflow = ''; done(); }, 380);
      setTimeout(function () { el.remove(); }, 1050);
    }, 1450);
  };

  window.Motion = M;
})();
