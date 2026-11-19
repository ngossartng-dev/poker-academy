/* Poker Academy — animations sonores et visuelles des éliminations (tournoi du club).
   Sons fabriqués par synthèse (Web Audio) : originaux, sans fichier, hors ligne. */
(function () {
  'use strict';
  var LIST = [
    { id: 'chevre', e: '🐐', name: 'La chèvre qui braille' },
    { id: 'poulet', e: '🐔', name: 'Le poulet et la carotte' },
    { id: 'trombone', e: '🎺', name: 'Le trombone triste' },
    { id: 'bombe', e: '💣', name: 'La bombe' },
    { id: 'tombe', e: '🪦', name: 'La pierre tombale' },
    { id: 'canard', e: '🦆', name: 'Le canard' }
  ];
  var KEY = 'pa2fx', C = { on: true, def: 'hasard', vol: 0.8 };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) C = Object.assign(C, sv); } catch (e) {}
  function saveCfg() { try { localStorage.setItem(KEY, JSON.stringify(C)); } catch (e) {} }

  /* ---------- le son ---------- */
  var AC = null, MASTER = null;
  function ctx() {
    if (!AC) { var K = window.AudioContext || window.webkitAudioContext; if (!K) return null; AC = new K(); MASTER = AC.createGain(); MASTER.connect(AC.destination); }
    if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    MASTER.gain.value = C.vol;
    return AC;
  }
  // un toucher débloque le son (iPhone, Android, navigateurs)
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function () { try { var a = ctx(); if (a && a.state === 'suspended') a.resume(); } catch (e) {} }, { passive: true }); });
  function env(g, t0, a, peak, d, end) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.setValueAtTime(peak, Math.max(t0 + a, end - d)); g.gain.exponentialRampToValueAtTime(0.0001, end); }
  function noiseBuf(a, sec) { var b = a.createBuffer(1, Math.max(1, sec * a.sampleRate | 0), a.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  // une voix « animale » : oscillateur + vibrato + filtre de formant
  function voice(a, t0, dur, o) {
    var os = a.createOscillator(), g = a.createGain(), bp = a.createBiquadFilter(), lfo = a.createOscillator(), lg = a.createGain();
    os.type = o.type || 'sawtooth'; os.frequency.setValueAtTime(o.f0, t0); if (o.f1) os.frequency.linearRampToValueAtTime(o.f1, t0 + dur);
    lfo.frequency.value = o.vib || 0; lg.gain.value = o.vibDepth || 0; lfo.connect(lg); lg.connect(os.frequency);
    bp.type = 'bandpass'; bp.frequency.value = o.formant || 1000; bp.Q.value = o.q || 4;
    os.connect(bp); bp.connect(g); g.connect(MASTER);
    if (o.formant2) { var bp2 = a.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = o.formant2; bp2.Q.value = 6; os.connect(bp2); bp2.connect(g); }
    env(g, t0, o.att || 0.03, o.peak || 0.6, o.rel || 0.12, t0 + dur);
    os.start(t0); lfo.start(t0); os.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
  }
  function noise(a, t0, dur, o) {
    var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf(a, dur + 0.1); f.type = o.ft || 'lowpass'; f.frequency.setValueAtTime(o.f0 || 1000, t0); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur); f.Q.value = o.q || 1;
    s.connect(f); f.connect(g); g.connect(MASTER); env(g, t0, o.att || 0.005, o.peak || 0.5, o.rel || dur * 0.8, t0 + dur); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function tone(a, t0, dur, f, o) {
    o = o || {}; var os = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t0); if (o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    if (o.vib) { var l = a.createOscillator(), lg = a.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibDepth || 4; l.connect(lg); lg.connect(os.frequency); l.start(t0 + (o.vibDelay || 0)); l.stop(t0 + dur + 0.05); }
    lp.type = 'lowpass'; lp.frequency.value = o.lp || 8000; os.connect(lp); lp.connect(g); g.connect(MASTER);
    env(g, t0, o.att || 0.01, o.peak || 0.4, o.rel || dur * 0.6, t0 + dur); os.start(t0); os.stop(t0 + dur + 0.05);
  }
  var SND = {
    chevre: function (a, t) { // « MÊÊÊÊÊ » tremblé, deux fois
      voice(a, t, 1.15, { f0: 420, f1: 360, vib: 9, vibDepth: 38, formant: 1100, formant2: 2400, q: 3, peak: 0.7, att: 0.05, rel: 0.25 });
      voice(a, t + 1.25, 0.8, { f0: 470, f1: 330, vib: 10, vibDepth: 45, formant: 1000, formant2: 2600, q: 3, peak: 0.6, att: 0.04, rel: 0.3 });
      return 2.2;
    },
    poulet: function (a, t) { // sifflement de la carotte, « tchok », puis « COT-COT-CODÊÊÊK » outré
      noise(a, t, 0.55, { ft: 'bandpass', f0: 600, f1: 3000, q: 3, peak: 0.25, att: 0.3, rel: 0.1 });
      tone(a, t + 0.55, 0.12, 180, { f1: 70, type: 'triangle', peak: 0.9, rel: 0.1 }); noise(a, t + 0.55, 0.08, { f0: 2500, peak: 0.6 });
      [0.72, 0.86, 1.0].forEach(function (d) { voice(a, t + d, 0.09, { f0: 950, f1: 700, type: 'square', formant: 1400, q: 5, peak: 0.55, att: 0.005, rel: 0.05 }); });
      voice(a, t + 1.18, 0.75, { f0: 700, f1: 1250, type: 'square', vib: 14, vibDepth: 60, formant: 1600, formant2: 3000, q: 4, peak: 0.6, att: 0.02, rel: 0.25 });
      return 2.1;
    },
    trombone: function (a, t) { // « wouah-wouah-wouah-wouaaah »
      var n = [233.1, 220, 207.7, 196], d = [0.45, 0.45, 0.45, 1.4];
      var tt = t; n.forEach(function (f, i) { var o = { type: 'sawtooth', lp: 1300, peak: 0.45, att: 0.06, rel: 0.12 }; if (i === 3) { o.vib = 5.5; o.vibDepth = 6; o.vibDelay = 0.3; o.rel = 0.5; } tone(a, tt, d[i], f, o); tt += d[i] + 0.02; });
      return 3.0;
    },
    bombe: function (a, t) { // mèche qui grésille, puis BOUM
      noise(a, t, 1.1, { ft: 'highpass', f0: 3500, peak: 0.15, att: 0.05, rel: 0.05 });
      noise(a, t + 1.1, 1.6, { ft: 'lowpass', f0: 1800, f1: 80, peak: 1, att: 0.005, rel: 1.5 });
      tone(a, t + 1.1, 1.2, 90, { f1: 28, peak: 0.9, rel: 1.1 });
      return 2.8;
    },
    tombe: function (a, t) { // glas : deux coups de cloche
      [0, 1.3].forEach(function (d) { [1, 2.0, 2.76, 4.07, 5.4].forEach(function (k, i) { tone(a, t + d, 2.4 - i * 0.3, 196 * k, { peak: 0.35 / (i + 1), att: 0.004, rel: 2.2 - i * 0.3 }); }); });
      return 3.4;
    },
    canard: function (a, t) { // « COIN ! COIN ! »
      [0, 0.38].forEach(function (d) { voice(a, t + d, 0.26, { f0: 520, f1: 380, type: 'sawtooth', formant: 1150, formant2: 2300, q: 7, peak: 0.8, att: 0.01, rel: 0.12 }); });
      noise(a, t + 0.85, 0.7, { ft: 'bandpass', f0: 400, f1: 900, q: 2, peak: 0.12, att: 0.1 }); // battements d'ailes
      return 1.9;
    },
    prime: function (a, t) { // machine à sous : ding-ding-ding et pièces
      [1046.5, 1318.5, 1568, 2093].forEach(function (f, i) { tone(a, t + i * 0.13, 0.5, f, { type: 'triangle', peak: 0.35, att: 0.004, rel: 0.45 }); });
      for (var i = 0; i < 9; i++) tone(a, t + 0.6 + i * 0.07, 0.09, 2600 + Math.random() * 900, { type: 'square', peak: 0.08, lp: 6000 });
      return 1.9;
    },
    vainqueur: function (a, t) { // fanfare
      var n = [[523.3, 0.18], [659.3, 0.18], [784, 0.18], [1046.5, 0.5], [784, 0.18], [1046.5, 1.1]], tt = t;
      n.forEach(function (x) { tone(a, tt, x[1], x[0], { type: 'sawtooth', lp: 2600, peak: 0.32, att: 0.02, rel: 0.12 }); tone(a, tt, x[1], x[0] / 2, { type: 'triangle', peak: 0.2, att: 0.02 }); tt += x[1] + 0.03; });
      return 2.8;
    }
  };
  function sound(kind) { try { var a = ctx(); if (!a || !SND[kind]) return 0; return SND[kind](a, a.currentTime + 0.05); } catch (e) { return 0; } }

  /* ---------- l'image ---------- */
  var CSS = '.fx-ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);overflow:hidden;cursor:pointer;animation:fxIn .2s ease-out}' +
    '.fx-ov.fx-out{animation:fxOut .35s ease-in forwards}' +
    '.fx-txt{position:absolute;left:4%;right:4%;bottom:9%;text-align:center;color:#fff;font-weight:800;font-size:clamp(22px,5.5vw,64px);line-height:1.15;text-shadow:0 3px 12px #000}' +
    '.fx-txt small{display:block;font-size:.5em;color:#f2c14e;font-weight:700;margin-top:.3em}' +
    '.fx-e{position:absolute;font-size:clamp(110px,26vw,320px);line-height:1;filter:drop-shadow(0 8px 18px rgba(0,0,0,.6))}' +
    '.fx-s{position:absolute;font-size:clamp(40px,9vw,120px);line-height:1;white-space:nowrap}' +
    '@keyframes fxIn{from{opacity:0}to{opacity:1}}@keyframes fxOut{to{opacity:0}}' +
    '@keyframes fxHop{0%{left:-30%;top:40%}12%{top:22%}25%{top:40%}37%{top:22%}50%{left:38%;top:40%}62%{top:22%}75%{top:40%}87%{top:22%}100%{left:110%;top:40%}}' +
    '@keyframes fxShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-14px,8px)}40%{transform:translate(12px,-10px)}60%{transform:translate(-10px,-6px)}80%{transform:translate(9px,10px)}}' +
    '@keyframes fxCarrot{0%{left:-20%;top:60%;transform:rotate(-30deg)}100%{left:31%;top:44%;transform:rotate(15deg)}}' +
    '@keyframes fxJump{0%{transform:translateY(0) rotate(0)}30%{transform:translateY(-38vh) rotate(-25deg)}55%{transform:translateY(-30vh) rotate(20deg)}100%{transform:translateY(0) rotate(0)}}' +
    '@keyframes fxFeather{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
    '@keyframes fxSink{0%{transform:translateY(0)}100%{transform:translateY(30vh) scale(.8);opacity:.3}}' +
    '@keyframes fxGrow{0%{transform:scale(.4)}100%{transform:scale(1.15)}}@keyframes fxBoom{0%{transform:scale(.2);opacity:1}100%{transform:scale(2.6);opacity:0}}' +
    '@keyframes fxRise{0%{transform:translateY(60vh)}100%{transform:translateY(0)}}' +
    '@keyframes fxFly{0%{left:40%;top:45%;transform:scale(1)}30%{left:42%;top:42%}100%{left:115%;top:-20%;transform:scale(.6) rotate(-20deg)}}' +
    '@keyframes fxConf{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}@keyframes fxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}';
  function css() { if (document.getElementById('fxCss')) return; var st = document.createElement('style'); st.id = 'fxCss'; st.textContent = CSS; document.head.appendChild(st); }
  function el(cls, txt, style) { var d = document.createElement('div'); d.className = cls; d.textContent = txt; if (style) d.setAttribute('style', style); return d; }
  var SCENE = {
    chevre: function (ov) { ov.appendChild(el('fx-e', '🐐', 'animation:fxHop 2.3s linear forwards')); ov.appendChild(el('fx-s', 'MÊÊÊÊÊ !', 'top:12%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900;animation:fxPulse .3s 6')); },
    poulet: function (ov) {
      var ch = el('fx-e', '🐔', 'left:38%;top:36%'); ov.appendChild(ch);
      ov.appendChild(el('fx-s', '🥕', 'animation:fxCarrot .55s ease-in forwards'));
      setTimeout(function () {
        ch.style.animation = 'fxJump 1s ease-out'; ov.appendChild(el('fx-s', 'CODÊÊÊK !', 'top:10%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900'));
        for (var i = 0; i < 14; i++) { var f = el('fx-s', '🪶', 'left:44%;top:52%;font-size:clamp(24px,5vw,60px);--dx:' + ((Math.random() * 2 - 1) * 40) + 'vw;--dy:' + ((Math.random() * 2 - 1) * 35) + 'vh;--r:' + (Math.random() * 720 - 360) + 'deg;animation:fxFeather 1.3s ease-out forwards'); ov.appendChild(f); }
      }, 560);
    },
    trombone: function (ov) { ov.appendChild(el('fx-e', '🎺', 'left:8%;top:22%;transform:rotate(-20deg)')); ov.appendChild(el('fx-e', '😢', 'right:10%;top:22%;animation:fxSink 3s ease-in forwards')); },
    bombe: function (ov) {
      var b = el('fx-e', '💣', 'animation:fxGrow 1.1s ease-in forwards'); ov.appendChild(b);
      setTimeout(function () { b.textContent = '💥'; b.style.animation = 'fxBoom 1s ease-out forwards'; ov.style.animation = 'fxShake .12s 6'; ov.style.background = 'rgba(255,140,0,.55)'; setTimeout(function () { ov.style.background = 'rgba(0,0,0,.72)'; }, 250); }, 1100);
    },
    tombe: function (ov) { ov.appendChild(el('fx-e', '🪦', 'top:14%;animation:fxRise .9s ease-out')); ov.appendChild(el('fx-s', '🕯️', 'left:22%;top:34%')); ov.appendChild(el('fx-s', '🕯️', 'right:22%;top:34%')); },
    canard: function (ov) { var d = el('fx-e', '🦆', 'left:40%;top:45%'); ov.appendChild(d); ov.appendChild(el('fx-s', 'COIN !', 'top:12%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900')); setTimeout(function () { d.style.animation = 'fxFly 1.1s ease-in forwards'; }, 800); },
    prime: function (ov) { ov.appendChild(el('fx-e', '🎰', 'top:14%;animation:fxPulse .35s 5')); for (var i = 0; i < 12; i++) ov.appendChild(el('fx-s', '🪙', 'left:' + (8 + Math.random() * 84) + '%;top:-10%;font-size:clamp(28px,6vw,70px);animation:fxConf ' + (1.2 + Math.random()) + 's ' + (Math.random() * .6) + 's linear forwards')); },
    vainqueur: function (ov) { ov.appendChild(el('fx-e', '🏆', 'top:12%;animation:fxPulse .5s 5')); var c = ['🎉', '🎊', '✨', '⭐']; for (var i = 0; i < 26; i++) ov.appendChild(el('fx-s', c[i % 4], 'left:' + (Math.random() * 96) + '%;top:-10%;font-size:clamp(26px,5vw,64px);animation:fxConf ' + (1.6 + Math.random() * 1.4) + 's ' + (Math.random() * .8) + 's linear forwards')); }
  };
  var Q = [], BUSY = false;
  function show(kind, title, sub) {
    css();
    var ov = document.createElement('div'); ov.className = 'fx-ov'; ov.setAttribute('role', 'status');
    var tx = document.createElement('div'); tx.className = 'fx-txt'; tx.textContent = title || ''; if (sub) { var sm = document.createElement('small'); sm.textContent = sub; tx.appendChild(sm); } ov.appendChild(tx);
    try { (SCENE[kind] || SCENE.trombone)(ov); } catch (e) {}
    document.body.appendChild(ov);
    var dur = Math.max(2.4, sound(kind) + 0.4);
    var close = function () { if (!ov.parentNode) return; ov.classList.add('fx-out'); setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); next(); }, 350); };
    ov.addEventListener('click', close); setTimeout(close, dur * 1000);
    return dur;
  }
  function next() { BUSY = false; if (Q.length) { var x = Q.shift(); BUSY = true; show(x[0], x[1], x[2]); } }
  function enqueue(kind, title, sub) { if (BUSY) { Q.push([kind, title, sub]); return; } BUSY = true; show(kind, title, sub); }
  function pick(k) { if (!k || k === 'hasard') return LIST[Math.floor(Math.random() * LIST.length)].id; return k; }
  // une élimination : l'animation choisie, puis la prime et/ou le vainqueur ; aussi envoyée à l'écran télé ouvert dans une autre fenêtre
  function ko(o, fromRemote) {
    if (!C.on || o.kind === 'aucune') return 0;
    var k = pick(o.kind || C.def), tot = 0;
    enqueue(k, o.name + ' sort' + (o.place ? ' · ' + o.place + (o.place === 1 ? 'er' : 'e') : ''), o.by ? 'éliminé par ' + o.by : '');
    tot += 2.8;
    if (o.bounty) { enqueue('prime', '💰 Prime pour ' + o.by + ' !', '+' + o.bonus + ' points : la tête mise à prix est tombée'); tot += 2.3; }
    if (o.winner) { enqueue('vainqueur', '🏆 ' + o.winner + ' gagne le tournoi !', 'Bravo !'); tot += 3; }
    if (!fromRemote) { try { localStorage.setItem('pa2fxev', JSON.stringify(Object.assign({}, o, { kind: k, at: Date.now() }))); } catch (e) {} }
    return tot;
  }
  window.addEventListener('storage', function (e) { if (e.key !== 'pa2fxev' || !e.newValue) return; try { var o = JSON.parse(e.newValue); if (Date.now() - o.at < 8000 && /#ecran/.test(location.hash)) ko(o, true); } catch (x) {} });
  /* ---------- la page « 🎉 Animations pour rire » : jouer une animation quand on veut ---------- */
  var FUN = { name: '', by: '' };
  var EXTRA = [{ id: 'prime', e: '💰', name: 'La prime' }, { id: 'vainqueur', e: '🏆', name: 'Le vainqueur' }, { id: 'hasard', e: '🎲', name: 'Au hasard' }];
  function fun(kind) {
    var k = pick(kind), nm = (FUN.name || '').trim(), by = (FUN.by || '').trim();
    var title = k === 'vainqueur' ? '🏆 ' + (nm || 'Champion') + ' !' : k === 'prime' ? '💰 Prime pour ' + (by || nm || 'toi') + ' !' : (nm ? nm + ' sort !' : 'Et un de moins !');
    var sub = k === 'vainqueur' ? 'Bravo !' : k === 'prime' ? '+2 points' : (by ? 'éliminé par ' + by : '');
    try { var a = ctx(); if (a && a.state === 'suspended') a.resume(); } catch (e) {}
    enqueue(k, title, sub);
    try { localStorage.setItem('pa2fxfun', JSON.stringify({ k: k, title: title, sub: sub, at: Date.now() })); } catch (e) {}
  }
  window.addEventListener('storage', function (e) { if (e.key !== 'pa2fxfun' || !e.newValue) return; try { var o = JSON.parse(e.newValue); if (Date.now() - o.at < 8000 && /#ecran/.test(location.hash)) enqueue(o.k, o.title, o.sub); } catch (x) {} });
  function view() {
    var U = window.PA_UI, esc = U.esc, ro = window.PA_LEAGUE ? window.PA_LEAGUE.roster().slice().sort(function (a, b) { return a.localeCompare(b, 'fr'); }) : [];
    var big = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:118px;font-size:1.05em;font-weight:700;border-radius:16px';
    var body = '<div class="stack"><a class="back" href="#' + (window.PA_CLUB ? 'home' : 'home') + '">‹ Accueil</a><h1>🎉 Animations pour rire</h1>' +
      '<div class="small muted">Touche une animation : elle se joue tout de suite, en grand avec son bruitage (et sur l’écran télé s’il est ouvert dans une autre fenêtre). Le pseudo est facultatif.</div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><input id="fxName" list="fxNames" autocomplete="off" autocapitalize="characters" placeholder="Pseudo" value="' + esc(FUN.name) + '" class="tn-in" style="flex:1;min-width:140px;min-height:52px;font-size:1.1em">' +
      '<input id="fxBy" list="fxNames" autocomplete="off" autocapitalize="characters" placeholder="Sorti par" value="' + esc(FUN.by) + '" class="tn-in" style="flex:1;min-width:140px;min-height:52px;font-size:1.1em"></div>' +
      '<datalist id="fxNames">' + ro.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">' + LIST.concat(EXTRA).map(function (x) { return '<button class="btn" data-fx="' + x.id + '" style="' + big + '"><span style="font-size:3em;line-height:1">' + x.e + '</span>' + x.name + '</button>'; }).join('') + '</div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><span class="small">Volume :</span>' + [[0.35, 'Doux'], [0.7, 'Moyen'], [1, 'Fort']].map(function (v) { return '<button class="btn' + (Math.abs(C.vol - v[0]) < 0.05 ? ' gold' : '') + '" data-fxvol="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>' +
      (C.on ? '' : '<div class="small" style="color:var(--gold)">Les animations sont coupées pour les sorties du tournoi (Tournoi › Réglages), mais elles se jouent ici quand même.</div>') + '</div>';
    return U.shell('home', body);
  }
  document.addEventListener('input', function (e) { if (!e.target) return; if (e.target.id === 'fxName') FUN.name = e.target.value; if (e.target.id === 'fxBy') FUN.by = e.target.value; });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-fx],[data-fxvol]') : null; if (!t) return;
    if (t.hasAttribute('data-fxvol')) { C.vol = +t.getAttribute('data-fxvol'); saveCfg(); window.PA_UI.render(); fun('canard'); return; }
    fun(t.getAttribute('data-fx'));
  });
  window.PA_FX = { view: view, fun: fun,
    LIST: LIST, cfg: function () { return C; }, set: function (k, v) { C[k] = v; saveCfg(); },
    ko: ko, test: function (k) { if (!C.on) return; enqueue(pick(k || C.def), 'NARUTI sort · 12e', 'éliminé par YO'); },
    _sound: sound
  };
})();
