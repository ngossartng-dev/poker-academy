/* Poker Academy — exercice « 3-bet, squeeze ou pas ? » : décider avant le flop selon l’ouvreur, le payeur et le tapis. */
(function () {
  'use strict';
  var PA = window.PA;
  var R = 'AKQJT98765432';
  var POSFR = { UTG: 'UTG', HJ: 'le hijack', CO: 'le cut-off', BTN: 'le bouton', SB: 'la petite blinde', BB: 'la grosse blinde' };
  var POSAT = { UTG: 'en UTG', HJ: 'au hijack', CO: 'au cut-off', BTN: 'au bouton', SB: 'en petite blinde', BB: 'en grosse blinde' };
  var PROF = {
    tag: ['un régulier', 'Un joueur régulier, ni trop serré ni trop large.'],
    nit: ['un joueur très serré', 'Il ouvre peu et ne continue qu’avec ses meilleures mains.'],
    voleur: ['un voleur', 'Il ouvre très large en fin de table et se couche souvent quand on le relance.'],
    station: ['un récréatif qui paie tout', 'Il paie presque toutes les relances, même avec des mains moyennes.']
  };
  // situations de 3-bet [héros, ouvreur] et de squeeze [héros, ouvreur, payeur]
  var S3 = [['BTN', 'CO'], ['BTN', 'HJ'], ['SB', 'BTN'], ['SB', 'CO'], ['BB', 'BTN'], ['BB', 'CO'], ['CO', 'HJ'], ['HJ', 'UTG']];
  var SQ = [['BB', 'CO', 'BTN'], ['SB', 'CO', 'BTN'], ['BTN', 'HJ', 'CO'], ['BB', 'BTN', 'SB'], ['BB', 'HJ', 'BTN']];
  var LATE = { CO: 1, BTN: 1, SB: 1 };

  function ri(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[ri(a.length)]; }
  function rk(c) { return R.indexOf(c); }
  // une main canonique est « au moins » une autre dans sa famille (paires, assorties, dépareillées)
  function inList(h, list) { return list.indexOf(h) >= 0; }
  function expand(spec) { // '88+', 'ATs+', 'A5s-A2s', 'KQo'
    var out = [];
    spec.split(',').forEach(function (t) {
      t = t.trim(); if (!t) return;
      var m;
      if ((m = /^([AKQJT2-9])\1\+$/.exec(t))) { for (var i = 0; i <= rk(m[1]); i++) out.push(R[i] + R[i]); return; }
      if ((m = /^([AKQJT2-9])\1-([AKQJT2-9])\2$/.exec(t))) { for (var i2 = rk(m[1]); i2 <= rk(m[2]); i2++) out.push(R[i2] + R[i2]); return; }
      if ((m = /^([AKQJT2-9])([AKQJT2-9])([so])\+$/.exec(t))) { for (var j = rk(m[1]) + 1; j <= rk(m[2]); j++) out.push(m[1] + R[j] + m[3]); return; }
      if ((m = /^([AKQJT2-9])([AKQJT2-9])([so])-\1([AKQJT2-9])\3$/.exec(t))) { for (var k = rk(m[2]); k <= rk(m[4]); k++) out.push(m[1] + R[k] + m[3]); return; }
      out.push(t);
    });
    return out;
  }
  function tagRange(hero, opener) {
    var P = PA.D.profiles.tag;
    var r = hero === 'BB' ? P.bb.deep[opener] : (P.vsOpen.deep[hero] || {})[opener];
    return r || { raise: [], call: [] };
  }

  // ---- le moteur de décision ----
  // garde-fou : une main ne se joue jamais moins bien qu’une main qu’elle domine évidemment
  // (paire inférieure, même hauteur avec un kicker plus faible, version dépareillée) ; les bluffs (light) n’entraînent rien
  function weaker(h) {
    var a = rk(h[0]), b = rk(h[1]), out = [];
    if (h.length === 2) { if (a < 12) out.push(R[a + 1] + R[a + 1]); return out; }
    if (b + 1 <= 12 && b + 1 !== a) out.push(h[0] + R[b + 1] + h[2]);
    if (h[2] === 's') out.push(h[0] + h[1] + 'o');
    return out;
  }
  var RANKA = { jam: 3, value: 3, call: 1 };
  function decide(q) {
    var r = decideRaw(q);
    if (r.a !== 'fold' || /^A[2-5]s$/.test(q.hand)) return r;
    var best = null;
    weaker(q.hand).forEach(function (w) { var x = decide(Object.assign({}, q, { hand: w })); if (RANKA[x.a] && (!best || RANKA[x.a] > RANKA[best.a])) best = x; });
    if (!best) return r;
    if (best.a === 'call' && q.hero === 'SB' && q.kind === 'sq') return r;
    return { a: best.a, why: (q.kind === 'sq' ? best.why : best.a === 'call' ? callWhy(q) : best.a === 'jam' ? jamWhy(q) : valueWhy(q)) + ' Elle domine ' + weaker(q.hand).join(' et ') + ', qui se jouent déjà ainsi.' };
  }
  function decideRaw(q) {
    var h = q.hand, prof = q.prof, hero = q.hero, deep = q.stack === 100;
    var canCall = true, extra = hero !== 'SB';
    if (q.kind === '3b') {
      var base = tagRange(hero, q.opener), late = !!LATE[q.opener];
      if (!deep) {
        var jam = prof === 'nit' ? expand('TT+,AQs+,AKo') : prof === 'station' ? expand('77+,ATs+,KQs,AJo+,KQo') : prof === 'voleur' ? expand('55+,A2s+,KTs+,QJs,ATo+,KQo') : (late ? expand('77+,ATs+,KQs,AJo+,A5s-A4s') : expand('99+,AJs+,KQs,AQo+'));
        if (inList(h, jam)) return { a: 'jam', why: jamWhy(q) };
        if (hero === 'BB' && inList(h, base.call) && h.length === 3 && h[2] === 's') return { a: 'call', why: 'En grosse blinde, tu as la cote pour payer une main assortie qui joue bien après le flop ; pas assez forte pour le tapis.' };
        if (hero === 'BB' && inList(h, base.call) && h.length === 2) return { a: 'call', why: 'Petite paire en grosse blinde : tu paies pour toucher le brelan, mais elle n’est pas assez forte pour le tapis.' };
        return { a: 'fold', why: 'À 25 BB, pas de cold call : tapis ou couche. Cette main n’est pas assez forte pour le tapis contre ' + PROF[prof][0] + '.' };
      }
      var valueCore = late ? expand('88+,ATs+,KJs+,AJo+,KQo') : expand('TT+,AJs+,KQs,AQo+');
      var lightBase = base.raise.filter(function (x) { return !inList(x, valueCore); });
      var value = base.raise.filter(function (x) { return inList(x, valueCore); }), light = lightBase.slice(), call = base.call.slice();
      if (prof === 'nit') {
        value = expand('QQ+,AKs,AKo'); var mid = valueCore.filter(function (x) { return !inList(x, value) && inList(x, base.raise); });
        call = extra ? call.concat(mid) : call;
      } else if (prof === 'voleur') {
        value = value.concat(expand('77,ATo,KTs,QJs').filter(function (x) { return !inList(x, value); }));
        light = light.concat(expand('A9s-A2s,K9s-K6s,Q9s,J9s,T9s,98s,87s').filter(function (x) { return !inList(x, value) && !inList(x, light); }));
        call = call.filter(function (x) { return !inList(x, value) && !inList(x, light); });
      } else if (prof === 'station') {
        value = value.concat(expand('77+,ATs+,KJs+,QJs,AJo+,KQo').filter(function (x) { return !inList(x, value); }));
        call = extra ? call.concat(light.filter(function (x) { return x[0] === 'A' || /s$/.test(x); })).filter(function (x) { return !inList(x, value); }) : call.filter(function (x) { return !inList(x, value); });
        light = [];
      }
      if (inList(h, value)) return { a: 'value', why: valueWhy(q) };
      if (inList(h, light)) return { a: 'light', why: lightWhy(q) };
      if (inList(h, call) && canCall) return { a: 'call', why: callWhy(q) };
      return { a: 'fold', why: foldWhy(q) };
    }
    // squeeze
    if (!deep) {
      var jamS = expand('99+,AJs+,KQs,AQo+').concat(q.prof === 'voleur' ? expand('A5s-A4s') : []);
      if (inList(h, jamS)) return { a: 'jam', why: 'À 25 BB, ton squeeze se fait à tapis : 11 BB engageraient la moitié de ton tapis. Range : 99+, AJs+, AQo+, KQs' + (q.prof === 'voleur' ? ', plus A5s-A4s contre un ouvreur voleur.' : '.') };
      if (hero === 'BB' && (inList(h, expand('88-22')) || inList(h, expand('T9s,98s,87s,76s,65s')))) return { a: 'call', why: 'En grosse blinde, avec deux joueurs dans le coup, tu as la cote pour payer une petite paire ou un connecteur assorti.' };
      return { a: 'fold', why: 'À 25 BB, avec deux joueurs à battre, couche ce qui n’est pas assez fort pour le tapis.' };
    }
    var vS = expand('TT+,AQs+,AKo'), lS = expand('A5s-A2s,K9s');
    if (q.prof === 'voleur') { vS = vS.concat(expand('AJs,KQs,AQo')); lS = lS.concat(expand('A9s-A6s,KTs')); }
    if (q.prof === 'nit') { vS = expand('QQ+,AKs,AKo'); }
    if (q.caller === 'station') lS = [];
    var cS = hero === 'SB' ? [] : (hero === 'BB' ? expand('99-22,T9s,98s,87s,76s,65s,54s,AJs,ATs,KQs,KJs,QJs,JTs,KTs,QTs,A9s-A6s,AQo') : expand('99-22,T9s,98s,87s,76s,AJs,KQs,KJs,QJs,JTs,AQo'));
    if (hero === 'SB' && q.prof !== 'nit') vS = vS.concat(expand('AQo'));
    if (q.prof === 'nit' && hero !== 'SB') cS = cS.concat(expand('JJ,TT,AQs'));
    if (inList(h, vS)) return { a: 'value', why: 'Squeeze de valeur : ' + (q.prof === 'nit' ? 'contre un ouvreur très serré, garde ta valeur pour QQ+ et AK.' : 'tes mains fortes profitent des 6,5 BB d’argent mort, et le payeur est plafonné.') + (q.caller === 'station' ? ' Contre le récréatif qui a payé, squeeze 2 BB plus gros : il paiera quand même.' : '') };
    if (inList(h, lS)) return { a: 'light', why: 'Squeeze light : bloqueur, mains assorties qui gardent de l’équité si on te paie, et deux joueurs qui se couchent environ deux fois sur trois.' };
    if (inList(h, cS) && hero !== 'SB') return { a: 'call', why: (/^A[QJT]|^KQ/.test(h) ? 'Main forte mais pas assez pour squeezer contre deux joueurs, et trop souvent dominée si on te relance : tu paies' : 'Main qui joue bien à plusieurs (brelan, couleur, quinte) mais trop faible pour squeezer : tu paies') + (hero === 'BTN' ? ', en position.' : ' avec ta bonne cote de grosse blinde.') };
    if (q.caller === 'station' && inList(h, expand('A5s-A2s,K9s,A9s-A6s,KTs'))) return { a: hero === 'SB' ? 'fold' : 'call', why: 'Avec un récréatif qui paie tout dans le coup, pas de squeeze light : il ne se couchera pas.' + (hero === 'SB' ? ' Et depuis la petite blinde, hors de position, tu te couches.' : ' Tu peux payer cette main assortie.') };
    return { a: 'fold', why: hero === 'SB' ? 'Depuis la petite blinde : squeeze ou couche. Payer hors de position, avec la grosse blinde derrière, est un piège.' : 'Trop faible pour squeezer, et pas assez jouable pour payer à plusieurs : souvent dominée.' };
  }
  function jamWhy(q) {
    return 'À 25 BB, ton 3-bet devient un tapis (resteal) : une relance à 6,5 BB engagerait un quart de ton tapis. ' + (q.prof === 'voleur' ? 'Contre un voleur qui se couche souvent, ta range de tapis s’élargit.' : q.prof === 'nit' ? 'Contre un joueur très serré, seulement les mains fortes.' : q.prof === 'station' ? 'Contre un joueur qui paie tout, seulement de la valeur.' : 'Cette main est dans ta range de tapis.');
  }
  function valueWhy(q) {
    if (q.prof === 'station') return '3-bet de valeur, linéaire : il paie trop, donc tes mains moyennes fortes gagnent de l’argent contre ses mains plus faibles.';
    if (q.prof === 'nit') return 'Contre un joueur très serré, ta valeur se resserre à QQ+ et AK : celle-ci en fait partie.';
    if (q.prof === 'voleur') return '3-bet de valeur : contre une ouverture très large, cette main est loin devant sa range.';
    return '3-bet de valeur : cette main est dans le haut de ta range face à ' + POSFR[q.opener] + '.';
  }
  function lightWhy(q) {
    return '3-bet light : ' + (q.prof === 'voleur' ? 'le voleur lâche plus de 59 % de ses ouvertures face à ta relance, ' : q.prof === 'nit' ? 'le joueur serré lâche les trois quarts de ses ouvertures, ' : 'l’ouvreur se couche souvent, ') + 'et ta main a un bloqueur ou de la jouabilité si on te paie.';
  }
  function callWhy(q) {
    if (q.hero === 'SB') return 'Un des rares calls de la petite blinde : une petite paire qui cherche le brelan. Tout le reste, c’est 3-bet ou couche.';
    if (q.prof === 'nit') return 'Contre un joueur très serré, cette main est trop faible pour relancer pour la valeur, mais assez bonne pour payer' + (q.hero === 'BB' ? ' en grosse blinde.' : ' en position.');
    if (q.prof === 'station') return 'Contre un récréatif qui paie tout, pas de bluff : cette main assortie se paie' + (q.hero === 'BB' ? ' avec ta bonne cote.' : ', en position.');
    return 'Main du milieu (petite paire, assortie, figures) : elle joue bien en payant' + (q.hero === 'BB' ? ' avec ta cote de grosse blinde.' : ' en position.') + ' On ne la relance pas : le 3-bet est polarisé.';
  }
  function foldWhy(q) {
    if (q.hero === 'SB') return 'Depuis la petite blinde, c’est 3-bet ou couche, et cette main n’est assez bonne ni pour la valeur ni pour un bluff.';
    if (q.opener === 'UTG') return 'Face à UTG, sa range est forte : pas de 3-bet light, et cette main serait souvent dominée en payant.';
    if (q.prof === 'station') return 'Contre un récréatif qui paie tout, pas de bluff, et cette main est trop faible pour la valeur.';
    return 'Trop faible pour relancer, et pas assez jouable pour payer : couche-toi.';
  }

  // ---- les questions ----
  var POOL = expand('AA,KK,QQ,JJ,TT,99,88,77,66,55,44,33,22,AKs,AQs,AJs,ATs,A9s,A8s,A7s,A6s,A5s,A4s,A3s,A2s,KQs,KJs,KTs,K9s,K8s,K7s,K6s,QJs,QTs,Q9s,JTs,J9s,T9s,98s,87s,76s,65s,AKo,AQo,AJo,ATo,A9o,A8o,KQo,KJo,KTo,K9o,K7o,QJo,QTo,Q9o,Q8o,JTo,J9o,J8o,T9o,97o');
  function makeQ() {
    var q;
    for (var t = 0; t < 50; t++) {
      var sq = Math.random() < 0.35;
      q = { kind: sq ? 'sq' : '3b', stack: Math.random() < 0.3 ? 25 : 100, hand: pick(POOL) };
      if (sq) { var s = pick(SQ); q.hero = s[0]; q.opener = s[1]; q.callPos = s[2]; q.prof = pick(['tag', 'voleur', 'nit']); q.caller = Math.random() < 0.3 ? 'station' : 'serré'; }
      else { var s3 = pick(S3); q.hero = s3[0]; q.opener = s3[1]; q.prof = q.opener === 'UTG' ? pick(['tag', 'nit']) : pick(['tag', 'voleur', 'nit', 'station']); }
      q.res = decide(q);
      // équilibrer : pas trop de « se coucher » évidents
      if (q.res.a !== 'fold' || Math.random() < 0.35) break;
    }
    q.opts = q.stack === 25 ? [['fold', 'Se coucher'], ['call', 'Payer'], ['jam', 'Tapis']] : (q.kind === 'sq' ? [['fold', 'Se coucher'], ['call', 'Payer'], ['value', 'Squeeze de valeur'], ['light', 'Squeeze light (bluff)']] : [['fold', 'Se coucher'], ['call', 'Payer'], ['value', '3-bet de valeur'], ['light', '3-bet light (bluff)']]);
    q.cards = deal(q.hand);
    return q;
  }
  function deal(h) {
    var S = ['s', 'h', 'd', 'c'], a = pick(S), b;
    if (h.length === 2) { do { b = pick(S); } while (b === a); return h[0] + a + h[1] + b; }
    if (h[2] === 's') return h[0] + a + h[1] + a;
    do { b = pick(S); } while (b === a); return h[0] + a + h[1] + b;
  }
  function story(q) {
    var o = 'Tournoi, ' + q.stack + ' BB. ' + cap(POSFR[q.opener]) + ' ouvre à 2 BB. C’est ' + PROF[q.prof][0] + ' : ' + PROF[q.prof][1].charAt(0).toLowerCase() + PROF[q.prof][1].slice(1);
    if (q.kind === 'sq') o += ' ' + cap(POSFR[q.callPos]) + ' paie' + (q.caller === 'station' ? ' : c’est un récréatif qui paie tout.' : ' : un joueur plutôt serré.');
    return o + ' Tout le monde se couche jusqu’à toi, ' + POSAT[q.hero] + '.';
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  var SU = { s: ['♠', 0], h: ['♥', 1], d: ['♦', 1], c: ['♣', 0] };
  function cards(str) { var o = ''; for (var i = 0; i < str.length; i += 2) { var r = str[i], s = SU[str[i + 1]]; o += '<span class="pq-card small' + (s[1] ? ' red' : '') + '">' + (r === 'T' ? '10' : r) + '<small>' + s[0] + '</small></span>'; } return o; }

  var Q = null, N = 10;
  function newSeries() { var l = []; for (var i = 0; i < N; i++) l.push(makeQ()); return { list: l, i: 0, ok: 0, ans: null }; }
  function view() {
    var ui = window.PA_UI;
    if (!Q) Q = newSeries();
    var head = '<div class="stack"><button class="back" data-act="nav" data-v="situations">‹ Situations</button><h1>3-bet, squeeze ou pas ?</h1>';
    if (Q.i >= Q.list.length) return ui.shell('entrainer', head + ui.yo(Q.ok + (Q.ok > 1 ? ' bonnes réponses' : ' bonne réponse') + ' sur ' + Q.list.length + '. ' + (Q.ok >= 8 ? 'Tu choisis bien entre valeur, bluff et call.' : 'Relis les chapitres 39 et 40 : qui ouvre, qui paie, et combien de jetons il te reste changent tout.')) + '<button class="btn gold block" data-chx="again">Nouvelle série</button><a class="btn block" href="#lecon-39">Chapitre 39 : 3-bet linéaire, polarisé et light</a><a class="btn block" href="#lecon-40">Chapitre 40 : le squeeze</a></div>');
    var q = Q.list[Q.i], out = head + (Q.i === 0 && Q.ans === null ? '<div class="small muted">Avant le flop, face à une ouverture (et parfois un payeur) : relancer pour la valeur, bluffer, payer ou se coucher ? Les réponses suivent les ranges de l’appli (profil TAG) et les règles des chapitres 39 à 41.</div>' : '') +
      '<div class="small muted">Question ' + (Q.i + 1) + ' sur ' + Q.list.length + ' · ' + Q.ok + ' bonne' + (Q.ok > 1 ? 's' : '') + ' réponse' + (Q.ok > 1 ? 's' : '') + '</div>' +
      '<div class="card stack"><div>' + story(q) + '</div><div class="small muted">Ta main</div><div class="pq-hand">' + cards(q.cards) + '</div></div>';
    if (Q.ans === null) out += '<div class="stack">' + q.opts.map(function (o) { return '<button class="btn block" data-chx="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
    else {
      var good = Q.ans === q.res.a, lab = q.opts.filter(function (o) { return o[0] === q.res.a; })[0][1];
      out += '<div class="pq-res ' + (good ? 'ok' : 'ko') + '">' + (good ? 'Oui : ' : 'Non : ') + lab.toLowerCase() + '.</div>' + ui.yo(q.res.why) + '<button class="btn gold block" data-chx="next">' + (Q.i + 1 >= Q.list.length ? 'Voir mon score' : 'Question suivante') + '</button>';
    }
    return ui.shell('entrainer', out + '</div>');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-chx]') : null; if (!t) return;
    var a = t.getAttribute('data-chx');
    if (a === 'again') Q = null; else if (!Q) return; else if (a === 'next') { Q.i++; Q.ans = null; } else if (Q.ans === null) { Q.ans = a; if (a === Q.list[Q.i].res.a) Q.ok++; }
    window.PA_UI.render(); window.scrollTo(0, 0);
  });
  window.PA_CHOIX = { view: view, decide: decide, makeQ: makeQ, reset: function () { Q = null; } };
})();
