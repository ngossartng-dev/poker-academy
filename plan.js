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
          var e = eqVs(h, r4), cat = e >= nJ ? 'v4' : (!jam4 && e >= nC && (h.length === 2 || /s$/.test(h)) ? 'c4' : 'b4');
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
  function body(hero) {
    var out = '<p class="muted small">D’un coup d’œil : quoi faire maintenant, et quoi faire si on te sur-relance. Touche une main pour le détail.</p>';
    out += seg('mode', [['first', 'Personne n’a ouvert'], ['vs', 'Quelqu’un a ouvert']], ST.mode);
    out += '<div class="small muted">Ton tapis</div>' + seg('stack', [[25, '20-40 BB'], [40, '40 BB'], [60, '60 BB'], [100, '100 BB']], ST.stack);
    var heroes = ST.mode === 'first' ? POS.slice(0, 8) : POS.slice(1);
    if (heroes.indexOf(ST.pos) < 0) ST.pos = ST.mode === 'first' ? 'BTN' : 'BB';
    out += '<div class="small muted">Je suis en :</div>' + seg('pos', heroes.map(function (p) { return [p, p]; }), ST.pos);
    if (ST.mode === 'vs') {
      var ops = POS.slice(0, POS.indexOf(ST.pos)); if (ST.pos !== 'BB') ops = ops.filter(function (x) { return x !== 'SB'; });
      if (ops.indexOf(ST.opener) < 0) ST.opener = ops[ops.length - 1];
      out += '<div class="small muted">Celui qui a ouvert :</div>' + seg('opener', ops.map(function (p) { return [p, p]; }), ST.opener);
    }
    var R = compute(), cnt = {};
    H.forEach(function (h) { cnt[R.map[h]] = (cnt[R.map[h]] || 0) + PA.combos(h); });
    var order = ST.mode === 'first' ? ['v4', 'b4', 'call', 'open', 'fold'] : ['v4', 'c4', 'b4', 'call', 'fold'];
    out += '<div class="plan-leg">' + order.filter(function (k) { return cnt[k]; }).map(function (k) { return '<span><i style="background:' + C[k][0] + '"></i>' + label(k) + ' <b>' + String(Math.round(cnt[k] / 13.26 * 10) / 10).replace('.', ',') + ' %</b></span>'; }).join('') + '</div>';
    if (hero && R.map[hero]) out += '<div class="banner">Ta main <b>' + hand(hero) + '</b> : ' + detail(hero) + '</div>';
    out += '<div class="rg" role="grid" aria-label="Plan de jeu, 169 mains">' + H.map(function (h) { var c = C[R.map[h]]; return '<button data-act="planCell" data-v="' + h + '" style="background:' + c[0] + ';color:' + c[1] + '"' + (h === hero ? ' class="hero"' : '') + '>' + h + '</button>'; }).join('') + '</div>';
    out += '<p class="muted small">' + (deep() ? 'Valeur ou bluff : calculé avec l’équité de chaque main contre la range adverse de sur-relance et la cote à payer (ouverture à ' + bb(openSize()) + ', 3-bet 3 fois en position, 4 fois depuis les blindes, ante de grosse blinde).' : 'Entre 20 et 40 BB, un 3-bet est un tapis : la seule question est de payer ou non le tapis adverse.') + '</p>';
    return out;
  }
  function set(k, v) { if (k === 'stack') v = +v; ST[k] = v; }
  function fromSit(s) {
    if (!s) return;
    if (s.type === 'open') { ST.mode = 'first'; ST.pos = s.pos; }
    else if (s.type === 'def') { ST.mode = 'vs'; ST.pos = s.pos; ST.opener = s.opener; }
    if (s.bb) ST.stack = s.bb >= 40 ? (ST.stack >= 40 ? ST.stack : 40) : 25;
  }
  window.PA_PLAN = { body: body, set: set, detail: detail, label: function (h) { var R = compute(); return { cat: R.map[h], text: label(R.map[h]), color: C[R.map[h]] }; }, fromSit: fromSit, state: ST };
})();
