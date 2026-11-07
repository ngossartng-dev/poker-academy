/* Poker Academy v2.0 — Minuteur de niveaux pour le club (grand écran) */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  var KEY = 'pa2timer';
  var DEF = ['25/50', '50/100', '75/150', '100/200 bbante 200', '150/300 bbante 300', 'pause 10', '200/400 bbante 400', '300/600 bbante 600', '400/800 bbante 800', '500/1000 bbante 1000', 'pause 10', '600/1200 bbante 1200', '800/1600 bbante 1600', '1000/2000 bbante 2000', '1500/3000 bbante 3000', '2000/4000 bbante 4000'].join('\n');
  var ST = load(), EDIT = false, lock = null, lastBeep = -1;
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.text) return s; } catch (e) {} return { text: DEF, mins: 20, idx: 0, rem: 20 * 60, since: null }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
  /* ---------- Sauvegarde automatique du tournoi en cours (toutes les 3 minutes) ----------
     Copies horodatées gardées à part (clé pa2tbak, 20 dernières) : en cas de plantage, de fausse manœuvre
     (« Nouveau tournoi », remise à zéro…) ou de données abîmées, on repart de la dernière copie.
     Sur PC, la dernière copie est aussi écrite dans le dossier Sauvegardes du Drive. */
  var BKEY = 'pa2tbak', BEVERY = 3 * 60 * 1000, BMAX = 20, lastSig = null;
  function baks() { try { var a = JSON.parse(localStorage.getItem(BKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function hasT(st) { var t = st && st.t; return !!(t && ((t.players && t.players.length) || t.entrants)); }
  function bakNow(force) {
    if (!hasT(ST)) return false;
    var s = live(), snap = JSON.parse(JSON.stringify(ST));
    snap.idx = s.idx; snap.rem = Math.round(s.rem); snap.wasRunning = !!ST.since; snap.since = null; // horloge figée à l'instant de la copie
    var sig = JSON.stringify(ST.t) + '|' + s.idx;
    if (!force && sig === lastSig) { touchBak(); return false; }
    lastSig = sig;
    var t = T(), a = baks();
    a.unshift({ at: Date.now(), left: t.left, entrants: t.entrants, lvl: s.idx, st: snap });
    a = a.slice(0, BMAX);
    for (var k = 0; k < 3; k++) { try { localStorage.setItem(BKEY, JSON.stringify(a)); break; } catch (e) { a = a.slice(0, Math.max(3, a.length >> 1)); } }
    if (IS_PC_APP()) try { fetch('/api/tournoibak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app: 'Poker Academy', kind: 'tournoi', savedAt: Date.now(), st: snap }) }).catch(function () {}); } catch (e) {}
    return true;
  }
  function touchBak() { try { localStorage.setItem(BKEY + 'chk', String(Date.now())); } catch (e) {} }
  function IS_PC_APP() { return location.hostname === '127.0.0.1' && (location.port === '47816' || location.port === '47826'); }
  // PC : si l'appli a été réinstallée ou ses données effacées, on récupère la copie du Drive
  setTimeout(function () {
    if (!IS_PC_APP() || hasT(ST) || baks().length) return;
    fetch('/api/tournoibak', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.st || !j.savedAt || Date.now() - j.savedAt > 24 * 3600e3 || hasT(ST) || baks().length) return;
      var t = j.st.t || {}, pl = t.players || [];
      try { localStorage.setItem(BKEY, JSON.stringify([{ at: j.savedAt, left: pl.length ? pl.filter(function (x) { return !x.out; }).length : t.left, entrants: pl.length || t.entrants, lvl: j.st.idx || 0, st: j.st }])); } catch (e) {}
      if (U() && /^#tournoi/.test(location.hash)) U().render();
    }).catch(function () {});
  }, 2000);
  setInterval(function () { var a = baks(); if (!a.length || Date.now() - a[0].at >= BEVERY) bakNow(false); }, 30000);
  // copie aussi quand l'appli passe en arrière-plan (écran éteint, autre appli ouverte) : c'est souvent là qu'Android ferme une appli
  document.addEventListener('visibilitychange', function () { if (document.hidden) bakNow(false); });
  function restoreBak(i) {
    var b = baks()[i]; if (!b) return false;
    bakNow(true); // l'état actuel est gardé avant d'être remplacé
    ST = JSON.parse(JSON.stringify(b.st)); delete ST.wasRunning; ST.since = null; save(); lastSig = null; return true;
  }
  function ago(ms) { var m = Math.round((Date.now() - ms) / 60000); return m < 1 ? 'à l’instant' : m < 60 ? 'il y a ' + m + ' min' : 'il y a ' + Math.floor(m / 60) + ' h ' + (m % 60 < 10 ? '0' : '') + (m % 60); }
  function hhmm(ms) { var d = new Date(ms); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  function bakCard() {
    var a = baks(), t = T(), esc = U().esc, out = '';
    var chk = 0; try { chk = +localStorage.getItem(BKEY + 'chk') || 0; } catch (e) {}
    // tournoi vide alors qu'une copie récente existe : on propose de le reprendre
    if (!hasT(ST) && a.length && Date.now() - a[0].at < 24 * 3600e3) {
      var b0 = a[0], L0 = levels()[b0.lvl];
      out += '<div class="card stack tn-bak tn-bak-alert"><b>💾 Un tournoi interrompu a été sauvegardé</b><div>' + hhmm(b0.at) + ' (' + ago(b0.at) + ') · ' + b0.left + ' joueur' + (b0.left > 1 ? 's' : '') + ' en jeu sur ' + b0.entrants + (L0 ? ' · ' + (L0.pause ? 'pause' : 'niveau ' + L0.n) : '') + '</div><button class="btn gold" data-tmact="bakRestore" data-v="0">Reprendre ce tournoi</button><div class="small muted">Le chrono repart en pause, au temps qu’il restait au moment de la copie.</div></div>';
      return out;
    }
    if (!hasT(ST)) return '';
    var last = a.length ? Math.max(a[0].at, chk) : 0;
    out += '<details class="card tn-bak"><summary style="cursor:pointer"><b>💾 Sauvegarde automatique</b> <span class="small muted">· ' + (last ? ago(last) : 'bientôt') + ' · toutes les 3 min</span></summary><div class="stack" style="gap:8px;margin-top:8px">' +
      '<div class="small muted">Joueurs en jeu et éliminés, places, tables, re-entries, add-ons, jetons en jeu, niveau et temps restant : tout est copié toutes les 3 minutes' + (IS_PC_APP() ? ', et la dernière copie est aussi écrite dans ton Drive (Poker Academy › Sauvegardes › tournoi-en-cours.json)' : '') + '. Si l’appli plante, rouvre-la : le tournoi est là. En cas de fausse manœuvre, reprends une copie ci-dessous.</div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-tmact="bakNow">Sauvegarder maintenant</button>' + (window.PA_GUIDE ? window.PA_GUIDE.link('sauvetournoi') : '') + '</div>';
    if (a.length) out += '<div class="stack" style="gap:6px">' + a.map(function (b, i) { var Lb = levels()[b.lvl]; return '<div class="row" style="justify-content:space-between;gap:8px;align-items:center;flex-wrap:nowrap;border-top:1px solid var(--line);padding-top:6px"><span style="flex:1;min-width:0">' + hhmm(b.at) + ' · ' + b.left + ' / ' + b.entrants + ' en jeu' + (Lb ? ' · ' + (Lb.pause ? 'pause' : 'niv. ' + Lb.n) : '') + '</span><button class="btn" data-tmact="bakRestore" data-v="' + i + '" style="min-height:36px;padding:4px 12px;flex:none">Reprendre</button></div>'; }).join('') + '</div>';
    return out + '</div></details>';
  }
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
  var CFG0 = { sb: 50, bb: 100, n: 18, mins: 20, speed: 'normale', ante: 'bb', anteFrom: 4, pauseEvery: 5, pauseMin: 10, chips: 20000, reStack: 0, addStack: 0, reEnd: 0, addPause: 0, colorUp: '' };
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
  // habitués : joueurs déjà passés au championnat (les plus fidèles d'abord) et adversaires notés
  function regulars() {
    var m = {}, LG = window.PA_LEAGUE;
    if (LG) LG.load().list.forEach(function (tn) { tn.rows.forEach(function (r) { var k = r.name.toLowerCase(); m[k] = m[k] || { name: r.name, n: 0, last: '' }; m[k].n++; if (tn.date >= m[k].last) { m[k].last = tn.date; m[k].name = r.name; } }); });
    if (LG && LG.roster) LG.roster().forEach(function (nm) { var k = nm.toLowerCase(); if (!m[k]) m[k] = { name: nm, n: 0, last: '' }; m[k].club = true; });
    ((window.PA.player() || {}).opps || []).forEach(function (o) { var k = String(o.name || '').toLowerCase(); if (k && !m[k]) m[k] = { name: o.name, n: 0, last: '' }; });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.n - a.n || (a.last === b.last ? 0 : a.last < b.last ? 1 : -1) || a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }); });
  }
  function inT(nm) { return T().players.some(function (x) { return x.name.toLowerCase() === String(nm).toLowerCase(); }); }
  function addOne(nm) { var tt = T(); nm = String(nm || '').trim(); if (!nm || inT(nm)) return false; var pl = { name: nm.slice(0, 30), out: false, entries: 1 }; var sn2 = tt.drawn ? snap() : null; tt.players.push(pl); if (tt.drawn) { seatSomewhere(pl); noteMoves(sn2, 'inscription tardive'); } return true; }
  function alivePl() { return T().players.filter(function (x) { return !x.out; }); }
  /* ---------- Modifier les blindes du niveau en cours (toucher les blindes sur la page du tournoi) ---------- */
  var BLED = false, BL_KIND = null;
  function lineOfLevel(idx) {
    var lines = ST.text.split(/\n/), n = -1;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].trim().toLowerCase(); if (!l) continue;
      if (/^pause\s*(\d+)?/.test(l) || /^(\d[\d\s.]*?)\s*\/\s*(\d[\d\s.]*?)(?:\s*(bbante|bb ante|ante|a)\s*(\d[\d\s.]*?))?(?:\s+(\d+)\s*min)?\s*$/.test(l)) { n++; if (n === idx) return i; }
    }
    return -1;
  }
  function setLevel(idx, sb, bb, ante, bbAnte, min) {
    var lines = ST.text.split(/\n/), i = lineOfLevel(idx); if (i < 0) return false;
    var L = levels()[idx]; if (!L || L.pause) return false;
    lines[i] = sb + '/' + bb + (ante > 0 ? (bbAnte ? ' bbante ' : ' ante ') + ante : '') + (min && min !== ST.mins ? ' ' + min + ' min' : '');
    ST.text = lines.join('\n'); ST.structAt = Date.now(); if (window.PA_CLUBSYNC) setTimeout(window.PA_CLUBSYNC.dirty, 0);
    return true;
  }
  function blEditor(s) {
    var l = s.L[s.idx], inp = function (id, v, lab) { return '<label class="tn-bl-f"><span>' + lab + '</span><input id="' + id + '" type="number" inputmode="numeric" min="0" value="' + v + '" class="tn-in"></label>'; };
    return '<div class="tn-bl-ed"><div class="tn-bl-t">Niveau ' + l.n + ' : modifier les blindes</div><div class="tn-bl-g">' + inp('blSb', l.sb, 'Petite blinde') + inp('blBb', l.bb, 'Grosse blinde') + inp('blAn', l.ante || 0, 'Ante (0 = aucune)') + inp('blMin', l.min, 'Durée (min)') + '</div>' +
      '<div class="seg"><button class="' + (l.bbAnte || !l.ante ? 'on' : '') + '" data-tmact="blAnteKind" data-v="bb">Ante de grosse blinde</button><button class="' + (!l.bbAnte && l.ante ? 'on' : '') + '" data-tmact="blAnteKind" data-v="cl">Ante classique</button></div>' +
      '<div class="row" style="gap:8px;justify-content:center"><button class="btn gold" data-tmact="blSave">Valider</button><button class="btn" data-tmact="blCancel">Annuler</button></div><div class="small muted">Seul ce niveau change ; le chrono continue. Pour toute la structure : Réglages › Structure.</div></div>';
  }
  /* ---------- Diffuser sur la télé ---------- */
  function canCast() { return !!(window.PAAndroid && window.PAAndroid.cast) || IS_PC_APP(); }
  function doCast() {
    if (window.PAAndroid && window.PAAndroid.cast) { try { window.PAAndroid.cast(); } catch (e) {} return; }
    if (IS_PC_APP()) fetch('/api/cast', { method: 'POST' }).catch(function () {});
  }
  /* ---------- Liste des places (sans imprimante) ---------- */
  var SEATS = false;
  function seatList() { return alivePl().filter(function (x) { return x.table; }).slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }); }); }
  function seatText() {
    var t = T(), L = seatList();
    return '🃏 Placement' + (t.date ? ' du ' + t.date.split('-').reverse().join('/') : '') + '\n' + L.map(function (x) { return x.name + ' : table ' + x.table + ', siège ' + x.seat; }).join('\n');
  }
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
    t.drawn = true; t.finalSaid = nt === 1; t.pending = []; t.closed = []; t.msg = 'Tirage fait : ' + n + ' joueurs sur ' + nt + ' table' + (nt > 1 ? 's' : '') + ' de ' + t.size + ' places maximum.';
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
  var FIND = { q: '', listening: false, msg: '' }, KO = null, MSHEET = false;
  // changements de place : on compare les places avant et après, pour lister clairement qui doit bouger
  function snap() { var o = {}; alivePl().forEach(function (x) { o[x.name] = [x.table, x.seat]; }); return o; }
  function noteMoves(before, why) {
    var t = T(), after = snap(), list = [], tbBefore = {}, tbAfter = {};
    Object.keys(before).forEach(function (n) { if (before[n][0]) tbBefore[before[n][0]] = 1; });
    Object.keys(after).forEach(function (n) { if (after[n][0]) tbAfter[after[n][0]] = 1; });
    Object.keys(after).forEach(function (n) { var a = after[n], b = before[n]; if (!a[0]) return; if (!b || !b[0]) list.push({ name: n, ft: null, fs: null, tt: a[0], ts: a[1], why: why || 'arrivée' }); else if (b[0] !== a[0] || b[1] !== a[1]) list.push({ name: n, ft: b[0], fs: b[1], tt: a[0], ts: a[1], why: why || 'équilibrage' }); });
    var closed = Object.keys(tbBefore).filter(function (k) { return !tbAfter[k]; }).map(Number);
    if (!list.length) return 0;
    var at = Date.now();
    list.forEach(function (m) { m.at = at; if (closed.indexOf(m.ft) >= 0) m.why = 'fermeture de la table ' + m.ft; });
    list.sort(function (a, b) { return a.tt - b.tt || a.ts - b.ts; });
    t.pending = (t.pending || []).filter(function (m) { return !list.some(function (x) { return x.name === m.name; }); }).concat(list);
    t.closed = (t.closed || []).concat(closed);
    t.moveLog = (t.moveLog || []).concat(list);
    MSHEET = true; try { beep(2); } catch (e) {}
    return list.length;
  }
  function movesHtml(inSheet) {
    var ui = U(), t = T(), P = t.pending || []; if (!P.length) return '';
    var cl = (t.closed || []).filter(function (x, i, a) { return a.indexOf(x) === i; });
    return '<div class="card stack tn-moves"><b style="font-size:1.15em">⚠ ' + P.length + ' changement' + (P.length > 1 ? 's' : '') + ' de place</b>' +
      (cl.length ? '<div class="tn-closed">Table' + (cl.length > 1 ? 's' : '') + ' ' + cl.join(', ') + ' fermée' + (cl.length > 1 ? 's' : '') + '</div>' : '') +
      P.map(function (m) { return '<div class="tn-mv"><b>' + ui.esc(m.name) + '</b><span>' + (m.ft ? 'T' + m.ft + ' · S' + m.fs : 'nouveau') + '</span><em>→</em><span class="tn-to">Table ' + m.tt + ' · siège ' + m.ts + '</span></div>'; }).join('') +
      '<div class="row" style="gap:8px"><button class="btn gold" data-tmact="movesDone" style="flex:1">Fait, les joueurs sont installés</button>' + (inSheet ? '<button class="btn" data-tmact="movesLater">Plus tard</button>' : '') + '</div></div>';
  }
  function lvlNow() { var s = live(), l = s.L[s.idx]; if (!l) return ''; return l.pause ? 'pendant la pause' : 'niveau ' + l.n + ' (' + fmt(l.sb) + ' / ' + fmt(l.bb) + ')'; }
  function koPanel() {
    var ui = U(), t = T(), pk = t.players[KO]; if (!pk || pk.out) return '';
    var others = alivePl().filter(function (x) { return x !== pk; }).sort(function (a, b) { return (a.table || 0) - (b.table || 0) || a.name.localeCompare(b.name, 'fr'); });
    var same = others.filter(function (x) { return x.table === pk.table; });
    return '<div class="card stack" style="border-color:var(--gold)"><b style="font-size:1.2em">Élimination de ' + ui.esc(pk.name) + '</b>' +
      (t.holder && pk.name.toLowerCase() === t.holder.toLowerCase() ? '<div style="color:var(--gold)">C’est la tête mise à prix : son éliminateur gagne ' + (window.PA_LEAGUE ? window.PA_LEAGUE.BONUS : 2) + ' points.</div>' : '') +
      '<div class="small muted">Table ' + pk.table + ', siège ' + pk.seat + ' · ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' · ' + lvlNow() + '</div>' +
      '<label class="small muted" for="koBy">Qui l’a éliminé ?</label><select id="koBy" style="min-height:48px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit;font-size:1.1em">' +
      (same.length ? '<optgroup label="Sa table">' + same.map(function (x) { return '<option value="' + t.players.indexOf(x) + '">' + ui.esc(x.name) + '</option>'; }).join('') + '</optgroup>' : '') +
      '<optgroup label="Les autres tables">' + others.filter(function (x) { return x.table !== pk.table; }).map(function (x) { return '<option value="' + t.players.indexOf(x) + '">' + ui.esc(x.name) + ' (table ' + x.table + ')</option>'; }).join('') + '</optgroup><option value="">Je ne sais pas</option></select>' +
      '<div class="row" style="gap:8px"><button class="btn gold" data-tmact="koOk" style="flex:1">Valider l’élimination</button><button class="btn" data-tmact="koCancel">Annuler</button></div></div>';
  }
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
  var TAB = null, ROSTER = false;
  function clearSheet() { try { document.querySelectorAll('body > .tn-sheet, body > .tn-sheet-bg').forEach(function (el) { el.parentNode.removeChild(el); }); } catch (e) {} }
  window.addEventListener('hashchange', function () { if (!/^#tournoi/.test(location.hash)) { KO = null; clearSheet(); } if (!/^#minuteur/.test(location.hash)) EDIT = false; });
  function tournoiView() {
    var ui = U(), t = T(), s = live(), c = cfg(), LG = window.PA_LEAGUE, esc = ui.esc;
    if (LG) { t.type = t.type || 'mercredi'; t.date = t.date || LG.today(); t.holder = LG.holder(t.type, t.date); }
    var tab = TAB || (t.drawn ? 'tables' : 'joueurs');
    var typeName = LG ? { mercredi: 'Tournoi du mercredi', deep: 'Deep du vendredi', libre: 'Hors championnat' }[t.type] : 'Tournoi';
    var dateTxt = t.date ? t.date.split('-').reverse().join('/') : '';
    var out = '<div class="stack tn">';
    // ---- en-tête : la table de jeu, le minuteur ----
    var lv = s.L[s.idx], run = !!ST.since, chips = chipsInPlay(), avg = t.left > 0 ? chips / t.left : 0, bb = curBB(s);
    out += '<div class="tn-hero">' +
      '<div class="tn-top"><button class="tn-ghost" data-act="nav" data-v="home" aria-label="Accueil">‹</button><div class="tn-title"><span class="tn-badge tn-' + (t.type || 'mercredi') + '">' + (t.type === 'deep' ? 'Deep ×1,5' : t.type === 'libre' ? 'Hors championnat' : 'Championnat') + '</span><b>' + typeName + '</b><span>' + dateTxt + '</span></div><a class="tn-ghost" href="#classement" aria-label="Classement">🏆</a></div>';
    if (lv) {
      out += '<div class="tn-lvl">' + (lv.pause ? 'Pause' : 'Niveau ' + lv.n) + '</div>' + (BLED && !lv.pause ? blEditor(s) : (lv.pause ? '<div class="tn-blinds">Pause</div>' : '<button class="tn-blinds tn-bl-btn" data-tmact="blEdit" title="Toucher pour modifier les blindes">' + fmt(lv.sb) + ' / ' + fmt(lv.bb) + '<span class="tn-bl-pen">✏️</span></button>') + (lv.ante ? '<div class="tn-ante">' + anteTxt(lv) + '</div>' : '')) +
        '<div class="tn-clock" id="tmClock2">' + mmss(s.rem) + '</div><div class="tn-next">' + nextInfo(s) + '</div>' +
        '<div class="tn-ctrl"><button data-tmact="prev" aria-label="Niveau précédent">⏮</button><button data-tmact="minus">−1</button><button class="tn-play" data-tmact="toggle">' + (run ? '❚❚ Pause' : (ST.idx || ST.rem !== s.L[0].min * 60 ? '▶ Reprendre' : '▶ Lancer')) + '</button><button data-tmact="plus">+1</button><button data-tmact="next" aria-label="Niveau suivant">⏭</button></div>' +
        '<div class="tn-links"><a class="tn-big" href="#ecran">📺 Écran télé ›</a>' + (canCast() ? '<button class="tn-big tn-vb" data-tmact="cast">📡 Diffuser sur la télé</button>' : '') + '<a class="tn-big" href="#minuteur">Minuteur ›</a><a class="tn-big" href="#guide?g=soiree">❓ Aide</a><button class="tn-big tn-vb" data-tmact="voice">' + (vOn() ? '🔊 Voix' : '🔇 Voix') + '</button>' + (RM.on ? '<button class="tn-big tn-vb" data-tmact="tab" data-v="reglages">📱 Télécommande ' + RM.code + '</button>' : '') + '</div>';
    }
    out += '</div>';
    var bdg = lv ? rulesBadges(s) : [], pzl = prizeLine(t);
    if (bdg.length || pzl) out += '<div class="tn-rules">' + bdg.map(function (b) { return '<span class="' + (/fermées/.test(b) ? 'off' : '') + '">' + b + '</span>'; }).join('') + (pzl ? '<span class="pz">🎁 ' + pzl + '</span>' : '') + '</div>';
    // ---- chiffres clés ----
    out += '<div class="tn-stats"><div><span>Joueurs</span><b>' + t.left + '<small> / ' + (t.entrants + t.re) + '</small></b></div><div><span>Jetons en jeu</span><b>' + fmt(chips) + '</b></div><div><span>Tapis moyen</span><b>' + (avg ? fmt(Math.round(avg)) : '—') + '</b>' + (avg && bb ? '<small>' + Math.round(avg / bb) + ' BB</small>' : '') + '</div></div>';
    // ---- tête mise à prix ----
    if (LG && t.type !== 'libre' && t.holder) {
      var hIn = t.players.some(function (x) { return x.name.toLowerCase() === t.holder.toLowerCase() && !x.out; });
      out += '<div class="tn-wanted"><div class="tn-wanted-t">Tête mise à prix</div><div class="tn-wanted-n">' + esc(t.holder) + '</div><div class="tn-wanted-s">' + (hIn ? '+' + LG.BONUS + ' points pour qui l’élimine' : 'pas en jeu ce soir') + '</div></div>';
    }
    if (t.msg) out += '<div class="tn-msg">' + t.msg + '</div>';
    out += movesHtml(false);
    if (t.drawn && alivePl().length === 1 && t.players.length > 1 && LG) out += t.saved ? '<div class="tn-done">🏆 ' + esc(alivePl()[0].name) + ' gagne · tournoi enregistré</div>' + (window.PA_EXPORT ? '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" data-tmact="shareImg" style="flex:1">🖼️ Image du classement</button><button class="btn gold" data-tmact="shareSum" style="flex:1">📝 Résumé texte</button></div>' : '') : '<button class="btn gold block" data-tmact="saveLeague">🏆 ' + esc(alivePl()[0].name) + ' gagne · enregistrer au classement</button>';
    // ---- onglets ----
    out += '<div class="tn-tabs">' + [['tables', 'Tables'], ['joueurs', 'Joueurs'], ['reglages', 'Réglages']].map(function (o) { return '<button class="' + (tab === o[0] ? 'on' : '') + '" data-tmact="tab" data-v="' + o[0] + '">' + o[1] + (o[0] === 'joueurs' && t.players.length ? ' <small>' + t.players.length + '</small>' : '') + '</button>'; }).join('') + '</div>';
    if (tab === 'tables') {
      if (t.players.length) out += '<div class="tn-search"><input id="tnFind" type="search" autocomplete="off" placeholder="Trouver un joueur…" value="' + esc(FIND.q) + '">' + (window.PA_VOICE ? window.PA_VOICE.mic('data-tmact="findMic"', FIND.listening) : '') + '</div>' + (FIND.msg ? '<div class="small" style="color:var(--gold)">' + esc(FIND.msg) + '</div>' : '') + '<div id="tnFound" class="stack" style="gap:8px">' + (FIND.q ? findHtml() : '') + '</div>';
      if (!t.drawn) out += '<div class="tn-empty">' + (t.players.length ? '<b>' + t.players.length + ' inscrits</b><span>Les tables ne sont pas encore tirées.</span><button class="btn gold" data-tmact="draw">Tirer les tables et les sièges</button>' : '<b>Pas encore de joueurs</b><span>Inscris-les dans l’onglet Joueurs.</span><button class="btn gold" data-tmact="tab" data-v="joueurs">Inscrire les joueurs</button>') + '</div>';
      else {
        var tb = tablesOf(), ids = Object.keys(tb).map(Number).sort(function (a, b) { return a - b; });
        out += '<div class="small muted" style="text-align:center">Touche le joueur qui sort. Les tables s’équilibrent et se ferment toutes seules.</div><div class="tn-tables">' + ids.map(function (id) {
          var h = '<div class="tn-table"><div class="tn-felt"><b>Table ' + id + '</b><span>' + tb[id].length + ' / ' + t.size + '</span></div>';
          for (var st = 1; st <= t.size; st++) {
            var ang = Math.PI / 2 + (st - 1) * 2 * Math.PI / t.size, x = 50 + 37 * Math.cos(ang), y = 50 + 41 * Math.sin(ang);
            var pl = tb[id].filter(function (q) { return q.seat === st; })[0], dB = t.buttons && t.buttons[id] === st;
            var isH = pl && t.holder && pl.name.toLowerCase() === t.holder.toLowerCase(), isM = pl && (t.pending || []).some(function (m) { return m.name === pl.name; });
            h += '<div class="tn-seat" style="left:' + x + '%;top:' + y + '%">' + (pl ? '<button class="tn-p' + (isH ? ' tn-h' : '') + (isM ? ' tn-moved' : '') + '" data-tmact="ko" data-v="' + t.players.indexOf(pl) + '"><i>' + esc(pl.name.charAt(0).toUpperCase()) + '</i><span>' + esc(pl.name) + '</span></button>' : '<span class="tn-free">' + st + '</span>') + (dB && pl ? '<em class="tn-d">D</em>' : '') + '</div>';
          }
          return h + '</div>';
        }).join('') + '</div>';
        var SL = seatList();
        out += '<details class="card tn-seats"' + (SEATS ? ' open' : '') + '><summary data-tmact="seatsToggle" style="cursor:pointer"><b>📋 Liste des places</b> <span class="small muted">· ' + SL.length + ' joueurs, par ordre alphabétique</span></summary>' +
          '<div class="tn-seatlist">' + SL.map(function (x) { return '<div><span>' + esc(x.name) + '</span><b>Table ' + x.table + ' · siège ' + x.seat + '</b></div>'; }).join('') + '</div>' +
          '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn gold" data-tmact="seatsShare" style="flex:1">📤 Envoyer la liste (WhatsApp…)</button><button class="btn" data-tmact="seatsTv" style="flex:1">' + (t.seatsTv ? '📺 Retirer de l’écran télé' : '📺 Afficher sur l’écran télé') + '</button></div></details>' +
          '<button class="btn block" data-tmact="print">Imprimer le plan des tables</button>';
      }
    } else if (tab === 'joueurs') {
      out += '<div class="card stack"><b>Inscrire</b><textarea id="tnNames" rows="3" class="tn-in" placeholder="Un pseudo par ligne (ou séparés par des virgules)"></textarea><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" data-tmact="addNames" style="flex:1">Inscrire</button>' + ((window.PA.player() || {}).opps && window.PA.player().opps.length ? '<button class="btn" data-tmact="addOpps">Mes adversaires du club</button>' : '') + '</div>' +
        (t.players.length && !t.drawn ? '<button class="btn gold block" data-tmact="draw">Tirer les tables et les sièges</button>' : '') + '</div>';
      var regs = regulars();
      if (regs.length) out += '<div class="card stack"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>Les habitués · un toucher = présent</b>' + (window.PA_GUIDE ? window.PA_GUIDE.link('joueurs') : '') + '<span class="small muted">' + regs.filter(function (r) { return inT(r.name); }).length + ' / ' + regs.length + '</span></div><div class="tn-regs">' + regs.map(function (r, i) {
        var on = inT(r.name); return '<button class="tn-reg' + (on ? ' on' : '') + '" data-tmact="reg" data-v="' + i + '">' + (on ? '✓ ' : '') + esc(r.name) + (r.n ? '<small>' + r.n + '</small>' : '') + '</button>';
      }).join('') + '</div><div class="tn-newm"><input id="tnNewM" type="text" class="tn-in" maxlength="30" placeholder="Pseudo du nouveau membre" autocomplete="off"><button class="btn gold" data-tmact="addMember">＋ Ajouter au club</button></div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-tmact="regAll">Tout le club présent</button><button class="btn" data-tmact="rosterEdit">' + (ROSTER ? 'Fermer' : 'Modifier la liste du club') + '</button></div>' +
        (ROSTER && window.PA_LEAGUE ? '<div class="stack" style="gap:8px"><textarea id="tnRoster" rows="8" class="tn-in" style="width:100%">' + esc(window.PA_LEAGUE.roster().join('\n')) + '</textarea><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn gold" data-tmact="rosterSave" style="flex:1">Enregistrer la liste</button><label class="btn" style="flex:1;text-align:center;cursor:pointer">Importer un .txt<input id="tnRosterFile" type="file" accept=".txt,text/plain" style="display:none"></label></div><div class="small muted">Un pseudo par ligne. Les joueurs déjà venus au championnat restent proposés même s’ils ne sont plus dans la liste.</div></div>' : '') +
        '<div class="small muted">Le chiffre = tournois joués au championnat. ' + (t.drawn ? 'Tables tirées : un nouveau présent est placé à la table la moins remplie.' : 'Retouche un nom pour le retirer.') + '</div></div>';
      var inG = t.players.filter(function (x) { return !x.out; }).sort(function (a, b) { return (a.table || 99) - (b.table || 99) || (a.seat || 0) - (b.seat || 0); });
      var outL = t.players.filter(function (x) { return x.out; }).sort(function (a, b) { return a.place - b.place; });
      if (inG.length) out += '<div class="card stack"><b>En jeu · ' + inG.length + '</b>' + inG.map(function (x) { var i = t.players.indexOf(x); return '<div class="tn-row"><i>' + esc(x.name.charAt(0).toUpperCase()) + '</i><span><b>' + esc(x.name) + '</b><small>' + (x.table ? 'Table ' + x.table + ' · siège ' + x.seat : 'pas encore placé') + (x.entries > 1 ? ' · ' + x.entries + ' entrées' : '') + (x.bonus ? ' · prime +' + x.bonus : '') + '</small></span>' + (t.drawn ? '<button class="btn" data-tmact="ko" data-v="' + i + '">Sorti</button>' : '<button class="btn" data-tmact="delP" data-v="' + i + '" aria-label="Retirer">✕</button>') + '</div>'; }).join('') + '</div>';
      if (outL.length) out += '<div class="card stack"><b>Éliminés · ' + outL.length + '</b>' + outL.map(function (x) { var i = t.players.indexOf(x); return '<div class="tn-row tn-out"><i>' + x.place + '</i><span><b>' + esc(x.name) + '</b><small>' + (x.koBy ? 'par ' + esc(x.koBy) : '') + (x.koAt ? ' · ' + new Date(x.koAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '') + (x.koLevel ? ' · ' + x.koLevel : '') + '</small></span><button class="btn" data-tmact="reentry" data-v="' + i + '">Re-entry</button><button class="btn" data-tmact="unko" data-v="' + i + '" aria-label="Annuler">↺</button></div>'; }).join('') + '</div>';
      var ML = t.moveLog || [];
      if (ML.length) out += '<details class="card"><summary style="cursor:pointer"><b>Historique des déplacements · ' + ML.length + '</b></summary><div class="stack" style="gap:6px;margin-top:8px">' + ML.slice().reverse().map(function (m) { return '<div class="small">' + new Date(m.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' · <b>' + esc(m.name) + '</b> : ' + (m.ft ? 'table ' + m.ft + ' siège ' + m.fs : 'nouveau') + ' → table ' + m.tt + ' siège ' + m.ts + ' <span class="muted">(' + m.why + ')</span></div>'; }).join('') + '</div></details>';
      out += countersHtml();
    } else {
      var cin = function (id, v, lab) { return '<div class="tn-set"><span>' + lab + '</span><input id="' + id + '" type="number" inputmode="numeric" min="0" value="' + v + '" class="tn-in" style="width:130px"></div>'; };
      out += '<div class="card stack"><b>Le tournoi</b>' + (LG ? '<div class="seg">' + Object.keys(LG.TYPES).map(function (k) { return '<button class="' + (t.type === k ? 'on' : '') + '" data-tmact="ttype" data-v="' + k + '">' + LG.TYPES[k].short + (k === 'deep' ? ' ×1,5' : '') + '</button>'; }).join('') + '</div><div class="tn-set"><span>Date</span><input id="tnDate" type="date" value="' + t.date + '" class="tn-in"></div>' : '') +
        '<div class="small muted">Format des tables</div><div class="seg">' + [[6, '6-max'], [9, '9-max'], [10, '10 joueurs']].map(function (o) { return '<button class="' + (t.size === o[0] ? 'on' : '') + '" data-tmact="size" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
        (t.drawn ? '<button class="btn block" data-tmact="draw">Refaire le tirage des tables</button>' : '') + '</div>' +
        '<div class="card stack"><div class="row" style="justify-content:space-between;gap:8px"><b>La dotation</b>' + (window.PA_GUIDE ? window.PA_GUIDE.link('lots') : '') + '</div><div class="small muted">Valeur totale des lots (bons, lots…). Laisse 0 s’il n’y en a pas.</div>' + cin('tnPrize', t.prize || 0, 'Dotation (€)') + cin('tnPaid', t.paid || 0, 'Places récompensées (0 = auto : ' + paidAuto(t.players.length || t.entrants || 0) + ')') + (payout(t).length ? '<div class="tn-pay">' + payout(t).map(function (p) { return '<span><b>' + p.place + (p.place === 1 ? 'er' : 'e') + '</b>' + eur(p.amt) + '</span>'; }).join('') + '</div>' : '') + '</div>' +
        '<div class="card stack"><b>Re-entry, add-on, jetons</b><div class="small muted">Annoncés à la voix et affichés sur l’écran télé. 0 = pas de règle.</div>' + cin('tnReEnd', c.reEnd || 0, 'Re-entry jusqu’à la fin du niveau') + cin('tnAddP', c.addPause || 0, 'Add-on à la pause n°') +
        '<div class="tn-set"><span>Retrait des petits jetons</span><input id="tnColor" type="text" value="' + esc(c.colorUp || '') + '" placeholder="25 au niveau 8, 100 au niveau 14" class="tn-in" style="width:230px"></div></div>' +
        '<div class="card stack"><b>Les jetons</b>' + cin('tnChips', c.chips, 'Tapis de départ') + cin('tnRe', c.reStack, 'Re-entry (0 = départ)') + cin('tnAdd', c.addStack, 'Add-on (0 = départ)') + '</div>' +
        rmCard() + '<div class="card stack"><b>Les annonces</b><div class="small muted">La voix annonce chaque niveau, la dernière minute, les pauses, les éliminations, la prime et les changements de place.</div>' + voiceBtn() + '</div>' +
        '<div class="card stack"><b>Les niveaux</b><button class="btn block" data-tmact="editFromT">Structure : blindes, ante, durée, pauses</button><a class="btn block" href="#minuteur">Minuteur en grand écran</a></div>' +
        '<button class="btn block" data-tmact="newT">Nouveau tournoi (tout effacer)</button>';
    }
    out += bakCard();
    out += '</div>';
    // ---- élimination : panneau du bas ----
    // le panneau d’élimination est placé hors de la page (au-dessus de la barre de navigation)
    clearSheet();
    var sheet = KO !== null ? koPanel() : (MSHEET && (t.pending || []).length ? movesHtml(true) : '');
    if (sheet) setTimeout(function () { clearSheet(); var bg = document.createElement('div'); bg.className = 'tn-sheet-bg'; bg.setAttribute('data-tmact', KO !== null ? 'koCancel' : 'movesLater'); var sh = document.createElement('div'); sh.className = 'tn-sheet'; sh.innerHTML = sheet; document.body.appendChild(bg); document.body.appendChild(sh); }, 0);
    return ui.shell('club', out);
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
  // iPhone : le son et la voix ne marchent qu'après un premier toucher ; on les « déverrouille » au premier clic
  var ACTX = null, UNLOCK = false;
  function actx() { try { if (!ACTX) ACTX = new (window.AudioContext || window.webkitAudioContext)(); if (ACTX.state === 'suspended') ACTX.resume(); } catch (e) {} return ACTX; }
  document.addEventListener('click', function () { if (UNLOCK) return; UNLOCK = true; actx(); try { if (window.speechSynthesis && window.SpeechSynthesisUtterance) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {} }, true);
  function beep(n) {
    try {
      var ctx = actx(); if (!ctx) return;
      for (var i = 0; i < n; i++) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.4); o.start(ctx.currentTime + i * 0.4); o.stop(ctx.currentTime + i * 0.4 + 0.25); }
    } catch (e) {}
  }
  function awake(on) {
    try { if (window.PAAndroid) PAAndroid.keepAwake(on); } catch (e) {}
    try { if (on && navigator.wakeLock && !lock) navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {}); if (!on && lock) { lock.release(); lock = null; } } catch (e) {}
  }
  /* ---------- Lots et règles du tournoi ---------- */
  var PCT = { 1: [100], 2: [65, 35], 3: [50, 30, 20], 4: [45, 27, 17, 11], 5: [40, 25, 16, 11, 8], 6: [37, 23, 15, 11, 8, 6], 7: [35, 22, 14, 10, 8, 6, 5], 8: [33, 21, 13, 10, 8, 6, 5, 4], 9: [32, 20, 13, 9, 7, 6, 5, 4, 4] };
  function paidAuto(n) { return n < 4 ? 1 : Math.max(1, Math.min(9, Math.ceil(n * 0.15))); }
  // répartition : [{ place, amt }] ; arrondi à l'euro (au 5 € au-delà de 200 €), le reste va au 1er
  function payout(t) {
    t = t || T(); var prize = +t.prize || 0, n = t.players.length || t.entrants || 0; if (!prize || !n) return [];
    var k = Math.min(n, +t.paid || paidAuto(n)), pc = PCT[Math.min(9, k)], sum = pc.reduce(function (a, b) { return a + b; }, 0), step = prize >= 200 ? 5 : 1;
    var out = pc.slice(0, k).map(function (x, i) { return { place: i + 1, amt: Math.max(step, Math.floor(prize * x / sum / step) * step) }; });
    out[0].amt += prize - out.reduce(function (a, b) { return a + b.amt; }, 0);
    return out;
  }
  function eur(x) { return fmt(x) + ' €'; }
  function prizeLine(t) { var P = payout(t); return P.length ? 'Dotation ' + eur(t.prize) + ' · ' + P.length + ' place' + (P.length > 1 ? 's' : '') + ' : ' + P.map(function (p) { return eur(p.amt); }).join(' / ') : ''; }
  function colorUps() { var out = [], re = /(\d[\d\s]*)\s*(?:au\s+niveau|au\s+niv\.?|@|niv\.?|niveau)\s*(\d+)/gi, m; while ((m = re.exec(cfg().colorUp || ''))) out.push({ chip: +m[1].replace(/\s/g, ''), lvl: +m[2] }); return out; }
  function pauseNo(L, idx) { var k = 0; for (var i = 0; i <= idx; i++) if (L[i] && L[i].pause) k++; return k; }
  function nextPlay(L, idx) { for (var i = idx; i < L.length; i++) if (!L[i].pause) return L[i]; return null; }
  function reOpen(s) { var c = cfg(); if (!c.reEnd) return true; var l = s.L[s.idx]; if (!l) return true; var np = l.pause ? nextPlay(s.L, s.idx) : l; return !!np && np.n <= c.reEnd && !(l.pause && np.n > c.reEnd); }
  // texte à ajouter aux annonces quand on arrive sur le niveau idx (venant de prev)
  function rulesSay(L, prev, idx) {
    var c = cfg(), l = L[idx], pl = L[prev], out = [];
    if (c.reEnd && pl && !pl.pause && pl.n === c.reEnd) out.push('Fin des re-entry.');
    if (c.reEnd && pl && pl.pause && l && !l.pause && l.n === c.reEnd + 1 && !(L[prev - 1] && !L[prev - 1].pause && L[prev - 1].n === c.reEnd)) out.push('Fin des re-entry.');
    if (l && l.pause && c.addPause && pauseNo(L, idx) === c.addPause) out.push('C’est le moment de l’add-on : prenez-le maintenant.');
    var np = l && l.pause ? nextPlay(L, idx + 1) : l;
    colorUps().forEach(function (cu) { if (np && np.n === cu.lvl && (l.pause || !(pl && pl.pause))) out.push('Retrait des jetons de ' + cu.chip + ' : échangez-les maintenant.'); });
    return out.join(' ');
  }
  function rulesBadges(s) {
    var c = cfg(), l = s.L[s.idx], b = [];
    if (c.reEnd) b.push(reOpen(s) ? 'Re-entry jusqu’à la fin du niveau ' + c.reEnd : 'Re-entry fermées');
    if (l && l.pause && c.addPause && pauseNo(s.L, s.idx) === c.addPause) b.push('Add-on ouverts');
    var np = l && l.pause ? nextPlay(s.L, s.idx + 1) : l; colorUps().forEach(function (cu) { if (np && np.n === cu.lvl) b.push('Retrait des jetons de ' + fmt(cu.chip)); });
    return b;
  }
  // annonces vocales : voix du téléphone (Android) ou du navigateur / PC
  var sayN = 0;
  function vOn() { return ST.voice !== false; }
  function say(txt, force) {
    if (!vOn() && !force) return;
    try {
      if (window.PAAndroid && window.PAAndroid.ttsOk && window.PAAndroid.ttsOk()) { window.PAAndroid.speak(txt, 0.95, 1, 7700 + (sayN++ % 100)); return; }
      if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        var u = new SpeechSynthesisUtterance(txt), vs = speechSynthesis.getVoices().filter(function (x) { return /^fr/i.test(x.lang); });
        u.lang = 'fr-FR'; if (vs.length) u.voice = vs.filter(function (x) { return /fr-FR/i.test(x.lang); })[0] || vs[0]; u.rate = 0.95;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      }
    } catch (e) {}
  }
  function lvlSay(l) { return l.pause ? 'Pause de ' + l.min + ' minutes.' : 'Niveau ' + l.n + '. Blindes ' + l.sb + ', ' + l.bb + (l.ante ? (l.bbAnte ? '. Ante grosse blinde ' + l.ante : '. Ante ' + l.ante + ' par joueur') : '') + '.'; }
  function ordSay(n) { return n === 1 ? 'première' : n + 'e'; }
  function voiceBtn() { return '<button class="btn" data-tmact="voice">' + (vOn() ? '🔊 Annonces vocales : oui' : '🔇 Annonces vocales : non') + '</button>'; }
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
      '<div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px"><button class="btn" data-tmact="minus">− 1 min</button><button class="btn" data-tmact="plus">+ 1 min</button><a class="btn" href="#ecran">📺 Écran télé</a>' + voiceBtn() + '<button class="btn" data-tmact="full">Plein écran</button><button class="btn" data-tmact="edit">Structure</button><button class="btn" data-tmact="reset">Remettre à zéro</button></div>' +
      statsHtml(s) + '<a class="btn block" href="#tournoi">Le tournoi : joueurs, tables, éliminations ›</a>' +
      (window.PA_GUIDE ? window.PA_GUIDE.link('chrono') : '') + '<p class="small muted">Un signal sonore et une voix annoncent la dernière minute et chaque nouveau niveau (les blindes et l’ante), la pause et la reprise. L’écran reste allumé pendant que le minuteur tourne.</p></div>';
    return ui.shell('apprendre', body, true);
  }
  setInterval(function () {
    if (!/^#(minuteur|tournoi|ecran)/.test(location.hash) || (EDIT && /^#minuteur/.test(location.hash))) return;
    var s = live(), c = document.getElementById('tmClock') || document.getElementById('tmClock2') || document.getElementById('ecClock'); if (!c || !s.L.length) return;
    var eb = document.getElementById('ecBar'); if (eb) { var lv0 = s.L[s.idx]; eb.style.width = Math.max(0, Math.min(100, 100 - s.rem / (lv0.min * 60) * 100)).toFixed(1) + '%'; var en = document.getElementById('ecNext'); if (en) en.textContent = nextInfo(s); var ew = document.getElementById('ecNow'); if (ew) ew.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); c.classList.toggle('ec-hot', s.rem <= 60 && !!ST.since); }
    if (ST.since) {
      if (s.idx !== ST.shown) {
        if (ST.shown !== undefined) { beep(3); var was = s.L[ST.shown], now = s.L[s.idx], extra = rulesSay(s.L, ST.shown, s.idx); setTimeout(function () { say((was && was.pause && !now.pause ? 'Fin de la pause, on reprend. ' : '') + lvlSay(now) + (extra ? ' ' + extra : '')); }, 1300); }
        ST.shown = s.idx; U().render(); return;
      }
      var r = Math.ceil(s.rem); if (r === 60 && lastBeep !== s.idx) { lastBeep = s.idx; beep(1); var cl = s.L[s.idx], nx = s.L[s.idx + 1]; setTimeout(function () { say(cl.pause ? 'Fin de la pause dans une minute. Retour aux tables.' : 'Plus qu’une minute' + (nx ? (nx.pause ? ' avant la pause.' : ' avant le niveau ' + nx.n + ' : ' + nx.sb + ', ' + nx.bb + '.') : '.') + (!cl.pause && cfg().reEnd === cl.n ? ' Dernière minute pour les re-entry.' : '')); }, 600); }
    }
    c.textContent = mmss(s.rem);
  }, 500);
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tmact]') : null; if (!t) return;
    var a = t.getAttribute('data-tmact'), s = live(), L = s.L;
    if (a === 'cast') { doCast(); return; }
    if (a === 'blEdit') { BLED = true; BL_KIND = null; keepScroll(function () { U().render(); }); setTimeout(function () { var i = document.getElementById('blBb'); if (i) i.select(); }, 50); return; }
    if (a === 'blCancel') { BLED = false; keepScroll(function () { U().render(); }); return; }
    if (a === 'blAnteKind') { BL_KIND = t.getAttribute('data-v'); document.querySelectorAll('[data-tmact="blAnteKind"]').forEach(function (b) { b.classList.toggle('on', b === t); }); return; }
    if (a === 'blSave') {
      var gv = function (id) { var el = document.getElementById(id); return Math.max(0, parseInt(el && el.value, 10) || 0); };
      var nsb = gv('blSb'), nbb = gv('blBb'), nan = gv('blAn'), nmin = gv('blMin'), lv0 = s.L[s.idx];
      if (!nbb || !nsb) { T().msg = 'Indique une petite et une grosse blinde.'; U().render(); return; }
      var kind = BL_KIND || (lv0.bbAnte || !lv0.ante ? 'bb' : 'cl'), oldMin = lv0.min;
      freeze();
      if (setLevel(s.idx, nsb, nbb, nan, kind === 'bb', nmin || oldMin)) {
        if (nmin && nmin !== oldMin) ST.rem = Math.max(1, ST.rem + (nmin - oldMin) * 60);
        T().msg = 'Niveau ' + lv0.n + ' : ' + fmt(nsb) + ' / ' + fmt(nbb) + (nan ? ', ante ' + fmt(nan) : '') + '.';
      }
      BLED = false; save(); keepScroll(function () { U().render(); }); return;
    }
    if (a === 'seatsToggle') { SEATS = !SEATS; return; }
    if (a === 'seatsShare') { var txt = seatText(), dn = function (m) { T().msg = m; save(); U().render(); }; if (window.PA_LEAGUE && window.PA_LEAGUE.shareText) window.PA_LEAGUE.shareText(txt, dn); else { try { navigator.clipboard.writeText(txt).then(function () { dn('Liste copiée : colle-la dans WhatsApp.'); }); } catch (e) {} } return; }
    if (a === 'seatsTv') { T().seatsTv = !T().seatsTv; T().msg = T().seatsTv ? 'La liste des places s’affiche en grand sur l’écran télé.' : null; save(); keepScroll(function () { U().render(); }); return; }
    if (a === 'bakNow') { bakNow(true); T().msg = 'Tournoi sauvegardé.'; save(); keepScroll(function () { U().render(); }); return; }
    if (a === 'bakRestore') { var bi = +t.getAttribute('data-v'), bb0 = baks()[bi]; if (bb0 && (typeof confirm !== 'function' || !hasT(ST) || confirm('Reprendre la copie de ' + hhmm(bb0.at) + ' ? L’état actuel est gardé dans les copies.'))) { restoreBak(bi); T().msg = 'Tournoi repris tel qu’il était le ' + hhmm(bb0.at) + '. Le chrono est en pause : relance-le.'; save(); } U().render(); return; }
    if (a === 'toggle') { if (ST.since) { freeze(); ST.since = null; awake(false); } else { ST.idx = s.idx; ST.rem = s.rem; ST.since = Date.now(); ST.shown = s.idx; awake(true); beep(1); } }
    else if (a === 'next' || a === 'prev') { var k = Math.max(0, Math.min(L.length - 1, s.idx + (a === 'next' ? 1 : -1))); ST.idx = k; ST.rem = L[k].min * 60; ST.shown = k; if (ST.since) ST.since = Date.now(); if (k !== s.idx) { var ex = rulesSay(L, s.idx, k); say(lvlSay(L[k]) + (ex ? ' ' + ex : '')); } }
    else if (a === 'plus' || a === 'minus') { freeze(); ST.rem = Math.max(1, ST.rem + (a === 'plus' ? 60 : -60)); }
    else if (a === 'size') { T().size = +t.getAttribute('data-v'); T().msg = T().drawn ? 'Format changé : refais le tirage des tables.' : null; }
    else if (a === 'addNames' || a === 'addOpps') {
      var tt = T(), names = a === 'addOpps' ? (window.PA.player().opps || []).map(function (o) { return o.name; }) : (document.getElementById('tnNames').value || '').split(/[\n,;]+/);
      var added = 0; names.forEach(function (nm) { if (addOne(nm)) added++; });
      tt.msg = added ? added + ' joueur' + (added > 1 ? 's' : '') + ' inscrit' + (added > 1 ? 's' : '') + (tt.drawn ? ', placé' + (added > 1 ? 's' : '') + ' à la table la moins remplie.' : '.') : 'Aucun nouveau pseudo (déjà inscrits ?).';
    }
    else if (a === 'addMember') {
      var im = document.getElementById('tnNewM'), nm2 = im ? im.value.trim().slice(0, 30) : '';
      if (nm2 && window.PA_LEAGUE) {
        var rl = window.PA_LEAGUE.roster(), exists = rl.some(function (x) { return x.toLowerCase() === nm2.toLowerCase(); });
        if (!exists) window.PA_LEAGUE.setRoster(rl.concat([nm2]));
        var added2 = addOne(nm2), tm = T();
        tm.msg = (exists ? nm2 + ' est déjà membre du club' : nm2 + ' ajouté au club') + (added2 ? ' et inscrit au tournoi' + (tm.drawn ? ' : table ' + tm.players[tm.players.length - 1].table + ', siège ' + tm.players[tm.players.length - 1].seat : '') : '') + '.';
      }
    }
    else if (a === 'rosterEdit') { ROSTER = !ROSTER; }
    else if (a === 'rosterSave') { var ta = document.getElementById('tnRoster'); if (ta && window.PA_LEAGUE) { var nl = window.PA_LEAGUE.setRoster(ta.value.split(/[\n,;]+/)); T().msg = 'Liste du club enregistrée : ' + nl.length + ' joueurs.'; ROSTER = false; } }
    else if (a === 'regAll') { var ra = regulars().filter(function (r) { return r.club; }), nA = 0; ra.forEach(function (r) { if (addOne(r.name)) nA++; }); T().msg = nA + ' joueur' + (nA > 1 ? 's' : '') + ' du club inscrit' + (nA > 1 ? 's' : '') + '. Retouche les absents pour les retirer.'; }
    else if (a === 'reg') {
      var rg = regulars()[+t.getAttribute('data-v')], tr = T();
      if (rg) { if (inT(rg.name)) { var ix = -1; tr.players.forEach(function (x, j) { if (x.name.toLowerCase() === rg.name.toLowerCase()) ix = j; }); var px = tr.players[ix]; if (!tr.drawn) { tr.players.splice(ix, 1); tr.msg = null; } else tr.msg = px.out ? px.name + ' est déjà sorti.' : px.name + ' est en jeu (table ' + px.table + ') : pour le retirer, touche « Sorti ».'; } else { addOne(rg.name); tr.msg = tr.drawn ? rg.name + ' inscrit : table ' + tr.players[tr.players.length - 1].table + ', siège ' + tr.players[tr.players.length - 1].seat + '.' : null; } }
    }
    else if (a === 'delP') { T().players.splice(+t.getAttribute('data-v'), 1); }
    else if (a === 'draw') { draw(); TAB = 'tables'; }
    else if (a === 'tab') { TAB = t.getAttribute('data-v'); }
    else if (a === 'movesDone') { T().pending = []; T().closed = []; MSHEET = false; }
    else if (a === 'movesLater') { MSHEET = false; }
    else if (a === 'ttype') { T().type = t.getAttribute('data-v'); }
    else if (a === 'saveLeague') { var ts = T(); if (!ts.saved && window.PA_LEAGUE) { ts.payout = payout(ts); var rec = window.PA_LEAGUE.record(ts); ts.recId = rec.id; ts.saved = true; ts.msg = 'Tournoi enregistré : ' + rec.winner + ' gagne ' + (rec.rows[0] ? String(rec.rows[0].total).replace('.', ',') : '') + ' points. Le classement est à jour.'; } }
    else if (a === 'shareSum') { var tz = T(); if (tz.recId && window.PA_LEAGUE) window.PA_LEAGUE.shareText(window.PA_LEAGUE.summary(tz.recId), function (m) { T().msg = m; save(); U().render(); }); return; }
    else if (a === 'shareImg') { window.PA_EXPORT.image((T().date || '').slice(0, 4) || String(new Date().getFullYear()), function (m) { T().msg = m; save(); U().render(); }); return; }
    else if (a === 'editFromT') { EDIT = true; save(); location.hash = '#minuteur'; return; }
    else if (a === 'findMic') { FIND.listening = true; FIND.msg = ''; U().render(); window.PA_VOICE.listen('Quel joueur ?', function (txt, err) { FIND.listening = false; if (txt === null) FIND.msg = err || 'La dictée n’est pas disponible sur cet appareil.'; else if (!txt) FIND.msg = 'Je n’ai rien entendu.'; else FIND.q = txt.replace(/^(élimine|elimine|éliminer|sortir|sort)\s+/i, '').trim(); U().render(); }); return; }
    else if (a === 'ko') { var pk0 = T().players[+t.getAttribute('data-v')]; if (pk0 && !pk0.out) { KO = +t.getAttribute('data-v'); FIND.q = ''; } }
    else if (a === 'koCancel') { KO = null; }
    else if (a === 'koOk') { var sel = document.getElementById('koBy'); doKO(KO, sel ? sel.value : ''); KO = null; }
    else if (a === 'unko' || a === 'reentry') { var tu = T(), pu = tu.players[+t.getAttribute('data-v')]; if (pu && pu.out) { if (pu.bountyTakenBy) { tu.players.forEach(function (q) { if (q.name === pu.bountyTakenBy && q.bountyFrom === pu.name) { q.bonus = Math.max(0, (q.bonus || 0) - (window.PA_LEAGUE ? window.PA_LEAGUE.BONUS : 2)); q.bountyFrom = null; } }); pu.bountyTakenBy = null; } pu.out = false; pu.place = null; pu.prize = null; pu.koBy = null; pu.koAt = null; pu.koLevel = null; if (a === 'reentry') { tu.re++; pu.entries = (pu.entries || 1) + 1; } var sn1 = snap(); delete sn1[pu.name]; seatSomewhere(pu); noteMoves(sn1, 'retour en jeu'); tu.msg = (a === 'reentry' && !reOpen(live()) ? '⚠️ Les re-entry sont fermées (fin du niveau ' + cfg().reEnd + '), enregistrée quand même. ' : '') + pu.name + (a === 'reentry' ? ' fait une re-entry' : ' revient (élimination annulée)') + ' : table ' + pu.table + ', siège ' + pu.seat + '.'; } }
    else if (a === 'newT') { bakNow(true); if (typeof confirm !== 'function' || confirm('Effacer les inscrits, les tables et les compteurs ?')) ST.t = null; }
    else if (a === 'print') { try { window.print(); } catch (e3) {} return; }
    else if (a === 'entPlus') { T().entrants++; T().left++; }
    else if (a === 'entMinus') { if (T().entrants > 0) { T().entrants--; T().left = Math.max(0, T().left - 1); } }
    else if (a === 'out') { if (T().left > 0) T().left--; }
    else if (a === 'undoOut') { if (T().left < T().entrants + T().re) T().left++; }
    else if (a === 'rePlus') { T().re++; if (!T().players.length) T().left++; }
    else if (a === 'reMinus') { if (T().re > 0) { T().re--; if (!T().players.length) T().left = Math.max(0, T().left - 1); } }
    else if (a === 'addPlus') T().add++;
    else if (a === 'addMinus') { if (T().add > 0) T().add--; }
    else if (a === 'reset') { bakNow(true); if (typeof confirm === 'function' && (T().entrants || T().re || T().add) && confirm('Remettre aussi à zéro les joueurs, re-entries et add-ons ?')) ST.t = null; ST.idx = 0; ST.rem = L.length ? L[0].min * 60 : 0; ST.since = null; ST.shown = 0; awake(false); }
    else if (a === 'full') { try { var d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else d.requestFullscreen(); } catch (e2) {} return; }
    else if (a === 'edit') EDIT = true;
    else if (a === 'voice') { ST.voice = !vOn(); if (ST.voice) say('Annonces vocales activées. ' + (L[s.idx] ? lvlSay(L[s.idx]) : ''), true); else { try { if (window.speechSynthesis) speechSynthesis.cancel(); if (window.PAAndroid && window.PAAndroid.stop) window.PAAndroid.stop(); } catch (e4) {} } }
    else if (a === 'rmOn') { rmStart(true); return; }
    else if (a === 'rmOff') { rmStart(false); return; }
    else if (a === 'rmNew') { RM.code = String(1000 + Math.floor(Math.random() * 9000)); rmStart(true); return; }
    else if (a === 'ecranOut') { location.hash = T().players.length ? '#tournoi' : '#minuteur'; return; }
    else if (a === 'done') EDIT = false;
    else if (a === 'gen' || a === 'preview' || a === 'savestruct') {
      var v = function (id, d) { var el = document.getElementById(id); var x = el ? parseInt(el.value, 10) : NaN; return isNaN(x) ? d : x; };
      var g = function (id, d) { var el = document.getElementById(id); return el ? el.value : d; };
      var c0 = cfg();
      ST.cfg = Object.assign(cfg(), { sb: Math.max(1, v('tmSb', c0.sb)), bb: Math.max(1, v('tmBb', c0.bb)), n: Math.max(1, Math.min(90, v('tmN', c0.n))), mins: Math.max(1, Math.min(120, v('tmMins', c0.mins))), speed: g('tmSpeed', c0.speed), ante: g('tmAnte', c0.ante), anteFrom: Math.max(1, v('tmAnteFrom', c0.anteFrom)), pauseEvery: Math.max(0, v('tmPEvery', c0.pauseEvery)), pauseMin: Math.max(1, v('tmPMin', c0.pauseMin)), chips: Math.max(0, v('tmChips', c0.chips)), reStack: Math.max(0, v('tmRe', c0.reStack)), addStack: Math.max(0, v('tmAdd', c0.addStack)) });
      if (ST.cfg.sb > ST.cfg.bb) ST.cfg.sb = Math.round(ST.cfg.bb / 2);
      ST.mins = ST.cfg.mins;
      ST.text = a === 'gen' ? generate(ST.cfg) : document.getElementById('tmText').value;
      ST.structAt = Date.now(); if (window.PA_CLUBSYNC) setTimeout(window.PA_CLUBSYNC.dirty, 0);
      if (a === 'savestruct') { var L2 = levels(); ST.idx = 0; ST.rem = L2.length ? L2[0].min * 60 : 0; ST.since = null; EDIT = false; awake(false); }
    }
    save(); keepScroll(function () { U().render(); });
  });
  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'tnDate') { T().date = e.target.value; save(); U().render(); return; } });
  document.addEventListener('change', function (e) { var id = e.target && e.target.id;
    if (id === 'tnPrize' || id === 'tnPaid') { T()[id === 'tnPrize' ? 'prize' : 'paid'] = Math.max(0, parseInt(e.target.value, 10) || 0); save(); U().render(); return; }
    if (id === 'tnColor') { ST.structAt = Date.now(); if (window.PA_CLUBSYNC) setTimeout(window.PA_CLUBSYNC.dirty, 0); ST.cfg = cfg(); ST.cfg.colorUp = String(e.target.value || '').slice(0, 120); save(); U().render(); return; }
    var k = { tnChips: 'chips', tnRe: 'reStack', tnAdd: 'addStack', tnReEnd: 'reEnd', tnAddP: 'addPause' }[id]; if (!k) return; ST.structAt = Date.now(); if (window.PA_CLUBSYNC) setTimeout(window.PA_CLUBSYNC.dirty, 0); ST.cfg = cfg(); ST.cfg[k] = Math.max(0, parseInt(e.target.value, 10) || 0); save(); U().render(); });
  document.addEventListener('change', function (e) {
    if (!e.target || e.target.id !== 'tnRosterFile' || !e.target.files || !e.target.files[0]) return;
    var rd = new FileReader(); rd.onload = function () { var ta = document.getElementById('tnRoster'); if (ta) ta.value = String(rd.result || '').replace(/\r/g, '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean).join('\n'); }; rd.readAsText(e.target.files[0]);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.id === 'tnNewM') { var bt = document.querySelector('[data-tmact="addMember"]'); if (bt) { e.preventDefault(); bt.click(); } } });
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'tnFind') { FIND.q = e.target.value; FIND.msg = ''; var r = document.getElementById('tnFound'); if (r) r.innerHTML = findHtml(); } });
  // élimination : idx = joueur qui sort, by = index de celui qui l'élimine ('' = inconnu)
  function doKO(idx, by) {
    if (by === null || by === undefined || by === -1) by = '';
    var tk = T(), pk = tk.players[idx];
      if (pk && !pk.out) {
        var lft = alivePl().length, killer = by !== '' ? tk.players[+by] : null;
        pk.out = true; pk.place = lft; pk.from = 'table ' + pk.table + ' siège ' + pk.seat; pk.table = null;
        pk.koAt = Date.now(); pk.koLevel = lvlNow(); pk.koBy = killer ? killer.name : null;
        var bmsg = '';
        if (killer && tk.holder && pk.name.toLowerCase() === tk.holder.toLowerCase()) { killer.bonus = (killer.bonus || 0) + (window.PA_LEAGUE ? window.PA_LEAGUE.BONUS : 2); killer.bountyFrom = pk.name; pk.bountyTakenBy = killer.name; bmsg = '<br><b>Prime : ' + killer.name + ' élimine le dernier vainqueur et gagne ' + (window.PA_LEAGUE ? window.PA_LEAGUE.BONUS : 2) + ' points !</b>'; }
        var snap0 = snap(), mv = rebalance(), nmv = noteMoves(snap0);
        mv = mv.filter(function (x) { return /Table finale/.test(x); });
        var newMv = nmv ? (tk.pending || []).slice(-nmv) : [], pay = payout(tk), lot = pay[lft - 1], wlot = pay[0];
        if (lot) pk.prize = lot.amt;
        var win1 = alivePl().length === 1 ? alivePl()[0] : null; if (win1 && wlot) win1.prize = wlot.amt;
        say(pk.name + ' sort à la ' + ordSay(lft) + ' place' + (killer ? ', éliminé par ' + killer.name : '') + (lot ? ', et remporte ' + lot.amt + ' euros' : '') + '.' + (bmsg ? ' Prime de ' + (window.PA_LEAGUE ? window.PA_LEAGUE.BONUS : 2) + ' points pour ' + killer.name + ' !' : '') +
          (alivePl().length === 1 ? ' ' + alivePl()[0].name + ' remporte le tournoi' + (wlot ? ' et ' + wlot.amt + ' euros' : '') + ' ! Bravo !' : (mv.length ? ' Table finale !' : '') + (newMv.length ? (newMv.length <= 4 ? ' Changement de place : ' + newMv.map(function (m) { return m.name + ', table ' + m.tt + ', siège ' + m.ts; }).join(' ; ') + '.' : ' ' + newMv.length + ' joueurs changent de place, regardez l’écran.') : '')));
        tk.msg = pk.name + ' sort à la ' + lft + 'e place' + (killer ? ', éliminé par ' + killer.name : '') + (lot ? ' — lot : ' + eur(lot.amt) : '') + ' (' + new Date(pk.koAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ', ' + pk.koLevel + ').' + bmsg + (nmv ? '<br>' + nmv + ' joueur' + (nmv > 1 ? 's changent' : ' change') + ' de place : voir la liste.' : '') + (mv.length ? '<br><b>Table finale !</b>' : '') + (alivePl().length === 1 ? '<br><b>' + alivePl()[0].name + ' gagne le tournoi !</b>' : '');
      }
  }
  /* ---------- Télécommande : le téléphone pilote le tournoi, le PC sert de relais sur le wifi ---------- */
  var RM = { on: false, code: '', urls: [], seen: -1, err: '', h: null };
  function isPC() { return !!(window.PA_SYNC && window.PA_SYNC.isPC); }
  function rmSave() { try { localStorage.setItem('pa2remote', JSON.stringify({ on: RM.on, code: RM.code })); } catch (e) {} }
  function rmStart(on) {
    if (!isPC()) return;
    if (!RM.code) RM.code = String(1000 + Math.floor(Math.random() * 9000));
    fetch('/api/remote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ on: on, code: RM.code }) }).then(function (r) { return r.json(); }).then(function (j) {
      RM.on = !!j.on; RM.urls = j.urls || []; RM.err = j.err || ''; RM.seen = j.seen; rmSave(); clearInterval(RM.h); if (RM.on) { RM.h = setInterval(rmPush, 1000); rmPush(); } U().render();
    }).catch(function () { RM.err = 'Télécommande indisponible : mets l’appli PC à jour.'; U().render(); });
  }
  function rmPush() {
    if (!RM.on) return;
    fetch('/api/remote/state', { method: 'POST', body: JSON.stringify(remoteState()) }).then(function (r) { return r.json(); }).then(function (j) {
      var was = RM.seen >= 0 && RM.seen < 6; RM.seen = j.seen; var now = RM.seen >= 0 && RM.seen < 6;
      if (j.cmds && j.cmds.length) { j.cmds.forEach(remoteDo); save(); keepScroll(function () { U().render(); }); }
      else if (was !== now) { var el = document.getElementById('rmStat'); if (el) el.innerHTML = rmStatus(); }
    }).catch(function () {});
  }
  function rmStatus() { return RM.seen >= 0 && RM.seen < 6 ? '<span style="color:#3ddc84">● Téléphone connecté</span>' : '<span class="muted">○ En attente du téléphone…</span>'; }
  function rmCard() {
    var h = '<div class="card stack"><div class="row" style="justify-content:space-between;gap:8px"><b>📱 Télécommande</b>' + (window.PA_GUIDE ? window.PA_GUIDE.link('telecommande') : '') + '</div>';
    if (!isPC()) return h + '<div class="small muted">Pilote le tournoi depuis ton téléphone (lancer, pause, sorties, re-entry, changements de place) pendant que le PC affiche l’écran télé. Elle s’active depuis l’appli PC, qui sert de relais sur le wifi du club.</div></div>';
    if (!RM.on) return h + '<div class="small muted">Le PC affiche l’écran télé, toi tu gères tout depuis ton téléphone à la table. Le téléphone et le PC doivent être sur le même wifi.</div>' + (RM.err ? '<div class="small" style="color:#ff8a8f">' + RM.err + '</div>' : '') + '<button class="btn gold block" data-tmact="rmOn">Activer la télécommande</button></div>';
    return h + '<div class="small muted">Sur ton téléphone, connecté au même wifi, ouvre :</div>' + (RM.urls.length ? RM.urls.map(function (u) { return '<div class="rm-url">' + u + '</div>'; }).join('') : '<div class="small" style="color:#ff8a8f">Pas de réseau local trouvé : connecte le PC au wifi.</div>') +
      '<div class="row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>Code : <b class="rm-code">' + RM.code + '</b></span><span id="rmStat">' + rmStatus() + '</span></div>' +
      '<div class="small muted">Si Windows demande d’autoriser Poker Academy sur le pare-feu, accepte pour les réseaux privés.</div><div class="row" style="gap:8px"><button class="btn" data-tmact="rmNew" style="flex:1">Nouveau code</button><button class="btn" data-tmact="rmOff" style="flex:1">Arrêter</button></div></div>';
  }
  function remoteState() {
    var s = live(), t = T(), l = s.L[s.idx] || {}, chips = chipsInPlay(), bb = curBB(s), avg = t.left > 0 ? chips / t.left : 0, LG = window.PA_LEAGUE;
    var al = alivePl();
    return { at: Date.now(), lvl: l.pause ? 'Pause' : 'Niveau ' + l.n, bl: l.pause ? 'Pause' : fmt(l.sb) + ' / ' + fmt(l.bb), ante: l.ante ? anteTxt(l) : '', rem: s.rem, run: !!ST.since, next: nextInfo(s),
      left: t.left, total: t.entrants + t.re, avg: avg ? fmt(Math.round(avg)) : '', avgBB: avg && bb ? Math.round(avg / bb) : 0, voice: vOn(), name: LG && t.players.length ? { mercredi: 'Tournoi du mercredi', deep: 'Deep du vendredi', libre: 'Tournoi' }[t.type || 'mercredi'] : 'Tournoi du club',
      holder: t.holder || '', drawn: !!t.drawn, msg: String(t.msg || '').replace(/<br>/g, ' · ').replace(/<[^>]+>/g, ''), badges: s.L.length ? rulesBadges(s) : [], prize: prizeLine(t),
      players: t.players.map(function (x, i) { return { i: i, n: x.name, t: x.table || 0, s: x.seat || 0, o: x.out ? 1 : 0, p: x.place || 0, by: x.koBy || '', e: x.entries || 1 }; }),
      pend: (t.pending || []).map(function (m) { return { n: m.name, tt: m.tt, ts: m.ts, ft: m.ft || 0, fs: m.fs || 0 }; }), win: al.length === 1 && t.players.length > 1 ? al[0].name : '', saved: !!t.saved, canLeague: !!LG };
  }
  function remoteDo(c) {
    if (!c || !c.a) return;
    if (c.a === 'ko') { doKO(+c.i, c.by === '' || c.by === null || c.by === undefined ? '' : +c.by); return; }
    if (['toggle', 'next', 'prev', 'plus', 'minus', 'voice', 'movesDone', 'reentry', 'unko', 'addPlus', 'saveLeague'].indexOf(c.a) < 0) return;
    var b = document.createElement('button'); b.setAttribute('data-tmact', c.a); if (c.i !== undefined) b.setAttribute('data-v', String(c.i)); b.style.display = 'none'; document.body.appendChild(b); b.click(); b.remove();
  }
  setTimeout(function () { try { var r = JSON.parse(localStorage.getItem('pa2remote') || 'null'); if (r) { RM.code = r.code || ''; if (r.on) rmStart(true); } } catch (e) {} }, 1500);
  /* ---------- Écran pour la télé du club ---------- */
  function ecranView() {
    var ui = U(), esc = ui.esc, s = live(), t = T(), LG = window.PA_LEAGUE;
    if (!s.L.length) return view();
    var l = s.L[s.idx], run = !!ST.since, chips = chipsInPlay(), avg = t.left > 0 ? chips / t.left : 0, bb = curBB(s);
    var typeName = LG && t.players.length ? { mercredi: 'Tournoi du mercredi', deep: 'Deep du vendredi', libre: 'Tournoi' }[t.type || 'mercredi'] : 'Tournoi du club';
    var pz = -1, secs = s.rem; for (var k = s.idx + 1; k < s.L.length; k++) { if (s.L[k].pause) { pz = k; break; } secs += s.L[k].min * 60; }
    var stat = function (lab, val, sub) { return '<div class="ec-stat"><span>' + lab + '</span><b>' + val + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>'; };
    var seatMode = !!(t.seatsTv && t.drawn && alivePl().length > 1);
    var h = '<div class="ec' + (l.pause ? ' ec-pause' : '') + (seatMode ? ' ec-seatmode' : '') + '">' +
      '<div class="ec-top"><span class="ec-brand">POKER ACADEMY</span><span class="ec-title">' + esc(typeName) + (t.date ? ' · ' + t.date.split('-').reverse().slice(0, 2).join('/') : '') + '</span><span id="ecNow">' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '</span></div>' +
      '<div class="ec-main"><div class="ec-clockbox">' +
      '<div class="ec-lvl">' + (l.pause ? 'Pause' : 'Niveau ' + l.n) + (run ? '' : ' · <em>en attente</em>') + '</div>' +
      '<div class="ec-bl">' + (l.pause ? 'Pause' : fmt(l.sb) + ' / ' + fmt(l.bb)) + '</div>' +
      '<div class="ec-ante">' + (l.ante ? anteTxt(l) : (l.pause ? 'Bonne pause !' : '&nbsp;')) + '</div>' +
      '<div class="ec-clock" id="ecClock">' + mmss(s.rem) + '</div>' +
      '<div class="ec-bar"><i id="ecBar" style="width:' + Math.max(0, 100 - s.rem / (l.min * 60) * 100).toFixed(1) + '%"></i></div>' +
      '<div class="ec-next" id="ecNext">' + nextInfo(s) + '</div>' + (rulesBadges(s).length ? '<div class="ec-rules">' + rulesBadges(s).map(function (b) { return '<span class="' + (/fermées/.test(b) ? 'off' : '') + '">' + b + '</span>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="ec-side">' +
      (t.entrants || t.players.length ? stat('Joueurs', t.left + '<small> / ' + (t.entrants + t.re) + '</small>', t.re || t.add ? (t.re ? t.re + ' re-entry' : '') + (t.re && t.add ? ' · ' : '') + (t.add ? t.add + ' add-on' : '') : '') : '') +
      (avg ? stat('Tapis moyen', fmt(Math.round(avg)), bb ? Math.round(avg / bb) + ' grosses blindes' : '') : '') +
      (chips ? stat('Jetons en jeu', fmt(chips), '') : '') +
      (pz > 0 && !l.pause ? stat('Prochaine pause', Math.ceil(secs / 60) >= 60 ? hm(Math.ceil(secs / 60)) : Math.ceil(secs / 60) + ' min', '') : '') +
      (prizeLine(t) ? '<div class="ec-stat ec-prize"><span>Dotation ' + eur(t.prize) + '</span><b class="ec-pz">' + payout(t).map(function (p) { return '<i>' + p.place + (p.place === 1 ? 'er' : 'e') + ' <em>' + eur(p.amt) + '</em></i>'; }).join('') + '</b></div>' : '') +
      (LG && t.type !== 'libre' && t.holder ? '<div class="ec-wanted"><span>Tête mise à prix</span><b>' + esc(t.holder) + '</b><small>+' + LG.BONUS + ' points pour qui l’élimine</small></div>' : '') +
      '</div></div>';
    // bas : changements de place, puis dernières sorties, puis les tables
    var P = t.pending || [], outs = t.players.filter(function (x) { return x.out; }).sort(function (a, b) { return a.place - b.place; }).slice(0, 4);
    if (seatMode) h += '<div class="ec-seats"><b>Placement des joueurs</b><div>' + seatList().map(function (x) { return '<span><em>' + esc(x.name) + '</em> T' + x.table + ' · S' + x.seat + '</span>'; }).join('') + '</div></div>';
    else if (P.length) h += '<div class="ec-moves"><b>Changements de place</b>' + P.slice(-12).map(function (m) { return '<span><em>' + esc(m.name) + '</em> → table ' + m.tt + ' · siège ' + m.ts + '</span>'; }).join('') + '</div>';
    else if (outs.length) h += '<div class="ec-outs"><b>Dernières sorties</b>' + outs.map(function (x) { return '<span>' + x.place + 'e <em>' + esc(x.name) + '</em>' + (x.koBy ? ' par ' + esc(x.koBy) : '') + '</span>'; }).join('') + '</div>';
    if (t.drawn && alivePl().length > 1 && !seatMode) {
      var tb = tablesOf(), ids = Object.keys(tb).map(Number).sort(function (a, b) { return a - b; });
      h += '<div class="ec-tables">' + ids.map(function (id) { return '<div><b>Table ' + id + '</b><span>' + tb[id].slice().sort(function (a, b) { return a.seat - b.seat; }).map(function (q) { return q.seat + '. ' + esc(q.name); }).join(' · ') + '</span></div>'; }).join('') + '</div>';
    }
    if (t.drawn && alivePl().length === 1 && t.players.length > 1) h += '<div class="ec-win">🏆 ' + esc(alivePl()[0].name) + ' remporte le tournoi !</div>';
    h += '<div class="ec-ctrl"><button data-tmact="ecranOut" aria-label="Quitter">‹ Quitter</button><button data-tmact="prev">⏮</button><button class="ec-play" data-tmact="toggle">' + (run ? '❚❚ Pause' : '▶ Lancer') + '</button><button data-tmact="next">⏭</button><button data-tmact="voice">' + (vOn() ? '🔊' : '🔇') + '</button><button data-tmact="full">⛶ Plein écran</button>' + (canCast() ? '<button data-tmact="cast">📡 Diffuser</button>' : '') + '</div></div>';
    return h;
  }
  // clavier sur l’écran télé et le minuteur : espace = lancer / pause, flèches = niveau
  document.addEventListener('keydown', function (e) {
    if (!/^#(ecran|minuteur)/.test(location.hash) || EDIT || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    var m = { ' ': 'toggle', ArrowRight: 'next', ArrowLeft: 'prev', f: 'full', v: 'voice' }[e.key]; if (!m) return;
    var b = document.querySelector('[data-tmact="' + m + '"]'); if (b) { e.preventDefault(); b.click(); }
  });
  // structure partagée avec l'autre appli (jamais pendant qu'un tournoi tourne)
  function getStruct() { return { text: ST.text, cfg: ST.cfg || null, at: ST.structAt || 0 }; }
  function setStruct(o) {
    if (!o || !o.text || (o.at || 0) <= (ST.structAt || 0) || ST.since) return false;
    var running = ST.idx || (ST.rem && levels()[0] && ST.rem !== levels()[0].min * 60);
    ST.text = o.text; if (o.cfg) ST.cfg = o.cfg; ST.structAt = o.at;
    if (!running) { var L0 = levels(); ST.idx = 0; ST.rem = L0.length ? L0[0].min * 60 : 0; }
    save(); return true;
  }
  window.PA_TIMER = { tab: function (v) { TAB = v; }, getStruct: getStruct, setStruct: setStruct, view: view, tournoi: tournoiView, ecran: ecranView, payout: payout, _rulesSay: rulesSay, _reOpen: reOpen, _live: live, _levels: levels, _generate: generate };
})();
