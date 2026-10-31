/* Poker Academy v2.0 — Cartes de ranges en répétition espacée (« je joue ou je jette ? ») */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }
  var DAY = 86400000, STEPS = [1, 3, 7, 21];
  var SU = [['♠', 0], ['♥', 1], ['♦', 1], ['♣', 0]];
  var C = null; // séance en cours
  function store() { var p = PA.player(); p.cards = p.cards || {}; return p.cards; }
  function due() { var s = store(), now = Date.now(); return Object.keys(s).filter(function (k) { return s[k].due <= now; }); }
  function key(sit, hand) { return [sit.pos, PA.depthKey(sit.bb), hand].join('|'); }
  function suitsFor(hand) {
    var a = Math.floor(Math.random() * 4), b = (a + 1 + Math.floor(Math.random() * 3)) % 4;
    if (hand.length === 3 && hand[2] === 's') b = a;
    return [a, b];
  }
  function cardHtml(r, s) { var su = SU[s]; return '<div class="pc' + (su[1] ? ' red' : '') + '" style="width:92px;height:128px;font-size:1.6em"><span class="r">' + (r === 'T' ? '10' : r) + '</span><span class="s">' + su[0] + '</span></div>'; }
  function newCard(prof, k) {
    if (k) { var it = store()[k]; return { sit: it.sit, hand: it.hand, k: k, review: true, suits: suitsFor(it.hand) }; }
    var bb = Math.random() < 0.7 ? 100 : (Math.random() < 0.5 ? 30 : 10);
    var q = PA.makeQuestion(prof, { kind: bb <= 15 ? 'push' : 'open', sit: { type: 'open', pos: PA.POS[Math.floor(Math.random() * 8)], bb: bb } });
    return { sit: q.sit, hand: q.hand, k: key(q.sit, q.hand), review: false, suits: suitsFor(q.hand) };
  }
  function start() {
    var p = PA.player(), prof = p.profile || 'tag', d = due().slice(0, 12), list = d.map(function (k) { return newCard(prof, k); });
    while (list.length < 20) list.push(newCard(prof));
    list.sort(function () { return Math.random() - 0.5; });
    C = { list: list, i: 0, ok: 0, ans: null, missed: 0, prof: prof };
  }
  function answerFor(c) { var a = PA.actionFor(C.prof, c.sit, c.hand); return a && a !== 'fold' ? a : 'fold'; }
  function answer(play) {
    var c = C.list[C.i], want = answerFor(c), right = (want !== 'fold') === play, s = store();
    C.ans = { play: play, right: right, want: want };
    if (right) { C.ok++; var it = s[c.k]; if (it && c.review) { it.box++; if (it.box >= STEPS.length) delete s[c.k]; else it.due = Date.now() + STEPS[it.box] * DAY; } }
    else { C.missed++; s[c.k] = { sit: c.sit, hand: c.hand, box: 0, due: Date.now() + DAY }; }
    PA.save();
    try { if (navigator.vibrate && PA.player().settings.vibrate) navigator.vibrate(right ? 20 : [60, 40, 60]); } catch (e) {}
  }
  function actLabel(a, sit) {
    if (a === 'fold') return 'jeter';
    if (a === 'allin') return 'tapis';
    return 'ouvrir à ' + String(PA.openBB(sit.pos, sit.bb)).replace('.', ',') + ' BB';
  }
  // questions du jour ouvertes depuis le widget Android : #cartes?q=BTN|100|K9o|k (k = rang de 0 à 4)
  function fromHash() {
    var m = /[?&]q=([^&]+)/.exec(location.hash); if (!m) return;
    var p = decodeURIComponent(m[1]).split('|'); if (p.length < 3 || PA.POS.indexOf(p[0]) < 0 || PA.HANDS.indexOf(p[2]) < 0) return;
    var dk = p[3] !== undefined ? parseInt(p[3], 10) || 0 : 0;
    var pl = PA.player(); if (!pl) return;
    var sit = { type: 'open', pos: p[0], bb: +p[1] || 100 };
    C = { list: [{ sit: sit, hand: p[2], k: key(sit, p[2]), review: false, suits: suitsFor(p[2]) }], i: 0, ok: 0, ans: null, missed: 0, prof: pl.profile || 'tag', daily: true, dk: dk };
    history.replaceState(null, '', '#cartes');
  }
  function view() {
    var ui = U();
    if (/[?&]q=/.test(location.hash)) fromHash();
    if (!C) {
      var n = due().length, total = Object.keys(store()).length;
      return ui.shell('entrainer', '<div class="stack"><button class="back" data-act="nav" data-v="entrainer">‹ S’entraîner</button><h1>Cartes</h1>' +
        ui.yo('Vingt cartes rapides : tout le monde s’est couché jusqu’à toi, tu joues ou tu jettes ? Les cartes ratées reviennent demain, puis dans 3, 7 et 21 jours, jusqu’à ce qu’elles soient acquises.') +
        '<div class="grid2"><div class="card"><div class="muted small">À revoir aujourd’hui</div><div class="disp" style="font-size:36px">' + n + '</div></div><div class="card"><div class="muted small">En révision</div><div class="disp" style="font-size:36px">' + total + '</div></div></div>' +
        '<button class="btn gold block" data-kact="start">Commencer 20 cartes</button></div>');
    }
    if (C.i >= C.list.length) {
      var pct = Math.round(C.ok / C.list.length * 100);
      if (C.daily) {
        var more = C.nextQ !== undefined ? C.nextQ : (C.dk < 4 ? 'local' : '');
        var msg = (C.ok ? 'Bonne réponse.' : 'Raté : cette main reviendra dans tes cartes demain.') + (more ? ' Question ' + (C.dk + 1) + ' sur 5 faite.' : ' Tes 5 questions du jour sont faites, bravo ! À demain.');
        return ui.shell('entrainer', '<div class="stack"><h1>Questions du jour</h1>' + ui.yo(msg) + '<div class="row">' + (more ? '<button class="btn gold" data-kact="dnext" style="flex:1">Question suivante (' + (C.dk + 2) + '/5)</button><button class="btn" data-kact="quit">Terminer pour aujourd’hui</button>' : '<button class="btn gold" data-kact="start" style="flex:1">Faire 20 cartes</button><button class="btn" data-kact="quit">Terminer</button>') + '</div></div>', true);
      }
      var body = '<div class="stack"><h1>Bilan</h1>' + ui.yo(pct >= 90 ? 'Excellent : ta range est presque automatique.' : (pct >= 70 ? 'Bonne séance. Les cartes ratées reviennent demain.' : 'On a du travail, et c’est normal. Les cartes ratées reviennent demain, regarde ta range d’ici là.')) +
        '<div class="grid2"><div class="card"><div class="muted small">Bonnes réponses</div><div class="disp" style="font-size:40px">' + C.ok + ' / ' + C.list.length + '</div></div><div class="card"><div class="muted small">À revoir demain</div><div class="disp" style="font-size:40px">' + C.missed + '</div></div></div>' +
        '<div class="row"><button class="btn gold" data-kact="start" style="flex:1">Encore 20 cartes</button><button class="btn" data-kact="quit">Terminer</button></div></div>';
      return ui.shell('entrainer', body, true);
    }
    var c = C.list[C.i], H = c.hand, sit = c.sit, depth = sit.bb > 40 ? 'Tapis profond' : (sit.bb >= 20 ? sit.bb + ' BB' : PA.nearestPush(sit.bb) + ' BB (tapis ou fold)');
    var out = '<div class="stack" style="max-width:520px;margin:0 auto"><div class="row" style="justify-content:space-between"><button class="back" data-kact="quit">‹ Arrêter</button><span class="muted small">' + (C.i + 1) + ' / ' + C.list.length + (c.review ? ' · révision' : '') + '</span></div>' +
      '<div class="card stack" style="align-items:center;text-align:center;gap:14px"><div class="row" style="gap:8px"><span class="chip">' + PA.POS_LABEL[sit.pos] + '</span><span class="chip" style="border-color:#555;color:#c9c9cf">' + depth + '</span></div>' +
      '<div class="small muted">Tout le monde s’est couché jusqu’à toi.</div>' +
      '<div class="row" style="gap:10px;justify-content:center">' + cardHtml(H[0], c.suits[0]) + cardHtml(H[1], c.suits[1]) + '</div>';
    if (!C.ans) out += '<div class="row" style="width:100%;gap:10px"><button class="btn" data-kact="ans" data-v="0" style="flex:1;min-height:64px;font-size:1.15em">Je jette</button><button class="btn gold" data-kact="ans" data-v="1" style="flex:1;min-height:64px;font-size:1.15em">Je joue</button></div>';
    else out += '<div class="disp" style="font-size:30px;color:' + (C.ans.right ? '#4fe08f' : '#ff8080') + '">' + (C.ans.right ? 'Bien joué' : 'Raté') + '</div><div>Ta range : <b>' + actLabel(C.ans.want, sit) + '</b></div><button class="btn gold block" data-kact="next">Carte suivante</button>';
    out += '</div>' + (C.ans && !C.ans.right ? '<button class="btn" data-kact="range">Voir cette case dans ma range</button>' : '') + '</div>';
    return ui.shell('entrainer', out, true);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-kact]') : null; if (!t) return;
    var a = t.getAttribute('data-kact');
    if (a === 'start') start();
    else if (a === 'ans') { if (!C.ans) { answer(t.getAttribute('data-v') === '1'); if (C.daily && window.PAAndroid && PAAndroid.widgetNext) { try { C.nextQ = PAAndroid.widgetNext(); } catch (e2) {} } } }
    else if (a === 'dnext') {
      var nq = C.nextQ, dk = C.dk + 1;
      if (nq && nq !== 'local') { location.hash = '#cartes?q=' + encodeURIComponent(nq); return; }
      var c2 = newCard(C.prof); C = { list: [c2], i: 0, ok: 0, ans: null, missed: 0, prof: C.prof, daily: true, dk: dk };
    }
    else if (a === 'next') { C.i++; C.ans = null; }
    else if (a === 'quit') { C = null; location.hash = '#entrainer'; }
    else if (a === 'range') { var c = C.list[C.i]; if (window.PA_UI_openRange) window.PA_UI_openRange({ sit: c.sit, hand: c.hand }); return; }
    U().render();
  });
  document.addEventListener('keydown', function (e) {
    if (!C || location.hash !== '#cartes' || C.i >= C.list.length) return;
    if (!C.ans && (e.key === 'ArrowLeft' || e.key === 'j')) { answer(false); U().render(); }
    else if (!C.ans && (e.key === 'ArrowRight' || e.key === 'o')) { answer(true); U().render(); }
    else if (C.ans && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); C.i++; C.ans = null; U().render(); }
  });
  window.PA_CARDS = { view: view, due: function () { return PA.player() ? due().length : 0; } };
})();
