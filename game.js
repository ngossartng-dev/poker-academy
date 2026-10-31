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
    nit: { name: 'Nit', short: 'Nit', vpip: 0.10, pfr: 0.08, agg: 0.45, bluff: 0.03, sticky: 0.25, limp: 0 },
    reg: { name: 'Régulier', short: 'Régulier', vpip: 0.18, pfr: 0.15, agg: 0.6, bluff: 0.10, sticky: 0.4, limp: 0 },
    lag: { name: 'Large-agressif', short: 'LAG', vpip: 0.28, pfr: 0.22, agg: 0.75, bluff: 0.18, sticky: 0.45, limp: 0 },
    lp: { name: 'Large-passif', short: 'Large-passif', vpip: 0.35, pfr: 0.10, agg: 0.25, bluff: 0.05, sticky: 0.65, limp: 0.6 },
    station: { name: 'Calling station', short: 'Station', vpip: 0.40, pfr: 0.06, agg: 0.15, bluff: 0.02, sticky: 0.9, limp: 0.7 },
    maniac: { name: 'Maniac', short: 'Maniac', vpip: 0.50, pfr: 0.38, agg: 0.9, bluff: 0.32, sticky: 0.5, limp: 0 },
    fan: { name: 'Récréatif fantasque', short: 'Fantasque', vpip: 0.38, pfr: 0.15, agg: 0.45, bluff: 0.14, sticky: 0.55, limp: 0.5, wild: true },
    surv: { name: 'Survivant', short: 'Survivant', vpip: 0.12, pfr: 0.10, agg: 0.5, bluff: 0.04, sticky: 0.3, limp: 0, surv: true }
  };
  var TABLES = {
    club: { name: 'Club', mix: ['fan', 'fan', 'lp', 'lp', 'reg', 'fan', 'station', 'reg'] },
    micro: { name: 'Micro Winamax', mix: ['station', 'nit', 'station', 'lag', 'nit', 'reg', 'station', 'lag'] },
    agressive: { name: 'Agressive', mix: ['lag', 'maniac', 'lag', 'reg', 'maniac', 'lag', 'lag', 'reg'] },
    miroir: { name: 'Miroir', mix: null },
    mixte: { name: 'Huit profils', mix: ['nit', 'reg', 'lag', 'lp', 'station', 'maniac', 'fan', 'surv'] }
  };
  var NAMES = ['Ludo', 'Sabrina', 'Marco', 'Gégé', 'Nadia', 'Bruno', 'Coralie', 'Didier', 'Fanfan', 'Jojo', 'Karine', 'Momo'];

  // rang de force (0 = meilleure) en % des combinaisons
  var PCT = {}; (function () { var acc = 0; PA.D.order.forEach(function (h) { acc += PA.combos(h); PCT[h] = acc / 1326; }); })();

  /* ---------- Structures ---------- */
  var STRUCT = {
    20000: [[100, 200], [150, 300], [200, 400], [250, 500], [300, 600], [400, 800], [500, 1000], [600, 1200], [800, 1600], [1000, 2000], [1250, 2500], [1500, 3000], [2000, 4000], [2500, 5000], [3000, 6000], [4000, 8000], [5000, 10000], [6000, 12000], [8000, 16000], [10000, 20000]],
    3000: [[10, 20], [15, 30], [20, 40], [25, 50], [30, 60], [40, 80], [50, 100], [60, 120], [80, 160], [100, 200], [125, 250], [150, 300], [200, 400], [250, 500], [300, 600], [400, 800], [500, 1000], [600, 1200], [800, 1600], [1000, 2000]]
  };
  var PACE = { normal: 12, semi: 8, turbo: 5 };
  var PAYOUT = { 9: [0.5, 0.3, 0.2], 6: [0.65, 0.35] };

  /* ---------- État de partie ---------- */
  var G = null; // partie en cours
  var SETUP = { format: 'sng9', chips: 20000, pace: 'semi', coach: true, table: 'club', bounty: 'classique' };
  var MTT_FIELD = 100, MTT_PAID = 15;
  var MTT_PAY = [25, 16, 11.5, 8.5, 6.5, 5, 4, 3.2, 2.6, 2.95, 2.95, 2.95, 2.95, 2.95, 2.95];
  var BUYIN = 10;

  function newGame(opts) {
    opts.seats = opts.format === 'sng6' ? 6 : 9;
    opts.mtt = opts.format === 'mtt' || opts.format === 'moments';
    if (opts.mtt) opts.chips = 20000;
    var p = PA.player(), n = opts.seats, players = [], names = NAMES.slice().sort(function () { return Math.random() - 0.5; });
    var mix = TABLES[opts.table].mix;
    if (!mix) { var mp = { nit: 'nit', tag: 'reg', equilibre: 'reg', lag: 'lag', perso: 'reg' }[p.profile || 'tag']; mix = [mp, mp, mp, mp, mp, mp, mp, mp]; }
    mix = mix.slice().sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < n; i++) {
      if (i === 0) players.push({ id: 0, name: p.pseudo, hero: true, prof: null, stack: opts.chips, bounty: startBounty(opts) });
      else players.push({ id: i, name: names[i - 1], hero: false, prof: mix[(i - 1) % mix.length], stack: opts.chips, bounty: startBounty(opts) });
    }
    var field = [];
    if (opts.mtt) for (var f = 0; f < MTT_FIELD - n; f++) field.push({ stack: opts.chips, bounty: startBounty(opts) });
    G = { opts: opts, players: players, button: Math.floor(Math.random() * n), level: 0, handNo: 0, hand: null, log: [], stats: { hands: 0, vpip: 0, pfr: 0, pre: { ok: 0, style: 0, err: 0, n: 0 }, post: { ok: 0, n: 0 }, big: [], consult: 0, notes: [], bountyCash: 0, kos: 0, phase: {}, autoHands: 0 }, over: false, place: null, coachMsg: null, busy: false, field: field, mix: mix, nameIdx: n, names: names, keyMsg: null };
    var pl = PA.player(); pl.last = { route: 'jeu', label: 'Partie en cours' }; PA.save();
    startHand();
  }
  function alive() { return G.players.filter(function (p) { return p.stack > 0; }); }
  function startBounty(opts) { return opts.bounty === 'classique' ? 0 : BUYIN / 2; }
  function remaining() { return alive().length + (G.field ? G.field.filter(function (f) { return f.stack > 0; }).length : 0); }
  function paidPlaces() { return G.opts.mtt ? MTT_PAID : PAYOUT[G.opts.seats].length; }
  function prizeFor(place) { if (G.opts.mtt) { var pool = MTT_FIELD * BUYIN * (G.opts.bounty === 'classique' ? 1 : 0.5); return place <= MTT_PAID ? pool * MTT_PAY[place - 1] / 100 : 0; } var pool2 = G.opts.seats * BUYIN * (G.opts.bounty === 'classique' ? 1 : 0.5); var pp = PAYOUT[G.opts.seats][place - 1]; return pp ? pool2 * pp : 0; }
  function phaseName() {
    var rem = remaining(), paid = paidPlaces(), me = G.players[0], L = levelInfo(), bbs = me.stack / L.bb;
    if (alive().length === 2 && rem === 2) return 'Heads-up';
    if (G.opts.mtt && rem <= 9) return 'Table finale';
    if (rem > paid && rem <= paid + (G.opts.mtt ? 3 : 1)) return 'Bulle';
    if (bbs <= 12) return 'Tapis court';
    if (rem <= paid) return 'Places payées';
    return 'Début et milieu';
  }
  function isKeyMoment() { var ph = phaseName(); return ph !== 'Début et milieu' && ph !== 'Places payées'; }
  // champ virtuel : les autres tables du tournoi
  function simField() {
    if (!G.opts.mtt) return;
    if (remaining() <= 9) return;
    var L = levelInfo(), live = G.field.filter(function (f) { return f.stack > 0; });
    var tables = Math.ceil(live.length / 9);
    for (var t = 0; t < tables; t++) {
      var a = live[Math.floor(Math.random() * live.length)], b = live[Math.floor(Math.random() * live.length)];
      if (!a || !b || a === b || a.stack <= 0 || b.stack <= 0) continue;
      var avg = (MTT_FIELD * G.opts.chips) / Math.max(1, remaining());
      var pBig = 0.025 + Math.min(0.25, 0.6 * L.bb / avg) + (Math.min(a.stack, b.stack) < 12 * L.bb ? 0.15 : 0);
      var amt = Math.random() < pBig ? Math.min(a.stack, b.stack) : Math.round(Math.min(a.stack, b.stack, L.bb * (2 + Math.random() * 6)));
      var w = Math.random() < 0.5 ? a : b, l = w === a ? b : a;
      if (amt >= l.stack && remaining() <= 9) continue;
      w.stack += amt; l.stack -= amt;
      if (l.stack <= 0) { l.stack = 0; w.bounty += l.bounty / 2; }
    }
    live.forEach(function (f) { if (f.stack > 0 && f.stack < L.bb && remaining() > 9) { var others = live.filter(function (o) { return o !== f && o.stack > 0; }); if (others.length) { others[Math.floor(Math.random() * others.length)].stack += f.stack; f.stack = 0; } } });
  }
  function refillSeats() {
    if (!G.opts.mtt) return;
    G.players.forEach(function (p, i) {
      if (i === 0 || p.stack > 0) return;
      var src = G.field.filter(function (f) { return f.stack > 0; });
      if (!src.length) return;
      var f = src[Math.floor(Math.random() * src.length)];
      p.stack = f.stack; p.bounty = f.bounty; f.stack = 0; p.prof = G.mix[Math.floor(Math.random() * G.mix.length)];
      p.name = NAMES[(G.nameIdx++) % NAMES.length] + (G.nameIdx > NAMES.length ? ' ' + Math.ceil(G.nameIdx / NAMES.length) : '');
      p.fresh = true;
    });
  }
  function levelInfo() { var s = STRUCT[G.opts.chips], l = Math.min(G.level, s.length - 1); return { sb: s[l][0], bb: s[l][1], ante: l >= 3 ? s[l][1] : 0, n: l + 1 }; }
  function nextSeat(i) { var n = G.players.length; for (var k = 1; k <= n; k++) { var j = (i + k) % n; if (G.players[j].stack > 0 || (G.hand && G.hand.inHand[j])) return j; } return i; }
  function nextAlive(i) { var n = G.players.length; for (var k = 1; k <= n; k++) { var j = (i + k) % n; if (G.players[j].stack > 0) return j; } return i; }

  function posNames(order) {
    // order : sièges depuis le bouton, dans le sens du jeu (bouton, SB, BB, …)
    var n = order.length, labels = {};
    var map = { 2: ['BTN', 'BB'], 3: ['BTN', 'SB', 'BB'], 4: ['BTN', 'SB', 'BB', 'CO'], 5: ['BTN', 'SB', 'BB', 'UTG', 'CO'], 6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'], 7: ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'HJ', 'CO'], 8: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'LJ', 'HJ', 'CO'], 9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'] };
    var m = map[n]; order.forEach(function (s, i) { labels[s] = m[i]; }); return labels;
  }

  function startHand() {
    var guard = 0;
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
    G.handNo++; if (G.handNo > 1 && (G.handNo - 1) % PACE[G.opts.pace] === 0) G.level++;
    G.button = nextAlive(G.button);
    var L = levelInfo(), d = deck(), n = G.players.length;
    var order = []; var s = G.button; for (var k = 0; k < n; k++) { if (G.players[s].stack > 0) order.push(s); s = (s + 1) % n; }
    var heads = order.length === 2;
    var sbSeat = heads ? order[0] : order[1], bbSeat = heads ? order[1] : order[2];
    var H = { deck: d, board: [], pot: 0, bets: {}, total: {}, inHand: {}, folded: {}, allin: {}, acted: {}, street: 0, cur: 0, lastRaise: L.bb, sb: sbSeat, bbSeat: bbSeat, L: L, pos: posNames(order), order: order, hole: {}, actions: [], heroPre: null, preRaises: 0, opener: null, limpers: 0, showdown: null, winners: null };
    G.hand = H;
    order.forEach(function (i) { H.inHand[i] = true; H.bets[i] = 0; H.total[i] = 0; H.hole[i] = [d.pop(), d.pop()]; });
    // ante (BB ante, payée par la grosse blinde)
    if (L.ante) { var a = Math.min(L.ante, G.players[bbSeat].stack); G.players[bbSeat].stack -= a; H.pot += a; H.total[bbSeat] += a; if (G.players[bbSeat].stack === 0) H.allin[bbSeat] = true; }
    post(sbSeat, L.sb); post(bbSeat, L.bb);
    H.cur = L.bb;
    H.toAct = heads ? sbSeat : nextIn(bbSeat);
    G.stats.hands++;
    H.heroIn = !!H.inHand[0];
    G.coachMsg = null; H.auto = auto; H.phase = phaseName();
  }
  function post(i, amt) { var H = G.hand, p = G.players[i], a = Math.min(amt, p.stack); p.stack -= a; H.bets[i] += a; H.total[i] += a; if (p.stack === 0) H.allin[i] = true; }
  function nextIn(i) { var H = G.hand, n = G.players.length; for (var k = 1; k <= n; k++) { var j = (i + k) % n; if (H.inHand[j] && !H.folded[j] && !H.allin[j]) return j; } return -1; }
  function activeCount() { var H = G.hand; return Object.keys(H.inHand).filter(function (i) { return !H.folded[i]; }).length; }
  function canActCount() { var H = G.hand; return Object.keys(H.inHand).filter(function (i) { return !H.folded[i] && !H.allin[i]; }).length; }
  function toCall(i) { var H = G.hand; return Math.min(H.cur - H.bets[i], G.players[i].stack); }
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
      var raiseBy = to - H.cur; if (raiseBy >= H.lastRaise) { H.lastRaise = raiseBy; H.acted = {}; }
      if (to > H.cur) H.cur = to;
      H.bets[i] = to; rec.amount = to; if (p.stack === 0) H.allin[i] = true;
      if (H.street === 0) { H.preRaises++; if (!H.opener && H.opener !== 0) H.opener = i; }
    }
    if (H.street === 0 && type === 'call' && H.preRaises === 0 && i !== H.bbSeat) H.limpers++;
    H.acted[i] = true; H.actions.push(rec);
    if (i === 0 && H.street === 0 && type !== 'check') { if (type !== 'fold' && !H.vpipCounted) { G.stats.vpip++; H.vpipCounted = true; } if (type === 'raise' && !H.pfrCounted) { G.stats.pfr++; H.pfrCounted = true; } }
  }

  function nextStreet() {
    var H = G.hand;
    Object.keys(H.bets).forEach(function (k) { H.pot += H.bets[k]; H.bets[k] = 0; });
    H.cur = 0; H.lastRaise = H.L.bb; H.acted = {}; H.street++;
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
    var prev = 0, won = {};
    levels.forEach(function (lv) {
      var amt = 0; contrib.forEach(function (c) { amt += Math.max(0, Math.min(c.t, lv) - prev); });
      var elig = live.filter(function (i) { return H.total[i] >= lv; });
      if (!elig.length) elig = live;
      var best = Math.max.apply(null, elig.map(function (i) { return scores[i]; }));
      var ws = elig.filter(function (i) { return scores[i] === best; });
      var share = Math.floor(amt / ws.length), rem = amt - share * ws.length;
      ws.forEach(function (w, idx) { won[w] = (won[w] || 0) + share + (idx === 0 ? rem : 0); });
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
        if (a === 'raise') return hs.sit.type === 'def' ? ['raise', H.cur * 3] : ['raise', H.L.bb * 2.5];
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
  function botDecide(i) {
    var H = G.hand, p = G.players[i], P = OPP[p.prof], L = H.L, tc = toCall(i), bbs = p.stack / L.bb, pot = potTotal();
    var code = handCode(H.hole[i][0], H.hole[i][1]), hp = PCT[code];
    var pos = H.pos[i], late = { CO: 1.5, BTN: 1.9, SB: 1.4, HJ: 1.15, LJ: 1, MP: 0.85, 'UTG+1': 0.75, UTG: 0.7, BB: 1 }[pos] || 1;
    var eff = Math.min(p.stack + H.bets[i], Math.max.apply(null, Object.keys(H.inHand).filter(function (k) { return +k !== i && !H.folded[k]; }).map(function (k) { return G.players[k].stack + H.bets[k]; })));
    var effBB = eff / L.bb, wild = P.wild ? (Math.random() - 0.5) * 0.15 : 0;
    var rem = remaining(), bubble = rem > paidPlaces() && rem <= paidPlaces() + (G.opts.mtt ? 3 : 1);
    if (H.street === 0) {
      // tapis courts : tapis ou fold
      if (effBB <= 15 && H.preRaises === 0) {
        var t = PA.D.pushfold[String(PA.nearestPush(effBB))].push[pos === 'BB' ? 'SB' : pos] || [];
        var push = t.indexOf(code) >= 0 || hp < (P.vpip * 0.9 + wild);
        if (P.surv && bubble) push = hp < 0.08;
        if (push) return ['raise', p.stack + H.bets[i]];
        return tc === 0 ? ['check'] : ['fold'];
      }
      if (H.preRaises === 0) {
        var openP = Math.min(0.6, P.pfr * late + wild);
        if (hp < openP) { var std = G.opts.table === 'club' ? 2 : (L.ante ? 2.2 : 2.5); var sz = L.bb * (P.wild ? [2, 2, 2.5, 3, 4, 5][Math.floor(Math.random() * 6)] : (pos === 'SB' ? 3 : std)) + H.limpers * L.bb; if (P.name === 'Maniac') sz *= 1.4; return ['raise', Math.round(sz)]; }
        if (hp < Math.min(0.7, P.vpip * late + wild) && (P.limp > 0 || i === H.bbSeat)) return tc === 0 ? ['check'] : ['call'];
        return tc === 0 ? ['check'] : ['fold'];
      }
      // face à une relance
      var price = tc / (pot + tc), allInFacing = tc >= p.stack;
      var threeP = P.pfr * 0.22 * (H.preRaises >= 2 ? 0.35 : 1) * (0.7 + P.agg * 0.6);
      var callP = P.vpip * (0.45 + P.sticky * 0.5) * (H.preRaises >= 2 ? 0.35 : 1);
      if (i === H.bbSeat) callP *= 1.3;
      if (bubble && P.surv) { threeP *= 0.4; callP *= 0.4; }
      if (allInFacing || tc >= p.stack * 0.5) { var need = Math.max(0.03, 0.12 - 0.002 * Math.min(40, tc / L.bb) + P.sticky * 0.04); if (P.name === 'Maniac') need += 0.06;
        if (G.opts.bounty !== 'classique' && H.opener !== null && G.players[H.opener] && G.players[H.opener].bounty > 0 && p.stack >= G.players[H.opener].stack) need += 0.07;
        if (bubble && rem > 2) need *= 0.6; return hp < need + (price < 0.35 ? 0.05 : 0) ? ['call'] : ['fold']; }
      if (hp < threeP) { var to = H.cur * (H.preRaises >= 2 ? 2.3 : 3) + (i === H.bbSeat || pos === 'SB' ? H.cur * 0.5 : 0); if (to > (p.stack + H.bets[i]) * 0.4) to = p.stack + H.bets[i]; return ['raise', Math.round(to)]; }
      if (hp < callP) return ['call'];
      return tc === 0 ? ['check'] : ['fold'];
    }
    // après le flop
    var opp = activeCount() - 1, eq = equity(H.hole[i], H.board, Math.max(1, opp), 180);
    var spr = p.stack / Math.max(1, pot);
    if (tc > 0) {
      var po = tc / (pot + tc);
      if (eq > 0.8 && Math.random() < P.agg) return ['raise', Math.min(p.stack + H.bets[i], Math.round(H.cur * 2.8))];
      if (spr < 0.6 && eq > 0.38) return ['call'];
      if (eq + P.sticky * 0.18 > po + 0.03) return ['call'];
      if (Math.random() < P.bluff * 0.25 && tc < pot * 0.5) return ['raise', Math.min(p.stack + H.bets[i], Math.round(H.cur * 3))];
      return ['fold'];
    }
    var betFrac = P.name === 'Maniac' ? (Math.random() < 0.3 ? 1.3 : 0.8) : (P.wild ? [0.25, 0.5, 1, 1.5][Math.floor(Math.random() * 4)] : (eq > 0.75 ? 0.66 : 0.5));
    var size = Math.max(L.bb, Math.round(pot * betFrac));
    if (eq > 0.62 && Math.random() < 0.35 + P.agg * 0.6) return size >= p.stack * 0.8 ? ['raise', p.stack] : ['raise', size];
    var isAggressor = H.lastAggressor === i;
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
  function heroSit() {
    // traduit la situation préflop du héros vers une situation de « Ma range »
    var H = G.hand, L = H.L, pos = H.pos[0], code = handCode(H.hole[0][0], H.hole[0][1]);
    var eff = (G.players[0].stack + H.bets[0]) / L.bb;
    if (H.street !== 0) return null;
    var map9 = { UTG: 'UTG', 'UTG+1': 'UTG+1', MP: 'MP', LJ: 'LJ', HJ: 'HJ', CO: 'CO', BTN: 'BTN', SB: 'SB', BB: 'BB' };
    var p = map9[pos];
    if (H.preRaises === 0 && H.limpers === 0 && p !== 'BB') return { sit: { type: 'open', pos: p, bb: eff > 40 ? 100 : (eff >= 20 ? 30 : eff) }, hand: code };
    if (H.preRaises === 1 && H.opener !== null) {
      var op = map9[H.pos[H.opener]];
      var tc = toCall(0), shove = G.players[H.opener].stack === 0;
      if (shove && (p === 'BB' || p === 'SB' || p === 'BTN')) {
        var key = p + ' vs shove ' + op, d = PA.nearestPush(Math.min(15, eff));
        if ((PA.D.pushfold[String(d)].call[key])) return { sit: { type: 'callshove', pos: p, opener: op, bb: d }, hand: code };
        return null;
      }
      if (PA.POS.indexOf(op) < PA.POS.indexOf(p) && !shove) return { sit: { type: 'def', pos: p, opener: op, bb: eff > 40 ? 100 : 30 }, hand: code };
    }
    return null;
  }
  function coachBefore() {
    var H = G.hand;
    if (H.street === 0) { G.coachMsg = null; return; }
    var opp = activeCount() - 1, eq = equity(H.hole[0], H.board, Math.max(1, opp), 500), tc = toCall(0), pot = potTotal();
    var msg = 'Ta main : <b>' + catName(evalHand(H.hole[0].concat(H.board))) + '</b>. Équité estimée contre ' + opp + ' main' + (opp > 1 ? 's' : '') + ' au hasard : <b>' + Math.round(eq * 100) + ' %</b>.';
    if (tc > 0) { var need = tc / (pot + tc); msg += ' Pour payer ' + PA.fmt(tc) + ', il te faut <b>' + Math.round(need * 100) + ' %</b> (paye ÷ pot après ta paye). Attention : contre une relance, la range adverse est plus forte qu’une main au hasard.'; }
    else msg += ' SPR : ' + String(Math.round(G.players[0].stack / Math.max(1, pot) * 10) / 10).replace('.', ',') + ' (tapis ÷ pot).';
    G.coachMsg = msg;
  }
  function judgeHeroPre(type) {
    var hs = heroSit(); if (!hs) return null;
    var prof = PA.player().profile || 'tag';
    var given = { fold: 'fold', check: 'fold', call: 'call', raise: 'raise', allin: 'allin' }[type];
    if (hs.sit.type === 'open' && given === 'call') given = 'limp';
    var q = { sit: hs.sit, hand: hs.hand, answer: PA.actionFor(prof, hs.sit, hs.hand) };
    var j = PA.judge(prof, q, given);
    return { q: q, given: given, j: j };
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
        if (!r.j.ok) G.stats.notes.push({ hand: G.handNo, code: r.q.hand, sit: r.q.sit, given: r.given, answer: r.q.answer, kind: r.j.kind });
        if (G.opts.coach) G.coachMsg = (r.j.ok ? 'Bonne décision préflop.' : (r.j.kind === 'style' ? 'Écart de style : ton profil jouerait plutôt' : 'Erreur : ici ton profil joue') + ' « ' + U().actName(r.q.answer, r.q.sit) + ' ».' + (r.j.note ? ' ' + r.j.note : ''));
      } else if (G.opts.coach) G.coachMsg = null;
    } else if (G.opts.coach) {
      var tc = toCall(0), pot = potTotal(), eq = equity(H.hole[0], H.board, Math.max(1, activeCount() - 1), 400), need = tc > 0 ? tc / (pot + tc) : 0;
      G.stats.post.n++;
      var good = true, txt = '';
      if (type === 'fold' && tc > 0 && eq > need + 0.15) { good = false; txt = 'Couché avec ' + Math.round(eq * 100) + ' % d’équité alors qu’il en fallait ' + Math.round(need * 100) + ' % : à revoir (sauf lecture précise de l’adversaire).'; }
      else if (type === 'call' && eq < need - 0.12) { good = false; txt = 'Payé avec ' + Math.round(eq * 100) + ' % d’équité pour ' + Math.round(need * 100) + ' % nécessaires : la cote n’y est pas.'; }
      if (good) G.stats.post.ok++;
      G.coachMsg = txt || null;
    }
    if (type === 'fold') act(0, toCall(0) === 0 ? 'check' : 'fold');
    else if (type === 'check') act(0, 'check');
    else if (type === 'call') act(0, toCall(0) === 0 ? 'check' : 'call');
    else {
      var maxTo = G.players[0].stack + H.bets[0], minTo = H.cur + H.lastRaise;
      var to = type === 'allin' ? maxTo : Math.max(minTo, Math.round(amt)); if (to >= maxTo) to = maxTo;
      if (to <= H.cur) act(0, 'call'); else { act(0, 'raise', to); H.lastAggressor = 0; }
    }
    H.toAct = nextIn(0);
    loop();
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
    var fname = { sng9: 'Sit & Go 9 joueurs', sng6: 'Sit & Go 6 joueurs', mtt: 'Tournoi 100 joueurs', moments: 'Moments clés' }[G.opts.format] + (G.opts.bounty !== 'classique' ? ' ' + (G.opts.bounty === 'pko' ? 'PKO' : 'Space KO') : '');
    pl.sessions.unshift({ at: Date.now(), label: fname + ' (' + TABLES[G.opts.table].name + ') · ' + G.place + 'e', n: s.pre.n, ok: s.pre.ok, style: s.pre.style, err: s.pre.err, consult: s.consult });
    pl.last = null; PA.save();
    U().render();
  }

  /* ---------- Vues ---------- */
  function setupView() {
    var ui = U(), p = PA.player();
    function seg(key, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (SETUP[key] === o[0] ? 'on' : '') + '" data-gact="setup" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="entrainer">‹ S’entraîner</button><h1>Jouer une partie</h1>' +
      (G && !G.over ? '<button class="big-cta" data-act="nav" data-v="jeu"><div><div class="disp">Reprendre la partie</div><div style="font-weight:500">Main ' + G.handNo + ' · niveau ' + levelInfo().n + '</div></div></button>' : '') +
      '<div class="card stack"><b>Format</b>' + seg('format', [['sng9', 'Sit & Go 9 joueurs'], ['sng6', 'Sit & Go 6 joueurs'], ['mtt', 'Tournoi 100 joueurs'], ['moments', 'Moments clés']]) +
      (SETUP.format === 'moments' ? '<div class="small muted">Tournoi de 100 joueurs : les mains sans enjeu sont jouées automatiquement selon ta range, tu ne joues que la bulle, les tapis courts, la table finale et le heads-up.</div>' : '') +
      (SETUP.format === 'sng9' || SETUP.format === 'sng6' ? '<b>Jetons de départ</b>' + seg('chips', [[20000, '20 000'], [3000, '3 000']]) : '<div class="small muted">Tournoi : 20 000 jetons de départ, 15 places payées.</div>') +
      '<b>Primes</b>' + seg('bounty', [['classique', 'Classique'], ['pko', 'PKO'], ['space', 'Space KO']]) +
      '<b>Rythme des blindes</b>' + seg('pace', [['normal', 'Normal'], ['semi', 'Semi-turbo'], ['turbo', 'Turbo']]) +
      '<b>Adversaires</b>' + seg('table', Object.keys(TABLES).map(function (k) { return [k, TABLES[k].name]; })) +
      '<b>Coach</b>' + seg('coach', [[true, 'Avec Yo'], [false, 'Sans coach (bilan à la fin)']]) +
      '<button class="btn gold block" data-gact="start">Lancer la partie</button></div>' +
      '</div>';
    return ui.shell('entrainer', body);
  }
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
  function bbTxt(x) { var H = G.hand; return String(Math.round(x / H.L.bb * 10) / 10).replace('.', ','); }
  function tableView() {
    var ui = U();
    if (!G) { location.hash = '#partie'; return ''; }
    if (G.over) return ui.shell('entrainer', bilanView(), true);
    var H = G.hand, n = G.players.length, L = H.L;
    var narrow = (window.innerWidth || 1000) < 700, RX = narrow ? 40 : 44, RY = narrow ? 41 : 42;
    var theme = (window.PA.player().settings || {}).tableTheme || 'vert';
    var h = '<div class="felt2 t-' + theme + '"><div class="rail"></div>';
    for (var k = 0; k < n; k++) {
      var p = G.players[k], a = SEATPOS9(k, n), x = 50 + RX * Math.cos(a), y = 50 + RY * Math.sin(a);
      var inH = H.inHand[k], fold = H.folded[k], out = p.stack <= 0 && !inH;
      var showCards = k === 0 || (H.done && H.showdown && inH && !fold);
      var nm = k === 0 ? 'Toi' : p.name;
      h += '<button class="seat2' + (k === 0 ? ' hero' : '') + ((fold || out) ? ' out' : '') + (H.toAct === k && !H.done ? ' turn' : '') + '" data-gact="seat" data-v="' + k + '" style="left:' + x + '%;top:' + y + '%">';
      if (inH && !fold && k !== 0) h += '<span class="mc">' + (showCards ? cardSmall(H.hole[k][0]) + cardSmall(H.hole[k][1]) : cardSmall(0, true) + cardSmall(0, true)) + '</span>';
      h += '<span class="av">' + ui.esc(nm.charAt(0).toUpperCase()) + '</span><span class="nm2">' + ui.esc(nm) + '</span><span class="ps' + (k === G.button ? ' btn-d' : '') + '">' + (H.pos[k] || '') + '</span>' +
        '<span class="st2">' + (out ? 'Éliminé' : (H.allin[k] ? 'Tapis' : PA.fmt(p.stack))) + '</span>';
      if (G.opts.bounty !== 'classique' && !out) h += '<span class="bty">' + (G.opts.bounty === 'space' && k !== 0 ? '?' : p.bounty.toFixed(0) + ' €') + '</span>';
      h += '</button>';
      if (H.bets[k]) { var bx = 50 + RX * 0.62 * Math.cos(a), by = 50 + RY * 0.6 * Math.sin(a); h += '<div class="bet2" style="left:' + bx + '%;top:' + by + '%">' + PA.fmt(H.bets[k]) + '</div>'; }
    }
    h += '<div class="pot2">Pot ' + PA.fmt(potTotal()) + ' <small>' + bbTxt(potTotal()) + ' BB</small></div>';
    h += '<div class="board2">' + [0, 1, 2, 3, 4].map(function (i) { return H.board[i] !== undefined ? cardMid(H.board[i]) : '<div class="slot"></div>'; }).join('') + '</div>';
    if (H.inHand[0] && !H.folded[0]) h += '<div class="mine2">' + H.hole[0].map(cardMid).join('') + '</div>';
    if (G.pop !== undefined && G.pop !== null && G.players[G.pop]) {
      var q = G.players[G.pop];
      h += '<div class="pop2" data-gact="seat" data-v="-1"><b>' + ui.esc(G.pop === 0 ? 'Toi' : q.name) + '</b> · ' + (H.pos[G.pop] || '') + '<br>' + PA.fmt(q.stack) + ' (' + bbTxt(q.stack) + ' BB)' +
        (G.pop !== 0 && G.opts.coach ? '<br><span style="color:var(--gold)">' + OPP[q.prof].name + '</span>' : '') +
        (G.opts.bounty !== 'classique' ? '<br>Prime : ' + (G.opts.bounty === 'space' && G.pop !== 0 ? 'mystère' : q.bounty.toFixed(2).replace('.', ',') + ' €') + (G.pop === 0 && G.stats.bountyCash ? ' · gagné ' + G.stats.bountyCash.toFixed(2).replace('.', ',') + ' €' : '') : '') + '<br><span class="small muted">Toucher pour fermer</span></div>';
    }
    h += '</div>';
    var info = '<div class="small muted" style="text-align:center">Niveau ' + L.n + ' · blindes ' + PA.fmt(L.sb) + ' / ' + PA.fmt(L.bb) + (L.ante ? ' · ante ' + PA.fmt(L.ante) + ' (BB ante)' : '') + ' · main ' + G.handNo + ' · ' + (G.opts.mtt ? remaining() + ' / ' + MTT_FIELD + ' joueurs, ' + MTT_PAID + ' payés' : alive().length + ' joueurs') + (G.stats.autoHands ? ' · ' + G.stats.autoHands + ' mains jouées automatiquement' : '') + (G.opts.bounty !== 'classique' ? ' · <b style="color:#4fe08f">primes gagnées : ' + G.stats.bountyCash.toFixed(2).replace('.', ',') + ' € (' + G.stats.kos + ' élimination' + (G.stats.kos > 1 ? 's' : '') + ')</b>' : '') + '</div>' +
      (G.keyMsg ? U().yo(G.keyMsg) : '');
    var top = '<div class="drill-top"><button class="back" data-gact="quit">‹ Quitter</button><span class="muted small">' + { sng9: 'Sit &amp; Go', sng6: 'Sit &amp; Go 6', mtt: 'Tournoi', moments: 'Moments clés' }[G.opts.format] + (G.opts.bounty !== 'classique' ? (G.opts.bounty === 'pko' ? ' PKO' : ' Space KO') : '') + ' · ' + TABLES[G.opts.table].name + '</span><button class="rbtn" data-act="range" aria-label="Ouvrir ma range">Ma range</button></div>';
    var me = G.players[0];
    var mine = H.inHand[0] ? '<div class="small" style="text-align:center">Ton tapis : <b>' + PA.fmt(me.stack) + '</b> (' + bbTxt(me.stack) + ' BB)' + (H.board.length && !H.folded[0] ? ' · ' + catName(evalHand(H.hole[0].concat(H.board))) : '') + '</div>' : '';
    var bottom = '';
    if (H.done) {
      var ws = Object.keys(H.winners).map(function (w) { return (w === '0' ? 'Tu gagnes' : G.players[w].name + ' gagne') + ' ' + PA.fmt(H.winners[w]) + (H.showdown && H.scores ? ' (' + catName(H.scores[w]) + ')' : ''); }).join(' · ');
      bottom = '<div class="banner">' + ws + (H.koMsg ? '<br><b>' + H.koMsg + '</b>' : '') + '</div>' + (G.coachMsg && G.opts.coach ? ui.yo(G.coachMsg) : '') + '<button class="btn gold block" data-gact="next">Main suivante</button>';
    } else if (H.toAct === 0) {
      var tc = toCall(0), pot = potTotal(), maxTo = me.stack + H.bets[0], minTo = H.cur + H.lastRaise;
      var btns = [];
      btns.push(['fold', tc === 0 ? 'Parole' : 'Se coucher', 'a-fold', tc === 0 ? 'check' : 'fold']);
      if (tc > 0) btns.push(['call', 'Payer ' + PA.fmt(tc), 'a-call', 'call']);
      else if (btns[0][0] === 'fold') { }
      var sizes = [];
      if (H.street === 0) {
        if (H.cur <= L.bb && H.limpers > 0) sizes = [[(3 + H.limpers) * L.bb, String(3 + H.limpers) + ' BB'], [(4 + H.limpers) * L.bb, String(4 + H.limpers) + ' BB']];
        else if (H.cur <= L.bb) sizes = [[2 * L.bb, '2 BB'], [2.2 * L.bb, '2,2 BB'], [2.5 * L.bb, '2,5 BB'], [3 * L.bb, '3 BB']];
        else sizes = [[H.cur * 3, '×3'], [H.cur * 2.5, '×2,5']];
      } else {
        if (H.cur === 0) sizes = [[pot / 3, '1/3 pot'], [pot / 2, '1/2 pot'], [pot * 2 / 3, '2/3 pot'], [pot, 'Pot']];
        else sizes = [[H.cur * 2.5, '×2,5'], [H.cur * 3, '×3']];
      }
      var raiseBtns = sizes.filter(function (s) { return s[0] >= minTo && s[0] < maxTo; }).map(function (s) { return '<button class="a-raise" data-gact="raise" data-v="' + Math.round(s[0]) + '">' + (H.cur > 0 && H.street > 0 ? 'Relancer ' : (H.street === 0 && H.cur > L.bb ? 'Relancer ' : (H.street === 0 ? (H.limpers > 0 ? 'Isoler ' : 'Ouvrir ') : 'Miser '))) + s[1] + '</button>'; });
      if (maxTo > H.cur) raiseBtns.push('<button class="a-three" data-gact="allin">Tapis (' + PA.fmt(me.stack) + ')</button>');
      bottom = (G.opts.coach && G.coachMsg ? ui.yo(G.coachMsg) : '') + '<div class="actions" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + btns.map(function (b) { return '<button class="' + b[2] + '" style="color:#fff" data-gact="' + b[3] + '">' + b[1] + '</button>'; }).join('') + '</div><div class="actions" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + raiseBtns.join('') + '</div>';
    } else {
      bottom = (G.opts.coach && G.coachMsg ? ui.yo(G.coachMsg) : '') + '<div class="banner muted" style="text-align:center">' + (H.inHand[0] && !H.folded[0] ? 'Au tour de ' + ui.esc(G.players[H.toAct] ? G.players[H.toAct].name : '…') + '…' : 'Tu t’es couché. La main continue…') + '</div>' + (H.folded[0] || !H.inHand[0] ? '<button class="btn block" data-gact="skip">Passer à la main suivante</button>' : '');
    }
    return ui.shell('entrainer', '<div class="stack">' + top + info + h + mine + bottom + '</div>', true);
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
    if (s.post.n && s.post.ok < s.post.n) bad.push((s.post.n - s.post.ok) + ' décision' + (s.post.n - s.post.ok > 1 ? 's' : '') + ' après le flop contre la cote (paye trop chère ou couché avec beaucoup d’équité).');
    out += '<div class="card stack"><b>Ce qui était bien</b>' + (good.length ? good.map(function (x) { return '<div>• ' + x + '</div>'; }).join('') : '<div class="muted">Pas assez de mains pour en juger.</div>') + '</div>';
    out += '<div class="card stack"><b>À travailler</b>' + (bad.concat(s.notes.slice(0, 8).map(function (n) { return 'Main ' + n.hand + ' : ' + n.code + ', ' + ui.describeSit(n.sit) + ' → ' + ui.actName(n.answer, n.sit) + (n.kind === 'style' ? ' (écart de style)' : ''); })).map(function (x) { return '<div>• ' + x + '</div>'; }).join('') || '<div class="muted">Rien à signaler.</div>') + '</div>';
    var phs = Object.keys(s.phase);
    if (phs.length) out += '<div class="card stack"><b>Par phase du tournoi (décisions préflop)</b><table class="tbl">' + phs.map(function (k) { return '<tr><td>' + k + '</td><td>' + s.phase[k].ok + ' / ' + s.phase[k].n + '</td></tr>'; }).join('') + '</table></div>';
    if (s.big.length) out += '<div class="card stack"><b>Gros pots</b>' + s.big.slice(-6).map(function (b) { return '<div>Main ' + b.hand + ' : ' + (b.net > 0 ? '+' : '') + PA.fmt(b.net) + (b.cat ? ' (' + b.cat + ')' : '') + '</div>'; }).join('') + '</div>';
    out += '<div class="row"><button class="btn gold" data-gact="again" style="flex:1">Rejouer</button><button class="btn" data-act="nav" data-v="entrainer">Terminer</button></div></div>';
    return out;
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-gact]'); if (!t) return;
    var a = t.getAttribute('data-gact'), v = t.getAttribute('data-v');
    if (a === 'setup') { var k = t.getAttribute('data-k'); SETUP[k] = k === 'chips' ? parseInt(v, 10) : (k === 'coach' ? v === 'true' : v); U().render(); }
    else if (a === 'start') { newGame(Object.assign({}, SETUP)); location.hash = '#jeu'; U().render(); }
    else if (a === 'again') { newGame(Object.assign({}, G.opts)); U().render(); }
    else if (a === 'quit') { location.hash = '#partie'; }
    else if (a === 'next') { startHand(); }
    else if (a === 'skip') { G.fast = true; fastForward(); }
    else if (a === 'fold' || a === 'check' || a === 'call') heroAct(a);
    else if (a === 'raise') heroAct('raise', parseInt(v, 10));
    else if (a === 'allin') heroAct('allin');
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
      if (d[0] === 'raise') { var minTo = H.cur + H.lastRaise, maxTo = G.players[i].stack + H.bets[i]; var to = Math.max(minTo, d[1]); if (to >= maxTo || maxTo - to < H.L.bb) to = maxTo; if (to <= H.cur) d = ['call']; else { act(i, 'raise', to); H.lastAggressor = i; } }
      if (d[0] === 'call') { if (toCall(i) === 0) act(i, 'check'); else act(i, 'call'); }
      else if (d[0] === 'check') { if (toCall(i) > 0) act(i, 'fold'); else act(i, 'check'); }
      else if (d[0] === 'fold') { if (toCall(i) === 0) act(i, 'check'); else act(i, 'fold'); }
      H.toAct = nextIn(i);
    }
    G.fast = false;
  }

  window.PA_GAME = {
    views: { partie: setupView, jeu: tableView },
    heroRangeCtx: function () { if (!G || !G.hand) return null; var hs = heroSit(); if (G.stats) G.stats.consult++; return hs; },
    _test: { evalHand: evalHand, equity: equity, handCode: handCode, newGame: function (o) { newGame(o); return G; }, get: function () { return G; }, heroAct: heroAct, fastForward: fastForward, startHand: startHand }
  };
})();
