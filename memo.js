/* Poker Academy — fiche mémo d’une page : tailles, seuils, défense minimale, outs, règles après le flop. */
(function () {
  'use strict';
  function tbl(head, rows) {
    return '<table class="memo-t"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i ? ' class="n"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function view() {
    var ui = window.PA_UI;
    var sizes = tbl(['Coup', 'Taille'], [
      ['Ouverture (club)', '2 BB · petite blinde 3 BB'],
      ['Isolement d’un limper', '3 BB en position, 4 BB des blindes, +1 BB par limper'],
      ['3-bet', '3 × l’ouverture en position, 4 × hors position'],
      ['Squeeze', '4 × l’ouverture + 1 BB par payeur (+1 à 2 BB des blindes)'],
      ['4-bet (100 BB)', '2,2 × le 3-bet en position, 2,5 × hors position'],
      ['5-bet (100 BB)', 'tapis'],
      ['20 à 30 BB', '3-bet, squeeze et isolement à tapis'],
      ['40 BB', 'le 4-bet est un tapis'],
      ['Check-raise', 'environ 3 × la mise adverse']
    ]);
    var seuils = tbl(['Situation', 'Il faut'], [
      ['Grosse blinde face à 2 BB (ante BB)', '18 % d’équité'],
      ['Grosse blinde face à 2,5 BB / 3 BB', '23 % / 27 %'],
      ['Vol à 2 BB (ante BB)', 'tout le monde couché 44 %'],
      ['Vol de la petite blinde à 3 BB', 'grosse blinde couchée 50 %'],
      ['3-bet light du bouton à 6,5 BB', 'ouvreur couché 59 %'],
      ['3-bet light de la petite blinde à 8 BB', 'ouvreur couché 62 %'],
      ['Squeeze de la grosse blinde à 11 BB', 'tout le monde couché 61 %'],
      ['Face au 4-bet (100 BB, 7,5 → 18 BB)', '27 % d’équité'],
      ['Tapis après ton 3-bet à 8 BB (40 BB)', '39 % d’équité']
    ]);
    var mdf = tbl(['Mise', 'Garder au moins', 'Bluff rentable si couché'], [
      ['1/3 du pot', '75 %', '25 %'], ['1/2 du pot', '67 %', '33 %'], ['2/3 du pot', '60 %', '40 %'], ['3/4 du pot', '57 %', '43 %'], ['le pot', '50 %', '50 %'], ['2 × le pot', '33 %', '67 %']
    ]);
    var outs = tbl(['Tirage', 'Outs', 'Flop → river', 'Turn → river'], [
      ['Quinte ventrale', '4', '16 %', '8 %'], ['Quinte par les deux bouts', '8', '32 %', '16 %'], ['Couleur', '9', '35 %', '18 %'], ['Couleur + overcard', '12', '45 %', '24 %'], ['Couleur + quinte', '15', '54 %', '30 %']
    ]);
    var post = '<ul class="memo-l">' + [
      'Avantage de range (A72, K83 secs) : mise souvent et petit.',
      'Avantage de nuts (overpaire sur flop bas) : mise moins souvent, mais gros.',
      'Aucun avantage (874 à deux couleurs pour l’ouvreur) : checke beaucoup.',
      'C-bet retardé : flop checké, il checke la turn → mise (2 fois sur 3).',
      'Mise sonde : l’ouvreur a checké le flop → mise la turn en premier.',
      'Float : en position, contre un c-bet qui abandonne à la turn ; jamais contre une station.',
      'Slowplay : seulement sur tableau sec quand tu bloques tout.',
      'Check-raise : mains très fortes et tirages avec des outs, jamais sans rien.'
    ].map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
    var pre = '<ul class="memo-l">' + [
      '3-bet linéaire depuis la petite blinde et contre ceux qui paient trop.',
      '3-bet polarisé en position et en grosse blinde : valeur + As assortis.',
      'Petite blinde : 3-bet ou couche. Cold call surtout au bouton.',
      'Pas de 3-bet light contre UTG ni contre une calling station.'
    ].map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
    var out = '<div class="stack memo"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Fiche mémo</h1>' +
      '<div class="small muted no-print">Toutes les tailles et tous les seuils sur une page, à garder dans le portefeuille pour le club.</div>' +
      '<button class="btn gold block no-print" data-act="print">Imprimer ou enregistrer en PDF</button>' +
      '<div class="memo-grid"><section><h2>Les tailles</h2>' + sizes + '<h2>Avant le flop</h2>' + pre + '</section>' +
      '<section><h2>Les seuils</h2>' + seuils + '</section>' +
      '<section><h2>Défense minimale et bluff</h2>' + mdf + '<div class="small muted">Défense = pot ÷ (pot + mise) · bluff = mise ÷ (pot + mise)</div></section>' +
      '<section><h2>Les outs</h2>' + outs + '<div class="small muted">Règle du 4 au flop (avec deux cartes à venir), du 2 à la turn.</div></section>' +
      '<section class="wide"><h2>Après le flop</h2>' + post + '</section></div>' +
      '<div class="small muted">Poker Academy · profil TAG · chiffres tirés des ranges de l’appli et du solveur.</div></div>';
    return ui.shell('apprendre', out);
  }
  window.PA_MEMO = { view: view };
})();
