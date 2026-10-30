/* Poker Academy v2.0 — Solveur de river calculé dans l'appli (CFR à remise, forme vectorielle, exact) */
(function () {
  'use strict';
  var RK = '23456789TJQKA', SU = 'shdc';
  function cid(s) { return RK.indexOf(s[0]) * 4 + SU.indexOf(s[1]); }

  /* ---------- Force d'une main de 7 cartes (plus grand = meilleur) ---------- */
  function straightTop(mask) { // mask : bits des rangs 0..12 ; renvoie le rang de la plus haute carte de la quinte
    for (var t = 12; t >= 4; t--) { var m = 31 << (t - 4); if ((mask & m) === m) return t; }
    if ((mask & 0x100F) === 0x100F) return 3; // roue A-2-3-4-5
    return -1;
  }
  function eval7(cs) {
    var cnt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], sc = [0, 0, 0, 0], sm = [0, 0, 0, 0], mask = 0, i;
    for (i = 0; i < cs.length; i++) { var r = cs[i] >> 2, s = cs[i] & 3; cnt[r]++; sc[s]++; sm[s] |= 1 << r; mask |= 1 << r; }
    var B = 371293; // 13^5
    for (var s2 = 0; s2 < 4; s2++) if (sc[s2] >= 5) {
      var sf = straightTop(sm[s2]);
      if (sf >= 0) return 8 * B + sf;
      var v = 0, n = 0; for (var r2 = 12; r2 >= 0 && n < 5; r2--) if (sm[s2] & (1 << r2)) { v = v * 13 + r2; n++; }
      return 5 * B + v;
    }
    var quad = -1, trips = [], pairs = [], singles = [];
    for (i = 12; i >= 0; i--) { if (cnt[i] === 4) quad = i; else if (cnt[i] === 3) trips.push(i); else if (cnt[i] === 2) pairs.push(i); else if (cnt[i] === 1) singles.push(i); }
    function kick(ex, k) { var v = 0, n = 0; for (var r3 = 12; r3 >= 0 && n < k; r3--) if (cnt[r3] && ex.indexOf(r3) < 0) { v = v * 13 + r3; n++; } return v; }
    if (quad >= 0) return 7 * B + quad * 13 + kick([quad], 1);
    if (trips.length && (trips.length > 1 || pairs.length)) { var p2 = trips.length > 1 ? Math.max(trips[1], pairs[0] === undefined ? -1 : pairs[0]) : pairs[0]; return 6 * B + trips[0] * 13 + p2; }
    var st = straightTop(mask); if (st >= 0) return 4 * B + st;
    if (trips.length) return 3 * B + trips[0] * 169 + kick([trips[0]], 2);
    if (pairs.length >= 2) return 2 * B + pairs[0] * 169 + pairs[1] * 13 + kick([pairs[0], pairs[1]], 1);
    if (pairs.length) return 1 * B + pairs[0] * 2197 + kick([pairs[0]], 3);
    return kick([], 5);
  }

  /* ---------- Arbre de river ---------- */
  // tailles : 1/2 pot, pot, tapis ; face à une mise : se coucher, payer, tapis
  function build(P, R) {
    var nodes = [];
    function mk(p, c, toCall, path, raised) {
      var n = { k: 'dec', p: p, c: c, path: path, a: [], kids: [] };
      function add(a, kid) { n.a.push(a); n.kids.push(kid); }
      var sep = path ? '-' : '', pot = P + c[0] + c[1];
      if (toCall === 0) {
        add('x', p === 0 ? mk(1, c, 0, path + sep + 'x', false) : { k: 'show', c: c });
        [['b50', 0.5], ['b100', 1]].forEach(function (s) {
          var b = Math.round(pot * s[1] * 10) / 10; if (c[p] + b >= R * 0.7) return;
          var cc = c.slice(); cc[p] += b; add(s[0], mk(1 - p, cc, b, path + sep + s[0], false));
        });
        if (c[p] < R - 1e-9) { var ca = c.slice(); ca[p] = R; add('ai', mk(1 - p, ca, R - c[1 - p], path + sep + 'ai', true)); }
      } else {
        add('f', { k: 'fold', c: c, folder: p });
        var cc2 = c.slice(); cc2[p] = Math.min(R, c[p] + toCall); add('c', { k: 'show', c: cc2 });
        if (!raised && c[1 - p] < R - 1e-9) { var ca2 = c.slice(); ca2[p] = R; add('ai', mk(1 - p, ca2, R - c[1 - p], path + sep + 'ai', true)); }
      }
      nodes.push(n);
      return n;
    }
    var root = mk(0, [0, 0], 0, '', false);
    return { root: root, nodes: nodes };
  }

  /* ---------- Résolution ---------- */
  // combos : [[carteA, carteB], ...] par joueur ; w : poids d'arrivée ; board : 5 cartes (indices)
  function solve(board, combos, w, P, R, iters) {
    iters = iters || 200;
    var H = [[], []], N = [0, 0];
    for (var p = 0; p < 2; p++) {
      for (var i = 0; i < combos[p].length; i++) {
        var c = combos[p][i];
        if (w[p][i] <= 1e-4 || board.indexOf(c[0]) >= 0 || board.indexOf(c[1]) >= 0) continue;
        H[p].push({ i: i, a: c[0], b: c[1], w: w[p][i], s: eval7(board.concat(c)) });
      }
      N[p] = H[p].length;
    }
    if (!N[0] || !N[1]) return null;
    // ordre par force et main identique adverse
    var ord = [0, 1].map(function (p) { var o = H[p].map(function (_, k) { return k; }); o.sort(function (x, y) { return H[p][x].s - H[p][y].s; }); return o; });
    var same = [0, 1].map(function (p) { var m = {}, o = H[1 - p]; o.forEach(function (h, j) { m[h.a * 52 + h.b] = j; m[h.b * 52 + h.a] = j; }); return H[p].map(function (h) { var j = m[h.a * 52 + h.b]; return j === undefined ? -1 : j; }); });
    var T = build(P, R);
    T.nodes.forEach(function (n) { var nc = N[n.p]; n.reg = n.a.map(function () { return new Float64Array(nc); }); n.sum = n.a.map(function () { return new Float64Array(nc); }); });

    // sommes sans les mains bloquées
    function blockSum(up, ro) { // pour chaque main de up : somme de ro (adverse) sans conflit de cartes
      var opp = H[1 - up], tot = 0, card = new Float64Array(52), out = new Float64Array(N[up]);
      for (var j = 0; j < opp.length; j++) { tot += ro[j]; card[opp[j].a] += ro[j]; card[opp[j].b] += ro[j]; }
      for (var i2 = 0; i2 < N[up]; i2++) { var h = H[up][i2], v = tot - card[h.a] - card[h.b], sj = same[up][i2]; if (sj >= 0) v += ro[sj]; out[i2] = v; }
      return out;
    }
    function showdown(up, ro, amt) { // amt : gain si gagné (= perte si perdu)
      var me = H[up], op = H[1 - up], om = ord[up], oo = ord[1 - up], out = new Float64Array(N[up]);
      // gains : adversaires plus faibles
      var tot = 0, card = new Float64Array(52), j = 0, k, i3;
      for (k = 0; k < om.length;) {
        var s = me[om[k]].s;
        while (j < oo.length && op[oo[j]].s < s) { var o = op[oo[j]], r = ro[oo[j]]; tot += r; card[o.a] += r; card[o.b] += r; j++; }
        for (; k < om.length && me[om[k]].s === s; k++) { i3 = om[k]; var h = me[i3]; out[i3] = amt * (tot - card[h.a] - card[h.b]); }
      }
      // pertes : adversaires plus forts
      tot = 0; card = new Float64Array(52); j = oo.length - 1;
      for (k = om.length - 1; k >= 0;) {
        var s2 = me[om[k]].s;
        while (j >= 0 && op[oo[j]].s > s2) { var o2 = op[oo[j]], r2 = ro[oo[j]]; tot += r2; card[o2.a] += r2; card[o2.b] += r2; j--; }
        for (; k >= 0 && me[om[k]].s === s2; k--) { i3 = om[k]; var h2 = me[i3]; out[i3] -= amt * (tot - card[h2.a] - card[h2.b]); }
      }
      return out;
    }
    function strat(n, i4, buf) {
      var s = 0, a; for (a = 0; a < n.a.length; a++) { var r = n.reg[a][i4]; buf[a] = r > 0 ? r : 0; s += buf[a]; }
      for (a = 0; a < n.a.length; a++) buf[a] = s > 0 ? buf[a] / s : 1 / n.a.length;
    }
    function cfr(n, up, rs, ro, t) {
      if (n.k === 'fold') { var bs = blockSum(up, ro), amt = P / 2 + n.c[n.folder], sg = n.folder === up ? -1 : 1; for (var q = 0; q < bs.length; q++) bs[q] *= sg * amt; return bs; }
      if (n.k === 'show') return showdown(up, ro, P / 2 + n.c[0]);
      var na = n.a.length, nc = N[n.p], S = [], buf = new Float64Array(na), i5, a;
      for (a = 0; a < na; a++) S.push(new Float64Array(nc));
      for (i5 = 0; i5 < nc; i5++) { strat(n, i5, buf); for (a = 0; a < na; a++) S[a][i5] = buf[a]; }
      var v = new Float64Array(N[up]);
      if (n.p === up) {
        var va = [];
        for (a = 0; a < na; a++) { var rs2 = new Float64Array(nc); for (i5 = 0; i5 < nc; i5++) rs2[i5] = rs[i5] * S[a][i5]; va.push(cfr(n.kids[a], up, rs2, ro, t)); for (i5 = 0; i5 < nc; i5++) v[i5] += S[a][i5] * va[a][i5]; }
        var pw = Math.pow(t, 1.5), pos = pw / (pw + 1), dw = Math.pow(t / (t + 1), 2);
        for (a = 0; a < na; a++) for (i5 = 0; i5 < nc; i5++) {
          var rg = n.reg[a][i5] + va[a][i5] - v[i5]; n.reg[a][i5] = rg > 0 ? rg * pos : rg * 0.5;
          n.sum[a][i5] = n.sum[a][i5] * dw + rs[i5] * S[a][i5];
        }
      } else {
        for (a = 0; a < na; a++) { var ro2 = new Float64Array(nc); for (i5 = 0; i5 < nc; i5++) ro2[i5] = ro[i5] * S[a][i5]; var r = cfr(n.kids[a], up, rs, ro2, t); for (i5 = 0; i5 < N[up]; i5++) v[i5] += r[i5]; }
      }
      return v;
    }
    var w0 = [0, 1].map(function (p) { return Float64Array.from(H[p].map(function (h) { return h.w; })); });
    for (var t = 1; t <= iters; t++) for (var up = 0; up < 2; up++) cfr(T.root, up, w0[up], w0[1 - up], t);
    // stratégie moyenne
    T.nodes.forEach(function (n) {
      var nc = N[n.p]; n.avg = [];
      for (var i6 = 0; i6 < nc; i6++) { var s = 0, row = [], a; for (a = 0; a < n.a.length; a++) s += n.sum[a][i6]; for (a = 0; a < n.a.length; a++) row.push(s > 0 ? n.sum[a][i6] / s : 1 / n.a.length); n.avg.push(row); }
    });
    // meilleure réponse : exploitabilité
    function br(n, up, ro) {
      if (n.k !== 'dec') return cfr(n, up, null, ro, 1);
      var na = n.a.length, a, i7;
      if (n.p === up) { var best = null; for (a = 0; a < na; a++) { var r = br(n.kids[a], up, ro); if (!best) best = r; else for (i7 = 0; i7 < r.length; i7++) if (r[i7] > best[i7]) best[i7] = r[i7]; } return best; }
      var v = new Float64Array(N[up]);
      for (a = 0; a < na; a++) { var ro2 = new Float64Array(N[n.p]); for (i7 = 0; i7 < N[n.p]; i7++) ro2[i7] = ro[i7] * n.avg[i7][a]; var r2 = br(n.kids[a], up, ro2); for (i7 = 0; i7 < N[up]; i7++) v[i7] += r2[i7]; }
      return v;
    }
    var gain = 0, mass = 0;
    for (var up2 = 0; up2 < 2; up2++) { var bv = br(T.root, up2, w0[1 - up2]), bs2 = blockSum(up2, w0[1 - up2]); for (var i8 = 0; i8 < N[up2]; i8++) { gain += w0[up2][i8] * bv[i8]; if (up2 === 0) mass += w0[0][i8] * bs2[i8]; } }
    var exp = mass > 0 ? Math.max(0, gain / mass / 2 / P * 100) : 0; // % du pot
    // nœuds pour l'affichage : stratégie et poids d'arrivée de chaque main
    var out = {};
    (function walk(n, reach) {
      if (n.k !== 'dec') return;
      var me = reach[n.p];
      out[n.path] = { p: n.p, a: n.a, pot: Math.round((P + n.c[0] + n.c[1]) * 10) / 10, call: Math.round(Math.abs(n.c[0] - n.c[1]) * 10) / 10, idx: H[n.p].map(function (h) { return h.i; }), m: n.avg, w: Array.prototype.slice.call(me) };
      n.kids.forEach(function (k, a) { var r = [reach[0], reach[1]], nr = new Float64Array(me.length); for (var i9 = 0; i9 < me.length; i9++) nr[i9] = me[i9] * n.avg[i9][a]; r[n.p] = nr; walk(k, r); });
    })(T.root, w0);
    return { nodes: out, exp: Math.round(exp * 100) / 100, P: P, R: R, n0: N[0], n1: N[1] };
  }
  window.PA_RIVER = { solve: solve, eval7: eval7, cid: cid };
  if (typeof module !== 'undefined') module.exports = window.PA_RIVER;
})();
