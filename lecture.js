/* Poker Academy — exercice « Lire la range adverse » : d'après ce que l'adversaire a fait avant le flop,
   tu colories les mains qu'il peut avoir, puis l'appli compare avec la range du club (Ma range, profil du club). */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var NAME = { UTG: 'UTG', 'UTG+1': 'UTG+1', MP: 'MP', LJ: 'le LJ', HJ: 'le hijack', CO: 'le cut-off', BTN: 'le bouton', SB: 'la petite blinde', BB: 'la grosse blinde' };
  var SCEN = { UTG: 'early', 'UTG+1': 'early', MP: 'early', LJ: 'oop', HJ: 'oop', CO: 'oop', BTN: 'ip', SB: 'bvb' };
  function combos(h) { return h.length === 2 ? 6 : (h[2] === 's' ? 4 : 12); }
  function cnt(set) { var n = 0; Object.keys(set).forEach(function (h) { if (set[h]) n += combos(h); }); return n; }
  function pct(n) { return String(Math.round(n / 13.26 * 10) / 10).replace('.', ',') + ' %'; }

  // une situation : ce qu'il a fait, et sa range (les mains qui font ce geste dans le profil du club)
  function make() {
    var PA = window.PA, r = Math.random(), q = {}, keep;
    if (r < 0.3) {
      var p = pick(['UTG', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB']);
      q.story = 'Un adversaire ouvre à 2 BB depuis ' + NAME[p] + '. Tapis de 40 BB et plus.';
      q.chart = PA.chart('club', { type: 'open', pos: p, bb: 100 }); keep = { raise: 1, allin: 1 }; q.kind = 'Ouverture';
    } else if (r < 0.55) {
      var h = pick(['LJ', 'HJ', 'CO', 'BTN']);
      q.story = 'Tu ouvres à 2 BB depuis ' + NAME[h] + '. La grosse blinde paie.';
      q.chart = PA.chart('club', { type: 'def', pos: 'BB', opener: h, bb: 100 }); keep = { call: 1 }; q.kind = 'Défense de la grosse blinde';
    } else if (r < 0.8) {
      var pairs = [['LJ', 'BTN'], ['HJ', 'CO'], ['CO', 'BTN'], ['CO', 'SB'], ['BTN', 'SB'], ['BTN', 'BB'], ['HJ', 'BB']], pr = pick(pairs);
      q.story = 'Tu ouvres à 2 BB depuis ' + NAME[pr[0]] + '. ' + NAME[pr[1]].charAt(0).toUpperCase() + NAME[pr[1]].slice(1) + ' relance (3-bet).';
      q.chart = PA.chart('club', { type: 'def', pos: pr[1], opener: pr[0], bb: 100 }); keep = { raise: 1, allin: 1 }; q.kind = 'Le 3-bet';
    } else {
      var o = pick(['LJ', 'HJ', 'CO', 'BTN']);
      q.story = 'Un adversaire ouvre depuis ' + NAME[o] + '. Tu sur-relances (3-bet) plus loin à la table, et il paie.';
      q.chart = PA.chart('club', { type: 'vs3bet', scen: SCEN[o], bb: 100 }); keep = { call: 1 }; q.kind = 'Payer un 3-bet';
    }
    q.target = {}; PA.HANDS.forEach(function (x) { if (keep[q.chart[x]]) q.target[x] = 1; });
    return q;
  }
  var S = null, N = 5;
  function newSeries() { var l = [], i = 0, guard = 0; while (l.length < N && guard++ < 50) { var q = make(); if (cnt(q.target) > 0) l.push(q); } return { list: l, i: 0, sel: {}, done: false, res: [] }; }
  function score(q, sel) {
    var both = 0, miss = 0, extra = 0;
    window.PA.HANDS.forEach(function (h) { var t = !!q.target[h], s = !!sel[h]; if (t && s) both += combos(h); else if (t) miss += combos(h); else if (s) extra += combos(h); });
    var j = both / Math.max(1, both + miss + extra);
    return { both: both, miss: miss, extra: extra, j: j, size: cnt(q.target), mine: cnt(sel) };
  }
  function grid(q, sel, done) {
    var h = '<div class="rg lr-g" id="lrGrid">';
    window.PA.HANDS.forEach(function (x) {
      var st = '', t = q.target[x], s = sel[x];
      if (!done) st = s ? 'background:#d4af37;color:#1a1400' : '';
      else st = t && s ? 'background:#63e083;color:#06280f' : t ? 'background:#f4a15d;color:#1a1400' : s ? 'background:#e24b4a;color:#fff' : '';
      h += '<button data-lr="' + x + '" style="' + st + '">' + x + '</button>';
    });
    return h + '</div>';
  }
  function view() {
    var ui = U(); if (!S) S = newSeries();
    var head = '<div class="stack"><button class="back" data-act="nav" data-v="apresflophub">‹ Après le flop</button><h1>Lire la range adverse</h1>';
    if (S.i >= S.list.length) {
      var avg = S.res.reduce(function (a, r) { return a + r.j; }, 0) / S.res.length, wide = S.res.filter(function (r) { return r.mine > r.size * 1.25; }).length, tight = S.res.filter(function (r) { return r.mine < r.size * 0.8; }).length;
      return ui.shell('entrainer', head + ui.yo('Précision moyenne : ' + Math.round(avg * 100) + ' %. ' + (avg >= 0.7 ? 'Tu lis bien les ranges.' : 'Relis le chapitre 12 et compare avec Ma range.') + (wide > tight && wide ? ' Tu lui donnes souvent trop de mains : un adversaire qui relance a une range plus serrée que tu ne crois.' : tight > wide && tight ? ' Tu lui donnes souvent trop peu de mains : il joue plus large que tu ne penses.' : '')) +
        '<div class="card stack">' + S.res.map(function (r, i) { return '<div class="tl-row"><b>' + S.list[i].kind + '</b> : ' + Math.round(r.j * 100) + ' % (sa range ' + pct(r.size) + ', la tienne ' + pct(r.mine) + ')</div>'; }).join('') + '</div>' +
        '<button class="btn gold block" data-lr-act="again">Nouvelle série</button><a class="btn block" href="#lecon-12">Relire le chapitre 12</a></div>');
    }
    var q = S.list[S.i], out = head + (S.i === 0 && !S.done ? '<div class="small muted">D’après ce qu’il a fait, colorie les mains qu’il peut avoir : touche une case, ou glisse le doigt pour en colorier plusieurs. L’appli compare avec la range du club (les repères de Ma range).</div>' : '') +
      '<div class="small muted">Situation ' + (S.i + 1) + ' sur ' + S.list.length + '</div><div class="card"><b>' + q.kind + '</b><div>' + q.story + '</div><div class="small muted">Quelles mains peut-il avoir ?</div></div>';
    out += grid(q, S.sel, S.done);
    if (!S.done) out += '<div class="small muted">Tu as choisi ' + pct(cnt(S.sel)) + ' des mains.</div><button class="btn gold block" data-lr-act="check">Valider</button><button class="btn block" data-lr-act="clear">Tout effacer</button>';
    else {
      var r = score(q, S.sel);
      out += '<div class="legend3"><div><i style="background:#63e083"></i><span>Trouvé</span></div><div><i style="background:#f4a15d"></i><span>Oublié : il les joue aussi</span></div><div><i style="background:#e24b4a"></i><span>En trop : il ne les joue pas comme ça</span></div></div>' +
        '<div class="pq-res ' + (r.j >= 0.6 ? 'ok' : 'ko') + '">Précision : ' + Math.round(r.j * 100) + ' %</div>' +
        ui.yo('Sa range fait ' + pct(r.size) + ' des mains, la tienne ' + pct(r.mine) + '. ' + (r.mine > r.size * 1.25 ? 'Tu lui donnes trop de mains.' : r.mine < r.size * 0.8 ? 'Tu lui en donnes trop peu.' : 'La largeur est bonne.') + (r.miss ? ' Regarde les cases orange : ce sont les mains que tu as oubliées.' : '')) +
        '<button class="btn gold block" data-lr-act="next">' + (S.i + 1 >= S.list.length ? 'Voir mon bilan' : 'Situation suivante') + '</button>';
    }
    return ui.shell('entrainer', out + '</div>');
  }
  function rerender() { U().render(); }
  function setCell(h, on) { if (!S || S.done) return; if (on) S.sel[h] = 1; else delete S.sel[h]; var b = document.querySelector('[data-lr="' + h + '"]'); if (b) b.style.cssText = on ? 'background:#d4af37;color:#1a1400' : ''; var c = document.querySelector('.lr-cnt'); }
  var drag = null;
  document.addEventListener('pointerdown', function (e) { var b = e.target.closest ? e.target.closest('[data-lr]') : null; if (!b || !S || S.done) return; var h = b.getAttribute('data-lr'); drag = !S.sel[h]; setCell(h, drag); e.preventDefault(); });
  document.addEventListener('pointermove', function (e) { if (drag === null) return; var el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest ? el.closest('[data-lr]') : null; if (b) setCell(b.getAttribute('data-lr'), drag); });
  document.addEventListener('pointerup', function () { if (drag !== null) { drag = null; rerender(); } });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-lr-act]') : null; if (!t) return;
    var a = t.getAttribute('data-lr-act');
    if (a === 'again') S = null;
    else if (a === 'clear') S.sel = {};
    else if (a === 'check') {
      S.done = true; var r = score(S.list[S.i], S.sel); S.res.push(r);
      var p = window.PA.player(); if (p) { if (window.PA.updateNotion) window.PA.updateNotion(p, 'lecture', 1350, r.j >= 0.6 ? 1 : 0); window.PA.save(); }
    } else if (a === 'next') { S.i++; S.sel = {}; S.done = false; }
    rerender(); window.scrollTo(0, 0);
  });
  window.PA_LECTURE = { view: view, make: make, score: score, reset: function () { S = null; } };
})();
