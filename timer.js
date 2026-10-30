/* Poker Academy v2.0 — Minuteur de niveaux pour le club (grand écran) */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  var KEY = 'pa2timer';
  var DEF = ['25/50', '50/100', '75/150', '100/200 ante 200', '150/300 ante 300', 'pause 10', '200/400 ante 400', '300/600 ante 600', '400/800 ante 800', '500/1000 ante 1000', 'pause 10', '600/1200 ante 1200', '800/1600 ante 1600', '1000/2000 ante 2000', '1500/3000 ante 3000', '2000/4000 ante 4000'].join('\n');
  var ST = load(), EDIT = false, lock = null, lastBeep = -1;
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.text) return s; } catch (e) {} return { text: DEF, mins: 20, idx: 0, rem: 20 * 60, since: null }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
  function levels() {
    var out = [], n = 0;
    ST.text.split(/\n/).forEach(function (l) {
      l = l.trim().toLowerCase(); if (!l) return;
      var pm = /^pause\s*(\d+)?/.exec(l);
      if (pm) { out.push({ pause: true, min: +(pm[1] || 10) }); return; }
      var m = /^(\d[\d\s.]*)\s*\/\s*(\d[\d\s.]*)(?:\s*(?:ante|a)\s*(\d[\d\s.]*))?(?:\s*(\d+)\s*min)?/.exec(l);
      if (!m) return;
      n++; out.push({ n: n, sb: +m[1].replace(/\D/g, ''), bb: +m[2].replace(/\D/g, ''), ante: m[3] ? +m[3].replace(/\D/g, '') : 0, min: m[4] ? +m[4] : ST.mins });
    });
    return out;
  }
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
  function lvlTxt(l) { return l.pause ? 'Pause' : fmt(l.sb) + ' / ' + fmt(l.bb) + (l.ante ? ' · ante ' + fmt(l.ante) : ''); }
  function mmss(s) { s = Math.ceil(s); var m = Math.floor(s / 60); return (m < 10 ? '0' : '') + m + ':' + ((s % 60) < 10 ? '0' : '') + (s % 60); }
  function nextInfo(s) {
    var nx = s.L[s.idx + 1], pz = -1;
    for (var k = s.idx + 1; k < s.L.length; k++) if (s.L[k].pause) { pz = k - s.idx; break; }
    return (nx ? 'Prochain niveau : ' + lvlTxt(nx) : 'Dernier niveau') + (pz > 0 && !(nx && nx.pause) ? ' · pause dans ' + pz + ' niveau' + (pz > 1 ? 'x' : '') : '');
  }
  function view() {
    var ui = U(), s = live();
    if (EDIT || !s.L.length) {
      return ui.shell('apprendre', '<div class="stack"><button class="back" data-tmact="done">‹ Minuteur</button><h1>Structure</h1>' +
        ui.yo('Un niveau par ligne : petite blinde / grosse blinde, puis « ante » si besoin. « pause 10 » ajoute une pause de 10 minutes. Tu peux préciser une durée à la fin d’une ligne : « 600/1200 ante 1200 30 min ».') +
        '<div class="card stack"><b>Durée des niveaux (minutes)</b><input id="tmMins" type="number" min="1" max="120" value="' + ST.mins + '" style="width:110px;min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit">' +
        '<b>Niveaux</b><textarea id="tmText" rows="16" style="width:100%;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:8px;font:inherit">' + ui.esc(ST.text) + '</textarea>' +
        '<div class="row"><button class="btn gold" data-tmact="savestruct" style="flex:1">Enregistrer</button><button class="btn" data-tmact="defstruct">Exemple</button></div></div></div>');
    }
    var l = s.L[s.idx], run = !!ST.since;
    var body = '<div class="stack" style="text-align:center;align-items:stretch;max-width:900px;margin:0 auto">' +
      '<div class="row" style="justify-content:space-between"><a class="back" href="#outils">‹ Outils</a><span class="small muted">' + (l.pause ? 'Pause' : 'Niveau ' + l.n) + ' · ' + (s.idx + 1) + ' / ' + s.L.length + '</span></div>' +
      '<div class="card stack" style="align-items:center;gap:6px;padding:24px 12px">' +
      '<div class="disp" id="tmLvl" style="font-size:clamp(40px,11vw,120px);line-height:1;color:var(--gold)">' + lvlTxt(l).split(' · ')[0] + '</div>' +
      '<div id="tmAnte" style="font-size:clamp(20px,5vw,44px)">' + (l.ante ? 'ante ' + fmt(l.ante) : (l.pause ? 'Bonne pause !' : '&nbsp;')) + '</div>' +
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
    else if (a === 'defstruct') { var ta = document.getElementById('tmText'); if (ta) ta.value = DEF; return; }
    else if (a === 'savestruct') { ST.text = document.getElementById('tmText').value; ST.mins = Math.max(1, Math.min(120, parseInt(document.getElementById('tmMins').value, 10) || 20)); var L2 = levels(); ST.idx = 0; ST.rem = L2.length ? L2[0].min * 60 : 0; ST.since = null; EDIT = false; }
    save(); U().render();
  });
  window.PA_TIMER = { view: view, _levels: levels };
})();
