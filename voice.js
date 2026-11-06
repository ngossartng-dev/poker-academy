/* Poker Academy — dictée vocale commune (Android : reconnaissance du téléphone ; navigateur : Web Speech) et recherche générale */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim(); }
  function ok() {
    try { if (window.PAAndroid && window.PAAndroid.voiceOk && window.PAAndroid.voiceOk()) return true; } catch (e) {}
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  // listen(invite, rappel) : rappel(texte) ; texte null = dictée impossible ; '' = rien entendu ; err = message
  function listen(prompt, cb) {
    if (window.PAAndroid && (window.PAAndroid.voiceAsk || window.PAAndroid.voice)) {
      window.__paVoiceCb = cb;
      try { if (window.PAAndroid.voiceAsk) window.PAAndroid.voiceAsk(prompt || 'Parle'); else window.PAAndroid.voice(); } catch (e) { window.__paVoiceCb = null; cb(null); }
      return;
    }
    var R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) { cb(null); return; }
    try {
      var rec = new R(), heard = '', done = false; rec.lang = 'fr-FR'; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = function (e) { heard = e.results[0][0].transcript; };
      rec.onerror = function (e) { done = true; cb(null, e && (e.error === 'not-allowed' || e.error === 'service-not-allowed') ? 'Le micro est refusé : autorise-le dans les réglages.' : (e && e.error === 'no-speech' ? 'Je n’ai rien entendu. Réessaie en parlant près du micro.' : 'La dictée ne marche pas ici (il faut internet, ou ce navigateur ne la propose pas).')); };
      rec.onend = function () { if (!done) cb(heard); };
      rec.start();
    } catch (e) { cb(null); }
  }
  function micBtn(attr, on) { return ok() ? '<button class="btn" ' + attr + ' aria-label="Dicter" style="min-height:44px;min-width:52px">' + (on ? 'J’écoute…' : '🎤') + '</button>' : ''; }

  /* ---------- Recherche générale ---------- */
  var PAGES = [
    ['minuteur', 'Minuteur de tournoi', 'minuteur blindes niveaux pause horloge structure ante'],
    ['tournoi', 'Tournoi du club', 'tournoi inscription joueurs tables tirage sieges elimination re-entry add-on tapis moyen'],
    ['lecons', 'Les leçons', 'cours chapitres lecons'], ['podcasts', 'Les podcasts', 'podcast ecouter audio'],
    ['examens', 'Les examens', 'examen quiz test'], ['lexique', 'Le lexique', 'lexique definitions termes vocabulaire'],
    ['memo', 'La fiche mémo', 'fiche memo tailles seuils outs'], ['ranges', 'Ma range', 'range ouverture defense mains tableau'],
    ['situations', 'Situations', 'icm bulle pko outs cote exercices'], ['calcul', 'Calcul rapide', 'calcul cote pot equite outs'],
    ['choix3b', '3-bet, squeeze ou pas ?', '3-bet squeeze relance exercice'], ['cas', 'Cas concrets', 'cas concrets solveur flop turn river'],
    ['solveur', 'Le solveur', 'solveur gto flop turn river'], ['apf', 'Après le flop : que faire ?', 'apres le flop postflop c-bet'],
    ['partie', 'Jouer une partie', 'partie sit go tournoi heads-up jeu table'], ['testmenu', 'Test de profil', 'test profil'],
    ['analyser', 'Analyser mes mains', 'analyser historique winamax mains import fuites'], ['bankroll', 'Bankroll', 'bankroll argent gains buy-in'],
    ['coach', 'Mode coach', 'coach quiz club lien lionel yo'], ['sauvegarde', 'Sauvegarde', 'sauvegarde drive synchronisation'],
    ['reglages', 'Réglages', 'reglages parametres theme taille texte'], ['outils', 'Outils', 'outils']
  ];
  var Q = { q: '', listening: false, msg: '' };
  function results(q) {
    var n = norm(q); if (n.length < 2) return [];
    var words = n.split(' '), out = [];
    function score(txt, w) { var t = norm(txt); return words.every(function (x) { return t.indexOf(x) >= 0; }) ? w : 0; }
    PAGES.forEach(function (p) { var s = Math.max(score(p[1], 30), score(p[1] + ' ' + p[2], 20)); if (s) out.push({ s: s, href: '#' + p[0], t: p[1], d: 'Page de l’appli' }); });
    var LX = window.PA_LEX ? window.PA_LEX.TERMS : [];
    LX.forEach(function (x) { var s = Math.max(score(x.t + ' ' + (x.a || []).join(' '), 28), score(x.d, 8)); if (s) out.push({ s: s, href: x.ch ? '#lecon-' + x.ch : '#lexique', t: x.t, d: x.d.slice(0, 140) + (x.d.length > 140 ? '…' : '') + (x.ch ? ' · chapitre ' + x.ch : '') }); });
    var LS = window.PA_LESSONS ? window.PA_LESSONS.CHAPTERS : [];
    LS.forEach(function (c) {
      if (!c.ready) return;
      var s = score(c.n + ' ' + c.title, 25); if (s) out.push({ s: s, href: '#lecon-' + c.n, t: c.n + '. ' + c.title, d: 'Leçon' });
      (c.sections || []).forEach(function (sec) { var s2 = Math.max(score(sec.h, 18), score(sec.p.join(' '), 5)); if (s2) out.push({ s: s2, href: '#lecon-' + c.n, t: sec.h, d: 'Chapitre ' + c.n + ' · ' + c.title }); });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    var seen = {}; return out.filter(function (r) { var k = r.href + r.t; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 30);
  }
  function resHtml() {
    var ui = U(), r = results(Q.q);
    if (norm(Q.q).length < 2) return '<div class="small muted">Tape au moins deux lettres, ou touche le micro et dis par exemple « squeeze », « tapis moyen » ou « mise sonde ».</div>';
    if (!r.length) return '<div class="small muted">Rien trouvé pour « ' + ui.esc(Q.q) + ' ».</div>';
    return r.map(function (x) { return '<a class="card" href="' + x.href + '" style="display:block;text-decoration:none;color:var(--ink)"><b>' + ui.esc(x.t) + '</b><div class="small muted">' + ui.esc(x.d) + '</div></a>'; }).join('');
  }
  function view() {
    var ui = U();
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="home">‹ Accueil</button><h1>Rechercher</h1>' +
      '<div class="row" style="gap:8px"><input id="gsQ" type="search" placeholder="Leçon, terme, outil…" value="' + ui.esc(Q.q) + '" style="flex:1;min-height:48px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:12px;padding:6px 12px;font:inherit;font-size:1.1em">' + micBtn('data-vact="gs"', Q.listening) + '</div>' +
      (Q.msg ? '<div class="small" style="color:var(--gold)">' + ui.esc(Q.msg) + '</div>' : '') + '<div id="gsRes" class="stack" style="gap:8px">' + resHtml() + '</div></div>';
    setTimeout(function () { var el = document.getElementById('gsQ'); if (el && !Q.listening) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} } }, 0);
    return ui.shell('home', body);
  }
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'gsQ') { Q.q = e.target.value; Q.msg = ''; var r = document.getElementById('gsRes'); if (r) r.innerHTML = resHtml(); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-vact]') : null; if (!t) return;
    if (t.getAttribute('data-vact') === 'gs') {
      Q.listening = true; Q.msg = ''; U().render();
      listen('Que cherches-tu ?', function (txt, err) { Q.listening = false; if (txt === null) Q.msg = err || 'La dictée n’est pas disponible sur cet appareil.'; else if (!txt) Q.msg = 'Je n’ai rien entendu.'; else Q.q = txt; U().render(); });
    }
  });
  window.PA_VOICE = { ok: ok, listen: listen, mic: micBtn, norm: norm, search: view, _results: results };
})();
