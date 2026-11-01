/* Poker Academy — thèmes de saison : un décor discret selon la date (fond, en-tête, table).
   Le calendrier peut être mis à jour en ligne (season.json sur GitHub Pages) sans réinstaller l'appli. */
(function () {
  'use strict';
  // [thème, début MM-JJ, fin MM-JJ] ; le premier qui correspond gagne
  var CAL = [
    ['halloween', '10-20', '11-02'],
    ['noel', '12-01', '01-06'],
    ['hiver', '01-07', '02-28']
  ];
  var NAMES = { halloween: 'Halloween', noel: 'Noël', hiver: 'Hiver', classique: 'Classique' };
  function md(d) { var m = d.getMonth() + 1, j = d.getDate(); return (m < 10 ? '0' : '') + m + '-' + (j < 10 ? '0' : '') + j; }
  function inRange(x, a, b) { return a <= b ? (x >= a && x <= b) : (x >= a || x <= b); }
  function auto(d) { var x = md(d || new Date()); for (var i = 0; i < CAL.length; i++) if (inRange(x, CAL[i][1], CAL[i][2])) return CAL[i][0]; return 'classique'; }
  function pref() { try { var p = window.PA && window.PA.player(); return (p && p.settings && p.settings.season) || 'auto'; } catch (e) { return 'auto'; } }
  function current() { var p = pref(); return p === 'auto' ? auto() : p; }
  function apply() { var t = current(); document.documentElement.setAttribute('data-season', t); }
  // calendrier en ligne (facultatif)
  try {
    if (navigator.onLine !== false && window.fetch) fetch('https://ngossartng-dev.github.io/poker-academy/season.json?j=' + md(new Date()), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.cal && j.cal.length) { CAL = j.cal; apply(); } }).catch(function () {});
  } catch (e) {}
  window.PA_SEASON = { apply: apply, current: current, auto: auto, NAMES: NAMES };
  apply();
  setInterval(apply, 3600000);
})();
