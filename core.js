/* Poker Academy v2.0 — cœur : données, ranges, stockage, moteur de questions */
(function () {
  'use strict';
  var D = window.PA_DATA;
  var RANKS = 'AKQJT98765432';
  var POS = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  var POS_LABEL = { 'UTG': 'UTG', 'UTG+1': 'UTG+1', 'MP': 'UTG+2 (MP)', 'LJ': 'LJ', 'HJ': 'HJ', 'CO': 'CO', 'BTN': 'Bouton', 'SB': 'SB', 'BB': 'BB' };
  var PUSH_DEPTHS = [15, 12, 10, 8, 5, 3];
  var PROFILES = {
    nit: { id: 'nit', name: 'Très serré', short: 'Nit', vpip: '~10-13 %', desc: 'Prudent, peu de bluffs. Ranges « tight » du livre.' },
    tag: { id: 'tag', name: 'Serré-agressif', short: 'TAG', vpip: '~16-20 %', desc: 'Le standard solide en tournoi. Recommandé.', reco: true },
    equilibre: { id: 'equilibre', name: 'Équilibré', short: 'Équilibré', vpip: '~20-24 %', desc: 'Plus de vols et de défenses.' },
    lag: { id: 'lag', name: 'Large-agressif', short: 'LAG', vpip: '~26-32 %', desc: 'Met la pression, demande de l’expérience.' },
    perso: { id: 'perso', name: 'Personnalisé', short: 'Perso', vpip: '—', desc: 'Part du profil TAG ; vous modifiez les cases.' }
  };
  var BASE_PROFILES = ['nit', 'tag', 'equilibre', 'lag'];

  function allHands() {
    var out = [];
    for (var i = 0; i < 13; i++) for (var j = 0; j < 13; j++) {
      if (i === j) out.push(RANKS[i] + RANKS[j]);
      else if (i < j) out.push(RANKS[i] + RANKS[j] + 's');
      else out.push(RANKS[j] + RANKS[i] + 'o');
    }
    return out;
  }
  var HANDS = allHands();
  function combos(h) { return h.length === 2 ? 6 : (h[2] === 's' ? 4 : 12); }
  function pct(list) { var n = 0; list.forEach(function (h) { n += combos(h); }); return Math.round(n / 1326 * 1000) / 10; }
  function toSet(list) { var s = {}; (list || []).forEach(function (h) { s[h] = true; }); return s; }
  var ORDER_IDX = {}; D.order.forEach(function (h, i) { ORDER_IDX[h] = i; });

  /* ---------- Stockage ---------- */
  var KEY = 'pa2';
  var mem = null;
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { mem = null; }
    if (!mem || !mem.players) mem = { players: {}, current: null, v: 2 };
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} }
  function player() { var s = load(); return s.current ? s.players[s.current] : null; }
  function newPlayer(pseudo, age) {
    var s = load(); var id = 'p' + Date.now();
    s.players[id] = { id: id, pseudo: pseudo, age: age, profile: null, created: Date.now(), perso: {}, notions: {}, srs: {}, sessions: [], consult: 0, settings: { text: 1, chrono: false, vibrate: true }, testDone: false, last: null };
    s.current = id; save(); return s.players[id];
  }
  function wipeAll() { try { localStorage.removeItem(KEY); } catch (e) {} mem = null; }
  function wipeTraining(p) { p.notions = {}; p.srs = {}; p.sessions = []; p.consult = 0; p.last = null; save(); }

  /* ---------- Ranges ---------- */
  function prof(id) { return D.profiles[id === 'perso' ? 'tag' : id]; }
  function depthKey(bb) { return bb > 40 ? 'deep' : (bb >= 20 ? 'mid' : 'push'); }
  function nearestPush(bb) { var best = 15; PUSH_DEPTHS.forEach(function (d) { if (Math.abs(d - bb) < Math.abs(best - bb)) best = d; }); return best; }
  // situation : {type:'open'|'def'|'vs3bet'|'push'|'callshove', pos, opener, bb, scen}
  /* Petite blinde qui ouvre, grosse blinde qui sur-relance (blinde contre blinde).
     La BB 3-bet large contre la SB : on défend plus large qu'au CO face au bouton, mais hors de position, donc on paie surtout
     les mains qui jouent bien après le flop. Chaque liste est ensuite croisée avec l'ouverture SB du profil. */
  function expand(spec) {
    var out = [], R = 'AKQJT98765432';
    spec.split(',').forEach(function (t) {
      t = t.trim(); if (!t) return;
      var m = t.match(/^([AKQJT2-9])([AKQJT2-9])([so]?)(\+|-([AKQJT2-9])([AKQJT2-9])[so]?)?$/); if (!m) return;
      var a = m[1], b = m[2], k = m[3];
      if (a === b) { // paires
        if (m[4] === '+') { for (var i = R.indexOf(a); i >= 0; i--) out.push(R[i] + R[i]); }
        else if (m[5]) { for (var j = R.indexOf(a); j <= R.indexOf(m[5]); j++) out.push(R[j] + R[j]); }
        else out.push(a + b);
      } else {
        if (m[4] === '+') { for (var x = R.indexOf(b); x > R.indexOf(a); x--) out.push(a + R[x] + k); }
        else if (m[6]) { for (var y = R.indexOf(b); y <= R.indexOf(m[6]); y++) out.push(a + R[y] + k); }
        else out.push(a + b + k);
      }
    });
    return out;
  }
  var BVB = {
    nit: { fourbet: 'QQ+,AKs,AKo', call: 'JJ-99,AQs,AJs,KQs,AQo' },
    tag: { fourbet: 'QQ+,AKs,AKo,A5s,A4s', call: 'JJ-66,AQs-ATs,KQs-KJs,QJs,JTs,T9s,98s,AQo-AJo,KQo' },
    equilibre: { fourbet: 'QQ+,AKs,AKo,AQs,A5s,A4s,K9s', call: 'JJ-55,AJs-A8s,KQs-KTs,QJs-QTs,JTs-J9s,T9s,98s,87s,AQo-ATo,KQo-KJo' },
    lag: { fourbet: 'JJ+,AKs,AKo,AQs,A5s-A3s,K9s,K8s,Q9s', call: 'TT-44,AJs-A6s,KQs-KTs,QJs-QTs,JTs-J9s,T9s-T8s,98s,87s,76s,65s,AQo-ATo,KQo-KJo,QJo' }
  };
  function bvbChart(profileId, P) {
    var key = Object.keys(D.profiles).filter(function (k) { return D.profiles[k] === P; })[0] || profileId;
    var t = BVB[key] || BVB.tag, open = toSet(P.open.deep.SB || []);
    return { fourbet: expand(t.fourbet).filter(function (h) { return open[h]; }), call: expand(t.call).filter(function (h) { return open[h]; }) };
  }
  /* ---------- La bulle (et les paliers de paiement) ----------
     s.bubble = 'gros' | 'moyen' | 'court' : ton tapis par rapport aux autres à l'approche des places payées.
     Moyen tapis : c'est lui qui subit le plus l'ICM (bubble factor 1,5 à 2) → il resserre surtout ses payes et ses ouvertures
     de début de table, et jette les mains « spéculatives » (petites paires, assorties, as faibles) qui gagnent peu et perdent gros.
     Gros tapis : il met la pression → il ouvre et sur-relance plus large en fin de table, paie à peine moins.
     Petit tapis : il joue tapis ou fold, pousse encore et paie un peu moins large. */
  var LADDER = ['nit', 'tag', 'equilibre', 'lag'];
  var SPEC = toSet(expand('22-66,A2s-A9s,K2s-K9s,Q2s-Q9s,J2s-J9s,T2s-T8s,92s-98s,82s-87s,72s-76s,62s-65s,52s-54s,42s-43s,32s,A2o-A9o,K2o-KTo,Q2o-QTo,J2o-JTo,T2o-T9o,92o-98o,82o-87o,72o-76o,62o-65o,52o-54o,42o-43o,32o'));
  var VALUE3 = toSet(expand('JJ+,AKs,AKo,AQs')), VALUE3D = toSet(expand('99+,AKs,AKo,AQs,AQo,AJs,KQs'));
  function baseProfile(profileId) {
    if (LADDER.indexOf(profileId) >= 0) return profileId;
    var p = player(); return (p && p.persoFrom && LADDER.indexOf(p.persoFrom.base) >= 0) ? p.persoFrom.base : 'tag';
  }
  function step(profileId, d) { var i = LADDER.indexOf(baseProfile(profileId)); return LADDER[Math.max(0, Math.min(3, i + d))]; }
  function keepTop(list, frac) { var L = list.slice().sort(function (a, b) { return ORDER_IDX[a] - ORDER_IDX[b]; }); return toSet(L.slice(0, Math.max(1, Math.round(L.length * frac)))); }
  function bubbleChart(profileId, s, base) {
    var k = s.bubble, out = {}, h, s0 = {}; for (h in base) out[h] = base[h];
    for (var key in s) if (key !== 'bubble') s0[key] = s[key];
    var early = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ'].indexOf(s.pos) >= 0, late = ['CO', 'BTN', 'SB'].indexOf(s.pos) >= 0;
    if (s.type === 'open' && depthKey(s.bb) !== 'push') {
      if (k === 'moyen') {
        if (early || s.pos === 'CO') { var t = chart(step(profileId, -1), s0); HANDS.forEach(function (x) { if (out[x] !== 'fold' && t[x] === 'fold') out[x] = 'fold'; }); }
        HANDS.forEach(function (x) { if (out[x] !== 'fold' && SPEC[x] && early && !/^(77|88|99|A[TJQK]s|K[QJT]s|QJs)$/.test(x)) out[x] = 'fold'; });
        if (s.pos === 'BTN' || s.pos === 'SB') HANDS.forEach(function (x) { if (out[x] !== 'fold' && /o$/.test(x) && SPEC[x] && !/^A[5-9]o$/.test(x)) out[x] = 'fold'; });
      } else if (k === 'gros' && late) { var w = chart(step(profileId, 1), s0); HANDS.forEach(function (x) { if (out[x] === 'fold' && w[x] !== 'fold') out[x] = w[x]; }); }
    } else if (s.type === 'def') {
      if (k === 'moyen') {
        var t2 = chart(step(profileId, -1), s0);
        HANDS.forEach(function (x) {
          if (out[x] === 'call' && (t2[x] === 'fold' || SPEC[x])) out[x] = 'fold';
          if ((out[x] === 'raise' || out[x] === 'allin') && !VALUE3D[x]) out[x] = 'fold'; // fini les 3-bets de bluff : on garde les sur-relances de valeur
        });
      } else if (k === 'court') {
        HANDS.forEach(function (x) { if (out[x] === 'call') out[x] = VALUE3[x] || /^(TT|99|AQo|AJs|KQs)$/.test(x) ? 'allin' : 'fold'; else if (out[x] === 'raise') out[x] = 'allin'; });
      } else if (k === 'gros' && late) {
        HANDS.forEach(function (x) { if (out[x] === 'call' && SPEC[x] && /o$/.test(x)) out[x] = 'fold'; });
      }
    } else if (s.type === 'callshove') {
      var calls = HANDS.filter(function (x) { return out[x] === 'call'; }), keep = keepTop(calls, k === 'moyen' ? 0.55 : k === 'gros' ? 0.85 : 0.75);
      calls.forEach(function (x) { if (!keep[x]) out[x] = 'fold'; });
    } else if (s.type === 'vs3bet') {
      if (k === 'moyen') HANDS.forEach(function (x) { if (out[x] === 'fourbet' && !/^(AA|KK|QQ|AKs|AKo)$/.test(x)) out[x] = /^(JJ|TT|AQs)$/.test(x) ? 'call' : 'fold'; else if (out[x] === 'call' && !/^(JJ|TT|99|AQs|AJs|KQs|AQo)$/.test(x)) out[x] = 'fold'; });
      else if (k === 'court') HANDS.forEach(function (x) { if (out[x] === 'fourbet') out[x] = 'allin'; else if (out[x] === 'call') out[x] = /^(JJ|TT|AQs|AQo)$/.test(x) ? 'allin' : 'fold'; });
    }
    return out;
  }
  var BUBBLE_NAME = { gros: 'gros tapis', moyen: 'tapis moyen', court: 'petit tapis' };
  function sitKey(s) { return (s.bubble ? 'bulle-' + s.bubble + '|' : '') + [s.type, s.pos || '', s.opener || '', s.type === 'push' || s.type === 'callshove' ? nearestPush(s.bb) : depthKey(s.bb), s.scen || ''].join('|'); }
  function shoveKey(pos, opener) { return pos + ' vs shove ' + opener; }
  function chart(profileId, s) {
    // renvoie {hand: action} avec action ∈ raise, call, fold, allin, fourbet
    var P = prof(profileId), out = {}, i;
    HANDS.forEach(function (h) { out[h] = 'fold'; });
    var dk = depthKey(s.bb);
    if (s.type === 'open') {
      if (dk === 'push') { var t = D.pushfold[String(nearestPush(s.bb))].push[s.pos] || []; t.forEach(function (h) { out[h] = 'allin'; }); }
      else { (P.open[dk][s.pos] || []).forEach(function (h) { out[h] = 'raise'; }); }
    } else if (s.type === 'def') {
      var src;
      if (s.pos === 'BB') src = P.bb.deep[s.opener];
      else src = (P.vsOpen.deep[s.pos] || {})[s.opener];
      if (src) {
        var callL = src.call, raiseL = src.raise;
        if (dk === 'mid') {
          raiseL = P.mid3b[s.pos === 'BB' ? 'SB' : s.pos] && P.mid3b[s.pos === 'BB' ? 'SB' : s.pos].length ? P.mid3b[s.pos === 'BB' ? 'SB' : s.pos] : src.raise;
          var rs = toSet(raiseL);
          callL = src.call.filter(function (h) { return !rs[h]; }).sort(function (a, b) { return ORDER_IDX[a] - ORDER_IDX[b]; });
          callL = callL.slice(0, Math.round(callL.length * 0.8));
        }
        callL.forEach(function (h) { out[h] = 'call'; });
        raiseL.forEach(function (h) { out[h] = dk === 'mid' && s.bb <= 30 ? 'allin' : 'raise'; }); // 20-30 BB : 3-bet à tapis ; 31-40 BB : 3-bet normal (chapitre 41)
      }
    } else if (s.type === 'vs3bet') {
      var v = s.scen === 'bvb' ? (P.vs3bet.bvb || bvbChart(profileId, P)) : P.vs3bet[s.scen || 'ip'];
      v.call.forEach(function (h) { out[h] = 'call'; });
      v.fourbet.forEach(function (h) { out[h] = 'fourbet'; });
    } else if (s.type === 'callshove') {
      var c = D.pushfold[String(nearestPush(s.bb))].call[shoveKey(s.pos, s.opener)] || [];
      c.forEach(function (h) { out[h] = 'call'; });
    } else if (s.type === 'push') {
      (D.pushfold[String(nearestPush(s.bb))].push[s.pos] || []).forEach(function (h) { out[h] = 'allin'; });
    }
    if (profileId === 'perso') {
      var p = player(), s1 = s; if (s.bubble) { s1 = {}; for (var kk in s) if (kk !== 'bubble') s1[kk] = s[kk]; } var ov = p && p.perso && p.perso[sitKey(s1)]; // ta range Perso, puis l'effet de la bulle
      if (ov) for (i in ov) out[i] = ov[i];
    }
    if (s.bubble) return bubbleChart(profileId, s, out);
    return out;
  }
  function actionFor(profileId, s, hand) { return chart(profileId, s)[hand]; }
  function firstOpenPos(profileId) {
    // pour la vue globale : position la plus précoce qui ouvre la main (40 BB et plus)
    var out = {};
    HANDS.forEach(function (h) {
      for (var i = 0; i < 8; i++) {
        var a = actionFor(profileId, { type: 'open', pos: POS[i], bb: 100 }, h);
        if (a === 'raise') { out[h] = i; return; }
      }
      out[h] = -1;
    });
    return out;
  }
  // liste des situations valides
  function validOpeners(pos) { var i = POS.indexOf(pos); return POS.slice(0, Math.min(i, 8)); }
  function shoveSituations(bb) { return Object.keys(D.pushfold[String(nearestPush(bb))].call); }

  /* ---------- Notions et niveau adaptatif ---------- */
  var NOTIONS = {
    open_early: 'Ouvrir en début de table', open_mid: 'Ouvrir en milieu de table', open_late: 'Ouvrir en fin de table',
    open_sb: 'Ouvrir de la petite blinde', bb_def: 'Défendre la grosse blinde', cold: 'Face à une relance (hors BB)',
    vs3bet: 'Face à un 3-bet', push: 'Tapis ou fold (moins de 20 BB)', callshove: 'Payer un tapis', mid: 'Tapis de 20 à 40 BB', bulle: 'Jouer la bulle'
  };
  function notionOf(s) {
    if (s.bubble) return 'bulle';
    if (s.type === 'push') return 'push';
    if (s.type === 'callshove') return 'callshove';
    if (s.type === 'vs3bet') return 'vs3bet';
    if (depthKey(s.bb) === 'mid') return 'mid';
    if (s.type === 'def') return s.pos === 'BB' ? 'bb_def' : 'cold';
    var i = POS.indexOf(s.pos);
    if (s.pos === 'SB') return 'open_sb';
    return i <= 2 ? 'open_early' : (i <= 4 ? 'open_mid' : 'open_late');
  }
  function notionState(p, n) { if (!p.notions[n]) p.notions[n] = { r: 1350, n: 0, ok: 0 }; return p.notions[n]; }
  function level(r) { return Math.max(1, Math.min(5, Math.round((r - 1150) / 100))); }
  function updateNotion(p, n, diff, score) {
    var st = notionState(p, n);
    var exp = 1 / (1 + Math.pow(10, (diff - st.r) / 400));
    st.r = Math.round(st.r + 28 * (score - exp)); st.n++; if (score >= 1) st.ok++;
  }

  /* ---------- Répétition espacée ---------- */
  var DAY = 86400000; var STEPS = [1, 3, 7, 21];
  function srsMiss(p, key, q) { p.srs[key] = { due: Date.now() + DAY, box: 0, q: q }; }
  function srsHit(p, key) {
    var it = p.srs[key]; if (!it) return;
    it.box++; if (it.box >= STEPS.length) { delete p.srs[key]; return; }
    it.due = Date.now() + STEPS[it.box] * DAY;
  }
  function srsDue(p) { var now = Date.now(); return Object.keys(p.srs).filter(function (k) { return p.srs[k].due <= now; }).map(function (k) { return { key: k, q: p.srs[k].q }; }); }

  /* ---------- Générateur de questions ---------- */
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function boundaryDist(chartMap, hand, playAction) {
    // distance (en rang de force) entre la main et la frontière de la range
    var inR = chartMap[hand] !== 'fold';
    var idx = ORDER_IDX[hand], best = 999;
    D.order.forEach(function (h, i) { if ((chartMap[h] !== 'fold') !== inR) best = Math.min(best, Math.abs(i - idx)); });
    return best;
  }
  function difficulty(chartMap, hand) {
    var d = boundaryDist(chartMap, hand);
    return Math.round(1650 - 650 * Math.min(1, d / 30));
  }
  function randomSituation(kind) {
    var s, pos, bb;
    if (kind === 'bulle') {
      // à l'approche des places payées : ouvrir, défendre, payer un tapis ou répondre à un 3-bet, selon ton tapis
      var bk = rnd(['moyen', 'moyen', 'gros', 'court']), bs;
      if (bk === 'court') bs = rnd([randomSituation('callshove'), randomSituation('def')]);
      else bs = rnd([randomSituation('open'), randomSituation('open'), randomSituation('def'), randomSituation('def'), randomSituation('callshove'), randomSituation('vs3bet')]);
      if (bs.type === 'open' || bs.type === 'def') bs.bb = bk === 'court' ? 15 : (bk === 'gros' ? 60 : 30);
      if (bs.type === 'def' && bk === 'court') bs.bb = 30;
      bs.bubble = bk; return bs;
    }
    var kinds = kind ? [kind] : ['open', 'open', 'open', 'def', 'def', 'push', 'callshove', 'vs3bet'];
    var k = rnd(kinds);
    if (k === 'open') { pos = rnd(POS.slice(0, 8)); bb = rnd([100, 100, 100, 30]); s = { type: 'open', pos: pos, bb: bb }; }
    else if (k === 'def') {
      pos = rnd(['BB', 'BB', 'BB', 'BTN', 'CO', 'SB', 'HJ']); var ops = validOpeners(pos);
      if (pos !== 'BB') ops = ops.filter(function (o) { return o !== 'SB'; });
      s = { type: 'def', pos: pos, opener: rnd(ops), bb: rnd([100, 100, 30]) };
    } else if (k === 'push') { s = { type: 'push', pos: rnd(POS.slice(0, 8)), bb: rnd(PUSH_DEPTHS) }; }
    else if (k === 'hu') { bb = rnd(PUSH_DEPTHS); s = Math.random() < 0.5 ? { type: 'push', pos: 'SB', bb: bb, hu: true } : { type: 'callshove', pos: 'BB', opener: 'SB', bb: bb, hu: true }; }
    else if (k === 'callshove') { bb = rnd(PUSH_DEPTHS); var sk = rnd(shoveSituations(bb)); var m = sk.split(' vs shove '); s = { type: 'callshove', pos: m[0], opener: m[1], bb: bb }; }
    else { var sc = rnd(['ip', 'oop', 'early', 'bvb']); s = { type: 'vs3bet', scen: sc, pos: sc === 'ip' ? 'BTN' : (sc === 'oop' ? 'CO' : sc === 'bvb' ? 'SB' : 'UTG'), opener: sc === 'ip' || sc === 'bvb' ? 'BB' : (sc === 'oop' ? 'BTN' : 'CO'), bb: 100 }; }
    return s;
  }
  function makeQuestion(profileId, opts) {
    opts = opts || {};
    var s = opts.sit || randomSituation(opts.kind);
    if (opts.pos && s.type === 'open') s.pos = opts.pos;
    var cm = chart(profileId, s);
    var hand;
    var target = opts.targetDiff;
    // choix de la main : proche de la difficulté visée
    var cands = HANDS.slice();
    if (opts.hand) hand = opts.hand;
    else if (target) {
      var wantIn = Math.random() < 0.5;
      var pool = cands.filter(function (h) { return (cm[h] !== 'fold') === wantIn; });
      if (pool.length < 4) pool = cands;
      var scored = pool.map(function (h) { return [h, Math.abs(difficulty(cm, h) - target) + Math.random() * 120]; });
      scored.sort(function (a, b) { return a[1] - b[1]; });
      hand = scored[Math.floor(Math.random() * 6)][0];
    } else {
      var r = Math.random();
      if (r < 0.55) { var b = cands.filter(function (h) { return boundaryDist(cm, h) <= 8; }); hand = rnd(b.length ? b : cands); }
      else hand = rnd(cands);
    }
    return { sit: s, hand: hand, answer: cm[hand], diff: difficulty(cm, hand), notion: notionOf(s), key: sitKey(s) + '#' + hand };
  }
  function choicesFor(s) {
    if (s.type === 'open' || s.type === 'push') return ['fold', 'limp', 'raise', 'allin'];
    if (s.type === 'callshove') return ['fold', 'call'];
    if (s.type === 'vs3bet') return ['fold', 'call', 'fourbet', 'allin'];
    return ['fold', 'call', 'raise', 'allin'];
  }
  var SBLIMP = toSet(D.sbLimp || []);
  // cas particuliers : armes jouables mais différentes de la range (écart de style) ou fautes, avec explication
  function special(s, hand, answer, given) {
    var dk = s.type === 'push' ? 'push' : depthKey(s.bb), bb = s.type === 'push' || dk === 'push' ? nearestPush(s.bb) : s.bb;
    if (s.type === 'open' || s.type === 'push') {
      if (given === 'limp') {
        if (s.pos === 'SB' && dk === 'deep' && SBLIMP[hand]) return { kind: 'style', note: 'Repères du livre : en SB, quand il ne reste que la grosse blinde, compléter avec cette main est jouable (sans ante).' };
        return { kind: 'error', note: 'Le limp ouvert laisse la main aux joueurs derrière toi et te fait jouer sans initiative. En tournoi, on relance ou on se couche (sauf certains coups de SB contre la seule BB).' };
      }
      if (given === 'allin') {
        if (dk === 'deep') return { kind: 'error', note: 'Pousser ' + Math.round(bb) + ' BB pour gagner 1,5 BB : tu risques tout pour un petit pot, et seules les mains qui te battent paient.' };
        if (dk === 'mid' && answer === 'raise') return { kind: 'style', note: 'Vers 20-25 BB, le tapis direct se défend parfois, mais le livre recommande la relance minimum puis tapis ou fold.' };
      }
      if (given === 'raise' && dk === 'push' && answer === 'allin') {
        if (bb >= 12) return { kind: 'style', note: 'À ' + bb + ' BB, la relance minimum avec projet de tapis sur sur-relance est jouable ; l’équilibre pousse directement.' };
        return { kind: 'error', note: 'Sous 12 BB, une relance qui n’est pas tapis t’engage déjà fortement : pousse directement pour garder toute ta fold equity.' };
      }
    }
    if (s.type === 'def') {
      if (given === 'raise' && answer === 'allin') return { kind: 'style', note: 'À 20-40 BB, le 3-bet devient le plus souvent un tapis : un 3-bet plus petit te laisse sans bonne option face à une 4-bet.' };
      if (given === 'allin' && dk === 'deep') return { kind: answer === 'raise' ? 'style' : 'error', note: answer === 'raise' ? 'La main se sur-relance, mais pas à tapis : à 100 BB, un 3-bet de 3 fois la relance suffit et garde les mains plus faibles en jeu.' : 'Pousser 100 BB en 3-bet : seules les mains qui te battent paient.' };
    }
    if (s.type === 'vs3bet' && given === 'allin') {
      if (answer === 'fourbet') return { kind: 'style', note: 'Le tapis direct à 100 BB est trop gros : une 4-bet d’environ 2,2 fois garde les mêmes mains en jeu pour moins cher.' };
      return { kind: 'error', note: 'Pousser 100 BB face au 3-bet avec cette main : les mains qui te paient te dominent.' };
    }
    return null;
  }
  // classement d'une erreur : écart de style ou erreur que tous les profils évitent
  function judge(profileId, q, given) {
    if (given === q.answer) return { ok: true };
    // 16 à 19 BB : ouvrir petit puis tapis ou fold est aussi le plan du cours (chapitre 21)
    if (q.sit.type === 'open' && q.sit.bb >= 16 && q.sit.bb < 20 && q.answer === 'allin' && given === 'raise') return { ok: true, note: 'Entre 16 et 20 BB, ouvrir petit puis tapis ou fold est aussi une bonne ligne (chapitre 21).' };
    var others = BASE_PROFILES.map(function (id) { return { id: id, a: actionFor(id, q.sit, q.hand) }; });
    var same = others.filter(function (o) { return o.a === given; });
    if (same.length) return { ok: false, kind: 'style', profiles: same.map(function (o) { return o.id; }) };
    var sp = special(q.sit, q.hand, q.answer, given);
    if (sp) return { ok: false, kind: sp.kind, note: sp.note };
    return { ok: false, kind: 'error' };
  }

  /* ---------- Jetons et structures ---------- */
  function blindsFor(bb) {
    // structure 20 000 jetons : niveaux types Winamax (BB ante)
    var levels = [[100, 200], [150, 300], [200, 400], [250, 500], [300, 600], [400, 800], [500, 1000], [600, 1200], [800, 1600], [1000, 2000], [1250, 2500], [1500, 3000], [2000, 4000]];
    var stack = 20000;
    if (bb > 40) return { sb: 100, bb: 200, ante: 0, stack: bb * 200 };
    var best = levels[0]; levels.forEach(function (l) { if (Math.abs(stack / l[1] - bb) < Math.abs(stack / best[1] - bb)) best = l; });
    return { sb: best[0], bb: best[1], ante: best[1], stack: bb * best[1] };
  }
  function openBB(pos, bb) {
    var p = player(), mode = (p && p.settings && p.settings.openSize) || 'club';
    if (pos === 'SB') return 3;
    if (mode === 'club') return 2;
    return depthKey(bb || 100) === 'deep' ? 2.5 : 2.2;
  }
  function fmt(n) { return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ').replace(/ /g, ' '); }

  // révisions des podcasts réenregistrés : un nouveau nom force le re-téléchargement sur PC et Android
  var AREV = { 6: 2, 7: 2, 14: 2, 15: 2, 33: 3, 35: 2, 38: 2, 39: 2, 43: 2, 46: 2, 47: 2 };
  function audioFile(n) { return 'audio/v3/pod' + (n < 10 ? '0' : '') + n + (AREV[n] ? '-r' + AREV[n] : '') + '.m4a'; }
  window.PA = {
    audioFile: audioFile, D: D, RANKS: RANKS, POS: POS, POS_LABEL: POS_LABEL, HANDS: HANDS, PROFILES: PROFILES, BASE_PROFILES: BASE_PROFILES, PUSH_DEPTHS: PUSH_DEPTHS,
    combos: combos, pct: pct, load: load, save: save, player: player, newPlayer: newPlayer, wipeAll: wipeAll, wipeTraining: wipeTraining,
    chart: chart, actionFor: actionFor, firstOpenPos: firstOpenPos, validOpeners: validOpeners, shoveSituations: shoveSituations,
    depthKey: depthKey, nearestPush: nearestPush, sitKey: sitKey, NOTIONS: NOTIONS, notionOf: notionOf, notionState: notionState,
    bubbleChart: bubbleChart, BUBBLE_NAME: BUBBLE_NAME, expand: expand, level: level, updateNotion: updateNotion, srsMiss: srsMiss, srsHit: srsHit, srsDue: srsDue, makeQuestion: makeQuestion,
    randomSituation: randomSituation, choicesFor: choicesFor, judge: judge, difficulty: difficulty, blindsFor: blindsFor, fmt: fmt, openBB: openBB,
    ORDER_IDX: ORDER_IDX
  };
})();
