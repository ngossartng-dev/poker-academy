/* Poker Academy v2.0 — Minuteur de niveaux pour le club (grand écran) */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  var KEY = 'pa2timer';
  var DEF = ['25/50', '50/100', '75/150', '100/200 bbante 200', '150/300 bbante 300', 'pause 10', '200/400 bbante 400', '300/600 bbante 600', '400/800 bbante 800', '500/1000 bbante 1000', 'pause 10', '600/1200 bbante 1200', '800/1600 bbante 1600', '1000/2000 bbante 2000', '1500/3000 bbante 3000', '2000/4000 bbante 4000'].join('\n');
  var ST = load(), EDIT = false, lock = null, lastBeep = -1;
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.text) return s; } catch (e) {} return { text: DEF, mins: 20, idx: 0, rem: 20 * 60, since: null }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
  function levels() {
    var out = [], n = 0;
    ST.text.split(/\n/).forEach(function (l) {
      l = l.trim().toLowerCase(); if (!l) return;
      var pm = /^pause\s*(\d+)?/.exec(l);
      if (pm) { out.push({ pause: true, min: +(pm[1] || 10) }); return; }
      var m = /^(\d[\d\s.]*?)\s*\/\s*(\d[\d\s.]*?)(?:\s*(bbante|bb ante|ante|a)\s*(\d[\d\s.]*?))?(?:\s+(\d+)\s*min)?\s*$/.exec(l);
      if (!m) return;
      n++; out.push({ n: n, sb: +m[1].replace(/\D/g, ''), bb: +m[2].replace(/\D/g, ''), ante: m[4] ? +m[4].replace(/\D/g, '') : 0, bbAnte: !!m[3] && (/bb/.test(m[3]) || +m[4].replace(/\D/g, '') >= +m[2].replace(/\D/g, '')), min: m[5] ? +m[5] : ST.mins });
    });
    return out;
  }
  /* ---------- Générateur de structure de tournoi ---------- */
  // montants ronds : 1 · 1,2 · 1,5 · 2 · 2,5 · 3 · 4 · 5 · 6 · 8 × 10^k (de quoi aller jusqu’au 90e niveau)
  function series(from, mant) { var out = []; for (var e = 0; e <= 20; e++) mant.forEach(function (m) { var v = Math.round(m * Math.pow(10, e)); if (v >= from) out.push(v); }); return out; }
  var NICE = series(20, [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8]);
  var ANTES = series(5, [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8]);
  var SPEED = { lente: [1.25, 'Lente (+25 % par niveau)'], normale: [1.33, 'Normale (+33 %)'], rapide: [1.5, 'Rapide (+50 %)'] };
  var CFG0 = { sb: 50, bb: 100, n: 18, mins: 20, speed: 'normale', ante: 'bb', anteFrom: 4, pauseEvery: 5, pauseMin: 10, chips: 20000, reStack: 0, addStack: 0 };
  function cfg() { return Object.assign({}, CFG0, ST.cfg || {}); }
  function nearest(list, x) { var b = list[0]; list.forEach(function (v) { if (Math.abs(v - x) < Math.abs(b - x)) b = v; }); return b; }
  function generate(c) {
    var lines = [], sb = c.sb, bb = c.bb, f = SPEED[c.speed] ? SPEED[c.speed][0] : 1.33;
    for (var i = 1; i <= c.n; i++) {
      var ante = '';
      if (c.ante !== 'none' && i >= c.anteFrom) ante = c.ante === 'bb' ? ' bbante ' + bb : ' ante ' + nearest(ANTES, bb / 8);
      lines.push(sb + '/' + bb + ante);
      if (c.pauseEvery > 0 && i % c.pauseEvery === 0 && i < c.n) lines.push('pause ' + c.pauseMin);
      // niveau suivant : la grosse blinde « ronde » la plus proche de bb × facteur, toujours au-dessus
      var target = bb * f, nb = NICE.filter(function (v) { return v > bb; }).reduce(function (best, v) { return Math.abs(v - target) < Math.abs(best - target) ? v : best; }, bb * 2);
      bb = nb; sb = bb / 2;
    }
    return lines.join('\n');
  }
  /* ---------- Suivi du tournoi : joueurs, re-entries, add-ons, jetons en jeu, tapis moyen ---------- */
  function T() {
    ST.t = ST.t || { entrants: 0, left: 0, re: 0, add: 0 };
    var t = ST.t; t.players = t.players || []; t.size = t.size || 9;
    // avec des pseudos inscrits, les compteurs suivent la liste
    if (t.players.length) { t.entrants = t.players.length; t.left = t.players.filter(function (x) { return !x.out; }).length; }
    return t;
  }
  function chipsInPlay() { var c = cfg(), t = T(); return t.entrants * c.chips + t.re * (c.reStack || c.chips) + t.add * (c.addStack || c.chips); }
  function curBB(s) { for (var k = s.idx; k < s.L.length; k++) if (!s.L[k].pause) return s.L[k].bb; for (k = s.idx; k >= 0; k--) if (!s.L[k].pause) return s.L[k].bb; return 0; }
  function statsHtml(s) {
    var t = T(), chips = chipsInPlay(), avg = t.left > 0 ? chips / t.left : 0, bb = curBB(s);
    var box = function (lab, val, sub, id) { return '<div class="card" style="flex:1;min-width:150px;padding:12px;text-align:center"><div class="small muted">' + lab + '</div><div class="disp" id="' + id + '" style="font-size:clamp(28px,6vw,56px);line-height:1.1">' + val + '</div><div class="small muted">' + (sub || '&nbsp;') + '</div></div>'; };
    return '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:stretch">' +
      box('Joueurs restants', t.left + (t.entrants + t.re ? ' / ' + (t.entrants + t.re) : ''), t.entrants + ' inscrit' + (t.entrants > 1 ? 's' : '') + (t.re ? ' · ' + t.re + ' re-entr' + (t.re > 1 ? 'ies' : 'y') : '') + (t.add ? ' · ' + t.add + ' add-on' + (t.add > 1 ? 's' : '') : ''), 'tmLeft') +
      box('Jetons en jeu', fmt(chips), 'tapis de départ ' + fmt(cfg().chips), 'tmChipsTot') +
      box('Tapis moyen', avg ? fmt(Math.round(avg)) : '—', avg && bb ? Math.round(avg / bb) + ' grosses blindes' : '', 'tmAvg') + '</div>';
  }
  function countersHtml() {
    var t = T(), b = function (a, txt, cls) { return '<button class="btn' + (cls ? ' ' + cls : '') + '" data-tmact="' + a + '" style="min-width:48px">' + txt + '</button>'; };
    var line = function (lab, minus, val, plus) { return '<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span>' + lab + '</span><span class="row" style="gap:6px;align-items:center">' + b(minus, '−') + '<b style="min-width:44px;font-size:1.3em">' + val + '</b>' + b(plus, '+') + '</span></div>'; };
    var named = t.players.length > 0;
    return '<div class="card stack" style="text-align:left"><b>' + (named ? 'Re-entries et add-ons' : 'Les compteurs (sans pseudos)') + '</b>' +
      (named ? '' : line('Joueurs inscrits', 'entMinus', t.entrants, 'entPlus') +
      '<div class="row" style="gap:8px"><button class="btn gold" data-tmact="out" style="flex:1;font-size:1.15em"' + (t.left > 0 ? '' : ' disabled') + '>Joueur éliminé</button><button class="btn" data-tmact="undoOut">Annuler</button></div>') +
      line('Re-entries', 'reMinus', t.re, 'rePlus') +
      line('Add-ons', 'addMinus', t.add, 'addPlus') +
      '<div class="small muted">Un éliminé ne retire aucun jeton : ses jetons sont passés à un autre joueur. Une re-entry remet un joueur en jeu et ajoute un tapis. Le tapis moyen = jetons en jeu ÷ joueurs restants.</div></div>';
  }
  /* ---------- Tirage des tables ---------- */
  function shuffle(a) { for (var j = a.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)), x = a[j]; a[j] = a[k]; a[k] = x; } return a; }
  function alivePl() { return T().players.filter(function (x) { return !x.out; }); }
  function tablesOf() { var o = {}; alivePl().forEach(function (x) { if (x.table) (o[x.table] = o[x.table] || []).push(x); }); return o; }
  function draw() {
    var t = T(), live = shuffle(alivePl().slice()), n = live.length; if (!n) return;
    var nt = Math.ceil(n / t.size), base = Math.floor(n / nt), extra = n % nt, k = 0;
    t.buttons = {};
    for (var tb = 1; tb <= nt; tb++) {
      var cnt = base + (tb <= extra ? 1 : 0), seats = shuffle(Array.from({ length: t.size }, function (_, i) { return i + 1; })).slice(0, cnt).sort(function (a, b) { return a - b; });
      seats.forEach(function (st) { live[k].table = tb; live[k].seat = st; k++; });
      t.buttons[tb] = seats[Math.floor(Math.random() * seats.length)];
    }
    t.drawn = true; t.finalSaid = nt === 1; t.msg = 'Tirage fait : ' + n + ' joueurs sur ' + nt + ' table' + (nt > 1 ? 's' : '') + ' de ' + t.size + ' places maximum.';
  }
  function freeSeat(tb) { var t = T(), used = {}; alivePl().forEach(function (x) { if (x.table === tb) used[x.seat] = 1; }); var fr = []; for (var i = 1; i <= t.size; i++) if (!used[i]) fr.push(i); return fr.length ? fr[Math.floor(Math.random() * fr.length)] : null; }
  function seatSomewhere(pl) { // la table la moins remplie
    var tb = tablesOf(), ids = Object.keys(tb).map(Number); if (!ids.length) { pl.table = 1; pl.seat = 1; return; }
    ids.sort(function (a, b) { return tb[a].length - tb[b].length || a - b; });
    for (var i = 0; i < ids.length; i++) { var st = freeSeat(ids[i]); if (st) { pl.table = ids[i]; pl.seat = st; return; } }
    var nt = Math.max.apply(null, ids) + 1; pl.table = nt; pl.seat = 1;
  }
  // après une élimination : fermer une table si les joueurs tiennent sur une de moins, sinon équilibrer (écart de 2 ou plus)
  function rebalance() {
    var t = T(), moves = [];
    if (!t.drawn) return moves;
    for (var guard = 0; guard < 50; guard++) {
      var tb = tablesOf(), ids = Object.keys(tb).map(Number), n = alivePl().length;
      if (ids.length > 1 && n <= (ids.length - 1) * t.size) {
        var close = Math.max.apply(null, ids);
        tb[close].slice().forEach(function (pl) { var from = 'table ' + pl.table + ' siège ' + pl.seat; pl.table = null; var others = tablesOf(), oid = Object.keys(others).map(Number).filter(function (x) { return x !== close; }).sort(function (a, b) { return others[a].length - others[b].length; }); for (var i = 0; i < oid.length; i++) { var st = freeSeat(oid[i]); if (st) { pl.table = oid[i]; pl.seat = st; break; } } moves.push(pl.name + ' : ' + from + ' → table ' + pl.table + ' siège ' + pl.seat); });
        moves.unshift('Fermeture de la table ' + close + '.');
        continue;
      }
      if (ids.length < 2) break;
      ids.sort(function (a, b) { return tb[b].length - tb[a].length; });
      var big = ids[0], small = ids[ids.length - 1];
      if (tb[big].length - tb[small].length < 2) break;
      var pl = tb[big][Math.floor(Math.random() * tb[big].length)], from2 = 'table ' + big + ' siège ' + pl.seat, st2 = freeSeat(small);
      pl.table = small; pl.seat = st2; moves.push('Équilibrage : ' + pl.name + ' passe de la ' + from2 + ' à la table ' + small + ' siège ' + st2 + '.');
    }
    var left = alivePl().length;
    if (left > 1 && left <= t.size && Object.keys(tablesOf()).length === 1 && !t.finalSaid) { t.finalSaid = true; moves.push('Table finale !'); }
    return moves;
  }
  var FIND = { q: '', listening: false, msg: '' };
  function findHtml() {
    var ui = U(), t = T(), V = window.PA_VOICE, n = V ? V.norm(FIND.q) : FIND.q.toLowerCase();
    if (!t.players.length) return '<div class="small muted">Inscris d’abord les joueurs.</div>';
    if (!n) return '<div class="small muted">Tape le début d’un pseudo' + (V && V.ok() ? ' ou touche le micro et dis-le' : '') + '.</div>';
    var hit = t.players.filter(function (x) { return (V ? V.norm(x.name) : x.name.toLowerCase()).indexOf(n) >= 0; }).slice(0, 8);
    if (!hit.length) return '<div class="small muted">Aucun inscrit ne correspond à « ' + ui.esc(FIND.q) + ' ».</div>';
    return hit.map(function (x) { var i = t.players.indexOf(x);
      return '<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span><b>' + ui.esc(x.name) + '</b> <span class="small muted">' + (x.out ? 'éliminé, ' + x.place + 'e' : (x.table ? 'table ' + x.table + ', siège ' + x.seat : 'pas encore placé')) + '</span></span><span class="row" style="gap:6px">' +
        (x.out ? '<button class="btn" data-tmact="reentry" data-v="' + i + '">Re-entry</button><button class="btn" data-tmact="unko" data-v="' + i + '">Annuler</button>' : '<button class="btn gold" data-tmact="ko" data-v="' + i + '">Éliminé</button>') + '</span></div>'; }).join('');
  }
  function tournoiView() {
    var ui = U(), t = T(), s = live(), c = cfg(), out = '<div class="stack"><button class="back" data-act="nav" data-v="home">‹ Accueil</button><h1>Tournoi du club</h1>' +
      '<div class="row" style="gap:8px"><a class="btn gold" href="#minuteur" style="flex:1">⏱ Ouvrir le minuteur</a><button class="btn" data-tmact="editFromT" style="flex:1">Structure des niveaux</button></div>';
    out += statsHtml(s);
    var cin = function (id, v, lab) { return '<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span>' + lab + '</span><input id="' + id + '" type="number" inputmode="numeric" min="0" value="' + v + '" style="width:130px;min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit"></div>'; };
    out += '<details class="card"' + (t.players.length ? '' : ' open') + '><summary style="cursor:pointer"><b>Les jetons</b> <span class="small muted">départ ' + fmt(c.chips) + ' · re-entry ' + fmt(c.reStack || c.chips) + ' · add-on ' + fmt(c.addStack || c.chips) + '</span></summary><div class="stack" style="margin-top:10px">' + cin('tnChips', c.chips, 'Tapis de départ') + cin('tnRe', c.reStack, 'Tapis d’une re-entry (0 = comme le départ)') + cin('tnAdd', c.addStack, 'Tapis d’un add-on (0 = comme le départ)') + '<div class="small muted">Les jetons en jeu et le tapis moyen se recalculent dès que tu changes une case.</div></div></details>';
    if (t.msg) out += ui.yo(t.msg);
    if (t.players.length) out += '<div class="card stack"><b>Trouver un joueur</b><div class="row" style="gap:8px"><input id="tnFind" type="search" autocomplete="off" placeholder="Pseudo…" value="' + ui.esc(FIND.q) + '" style="flex:1;min-height:48px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:12px;padding:6px 12px;font:inherit;font-size:1.1em">' + (window.PA_VOICE ? window.PA_VOICE.mic('data-tmact="findMic"', FIND.listening) : '') + '</div>' + (FIND.msg ? '<div class="small" style="color:var(--gold)">' + ui.esc(FIND.msg) + '</div>' : '') + '<div id="tnFound" class="stack" style="gap:8px">' + findHtml() + '</div></div>';
    var IN = 'min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit';
    // 1. format et inscriptions
    out += '<div class="card stack"><b>1. Les inscriptions</b><div class="small muted">Format des tables</div><div class="seg">' + [[6, '6-max'], [9, '9-max'], [10, 'Full ring (10)']].map(function (o) { return '<button class="' + (t.size === o[0] ? 'on' : '') + '" data-tmact="size" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<div class="small muted">Un pseudo par ligne (ou séparés par des virgules)</div><textarea id="tnNames" rows="4" style="width:100%;' + IN + ';padding:8px" placeholder="Lionel&#10;Gégé&#10;Nadia"></textarea>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" data-tmact="addNames" style="flex:1">Inscrire</button>' + ((window.PA.player() || {}).opps && window.PA.player().opps.length ? '<button class="btn" data-tmact="addOpps">Mes adversaires du club</button>' : '') + '</div>' +
      (t.players.length ? '<details' + (t.players.length <= 20 ? ' open' : '') + '><summary class="small" style="cursor:pointer">' + t.players.length + ' inscrit' + (t.players.length > 1 ? 's' : '') + ' (toucher pour afficher ou replier)</summary><div class="small">' + t.players.map(function (x, i) { return '<span class="chip" style="margin:2px">' + ui.esc(x.name) + (t.drawn ? '' : ' <button data-tmact="delP" data-v="' + i + '" aria-label="Retirer" style="background:none;border:0;color:var(--muted);cursor:pointer">✕</button>') + '</span>'; }).join('') + '</div></details>' : '') +
      '<button class="btn block' + (t.players.length ? ' gold' : '') + '" data-tmact="draw"' + (alivePl().length ? '' : ' disabled') + '>' + (t.drawn ? 'Refaire le tirage des tables' : 'Tirer les tables et les sièges au sort') + '</button></div>';
    // 2. tables
    if (t.drawn) {
      var tb = tablesOf(), ids = Object.keys(tb).map(Number).sort(function (a, b) { return a - b; });
      out += '<div class="card stack"><b>2. Les tables</b><div class="small muted">Touche un joueur quand il est éliminé : les tables s’équilibrent et se ferment toutes seules. D = bouton au début du tournoi.</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">' + ids.map(function (id) {
        var h = '<div style="position:relative;width:100%;aspect-ratio:1.45;margin:6px 0">' +
          '<div style="position:absolute;left:14%;right:14%;top:20%;bottom:20%;border-radius:999px;background:radial-gradient(ellipse at center,#1d5b3a 0%,#0f3a25 70%);border:5px solid #3a2a12;box-shadow:inset 0 0 0 2px var(--gold)"></div>' +
          '<div style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-weight:700;color:var(--gold)">Table ' + id + '<div class="small" style="color:#cfe9d8;font-weight:400">' + tb[id].length + ' joueur' + (tb[id].length > 1 ? 's' : '') + '</div></div>';
        for (var st = 1; st <= t.size; st++) {
          var ang = Math.PI / 2 + (st - 1) * 2 * Math.PI / t.size, x = 50 + 43 * Math.cos(ang), y = 50 + 40 * Math.sin(ang);
          var pl = tb[id].filter(function (q) { return q.seat === st; })[0], dB = t.buttons && t.buttons[id] === st;
          h += '<div style="position:absolute;left:' + x + '%;top:' + y + '%;transform:translate(-50%,-50%);text-align:center;width:' + (t.size > 9 ? 23 : 26) + '%">' +
            (pl ? '<button data-tmact="ko" data-v="' + t.players.indexOf(pl) + '" style="width:100%;min-height:34px;padding:2px 4px;border-radius:10px;border:2px solid ' + (dB ? 'var(--gold)' : 'var(--line)') + ';background:var(--panel2);color:var(--ink);font:inherit;font-size:.82em;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer">' + ui.esc(pl.name) + '</button>' : '<div class="small muted" style="opacity:.55">libre</div>') +
            '<div class="small muted" style="font-size:.7em">' + st + (dB ? ' <b style="color:var(--gold)">D</b>' : '') + '</div></div>';
        }
        return h + '</div>';
      }).join('') + '</div><button class="btn" data-tmact="print">Imprimer le plan des tables</button></div>';
    }
    // 3. éliminés
    var outL = t.players.filter(function (x) { return x.out; }).sort(function (a, b) { return a.place - b.place; });
    if (outL.length) out += '<div class="card stack"><b>3. Les éliminés</b>' + outL.map(function (x) { return '<div class="row" style="justify-content:space-between;gap:8px"><span>' + x.place + 'e · ' + ui.esc(x.name) + (x.entries > 1 ? ' <span class="small muted">(' + x.entries + ' entrées)</span>' : '') + '</span><span class="row" style="gap:6px"><button class="btn" data-tmact="reentry" data-v="' + t.players.indexOf(x) + '">Re-entry</button><button class="btn" data-tmact="unko" data-v="' + t.players.indexOf(x) + '">Annuler</button></span></div>'; }).join('') + '</div>';
    // 4. compteurs (re-entries, add-ons ; inscrits sans pseudo)
    out += countersHtml();
    out += '<button class="btn" data-tmact="newT">Nouveau tournoi (tout effacer)</button></div>';
    return ui.shell('home', out);
  }
  function schedule(L) { var t = 0; return L.map(function (l) { var st = t; t += l.min; return st; }); }
  function hm(m) { var h = Math.floor(m / 60), r = m % 60; return h + ' h ' + (r < 10 ? '0' : '') + r; }
  function fmt(x) { return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function live() {
    var L = levels(); if (!L.length) return { L: L, idx: 0, rem: 0 };
    var idx = Math.min(ST.idx, L.length - 1), rem = ST.rem;
    if (ST.since) {
      rem -= (Date.now() - ST.since) / 1000;
      while (rem <= 0 && idx < L.length - 1) { idx++; rem += L[idx].min * 60; }
      if (rem < 0) rem = 0;
    }
    return { L: L, idx: idx, rem: rem };
  }
  function keepScroll(fn) { var y = window.scrollY || 0; fn(); try { window.scrollTo(0, y); } catch (e) {} }
  function freeze() { var s = live(); ST.idx = s.idx; ST.rem = s.rem; ST.since = ST.since ? Date.now() : null; save(); }
  function beep(n) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      for (var i = 0; i < n; i++) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.4); o.start(ctx.currentTime + i * 0.4); o.stop(ctx.currentTime + i * 0.4 + 0.25); }
    } catch (e) {}
  }
  function awake(on) {
    try { if (window.PAAndroid) PAAndroid.keepAwake(on); } catch (e) {}
    try { if (on && navigator.wakeLock && !lock) navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {}); if (!on && lock) { lock.release(); lock = null; } } catch (e) {}
  }
  function anteTxt(l) { return l.ante ? (l.bbAnte ? 'ante grosse blinde ' + fmt(l.ante) : 'ante ' + fmt(l.ante) + ' par joueur') : ''; }
  function lvlTxt(l) { return l.pause ? 'Pause' : fmt(l.sb) + ' / ' + fmt(l.bb) + (l.ante ? ' · ' + anteTxt(l) : ''); }
  function mmss(s) { s = Math.ceil(s); var m = Math.floor(s / 60); return (m < 10 ? '0' : '') + m + ':' + ((s % 60) < 10 ? '0' : '') + (s % 60); }
  function nextInfo(s) {
    var nx = s.L[s.idx + 1], pz = -1, secs = s.rem;
    for (var k = s.idx + 1; k < s.L.length; k++) { if (s.L[k].pause) { pz = k; break; } secs += s.L[k].min * 60; }
    var mins = Math.ceil(secs / 60);
    return (nx ? 'Prochain niveau : ' + lvlTxt(nx) : 'Dernier niveau') + (pz > 0 && !(nx && nx.pause) ? ' · prochaine pause dans ' + (mins >= 60 ? hm(mins) : mins + ' min') : '');
  }
  function view() {
    var ui = U(), s = live();
    if (EDIT || !s.L.length) {
      var c = cfg(), IN = 'min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit';
      var num = function (id, v, w, mn, mx) { return '<input id="' + id + '" type="number" inputmode="numeric" min="' + mn + '" max="' + mx + '" value="' + v + '" style="width:' + w + 'px;' + IN + '">'; };
      var sel = function (id, v, opts) { return '<select id="' + id + '" style="max-width:100%;' + IN + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
      var row = function (lab, ctl) { return '<div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><span>' + lab + '</span><span class="row" style="gap:6px">' + ctl + '</span></div>'; };
      var L0 = levels(), sch = schedule(L0), first = L0.filter(function (l) { return !l.pause; })[0];
      var prev = L0.length ? '<table class="tbl" style="white-space:nowrap;font-size:.9em"><tr><th>Niveau</th><th>Blindes</th><th>Ante</th><th>Durée</th><th>Début</th></tr>' + L0.map(function (l, i) { return '<tr' + (l.pause ? ' style="color:var(--gold)"' : '') + '><td>' + (l.pause ? 'Pause' : l.n) + '</td><td>' + (l.pause ? '' : fmt(l.sb) + ' / ' + fmt(l.bb)) + '</td><td>' + (l.ante ? (l.bbAnte ? fmt(l.ante) + ' (BB)' : fmt(l.ante)) : '') + '</td><td>' + l.min + ' min</td><td>' + hm(sch[i]) + '</td></tr>'; }).join('') + '</table>' +
        '<div class="small muted">Durée totale : ' + hm(sch.length ? sch[sch.length - 1] + L0[L0.length - 1].min : 0) + (c.chips && first ? ' · tapis de départ ' + fmt(c.chips) + ' = ' + Math.round(c.chips / first.bb) + ' grosses blindes au niveau 1' : '') + '</div>' : '';
      return ui.shell('apprendre', '<div class="stack"><button class="back" data-tmact="done">‹ Minuteur</button><h1>Structure du tournoi</h1>' +
        ui.yo('Choisis tes réglages et touche « Créer la structure ». La liste des niveaux se remplit : tu peux encore la corriger à la main avant d’enregistrer. Ante de grosse blinde : la grosse blinde paie une ante égale à sa blinde pour toute la table. Ante classique : chaque joueur paie environ un huitième de la grosse blinde.') +
        '<div class="card stack"><b>1. Les blindes</b>' +
        row('Blindes de départ', num('tmSb', c.sb, 100, 1, 1000000) + ' / ' + num('tmBb', c.bb, 100, 1, 1000000)) +
        row('Progression', sel('tmSpeed', c.speed, Object.keys(SPEED).map(function (k) { return [k, SPEED[k][1]]; }))) +
        row('Nombre de niveaux', num('tmN', c.n, 80, 1, 90)) +
        row('Durée des niveaux (minutes)', num('tmMins', c.mins, 80, 1, 120)) +
        '<b>Les jetons</b>' +
        row('Tapis de départ', num('tmChips', c.chips, 130, 0, 100000000)) +
        row('Tapis d’une re-entry (0 = comme le départ)', num('tmRe', c.reStack, 130, 0, 100000000)) +
        row('Tapis d’un add-on (0 = comme le départ)', num('tmAdd', c.addStack, 130, 0, 100000000)) +
        '<b>2. L’ante</b>' +
        row('Type d’ante', sel('tmAnte', c.ante, [['none', 'Pas d’ante'], ['bb', 'Ante de grosse blinde'], ['classic', 'Ante classique (par joueur)']])) +
        row('À partir du niveau', num('tmAnteFrom', c.anteFrom, 80, 1, 90)) +
        '<b>3. Les pauses</b>' +
        row('Une pause tous les … niveaux (0 = aucune)', num('tmPEvery', c.pauseEvery, 80, 0, 30)) +
        row('Durée des pauses (minutes)', num('tmPMin', c.pauseMin, 80, 1, 60)) +
        '<button class="btn gold block" data-tmact="gen">Créer la structure</button></div>' +
        '<div class="card stack"><b>Les niveaux</b><div class="small muted">Un niveau par ligne : « 100/200 », « 100/200 bbante 200 » (ante de grosse blinde) ou « 100/200 ante 25 » (ante classique). « pause 10 » ajoute une pause de 10 minutes. Une durée différente en fin de ligne : « 600/1200 bbante 1200 30 min ».</div>' +
        '<textarea id="tmText" rows="14" style="width:100%;' + IN + ';padding:8px">' + ui.esc(ST.text) + '</textarea>' +
        '<div class="row"><button class="btn gold" data-tmact="savestruct" style="flex:1">Enregistrer et revenir au minuteur</button><button class="btn" data-tmact="preview">Aperçu</button></div>' + prev + '</div></div>');
    }
    var l = s.L[s.idx], run = !!ST.since;
    var body = '<div class="stack" style="text-align:center;align-items:stretch;max-width:900px;margin:0 auto">' +
      '<div class="row" style="justify-content:space-between"><a class="back" href="#tournoi">‹ Tournoi du club</a><span class="small muted">' + (l.pause ? 'Pause' : 'Niveau ' + l.n) + ' sur ' + s.L.filter(function (x) { return !x.pause; }).length + '</span></div>' +
      '<div class="card stack" style="align-items:center;gap:6px;padding:24px 12px">' +
      '<div class="disp" id="tmLvl" style="font-size:clamp(40px,11vw,120px);line-height:1;color:var(--gold)">' + lvlTxt(l).split(' · ')[0] + '</div>' +
      '<div id="tmAnte" style="font-size:clamp(20px,5vw,44px)">' + (l.ante ? anteTxt(l) : (l.pause ? 'Bonne pause !' : '&nbsp;')) + '</div>' +
      '<div class="disp" id="tmClock" style="font-size:clamp(70px,24vw,260px);line-height:1;margin-top:8px">' + mmss(s.rem) + '</div>' +
      '<div class="muted" id="tmNext" style="font-size:clamp(15px,3vw,26px)">' + nextInfo(s) + '</div></div>' +
      '<div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px"><button class="btn" data-tmact="prev">‹ Niveau</button><button class="btn gold" data-tmact="toggle" style="min-width:160px;font-size:1.2em">' + (run ? 'Pause' : (ST.idx || ST.rem !== s.L[0].min * 60 ? 'Reprendre' : 'Démarrer')) + '</button><button class="btn" data-tmact="next">Niveau ›</button></div>' +
      '<div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px"><button class="btn" data-tmact="minus">− 1 min</button><button class="btn" data-tmact="plus">+ 1 min</button><button class="btn" data-tmact="full">Plein écran</button><button class="btn" data-tmact="edit">Structure</button><button class="btn" data-tmact="reset">Remettre à zéro</button></div>' +
      statsHtml(s) + '<a class="btn block" href="#tournoi">Le tournoi : joueurs, tables, éliminations ›</a>' +
      '<p class="small muted">Un signal sonore annonce la dernière minute et le changement de niveau. L’écran reste allumé pendant que le minuteur tourne.</p></div>';
    return ui.shell('apprendre', body, true);
  }
  setInterval(function () {
    if (!/^#minuteur/.test(location.hash) || EDIT) return;
    var s = live(), c = document.getElementById('tmClock'); if (!c || !s.L.length) return;
    if (ST.since) {
      if (s.idx !== ST.shown) { if (ST.shown !== undefined) { beep(3); } ST.shown = s.idx; U().render(); return; }
      var r = Math.ceil(s.rem); if (r === 60 && lastBeep !== s.idx) { lastBeep = s.idx; beep(1); }
    }
    c.textContent = mmss(s.rem);
  }, 500);
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tmact]') : null; if (!t) return;
    var a = t.getAttribute('data-tmact'), s = live(), L = s.L;
    if (a === 'toggle') { if (ST.since) { freeze(); ST.since = null; awake(false); } else { ST.idx = s.idx; ST.rem = s.rem; ST.since = Date.now(); ST.shown = s.idx; awake(true); beep(1); } }
    else if (a === 'next' || a === 'prev') { var k = Math.max(0, Math.min(L.length - 1, s.idx + (a === 'next' ? 1 : -1))); ST.idx = k; ST.rem = L[k].min * 60; ST.shown = k; if (ST.since) ST.since = Date.now(); }
    else if (a === 'plus' || a === 'minus') { freeze(); ST.rem = Math.max(1, ST.rem + (a === 'plus' ? 60 : -60)); }
    else if (a === 'size') { T().size = +t.getAttribute('data-v'); T().msg = T().drawn ? 'Format changé : refais le tirage des tables.' : null; }
    else if (a === 'addNames' || a === 'addOpps') {
      var tt = T(), names = a === 'addOpps' ? (window.PA.player().opps || []).map(function (o) { return o.name; }) : (document.getElementById('tnNames').value || '').split(/[\n,;]+/);
      var added = 0; names.map(function (x) { return String(x || '').trim(); }).filter(Boolean).forEach(function (nm) { if (tt.players.some(function (x) { return x.name.toLowerCase() === nm.toLowerCase(); })) return; var pl = { name: nm.slice(0, 30), out: false, entries: 1 }; tt.players.push(pl); added++; if (tt.drawn) seatSomewhere(pl); });
      tt.msg = added ? added + ' joueur' + (added > 1 ? 's' : '') + ' inscrit' + (added > 1 ? 's' : '') + (tt.drawn ? ', placé' + (added > 1 ? 's' : '') + ' à la table la moins remplie.' : '.') : 'Aucun nouveau pseudo (déjà inscrits ?).';
    }
    else if (a === 'delP') { T().players.splice(+t.getAttribute('data-v'), 1); }
    else if (a === 'draw') { draw(); }
    else if (a === 'editFromT') { EDIT = true; save(); location.hash = '#minuteur'; return; }
    else if (a === 'findMic') { FIND.listening = true; FIND.msg = ''; U().render(); window.PA_VOICE.listen('Quel joueur ?', function (txt, err) { FIND.listening = false; if (txt === null) FIND.msg = err || 'La dictée n’est pas disponible sur cet appareil.'; else if (!txt) FIND.msg = 'Je n’ai rien entendu.'; else FIND.q = txt.replace(/^(élimine|elimine|éliminer|sortir|sort)\s+/i, '').trim(); U().render(); }); return; }
    else if (a === 'ko') { var tk = T(), pk = tk.players[+t.getAttribute('data-v')]; if (pk && !pk.out && (typeof confirm !== 'function' || confirm(pk.name + ' est éliminé(e) ?'))) { FIND.q = ''; var lft = alivePl().length; pk.out = true; pk.place = lft; pk.from = 'table ' + pk.table + ' siège ' + pk.seat; pk.table = null; var mv = rebalance(); tk.msg = pk.name + ' sort à la ' + lft + 'e place.' + (mv.length ? '<br>' + mv.join('<br>') : '') + (alivePl().length === 1 ? '<br><b>' + alivePl()[0].name + ' gagne le tournoi !</b>' : ''); } }
    else if (a === 'unko' || a === 'reentry') { var tu = T(), pu = tu.players[+t.getAttribute('data-v')]; if (pu && pu.out) { pu.out = false; pu.place = null; if (a === 'reentry') { tu.re++; pu.entries = (pu.entries || 1) + 1; } seatSomewhere(pu); tu.msg = pu.name + (a === 'reentry' ? ' fait une re-entry' : ' revient (élimination annulée)') + ' : table ' + pu.table + ', siège ' + pu.seat + '.'; } }
    else if (a === 'newT') { if (typeof confirm !== 'function' || confirm('Effacer les inscrits, les tables et les compteurs ?')) ST.t = null; }
    else if (a === 'print') { try { window.print(); } catch (e3) {} return; }
    else if (a === 'entPlus') { T().entrants++; T().left++; }
    else if (a === 'entMinus') { if (T().entrants > 0) { T().entrants--; T().left = Math.max(0, T().left - 1); } }
    else if (a === 'out') { if (T().left > 0) T().left--; }
    else if (a === 'undoOut') { if (T().left < T().entrants + T().re) T().left++; }
    else if (a === 'rePlus') { T().re++; if (!T().players.length) T().left++; }
    else if (a === 'reMinus') { if (T().re > 0) { T().re--; if (!T().players.length) T().left = Math.max(0, T().left - 1); } }
    else if (a === 'addPlus') T().add++;
    else if (a === 'addMinus') { if (T().add > 0) T().add--; }
    else if (a === 'reset') { if (typeof confirm === 'function' && (T().entrants || T().re || T().add) && confirm('Remettre aussi à zéro les joueurs, re-entries et add-ons ?')) ST.t = null; ST.idx = 0; ST.rem = L.length ? L[0].min * 60 : 0; ST.since = null; ST.shown = 0; awake(false); }
    else if (a === 'full') { try { var d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else d.requestFullscreen(); } catch (e2) {} return; }
    else if (a === 'edit') EDIT = true;
    else if (a === 'done') EDIT = false;
    else if (a === 'gen' || a === 'preview' || a === 'savestruct') {
      var v = function (id, d) { var el = document.getElementById(id); var x = el ? parseInt(el.value, 10) : NaN; return isNaN(x) ? d : x; };
      var g = function (id, d) { var el = document.getElementById(id); return el ? el.value : d; };
      var c0 = cfg();
      ST.cfg = { sb: Math.max(1, v('tmSb', c0.sb)), bb: Math.max(1, v('tmBb', c0.bb)), n: Math.max(1, Math.min(90, v('tmN', c0.n))), mins: Math.max(1, Math.min(120, v('tmMins', c0.mins))), speed: g('tmSpeed', c0.speed), ante: g('tmAnte', c0.ante), anteFrom: Math.max(1, v('tmAnteFrom', c0.anteFrom)), pauseEvery: Math.max(0, v('tmPEvery', c0.pauseEvery)), pauseMin: Math.max(1, v('tmPMin', c0.pauseMin)), chips: Math.max(0, v('tmChips', c0.chips)), reStack: Math.max(0, v('tmRe', c0.reStack)), addStack: Math.max(0, v('tmAdd', c0.addStack)) };
      if (ST.cfg.sb > ST.cfg.bb) ST.cfg.sb = Math.round(ST.cfg.bb / 2);
      ST.mins = ST.cfg.mins;
      ST.text = a === 'gen' ? generate(ST.cfg) : document.getElementById('tmText').value;
      if (a === 'savestruct') { var L2 = levels(); ST.idx = 0; ST.rem = L2.length ? L2[0].min * 60 : 0; ST.since = null; EDIT = false; awake(false); }
    }
    save(); keepScroll(function () { U().render(); });
  });
  document.addEventListener('change', function (e) { var id = e.target && e.target.id, k = { tnChips: 'chips', tnRe: 'reStack', tnAdd: 'addStack' }[id]; if (!k) return; ST.cfg = cfg(); ST.cfg[k] = Math.max(0, parseInt(e.target.value, 10) || 0); save(); U().render(); });
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'tnFind') { FIND.q = e.target.value; FIND.msg = ''; var r = document.getElementById('tnFound'); if (r) r.innerHTML = findHtml(); } });
  window.PA_TIMER = { view: view, tournoi: tournoiView, _levels: levels, _generate: generate };
})();
