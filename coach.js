/* Poker Academy — mode coach : Lionel transforme une main du club en quiz, partagé par un lien.
   Chaque membre répond, puis voit la réponse de Lionel et celle du solveur. Aucun serveur : tout est dans le lien. */
(function () {
  'use strict';
  var BASE = 'https://ngossartng-dev.github.io/poker-academy/';
  var R = 'AKQJT98765432', SUITS = ['s', 'h', 'd', 'c'], SU = { s: '♠', h: '♥', d: '♦', c: '♣' };
  function U() { return window.PA_UI; }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cardH(c) { var red = c[1] === 'h' || c[1] === 'd'; return '<span class="apf-c' + (red ? ' red' : '') + '">' + (c[0] === 'T' ? '10' : c[0]) + SU[c[1]] + '</span>'; }
  function enc(o) { var s = unescape(encodeURIComponent(JSON.stringify(o))); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(t) { try { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; return JSON.parse(decodeURIComponent(escape(atob(t)))); } catch (e) { return null; } }

  /* ---------- Composer (Lionel) ---------- */
  var C = { pos: null, sc: null, cards: [], sit: '', q: 'Que fais-tu ?', o: ['Check', 'Miser', 'Tapis'], a: 0, why: '', by: '', link: '' };
  function scens() { return C.pos && window.PA_APF ? window.PA_APF.scenarios(C.pos) : []; }
  function compose() {
    var ui = U();
    if (window.PA_SOLVER && !window.PA_SOLVER.data()) window.PA_SOLVER.loadData(function () { ui.render(); });
    if (!C.by) { var p = window.PA.player(); C.by = p && /lionel|yo/i.test(p.pseudo || '') ? 'Yo' : (p ? p.pseudo : ''); }
    var out = '<div class="stack"><button class="back" data-act="nav" data-v="club">‹ Club</button><h1>Mode coach</h1>' +
      ui.yo('Une main du club devient un quiz : tu la décris, tu donnes ta réponse, et l’appli fabrique un lien à partager sur le groupe du club. Chacun répond, puis voit ta réponse et celle du solveur.') +
      '<div class="card stack"><b>1. Position du joueur et avant le flop</b><div class="seg">' + (window.PA_APF ? window.PA_APF.positions : []).map(function (p) { return '<button class="' + (C.pos === p[0] ? 'on' : '') + '" data-co="pos" data-v="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      (C.pos ? '<div class="apf-list">' + scens().map(function (s, i) { return '<button class="btn' + (C.sc && C.sc[0] === s[0] && C.sc[1] === s[1] ? ' gold' : '') + '" data-co="sc" data-v="' + i + '">' + s[2] + '</button>'; }).join('') + '</div>' : '') + '</div>';
    if (C.sc) {
      var sel = C.cards;
      out += '<div class="card stack"><b>2. Le flop, puis la main du joueur</b><div class="row apf-slots"><span class="small muted">Flop</span>' + [0, 1, 2].map(function (i) { return sel[i] ? cardH(sel[i]) : '<span class="apf-c empty"></span>'; }).join('') + '<span class="small muted">Main</span>' + [3, 4].map(function (i) { return sel[i] ? cardH(sel[i]) : '<span class="apf-c empty"></span>'; }).join('') + '<button class="btn" data-co="clear">Effacer</button></div>' +
        '<div class="apf-grid">' + SUITS.map(function (s) { return R.split('').reverse().map(function (r) { var c = r + s, i = sel.indexOf(c); return '<button data-co="card" data-v="' + c + '"' + (i >= 0 ? ' class="on"' : '') + '>' + cardH(c) + '</button>'; }).join(''); }).join('') + '</div></div>';
    }
    if (C.sc && C.cards.length === 5) {
      out += '<div class="card stack"><b>3. La question</b>' +
        '<label class="small muted">Le contexte (tournoi, jetons, ce qui s’est passé)</label><textarea class="co-in" rows="3" data-cof="sit" placeholder="Tournoi du vendredi, 25 BB, blindes 400/800. Le bouton ouvre à 2 BB, je paie en grosse blinde. Il mise un tiers du pot au flop.">' + esc(C.sit) + '</textarea>' +
        '<label class="small muted">La question</label><input class="co-in" data-cof="q" value="' + esc(C.q) + '">' +
        '<label class="small muted">Les réponses possibles (coche la bonne)</label>' + [0, 1, 2, 3].map(function (k) { return '<div class="row" style="gap:8px;align-items:center"><input type="radio" name="coa" data-coa="' + k + '"' + (C.a === k ? ' checked' : '') + ' style="width:22px;height:22px"><input class="co-in" style="flex:1" data-cof="o' + k + '" value="' + esc(C.o[k] || '') + '" placeholder="' + (k === 3 ? '(facultatif)' : '') + '"></div>'; }).join('') +
        '<label class="small muted">Ton explication</label><textarea class="co-in" rows="4" data-cof="why" placeholder="Pourquoi c’est la bonne réponse, ce que tu as vu au club…">' + esc(C.why) + '</textarea>' +
        '<label class="small muted">Signé</label><input class="co-in" data-cof="by" value="' + esc(C.by) + '">' +
        '<button class="btn gold block" data-co="make">Créer le lien du quiz</button>' +
        (C.link ? '<div class="small" style="word-break:break-all;background:#101014;border-radius:8px;padding:8px">' + esc(C.link) + '</div><div class="row"><button class="btn gold" data-co="share">Partager</button><button class="btn" data-co="copy">Copier le lien</button><a class="btn" href="' + C.link.replace(BASE, '') + '">Voir le quiz</a></div>' : '') + '</div>';
    }
    return ui.shell('club', out + '</div>');
  }
  function quizData() {
    var o = C.o.filter(function (x) { return x && x.trim(); });
    return { v: 1, pos: C.pos, spot: C.sc[0], side: C.sc[1], pre: C.sc[2], f: C.cards.slice(0, 3).join(''), h: C.cards.slice(3).join(''), sit: C.sit, q: C.q, o: o, a: Math.min(C.a, o.length - 1), why: C.why, by: C.by };
  }

  /* ---------- Répondre (membres du club) ---------- */
  var A = { key: null, d: null, ans: null };
  function quiz() {
    var ui = U(), m = /[?&]d=([^&]+)/.exec(location.hash);
    if (m && m[1] !== A.key) { A.key = m[1]; A.d = dec(m[1]); A.ans = null; }
    var d = A.d, standalone = !window.PA.player();
    var head = '<div class="stack">' + (standalone ? '' : '<button class="back" data-act="nav" data-v="home">‹ Accueil</button>') + '<h1>Quiz du club</h1>';
    if (!d || !d.f || !d.o) return wrap(head + ui.yo('Ce lien de quiz est incomplet. Demande à ton coach de te le renvoyer.') + '</div>', standalone);
    var cards = function (s) { var o = ''; for (var i = 0; i < s.length; i += 2) o += cardH(s.substr(i, 2)); return o; };
    var out = head + '<div class="small muted">Une main proposée par ' + esc(d.by || 'ton coach') + '.</div>' +
      '<div class="card stack"><div class="small muted">' + esc(d.pre || '') + '</div>' + (d.sit ? '<div>' + esc(d.sit).replace(/\n/g, '<br>') + '</div>' : '') +
      '<div class="row" style="gap:14px;flex-wrap:wrap"><div><div class="small muted">Flop</div><div class="row">' + cards(d.f) + '</div></div><div><div class="small muted">Ta main</div><div class="row">' + cards(d.h) + '</div></div></div>' +
      '<div style="font-size:1.15em"><b>' + esc(d.q || 'Que fais-tu ?') + '</b></div></div>';
    if (A.ans === null) out += '<div class="stack">' + d.o.map(function (o, k) { return '<button class="btn block" data-cq="' + k + '">' + esc(o) + '</button>'; }).join('') + '</div>';
    else {
      var good = A.ans === d.a;
      out += '<div class="pq-res ' + (good ? 'ok' : 'ko') + '">' + (good ? 'Comme ' : 'Pas comme ') + esc(d.by || 'le coach') + ' : ' + esc(d.o[d.a]).toLowerCase() + '.</div>' +
        '<div class="card stack"><b>La réponse de ' + esc(d.by || 'ton coach') + '</b><div>' + (d.why ? esc(d.why).replace(/\n/g, '<br>') : esc(d.o[d.a]) + '.') + '</div></div>' +
        '<button class="btn gold block" data-cq="solver">Ce que fait le solveur</button>' +
        (standalone ? '<a class="btn block" href="#home">Découvrir Poker Academy</a>' : '');
    }
    return wrap(out + '</div>', standalone);
  }
  function wrap(html, standalone) { return standalone ? '<main class="main" style="max-width:720px;margin:0 auto;padding:16px">' + html + '</main>' : U().shell('home', html); }

  function toast(t) { var b = document.createElement('div'); b.textContent = t; b.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#1b1b20;border:2px solid #ffd23f;border-radius:10px;padding:8px 14px;z-index:9999'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  document.addEventListener('input', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-cof'); if (!f) return;
    if (f[0] === 'o' && f.length === 2) C.o[+f[1]] = e.target.value; else C[f] = e.target.value; C.link = '';
  });
  document.addEventListener('change', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-coa'); if (k !== null && k !== undefined) { C.a = +k; C.link = ''; } });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-co],[data-cq]') : null; if (!t) return;
    var a = t.getAttribute('data-co'), v = t.getAttribute('data-v'), q = t.getAttribute('data-cq');
    if (q !== null) {
      if (q === 'solver') { var d = A.d; if (!window.PA.player()) { toast('Crée d’abord ton joueur dans l’appli : c’est gratuit et rapide.'); location.hash = '#home'; return; } window.PA_APF.open({ pos: d.pos, spot: d.spot, side: d.side, flop: [d.f.slice(0, 2), d.f.slice(2, 4), d.f.slice(4, 6)], hand: [d.h.slice(0, 2), d.h.slice(2, 4)] }); return; }
      if (A.ans === null) A.ans = +q; U().render(); return;
    }
    if (a === 'pos') { C.pos = v; C.sc = null; }
    else if (a === 'sc') C.sc = scens()[+v];
    else if (a === 'clear') C.cards = [];
    else if (a === 'card') { var i = C.cards.indexOf(v); if (i >= 0) C.cards.splice(i, 1); else if (C.cards.length < 5) C.cards.push(v); }
    else if (a === 'make') { var dd = quizData(); if (dd.o.length < 2) { toast('Donne au moins deux réponses.'); return; } C.link = BASE + '#quizclub?d=' + enc(dd); }
    else if (a === 'copy') { (navigator.clipboard ? navigator.clipboard.writeText(C.link) : Promise.reject()).then(function () { toast('Lien copié : colle-le sur le groupe du club.'); }, function () { toast('Sélectionne le lien et copie-le.'); }); return; }
    else if (a === 'share') { var txt = 'Quiz du club : ' + (C.q || 'que fais-tu ?') + ' Réponds ici :'; if (window.PAAndroid && PAAndroid.shareText) PAAndroid.shareText(txt + ' ' + C.link); else if (navigator.share) navigator.share({ title: 'Quiz du club', text: txt, url: C.link }).catch(function () {}); else { (navigator.clipboard ? navigator.clipboard.writeText(C.link) : Promise.reject()).then(function () { toast('Lien copié : colle-le sur le groupe du club.'); }, function () {}); } return; }
    if (a) { C.link = a === 'make' ? C.link : ''; U().render(); }
  });
  window.PA_COACH = { compose: compose, quiz: quiz, enc: enc, dec: dec };
})();
