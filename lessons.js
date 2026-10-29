/* Poker Academy v2.0 — le cours en leçons (nouveau plan, 32 chapitres) */
(function () {
  'use strict';
  var PARTS = [
    { id: 'I', title: 'Les bases' }, { id: 'II', title: 'Le préflop' }, { id: 'III', title: 'Le postflop' },
    { id: 'IV', title: 'Le tournoi' }, { id: 'V', title: 'L’adversaire' }, { id: 'VI', title: 'Progresser' }
  ];
  // chapitres pas encore réécrits : renvoi au PDF actuel (page du livre)
  var PLAN = [
    [1, 'I', 'Fondations', 8], [2, 'I', 'Positions et formats de table', 10], [3, 'I', 'Le club', 13], [4, 'I', 'Bankroll', 17],
    [5, 'II', 'Ouvrir : ranges par profil, position et profondeur', 23], [6, 'II', 'Défendre les blindes', 32], [7, 'II', 'Face aux limpers', 55],
    [8, 'II', 'Le 3-bet et face au 3-bet', 148], [9, 'II', 'Squeeze, 4-bet et click back', 145],
    [10, 'III', 'Outils de calcul', 67], [11, 'III', 'Lire un board', 75], [12, 'III', 'Lecture de main', 0], [13, 'III', 'Le sizing', 77],
    [14, 'III', 'Le flop : c-bet et défense', 91], [15, 'III', 'La turn', 0], [16, 'III', 'La river', 102], [17, 'III', 'SPR et pots 3-bet', 100], [18, 'III', 'Pots multiway', 0],
    [19, 'IV', 'Les phases d’un tournoi et le gros tapis', 0], [20, 'IV', 'Tapis de 25 à 40 BB', 113], [21, 'IV', 'Tapis de 15 à 25 BB', 117], [22, 'IV', 'Tables de push/fold', 123],
    [23, 'IV', 'L’ICM complet', 134], [24, 'IV', 'Table finale et heads-up', 136], [25, 'IV', 'PKO et Space KO', 137],
    [26, 'V', 'Profils adverses', 161], [27, 'V', 'Exploiter les récréatifs et les joueurs larges', 0], [28, 'V', 'Image de table et lecture au club', 162],
    [29, 'VI', 'Mental et tilt', 172], [30, 'VI', 'Revue de sessions', 175], [31, 'VI', 'Mains commentées', 176], [32, 'VI', 'Plan de progression', 189]
  ];

  // Leçons rédigées au nouveau format. sections : {ask: question du joueur (podcast), h: titre, p: [paragraphes]}
  var L = {};

  L[1] = {
    minutes: 7,
    key: ['Un style serré-agressif est la meilleure base en tournoi : peu de mains, mais jouées en relançant.', 'Le profit vient des erreurs des adversaires : chaque fois qu’ils jouent autrement qu’ils le feraient en voyant tes cartes, tu gagnes.'],
    sections: [
      { ask: 'Pourquoi le jeu serré-agressif ?', h: 'Serré et agressif', p: ['Serré : tu joues peu de mains, donc tes mains sont en moyenne plus fortes que celles de tes adversaires. Agressif : tu relances et tu mises plutôt que de payer, ce qui te donne deux façons de gagner, soit avoir la meilleure main, soit faire coucher l’adversaire.', 'Payer ne gagne qu’une façon : au showdown. C’est pourquoi la relance est l’action de base de ce cours.'] },
      { ask: 'D’où vient le profit au poker ?', h: 'Le théorème fondamental', p: ['David Sklansky l’a résumé ainsi : chaque fois que tu joues une main comme tu l’aurais jouée en voyant les cartes de ton adversaire, tu gagnes ; chaque fois que tu joues autrement, tu perds. Et c’est l’inverse pour lui.', 'Concrètement : tu gagnes quand il paie avec une main moins bonne, quand il se couche alors qu’il était devant, quand il bluffe dans ta grosse main.'] },
      { ask: 'Où est la limite du jeu serré ?', h: 'Le plafond du joueur serré', p: ['Un joueur trop serré gagne lentement au début, puis se fait manger par les blindes quand elles montent. Ses adversaires apprennent vite qu’il ne relance qu’avec des monstres, et se couchent.', 'Les trois leviers pour progresser : la position (ouvrir plus large en fin de table), l’agression (voler et défendre les blindes), l’adaptation (jouer selon le profil de chaque adversaire).'] }
    ],
    mistake: 'Confondre serré et passif : jouer peu de mains, mais en payant au lieu de relancer.',
    retain: ['Serré-agressif : peu de mains, jouées en relançant.', 'Tu gagnes quand l’adversaire joue autrement qu’il le ferait en voyant tes cartes.', 'Trois leviers : position, agression, adaptation.'],
    quiz: [
      { q: 'Combien de façons de gagner offre une mise ?', o: ['Une', 'Deux', 'Trois', 'Aucune'], a: 1, why: 'Avoir la meilleure main ou faire coucher l’adversaire.' },
      { q: 'Selon le théorème fondamental, tu gagnes quand l’adversaire…', o: ['gagne un pot', 'joue autrement qu’il le ferait en voyant tes cartes', 'fait tapis', 'se couche toujours'], a: 1, why: 'C’est l’écart à la décision parfaite qui crée le profit.' },
      { q: 'Le principal défaut d’un joueur trop serré en tournoi ?', o: ['Il perd de gros pots', 'Les blindes le grignotent quand elles montent', 'Il bluffe trop', 'Il paie trop'], a: 1, why: 'Il attend trop longtemps et devient court.' },
      { q: 'Lequel n’est pas un des trois leviers de progression ?', o: ['La position', 'L’agression', 'L’adaptation', 'La chance'], a: 3, why: 'La chance ne se travaille pas.' }
    ]
  };

  L[2] = {
    minutes: 6,
    key: ['À neuf joueurs, la position décide de la largeur de ta range : UTG parle en premier avant le flop, le bouton en dernier après.', 'Moins la table compte de joueurs, plus chaque position s’élargit.'],
    sections: [
      { ask: 'Comment s’appellent les places ?', h: 'Les neuf places', p: ['Dans l’ordre de parole avant le flop : UTG, UTG+1, UTG+2 (MP), LJ (lojack), HJ (hijack), CO (cut-off), BTN (bouton), SB (petite blinde), BB (grosse blinde).', 'Après le flop, la SB parle en premier et le bouton en dernier : c’est la meilleure place de la table.'] },
      { ask: 'Pourquoi la position compte autant ?', h: 'L’avantage de parler en dernier', p: ['Parler après ton adversaire, c’est voir ce qu’il fait avant de décider. Tu contrôles la taille du pot, tu bluffes quand il montre de la faiblesse, tu prends des cartes gratuites.', 'C’est pourquoi on ouvre plus large au CO et au bouton : on jouera en position presque tout le temps.'] },
      { ask: 'Et quand la table est plus petite ?', h: 'À six ou huit joueurs', p: ['À six joueurs, il n’y a plus que UTG, HJ, CO, bouton, SB et BB : l’UTG à six joue à peu près comme le LJ à neuf. À huit, on retire l’UTG+1.', 'Règle simple : compte les joueurs qui parlent après toi. C’est ce nombre, pas le nom de la place, qui fixe ta range.'] }
    ],
    mistake: 'Jouer la même range en UTG à neuf joueurs et en UTG à six joueurs : à six, il reste trois joueurs de moins derrière toi.',
    retain: ['Avant le flop : UTG en premier, BB en dernier ; après : SB en premier, bouton en dernier.', 'La position permet de voir avant de décider.', 'Compte les joueurs derrière toi pour choisir ta range.'],
    quiz: [
      { q: 'Qui parle en dernier après le flop ?', o: ['La BB', 'Le bouton', 'UTG', 'La SB'], a: 1, why: 'Le bouton parle en dernier à chaque tour après le flop.' },
      { q: 'Qui parle en premier après le flop ?', o: ['UTG', 'La SB', 'Le bouton', 'Le CO'], a: 1, why: 'La petite blinde, si elle est encore dans le coup.' },
      { q: 'À six joueurs, l’UTG ressemble à quelle place à neuf ?', o: ['UTG', 'LJ', 'Bouton', 'BB'], a: 1, why: 'Il reste à peu près le même nombre de joueurs derrière.' },
      { q: 'Combien de places entre UTG et le bouton à neuf joueurs (exclus) ?', o: ['3', '4', '5', '6'], a: 2, why: 'UTG+1, MP, LJ, HJ, CO.' }
    ]
  };

  L[3] = {
    minutes: 8,
    key: ['Au club, on joue environ 25 à 30 mains par heure : avec des niveaux de 20 minutes, les blindes montent toutes les 8 à 10 mains.', 'Les tables de club limpent et paient plus qu’en ligne : on isole, on mise pour la valeur, on bluffe moins.'],
    sections: [
      { ask: 'Qu’est-ce qui change au club ?', h: 'Le rythme', p: ['En ligne, une table joue 60 à 80 mains par heure. Au club, plutôt 25 à 30. Avec des niveaux de 20 minutes, tu ne vois que 8 à 10 mains par niveau : les blindes montent très vite par rapport au nombre de mains.', 'Conséquence : il faut voler et défendre plus tôt qu’en ligne. Attendre une grosse main, c’est laisser ton tapis fondre.'] },
      { ask: 'Comment jouent les tables de club ?', h: 'Les tendances d’une table de club', p: ['Plus de limps, plus de payes, des relances souvent petites (2 BB), peu de sur-relances en bluff. Une relance ou une grosse mise d’un récréatif, c’est souvent une vraie main.', 'Ajustements : isole les limpers (chapitre 7), mise gros pour la valeur, réduis tes bluffs, respecte les grosses mises.'] },
      { ask: 'Et les règles à respecter ?', h: 'L’étiquette et la procédure', p: ['Parle à ton tour. Annonce clairement « relance » avant de bouger tes jetons, ou pose le montant en une seule fois : sinon, la mise peut être comptée comme un simple call.', 'Ne commente pas un coup en cours, ne montre pas tes cartes à un voisin, garde tes cartes visibles sur la table.'] },
      { ask: 'Peut-on lire les joueurs ?', h: 'La lecture physique', p: ['Les indices les plus fiables sont le temps de réflexion et les habitudes de mise, plus que les gestes. Un joueur qui paie très vite a souvent une main moyenne ; une longue réflexion puis une grosse mise, souvent une vraie main chez un récréatif.', 'Note après chaque soirée trois choses sur les habitués : largeur de jeu, agressivité, une habitude marquante.'] }
    ],
    mistake: 'Jouer au club comme en ligne en attendant les grosses mains : au rythme du club, les blindes te rattrapent avant.',
    retain: ['Au club, environ 8 à 10 mains par niveau de 20 minutes : vole et défends plus tôt.', 'Tables de club : isole, mise pour la valeur, bluffe moins.', 'Annonce « relance » ou pose le montant en une fois.'],
    quiz: [
      { q: 'Combien de mains par heure environ à une table de club ?', o: ['10', '25 à 30', '60 à 80', '150'], a: 1, why: 'Le jeu live est bien plus lent qu’en ligne.' },
      { q: 'Niveaux de 20 minutes au club : combien de mains par niveau environ ?', o: ['3', '8 à 10', '25', '50'], a: 1, why: 'Environ un tiers de 25 à 30 mains par heure.' },
      { q: 'Contre une table de club qui paie beaucoup, ton arme principale ?', o: ['Le bluff', 'La valeur', 'Le limp', 'Le check'], a: 1, why: 'Ils paient : on mise pour la valeur.' },
      { q: 'Tu veux relancer : comment éviter qu’on compte un call ?', o: ['Poser les jetons en plusieurs fois', 'Annoncer « relance » ou poser le montant en une fois', 'Ne rien dire', 'Montrer ses cartes'], a: 1, why: 'C’est la règle de la mise en une seule fois.' }
    ]
  };

  L[4] = {
    minutes: 8,
    key: ['La bankroll est l’argent réservé au poker ; elle doit encaisser les longues séries sans gain, qui sont normales.', 'En tournoi, on vise 100 à 200 buy-ins, et on change de niveau selon des règles fixées à l’avance.'],
    sections: [
      { ask: 'Combien faut-il ?', h: 'Les repères par format', p: ['Tournois multi-tables : 100 à 200 buy-ins, car on peut rester longtemps sans place payée. Sit & Go : 50 à 100 buy-ins. Exemple : pour des tournois à 10 €, une bankroll de 1 000 à 2 000 €.', 'Ces repères visent un risque de ruine faible : la probabilité de tout perdre en étant pourtant un joueur gagnant.'] },
      { ask: 'Les mauvaises séries sont-elles normales ?', h: 'La variance', p: ['Oui. En MTT, même un bon joueur peut enchaîner 30, 50 tournois, voire plus, sans grosse place payée : la majorité des gains vient de quelques résultats rares.', 'Une série sans gain ne prouve pas que tu joues mal ; c’est la revue de tes décisions (chapitre 30) qui le dit, pas le résultat.'] },
      { ask: 'Quand monter ou descendre de niveau ?', h: 'Les règles de paliers', p: ['Fixe-les à froid. Par exemple : monter au niveau supérieur quand la bankroll atteint 150 buy-ins de ce niveau, redescendre si elle tombe sous 80 buy-ins.', 'Les réinscriptions (re-entry) comptent comme de nouveaux buy-ins : une soirée à trois entrées coûte trois buy-ins.'] },
      { ask: 'Quels signaux d’alerte ?', h: 'Les signes d’alerte', p: ['Jouer pour « se refaire », monter de niveau après une perte, piocher hors de la bankroll, jouer fatigué ou énervé : ce sont les premiers signes de tilt (chapitre 29). Dans ces cas, on arrête la session.'] }
    ],
    mistake: 'Monter de niveau pour se refaire après une mauvaise série : c’est le chemin le plus court vers la ruine.',
    retain: ['MTT : 100 à 200 buy-ins ; Sit & Go : 50 à 100.', 'Les longues séries sans gain sont normales en tournoi.', 'Règles de montée et de descente fixées à froid ; les re-entries comptent.'],
    quiz: [
      { q: 'Tournois à 10 € : bankroll conseillée ?', o: ['100 €', '300 €', '1 000 à 2 000 €', '10 000 €'], a: 2, why: '100 à 200 buy-ins en MTT.' },
      { q: '40 tournois sans place payée prouvent que…', o: ['tu joues mal', 'rien à eux seuls : la variance est forte', 'il faut monter de niveau', 'il faut arrêter le poker'], a: 1, why: 'Il faut juger les décisions, pas les résultats.' },
      { q: 'Une soirée avec deux re-entries à 10 € coûte…', o: ['10 €', '20 €', '30 €', '0 €'], a: 2, why: 'Chaque entrée est un buy-in.' },
      { q: 'Après une grosse perte, tu…', o: ['montes de niveau pour te refaire', 'appliques tes règles fixées à froid', 'pioches hors bankroll', 'joues toute la nuit'], a: 1, why: 'Les règles servent justement dans ces moments.' }
    ]
  };

  L[10] = {
    minutes: 9,
    key: ['Toute décision de paye se résume à comparer ton équité à l’équité requise par la cote.', 'Compter ses outs donne l’équité : environ 2 % par out pour une carte, 4 % pour deux cartes.'],
    sections: [
      { ask: 'C’est quoi un out ?', h: 'Compter ses outs', p: ['Un out est une carte qui te donne probablement la meilleure main. Tirage couleur : 9 outs. Tirage quinte par les deux bouts : 8. Tirage ventral : 4. Deux overcards : environ 6.', 'Attention aux outs « sales » : une carte qui complète ton tirage mais donne une meilleure main à l’adversaire ne compte pas.'] },
      { ask: 'Comment passer des outs aux pourcentages ?', h: 'La règle du 2 et du 4', p: ['Avec une carte à venir : outs × 2 % environ (exactement outs ÷ 46 à la turn). Avec deux cartes à venir et un tapis engagé : outs × 4 % environ.', 'Exemple : tirage couleur au flop, 9 outs : environ 36 % pour la toucher d’ici la river, 18 % à la turn seulement.'] },
      { ask: 'Et la cote du pot ?', h: 'L’équité requise', p: ['Équité requise = mise à payer ÷ pot final (pot + mise adverse + ta paye). Face à une mise de la moitié du pot : 25 %. Face au pot : 33 %.', 'Exemple : pot 1 000, il mise 500. Tu paies 500 pour un pot final de 2 000 : il te faut 25 %. Avec un tirage couleur à la turn (environ 19,6 %), la paye directe n’est pas rentable.'] },
      { ask: 'Et les gains futurs ?', h: 'Cotes implicites et équité réalisée', p: ['Les cotes implicites, ce sont les jetons que tu gagneras plus tard quand tu toucheras : si l’adversaire paiera une grosse mise à la river, une paye un peu chère devient rentable.', 'L’équité réalisée, c’est la part de ton équité que tu encaisses vraiment : en position, tu la réalises mieux ; hors position, une partie se perd parce que tu dois parfois te coucher.'] }
    ],
    mistake: 'Compter des outs qui donnent la main à l’adversaire, comme la couleur qui complète aussi une couleur plus haute.',
    retain: ['Outs × 2 % pour une carte, × 4 % pour deux cartes (si le tapis est engagé).', 'Équité requise = paye ÷ pot final.', 'Cotes implicites et position améliorent une paye limite.'],
    quiz: [
      { q: 'Combien d’outs pour un tirage couleur ?', o: ['4', '8', '9', '15'], a: 2, why: '13 cartes de la couleur moins les 4 visibles.' },
      { q: 'Tirage quinte par les deux bouts, une carte à venir. Équité environ ?', o: ['8 %', '16 %', '32 %', '50 %'], a: 1, why: '8 outs × 2 %.' },
      { q: 'Pot 1 000, il mise 500. Équité requise ?', o: ['20 %', '25 %', '33 %', '50 %'], a: 1, why: '500 ÷ 2 000.' },
      { q: 'Les cotes implicites, ce sont…', o: ['les jetons déjà dans le pot', 'les gains futurs si tu touches', 'les blindes', 'la prime PKO'], a: 1, why: 'Ce que tu gagneras ensuite.' },
      { q: 'Où réalises-tu le mieux ton équité ?', o: ['Hors position', 'En position', 'Pareil', 'Jamais'], a: 1, why: 'Tu vois avant de décider.' }
    ]
  };

  L[11] = {
    minutes: 8,
    key: ['Lire un board, c’est se demander qui a le plus de mains fortes sur ces trois cartes : toi ou ton adversaire.', 'La texture (sèche, connectée, monotone, pairée) décide de la fréquence et de la taille des mises.'],
    sections: [
      { ask: 'Quelles sont les textures ?', h: 'Les quatre textures', p: ['Sèche : cartes éloignées, couleurs différentes (K♠ 7♦ 2♣). Peu de tirages, les mains changent peu.', 'Connectée : cartes proches (9♥ 8♣ 7♦), beaucoup de quintes possibles. Monotone : trois cartes de la même couleur. Pairée : une paire au tableau (8♠ 8♦ 3♣).'] },
      { ask: 'Qui est avantagé ?', h: 'L’avantage de range', p: ['Le relanceur a plus de paires hautes et d’as-figures : les boards avec as ou roi l’avantagent. Le défenseur en grosse blinde a plus de petites cartes connectées : les boards bas et connectés l’avantagent.', 'L’avantage des nuts, c’est avoir plus de mains très fortes. Sur un board haut, le relanceur l’a presque toujours, ce qui l’autorise à miser souvent.'] },
      { ask: 'Et concrètement ?', h: 'Ce que ça change', p: ['Board sec avec carte haute : mise souvent et petit. Board connecté bas : checke plus, mise plus gros quand tu mises. Board monotone : ralentis sans la couleur. Board pairé : peu de mains ont touché, petites mises fréquentes.'] }
    ],
    mistake: 'Miser de la même façon sur tous les boards, sans se demander qui a le plus de mains fortes.',
    retain: ['Quatre textures : sèche, connectée, monotone, pairée.', 'Boards hauts pour le relanceur, boards bas et connectés pour la grosse blinde.', 'Avantage des nuts : celui qui a le plus de mains très fortes peut miser gros.'],
    quiz: [
      { q: 'Quel board est sec ?', o: ['9♥ 8♣ 7♦', 'K♠ 7♦ 2♣', '6♥ 5♥ 4♥', 'J♠ T♠ 9♦'], a: 1, why: 'Cartes éloignées, couleurs différentes.' },
      { q: 'Quel board favorise la grosse blinde ?', o: ['A♠ K♦ 3♣', '7♥ 6♣ 5♦', 'K♠ Q♦ 2♣', 'A♥ A♣ 8♦'], a: 1, why: 'Bas et connecté : plus de mains de la BB.' },
      { q: 'Sur un board monotone sans la couleur, tu…', o: ['mises gros', 'ralentis', 'fais tapis', 'surmises'], a: 1, why: 'Beaucoup de mains te battent ou ont un gros tirage.' },
      { q: 'L’avantage des nuts, c’est…', o: ['avoir la meilleure main', 'avoir plus de mains très fortes dans sa range', 'avoir la position', 'avoir le plus de jetons'], a: 1, why: 'C’est une notion de range.' }
    ]
  };

  L[13] = {
    minutes: 10,
    key: ['La taille d’une mise fixe le prix que paie l’adversaire et la part de bluffs que tu peux te permettre.', 'Elle dépend du board, de la position, de la profondeur et de l’adversaire, jamais de la force de ta main.'],
    sections: [
      { ask: 'Quels sont les chiffres à connaître ?', h: 'Les maths du sizing', p: ['Pour une mise B (en fraction du pot) : équité requise pour payer = B ÷ (1 + 2B) ; défense minimale = 1 ÷ (1 + B) ; part de bluffs équilibrée = B ÷ (1 + 2B).', 'Repères : un tiers du pot, 20 % et 75 % ; la moitié, 25 % et 67 % ; le pot, 33 % et 50 % ; deux fois le pot, 40 % et 33 %.'] },
      { ask: 'Quelle taille au flop ?', h: 'Selon la texture', p: ['Board sec et haut : un quart à un tiers du pot. Board connecté ou à tirages : deux tiers du pot. Board pairé : un quart à un tiers.', 'À plusieurs adversaires : plutôt la moitié à deux tiers.'] },
      { ask: 'Comment arriver au tapis ?', h: 'Le sizing géométrique', p: ['Avec une main très forte, choisis une taille constante qui t’amène au tapis en trois mises. Exemple : pot de 10 BB, 90 BB derrière : environ 83 % du pot à chaque rue donne 8,3 BB au flop, 22 BB à la turn, puis les 59 BB restants à la river.', 'Plus le SPR est bas, plus les tailles peuvent être grandes : à SPR 2, une surmise met simplement tapis.'] },
      { ask: 'Pourquoi ne pas adapter la taille à ma main ?', h: 'Une taille qui ne trahit pas ta main', p: ['Si tu mises petit avec tes bluffs et gros avec ta valeur, un adversaire attentif te lit. Choisis la taille selon le board, et mets dans cette taille à la fois des mains fortes et des bluffs.', 'Exception : contre les récréatifs qui ne lisent pas les tailles, grossis tes mises de valeur (chapitre 27).'] }
    ],
    mistake: 'Miser petit avec les bluffs et gros avec les mains fortes : les tailles deviennent un panneau indicateur.',
    retain: ['Équité requise = B ÷ (1 + 2B) ; défense minimale = 1 ÷ (1 + B).', 'Board sec : petit ; board à tirages : gros.', 'Taille selon le board, pas selon la main (sauf contre les récréatifs).'],
    quiz: [
      { q: 'Mise de la moitié du pot : équité requise pour payer ?', o: ['20 %', '25 %', '33 %', '50 %'], a: 1, why: '0,5 ÷ 2 = 25 %.' },
      { q: 'Mise d’un tiers du pot : défense minimale ?', o: ['50 %', '67 %', '75 %', '90 %'], a: 2, why: '1 ÷ (1 + 1/3) = 75 %.' },
      { q: 'Taille de c-bet sur J♥ T♥ 8♣ ?', o: ['Un quart', 'Deux tiers du pot', 'Rien', 'Deux fois le pot'], a: 1, why: 'Board à tirages : on fait payer cher.' },
      { q: 'Pourquoi garder une même taille pour valeur et bluffs ?', o: ['Pour aller plus vite', 'Pour ne pas être lisible', 'C’est la règle', 'Pour gagner moins'], a: 1, why: 'Sinon la taille révèle ta main.' }
    ]
  };

  L[16] = {
    minutes: 10,
    key: ['À la river, chaque main est de valeur, bluff-catcher ou bluff : la décision dépend de ce classement.', 'On mise pour la valeur si l’on bat la moitié des mains qui paient ; on bluffe avec les mains sans valeur qui bloquent ses payes.'],
    sections: [
      { ask: 'Comment classer sa main à la river ?', h: 'Valeur, bluff-catcher, bluff', p: ['Valeur : ta main bat la plupart des mains qui paieront. Bluff-catcher : elle bat les bluffs mais perd contre la valeur, donc tu checkes et tu décides si tu paies. Bluff : elle ne gagne presque jamais au showdown.'] },
      { ask: 'Quand miser pour la valeur ?', h: 'La valeur, fine ou forte', p: ['Mise si tu bats plus de la moitié des mains qui paient. Valeur fine : contre un joueur qui paie large, une petite mise (25 à 40 % du pot) avec top paire moyenne rapporte ce que le check laisse passer.', 'Valeur forte : avec une très grosse main sur un board effrayant, mise deux tiers du pot à une surmise.'] },
      { ask: 'Avec quoi bluffer ?', h: 'Choisir ses bluffs', p: ['Les meilleurs bluffs sont des tirages manqués qui bloquent ses payes : l’as de pique sur un board à trois piques retire ses couleurs à l’as.', 'Part de bluffs pour une mise : B ÷ (1 + 2B). Au pot : un tiers de bluffs, soit 2 mains de valeur pour 1 bluff.'] },
      { ask: 'Payer ou se coucher ?', h: 'Le bluff-catcher', p: ['Calcule l’équité requise (au pot, 33 %), puis demande-toi combien de bluffs sa ligne contient. Un nit qui mise gros à la river après avoir payé deux rues en contient très peu : couche-toi. Un large-agressif en contient beaucoup : paie plus large.'] }
    ],
    mistake: 'Bluffer à la river avec une paire moyenne qui gagnait souvent au check : tu transformes une main qui gagne en main qui perd.',
    retain: ['River : valeur, bluff-catcher ou bluff.', 'Valeur fine contre ceux qui paient large ; bluffs avec bloqueurs.', 'Bluff-catcher : compare l’équité requise aux bluffs réels du profil.'],
    quiz: [
      { q: 'Une paire moyenne à la river qui bat les bluffs mais pas la valeur est…', o: ['une main de valeur', 'un bluff-catcher', 'un bluff', 'une main nulle'], a: 1, why: 'Elle attrape les bluffs.' },
      { q: 'Meilleur bluff à la river sur un board à trois piques ?', o: ['Une paire', 'Un tirage manqué avec l’as de pique', 'Une couleur', 'Une quinte'], a: 1, why: 'L’as de pique bloque les meilleures couleurs.' },
      { q: 'Mise au pot à la river : part de bluffs équilibrée ?', o: ['10 %', '25 %', '33 %', '50 %'], a: 2, why: '1 ÷ 3.' },
      { q: 'Un nit mise gros à la river. Avec un bluff-catcher, tu…', o: ['paies', 'te couches le plus souvent', 'relances', 'fais tapis'], a: 1, why: 'Peu de bluffs dans sa range.' }
    ]
  };

  L[20] = {
    minutes: 8, range: { type: 'open', pos: 'CO', bb: 30 },
    key: ['Entre 25 et 40 BB, les limps disparaissent et la sur-relance devient le plus souvent un tapis.', 'On ouvre un peu plus serré en début de table et plus petit, pour garder de la place derrière.'],
    sections: [
      { ask: 'Qu’est-ce qui change sous 40 BB ?', h: 'La transition', p: ['À 30 BB, une ouverture à 2 BB puis une paye de 3-bet engagent déjà le tiers du tapis. Les coups à plusieurs rues avec une main moyenne deviennent dangereux : on choisit entre un vrai engagement et le fold.', 'Profil TAG à 20-40 BB : UTG environ 12 % des mains, CO 25 %, bouton 35 %.'] },
      { ask: 'Et face à une ouverture ?', h: 'Le 3-bet devient un tapis', p: ['Un 3-bet à 7 BB avec 30 BB de tapis te laisse sans bonne option face à un tapis adverse. On préfère le tapis direct (re-shove) avec la valeur et quelques mains à bloqueurs, comme A5s ou KJs.', 'C’est le resteal : contre un voleur au CO ou au bouton, le tapis de 25 BB gagne souvent le pot sans abattage.'] },
      { ask: 'Comment mesurer la pression des blindes ?', h: 'Les zones de M', p: ['Le M de Harrington : ton tapis divisé par le coût d’un tour de table (petite blinde + grosse blinde + antes). Avec la BB ante, un tour coûte 2,5 BB : un tapis de 30 BB donne M = 12.', 'Zone verte (M ≥ 20) : jeu normal. Jaune (10 à 20) : on vole davantage. Orange (6 à 10) : tapis ou fold. Rouge (5 et moins) : tapis avec une large range dès que personne n’a ouvert.'] }
    ],
    mistake: 'Faire un petit 3-bet à 30 BB puis se coucher face au tapis : tu as perdu 20 % de ton tapis sans voir de flop.',
    retain: ['À 25-40 BB, les ouvertures se resserrent un peu en début de table.', 'Le 3-bet devient un tapis (resteal) contre les voleurs.', 'M = tapis ÷ coût d’un tour ; zones verte, jaune, orange, rouge.'],
    quiz: [
      { q: 'Avec la BB ante, un tapis de 25 BB donne un M de…', o: ['5', '10', '25', '62'], a: 1, why: '25 ÷ 2,5 = 10.' },
      { q: 'Zone orange (M de 6 à 10) : tu joues…', o: ['normalement', 'tapis ou fold', 'en limpant', 'en payant'], a: 1, why: 'Le tapis devient la seule arme efficace.' },
      { q: 'À 30 BB face à une ouverture du bouton, avec A5s, une bonne option est…', o: ['le petit 3-bet', 'le tapis (resteal)', 'le limp', 'la paye systématique'], a: 1, why: 'A5s bloque les as et garde de l’équité.' },
      { q: 'Pourquoi éviter le petit 3-bet à 30 BB ?', o: ['Il est trop cher', 'Il te laisse sans bonne option face au tapis adverse', 'Il est interdit', 'Il fait peur'], a: 1, why: 'Tu engages une grosse part de ton tapis puis tu dois te coucher.' }
    ]
  };

  L[21] = {
    minutes: 9,
    key: ['Entre 15 et 25 BB, chaque ouverture est presque un engagement : on choisit entre ouvrir puis tapis ou fold, le tapis direct, et le fold.', 'Face à une ouverture, on relance tapis avec une range étroite contre le début de table, plus large contre les voleurs.'],
    sections: [
      { ask: 'Quelles options quand personne n’a ouvert ?', h: 'Les trois options', p: ['Tapis direct : vers 15 BB et moins en fin de table (tables du chapitre 22). Ouverture à 2 BB puis tapis ou fold : de 18 à 25 BB. Fold : les mains marginales en début de table.', 'Se coucher après avoir ouvert face à un tapis, c’est le prix normal de la fold equity, pas une erreur.'] },
      { ask: 'Et face à une ouverture ?', h: 'Le re-shove', p: ['À 15 BB, face à une ouverture de début de table, on relance tapis avec 3 à 4 % des mains seulement (99+, AQs+, AKo). Face à une ouverture tardive (CO, bouton, SB), 12 à 21 % (par exemple 44+, A9s+, KTs+, QJs, ATo+, KQo).', 'L’ouvreur, lui, paie souvent : à 15 BB, il paie 47 à 66 % de sa range d’ouverture face à un re-shove.'] },
      { ask: 'Et les coups spéciaux ?', h: 'Stop-and-go et limp-shove', p: ['Stop-and-go : tu paies un 3-bet hors position avec l’intention de faire tapis au flop quoi qu’il arrive. Utile avec 10-15 BB quand la paye préflop est presque forcée.', 'Limp-shove : en début de table avec une très grosse main, tu limpes pour faire tapis sur une relance. Rare, et lisible si tu ne limpes jamais autrement.'] }
    ],
    mistake: 'Ouvrir à 2 BB avec 16 BB puis payer un tapis avec une main moyenne : il fallait soit pousser directement, soit se coucher.',
    retain: ['15-25 BB : tapis direct, ouverture puis tapis ou fold, ou fold.', 'Re-shove étroit contre le début de table, large contre le bouton et la SB.', 'Stop-and-go et limp-shove : rares, situations précises.'],
    quiz: [
      { q: 'À 15 BB, re-shove face à une ouverture UTG avec…', o: ['A9s', '99+, AQs+, AKo', 'toutes les paires', 'K9o'], a: 1, why: 'Contre une range forte, seule la crème se pousse.' },
      { q: 'Après avoir ouvert, se coucher face à un tapis avec une main moyenne est…', o: ['une erreur', 'le prix normal de la fold equity', 'interdit', 'toujours mauvais'], a: 1, why: 'Ta range d’ouverture n’est pas faite pour payer entièrement.' },
      { q: 'Le stop-and-go consiste à…', o: ['limper puis se coucher', 'payer le 3-bet puis pousser au flop', 'pousser préflop', 'checker deux rues'], a: 1, why: 'Tu reprends l’initiative au flop.' },
      { q: 'À 22 BB au CO avec une main correcte, l’option la plus courante est…', o: ['limp', 'ouverture à 2 BB puis tapis ou fold', 'tapis direct', 'fold toujours'], a: 1, why: 'De 18 à 25 BB, on garde l’ouverture minimale.' }
    ]
  };

  L[22] = {
    minutes: 7, range: { type: 'open', pos: 'BTN', bb: 10 },
    key: ['Sous 15 BB, chaque décision se résume à pousser ou se coucher : des tables d’équilibre donnent la bonne range par position.', 'Plus on est tard et plus le tapis est court, plus on pousse large.'],
    sections: [
      { ask: 'D’où viennent ces tables ?', h: 'Les tables d’équilibre', p: ['Elles ont été calculées pour le cours : équités des 169 mains, puis équilibre où personne ne peut gagner en changeant seul sa stratégie. Hypothèses : neuf joueurs, tapis égaux, ante de 0,125 BB par joueur, calcul en jetons (sans ICM).', 'Dans l’appli, elles sont dans « Ma range » : choisis « Moins de 20 BB », puis la profondeur, de 15 à 3 BB.'] },
      { ask: 'Quelques repères à retenir ?', h: 'Des repères', p: ['À 15 BB : UTG pousse 9 % des mains, le bouton 38 %, la SB 65 %. À 10 BB : UTG 19 %, CO 36 %, bouton 48 %, SB 78 %.', 'Pour payer à 10 BB : la BB paie un tapis de la SB avec 64 % des mains, un tapis du bouton avec 45 %, un tapis UTG avec 26 %.'] },
      { ask: 'Faut-il les appliquer telles quelles ?', h: 'Les limites', p: ['Ce sont des ranges d’équilibre : contre un joueur qui paie trop peu, pousse plus large ; contre un joueur qui paie tout, resserre.', 'Près d’une bulle ou en table finale, l’ICM resserre surtout tes payes (chapitre 23) ; tes tapis en premier restent proches des tables.'] }
    ],
    mistake: 'Attendre une « vraie main » avec 8 BB en fin de table : chaque tour de blindes coûte plus de 30 % de ton tapis.',
    retain: ['Sous 15 BB : tapis ou fold.', '10 BB : bouton 48 %, SB 78 % ; la BB paie la SB avec 64 %.', 'Ajuste à l’adversaire et à l’ICM : payes plus serrées près des paliers.'],
    quiz: [
      { q: 'À 10 BB, part des mains poussées au bouton (équilibre) ?', o: ['19 %', '36 %', '48 %', '78 %'], a: 2, why: 'Selon les tables du cours.' },
      { q: 'À 10 BB, la BB paie un tapis de la SB avec…', o: ['26 %', '45 %', '64 %', '90 %'], a: 2, why: 'La SB pousse très large en face-à-face.' },
      { q: 'Contre un joueur qui paie trop peu, tu pousses…', o: ['plus serré', 'plus large', 'pareil', 'jamais'], a: 1, why: 'Ta fold equity augmente.' },
      { q: 'Ces tables tiennent-elles compte de l’ICM ?', o: ['Oui', 'Non, elles sont en jetons'], a: 1, why: 'Il faut les ajuster près des paliers.' }
    ]
  };

  L[25] = {
    minutes: 10, sit: 'pko',
    key: ['En PKO, éliminer un joueur rapporte de l’argent tout de suite : sa prime se convertit en jetons et améliore ta cote.', 'La prime ne compte que si tu couvres l’adversaire.'],
    sections: [
      { ask: 'Comment fonctionne un PKO ?', h: 'Le principe', p: ['Une partie du buy-in forme la prime de chaque joueur. Quand tu élimines quelqu’un, tu encaisses la moitié de sa prime ; l’autre moitié s’ajoute à ta propre prime.', 'Exemple : buy-in 10 €, 5 € de prix et 5 € de prime. Éliminer un joueur à 5 € de prime te rapporte 2,50 € tout de suite.'] },
      { ask: 'Comment convertir une prime en jetons ?', h: 'La conversion', p: ['Jetons par euro = tapis de départ ÷ part du buy-in qui va aux prix. Avec 20 000 jetons pour 5 € de prix : 4 000 jetons par euro. Une prime encaissée de 2,50 € vaut donc environ 10 000 jetons.', 'Équité requise = paye ÷ (pot final + prime en jetons). La prime fait baisser l’équité nécessaire.'] },
      { ask: 'Un exemple chiffré ?', h: 'Exemple', p: ['Blindes 300/600, ante 600. Le CO pousse 6 000 jetons, il a 5 € de prime, tu le couvres en grosse blinde. Sans prime, il te faudrait environ 42 % ; avec les 10 000 jetons de prime, environ 24 %. Contre sa range de tapis, beaucoup de mains moyennes deviennent des payes rentables.', 'Plus tard dans le tournoi, quand les blindes sont plus grosses, la même prime pèse moins lourd en jetons : son effet diminue.'] },
      { ask: 'Et le Space KO ?', h: 'Space KO et ICM', p: ['En Space KO, la prime est tirée au sort au moment de l’élimination : on raisonne avec la valeur moyenne.', 'Près de la bulle, la prime pousse à payer et l’ICM à se coucher : les deux effets se compensent en partie. Avec un tapis moyen à la bulle, reste prudent sauf si la prime est grosse.'] }
    ],
    mistake: 'Payer large pour une prime alors que tu ne couvres pas l’adversaire : si tu perds, tu es éliminé, et il n’y a pas de prime à gagner.',
    retain: ['Prime encaissée en PKO = moitié de la prime.', 'Jetons par euro = tapis de départ ÷ part prix du buy-in ; équité requise = paye ÷ (pot final + prime en jetons).', 'La prime ne compte que si tu couvres l’adversaire.'],
    quiz: [
      { q: 'Buy-in 10 € (5 € de prix), 20 000 jetons au départ. Combien de jetons par euro ?', o: ['2 000', '4 000', '10 000', '20 000'], a: 1, why: '20 000 ÷ 5.' },
      { q: 'En PKO, éliminer un joueur à 8 € de prime rapporte tout de suite…', o: ['8 €', '4 €', '2 €', '0 €'], a: 1, why: 'La moitié est encaissée.' },
      { q: 'La prime compte dans ta cote si…', o: ['tu es couvert', 'tu couvres l’adversaire', 'toujours', 'jamais'], a: 1, why: 'Sinon, tu ne peux pas l’éliminer.' },
      { q: 'Plus les blindes montent, l’effet de la prime en jetons…', o: ['augmente', 'diminue', 'reste le même', 'disparaît d’un coup'], a: 1, why: 'Les pots grossissent, la prime pèse moins.' }
    ]
  };

  L[26] = {
    minutes: 8,
    key: ['Chaque adversaire s’écarte de l’équilibre dans un sens précis : le repérer, c’est savoir comment l’exploiter.', 'Huit profils suffisent pour classer presque tous les joueurs.'],
    sections: [
      { ask: 'Quelles statistiques regarder ?', h: 'Les statistiques de base', p: ['VPIP : part des mains où il met volontairement des jetons (largeur de jeu). PFR : part des mains où il relance avant le flop (agressivité). L’écart entre les deux mesure la passivité.', 'Ensuite : fréquence de 3-bet, abandon face au c-bet, agressivité après le flop, fréquence d’abattage.'] },
      { ask: 'Quels sont les huit profils ?', h: 'Les huit profils de l’appli', p: ['Nit (environ 10/8) : vole-le, couche-toi face à sa force. Régulier (18/15) : joue standard. Large-agressif (28/22) : paie plus large, piège. Large-passif (35/10) : isole et mise. Calling station (40/6) : valeur, jamais de bluff. Maniac (45+/35+) : laisse-le bluffer. Récréatif fantasque (variable) : reste simple, lis ses tailles. Survivant (12/10) : vole-le à la bulle.', 'Les chiffres sont VPIP/PFR. Les mêmes profils jouent dans « Jouer une partie » et serviront au tracker.'] },
      { ask: 'Combien de mains pour juger ?', h: 'La taille de l’échantillon', p: ['30 à 50 mains donnent une première idée du VPIP, jamais une certitude. Le PFR et surtout les statistiques après le flop demandent beaucoup plus de mains.', 'Au club, les cartes montrées au showdown sont la meilleure information : note avec quoi un joueur a relancé ou payé, et depuis quelle position.'] }
    ],
    mistake: 'Classer un joueur après dix mains et ne plus jamais réviser son jugement.',
    retain: ['VPIP = largeur, PFR = agressivité, l’écart = passivité.', 'Huit profils, un ajustement principal chacun.', '30 à 50 mains pour une première idée ; les showdowns valent de l’or.'],
    quiz: [
      { q: 'Un joueur à 40/6 est plutôt…', o: ['un nit', 'une calling station', 'un maniac', 'un régulier'], a: 1, why: 'Il joue beaucoup et relance peu.' },
      { q: 'Un grand écart entre VPIP et PFR signifie…', o: ['agressivité', 'passivité', 'jeu serré', 'bluffs'], a: 1, why: 'Il paie beaucoup plus qu’il ne relance.' },
      { q: 'Contre un nit, ton ajustement principal ?', o: ['Le bluffer souvent et respecter ses grosses mises', 'Le payer toujours', 'Ne jamais jouer', 'Le 4-bet bluff'], a: 0, why: 'Il se couche trop et ne mise gros qu’avec la valeur.' },
      { q: 'Combien de mains pour une première idée du VPIP ?', o: ['5', '30 à 50', '1 000', '10 000'], a: 1, why: 'Une première idée, pas une certitude.' }
    ]
  };

  L[28] = {
    minutes: 7,
    key: ['Ton image de table, c’est ce que les autres croient de toi : elle se dépense en bluffant et se reconstruit en jouant solide.', 'Au club, les indices les plus fiables sont le temps de réflexion et les habitudes de mise.'],
    sections: [
      { ask: 'Comment se forme mon image ?', h: 'L’image', p: ['Les mains montrées pèsent le plus : un bluff montré fait de toi un bluffeur pour plusieurs tours. La fréquence de jeu compte aussi : si tu joues une main sur dix, on te croit serré.', 'Avec une image serrée, vole plus et mise ta valeur plus petit. Avec une image agressive, mise ta valeur plein pot et bluffe moins.'] },
      { ask: 'Et la lecture physique ?', h: 'Les indices au club', p: ['Fiables : le temps de décision (une paye immédiate, souvent une main moyenne ou un tirage), les tailles de mise habituelles, les changements de rythme.', 'Peu fiables seuls : les gestes et l’attitude, que beaucoup de joueurs simulent. Un indice ne remplace jamais la lecture de range ; il la confirme.'] },
      { ask: 'Et moi, comment rester neutre ?', h: 'Tes propres signaux', p: ['Prends le même temps pour tes décisions faciles et difficiles, mise toujours de la même manière, et ne commente pas tes mains. Le plus simple : une routine identique à chaque décision.'] }
    ],
    mistake: 'Bluffer juste après avoir été pris en bluff au showdown : toute la table te paie.',
    retain: ['L’image se dépense en bluffant, se reconstruit en jouant solide.', 'Indices fiables : temps de décision et habitudes de mise.', 'Une routine identique à chaque décision te rend illisible.'],
    quiz: [
      { q: 'Tu viens de montrer un bluff. Tes prochaines mises de valeur…', o: ['seront moins payées', 'seront plus payées', 'ne changent rien', 'sont interdites'], a: 1, why: 'On te croit bluffeur : on te paie.' },
      { q: 'Indice le plus fiable au club ?', o: ['Les mains qui tremblent', 'Le temps de décision et les habitudes de mise', 'Le regard', 'La tenue'], a: 1, why: 'Plus difficile à simuler.' },
      { q: 'Avec une image très serrée, tu…', o: ['voles plus', 'voles moins', 'paies tout', 'limpes'], a: 0, why: 'On se couche face à tes relances.' }
    ]
  };

  L[29] = {
    minutes: 8,
    key: ['Le tilt est une perte de jugement causée par une émotion : on le reconnaît à ses signes avant qu’il coûte cher.', 'Des outils simples, préparés à froid, l’arrêtent : pause, limite de perte, routine.'],
    sections: [
      { ask: 'Quels sont les types de tilt ?', h: 'Les familles de tilt', p: ['Le tilt d’injustice (après une mauvaise carte), le tilt de perte (vouloir se refaire), le tilt de revanche (contre un joueur précis), le tilt de fatigue, et même le tilt de victoire (se croire invincible après un gros gain).'] },
      { ask: 'Comment le repérer ?', h: 'Les signes', p: ['Tu joues plus vite, tu paies des mains que tu jetterais d’habitude, tu cherches à punir un joueur, tu sors de ta range. Note tes trois signes personnels : ce sont tes alarmes.'] },
      { ask: 'Que faire ?', h: 'Les outils', p: ['Avant la session : une limite de perte (par exemple trois buy-ins) et une durée maximale. Pendant : une pause de cinq minutes dès qu’un signe apparaît, trois respirations lentes avant chaque grosse décision.', 'Après : écris la main qui t’a énervé et analyse la décision, pas le résultat (chapitre 30). Ta range du livre est ton garde-fou : si tu t’en écartes sans raison, tu es en tilt.'] }
    ],
    mistake: 'Continuer à jouer « pour se refaire » après une mauvaise carte : c’est exactement le moment où les décisions sont les pires.',
    retain: ['Injustice, perte, revanche, fatigue, victoire : cinq familles de tilt.', 'Connais tes trois signes personnels.', 'Limite de perte, pauses et routine, décidées à froid.'],
    quiz: [
      { q: 'Vouloir se refaire après une perte, c’est…', o: ['de la stratégie', 'un tilt de perte', 'normal et sans risque', 'une bonne idée'], a: 1, why: 'C’est l’un des tilts les plus coûteux.' },
      { q: 'Premier réflexe quand un signe de tilt apparaît ?', o: ['Jouer plus vite', 'Faire une pause', 'Monter de niveau', 'Payer plus'], a: 1, why: 'La pause casse l’enchaînement émotionnel.' },
      { q: 'Quand fixer sa limite de perte ?', o: ['Après avoir perdu', 'Avant la session, à froid', 'Jamais', 'Au milieu de la session'], a: 1, why: 'À froid, le jugement est intact.' }
    ]
  };

  L[31] = {
    minutes: 10,
    key: ['Une main se relit en quatre temps : préflop, flop, turn, river, en se demandant à chaque fois quelle est la range de chacun.', 'Voici cinq mains typiques de tournoi, du préflop à la river.'],
    sections: [
      { ask: 'Première main ?', h: 'Main 1 : AQo en UTG', p: ['100 BB, tu es UTG avec A♠ Q♦. Tu ouvres à 2 BB (la main est dans toutes les ranges). Le bouton paie. Flop Q♣ 8♥ 3♦ : top paire bon kicker sur board sec, c-bet d’un tiers du pot, il paie.', 'Turn 2♠ : carte blanche, tu mises encore deux tiers pour la valeur. River 9♣ : un récréatif paie souvent avec une dame plus faible ou un 8 : mise la moitié du pot. Leçon : la main qu’on a peur d’ouvrir est une machine à valeur.'] },
      { ask: 'Deuxième main ?', h: 'Main 2 : défense de grosse blinde', p: ['Le bouton ouvre à 2 BB, tu as K♥ 9♦ en grosse blinde. Il te faut 22 % d’équité : tu paies. Flop 9♠ 6♥ 2♣ : top paire, tu checkes, il mise un tiers, tu paies.', 'Turn A♦ : mauvaise carte pour toi, elle améliore sa range. Il mise deux tiers : contre un régulier, tu te couches souvent ; contre un maniac, tu paies. Leçon : la turn change la hiérarchie.'] },
      { ask: 'Troisième main ?', h: 'Main 3 : 12 BB au CO', p: ['Blindes 500/1 000, ante 1 000, tu as 12 BB au CO avec K♠ T♠. Les tables donnent un tapis : tu pousses. Le bouton paie avec A♥ J♣ : tu as environ 41 %, tu perds parfois, mais la décision est rentable car tout le monde se couche souvent.', 'Leçon : à 12 BB, on juge la décision sur l’ensemble des réponses adverses, pas sur cette main.'] },
      { ask: 'Quatrième main ?', h: 'Main 4 : la bulle', p: ['Quatre joueurs, trois payés (50/30/20 €), tapis de 40, 14, 9 et 21 BB. Tu as 21 BB en grosse blinde, la SB pousse 9 BB. Tu as J♦ 7♣, environ 45 % contre sa range de tapis, pour 42 % requis : en jetons, la paye est rentable. Avec l’ICM, se coucher vaut 25,51 € et payer 25,10 € : fold.', 'Leçon : à la bulle avec un tapis moyen, on paie moins (chapitre 23).'] },
      { ask: 'Cinquième main ?', h: 'Main 5 : value bet contre une station', p: ['Club, une calling station limpe, tu isoles à 5 BB au bouton avec J♥ J♣. Flop T♦ 7♠ 3♣ : mise deux tiers. Turn 4♥ : mise deux tiers. River 2♦ : mise encore deux tiers.', 'Elle paie trois rues avec 9-8 ou une paire de 7 : tu prends le maximum. Leçon : contre une station, la valeur se prend en grosses mises sur trois rues.'] }
    ],
    mistake: 'Juger une main sur son résultat (« j’ai perdu, donc c’était mauvais ») au lieu de la décision prise avec l’information disponible.',
    retain: ['Relis en quatre temps : préflop, flop, turn, river.', 'À chaque rue : quelle range pour lui, quelle range pour moi ?', 'On juge la décision, pas le résultat.'],
    quiz: [
      { q: 'Main 1 : pourquoi miser la river 9♣ avec AQ sur Q-8-3-2 ?', o: ['Pour bluffer', 'Pour la valeur contre les dames plus faibles et les 8', 'Pour protéger', 'Par réflexe'], a: 1, why: 'Il paie souvent avec moins bien.' },
      { q: 'Main 3 : tu perds le tapis avec KTs contre AJo (41 %). La décision était…', o: ['mauvaise', 'rentable malgré le résultat', 'interdite', 'indifférente'], a: 1, why: 'On juge l’ensemble des réponses adverses.' },
      { q: 'Main 4 : en jetons tu paierais, en ICM tu te couches. Pourquoi ?', o: ['La main est mauvaise', 'Perdre te coûte plus que gagner ne rapporte à la bulle', 'Les blindes sont trop petites', 'Par prudence sans raison'], a: 1, why: 'C’est l’effet de bulle.' }
    ]
  };

  L[32] = {
    minutes: 6,
    key: ['On progresse par répétition courte et régulière, pas par de longues séances rares.', 'Ordre de priorité : le préflop d’abord, puis le tapis ou fold, puis le jeu après le flop, puis l’ICM.'],
    sections: [
      { ask: 'Quelle routine ?', h: 'La routine de la semaine', p: ['Chaque jour : la Séance du jour, 10 minutes. Deux fois par semaine : une leçon et son quiz, ou un podcast. Après chaque tournoi ou soirée au club : la revue de deux ou trois mains (chapitre 30).', 'Une fois par semaine : un Sit & Go ou un tournoi « Moments clés » dans l’appli, sans coach, pour mesurer tes progrès.'] },
      { ask: 'Par où commencer ?', h: 'L’ordre de priorité', p: ['1. Les ranges d’ouverture et de défense (chapitres 5 et 6) : ce sont les décisions les plus fréquentes. 2. Le tapis ou fold (chapitres 21 et 22) : décisif en tournoi. 3. Le flop et la turn (chapitres 14 et 15). 4. L’ICM et la bulle (chapitre 23).', 'Le test de profil, refait chaque mois, montre où tu en es.'] },
      { ask: 'Pourquoi la répétition marche ?', h: 'Pourquoi ça marche', p: ['Une décision répétée cent fois devient automatique : à la table, tu n’y penses plus et tu gardes ton attention pour les coups difficiles. Les mains ratées reviennent après 1, 3, 7 et 21 jours : c’est la répétition espacée.', 'Le meilleur indicateur : le nombre de consultations de « Ma range » pendant tes parties. Quand il tombe à zéro, la range est acquise.'] }
    ],
    mistake: 'Faire trois heures de théorie un dimanche puis plus rien de la semaine : la mémoire retient mieux dix minutes par jour.',
    retain: ['Dix minutes par jour valent mieux qu’une longue séance rare.', 'Priorités : préflop, tapis ou fold, flop et turn, ICM.', 'Quand tu ne consultes plus ta range, elle est acquise.'],
    quiz: [
      { q: 'Quelle fréquence pour la Séance du jour ?', o: ['Une fois par mois', 'Chaque jour, 10 minutes', 'Une fois par an', 'Avant les gros tournois seulement'], a: 1, why: 'La répétition courte et régulière.' },
      { q: 'Première priorité de travail ?', o: ['L’ICM', 'Les ranges d’ouverture et de défense', 'Les bluffs à la river', 'Le heads-up'], a: 1, why: 'Ce sont les décisions les plus fréquentes.' },
      { q: 'Une main ratée revient après…', o: ['1, 3, 7 et 21 jours', 'jamais', 'un an', 'chaque minute'], a: 0, why: 'C’est la répétition espacée.' }
    ]
  };

  L[5] = {
    minutes: 9, range: { type: 'open', pos: 'UTG', bb: 100 },
    key: ['Plus il reste de joueurs derrière toi, plus ta range d’ouverture est serrée ; au bouton, elle est presque quatre fois plus large qu’en UTG.', 'Ta range dépend aussi de ton profil et de ta profondeur de tapis.'],
    sections: [
      { ask: 'Pourquoi ouvrir plus serré en début de table ?', h: 'Le principe : les joueurs derrière toi', p: ['En UTG, huit joueurs parlent après toi : la probabilité que l’un d’eux ait une grosse main est forte, et tu joueras souvent hors position. Au bouton, il ne reste que les deux blindes, et tu auras la position à chaque tour.', 'Profil TAG, 40 BB et plus : UTG 12,7 % des mains, MP 15,7 %, HJ 22,2 %, CO 29,4 %, bouton 46,6 %, SB 31,5 %.'] },
      { ask: 'Et selon les profils ?', h: 'Les quatre profils', p: ['Très serré (ranges « tight » du livre) : UTG 8,7 %, bouton 29,7 %. TAG (ranges « loose » du livre, le standard actuel) : UTG 12,7 %, bouton 46,6 %. Équilibré : UTG 15 %, bouton 55 %. Large-agressif : UTG 17 %, bouton 56 %.', 'Les écarts sont faibles en début de table et grands en fin de table : c’est là que se joue le style.'] },
      { ask: 'Faut-il vraiment ouvrir As-Dame en UTG ?', h: 'Les mains qu’on n’a pas le droit de jeter', p: ['Oui. AQo s’ouvre en UTG dans tous les profils, même le plus serré. Se coucher par peur d’une relance, c’est jeter une main qui bat largement la range des joueurs qui paient derrière.', 'Même chose pour les paires de 77 et plus, AJs et plus, KQs : ce sont des ouvertures obligatoires en UTG.'] },
      { ask: 'Quelle taille d’ouverture ?', h: 'Les tailles', p: ['Au club, l’habitude est la relance à 2 BB (deux fois la grosse blinde) : elle coûte peu, et c’est aussi le standard de nombreux tournois en ligne avec antes. Les manuels citent souvent 2,5 BB sans ante et 2,2 BB avec ante : tu peux choisir ta taille dans les réglages.', 'Depuis la SB : 3 BB, car tu seras hors position. Avec un tapis court (moins de 20 BB) : 2 BB, ou directement tapis selon les tables du chapitre 22.', 'Exemple : blindes 100/200, tu ouvres à 400 au club ; à 500/1 000 avec ante, à 2 000 ou 2 200.', 'Conséquence : face à des relances à 2 BB, les blindes défendent plus large (chapitre 6), car le prix est plus bas.'] },
      { ask: 'Et quand mon tapis baisse ?', h: 'Selon la profondeur', p: ['De 20 à 40 BB, on resserre un peu les débuts de table (UTG 12 % environ) et on ouvre plus petit. Sous 20 BB, on passe en tapis ou fold (chapitres 21 et 22).', 'Dans « Ma range », choisis la profondeur : 40 BB et plus, 20 à 40 BB, ou moins de 20 BB.'] }
    ],
    mistake: 'Ouvrir la même range en UTG et au bouton, ou jeter des mains obligatoires comme AQo en UTG par peur.',
    retain: ['Moins il reste de joueurs derrière toi, plus tu ouvres large.', 'AQo, 77+, AJs+ et KQs s’ouvrent en UTG dans tous les profils.', 'Taille : 2 BB au club (2,2 à 2,5 BB selon les manuels), 3 BB depuis la SB.'],
    quiz: [
      { q: 'Profil TAG, 100 BB : part de mains ouvertes au bouton ?', o: ['15 %', '30 %', '47 %', '70 %'], a: 2, why: 'Environ 46,6 % dans les ranges du profil TAG.' },
      { q: 'Tu as AQo en UTG : tu parles en premier. Que fait le profil le plus serré ?', o: ['Il se couche', 'Il limpe', 'Il ouvre (première relance)', 'Il fait tapis'], a: 2, why: 'AQo s’ouvre en UTG dans tous les profils, même le plus serré.' },
      { q: 'Blindes 200/400, relance habituelle au club ?', o: ['400', '800', '1 000', '1 200'], a: 1, why: 'Au club, on ouvre à 2 BB : 800.' },
      { q: 'Taille d’ouverture depuis la SB ?', o: ['2 BB', '2,2 BB', '2,5 BB', '3 BB'], a: 3, why: 'Hors position, on relance un peu plus gros.' },
      { q: 'Pourquoi ouvrir plus large au bouton ?', o: ['Les cartes sont meilleures', 'Il ne reste que deux joueurs et tu as la position', 'Les blindes sont plus grosses', 'C’est la règle'], a: 1, why: 'Moins de joueurs à passer, et la position à chaque tour.' }
    ]
  };

  L[6] = {
    minutes: 10, range: { type: 'def', pos: 'BB', opener: 'BTN', bb: 100 },
    key: ['En grosse blinde, tu as déjà payé 1 BB : la cote te permet de défendre large, surtout contre les relances de fin de table.', 'On défend en payant beaucoup et en sur-relançant avec la valeur et quelques bluffs à bloqueurs.'],
    sections: [
      { ask: 'Pourquoi défendre la grosse blinde aussi large ?', h: 'La cote de la grosse blinde', p: ['Au club, la relance habituelle est à 2 BB : tu paies 1 BB pour un pot final de 4,5 BB (sans ante), il te faut seulement 22 % d’équité. La formule : (X – 1) ÷ (2X + 0,5), X étant la taille de l’ouverture.', 'Face à 2,5 BB, il faut 27 % ; face à 3 BB, 31 %. Plus l’ouverture est petite, plus tu défends large : contre les relances à 2 BB du club, défends un peu plus large que les repères ci-dessous, qui sont calculés pour 2,5 BB.'] },
      { ask: 'Contre quelle position défendre le plus ?', h: 'Selon la position du relanceur', p: ['Profil TAG : contre UTG, tu défends environ 16 % (dont 3 % en 3-bet) ; contre le CO, 29 % ; contre le bouton, 51 % (dont 11 % en 3-bet).', 'Le bouton ouvre près de la moitié de ses mains : sa range est faible, ta défense s’élargit.'] },
      { ask: 'Avec quoi sur-relancer ?', h: 'Le 3-bet depuis la grosse blinde', p: ['Valeur : les grosses paires, AK, AQ, AJs contre le bouton. Bluffs : A5s à A2s, qui bloquent les as adverses et ont de l’équité quand ils sont payés.', 'Taille : 4 fois l’ouverture environ, car tu joueras hors position. Contre 2,5 BB, 10 à 11 BB.'] },
      { ask: 'Et la petite blinde ?', h: 'La petite blinde', p: ['En SB, tu as moins payé et tu joueras hors position contre le relanceur et la BB derrière : on préfère le 3-bet ou le fold, avec peu de calls (petites paires).', 'Quand tout le monde se couche jusqu’à toi en SB, c’est la bataille des blindes : relance environ 40 % des mains à 3 BB sans ante, avec un limp possible d’une partie des mains faibles (repères du livre).'] }
    ],
    mistake: 'Se coucher en grosse blinde face à une relance minimum du bouton avec des mains comme K9o ou J8s : la cote est trop bonne.',
    retain: ['Équité requise en BB : (X – 1) ÷ (2X + 0,5).', 'Défends plus large contre les positions tardives : environ la moitié des mains contre le bouton (TAG).', '3-bet de la BB à environ 4 fois l’ouverture, avec la valeur et A5s-A2s.'],
    quiz: [
      { q: 'Ouverture à 2,5 BB, tu es en BB sans ante. Équité requise ?', o: ['17 %', '22 %', '27 %', '33 %'], a: 2, why: '(2,5 – 1) ÷ (5 + 0,5) ≈ 27 %.' },
      { q: 'Face à une relance minimum (2 BB), tu défends…', o: ['plus serré', 'plus large', 'pareil', 'jamais'], a: 1, why: 'Il ne faut plus que 22 %.' },
      { q: 'Profil TAG en BB face au bouton : part de mains défendues ?', o: ['16 %', '29 %', '51 %', '80 %'], a: 2, why: 'Environ 51 %, dont 11 % en 3-bet.' },
      { q: 'Meilleur bluff de 3-bet depuis la BB ?', o: ['K7o', 'A4s', 'Q8o', '72o'], a: 1, why: 'A4s bloque les as et garde de l’équité.' },
      { q: 'Taille de 3-bet depuis la BB face à 2,5 BB ?', o: ['5 BB', '7 BB', '10 à 11 BB', '20 BB'], a: 2, why: 'Environ 4 fois l’ouverture, hors position.' }
    ]
  };

  L[8] = {
    minutes: 10, range: { type: 'vs3bet', scen: 'ip', bb: 100 },
    key: ['Le 3-bet mélange des mains de valeur et quelques bluffs à bloqueurs : sans bluffs, il devient lisible.', 'Face à un 3-bet, on paie surtout en position, on 4-bet le haut de range, on couche le reste.'],
    sections: [
      { ask: 'C’est quoi une range de 3-bet équilibrée ?', h: 'Valeur et bluffs', p: ['Une ouverture est linéaire : les meilleures mains dans l’ordre. Un 3-bet mélange des mains de valeur et des bluffs choisis (A5s, A4s) ; les mains moyennes jouables, comme les petites paires, se paient plutôt.', 'Exemple du profil TAG au bouton face au CO : 88+, ATs+, KJs+, AJo+, KQo en valeur, plus des bluffs assortis (petits As, K9s, Q9s, JTs, T9s).'] },
      { ask: 'Quelle taille ?', h: 'La taille du 3-bet', p: ['En position : 3 fois l’ouverture (7,5 BB face à 2,5 BB). Hors position (blindes) : 4 fois. Plus il y a d’argent mort, plus tu peux grossir.'] },
      { ask: 'Et le 3-bet light ?', h: 'Le 3-bet léger (resteal)', p: ['Contre un voleur qui ouvre large au CO ou au bouton, sur-relancer avec des mains moyennes à bloqueurs (A8s, KTs) lui reprend le pot. C’est encore plus fort à 20-35 BB, où le 3-bet devient un tapis (chapitres 20 et 21).'] },
      { ask: 'Que faire quand on me 3-bet ?', h: 'Face au 3-bet', p: ['Au bouton contre les blindes (tu es en position) : paie TT à 77, AJs, AQs, KQs, QJs, JTs, 98s ; 4-bet QQ+, AK et A5s-A4s en bluff.', 'Au CO contre le bouton (hors position) : paie moins (JJ à 88, AQs, AJs, KQs) ; 4-bet QQ+, AK, A5s.', 'En début de table contre un 3-bet tardif : paie JJ, TT, AQs ; 4-bet QQ+ et AK ; couche le reste.'] },
      { ask: 'Pourquoi payer plus en position ?', h: 'La position te rend de l’équité', p: ['En position, tu vois ce que fait l’adversaire avant de décider à chaque tour : tu réalises plus de ton équité. Hors position, la même main gagne moins souvent, donc tu en paies moins.'] }
    ],
    mistake: 'Payer un 3-bet hors position avec AJo ou KQo : dominées par sa range de valeur, elles perdent de gros pots.',
    retain: ['3-bet = valeur + bluffs à bloqueurs ; les mains moyennes jouables se paient.', 'Taille : 3 fois en position, 4 fois hors position.', 'Face au 3-bet : paie surtout en position, 4-bet QQ+ et AK, couche le reste.'],
    quiz: [
      { q: 'Taille de 3-bet en position face à une ouverture à 2,5 BB ?', o: ['5 BB', '7,5 BB', '10 BB', '15 BB'], a: 1, why: 'Environ 3 fois l’ouverture.' },
      { q: 'Tu as ouvert au bouton, la BB te 3-bet. Avec 98s, tu…', o: ['te couches', 'paies', '4-bet', 'fais tapis'], a: 1, why: 'En position, 98s fait partie des mains qui paient.' },
      { q: 'Tu as ouvert en UTG, le CO te 3-bet. Avec AJo, tu…', o: ['paies', 'te couches', '4-bet', 'fais tapis'], a: 1, why: 'Hors position face à une range forte, AJo est dominée.' },
      { q: 'Pourquoi A5s est un bon bluff de 3-bet ?', o: ['C’est une main forte', 'Elle bloque les as adverses et garde de l’équité', 'Elle fait souvent quinte', 'Au hasard'], a: 1, why: 'Bloqueur d’as et équité de secours.' },
      { q: 'Une range de 3-bet sans aucun bluff est…', o: ['optimale', 'facile à lire', 'imbattable', 'interdite'], a: 1, why: 'L’adversaire se couche avec tout sauf ses meilleures mains.' }
    ]
  };

  L[9] = {
    minutes: 9,
    key: ['Le squeeze, c’est une sur-relance après une ouverture et au moins un call : l’argent mort la rend très rentable.', 'Le 4-bet et le click back se jouent avec une range très forte et une taille calculée.'],
    sections: [
      { ask: 'C’est quoi un squeeze ?', h: 'Le squeeze', p: ['Un joueur ouvre, un autre paie, et tu sur-relances. Le payeur a rarement une très grosse main (il aurait sur-relancé) et l’ouvreur est coincé entre toi et lui : beaucoup de folds.', 'Taille : environ 4 fois l’ouverture plus 1 BB par payeur. Ouverture à 2 BB, un call : 9 BB. Depuis les blindes, ajoute 1 à 2 BB.', 'Range depuis la BB face à une ouverture et un call : TT+, AQs+, AKo en valeur, A2s à A5s et K9s en bluff.'] },
      { ask: 'Et le 4-bet ?', h: 'Le 4-bet', p: ['Face à un 3-bet, le 4-bet se fait à environ 2,2 fois le 3-bet en position, 2,5 fois hors position. Exemple : 3-bet à 8 BB, 4-bet à 18-20 BB.', 'Range : QQ+, AK en valeur, A5s-A4s en bluff. À 40 BB et moins, le 4-bet devient un tapis.'] },
      { ask: 'Et le click back ?', h: 'Le click back (relance minimum en retour)', p: ['C’est une sur-relance du montant minimum : face à une mise de 1 000, tu relances à 2 000. Il coûte peu, mais il offre à l’adversaire une cote énorme pour continuer.', 'Usage : avec une main très forte contre un joueur agressif qui va relancer encore, ou pour garder un tapis moyen sous contrôle. À éviter en bluff : l’adversaire paie presque toujours.'] },
      { ask: 'Et quand on me squeeze ?', h: 'Face au squeeze', p: ['Si tu as ouvert et qu’on te squeeze, tu es hors position contre le squeezer, avec un joueur derrière : continue seulement avec QQ+, AK et quelques mains fortes, plus serré que face à un 3-bet simple.'] }
    ],
    mistake: 'Squeezer avec des mains moyennes comme KJo : payé par deux joueurs, tu joues un gros pot dominé et hors position.',
    retain: ['Squeeze : 4 fois l’ouverture + 1 BB par payeur, polarisé (valeur et A5s-A2s).', '4-bet : 2,2 fois le 3-bet en position, 2,5 fois hors position ; tapis à 40 BB et moins.', 'Click back : relance minimum en retour, pour les mains très fortes, pas pour bluffer.'],
    quiz: [
      { q: 'Ouverture à 2 BB, un call, tu es au bouton. Taille de squeeze ?', o: ['5 BB', '9 BB', '15 BB', 'Tapis'], a: 1, why: '4 × 2 + 1 = 9 BB.' },
      { q: '3-bet à 8 BB, tu 4-bet en position. Taille ?', o: ['12 BB', '18 BB', '30 BB', 'Tapis à 100 BB'], a: 1, why: 'Environ 2,2 fois le 3-bet.' },
      { q: 'Le click back, c’est…', o: ['un call', 'une relance minimum en retour', 'un tapis', 'un check'], a: 1, why: 'Dans ton vocabulaire : relance minimum de retour.' },
      { q: 'Pourquoi éviter le click back en bluff ?', o: ['Il coûte trop cher', 'L’adversaire paie presque toujours avec une si bonne cote', 'C’est interdit', 'Il fait peur'], a: 1, why: 'La cote offerte est énorme.' },
      { q: 'À 35 BB, ton 4-bet devient le plus souvent…', o: ['un call', 'un tapis', 'un min-raise', 'un fold'], a: 1, why: 'Au-dessous de 40 BB, le 4-bet est un tapis.' }
    ]
  };

  L[7] = {
    minutes: 7, range: { type: 'open', pos: 'CO', bb: 100 },
    key: ['Face à un ou plusieurs limpers, on relance pour isoler avec les mains fortes, on suit derrière avec les mains spéculatives, et on se couche avec le reste.', 'La taille d’isolement monte d’une grosse blinde par limper.'],
    sections: [
      { ask: 'Pourquoi les limpers sont-ils une bonne nouvelle ?', h: 'Le limper est souvent faible', p: ['Un joueur qui se contente de payer la grosse blinde sans relancer annonce une main moyenne : avec une grosse main, la plupart des joueurs relancent. Au club, les limpers sont surtout des joueurs récréatifs et larges-passifs.', 'Relancer pour l’isoler, c’est jouer le pot seul contre lui, souvent en position, avec l’initiative et une meilleure main.'] },
      { ask: 'Quelle taille pour isoler ?', h: 'La taille : 3 à 4 BB, plus 1 BB par limper', p: ['En position, relance à 3 BB plus 1 BB par limper ; depuis les blindes, 4 BB plus 1 BB par limper, car tu joueras hors position.', 'Exemple : blindes 100/200, deux limpers, tu es au bouton : 3 + 2 = 5 BB, soit 1 000 jetons. Plus petit, les limpers paient tous et tu te retrouves en pot à plusieurs joueurs.'] },
      { ask: 'Avec quelles mains ?', h: 'Isoler, suivre ou se coucher', p: ['Isoler : les mains qui jouent bien seules et dominent la range du limper. Au CO, à peu près 55+, A9s+, KTs+, QJs, ATo+, KQo. Au bouton, beaucoup plus large.', 'Suivre (sur-limper) : les petites paires et les connecteurs assortis, qui cherchent un brelan ou une couleur à plusieurs, pas cher.', 'Se coucher : les mains offsuit moyennes (K8o, Q9o, J9o), qui perdent de l’argent dans les pots à plusieurs.'] },
      { ask: 'Et après le flop ?', h: 'Le plan après le flop', p: ['Contre un seul limper qui paie ton isolement, mise souvent au flop (c-bet) : il a manqué le flop deux fois sur trois.', 'S’il paie encore à la turn, ralentis avec les mains moyennes : un limper passif qui paie deux rues a souvent une paire.'] }
    ],
    mistake: 'Relancer trop petit (2 BB) face à deux limpers : tout le monde paie, tu joues hors de contrôle à quatre joueurs avec une main moyenne.',
    retain: ['Isoler = 3 BB en position (4 BB des blindes) + 1 BB par limper.', 'Isole avec les mains fortes, suis avec petites paires et connecteurs assortis, couche les offsuit moyennes.', 'Contre un limper seul, le c-bet au flop gagne très souvent.'],
    quiz: [
      { q: 'Blindes 100/200, un limper, tu es au bouton avec AJo. Quelle relance ?', o: ['400', '800', '1 200', 'Tu paies'], a: 1, why: '3 BB + 1 BB par limper = 4 BB, soit 800 jetons.' },
      { q: 'Deux limpers, tu es en grosse blinde avec AQo. Taille d’isolement ?', o: ['3 BB', '4 BB', '6 BB', '10 BB'], a: 2, why: 'Hors position : 4 BB + 1 BB par limper = 6 BB.' },
      { q: 'Un limper, tu es au CO avec 55. Que fais-tu le plus souvent ?', o: ['Tu te couches', 'Tu suis (sur-limp) ou tu isoles', 'Tu fais tapis', 'Tu relances à 2 BB'], a: 1, why: 'Les petites paires jouent bien en sur-limp à plusieurs ; 55 peut aussi isoler au CO.' },
      { q: 'Un limper, tu es au HJ avec K8o. Que fais-tu ?', o: ['Isoler', 'Suivre', 'Se coucher', 'Tapis'], a: 2, why: 'Les offsuit moyennes perdent de l’argent en pot à plusieurs et sont dominées.' },
      { q: 'Pourquoi isoler plutôt que suivre avec AQo ?', o: ['Pour jouer à plusieurs', 'Pour jouer seul contre une range plus faible, avec l’initiative', 'Pour bluffer au flop', 'Parce que le limp est interdit'], a: 1, why: 'L’isolement te donne un pot en tête à tête, l’initiative et la meilleure main.' }
    ]
  };

  L[12] = {
    minutes: 9,
    key: ['Lire une main, c’est réduire la range adverse action après action, du préflop à la river.', 'On ne cherche pas une main précise : on retire ce qu’il n’aurait pas joué ainsi.'],
    sections: [
      { ask: 'Par où commence-t-on ?', h: 'Étape 1 : la range de départ', p: ['Tout commence avant le flop : sa position et son action. Un joueur serré qui ouvre UTG a environ 10 % des mains : paires moyennes et hautes, As forts, figures assorties. Un récréatif qui limpe au bouton peut avoir presque tout, sauf les très grosses mains, qu’il aurait relancées.', 'Note sa range de départ en une phrase : « UTG serré : 77+, AJ+, KQ ».'] },
      { ask: 'Et quand il mise au flop ?', h: 'Étape 2 : chaque action retire des mains', p: ['Sur K♠ 7♦ 2♣, il mise la moitié du pot : il garde ses rois, ses paires hautes, quelques bluffs (AQ, AJ). Il retire les mains qui auraient checké, comme 88 ou 99 chez un joueur prudent.', 'S’il checke puis paie, il a souvent une main moyenne : une paire de 7, une petite paire en dessous du roi, ou un tirage s’il y en a un.'] },
      { ask: 'Comment compter concrètement ?', h: 'Étape 3 : compter les combinaisons', p: ['Une paire servie compte 6 combinaisons, une main assortie 4, une main dépareillée 12. Les cartes du tableau en retirent : sur un roi au flop, il reste 3 rois, donc AK ne vaut plus que 12 combinaisons (3 × 4) au lieu de 16.', 'Exemple à la river : tu comptes 6 combinaisons de valeur et 8 bluffs probables (tirages manqués). S’il mise le pot, il te faut 33 % : avec 8 bluffs sur 14 combinaisons, tu gagnes 57 % du temps. Tu paies.'] },
      { ask: 'Et le profil du joueur ?', h: 'Étape 4 : ajuster au profil', p: ['La même ligne ne veut pas dire la même chose chez tout le monde. Une grosse mise à la river d’un nit, c’est presque toujours la valeur ; chez un maniac, il faut payer plus large.', 'Un récréatif fantasque mise souvent selon sa main, pas selon une stratégie : grosse mise, grosse main ; petite mise, main moyenne.'] }
    ],
    mistake: 'Mettre l’adversaire sur une seule main (« il a AK ») et jouer contre elle, au lieu de garder une range et de compter.',
    retain: ['Pars de la range préflop selon sa position et son profil.', 'Chaque action retire des mains : demande-toi ce qu’il aurait fait autrement.', 'Compte les combinaisons (6 pour une paire, 4 assortie, 12 dépareillée) et pense aux cartes bloquées.'],
    quiz: [
      { q: 'Combien de combinaisons pour une paire servie (par exemple 88) ?', o: ['4', '6', '12', '16'], a: 1, why: 'C(4,2) = 6 combinaisons.' },
      { q: 'Combien de combinaisons pour AKo (dépareillée) ?', o: ['4', '6', '12', '16'], a: 2, why: '4 × 4 = 16 en tout, dont 4 assorties : 12 dépareillées.' },
      { q: 'Flop K♠ 7♦ 2♣. Combien de combinaisons d’AK restent possibles ?', o: ['16', '12', '9', '6'], a: 1, why: 'Il reste 3 rois : 4 as × 3 rois = 12.' },
      { q: 'Un nit mise gros à la river après avoir payé deux rues. Que contient surtout sa range ?', o: ['Des bluffs', 'De la valeur', 'Des tirages', 'N’importe quoi'], a: 1, why: 'Un nit bluffe très rarement : une grosse mise tardive, c’est presque toujours la valeur.' },
      { q: 'Il mise le pot à la river. Quelle part de bluffs te faut-il dans sa range pour payer ?', o: ['25 %', '33 %', '50 %', '66 %'], a: 1, why: 'Mise du pot : tu paies 1 pour gagner 2, il te faut 33 %.' },
      { q: 'Première étape de la lecture de main ?', o: ['Regarder ses cartes au showdown', 'Estimer sa range préflop selon position et profil', 'Deviner sa main exacte', 'Regarder son tapis'], a: 1, why: 'Tout part de la range de départ.' }
    ]
  };

  L[14] = {
    minutes: 10, range: null,
    key: ['Au flop, l’agresseur préflop mise souvent petit sur les boards qui l’avantagent et checke davantage sur ceux qui avantagent le défenseur.', 'En défense, on paie selon la cote et on relance avec les mains fortes et les gros tirages.'],
    sections: [
      { ask: 'Quand faire un c-bet ?', h: 'Le c-bet selon le board', p: ['Sur un board sec avec une carte haute (K♠ 7♦ 2♣, A♥ 8♣ 3♦), le relanceur a plus de mains fortes : c-bet fréquent, petit, environ un tiers du pot.', 'Sur un board bas et connecté (8♥ 7♥ 5♣), la range du défenseur en BB touche davantage : check plus souvent, et mise plus gros (deux tiers du pot) avec tes vraies mains et tes gros tirages.'] },
      { ask: 'Et quand on est plusieurs ?', h: 'Le nombre d’adversaires', p: ['Contre un adversaire, tu peux miser souvent. Contre deux, réduis nettement tes bluffs. Contre trois ou plus, mise surtout pour la valeur : la probabilité qu’un des joueurs ait touché devient grande.'] },
      { ask: 'Comment défendre face à un c-bet ?', h: 'Défendre : la cote et la défense minimale', p: ['Face à une mise d’un tiers du pot, il te faut 20 % d’équité pour payer, et tu dois défendre environ 75 % de ta range pour ne pas te faire exploiter. Face à une mise du pot, 33 % et 50 %.', 'Exemple : pot 1 200, il mise 400. Tu paies 400 pour un pot final de 2 000 : 20 %. Un tirage ventre (4 outs, environ 17 % sur deux cartes) ne suffit pas seul ; une paire moyenne ou un tirage couleur, si.'] },
      { ask: 'Quand relancer le c-bet ?', h: 'Le check-raise', p: ['Check-relance avec tes meilleures mains (double paire, brelan) et tes gros tirages (couleur + quinte), surtout sur les boards bas qui te sont favorables.', 'Taille : environ trois fois la mise. Garde des mains fortes dans ta range de call pour ne pas être lisible.'] },
      { ask: 'Et face à une surmise ?', h: 'Face à une surmise au flop', p: ['Une mise plus grosse que le pot au flop est rare et souvent très polarisée : grosse main ou bluff. Il te faut 40 % d’équité face à deux fois le pot. Paie avec les mains fortes et les gros tirages, couche les paires moyennes, sauf contre un maniac.'] }
    ],
    mistake: 'C-better systématiquement à plusieurs adversaires sur un board connecté : tu brûles des jetons contre des mains qui ont touché.',
    retain: ['Board sec et haut : c-bet petit et fréquent. Board bas et connecté : check plus, mise plus gros.', 'Plus il y a d’adversaires, moins tu bluffes.', 'Équité requise = mise ÷ (pot + 2 × mise) : 20 % face à un tiers du pot, 33 % face au pot.'],
    quiz: [
      { q: 'Tu as relancé au CO, la BB paie. Flop K♠ 7♦ 2♣. Taille de c-bet la plus courante ?', o: ['Un tiers du pot', 'Le pot', 'Deux fois le pot', 'Pas de mise'], a: 0, why: 'Board sec avec carte haute : avantage au relanceur, petite mise fréquente.' },
      { q: 'Flop 8♥ 7♥ 5♣ après une relance au bouton payée par la BB. Que fais-tu le plus souvent avec AK sans cœur ?', o: ['C-bet un tiers', 'Check', 'Tapis', 'C-bet le pot'], a: 1, why: 'Board bas et connecté qui favorise la BB : AK sans tirage checke souvent.' },
      { q: 'Il mise un tiers du pot. Équité requise pour payer ?', o: ['17 %', '20 %', '25 %', '33 %'], a: 1, why: '1/3 ÷ (1 + 2/3) = 20 %.' },
      { q: 'Face à une mise d’un tiers du pot, quelle part de ta range dois-tu défendre ?', o: ['50 %', '60 %', '75 %', '90 %'], a: 2, why: 'Défense minimale = 1 ÷ (1 + 1/3) = 75 %.' },
      { q: 'Contre trois adversaires, ton c-bet bluff doit être…', o: ['plus fréquent', 'aussi fréquent', 'beaucoup plus rare', 'toujours au tapis'], a: 2, why: 'La probabilité qu’au moins un joueur ait touché grimpe vite.' },
      { q: 'Face à une surmise de deux fois le pot au flop, il te faut…', o: ['25 %', '33 %', '40 %', '50 %'], a: 2, why: '2 ÷ (1 + 4) = 40 %.' }
    ]
  };

  L[15] = {
    minutes: 10,
    key: ['La turn est la rue où le pot devient gros : chaque mise y engage une grande part du tapis.', 'On continue à miser quand la carte améliore notre range ou fait peur à l’adversaire, et on ralentit quand elle l’aide.'],
    sections: [
      { ask: 'Qu’est-ce qui change à la turn ?', h: 'Pourquoi la turn compte autant', p: ['Après une mise au flop payée, le pot a souvent doublé. Une mise de deux tiers du pot à la turn prépare un tapis à la river. C’est le moment de décider si ta main vaut trois rues de valeur.'] },
      { ask: 'Quand continuer à bluffer ?', h: 'Le double barrel', p: ['Bon candidat : une carte haute qui tombe sur un board bas (un as ou un roi sur 8♠ 6♦ 2♣) : elle améliore ta range de relanceur plus que celle du défenseur.', 'Bons bluffs : les tirages (couleur, quinte) qui ont encore des outs, et les mains qui bloquent ses meilleures payes. Mauvais bluffs : les mains sans équité quand la carte aide le défenseur (un 7 sur 8-6-2).'] },
      { ask: 'Et les cartes qui changent tout ?', h: 'Les cartes qui changent l’avantage', p: ['La troisième carte d’une couleur, la carte qui complète une quinte, ou la carte qui double le board changent la hiérarchie. Avec une paire haute sans la couleur, ralentis sur la troisième carte de couleur : check et contrôle du pot.', 'À l’inverse, si la carte complète ce que tu représentes (tu as relancé préflop et un as tombe), mise : ton adversaire peut difficilement continuer.'] },
      { ask: 'Faut-il parfois surmiser à la turn ?', h: 'La surmise à la turn', p: ['C’est le cas le plus fréquent de surmise : une carte blanche (2♥ sur K♠ 9♦ 4♣) alors que tu as l’avantage des nuts (tu as plus de rois et de brelans que lui). Mise 1,2 à 1,5 fois le pot avec tes meilleures mains et quelques tirages.', 'Face à une surmise à la turn, il te faut environ 38 % d’équité contre 1,5 fois le pot : paie avec les mains fortes, couche les paires moyennes, sauf contre un joueur qui bluffe beaucoup.'] },
      { ask: 'Et quand on n’a pas misé au flop ?', h: 'Après un check au flop', p: ['Si tu as checké le flop en position, la turn est un bon moment pour miser (delayed c-bet) : l’adversaire a montré de la faiblesse en checkant à son tour.', 'Si le défenseur mise dans le relanceur à la turn après un check au flop, c’est souvent une main moyenne qui veut de la valeur ou une protection.'] }
    ],
    mistake: 'Continuer à bluffer à la turn sur une carte qui aide clairement l’adversaire, juste parce qu’on a misé au flop.',
    retain: ['À la turn, le pot est gros : décide si ta main vaut trois rues.', 'Double barrel sur les cartes qui t’aident, avec des tirages ou des bloqueurs.', 'Surmise à la turn sur carte blanche quand tu as l’avantage des nuts ; face à elle, il faut environ 38 %.'],
    quiz: [
      { q: 'Tu as relancé préflop et misé au flop 8♠ 6♦ 2♣. Turn : A♥. Bon moment pour un deuxième barrel ?', o: ['Oui', 'Non'], a: 0, why: 'L’as améliore surtout la range du relanceur.' },
      { q: 'Flop K♠ 9♦ 4♣, turn 2♥, tu as un brelan de 9. Quelle taille est intéressante ?', o: ['Un quart du pot', 'Une surmise (1,2 à 1,5 pot)', 'Check', 'Tapis préflop'], a: 1, why: 'Carte blanche et avantage des nuts : la surmise maximise la valeur.' },
      { q: 'Face à une surmise de 1,5 fois le pot, il te faut environ…', o: ['25 %', '33 %', '38 %', '50 %'], a: 2, why: '1,5 ÷ (1 + 3) = 37,5 %.' },
      { q: 'Tu as AA sur Q♥ 8♥ 3♣, turn 5♥ (troisième cœur), sans cœur. Que fais-tu le plus souvent ?', o: ['Tapis', 'Grosse mise', 'Check et contrôle du pot', 'Surmise'], a: 2, why: 'La troisième carte de couleur change la hiérarchie : on ralentit.' },
      { q: 'Tu as checké le flop au bouton. Il checke la turn. Que fais-tu souvent ?', o: ['Check encore', 'Mise (delayed c-bet)', 'Tapis', 'Te coucher'], a: 1, why: 'Il a montré de la faiblesse deux fois : la mise retardée gagne souvent.' }
    ]
  };

  L[17] = {
    minutes: 8,
    key: ['Le SPR (tapis ÷ pot au flop) dit à l’avance quelles mains peuvent partir à tapis.', 'Plus il est bas, plus une simple paire forte devient une main d’engagement.'],
    sections: [
      { ask: 'Comment calcule-t-on le SPR ?', h: 'Le calcul', p: ['SPR = tapis effectif restant ÷ pot au flop. Exemple : tu relances à 2,5 BB, le bouton sur-relance à 8 BB, tu paies. Pot au flop : 8 + 8 + 1,5 = 17,5 BB. Il te reste 92 BB : SPR ≈ 5.', 'Dans un pot simple à 100 BB (relance + call), le SPR tourne autour de 17 ; en pot 3-bet, autour de 5 ; en pot 4-bet, autour de 2.'] },
      { ask: 'Que faire selon le SPR ?', h: 'Les repères d’engagement', p: ['SPR inférieur à 3 : top paire bon kicker et mieux partent à tapis sans hésiter.', 'SPR de 3 à 6 : overpaire et top paire forte s’engagent ; choisis ta taille pour arriver au tapis en deux mises.', 'SPR de 6 à 13 : il faut double paire ou mieux pour mettre tout ton tapis.', 'SPR au-dessus de 13 : les mains moyennes contrôlent le pot ; seuls les brelans, quintes et couleurs veulent tout jouer.'] },
      { ask: 'Et dans un pot 3-bet ?', h: 'Pots 3-bet : avec et sans initiative', p: ['Avec l’initiative (tu as 3-bet), ta range est plus forte : c-bet fréquent et petit (25 à 33 % du pot) sur les boards avec as ou roi. Avec une valeur, prépare le tapis dès le flop.', 'Sans l’initiative (tu as payé le 3-bet), ta range est plafonnée : tu aurais 4-bet AA et KK. Face à une grosse mise sur un board effrayant, ne paie pas tout.'] },
      { ask: 'Et la surmise dans tout ça ?', h: 'La surmise selon le SPR', p: ['Avec un SPR bas (2 à 3), une surmise au flop met simplement tapis : c’est souvent la meilleure taille avec une main forte, car elle évite de laisser une carte gratuite.', 'Avec un SPR haut, la surmise se garde pour la turn ou la river, quand tu as l’avantage des nuts.'] }
    ],
    mistake: 'Jouer une top paire comme une main de check-call en pot 3-bet (SPR de 4) : tu perds la valeur et tu offres des cartes gratuites.',
    retain: ['SPR = tapis restant ÷ pot au flop.', 'Pot simple ≈ 17, pot 3-bet ≈ 5, pot 4-bet ≈ 2.', 'SPR bas : les paires fortes s’engagent ; SPR haut : il faut double paire ou mieux.'],
    quiz: [
      { q: 'Pot au flop 20 BB, il te reste 90 BB. SPR ?', o: ['2,2', '4,5', '9', '20'], a: 1, why: '90 ÷ 20 = 4,5.' },
      { q: 'SPR de 2 en pot 4-bet avec top paire bon kicker. Tu…', o: ['checkes et te couches', 'engages ton tapis', 'mises un quart du pot', 'te couches à la première mise'], a: 1, why: 'SPR bas : top paire bon kicker est une main d’engagement.' },
      { q: 'SPR de 15 avec top paire kicker moyen. Plan ?', o: ['Tapis au flop', 'Contrôler le pot', 'Surmise', 'Fold immédiat'], a: 1, why: 'SPR haut : les mains moyennes ne supportent pas trois grosses mises.' },
      { q: 'SPR typique d’un pot 3-bet à 100 BB ?', o: ['Environ 2', 'Environ 5', 'Environ 17', 'Environ 30'], a: 1, why: 'Pot 3-bet : environ 17,5 BB au flop pour 92 BB restants.' },
      { q: 'Tu as payé un 3-bet. Ta range est…', o: ['plus forte que la sienne', 'plafonnée', 'polarisée vers les nuts', 'identique'], a: 1, why: 'Tu aurais 4-bet tes meilleures mains.' }
    ]
  };

  L[18] = {
    minutes: 8,
    key: ['À plusieurs, les mains se renforcent : il faut une meilleure main pour miser et pour payer.', 'Les bluffs deviennent rares, la valeur se joue plus franchement.'],
    sections: [
      { ask: 'Pourquoi le multiway change tout ?', h: 'Ce qui change à trois joueurs et plus', p: ['À deux, une paire moyenne est souvent la meilleure main. À quatre, quelqu’un a souvent touché mieux. La probabilité qu’au moins un adversaire ait une paire au flop dépasse 50 % dès trois adversaires.', 'Conséquence : on bluffe moins, et on mise pour la valeur avec des mains plus fortes.'] },
      { ask: 'Avec quelles mains entrer à plusieurs ?', h: 'Les mains qui aiment le multiway', p: ['Les petites paires (pour le brelan), les connecteurs assortis et les As assortis (pour la couleur max) gagnent des gros pots à plusieurs.', 'Les mains comme KJo, QTo ou A9o perdent de l’argent : quand elles touchent, elles sont souvent dominées.'] },
      { ask: 'Comment miser au flop à plusieurs ?', h: 'Le c-bet à plusieurs', p: ['Mise avec top paire bon kicker et mieux, et avec les gros tirages. Checke beaucoup plus le reste.', 'Taille : plutôt la moitié à deux tiers du pot, pour faire payer les tirages cher. Un petit c-bet à plusieurs fait payer tout le monde.'] },
      { ask: 'Et quand quelqu’un mise devant moi ?', h: 'Face à une mise avec des joueurs derrière', p: ['Paie plus serré : un joueur derrière toi peut encore relancer. Avec un tirage, préfère les tirages max (couleur à l’as) pour ne pas perdre un gros pot contre une meilleure couleur.', 'Au club, une mise dans un pot à quatre joueurs, c’est souvent une vraie main : les récréatifs bluffent rarement dans ces coups-là.'] }
    ],
    mistake: 'C-better en bluff avec AK sans rien sur 9-8-6 à quatre joueurs : quelqu’un a presque toujours touché.',
    retain: ['À plusieurs, moins de bluffs, plus de valeur.', 'Petites paires, connecteurs assortis et As assortis aiment le multiway ; les offsuit moyennes non.', 'Mise plus gros pour faire payer les tirages, paie plus serré quand il reste des joueurs derrière.'],
    quiz: [
      { q: 'Flop 9♠ 8♦ 6♣ à quatre joueurs, tu as A♥K♣ et tu as relancé. Que fais-tu le plus souvent ?', o: ['C-bet', 'Check', 'Tapis', 'Surmise'], a: 1, why: 'À quatre sur un board connecté, AK sans rien checke.' },
      { q: 'Quelle main préfère un pot à plusieurs joueurs ?', o: ['KJo', '6♥5♥', 'A9o', 'QTo'], a: 1, why: 'Les connecteurs assortis cherchent quinte et couleur, qui gagnent les gros pots.' },
      { q: 'À plusieurs, ta taille de c-bet de valeur est plutôt…', o: ['un quart du pot', 'la moitié à deux tiers du pot', 'deux fois le pot', 'un min-bet'], a: 1, why: 'Il faut faire payer cher les tirages.' },
      { q: 'Tirage couleur au 10, mise devant toi, deux joueurs derrière. Prudence parce que…', o: ['le pot est petit', 'une meilleure couleur est possible et on peut te relancer', 'les tirages ne touchent jamais', 'c’est interdit'], a: 1, why: 'À plusieurs, les tirages non max et la relance derrière coûtent cher.' }
    ]
  };

  L[19] = {
    minutes: 10,
    key: ['Un tournoi se joue en phases : on ne joue pas le début comme la bulle ou les places payées.', 'Le gros tapis est une arme : il met la pression sur ceux qui ont le plus à perdre.'],
    sections: [
      { ask: 'Comment jouer le début de tournoi ?', h: 'Le début : tapis profonds', p: ['Avec 100 BB et plus (20 000 jetons à 100/200), on joue serré-agressif, on cherche les gros pots avec les grosses mains et on évite les gros bluffs.', 'C’est la phase où les récréatifs donnent le plus de jetons : value bet franc, peu de bluffs contre eux.'] },
      { ask: 'Et quand les antes arrivent ?', h: 'Le milieu : les antes changent tout', p: ['Avec la BB ante, le pot préflop passe de 1,5 BB à 2,5 BB : voler rapporte beaucoup plus. On élargit les ouvertures en fin de table et on défend plus large en BB.', 'Ton tapis baisse souvent vers 25-40 BB : c’est la zone des chapitres 20 et 21, où le 3-bet devient un tapis.'] },
      { ask: 'Et l’approche de la bulle ?', h: 'L’approche de la bulle et la bulle', p: ['Avant les places payées, les tapis moyens se crispent : c’est le moment de les voler. Les petits tapis doivent pousser avant d’être trop courts ; les gros tapis attaquent.', 'Payer un tapis devient plus cher (chapitre 23) : resserre tes calls, sauf si tu es gros tapis face à un petit.'] },
      { ask: 'Comment jouer quand on a beaucoup de jetons ?', h: 'Le gros tapis', p: ['Ouvre plus large, surtout quand les tapis moyens sont à ta gauche : ils ne peuvent pas te sur-relancer sans risquer leur tournoi.', 'Évite les confrontations inutiles avec l’autre gros tapis : vous avez tous les deux beaucoup à perdre.', 'Mets la pression sur la bulle par petites relances répétées : 2 à 2,2 BB suffisent.'] },
      { ask: 'Et une fois dans l’argent ?', h: 'Les places payées', p: ['Juste après la bulle, beaucoup de joueurs se relâchent et poussent large : paie un peu plus large, car ils n’ont plus peur. Chaque palier de gains réactive ensuite la prudence ICM.'] }
    ],
    mistake: 'Jouer la bulle comme le début : payer un tapis à la limite avec un tapis moyen, alors que perdre te coûte bien plus que gagner ne te rapporte.',
    retain: ['Début : serré-agressif, valeur contre les récréatifs.', 'Antes : vole et défends plus large.', 'Bulle : les tapis moyens se crispent, le gros tapis attaque, les calls se resserrent.'],
    quiz: [
      { q: 'Avec la BB ante, le pot préflop vaut…', o: ['1,5 BB', '2 BB', '2,5 BB', '3 BB'], a: 2, why: 'SB 0,5 + BB 1 + ante 1 = 2,5 BB.' },
      { q: 'Tu es gros tapis à la bulle, les tapis moyens sont à ta gauche. Tu…', o: ['ouvres plus large', 'ne joues que AA', 'limpes tout', 'fais tapis à chaque main'], a: 0, why: 'Les tapis moyens ne peuvent pas te contrer sans risquer leur tournoi.' },
      { q: 'Face à l’autre gros tapis, à la bulle, tu…', o: ['cherches la confrontation', 'évites les coups marginaux', 'paies tout', 'bluffes plus'], a: 1, why: 'Vous avez tous les deux beaucoup à perdre.' },
      { q: 'Juste après la bulle, les adversaires poussent souvent plus large. Tu…', o: ['paies un peu plus large', 'paies plus serré', 'ne changes rien', 'te couches toujours'], a: 0, why: 'Ils n’ont plus peur, leurs ranges s’élargissent.' },
      { q: 'En début de tournoi contre un récréatif, ton arme principale est…', o: ['le bluff', 'le value bet', 'le limp', 'le tapis préflop'], a: 1, why: 'Il paie trop : on mise pour la valeur.' }
    ]
  };

  L[23] = {
    minutes: 11, sit: 'icm',
    key: ['En tournoi, un jeton perdu vaut plus qu’un jeton gagné : la valeur en euros d’un tapis n’est pas proportionnelle aux jetons.', 'L’ICM resserre surtout les calls ; les tapis en premier restent souvent rentables.'],
    sections: [
      { ask: 'C’est quoi l’ICM ?', h: 'Le principe', p: ['L’ICM (modèle de Malmuth-Harville) traduit des tapis en euros : chaque joueur a une chance de finir premier proportionnelle à son tapis, puis on répète pour les places suivantes.', 'Exemple : trois joueurs à 1 000 jetons chacun, prix de 50, 30 et 20 € : chacun vaut 33,33 €. Doubler ton tapis ne double pas ta valeur.'] },
      { ask: 'Un exemple chiffré ?', h: 'Exemple à la bulle d’un Sit & Go', p: ['Quatre joueurs, trois payés (50/30/20 €). Les tapis : 40, 14, 9 et 21 BB. Tu as 21 BB en grosse blinde, la SB pousse ses 9 BB avec environ 74 % des mains. Payer coûte 8 BB pour un pot final de 19 BB : en jetons, il te faut 42 % d’équité.', 'Avec 8♣ 2♠ (33 %), fold évident. Avec J♦ 7♣ (45 %), payer gagnerait des jetons ; mais en euros, se coucher vaut 25,51 € et payer 25,10 € : la bulle transforme ce call rentable en fold. Avec A♠ 7♦ (57 %), payer vaut 27,11 € : tu paies.'] },
      { ask: 'Qui doit se méfier le plus ?', h: 'Qui subit la pression', p: ['Les tapis moyens subissent le plus l’ICM : ils peuvent perdre gros et gagnent peu. Les gros tapis peuvent attaquer ; les très petits tapis, qui sont presque éliminés, peuvent prendre des risques.', 'Le bubble factor mesure cette pression : 1 pour un gros tapis, 1,5 à 2 pour un tapis moyen. Un bubble factor de 2 signifie qu’il faut deux fois plus d’avantage pour payer.'] },
      { ask: 'Et quand on pousse en premier ?', h: 'Pousser reste rentable', p: ['L’ICM resserre tes calls mais beaucoup moins tes tapis en premier : à la bulle, les autres joueurs se couchent davantage, ta fold equity augmente.', 'Les tables du chapitre 22 sont calculées en jetons : près d’un palier, resserre tes calls de quelques points, garde tes tapis.'] }
    ],
    mistake: 'Payer un tapis « parce que la cote est bonne » à la bulle avec un tapis moyen : en euros, c’est souvent une erreur.',
    retain: ['ICM : la valeur en euros n’est pas proportionnelle aux jetons.', 'Les tapis moyens subissent le plus la bulle.', 'L’ICM resserre surtout les calls ; les tapis en premier gagnent en fold equity.'],
    quiz: [
      { q: 'Trois joueurs à tapis égaux, prix 50/30/20 €. Valeur de chacun ?', o: ['50 €', '33,33 €', '30 €', '20 €'], a: 1, why: 'Symétrie : 100 € ÷ 3.' },
      { q: 'Qui subit le plus la pression de la bulle ?', o: ['Le gros tapis', 'Le tapis moyen', 'Le tout petit tapis', 'Personne'], a: 1, why: 'Il peut perdre beaucoup et gagne peu.' },
      { q: 'À la bulle, l’ICM resserre surtout…', o: ['tes tapis en premier', 'tes calls de tapis', 'tes c-bets', 'tes limps'], a: 1, why: 'Payer un tapis te met à risque d’élimination.' },
      { q: 'Un bubble factor de 2 signifie que…', o: ['tu dois payer deux fois plus', 'il te faut beaucoup plus d’avantage pour payer', 'tu as deux fois plus de jetons', 'rien de spécial'], a: 1, why: 'Perdre coûte deux fois plus que gagner ne rapporte.' },
      { q: 'Un call rentable en jetons peut-il être un fold en euros ?', o: ['Oui', 'Non'], a: 0, why: 'C’est l’effet de bulle.' }
    ]
  };

  L[24] = {
    minutes: 11,
    key: ['En table finale, chaque place vaut de l’argent : on pense ICM avant chaque gros call.', 'En heads-up, les ranges s’élargissent énormément et la position décide de tout.'],
    sections: [
      { ask: 'Comment aborder la table finale ?', h: 'Les paliers de gains', p: ['Chaque élimination fait monter les gains des autres : la pression de la bulle revient à chaque palier. Repère qui est le plus petit tapis : tant qu’il est là, les tapis moyens doivent éviter les gros coups entre eux.'] },
      { ask: 'Que faire selon son tapis ?', h: 'Jouer selon son tapis', p: ['Petit tapis : cherche le bon spot pour pousser avant d’être trop court ; sous 10 BB, ta fold equity fond.', 'Tapis moyen : vole les blindes des gros tapis qui jouent serré, évite de payer les tapis des autres moyens.', 'Gros tapis : presse les moyens par des relances fréquentes et petites, évite le duel avec l’autre gros tapis.'] },
      { ask: 'Et le deal ?', h: 'Le deal ICM', p: ['Les joueurs peuvent s’accorder pour partager les gains selon les tapis (deal ICM ou chip chop). C’est ton choix : un deal réduit la variance, mais si tu es meilleur que tes adversaires, continuer peut rapporter plus.'] },
      { ask: 'Comment jouer le heads-up ?', h: 'Le heads-up', p: ['Le bouton est aussi la petite blinde : il parle en premier préflop et en dernier après le flop. Ouvre 70 à 80 % des mains au bouton à 25 BB et plus, et défends la grosse blinde très large (plus de 60 % face à une relance minimum).', 'Sous 15 BB, le heads-up se joue en tapis ou fold : les tables du chapitre 22 pour la SB et la BB sont exactes en heads-up.'] },
      { ask: 'Et les surmises qu’on voit en heads-up ?', h: 'La surmise en heads-up', p: ['En heads-up, les ranges sont si larges que les surmises sont beaucoup plus fréquentes : relance préflop au tapis à 15-20 BB, surmise au flop sur un board qui te favorise, surmise à la river avec les nuts ou un bluff à bloqueurs.', 'Pour te défendre, compte : face à une surmise de 1,5 pot, il te faut 37,5 %. Contre une range très large, une paire moyenne suffit souvent. Ne te couche pas par réflexe : en heads-up, la main moyenne est souvent la meilleure.'] }
    ],
    mistake: 'Jouer le heads-up comme une table pleine : se coucher trop souvent et laisser l’adversaire voler les blindes à chaque main.',
    retain: ['Chaque palier réactive l’ICM : les tapis moyens évitent les coups entre eux.', 'Heads-up : ouvre 70 à 80 % au bouton, défends la BB très large.', 'Face à une surmise en heads-up, compte l’équité requise et paie plus large qu’en table pleine.'],
    quiz: [
      { q: 'En heads-up, qui est la petite blinde ?', o: ['Le joueur hors position', 'Le bouton', 'Personne', 'La grosse blinde'], a: 1, why: 'En heads-up, le bouton poste la petite blinde.' },
      { q: 'Part de mains à ouvrir au bouton en heads-up à 30 BB ?', o: ['20 %', '40 %', '70 à 80 %', '100 %'], a: 2, why: 'Il ne reste qu’un adversaire, la position et les blindes poussent à ouvrir très large.' },
      { q: 'En table finale, le petit tapis est encore là. Deux tapis moyens doivent…', o: ['s’affronter', 'éviter les gros coups entre eux', 'pousser à chaque main', 'faire un deal'], a: 1, why: 'L’élimination du petit tapis rapporterait à tous les deux.' },
      { q: 'Face à une surmise de 1,5 fois le pot en heads-up, équité requise ?', o: ['25 %', '33 %', '37,5 %', '50 %'], a: 2, why: '1,5 ÷ (1 + 3) = 37,5 %.' },
      { q: 'Un deal ICM…', o: ['est obligatoire', 'partage les gains selon les tapis, c’est ton choix', 'donne tout au chip leader', 'est interdit sur Winamax'], a: 1, why: 'C’est un accord entre joueurs.' }
    ]
  };

  L[27] = {
    minutes: 10,
    key: ['Contre les récréatifs, le profit vient de la valeur, pas du bluff : ils paient trop.', 'On ajuste chaque profil : on mise gros contre ceux qui paient, on vole ceux qui se couchent.'],
    sections: [
      { ask: 'Comment gagner contre un récréatif qui paie tout ?', h: 'La calling station : de la valeur, encore de la valeur', p: ['Elle paie avec n’importe quelle paire jusqu’à la river. Mise pour la valeur sur trois rues avec top paire et mieux, et grossis tes mises : deux tiers du pot à la place d’un tiers.', 'Ne la bluffe jamais : elle paiera. Et quand elle relance, crois-la : une station qui relance a une grosse main.'] },
      { ask: 'Et contre le récréatif fantasque ?', h: 'Le fantasque : rester simple', p: ['Il limpe, relance au minimum, mise des tailles bizarres. Ses tailles parlent souvent : grosse mise, grosse main ; petite mise, main moyenne ou tirage.', 'Joue des ranges un peu plus serrées et simples, isole ses limps, mise pour la valeur, évite les bluffs élaborés en plusieurs rues qu’il ne comprendra pas.'] },
      { ask: 'Contre un large-passif ?', h: 'Le large-passif : isoler et miser', p: ['Il entre dans beaucoup de pots sans relancer. Isole ses limps (chapitre 7) et mise ensuite : il se couche quand il manque le flop, paie quand il touche.', 'Ses rares relances sont fortes : respecte-les.'] },
      { ask: 'Et contre les joueurs larges et agressifs ?', h: 'Le large-agressif et le maniac', p: ['Ils relancent et misent souvent. Paie plus large, laisse-les bluffer, piège avec tes mains fortes (check-call puis relance à la river).', 'Sur-relance (3-bet) plus pour la valeur avec une range plus large : 99+, AJ+, KQ. Ne bluffe pas un maniac : il paie par principe.'] },
      { ask: 'Comment lire une surmise au club ?', h: 'La surmise au club', p: ['Au club, une mise plus grosse que le pot est lue comme de la force : les nits et les joueurs prudents se couchent presque toujours. C’est un bon bluff contre eux, rarement contre une station.', 'Quand un récréatif surmise, c’est le plus souvent une très grosse main : couche les mains moyennes.'] }
    ],
    mistake: 'Bluffer une calling station à la river parce que « le board fait peur » : elle paie avec sa paire de 4.',
    retain: ['Station : value bet gros sur trois rues, zéro bluff.', 'Fantasque et large-passif : isole, reste simple, lis ses tailles.', 'Large-agressif et maniac : paie plus large, piège, 3-bet de valeur plus large.'],
    quiz: [
      { q: 'Contre une calling station, avec top paire, tu mises…', o: ['petit pour la garder', 'gros sur trois rues', 'jamais', 'seulement à la river'], a: 1, why: 'Elle paie trop : la valeur se prend en grosses mises.' },
      { q: 'Une station relance ta mise à la turn. Elle a le plus souvent…', o: ['un bluff', 'une grosse main', 'un tirage', 'rien'], a: 1, why: 'Les stations relancent rarement sans main forte.' },
      { q: 'Contre un maniac, ta range de 3-bet de valeur…', o: ['se resserre', 'reste la même', 's’élargit', 'disparaît'], a: 2, why: 'Il ouvre très large : tes mains moyennes-fortes sont en avance.' },
      { q: 'Un récréatif fait une surmise à la river. Avec une paire moyenne, tu…', o: ['paies toujours', 'te couches le plus souvent', 'relances', 'fais tapis'], a: 1, why: 'Au club, la surmise d’un récréatif est presque toujours une grosse main.' },
      { q: 'Contre un nit, une surmise en bluff est…', o: ['inutile', 'souvent efficace', 'interdite', 'toujours payée'], a: 1, why: 'Les nits se couchent face à la force.' }
    ]
  };

  L[30] = {
    minutes: 8,
    key: ['Chaque session se transforme en deux ou trois points de travail précis.', 'On revoit les mains où l’on a hésité, pas seulement celles qu’on a perdues.'],
    sections: [
      { ask: 'Quelles mains revoir ?', h: 'Choisir les mains', p: ['D’abord les mains où tu as hésité : c’est le signe le plus sûr d’une zone floue. Ensuite les tapis et les gros pots, gagnés ou perdus. Enfin les mains où tu t’es écarté de ta range.', 'Dans l’appli, le tracker les classe pour toi : tapis, gros pots, mains hors range.'] },
      { ask: 'Comment analyser une main ?', h: 'La grille de quatre questions', p: ['1. Quelle était ma range dans ce spot, et ma main en faisait-elle partie ? 2. Que représente l’adversaire avec sa ligne, vu son profil ? 3. Si j’avais vu ses cartes, aurais-je joué autrement, et quel indice aurait dû m’alerter ? 4. Puis-je dire en une phrase pourquoi j’ai joué ainsi ?', 'Si tu ne peux pas répondre à la quatrième, c’était un réflexe, pas une décision.'] },
      { ask: 'Un exemple complet ?', h: 'Une revue pas à pas', p: ['Main : tu as A♠Q♦ en UTG et tu te couches. 1. Ta range UTG (TAG) ouvre AQo : la main en faisait partie. 2. Personne n’avait encore agi. 3. Pas d’information contraire. 4. Raison : « peur d’être relancé ». Ce n’est pas une raison de poker.', 'Point de travail : « ouvrir toute ma range UTG, y compris AQo ». La séance du jour le reprendra.'] },
      { ask: 'Et le solveur ?', h: 'Quand utiliser le solveur', p: ['Le solveur répond à « est-ce que je m’écarte de l’équilibre ici ? », pas à « quelles sont les bases ? ». Utilise-le en dernier, sur une décision précise, une fois que tes ranges sont automatiques.'] }
    ],
    mistake: 'Ne revoir que les gros pots perdus : on juge sur le résultat (une mauvaise carte) au lieu de la décision.',
    retain: ['Revois d’abord les mains où tu as hésité, puis les gros pots.', 'Quatre questions : ma range, sa ligne, ce que j’aurais fait en voyant ses cartes, ma raison en une phrase.', 'Termine chaque revue par deux ou trois points de travail.'],
    quiz: [
      { q: 'Quelles mains revoir en priorité ?', o: ['Les gros pots perdus seulement', 'Celles où tu as hésité', 'Les mains gagnées', 'Aucune'], a: 1, why: 'L’hésitation signale une zone à travailler.' },
      { q: 'Tu ne peux pas dire pourquoi tu as payé. C’était…', o: ['une bonne décision', 'un réflexe', 'un bluff', 'une lecture'], a: 1, why: 'Sans raison formulable, c’est un réflexe.' },
      { q: 'Le solveur sert surtout à…', o: ['apprendre les bases', 'vérifier une décision précise une fois les bases acquises', 'remplacer la revue', 'choisir ses tournois'], a: 1, why: 'Il mesure l’écart à l’équilibre.' },
      { q: 'Une revue se termine par…', o: ['un score', 'deux ou trois points de travail', 'rien', 'une nouvelle range'], a: 1, why: 'L’objectif est de transformer la session en travail ciblé.' }
    ]
  };

  L[15].podcast = [
    ['J', 'Salut Yo ! Aujourd’hui, tu m’as dit qu’on parlait de la turn. Honnêtement, je ne vois pas pourquoi elle mérite un épisode entier : c’est juste la quatrième carte, non ?'],
    ['Y', 'Salut ! Justement, c’est la carte que la plupart des joueurs jouent en pilote automatique. Au flop, on a des repères. À la river, on se force à réfléchir parce que c’est la fin. Et la turn, on la traverse sans plan. Or c’est souvent là que le pot devient gros.'],
    ['J', 'Gros comment ?'],
    ['Y', 'Prends un pot simple, comme au club. Tu relances à deux grosses blindes, la grosse blinde paie : il y a quatre grosses blindes et demie au flop. Tu mises la moitié du pot, il paie : au début de la turn, il y en a déjà presque neuf. Si tu mises encore deux tiers du pot, tu en mets six d’un coup. Et à la river, une mise de deux tiers t’envoie presque à tapis. Autrement dit, la turn, c’est le moment où tu décides si ta main vaut trois rues de mise. Après, il est souvent trop tard pour changer d’avis.'],
    ['J', 'D’accord. Alors concrètement, je continue à miser quand ?'],
    ['Y', 'On va le voir sur une main. Tu es au bouton avec valet et dix de pique. Tu relances, la grosse blinde paie. Flop : huit de pique, sept de carreau, deux de trèfle. Tu mises un tiers du pot, elle paie.'],
    ['J', 'Je n’ai rien, là. Hauteur valet.'],
    ['Y', 'Tu n’as pas de paire, mais tu as un tirage ventral : un neuf te donne la quinte, du valet au sept. Ça fait quatre cartes. Maintenant, la turn : as de pique.'],
    ['J', 'Un as… Ça ne m’aide pas, je n’ai pas d’as.'],
    ['Y', 'Regarde mieux. L’as de pique te donne un tirage couleur : tu as deux piques en main, il y en a deux au tableau. Neuf piques restants te donnent la couleur. Plus les trois neufs qui ne sont pas des piques pour la quinte. Douze cartes en tout. Avec une carte à venir, c’est à peu près douze fois deux, vingt-quatre pour cent. Et surtout, l’as est une carte qui fait peur à la grosse blinde.'],
    ['J', 'Pourquoi elle aurait peur ? Elle peut avoir un as aussi.'],
    ['Y', 'Elle peut, mais réfléchis à sa range. Avec as-roi ou as-dame, beaucoup de joueurs auraient sur-relancé avant le flop. Et avec un as faible, elle se serait souvent couchée face à ta relance ou aurait payé puis lâché au flop sur huit-sept-deux. Toi, en revanche, tu as relancé au bouton : ta range contient plein d’as. Cette carte améliore ta range bien plus que la sienne. C’est exactement le profil d’une bonne carte pour continuer à miser. On appelle ça un deuxième barrel.'],
    ['J', 'Et je mise combien ?'],
    ['Y', 'Deux tiers du pot. Après ta petite mise au flop, il y a environ sept grosses blindes et demie : tu en mises cinq. Fais le calcul de ton bluff : tu risques cinq pour en gagner sept et demie. Il faut qu’elle se couche quatre fois sur dix pour que ce soit rentable tout de suite. Et quand elle paie, tu as encore vingt-quatre pour cent de toucher ta couleur ou ta quinte. C’est ce qu’on appelle un semi-bluff : tu peux gagner de deux façons.'],
    ['J', 'Et si la turn avait été un sept, par exemple ?'],
    ['Y', 'Là, c’est l’inverse. Un deuxième sept double le tableau, et c’est la grosse blinde qui a payé avec des sept, des huit-sept, des petites paires. La carte l’aide, elle. Avec valet-dix sans tirage couleur, tu checkes et tu prends ta carte gratuite. Retiens la question à te poser à chaque turn : cette carte améliore-t-elle plutôt ma range, ou la sienne ?'],
    ['J', 'C’est clair. Mais quand j’ai une vraie main, je mise toujours, non ?'],
    ['Y', 'Pas toujours. Deuxième main. Tu as paire d’as, as de carreau et as de trèfle. Tu relances, la grosse blinde paie. Flop : dame de cœur, huit de cœur, trois de trèfle. Tu mises, elle paie. Turn : cinq de cœur.'],
    ['J', 'Troisième cœur.'],
    ['Y', 'Voilà. Quand elle a payé au flop sur deux cœurs, elle avait souvent un tirage couleur. Ce tirage vient de rentrer. Elle peut aussi avoir dame-huit ou une paire de dames avec un cœur. Ta paire d’as, qui était une main de valeur sur trois rues, devient une main à protéger mais à ne pas surpayer.'],
    ['J', 'Donc je checke avec une paire d’as ? Ça me fait mal au cœur.'],
    ['Y', 'Ça fait mal, mais réfléchis à qui paie une grosse mise maintenant : les couleurs, les doubles paires, les brelans. Les mains plus faibles que toi se couchent. Tu ne mises plus pour la valeur, tu mises contre des mains qui te battent. Alors tu checkes et tu contrôles le pot. Si elle mise petit, tu paies. Si elle mise très gros, tu réfléchis à son profil : un nit qui mise gros sur le troisième cœur, c’est presque toujours la couleur.'],
    ['J', 'Et le contraire ? Quand la carte complète ce que moi je représente ?'],
    ['Y', 'Alors tu mises. Si tu as relancé avant le flop et qu’un as tombe, ou si tu as un tirage qui rentre, tu racontes une histoire cohérente. Ton adversaire aura beaucoup de mal à continuer.'],
    ['J', 'On m’a parlé de surmise à la turn. C’est quoi exactement ?'],
    ['Y', 'Une surmise, c’est une mise plus grosse que le pot. Et la turn, c’est l’endroit où elle est la plus utile. Troisième main. Tu es au cut-off avec neuf de cœur et neuf de trèfle. Tu relances, la grosse blinde paie. Flop : roi de pique, neuf de carreau, quatre de trèfle. Tu as un brelan.'],
    ['J', 'Super main !'],
    ['Y', 'Excellente. Tu mises un tiers du pot, elle paie. Turn : deux de cœur. Une carte qui ne change rien. On l’appelle une carte blanche. Maintenant, qui a les très grosses mains sur ce tableau ? Toi, tu peux avoir roi-roi, neuf-neuf, quatre-quatre, as-roi. Elle, rarement roi-roi ou as-roi, qu’elle aurait sur-relancés avant le flop. On dit que tu as l’avantage des nuts. Elle a surtout des rois moyens, comme roi-dix ou roi-huit.'],
    ['J', 'Donc je mise gros pour qu’elle paie avec son roi.'],
    ['Y', 'Exactement. Tu mises un pot et quart, voire un pot et demi. Avec un roi, elle a beaucoup de mal à se coucher, et chaque grosse blinde qu’elle paie maintenant, c’est de la valeur en plus. Et comme tu fais aussi parfois cette surmise avec des tirages, elle ne peut pas te mettre sur un brelan à chaque fois.'],
    ['J', 'Et si c’est moi qui prends une surmise ? Je fais quoi ?'],
    ['Y', 'Tu comptes. Face à une mise d’un pot et demi, tu paies une fois et demie le pot pour gagner un pot plus cette mise. Le calcul : un et demi divisé par un plus deux fois un et demi, c’est-à-dire un et demi sur quatre, soit environ trente-huit pour cent. Il te faut donc une chance sur trois et un peu plus. Avec roi-dame sur ce tableau, contre un joueur régulier qui surmise avec des brelans et quelques tirages, c’est serré. Contre un nit, tu te couches. Contre un joueur qui bluffe beaucoup, tu paies.'],
    ['J', 'Dernière question : et si personne n’a misé au flop ?'],
    ['Y', 'Si tu as checké le flop en position et que ton adversaire checke encore la turn, il a montré de la faiblesse deux fois. C’est un très bon moment pour miser, même avec une main moyenne : c’est la mise retardée. Et si c’est la grosse blinde qui te mise dedans à la turn après avoir checké le flop, c’est souvent une main moyenne qui veut prendre de la valeur ou se protéger.'],
    ['J', 'On fait le petit quiz ?'],
    ['Y', 'Allez. Première question : tu as relancé et misé au flop huit-six-deux. La turn est un roi. Bonne carte pour un deuxième barrel, oui ou non ? Réfléchis.'],
    ['P', 5],
    ['Y', 'Oui. Le roi améliore ta range de relanceur bien plus que celle du défenseur.'],
    ['Y', 'Deuxième question : face à une mise de la taille du pot, quelle équité te faut-il pour payer ?'],
    ['P', 5],
    ['Y', 'Trente-trois pour cent. Tu paies un pour gagner deux.'],
    ['Y', 'Troisième question : tu as une paire d’as sans cœur, et la turn amène le troisième cœur. Tu mises gros ou tu ralentis ?'],
    ['P', 5],
    ['Y', 'Tu ralentis. Les mains qui paient une grosse mise te battent souvent.'],
    ['J', 'J’ai eu les trois !'],
    ['Y', 'Bravo. Alors on résume. Un : à la turn, le pot devient gros, décide si ta main vaut trois rues. Deux : continue à miser sur les cartes qui améliorent ta range, de préférence avec des tirages. Trois : ralentis sur les cartes qui aident ton adversaire, même avec une belle paire. Quatre : la surmise sur carte blanche, quand tu as l’avantage des nuts. Et face à elle, compte : il te faut environ trente-huit pour cent contre un pot et demi.'],
    ['J', 'Je vais retourner faire le quiz de la leçon.'],
    ['Y', 'Bonne idée. Et dans S’entraîner, l’exercice « Outs et cote » te fera compter tes outs à la turn. À bientôt à la table !']
  ];

  L[1].podcast = [
    ['J', 'Salut Yo ! Premier épisode. On commence par quoi ?'],
    ['Y', 'Salut ! Par la base de tout le reste : ton style de jeu. Avant de parler de cartes, je veux que tu saches pourquoi on gagne au poker. Parce que si tu ne sais pas d’où vient l’argent, tu ne sais pas quoi chercher à la table.'],
    ['J', 'On gagne quand on a les meilleures cartes, non ?'],
    ['Y', 'C’est ce que tout le monde pense au début. Mais sur une soirée, tout le monde reçoit à peu près les mêmes cartes. Les as, tu les auras autant que ton voisin. Ce qui fait la différence, c’est ce que chacun fait avec ses cartes. Le profit vient des erreurs des autres.'],
    ['J', 'Des erreurs comment ?'],
    ['Y', 'Un joueur américain, David Sklansky, l’a résumé dans ce qu’on appelle le théorème fondamental du poker. Chaque fois que ton adversaire joue autrement qu’il l’aurait fait s’il voyait tes cartes, tu gagnes. Et chaque fois que toi, tu joues autrement que si tu voyais les siennes, tu perds.'],
    ['J', 'Donne-moi un exemple concret.'],
    ['Y', 'Tu as une paire de rois. Ton voisin a dame-valet et il paie ta mise jusqu’à la river. S’il voyait tes rois, il se coucherait tout de suite. Il a donc fait une erreur, et cette erreur, ce sont tes jetons. Autre cas : tu mises avec rien, et il se couche avec une paire de huit, qui était devant. S’il avait vu ta main, il aurait payé. Encore une erreur, encore des jetons pour toi.'],
    ['J', 'D’accord. Et comment je fais pour qu’ils fassent plus d’erreurs ?'],
    ['Y', 'C’est là qu’intervient le style serré-agressif. Serré, ça veut dire que tu joues peu de mains. Du coup, quand tu entres dans un coup, ta main est en moyenne plus forte que celle des autres. Agressif, ça veut dire que tu relances et que tu mises, plutôt que de payer.'],
    ['J', 'Pourquoi relancer plutôt que payer ? Payer, c’est moins risqué.'],
    ['Y', 'C’est moins cher sur le moment, mais ça rapporte moins. Quand tu paies, tu n’as qu’une seule façon de gagner : avoir la meilleure main à l’abattage. Quand tu mises ou que tu relances, tu en as deux : soit tu as la meilleure main, soit l’adversaire se couche et tu gagnes sans montrer. Deux portes de sortie au lieu d’une.'],
    ['J', 'Et si je joue serré mais que je paie tout le temps ?'],
    ['Y', 'Alors tu es serré-passif, et c’est le profil qui perd le plus lentement mais le plus sûrement en tournoi. Je le vois souvent au club : un joueur qui attend une grosse main, qui paie quand il en a une moyenne, et qui ne relance qu’avec les as. Tout le monde finit par le savoir. Quand il relance, tout le monde se couche. Quand il paie, on mise pour la valeur contre lui.'],
    ['J', 'C’est un peu moi, ça, je crois. Je me trouve souvent trop serré.'],
    ['Y', 'C’est pour ça qu’on a fait le test de profil au début. Et c’est un très bon point de départ, serré : ce n’est pas grave de commencer là. Le problème, c’est le plafond. Un joueur trop serré gagne doucement en début de tournoi. Puis les blindes montent, et lui attend toujours. Il devient court, il doit faire tapis avec des mains moyennes, et il saute.'],
    ['J', 'Alors comment on dépasse ce plafond ?'],
    ['Y', 'Il y a trois leviers. Le premier, c’est la position. Plus tu parles tard, plus tu peux ouvrir large, parce que tu joueras le coup en voyant ce que font les autres. Le deuxième, c’est l’agression : voler les blindes quand personne n’est entré, et défendre ta grosse blinde au lieu de la donner. Le troisième, c’est l’adaptation : jouer différemment contre le joueur qui se couche tout le temps et contre celui qui paie tout.'],
    ['J', 'Ça fait beaucoup.'],
    ['Y', 'C’est tout le programme du cours. Mais retiens l’ordre : d’abord une base solide, les ranges de ton profil. Ensuite la position. Ensuite l’agression. L’adaptation vient en dernier, quand le reste est automatique.'],
    ['J', 'Une dernière chose : et la chance, dans tout ça ?'],
    ['Y', 'Elle compte énormément sur une soirée, presque pas sur une année. Sur un coup, le joueur qui a fait l’erreur peut gagner. Sur des milliers de coups, celui qui fait moins d’erreurs gagne. C’est pour ça qu’on juge une décision, pas un résultat. Et la chance, on ne peut pas la travailler. Le reste, oui.'],
    ['J', 'On fait le quiz ?'],
    ['Y', 'Allez. Première question : combien de façons de gagner te donne une mise ?'],
    ['P', 5],
    ['Y', 'Deux : avoir la meilleure main, ou faire coucher l’adversaire. Un call ne t’en donne qu’une.'],
    ['Y', 'Deuxième question : selon le théorème fondamental, quand est-ce que tu gagnes ?'],
    ['P', 5],
    ['Y', 'Quand ton adversaire joue autrement qu’il l’aurait fait en voyant tes cartes.'],
    ['Y', 'Troisième question : quel est le principal défaut d’un joueur trop serré en tournoi ?'],
    ['P', 5],
    ['Y', 'Les blindes le grignotent. Il attend trop, devient court, et doit prendre des risques au pire moment.'],
    ['J', 'Trois sur trois.'],
    ['Y', 'Bravo. On résume. Un : on gagne grâce aux erreurs des autres, pas grâce aux cartes. Deux : serré-agressif, c’est peu de mains, mais jouées en relançant. Trois : serré-passif, c’est le piège. Quatre : pour progresser, la position, l’agression, puis l’adaptation. Prochain épisode : les positions à la table. À bientôt !']
  ];

  L[2].podcast = [
    ['J', 'Salut Yo ! Aujourd’hui, les positions. J’ai déjà les noms en tête : UTG, bouton, les blindes…'],
    ['Y', 'Salut ! On va aller plus loin que les noms. Je veux que tu comprennes pourquoi la place où tu es assis compte presque autant que tes cartes. Mais d’abord, faisons le tour de la table à neuf joueurs, dans l’ordre où on parle avant le flop.'],
    ['J', 'Vas-y.'],
    ['Y', 'Le premier à parler, juste à gauche de la grosse blinde, c’est UTG, under the gun, littéralement « sous le pistolet ». Ensuite UTG+1, puis UTG+2 qu’on appelle aussi MP, la position du milieu. Puis le lojack, le hijack, le cut-off, et le bouton. Et enfin les deux blindes : la petite, puis la grosse, qui parle en dernier avant le flop.'],
    ['J', 'Et après le flop ?'],
    ['Y', 'L’ordre change. La petite blinde parle en premier, si elle est encore dans le coup, et le bouton parle toujours en dernier. C’est pour ça que le bouton est la meilleure place de la table : à chaque tour après le flop, il voit ce que tout le monde a fait avant de décider.'],
    ['J', 'C’est si important que ça, de parler en dernier ?'],
    ['Y', 'Énorme. Imagine que tu as une paire moyenne au flop. Si tu parles en premier, tu dois deviner : est-ce que je mise, est-ce que je checke ? Si tu parles en dernier, ton adversaire t’a déjà donné une information. Il checke ? Il montre peut-être de la faiblesse, tu peux miser. Il mise gros ? Tu peux te coucher sans avoir rien investi de plus. Tu contrôles la taille du pot, tu prends des cartes gratuites quand tu tires, tu bluffes au bon moment.'],
    ['J', 'Donc j’ouvre plus large au bouton.'],
    ['Y', 'Exactement. Prends as-neuf dépareillé. En UTG, à neuf joueurs, il reste huit joueurs derrière toi. La probabilité que l’un d’eux ait une main qui domine la tienne, as-dix ou mieux, une paire, est forte. Et si tu es payé, tu joueras souvent hors de position. En UTG, ton profil se couche avec as-neuf dépareillé. Au bouton, il ne reste que les deux blindes. Tu ouvres sans hésiter, et tu joueras après elles à chaque tour.'],
    ['J', 'Et au club, on est rarement neuf à table en fin de tournoi.'],
    ['Y', 'Très bonne remarque. Et c’est le point le plus important de l’épisode. Quand la table se vide, les noms des places restent, mais la réalité change. À six joueurs, il n’y a plus que UTG, hijack, cut-off, bouton et les deux blindes. Celui qui parle en premier à six n’a que cinq joueurs derrière lui. Il joue à peu près comme le lojack à neuf.'],
    ['J', 'Donc je ne joue pas UTG à six comme UTG à neuf.'],
    ['Y', 'Surtout pas. C’est l’erreur classique. La règle simple : ne regarde pas le nom de la place, compte les joueurs qui parlent après toi. Huit joueurs derrière, tu es très serré. Cinq, tu ouvres comme un lojack. Deux, tu ouvres comme au bouton. C’est d’ailleurs comme ça que l’appli lit tes mains Winamax : à sept joueurs, le premier à parler est compté en position MP.'],
    ['J', 'Et les blindes, elles ont un avantage ou pas ?'],
    ['Y', 'Avant le flop, oui : elles parlent en dernier et elles ont déjà mis des jetons, donc elles ont une bonne cote pour payer. Mais après le flop, elles parlent en premier pendant tout le coup. C’est pour ça que les blindes sont les places où tout le monde perd des jetons sur le long terme. Le but n’est pas d’y gagner, c’est d’y perdre le moins possible. On en reparle dans l’épisode sur la défense des blindes.'],
    ['J', 'Une main pour illustrer ?'],
    ['Y', 'Tu es au cut-off avec roi-valet de cœur, tout le monde s’est couché. Tu ouvres à deux grosses blindes, comme on le fait au club. Le bouton se couche, la grosse blinde paie. Flop : dame, sept, trois, sans cœur. Elle checke. Toi, tu as tout vu : elle n’a pas misé. Tu peux miser petit pour prendre le pot, ou checker derrière et voir la turn gratuitement. Maintenant, inverse les places : tu es en grosse blinde avec roi-valet, tu paies l’ouverture du cut-off, et tu dois parler en premier au flop. Même main, même tableau, mais c’est toi qui dois deviner.'],
    ['J', 'C’est clair.'],
    ['Y', 'Alors le quiz. Première question : qui parle en dernier après le flop ?'],
    ['P', 5],
    ['Y', 'Le bouton.'],
    ['Y', 'Deuxième question : à six joueurs, le premier à parler ressemble à quelle place à neuf ?'],
    ['P', 5],
    ['Y', 'Au lojack. Il reste à peu près le même nombre de joueurs derrière lui.'],
    ['Y', 'Troisième question : pour choisir ta range, tu regardes le nom de ta place ou autre chose ?'],
    ['P', 5],
    ['Y', 'Le nombre de joueurs qui parlent après toi.'],
    ['J', 'Parfait.'],
    ['Y', 'On résume. Un : avant le flop, UTG parle en premier ; après, la petite blinde parle en premier et le bouton en dernier. Deux : parler en dernier, c’est voir avant de décider. Trois : on ouvre de plus en plus large en se rapprochant du bouton. Quatre : à table courte, compte les joueurs derrière toi. À bientôt !']
  ];

  L[3].podcast = [
    ['J', 'Salut Yo ! Aujourd’hui on parle du club. Ça, je connais bien !'],
    ['Y', 'Salut ! Tu connais l’ambiance, mais je veux te montrer que le jeu au club n’est pas le même qu’en ligne, et que les deux demandent des réglages différents. Première différence : le rythme. Combien de mains tu crois qu’on joue en une heure au club ?'],
    ['J', 'Je dirais… quarante ?'],
    ['Y', 'Plutôt vingt-cinq à trente. Il faut mélanger, distribuer, compter les jetons, attendre ceux qui réfléchissent. En ligne, une table joue soixante à quatre-vingts mains par heure. Et maintenant, le point clé : avec des niveaux de vingt minutes, tu ne vois que huit à dix mains par niveau.'],
    ['J', 'C’est très peu.'],
    ['Y', 'C’est très peu. Ça veut dire que les blindes montent vite par rapport au nombre de mains que tu reçois. En ligne, si tu attends une grosse main pendant un niveau, tu as vu quarante mains. Au club, tu en as vu neuf. Si tu attends les as, tu peux traverser trois niveaux sans les voir, et pendant ce temps ton tapis fond.'],
    ['J', 'Donc il faut jouer plus de mains ?'],
    ['Y', 'Il faut voler et défendre plus tôt. Pas jouer n’importe quoi : prendre les pots qui sont faciles. Quand tout le monde se couche jusqu’à toi au cut-off ou au bouton, ouvre ta range de vol sans attendre. Quand tu es grosse blinde face à une petite relance à deux grosses blindes, défends plus large : tu as une très bonne cote.'],
    ['J', 'Et les joueurs, ils sont différents ?'],
    ['Y', 'Oui. Une table de club, en moyenne, limpe beaucoup plus, paie beaucoup plus, et sur-relance rarement en bluff. Les relances sont souvent petites, deux grosses blindes. Et quand un joueur récréatif fait une grosse relance ou une grosse mise à la river, c’est presque toujours une vraie main.'],
    ['J', 'Et je m’adapte comment ?'],
    ['Y', 'Quatre ajustements. Un : quand il y a des limpers, relance pour les isoler, avec une main qui joue bien, on le verra au chapitre sept. Deux : mise gros pour la valeur, parce qu’ils paient. Trois : bluffe moins, pour la même raison. Quatre : respecte les grosses mises des joueurs prudents. Au club, payer une grosse mise de river « pour voir » coûte cher.'],
    ['J', 'Je te raconte une main de l’autre soir ?'],
    ['Y', 'Vas-y.'],
    ['J', 'J’avais as-roi en cut-off. Deux joueurs avaient limpé. J’ai juste payé, je ne voulais pas me faire relancer.'],
    ['Y', 'Et qu’est-ce qui s’est passé ?'],
    ['J', 'On était cinq au flop, j’ai raté, et j’ai lâché.'],
    ['Y', 'Voilà le coût du call. Avec as-roi derrière deux limpers, tu relances, en gros à quatre ou cinq grosses blindes. Tu prends souvent le pot tout de suite, sinon tu joues contre un ou deux adversaires avec la meilleure main et l’initiative. À cinq joueurs au flop, as-roi hauteur as ne vaut presque plus rien.'],
    ['J', 'Compris. Et l’étiquette ? On m’a déjà compté un call alors que je voulais relancer.'],
    ['Y', 'C’est la règle de la mise en une seule fois. Si tu poses tes jetons en plusieurs fois sans rien dire, le croupier peut compter seulement le premier geste. Donc soit tu annonces clairement « relance » avant de toucher tes jetons, soit tu poses le montant complet d’un seul mouvement. Et parle à ton tour : agir avant ton tour donne une information aux autres et peut être pénalisé.'],
    ['J', 'Et la lecture des joueurs ? Les fameux tells ?'],
    ['Y', 'Les gestes, c’est souvent du cinéma. Ce qui est fiable, c’est le temps de réflexion et les habitudes de mise. Un joueur qui paie très vite a souvent une main moyenne : avec un monstre, il aurait relancé, avec rien, il se serait couché. Une longue réflexion puis une grosse mise chez un joueur récréatif, c’est souvent la vraie main. Et après chaque soirée, note trois choses sur les habitués : s’il joue beaucoup de mains, s’il est agressif, et une habitude marquante.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Allez. Première question : combien de mains par niveau de vingt minutes au club, environ ?'],
    ['P', 5],
    ['Y', 'Huit à dix.'],
    ['Y', 'Deuxième question : contre une table qui paie beaucoup, quelle est ton arme principale ?'],
    ['P', 5],
    ['Y', 'La valeur. Ils paient, alors on mise avec nos bonnes mains, et on bluffe moins.'],
    ['Y', 'Troisième question : tu veux relancer, comment éviter qu’on te compte un simple call ?'],
    ['P', 5],
    ['Y', 'Tu annonces « relance », ou tu poses le montant en une seule fois.'],
    ['J', 'Bien.'],
    ['Y', 'On résume. Un : au club, huit à dix mains par niveau, donc on vole et on défend plus tôt. Deux : les tables de club limpent et paient, alors on isole, on mise pour la valeur, on bluffe moins. Trois : on respecte les grosses mises des joueurs prudents. Quatre : on annonce sa relance. À bientôt au club !']
  ];

  L[4].podcast = [
    ['J', 'Salut Yo ! La bankroll aujourd’hui. Pas le sujet le plus excitant…'],
    ['Y', 'Salut ! Pas le plus excitant, mais celui qui permet de continuer à jouer. La bankroll, c’est l’argent que tu réserves au poker, séparé du reste. Et la question n’est pas « combien je vais gagner », c’est « combien de mauvaises séries je peux encaisser sans m’arrêter ».'],
    ['J', 'Des mauvaises séries, il y en a tant que ça ?'],
    ['Y', 'Beaucoup plus que ce que les gens imaginent. En tournoi, la majorité de tes gains viendra de quelques bons résultats rares, une table finale, une victoire. Entre les deux, même un bon joueur peut enchaîner trente, cinquante tournois, parfois plus, sans grosse place payée. C’est normal. C’est la nature des tournois : beaucoup de joueurs, peu de places payées, et le gros de la dotation tout en haut.'],
    ['J', 'Alors il faut combien ?'],
    ['Y', 'On compte en buy-ins, c’est-à-dire en prix d’entrée. Pour les tournois multi-tables, on conseille cent à deux cents buy-ins. Pour les Sit and Go, où les places payées sont plus fréquentes, cinquante à cent. Exemple : tu joues des tournois à dix euros. Il te faut entre mille et deux mille euros réservés au poker.'],
    ['J', 'C’est beaucoup pour des tournois à dix euros.'],
    ['Y', 'Ça paraît beaucoup, mais c’est ce qui protège du risque de ruine : la probabilité de tout perdre alors que tu es un joueur gagnant. Avec trente buy-ins, une mauvaise série normale peut te vider. Avec cent cinquante, elle te fait juste baisser un peu. Si ces montants sont trop élevés pour toi, la solution n’est pas de jouer sans bankroll, c’est de jouer des tournois moins chers, ou des freerolls comme ceux du club.'],
    ['J', 'Et les re-entries ? Sur Winamax, je me réinscris parfois.'],
    ['Y', 'Chaque entrée est un buy-in. Une soirée à dix euros avec deux re-entries, ça coûte trente euros, pas dix. C’est souvent là que la bankroll fond sans qu’on s’en rende compte. Décide avant le tournoi combien d’entrées tu t’autorises, et tiens-t’y.'],
    ['J', 'Et pour monter de niveau ?'],
    ['Y', 'Tu fixes des règles à froid, un jour où tu ne joues pas. Par exemple : je monte au niveau supérieur quand ma bankroll atteint cent cinquante buy-ins de ce niveau. Je redescends si elle tombe sous quatre-vingts. Écris-les quelque part. Leur rôle, c’est de décider à ta place les soirs où tu n’es pas lucide.'],
    ['J', 'Les soirs où je viens de perdre, tu veux dire.'],
    ['Y', 'Exactement. Je te raconte un cas classique. Un joueur perd trois tournois à dix euros dans la soirée. Il se dit : je joue un tournoi à cinquante pour me refaire. Il le perd. Il vient de perdre en une heure ce qu’il aurait mis deux semaines à perdre en jouant normalement. Monter de niveau pour se refaire, c’est le chemin le plus court vers la ruine.'],
    ['J', 'Et comment je sais si je joue bien, si les résultats ne veulent rien dire ?'],
    ['Y', 'Sur quelques dizaines de tournois, les résultats ne disent presque rien. Ce qui dit quelque chose, c’est la qualité de tes décisions. C’est pour ça qu’on a mis dans l’appli la revue de tes mains et l’analyse de tes historiques : tu juges tes choix, pas tes résultats. Si tes décisions sont bonnes et que tu perds, c’est la variance. Si elles sont mauvaises et que tu gagnes, c’est aussi la variance, et elle finira par se retourner.'],
    ['J', 'Et les signes qu’il faut s’arrêter ?'],
    ['Y', 'Quatre signaux. Tu joues pour te refaire. Tu montes de niveau après une perte. Tu prends de l’argent hors de ta bankroll. Tu joues fatigué ou énervé. Dès que tu en vois un, la session est finie. On en reparle dans l’épisode sur le tilt.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : tu joues des tournois à dix euros, quelle bankroll ?'],
    ['P', 5],
    ['Y', 'Mille à deux mille euros, soit cent à deux cents buy-ins.'],
    ['Y', 'Deuxième question : quarante tournois sans place payée, ça prouve quoi ?'],
    ['P', 5],
    ['Y', 'Rien, à eux seuls. Il faut regarder tes décisions.'],
    ['Y', 'Troisième question : une soirée à dix euros avec deux re-entries coûte combien ?'],
    ['P', 5],
    ['Y', 'Trente euros. Chaque entrée compte.'],
    ['J', 'Trois sur trois.'],
    ['Y', 'On résume. Un : en tournoi, cent à deux cents buy-ins ; en Sit and Go, cinquante à cent. Deux : les longues séries sans gain sont normales. Trois : les règles de montée et de descente se fixent à froid. Quatre : on ne monte jamais pour se refaire. À bientôt !']
  ];
  L[5].podcast = [
    ['J', 'Salut Yo ! Aujourd’hui, les ouvertures. Mon gros sujet : je me trouve trop serré, surtout en début de table.'],
    ['Y', 'Salut ! Alors on va régler ça. Rappel du principe : plus il reste de joueurs derrière toi, plus ta range est serrée. En UTG, huit joueurs parlent après toi. Au bouton, deux. Résultat, avec ton profil TAG et un tapis de quarante grosses blindes ou plus, tu ouvres environ treize pour cent des mains en UTG, seize en MP, vingt-deux au hijack, vingt-neuf au cut-off et presque quarante-sept au bouton.'],
    ['J', 'Presque la moitié des mains au bouton ? Ça me paraît énorme.'],
    ['Y', 'C’est pourtant le standard des bons joueurs. Au bouton, tu n’as que deux joueurs à passer, ils ont souvent une main faible, et si tu es payé, tu joues avec la position à chaque tour. Une main comme roi-huit assorti ou dame-neuf dépareillé n’a rien d’extraordinaire, mais à cet endroit, elle gagne de l’argent. En UTG, la même main en perd.'],
    ['J', 'Et entre les profils, ça change beaucoup ?'],
    ['Y', 'Regarde les chiffres en UTG : le profil très serré ouvre environ neuf pour cent, le TAG treize, l’équilibré quinze, le large dix-sept. Au bouton : trente, quarante-sept, cinquante-cinq, cinquante-six. Les écarts sont petits en début de table et énormes en fin de table. C’est au cut-off et au bouton que se joue ton style.'],
    ['J', 'Et mon problème en UTG, alors ?'],
    ['Y', 'Ton problème, ce n’est pas la largeur, c’est la peur de certaines mains. Il y a des mains qu’on n’a pas le droit de jeter en UTG, dans aucun profil, même le plus serré. As-dame dépareillé, les paires de sept et plus, as-valet assorti et mieux, roi-dame assorti. Ce sont des ouvertures obligatoires.'],
    ['J', 'L’autre soir, j’ai jeté as-dame en UTG. J’avais peur d’une relance.'],
    ['Y', 'Je m’en doutais. Raisonne comme ça : qui va te relancer ? Un joueur avec as-roi, dame-dame ou mieux. Ça arrive, mais rarement. Et quand on te paie, c’est souvent avec as-valet, roi-dame, des paires moyennes : des mains que ton as-dame domine. Jeter as-dame par peur, c’est jeter une main qui bat largement la range de ceux qui vont jouer contre toi. Et si on te sur-relance fort, tu pourras toujours décider à ce moment-là, avec une information de plus.'],
    ['J', 'Et pour la taille ? Au club, on ouvre à deux grosses blindes.'],
    ['Y', 'Et c’est très bien. Deux grosses blindes coûtent peu et font le même travail qu’une relance plus grosse. Exemple : blindes cent-deux cents, tu ouvres à quatre cents. Les manuels parlent souvent de deux et demie sans ante et de deux virgule deux avec ante, et tu peux choisir ta taille dans les réglages de l’appli. Une exception : depuis la petite blinde, ouvre à trois grosses blindes, parce que tu joueras tout le coup hors de position.'],
    ['J', 'Et si je suis court ?'],
    ['Y', 'Entre vingt et quarante grosses blindes, on resserre un peu le début de table et on ouvre toujours petit, pour pouvoir se coucher face à un tapis sans avoir trop investi. Sous vingt grosses blindes, on passe en mode tapis ou fold, avec les tables du chapitre vingt-deux. Dans Ma range, tu peux changer la profondeur pour voir les trois versions.'],
    ['J', 'Une main pour finir ?'],
    ['Y', 'Tu es au cut-off avec quarante-cinq grosses blindes, tout le monde se couche jusqu’à toi. Tu as dix-neuf assorti de carreau. Ton profil TAG ouvre cette main au cut-off. Tu relances à deux grosses blindes. Le bouton et la petite blinde se couchent, la grosse blinde paie. Tu as déjà gagné quelque chose : soit les blindes se couchent et tu prends un pot et demi sans montrer, soit tu joues en position avec une main qui touche des quintes et des couleurs. Au cut-off, cette ouverture est rentable. En UTG, tu te couches.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : tu as as-dame dépareillé en UTG, tout le monde attend que tu parles. Que fait le profil le plus serré ?'],
    ['P', 5],
    ['Y', 'Il ouvre. C’est la première relance du coup : une ouverture obligatoire dans tous les profils.'],
    ['Y', 'Deuxième question : blindes deux cents, quatre cents. Quelle ouverture au club ?'],
    ['P', 5],
    ['Y', 'Huit cents, deux grosses blindes.'],
    ['Y', 'Troisième question : quelle taille d’ouverture depuis la petite blinde ?'],
    ['P', 5],
    ['Y', 'Trois grosses blindes, parce que tu seras hors de position.'],
    ['J', 'Ça rentre.'],
    ['Y', 'On résume. Un : moins il reste de joueurs derrière toi, plus tu ouvres large, jusqu’à presque la moitié des mains au bouton en TAG. Deux : as-dame, les paires de sept et plus, as-valet assorti et roi-dame assorti s’ouvrent toujours en UTG. Trois : deux grosses blindes au club, trois depuis la petite blinde. Quatre : ouvre ta range dans l’appli, et regarde-la avant chaque séance. À bientôt !']
  ];

  L[6].podcast = [
    ['J', 'Salut Yo ! Défendre les blindes. Je me couche souvent en grosse blinde, c’est mal ?'],
    ['Y', 'Salut ! Souvent, oui. On va voir pourquoi avec un calcul tout simple. Tu es en grosse blinde, tu as déjà mis une grosse blinde. Le bouton ouvre à deux grosses blindes, comme au club, la petite blinde se couche. Combien il y a dans le pot ?'],
    ['J', 'Deux plus une plus une demie… trois et demie.'],
    ['Y', 'Exact, sans compter les antes. Pour jouer, tu dois ajouter une seule grosse blinde. Après ton call, le pot fera quatre et demie. Tu mets une pour un pot final de quatre et demie : il te faut seulement vingt-deux pour cent d’équité, à peu près une chance sur cinq.'],
    ['J', 'C’est peu.'],
    ['Y', 'C’est très peu. Presque n’importe quelle main correcte a vingt-deux pour cent contre la range d’ouverture d’un bouton. Il y a une formule si tu veux la retenir : X moins un, divisé par deux X plus zéro virgule cinq, X étant la taille de l’ouverture. Face à deux et demie, il faut vingt-sept pour cent. Face à trois, trente et un. Et avec des antes, il en faut encore moins. Plus l’ouverture est petite, plus tu défends large.'],
    ['J', 'Mais je jouerai hors de position.'],
    ['Y', 'C’est vrai, et c’est pour ça qu’on ne défend pas cent pour cent des mains. Tu réaliseras un peu moins que ton équité. Mais la cote compense largement. Le profil TAG défend environ seize pour cent des mains contre UTG, vingt-neuf contre le cut-off, et environ la moitié contre le bouton. Le bouton ouvre presque une main sur deux : sa range est faible, ta défense s’élargit.'],
    ['J', 'Donc roi-neuf dépareillé contre le bouton…'],
    ['Y', 'Tu défends. Valet-huit assorti aussi. Se coucher avec ces mains face à une relance minimum du bouton, c’est l’erreur la plus fréquente que je vois au club. Chaque fois, tu donnes ta grosse blinde gratuitement.'],
    ['J', 'Et la sur-relance depuis la grosse blinde ?'],
    ['Y', 'Tu sur-relances avec deux types de mains. La valeur : les grosses paires, as-roi, as-dame, et contre le bouton, as-valet assorti. Et quelques bluffs bien choisis : as-cinq à as-deux assortis. Pourquoi ces mains-là ? Parce qu’elles bloquent un as dans la main adverse, ce qui réduit ses chances d’avoir as-roi ou une paire d’as. Et quand on te paie, tu as encore une chance de faire une quinte ou une couleur.'],
    ['J', 'Et la taille ?'],
    ['Y', 'Environ quatre fois l’ouverture, parce que tu joueras hors position. Contre une ouverture à deux grosses blindes, huit grosses blindes. Contre deux et demie, dix à onze.'],
    ['J', 'Et la petite blinde ? C’est pareil ?'],
    ['Y', 'Non, c’est la place la plus difficile. Tu as mis moins, donc ta cote est moins bonne, et en plus il reste la grosse blinde derrière toi qui peut sur-relancer. Et tu joueras hors de position contre tout le monde. Donc en petite blinde face à une ouverture, on préfère sur-relancer ou se coucher, avec peu de calls, surtout des petites paires.'],
    ['J', 'Et quand tout le monde se couche jusqu’à moi en petite blinde ?'],
    ['Y', 'C’est la bataille des blindes. Tu n’as plus que la grosse blinde contre toi. Les repères du livre : relance environ quarante pour cent des mains, à trois grosses blindes, et tu peux limper une partie des mains faibles. Dans l’appli, quand tu es en petite blinde, le limp fait partie des quatre armes proposées : c’est justement là qu’il a du sens.'],
    ['J', 'Une main ?'],
    ['Y', 'Tu es en grosse blinde avec dame-neuf assorti de pique. Le cut-off ouvre à deux grosses blindes, tout le monde se couche. Il te faut vingt-deux pour cent, ta main en a bien plus contre sa range. Tu paies. Flop : neuf de cœur, six de pique, deux de pique. Tu as une paire de neuf et un tirage couleur. Voilà le genre de flop qui récompense une défense correcte. Si tu t’étais couché, tu n’aurais jamais vu ce flop.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : ouverture à deux et demie, tu es en grosse blinde sans ante. Quelle équité te faut-il ?'],
    ['P', 5],
    ['Y', 'Vingt-sept pour cent.'],
    ['Y', 'Deuxième question : face à une relance minimum, tu défends plus large ou plus serré ?'],
    ['P', 5],
    ['Y', 'Plus large. Il ne te faut plus que vingt-deux pour cent.'],
    ['Y', 'Troisième question : quel est le meilleur bluff de sur-relance depuis la grosse blinde : as-quatre assorti, ou roi-valet dépareillé ?'],
    ['P', 5],
    ['Y', 'As-quatre assorti : il bloque les as et garde de l’équité.'],
    ['J', 'Je vais défendre plus.'],
    ['Y', 'C’est le but. On résume. Un : en grosse blinde, la cote est excellente, surtout contre les ouvertures à deux grosses blindes du club. Deux : défends plus large contre les positions tardives, environ la moitié des mains contre le bouton. Trois : sur-relance à quatre fois l’ouverture avec la valeur et les petits as assortis. Quatre : en petite blinde, sur-relance ou couche-toi, et bats-toi dans la bataille des blindes. À bientôt !']
  ];

  L[7].podcast = [
    ['J', 'Salut Yo ! Les limpers. Au club, il y en a partout.'],
    ['Y', 'Salut ! Exactement, et c’est une source de jetons énorme si on sait quoi faire. D’abord, qu’est-ce qu’un limper nous dit ? Il se contente de payer la grosse blinde sans relancer. Avec une grosse main, la plupart des joueurs relancent. Donc un limper annonce souvent une main moyenne : une petite paire, deux cartes assorties, un as faible.'],
    ['J', 'Et toujours ?'],
    ['Y', 'Pas toujours. Certains joueurs limpent avec les as pour piéger. Mais c’est rare, et au club, les limpers sont surtout des joueurs récréatifs et larges-passifs. Contre eux, on a trois options : isoler, suivre, ou se coucher.'],
    ['J', 'Isoler, ça veut dire relancer ?'],
    ['Y', 'Oui, relancer assez gros pour jouer le pot seul contre le limper, idéalement en position. Tu prends l’initiative, tu as souvent la meilleure main, et tu évites un pot à cinq joueurs où plus personne ne contrôle rien. La taille : trois grosses blindes en position, plus une grosse blinde par limper. Depuis les blindes, quatre plus une par limper, parce que tu seras hors de position.'],
    ['J', 'Exemple ?'],
    ['Y', 'Blindes cent-deux cents. Deux joueurs limpent, tu es au bouton avec as-valet dépareillé. Trois plus deux, cinq grosses blindes : mille jetons. Si tu relances seulement à quatre cents, deux grosses blindes, les deux limpers paient, la grosse blinde aussi, et tu te retrouves à quatre au flop avec une main moyenne. C’est l’erreur classique : relancer trop petit.'],
    ['J', 'Et avec quoi j’isole ?'],
    ['Y', 'Avec les mains qui jouent bien seules et qui dominent la range du limper. Au cut-off, à peu près : cinq-cinq et plus, as-neuf assorti et plus, roi-dix assorti et plus, dame-valet assorti, as-dix dépareillé et plus, roi-dame dépareillé. Au bouton, beaucoup plus large, puisqu’il ne reste que les blindes derrière.'],
    ['J', 'Et suivre ?'],
    ['Y', 'Suivre, c’est limper derrière. C’est pour les mains qui aiment les pots à plusieurs joueurs pas chers : les petites paires, qui cherchent un brelan, et les connecteurs assortis, qui cherchent une quinte ou une couleur. Ces mains-là ne gagnent pas souvent, mais quand elles touchent, elles gagnent gros, et à plusieurs, il y a quelqu’un pour payer.'],
    ['J', 'Et se coucher ?'],
    ['Y', 'Avec les mains dépareillées moyennes : roi-huit, dame-neuf, valet-neuf dépareillés. Elles sont le pire des deux mondes. Elles touchent une paire moyenne, souvent dominée, et elles ne font presque jamais de couleur. Dans un pot à plusieurs, elles perdent de l’argent.'],
    ['J', 'Et après le flop, quand le limper paie mon isolement ?'],
    ['Y', 'Contre un seul limper, mise souvent au flop. Il a raté le flop environ deux fois sur trois, comme tout le monde. Une mise d’un tiers à la moitié du pot gagne très souvent. Par contre, s’il paie encore à la turn, ralentis avec tes mains moyennes : un joueur passif qui paie deux rues a souvent une paire, parfois mieux.'],
    ['J', 'Une main vécue ?'],
    ['Y', 'Au club, un habitué limpe en UTG+1, un autre en MP. Tu es au hijack avec as-roi. Pas de question : tu isoles à cinq grosses blindes. Le premier se couche, le second paie. Flop : roi, huit, quatre. Il checke. Tu mises la moitié du pot, il paie. Turn : un deux. Il checke encore. Tu as une paire de rois avec le meilleur kicker : là, tu continues pour la valeur, parce qu’il paie avec roi-dix, huit-sept assorti, des tirages. Contre ce profil, on mise pour la valeur, encore et encore.'],
    ['J', 'Le quiz.'],
    ['Y', 'Première question : blindes cent-deux cents, un limper, tu es au bouton avec as-valet dépareillé. Quelle relance ?'],
    ['P', 5],
    ['Y', 'Huit cents : trois grosses blindes plus une pour le limper.'],
    ['Y', 'Deuxième question : deux limpers, tu es en grosse blinde avec as-dame. Taille d’isolement ?'],
    ['P', 5],
    ['Y', 'Six grosses blindes : quatre hors position, plus deux pour les limpers.'],
    ['Y', 'Troisième question : un limper, tu es au hijack avec roi-huit dépareillé. Tu fais quoi ?'],
    ['P', 5],
    ['Y', 'Tu te couches. Main dépareillée moyenne, souvent dominée.'],
    ['J', 'Bien.'],
    ['Y', 'On résume. Un : le limper est souvent faible, on l’isole avec les mains fortes. Deux : trois grosses blindes en position, quatre depuis les blindes, plus une par limper. Trois : on suit avec les petites paires et les connecteurs assortis, on couche les dépareillées moyennes. Quatre : contre un seul limper, le c-bet au flop gagne très souvent. À bientôt !']
  ];

  L[8].podcast = [
    ['J', 'Salut Yo ! Le 3-bet aujourd’hui. Pour moi, sur-relancer, c’est avec les as et les rois, point.'],
    ['Y', 'Salut ! C’est exactement ce qu’on va changer. Si tu ne sur-relances qu’avec les as et les rois, qu’est-ce qui se passe quand tu sur-relances ?'],
    ['J', 'Tout le monde se couche ?'],
    ['Y', 'Tout le monde se couche, sauf ceux qui ont mieux ou presque aussi bien. Tu gagnes deux grosses blindes avec tes as, et tu te fais payer seulement par les mains qui ont des chances contre toi. Une sur-relance sans bluff est facile à lire. Les bons joueurs mélangent deux familles de mains : la valeur, et quelques bluffs bien choisis.'],
    ['J', 'Quels bluffs ?'],
    ['Y', 'Des mains qui ont deux qualités. Un : elles bloquent les grosses mains adverses. As-cinq assorti, par exemple, contient un as : il y a moins de chances que ton adversaire ait as-roi ou une paire d’as. Deux : elles gardent de l’équité quand on te paie, une quinte ou une couleur possible. As-cinq ou as-quatre assortis sont les bluffs parfaits.'],
    ['J', 'Et les mains moyennes, comme une paire de six ?'],
    ['Y', 'Celles-là, on les paie plutôt, surtout en position. Une petite paire n’aime pas sur-relancer : si on te sur-relance encore, tu dois jeter une main qui avait de l’équité. En payant, tu vois le flop pas cher et tu cherches le brelan. C’est ça, la logique : une ouverture est linéaire, les meilleures mains dans l’ordre. Une sur-relance est polarisée : très fort, ou bluff choisi. Le milieu se paie.'],
    ['J', 'Un exemple de range ?'],
    ['Y', 'Ton profil TAG au bouton face à une ouverture du cut-off : en valeur, huit-huit et plus, as-dix assorti et plus, roi-valet assorti et plus, as-valet dépareillé et plus, roi-dame dépareillé. En bluff, des petits as assortis, et quelques connecteurs comme valet-dix ou dix-neuf assortis.'],
    ['J', 'Et la taille ?'],
    ['Y', 'En position, environ trois fois l’ouverture. Face à une ouverture à deux grosses blindes, six. Face à deux et demie, sept et demie. Hors de position, depuis les blindes, quatre fois. Plus il y a de jetons morts, de limpers ou d’antes, plus tu peux grossir.'],
    ['J', 'Et quand c’est moi qui me fais sur-relancer ?'],
    ['Y', 'Ça dépend surtout d’une chose : est-ce que tu joueras en position ? Si tu as ouvert au bouton et qu’une blinde te sur-relance, tu joueras après elle à chaque tour. Tu peux payer large : dix-dix à sept-sept, as-valet et as-dame assortis, roi-dame et dame-valet assortis, valet-dix et neuf-huit assortis. Tu sur-relances encore, un 4-bet, avec dame-dame et mieux, as-roi, et quelques bluffs à l’as-cinq.'],
    ['J', 'Et si je suis hors de position ?'],
    ['Y', 'Tu paies beaucoup moins. Si tu as ouvert au cut-off et que le bouton te sur-relance, tu paies valet-valet à huit-huit, as-dame et as-valet assortis, roi-dame assorti. Et si tu as ouvert en UTG et qu’on te sur-relance, la range adverse est forte : paie valet-valet, dix-dix, as-dame assorti ; 4-bet dame-dame et mieux et as-roi ; couche tout le reste.'],
    ['J', 'Même as-valet dépareillé ?'],
    ['Y', 'Surtout as-valet dépareillé. C’est l’erreur qui coûte le plus cher. Face à une sur-relance, la range de valeur de ton adversaire contient as-dame, as-roi, les grosses paires. As-valet est dominé. Tu touches ton as, il a un meilleur kicker, et tu perds un gros pot. Pareil pour roi-dame dépareillé hors position.'],
    ['J', 'Pourquoi la position compte autant ?'],
    ['Y', 'Parce qu’en position, tu réalises plus de ton équité. Tu vois s’il checke, tu prends des cartes gratuites, tu contrôles le pot. Hors position, la même main gagne moins souvent, donc tu dois en payer moins.'],
    ['J', 'Une main ?'],
    ['Y', 'Tu ouvres au bouton à deux grosses blindes avec neuf-huit de cœur. La grosse blinde sur-relance à huit. Vous avez tous les deux cent grosses blindes. Tu es en position, ta main joue très bien : tu paies. Flop : dix, sept, deux, avec deux cœurs. Tu as un tirage quinte par les deux bouts et un tirage couleur, quinze cartes. Voilà pourquoi on paie avec ces mains en position : quand elles touchent, elles gagnent de très gros pots contre des paires d’as ou de rois.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : quelle taille de sur-relance en position face à une ouverture à deux et demie ?'],
    ['P', 5],
    ['Y', 'Sept et demie, trois fois l’ouverture.'],
    ['Y', 'Deuxième question : tu as ouvert en UTG, le cut-off te sur-relance. Avec as-valet dépareillé, tu fais quoi ?'],
    ['P', 5],
    ['Y', 'Tu te couches. Tu es hors de position et dominé par sa range.'],
    ['Y', 'Troisième question : pourquoi as-cinq assorti est un bon bluff de sur-relance ?'],
    ['P', 5],
    ['Y', 'Il bloque les as adverses et garde de l’équité.'],
    ['J', 'C’est noté.'],
    ['Y', 'On résume. Un : une sur-relance mélange valeur et bluffs à bloqueurs ; les mains moyennes se paient. Deux : trois fois en position, quatre fois hors de position. Trois : face à une sur-relance, paie surtout en position, 4-bet dame-dame et mieux et as-roi, couche le reste. Quatre : as-valet et roi-dame dépareillés hors de position, c’est la porte de sortie. À bientôt !']
  ];
  L[9].podcast = [
    ['J', 'Salut Yo ! Squeeze, 4-bet, click back. Ça fait beaucoup de mots anglais.'],
    ['Y', 'Salut ! Trois armes de sur-relance, et chacune a son moment. Commençons par la plus rentable : le squeeze. La situation : un joueur ouvre, un autre paie, et toi, tu sur-relances derrière eux.'],
    ['J', 'Pourquoi c’est si rentable ?'],
    ['Y', 'Pour deux raisons. Un : le joueur qui a payé a rarement une très grosse main, sinon il aurait sur-relancé lui-même. Sa range est plafonnée. Deux : l’ouvreur est coincé. Il doit parler entre toi et le payeur, avec un joueur encore derrière lui. Même avec une main correcte, il se couche souvent. Et il y a déjà beaucoup d’argent dans le pot : l’ouverture, le call, les blindes. Tout cet argent mort, tu le ramasses quand tout le monde se couche.'],
    ['J', 'Et la taille ?'],
    ['Y', 'Environ quatre fois l’ouverture, plus une grosse blinde par payeur. Ouverture à deux grosses blindes comme au club, un call : quatre fois deux, huit, plus un, neuf grosses blindes. Depuis les blindes, ajoute une ou deux grosses blindes, parce que tu seras hors de position.'],
    ['J', 'Et avec quelles mains ?'],
    ['Y', 'Comme toute sur-relance : polarisé. Depuis la grosse blinde face à une ouverture et un call, en valeur : dix-dix et plus, as-dame assorti et mieux, as-roi. En bluff : as-deux à as-cinq assortis, roi-neuf assorti. Pas de mains moyennes comme roi-valet dépareillé. Si deux joueurs te paient avec ça, tu joues un gros pot, hors de position, souvent dominé.'],
    ['J', 'Et le 4-bet ?'],
    ['Y', 'C’est la sur-relance d’une sur-relance. Tu ouvres, on te sur-relance, tu relances encore. La taille : environ deux fois et quart la sur-relance en position, deux fois et demie hors position. Exemple : on te sur-relance à huit, tu 4-bet à dix-huit ou vingt. La range : dame-dame et mieux, as-roi, et quelques as-cinq ou as-quatre assortis en bluff.'],
    ['J', 'Et si je n’ai que trente-cinq grosses blindes ?'],
    ['Y', 'Alors un 4-bet à vingt grosses blindes, c’est déjà plus de la moitié de ton tapis. Tu ne pourras plus te coucher. À quarante grosses blindes et moins, le 4-bet devient un tapis directement. Plus simple, et ça enlève à l’adversaire la possibilité de jouer après le flop.'],
    ['J', 'Et le click back ?'],
    ['Y', 'C’est une relance minimum en retour. Il mise mille, tu relances à deux mille. Ça coûte peu, mais regarde ce que ça offre à l’adversaire : il doit payer mille de plus dans un pot déjà gros. Il a une cote énorme, il paie presque toujours. Donc le click back ne sert jamais à bluffer. Il sert avec une main très forte contre un joueur agressif qui va relancer encore, ou pour faire grossir le pot doucement sans faire fuir.'],
    ['J', 'Et quand c’est moi qui me fais squeezer ?'],
    ['Y', 'Tu as ouvert, quelqu’un a payé, un troisième sur-relance. Tu es hors position contre lui, avec encore un joueur derrière toi qui peut se réveiller. Tu continues seulement avec dame-dame et mieux, as-roi, et quelques mains fortes. Plus serré que face à une sur-relance simple.'],
    ['J', 'Une main ?'],
    ['Y', 'Au club, blindes deux cents-quatre cents, vous avez tous environ cinquante grosses blindes. Le cut-off ouvre à huit cents, le bouton paie. Tu es en grosse blinde avec as-quatre de pique. Tu squeezes : quatre fois l’ouverture plus une grosse blinde, plus une pour la position, environ dix grosses blindes, quatre mille. Le cut-off se couche, le bouton réfléchit et se couche. Tu ramasses deux mille six cents jetons, avec l’ante de la grosse blinde, sans voir de flop. Et si le bouton avait payé, tu aurais un as et un tirage roue possible.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : ouverture à deux grosses blindes, un call, tu es au bouton. Taille de squeeze ?'],
    ['P', 5],
    ['Y', 'Neuf grosses blindes : quatre fois deux, plus un.'],
    ['Y', 'Deuxième question : on te sur-relance à huit, tu es en position. Taille de ton 4-bet ?'],
    ['P', 5],
    ['Y', 'Environ dix-huit grosses blindes.'],
    ['Y', 'Troisième question : pourquoi éviter le click back en bluff ?'],
    ['P', 5],
    ['Y', 'Parce que l’adversaire a une cote énorme et paie presque toujours.'],
    ['J', 'Bien.'],
    ['Y', 'On résume. Un : le squeeze profite de l’argent mort, quatre fois l’ouverture plus une grosse blinde par payeur. Deux : range polarisée, valeur et petits as assortis. Trois : 4-bet à deux fois et quart en position, deux et demie hors position, et tapis sous quarante grosses blindes. Quatre : le click back, pour la valeur seulement. À bientôt !']
  ];

  L[10].podcast = [
    ['J', 'Salut Yo ! Les calculs. J’avoue, j’ai un peu peur des maths.'],
    ['Y', 'Salut ! Rassure-toi, il n’y en a que deux à connaître, et ils tiennent dans la main. Toute décision de paye se résume à comparer deux nombres : ton équité, ta chance de gagner, et l’équité requise par la cote, le prix qu’on te demande. Si ton équité est plus grande, tu paies. Sinon, tu te couches.'],
    ['J', 'Commençons par mon équité.'],
    ['Y', 'Quand tu as un tirage, ton équité vient de tes outs. Un out, c’est une carte qui te donne probablement la meilleure main. Tirage couleur : il reste neuf cartes de ta couleur, neuf outs. Tirage quinte par les deux bouts, huit outs. Tirage ventral, quatre. Deux cartes plus hautes que le tableau, environ six.'],
    ['J', 'Et je transforme ça en pourcentage comment ?'],
    ['Y', 'La règle du deux et du quatre. Avec une carte à venir, tu multiplies tes outs par deux. Avec deux cartes à venir, et seulement si tu es sûr de voir les deux, par exemple quand tu es à tapis, par quatre. Tirage couleur au flop, à tapis : neuf fois quatre, trente-six pour cent. Si tu ne vois que la turn : neuf fois deux, dix-huit pour cent.'],
    ['J', 'C’est exact ?'],
    ['Y', 'C’est très proche. À la turn, le calcul exact c’est tes outs divisés par quarante-six, les cartes que tu ne vois pas. Neuf divisé par quarante-six, ça fait dix-neuf virgule six pour cent. Ton dix-huit pour cent était un peu prudent, c’est parfait pour décider à la table.'],
    ['J', 'Et l’équité requise ?'],
    ['Y', 'C’est la mise à payer divisée par le pot final, en comptant le pot, sa mise et ta paye. Exemple : le pot fait mille, il mise cinq cents. Tu dois payer cinq cents. Le pot final : mille plus cinq cents plus cinq cents, deux mille. Cinq cents divisé par deux mille : vingt-cinq pour cent. Retiens deux repères : face à une mise de la moitié du pot, il te faut vingt-cinq pour cent. Face à une mise du pot, trente-trois.'],
    ['J', 'Donc avec mon tirage couleur à la turn, face à une mise de la moitié du pot…'],
    ['Y', 'Dix-neuf virgule six contre vingt-cinq. Il te manque un peu. La paye directe n’est pas rentable. Sauf si tu as des cotes implicites.'],
    ['J', 'C’est quoi ?'],
    ['Y', 'Ce sont les jetons que tu gagneras plus tard quand tu toucheras. Si ton adversaire est du genre à payer une grosse mise à la river quand la couleur arrive, ta paye un peu chère maintenant devient rentable grâce à ce qu’il te donnera ensuite. Contre un joueur qui se couche dès qu’une troisième carte de la même couleur tombe, pas de cotes implicites.'],
    ['J', 'Et l’équité réalisée ?'],
    ['Y', 'C’est la part de ton équité que tu encaisses vraiment. Sur le papier, tu as trente pour cent. Mais hors de position, parfois tu devras te coucher face à une grosse mise avant de voir ta carte. Tu ne réalises pas tout. En position, tu réalises mieux, parce que tu vois ce qu’il fait avant de décider. C’est pour ça qu’une paye limite est souvent bonne en position et mauvaise hors position.'],
    ['J', 'Et les outs sales, dans la leçon ?'],
    ['Y', 'Ce sont des cartes qui complètent ton tirage mais donnent aussi une meilleure main à l’adversaire. Exemple : tu as un tirage couleur au neuf, et ton adversaire a peut-être un tirage couleur à l’as. La couleur qui arrive te fait perdre un gros pot. Ou encore : tu tires quinte avec la petite carte, et la carte qui te la donne complète aussi une quinte plus haute. On ne compte pas ces cartes, ou on les compte à moitié.'],
    ['J', 'Une main ?'],
    ['Y', 'Tu es au bouton avec huit-sept de pique. Flop : six de cœur, cinq de trèfle, deux de pique. Tirage quinte par les deux bouts : un neuf ou un quatre. Huit outs. La grosse blinde mise la moitié du pot. Avec une carte à venir, huit fois deux, seize pour cent ; avec deux, environ trente-deux. Il te faut vingt-cinq. Tu es en position, tu as des cotes implicites, et ta main est bien cachée : tu paies. À la turn, si tu rates et qu’elle mise encore la moitié du pot, tu n’as plus que seize pour cent pour vingt-cinq requis. Là, sans cotes implicites fortes, tu te couches.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : combien d’outs pour un tirage couleur ?'],
    ['P', 5],
    ['Y', 'Neuf.'],
    ['Y', 'Deuxième question : pot de mille, il mise cinq cents. Quelle équité te faut-il ?'],
    ['P', 5],
    ['Y', 'Vingt-cinq pour cent.'],
    ['Y', 'Troisième question : tirage quinte par les deux bouts, une carte à venir. Ton équité environ ?'],
    ['P', 5],
    ['Y', 'Seize pour cent : huit outs fois deux.'],
    ['J', 'Finalement, ce n’est pas si dur.'],
    ['Y', 'Non. On résume. Un : outs fois deux pour une carte, fois quatre pour deux cartes si tu es à tapis. Deux : équité requise égale paye divisée par pot final ; vingt-cinq pour cent contre une demi-mise, trente-trois contre une mise du pot. Trois : les cotes implicites et la position améliorent une paye limite. Quatre : ne compte pas les outs sales. Et pour t’entraîner, l’exercice « Outs et cote » dans S’entraîner. À bientôt !']
  ];

  L[11].podcast = [
    ['J', 'Salut Yo ! Lire un board. Je regarde surtout si j’ai touché ou pas.'],
    ['Y', 'Salut ! C’est le réflexe de tout le monde. Mais la vraie question au flop, ce n’est pas « est-ce que j’ai touché », c’est « qui a le plus de mains fortes sur ces trois cartes, moi ou lui ». Parce que ton adversaire ne joue pas une main, il joue une range, et toi aussi.'],
    ['J', 'Comment on sait qui a le plus de mains fortes ?'],
    ['Y', 'On part du préflop. Toi, tu as ouvert, disons depuis le cut-off. Ta range contient beaucoup de paires hautes, d’as-roi, d’as-dame, de roi-dame. La grosse blinde a payé : elle aurait sur-relancé ses meilleures mains, donc elle a surtout des mains moyennes, des petites paires, des connecteurs, des mains assorties de toutes sortes.'],
    ['J', 'Donc un flop avec un as ou un roi, c’est pour moi.'],
    ['Y', 'Exactement. Sur roi, sept, deux de couleurs différentes, tu as toutes les paires de rois fortes, les as-rois, les grosses paires. Elle a quelques rois faibles et des sept. C’est ton board : tu peux miser souvent, et petit. Par contre, sur sept, six, cinq, qui a le plus de quintes, de doubles paires, de brelans ? La grosse blinde, avec ses huit-quatre, ses six-cinq, ses petites paires. C’est son board.'],
    ['J', 'Et les textures, dans la leçon ?'],
    ['Y', 'Il y en a quatre. Sèche : des cartes éloignées, des couleurs différentes, comme roi, sept, deux. Peu de tirages, les mains changent peu d’une rue à l’autre. Connectée : des cartes proches, comme neuf, huit, sept, avec plein de quintes possibles. Monotone : trois cartes de la même couleur. Et pairée : une paire au tableau, comme huit, huit, trois.'],
    ['J', 'Et ça change quoi pour mes mises ?'],
    ['Y', 'Sur un board sec avec une carte haute, mise souvent et petit, un tiers du pot : tu as l’avantage et elle ne peut pas te relancer avec grand-chose. Sur un board bas et connecté, checke plus souvent, et quand tu mises, mise plus gros, pour protéger tes paires et faire payer les tirages. Sur un board monotone sans la couleur, ralentis : beaucoup de mains te battent ou ont un gros tirage. Sur un board pairé, peu de mains ont touché : des petites mises fréquentes marchent bien.'],
    ['J', 'Et l’avantage des nuts ?'],
    ['Y', 'C’est avoir plus de mains très fortes que l’autre. Sur as, roi, quatre, le relanceur a as-as, roi-roi, as-roi. La grosse blinde n’a presque jamais ces mains, elle les aurait sur-relancées. Quand tu as l’avantage des nuts, tu peux te permettre des grosses mises, et même des surmises, parce que l’adversaire ne peut pas avoir mieux que toi très souvent.'],
    ['J', 'Une main ?'],
    ['Y', 'Tu ouvres au bouton avec as-dame de trèfle. La grosse blinde paie. Premier cas, flop : roi de cœur, huit de carreau, trois de pique. Tu n’as rien, mais c’est un board sec avec une carte haute, ton board. Tu mises un tiers du pot : elle se couchera souvent, et tu as encore des outs pour une paire d’as ou de dames. Deuxième cas, flop : huit de cœur, sept de cœur, six de pique. Là, c’est son board : elle a les neuf-dix, les cinq-quatre, les paires de six, sept, huit. Tu as as-dame sans tirage. Tu checkes, et tu prends ta carte gratuitement.'],
    ['J', 'Même main, deux décisions opposées.'],
    ['Y', 'C’est tout le sujet. Le quiz ? Première question : parmi roi-sept-deux en trois couleurs et neuf-huit-sept, lequel est sec ?'],
    ['P', 5],
    ['Y', 'Roi, sept, deux.'],
    ['Y', 'Deuxième question : quel board favorise la grosse blinde : as-roi-quatre, ou sept-six-cinq ?'],
    ['P', 5],
    ['Y', 'Sept, six, cinq : bas et connecté.'],
    ['Y', 'Troisième question : board monotone, tu n’as pas la couleur. Tu accélères ou tu ralentis ?'],
    ['P', 5],
    ['Y', 'Tu ralentis.'],
    ['J', 'C’est noté.'],
    ['Y', 'On résume. Un : au flop, demande-toi qui a le plus de mains fortes. Deux : boards hauts pour le relanceur, boards bas et connectés pour la grosse blinde. Trois : sec, on mise souvent et petit ; connecté, on checke plus et on mise plus gros. Quatre : l’avantage des nuts autorise les grosses mises. À bientôt !']
  ];

  L[12].podcast = [
    ['J', 'Salut Yo ! La lecture de main. Le moment où je dis « il a as-roi ».'],
    ['Y', 'Salut ! Et c’est justement le piège. Mettre quelqu’un sur une seule main, c’est presque toujours faux. Lire une main, c’est réduire une range action après action. On ne cherche pas la main, on retire celles qu’il n’aurait pas jouées comme ça.'],
    ['J', 'On part d’où ?'],
    ['Y', 'De sa position et de son action avant le flop. Un joueur serré qui ouvre en UTG a environ dix pour cent des mains : des paires moyennes et hautes, des as forts, des figures assorties. Résume-le en une phrase : UTG serré, sept-sept et mieux, as-valet et mieux, roi-dame. À l’inverse, un récréatif qui limpe au bouton peut avoir presque tout, sauf les très grosses mains, qu’il aurait relancées.'],
    ['J', 'Et après le flop ?'],
    ['Y', 'Chaque action retire des mains. Flop : roi, sept, deux. Il mise la moitié du pot. Il garde ses rois, ses paires hautes, et quelques bluffs comme as-dame ou as-valet. Il retire les mains qui auraient checké : chez un joueur prudent, huit-huit ou neuf-neuf préfèrent souvent checker. S’il checke puis paie ta mise, il a souvent une main moyenne : une paire de sept, une petite paire, un tirage s’il y en a un.'],
    ['J', 'Et compter les combinaisons, je n’ai jamais compris.'],
    ['Y', 'C’est plus simple qu’il n’y paraît. Une paire servie, comme huit-huit, existe en six combinaisons. Une main assortie, comme as-roi de pique, en quatre : une par couleur. Une main dépareillée, en douze. Et les cartes du tableau en retirent. Sur un flop avec un roi, il ne reste que trois rois dans le paquet. As-roi ne vaut plus que quatre as fois trois rois, douze combinaisons au lieu de seize.'],
    ['J', 'Et à quoi ça sert, concrètement ?'],
    ['Y', 'À décider à la river. Imagine : tu comptes dans sa range six combinaisons de valeur, et huit bluffs probables, des tirages qui ont raté. Il mise la taille du pot. Il te faut trente-trois pour cent. Huit bluffs sur quatorze combinaisons, ça fait cinquante-sept pour cent de chances qu’il bluffe. Tu paies sans hésiter. Si tu avais compté douze valeurs et trois bluffs, tu te serais couché.'],
    ['J', 'Et le profil du joueur ?'],
    ['Y', 'C’est la dernière étape, et au club c’est souvent la plus importante. La même action ne veut pas dire la même chose chez tout le monde. Une grosse mise à la river d’un nit, c’est presque toujours la valeur : il ne bluffe pas. Chez un maniac, tu dois payer plus large. Et un récréatif mise souvent selon sa main, pas selon une stratégie : grosse mise, grosse main ; petite mise, main moyenne.'],
    ['J', 'Une main complète ?'],
    ['Y', 'Au club, un joueur serré ouvre en UTG à deux grosses blindes. Tu paies au bouton avec neuf-neuf. Range de départ : sept-sept et mieux, as-valet et mieux, roi-dame. Flop : dame, six, deux, en trois couleurs. Il mise un tiers. Il garde les dames, les grosses paires, et mise aussi beaucoup de ses as-roi et as-valet. Tu paies. Turn : un quatre. Il checke. Les mains de valeur forte auraient souvent continué ; ses as-roi, as-valet abandonnent souvent. Tu checkes derrière. River : un trois. Il mise gros. Un joueur serré qui checke la turn puis mise gros à la river, c’est souvent une dame qui a voulu contrôler le pot, ou un piège. Chez lui, peu de bluffs. Tu te couches. Chez un joueur agressif, tu paierais.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : combien de combinaisons pour une paire servie ?'],
    ['P', 5],
    ['Y', 'Six.'],
    ['Y', 'Deuxième question : flop roi, sept, deux. Combien de combinaisons d’as-roi restent possibles ?'],
    ['P', 5],
    ['Y', 'Douze : quatre as fois trois rois.'],
    ['Y', 'Troisième question : un nit mise gros à la river après avoir payé deux rues. Sa range contient surtout quoi ?'],
    ['P', 5],
    ['Y', 'De la valeur.'],
    ['J', 'Trois sur trois.'],
    ['Y', 'On résume. Un : pars de la range préflop selon la position et le profil. Deux : chaque action retire des mains, demande-toi ce qu’il aurait fait autrement. Trois : compte les combinaisons, six pour une paire, quatre assortie, douze dépareillée, et retire les cartes visibles. Quatre : ajuste au profil. À bientôt !']
  ];
  L[13].podcast = [
    ['J', 'Salut Yo ! Le sizing. Moi, je mise gros quand j’ai une grosse main et petit quand je bluffe.'],
    ['Y', 'Salut ! Merci de l’honnêteté, parce que c’est exactement ce qu’on va corriger. Si tu mises gros avec tes grosses mains et petit avec tes bluffs, un adversaire attentif n’a plus besoin de lire tes cartes : il lit tes jetons. Ta taille de mise devient un panneau indicateur.'],
    ['J', 'Alors je choisis ma taille selon quoi ?'],
    ['Y', 'Selon le board, la position, la profondeur et l’adversaire. Jamais selon la force de ta main. Mais d’abord, comprenons ce que fait une taille. Quand tu mises, tu fixes le prix que l’adversaire doit payer. Plus tu mises gros, plus il lui faut d’équité pour payer, et plus tu peux te permettre de bluffs.'],
    ['J', 'Avec des chiffres ?'],
    ['Y', 'Trois repères à connaître. Mise d’un tiers du pot : il lui faut vingt pour cent pour payer. Mise de la moitié : vingt-cinq. Mise du pot : trente-trois. Deux fois le pot : quarante. La formule, si tu la veux : la mise divisée par un plus deux fois la mise, en fraction du pot.'],
    ['J', 'Et dans l’autre sens ?'],
    ['Y', 'C’est la défense minimale : la part de sa range qu’il doit défendre pour que tes bluffs ne soient pas automatiquement gagnants. Contre un tiers du pot, il doit défendre soixante-quinze pour cent de sa range. Contre la moitié, deux tiers. Contre le pot, la moitié. Ça veut dire quoi ? Qu’une petite mise oblige l’adversaire à payer avec presque tout. Une grosse mise lui permet de se coucher plus souvent, mais elle te coûte plus cher quand il paie.'],
    ['J', 'Et selon le board ?'],
    ['Y', 'Board sec et haut, comme roi, sept, deux : petit, un quart à un tiers du pot. Tu as l’avantage, elle a peu de tirages, inutile de payer cher pour obtenir des folds. Board connecté ou à tirages, comme valet, dix, huit avec deux cœurs : deux tiers du pot. Tu fais payer cher les tirages et tu protèges tes paires. Board pairé : petit. Et à plusieurs adversaires : plutôt la moitié à deux tiers.'],
    ['J', 'Et le sizing géométrique ?'],
    ['Y', 'C’est pour les grosses mains, quand tu veux mettre tout ton tapis en trois mises. Tu choisis une taille constante, la même fraction du pot à chaque rue, qui t’amène pile à tapis à la river. Exemple : pot de dix grosses blindes au flop, il te reste quatre-vingt-dix derrière. Avec environ quatre-vingt-trois pour cent du pot à chaque rue : huit virgule trois au flop, puis vingt-deux à la turn, puis les cinquante-neuf restants à la river. Chaque mise paraît raisonnable, et pourtant tout l’argent finit au milieu.'],
    ['J', 'Malin.'],
    ['Y', 'Et plus ton tapis est petit par rapport au pot, plus tes tailles peuvent grossir. Quand il te reste deux fois le pot, une surmise, c’est juste un tapis.'],
    ['J', 'Mais au club, les joueurs ne lisent pas mes tailles.'],
    ['Y', 'Très juste, et c’est l’exception. Contre les récréatifs qui ne font pas attention aux tailles, et qui paient selon leur main, grossis tes mises de valeur. Ils paieront deux tiers ou le pot avec leur paire moyenne aussi facilement qu’un tiers. On en reparle au chapitre vingt-sept. Contre les bons joueurs de Winamax, garde des tailles qui ne trahissent rien.'],
    ['J', 'Une main ?'],
    ['Y', 'Tu ouvres au cut-off, la grosse blinde paie. Premier flop : roi de cœur, sept de carreau, deux de trèfle. Tu as as-roi. Tu mises un tiers du pot. Tu aurais misé exactement pareil avec dame-valet en bluff, et c’est le but. Deuxième flop : valet de cœur, dix de cœur, huit de trèfle. Tu as dame-dame. Tu mises deux tiers : beaucoup de tirages, tu les fais payer cher. Et sur ce board, tes bluffs avec deux cœurs miseraient la même taille.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : mise de la moitié du pot. Quelle équité faut-il pour payer ?'],
    ['P', 5],
    ['Y', 'Vingt-cinq pour cent.'],
    ['Y', 'Deuxième question : mise d’un tiers du pot. Quelle part de sa range l’adversaire doit-il défendre ?'],
    ['P', 5],
    ['Y', 'Soixante-quinze pour cent.'],
    ['Y', 'Troisième question : quelle taille de c-bet sur valet, dix, huit avec deux cœurs ?'],
    ['P', 5],
    ['Y', 'Deux tiers du pot : board à tirages.'],
    ['J', 'Je vais arrêter de miser selon ma main.'],
    ['Y', 'Voilà. On résume. Un : la taille fixe le prix pour l’adversaire ; vingt, vingt-cinq, trente-trois, quarante pour cent selon que tu mises un tiers, la moitié, le pot ou deux fois le pot. Deux : board sec, petit ; board à tirages, gros. Trois : avec les grosses mains, le sizing géométrique t’amène à tapis en trois rues. Quatre : même taille pour la valeur et les bluffs, sauf contre les récréatifs. À bientôt !']
  ];

  L[14].podcast = [
    ['J', 'Salut Yo ! Le flop. Le c-bet, je le fais à chaque fois que j’ai relancé avant.'],
    ['Y', 'Salut ! C’est une habitude très répandue, et contre un seul joueur faible, elle gagne souvent. Mais elle coûte cher sur certains boards et contre plusieurs adversaires. Aujourd’hui, on apprend à choisir quand miser au flop, et comment défendre quand c’est toi qui subis la mise.'],
    ['J', 'Quand miser, alors ?'],
    ['Y', 'Tout dépend du board et de l’avantage de range, qu’on a vu au chapitre onze. Sur un board sec avec une carte haute, roi, sept, deux ou as, huit, trois, toi le relanceur, tu as plus de mains fortes. Tu mises souvent, et petit, environ un tiers du pot. Avec tes bonnes mains comme avec tes mains qui ont raté.'],
    ['J', 'Et sur un board bas ?'],
    ['Y', 'Sur huit, sept, cinq avec deux cœurs, c’est la grosse blinde qui a le plus de mains fortes : six-quatre, neuf-six, les petites paires, les deux paires. Là, tu checkes plus souvent. Et quand tu mises, tu mises plus gros, deux tiers du pot, avec tes vraies mains et tes gros tirages. As-roi sans cœur, sur ce board, checke le plus souvent.'],
    ['J', 'Et le nombre d’adversaires ?'],
    ['Y', 'C’est le deuxième grand facteur. Contre un adversaire, tu peux miser souvent : il a raté le flop environ deux fois sur trois. Contre deux, réduis nettement tes bluffs. Contre trois ou plus, mise surtout pour la valeur, parce que la probabilité qu’au moins un joueur ait touché devient très grande. C’est l’erreur classique au club : c-better à quatre joueurs sur un board connecté, et brûler des jetons contre des mains qui ont touché.'],
    ['J', 'Et quand c’est moi qui défends ?'],
    ['Y', 'On reprend nos deux outils : la cote, et la défense minimale. Face à une mise d’un tiers du pot, il te faut vingt pour cent d’équité, et tu dois défendre à peu près trois quarts de ta range pour ne pas te faire exploiter. Face à une mise du pot, trente-trois pour cent, et la moitié de ta range.'],
    ['J', 'Trois quarts ? Contre une petite mise, je dois défendre presque tout ?'],
    ['Y', 'Presque, oui. Sinon, ton adversaire gagne de l’argent en misant petit avec n’importe quoi. Exemple : pot de mille deux cents, il mise quatre cents. Tu paies quatre cents pour un pot final de deux mille : vingt pour cent. Une paire moyenne a ça. Un tirage couleur aussi. Un simple tirage ventral, quatre outs, n’a qu’environ dix-sept pour cent sur deux cartes : seul, ce n’est pas assez. Avec une carte haute en plus, ça devient jouable.'],
    ['J', 'Et le check-raise ?'],
    ['Y', 'C’est ton arme de défenseur. Tu checkes, il mise, tu relances. Tu le fais avec tes meilleures mains, double paire, brelan, et tes gros tirages, couleur plus quinte, surtout sur les boards bas qui te sont favorables. La taille : environ trois fois sa mise. Et garde aussi des mains fortes dans tes calls, pour que tes calls ne soient pas toujours faibles.'],
    ['J', 'Et face à une surmise au flop ?'],
    ['Y', 'C’est rare, et souvent très polarisé : grosse main ou bluff. Face à deux fois le pot, il te faut quarante pour cent. Paie avec tes mains fortes et tes gros tirages, couche tes paires moyennes, sauf contre un maniac qui le fait avec n’importe quoi.'],
    ['J', 'Une main ?'],
    ['Y', 'Tu es en grosse blinde avec six-cinq de pique. Le bouton ouvre, tu paies. Flop : sept de pique, quatre de cœur, deux de pique. Tu as un tirage quinte par les deux bouts et un tirage couleur : quinze outs, plus de cinquante pour cent contre une paire. Tu checkes, il mise un tiers. C’est le moment parfait pour un check-raise à trois fois sa mise : tu peux le faire coucher tout de suite, et quand il paie, tu es souvent favori. Board bas, gros tirage, défenseur : tout est réuni.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : tu as relancé au cut-off, la grosse blinde paie. Flop roi, sept, deux en trois couleurs. Quelle taille de c-bet ?'],
    ['P', 5],
    ['Y', 'Un tiers du pot.'],
    ['Y', 'Deuxième question : flop huit, sept, cinq avec deux cœurs, tu as relancé au bouton avec as-roi sans cœur. Que fais-tu le plus souvent ?'],
    ['P', 5],
    ['Y', 'Tu checkes. C’est le board de la grosse blinde.'],
    ['Y', 'Troisième question : il mise un tiers du pot. Quelle part de ta range dois-tu défendre ?'],
    ['P', 5],
    ['Y', 'Environ soixante-quinze pour cent.'],
    ['J', 'Ça fait beaucoup de choses à penser.'],
    ['Y', 'Ça devient automatique. On résume. Un : board sec et haut, c-bet petit et fréquent ; board bas et connecté, check plus, et mises plus grosses. Deux : plus il y a d’adversaires, moins tu bluffes. Trois : en défense, vingt pour cent face à un tiers du pot, trente-trois face au pot. Quatre : check-raise avec les meilleures mains et les gros tirages sur les boards bas. À bientôt !']
  ];
  L[16].podcast = [
    ['J', 'Salut Yo ! La river. Le moment où je me pose le plus de questions.'],
    ['Y', 'Salut ! Et c’est normal : c’est la dernière décision, et souvent la plus chère. Mais la river a un avantage énorme : il n’y a plus de carte à venir. Ta main ne changera plus. Donc on peut la classer très simplement, dans une de trois catégories.'],
    ['J', 'Lesquelles ?'],
    ['Y', 'Valeur : ta main bat la plupart des mains qui paieront. Bluff-catcher : elle bat les bluffs de l’adversaire, mais perd contre ses mains de valeur. Et bluff : elle ne gagne presque jamais à l’abattage. Chaque catégorie a son action. La valeur mise. Le bluff-catcher checke, puis décide s’il paie. Le bluff mise, ou abandonne.'],
    ['J', 'Comment je sais si ma main est de la valeur ?'],
    ['Y', 'Pose-toi cette question : si je mise et qu’il paie, est-ce que je gagne plus d’une fois sur deux ? Pas contre toute sa range, contre les mains qui paient. Si oui, mise. C’est là que les joueurs serrés perdent beaucoup d’argent : ils checkent des mains qui auraient été payées par pire.'],
    ['J', 'Même avec une paire moyenne ?'],
    ['Y', 'Ça dépend de l’adversaire. Contre un joueur qui paie large, une petite mise, un quart à quarante pour cent du pot, avec une top paire moyenne, rapporte ce que le check laisse passer. C’est la valeur fine. Il paie avec sa deuxième paire, sa petite paire, parfois hauteur as. Contre un nit qui ne paie qu’avec mieux, tu checkes.'],
    ['J', 'Et avec une très grosse main ?'],
    ['Y', 'Sur un board effrayant, avec quatre cartes à la couleur par exemple, et toi qui as la couleur à l’as, mise gros : deux tiers du pot, voire une surmise. Ceux qui ont une couleur plus petite ne peuvent pas se coucher.'],
    ['J', 'Et les bluffs ?'],
    ['Y', 'Les meilleurs bluffs sont des tirages ratés, des mains qui ne gagnent jamais au check, et qui bloquent les payes de l’adversaire. Exemple : le board a trois piques, et tu as l’as de pique sans la couleur. Ton adversaire ne peut pas avoir la couleur à l’as, la main qui paierait toujours. Tu bloques sa meilleure paye.'],
    ['J', 'Combien de bluffs, alors ?'],
    ['Y', 'Pour une mise au pot, un tiers de tes mises peuvent être des bluffs : deux mains de valeur pour un bluff. Pour une demi-mise, un quart. C’est la même formule qu’au chapitre treize. Mais au club, contre des joueurs qui paient beaucoup, on bluffe moins que ça.'],
    ['J', 'Et l’erreur à ne pas faire ?'],
    ['Y', 'Bluffer avec une paire moyenne qui gagnait souvent au check. Tu as une paire de huit, tu checkes, tu gagnes souvent. Si tu mises, les mains pires se couchent, les mieux paient : tu as transformé une main qui gagne en main qui perd. Les paires moyennes, à la river, sont des bluff-catchers, pas des bluffs.'],
    ['J', 'Et justement, quand c’est lui qui mise et que j’ai un bluff-catcher ?'],
    ['Y', 'Deux étapes. Un : l’équité requise. Face à une mise du pot, trente-trois pour cent. Deux : combien de bluffs sa ligne contient vraiment ? Un nit qui a payé deux rues et mise gros à la river n’en a presque aucun : couche-toi. Un joueur large et agressif en a beaucoup : paie plus large. Et un récréatif qui mise petit à la river, c’est souvent une main moyenne qui veut voir : souvent, tu paies.'],
    ['J', 'Une main ?'],
    ['Y', 'Tu ouvres au bouton avec dame-valet de cœur. La grosse blinde paie. Flop : dix de pique, neuf de pique, deux de carreau. Tu as un tirage quinte par les deux bouts. Tu mises, elle paie. Turn : quatre de trèfle. Tu checkes. River : as de pique. Tu as raté, tu as hauteur dame. Elle checke. Tu ne gagneras jamais au check. Est-ce un bon bluff ? Tu n’as pas de pique, donc tu ne bloques pas ses couleurs. Mais l’as fait peur, et elle avait souvent une paire de neuf ou de dix. Tu peux miser les deux tiers. Et si ton valet avait été le valet de pique, tu bloquerais en plus une partie de ses couleurs : encore mieux.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : une paire moyenne qui bat les bluffs mais pas la valeur, c’est quoi ?'],
    ['P', 5],
    ['Y', 'Un bluff-catcher.'],
    ['Y', 'Deuxième question : board avec trois piques à la river. Quel est le meilleur bluff : un tirage raté avec l’as de pique, ou une paire de deux ?'],
    ['P', 5],
    ['Y', 'Le tirage raté avec l’as de pique : il bloque les meilleures couleurs.'],
    ['Y', 'Troisième question : un nit mise gros à la river, tu as un bluff-catcher. Que fais-tu le plus souvent ?'],
    ['P', 5],
    ['Y', 'Tu te couches. Peu de bluffs dans sa range.'],
    ['J', 'Clair.'],
    ['Y', 'On résume. Un : à la river, classe ta main : valeur, bluff-catcher ou bluff. Deux : mise pour la valeur si tu bats plus de la moitié des mains qui paient ; valeur fine contre ceux qui paient large. Trois : bluffe avec des tirages ratés qui bloquent ses payes, jamais avec une paire qui gagnait au check. Quatre : avec un bluff-catcher, compare la cote aux bluffs réels du profil. À bientôt !']
  ];

  L[17].podcast = [
    ['J', 'Salut Yo ! Le SPR. Encore un sigle.'],
    ['Y', 'Salut ! Celui-là est précieux, parce qu’il te dit avant même de jouer le flop quelles mains pourront aller à tapis. SPR, c’est le rapport entre ton tapis et le pot au flop. Tu prends le tapis effectif qui reste, le plus petit des deux, et tu le divises par le pot.'],
    ['J', 'Exemple ?'],
    ['Y', 'Tu ouvres à deux grosses blindes et demie, le bouton sur-relance à huit, tu paies. Les blindes se sont couchées. Pot au flop : huit plus huit plus la grosse blinde et demie des blindes, dix-sept et demie. Vous aviez cent grosses blindes, il vous en reste quatre-vingt-douze. Quatre-vingt-douze divisé par dix-sept et demie : environ cinq.'],
    ['J', 'Et ça me dit quoi, cinq ?'],
    ['Y', 'Ça te dit combien de mises il faudra pour mettre tout l’argent au milieu. Avec un SPR de cinq, deux mises raisonnables suffisent. Avec un SPR de dix-sept, il en faut trois grosses. Voilà les repères. SPR sous trois : top paire bon kicker et mieux partent à tapis sans hésiter. De trois à six : overpaire et top paire forte s’engagent. De six à treize : il faut une double paire ou mieux pour tout mettre. Au-dessus de treize : les mains moyennes contrôlent le pot, seuls brelans, quintes et couleurs veulent tout jouer.'],
    ['J', 'Et les valeurs habituelles ?'],
    ['Y', 'À cent grosses blindes : un pot simple, une ouverture payée, donne un SPR autour de dix-sept. Un pot sur-relancé, autour de cinq. Un pot 4-bet, autour de deux. Et en tournoi, avec des tapis plus courts, les SPR sont souvent plus bas : à trente grosses blindes, même un pot simple tourne autour de six.'],
    ['J', 'Donc en pot sur-relancé, ma top paire vaut plus cher.'],
    ['Y', 'Exactement. C’est l’erreur classique : jouer une top paire comme une main de check-call dans un pot 3-bet, avec un SPR de quatre. Tu laisses passer de la valeur, tu offres des cartes gratuites, et à la fin tu paies quand même ton tapis à la river contre une range plus forte. Avec un SPR de quatre, une top paire bon kicker prépare le tapis dès le flop.'],
    ['J', 'Et la différence entre celui qui a sur-relancé et celui qui a payé ?'],
    ['Y', 'Celui qui a sur-relancé a l’initiative et une range plus forte : sur un board avec un as ou un roi, il mise souvent et petit, un quart à un tiers du pot. Celui qui a payé a une range plafonnée : il aurait 4-bet les as et les rois. Donc face à une grosse mise sur un board effrayant, il ne doit pas payer tout ce qu’il a.'],
    ['J', 'Et la surmise ?'],
    ['Y', 'Avec un SPR bas, deux ou trois, une surmise au flop, c’est simplement un tapis. Et c’est souvent la meilleure taille avec une main forte : tu ne laisses aucune carte gratuite. Avec un SPR haut, la surmise se garde pour la turn ou la river, quand tu as l’avantage des nuts.'],
    ['J', 'Une main ?'],
    ['Y', 'Tournoi Winamax, tu as trente-cinq grosses blindes au cut-off. Tu ouvres à deux, le bouton paie, les blindes se couchent. Pot au flop : quatre plus une et demie, cinq et demie, plus les antes, disons six et demie. Il te reste trente-trois. SPR : environ cinq. Tu as as-roi, flop : roi, neuf, quatre. Top paire, meilleur kicker, SPR cinq : c’est une main d’engagement. Tu mises la moitié du pot, il paie. Turn : une petite carte. Tu mises encore, et à la river, ton tapis part facilement. Avec cent grosses blindes et un SPR de quinze, la même main devrait contrôler le pot.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : pot au flop de vingt grosses blindes, il te reste quatre-vingt-dix. Quel SPR ?'],
    ['P', 5],
    ['Y', 'Quatre et demi.'],
    ['Y', 'Deuxième question : SPR de deux en pot 4-bet avec top paire bon kicker. Tu fais quoi ?'],
    ['P', 5],
    ['Y', 'Tu engages ton tapis.'],
    ['Y', 'Troisième question : tu as payé une sur-relance. Ta range est forte ou plafonnée ?'],
    ['P', 5],
    ['Y', 'Plafonnée : tu aurais 4-bet tes meilleures mains.'],
    ['J', 'Ça simplifie.'],
    ['Y', 'C’est le but. On résume. Un : SPR égale tapis restant divisé par pot au flop. Deux : pot simple dix-sept, pot sur-relancé cinq, pot 4-bet deux, à cent grosses blindes. Trois : SPR bas, les paires fortes s’engagent ; SPR haut, il faut une double paire ou mieux. Quatre : en tournoi, les tapis courts font des SPR bas, alors tes top paires valent plus cher. À bientôt !']
  ];

  L[18].podcast = [
    ['J', 'Salut Yo ! Les pots à plusieurs. Au club, c’est presque tous les coups.'],
    ['Y', 'Salut ! Exactement, et c’est pour ça que cet épisode compte. Une règle d’abord : à plusieurs, les mains se renforcent. À deux joueurs, une paire moyenne est souvent la meilleure main. À quatre, quelqu’un a souvent touché mieux. Dès trois adversaires, la probabilité qu’au moins un ait une paire au flop dépasse cinquante pour cent.'],
    ['J', 'Donc je dois avoir plus pour miser.'],
    ['Y', 'Plus pour miser, et plus pour payer. Et tu bluffes beaucoup moins : faire coucher trois joueurs, c’est bien plus dur que d’en faire coucher un.'],
    ['J', 'Et les mains à jouer dans ces coups-là ?'],
    ['Y', 'Celles qui font des mains très fortes. Les petites paires, pour le brelan. Les connecteurs assortis, pour la quinte et la couleur. Les as assortis, pour la couleur à l’as. Quand elles touchent, elles gagnent les gros pots, et à plusieurs, il y a toujours quelqu’un pour payer. Par contre, les mains comme roi-valet, dame-dix, as-neuf dépareillés perdent de l’argent : quand elles touchent une paire, elles sont souvent dominées par une meilleure.'],
    ['J', 'Et le c-bet à plusieurs ?'],
    ['Y', 'Mise avec top paire bon kicker et mieux, et avec tes gros tirages. Checke beaucoup plus le reste. Et la taille : la moitié à deux tiers du pot. Un petit c-bet d’un tiers, à quatre joueurs, fait payer tout le monde, y compris tous les tirages. Tu veux qu’ils paient cher pour tirer.'],
    ['J', 'Et quand quelqu’un mise devant moi, avec des joueurs derrière ?'],
    ['Y', 'Paie plus serré. Tu n’es pas seulement face à la mise : un joueur derrière toi peut encore relancer, et tu seras coincé. Avec un tirage, préfère les tirages max. Un tirage couleur au dix, à quatre, c’est dangereux : une couleur plus haute est possible, et tu perdrais un très gros pot. Et au club, retiens ça : une mise dans un pot à quatre joueurs, c’est souvent une vraie main. Les récréatifs bluffent très rarement dans ces coups-là.'],
    ['J', 'Une main ?'],
    ['Y', 'Au club, trois limpers, tu es au bouton avec as-roi. Bon réflexe : tu isoles à six grosses blindes. Mais deux joueurs paient quand même. Vous êtes trois au flop. Flop : neuf de pique, huit de carreau, six de trèfle. Tu as as-roi sans rien. Ils checkent. Faut-il miser ? Non. Sur un board aussi connecté, à trois, quelqu’un a souvent une paire, un tirage, voire mieux. Tu checkes, et tu prends la turn gratuitement. Maintenant, change le flop : as, sept, deux en trois couleurs. Tu as top paire meilleur kicker. Là, tu mises deux tiers du pot, et tu continues pour la valeur.'],
    ['J', 'Et si je suis dans la grosse blinde avec une petite paire, et que trois joueurs ont limpé ?'],
    ['Y', 'Tu checkes, et tu vois le flop gratuitement. Si tu touches ton brelan, c’est le jackpot : à quatre, quelqu’un aura une paire et paiera. Si tu rates, tu abandonnes sans regret. C’est exactement le genre de main qui aime les pots à plusieurs.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : flop neuf, huit, six à quatre joueurs, tu as as-roi sans rien et tu as relancé. Que fais-tu le plus souvent ?'],
    ['P', 5],
    ['Y', 'Tu checkes.'],
    ['Y', 'Deuxième question : quelle main préfère un pot à plusieurs : six-cinq de cœur ou roi-valet dépareillé ?'],
    ['P', 5],
    ['Y', 'Six-cinq de cœur.'],
    ['Y', 'Troisième question : à plusieurs, ta taille de c-bet de valeur est plutôt un tiers, ou la moitié à deux tiers du pot ?'],
    ['P', 5],
    ['Y', 'La moitié à deux tiers, pour faire payer cher les tirages.'],
    ['J', 'Je vais moins bluffer au club.'],
    ['Y', 'Voilà. On résume. Un : à plusieurs, moins de bluffs, plus de valeur. Deux : petites paires, connecteurs assortis et as assortis aiment les pots à plusieurs ; les dépareillées moyennes non. Trois : mise plus gros pour faire payer les tirages. Quatre : paie plus serré quand il reste des joueurs derrière, et respecte les mises dans les gros pots du club. À bientôt !']
  ];
  L[19].podcast = [
    ['J', 'Salut Yo ! Les phases d’un tournoi. Je joue un peu pareil du début à la fin, je crois.'],
    ['Y', 'Salut ! C’est très fréquent, et ça coûte cher, parce qu’un tournoi n’est pas une partie unique. C’est une suite de phases, chacune avec ses règles. Le début, le milieu avec les antes, l’approche de la bulle, la bulle elle-même, puis les places payées. On les prend dans l’ordre.'],
    ['J', 'Le début.'],
    ['Y', 'Tapis profonds, cent grosses blindes et plus. Par exemple vingt mille jetons à cent-deux cents. C’est la phase où l’on joue serré-agressif, où l’on cherche les gros pots avec les grosses mains, et où l’on évite les gros bluffs. Et surtout, c’est là que les joueurs récréatifs donnent le plus de jetons : ils paient trop. Ton arme, c’est la mise de valeur, franche, rue après rue.'],
    ['J', 'Et le milieu ?'],
    ['Y', 'Les antes arrivent, et ça change tout. Avec l’ante de la grosse blinde, le pot avant le flop passe d’une grosse blinde et demie à deux et demie. Voler un pot rapporte donc beaucoup plus pour le même risque. Tu élargis tes ouvertures en fin de table, et tu défends plus large en grosse blinde. Et ton tapis baisse souvent vers vingt-cinq ou quarante grosses blindes : c’est la zone des deux épisodes suivants.'],
    ['J', 'Et la bulle ?'],
    ['Y', 'Avant les places payées, les tapis moyens se crispent. Ils ne veulent surtout pas sauter juste avant l’argent. Résultat : ils se couchent beaucoup trop. C’est le moment de les voler. Les petits tapis, eux, doivent pousser avant d’être trop courts. Et les gros tapis attaquent.'],
    ['J', 'Et moi, si je suis tapis moyen à la bulle ?'],
    ['Y', 'Alors c’est toi qui dois faire attention à payer. Payer un tapis devient beaucoup plus cher, à cause de l’ICM, qu’on voit au chapitre vingt-trois : perdre te coûte bien plus que gagner ne te rapporte. Donc tu resserres tes payes. Tu peux encore ouvrir et pousser toi-même, parce que c’est l’autre qui doit payer. C’est l’erreur classique : payer un tapis à la limite avec un tapis moyen, comme si on était en début de tournoi.'],
    ['J', 'Et quand je suis gros tapis ?'],
    ['Y', 'Là, tu as une arme. Ouvre plus large, surtout quand les tapis moyens sont à ta gauche : ils ne peuvent pas te sur-relancer sans risquer leur tournoi. Mets la pression par petites relances répétées, deux grosses blindes suffisent. Mais évite l’autre gros tapis : vous avez tous les deux beaucoup à perdre, et un coup marginal contre lui peut te faire passer de chip leader à tapis moyen.'],
    ['J', 'Et après la bulle ?'],
    ['Y', 'Juste après, beaucoup de joueurs se relâchent. Ils sont dans l’argent, ils n’ont plus peur, ils poussent large. Paie un peu plus large contre eux. Puis, à chaque palier de gains qui se rapproche, la prudence revient, surtout à l’approche de la table finale.'],
    ['J', 'Une main ?'],
    ['Y', 'Freeroll du club, cinquante et un joueurs, quinze payés. Il en reste seize. Tu as soixante grosses blindes, le plus gros tapis de ta table. À ta gauche, deux joueurs avec vingt grosses blindes, qui jouent très serré depuis dix minutes. Tout le monde se couche jusqu’à toi au cut-off. Tu as dix-sept assorti. En temps normal, tu te coucherais peut-être. Ici, tu ouvres à deux grosses blindes : ils vont se coucher presque à chaque fois, et chaque pot volé te rapproche de la table finale. Si l’un d’eux pousse son tapis, tu te couches sans regret : tu n’as risqué que deux grosses blindes.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : avec l’ante de la grosse blinde, combien vaut le pot avant le flop ?'],
    ['P', 5],
    ['Y', 'Deux grosses blindes et demie.'],
    ['Y', 'Deuxième question : tu es gros tapis à la bulle, les tapis moyens sont à ta gauche. Tu ouvres plus large ou plus serré ?'],
    ['P', 5],
    ['Y', 'Plus large.'],
    ['Y', 'Troisième question : juste après la bulle, les adversaires poussent plus large. Tu paies plus large ou plus serré ?'],
    ['P', 5],
    ['Y', 'Un peu plus large : ils n’ont plus peur.'],
    ['J', 'Je vais changer de vitesse selon le moment.'],
    ['Y', 'Exactement. On résume. Un : en début de tournoi, serré-agressif, et la valeur contre les récréatifs. Deux : avec les antes, on vole et on défend plus large. Trois : à la bulle, les tapis moyens se crispent, le gros tapis attaque, et les payes se resserrent. Quatre : après la bulle, on paie un peu plus large. À bientôt !']
  ];

  L[20].podcast = [
    ['J', 'Salut Yo ! Les tapis de vingt-cinq à quarante grosses blindes. C’est souvent là que je me retrouve au milieu des tournois.'],
    ['Y', 'Salut ! C’est la zone la plus fréquente en tournoi, et la plus mal jouée. Avec trente grosses blindes, tu as encore de quoi jouer après le flop, mais plus de quoi faire plusieurs rues avec une main moyenne. Regarde : tu ouvres à deux, on te sur-relance, tu paies. Tu as déjà engagé le tiers de ton tapis. Tu devras souvent choisir entre un vrai engagement et le fold.'],
    ['J', 'Et les ouvertures, elles changent ?'],
    ['Y', 'Un peu. Le profil TAG, entre vingt et quarante grosses blindes, ouvre environ douze pour cent en UTG, vingt-cinq au cut-off, trente-cinq au bouton. Un peu plus serré en fin de table qu’avec un tapis profond, et toujours petit : deux grosses blindes, pour pouvoir te coucher face à un tapis sans avoir trop perdu.'],
    ['J', 'Et la sur-relance ?'],
    ['Y', 'C’est le grand changement. Avec trente grosses blindes, une sur-relance à sept te laisse sans bonne option si l’adversaire pousse son tapis : tu as mis presque le quart de ton tapis, et tu dois te coucher ou payer à contrecœur. Donc à ces profondeurs, la sur-relance devient le plus souvent un tapis direct. On l’appelle le re-shove, ou le resteal.'],
    ['J', 'Avec quelles mains ?'],
    ['Y', 'La valeur, évidemment, et quelques mains à bloqueurs, comme as-cinq assorti ou roi-valet assorti. Contre un voleur qui ouvre large au cut-off ou au bouton, un tapis de vingt-cinq grosses blindes gagne très souvent le pot sans abattage. Il a ouvert avec quarante pour cent de ses mains, il ne peut pas payer ton tapis avec la plupart.'],
    ['J', 'Et le M, dans la leçon ?'],
    ['Y', 'C’est un repère inventé par Dan Harrington. Ton tapis divisé par le coût d’un tour de table : petite blinde, grosse blinde et antes. Avec l’ante de la grosse blinde, un tour coûte deux grosses blindes et demie. Un tapis de trente grosses blindes donne un M de douze : tu peux faire douze tours de table sans jouer avant d’être éliminé.'],
    ['J', 'Et les zones ?'],
    ['Y', 'Quatre couleurs. Verte, M de vingt et plus : jeu normal. Jaune, de dix à vingt : on vole davantage. Orange, de six à dix : tapis ou fold. Rouge, cinq et moins : tapis avec une large range dès que personne n’a ouvert devant toi. Ça te donne un réflexe simple : quand tu passes dans une nouvelle zone, ton jeu change.'],
    ['J', 'Une main ?'],
    ['Y', 'Tournoi Winamax, blindes cinq cents-mille, ante mille. Tu as vingt-huit mille, vingt-huit grosses blindes, en grosse blinde. Le bouton, un joueur agressif, ouvre à deux mille. Tout le monde se couche jusqu’à toi. Tu as as-cinq de carreau. Option un : payer, et jouer hors position avec as-hauteur. Option deux : la petite sur-relance, que tu ne peux pas suivre s’il pousse. Option trois : tapis. Le bouton ouvre large, il devra se coucher avec la plupart de ses mains, et tu ramasses quatre mille cinq cents jetons, presque cinq grosses blindes, sans voir le flop. Quand il paie avec un as plus fort, tu as encore environ trente pour cent. C’est le resteal.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : avec l’ante de la grosse blinde, un tapis de vingt-cinq grosses blindes donne quel M ?'],
    ['P', 5],
    ['Y', 'Dix. Vingt-cinq divisé par deux et demie.'],
    ['Y', 'Deuxième question : zone orange, M entre six et dix. Comment tu joues ?'],
    ['P', 5],
    ['Y', 'Tapis ou fold.'],
    ['Y', 'Troisième question : pourquoi éviter la petite sur-relance à trente grosses blindes ?'],
    ['P', 5],
    ['Y', 'Elle te laisse sans bonne option face au tapis adverse.'],
    ['J', 'C’est très concret.'],
    ['Y', 'On résume. Un : entre vingt-cinq et quarante grosses blindes, on ouvre un peu plus serré en début de table, et petit. Deux : la sur-relance devient un tapis, le resteal, surtout contre les voleurs. Trois : le M, c’est ton tapis divisé par le coût d’un tour ; vert, jaune, orange, rouge. Quatre : pas de petite sur-relance qu’on ne peut pas suivre. À bientôt !']
  ];

  L[21].podcast = [
    ['J', 'Salut Yo ! Quinze à vingt-cinq grosses blindes. Là, je stresse.'],
    ['Y', 'Salut ! C’est normal, chaque décision compte. Mais justement, à ces profondeurs, le jeu se simplifie. Tu n’as plus vraiment de jeu après le flop. Chaque ouverture est presque un engagement. Tu as trois options, pas plus : le tapis direct, l’ouverture puis tapis ou fold, et le fold.'],
    ['J', 'Quand je fais quoi ?'],
    ['Y', 'Le tapis direct, vers quinze grosses blindes et moins, surtout en fin de table, avec les tables du chapitre vingt-deux. L’ouverture à deux grosses blindes, de dix-huit à vingt-cinq : tu gardes la possibilité de te coucher face à un tapis. Et le fold, avec les mains marginales en début de table.'],
    ['J', 'Mais si j’ouvre et qu’on me fait tapis, je dois souvent me coucher. Ça me paraît du gâchis.'],
    ['Y', 'C’est le prix normal de la fold equity. Ta range d’ouverture n’est pas faite pour payer un tapis en entier. Tu ouvres avec dix-neuf assorti au cut-off parce que les autres se couchent souvent. Quand quelqu’un pousse, tu lâches, et tu as perdu deux grosses blindes. Ce n’est pas une erreur, c’est le coût du vol. L’erreur, c’est d’ouvrir à deux avec seize grosses blindes, puis de payer un tapis avec une main moyenne parce qu’on a déjà mis des jetons.'],
    ['J', 'Et quand c’est moi qui fais tapis sur une ouverture ?'],
    ['Y', 'C’est le re-shove. À quinze grosses blindes, face à une ouverture de début de table, ta range est très étroite : trois à quatre pour cent des mains. Neuf-neuf et mieux, as-dame assorti et mieux, as-roi. Face à une ouverture tardive, du cut-off, du bouton ou de la petite blinde, c’est beaucoup plus large : douze à vingt et un pour cent. Par exemple quatre-quatre et plus, as-neuf assorti, roi-dix assorti, dame-valet assorti, as-dix dépareillé, roi-dame dépareillé.'],
    ['J', 'Et l’ouvreur, il paie souvent ?'],
    ['Y', 'Plus souvent qu’on ne croit. À quinze grosses blindes, l’ouvreur paie près de la moitié, voire les deux tiers de sa range d’ouverture face à un re-shove : il a déjà mis deux grosses blindes, et le pot est gros. Donc ton re-shove n’est pas un bluff pur : il faut une main qui garde de l’équité quand elle est payée.'],
    ['J', 'Et le stop-and-go ?'],
    ['Y', 'C’est une arme rare. Tu as dix à quinze grosses blindes en grosse blinde. Quelqu’un sur-relance et tu dois presque forcément payer. Au lieu de payer puis de jouer le flop normalement, tu décides d’avance de pousser au flop, quoi qu’il arrive. Ton adversaire, s’il a raté, et il rate deux fois sur trois, doit se coucher. Tu reprends l’initiative.'],
    ['J', 'Et le limp-shove ?'],
    ['Y', 'En début de table, avec une très grosse main, tu limpes en espérant qu’on relance, pour faire tapis derrière. C’est rare, et c’est lisible si tu ne limpes jamais autrement. Au club, avec beaucoup de limpers, ça peut passer inaperçu. Mais ne le fais pas souvent.'],
    ['J', 'Une main ?'],
    ['Y', 'Tu as dix-sept grosses blindes au bouton. Le cut-off, un joueur agressif avec un gros tapis, ouvre à deux. Tu as as-dix dépareillé. Contre un voleur au cut-off, as-dix est dans ta range de re-shove. Tu pousses. Il doit payer quinze grosses blindes de plus dans un pot de vingt et une : il lui faut environ quarante pour cent. Il se couchera avec ses petites mains, et quand il paie avec as-roi ou une paire haute, tu auras encore une petite chance. Si c’était le joueur UTG qui avait ouvert, avec as-dix tu te couches.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : à quinze grosses blindes, face à une ouverture UTG, avec quelles mains tu re-shoves ?'],
    ['P', 5],
    ['Y', 'Neuf-neuf et mieux, as-dame assorti et mieux, as-roi.'],
    ['Y', 'Deuxième question : après avoir ouvert, tu te couches face à un tapis avec une main moyenne. Est-ce une erreur ?'],
    ['P', 5],
    ['Y', 'Non. C’est le prix normal de la fold equity.'],
    ['Y', 'Troisième question : à vingt-deux grosses blindes au cut-off, avec une main correcte, l’option la plus courante ?'],
    ['P', 5],
    ['Y', 'Ouvrir à deux grosses blindes, puis tapis ou fold.'],
    ['J', 'C’est plus simple que je pensais.'],
    ['Y', 'On résume. Un : entre quinze et vingt-cinq grosses blindes, trois options : tapis direct, ouverture puis tapis ou fold, ou fold. Deux : re-shove étroit contre le début de table, large contre les voleurs. Trois : se coucher après avoir ouvert, c’est normal. Quatre : stop-and-go et limp-shove, rarement, dans des cas précis. À bientôt !']
  ];

  L[22].podcast = [
    ['J', 'Salut Yo ! Les tables de push-fold. Sous quinze grosses blindes, c’est tapis ou rien ?'],
    ['Y', 'Salut ! C’est tapis ou fold, oui. Avec si peu de jetons, ouvrir à deux puis jouer le flop n’a plus de sens : tu engagerais une trop grosse part de ton tapis. Chaque décision devient binaire. Et pour cette décision, on a des tables calculées spécialement pour le cours.'],
    ['J', 'Calculées comment ?'],
    ['Y', 'On a calculé l’équité de chacune des cent soixante-neuf mains possibles contre toutes les autres. Puis on a cherché l’équilibre : le point où personne ne peut gagner plus en changeant seul sa stratégie. Hypothèses : neuf joueurs, tapis égaux, un petit ante, et un calcul en jetons, sans ICM. Dans l’appli, tu les trouves dans Ma range : choisis « moins de vingt grosses blindes », puis la profondeur, de quinze à trois.'],
    ['J', 'Donne-moi des repères.'],
    ['Y', 'À quinze grosses blindes : UTG pousse neuf pour cent des mains, le bouton trente-huit, la petite blinde soixante-cinq. À dix grosses blindes : UTG dix-neuf pour cent, cut-off trente-six, bouton quarante-huit, petite blinde soixante-dix-huit. Plus tu es tard, plus tu es court, plus tu pousses large.'],
    ['J', 'Soixante-dix-huit pour cent en petite blinde ? Presque tout ?'],
    ['Y', 'Presque tout, parce qu’il ne reste que la grosse blinde, et qu’elle doit avoir une vraie main pour payer. Et pour payer, justement : à dix grosses blindes, la grosse blinde paie un tapis de la petite blinde avec soixante-quatre pour cent des mains, un tapis du bouton avec quarante-cinq, un tapis d’UTG avec vingt-six.'],
    ['J', 'Et le danger, c’est quoi ?'],
    ['Y', 'Attendre. Avec huit grosses blindes, chaque tour de table te coûte deux grosses blindes et demie, plus de trente pour cent de ton tapis. Si tu attends une « vraie main », dans deux tours tu n’as plus que trois grosses blindes, et même en doublant tu restes court. Pousser dix-six assorti ou roi-deux dépareillé au bouton avec huit grosses blindes, ça paraît fou. C’est pourtant ce que disent les tables, et elles ont raison.'],
    ['J', 'Et les limites de ces tables ?'],
    ['Y', 'Deux. Un : ce sont des ranges d’équilibre, contre des adversaires qui jouent parfaitement. Contre un joueur qui paie trop peu, tu peux pousser plus large. Contre un joueur qui paie tout, resserre. Deux : elles sont en jetons. Près d’une bulle ou en table finale, l’ICM resserre surtout tes payes. Tes tapis en premier restent proches des tables.'],
    ['J', 'Une main ?'],
    ['Y', 'Au club, il te reste dix grosses blindes au bouton. Tout le monde se couche. Tu as roi-sept dépareillé. Ta tête te dit : main faible. Les tables disent : le bouton pousse quarante-huit pour cent à dix grosses blindes, et roi-sept dépareillé est dedans. Tu pousses. Les blindes se couchent souvent, tu prends deux grosses blindes et demie, soit un quart de ton tapis. Et quand on te paie, tu as souvent entre trente et quarante pour cent. Maintenant, la grosse blinde, dix grosses blindes aussi, voit la petite blinde pousser. Elle a dame-six dépareillé. Soixante-quatre pour cent des mains paient : dame-six est dedans. Elle paie.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : à dix grosses blindes, quelle part des mains pousse le bouton ?'],
    ['P', 5],
    ['Y', 'Quarante-huit pour cent.'],
    ['Y', 'Deuxième question : à dix grosses blindes, avec quelle part des mains la grosse blinde paie un tapis de la petite blinde ?'],
    ['P', 5],
    ['Y', 'Soixante-quatre pour cent.'],
    ['Y', 'Troisième question : ces tables tiennent-elles compte de l’ICM ?'],
    ['P', 5],
    ['Y', 'Non, elles sont en jetons. On les ajuste près des paliers.'],
    ['J', 'Je vais les réviser dans l’appli.'],
    ['Y', 'Et dans S’entraîner, l’exercice « Tapis ou fold » te les fera pratiquer. On résume. Un : sous quinze grosses blindes, tapis ou fold. Deux : à dix grosses blindes, bouton quarante-huit pour cent, petite blinde soixante-dix-huit ; la grosse blinde paie la petite blinde avec soixante-quatre. Trois : n’attends pas une vraie main avec huit grosses blindes. Quatre : ajuste selon l’adversaire et l’ICM. À bientôt !']
  ];
  L[23].podcast = [
    ['J', 'Salut Yo ! L’ICM. On m’en parle tout le temps, mais je ne suis pas sûr de comprendre.'],
    ['Y', 'Salut ! L’idée tient en une phrase : en tournoi, un jeton perdu vaut plus qu’un jeton gagné. En cash game, tes jetons sont de l’argent : doubler ton tapis, c’est doubler ton argent. En tournoi, non. Ce que tu gagnes, c’est une place, et la valeur en euros de ton tapis n’est pas proportionnelle à tes jetons.'],
    ['J', 'Pourquoi ?'],
    ['Y', 'Prends trois joueurs avec mille jetons chacun, et des prix de cinquante, trente et vingt euros. Par symétrie, chacun vaut trente-trois euros et trente-trois centimes. Maintenant, tu élimines un adversaire et tu as deux mille jetons. Tu as doublé tes jetons. Est-ce que tu vaux soixante-six euros ? Impossible : le premier prix n’est que de cinquante. Tu vaux un peu plus de quarante. Doubler ton tapis n’a pas doublé ta valeur.'],
    ['J', 'Et comment on calcule ?'],
    ['Y', 'Avec le modèle de Malmuth-Harville. Chaque joueur a une chance de finir premier proportionnelle à son tapis. Puis on répète le calcul pour la deuxième place avec les joueurs restants, et ainsi de suite. L’appli fait le calcul pour toi dans l’exercice « Bulle et ICM ». Toi, tu dois surtout en retenir les conséquences.'],
    ['J', 'Lesquelles ?'],
    ['Y', 'La première : à la bulle, payer un tapis devient beaucoup plus cher. Un exemple tiré de la leçon. Sit and Go, quatre joueurs, trois payés : cinquante, trente, vingt euros. Les tapis : quarante, quatorze, neuf et vingt et une grosses blindes. Tu as vingt et une grosses blindes en grosse blinde. La petite blinde, avec neuf, pousse environ soixante-quatorze pour cent de ses mains. Payer te coûte huit grosses blindes pour un pot final de dix-neuf : en jetons, il te faut quarante-deux pour cent.'],
    ['J', 'Et avec quelle main ?'],
    ['Y', 'Trois cas. Avec huit-deux dépareillé, tu as trente-trois pour cent : fold évident. Avec valet-sept dépareillé, tu as quarante-cinq pour cent : en jetons, payer gagne. Mais en euros, se coucher vaut vingt-cinq euros cinquante et un, et payer vingt-cinq euros dix. La bulle transforme un call rentable en fold. Avec as-sept, cinquante-sept pour cent, payer vaut vingt-sept euros onze : là, tu paies.'],
    ['J', 'Donc l’ICM me fait coucher des mains que j’aurais payées.'],
    ['Y', 'Voilà. Et ça ne touche pas tout le monde pareil. Les tapis moyens subissent le plus la pression : ils peuvent perdre beaucoup, et gagnent peu en doublant. Les gros tapis peuvent attaquer, ils couvrent tout le monde. Et les tout petits tapis, presque éliminés, n’ont plus grand-chose à perdre : ils peuvent prendre des risques.'],
    ['J', 'Et le bubble factor ?'],
    ['Y', 'C’est une mesure de cette pression. Un pour un gros tapis : pas de pression. Un et demi à deux pour un tapis moyen. Un bubble factor de deux veut dire que perdre te coûte deux fois plus que gagner ne te rapporte. Il te faut donc beaucoup plus d’avantage pour payer.'],
    ['J', 'Et pour pousser moi-même ?'],
    ['Y', 'C’est la bonne nouvelle. L’ICM resserre tes calls, mais beaucoup moins tes tapis en premier. Pourquoi ? Parce que les autres joueurs subissent la même pression : ils se couchent davantage. Ta fold equity augmente. Donc à la bulle, tu peux continuer à pousser presque comme dans les tables du chapitre vingt-deux, mais tu paies moins.'],
    ['J', 'L’erreur classique ?'],
    ['Y', 'Payer un tapis à la bulle avec un tapis moyen « parce que la cote est bonne ». En jetons, oui. En euros, souvent non. J’ai vu des joueurs du club sauter à la seizième place d’un freeroll à quinze payés avec un call qui aurait été correct au premier niveau.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : trois joueurs à tapis égaux, prix cinquante, trente, vingt euros. Combien vaut chacun ?'],
    ['P', 5],
    ['Y', 'Trente-trois euros et trente-trois centimes.'],
    ['Y', 'Deuxième question : qui subit le plus la pression de la bulle ?'],
    ['P', 5],
    ['Y', 'Le tapis moyen.'],
    ['Y', 'Troisième question : un call rentable en jetons peut-il être un fold en euros ?'],
    ['P', 5],
    ['Y', 'Oui. C’est l’effet de bulle.'],
    ['J', 'C’est plus clair.'],
    ['Y', 'On résume. Un : en tournoi, la valeur en euros n’est pas proportionnelle aux jetons. Deux : à la bulle, les tapis moyens subissent le plus la pression. Trois : l’ICM resserre surtout les calls ; les tapis en premier gardent de la valeur grâce à la fold equity. Quatre : entraîne-toi avec l’exercice « Bulle et ICM ». À bientôt !']
  ];

  L[24].podcast = [
    ['J', 'Salut Yo ! La table finale. J’en ai fait quelques-unes au club, et je ne sais jamais trop comment jouer.'],
    ['Y', 'Salut ! La table finale, c’est la bulle qui revient à chaque élimination. Chaque joueur qui saute fait monter les gains de tous les autres. Donc avant chaque gros call, tu penses ICM. Et un réflexe : repère qui est le plus petit tapis. Tant qu’il est là, les tapis moyens doivent éviter les gros coups entre eux, parce que son élimination leur rapporterait à tous les deux.'],
    ['J', 'Et selon mon tapis ?'],
    ['Y', 'Trois situations. Petit tapis : cherche le bon moment pour pousser avant d’être trop court. Sous dix grosses blindes, ta fold equity fond, plus personne ne se couche. Tapis moyen : vole les blindes des gros tapis qui jouent serré, et évite de payer les tapis des autres moyens. Gros tapis : presse les moyens par des relances fréquentes et petites, et évite le duel avec l’autre gros tapis.'],
    ['J', 'Et le deal ? Au club, on propose parfois de partager.'],
    ['Y', 'C’est ton choix. Un deal ICM partage les gains selon les tapis. Il réduit la variance : tu sécurises une somme. Mais si tu es meilleur que tes adversaires, continuer peut rapporter plus en moyenne. Et en heads-up, un bon joueur gagne plus souvent que ses jetons ne le disent. Accepte si la somme te satisfait, pas par fatigue.'],
    ['J', 'Et le heads-up, justement ?'],
    ['Y', 'Le heads-up, c’est un autre jeu. D’abord, une règle : le bouton est aussi la petite blinde. Il parle en premier avant le flop, et en dernier après. Ensuite, les ranges explosent. Au bouton, avec vingt-cinq grosses blindes ou plus, tu ouvres soixante-dix à quatre-vingts pour cent des mains. En grosse blinde, tu défends plus de soixante pour cent face à une relance minimum.'],
    ['J', 'Soixante-dix pour cent ? Même roi-quatre ?'],
    ['Y', 'Même roi-quatre, même neuf-six. Il n’y a qu’un adversaire, tu as la position après le flop, et les blindes reviennent toutes les deux mains. Si tu te couches trop, ton adversaire te vole à chaque main. C’est l’erreur classique : jouer le heads-up comme une table pleine.'],
    ['J', 'Et quand on est court ?'],
    ['Y', 'Sous quinze grosses blindes, le heads-up se joue en tapis ou fold. Et bonne nouvelle : les tables du chapitre vingt-deux pour la petite blinde et la grosse blinde sont exactes en heads-up, puisque c’est déjà une situation à deux joueurs.'],
    ['J', 'Et les surmises ?'],
    ['Y', 'Elles sont beaucoup plus fréquentes en heads-up, parce que les ranges sont très larges. Relance préflop au tapis à quinze-vingt grosses blindes, surmise au flop sur un board qui te favorise, surmise à la river avec les nuts ou un bluff à bloqueurs. Et pour te défendre, compte. Face à une surmise d’une fois et demie le pot, il te faut trente-sept et demi pour cent. Contre une range très large, une paire moyenne suffit souvent. Ne te couche pas par réflexe.'],
    ['J', 'Une main ?'],
    ['Y', 'Heads-up final au club. Tu as trente grosses blindes, lui aussi. Tu es au bouton avec dame-cinq dépareillé. À table pleine, poubelle. Ici, tu ouvres à deux grosses blindes. Il paie. Flop : dame, huit, trois. Il checke, tu mises un tiers, il paie. Turn : un deux, il checke, tu checkes : top paire petit kicker, tu contrôles le pot. River : un roi. Il mise le pot. Il te faut trente-trois pour cent. Contre un joueur qui bluffe en heads-up, ta paire de dames est souvent devant. Tu paies, il montre valet-dix : tirage raté.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : en heads-up, qui est la petite blinde ?'],
    ['P', 5],
    ['Y', 'Le bouton.'],
    ['Y', 'Deuxième question : quelle part des mains ouvrir au bouton en heads-up à trente grosses blindes ?'],
    ['P', 5],
    ['Y', 'Soixante-dix à quatre-vingts pour cent.'],
    ['Y', 'Troisième question : en table finale, le petit tapis est encore là. Que doivent faire deux tapis moyens ?'],
    ['P', 5],
    ['Y', 'Éviter les gros coups entre eux.'],
    ['J', 'Je suis prêt pour ma prochaine finale.'],
    ['Y', 'On résume. Un : chaque palier réactive l’ICM ; les tapis moyens évitent les coups entre eux. Deux : le deal, c’est ton choix, pour la sécurité ou pour l’ambition. Trois : en heads-up, ouvre soixante-dix à quatre-vingts pour cent au bouton et défends très large. Quatre : face à une surmise en heads-up, compte, et paie plus large qu’à table pleine. À bientôt !']
  ];

  L[25].podcast = [
    ['J', 'Salut Yo ! Les PKO et les Space KO. Sur Winamax, il y en a beaucoup.'],
    ['Y', 'Salut ! Oui, et ils changent pas mal de décisions. Le principe d’un PKO, un progressive knockout : une partie du buy-in forme la prime de chaque joueur. Quand tu élimines quelqu’un, tu encaisses la moitié de sa prime tout de suite. L’autre moitié s’ajoute à ta propre prime, qui grossit.'],
    ['J', 'Exemple ?'],
    ['Y', 'Buy-in de dix euros : cinq euros vont aux prix, cinq euros forment ta prime. Tu élimines un joueur qui a cinq euros de prime : tu touches deux euros cinquante immédiatement, et ta prime passe de cinq à sept euros cinquante.'],
    ['J', 'Et ça change quoi à la table ?'],
    ['Y', 'Ça change ta cote quand tu peux éliminer quelqu’un. La prime s’ajoute au pot, en quelque sorte. Pour la compter, on la convertit en jetons. La formule : jetons par euro égale tapis de départ divisé par la part du buy-in qui va aux prix. Vingt mille jetons de départ pour cinq euros de prix : quatre mille jetons par euro. Une prime encaissée de deux euros cinquante vaut donc environ dix mille jetons.'],
    ['J', 'Et ensuite ?'],
    ['Y', 'L’équité requise devient : ta paye divisée par le pot final plus la prime en jetons. Exemple. Blindes trois cents-six cents, ante six cents. Le cut-off pousse six mille jetons, il a cinq euros de prime, et tu le couvres en grosse blinde. Sans prime, payer cinq mille quatre cents dans un pot final de douze mille neuf cents, il te faudrait environ quarante-deux pour cent. Avec les dix mille jetons de prime, environ vingt-quatre pour cent.'],
    ['J', 'C’est énorme comme différence.'],
    ['Y', 'Énorme. Contre sa range de tapis, beaucoup de mains moyennes deviennent des payes rentables : roi-huit, dame-neuf, des petites paires. Par contre, attention à deux choses. Un : plus tard dans le tournoi, quand les blindes sont grosses, la même prime pèse moins lourd en jetons, son effet diminue. Deux, et c’est l’erreur classique : la prime ne compte que si tu couvres l’adversaire.'],
    ['J', 'Pourquoi ?'],
    ['Y', 'Si tu as moins de jetons que lui et que tu perds, c’est toi qui sautes. Et s’il te reste des jetons quand tu gagnes, lui n’est pas éliminé : pas de prime. Payer large pour une prime alors que tu ne le couvres pas, c’est prendre le risque sans la récompense.'],
    ['J', 'Et le Space KO ?'],
    ['Y', 'C’est la version Winamax où la prime est tirée au sort au moment de l’élimination, parfois petite, parfois très grosse. Pour décider, on raisonne avec la valeur moyenne de la prime. Ne paie pas un tapis en rêvant du jackpot.'],
    ['J', 'Et près de la bulle ?'],
    ['Y', 'Deux forces s’opposent. La prime te pousse à payer, l’ICM à te coucher. Elles se compensent en partie. Avec un tapis moyen à la bulle, reste prudent, sauf si la prime est vraiment grosse par rapport au pot.'],
    ['J', 'Une main ?'],
    ['Y', 'PKO à cinq euros sur Winamax, début de tournoi. Tu as trente mille jetons en grosse blinde. Un joueur avec sept mille et une prime de deux euros cinquante pousse depuis le bouton. Tu as dame-neuf dépareillé. Sans prime, c’est limite. Avec la prime, convertie, ta cote baisse nettement, et tu le couvres largement. Tu paies. Si c’était toi qui avais sept mille, et lui trente mille, la prime ne compterait pas, et dame-neuf se couche souvent.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : buy-in dix euros, dont cinq de prix, vingt mille jetons de départ. Combien de jetons par euro ?'],
    ['P', 5],
    ['Y', 'Quatre mille.'],
    ['Y', 'Deuxième question : tu élimines un joueur à huit euros de prime. Combien touches-tu tout de suite ?'],
    ['P', 5],
    ['Y', 'Quatre euros : la moitié.'],
    ['Y', 'Troisième question : la prime compte dans ta cote à quelle condition ?'],
    ['P', 5],
    ['Y', 'Si tu couvres l’adversaire.'],
    ['J', 'Bien compris.'],
    ['Y', 'On résume. Un : en PKO, tu encaisses la moitié de la prime. Deux : jetons par euro égale tapis de départ divisé par la part prix ; l’équité requise devient paye divisée par pot final plus prime. Trois : la prime ne compte que si tu couvres l’adversaire. Quatre : en Space KO, raisonne avec la prime moyenne, et près de la bulle, l’ICM reprend le dessus. L’exercice « PKO et Space KO » t’attend dans S’entraîner. À bientôt !']
  ];
  L[26].podcast = [
    ['J', 'Salut Yo ! Les profils adverses. Au club, je les connais tous, ou presque.'],
    ['Y', 'Salut ! Tu les connais de visage. L’idée de cet épisode, c’est de les ranger dans des cases, pour savoir tout de suite comment jouer contre chacun. Chaque joueur s’écarte de l’équilibre dans une direction précise. Si tu repères la direction, tu sais comment l’exploiter.'],
    ['J', 'Et on les classe comment ?'],
    ['Y', 'Avec deux chiffres d’abord. Le VPIP : la part des mains où il met volontairement des jetons. C’est sa largeur de jeu. Le PFR : la part des mains où il relance avant le flop. C’est son agressivité. Et l’écart entre les deux mesure sa passivité : un joueur qui entre dans quarante pour cent des pots mais ne relance que six pour cent, il paie, il paie, il paie.'],
    ['J', 'Les huit profils de l’appli, c’est quoi ?'],
    ['Y', 'Je te les donne avec leurs chiffres, VPIP puis PFR, et l’ajustement principal. Le nit, dix et huit : vole-le, et couche-toi face à sa force. Le régulier, dix-huit et quinze : joue standard. Le large-agressif, vingt-huit, vingt-deux : paie plus large et piège-le. Le large-passif, trente-cinq, dix : isole-le et mise. La calling station, quarante, six : de la valeur, jamais de bluff. Le maniac, quarante-cinq et plus, trente-cinq et plus : laisse-le bluffer. Le récréatif fantasque, variable : reste simple et lis ses tailles. Et le survivant, douze, dix : il ne pense qu’à entrer dans l’argent, vole-le à la bulle.'],
    ['J', 'Ça fait beaucoup de cases.'],
    ['Y', 'Retiens surtout l’ajustement de chacun. Et ce sont ces mêmes profils qui jouent contre toi dans « Jouer une partie » : c’est le meilleur endroit pour apprendre à les reconnaître.'],
    ['J', 'Et combien de mains pour classer quelqu’un ?'],
    ['Y', 'Trente à cinquante mains donnent une première idée du VPIP, jamais une certitude. Le PFR en demande plus, et les statistiques après le flop, beaucoup plus. Au club, à vingt-cinq mains par heure, ça veut dire une soirée entière pour se faire une idée. L’erreur classique, c’est de classer un joueur après dix mains et de ne plus jamais réviser son jugement.'],
    ['J', 'Et au club, sans statistiques ?'],
    ['Y', 'Au club, ta meilleure information, ce sont les cartes montrées à l’abattage. Chaque fois qu’un joueur montre, note avec quoi il a relancé ou payé, et depuis quelle position. Un joueur qui montre roi-neuf dépareillé après avoir payé une relance UTG, c’est une calling station en puissance. Un joueur qui ne montre que des paires hautes et des as forts, c’est un nit.'],
    ['J', 'Et les autres statistiques ?'],
    ['Y', 'Ensuite viennent la fréquence de sur-relance, l’abandon face au c-bet, l’agressivité après le flop, et la fréquence d’abattage. Tu les verras dans l’onglet Analyser pour toi-même, d’ailleurs : c’est utile de savoir dans quel profil tu tombes.'],
    ['J', 'Une main ?'],
    ['Y', 'Au club, tu ouvres au cut-off avec as-dix dépareillé. Le bouton est un habitué que tu as classé large-passif : il entre dans tous les pots, il relance rarement. Il te sur-relance. Ses rares relances sont fortes : avec as-dix, tu te couches sans regret. Même spot, mais le bouton est un large-agressif qui sur-relance souvent : là, as-dix peut payer, voire relancer tapis selon les profondeurs.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : un joueur à quarante de VPIP et six de PFR est plutôt quoi ?'],
    ['P', 5],
    ['Y', 'Une calling station.'],
    ['Y', 'Deuxième question : un grand écart entre VPIP et PFR signifie quoi ?'],
    ['P', 5],
    ['Y', 'Passivité : il paie beaucoup plus qu’il ne relance.'],
    ['Y', 'Troisième question : contre un nit, ton ajustement principal ?'],
    ['P', 5],
    ['Y', 'Le voler souvent, et respecter ses grosses mises.'],
    ['J', 'Je vais prendre des notes au club.'],
    ['Y', 'Bonne idée. On résume. Un : VPIP, c’est la largeur ; PFR, l’agressivité ; l’écart, la passivité. Deux : huit profils, un ajustement principal chacun. Trois : trente à cinquante mains pour une première idée, et on révise son jugement. Quatre : au club, les abattages valent de l’or. À bientôt !']
  ];

  L[27].podcast = [
    ['J', 'Salut Yo ! Exploiter les récréatifs. Ça fait un peu méchant, dit comme ça.'],
    ['Y', 'Salut ! Exploiter, au poker, ça veut juste dire jouer contre la vraie personne en face, et pas contre un joueur imaginaire parfait. Et contre les récréatifs, le profit vient de la valeur, pas du bluff. Ils paient trop. Le plus gros cadeau qu’ils te font, c’est de payer tes bonnes mains.'],
    ['J', 'Commençons par la calling station.'],
    ['Y', 'Elle paie avec n’importe quelle paire jusqu’à la river, parfois avec hauteur as. Contre elle : mise pour la valeur sur trois rues avec top paire et mieux, et grossis tes mises. Deux tiers du pot à la place d’un tiers. Elle paie un tiers et deux tiers presque pareil, alors autant prendre deux tiers.'],
    ['J', 'Et je ne la bluffe jamais ?'],
    ['Y', 'Jamais. Elle paiera. L’erreur classique, c’est de bluffer une station à la river parce que « le board fait peur ». Le board fait peur à toi, pas à elle : elle paie avec sa paire de quatre. Et à l’inverse, quand une station relance, crois-la. Une station qui relance a une grosse main.'],
    ['J', 'Et le fantasque ?'],
    ['Y', 'Il limpe, il relance au minimum, il mise des tailles bizarres. Bonne nouvelle : ses tailles parlent. Grosse mise, grosse main ; petite mise, main moyenne ou tirage. Contre lui, joue des ranges un peu plus serrées et simples, isole ses limps, mise pour la valeur, et évite les bluffs compliqués en plusieurs rues : il ne les comprendra pas, il paiera par curiosité.'],
    ['J', 'Et le large-passif ?'],
    ['Y', 'Il entre dans beaucoup de pots sans relancer. Isole ses limps, comme au chapitre sept, et mise ensuite. Il se couche quand il rate le flop, il paie quand il touche. Et ses rares relances sont fortes : respecte-les.'],
    ['J', 'Et les agressifs ?'],
    ['Y', 'Le large-agressif et le maniac relancent et misent tout le temps. Contre eux, c’est l’inverse : paie plus large, laisse-les bluffer, et piège avec tes mains fortes. Par exemple, check-call au flop et à la turn, puis relance à la river. Et sur-relance plus large pour la valeur : neuf-neuf et mieux, as-valet et mieux, roi-dame. Contre leur range d’ouverture très large, ces mains sont devant. Mais ne bluffe pas un maniac : il paie par principe.'],
    ['J', 'Et la surmise, au club ?'],
    ['Y', 'Au club, une mise plus grosse que le pot est lue comme de la force. Les nits et les joueurs prudents se couchent presque toujours : c’est un bon bluff contre eux, rarement contre une station. Et quand c’est un récréatif qui surmise, c’est le plus souvent une très grosse main : couche tes mains moyennes.'],
    ['J', 'Une main ?'],
    ['Y', 'Au club, une calling station limpe. Tu isoles au bouton avec as-valet de trèfle à quatre grosses blindes. Elle paie. Flop : valet, sept, trois. Elle checke. Tu mises deux tiers du pot, pas un tiers. Elle paie. Turn : un deux. Elle checke. Tu mises encore deux tiers. Elle paie. River : un roi. Elle checke. Beaucoup de joueurs checkeraient par peur du roi. Contre elle, tu mises encore, la moitié du pot : elle paie avec valet-neuf, sept-six, et même la paire de trois. Trois rues de valeur, c’est comme ça qu’on gagne contre elle.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : contre une calling station, avec top paire, tu mises comment ?'],
    ['P', 5],
    ['Y', 'Gros, sur trois rues.'],
    ['Y', 'Deuxième question : une station relance ta mise à la turn. Elle a quoi le plus souvent ?'],
    ['P', 5],
    ['Y', 'Une grosse main.'],
    ['Y', 'Troisième question : un récréatif fait une surmise à la river, tu as une paire moyenne. Tu fais quoi ?'],
    ['P', 5],
    ['Y', 'Tu te couches le plus souvent.'],
    ['J', 'Je vais miser plus gros contre certains.'],
    ['Y', 'Voilà. On résume. Un : contre la station, de la valeur grosse sur trois rues, zéro bluff. Deux : contre le fantasque et le large-passif, isole, reste simple, lis ses tailles. Trois : contre les agressifs, paie plus large, piège, et sur-relance la valeur plus large. Quatre : au club, la surmise d’un récréatif, c’est une grosse main. À bientôt !']
  ];

  L[28].podcast = [
    ['J', 'Salut Yo ! L’image de table. Je ne sais jamais ce que les autres pensent de moi.'],
    ['Y', 'Salut ! Ton image, c’est justement ce que les autres croient de toi. Et elle compte, parce que c’est à travers elle qu’ils interprètent tes mises. Elle se construit surtout avec deux choses : les mains que tu montres, et la fréquence à laquelle tu joues.'],
    ['J', 'Les mains montrées ?'],
    ['Y', 'Ce sont elles qui pèsent le plus. Un bluff montré à l’abattage fait de toi un bluffeur pour plusieurs tours. À l’inverse, si tu ne montres que des grosses mains et que tu joues une main sur dix, on te croit serré.'],
    ['J', 'Et je m’en sers comment ?'],
    ['Y', 'C’est simple. Avec une image serrée, on se couche face à tes relances : vole plus, et mise ta valeur un peu plus petit, sinon personne ne paie. Avec une image agressive, après un bluff montré par exemple, on va te payer : mise ta valeur plein pot, et bluffe moins. L’image se dépense en bluffant, et se reconstruit en jouant solide.'],
    ['J', 'L’erreur classique ?'],
    ['Y', 'Bluffer juste après avoir été pris en bluff. Toute la table te paie. C’est le pire moment pour bluffer, et le meilleur pour miser ta valeur.'],
    ['J', 'Et lire les autres, au club ?'],
    ['Y', 'Les indices fiables, ce sont le temps de décision, les tailles de mise habituelles, et les changements de rythme. Une paye immédiate, c’est souvent une main moyenne ou un tirage : avec une grosse main, le joueur aurait réfléchi à relancer ; avec rien, il se serait couché. Un joueur qui mise toujours la moitié du pot et qui, soudain, mise le pot entier, change de rythme : ça veut dire quelque chose.'],
    ['J', 'Et les gestes ? Les mains qui tremblent ?'],
    ['Y', 'Peu fiables seuls. Beaucoup de joueurs simulent. Et une main qui tremble peut être de l’excitation avec un monstre ou de la peur avec un bluff. Un indice ne remplace jamais la lecture de range : il la confirme ou il la nuance.'],
    ['J', 'Et moi, comment je cache mes propres signaux ?'],
    ['Y', 'Une routine identique à chaque décision. Tu prends le même temps pour une décision facile et une décision difficile. Tu mises toujours de la même manière, en une fois, avec le même geste. Et tu ne commentes pas tes mains. Le plus simple : compte jusqu’à trois dans ta tête à chaque décision, même quand tu te couches avec sept-deux.'],
    ['J', 'Une main ?'],
    ['Y', 'Au club, il y a vingt minutes, tu as été pris en bluff à la river : tout le monde a vu ton huit-six de pique. Maintenant, tu ouvres au hijack avec as-roi, le bouton paie. Flop : roi, neuf, quatre. Tu mises deux tiers du pot, il paie. Turn : un deux. Ton image de bluffeur est encore fraîche. C’est le moment de miser gros, trois quarts du pot : il va te payer avec roi-dame, roi-valet, neuf-huit, parce qu’il pense que tu bluffes encore. À l’inverse, si tu as joué très serré toute la soirée, une mise plus petite fera payer plus souvent.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : tu viens de montrer un bluff. Tes prochaines mises de valeur seront plus payées ou moins payées ?'],
    ['P', 5],
    ['Y', 'Plus payées. On te croit bluffeur.'],
    ['Y', 'Deuxième question : quel est l’indice le plus fiable au club ?'],
    ['P', 5],
    ['Y', 'Le temps de décision et les habitudes de mise.'],
    ['Y', 'Troisième question : avec une image très serrée, tu voles plus ou moins ?'],
    ['P', 5],
    ['Y', 'Plus.'],
    ['J', 'Je vais travailler ma routine.'],
    ['Y', 'Excellente idée. On résume. Un : l’image se dépense en bluffant et se reconstruit en jouant solide. Deux : image serrée, vole plus ; image agressive, mise ta valeur plus gros. Trois : les indices fiables sont le temps de décision et les habitudes de mise. Quatre : une routine identique te rend illisible. À bientôt !']
  ];

  L[29].podcast = [
    ['J', 'Salut Yo ! Le tilt. Ça m’arrive, je l’avoue.'],
    ['Y', 'Salut ! Ça arrive à tout le monde, à moi aussi. Le tilt, c’est une perte de jugement causée par une émotion. Ce n’est pas un défaut de caractère, c’est un mécanisme. Et la bonne nouvelle, c’est qu’un mécanisme, ça se repère et ça s’arrête.'],
    ['J', 'Il y a plusieurs sortes de tilt ?'],
    ['Y', 'Cinq familles. Le tilt d’injustice, après une mauvaise carte : tu étais devant et tu perds à la river. Le tilt de perte : tu veux te refaire. Le tilt de revanche, contre un joueur précis qui t’a battu ou qui t’agace. Le tilt de fatigue, en fin de soirée. Et même le tilt de victoire : après un gros gain, tu te crois invincible et tu joues n’importe quoi.'],
    ['J', 'Le tilt de victoire, je n’y avais jamais pensé.'],
    ['Y', 'Il est sournois, parce qu’on se sent bien. Mais le résultat est le même : tu sors de ta range.'],
    ['J', 'Et comment je le reconnais ?'],
    ['Y', 'Par des signes, qu’il faut connaître à l’avance. Tu joues plus vite. Tu paies des mains que tu jetterais d’habitude. Tu cherches à punir un joueur. Tu sors de ta range sans raison. Note tes trois signes personnels, ceux qui reviennent chez toi. Ce sont tes alarmes.'],
    ['J', 'Et quand l’alarme sonne ?'],
    ['Y', 'Tu as des outils, et ils se préparent à froid. Avant la session : une limite de perte, par exemple trois buy-ins, et une durée maximale. Pendant la session : une pause de cinq minutes dès qu’un signe apparaît. Lève-toi, va boire un verre d’eau, respire. Et avant chaque grosse décision, trois respirations lentes.'],
    ['J', 'Et après ?'],
    ['Y', 'Écris la main qui t’a énervé. Et analyse la décision, pas le résultat. Souvent, tu verras que tu as bien joué et que tu as simplement perdu. Ça désamorce l’injustice. Et ta range est ton garde-fou : si tu t’en écartes sans raison, tu es en tilt. L’appli peut t’aider ici : la saisie des mains du club te dit tout de suite si tu es sorti de ta range.'],
    ['J', 'L’erreur classique ?'],
    ['Y', 'Continuer à jouer pour se refaire après une mauvaise carte. C’est exactement le moment où tes décisions sont les pires. Au club, c’est le joueur qui se réinscrit trois fois de suite et qui pousse son tapis au premier niveau avec as-huit.'],
    ['J', 'Une situation ?'],
    ['Y', 'Tournoi Winamax. Tu as as-as, tu pousses, un joueur paie avec roi-dame et touche la quinte à la river. Tu perds la moitié de ton tapis. Deux mains plus tard, tu es au cut-off avec as-sept dépareillé, et le joueur UTG qui vient de te battre ouvre. Ta tête te dit : « je vais le punir ». Ta range te dit : as-sept dépareillé contre une ouverture UTG, fold. Voilà le moment exact du tilt de revanche. Tu te couches, tu fais trois respirations, et si l’envie ne passe pas, tu te mets en pause sur la table suivante.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : vouloir se refaire après une perte, c’est quel tilt ?'],
    ['P', 5],
    ['Y', 'Un tilt de perte.'],
    ['Y', 'Deuxième question : premier réflexe quand un signe de tilt apparaît ?'],
    ['P', 5],
    ['Y', 'Faire une pause.'],
    ['Y', 'Troisième question : quand fixer sa limite de perte ?'],
    ['P', 5],
    ['Y', 'Avant la session, à froid.'],
    ['J', 'Je vais écrire mes trois signes.'],
    ['Y', 'Fais-le ce soir. On résume. Un : cinq familles de tilt, injustice, perte, revanche, fatigue, victoire. Deux : connais tes trois signes personnels. Trois : limite de perte, pauses et respirations, décidées à froid. Quatre : après la session, analyse la décision, pas le résultat. À bientôt !']
  ];
  L[30].podcast = [
    ['J', 'Salut Yo ! La revue de sessions. Après un tournoi, je repense surtout aux coups que j’ai perdus.'],
    ['Y', 'Salut ! Comme tout le monde. Mais c’est le piège : un gros pot perdu, c’est souvent une mauvaise carte, pas une mauvaise décision. Si tu ne revois que tes pertes, tu juges sur le résultat. L’objectif d’une revue, c’est de transformer chaque session en deux ou trois points de travail précis.'],
    ['J', 'Alors quelles mains je revois ?'],
    ['Y', 'Dans cet ordre. D’abord les mains où tu as hésité : l’hésitation, c’est le signe le plus sûr d’une zone floue. Ensuite les tapis et les gros pots, gagnés ou perdus. Enfin les mains où tu t’es écarté de ta range. Dans l’appli, l’onglet Analyser te les sort déjà : les coups clés, les écarts avec ta range, et tes mains du club.'],
    ['J', 'Et comment je les revois ?'],
    ['Y', 'Avec une grille de quatre questions. Un : quelle était ma range dans ce spot, et ma main en faisait-elle partie ? Deux : que représente l’adversaire avec sa ligne, vu son profil ? Trois : si j’avais vu ses cartes, aurais-je joué autrement, et quel indice aurait dû m’alerter ? Quatre : puis-je dire en une phrase pourquoi j’ai joué ainsi ?'],
    ['J', 'La quatrième me paraît la plus dure.'],
    ['Y', 'C’est la plus révélatrice. Si tu ne peux pas y répondre, c’était un réflexe, pas une décision. Et les réflexes, ça se corrige.'],
    ['J', 'Montre-moi sur une main.'],
    ['Y', 'Prenons une main que tu connais bien. Tu as as-dame en UTG, et tu te couches. Question un : ta range TAG en UTG ouvre as-dame dépareillé. La main en faisait partie. Question deux : personne n’avait encore parlé, il n’y a pas de ligne adverse. Question trois : aucune information contraire. Question quatre : ta raison, c’était « peur d’être relancé ». Ce n’est pas une raison de poker. Point de travail : « ouvrir toute ma range UTG, y compris as-dame dépareillé ». Et la séance du jour le reprendra.'],
    ['J', 'C’est exactement ce qui m’est arrivé.'],
    ['Y', 'Je sais. Et tu vois, l’exercice ne prend que deux minutes. Une autre, avec tes vraies mains Winamax : six-six au bouton face à une ouverture MP, à soixante-quatorze grosses blindes, tu te couches. Ta range paie. Pourquoi tu t’es couché ? Si ta réponse est « je n’aime pas les petites paires », c’est un réflexe. Point de travail : « payer mes paires en position face aux ouvertures du milieu ».'],
    ['J', 'Et le solveur dans tout ça ?'],
    ['Y', 'Le solveur répond à une question précise : est-ce que je m’écarte de l’équilibre ici ? Il ne t’apprend pas les bases. Utilise-le en dernier, sur une décision précise, une fois que tes ranges sont automatiques. Sinon, tu te noies dans des détails à zéro virgule cinq pour cent, alors que tes vraies fuites sont des mains entières jetées par peur.'],
    ['J', 'Et je fais ça après chaque tournoi ?'],
    ['Y', 'Après chaque tournoi ou soirée au club, deux ou trois mains. Pas plus. Note-les le soir même, dans la saisie des mains du club si c’était au club. Le lendemain, à froid, tu fais la grille. Et tu termines toujours par deux ou trois points de travail, pas dix.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : quelles mains revoir en priorité ?'],
    ['P', 5],
    ['Y', 'Celles où tu as hésité.'],
    ['Y', 'Deuxième question : tu ne peux pas dire pourquoi tu as payé. C’était quoi ?'],
    ['P', 5],
    ['Y', 'Un réflexe.'],
    ['Y', 'Troisième question : une revue se termine par quoi ?'],
    ['P', 5],
    ['Y', 'Deux ou trois points de travail.'],
    ['J', 'Je m’y mets dès ce soir.'],
    ['Y', 'Parfait. On résume. Un : revois d’abord les mains où tu as hésité, puis les gros pots, puis les écarts de range. Deux : la grille de quatre questions : ma range, sa ligne, ce que j’aurais fait en voyant ses cartes, ma raison en une phrase. Trois : le solveur en dernier. Quatre : deux ou trois points de travail, pas plus. À bientôt !']
  ];

  L[31].podcast = [
    ['J', 'Salut Yo ! Les mains commentées. Tu me racontes des coups ?'],
    ['Y', 'Salut ! Cinq coups typiques de tournoi, et à chaque fois on les relit en quatre temps : préflop, flop, turn, river. À chaque rue, une seule question : quelle range pour lui, quelle range pour moi ?'],
    ['J', 'Première main.'],
    ['Y', 'Cent grosses blindes, tu es UTG avec as de pique, dame de carreau. Tu ouvres à deux grosses blindes : la main est dans toutes les ranges, même la plus serrée. Le bouton paie. Flop : dame de trèfle, huit de cœur, trois de carreau. Top paire bon kicker, sur un board sec : c-bet d’un tiers du pot. Il paie. Turn : deux de pique, carte blanche. Tu mises deux tiers pour la valeur. River : neuf de trèfle. Un récréatif paie souvent avec une dame plus faible ou un huit : tu mises la moitié du pot.'],
    ['J', 'La leçon ?'],
    ['Y', 'La main qu’on a peur d’ouvrir est une machine à valeur. Si tu l’avais jetée, tu ne gagnais rien de tout ça.'],
    ['J', 'Deuxième main.'],
    ['Y', 'Défense de grosse blinde. Le bouton ouvre à deux grosses blindes, tu as roi de cœur, neuf de carreau. Il te faut vingt-deux pour cent d’équité : tu paies. Flop : neuf de pique, six de cœur, deux de trèfle. Top paire. Tu checkes, il mise un tiers, tu paies. Turn : as de carreau. Mauvaise carte pour toi : elle améliore sa range, il a beaucoup d’as au bouton. Il mise deux tiers. Contre un régulier, tu te couches souvent. Contre un maniac, tu paies.'],
    ['J', 'La leçon ?'],
    ['Y', 'La turn change la hiérarchie. Ta top paire au flop n’est plus qu’une paire moyenne quand un as tombe.'],
    ['J', 'Troisième.'],
    ['Y', 'Blindes cinq cents-mille, ante mille. Tu as douze grosses blindes au cut-off, avec roi-dix de pique. Les tables du chapitre vingt-deux disent tapis : tu pousses. Le bouton paie avec as de cœur, valet de trèfle. Tu as environ quarante et un pour cent. Tu perds parfois. Mais la décision est rentable, parce que la plupart du temps, tout le monde se couche et tu ramasses deux mille cinq cents jetons.'],
    ['J', 'La leçon ?'],
    ['Y', 'À douze grosses blindes, on juge la décision sur l’ensemble des réponses adverses, pas sur cette main-là. Si tu perds ce coup, tu n’as pas mal joué.'],
    ['J', 'Quatrième.'],
    ['Y', 'La bulle, qu’on a vue au chapitre vingt-trois. Quatre joueurs, trois payés, cinquante, trente, vingt euros. Tapis : quarante, quatorze, neuf et vingt et une grosses blindes. Tu as vingt et une en grosse blinde, la petite blinde pousse neuf. Tu as valet de carreau, sept de trèfle : environ quarante-cinq pour cent contre sa range, pour quarante-deux requis. En jetons, tu paies. Avec l’ICM, se coucher vaut vingt-cinq euros cinquante et un, payer vingt-cinq euros dix. Tu te couches.'],
    ['J', 'La leçon ?'],
    ['Y', 'À la bulle avec un tapis moyen, on paie moins.'],
    ['J', 'Et la dernière ?'],
    ['Y', 'Au club. Une calling station limpe, tu isoles à cinq grosses blindes au bouton avec valet de cœur, valet de trèfle. Elle paie. Flop : dix de carreau, sept de pique, trois de trèfle. Tu mises deux tiers. Turn : quatre de cœur. Deux tiers encore. River : deux de carreau. Encore deux tiers. Elle paie les trois rues avec neuf-huit ou une paire de sept : tu as pris le maximum.'],
    ['J', 'La leçon ?'],
    ['Y', 'Contre une station, la valeur se prend en grosses mises sur trois rues. Avec une mise d’un tiers, tu aurais gagné moitié moins.'],
    ['J', 'Le quiz ?'],
    ['Y', 'Première question : main un, pourquoi miser la river avec as-dame sur dame, huit, trois, deux, neuf ?'],
    ['P', 5],
    ['Y', 'Pour la valeur : il paie avec des dames plus faibles et des huit.'],
    ['Y', 'Deuxième question : main trois, tu perds ton tapis avec roi-dix assorti contre as-valet. La décision était bonne ou mauvaise ?'],
    ['P', 5],
    ['Y', 'Bonne, et rentable malgré le résultat.'],
    ['Y', 'Troisième question : main quatre, pourquoi te coucher alors qu’en jetons tu paierais ?'],
    ['P', 5],
    ['Y', 'Parce qu’à la bulle, perdre te coûte plus que gagner ne te rapporte.'],
    ['J', 'J’aime bien ce format.'],
    ['Y', 'Alors fais pareil avec tes propres mains. On résume. Un : relis en quatre temps, préflop, flop, turn, river. Deux : à chaque rue, quelle range pour lui, quelle range pour moi. Trois : on juge la décision, pas le résultat. Quatre : tes mains Winamax et tes mains du club sont dans Analyser, prêtes à être relues. À bientôt !']
  ];

  L[32].podcast = [
    ['J', 'Salut Yo ! Dernier épisode : le plan de progression.'],
    ['Y', 'Salut ! Le dernier, et peut-être le plus important, parce qu’il dit comment transformer tout ce qu’on a vu en réflexes. Une règle d’abord : on progresse par répétition courte et régulière, pas par de longues séances rares. Trois heures de théorie un dimanche, puis plus rien de la semaine, ça ne marche pas. Dix minutes par jour, si.'],
    ['J', 'Pourquoi ?'],
    ['Y', 'Parce que la mémoire retient mieux ce qu’on revoit souvent, à intervalles croissants. C’est la répétition espacée. Dans l’appli, une main ratée revient après un jour, puis trois, puis sept, puis vingt et un. Une décision répétée cent fois devient automatique. À la table, tu n’y penses plus, et tu gardes ton attention pour les coups difficiles.'],
    ['J', 'Et concrètement, ma semaine ?'],
    ['Y', 'Chaque jour : la Séance du jour, dix minutes, depuis l’accueil. Deux fois par semaine : une leçon et son quiz, ou un podcast comme celui-ci. Après chaque tournoi ou soirée au club : la revue de deux ou trois mains, avec la grille du chapitre trente. Et une fois par semaine : un Sit and Go ou un tournoi « Moments clés » dans l’appli, sans le coach, pour mesurer tes progrès.'],
    ['J', 'Et par quoi je commence ?'],
    ['Y', 'Par ordre de priorité. Un : les ranges d’ouverture et de défense, chapitres cinq et six. Ce sont les décisions les plus fréquentes : tu les prends à presque chaque main. Deux : le tapis ou fold, chapitres vingt et un et vingt-deux. Décisif en tournoi. Trois : le flop et la turn, chapitres quatorze et quinze. Quatre : l’ICM et la bulle, chapitre vingt-trois.'],
    ['J', 'Pas le solveur ?'],
    ['Y', 'Le solveur vient bien après. Tant que tu jettes as-dame en UTG par peur, aucun solveur ne t’apportera plus que ta propre range bien apprise.'],
    ['J', 'Et comment je sais que je progresse ?'],
    ['Y', 'Trois indicateurs. Le test de profil, refait chaque mois : il te montre si tu es encore trop serré en début de table ou trop large en fin de table. Tes statistiques dans Analyser, sur tes vraies mains Winamax et du club : VPIP, PFR, vol, défense de grosse blinde, et le nombre d’écarts avec ta range. Et le meilleur de tous : le nombre de fois où tu consultes Ma range pendant tes parties. Quand il tombe à zéro, la range est acquise.'],
    ['J', 'Et si j’ai une mauvaise série ?'],
    ['Y', 'Tu reviens à tes décisions, pas à tes résultats. Tu relis tes mains, tu appliques ta limite de perte, et tu continues la routine. La variance, on l’a vu, peut durer des semaines. Les réflexes, eux, restent.'],
    ['J', 'Un dernier conseil ?'],
    ['Y', 'Joue avec plaisir. Le club, c’est d’abord des gens avec qui on passe de bonnes soirées. Le poker qu’on apprend ici, c’est pour mieux profiter de ces soirées, pas pour les rendre stressantes. Et quand tu doutes, souviens-toi du premier épisode : peu de mains, jouées en relançant.'],
    ['J', 'Le quiz, une dernière fois ?'],
    ['Y', 'Première question : quelle fréquence pour la Séance du jour ?'],
    ['P', 5],
    ['Y', 'Chaque jour, dix minutes.'],
    ['Y', 'Deuxième question : quelle est la première priorité de travail ?'],
    ['P', 5],
    ['Y', 'Les ranges d’ouverture et de défense.'],
    ['Y', 'Troisième question : une main ratée revient après combien de jours ?'],
    ['P', 5],
    ['Y', 'Un, trois, sept et vingt et un jours.'],
    ['J', 'Merci Yo, pour tout le cours.'],
    ['Y', 'Merci à toi. On résume une dernière fois. Un : dix minutes par jour valent mieux qu’une longue séance rare. Deux : priorités, le préflop, le tapis ou fold, le flop et la turn, puis l’ICM. Trois : mesure tes progrès avec le test de profil et tes statistiques. Quatre : quand tu ne consultes plus ta range, elle est acquise. On se retrouve au club. À bientôt !']
  ];

  // assemblage
  var CHAPTERS = PLAN.map(function (c) {
    var o = { n: c[0], part: c[1], title: c[2], page: c[3] }, l = L[c[0]];
    if (l) for (var k in l) o[k] = l[k];
    o.ready = !!l;
    return o;
  });
  window.PA_LESSONS = { PARTS: PARTS, CHAPTERS: CHAPTERS, get: function (n) { return CHAPTERS.filter(function (c) { return c.n === n; })[0]; } };
})();
