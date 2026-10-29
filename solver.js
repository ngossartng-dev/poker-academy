/* Poker Academy v2.0 — Solveur de flop : explorateur et exercice « Après le flop » */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }
  var R = '23456789TJQKA', SUIT = { s: ['♠', 0], h: ['♥', 1], d: ['♦', 1], c: ['♣', 0] };
  var DATA = null, LOADING = false;
  function load(cb) {
    if (window.PA_SOLVER_DATA) { DATA = window.PA_SOLVER_DATA; cb(); return; }
    if (LOADING) return; LOADING = true;
    var s = document.createElement('script'); s.src = 'solver/data.js';
    s.onload = function () { DATA = window.PA_SOLVER_DATA; LOADING = false; cb(); };
    s.onerror = function () { LOADING = false; DATA = { err: true }; cb(); };
    document.head.appendChild(s);
  }

  /* ---------- Cartes ---------- */
  function cardTxt(c) { var su = SUIT[c[1]]; return '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:2.1em;padding:2px 4px;margin:0 2px;border-radius:6px;background:#fff;color:' + (su[1] ? '#d61f1f' : '#111') + ';font-weight:800">' + (c[0] === 'T' ? '10' : c[0]) + su[0] + '</span>'; }
  function cardsTxt(s) { var o = ''; for (var i = 0; i < s.length; i += 2) o += cardTxt(s.substr(i, 2)); return o; }
  function bigCard(c) { var su = SUIT[c[1]]; return '<div class="pc' + (su[1] ? ' red' : '') + '"><span class="r">' + (c[0] === 'T' ? '10' : c[0]) + '</span><span class="s">' + su[0] + '</span></div>'; }

  /* ---------- Familles de mains sur le tableau ---------- */
  function rk(c) { return R.indexOf(c[0]); }
  function category(h, flop) {
    var b = [flop.substr(0, 2), flop.substr(2, 2), flop.substr(4, 2)], hc = [h.substr(0, 2), h.substr(2, 2)], all = b.concat(hc);
    var cnt = {}, suit = {}; all.forEach(function (c) { cnt[c[0]] = (cnt[c[0]] || 0) + 1; suit[c[1]] = (suit[c[1]] || 0) + 1; });
    var br = b.map(rk).sort(function (x, y) { return y - x; }), r1 = rk(hc[0]), r2 = rk(hc[1]);
    var bcnt = {}; b.forEach(function (c) { bcnt[c[0]] = (bcnt[c[0]] || 0) + 1; });
    var flush = Object.keys(suit).some(function (s) { return suit[s] >= 5; });
    var ranks = {}; all.forEach(function (c) { ranks[rk(c)] = 1; }); if (ranks[12]) ranks[-1] = 1;
    var str = false; for (var t = 8; t >= -1; t--) { var ok = true; for (var k = t; k < t + 5; k++) if (!ranks[k]) ok = false; if (ok) str = true; }
    var maxc = 0; Object.keys(cnt).forEach(function (r) { if (cnt[r] > maxc) maxc = cnt[r]; });
    var pairsHand = Object.keys(cnt).filter(function (r) { return cnt[r] >= 2 && (hc[0][0] === r || hc[1][0] === r); });
    var tripsUsed = Object.keys(cnt).some(function (r) { return cnt[r] >= 3 && (hc[0][0] === r || hc[1][0] === r); });
    if (flush || str || maxc >= 4 || tripsUsed || (pairsHand.length >= 2)) return pairsHand.length >= 2 && !tripsUsed && !flush && !str ? 'Double paire' : 'Brelan ou mieux';
    if (r1 === r2 && r1 > br[0]) return 'Overpaire';
    if (pairsHand.length === 1) {
      var pr = R.indexOf(pairsHand[0]);
      if (r1 === r2) return pr > br[1] ? 'Paire moyenne' : 'Petite paire';
      if (pr === br[0]) return 'Top paire';
      return pr === br[1] ? 'Paire moyenne' : 'Petite paire';
    }
    var fd = Object.keys(suit).some(function (s) { return suit[s] === 4 && (hc[0][1] === s || hc[1][1] === s); });
    var sd = false; for (var t2 = 9; t2 >= -1; t2--) { var n = 0; for (var k2 = t2; k2 < t2 + 5; k2++) if (ranks[k2]) n++; if (n >= 4) sd = true; }
    if (fd) return 'Tirage couleur';
    if (sd) return 'Tirage quinte';
    if (r1 === 12 || r2 === 12) return 'Hauteur as';
    return 'Rien';
  }
  var CATS = ['Brelan ou mieux', 'Double paire', 'Overpaire', 'Top paire', 'Paire moyenne', 'Petite paire', 'Tirage couleur', 'Tirage quinte', 'Hauteur as', 'Rien'];

  /* ---------- Lecture d'une solution ---------- */
  function sol(spot, flop) { return DATA && DATA.sols && DATA.sols[spot + '|' + flop]; }
  function decode(S, path) {
    var n = S.nodes[path]; if (!n) return null;
    if (!n._m) {
      var bin = atob(n.s), na = n.a.length, C = n.p === 0 ? S.c0 : S.c1, nc = C.length / 4, m = [];
      for (var i = 0; i < nc; i++) { var row = []; for (var a = 0; a < na; a++) row.push(bin.charCodeAt(i * na + a) / 255); m.push(row); }
      n._m = m; n._c = []; for (var j = 0; j < nc; j++) n._c.push(C.substr(j * 4, 4));
    }
    return n;
  }
  function actLabel(a, n) {
    var pot = n.pot;
    switch (a) {
      case 'x': return 'Check';
      case 'b33': return 'Miser 1/3 du pot (' + f1(pot * 0.33) + ' BB)';
      case 'b75': return 'Miser 3/4 du pot (' + f1(pot * 0.75) + ' BB)';
      case 'b125': return 'Surmiser 125 % (' + f1(pot * 1.25) + ' BB)';
      case 'ai': return 'Tapis';
      case 'f': return 'Se coucher';
      case 'c': return 'Payer ' + f1(n.call) + ' BB';
      case 'r': return 'Relancer (3 fois)';
    }
    return a;
  }
  function shortLabel(a) { return { x: 'Check', b33: '1/3', b75: '3/4', b125: '125 %', ai: 'Tapis', f: 'Fold', c: 'Payer', r: 'Relance' }[a] || a; }
  var COL = { x: '#5c7cfa', c: '#2f9e44', f: '#868e96', b33: '#f59f00', b75: '#f76707', b125: '#e8590c', r: '#e03131', ai: '#c2255c' };
  function f1(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
  function pc(x) { return Math.round(x * 100) + ' %'; }
  function bar(mix, acts) { return '<div style="display:flex;height:16px;border-radius:6px;overflow:hidden;background:#222;min-width:120px">' + acts.map(function (a, k) { return mix[k] > 0.005 ? '<span title="' + shortLabel(a) + ' ' + pc(mix[k]) + '" style="width:' + (mix[k] * 100) + '%;background:' + COL[a] + '"></span>' : ''; }).join('') + '</div>'; }
  function legend(acts) { return '<div class="row" style="flex-wrap:wrap;gap:10px">' + acts.map(function (a) { return '<span class="small"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + COL[a] + ';margin-right:4px;vertical-align:-1px"></span>' + shortLabel(a) + '</span>'; }).join('') + '</div>'; }
  function summary(n, flop) {
    var tot = n.a.map(function () { return 0; }), cat = {};
    n._m.forEach(function (row, i) {
      row.forEach(function (v, a) { tot[a] += v; });
      var c = category(n._c[i], flop); cat[c] = cat[c] || { n: 0, mix: n.a.map(function () { return 0; }) }; cat[c].n++; row.forEach(function (v, a) { cat[c].mix[a] += v; });
    });
    var N = n._m.length; tot = tot.map(function (x) { return x / N; });
    Object.keys(cat).forEach(function (k) { cat[k].mix = cat[k].mix.map(function (x) { return x / cat[k].n; }); });
    return { tot: tot, cat: cat, N: N };
  }
  function handMix(n, code) {
    // moyenne des combinaisons d'une main (ex. AKo) présentes au nœud
    var acc = n.a.map(function () { return 0; }), k = 0;
    n._c.forEach(function (c, i) { if (classOf(c) === code) { k++; n._m[i].forEach(function (v, a) { acc[a] += v; }); } });
    return k ? acc.map(function (x) { return x / k; }) : null;
  }
  function classOf(c) { var a = c[0], b = c[2]; if (R.indexOf(a) < R.indexOf(b)) { var t = a; a = b; b = t; } return a === b ? a + b : a + b + (c[1] === c[3] ? 's' : 'o'); }
  function whoName(spot, p) { var sp = DATA.spots.filter(function (s) { return s.id === spot; })[0]; var pos = p === 0 ? sp.oop : sp.ip; return PA.POS_LABEL[pos]; }
  var ART = { BTN: 'le bouton', CO: 'le cut-off', SB: 'la petite blinde', BB: 'la grosse blinde' };
  function who2(spot, p) { var sp = DATA.spots.filter(function (s) { return s.id === spot; })[0]; return ART[p === 0 ? sp.oop : sp.ip]; }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function pathText(spot, path) {
    if (!path) return 'Début du coup';
    return path.split('-').map(function (a, i) { return shortLabel(a); }).join(' › ');
  }

  /* ---------- Explorateur ---------- */
  var EX = { spot: 'btn-bb', flop: null, path: null, hand: '' };
  function explorer() {
    var ui = U();
    if (!DATA) { load(function () { ui.render(); }); return ui.shell('apprendre', '<div class="stack"><h1>Solveur</h1><p class="muted">Chargement des solutions…</p></div>'); }
    if (DATA.err) return ui.shell('apprendre', '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Solveur</h1>' + ui.yo('Les solutions ne sont pas incluses dans cette version de test en ligne : elles sont dans l’appli installée (PC et Android).') + '</div>');
    var sp = DATA.spots.filter(function (s) { return s.id === EX.spot; })[0];
    if (!EX.flop) EX.flop = DATA.flops[0];
    var S = sol(EX.spot, EX.flop);
    if (EX.path === null) EX.path = sp.oopBets ? '' : 'x';
    var n = decode(S, EX.path), sm = summary(n, EX.flop);
    var kids = n.a.map(function (a) { var p = EX.path ? EX.path + '-' + a : a; return S.nodes[p] ? [a, p] : null; }).filter(Boolean);
    var parts = EX.path ? EX.path.split('-') : [], crumbs = '<button class="btn" data-sact="path" data-v="' + (sp.oopBets ? '' : 'x') + '" style="min-height:36px;padding:2px 10px">Début</button>';
    for (var i = sp.oopBets ? 0 : 1; i < parts.length; i++) { var pp = parts.slice(0, i + 1).join('-'); if (S.nodes[pp]) crumbs += ' › <button class="btn" data-sact="path" data-v="' + pp + '" style="min-height:36px;padding:2px 10px">' + shortLabel(parts[i]) + '</button>'; }
    var hm = EX.hand ? handMix(n, EX.hand) : null;
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Solveur</h1>' +
      '<div class="seg">' + DATA.spots.map(function (s) { return '<button class="' + (EX.spot === s.id ? 'on' : '') + '" data-sact="spot" data-v="' + s.id + '">' + s.name + '</button>'; }).join('') + '</div>' +
      '<div class="card stack" style="gap:8px"><b>Flop</b><div class="row" style="flex-wrap:wrap;gap:6px">' + DATA.flops.map(function (f) { return '<button data-sact="flop" data-v="' + f + '" style="padding:4px;border-radius:8px;border:2px solid ' + (EX.flop === f ? 'var(--gold)' : 'var(--line)') + ';background:var(--panel2)">' + cardsTxt(f) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card stack"><div class="row" style="justify-content:space-between;flex-wrap:wrap"><div class="row" style="gap:4px">' + bigCard(EX.flop.substr(0, 2)) + bigCard(EX.flop.substr(2, 2)) + bigCard(EX.flop.substr(4, 2)) + '</div><div class="small muted">Pot ' + f1(n.pot) + ' BB · tapis ' + f1(S.stack) + ' BB<br>Précision : ' + String(S.exp).replace('.', ',') + ' % du pot</div></div>' +
      '<div class="small">' + crumbs + '</div>' +
      '<div><b>' + cap(who2(EX.spot, n.p)) + '</b> joue' + (n.call ? ' face à une mise de ' + f1(n.call) + ' BB' : '') + ' :</div>' + legend(n.a) + bar(sm.tot, n.a) +
      '<div class="small muted">' + n.a.map(function (a, k) { return shortLabel(a) + ' ' + pc(sm.tot[k]); }).join(' · ') + '</div>' +
      (kids.length ? '<div class="row" style="flex-wrap:wrap">' + kids.map(function (k) { return '<button class="btn" data-sact="path" data-v="' + k[1] + '" style="min-height:40px">Si ' + shortLabel(k[0]).toLowerCase() + ' ›</button>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="card stack"><b>Par famille de mains</b><table class="tbl"><tr><th>Famille</th><th>Part</th><th>Stratégie</th></tr>' +
      CATS.filter(function (c) { return sm.cat[c]; }).map(function (c) { return '<tr><td>' + c + '</td><td>' + pc(sm.cat[c].n / sm.N) + '</td><td>' + bar(sm.cat[c].mix, n.a) + '</td></tr>'; }).join('') + '</table></div>' +
      '<div class="card stack"><b>Une main précise</b><div class="row"><input id="solHand" placeholder="ex. AKo, 77, 98s" value="' + ui.esc(EX.hand) + '" style="width:130px;min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit"><button class="btn" data-sact="hand">Voir</button></div>' +
      (EX.hand ? (hm ? bar(hm, n.a) + '<div class="small">' + n.a.map(function (a, k) { return shortLabel(a) + ' ' + pc(hm[k]); }).join(' · ') + '</div>' : '<div class="small muted">Cette main n’est pas dans la range de ce joueur à ce moment du coup.</div>') : '') + '</div>' +
      '<p class="small muted">Solveur simplifié : le flop est calculé exactement avec trois tailles de mise (1/3, 3/4, 125 % du pot), une relance à 3 fois et le tapis ; la turn et la river sont estimées par la force des mains. Ranges du profil TAG, tapis de 40 BB, pot simple avec ante.</p></div>';
    return ui.shell('apprendre', body);
  }

  /* ---------- Exercice « Après le flop » ---------- */
  var QZ = null;
  function decisionNodes(S, spot) {
    var sp = DATA.spots.filter(function (s) { return s.id === spot; })[0];
    return Object.keys(S.nodes).filter(function (p) {
      var segs = p ? p.split('-') : [];
      if (sp.oopBets) return segs.length <= 1 || (segs.length === 2 && segs[0] === 'x');
      return segs.length === 1 && p === 'x' || (segs.length === 2 && segs[0] === 'x' && segs[1] !== 'ai');
    }).filter(function (p) { return S.nodes[p].a.length > 1; });
  }
  function newQuestion() {
    var spot = DATA.spots[Math.floor(Math.random() * DATA.spots.length)].id, flop = DATA.flops[Math.floor(Math.random() * DATA.flops.length)], S = sol(spot, flop);
    var nodes = decisionNodes(S, spot), path = nodes[Math.floor(Math.random() * nodes.length)], n = decode(S, path);
    // une main « intéressante » : on évite les décisions à 100 % évidentes une fois sur deux
    var idx = Math.floor(Math.random() * n._c.length);
    for (var tries = 0; tries < 12 && Math.random() < 0.6; tries++) {
      var j = Math.floor(Math.random() * n._c.length), mx = Math.max.apply(null, n._m[j]);
      if (mx < 0.85) { idx = j; break; }
    }
    return { spot: spot, flop: flop, path: path, i: idx, hand: n._c[idx] };
  }
  function startQuiz() { QZ = { n: 10, k: 0, ok: 0, mix: 0, q: null, ans: null }; QZ.q = newQuestion(); }
  function quizView() {
    var ui = U();
    if (!DATA) { load(function () { ui.render(); }); return ui.shell('entrainer', '<div class="stack"><h1>Après le flop</h1><p class="muted">Chargement des solutions…</p></div>'); }
    if (DATA.err) return ui.shell('entrainer', '<div class="stack"><button class="back" data-act="nav" data-v="situations">‹ Situations</button><h1>Après le flop</h1>' + ui.yo('Les solutions ne sont pas incluses dans cette version de test en ligne : elles sont dans l’appli installée (PC et Android).') + '</div>');
    if (!QZ) startQuiz();
    if (QZ.k >= QZ.n) {
      var pct = Math.round((QZ.ok + QZ.mix * 0.5) / QZ.n * 100);
      if (!QZ.saved) { var p = PA.player(); p.sessions.unshift({ at: Date.now(), label: 'Après le flop', n: QZ.n, ok: QZ.ok, style: QZ.mix, err: QZ.n - QZ.ok - QZ.mix, consult: 0 }); PA.save(); QZ.saved = true; }
      return ui.shell('entrainer', '<div class="stack"><h1>Bilan</h1>' + ui.yo(pct >= 80 ? 'Très bien : tes décisions au flop ressemblent à celles du solveur.' : pct >= 55 ? 'Pas mal. Regarde dans l’explorateur les familles de mains où tu t’écartes.' : 'Le jeu après le flop demande du temps : refais une série, et ouvre l’explorateur sur les flops ratés.') +
        '<div class="grid2"><div class="card"><div class="muted small">Comme le solveur</div><div class="disp" style="font-size:40px">' + QZ.ok + ' / ' + QZ.n + '</div></div><div class="card"><div class="muted small">Jouable (mixte) · erreur</div><div class="disp" style="font-size:40px">' + QZ.mix + ' · ' + (QZ.n - QZ.ok - QZ.mix) + '</div></div></div>' +
        '<div class="row"><button class="btn gold" data-sact="again" style="flex:1">Encore 10 coups</button><button class="btn" data-act="nav" data-v="situations">Terminer</button></div></div>', true);
    }
    var q = QZ.q, S = sol(q.spot, q.flop), n = decode(S, q.path), sp = DATA.spots.filter(function (s) { return s.id === q.spot; })[0];
    var me = whoName(q.spot, n.p), opp = who2(q.spot, 1 - n.p);
    var Opp = cap(opp);
    var hist = q.path === '' ? 'Tu as ouvert à ' + (q.spot === 'sb-bb' ? '3' : '2') + ' BB, ' + opp + ' a payé. Tu parles en premier.' :
      q.path === 'x' ? (sp.oopBets ? Opp + ' a ouvert, tu as payé. Elle checke.' : 'Tu as ouvert, ' + opp + ' a payé. Elle checke.') :
      (sp.oopBets && q.path.split('-').length === 1 ? Opp + ' a ouvert, tu as payé. Elle mise ' + f1(n.call) + ' BB.' : (sp.oopBets ? 'Tu as ouvert, ' + opp + ' a payé. Tu checkes, elle mise ' + f1(n.call) + ' BB.' : Opp + ' a ouvert, tu as payé. Tu checkes, il mise ' + f1(n.call) + ' BB.'));
    var out = '<div class="stack" style="max-width:640px;margin:0 auto"><div class="row" style="justify-content:space-between"><button class="back" data-sact="quit">‹ Arrêter</button><span class="small muted">' + (QZ.k + 1) + ' / ' + QZ.n + '</span></div>' +
      '<div class="card stack"><div class="row" style="gap:6px;flex-wrap:wrap"><span class="chip">' + me + '</span><span class="chip" style="border-color:#555;color:#c9c9cf">Pot ' + f1(n.pot) + ' BB · tapis ' + f1(S.stack) + ' BB</span></div>' +
      '<div class="small muted">' + hist + '</div><div class="row" style="gap:4px">' + bigCard(q.flop.substr(0, 2)) + bigCard(q.flop.substr(2, 2)) + bigCard(q.flop.substr(4, 2)) + '</div>' +
      '<div class="row" style="gap:10px;align-items:center"><span class="small muted">Ta main</span>' + bigCard(q.hand.substr(0, 2)) + bigCard(q.hand.substr(2, 2)) + '<span class="small">' + category(q.hand, q.flop) + '</span></div></div>';
    if (!QZ.ans) out += '<div class="stack" style="gap:8px">' + n.a.map(function (a) { return '<button class="btn" data-sact="ans" data-v="' + a + '" style="min-height:52px;text-align:left">' + actLabel(a, n) + '</button>'; }).join('') + '</div>';
    else {
      var mix = n._m[q.i], k = n.a.indexOf(QZ.ans.a), best = 0; mix.forEach(function (v, a) { if (v > mix[best]) best = a; });
      var verdict = QZ.ans.v === 'ok' ? ['Comme le solveur', '#4fe08f'] : QZ.ans.v === 'mix' ? ['Jouable : stratégie mixte', '#ffd43b'] : ['Erreur', '#ff8080'];
      var sm = summary(n, q.flop);
      out += '<div class="card stack"><div class="disp" style="font-size:28px;color:' + verdict[1] + '">' + verdict[0] + '</div>' +
        '<div>Le solveur, avec cette main : ' + n.a.map(function (a, j) { return mix[j] >= 0.02 ? '<b>' + shortLabel(a) + '</b> ' + pc(mix[j]) : ''; }).filter(Boolean).join(' · ') + '</div>' + legend(n.a) + bar(mix, n.a) +
        '<div class="small muted">Toute la range de ' + me + ' ici : ' + n.a.map(function (a, j) { return shortLabel(a) + ' ' + pc(sm.tot[j]); }).join(' · ') + '</div></div>' +
        ui.yo(explain(n, q, mix, best, sm)) +
        '<div class="row"><button class="btn gold" data-sact="next" style="flex:1">Coup suivant</button><button class="btn" data-sact="explore">Ouvrir dans l’explorateur</button></div>';
    }
    return ui.shell('entrainer', out + '</div>', true);
  }
  function explain(n, q, mix, best, sm) {
    var cat = category(q.hand, q.flop), c = sm.cat[cat], a = n.a[best];
    var catTxt = c ? 'Avec ' + cat.toLowerCase() + ', le solveur joue en moyenne : ' + n.a.map(function (x, j) { return c.mix[j] >= 0.1 ? shortLabel(x).toLowerCase() + ' ' + pc(c.mix[j]) : ''; }).filter(Boolean).join(', ') + '.' : '';
    var why = '';
    if (a === 'f') why = 'Ta main n’a pas assez d’équité face à cette mise : payer perdrait de l’argent.';
    else if (a === 'c') why = 'Ta main a assez d’équité pour payer, mais relancer ferait coucher les mains que tu bats.';
    else if (a === 'r' || a === 'ai') why = 'Relancer ici rapporte : soit tu fais coucher des mains qui ont de l’équité, soit tu te fais payer par pire.';
    else if (a === 'x') why = 'Checker protège ta range et garde les mains moyennes dans le coup.';
    else if (a === 'b33') why = 'Une petite mise suffit : beaucoup de mains adverses doivent abandonner ou payer cher pour leur équité.';
    else why = 'Une grosse mise met la pression : elle fait payer les mains moyennes et les tirages, ou les fait coucher.';
    return why + ' ' + catTxt;
  }
  function judge(a) {
    var q = QZ.q, n = decode(sol(q.spot, q.flop), q.path), mix = n._m[q.i], k = n.a.indexOf(a), mx = Math.max.apply(null, mix);
    var v = mix[k] >= 0.5 || mix[k] >= mx - 0.1 ? 'ok' : (mix[k] >= 0.15 ? 'mix' : 'err');
    QZ.ans = { a: a, v: v }; if (v === 'ok') QZ.ok++; else if (v === 'mix') QZ.mix++;
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-sact]') : null; if (!t) return;
    var a = t.getAttribute('data-sact'), v = t.getAttribute('data-v');
    if (a === 'spot') { EX.spot = v; EX.path = null; }
    else if (a === 'flop') { EX.flop = v; }
    else if (a === 'path') EX.path = v;
    else if (a === 'hand') { var h = (document.getElementById('solHand').value || '').trim(); h = h.length >= 2 ? h[0].toUpperCase() + h[1].toUpperCase() + (h[2] ? h[2].toLowerCase() : '') : ''; EX.hand = h.replace(/^10/, 'T'); }
    else if (a === 'ans') { if (!QZ.ans) judge(v); }
    else if (a === 'next') { QZ.k++; QZ.ans = null; if (QZ.k < QZ.n) QZ.q = newQuestion(); }
    else if (a === 'again') startQuiz();
    else if (a === 'quit') { QZ = null; location.hash = '#situations'; }
    else if (a === 'explore') { var q = QZ.q; EX.spot = q.spot; EX.flop = q.flop; EX.path = q.path; EX.hand = classOf(q.hand); location.hash = '#solveur'; return; }
    U().render();
  });
  window.PA_SOLVER = { explorer: explorer, quiz: quizView, category: category };
})();
