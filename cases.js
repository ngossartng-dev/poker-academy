/* Poker Academy — exercice « Cas concrets après le flop » : situations tirées du solveur (40 BB). */
(function () {
  'use strict';
  var C = [
    { sit: 'Grosse blinde. Le bouton ouvre, tu 3-bet à 8 BB, il paie. Pot 17,5 BB, il te reste 32 BB. Tu parles.', hand: 'Ah4h', board: 'Kd8s3c', o: ['Check', 'Mise la moitié du pot', 'Tapis'], a: 1, why: 'Le solveur mise presque toujours, surtout la moitié du pot (75 %) : ta range de 3-bet a beaucoup plus de rois forts que la sienne, et ton as bloque ses as.' },
    { sit: 'Grosse blinde. Le bouton ouvre, tu 3-bet à 8 BB, il paie. Pot 17,5 BB. Tu parles.', hand: 'Ah4h', board: '9s7d5c', o: ['Check, puis coucher s’il mise', 'Mise la moitié du pot', 'Tapis'], a: 0, why: 'Check 91 %, et couché 98 % face à une mise : ce flop bas et connecté touche sa range de paye, pas la tienne.' },
    { sit: 'Bouton. Le cut-off ouvre, tu 3-bet, il paie et checke. Pot 15,5 BB.', hand: 'Ad4d', board: 'QhTs7s', o: ['Check', 'Mise la moitié du pot', 'Tapis'], a: 0, why: 'Check 83 % : en position, tu prends la carte gratuite sur un flop qui ne favorise pas ta range.' },
    { sit: 'Bouton. Le cut-off ouvre, tu 3-bet, il paie et checke. Pot 15,5 BB.', hand: 'Ah5h', board: 'Kh7s2h', o: ['Check', 'Mise la moitié du pot', 'Tapis'], a: 1, why: 'Avec un tirage couleur, le solveur mise 86 %, surtout la moitié du pot : il prépare le tapis et gagne de deux façons.' },
    { sit: 'Bouton. Tu ouvres, la grosse blinde paie et checke. Pot 5,5 BB.', hand: 'AdKc', board: 'Jc5d2h', o: ['Check', 'Mise un tiers du pot', 'Surmise'], a: 1, why: 'Mise 98 %, surtout un tiers du pot : flop sec que la grosse blinde rate souvent.' },
    { sit: 'Bouton. Tu ouvres, la grosse blinde paie et checke. Pot 5,5 BB.', hand: 'AdKc', board: '9s7d5c', o: ['Check le plus souvent', 'Mise un tiers du pot à chaque fois', 'Tapis'], a: 0, why: 'Check 55 % : la grosse blinde a beaucoup de paires et de tirages sur ce flop bas.' },
    { sit: 'Grosse blinde contre le bouton. Tu checkes, il mise un tiers du pot.', hand: 'KsTd', board: 'Kd8s3c', o: ['Couche', 'Paye', 'Relance'], a: 2, why: 'Relance 63 % : face à une petite mise, tu fais payer ses paires et ses as tout de suite.' },
    { sit: 'Grosse blinde contre le bouton. Tu checkes, il mise trois quarts du pot.', hand: 'KsTd', board: 'Kd8s3c', o: ['Couche', 'Paye', 'Relance'], a: 1, why: 'Paye 97 % : face à une grosse mise, ta top paire au kicker moyen contrôle la taille du pot.' },
    { sit: 'Grosse blinde contre le bouton. Tu checkes, il mise un tiers du pot.', hand: 'KsTd', board: '9s7d5c', o: ['Couche', 'Paye', 'Relance'], a: 0, why: 'Couche 79 % : sans paire ni tirage sur ce flop, même face à une petite mise.' },
    { sit: 'Grosse blinde contre le bouton. Tu checkes, il mise un tiers du pot.', hand: 'Ah5h', board: '8h7h4d', o: ['Couche', 'Paye', 'Relance'], a: 2, why: 'Avec un tirage couleur, le solveur relance 83 % du temps (dont 25 % à tapis) : ce flop bas t’aide.' },
    { sit: 'Bouton. Tu ouvres, la grosse blinde paie et checke. Pot 5,5 BB.', hand: 'QsQc', board: '8h7h4d', o: ['Check', 'Un tiers du pot', '1,25 fois le pot'], a: 2, why: 'Surmise 75 % : beaucoup de tirages à faire payer, et le tapis se prépare en deux rues.' },
    { sit: 'Bouton. Tu as misé un tiers du pot au flop, la grosse blinde a payé. Turn 2♦, elle checke. Pot 9 BB.', hand: 'KcQc', board: 'Kd8s3c2d', o: ['Check', 'Mise la taille du pot', 'Mise un quart'], a: 1, why: 'Top paire : mise 91 %, surtout la taille du pot, pour préparer le tapis à la river.' },
    { sit: 'Bouton. Tu as misé un tiers du pot au flop, la grosse blinde a payé. Turn A♥, elle checke.', hand: 'KcQc', board: 'Kd8s3cAh', o: ['Check', 'Mise la taille du pot', 'Tapis'], a: 0, why: 'Check 100 % : avec l’as au tableau, ta paire de rois est devenue une paire moyenne.' },
    { sit: 'Petite blinde. Tu ouvres à 3 BB, la grosse blinde paie. Tu parles en premier. Pot 7 BB.', hand: 'Kh9c', board: 'Kd8s3c', o: ['Toujours miser', 'Checker souvent, miser petit parfois', 'Tapis'], a: 1, why: 'Hors de position, le solveur checke 56 % même sur ce flop, et sa top paire checke presque une fois sur deux.' },
    { sit: 'Bouton contre une calling station en grosse blinde. Elle checke. Pot 5,5 BB, 40 BB.', hand: 'KcJd', board: 'KhQd6s', o: ['Check', 'Mise un tiers du pot', 'Tapis'], a: 2, why: 'Contre une station, le solveur part à tapis avec sa top paire 100 % du temps : elle paiera avec pire.' },
    { sit: 'Bouton contre un nit en grosse blinde. Il checke. Pot 5,5 BB.', hand: '5c4c', board: 'KhQd6s', o: ['Check', 'Mise un tiers du pot', 'Mise 1,25 fois le pot'], a: 2, why: 'Contre un nit, le solveur mise 92 % de ses mains, presque toujours 1,25 fois le pot : il se couche trop.' }
  ];
  var F = 'all', LOADING = false;
  var m0 = /[?&]t=([a-z0-9]+)/.exec(location.hash); if (m0) F = m0[1];
  var FILT = [['all', 'Tout'], ['pos', 'Pots simples'], ['3bet', 'Pots 3-bet'], ['sb', 'Petite blinde'], ['rec', 'Contre récréatifs'], ['limp', 'Pots limpés'], ['bulle', 'Bulle'], ['sonde', 'Mise sonde'], ['retard', 'C-bet retardé'], ['float', 'Float'], ['xr', 'Check-raise']];
  function pool() {
    var G = window.PA_CASES_GEN || [];
    if (F === 'all') return { hand: C, gen: G };
    return { hand: [], gen: G.filter(function (x) { return x.g === F; }) };
  }
  function newSeries() {
    var P = pool(), list = shuffle(P.hand).slice(0, P.gen.length ? 3 : N);
    list = list.concat(shuffle(P.gen).slice(0, N - list.length));
    return { list: shuffle(list), i: 0, ok: 0, ans: null };
  }
  var Q = null, N = 10, SU = { s: ['♠', 0], h: ['♥', 1], d: ['♦', 1], c: ['♣', 0] };
  function cards(str) { var o = ''; for (var i = 0; i < str.length; i += 2) { var r = str[i], s = SU[str[i + 1]]; o += '<span class="pq-card small' + (s[1] ? ' red' : '') + '">' + (r === 'T' ? '10' : r) + '<small>' + s[0] + '</small></span>'; } return o; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function view() {
    var ui = window.PA_UI;
    if (!window.PA_CASES_GEN && !LOADING) { LOADING = true; var sc = document.createElement('script'); sc.src = 'cases-data.js'; sc.onload = sc.onerror = function () { LOADING = false; Q = null; ui.render(); }; document.head.appendChild(sc); }
    if (!Q) Q = newSeries();
    var head = '<div class="stack"><button class="back" data-act="nav" data-v="situations">‹ Situations</button><h1>Cas concrets</h1>';
    if (Q.i >= Q.list.length) return ui.shell('entrainer', head + ui.yo(Q.ok + (Q.ok > 1 ? ' bonnes réponses' : ' bonne réponse') + ' sur ' + Q.list.length + '. ' + (Q.ok >= 8 ? 'Tu lis bien à qui profite le flop.' : 'Relis le chapitre 38 « Cas concrets après le flop » : la règle revient partout, regarde à qui profite le flop.')) + '<button class="btn gold block" data-cas="again">Recommencer</button><a class="btn block" href="#lecon-38">Lire le chapitre 38</a></div>');
    var total = (window.PA_CASES_GEN || []).length + C.length;
    var c = Q.list[Q.i], out = head + (Q.i === 0 && Q.ans === null ? '<div class="small muted">' + (window.PA_CASES_GEN ? total.toLocaleString('fr-FR') + ' situations tirées du solveur, 10 par série. Choisis un thème :' : 'Chargement des situations…') + '</div><div class="seg">' + FILT.map(function (f) { return '<button class="' + (F === f[0] ? 'on' : '') + '" data-casf="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>' : '') + '<div class="small muted">Cas ' + (Q.i + 1) + ' sur ' + Q.list.length + ' · ' + Q.ok + ' bonne' + (Q.ok > 1 ? 's' : '') + ' réponse' + (Q.ok > 1 ? 's' : '') + '</div>' +
      '<div class="card stack"><div>' + c.sit + '</div><div class="small muted">Tableau</div><div class="pq-hand">' + cards(c.board) + '</div><div class="small muted">Ta main</div><div class="pq-hand">' + cards(c.hand) + '</div></div>';
    if (Q.ans === null) out += '<div class="stack">' + c.o.map(function (o, k) { return '<button class="btn block" data-cas="' + k + '">' + o + '</button>'; }).join('') + '</div>';
    else out += '<div class="pq-res ' + (Q.ans === c.a ? 'ok' : 'ko') + '">' + (Q.ans === c.a ? 'Oui : ' : 'Non : ') + c.o[c.a].toLowerCase() + '.</div>' + ui.yo(c.why) + '<button class="btn gold block" data-cas="next">' + (Q.i + 1 >= Q.list.length ? 'Voir mon score' : 'Cas suivant') + '</button>';
    return ui.shell('entrainer', out + '</div>');
  }
  document.addEventListener('click', function (e) {
    var tf = e.target.closest ? e.target.closest('[data-casf]') : null;
    if (tf) { F = tf.getAttribute('data-casf'); Q = null; window.PA_UI.render(); return; }
    var t = e.target.closest ? e.target.closest('[data-cas]') : null; if (!t || !Q && t.getAttribute('data-cas') !== 'again') return;
    var a = t.getAttribute('data-cas');
    if (a === 'again') Q = null; else if (a === 'next') { Q.i++; Q.ans = null; } else if (Q.ans === null) { Q.ans = +a; if (Q.ans === Q.list[Q.i].a) Q.ok++; }
    window.PA_UI.render(); window.scrollTo(0, 0);
  });
  window.PA_CASES = { view: view, reset: function () { Q = null; } };
})();
