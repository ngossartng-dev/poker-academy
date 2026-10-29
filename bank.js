/* Poker Academy v2.0 — Bankroll : journal des tournois, résultats, repères et simulateur de variance */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }
  function num(v) { return parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0; }
  function eur(x) { return (x < 0 ? '−' : '') + Math.abs(Math.round(x * 100) / 100).toFixed(2).replace('.', ',') + ' €'; }
  function pct(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ',') + ' %'; }
  function today() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function bank() { var p = PA.player(); p.bank = p.bank || { start: 0, log: [] }; return p.bank; }
  var B = { tab: 'journal', edit: null, form: null, src: 'all', sim: { kind: 'mtt', field: 100, roi: 20, n: 200, br: 100, res: null }, msg: null };
  var WHERE = [['winamax', 'Winamax'], ['club', 'Club'], ['live', 'Live']];

  function totals(log) {
    var T = { n: 0, cost: 0, won: 0, itm: 0 };
    log.forEach(function (x) { var c = num(x.bi) * Math.max(1, num(x.ent || 1)); T.n++; T.cost += c; T.won += num(x.won); if (num(x.won) > 0) T.itm++; });
    T.profit = T.won - T.cost; T.roi = T.cost ? T.profit / T.cost * 100 : 0; return T;
  }
  function curve(log, start) {
    var pts = [start], v = start; log.forEach(function (x) { v += num(x.won) - num(x.bi) * Math.max(1, num(x.ent || 1)); pts.push(v); });
    if (pts.length < 2) return '';
    var W = 340, H = 140, mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts); if (mx === mn) { mx += 1; mn -= 1; }
    var x = function (i) { return 8 + i * (W - 16) / (pts.length - 1); }, y = function (v2) { return 8 + (mx - v2) * (H - 16) / (mx - mn); };
    var path = pts.map(function (v2, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v2).toFixed(1); }).join(' ');
    var zero = start >= mn && start <= mx ? '<line x1="8" x2="' + (W - 8) + '" y1="' + y(start).toFixed(1) + '" y2="' + y(start).toFixed(1) + '" stroke="#555" stroke-dasharray="4 4"/>' : '';
    var last = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="Courbe de la bankroll">' + zero + '<path d="' + path + '" fill="none" stroke="' + (last >= start ? '#4fe08f' : '#ff8080') + '" stroke-width="3" stroke-linejoin="round"/></svg>';
  }
  function input(id, val, w, mode) { return '<input id="' + id + '" value="' + U().esc(String(val === undefined ? '' : val)) + '"' + (mode ? ' inputmode="' + mode + '"' : '') + ' style="width:' + (w || 120) + 'px;min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit">'; }
  function field(label, id, val, w, mode) { return '<label class="row" style="justify-content:space-between;gap:10px"><span>' + label + '</span>' + input(id, val, w, mode) + '</label>'; }
  function seg(k, opts, cur) { return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (String(cur) === String(o[0]) ? 'on' : '') + '" data-bact="set" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }

  /* ---------- Journal ---------- */
  function journalTab() {
    var b = bank(), ui = U(), log = b.log.filter(function (x) { return B.src === 'all' || x.where === B.src; }), T = totals(log), all = totals(b.log);
    var br = num(b.start) + all.profit;
    var form = '';
    if (B.form) {
      var f = B.form;
      form = '<div class="card stack"><b>' + (f.id ? 'Modifier le résultat' : 'Ajouter un tournoi') + '</b>' + seg('fwhere', WHERE, f.where) +
        field('Date', 'bD', f.d, 150) + field('Nom du tournoi', 'bN', f.name, 180) + field('Buy-in (€)', 'bBI', f.bi, 100, 'decimal') + field('Nombre d’entrées', 'bE', f.ent, 100, 'numeric') +
        field('Gains (€)', 'bW', f.won, 100, 'decimal') + field('Place', 'bP', f.place, 100, 'numeric') + field('Joueurs', 'bF', f.field, 100, 'numeric') +
        '<label class="stack" style="gap:4px"><span class="small muted">Note</span><textarea id="bNote" rows="2" style="background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:8px;font:inherit">' + ui.esc(f.note || '') + '</textarea></label>' +
        '<div class="row"><button class="btn gold" data-bact="save" style="flex:1">Enregistrer</button><button class="btn" data-bact="cancel">Annuler</button>' + (f.id ? '<button class="btn" data-bact="del" style="border-color:#e03131;color:#ff8080">' + (B.armDel ? 'Confirmer' : 'Supprimer') + '</button>' : '') + '</div></div>';
    }
    var rows = log.slice().reverse().slice(0, 60).map(function (x) {
      var c = num(x.bi) * Math.max(1, num(x.ent || 1)), pr = num(x.won) - c;
      return '<tr data-bact="edit" data-v="' + x.id + '" style="cursor:pointer"><td>' + x.d.split('-').reverse().join('/') + '<div class="small muted">' + ui.esc(x.name || '') + (x.place ? ' · ' + x.place + '<sup>e</sup>' + (x.field ? '/' + x.field : '') : '') + '</div></td><td>' + eur(c) + '</td><td style="color:' + (pr >= 0 ? '#4fe08f' : '#ff8080') + '">' + eur(pr) + '</td></tr>';
    }).join('');
    var sumN = window.PA_HH ? Object.keys(window.PA_HH.loadDB().sum || {}).length : 0;
    return '<div class="card stack"><div class="row" style="justify-content:space-between"><b>Ma bankroll</b><span class="disp" style="font-size:28px;color:' + (br >= num(b.start) ? '#4fe08f' : '#ff8080') + '">' + eur(br) + '</span></div>' +
      field('Capital de départ réservé au poker (€)', 'bStart', b.start || '', 110, 'decimal') + '<button class="btn" data-bact="saveStart">Enregistrer le capital</button>' + curve(b.log, num(b.start)) + '</div>' +
      '<div class="seg">' + [['all', 'Tout']].concat(WHERE).map(function (o) { return '<button class="' + (B.src === o[0] ? 'on' : '') + '" data-bact="src" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<div class="grid2"><div class="card"><div class="muted small">Tournois</div><div class="disp" style="font-size:30px">' + T.n + '</div><div class="small muted">dans l’argent : ' + (T.n ? pct(T.itm / T.n * 100) : '—') + '</div></div>' +
      '<div class="card"><div class="muted small">Résultat</div><div class="disp" style="font-size:30px;color:' + (T.profit >= 0 ? '#4fe08f' : '#ff8080') + '">' + eur(T.profit) + '</div><div class="small muted">ROI ' + (T.cost ? pct(T.roi) : '—') + ' · misé ' + eur(T.cost) + '</div></div></div>' +
      (B.msg ? ui.yo(B.msg) : '') +
      (form || '<div class="row" style="flex-wrap:wrap"><button class="btn gold" data-bact="new">Ajouter un tournoi</button>' + (sumN ? '<button class="btn" data-bact="importW">Reprendre mes résultats Winamax (' + sumN + ')</button>' : '') + '</div>') +
      (rows ? '<div class="card stack"><b>Derniers tournois</b><div class="small muted">Touche une ligne pour la modifier.</div><table class="tbl"><tr><th>Date</th><th>Coût</th><th>Résultat</th></tr>' + rows + '</table></div>' : '') +
      (T.n && T.n < 100 ? '<p class="small muted">Avec ' + T.n + ' tournois, le ROI ne veut presque rien dire : en tournoi, il en faut plusieurs centaines. Juge tes décisions (Analyser), pas ce chiffre.</p>' : '');
  }
  function reperesTab() {
    var b = bank(), all = totals(b.log), br = num(b.start) + all.profit, avg = all.n ? all.cost / all.n : 0;
    var lines = br > 0 ? [['Tournois multi-tables (100 à 200 buy-ins)', eur(br / 200) + ' à ' + eur(br / 100)], ['Sit & Go (50 à 100 buy-ins)', eur(br / 100) + ' à ' + eur(br / 50)]] : [];
    var msg = !br ? 'Entre ton capital de départ dans le journal pour voir tes repères.' : (avg ? 'Ton buy-in moyen est de ' + eur(avg) + ', soit ' + Math.round(br / avg) + ' buy-ins de bankroll. ' + (br / avg >= 100 ? 'Tu es dans les clous pour les tournois.' : (br / avg >= 50 ? 'Assez pour des Sit & Go ; un peu court pour des tournois multi-tables à ce niveau.' : 'C’est court : baisse un peu le niveau des tournois, ou joue des freerolls et des tournois moins chers.')) : 'Ajoute quelques tournois pour comparer ton buy-in moyen à ta bankroll.');
    return '<div class="card stack"><b>Repères du cours (chapitre 4)</b><div>Bankroll actuelle : <b>' + eur(br) + '</b></div>' +
      (lines.length ? '<table class="tbl"><tr><th>Format</th><th>Buy-in conseillé</th></tr>' + lines.map(function (l) { return '<tr><td>' + l[0] + '</td><td><b>' + l[1] + '</b></td></tr>'; }).join('') + '</table>' : '') + '</div>' + U().yo(msg + ' Règles à fixer à froid : monter quand la bankroll atteint 150 buy-ins du niveau supérieur, redescendre sous 80. Les re-entries comptent comme des buy-ins.');
  }

  /* ---------- Simulateur de variance ---------- */
  function payouts(kind, field) {
    if (kind === 'sng') return { paid: [0.5, 0.3, 0.2], field: 9 };
    var P = Math.max(1, Math.round(field * 0.15)), w = [], s = 0, i;
    for (i = 0; i < P; i++) { w.push(1 / Math.pow(i + 1, 0.95)); }
    // garantit une place minimale payée d'environ 1,5 buy-in
    for (i = 0; i < P; i++) s += w[i];
    var pool = field, out = w.map(function (x) { return x / s * pool; });
    var minCash = 1.5; if (out[P - 1] < minCash) { var extra = 0; for (i = 0; i < P; i++) if (out[i] < minCash) { extra += minCash - out[i]; out[i] = minCash; } var top = out[0] + out[1] + out[2]; for (i = 0; i < Math.min(3, P); i++) out[i] -= extra * out[i] / top; }
    return { paid: out.map(function (x) { return x / field; }), field: field };
  }
  function simulate(o) {
    var kind = o.kind, field = kind === 'sng' ? 9 : Math.max(10, Math.round(o.field)), PO = payouts(kind, field), paid = PO.paid.map(function (x) { return x * field; }); // gains en buy-ins
    var P = paid.length, roi = o.roi / 100;
    // probabilité d'être payé multipliée par k, uniformément sur les places payées ; k tel que l'espérance = 1 + roi (sans rake)
    var mean = paid.reduce(function (a, b) { return a + b; }, 0) / field, k = (1 + roi) / mean;
    var pPaid = Math.min(0.95, P / field * k), pPlace = pPaid / P;
    var runs = 2000, T = Math.max(1, Math.round(o.n)), finals = [], dd = [], dry = [], ruin = 0, lossCount = 0;
    for (var r = 0; r < runs; r++) {
      var v = 0, peak = 0, maxdd = 0, cur = 0, longest = 0, ruined = false;
      for (var t = 0; t < T; t++) {
        var u = Math.random(), g = 0;
        if (u < pPaid) { var place = Math.floor(u / pPlace); g = paid[Math.min(P - 1, place)]; cur = 0; } else { cur++; if (cur > longest) longest = cur; }
        v += g - 1; if (v > peak) peak = v; if (peak - v > maxdd) maxdd = peak - v;
        if (!ruined && v <= -o.br) ruined = true;
      }
      finals.push(v); dd.push(maxdd); dry.push(longest); if (ruined) ruin++; if (v < 0) lossCount++;
    }
    var q = function (a, p) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
    return { T: T, pPaid: pPaid, p5: q(finals, 0.05), p50: q(finals, 0.5), p95: q(finals, 0.95), loss: lossCount / runs, ruin: ruin / runs, dd50: q(dd, 0.5), dd90: q(dd, 0.9), dry50: q(dry, 0.5), dry90: q(dry, 0.9) };
  }
  function simTab() {
    var S = B.sim, R = S.res, out = '';
    if (R) {
      var bi = function (x) { return (x > 0 ? '+' : '') + Math.round(x) + ' BI'; };
      out = '<div class="card stack"><b>Sur ' + R.T + ' ' + (S.kind === 'sng' ? 'Sit & Go' : 'tournois') + ' (2 000 simulations)</b><table class="tbl">' +
        '<tr><td>Résultat médian</td><td><b>' + bi(R.p50) + '</b></td></tr>' +
        '<tr><td>Mauvais scénario (1 fois sur 20)</td><td style="color:#ff8080"><b>' + bi(R.p5) + '</b></td></tr>' +
        '<tr><td>Bon scénario (1 fois sur 20)</td><td style="color:#4fe08f"><b>' + bi(R.p95) + '</b></td></tr>' +
        '<tr><td>Probabilité de finir en perte</td><td><b>' + pct(R.loss * 100) + '</b></td></tr>' +
        '<tr><td>Plus longue série sans place payée</td><td>' + R.dry50 + ' en général, ' + R.dry90 + ' une fois sur dix</td></tr>' +
        '<tr><td>Plus grosse baisse</td><td>' + Math.round(R.dd50) + ' BI en général, ' + Math.round(R.dd90) + ' une fois sur dix</td></tr>' +
        '<tr><td>Risque de perdre ' + S.br + ' buy-ins de bankroll</td><td style="color:' + (R.ruin > 0.05 ? '#ff8080' : '#4fe08f') + '"><b>' + pct(R.ruin * 100) + '</b></td></tr></table>' +
        '<div class="small muted">BI = buy-in. Modèle simplifié : environ 15 % de payés en tournoi, 50/30/20 en Sit & Go, ton avantage réparti sur les places payées.</div></div>' +
        U().yo('Même avec un ROI de ' + S.roi + ' %, tu peux rester ' + R.dry50 + ' ' + (S.kind === 'sng' ? 'Sit & Go' : 'tournois') + ' sans place payée, et perdre ' + Math.round(R.dd50) + ' buy-ins avant de remonter. C’est normal : c’est pour ça qu’on juge ses décisions, pas ses résultats.');
    }
    return '<div class="card stack"><b>Simulateur de variance</b><div class="small muted">Combien de séries sans gain sont normales pour un joueur gagnant ?</div>' +
      seg('skind', [['mtt', 'Tournois'], ['sng', 'Sit & Go 9 joueurs']], S.kind) +
      (S.kind === 'mtt' ? field('Joueurs par tournoi', 'sF', S.field, 100, 'numeric') : '') + field('Ton ROI espéré (%)', 'sR', S.roi, 100, 'decimal') + field('Nombre de ' + (S.kind === 'sng' ? 'Sit & Go' : 'tournois'), 'sN', S.n, 100, 'numeric') + field('Ta bankroll (en buy-ins)', 'sB', S.br, 100, 'numeric') +
      '<button class="btn gold" data-bact="sim">Simuler</button></div>' + out;
  }

  function view() {
    var tabs = [['journal', 'Journal'], ['reperes', 'Repères'], ['sim', 'Variance']];
    return U().shell('moi', '<div class="stack"><button class="back" data-act="nav" data-v="moi">‹ Moi</button><h1>Bankroll</h1><div class="seg">' + tabs.map(function (t) { return '<button class="' + (B.tab === t[0] ? 'on' : '') + '" data-bact="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      (B.tab === 'journal' ? journalTab() : B.tab === 'reperes' ? reperesTab() : simTab()) + '</div>');
  }
  function g(id) { var e = document.getElementById(id); return e ? e.value : null; }
  function keepForm() { if (!B.form) return; var m = { bD: 'd', bN: 'name', bBI: 'bi', bE: 'ent', bW: 'won', bP: 'place', bF: 'field', bNote: 'note' }; Object.keys(m).forEach(function (k) { var v = g(k); if (v !== null) B.form[m[k]] = v; }); }
  function keepSim() { var m = { sF: 'field', sR: 'roi', sN: 'n', sB: 'br' }; Object.keys(m).forEach(function (k) { var v = g(k); if (v !== null) B.sim[m[k]] = num(v); }); }
  function importWinamax() {
    var sum = window.PA_HH.loadDB().sum || {}, b = bank(), have = {}, n = 0;
    b.log.forEach(function (x) { if (x.wid) have[x.wid] = 1; });
    Object.keys(sum).forEach(function (id) {
      if (have[id]) return; var s = sum[id], bi = 0;
      if (s.buyin) String(s.buyin).split('+').forEach(function (p) { bi += num(p.replace('€', '')); });
      b.log.push({ id: 'b' + Date.now() + n, wid: id, where: 'winamax', d: (s.start || today()).slice(0, 10), name: s.name, bi: bi, ent: 1, won: s.won || 0, place: s.place || '', field: s.players || '', note: '' }); n++;
    });
    b.log.sort(function (a, c) { return a.d < c.d ? -1 : (a.d > c.d ? 1 : 0); }); PA.save();
    B.msg = n ? n + ' tournoi' + (n > 1 ? 's' : '') + ' Winamax ajouté' + (n > 1 ? 's' : '') + ' depuis tes fichiers « summary ». Vérifie les re-entries : elles ne sont pas toujours dans le fichier.' : 'Tous tes résultats Winamax importés sont déjà dans le journal.';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-bact]') : null; if (!t) return;
    var a = t.getAttribute('data-bact'), v = t.getAttribute('data-v'), b = bank();
    keepForm(); keepSim();
    if (a === 'tab') { B.tab = v; B.msg = null; }
    else if (a === 'src') B.src = v;
    else if (a === 'new') { B.form = { where: 'club', d: today(), name: '', bi: '', ent: 1, won: 0, place: '', field: '', note: '' }; B.armDel = false; B.msg = null; }
    else if (a === 'edit') { var x = b.log.filter(function (y) { return y.id === v; })[0]; if (x) { B.form = JSON.parse(JSON.stringify(x)); B.armDel = false; window.scrollTo(0, 0); } }
    else if (a === 'cancel') B.form = null;
    else if (a === 'save') {
      var f = B.form; if (!f.d) f.d = today();
      var rec = { id: f.id || 'b' + Date.now(), wid: f.wid, where: f.where, d: f.d, name: f.name, bi: num(f.bi), ent: Math.max(1, Math.round(num(f.ent) || 1)), won: num(f.won), place: f.place ? Math.round(num(f.place)) : '', field: f.field ? Math.round(num(f.field)) : '', note: f.note || '' };
      b.log = b.log.filter(function (y) { return y.id !== rec.id; }); b.log.push(rec); b.log.sort(function (p1, p2) { return p1.d < p2.d ? -1 : (p1.d > p2.d ? 1 : 0); }); PA.save(); B.form = null;
    }
    else if (a === 'del') { if (!B.armDel) B.armDel = true; else { b.log = b.log.filter(function (y) { return y.id !== B.form.id; }); PA.save(); B.form = null; B.armDel = false; } }
    else if (a === 'saveStart') { b.start = num(g('bStart')); PA.save(); }
    else if (a === 'importW') importWinamax();
    else if (a === 'set') { var k = t.getAttribute('data-k'); if (k === 'fwhere') B.form.where = v; else if (k === 'skind') { B.sim.kind = v; B.sim.res = null; } }
    else if (a === 'sim') B.sim.res = simulate(B.sim);
    U().render();
  });
  window.PA_BANK = { view: view, simulate: simulate, totals: totals, payouts: payouts };
})();
