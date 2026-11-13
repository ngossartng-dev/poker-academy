/* Poker Academy — exercice « Quelle taille au flop ? » : une position, un flop, une main de ta range → check ou quelle taille.
   Les réponses suivent les tailles du club du chapitre 20. À la fin, un bilan par type de flop et par type de main
   pour voir si tu es cohérent. */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---- les flops : texture + mains de chaque type (main, ce qu'elle fait) ----
  // sec = sec et haut, paire = pairé, mono = trois cartes de la même couleur, mouille = connecté ou à tirages, bas = bas et connecté
  var BOARDS = [
    { b: 'Ks7d2c', t: 'sec', h: { monstre: [['7h7c', 'brelan de 7'], ['KhKd', 'brelan de rois']], forte: [['AhKd', 'top paire, kicker as'], ['AsAd', 'overpaire']], moyenne: [['8h8s', 'paire de 8 sous le roi'], ['As7s', 'paire de 7']], rien: [['QdJd', 'rien, deux cartes hautes'], ['Th9h', 'rien']] } },
    { b: 'Ah8c3d', t: 'sec', h: { monstre: [['8s8h', 'brelan de 8'], ['3s3c', 'brelan de 3']], forte: [['AsKd', 'top paire, kicker roi'], ['AdQc', 'top paire, kicker dame']], moyenne: [['9s9d', 'paire de 9 sous l’as'], ['Kh8h', 'paire de 8']], rien: [['KdQd', 'rien, deux cartes hautes'], ['JcTc', 'rien']] } },
    { b: 'Qd6s2h', t: 'sec', h: { monstre: [['6h6c', 'brelan de 6'], ['QsQc', 'brelan de dames']], forte: [['AhQs', 'top paire, kicker as'], ['KsKd', 'overpaire']], moyenne: [['9h9c', 'paire de 9 sous la dame'], ['A6s', 'paire de 6']], rien: [['AdJc', 'rien, as hauteur'], ['KhTh', 'rien']] } },
    { b: '8s8d3c', t: 'paire', h: { monstre: [['3h3d', 'full aux 3'], ['As8h', 'brelan de 8']], forte: [['AsAc', 'overpaire'], ['TdTh', 'overpaire']], moyenne: [['7s7c', 'paire de 7 sous le board'], ['A3s', 'deux paires avec le 8 du board, kicker faible']], rien: [['AdKc', 'rien, as hauteur'], ['QhJh', 'rien']] } },
    { b: 'TcTh4s', t: 'paire', h: { monstre: [['4d4c', 'full aux 4'], ['AsTs', 'brelan de 10']], forte: [['KhKs', 'overpaire'], ['QdQc', 'overpaire']], moyenne: [['8h8c', 'paire de 8 sous le board'], ['A4s', 'deuxième paire']], rien: [['AcQd', 'rien, as hauteur'], ['KdJd', 'rien']] } },
    { b: 'Kh9h4h', t: 'mono', h: { monstre: [['AhJh', 'couleur max'], ['QhTh', 'couleur']], forte: [['AsKd', 'top paire, kicker as'], ['KsQh', 'top paire avec un cœur']], moyenne: [['TsTd', 'paire de 10 sous le roi'], ['A9s', 'deuxième paire']], rien: [['QdJc', 'rien'], ['AcQs', 'rien, as hauteur']] } },
    { b: 'JhTh8c', t: 'mouille', h: { monstre: [['Qd9s', 'quinte'], ['JsJd', 'brelan de valets']], forte: [['AdJc', 'top paire, kicker as'], ['QsQc', 'overpaire']], moyenne: [['7s7d', 'paire de 7 sous le board'], ['As8s', 'paire de 8']], tirage: [['Ah5h', 'tirage couleur'], ['Kh4h', 'tirage couleur']], rien: [['Ac4d', 'rien'], ['Ks3s', 'rien, roi hauteur']] } },
    { b: '9s8s6d', t: 'mouille', h: { monstre: [['9h9c', 'brelan de 9'], ['7c5c', 'quinte']], forte: [['ThTc', 'overpaire'], ['Ad9d', 'top paire, kicker as']], moyenne: [['5h5d', 'petite paire sous le board'], ['A6o', 'troisième paire']], tirage: [['As4s', 'tirage couleur'], ['KsQs', 'tirage couleur']], rien: [['AhKd', 'rien, as hauteur'], ['KcJh', 'rien']] } },
    { b: 'Td9c7d', t: 'mouille', h: { monstre: [['8h6h', 'quinte'], ['TsTh', 'brelan de 10']], forte: [['JsJc', 'overpaire'], ['AsTc', 'top paire, kicker as']], moyenne: [['5s5c', 'petite paire sous le board'], ['A7o', 'troisième paire']], tirage: [['AdQd', 'tirage couleur'], ['Kd5d', 'tirage couleur']], rien: [['AhKs', 'rien, as hauteur'], ['Qc3s', 'rien']] } },
    { b: '6d5s4c', t: 'bas', h: { monstre: [['8h7h', 'quinte'], ['6h6s', 'brelan de 6'], ['7s3s', 'quinte']], forte: [['AsAd', 'overpaire'], ['A6o', 'top paire, kicker as']], moyenne: [['2h2c', 'petite paire'], ['As4h', 'paire de 4']], tirage: [['Ah3h', 'tirage quinte par les deux bouts'], ['Kh8h', 'tirage quinte ventral']], rien: [['KdQd', 'rien, deux cartes hautes'], ['AcJc', 'rien, as hauteur']] } },
    { b: '9s8d4c', t: 'bas', h: { monstre: [['9h8h', 'deux paires'], ['4s4h', 'brelan de 4']], forte: [['AdAc', 'overpaire'], ['A9o', 'top paire, kicker as']], moyenne: [['7s7h', 'paire de 7 sous le board'], ['A4o', 'troisième paire']], tirage: [['JhTh', 'tirage quinte par les deux bouts'], ['QsTs', 'tirage quinte ventral']], rien: [['KdQc', 'rien, deux cartes hautes'], ['AhJd', 'rien, as hauteur']] } },
    { b: '7h6c5d', t: 'bas', h: { monstre: [['9s8s', 'quinte'], ['7d7s', 'brelan de 7']], forte: [['KsKh', 'overpaire'], ['A7o', 'top paire, kicker as']], moyenne: [['3s3d', 'petite paire'], ['A5o', 'troisième paire']], tirage: [['As4s', 'tirage quinte par les deux bouts'], ['Kh4h', 'tirage quinte par les deux bouts']], rien: [['KdJc', 'rien'], ['AcQs', 'rien, as hauteur']] } }
  ];
  var TEX = { sec: 'board sec et haut', paire: 'board pairé', mono: 'board de trois cartes de la même couleur', mouille: 'board connecté, à tirages', bas: 'board bas et connecté' };
  var TGROUP = { sec: 'Board sec, pairé ou d’une couleur', paire: 'Board sec, pairé ou d’une couleur', mono: 'Board sec, pairé ou d’une couleur', mouille: 'Board à tirages', bas: 'Board bas et connecté' };
  var CAT = { monstre: 'Très grosse main', forte: 'Main forte', moyenne: 'Main moyenne', tirage: 'Tirage', rien: 'Rien' };
  var WET = { mouille: 1, bas: 1 };

  // ---- les situations ----
  var CBET = [
    ['BTN', 'BB', 'ip', 'Tu ouvres à 2 BB au bouton, la grosse blinde paie. Elle checke : à toi.'],
    ['CO', 'BB', 'ip', 'Tu ouvres à 2 BB au cut-off, la grosse blinde paie. Elle checke : à toi.'],
    ['HJ', 'BB', 'ip', 'Tu ouvres à 2 BB au hijack, la grosse blinde paie. Elle checke : à toi.'],
    ['UTG', 'BB', 'ip', 'Tu ouvres à 2 BB en UTG, la grosse blinde paie. Elle checke : à toi.'],
    ['CO', 'BTN', 'oop', 'Tu ouvres à 2 BB au cut-off, le bouton paie. Tu parles en premier.']];
  var MULTI = [
    ['CO', 'Tu ouvres à 2 BB au cut-off, le bouton et la grosse blinde paient. La grosse blinde checke, tu parles avant le bouton.'],
    ['HJ', 'Tu ouvres à 2 BB au hijack, le cut-off et la grosse blinde paient. La grosse blinde checke, tu parles avant le cut-off.']];
  var DONK = [['BTN', 'le bouton'], ['CO', 'le cut-off'], ['HJ', 'le hijack']];

  var SIZE = { check: 0, petit: 1, moitie: 2, gros: 3, surmise: 4, fold: -1, call: 0, crs: 1, crb: 2 };
  function f1(x) { return (Math.round(x * 2) / 2).toString().replace('.', ','); }
  function betOpts(pot) {
    return [['check', 'Check'], ['petit', 'Petit : 25 à 35 % (' + f1(pot * 0.25) + ' à ' + f1(pot * 0.35) + ' BB)'], ['moitie', 'La moitié : 50 à 66 % (' + f1(pot * 0.5) + ' à ' + f1(pot * 0.66) + ' BB)'], ['gros', 'Gros : 66 à 75 % (' + f1(pot * 0.66) + ' à ' + f1(pot * 0.75) + ' BB)'], ['surmise', 'Surmise : 100 à 125 % (' + f1(pot) + ' à ' + f1(pot * 1.25) + ' BB)']];
  }
  var CR_OPTS = [['fold', 'Se coucher'], ['call', 'Payer'], ['crs', 'Relancer 2,2 à 2,5 fois (environ 5 BB)'], ['crb', 'Relancer 3 à 4 fois (6 à 8 BB)']];

  // ---- la réponse du club (chapitre 20) ----
  function decide(q) {
    var wet = !!WET[q.tex], c = q.cat;
    if (q.spot === 'cbet') {
      if (!wet) {
        if (c === 'monstre') return { a: 'petit', why: 'Très grosse main sur un ' + TEX[q.tex] + ' : 25 à 33 % au flop pour le garder dans le coup, puis tu grossis à la turn et à la river.' };
        return { a: 'petit', why: 'Sur un ' + TEX[q.tex] + ', le club mise 25 à 33 % avec presque toute sa range : ' + (c === 'rien' ? 'ton bluff coûte peu et l’adversaire a rarement touché.' : c === 'moyenne' ? 'ta main moyenne prend de la valeur aux mains plus faibles et ne gonfle pas le pot.' : 'ta main forte se fait payer par les mains plus faibles.') };
      }
      if (c === 'monstre' || c === 'forte') return { a: 'gros', why: 'Main ' + (c === 'monstre' ? 'très forte' : 'forte') + ' sur un ' + TEX[q.tex] + ' : 66 à 75 % du pot, pour faire payer cher les tirages.' };
      if (c === 'tirage') return { a: 'petit', why: 'Tirage (semi-bluff) : repère du club, 25 à 35 % du pot. Ça coûte peu, et si on te paie tu gardes tes outs.' };
      return { a: 'check', why: c === 'moyenne' ? 'Main moyenne sur un ' + TEX[q.tex] + ' : check. Une mise ne fait payer que les mains meilleures et les tirages.' : 'Rien sur un ' + TEX[q.tex] + ' : check. Ce board touche beaucoup la range qui a payé, ton bluff passe trop rarement.' };
    }
    if (q.spot === 'multi') {
      if (c === 'monstre' || c === 'forte') return { a: 'moitie', why: 'À trois joueurs : 50 à 66 %, plus gros qu’à deux, pour faire payer les tirages. On mise surtout pour la valeur.' };
      if (c === 'tirage') return { a: 'moitie', why: 'À trois, presque pas de bluffs, sauf les gros tirages : ce tirage peut miser 50 à 66 %.' };
      return { a: 'check', why: 'À trois joueurs, presque pas de bluffs : ' + (c === 'moyenne' ? 'ta main moyenne checke.' : 'sans main ni gros tirage, tu checkes.') };
    }
    if (q.spot === 'donk') {
      if (q.tex === 'bas' && (c === 'monstre' || c === 'forte')) return { a: 'moitie', why: 'Donk bet du club : 50 % du pot, sur un board bas et connecté qui t’aide plus que lui, avec une main qui veut être payée.' };
      if (q.tex !== 'bas') return { a: 'check', why: 'Pas de donk bet sur un ' + TEX[q.tex] + ' : il aide le relanceur. Tu checkes et tu le laisses miser.' };
      return { a: 'check', why: 'Board bas et connecté, mais ta main ne veut pas encore être payée : check, et tu vois ce qu’il fait.' };
    }
    // check-raise : il mise 2 BB dans un pot de 6 BB
    if (c === 'monstre') return wet ? { a: 'crb', why: 'Check-raise sur un ' + TEX[q.tex] + ' : 3 à 4 fois sa mise, pour faire payer cher les tirages.' } : { a: 'crs', why: 'Check-raise sur un ' + TEX[q.tex] + ' : 2,2 à 2,5 fois sa mise, pour garder les mains plus faibles dans le coup.' };
    if (c === 'moyenne') return { a: 'call', why: 'Main moyenne face à une petite mise : tu paies. Relancer ne fait payer que les mains meilleures.' };
    return { a: 'fold', why: 'Rien, sans tirage, sur un ' + TEX[q.tex] + ' : tu te couches. Ta main gagne trop rarement à l’abattage.' };
  }

  // ---- les questions ----
  function makeQ() {
    var r = Math.random(), q = {};
    q.spot = r < 0.5 ? 'cbet' : r < 0.65 ? 'multi' : r < 0.82 ? 'donk' : 'cr';
    var bs = BOARDS;
    if (q.spot === 'donk') bs = Math.random() < 0.6 ? BOARDS.filter(function (B) { return B.t === 'bas'; }) : BOARDS.filter(function (B) { return B.t !== 'bas'; });
    var B = pick(bs); q.board = B.b; q.tex = B.t;
    var cats = Object.keys(B.h);
    if (q.spot === 'donk') cats = cats.filter(function (k) { return k !== 'tirage'; });
    if (q.spot === 'cr') cats = WET[q.tex] ? ['monstre', 'moyenne', 'rien'] : ['monstre', 'moyenne'];
    q.cat = pick(cats);
    var hh = pick(B.h[q.cat]); q.hand = hh[0]; q.what = hh[1];
    if (q.spot === 'cbet') { var s = pick(CBET); q.pos = s[0]; q.story = s[3]; q.pot = 6; }
    else if (q.spot === 'multi') { var m = pick(MULTI); q.pos = m[0]; q.story = m[1]; q.pot = 8; }
    else if (q.spot === 'donk') { var d = pick(DONK); q.pos = 'BB'; q.story = cap(d[1]) + ' ouvre à 2 BB, tu paies en grosse blinde. Tu parles en premier.'; q.pot = 6; }
    else { var d2 = pick(DONK); q.pos = 'BB'; q.story = cap(d2[1]) + ' ouvre à 2 BB, tu paies en grosse blinde. Tu checkes, il mise 2 BB (un tiers du pot).'; q.pot = 6; }
    q.opts = q.spot === 'cr' ? CR_OPTS : betOpts(q.pot);
    q.res = decide(q);
    return q;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  var SU = { s: ['♠', 0], h: ['♥', 1], d: ['♦', 1], c: ['♣', 0] };
  function cards(str, cls) { var o = ''; str = str.replace(/\s/g, ''); for (var i = 0; i + 1 < str.length; i += 2) { var r = str[i], s = SU[str[i + 1]]; if (!s) continue; o += '<span class="pq-card ' + (cls || 'small') + (s[1] ? ' red' : '') + '">' + (r === 'T' ? '10' : r) + '<small>' + s[0] + '</small></span>'; } return o; }
  // une main notée « A6s » (sans couleurs) reçoit des couleurs qui ne sont pas sur le board
  function realHand(h, board) {
    if (h.length === 4) return h;
    var used = board.match(/../g), S = shuffle(['s', 'h', 'd', 'c']), a, b;
    if (h[2] === 's') { for (var i = 0; i < 4; i++) { a = S[i]; if (used.indexOf(h[0] + a) < 0 && used.indexOf(h[1] + a) < 0) break; } return h[0] + a + h[1] + a; }
    for (var j = 0; j < 4; j++) { a = S[j]; if (used.indexOf(h[0] + a) < 0) break; }
    for (var k = 0; k < 4; k++) { b = S[k]; if (b !== a && used.indexOf(h[1] + b) < 0) break; }
    return h[0] + a + h[1] + b;
  }

  // ======================================================================
  // Le moteur commun : une série de 12 questions, une correction de Yo, un bilan de cohérence.
  // Trois exercices l'utilisent : « Quelle taille au flop ? », « Face à une mise », « Turn et river ».
  // ======================================================================
  var EX = {};
  function store(id) { var p = window.PA.player(); if (!p) return null; p[id] = p[id] || { hist: [] }; return p; }
  function record(ex, q, given) {
    var p = store(ex.id), ok = given === q.res.a; if (!p) return ok;
    var dir = ok ? 0 : (ex.size[given] > ex.size[q.res.a] ? 1 : -1);
    p[ex.id].hist.push({ at: Date.now(), s: q.spot, t: q.tg || q.tex, c: q.cat, ok: ok ? 1 : 0, d: dir });
    if (p[ex.id].hist.length > 300) p[ex.id].hist = p[ex.id].hist.slice(-300);
    if (window.PA.updateNotion) window.PA.updateNotion(p, ex.id, 1350, ok ? 1 : 0);
    window.PA.save();
    return ok;
  }
  function bilanHtml(ex, list, title) {
    if (!list.length) return '';
    var g = {}, sp = {};
    list.forEach(function (x) {
      var k = ex.group(x), o = g[k] = g[k] || { n: 0, ok: 0, up: 0, down: 0 }; o.n++; o.ok += x.ok; if (x.d > 0) o.up++; if (x.d < 0) o.down++;
      var sk = ex.spots[x.s] || x.s, s2 = sp[sk] = sp[sk] || { n: 0, ok: 0 }; s2.n++; s2.ok += x.ok;
    });
    var rows = Object.keys(g).map(function (k) { var o = g[k]; return { k: k, o: o, r: o.ok / o.n }; }).sort(function (a, b) { return a.r - b.r || b.o.n - a.o.n; });
    var weak = rows.filter(function (x) { return x.r < 0.75; });
    var out = '<div class="card stack"><b>' + title + '</b>';
    out += '<div class="tl-sp">' + Object.keys(sp).map(function (k) { var o = sp[k]; return '<span><b>' + Math.round(100 * o.ok / o.n) + ' %</b> ' + k + ' (' + o.ok + '/' + o.n + ')</span>'; }).join('') + '</div>';
    if (!weak.length) out += '<div>Tu es cohérent : aucune famille de situations sous 75 % de bonnes réponses.</div>';
    else out += '<div class="small muted">À travailler en premier :</div>' + weak.slice(0, 4).map(function (x) {
      var tip = x.o.up > x.o.down ? ex.tipUp : x.o.down > x.o.up ? ex.tipDown : 'tes erreurs vont dans les deux sens';
      return '<div class="tl-row"><b>' + x.k + '</b> : ' + x.o.ok + '/' + x.o.n + ' — ' + tip + '.</div>';
    }).join('');
    return out + '</div>';
  }
  var N = 12, CUR = null;
  function newSeries(ex) { var l = []; for (var i = 0; i < N; i++) { var q = ex.make(); q.cards = realHand(q.hand, q.board); l.push(q); } return { list: l, i: 0, ok: 0, ans: null, done: [] }; }
  function exView(id) {
    var ui = U(), ex = EX[id]; CUR = id;
    if (!ex.Q) ex.Q = newSeries(ex);
    var Q = ex.Q, head = '<div class="stack"><button class="back" data-act="nav" data-v="apresflophub">‹ Après le flop</button><h1>' + ex.title + '</h1>';
    if (Q.i >= Q.list.length) {
      var p = store(ex.id), all = p ? p[ex.id].hist : [];
      return ui.shell('entrainer', head + ui.yo(Q.ok + (Q.ok > 1 ? ' bonnes réponses' : ' bonne réponse') + ' sur ' + Q.list.length + '. ' + (Q.ok >= 10 ? ex.good : ex.bad)) +
        bilanHtml(ex, Q.done, 'Cette série') + (all.length > Q.done.length ? bilanHtml(ex, all.slice(-100), 'Tes 100 dernières réponses') : '') +
        '<button class="btn gold block" data-tl="again">Nouvelle série</button>' + ex.links + '</div>');
    }
    var q = Q.list[Q.i], out = head + (Q.i === 0 && Q.ans === null ? '<div class="small muted">' + ex.intro + '</div>' : '') +
      '<div class="small muted">Question ' + (Q.i + 1) + ' sur ' + Q.list.length + ' · ' + Q.ok + ' bonne' + (Q.ok > 1 ? 's' : '') + ' réponse' + (Q.ok > 1 ? 's' : '') + '</div>' +
      '<div class="card stack"><div>' + q.story + ' Pot de ' + q.pot + ' BB.</div><div class="small muted">' + (q.board.length > 6 ? 'Le board' : 'Le flop') + '</div><div class="pq-hand">' + cards(q.board) + '</div><div class="small muted">Ta main</div><div class="pq-hand">' + cards(q.cards) + '</div></div>';
    if (Q.ans === null) out += '<div class="stack">' + q.opts.map(function (o) { return '<button class="btn block" data-tl="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
    else {
      var good = Q.ans === q.res.a, lab = q.opts.filter(function (o) { return o[0] === q.res.a; })[0][1];
      out += '<div class="pq-res ' + (good ? 'ok' : 'ko') + '">' + (good ? 'Oui : ' : 'Non : ') + lab.charAt(0).toLowerCase() + lab.slice(1) + '.</div>' +
        ui.yo('Ta main : ' + q.what + (q.tex ? ', sur un ' + TEX[q.tex] : '') + '. ' + q.res.why) + '<button class="btn gold block" data-tl="next">' + (Q.i + 1 >= Q.list.length ? 'Voir mon bilan' : 'Question suivante') + '</button>';
    }
    return ui.shell('entrainer', out + '</div>');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tl]') : null; if (!t || !CUR) return;
    var ex = EX[CUR], a = t.getAttribute('data-tl'), Q = ex.Q;
    if (a === 'again') ex.Q = null;
    else if (!Q) return;
    else if (a === 'next') { Q.i++; Q.ans = null; }
    else if (Q.ans === null) { var q = Q.list[Q.i]; Q.ans = a; var ok = record(ex, q, a); if (ok) Q.ok++; Q.done.push({ s: q.spot, t: q.tg || q.tex, c: q.cat, ok: ok ? 1 : 0, d: ok ? 0 : (ex.size[a] > ex.size[q.res.a] ? 1 : -1) }); }
    U().render(); window.scrollTo(0, 0);
  });

  // ---- 1. Quelle taille au flop ? ----
  EX.taille = { id: 'taille', title: 'Quelle taille au flop ?', make: makeQ, size: SIZE,
    spots: { cbet: 'Continuation bet', multi: 'À trois joueurs', donk: 'Donk bet', cr: 'Check-raise' },
    group: function (x) { return (x.s === 'cr' ? 'Check-raise' : x.s === 'donk' ? 'Donk bet' : x.s === 'multi' ? 'À trois joueurs' : TGROUP[x.t]) + ' · ' + CAT[x.c]; },
    tipUp: 'trop agressif : tu mises trop gros ou tu relances trop', tipDown: 'trop passif : tu mises trop petit, tu checkes ou tu te couches trop',
    intro: 'Une position, un flop, ta main : check ou quelle taille ? Les réponses suivent les tailles du club (chapitre 20). Tapis de 40 BB et plus. À la fin, un bilan te montre où tu n’es pas cohérent.',
    good: 'Tes tailles suivent bien le board et ta main.', bad: 'Relis « Les tailles du club au flop » au chapitre 20 : la taille dépend du board, de ta main et du nombre d’adversaires.',
    links: '<a class="btn block" href="#lecon-20">Relire le chapitre 20</a>' };

  // ---- 2. Face à une mise : se coucher, payer ou relancer ----
  var FSZ = { tiers: [2, 'un tiers du pot', 20, 75], moitie: [3, 'la moitié du pot', 25, 67], troisq: [4.5, 'trois quarts du pot', 30, 57], pot: [6, 'la taille du pot', 33, 50] };
  var FCAT = { monstre: 'Très grosse main', forte: 'Main forte', moyenne: 'Main moyenne', tirage: 'Tirage', ventral: 'Tirage ventral', rien: 'Rien' };
  function faceDecide(q) {
    var z = FSZ[q.sz], wet = !!WET[q.tex], need = 'Il te faut ' + z[2] + ' % d’équité pour payer ' + z[1] + ', et tu dois garder environ ' + z[3] + ' % de ta range.';
    if (q.cat === 'monstre') return { a: 'raise', why: 'Très grosse main : tu relances (check-raise ' + (wet ? '3 à 4 fois sa mise sur ce board à tirages' : '2,2 à 2,5 fois sa mise sur ce board sec') + ', chapitre 21). Payer seulement laisse les tirages venir gratuitement.' };
    if (q.cat === 'forte') return { a: 'call', why: 'Main forte : tu paies. ' + need + ' Relancer ne fait coucher que les mains plus faibles et fait payer les meilleures.' };
    if (q.cat === 'moyenne') {
      if (q.sz === 'pot' && wet) return { a: 'fold', why: 'Main moyenne face à une mise du pot sur un board à tirages : tu te couches. ' + need + ' Ici, une grosse mise d’un joueur du club, c’est souvent une vraie main, et ta paire est loin devant rarement.' };
      return { a: 'call', why: 'Main moyenne : tu paies. ' + need + ' Ta paire est souvent devant un bluff ou un tirage.' };
    }
    if (q.cat === 'ventral') return { a: 'fold', why: 'Un tirage ventral, c’est 4 outs : environ 17 % sur deux cartes. ' + need + ' Ça ne suffit pas seul : tu te couches.' };
    if (q.cat === 'tirage') {
      if (q.sz === 'tiers' && wet) return { a: 'raise', why: 'Tirage face à une petite mise sur un board à tirages : tu relances (semi-bluff). Il peut se coucher tout de suite, et sinon tu as encore tes outs. Le solveur relance ces tirages très souvent (chapitre 21).' };
      return { a: 'call', why: 'Un tirage couleur ou par les deux bouts, c’est 8 à 9 outs : environ 32 à 35 % sur deux cartes. ' + need + ' Tu paies.' };
    }
    return { a: 'fold', why: 'Rien, sans tirage : tu te couches. ' + need + ' Ta main ne gagne presque jamais.' };
  }
  function faceMake() {
    var B = pick(BOARDS), q = { tex: B.t, board: B.b, spot: pick(['tiers', 'moitie', 'troisq', 'pot']) };
    q.sz = q.spot; var cat = pick(Object.keys(B.h)), hh = pick(B.h[cat]);
    q.cat = /ventral/.test(hh[1]) ? 'ventral' : cat; q.hand = hh[0]; q.what = hh[1]; q.pot = 6;
    var z = FSZ[q.sz], o = pick([['le bouton', 1], ['le cut-off', 1], ['le hijack', 1], ['le cut-off', 0]]);
    q.story = o[1] ? cap(o[0]) + ' ouvre à 2 BB, tu paies en grosse blinde. Tu checkes, il mise ' + f1(z[0]) + ' BB (' + z[1] + ').' : 'Le cut-off ouvre à 2 BB, tu paies au bouton. Au flop, il mise ' + f1(z[0]) + ' BB (' + z[1] + ').';
    q.opts = [['fold', 'Se coucher'], ['call', 'Payer ' + f1(z[0]) + ' BB'], ['raise', 'Relancer']];
    q.res = faceDecide(q); return q;
  }
  EX.facemise = { id: 'facemise', title: 'Face à une mise', make: faceMake, size: { fold: -1, call: 0, raise: 1 },
    spots: { tiers: 'Face à un tiers du pot', moitie: 'Face à la moitié du pot', troisq: 'Face à trois quarts du pot', pot: 'Face à la taille du pot' },
    group: function (x) { return TGROUP[x.t] + ' · ' + FCAT[x.c]; },
    tipUp: 'trop agressif : tu relances ou tu paies trop', tipDown: 'trop passif : tu te couches trop, ou tu paies au lieu de relancer',
    intro: 'On te mise dessus au flop : tu te couches, tu paies ou tu relances ? Ça dépend de la taille de la mise, de ta main et du board (chapitres 21 et 18). À la fin, un bilan te dit si tu te couches trop ou si tu paies trop.',
    good: 'Tu défends comme il faut selon la taille de la mise.', bad: 'Relis « Défendre : la cote et la défense minimale » au chapitre 21 et « Combien de mains garder face à une mise ? » au chapitre 18.',
    links: '<a class="btn block" href="#lecon-21">Relire le chapitre 21</a>' };

  // ---- 3. Turn et river : continuer, ralentir, quelle taille ----
  var TURNS = [
    { flop: '8s6d2c', turn: 'Ah', tc: 'aide', h: { monstre: [['8h8c', 'brelan de 8']], forte: [['AsKd', 'paire d’as, kicker roi']], moyenne: [['9s9h', 'paire de 9, sous l’as qui vient de tomber'], ['Kd8d', 'paire de 8']], tirage: [['7h5h', 'tirage quinte par les deux bouts']], rien: [['KcQc', 'rien'], ['JdTd', 'rien']] } },
    { flop: 'Kd8s3c', turn: '2d', tc: 'blanche', h: { monstre: [['8c8h', 'brelan de 8']], forte: [['AhKs', 'top paire, kicker as']], moyenne: [['Qc8c', 'paire de 8'], ['7s7d', 'paire de 7']], tirage: [['Ad5d', 'tirage couleur']], rien: [['QhJh', 'rien'], ['Ts9s', 'rien']] } },
    { flop: 'Th9s2d', turn: '8d', tc: 'complete', h: { monstre: [['QcJc', 'quinte']], forte: [['AsTc', 'top paire, kicker as'], ['AsAh', 'overpaire']], moyenne: [['5s5c', 'petite paire']], tirage: [['Ad4d', 'tirage couleur']], rien: [['AhKc', 'rien']] } },
    { flop: '7h6h2c', turn: '3h', tc: 'complete', h: { monstre: [['Ah9h', 'couleur max']], forte: [['AsAd', 'overpaire, sans cœur'], ['KcKs', 'overpaire, sans cœur']], moyenne: [['Kd7d', 'paire de 7']], rien: [['KsQd', 'rien'], ['JcTc', 'rien']] } },
    { flop: 'Qs7d3c', turn: 'Ks', tc: 'aide', h: { monstre: [['7c7h', 'brelan de 7']], forte: [['AhKd', 'paire de rois, kicker as']], moyenne: [['AcQd', 'paire de dames, sous le roi qui vient de tomber'], ['8s8d', 'paire de 8']], tirage: [['JsTs', 'tirage couleur et quinte']], rien: [['Ad5d', 'rien'], ['9h8h', 'rien']] } }
  ];
  var RIVERS = [
    { b: 'Kd8s3c2d7s', h: { forte: [['8c8h', 'brelan de 8'], ['AhKs', 'top paire, kicker as']], fine: [['KcTh', 'top paire, kicker moyen']], catcher: [['Qc8c', 'paire de 8'], ['9s9c', 'paire de 9']], bluff: [['Ad5d', 'couleur à carreau ratée ; ton as retire ses as']], rien: [['QhJh', 'rien, sans bloqueur'], ['Ts9s', 'rien, sans bloqueur']] } },
    { b: 'JhTh4c2s6d', h: { forte: [['JsJd', 'brelan de valets'], ['AdJc', 'top paire, kicker as']], fine: [['Jc9c', 'top paire, kicker 9']], catcher: [['8s8d', 'paire de 8'], ['Ts5s', 'paire de 10']], bluff: [['KhQh', 'couleur et quinte ratées ; ton roi et ta dame retirent ses rois-valets et dames-valets']], rien: [['Ac3c', 'rien, sans bloqueur']] } },
    { b: 'Ah9c5d3sJh', h: { forte: [['AsJc', 'deux paires, as et valets'], ['9h9d', 'brelan de 9']], fine: [['AdTd', 'top paire, kicker 10']], catcher: [['Kc9s', 'paire de 9'], ['7s7h', 'paire de 7']], bluff: [['Ts8s', 'quinte ratée ; ton 10 retire ses valet-10']], rien: [['Qc6c', 'rien, sans bloqueur']] } }
  ];
  var TCARD = { aide: 'une carte qui t’aide (une carte haute qui arrive sur un board plus bas : tu as plus de ces mains que lui)', blanche: 'une carte blanche, qui ne change rien', complete: 'une carte qui complète une couleur ou une quinte' };
  var RCAT = { monstre: 'Très grosse main', forte: 'Valeur forte', fine: 'Valeur fine', moyenne: 'Main moyenne', catcher: 'Bluff-catcher', tirage: 'Tirage', bluff: 'Tirage raté qui bloque', rien: 'Rien' };
  function trDecide(q) {
    var c = q.cat;
    if (q.spot === 'turn') {
      if (c === 'monstre') return { a: 'gros', why: 'Très grosse main : 66 à 75 % du pot, ou la taille du pot à 40 BB, pour préparer le tapis à la river.' };
      if (c === 'forte') return q.tc === 'complete' ? { a: 'check', why: 'Ta paire haute ralentit : la turn complète une couleur ou une quinte. Check, tu contrôles le pot (chapitre 25).' } : { a: 'gros', why: 'Main forte et ' + TCARD[q.tc] + ' : 66 à 75 % du pot, pour faire payer les tirages et préparer la river.' };
      if (c === 'moyenne') return { a: 'check', why: 'Main moyenne : check. Une deuxième mise ne fait payer que les mains meilleures, et ta main gagne souvent au check.' };
      if (c === 'tirage') return { a: 'moyen', why: 'Tirage qui garde beaucoup d’outs : deuxième mise en semi-bluff, 50 à 66 % du pot. Il peut se coucher, et sinon tu as encore tes outs.' };
      return q.tc === 'aide' ? { a: 'moyen', why: 'Rien, mais ' + TCARD.aide + ' : c’est le bon moment pour une deuxième mise (double barrel), 50 à 66 % du pot.' } : { a: 'check', why: 'Rien, et ' + TCARD[q.tc] + ' : ton bluff passe trop rarement. Check, et tu abandonnes si elle mise.' };
    }
    if (q.spot === 'delayed') {
      if (c === 'moyenne') return { a: 'check', why: 'Main moyenne : check. Elle gagne souvent au check, et une mise ne fait payer que mieux.' };
      return { a: 'moyen', why: 'Le flop a été checké des deux côtés et elle checke encore la turn : elle a montré de la faiblesse. Mise retardée (delayed c-bet), environ 50 % du pot.' };
    }
    if (q.spot === 'riverOop') {
      if (c === 'forte') return { a: 'gros', why: 'Valeur forte : tu mises 66 à 75 % du pot. Si tu checkes, il checke souvent derrière avec ce qui t’aurait payé.' };
      if (c === 'catcher') return { a: 'petit', why: 'Main moyenne hors de position : une mise de blocage (block bet) de 20 à 33 % du pot. Tu fixes un petit prix au lieu de subir une grosse mise.' };
      return { a: 'check', why: 'Rien : check, et tu abandonnes le pot s’il mise.' };
    }
    // river en position, elle a checké
    if (c === 'forte') return { a: 'gros', why: 'Valeur forte : ta main bat presque tout ce qui paie. 66 à 75 % du pot.' };
    if (c === 'fine') return { a: 'petit', why: 'Valeur fine : une petite mise, 25 à 40 % du pot. Les paires plus faibles te paient encore ; une grosse mise ne ferait payer que mieux.' };
    if (c === 'catcher') return { a: 'check', why: 'Bluff-catcher : ta main bat ses bluffs, pas sa valeur. Check derrière, tu gagnes souvent à l’abattage.' };
    if (c === 'bluff') return { a: 'gros', why: 'Tirage raté qui bloque ses payes : c’est le meilleur bluff. Même taille que ta valeur, 66 à 75 %, sinon ta taille trahit ta main.' };
    return { a: 'check', why: 'Rien, et ta main ne bloque aucune de ses payes : check, tu abandonnes le pot. Garde tes bluffs pour les mains qui bloquent.' };
  }
  function trMake() {
    var r = Math.random(), q = {};
    if (r < 0.55) {
      var T = pick(TURNS), delayed = r < 0.12 && T.tc !== 'complete';
      q.spot = delayed ? 'delayed' : 'turn'; q.tc = T.tc; q.board = T.flop + T.turn;
      q.cat = pick(Object.keys(T.h)); var hh = pick(T.h[q.cat]); q.hand = hh[0]; q.what = hh[1];
      q.pot = delayed ? 6 : 10;
      q.story = delayed ? 'Tu as ouvert à 2 BB au bouton, la grosse blinde a payé. Le flop a été checké des deux côtés. Turn : elle checke encore.' : 'Tu as ouvert à 2 BB au bouton, la grosse blinde a payé. Au flop, tu as misé un tiers du pot, elle a payé. Turn : elle checke.';
      q.opts = [['check', 'Check'], ['moyen', 'Moyen : 50 à 66 % (' + f1(q.pot * 0.5) + ' à ' + f1(q.pot * 0.66) + ' BB)'], ['gros', 'Gros : 66 à 75 % ou le pot (' + f1(q.pot * 0.66) + ' à ' + f1(q.pot) + ' BB)'], ['surmise', 'Surmise : 120 à 150 % (' + f1(q.pot * 1.2) + ' à ' + f1(q.pot * 1.5) + ' BB)']];
      q.tex = null; q.tg = delayed ? 'Turn après un flop checké' : 'Turn : ' + { aide: 'carte qui t’aide', blanche: 'carte blanche', complete: 'carte qui complète' }[T.tc];
    } else {
      var R = pick(RIVERS), oop = Math.random() < 0.3;
      q.spot = oop ? 'riverOop' : 'river'; q.board = R.b;
      var cats = oop ? ['forte', 'catcher', 'rien'] : Object.keys(R.h);
      q.cat = pick(cats); var h2 = pick(R.h[q.cat]); q.hand = h2[0]; q.what = h2[1];
      q.pot = oop ? 10 : 20;
      q.story = oop ? 'Le bouton ouvre à 2 BB, tu paies en grosse blinde. Tu as payé sa mise au flop, la turn a été checkée des deux côtés. River : tu parles en premier.' : 'Tu as ouvert à 2 BB au bouton, la grosse blinde a payé. Tu as misé au flop et à la turn, elle a payé deux fois. River : elle checke.';
      q.opts = [['check', 'Check'], ['petit', 'Petit : 20 à 40 % (' + f1(q.pot * 0.2) + ' à ' + f1(q.pot * 0.4) + ' BB)'], ['gros', 'Gros : 66 à 75 % (' + f1(q.pot * 0.66) + ' à ' + f1(q.pot * 0.75) + ' BB)'], ['surmise', 'Surmise : le pot ou plus (' + f1(q.pot) + ' BB et plus)']];
      q.tex = null; q.tg = oop ? 'River hors de position' : 'River en position';
    }
    q.res = trDecide(q); return q;
  }
  EX.turnriver = { id: 'turnriver', title: 'Turn et river', make: trMake, size: { check: 0, petit: 1, moyen: 1, gros: 2, surmise: 3 },
    spots: { turn: 'Deuxième mise à la turn', delayed: 'Mise retardée à la turn', river: 'River en position', riverOop: 'River hors de position' },
    group: function (x) { return (x.t || EX.turnriver.spots[x.s]) + ' · ' + RCAT[x.c]; },
    tipUp: 'trop agressif : tu mises trop gros ou tu bluffes trop', tipDown: 'trop passif : tu checkes trop ou tu mises trop petit',
    intro: 'La suite du coup : à la turn, tu continues ou tu ralentis selon la carte ; à la river, valeur forte, valeur fine, mise de blocage ou bluff. Les réponses suivent les repères du club des chapitres 25 et 28.',
    good: 'Tu lis bien la turn et la river.', bad: 'Relis « Les tailles du club à la turn » (chapitre 25) et « Les tailles du club à la river » (chapitre 28).',
    links: '<a class="btn block" href="#lecon-25">Relire le chapitre 25</a><a class="btn block" href="#lecon-28">Relire le chapitre 28</a>' };

  window.PA_TAILLE = { view: function () { return exView('taille'); }, faceView: function () { return exView('facemise'); }, trView: function () { return exView('turnriver'); },
    decide: decide, makeQ: makeQ, faceMake: faceMake, trMake: trMake, BOARDS: BOARDS, TURNS: TURNS, RIVERS: RIVERS, EX: EX, reset: function () { Object.keys(EX).forEach(function (k) { EX[k].Q = null; }); } };
})();
