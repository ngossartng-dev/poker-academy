/* Poker Academy v2.0 — Solveur : flop et turn calculés à l'avance, river calculée dans l'appli ; explorateur et exercice « Après le flop » */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }
  var R = '23456789TJQKA', SUIT = { s: ['♠', 0], h: ['♥', 1], d: ['♦', 1], c: ['♣', 0] };
  var DATA = null, LOADING = false, LOADQ = {};

  /* ---------- Chargement à la demande ---------- */
  function script(src, key, cb) {
    if (LOADQ[key]) { if (cb) LOADQ[key].push(cb); return; }
    LOADQ[key] = cb ? [cb] : [];
    var s = document.createElement('script'); s.src = src;
    s.onload = s.onerror = function () { var l = LOADQ[key]; delete LOADQ[key]; l.forEach(function (f) { f(); }); };
    document.head.appendChild(s);
  }
  function load(cb) {
    if (window.PA_SOLVER_DATA) { DATA = window.PA_SOLVER_DATA; cb(); return; }
    if (LOADING) return; LOADING = true;
    script('solver/data.js', 'data', function () { DATA = window.PA_SOLVER_DATA || { err: true }; LOADING = false; cb(); });
  }
  function spotLoaded(spot) { return !!(window.PA_SOLVER_FLOP && window.PA_SOLVER_FLOP[spot]); }
  function ensureSpot(spot, cb) { if (spotLoaded(spot)) return true; script('solver/flop/' + spot + '.js', 'f' + spot, cb); return false; }
  function turnData(spot, flop, cb) {
    var k = spot + '|' + flop, T = window.PA_SOLVER_TURN || {};
    if (T[k]) return T[k];
    script('solver/turn/' + spot + '/' + flop + '.js', 't' + k, cb);
    return null;
  }
  function sol(spot, flop) { var F = window.PA_SOLVER_FLOP && window.PA_SOLVER_FLOP[spot]; return F && F[spot + '|' + flop]; }

  /* ---------- Cartes ---------- */
  function cardTxt(c) { var su = SUIT[c[1]]; return '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:2.1em;padding:2px 4px;margin:0 2px;border-radius:6px;background:#fff;color:' + (su[1] ? '#d61f1f' : '#111') + ';font-weight:800">' + (c[0] === 'T' ? '10' : c[0]) + su[0] + '</span>'; }
  function cardsTxt(s) { var o = ''; for (var i = 0; i < s.length; i += 2) o += cardTxt(s.substr(i, 2)); return o; }
  function bigCard(c, extra) { var su = SUIT[c[1]]; return '<div class="pc' + (su[1] ? ' red' : '') + '"' + (extra || '') + '><span class="r">' + (c[0] === 'T' ? '10' : c[0]) + '</span><span class="s">' + su[0] + '</span></div>'; }
  function boardCards(b) { var o = ''; for (var i = 0; i < b.length; i += 2) o += bigCard(b.substr(i, 2), i >= 6 ? ' style="margin-left:' + (i === 6 ? 10 : 4) + 'px;outline:3px solid var(--gold)"' : ''); return '<div class="row" style="gap:4px;flex-wrap:nowrap' + (b.length >= 10 ? ';zoom:.8' : '') + '">' + o + '</div>'; }

  /* ---------- Familles de mains (flop, turn ou river) ---------- */
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
  function tnodes(S, tl) { var T = turnData(S.spot, S.flop); return T && T[tl.line] ? T[tl.line].nodes[tl.card] : null; }
  function node(S, path, tl) {
    if (!tl) { var n = S.nodes[path]; return n ? decodeNode(n, S) : null; }
    var N = tnodes(S, tl); var nn = N && N[path]; return nn ? decodeNode(nn, S) : null;
  }
  function hasCard(c, x) { return c.substr(0, 2) === x || c.substr(2, 2) === x; }
  // poids de chaque main du joueur p : probabilité d'avoir joué ainsi jusqu'ici (flop, puis turn, puis carte de river)
  function rangeAt(S, p, tl, tpath, rc) {
    var C = p === 0 ? S.c0 : S.c1, nc = C.length / 4, w = [], i;
    for (i = 0; i < nc; i++) w.push(1);
    function apply(nodeAt, segs) {
      var pre = '';
      for (var s = 0; s < segs.length; s++) {
        var nd = nodeAt(pre);
        if (nd && nd.p === p) { var k = nd.a.indexOf(segs[s]); if (k >= 0) for (var j = 0; j < nc; j++) w[j] *= nd._m[j][k]; }
        pre = pre ? pre + '-' + segs[s] : segs[s];
      }
    }
    if (tl) {
      apply(function (pp) { var fn = S.nodes[pp]; return fn ? decodeNode(fn, S) : null; }, tl.line.split('-'));
      for (i = 0; i < nc; i++) if (hasCard(C.substr(i * 4, 4), tl.card)) w[i] = 0;
      if (tpath) apply(function (pp) { return node(S, pp, tl); }, tpath.split('-'));
    }
    if (rc) for (i = 0; i < nc; i++) if (hasCard(C.substr(i * 4, 4), rc)) w[i] = 0;
    return w;
  }

  /* ---------- River calculée ---------- */
  // fin de turn qui mène à la river : check derrière, ou mise payée sans tapis
  function riverEnd(S, tl, p) {
    var parts = p.split('-'), last = parts.pop(), par = parts.join('-'), nd = node(S, par, tl);
    if (!nd) return null;
    var P;
    if (last === 'x' && nd.p === 1 && !nd.call) P = nd.pot;
    else if (last === 'c' && parts[parts.length - 1] !== 'ai') P = nd.pot + nd.call;
    else return null;
    var Rm = Math.round((S.stack - (P - S.pot) / 2) * 10) / 10;
    return Rm > 0.4 ? { P: Math.round(P * 10) / 10, R: Rm } : null;
  }
  var RIV = {};
  function riverKey(S, tl, tend, rc) { return S.spot + '|' + S.flop + '|' + tl.line + '|' + tl.card + '|' + tend + '|' + rc; }
  function riverSol(S, tl, tend, rc) {
    var key = riverKey(S, tl, tend, rc); if (RIV[key]) return RIV[key];
    var e = riverEnd(S, tl, tend); if (!e) return null;
    var cid = window.PA_RIVER.cid, board = [];
    var bs = S.flop + tl.card + rc; for (var i = 0; i < bs.length; i += 2) board.push(cid(bs.substr(i, 2)));
    var combos = [S.c0, S.c1].map(function (C) { var o = []; for (var j = 0; j < C.length; j += 4) o.push([cid(C.substr(j, 2)), cid(C.substr(j + 2, 2))]); return o; });
    var w = [rangeAt(S, 0, tl, tend, rc), rangeAt(S, 1, tl, tend, rc)];
    var r = window.PA_RIVER.solve(board, combos, w, e.P, e.R, 160);
    if (!r) return null;
    Object.keys(r.nodes).forEach(function (k) {
      var n = r.nodes[k], C = n.p === 0 ? S.c0 : S.c1;
      n._m = n.m; n._w = n.w; n._c = n.idx.map(function (ix) { return C.substr(ix * 4, 4); });
    });
    RIV[key] = r; return r;
  }
  function riverReady(S, tl, tend, rc) { return !!RIV[riverKey(S, tl, tend, rc)]; }

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
    n._c.forEach(function (c, i) { var wi = w ? w[i] : 1; if (classOf(c) === code && wi > 1e-4) { k += wi; n._m[i].forEach(function (v, a) { acc[a] += v * wi; }); } });
    return k ? acc.map(function (x) { return x / k; }) : null;
  }
  var ART = { UTG: 'UTG', 'UTG+1': 'UTG+1', MP: 'le middle position', LJ: 'le lojack', HJ: 'le hijack', CO: 'le cut-off', BTN: 'le bouton', SB: 'la petite blinde', BB: 'la grosse blinde' };
  function spotOf(id) { return DATA.spots.filter(function (s) { return s.id === id; })[0]; }
  function whoName(spot, p) { var sp = spotOf(spot); return PA.POS_LABEL[p === 0 ? sp.oop : sp.ip]; }
  function who2(spot, p) { var sp = spotOf(spot); return ART[p === 0 ? sp.oop : sp.ip] || (p === 0 ? sp.oop : sp.ip); }
  function de(t) { return t.replace(/^le /, 'du ').replace(/^la /, 'de la ').replace(/^([A-Z])/, 'de $1'); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function lineText(line) { return line.split('-').map(function (a) { return a === 'x' ? 'check' : a === 'c' ? 'payé' : a === 'f' ? 'couché' : 'mise ' + shortLabel(a); }).join(', '); }
  function cardKind(card, boardStr) {
    var b = []; for (var i = 0; i < boardStr.length; i += 2) b.push(boardStr.substr(i, 2));
    var r = rk(card), br = b.map(rk), top = Math.max.apply(null, br);
    var sc = b.filter(function (c) { return c[1] === card[1]; }).length;
    if (br.indexOf(r) >= 0) return r === top ? 'double le haut du tableau' : 'double le tableau';
    if (b.length === 4 && sc >= 2) return sc >= 3 ? 'complète la couleur (4e carte)' : 'complète une couleur possible';
    if (b.length === 3 && sc >= 2) return sc === 3 ? 'quatrième carte à la couleur' : 'complète un tirage couleur possible';
    if (r > top) return 'carte plus haute que le tableau';
    if (r >= 9) return 'carte haute';
    if (r <= 2) return 'petite carte';
    return 'carte moyenne';
  }
  // six cartes de river types, de genres différents
  function riverCards(board4) {
    var used = {}; for (var i = 0; i < board4.length; i += 2) used[board4.substr(i, 2)] = 1;
    var cand = []; for (var r = 12; r >= 0; r--) 'shdc'.split('').forEach(function (s) { var c = R[r] + s; if (!used[c]) cand.push(c); });
    var sc = {}; for (var j = 0; j < board4.length; j += 2) sc[board4[j + 1]] = (sc[board4[j + 1]] || 0) + 1;
    cand.sort(function (x, y) { return (sc[x[1]] || 0) - (sc[y[1]] || 0); });
    var byKind = {}, order = [];
    cand.forEach(function (c) { var k = cardKind(c, board4); if (!byKind[k]) { byKind[k] = []; order.push(k); } byKind[k].push(c); });
    var out = [];
    order.forEach(function (k) { if (out.length < 6) out.push(byKind[k][0]); });
    for (var t = 1; out.length < 6; t++) { var added = false; order.forEach(function (k) { if (out.length < 6 && byKind[k][t * 3]) { out.push(byKind[k][t * 3]); added = true; } }); if (!added) break; }
    return out;
  }

  /* ---------- Explorateur ---------- */
  var EX = { spot: 'btn-bb', flop: null, path: null, hand: '', tl: null, tpath: '', rv: null };
  var crumb = function (act, v, txt) { return '<button class="btn" data-sact="' + act + '" data-v="' + v + '" style="min-height:36px;padding:2px 10px">' + txt + '</button>'; };
  function spotPicker() {
    var groups = [];
    DATA.spots.forEach(function (s) { var g = groups.filter(function (x) { return x.name === s.group; })[0]; if (!g) { g = { name: s.group, l: [] }; groups.push(g); } g.l.push(s); });
    return '<div class="card stack" style="gap:8px">' + groups.map(function (g) {
      return '<div class="small muted">' + (g.name || '') + '</div><div class="row" style="flex-wrap:wrap;gap:6px">' + g.l.map(function (s) { return '<button class="btn' + (EX.spot === s.id ? ' gold' : '') + '" data-sact="spot" data-v="' + s.id + '" style="min-height:40px;padding:4px 12px">' + s.name + '</button>'; }).join('') + '</div>';
    }).join('') + '</div>';
  }
  function explorer() {
    var ui = U();
    if (!DATA) { load(function () { ui.render(); }); return ui.shell('apprendre', '<div class="stack"><h1>Solveur</h1><p class="muted">Chargement des solutions…</p></div>'); }
    if (DATA.err) return ui.shell('apprendre', '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Solveur</h1>' + ui.yo('Les solutions ne sont pas incluses dans cette version : elles sont dans l’appli installée (PC et Android).') + '</div>');
    if (!spotOf(EX.spot)) EX.spot = DATA.spots[0].id;
    var sp = spotOf(EX.spot), wait = function (t) { return ui.shell('apprendre', '<div class="stack"><h1>Solveur</h1><p class="muted">' + t + '</p></div>'); };
    if (!ensureSpot(EX.spot, function () { ui.render(); })) return wait('Chargement du coup…');
    if (!EX.flop || sp.flops.indexOf(EX.flop) < 0) EX.flop = sp.flops[0];
    var S = sol(EX.spot, EX.flop);
    if (EX.path === null || !S.nodes[EX.path]) EX.path = sp.oopBets ? '' : 'x';
    var tl = EX.tl, n, board = EX.flop, w = null, info = '', nav = '', kids = '', stackNow = S.stack, exp = S.exp, rsol = null;
    if (tl && !turnData(S.spot, S.flop, function () { ui.render(); })) return wait('Chargement de la turn…');
    if (EX.rv) {
      if (!riverReady(S, tl, EX.rv.tend, EX.rv.card)) { setTimeout(function () { riverSol(S, tl, EX.rv.tend, EX.rv.card); ui.render(); }, 30); return wait('Calcul de la river…'); }
      rsol = riverSol(S, tl, EX.rv.tend, EX.rv.card);
    }
    var flopCr = crumb('path', EX.path, 'Flop');
    if (rsol && rsol.nodes[EX.rv.rpath]) {
      n = rsol.nodes[EX.rv.rpath]; w = n._w; board = EX.flop + tl.card + EX.rv.card; stackNow = rsol.R; exp = rsol.exp;
      var rparts = EX.rv.rpath ? EX.rv.rpath.split('-') : [], rcr = flopCr + ' › ' + crumb('tpath', EX.rv.tend, 'Turn') + ' › ' + crumb('rpath', '', 'River');
      for (var q = 0; q < rparts.length; q++) rcr += ' › ' + crumb('rpath', rparts.slice(0, q + 1).join('-'), shortLabel(rparts[q]));
      kids = n.a.map(function (a) { var p = EX.rv.rpath ? EX.rv.rpath + '-' + a : a; return rsol.nodes[p] ? '<button class="btn" data-sact="rpath" data-v="' + p + '" style="min-height:40px">Si ' + shortLabel(a).toLowerCase() + ' ›</button>' : ''; }).join('');
      var rcs = riverCards(EX.flop + tl.card); if (rcs.indexOf(EX.rv.card) < 0) rcs.push(EX.rv.card);
      nav = '<div class="small muted">Au flop : ' + lineText(tl.line) + '. À la turn : ' + lineText(EX.rv.tend) + '.</div><div class="small">' + rcr + '</div>' +
        '<div class="row" style="flex-wrap:wrap;gap:6px">' + rcs.map(function (c) { return '<button data-sact="rcard" data-v="' + c + '" style="padding:4px 6px;border-radius:8px;border:2px solid ' + (EX.rv.card === c ? 'var(--gold)' : 'var(--line)') + ';background:var(--panel2)">' + cardTxt(c) + '</button>'; }).join('') + '</div><div class="small muted">River : ' + cardKind(EX.rv.card, EX.flop + tl.card) + '. Calculée dans l’appli, sur les mains qui arrivent ici.</div>';
    } else if (tl) {
      EX.rv = null;
      if (!node(S, EX.tpath, tl)) EX.tpath = '';
      n = node(S, EX.tpath, tl); board = EX.flop + tl.card; w = rangeAt(S, n.p, tl, EX.tpath, null);
      var tparts = EX.tpath ? EX.tpath.split('-') : [], tcr = flopCr + ' › ' + crumb('tpath', '', 'Turn');
      for (var t = 0; t < tparts.length; t++) tcr += ' › ' + crumb('tpath', tparts.slice(0, t + 1).join('-'), shortLabel(tparts[t]));
      var T = turnData(S.spot, S.flop)[tl.line];
      kids = n.a.map(function (a) {
        var p = EX.tpath ? EX.tpath + '-' + a : a;
        if (T.nodes[tl.card][p]) return '<button class="btn" data-sact="tpath" data-v="' + p + '" style="min-height:40px">Si ' + shortLabel(a).toLowerCase() + ' ›</button>';
        if (riverEnd(S, tl, p)) return '<button class="btn gold" data-sact="river" data-v="' + p + '" style="min-height:40px">Si ' + shortLabel(a).toLowerCase() + ' : voir la river ›</button>';
        return '';
      }).join('');
      nav = '<div class="small muted">Au flop : ' + lineText(tl.line) + '.</div><div class="small">' + tcr + '</div>' +
        '<div class="row" style="flex-wrap:wrap;gap:6px">' + T.cards.map(function (c) { return '<button data-sact="tcard" data-v="' + c + '" style="padding:4px 6px;border-radius:8px;border:2px solid ' + (tl.card === c ? 'var(--gold)' : 'var(--line)') + ';background:var(--panel2)">' + cardTxt(c) + '</button>'; }).join('') + '</div><div class="small muted">Turn : ' + cardKind(tl.card, EX.flop) + '.</div>';
    } else {
      n = node(S, EX.path);
      var parts = EX.path ? EX.path.split('-') : [], crumbs = crumb('path', sp.oopBets ? '' : 'x', 'Flop');
      for (var i = sp.oopBets ? 0 : 1; i < parts.length; i++) { var pp = parts.slice(0, i + 1).join('-'); if (S.nodes[pp]) crumbs += ' › ' + crumb('path', pp, shortLabel(parts[i])); }
      kids = n.a.map(function (a) { var p = EX.path ? EX.path + '-' + a : a; return S.nodes[p] ? '<button class="btn" data-sact="path" data-v="' + p + '" style="min-height:40px">Si ' + shortLabel(a).toLowerCase() + ' ›</button>' : (S.lines && S.lines[p] ? '<button class="btn gold" data-sact="turn" data-v="' + p + '" style="min-height:40px">Si ' + shortLabel(a).toLowerCase() + ' : voir la turn ›</button>' : ''); }).join('');
      nav = '<div class="small">' + crumbs + '</div>';
    }
    var sm = summary(n, board, w);
    var hm = EX.hand ? handMix(n, EX.hand, w) : null;
    var head = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Solveur</h1>' + spotPicker() +
      '<div class="card stack" style="gap:8px"><b>Flop</b><div class="row" style="flex-wrap:wrap;gap:6px">' + sp.flops.map(function (f) { return '<button data-sact="flop" data-v="' + f + '" style="padding:4px;border-radius:8px;border:2px solid ' + (EX.flop === f ? 'var(--gold)' : 'var(--line)') + ';background:var(--panel2)">' + cardsTxt(f) + '</button>'; }).join('') + '</div></div>';
    var body = head + '<div class="card stack"><div class="row" style="justify-content:space-between;flex-wrap:wrap">' + boardCards(board) + '<div class="small muted">Pot ' + f1(n.pot) + ' BB · tapis ' + f1(stackNow) + ' BB<br>Précision : ' + String(exp).replace('.', ',') + ' % du pot</div></div>' + nav +
      '<div><b>' + cap(who2(EX.spot, n.p)) + '</b> joue' + (n.call ? ' face à une mise de ' + f1(n.call) + ' BB' : '') + ' :</div>' + legend(n.a) + bar(sm.tot, n.a) +
      '<div class="small muted">' + n.a.map(function (a, k) { return shortLabel(a) + ' ' + pc(sm.tot[k]); }).join(' · ') + '</div>' +
      (kids ? '<div class="row" style="flex-wrap:wrap">' + kids + '</div>' : '') + '</div>' +
      '<div class="card stack"><b>Par famille de mains</b><table class="tbl"><tr><th>Famille</th><th>Part</th><th>Stratégie</th></tr>' +
      CATS.filter(function (c) { return sm.cat[c] && sm.cat[c].n / sm.N >= 0.005; }).map(function (c) { return '<tr><td>' + c + '</td><td>' + pc(sm.cat[c].n / sm.N) + '</td><td>' + bar(sm.cat[c].mix, n.a) + '</td></tr>'; }).join('') + '</table></div>' +
      '<div class="card stack"><b>Une main précise</b><div class="row"><input id="solHand" placeholder="ex. AKo, 77, 98s" value="' + ui.esc(EX.hand) + '" style="width:130px;min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit"><button class="btn" data-sact="hand">Voir</button></div>' +
      (EX.hand ? (hm ? bar(hm, n.a) + '<div class="small">' + n.a.map(function (a, k) { return shortLabel(a) + ' ' + pc(hm[k]); }).join(' · ') + '</div>' : '<div class="small muted">Cette main n’est pas dans la range de ce joueur à ce moment du coup.</div>') : '') + '</div>' +
      '<p class="small muted">Coup : ' + sp.pre.replace(/\{IP\}/g, ART[sp.ip] || sp.ip).replace(/\{OOP\}/g, ART[sp.oop] || sp.oop).replace(/^./, function (c) { return c.toUpperCase(); }) + ' Tapis de départ ' + sp.start + ' BB, ranges du profil TAG.</p>' +
      '<p class="small muted">Flop et turn sont calculés à l’avance : au flop, check, mises de 1/3, 1/2, 3/4 et 125 % du pot, relance à 3 fois, tapis ; à la turn, check, mises de 1/2 pot et du pot, tapis, sur les 47 cartes possibles (affichées : six cartes types sur les deux suites de coup les plus fréquentes). La river est calculée dans l’appli quand tu l’ouvres, sur les mains exactes qui y arrivent : check, 1/2 pot, pot, tapis.</p></div>';
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
  function sum(w) { var s = 0; for (var i = 0; i < w.length; i++) s += w[i]; return s; }
  function pickWeighted(w) { var s = sum(w); if (s <= 0) return -1; var r = Math.random() * s; for (var i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return w.length - 1; }
  function pickHand(n, w) {
    var idx = -1;
    for (var tries = 0; tries < 15; tries++) {
      var j = w ? pickWeighted(w) : Math.floor(Math.random() * n._c.length); if (j < 0) break;
      idx = j; if (Math.max.apply(null, n._m[j]) < 0.85 || Math.random() < 0.4) break;
    }
    return idx;
  }
  function qNode(q) {
    var S = sol(q.spot, q.flop);
    if (q.rv) return riverSol(S, q.tl, q.rv.tend, q.rv.card).nodes[q.path];
    return node(S, q.path, q.tl);
  }
  function newQuestion(cb, depth) {
    depth = depth || 0; if (depth > 12) return null;
    var pend = QZ && QZ.pend; if (QZ) QZ.pend = null;
    var spot = pend ? pend.spot : DATA.spots[Math.floor(Math.random() * DATA.spots.length)].id;
    var spd = spotOf(spot);
    var flop = pend ? pend.flop : spd.flops[Math.floor(Math.random() * spd.flops.length)];
    var u = pend ? pend.u : Math.random();
    if (!ensureSpot(spot, cb)) { QZ.pend = { spot: spot, flop: flop, u: u }; return null; }
    var S = sol(spot, flop), tl = null, path, n, w = null, rv = null;
    var street = (u < 0.4 || !S.lines || !Object.keys(S.lines).length) ? 0 : (u < 0.7 ? 1 : 2);
    if (street) {
      var Td = turnData(spot, flop, cb);
      if (!Td) { QZ.pend = { spot: spot, flop: flop, u: u }; return null; }
      var lines = Object.keys(S.lines), line = lines[Math.floor(Math.random() * lines.length)], cards = S.lines[line], card = cards[Math.floor(Math.random() * cards.length)];
      tl = { line: line, card: card };
      var TN = Td[line].nodes[card];
      if (street === 1) {
        var tps = Object.keys(TN).filter(function (p) { var s = p ? p.split('-') : []; return s.length <= 2 && TN[p].a.length > 1 && s.indexOf('ai') < 0; });
        path = tps[Math.floor(Math.random() * tps.length)]; n = node(S, path, tl); w = rangeAt(S, n.p, tl, path, null);
      } else {
        // fins de turn qui mènent à la river, choisies selon leur fréquence
        var ends = [], ew = [];
        Object.keys(TN).forEach(function (np) { TN[np].a.forEach(function (a) { var p = np ? np + '-' + a : a; if (!TN[p] && riverEnd(S, tl, p)) { ends.push(p); ew.push(sum(rangeAt(S, 0, tl, p, null)) * sum(rangeAt(S, 1, tl, p, null))); } }); });
        var k = pickWeighted(ew); if (k < 0) return newQuestion(cb, depth + 1);
        var used = S.flop + card, rcs = [];
        for (var r = 0; r < 13; r++) 'shdc'.split('').forEach(function (s) { var c = R[r] + s; if (used.indexOf(c) < 0) rcs.push(c); });
        rv = { tend: ends[k], card: rcs[Math.floor(Math.random() * rcs.length)] };
        var rs = riverSol(S, tl, rv.tend, rv.card); if (!rs) return newQuestion(cb, depth + 1);
        var rps = Object.keys(rs.nodes).filter(function (p) { var s = p ? p.split('-') : []; return s.length <= 2 && rs.nodes[p].a.length > 1 && s.indexOf('ai') < 0 && sum(rs.nodes[p]._w) > 1e-3; });
        if (!rps.length) return newQuestion(cb, depth + 1);
        path = rps[Math.floor(Math.random() * rps.length)]; n = rs.nodes[path]; w = n._w;
      }
    } else {
      var nodes = flopDecisions(S, spot); path = nodes[Math.floor(Math.random() * nodes.length)]; n = node(S, path);
    }
    var idx = pickHand(n, w);
    if (idx < 0) return newQuestion(cb, depth + 1);
    return { spot: spot, flop: flop, path: path, tl: tl, rv: rv, i: idx, hand: n._c[idx] };
  }
  function startQuiz() { QZ = { n: 10, k: 0, ok: 0, mix: 0, q: null, ans: null }; }
  function situationText(q, n) {
    var sp = spotOf(q.spot), me = n.p, opp = who2(q.spot, 1 - me), il = /^la /.test(opp) ? 'elle' : 'il';
    var pre = sp.pre.replace(/\{IP\}/g, me === 1 ? 'tu' : opp).replace(/\{OOP\}/g, me === 0 ? 'tu' : opp).replace(/tu a /g, 'tu as ');
    pre = cap(pre);
    function seq(path) {
      if (!path) return [];
      var who = 0, out = [];
      path.split('-').forEach(function (a) {
        var subj = who === me ? 'tu ' : il + ' ';
        var verb = a === 'x' ? (who === me ? 'checkes' : 'checke') : a === 'c' ? (who === me ? 'paies' : 'paie') : a === 'f' ? (who === me ? 'te couches' : 'se couche') : a === 'r' ? (who === me ? 'relances' : 'relance') : a === 'ai' ? (who === me ? 'fais tapis' : 'fait tapis') : (who === me ? 'mises ' : 'mise ') + shortLabel(a);
        out.push(subj + verb); who = 1 - who;
      });
      return out;
    }
    var flopTxt = seq(q.tl ? q.tl.line : q.path);
    var s = pre + ' Au flop, ' + (flopTxt.length ? flopTxt.join(', ') : 'tu parles en premier') + '.';
    if (q.tl) {
      var tt = seq(q.rv ? q.rv.tend : q.path);
      s += ' Turn : ' + cardKind(q.tl.card, q.flop) + '. ' + (tt.length ? cap(tt.join(', ')) + '.' : (me === 0 ? 'Tu parles en premier.' : ''));
    }
    if (q.rv) {
      var rt = seq(q.path);
      s += ' River : ' + cardKind(q.rv.card, q.flop + q.tl.card) + '. ' + (rt.length ? cap(rt.join(', ')) + '.' : (me === 0 ? 'Tu parles en premier.' : ''));
    }
    return s;
  }
  function quizView() {
    var ui = U();
    if (!DATA) { load(function () { ui.render(); }); return ui.shell('entrainer', '<div class="stack"><h1>Après le flop</h1><p class="muted">Chargement des solutions…</p></div>'); }
    if (DATA.err) return ui.shell('entrainer', '<div class="stack"><button class="back" data-act="nav" data-v="situations">‹ Situations</button><h1>Après le flop</h1>' + ui.yo('Les solutions ne sont pas incluses dans cette version : elles sont dans l’appli installée (PC et Android).') + '</div>');
    if (!QZ) startQuiz();
    if (QZ.k >= QZ.n) {
      var pct = Math.round((QZ.ok + QZ.mix * 0.5) / QZ.n * 100);
      if (!QZ.saved) { var p = PA.player(); p.sessions.unshift({ at: Date.now(), label: 'Après le flop', n: QZ.n, ok: QZ.ok, style: QZ.mix, err: QZ.n - QZ.ok - QZ.mix, consult: 0 }); PA.save(); QZ.saved = true; }
      return ui.shell('entrainer', '<div class="stack"><h1>Bilan</h1>' + ui.yo(pct >= 80 ? 'Très bien : tes décisions ressemblent à celles du solveur.' : pct >= 55 ? 'Pas mal. Regarde dans l’explorateur les familles de mains où tu t’écartes.' : 'Le jeu après le flop demande du temps : refais une série, et ouvre l’explorateur sur les coups ratés.') +
        '<div class="grid2"><div class="card"><div class="muted small">Comme le solveur</div><div class="disp" style="font-size:40px">' + QZ.ok + ' / ' + QZ.n + '</div></div><div class="card"><div class="muted small">Jouable (mixte) · erreur</div><div class="disp" style="font-size:40px">' + QZ.mix + ' · ' + (QZ.n - QZ.ok - QZ.mix) + '</div></div></div>' +
        '<div class="row"><button class="btn gold" data-sact="again" style="flex:1">Encore 10 coups</button><button class="btn" data-act="nav" data-v="situations">Terminer</button></div></div>', true);
    }
    if (!QZ.q) {
      if (!QZ.busy) { QZ.busy = true; setTimeout(function () { QZ.busy = false; if (QZ && !QZ.q) { QZ.q = newQuestion(function () { ui.render(); }); if (QZ.q) ui.render(); } }, 20); }
      return ui.shell('entrainer', '<div class="stack"><h1>Après le flop</h1><p class="muted">Préparation du coup…</p></div>', true);
    }
    var q = QZ.q, S = sol(q.spot, q.flop), n = qNode(q), board = q.flop + (q.tl ? q.tl.card : '') + (q.rv ? q.rv.card : '');
    var me = whoName(q.spot, n.p), stackNow = q.rv ? RIV[riverKey(S, q.tl, q.rv.tend, q.rv.card)].R : S.stack;
    var out = '<div class="stack" style="max-width:640px;margin:0 auto"><div class="row" style="justify-content:space-between"><button class="back" data-sact="quit">‹ Arrêter</button><span class="small muted">' + (QZ.k + 1) + ' / ' + QZ.n + (q.rv ? ' · river' : q.tl ? ' · turn' : ' · flop') + '</span></div>' +
      '<div class="card stack"><div class="row" style="gap:6px;flex-wrap:wrap"><span class="chip">' + me + '</span><span class="chip" style="border-color:#555;color:#c9c9cf">Pot ' + f1(n.pot) + ' BB · tapis ' + f1(stackNow) + ' BB</span></div>' +
      '<div class="small muted">' + situationText(q, n) + '</div>' + boardCards(board) +
      '<div class="row" style="gap:10px;align-items:center"><span class="small muted">Ta main</span>' + bigCard(q.hand.substr(0, 2)) + bigCard(q.hand.substr(2, 2)) + '<span class="small">' + category(q.hand, board) + '</span></div></div>';
    if (!QZ.ans) out += '<div class="stack" style="gap:8px">' + n.a.map(function (a) { return '<button class="btn" data-sact="ans" data-v="' + a + '" style="min-height:52px;text-align:left">' + actLabel(a, n) + '</button>'; }).join('') + '</div>';
    else {
      var mix = n._m[q.i], best = 0; mix.forEach(function (v, a) { if (v > mix[best]) best = a; });
      var verdict = QZ.ans.v === 'ok' ? ['Comme le solveur', '#4fe08f'] : QZ.ans.v === 'mix' ? ['Jouable : stratégie mixte', '#ffd43b'] : ['Erreur', '#ff8080'];
      var w = q.rv ? n._w : q.tl ? rangeAt(S, n.p, q.tl, q.path, null) : null, sm = summary(n, board, w);
      out += '<div class="card stack"><div class="disp" style="font-size:28px;color:' + verdict[1] + '">' + verdict[0] + '</div>' +
        '<div>Le solveur, avec cette main : ' + n.a.map(function (a, j) { return mix[j] >= 0.02 ? '<b>' + shortLabel(a) + '</b> ' + pc(mix[j]) : ''; }).filter(Boolean).join(' · ') + '</div>' + legend(n.a) + bar(mix, n.a) +
        '<div class="small muted">Toute la range ' + de(who2(q.spot, n.p)) + ' ici : ' + n.a.map(function (a, j) { return shortLabel(a) + ' ' + pc(sm.tot[j]); }).join(' · ') + '</div></div>' +
        ui.yo(explain(n, q, mix, best, sm, board)) +
        '<div class="row"><button class="btn gold" data-sact="next" style="flex:1">Coup suivant</button><button class="btn" data-sact="explore">Ouvrir dans l’explorateur</button></div>';
    }
    return ui.shell('entrainer', out + '</div>', true);
  }
  function explain(n, q, mix, best, sm, board) {
    var cat = category(q.hand, board), c = sm.cat[cat], a = n.a[best], river = !!q.rv;
    var catTxt = c ? 'Avec ' + cat.toLowerCase() + ', le solveur joue en moyenne : ' + n.a.map(function (x, j) { return c.mix[j] >= 0.1 ? shortLabel(x).toLowerCase() + ' ' + pc(c.mix[j]) : ''; }).filter(Boolean).join(', ') + '.' : '';
    var why;
    if (a === 'f') why = river ? 'À la river, il n’y a plus de carte à venir : ta main ne bat pas assez de bluffs pour payer.' : 'Ta main n’a pas assez d’équité face à cette mise : payer perdrait de l’argent.';
    else if (a === 'c') why = river ? 'Ta main bat assez de bluffs pour payer, mais pas assez de mains de valeur pour relancer.' : 'Ta main a assez d’équité pour payer, mais relancer ferait coucher les mains que tu bats.';
    else if (a === 'r' || a === 'ai') why = river ? 'Tapis : soit tu as une main très forte qui se fait payer, soit un bluff qui bloque les bonnes mains adverses.' : 'Relancer ici rapporte : soit tu fais coucher des mains qui ont de l’équité, soit tu te fais payer par pire.';
    else if (a === 'x') why = river ? 'Checker : ta main gagne souvent à l’abattage mais se fait rarement payer par pire, ou elle n’a aucune chance de faire coucher mieux.' : 'Checker protège ta range et garde les mains moyennes dans le coup.';
    else if (river) why = 'À la river, on mise avec des mains qui se font payer par pire, et avec des bluffs qui n’ont aucune chance à l’abattage.';
    else if (a === 'b33' || a === 'b50') why = 'Une mise petite ou moyenne suffit : beaucoup de mains adverses doivent abandonner ou payer cher pour leur équité.';
    else why = 'Une grosse mise met la pression : elle fait payer les mains moyennes et les tirages, ou les fait coucher.';
    return why + ' ' + catTxt;
  }
  function judge(a) {
    var q = QZ.q, n = qNode(q), mix = n._m[q.i], k = n.a.indexOf(a), mx = Math.max.apply(null, mix);
    var v = mix[k] >= 0.5 || mix[k] >= mx - 0.1 ? 'ok' : (mix[k] >= 0.15 ? 'mix' : 'err');
    QZ.ans = { a: a, v: v }; if (v === 'ok') QZ.ok++; else if (v === 'mix') QZ.mix++;
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-sact]') : null; if (!t) return;
    var a = t.getAttribute('data-sact'), v = t.getAttribute('data-v');
    if (a === 'spot') { EX.spot = v; EX.path = null; EX.tl = null; EX.rv = null; }
    else if (a === 'flop') { EX.flop = v; EX.tl = null; EX.rv = null; }
    else if (a === 'path') { EX.path = v; EX.tl = null; EX.rv = null; }
    else if (a === 'turn') { var S1 = sol(EX.spot, EX.flop); EX.tl = { line: v, card: S1.lines[v][0] }; EX.tpath = ''; EX.rv = null; }
    else if (a === 'tcard') { EX.tl = { line: EX.tl.line, card: v }; EX.rv = null; }
    else if (a === 'tpath') { EX.tpath = v; EX.rv = null; }
    else if (a === 'river') { EX.rv = { tend: v, card: riverCards(EX.flop + EX.tl.card)[0], rpath: '' }; }
    else if (a === 'rcard') { EX.rv = { tend: EX.rv.tend, card: v, rpath: '' }; }
    else if (a === 'rpath') EX.rv.rpath = v;
    else if (a === 'hand') { var h = (document.getElementById('solHand').value || '').trim().replace(/^10/, 'T'); h = h.length >= 2 ? h[0].toUpperCase() + h[1].toUpperCase() + (h[2] ? h[2].toLowerCase() : '') : ''; EX.hand = h; }
    else if (a === 'ans') { if (!QZ.ans) judge(v); }
    else if (a === 'next') { QZ.k++; QZ.ans = null; QZ.q = null; }
    else if (a === 'again') startQuiz();
    else if (a === 'quit') { QZ = null; location.hash = '#situations'; }
    else if (a === 'explore') {
      var q = QZ.q, Sq = sol(q.spot, q.flop); EX.spot = q.spot; EX.flop = q.flop; EX.hand = classOf(q.hand); EX.rv = null;
      if (q.tl) { EX.tl = q.tl; EX.path = Sq.nodes['x'] ? 'x' : ''; EX.tpath = q.rv ? q.rv.tend : q.path; if (q.rv) EX.rv = { tend: q.rv.tend, card: q.rv.card, rpath: q.path }; }
      else { EX.tl = null; EX.path = q.path; }
      location.hash = '#solveur'; return;
    }
    U().render();
  });
  window.PA_SOLVER = { explorer: explorer, quiz: quizView, category: category, _riverCards: riverCards };
})();
