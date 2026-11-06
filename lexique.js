/* Poker Academy — lexique : tous les termes du cours, avec définition, exemple et chapitre.
   Chaque terme : { t: nom, a: autres formes reconnues dans les leçons, d: définition, x: exemple, ch: chapitre, nl: ne pas souligner dans les leçons } */
(function () {
  'use strict';
  var T = [
    { t: '3-bet', a: ['3-bet', '3-bets', 'sur-relance', 'sur-relancer'], d: 'La relance d’une ouverture. La grosse blinde compte comme la première mise, l’ouverture comme la deuxième : la relance suivante est la troisième, d’où « 3-bet ». Taille : 3 fois l’ouverture quand tu joueras en position (par exemple au bouton contre le cut-off), 4 fois hors position (depuis la petite ou la grosse blinde).', x: 'Le cut-off ouvre à 2 BB, tu relances à 6,5 BB au bouton : c’est un 3-bet.', ch: 8 },
    { t: '3-bet light', a: ['3-bet light'], d: 'Un 3-bet en bluff, avec une main qui n’est pas assez forte pour la valeur mais qui garde du jeu si on te paie (As assortis, connecteurs assortis).', x: 'A5s au bouton contre une ouverture du cut-off.', ch: 39 },
    { t: '4-bet', a: ['4-bet', '4-bets'], d: 'La relance d’un 3-bet. À 40 BB et moins, le 4-bet est un tapis.', x: 'Tu ouvres à 2 BB, on te 3-bet à 7 BB, tu relances à 16 BB.', ch: 41 },
    { t: '5-bet', a: ['5-bet'], d: 'La relance d’un 4-bet. À 100 BB, c’est presque toujours un tapis.', ch: 41 },
    { t: 'Abattage', a: ['abattage', 'showdown'], d: 'Le moment où les joueurs encore en jeu retournent leurs cartes à la fin du coup pour désigner le gagnant.', ch: 1 },
    { t: 'Agresseur', a: ['agresseur'], d: 'Le dernier joueur à avoir misé ou relancé. L’agresseur avant le flop a l’initiative au flop.', ch: 14 },
    { t: 'All-in', a: ['all-in'], d: 'Miser tous ses jetons. Voir « Tapis ».', ch: 1 },
    { t: 'Ante', a: ['ante', 'antes'], d: 'Mise obligatoire en plus des blindes. En ligne, c’est souvent l’« ante de grosse blinde » : la grosse blinde paie 1 BB pour toute la table. Le pot de départ grossit, donc on vole et on défend plus large.', x: 'Avec l’ante de grosse blinde, il y a 2,5 BB au milieu avant toute action.', ch: 6 },
    { t: 'Arc-en-ciel', a: ['arc-en-ciel', 'rainbow'], d: 'Un flop de trois couleurs différentes : aucun tirage couleur n’est possible au flop.', x: 'K♠ 8♥ 3♦.', ch: 11 },
    { t: 'Assortie', a: ['assortie', 'assorties', 'assorti', 'assortis', 'suited'], d: 'Deux cartes de la même couleur. Notée « s » (AKs). Une main assortie compte 4 combinaisons.', x: 'A♥ 5♥ = A5s.', ch: 1 },
    { t: 'Avantage de nuts', a: ['avantage de nuts', 'avantage des nuts'], d: 'Sur un tableau donné, tu as plus de très grosses mains (brelans, quintes, overpaires) que l’adversaire. Il permet de miser gros.', x: 'Overpaire sur un flop bas après un 3-bet.', ch: 42 },
    { t: 'Avantage de range', a: ['avantage de range'], d: 'Sur un tableau donné, ta range contient en moyenne de meilleures mains que celle de l’adversaire. Il permet de miser souvent et petit.', x: 'L’ouvreur sur A♠ 7♦ 2♣ contre la grosse blinde.', ch: 42 },
    { t: 'Bankroll', a: ['bankroll'], d: 'L’argent réservé au poker. La gérer, c’est choisir des tournois dont l’entrée ne représente qu’une petite part de cette somme, pour encaisser la variance.', ch: 4 },
    { t: 'Barrel', a: ['barrel', 'barrels', 'double barrel', 'triple barrel'], d: 'Miser à nouveau sur la rue suivante, après avoir déjà misé. Double barrel : flop puis turn. Triple barrel : flop, turn et river. Chaque mise a besoin d’une raison : la valeur, ou un bluff qui garde de l’équité. Le triple barrel est polarisé (très grosses mains et bluffs).', x: 'Bouton contre grosse blinde sur A♠ 7♦ 2♣, turn K♥, river 3♦ : après deux mises payées, le bouton fait tapis 41 % du temps à la river, avec ses doubles paires, ses brelans et la moitié de ses mains sans rien.', ch: 46 },
    { t: 'Blindes', a: ['blindes', 'blinde'], d: 'Les deux mises obligatoires posées avant la distribution par les deux joueurs à gauche du bouton : la petite blinde et la grosse blinde.', ch: 2, nl: 1 },
    { t: 'Bloqueur', a: ['bloqueur', 'bloqueurs', 'blocker', 'blockers'], d: 'Une carte de ta main qui rend certaines mains adverses moins probables, puisqu’elle n’est plus dans le paquet.', x: 'Avec A5s, ton as rend AA et AK moins probables chez l’adversaire : bon 3-bet ou 4-bet en bluff.', ch: 12 },
    { t: 'Bluff', a: ['bluff', 'bluffs', 'bluffer'], d: 'Miser ou relancer avec une main faible pour faire coucher de meilleures mains. Un bluff de la moitié du pot doit réussir plus d’une fois sur trois.', ch: 16 },
    { t: 'Bluff catcher', a: ['bluff catcher'], d: 'Une main qui ne bat que les bluffs de l’adversaire. Elle sert à payer, pas à miser.', ch: 16 },
    { t: 'Board', a: ['board', 'boards'], d: 'Les cartes communes au centre de la table. Voir « Tableau ».', ch: 11 },
    { t: 'Bouton (BTN)', a: ['bouton', 'BTN'], d: 'La place du donneur, juste à droite de la petite blinde. Avant le flop, il parle juste avant les deux blindes ; après le flop, toujours en dernier : il est en position contre tous les autres joueurs. C’est la meilleure place de la table et celle d’où l’on ouvre le plus large.', ch: 2 },
    { t: 'Brelan', a: ['brelan', 'brelans'], d: 'Trois cartes de même valeur. Avec une paire en main et une carte du tableau, on parle de « set », très bien caché.', x: '7♠ 7♦ sur un flop K♣ 7♥ 2♦.', ch: 11 },
    { t: 'Bulle', a: ['bulle'], d: 'Le moment d’un tournoi où il reste un joueur de plus que le nombre de places payées. L’ICM pèse alors le plus.', ch: 23 },
    { t: 'Buy-in', a: ['buy-in'], d: 'Le prix d’entrée d’un tournoi.', ch: 4 },
    { t: 'C-bet', a: ['c-bet', 'c-bets', 'mise de continuation'], d: 'Mise de continuation : l’agresseur d’avant le flop mise au flop.', ch: 14 },
    { t: 'C-bet retardé', a: ['c-bet retardé'], d: 'L’agresseur d’avant le flop checke le flop, puis mise la turn. En position (par exemple au bouton contre la grosse blinde) : il checke derrière au flop, l’adversaire checke la turn, il mise. Hors position : il checke le flop, l’adversaire checke derrière, il mise la turn en premier.', ch: 43 },
    { t: 'Calling station', a: ['calling station', 'station'], d: 'Un joueur qui paie beaucoup trop et se couche rarement. On ne le bluffe pas : on le fait payer avec nos bonnes mains.', ch: 26 },
    { t: 'Check', a: ['check', 'checker', 'checke', 'checkes'], d: 'Parler sans miser quand personne n’a encore misé sur cette rue.', ch: 1, nl: 1 },
    { t: 'Check-call', a: ['check-call'], d: 'Checker, puis payer la mise de l’adversaire.', ch: 17 },
    { t: 'Check-raise', a: ['check-raise', 'check-raises'], d: 'Checker, puis relancer la mise de l’adversaire. Il se joue hors position, surtout en grosse blinde face au c-bet de l’ouvreur. Avec des mains très fortes et des tirages qui ont des outs, jamais avec rien.', ch: 44 },
    { t: 'Click back', a: ['click back'], d: 'Une sur-relance du montant minimum : face à une mise de 1 000, tu relances à 2 000. Elle coûte peu mais offre une très bonne cote à l’adversaire.', ch: 9 },
    { t: 'Cold call', a: ['cold call', 'cold calls'], d: 'Payer une relance alors que tu n’as encore rien mis dans le pot. Il se joue surtout au bouton, la seule place sûre d’être en position contre tout le monde après le flop.', x: 'Le cut-off ouvre à 2 BB, tu paies au bouton au lieu de relancer.', ch: 41 },
    { t: 'Combinaison', a: ['combinaison', 'combinaisons', 'combo', 'combos'], d: 'Une façon précise d’avoir une main. Une paire compte 6 combinaisons, une main assortie 4, une main dépareillée 12. Les cartes du tableau en retirent.', x: 'AK = 16 combinaisons ; sur un roi au flop, il n’en reste que 12.', ch: 12 },
    { t: 'Connecteurs', a: ['connecteurs', 'connecteur'], d: 'Deux cartes qui se suivent, idéalement assorties (87s, 65s). Elles font des quintes et des couleurs bien cachées.', ch: 5 },
    { t: 'Cote du pot', a: ['cote du pot'], d: 'Le rapport entre ce que tu dois payer et le pot final. Équité nécessaire = ce que tu paies ÷ (pot + mise adverse + ce que tu paies).', x: 'Pot de 10 BB, il mise 5 BB : 5 ÷ 20 = 25 % d’équité suffisent.', ch: 10 },
    { t: 'Cotes implicites', a: ['cotes implicites', 'implied odds'], d: 'Les jetons que tu peux encore gagner sur les rues suivantes si tu touches. Elles justifient de payer un peu plus cher avec des petites paires ou des tirages bien cachés.', ch: 10 },
    { t: 'Couleur', a: [], d: 'Cinq cartes de la même couleur (pique, cœur, carreau ou trèfle).', ch: 1, nl: 1 },
    { t: 'Cut-off (CO)', a: ['cut-off', 'CO'], d: 'La place juste à droite du bouton. Après le flop, seul le bouton parle après lui : le cut-off est en position contre tout le monde sauf le bouton. Deuxième meilleure place pour ouvrir.', ch: 2 },
    { t: 'Défense minimale', a: ['défense minimale', 'MDF'], d: 'La part minimale de ta range à garder face à une mise pour que l’adversaire ne gagne pas d’argent en bluffant avec n’importe quoi : pot ÷ (pot + mise).', x: 'Face à une mise de la moitié du pot : 67 %.', ch: 42 },
    { t: 'Dépareillée', a: ['dépareillée', 'dépareillées', 'dépareillé', 'offsuit'], d: 'Deux cartes de couleurs différentes. Notée « o » (AKo). Une main dépareillée compte 12 combinaisons.', ch: 1 },
    { t: 'Donk bet', a: ['donk bet', 'donk'], d: 'Miser en premier, donc hors position, vers le joueur qui avait l’initiative au tour précédent, au lieu de checker vers lui. Rare au flop, plus utile à la turn.', x: 'Le bouton ouvre, tu paies en grosse blinde et tu mises le flop avant qu’il ait pu faire son c-bet.', ch: 43 },
    { t: 'Équité', a: ['équité', 'équités'], d: 'Ta part du pot si toutes les cartes restantes étaient distribuées : en gros, ta probabilité de gagner le coup.', x: 'Un tirage couleur au flop a environ 35 % d’équité contre une paire.', ch: 10 },
    { t: 'En position (IP)', a: ['en position'], d: 'Après le flop, tu parles après ton adversaire, sur le flop, la turn et la river : tu vois ce qu’il fait avant de décider. Ça se compare entre les joueurs encore dans le coup. Ordre de parole après le flop : petite blinde, grosse blinde, UTG, UTG+1, middle position, lojack, hijack, cut-off, bouton. Le bouton est donc en position contre tout le monde ; le cut-off contre tout le monde sauf le bouton ; le hijack contre tout le monde sauf le cut-off et le bouton, et ainsi de suite. Les blindes ne sont jamais en position, sauf la grosse blinde contre la petite blinde. En heads-up, le bouton est aussi la petite blinde : il parle en premier avant le flop et en dernier après.', x: 'Le cut-off ouvre et tu paies au bouton : tu joueras en position. Tu paies le même cut-off depuis la grosse blinde : tu joueras hors position.', ch: 2 },
    { t: 'EV (espérance)', a: ['EV', 'espérance'], d: 'Le gain moyen d’une décision si on la répétait un très grand nombre de fois. Une décision « +EV » rapporte en moyenne, même si elle perd ce coup-ci.', ch: 10 },
    { t: 'Exploiter', a: ['exploiter', 'exploitant'], d: 'S’écarter de la stratégie équilibrée pour profiter d’une erreur précise de l’adversaire (il se couche trop, il paie trop…).', ch: 27 },
    { t: 'Flop', a: [], d: 'Les trois premières cartes communes, retournées ensemble. C’est aussi le nom du tour d’enchères qui suit.', ch: 1, nl: 1 },
    { t: 'Float', a: ['float', 'floater'], d: 'Payer une mise en position avec une main faible, pour prendre le pot plus tard quand l’adversaire abandonne. Typiquement au bouton ou au cut-off, contre le c-bet d’un joueur qui parle avant toi après le flop. Jamais contre une calling station.', x: 'Le hijack ouvre, tu paies au bouton. Il mise un tiers du pot sur K♠ 8♦ 3♣, tu paies avec 6♥ 5♥ ; il checke la turn, tu mises.', ch: 43 },
    { t: 'Fold', a: ['fold'], d: 'Se coucher : abandonner le coup et les jetons déjà mis.', ch: 1, nl: 1 },
    { t: 'Fold equity', a: ['fold equity'], d: 'Ce que te rapportent les fois où l’adversaire se couche face à ta mise ou ton tapis. Elle s’ajoute à ton équité quand tu es payé.', ch: 21 },
    { t: 'Full', a: [], d: 'Un brelan et une paire (« main pleine »).', x: 'K K K 7 7.', ch: 1, nl: 1 },
    { t: 'GTO', a: ['GTO'], d: 'La stratégie théorique équilibrée, impossible à exploiter, que calcule un solveur. Elle sert de référence ; contre des joueurs qui font des erreurs, on s’en écarte pour les exploiter.', ch: 35 },
    { t: 'Grosse blinde (BB)', a: ['grosse blinde', 'BB'], d: 'La plus grosse des deux mises obligatoires, posée par le joueur à gauche de la petite blinde. Avant le flop, elle parle en dernier ; après le flop, juste après la petite blinde : en position seulement contre la petite blinde. Elle sert aussi d’unité pour mesurer les tapis et les mises.', x: '« 40 BB » = un tapis de 40 grosses blindes.', ch: 2 },
    { t: 'Heads-up', a: ['heads-up'], d: 'Un coup ou une fin de tournoi à deux joueurs seulement.', ch: 36 },
    { t: 'Hijack (HJ)', a: ['hijack', 'HJ'], d: 'La place deux sièges à droite du bouton, entre le lojack et le cut-off. Après le flop, en position contre les blindes, UTG, UTG+1, la middle position et le lojack ; hors position contre le cut-off et le bouton.', ch: 2 },
    { t: 'Hors position (OOP)', a: ['hors position', 'hors de position'], d: 'Après le flop, tu parles avant ton adversaire : tu dois décider sans savoir ce qu’il va faire. Ordre de parole après le flop : petite blinde, grosse blinde, UTG, UTG+1, middle position, lojack, hijack, cut-off, bouton. La petite blinde est hors position contre tout le monde, y compris la grosse blinde ; la grosse blinde contre tout le monde sauf la petite blinde ; UTG contre tous les joueurs sauf les blindes ; le cut-off seulement contre le bouton.', x: 'Tu ouvres au hijack et le bouton paie : tu joues le flop hors position.', ch: 2 },
    { t: 'ICM', a: ['ICM'], d: 'Independent Chip Model : le calcul qui convertit les tapis en argent. En fin de tournoi, perdre des jetons coûte plus que d’en gagner ne rapporte : on paie les tapis plus serré.', ch: 23 },
    { t: 'Initiative', a: ['initiative'], d: 'L’avantage du dernier agresseur (en général l’ouvreur ou le 3-bettor) : c’est lui que l’on attend à la mise, et sa mise est plus crédible. Elle ne dépend pas de la position : l’ouvreur du cut-off garde l’initiative même hors position contre le bouton.', ch: 14 },
    { t: 'Isolement', a: ['isolement', 'isoler', 'iso-raise', 'iso-shove'], d: 'Relancer un ou plusieurs limpers pour jouer seul contre le plus faible. Taille : 3 BB quand tu joueras en position (du hijack, du cut-off ou du bouton, après le limper), 4 BB depuis les blindes (hors position), plus 1 BB par limper.', x: 'Deux limpers, tu es au bouton : 3 + 2 = 5 BB. Un limper, tu es en grosse blinde : 4 + 1 = 5 BB.', ch: 7 },
    { t: 'Kicker', a: ['kicker', 'kickers'], d: 'La carte d’accompagnement qui départage deux mains de même force.', x: 'Sur A♠ 7♦ 2♣, AK bat AQ grâce au kicker roi.', ch: 12 },
    { t: 'LAG', a: ['LAG', 'LAGs'], d: 'Loose-aggressive : un joueur large et agressif, qui joue beaucoup de mains et relance souvent.', ch: 26 },
    { t: 'Limp', a: ['limp', 'limper', 'limpers', 'limpe', 'limpes'], d: 'Entrer dans le coup en payant juste la grosse blinde, sans relancer. Limper à son tour derrière un limper : voir over-limp.', ch: 7 },
    { t: 'Limp-shove', a: ['limp-shove'], d: 'Limper avec une très grosse main pour faire tapis sur la relance d’un adversaire. Rare, et lisible si tu ne limpes jamais autrement.', ch: 34 },
    { t: 'Limp-trap', a: ['limp-trap'], d: 'Limper avec une très grosse main (AA, KK) pour piéger un joueur qui relance les limpers.', ch: 34 },
    { t: 'Linéaire (range)', a: ['linéaire', 'linéaires'], d: 'Une range qui contient les meilleures mains dans l’ordre, sans trou. Le 3-bet linéaire se joue depuis la petite blinde, hors position contre tout le monde, et contre les joueurs qui paient trop.', ch: 39 },
    { t: 'Lojack (LJ)', a: ['lojack', 'LJ'], d: 'La place trois sièges à droite du bouton, entre la middle position et le hijack. Après le flop, hors position contre le hijack, le cut-off et le bouton ; en position contre les places avant lui et contre les blindes. À 6 joueurs, c’est la première à parler (on l’appelle parfois UTG).', ch: 2 },
    { t: 'M de Harrington', a: ['M de Harrington'], d: 'Ton tapis divisé par le coût d’un tour de table (blindes et antes). Il dit combien de tours tu peux attendre sans jouer.', x: 'Avec l’ante de grosse blinde, 30 BB ÷ 2,5 = M de 12.', ch: 20 },
    { t: 'Maniac', a: ['maniac', 'maniacs'], d: 'Un joueur qui relance et bluffe presque tout le temps. On le laisse miser et on paie plus large.', ch: 26 },
    { t: 'Mise sonde', a: ['mise sonde', 'mises sondes', 'probe bet'], d: 'Miser la turn hors position, en premier, après que l’ouvreur a checké le flop derrière toi.', x: 'Le bouton ouvre, tu paies en grosse blinde. Flop checké des deux côtés ; à la turn, tu mises avant lui.', ch: 43 },
    { t: 'Monocolore', a: ['monocolore', 'monotone'], d: 'Un flop de trois cartes de la même couleur. Ralentis si tu n’as pas la couleur.', ch: 11 },
    { t: 'MTT', a: ['MTT'], d: 'Multi-table tournament : un tournoi sur plusieurs tables, avec des blindes qui montent et des places payées.', ch: 2 },
    { t: 'Multiway', a: ['multiway'], d: 'Un pot joué à trois joueurs ou plus. On y bluffe beaucoup moins.', ch: 18 },
    { t: 'Nit', a: ['nit', 'nits'], d: 'Un joueur très serré, qui ne joue que les meilleures mains. Ses relances sont presque toujours fortes ; on lui vole ses blindes.', ch: 26 },
    { t: 'Nuts', a: ['nuts'], d: 'La meilleure main possible sur le tableau à ce moment-là.', ch: 11 },
    { t: 'Ouverture', a: ['ouverture', 'ouvertures', 'ouvrir', 'ouvreur'], d: 'La première relance avant le flop, quand tout le monde s’est couché devant toi. Au club : 2 BB, 3 BB depuis la petite blinde.', ch: 5 },
    { t: 'Outs', a: ['outs'], d: 'Les cartes qui transforment ta main en main gagnante. Règle du 4 au flop (deux cartes à venir) et du 2 à la turn pour estimer ton équité.', x: 'Tirage couleur : 9 outs, environ 35 % au flop, 18 % à la turn.', ch: 10 },
    { t: 'Overbet', a: ['overbet', 'surmise'], d: 'Une mise plus grosse que le pot. Elle se joue avec l’avantage des nuts.', ch: 15 },
    { t: 'Overcard', a: ['overcard', 'overcards'], d: 'Une carte plus haute que toutes celles du tableau (ou que ta paire).', x: 'AK sur 9♠ 6♦ 2♣ : deux overcards.', ch: 10 },
    { t: 'Overpaire', a: ['overpaire', 'overpaires'], d: 'Une paire en main plus haute que toutes les cartes du tableau.', x: 'QQ sur J♠ 7♦ 3♣.', ch: 33 },
    { t: 'Paire servie', a: ['paire servie', 'paires servies'], d: 'Une paire reçue directement dans tes deux cartes (6 combinaisons).', ch: 12 },
    { t: 'Palier', a: ['palier', 'paliers'], d: 'Une marche de gains dans un tournoi : chaque élimination peut faire monter tout le monde au palier suivant. Près d’un palier, l’ICM pousse à la prudence.', ch: 19 },
    { t: 'Petite blinde (SB)', a: ['petite blinde', 'SB'], d: 'La mise obligatoire de la moitié de la grosse blinde, posée par le joueur juste à gauche du bouton. Avant le flop, elle parle avant-dernière ; après le flop, toujours en premier : hors position contre tous les joueurs, grosse blinde comprise. D’où l’ouverture à 3 BB et le « 3-bet ou couche » depuis cette place.', ch: 2 },
    { t: 'PFR', a: ['PFR'], d: 'Statistique : la part des mains où un joueur relance avant le flop. Mesure son agressivité. L’écart avec le VPIP mesure sa passivité.', ch: 26 },
    { t: 'PKO', a: ['PKO'], d: 'Progressive knock-out : un tournoi où chaque joueur a une prime. Quand tu élimines quelqu’un, tu gagnes une partie de sa prime et le reste s’ajoute à la tienne.', ch: 25 },
    { t: 'Polarisée (range)', a: ['polarisé', 'polarisée', 'polarisés', 'polarisées'], d: 'Une range faite de mains très fortes et de bluffs, sans les mains moyennes. Le 3-bet polarisé se joue surtout en position, au cut-off ou au bouton face à une ouverture plus tôt, et depuis la grosse blinde.', ch: 39 },
    { t: 'Position', a: ['position', 'positions'], d: 'Ta place à la table par rapport au bouton : elle fixe l’ordre de parole. Avant le flop, à 9 joueurs : UTG, UTG+1, middle position, lojack, hijack, cut-off, bouton, petite blinde, grosse blinde. Après le flop : petite blinde, grosse blinde, UTG, UTG+1, middle position, lojack, hijack, cut-off, bouton. Plus tu parles tard après le flop, mieux c’est. Avec moins de joueurs, on retire les premières places : à 6, il reste lojack, hijack, cut-off, bouton et les deux blindes.', x: 'Début de table : UTG, UTG+1, middle position. Milieu : lojack, hijack. Fin de table : cut-off, bouton.', ch: 2 },
    { t: 'Pot', a: [], d: 'Les jetons misés au centre de la table, que remporte le gagnant du coup.', ch: 1, nl: 1 },
    { t: 'Pot 3-bet', a: ['pot 3-bet', 'pots 3-bet'], d: 'Un pot où il y a eu un 3-bet avant le flop. Les tapis sont plus courts par rapport au pot (SPR bas) : on s’engage plus vite avec top paire.', ch: 17 },
    { t: 'Push/fold', a: ['push/fold', 'push-fold'], d: 'Avec un petit tapis (moins de 15 BB environ), on ne joue plus qu’à tapis ou couché, selon les tables du chapitre 22.', ch: 22 },
    { t: 'Quinte', a: ['quinte', 'quintes'], d: 'Cinq cartes qui se suivent, de couleurs quelconques.', x: '9 8 7 6 5.', ch: 1 },
    { t: 'Quinte ventrale', a: ['quinte ventrale', 'tirage quinte ventral', 'gutshot'], d: 'Un tirage quinte qui n’attend qu’une seule valeur de carte, au milieu : 4 outs.', x: '9 8 sur 7 5 2 : seul un 6 fait la quinte.', ch: 10 },
    { t: 'Quinte par les deux bouts', a: ['par les deux bouts'], d: 'Un tirage quinte ouvert des deux côtés : 8 outs.', x: '9 8 sur 7 6 2 : un 10 ou un 5 fait la quinte.', ch: 10 },
    { t: 'Range', a: ['range', 'ranges'], d: 'L’ensemble des mains qu’un joueur peut avoir dans une situation donnée. On raisonne contre une range, pas contre une main précise.', ch: 5 },
    { t: 'Re-shove', a: ['re-shove'], d: 'Faire tapis directement sur l’ouverture d’un adversaire, avec 15 à 30 BB. Contre un voleur du cut-off, du bouton ou de la petite blinde, c’est un resteal à tapis.', x: 'Le bouton ouvre à 2 BB, tu fais tapis avec 18 BB en grosse blinde avec A9s.', ch: 21 },
    { t: 'Récréatif', a: ['récréatif', 'récréatifs', 'récréative'], d: 'Un joueur occasionnel, qui joue pour le plaisir : il joue trop de mains et paie trop. On le fait payer avec nos bonnes mains.', ch: 27 },
    { t: 'Régulier', a: ['régulier', 'réguliers', 'reg', 'regs'], d: 'Un joueur habitué et sérieux, qui connaît les bases et s’adapte.', ch: 26 },
    { t: 'Relance', a: ['relance', 'relancer', 'raise'], d: 'Augmenter la mise en cours. Avant le flop, la première relance s’appelle l’ouverture.', ch: 1, nl: 1 },
    { t: 'River', a: [], d: 'La cinquième et dernière carte commune, et le dernier tour d’enchères.', ch: 1, nl: 1 },
    { t: 'Rue', a: ['rue', 'rues'], d: 'Un tour d’enchères : avant le flop, flop, turn et river.', ch: 1 },
    { t: 'Semi-bluff', a: ['semi-bluff', 'semi-bluffs'], d: 'Un bluff avec un tirage : tu gagnes si l’adversaire se couche, et tu peux encore toucher s’il paie.', ch: 14 },
    { t: 'Sit & Go', a: ['Sit & Go', 'SNG'], d: 'Un tournoi qui démarre dès que toutes les places sont prises, souvent sur une seule table.', ch: 2 },
    { t: 'Sizing', a: ['sizing', 'taille de mise'], d: 'La taille d’une mise, exprimée par rapport au pot (un tiers, la moitié, deux tiers…).', ch: 13 },
    { t: 'Slowplay', a: ['slowplay', 'slowplayer'], d: 'Jouer lentement (checker, payer) une très grosse main pour laisser l’adversaire miser ou toucher. Seulement sur tableau sec quand tu bloques tout.', ch: 44 },
    { t: 'Solveur', a: ['solveur', 'solver'], d: 'Un programme qui calcule la stratégie équilibrée d’un coup. Celui de l’appli a calculé plus de 1 000 flops.', ch: 35 },
    { t: 'Space KO', a: ['Space KO'], d: 'Variante de tournoi à primes où la valeur de la prime est tirée au sort au moment de l’élimination : on raisonne avec la valeur moyenne.', ch: 25 },
    { t: 'SPR', a: ['SPR'], d: 'Stack-to-pot ratio : le tapis effectif divisé par le pot au flop. Bas (moins de 4) : on s’engage avec top paire. Haut : prudence avec une paire.', ch: 17 },
    { t: 'Squeeze', a: ['squeeze', 'squeezer', 'squeezes'], d: 'Un 3-bet face à une ouverture et au moins un payeur. L’argent mort le rend très rentable. Taille : 4 fois l’ouverture plus 1 BB par payeur.', ch: 40 },
    { t: 'Stop-and-go', a: ['stop-and-go'], d: 'Payer un 3-bet hors position avec un petit tapis (10 à 15 BB), puis faire tapis au flop quoi qu’il arrive.', ch: 21 },
    { t: 'Tableau', a: ['tableau', 'tableaux'], d: 'Les cartes communes : le flop, la turn et la river. Sa texture dit qui il favorise.', ch: 11, nl: 1 },
    { t: 'Tableau sec / humide', a: ['tableau sec', 'tableaux secs', 'tableau humide', 'tableaux humides', 'board sec', 'board connecté'], d: 'Sec : peu de tirages possibles (K♠ 7♦ 2♣). Humide ou connecté : beaucoup de tirages (J♥ 10♥ 9♣).', ch: 11 },
    { t: 'TAG', a: ['TAG'], d: 'Tight-aggressive (serré-agressif) : peu de mains, mais jouées en relançant. C’est le profil de référence de l’appli.', ch: 26 },
    { t: 'Tapis', a: ['tapis', 'faire tapis', 'shove'], d: 'Les jetons d’un joueur. « Faire tapis » : miser tous ses jetons.', ch: 1, nl: 1 },
    { t: 'Tapis effectif', a: ['tapis effectif'], d: 'Le plus petit des tapis des joueurs dans le coup : c’est lui qui compte, car on ne peut pas perdre plus.', ch: 17 },
    { t: 'Tilt', a: ['tilt'], d: 'Jouer moins bien sous le coup de l’émotion (colère après un mauvais coup, envie de se refaire).', ch: 29 },
    { t: 'Tirage', a: ['tirage', 'tirages'], d: 'Une main pas encore faite, qui peut devenir une couleur ou une quinte avec les cartes à venir.', ch: 10 },
    { t: 'Top paire', a: ['top paire'], d: 'Une paire avec la plus haute carte du tableau.', x: 'K♠ 10♦ sur K♦ 8♠ 3♣.', ch: 12 },
    { t: 'Turn', a: [], d: 'La quatrième carte commune, et le tour d’enchères qui suit.', ch: 1, nl: 1 },
    { t: 'UTG+1', a: ['UTG+1'], d: 'La place juste à gauche d’UTG, deuxième à parler avant le flop. Après le flop, elle n’est en position que contre les blindes et UTG. On y ouvre presque aussi serré qu’UTG.', ch: 2 },
    { t: 'Middle position (MP)', a: ['middle position', 'MP', 'UTG+2'], d: 'La place à gauche d’UTG+1 (aussi appelée UTG+2), entre UTG+1 et le lojack, quatre places à droite du bouton. Après le flop, elle est hors position contre le lojack, le hijack, le cut-off et le bouton.', ch: 2 },
    { t: 'UTG', a: ['UTG'], d: 'Under the gun : la place juste à gauche de la grosse blinde, la première à parler avant le flop. Après le flop, elle parle juste après les deux blindes : hors position contre tous les autres joueurs. C’est la place la plus difficile : on y ouvre le plus serré.', ch: 2 },
    { t: 'Valeur', a: ['pour la valeur', 'en valeur', 'mise de valeur'], d: 'Miser pour être payé par une main moins bonne que la tienne.', ch: 16 },
    { t: 'Variance', a: ['variance'], d: 'L’écart entre tes résultats et ce que tu mérites, dû au hasard des cartes. Elle est énorme en tournoi : on juge ses décisions, pas ses résultats.', ch: 4 },
    { t: 'Vol de blindes', a: ['vol de blindes', 'voler', 'voleur', 'voleurs'], d: 'Ouvrir depuis le cut-off, le bouton ou la petite blinde surtout pour gagner les blindes et l’ante quand tout le monde se couche. Au cut-off et au bouton, tu joueras en position contre les blindes si elles paient ; depuis la petite blinde, tu seras hors position contre la grosse blinde.', ch: 37 },
    { t: 'VPIP', a: ['VPIP'], d: 'Statistique : la part des mains où un joueur met volontairement des jetons avant le flop. Mesure la largeur de son jeu.', ch: 26 },
    { t: 'Open shove', a: ['open shove', 'open shoves', 'ouvrir à tapis', 'ouverture à tapis'], d: 'Ouvrir directement à tapis, quand tout le monde s’est couché avant toi. Le coup normal sous 12 à 15 BB, surtout du cut-off, du bouton et de la petite blinde : une ouverture à 2 BB engagerait trop de ton tapis pour pouvoir te coucher ensuite.', x: 'À 8 BB, les tables du chapitre 22 font pousser 19 % des mains UTG, 36 % au cut-off, 48 % au bouton et 78 % en petite blinde.', ch: 45 },
    { t: 'Resteal', a: ['resteal', 'resteals', 're-vol'], d: 'Relancer un joueur qui ouvre pour voler les blindes (au cut-off, au bouton ou en petite blinde), pour lui reprendre le pot. Avec 15 à 25 BB, à tapis ; plus profond, c’est un 3-bet, souvent light.', x: 'Le bouton ouvre à 2 BB, tu as 15 BB en grosse blinde : tapis avec 44+, A9s+, KTs+, QJs, ATo+, KQo.', ch: 45 },
    { t: 'Cold 4-bet', a: ['cold 4-bet', 'cold 4-bets'], d: 'Un 4-bet fait par un joueur qui n’avait encore rien mis au pot : un joueur ouvre, un autre fait un 3-bet, et toi tu relances. Range très serrée (QQ+, AK), environ 2,5 fois le 3-bet hors position, 2,2 fois en position.', x: 'Le cut-off ouvre à 2 BB, le bouton relance à 6,5 BB, tu relances à 16 BB en petite blinde avec KK.', ch: 45 },
    { t: 'Compléter', a: ['compléter en petite blinde'], d: 'En petite blinde, quand tout le monde s’est couché, mettre seulement 0,5 BB de plus pour égaliser la grosse blinde, sans relancer. Le prix est bon (environ 17 % d’équité avec l’ante de grosse blinde), mais tu joues hors position et la grosse blinde peut relancer.', x: 'Contre une grosse blinde passive, tu complètes avec T6s ou 33.', ch: 45, nl: 1 },
    { t: 'Over-limp', a: ['over-limp', 'over-limper', 'sur-limper', 'sur-limpe'], d: 'Limper derrière un joueur qui a déjà limpé, au lieu de l’isoler. Avec les petites paires et les connecteurs assortis, de préférence en position (cut-off, bouton). Les mains fortes isolent.', x: 'Un joueur limpe UTG, tu paies 1 BB au bouton avec 6♠ 5♠.', ch: 45 },
    { t: 'Min-raise', a: ['min-raise', 'min-raises', 'relance minimum'], d: 'Relancer du minimum : 2 BB à l’ouverture (l’ouverture du club). Le vol coûte peu (il suffit que tout le monde se couche 44 % du temps avec l’ante de grosse blinde), mais la grosse blinde reçoit une bonne cote et défend large. En retour d’une relance, on parle de click back.', ch: 45 },
    { t: 'Flat call', a: ['flat call', 'flat calls', 'flat'], d: 'Payer simplement une relance au lieu de relancer, en particulier payer un 3-bet au lieu de 4-bet. Surtout en position, avec des mains qui jouent bien après le flop ; rarement sous 40 BB.', x: 'Au bouton, on te 3-bet depuis la grosse blinde : tu paies avec 99, AQs ou JTs.', ch: 45 },
    { t: 'Check derrière', a: ['check derrière', 'checker derrière', 'checke derrière', 'checkes derrière', 'check back'], d: 'Checker quand tu es le dernier à parler, après le check de l’adversaire : la carte suivante arrive gratuitement. Un choix normal avec les mains qui gagnent au check sans se faire payer par pire.', x: 'Au bouton sur K♦ 8♠ 3♣, le solveur checke 41 % du temps, et 62 % avec seulement la hauteur as.', ch: 46 },
    { t: 'Range bet', a: ['range bet', 'range bets'], d: 'Miser avec toute sa range, petit, sans choisir main par main. Seulement avec un gros avantage de range, quand l’adversaire a peu de mains qui supportent la mise.', x: 'En pot 3-bet, la grosse blinde mise 99 % du temps sur A♠ 7♦ 2♣, presque toujours un tiers du pot.', ch: 46 },
    { t: 'Relance du c-bet', a: ['relancer le c-bet', 'relance le c-bet', 'relances le c-bet', 'relance du c-bet'], d: 'Relancer la mise de continuation de l’ouvreur. Hors position (en petite ou grosse blinde), c’est un check-raise ; en position (cut-off, bouton), une relance directe. Avec la valeur et les semi-bluffs ; les mains moyennes paient. Taille : environ 3 fois la mise.', x: 'Le hijack ouvre, tu paies au bouton ; sur K♦ 8♠ 3♣, il mise un tiers du pot : le solveur relance 19 % du temps.', ch: 46 },
    { t: 'Sizing géométrique', a: ['sizing géométrique', 'mise géométrique', 'mises géométriques'], d: 'Miser la même fraction du pot à chaque rue pour arriver exactement à tapis à la river. Plus le tapis est petit par rapport au pot (SPR bas), plus les mises sont petites.', x: 'Pot de 5,5 BB, 38 BB derrière : trois mises d’environ 73 % du pot. En deux mises seulement, 142 % du pot.', ch: 46 },
    { t: 'Contrôle du pot', a: ['contrôle du pot', 'contrôler le pot', 'contrôles le pot'], d: 'Checker une rue avec une main moyenne pour garder le pot petit : elle gagne souvent à l’abattage, mais perd contre les grosses mises et ne se fait pas payer trois rues par pire.', x: 'Paire moyenne à la turn sur K♦ 8♠ 3♣ 2♦ : le solveur checke 85 % du temps.', ch: 46 },
    { t: 'Protection', a: ['protection', 'protéger ta main'], d: 'Miser pour faire payer ou coucher les mains qui ont des outs contre toi, au lieu de leur donner une carte gratuite. Surtout sur les tableaux humides et à plusieurs.', x: '9♠ 9♦ sur 8♥ 7♥ 4♦ contre A♣ K♣ : 6 outs, environ 24 % jusqu’à la river.', ch: 46 },
    { t: 'Valeur fine', a: ['valeur fine', 'value fine', 'thin value'], d: 'Miser à la river avec une main moyenne, parce que l’adversaire paiera encore avec pire. Mise si tu bats plus de la moitié des mains qui paient, et petit (25 à 40 % du pot).', x: 'Coup checké jusqu’à la river sur A♠ 7♦ 2♣ K♥ 3♦ : le bouton mise 68 % du temps avec une paire de rois faible.', ch: 47 },
    { t: 'Range fusionnée', a: ['range fusionnée', 'ranges fusionnées', 'fusionnée', 'merge', 'mergée'], d: 'Une range de mise qui mélange les mains fortes et les mains moyennes, sans vrais bluffs. Contre un joueur qui paie trop : il ne se couche pas, mais il paie avec pire. L’inverse de la range polarisée.', ch: 47 },
    { t: 'Block bet', a: ['block bet', 'block bets', 'mise bloquante'], d: 'Hors position (souvent en grosse blinde), à la river, une petite mise de 20 à 30 % du pot avec une main moyenne, pour fixer le prix et éviter une grosse mise adverse.', x: 'Grosse blinde contre bouton, tu as une paire moyenne à la river : tu mises 3 BB dans un pot de 12 BB.', ch: 47 },
    { t: 'Mise puis couche', a: ['mise puis couche', 'miser puis se coucher', 'bet-fold'], d: 'Miser pour la valeur en prévoyant de se coucher si l’adversaire relance : tu bats les mains qui paient, pas celles qui relancent.', x: 'Top paire kicker moyen à la river, un récréatif passif relance : couche-toi.', ch: 47 },
    { t: 'Check-fold', a: ['check-fold'], d: 'Checker, puis se coucher face à la mise de l’adversaire. Avec une main qui ne bat aucune de ses mises, ou contre un joueur qui ne bluffe jamais.', ch: 47 },
    { t: 'Hero call', a: ['hero call', 'hero calls'], d: 'Payer avec une main faible parce que tu lis un bluff. Il faut une vraie raison (une ligne illogique pour la valeur, un tirage manqué évident, un joueur qui bluffe trop) et que la part de bluffs dépasse l’équité requise.', x: 'Pot de 12 BB, tapis de 12 BB : il te faut 33 % d’équité. S’il bluffe plus d’une fois sur trois, paie.', ch: 47 },
    { t: 'Hero fold', a: ['hero fold', 'hero folds'], d: 'Se coucher avec une main forte parce que tu lis la valeur adverse.', x: 'Un nit qui n’a rien relancé de la soirée te relance la river : tu couches ta top paire.', ch: 47 },
    { t: 'Induire', a: ['induire', 'induis', 'induit'], d: 'Faire jouer l’adversaire à ta place : checker une main forte pour qu’il bluffe, ou miser petit pour qu’il relance. Contre les joueurs agressifs, jamais contre les passifs.', ch: 47 },
    { t: 'Snap call', a: ['snap call', 'snap calls'], d: 'Payer instantanément. Au club, c’est souvent une main moyenne déjà décidée à payer ; au flop ou à la turn, souvent un tirage ou une paire moyenne. Avec une très grosse main, la plupart des joueurs réfléchissent à relancer.', ch: 47 },
    { t: 'Cooler', a: ['cooler', 'coolers'], d: 'Deux très grosses mains l’une contre l’autre : la perte était inévitable, ce n’est pas une erreur.', x: 'KK contre AA à tapis avant le flop, ou brelan contre brelan supérieur.', ch: 47 },
    { t: 'Bad beat', a: ['bad beat', 'bad beats'], d: 'Perdre un coup où tu étais largement devant quand l’argent est entré. Ni le cooler ni le bad beat ne se corrigent : ne change pas ton jeu après.', x: 'AA contre KK à tapis avant le flop : les rois gagnent environ 18 % du temps.', ch: 47 },
  ];
  T.sort(function (a, b) { return a.t.localeCompare(b.t, 'fr', { sensitivity: 'base' }); });
  T.forEach(function (o, i) { o.id = i; });

  /* ---------- Mots cliquables dans les leçons ---------- */
  var RX = null, MAP = {};
  function build() {
    if (RX) return;
    var forms = [];
    T.forEach(function (o) { if (o.nl) return; o.a.forEach(function (f) { forms.push(f); MAP[f.toLowerCase()] = { id: o.id, f: f, up: /^[A-Z0-9+&\s]+$/.test(f) }; }); });
    forms.sort(function (a, b) { return b.length - a.length; });
    var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\\/&]/g, '\\$&'); };
    RX = new RegExp('(^|[^0-9A-Za-zÀ-ÿ-])(' + forms.map(esc).join('|') + ')(?![0-9A-Za-zÀ-ÿ-])', 'gi');
  }
  // Souligne la première apparition de chaque terme, hors balises et hors liens. seen : termes déjà soulignés dans la leçon.
  function link(html, seen) {
    build();
    var out = '', inA = 0;
    html.split(/(<[^>]+>)/).forEach(function (part) {
      if (part.charAt(0) === '<') { if (/^<a[\s>]/i.test(part)) inA++; else if (/^<\/a>/i.test(part)) inA = Math.max(0, inA - 1); out += part; return; }
      if (inA) { out += part; return; }
      out += part.replace(RX, function (m, pre, w) {
        var e = MAP[w.toLowerCase()];
        if (!e || (e.up && w !== e.f) || seen[e.id]) return m; // les sigles (BB, SB, CO, EV…) seulement en majuscules
        seen[e.id] = 1;
        return pre + '<span class="lx" data-lx="' + e.id + '" role="button" tabindex="0">' + w + '</span>';
      });
    });
    return out;
  }
  function card(o) {
    return '<b style="color:#ffd23f;font-size:1.1em">' + o.t + '</b><div style="margin-top:6px">' + o.d + '</div>' + (o.x ? '<div class="small muted" style="margin-top:6px">Exemple : ' + o.x + '</div>' : '') + (o.ch ? '<div style="margin-top:10px"><a class="btn" href="#lecon-' + o.ch + '">Chapitre ' + o.ch + '</a> <a class="btn" href="#lexique">Le lexique</a></div>' : '');
  }
  function pop(id) {
    var o = T[id]; if (!o) return;
    var old = document.getElementById('lxpop'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'lxpop'; d.className = 'zoom';
    d.innerHTML = '<div class="lxbox" style="text-align:left;max-width:520px">' + card(o) + '<button class="btn gold block" style="margin-top:12px" data-lxclose="1">Fermer</button></div>';
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-lxclose]') || e.target.closest('a')) d.remove(); });
    document.body.appendChild(d);
  }
  document.addEventListener('click', function (e) { var t = e.target.closest ? e.target.closest('.lx[data-lx]') : null; if (t) { e.preventDefault(); pop(+t.getAttribute('data-lx')); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('lx')) pop(+e.target.getAttribute('data-lx')); });

  /* ---------- Page du lexique ---------- */
  var Q = '';
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function list() {
    var q = norm(Q.trim()), items = T.filter(function (o) { return !q || norm(o.t).indexOf(q) >= 0 || o.a.some(function (f) { return norm(f).indexOf(q) >= 0; }) || (q.length > 3 && norm(o.d).indexOf(q) >= 0); });
    if (!items.length) return '<div class="muted">Aucun terme ne correspond. Essaie un autre mot.</div>';
    var out = '', letter = '';
    items.forEach(function (o) {
      var L = /^[0-9]/.test(o.t) ? '0-9' : norm(o.t).charAt(0).toUpperCase();
      if (L !== letter) { letter = L; out += '<h2 class="lx-letter">' + L + '</h2>'; }
      out += '<div class="card stack lx-item" id="lx-' + o.id + '">' + card(o).replace(' <a class="btn" href="#lexique">Le lexique</a>', '') + '</div>';
    });
    return out;
  }
  function view() {
    var ui = window.PA_UI;
    var out = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Lexique</h1>' +
      '<div class="small muted">' + T.length + ' termes du cours, de A à Z. Dans les leçons, les mots soulignés en pointillés s’ouvrent d’un appui.</div>' +
      '<input id="lxq" class="co-in" type="search" placeholder="Chercher un terme (squeeze, outs, ICM…)" value="' + Q.replace(/"/g, '&quot;') + '" style="font-size:1.1em;padding:12px;border-radius:12px;width:100%">' +
      '<div id="lxlist" class="stack">' + list() + '</div></div>';
    setTimeout(function () { var i = document.getElementById('lxq'); if (i) i.addEventListener('input', function () { Q = i.value; document.getElementById('lxlist').innerHTML = list(); }); }, 0);
    return ui.shell('apprendre', out);
  }
  // version imprimable (cours et PDF)
  function printHtml() {
    return T.map(function (o) { return '<p class="lx-p"><b>' + o.t + '</b> : ' + o.d + (o.x ? ' <i>Exemple : ' + o.x + '</i>' : '') + (o.ch ? ' <span class="lx-ch">(chapitre ' + o.ch + ')</span>' : '') + '</p>'; }).join('');
  }
  window.PA_LEX = { TERMS: T, view: view, link: link, printHtml: printHtml, pop: pop };
})();
