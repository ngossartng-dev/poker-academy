/* Poker Academy v2.0 — Raccourcis clavier (PC) : 1 à 9 pour répondre, Entrée pour continuer, F/C/R/A à la table */
(function () {
  'use strict';
  var ANS = '[data-act="answer"],[data-sact="ans"],[data-lact="ans"]:not([disabled])';
  var NEXT = '[data-act="next"],[data-sact="next"],[data-lact="qnext"],[data-gact="next"],[data-gact="again"]';
  function vis(el) { return el && el.offsetParent !== null && !el.disabled; }
  function all(sel) { return Array.prototype.filter.call(document.querySelectorAll(sel), vis); }
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    if (/^#cartes/.test(location.hash)) return; // l'écran des cartes a ses propres touches
    var k = e.key;
    if (/^[1-9]$/.test(k)) { var b = all(ANS)[+k - 1]; if (b) { e.preventDefault(); b.click(); } return; }
    if (k === 'Enter' || k === ' ') { var n = all(NEXT)[0]; if (n) { e.preventDefault(); n.click(); } return; }
    var g = { f: ['fold'], c: ['check', 'call'], r: ['raise', 'bet'], a: ['allin'] }[k.toLowerCase()];
    if (g) { for (var i = 0; i < g.length; i++) { var x = all('[data-gact="' + g[i] + '"]')[0]; if (x) { e.preventDefault(); x.click(); return; } } }
  });
})();
