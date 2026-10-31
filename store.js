/* Poker Academy v2.0 — Stockage des mains importées (IndexedDB, plusieurs centaines de milliers de mains)
   Les données restent en mémoire pour une lecture immédiate et sont écrites en arrière-plan. */
(function () {
  'use strict';
  var DBN = 'pokeracademy', ST = 'kv', db = null, mem = {}, ready = false, waiters = [], useLS = false;
  function done() { ready = true; var w = waiters; waiters = []; w.forEach(function (f) { try { f(); } catch (e) {} }); }
  function lsKeys() { var k = []; try { for (var i = 0; i < localStorage.length; i++) { var n = localStorage.key(i); if (/^pa2hh_/.test(n)) k.push(n); } } catch (e) {} return k; }
  function fallback() {
    useLS = true;
    lsKeys().forEach(function (k) { try { mem[k] = JSON.parse(localStorage.getItem(k)); } catch (e) {} });
    done();
  }
  function init() {
    var req;
    try { req = indexedDB.open(DBN, 1); } catch (e) { fallback(); return; }
    req.onupgradeneeded = function () { req.result.createObjectStore(ST); };
    req.onerror = function () { fallback(); };
    req.onsuccess = function () {
      db = req.result;
      var tx = db.transaction(ST, 'readonly'), os = tx.objectStore(ST), cur = os.openCursor();
      cur.onsuccess = function () {
        var c = cur.result;
        if (c) { mem[c.key] = c.value; c.continue(); return; }
        // anciennes mains gardées dans le stockage du navigateur : on les déplace
        var old = lsKeys();
        old.forEach(function (k) {
          try { var v = JSON.parse(localStorage.getItem(k)); if (v) { mem[k] = v; put(k, v); } localStorage.removeItem(k); } catch (e) {}
        });
        done();
      };
      cur.onerror = function () { fallback(); };
    };
  }
  function put(k, v) {
    if (useLS) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
    try { var tx = db.transaction(ST, 'readwrite'); if (v === undefined) tx.objectStore(ST).delete(k); else tx.objectStore(ST).put(v, k); } catch (e) { return false; }
    return true;
  }
  function mark() { try { var m = JSON.parse(localStorage.getItem('pa2meta') || '{}'); m.changedAt = Date.now(); localStorage.setItem('pa2meta', JSON.stringify(m)); } catch (e) {} }
  window.PA_STORE = {
    whenReady: function (f) { if (ready) f(); else waiters.push(f); },
    ready: function () { return ready; },
    get: function (k) { return mem[k]; },
    set: function (k, v) { mem[k] = v; mark(); return put(k, v); },
    del: function (k) { delete mem[k]; mark(); if (useLS) { try { localStorage.removeItem(k); } catch (e) {} } else put(k, undefined); },
    keys: function () { return Object.keys(mem); },
    // écriture confirmée (avant un rechargement de la page)
    setNow: function (k, v, cb) {
      mem[k] = v;
      if (useLS || !db) { put(k, v); cb && cb(); return; }
      try { var tx = db.transaction(ST, 'readwrite'); tx.objectStore(ST).put(v, k); tx.oncomplete = tx.onerror = function () { cb && cb(); }; } catch (e) { cb && cb(); }
    },
    clearNow: function (cb) {
      mem = {};
      if (useLS || !db) { lsKeys().forEach(function (k) { localStorage.removeItem(k); }); cb && cb(); return; }
      try { var tx = db.transaction(ST, 'readwrite'); tx.objectStore(ST).clear(); tx.oncomplete = tx.onerror = function () { cb && cb(); }; } catch (e) { cb && cb(); }
    },
    clearAll: function () { Object.keys(mem).forEach(function (k) { window.PA_STORE.del(k); }); }
  };
  init();
})();
