/* Poker Academy — mode d'emploi : un guide pas à pas par fonction (appli complète et appli Club) */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  // club: true = guide présent aussi dans l'appli Club
  var G = [
    { id: 'soiree', club: true, t: 'Une soirée tournoi de A à Z', i: 'De l’arrivée des joueurs au classement : tout se passe dans Club › Tournoi du club (onglet Tournoi dans l’appli Club).',
      s: ['Onglet Réglages : choisis le type (Mercredi, Deep ×1,5 ou Hors championnat), la date et le format des tables (6-max, 9-max ou 10 joueurs).',
        'Onglet Joueurs : touche le nom de chaque présent dans « Les habitués », ou « Tout le club présent » puis retouche les absents. Un nouveau venu : « Ajouter au club ».',
        'Touche « Tirer les tables et les sièges ». Le plan s’affiche dans l’onglet Tables.',
        'Pas d’imprimante ? Onglet Tables › « 📋 Liste des places » : tous les joueurs par ordre alphabétique avec leur table et leur siège. « 📤 Envoyer la liste » la partage sur WhatsApp ; « 📺 Afficher sur l’écran télé » la montre en grand sur la télé (touche-le à nouveau pour la retirer).',
        'En haut de la page, touche « ▶ Lancer » : le chrono démarre et annonce chaque niveau.',
        'Quand un joueur sort : touche son nom sur la table, choisis qui l’a éliminé, puis « Valider l’élimination ». Sa place, l’heure et le niveau sont notés.',
        'Si des joueurs changent de place, une fenêtre les liste : annonce-les, puis « Fait, les joueurs sont installés » (ou « Plus tard »).',
        'Quand il ne reste qu’un joueur : « Enregistrer au classement ». Ensuite, partage l’image du classement ou le résumé texte sur WhatsApp.'],
      tips: ['Un joueur sorti par erreur : onglet Joueurs, bouton ↺ à côté de son nom.', 'Une re-entry : onglet Joueurs, bouton « Re-entry » à côté du joueur sorti ; il est replacé à la table la moins remplie.', 'La tête mise à prix (le vainqueur du tournoi précédent du même type) est affichée en haut : celui qui la sort gagne 2 points.'] },
    { id: 'sauvetournoi', club: true, t: 'La sauvegarde automatique du tournoi', i: 'Toutes les 3 minutes, l’appli fait une copie du tournoi en cours : joueurs en jeu et éliminés, places, tables, re-entries, add-ons, jetons en jeu, niveau et temps restant.',
      s: ['Rien à faire : dès qu’un joueur est inscrit, la copie se fait toute seule toutes les 3 minutes, et aussi quand l’appli passe en arrière-plan (écran éteint, autre appli ouverte).',
        'Si l’appli plante : rouvre-la. Le tournoi est là où tu l’as laissé, chrono compris (chaque action est enregistrée au fur et à mesure).',
        'Si le tournoi a été effacé (fausse manœuvre, données abîmées) : la page du tournoi affiche « 💾 Un tournoi interrompu a été sauvegardé ». Touche « Reprendre ce tournoi ».',
        'Pour revenir à un moment précis : en bas de la page du tournoi, ouvre « 💾 Sauvegarde automatique » ; les 20 dernières copies sont listées avec l’heure, les joueurs restants et le niveau. Touche « Reprendre » sur celle que tu veux.',
        'Une copie reprise redémarre chrono en pause, au temps qu’il restait au moment de la copie : relance-le avec ▶ quand la table est prête.'],
      tips: ['« Sauvegarder maintenant » force une copie, par exemple juste avant une pause.', 'Une copie est faite avant « Nouveau tournoi » et avant une remise à zéro : une erreur se rattrape.', 'Sur PC, la dernière copie est aussi écrite dans ton Drive (Poker Academy › Sauvegardes › tournoi-en-cours.json) : elle est retrouvée même après une réinstallation.', 'En reprenant une copie, l’état du moment est lui-même gardé : tu peux revenir en arrière.'] },
    { id: 'joueurs', club: true, t: 'Les joueurs du club', i: 'La liste du club sert à inscrire les présents en un toucher. Elle est partagée entre l’appli complète et l’appli Club.',
      s: ['Tournoi › onglet Joueurs : la carte « Les habitués » montre les membres, les plus fidèles d’abord (le chiffre = tournois joués).',
        'Ajouter un membre : tape son pseudo dans « Pseudo du nouveau membre », puis « ＋ Ajouter au club » (ou la touche Entrée). Il est aussi inscrit au tournoi du soir.',
        'Corriger ou retirer des membres : « Modifier la liste du club », un pseudo par ligne, puis « Enregistrer la liste ».',
        'Importer une liste : dans « Modifier la liste du club », « Importer un .txt » (un pseudo par ligne).'],
      tips: ['Un pseudo écrit autrement (« yo » et « YO ») n’est jamais ajouté deux fois.', 'Les joueurs déjà venus au championnat restent proposés même s’ils ne sont plus dans la liste.'] },
    { id: 'chrono', club: true, t: 'Le chrono, la structure et les annonces', i: 'Le chrono suit la structure du tournoi : blindes, ante, durée des niveaux et pauses.',
      s: ['Tournoi › Réglages › « Structure : blindes, ante, durée, pauses » (ou Chrono › Structure dans l’appli Club).',
        'Règle les blindes de départ, la progression, le nombre et la durée des niveaux, l’ante (classique ou de grosse blinde) à partir d’un niveau, les pauses et les tapis (départ, re-entry, add-on).',
        'Touche « Créer la structure » : la liste des niveaux se remplit ; tu peux la corriger à la main. Puis « Enregistrer et revenir au minuteur ».',
        'Pendant le tournoi : ⏮ et ⏭ changent de niveau, −1 et +1 enlèvent ou ajoutent une minute, ▶ / ❚❚ lance ou met en pause.',
        'Changer les blindes du niveau en cours : touche les blindes en haut de la page du tournoi (✏️). Corrige la petite blinde, la grosse blinde, l’ante et la durée, puis « Valider ». Seul ce niveau change et le chrono continue.',
        'Les annonces vocales (niveaux, dernière minute, pauses, sorties, primes, changements de place) se coupent ou se remettent avec le bouton 🔊 Voix.'],
      tips: ['Réglages du tournoi › « Re-entry, add-on, jetons » : fin des re-entry après un niveau, add-on à la pause n°, retrait des petits jetons (« 25 au niveau 8 »). La voix les annonce.', 'Sur iPhone, touche l’écran une fois au début (par exemple « Lancer ») pour autoriser le son.', 'L’écran reste allumé tant que le chrono tourne.'] },
    { id: 'lots', club: true, t: 'Dotation et répartition des lots', i: 'Si le tournoi a des lots, l’appli propose combien de places sont récompensées et la part de chacune.',
      s: ['Tournoi › Réglages › « La dotation » : saisis la valeur totale des lots en euros.',
        'Les places récompensées sont calculées selon le nombre d’inscrits (0 = automatique) ; tu peux imposer un autre nombre.',
        'La répartition s’affiche (par exemple 150 / 90 / 60 € pour 300 € à 14 joueurs), en haut de la page et sur l’écran télé.',
        'À chaque sortie dans les places payées, la voix annonce le lot ; il est enregistré au classement et dans les exports.'],
      tips: ['Préfère des lots, des bons ou des trophées : les tournois avec mises en argent sont réglementés.'] },
    { id: 'ecran', club: true, t: 'L’écran télé', i: 'Un affichage plein écran pour la télé ou le vidéoprojecteur du club.',
      s: ['Relie la télé : câble HDMI au PC, ou sans fil avec le bouton « 📡 Diffuser sur la télé » (page du tournoi ou bas de l’écran télé). Sur Android, il ouvre l’écran de diffusion du téléphone (Caster, Smart View…) : choisis ta télé. Sur PC, il ouvre le volet « Caster » de Windows (comme Windows + K).',
        'Page du tournoi : lien « 📺 Écran télé » sous le chrono (ou tuile Écran télé dans l’appli Club).',
        'Touche « ⛶ Plein écran ». Les boutons du bas apparaissent quand tu passes la souris ou touches l’écran.',
        'L’écran montre les blindes, le chrono, les joueurs restants, le tapis moyen, la prochaine pause, la tête mise à prix, la dotation, les changements de place et le plan des tables.'],
      tips: ['La télé n’apparaît pas dans la liste ? Elle doit être sur le même Wi-Fi et accepter Chromecast (Android) ou Miracast (Windows) ; sinon, le câble HDMI sur le PC.', 'Sur iPhone : centre de contrôle › Recopie de l’écran (télé AirPlay ou Apple TV).', 'Au clavier du PC : espace = lancer ou pause, flèches gauche et droite = niveau, F = plein écran, V = voix.', '« ‹ Quitter » revient à la page du tournoi.'] },
    { id: 'telecommande', club: true, t: 'La télécommande', i: 'Le PC affiche l’écran télé ; toi, tu gères tout depuis ton téléphone à la table. Le PC et le téléphone doivent être sur le même wifi.',
      s: ['Sur le PC (appli complète ou appli Club) : Tournoi › Réglages › « 📱 Télécommande » › « Activer la télécommande ».',
        'La première fois, Windows demande d’autoriser l’appli sur le pare-feu : accepte pour les réseaux privés.',
        'La carte affiche une adresse (par exemple http://192.168.1.20:47817) et un code à 4 chiffres.',
        'Sur le téléphone, ouvre cette adresse dans le navigateur (Chrome ou Safari), puis tape le code.',
        'Depuis le téléphone : lancer et mettre en pause, changer de niveau, ajouter ou enlever une minute, couper la voix.',
        'Onglet « En jeu » : « Sorti » à côté d’un joueur, choisis qui l’a éliminé, « Valider ». Onglet « Éliminés » : re-entry, annulation, add-on.',
        'Les changements de place s’affichent en jaune : « C’est fait ✓ » quand ils sont annoncés. À la fin : « Enregistrer au classement ».'],
      tips: ['Le point vert « relié au PC » confirme la connexion ; s’il devient rouge, vérifie que le PC est allumé et sur le même wifi.', '« Nouveau code » sur le PC change le code ; « Arrêter » coupe la télécommande. Elle se réactive seule au prochain lancement.', 'Ajoute l’adresse aux favoris du téléphone pour la retrouver chaque mercredi.'] },
    { id: 'championnat', club: true, t: 'Le championnat', i: 'Chaque tournoi enregistré rapporte des points au classement de l’année.',
      s: ['Barème : le 1er marque autant de points qu’il y a de joueurs, le 2e un de moins… le dernier 1 point. Le deep du vendredi rapporte ×1,5 et compte dans le même classement.',
        'Prime : qui élimine le vainqueur du tournoi précédent du même type (mercredi ou deep) gagne 2 points.',
        'Club › Championnat : onglets Classement (podium, barres mercredi / deep / primes, moyenne), Semaines, Tournois et Trophées.',
        'Touche un nom pour ouvrir sa fiche : rang, moyenne, courbe de la saison, bête noire, victime préférée, tous ses tournois.',
        'Fin d’année : onglet Trophées › « Clôturer la saison » ; le podium et les trophées entrent au palmarès. Les tournois de janvier partent dans la saison suivante.'],
      tips: ['Un tournoi « Hors championnat » est enregistré sans points.', 'Un tournoi enregistré par erreur : onglet Tournois, ouvre-le, « Supprimer ce tournoi du classement ».'] },
    { id: 'exports', club: true, t: 'Exports et partage', i: 'Le classement et les tournois se partagent en Excel, en PDF, en image ou en texte.',
      s: ['Club › Championnat, en bas : « 📊 Excel » ou « 📄 PDF » pour toute l’année (classement, semaines, tournois, trophées).',
        '« 🖼️ Image du classement pour WhatsApp » : une image prête à envoyer au groupe, avec les places gagnées ou perdues.',
        'Onglet Tournois, ouvre un tournoi : « Excel de ce tournoi », « PDF de ce tournoi », « 📝 Résumé texte pour WhatsApp ».',
        'Onglet Trophées : « PDF de la remise des prix ».'],
      tips: ['Sur Android, le menu de partage s’ouvre (WhatsApp, mail, Drive). Sur PC, le fichier est rangé dans Mon Drive › Poker Academy › Partage et s’ouvre tout seul.'] },
    { id: 'synchro', club: true, t: 'Synchroniser l’appli complète et l’appli Club', i: 'Le championnat, la liste du club et la structure sont partagés par un fichier de ton Google Drive : Mon Drive › Poker Academy › Club › championnat-club.json.',
      s: ['Sur PC : rien à faire, la synchronisation est automatique (au démarrage, chaque minute et après chaque changement).',
        'Sur Android : Club › Championnat (en bas) ou accueil de l’appli Club › « Choisir le fichier », puis sélectionne championnat-club.json dans Mon Drive › Poker Academy › Club. À faire une seule fois.',
        'Sur iPhone ou dans le navigateur : « Sans Drive : par fichier » › « Exporter le championnat » d’un côté, « Importer un fichier » de l’autre.',
        '« Synchroniser maintenant » force une synchronisation tout de suite.'],
      tips: ['Rien n’est jamais écrasé : les tournois s’additionnent et une suppression est reportée de l’autre côté.', 'Ne gère pas le même tournoi dans deux applis en même temps : seul le résultat enregistré se synchronise.', 'Pour partager le championnat avec un co-organisateur, partage-lui le dossier Drive « Poker Academy › Club » en modification.'] },
    { id: 'installer', club: true, t: 'Installer l’appli Club et la partager', i: 'L’appli Club se télécharge depuis une page réservée : https://ngossartng-dev.github.io/poker-academy/telechargements/club.html',
      s: ['Android : « Télécharger pour Android », ouvre le fichier, autorise l’installation si le téléphone le demande.',
        'PC Windows : « Télécharger pour Windows », lance l’installateur ; si Windows affiche « Windows a protégé votre ordinateur », clique sur « Informations complémentaires » puis « Exécuter quand même ».',
        'iPhone : ouvre le lien dans Safari, touche Partager puis « Sur l’écran d’accueil » ; l’appli s’appelle « PA Club ».',
        'Pour la partager, envoie le lien de la page (WhatsApp, Messenger, SMS) : il donne toujours la dernière version.'],
      tips: ['L’appli Club s’installe à côté de l’appli complète, avec ses propres données.', 'Si Play Protect affiche « Appli dangereuse bloquée » : c’est une fausse alerte, l’appli ne vient simplement pas du Play Store. Touche « Plus de détails », puis « Installer quand même ».'] },
    { id: 'maj', club: true, t: 'Mises à jour et sauvegarde', i: 'L’appli vérifie toute seule s’il existe une nouvelle version.',
      s: ['Le bouton « 🔄 Mettre à jour l’appli » est dans Moi (appli complète) et dans Réglages (les deux applis). Quand une nouvelle version existe, il devient jaune et clignote, et il apparaît aussi en haut de l’accueil.', 'Touche-le : la page « Mettre à jour l’appli » montre la version installée, la nouvelle et ce qui change.',
        'PC : « Mettre à jour maintenant », puis « Installer et redémarrer » ; l’appli se ferme quelques secondes et se rouvre.',
        'Android : « Télécharger la nouvelle version » ; le navigateur télécharge le fichier, ouvre-le et touche « Mettre à jour ». Si Play Protect affiche un avertissement : « Plus de détails », puis « Installer quand même ».',
        'iPhone et navigateur : la mise à jour est automatique à l’ouverture.'],
      tips: ['Tes données sont gardées à chaque mise à jour.', 'Sur PC, une sauvegarde est faite toutes les 5 minutes dans Mon Drive › Poker Academy › Sauvegardes.', 'En cas de souci, Réglages › Sauvegarde › « Journal des erreurs » › « Copier le détail », et envoie-le.'] },
    { id: 'semaine', club: false, t: 'Le plan de la semaine', i: 'Un quart d’heure par jour sur tes points les plus faibles, construit chaque lundi.',
      s: ['S’entraîner › « Mon plan de la semaine ».', 'En haut, tes 3 points à travailler et leur niveau.', 'Chaque jour : une leçon, un exercice ciblé ou les mains à revoir ; touche une tâche pour la lancer.', 'Touche « Marquer comme fait » à la fin de la journée.', 'En bas, « Mon bilan au club » : ton rang, ta moyenne, tes dernières places et des conseils tirés de tes résultats.'],
      tips: ['« Refaire le plan avec mes résultats d’aujourd’hui » le recalcule sans perdre les jours faits.'] },
    { id: 'range', club: false, t: 'Ma range', i: 'Ta range de jeu, consultable partout dans l’appli d’entraînement.',
      s: ['Bouton « Ma range » en bas à droite, ou Apprendre › Ma range.', 'Choisis la situation (ouverture, défense, face au 3-bet), la position et la profondeur.', 'Touche une main pour voir l’action et la suite face à une sur-relance (onglet Plan de jeu).',
        'Onglet « Vue globale » : la couleur de chaque case dit à partir de quelle position tu ouvres la main. Les petits points en bas des cases ajoutent : 🔴 tu la 3-bets face à une relance, ⚪ tu 4-bets face à un 3-bet, 🔵 tu paies le 3-bet, ⚫ tu te couches face au 3-bet. « Masquer les indices » les retire.',
        '« Imprimer cette range » pour l’avoir sur papier.'],
      tips: ['Le bouton « Ma range » te gêne ? Fais-le glisser du doigt (ou à la souris) où tu veux : il garde sa place. Réglages › « Le remettre à sa place d’origine ».', 'Les indices suivent le tapis choisi (20-40, 40, 60, 100 BB) ; face au 3-bet, ils s’affichent à partir de 40 BB.', 'Ton profil (Nit, TAG, Équilibré, LAG ou Perso) se change dans Moi.'] },
    { id: 'tournoisentr', club: false, t: 'Les tournois d’entraînement', i: 'Sit & Go, tournoi de 100 joueurs ou moments clés contre des adversaires simulés, avec un tableau de bord en haut de la table.',
      s: ['S’entraîner › « Jouer une partie » : choisis le format (Sit & Go 9 ou 6 joueurs, heads-up, tournoi 100 joueurs, moments clés), la table, le rythme, les primes et les « Mises des adversaires » : Petites (comme au club : ouvertures à 2 BB, mises de 1/3 à 1/2 du pot), Moyennes ou Grosses. Puis lance la partie.',
        'Toutes les actions sont possibles, y compris limper : avant le flop, sans relance devant toi, le bouton « Limper » paie juste la grosse blinde (en petite blinde : « Compléter »). Les adversaires limpent aussi, surtout en mode « comme au club ».',
        'En haut de la table, le tableau de bord : ⏱ Temps (le temps de jeu défile, il s’arrête quand tu quittes la table) et le niveau ; 🔺 Blindes, l’ante et dans combien de mains elles montent ; 👥 Joueurs restants sur le total et le nombre de places payées ; 🪙 Moyen, le tapis moyen en jetons et en BB, avec ton tapis entre parenthèses.',
        'La barre jaune sous le tableau de bord se remplit jusqu’à la prochaine hausse des blindes.',
        'Les cartes sont distribuées en animation, le flop, la turn et la river se retournent, et les jetons glissent du joueur vers le pot, avec leurs bruits de cartes et de jetons.',
        'Touche un joueur pour voir son tapis (et son profil avec le coach) ; « Ma range » reste accessible à tout moment.'],
      tips: ['Les adversaires se couchent quand ils n’ont rien face à une mise, et ne se relancent plus en boucle : les pots énormes dès le niveau 1 sont devenus rares.', 'Le coach peut te signaler qu’un limp sort du plan du cours : c’est un conseil, pas une interdiction.', 'Animations ou sons gênants ? Réglages › « Animations de la table » et « Sons de la table » : Oui ou Non.', 'Les blindes montent toutes les 12 mains en rythme normal, 8 en semi-turbo et 5 en turbo.', 'Compare ton tapis au tapis moyen : en dessous de 20 BB, pense aux ranges de tapis (onglet Ma range › Moins de 20 BB).'] },
    { id: 'analyse', club: false, t: 'Analyser mes mains', i: 'L’appli lit tes historiques Winamax et en tire statistiques et fuites.',
      s: ['Analyser › importe tes historiques : sur PC, l’appli lit le dossier Winamax du PC ; sur téléphone, choisis les fichiers.', 'En haut d’Analyser, la carte « 📥 Dernière récupération » : quand les mains ont été récupérées, combien (+N mains), d’où (Winamax automatique ou fichiers, sur PC ou téléphone), le total et la date de la dernière main jouée. « Historique des récupérations » liste les précédentes.', 'Consulte tes statistiques, tes fuites chiffrées en BB et les mains ratées.', 'Une main jouée au club : Club › « Noter une main du club » (aussi à la voix).'],
      tips: ['Sur le téléphone, les mains récupérées sur le PC arrivent par la synchronisation (Moi › Sauvegarde) ; la carte montre alors la récupération faite sur le PC.', 'Les statistiques restent grisées tant qu’il n’y a pas assez d’occasions.'] }
  ];
  function list() { return window.PA_CLUB ? G.filter(function (g) { return g.club; }) : G; }
  function link(id, label) { return '<a class="guide-link" href="#guide?g=' + id + '">❓ ' + (label || 'Mode d’emploi') + '</a>'; }
  var PRINT = false;
  function view() {
    var ui = U(), esc = ui.esc, sel = (location.hash.match(/[?&]g=([a-z]+)/) || [])[1] || '';
    var L = list();
    var out = '<div class="stack guide"><button class="back no-print" data-act="nav" data-v="home">‹ Accueil</button><h1>Mode d’emploi</h1>' +
      '<div class="small muted">' + (window.PA_CLUB ? 'Poker Academy Club' : 'Poker Academy') + ' · ' + L.length + ' guides pas à pas. Touche un titre pour l’ouvrir.</div>' +
      '<button class="btn gold block no-print" data-gact="print">🖨️ Imprimer ou enregistrer en PDF</button>';
    out += L.map(function (g) {
      var open = PRINT || g.id === sel;
      return '<details class="card guide-g" id="g-' + g.id + '"' + (open ? ' open' : '') + '><summary><b>' + esc(g.t) + '</b></summary><p>' + esc(g.i) + '</p><ol>' + g.s.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
        (g.tips && g.tips.length ? '<div class="guide-tips"><b>Bon à savoir</b><ul>' + g.tips.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') + '</details>';
    }).join('');
    out += '<div class="small muted">Merci à Lionel et à tout le club ♥</div></div>';
    if (sel) setTimeout(function () { var el = document.getElementById('g-' + sel); if (el) el.scrollIntoView({ block: 'start' }); }, 60);
    return ui.shell(window.PA_CLUB ? 'reglages' : 'moi', out);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-gact]') : null; if (!t) return;
    if (t.getAttribute('data-gact') === 'print') {
      PRINT = true; U().render();
      setTimeout(function () { try { window.print(); } catch (x) {} PRINT = false; setTimeout(function () { U().render(); }, 800); }, 150);
    }
  });
  window.PA_GUIDE = { view: view, link: link, list: list, _all: G };
})();
