/* Poker Academy v2.0 — interface */
(function () {
  'use strict';
  var PA = window.PA, $ = function (s, r) { return (r || document).querySelector(s); };
  var VERSION = '2.0.0-s';
  var EMBED = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- Icônes ---------- */
  var IC = {
    home: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11L12 4L21 11V20H15V14H9V20H3Z" fill="currentColor"/></svg>',
    book: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5C5.5 4.5 8.5 4.5 12 6.5C15.5 4.5 18.5 4.5 21 5.5V19C18.5 18 15.5 18 12 20C8.5 18 5.5 18 3 19Z M12 6.5V20" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    cards: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="11" height="15" rx="2" transform="rotate(-10 8.5 12.5)" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="10" y="4" width="11" height="15" rx="2" transform="rotate(8 15.5 11.5)" stroke="currentColor" stroke-width="1.8" fill="#131316"/></svg>',
    chart: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20V13M22 20H2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    user: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M4 21C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 21" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    grid: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1" fill="#2f9e44"/><rect x="8" y="1" width="6" height="6" rx="1" fill="#2f9e44"/><rect x="15" y="1" width="6" height="6" rx="1" fill="#1c7ed6"/><rect x="1" y="8" width="6" height="6" rx="1" fill="#e03131"/><rect x="8" y="8" width="6" height="6" rx="1" fill="#2f9e44"/><rect x="15" y="8" width="6" height="6" rx="1" fill="#adb5bd"/><rect x="1" y="15" width="6" height="6" rx="1" fill="#1c7ed6"/><rect x="8" y="15" width="6" height="6" rx="1" fill="#adb5bd"/><rect x="15" y="15" width="6" height="6" rx="1" fill="#adb5bd"/></svg>',
    arrow: '<svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5V19L19 12Z" fill="#ffd23f"/></svg>',
    spade: '<svg width="20" height="22" viewBox="0 0 20 22" aria-hidden="true"><path d="M10 1C10 1 1 8.5 1 13.2C1 16 3.2 18 5.8 18C7.4 18 8.7 17.2 9.4 16L8 21H12L10.6 16C11.3 17.2 12.6 18 14.2 18C16.8 18 19 16 19 13.2C19 8.5 10 1 10 1Z" fill="#0b0b0d"/></svg>'
  };
  var YO_SVG = '<svg width="44" height="44" viewBox="0 0 40 40" role="img" aria-label="Yo, le coach"><path d="M9 17C9 10.5 14 7 20 7C26 7 31 10.5 31 17Z" fill="#ffd23f"/><path d="M29 16.5H36" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="22" r="8" fill="#e8c9a8"/><rect x="13" y="19.5" width="6" height="4" rx="1.5" fill="#0b0b0d"/><rect x="21" y="19.5" width="6" height="4" rx="1.5" fill="#0b0b0d"/><path d="M19 21.5H21" stroke="#0b0b0d" stroke-width="1.5"/><path d="M8 38C8 31.5 13.5 29 20 29C26.5 29 32 31.5 32 38Z" fill="#2e2e35"/></svg>';
  function yo(msg) { return '<div class="yo"><div class="av">' + YO_SVG + '</div><div class="stack" style="gap:4px;min-width:0"><span class="who">Yo</span><span>' + msg + '</span></div></div>'; }
  function logo() { return '<div style="width:34px;height:46px;border-radius:6px;background:#ffd23f;display:flex;align-items:center;justify-content:center;transform:rotate(-8deg);flex-shrink:0">' + IC.spade + '</div>'; }

  /* ---------- Cartes ---------- */
  var SUITS = [['♠', false], ['♥', true], ['♦', true], ['♣', false]];
  function dealHand(h) {
    var a = h[0], b = h[1], s1 = Math.floor(Math.random() * 4), s2;
    if (h.length === 2) { s2 = (s1 + 1 + Math.floor(Math.random() * 3)) % 4; }
    else if (h[2] === 's') s2 = s1; else s2 = (s1 + 1 + Math.floor(Math.random() * 3)) % 4;
    return [[a, s1], [b, s2]];
  }
  function rankLabel(r) { return r === 'T' ? '10' : r; }
  function cardHtml(c) { var s = SUITS[c[1]]; return '<div class="pc' + (s[1] ? ' red' : '') + '"><span class="r">' + rankLabel(c[0]) + '</span><span class="s">' + s[0] + '</span></div>'; }
  function handText(cards) { return cards.map(function (c) { var s = SUITS[c[1]]; return rankLabel(c[0]) + '<span style="color:' + (s[1] ? '#ff5a5a' : '#fff') + '">' + s[0] + '</span>'; }).join(' '); }

  /* ---------- Libellés d'actions ---------- */
  function actColor(a, type) {
    if (a === 'fold') return 'a-fold';
    if (a === 'call' || a === 'limp') return 'a-call';
    if (a === 'fourbet') return 'a-three';
    if (a === 'raise') return type === 'def' ? 'a-three' : 'a-raise';
    if (a === 'allin') return (type === 'def') ? 'a-three' : 'a-allin';
    return 'a-fold';
  }
  function actName(a, s) {
    if (a === 'fold') return 'Se coucher';
    if (a === 'call') return 'Payer';
    if (a === 'limp') return s && s.pos === 'SB' ? 'Compléter (limp)' : 'Limper (1 BB)';
    if (a === 'fourbet') return '4-bet';
    if (a === 'allin') return s && s.type === 'def' ? '3-bet tapis' : 'Tapis';
    if (a === 'raise') {
      if (s && s.type === 'def') return '3-bet';
      return (s && (s.type === 'open' || s.type === 'push') ? 'Ouvrir ' : 'Relancer ') + openSize(s).toString().replace('.', ',') + ' BB';
    }
    return a;
  }
  function openSize(s) {
    if (!s) return PA.openBB('BTN', 100);
    return PA.openBB(s.pos, s.bb);
  }
  var CSSVAR = { 'a-raise': '#2f9e44', 'a-call': '#1c7ed6', 'a-three': '#e03131', 'a-allin': '#2f9e44', 'a-fold': '#3a3a42' };

  /* ---------- État de l'interface ---------- */
  var ui = { route: 'home', drill: null, sheet: null, onb: { step: 1 }, welcomed: false };
  try { ui.welcomed = sessionStorage.getItem('pa2w') === '1'; } catch (e) {}

  function applySettings() {
    var p = PA.player(); var fs = p ? p.settings.text : 1;
    document.documentElement.style.setProperty('--fs', fs);
    document.body.classList.toggle('lefty', !!(p && p.settings.lefty));
  }
  function vibrate(ms) { var p = PA.player(); if (p && p.settings.vibrate && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
  function go(r) { location.hash = '#' + r; }

  /* ---------- Coquille ---------- */
  var NAV = [['home', 'Accueil', 'home'], ['apprendre', 'Apprendre', 'book'], ['entrainer', 'S’entraîner', 'cards'], ['analyser', 'Analyser', 'chart'], ['moi', 'Moi', 'user']];
  function shell(active, body, noFab) {
    var focus = !!noFab;
    var side = '<nav class="side" aria-label="Navigation principale"><div class="row" style="padding:0 8px 22px">' + logo() + '<span class="disp" style="font-size:26px">Poker<br>Academy</span></div>' +
      NAV.map(function (n) { return '<a href="#' + n[0] + '" class="' + (active === n[0] ? 'on' : '') + '">' + IC[n[2]] + n[1] + '</a>'; }).join('') + '</nav>';
    var nav = '<nav class="nav" aria-label="Navigation principale">' + NAV.map(function (n) { return '<a href="#' + n[0] + '" class="' + (active === n[0] ? 'on' : '') + '">' + IC[n[2]] + n[1] + '</a>'; }).join('') + '</nav>';
    var fab = '<button class="fab" data-act="range" aria-label="Ouvrir ma range">' + IC.grid + 'Ma range</button>';
    return '<div class="app' + (focus ? ' focus' : '') + '">' + side + '<main class="main">' + body + '</main></div>' + (focus ? '' : nav) + (noFab ? '' : fab);
  }

  /* ---------- Accueil ---------- */
  function greet() { var h = new Date().getHours(); return h < 18 && h >= 5 ? 'Bonjour' : 'Bonsoir'; }
  function homeView() {
    var p = PA.player(), pr = PA.PROFILES[p.profile] || PA.PROFILES.tag;
    var due = PA.srsDue(p).length;
    var msg = !p.testDone ? 'Avant tout, fais le test de profil : 30 mains suffisent pour voir où tu en es. Je t’attends à S’entraîner.'
      : (due ? 'Ta séance du jour est prête : 20 décisions, dont ' + due + ' main' + (due > 1 ? 's' : '') + ' ratée' + (due > 1 ? 's' : '') + ' à revoir. On y va ?' : 'Ta séance du jour est prête : 20 décisions sur tes points faibles. On y va ?');
    var last = p.last ? '<a href="#' + p.last.route + '" class="card row" style="text-decoration:none;color:#fff"><div style="width:48px;height:48px;border-radius:12px;background:var(--panel2);display:flex;align-items:center;justify-content:center">' + IC.play + '</div><div class="stack" style="gap:6px;flex:1;min-width:0"><span class="muted small">Reprendre</span><b>' + esc(p.last.label) + '</b></div></a>' : '';
    var body = '<div class="stack">' +
      '<div class="row" style="justify-content:space-between"><div class="row">' + logo() + '<div><div class="disp" style="font-size:26px">Poker Academy</div><div class="muted">' + greet() + ', ' + esc(p.pseudo) + '</div></div></div><span class="chip">' + pr.short + '</span></div>' +
      yo(msg) + last +
      '<button class="big-cta" data-act="seance"><div><div class="disp">Séance du jour</div><div style="font-weight:500">20 décisions · environ 10 min</div></div>' + IC.arrow + '</button>' +
      '<div class="grid2">' +
      tile('apprendre', 'book', 'Apprendre', 'Leçons, ranges, cours') + tile('entrainer', 'cards', 'S’entraîner', 'Préflop, situations, test') +
      tile('analyser', 'chart', 'Analyser', 'Winamax, club, fuites') + tile('moi', 'user', 'Moi', 'Profil, progrès, réglages') + '</div></div>';
    return shell('home', body);
  }
  function tile(r, ic, t, s) { return '<a class="tile" href="#' + r + '"><span style="color:var(--gold)">' + IC[ic] + '</span><b>' + t + '</b><span>' + s + '</span></a>'; }

  /* ---------- Premier lancement ---------- */
  function onbView() {
    var st = ui.onb;
    var body;
    if (st.step === 1) {
      body = '<div class="stack" style="max-width:560px;margin:0 auto;padding-top:16px">' +
        '<div class="row">' + logo() + '<h1>Poker Academy</h1></div>' +
        yo('Salut, moi c’est Yo. Lionel de mon vrai prénom, mais au club tout le monde m’appelle Yo. Je serai ton coach : on va trouver ton style, puis le muscler, main après main.') +
        '<div class="card stack"><label for="ps">Ton pseudo</label><input id="ps" type="text" autocomplete="nickname" value="' + esc(st.pseudo || '') + '" placeholder="Vilvoord">' +
        '<label for="ag">Ta date de naissance</label><input id="ag" type="text" inputmode="numeric" autocomplete="bday" maxlength="10" placeholder="JJ/MM/AAAA" value="' + esc(st.birth || '') + '" style="letter-spacing:.08em"><div class="small muted">Jour, mois, année : par exemple 14/07/1980.</div><div class="err" id="onbErr"></div>' +
        '<button class="btn gold block" data-act="onb1">Continuer</button></div>' +
        (Object.keys(PA.load().players).length ? '<button class="btn ghost" data-act="pickPlayer">J’ai déjà un joueur sur ce téléphone</button>' : '') + '</div>';
    } else if (st.step === 0) {
      body = '<div class="stack" style="max-width:560px;margin:0 auto;padding-top:40px">' + yo('Désolé, Poker Academy est réservée aux personnes majeures. Reviens nous voir à tes 18 ans !') + '<button class="btn" data-act="onbBack">Retour</button></div>';
    } else if (st.step === 2) {
      body = '<div class="stack" style="max-width:640px;margin:0 auto">' + yo('Choisis le style qui te ressemble le plus. Pas d’inquiétude : le test de profil te dira ensuite si c’est le bon, et tu pourras en changer à tout moment.') +
        Object.keys(PA.PROFILES).map(function (k) { var pr = PA.PROFILES[k]; return '<button class="prof-card' + (st.profile === k ? ' on' : '') + '" data-act="pickProf" data-v="' + k + '"><div class="row" style="justify-content:space-between"><b>' + pr.name + '</b>' + (pr.reco ? '<span class="chip">Recommandé</span>' : '') + '</div><div class="muted">Mains jouées : ' + pr.vpip + '</div><div>' + pr.desc + '</div></button>'; }).join('') +
        '<button class="btn gold block" data-act="onb2"' + (st.profile ? '' : ' disabled') + '>Valider ce profil</button></div>';
    } else {
      body = '<div class="stack" style="max-width:560px;margin:0 auto;padding-top:16px">' + yo('Parfait. Maintenant, le test de profil : je te sers des mains, tu décides comme à la table, sans aide. À la fin, je te dis ton vrai style et tes erreurs à corriger. 30 mains, c’est environ 5 minutes.') +
        '<div class="seg">' + [30, 60, 90].map(function (n) { return '<button data-act="startTest" data-v="' + n + '">' + n + ' mains</button>'; }).join('') + '</div>' +
        '<button class="btn ghost" data-act="onbLater">Plus tard</button></div>';
    }
    return '<div class="main">' + body + '</div>';
  }
  function pickPlayerView() {
    var s = PA.load();
    var body = '<div class="stack" style="max-width:560px;margin:0 auto;padding-top:16px"><div class="row">' + logo() + '<h1>Qui joue ?</h1></div>' +
      Object.keys(s.players).map(function (id) { var p = s.players[id]; return '<button class="prof-card" data-act="usePlayer" data-v="' + id + '"><b>' + esc(p.pseudo) + '</b><div class="muted">Profil : ' + (p.profile ? PA.PROFILES[p.profile].name : 'à choisir') + '</div></button>'; }).join('') +
      '<button class="btn" data-act="newPlayer">Nouveau joueur</button></div>';
    return '<div class="main">' + body + '</div>';
  }
  function welcomeView() {
    var p = PA.player();
    return '<div class="main"><div class="stack" style="max-width:560px;margin:0 auto;padding-top:40px"><div class="row">' + logo() + '<h1>Poker Academy</h1></div>' +
      yo(greet() + ' ' + esc(p.pseudo) + ' ! Content de te revoir.') +
      '<button class="btn gold block" data-act="continue">Continuer</button><button class="btn block" data-act="pickPlayer">Changer de joueur</button></div></div>';
  }

  /* ---------- Ma range (panneau) ---------- */
  var RS = { tab: 'sit', type: 'open', pos: 'UTG', opener: 'UTG', depth: 'deep', bb: 10, scen: 'ip', hero: null, profile: null, edit: false };
  function openRange(ctx) {
    var p = PA.player(); RS.profile = p.profile || 'tag'; RS.edit = false;
    if (ctx && ctx.sit) {
      var s = ctx.sit; RS.tab = 'sit'; RS.type = s.type === 'push' ? 'open' : s.type; RS.pos = s.pos; RS.opener = s.opener || RS.opener; RS.scen = s.scen || 'ip';
      var dk = PA.depthKey(s.bb); RS.depth = dk; if (dk === 'push') RS.bb = PA.nearestPush(s.bb); RS.hero = ctx.hand;
    } else RS.hero = null;
    ui.sheet = 'range'; renderSheet();
  }
  function rsSit() {
    var bb = RS.depth === 'deep' ? 100 : (RS.depth === 'mid' ? 30 : RS.bb);
    var t = RS.type;
    if (t === 'open') return { type: 'open', pos: RS.pos, bb: bb };
    if (t === 'def') return { type: 'def', pos: RS.pos, opener: RS.opener, bb: bb };
    if (t === 'vs3bet') return { type: 'vs3bet', scen: RS.scen, bb: 100 };
    return { type: 'callshove', pos: RS.pos, opener: RS.opener, bb: RS.bb };
  }
  function rangeGrid(map, type, hero, editable) {
    var h = '<div class="rg" role="grid" aria-label="Grille des 169 mains">';
    PA.HANDS.forEach(function (x) {
      var a = map[x];
      var cls = typeof a === 'string' ? actColor(a, type) : '';
      var style = typeof a === 'string' ? '' : ' style="background:' + a.bg + ';color:' + a.fg + '"';
      h += '<button class="' + cls + (x === hero ? ' hero' : '') + '"' + style + ' data-act="' + (editable ? 'editCell' : 'cell') + '" data-v="' + x + '" aria-label="' + x + '">' + x + '</button>';
    });
    return h + '</div>';
  }
  var GLOBAL_COLORS = [['#26215C', '#fff'], ['#3C3489', '#fff'], ['#534AB7', '#fff'], ['#7F77DD', '#fff'], ['#854F0B', '#fff'], ['#BA7517', '#fff'], ['#EF9F27', '#1a1400'], ['#FAC775', '#1a1400']];
  function rangeBody(full) {
    var prof = RS.profile, pr = PA.PROFILES[prof];
    var out = '<div class="row" style="justify-content:space-between"><h2>Ma range</h2><span class="chip">' + pr.short + '</span></div>';
    out += '<div class="seg"><button class="' + (RS.tab === 'sit' ? 'on' : '') + '" data-act="rsTab" data-v="sit">Ma situation</button><button class="' + (RS.tab === 'glob' ? 'on' : '') + '" data-act="rsTab" data-v="glob">Vue globale</button></div>';
    if (RS.tab === 'glob') {
      var f = PA.firstOpenPos(prof), map = {};
      PA.HANDS.forEach(function (h) { var i = f[h]; map[h] = i < 0 ? { bg: '#2a2a30', fg: '#77777f' } : { bg: GLOBAL_COLORS[i][0], fg: GLOBAL_COLORS[i][1] }; });
      out += '<p class="muted">À partir de quelle position j’ouvre chaque main (40 BB et plus). Plus c’est foncé, plus la main s’ouvre tôt.</p>';
      out += '<div class="legend">' + PA.POS.slice(0, 8).map(function (p, i) { return '<span><i style="background:' + GLOBAL_COLORS[i][0] + '"></i>' + p + '</span>'; }).join('') + '<span><i style="background:#2a2a30"></i>Jamais</span></div>';
      out += rangeGrid(map, 'open', RS.hero, false);
      return out;
    }
    var s = rsSit(), cm = PA.chart(prof, s);
    out += '<div class="seg">' + [['open', 'Ouvrir'], ['def', 'Face à une relance'], ['vs3bet', 'Face à un 3-bet'], ['callshove', 'Payer un tapis']].map(function (t) { return '<button class="' + (RS.type === t[0] ? 'on' : '') + '" data-act="rsType" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (RS.type !== 'vs3bet' && RS.type !== 'callshove') {
      out += '<div class="seg">' + [['deep', '40 BB et +'], ['mid', '20-40 BB'], ['push', 'Moins de 20 BB']].map(function (t) { return '<button class="' + (RS.depth === t[0] ? 'on' : '') + '" data-act="rsDepth" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    }
    if ((RS.depth === 'push' && RS.type === 'open') || RS.type === 'callshove') out += '<div class="seg">' + PA.PUSH_DEPTHS.map(function (d) { return '<button class="' + (RS.bb === d ? 'on' : '') + '" data-act="rsBB" data-v="' + d + '">' + d + ' BB</button>'; }).join('') + '</div>';
    if (RS.type === 'open') {
      if (PA.POS.slice(0, 8).indexOf(RS.pos) < 0) { RS.pos = 'BTN'; s = rsSit(); cm = PA.chart(prof, s); }
      out += '<div class="seg" aria-label="Ma position">' + PA.POS.slice(0, 8).map(function (p) { return '<button class="' + (RS.pos === p ? 'on' : '') + '" data-act="rsPos" data-v="' + p + '">' + p + '</button>'; }).join('') + '</div>';
    } else if (RS.type === 'def') {
      var heroes = ['BB', 'SB', 'BTN', 'CO', 'HJ', 'LJ', 'MP', 'UTG+1'];
      if (heroes.indexOf(RS.pos) < 0) RS.pos = 'BB';
      out += '<div class="small muted">Je suis en :</div><div class="seg">' + heroes.map(function (p) { return '<button class="' + (RS.pos === p ? 'on' : '') + '" data-act="rsPos" data-v="' + p + '">' + p + '</button>'; }).join('') + '</div>';
      var ops = PA.validOpeners(RS.pos); if (RS.pos !== 'BB') ops = ops.filter(function (o) { return o !== 'SB'; });
      if (ops.indexOf(RS.opener) < 0) RS.opener = ops[ops.length - 1];
      out += '<div class="small muted">La relance vient de :</div><div class="seg">' + ops.map(function (p) { return '<button class="' + (RS.opener === p ? 'on' : '') + '" data-act="rsOp" data-v="' + p + '">' + p + '</button>'; }).join('') + '</div>';
      s = rsSit(); cm = PA.chart(prof, s);
    } else if (RS.type === 'vs3bet') {
      out += '<div class="seg">' + [['ip', 'J’ouvre au bouton, 3-bet des blindes'], ['oop', 'J’ouvre au CO, 3-bet du bouton'], ['early', 'J’ouvre tôt, 3-bet tardif']].map(function (t) { return '<button class="' + (RS.scen === t[0] ? 'on' : '') + '" data-act="rsScen" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    } else {
      var sits = PA.shoveSituations(RS.bb), key = RS.pos + ' vs shove ' + RS.opener;
      if (sits.indexOf(key) < 0) { var m = sits[0].split(' vs shove '); RS.pos = m[0]; RS.opener = m[1]; key = sits[0]; }
      out += '<div class="seg">' + sits.map(function (k) { var m = k.split(' vs shove '); return '<button class="' + (k === key ? 'on' : '') + '" data-act="rsShove" data-v="' + k + '">' + m[0] + ' face au tapis ' + m[1] + '</button>'; }).join('') + '</div>';
      s = rsSit(); cm = PA.chart(prof, s);
    }
    // bandeau
    var acts = {}; PA.HANDS.forEach(function (h) { acts[cm[h]] = (acts[cm[h]] || []).concat(h); });
    var ctxTxt = describeSit(s);
    if (RS.hero) {
      var a = cm[RS.hero];
      out += '<div class="banner">Ta main : <b>' + RS.hero + '</b> ' + ctxTxt + ' → <span class="pill" style="background:' + CSSVAR[actColor(a, s.type)] + '">' + actName(a, s).toUpperCase() + '</span></div>';
    } else out += '<div class="banner">' + ctxTxt.charAt(0).toUpperCase() + ctxTxt.slice(1) + ' : ' + Object.keys(acts).filter(function (k) { return k !== 'fold'; }).map(function (k) { return actName(k, s) + ' ' + String(PA.pct(acts[k])).replace('.', ',') + ' %'; }).join(' · ') + '</div>';
    out += '<div class="legend">' + Object.keys(acts).sort().map(function (k) { return '<span><i style="background:' + CSSVAR[actColor(k, s.type)] + '"></i>' + actName(k, s) + '</span>'; }).join('') + '</div>';
    out += rangeGrid(cm, s.type, RS.hero, RS.edit);
    if (prof === 'perso' && full) out += '<div class="row"><button class="btn" data-act="toggleEdit">' + (RS.edit ? 'Terminer la modification' : 'Modifier cette range') + '</button>' + (RS.edit ? '<span class="muted small">Touchez une case pour changer son action.</span>' : '') + '</div>';
    if (s.type === 'callshove' || (s.type === 'open' && PA.depthKey(s.bb) === 'push')) out += '<p class="muted small">Tables d’équilibre en jetons (antes de 0,125 BB), calculées pour le cours. Près d’une bulle, resserre tes payes.</p>';
    if (prof !== 'nit' && prof !== 'tag' && (s.type === 'def')) out += '<p class="muted small">Ranges construites à partir du livre ; vérification au solveur prévue.</p>';
    return out;
  }
  function describeSit(s) {
    if (s.type === 'open') { var first = s.pos === 'UTG' ? 'premier à parler' : 'personne n’a ouvert avant toi'; return PA.depthKey(s.bb) === 'push' ? 'en ' + s.pos + ' à ' + PA.nearestPush(s.bb) + ' BB, ' + first : 'en ' + s.pos + ', ' + first; }
    if (s.type === 'def') return 'en ' + s.pos + ' face à une relance ' + s.opener;
    if (s.type === 'vs3bet') return { ip: 'au bouton face au 3-bet des blindes', oop: 'au CO face au 3-bet du bouton', early: 'en début de table face à un 3-bet tardif' }[s.scen];
    return 'en ' + s.pos + ' face au tapis ' + s.opener + ' à ' + PA.nearestPush(s.bb) + ' BB';
  }
  function renderSheet() {
    var host = $('#sheet');
    if (!ui.sheet) { host.innerHTML = ''; return; }
    if (ui.sheet === 'range') {
      host.innerHTML = '<div class="sheet-bg" data-act="closeSheet"><div class="sheet stack" role="dialog" aria-label="Ma range" data-stop="1"><div class="grab"></div>' + rangeBody(false) + '<button class="btn block" data-act="closeSheet">Fermer</button></div></div>';
    }
  }

  /* ---------- Apprendre ---------- */
  function apprendreView() {
    var body = '<div class="stack"><h1>Apprendre</h1>' +
      '<div class="grid4">' +
      '<a class="tile" href="#lecons"><b>Leçons</b><span>Le cours en 32 chapitres, avec quiz et version à écouter.</span></a>' +
      '<a class="tile" href="#ranges"><b>Mes ranges</b><span>Vue globale et toutes les situations, en plein écran.</span></a>' +
      '<a class="tile" href="#examens"><b>Examens</b><span>Les quiz des leçons, par partie ou en examen général.</span></a>' +
      '<a class="tile" href="#podcasts"><b>Podcasts</b><span>Écouter les leçons : Yo explique, le joueur questionne.</span></a>' +
      '<a class="tile" href="#cours"><b>Le cours en PDF</b><span>L’édition 9-max complète et la version imprimable des nouvelles leçons.</span></a>' +
      '<a class="tile" href="#solveur"><b>Solveur</b><span>Ce que fait le solveur au flop : bouton, cut-off et petite blinde contre la grosse blinde, 30 flops types.</span></a>' +
      '<a class="tile" href="#outils"><b>Outils</b><span>Équité main contre main ou contre une range, ICM, prime PKO, compteur de M.</span></a></div></div>';
    return shell('apprendre', body);
  }
  function rangesView() {
    var p = PA.player(); if (!RS.profile) RS.profile = p.profile || 'tag';
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button>' +
      '<div class="seg">' + Object.keys(PA.PROFILES).map(function (k) { return '<button class="' + (RS.profile === k ? 'on' : '') + '" data-act="rsProf" data-v="' + k + '">' + PA.PROFILES[k].short + '</button>'; }).join('') + '</div>' +
      '<div class="stack" id="rangeFull">' + rangeBody(true) + '</div>' +
      (EMBED ? '' : '<button class="btn" data-act="print">Imprimer cette range</button>') + '</div>';
    return shell('apprendre', body);
  }
  function coursView() {
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Le cours</h1>' +
      yo('Le cours est en réécriture : 32 chapitres, chacun en leçon courte avec son quiz et sa version à écouter. En attendant, voici l’édition 9-max actuelle, complète, en PDF.') +
      (EMBED ? '<div class="card muted">Le PDF du cours sera inclus dans l’appli installée (téléphone et PC). Cette version de test en ligne ne le contient pas.</div>' :
      '<a class="btn gold" href="cours/strategie-poker-9max-cours.pdf" target="_blank" rel="noopener">Ouvrir le cours (PDF, 201 pages)</a>' +
      '<a class="btn" href="cours/strategie-poker-9max-cours.pdf" download>Télécharger le cours complet (PDF)</a>') + '<a class="btn" href="#cours-imprimable">Version imprimable des nouvelles leçons</a></div>';
    return shell('apprendre', body);
  }

  /* ---------- S'entraîner ---------- */
  function entrainerView() {
    var p = PA.player();
    var body = '<div class="stack"><h1>S’entraîner</h1>' +
      (!p.testDone ? yo('Commence par le test de profil : il me dit ton vrai style et tes erreurs.') : '') +
      '<button class="big-cta" data-act="seance"><div><div class="disp">Séance du jour</div><div style="font-weight:500">20 décisions choisies pour toi</div></div>' + IC.arrow + '</button>' +
      '<div class="grid4">' +
      '<a class="tile" href="#preflop"><b>Préflop</b><span>Ouvrir, défendre, 3-bet, tapis ou fold. Par position et profondeur.</span></a>' +
      '<a class="tile" href="#cartes"><b>Cartes</b><span>Je joue ou je jette ? 20 cartes rapides ; les ratées reviennent' + (window.PA_CARDS && window.PA_CARDS.due() ? ' (' + window.PA_CARDS.due() + ' à revoir aujourd’hui)' : '') + '.</span></a>' +
      '<a class="tile" href="#situations"><b>Situations</b><span>Tapis ou fold, payer un tapis, face au 3-bet, bulle et ICM, PKO et Space KO, outs et cote.</span></a>' +
      '<a class="tile" href="#partie"><b>Jouer une partie</b><span>Sit &amp; Go, tournoi de 100 joueurs, moments clés, PKO et Space KO, avec ou sans Yo.</span></a>' +
      '<button class="tile" data-act="testMenu"><b>Test de profil</b><span>30, 60 ou 90 mains pour trouver ton style.</span></button></div></div>';
    return shell('entrainer', body);
  }
  var PF = { kind: 'mix', pos: 'all', depth: 'deep', n: 20, chrono: false };
  function preflopView() {
    var p = PA.player(); if (PF.chronoInit !== true) { PF.chrono = !!p.settings.chrono; PF.chronoInit = true; }
    function seg(key, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (PF[key] === o[0] ? 'on' : '') + '" data-act="pf" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="entrainer">‹ S’entraîner</button><h1>Préflop</h1>' +
      '<div class="card stack"><b>Situation</b>' + seg('kind', [['mix', 'Mélangé'], ['open', 'Ouvrir'], ['def', 'Face à une relance'], ['vs3bet', 'Face à un 3-bet']]) +
      (PF.kind === 'open' ? '<b>Position</b>' + seg('pos', [['all', 'Toutes']].concat(PA.POS.slice(0, 8).map(function (x) { return [x, x]; }))) : '') +
      (PF.kind !== 'vs3bet' ? '<b>Profondeur</b>' + seg('depth', [['deep', '40 BB et +'], ['mid', '20-40 BB'], ['push', 'Moins de 20 BB'], ['any', 'Mélangée']]) : '') +
      '<b>Nombre de mains</b>' + seg('n', [[20, '20'], [50, '50'], [100, '100']]) +
      '<b>Chrono</b>' + seg('chrono', [[false, 'Sans'], [true, '8 secondes']]) +
      '<button class="btn gold block" data-act="startPreflop">Commencer</button></div></div>';
    return shell('entrainer', body);
  }
  function situationsView() {
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="entrainer">‹ S’entraîner</button><h1>Situations</h1><div class="grid4">' +
      '<button class="tile" data-act="startSit" data-v="push"><b>Tapis ou fold</b><span>Moins de 20 BB, tout le monde s’est couché jusqu’à toi.</span></button>' +
      '<button class="tile" data-act="startSit" data-v="callshove"><b>Payer un tapis</b><span>Un adversaire pousse : payer ou se coucher ?</span></button>' +
      '<button class="tile" data-act="startSit" data-v="vs3bet"><b>Face au 3-bet</b><span>Tu as ouvert, on te relance.</span></button>' +
      '<button class="tile" data-act="startSit" data-v="icm"><b>Bulle et ICM</b><span>Payer un tapis à la bulle ou en table finale : jetons contre euros.</span></button>' +
      '<button class="tile" data-act="startSit" data-v="pko"><b>PKO et Space KO</b><span>La prime change la cote : payer ou se coucher ?</span></button>' +
      '<button class="tile" data-act="startSit" data-v="outs"><b>Outs et cote</b><span>Compter ses outs à la turn et comparer à la cote.</span></button>' +
      '<a class="tile" href="#apresflop"><b>Après le flop</b><span>Miser, checker, payer, relancer : tes décisions au flop comparées au solveur.</span></a>' +
      '</div></div>';
    return shell('entrainer', body);
  }
  function testMenuView() {
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="entrainer">‹ S’entraîner</button><h1>Test de profil</h1>' +
      yo('Je te sers des mains, tu décides comme à la table. Pas de correction pendant le test : je te donne le bilan à la fin. Plus tu joues de mains, plus le résultat est fiable.') +
      '<div class="seg">' + [30, 60, 90].map(function (n) { return '<button data-act="startTest" data-v="' + n + '">' + n + ' mains</button>'; }).join('') + '</div></div>';
    return shell('entrainer', body);
  }

  /* ---------- Séances (moteur commun) ---------- */
  function buildQuestions(mode, opts) {
    var p = PA.player(), prof = p.profile || 'tag', qs = [], i;
    if (mode === 'test') {
      var kinds = ['open', 'open', 'open', 'def', 'def', 'def'];
      for (i = 0; i < opts.n; i++) {
        var q, tries = 0;
        do {
          var s = PA.randomSituation(kinds[i % kinds.length]);
          if (s.bb < 40 && Math.random() < 0.7) s.bb = 100;
          var mapN = PA.chart('nit', s), mapL = PA.chart('lag', s);
          var diffH = PA.HANDS.filter(function (h) { return mapN[h] !== mapL[h]; });
          var hand;
          if (Math.random() < 0.7 && diffH.length) hand = diffH[Math.floor(Math.random() * diffH.length)];
          else { var bothIn = PA.HANDS.filter(function (h) { return mapN[h] !== 'fold' && PA.difficulty(mapN, h) > 1300; }); hand = bothIn.length ? bothIn[Math.floor(Math.random() * bothIn.length)] : PA.HANDS[0]; }
          q = PA.makeQuestion(prof, { sit: s, hand: hand }); tries++;
        } while (tries < 5 && qs.some(function (x) { return x.key === q.key; }));
        qs.push(q);
      }
      return qs;
    }
    if (mode === 'seance') {
      var due = PA.srsDue(p).slice(0, 8);
      due.forEach(function (d) { var q = PA.makeQuestion(prof, { sit: d.q.sit, hand: d.q.hand }); q.review = true; qs.push(q); });
      var notionKinds = { open_early: 'open', open_mid: 'open', open_late: 'open', open_sb: 'open', bb_def: 'def', cold: 'def', vs3bet: 'vs3bet', push: 'push', callshove: 'callshove', mid: 'open' };
      if (window.PA_SIT) window.PA_SIT.kinds.forEach(function (k) { notionKinds[k] = k; });
      var ns = Object.keys(notionKinds).map(function (n) { var st = PA.notionState(p, n); return [n, st.r + (st.n < 3 ? -150 : 0) + Math.random() * 120]; }).sort(function (a, b) { return a[1] - b[1]; });
      var k = 0;
      while (qs.length < 20) {
        var n = ns[k % 5][0]; k++;
        var st = PA.notionState(p, n), s2, tries2 = 0;
        if (window.PA_SIT && window.PA_SIT.kinds.indexOf(n) >= 0) { qs.push(window.PA_SIT.make(n)); continue; }
        do { s2 = PA.randomSituation(notionKinds[n]); tries2++; } while (PA.notionOf(s2) !== n && tries2 < 40);
        qs.push(PA.makeQuestion(prof, { sit: s2, targetDiff: st.r - 190 }));
      }
      return shuffle(qs);
    }
    // situations calculées (ICM, PKO, outs)
    if (window.PA_SIT && window.PA_SIT.kinds.indexOf(opts.kind) >= 0) { for (i = 0; i < opts.n; i++) qs.push(window.PA_SIT.make(opts.kind)); return qs; }
    // préflop / situations
    for (i = 0; i < opts.n; i++) {
      var kind = opts.kind === 'mix' ? null : opts.kind, s3, tries3 = 0;
      do {
        s3 = PA.randomSituation(kind);
        tries3++;
        if (opts.pos && opts.pos !== 'all' && s3.type === 'open') s3.pos = opts.pos;
        if (opts.depth && opts.depth !== 'any' && (s3.type === 'open' || s3.type === 'def')) {
          if (opts.depth === 'deep') s3.bb = 100; else if (opts.depth === 'mid') s3.bb = 30;
          else { if (s3.type === 'def') { s3 = null; continue; } s3.bb = PA.PUSH_DEPTHS[Math.floor(Math.random() * 6)]; }
        }
      } while (!s3 && tries3 < 30);
      if (!s3) s3 = PA.randomSituation('push');
      var st3 = PA.notionState(p, PA.notionOf(s3));
      qs.push(PA.makeQuestion(prof, { sit: s3, targetDiff: Math.random() < 0.6 ? st3.r - 190 : null }));
    }
    return qs;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startDrill(mode, opts, label) {
    var qs = buildQuestions(mode, opts);
    qs.forEach(function (q) { if (!q.custom) q.cards = dealHand(q.hand); });
    ui.drill = { mode: mode, opts: opts, qs: qs, i: 0, answers: [], consult: 0, fb: null, label: label, chrono: !!opts.chrono, t0: Date.now() };
    var p = PA.player(); p.last = { route: 'drill', label: label }; PA.save();
    go('drill');
  }

  /* ---------- Table ---------- */
  function seatXY(k, r) { var a = (90 + k * 40) * Math.PI / 180; return [50 + r[0] * Math.cos(a), 50 + r[1] * Math.sin(a)]; }
  function tableHtml(q) {
    var s = q.sit, POS = PA.POS;
    var heroPos = s.type === 'vs3bet' ? s.pos : s.pos;
    var hi = POS.indexOf(heroPos);
    var bb = s.type === 'vs3bet' ? 100 : s.bb;
    var bl = PA.blindsFor(bb), BB = bl.bb;
    var bets = {}, folded = {}, allin = {};
    bets.SB = 0.5; bets.BB = 1;
    var acted = POS.slice(0, POS.indexOf(heroPos) < 0 ? 0 : POS.indexOf(heroPos));
    if (s.type === 'open' || s.type === 'push') { acted.forEach(function (p) { if (p !== 'SB' && p !== 'BB') folded[p] = 1; }); }
    if (s.type === 'def') { var os = PA.openBB(s.opener, s.bb); bets[s.opener] = os; acted.forEach(function (p) { if (p !== s.opener && p !== 'SB' && p !== 'BB') folded[p] = 1; }); if (heroPos === 'BB' && s.opener !== 'SB') folded.SB = 1; }
    if (s.type === 'callshove') { bets[s.opener] = PA.nearestPush(s.bb); allin[s.opener] = 1; POS.forEach(function (p) { if (p !== s.opener && p !== heroPos && !(p === 'BB' && heroPos !== 'BB') && !(p === 'SB' && heroPos === 'SB')) { if (POS.indexOf(p) < POS.indexOf(s.opener) || (POS.indexOf(p) > POS.indexOf(s.opener) && POS.indexOf(p) < POS.indexOf(heroPos))) folded[p] = 1; } }); }
    if (s.type === 'vs3bet') { var sz3 = s.scen === 'ip' ? 11 : 8; var o3 = PA.openBB(heroPos, 100); sz3 = Math.round(o3 * (s.scen === 'ip' ? 4.4 : 3.2)); bets[heroPos] = o3; bets[s.opener] = sz3; POS.forEach(function (p) { if (p !== heroPos && p !== s.opener && p !== 'BB' && p !== 'SB') folded[p] = 1; }); if (s.opener !== 'SB') folded.SB = 1; }
    var ante = PA.depthKey(bb) !== 'deep' ? 1 : 0;
    var pot = 0; Object.keys(bets).forEach(function (k) { pot += bets[k]; });
    var h = '<div class="felt">';
    for (var k = 0; k < 9; k++) {
      var pos = POS[(hi + k) % 9]; var xy = seatXY(k, [46, 46]);
      var isHero = k === 0;
      var stackBB = bb - (bets[pos] || 0);
      h += '<div class="seat' + (isHero ? ' hero' : '') + (folded[pos] ? ' out' : '') + '" style="left:' + xy[0] + '%;top:' + Math.min(xy[1], 92) + '%"><span class="nm">' + (isHero ? 'Toi · ' : '') + pos + '</span><span class="st">' + (allin[pos] ? 'Tapis' : PA.fmt(stackBB * BB)) + '</span></div>';
      if (bets[pos]) { var bxy = seatXY(k, [33, 30]); h += '<div class="bet" style="left:' + bxy[0] + '%;top:' + bxy[1] + '%">' + PA.fmt(bets[pos] * BB) + '</div>'; }
      if (pos === 'BTN') { var dxy = seatXY(k + 0.35, [35, 32]); h += '<div class="dealer" style="left:' + dxy[0] + '%;top:' + dxy[1] + '%">D</div>'; }
    }
    var potTxt = PA.fmt((pot + (ante ? 1 : 0)) * BB) + ' · ' + String(Math.round((pot + (ante ? 1 : 0)) * 10) / 10).replace('.', ',') + ' BB';
    h += '<div class="pot">Pot ' + potTxt + '</div></div>';
    var blindTxt = 'Blindes ' + PA.fmt(bl.sb) + ' / ' + PA.fmt(bl.bb) + (ante ? ' · ante ' + PA.fmt(bl.bb) + ' (BB ante)' : '');
    return { html: h, blindTxt: blindTxt, stackTxt: PA.fmt(bb * BB) + ' (' + bb + ' BB)', BB: BB, bets: bets };
  }
  function questionText(q, t) {
    var s = q.sit, txt;
    if (s.type === 'open' || s.type === 'push') txt = 'Tu es en <b>' + PA.POS_LABEL[s.pos] + '</b>. ' + (s.pos === 'UTG' ? 'Tu parles en premier.' : 'Les joueurs avant toi se sont couchés.');
    else if (s.type === 'def') txt = 'Tu es en <b>' + PA.POS_LABEL[s.pos] + '</b>. <b>' + s.opener + '</b> relance à ' + PA.fmt(t.bets[s.opener] * t.BB) + ' (' + String(t.bets[s.opener]).replace('.', ',') + ' BB), les autres se couchent.';
    else if (s.type === 'vs3bet') { var o4 = String(t.bets[s.pos]).replace('.', ','), r4 = t.bets[s.opener]; txt = { ip: 'Tu as ouvert au <b>bouton</b> à ' + o4 + ' BB. La <b>grosse blinde</b> sur-relance à ' + r4 + ' BB.', oop: 'Tu as ouvert au <b>CO</b> à ' + o4 + ' BB. Le <b>bouton</b> sur-relance à ' + r4 + ' BB.', early: 'Tu as ouvert en <b>UTG</b> à ' + o4 + ' BB. Le <b>CO</b> sur-relance à ' + r4 + ' BB.' }[s.scen]; }
    else txt = 'Tu es en <b>' + PA.POS_LABEL[s.pos] + '</b>. <b>' + s.opener + '</b> fait tapis pour ' + PA.fmt(PA.nearestPush(s.bb) * t.BB) + ' (' + PA.nearestPush(s.bb) + ' BB).';
    return txt + ' Ton tapis : ' + t.stackTxt + '. Que fais-tu ?';
  }
  function oddsHelp(q) {
    var s = q.sit;
    if (s.type !== 'callshove') return '';
    var S = PA.nearestPush(s.bb), b = s.pos === 'BB' ? 1 : (s.pos === 'SB' ? 0.5 : 0);
    var dead = 1.125 + (s.pos !== 'SB' && s.opener !== 'SB' ? 0.5 : 0) + (s.pos !== 'BB' && s.opener !== 'BB' ? 1 : 0);
    var call = S - b, pot = S + b + dead + call;
    var need = Math.round(call / pot * 100);
    return '<div class="small muted">Rappel : tu paies ' + String(Math.round(call * 10) / 10).replace('.', ',') + ' BB pour un pot final de ' + String(Math.round(pot * 10) / 10).replace('.', ',') + ' BB → il te faut <b>' + need + ' %</b> d’équité (paye ÷ pot final).</div>';
  }
  function drillView() {
    var d = ui.drill; if (!d) { go('home'); return ''; }
    if (d.i >= d.qs.length) return shell('entrainer', bilanHtml());
    var q = d.qs[d.i], t = q.custom ? null : tableHtml(q), choices = q.custom ? q.choices : PA.choicesFor(q.sit);
    var head = '<div class="drill-top"><button class="back" data-act="quitDrill">‹ Quitter</button><span class="muted small">' + esc(d.label) + ' · ' + (d.i + 1) + '/' + d.qs.length + '</span><button class="rbtn" data-act="range" aria-label="Ouvrir ma range">' + IC.grid + 'Ma range</button></div>' +
      '<div class="bar"><i style="width:' + Math.round(d.i / d.qs.length * 100) + '%"></i></div>';
    var body = head + (q.custom ? q.visual + '<div class="cards">' + q.cards.map(cardHtml).join('') + '</div><div class="banner">' + q.text + '</div>' + q.help :
      '<div class="small muted" style="text-align:center">' + t.blindTxt + (q.review ? ' · <span style="color:var(--gold)">Main à revoir</span>' : '') + '</div>' + t.html +
      '<div class="cards">' + q.cards.map(cardHtml).join('') + '</div>' +
      '<div class="banner">' + questionText(q, t) + '</div>' + oddsHelp(q));
    if (d.chrono && !d.fb) body += '<div class="timer"><i id="tmr" style="width:100%"></i></div>';
    if (!d.fb) {
      body += '<div class="actions" style="grid-template-columns:repeat(' + (choices.length > 3 ? 2 : choices.length) + ',minmax(0,1fr))">' + choices.map(function (c) { return '<button class="' + actColor(c, q.sit.type) + '" style="color:#fff" data-act="answer" data-v="' + c + '">' + actName(c, q.sit) + '</button>'; }).join('') + '</div>';
    } else body += feedbackHtml(q, d.fb);
    return shell('entrainer', '<div class="stack">' + body + '</div>', true);
  }
  function explain(q, prof) {
    var s = q.sit, cm = PA.chart(prof, s), eq = Math.round(PA.D.eq[q.hand] * 100), played = PA.HANDS.filter(function (h) { return cm[h] !== 'fold'; });
    var pr = PA.PROFILES[prof].short;
    if (s.type === 'open') {
      if (PA.depthKey(s.bb) === 'push') return 'À ' + PA.nearestPush(s.bb) + ' BB en ' + s.pos + ', l’équilibre pousse ' + String(PA.pct(played)).replace('.', ',') + ' % des mains (antes comprises). ' + q.hand + ' bat une main au hasard ' + eq + ' % du temps.';
      return 'En ' + s.pos + ', ton profil ' + pr + ' ouvre ' + String(PA.pct(played)).replace('.', ',') + ' % des mains. ' + q.hand + ' bat une main au hasard ' + eq + ' % du temps.' + (PA.POS.indexOf(s.pos) <= 2 ? ' Il reste beaucoup de joueurs derrière toi : on reste sélectif, mais les mains fortes s’ouvrent sans peur.' : ' Plus tu es proche du bouton, plus tu peux voler.');
    }
    if (s.type === 'def') {
      var r = PA.HANDS.filter(function (h) { return cm[h] === 'raise' || cm[h] === 'allin'; }), c = PA.HANDS.filter(function (h) { return cm[h] === 'call'; });
      return 'Face à ' + s.opener + ', ton profil sur-relance ' + String(PA.pct(r)).replace('.', ',') + ' % et paie ' + String(PA.pct(c)).replace('.', ',') + ' %.' + (s.pos === 'BB' ? ' En BB, tu as déjà mis 1 BB : la cote te permet de défendre large.' : ' Hors des blindes, on paie moins et on sur-relance plus.');
    }
    if (s.type === 'vs3bet') return 'Face au 3-bet : 4-bet avec le haut de range et quelques bluffs à bloqueurs (A5s, A4s), payer ' + (s.scen === 'ip' ? 'en position avec les mains jouables' : 'peu hors position') + ', coucher le reste.';
    if (s.type === 'callshove') return 'Face à ce tapis, l’équilibre paie ' + String(PA.pct(played)).replace('.', ',') + ' % des mains. Plus le tapis adverse est court et plus il pousse tard, plus tu paies large.';
    return '';
  }
  function feedbackHtml(q, fb) {
    var p = PA.player(), prof = p.profile || 'tag', s = q.sit;
    var right = '<span class="pill" style="background:' + CSSVAR[actColor(q.answer, s.type)] + '">' + actName(q.answer, s) + '</span>';
    var cls, title;
    if (fb.timeout) { cls = 'fb-err'; title = 'Temps écoulé. La bonne décision : ' + right + '.'; }
    else if (fb.ok) { cls = 'fb-ok'; title = 'Bien joué : ' + right + '.'; }
    else if (fb.kind === 'style' && fb.profiles) { cls = 'fb-style'; title = 'Écart de style. Un profil ' + fb.profiles.map(function (x) { return PA.PROFILES[x].short; }).join(' ou ') + ' jouerait ça, pas ton profil ' + PA.PROFILES[prof].short + ' : ' + right + '.'; }
    else if (fb.kind === 'style') { cls = 'fb-style'; title = 'Jouable, mais pas le meilleur choix. Ton profil : ' + right + '.'; }
    else { cls = 'fb-err'; title = 'Erreur. La bonne décision : ' + right + '.'; }
    if (fb.note) title += '</b><br>' + fb.note + '<b>';
    var d = ui.drill, testMode = d.mode === 'test';
    if (q.custom) {
      var r2 = '<span class="pill" style="background:' + CSSVAR[actColor(q.answer, 'x')] + '">' + actName(q.answer, null) + '</span>';
      var c2 = fb.ok ? 'fb-ok' : 'fb-err', t2 = fb.timeout ? 'Temps écoulé. La bonne décision : ' + r2 + '.' : (fb.ok ? 'Bien joué : ' + r2 + '.' : 'Erreur. La bonne décision : ' + r2 + '.');
      return '<div class="card ' + c2 + ' stack">' + yo('<b>' + t2 + '</b><br>' + q.explain()) + '<button class="btn gold block" data-act="next">' + (d.i + 1 >= d.qs.length ? 'Voir le bilan' : 'Question suivante') + '</button></div>';
    }
    if (testMode) return '<button class="btn gold block" data-act="next">Main suivante</button>';
    return '<div class="card ' + cls + ' stack">' + yo('<b>' + title + '</b><br>' + explain(q, prof)) +
      '<div class="row"><button class="btn gold" data-act="next" style="flex:1">' + (d.i + 1 >= d.qs.length ? 'Voir le bilan' : 'Main suivante') + '</button><button class="btn" data-act="rangeCtx">Voir dans ma range</button></div></div>';
  }
  var timerH = null;
  function startTimer() {
    clearInterval(timerH); var d = ui.drill; if (!d || !d.chrono || d.fb || d.i >= d.qs.length) return;
    var t0 = Date.now(), T = 8000;
    timerH = setInterval(function () {
      var el = $('#tmr'); var left = Math.max(0, T - (Date.now() - t0));
      if (el) el.style.width = (left / T * 100) + '%';
      if (left <= 0) { clearInterval(timerH); answer(null); }
    }, 100);
  }
  function answer(given) {
    clearInterval(timerH);
    var d = ui.drill, q = d.qs[d.i], p = PA.player(), prof = p.profile || 'tag';
    var j = !given ? { ok: false, kind: 'error' } : (q.custom ? { ok: given === q.answer, kind: given === q.answer ? null : 'error' } : PA.judge(prof, q, given));
    var fb = { given: given, ok: j.ok, kind: j.kind, profiles: j.profiles, note: j.note, timeout: !given };
    d.answers.push({ q: q, given: given, ok: j.ok, kind: j.kind || null, profiles: j.profiles || null });
    if (d.mode !== 'test') {
      var score = j.ok ? 1 : (j.kind === 'style' ? 0.5 : 0);
      PA.updateNotion(p, q.notion, q.diff, score);
      if (!q.custom) { if (!j.ok) PA.srsMiss(p, q.key, { sit: q.sit, hand: q.hand }); else PA.srsHit(p, q.key); }
      PA.save();
      vibrate(j.ok ? 20 : [60, 40, 60]);
    }
    d.fb = fb; render();
  }
  function bilanHtml() {
    var d = ui.drill, p = PA.player();
    if (d.mode === 'test') return testResultHtml();
    var n = d.answers.length, ok = d.answers.filter(function (a) { return a.ok; }).length;
    var style = d.answers.filter(function (a) { return a.kind === 'style'; }), err = d.answers.filter(function (a) { return !a.ok && a.kind !== 'style'; });
    if (!d.saved) { p.sessions.unshift({ at: Date.now(), label: d.label, n: n, ok: ok, style: style.length, err: err.length, consult: d.consult }); p.sessions = p.sessions.slice(0, 200); p.last = null; PA.save(); d.saved = true; }
    var pctOk = Math.round(ok / Math.max(1, n) * 100);
    var msg = pctOk >= 85 ? 'Très solide. On monte la difficulté la prochaine fois.' : (pctOk >= 65 ? 'Bonne séance. Les mains ratées reviennent demain pour être revues.' : 'On a du travail, et c’est normal. Les mains ratées reviennent demain ; relis ta range sur les points ci-dessous.');
    var byNot = {}; d.answers.forEach(function (a) { var k = a.q.notion; byNot[k] = byNot[k] || [0, 0]; byNot[k][1]++; if (a.ok) byNot[k][0]++; });
    var out = '<div class="stack"><h1>Bilan</h1>' + yo(msg + (d.consult ? ' Tu as consulté ta range ' + d.consult + ' fois.' : '')) +
      '<div class="grid2"><div class="card"><div class="muted small">Bonnes décisions</div><div class="disp" style="font-size:40px">' + ok + ' / ' + n + '</div></div><div class="card"><div class="muted small">Erreurs · écarts de style</div><div class="disp" style="font-size:40px">' + err.length + ' · ' + style.length + '</div></div></div>' +
      '<div class="card stack"><b>Par notion</b><table class="tbl">' + Object.keys(byNot).map(function (k) { var st = PA.notionState(p, k); return '<tr><td>' + PA.NOTIONS[k] + '</td><td>' + byNot[k][0] + '/' + byNot[k][1] + '</td><td>Niveau ' + PA.level(st.r) + '/5</td></tr>'; }).join('') + '</table></div>';
    if (err.length || style.length) out += '<div class="card stack"><b>À revoir</b>' + err.concat(style).map(function (a) { return '<div>' + handText(a.q.cards) + ' — ' + (a.q.custom ? a.q.label : describeSit(a.q.sit)) + ' : ' + actName(a.q.answer, a.q.custom ? null : a.q.sit) + (a.kind === 'style' ? ' <span class="muted small">(écart de style)</span>' : '') + '</div>'; }).join('') + '</div>';
    out += '<div class="row"><button class="btn gold" data-act="again" style="flex:1">Recommencer</button><button class="btn" data-act="nav" data-v="entrainer">Terminer</button></div></div>';
    return out;
  }
  function testResultHtml() {
    var d = ui.drill, p = PA.player();
    var agree = {}; PA.BASE_PROFILES.forEach(function (id) { agree[id] = 0; });
    var errors = [], groups = { early: [0, 0], mid: [0, 0], late: [0, 0], bb: [0, 0] };
    d.answers.forEach(function (a) {
      var acts = {}; PA.BASE_PROFILES.forEach(function (id) { acts[id] = PA.actionFor(id, a.q.sit, a.q.hand); if (acts[id] === a.given) agree[id]++; });
      if (PA.BASE_PROFILES.every(function (id) { return acts[id] !== a.given; })) { var jj = PA.judge('tag', { sit: a.q.sit, hand: a.q.hand, answer: acts.tag }, a.given); if (!jj.ok && jj.kind === 'error') errors.push({ a: a, right: acts.tag }); }
    });
    var best = PA.BASE_PROFILES.slice().sort(function (x, y) { return agree[y] - agree[x] || (x === 'tag' ? -1 : 1); })[0];
    d.answers.forEach(function (a) {
      var s = a.q.sit, ref = PA.actionFor(best, s, a.q.hand), g;
      if (s.type === 'def' && s.pos === 'BB') g = 'bb'; else { var i = PA.POS.indexOf(s.pos); g = i <= 2 ? 'early' : (i <= 4 ? 'mid' : 'late'); }
      var play = a.given && a.given !== 'fold', refPlay = ref !== 'fold';
      if (play && !refPlay) groups[g][0]++; if (!play && refPlay) groups[g][1]++;
    });
    var gname = { early: 'en début de table', mid: 'en milieu de table', late: 'en fin de table (CO, bouton, SB)', bb: 'en défense de BB' };
    var tend = Object.keys(groups).map(function (g) { var x = groups[g]; if (x[1] >= 2 && x[1] > x[0]) return 'un peu serré ' + gname[g]; if (x[0] >= 2 && x[0] > x[1]) return 'un peu large ' + gname[g]; return null; }).filter(Boolean);
    if (!d.saved) { p.testDone = true; p.lastTest = { at: Date.now(), style: best, n: d.answers.length, errors: errors.length }; p.sessions.unshift({ at: Date.now(), label: 'Test de profil (' + d.answers.length + ' mains)', n: d.answers.length, ok: agree[best], style: 0, err: errors.length, consult: 0 }); errors.forEach(function (e) { PA.srsMiss(p, e.a.q.key, { sit: e.a.q.sit, hand: e.a.q.hand }); }); p.last = null; PA.save(); d.saved = true; }
    var pr = PA.PROFILES[best];
    var out = '<div class="stack"><h1>Ton profil</h1>' + yo('Ton style : <b>' + pr.name + (pr.short !== pr.name ? ' (' + pr.short + ')' : '') + '</b>' + (tend.length ? ', ' + tend.join(', ') : '') + '. ' + (errors.length ? errors.length + ' erreur' + (errors.length > 1 ? 's' : '') + ' à corriger : aucun profil ne joue ces mains comme toi. Elles reviendront dans ta séance du jour.' : 'Aucune erreur hors style : bravo.')) +
      '<div class="card stack"><b>Accord avec chaque profil</b><table class="tbl">' + PA.BASE_PROFILES.map(function (id) { return '<tr><td>' + PA.PROFILES[id].name + '</td><td>' + agree[id] + ' / ' + d.answers.length + '</td></tr>'; }).join('') + '</table></div>';
    if (errors.length) out += '<div class="card stack"><b>Erreurs à corriger</b>' + errors.map(function (e) { return '<div>' + handText(e.a.q.cards) + ' — ' + describeSit(e.a.q.sit) + ' : tu as choisi « ' + (e.a.given ? actName(e.a.given, e.a.q.sit) : 'rien') + ' », ton profil joue « ' + actName(e.right, e.a.q.sit) + ' ».</div>'; }).join('') + '</div>';
    out += '<div class="row"><button class="btn gold" data-act="adopt" data-v="' + best + '" style="flex:1">Adopter le profil ' + pr.short + '</button><button class="btn" data-act="nav" data-v="home">Garder mon profil (' + PA.PROFILES[p.profile || 'tag'].short + ')</button></div></div>';
    return out;
  }

  /* ---------- Analyser ---------- */
  function analyserView() {
    if (window.PA_HH) return window.PA_HH.view();
    return shell('analyser', '<div class="stack"><h1>Analyser</h1>' + yo('Ici arriveront l’import de tes historiques Winamax, la saisie rapide (et vocale) de tes mains du club, tes statistiques, tes fuites et le rejeu de tes mains. Ce sera la v2.2 : j’aurai besoin de quelques historiques Winamax pour la construire.') + '</div>');
  }

  /* ---------- Moi ---------- */
  function moiView() {
    var p = PA.player(), pr = PA.PROFILES[p.profile || 'tag'];
    var notions = Object.keys(PA.NOTIONS).map(function (k) { var st = p.notions[k]; return '<tr><td>' + PA.NOTIONS[k] + '</td><td>' + (st ? 'Niveau ' + PA.level(st.r) + '/5 <span class="muted small">(' + st.ok + '/' + st.n + ')</span>' : '<span class="muted">pas encore travaillé</span>') + '</td></tr>'; }).join('');
    var sess = p.sessions.slice(0, 8).map(function (s) { return '<tr><td>' + new Date(s.at).toLocaleDateString('fr-FR') + '</td><td>' + esc(s.label) + '</td><td>' + s.ok + '/' + s.n + '</td></tr>'; }).join('') || '<tr><td class="muted">Aucune séance pour l’instant.</td></tr>';
    var body = '<div class="stack"><h1>Moi</h1>' +
      '<div class="card stack"><div class="row" style="justify-content:space-between"><b class="disp" style="font-size:24px">' + esc(p.pseudo) + '</b><span class="chip">' + pr.short + '</span></div><div class="muted">Profil : ' + pr.name + (p.lastTest ? ' · dernier test : ' + PA.PROFILES[p.lastTest.style].short + ' le ' + new Date(p.lastTest.at).toLocaleDateString('fr-FR') : '') + '</div>' +
      '<div class="seg">' + Object.keys(PA.PROFILES).map(function (k) { return '<button class="' + (p.profile === k ? 'on' : '') + '" data-act="setProf" data-v="' + k + '">' + PA.PROFILES[k].short + '</button>'; }).join('') + '</div>' +
      '<button class="btn" data-act="testMenu">Refaire le test de profil</button></div>' +
      '<div class="card stack"><b>Ma progression par notion</b><table class="tbl">' + notions + '</table><div class="muted small">Mains à revoir en attente : ' + Object.keys(p.srs).length + '</div></div>' +
      '<div class="card stack"><b>Mon journal</b><table class="tbl">' + sess + '</table></div>' +
      '<a class="tile" href="#bankroll"><b>Bankroll</b><span>Tes résultats (Winamax, club, live), ROI, repères du cours et simulateur de variance.</span></a>' +
      '<a class="tile" href="#fiche"><b>Avant la partie</b><span>Ta fiche : structure, plan par phase, tes 3 fuites à surveiller, les adversaires attendus.</span></a>' +
      '<a class="tile" href="#reglages"><b>Réglages</b><span>Taille du texte, mode gaucher, vibration, remise à zéro, tout effacer.</span></a>' +
      '<a class="tile" href="#merci"><b>Remerciements</b><span>Version ' + VERSION + '</span></a>' +
      '<button class="btn" data-act="pickPlayer">Changer de joueur</button></div>';
    return shell('moi', body);
  }
  function reglagesView() {
    var p = PA.player(), s = p.settings;
    function seg(k, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (s[k] === o[0] ? 'on' : '') + '" data-act="set" data-k="' + k + '" data-v="' + JSON.stringify(o[0]).replace(/"/g, '&quot;') + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="moi">‹ Moi</button><h1>Réglages</h1>' +
      '<div class="card stack"><b>Taille du texte</b>' + seg('text', [[0.9, 'Normale'], [1, 'Grande'], [1.15, 'Très grande'], [1.3, 'Énorme']]) +
      '<b>Mode gaucher</b>' + seg('lefty', [[false, 'Non'], [true, 'Oui']]) +
      '<b>Vibration</b>' + seg('vibrate', [[true, 'Oui'], [false, 'Non']]) +
      '<b>Chrono par défaut</b>' + seg('chrono', [[false, 'Sans'], [true, '8 secondes']]) +
      '<b>Taille d’ouverture</b>' + seg('openSize', [['club', '2 BB (habitude du club)'], ['std', '2,2 à 2,5 BB']]) + '<div class="small muted">Utilisée dans les exercices et proposée en premier à la table. Depuis la SB : 3 BB.</div></div>' +
      '<div class="card stack"><b>Remise à zéro de l’entraînement</b><p class="muted">Efface tes niveaux, tes mains à revoir et ton journal. Ton profil et tes ranges personnalisées sont conservés.</p><button class="btn" data-act="resetTrain">Remettre l’entraînement à zéro</button></div>' +
      '<div class="card stack"><b>Tout effacer</b><p class="muted">Efface tous les joueurs et toutes les données de cet appareil.</p><button class="btn" data-act="wipe" style="border-color:#e03131;color:#ff8080">' + (ui.wipeArm ? 'Confirmer : tout effacer définitivement' : 'Tout effacer') + '</button></div></div>';
    return shell('moi', body);
  }
  function merciView() {
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="moi">‹ Moi</button><h1>Remerciements</h1>' +
      '<div class="card stack"><p>Merci à <b>Lionel</b>, « Yo » au club, pour sa bienveillance et sa pédagogie. C’est lui qui a inspiré le coach de cette appli.</p><p>Merci à tous les membres du club pour leur gentillesse et leur bonne humeur.</p></div>' +
      '<p class="muted small">Poker Academy · version ' + VERSION + ' · usage personnel, pour progresser au club.</p></div>';
    return shell('moi', body);
  }

  /* ---------- Rendu ---------- */
  function render() {
    applySettings();
    var app = $('#root');
    var s = PA.load(), p = PA.player();
    var r = (location.hash || '#home').slice(1).split('?')[0];
    if (r === 'pick') { app.innerHTML = pickPlayerView(); return; }
    if (!p) { app.innerHTML = Object.keys(s.players).length && !ui.forceNew ? pickPlayerView() : onbView(); return; }
    if (!p.profile || ui.onbActive) { if (!p.profile) ui.onb.step = Math.max(2, ui.onb.step); app.innerHTML = onbView(); return; }
    if (!ui.welcomed && /[?&]q=/.test(location.hash)) ui.welcomed = true; // ouverture depuis le widget
    if (!ui.welcomed) { app.innerHTML = welcomeView(); return; }
    var GV = (window.PA_GAME && window.PA_GAME.views) || {}, LV = (window.PA_LEARN && window.PA_LEARN.views) || {};
    if (/^lecon-\d+$/.test(r) && window.PA_LEARN) { app.innerHTML = window.PA_LEARN.lesson(parseInt(r.slice(6), 10)); window.scrollTo(0, 0); return; }
    var views = { lecons: LV.lecons, podcasts: LV.podcasts, examens: LV.examens, 'cours-imprimable': LV['cours-imprimable'], partie: GV.partie, jeu: GV.jeu, home: homeView, apprendre: apprendreView, ranges: rangesView, cours: coursView, entrainer: entrainerView, preflop: preflopView, situations: situationsView, testmenu: testMenuView, drill: drillView, analyser: analyserView, moi: moiView, reglages: reglagesView, merci: merciView, outils: function () { return window.PA_TOOLS ? window.PA_TOOLS.view() : homeView(); }, fiche: function () { return window.PA_TOOLS ? window.PA_TOOLS.fiche() : homeView(); }, bankroll: function () { return window.PA_BANK ? window.PA_BANK.view() : homeView(); }, cartes: function () { return window.PA_CARDS ? window.PA_CARDS.view() : homeView(); }, solveur: function () { return window.PA_SOLVER ? window.PA_SOLVER.explorer() : homeView(); }, apresflop: function () { return window.PA_SOLVER ? window.PA_SOLVER.quiz() : homeView(); } };
    app.innerHTML = (views[r] || homeView)();
    if (r === 'drill') startTimer(); else clearInterval(timerH);
    if (r === 'jeu' && window.PA_GAME) { var pl = PA.player(); }
    window.scrollTo(0, r === 'drill' ? window.scrollY : 0);
  }

  /* ---------- Événements ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var act = t.getAttribute('data-act'), v = t.getAttribute('data-v'), p = PA.player();
    if (act === 'closeSheet' && e.target.closest('[data-stop]') && t.classList.contains('sheet-bg')) return;
    switch (act) {
      case 'nav': go(v); break;
      case 'onb1': {
        var ps = $('#ps').value.trim(), bd = $('#ag').value.trim(), m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(bd);
        ui.onb.pseudo = ps; ui.onb.birth = bd;
        if (!ps) { $('#onbErr').textContent = 'Indique un pseudo.'; return; }
        if (!m) { $('#onbErr').textContent = 'Indique ta date de naissance sous la forme JJ/MM/AAAA.'; return; }
        var dd = +m[1], mm = +m[2], yy = +m[3], dt = new Date(yy, mm - 1, dd), now = new Date();
        if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd || dt > now || yy < 1900) { $('#onbErr').textContent = 'Cette date n’existe pas : vérifie le jour, le mois et l’année.'; return; }
        var ag = now.getFullYear() - yy - ((now.getMonth() < mm - 1 || (now.getMonth() === mm - 1 && now.getDate() < dd)) ? 1 : 0);
        if (ag < 18) { ui.onb.step = 0; render(); return; }
        PA.newPlayer(ps, ag); PA.player().birth = yy + '-' + m[2] + '-' + m[1]; PA.save(); ui.onb.step = 2; ui.onbActive = true; ui.welcomed = true; try { sessionStorage.setItem('pa2w', '1'); } catch (x) {} ui.forceNew = false; render(); break;
      }
      case 'onbBack': ui.onb.step = 1; render(); break;
      case 'pickProf': ui.onb.profile = v; render(); break;
      case 'onb2': p.profile = ui.onb.profile; PA.save(); ui.onb.step = 3; render(); break;
      case 'onbLater': ui.onbActive = false; ui.onb = { step: 1 }; go('home'); render(); break;
      case 'startTest': ui.onbActive = false; ui.onb = { step: 1 }; startDrill('test', { n: parseInt(v, 10) }, 'Test de profil'); render(); break;
      case 'testMenu': go('testmenu'); break;
      case 'pickPlayer': go('pick'); render(); break;
      case 'usePlayer': PA.load().current = v; PA.save(); ui.welcomed = true; try { sessionStorage.setItem('pa2w', '1'); } catch (x) {} go('home'); render(); break;
      case 'newPlayer': PA.load().current = null; PA.save(); ui.forceNew = true; ui.onb = { step: 1 }; go('home'); render(); break;
      case 'continue': ui.welcomed = true; try { sessionStorage.setItem('pa2w', '1'); } catch (x) {} render(); break;
      case 'range': if (location.hash === '#jeu' && window.PA_GAME) { var hc = window.PA_GAME.heroRangeCtx(); openRange(hc ? { sit: hc.sit, hand: hc.hand } : null); break; }
        if (ui.drill && location.hash === '#drill' && ui.drill.i < ui.drill.qs.length) { ui.drill.consult++; var q = ui.drill.qs[ui.drill.i]; openRange({ sit: q.sit, hand: ui.drill.fb ? q.hand : null }); } else openRange(); break;
      case 'rangeCtx': { var q2 = ui.drill.qs[ui.drill.i]; openRange({ sit: q2.sit, hand: q2.hand }); break; }
      case 'closeSheet': ui.sheet = null; renderSheet(); break;
      case 'rsTab': RS.tab = v; rerenderRange(); break;
      case 'rsType': RS.type = v; if (v === 'callshove' && PA.PUSH_DEPTHS.indexOf(RS.bb) < 0) RS.bb = 10; rerenderRange(); break;
      case 'rsDepth': RS.depth = v; rerenderRange(); break;
      case 'rsBB': RS.bb = parseInt(v, 10); rerenderRange(); break;
      case 'rsPos': RS.pos = v; rerenderRange(); break;
      case 'rsOp': RS.opener = v; rerenderRange(); break;
      case 'rsScen': RS.scen = v; rerenderRange(); break;
      case 'rsShove': var m = v.split(' vs shove '); RS.pos = m[0]; RS.opener = m[1]; rerenderRange(); break;
      case 'rsProf': RS.profile = v; RS.edit = false; render(); break;
      case 'toggleEdit': RS.edit = !RS.edit; rerenderRange(); break;
      case 'cell': zoomCell(v); break;
      case 'editCell': editCell(v); break;
      case 'print': window.print(); break;
      case 'seance': startDrill('seance', {}, 'Séance du jour'); render(); break;
      case 'pf': { var k = t.getAttribute('data-k'); PF[k] = k === 'n' ? parseInt(v, 10) : (k === 'chrono' ? v === 'true' : v); render(); break; }
      case 'startPreflop': startDrill('preflop', { kind: PF.kind, pos: PF.pos, depth: PF.depth, n: PF.n, chrono: PF.chrono }, 'Préflop'); render(); break;
      case 'startSit': startDrill('sit', { kind: v, n: 20, chrono: p.settings.chrono }, { push: 'Tapis ou fold', callshove: 'Payer un tapis', vs3bet: 'Face au 3-bet', icm: 'Bulle et ICM', pko: 'PKO et Space KO', outs: 'Outs et cote' }[v]); render(); break;
      case 'answer': answer(v); break;
      case 'next': ui.drill.i++; ui.drill.fb = null; render(); break;
      case 'quitDrill': clearInterval(timerH); ui.drill = null; go('entrainer'); break;
      case 'again': { var d = ui.drill; startDrill(d.mode, d.opts, d.label); render(); break; }
      case 'adopt': p.profile = v; PA.save(); go('home'); render(); break;
      case 'setProf': p.profile = v; PA.save(); render(); break;
      case 'set': { var k2 = t.getAttribute('data-k'); p.settings[k2] = JSON.parse(v); PA.save(); render(); break; }
      case 'resetTrain': PA.wipeTraining(p); render(); break;
      case 'wipe': if (!ui.wipeArm) { ui.wipeArm = true; render(); } else { ui.wipeArm = false; PA.wipeAll(); ui.welcomed = false; ui.onb = { step: 1 }; try { sessionStorage.removeItem('pa2w'); } catch (x) {} go('home'); render(); } break;
    }
  });
  function rerenderRange() { if (ui.sheet === 'range') renderSheet(); else { var el = $('#rangeFull'); if (el) el.innerHTML = rangeBody(true); } }
  function zoomCell(h) {
    var s = rsSit(), a = RS.tab === 'glob' ? null : PA.chart(RS.profile, s)[h];
    var div = document.createElement('div'); div.className = 'zoom';
    div.innerHTML = '<div><div class="disp" style="font-size:64px">' + h + '</div>' + (a ? '<div style="margin:12px 0"><span class="pill" style="font-size:22px;background:' + CSSVAR[actColor(a, s.type)] + '">' + actName(a, s) + '</span></div>' : '') + '<div class="muted">Bat une main au hasard ' + Math.round(PA.D.eq[h] * 100) + ' % du temps</div><button class="btn" style="margin-top:16px">Fermer</button></div>';
    div.addEventListener('click', function () { div.remove(); });
    document.body.appendChild(div);
  }
  function editCell(h) {
    var p = PA.player(), s = rsSit(), key = PA.sitKey(s);
    var cycle = s.type === 'open' ? (PA.depthKey(s.bb) === 'push' ? ['fold', 'allin'] : ['fold', 'raise']) : (s.type === 'vs3bet' ? ['fold', 'call', 'fourbet'] : (s.type === 'callshove' ? ['fold', 'call'] : ['fold', 'call', 'raise']));
    var cur = PA.chart('perso', s)[h], nx = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
    p.perso[key] = p.perso[key] || {}; p.perso[key][h] = nx; PA.save(); rerenderRange();
  }
  window.addEventListener('hashchange', function () { ui.sheet = null; renderSheet(); render(); });
  // date de naissance : les barres s'ajoutent toutes seules (JJ/MM/AAAA)
  document.addEventListener('input', function (e) {
    if (!e.target || e.target.id !== 'ag') return;
    var d = e.target.value.replace(/\D/g, '').slice(0, 8), out = d.slice(0, 2);
    if (d.length > 2) out += '/' + d.slice(2, 4);
    if (d.length > 4) out += '/' + d.slice(4);
    if (e.inputType && e.inputType.indexOf('delete') === 0 && /\/$/.test(e.target.value)) out = e.target.value;
    e.target.value = out;
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ui.sheet) { ui.sheet = null; renderSheet(); } });
  window.PA_UI_openRange = function (ctx) { openRange(ctx); };
  window.PA_UI = { render: render, shell: shell, yo: yo, esc: esc, actName: actName, describeSit: describeSit, IC: IC };
  render();
})();
