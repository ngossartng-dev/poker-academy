/* Poker Academy — « Après le flop : que faire ? »
   Le solveur en questions simples : ta position, ce qui s'est passé avant le flop, l'adversaire,
   le flop, ta main → la réponse rédigée, et la suite. Le flop choisi est rapproché du flop calculé le plus ressemblant. */
(function () {
  'use strict';
  var R = '23456789TJQKA', SUITS = ['s', 'h', 'd', 'c'], SU = { s: '♠', h: '♥', d: '♦', c: '♣' };
  var POS = [['BTN', 'Bouton'], ['CO', 'Cut-off'], ['HJ', 'Hijack'], ['UTG', 'UTG'], ['SB', 'Petite blinde'], ['BB', 'Grosse blinde']];
  var SC = {
    BTN: [['btn-bb', 'ip', 'J’ai ouvert, la grosse blinde a payé'], ['co-btn', 'ip', 'Le cut-off a ouvert, j’ai payé'], ['hj-btn', 'ip', 'Le hijack a ouvert, j’ai payé'], ['btn3b-co', 'ip', 'Le cut-off a ouvert, j’ai relancé (3-bet), il a payé'], ['btn3b-hj', 'ip', 'Le hijack a ouvert, j’ai relancé (3-bet), il a payé'], ['bb3b-btn', 'ip', 'J’ai ouvert, la grosse blinde a relancé (3-bet), j’ai payé'], ['sb3b-btn', 'ip', 'J’ai ouvert, la petite blinde a relancé (3-bet), j’ai payé'], ['co4b-btn', 'ip', '100 BB : j’ai relancé (3-bet) le cut-off, il a 4-bet, j’ai payé'], ['limp-iso', 'ip', 'Un joueur a limpé, je l’ai isolé, il a payé']],
    CO: [['co-bb', 'ip', 'J’ai ouvert, la grosse blinde a payé'], ['co-btn', 'oop', 'J’ai ouvert, le bouton a payé'], ['btn3b-co', 'oop', 'J’ai ouvert, le bouton a relancé (3-bet), j’ai payé'], ['sb3b-co', 'ip', 'J’ai ouvert, la petite blinde a relancé (3-bet), j’ai payé'], ['co4b-btn', 'oop', '100 BB : j’ai ouvert, le bouton a 3-bet, j’ai 4-bet, il a payé']],
    HJ: [['hj-bb', 'ip', 'J’ai ouvert, la grosse blinde a payé'], ['hj-btn', 'oop', 'J’ai ouvert, le bouton a payé'], ['btn3b-hj', 'oop', 'J’ai ouvert, le bouton a relancé (3-bet), j’ai payé']],
    UTG: [['utg-bb', 'ip', 'J’ai ouvert, la grosse blinde a payé'], ['limp-iso', 'oop', 'J’ai limpé, le bouton a relancé, j’ai payé']],
    SB: [['sb-bb', 'oop', 'J’ai ouvert à 3 BB, la grosse blinde a payé'], ['sb3b-btn', 'oop', 'Le bouton a ouvert, j’ai relancé (3-bet), il a payé'], ['sb3b-co', 'oop', 'Le cut-off a ouvert, j’ai relancé (3-bet), il a payé'], ['sb-limp', 'oop', 'J’ai complété (limp), la grosse blinde a checké']],
    BB: [['btn-bb', 'oop', 'Le bouton a ouvert, j’ai payé'], ['co-bb', 'oop', 'Le cut-off a ouvert, j’ai payé'], ['hj-bb', 'oop', 'Le hijack a ouvert, j’ai payé'], ['utg-bb', 'oop', 'UTG a ouvert, j’ai payé'], ['sb-bb', 'ip', 'La petite blinde a ouvert, j’ai payé'], ['bb3b-btn', 'oop', 'Le bouton a ouvert, j’ai relancé (3-bet), il a payé'], ['sb-limp', 'ip', 'La petite blinde a complété, j’ai checké']]
  };
  // tapis de 25 BB : variantes quand elles existent
  var V25 = { 'btn-bb': 'btn-bb-25', 'co-bb': 'co-bb-25', 'sb-bb': 'sb-bb-25' };
  var OPP = [['', 'Un joueur normal'], ['btn-bb-station', 'Une calling station'], ['btn-bb-vsnit', 'Un joueur très serré'], ['btn-bb-bulle', 'À la bulle'], ['btn-bb-pko', 'En PKO (primes)'], ['btn-bb-20', 'Tapis de 20 BB'], ['btn-bb-60', 'Tapis de 60 BB']];
  function hasSpot(id) { var D = window.PA_SOLVER.data(); return !!(D && D.spots.some(function (s) { return s.id === id; })); }
  function scList(pos) { return SC[pos].filter(function (s) { return hasSpot(s[0]); }); }
  var ST = { pos: null, sc: null, opp: '', cards: [], res: null, busy: false };
  var SIZE = { b33: 'un tiers du pot', b50: 'la moitié du pot', b66: 'deux tiers du pot', b75: 'trois quarts du pot', b100: 'la taille du pot', b125: '1,25 fois le pot', ai: 'tapis' };
  function actName(a) { return a === 'x' ? 'Check' : a === 'f' ? 'Se coucher' : a === 'c' ? 'Payer' : a === 'r' ? 'Relancer' : a === 'ai' ? 'Tapis' : 'Miser ' + SIZE[a]; }
  function cardH(c, sel) { var red = c[1] === 'h' || c[1] === 'd'; return '<span class="apf-c' + (red ? ' red' : '') + (sel ? ' ' + sel : '') + '">' + (c[0] === 'T' ? '10' : c[0]) + SU[c[1]] + '</span>'; }
  function U() { return window.PA_UI; }
  function prof() { var p = window.PA.player(); return (p && p.profile) || 'tag'; }
  function spotId() {
    if (!ST.sc) return null; var id = ST.sc[0];
    if (id === 'btn-bb' && ST.sc[1] === 'ip' && ST.opp) id = ST.opp;
    if (ST.d25 && V25[id] && hasSpot(V25[id])) return V25[id];
    // profils serré / large-agressif quand le coup existe
    var D = window.PA_SOLVER.data(), pr = prof(), v = id + '-' + (pr === 'nit' ? 'nit' : pr === 'lag' ? 'lag' : '');
    if ((pr === 'nit' || pr === 'lag') && D && D.spots.some(function (s) { return s.id === v; })) return v;
    return id;
  }
  function spotOf(id) { var D = window.PA_SOLVER.data(); return D && D.spots.filter(function (s) { return s.id === id; })[0]; }
  // rapproche le flop choisi du flop calculé le plus ressemblant, et transpose la main
  function nearest(sp, flop) {
    var fl = flop.slice().sort(function (a, b) { return R.indexOf(b[0]) - R.indexOf(a[0]); });
    function feat(cs) { var r = cs.map(function (c) { return R.indexOf(c[0]); }); var su = {}; cs.forEach(function (c) { su[c[1]] = (su[c[1]] || 0) + 1; }); var mx = Math.max.apply(null, Object.keys(su).map(function (k) { return su[k]; })); return { r: r, mx: mx, pair: r[0] === r[1] || r[1] === r[2] }; }
    var f0 = feat(fl), best = null, bd = 1e9;
    (sp.flops || window.PA_SOLVER.data().flops).forEach(function (f) {
      var cs = [f.slice(0, 2), f.slice(2, 4), f.slice(4, 6)].sort(function (a, b) { return R.indexOf(b[0]) - R.indexOf(a[0]); }), g = feat(cs);
      var d = Math.abs(f0.r[0] - g.r[0]) * 3 + Math.abs(f0.r[1] - g.r[1]) * 1.2 + Math.abs(f0.r[2] - g.r[2]) * 0.8 + (f0.mx === g.mx ? 0 : (f0.mx === 3 || g.mx === 3 ? 8 : 2.5)) + (f0.pair !== g.pair ? 10 : 0);
      if (d < bd) { bd = d; best = { f: f, cs: cs }; }
    });
    return { flop: best.f, cs: best.cs, user: fl, exact: bd === 0 };
  }
  function transpose(map, hand) {
    var sm = {}, used = {};
    map.user.forEach(function (c, i) { var t = map.cs[i]; if (!sm[c[1]] && !used[t[1]]) { sm[c[1]] = t[1]; used[t[1]] = 1; } });
    SUITS.forEach(function (s) { if (!sm[s]) { var f = SUITS.filter(function (x) { return !used[x]; })[0] || s; sm[s] = f; used[f] = 1; } });
    var rm = {}; map.user.forEach(function (c, i) { rm[c[0]] = map.cs[i][0]; });
    var out = hand.map(function (c) { return (rm[c[0]] || c[0]) + sm[c[1]]; });
    var board = map.cs;
    out = out.map(function (c, i) { var k = 0; while ((board.indexOf(c) >= 0 || (i === 1 && c === out[0])) && k < 4) { c = c[0] + SUITS[(SUITS.indexOf(c[1]) + 1) % 4]; k++; } return c; });
    return out;
  }
  // nœuds à montrer selon qui parle
  function plan(sp, side) {
    if (side === 'oop' && !sp.oopBets) return { first: null, vsBet: ['x-b33', 'x-b75'], note: 'Ici, tu checkes au flop vers celui qui a relancé : c’est ce que fait le solveur avec toutes ses mains.' };
    if (side === 'ip' && !sp.oopBets) return { first: 'x', vsBet: [] };
    if (side === 'oop') return { first: '', vsBet: [] };
    return { first: 'x', vsBet: ['b33', 'b75'] };
  }
  function describe(r, title) {
    if (!r) return '<div class="small muted">Pas de solution pour ce cas.</div>';
    var row = r.p || r.mix; if (!row) return '<div class="small muted">Cette main n’est pas dans ta range ici.</div>';
    var L = r.a.map(function (a, k) { return [a, row[k]]; }).filter(function (x) { return x[1] >= 0.03; }).sort(function (x, y) { return y[1] - x[1]; });
    var top = L[0];
    return '<div class="apf-ans"><b>' + title + '</b><div class="apf-big">' + actName(top[0]) + ' <span>' + Math.round(top[1] * 100) + ' %</span></div>' +
      (L.length > 1 ? '<div class="small">Sinon : ' + L.slice(1).map(function (x) { return actName(x[0]).toLowerCase() + ' ' + Math.round(x[1] * 100) + ' %'; }).join(', ') + '.</div>' : '<div class="small">Toujours.</div>') +
      (!r.p ? '<div class="small muted">Cette main exacte n’est pas dans ta range : réponse moyenne de sa famille (' + r.cat.toLowerCase() + ').</div>' : '') + '</div>';
  }
  function compute() {
    var id = spotId(), sp = spotOf(id); if (!sp || ST.cards.length < 5) return;
    var map = nearest(sp, ST.cards.slice(0, 3)), hand = transpose(map, ST.cards.slice(3, 5)), combo = hand.join(''), pl = plan(sp, ST.sc[1]);
    ST.busy = true; ST.res = { id: id, sp: sp, map: map, hand: hand, pl: pl, out: [] }; U().render();
    var jobs = [];
    if (pl.first !== null) jobs.push([pl.first, pl.first === 'x' ? 'Il checke. Le solveur :' : 'Tu parles en premier. Le solveur :', 'first']);
    pl.vsBet.forEach(function (p) { var sz = p.replace(/^x-/, ''); jobs.push([p, (p.indexOf('x-') === 0 ? 'Tu checkes, il mise ' : 'Il mise ') + SIZE[sz] + ' :', 'vs']); });
    var k = 0;
    (function next() {
      if (k >= jobs.length) { ST.busy = false; follow(combo); return; }
      var j = jobs[k++]; window.PA_SOLVER.query(id, map.flop, j[0], combo, function (r) { ST.res.out.push({ path: j[0], title: j[1], kind: j[2], r: r }); next(); });
    })();
  }
  // la suite : si tu mises et qu'il relance
  function follow(combo) {
    var R0 = ST.res, f = R0.out.filter(function (o) { return o.kind === 'first' && o.r && (o.r.p || o.r.mix); })[0];
    if (!f) { U().render(); scrollRes(); return; }
    var row = f.r.p || f.r.mix, bets = f.r.a.map(function (a, i) { return [a, row[i]]; }).filter(function (x) { return x[0] !== 'x' && x[0] !== 'ai'; }).sort(function (x, y) { return y[1] - x[1]; });
    if (!bets.length || bets[0][1] < 0.15) { U().render(); scrollRes(); return; }
    var base = (f.path ? f.path + '-' : '') + bets[0][0], path = f.r.nodes[base + '-r'] ? base + '-r' : base + '-ai';
    if (!f.r.nodes[path]) { U().render(); return; }
    window.PA_SOLVER.query(R0.id, R0.map.flop, path, combo, function (r) { R0.out.push({ path: path, title: 'Si tu mises ' + SIZE[bets[0][0]] + ' et qu’il ' + (/-ai$/.test(path) ? 'fait tapis' : 'relance') + ' :', kind: 'raise', r: r }); U().render(); scrollRes(); });
  }
  function scrollRes() { setTimeout(function () { var el = document.getElementById('apfRes'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); }
  function view() {
    var ui = U();
    if (!window.PA_SOLVER || !window.PA_SOLVER.data()) { if (window.PA_SOLVER) window.PA_SOLVER.loadData(function () { ui.render(); }); return ui.shell('apprendre', '<div class="stack"><h1>Après le flop : que faire ?</h1><p class="muted">Chargement…</p></div>'); }
    var out = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Après le flop : que faire ?</h1>' +
      ui.yo('Dis-moi où tu étais, ce qui s’est passé avant le flop, le flop et ta main : je te dis ce que fait le solveur, et la suite.');
    out += '<div class="card stack"><b>1. Où étais-tu ?</b><div class="seg">' + POS.map(function (p) { return '<button class="' + (ST.pos === p[0] ? 'on' : '') + '" data-apf="pos" data-v="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div></div>';
    if (ST.pos) {
      out += '<div class="card stack"><b>2. Avant le flop</b><div class="apf-list">' + scList(ST.pos).map(function (s, i) { return '<button class="btn' + (ST.sc === s ? ' gold' : '') + '" data-apf="sc" data-v="' + i + '">' + s[2] + '</button>'; }).join('') + '</div>';
      if (ST.sc && ST.sc[0] === 'btn-bb' && ST.sc[1] === 'ip') out += '<div class="small muted">Contre qui ?</div><div class="seg">' + OPP.map(function (o) { return '<button class="' + (ST.opp === o[0] ? 'on' : '') + '" data-apf="opp" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
      if (ST.sc && V25[ST.sc[0]] && hasSpot(V25[ST.sc[0]]) && !(ST.sc[0] === 'btn-bb' && ST.opp)) out += '<div class="small muted">Ton tapis</div><div class="seg"><button class="' + (!ST.d25 ? 'on' : '') + '" data-apf="d25" data-v="0">40 BB</button><button class="' + (ST.d25 ? 'on' : '') + '" data-apf="d25" data-v="1">25 BB</button></div>';
      out += '</div>';
    }
    if (ST.sc) {
      var sel = ST.cards;
      out += '<div class="card stack"><b>3. Le flop, puis ta main</b><div class="row apf-slots"><span class="small muted">Flop</span>' + [0, 1, 2].map(function (i) { return sel[i] ? cardH(sel[i]) : '<span class="apf-c empty"></span>'; }).join('') + '<span class="small muted" style="margin-left:10px">Main</span>' + [3, 4].map(function (i) { return sel[i] ? cardH(sel[i]) : '<span class="apf-c empty"></span>'; }).join('') + '<button class="btn" data-apf="clear" style="margin-left:auto;min-height:40px">Effacer</button></div>' +
        '<div class="small muted">' + (sel.length < 3 ? 'Touche les 3 cartes du flop.' : sel.length < 5 ? 'Touche tes 2 cartes.' : 'C’est prêt.') + '</div>' +
        '<div class="apf-grid">' + SUITS.map(function (s) { return R.split('').reverse().map(function (r) { var c = r + s, i = sel.indexOf(c); return '<button data-apf="card" data-v="' + c + '"' + (i >= 0 ? ' class="on"' : '') + '>' + cardH(c) + '</button>'; }).join(''); }).join('') + '</div></div>';
    }
    var res = ST.res;
    if (res) {
      var exact = res.map.exact && res.hand.join('') === ST.cards.slice(3).join('');
      out += '<div class="card stack" id="apfRes"><b>Ce que fait le solveur</b><div class="small muted">' + res.sp.name + ' · tapis ' + res.sp.start + ' BB' + (res.id !== ST.sc[0] && res.id !== ST.opp ? ' · ranges du profil ' + window.PA.PROFILES[prof()].short : '') + '</div>' +
        (exact ? '' : '<div class="small">Flop calculé le plus proche : ' + res.map.cs.map(function (c) { return cardH(c); }).join('') + ' · ta main transposée : ' + res.hand.map(function (c) { return cardH(c); }).join('') + '</div>') +
        (res.out.length ? '<div class="small">Ta main : <b>' + ((res.out[0].r && res.out[0].r.cat) || '').toLowerCase() + '</b></div>' : '') +
        (res.pl.note ? '<div class="small muted">' + res.pl.note + '</div>' : '') +
        res.out.map(function (o) { return describe(o.r, o.title); }).join('') + (ST.busy ? '<div class="small muted">Calcul…</div>' : '') +
        '<a class="btn" href="#solveur?d=' + encodeURIComponent(JSON.stringify({ spot: res.id, flop: res.map.flop })) + '">Voir le détail (mode avancé)</a></div>';
    }
    out += '<div class="small muted">Pour tout explorer coup par coup : <a href="#solveur" style="color:var(--gold)">le solveur en mode avancé</a>.</div></div>';
    return ui.shell('apprendre', out);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-apf]') : null; if (!t) return;
    var a = t.getAttribute('data-apf'), v = t.getAttribute('data-v');
    if (a === 'pos') { ST.pos = v; var L0 = scList(v); ST.sc = L0.length === 1 ? L0[0] : null; ST.res = null; }
    else if (a === 'sc') { ST.sc = scList(ST.pos)[+v]; ST.opp = ''; ST.res = null; }
    else if (a === 'd25') { ST.d25 = v === '1'; ST.res = null; }
    else if (a === 'opp') { ST.opp = v; ST.res = null; }
    else if (a === 'clear') { ST.cards = []; ST.res = null; }
    else if (a === 'card') { var i = ST.cards.indexOf(v); if (i >= 0) ST.cards.splice(i, 1); else if (ST.cards.length < 5) ST.cards.push(v); ST.res = null; }
    if (ST.sc && ST.cards.length === 5 && !ST.res) { compute(); return; }
    U().render();
  });
  window.PA_APF = { view: view };
})();
