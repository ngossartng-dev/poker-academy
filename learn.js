/* Poker Academy v2.0 — Apprendre : leçons, quiz, podcasts, examens */
(function () {
  'use strict';
  var PA = window.PA, LS = window.PA_LESSONS;
  function U() { return window.PA_UI; }
  function prog(p) { p.lessons = p.lessons || {}; return p.lessons; }
  function embed() { try { return window.self !== window.top; } catch (e) { return true; } }

  /* ---------- Liste des leçons ---------- */
  function listView() {
    var ui = U(), p = PA.player(), pr = prog(p);
    var ready = LS.CHAPTERS.filter(function (c) { return c.ready; }).length, done = Object.keys(pr).filter(function (k) { return pr[k].done; }).length;
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Leçons</h1>' +
      ui.yo((ready === LS.CHAPTERS.length ? 'Les ' + ready + ' chapitres du cours sont en leçons, avec quiz et version à écouter.' : 'Le nouveau cours compte 34 chapitres. ' + ready + ' sont déjà en leçons ; les autres s’ouvrent dans le PDF actuel, à la bonne page.') + ' Leçons acquises : ' + done + ' sur ' + ready + '.') +
      LS.PARTS.map(function (part) {
        return '<div class="card stack"><h3>Partie ' + part.id + ' · ' + part.title + '</h3>' + LS.CHAPTERS.filter(function (c) { return c.part === part.id; }).map(function (c) {
          var st = pr[c.n], badge = c.ready ? (st && st.done ? '<span class="chip" style="border-color:#2f9e44;color:#4fe08f">Acquise</span>' : (st ? '<span class="chip">Quiz ' + st.best + ' %</span>' : '<span class="chip" style="border-color:#555;color:#c9c9cf">' + c.minutes + ' min</span>')) : '<span class="small muted">PDF p. ' + c.page + '</span>';
          return c.ready ? '<a class="row" href="#lecon-' + c.n + '" style="justify-content:space-between;text-decoration:none;color:#fff;padding:8px 0;border-bottom:1px solid var(--line)"><span>' + c.n + '. ' + c.title + '</span>' + badge + '</a>'
            : '<a class="row" ' + (embed() ? '' : 'href="cours/strategie-poker-9max-cours.pdf#page=' + c.page + '" target="_blank" rel="noopener"') + ' style="justify-content:space-between;text-decoration:none;color:#c9c9cf;padding:8px 0;border-bottom:1px solid var(--line)"><span>' + c.n + '. ' + c.title + '</span>' + badge + '</a>';
        }).join('') + '</div>';
      }).join('') + (embed() ? '<p class="muted small">Le PDF n’est pas inclus dans cette version de test en ligne : il est dans l’appli installée.</p>' : '') + '</div>';
    return ui.shell('apprendre', body);
  }

  /* ---------- Une leçon ---------- */
  var QZ = null; // quiz en cours {n, i, score, answered}
  function lessonView(n) {
    var ui = U(), c = LS.get(n); if (!c || !c.ready) { location.hash = '#lecons'; return ''; }
    var p = PA.player(), st = prog(p)[n];
    var h = '<div class="stack"><button class="back" data-act="nav" data-v="lecons">‹ Leçons</button>' +
      '<div class="small muted">Partie ' + c.part + ' · chapitre ' + c.n + ' · ' + c.minutes + ' min</div><h1>' + c.title + '</h1>' +
      '<div class="row"><button class="btn gold" data-lact="listen" data-v="' + n + '">' + (POD.n === n && POD.playing ? 'Pause' : 'Écouter la leçon') + '</button>' + (c.range ? '<button class="btn" data-lact="range" data-v="' + n + '">Voir dans ma range</button>' : '') + (c.sit ? '<button class="btn" data-act="startSit" data-v="' + c.sit + '">S’entraîner sur ce point</button>' : '') + (c.link ? '<a class="btn" href="' + c.link.href + '">' + c.link.label + '</a>' : '') + '</div>' +
      (POD.n === n ? podControls() : '') +
      '<div class="card stack" style="border-color:#ffd23f"><b style="color:#ffd23f">L’idée clé</b>' + c.key.map(function (k) { return '<p>' + k + '</p>'; }).join('') + '</div>' +
      c.sections.map(function (s) { return '<div class="stack" style="gap:8px"><h3>' + s.h + '</h3>' + s.p.map(function (x) { return '<p>' + x + '</p>'; }).join('') + '</div>'; }).join('') +
      '<div class="card fb-err stack"><b>L’erreur fréquente</b><p>' + c.mistake + '</p></div>' +
      '<div class="card stack"><b>À retenir</b>' + c.retain.map(function (r) { return '<div>• ' + r + '</div>'; }).join('') + '</div>' +
      quizHtml(c, st) + '</div>';
    return ui.shell('apprendre', h);
  }
  function quizHtml(c, st) {
    if (!QZ || QZ.n !== c.n) return '<div class="card stack"><b>Mini-quiz (' + c.quiz.length + ' questions)</b><p class="muted">Réussis au moins 80 % pour marquer la leçon comme acquise.' + (st ? ' Meilleur score : ' + st.best + ' %.' : '') + '</p><button class="btn gold block" data-lact="quiz" data-v="' + c.n + '">Commencer le quiz</button></div>';
    if (QZ.i >= c.quiz.length) {
      var pct = Math.round(QZ.score / c.quiz.length * 100);
      return '<div class="card stack ' + (pct >= 80 ? 'fb-ok' : 'fb-style') + '">' + U().yo('<b>' + QZ.score + ' / ' + c.quiz.length + ' (' + pct + ' %).</b> ' + (pct >= 80 ? 'Leçon acquise, bravo.' : 'Pas encore : relis les points où tu t’es trompé et retente le quiz.')) + '<button class="btn" data-lact="quiz" data-v="' + c.n + '">Refaire le quiz</button></div>';
    }
    var q = c.quiz[QZ.i];
    var out = '<div class="card stack"><div class="small muted">Question ' + (QZ.i + 1) + ' / ' + c.quiz.length + '</div><b>' + q.q + '</b><div class="stack" style="gap:8px">';
    q.o.forEach(function (o, k) {
      var cls = 'btn block', st2 = '';
      if (QZ.answered !== null) { if (k === q.a) st2 = 'background:#2f9e44;border-color:#2f9e44;color:#fff'; else if (k === QZ.answered) st2 = 'background:#e03131;border-color:#e03131;color:#fff'; }
      out += '<button class="' + cls + '" style="justify-content:flex-start;text-align:left;' + st2 + '" data-lact="ans" data-v="' + k + '"' + (QZ.answered !== null ? ' disabled' : '') + '>' + o + '</button>';
    });
    out += '</div>';
    if (QZ.answered !== null) out += U().yo((QZ.answered === q.a ? '<b>Exact.</b> ' : '<b>Pas tout à fait.</b> ') + q.why) + '<button class="btn gold block" data-lact="qnext">' + (QZ.i + 1 >= c.quiz.length ? 'Voir le résultat' : 'Question suivante') + '</button>';
    return out + '</div>';
  }

  /* ---------- Podcast (voix du téléphone ou du PC) ---------- */
  var POD = { n: null, lines: [], i: 0, playing: false, rate: 1 };
  var RANK = { A: 'as', K: 'roi', Q: 'dame', J: 'valet', T: 'dix', '9': 'neuf', '8': 'huit', '7': 'sept', '6': 'six', '5': 'cinq', '4': 'quatre', '3': 'trois', '2': 'deux' };
  var SUITN = { '♠': 'de pique', '♥': 'de cœur', '♦': 'de carreau', '♣': 'de trèfle' };
  function speakable(t) {
    return t.replace(/<[^>]+>/g, '')
      .replace(/([AKQJT2-9])([♠♥♦♣])/g, function (m, r, s) { return RANK[r] + ' ' + SUITN[s] + ' '; })
      .replace(/\bBB\b/g, 'grosses blindes').replace(/\bSB\b/g, 'petite blinde').replace(/\bUTG\b/g, 'U T G').replace(/\bCO\b/g, 'cut-off')
      .replace(/c-bet/g, 'ci-bette').replace(/3-bet/g, 'trois-bette').replace(/4-bet/g, 'quatre-bette').replace(/\bSPR\b/g, 'S P R').replace(/\bICM\b/g, 'I C M')
      .replace(/(\d) ?%/g, '$1 pour cent').replace(/ ÷ /g, ' divisé par ').replace(/ × /g, ' fois ').replace(/≈/g, 'environ');
  }
  function script(c) {
    if (c.podcast) return c.podcast;
    var L = [['J', 'Salut Yo ! Aujourd’hui, on parle de quoi ?'], ['Y', 'Salut ! Chapitre ' + c.n + ' : ' + c.title + '. L’idée clé : ' + c.key.join(' ')]];
    c.sections.forEach(function (s) { L.push(['J', s.ask]); s.p.forEach(function (x) { L.push(['Y', x]); }); });
    L.push(['J', 'Et l’erreur à éviter ?']); L.push(['Y', c.mistake]);
    L.push(['J', 'On résume ?']); L.push(['Y', c.retain.join(' ') + ' À toi de jouer : fais le quiz de la leçon, et on se retrouve à la table.']);
    return L;
  }
  function voices() {
    var vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    var fr = vs.filter(function (v) { return /^fr/i.test(v.lang); });
    return { yo: fr[0] || null, j: fr[1] || fr[0] || null };
  }
  function speakNext() {
    if (!POD.playing) return;
    if (POD.i >= POD.lines.length) { POD.playing = false; POD.i = 0; savePos(); U().render(); return; }
    var line = POD.lines[POD.i];
    if (line[0] === 'P') { refreshPod(); setTimeout(function () { if (!POD.playing) return; POD.i++; savePos(); refreshPod(); speakNext(); }, line[1] * 1000); return; }
    var u = new SpeechSynthesisUtterance(speakable(line[1])), v = voices();
    u.lang = 'fr-FR'; u.rate = POD.rate; u.voice = line[0] === 'Y' ? v.yo : v.j; u.pitch = line[0] === 'Y' ? 0.9 : 1.15;
    u.onend = function () { if (!POD.playing) return; POD.i++; savePos(); refreshPod(); speakNext(); };
    u.onerror = function () { POD.playing = false; refreshPod(); };
    speechSynthesis.speak(u); refreshPod();
  }
  function savePos() { var p = PA.player(); if (!p) return; p.podPos = p.podPos || {}; p.podPos[POD.n] = POD.i; PA.save(); }
  function podControls() {
    var line = POD.lines[POD.i] || ['Y', ''];
    var info = POD.audio && AU ? ' · ' + mmss(AU.currentTime) + ' / ' + mmss((window.PA_AUDIO[POD.n] || {}).d || AU.duration || 0) : ' · réplique ' + Math.min(POD.i + 1, POD.lines.length) + ' / ' + POD.lines.length;
    return '<div class="card stack" id="podbox"><div class="small muted">' + (POD.playing ? 'Lecture' : 'En pause') + info + '</div><div>' + (line[0] === 'P' ? '<i>Pause : réfléchis…</i>' : '<b style="color:#ffd23f">' + (line[0] === 'Y' ? 'Yo' : 'Le joueur') + ' :</b> ' + line[1]) + '</div>' +
      '<div class="seg">' + [1, 1.25, 1.5].map(function (r) { return '<button class="' + (POD.rate === r ? 'on' : '') + '" data-lact="rate" data-v="' + r + '">' + String(r).replace('.', ',') + '×</button>'; }).join('') + '<button data-lact="back10">Réplique précédente</button><button data-lact="stop">Arrêter</button></div></div>';
  }
  function mmss(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); }
  function refreshPod() { var b = document.getElementById('podbox'); if (b) b.outerHTML = podControls(); }
  /* ---------- Podcasts enregistrés (voix neuronales) ---------- */
  function hasAudio(n) { return !!(window.PA_AUDIO && window.PA_AUDIO[n]); }
  var AU = null, lastSave = 0;
  function audioEl() {
    if (AU) return AU;
    AU = new Audio(); AU.preload = 'auto';
    AU.addEventListener('timeupdate', function () {
      var m = (window.PA_AUDIO[POD.n] || {}).m || [], t = AU.currentTime, i = 0;
      for (var k = 0; k < m.length; k++) if (m[k] <= t + 0.05) i = k;
      if (i !== POD.i) { POD.i = i; refreshPod(); }
      if (Date.now() - lastSave > 4000) { lastSave = Date.now(); saveSec(); }
    });
    AU.addEventListener('ended', function () { POD.playing = false; POD.i = 0; var p = PA.player(); if (p && p.podSec) { p.podSec[POD.n] = 0; PA.save(); } U().render(); });
    AU.addEventListener('error', function () { if (POD.audio) { POD.audio = false; POD.playing = false; alertBox('Le fichier audio de cet épisode est introuvable : je passe à la voix de l’appareil.'); U().render(); } });
    return AU;
  }
  function saveSec() { var p = PA.player(); if (!p || !AU || POD.n === null) return; p.podSec = p.podSec || {}; p.podSec[POD.n] = Math.floor(AU.currentTime); p.podPos = p.podPos || {}; p.podPos[POD.n] = POD.i; PA.save(); }
  function seekLine(i) { var m = window.PA_AUDIO[POD.n].m; i = Math.max(0, Math.min(m.length - 1, i)); POD.i = i; audioEl().currentTime = m[i]; refreshPod(); }
  function listenAudio(n) {
    var a = audioEl(), c = LS.get(n);
    if (POD.n === n && POD.audio) {
      if (POD.playing) { a.pause(); POD.playing = false; saveSec(); }
      else { a.playbackRate = POD.rate; a.play().catch(function () {}); POD.playing = true; }
      U().render(); return;
    }
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (AU) AU.pause();
    var p = PA.player(), start = (p.podSec && p.podSec[n]) || 0;
    POD = { n: n, lines: script(c), i: 0, playing: true, rate: POD.rate || 1, audio: true };
    a.src = 'audio/pod' + (n < 10 ? '0' : '') + n + '.m4a';
    a.addEventListener('loadedmetadata', function once() { a.removeEventListener('loadedmetadata', once); if (start > 2 && start < a.duration - 5) a.currentTime = start; a.playbackRate = POD.rate; }, false);
    a.playbackRate = POD.rate; a.play().catch(function () {});
    U().render();
  }
  function listen(n) {
    if (hasAudio(n)) { listenAudio(n); return; }
    if (!window.speechSynthesis) { alertBox('La lecture à voix haute n’est pas disponible sur cet appareil.'); return; }
    var c = LS.get(n);
    if (POD.n === n && POD.playing) { POD.playing = false; speechSynthesis.cancel(); U().render(); return; }
    if (POD.n !== n) { speechSynthesis.cancel(); if (AU) AU.pause(); var p = PA.player(); POD = { n: n, lines: script(c), i: (p.podPos && p.podPos[n]) || 0, playing: false, rate: POD.rate || 1 }; }
    POD.playing = true; U().render(); speakNext();
  }
  function alertBox(t) { var d = document.createElement('div'); d.className = 'zoom'; d.innerHTML = '<div>' + t + '<br><button class="btn" style="margin-top:12px">OK</button></div>'; d.onclick = function () { d.remove(); }; document.body.appendChild(d); }

  function podcastsView() {
    var ui = U(), p = PA.player();
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Podcasts</h1>' + ui.yo(window.PA_AUDIO ? 'Chaque leçon existe en version à écouter : je t’explique, le joueur pose les questions et répond aux quiz. Les épisodes sont enregistrés dans l’appli : ils marchent sans internet, et tu reprends là où tu t’étais arrêté.' : 'Chaque leçon existe en version à écouter : je t’explique, le joueur pose les questions. Dans cette version de test, la lecture utilise la voix de ton appareil ; l’appli installée a les épisodes enregistrés.') +
      LS.CHAPTERS.filter(function (c) { return c.ready; }).map(function (c) { var pos = p.podPos && p.podPos[c.n]; var sec = p.podSec && p.podSec[c.n]; var mins = hasAudio(c.n) ? Math.round(window.PA_AUDIO[c.n].d / 60) : c.podcast ? Math.round(c.podcast.reduce(function (a, l) { return a + (l[0] === 'P' ? l[1] / 60 : l[1].split(/\s+/).length / 150); }, 0)) : c.minutes; return '<div class="card row" style="justify-content:space-between"><div><b>' + c.n + '. ' + c.title + '</b><div class="small muted">' + mins + ' min' + (hasAudio(c.n) ? (sec ? ' · reprise à ' + mmss(sec) : '') : (pos ? ' · reprise à la réplique ' + (pos + 1) : '')) + '</div></div><a class="btn" href="#lecon-' + c.n + '">Ouvrir</a></div>'; }).join('') + '</div>';
    return ui.shell('apprendre', body);
  }

  /* ---------- Examens ---------- */
  var EX = null;
  function examsView() {
    var ui = U();
    if (EX && EX.qs) return examRun();
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="apprendre">‹ Apprendre</button><h1>Examens</h1>' + ui.yo('Un examen mélange les questions des leçons d’une partie. Il s’enrichit à chaque nouvelle leçon.') +
      '<div class="grid4">' + LS.PARTS.map(function (pt) { var n = pool(pt.id).length; return n ? '<button class="tile" data-lact="exam" data-v="' + pt.id + '"><b>Partie ' + pt.id + '</b><span>' + pt.title + ' · ' + n + ' questions</span></button>' : ''; }).join('') +
      '<button class="tile" data-lact="exam" data-v="all"><b>Examen général</b><span>15 questions de tout le cours</span></button></div></div>';
    return ui.shell('apprendre', body);
  }
  function pool(part) { var out = []; LS.CHAPTERS.forEach(function (c) { if (c.ready && (part === 'all' || c.part === part)) c.quiz.forEach(function (q) { out.push({ q: q, c: c }); }); }); return out; }
  function examRun() {
    var ui = U();
    if (EX.i >= EX.qs.length) {
      var pct = Math.round(EX.score / EX.qs.length * 100);
      var miss = EX.miss.map(function (m) { return '<div>• ' + m.c.n + '. ' + m.c.title + ' : ' + m.q.q + '</div>'; }).join('');
      return ui.shell('apprendre', '<div class="stack"><h1>Résultat</h1>' + ui.yo('<b>' + EX.score + ' / ' + EX.qs.length + ' (' + pct + ' %).</b> ' + (pct >= 80 ? 'Très bien.' : 'Relis les leçons des questions ratées.')) + (miss ? '<div class="card stack"><b>À revoir</b>' + miss + '</div>' : '') + '<button class="btn gold" data-lact="exitExam">Terminer</button></div>');
    }
    var it = EX.qs[EX.i], q = it.q;
    var out = '<div class="stack"><div class="drill-top"><button class="back" data-lact="exitExam">‹ Quitter</button><span class="muted small">Examen · ' + (EX.i + 1) + '/' + EX.qs.length + '</span><span></span></div><div class="small muted">Chapitre ' + it.c.n + ' · ' + it.c.title + '</div><h3 style="text-transform:none">' + q.q + '</h3><div class="stack" style="gap:8px">';
    q.o.forEach(function (o, k) { var st = ''; if (EX.answered !== null) { if (k === q.a) st = 'background:#2f9e44;border-color:#2f9e44;color:#fff'; else if (k === EX.answered) st = 'background:#e03131;border-color:#e03131;color:#fff'; } out += '<button class="btn block" style="justify-content:flex-start;text-align:left;' + st + '" data-lact="exans" data-v="' + k + '"' + (EX.answered !== null ? ' disabled' : '') + '>' + o + '</button>'; });
    out += '</div>';
    if (EX.answered !== null) out += ui.yo(q.why) + '<button class="btn gold block" data-lact="exnext">Suivante</button>';
    return ui.shell('apprendre', out + '</div>', true);
  }

  /* ---------- Version imprimable du nouveau cours ---------- */
  function printView() {
    var ui = U();
    var body = '<div class="stack"><button class="back" data-act="nav" data-v="cours">‹ Le cours</button><h1>Le cours (nouvelles leçons)</h1>' + (embed() ? '' : '<button class="btn gold" data-lact="print">Imprimer ou enregistrer en PDF</button>') +
      LS.CHAPTERS.filter(function (c) { return c.ready; }).map(function (c) {
        return '<div class="stack" style="page-break-before:always"><h2>' + c.n + '. ' + c.title + '</h2><p><b>L’idée clé.</b> ' + c.key.join(' ') + '</p>' + c.sections.map(function (s) { return '<h3>' + s.h + '</h3>' + s.p.map(function (x) { return '<p>' + x + '</p>'; }).join(''); }).join('') + '<p><b>L’erreur fréquente.</b> ' + c.mistake + '</p><p><b>À retenir.</b> ' + c.retain.join(' · ') + '</p></div>';
      }).join('') + '</div>';
    return ui.shell('apprendre', body);
  }

  /* ---------- Événements ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-lact]'); if (!t) return;
    var a = t.getAttribute('data-lact'), v = t.getAttribute('data-v'), p = PA.player();
    if (a === 'quiz') { QZ = { n: parseInt(v, 10), i: 0, score: 0, answered: null }; U().render(); var el = document.querySelector('[data-lact=ans]'); if (el) el.scrollIntoView({ block: 'center' }); }
    else if (a === 'ans') { var c = LS.get(QZ.n), k = parseInt(v, 10); QZ.answered = k; if (k === c.quiz[QZ.i].a) QZ.score++; U().render(); var y = document.querySelector('[data-lact=qnext]'); if (y) y.scrollIntoView({ block: 'center' }); }
    else if (a === 'qnext') {
      var c2 = LS.get(QZ.n); QZ.i++; QZ.answered = null;
      if (QZ.i >= c2.quiz.length) { var pr = prog(p), pct = Math.round(QZ.score / c2.quiz.length * 100); pr[QZ.n] = pr[QZ.n] || { best: 0, done: false }; pr[QZ.n].best = Math.max(pr[QZ.n].best, pct); if (pct >= 80) pr[QZ.n].done = true; PA.save(); }
      U().render(); var z = document.querySelector('[data-lact=ans],[data-lact=quiz]'); if (z) z.scrollIntoView({ block: 'center' });
    }
    else if (a === 'listen') listen(parseInt(v, 10));
    else if (a === 'rate' && POD.audio) { POD.rate = parseFloat(v); if (AU) AU.playbackRate = POD.rate; refreshPod(); }
    else if (a === 'back10' && POD.audio) { seekLine(POD.i - 1); }
    else if (a === 'stop' && POD.audio) { if (AU) { saveSec(); AU.pause(); } POD.playing = false; POD.n = null; POD.audio = false; U().render(); }
    else if (a === 'rate') { POD.rate = parseFloat(v); if (POD.playing) { speechSynthesis.cancel(); POD.playing = true; setTimeout(speakNext, 50); } refreshPod(); }
    else if (a === 'back10') { POD.i = Math.max(0, POD.i - 1); if (POD.playing) { POD.playing = false; speechSynthesis.cancel(); POD.playing = true; setTimeout(speakNext, 50); } refreshPod(); }
    else if (a === 'stop') { POD.playing = false; speechSynthesis.cancel(); POD.n = null; U().render(); }
    else if (a === 'range') { var c3 = LS.get(parseInt(v, 10)); if (window.PA_UI_openRange) window.PA_UI_openRange({ sit: c3.range, hand: null }); }
    else if (a === 'exam') { var pl = pool(v).sort(function () { return Math.random() - 0.5; }).slice(0, 15); EX = { qs: pl, i: 0, score: 0, answered: null, miss: [] }; U().render(); }
    else if (a === 'exans') { var it = EX.qs[EX.i], k2 = parseInt(v, 10); EX.answered = k2; if (k2 === it.q.a) EX.score++; else EX.miss.push(it); U().render(); }
    else if (a === 'exnext') { EX.i++; EX.answered = null; U().render(); }
    else if (a === 'exitExam') { EX = null; location.hash = '#examens'; U().render(); }
    else if (a === 'print') window.print();
  });
  window.addEventListener('hashchange', function () { if (POD.playing && !/^#lecon-/.test(location.hash)) { /* la lecture continue en arrière-plan */ } if (location.hash.indexOf('#lecon-') !== 0) QZ = null; });

  window.PA_LEARN = {
    views: { lecons: listView, podcasts: podcastsView, examens: examsView, 'cours-imprimable': printView },
    lesson: lessonView
  };
})();
