/* Poker Academy v2.0 — Sauvegarde, synchronisation PC ↔ Android, mises à jour, journal d'erreurs */
(function () {
  'use strict';
  var PA = window.PA;
  function U() { return window.PA_UI; }
  var REPO_RAW = 'https://raw.githubusercontent.com/ngossartng-dev/poker-academy/main/telechargements/version.json';
  var REPO_WEB = 'https://github.com/ngossartng-dev/poker-academy/raw/main/telechargements/';
  var IS_PC = location.hostname === '127.0.0.1' && location.port === '47816';
  var IS_ANDROID = !!window.PAAndroid;
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
    return { app: 'Poker Academy', version: U() ? U().version : '', device: IS_PC ? 'PC' : IS_ANDROID ? 'Android' : 'Web', savedAt: meta().changedAt || Date.now(), data: d };
  }
  function players(snap) { try { var s = JSON.parse(snap.data.pa2 || '{}'); return Object.keys(s.players || {}).map(function (k) { return s.players[k].pseudo; }).join(', '); } catch (e) { return '?'; } }
  function restore(snap) {
    if (!snap || snap.app !== 'Poker Academy' || !snap.data || !snap.data.pa2) throw new Error('Ce fichier n’est pas une sauvegarde Poker Academy.');
    keys().forEach(function (k) { localStorage.removeItem(k); });
    Object.keys(snap.data).forEach(function (k) { if (/^pa2/.test(k)) localStorage.setItem(k, snap.data[k]); });
    setMeta({ changedAt: snap.savedAt, restoredAt: Date.now(), savedAt: snap.savedAt });
    location.hash = '#home'; location.reload();
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

  /* ---------- Fichier : export et import ---------- */
  function exportFile() {
    var snap = snapshot(), txt = JSON.stringify(snap), name = fileName();
    if (IS_PC) { pcSave(true, function (ok) { ST.msg = ok ? 'Sauvegarde enregistrée dans ' + (ST.pc && ST.pc.dir || 'ton Drive') + '.' : 'La sauvegarde a échoué.'; U().render(); }); return; }
    if (IS_ANDROID && PAAndroid.shareFile) { PAAndroid.shareFile(btoa(unescape(encodeURIComponent(txt))), name, 'application/json'); var m = meta(); m.savedAt = snap.savedAt; setMeta(m); return; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
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
      if (U() && cmpV(j.version, U().version) > 0 && !manual) banner('Nouvelle version ' + j.version + ' disponible : ' + (j.notes || '') , 'Voir', '#sauvegarde');
      if (manual) U().render();
    }).catch(function () { ST.updErr = 'Vérification impossible : pas de connexion, ou dépôt GitHub privé.'; if (manual) U().render(); });
  }
  function openUrl(u) {
    if (IS_PC) { fetch('/api/open?u=' + encodeURIComponent(u)); return; }
    if (IS_ANDROID && PAAndroid.openUrl) { PAAndroid.openUrl(u); return; }
    window.open(u, '_blank', 'noopener');
  }
  setTimeout(function () { if (U()) checkUpdate(false); }, 6000);

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
    } else out += '<button class="btn gold" data-syact="export">Exporter un fichier de sauvegarde</button>';
    out += '<label class="btn" style="text-align:center">Importer un fichier de sauvegarde<input type="file" accept=".json,application/json" data-syimport="1" style="display:none"></label></div>';
    // rappel quotidien (Android)
    if (IS_ANDROID && PAAndroid.setReminder) {
      var cur = PAAndroid.getReminder();
      out += '<div class="card stack"><b>Rappel quotidien</b><div class="small muted">Une notification à l’heure choisie pour faire tes cartes du jour.</div><div class="seg" style="flex-wrap:wrap">' + [['', 'Aucun'], ['08:00', '8 h'], ['12:30', '12 h 30'], ['18:00', '18 h'], ['20:00', '20 h'], ['21:30', '21 h 30']].map(function (o) { return '<button class="' + (cur === o[0] ? 'on' : '') + '" data-syact="remind" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
    }
    // mises à jour
    var v = ui.version, u = ST.upd;
    out += '<div class="card stack"><b>Mises à jour</b><div>Version installée : <b>' + v + '</b>' + (u ? ' · dernière version : <b>' + ui.esc(u.version) + '</b>' : '') + '</div>';
    if (u && cmpV(u.version, v) > 0) out += '<div>' + ui.esc(u.notes || '') + '</div><button class="btn gold" data-syact="dl">' + (IS_ANDROID ? 'Télécharger le nouvel APK' : IS_PC ? 'Télécharger le nouvel installateur' : 'Ouvrir la page de téléchargement') + '</button><div class="small muted">' + (IS_PC ? 'Le téléchargement s’ouvre dans ton navigateur (connecté à GitHub) ; lance ensuite l’installateur, tes données sont conservées.' : IS_ANDROID ? 'Le téléchargement s’ouvre dans ton navigateur ; installe l’APK par-dessus, tes données sont conservées.' : '') + '</div>';
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

  window.PA_SYNC = { view: view, snapshot: snapshot, restore: restore, logErr: logErr, isPC: IS_PC, isAndroid: IS_ANDROID };
})();
