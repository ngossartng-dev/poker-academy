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
  var NICE = [20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000, 150000, 200000, 250000, 300000, 400000, 500000];
  var ANTES = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
  var SPEED = { lente: [1.25, 'Lente (+25 % par niveau)'], normale: [1.33, 'Normale (+33 %)'], rapide: [1.5, 'Rapide (+50 %)'] };
  var CFG0 = { sb: 50, bb: 100, n: 18, mins: 20, speed: 'normale', ante: 'bb', anteFrom: 4, pauseEvery: 5, pauseMin: 10, chips: 20000 };
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
        row('Nombre de niveaux', num('tmN', c.n, 80, 1, 60)) +
        row('Durée des niveaux (minutes)', num('tmMins', c.mins, 80, 1, 120)) +
        row('Tapis de départ (pour info)', num('tmChips', c.chips, 120, 0, 10000000)) +
        '<b>2. L’ante</b>' +
        row('Type d’ante', sel('tmAnte', c.ante, [['none', 'Pas d’ante'], ['bb', 'Ante de grosse blinde'], ['classic', 'Ante classique (par joueur)']])) +
        row('À partir du niveau', num('tmAnteFrom', c.anteFrom, 80, 1, 60)) +
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
      '<div class="row" style="justify-content:space-between"><a class="back" href="#outils">‹ Outils</a><span class="small muted">' + (l.pause ? 'Pause' : 'Niveau ' + l.n) + ' · ' + (s.idx + 1) + ' / ' + s.L.length + '</span></div>' +
      '<div class="card stack" style="align-items:center;gap:6px;padding:24px 12px">' +
      '<div class="disp" id="tmLvl" style="font-size:clamp(40px,11vw,120px);line-height:1;color:var(--gold)">' + lvlTxt(l).split(' · ')[0] + '</div>' +
      '<div id="tmAnte" style="font-size:clamp(20px,5vw,44px)">' + (l.ante ? anteTxt(l) : (l.pause ? 'Bonne pause !' : '&nbsp;')) + '</div>' +
      '<div class="disp" id="tmClock" style="font-size:clamp(70px,24vw,260px);line-height:1;margin-top:8px">' + mmss(s.rem) + '</div>' +
      '<div class="muted" id="tmNext" style="font-size:clamp(15px,3vw,26px)">' + nextInfo(s) + '</div></div>' +
      '<div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px"><button class="btn" data-tmact="prev">‹ Niveau</button><button class="btn gold" data-tmact="toggle" style="min-width:160px;font-size:1.2em">' + (run ? 'Pause' : (ST.idx || ST.rem !== s.L[0].min * 60 ? 'Reprendre' : 'Démarrer')) + '</button><button class="btn" data-tmact="next">Niveau ›</button></div>' +
      '<div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px"><button class="btn" data-tmact="minus">− 1 min</button><button class="btn" data-tmact="plus">+ 1 min</button><button class="btn" data-tmact="full">Plein écran</button><button class="btn" data-tmact="edit">Structure</button><button class="btn" data-tmact="reset">Remettre à zéro</button></div>' +
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
    else if (a === 'reset') { ST.idx = 0; ST.rem = L.length ? L[0].min * 60 : 0; ST.since = null; ST.shown = 0; awake(false); }
    else if (a === 'full') { try { var d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else d.requestFullscreen(); } catch (e2) {} return; }
    else if (a === 'edit') EDIT = true;
    else if (a === 'done') EDIT = false;
    else if (a === 'gen' || a === 'preview' || a === 'savestruct') {
      var v = function (id, d) { var el = document.getElementById(id); var x = el ? parseInt(el.value, 10) : NaN; return isNaN(x) ? d : x; };
      var g = function (id, d) { var el = document.getElementById(id); return el ? el.value : d; };
      var c0 = cfg();
      ST.cfg = { sb: Math.max(1, v('tmSb', c0.sb)), bb: Math.max(1, v('tmBb', c0.bb)), n: Math.max(1, Math.min(60, v('tmN', c0.n))), mins: Math.max(1, Math.min(120, v('tmMins', c0.mins))), speed: g('tmSpeed', c0.speed), ante: g('tmAnte', c0.ante), anteFrom: Math.max(1, v('tmAnteFrom', c0.anteFrom)), pauseEvery: Math.max(0, v('tmPEvery', c0.pauseEvery)), pauseMin: Math.max(1, v('tmPMin', c0.pauseMin)), chips: Math.max(0, v('tmChips', c0.chips)) };
      if (ST.cfg.sb > ST.cfg.bb) ST.cfg.sb = Math.round(ST.cfg.bb / 2);
      ST.mins = ST.cfg.mins;
      ST.text = a === 'gen' ? generate(ST.cfg) : document.getElementById('tmText').value;
      if (a === 'savestruct') { var L2 = levels(); ST.idx = 0; ST.rem = L2.length ? L2[0].min * 60 : 0; ST.since = null; EDIT = false; awake(false); }
    }
    save(); U().render();
  });
  window.PA_TIMER = { view: view, _levels: levels, _generate: generate };
})();
