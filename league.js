/* Poker Academy — championnat du club : points par tournoi, primes sur le dernier vainqueur, classements hebdomadaire et annuel */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  var KEY = 'pa2league';
  var TYPES = { mercredi: { name: 'Tournoi du mercredi', short: 'Mercredi', mult: 1 }, deep: { name: 'Deep du vendredi', short: 'Deep', mult: 1.5 }, libre: { name: 'Hors championnat', short: 'Hors champ.', mult: 0 } };
  var BONUS = 2;
  // les joueurs du club depuis la rentrée (liste de départ, modifiable dans l'appli)
  var CLUB = ["MONPIERROT", "YO", "VILVOORD", "JR", "ENFANT2GUETTO", "ENFANT2FISH", "BASTOSS", "ENFANT2COEUR", "KAKTUSSE", "BANEEST", "VINCENT", "NARUTI", "GREG", "PALLIX", "POOLSHARKS", "SIM", "UNDERTAKER", "TA_1_PB", "JOHNY", "AIGLEFOUR", "JUJU", "MACHINEGUN"];
  function roster() { var d = load(); return (d.roster || CLUB).slice(); }
  function setRoster(list) { var d = load(), seen = {}; d.roster = list.map(function (x) { return String(x || '').trim().slice(0, 30); }).filter(function (x) { var k = x.toLowerCase(); if (!x || seen[k]) return false; seen[k] = 1; return true; }); d.rosterAt = Date.now(); save(d); return d.roster; }
  // les points se recalculent à chaque lecture avec le barème en vigueur (deep passé de ×1,4 à ×1,5)
  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.list) { d.list.forEach(function (tn) { if (!TYPES[tn.type]) return; tn.rows.forEach(function (r) { r.pts = placePts(tn.n, r.place, tn.type); r.total = Math.round((r.pts + (r.bonus || 0)) * 10) / 10; }); }); return d; } } catch (e) {}
    return { list: [] };
  }
  function saveRaw(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function save(d) { saveRaw(d); if (window.PA_CLUBSYNC) window.PA_CLUBSYNC.dirty(); }
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
      return { name: x.name, place: place, pts: pts, bonus: bonus, total: Math.round((pts + bonus) * 10) / 10, prize: ((t.payout || [])[place - 1] || {}).amt || null, entries: x.entries || 1, koBy: x.koBy || null, koAt: x.koAt || null, koLevel: x.koLevel || null, bountyFrom: x.bountyFrom || null };
    }).sort(function (a, b) { return a.place - b.place; });
    var rec = { prize: +t.prize || 0, id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: date, type: type, n: n, re: t.re || 0, add: t.add || 0, winner: winner ? winner.name : null, holder: t.holder || null, rows: rows };
    d.list.push(rec); d.list.sort(function (a, b) { return a.date < b.date ? -1 : 1; }); save(d);
    return rec;
  }
  function years() { var y = {}; load().list.forEach(function (x) { y[x.date.slice(0, 4)] = 1; }); var a = Object.keys(y).sort().reverse(); return a.length ? a : [String(new Date().getFullYear())]; }
  function standings(list) {
    var m = {};
    list.forEach(function (tn) { if (tn.type === 'libre') return; tn.rows.forEach(function (r) {
      var k = key(r.name), o = m[k] = m[k] || { name: r.name, total: 0, pts: 0, mer: 0, deep: 0, bonus: 0, n: 0, wins: 0, pod: 0, best: 99, kos: 0, places: 0 };
      o.total += r.total; o.pts += r.pts; if (tn.type === 'deep') o.deep += r.pts; else o.mer += r.pts; o.bonus += r.bonus; o.n++; if (r.place === 1) o.wins++; if (r.place <= 3) o.pod++; o.places += r.place / tn.n; o.best = Math.min(o.best, r.place);
    }); tn.rows.forEach(function (r) { if (r.koBy && m[key(r.koBy)]) m[key(r.koBy)].kos++; }); });
    return Object.keys(m).map(function (k) { var o = m[k]; o.total = Math.round(o.total * 10) / 10; o.mer = Math.round(o.mer * 10) / 10; o.deep = Math.round(o.deep * 10) / 10; o.bonus = Math.round(o.bonus * 10) / 10; o.moy = o.n ? Math.round(o.total / o.n * 10) / 10 : 0; return o; }).sort(function (a, b) { return b.total - a.total || b.wins - a.wins || a.best - b.best; });
  }

  /* ---------- Trophées de la saison ---------- */
  function trophies(list) {
    var st = standings(list), champ = list.filter(function (x) { return x.type !== 'libre'; }), nT = champ.length, out = [];
    if (!st.length) return out;
    function best(f, filt, fmtv, min) { var c = st.filter(filt || function () { return true; }).filter(function (o) { return f(o) > (min || 0); }).sort(function (a, b) { return f(b) - f(a) || b.total - a.total; }); return c[0] ? { who: c[0].name, val: fmtv ? fmtv(f(c[0]), c[0]) : f(c[0]), second: c[1] ? c[1].name : null } : null; }
    function add(k, t, ic, d, r) { if (r) out.push({ k: k, title: t, icon: ic, desc: d, who: r.who, val: r.val }); }
    add('champion', 'Champion du club', '🏆', 'Le plus de points sur la saison', { who: st[0].name, val: f1(st[0].total) + ' points' });
    add('bourreau', 'Le Bourreau', '🔪', 'Le plus de joueurs éliminés', best(function (o) { return o.kos; }, null, function (v) { return v + ' éliminations'; }));
    add('deep', 'Roi du deep', '🌊', 'Le plus de points au deep du vendredi', best(function (o) { return o.deep; }, null, function (v) { return f1(v) + ' points au deep'; }));
    var minN = Math.max(3, Math.ceil(nT * 0.3));
    add('moyenne', 'Meilleure moyenne', '🎯', 'Points par tournoi (au moins ' + minN + ' tournois)', best(function (o) { return o.moy; }, function (o) { return o.n >= minN; }, function (v) { return f1(v) + ' points par tournoi'; }));
    add('podiums', 'Abonné au podium', '🥇', 'Le plus de top 3', best(function (o) { return o.pod; }, null, function (v) { return v + ' podiums'; }));
    add('primes', 'Chasseur de primes', '💰', 'Le plus de points de prime', best(function (o) { return o.bonus; }, null, function (v) { return '+' + f1(v) + ' points de prime'; }));
    add('fidele', 'Le plus fidèle', '📅', 'Le plus de tournois joués', best(function (o) { return o.n + o.moy / 1000; }, null, function (v, o) { return o.n + ' tournois sur ' + nT; }));
    // la remontée : gain de places entre le premier tiers de la saison et la fin
    var ws = {}; champ.forEach(function (x) { (ws[week(x.date)] = ws[week(x.date)] || []).push(x); }); var wk = Object.keys(ws).sort();
    if (wk.length >= 3) {
      var cut = Math.ceil(wk.length / 3), early = [], rk = {}; wk.slice(0, cut).forEach(function (w) { early = early.concat(ws[w]); }); standings(early).forEach(function (o, i) { rk[key(o.name)] = i + 1; });
      add('remontee', 'La remontée de l’année', '🚀', 'Le plus de places gagnées depuis le début de saison', best(function (o) { var r0 = rk[key(o.name)]; return r0 ? r0 - (st.indexOf(o) + 1) : 0; }, null, function (v, o) { return 'de la ' + rk[key(o.name)] + 'e à la ' + (st.indexOf(o) + 1) + (st.indexOf(o) === 0 ? 're' : 'e') + ' place'; }));
    }
    return out;
  }
  function closedInfo(year) { var d = load(), c = (d.closed || {})[year]; return c && !c.open ? c : null; }
  function closeSeason(year) {
    var d = load(), list = d.list.filter(function (x) { return x.date.slice(0, 4) === year; }), st = standings(list);
    d.closed = d.closed || {}; d.closed[year] = { at: Date.now(), podium: st.slice(0, 3).map(function (o) { return { name: o.name, total: o.total }; }), trophies: trophies(list).map(function (t) { return { title: t.title, icon: t.icon, who: t.who, val: t.val }; }), n: list.length };
    save(d);
  }
  function palmares() {
    var d = load(), ys = years(), cur = String(new Date().getFullYear());
    return ys.map(function (y) { var c = (d.closed || {})[y]; if (c && !c.open) return { year: y, closed: true, podium: c.podium }; var st = standings(d.list.filter(function (x) { return x.date.slice(0, 4) === y; })); return { year: y, closed: false, current: y === cur, podium: st.slice(0, 3).map(function (o) { return { name: o.name, total: o.total }; }) }; }).filter(function (p) { return p.podium.length; });
  }

  /* ---------- Fiche d'un joueur ---------- */
  function playerData(name, year) {
    var k = key(name), list = load().list.filter(function (x) { return x.date.slice(0, 4) === year; }), st = standings(list), me = null, rank = 0;
    st.forEach(function (o, i) { if (key(o.name) === k) { me = o; rank = i + 1; } });
    var hist = [], by = {}, vic = {};
    list.forEach(function (tn) { tn.rows.forEach(function (r) {
      if (key(r.name) === k) { hist.push({ tn: tn, r: r }); if (r.koBy) by[r.koBy] = (by[r.koBy] || 0) + 1; }
      if (r.koBy && key(r.koBy) === k) vic[r.name] = (vic[r.name] || 0) + 1;
    }); });
    function top(m) { var ks = Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }); return ks[0] && m[ks[0]] > 0 ? { name: ks[0], n: m[ks[0]] } : null; }
    // courbe : points cumulés et rang après chaque semaine
    var ws = {}; list.forEach(function (x) { (ws[week(x.date)] = ws[week(x.date)] || []).push(x); }); var cum = [], curve = [];
    Object.keys(ws).sort().forEach(function (w) { cum = cum.concat(ws[w]); var g = standings(cum), pt = 0, rr = null; g.forEach(function (o, i) { if (key(o.name) === k) { pt = o.total; rr = i + 1; } }); curve.push({ w: w, pts: pt, rank: rr }); });
    return { me: me, rank: rank, of: st.length, hist: hist.reverse(), nemesis: top(by), victim: top(vic), curve: curve, troph: trophies(list).filter(function (t) { return key(t.who) === k; }) };
  }
  function curveSvg(c) {
    if (c.length < 2) return '';
    var W = 600, H = 170, P = 26, max = Math.max.apply(null, c.map(function (x) { return x.pts; }).concat([1]));
    var X = function (i) { return P + i / (c.length - 1) * (W - 2 * P); }, Y = function (v) { return H - P - v / max * (H - 2 * P); };
    var pts = c.map(function (x, i) { return X(i).toFixed(1) + ',' + Y(x.pts).toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto" role="img" aria-label="Points cumulés semaine après semaine">' +
      '<polyline points="' + X(0) + ',' + (H - P) + ' ' + pts + ' ' + X(c.length - 1) + ',' + (H - P) + '" fill="rgba(255,210,63,.12)" stroke="none"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="#ffd23f" stroke-width="3" stroke-linejoin="round"/>' +
      c.map(function (x, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(x.pts).toFixed(1) + '" r="4" fill="#ffd23f"/>' + (x.rank && (i === c.length - 1 || i % Math.ceil(c.length / 8) === 0) ? '<text x="' + X(i).toFixed(1) + '" y="' + (Y(x.pts) - 9).toFixed(1) + '" fill="#fff" font-size="13" text-anchor="middle">' + x.rank + (x.rank === 1 ? 'er' : 'e') + '</text>' : '') + '<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" fill="#999" font-size="11" text-anchor="middle">' + (i % Math.ceil(c.length / 8) === 0 || i === c.length - 1 ? 'S' + x.w.slice(6) : '') + '</text>'; }).join('') + '</svg>';
  }
  function playerView(name) {
    var ui = U(), D = playerData(name, V.year), o = D.me, esc = ui.esc;
    var out = '<div class="stack"><button class="back" data-lgact="pl" data-v="">‹ Championnat ' + V.year + '</button><h1>' + esc(name) + '</h1>';
    if (!o) return out + '<div class="card small muted">Aucun tournoi du championnat en ' + V.year + '.</div></div>';
    out += '<div class="lg-kpis"><div><span>Classement</span><b>' + D.rank + (D.rank === 1 ? 'er' : 'e') + '</b><small>sur ' + D.of + '</small></div><div><span>Points</span><b>' + f1(o.total) + '</b><small>' + f1(o.mer) + ' mer. · ' + f1(o.deep) + ' deep' + (o.bonus ? ' · +' + f1(o.bonus) + ' prime' : '') + '</small></div><div><span>Moyenne</span><b>' + f1(o.moy) + '</b><small>points par tournoi</small></div><div><span>Tournois</span><b>' + o.n + '</b><small>' + o.wins + ' victoire' + (o.wins > 1 ? 's' : '') + ' · ' + o.pod + ' podium' + (o.pod > 1 ? 's' : '') + '</small></div></div>';
    if (D.troph.length) out += '<div class="lg-troph-me">' + D.troph.map(function (t) { return '<span>' + t.icon + ' ' + t.title + '</span>'; }).join('') + '</div>';
    if (D.curve.length > 1) out += '<div class="card stack"><b>Sa saison</b><div class="small muted">Points cumulés semaine après semaine, avec son rang.</div>' + curveSvg(D.curve) + '</div>';
    out += '<div class="lg-duo"><div class="card"><span class="small muted">Sa bête noire</span><b>' + (D.nemesis ? esc(D.nemesis.name) : '—') + '</b><small>' + (D.nemesis ? 'l’a sorti ' + D.nemesis.n + ' fois' : 'personne ne l’a sorti deux fois') + '</small></div><div class="card"><span class="small muted">Sa victime préférée</span><b>' + (D.victim ? esc(D.victim.name) : '—') + '</b><small>' + (D.victim ? 'sortie ' + D.victim.n + ' fois' : '') + '</small></div></div>';
    out += '<div class="card stack"><b>Ses tournois · ' + o.kos + ' élimination' + (o.kos > 1 ? 's' : '') + ' faites</b><table class="tbl" style="font-size:.9em"><tr><th>Date</th><th>Tournoi</th><th>Place</th><th>Points</th><th>Sorti par</th></tr>' + D.hist.map(function (h) {
      var r = h.r; return '<tr' + (r.place <= 3 ? ' style="color:var(--gold);font-weight:700"' : '') + '><td>' + dfr(h.tn.date).slice(0, 5) + '</td><td>' + TYPES[h.tn.type].short + '</td><td style="white-space:nowrap">' + r.place + ' / ' + h.tn.n + '</td><td>' + (h.tn.type === 'libre' ? '—' : f1(r.total) + (r.bonus ? ' (prime)' : '')) + (r.prize ? ' · ' + r.prize + ' €' : '') + '</td><td>' + (r.koBy ? esc(r.koBy) : (r.place === 1 ? 'vainqueur' : '')) + '</td></tr>'; }).join('') + '</table></div></div>';
    return out;
  }

  /* ---------- Résumé texte (WhatsApp) ---------- */
  function summary(id) {
    var d = load(), tn = d.list.filter(function (x) { return x.id === id; })[0]; if (!tn) return '';
    var med = ['🥇', '🥈', '🥉'], ko = {}; tn.rows.forEach(function (r) { if (r.koBy) ko[r.koBy] = (ko[r.koBy] || 0) + 1; });
    var kk = Object.keys(ko).sort(function (a, b) { return ko[b] - ko[a]; })[0], times = tn.rows.map(function (r) { return r.koAt; }).filter(Boolean);
    var hmf = function (t) { return new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h '); };
    var dur = times.length > 1 ? Math.round((Math.max.apply(null, times) - Math.min.apply(null, times)) / 60000) : 0, last = tn.rows.filter(function (r) { return r.place === 2; })[0];
    var L = ['🏆 ' + TYPES[tn.type].name + ' · ' + dfr(tn.date), '👥 ' + tn.n + ' joueurs' + (tn.re ? ' · ' + tn.re + ' re-entry' : '') + (tn.add ? ' · ' + tn.add + ' add-on' : '') + (dur ? ' · ' + Math.floor(dur / 60) + ' h ' + ('0' + dur % 60).slice(-2) + ' de jeu' : '') + (tn.type === 'deep' ? ' · points ×1,5' : ''), ''];
    tn.rows.slice(0, 3).forEach(function (r, i) { L.push(med[i] + ' ' + r.name + (tn.type !== 'libre' ? ' — ' + f1(r.total) + ' pts' : '') + (r.prize ? ' (' + r.prize + ' €)' : '')); });
    var bo = tn.rows.filter(function (r) { return r.bonus; })[0], hd = tn.holder ? tn.rows.filter(function (r) { return key(r.name) === key(tn.holder); })[0] : null;
    L.push('');
    if (bo) L.push('💥 Prime : ' + bo.name + ' élimine ' + (bo.bountyFrom || tn.holder) + ' (+' + f1(bo.bonus) + ' pts)');
    else if (hd) L.push('🛡️ ' + hd.name + ', tête mise à prix, n’a pas été chassé' + (hd.place === 1 ? ' : il gagne encore !' : (hd.koBy ? '' : '')));
    if (kk && ko[kk] > 1) L.push('🔪 Le plus de sorties : ' + kk + ' (' + ko[kk] + ')');
    if (last && last.koAt) L.push('🏁 Dernière main à ' + hmf(last.koAt) + (last.koLevel ? ' (' + last.koLevel + ')' : ''));
    if (tn.type !== 'libre') { var st = standings(d.list.filter(function (x) { return x.date.slice(0, 4) === tn.date.slice(0, 4) && x.date <= tn.date; })); L.push('📊 Classement ' + tn.date.slice(0, 4) + ' : ' + st.slice(0, 5).map(function (o, i) { return (i + 1) + '. ' + o.name + ' ' + f1(o.total); }).join(' · ')); }
    L.push('', 'Merci à tous, et merci à Lionel ! ♠️♥️♦️♣️');
    return L.join('\n');
  }
  function shareText(txt, done) {
    try { if (window.PAAndroid && window.PAAndroid.shareText) { window.PAAndroid.shareText(txt); done('Choisis WhatsApp dans la liste.'); return; } } catch (e) {}
    try { if (navigator.share && !(window.PA_SYNC && window.PA_SYNC.isPC)) { navigator.share({ text: txt }).then(function () { done('Résumé partagé.'); }, function () {}); return; } } catch (e) {}
    try { navigator.clipboard.writeText(txt).then(function () { done('Résumé copié : colle-le dans WhatsApp.'); }, function () { done('Copie impossible : sélectionne le texte ci-dessous.'); }); } catch (e) { done('Copie impossible.'); }
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
    return '<div class="lg-leg"><span><i style="background:var(--gold)"></i>Mercredi</span><span><i style="background:#9a6a18"></i>Deep ×1,5</span><span><i style="background:#e0464c"></i>Primes</span><span class="lg-legr">Total · moyenne</span></div><div>' +
      st.map(function (o, i) {
        var seg = function (v, c) { return v > 0 ? '<i style="width:' + (v / max * 100).toFixed(1) + '%;background:' + c + '"></i>' : ''; };
        return '<div class="lg-row' + (i < 3 ? ' lg-p' + (i + 1) : '') + '" data-lgact="pl" data-v="' + ui.esc(o.name) + '" role="button" tabindex="0"><b class="lg-rk">' + (i + 1) + '</b><div class="lg-nm"><b>' + ui.esc(o.name) + '</b><small>' + o.n + ' t.' + (o.wins ? ' · ' + o.wins + ' vict.' : '') + (o.kos ? ' · ' + o.kos + ' élim.' : '') + '</small><div class="lg-bar">' + seg(o.mer, 'var(--gold)') + seg(o.deep, '#9a6a18') + seg(o.bonus, '#e0464c') + '</div></div><div class="lg-tot"><b>' + f1(o.total) + '</b><small>moy. ' + f1(o.moy || 0) + '</small></div></div>';
      }).join('') + '</div>';
  }
  function tnCard(tn) {
    var ui = U(), op = V.open === tn.id;
    var head = '<button class="card stack" data-lgact="open" data-v="' + tn.id + '" style="text-align:left;width:100%;cursor:pointer;color:var(--ink)"><div class="row" style="justify-content:space-between;gap:8px"><b>' + TYPES[tn.type].name + ' · ' + dfr(tn.date) + '</b><span class="small muted">' + tn.n + ' joueurs' + (tn.type === 'deep' ? ' · points ×1,5' : '') + '</span></div><div class="small">Vainqueur : <b style="color:var(--gold)">' + ui.esc(tn.winner || '—') + '</b>' + (tn.holder ? ' · tête mise à prix : ' + ui.esc(tn.holder) : '') + '</div></button>';
    if (!op) return head;
    return head + '<div class="card stack"><table class="tbl" style="font-size:.9em"><tr><th>Place</th><th>Joueur</th><th>Points</th><th>Sorti par</th><th>Heure · niveau</th></tr>' + tn.rows.map(function (r) {
      var h = r.koAt ? new Date(r.koAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
      return '<tr><td>' + r.place + '</td><td>' + ui.esc(r.name) + (r.entries > 1 ? ' <span class="small muted">(' + r.entries + ' entrées)</span>' : '') + '</td><td>' + f1(r.total) + (r.bonus ? ' <span class="small muted">(' + f1(r.pts) + ' + ' + f1(r.bonus) + ' prime)</span>' : '') + '</td><td>' + (r.koBy ? ui.esc(r.koBy) : (r.place === 1 ? 'vainqueur' : '')) + '</td><td>' + h + (r.koLevel ? ' · ' + r.koLevel : '') + '</td></tr>';
    }).join('') + '</table>' + (window.PA_EXPORT ? '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-lgact="xt" data-f="xlsx" data-v="' + tn.id + '" style="flex:1">Excel de ce tournoi</button><button class="btn" data-lgact="xt" data-f="pdf" data-v="' + tn.id + '" style="flex:1">PDF de ce tournoi</button></div>' : '') + '<button class="btn block" data-lgact="sum" data-v="' + tn.id + '">📝 Résumé texte pour WhatsApp</button>' + (V.sum === tn.id ? '<textarea class="tn-in" rows="9" readonly style="width:100%">' + ui.esc(summary(tn.id)) + '</textarea>' : '') + '<button class="btn" data-lgact="del" data-v="' + tn.id + '">Supprimer ce tournoi du classement</button></div>';
  }
  function view() {
    var ui = U(), d = load(), ys = years(); V.year = V.year && ys.indexOf(V.year) >= 0 ? V.year : ys[0];
    var inY = d.list.filter(function (x) { return x.date.slice(0, 4) === V.year; });
    if (V.pl) return ui.shell('club', playerView(V.pl));
    var out = '<div class="stack"><a class="back" href="#tournoi">‹ Tournoi du club</a><h1>Championnat du club</h1>' +
      ui.yo('Barème : le 1er marque autant de points qu’il y a de joueurs, le 2e un de moins… le dernier 1 point. Deep du vendredi : points ×1,5. Prime : celui qui élimine le vainqueur du tournoi précédent du même type (mercredi ou deep) gagne ' + BONUS + ' points. Les 3 premiers du classement annuel sont récompensés.') +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><div class="seg">' + [['annuel', 'Classement'], ['semaine', 'Semaines'], ['tournois', 'Tournois'], ['trophees', 'Trophées']].map(function (o) { return '<button class="' + (V.tab === o[0] ? 'on' : '') + '" data-lgact="tab" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
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
    } else if (V.tab === 'trophees') {
      var tr = trophies(inY), ci = closedInfo(V.year), pal = palmares();
      out += tr.length ? '<div class="lg-troph">' + tr.map(function (t) { return '<button class="lg-tc" data-lgact="pl" data-v="' + ui.esc(t.who) + '"><i>' + t.icon + '</i><span>' + t.title + '</span><b>' + ui.esc(t.who) + '</b><small>' + t.val + '</small></button>'; }).join('') + '</div>' : '<div class="card small muted">Les trophées apparaissent après les premiers tournois du championnat.</div>';
      if (window.PA_EXPORT && tr.length) out += '<button class="btn gold block" data-lgact="awards">📄 PDF de la remise des prix ' + V.year + '</button>';
      out += '<div class="card stack"><b>Saison ' + V.year + '</b>' + (ci ? '<div class="small">✅ Saison clôturée le ' + new Date(ci.at).toLocaleDateString('fr-FR') + ' : podium et trophées figés au palmarès.</div><button class="btn" data-lgact="reopen">Rouvrir la saison</button>' : '<div class="small muted">À la fin de l’année, clôture la saison : le podium et les trophées entrent au palmarès. Les tournois de janvier partent automatiquement dans la saison suivante.</div><button class="btn" data-lgact="close">🔒 Clôturer la saison ' + V.year + '</button>') + '</div>';
      if (pal.length) out += '<div class="card stack"><b>Palmarès du club</b>' + pal.map(function (p) { return '<div class="lg-pal"><b>' + p.year + '</b><span>' + p.podium.map(function (o, i) { return ['🥇', '🥈', '🥉'][i] + ' ' + ui.esc(o.name) + ' <small>' + f1(o.total) + '</small>'; }).join('  ') + '</span><em>' + (p.closed ? 'clôturée' : 'en cours') + '</em></div>'; }).join('') + '</div>';
    } else {
      out += inY.length ? inY.slice().reverse().map(tnCard).join('') : '<div class="card small muted">Aucun tournoi enregistré en ' + V.year + '.</div>';
    }
    if (window.PA_EXPORT && d.list.length) out += '<div class="card stack"><b>Exporter ' + V.year + '</b><div class="small muted">Un seul fichier avec le classement annuel, le détail semaine par semaine et tous les tournois (qui a sorti qui, heure, niveau).</div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" data-lgact="xy" data-f="xlsx" style="flex:1">📊 Excel (.xlsx)</button><button class="btn gold" data-lgact="xy" data-f="pdf" style="flex:1">📄 PDF</button></div><button class="btn block" data-lgact="img">🖼️ Image du classement pour WhatsApp</button>' + (V.msg ? '<div class="small" style="color:var(--gold)">' + ui.esc(V.msg) + '</div>' : '') + '</div>';
    if (window.PA_CLUBSYNC) out += window.PA_CLUBSYNC.card();
    out += '<div class="small muted">Les tournois s’enregistrent depuis la page Tournoi du club, quand il ne reste qu’un joueur. Le championnat est inclus dans la sauvegarde Drive.</div></div>';
    return ui.shell('club', out);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-lgact]') : null; if (!t) return;
    var a = t.getAttribute('data-lgact'), v = t.getAttribute('data-v');
    function done(m) { V.msg = m; U().render(); }
    if (a === 'sum') { V.sum = V.sum === v ? null : v; if (V.sum) shareText(summary(v), done); else U().render(); return; }
    if (a === 'pl') { V.pl = v || null; U().render(); window.scrollTo(0, 0); return; }
    if (a === 'awards') { V.msg = ''; window.PA_EXPORT.awards(V.year, done); return; }
    if (a === 'close') { if (typeof confirm === 'function' && !confirm('Clôturer la saison ' + V.year + ' ? Le podium et les trophées entrent au palmarès.')) return; closeSeason(V.year); U().render(); return; }
    if (a === 'reopen') { var dd = load(); dd.closed = dd.closed || {}; dd.closed[V.year] = { open: true, at: Date.now() }; save(dd); U().render(); return; }
    if (a === 'img') { V.msg = ''; window.PA_EXPORT.image(V.year, done); return; }
    if (a === 'xy') { V.msg = ''; window.PA_EXPORT.year(V.year, t.getAttribute('data-f'), done); return; }
    if (a === 'xt') { V.msg = ''; window.PA_EXPORT.tournament(v, t.getAttribute('data-f'), done); return; }
    V.msg = ''; if (a === 'tab') V.tab = v; else if (a === 'year') V.year = v; else if (a === 'open') V.open = V.open === v ? null : v;
    else if (a === 'del') { if (typeof confirm === 'function' && !confirm('Supprimer ce tournoi du classement ?')) return; var d = load(); d.list = d.list.filter(function (x) { return x.id !== v; }); d.deleted = (d.deleted || []).concat([v]); save(d); V.open = null; }
    U().render();
  });
  window.PA_LEAGUE = { saveRaw: saveRaw, roster: roster, setRoster: setRoster, openPlayer: function (n) { V.pl = n; V.year = String(new Date().getFullYear()); if (years().indexOf(V.year) < 0) V.year = years()[0]; if (location.hash === '#classement') U().render(); else location.hash = '#classement'; }, trophies: trophies, palmares: palmares, summary: summary, shareText: shareText, closedInfo: closedInfo, playerData: playerData, years: years, TYPES: TYPES, BONUS: BONUS, holder: holder, record: record, standings: standings, week: week, weekLabel: weekLabel, load: load, today: today, view: view };
})();
