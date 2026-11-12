/* Poker Academy — les mains du club commentées : une main jouée au club, le commentaire de Lionel et une question.
   Elles sont rangées avec le championnat, donc partagées par la synchronisation (appli complète, appli Club, PC, téléphones). */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  function LG() { return window.PA_LEAGUE; }
  var SU = { s: ['♠', 0], h: ['♥', 1], d: ['♦', 1], c: ['♣', 0] };
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // « AhQd », « Ah Qd », « A♥ Q♦ » → cartes ; sinon le texte tel quel
  function norm(str) { return String(str || '').replace(/♠/g, 's').replace(/♥/g, 'h').replace(/♦/g, 'd').replace(/♣/g, 'c').replace(/10/g, 'T').replace(/\s+/g, ''); }
  function cards(str) {
    var n = norm(str); if (!n) return '';
    if (!/^([2-9TJQKA][shdc])+$/i.test(n)) return '<span>' + esc(str) + '</span>';
    var o = ''; for (var i = 0; i < n.length; i += 2) { var r = n[i].toUpperCase(), s = SU[n[i + 1].toLowerCase()]; o += '<span class="pq-card small' + (s[1] ? ' red' : '') + '">' + (r === 'T' ? '10' : r) + '<small>' + s[0] + '</small></span>'; }
    return '<div class="pq-hand">' + o + '</div>';
  }
  var V = { edit: null, ans: {}, err: '' };
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fdate(s) { return s && s.length === 10 ? s.slice(8) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : ''; }
  var INP = 'width:100%;box-sizing:border-box;font-size:17px;padding:10px;border-radius:10px;border:1px solid rgba(212,175,55,.4);background:var(--panel2,#1c1c22);color:#fff';
  function form(h) {
    h = h || {}; var p = window.PA.player();
    var f = function (id, lab, val, ph, ta) { return '<label class="small muted" for="' + id + '">' + lab + '</label>' + (ta ? '<textarea id="' + id + '" rows="3" placeholder="' + esc(ph) + '" style="' + INP + '">' + esc(val) + '</textarea>' : '<input id="' + id + '" type="text" value="' + esc(val) + '" placeholder="' + esc(ph) + '" style="' + INP + '">'); };
    return '<div class="card stack"><b>' + (h.id ? 'Modifier la main' : 'Ajouter une main du club') + '</b>' +
      f('mcTitle', 'Titre', h.title, 'AQ face au 3-bet du bouton') +
      f('mcDate', 'Date (AAAA-MM-JJ)', h.date || today(), '2026-11-12') +
      f('mcSit', 'La situation', h.sit, 'Mercredi, niveau 6 (200/400), 35 BB, tu es au cut-off', true) +
      f('mcCards', 'Tes cartes', h.cards, 'AhQd') +
      f('mcBoard', 'Le board (facultatif)', h.board, 'Kd8s3c 2d') +
      f('mcPlay', 'Le déroulé du coup', h.play, 'Tu ouvres à 2 BB, le bouton relance à 6 BB…', true) +
      f('mcQ', 'La question', h.q, 'Que fais-tu ?') +
      f('mcOpts', 'Les réponses possibles, une par ligne (2 à 4)', (h.o || []).join('\n'), 'Se coucher\nPayer\nTapis', true) +
      f('mcGood', 'Numéro de la bonne réponse', h.o ? String((h.a || 0) + 1) : '', '2') +
      f('mcCom', 'Le commentaire de Lionel', h.com, 'Ici, AQ est trop fort pour se coucher…', true) +
      f('mcBy', 'Commenté par', h.by || (window.PA_CLUB ? 'Lionel' : (p && p.pseudo) || ''), 'Lionel') +
      '<div class="err" id="mcErr">' + esc(V.err) + '</div>' +
      '<div class="row"><button class="btn gold" style="flex:1" data-mc="save">Enregistrer</button><button class="btn" data-mc="cancel">Annuler</button></div></div>';
  }
  function handCard(h) {
    var ans = V.ans[h.id], out = '<div class="card stack" id="mc-' + h.id + '"><div class="row" style="justify-content:space-between;align-items:flex-start"><b>' + esc(h.title) + '</b><span class="small muted">' + fdate(h.date) + '</span></div>';
    if (h.sit) out += '<div>' + esc(h.sit) + '</div>';
    if (h.cards) out += '<div class="small muted">Tes cartes</div>' + cards(h.cards);
    if (h.board) out += '<div class="small muted">Le board</div>' + cards(h.board);
    if (h.play) out += '<div>' + esc(h.play) + '</div>';
    if (h.q) out += '<div><b>' + esc(h.q) + '</b></div>';
    if (h.o && h.o.length) {
      if (ans == null) out += h.o.map(function (o, i) { return '<button class="btn block" data-mc="ans" data-id="' + h.id + '" data-i="' + i + '">' + esc(o) + '</button>'; }).join('');
      else out += '<div class="pq-res ' + (ans === h.a ? 'ok' : 'ko') + '">' + (ans === h.a ? 'Oui : ' : 'Non. La bonne réponse : ') + esc(h.o[h.a]) + '</div>';
    }
    if ((ans != null || !h.o || !h.o.length) && h.com) out += U().yo((h.by ? esc(h.by) + ' : ' : '') + esc(h.com));
    out += '<div class="row" style="gap:8px"><button class="btn" data-mc="edit" data-id="' + h.id + '">Modifier</button><button class="btn" data-mc="del" data-id="' + h.id + '">Supprimer</button>' + (ans != null ? '<button class="btn" data-mc="again" data-id="' + h.id + '">Rejouer</button>' : '') + '</div>';
    return out + '</div>';
  }
  function view() {
    var ui = U(), L = LG(), list = L ? L.hands() : [];
    var out = '<div class="stack"><button class="back" data-act="nav" data-v="' + (window.PA_CLUB ? 'home' : 'club') + '">‹ ' + (window.PA_CLUB ? 'Accueil' : 'Club') + '</button><h1>Mains du club</h1>' +
      '<div class="small muted">Une main jouée au club, la question à se poser et le commentaire de Lionel. Elles sont partagées avec le championnat : toutes tes applis synchronisées les reçoivent.</div>';
    if (V.edit) out += form(V.edit === 'new' ? null : list.filter(function (h) { return h.id === V.edit; })[0]);
    else out += '<button class="btn gold block" data-mc="new">Ajouter une main</button>';
    out += list.length ? list.map(handCard).join('') : ui.yo('Pas encore de main. Après un tournoi, note un coup intéressant et demande son avis à Lionel : c’est comme ça qu’on progresse au club.');
    return ui.shell(window.PA_CLUB ? 'home' : 'club', out + '</div>');
  }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-mc]') : null; if (!t) return;
    var a = t.getAttribute('data-mc'), id = t.getAttribute('data-id'), L = LG();
    if (a === 'new') { V.edit = 'new'; V.err = ''; }
    else if (a === 'cancel') { V.edit = null; V.err = ''; }
    else if (a === 'edit') { V.edit = id; V.err = ''; }
    else if (a === 'del') { if (typeof confirm === 'function' && !confirm('Supprimer cette main ?')) return; L.delHand(id); }
    else if (a === 'ans') { V.ans[id] = Number(t.getAttribute('data-i')); }
    else if (a === 'again') { delete V.ans[id]; }
    else if (a === 'save') {
      var opts = val('mcOpts').split('\n').map(function (x) { return x.trim(); }).filter(Boolean), good = parseInt(val('mcGood'), 10);
      var err = !val('mcTitle') ? 'Donne un titre à la main.' : (opts.length && (opts.length < 2 || opts.length > 4)) ? 'Mets 2 à 4 réponses possibles, une par ligne.' : (opts.length && !(good >= 1 && good <= opts.length)) ? 'Indique le numéro de la bonne réponse (1 à ' + opts.length + ').' : (opts.length && !val('mcQ')) ? 'Écris la question.' : '';
      if (err) { V.err = err; var el = document.getElementById('mcErr'); if (el) el.textContent = err; return; }
      var old = V.edit !== 'new' ? L.hands().filter(function (h) { return h.id === V.edit; })[0] : null;
      var h = Object.assign({}, old || {}, { title: val('mcTitle'), date: val('mcDate') || today(), sit: val('mcSit'), cards: val('mcCards'), board: val('mcBoard'), play: val('mcPlay'), q: val('mcQ'), o: opts, a: opts.length ? good - 1 : 0, com: val('mcCom'), by: val('mcBy') });
      L.saveHand(h); V.edit = null; V.err = '';
    }
    U().render();
  });
  document.addEventListener('input', function (e) { if (e.target && /^mc/.test(e.target.id || '') && V.err) { V.err = ''; var el = document.getElementById('mcErr'); if (el) el.textContent = ''; } });
  window.PA_MAINSCLUB = { view: view };
})();
