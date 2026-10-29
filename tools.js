/* Poker Academy v2.0 — Boîte à outils : équité, ICM, primes PKO, M */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }
  var RCH = '23456789TJQKA', SUIT = ['♠', '♥', '♦', '♣'], RED = [false, true, true, false];
  var T = { tab: 'eq', slots: [null, null, null, null, null, null, null, null, null], cur: 0, rank: null, vmode: 'hand', vr: { kind: 'open', pos: 'BTN', bb: 10 }, res: null, busy: false,
    icm: { stacks: '40 14 9 21', pays: '50 30 20', res: null },
    pko: { start: 20000, prize: 5, bounty: 5, pot: 12900, call: 5400, res: null },
    m: { stack: 30000, sb: 500, bb: 1000, ante: 1000, n: 9, bbante: true, res: null } };
  // emplacements : 0-1 ta main, 2-3 adversaire, 4-8 tableau
  function cardLbl(c) { if (c === null) return '<span class="muted">?</span>'; var r = RCH[c >> 2], s = c & 3; return (r === 'T' ? '10' : r) + '<span style="color:' + (RED[s] ? '#ff5a5a' : 'inherit') + '">' + SUIT[s] + '</span>'; }
  function used(except) { var u = {}; T.slots.forEach(function (c, i) { if (c !== null && i !== except) u[c] = 1; }); return u; }
  function num(v) { return parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0; }
  function pct(x) { return (Math.round(x * 1000) / 10).toFixed(1).replace('.', ',') + ' %'; }
  function f0(x) { return Math.round(x).toLocaleString('fr-FR'); }

  /* ---------- Équité ---------- */
  function evalH(c) { return window.PA_GAME._test.evalHand(c); }
  function combosOf(code, block) {
    // toutes les combinaisons d'une main de 169 (ex. AKs) sans les cartes bloquées
    var a = RCH.indexOf(code[0]), b = RCH.indexOf(code[1]), out = [], s1, s2;
    for (s1 = 0; s1 < 4; s1++) for (s2 = 0; s2 < 4; s2++) {
      if (a === b && s2 <= s1) continue;
      if (a !== b && code[2] === 's' && s1 !== s2) continue;
      if (a !== b && code[2] === 'o' && s1 === s2) continue;
      var c1 = a * 4 + s1, c2 = b * 4 + s2;
      if (!block[c1] && !block[c2]) out.push([c1, c2]);
    }
    return out;
  }
  function villainRange() {
    var p = PA.player(), prof = p.profile || 'tag', s, ch;
    if (T.vr.kind === 'open') { s = { type: 'open', pos: T.vr.pos, bb: 60 }; ch = PA.chart(prof, s); return Object.keys(ch).filter(function (h) { return ch[h] !== 'fold'; }); }
    if (T.vr.kind === 'push') { var t = PA.D.pushfold[String(PA.nearestPush(T.vr.bb))]; return (t && t.push[T.vr.pos]) || []; }
    return PA.HANDS.slice();
  }
  function rangeLabel() {
    var P = PA.POS_LABEL[T.vr.pos];
    if (T.vr.kind === 'open') return 'range d’ouverture ' + P + ' de ton profil (tapis profond)';
    if (T.vr.kind === 'push') return 'range de tapis ' + P + ' à ' + PA.nearestPush(T.vr.bb) + ' BB (tables d’équilibre)';
    return 'n’importe quelle main';
  }
  function computeEq() {
    var hero = [T.slots[0], T.slots[1]], board = T.slots.slice(4).filter(function (c) { return c !== null; });
    if (hero[0] === null || hero[1] === null) return { err: 'Choisis d’abord tes deux cartes.' };
    if (board.length === 1 || board.length === 2) return { err: 'Le tableau doit avoir 0, 3, 4 ou 5 cartes.' };
    var block = {}; hero.concat(board).forEach(function (c) { block[c] = 1; });
    var villains;
    if (T.vmode === 'hand') {
      if (T.slots[2] === null || T.slots[3] === null) return { err: 'Choisis les deux cartes de l’adversaire, ou passe en mode « contre une range ».' };
      villains = [[T.slots[2], T.slots[3]]];
    } else {
      villains = []; villainRange().forEach(function (h) { villains = villains.concat(combosOf(h, block)); });
      if (!villains.length) return { err: 'Aucune main de cette range n’est possible avec ces cartes.' };
    }
    var w = 0, t = 0, n = 0, need = 5 - board.length;
    function score(v, b) { var a = evalH(hero.concat(b)), c = evalH(v.concat(b)); if (a > c) w++; else if (a === c) t++; n++; }
    var exact = T.vmode === 'hand' && need <= 2;
    if (exact) {
      var v = villains[0], bl = {}; Object.keys(block).forEach(function (k) { bl[k] = 1; }); bl[v[0]] = bl[v[1]] = 1;
      var pool = []; for (var c = 0; c < 52; c++) if (!bl[c]) pool.push(c);
      if (need === 0) score(v, board);
      else if (need === 1) pool.forEach(function (x) { score(v, board.concat([x])); });
      else for (var i = 0; i < pool.length; i++) for (var j = i + 1; j < pool.length; j++) score(v, board.concat([pool[i], pool[j]]));
    } else {
      var iters = 20000;
      for (var it = 0; it < iters; it++) {
        var vv = villains[Math.floor(Math.random() * villains.length)], b = board.slice(), bk = {};
        bk[vv[0]] = bk[vv[1]] = 1; b.forEach(function (x) { bk[x] = 1; }); hero.forEach(function (x) { bk[x] = 1; });
        while (b.length < 5) { var r = Math.floor(Math.random() * 52); if (!bk[r]) { bk[r] = 1; b.push(r); } }
        score(vv, b);
      }
    }
    return { win: w / n, tie: t / n, lose: (n - w - t) / n, n: n, exact: exact, combos: villains.length };
  }
  function slotBtn(i) { return '<button data-tact="slot" data-v="' + i + '" class="pcbtn' + (T.cur === i ? ' on' : '') + '" style="min-width:52px;min-height:62px;font-size:1.25em;font-weight:700;border-radius:10px;border:2px solid ' + (T.cur === i ? 'var(--gold)' : 'var(--line)') + ';background:#fff;color:#111">' + cardLbl(T.slots[i]) + '</button>'; }
  function eqTab() {
    var u = used(T.cur);
    var ranks = '<div class="seg">' + RCH.split('').reverse().map(function (r, k) { var ri = 12 - k; return '<button class="' + (T.rank === ri ? 'on' : '') + '" data-tact="rank" data-v="' + ri + '" style="min-width:44px">' + (r === 'T' ? '10' : r) + '</button>'; }).join('') + '</div>';
    var suits = '<div class="seg">' + SUIT.map(function (s, k) { var c = T.rank === null ? -1 : T.rank * 4 + k, dis = T.rank === null || u[c]; return '<button data-tact="suit" data-v="' + k + '"' + (dis ? ' disabled style="opacity:.35;min-width:56px;font-size:1.3em"' : ' style="min-width:56px;font-size:1.3em;color:' + (RED[k] ? '#ff5a5a' : 'inherit') + '"') + '>' + s + '</button>'; }).join('') + '<button data-tact="clearSlot">Effacer la carte</button></div>';
    var vr = T.vmode === 'range' ? '<div class="card stack" style="gap:8px"><div class="small muted">Range de l’adversaire</div>' +
      seg('vrk', [['open', 'Ouverture'], ['push', 'Tapis court'], ['any', 'Main au hasard']], T.vr.kind) +
      (T.vr.kind !== 'any' ? seg('vrp', (T.vr.kind === 'push' ? Object.keys(PA.D.pushfold['10'].push) : ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB']).map(function (p) { return [p, PA.POS_LABEL[p].replace('UTG+2 (MP)', 'MP')]; }), T.vr.pos) : '') +
      (T.vr.kind === 'push' ? seg('vrb', PA.PUSH_DEPTHS.slice().reverse().map(function (d) { return [d, d + ' BB']; }), PA.nearestPush(T.vr.bb)) : '') + '</div>' : '';
    var res = '';
    if (T.res && T.res.err) res = U().yo(T.res.err);
    else if (T.res) res = '<div class="grid2"><div class="card"><div class="muted small">Ta main gagne</div><div class="disp" style="font-size:36px;color:#4fe08f">' + pct(T.res.win + T.res.tie / 2) + '</div><div class="small muted">dont égalité ' + pct(T.res.tie) + '</div></div><div class="card"><div class="muted small">' + (T.vmode === 'hand' ? 'L’adversaire gagne' : 'La range gagne') + '</div><div class="disp" style="font-size:36px;color:#ff8080">' + pct(T.res.lose + T.res.tie / 2) + '</div><div class="small muted">' + (T.res.exact ? 'calcul exact' : 'simulation de ' + f0(T.res.n) + ' tableaux') + '</div></div></div>' +
      (T.vmode === 'range' ? '<div class="small muted">Contre la ' + rangeLabel() + ' : ' + T.res.combos + ' combinaisons possibles.</div>' : '');
    return '<div class="card stack"><b>Calculateur d’équité</b>' +
      seg('vmode', [['hand', 'Main contre main'], ['range', 'Main contre une range']], T.vmode) +
      '<div class="small muted">Ta main</div><div class="row">' + slotBtn(0) + slotBtn(1) + '</div>' +
      (T.vmode === 'hand' ? '<div class="small muted">L’adversaire</div><div class="row">' + slotBtn(2) + slotBtn(3) + '</div>' : vr) +
      '<div class="small muted">Tableau (facultatif : 3, 4 ou 5 cartes)</div><div class="row" style="flex-wrap:wrap">' + [4, 5, 6, 7, 8].map(slotBtn).join('') + '</div>' +
      '<div class="small muted">Touche un emplacement, puis la valeur et la couleur de la carte.</div>' + ranks + suits +
      '<div class="row"><button class="btn gold" data-tact="calcEq" style="flex:1">Calculer</button><button class="btn" data-tact="resetEq">Tout effacer</button></div></div>' + res;
  }
  function seg(k, opts, cur) { return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (String(cur) === String(o[0]) ? 'on' : '') + '" data-tact="set" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function input(id, val, w) { return '<input id="' + id + '" value="' + U().esc(String(val)) + '" inputmode="decimal" style="width:' + (w || 120) + 'px;min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit">'; }
  function field(label, id, val, w, hint) { return '<label class="row" style="justify-content:space-between;gap:10px"><span>' + label + (hint ? '<br><span class="small muted">' + hint + '</span>' : '') + '</span>' + input(id, val, w) + '</label>'; }

  /* ---------- ICM ---------- */
  function icmTab() {
    var I = T.icm, out = '';
    if (I.res && I.res.err) out = U().yo(I.res.err);
    else if (I.res) {
      var tot = I.res.stacks.reduce(function (a, b) { return a + b; }, 0), pool = I.res.pays.reduce(function (a, b) { return a + b; }, 0);
      out = '<div class="card stack"><b>Valeur de chaque tapis</b><table class="tbl"><tr><th>Joueur</th><th>Tapis</th><th>Jetons</th><th>Valeur</th><th>Part des prix</th></tr>' +
        I.res.stacks.map(function (s, i) { return '<tr><td>' + (i + 1) + '</td><td>' + String(s).replace('.', ',') + '</td><td>' + pct(s / tot) + '</td><td><b>' + I.res.ev[i].toFixed(2).replace('.', ',') + ' €</b></td><td>' + pct(I.res.ev[i] / pool) + '</td></tr>'; }).join('') + '</table>' +
        '<div class="small muted">Quand la part des prix est plus petite que la part des jetons, le tapis vaut moins que ses jetons : c’est l’effet ICM (chapitre 23).</div></div>';
    }
    return '<div class="card stack"><b>Calculateur ICM</b><div class="small muted">Modèle de Malmuth-Harville, jusqu’à 10 joueurs. Entre les tapis (en jetons ou en BB) et les prix restants, séparés par des espaces.</div>' +
      field('Tapis des joueurs restants', 'icmS', I.stacks, 180) + field('Prix restants (€)', 'icmP', I.pays, 180) +
      '<button class="btn gold" data-tact="calcIcm">Calculer</button></div>' + out;
  }
  function calcIcm() {
    var I = T.icm; I.stacks = document.getElementById('icmS').value; I.pays = document.getElementById('icmP').value;
    var st = I.stacks.split(/[\s;]+/).map(num).filter(function (x) { return x > 0; }), pa = I.pays.split(/[\s;]+/).map(num).filter(function (x) { return x > 0; });
    if (st.length < 2) { I.res = { err: 'Il faut au moins deux tapis.' }; return; }
    if (st.length > 10) { I.res = { err: 'Au-delà de 10 joueurs, le calcul exact devient trop long : entre les 10 tapis qui comptent le plus.' }; return; }
    if (!pa.length) { I.res = { err: 'Entre au moins un prix.' }; return; }
    pa.sort(function (a, b) { return b - a; }); pa = pa.slice(0, st.length);
    I.res = { stacks: st, pays: pa, ev: window.PA_SIT.icm(st, pa) };
  }

  /* ---------- PKO ---------- */
  function pkoTab() {
    var K = T.pko, out = '';
    if (K.res) {
      out = '<div class="card stack"><b>Résultat</b><table class="tbl">' +
        '<tr><td>Jetons par euro</td><td><b>' + f0(K.res.jpe) + '</b></td></tr>' +
        '<tr><td>Prime encaissée (la moitié)</td><td><b>' + K.res.cash.toFixed(2).replace('.', ',') + ' €</b>, soit ' + f0(K.res.chips) + ' jetons</td></tr>' +
        '<tr><td>Équité requise sans la prime</td><td><b>' + pct(K.res.need0) + '</b></td></tr>' +
        '<tr><td>Équité requise avec la prime</td><td><b style="color:#4fe08f">' + pct(K.res.need1) + '</b></td></tr></table>' +
        '<div class="small muted">La prime ne compte que si tu couvres l’adversaire. En Space KO, prends la valeur moyenne de la prime. Près de la bulle, l’ICM tire dans l’autre sens.</div></div>';
    }
    return '<div class="card stack"><b>Convertisseur de prime PKO</b><div class="small muted">Chapitre 25 : jetons par euro = tapis de départ ÷ part du buy-in qui va aux prix ; équité requise = paye ÷ (pot final + prime en jetons).</div>' +
      field('Tapis de départ', 'pkS', K.start) + field('Part du buy-in pour les prix (€)', 'pkP', K.prize) + field('Prime de l’adversaire (€)', 'pkB', K.bounty, 120, 'tu en encaisses la moitié') +
      field('Pot final si tu paies', 'pkPot', K.pot, 120, 'en jetons, ta paye comprise') + field('Ta paye', 'pkC', K.call, 120, 'en jetons') +
      '<button class="btn gold" data-tact="calcPko">Calculer</button></div>' + out;
  }
  function calcPko() {
    var K = T.pko; K.start = document.getElementById('pkS').value; K.prize = document.getElementById('pkP').value; K.bounty = document.getElementById('pkB').value; K.pot = document.getElementById('pkPot').value; K.call = document.getElementById('pkC').value;
    var jpe = num(K.start) / Math.max(0.01, num(K.prize)), cash = num(K.bounty) / 2, chips = cash * jpe, pot = num(K.pot), call = num(K.call);
    K.res = { jpe: jpe, cash: cash, chips: chips, need0: pot ? call / pot : 0, need1: pot ? call / (pot + chips) : 0 };
  }

  /* ---------- M ---------- */
  function mTab() {
    var M = T.m, out = '';
    if (M.res) {
      var z = M.res.m >= 20 ? ['Verte', '#4fe08f', 'jeu normal.'] : (M.res.m >= 10 ? ['Jaune', '#ffd43b', 'vole davantage, surtout en fin de table.'] : (M.res.m > 5 ? ['Orange', '#ff9f43', 'tapis ou fold.'] : ['Rouge', '#ff5a5a', 'tapis avec une large range dès que personne n’a ouvert.']));
      out = '<div class="grid2"><div class="card"><div class="muted small">Ton M</div><div class="disp" style="font-size:40px;color:' + z[1] + '">' + String(Math.round(M.res.m * 10) / 10).replace('.', ',') + '</div><div class="small muted">zone ' + z[0].toLowerCase() + '</div></div><div class="card"><div class="muted small">Ton tapis</div><div class="disp" style="font-size:40px">' + String(Math.round(M.res.bbs * 10) / 10).replace('.', ',') + ' BB</div><div class="small muted">un tour coûte ' + f0(M.res.orbit) + ' jetons</div></div></div>' +
        U().yo('Zone ' + z[0].toLowerCase() + ' : ' + z[2] + ' Tu peux encore faire environ ' + Math.floor(M.res.m) + ' tours de table sans jouer.');
    }
    return '<div class="card stack"><b>Compteur de M</b><div class="small muted">Chapitre 20 : M = ton tapis ÷ coût d’un tour de table (petite blinde + grosse blinde + antes).</div>' +
      field('Ton tapis', 'mS', M.stack) + field('Petite blinde', 'mSB', M.sb) + field('Grosse blinde', 'mBB', M.bb) +
      seg('bbante', [['true', 'Ante de la grosse blinde'], ['false', 'Ante par joueur']], M.bbante) +
      field(M.bbante ? 'Ante (payée une fois)' : 'Ante par joueur', 'mA', M.ante) + (M.bbante ? '' : field('Joueurs à la table', 'mN', M.n)) +
      '<button class="btn gold" data-tact="calcM">Calculer</button></div>' + out;
  }
  function calcM() {
    var M = T.m; M.stack = document.getElementById('mS').value; M.sb = document.getElementById('mSB').value; M.bb = document.getElementById('mBB').value; M.ante = document.getElementById('mA').value;
    var nEl = document.getElementById('mN'); if (nEl) M.n = nEl.value;
    var orbit = num(M.sb) + num(M.bb) + (M.bbante ? num(M.ante) : num(M.ante) * Math.max(2, num(M.n)));
    M.res = { m: orbit ? num(M.stack) / orbit : 0, bbs: num(M.bb) ? num(M.stack) / num(M.bb) : 0, orbit: orbit };
  }

  /* ---------- Fiche « avant la partie » ---------- */
  var F = { type: 'club', start: 20000, lvl: 20, bb1: 100, sel: {}, show: false };
  function embed() { try { return window.self !== window.top; } catch (e) { return true; } }
  function ficheForm() {
    var H = window.PA_HH, L = H ? H.opps() : [];
    return '<div class="card stack"><b>Préparer une partie</b>' +
      seg('ftype', [['club', 'Soirée au club'], ['mtt', 'Tournoi Winamax'], ['pko', 'PKO ou Space KO Winamax']], F.type) +
      field('Tapis de départ (jetons)', 'fS', F.start) + field('Grosse blinde au premier niveau', 'fB', F.bb1) + field('Durée des niveaux (minutes)', 'fL', F.lvl) +
      (L.length ? '<div class="small muted">Adversaires attendus</div><div class="seg">' + L.map(function (o) { return '<button class="' + (F.sel[o.id] ? 'on' : '') + '" data-tact="fsel" data-v="' + o.id + '">' + U().esc(o.name) + '</button>'; }).join('') + '</div>' : '<div class="small muted">Astuce : remplis le carnet des adversaires (Analyser › Adversaires) pour les retrouver ici.</div>') +
      '<button class="btn gold" data-tact="fgo">Préparer la fiche</button></div>';
  }
  function leakLines() {
    var H = window.PA_HH, out = [];
    if (H) {
      H.leaksFor().filter(function (l) { return l.n >= 2; }).slice(0, 3).forEach(function (l) { out.push(l.txt + ' (' + l.n + ' fois dans tes mains).'); });
      var S = H.statsAll();
      if (out.length < 3 && S && S.stealO >= 15 && S.steal / S.stealO < 0.25) out.push('Tu voles trop peu en CO, au bouton et en SB quand personne n’est entré : ouvre ta range de vol.');
      if (out.length < 3 && S && S.n >= 100 && (S.v - S.r) / S.n > 0.06) out.push('Tu paies plus que tu ne relances : entre plutôt en relançant.');
      if (out.length < 3 && S && S.bbDefO >= 10 && S.bbDef / S.bbDefO < 0.3) out.push('Défends davantage ta grosse blinde face aux vols : la cote est bonne.');
    }
    var def = ['Ouvre toute ta range en UTG, as-dame compris : c’est une ouverture obligatoire.', 'Défends ta grosse blinde face aux ouvertures à 2 BB : il ne te faut que 22 % d’équité.', 'Entre 20 et 40 BB, pas de petite sur-relance : tapis ou paye.'];
    for (var i = 0; out.length < 3 && i < def.length; i++) out.push(def[i]);
    return out;
  }
  function ficheView() {
    var p = PA.player(), prof = PA.PROFILES[p.profile || 'tag'], H = window.PA_HH;
    var bbs = num(F.start) / Math.max(1, num(F.bb1)), perH = F.type === 'club' ? 27 : 70, perL = Math.round(num(F.lvl) * perH / 60);
    var typeName = { club: 'Soirée au club', mtt: 'Tournoi Winamax', pko: 'PKO ou Space KO Winamax' }[F.type];
    var opps = H ? H.opps().filter(function (o) { return F.sel[o.id]; }) : [];
    var OPPI = {}; if (H) H.OPP.forEach(function (o) { OPPI[o[0]] = o; });
    var ch = function (pos) { var c = PA.chart(p.profile || 'tag', { type: 'open', pos: pos, bb: 60 }); return PA.pct(Object.keys(c).filter(function (h) { return c[h] !== 'fold'; })); };
    var phases = [
      ['Début (plus de 40 BB)', 'Ton profil ' + prof.short + ' ouvre environ ' + String(ch('UTG')).replace('.', ',') + ' % des mains en UTG et ' + String(ch('BTN')).replace('.', ',') + ' % au bouton, à ' + (p.settings.openSize === 'std' ? '2,2 à 2,5' : '2') + ' BB (3 BB depuis la SB). Mise pour la valeur contre les récréatifs, peu de bluffs.' + (F.type === 'club' ? ' Isole les limpers : 3 BB plus 1 BB par limper.' : '')],
      ['Milieu (20 à 40 BB, antes)', 'Avec l’ante, le pot de départ vaut 2,5 BB : vole et défends plus large. Ta sur-relance devient un tapis (resteal) contre les voleurs du CO et du bouton.'],
      ['Tapis court (moins de 15 BB)', 'Tapis ou fold avec les tables de Ma range. À 10 BB : bouton 48 %, SB 78 %. N’attends pas une vraie main.'],
      ['Bulle et places payées', 'Tapis moyen : resserre tes payes de tapis, pas tes tapis en premier. Gros tapis : attaque les tapis moyens à ta gauche. Après la bulle, paie un peu plus large.']];
    if (F.type === 'pko') phases.push(['Primes', 'Convertis la prime en jetons (Outils › Prime PKO) : elle baisse l’équité requise, mais seulement si tu couvres l’adversaire.']);
    var body = '<div class="stack"><button class="back" data-tact="fback">‹ Modifier</button><h1>Ma fiche</h1>' +
      '<div class="card stack"><b>' + typeName + ' · ' + new Date().toLocaleDateString('fr-FR') + '</b><div>Tapis de départ : ' + f0(num(F.start)) + ' jetons, soit <b>' + Math.round(bbs) + ' BB</b> au premier niveau. Profil : <b>' + prof.name + '</b>.</div>' +
      '<div>Environ <b>' + perL + ' mains par niveau</b> de ' + num(F.lvl) + ' minutes' + (F.type === 'club' ? ' : les blindes montent vite, vole et défends tôt.' : '.') + '</div></div>' +
      '<div class="card stack"><b>Plan par phase</b>' + phases.map(function (x) { return '<div><b>' + x[0] + '</b><br><span class="small">' + x[1] + '</span></div>'; }).join('') + '</div>' +
      '<div class="card stack"><b>Mes 3 fuites à surveiller</b><ol style="margin:0;padding-left:20px">' + leakLines().map(function (l) { return '<li>' + U().esc(l) + '</li>'; }).join('') + '</ol></div>' +
      (opps.length ? '<div class="card stack"><b>Adversaires attendus</b>' + opps.map(function (o) { var P = OPPI[o.prof] || ['', '?', '', '']; return '<div><b>' + U().esc(o.name) + '</b> · ' + P[1] + '<br><span class="small">' + P[3] + (o.note ? ' — ' + U().esc(o.note) : '') + '</span></div>'; }).join('') + '</div>' : '') +
      U().yo('Relis cette fiche juste avant de t’asseoir, puis oublie-la et joue. Après la partie, note deux ou trois mains pour la revue.') +
      (embed() ? '' : '<button class="btn gold" data-act="print">Imprimer ou enregistrer en PDF</button>') + '</div>';
    return U().shell('moi', body);
  }
  function ficheRoute() { return F.show ? ficheView() : U().shell('moi', '<div class="stack"><button class="back" data-act="nav" data-v="moi">‹ Moi</button><h1>Avant la partie</h1>' + U().yo('Deux minutes avant de jouer : ta structure, ton plan par phase, tes trois fuites à surveiller et les adversaires que tu vas croiser.') + ficheForm() + '</div>'); }

  function view() {
    var tabs = [['eq', 'Équité'], ['icm', 'ICM'], ['pko', 'Prime PKO'], ['m', 'Compteur de M']];
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Outils</h1>' +
      '<div class="seg">' + tabs.map(function (t) { return '<button class="' + (T.tab === t[0] ? 'on' : '') + '" data-tact="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      (T.tab === 'eq' ? eqTab() : T.tab === 'icm' ? icmTab() : T.tab === 'pko' ? pkoTab() : mTab()) + '</div>';
    return U().shell('apprendre', body);
  }
  function saveInputs() {
    // garde les valeurs tapées avant un changement d'onglet ou d'option
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : null; }, v;
    if ((v = g('icmS')) !== null) T.icm.stacks = v; if ((v = g('icmP')) !== null) T.icm.pays = v;
    ['pkS:start', 'pkP:prize', 'pkB:bounty', 'pkPot:pot', 'pkC:call'].forEach(function (x) { var a = x.split(':'), w = g(a[0]); if (w !== null) T.pko[a[1]] = w; });
    ['fS:start', 'fB:bb1', 'fL:lvl'].forEach(function (x) { var a = x.split(':'), w = g(a[0]); if (w !== null) F[a[1]] = w; });
    ['mS:stack', 'mSB:sb', 'mBB:bb', 'mA:ante', 'mN:n'].forEach(function (x) { var a = x.split(':'), w = g(a[0]); if (w !== null) T.m[a[1]] = w; });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tact]') : null; if (!t || t.disabled) return;
    var a = t.getAttribute('data-tact'), v = t.getAttribute('data-v');
    saveInputs();
    if (a === 'tab') T.tab = v;
    else if (a === 'slot') { T.cur = +v; T.rank = null; }
    else if (a === 'rank') T.rank = +v;
    else if (a === 'suit') {
      if (T.rank === null) return;
      T.slots[T.cur] = T.rank * 4 + (+v); T.rank = null; T.res = null;
      var order = T.vmode === 'hand' ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 1, 4, 5, 6, 7, 8];
      var k = order.indexOf(T.cur); for (var j = k + 1; j < order.length; j++) { if (T.slots[order[j]] === null) { T.cur = order[j]; break; } }
    }
    else if (a === 'clearSlot') { T.slots[T.cur] = null; T.res = null; }
    else if (a === 'resetEq') { T.slots = [null, null, null, null, null, null, null, null, null]; T.cur = 0; T.rank = null; T.res = null; }
    else if (a === 'set') {
      var k2 = t.getAttribute('data-k');
      if (k2 === 'vmode') { T.vmode = v; T.res = null; if (v === 'range' && (T.cur === 2 || T.cur === 3)) T.cur = 4; }
      else if (k2 === 'vrk') { T.vr.kind = v; if (v === 'push' && !PA.D.pushfold['10'].push[T.vr.pos]) T.vr.pos = 'BTN'; T.res = null; }
      else if (k2 === 'vrp') { T.vr.pos = v; T.res = null; }
      else if (k2 === 'vrb') { T.vr.bb = +v; T.res = null; }
      else if (k2 === 'bbante') { T.m.bbante = v === 'true'; T.m.res = null; }
      else if (k2 === 'ftype') { F.type = v; if (v === 'club') { F.lvl = 20; } else { F.lvl = 10; } }
    }
    else if (a === 'calcEq') { T.res = computeEq(); }
    else if (a === 'fsel') { F.sel[v] = !F.sel[v]; }
    else if (a === 'fgo') { F.show = true; window.scrollTo(0, 0); }
    else if (a === 'fback') { F.show = false; }
    else if (a === 'calcIcm') calcIcm();
    else if (a === 'calcPko') calcPko();
    else if (a === 'calcM') calcM();
    U().render();
  });
  window.PA_TOOLS = { view: view, fiche: ficheRoute, _eq: function (slots, mode, vr) { T.slots = slots; T.vmode = mode || 'hand'; if (vr) T.vr = vr; return computeEq(); } };
})();
