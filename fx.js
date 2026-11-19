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
    { id: 'canard', e: '🦆', name: 'Le canard' },
    { id: 'caisse', e: '💸', name: 'La caisse enregistreuse' }
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
  // voix off (fichier mp3 intégré, joué dans le mixeur pour suivre le volume)
  var VO = 'data:audio/mpeg;base64,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xIuARaQxeaSYZPChB6x0kwjq5LcsoPiX9QMtCmSSNxUPHlUj9Bl1Auz9wS+pbiBENUMmyV1NlEqqkmojYNCkRFjpw6URsPGCUKhkBCqTKhcz+PFEf/VVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVV//skxJIABVw9X6SYxMC7CGo0kySoVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//skxJaABXBJWaSIyHC0EmowxAi2VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//skxJuARXhPPSCZIcCZiOMAMCSIVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV', VOBUF = null;
  function vo(a, when) {
    function go(b) { var s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = 1.3; s.connect(g); g.connect(MASTER); s.start(Math.max(when, a.currentTime)); }
    if (VOBUF) return go(VOBUF);
    try { var bin = atob(VO.split(',')[1]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      a.decodeAudioData(u.buffer, function (b) { VOBUF = b; go(b); }, function () {}); } catch (e) {}
  }
  var SND = {
    chevre: function (a, t) { // « MÊÊÊÊÊ » tremblé, deux fois
      voice(a, t, 1.15, { f0: 420, f1: 360, vib: 9, vibDepth: 38, formant: 1100, formant2: 2400, q: 3, peak: 0.7, att: 0.05, rel: 0.25 });
      voice(a, t + 1.25, 0.8, { f0: 470, f1: 330, vib: 10, vibDepth: 45, formant: 1000, formant2: 2600, q: 3, peak: 0.6, att: 0.04, rel: 0.3 });
      return 2.2;
    },
    poulet: function (a, t) { // vraie carotte, TCHONK, cri, cot-cot, chute en PLS, voix off
      tone(a, t, 1.35, 1900, { f1: 520, type: 'sine', peak: 0.22, att: 0.08, rel: 0.08 }); // sifflement de la carotte
      noise(a, t, 1.35, { ft: 'bandpass', f0: 600, f1: 3000, q: 3, peak: 0.12, att: 1.0, rel: 0.05 });
      tone(a, t + 1.4, 0.3, 190, { f1: 55, type: 'sine', peak: 0.95, att: 0.003, rel: 0.25 }); // TCHONK
      noise(a, t + 1.4, 0.3, { ft: 'lowpass', f0: 1400, f1: 180, peak: 0.7, att: 0.003, rel: 0.25 });
      tone(a, t + 1.43, 0.2, 800, { f1: 220, type: 'triangle', peak: 0.35, att: 0.003 }); // splotch
      [[0, 950, 1750, 1.0], [0.012, 955, 1790, 0.7]].forEach(function (L) { // le cri
        voice(a, t + 1.5 + L[0], 1.05, { f0: L[1], f1: L[2], type: 'sawtooth', vib: 31, vibDepth: 130, formant: 1800, formant2: 3200, q: 3, peak: 0.85 * L[3], att: 0.015, rel: 0.25 });
      });
      noise(a, t + 1.5, 1.0, { ft: 'bandpass', f0: 2600, f1: 3800, q: 3, peak: 0.22, att: 0.02, rel: 0.3 });
      tone(a, t + 1.8, 0.45, 300, { f1: 1200, type: 'sine', vib: 22, vibDepth: 40, peak: 0.35 }); // boïng des yeux
      noise(a, t + 1.6, 0.9, { ft: 'bandpass', f0: 1800, f1: 700, q: 1.5, peak: 0.15, att: 0.05 }); // plumes
      [0, 0.16, 0.32, 0.48].forEach(function (d, i) { voice(a, t + 2.75 + d, 0.1, { f0: 620 + i * 25, f1: 520, type: 'sawtooth', formant: 1300, formant2: 2600, q: 3, peak: 0.5, att: 0.005, rel: 0.05 }); }); // cot cot cot cot
      voice(a, t + 3.4, 0.55, { f0: 700, f1: 1150, type: 'sawtooth', vib: 12, vibDepth: 40, formant: 1500, formant2: 2900, q: 3, peak: 0.55, att: 0.02, rel: 0.2 }); // codêêêk
      tone(a, t + 3.75, 0.35, 140, { f1: 50, type: 'sine', peak: 0.9, att: 0.004, rel: 0.3 }); noise(a, t + 3.75, 0.3, { ft: 'lowpass', f0: 900, f1: 120, peak: 0.6, att: 0.004 }); // flop, il tombe
      voice(a, t + 3.95, 0.6, { f0: 520, f1: 300, type: 'sawtooth', vib: 7, vibDepth: 30, formant: 1200, formant2: 2400, q: 3, peak: 0.35, att: 0.05, rel: 0.3 }); // petit gémissement
      vo(a, t + 4.15); // « C'est pas carré… mais tu t'es fait fourrer ! »
      return 7.0;
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
    caisse: function (a, t) { // touches mécaniques, tiroir qui s'ouvre, « KA-CHING » et pièces
      [0, 0.09, 0.18].forEach(function (d) { noise(a, t + d, 0.04, { ft: 'bandpass', f0: 2200, q: 4, peak: 0.5 }); tone(a, t + d, 0.05, 420, { type: 'square', peak: 0.12, lp: 2000 }); });
      noise(a, t + 0.32, 0.38, { ft: 'lowpass', f0: 900, f1: 300, peak: 0.45, att: 0.02, rel: 0.2 }); // le tiroir glisse
      tone(a, t + 0.66, 0.08, 120, { type: 'triangle', peak: 0.7, rel: 0.07 }); noise(a, t + 0.66, 0.06, { f0: 3000, peak: 0.5 }); // il bute
      [2637, 3520, 5274].forEach(function (f, i) { tone(a, t + 0.7, 1.3 - i * 0.2, f, { type: 'sine', peak: 0.32 / (i + 1), att: 0.003, rel: 1.2 - i * 0.2 }); }); // la clochette
      for (var i = 0; i < 7; i++) tone(a, t + 1.0 + i * 0.08 + Math.random() * 0.03, 0.12, 3000 + Math.random() * 1500, { type: 'triangle', peak: 0.1, att: 0.002 });
      return 2.2;
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
    '.pk-wrap{position:absolute;left:50%;top:44%;width:min(94vw,760px);transform:translate(-50%,-50%)}.pk{width:100%;height:auto;overflow:visible;filter:drop-shadow(0 12px 22px rgba(0,0,0,.55))}' +
    '.pk-chick{transform-box:view-box;transform-origin:228px 312px;animation:pkIdle .5s ease-in-out infinite alternate}@keyframes pkIdle{from{transform:scale(1,1)}to{transform:scale(1.02,.985)}}' +
    '.pk-missile{transform:translate(-260px,214px);animation:pkFly 1.6s linear forwards}.pk-fire{animation:pkFlick .07s infinite alternate}' +
    '@keyframes pkFly{0%{transform:translate(-330px,190px) rotate(-6deg) scale(1.5)}35%{transform:translate(-210px,176px) rotate(-4deg) scale(1.5)}65%{transform:translate(-90px,200px) rotate(5deg) scale(1.5)}88%{transform:translate(-5px,210px) rotate(4deg) scale(1.5)}100%{transform:translate(45px,206px) rotate(4deg) scale(1.5)}}' +
    '.pk-pup{transition:transform .3s}.pk-look .pk-pup{transform:translate(-12px,2px)}@keyframes pkFlick{from{opacity:.65;transform:scaleX(.8)}to{opacity:1;transform:scaleX(1.25)}}' +
    '.pk-in .pk-missile{animation:pkIn .14s ease-in forwards}@keyframes pkIn{from{transform:translate(45px,206px) rotate(4deg) scale(1.5);opacity:1}to{transform:translate(128px,208px) rotate(4deg) scale(.15,.4);opacity:0}}' +
    '.pk-in .pk-puff{animation:pkPuff .7s ease-out forwards}@keyframes pkPuff{0%{opacity:.95;transform:translate(0,0) scale(.4)}100%{opacity:0;transform:translate(-40px,-30px) scale(1.6)}}' +
    '.pk-wing{transform-box:view-box;transform-origin:256px 182px}.pk-wing2{transform-box:view-box;transform-origin:248px 150px;opacity:0}' +
    '.pk-in .pk-wing{animation:pkFlap .11s 13 alternate ease-in-out}.pk-in .pk-wing2{opacity:1;animation:pkFlap2 .11s 13 alternate ease-in-out}' +
    '@keyframes pkFlap{from{transform:rotate(-8deg)}to{transform:rotate(58deg) scale(1.1,1.15)}}@keyframes pkFlap2{from{transform:rotate(-15deg)}to{transform:rotate(48deg) scale(1.15)}}' +
    '.cv-wrap{top:46%;width:min(80vw,560px)}.cv-goat{transform-box:view-box;transform-origin:210px 380px;animation:pkIdle .6s ease-in-out infinite alternate}' +
    '.cv-head,.cv-mouth,.cv-chin,.cv-earL,.cv-earR,.cv-lid,.cv-brow,.cv-lip{transform-box:view-box}' +
    '.cv-head{transform-origin:210px 300px;transition:transform .15s}.cv-mouth{transform-origin:210px 214px;transform:scaleY(.05);transition:transform .12s}.cv-chin{transition:transform .12s}' +
    '.cv-earL{transform-origin:150px 118px;transition:transform .15s}.cv-earR{transform-origin:270px 118px;transition:transform .15s}.cv-lid{opacity:0;transition:opacity .1s}.cv-brow{transition:transform .1s}.cv-lip{transition:opacity .1s}' +
    '.cv-bl .cv-head{transform:translateY(-10px) scale(1.04)}.cv-bl .cv-mouth{transform:scale(1.15,1.7);animation:cvMouth .1s infinite alternate}.cv-bl .cv-chin{transform:translateY(44px);animation:cvChin .1s infinite alternate}.cv-bl .cv-lip{opacity:0}' +
    '@keyframes cvMouth{from{transform:scale(1.12,1.55)}to{transform:scale(1.18,1.85)}}@keyframes cvChin{from{transform:translateY(38px)}to{transform:translateY(50px)}}' +
    '.cv-teeth{fill:#fffdf3;stroke:#bdb4a0;stroke-width:1.5;opacity:0;transition:opacity .08s}.cv-bl .cv-teeth{opacity:1}' +
    '.cv-bl .cv-earL{transform:rotate(-22deg)}.cv-bl .cv-earR{transform:rotate(22deg)}.cv-bl .cv-lid{opacity:1}.cv-bl .cv-brow{transform:translateY(-8px)}' +
    '.cv-bl .cv-goat{animation:cvShake .1s infinite alternate}@keyframes cvShake{from{transform:translateX(-3px)}to{transform:translateX(3px)}}' +
    '.p2-car{transform:translate(-330px,60px) rotate(40deg) scale(1.4);animation:p2Fly 1.4s cubic-bezier(.35,.1,.7,.6) forwards}' +
    '@keyframes p2Fly{0%{transform:translate(-330px,60px) rotate(40deg) scale(1.4)}40%{transform:translate(-190px,40px) rotate(14deg) scale(1.4)}75%{transform:translate(-40px,150px) rotate(10deg) scale(1.4)}100%{transform:translate(58px,198px) rotate(10deg) scale(1.4)}}' +
    '.p2-carIn{transition:transform .12s cubic-bezier(.6,0,1,1)}.p2-in .p2-carIn{transform:translateX(34px)}' +
    '.p2-leaves{transform-box:fill-box;transform-origin:100% 50%}.p2-in .p2-leaves{animation:p2Wig .12s infinite alternate ease-in-out}@keyframes p2Wig{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}' +
    '.p2-all{transform-box:view-box;transform-origin:228px 312px}.p2-pls .p2-all{animation:p2Fall .55s cubic-bezier(.5,0,.7,1) forwards}.p2-pls .pk-chick{animation:none}' +
    '@keyframes p2Fall{0%{transform:rotate(0)}70%{transform:translate(-110px,-116px) rotate(96deg)}85%{transform:translate(-110px,-126px) rotate(86deg)}100%{transform:translate(-110px,-122px) rotate(90deg)}}' +
    '.p2-pls .pk-pup{animation:p2Daze .5s linear infinite}@keyframes p2Daze{0%{transform:translate(4px,0)}25%{transform:translate(0,4px)}50%{transform:translate(-4px,0)}75%{transform:translate(0,-4px)}100%{transform:translate(4px,0)}}' +
    '.p2-pls .pk-lid{opacity:0}' +
    '.fx3d{position:absolute;left:0;right:0;top:10%;bottom:14%}.fx3d canvas{display:block;width:100%!important;height:100%!important}' +
    '.pk-jaw{transform-box:view-box;transform-origin:340px 134px}.pk-hit .pk-jaw{animation:pkJaw .09s 10 alternate}@keyframes pkJaw{from{transform:rotate(8deg)}to{transform:rotate(28deg)}}' +
    '.pk-hit .pk-chick{animation:pkJolt .55s ease-out}' +
    '@keyframes pkJolt{0%{transform:scale(1,1)}18%{transform:scale(1.2,.76)}45%{transform:scale(.84,1.24) translateY(-40px)}72%{transform:scale(1.06,.95)}100%{transform:scale(1,1)}}' +
    '.pk-eye{transition:transform .3s cubic-bezier(.3,1.8,.5,1)}.pk-eyes .pk-chick{animation:pkTremble .06s infinite}@keyframes pkTremble{0%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}100%{transform:translate(-1px,-2px)}}' +
    '.pk-eyes .pk-lid{opacity:0}' +
    '.pk-boom .pk-chick,.pk-boom .pk-eye,.pk-boom .pk-lid{animation:pkBoom .35s ease-out forwards;transform-box:view-box;transform-origin:228px 200px}@keyframes pkBoom{to{transform:scale(1.6);opacity:0}}' +
    '@keyframes fxConf{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}@keyframes fxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}';
  function css() { if (document.getElementById('fxCss')) return; var st = document.createElement('style'); st.id = 'fxCss'; st.textContent = CSS; document.head.appendChild(st); }
  function el(cls, txt, style) { var d = document.createElement('div'); d.className = cls; d.textContent = txt; if (style) d.setAttribute('style', style); return d; }
  // three.js + fx3d.js ne sont chargés que pour les animations en 3D
  var W3 = null;
  function need3d(cb) {
    if (window.PA_FX3D && window.THREE) return cb();
    if (W3) { W3.push(cb); return; } W3 = [cb];
    function add(src, next) { var sc = document.createElement('script'); sc.src = src; sc.onload = next; sc.onerror = next; document.head.appendChild(sc); }
    add('lib/three.min.js', function () { add('fx3d.js', function () { var w = W3; W3 = null; w.forEach(function (f) { try { f(); } catch (e) {} }); }); });
  }
  function PKSVG() { return '<svg class="pk" viewBox="0 0 420 340" xmlns="http://www.w3.org/2000/svg"><defs>' +
          '<filter id="pkClay" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
            '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 0.62" result="g"/><feComposite in="g" in2="d" operator="in" result="tex"/>' +
            '<feMerge><feMergeNode in="d"/><feMergeNode in="tex"/></feMerge></filter>' +
          '<radialGradient id="pkBody" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#fffdf7"/><stop offset=".5" stop-color="#f3ece0"/><stop offset=".85" stop-color="#d8cdbb"/><stop offset="1" stop-color="#b8aa94"/></radialGradient>' +
          '<radialGradient id="pkRed" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ff7468"/><stop offset=".6" stop-color="#e2262a"/><stop offset="1" stop-color="#9e0f17"/></radialGradient>' +
          '<radialGradient id="pkLeg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffc24a"/><stop offset="1" stop-color="#d77400"/></radialGradient>' +
          '<linearGradient id="pkBeak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd54d"/><stop offset="1" stop-color="#e58a00"/></linearGradient>' +
          '<radialGradient id="pkEye" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".8" stop-color="#f1f1f1"/><stop offset="1" stop-color="#cfcfcf"/></radialGradient>' +
          '<linearGradient id="pkCar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb04a"/><stop offset=".5" stop-color="#ff7a00"/><stop offset="1" stop-color="#c24e00"/></linearGradient>' +
          '<radialGradient id="pkFire" cx="80%" cy="50%" r="80%"><stop offset="0" stop-color="#fff6a0"/><stop offset=".45" stop-color="#ffb400"/><stop offset="1" stop-color="#ff3d00" stop-opacity="0"/></radialGradient>' +
          '<radialGradient id="pkShadow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
          '<ellipse cx="228" cy="318" rx="120" ry="15" fill="url(#pkShadow)"/>' +
          '<g class="pk-chick"><g filter="url(#pkClay)">' +
            // pattes trapues, trois doigts
            '<g fill="url(#pkLeg)" stroke="#a85a00" stroke-width="2"><rect x="196" y="252" width="16" height="50" rx="8"/><rect x="246" y="252" width="16" height="50" rx="8"/>' +
            '<ellipse cx="190" cy="304" rx="16" ry="7"/><ellipse cx="206" cy="307" rx="15" ry="7"/><ellipse cx="221" cy="304" rx="14" ry="7"/>' +
            '<ellipse cx="241" cy="304" rx="14" ry="7"/><ellipse cx="257" cy="307" rx="15" ry="7"/><ellipse cx="272" cy="304" rx="15" ry="7"/></g>' +
            // queue en boules de pâte
            '<g fill="url(#pkBody)" stroke="#a89a84" stroke-width="2"><ellipse cx="112" cy="128" rx="24" ry="40" transform="rotate(-28 112 128)"/><ellipse cx="96" cy="160" rx="22" ry="36" transform="rotate(-52 96 160)"/><ellipse cx="134" cy="112" rx="20" ry="34" transform="rotate(-8 134 112)"/></g>' +
            '<g class="pk-wing2"><path d="M250 150 C236 104 190 84 150 98 C170 130 206 152 250 150 z" fill="url(#pkBody)" stroke="#a89a84" stroke-width="2.5"/></g>' +
            // corps dodu
            '<path d="M120 196 C118 130 170 96 230 98 C300 100 334 150 330 206 C326 262 280 286 222 286 C160 286 122 254 120 196 z" fill="url(#pkBody)" stroke="#a89a84" stroke-width="2.5"/>' +
            '<path d="M168 150 q-18 30 4 62" stroke="#c9bca6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' +
            // aile
            '<g class="pk-wing"><path d="M176 178 C186 150 244 148 262 182 C270 206 238 226 204 222 C182 218 168 202 176 178 z" fill="url(#pkBody)" stroke="#a89a84" stroke-width="2.5"/>' +
            '<path d="M196 196 q20 10 44 2 M200 208 q18 6 36 0" stroke="#c4b69e" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>' +
            // tête
            '<ellipse cx="300" cy="118" rx="64" ry="60" fill="url(#pkBody)" stroke="#a89a84" stroke-width="2.5"/>' +
            // crête en trois boudins
            '<g fill="url(#pkRed)" stroke="#8a0d14" stroke-width="2"><ellipse cx="272" cy="62" rx="15" ry="20" transform="rotate(-20 272 62)"/><ellipse cx="295" cy="52" rx="16" ry="23"/><ellipse cx="319" cy="58" rx="15" ry="20" transform="rotate(18 319 58)"/></g>' +
            // joues
            '<ellipse cx="282" cy="146" rx="14" ry="8" fill="#ff9aa0" opacity=".55"/>' +
          '</g>' +
            // gros yeux collés façon pâte à modeler (pas de filtre : bien nets)
            '<g class="pk-eye pk-e1"><line x1="0" y1="0" x2="0" y2="0" class="pk-stalk" stroke="#d24d4d" stroke-width="5" stroke-linecap="round"/><ellipse rx="21" ry="24" fill="url(#pkEye)" stroke="#6b6b6b" stroke-width="2"/><circle class="pk-pup" cx="7" cy="3" r="8" fill="#141414"/><circle cx="10" cy="-1" r="2.6" fill="#fff"/></g>' +
            '<g class="pk-eye pk-e2"><line x1="0" y1="0" x2="0" y2="0" class="pk-stalk" stroke="#d24d4d" stroke-width="5" stroke-linecap="round"/><ellipse rx="19" ry="22" fill="url(#pkEye)" stroke="#6b6b6b" stroke-width="2"/><circle class="pk-pup" cx="6" cy="3" r="7.5" fill="#141414"/><circle cx="9" cy="-1" r="2.4" fill="#fff"/></g>' +
            '<path class="pk-lid" d="M276 86 q20 -10 40 0 M316 84 q18 -8 34 2" stroke="#6b5a45" stroke-width="5" stroke-linecap="round" fill="none"/>' +
            // bec en deux parties (le bas s’ouvre pour crier) et barbillon
            '<g filter="url(#pkClay)"><path d="M346 130 q12 18 -2 34 q-16 -2 -12 -22 z" fill="url(#pkRed)" stroke="#8a0d14" stroke-width="2"/>' +
            '<g class="pk-jaw"><path d="M338 130 L386 138 Q372 152 340 146 z" fill="url(#pkBeak)" stroke="#a85e00" stroke-width="2"/></g>' +
            '<path d="M336 112 Q388 116 398 130 Q370 134 338 132 z" fill="url(#pkBeak)" stroke="#a85e00" stroke-width="2"/><circle cx="352" cy="120" r="2.2" fill="#a85e00"/></g>' +
          '</g>' +
          '<g class="pk-missile"><ellipse cx="-34" cy="0" rx="46" ry="16" fill="url(#pkFire)" class="pk-fire"/>' +
            '<path d="M-8 -9 l-22 -10 M-8 -2 l-28 -2 M-8 6 l-22 12" stroke="#3aa635" stroke-width="7" stroke-linecap="round"/>' +
            '<path d="M-8 -14 L62 0 L-8 14 Q-14 0 -8 -14 z" fill="url(#pkCar)" stroke="#a84300" stroke-width="2"/>' +
            '<path d="M10 -8 l4 6 M26 -5 l3 5 M40 -3 l2 4" stroke="#a84300" stroke-width="2"/></g>' +
          '<g class="pk-puff" opacity="0"><circle cx="122" cy="214" r="14" fill="#ddd"/><circle cx="108" cy="204" r="10" fill="#eee"/><circle cx="110" cy="226" r="9" fill="#ccc"/></g>' +
          '</svg>'; }
  var SCENE = {
    chevre: function (ov) { // chèvre de face, en volume façon pâte à modeler : la gueule s'ouvre à chaque bêlement
      var W = document.createElement('div'); W.className = 'pk-wrap cv-wrap';
      W.innerHTML = '<svg class="pk" viewBox="0 0 420 400" xmlns="http://www.w3.org/2000/svg"><defs>' +
        '<filter id="cvClay" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 0.62" result="g"/><feComposite in="g" in2="d" operator="in" result="tex"/>' +
          '<feMerge><feMergeNode in="d"/><feMergeNode in="tex"/></feMerge></filter>' +
        '<radialGradient id="cvFur" cx="42%" cy="30%" r="75%"><stop offset="0" stop-color="#fffaf2"/><stop offset=".45" stop-color="#ece2d2"/><stop offset=".8" stop-color="#c9b89c"/><stop offset="1" stop-color="#9e8c70"/></radialGradient>' +
        '<radialGradient id="cvBody" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#f3eadc"/><stop offset=".6" stop-color="#d4c4aa"/><stop offset="1" stop-color="#8f7e64"/></radialGradient>' +
        '<radialGradient id="cvMuz" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#fbe3d6"/><stop offset=".7" stop-color="#e7bfae"/><stop offset="1" stop-color="#b98f7d"/></radialGradient>' +
        '<radialGradient id="cvDark" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#8a6a4c"/><stop offset="1" stop-color="#3f2a18"/></radialGradient>' +
        '<linearGradient id="cvHorn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8d7d63"/><stop offset=".5" stop-color="#d9cdb4"/><stop offset="1" stop-color="#a39478"/></linearGradient>' +
        '<radialGradient id="cvMouth" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#8e1426"/><stop offset="1" stop-color="#2a0308"/></radialGradient>' +
        '<radialGradient id="cvEye" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffe98a"/><stop offset=".8" stop-color="#e3b93a"/><stop offset="1" stop-color="#a87c10"/></radialGradient>' +
        '<radialGradient id="cvShadow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
        '<ellipse cx="210" cy="384" rx="150" ry="14" fill="url(#cvShadow)"/>' +
        '<g class="cv-goat">' +
        '<g filter="url(#cvClay)">' +
          // poitrail et pattes avant (vus de face)
          '<g fill="url(#cvBody)" stroke="#8f7e64" stroke-width="2"><rect x="150" y="300" width="34" height="76" rx="16"/><rect x="236" y="300" width="34" height="76" rx="16"/></g>' +
          '<g fill="url(#cvDark)"><ellipse cx="167" cy="376" rx="22" ry="9"/><ellipse cx="253" cy="376" rx="22" ry="9"/></g>' +
          '<ellipse cx="210" cy="290" rx="128" ry="74" fill="url(#cvBody)" stroke="#8f7e64" stroke-width="2.5"/>' +
          '<path d="M150 300 q60 30 120 0" stroke="#bfae92" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '</g>' +
        '<g class="cv-head"><g filter="url(#cvClay)">' +
          // cornes qui montent et s’écartent
          '<path d="M178 74 C170 40 150 18 122 12 C140 28 152 50 158 84 z" fill="url(#cvHorn)" stroke="#6f6048" stroke-width="2"/>' +
          '<path d="M242 74 C250 40 270 18 298 12 C280 28 268 50 262 84 z" fill="url(#cvHorn)" stroke="#6f6048" stroke-width="2"/>' +
          '<path d="M160 56 l10 -4 M156 42 l9 -5 M260 56 l-10 -4 M264 42 l-9 -5" stroke="#8d7d63" stroke-width="2.5" stroke-linecap="round"/>' +
          // oreilles tombantes sur les côtés
          '<g class="cv-earL"><ellipse cx="112" cy="128" rx="48" ry="17" transform="rotate(18 112 128)" fill="url(#cvFur)" stroke="#9e8c70" stroke-width="2.5"/><ellipse cx="108" cy="129" rx="32" ry="8" transform="rotate(18 108 129)" fill="#e8a7a0"/></g>' +
          '<g class="cv-earR"><ellipse cx="308" cy="128" rx="48" ry="17" transform="rotate(-18 308 128)" fill="url(#cvFur)" stroke="#9e8c70" stroke-width="2.5"/><ellipse cx="312" cy="129" rx="32" ry="8" transform="rotate(-18 312 129)" fill="#e8a7a0"/></g>' +
          // tête : large en haut, museau long qui vient vers nous
          '<path d="M146 104 C142 50 278 50 274 104 C272 150 256 176 254 210 C252 250 168 250 166 210 C164 176 148 150 146 104 z" fill="url(#cvFur)" stroke="#9e8c70" stroke-width="2.5"/>' +
          '<path d="M196 70 q14 -14 28 0 q-6 -4 -14 6 q-8 -10 -14 -6 z" fill="#d9ccb6"/>' +
          '<path d="M170 150 q-6 30 6 54 M250 150 q6 30 -6 54" stroke="#cdbfa6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>' +
          // intérieur de la gueule (caché quand elle est fermée)
          '<g class="cv-mouth"><ellipse cx="210" cy="232" rx="30" ry="22" fill="url(#cvMouth)"/><ellipse cx="210" cy="246" rx="18" ry="8" fill="#e2627a"/>' +'</g>' +
          // museau rose
          '<ellipse cx="210" cy="206" rx="46" ry="30" fill="url(#cvMuz)" stroke="#a87e6c" stroke-width="2"/>' +
          '<path d="M192 196 q-6 6 -2 12 M228 196 q6 6 2 12" stroke="#5a2e22" stroke-width="5" stroke-linecap="round" fill="none"/>' +
          '<path class="cv-lip" d="M196 226 q14 8 28 0" stroke="#7a4a3a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<ellipse cx="196" cy="190" rx="10" ry="5" fill="#fff" opacity=".35"/>' +
          '<g class="cv-teeth"><rect x="186" y="230" width="11" height="13" rx="3"/><rect x="198" y="231" width="11" height="15" rx="3"/><rect x="210" y="231" width="11" height="15" rx="3"/><rect x="222" y="230" width="11" height="13" rx="3"/></g>' +
          // menton + barbiche (descendent quand elle braie)
          '<g class="cv-chin"><path d="M182 228 Q210 246 238 228 Q236 252 210 256 Q184 252 182 228 z" fill="url(#cvMuz)" stroke="#a87e6c" stroke-width="2"/>' +
            '<g class="cv-teeth"><rect x="190" y="225" width="10" height="11" rx="3"/><rect x="201" y="227" width="9" height="11" rx="3"/><rect x="211" y="227" width="9" height="11" rx="3"/><rect x="221" y="225" width="10" height="11" rx="3"/></g>' +
            '<path class="cv-beard" d="M194 248 C192 280 202 304 210 318 C218 304 228 280 226 248 z" fill="url(#cvDark)" stroke="#2e1d0f" stroke-width="2"/></g>' +
        '</g>' +
          // yeux de chèvre (pupille horizontale), sur les côtés, nets
          '<g class="cv-eye"><ellipse cx="172" cy="118" rx="17" ry="15" fill="url(#cvEye)" stroke="#5b4a35" stroke-width="2.5"/><rect x="160" y="114" width="24" height="7" rx="3.5" fill="#141414"/><circle cx="178" cy="112" r="3" fill="#fff"/>' +
            '<ellipse cx="248" cy="118" rx="17" ry="15" fill="url(#cvEye)" stroke="#5b4a35" stroke-width="2.5"/><rect x="236" y="114" width="24" height="7" rx="3.5" fill="#141414"/><circle cx="254" cy="112" r="3" fill="#fff"/></g>' +
          '<g class="cv-lid" fill="#e4d8c4" stroke="#5b4a35" stroke-width="2"><path d="M154 116 Q172 96 190 116 Q172 108 154 116 z"/><path d="M230 116 Q248 96 266 116 Q248 108 230 116 z"/></g>' +
          '<path class="cv-brow" d="M152 96 q20 -12 40 0 M228 96 q20 -12 40 0" stroke="#6b5a45" stroke-width="5" stroke-linecap="round" fill="none"/>' +
        '</g></g></svg>';
      ov.appendChild(W);
      var me = el('fx-s', 'MÊÊÊÊÊ !', 'top:4%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900;font-size:clamp(40px,10vw,130px);opacity:0'); ov.appendChild(me);
      function bl(on, txt) { W.classList.toggle('cv-bl', on); if (on) { me.textContent = txt; me.style.opacity = 1; me.style.animation = 'fxPulse .2s infinite'; } else { me.style.opacity = 0; me.style.animation = ''; } }
      setTimeout(function () { bl(true, 'MÊÊÊÊÊ !'); }, 80);
      setTimeout(function () { bl(false); }, 1200);
      setTimeout(function () { bl(true, 'MÊÊÊÊÊÊÊ !!'); }, 1320);
      setTimeout(function () { bl(false); }, 2100);
    },
    poulet: function (ov) { // poulet en 3D : vraie carotte, cri, yeux qui sortent, puis PLS et voix off
      var gl = false; try { var c = document.createElement('canvas'); gl = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) {}
      if (!gl) return SCENE.poulet2d(ov);
      var box = document.createElement('div'); box.className = 'fx3d'; ov.appendChild(box);
      var t0 = performance.now(), txt = null;
      need3d(function () { if (window.PA_FX3D) window.PA_FX3D.poulet(box, t0, function () { box.remove(); SCENE.poulet2d(ov); }); });
      function say(t, st) { if (!txt) { txt = el('fx-s', '', ''); ov.appendChild(txt); } txt.textContent = t; txt.setAttribute('style', st); }
      setTimeout(function () { say('TCHONK !', 'top:8%;left:10%;color:#ff8a1e;font-weight:900;font-size:clamp(34px,8vw,100px);transform:rotate(-12deg)'); }, 1400);
      setTimeout(function () { say('CRÔÔÔÂÂÂÂK !', 'top:5%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900;font-size:clamp(34px,8vw,110px)'); }, 1480);
      setTimeout(function () { say('cot… cot… CODÊÊÊK ?!', 'top:5%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900;font-size:clamp(26px,6vw,72px)'); }, 2750);
      setTimeout(function () { if (txt) txt.style.opacity = 0; }, 3500);
      setTimeout(function () { say('« C’est pas carré… mais tu t’es fait fourrer ! »', 'left:4%;right:4%;top:6%;white-space:normal;text-align:center;color:#fff;font-style:italic;font-weight:800;font-size:clamp(24px,5.5vw,64px);line-height:1.2'); }, 4150);
    },
    poulet2d: function (ov) { // (repli sans 3D) le poulet en pâte (v1) prend une vraie carotte, puis tombe en PLS (si la 3D n'est pas disponible)
      var W = document.createElement('div'); W.className = 'pk-wrap p2-wrap';
      var car = '<g class="p2-car"><g class="p2-carIn"><path d="M0 -15 C30 -14 70 -6 96 0 C70 6 30 14 0 15 C-6 8 -6 -8 0 -15 z" fill="url(#pkCar)" stroke="#9a3f00" stroke-width="2"/>' +
          '<path d="M18 -11 q3 5 0 10 M36 -9 q3 5 0 9 M54 -6 q2 4 0 7 M72 -4 q2 3 0 5" stroke="#a84a05" stroke-width="2" fill="none" stroke-linecap="round"/>' +
          '<g class="p2-leaves" stroke="#2f8f2a" stroke-width="5" stroke-linecap="round" fill="none"><path d="M-2 -4 C-20 -18 -34 -22 -50 -34"/><path d="M-2 0 C-24 -4 -42 -2 -60 -10"/><path d="M-2 4 C-22 10 -38 16 -52 26"/>' +
          '<g fill="#3fae35" stroke="#2a7a24" stroke-width="1.5"><ellipse cx="-50" cy="-36" rx="10" ry="5" transform="rotate(-35 -50 -36)"/><ellipse cx="-38" cy="-26" rx="8" ry="4" transform="rotate(-30 -38 -26)"/><ellipse cx="-62" cy="-11" rx="10" ry="5" transform="rotate(-12 -62 -11)"/><ellipse cx="-46" cy="-5" rx="8" ry="4" transform="rotate(-8 -46 -5)"/><ellipse cx="-54" cy="28" rx="10" ry="5" transform="rotate(30 -54 28)"/><ellipse cx="-38" cy="16" rx="8" ry="4" transform="rotate(32 -38 16)"/></g></g></g></g>';
      var svg = PKSVG(), m0 = svg.indexOf('<g class="pk-missile">'), m1 = svg.indexOf('<g class="pk-puff"');
      svg = svg.slice(0, m0) + svg.slice(m1); // pas de missile
      svg = svg.replace('<ellipse cx="228" cy="318"', '<g class="p2-all"><ellipse cx="228" cy="318"').replace('<g class="pk-chick">', car + '<g class="pk-chick">').replace('<g class="pk-puff"', '</g><g class="pk-puff"');
      W.innerHTML = svg; ov.appendChild(W);
      var txt = null, eyes = W.querySelectorAll('.pk-eye');
      eyes[0].setAttribute('transform', 'translate(290 106)'); eyes[1].setAttribute('transform', 'translate(328 104)');
      function say(t, st) { if (!txt) { txt = el('fx-s', '', ''); ov.appendChild(txt); } txt.textContent = t; txt.setAttribute('style', st); }
      setTimeout(function () { W.classList.add('pk-look'); }, 500); // il voit arriver la carotte
      setTimeout(function () { // TCHONK : la carotte rentre, il ne reste que les fanes
        W.classList.remove('pk-look'); W.classList.add('p2-in');
        say('TCHONK !', 'top:8%;left:10%;color:#ff8a1e;font-weight:900;font-size:clamp(34px,8vw,100px);transform:rotate(-12deg)');
      }, 1400);
      setTimeout(function () { // le cri
        W.classList.add('pk-hit', 'pk-in');
        say('CRÔÔÔÂÂÂÂK !', 'top:5%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900;font-size:clamp(34px,8vw,110px)');
        for (var i = 0; i < 10; i++) { var g = Math.random() * Math.PI * 2, r = 20 + Math.random() * 30; ov.appendChild(el('fx-s', '🪶', 'left:38%;top:48%;font-size:clamp(20px,5vw,56px);--dx:' + (Math.cos(g) * r).toFixed(1) + 'vw;--dy:' + (Math.sin(g) * r).toFixed(1) + 'vh;--r:' + (Math.random() * 900 - 450).toFixed(0) + 'deg;animation:fxFeather ' + (1.4 + Math.random()).toFixed(2) + 's ease-out forwards')); }
      }, 1480);
      setTimeout(function () { // les yeux sortent des orbites
        W.classList.add('pk-eyes');
        eyes[0].setAttribute('transform', 'translate(300 58) scale(2)'); eyes[1].setAttribute('transform', 'translate(352 50) scale(1.85)');
        W.querySelectorAll('.pk-stalk').forEach(function (l, k) { l.setAttribute('x2', k ? '-13' : '-6'); l.setAttribute('y2', k ? '26' : '25'); });
      }, 1800);
      setTimeout(function () { say('cot… cot… CODÊÊÊK ?!', 'top:5%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900;font-size:clamp(26px,6vw,72px)'); }, 2750);
      setTimeout(function () { // il tombe sur le côté, en PLS
        if (txt) txt.style.opacity = 0;
        eyes[0].setAttribute('transform', 'translate(290 106)'); eyes[1].setAttribute('transform', 'translate(328 104)');
        W.querySelectorAll('.pk-stalk').forEach(function (l) { l.setAttribute('x2', '0'); l.setAttribute('y2', '0'); });
        W.classList.remove('pk-eyes', 'pk-hit', 'pk-in'); W.classList.add('p2-pls');
        setTimeout(function () { ov.appendChild(el('fx-s', '💫', 'left:62%;top:44%;font-size:clamp(40px,9vw,110px);animation:fxPulse .4s infinite')); }, 500);
      }, 3500);
      setTimeout(function () { // la voix off
        say('« C’est pas carré… mais tu t’es fait fourrer ! »', 'left:4%;right:4%;top:6%;white-space:normal;text-align:center;color:#fff;font-style:italic;font-weight:800;font-size:clamp(24px,5.5vw,64px);line-height:1.2');
      }, 4150);
    },
    trombone: function (ov) { ov.appendChild(el('fx-e', '🎺', 'left:8%;top:22%;transform:rotate(-20deg)')); ov.appendChild(el('fx-e', '😢', 'right:10%;top:22%;animation:fxSink 3s ease-in forwards')); },
    bombe: function (ov) {
      var b = el('fx-e', '💣', 'animation:fxGrow 1.1s ease-in forwards'); ov.appendChild(b);
      setTimeout(function () { b.textContent = '💥'; b.style.animation = 'fxBoom 1s ease-out forwards'; ov.style.animation = 'fxShake .12s 6'; ov.style.background = 'rgba(255,140,0,.55)'; setTimeout(function () { ov.style.background = 'rgba(0,0,0,.72)'; }, 250); }, 1100);
    },
    tombe: function (ov) { ov.appendChild(el('fx-e', '🪦', 'top:14%;animation:fxRise .9s ease-out')); ov.appendChild(el('fx-s', '🕯️', 'left:22%;top:34%')); ov.appendChild(el('fx-s', '🕯️', 'right:22%;top:34%')); },
    canard: function (ov) { var d = el('fx-e', '🦆', 'left:40%;top:45%'); ov.appendChild(d); ov.appendChild(el('fx-s', 'COIN !', 'top:12%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900')); setTimeout(function () { d.style.animation = 'fxFly 1.1s ease-in forwards'; }, 800); },
    caisse: function (ov) {
      var c = el('fx-e', '💰', 'top:18%;animation:fxPulse .3s 3'); ov.appendChild(c);
      ov.appendChild(el('fx-s', 'KA-CHING !', 'top:8%;left:50%;transform:translateX(-50%);color:#3ddc84;font-weight:900'));
      setTimeout(function () {
        var b = ['💵', '💶', '💸', '💵', '💶'];
        for (var i = 0; i < 26; i++) { var a = Math.random() * Math.PI * 2, r = 35 + Math.random() * 30; ov.appendChild(el('fx-s', b[i % 5], 'left:46%;top:34%;font-size:clamp(34px,7vw,90px);--dx:' + (Math.cos(a) * r).toFixed(1) + 'vw;--dy:' + (Math.sin(a) * r - 15).toFixed(1) + 'vh;--r:' + (Math.random() * 900 - 450).toFixed(0) + 'deg;animation:fxFeather ' + (1.2 + Math.random() * 0.9).toFixed(2) + 's ' + (Math.random() * 0.35).toFixed(2) + 's ease-out forwards')); }
      }, 650);
    },
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
