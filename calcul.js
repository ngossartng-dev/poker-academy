/* Poker Academy — exercice « Calcul rapide » : cote du pot, défense minimale, bluff rentable, outs, seuils de 3-bet. */
(function () {
  'use strict';
  var N = 10, LIMIT = 20; // secondes par question
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function f1(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
  function pc(x) { return Math.round(x * 100); }
  var FRAC = [[1 / 3, 'un tiers du pot'], [0.5, 'la moitié du pot'], [2 / 3, 'deux tiers du pot'], [0.75, 'trois quarts du pot'], [1, 'la taille du pot'], [1.5, '1,5 fois le pot'], [2, 'deux fois le pot']];
  var GEN = [
    function () { // cote du pot
      var pot = pick([6, 8, 10, 12, 15, 20, 24, 30]), fr = pick(FRAC.slice(0, 6)), bet = Math.round(pot * fr[0] * 2) / 2, ans = bet / (pot + 2 * bet);
      return { t: 'Cote du pot', q: 'Il y a ' + f1(pot) + ' BB au milieu, il mise ' + f1(bet) + ' BB. Quelle équité te faut-il pour payer ?', ans: pc(ans), why: 'Équité requise = ce que tu paies ÷ le pot final = ' + f1(bet) + ' ÷ (' + f1(pot) + ' + ' + f1(bet) + ' + ' + f1(bet) + ') ≈ ' + pc(ans) + ' %.', ch: 10 };
    },
    function () { // défense minimale
      var fr = pick(FRAC), ans = 1 / (1 + fr[0]);
      return { t: 'Défense minimale', q: 'Il mise ' + fr[1] + '. Quelle part de ta range dois-tu garder au minimum pour que son bluff ne soit pas rentable ?', ans: pc(ans), why: 'Défense minimale = pot ÷ (pot + mise) = 1 ÷ (1 + ' + f1(fr[0]) + ') ≈ ' + pc(ans) + ' %.', ch: 42 };
    },
    function () { // bluff rentable
      var fr = pick(FRAC), ans = fr[0] / (1 + fr[0]);
      return { t: 'Bluff rentable', q: 'Tu bluffes de ' + fr[1] + '. Combien de fois l’adversaire doit-il se coucher pour que ce soit rentable ?', ans: pc(ans), why: 'Seuil du bluff = mise ÷ (pot + mise) = ' + f1(fr[0]) + ' ÷ (1 + ' + f1(fr[0]) + ') ≈ ' + pc(ans) + ' %.', ch: 42 };
    },
    function () { // outs, règle du 2 et du 4
      var o = pick([[4, 'un tirage quinte ventral'], [8, 'un tirage quinte par les deux bouts'], [9, 'un tirage couleur'], [12, 'un tirage couleur avec une overcard'], [15, 'un tirage couleur et quinte']]), flop = Math.random() < 0.5;
      var ans = Math.min(60, flop ? o[0] * 4 - (o[0] > 8 ? o[0] - 8 : 0) : o[0] * 2);
      return { t: 'Outs', q: 'Tu as ' + o[1] + ' (' + o[0] + ' outs). ' + (flop ? 'Au flop, tout le monde est à tapis : quelle est à peu près ton équité jusqu’à la river ?' : 'À la turn : quelle est à peu près ton équité pour la river ?'), ans: ans, why: flop ? 'Règle du 4 au flop (deux cartes à venir) : ' + o[0] + ' × 4' + (o[0] > 8 ? ', moins ' + (o[0] - 8) + ' au-delà de 8 outs' : '') + ' ≈ ' + ans + ' %.' : 'Règle du 2 à la turn (une carte à venir) : ' + o[0] + ' × 2 ≈ ' + ans + ' %.', ch: 10 };
    },
    function () { // grosse blinde avec ante
      var x = pick([2, 2.2, 2.5, 3, 4]), ans = (x - 1) / (2 * x + 1.5);
      return { t: 'Grosse blinde', q: 'Tournoi avec ante de grosse blinde. Le bouton ouvre à ' + f1(x) + ' BB, la petite blinde se couche. En grosse blinde, quelle équité te faut-il pour payer ?', ans: pc(ans), why: 'Tu paies ' + f1(x - 1) + ' BB pour un pot final de ' + f1(2 * x + 1.5) + ' BB (2 × ' + f1(x) + ' + 0,5 + 1 d’ante) : ' + f1(x - 1) + ' ÷ ' + f1(2 * x + 1.5) + ' ≈ ' + pc(ans) + ' %.', ch: 6 };
    },
    function () { // 3-bet light
      var y = pick([6, 6.5, 7, 8, 9]), ans = y / (y + 4.5);
      return { t: '3-bet light', q: 'Ouverture à 2 BB, ante de grosse blinde (4,5 BB au milieu). Tu 3-bet en bluff à ' + f1(y) + ' BB au bouton. L’ouvreur doit se coucher plus de…', ans: pc(ans), why: y + ' ÷ (' + f1(y) + ' + 4,5) ≈ ' + pc(ans) + ' % (chapitre 39).', ch: 39 };
    },
    function () { // tapis à payer
      var c = pick([10, 12, 15, 20, 25, 30]), dead = pick([3, 4.5, 6, 8, 10]), ans = c / (2 * c + dead);
      return { t: 'Payer un tapis', q: 'Il fait tapis : tu dois payer ' + c + ' BB. Il y a déjà ' + f1(dead) + ' BB d’argent mort (blindes, ante, mises couchées). Quelle équité te faut-il ?', ans: pc(ans), why: c + ' ÷ (' + c + ' + ' + c + ' + ' + f1(dead) + ') ≈ ' + pc(ans) + ' %.', ch: 22 };
    }
  ];
  function opts(a) {
    var set = [a], d = [-15, -10, -7, -5, 5, 7, 10, 15, 20];
    while (set.length < 4) { var v = a + pick(d); if (v > 0 && v < 100 && set.every(function (x) { return Math.abs(x - v) >= 4; })) set.push(v); }
    return set.sort(function (x, y) { return x - y; });
  }
  var Q = null, TIMER = null;
  function newSeries() { var l = []; for (var i = 0; i < N; i++) { var q = pick(GEN)(); q.o = opts(q.ans); l.push(q); } return { list: l, i: 0, ok: 0, ans: null, t0: Date.now(), fast: 0 }; }
  function stopTimer() { if (TIMER) { cancelAnimationFrame(TIMER); TIMER = null; } }
  function tick() {
    var el = document.getElementById('calc-bar'); if (!el || !Q || Q.ans !== null) { TIMER = null; return; }
    var left = LIMIT - (Date.now() - Q.t0) / 1000;
    if (left <= 0) { Q.ans = -1; window.PA_UI.render(); return; }
    el.style.width = (left / LIMIT * 100) + '%'; el.style.background = left < 5 ? '#ff6b6b' : '#ffd23f';
    var tx = document.getElementById('calc-t'); if (tx) tx.textContent = Math.ceil(left) + ' s';
    TIMER = requestAnimationFrame(tick);
  }
  function view() {
    var ui = window.PA_UI; stopTimer();
    if (!Q) Q = newSeries();
    var head = '<div class="stack"><button class="back" data-act="nav" data-v="situations">‹ Situations</button><h1>Calcul rapide</h1>';
    if (Q.i >= Q.list.length) return ui.shell('entrainer', head + ui.yo(Q.ok + (Q.ok > 1 ? ' bonnes réponses' : ' bonne réponse') + ' sur ' + Q.list.length + (Q.fast ? ', dont ' + Q.fast + ' en moins de 8 secondes' : '') + '. ' + (Q.ok >= 8 ? 'Ces calculs deviennent des réflexes : c’est ce qu’il faut à la table.' : 'Refais une série : à la table, tu n’as que quelques secondes. Les formules sont au chapitre 10 et au chapitre 42.')) + '<button class="btn gold block" data-calc="again">Nouvelle série</button><a class="btn block" href="#memo">La fiche mémo (toutes les formules)</a></div>');
    var q = Q.list[Q.i], out = head + (Q.i === 0 && Q.ans === null ? '<div class="small muted">' + N + ' questions, ' + LIMIT + ' secondes chacune. Cote du pot, défense minimale, bluff, outs, grosse blinde, 3-bet light, tapis.</div>' : '') +
      '<div class="small muted">Question ' + (Q.i + 1) + ' sur ' + Q.list.length + ' · ' + Q.ok + ' bonne' + (Q.ok > 1 ? 's' : '') + ' réponse' + (Q.ok > 1 ? 's' : '') + '</div>' +
      '<div class="card stack"><div class="small muted">' + q.t + '</div><div style="font-size:1.15em">' + q.q + '</div></div>';
    if (Q.ans === null) {
      out += '<div style="display:flex;align-items:center;gap:10px"><div style="flex:1;height:10px;border-radius:6px;background:#26262c;overflow:hidden"><div id="calc-bar" style="height:100%;width:100%;background:#ffd23f"></div></div><b id="calc-t">' + LIMIT + ' s</b></div>';
      out += '<div class="grid2">' + q.o.map(function (v) { return '<button class="btn block" style="font-size:1.3em" data-calc="' + v + '">' + v + ' %</button>'; }).join('') + '</div>';
      setTimeout(function () { Q.t0 = Date.now(); tick(); }, 0);
    } else {
      var good = Q.ans === q.ans;
      out += '<div class="pq-res ' + (good ? 'ok' : 'ko') + '">' + (Q.ans === -1 ? 'Temps écoulé : ' : good ? 'Oui : ' : 'Non : ') + 'environ ' + q.ans + ' %.</div>' + ui.yo(q.why) + '<button class="btn gold block" data-calc="next">' + (Q.i + 1 >= Q.list.length ? 'Voir mon score' : 'Question suivante') + '</button><a class="btn block" href="#lecon-' + q.ch + '">Revoir le chapitre ' + q.ch + '</a>';
    }
    return ui.shell('entrainer', out + '</div>');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-calc]') : null; if (!t) return;
    var a = t.getAttribute('data-calc');
    if (a === 'again') Q = null; else if (!Q) return; else if (a === 'next') { Q.i++; Q.ans = null; }
    else if (Q.ans === null) { Q.ans = +a; if (Q.ans === Q.list[Q.i].ans) { Q.ok++; if (Date.now() - Q.t0 < 8000) Q.fast++; } }
    window.PA_UI.render(); window.scrollTo(0, 0);
  });
  window.addEventListener('hashchange', stopTimer);
  window.PA_CALC = { view: view, reset: function () { Q = null; } };
})();
