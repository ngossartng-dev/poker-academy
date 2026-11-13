/* Poker Academy v2.0 — Jouer une partie : moteur de table, adversaires, coach */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }

  /* ---------- Cartes et évaluateur ---------- */
  var RCH = '23456789TJQKA';
  function cRank(c) { return c >> 2; } function cSuit(c) { return c & 3; }
  function deck() { var d = []; for (var i = 0; i < 52; i++) d.push(i); for (var j = 51; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = d[j]; d[j] = d[k]; d[k] = t; } return d; }
  // renvoie un score comparable (plus grand = meilleur) pour 5 à 7 cartes
  function evalHand(cards) {
    var cnt = new Array(13).fill(0), suits = [[], [], [], []], mask = 0, i;
    for (i = 0; i < cards.length; i++) { var r = cRank(cards[i]); cnt[r]++; suits[cSuit(cards[i])].push(r); mask |= 1 << r; }
    function straightHigh(m) { if ((m & 0x100F) === 0x100F) { /* A-5 */ } for (var h = 12; h >= 4; h--) { if (((m >> (h - 4)) & 31) === 31) return h; } if ((m & 0x100F) === 0x100F) return 3; return -1; }
    for (i = 0; i < 4; i++) if (suits[i].length >= 5) {
      var fm = 0; suits[i].forEach(function (r) { fm |= 1 << r; });
      var sh = straightHigh(fm); if (sh >= 0) return 8e10 + sh;
      var fr = suits[i].slice().sort(function (a, b) { return b - a; }).slice(0, 5);
      return 5e10 + fr[0] * 28561 + fr[1] * 2197 + fr[2] * 169 + fr[3] * 13 + fr[4];
    }
    var quads = -1, trips = [], pairs = [], singles = [];
    for (i = 12; i >= 0; i--) { if (cnt[i] === 4) quads = i; else if (cnt[i] === 3) trips.push(i); else if (cnt[i] === 2) pairs.push(i); else if (cnt[i] === 1) singles.push(i); }
    if (quads >= 0) { var k = -1; for (i = 12; i >= 0; i--) if (i !== quads && cnt[i] > 0) { k = i; break; } return 7e10 + quads * 13 + k; }
    if (trips.length && (trips.length > 1 || pairs.length)) { var p2 = trips.length > 1 ? Math.max(trips[1], pairs[0] === undefined ? -1 : pairs[0]) : pairs[0]; return 6e10 + trips[0] * 13 + p2; }
    var st = straightHigh(mask); if (st >= 0) return 4e10 + st;
    var rest = function (ex, n) { var o = []; for (var x = 12; x >= 0 && o.length < n; x--) if (cnt[x] > 0 && ex.indexOf(x) < 0) o.push(x); return o; };
    if (trips.length) { var kk = rest([trips[0]], 2); return 3e10 + trips[0] * 169 + kk[0] * 13 + kk[1]; }
    if (pairs.length >= 2) { var k2 = rest([pairs[0], pairs[1]], 1); return 2e10 + pairs[0] * 169 + pairs[1] * 13 + k2[0]; }
    if (pairs.length) { var k3 = rest([pairs[0]], 3); return 1e10 + pairs[0] * 2197 + k3[0] * 169 + k3[1] * 13 + k3[2]; }
    var hi = rest([], 5); return hi[0] * 28561 + hi[1] * 2197 + hi[2] * 169 + hi[3] * 13 + hi[4];
  }
  var CAT = ['Hauteur', 'Paire', 'Deux paires', 'Brelan', 'Quinte', 'Couleur', 'Full', 'Carré', 'Quinte flush'];
  function catName(score) { var c = Math.floor(score / 1e10); return CAT[Math.min(8, c)]; }
  // nom précis : « paire de rois », « deux paires, 10 et 8 », « quinte hauteur dame »…
  var RPL = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'valets', 'dames', 'rois', 'as'], RSG = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'valet', 'dame', 'roi', 'as'];
  function de(r) { return r === 12 ? 'd’as' : 'de ' + RPL[r]; }
  function handName(s) {
    var c = Math.floor(s / 1e10), v = s - c * 1e10;
    if (c >= 8) return 'quinte flush hauteur ' + RSG[v];
    if (c === 7) return 'carré ' + de(Math.floor(v / 13));
    if (c === 6) return 'full aux ' + RPL[Math.floor(v / 13)] + ' par les ' + RPL[v % 13];
    if (c === 5) return 'couleur hauteur ' + RSG[Math.floor(v / 28561)];
    if (c === 4) return 'quinte hauteur ' + RSG[v];
    if (c === 3) return 'brelan ' + de(Math.floor(v / 169));
    if (c === 2) return 'deux paires, ' + RPL[Math.floor(v / 169)] + ' et ' + RPL[Math.floor(v / 13) % 13];
    if (c === 1) return 'paire ' + de(Math.floor(v / 2197));
    return 'hauteur ' + RSG[Math.floor(v / 28561)];
  }
  function handCode(c1, c2) {
    var a = cRank(c1), b = cRank(c2), hi = Math.max(a, b), lo = Math.min(a, b);
    if (a === b) return RCH[a] + RCH[a];
    return RCH[hi] + RCH[lo] + (cSuit(c1) === cSuit(c2) ? 's' : 'o');
  }
  // équité par simulation contre n mains aléatoires
  function equity(hole, board, nOpp, iters) {
    iters = iters || 250; var win = 0, used = {}; hole.concat(board).forEach(function (c) { used[c] = 1; });
    var pool = []; for (var c = 0; c < 52; c++) if (!used[c]) pool.push(c);
    for (var it = 0; it < iters; it++) {
      var p = pool.slice(), n = p.length, take = function () { var i = Math.floor(Math.random() * n); var v = p[i]; p[i] = p[n - 1]; n--; return v; };
      var opp = []; for (var o = 0; o < nOpp; o++) opp.push([take(), take()]);
      var b = board.slice(); while (b.length < 5) b.push(take());
      var me = evalHand(hole.concat(b)), best = 0, ties = 0, lose = false;
      for (o = 0; o < nOpp; o++) { var s = evalHand(opp[o].concat(b)); if (s > me) { lose = true; break; } if (s === me) ties++; }
      if (!lose) win += 1 / (ties + 1);
    }
    return win / iters;
  }

  /* ---------- Profils d'adversaires ---------- */
  var OPP = {
    nit: { name: 'Nit', short: 'Nit', vpip: 0.10, pfr: 0.08, agg: 0.45, bluff: 0.03, sticky: 0.25, limp: 0, light: 0 },
    reg: { name: 'Régulier', short: 'Régulier', vpip: 0.18, pfr: 0.15, agg: 0.6, bluff: 0.10, sticky: 0.4, limp: 0, light: 0.35 },
    lag: { name: 'Large-agressif', short: 'LAG', vpip: 0.28, pfr: 0.22, agg: 0.75, bluff: 0.18, sticky: 0.45, limp: 0, light: 0.6 },
    lp: { name: 'Large-passif', short: 'Large-passif', vpip: 0.35, pfr: 0.10, agg: 0.25, bluff: 0.05, sticky: 0.65, limp: 0.6 },
    station: { name: 'Calling station', short: 'Station', vpip: 0.40, pfr: 0.06, agg: 0.15, bluff: 0.02, sticky: 0.9, limp: 0.7 },
    maniac: { name: 'Maniac', short: 'Maniac', vpip: 0.50, pfr: 0.38, agg: 0.9, bluff: 0.32, sticky: 0.5, limp: 0, light: 0.85 },
    fan: { name: 'Récréatif fantasque', short: 'Fantasque', vpip: 0.38, pfr: 0.15, agg: 0.45, bluff: 0.14, sticky: 0.55, limp: 0.5, wild: true, light: 0.15 },
    surv: { name: 'Survivant', short: 'Survivant', vpip: 0.12, pfr: 0.10, agg: 0.5, bluff: 0.04, sticky: 0.3, limp: 0, surv: true }
  };
  var TABLES = {
    club: { name: 'Club', mix: ['fan', 'fan', 'lp', 'lp', 'reg', 'fan', 'station', 'reg'] },
    micro: { name: 'Micro Winamax', mix: ['station', 'nit', 'station', 'lag', 'nit', 'reg', 'station', 'lag'] },
    agressive: { name: 'Agressive', mix: ['lag', 'maniac', 'lag', 'reg', 'maniac', 'lag', 'lag', 'reg'] },
    miroir: { name: 'Miroir', mix: null },
    mixte: { name: 'Huit profils', mix: ['nit', 'reg', 'lag', 'lp', 'station', 'maniac', 'fan', 'surv'] },
    monclub: { name: 'Mes adversaires du club', mix: ['fan', 'fan', 'lp', 'lp', 'reg', 'fan', 'station', 'reg'] }
  };
  function p0() { return PA.player() || {}; }
  var NAMES = ['Ludo', 'Sabrina', 'Marco', 'Gégé', 'Nadia', 'Bruno', 'Coralie', 'Didier', 'Fanfan', 'Jojo', 'Karine', 'Momo',
    'Alain', 'Amandine', 'Antoine', 'Audrey', 'Aurélien', 'Bastien', 'Béa', 'Benoît', 'Cédric', 'Céline', 'Chantal', 'Christophe', 'Claire', 'Damien', 'Delphine', 'Denis', 'Dom', 'Elodie', 'Emma', 'Eric', 'Fabien', 'Fanny', 'Flo', 'Franck', 'Gaby', 'Gilles', 'Greg', 'Hélène', 'Hugo', 'Isa', 'Jacky', 'Jeannot', 'Jérôme', 'Julie', 'Kevin', 'Laure', 'Léa', 'Lionel', 'Lolo', 'Lucie', 'Manu', 'Marie', 'Martine', 'Mathieu', 'Max', 'Mélanie', 'Michel', 'Mimi', 'Nath', 'Nico', 'Noémie', 'Olivier', 'Pascal', 'Patou', 'Paulo', 'Pierrot', 'Rachid', 'Régis', 'Rémi', 'Rico', 'Romain', 'Sandrine', 'Seb', 'Serge', 'Simon', 'Sophie', 'Steph', 'Sylvie', 'Thierry', 'Thomas', 'Titi', 'Valérie', 'Véro', 'Vincent', 'Xavier', 'Yann', 'Yves', 'Zoé'];
  // un prénom jamais vu dans cette partie : un joueur éliminé ne « revient » pas sous un nom voisin
  function freshName() {
    var used = G.used || (G.used = {}); G.players.forEach(function (q) { used[q.name] = 1; });
    var free = NAMES.filter(function (x) { return !used[x]; });
    var nm = free.length ? free[Math.floor(Math.random() * free.length)] : NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + (2 + Math.floor((G.nameIdx++) / NAMES.length));
    used[nm] = 1; return nm;
  }

  // rang de force (0 = meilleure) en % des combinaisons
  var PCT = {}; (function () { var acc = 0; PA.D.order.forEach(function (h) { acc += PA.combos(h); PCT[h] = acc / 1326; }); })();

  /* ---------- Structures ---------- */
  var STRUCT = {
    20000: [[100, 200], [150, 300], [200, 400], [250, 500], [300, 600], [400, 800], [500, 1000], [600, 1200], [800, 1600], [1000, 2000], [1250, 2500], [1500, 3000], [2000, 4000], [2500, 5000], [3000, 6000], [4000, 8000], [5000, 10000], [6000, 12000], [8000, 16000], [10000, 20000]],
    3000: [[10, 20], [15, 30], [20, 40], [25, 50], [30, 60], [40, 80], [50, 100], [60, 120], [80, 160], [100, 200], [125, 250], [150, 300], [200, 400], [250, 500], [300, 600], [400, 800], [500, 1000], [600, 1200], [800, 1600], [1000, 2000]]
  };
  var PACE = { normal: 12, semi: 8, turbo: 5 };
  var PACE_MIN = { normal: 5, semi: 3, turbo: 2 }; // les blindes montent avec le temps de jeu, comme en vrai
  function lvlMs() { return (PACE_MIN[G.opts.pace] || 3) * 60000; }
  var PAYOUT = { 10: [0.5, 0.3, 0.2], 9: [0.5, 0.3, 0.2], 8: [0.5, 0.3, 0.2], 6: [0.65, 0.35], 2: [1] };

  /* ---------- État de partie ---------- */
  var G = null; // partie en cours
  var SETUP = { format: 'sng', seats: 9, chips: 20000, pace: 'semi', coach: true, table: 'club', bounty: 'classique', huChips: 8000, sizing: 'club' };
  var MTT_FIELD = 100, MTT_PAID = 15;
  var MTT_PAY = [25, 16, 11.5, 8.5, 6.5, 5, 4, 3.2, 2.6, 2.95, 2.95, 2.95, 2.95, 2.95, 2.95];
  var BUYIN = 10;

  function newGame(opts) {
    if (opts.format === 'sng9' || opts.format === 'sng6') { opts.seats = opts.format === 'sng6' ? 6 : 9; opts.format = 'sng'; }
    opts.seats = opts.format === 'hu' ? 2 : ([6, 8, 9, 10].indexOf(+opts.seats) >= 0 ? +opts.seats : 9);
    if (opts.format === 'hu') opts.chips = opts.huChips || 8000;
    opts.mtt = opts.format === 'mtt' || opts.format === 'moments';
    if (opts.mtt) opts.chips = 20000;
    var p = PA.player(), n = opts.seats, players = [], names = NAMES.slice().sort(function () { return Math.random() - 0.5; });
    var mix = TABLES[opts.table].mix;
    if (!mix) { var mp = { nit: 'nit', tag: 'reg', equilibre: 'reg', lag: 'lag', perso: 'reg' }[p.profile || 'perso']; mix = [mp, mp, mp, mp, mp, mp, mp, mp]; }
    mix = mix.slice().sort(function () { return Math.random() - 0.5; });
    // « Mes adversaires du club » : les fiches du carnet (Analyser › Adversaires) prennent place à la table, avec leur profil
    var mine = opts.table === 'monclub' ? (p.opps || []).filter(function (o) { return o.name && OPP[o.prof]; }).slice().sort(function () { return Math.random() - 0.5; }) : [];
    names = names.filter(function (x) { return !mine.some(function (o) { return o.name === x; }); });
    for (var i = 0; i < n; i++) {
      if (i === 0) players.push({ id: 0, name: p.pseudo, hero: true, prof: null, stack: opts.chips, bounty: startBounty(opts) });
      else if (mine[i - 1]) players.push({ id: i, name: mine[i - 1].name, hero: false, prof: mine[i - 1].prof, note: mine[i - 1].note || '', stack: opts.chips, bounty: startBounty(opts) });
      else players.push({ id: i, name: names[i - 1], hero: false, prof: mix[(i - 1) % mix.length], stack: opts.chips, bounty: startBounty(opts) });
    }
    var field = [];
    if (opts.mtt) for (var f = 0; f < MTT_FIELD - n; f++) field.push({ stack: opts.chips, bounty: startBounty(opts) });
    if (G && !G.over && G.handNo >= 10) try { saveTourney(true); } catch (e) {} // la partie précédente, laissée en cours, reste dans l'historique
    flushHH();
    G = { id: Date.now(), opts: opts, players: players, button: Math.floor(Math.random() * n), level: 0, handNo: 0, hand: null, log: [], stats: { hands: 0, vpip: 0, pfr: 0, pre: { ok: 0, style: 0, err: 0, n: 0 }, post: { ok: 0, n: 0 }, sol: { n: 0, ok: 0, mix: 0, bad: 0 }, postNotes: [], big: [], consult: 0, notes: [], bountyCash: 0, kos: 0, phase: {}, autoHands: 0 }, over: false, place: null, coachMsg: null, busy: false, field: field, mix: mix, nameIdx: n, names: names, keyMsg: null, played: 0 };
    var pl = PA.player(); pl.last = { route: 'jeu', label: 'Partie en cours' }; PA.save();
    if (window.PA_SOLVER && !window.PA_SOLVER.data()) try { window.PA_SOLVER.loadData(function () {}); } catch (e) {}
    startHand();
  }
  function alive() { return G.players.filter(function (p) { return p.stack > 0; }); }
  function startBounty(opts) { return opts.bounty === 'classique' ? 0 : BUYIN / 2; }
  /* ---------- Tableau de bord du tournoi : temps de jeu, niveau, joueurs restants, tapis moyen ---------- */
  function totalChips() { return (G.players.length + (G.field ? G.field.length : 0)) * G.opts.chips; }
  function clockTxt(ms) { var t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = t % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (sec < 10 ? '0' : '') + sec; }
  function hud() {
    var L = levelInfo(), nx = nextLvlInfo();
    var rem = G.opts.mtt ? remaining() : alive().length, start = G.opts.mtt ? MTT_FIELD : G.players.length, avg = totalChips() / Math.max(1, rem), me = G.players[0];
    var cell = function (ic, lab, val, sub, id) { return '<div class="gh-c"><span>' + ic + ' ' + lab + '</span><b' + (id ? ' id="' + id + '"' : '') + '>' + val + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>'; };
    return '<div class="gh">' +
      cell('⏱', 'Temps', clockTxt(G.played || 0), 'niveau ' + L.n, 'ghClock') +
      cell('🔺', 'Blindes', PA.fmt(L.sb) + ' / ' + PA.fmt(L.bb), (L.ante ? 'ante ' + PA.fmt(L.ante) + ' · ' : '') + '<span id="ghNext">' + nx.txt + '</span>') +
      cell('👥', 'Joueurs', rem + '<small> / ' + start + '</small>', G.opts.mtt ? MTT_PAID + ' payés' : (paidPlaces() + ' payé' + (paidPlaces() > 1 ? 's' : ''))) +
      cell('🪙', 'Moyen', PA.fmt(Math.round(avg)), Math.round(avg / L.bb) + ' BB (toi ' + Math.round(me.stack / L.bb) + ')') +
      '<div class="gh-bar"><i id="ghBar" style="width:' + nx.pct + '%"></i></div></div>';
  }
  function nextLvlInfo() {
    var ms = lvlMs(), left = (G.level + 1) * ms - (G.played || 0);
    if (left <= 0) return { txt: '↑ main suivante', pct: 100 };
    var sec = Math.ceil(left / 1000); return { txt: '↑ dans ' + Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2), pct: Math.round(Math.min(100, Math.max(0, 100 - left / ms * 100))) };
  }
  // le temps de jeu avance seulement quand la table est à l'écran
  setInterval(function () {
    if (!G || G.over || document.hidden || !/^#jeu/.test(location.hash)) return;
    G.played = (G.played || 0) + 1000;
    var el = document.getElementById('ghClock'); if (el) el.textContent = clockTxt(G.played);
    var nx = nextLvlInfo(), e2 = document.getElementById('ghNext'), e3 = document.getElementById('ghBar'); if (e2) e2.textContent = nx.txt; if (e3) e3.style.width = nx.pct + '%';
  }, 1000);
  function remaining() { return alive().length + (G.field ? G.field.filter(function (f) { return f.stack > 0; }).length : 0); }
  function paidPlaces() { return G.opts.mtt ? MTT_PAID : PAYOUT[G.opts.seats].length; }
  function prizeFor(place) { if (G.opts.mtt) { var pool = MTT_FIELD * BUYIN * (G.opts.bounty === 'classique' ? 1 : 0.5); return place <= MTT_PAID ? pool * MTT_PAY[place - 1] / 100 : 0; } var pool2 = G.opts.seats * BUYIN * (G.opts.bounty === 'classique' ? 1 : 0.5); var pp = PAYOUT[G.opts.seats][place - 1]; return pp ? pool2 * pp : 0; }
  function phaseName() {
    var rem = remaining(), paid = paidPlaces(), me = G.players[0], L = levelInfo(), bbs = me.stack / L.bb;
    if (alive().length === 2 && rem === 2) return 'Heads-up';
    if (G.opts.mtt && rem <= G.opts.seats) return 'Table finale';
    if (rem > paid && rem <= paid + (G.opts.mtt ? 3 : 1)) return 'Bulle';
    if (bbs <= 12) return 'Tapis court';
    if (rem <= paid) return 'Places payées';
    return 'Début et milieu';
  }
  function isKeyMoment() { var ph = phaseName(); return ph !== 'Début et milieu' && ph !== 'Places payées'; }
  // champ virtuel : les autres tables du tournoi
  function simField() {
    if (!G.opts.mtt) return;
    var TS = G.opts.seats || 9;
    if (remaining() <= TS) return;
    var L = levelInfo(), live = G.field.filter(function (f) { return f.stack > 0; });
    var tables = Math.ceil(live.length / TS);
    for (var t = 0; t < tables; t++) {
      var a = live[Math.floor(Math.random() * live.length)], b = live[Math.floor(Math.random() * live.length)];
      if (!a || !b || a === b || a.stack <= 0 || b.stack <= 0) continue;
      var avg = (MTT_FIELD * G.opts.chips) / Math.max(1, remaining());
      var pBig = 0.025 + Math.min(0.25, 0.6 * L.bb / avg) + (Math.min(a.stack, b.stack) < 12 * L.bb ? 0.15 : 0);
      var amt = Math.random() < pBig ? Math.min(a.stack, b.stack) : Math.round(Math.min(a.stack, b.stack, L.bb * (2 + Math.random() * 6)));
      var w = Math.random() < 0.5 ? a : b, l = w === a ? b : a;
      if (amt >= l.stack && remaining() <= TS) continue;
      w.stack += amt; l.stack -= amt;
      if (l.stack <= 0) { l.stack = 0; w.bounty += l.bounty / 2; }
    }
    live.forEach(function (f) { if (f.stack > 0 && f.stack < L.bb && remaining() > TS) { var others = live.filter(function (o) { return o !== f && o.stack > 0; }); if (others.length) { others[Math.floor(Math.random() * others.length)].stack += f.stack; f.stack = 0; } } });
  }
  function refillSeats() {
    if (!G.opts.mtt) return;
    G.players.forEach(function (p, i) {
      if (i === 0 || p.stack > 0) return;
      var src = G.field.filter(function (f) { return f.stack > 0; });
      if (!src.length) return;
      var f = src[Math.floor(Math.random() * src.length)];
      p.stack = f.stack; p.bounty = f.bounty; f.stack = 0; p.prof = G.mix[Math.floor(Math.random() * G.mix.length)];
      p.name = freshName(); p.hs = null;
      p.fresh = G.handNo + 1; (G.arrivals = G.arrivals || []).push(p.name + ' (' + PA.fmt(p.stack) + ')');
    });
  }
  function levelInfo() { var s = STRUCT[G.opts.chips] || STRUCT[20000], l = Math.min(G.level, s.length - 1); return { sb: s[l][0], bb: s[l][1], ante: l >= 3 ? s[l][1] : 0, n: l + 1 }; }
  function nextSeat(i) { var n = G.players.length; for (var k = 1; k <= n; k++) { var j = (i + k) % n; if (G.players[j].stack > 0 || (G.hand && G.hand.inHand[j])) return j; } return i; }
  function nextAlive(i) { var n = G.players.length; for (var k = 1; k <= n; k++) { var j = (i + k) % n; if (G.players[j].stack > 0) return j; } return i; }

  function posNames(order) {
    // order : sièges depuis le bouton, dans le sens du jeu (bouton, SB, BB, …)
    // à table incomplète, chaque place prend le nom de sa place à 9 joueurs comptée depuis le bouton
    // (à 6 joueurs : LJ, HJ, CO, BTN, SB, BB), pour coller aux ranges de « Ma range »
    var n = order.length, labels = {}, BACK = ['CO', 'HJ', 'LJ', 'MP', 'UTG+1', 'UTG'];
    if (n === 10) BACK = ['CO', 'HJ', 'LJ', 'MP', 'UTG+2', 'UTG+1', 'UTG']; // à 10 : une place de plus en début de table, jouée comme UTG+1
    order.forEach(function (s, i) { labels[s] = n === 2 ? ['BTN', 'BB'][i] : (i < 3 ? ['BTN', 'SB', 'BB'][i] : BACK[n - 1 - i]); }); return labels;
  }

  function startHand() {
    var guard = 0; G.arrivals = [];
    while (true) {
      if (G.handNo > 0) { simField(); refillSeats(); }
      if (G.players[0].stack <= 0 || remaining() <= 1 || alive().length <= 1 && !(G.opts.mtt && remaining() > 1)) { finish(); return; }
      if (G.opts.format === 'moments' && !isKeyMoment() && guard++ < 2000) {
        dealHand(true);
        if (autoPlay() === 'interrupt') { G.keyMsg = 'Moment clé : <b>gros coup</b>. Cette décision engage une grosse part de ton tapis : à toi de jouer.'; G.hand.auto = false; G.lastPhase = null; loop(); return; }
        G.stats.autoHands++; continue;
      }
      break;
    }
    if (G.opts.format === 'moments') { var ph = phaseName(); G.keyMsg = (G.lastPhase !== ph ? 'Moment clé : <b>' + ph + '</b>. ' + ({ 'Bulle': 'Le prochain éliminé ne gagne rien : vole les tapis moyens, paye serré.', 'Tapis court': 'Moins de 12 BB : tapis ou fold, ne relance plus petit.', 'Table finale': 'Chaque place compte : pense ICM avant de payer.', 'Heads-up': 'Plus que deux : ouvre très large, défends large.' }[ph] || '') : null); G.lastPhase = ph; }
    dealHand(false);
    loop();
  }
  function dealHand(auto) {
    G.handNo++; var wantLvl = Math.floor((G.played || 0) / lvlMs()); if (wantLvl > G.level) G.level = wantLvl;
    G.button = nextAlive(G.button);
    var L = levelInfo(), d = deck(), n = G.players.length;
    var order = []; var s = G.button; for (var k = 0; k < n; k++) { if (G.players[s].stack > 0) order.push(s); s = (s + 1) % n; }
    var heads = order.length === 2;
    var sbSeat = heads ? order[0] : order[1], bbSeat = heads ? order[1] : order[2];
    var H = { deck: d, board: [], pot: 0, bets: {}, total: {}, inHand: {}, folded: {}, allin: {}, acted: {}, noRaise: {}, street: 0, cur: 0, lastRaise: L.bb, sb: sbSeat, bbSeat: bbSeat, L: L, pos: posNames(order), order: order, hole: {}, actions: [], heroPre: null, preRaises: 0, opener: null, limpers: 0, showdown: null, winners: null };
    G.hand = H;
    H.st0 = {}; H.ts = Date.now(); order.forEach(function (i) { H.st0[i] = G.players[i].stack; });
    order.forEach(function (i) { H.inHand[i] = true; H.bets[i] = 0; H.total[i] = 0; H.hole[i] = [d.pop(), d.pop()]; });
    // ante (BB ante, payée par la grosse blinde)
    if (L.ante) { var a = Math.min(L.ante, G.players[bbSeat].stack); G.players[bbSeat].stack -= a; H.pot += a; H.total[bbSeat] += a; if (G.players[bbSeat].stack === 0) H.allin[bbSeat] = true; }
    post(sbSeat, L.sb); post(bbSeat, L.bb);
    H.cur = L.bb;
    H.toAct = heads ? sbSeat : nextIn(bbSeat);
    G.stats.hands++;
    H.vp = {}; H.pr = {}; order.forEach(function (i) { hsOf(G.players[i]).n++; });
    H.heroIn = !!H.inHand[0];
    G.coachMsg = null; H.auto = auto; H.phase = phaseName();
  }
  // stats sous chaque joueur (comme un HUD) : mains distribuées, VPIP (a mis de l'argent de lui-même avant le flop), relances avant le flop
  function hsOf(p) { if (!p.hs) p.hs = { n: 0, v: 0, r: 0 }; return p.hs; }
  function hudPct(a, n) { return n ? Math.round(a / n * 100) : 0; }
  function hudLine(p) { var h = p.hs; if (!h || !h.n) return '<span class="hd2">— mains</span>'; return '<span class="hd2" title="' + h.n + ' mains · VPIP ' + hudPct(h.v, h.n) + ' % (mains jouées) · ' + hudPct(h.v - h.r, h.n) + ' % payées sans relancer · ' + hudPct(h.r, h.n) + ' % relancées avant le flop"><b>' + h.n + '</b> · V<b>' + hudPct(h.v, h.n) + '</b> · P<b>' + hudPct(h.v - h.r, h.n) + '</b> · R<b>' + hudPct(h.r, h.n) + '</b></span>'; }
  function hudFull(p) { var h = p.hs || { n: 0, v: 0, r: 0 }; return '<span class="small">' + h.n + ' main' + (h.n > 1 ? 's' : '') + ' · VPIP ' + hudPct(h.v, h.n) + ' % · payées ' + hudPct(h.v - h.r, h.n) + ' % · relances ' + hudPct(h.r, h.n) + ' %</span>'; }
  function post(i, amt) { var H = G.hand, p = G.players[i], a = Math.min(amt, p.stack); p.stack -= a; H.bets[i] += a; H.total[i] += a; if (p.stack === 0) H.allin[i] = true; }
  function nextIn(i) { var H = G.hand, n = G.players.length; for (var k = 1; k <= n; k++) { var j = (i + k) % n; if (H.inHand[j] && !H.folded[j] && !H.allin[j]) return j; } return -1; }
  function activeCount() { var H = G.hand; return Object.keys(H.inHand).filter(function (i) { return !H.folded[i]; }).length; }
  function canActCount() { var H = G.hand; return Object.keys(H.inHand).filter(function (i) { return !H.folded[i] && !H.allin[i]; }).length; }
  function toCall(i) { var H = G.hand; return Math.min(H.cur - H.bets[i], G.players[i].stack); }
  // peut-on encore relancer ? il faut un adversaire qui ne soit pas à tapis, et une relance complète depuis notre dernière parole
  function canRaise(i) { var H = G.hand; if (H.noRaise && H.noRaise[i]) return false; return Object.keys(H.inHand).some(function (k) { k = +k; return k !== i && !H.folded[k] && !H.allin[k]; }); }
  function potTotal() { var H = G.hand, t = H.pot; Object.keys(H.bets).forEach(function (k) { t += H.bets[k]; }); return t; }

  function roundDone() {
    var H = G.hand;
    var ids = Object.keys(H.inHand).map(Number).filter(function (i) { return !H.folded[i] && !H.allin[i]; });
    if (activeCount() <= 1) return true;
    if (ids.length === 0) return true;
    return ids.every(function (i) { return H.acted[i] && H.bets[i] === H.cur; }) || (ids.length === 1 && H.bets[ids[0]] >= H.cur && (H.acted[ids[0]] || H.cur === 0 || maxOtherBet(ids[0]) <= H.bets[ids[0]]));
  }
  function maxOtherBet(i) { var H = G.hand, m = 0; Object.keys(H.bets).forEach(function (k) { if (+k !== i && !H.folded[k]) m = Math.max(m, H.bets[k]); }); return m; }

  function act(i, type, amount) {
    var H = G.hand, p = G.players[i], tc = toCall(i);
    var rec = { seat: i, street: H.street, type: type, amount: 0, pot: potTotal(), toCall: tc };
    if (type === 'fold') { H.folded[i] = true; }
    else if (type === 'check') { }
    else if (type === 'call') { var c = Math.min(tc, p.stack); p.stack -= c; H.bets[i] += c; H.total[i] += c; rec.amount = c; if (p.stack === 0) H.allin[i] = true; }
    else if (type === 'raise') {
      var to = Math.min(amount, H.bets[i] + p.stack);
      var add = to - H.bets[i]; p.stack -= add; H.total[i] += add;
      var raiseBy = to - H.cur; if (raiseBy >= H.lastRaise) { H.lastRaise = raiseBy; H.acted = {}; H.noRaise = {}; }
      else Object.keys(H.acted).forEach(function (k) { if (+k !== i && H.acted[k]) H.noRaise[k] = true; }); // tapis incomplet : pas de nouvelle relance pour ceux qui ont déjà parlé
      if (to > H.cur) H.cur = to;
      H.bets[i] = to; rec.amount = to; if (p.stack === 0) H.allin[i] = true;
      if (H.street === 0) { H.preRaises++; H.pfa = i; if (!H.opener && H.opener !== 0) H.opener = i; } else H.sRaises = (H.sRaises || 0) + 1;
      H.lastAggressor = i;
    }
    if (H.street === 0 && H.vp && (type === 'raise' || (type === 'call' && rec.amount > 0))) { var hs = hsOf(p); if (!H.vp[i]) { H.vp[i] = 1; hs.v++; } if (type === 'raise' && !H.pr[i]) { H.pr[i] = 1; hs.r++; } }
    if (H.street === 0 && type === 'call' && H.preRaises === 0 && i !== H.bbSeat) H.limpers++;
    if (p.stack === 0 && type !== 'fold' && type !== 'check') rec.allin = true;
    H.acted[i] = true; H.actions.push(rec);
    if (i === 0 && H.street === 0 && type !== 'check') { if (type !== 'fold' && !H.vpipCounted) { G.stats.vpip++; H.vpipCounted = true; } if (type === 'raise' && !H.pfrCounted) { G.stats.pfr++; H.pfrCounted = true; } }
  }

  function nextStreet() {
    var H = G.hand;
    Object.keys(H.bets).forEach(function (k) { H.pot += H.bets[k]; H.bets[k] = 0; });
    H.prevChecked = H.street > 0 && H.cur === 0; H.cur = 0; H.lastRaise = H.L.bb; H.acted = {}; H.noRaise = {}; H.sRaises = 0; H.street++;
    if (H.street === 1) { H.deck.pop(); H.board.push(H.deck.pop(), H.deck.pop(), H.deck.pop()); }
    else if (H.street <= 3) { H.deck.pop(); H.board.push(H.deck.pop()); }
    H.toAct = nextIn(G.button);
  }

  function showdown() {
    var H = G.hand;
    Object.keys(H.bets).forEach(function (k) { H.pot += H.bets[k]; H.bets[k] = 0; });
    while (H.board.length < 5) H.board.push(H.deck.pop());
    var live = Object.keys(H.inHand).map(Number).filter(function (i) { return !H.folded[i]; });
    var scores = {}; live.forEach(function (i) { scores[i] = evalHand(H.hole[i].concat(H.board)); });
    // pots principaux et annexes
    var contrib = Object.keys(H.total).map(Number).map(function (i) { return { i: i, t: H.total[i] }; });
    var levels = Array.from(new Set(contrib.map(function (c) { return c.t; }).filter(function (t) { return t > 0; }))).sort(function (a, b) { return a - b; });
    var prev = 0, won = {}; H.pots = [];
    levels.forEach(function (lv) {
      var amt = 0; contrib.forEach(function (c) { amt += Math.max(0, Math.min(c.t, lv) - prev); });
      var elig = live.filter(function (i) { return H.total[i] >= lv; });
      if (!elig.length) elig = live;
      var best = Math.max.apply(null, elig.map(function (i) { return scores[i]; }));
      var ws = elig.filter(function (i) { return scores[i] === best; });
      var share = Math.floor(amt / ws.length), rem = amt - share * ws.length;
      ws.forEach(function (w, idx) { won[w] = (won[w] || 0) + share + (idx === 0 ? rem : 0); });
      if (amt > 0) { var lp = H.pots[H.pots.length - 1]; if (lp && lp.elig.join() === elig.join()) lp.amt += amt; else H.pots.push({ amt: amt, elig: elig.slice(), ws: ws.slice() }); }
      prev = lv;
    });
    Object.keys(won).forEach(function (w) { G.players[w].stack += won[w]; });
    H.winners = won; H.scores = scores; H.showdown = live.length > 1;
    endHand();
  }
  function awardUncontested() {
    var H = G.hand; Object.keys(H.bets).forEach(function (k) { H.pot += H.bets[k]; H.bets[k] = 0; });
    var w = Object.keys(H.inHand).map(Number).filter(function (i) { return !H.folded[i]; })[0];
    G.players[w].stack += H.pot; H.winners = {}; H.winners[w] = H.pot; H.showdown = false; endHand();
  }
  function endHand() {
    var H = G.hand; H.done = true;
    try { if (!H.auto && H.inHand[0]) recordHH(H); } catch (e) {}
    // éliminations et primes
    var ws = Object.keys(H.winners).map(Number).sort(function (a, b) { return H.winners[b] - H.winners[a]; });
    H.order.forEach(function (i) {
      var p = G.players[i];
      if (p.stack > 0 || !ws.length) return;
      var k = ws[0]; if (k === i) return;
      var w = G.players[k];
      if (G.opts.bounty !== 'classique' && p.bounty > 0) {
        var rr = Math.random(), mult = rr < 0.5 ? 0.5 : (rr < 0.8 ? 1 : (rr < 0.95 ? 2 : (rr < 0.99 ? 5 : 10)));
        var cash = G.opts.bounty === 'space' ? p.bounty * mult : p.bounty / 2;
        if (G.opts.bounty === 'pko') w.bounty += p.bounty / 2;
        if (k === 0) { G.stats.bountyCash += cash; G.stats.kos++; H.koMsg = 'Tu élimines ' + p.name + ' : prime de ' + cash.toFixed(2).replace('.', ',') + ' €.'; }
      } else if (k === 0) { G.stats.kos++; }
    });
    var heroWon = H.winners[0] || 0, heroIn = H.total[0] || 0;
    var net = heroWon - heroIn; if (Math.abs(net) >= H.L.bb * 15) G.stats.big.push({ hand: G.handNo, net: net, cards: H.hole[0], board: H.board.slice(), cat: H.scores && H.scores[0] ? catName(H.scores[0]) : '' });
    G.busy = false; if (!H.auto) U().render();
  }

  /* ---------- Pilote automatique (moments clés) ---------- */
  function autoDecideHero() {
    var H = G.hand, i = 0, tc = toCall(0), pot = potTotal();
    if (H.street === 0) {
      var hs = heroSit(), prof = PA.player().profile || 'tag';
      if (hs) {
        var a = PA.actionFor(prof, hs.sit, hs.hand);
        if (a === 'raise' && hs.sit.type === 'iso') return ['raise', H.L.bb * ((hs.sit.pos === 'SB' || hs.sit.pos === 'BB' ? 4 : 3) + H.limpers)];
        if (a === 'raise' && hs.sit.type === 'squeeze') return ['raise', H.cur * 4 + H.L.bb * (1 + (hs.sit.pos === 'SB' || hs.sit.pos === 'BB' ? 1.5 : 0))];
        if (a === 'raise') return hs.sit.type === 'def' ? ['raise', H.cur * (hs.sit.pos === 'SB' || hs.sit.pos === 'BB' ? 4 : 3)] : ['raise', H.L.bb * (G.opts.table === 'club' || G.opts.table === 'monclub' ? 2 : 2.5)];
        if (a === 'allin') return ['raise', G.players[0].stack + H.bets[0]];
        if (a === 'call') return ['call'];
        return tc === 0 ? ['check'] : ['fold'];
      }
      var code = handCode(H.hole[0][0], H.hole[0][1]);
      if (PCT[code] < 0.03) return ['raise', G.players[0].stack + H.bets[0]];
      return tc === 0 ? ['check'] : ['fold'];
    }
    var eq = equity(H.hole[0], H.board, Math.max(1, activeCount() - 1), 150);
    // pilote prudent : il ne s'engage qu'avec une main forte, pour ne pas t'éliminer à ta place
    if (tc > 0) { if (tc >= G.players[0].stack * 0.5) return eq > 0.8 ? ['call'] : ['fold']; return eq > Math.max(0.7, tc / (pot + tc) + 0.25) ? ['call'] : ['fold']; }
    return eq > 0.8 ? ['raise', Math.round(pot / 2)] : ['check'];
  }
  function applyDecision(i, d) {
    var H = G.hand;
    if (d[0] === 'raise' && !canRaise(i)) d = ['call'];
    if (d[0] === 'raise') { var minTo = H.cur + H.lastRaise, maxTo = G.players[i].stack + H.bets[i]; var to = Math.max(minTo, d[1]); if (to >= maxTo || maxTo - to < H.L.bb) to = maxTo; if (to <= H.cur) d = ['call']; else { act(i, 'raise', to); H.lastAggressor = i; } }
    if (d[0] === 'call') { if (toCall(i) === 0) act(i, 'check'); else act(i, 'call'); }
    else if (d[0] === 'check') { if (toCall(i) > 0) act(i, 'fold'); else act(i, 'check'); }
    else if (d[0] === 'fold') { if (toCall(i) === 0) act(i, 'check'); else act(i, 'fold'); }
    H.toAct = nextIn(i);
  }
  function autoPlay() {
    var H = G.hand, guard = 0;
    while (!H.done && guard++ < 500) {
      if (activeCount() <= 1) { awardUncontested(); break; }
      if (roundDone()) { if (canActCount() <= 1 && activeCount() > 1) { while (H.street < 3) nextStreet(); showdown(); break; } if (H.street === 3) { showdown(); break; } nextStreet(); continue; }
      var i = H.toAct; if (i < 0) { if (H.street === 3) { showdown(); break; } nextStreet(); continue; }
      if (i === 0) {
        var dh = autoDecideHero(), st0 = G.players[0].stack, tc0 = toCall(0);
        var risk = dh[0] === 'raise' ? dh[1] - H.bets[0] : (dh[0] === 'call' ? tc0 : 0);
        if (tc0 >= st0 * 0.3 || risk >= st0 * 0.3) return 'interrupt';
        applyDecision(0, dh);
      } else applyDecision(i, botDecide(i));
    }
  }

  /* ---------- Décisions des adversaires ---------- */
  var LIGHT = { A5s: 2, A4s: 2, A3s: 2, A2s: 2, A9s: 1, A8s: 1, A7s: 1, A6s: 1, K9s: 1, K8s: 1, K7s: 1, K6s: 1, Q9s: 1, J9s: 1, T9s: 1, '98s': 1, '87s': 1, '76s': 1, '65s': 1 };
  /* tailles de mise des adversaires selon le réglage de la partie */
  var SIZING = {
    club: { open: 2, bet: [0.33, 0.5], strong: 0.5, raise: 2.5, wildMax: 0.75, threeIP: 2.7, threeOOP: 3.2, four: 2.1 },
    standard: { open: null, bet: [0.5, 0.66], strong: 0.66, raise: 2.8, wildMax: 1, threeIP: 3, threeOOP: 3.6, four: 2.2 },
    grosses: { open: null, bet: [0.66, 1], strong: 1, raise: 3.2, wildMax: 1.25, threeIP: 3.3, threeOOP: 4, four: 2.3 }
  };
  function SZ() { return SIZING[G.opts.sizing] || SIZING.club; }
  /* ---------- Chaque profil a sa façon de miser (plus de réglage global) ----------
     open : ouverture en BB ; three : 3-bet [en position, hors position] ; four : 4-bet ; raise : relance après le flop (× la mise) ;
     dry / wet : mise normale sur tableau sec / dangereux (fraction du pot) ; strong : avec une grosse main ; bluff : en bluff ; over : part d'overbets. */
  var STYLE = {
    nit: { open: 2.2, three: [3, 3.5], four: 2.2, raise: 2.5, dry: 0.33, wet: 0.5, strong: 0.75, bluff: 0.33, over: 0, txt: 'mises petites et régulières ; une grosse mise, c’est une grosse main (il bluffe très peu)' },
    reg: { open: 2.3, three: [3, 3.6], four: 2.2, raise: 2.8, dry: 0.33, wet: 0.66, strong: 0.66, bluff: 0.66, over: 0.03, txt: 'tailles cohérentes : petit sur tableau sec, deux tiers sur tableau dangereux, mêmes tailles en bluff et en valeur' },
    lag: { open: 2.5, three: [3.3, 4], four: 2.3, raise: 3, dry: 0.5, wet: 0.75, strong: 0.85, bluff: 0.75, over: 0.15, txt: 'grosses mises et overbets, autant en bluff qu’en valeur : il met la pression' },
    lp: { open: 3, three: [3, 3.5], four: 2.2, raise: 2.5, dry: 0.33, wet: 0.4, strong: 0.5, bluff: 0.33, over: 0, txt: 'limpe souvent, mise petit ; une relance de sa part est sérieuse' },
    station: { open: 2, three: [3, 3], four: 2.1, raise: 2, dry: 0.25, wet: 0.33, strong: 0.5, bluff: 0.25, over: 0, txt: 'mises minimum, paie presque tout ; quand il relance, c’est un monstre' },
    maniac: { open: 3.5, three: [4, 5], four: 2.5, raise: 3.5, dry: 0.75, wet: 1, strong: 1, bluff: 1, over: 0.3, txt: 'tailles énormes et imprévisibles (pot, overbet, tapis) : il bluffe beaucoup' },
    fan: { open: 0, three: [3, 4], four: 2.3, raise: 0, dry: 0, wet: 0, strong: 0, bluff: 0, over: 0.1, wild: true, txt: 'tailles au hasard : la taille de sa mise ne veut presque rien dire' },
    surv: { open: 2, three: [3, 3.5], four: 2.2, raise: 2.5, dry: 0.33, wet: 0.5, strong: 0.6, bluff: 0.33, over: 0, txt: 'mises prudentes, se couche face à la pression près des places payées' }
  };
  Object.keys(OPP).forEach(function (k) { OPP[k].key = k; });
  function ST(P) { return STYLE[P.key] || STYLE.reg; }
  function clubTable() { return G.opts.table === 'club' || G.opts.table === 'monclub'; }
  // au club, pas de limp (sauf en heads-up) : on relance ou on se couche
  function noLimp() { var H = G.hand; if (!clubTable() || !H || H.order.length <= 2) return false; var live = Object.keys(H.inHand).filter(function (k) { return !H.folded[k]; }).length; return live > 2; } // la petite blinde peut compléter quand il ne reste que les deux blindes
  function wetBoard(B) { var s = {}, r = B.map(function (c) { s[cSuit(c)] = (s[cSuit(c)] || 0) + 1; return cRank(c); }).sort(function (a, b) { return a - b; }); var fl = Object.keys(s).some(function (k) { return s[k] >= 2; }); var co = false; for (var q = 1; q < r.length; q++) if (r[q] - r[q - 1] > 0 && r[q] - r[q - 1] <= 2) co = true; return fl || co; }
  function openSize(P, L, pos) {
    var S = ST(P), x;
    if (S.wild) x = [2, 2, 2.5, 3, 3, 4, 5][Math.floor(Math.random() * 7)];
    else if (P.key === 'maniac') x = Math.random() < 0.3 ? 4 : 3;
    else if (P.key === 'reg') x = clubTable() ? 2 : (L.ante ? 2.2 : 2.5);
    else x = S.open;
    if (pos === 'SB' && !S.wild) x = Math.max(x, 3);
    return x;
  }
  function postSize(P, eq, pot, strong) {
    var S = ST(P), H = G.hand;
    if (S.wild) return [0.25, 0.33, 0.5, 0.75, 1, 1.5][Math.floor(Math.random() * 6)];
    var f = strong ? S.strong : (eq < 0.35 ? S.bluff : (wetBoard(H.board) ? S.wet : S.dry));
    if (Math.random() < S.over && (strong || eq < 0.3)) f = 1.25 + Math.random() * 0.5;
    if (clubTable() && !S.over) f = Math.min(f, 0.66);
    return f;
  }
  function raiseMult(P) { var S = ST(P); if (S.wild) return [2, 2.5, 3, 4][Math.floor(Math.random() * 4)]; if (P.key === 'maniac' && Math.random() < 0.3) return 2; return S.raise; }
  function botDecide(i) {
    var H = G.hand, p = G.players[i], P = OPP[p.prof], L = H.L, tc = toCall(i), bbs = p.stack / L.bb, pot = potTotal();
    var code = handCode(H.hole[i][0], H.hole[i][1]), hp = PCT[code];
    var pos = H.pos[i], hu = H.order.length === 2, late = hu ? (pos === 'BTN' ? 5 : 1) : ({ CO: 1.5, BTN: 1.9, SB: 1.4, HJ: 1.15, LJ: 1, MP: 0.85, 'UTG+2': 0.78, 'UTG+1': 0.75, UTG: 0.7, BB: 1 }[pos] || 1);
    var eff = Math.min(p.stack + H.bets[i], Math.max.apply(null, Object.keys(H.inHand).filter(function (k) { return +k !== i && !H.folded[k]; }).map(function (k) { return G.players[k].stack + H.bets[k]; })));
    var effBB = eff / L.bb, wild = P.wild ? (Math.random() - 0.5) * 0.15 : 0;
    var rem = remaining(), bubble = rem > paidPlaces() && rem <= paidPlaces() + (G.opts.mtt ? 3 : 1);
    if (H.street === 0) {
      // tapis courts : tapis ou fold
      if (effBB <= 15 && H.preRaises === 0) {
        var t = PA.D.pushfold[String(PA.nearestPush(effBB))].push[pos === 'BB' || hu ? 'SB' : pos] || [];
        var push = t.indexOf(code) >= 0 || hp < (P.vpip * 0.9 + wild);
        if (P.surv && bubble) push = hp < 0.08;
        if (push) return ['raise', p.stack + H.bets[i]];
        return tc === 0 ? ['check'] : ['fold'];
      }
      if (H.preRaises === 0) {
        var openP = Math.min(hu ? 0.85 : 0.6, P.pfr * late + wild);
        if (hp < openP) { var sz = L.bb * openSize(P, L, pos) + H.limpers * L.bb; if (sz > (p.stack + H.bets[i]) * 0.45) sz = p.stack + H.bets[i]; return ['raise', Math.round(sz)]; }
        if (noLimp() && i !== H.bbSeat) { // les joueurs larges qui auraient limpé ouvrent au minimum, les autres se couchent
          if (hp < Math.min(0.5, P.vpip * late * (P.limp > 0 ? 0.7 : 0.5) + wild)) return ['raise', Math.round(L.bb * 2)];
          return tc === 0 ? ['check'] : ['fold'];
        }
        var limpR = P.limp > 0 ? P.limp : (P.name === 'Maniac' ? 0 : (clubTable() ? 0.3 : 0.12));
        if (hp < Math.min(hu ? 0.95 : 0.7, P.vpip * late + wild) && (i === H.bbSeat || Math.random() < (P.limp > 0 ? 1 : limpR))) return tc === 0 ? ['check'] : ['call'];
        return tc === 0 ? ['check'] : ['fold'];
      }
      // face à une relance
      var price = tc / (pot + tc), allInFacing = tc >= p.stack;
      var threeP = P.pfr * 0.22 * (H.preRaises >= 2 ? 0.35 : 1) * (0.7 + P.agg * 0.6);
      var callP = P.vpip * (0.45 + P.sticky * 0.5) * (H.preRaises >= 2 ? 0.35 : 1);
      if (i === H.bbSeat) callP *= 1.3;
      if (hu) { callP = Math.min(0.75, callP * 2.2); threeP = Math.min(0.25, threeP * 2); }
      if (bubble && P.surv) { threeP *= 0.4; callP *= 0.4; }
      if (allInFacing || tc >= p.stack * 0.5) { var tcBB = tc / L.bb, need = tcBB >= 60 ? 0.025 : tcBB >= 40 ? 0.035 : tcBB >= 25 ? 0.06 : Math.max(0.03, 0.12 - 0.002 * Math.min(40, tcBB)); need += P.sticky * (tcBB >= 40 ? 0.01 : 0.04); if (P.name === 'Maniac') need += tcBB >= 40 ? 0.03 : 0.06;
        if (tcBB >= 25 && H.preRaises >= 2) need *= 0.8; // déjà un 3-bet et un tapis : il faut le haut du haut
        var inFront = Object.keys(H.inHand).filter(function (k) { k = +k; return k !== i && !H.folded[k] && H.bets[k] > 0 && (H.allin[k] || H.bets[k] >= L.bb * 8); }).length;
        if (inFront >= 2) need *= inFront >= 3 ? 0.3 : 0.45; // deux tapis devant : quelqu'un a souvent une très grosse main, on ne paie qu'avec le haut du haut
        if (G.opts.bounty !== 'classique' && H.opener !== null && G.players[H.opener] && G.players[H.opener].bounty > 0 && p.stack >= G.players[H.opener].stack) need += 0.07;
        if (bubble && rem > 2) need *= 0.6; return hp < need + (price < 0.35 ? 0.05 : 0) ? ['call'] : ['fold']; }
      // chapitres 11, 14 et 15 : squeeze, 3-bet light des positions tardives, « 3-bet ou couche » en petite blinde, moins de cold calls
      var callers = 0; if (H.preRaises === 1) Object.keys(H.inHand).forEach(function (k) { k = +k; if (k !== i && k !== H.opener && !H.folded[k] && H.bets[k] === H.cur) callers++; });
      var opPos = H.opener !== null && H.opener !== undefined ? H.pos[H.opener] : null, lateOp = opPos === 'CO' || opPos === 'BTN' || opPos === 'SB' || opPos === 'HJ';
      var lightOK = H.preRaises === 1 && !hu && (P.light || 0) > 0 && effBB >= 20 && LIGHT[code] && (pos === 'BTN' || pos === 'SB' || pos === 'BB' || (pos === 'CO' && opPos === 'HJ')) && (lateOp || LIGHT[code] === 2);
      if (callers > 0) threeP *= 1.3; // squeeze de valeur : argent mort
      // blinde contre blinde : la grosse blinde sur-relance large contre l'ouverture de la petite blinde
      var bvb = H.preRaises === 1 && opPos === 'SB' && i === H.bbSeat && !hu;
      if (bvb) { threeP *= 1.9 + P.agg * 0.6; if (P.light) lightOK = lightOK || (LIGHT[code] && effBB >= 20); }
      // la petite blinde a ouvert et la grosse blinde la 3-bet : elle répond avec la range « blinde contre blinde » de son profil
      if (H.preRaises === 2 && i === H.opener && pos === 'SB' && H.pfa === H.bbSeat && effBB >= 40 && !hu) {
        var bmap = { nit: 'nit', surv: 'nit', reg: 'tag', lag: 'lag', maniac: 'lag', lp: 'equilibre', station: 'equilibre', fan: 'equilibre' }, bk = 'tag';
        Object.keys(OPP).forEach(function (k) { if (OPP[k] === P) bk = bmap[k] || 'tag'; });
        var bact = PA.chart(bk, { type: 'vs3bet', scen: 'bvb', bb: 100 })[code];
        if (bact === 'fourbet' || bact === 'allin') { var t4 = H.cur * ST(P).four; if (t4 > (p.stack + H.bets[i]) * 0.4) t4 = p.stack + H.bets[i]; return ['raise', Math.round(t4)]; }
        if (bact === 'call' || (P.sticky >= 0.6 && hp < 0.35 && Math.random() < P.sticky * 0.5)) return ['call'];
        return ['fold'];
      }
      if (pos === 'SB' && !P.limp && P.sticky < 0.6) callP *= 0.25; // petite blinde : 3-bet ou couche
      else if (pos !== 'BTN' && pos !== 'BB' && pos !== 'SB' && P.sticky < 0.6) callP *= 0.6; // cold call rare hors du bouton
      if (bubble && P.surv) lightOK = false;
      var light = lightOK && Math.random() < P.light * (callers > 0 ? 1.15 : 1);
      if (hp < threeP || light) {
        if (H.preRaises >= 3 && hp > 0.02) return hp < callP * 0.3 ? ['call'] : (tc === 0 ? ['check'] : ['fold']); // 5-bet : seulement les monstres
        var to = H.preRaises >= 2 ? H.cur * ST(P).four : (H.cur * (pos === 'BTN' || pos === 'CO' ? ST(P).three[0] : ST(P).three[1]) + callers * H.cur + (i === H.bbSeat || pos === 'SB' ? L.bb : 0));
        if (effBB <= 30 && H.preRaises === 1) to = p.stack + H.bets[i]; // 20-30 BB : 3-bet et squeeze à tapis
        if (to > (p.stack + H.bets[i]) * 0.4) to = p.stack + H.bets[i]; return ['raise', Math.round(to)];
      }
      if (hp < callP) return ['call'];
      return tc === 0 ? ['check'] : ['fold'];
    }
    // après le flop
    var opp = activeCount() - 1, eq = equity(H.hole[i], H.board, Math.max(1, opp), 180);
    var spr = p.stack / Math.max(1, pot);
    if (tc > 0) {
      var po = tc / (pot + tc), sr = H.sRaises || 0, big = tc > (pot - tc) * 0.8, multi = opp >= 2;
      var betR = Math.min(1.5, tc / Math.max(1, pot - tc)); eq = eq - 0.1 - 0.12 * betR - (sr ? 0.08 : 0) + P.sticky * 0.06; // range de mise adverse plus forte qu'une main au hasard
      // une relance au plus par tour, une sur-relance seulement avec une main énorme
      if (sr <= 1 && eq > (sr ? 0.8 : 0.68) && Math.random() < P.agg * (sr ? 0.5 : 1)) return ['raise', Math.min(p.stack + H.bets[i], Math.round(H.cur * raiseMult(P)))];
      if (spr < 0.6 && eq > 0.3) return ['call'];
      var stick = P.sticky * (multi ? 0.08 : 0.15) * (big ? 0.5 : 1) * (sr ? 0.5 : 1);
      if (eq + stick > po + (big ? 0.07 : 0.03) + (sr ? 0.06 : 0)) return ['call'];
      if (sr === 0 && Math.random() < P.bluff * 0.2 && tc < pot * 0.4 && !multi) return ['raise', Math.min(p.stack + H.bets[i], Math.round(H.cur * raiseMult(P)))];
      return ['fold'];
    }
    var Z = { bet: [ST(P).dry || 0.33, ST(P).wet || 0.66] }, betFrac = postSize(P, eq, pot, eq > 0.75);
    var size = Math.max(L.bb, Math.round(pot * betFrac));
    if (eq > 0.62 && Math.random() < 0.35 + P.agg * 0.6) return size >= p.stack * 0.8 ? ['raise', p.stack + H.bets[i]] : ['raise', size];
    var isAggressor = H.lastAggressor === i;
    // chapitre 26 : après un tour checké, le relanceur fait son c-bet retardé, l’autre sonde
    if (opp === 1 && H.street >= 2 && H.prevChecked) {
      var pfaMe = H.pfa === i, firstToAct = Object.keys(H.acted).length === 0;
      if (pfaMe && !firstToAct && Math.random() < 0.25 + P.agg * 0.45) return ['raise', Math.min(p.stack, Math.max(L.bb, Math.round(pot * Z.bet[0] * 1.2)))];
      if (!pfaMe && firstToAct && (eq > 0.45 || Math.random() < P.agg * 0.4)) return ['raise', Math.min(p.stack, Math.max(L.bb, Math.round(pot * Z.bet[1])))];
    }
    if (Math.random() < P.bluff * (opp === 1 ? 1.6 : 0.6) * (isAggressor ? 1.6 : 1)) return ['raise', Math.min(p.stack, size)];
    return ['check'];
  }

  /* ---------- Boucle ---------- */
  function loop() {
    var H = G.hand;
    if (H.done) return;
    if (activeCount() <= 1) { awardUncontested(); return; }
    if (roundDone()) {
      if (canActCount() <= 1 && activeCount() > 1) {
        // tout le monde à tapis : on déroule
        if (H.street < 3) { nextStreet(); return setTimeout(loop, 500); }
        return showdown();
      }
      if (H.street === 3) return showdown();
      nextStreet(); U().render();
      return setTimeout(loop, 450);
    }
    var i = H.toAct;
    if (i < 0) { if (H.street === 3) return showdown(); nextStreet(); return setTimeout(loop, 300); }
    if (i === 0) { G.busy = false; if (G.opts.coach) coachBefore(); U().render(); return; }
    G.busy = true; U().render();
    var HH = H;
    setTimeout(function () {
      if (!G || G.hand !== HH || HH.done || HH.toAct !== i) return;
      var d = botDecide(i);
      if (d[0] === 'raise' && !canRaise(i)) d = ['call'];
      if (d[0] === 'raise') {
        var minTo = H.cur + H.lastRaise, maxTo = G.players[i].stack + H.bets[i];
        var to = Math.max(minTo, d[1]); if (to >= maxTo || maxTo - to < H.L.bb) to = maxTo;
        if (to <= H.cur) d = ['call']; else { act(i, 'raise', to); H.lastAggressor = i; }
      }
      if (d[0] === 'call') { if (toCall(i) === 0) act(i, 'check'); else act(i, 'call'); }
      else if (d[0] === 'check') { if (toCall(i) > 0) act(i, 'fold'); else act(i, 'check'); }
      else if (d[0] === 'fold') { if (toCall(i) === 0) act(i, 'check'); else act(i, 'fold'); }
      H.toAct = nextIn(i);
      loop();
    }, 380);
  }

  /* ---------- Coach ---------- */
  // à l'approche des places payées, Yo juge avec la range « bulle » correspondant à ton tapis
  function atBubble() { var rem = remaining(), paid = paidPlaces(); return rem > paid && rem <= paid + (G.opts.mtt ? 4 : 1) && G.opts.format !== 'hu'; }
  function heroStackKind() {
    var me = G.players[0], L = G.hand.L, tot = (G.players.length + (G.field ? G.field.length : 0)) * G.opts.chips, avg = tot / Math.max(1, remaining());
    var mine = me.stack + (G.hand.bets[0] || 0);
    if (mine / L.bb < 15) return 'court';
    return mine >= avg * 1.4 ? 'gros' : 'moyen';
  }
  function heroSit() {
    var r = heroSit0();
    if (r && atBubble()) r.sit.bubble = heroStackKind();
    return r;
  }
  function heroSit0() {
    // traduit la situation préflop du héros vers une situation de « Ma range »
    var H = G.hand, L = H.L, pos = H.pos[0], code = handCode(H.hole[0][0], H.hole[0][1]);
    var eff = (G.players[0].stack + H.bets[0]) / L.bb;
    if (H.street !== 0) return null;
    var map9 = { UTG: 'UTG', 'UTG+1': 'UTG+1', 'UTG+2': 'UTG+1', MP: 'MP', LJ: 'LJ', HJ: 'HJ', CO: 'CO', BTN: 'BTN', SB: 'SB', BB: 'BB' };
    var p = map9[pos];
    // heads-up : le bouton est la petite blinde ; tables tapis ou fold exactes sous 15 BB, pas de range à 9 au-dessus
    if (H.order.length === 2) {
      if (eff > 15) return null;
      map9 = { BTN: 'SB', BB: 'BB' }; p = map9[pos];
    }
    if (H.preRaises === 0 && H.limpers === 0 && p !== 'BB') return { sit: { type: 'open', pos: p, bb: eff > 40 ? 100 : (eff >= 20 ? 30 : eff) }, hand: code };
    // un seul limper devant toi (chapitre 8) : isoler, sur-limper ou se coucher ; iso-tapis entre 12 et 20 BB
    if (H.preRaises === 0 && H.limpers === 1 && H.order.length > 2 && eff >= 12) {
      var lk = Object.keys(H.inHand).map(Number).filter(function (k) { return k !== 0 && k !== H.sb && k !== H.bbSeat && !H.folded[k] && H.bets[k] >= L.bb; })[0];
      if (lk !== undefined && map9[H.pos[lk]] && map9[H.pos[lk]] !== 'SB') return { sit: { type: 'iso', pos: p, opener: map9[H.pos[lk]], bb: eff > 20 ? 100 : 18 }, hand: code };
    }
    if (H.preRaises === 1 && H.opener !== null) {
      var op = map9[H.pos[H.opener]], others = 0;
      Object.keys(H.inHand).forEach(function (k) { k = +k; if (k !== 0 && k !== H.opener && !H.folded[k] && H.bets[k] > 0 && k !== H.sb && k !== H.bbSeat) others++; });
      // une ouverture et un seul payeur devant toi (chapitre 14) : squeeze, payer ou se coucher
      if (H.limpers === 0 && others === 1 && eff >= 20 && H.order.length > 2 && G.players[H.opener].stack > 0) {
        var ck = Object.keys(H.inHand).map(Number).filter(function (k) { return k !== 0 && k !== H.opener && !H.folded[k] && H.bets[k] > 0 && k !== H.sb && k !== H.bbSeat; })[0];
        if (ck !== undefined && G.players[ck].stack > 0 && map9[H.pos[ck]] && PA.POS.indexOf(map9[H.pos[ck]]) < PA.POS.indexOf(p)) return { sit: { type: 'squeeze', pos: p, opener: op, caller: map9[H.pos[ck]], bb: eff > 30 ? 100 : 25 }, hand: code };
      }
      if (H.limpers > 0 || others > 0) return null;
      var tc = toCall(0), shove = G.players[H.opener].stack === 0;
      if (shove && (p === 'BB' || p === 'SB' || p === 'BTN')) {
        var key = p + ' vs shove ' + op, d = PA.nearestPush(Math.min(15, eff));
        if ((PA.D.pushfold[String(d)].call[key])) return { sit: { type: 'callshove', pos: p, opener: op, bb: d }, hand: code };
        return null;
      }
      if (PA.POS.indexOf(op) < PA.POS.indexOf(p) && !shove) {
        // défense des blindes sous 40 BB : pas de range au club pour le moment, Yo ne juge pas ce coup
        if ((p === 'BB' || p === 'SB') && eff < 40) return null;
        var ds = { type: 'def', pos: p, opener: op, bb: eff > 40 ? 100 : (eff > 30 ? Math.round(eff) : 30) };
        if (p === 'BB') {
          // défense de grosse blinde : selon le profil de l'ouvreur, la taille de sa relance, et ton tapis sous 20 BB
          var ok = OPP[G.players[H.opener].prof] ? OPP[G.players[H.opener].prof].key : 'reg', xs = H.bets[H.opener] / L.bb;
          var vp = ok === 'nit' || ok === 'surv' ? 'serre' : (ok === 'maniac' ? 'mani' : (ok === 'lag' || ok === 'fan' ? 'large' : 'std'));
          if (vp !== 'std') ds.vp = vp; if (xs <= 2.2) ds.sz = 2; else if (xs > 2.75) ds.sz = 3;
        }
        return { sit: ds, hand: code };
      }
    }
    // tu as ouvert et un seul joueur te 3-bet (tapis profonds) : les quatre cas de « Face à un 3-bet »
    if (H.preRaises === 2 && H.opener === 0 && H.pfa !== 0 && H.pfa !== null && eff >= 40 && H.order.length > 2) {
      var tb = map9[H.pos[H.pfa]], live3 = 0;
      Object.keys(H.inHand).forEach(function (k) { k = +k; if (k !== 0 && k !== H.pfa && !H.folded[k] && H.bets[k] > 0 && H.bets[k] >= H.L.bb * 2) live3++; });
      if (live3 > 0 || G.players[H.pfa].stack === 0) return null;
      var sc = p === 'SB' && tb === 'BB' ? 'bvb' : (['UTG', 'UTG+1', 'MP'].indexOf(p) >= 0 ? 'early' : (p === 'BTN' && (tb === 'SB' || tb === 'BB') ? 'ip' : (PA.POS.indexOf(tb) > PA.POS.indexOf(p) ? 'oop' : null)));
      if (sc) return { sit: { type: 'vs3bet', scen: sc, pos: p, opener: tb, bb: 100 }, hand: code };
    }
    return null;
  }
  // défense de grosse blinde : pourquoi la range change face à cet ouvreur
  function bbWhy(s) {
    if (!s || s.type !== 'def' || s.pos !== 'BB') return '';
    var t = [];
    if (s.vp) t.push({ serre: 'un ouvreur serré (mains fortes, tu défends moins)', large: 'un ouvreur large (tu défends plus)', mani: 'un maniaque (tu défends très large)' }[s.vp]);
    if (s.sz === 2) t.push('une petite relance (bonne cote)'); else if (s.sz === 3) t.push('une grosse relance (moins bonne cote)');
    if (PA.depthKey(s.bb) === 'push') t.push('un tapis sous 20 BB (tapis, payer ou jeter)');
    return t.length ? ' <span class="muted">Ta range de grosse blinde tient compte de : ' + t.join(', ') + '.</span>' : '';
  }
  // lire une mise selon le profil de celui qui la fait
  function readBet(pl, tc, potBefore, street) {
    var P = OPP[pl.prof], k = P.key, f = tc / Math.max(1, potBefore), big = f >= 0.9, small = f <= 0.4, nm = '<b>' + U().esc(pl.name) + '</b> (' + P.short + ')', riv = street === 3;
    if (k === 'nit' || k === 'surv') return big ? nm + ' mise gros' + (riv ? ' à la river' : '') + ' : chez lui, c’est presque toujours une très grosse main. Couche-toi sans regret avec une main moyenne.' : nm + ' bluffe très peu : même une petite mise montre une vraie main.';
    if (k === 'station' || k === 'lp') return small ? nm + ' mise petit : souvent une paire moyenne ou un tirage. Paie largement, relance tes bonnes mains : il paiera.' : nm + ' mise rarement gros : une grosse mise de sa part est sérieuse.';
    if (k === 'maniac') return nm + ' mise énorme et souvent en bluff : paie plus large que d’habitude avec tes mains moyennes, ne bluffe pas contre lui.';
    if (k === 'lag') return nm + (big ? ' fait une grosse mise : chez lui, autant de bluffs que de valeur. Défends avec tes paires correctes et tes bons tirages.' : ' met la pression avec des mains larges : ne te couche pas trop vite.');
    if (k === 'fan') return nm + ' mise au hasard : la taille ne veut rien dire, juge surtout ta main et la cote.';
    return nm + ' a des tailles cohérentes' + (big ? ' : une grosse mise montre une range forte (valeur et quelques bluffs).' : ' : petite mise = range large sur tableau sec.');
  }
  function coachBefore() {
    var H = G.hand;
    if (H.street === 0) { G.coachMsg = null; return; }
    var opp = activeCount() - 1, eq = equity(H.hole[0], H.board, Math.max(1, opp), 500), tc = toCall(0), pot = potTotal();
    var msg = 'Ta main : <b>' + catName(evalHand(H.hole[0].concat(H.board))) + '</b>. Équité estimée contre ' + opp + ' main' + (opp > 1 ? 's' : '') + ' au hasard : <b>' + Math.round(eq * 100) + ' %</b>.';
    if (tc > 0) { var need = tc / (pot + tc); msg += ' Pour payer ' + PA.fmt(tc) + ', il te faut <b>' + Math.round(need * 100) + ' %</b> (paye ÷ pot après ta paye). Attention : contre une relance, la range adverse est plus forte qu’une main au hasard.';
      var ag = H.lastAggressor; if (ag !== null && ag !== undefined && ag !== 0 && G.players[ag]) { var rd = readBet(G.players[ag], tc, pot - tc, H.street); if (rd) msg += '<br>🔎 ' + rd; } }
    else msg += ' SPR : ' + String(Math.round(G.players[0].stack / Math.max(1, pot) * 10) / 10).replace('.', ',') + ' (tapis ÷ pot).';
    G.coachMsg = msg;
  }
  function judgeHeroPre(type) {
    var hs = heroSit(); if (!hs) return null;
    var prof = PA.player().profile || 'tag';
    var given = { fold: 'fold', check: 'fold', call: 'call', raise: 'raise', allin: 'allin' }[type];
    if (hs.sit.type === 'open' && given === 'call') given = 'limp';
    if (hs.sit.type === 'vs3bet' && given === 'raise') given = 'fourbet';
    if (hs.sit.type === 'iso' && hs.sit.pos === 'BB' && type === 'check') given = 'call'; // checker en grosse blinde
    var q = { sit: hs.sit, hand: hs.hand, answer: PA.actionFor(prof, hs.sit, hs.hand) };
    var j = PA.judge(prof, q, given);
    return { q: q, given: given, j: j };
  }


  /* ---------- Après le flop : comparaison avec le solveur (pots à deux joueurs, au flop) ----------
     La main est rapprochée d'une des situations calculées (ouverture + paye, pot 3-bet, blinde contre blinde, limp-isolement),
     le flop du flop calculé le plus ressemblant, ta mise de la taille calculée la plus proche (1/3, 1/2, 3/4 du pot, 1,25 pot, tapis). */
  var PCLS = { UTG: 'utg', 'UTG+1': 'utg', 'UTG+2': 'utg', MP: 'utg', LJ: 'hj', HJ: 'hj', CO: 'co', BTN: 'btn', SB: 'sb', BB: 'bb' };
  var PFORDER = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'LJ', 'HJ', 'CO', 'BTN'];
  function cStr(c) { return RCH[cRank(c)] + 'cdhs'[cSuit(c)]; }
  function solSpotFor(H) {
    var D = window.PA_SOLVER && window.PA_SOLVER.data(); if (!D) return null;
    var live = Object.keys(H.inHand).map(Number).filter(function (k) { return !H.folded[k]; });
    if (live.length !== 2 || live.indexOf(0) < 0 || H.order.length < 3) return null;
    var v = live[0] === 0 ? live[1] : live[0], ph = H.pos[0], pv = H.pos[v], ch = PCLS[ph], cv = PCLS[pv]; if (!ch || !cv) return null;
    var cls = function (k) { return PCLS[H.pos[k]]; }, id = null, approx = false;
    if (H.preRaises === 1 && H.limpers === 0) {
      var o = H.opener, c = o === 0 ? v : 0, oc = cls(o), cc = cls(c);
      if ((cc === 'bb' || (cc === 'sb' && oc !== 'bb')) && oc !== 'bb') { id = (oc === 'sb' ? 'sb' : oc) + '-bb'; if (cc === 'sb') approx = true; } // la petite blinde qui paie : comme la grosse blinde
      else if ((cc === 'btn' || cc === 'co' || cc === 'hj') && PFORDER.indexOf(H.pos[c]) > PFORDER.indexOf(H.pos[o]) && oc !== 'sb' && oc !== 'bb') id = oc === 'co' ? 'co-btn' : 'hj-btn';
    } else if (H.preRaises === 1 && H.limpers === 1 && H.pfa !== null) {
      var iso = H.pfa, lim = iso === 0 ? v : 0;
      if (PFORDER.indexOf(H.pos[iso]) > PFORDER.indexOf(H.pos[lim]) && cls(lim) !== 'sb' && cls(lim) !== 'bb') id = 'limp-iso';
    } else if (H.preRaises === 0 && H.limpers === 1 && ((ch === 'sb' && cv === 'bb') || (ch === 'bb' && cv === 'sb'))) id = 'sb-limp';
    else if (H.preRaises === 2 && H.opener !== null && H.pfa !== null && H.pfa !== H.opener && live.indexOf(H.opener) >= 0 && live.indexOf(H.pfa) >= 0) {
      var tb = cls(H.pfa), op = cls(H.opener);
      if (tb === 'bb' && (op === 'btn' || op === 'co' || op === 'hj')) id = 'bb3b-btn';
      else if (tb === 'sb' && op !== 'bb') id = op === 'btn' ? 'sb3b-btn' : 'sb3b-co';
      else if (tb === 'btn') id = op === 'co' ? 'btn3b-co' : 'btn3b-hj';
      else if (tb === 'co' && (op === 'hj' || op === 'utg')) id = 'btn3b-hj';
    }
    if (!id) return null;
    var has = function (x) { return D.spots.some(function (s) { return s.id === x; }); };
    var eff = Math.min(G.players[0].stack + H.bets[0], G.players[v].stack + H.bets[v]) / H.L.bb;
    if (id === 'btn-bb' && eff <= 21 && has('btn-bb-20')) id = 'btn-bb-20';
    else if (id === 'btn-bb' && eff >= 50 && has('btn-bb-60')) id = 'btn-bb-60';
    else if (eff <= 30 && has(id + '-25')) id = id + '-25';
    var pr = PA.player().profile || 'tag';
    if ((pr === 'nit' || pr === 'lag') && has(id + '-' + pr)) id = id + '-' + pr;
    var sp = D.spots.filter(function (s) { return s.id === id; })[0]; if (!sp) return null;
    var heroOOP = PFORDER.indexOf(ph) < PFORDER.indexOf(pv);
    return { id: id, sp: sp, side: heroOOP ? 'oop' : 'ip', v: v, approx: approx || (H.preRaises === 2 && H.limpers > 0) };
  }
  var BTOK = [['b33', 0.33], ['b50', 0.5], ['b75', 0.75], ['b125', 1.25]];
  function tokFor(rec, nodes, prefix, isHero, heroType, heroAmt) {
    var type = isHero ? heroType : rec.type, tc = isHero ? toCall(0) : rec.toCall, pot = isHero ? potTotal() : rec.pot;
    var key = function (t) { return (prefix ? prefix + '-' : '') + t; };
    if (type === 'fold') return tc > 0 ? 'f' : 'x';
    if (type === 'check' || (type === 'call' && tc === 0)) return 'x';
    if (type === 'call') return 'c';
    var allin = isHero ? (heroType === 'allin' || heroAmt >= G.players[0].stack + G.hand.bets[0]) : rec.allin;
    if (tc > 0) return allin && nodes[key('ai')] ? 'ai' : (nodes[key('r')] ? 'r' : 'ai');
    if (allin && nodes[key('ai')]) return 'ai';
    var amt = isHero ? heroAmt : rec.amount, frac = amt / Math.max(1, pot), best = null, bd = 9;
    BTOK.forEach(function (b) { if (nodes[key(b[0])] && Math.abs(b[1] - frac) < bd) { bd = Math.abs(b[1] - frac); best = b[0]; } });
    return best || (nodes[key('ai')] ? 'ai' : null);
  }
  function aCls(a) { return a === 'x' || a === 'c' || a === 'f' ? a : 'agg'; }
  function solverCheck(type, amt, coteTxt) {
    var H = G.hand; if (!H || H.street !== 1 || !window.PA_SOLVER || !window.PA_APF || !window.PA_APF.nearest) return;
    if (!window.PA_SOLVER.data()) { window.PA_SOLVER.loadData(function () {}); return; } // premier passage : on charge les données pour les coups suivants
    var M = solSpotFor(H); if (!M) return;
    var flop = H.board.slice(0, 3).map(cStr), hole = H.hole[0].map(cStr), hand0 = G.handNo;
    var map = window.PA_APF.nearest(M.sp, flop), combo = window.PA_APF.transpose(map, hole).join('');
    if (type === 'allin') amt = G.players[0].stack + H.bets[0];
    var recs = H.actions.filter(function (r) { return r.street === 1; }), snap = { pot: potTotal(), tc: toCall(0) };
    // le chemin des actions déjà jouées au flop, puis ton action
    window.PA_SOLVER.query(M.id, map.flop, '', combo, function (r0) {
      if (!r0 || !r0.nodes) return;
      var nodes = r0.nodes, path = '', ok = true;
      recs.forEach(function (rec) { if (!ok) return; var t = tokFor(rec, nodes, path, false); if (!t) { ok = false; return; } path = path ? path + '-' + t : t; if (!nodes[path]) ok = false; });
      if (!ok || nodes[path] === undefined) return;
      var hT = (function () { var tcH = snap.tc, potH = snap.pot, key = function (t) { return (path ? path + '-' : '') + t; };
        if (type === 'fold') return tcH > 0 ? 'f' : 'x'; if (type === 'check' || (type === 'call' && tcH === 0)) return 'x'; if (type === 'call') return 'c';
        var allin = type === 'allin' || amt >= G.players[0].stack + (G.hand.bets[0] || 0);
        if (tcH > 0) return allin && nodes[key('ai')] ? 'ai' : (nodes[key('r')] ? 'r' : 'ai');
        var fr = amt / Math.max(1, potH), b = null, bd = 9; BTOK.forEach(function (x) { if (nodes[key(x[0])] && Math.abs(x[1] - fr) < bd) { bd = Math.abs(x[1] - fr); b = x[0]; } });
        return b || 'ai'; })();
      window.PA_SOLVER.query(M.id, map.flop, path, combo, function (r) {
        if (!r) return; var row = r.p || r.mix; if (!row) return;
        var L = r.a.map(function (a, k) { return [a, row[k]]; }).sort(function (x, y) { return y[1] - x[1]; });
        var fCls = 0, fTok = 0; L.forEach(function (x) { if (aCls(x[0]) === aCls(hT)) fCls += x[1]; if (x[0] === hT) fTok += x[1]; });
        var verdict = fCls >= 0.3 ? 'ok' : fCls >= 0.1 ? 'mix' : 'bad';
        G.stats.sol.n++; G.stats.sol[verdict]++;
        try {
          var plx = PA.player(); PA.updateNotion(plx, 'postflop', 1350, verdict === 'ok' ? 1 : verdict === 'mix' ? 0.5 : 0);
          if (verdict === 'bad' && r.p && r.i >= 0) { // l'écart revient dans « Après le flop › coups à revoir »
            var LM = plx.solverMiss = plx.solverMiss || [], km = [M.id, map.flop, path, '', '', r.combo].join('|');
            if (!LM.some(function (x) { return x.key === km; })) { LM.unshift({ key: km, spot: M.id, flop: map.flop, path: path, tl: null, rv: null, i: r.i, hand: r.combo, at: Date.now(), from: 'partie' }); if (LM.length > 60) LM.length = 60; }
          }
          PA.save();
        } catch (e) {}
        var AN = window.PA_APF.actName, top = L.filter(function (x) { return x[1] >= 0.05; }).slice(0, 3);
        var solTxt = top.map(function (x) { return AN(x[0]).toLowerCase() + ' ' + Math.round(x[1] * 100) + ' %'; }).join(', ');
        var bestAgg = L.filter(function (x) { return aCls(x[0]) === 'agg' && x[0] !== hT; })[0], sizeTip = aCls(hT) === 'agg' && verdict === 'ok' && fTok < 0.1 && bestAgg && bestAgg[1] >= 0.15 ? ' Bonne idée de miser, mais pas cette taille : le solveur préfère « ' + AN(bestAgg[0]).toLowerCase() + ' ».' : '';
        var msg = '🧮 <b>Solveur</b> (' + M.sp.name.toLowerCase() + (M.approx ? ', situation proche' : '') + (map.exact ? '' : ', flop proche') + ') : tu as joué « ' + AN(hT).toLowerCase() + ' ». Le solveur : ' + solTxt + '.' + (verdict === 'ok' ? ' ✔ Conforme.' + sizeTip : verdict === 'mix' ? ' Jouable, mais ce n’est pas son choix principal.' : ' Écart : il ne joue presque jamais ça ici.') + (!r.p ? ' (Ta main n’est pas dans sa range ici : comparaison avec les mains de la même famille, « ' + (r.cat || '').toLowerCase() + ' ».)' : '');
        if (verdict !== 'ok' || sizeTip) G.stats.postNotes.push({ kind: 'sol', verdict: verdict === 'ok' ? 'size' : verdict, hand: hand0, cards: H.hole[0].slice(), board: H.board.slice(0, 3), spot: M.id, spotName: M.sp.name, side: M.side, pos: M.side === 'ip' ? M.sp.ip : M.sp.oop, flop: flop, hole: hole, given: AN(hT), sol: solTxt, cat: r.cat || '', exact: map.exact, d25: /-25$/.test(M.id) });
        if (G.opts.coach && G.hand && G.handNo === hand0) { G.coachMsg = (coteTxt ? coteTxt + '<br>' : '') + msg; if (!G.busy) U().render(); }
      });
    });
  }

  /* ---------- Actions du héros ---------- */
  function heroAct(type, amt) {
    var H = G.hand; if (!H || H.toAct !== 0 || H.done) return;
    if (H.street === 0) {
      var willAll = type === 'allin' || (type === 'raise' && amt >= G.players[0].stack + H.bets[0]);
      var r = judgeHeroPre(willAll ? 'allin' : type);
      if (r) {
        G.stats.pre.n++; if (r.j.ok) G.stats.pre.ok++; else if (r.j.kind === 'style') G.stats.pre.style++; else G.stats.pre.err++;
        var ph = H.phase || 'Début et milieu'; G.stats.phase[ph] = G.stats.phase[ph] || { n: 0, ok: 0 }; G.stats.phase[ph].n++; if (r.j.ok) G.stats.phase[ph].ok++;
        var pl = PA.player(); PA.updateNotion(pl, PA.notionOf(r.q.sit), 1350, r.j.ok ? 1 : (r.j.kind === 'style' ? 0.5 : 0)); if (!r.j.ok) PA.srsMiss(pl, PA.sitKey(r.q.sit) + '#' + r.q.hand, { sit: r.q.sit, hand: r.q.hand }); PA.save();
        if (!r.j.ok) G.stats.notes.push({ hand: G.handNo, code: r.q.hand, cards: H.hole[0].slice(), sit: r.q.sit, given: r.given, answer: r.q.answer, kind: r.j.kind, note: r.j.note || '', profs: r.j.profiles || null, lvl: H.L.sb + '/' + H.L.bb, bb: Math.round((G.players[0].stack + H.bets[0]) / H.L.bb) });
        if (G.opts.coach) G.coachMsg = (r.q.sit.bubble ? '🫧 <b>Bulle, ' + PA.BUBBLE_NAME[r.q.sit.bubble] + '</b> : ' : '') + (r.j.ok ? 'Bonne décision préflop.' : (r.j.kind === 'style' ? 'Écart de style : ton profil jouerait plutôt' : 'Erreur : ici ton profil joue') + ' « ' + U().actName(r.q.answer, r.q.sit) + ' ».' + (r.j.note ? ' ' + r.j.note : '') + bbWhy(r.q.sit));
      } else if (G.opts.coach) G.coachMsg = null;
    } else {
      var tc = toCall(0), pot = potTotal(), opp0 = Math.max(1, activeCount() - 1), eq = equity(H.hole[0], H.board, opp0, 400), need = tc > 0 ? tc / (pot + tc) : 0;
      G.stats.post.n++;
      var good = true, txt = '', ctype = null;
      if (type === 'fold' && tc > 0 && eq > need + 0.15) { good = false; ctype = 'fold'; txt = 'Couché avec ' + Math.round(eq * 100) + ' % d’équité alors qu’il en fallait ' + Math.round(need * 100) + ' % : à revoir (sauf lecture précise de l’adversaire).'; }
      else if (type === 'call' && tc > 0 && eq < need - 0.12) { good = false; ctype = 'call'; txt = 'Payé avec ' + Math.round(eq * 100) + ' % d’équité pour ' + Math.round(need * 100) + ' % nécessaires : la cote n’y est pas.'; }
      if (good) G.stats.post.ok++;
      else G.stats.postNotes.push({ kind: 'cote', hand: G.handNo, cards: H.hole[0].slice(), board: H.board.slice(), street: H.street, given: ctype, eq: eq, need: need, tc: tc, pot: pot, opp: opp0, bb: H.L.bb, txt: txt });
      if (G.opts.coach) G.coachMsg = txt || null;
      solverCheck(type, amt, txt);
    }
    if (type === 'fold') act(0, toCall(0) === 0 ? 'check' : 'fold');
    else if (type === 'check') act(0, 'check');
    else if (type === 'call' || !canRaise(0)) act(0, toCall(0) === 0 ? 'check' : 'call');
    else {
      var maxTo = G.players[0].stack + H.bets[0], minTo = H.cur + H.lastRaise;
      var to = type === 'allin' ? maxTo : Math.max(minTo, Math.round(amt)); if (to >= maxTo) to = maxTo;
      if (to <= H.cur) act(0, 'call'); else { act(0, 'raise', to); H.lastAggressor = 0; }
    }
    H.toAct = nextIn(0);
    loop();
  }


  /* ---------- Les parties comptent dans ta progression ----------
     Chaque main jouée part dans Analyser (marquée « appli ») ; chaque partie est gardée dans « Mes tournois d'entraînement ». */
  var HHBUF = [];
  function fname0(o) { return ({ sng: 'Sit & Go ' + o.seats + ' joueurs', sng9: 'Sit & Go 9 joueurs', sng6: 'Sit & Go 6 joueurs', hu: 'Heads-up', mtt: 'Tournoi 100 joueurs', moments: 'Moments clés' }[o.format] || 'Partie') + (o.bounty && o.bounty !== 'classique' ? ' ' + (o.bounty === 'pko' ? 'PKO' : 'Space KO') : ''); }
  function dstr(t) { var d = new Date(t), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }
  function recordHH(H) {
    var nm = {}, used = {};
    H.order.forEach(function (i) { var x = i === 0 ? 'Toi' : (G.players[i].name || 'Joueur'); if (used[x]) x += ' ' + (i + 1); used[x] = 1; nm[i] = x; });
    var ST = ['pre', 'flop', 'turn', 'river'], acts = [];
    acts.push({ s: 'pre', p: nm[H.sb], a: 'sb', to: Math.min(H.L.sb, H.st0[H.sb]), blind: true });
    acts.push({ s: 'pre', p: nm[H.bbSeat], a: 'bb', to: Math.min(H.L.bb, Math.max(0, H.st0[H.bbSeat] - (H.L.ante || 0))), blind: true });
    H.actions.forEach(function (r) {
      var a = { s: ST[r.street], p: nm[r.seat], a: r.type, amt: 0, allin: !!r.allin };
      if (r.type === 'call') a.amt = r.amount;
      else if (r.type === 'raise') { if (r.street > 0 && r.toCall === 0 && !(r.street > 0 && acts.some(function (x) { return x.s === a.s && (x.a === 'bet' || x.a === 'raise'); }))) { a.a = 'bet'; a.amt = r.amount; } else a.to = r.amount; }
      acts.push(a);
    });
    var board = H.board.map(cStr), shown = {}, end = {};
    if (H.showdown) H.order.forEach(function (i) { if (!H.folded[i]) shown[nm[i]] = H.hole[i].map(cStr).join(' '); });
    H.order.forEach(function (i) { end[nm[i]] = G.players[i].stack; });
    var o = { id: 'app-' + G.id + '-' + G.handNo, date: dstr(H.ts || Date.now()), tour: 'Entraînement · ' + fname0(G.opts), tid: 'app-' + G.id, level: H.L.n, ante: H.L.ante || 0, sb: H.L.sb, bb: H.L.bb, bounty: G.opts.bounty !== 'classique',
      seats: H.order.map(function (i) { return { seat: i + 1, name: nm[i], stack: H.st0[i] }; }), btn: H.order.length === 2 ? H.sb + 1 : G.button + 1, hero: 'Toi', c1: cStr(H.hole[0][0]), c2: cStr(H.hole[0][1]),
      acts: acts, board: board, sd: !!H.showdown, shown: shown, end: end, invest: {}, max: G.opts.seats };
    if (H.L.ante) o.invest[nm[H.bbSeat]] = Math.min(H.L.ante, H.st0[H.bbSeat]);
    HHBUF.push(o); if (HHBUF.length >= 8) flushHH();
  }
  function flushHH() { if (!HHBUF.length || !window.PA_HH || !window.PA_HH.addAppHands) return; var L = HHBUF; HHBUF = []; try { window.PA_HH.addAppHands(L); } catch (e) {} }
  window.addEventListener('pagehide', flushHH); document.addEventListener('visibilitychange', function () { if (document.hidden) flushHH(); });
  function entrants() { return G.opts.mtt ? MTT_FIELD : G.opts.seats; }
  function saveTourney(abandoned) {
    var pl = PA.player(), s = G.stats; if (!pl) return;
    var T = pl.tourneys = pl.tourneys || [];
    var slim = function (n) { var o = {}; Object.keys(n).forEach(function (k) { if (k !== 'profs' || n[k]) o[k] = n[k]; }); return o; };
    var rec = { id: G.id, at: Date.now(), label: fname0(G.opts), format: G.opts.format, table: G.opts.table, tableName: TABLES[G.opts.table].name, bounty: G.opts.bounty, field: entrants(),
      place: abandoned ? null : G.place, prize: abandoned ? 0 : (G.prize || 0), itm: !abandoned && (G.prize || 0) > 0, abandoned: !!abandoned, hands: s.hands - (s.autoHands || 0), dur: Math.round((G.played || 0) / 1000),
      vpip: s.hands ? Math.round(s.vpip / Math.max(1, s.hands - (s.autoHands || 0)) * 100) : 0, pfr: s.hands ? Math.round(s.pfr / Math.max(1, s.hands - (s.autoHands || 0)) * 100) : 0,
      pre: s.pre, post: s.post, sol: s.sol, kos: s.kos, bountyCash: s.bountyCash, profile: pl.profile || 'tag',
      notes: s.notes.slice(0, 40).map(slim), postNotes: s.postNotes.slice(0, 40) };
    T.unshift(rec); if (T.length > 60) T.length = 60;
    PA.save();
  }


  /* ---------- Mes tournois d'entraînement : historique et progression ---------- */
  function pctS(a, b) { return b ? Math.round(a / b * 100) : null; }
  function relPlace(t) { return t.place && t.field > 1 ? Math.round((1 - (t.place - 1) / (t.field - 1)) * 100) : null; } // 100 = vainqueur, 0 = premier éliminé
  function spark(series, h) {
    // petite courbe : chaque série = { name, color, pts: [valeur 0-100 ou null] } ; du plus ancien au plus récent
    var W = 320, H = h || 130, n = Math.max.apply(null, series.map(function (s) { return s.pts.length; })), P = 14;
    if (n < 2) return '<div class="small muted">La courbe apparaît à partir de deux tournois.</div>';
    var x = function (i) { return P + i * (W - 2 * P) / (n - 1); }, y = function (v) { return H - P - v * (H - 2 * P) / 100; };
    var grid = [0, 50, 100].map(function (v) { return '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--line)" stroke-width="1"/><text x="' + (W - P) + '" y="' + (y(v) - 3) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + v + ' %</text>'; }).join('');
    var lines = series.map(function (s) {
      var pts = s.pts.map(function (v, i) { return v === null ? null : [x(i), y(v)]; }), seg = [], cur = [];
      pts.forEach(function (p) { if (p) cur.push(p.join(',')); else if (cur.length) { seg.push(cur); cur = []; } }); if (cur.length) seg.push(cur);
      return seg.map(function (c) { return c.length > 1 ? '<polyline fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="' + c.join(' ') + '"/>' : ''; }).join('') +
        pts.map(function (p) { return p ? '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="' + s.color + '"/>' : ''; }).join('');
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="Courbe de progression">' + grid + lines + '</svg>' +
      '<div class="row" style="gap:14px;flex-wrap:wrap">' + series.map(function (s) { return '<span class="small"><span style="display:inline-block;width:12px;height:3px;background:' + s.color + ';vertical-align:middle;margin-right:5px"></span>' + s.name + '</span>'; }).join('') + '</div>';
  }
  function tourneysView() {
    var ui = U(), p = PA.player(), T = (p.tourneys || []), qid = /[?&]id=(\d+)/.exec(location.hash);
    if (qid) {
      var t = T.filter(function (x) { return String(x.id) === qid[1]; })[0];
      if (t) {
        var o2 = '<div class="stack"><button class="back" data-act="nav" data-v="mestournois">‹ Mes tournois</button><h1>' + ui.esc(t.label) + '</h1><div class="muted">' + new Date(t.at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }) + ' · ' + ui.esc(t.tableName || '') + '</div>' +
          '<div class="grid2"><div class="card"><div class="muted small">Place</div><div class="disp" style="font-size:36px">' + (t.place ? t.place + 'e / ' + t.field : 'Arrêtée') + '</div>' + (t.itm ? '<div class="small" style="color:#4fe08f">Places payées</div>' : '') + '</div>' +
          '<div class="card"><div class="muted small">Mains · VPIP / PFR</div><div class="disp" style="font-size:36px">' + t.hands + '</div><div class="small muted">' + t.vpip + ' % / ' + t.pfr + ' %</div></div></div>' +
          '<div class="card stack"><div>Avant le flop : <b>' + (pctS(t.pre.ok, t.pre.n) === null ? '—' : pctS(t.pre.ok, t.pre.n) + ' %') + '</b> conformes à ta range (' + t.pre.ok + ' / ' + t.pre.n + ', ' + t.pre.style + ' écart(s) de style, ' + t.pre.err + ' erreur(s))</div>' +
          '<div>Après le flop : <b>' + (t.sol && t.sol.n ? pctS(t.sol.ok, t.sol.n) + ' %' : '—') + '</b> conformes au solveur' + (t.sol && t.sol.n ? ' (' + t.sol.ok + ' / ' + t.sol.n + ')' : '') + ' · cote : ' + (t.post ? t.post.ok + ' / ' + t.post.n : '—') + '</div></div>' +
          detailBlocks({ notes: t.notes || [], postNotes: t.postNotes || [], sol: t.sol || { n: 0, ok: 0, mix: 0, bad: 0 }, post: t.post || { n: 0, ok: 0 } }, t.id) +
          '<a class="btn" href="#analyser?app">Voir ces mains dans Analyser (filtre « Appli »)</a></div>';
        return ui.shell('entrainer', o2);
      }
    }
    var out = '<div class="stack"><button class="back" data-act="nav" data-v="partie">‹ Jouer une partie</button><h1>Mes tournois d’entraînement</h1>';
    if (!T.length) return ui.shell('entrainer', out + ui.yo('Joue un tournoi complet (S’entraîner › Jouer une partie) : il apparaîtra ici avec ta place, tes décisions avant et après le flop, et la courbe de ta progression d’un tournoi à l’autre.') + '</div>');
    var done = T.filter(function (t) { return !t.abandoned; }), last = done.slice(0, 10), prev = done.slice(10, 20);
    var avg = function (L, f) { var v = L.map(f).filter(function (x) { return x !== null && x !== undefined; }); return v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length) : null; };
    var preP = function (t) { return pctS(t.pre.ok, t.pre.n); }, solP = function (t) { return t.sol && t.sol.n >= 2 ? pctS(t.sol.ok, t.sol.n) : null; }, itm = function (t) { return t.itm ? 100 : 0; };
    var kpi = function (lbl, v, pv, suf) { var d = v !== null && pv !== null ? v - pv : null; return '<div class="card"><div class="muted small">' + lbl + '</div><div class="disp" style="font-size:32px">' + (v === null ? '—' : v + (suf || ' %')) + '</div>' + (d !== null ? '<div class="small" style="color:' + (d >= 0 ? '#4fe08f' : '#ff8080') + '">' + (d >= 0 ? '+' : '') + d + ' pts vs les 10 d’avant</div>' : '<div class="small muted">sur les ' + last.length + ' derniers</div>') + '</div>'; };
    out += '<div class="muted">' + done.length + ' tournoi' + (done.length > 1 ? 's' : '') + ' terminé' + (done.length > 1 ? 's' : '') + (T.length > done.length ? ' · ' + (T.length - done.length) + ' arrêté(s) en cours de route' : '') + '. Les chiffres portent sur les 10 derniers.</div>' +
      '<div class="grid2">' + kpi('Places payées', avg(last, itm), prev.length ? avg(prev, itm) : null) + kpi('Classement moyen', avg(last, relPlace), prev.length ? avg(prev, relPlace) : null, ' / 100') +
      kpi('Avant le flop : conforme à ta range', avg(last, preP), prev.length ? avg(prev, preP) : null) + kpi('Après le flop : conforme au solveur', avg(last, solP), prev.length ? avg(prev, solP) : null) + '</div>';
    var chron = done.slice(0, 30).reverse();
    out += '<div class="card stack"><b>Ta progression, tournoi après tournoi</b>' + spark([{ name: 'Conforme à ta range', color: '#e8c15a', pts: chron.map(preP) }, { name: 'Conforme au solveur', color: '#5aa9e8', pts: chron.map(solP) }, { name: 'Classement (100 = victoire)', color: '#4fe08f', pts: chron.map(relPlace) }]) + '<div class="small muted">Classement : 100 = vainqueur, 0 = premier éliminé. Les tournois arrêtés en cours ne sont pas dans la courbe.</div></div>';
    out += '<div class="card stack"><b>Tous tes tournois</b>' + T.map(function (t) {
      return '<a class="row tn-row" href="#mestournois?id=' + t.id + '" style="justify-content:space-between;gap:10px;text-decoration:none;color:inherit;border-bottom:1px solid var(--line);padding:8px 0"><span><b>' + ui.esc(t.label) + '</b><br><span class="small muted">' + new Date(t.at).toLocaleDateString('fr-FR') + ' · ' + t.hands + ' mains · range ' + (preP(t) === null ? '—' : preP(t) + ' %') + (solP(t) !== null ? ' · solveur ' + solP(t) + ' %' : '') + '</span></span><span style="text-align:right;white-space:nowrap">' + (t.abandoned ? '<span class="small muted">arrêtée</span>' : '<b>' + t.place + 'e</b><span class="small muted"> / ' + t.field + '</span>') + (t.itm ? '<br><span class="small" style="color:#4fe08f">payé</span>' : '') + ' <span style="color:var(--gold)">›</span></span></a>';
    }).join('') + '</div>';
    return ui.shell('entrainer', out + '</div>');
  }

  /* ---------- Fin de partie ---------- */
  function finish() {
    if (G.over) return;
    G.over = true;
    var heroAlive = G.players[0].stack > 0;
    G.place = heroAlive ? 1 : remaining() + 1;
    G.prize = prizeFor(G.place);
    var pl = PA.player();
    var s = G.stats;
    var fname = fname0({ format: G.opts.format, seats: G.opts.seats }) + (G.opts.mtt ? ' (tables de ' + G.opts.seats + ')' : '') + (G.opts.bounty !== 'classique' ? ' ' + (G.opts.bounty === 'pko' ? 'PKO' : 'Space KO') : '');
    pl.sessions.unshift({ at: Date.now(), label: fname + ' (' + TABLES[G.opts.table].name + ') · ' + G.place + 'e', n: s.pre.n, ok: s.pre.ok, style: s.pre.style, err: s.pre.err, consult: s.consult });
    flushHH(); try { saveTourney(false); } catch (e) {}
    pl.last = null; PA.save();
    U().render();
  }

  /* ---------- Vues ---------- */
  function setupView() {
    var ui = U(), p = PA.player();
    function seg(key, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (SETUP[key] === o[0] ? 'on' : '') + '" data-gact="setup" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="entrainer">‹ S’entraîner</button><h1>Jouer une partie</h1>' +
      (G && !G.over ? '<button class="big-cta" data-act="nav" data-v="jeu"><div><div class="disp">Reprendre la partie</div><div style="font-weight:500">Main ' + G.handNo + ' · niveau ' + levelInfo().n + '</div></div></button>' : '') +
      '<a class="card row" href="#mestournois" style="text-decoration:none;color:inherit;justify-content:space-between"><span><b>📈 Mes tournois d’entraînement</b><span class="small muted"> · ' + ((p.tourneys || []).length ? (p.tourneys || []).length + ' joué' + ((p.tourneys || []).length > 1 ? 's' : '') + ', ta progression' : 'historique et progression') + '</span></span><span style="color:var(--gold)">›</span></a>' +
      '<div class="card stack"><b>Format</b>' + seg('format', [['sng', 'Sit & Go'], ['hu', 'Heads-up'], ['mtt', 'Tournoi 100 joueurs'], ['moments', 'Moments clés']]) +
      (SETUP.format === 'hu' ? '' : '<b>Joueurs par table</b>' + seg('seats', [[6, '6 max'], [8, '8 joueurs'], [9, '9 joueurs'], [10, '10 joueurs']]) + '<div class="small muted">' + (SETUP.format === 'sng' ? (SETUP.seats === 6 ? '2 places payées.' : '3 places payées.') : 'Toutes les tables du tournoi ont ce nombre de places.') + ' À 6 max, les places sont LJ, HJ, CO, bouton et les blindes, comme dans ta range du club.</div>') +
      (SETUP.format === 'hu' ? '<b>Tapis de départ</b>' + seg('huChips', [[5000, '25 BB'], [8000, '40 BB'], [20000, '100 BB']]) + '<div class="small muted">Un contre un, blindes 100/200 au départ : le bouton est aussi la petite blinde. Le gagnant prend tout. Ton adversaire est tiré de la table choisie ci-dessous.</div>' : '') +
      (SETUP.format === 'moments' ? '<div class="small muted">Tournoi de 100 joueurs : les mains sans enjeu sont jouées automatiquement selon ta range, tu ne joues que la bulle, les tapis courts, la table finale et le heads-up.</div>' : '') +
      (SETUP.format === 'hu' ? '' : SETUP.format === 'sng' ? '<b>Jetons de départ</b>' + seg('chips', [[20000, '20 000'], [3000, '3 000']]) : '<div class="small muted">Tournoi : 20 000 jetons de départ, 15 places payées.</div>') +
      '<b>Primes</b>' + seg('bounty', [['classique', 'Classique'], ['pko', 'PKO'], ['space', 'Space KO']]) +
      '<b>Rythme des blindes</b>' + seg('pace', [['normal', 'Normal (5 min)'], ['semi', 'Semi-turbo (3 min)'], ['turbo', 'Turbo (2 min)']]) + '<div class="small muted">Les blindes montent avec le temps passé à la table : toutes les 5, 3 ou 2 minutes. Le chrono s’arrête quand tu quittes la table.</div>' +
      (SETUP.table === 'club' || SETUP.table === 'monclub' ? '<div class="small muted">Table Club : pas de limp, comme au club (sauf en heads-up, et la petite blinde qui complète quand tout le monde s’est couché) — on relance ou on se couche.</div>' : '') +
      '<div class="small muted">Chaque adversaire mise à sa façon, selon son profil (le nit petit et honnête, le maniac énorme, le fantasque au hasard…) : touche un joueur à la table pour voir son style.</div>' +
      '<b>Adversaires</b>' + seg('table', Object.keys(TABLES).map(function (k) { return [k, TABLES[k].name]; })) +
      (SETUP.table === 'monclub' ? '<div class="small muted">' + ((p0().opps || []).length ? 'Tes ' + (p0().opps || []).length + ' fiches d’adversaires du club prennent place à la table, avec leur profil (les places restantes : joueurs de club habituels).' : 'Tu n’as pas encore de fiche d’adversaire : ajoute les joueurs du club dans Analyser › Adversaires, avec leur profil. En attendant, la table est celle du club.') + '</div>' : '') +
      '<b>Coach</b>' + seg('coach', [[true, 'Avec Yo'], [false, 'Sans coach (bilan à la fin)']]) +
      '<button class="btn gold block" data-gact="start">Lancer la partie</button></div>' +
      '</div>';
    return ui.shell('entrainer', body);
  }
  // emplacement des mises devant chaque siège : jamais sur le pot, le tableau, tes cartes ni une autre mise (en % de la table)
  var BETXY = {
    9: [[50, 59], [29, 62], [13, 66.5], [22, 40.5], [40, 23], [60, 23], [78, 40.5], [87, 66.5], [71, 62]],
    6: [[50, 59], [25, 62], [22, 40.5], [50, 22], [78, 40.5], [75, 62]],
    2: [[50, 59.5], [50, 22]]
  };
  var SEATPOS9 = function (k, n) { var step = 360 / n; var a = (90 + k * step) * Math.PI / 180; return a; };
  function cardSmall(c, hidden) {
    if (hidden) return '<div class="pcs back"></div>';
    var s = ['♣', '♦', '♥', '♠'][cSuit(c)], red = cSuit(c) === 1 || cSuit(c) === 2, r = RCH[cRank(c)];
    return '<div class="pcs' + (red ? ' red' : '') + '"><span>' + (r === 'T' ? '10' : r) + '</span><span>' + s + '</span></div>';
  }
  function cardBig(c) {
    var s = ['♣', '♦', '♥', '♠'][cSuit(c)], red = cSuit(c) === 1 || cSuit(c) === 2, r = RCH[cRank(c)];
    return '<div class="pc' + (red ? ' red' : '') + '"><span class="r">' + (r === 'T' ? '10' : r) + '</span><span class="s">' + s + '</span></div>';
  }
  function cardMid(c) {
    var s = ['♣', '♦', '♥', '♠'][cSuit(c)], red = cSuit(c) === 1 || cSuit(c) === 2, r = RCH[cRank(c)];
    return '<div class="pcm' + (red ? ' red' : '') + '"><span class="r">' + (r === 'T' ? '10' : r) + '</span><span class="s">' + s + '</span></div>';
  }
  var CHIPC = [[10, '#26262c', '#0b0b0d'], [5, '#2b8a3e', '#123d1b'], [1, '#1c7ed6', '#0b3a66'], [0.5, '#d61f1f', '#5c0c0c'], [0.1, '#e9e9ee', '#8a8a93']];
  function chipList(x) { var r = x / G.hand.L.bb, out = []; CHIPC.forEach(function (c) { while (r >= c[0] - 1e-9 && out.length < 12) { out.push(c); r -= c[0]; } }); if (!out.length) out.push(CHIPC[4]); return out; }
  function pileHtml(L) { return '<span class="cpile" style="height:' + (13 + L.length * 3.2) + 'px">' + L.map(function (c, i) { return '<i style="--i:' + i + ';--k:' + c[1] + ';--e:' + c[2] + '"></i>'; }).join('') + '</span>'; }
  function chipPiles(x, max, per) { var L = chipList(x).slice(0, max), P = []; for (var i = 0; i < L.length; i += per) P.push(pileHtml(L.slice(i, i + per))); return '<span class="cpiles">' + P.join('') + '</span>'; }
  function bbTxt(x) { var H = G.hand; return String(Math.round(x / H.L.bb * 10) / 10).replace('.', ','); }
  /* ---------- Animations et sons de la table (distribution, mises, pot) ---------- */
  var FX = { hand: -1, board: 0, bets: {}, pot: 0, done: false };
  var ACX = null;
  function fxOn() { var st = (window.PA.player() || {}).settings || {}; return st.tableFx !== false && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function sndOn() { var st = (window.PA.player() || {}).settings || {}; return st.tableSnd !== false; }
  function ac() { try { if (!ACX) ACX = new (window.AudioContext || window.webkitAudioContext)(); if (ACX.state === 'suspended') ACX.resume(); return ACX; } catch (e) { return null; } }
  // vrais enregistrements (cartes et jetons en argile, pack « Casino Audio » de Kenney, licence CC0), décodés une seule fois
  var SND = { deal: [1, 2, 3, 4, 5, 6, 7, 8], place: [1, 2, 3, 4], lay: [1, 2, 3], stack: [1, 2, 3, 4, 5, 6], collide: [1, 2, 3, 4], handle: [1, 2, 5, 6], pile: [3, 4] }, BUF = {}, SLOAD = false;
  function sndLoad() {
    var c = ac(); if (!c || SLOAD || !window.fetch) return; SLOAD = true;
    Object.keys(SND).forEach(function (k) {
      BUF[k] = [];
      SND[k].forEach(function (i) {
        fetch('audio/table/' + k + i + '.m4a').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
          .then(function (ab) { return new Promise(function (ok, ko) { var p = c.decodeAudioData(ab, ok, ko); if (p && p.then) p.then(ok, ko); }); })
          .then(function (b) { if (BUF[k].indexOf(b) < 0) BUF[k].push(b); }).catch(function () {});
      });
    });
  }
  // préchargé au premier toucher (le navigateur n'autorise le son qu'après un geste)
  document.addEventListener('pointerdown', function pre() { try { if (sndOn()) { sndLoad(); document.removeEventListener('pointerdown', pre, true); } } catch (e) {} }, true);
  var LAST = {};
  function play(kind, at, vol, rate) {
    var c = ac(); if (!c) return; sndLoad(); var L = BUF[kind]; if (!L || !L.length) return;
    var i = Math.floor(Math.random() * L.length); if (L.length > 1 && i === LAST[kind]) i = (i + 1) % L.length; LAST[kind] = i; // jamais deux fois le même d'affilée
    var s = c.createBufferSource(), g = c.createGain(); s.buffer = L[i];
    s.playbackRate.value = rate || (0.96 + Math.random() * 0.08); g.gain.value = (vol || 0.6) * (0.85 + Math.random() * 0.15);
    s.connect(g); g.connect(c.destination); s.start(c.currentTime + (at || 0));
  }
  // carte distribuée (glisse sur le feutre) ; carte du tableau retournée et posée
  function sCard(at) { play('deal', at, 0.55); }
  function sBoard(at) { play('place', at, 0.6); }
  // mise : un ou deux jetons posés, plus une petite pile pour les grosses mises
  // une pile de jetons : plusieurs jetons qui tombent les uns sur les autres, en cascade de plus en plus rapprochée
  function pile(at, k, vol) {
    var t = at || 0, gap = 0.075;
    for (var i = 0; i < k; i++) { play(i === 0 ? 'stack' : (i % 2 ? 'lay' : 'stack'), t, vol * (1 - i * 0.1), 0.97 + i * 0.025 + Math.random() * 0.03); t += gap; gap *= 0.8; }
  }
  function sChip(at, n) { n = n || 2; pile(at, n > 2 ? 5 : 3, 0.62); play('pile', (at || 0) + 0.02, 0.35); }
  function sCollect(at) { play('handle', at, 0.55); pile((at || 0) + 0.15, 4, 0.5); }
  function sWin(at) { play('handle', at, 0.6); pile((at || 0) + 0.25, 6, 0.6); }
  // repère ce qui vient d'apparaître et garde l'heure de départ de chaque animation :
  // un nouvel affichage (action d'un adversaire) continue l'animation au lieu de la couper
  function fxDiff(H, n) {
    var now = Date.now(), out = { newHand: false, board: [], bets: {}, collect: false, win: false };
    if (FX.hand !== G.handNo) { out.newHand = true; FX = { hand: G.handNo, board: 0, bets: {}, pot: 0, done: false, t: { deal: now } }; }
    for (var i = FX.board; i < H.board.length; i++) { out.board.push(i); FX.t['b' + i] = now + (i - FX.board) * 160; }
    var hadBets = Object.keys(FX.bets).some(function (k) { return FX.bets[k] > 0; }), nowBets = false;
    for (var k = 0; k < n; k++) { var b = H.bets[k] || 0; if (b > 0) nowBets = true; if (b > (FX.bets[k] || 0)) { out.bets[k] = true; FX.t['c' + k] = now; } }
    if (hadBets && !nowBets && H.pot > FX.pot) { out.collect = true; FX.t.pot = now; }
    if (H.done && !FX.done) { out.win = true; FX.t.pot = now; }
    FX.board = H.board.length; FX.bets = {}; for (var j = 0; j < n; j++) FX.bets[j] = H.bets[j] || 0; FX.pot = H.pot; FX.done = !!H.done;
    return out;
  }
  // délai CSS (en secondes, négatif si l'animation est déjà commencée) ; null quand elle est finie
  function fxDelay(key, base, dur) { var t0 = FX.t && FX.t[key]; if (!t0) return null; var el = (Date.now() - t0) / 1000 - (base || 0); return el > dur ? null : (-el).toFixed(3) + 's'; }
  var DSTEP = 0.1; // écart entre deux cartes distribuées (plus posé qu'avant)
  function dealSound(t1, t2) { if (!sndOn()) return; sCard(t1 || 0); sCard(t2 || 0.9); } // tes deux cartes seulement

  /* ---------- Mise libre : une jauge de la relance minimale au tapis, avec des raccourcis ---------- */
  function bszStep() { var L = G.hand.L; return Math.max(1, L.sb || Math.round(L.bb / 2)); }
  function bszKey(H) { return G.handNo + '-' + H.street + '-' + H.cur; }
  function bszFromX(x) { var B = G.bsz; if (x >= 1000) return B.max; var v = B.min + (B.max - B.min) * Math.pow(x / 1000, 2), st = bszStep(); return Math.min(B.max, Math.max(B.min, Math.round(v / st) * st)); }
  function bszToX(v) { var B = G.bsz; return B.max > B.min ? Math.round(Math.sqrt(Math.max(0, (v - B.min) / (B.max - B.min))) * 1000) : 1000; }
  function bszLabel(v) {
    var H = G.hand, B = G.bsz, bbs = String(Math.round(v / H.L.bb * 10) / 10).replace('.', ',');
    var verb = v >= B.max ? 'Tapis' : H.street > 0 ? (H.cur > 0 ? 'Relancer à' : 'Miser') : (H.cur > H.L.bb ? 'Relancer à' : H.limpers > 0 ? 'Isoler à' : 'Ouvrir à');
    var add = v - (H.bets[0] || 0), pp = Math.round(add / Math.max(1, B.pot) * 100), sp = Math.round(add / Math.max(1, B.stack) * 100);
    return { go: verb + (v >= B.max ? ' (' + PA.fmt(B.stack) + ')' : ' ' + PA.fmt(v)), val: PA.fmt(v), sub: bbs + ' BB' + (H.street > 0 ? ' · ' + pp + ' % du pot' : '') + ' · ' + sp + ' % de ton tapis' };
  }
  function bszPaint() {
    var B = G.bsz, lb = bszLabel(B.to), e;
    if ((e = document.getElementById('bszV'))) e.textContent = lb.val;
    if ((e = document.getElementById('bszS'))) e.textContent = lb.sub;
    if ((e = document.getElementById('bszGo'))) { e.innerHTML = lb.go + '<small class="bsz-gs">' + lb.sub + '</small>'; e.className = B.to >= B.max ? 'a-three' : 'a-raise'; }
    if ((e = document.getElementById('bszR')) && +e.value !== bszToX(B.to)) e.value = bszToX(B.to);
  }
  function betSizer(H, L, me, minTo, maxTo, pot, tc, sizes) {
    var key = bszKey(H);
    if (!G.bsz || G.bsz.k !== key) G.bsz = { k: key, to: Math.max(minTo, Math.min(maxTo, Math.round((sizes[0] ? sizes[0][0] : minTo)))) };
    var B = G.bsz; B.min = minTo; B.max = maxTo; B.pot = pot + tc; B.stack = me.stack; B.to = Math.max(minTo, Math.min(maxTo, B.to));
    var q = [];
    if (H.street === 0) {
      if (H.cur <= L.bb) q = [2, 2.5, 3, 4, 5, 6].map(function (m) { return [m * L.bb, String(m).replace('.', ',') + ' BB']; });
      else q = [2.5, 3, 4, 5].map(function (m) { return [H.cur * m, '×' + String(m).replace('.', ',')]; });
    } else if (H.cur === 0) q = [[0.25, '¼ pot'], [1 / 3, '⅓ pot'], [0.5, '½ pot'], [2 / 3, '⅔ pot'], [0.75, '¾ pot'], [1, 'Pot'], [1.5, '1,5 pot']].map(function (f) { return [pot * f[0], f[1]]; });
    else q = [[H.cur * 2.5, '×2,5'], [H.cur * 3, '×3'], [H.cur + (pot + tc), 'Pot']];
    q = q.concat([[0.25, '25 %'], [0.33, '33 %'], [0.5, '50 %'], [0.75, '75 %']].map(function (f) { return [(H.bets[0] || 0) + me.stack * f[0], f[1] + ' tapis']; }));
    var seen = {};
    q = q.map(function (x) { return [Math.round(x[0] / bszStep()) * bszStep(), x[1]]; }).filter(function (x) { if (x[0] < minTo || x[0] >= maxTo || seen[x[0]]) return false; seen[x[0]] = 1; return true; });
    var lb = bszLabel(B.to);
    return '<div class="bsz"><div class="bsz-top"><span>Ta mise</span><b id="bszV">' + lb.val + '</b></div><small id="bszS">' + lb.sub + '</small>' +
      '<div class="bsz-row"><button data-gact="bszStep" data-v="-1" aria-label="Moins">−</button><input type="range" id="bszR" min="0" max="1000" step="1" value="' + bszToX(B.to) + '" aria-label="Montant de la mise"><button data-gact="bszStep" data-v="1" aria-label="Plus">+</button></div>' +
      (q.length ? '<div class="bsz-q">' + q.map(function (x) { return '<button data-gact="bszSet" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' : '') +
      '<button id="bszGo" class="' + (B.to >= maxTo ? 'a-three' : 'a-raise') + '" data-gact="bszGo">' + lb.go + '<small class="bsz-gs">' + lb.sub + '</small></button></div>';
  }
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'bszR' && G && G.bsz) { G.bsz.to = bszFromX(+e.target.value); bszPaint(); } });
  // grand écran (ordinateur) : la table prend toute la place libre, boutons d'action à droite
  function fitTable() {
    var f = document.querySelector('.felt2'); if (!f) return;
    // téléphone : à ton tour, fais remonter la page pour que les boutons et la jauge soient visibles en entier (une fois par décision)
    var H = G && G.hand, pan = document.querySelector('.gtab-r');
    if (H && H.toAct === 0 && !H.done && pan && window.innerWidth < 1100) {
      var k = bszKey(H); if (G.scrolledFor !== k) { G.scrolledFor = k; var rb = pan.getBoundingClientRect().bottom; if (rb > window.innerHeight - 8) window.scrollBy({ top: rb - window.innerHeight + 12, behavior: 'smooth' }); }
    }
    var wide = window.innerWidth >= 1100 && window.innerHeight >= 600, z = 1;
    if (wide) {
      var col = f.parentElement, cw = col ? col.clientWidth : 720, top = f.getBoundingClientRect().top + (window.scrollY || 0) - (window.scrollY || 0);
      var r = f.getBoundingClientRect(), z0 = parseFloat(f.style.zoom) || 1, h0 = r.height / z0;
      var avail = window.innerHeight - r.top - 76; // place pour « Ton tapis » en dessous
      z = Math.max(1, Math.min(cw / 720, avail / h0, 2.2));
    }
    f.style.zoom = z > 1.02 ? z.toFixed(3) : '';
  }
  window.addEventListener('resize', function () { if (document.querySelector('.felt2')) fitTable(); });
  function tableView() {
    var ui = U(); if (sndOn()) sndLoad();
    if (!G) { location.hash = '#partie'; return ''; }
    if (G.over) return ui.shell('entrainer', bilanView(), true);
    var H = G.hand, n = G.players.length, L = H.L;
    var narrow = (window.innerWidth || 1000) < 700, RX = narrow ? 40 : 44, RY = narrow ? 41 : 42;
    var theme = (window.PA.player().settings || {}).tableTheme || 'vert';
    var D = fxDiff(H, n), FXV = fxOn(), dealD = function (k, r) { return fxDelay('deal', (r * n + k) * DSTEP, 0.45); }, dealing = FXV && fxDelay('deal', 0, (2 * n) * DSTEP + 0.45) !== null;
    var h = '<div class="felt2 t-' + theme + '"><div class="rail"></div>';
    for (var k = 0; k < n; k++) {
      var p = G.players[k], a = SEATPOS9(k, n), x = 50 + RX * Math.cos(a), y = 50 + RY * Math.sin(a);
      var inH = H.inHand[k], fold = H.folded[k], out = p.stack <= 0 && !inH;
      var showCards = k === 0 || (H.done && H.showdown && inH && !fold);
      var nm = k === 0 ? 'Toi' : p.name;
      h += '<button class="seat2' + (k === 0 ? ' hero' : '') + ((fold || out) ? ' out' : '') + (H.toAct === k && !H.done ? ' turn' : '') + '" data-gact="seat" data-v="' + k + '" style="left:' + x + '%;top:' + y + '%">';
      if (inH && !fold && k !== 0) h += '<span class="mc' + (dealing ? ' fx-dealo' : '') + '"' + (dealing ? ' style="--d1:' + (dealD(k, 0) || '-9s') + ';--d2:' + (dealD(k, 1) || '-9s') + '"' : '') + '>' + (showCards ? cardSmall(H.hole[k][0]) + cardSmall(H.hole[k][1]) : cardSmall(0, true) + cardSmall(0, true)) + '</span>';
      h += '<span class="av">' + ui.esc(nm.charAt(0).toUpperCase()) + '</span><span class="nm2">' + ui.esc(nm) + '</span><span class="ps' + (k === G.button ? ' btn-d' : '') + '">' + (H.pos[k] || '') + '</span>' +
        '<span class="st2">' + (out ? 'Éliminé' : (H.allin[k] ? 'Tapis' : PA.fmt(p.stack))) + '</span>' + (out ? '' : hudLine(p)) + (p.fresh && p.fresh >= G.handNo && k !== 0 && !out ? '<span class="new2">nouveau</span>' : '');
      if (G.opts.bounty !== 'classique' && !out) h += '<span class="bty">' + (G.opts.bounty === 'space' && k !== 0 ? '?' : p.bounty.toFixed(0) + ' €') + '</span>';
      h += '</button>';
      if (H.bets[k]) { var bp = BETXY[n] && BETXY[n][k], bx = bp ? bp[0] : 50 + RX * 0.62 * Math.cos(a), by = bp ? bp[1] : 50 + RY * 0.6 * Math.sin(a); h += '<div class="bet2' + (FXV && fxDelay('c' + k, 0, 0.38) ? ' fx-chip' : '') + '" style="--cd:' + (fxDelay('c' + k, 0, 0.38) || '0s') + ';left:' + bx + '%;top:' + by + '%;--sx:' + x + '%;--sy:' + y + '%;--bx:' + bx + '%;--by:' + by + '%">' + chipPiles(H.bets[k], 5, 5) + PA.fmt(H.bets[k]) + '</div>'; }
    }
    h += '<div class="pot2' + (FXV && fxDelay('pot', 0, 0.55) ? ' fx-pot' : '') + '" style="--pd:' + (fxDelay('pot', 0, 0.55) || '0s') + '">' + (potTotal() > 0 ? chipPiles(potTotal(), 8, 4) : '') + 'Pot ' + PA.fmt(potTotal()) + ' <small>' + bbTxt(potTotal()) + ' BB</small></div>';
    h += '<div class="board2">' + [0, 1, 2, 3, 4].map(function (i) { var bd = FXV ? fxDelay('b' + i, 0, 0.5) : null; return H.board[i] !== undefined ? (bd ? '<div class="fx-board" style="--d:' + bd + '">' + cardMid(H.board[i]) + '</div>' : cardMid(H.board[i])) : '<div class="slot"></div>'; }).join('') + '</div>';
    if (H.inHand[0] && !H.folded[0]) h += '<div class="mine2' + (dealing ? ' fx-dealme' : '') + '"' + (dealing ? ' style="--d1:' + (dealD(0, 0) || '-9s') + ';--d2:' + (dealD(0, 1) || '-9s') + '"' : '') + '>' + H.hole[0].map(cardMid).join('') + '</div>';
    // les sons suivent les animations
    if (sndOn()) {
      if (D.newHand && H.inHand[0]) { sCard(0.02); sCard(n * DSTEP + 0.02); } // seulement tes deux cartes, au moment où elles arrivent
      D.board.forEach(function (bi2, j) { sBoard(0.05 + j * 0.16); });
      var nb = Object.keys(D.bets).length; if (nb) sChip(D.newHand ? 0.05 : 0.08, Math.min(4, 1 + nb));
      if (D.collect) sCollect(0.02);
      if (D.win) sWin(0.15);
    }
    if (G.pop !== undefined && G.pop !== null && G.players[G.pop]) {
      var q = G.players[G.pop];
      h += '<div class="pop2" data-gact="seat" data-v="-1"><b>' + ui.esc(G.pop === 0 ? 'Toi' : q.name) + '</b> · ' + (H.pos[G.pop] || '') + '<br>' + PA.fmt(q.stack) + ' (' + bbTxt(q.stack) + ' BB)' + '<br>' + hudFull(q) +
        (G.pop !== 0 && G.opts.coach ? '<br><span style="color:var(--gold)">' + OPP[q.prof].name + '</span><br><span class="small">Ses mises : ' + ST(OPP[q.prof]).txt + '.</span>' : '') +
        (G.pop !== 0 && q.note ? '<br><span class="small">Ta note : ' + ui.esc(q.note.slice(0, 120)) + '</span>' : '') +
        (G.opts.bounty !== 'classique' ? '<br>Prime : ' + (G.opts.bounty === 'space' && G.pop !== 0 ? 'mystère' : q.bounty.toFixed(2).replace('.', ',') + ' €') + (G.pop === 0 && G.stats.bountyCash ? ' · gagné ' + G.stats.bountyCash.toFixed(2).replace('.', ',') + ' €' : '') : '') + '<br><span class="small muted">Toucher pour fermer</span></div>';
    }
    h += '</div>';
    var hasHud = G.opts.format !== 'hu';
    var info = '<div class="small muted" style="text-align:center">' + (hasHud ? 'Main ' + G.handNo : 'Niveau ' + L.n + ' · blindes ' + PA.fmt(L.sb) + ' / ' + PA.fmt(L.bb) + (L.ante ? ' · ante ' + PA.fmt(L.ante) + ' (BB ante)' : '') + ' · main ' + G.handNo + ' · ' + alive().length + ' joueurs') + (G.stats.autoHands ? ' · ' + G.stats.autoHands + ' mains jouées automatiquement' : '') + (G.opts.bounty !== 'classique' ? ' · <b style="color:#4fe08f">primes gagnées : ' + G.stats.bountyCash.toFixed(2).replace('.', ',') + ' € (' + G.stats.kos + ' élimination' + (G.stats.kos > 1 ? 's' : '') + ')</b>' : '') + '</div>' +
      (G.keyMsg ? U().yo(G.keyMsg) : '') + (!H.done && G.arrivals && G.arrivals.length ? '<div class="small" style="text-align:center;color:var(--gold)">🪑 Nouveau' + (G.arrivals.length > 1 ? 'x joueurs' : ' joueur') + ' à ta table, venu' + (G.arrivals.length > 1 ? 's' : '') + ' d’une autre table pour remplacer ' + (G.arrivals.length > 1 ? 'les éliminés' : 'l’éliminé') + ' : ' + G.arrivals.map(function (x) { return U().esc(x); }).join(', ') + '</div>' : '');
    var top = '<div class="drill-top"><button class="back" data-gact="quit">‹ Quitter</button><span class="muted small">' + ({ sng: 'Sit &amp; Go', sng9: 'Sit &amp; Go', sng6: 'Sit &amp; Go', hu: 'Heads-up', mtt: 'Tournoi', moments: 'Moments clés' }[G.opts.format] || '') + (G.opts.format === 'hu' ? '' : ' · ' + G.opts.seats + ' max') + (G.opts.bounty !== 'classique' ? (G.opts.bounty === 'pko' ? ' PKO' : ' Space KO') : '') + ' · ' + TABLES[G.opts.table].name + '</span><button class="rbtn" data-act="range" aria-label="Ouvrir ma range">Ma range</button></div>';
    var me = G.players[0];
    var legend = '<div class="small muted hd-leg">Sous chaque joueur : <b>mains</b> · <b>V</b> = VPIP (% de mains jouées) · <b>P</b> = % payées sans relancer · <b>R</b> = % relancées avant le flop, depuis le début de la partie.</div>';
    var mine = H.inHand[0] ? '<div class="small" style="text-align:center">Ton tapis : <b>' + PA.fmt(me.stack) + '</b> (' + bbTxt(me.stack) + ' BB)' + (H.board.length && !H.folded[0] ? ' · ' + catName(evalHand(H.hole[0].concat(H.board))) : '') + '</div>' : '';
    var bottom = '';
    if (H.done) {
      var ws = Object.keys(H.winners).map(function (w) { return (w === '0' ? 'Tu gagnes' : G.players[w].name + ' gagne') + ' ' + PA.fmt(H.winners[w]) + (H.showdown && H.scores ? ' (' + handName(H.scores[w]) + ')' : ''); }).join(' · ');
      // plusieurs tapis de tailles différentes : pot principal et pots secondaires, chacun avec ses joueurs
      var cp = (H.pots || []).filter(function (x) { return x.elig.length > 1; });
      if (H.showdown && cp.length > 1) {
        var who = function (k) { return k === 0 ? 'toi' : G.players[k].name; };
        ws = (H.pots || []).map(function (x, j) {
          var nmP = j === 0 ? 'Pot principal' : 'Pot secondaire' + (cp.length > 2 ? ' ' + j : '');
          if (x.elig.length < 2) return 'Rendu à ' + who(x.elig[0]) + ' : ' + PA.fmt(x.amt) + ' (personne ne pouvait suivre)';
          var w2 = x.ws.map(function (k) { return '<b>' + who(k) + '</b> (' + handName(H.scores[k]) + ')'; }).join(' et ');
          var los = x.elig.filter(function (k) { return x.ws.indexOf(k) < 0; }).map(function (k) { return who(k) + ' (' + handName(H.scores[k]) + ')'; });
          return nmP + ' ' + PA.fmt(x.amt) + ' entre ' + x.elig.map(who).join(', ') + ' : ' + w2 + (x.ws.length > 1 ? ' se le partagent' : ' le gagne') + (los.length ? ', contre ' + los.join(', ') : '') + '.';
        }).join('<br>') + '<div class="small muted" style="margin-top:4px">Un joueur à tapis ne peut gagner que ce qu’il a misé, multiplié par le nombre de joueurs qui l’ont suivi : le reste forme un pot secondaire entre ceux qui avaient plus de jetons.</div>';
      }
      bottom = '<div class="banner">' + ws + (H.koMsg ? '<br><b>' + H.koMsg + '</b>' : '') + '</div>' + (G.arrivals && G.arrivals.length ? '<div class="small muted" style="text-align:center">🪑 Arrivée' + (G.arrivals.length > 1 ? 's' : '') + ' à la table (joueurs d’autres tables, pour remplacer les éliminés) : ' + G.arrivals.map(function (x) { return U().esc(x); }).join(', ') + '</div>' : '') + (G.coachMsg && G.opts.coach ? ui.yo(G.coachMsg) : '') + '<button class="btn gold block" data-gact="next">Main suivante</button>';
    } else if (H.toAct === 0) {
      var tc = toCall(0), pot = potTotal(), maxTo = me.stack + H.bets[0], minTo = H.cur + H.lastRaise;
      var btns = [];
      btns.push(['fold', tc === 0 ? 'Parole' : 'Se coucher', 'a-fold', tc === 0 ? 'check' : 'fold']);
      var limpNow = H.street === 0 && H.preRaises === 0 && H.pos[0] !== 'BB';
      if (tc > 0 && !(limpNow && noLimp())) btns.push(['call', (tc >= me.stack ? 'Payer tapis ' : limpNow ? (H.pos[0] === 'SB' ? 'Compléter (limp) ' : 'Limper ') : 'Payer ') + PA.fmt(tc), 'a-call', 'call']);
      var sizes = [], blind = H.pos[0] === 'SB' || H.pos[0] === 'BB';
      if (H.street === 0) {
        // tailles du cours : isolement 3 BB en position, 4 BB des blindes, +1 par limper ; 3-bet ×3 en position, ×4 hors position (+1 ouverture par payeur) ; 4-bet ×2,2 à ×2,5
        var nCall = 0; if (H.preRaises === 1) Object.keys(H.inHand).forEach(function (k) { k = +k; if (k !== 0 && k !== H.opener && !H.folded[k] && H.bets[k] === H.cur) nCall++; });
        var iso = blind ? 4 : 3;
        if (H.cur <= L.bb && H.limpers > 0) sizes = [[(iso + H.limpers) * L.bb, String(iso + H.limpers) + ' BB'], [(iso + 1 + H.limpers) * L.bb, String(iso + 1 + H.limpers) + ' BB']];
        else if (H.cur <= L.bb) sizes = H.pos[0] === 'SB' ? [[2.5 * L.bb, '2,5 BB'], [3 * L.bb, '3 BB']] : [[2 * L.bb, '2 BB'], [2.2 * L.bb, '2,2 BB'], [2.5 * L.bb, '2,5 BB'], [3 * L.bb, '3 BB']];
        else if (H.preRaises === 1) sizes = [3, 4].map(function (m) { var v = H.cur * m + nCall * H.cur; return [v, (nCall ? 'Squeeze ' : '3-bet ') + bbTxt(v) + ' BB']; });
        else sizes = [2.2, 2.5].map(function (m) { var v = H.cur * m; return [v, (H.preRaises === 2 ? '4-bet ' : 'Relancer ') + bbTxt(v) + ' BB']; });
      } else {
        if (H.cur === 0) sizes = [[pot / 3, '1/3 pot'], [pot / 2, '1/2 pot'], [pot * 2 / 3, '2/3 pot'], [pot, 'Pot']];
        else sizes = [[H.cur * 2.5, '×2,5'], [H.cur * 3, '×3']];
      }
      if (!canRaise(0)) sizes = [];
      var raiseBtns = sizes.filter(function (s) { return s[0] >= minTo && s[0] < maxTo; }).map(function (s) { return '<button class="a-raise" data-gact="raise" data-v="' + Math.round(s[0]) + '">' + (H.cur > 0 && H.street > 0 ? 'Relancer ' : (H.street === 0 && H.cur > L.bb ? '' : (H.street === 0 ? (H.limpers > 0 ? 'Isoler ' : 'Ouvrir ') : 'Miser '))) + s[1] + '</button>'; });
      if (maxTo > H.cur && canRaise(0)) raiseBtns.push('<button class="a-three" data-gact="allin">Tapis (' + PA.fmt(me.stack) + ')</button>');
      var bsz = canRaise(0) && maxTo > minTo ? betSizer(H, L, me, minTo, maxTo, pot, tc, sizes) : '';
      if (bsz && raiseBtns.length && /data-gact="allin"/.test(raiseBtns[raiseBtns.length - 1])) btns.push(['allin', 'Tapis', 'a-three', 'allin']), raiseBtns.pop(); // Tapis sur la même ligne que Se coucher / Payer
      bottom = (G.opts.coach && G.coachMsg ? ui.yo(G.coachMsg) : '') + '<div class="actions act-main n' + btns.length + '" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + btns.map(function (b) { return '<button class="' + b[2] + '" style="color:#fff" data-gact="' + b[3] + '">' + b[1] + '</button>'; }).join('') + '</div><div class="actions act-q' + (bsz ? ' has-bsz' : '') + '" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + raiseBtns.join('') + '</div>' + bsz;
    } else {
      bottom = (G.opts.coach && G.coachMsg ? ui.yo(G.coachMsg) : '') + '<div class="banner muted" style="text-align:center">' + (H.inHand[0] && !H.folded[0] ? 'Au tour de ' + ui.esc(G.players[H.toAct] ? G.players[H.toAct].name : '…') + '…' : 'Tu t’es couché. La main continue…') + '</div>' + (H.folded[0] || !H.inHand[0] ? '<button class="btn block" data-gact="skip">Passer à la main suivante</button>' : '');
    }
    if (window.requestAnimationFrame) requestAnimationFrame(fitTable);
    return ui.shell('entrainer', '<div class="stack">' + top + (G.opts.format === 'hu' ? '' : hud()) + '<div class="gtab"><div class="gtab-l">' + info + h + mine + legend + '</div><div class="gtab-r stack">' + bottom + '</div></div></div>', true);
  }
  function noteOf(v, k) { var p2 = String(v).split(':'), i = parseInt(p2[1], 10); if (p2[0] === 'g') return G && G.stats[k][i]; var T = (PA.player().tourneys || []).filter(function (t) { return String(t.id) === p2[0]; })[0]; return T && T[k] && T[k][i]; }
  // le détail des écarts (avant et après le flop), pour le bilan de la partie et pour un tournoi de l'historique
  function detailBlocks(s, src) {
    var ui = U(), o = '';
    // toutes les mains jouées autrement que ta range, une par une : tes cartes, ce que tu as fait, ce que dit ta range
    if (s.notes.length) {
      var nE = s.notes.filter(function (n) { return n.kind !== 'style'; }).length, nS = s.notes.length - nE;
      o += '<div class="card stack ecarts"><b>Tes mains jouées autrement que ta range (' + s.notes.length + ')</b><div class="small muted">' + (nE ? nE + ' erreur' + (nE > 1 ? 's' : '') : '') + (nE && nS ? ' · ' : '') + (nS ? nS + ' écart' + (nS > 1 ? 's' : '') + ' de style (jouable par un autre profil)' : '') + '. Elles reviennent aussi dans ta Séance du jour pour être revues.</div>' +
        s.notes.map(function (n, i) {
          var giv = n.given === 'fold' && n.sit.type === 'iso' && n.sit.pos === 'BB' ? 'Checker' : ui.actName(n.given, n.sit);
          return '<div class="ec-row ' + (n.kind === 'style' ? 'ec-style' : 'ec-err') + '"><div class="ec-head"><span class="ec-cards">' + (n.cards ? n.cards.map(function (c) { return cardSmall(c); }).join('') : '<b>' + n.code + '</b>') + '</span><span class="small muted">Main ' + n.hand + (n.lvl ? ' · blindes ' + n.lvl : '') + (n.bb ? ' · ' + n.bb + ' BB' : '') + '</span><span class="ec-tag">' + (n.kind === 'style' ? 'Écart de style' : 'Erreur') + '</span></div>' +
            '<div>' + ui.describeSit(n.sit).replace(/^./, function (c) { return c.toUpperCase(); }) + '</div>' +
            '<div>Tu as joué : <b>' + giv + '</b> · Ta range : <b class="ec-ok">' + ui.actName(n.answer, n.sit) + '</b></div>' +
            (n.profs ? '<div class="small muted">Un profil ' + n.profs.map(function (x) { return PA.PROFILES[x].short; }).join(' ou ') + ' l’aurait joué comme toi.</div>' : '') + (n.note ? '<div class="small muted">' + n.note + '</div>' : '') +
            '<button class="btn" data-gact="noteRange" data-v="' + src + ':' + i + '" style="min-height:38px;padding:4px 12px;align-self:flex-start">Voir dans ma range</button></div>';
        }).join('') + '</div>';
    }
    // après le flop : erreurs de cote et écarts avec le solveur
    if (s.sol.n || s.postNotes.length) {
      var cards = function (L) { return '<span class="ec-cards">' + L.map(function (c) { return cardSmall(c); }).join('') + '</span>'; };
      o += '<div class="card stack ecarts"><b>Après le flop (' + s.postNotes.length + ' coup' + (s.postNotes.length > 1 ? 's' : '') + ' à revoir)</b><div class="small muted">' +
        (s.sol.n ? 'Comparé au solveur : ' + s.sol.n + ' décision' + (s.sol.n > 1 ? 's' : '') + ' au flop, ' + s.sol.ok + ' conforme' + (s.sol.ok > 1 ? 's' : '') + ', ' + s.sol.mix + ' jouable' + (s.sol.mix > 1 ? 's' : '') + ', ' + s.sol.bad + ' écart' + (s.sol.bad > 1 ? 's' : '') + '. ' : 'Aucun coup comparable au solveur (il faut un pot à deux joueurs au flop, dans une situation calculée). ') +
        'Contrôle de la cote : ' + s.post.ok + ' / ' + s.post.n + ' décisions correctes.</div>' +
        (function (L) { var order = L.map(function (n, i) { return i; }).sort(function (x, y) { return (L[x].kind === 'sol' ? 0 : 1) - (L[y].kind === 'sol' ? 0 : 1) || x - y; }); var h = order.map(function (i) { return rowPN(L[i], i); }); return h.slice(0, 10).join('') + (h.length > 10 ? '<details class="ec-more"><summary>Voir les ' + (h.length - 10) + ' autres</summary>' + h.slice(10).join('') + '</details>' : ''); })(s.postNotes) + '</div>';
      function rowPN(n, i) {
          var st = n.kind === 'cote' ? 'ec-err' : n.verdict === 'bad' ? 'ec-err' : 'ec-style';
          var tag = n.kind === 'cote' ? 'Cote' : n.verdict === 'bad' ? 'Écart solveur' : n.verdict === 'mix' ? 'Jouable' : 'Taille';
          var head = '<div class="ec-head">' + cards(n.cards) + '<span class="small muted">Main ' + n.hand + ' · tableau</span>' + cards(n.board) + '<span class="ec-tag">' + tag + '</span></div>';
          if (n.kind === 'cote') return '<div class="ec-row ' + st + '">' + head + '<div>' + ['', 'Au flop', 'À la turn', 'À la river'][n.street] + ' : ' + (n.given === 'fold' ? 'tu t’es couché' : 'tu as payé') + ' ' + PA.fmt(n.tc) + ' pour un pot de ' + PA.fmt(n.pot) + '. Il fallait <b>' + Math.round(n.need * 100) + ' %</b> d’équité, tu en avais environ <b>' + Math.round(n.eq * 100) + ' %</b> contre ' + n.opp + ' main' + (n.opp > 1 ? 's' : '') + ' au hasard.</div><div class="small muted">' + (n.given === 'fold' ? 'Avec autant d’équité, payer est rentable, sauf si tu es sûr que sa range est bien plus forte qu’une main au hasard.' : 'La cote n’y est pas : même contre une main au hasard, tu perds de l’argent à payer.') + '</div></div>';
          return '<div class="ec-row ' + st + '">' + head + '<div>' + n.spotName + ' · tu es ' + (n.side === 'ip' ? 'en position' : 'hors de position') + (n.cat ? ' · ta main : ' + n.cat.toLowerCase() : '') + '</div><div>Tu as joué : <b>' + n.given + '</b> · Le solveur : <b class="ec-ok">' + n.sol + '</b></div>' + (n.exact ? '' : '<div class="small muted">Flop rapproché du flop calculé le plus ressemblant.</div>') + '<button class="btn" data-gact="postSol" data-v="' + src + ':' + i + '" style="min-height:38px;padding:4px 12px;align-self:flex-start">Revoir dans le solveur</button></div>';
      }
    }
    return o;
  }
  function bilanView() {
    var ui = U(), s = G.stats, prize = PAYOUT[G.opts.seats][G.place - 1];
    prize = G.prize;
    var vp = Math.round(s.vpip / Math.max(1, s.hands) * 100), pf = Math.round(s.pfr / Math.max(1, s.hands) * 100);
    var msg = (G.place === 1 ? 'Victoire ! ' : (prize ? 'Dans les places payées : ' + G.place + 'e. ' : 'Éliminé en ' + G.place + 'e place. ')) +
      (prize ? 'Gain : ' + prize.toFixed(2).replace('.', ',') + ' € (buy-in fictif de 10 €). ' : '') + (s.bountyCash ? 'Primes : ' + s.bountyCash.toFixed(2).replace('.', ',') + ' € pour ' + s.kos + ' élimination' + (s.kos > 1 ? 's' : '') + '. ' : '') +
      'Préflop : ' + s.pre.ok + ' bonnes décisions sur ' + s.pre.n + ' situations reconnues, ' + s.pre.style + ' écart' + (s.pre.style > 1 ? 's' : '') + ' de style, ' + s.pre.err + ' erreur' + (s.pre.err > 1 ? 's' : '') + '.';
    var out = '<div class="stack"><h1>Bilan de la partie</h1>' + ui.yo(msg) +
      '<div class="grid2"><div class="card"><div class="muted small">Place</div><div class="disp" style="font-size:40px">' + G.place + 'e / ' + (G.opts.mtt ? MTT_FIELD : G.players.length) + '</div></div><div class="card"><div class="muted small">Mains jouées / relancées</div><div class="disp" style="font-size:40px">' + vp + ' % · ' + pf + ' %</div></div></div>';
    var good = [], bad = [];
    if (s.pre.n && s.pre.ok / s.pre.n >= 0.8) good.push('Préflop discipliné : ' + Math.round(s.pre.ok / s.pre.n * 100) + ' % de décisions conformes à ton profil.');
    if (pf >= vp * 0.6 && vp > 0) good.push('Tu joues tes mains en relançant plutôt qu’en payant.');
    if (vp > 0 && pf < vp * 0.5) bad.push('Trop de payes préflop : ' + vp + ' % de mains jouées pour ' + pf + ' % relancées.');
    if (s.post.n && s.post.ok < s.post.n) bad.push((s.post.n - s.post.ok) + ' décision' + (s.post.n - s.post.ok > 1 ? 's' : '') + ' après le flop contre la cote (détail plus bas).');
    if (s.sol.bad) bad.push(s.sol.bad + ' écart' + (s.sol.bad > 1 ? 's' : '') + ' avec le solveur au flop (détail plus bas).');
    out += '<div class="card stack"><b>Ce qui était bien</b>' + (good.length ? good.map(function (x) { return '<div>• ' + x + '</div>'; }).join('') : '<div class="muted">Pas assez de mains pour en juger.</div>') + '</div>';
    out += '<div class="card stack"><b>À travailler</b>' + (bad.map(function (x) { return '<div>• ' + x + '</div>'; }).join('') || (s.notes.length ? '<div class="muted">Voir tes écarts ci-dessous.</div>' : '<div class="muted">Rien à signaler.</div>')) + '</div>';
    out += detailBlocks(s, 'g');
    var phs = Object.keys(s.phase);
    if (phs.length) out += '<div class="card stack"><b>Par phase du tournoi (décisions préflop)</b><table class="tbl">' + phs.map(function (k) { return '<tr><td>' + k + '</td><td>' + s.phase[k].ok + ' / ' + s.phase[k].n + '</td></tr>'; }).join('') + '</table></div>';
    if (s.big.length) out += '<div class="card stack"><b>Gros pots</b>' + s.big.slice(-6).map(function (b) { return '<div>Main ' + b.hand + ' : ' + (b.net > 0 ? '+' : '') + PA.fmt(b.net) + (b.cat ? ' (' + b.cat + ')' : '') + '</div>'; }).join('') + '</div>';
    out += '<a class="btn block" href="#mestournois">📈 Mes tournois d’entraînement : ta progression</a>';
    out += '<div class="row"><button class="btn gold" data-gact="again" style="flex:1">Rejouer</button><button class="btn" data-act="nav" data-v="entrainer">Terminer</button></div></div>';
    return out;
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-gact]'); if (!t) return;
    var a = t.getAttribute('data-gact'), v = t.getAttribute('data-v');
    if (a === 'setup') { var k = t.getAttribute('data-k'); SETUP[k] = k === 'chips' || k === 'huChips' || k === 'seats' ? parseInt(v, 10) : (k === 'coach' ? v === 'true' : v); U().render(); }
    else if (a === 'start') { newGame(Object.assign({}, SETUP)); location.hash = '#jeu'; U().render(); }
    else if (a === 'again') { newGame(Object.assign({}, G.opts)); U().render(); }
    else if (a === 'quit') { location.hash = '#partie'; }
    else if (a === 'next') { startHand(); }
    else if (a === 'skip') { G.fast = true; fastForward(); }
    else if (a === 'fold' || a === 'check' || a === 'call') heroAct(a);
    else if (a === 'raise') heroAct('raise', parseInt(v, 10));
    else if (a === 'allin') heroAct('allin');
    else if (a === 'bszSet' && G.bsz) { G.bsz.to = Math.max(G.bsz.min, Math.min(G.bsz.max, parseInt(v, 10))); bszPaint(); }
    else if (a === 'bszStep' && G.bsz) { var stp = G.hand.street === 0 ? G.hand.L.bb : bszStep(); G.bsz.to = Math.max(G.bsz.min, Math.min(G.bsz.max, G.bsz.to + (+v) * stp)); bszPaint(); }
    else if (a === 'bszGo' && G.bsz) { if (G.bsz.to >= G.bsz.max) heroAct('allin'); else heroAct('raise', G.bsz.to); }
    else if (a === 'postSol') { var pn = noteOf(v, 'postNotes'); if (pn && window.PA_APF) window.PA_APF.open({ pos: pn.pos, spot: pn.spot.replace(/-(25|20|60|nit|lag)$/, ''), side: pn.side, d25: pn.d25, flop: pn.flop, hand: pn.hole }); }
    else if (a === 'noteRange') { var nt = noteOf(v, 'notes'); if (nt && window.PA_UI_openRange) window.PA_UI_openRange({ sit: nt.sit, hand: nt.code }); }
    else if (a === 'seat') { var sk = parseInt(v, 10); G.pop = sk < 0 || G.pop === sk ? null : sk; U().render(); }
  });
  function fastForward() {
    // termine la main sans attendre quand le héros est couché
    var H = G.hand; if (!H || H.done) { startHand(); return; }
    var guard = 0;
    while (!H.done && guard++ < 400) {
      if (activeCount() <= 1) { awardUncontested(); break; }
      if (roundDone()) { if (canActCount() <= 1 && activeCount() > 1) { while (H.board.length < 5) { if (H.street < 3) nextStreet(); else break; } showdown(); break; } if (H.street === 3) { showdown(); break; } nextStreet(); continue; }
      var i = H.toAct; if (i < 0) { if (H.street === 3) { showdown(); break; } nextStreet(); continue; }
      var d = botDecide(i);
      if (d[0] === 'raise' && !canRaise(i)) d = ['call'];
      if (d[0] === 'raise') { var minTo = H.cur + H.lastRaise, maxTo = G.players[i].stack + H.bets[i]; var to = Math.max(minTo, d[1]); if (to >= maxTo || maxTo - to < H.L.bb) to = maxTo; if (to <= H.cur) d = ['call']; else { act(i, 'raise', to); H.lastAggressor = i; } }
      if (d[0] === 'call') { if (toCall(i) === 0) act(i, 'check'); else act(i, 'call'); }
      else if (d[0] === 'check') { if (toCall(i) > 0) act(i, 'fold'); else act(i, 'check'); }
      else if (d[0] === 'fold') { if (toCall(i) === 0) act(i, 'check'); else act(i, 'fold'); }
      H.toAct = nextIn(i);
    }
    G.fast = false;
  }

  window.PA_GAME = { dealSound: function (a, b) { dealSound(a, b); },
    views: { partie: setupView, jeu: tableView, mestournois: tourneysView },
    heroRangeCtx: function () { if (!G || !G.hand) return null; var hs = heroSit(); if (G.stats) G.stats.consult++; return hs; },
    _test: { showdown: function () { showdown(); }, solSpot: function () { var M = solSpotFor(G.hand); return M ? { id: M.id, side: M.side } : null; }, canRaise: function (i) { return canRaise(i); }, heroSit: function () { return heroSit(); }, view: function () { return tableView(); }, evalHand: evalHand, equity: equity, handCode: handCode, newGame: function (o) { newGame(o); return G; }, get: function () { return G; }, heroAct: heroAct, fastForward: fastForward, startHand: startHand }
  };
})();
