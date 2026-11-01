/* Poker Academy — Plan de jeu : la grille dit quoi faire maintenant ET quoi faire si on te sur-relance.
   Les suites (4-bet de valeur ou bluff, payer ou coucher face au tapis) sont calculées avec l'équité
   de chaque main contre la range adverse et la cote du moment. */
(function () {
  'use strict';
  var PA = window.PA, D = PA.D, H = PA.HANDS, IDX = {};
  H.forEach(function (h, i) { IDX[h] = i; });
  var POS = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  var EARLY = { 'UTG': 1, 'UTG+1': 1, 'MP': 1 };
  var ST = { mode: 'first', pos: 'BTN', opener: 'CO', stack: 40 };
  var DEAD = 2.5; // petite blinde + grosse blinde + ante de grosse blinde

  var C = {
    v4: ['#b3122e', '#fff'],
    b4: ['#f08a24', '#1a1000'],
    c4: ['#7c3aed', '#fff'],
    call: ['#1f9d55', '#fff'],
    open: ['#e8c547', '#1a1400'],
    fold: ['#2a2a30', '#77777f']
  };

  function eqHH(a, b) { return D.eqm[IDX[a] * 169 + IDX[b]] / 1000; }
  function eqVs(hand, range) {
    var num = 0, den = 0;
    range.forEach(function (h) { var w = PA.combos(h); if (h === hand) w = Math.max(1, w / 3); num += w * eqHH(hand, h); den += w; });
    return den ? num / den : 0.5;
  }
  function list(map, act) { return H.filter(function (h) { return map[h] === act; }); }
  function pct(x) { return Math.round(x * 100) + ' %'; }
  function bb(x) { return (Math.round(x * 10) / 10).toString().replace('.', ',') + ' BB'; }
  function prof() { return (PA.player() && PA.player().profile) || 'tag'; }
  function depthBB() { return ST.stack >= 40 ? 100 : 30; } // ranges « 40 BB et + » ou « 20-40 BB »
  function deep() { return ST.stack >= 40; }

  // tailles (ouverture du club à 2 BB)
  function openSize() { return ST.stack <= 60 ? 2 : 2.3; }
  function threeSize(oop) { return openSize() * (oop ? 4 : 3); }
  function fourSize(b3) { var b4 = b3 * 2.2; return b4 > ST.stack * 0.3 ? ST.stack : b4; }
  // équité qu'il faut pour payer un tapis quand on a déjà mis « mine » dans le pot
  function needJam(mine) { return (ST.stack - mine) / (2 * ST.stack + DEAD); }

  // scénario de la range « face à un 3-bet » du joueur qui a ouvert
  function scenOf(opener, threeBettor) {
    if (EARLY[opener]) return 'early';
    if ((threeBettor === 'SB' || threeBettor === 'BB') && opener !== 'SB') return 'ip';
    return 'oop';
  }
  // mains avec lesquelles celui qui a 3-bet va au tapis face à ton 4-bet
  function fiveRange(scen) { return ['AA', 'KK', 'QQ', 'AKs', 'AKo', 'A5s'].concat(scen === 'ip' ? ['JJ', 'TT', 'AQs', 'A4s'] : []); }
  // tapis direct (20-40 BB) : range de 3-bet tapis d'un joueur placé en « pos »
  function shoveRange(pos) { var m = D.profiles.tag.mid3b[pos === 'BB' ? 'SB' : pos]; return m && m.length ? m : ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo']; }

  /* ----- calcul de la grille ----- */
  function compute() {
    var out = {}, info = {}, p = prof();
    H.forEach(function (h) { out[h] = 'fold'; });
    if (ST.mode === 'first') {
      if (ST.pos === 'BB') ST.pos = 'BTN';
      var open = PA.chart(p, { type: 'open', pos: ST.pos, bb: depthBB() });
      // qui te 3-bet le plus souvent : les blindes si tu es au bouton, sinon un joueur derrière toi en position
      var tb = ST.pos === 'BTN' ? 'BB' : (ST.pos === 'SB' ? 'BB' : 'BTN');
      var scen = EARLY[ST.pos] ? 'early' : (ST.pos === 'BTN' ? 'ip' : 'oop');
      var o = openSize();
      if (deep()) {
        var v3 = PA.chart(p, { type: 'vs3bet', scen: scen, bb: 100 });
        var b3 = threeSize(tb === 'SB' || tb === 'BB'), b4 = fourSize(b3), jam = b4 >= ST.stack;
        var five = fiveRange(scen).concat(b4 >= ST.stack ? ['JJ', 'TT', 'AQs', 'AQo'] : []), need = needJam(b4);
        H.forEach(function (h) {
          if (open[h] !== 'raise') return;
          if (v3[h] === 'fourbet') {
            var e = eqVs(h, five);
            out[h] = jam ? (e >= 0.5 ? 'v4' : 'b4') : (e >= need ? 'v4' : 'b4');
            info[h] = { eq: e, need: jam ? 0.5 : need, b4: b4, jam: jam, b3: b3, tb: tb };
          } else if (v3[h] === 'call') { out[h] = 'call'; info[h] = { b3: b3, tb: tb }; }
          else { out[h] = 'open'; info[h] = { b3: b3, tb: tb }; }
        });
      } else {
        // 20-40 BB : la sur-relance adverse est un tapis
        var sr = shoveRange(tb), nd = needJam(o);
        H.forEach(function (h) {
          if (open[h] !== 'raise') return;
          var e = eqVs(h, sr);
          out[h] = e >= nd ? 'v4' : 'open'; info[h] = { eq: e, need: nd, tb: tb, shove: true };
        });
      }
    } else {
      var ops = POS.slice(0, POS.indexOf(ST.pos));
      if (ST.pos !== 'BB') ops = ops.filter(function (x) { return x !== 'SB'; });
      if (ops.indexOf(ST.opener) < 0) ST.opener = ops[ops.length - 1];
      var def = PA.chart(p, { type: 'def', pos: ST.pos, opener: ST.opener, bb: depthBB() });
      var oop = ST.pos === 'SB' || ST.pos === 'BB';
      if (deep()) {
        var sc = scenOf(ST.opener, ST.pos), four = PA.chart('tag', { type: 'vs3bet', scen: sc, bb: 100 });
        var b3b = threeSize(oop), b4b = fourSize(b3b), jam4 = b4b >= ST.stack;
        // tapis moins profonds : le 4-bet devient un tapis, avec une range plus large
        var r4 = list(four, 'fourbet').concat(jam4 ? (sc === 'early' ? ['JJ'] : ['JJ', 'TT', 'AQs', 'AQo']) : []);
        var nJ = needJam(b3b), nC = (b4b - b3b) / (2 * b4b + DEAD) + (oop ? 0.1 : 0.06);
        H.forEach(function (h) {
          if (def[h] === 'call') { out[h] = 'call'; return; }
          if (def[h] !== 'raise' && def[h] !== 'allin') return;
          var e = eqVs(h, r4), cat = e >= nJ ? 'v4' : (!jam4 && e >= nC ? 'c4' : 'b4');
          out[h] = cat; info[h] = { eq: e, need: nJ, needC: nC, b3: b3b, b4: b4b, jam: jam4, r4: r4 };
        });
      } else {
        var r = shoveRange(ST.opener);
        H.forEach(function (h) {
          if (def[h] === 'call') out[h] = 'call';
          else if (def[h] === 'raise' || def[h] === 'allin') { out[h] = 'v4'; info[h] = { shove: true }; }
        });
      }
    }
    return { map: out, info: info };
  }

  /* ----- textes ----- */
  function label(cat) {
    var first = ST.mode === 'first';
    if (!deep()) {
      if (first) return { v4: 'Ouvrir · tapis adverse : payer', open: 'Ouvrir · tapis adverse : se coucher', fold: 'Se coucher' }[cat];
      return { v4: '3-bet tapis', call: 'Payer', fold: 'Se coucher' }[cat];
    }
    if (first) return { v4: 'Ouvrir · 3-bet adverse : 4-bet, jusqu’au tapis', b4: 'Ouvrir · 3-bet adverse : 4-bet, couche face au tapis', call: 'Ouvrir · 3-bet adverse : payer', open: 'Ouvrir · 3-bet adverse : se coucher', fold: 'Se coucher' }[cat];
    return { v4: '3-bet · 4-bet adverse : tapis', c4: '3-bet · 4-bet adverse : payer (pas le tapis)', b4: '3-bet · 4-bet adverse : se coucher (3-bet fold)', call: 'Payer l’ouverture', fold: 'Se coucher' }[cat];
  }
  function posFr(p) { return { UTG: 'UTG', 'UTG+1': 'UTG+1', MP: 'MP', LJ: 'lojack', HJ: 'hijack', CO: 'cut-off', BTN: 'bouton', SB: 'petite blinde', BB: 'grosse blinde' }[p]; }
  function hand(h) { return h === 'TT' ? '10-10' : h.replace(/T/g, '10'); }
  function detail(h) {
    var R = compute(), cat = R.map[h], I = R.info[h] || {}, o = openSize(), s = '';
    var first = ST.mode === 'first';
    if (cat === 'fold') return first ? 'Tu ne l’ouvres pas depuis le ' + posFr(ST.pos) + '. Couche-la.' : 'Face à l’ouverture du ' + posFr(ST.opener) + ', couche-la.';
    if (cat === 'call') return first ? 'Ouvre à ' + bb(o) + '. Si on te 3-bet (environ ' + bb(I.b3) + '), paye : la main joue bien après le flop.' : 'Paye l’ouverture du ' + posFr(ST.opener) + '. Pas de 3-bet avec cette main.';
    if (first) {
      if (I.shove) return 'Ouvre à ' + bb(o) + '. Si un joueur te relance à tapis : ' + (cat === 'v4' ? 'paye' : 'couche-toi') + '. Ton équité contre sa range : ' + pct(I.eq) + ', il te faut ' + pct(I.need) + '.';
      if (cat === 'open') return 'Ouvre à ' + bb(o) + '. Si on te 3-bet, couche-toi : la main est trop faible pour continuer.';
      if (I.jam) return 'Ouvre à ' + bb(o) + '. Si on te 3-bet, fais tapis. ' + (cat === 'v4' ? 'C’est pour la valeur : contre les mains qui paient, tu as ' + pct(I.eq) + '.' : 'C’est un bluff : il compte surtout sur ses abandons (contre les mains qui paient, tu n’as que ' + pct(I.eq) + ').');
      return 'Ouvre à ' + bb(o) + '. Si on te 3-bet, 4-bet à environ ' + bb(I.b4) + '. ' + (cat === 'v4' ? 'S’il fait tapis, paye : tu as ' + pct(I.eq) + ' contre ses mains de tapis, il te faut ' + pct(I.need) + '.' : 'S’il fait tapis, couche-toi : tu n’as que ' + pct(I.eq) + ' contre ses mains de tapis, il te faut ' + pct(I.need) + '.' + (I.eq < 0.36 ? ' Ton 4-bet sert surtout à le faire coucher.' : ''));
    }
    if (I.shove) return 'Face à l’ouverture du ' + posFr(ST.opener) + ', fais tapis directement : à ce tapis, un 3-bet engage tout.';
    var b3 = '3-bet à environ ' + bb(I.b3) + '. ';
    if (cat === 'v4') return b3 + (I.jam ? 'S’il fait tapis, paye' : 'S’il 4-bet, va au tapis') + ' : contre sa range de 4-bet tu as ' + pct(I.eq) + ', il te faut ' + pct(I.need) + '.';
    if (cat === 'c4') return b3 + 'S’il 4-bet à environ ' + bb(I.b4) + ', paye et joue le flop : ' + pct(I.eq) + ' contre sa range de 4-bet. Mais couche-toi s’il fait tapis.';
    return b3 + (I.jam ? 'S’il fait tapis' : 'S’il 4-bet') + ', couche-toi (3-bet fold) : contre sa range de 4-bet tu n’as que ' + pct(I.eq) + ', il te faut ' + pct(I.need) + '. Ton 3-bet gagne souvent tout de suite quand il se couche, ou après le flop.';
  }

  /* ----- affichage ----- */
  function seg(k, opts, cur) { return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (String(cur) === String(o[0]) ? 'on' : '') + '" data-act="plan" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  // couleur = ce que tu fais maintenant (mêmes couleurs que le reste de l'appli) ; symbole = la suite si on te relance
  var NOW = { open: ['#2f9e44', 'Ouvrir'], three: ['#e03131', '3-bet'], call: ['#1c7ed6', 'Payer'], fold: ['#2a2a30', 'Se coucher'] };
  var BAR = { '▲': '#ffd23f', '=': '#ffffff', '4✕': '#ff8a1f' };
  function look(cat) {
    var first = ST.mode === 'first';
    if (cat === 'fold') return { now: 'fold', sym: '' };
    if (cat === 'call') return { now: first ? 'open' : 'call', sym: first ? '=' : '' };
    if (cat === 'open') return { now: 'open', sym: '✕' };
    if (!deep() && !first) return { now: 'three', sym: '▲' };
    return { now: first ? 'open' : 'three', sym: { v4: '▲', c4: '=', b4: first ? '4✕' : '✕' }[cat] };
  }
  // écriture compacte d'une liste de mains : QQ+, 99-77, ATs+, A5s-A2s, KQo
  var RK = 'AKQJT98765432';
  function compact(list) {
    var set = {}; list.forEach(function (h) { set[h] = 1; });
    var out = [], pairs = RK.split('').filter(function (r) { return set[r + r]; });
    runs(pairs.map(function (r) { return RK.indexOf(r); })).forEach(function (g) {
      var a = RK[g[0]], b = RK[g[g.length - 1]];
      out.push(g.length === 1 ? a + a : (g[0] === 0 ? b + b + '+' : a + a + '-' + b + b));
    });
    ['s', 'o'].forEach(function (t) {
      for (var i = 0; i < 13; i++) {
        var hi = RK[i], ks = [];
        for (var j = i + 1; j < 13; j++) if (set[hi + RK[j] + t]) ks.push(j);
        runs(ks).forEach(function (g) {
          var a = hi + RK[g[0]] + t, b = hi + RK[g[g.length - 1]] + t;
          out.push(g.length === 1 ? a : (g[0] === i + 1 ? b + '+' : a + '-' + b));
        });
      }
    });
    return out.join(', ');
  }
  function runs(idx) { var out = [], cur = []; idx.forEach(function (x) { if (cur.length && x !== cur[cur.length - 1] + 1) { out.push(cur); cur = []; } cur.push(x); }); if (cur.length) out.push(cur); return out; }
  function body(hero) {
    var out = '';
    var heroes = POS.slice(0);
    if (heroes.indexOf(ST.pos) < 0) ST.pos = 'BTN';
    out += '<div class="small muted">Je suis en</div>' + seg('pos', heroes.map(function (p) { return [p, p]; }), ST.pos);
    var ops = POS.slice(0, POS.indexOf(ST.pos)); if (ST.pos !== 'BB') ops = ops.filter(function (x) { return x !== 'SB'; });
    var who = ST.mode === 'first' ? 'none' : ST.opener;
    if (ST.pos === 'BB' && who === 'none') { ST.mode = 'vs'; who = ST.opener; }
    if (ST.pos === 'UTG') { ST.mode = 'first'; who = 'none'; }
    if (who !== 'none' && ops.indexOf(who) < 0) { ST.opener = who = ops[ops.length - 1]; }
    var wopts = (ST.pos === 'BB' ? [] : [['none', 'Personne']]).concat(ops.map(function (p) { return [p, p]; }));
    out += '<div class="small muted">Qui a ouvert avant toi ?</div>' + seg('who', wopts, who);
    out += '<div class="row plan-stack"><span class="small muted">Tapis</span>' + seg('stack', [[25, '20-40'], [40, '40'], [60, '60'], [100, '100 BB']], ST.stack) + '</div>';
    var R = compute(), first = ST.mode === 'first', used = {}, syms = {};
    H.forEach(function (h) { var L = look(R.map[h]); used[L.now] = 1; if (L.sym) syms[L.sym] = 1; });
    var then = first ? (deep() ? 'si on te 3-bet' : 'si on te relance à tapis') : 'si on te 4-bet';
    var SYM = { '▲': 'tapis', '=': 'payer', '✕': 'se coucher (pas de barre)', '4✕': '4-bet, puis couche-toi s’il fait tapis' };
    out += '<div class="plan-leg2"><div>' + ['open', 'three', 'call', 'fold'].filter(function (k) { return used[k]; }).map(function (k) { return '<span><i style="background:' + NOW[k][0] + '"></i>' + (k === 'three' && !deep() ? '3-bet tapis' : NOW[k][1]) + '</span>'; }).join('') + '</div>' +
      (Object.keys(syms).length && (deep() || first) ? '<div><span class="muted">Puis, ' + then + ' :</span>' + ['▲', '=', '✕', '4✕'].filter(function (k) { return syms[k]; }).map(function (k) { return '<span><i class="bar" style="' + (BAR[k] ? 'background:' + BAR[k] : 'border:1px dashed #888') + '"></i>' + SYM[k] + '</span>'; }).join('') + '</div>' : '') + '</div>';
    if (hero && R.map[hero]) out += '<div class="banner">Ta main <b>' + hand(hero) + '</b> : ' + detail(hero) + '</div>';
    out += '<div class="rg plan-rg" role="grid" aria-label="Plan de jeu, 169 mains">' + H.map(function (h) { var L = look(R.map[h]), c = NOW[L.now]; var bar = (deep() || first) && BAR[L.sym] ? ';box-shadow:inset 0 -6px 0 ' + BAR[L.sym] : ''; return '<button data-act="planCell" data-v="' + h + '" style="background:' + c[0] + bar + (L.now === 'fold' ? ';color:#77777f' : '') + '"' + (h === hero ? ' class="hero"' : '') + '>' + h + '' + '</button>'; }).join('') + '</div>';
    // résumé écrit
    var groups = first ? (deep() ? [['v4', 'Ouvrir, et tapis si on te 3-bet', '▲'], ['b4', 'Ouvrir, 4-bet, puis couche-toi s’il fait tapis', '4✕'], ['call', 'Ouvrir, et payer un 3-bet', '='], ['open', 'Ouvrir, et te coucher face à un 3-bet', '✕']] : [['v4', 'Ouvrir, et payer un tapis', '▲'], ['open', 'Ouvrir, et te coucher face à un tapis', '✕']])
      : (deep() ? [['v4', '3-bet, et tapis s’il 4-bet', '▲'], ['c4', '3-bet, et payer son 4-bet', '='], ['b4', '3-bet, et te coucher s’il 4-bet (3-bet fold)', '✕'], ['call', 'Payer l’ouverture', '']] : [['v4', '3-bet tapis', ''], ['call', 'Payer l’ouverture', '']]);
    out += '<div class="plan-sum">' + groups.map(function (g) {
      var l = H.filter(function (h) { return R.map[h] === g[0]; }); if (!l.length) return '';
      var c = NOW[look(g[0]).now][0];
      return '<div><b style="border-color:' + c + '">' + (g[2] && BAR[g[2]] ? '<i class="bar" style="background:' + BAR[g[2]] + '"></i> ' : '') + g[1] + '</b><span>' + compact(l) + '</span></div>';
    }).join('') + '<div><b style="border-color:#3a3a42">Tout le reste</b><span>Se coucher.</span></div></div>';
    out += '<a class="btn block" href="#planquiz" data-act="closeSheet">S’entraîner sur le plan de jeu</a>';
    out += '<p class="muted small">Touche une main pour le détail chiffré. ' + (deep() ? 'La suite est calculée avec l’équité de chaque main contre la range adverse de sur-relance et la cote à payer.' : 'Entre 20 et 40 BB, un 3-bet est un tapis.') + '</p>';
    return out;
  }

  /* ----- entraînement : la décision, puis la suite ----- */
  var Q = null, NQ = 10;
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function newQ() {
    var first = Math.random() < 0.45, tries = 0, R, h, cat;
    ST.stack = Math.random() < 0.7 ? 40 : rnd([25, 100]);
    do {
      if (first) { ST.mode = 'first'; ST.pos = rnd(['UTG', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB']); }
      else {
        ST.mode = 'vs'; ST.pos = rnd(['HJ', 'CO', 'BTN', 'SB', 'BB', 'BB']);
        var ops = POS.slice(0, POS.indexOf(ST.pos)); if (ST.pos !== 'BB') ops = ops.filter(function (x) { return x !== 'SB'; });
        ST.opener = rnd(ops);
      }
      R = compute();
      var play = H.filter(function (x) { return R.map[x] !== 'fold'; });
      // surtout des mains jouées, parfois une main limite qui se couche
      if (Math.random() < 0.8) h = rnd(play);
      else { var near = H.filter(function (x) { return R.map[x] === 'fold' && PA.D.eq[x] > 0.5; }); h = near.length ? rnd(near) : rnd(play); }
      cat = R.map[h]; tries++;
    } while (!h && tries < 20);
    return { mode: ST.mode, pos: ST.pos, opener: ST.opener, stack: ST.stack, hand: h, cat: cat, suits: suitsFor(h), step: 1, a1: null, a2: null };
  }
  function suitsFor(h) {
    var S = ['♠', '♥', '♦', '♣'], a = rnd(S), b;
    if (h.length === 2) { do { b = rnd(S); } while (b === a); } else if (h[2] === 's') b = a; else { do { b = rnd(S); } while (b === a); }
    return [a, b];
  }
  function cardHtml(r, s) { var red = s === '♥' || s === '♦'; return '<span class="pq-card' + (red ? ' red' : '') + '">' + (r === 'T' ? '10' : r) + '<small>' + s + '</small></span>'; }
  function restore(q) { ST.mode = q.mode; ST.pos = q.pos; ST.opener = q.opener; ST.stack = q.stack; }
  function step1Opts(q) {
    if (q.mode === 'first') return [['now:open', 'Ouvrir à ' + bb(openSize())], ['now:fold', 'Se coucher']];
    return [['now:three', deep() ? '3-bet' : '3-bet tapis'], ['now:call', 'Payer'], ['now:fold', 'Se coucher']];
  }
  function hasStep2(q) { return q.cat !== 'fold' && (q.mode === 'first' || (deep() && q.cat !== 'call')); }
  function step2Q(q) {
    if (q.mode === 'first') {
      if (!deep()) return { t: 'Un joueur derrière toi fait tapis. Que fais-tu ?', o: [['v4', 'Payer le tapis'], ['open', 'Se coucher']] };
      if (firstJam(q)) return { t: 'Un joueur derrière toi te 3-bet. Que fais-tu ?', o: [['v4', 'Tapis'], ['call', 'Payer le 3-bet'], ['open', 'Se coucher']] };
      return { t: 'Un joueur derrière toi te 3-bet. Que fais-tu ?', o: [['v4', '4-bet, et payer s’il fait tapis'], ['b4', '4-bet, puis coucher s’il fait tapis'], ['call', 'Payer le 3-bet'], ['open', 'Se coucher']] };
    }
    return { t: 'Le ' + posFr(q.opener) + ' te 4-bet. Que fais-tu ?', o: fourSize(threeSize(q.pos === 'SB' || q.pos === 'BB')) >= ST.stack ? [['v4', 'Payer son tapis'], ['b4', 'Se coucher']] : [['v4', 'Tapis'], ['c4', 'Payer le 4-bet'], ['b4', 'Se coucher']] };
  }
  // à ce tapis, ton 4-bet est déjà un tapis : valeur et bluff se jouent pareil
  function firstJam(q) { var tb = (q.pos === 'BTN' || q.pos === 'SB') ? 'BB' : 'BTN'; return fourSize(threeSize(tb === 'BB')) >= ST.stack; }
  function good2(q) { return q.a2 === q.cat || (q.mode === 'first' && deep() && firstJam(q) && q.cat === 'b4' && q.a2 === 'v4'); }
  function quizView() {
    var ui = window.PA_UI;
    if (!Q || Q.i >= NQ && !Q.fin) Q = { i: 0, ok: 0, q: newQ(), fin: false };
    var q = Q.q; restore(q);
    var head = '<div class="stack"><button class="back" data-act="nav" data-v="situations">‹ Situations</button><h1>Plan de jeu</h1>';
    if (Q.fin) {
      return ui.shell('entrainer', head + ui.yo(Q.ok + (Q.ok > 1 ? ' bonnes réponses' : ' bonne réponse') + ' sur ' + NQ + '. ' + (Q.ok >= 8 ? 'Ton plan de jeu est solide.' : Q.ok >= 5 ? 'C’est en bonne voie : revois les mains où tu as hésité dans Ma range › Plan de jeu.' : 'Ouvre Ma range › Plan de jeu et regarde le résumé écrit de chaque situation, puis recommence.')) +
        '<button class="btn gold block" data-pq="again">Recommencer</button><button class="btn block" data-act="range">Ouvrir Ma range</button></div>');
    }
    var sit = q.mode === 'first' ? 'Tu es en <b>' + posFr(q.pos) + '</b>, tout le monde s’est couché jusqu’à toi.' : 'Tu es en <b>' + posFr(q.pos) + '</b>. Le <b>' + posFr(q.opener) + '</b> ouvre à ' + bb(openSize()) + ', les autres se couchent.';
    var out = head + '<div class="small muted">Question ' + (Q.i + 1) + ' sur ' + NQ + ' · ' + Q.ok + ' bonne' + (Q.ok > 1 ? 's' : '') + ' réponse' + (Q.ok > 1 ? 's' : '') + '</div>' +
      '<div class="card stack"><div>' + sit + ' Tapis de ' + (q.stack === 25 ? '30' : q.stack) + ' BB.</div><div class="pq-hand">' + cardHtml(q.hand[0], q.suits[0]) + cardHtml(q.hand[1], q.suits[1]) + '</div></div>';
    var want1 = look(q.cat).now;
    if (q.step === 1) {
      out += '<div class="stack">' + step1Opts(q).map(function (o) { return '<button class="btn block" data-pq="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
    } else {
      var ok1 = q.a1 === want1;
      out += '<div class="pq-res ' + (ok1 ? 'ok' : 'ko') + '">' + (ok1 ? 'Oui : ' : 'Non : ') + (want1 === 'open' ? 'on ouvre' : want1 === 'three' ? (deep() ? 'on 3-bet' : 'on fait tapis') : want1 === 'call' ? 'on paye' : 'on se couche') + '.</div>';
      if (ok1 && hasStep2(q) && q.step === 2) {
        var s2 = step2Q(q);
        out += '<div><b>Et ensuite ?</b> ' + s2.t + '</div><div class="stack">' + s2.o.map(function (o) { return '<button class="btn block" data-pq="then:' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
      } else {
        if (q.a2) { var g2 = good2(q); out += '<div class="pq-res ' + (g2 ? 'ok' : 'ko') + '">' + (g2 ? 'Bonne suite.' : 'Pas la bonne suite.') + '</div>'; }
        out += ui.yo(detail(q.hand)) + '<button class="btn gold block" data-pq="next">' + (Q.i + 1 >= NQ ? 'Voir mon score' : 'Main suivante') + '</button>';
      }
    }
    return ui.shell('entrainer', out + '</div>');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-pq]') : null; if (!t || !Q) return;
    var a = t.getAttribute('data-pq'), q = Q.q; restore(q);
    if (a === 'again') { Q = null; }
    else if (a === 'next') { Q.i++; if (Q.i >= NQ) Q.fin = true; else Q.q = newQ(); }
    else if (a.indexOf('now:') === 0) {
      q.a1 = a.slice(4); var ok1 = q.a1 === look(q.cat).now;
      if (ok1 && hasStep2(q)) q.step = 2; else { q.step = 3; if (ok1) Q.ok++; }
    } else if (a.indexOf('then:') === 0) {
      q.a2 = a.slice(5); q.step = 3; if (good2(q)) Q.ok++;
    }
    window.PA_UI.render(); window.scrollTo(0, 0);
  });
  function set(k, v) { if (k === 'stack') v = +v; if (k === 'who') { if (v === 'none') ST.mode = 'first'; else { ST.mode = 'vs'; ST.opener = v; } return; } ST[k] = v; }
  function fromSit(s) {
    if (!s) return;
    if (s.type === 'open') { ST.mode = 'first'; ST.pos = s.pos; }
    else if (s.type === 'def') { ST.mode = 'vs'; ST.pos = s.pos; ST.opener = s.opener; }
    if (s.bb) ST.stack = s.bb >= 40 ? (ST.stack >= 40 ? ST.stack : 40) : 25;
  }
  window.PA_PLAN = { quiz: quizView, body: body, set: set, detail: detail, label: function (h) { var R = compute(), L = look(R.map[h]); return { cat: R.map[h], text: label(R.map[h]), color: [NOW[L.now][0], L.now === 'fold' ? '#ccc' : '#fff'] }; }, fromSit: fromSit, state: ST };
})();
