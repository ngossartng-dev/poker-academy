/* Poker Academy — « Pose ta question à Yo » : une question en français (tapée ou dictée) → la main, la position,
   le nombre d'adversaires, le board et sa texture → check ou quelle taille, avec la raison.
   Les réponses suivent les repères du club (taille.js, chapitres 20, 21, 25 et 28) ; contre un seul adversaire,
   le solveur de l'appli donne en plus sa réponse. Tout fonctionne hors ligne. */
(function () {
  'use strict';
  var RK = 'AKQJT98765432', SUITS = ['s', 'h', 'd', 'c'], SU = { s: '♠', h: '♥', d: '♦', c: '♣' };
  var RV = { A: 14, K: 13, Q: 12, J: 11, T: 10, 9: 9, 8: 8, 7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2 };
  var RNAME = { A: 'as', K: 'roi', Q: 'dame', J: 'valet', T: '10', 9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2' };
  var RPL = { A: 'as', K: 'rois', Q: 'dames', J: 'valets', T: '10', 9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2' };
  var RW = { as: 'A', ace: 'A', roi: 'K', rois: 'K', king: 'K', dame: 'Q', dames: 'Q', reine: 'Q', valet: 'J', valets: 'J', dix: 'T', 10: 'T', neuf: '9', huit: '8', sept: '7', six: '6', cinq: '5', quatre: '4', trois: '3', deux: '2' };
  var SW = { coeur: 'h', coeurs: 'h', carreau: 'd', carreaux: 'd', pique: 's', piques: 's', trefle: 'c', trefles: 'c' };
  var PNAME = { UTG: 'UTG', 'UTG+1': 'UTG+1', MP: 'milieu de table', LJ: 'lojack', HJ: 'hijack', CO: 'cut-off', BTN: 'bouton', SB: 'petite blinde', BB: 'grosse blinde' };
  var POSW = [
    [/\b(bouton|btn|button|dealer)\b/, 'BTN'], [/\b(cut ?off|cutoff|co)\b/, 'CO'], [/\b(hijack|hj|high ?jack)\b/, 'HJ'], [/\b(lojack|lo ?jack|lj)\b/, 'LJ'],
    [/\b(utg ?\+ ?1|utg1|utg plus un)\b/, 'UTG+1'], [/\b(utg|under the gun|debut de parole|premier de parole|premiere position)\b/, 'UTG'],
    [/\b(milieu de table|milieu de parole|mp|middle)\b/, 'MP'], [/\b(petite blinde|sb|small blind|small)\b/, 'SB'], [/\b(grosse blinde|grande blinde|bb|big blind)\b/, 'BB']];
  var TEXN = { sec: 'board sec', paire: 'board pairé', mono: 'board de trois cartes de la même couleur', mouille: 'board connecté, à tirages', bas: 'board bas et connecté' };
  var CATN = { monstre: 'très grosse main', forte: 'main forte', moyenne: 'main moyenne', tirage: 'tirage', ventral: 'tirage ventral', rien: 'rien' };
  var SZN = { tiers: 'un tiers du pot', moitie: 'la moitié du pot', troisq: 'trois quarts du pot', pot: 'la taille du pot' };
  var SZF = { tiers: 1 / 3, moitie: 0.5, troisq: 0.75, pot: 1 };

  function U() { return window.PA_UI; }
  function norm(s) {
    s = String(s || '').replace(/♠/g, ' pique ').replace(/♥/g, ' coeur ').replace(/♦/g, ' carreau ').replace(/♣/g, ' trefle ');
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/[’'`]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function f1(x) { return String(Math.round(x * 2) / 2).replace('.', ','); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function rv(r) { return RV[r] || 0; }

  /* ---------- 1. Lire la question ---------- */
  // un « jeton » de carte : rang (A..2), couleur éventuelle
  function rankOf(w) {
    if (RW[w]) return RW[w];
    if (/^([2-9])$/.test(w)) return w;
    return null;
  }
  // « ks7d2c », « ak », « aks », « ako », « a10 », « 88 », « 752 »
  function compact(w) {
    var m = /^((?:10|[akqjt2-9]))((?:10|[akqjt2-9]))(s|o|off|suited)?$/.exec(w);
    if (m && w !== 'as' && w !== 'co') { var a = m[1] === '10' ? 'T' : m[1].toUpperCase(), b = m[2] === '10' ? 'T' : m[2].toUpperCase(); return { cards: [{ r: a }, { r: b }], suited: m[3] ? (m[3] === 's' || m[3] === 'suited') : null }; }
    var out = [], re = /(10|[akqjt2-9])([shdc])/g, k, used = 0;
    while ((k = re.exec(w))) { out.push({ r: k[1] === '10' ? 'T' : k[1].toUpperCase(), s: k[2] }); used += k[0].length; }
    if (out.length >= 2 && used === w.length) return { cards: out, suited: null };
    if (/^[2-9akqjt]{3,5}$/.test(w) && /\d/.test(w)) return { cards: w.split('').map(function (c) { return { r: c.toUpperCase() }; }), suited: null };
    return null;
  }
  function tokens(n) { return n.replace(/[,;:\/\.!?()\[\]"]/g, ' ').replace(/-/g, ' ').split(' ').filter(Boolean); }
  // lit des cartes à partir de l'indice i : renvoie {cards, end}
  function readCards(tk, i, max, allowLetters) {
    var cards = [], j = i, last = i;
    while (j < tk.length && cards.length < max) {
      var w = tk[j];
      if (w === 'de' || w === 'd' || w === 'et' || w === 'un' || w === 'une' || w === 'le' || w === 'la' || w === 'les') { if (!cards.length && j - i > 2) break; j++; continue; }
      if (SW[w]) { if (cards.length && !cards[cards.length - 1].s) cards[cards.length - 1].s = SW[w]; j++; last = j; continue; }
      var r = rankOf(w);
      if (r && w === 'as' && (tk[j - 1] === 'tu' || tk[j - 1] === 't')) r = null;
      if (r) { cards.push({ r: r }); j++; last = j; continue; }
      if (w === '10') { cards.push({ r: 'T' }); j++; last = j; continue; }
      var c = compact(w);
      if (c) { c.cards.forEach(function (x) { if (cards.length < max) cards.push(x); }); j++; last = j; continue; }
      if (allowLetters && /^[akqjt]$/.test(w) && !(w === 'j' && tk[j + 1] === 'ai')) { cards.push({ r: w.toUpperCase() }); j++; last = j; continue; }
      break;
    }
    return { cards: cards, end: last };
  }

  function parse(text) {
    var n = ' ' + norm(text).replace(/(\S)-(\S)/g, '$1 $2') + ' ', Q = { raw: text, hand: null, hi: null, suited: null, pocket: false, board: [], turn: null, river: null, tex: null, twoTone: null, street: null, opps: null, role: null, pos: null, vpos: null, ip: null, face: null, faceSz: null, line: null, cat: null, catWord: null, stack: null, pot: null, opener: null, threeBet: false, notes: [] };

    // tailles et tapis
    var m;
    if ((m = /\bpot (?:de |fait |a )?(\d+(?:[.,]\d+)?) ?(?:bb|blindes|grosses blindes)?\b/.exec(n))) Q.pot = parseFloat(m[1].replace(',', '.'));
    if ((m = /\b(?:a|avec|tapis de|stack de|il me reste|j ai|reste|tapis)\s+(\d+)\s?(?:bb|blindes|grosses blindes|big)\b/.exec(n))) Q.stack = parseInt(m[1], 10);
    else if ((m = /\b(\d+)\s?(?:bb|blindes) (?:de tapis|de stack|derriere|effectives?)\b/.exec(n))) Q.stack = parseInt(m[1], 10);

    // nombre d'adversaires
    var NUM = { un: 1, une: 1, 1: 1, deux: 2, 2: 2, trois: 3, 3: 3, quatre: 4, 4: 4, cinq: 5, 5: 5, plusieurs: 3 };
    if ((m = /\b(un|une|1|deux|2|trois|3|quatre|4|cinq|5|plusieurs)(?: ou (?:deux|2|trois|3|plus))? (?:joueurs?|adversaires?|personnes?|mecs?|gars|vilains?)\b/.exec(n))) { Q.opps = NUM[m[1]]; n = n.replace(m[0], ' '); }
    else if ((m = /\ba (deux|2|trois|3|quatre|4|cinq|5)\b(?! ?bb)(?! ?blindes)/.exec(n))) { Q.opps = NUM[m[1]] - 1; n = n.replace(m[0], ' '); }
    if (/\b(multiway|multi way|multi|a plusieurs|pot a plusieurs)\b/.test(n)) Q.opps = Math.max(Q.opps || 0, 2);
    if (/\b(tete a tete|heads? ?up|hu|un seul adversaire|seul contre|un contre un)\b/.test(n)) Q.opps = 1;

    // rue et board
    var tk = tokens(n), bi = -1, i;
    for (i = 0; i < tk.length; i++) if (/^(flop|board|tableau|flops)$/.test(tk[i])) { bi = i; break; }
    var bdEnd = -1, bdStart = -1;
    if (bi >= 0) {
      var j = bi + 1;
      while (j < tk.length && /^(tombe|tombent|est|fait|c|vient|arrive|de|du|en|sur|un|une|le|la|avec|qui|:|=)$/.test(tk[j])) j++;
      var rc = readCards(tk, j, 5, true);
      if (rc.cards.length >= 3) { Q.board = rc.cards.slice(0, 3); if (rc.cards.length >= 4) Q.turn = rc.cards[3]; if (rc.cards.length >= 5) Q.river = rc.cards[4]; bdStart = j; bdEnd = rc.end; }
    }
    if (!Q.board.length) {
      for (i = 0; i < tk.length; i++) if (tk[i] === 'sur') {
        var j2 = i + 1; while (j2 < tk.length && /^(un|une|le|la|du|board|flop)$/.test(tk[j2])) j2++;
        var rc2 = readCards(tk, j2, 5, false); if (rc2.cards.length >= 3) { Q.board = rc2.cards.slice(0, 3); if (rc2.cards.length >= 4) Q.turn = rc2.cards[3]; if (rc2.cards.length >= 5) Q.river = rc2.cards[4]; bdStart = j2; bdEnd = rc2.end; break; }
      }
    }
    for (i = 0; i < tk.length; i++) {
      if (/^(turn|tournant)$/.test(tk[i])) { if (!Q.street || Q.street === 'flop') Q.street = 'turn'; var t1 = readCards(tk, i + 1 + (/^(est|tombe|c|un|une|le|la|:)$/.test(tk[i + 1] || '') ? 1 : 0), 1, true); if (t1.cards.length && !Q.turn) Q.turn = t1.cards[0]; }
      if (/^(river|riviere)$/.test(tk[i])) { Q.street = 'river'; var t2 = readCards(tk, i + 1 + (/^(est|tombe|c|un|une|le|la|:)$/.test(tk[i + 1] || '') ? 1 : 0), 1, true); if (t2.cards.length && !Q.river) Q.river = t2.cards[0]; }
    }
    if (!Q.street) Q.street = Q.river ? 'river' : Q.turn ? 'turn' : (Q.board.length || /\b(flop|board|c ?bet|continuation|donk|check raise|checkraise)\b/.test(n)) ? 'flop' : null;
    Q._n = n;

    // texture dite
    if (/\b(flop|board|tableau)( est| tombe| qui tombe)?( un| une)? (pere|paire|paired|appaire|apaire|double)\b|\b(pere|paire|appaire) (flop|board)\b|\b(board|flop) (avec une )?paire\b/.test(n)) Q.tex = 'paire';
    if (/\b(monocouleur|mono|monotone|trois (coeurs|piques|carreaux|trefles|cartes de la meme couleur))\b/.test(n)) Q.tex = 'mono';
    else if (/\b(mouille|humide|a tirages|plein de tirages|connecte|coordonne|wet|dynamique)\b/.test(n)) Q.tex = Q.tex || 'mouille';
    else if (/\b(bas et connecte|petit et connecte)\b/.test(n)) Q.tex = 'bas';
    else if (/\b(sec|dry|statique|arc en ciel|rainbow)\b/.test(n)) Q.tex = Q.tex || 'sec';
    if (/\b(deux (coeurs|piques|carreaux|trefles)|bicolore|deux couleurs|two ?tone|deux cartes de la meme couleur)\b/.test(n)) Q.twoTone = true;
    if (/\b(arc en ciel|rainbow|trois couleurs differentes)\b/.test(n)) Q.twoTone = false;

    // positions
    var heroPre = /(?:je suis|j ouvre|j ai ouvert|je relance|j ai relance|je paie|je paye|j ai paye|j ai suivi|je suis|moi|depuis|au|en|du|de la|position)\s+(?:la |le )?$/;
    POSW.forEach(function (pw) {
      var re = new RegExp(pw[0].source, 'g'), k;
      while ((k = re.exec(n))) {
        var before = n.slice(Math.max(0, k.index - 22), k.index);
        if (pw[1] === 'BB' && /\d\s?$/.test(before)) continue; // « 2 bb » = unité
        if (/\b(par|contre|face a|face au|face a la|vs|versus)\s+(?:la |le |l )?$/.test(before) || /\b(le|la|l)\s+$/.test(before) && !/\b(je suis|depuis|de)\s+(le|la)\s+$/.test(before)) { if (!Q.vpos) Q.vpos = pw[1]; Q._vlist = (Q._vlist || []).concat(pw[1]); }
        else if (heroPre.test(before) || /\b(je suis|en|au|du|depuis)\s+$/.test(before)) { if (!Q.pos) Q.pos = pw[1]; }
        else if (!Q.pos && !Q.vpos) Q._loose = pw[1];
      }
    });
    if (!Q.pos && Q._loose && !(Q._vlist || []).length) Q.pos = Q._loose;
    if (/\b(en position|ip|je parle (en )?dernier|je parle apres)\b/.test(n) && !/hors de position/.test(n)) Q.ip = true;
    if (/\b(hors de position|oop|je parle (en )?premier|je suis le premier a parler|premier a parler)\b/.test(n)) Q.ip = false;

    // rôle avant le flop
    if (/\b(j ai (ouvert|relance|raise|open|mise avant)|j ouvre|je relance|j open|je raise|je suis le relanceur|relanceur|ma relance|on me paie|on m a paye|paye par|payee? par|suivi par|call par|ont paye|il paie|il paye|elle paie|elle paye|ils paient|me paie|me paye|ma relance est payee)\b/.test(n)) Q.role = 'raiser';
    if (/\b(j ai (paye|suivi|call|complete)|je paie|je paye|je suis|je call|je defends|j ai defendu|en defense|je defend)\b/.test(n.replace(/je suis (au|en|du|le|la|sur|hors|premier|dernier)/g, ''))) Q.role = Q.role === 'raiser' && /\b(paye par|payee? par|me paie|me paye|on me paie)\b/.test(n) ? 'raiser' : 'caller';
    if (/\b(3 ?bet|trois bet|3bet|sur ?relance|surrelance|re ?relance)\b/.test(n)) Q.threeBet = true;
    if ((m = /\b(?:le|la|l)\s+(bouton|cut ?off|co|hijack|hj|utg|petite blinde|sb|milieu de table|lojack)\s+(?:ouvre|a ouvert|relance|a relance|raise|open|mise|a mise)\b/.exec(n))) { POSW.forEach(function (pw) { if (pw[0].test(m[1])) Q.opener = pw[1]; }); }
    if (/\b(face a une relance|il ouvre|il a ouvert|quelqu un ouvre|un joueur ouvre|on ouvre|ouverture devant|relance devant)\b/.test(n)) Q.opener = Q.opener || '?';

    // action de l'adversaire
    if (/\b(il|elle|on|adversaire|vilain|il me|on me|la grosse blinde|le bouton|il nous)\s+(?:me\s+)?(mise|bet|a mise|donk|donke|lead|ouvre la parole|envoie|balance)\b/.test(n) || /\bface a (une|sa) mise\b/.test(n) || /\bon me mise\b/.test(n)) Q.face = 'bet';
    if (/\b(check ?raise|checkraise|il relance ma mise|il me relance|il relance|relance ma c ?bet|me check ?raise)\b/.test(n) && Q.street) Q.face = 'raise';
    if (/\b(il|elle|on)\s+(?:me\s+|nous\s+)?(fait|met|pousse|envoie|a fait|a mis)\s+(tapis|all ?in|tout|a tapis)\b|\b(il shove|il part a tapis|il est a tapis|all in)\b/.test(n)) Q.face = 'shove';
    if (/\b(il|elle|tout le monde|ils|la grosse blinde|le bouton|on)\s+(checke?|check|a checke|ont checke|checkent)\b|\bcheck vers moi\b|\bchecke vers moi\b/.test(n) && !Q.face) Q.face = 'check';
    if (Q.face === 'bet' || Q.face === 'raise') {
      if (/\b(un tiers|1 ?3|un quart|1 ?4|33 ?%?|25 ?%?|petite mise|petit bet|mini)\b/.test(n)) Q.faceSz = 'tiers';
      else if (/\b(moitie|demi|1 ?2|50 ?%?|half)\b/.test(n)) Q.faceSz = 'moitie';
      else if (/\b(deux tiers|2 ?3|trois quarts|3 ?4|66 ?%?|70 ?%?|75 ?%?|grosse mise)\b/.test(n)) Q.faceSz = 'troisq';
      else if (/\b(taille du pot|pot size|mise pot|la taille du pot|100 ?%?|overbet|surmise)\b/.test(n)) Q.faceSz = 'pot';
      else if ((m = /\b(?:mise|bet|a mise|donk)\s+(\d+(?:[.,]\d+)?)\s?(?:bb|blindes)?\b/.exec(n)) && Q.pot) { var rt = parseFloat(m[1].replace(',', '.')) / Q.pot; Q.faceSz = rt < 0.42 ? 'tiers' : rt < 0.62 ? 'moitie' : rt < 0.88 ? 'troisq' : 'pot'; }
    }
    // la ligne d'avant (turn, river)
    if (/\b(j ai (mise|c ?bet|cbet|continue) au flop|c ?bet au flop|mise au flop et il a paye|il a paye (ma|mon) (mise|c ?bet)|j ai mise flop|j ai mise au flop et a la turn|mise flop et turn)\b/.test(n)) Q.line = 'bet';
    if (/\b(flop (a ete )?checke|check check|checke des deux cotes|tout le monde a checke au flop|on a checke le flop|flop check)\b/.test(n)) Q.line = 'checked';

    // ce que tu as touché (mots)
    var CW = [
      [/\b(brelan|set|trips|double paire|deux paires|two pair|quinte (faite|max)?|couleur (faite|max)|full|carre|nuts)\b/, 'monstre'],
      [/\b(top paire|paire max|top pair|overpaire|over paire|sur paire|surpaire|overpair)\b/, 'forte'],
      [/\b(deuxieme paire|seconde paire|paire du milieu|middle pair|paire moyenne|petite paire|troisieme paire|bottom pair|paire du bas|sous paire|underpair|under pair|top paire (petit|mauvais|faible) kicker)\b/, 'moyenne'],
      [/\b(ventral|gutshot|gut shot|tirage interieur)\b/, 'ventral'],
      [/\b(tirage couleur|tirage quinte|bilateral|par les deux bouts|open ended|draw|tirage)\b/, 'tirage'],
      [/\b(rate|loupe|manque|rien touche|pas touche|rien|air|hauteur|air ball|whiff|j ai rate|touche rien)\b/, 'rien']];
    for (i = 0; i < CW.length; i++) if (CW[i][0].test(n)) { Q.catWord = CW[i][1]; break; }
    if (/top paire (petit|mauvais|faible) kicker/.test(n)) Q.catWord = 'moyenne';

    // la main
    var tk2 = tk.slice();
    if (bdStart >= 0) for (i = bdStart; i < bdEnd; i++) tk2[i] = '§';
    var hn = tk2.join(' ');
    if (/\b(paire servie|pocket|paire en main|paire de depart|une paire avant le flop|paire pre ?flop)\b/.test(hn) || /\bpaire (?:servie )?(?:de|d) (as|rois?|dames?|valets?|dix|10|neuf|huit|sept|six|cinq|quatre|trois|deux|[2-9])\b/.test(hn)) {
      Q.pocket = true;
      if ((m = /\bpaire (?:servie )?(?:de|d) (as|rois?|dames?|valets?|dix|10|neuf|huit|sept|six|cinq|quatre|trois|deux|[2-9])\b/.exec(hn))) { var pr = rankOf(m[1]) || (m[1] === '10' ? 'T' : null); if (pr) Q.hand = [{ r: pr }, { r: pr }]; }
    }
    if ((m = /\b(?:hauteur|haut) (as|roi|dame|valet)\b|\b(as|roi|dame|valet) hauteur\b/.exec(hn)) && !Q.hand) {
      Q.hi = rankOf(m[1] || m[2]);
      // « hauteur as, kicker roi » / « as roi »
      var km = /\bkicker (as|roi|dame|valet|dix|10|neuf|huit|sept|six|cinq|quatre|trois|deux|[2-9])\b/.exec(hn);
      if (km) { Q.hand = [{ r: Q.hi }, { r: rankOf(km[1]) || 'T' }]; }
    }
    if (!Q.hand) {
      for (i = 0; i < tk2.length; i++) {
        var w = tk2[i]; if (w === '§') continue;
        if (/^(j|ai|avec|main|en|jai|tient|tiens|recu|touche|de|j ai)$/.test(w)) continue;
        var hc = compact(w);
        if (hc && hc.cards.length === 2 && (/[akqjt]/.test(w) || hc.cards[0].r === hc.cards[1].r || /[shdc]/.test(w))) { Q.hand = hc.cards; if (hc.suited !== null) Q.suited = hc.suited; break; }
        var dig = /^([2-9]|10)$/.test(w) && rankOf(tk2[i + 1] || '') !== null || /^([2-9]|10)$/.test(w) && /^([2-9]|10)$/.test(tk2[i + 1] || '');
        if (dig && !/^(avec|ai|main|jai|tiens|recu|servie|en|des|deux|paire)$/.test(tk2[i - 1] || '')) dig = false;
        if (dig || RW[w] && w !== 'deux' && w !== 'trois' && w !== 'quatre' && w !== 'cinq' && w !== 'six' || (RW[w] && /^(as|roi|dame|valet|dix)$/.test(tk2[i + 1] || ''))) {
          if (w === 'as' && (tk2[i - 1] === 'tu' || tk2[i - 1] === 't')) continue;
          var rh = readCards(tk2, i, 2, false);
          if (rh.cards.length === 2) { Q.hand = rh.cards; break; }
          if (rh.cards.length === 1 && w === 'as' && !Q.hi) { /* « un as » seul */ }
        }
      }
    }
    if (Q.hand && Q.hand.length === 2 && Q.hand[0].r === Q.hand[1].r) Q.pocket = true;
    if (/\b(assortis?|assortie|suited|de la meme couleur|meme couleur|couleur assortie)\b/.test(hn) && !/\b(trois cartes de la meme couleur|deux cartes de la meme couleur)\b/.test(hn)) Q.suited = true;
    if (/\b(depareilles?|depareillee|off ?suit|offsuit|non assortis?|pas assortis?|off)\b/.test(hn)) Q.suited = false;
    if (Q.hand && Q.hand[0].s && Q.hand[1].s) Q.suited = Q.hand[0].s === Q.hand[1].s;
    if (Q.hand && rv(Q.hand[1].r) > rv(Q.hand[0].r)) Q.hand = [Q.hand[1], Q.hand[0]];
    if (!Q.hi && Q.hand) Q.hi = Q.hand[0].r;
    if (!Q.street && (Q.catWord || Q.face || Q.tex) && !/\b(ouvr|j ouvre|preflop|pre flop|avant le flop)/.test(n)) Q.street = 'flop';
    delete Q._n;
    Q.vcount = (Q._vlist || []).filter(function (x, i, a) { return a.indexOf(x) === i; }).length;
    delete Q._loose; delete Q._vlist;
    return Q;
  }

  /* ---------- 2. Compléter : texture, main faite, position ---------- */
  function boardAll(Q) { var b = Q.board.slice(); if (Q.street !== 'flop' && Q.turn) b.push(Q.turn); if (Q.street === 'river' && Q.river) b.push(Q.river); return b; }
  function texOf(Q) {
    if (Q.board.length < 3) return Q.tex;
    var b = Q.board, r = b.map(function (c) { return rv(c.r); }).sort(function (x, y) { return y - x; });
    if (r[0] === r[1] || r[1] === r[2]) return 'paire';
    var su = {}, known = b.every(function (c) { return c.s; });
    if (known) b.forEach(function (c) { su[c.s] = (su[c.s] || 0) + 1; });
    var mx = known ? Math.max.apply(null, Object.keys(su).map(function (k) { return su[k]; })) : (Q.tex === 'mono' ? 3 : Q.twoTone ? 2 : 1);
    if (mx === 3) return 'mono';
    var lowR = r.map(function (x) { return x === 14 ? 1 : x; }).sort(function (x, y) { return y - x; });
    var span = Math.min(r[0] - r[2], lowR[0] - lowR[2]);
    var near = (r[0] - r[1] <= 2) || (r[1] - r[2] <= 2);
    var conn = (r[0] - r[1] <= 1) || (r[1] - r[2] <= 1);
    if (span <= 4) return r[0] <= 9 ? 'bas' : 'mouille';
    if (r[0] <= 9 && conn) return 'bas';
    if (r[0] >= 10 && (r[1] >= 8) && near && (mx === 2 || conn)) return 'mouille';
    if (mx === 2 && near && r[1] >= 6) return 'mouille';
    return 'sec';
  }
  function texDesc(Q, tex) {
    if (tex !== 'sec' || Q.board.length < 3) return TEXN[tex];
    var top = Q.board.map(function (c) { return rv(c.r); }).sort(function (x, y) { return y - x; })[0];
    return top >= 12 ? 'board sec avec une carte haute' : top >= 10 ? 'board sec' : 'board sec et bas';
  }
  // main faite par tes deux cartes
  function made(hand, board) {
    if (!hand || hand.length < 2 || board.length < 3) return null;
    var hr = hand.map(function (c) { return rv(c.r); }), br = board.map(function (c) { return rv(c.r); }).sort(function (x, y) { return y - x; });
    var all = hr.concat(br), cnt = {};
    all.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; });
    var bcnt = {}; br.forEach(function (x) { bcnt[x] = (bcnt[x] || 0) + 1; });
    var top = br[0], pocket = hr[0] === hr[1];
    // couleur et tirage couleur (si les couleurs sont connues)
    var suitsKnown = hand.every(function (c) { return c.s; }) && board.every(function (c) { return c.s; });
    var fl = false, fd = false;
    if (suitsKnown) {
      SUITS.forEach(function (s) {
        var h = hand.filter(function (c) { return c.s === s; }).length, b = board.filter(function (c) { return c.s === s; }).length;
        if (h >= 1 && h + b >= 5) fl = true; else if (h >= 1 && h + b === 4 && board.length < 5) fd = true;
      });
    }
    // quintes
    var set = {}; all.forEach(function (x) { set[x] = 1; if (x === 14) set[1] = 1; });
    var hset = {}; hr.forEach(function (x) { hset[x] = 1; if (x === 14) hset[1] = 1; });
    var straight = false, oesd = false, gut = false, lo;
    for (lo = 1; lo <= 10; lo++) {
      var have = 0, useHole = false, miss = [];
      for (var k = lo; k < lo + 5; k++) { if (set[k]) { have++; if (hset[k] && !(br.indexOf(k === 1 ? 14 : k) >= 0)) useHole = true; } else miss.push(k); }
      if (have === 5 && useHole) straight = true;
      if (have === 4 && useHole && board.length < 5) { if (miss[0] === lo || miss[0] === lo + 4) oesd = true; else gut = true; }
    }
    if (oesd && gut) { /* double ventral ≈ bilatéral */ }
    var hiHit = hr.filter(function (x) { return bcnt[x]; });
    var trips = hr.some(function (x) { return cnt[x] >= 3 && (pocket || bcnt[x] >= 2); });
    var twoPair = !pocket && hr[0] !== hr[1] && bcnt[hr[0]] && bcnt[hr[1]];
    var boardPaired = Object.keys(bcnt).some(function (x) { return bcnt[x] >= 2; });
    var full = (pocket && bcnt[hr[0]] && boardPaired) || (trips && boardPaired && hiHit.length && Object.keys(bcnt).filter(function (x) { return bcnt[x] >= 2; }).length >= 1 && hr.some(function (x) { return bcnt[x] === 1; }));
    var res = { cat: 'rien', what: '', draw: fd ? 'flush' : oesd ? 'oesd' : gut ? 'gut' : null, overs: hr.filter(function (x) { return x > top; }).length };
    if (fl) { res.cat = 'monstre'; res.what = 'couleur'; return res; }
    if (straight) { res.cat = 'monstre'; res.what = 'quinte'; return res; }
    if (full) { res.cat = 'monstre'; res.what = 'full'; return res; }
    if (pocket && bcnt[hr[0]] >= 1) { res.cat = 'monstre'; res.what = 'brelan de ' + RPL[hand[0].r] + ' (set)'; return res; }
    if (trips) { res.cat = 'monstre'; res.what = 'brelan'; return res; }
    if (twoPair) { res.cat = 'monstre'; res.what = 'deux paires'; return res; }
    if (pocket) {
      if (hr[0] > top) { res.cat = 'forte'; res.what = 'overpaire (paire de ' + RPL[hand[0].r] + ' au-dessus du board)'; }
      else { res.cat = 'moyenne'; res.what = 'paire de ' + RPL[hand[0].r] + (hr[0] < br[br.length - 1] ? ', sous tout le board' : ', sous la carte haute du board'); }
    } else if (hiHit.length) {
      var p = hiHit[0], kick = hr[0] === p ? hr[1] : hr[0];
      if (p === top) {
        if (kick >= 10 || boardPaired && kick >= 10) { res.cat = 'forte'; res.what = 'top paire, kicker ' + RNAME[kickR(hand, p)]; }
        else { res.cat = 'moyenne'; res.what = 'top paire, petit kicker (' + RNAME[kickR(hand, p)] + ')'; }
      } else if (boardPaired && bcnt[p] >= 1 && br.filter(function (x) { return x === p; }).length === 1 && Object.keys(bcnt).length === 2) {
        res.cat = 'moyenne'; res.what = 'deux paires grâce au board, kicker faible';
      } else { res.cat = 'moyenne'; res.what = p === br[1] ? 'deuxième paire' : 'petite paire (troisième paire)'; }
    }
    if (res.cat === 'rien') {
      if (fd && oesd) { res.cat = 'tirage'; res.what = 'gros tirage : couleur et quinte'; }
      else if (fd) { res.cat = 'tirage'; res.what = 'tirage couleur'; }
      else if (oesd) { res.cat = 'tirage'; res.what = 'tirage quinte par les deux bouts'; }
      else if (gut) { res.cat = 'ventral'; res.what = 'tirage quinte ventral (4 outs)'; }
      else res.what = res.overs === 2 ? 'rien, deux cartes au-dessus du board' : (hr[0] === 14 ? 'rien, hauteur as' : 'rien');
    } else if (res.draw && res.cat === 'moyenne') res.what += (res.draw === 'flush' ? ' + tirage couleur' : res.draw === 'oesd' ? ' + tirage quinte' : '');
    return res;
  }
  function kickR(hand, pv) { var o = hand.filter(function (c) { return rv(c.r) !== pv; })[0] || hand[1]; return o.r; }

  function complete(Q, ov) {
    var A = JSON.parse(JSON.stringify(Q)); ov = ov || {};
    Object.keys(ov).forEach(function (k) { A[k] = ov[k]; });
    A.assumed = {};
    if (A.board.length >= 3 && !ov.tex) A.tex = texOf(A);
    if (A.board.length < 3 && !A.tex && A.street && A.street !== 'pre') A.assumed.tex = true;
    // la position et le rôle
    if (!A.street && (A.hand || A.pocket) && (A.pos || A.opener)) A.street = 'pre';
    if (!A.role) { A.role = (A.pos === 'BB' && A.street !== 'pre') ? 'caller' : 'raiser'; A.assumed.role = true; }
    if (A.opps == null) { if (A.vcount >= 2) A.opps = A.vcount; else { A.opps = 1; A.assumed.opps = true; } }
    if (A.ip == null) {
      if (A.pos === 'BB') A.ip = A.vpos === 'SB';
      else if (A.pos === 'SB') A.ip = false;
      else if (A.role === 'caller') A.ip = !(A.vpos === 'BTN' && A.pos !== 'BTN');
      else A.ip = A.opps >= 2 ? (A.pos === 'BTN') : true;
      if (A.face === 'check' && A.role === 'raiser') A.ip = true;
      A.assumed.ip = !A.pos;
    }
    if (A.street && A.street !== 'pre' && !A.face) { A.face = (A.role === 'raiser' && A.ip) ? 'check' : 'none'; A.assumed.face = true; }
    if (A.street === 'flop' && !A.tex && !A.board.length && (A.face === 'bet' || A.face === 'raise' || A.face === 'shove')) { A.tex = 'sec'; A.assumed.tex = true; }
    if ((A.face === 'bet' || A.face === 'raise') && !A.faceSz) { A.faceSz = 'moitie'; A.assumed.faceSz = true; }
    // main faite
    var mk = made(A.hand, boardAll(A));
    if (mk && !ov.cat) { A.cat = mk.cat; A.what = mk.what; A.overs = mk.overs; A.draw = mk.draw; }
    else if (!A.cat) { A.cat = A.catWord; A.what = A.catWord ? CATN[A.catWord] : ''; }
    if (!A.pot) A.pot = A.street === 'river' ? 20 : A.street === 'turn' ? 10 : 6 + 2 * (A.opps - 1);
    return A;
  }

  /* ---------- 3. La réponse du club ---------- */
  var TL = function () { return window.PA_TAILLE; };
  function sizeTxt(a, pot) {
    var P = { petit: [0.25, 0.35, 'Petite mise : 25 à 35 % du pot'], moitie: [0.5, 0.66, 'Mise moyenne : 50 à 66 % du pot'], gros: [0.66, 0.75, 'Grosse mise : 66 à 75 % du pot'], moyen: [0.5, 0.66, 'Mise moyenne : 50 à 66 % du pot'], surmise: [1, 1.25, 'Surmise : 100 à 125 % du pot'], petitR: [0.25, 0.4, 'Petite mise : 25 à 40 % du pot'], block: [0.2, 0.33, 'Mise de blocage : 20 à 33 % du pot'] }[a];
    if (!P) return null;
    return P[2] + ' (' + f1(pot * P[0]) + ' à ' + f1(pot * P[1]) + ' BB dans un pot de ' + f1(pot) + ' BB)';
  }
  function verdict(A) {
    // renvoie {act, label, why, ch, alt:[{if, label, why}]}
    var T = TL(); if (!T) return null;
    var tex = A.tex, wet = tex === 'mouille' || tex === 'bas', c = A.cat, out;
    var TT = { sec: 'board sec et haut', paire: 'board pairé', mono: 'board de trois cartes de la même couleur', mouille: 'board connecté, à tirages', bas: 'board bas et connecté' };
    function fix(why) { return why.replace(TT[tex] || '§§', texDesc(A, tex)); }
    function lab(a) { return a === 'check' ? 'Check' : a === 'fold' ? 'Se coucher' : a === 'call' ? 'Payer' : a === 'raise' ? 'Relancer' : a === 'crs' ? 'Relancer 2,2 à 2,5 fois sa mise' : a === 'crb' ? 'Relancer 3 à 4 fois sa mise' : sizeTxt(a, A.pot); }
    if (A.street === 'pre') return preVerdict(A);
    if (!c) return null;
    var c2 = c === 'ventral' ? 'rien' : c;
    if (A.street === 'flop' || !A.street) {
      if (A.face === 'shove') return shoveVerdict(A);
      if (A.face === 'raise') {
        if (c === 'monstre') return { act: 'allin', label: 'Relancer ou tapis', why: 'Très grosse main face à une relance : tu remets la pression (tapis si ton tapis fait moins de trois fois le pot). Tu as les meilleures mains.', ch: 21 };
        if (c === 'forte') return { act: 'call', label: 'Payer', why: 'Main forte face à une relance : tu paies. Au club, une relance au flop, c’est souvent deux paires ou mieux ; relancer encore ne fait payer que les mains meilleures.', ch: 21 };
        if (c === 'tirage') return { act: 'call', label: 'Payer', why: 'Tirage face à une relance : tu paies si la relance est petite (moins de la moitié de ton tapis), tu te couches face à une très grosse relance.', ch: 21 };
        return { act: 'fold', label: 'Se coucher', why: 'Main moyenne ou rien face à une relance : tu te couches. Une relance, c’est rarement un bluff au club.', ch: 21 };
      }
      if (A.face === 'bet') {
        var q = { tex: tex, cat: c === 'ventral' ? 'ventral' : c, sz: A.faceSz };
        if (q.cat === 'monstre' || q.cat === 'forte' || q.cat === 'moyenne' || q.cat === 'tirage' || q.cat === 'ventral' || q.cat === 'rien') {
          var r = faceDec(q);
          if (r) { out = { act: r.a, label: lab(r.a), why: fix(r.why), ch: 21 }; if (A.opps >= 2) out.why += ' À plusieurs, sois un peu plus serré : il faut battre deux joueurs, pas un.'; return out; }
        }
      }
      // tu parles (personne n'a misé)
      if (A.role === 'raiser') {
        var spot = A.opps >= 2 ? 'multi' : 'cbet';
        var d = T.decide({ spot: spot, tex: tex, cat: c2 });
        out = { act: d.a, label: lab(d.a), why: fix(d.why), ch: 20 };
        if (c === 'ventral') out.why += ' Ton tirage ventral (4 outs) compte comme « rien » pour la taille.';
        if (spot === 'cbet' && !A.ip && (c2 === 'rien' || c2 === 'moyenne')) out.why += ' Hors de position, le solveur checke plus souvent ces mains : tu peux checker sans honte.';
        return out;
      }
      // tu as payé avant le flop
      if (!A.ip || A.face === 'none') {
        var d2 = T.decide({ spot: 'donk', tex: tex, cat: c2 });
        out = { act: d2.a, label: d2.a === 'moitie' ? 'Mise de 50 % du pot (' + f1(A.pot / 2) + ' BB dans un pot de ' + f1(A.pot) + ' BB)' : lab(d2.a), why: fix(d2.why), ch: 20 };
        if (d2.a === 'check') out.why += ' S’il mise ensuite, repose la question avec la taille de sa mise.';
        return out;
      }
      // en position, le relanceur a checké : reprise de l'initiative
      if (c === 'monstre' || c === 'forte') return { act: 'moitie', label: sizeTxt('moitie', A.pot).replace('Mise moyenne : 50 à 66', 'Mise de 50'), why: 'Le relanceur a checké : il a montré de la faiblesse. Avec une main qui veut être payée, tu prends l’initiative, environ la moitié du pot (repère du club pour la reprise de lead).', ch: 20 };
      if (c === 'tirage') return { act: 'petit', label: lab('petit'), why: 'Le relanceur a checké : un tirage peut miser petit (25 à 35 %) en semi-bluff. Il peut se coucher, et sinon tu as tes outs.', ch: 20 };
      if (c2 === 'rien' && tex !== 'mouille' && tex !== 'bas' && A.opps === 1) return { act: 'petit', label: lab('petit'), why: 'Le relanceur a checké sur un ' + texDesc(A, tex) + ' : il a souvent raté. Une petite mise (25 à 35 %) le fait coucher assez souvent pour être rentable.', ch: 20 };
      return { act: 'check', label: 'Check', why: c === 'moyenne' ? 'Main moyenne : check derrière. Elle gagne souvent à l’abattage, et une mise ne fait payer que les mains meilleures.' : 'Rien sur un board qui aide beaucoup de mains : check derrière, tu prends une carte gratuite.', ch: 20 };
    }
    if (A.street === 'turn') {
      if (A.face === 'bet') { var rr = faceDec({ tex: tex || 'sec', cat: c, sz: A.faceSz }); return { act: rr.a, label: lab(rr.a), why: rr.why.replace(/sur deux cartes/g, 'sur la dernière carte (moitié moins qu’au flop)').replace(/32 à 35 %/, '17 à 19 %') + ' À la turn, un tirage n’a plus qu’une carte pour toucher : il lui faut une cote plus grosse.', ch: 25 }; }
      if (A.face === 'shove') return shoveVerdict(A);
      var tc = turnCard(A), cat = c === 'ventral' ? 'rien' : c;
      var td = T._tr ? trDec({ spot: A.line === 'checked' ? 'delayed' : 'turn', tc: tc, cat: cat }) : null;
      if (!td) return null;
      out = { act: td.a, label: lab(td.a), why: td.why, ch: 25 };
      if (A.line !== 'checked' && A.line !== 'bet') out.why += ' (Je pars du principe que tu as misé au flop et qu’il a payé.)';
      return out;
    }
    if (A.street === 'river') {
      if (A.face === 'bet') return riverFace(A);
      var rc = c === 'monstre' ? 'forte' : c === 'forte' ? (/kicker (moyen|petit)|petit kicker/.test(A.what || '') ? 'fine' : 'forte') : c === 'moyenne' ? 'catcher' : (c === 'tirage' || c === 'ventral') ? 'bluff' : 'rien';
      if (!A.ip && rc === 'fine') rc = 'catcher';
      if (!A.ip && rc === 'bluff') rc = 'rien';
      var rd = trDec({ spot: A.ip ? 'river' : 'riverOop', cat: rc });
      return { act: rd.a, label: rd.a === 'petit' ? sizeTxt(A.ip ? 'petitR' : 'block', A.pot) : lab(rd.a), why: rd.why, ch: 28 };
    }
    return null;
  }
  function faceDec(q) {
    // reprend le moteur « Face à une mise » (taille.js)
    var T = TL(), save = { tex: q.tex, cat: q.cat, sz: q.sz };
    try { return T && T._face ? T._face(save) : faceLocal(save); } catch (e) { return faceLocal(save); }
  }
  function faceLocal(q) {
    var FSZ = { tiers: [2, 'un tiers du pot', 20, 75], moitie: [3, 'la moitié du pot', 25, 67], troisq: [4.5, 'trois quarts du pot', 30, 57], pot: [6, 'la taille du pot', 33, 50] };
    var z = FSZ[q.sz], wet = q.tex === 'mouille' || q.tex === 'bas', need = 'Il te faut ' + z[2] + ' % d’équité pour payer ' + z[1] + ', et tu dois garder environ ' + z[3] + ' % de ta range.';
    if (q.cat === 'monstre') return { a: 'raise', why: 'Très grosse main : tu relances (' + (wet ? '3 à 4 fois sa mise sur ce board à tirages' : '2,2 à 2,5 fois sa mise sur ce board sec') + ', chapitre 21). Payer seulement laisse les tirages venir gratuitement.' };
    if (q.cat === 'forte') return { a: 'call', why: 'Main forte : tu paies. ' + need + ' Relancer ne fait coucher que les mains plus faibles et fait payer les meilleures.' };
    if (q.cat === 'moyenne') { if (q.sz === 'pot' && wet) return { a: 'fold', why: 'Main moyenne face à une mise du pot sur un board à tirages : tu te couches. ' + need + ' Une grosse mise d’un joueur du club, c’est souvent une vraie main.' }; return { a: 'call', why: 'Main moyenne : tu paies. ' + need + ' Ta paire est souvent devant un bluff ou un tirage.' }; }
    if (q.cat === 'ventral') return { a: 'fold', why: 'Un tirage ventral, c’est 4 outs : environ 17 % sur deux cartes. ' + need + ' Ça ne suffit pas seul : tu te couches.' };
    if (q.cat === 'tirage') { if (q.sz === 'tiers' && wet) return { a: 'raise', why: 'Tirage face à une petite mise sur un board à tirages : tu relances (semi-bluff). Il peut se coucher tout de suite, et sinon tu as encore tes outs.' }; return { a: 'call', why: 'Un tirage couleur ou par les deux bouts, c’est 8 à 9 outs : environ 32 à 35 % sur deux cartes. ' + need + ' Tu paies.' }; }
    return { a: 'fold', why: 'Rien, sans tirage : tu te couches. ' + need + ' Ta main ne gagne presque jamais.' };
  }
  function trDec(q) { var T = TL(); return T._tr ? T._tr(q) : null; }
  function turnCard(A) {
    if (!A.turn || A.board.length < 3) return 'blanche';
    var fr = A.board.map(function (c) { return rv(c.r); }), t = rv(A.turn.r);
    var b4 = A.board.concat([A.turn]);
    if (b4.every(function (c) { return c.s; })) { var su = {}; b4.forEach(function (c) { su[c.s] = (su[c.s] || 0) + 1; }); if (Object.keys(su).some(function (k) { return su[k] >= 3; }) && !A.board.every(function (c) { return c.s === A.board[0].s; })) { var bsu = {}; A.board.forEach(function (c) { bsu[c.s] = (bsu[c.s] || 0) + 1; }); if (bsu[A.turn.s] === 2) return 'complete'; } }
    var rs = b4.map(function (c) { return rv(c.r); }).sort(function (x, y) { return x - y; });
    for (var i = 0; i + 2 < rs.length; i++) { /* 4 cartes dans 5 rangs : la quinte se complète */ }
    var uniq = rs.filter(function (x, i) { return rs.indexOf(x) === i; });
    for (var lo = 1; lo <= 10; lo++) { var h = 0, ht = false; for (var k = lo; k < lo + 5; k++) if (uniq.indexOf(k) >= 0 || (k === 1 && uniq.indexOf(14) >= 0)) { h++; if (k === t || (k === 1 && t === 14)) ht = true; } if (h >= 4 && ht) return 'complete'; }
    if (t > Math.max.apply(null, fr)) return 'aide';
    return 'blanche';
  }
  function riverFace(A) {
    var z = { tiers: 20, moitie: 25, troisq: 30, pot: 33 }[A.faceSz], c = A.cat;
    var need = 'Face à ' + SZN[A.faceSz] + ', tu dois gagner au moins ' + z + ' % du temps pour payer.';
    if (c === 'monstre') return { act: 'raise', label: 'Relancer', why: 'Très grosse main à la river : tu relances pour la valeur. ' + need, ch: 28 };
    if (c === 'forte') return { act: 'call', label: 'Payer', why: 'Main forte : tu paies. ' + need + ' Relancer ne ferait payer que les mains meilleures.', ch: 28 };
    if (c === 'moyenne') return A.faceSz === 'tiers' || A.faceSz === 'moitie' ? { act: 'call', label: 'Payer', why: 'Main moyenne face à une petite ou moyenne mise : tu paies, ta main bat ses bluffs. ' + need, ch: 28 } : { act: 'fold', label: 'Se coucher', why: 'Main moyenne face à une grosse mise à la river : au club, c’est rarement un bluff. Tu te couches. ' + need, ch: 28 };
    return { act: 'fold', label: 'Se coucher', why: 'Rien à la river : tu ne bats même pas ses bluffs. Tu te couches.', ch: 28 };
  }
  function shoveVerdict(A) {
    var c = A.cat;
    if (c === 'monstre' || c === 'forte') return { act: 'call', label: 'Payer le tapis', why: 'Main ' + (c === 'monstre' ? 'très forte' : 'forte') + ' face à un tapis : tu paies. Compare ta cote (ce que tu paies ÷ le pot final) à tes chances de gagner.', ch: 21 };
    if (c === 'tirage') return { act: 'call', label: 'Payer si la cote suffit', why: 'Gros tirage face à un tapis : au flop, 8 à 9 outs font 32 à 35 % sur deux cartes. Tu paies si le tapis est au plus la taille du pot environ ; sinon tu te couches.', ch: 21 };
    return { act: 'fold', label: 'Se coucher', why: 'Main moyenne ou rien face à un tapis : tu te couches, sauf s’il est très court par rapport au pot.', ch: 21 };
  }
  function preVerdict(A) {
    var PA = window.PA, p = PA.player(), prof = (p && p.profile) || 'tag';
    if (!A.hand || !A.pos) return null;
    var hi = A.hand[0].r, lo = A.hand[1].r;
    function code(s) { return hi === lo ? hi + lo : hi + lo + (s ? 's' : 'o'); }
    var bb = A.stack || 40, s;
    if (A.opener && A.opener !== '?') s = { type: 'def', pos: A.pos, opener: A.opener, bb: Math.max(bb, 41) };
    else if (A.opener === '?') return { act: null, label: 'Qui a ouvert ?', why: 'Dis-moi la position de celui qui a ouvert (« le cut-off ouvre, je suis au bouton avec… »), la réponse en dépend.', ch: 7 };
    else s = { type: 'open', pos: A.pos, bb: bb > 40 ? 50 : bb };
    var NA = { raise: s.type === 'def' ? 'Relancer (3-bet)' : 'Ouvrir à 2 BB', call: 'Payer', fold: 'Se coucher', allin: 'Tapis', fourbet: '4-bet' };
    function act(su) { try { return PA.actionFor(prof, s, code(su)) || 'fold'; } catch (e) { return null; } }
    if (s.type === 'open' && A.pos === 'BB') return { act: null, label: 'Grosse blinde', why: 'En grosse blinde, tu n’ouvres pas : dis-moi qui a ouvert devant toi.', ch: 7 };
    var a1, a0, why;
    if (hi === lo || A.suited !== null) { a1 = act(A.suited !== false); why = 'D’après ta range (' + (PA.PROFILES[prof] ? PA.PROFILES[prof].name : prof) + ') ' + (s.type === 'open' ? 'en ' + PNAME[A.pos] + ', personne n’a ouvert avant toi' : 'en ' + PNAME[A.pos] + ' face à l’ouverture du ' + PNAME[s.opener]) + (bb <= 40 ? ', à ' + bb + ' BB' : '') + '.'; return { act: a1, label: NA[a1] || a1, why: why + ' Tu peux la vérifier dans « Ma range ».', ch: s.type === 'open' ? 7 : 8, link: '#ranges' }; }
    a1 = act(true); a0 = act(false);
    why = 'D’après ta range ' + (s.type === 'open' ? 'en ' + PNAME[A.pos] : 'en ' + PNAME[A.pos] + ' face à l’ouverture du ' + PNAME[s.opener]) + '.';
    if (a1 === a0) return { act: a1, label: NA[a1] || a1, why: why + ' Assorties ou non, c’est la même décision.', ch: 7, link: '#ranges' };
    return { act: a1, label: 'Assorties : ' + (NA[a1] || a1) + ' · dépareillées : ' + (NA[a0] || a0), why: why + ' Ici, ça dépend : assorties (même couleur), elles se jouent ; dépareillées, ' + (a0 === 'fold' ? 'tu te couches' : 'elles se jouent aussi : ' + (NA[a0] || a0)) + '.', ch: 7, link: '#ranges' };
  }

  /* ---------- 4. Le solveur (un seul adversaire) ---------- */
  function solverPlan(A) {
    if (A.street !== 'flop' || A.opps !== 1 || A.board.length < 3 || !window.PA_SOLVER || !window.PA_APF) return null;
    var P = { BTN: 'btn', CO: 'co', HJ: 'hj', UTG: 'utg', 'UTG+1': 'utg', MP: 'hj', LJ: 'hj' };
    if (A.role === 'raiser' && P[A.pos] && (!A.vpos || A.vpos === 'BB') && A.face === 'check') return { id: P[A.pos] + '-bb', path: 'x', who: 'Tu as ouvert au ' + PNAME[A.pos] + ', la grosse blinde a payé puis checké' };
    if (A.role === 'raiser' && A.pos === 'SB' && A.face !== 'bet') return { id: 'sb-bb', path: '', who: 'Tu as ouvert de la petite blinde, la grosse blinde a payé' };
    if (A.pos === 'BB' && A.role === 'caller' && P[A.vpos || 'BTN'] && A.face === 'bet' && (A.faceSz === 'tiers' || A.faceSz === 'troisq' || A.faceSz === 'pot')) return { id: P[A.vpos || 'BTN'] + '-bb', path: A.faceSz === 'tiers' ? 'x-b33' : 'x-b75', who: 'Tu as payé en grosse blinde, tu as checké, il mise ' + (A.faceSz === 'tiers' ? 'un tiers du pot' : 'trois quarts du pot') };
    return null;
  }
  function fillSuits(A) {
    // couleurs inconnues : board arc-en-ciel (ou d'une couleur si « monocouleur »), main dépareillée sauf si « assorties »
    var board = A.board.map(function (c, i) { return { r: c.r, s: c.s || (A.tex === 'mono' ? 's' : A.twoTone && i < 2 ? 's' : SUITS[i % 3 + (A.twoTone ? 0 : 0)]) }; });
    if (!A.board.every(function (c) { return c.s; }) && A.twoTone) board = board.map(function (c, i) { return { r: c.r, s: i < 2 ? 's' : 'h' }; });
    else if (!A.board.every(function (c) { return c.s; }) && A.tex !== 'mono') board = board.map(function (c, i) { return { r: c.r, s: ['s', 'h', 'd'][i] }; });
    function hand(h) {
      if (!h) return null;
      if (h[0].s && h[1].s) return h;
      var suited = A.suited === true, s1 = 'c', s2 = suited ? 'c' : 'd';
      if (h[0].r === h[1].r) { s1 = 'c'; s2 = 'd'; }
      return [{ r: h[0].r, s: s1 }, { r: h[1].r, s: s2 }];
    }
    return { board: board, hand: hand };
  }
  function solverRun(A, cb) {
    var pl = solverPlan(A); if (!pl) { cb(null); return; }
    var S = window.PA_SOLVER, AP = window.PA_APF;
    S.loadData(function () {
      var sp = AP.spotOf(pl.id); if (!sp) { cb(null); return; }
      var fs = fillSuits(A), flop = fs.board.map(function (c) { return c.r + c.s; });
      var map = AP.nearest(sp, flop);
      var hands = [];
      if (A.hand) hands.push(['', fs.hand(A.hand)]);
      else if (A.hi === 'A' && (A.cat === 'rien' || A.catWord === 'rien')) ['K', 'Q', '9', '4'].forEach(function (k) { if (!fs.board.some(function (c) { return c.r === k; })) hands.push(['A-' + (k === 'T' ? '10' : k), fs.hand([{ r: 'A' }, { r: k }])]); });
      if (!hands.length) { cb(null); return; }
      var out = { pl: pl, map: map, rows: [] }, k = 0;
      (function next() {
        if (k >= hands.length) { cb(out); return; }
        var h = hands[k++], tr = AP.transpose(map, h[1].map(function (c) { return c.r + c.s; }));
        S.query(pl.id, map.flop, pl.path, tr.join(''), function (r) { if (r) out.rows.push({ name: h[0], r: r }); next(); });
      })();
    });
  }
  function solverHtml(res) {
    if (!res || !res.rows.length) return '';
    var AP = window.PA_APF, f = res.map.flop, flopTxt = [0, 2, 4].map(function (i) { var c = f.substr(i, 2); return (c[0] === 'T' ? '10' : c[0]) + SU[c[1]]; }).join(' ');
    var rows = res.rows.map(function (x) {
      var r = x.r, row = r.p || r.mix, L = r.a.map(function (a, j) { return [a, row ? row[j] : 0]; }).filter(function (y) { return y[1] >= 0.05; }).sort(function (a, b) { return b[1] - a[1]; });
      var txt = L.map(function (y, j) { return (j === 0 ? '<b>' : '') + AP.actName(y[0]) + ' ' + Math.round(y[1] * 100) + ' %' + (j === 0 ? '</b>' : ''); }).join(' · ');
      return '<div>' + (x.name ? '<b>' + x.name + '</b> : ' : '') + txt + (r.p ? '' : ' <span class="muted">(moyenne de ses mains « ' + U().esc(r.cat) + ' »)</span>') + '</div>';
    }).join('');
    return '<div class="card stack" style="gap:6px"><b>Le solveur de l’appli</b><div class="small muted">' + U().esc(res.pl.who) + '. Tapis de 40 BB. Flop calculé le plus proche : ' + flopTxt + (res.map.exact ? '' : ' (même allure que le tien)') + '.</div>' + rows +
      '<div class="small muted">Le solveur mélange ses actions : un « 70 % » veut dire qu’il le fait 7 fois sur 10. Les repères du club au-dessus sont plus simples à appliquer à table.</div></div>';
  }

  /* ---------- 5. L'écran ---------- */
  var Y = { text: '', Q: null, ov: {}, listening: false, msg: '', sol: null, solKey: '', hist: null };
  function hist() { if (Y.hist) return Y.hist; try { Y.hist = JSON.parse(localStorage.getItem('pa2yohist') || '[]'); } catch (e) { Y.hist = []; } return Y.hist; }
  function saveHist(t) { var h = hist().filter(function (x) { return x !== t; }); h.unshift(t); Y.hist = h.slice(0, 12); try { localStorage.setItem('pa2yohist', JSON.stringify(Y.hist)); } catch (e) {} }
  var EXAMPLES = [
    'J’ai raté mon flop, hauteur as sur un board 7-5-2, je suis au bouton, la grosse blinde checke',
    'Paire de 9 servie, payé par deux joueurs, flop K 7 2',
    'Je suis en grosse blinde avec 9-8, le bouton ouvre, flop 9 8 4, je parle en premier',
    'J’ai top paire as-roi sur un flop roi valet 10 avec deux cœurs, il checke',
    'En grosse blinde, il mise la moitié du pot, j’ai un tirage couleur',
    'As-10 dépareillés en UTG, j’ouvre ?'];
  function cardsHtml(cs) { return cs.map(function (c) { var red = c.s === 'h' || c.s === 'd'; return '<span class="apf-c' + (red ? ' red' : '') + '">' + (c.r === 'T' ? '10' : c.r) + (c.s ? SU[c.s] : '') + '</span>'; }).join(''); }
  function chip(k, v, cur, txt) { return '<button class="chip' + (cur ? ' on' : '') + '" data-ya="set" data-k="' + k + '" data-v="' + v + '" style="' + (cur ? 'background:var(--gold);color:#111;border-color:var(--gold)' : '') + '">' + txt + '</button>'; }
  function understood(A) {
    var ui = U(), L = [];
    var as = function (k) { return A.assumed[k] ? ' <span class="muted small">(supposé)</span>' : ''; };
    if (A.hand) L.push('<div class="row" style="gap:6px;flex-wrap:wrap"><span class="small muted" style="min-width:86px">Ta main</span>' + cardsHtml(A.hand) + (A.hand[0].r !== A.hand[1].r && !(A.hand[0].s && A.hand[1].s) ? ' <span class="small">' + (A.suited === true ? 'assorties' : A.suited === false ? 'dépareillées' : '') + '</span>' : '') + '</div>');
    else if (A.hi) L.push('<div class="row"><span class="small muted" style="min-width:86px">Ta main</span><b>hauteur ' + RNAME[A.hi] + '</b> <span class="small muted">(deuxième carte inconnue)</span></div>');
    else if (A.pocket) L.push('<div class="row"><span class="small muted" style="min-width:86px">Ta main</span><b>une paire servie</b> <span class="small muted">(laquelle ?)</span></div>');
    if (A.street && A.street !== 'pre') {
      var bd = boardAll(A);
      L.push('<div class="row" style="gap:6px;flex-wrap:wrap"><span class="small muted" style="min-width:86px">Board</span>' + (bd.length ? cardsHtml(bd) : '<span class="small muted">pas de cartes</span>') + (A.tex ? ' <b class="small">' + texDesc(A, A.tex) + '</b>' + as('tex') : '') + '</div>');
      if (A.what) L.push('<div class="row"><span class="small muted" style="min-width:86px">Tu as</span><b>' + ui.esc(A.what) + '</b></div>');
    }
    var out = '<div class="card stack" style="gap:8px"><b>Ce que j’ai compris</b>' + L.join('');
    if (A.street && A.street !== 'pre') {
      out += '<div class="small muted">Touche pour corriger :</div>';
      out += '<div class="row" style="gap:6px;flex-wrap:wrap">' + chip('role', 'raiser', A.role === 'raiser', 'J’ai relancé avant') + chip('role', 'caller', A.role === 'caller', 'J’ai payé avant') + '</div>';
      out += '<div class="row" style="gap:6px;flex-wrap:wrap">' + chip('opps', 1, A.opps === 1, '1 adversaire') + chip('opps', 2, A.opps === 2, '2 adversaires') + chip('opps', 3, A.opps >= 3, '3 et plus') + '</div>';
      out += '<div class="row" style="gap:6px;flex-wrap:wrap">' + chip('ip', 1, A.ip === true, 'En position') + chip('ip', 0, A.ip === false, 'Hors de position') + '</div>';
      out += '<div class="row" style="gap:6px;flex-wrap:wrap">' + chip('face', 'check', A.face === 'check', 'Il a checké') + chip('face', 'none', A.face === 'none', 'Je parle en premier') + chip('face', 'bet', A.face === 'bet', 'Il mise') + chip('face', 'raise', A.face === 'raise', 'Il relance ma mise') + chip('face', 'shove', A.face === 'shove', 'Il fait tapis') + '</div>';
      if (A.face === 'bet' || A.face === 'raise') out += '<div class="row" style="gap:6px;flex-wrap:wrap">' + ['tiers', 'moitie', 'troisq', 'pot'].map(function (s) { return chip('faceSz', s, A.faceSz === s, { tiers: '⅓ du pot', moitie: '½ pot', troisq: '¾ du pot', pot: 'Pot' }[s]); }).join('') + '</div>';
      if (!A.board.length) out += '<div class="row" style="gap:6px;flex-wrap:wrap"><span class="small muted">Le board :</span>' + ['sec', 'paire', 'mouille', 'bas', 'mono'].map(function (t) { return chip('tex', t, A.tex === t, { sec: 'Sec', paire: 'Pairé', mouille: 'À tirages', bas: 'Bas et connecté', mono: 'Une couleur' }[t]); }).join('') + '</div>';
      if (!A.hand || A.catWord || !A.board.length) out += '<div class="row" style="gap:6px;flex-wrap:wrap"><span class="small muted">Tu as :</span>' + ['rien', 'tirage', 'moyenne', 'forte', 'monstre'].map(function (t) { return chip('cat', t, A.cat === t, { rien: 'Rien', tirage: 'Un tirage', moyenne: 'Une paire moyenne', forte: 'Top paire / overpaire', monstre: 'Brelan ou mieux' }[t]); }).join('') + '</div>';
    }
    return out + '</div>';
  }
  function answerHtml(A) {
    var ui = U();
    if (!A.street) return ui.yo('Je n’ai pas compris de quel moment du coup tu parles. Dis-moi ta main, ta position, et le flop s’il y en a un. Par exemple : « J’ai as-roi au bouton, la grosse blinde paie, flop 7-5-2, elle checke ».');
    if (A.street === 'pre') {
      var pv = preVerdict(A);
      if (!pv) return ui.yo('Avant le flop, il me faut ta main et ta position. Par exemple : « As-10 dépareillés en UTG, j’ouvre ? »');
      return verdictCard(A, pv);
    }
    if (A.pocket && !A.cat && A.street === 'flop' && A.tex) return pocketHtml(A);
    if (!A.cat) return ui.yo('Il me manque ce que tu as touché. Donne-moi ta main et le flop (« as-roi sur 7-5-2 »), ou dis-le : « j’ai raté », « top paire », « un tirage couleur »… ou touche un bouton au-dessus.');
    if (!A.tex && A.street === 'flop') return ui.yo('Il me manque le flop. Donne-moi ses cartes (« flop roi 7 2 ») ou son allure : sec, pairé, à tirages, bas et connecté… ou touche un bouton au-dessus.');
    var v = verdict(A);
    if (!v) return ui.yo('Je n’ai pas de repère du club pour ce cas. Essaie de reformuler, ou demande à Claude avec le bouton plus bas.');
    return verdictCard(A, v);
  }
  function pocketHtml(A) {
    {
      var a1 = complete(Y.Q, Object.assign({}, Y.ov, { cat: 'forte' })), a2 = complete(Y.Q, Object.assign({}, Y.ov, { cat: 'moyenne' }));
      var v1 = verdict(a1), v2 = verdict(a2);
      return '<div class="card stack fb-ok"><b>Ça dépend de ta paire</b>' +
        '<div><b>Au-dessus de toutes les cartes du board (overpaire) :</b> ' + v1.label + '. <span class="small">' + v1.why + '</span></div>' +
        '<div><b>En dessous d’une carte du board :</b> ' + v2.label + '. <span class="small">' + v2.why + '</span></div>' +
        '<div class="small muted">Et si ton flop t’a donné un brelan : tu joues ta très grosse main (dis « brelan »).</div>' + chLink(20) + '</div>';
    }
  }
  function chLink(ch) { return ch ? '<a class="btn" href="#lecon-' + ch + '">Relire le chapitre ' + ch + '</a>' : ''; }
  function verdictCard(A, v) {
    var ui = U(), cls = v.act === 'fold' ? 'fb-err' : 'fb-ok';
    var hyp = [];
    if (A.street !== 'pre') {
      if (A.assumed.opps) hyp.push('un seul adversaire');
      if (A.assumed.role) hyp.push(A.role === 'raiser' ? 'tu as relancé avant le flop' : 'tu as payé avant le flop');
      if (A.assumed.face && A.face === 'check') hyp.push('il a checké');
      if (A.assumed.faceSz) hyp.push('sa mise fait la moitié du pot');
      if (A.assumed.tex && A.tex === 'sec') hyp.push('un board sans gros tirage');
      if (A.assumed.ip && A.ip != null) hyp.push(A.ip ? 'tu es en position' : 'tu parles en premier');
      if (A.street === 'turn' && !A.turn) hyp.push('la turn ne change rien');
    }
    var kick = (!A.hand && A.hi === 'A' && A.cat === 'rien' && A.opps === 1 && A.street === 'flop') ? '<div class="small">Avec une hauteur as, ta deuxième carte compte : deux cartes hautes (A-K, A-Q) misent plus souvent que A-9 ou A-6. Le solveur ci-dessous le montre.</div>' : '';
    return '<div class="card stack ' + cls + '" style="gap:8px"><div class="small muted">La réponse du club</div>' + labelHtml(v.label) +
      '<div>' + v.why + '</div>' + kick + (hyp.length ? '<div class="small muted">J’ai supposé : ' + hyp.join(', ') + '. Si ce n’est pas ça, touche les boutons au-dessus.</div>' : '') +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' + chLink(v.ch) + (v.link ? '<a class="btn" href="' + v.link + '">Ma range</a>' : '') + '</div></div>';
  }
  function labelHtml(l) {
    var ui = U(), i = l.indexOf(' : ');
    if (i < 0 || /·/.test(l)) return '<div class="disp" style="font-size:24px">' + ui.esc(l) + '</div>';
    return '<div class="disp" style="font-size:26px">' + ui.esc(l.slice(0, i)) + '</div><div style="font-weight:700;color:var(--gold)">' + ui.esc(cap(l.slice(i + 3))) + '</div>';
  }
  function claudeText(A) {
    var lines = ['Question de poker (tournois live au club de Lionel). Réponds avec les repères du club de mon projet Poker Academy.'];
    lines.push('Ma question : « ' + Y.text.trim() + ' »');
    if (A) {
      var d = [];
      if (A.hand) d.push('ma main : ' + A.hand.map(function (c) { return (c.r === 'T' ? '10' : c.r) + (c.s ? SU[c.s] : ''); }).join(' ') + (A.suited === true ? ' assorties' : A.suited === false ? ' dépareillées' : ''));
      else if (A.hi) d.push('hauteur ' + RNAME[A.hi]);
      if (A.pos) d.push('ma position : ' + PNAME[A.pos]);
      if (A.street && A.street !== 'pre') {
        d.push(A.role === 'raiser' ? 'j’ai relancé avant le flop' : 'j’ai payé avant le flop');
        d.push(A.opps + ' adversaire' + (A.opps > 1 ? 's' : ''));
        var bd = boardAll(A); if (bd.length) d.push('board : ' + bd.map(function (c) { return (c.r === 'T' ? '10' : c.r) + (c.s ? SU[c.s] : ''); }).join(' '));
        if (A.tex) d.push(texDesc(A, A.tex));
        if (A.face === 'bet') d.push('il mise ' + SZN[A.faceSz]); else if (A.face === 'check') d.push('il a checké'); else if (A.face === 'raise') d.push('il relance ma mise'); else if (A.face === 'shove') d.push('il fait tapis');
      }
      if (A.stack) d.push('tapis : ' + A.stack + ' BB');
      if (d.length) lines.push('Ce que l’appli a compris : ' + d.join(' ; ') + '.');
      var v = A.street ? (A.street === 'pre' ? preVerdict(A) : (A.cat && A.tex ? verdict(A) : null)) : null;
      if (v) lines.push('Réponse de l’appli : ' + v.label.replace(/<[^>]+>/g, '') + '.');
    }
    lines.push('Dis-moi si tu es d’accord, et explique simplement.');
    return lines.join('\n');
  }
  function view() {
    var ui = U(), V = window.PA_VOICE;
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="home">‹ Accueil</button><h1>Pose ta question à Yo</h1>' +
      (Y.Q ? '' : ui.yo('Raconte-moi le coup comme à table : ta main, ta position, combien t’ont payé, le flop, ce qu’il a fait. Je te dis check ou quelle taille, avec la raison. Tu peux aussi parler : touche le micro.')) +
      '<textarea id="yoQ" rows="3" placeholder="Ex. : j’ai raté mon flop, hauteur as sur 7-5-2, au bouton, la grosse blinde checke" style="width:100%;min-height:96px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:12px;padding:12px;font-size:17px;font-family:inherit">' + ui.esc(Y.text) + '</textarea>' +
      '<div class="row" style="gap:8px"><button class="btn gold" data-ya="ask" style="flex:1">Demander à Yo</button>' + (V && V.ok() ? '<button class="btn" data-ya="mic" aria-label="Dicter ta question" style="min-width:64px">' + (Y.listening ? 'J’écoute…' : '🎤') + '</button>' : '') + '</div>' +
      (Y.msg ? '<div class="small" style="color:var(--gold)">' + ui.esc(Y.msg) + '</div>' : '');
    if (Y.Q) {
      var A = complete(Y.Q, Y.ov);
      body += understood(A) + answerHtml(A) + '<div id="yoSol">' + (Y.sol && Y.solKey === solKey(A) ? solverHtml(Y.sol) : '') + '</div>';
      body += '<button class="btn block" data-ya="claude">💬 Demander à Claude (copie la question)</button>';
      setTimeout(function () { loadSolver(A); }, 0);
    }
    var h = hist();
    body += '<div class="card stack" style="gap:8px"><b>' + (h.length ? 'Tes dernières questions' : 'Exemples') + '</b>' + (h.length ? h : EXAMPLES).slice(0, 6).map(function (t, i) { return '<button class="btn block" data-ya="ex" data-i="' + i + '" data-h="' + (h.length ? 1 : 0) + '" style="justify-content:flex-start;text-align:left;font-weight:500;white-space:normal">' + ui.esc(t) + '</button>'; }).join('') + (h.length ? '<button class="btn" data-ya="exs">Voir des exemples</button>' : '') + '</div>';
    body += '<div class="small muted">Les réponses suivent les repères du club (chapitres 20, 21, 25 et 28) et ta range avant le flop. Tapis de 40 BB et plus, sauf si tu donnes ton tapis.</div></div>';
    return ui.shell('home', body);
  }
  function solKey(A) { return JSON.stringify([A.board, A.hand, A.hi, A.pos, A.vpos, A.role, A.opps, A.face, A.faceSz, A.tex, A.cat]); }
  function loadSolver(A) {
    var key = solKey(A); if (Y.solKey === key) return;
    Y.solKey = key; Y.sol = null;
    if (!solverPlan(A)) return;
    solverRun(A, function (res) { if (Y.solKey !== key) return; Y.sol = res; var el = document.getElementById('yoSol'); if (el) el.innerHTML = solverHtml(res); });
  }
  function ask(t) {
    Y.text = t != null ? t : Y.text; Y.ov = {}; Y.msg = '';
    if (!Y.text.trim()) { Y.Q = null; Y.msg = 'Écris ou dicte ta question d’abord.'; U().render(); return; }
    Y.Q = parse(Y.text); saveHist(Y.text.trim()); U().render();
  }
  function toast(t) { var b = document.createElement('div'); b.textContent = t; b.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#222;color:#fff;border:1px solid var(--gold);padding:10px 14px;border-radius:12px;z-index:9999;max-width:90vw;font-size:15px'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 3500); }
  function toClaude() {
    var txt = claudeText(Y.Q ? complete(Y.Q, Y.ov) : null);
    if (window.PAAndroid && window.PAAndroid.shareText) { try { window.PAAndroid.shareText(txt); return; } catch (e) {} }
    if (navigator.share && /iPhone|iPad|Android/i.test(navigator.userAgent || '')) { navigator.share({ text: txt }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('Question copiée : colle-la dans ton projet Poker Academy de l’appli Claude.'); }, function () {
      var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Question copiée : colle-la dans l’appli Claude.'); } catch (e) { toast('Copie impossible sur cet appareil.'); } ta.remove();
    });
  }
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'yoQ') Y.text = e.target.value; });
  document.addEventListener('keydown', function (e) { if (e.target && e.target.id === 'yoQ' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(e.target.value); } });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-ya]') : null; if (!t) return;
    var a = t.getAttribute('data-ya');
    if (a === 'ask') { var el = document.getElementById('yoQ'); ask(el ? el.value : Y.text); }
    else if (a === 'mic') {
      Y.listening = true; Y.msg = ''; U().render();
      window.PA_VOICE.listen('Pose ta question à Yo', function (txt, err) { Y.listening = false; if (txt === null) { Y.msg = err || 'La dictée n’est pas disponible sur cet appareil.'; U().render(); } else if (!txt) { Y.msg = 'Je n’ai rien entendu.'; U().render(); } else ask(txt); });
    }
    else if (a === 'set') {
      var k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
      if (k === 'opps') v = parseInt(v, 10); if (k === 'ip') v = v === '1';
      Y.ov[k] = v; if (k === 'face' && v !== 'bet' && v !== 'raise') delete Y.ov.faceSz;
      U().render();
    }
    else if (a === 'ex') { var h = t.getAttribute('data-h') === '1' ? hist() : EXAMPLES; ask(h[parseInt(t.getAttribute('data-i'), 10)]); window.scrollTo(0, 0); }
    else if (a === 'exs') { Y.hist = []; U().render(); Y.hist = null; }
    else if (a === 'claude') toClaude();
  });
  window.PA_YO = { view: view, ask: function (t) { Y.text = t; Y.Q = parse(t); Y.ov = {}; }, _parse: parse, _complete: complete, _verdict: verdict, _made: made, _tex: texOf, _claude: claudeText, _solverRun: solverRun, _pre: preVerdict };
})();
