/* Poker Academy v2.0 — Contenus téléchargés à la demande (podcasts et solutions du solveur)
   L'appli de base ne contient pas ces fichiers : ils viennent de GitHub Pages la première fois, puis restent sur l'appareil. */
(function () {
  'use strict';
  var BASE = 'https://ngossartng-dev.github.io/poker-academy/';
  var IS_PC = location.hostname === '127.0.0.1' && location.port === '47816';
  var IS_ANDROID = !!window.PAAndroid && !!window.PAAndroid.packUrl;
  var ST = { busy: false, done: 0, total: 0, err: 0, info: null };
  function U() { return window.PA_UI; }

  // adresse à utiliser pour un fichier de pack
  function url(rel) {
    if (IS_ANDROID) { try { return PAAndroid.packUrl(rel); } catch (e) { return BASE + rel; } }
    return rel; // PC : le serveur de l'appli télécharge et garde le fichier ; web : servi par GitHub Pages
  }
  function list(cb) {
    var out = [];
    Object.keys(window.PA_AUDIO || {}).forEach(function (n) { n = +n; out.push('audio/v2/pod' + (n < 10 ? '0' : '') + n + '.m4a'); });
    function sol() {
      var D = window.PA_SOLVER_DATA;
      if (D && D.spots) D.spots.forEach(function (s) { out.push('solver/flop/' + s.id + '.js'); (s.flops || D.flops).forEach(function (f) { out.push('solver/turn/' + s.id + '/' + f + '.js'); }); });
      cb(out);
    }
    if (window.PA_SOLVER_DATA) sol();
    else if (window.PA_SOLVER) window.PA_SOLVER.loadData(sol);
    else { var s = document.createElement('script'); s.src = 'solver/data.js'; s.onload = s.onerror = sol; document.head.appendChild(s); }
  }
  function status(cb) {
    if (IS_PC) { fetch('/api/packs', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { ST.info = j; cb && cb(j); }).catch(function () { cb && cb(null); }); return; }
    if (IS_ANDROID) { try { ST.info = JSON.parse(PAAndroid.packInfo()); } catch (e) { ST.info = null; } cb && cb(ST.info); return; }
    ST.info = null; cb && cb(null);
  }
  function prefetchAll(onprog) {
    if (ST.busy) return; ST.busy = true; ST.done = 0; ST.err = 0;
    list(function (L) {
      ST.total = L.length;
      if (IS_ANDROID && PAAndroid.packFetchAll) { PAAndroid.packFetchAll(JSON.stringify(L)); return; } // progression renvoyée par window.__paPackProg
      var i = 0, run = 0, MAX = 4;
      function next() {
        while (run < MAX && i < L.length) {
          var rel = L[i++]; run++;
          fetch(IS_PC ? rel : rel, { cache: IS_PC ? 'no-store' : 'default' }).then(function (r) { if (!r.ok) ST.err++; return r.blob(); }).catch(function () { ST.err++; }).then(function () { run--; ST.done++; onprog && onprog(); if (ST.done >= ST.total) { ST.busy = false; status(function () { onprog && onprog(); }); } else next(); });
        }
      }
      next();
    });
  }
  window.__paPackProg = function (done, total, err, finished) { ST.done = done; ST.total = total; ST.err = err; if (finished) { ST.busy = false; status(); } if (U() && /^#sauvegarde/.test(location.hash)) U().render(); };
  function clear(cb) {
    if (IS_PC) { fetch('/api/packs', { method: 'DELETE' }).then(function () { status(cb); }); return; }
    if (IS_ANDROID) { PAAndroid.packClear(); status(cb); return; }
    try { caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.open(k).then(function (c) { return c.keys().then(function (rs) { return Promise.all(rs.filter(function (r) { return /\/(audio\/|solver\/(flop|turn)\/)/.test(r.url); }).map(function (r) { return c.delete(r); })); }); }); })); }).then(function () { cb && cb(); }); } catch (e) { cb && cb(); }
  }
  function mo(b) { return (b / 1048576).toFixed(b > 10485760 ? 0 : 1).replace('.', ',') + ' Mo'; }
  // carte de l'écran Sauvegarde
  function card() {
    var ui = U(), I = ST.info, out = '<div class="card stack"><b>Contenu hors connexion</b><div class="small muted">Les podcasts et les solutions du solveur se téléchargent la première fois que tu les ouvres, puis restent sur l’appareil. Avant une soirée sans connexion, télécharge tout d’un coup.</div>';
    if (I && I.bytes !== undefined) out += '<div>Sur cet appareil : <b>' + I.files + '</b> fichiers, ' + mo(I.bytes) + '.</div>';
    else if (!IS_PC && !IS_ANDROID) out += '<div class="small muted">Sur iPhone et dans le navigateur, les fichiers déjà ouverts sont gardés par le navigateur.</div>';
    if (ST.busy) out += '<div>Téléchargement : ' + ST.done + ' / ' + ST.total + (ST.err ? ' · ' + ST.err + ' échec(s)' : '') + '</div><div class="timer"><i style="width:' + (ST.total ? Math.round(ST.done / ST.total * 100) : 0) + '%"></i></div>';
    else if (ST.total && ST.done >= ST.total) out += '<div class="small" style="color:' + (ST.err ? '#ff8080' : '#4fe08f') + '">' + (ST.err ? ST.err + ' fichier(s) n’ont pas pu être téléchargés : vérifie la connexion et recommence.' : 'Tout est téléchargé.') + '</div>';
    out += '<div class="row"><button class="btn gold" data-pkact="all" style="flex:1"' + (ST.busy ? ' disabled' : '') + '>Tout télécharger (environ 80 Mo)</button><button class="btn" data-pkact="clear"' + (ST.busy ? ' disabled' : '') + '>Libérer la place</button></div></div>';
    if (!I && (IS_PC || IS_ANDROID)) status(function () { if (/^#sauvegarde/.test(location.hash)) ui.render(); });
    return out;
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-pkact]') : null; if (!t || t.disabled) return;
    var a = t.getAttribute('data-pkact');
    if (a === 'all') prefetchAll(function () { if (/^#sauvegarde/.test(location.hash)) U().render(); });
    else if (a === 'clear') { ST.total = 0; clear(function () { U().render(); }); }
    U().render();
  });
  window.PA_PACK = { url: url, card: card, prefetchAll: prefetchAll, status: status, BASE: BASE };
})();
