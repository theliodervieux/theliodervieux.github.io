/* ════════════════════════════════════════════════════════════════════
   PAGE 404 — partagée entre le site (#/adresse-inconnue) et 404.html
   L'idée : la page perdue est une « valeur aberrante » sur un nuage de points.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.NotFoundView = function (o) {
    // o.t : traduction · o.base : préfixe des liens ('#/' ou '/#/') · o.plot : SVG du nuage de points
    var t = o.t, b = o.base;
    var arrow = '<svg class="i-arrow" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
    return '' +
      '<section class="wrap nf">' +
        '<div class="nf__card">' +
          '<div class="nf__bg" aria-hidden="true">' + o.plot +
            '<span class="nf__outlier"><span class="nf__ring"></span><span class="nf__ring nf__ring--2"></span><span class="nf__dot"></span>' +
            '<span class="nf__label">' + t('nfHere') + '</span></span>' +
          '</div>' +
          '<div class="nf__text">' +
            '<span class="kicker">' + t('nfKicker') + '</span>' +
            '<div class="nf__code" aria-hidden="true"><span>4</span><span class="nf__zero"></span><span>4</span></div>' +
            '<h1 class="nf__title">' + t('nfTitle') + '</h1>' +
            '<p class="nf__lead">' + t('nfText') + '</p>' +
            '<div class="hero__cta">' +
              '<a class="btn btn--olive" href="' + b + '" data-magnetic><span>' + t('nfHome') + '</span>' + arrow + '</a>' +
              '<a class="btn btn--card" href="' + b + 'projets"><span>' + t('nfProjects') + '</span></a>' +
            '</div>' +
            '<p class="nf__links">' + t('nfOr') + ' ' +
              '<a href="' + b + 'a-propos">' + t('navAbout') + '</a> · ' +
              '<a href="' + b + 'bilan">' + t('navReview') + '</a> · ' +
              '<a href="' + b + 'contact">' + t('navContact') + '</a></p>' +
          '</div>' +
        '</div>' +
      '</section>';
  };
})();
