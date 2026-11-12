/* Poker Academy — synchronisation du championnat entre l'appli complète et l'appli Club (et entre PC et téléphones)
   Un fichier partagé dans Google Drive : Poker Academy › Club › championnat-club.json.
   Fusion sans perte : les tournois s'additionnent (par identifiant), les suppressions sont mémorisées,
   la liste du club, la structure des niveaux et les clôtures de saison gardent la version la plus récente. */
(function () {
  'use strict';
  function U() { return window.PA_UI; }
  var IS_PC = location.hostname === '127.0.0.1' && (location.port === '47816' || location.port === '47826');
  var IS_ANDROID = !!(window.PAAndroid && window.PAAndroid.clubRead);
  var CS = { busy: false, at: 0, msg: '', err: '', path: '', remoteAt: 0, timer: null };
  function app() { return window.PA_CLUB ? 'Club' : 'Complète'; }
  function device() { return IS_PC ? 'PC' : IS_ANDROID ? 'Android' : 'Web'; }
  function configured() { if (IS_PC) return true; if (IS_ANDROID) { try { return !!window.PAAndroid.clubInfo(); } catch (e) { return false; } } return false; }
  function league() { return window.PA_LEAGUE; }
  function timer() { return window.PA_TIMER; }

  function localData() {
    var d = league().load(), st = timer() && timer().getStruct ? timer().getStruct() : null;
    return { app: 'Poker Academy Club', v: 1, at: Date.now(), by: app() + ' · ' + device(),
      league: { list: d.list || [], deleted: d.deleted || [], roster: d.roster || null, rosterAt: d.rosterAt || 0, closed: d.closed || {}, carry: d.carry || {}, hands: d.hands || [], handsDel: d.handsDel || [] }, struct: st };
  }
  function sig(x) { try { return JSON.stringify([x.league.list.map(function (t) { return t.id + ':' + (t.editAt || 0); }).sort(), x.league.deleted.slice().sort(), x.league.rosterAt, x.league.roster, x.league.closed, x.league.carry || {}, x.struct && x.struct.at, (x.league.hands || []).map(function (h) { return h.id + ':' + (h.editAt || 0); }).sort(), (x.league.handsDel || []).slice().sort()]); } catch (e) { return ''; } }
  function merge(a, b) {
    if (!b || !b.league) return a;
    var del = {}; (a.league.deleted || []).concat(b.league.deleted || []).forEach(function (id) { del[id] = 1; });
    var m = {};
    (a.league.list || []).concat(b.league.list || []).forEach(function (t) { if (!t || !t.id || del[t.id]) return; var o = m[t.id]; if (!o || (t.editAt || 0) > (o.editAt || 0)) m[t.id] = t; });
    var list = Object.keys(m).map(function (k) { return m[k]; }).sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : 0; });
    var ra = a.league.rosterAt || 0, rb = b.league.rosterAt || 0;
    var closed = {}; [a.league.closed || {}, b.league.closed || {}].forEach(function (c) { Object.keys(c).forEach(function (y) { if (!closed[y] || (c[y].at || 0) > (closed[y].at || 0)) closed[y] = c[y]; }); });
    var carry = {}; [a.league.carry || {}, b.league.carry || {}].forEach(function (c) { Object.keys(c).forEach(function (y) { if (!carry[y] || (c[y].at || 0) > (carry[y].at || 0)) carry[y] = c[y]; }); });
    var sa = a.struct, sb = b.struct, struct = !sa ? sb : !sb ? sa : ((sb.at || 0) > (sa.at || 0) ? sb : sa);
    // les mains du club commentées : par identifiant, la version la plus récente gagne ; les suppressions sont mémorisées
    var hdel = {}; (a.league.handsDel || []).concat(b.league.handsDel || []).forEach(function (id) { hdel[id] = 1; });
    var hm = {}; (a.league.hands || []).concat(b.league.hands || []).forEach(function (h) { if (!h || !h.id || hdel[h.id]) return; var o = hm[h.id]; if (!o || (h.editAt || 0) > (o.editAt || 0)) hm[h.id] = h; });
    var hands = Object.keys(hm).map(function (k) { return hm[k]; }).sort(function (x, y) { return (y.at || 0) - (x.at || 0); });
    return { app: a.app, v: 1, at: Date.now(), by: a.by, league: { list: list, deleted: Object.keys(del), roster: rb > ra ? b.league.roster : a.league.roster, rosterAt: Math.max(ra, rb), closed: closed, carry: carry, hands: hands, handsDel: Object.keys(hdel) }, struct: struct };
  }
  function applyLocal(x) {
    var d = league().load();
    d.list = x.league.list; d.deleted = x.league.deleted; d.closed = x.league.closed; d.carry = x.league.carry || d.carry || {}; if (x.league.hands) { d.hands = x.league.hands; d.handsDel = x.league.handsDel || []; }
    if (x.league.roster) { d.roster = x.league.roster; d.rosterAt = x.league.rosterAt; }
    league().saveRaw(d);
    if (x.struct && timer() && timer().setStruct) timer().setStruct(x.struct);
  }
  function rRead(cb) {
    if (IS_PC) { fetch('/api/clubsync', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.path) CS.path = j.path; cb(j && !j.none ? j : null, !j); }).catch(function () { cb(null, true); }); return; }
    if (IS_ANDROID) { var t = null; try { t = window.PAAndroid.clubRead(); } catch (e) {} var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} cb(j, false); return; }
    cb(null, true);
  }
  function rWrite(x, cb) {
    var txt = JSON.stringify(x);
    if (IS_PC) { fetch('/api/clubsync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: txt }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { CS.path = j.path || CS.path; cb(true); }).catch(function () { cb(false); }); return; }
    if (IS_ANDROID) { var ok = false; try { ok = window.PAAndroid.clubWrite(txt); } catch (e) {} cb(ok); return; }
    cb(false);
  }
  function sync(manual) {
    if (!league() || CS.busy || !configured()) { if (manual) { CS.msg = configured() ? '' : 'Choisis d’abord le fichier partagé.'; U() && U().render(); } return; }
    CS.busy = true; CS.err = '';
    rRead(function (remote, fail) {
      if (fail && IS_PC) { CS.busy = false; CS.err = 'Synchronisation indisponible : mets l’appli PC à jour.'; if (manual) U().render(); return; }
      if (remote && remote.app !== 'Poker Academy Club') { CS.busy = false; CS.err = 'Ce fichier n’est pas un fichier de championnat.'; if (manual) U().render(); return; }
      var loc = localData(), mg = merge(loc, remote), sl = sig(loc), sm = sig(mg), sr = remote ? sig(remote) : '';
      var pulled = sm !== sl, before = loc.league.list.length;
      if (pulled) applyLocal(mg);
      function fin(ok) {
        CS.busy = false; CS.at = Date.now(); CS.remoteAt = remote ? remote.at : 0;
        if (!ok) CS.err = 'Écriture du fichier partagé impossible.';
        var added = mg.league.list.length - before;
        CS.msg = pulled ? (added > 0 ? added + ' tournoi' + (added > 1 ? 's' : '') + ' reçu' + (added > 1 ? 's' : '') + ' de l’autre appli.' : 'Championnat mis à jour depuis l’autre appli.') : manual ? 'Tout est à jour.' : CS.msg;
        if (pulled || manual) { var h = location.hash || ''; if (!h || /^#(classement|tournoi|minuteur|home|club|sauvegarde)?$|^#(classement|tournoi|minuteur)/.test(h) || manual) U().render(); }
      }
      if (sm !== sr) { mg.at = Date.now(); rWrite(mg, fin); } else fin(true);
    });
  }
  function dirty() { clearTimeout(CS.timer); CS.timer = setTimeout(function () { sync(false); }, 2500); }

  /* ---------- Fichier manuel (version web, ou sans Drive) ---------- */
  function exportFile() {
    var x = localData(), txt = JSON.stringify(x, null, 1), name = 'championnat-club-' + new Date().toISOString().slice(0, 10) + '.json';
    try { if (window.PAAndroid && window.PAAndroid.shareFile) { window.PAAndroid.shareFile(btoa(unescape(encodeURIComponent(txt))), name, 'application/json'); return; } } catch (e) {}
    if (IS_PC) { fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, content: txt }) }).then(function (r) { return r.json(); }).then(function (j) { CS.msg = 'Fichier enregistré : ' + j.path; U().render(); }).catch(function () {}); return; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function importText(t) {
    var j = null; try { j = JSON.parse(t); } catch (e) {}
    if (!j || j.app !== 'Poker Academy Club') { CS.err = 'Ce fichier n’est pas un fichier de championnat.'; U().render(); return; }
    var loc = localData(), before = loc.league.list.length, mg = merge(loc, j); applyLocal(mg);
    CS.err = ''; CS.msg = 'Fichier importé : ' + (mg.league.list.length - before) + ' tournoi(s) ajouté(s), rien n’a été effacé.'; U().render(); dirty();
  }

  function card() {
    var esc = U().esc, h = '<div class="card stack"><div class="row" style="justify-content:space-between;gap:8px"><b>🔄 Appli complète ↔ appli Club</b>' + (window.PA_GUIDE ? window.PA_GUIDE.link('synchro') : '') + '</div>';
    h += '<div class="small muted">Le championnat, la liste du club et la structure des niveaux sont partagés entre l’appli complète et l’appli Club, sur le PC et les téléphones, par un fichier dans ton Google Drive. Rien n’est jamais perdu : les tournois s’additionnent.</div>';
    if (IS_PC) h += '<div class="small">Fichier partagé : <b>' + esc(CS.path || 'Mon Drive › Poker Academy › Club › championnat-club.json') + '</b></div>';
    else if (IS_ANDROID) {
      var nm = ''; try { nm = window.PAAndroid.clubInfo(); } catch (e) {}
      h += nm ? '<div class="small">Fichier partagé : <b>' + esc(nm) + '</b></div>' : '<div class="small">Sur ce téléphone, choisis le fichier <b>championnat-club.json</b> dans Mon Drive › Poker Academy › Club (le PC le crée tout seul), ou crée-le ici s’il n’existe pas encore.</div>';
      h += '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn' + (nm ? '' : ' gold') + '" data-csact="pick" style="flex:1">' + (nm ? 'Changer de fichier' : 'Choisir le fichier') + '</button>' + (nm ? '' : '<button class="btn" data-csact="create" style="flex:1">Créer le fichier</button>') + '</div>';
    } else h += '<div class="small muted">Version web : pas d’accès direct au Drive. Utilise l’export et l’import ci-dessous.</div>';
    if (configured()) h += '<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><span class="small">' + (CS.at ? 'Dernière synchro : ' + new Date(CS.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Pas encore synchronisé') + '</span><button class="btn gold" data-csact="now">' + (CS.busy ? 'Synchro…' : 'Synchroniser maintenant') + '</button></div>';
    if (CS.msg) h += '<div class="small" style="color:var(--gold)">' + esc(CS.msg) + '</div>';
    if (CS.err) h += '<div class="small" style="color:#ff8a8f">' + esc(CS.err) + '</div>';
    h += '<details><summary class="small" style="cursor:pointer">Sans Drive : par fichier</summary><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" data-csact="export" style="flex:1">Exporter le championnat</button><label class="btn" style="flex:1;text-align:center;cursor:pointer">Importer un fichier<input id="csImport" type="file" accept=".json,application/json" style="display:none"></label></div></details>';
    return h + '</div>';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-csact]') : null; if (!t) return;
    var a = t.getAttribute('data-csact');
    if (a === 'now') sync(true);
    else if (a === 'pick' || a === 'create') window.PAAndroid.clubPick(a === 'create');
    else if (a === 'export') exportFile();
  });
  document.addEventListener('change', function (e) {
    if (!e.target || e.target.id !== 'csImport' || !e.target.files || !e.target.files[0]) return;
    var rd = new FileReader(); rd.onload = function () { importText(String(rd.result || '')); }; rd.readAsText(e.target.files[0]);
  });
  window.__paClubPicked = function (name) { if (name) { CS.msg = 'Fichier choisi : ' + name + '.'; sync(true); } else U() && U().render(); };
  if (IS_PC || IS_ANDROID) {
    setTimeout(function () { sync(false); }, 2500);
    setInterval(function () { if (!document.hidden) sync(false); }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(false); });
  }
  window.PA_CLUBSYNC = { sync: sync, dirty: dirty, card: card, merge: merge, _local: localData, _import: importText, state: CS };
})();
