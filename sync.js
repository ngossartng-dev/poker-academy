/* Poker Academy v2.0 — Sauvegarde, synchronisation PC ↔ Android, mises à jour, journal d'erreurs */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }
  var REPO_RAW = 'https://raw.githubusercontent.com/ngossartng-dev/poker-academy/main/telechargements/version.json';
  var REPO_WEB = 'https://ngossartng-dev.github.io/poker-academy/telechargements/';
  var IS_PC = location.hostname === '127.0.0.1' && location.port === '47816';
  var IS_ANDROID = !!window.PAAndroid;
  var IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var IS_STANDALONE = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  var IS_WEB = !IS_PC && !IS_ANDROID;
  var ST = { pc: null, upd: null, updErr: '', last: 0, msg: '' };

  /* ---------- Journal d'erreurs ---------- */
  function errs() { try { return JSON.parse(localStorage.getItem('pa2err') || '[]'); } catch (e) { return []; } }
  function logErr(msg, where) {
    var l = errs(); l.unshift({ at: Date.now(), msg: String(msg).slice(0, 400), where: String(where || '').slice(0, 200), v: U() ? U().version : '', page: location.hash });
    try { localStorage.setItem('pa2err', JSON.stringify(l.slice(0, 20))); } catch (e) {}
    banner('Un souci est survenu dans l’appli. Ta progression n’est pas touchée.', 'Voir le détail', '#sauvegarde');
  }
  window.addEventListener('error', function (e) { if (e && e.message) logErr(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { logErr(e && e.reason && (e.reason.message || e.reason), 'promesse'); });

  /* ---------- Bandeau ---------- */
  function banner(text, btn, href) {
    var b = document.getElementById('paBanner');
    if (!b) { b = document.createElement('div'); b.id = 'paBanner'; b.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:9999;background:#1b1b20;border:2px solid var(--gold,#ffd23f);border-radius:12px;padding:10px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;box-shadow:0 6px 24px #000a;font-size:.95em'; document.body.appendChild(b); }
    b.innerHTML = '<span style="flex:1;min-width:180px">' + text + '</span>' + (btn ? '<a class="btn gold" href="' + href + '" data-syact="close" style="min-height:40px">' + btn + '</a>' : '') + '<button class="btn" data-syact="close" style="min-height:40px">Fermer</button>';
  }
  function closeBanner() { var b = document.getElementById('paBanner'); if (b) b.remove(); }

  /* ---------- Instantané des données ---------- */
  function keys() { var k = []; for (var i = 0; i < localStorage.length; i++) { var n = localStorage.key(i); if (/^pa2/.test(n) && n !== 'pa2err' && n !== 'pa2meta') k.push(n); } return k; }
  function meta() { try { return JSON.parse(localStorage.getItem('pa2meta') || '{}'); } catch (e) { return {}; } }
  function setMeta(m) { try { localStorage.setItem('pa2meta', JSON.stringify(m)); } catch (e) {} }
  function snapshot() {
    var d = {}; keys().forEach(function (k) { d[k] = localStorage.getItem(k); });
    if (window.PA_STORE) window.PA_STORE.keys().forEach(function (k) { d[k] = JSON.stringify(window.PA_STORE.get(k)); });
    return { app: 'Poker Academy', version: U() ? U().version : '', device: IS_PC ? 'PC' : IS_ANDROID ? 'Android' : 'Web', savedAt: meta().changedAt || Date.now(), data: d };
  }
  function players(snap) { try { var s = JSON.parse(snap.data.pa2 || '{}'); return Object.keys(s.players || {}).map(function (k) { return s.players[k].pseudo; }).join(', '); } catch (e) { return '?'; } }
  function restore(snap) {
    if (!snap || snap.app !== 'Poker Academy' || !snap.data || !snap.data.pa2) throw new Error('Ce fichier n’est pas une sauvegarde Poker Academy.');
    keys().forEach(function (k) { localStorage.removeItem(k); });
    var hh = Object.keys(snap.data).filter(function (k) { return /^pa2hh_/.test(k); });
    Object.keys(snap.data).forEach(function (k) { if (/^pa2/.test(k) && !/^pa2hh_/.test(k)) localStorage.setItem(k, snap.data[k]); });
    setMeta({ changedAt: snap.savedAt, restoredAt: Date.now(), savedAt: snap.savedAt, syncedAt: snap.savedAt });
    function fin() { location.hash = '#home'; location.reload(); }
    var S = window.PA_STORE;
    if (!S) { hh.forEach(function (k) { try { localStorage.setItem(k, snap.data[k]); } catch (e) {} }); fin(); return; }
    S.clearNow(function () {
      var left = hh.length; if (!left) { fin(); return; }
      hh.forEach(function (k) { var v = null; try { v = JSON.parse(snap.data[k]); } catch (e) {} S.setNow(k, v, function () { if (--left === 0) fin(); }); });
    });
  }
  // chaque enregistrement marque les données comme modifiées
  try {
    var origSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      origSet.call(this, k, v);
      if (this === window.localStorage && /^pa2/.test(k) && k !== 'pa2meta' && k !== 'pa2err') { var m = meta(); m.changedAt = Date.now(); origSet.call(this, 'pa2meta', JSON.stringify(m)); }
    };
  } catch (e) {}

  function dt(t) { if (!t) return 'jamais'; var d = new Date(t); return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  function fileName() { var d = new Date(); function z(x) { return (x < 10 ? '0' : '') + x; } return 'poker-academy-' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '-' + z(d.getHours()) + 'h' + z(d.getMinutes()) + '.json'; }

  /* ---------- PC : sauvegarde automatique dans Google Drive ---------- */
  function pcList(cb) {
    fetch('/api/backup', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { ST.pc = j; cb && cb(j); }).catch(function () { ST.pc = { err: true }; cb && cb(ST.pc); });
  }
  function pcSave(force, cb) {
    var m = meta();
    if (!force && m.savedAt && m.changedAt && m.changedAt <= m.savedAt) { cb && cb(true); return; }
    var snap = snapshot();
    fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snap) })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) { var mm = meta(); mm.savedAt = snap.savedAt; mm.savedDisk = Date.now(); setMeta(mm); ST.pc = j; cb && cb(true); })
      .catch(function () { cb && cb(false); });
  }
  function pcLoad(name, cb) { fetch('/api/backup?name=' + encodeURIComponent(name), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(cb).catch(function () { cb(null); }); }
  if (IS_PC) {
    setInterval(function () { pcSave(false); }, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (document.hidden) pcSave(false); });
    window.addEventListener('beforeunload', function () { pcSave(false); });
    // au démarrage : une sauvegarde plus récente (faite depuis le téléphone, par exemple) ?
    setTimeout(function () {
      pcList(function (j) {
        if (!j || j.err || !j.files || !j.files.length) { pcSave(true); return; }
        var newest = j.files[0];
        if (newest.savedAt && newest.savedAt > (meta().changedAt || 0) + 60000 && newest.device !== 'PC') banner('Une sauvegarde plus récente existe dans ton Drive (' + newest.device + ', ' + dt(newest.savedAt) + ').', 'Voir', '#sauvegarde');
        else pcSave(false);
      });
    }, 2500);
  }


  /* ---------- Synchronisation automatique PC ↔ téléphone : un fichier partagé dans Google Drive ---------- */
  var SY2 = { busy: false, conflict: null, info: null, last: 0 };
  function hasAndroidSync() { return IS_ANDROID && !!window.PAAndroid.syncRead; }
  function syncConfigured() { return IS_PC || (hasAndroidSync() && !!PAAndroid.syncInfo()); }
  function rRead(cb) {
    if (IS_PC) { fetch('/api/sync', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { cb(j); }).catch(function () { cb(null); }); return; }
    if (!syncConfigured()) { cb(null); return; }
    var t = null; try { t = PAAndroid.syncRead(); } catch (e) {} var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} cb(j);
  }
  function rWrite(snap, cb) {
    var txt = JSON.stringify(snap);
    if (IS_PC) { fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: txt }).then(function (r) { cb(r.ok); }).catch(function () { cb(false); }); return; }
    var ok = false; try { ok = PAAndroid.syncWrite(txt); } catch (e) {} cb(ok);
  }
  // startup : au lancement on peut recharger ; ensuite on propose seulement
  function syncNow(startup, choice) {
    if (!syncConfigured() || SY2.busy) return;
    SY2.busy = true;
    rRead(function (remote) {
      var m = meta(), base = m.syncedAt || 0, dirty = (m.changedAt || 0) > base;
      var valid = remote && remote.app === 'Poker Academy' && remote.data && remote.data.pa2;
      var newer = valid && remote.savedAt > base && remote.savedAt !== m.changedAt;
      SY2.last = Date.now(); SY2.info = valid ? { device: remote.device, at: remote.savedAt } : null;
      function done() { SY2.busy = false; }
      function push() { var snap = snapshot(); rWrite(snap, function (ok) { if (ok) { var mm = meta(); mm.syncedAt = snap.savedAt; setMeta(mm); SY2.conflict = null; } done(); }); }
      function pull() { try { sessionStorage.setItem('pa2syncMsg', remote.device + '|' + remote.savedAt); } catch (e) {} SY2.busy = false; restore(remote); }
      if (choice === 'local') { push(); return; }
      if (choice === 'remote' && valid) { pull(); return; }
      if (newer && dirty && base) { SY2.conflict = { device: remote.device, at: remote.savedAt, local: m.changedAt }; done(); banner('Tu as joué sur ' + (remote.device === 'PC' ? 'le PC' : 'le téléphone') + ' et ici depuis la dernière synchronisation. Choisis la progression à garder.', 'Choisir', '#sauvegarde'); return; }
      if (newer && dirty && !base) { SY2.conflict = { device: remote.device, at: remote.savedAt, local: m.changedAt, first: true }; done(); banner('Une progression ' + (remote.device === 'PC' ? 'du PC' : 'du téléphone') + ' existe dans ton Drive. Laquelle veux-tu garder sur les deux appareils ?', 'Choisir', '#sauvegarde'); return; }
      if (newer) { if (startup) { pull(); return; } done(); banner('Ta progression a avancé sur ' + (remote.device === 'PC' ? 'le PC' : 'le téléphone') + ' (' + dt(remote.savedAt) + ').', 'Reprendre', '#sauvegarde'); SY2.conflict = { device: remote.device, at: remote.savedAt, local: m.changedAt, pull: true }; return; }
      if (dirty || !valid) { push(); return; }
      done();
    });
  }
  if (IS_PC || hasAndroidSync()) {
    setTimeout(function () {
      try { var msg = sessionStorage.getItem('pa2syncMsg'); if (msg) { sessionStorage.removeItem('pa2syncMsg'); var p = msg.split('|'); banner('Progression reprise depuis ' + (p[0] === 'PC' ? 'le PC' : 'le téléphone') + ' (' + dt(+p[1]) + ').'); } } catch (e) {}
      syncNow(true);
    }, 3000);
    setInterval(function () { syncNow(false); }, 2 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { var m = meta(); if ((m.changedAt || 0) > (m.syncedAt || 0)) syncNow(false); } else syncNow(false); });
    window.__paSyncPicked = function (name) { if (name) { var mm = meta(); delete mm.syncedAt; setMeta(mm); ST.msg = 'Fichier de synchronisation choisi : ' + name + '.'; syncNow(false); } else ST.msg = 'Aucun fichier choisi.'; U().render(); };
  }
  function syncCard() {
    var ui = U(), m = meta(), out = '<div class="card stack"><b>Synchronisation PC ↔ téléphone</b>';
    if (IS_PC) out += '<div class="small">Le PC écrit ta progression dans <b>poker-academy-sync.json</b>, dans le même dossier Drive que les sauvegardes. Sur le téléphone, choisis une fois ce fichier : les deux appareils le relisent et le réécrivent tout seuls.</div>';
    else if (hasAndroidSync()) {
      var nm = PAAndroid.syncInfo();
      out += nm ? '<div class="small">Fichier synchronisé : <b>' + ui.esc(nm) + '</b>. L’appli le relit au lancement et le réécrit toutes les 2 minutes et quand tu la quittes.</div><div class="row"><button class="btn" data-syact="syncnow">Synchroniser maintenant</button><button class="btn" data-syact="syncpick">Changer de fichier</button><button class="btn" data-syact="syncforget">Arrêter</button></div>'
        : '<div class="small">Une seule fois : touche le bouton, ouvre <b>Drive › Poker Academy › Sauvegardes</b> et choisis <b>poker-academy-sync.json</b> (le PC le crée au premier lancement). Ensuite, tout est automatique.</div><button class="btn gold" data-syact="syncpick">Choisir le fichier dans Google Drive</button><button class="btn" data-syact="synccreate">Pas de PC : créer le fichier ici</button>';
    } else { return ''; }
    if (syncConfigured()) out += '<div class="small muted">Dernière synchronisation : ' + dt(m.syncedAt) + (SY2.info ? ' · dans le fichier : ' + ui.esc(SY2.info.device) + ', ' + dt(SY2.info.at) : '') + '.</div>';
    if (SY2.conflict) {
      var c = SY2.conflict, other = c.device === 'PC' ? 'du PC' : 'du téléphone';
      out += '<div class="card stack" style="border-color:var(--gold,#ffd23f)"><b>' + (c.pull ? 'Ta progression a avancé ailleurs' : 'Quelle progression garder ?') + '</b><div class="small">Celle ' + other + ' : ' + dt(c.at) + '. Celle de cet appareil : ' + dt(c.local) + '.</div>' +
        '<div class="row"><button class="btn gold" data-syact="syncremote">Garder celle ' + other + '</button>' + (c.pull ? '' : '<button class="btn" data-syact="synclocal">Garder celle-ci</button>') + '</div><div class="small muted">L’autre n’est pas perdue : elle reste dans les sauvegardes horodatées.</div></div>';
    }
    return out + '</div>';
  }

  /* ---------- Fichier : export et import ---------- */
  function exportFile() {
    var snap = snapshot(), txt = JSON.stringify(snap), name = fileName();
    if (IS_PC) { pcSave(true, function (ok) { ST.msg = ok ? 'Sauvegarde enregistrée dans ' + (ST.pc && ST.pc.dir || 'ton Drive') + '.' : 'La sauvegarde a échoué.'; U().render(); }); return; }
    if (IS_ANDROID && PAAndroid.shareFile) { PAAndroid.shareFile(btoa(unescape(encodeURIComponent(txt))), name, 'application/json'); var m = meta(); m.savedAt = snap.savedAt; setMeta(m); return; }
    if (shareFile(txt, name)) { var m2 = meta(); m2.savedAt = snap.savedAt; setMeta(m2); return; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  // iPhone et navigateurs récents : feuille de partage (Fichiers, Drive, Mail…)
  function shareFile(txt, name) {
    try {
      var f = new File([txt], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: name }).catch(function () {}); return true; }
    } catch (e) {}
    return false;
  }
  function importFile(file) {
    var r = new FileReader();
    r.onload = function () {
      try { var snap = JSON.parse(r.result); if (!snap.data || snap.app !== 'Poker Academy') throw new Error(); ST.pending = snap; ST.msg = ''; }
      catch (e) { ST.pending = null; ST.msg = 'Ce fichier n’est pas une sauvegarde Poker Academy.'; }
      U().render();
    };
    r.readAsText(file);
  }

  /* ---------- Mises à jour ---------- */
  function cmpV(a, b) { return String(a).localeCompare(String(b), 'fr', { numeric: true }); }
  function checkUpdate(manual) {
    ST.updErr = ''; if (manual) { ST.upd = null; U().render(); }
    fetch(REPO_RAW + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
      ST.upd = j; ST.checked = Date.now();
      if (U() && cmpV(j.version, U().version) > 0 && !manual && !IS_WEB) banner('Nouvelle version ' + j.version + ' disponible : ' + (j.notes || '') , 'Voir', '#sauvegarde');
      if (manual) U().render();
    }).catch(function () { ST.updErr = 'Vérification impossible : pas de connexion, ou dépôt GitHub privé.'; if (manual) U().render(); });
  }
  function openUrl(u) {
    if (IS_PC) { fetch('/api/open?u=' + encodeURIComponent(u)); return; }
    if (IS_ANDROID && PAAndroid.openUrl) { PAAndroid.openUrl(u); return; }
    window.open(u, '_blank', 'noopener');
  }
  setTimeout(function () { if (U()) checkUpdate(false); }, 6000);
  if (IS_IOS && !IS_STANDALONE) setTimeout(function () {
    var seen = false; try { seen = sessionStorage.getItem('pa2ios'); sessionStorage.setItem('pa2ios', '1'); } catch (e) {}
    if (!seen) banner('Pour l’installer sur ton iPhone : touche le bouton Partager (le carré avec une flèche), puis « Sur l’écran d’accueil ». L’appli s’ouvrira alors en plein écran, comme une vraie appli, et gardera tes données.', '', '');
  }, 2500);

  /* ---------- Écran « Sauvegarde et mises à jour » ---------- */
  function view() {
    var ui = U(), m = meta(), out = '<div class="stack"><button class="back" data-act="nav" data-v="reglages">‹ Réglages</button><h1>Sauvegarde et mises à jour</h1>';
    if (ST.msg) out += ui.yo(ST.msg);
    if (ST.pending) {
      out += '<div class="card stack"><b>Restaurer cette sauvegarde ?</b><div>Faite sur ' + ST.pending.device + ' le ' + dt(ST.pending.savedAt) + ' (version ' + ui.esc(ST.pending.version || '?') + '). Joueurs : ' + ui.esc(players(ST.pending)) + '.</div>' +
        '<div class="small muted">Tes données actuelles sur cet appareil (dernière modification le ' + dt(m.changedAt) + ') seront remplacées.</div>' +
        '<div class="row"><button class="btn gold" data-syact="restore" style="flex:1">Restaurer</button><button class="btn" data-syact="cancel">Annuler</button></div></div>';
    }
    // sauvegarde
    out += '<div class="card stack"><b>Ta progression</b><div class="small muted">Dernière modification : ' + dt(m.changedAt) + '. Dernière sauvegarde : ' + dt(m.savedDisk || m.savedAt) + '.</div>';
    if (IS_PC) {
      var pc = ST.pc;
      if (!pc) { pcList(function () { ui.render(); }); out += '<div class="muted">Lecture du dossier de sauvegarde…</div>'; }
      else if (pc.err) out += '<div class="muted">Dossier de sauvegarde inaccessible.</div>';
      else {
        out += '<div>Sauvegarde automatique toutes les 5 minutes et à la fermeture, dans :<br><b>' + ui.esc(pc.dir) + '</b>' + (pc.drive ? '' : '<br><span class="small muted">Google Drive pour ordinateur n’a pas été trouvé : la sauvegarde reste sur ce PC.</span>') + '</div>' +
          '<button class="btn gold" data-syact="export">Sauvegarder maintenant</button>';
        if (pc.files && pc.files.length) out += '<b>Sauvegardes disponibles</b>' + pc.files.slice(0, 8).map(function (f) { return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:6px 0"><span class="small">' + dt(f.savedAt) + ' · ' + ui.esc(f.device || '?') + '</span><button class="btn" data-syact="pcload" data-v="' + ui.esc(f.name) + '" style="min-height:36px">Restaurer</button></div>'; }).join('');
      }
    } else if (IS_ANDROID) {
      out += '<div>Android sauvegarde automatiquement l’appli dans ton compte Google (si la sauvegarde Google est activée sur le téléphone).</div><div class="small muted">Pour passer tes données sur le PC : « Envoyer une sauvegarde », puis choisis Google Drive, dossier Poker Academy › Sauvegardes. Le PC la proposera au démarrage.</div>' +
        '<button class="btn gold" data-syact="export">Envoyer une sauvegarde</button>';
    } else if (IS_IOS) {
      out += '<div>Sur iPhone, tes données restent dans l’appli tant que tu l’as ajoutée à l’écran d’accueil. Fais une sauvegarde de temps en temps : « Envoyer une sauvegarde », puis « Enregistrer dans Fichiers » ou Google Drive, dossier Poker Academy › Sauvegardes. Le PC la proposera au démarrage.</div>' +
        '<button class="btn gold" data-syact="export">Envoyer une sauvegarde</button>';
    } else out += '<button class="btn gold" data-syact="export">Exporter un fichier de sauvegarde</button>';
    out += '<label class="btn" style="text-align:center">Importer un fichier de sauvegarde<input type="file" accept=".json,application/json" data-syimport="1" style="display:none"></label></div>';
    out += syncCard();
    if (window.PA_PACK) out += window.PA_PACK.card();
    // rappel quotidien (Android)
    if (IS_ANDROID && PAAndroid.setReminder) {
      var cur = PAAndroid.getReminder();
      out += '<div class="card stack"><b>Rappel quotidien</b><div class="small muted">Une notification à l’heure choisie pour faire tes cartes du jour.</div><div class="seg" style="flex-wrap:wrap">' + [['', 'Aucun'], ['08:00', '8 h'], ['12:30', '12 h 30'], ['18:00', '18 h'], ['20:00', '20 h'], ['21:30', '21 h 30']].map(function (o) { return '<button class="' + (cur === o[0] ? 'on' : '') + '" data-syact="remind" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
    }
    // mises à jour
    var v = ui.version, u = ST.upd;
    out += '<div class="card stack"><b>Mises à jour</b><div>Version installée : <b>' + v + '</b>' + (u ? ' · dernière version : <b>' + ui.esc(u.version) + '</b>' : '') + '</div>';
    if (IS_WEB) out += '<div class="small muted">Version web : elle se met à jour toute seule à chaque ouverture avec une connexion. Si une ancienne version reste affichée, ferme l’appli et rouvre-la.</div>';
    else if (u && cmpV(u.version, v) > 0) out += '<div>' + ui.esc(u.notes || '') + '</div><button class="btn gold" data-syact="dl">' + (IS_ANDROID ? 'Télécharger le nouvel APK' : IS_PC ? 'Télécharger le nouvel installateur' : 'Ouvrir la page de téléchargement') + '</button><div class="small muted">' + (IS_PC ? 'Le téléchargement s’ouvre dans ton navigateur (connecté à GitHub) ; lance ensuite l’installateur, tes données sont conservées.' : IS_ANDROID ? 'Le téléchargement s’ouvre dans ton navigateur ; installe l’APK par-dessus, tes données sont conservées.' : '') + '</div>';
    else if (u) out += '<div class="small" style="color:#4fe08f">Tu as la dernière version.</div>';
    if (ST.updErr) out += '<div class="small muted">' + ST.updErr + '</div>';
    out += '<button class="btn" data-syact="check">Vérifier maintenant</button></div>';
    // erreurs
    var e = errs();
    out += '<div class="card stack"><b>Journal des erreurs</b>' + (e.length ? e.slice(0, 10).map(function (x) { return '<div class="small" style="border-bottom:1px solid var(--line);padding:4px 0">' + dt(x.at) + ' · ' + ui.esc(x.msg) + ' <span class="muted">(' + ui.esc(x.where) + ', ' + ui.esc(x.page || '') + ', v' + ui.esc(x.v || '') + ')</span></div>'; }).join('') +
      '<div class="row"><button class="btn" data-syact="copyerr" style="flex:1">Copier le détail</button><button class="btn" data-syact="clearerr">Vider</button></div><div class="small muted">Colle le détail dans notre conversation pour que je corrige le problème.</div>' : '<div class="small muted">Aucune erreur enregistrée.</div>') + '</div>';
    return ui.shell('moi', out + '</div>');
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-syact]') : null; if (!t) return;
    var a = t.getAttribute('data-syact'), v = t.getAttribute('data-v');
    if (a === 'close') { closeBanner(); return; }
    if (a === 'export') { exportFile(); return; }
    if (a === 'syncpick' || a === 'synccreate') { PAAndroid.syncPick(a === 'synccreate'); return; }
    if (a === 'syncforget') { PAAndroid.syncForget(); ST.msg = 'Synchronisation arrêtée sur ce téléphone.'; }
    if (a === 'syncnow') { syncNow(false); setTimeout(function () { U().render(); }, 600); }
    if (a === 'synclocal') { syncNow(false, 'local'); SY2.conflict = null; ST.msg = 'Ta progression de cet appareil est envoyée sur l’autre.'; }
    if (a === 'syncremote') { syncNow(false, 'remote'); return; }
    if (a === 'restore') { try { restore(ST.pending); } catch (e) { ST.msg = e.message; U().render(); } return; }
    if (a === 'cancel') { ST.pending = null; }
    if (a === 'pcload') { pcLoad(v, function (snap) { if (snap && snap.data) { ST.pending = snap; ST.msg = ''; } else ST.msg = 'Lecture de la sauvegarde impossible.'; U().render(); }); return; }
    if (a === 'check') { checkUpdate(true); return; }
    if (a === 'remind') { var hm = v ? v.split(':') : ['-1', '0']; PAAndroid.setReminder(parseInt(hm[0], 10), parseInt(hm[1], 10)); }
    if (a === 'dl') { var u = ST.upd; openUrl(REPO_WEB + (IS_ANDROID ? u.apk : u.exe)); return; }
    if (a === 'copyerr') { var txt = JSON.stringify(errs(), null, 1); try { navigator.clipboard.writeText(txt); ST.msg = 'Détail copié.'; } catch (e) { ST.msg = txt; } }
    if (a === 'clearerr') { localStorage.removeItem('pa2err'); }
    U().render();
  });
  document.addEventListener('change', function (ev) { var t = ev.target; if (t && t.getAttribute && t.getAttribute('data-syimport') && t.files && t.files[0]) importFile(t.files[0]); });

  window.PA_SYNC = { shareFile: shareFile, isIOS: IS_IOS, view: view, snapshot: snapshot, restore: restore, logErr: logErr, isPC: IS_PC, isAndroid: IS_ANDROID };
})();
