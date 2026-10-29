/* Poker Academy v2.0 — situations calculées : ICM, PKO, outs et cote */
(function () {
  'use strict';
  var PA = window.PA, D = PA.D, H = PA.HANDS, IDX = {};
  H.forEach(function (h, i) { IDX[h] = i; });
  function eqHH(a, b) { return D.eqm[IDX[a] * 169 + IDX[b]] / 1000; }
  function eqVsRange(hand, range) {
    var num = 0, den = 0;
    range.forEach(function (h) { var w = PA.combos(h); if (h === hand) w = Math.max(1, w / 3); num += w * eqHH(hand, h); den += w; });
    return den ? num / den : 0.5;
  }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pc(x) { return Math.round(x * 100) + ' %'; }
  function f1(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
  function eur(x) { return (Math.round(x * 100) / 100).toFixed(2).replace('.', ',') + ' €'; }

  /* ---------- ICM (Malmuth-Harville) ---------- */
  function icm(stacks, pays) {
    var n = stacks.length, memo = {};
    function rec(mask) {
      if (memo[mask]) return memo[mask];
      var res = new Array(n).fill(0), ids = [], tot = 0, i;
      for (i = 0; i < n; i++) if (mask & (1 << i)) { ids.push(i); tot += stacks[i]; }
      var place = alive - ids.length; if (place >= pays.length || !ids.length || tot <= 0) { memo[mask] = res; return res; }
      ids.forEach(function (w) {
        var p = stacks[w] / tot; res[w] += p * pays[place];
        var sub = rec(mask & ~(1 << w)); ids.forEach(function (j) { if (j !== w) res[j] += p * sub[j]; });
      });
      memo[mask] = res; return res;
    }
    var full = 0, alive = 0; stacks.forEach(function (s, i) { if (s > 0) { full |= 1 << i; alive++; } });
    return rec(full);
  }

  /* ---------- Rendu commun ---------- */
  function stackTable(rows, heroIdx, extra) {
    return '<div class="card" style="padding:10px 12px"><table class="tbl">' + '<tr><th>Joueur</th><th>Tapis</th>' + (extra ? '<th>' + extra.title + '</th>' : '') + '</tr>' +
      rows.map(function (r, i) { return '<tr' + (i === heroIdx ? ' style="color:#ffd23f;font-weight:700"' : '') + '><td>' + r.name + '</td><td>' + r.stack + '</td>' + (extra ? '<td>' + (extra.vals[i] || '') + '</td>' : '') + '</tr>'; }).join('') + '</table></div>';
  }
  function cardsOf(code) {
    var s1 = ri(0, 3), s2; if (code.length === 2 || code[2] === 'o') s2 = (s1 + ri(1, 3)) % 4; else s2 = s1;
    return [[code[0], s1], [code[1], s2]];
  }

  /* ---------- 1. Bulle et table finale (ICM) ---------- */
  function makeICM() {
    var sc = rnd(['bulle', 'bulle', 'ft']);
    var n = sc === 'bulle' ? 4 : 6;
    var pays = sc === 'bulle' ? [50, 30, 20] : [40, 24, 15, 9, 7, 5];
    var prize = sc === 'bulle' ? 'Sit & Go 9 joueurs, 100 € de prix : 50 / 30 / 20 €' : 'Table finale, 6 joueurs : 40 / 24 / 15 / 9 / 7 / 5 % des prix (100 € au total pour le calcul)';
    var bbStacks = [], i;
    for (i = 0; i < n; i++) bbStacks.push(ri(6, 40));
    var hero = n - 1; // le héros est en grosse blinde
    var vPos = rnd(['BTN', 'SB', 'CO']); var villain = { BTN: n - 3, SB: n - 2, CO: n - 4 }[vPos];
    if (sc === 'bulle' && Math.random() < 0.5) { bbStacks[hero] = ri(10, 18); bbStacks[villain] = ri(16, 30); }
    var eff = Math.min(bbStacks[hero], bbStacks[villain]);
    var range = D.pushfold[String(PA.nearestPush(Math.min(15, eff)))].push[vPos] || [];
    // main du héros : plutôt une main « limite » en jetons
    var want = Math.random() < 0.5 ? 'call' : 'fold';
    var cands = H.filter(function (h) { var x = eqVsRange(h, range); return x > 0.3 && x < 0.75; }).sort(function () { return Math.random() - 0.5; });
    var hand, e, k2 = 0;
    var bb = 1000, ante = bb, sbIdx = n - 2;
    do { hand = cands[k2] || rnd(H); e = eqVsRange(hand, range); k2++; } while (k2 < cands.length && icmAnswer(hand, e) !== want);
    function icmAnswer(hd, ee) {
      var before0 = bbStacks.map(function (x) { return x * bb; }), Hs0 = before0[hero], V0 = before0[villain], sd = villain !== sbIdx ? bb / 2 : 0;
      var fo = before0.slice(); fo[hero] -= bb + ante; fo[villain] += bb + ante + sd; if (sd) fo[sbIdx] -= sd;
      var X0 = Math.min(V0, Hs0 - ante), wi = before0.slice(), lo = before0.slice();
      wi[hero] = Hs0 + X0 + sd; wi[villain] = V0 - X0; if (sd) wi[sbIdx] -= sd;
      lo[hero] = Hs0 - ante - X0; lo[villain] = V0 + X0 + ante + sd; if (sd) lo[sbIdx] -= sd;
      return ee * icm(wi, pays)[hero] + (1 - ee) * icm(lo, pays)[hero] > icm(fo, pays)[hero] ? 'call' : 'fold';
    }
    var before = bbStacks.map(function (x) { return x * bb; });
    var Hs = before[hero], V = before[villain], sbDead = villain !== sbIdx ? bb / 2 : 0;
    var fold = before.slice(); fold[hero] -= bb + ante; fold[villain] += bb + ante + sbDead; if (sbDead) fold[sbIdx] -= sbDead;
    var X = Math.min(V, Hs - ante), potIfCall = 2 * X + ante + sbDead;
    var win = before.slice(), lose = before.slice();
    win[hero] = Hs + X + sbDead; win[villain] = V - X; if (sbDead) win[sbIdx] -= sbDead;
    lose[hero] = Hs - ante - X; lose[villain] = V + X + ante + sbDead; if (sbDead) lose[sbIdx] -= sbDead;
    var pf = icm(fold, pays), pw = icm(win, pays), pl = icm(lose, pays);
    var evFold = pf[hero], evCall = e * pw[hero] + (1 - e) * pl[hero];
    var need = (X - bb) / potIfCall;
    var answer = evCall > evFold ? 'call' : 'fold';
    var chipAns = e > need ? 'call' : 'fold';
    var names = []; for (i = 0; i < n; i++) names.push(i === hero ? 'Toi (BB)' : (i === villain ? 'Lui (' + vPos + ')' : (i === sbIdx ? 'SB' : 'Joueur ' + (i + 1))));
    var rows = before.map(function (s, k) { return { name: names[k], stack: PA.fmt(s) + ' · ' + bbStacks[k] + ' BB' }; });
    var cards = cardsOf(hand);
    return {
      custom: true, notion: 'icm', diff: 1450, hand: hand, cards: cards, choices: ['fold', 'call'], answer: answer,
      label: (sc === 'bulle' ? 'Bulle' : 'Table finale') + ' : BB face au tapis ' + vPos,
      sit: { type: 'icm' },
      visual: '<div class="small muted" style="text-align:center">' + prize + ' · blindes 500 / 1 000, ante 1 000</div>' + stackTable(rows, hero),
      text: (sc === 'bulle' ? 'Bulle : 4 joueurs, 3 payés. ' : 'Table finale, 6 joueurs. ') + 'Tout le monde se couche jusqu’à <b>' + vPos + '</b>, qui fait tapis. Tu es en <b>grosse blinde</b>. Il pousse environ ' + PA.pct(range).toString().replace('.', ',') + ' % des mains à ce tapis. Payer ou se coucher ?',
      help: '<div class="small muted">Rappel : en jetons, il faut une équité ≥ paye ÷ pot final. Avec l’ICM, on compare la valeur en euros de « payer » (gagner ou perdre) à celle de « se coucher ».</div>',
      explain: function () {
        return 'Ton équité contre sa range : <b>' + pc(e) + '</b>. En jetons, il te faut <b>' + pc(need) + '</b> : ' + (chipAns === 'call' ? 'payer gagnerait des jetons' : 'payer perdrait des jetons') + '.<br>Avec l’ICM : se coucher vaut <b>' + eur(evFold) + '</b>, payer vaut <b>' + eur(evCall) + '</b> (' + eur(pw[hero]) + ' si tu gagnes, ' + eur(pl[hero]) + ' si tu perds).' +
          (chipAns !== answer ? '<br><b>C’est exactement l’effet de la bulle :</b> le bon call en jetons devient un fold en euros, car perdre te coûte plus que gagner ne te rapporte.' : '');
      }
    };
  }

  /* ---------- 2. PKO et Space KO ---------- */
  function makePKO() {
    var space = Math.random() < 0.35;
    var bounty = space ? rnd([2.5, 5, 5, 7.5, 10, 25, 50]) : rnd([5, 7.5, 10, 12.5, 15, 20, 30]);
    var startChips = 20000, prizePart = 5; // buy-in 10 € : 5 € prix, 5 € prime
    var chipPerEuro = startChips / prizePart;
    var vBB = ri(8, 18), hBB = vBB + ri(8, 40), bb = rnd([600, 1000, 2000, 3000, 4000]), ante = bb;
    var vPos = rnd(['BTN', 'CO', 'SB']);
    var range = D.pushfold[String(PA.nearestPush(vBB))].push[vPos] || [];
    // en PKO, les tapis sont plus larges : on élargit un peu
    var wide = range.slice(); PA.D.order.forEach(function (h) { if (wide.length < range.length * 1.15 && wide.indexOf(h) < 0) wide.push(h); });
    var shove = vBB * bb, call = shove - bb, pot = shove + bb + ante + (vPos !== 'SB' ? bb / 2 : 0);
    var cash = bounty / 2, bChips = cash * chipPerEuro;
    var needNo = call / (pot + call), needPKO = call / (pot + call + bChips);
    var want = Math.random() < 0.5 ? 'call' : 'fold';
    var cands = H.slice().sort(function () { return Math.random() - 0.5; }), hand, e, k3 = 0;
    do { hand = cands[k3]; e = eqVsRange(hand, wide); k3++; } while (k3 < cands.length && ((e >= needPKO ? 'call' : 'fold') !== want || Math.abs(e - needPKO) > 0.15));
    var answer = e >= needPKO ? 'call' : 'fold';
    var cards = cardsOf(hand);
    var rows = [{ name: 'Lui (' + vPos + ')', stack: PA.fmt(shove) + ' · ' + vBB + ' BB' }, { name: 'Toi (BB)', stack: PA.fmt(hBB * bb) + ' · ' + hBB + ' BB' }];
    return {
      custom: true, notion: 'pko', diff: 1450, hand: hand, cards: cards, choices: ['fold', 'call'], answer: answer, sit: { type: 'pko' },
      label: (space ? 'Space KO' : 'PKO') + ' : BB face au tapis ' + vPos,
      visual: '<div class="small muted" style="text-align:center">' + (space ? 'Space KO' : 'PKO') + ' · buy-in 10 € (5 € de prix, 5 € de prime) · 20 000 jetons au départ · blindes 300 / 600, ante 600</div>' +
        stackTable(rows, 1, { title: 'Prime', vals: [eur(bounty), ''] }),
      text: '<b>' + vPos + '</b> fait tapis pour ' + PA.fmt(shove) + ' (' + vBB + ' BB). Tu es en grosse blinde et tu le couvres. Sa prime : <b>' + eur(bounty) + '</b>' + (space ? ' (Space KO : prime tirée au sort, ici connue)' : '') + '. Payer ou se coucher ?',
      help: '<div class="small muted">Rappel : prime en jetons = part encaissée (moitié de la prime en PKO) × jetons par euro (20 000 jetons pour 5 € de prix, soit 4 000 jetons par euro). Équité requise = paye ÷ (pot final + prime en jetons).</div>',
      explain: function () {
        return 'Tu encaisserais tout de suite ' + eur(cash) + ', soit environ <b>' + PA.fmt(bChips) + ' jetons</b>. Sans prime, il te faudrait ' + pc(needNo) + ' d’équité ; avec la prime, <b>' + pc(needPKO) + '</b>. Contre sa range de tapis (plus large en PKO), tu as <b>' + pc(e) + '</b>.' +
          (e >= needPKO && e < needNo ? '<br><b>C’est la prime qui rend ce call rentable :</b> sans elle, ce serait un fold.' : '') + (space ? '<br>En Space KO, quand la prime est cachée, on raisonne avec la prime moyenne.' : '');
      }
    };
  }

  /* ---------- 3. Outs et cote (turn) ---------- */
  var RK = 'AKQJT98765432';
  function cardStr(c) { return c[0] + c[1]; }
  function evalCards(cs) {
    // réutilise l'évaluateur du moteur de partie
    var T = window.PA_GAME && window.PA_GAME._test; var ints = cs.map(function (c) { return ('23456789TJQKA'.indexOf(c[0])) * 4 + c[1]; });
    return T.evalHand(ints);
  }
  function makeOuts() {
    var tries = 0, best = null;
    while (tries++ < 400) {
      var deck = []; for (var r = 0; r < 13; r++) for (var s = 0; s < 4; s++) deck.push([RK[r], s]);
      deck.sort(function () { return Math.random() - 0.5; });
      var hero = [deck.pop(), deck.pop()], vil = [deck.pop(), deck.pop()], board = [deck.pop(), deck.pop(), deck.pop(), deck.pop()];
      var hNow = evalCards(hero.concat(board)), vNow = evalCards(vil.concat(board));
      if (hNow >= vNow) continue;
      if (vNow < 1e10 || vNow >= 3e10) continue; // il a une paire ou deux paires
      var outs = 0, ties = 0;
      deck.forEach(function (c) { var a = evalCards(hero.concat(board, [c])), b = evalCards(vil.concat(board, [c])); if (a > b) outs++; else if (a === b) ties++; });
      if (outs < 3 || outs > 16) continue;
      best = { hero: hero, vil: vil, board: board, outs: outs, ties: ties, rem: deck.length }; break;
    }
    if (!best) return null;
    var e = (best.outs + best.ties / 2) / best.rem;
    var FR = [[1 / 4, '1/4 du pot'], [1 / 3, '1/3 du pot'], [1 / 2, 'la moitié du pot'], [2 / 3, '2/3 du pot'], [3 / 4, '3/4 du pot'], [1, 'le pot']];
    var wantC = Math.random() < 0.5, okF = FR.filter(function (f) { return (e >= f[0] / (1 + 2 * f[0])) === wantC; });
    var frac = rnd(okF.length ? okF : FR);
    var pot = rnd([4000, 6000, 8000, 10000, 12000]), bet = Math.round(pot * frac[0] / 100) * 100;
    var need = bet / (pot + 2 * bet);
    var answer = e >= need ? 'call' : 'fold';
    function cHtml(c) { var su = ['♠', '♥', '♦', '♣'][c[1]], red = c[1] === 1 || c[1] === 2; return '<div class="pcs' + (red ? ' red' : '') + '" style="width:44px;height:62px;font-size:18px"><span>' + (c[0] === 'T' ? '10' : c[0]) + '</span><span>' + su + '</span></div>'; }
    return {
      custom: true, notion: 'outs', diff: 1400, hand: '', cards: best.hero.map(function (c) { return [c[0], [0, 1, 2, 3][c[1]]]; }), choices: ['fold', 'call'], answer: answer, sit: { type: 'outs' },
      label: 'Outs et cote à la turn',
      visual: '<div class="stack" style="align-items:center;gap:8px"><div class="small muted">Tableau à la turn</div><div class="row" style="justify-content:center;gap:6px">' + best.board.map(cHtml).join('') + '</div><div class="small muted">Sa main (ta lecture) : ' + best.vil.map(function (c) { return (c[0] === 'T' ? '10' : c[0]) + ['♠', '♥', '♦', '♣'][c[1]]; }).join(' ') + '</div></div>',
      text: 'Pot : ' + PA.fmt(pot) + '. Ton adversaire mise <b>' + PA.fmt(bet) + '</b> (' + frac[1] + '). Tu le mets sur la main indiquée. Une seule carte à venir, et on suppose qu’il n’y aura plus de mise à la river : payer ou se coucher ?',
      help: '<div class="small muted">Rappel : compte tes outs, équité ≈ outs × 2 % pour une carte (exactement outs ÷ 46). Équité requise = mise ÷ (pot + 2 × mise).</div>',
      explain: function () {
        return 'Tu as <b>' + best.outs + ' outs</b>' + (best.ties ? ' (+ ' + best.ties + ' carte' + (best.ties > 1 ? 's' : '') + ' pour partager)' : '') + ', soit environ ' + (best.outs * 2) + ' % par la règle du 2, exactement <b>' + pc(e) + '</b>. Il te faut <b>' + pc(need) + '</b> (' + PA.fmt(bet) + ' ÷ ' + PA.fmt(pot + 2 * bet) + ').' +
          (Math.abs(e - need) < 0.04 ? '<br>C’est serré : avec des gains implicites (il paiera une mise à la river si tu touches), le call s’améliore.' : '');
      }
    };
  }

  function balanced(fn) { return function () { var want = Math.random() < 0.5 ? 'call' : 'fold', q = null; for (var t = 0; t < 25; t++) { var x = fn(); if (!x) continue; q = x; if (x.answer === want) break; } return q; }; }
  var MAKERS = { icm: balanced(makeICM), pko: balanced(makePKO), outs: balanced(makeOuts) };
  PA.NOTIONS.icm = 'Bulle et ICM'; PA.NOTIONS.pko = 'PKO et Space KO'; PA.NOTIONS.outs = 'Outs et cote';
  window.PA_SIT = { make: function (k) { return MAKERS[k](); }, kinds: Object.keys(MAKERS), icm: icm, eqVsRange: eqVsRange };
})();
