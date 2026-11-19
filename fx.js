/* Poker Academy — animations sonores et visuelles des éliminations (tournoi du club).
   Sons fabriqués par synthèse (Web Audio) : originaux, sans fichier, hors ligne. */
(function () {
  'use strict';
  var LIST = [
    { id: 'chevre', e: '🐐', name: 'La chèvre qui braille' },
    { id: 'poulet', e: '🐔', name: 'Le poulet et la carotte-missile' },
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
  var SND = {
    chevre: function (a, t) { // « MÊÊÊÊÊ » tremblé, deux fois
      voice(a, t, 1.15, { f0: 420, f1: 360, vib: 9, vibDepth: 38, formant: 1100, formant2: 2400, q: 3, peak: 0.7, att: 0.05, rel: 0.25 });
      voice(a, t + 1.25, 0.8, { f0: 470, f1: 330, vib: 10, vibDepth: 45, formant: 1000, formant2: 2600, q: 3, peak: 0.6, att: 0.04, rel: 0.3 });
      return 2.2;
    },
    poulet: function (a, t) { // missile-carotte, « plop », CRI du poulet, boïng des yeux, puis BOUM
      noise(a, t, 1.6, { ft: 'bandpass', f0: 400, f1: 4000, q: 2, peak: 0.3, att: 1.2, rel: 0.05 }); // le missile arrive (lentement)
      tone(a, t, 1.6, 220, { f1: 1400, type: 'sawtooth', peak: 0.08, lp: 3000, att: 1.0 });
      t += 0.85;
      tone(a, t + 0.75, 0.12, 520, { f1: 90, type: 'sine', peak: 0.8, rel: 0.1 }); noise(a, t + 0.75, 0.07, { f0: 1800, peak: 0.45 }); // plop : la carotte rentre
      // le cri : deux couches dentelées avec un vibrato très rapide, plus un souffle rauque
      [[0, 900, 1650, 1.0], [0.012, 905, 1680, 0.7]].forEach(function (L) {
        voice(a, t + 0.82 + L[0], 0.95, { f0: L[1], f1: L[2], type: 'sawtooth', vib: 31, vibDepth: 120, formant: 1800, formant2: 3200, q: 3, peak: 0.85 * L[3], att: 0.015, rel: 0.25 });
      });
      noise(a, t + 0.82, 0.95, { ft: 'bandpass', f0: 2600, f1: 3600, q: 3, peak: 0.25, att: 0.02, rel: 0.3 });
      voice(a, t + 1.85, 0.35, { f0: 1500, f1: 700, type: 'sawtooth', vib: 28, vibDepth: 90, formant: 1600, q: 3, peak: 0.6, att: 0.01, rel: 0.1 }); // dernier couac
      tone(a, t + 1.15, 0.45, 300, { f1: 1200, type: 'sine', vib: 22, vibDepth: 40, peak: 0.4 }); // boïng des yeux
      tone(a, t + 1.35, 0.4, 350, { f1: 1400, type: 'sine', vib: 25, vibDepth: 45, peak: 0.35 });
      noise(a, t + 2.15, 1.6, { ft: 'lowpass', f0: 2000, f1: 80, peak: 1, att: 0.005, rel: 1.5 }); tone(a, t + 2.15, 1.1, 100, { f1: 30, peak: 0.9, rel: 1 }); // BOUM
      noise(a, t + 2.35, 1.2, { ft: 'bandpass', f0: 1500, f1: 600, q: 1.5, peak: 0.12, att: 0.1 }); // plumes
      return 4.55;
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
    '.pk-jaw{transform-box:view-box;transform-origin:340px 134px}.pk-hit .pk-jaw{animation:pkJaw .09s 10 alternate}@keyframes pkJaw{from{transform:rotate(8deg)}to{transform:rotate(28deg)}}' +
    '.pk-hit .pk-chick{animation:pkJolt .55s ease-out}' +
    '@keyframes pkJolt{0%{transform:scale(1,1)}18%{transform:scale(1.2,.76)}45%{transform:scale(.84,1.24) translateY(-40px)}72%{transform:scale(1.06,.95)}100%{transform:scale(1,1)}}' +
    '.pk-eye{transition:transform .3s cubic-bezier(.3,1.8,.5,1)}.pk-eyes .pk-chick{animation:pkTremble .06s infinite}@keyframes pkTremble{0%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}100%{transform:translate(-1px,-2px)}}' +
    '.pk-eyes .pk-lid{opacity:0}' +
    '.pk-boom .pk-chick,.pk-boom .pk-eye,.pk-boom .pk-lid{animation:pkBoom .35s ease-out forwards;transform-box:view-box;transform-origin:228px 200px}@keyframes pkBoom{to{transform:scale(1.6);opacity:0}}' +
    '@keyframes fxConf{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}@keyframes fxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}';
  function css() { if (document.getElementById('fxCss')) return; var st = document.createElement('style'); st.id = 'fxCss'; st.textContent = CSS; document.head.appendChild(st); }
  function el(cls, txt, style) { var d = document.createElement('div'); d.className = cls; d.textContent = txt; if (style) d.setAttribute('style', style); return d; }
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
    poulet: function (ov) { // poulet façon pâte à modeler : carotte-missile au derrière, cri, yeux qui sortent, explosion
      var W = document.createElement('div'); W.className = 'pk-wrap';
      W.innerHTML = '<svg class="pk" viewBox="0 0 420 340" xmlns="http://www.w3.org/2000/svg"><defs>' +
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
        '</svg>';
      ov.appendChild(W);
      var cod = null, eyes = W.querySelectorAll('.pk-eye');
      eyes[0].setAttribute('transform', 'translate(290 106)'); eyes[1].setAttribute('transform', 'translate(328 104)');
      setTimeout(function () { W.classList.add('pk-look'); }, 700); // il voit arriver la carotte
      setTimeout(function () { W.classList.remove('pk-look'); W.classList.add('pk-in'); }, 1600); // la carotte rentre et disparaît
      setTimeout(function () { // le cri
        W.classList.add('pk-hit');
        cod = el('fx-s', 'CRÔÔÔÂÂÂÂK !', 'top:5%;left:50%;transform:translateX(-50%);color:#f2c14e;font-weight:900;font-size:clamp(34px,8vw,110px)'); ov.appendChild(cod);
      }, 1670);
      setTimeout(function () { // les yeux sortent des orbites
        W.classList.add('pk-eyes');
        eyes[0].setAttribute('transform', 'translate(300 58) scale(2)'); eyes[1].setAttribute('transform', 'translate(352 50) scale(1.85)');
        W.querySelectorAll('.pk-stalk').forEach(function (l, k) { l.setAttribute('x2', k ? '-13' : '-6'); l.setAttribute('y2', k ? '26' : '25'); });
      }, 2000);
      setTimeout(function () { // BOUM
        if (cod && cod.parentNode) cod.parentNode.removeChild(cod); W.classList.add('pk-boom'); ov.style.animation = 'fxShake .12s 7'; ov.style.background = 'rgba(255,150,0,.6)'; setTimeout(function () { ov.style.background = 'rgba(0,0,0,.72)'; }, 260);
        ov.appendChild(el('fx-e', '💥', 'left:30%;top:20%;animation:fxBoom 1s ease-out forwards'));
        ov.appendChild(el('fx-s', 'BOUM !', 'top:6%;left:50%;transform:translateX(-50%);color:#ff5a3c;font-weight:900;font-size:clamp(50px,12vw,150px)'));
        var bits = ['🪶', '🪶', '🪶', '🪶', '🍗', '🪶', '🪶', '👀', '🪶'];
        for (var i = 0; i < 30; i++) { var g = Math.random() * Math.PI * 2, r = 30 + Math.random() * 40; ov.appendChild(el('fx-s', bits[i % bits.length], 'left:46%;top:44%;font-size:clamp(26px,6vw,74px);--dx:' + (Math.cos(g) * r).toFixed(1) + 'vw;--dy:' + (Math.sin(g) * r).toFixed(1) + 'vh;--r:' + (Math.random() * 900 - 450).toFixed(0) + 'deg;animation:fxFeather ' + (1.1 + Math.random()).toFixed(2) + 's ease-out forwards')); }
      }, 3000);
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
