/* Poker Academy — championnat du club : points par tournoi, primes sur le dernier vainqueur, classements hebdomadaire et annuel */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  var KEY = 'pa2league';
  var TYPES = { mercredi: { name: 'Tournoi du mercredi', short: 'Mercredi', mult: 1 }, deep: { name: 'Deep du vendredi', short: 'Deep', mult: 1.4 }, libre: { name: 'Hors championnat', short: 'Hors champ.', mult: 0 } };
  var BONUS = 2;
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.list) return d; } catch (e) {} return { list: [] }; }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function key(n) { return String(n || '').trim().toLowerCase(); }
  function f1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function dfr(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  // semaine ISO : « 2026-S45 »
  function week(iso) {
    var d = new Date(iso + 'T12:00:00'), day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day + 3);
    var y = d.getFullYear(), first = new Date(y, 0, 4), n = 1 + Math.round(((d - first) / 864e5 - 3 + ((first.getDay() + 6) % 7)) / 7);
    return y + '-S' + ('0' + n).slice(-2);
  }
  function weekLabel(w) {
    var y = +w.slice(0, 4), n = +w.slice(6), j4 = new Date(y, 0, 4), mon = new Date(j4); mon.setDate(j4.getDate() - ((j4.getDay() + 6) % 7) + (n - 1) * 7);
    var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    var f = function (d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); };
    return 'Semaine ' + n + ' (du ' + f(mon) + ' au ' + f(sun) + ')';
  }
  // tête mise à prix : vainqueur du dernier tournoi du même type, avant cette date
  function holder(type, date) {
    if (!TYPES[type] || type === 'libre') return null;
    var prev = load().list.filter(function (x) { return x.type === type && x.date < (date || today()); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
    return prev ? prev.winner : null;
  }
  function placePts(n, place, type) { return Math.round((n - place + 1) * TYPES[type].mult * 10) / 10; }
  // enregistre un tournoi terminé (état du tournoi du minuteur)
  function record(t) {
    var type = t.type || 'mercredi', date = t.date || today(), n = t.players.length, d = load();
    var winner = t.players.filter(function (x) { return !x.out; })[0];
    var rows = t.players.map(function (x) {
      var place = x.out ? x.place : 1, pts = placePts(n, place, type), bonus = x.bonus || 0;
      return { name: x.name, place: place, pts: pts, bonus: bonus, total: Math.round((pts + bonus) * 10) / 10, entries: x.entries || 1, koBy: x.koBy || null, koAt: x.koAt || null, koLevel: x.koLevel || null, bountyFrom: x.bountyFrom || null };
    }).sort(function (a, b) { return a.place - b.place; });
    var rec = { id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: date, type: type, n: n, re: t.re || 0, add: t.add || 0, winner: winner ? winner.name : null, holder: t.holder || null, rows: rows };
    d.list.push(rec); d.list.sort(function (a, b) { return a.date < b.date ? -1 : 1; }); save(d);
    return rec;
  }
  function years() { var y = {}; load().list.forEach(function (x) { y[x.date.slice(0, 4)] = 1; }); var a = Object.keys(y).sort().reverse(); return a.length ? a : [String(new Date().getFullYear())]; }
  function standings(list) {
    var m = {};
    list.forEach(function (tn) { if (tn.type === 'libre') return; tn.rows.forEach(function (r) {
      var k = key(r.name), o = m[k] = m[k] || { name: r.name, total: 0, pts: 0, mer: 0, deep: 0, bonus: 0, n: 0, wins: 0, best: 99, kos: 0 };
      o.total += r.total; o.pts += r.pts; if (tn.type === 'deep') o.deep += r.pts; else o.mer += r.pts; o.bonus += r.bonus; o.n++; if (r.place === 1) o.wins++; o.best = Math.min(o.best, r.place);
    }); tn.rows.forEach(function (r) { if (r.koBy && m[key(r.koBy)]) m[key(r.koBy)].kos++; }); });
    return Object.keys(m).map(function (k) { var o = m[k]; o.total = Math.round(o.total * 10) / 10; o.mer = Math.round(o.mer * 10) / 10; o.deep = Math.round(o.deep * 10) / 10; o.bonus = Math.round(o.bonus * 10) / 10; o.moy = o.n ? Math.round(o.total / o.n * 10) / 10 : 0; return o; }).sort(function (a, b) { return b.total - a.total || b.wins - a.wins || a.best - b.best; });
  }

  /* ---------- Vue ---------- */
  var V = { tab: 'annuel', year: null, week: null, open: null, msg: '' };
  function table(st, medals) {
    var ui = U();
    if (!st.length) return '<div class="small muted">Aucun tournoi du championnat sur cette période.</div>';
    var md = ['🥇', '🥈', '🥉'];
    return '<table class="tbl" style="font-size:.95em"><tr><th>#</th><th>Joueur</th><th>Points</th><th>Tournois</th><th>Moy.</th><th>Victoires</th><th>Primes</th></tr>' + st.map(function (o, i) {
      return '<tr' + (medals && i < 3 ? ' style="color:var(--gold);font-weight:700"' : '') + '><td>' + (medals && i < 3 ? md[i] : i + 1) + '</td><td>' + ui.esc(o.name) + '</td><td><b>' + f1(o.total) + '</b></td><td>' + o.n + '</td><td>' + f1(o.moy || 0) + '</td><td>' + (o.wins || '') + '</td><td>' + (o.bonus ? '+' + f1(o.bonus) : '') + '</td></tr>';
    }).join('') + '</table>';
  }
  // classement en barres : mercredi (or), deep (bronze), primes (rouge)
  function bars(st) {
    var ui = U(), max = Math.max.apply(null, st.map(function (o) { return o.total; }).concat([1]));
    return '<div class="lg-leg"><span><i style="background:var(--gold)"></i>Mercredi</span><span><i style="background:#9a6a18"></i>Deep ×1,4</span><span><i style="background:#e0464c"></i>Primes</span><span class="lg-legr">Total · moyenne</span></div><div>' +
      st.map(function (o, i) {
        var seg = function (v, c) { return v > 0 ? '<i style="width:' + (v / max * 100).toFixed(1) + '%;background:' + c + '"></i>' : ''; };
        return '<div class="lg-row' + (i < 3 ? ' lg-p' + (i + 1) : '') + '"><b class="lg-rk">' + (i + 1) + '</b><div class="lg-nm"><b>' + ui.esc(o.name) + '</b><small>' + o.n + ' t.' + (o.wins ? ' · ' + o.wins + ' vict.' : '') + (o.kos ? ' · ' + o.kos + ' élim.' : '') + '</small><div class="lg-bar">' + seg(o.mer, 'var(--gold)') + seg(o.deep, '#9a6a18') + seg(o.bonus, '#e0464c') + '</div></div><div class="lg-tot"><b>' + f1(o.total) + '</b><small>moy. ' + f1(o.moy || 0) + '</small></div></div>';
      }).join('') + '</div>';
  }
  function tnCard(tn) {
    var ui = U(), op = V.open === tn.id;
    var head = '<button class="card stack" data-lgact="open" data-v="' + tn.id + '" style="text-align:left;width:100%;cursor:pointer;color:var(--ink)"><div class="row" style="justify-content:space-between;gap:8px"><b>' + TYPES[tn.type].name + ' · ' + dfr(tn.date) + '</b><span class="small muted">' + tn.n + ' joueurs' + (tn.type === 'deep' ? ' · points ×1,4' : '') + '</span></div><div class="small">Vainqueur : <b style="color:var(--gold)">' + ui.esc(tn.winner || '—') + '</b>' + (tn.holder ? ' · tête mise à prix : ' + ui.esc(tn.holder) : '') + '</div></button>';
    if (!op) return head;
    return head + '<div class="card stack"><table class="tbl" style="font-size:.9em"><tr><th>Place</th><th>Joueur</th><th>Points</th><th>Sorti par</th><th>Heure · niveau</th></tr>' + tn.rows.map(function (r) {
      var h = r.koAt ? new Date(r.koAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
      return '<tr><td>' + r.place + '</td><td>' + ui.esc(r.name) + (r.entries > 1 ? ' <span class="small muted">(' + r.entries + ' entrées)</span>' : '') + '</td><td>' + f1(r.total) + (r.bonus ? ' <span class="small muted">(' + f1(r.pts) + ' + ' + f1(r.bonus) + ' prime)</span>' : '') + '</td><td>' + (r.koBy ? ui.esc(r.koBy) : (r.place === 1 ? 'vainqueur' : '')) + '</td><td>' + h + (r.koLevel ? ' · ' + r.koLevel : '') + '</td></tr>';
    }).join('') + '</table>' + (window.PA_EXPORT ? '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-lgact="xt" data-f="xlsx" data-v="' + tn.id + '" style="flex:1">Excel de ce tournoi</button><button class="btn" data-lgact="xt" data-f="pdf" data-v="' + tn.id + '" style="flex:1">PDF de ce tournoi</button></div>' : '') + '<button class="btn" data-lgact="del" data-v="' + tn.id + '">Supprimer ce tournoi du classement</button></div>';
  }
  function view() {
    var ui = U(), d = load(), ys = years(); V.year = V.year && ys.indexOf(V.year) >= 0 ? V.year : ys[0];
    var inY = d.list.filter(function (x) { return x.date.slice(0, 4) === V.year; });
    var out = '<div class="stack"><a class="back" href="#tournoi">‹ Tournoi du club</a><h1>Championnat du club</h1>' +
      ui.yo('Barème : le 1er marque autant de points qu’il y a de joueurs, le 2e un de moins… le dernier 1 point. Deep du vendredi : points ×1,4. Prime : celui qui élimine le vainqueur du tournoi précédent du même type (mercredi ou deep) gagne ' + BONUS + ' points. Les 3 premiers du classement annuel sont récompensés.') +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><div class="seg">' + [['annuel', 'Classement annuel'], ['semaine', 'Semaine par semaine'], ['tournois', 'Les tournois']].map(function (o) { return '<button class="' + (V.tab === o[0] ? 'on' : '') + '" data-lgact="tab" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      (ys.length > 1 ? '<div class="seg">' + ys.map(function (y) { return '<button class="' + (V.year === y ? 'on' : '') + '" data-lgact="year" data-v="' + y + '">' + y + '</button>'; }).join('') + '</div>' : '') + '</div>';
    if (V.tab === 'annuel') {
      var st = standings(inY), avgP = inY.length ? inY.reduce(function (a, x) { return a + x.n; }, 0) / inY.length : 0, prim = st.reduce(function (a, o) { return a + o.bonus; }, 0);
      if (inY.length) out += '<div class="lg-kpis"><div><span>Tournois</span><b>' + inY.length + '</b><small>' + inY.filter(function (x) { return x.type === 'mercredi'; }).length + ' mer. · ' + inY.filter(function (x) { return x.type === 'deep'; }).length + ' deep</small></div><div><span>Joueurs classés</span><b>' + st.length + '</b><small>au championnat</small></div><div><span>Moyenne de joueurs</span><b>' + f1(avgP) + '</b><small>par tournoi</small></div><div><span>Primes</span><b style="color:#e0464c">+' + f1(prim) + '</b><small>points</small></div></div>';
      out += '<div class="card stack"><b>Classement ' + V.year + '</b><div class="small muted">' + inY.filter(function (x) { return x.type !== 'libre'; }).length + ' tournois au championnat (' + inY.filter(function (x) { return x.type === 'mercredi'; }).length + ' mercredi(s), ' + inY.filter(function (x) { return x.type === 'deep'; }).length + ' deep(s)).</div>' +
        (st.length ? '<div class="lg-pod">' + [1, 0, 2].map(function (i) { var o = st[i]; if (!o) return '<div></div>'; return '<div class="lg-pod' + (i + 1) + '"><div class="lg-med">' + ['🥇', '🥈', '🥉'][i] + '</div><b>' + ui.esc(o.name) + '</b><span>' + f1(o.total) + ' pts</span><div class="lg-step">' + (i + 1) + '</div></div>'; }).join('') + '</div>' : '') +
        (st.length ? bars(st) : '<div class="small muted">Aucun tournoi du championnat sur cette période.</div>') + '</div>';
    } else if (V.tab === 'semaine') {
      var ws = {}; inY.forEach(function (x) { (ws[week(x.date)] = ws[week(x.date)] || []).push(x); });
      var wk = Object.keys(ws).sort().reverse();
      if (!wk.length) out += '<div class="card small muted">Aucun tournoi enregistré en ' + V.year + '.</div>';
      var cum = [];
      wk.slice().reverse().forEach(function (w) { cum = cum.concat(ws[w]); ws[w].cum = standings(cum); });
      out += wk.map(function (w) {
        var stw = standings(ws[w]), stc = ws[w].cum;
        return '<div class="card stack"><b>' + weekLabel(w) + '</b><div class="small muted">' + ws[w].map(function (x) { return TYPES[x.type].short + ' du ' + dfr(x.date) + ' : ' + ui.esc(x.winner || '—'); }).join(' · ') + '</div>' + table(stw, false) +
          '<details><summary class="small" style="cursor:pointer">Classement général après cette semaine</summary>' + table(stc.slice(0, 10), true) + '</details></div>';
      }).join('');
    } else {
      out += inY.length ? inY.slice().reverse().map(tnCard).join('') : '<div class="card small muted">Aucun tournoi enregistré en ' + V.year + '.</div>';
    }
    if (window.PA_EXPORT && d.list.length) out += '<div class="card stack"><b>Exporter ' + V.year + '</b><div class="small muted">Un seul fichier avec le classement annuel, le détail semaine par semaine et tous les tournois (qui a sorti qui, heure, niveau).</div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" data-lgact="xy" data-f="xlsx" style="flex:1">📊 Excel (.xlsx)</button><button class="btn gold" data-lgact="xy" data-f="pdf" style="flex:1">📄 PDF</button></div>' + (V.msg ? '<div class="small" style="color:var(--gold)">' + ui.esc(V.msg) + '</div>' : '') + '</div>';
    out += '<div class="small muted">Les tournois s’enregistrent depuis la page Tournoi du club, quand il ne reste qu’un joueur. Le championnat est inclus dans la sauvegarde Drive.</div></div>';
    return ui.shell('club', out);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-lgact]') : null; if (!t) return;
    var a = t.getAttribute('data-lgact'), v = t.getAttribute('data-v');
    function done(m) { V.msg = m; U().render(); }
    if (a === 'xy') { V.msg = ''; window.PA_EXPORT.year(V.year, t.getAttribute('data-f'), done); return; }
    if (a === 'xt') { V.msg = ''; window.PA_EXPORT.tournament(v, t.getAttribute('data-f'), done); return; }
    V.msg = ''; if (a === 'tab') V.tab = v; else if (a === 'year') V.year = v; else if (a === 'open') V.open = V.open === v ? null : v;
    else if (a === 'del') { if (typeof confirm === 'function' && !confirm('Supprimer ce tournoi du classement ?')) return; var d = load(); d.list = d.list.filter(function (x) { return x.id !== v; }); save(d); V.open = null; }
    U().render();
  });
  window.PA_LEAGUE = { TYPES: TYPES, BONUS: BONUS, holder: holder, record: record, standings: standings, week: week, weekLabel: weekLabel, load: load, today: today, view: view };
})();
