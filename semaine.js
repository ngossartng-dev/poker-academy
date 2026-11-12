/* Poker Academy — plan d'entraînement de la semaine (construit sur tes points faibles) et ton bilan au club */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  var EXTRA = { taille: 'Tailles de mise au flop', facemise: 'Face à une mise', turnriver: 'Turn et river', lecture: 'Lire la range adverse', icm: 'Bulle et ICM', pko: 'PKO et Space KO', hu: 'Tapis ou fold en heads-up', outs: 'Outs et cote' };
  // notion → leçons à relire et exercice ciblé
  var MAP = {
    open_early: { ch: [5], go: 'open_early' }, open_mid: { ch: [5], go: 'open_mid' }, open_late: { ch: [5, 37], go: 'open_late' }, open_sb: { ch: [5, 37], go: 'open_sb' },
    bb_def: { ch: [6], go: 'bb_def' }, taille: { ch: [13], href: '#taille' }, facemise: { ch: [14, 42], href: '#facemise' }, turnriver: { ch: [15, 16], href: '#turnriver' }, lecture: { ch: [12], href: '#lecture' }, cold: { ch: [41, 8], go: 'cold' }, vs3bet: { ch: [8, 39], go: 'vs3bet' }, push: { ch: [21, 22], go: 'push' },
    callshove: { ch: [22, 23], go: 'callshove' }, mid: { ch: [20], go: 'mid' }, icm: { ch: [23], go: 'icm' }, pko: { ch: [25], go: 'pko' }, bulle: { ch: [48], go: 'bulle' }, iso: { ch: [7], go: 'iso' }, squeeze: { ch: [40], go: 'squeeze' }, postflop: { ch: [14, 15], go: 'postflop' }, hu: { ch: [36, 24], go: 'hu' }, outs: { ch: [10], go: 'outs' }
  };
  var DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  function notionName(k) { return (window.PA.NOTIONS || {})[k] || EXTRA[k] || k; }
  function chTitle(n) { var c = ((window.PA_LESSONS || {}).CHAPTERS || []).filter(function (x) { return x.n === n; })[0]; return c ? c.title : 'Chapitre ' + n; }
  function weekId() { return window.PA_LEAGUE ? window.PA_LEAGUE.week(window.PA_LEAGUE.today()) : String(Math.floor(Date.now() / 6048e5)); }
  // le plan couvre les 7 jours à partir du jour où il est fait (aujourd'hui en premier), puis il est refait
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function noon(x) { var d = x ? new Date(x + 'T12:00:00') : new Date(); d.setHours(12, 0, 0, 0); return d; }
  function since(start) { return Math.round((noon() - noon(start)) / 864e5); }
  // les points faibles : niveau le plus bas d'abord, une notion jamais travaillée compte comme faible
  function weak(p) {
    var keys = Object.keys(window.PA.NOTIONS || {}).concat(Object.keys(EXTRA).filter(function (k) { return (/^(taille|facemise|turnriver)$/.test(k) && window.PA_TAILLE) || (k === 'lecture' && window.PA_LECTURE) || (window.PA_SIT && window.PA_SIT.kinds.indexOf(k) >= 0); }));
    return keys.map(function (k) { var st = p.notions[k] || { r: 1350, n: 0, ok: 0 }; return { k: k, r: st.r, n: st.n, lvl: window.PA.level(st.r), score: st.r + (st.n < 3 ? -120 : 0) }; }).sort(function (a, b) { return a.score - b.score; });
  }
  function build(p) {
    var w = weak(p).filter(function (x) { return MAP[x.k]; }).slice(0, 3), a = w[0] || { k: 'push' }, b = w[1] || a, c = w[2] || b;
    var L = function (k, i) { var ch = MAP[k].ch[i || 0]; return { t: 'lesson', ch: ch, label: 'Leçon ' + ch + ' : ' + chTitle(ch), min: 8 }; };
    var D = function (k) { return MAP[k].href ? { t: 'link', href: MAP[k].href, label: 'Exercice : ' + notionName(k), min: 7 } : { t: 'drill', go: MAP[k].go, label: 'Exercice : ' + notionName(k), min: 7 }; };
    var plan = [
      [L(a.k), D(a.k)],
      [L(b.k), D(b.k)],
      [{ t: 'review', label: 'Mains à revoir (5 min)', min: 5 }, { t: 'link', href: '#fiche', label: 'Avant le tournoi du club : ta fiche', min: 3 }, { t: 'link', href: '#analyser?club', label: 'Après : note une main jouée au club', min: 3 }],
      [D(a.k), { t: 'pod', ch: MAP[a.k].ch[0], label: 'Podcast du chapitre ' + MAP[a.k].ch[0] + ' (en voiture, au calme)', min: 10 }],
      [L(c.k, MAP[c.k].ch.length - 1), D(c.k)],
      [{ t: 'seance', label: 'Séance du jour : 20 décisions mélangées', min: 10 }, D(b.k)],
      [{ t: 'review', label: 'Mains à revoir', min: 5 }, { t: 'link', href: '#semaine?bilan', label: 'Regarde tes progrès de la semaine', min: 3 }]
    ];
    return { id: weekId(), from: iso(noon()), at: Date.now(), focus: w.map(function (x) { return x.k; }), start: w.map(function (x) { return x.r; }), days: plan, done: {} };
  }
  function get(p) { if (!p.week || !p.week.from || since(p.week.from) > 6 || since(p.week.from) < 0) { p.week = build(p); window.PA.save(); } return p.week; }

  /* ---------- Ton bilan au club (championnat) ---------- */
  function clubBilan(p) {
    var LG = window.PA_LEAGUE; if (!LG || !p.pseudo) return null;
    var year = String(new Date().getFullYear()), ys = LG.years(); if (ys.indexOf(year) < 0) year = ys[0];
    var D = LG.playerData(p.pseudo, year); if (!D.me) return null;
    var h = D.hist.filter(function (x) { return x.tn.type !== 'libre'; }), n = h.length;
    var early = h.filter(function (x) { return x.r.place / x.tn.n > 0.6; }).length, deepRun = h.filter(function (x) { return x.r.place <= 3; }).length, wins = h.filter(function (x) { return x.r.place === 1; }).length;
    var tips = [];
    if (n >= 3 && early / n >= 0.5) tips.push({ txt: 'Tu sors souvent tôt (' + early + ' fois sur ' + n + ' dans la première moitié des éliminés) : revois les ouvertures et la gestion des tapis de 25 à 40 BB.', ch: [5, 20] });
    if (deepRun >= 2 && wins === 0) tips.push({ txt: 'Tu vas souvent au podium (' + deepRun + ' fois) sans gagner : le heads-up et la table finale sont ta marge.', ch: [36, 24] });
    if (n >= 3 && h.filter(function (x) { var lv = parseInt(String(x.r.koLevel || '').replace(/\D+/g, ' ').trim().split(' ')[0], 10); return lv >= 6 && x.r.place > 3; }).length / n >= 0.4) tips.push({ txt: 'Beaucoup de sorties en milieu de tournoi, tapis courts : travaille le tapis ou fold et payer un tapis.', ch: [21, 22] });
    if (D.nemesis && D.nemesis.n >= 2) tips.push({ txt: D.nemesis.name + ' t’a sorti ' + D.nemesis.n + ' fois : crée-lui une fiche dans Adversaires et note comment il joue.', href: '#analyser?adv' });
    if (!tips.length) tips.push({ txt: 'Rien d’inquiétant dans tes résultats : continue le plan de la semaine.', ch: [] });
    return { year: year, D: D, n: n, tips: tips };
  }
  function bilanCard(p, compact) {
    var B = clubBilan(p), esc = U().esc; if (!B) return '';
    var o = B.D.me, last = B.D.hist.slice(0, 6).reverse();
    var spark = last.map(function (x) { var q = 1 - (x.r.place - 1) / Math.max(1, x.tn.n - 1); return '<i title="' + x.r.place + 'e / ' + x.tn.n + '" style="height:' + Math.round(18 + q * 42) + 'px;background:' + (x.r.place <= 3 ? 'var(--gold)' : 'rgba(255,255,255,.25)') + '"><b>' + x.r.place + '</b></i>'; }).join('');
    var h = '<div class="card stack"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>Mon bilan au club · ' + B.year + '</b><button class="btn" data-wk="fiche" style="min-height:36px">Ma fiche ›</button></div>' +
      '<div class="wk-club"><div><span>Rang</span><b>' + B.D.rank + (B.D.rank === 1 ? 'er' : 'e') + '</b><small>sur ' + B.D.of + '</small></div><div><span>Points</span><b>' + String(o.total).replace('.', ',') + '</b></div><div><span>Moyenne</span><b>' + String(o.moy).replace('.', ',') + '</b><small>par tournoi</small></div><div class="wk-spark"><span>Dernières places</span><p>' + spark + '</p></div></div>';
    if (!compact) h += B.tips.map(function (t) { return '<div class="wk-tip">💡 ' + esc(t.txt) + (t.ch && t.ch.length ? '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">' + t.ch.map(function (c) { return '<a class="btn" href="#lecon-' + c + '" style="min-height:36px">Leçon ' + c + '</a>'; }).join('') + '</div>' : '') + (t.href ? '<div style="margin-top:6px"><a class="btn" href="' + t.href + '" style="min-height:36px">Adversaires ›</a></div>' : '') + '</div>'; }).join('');
    return h + '</div>';
  }

  /* ---------- Vue ---------- */
  function view() {
    var ui = U(), p = window.PA.player(), W = get(p), esc = ui.esc, s0 = noon(W.from), today = since(W.from);
    var ndone = Object.keys(W.done).filter(function (k) { return W.done[k]; }).length;
    var out = '<div class="stack"><button class="back" data-act="nav" data-v="entrainer">‹ S’entraîner</button><h1>Mon plan de la semaine</h1>' +
      ui.yo('Un quart d’heure par jour, sur tes points faibles. Le plan couvre les 7 jours qui viennent, à partir d’aujourd’hui, et il se refait tout seul ensuite avec tes nouveaux résultats ; touche « Fait » au fil des jours.');
    out += '<div class="card stack"><b>Tes 3 points à travailler</b><div class="wk-focus">' + W.focus.map(function (k, i) {
      var st = p.notions[k] || { r: 1350, n: 0 }, gain = st.r - (W.start[i] || st.r);
      return '<div><span>' + esc(notionName(k)) + '</span><b>Niveau ' + window.PA.level(st.r) + '/5</b><small>' + (st.n ? st.n + ' décisions' : 'jamais travaillé') + (gain ? ' · ' + (gain > 0 ? '▲ +' : '▼ ') + gain + ' cette semaine' : '') + '</small></div>';
    }).join('') + '</div><div class="wk-prog"><i style="width:' + Math.round(ndone / 7 * 100) + '%"></i></div><div class="small muted">' + ndone + ' jour' + (ndone > 1 ? 's' : '') + ' sur 7 · ' + (ndone >= 5 ? 'superbe semaine !' : ndone >= 3 ? 'bon rythme' : 'chaque jour compte') + '</div></div>';
    out += [0, 1, 2, 3, 4, 5, 6].map(function (k) {
      var d = new Date(s0); d.setDate(s0.getDate() + k);
      var i = (d.getDay() + 6) % 7, tasks = W.days[i], key = iso(d); // les tâches suivent le jour de la semaine (mercredi = tournoi du club)
      var mins = tasks.reduce(function (a, t) { return a + (t.min || 0); }, 0), dn = !!W.done[key];
      return '<div class="card stack wk-day' + (k === today ? ' wk-today' : '') + (k < today ? ' wk-past' : '') + (dn ? ' wk-done' : '') + '"><div class="row" style="justify-content:space-between;gap:8px"><b>' + DAYS[i] + ' ' + ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + (k === today ? ' · aujourd’hui' : k === today + 1 ? ' · demain' : '') + (i === 2 ? ' · tournoi du club' : '') + '</b><span class="small muted">' + mins + ' min</span></div>' +
        tasks.map(function (t, j) {
          var ic = { lesson: '📖', drill: '🎯', review: '🔁', link: '🃏', pod: '🎧', seance: '⚡' }[t.t];
          if (t.t === 'lesson') return '<a class="wk-task" href="#lecon-' + t.ch + '">' + ic + ' ' + esc(t.label) + '</a>';
          if (t.t === 'pod') return '<a class="wk-task" href="#lecon-' + t.ch + '">' + ic + ' ' + esc(t.label) + '</a>';
          if (t.t === 'link') return t.href === '#semaine?bilan' ? '<button class="wk-task" data-wk="bilan">' + ic + ' ' + esc(t.label) + '</button>' : '<a class="wk-task" href="' + t.href + '">' + ic + ' ' + esc(t.label) + '</a>';
          if (t.t === 'drill') return '<button class="wk-task" data-act="wkGo" data-v="' + t.go + '">' + ic + ' ' + esc(t.label) + '</button>';
          if (t.t === 'review') { var due = window.PA.srsDue(p).length; return '<button class="wk-task" data-act="seance">' + ic + ' ' + esc(t.label) + (due ? ' · ' + due + ' en attente' : '') + '</button>'; }
          return '<button class="wk-task" data-act="seance">' + ic + ' ' + esc(t.label) + '</button>';
        }).join('') + '<button class="btn' + (dn ? ' gold' : '') + '" data-wk="done" data-v="' + key + '">' + (dn ? '✓ Fait' : 'Marquer comme fait') + '</button></div>';
    }).join('');
    out += '<div id="wkBilan">' + bilanCard(p) + '</div><button class="btn block" data-wk="rebuild">Refaire le plan avec mes résultats d’aujourd’hui</button></div>';
    return ui.shell('entrainer', out);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-wk]') : null; if (!t) return;
    var a = t.getAttribute('data-wk'), p = window.PA.player();
    if (a === 'done') { var W = get(p), i = t.getAttribute('data-v'); W.done[i] = !W.done[i]; window.PA.save(); U().render(); }
    else if (a === 'rebuild') { var d0 = (p.week && p.week.done) || {}, t0 = iso(noon()); p.week = build(p); Object.keys(d0).forEach(function (k) { if (k >= t0 && d0[k]) p.week.done[k] = true; }); window.PA.save(); U().render(); }
    else if (a === 'bilan') { var el = document.getElementById('wkBilan'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
    else if (a === 'fiche') { if (window.PA_LEAGUE && window.PA_LEAGUE.openPlayer) window.PA_LEAGUE.openPlayer(p.pseudo); }
  });
  window.PA_WEEK = { view: view, bilanCard: bilanCard, get: get, weak: weak, _build: build };
})();
