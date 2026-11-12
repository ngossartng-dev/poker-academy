/* Poker Academy — exercice « Quelle taille au flop ? » : une position, un flop, une main de ta range → check ou quelle taille.
   Les réponses suivent les tailles du club du chapitre 13. À la fin, un bilan par type de flop et par type de main
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

  // ---- la réponse du club (chapitre 13) ----
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

  // ---- la mémoire des réponses, pour le bilan ----
  function store() { var p = window.PA.player(); if (!p) return null; p.taille = p.taille || { hist: [] }; return p; }
  function record(q, given) {
    var p = store(), ok = given === q.res.a; if (!p) return ok;
    var dir = ok ? 0 : (SIZE[given] > SIZE[q.res.a] ? 1 : -1);
    p.taille.hist.push({ at: Date.now(), s: q.spot, t: q.tex, c: q.cat, ok: ok ? 1 : 0, d: dir });
    if (p.taille.hist.length > 300) p.taille.hist = p.taille.hist.slice(-300);
    if (window.PA.updateNotion) window.PA.updateNotion(p, 'taille', 1350, ok ? 1 : 0);
    window.PA.save();
    return ok;
  }
  function bilan(list) {
    // regroupe par (type de flop, type de main) et par situation
    var g = {}, sp = {};
    list.forEach(function (x) {
      var k = (x.s === 'cr' ? 'Check-raise' : x.s === 'donk' ? 'Donk bet' : x.s === 'multi' ? 'À trois joueurs' : TGROUP[x.t]) + ' · ' + CAT[x.c];
      var o = g[k] = g[k] || { n: 0, ok: 0, up: 0, down: 0 }; o.n++; o.ok += x.ok; if (x.d > 0) o.up++; if (x.d < 0) o.down++;
      var sk = { cbet: 'Continuation bet', multi: 'À trois joueurs', donk: 'Donk bet', cr: 'Check-raise' }[x.s], s2 = sp[sk] = sp[sk] || { n: 0, ok: 0 }; s2.n++; s2.ok += x.ok;
    });
    return { g: g, sp: sp };
  }
  function bilanHtml(list, title) {
    if (!list.length) return '';
    var B = bilan(list), rows = Object.keys(B.g).map(function (k) { var o = B.g[k]; return { k: k, o: o, r: o.ok / o.n }; }).sort(function (a, b) { return a.r - b.r || b.o.n - a.o.n; });
    var weak = rows.filter(function (x) { return x.r < 0.75; });
    var out = '<div class="card stack"><b>' + title + '</b>';
    out += '<div class="tl-sp">' + Object.keys(B.sp).map(function (k) { var o = B.sp[k]; return '<span><b>' + Math.round(100 * o.ok / o.n) + ' %</b> ' + k + ' (' + o.ok + '/' + o.n + ')</span>'; }).join('') + '</div>';
    if (!weak.length) out += '<div>Tu es cohérent : aucune famille de situations sous 75 % de bonnes réponses.</div>';
    else out += '<div class="small muted">À travailler en premier :</div>' + weak.slice(0, 4).map(function (x) {
      var tip = x.o.up > x.o.down ? 'trop agressif : tu mises trop gros ou tu relances trop' : x.o.down > x.o.up ? 'trop passif : tu mises trop petit, tu checkes ou tu te couches trop' : 'tes erreurs vont dans les deux sens';
      return '<div class="tl-row"><b>' + x.k + '</b> : ' + x.o.ok + '/' + x.o.n + ' — ' + tip + '.</div>';
    }).join('');
    return out + '</div>';
  }

  var Q = null, N = 12;
  function newSeries() { var l = []; for (var i = 0; i < N; i++) { var q = makeQ(); q.cards = realHand(q.hand, q.board); l.push(q); } return { list: l, i: 0, ok: 0, ans: null, done: [] }; }
  function view() {
    var ui = U();
    if (!Q) Q = newSeries();
    var head = '<div class="stack"><button class="back" data-act="nav" data-v="apresflophub">‹ Après le flop</button><h1>Quelle taille au flop ?</h1>';
    if (Q.i >= Q.list.length) {
      var p = store(), all = p ? p.taille.hist : [];
      return ui.shell('entrainer', head + ui.yo(Q.ok + (Q.ok > 1 ? ' bonnes réponses' : ' bonne réponse') + ' sur ' + Q.list.length + '. ' + (Q.ok >= 10 ? 'Tes tailles suivent bien le board et ta main.' : 'Relis « Les tailles du club au flop » au chapitre 13 : la taille dépend du board, de ta main et du nombre d’adversaires.')) +
        bilanHtml(Q.done, 'Cette série') + (all.length > Q.done.length ? bilanHtml(all.slice(-100), 'Tes 100 dernières réponses') : '') +
        '<button class="btn gold block" data-tl="again">Nouvelle série</button><a class="btn block" href="#lecon-13">Relire le chapitre 13</a></div>');
    }
    var q = Q.list[Q.i], out = head + (Q.i === 0 && Q.ans === null ? '<div class="small muted">Une position, un flop, ta main : check ou quelle taille ? Les réponses suivent les tailles du club (chapitre 13). Tapis de 40 BB et plus. À la fin, un bilan te montre où tu n’es pas cohérent.</div>' : '') +
      '<div class="small muted">Question ' + (Q.i + 1) + ' sur ' + Q.list.length + ' · ' + Q.ok + ' bonne' + (Q.ok > 1 ? 's' : '') + ' réponse' + (Q.ok > 1 ? 's' : '') + '</div>' +
      '<div class="card stack"><div>' + q.story + ' Pot de ' + q.pot + ' BB.</div><div class="small muted">Le flop</div><div class="pq-hand">' + cards(q.board) + '</div><div class="small muted">Ta main</div><div class="pq-hand">' + cards(q.cards) + '</div></div>';
    if (Q.ans === null) out += '<div class="stack">' + q.opts.map(function (o) { return '<button class="btn block" data-tl="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
    else {
      var good = Q.ans === q.res.a, lab = q.opts.filter(function (o) { return o[0] === q.res.a; })[0][1];
      out += '<div class="pq-res ' + (good ? 'ok' : 'ko') + '">' + (good ? 'Oui : ' : 'Non : ') + lab.charAt(0).toLowerCase() + lab.slice(1) + '.</div>' +
        ui.yo('Ta main : ' + q.what + ', sur un ' + TEX[q.tex] + '. ' + q.res.why) + '<button class="btn gold block" data-tl="next">' + (Q.i + 1 >= Q.list.length ? 'Voir mon bilan' : 'Question suivante') + '</button>';
    }
    return ui.shell('entrainer', out + '</div>');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tl]') : null; if (!t) return;
    var a = t.getAttribute('data-tl');
    if (a === 'again') Q = null;
    else if (!Q) return;
    else if (a === 'next') { Q.i++; Q.ans = null; }
    else if (Q.ans === null) { var q = Q.list[Q.i]; Q.ans = a; var ok = record(q, a); if (ok) Q.ok++; Q.done.push({ s: q.spot, t: q.tex, c: q.cat, ok: ok ? 1 : 0, d: ok ? 0 : (SIZE[a] > SIZE[q.res.a] ? 1 : -1) }); }
    U().render(); window.scrollTo(0, 0);
  });
  window.PA_TAILLE = { view: view, decide: decide, makeQ: makeQ, BOARDS: BOARDS, reset: function () { Q = null; } };
})();
