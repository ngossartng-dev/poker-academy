/* Poker Academy v2.0 — Solveur flop et turn : explorateur et exercice « Après le flop » */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }
  var R = '23456789TJQKA', SUIT = { s: ['♠', 0], h: ['♥', 1], d: ['♦', 1], c: ['♣', 0] };
  var DATA = null, LOADING = false, TURN_LOADING = {};
  function load(cb) {
    if (window.PA_SOLVER_DATA) { DATA = window.PA_SOLVER_DATA; cb(); return; }
    if (LOADING) return; LOADING = true;
    var s = document.createElement('script'); s.src = 'solver/data.js';
    s.onload = function () { DATA = window.PA_SOLVER_DATA; LOADING = false; cb(); };
    s.onerror = function () { LOADING = false; DATA = { err: true }; cb(); };
    document.head.appendChild(s);
  }
  function turnData(spot, flop, cb) {
    var k = spot + '|' + flop, T = window.PA_SOLVER_TURN || {};
    if (T[k]) return T[k];
    if (!TURN_LOADING[k]) {
      TURN_LOADING[k] = true;
      var s = document.createElement('script'); s.src = 'solver/turn/' + spot + '/' + flop + '.js';
      s.onload = s.onerror = function () { TURN_LOADING[k] = false; if (cb) cb(); };
      document.head.appendChild(s);
    }
    return null;
  }

  /* ---------- Cartes ---------- */
  function cardTxt(c) { var su = SUIT[c[1]]; return '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:2.1em;padding:2px 4px;margin:0 2px;border-radius:6px;background:#fff;color:' + (su[1] ? '#d61f1f' : '#111') + ';font-weight:800">' + (c[0] === 'T' ? '10' : c[0]) + su[0] + '</span>'; }
  function cardsTxt(s) { var o = ''; for (var i = 0; i < s.length; i += 2) o += cardTxt(s.substr(i, 2)); return o; }
  function bigCard(c, extra) { var su = SUIT[c[1]]; return '<div class="pc' + (su[1] ? ' red' : '') + '"' + (extra || '') + '><span class="r">' + (c[0] === 'T' ? '10' : c[0]) + '</span><span class="s">' + su[0] + '</span></div>'; }
  function boardCards(b) { var o = ''; for (var i = 0; i < b.length; i += 2) o += bigCard(b.substr(i, 2), i === 6 ? ' style="margin-left:10px;outline:3px solid var(--gold)"' : ''); return '<div class="row" style="gap:4px">' + o + '</div>'; }

  /* ---------- Familles de mains (flop ou turn) ---------- */
  function rk(c) { return R.indexOf(c[0]); }
  function category(h, board) {
    var b = []; for (var q = 0; q < board.length; q += 2) b.push(board.substr(q, 2));
    var hc = [h.substr(0, 2), h.substr(2, 2)], all = b.concat(hc);
    var cnt = {}, suit = {}; all.forEach(function (c) { cnt[c[0]] = (cnt[c[0]] || 0) + 1; suit[c[1]] = (suit[c[1]] || 0) + 1; });
    var br = b.map(rk).sort(function (x, y) { return y - x; }), r1 = rk(hc[0]), r2 = rk(hc[1]);
    var flush = Object.keys(suit).some(function (s) { return suit[s] >= 5 && (hc[0][1] === s || hc[1][1] === s); });
    var ranks = {}; all.forEach(function (c) { ranks[rk(c)] = 1; }); if (ranks[12]) ranks[-1] = 1;
    var bRanks = {}; b.forEach(function (c) { bRanks[rk(c)] = 1; }); if (bRanks[12]) bRanks[-1] = 1;
    var str = false; for (var t = 8; t >= -1; t--) { var ok = true, onBoard = true; for (var k = t; k < t + 5; k++) { if (!ranks[k]) ok = false; if (!bRanks[k]) onBoard = false; } if (ok && !onBoard) str = true; }
    var pairsHand = Object.keys(cnt).filter(function (r) { return cnt[r] >= 2 && (hc[0][0] === r || hc[1][0] === r); });
    var tripsUsed = Object.keys(cnt).some(function (r) { return cnt[r] >= 3 && (hc[0][0] === r || hc[1][0] === r); });
    if (flush || str || tripsUsed) return 'Brelan ou mieux';
    if (pairsHand.length >= 2) return 'Double paire';
    if (r1 === r2 && r1 > br[0]) return 'Overpaire';
    if (pairsHand.length === 1) {
      var pr = R.indexOf(pairsHand[0]);
      if (r1 === r2) return pr > br[1] ? 'Paire moyenne' : 'Petite paire';
      if (pr === br[0]) return 'Top paire';
      return pr === br[1] ? 'Paire moyenne' : 'Petite paire';
    }
    if (b.length < 5) {
      var fd = Object.keys(suit).some(function (s) { return suit[s] === 4 && (hc[0][1] === s || hc[1][1] === s); });
      var sd = false; for (var t2 = 9; t2 >= -1; t2--) { var n = 0, mine = false; for (var k2 = t2; k2 < t2 + 5; k2++) if (ranks[k2]) { n++; if ((k2 === r1 || k2 === r2 || (k2 === -1 && (r1 === 12 || r2 === 12))) && !bRanks[k2]) mine = true; } if (n >= 4 && mine) sd = true; }
      if (fd) return 'Tirage couleur';
      if (sd) return 'Tirage quinte';
    }
    if (r1 === 12 || r2 === 12) return 'Hauteur as';
    return 'Rien';
  }
  var CATS = ['Brelan ou mieux', 'Double paire', 'Overpaire', 'Top paire', 'Paire moyenne', 'Petite paire', 'Tirage couleur', 'Tirage quinte', 'Hauteur as', 'Rien'];

  /* ---------- Lecture d'une solution ---------- */
  function sol(spot, flop) { return DATA && DATA.sols && DATA.sols[spot + '|' + flop]; }
  function decodeNode(n, S) {
    if (n._m) return n;
    var bin = atob(n.s), na = n.a.length, C = n.p === 0 ? S.c0 : S.c1, nc = C.length / 4, m = [];
    for (var i = 0; i < nc; i++) {
      var row = [];
      for (var a = 0; a < na; a++) {
        var k = i * na + a, v;
        if (n.q === 4) { var by = bin.charCodeAt(k >> 1); v = (k & 1 ? by & 15 : by >> 4) / 15; }
        else v = bin.charCodeAt(k) / 255;
        row.push(v);
      }
      m.push(row);
    }
    n._m = m; n._c = []; for (var j = 0; j < nc; j++) n._c.push(C.substr(j * 4, 4));
    return n;
  }
  function node(S, path, tl) {
    if (!tl) { var n = S.nodes[path]; return n ? decodeNode(n, S) : null; }
    var T = turnData(S.spot, S.flop); if (!T || !T[tl.line]) return null;
    var nn = T[tl.line].nodes[tl.card][path]; return nn ? decodeNode(nn, S) : null;
  }
  function f1(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
  function pc(x) { return Math.round(x * 100) + ' %'; }
  function actLabel(a, n) {
    var pot = n.pot;
    switch (a) {
      case 'x': return 'Check';
      case 'b33': return 'Miser 1/3 du pot (' + f1(pot * 0.33) + ' BB)';
      case 'b50': return 'Miser la moitié du pot (' + f1(pot * 0.5) + ' BB)';
      case 'b75': return 'Miser 3/4 du pot (' + f1(pot * 0.75) + ' BB)';
      case 'b100': return 'Miser le pot (' + f1(pot) + ' BB)';
      case 'b125': return 'Surmiser 125 % (' + f1(pot * 1.25) + ' BB)';
      case 'ai': return 'Tapis';
      case 'f': return 'Se coucher';
      case 'c': return 'Payer ' + f1(n.call) + ' BB';
      case 'r': return 'Relancer (3 fois)';
    }
    return a;
  }
  function shortLabel(a) { return { x: 'Check', b33: '1/3', b50: '1/2', b75: '3/4', b100: 'Pot', b125: '125 %', ai: 'Tapis', f: 'Fold', c: 'Payer', r: 'Relance' }[a] || a; }
  var COL = { x: '#5c7cfa', c: '#2f9e44', f: '#868e96', b33: '#fcc419', b50: '#f59f00', b75: '#f76707', b100: '#e8590c', b125: '#d9480f', r: '#e03131', ai: '#c2255c' };
  function bar(mix, acts) { return '<div style="display:flex;height:16px;border-radius:6px;overflow:hidden;background:#222;min-width:120px">' + acts.map(function (a, k) { return mix[k] > 0.005 ? '<span title="' + shortLabel(a) + ' ' + pc(mix[k]) + '" style="width:' + (mix[k] * 100) + '%;background:' + COL[a] + '"></span>' : ''; }).join('') + '</div>'; }
  function legend(acts) { return '<div class="row" style="flex-wrap:wrap;gap:10px">' + acts.map(function (a) { return '<span class="small"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + COL[a] + ';margin-right:4px;vertical-align:-1px"></span>' + shortLabel(a) + '</span>'; }).join('') + '</div>'; }
  // poids de chaque combinaison : probabilité d'avoir joué la ligne du flop jusqu'ici (et d'être encore dans le coup)
  function reachW(S, n, tl) {
    var w = n._c.map(function () { return 1; });
    if (!tl) return w;
    var segs = tl.line.split('-'), pre = '';
    for (var i = 0; i < segs.length; i++) {
      var fn = S.nodes[pre];
      if (fn) { decodeNode(fn, S); if (fn.p === n.p) { var k = fn.a.indexOf(segs[i]); if (k >= 0) fn._m.forEach(function (row, j) { w[j] *= row[k]; }); } }
      pre = pre ? pre + '-' + segs[i] : segs[i];
    }
    var tc = tl.card; n._c.forEach(function (c, j) { if (c.substr(0, 2) === tc || c.substr(2, 2) === tc) w[j] = 0; });
    return w;
  }
  function summary(n, board, w) {
    var tot = n.a.map(function () { return 0; }), cat = {}, W = 0;
    n._m.forEach(function (row, i) {
      var wi = w ? w[i] : 1; if (wi <= 0) return; W += wi;
      row.forEach(function (v, a) { tot[a] += v * wi; });
      var c = category(n._c[i], board); cat[c] = cat[c] || { n: 0, mix: n.a.map(function () { return 0; }) }; cat[c].n += wi; row.forEach(function (v, a) { cat[c].mix[a] += v * wi; });
    });
    tot = tot.map(function (x) { return W ? x / W : 0; });
    Object.keys(cat).forEach(function (k) { cat[k].mix = cat[k].mix.map(function (x) { return x / cat[k].n; }); });
    return { tot: tot, cat: cat, N: W };
  }
  function classOf(c) { var a = c[0], b = c[2]; if (R.indexOf(a) < R.indexOf(b)) { var t = a; a = b; b = t; } return a === b ? a + b : a + b + (c[1] === c[3] ? 's' : 'o'); }
  function handMix(n, code, w) {
    var acc = n.a.map(function () { return 0; }), k = 0;
    n._c.forEach(function (c, i) { var wi = w ? w[i] : 1; if (classOf(c) === code && wi > 0) { k += wi; n._m[i].forEach(function (v, a) { acc[a] += v * wi; }); } });
    return k ? acc.map(function (x) { return x / k; }) : null;
  }
  var ART = { BTN: 'le bouton', CO: 'le cut-off', SB: 'la petite blinde', BB: 'la grosse blinde' };
  function spotOf(id) { return DATA.spots.filter(function (s) { return s.id === id; })[0]; }
  function whoName(spot, p) { var sp = spotOf(spot); return PA.POS_LABEL[p === 0 ? sp.oop : sp.ip]; }
  function who2(spot, p) { var sp = spotOf(spot); return ART[p === 0 ? sp.oop : sp.ip]; }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function lineText(line) { return line.split('-').map(function (a) { return a === 'x' ? 'check' : a === 'c' ? 'payé' : 'mise ' + shortLabel(a); }).join(', '); }
  function turnKind(card, flop) {
    var b = [flop.substr(0, 2), flop.substr(2, 2), flop.substr(4, 2)], r = rk(card), br = b.map(rk), top = Math.max.apply(null, br);
    var sc = b.filter(function (c) { return c[1] === card[1]; }).length;
    if (br.indexOf(r) >= 0) return r === top ? 'double le haut du tableau' : 'double le tableau';
    if (sc >= 2) return sc === 3 ? 'quatrième carte à la couleur' : 'complète un tirage couleur possible';
    if (r > top) return 'carte plus haute que le tableau';
    if (r >= 9) return 'carte haute';
    if (r <= 2) return 'petite carte';
    return 'carte moyenne';
  }

  /* ---------- Explorateur ---------- */
  var EX = { spot: 'btn-bb', flop: null, path: null, hand: '', tl: null, tpath: '' };
  function explorer() {
    var ui = U();
    if (!DATA) { load(function () { ui.render(); }); return ui.shell('apprendre', '<div class="stack"><h1>Solveur</h1><p class="muted">Chargement des solutions…</p></div>'); }
    if (DATA.err) return ui.shell('apprendre', '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Solveur</h1>' + ui.yo('Les solutions ne sont pas incluses dans cette version de test en ligne : elles sont dans l’appli installée (PC et Android).') + '</div>');
    var sp = spotOf(EX.spot);
    if (!EX.flop || DATA.flops.indexOf(EX.flop) < 0) EX.flop = DATA.flops[0];
    var S = sol(EX.spot, EX.flop);
    if (EX.path === null) EX.path = sp.oopBets ? '' : 'x';
    var tl = EX.tl, n, board = EX.flop, w = null;
    if (tl) {
      if (!turnData(S.spot, S.flop, function () { ui.render(); })) return ui.shell('apprendre', '<div class="stack"><h1>Solveur</h1><p class="muted">Chargement de la turn…</p></div>');
      n = node(S, EX.tpath, tl); board = EX.flop + tl.card; w = reachW(S, n, tl);
    } else n = node(S, EX.path);
    var sm = summary(n, board, w);
    var head = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Solveur</h1>' +
      '<div class="seg">' + DATA.spots.map(function (s) { return '<button class="' + (EX.spot === s.id ? 'on' : '') + '" data-sact="spot" data-v="' + s.id + '">' + s.name + '</button>'; }).join('') + '</div>' +
      '<div class="card stack" style="gap:8px"><b>Flop</b><div class="row" style="flex-wrap:wrap;gap:6px">' + DATA.flops.map(function (f) { return '<button data-sact="flop" data-v="' + f + '" style="padding:4px;border-radius:8px;border:2px solid ' + (EX.flop === f ? 'var(--gold)' : 'var(--line)') + ';background:var(--panel2)">' + cardsTxt(f) + '</button>'; }).join('') + '</div></div>';
    var nav = '', kids;
    if (!tl) {
      var parts = EX.path ? EX.path.split('-') : [], crumbs = '<button class="btn" data-sact="path" data-v="' + (sp.oopBets ? '' : 'x') + '" style="min-height:36px;padding:2px 10px">Flop</button>';
      for (var i = sp.oopBets ? 0 : 1; i < parts.length; i++) { var pp = parts.slice(0, i + 1).join('-'); if (S.nodes[pp]) crumbs += ' › <button class="btn" data-sact="path" data-v="' + pp + '" style="min-height:36px;padding:2px 10px">' + shortLabel(parts[i]) + '</button>'; }
      kids = n.a.map(function (a) { var p = EX.path ? EX.path + '-' + a : a; return S.nodes[p] ? '<button class="btn" data-sact="path" data-v="' + p + '" style="min-height:40px">Si ' + shortLabel(a).toLowerCase() + ' ›</button>' : (S.lines && S.lines[p] ? '<button class="btn gold" data-sact="turn" data-v="' + p + '" style="min-height:40px">Si ' + shortLabel(a).toLowerCase() + ' : voir la turn ›</button>' : ''); }).join('');
      nav = '<div class="small">' + crumbs + '</div>';
    } else {
      var tparts = EX.tpath ? EX.tpath.split('-') : [], tcr = '<button class="btn" data-sact="path" data-v="' + EX.path + '" style="min-height:36px;padding:2px 10px">Flop</button> › <button class="btn" data-sact="tpath" data-v="" style="min-height:36px;padding:2px 10px">Turn</button>';
      for (var t = 0; t < tparts.length; t++) { var tp = tparts.slice(0, t + 1).join('-'); tcr += ' › <button class="btn" data-sact="tpath" data-v="' + tp + '" style="min-height:36px;padding:2px 10px">' + shortLabel(tparts[t]) + '</button>'; }
      var T = turnData(S.spot, S.flop)[tl.line];
      kids = n.a.map(function (a) { var p = EX.tpath ? EX.tpath + '-' + a : a; return T.nodes[tl.card][p] ? '<button class="btn" data-sact="tpath" data-v="' + p + '" style="min-height:40px">Si ' + shortLabel(a).toLowerCase() + ' ›</button>' : ''; }).join('');
      nav = '<div class="small muted">Au flop : ' + lineText(tl.line) + '.</div><div class="small">' + tcr + '</div>' +
        '<div class="row" style="flex-wrap:wrap;gap:6px">' + T.cards.map(function (c) { return '<button data-sact="tcard" data-v="' + c + '" style="padding:4px 6px;border-radius:8px;border:2px solid ' + (tl.card === c ? 'var(--gold)' : 'var(--line)') + ';background:var(--panel2)" title="' + turnKind(c, EX.flop) + '">' + cardTxt(c) + '</button>'; }).join('') + '</div><div class="small muted">Turn : ' + turnKind(tl.card, EX.flop) + '.</div>';
    }
    var hm = EX.hand ? handMix(n, EX.hand, w) : null;
    var body = head + '<div class="card stack"><div class="row" style="justify-content:space-between;flex-wrap:wrap">' + boardCards(board) + '<div class="small muted">Pot ' + f1(n.pot) + ' BB · tapis ' + f1(S.stack) + ' BB<br>Précision : ' + String(S.exp).replace('.', ',') + ' % du pot</div></div>' + nav +
      '<div><b>' + cap(who2(EX.spot, n.p)) + '</b> joue' + (n.call ? ' face à une mise de ' + f1(n.call) + ' BB' : '') + ' :</div>' + legend(n.a) + bar(sm.tot, n.a) +
      '<div class="small muted">' + n.a.map(function (a, k) { return shortLabel(a) + ' ' + pc(sm.tot[k]); }).join(' · ') + '</div>' +
      (kids ? '<div class="row" style="flex-wrap:wrap">' + kids + '</div>' : '') + '</div>' +
      '<div class="card stack"><b>Par famille de mains</b><table class="tbl"><tr><th>Famille</th><th>Part</th><th>Stratégie</th></tr>' +
      CATS.filter(function (c) { return sm.cat[c] && sm.cat[c].n / sm.N >= 0.005; }).map(function (c) { return '<tr><td>' + c + '</td><td>' + pc(sm.cat[c].n / sm.N) + '</td><td>' + bar(sm.cat[c].mix, n.a) + '</td></tr>'; }).join('') + '</table></div>' +
      '<div class="card stack"><b>Une main précise</b><div class="row"><input id="solHand" placeholder="ex. AKo, 77, 98s" value="' + ui.esc(EX.hand) + '" style="width:130px;min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit"><button class="btn" data-sact="hand">Voir</button></div>' +
      (EX.hand ? (hm ? bar(hm, n.a) + '<div class="small">' + n.a.map(function (a, k) { return shortLabel(a) + ' ' + pc(hm[k]); }).join(' · ') + '</div>' : '<div class="small muted">Cette main n’est pas dans la range de ce joueur à ce moment du coup.</div>') : '') + '</div>' +
      '<p class="small muted">Flop et turn calculés : au flop, check, mises de 1/3, 1/2, 3/4 et 125 % du pot, relance à 3 fois, tapis ; à la turn, check, mises de 1/2 pot et du pot, tapis, sur les 47 cartes possibles. La river est estimée par la force des mains. Ranges du profil TAG, tapis de 40 BB, pot simple avec ante. La turn est affichée pour six cartes types sur les deux suites de coup les plus fréquentes.</p></div>';
    return ui.shell('apprendre', body);
  }

  /* ---------- Exercice « Après le flop » ---------- */
  var QZ = null;
  function flopDecisions(S, spot) {
    var sp = spotOf(spot);
    return Object.keys(S.nodes).filter(function (p) {
      var segs = p ? p.split('-') : [];
      if (sp.oopBets) return segs.length <= 1 || (segs.length === 2 && segs[0] === 'x');
      return (segs.length === 1 && p === 'x') || (segs.length === 2 && segs[0] === 'x' && segs[1] !== 'ai');
    }).filter(function (p) { return S.nodes[p].a.length > 1; });
  }
  function pickWeighted(w) { var s = 0; w.forEach(function (x) { s += x; }); if (s <= 0) return -1; var r = Math.random() * s; for (var i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return w.length - 1; }
  function newQuestion(cb) {
    var pend = QZ && QZ.pend; if (QZ) QZ.pend = null;
    var spot = pend ? pend.spot : DATA.spots[Math.floor(Math.random() * DATA.spots.length)].id, flop = pend ? pend.flop : DATA.flops[Math.floor(Math.random() * DATA.flops.length)], S = sol(spot, flop);
    var tl = null, path, n, w = null;
    var wantTurn = (pend || Math.random() < 0.4) && S.lines && Object.keys(S.lines).length;
    if (wantTurn) {
      var T = turnData(spot, flop, cb);
      if (!T) { if (QZ) QZ.pend = { spot: spot, flop: flop }; return null; } // chargement en cours : on reprend ce même coup
      var lines = Object.keys(S.lines), line = lines[Math.floor(Math.random() * lines.length)], cards = S.lines[line], card = cards[Math.floor(Math.random() * cards.length)];
      tl = { line: line, card: card };
      var tps = Object.keys(T[line].nodes[card]).filter(function (p) { var s = p ? p.split('-') : []; return s.length <= 2 && T[line].nodes[card][p].a.length > 1 && s.indexOf('ai') < 0; });
      path = tps[Math.floor(Math.random() * tps.length)]; n = node(S, path, tl); w = reachW(S, n, tl);
    } else {
      var nodes = flopDecisions(S, spot); path = nodes[Math.floor(Math.random() * nodes.length)]; n = node(S, path);
    }
    var idx = -1;
    for (var tries = 0; tries < 15; tries++) {
      var j = w ? pickWeighted(w) : Math.floor(Math.random() * n._c.length); if (j < 0) break;
      idx = j; if (Math.max.apply(null, n._m[j]) < 0.85 || Math.random() < 0.4) break;
    }
    if (idx < 0) return newQuestion(cb);
    return { spot: spot, flop: flop, path: path, tl: tl, i: idx, hand: n._c[idx] };
  }
  function startQuiz() { QZ = { n: 10, k: 0, ok: 0, mix: 0, q: null, ans: null }; }
  function situationText(q, n, sp) {
    var me = n.p, opp = who2(q.spot, 1 - me), Opp = cap(opp), il = /^la /.test(opp) ? 'elle' : 'il';
    var pre = me === 1 ? (q.spot === 'sb-bb' ? Opp + ' a ouvert à 3 BB, tu as payé.' : 'Tu as ouvert à 2 BB, ' + opp + ' a payé.') : (q.spot === 'sb-bb' ? 'Tu as ouvert à 3 BB, ' + opp + ' a payé.' : Opp + ' a ouvert à 2 BB, tu as payé.');
    function seq(path, firstToAct) {
      if (!path) return [];
      var who = firstToAct, out = [];
      path.split('-').forEach(function (a) {
        var subj = who === me ? 'tu ' : il + ' ';
        var verb = a === 'x' ? (who === me ? 'checkes' : 'checke') : a === 'c' ? (who === me ? 'paies' : 'paie') : a === 'f' ? 'se couche' : a === 'r' ? (who === me ? 'relances' : 'relance') : a === 'ai' ? (who === me ? 'fais tapis' : 'fait tapis') : (who === me ? 'mises ' : 'mise ') + shortLabel(a);
        out.push(subj + verb); who = 1 - who;
      });
      return out;
    }
    var flopTxt = seq(q.tl ? q.tl.line : q.path, 0), turnTxt = q.tl ? seq(q.path, 0) : [];
    var s = pre + ' Au flop, ' + (flopTxt.length ? flopTxt.join(', ') : 'tu parles en premier') + '.';
    if (q.tl) s += ' Turn : ' + turnKind(q.tl.card, q.flop) + '. ' + (turnTxt.length ? cap(turnTxt.join(', ')) + '.' : (me === 0 ? 'Tu parles en premier.' : ''));
    return s;
  }
  function quizView() {
    var ui = U();
    if (!DATA) { load(function () { ui.render(); }); return ui.shell('entrainer', '<div class="stack"><h1>Après le flop</h1><p class="muted">Chargement des solutions…</p></div>'); }
    if (DATA.err) return ui.shell('entrainer', '<div class="stack"><button class="back" data-act="nav" data-v="situations">‹ Situations</button><h1>Après le flop</h1>' + ui.yo('Les solutions ne sont pas incluses dans cette version de test en ligne : elles sont dans l’appli installée (PC et Android).') + '</div>');
    if (!QZ) startQuiz();
    if (QZ.k >= QZ.n) {
      var pct = Math.round((QZ.ok + QZ.mix * 0.5) / QZ.n * 100);
      if (!QZ.saved) { var p = PA.player(); p.sessions.unshift({ at: Date.now(), label: 'Après le flop', n: QZ.n, ok: QZ.ok, style: QZ.mix, err: QZ.n - QZ.ok - QZ.mix, consult: 0 }); PA.save(); QZ.saved = true; }
      return ui.shell('entrainer', '<div class="stack"><h1>Bilan</h1>' + ui.yo(pct >= 80 ? 'Très bien : tes décisions ressemblent à celles du solveur.' : pct >= 55 ? 'Pas mal. Regarde dans l’explorateur les familles de mains où tu t’écartes.' : 'Le jeu après le flop demande du temps : refais une série, et ouvre l’explorateur sur les coups ratés.') +
        '<div class="grid2"><div class="card"><div class="muted small">Comme le solveur</div><div class="disp" style="font-size:40px">' + QZ.ok + ' / ' + QZ.n + '</div></div><div class="card"><div class="muted small">Jouable (mixte) · erreur</div><div class="disp" style="font-size:40px">' + QZ.mix + ' · ' + (QZ.n - QZ.ok - QZ.mix) + '</div></div></div>' +
        '<div class="row"><button class="btn gold" data-sact="again" style="flex:1">Encore 10 coups</button><button class="btn" data-act="nav" data-v="situations">Terminer</button></div></div>', true);
    }
    if (!QZ.q) { QZ.q = newQuestion(function () { ui.render(); }); if (!QZ.q) return ui.shell('entrainer', '<div class="stack"><h1>Après le flop</h1><p class="muted">Chargement…</p></div>', true); }
    var q = QZ.q, S = sol(q.spot, q.flop), n = node(S, q.path, q.tl), sp = spotOf(q.spot), board = q.flop + (q.tl ? q.tl.card : '');
    var me = whoName(q.spot, n.p);
    var out = '<div class="stack" style="max-width:640px;margin:0 auto"><div class="row" style="justify-content:space-between"><button class="back" data-sact="quit">‹ Arrêter</button><span class="small muted">' + (QZ.k + 1) + ' / ' + QZ.n + (q.tl ? ' · turn' : ' · flop') + '</span></div>' +
      '<div class="card stack"><div class="row" style="gap:6px;flex-wrap:wrap"><span class="chip">' + me + '</span><span class="chip" style="border-color:#555;color:#c9c9cf">Pot ' + f1(n.pot) + ' BB · tapis ' + f1(S.stack) + ' BB</span></div>' +
      '<div class="small muted">' + situationText(q, n, sp) + '</div>' + boardCards(board) +
      '<div class="row" style="gap:10px;align-items:center"><span class="small muted">Ta main</span>' + bigCard(q.hand.substr(0, 2)) + bigCard(q.hand.substr(2, 2)) + '<span class="small">' + category(q.hand, board) + '</span></div></div>';
    if (!QZ.ans) out += '<div class="stack" style="gap:8px">' + n.a.map(function (a) { return '<button class="btn" data-sact="ans" data-v="' + a + '" style="min-height:52px;text-align:left">' + actLabel(a, n) + '</button>'; }).join('') + '</div>';
    else {
      var mix = n._m[q.i], best = 0; mix.forEach(function (v, a) { if (v > mix[best]) best = a; });
      var verdict = QZ.ans.v === 'ok' ? ['Comme le solveur', '#4fe08f'] : QZ.ans.v === 'mix' ? ['Jouable : stratégie mixte', '#ffd43b'] : ['Erreur', '#ff8080'];
      var sm = summary(n, board, q.tl ? reachW(S, n, q.tl) : null);
      out += '<div class="card stack"><div class="disp" style="font-size:28px;color:' + verdict[1] + '">' + verdict[0] + '</div>' +
        '<div>Le solveur, avec cette main : ' + n.a.map(function (a, j) { return mix[j] >= 0.02 ? '<b>' + shortLabel(a) + '</b> ' + pc(mix[j]) : ''; }).filter(Boolean).join(' · ') + '</div>' + legend(n.a) + bar(mix, n.a) +
        '<div class="small muted">Toute la range ' + who2(q.spot, n.p).replace(/^le /, 'du ').replace(/^la /, 'de la ') + ' ici : ' + n.a.map(function (a, j) { return shortLabel(a) + ' ' + pc(sm.tot[j]); }).join(' · ') + '</div></div>' +
        ui.yo(explain(n, q, mix, best, sm, board)) +
        '<div class="row"><button class="btn gold" data-sact="next" style="flex:1">Coup suivant</button><button class="btn" data-sact="explore">Ouvrir dans l’explorateur</button></div>';
    }
    return ui.shell('entrainer', out + '</div>', true);
  }
  function explain(n, q, mix, best, sm, board) {
    var cat = category(q.hand, board), c = sm.cat[cat], a = n.a[best];
    var catTxt = c ? 'Avec ' + cat.toLowerCase() + ', le solveur joue en moyenne : ' + n.a.map(function (x, j) { return c.mix[j] >= 0.1 ? shortLabel(x).toLowerCase() + ' ' + pc(c.mix[j]) : ''; }).filter(Boolean).join(', ') + '.' : '';
    var why;
    if (a === 'f') why = 'Ta main n’a pas assez d’équité face à cette mise : payer perdrait de l’argent.';
    else if (a === 'c') why = 'Ta main a assez d’équité pour payer, mais relancer ferait coucher les mains que tu bats.';
    else if (a === 'r' || a === 'ai') why = 'Relancer ici rapporte : soit tu fais coucher des mains qui ont de l’équité, soit tu te fais payer par pire.';
    else if (a === 'x') why = 'Checker protège ta range et garde les mains moyennes dans le coup.';
    else if (a === 'b33' || a === 'b50') why = 'Une mise petite ou moyenne suffit : beaucoup de mains adverses doivent abandonner ou payer cher pour leur équité.';
    else why = 'Une grosse mise met la pression : elle fait payer les mains moyennes et les tirages, ou les fait coucher.';
    return why + ' ' + catTxt;
  }
  function judge(a) {
    var q = QZ.q, n = node(sol(q.spot, q.flop), q.path, q.tl), mix = n._m[q.i], k = n.a.indexOf(a), mx = Math.max.apply(null, mix);
    var v = mix[k] >= 0.5 || mix[k] >= mx - 0.1 ? 'ok' : (mix[k] >= 0.15 ? 'mix' : 'err');
    QZ.ans = { a: a, v: v }; if (v === 'ok') QZ.ok++; else if (v === 'mix') QZ.mix++;
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-sact]') : null; if (!t) return;
    var a = t.getAttribute('data-sact'), v = t.getAttribute('data-v');
    if (a === 'spot') { EX.spot = v; EX.path = null; EX.tl = null; }
    else if (a === 'flop') { EX.flop = v; EX.tl = null; var S0 = sol(EX.spot, v); if (EX.path !== null && !S0.nodes[EX.path]) EX.path = null; }
    else if (a === 'path') { EX.path = v; EX.tl = null; }
    else if (a === 'turn') { var S1 = sol(EX.spot, EX.flop); EX.tl = { line: v, card: S1.lines[v][0] }; EX.tpath = ''; }
    else if (a === 'tcard') { EX.tl = { line: EX.tl.line, card: v }; }
    else if (a === 'tpath') EX.tpath = v;
    else if (a === 'hand') { var h = (document.getElementById('solHand').value || '').trim().replace(/^10/, 'T'); h = h.length >= 2 ? h[0].toUpperCase() + h[1].toUpperCase() + (h[2] ? h[2].toLowerCase() : '') : ''; EX.hand = h; }
    else if (a === 'ans') { if (!QZ.ans) judge(v); }
    else if (a === 'next') { QZ.k++; QZ.ans = null; QZ.q = null; }
    else if (a === 'again') startQuiz();
    else if (a === 'quit') { QZ = null; location.hash = '#situations'; }
    else if (a === 'explore') { var q = QZ.q; EX.spot = q.spot; EX.flop = q.flop; if (q.tl) { EX.tl = q.tl; EX.tpath = q.path; EX.path = sol(q.spot, q.flop).nodes['x'] ? 'x' : ''; } else { EX.tl = null; EX.path = q.path; } EX.hand = classOf(q.hand); location.hash = '#solveur'; return; }
    U().render();
  });
  window.PA_SOLVER = { explorer: explorer, quiz: quizView, category: category };
})();
