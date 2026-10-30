/* Poker Academy v2.0 — Analyser : import des historiques Winamax, statistiques, fuites, revue des coups */
(function () {
  'use strict';
  var PA = window.PA;
  var RANKS = 'AKQJT98765432';
  var POS9 = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'];

  /* ---------- Lecture d'un fichier Winamax ---------- */
  function num(s) { return parseFloat(String(s).replace(/[€\s]/g, '').replace(',', '.')) || 0; }
  function handCode(c1, c2) {
    var r1 = c1[0].toUpperCase(), r2 = c2[0].toUpperCase();
    if (r1 === '1') r1 = 'T'; if (r2 === '1') r2 = 'T';
    var i1 = RANKS.indexOf(r1), i2 = RANKS.indexOf(r2);
    if (i1 < 0 || i2 < 0) return null;
    if (i1 === i2) return r1 + r2;
    var hi = i1 < i2 ? r1 : r2, lo = i1 < i2 ? r2 : r1;
    return hi + lo + (c1[1] === c2[1] ? 's' : 'o');
  }
  function positions(seatsInOrder, btnSeat) {
    // seatsInOrder : numéros de siège actifs triés ; renvoie {seat: pos}
    var n = seatsInOrder.length, out = {};
    var bi = seatsInOrder.indexOf(btnSeat);
    if (bi < 0) { // bouton sur un siège vide : le dernier siège avant lui
      bi = 0; seatsInOrder.forEach(function (s, i) { if (s < btnSeat) bi = i; });
    }
    var ord = []; for (var k = 0; k < n; k++) ord.push(seatsInOrder[(bi + k) % n]);
    if (n === 2) { out[ord[0]] = 'SB'; out[ord[1]] = 'BB'; return out; } // en tête-à-tête, le bouton est la SB
    out[ord[0]] = 'BTN'; out[ord[1]] = 'SB'; out[ord[2]] = 'BB';
    // positions comptées à rebours depuis le bouton (CO, HJ, LJ, MP…), comme pour les ranges : à 7 joueurs, le premier à parler joue la range MP
    var rest = ord.slice(3), labels = POS9.slice(Math.max(0, POS9.length - rest.length));
    rest.forEach(function (s, i) { out[s] = labels[i] || 'UTG'; });
    return out;
  }

  var RE_HEAD = /^Winamax Poker - (.*?)HandId: #([\w-]+) - (.*?)\((\s*[\d.,€\s/]+)\) - (\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/;
  function parseHand(block) {
    var lines = block.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var m = RE_HEAD.exec(lines[0]); if (!m) return null;
    var h = { id: m[2], date: m[5].replace(/\//g, '-'), game: m[3].trim(), seats: [], acts: [], board: [], won: {}, shown: {}, invest: {}, bounty: false };
    var head = m[1];
    var tm = /Tournament "([^"]*)"/.exec(head); h.tour = tm ? tm[1] : (/CashGame/i.test(head) ? 'Cash game' : head.replace(/ - $/, '').trim());
    h.cash = !tm;
    var bi = /buyIn:\s*([\d.,]+)€?\s*\+\s*([\d.,]+)€?(?:\s*\+\s*([\d.,]+)€?)?/.exec(head);
    if (bi) { h.buyin = num(bi[1]) + num(bi[2]) + (bi[3] ? num(bi[3]) : 0); if (bi[3]) h.bounty = true; }
    var lv = /level:\s*(\d+)/.exec(head); if (lv) h.level = +lv[1];
    if (/progressive-knockout|knockout|KO/i.test(head)) h.bounty = true;
    var bl = m[4].split('/').map(num);
    if (bl.length === 3) { h.ante = bl[0]; h.sb = bl[1]; h.bb = bl[2]; } else { h.ante = 0; h.sb = bl[0]; h.bb = bl[1]; }
    var street = 'pre', i;
    for (i = 1; i < lines.length; i++) {
      var L = lines[i], r;
      if ((r = /^Table: '([^']*)' (\d+)-max.*Seat #(\d+) is the button/.exec(L))) { h.table = r[1]; h.max = +r[2]; h.btn = +r[3]; var ti = /\((\d+)\)#/.exec(r[1]); if (ti) h.tid = ti[1]; continue; }
      if ((r = /^Seat (\d+): (.+?) \(([\d.,€]+)(?:, ([\d.,€]+) bounty)?\)\s*$/.exec(L)) && street === 'pre' && !h.summary) { h.seats.push({ seat: +r[1], name: r[2], stack: num(r[3]) }); if (r[4]) h.bounty = true; continue; }
      if ((r = /^Dealt to (.+?) \[(\S\S) (\S\S)\]/.exec(L))) { h.hero = r[1]; h.cards = r[2] + ' ' + r[3]; h.hand = handCode(r[2], r[3]); continue; }
      if (/^\*\*\* PRE-FLOP/.test(L)) { street = 'pre'; continue; }
      if ((r = /^\*\*\* (FLOP|TURN|RIVER) \*\*\* (.*)$/.exec(L))) { street = r[1].toLowerCase(); h.board = (r[2].match(/\w\w/g) || []).slice(0, 5); continue; }
      if (/^\*\*\* SHOW ?DOWN/.test(L)) { street = 'sd'; h.sd = true; continue; }
      if (/^\*\*\* SUMMARY/.test(L)) { h.summary = true; street = 'sum'; continue; }
      if (/^\*\*\* ANTE\/BLINDS/.test(L)) { street = 'blinds'; continue; }
      if ((r = /^(.+?) posts (ante|small blind|big blind) ([\d.,€]+)/.exec(L))) {
        if (r[2] === 'ante') h.invest[r[1]] = (h.invest[r[1]] || 0) + num(r[3]);
        else h.acts.push({ s: 'pre', p: r[1], a: r[2] === 'small blind' ? 'sb' : 'bb', to: num(r[3]), blind: true });
        continue;
      }
      if ((r = /^(.+?) (folds|checks|calls|bets|raises)(?: ([\d.,€]+))?(?: to ([\d.,€]+))?(.*)$/.exec(L)) && street !== 'sum') {
        var a = { s: street === 'blinds' ? 'pre' : street, p: r[1], a: r[2].replace(/s$/, '').replace('checke', 'check').replace('raise', 'raise'), amt: num(r[3] || 0), allin: /all-in/.test(r[5] || '') };
        if (a.a === 'fold') a.a = 'fold'; if (a.a === 'check') a.a = 'check'; if (a.a === 'call') a.a = 'call'; if (a.a === 'bet') a.a = 'bet';
        if (r[4]) a.to = num(r[4]);
        h.acts.push(a); continue;
      }
      if ((r = /^(.+?) shows \[(\S\S) (\S\S)\]/.exec(L))) { h.shown[r[1]] = r[2] + ' ' + r[3]; continue; }
      if ((r = /^(.+?) collected ([\d.,€]+) from/.exec(L))) { h.won[r[1]] = (h.won[r[1]] || 0) + num(r[2]); continue; }
      if (street === 'sum' && (r = /^Seat \d+: (.+?)(?: \((?:button|small blind|big blind)\))*(?: showed \[.*?\])? won ([\d.,€]+)/.exec(L))) { if (!h.won[r[1]]) h.won[r[1]] = num(r[2]); continue; }
    }
    if (!h.hero || !h.bb || !h.seats.length) return null;
    computeInvest(h);
    var seatNums = h.seats.map(function (s) { return s.seat; }).sort(function (a, b) { return a - b; });
    var pm = positions(seatNums, h.btn);
    h.pos = {}; h.seats.forEach(function (s) { h.pos[s.name] = pm[s.seat]; });
    h.n = h.seats.length;
    return h;
  }
  function computeInvest(h) {
    // jetons engagés par joueur sur chaque tour (« raises X to Y » = total Y sur le tour)
    var tot = {}, k; for (k in h.invest) tot[k] = h.invest[k]; // antes
    var cur = {}, street = 'pre', bet = 0;
    h.acts.forEach(function (a) {
      if (a.s !== street) { street = a.s; cur = {}; bet = 0; }
      var prev = cur[a.p] || 0, add = 0;
      if (a.blind) { add = a.to; cur[a.p] = prev + add; bet = Math.max(bet, cur[a.p]); tot[a.p] = (tot[a.p] || 0) + add; return; }
      if (a.a === 'call') add = a.amt;
      else if (a.a === 'bet') add = a.amt;
      else if (a.a === 'raise') add = (a.to || (bet + a.amt)) - prev;
      if (add > 0) { cur[a.p] = prev + add; bet = Math.max(bet, cur[a.p]); tot[a.p] = (tot[a.p] || 0) + add; }
    });
    h.total = tot;
  }
  function parseSummary(text) {
    var m = /Tournament summary : (.*)\((\d+)\)/.exec(text); if (!m) return null;
    var g = function (re) { var r = re.exec(text); return r ? r[1] : null; };
    var name = m[1].replace(/\\u([0-9a-f]{4})/gi, function (x, c) { return String.fromCharCode(parseInt(c, 16)); }).trim();
    return { id: m[2], name: name, players: +(g(/Registered players : (\d+)/) || 0), place: +(g(/finished in (\d+)/) || 0), won: g(/You won ([\d.,]+)\s*€/) ? num(g(/You won ([\d.,]+)\s*€/)) : 0,
      buyin: g(/Buy-In : ([^\n]*)/), start: (g(/started (\d{4}\/\d\d\/\d\d \d\d:\d\d)/) || '').replace(/\//g, '-'), dur: g(/You played ([^\n]*)/) };
  }
  function parseFile(text) {
    var blocks = String(text).split(/(?=^Winamax Poker - )/m), out = [];
    blocks.forEach(function (b) { if (/^Winamax Poker/.test(b)) { try { var h = parseHand(b); if (h) out.push(h); } catch (e) {} } });
    return out;
  }

  /* ---------- Lecture préflop du héros ---------- */
  function preflopInfo(h) {
    var hero = h.hero, pre = h.acts.filter(function (a) { return a.s === 'pre' && !a.blind; });
    var raises = 0, limpers = 0, opener = null, heroFirst = null, ctx = null, heroActs = [], threeBetBy = null;
    pre.forEach(function (a) {
      if (a.p === hero) {
        if (!heroFirst) {
          ctx = raises === 0 ? (limpers ? 'limped' : 'unopened') : (raises === 1 ? 'vsOpen' : 'vs3bet+');
          heroFirst = a;
        }
        heroActs.push(a);
      } else if (heroFirst && heroActs.length === 1 && ctx === 'unopened' && (a.a === 'raise') && heroFirst.a === 'raise' && !threeBetBy) {
        threeBetBy = a.p;
      }
      if (a.a === 'raise' || (a.a === 'bet')) { raises++; if (raises === 1) opener = a.p; }
      else if (a.a === 'call' && raises === 0) limpers++;
    });
    var stack = 0; h.seats.forEach(function (s) { if (s.name === hero) stack = s.stack; });
    var bbStack = h.bb ? stack / h.bb : 0;
    var act = heroFirst ? heroFirst.a : 'walk';
    if (heroFirst && heroFirst.a === 'call' && ctx === 'unopened') act = 'limp';
    if (heroFirst && (heroFirst.allin || (heroFirst.a === 'raise' && heroFirst.to >= stack * 0.95))) act = 'allin';
    var vsAct = null;
    if (threeBetBy) { var after = heroActs[1]; vsAct = after ? (after.allin ? 'allin' : after.a) : 'fold'; }
    return {
      ctx: ctx, act: act, opener: opener, openerPos: opener ? h.pos[opener] : null, pos: h.pos[hero], bbStack: bbStack,
      vpip: heroActs.some(function (a) { return a.a === 'call' || a.a === 'raise' || a.a === 'bet'; }),
      pfr: heroActs.some(function (a) { return a.a === 'raise' || a.a === 'bet'; }),
      threeBet: ctx === 'vsOpen' && (act === 'raise' || act === 'allin'),
      faced3b: !!threeBetBy, vs3bAct: vsAct, threeBetPos: threeBetBy ? h.pos[threeBetBy] : null
    };
  }

  /* ---------- Comparaison avec ta range ---------- */
  var ACT_FR = { fold: 'te coucher', raise: 'ouvrir', limp: 'limper', allin: 'faire tapis', call: 'payer', fourbet: 'sur-relancer', check: 'checker' };
  function actFr(a, type) { if (type === 'def' && (a === 'raise' || a === 'fourbet')) return 'sur-relancer (3-bet)'; if (type === 'def' && a === 'call') return 'payer'; return ACT_FR[a] || a; }
  function compare(profileId, h, pf) {
    if (!profileId || !h.hand || !pf.pos) return null;
    var s = null, mine = pf.act;
    if (pf.ctx === 'unopened' && pf.pos !== 'BB') s = { type: 'open', pos: pf.pos, bb: pf.bbStack };
    else if (pf.ctx === 'vsOpen' && pf.openerPos && pf.bbStack > 20 && pf.openerPos !== 'SB' && pf.openerPos !== 'BB') s = { type: 'def', pos: pf.pos, opener: pf.openerPos, bb: pf.bbStack };
    if (!s) return null;
    var want; try { want = PA.actionFor(profileId, s, h.hand); } catch (e) { return null; }
    if (!want) return null;
    var norm = function (x) { return x === 'fourbet' ? 'raise' : x; };
    var w = norm(want), m = mine === 'allin' && w === 'raise' && s.type === 'open' && pf.bbStack <= 20 ? 'raise' : mine;
    if (s.type === 'open' && (w === 'allin') && mine === 'raise' && pf.bbStack <= 12) m = 'raise';
    var enter = function (x) { return x !== 'fold' && x !== 'check' && x !== 'walk'; };
    var verdict = 'ok';
    if (w === m || (w === 'raise' && m === 'allin' && s.type === 'def')) verdict = 'ok';
    else if (!enter(w) && enter(m)) verdict = 'loose';
    else if (enter(w) && !enter(m)) verdict = 'tight';
    else verdict = 'other';
    return { s: s, want: want, mine: mine, verdict: verdict };
  }

  /* ---------- Le flop en tête à tête (pour le solveur) ---------- */
  function flopInfo(h) {
    if (!h.board || h.board.length < 3 || !h.cards) return null;
    var hero = h.hero, folded = {}, raises = [], cur = {}, potPre = 0, k;
    h.acts.forEach(function (a) { if (a.s === 'pre') { if (a.a === 'fold') folded[a.p] = 1; if (a.a === 'raise' && !a.blind) raises.push(a.p); } });
    var live = h.seats.map(function (x) { return x.name; }).filter(function (n) { return !folded[n]; });
    if (live.length !== 2 || live.indexOf(hero) < 0 || !raises.length || raises.length > 2) return null;
    var vil = live[0] === hero ? live[1] : live[0];
    // le pot au flop : antes + mises préflop
    for (k in h.invest) potPre += h.invest[k];
    h.acts.forEach(function (a) {
      if (a.s !== 'pre') return;
      var prev = cur[a.p] || 0, add = 0;
      if (a.blind) add = a.to; else if (a.a === 'call' || a.a === 'bet') add = a.amt; else if (a.a === 'raise') add = (a.to || 0) - prev;
      if (add > 0) { cur[a.p] = prev + add; potPre += add; }
    });
    var st = {}; h.seats.forEach(function (x) { st[x.name] = x.stack; });
    var eff = Math.min(st[hero], st[vil]) / h.bb, pot = potPre, seq = [], fc = {};
    h.acts.forEach(function (a) {
      if (a.s !== 'flop' || (a.p !== hero && a.p !== vil)) return;
      var who = a.p === hero ? 'h' : 'v', prev = fc[a.p] || 0, tok;
      if (a.a === 'check') tok = 'x';
      else if (a.a === 'fold') tok = 'f';
      else if (a.a === 'call') { tok = a.allin ? 'c' : 'c'; fc[a.p] = prev + a.amt; pot += a.amt; }
      else if (a.a === 'bet') { tok = (a.allin ? 'A' : 'b') + Math.round(a.amt / pot * 100); fc[a.p] = prev + a.amt; pot += a.amt; }
      else if (a.a === 'raise') { var add = (a.to || 0) - prev; tok = (a.allin ? 'A' : 'r') + Math.round((a.to || 0) / h.bb * 10) / 10; fc[a.p] = prev + add; pot += add; }
      if (tok) seq.push(who + tok);
    });
    if (!seq.length) return null;
    return { b: h.board.slice(0, 3).join(''), c: h.cards.replace(' ', ''), t: raises.length === 1 ? 'srp' : '3bp', ag: raises[raises.length - 1] === hero ? 'h' : 'v',
      op: h.pos[raises[0]], hp: h.pos[hero], vp: h.pos[vil], eff: Math.round(eff * 10) / 10, pot: Math.round(potPre / h.bb * 10) / 10, s: seq };
  }

  /* ---------- Stockage (compact) ---------- */
  function key() { var p = PA.player(); return 'pa2hh_' + (p ? p.id : 'x'); }
  function loadDB() { try { return JSON.parse(localStorage.getItem(key()) || 'null') || { hands: [], hero: null }; } catch (e) { return { hands: [], hero: null }; } }
  function saveDB(db) {
    try { localStorage.setItem(key(), JSON.stringify(db)); return true; }
    catch (e) { // trop gros : on garde les plus récentes
      db.hands = db.hands.slice(-Math.floor(db.hands.length * 0.7));
      try { localStorage.setItem(key(), JSON.stringify(db)); } catch (e2) {}
      return false;
    }
  }
  function compact(h) {
    var pf = preflopInfo(h), hero = h.hero;
    var net = ((h.won[hero] || 0) - (h.total[hero] || 0)) / h.bb;
    var r = {
      id: h.id, d: h.date, t: h.tour, ti: h.tid || null, bi: h.buyin || 0, ko: h.bounty ? 1 : 0, lv: h.level || 0, bb: h.bb, n: h.n,
      h: h.hand, c: h.cards, p: pf.pos, st: Math.round(pf.bbStack * 10) / 10, cx: pf.ctx, a: pf.act, op: pf.openerPos,
      v: pf.vpip ? 1 : 0, r: pf.pfr ? 1 : 0, b3: pf.threeBet ? 1 : 0, f3: pf.faced3b ? 1 : 0, f3a: pf.vs3bAct,
      sd: h.sd && h.shown[hero] ? 1 : 0, sw: h.sd && h.won[hero] ? 1 : 0, sf: h.acts.some(function (a) { return a.p === hero && a.s === 'flop'; }) ? 1 : 0,
      net: Math.round(net * 10) / 10
    };
    // on garde le déroulé des coups importants (pot ≥ 10 BB engagés) pour la revue
    var fl = null; try { fl = flopInfo(h); } catch (e) {}
    if (fl) r.fl = fl;
    var big = (h.total[hero] || 0) / h.bb >= 10 || Math.abs(net) >= 10;
    if (big) r.log = logOf(h);
    return r;
  }
  function logOf(h) {
    var out = [], street = '', nr = 0;
    var names = {}; Object.keys(h.pos).forEach(function (n) { names[n] = n === h.hero ? 'Toi' : h.pos[n]; });
    h.acts.forEach(function (a) {
      if (a.blind) return;
      if (a.s !== street) { street = a.s; if (street !== 'pre') { var nb = street === 'flop' ? 3 : (street === 'turn' ? 4 : 5); out.push('#' + street + ' ' + h.board.slice(0, nb).join(' ')); } }
      var verb = { fold: 'se couche', check: 'checke', call: 'paie', bet: 'mise', raise: 'relance à' }[a.a] || a.a;
      if (a.a === 'raise' && a.s === 'pre' && nr === 0) verb = 'ouvre à';
      if (a.a === 'raise' && a.s === 'pre') nr++;
      var txt = names[a.p] + ' ' + verb;
      var amt = a.a === 'raise' ? (a.to || a.amt) : (a.a === 'call' || a.a === 'bet' ? a.amt : 0);
      if (amt) txt += ' ' + String(Math.round(amt / h.bb * 10) / 10).replace('.', ',') + ' BB';
      if (a.allin) txt += ' (tapis)';
      out.push(txt);
    });
    Object.keys(h.shown).forEach(function (n) { if (n !== h.hero) out.push((names[n] || n) + ' montre ' + h.shown[n]); });
    return out;
  }
  function importTexts(texts) {
    var db = loadDB(), have = {}, added = 0, read = 0, heroes = {};
    var byId = {}; db.hands.forEach(function (x) { have[x.id] = true; byId[x.id] = x; });
    db.sum = db.sum || {};
    texts.forEach(function (t) {
      var sm = parseSummary(t); if (sm) { db.sum[sm.id] = sm; return; }
      parseFile(t).forEach(function (h) {
        read++; heroes[h.hero] = (heroes[h.hero] || 0) + 1;
        if (have[h.id]) { var old = byId[h.id]; if (old && !old.fl && old.src !== 'club') { var f2 = null; try { f2 = flopInfo(h); } catch (e) {} if (f2) old.fl = f2; } return; } have[h.id] = true;
        db.hands.push(compact(h)); added++;
      });
    });
    var best = null; Object.keys(heroes).forEach(function (k) { if (!best || heroes[k] > heroes[best]) best = k; });
    if (best) db.hero = best;
    db.hands.sort(function (a, b) { return a.d < b.d ? -1 : (a.d > b.d ? 1 : 0); });
    var ok = saveDB(db);
    return { read: read, added: added, total: db.hands.length, hero: db.hero, full: !ok };
  }

  /* ---------- Statistiques ---------- */
  function pctOf(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function stats(hands, profileId) {
    var S = { n: hands.length, v: 0, r: 0, b3o: 0, b3: 0, f3o: 0, f3f: 0, net: 0, sf: 0, sd: 0, sw: 0, stealO: 0, steal: 0, bbDefO: 0, bbDef: 0, limp: 0, byPos: {}, dev: [], tours: {} };
    hands.forEach(function (x) {
      S.v += x.v; S.r += x.r; S.net += x.net; S.sf += x.sf; S.sd += x.sd; S.sw += x.sw; if (x.src === 'club') S.club = (S.club || 0) + 1;
      if (x.cx === 'vsOpen') { S.b3o++; S.b3 += x.b3; }
      if (x.f3) { S.f3o++; if (x.f3a === 'fold') S.f3f++; }
      if (x.cx === 'unopened' && (x.p === 'CO' || x.p === 'BTN' || x.p === 'SB')) { S.stealO++; if (x.a === 'raise' || x.a === 'allin') S.steal++; }
      if (x.p === 'BB' && x.cx === 'vsOpen' && (x.op === 'CO' || x.op === 'BTN' || x.op === 'SB')) { S.bbDefO++; if (x.a !== 'fold') S.bbDef++; }
      if (x.a === 'limp') S.limp++;
      var P = S.byPos[x.p] || (S.byPos[x.p] = { n: 0, v: 0, r: 0, net: 0, ok: 0, tight: 0, loose: 0, cmp: 0 });
      P.n++; P.v += x.v; P.r += x.r; P.net += x.net;
      var c = compare(profileId, { hand: x.h }, { pos: x.p, ctx: x.cx, act: x.a, openerPos: x.op, bbStack: x.st });
      if (c) { P.cmp++; P[c.verdict === 'other' ? 'ok' : c.verdict]++; if (c.verdict === 'tight' || c.verdict === 'loose') S.dev.push({ x: x, c: c }); }
      var tk = x.ti || x.t, T = S.tours[tk] || (S.tours[tk] = { n: 0, net: 0, d: x.d, bi: x.bi, name: x.t, ti: x.ti });
      T.n++; T.net += x.net;
    });
    return S;
  }
  function leaks(S) {
    var L = [], groups = {};
    S.dev.forEach(function (d) {
      var k = d.c.verdict + '|' + d.c.s.type + '|' + d.x.p + (d.c.s.type === 'def' ? '|' + d.x.op : '');
      (groups[k] || (groups[k] = [])).push(d);
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], p = k.split('|'), pos = p[2];
      var tot = (S.byPos[pos] || {}).cmp || 1;
      var where = p[1] === 'open' ? 'en ouverture depuis ' + PA.POS_LABEL[pos] : 'en défense ' + PA.POS_LABEL[pos] + ' contre une ouverture ' + PA.POS_LABEL[p[3]];
      var txt = p[0] === 'tight' ? 'Tu te couches trop ' + where : 'Tu joues trop de mains ' + where;
      L.push({ k: k, verdict: p[0], n: g.length, rate: g.length / tot, txt: txt, ex: g.slice(-4).map(function (d) { return d.x.h; }) });
    });
    L.sort(function (a, b) { return b.n - a.n; });
    return L;
  }


  /* ---------- Import automatique (appli PC) ---------- */
  var SY = { avail: null, busy: false, last: 0, info: null, msg: null };
  function pcApp() { return location.hostname === '127.0.0.1' && location.port === '47816'; }
  function autoSync(force) {
    if (!pcApp() || SY.busy || !window.PA.player()) return;
    if (!force && Date.now() - SY.last < 60000) return;
    SY.busy = true; SY.last = Date.now();
    fetch('/api/winamax', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (L) {
      SY.avail = L.found; SY.info = L;
      if (!L.found) { SY.busy = false; return; }
      var db = loadDB(), seen = db.flv === 1 ? (db.files || {}) : {}, todo = L.files.filter(function (f) { return seen[f.p] !== f.s + '-' + f.m; });
      if (!todo.length) { SY.busy = false; SY.msg = force ? 'Tout est à jour : aucune nouvelle main Winamax.' : SY.msg; if (force) U().render(); return; }
      var texts = [], i = 0;
      (function next() {
        if (i >= todo.length) {
          var res = importTexts(texts), db2 = loadDB(); db2.files = db2.files || {};
          todo.forEach(function (f) { db2.files[f.p] = f.s + '-' + f.m; }); db2.flv = 1; saveDB(db2);
          SY.busy = false; SY.msg = res.added ? res.added + ' nouvelles mains Winamax importées automatiquement.' : 'Tout est à jour : aucune nouvelle main Winamax.';
          if (/^#analyser/.test(location.hash)) U().render();
          return;
        }
        var f = todo[i++];
        fetch('/api/winamax/file?p=' + encodeURIComponent(f.p), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) { if (t) texts.push(t); next(); }).catch(next);
      })();
    }).catch(function () { SY.busy = false; SY.avail = false; });
  }
  function syncPanel() {
    if (!pcApp()) return '';
    var I = SY.info, st = SY.avail === null ? 'Recherche du dossier Winamax…' : (SY.avail ? 'Dossier Winamax trouvé' + (I && I.accounts.length ? ' (compte ' + I.accounts.map(U().esc).join(', ') + ')' : '') + ' : tes nouvelles mains sont importées toutes seules à chaque ouverture de l’appli.' : 'Je ne trouve pas Winamax sur ce PC. Si tu l’installes, ses mains seront importées toutes seules.');
    return '<div class="card stack"><b>Import automatique</b><div class="small">' + st + '</div>' + (SY.msg ? '<div class="small muted">' + U().esc(SY.msg) + '</div>' : '') + (SY.avail ? '<button class="btn" data-hact="syncNow">' + (SY.busy ? 'Synchronisation…' : 'Synchroniser maintenant') + '</button>' : '') + '</div>';
  }
  setTimeout(function () { autoSync(true); }, 1500);
  window.addEventListener('hashchange', function () { if (/^#analyser/.test(location.hash)) autoSync(false); });
  /* ---------- Écran Analyser ---------- */
  var AV = { tab: 'resume', per: 'all', busy: false, msg: null, open: null, armClear: false };
  var TARGET = { nit: [10, 13, 8, 11], tag: [16, 20, 13, 17], equilibre: [20, 24, 16, 20], lag: [26, 32, 21, 27], perso: [16, 20, 13, 17] };
  var SUITS = { s: ['♠', 0], h: ['♥', 1], d: ['♦', 1], c: ['♣', 0] };
  function U() { return window.PA_UI; }
  function cardsTxt(c) { if (!c) return ''; return c.split(' ').map(function (x) { var su = SUITS[x[1]] || ['?', 0]; return (x[0] === 'T' ? '10' : x[0]) + '<span style="color:' + (su[1] ? '#ff5a5a' : '#fff') + '">' + su[0] + '</span>'; }).join(' '); }
  function boardTxt(line) { return line.replace(/\b([2-9TJQKA][shdc])\b/g, function (m) { return cardsTxt(m); }); }
  function filtered(db) {
    var src = AV.src || 'all', H = db.hands.filter(function (x) { return src === 'all' || (src === 'club' ? x.src === 'club' : x.src !== 'club'); });
    if (AV.per === 'all' || !H.length) return H;
    var days = AV.per === '7' ? 7 : 30, last = H[H.length - 1].d.slice(0, 10);
    var lim = new Date(new Date(last + 'T00:00:00Z').getTime() - days * 86400000).toISOString().slice(0, 10);
    return H.filter(function (x) { return x.d.slice(0, 10) > lim; });
  }
  function fmtPct(x) { return x === null ? '—' : String(x).replace('.', ',') + ' %'; }
  function fmtBB(x) { var r = Math.round(x * 10) / 10; return (r > 0 ? '+' : '') + String(r).replace('.', ',') + ' BB'; }
  function stat(label, val, hint, cls) { return '<div class="card"><div class="muted small">' + label + '</div><div class="disp" style="font-size:34px' + (cls ? ';color:' + cls : '') + '">' + val + '</div>' + (hint ? '<div class="small muted">' + hint + '</div>' : '') + '</div>'; }
  function importPanel(first) {
    return '<div class="card stack"><b>' + (first ? 'Importer tes mains Winamax' : 'Ajouter des mains') + '</b>' +
      '<p class="muted small">Choisis le dossier <b>history</b> de Winamax, ou quelques fichiers .txt. Sur PC, il se trouve en général dans <span style="overflow-wrap:anywhere">C:\\Users\\<i>toi</i>\\AppData\\Roaming\\winamax\\documents\\accounts\\<i>ton pseudo</i>\\history</span>. Les mains déjà importées ne sont pas comptées deux fois.</p>' +
      '<div class="row" style="flex-wrap:wrap">' +
      '<label class="btn gold" style="cursor:pointer">Choisir le dossier<input type="file" id="hhDir" webkitdirectory directory multiple style="display:none"></label>' +
      '<label class="btn" style="cursor:pointer">Choisir des fichiers<input type="file" id="hhFiles" accept=".txt,text/plain" multiple style="display:none"></label></div>' +
      (AV.busy ? '<div class="muted">Lecture en cours…</div>' : '') + (AV.msg ? '<div>' + AV.msg + '</div>' : '') + '</div>';
  }
  /* ---------- Après le flop : tes décisions face au solveur ---------- */
  function postflopTab(H) {
    var ui = U(), SV = window.PA_SOLVER, list = H.filter(function (x) { return x.fl; });
    var miss = SV ? SV.missCount() : 0;
    var head = '<div class="card stack"><b>Tes décisions au flop face au solveur</b><div class="small muted">Pour chaque coup en tête à tête, je retrouve le coup calculé le plus proche (positions, tapis) et le flop le plus proche de la bibliothèque, puis je compare ta décision à celle du solveur avec ta main, ou avec ta famille de mains si le flop n’est pas exactement le même.</div></div>';
    var withFl = H.filter(function (x) { return x.src !== 'club'; }).length;
    if (!list.length) return head + ui.yo(withFl ? 'Tes mains ont été importées avant cette version : je n’ai pas leur déroulé au flop. ' + (window.PA_SYNC && window.PA_SYNC.isPC ? 'Sur PC, elles vont être relues automatiquement au prochain passage dans Analyser.' : 'Réimporte tes fichiers Winamax (onglet Importer) : les mains déjà présentes seront complétées.') : 'Importe des mains Winamax pour voir tes décisions au flop comparées au solveur.');
    if (!SV) return head;
    var key = list.length + '|' + list[list.length - 1].id;
    if (!AV.pf || AV.pf.key !== key) { var R = SV.review(list, function () { ui.render(); }); if (!R) return head + '<p class="muted">Chargement des solutions…</p>'; if (R.err) return head + ui.yo('Les solutions du solveur ne sont pas incluses dans cette version.'); AV.pf = { key: key, R: R }; }
    var R2 = AV.pf.R, done = R2.filter(function (r) { return !r.skip; }), out = head;
    function pct(a, b) { return b ? Math.round(a / b * 100) + ' %' : '–'; }
    var ok = done.filter(function (r) { return r.v === 'ok'; }).length, mix = done.filter(function (r) { return r.v === 'mix'; }).length;
    out += '<div class="grid2"><div class="card"><div class="muted small">Comme le solveur</div><div class="disp" style="font-size:34px">' + pct(ok, done.length) + '</div><div class="small muted">' + done.length + ' décisions comparées sur ' + list.length + ' coups</div></div><div class="card"><div class="muted small">Jouable · erreur</div><div class="disp" style="font-size:34px">' + pct(mix, done.length) + ' · ' + pct(done.length - ok - mix, done.length) + '</div></div></div>';
    function row(label, rs, famK) {
      if (!rs.length) return '';
      var me = rs.filter(function (r) { return r.hf === famK; }).length, so = 0; rs.forEach(function (r) { so += r.fm[famK]; });
      return '<tr><td>' + label + '</td><td>' + pct(me, rs.length) + '</td><td>' + Math.round(so / rs.length * 100) + ' %</td><td>' + rs.length + '</td></tr>';
    }
    var cb = done.filter(function (r) { return r.kind === 'cbet'; }), fc = done.filter(function (r) { return r.kind === 'facecb'; }), pr = done.filter(function (r) { return r.kind === 'probe'; });
    out += '<div class="card stack"><b>Tableau de bord</b><table class="tbl"><tr><th>Situation</th><th>Toi</th><th>Solveur*</th><th>Coups</th></tr>' +
      row('C-bet (relanceur préflop)', cb, 'bet') + row('Fold face au c-bet', fc, 'f') + row('Payer le c-bet', fc, 'c') + row('Relancer le c-bet (dont check-raise)', fc, 'raise') + row('Miser quand le relanceur checke', pr, 'bet') +
      '</table><div class="small muted">* Le solveur avec les mêmes mains que toi (ou la même famille de mains), dans les mêmes coups.</div></div>';
    var bad = done.filter(function (r) { return r.v !== 'ok'; }).sort(function (a, b) { return (a.v === 'err' ? 0 : 1) - (b.v === 'err' ? 0 : 1) || (a.h.d < b.h.d ? 1 : -1); }).slice(0, 25);
    var FR = { x: 'check', bet: 'mise', f: 'fold', c: 'payer', raise: 'relance' };
    out += '<div class="card stack"><b>Coups à regarder</b>' + (bad.length ? bad.map(function (r) {
      var i = R2.indexOf(r), s1 = Object.keys(r.fm).filter(function (k) { return r.fm[k] >= 0.05; }).sort(function (a, b) { return r.fm[b] - r.fm[a]; }).map(function (k) { return FR[k] + ' ' + Math.round(r.fm[k] * 100) + ' %'; }).join(' · ');
      return '<div style="border-bottom:1px solid var(--line);padding:8px 0" class="stack"><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><span class="chip" style="border-color:' + (r.v === 'err' ? '#e03131' : '#ffd43b') + ';color:' + (r.v === 'err' ? '#ff8080' : '#ffd43b') + '">' + (r.v === 'err' ? 'Erreur' : 'Mixte') + '</span>' + SV.cardsTxt(r.h.fl.c) + ' <span class="small muted">sur</span> ' + SV.cardsTxt(r.h.fl.b) + '</div>' +
        '<div class="small">' + ui.esc(r.h.fl.hp) + ' contre ' + ui.esc(r.h.fl.vp) + (r.h.fl.t === '3bp' ? ', pot 3-bet' : '') + ' · ' + r.cat + ' · toi : <b>' + FR[r.hf] + (r.hf === 'bet' || r.hf === 'raise' ? ' ' + SV.shortLabel(r.heroTok) : '') + '</b></div>' +
        '<div class="small">Solveur : ' + s1 + (r.bestBet && r.fm.bet > 0.3 ? ' (taille préférée ' + SV.shortLabel(r.bestBet) + ')' : '') + '</div>' +
        '<div class="small muted">' + (r.how === 'exact' ? 'Même flop, ta main exacte.' : 'Flop proche ' + SV.cardsTxt(r.flop) + ', ta famille de mains.') + (r.exact ? '' : ' Coup approché (positions ou tapis différents).') + '</div>' +
        '<button class="btn" data-hact="pfopen" data-v="' + i + '" style="min-height:38px">Voir dans le solveur</button></div>';
    }).join('') : '<div class="small muted">Aucune décision très éloignée du solveur. Bravo.</div>') + '</div>';
    out += '<a class="btn gold" href="#apresflop?revoir">Rejouer mes coups ratés dans l’exercice' + (miss ? ' (' + miss + ')' : '') + '</a>';
    return out;
  }
  function tabs() {
    var T = [['resume', 'Résumé'], ['positions', 'Par position'], ['fuites', 'Fuites'], ['postflop', 'Après le flop'], ['coups', 'Coups clés'], ['tournois', 'Tournois'], ['club', 'Club'], ['adv', 'Adversaires'], ['import', 'Importer']];
    return '<div class="seg">' + T.map(function (t) { return '<button class="' + (AV.tab === t[0] ? 'on' : '') + '" data-hact="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      (AV.tab === 'import' || AV.tab === 'club' || AV.tab === 'adv' ? '' : '<div class="seg">' + [['all', 'Tout'], ['30', '30 jours'], ['7', '7 jours']].map(function (t) { return '<button class="' + (AV.per === t[0] ? 'on' : '') + '" data-hact="per" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') +
        [['all', 'Winamax + club'], ['wina', 'Winamax'], ['club', 'Club']].map(function (t) { return '<button class="' + ((AV.src || 'all') === t[0] ? 'on' : '') + '" data-hact="src" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>');
  }
  function resume(H, S, prof) {
    var vp = pctOf(S.v, S.n), pr = pctOf(S.r, S.n), tg = TARGET[prof] || TARGET.tag, P = window.PA.PROFILES[prof] || window.PA.PROFILES.tag;
    var bb100 = S.n ? S.net / S.n * 100 : 0;
    var com = [];
    if (S.n < 300) com.push('Avec ' + S.n + ' mains, les chiffres bougent encore beaucoup : il en faut au moins 1 000 pour qu’ils veuillent vraiment dire quelque chose.');
    if (vp !== null && vp < tg[0] - 2) com.push('Tu joues ' + fmtPct(vp) + ' de tes mains, moins que ton profil ' + P.short + ' (' + tg[0] + ' à ' + tg[1] + ' %). Tu laisses passer des mains rentables : regarde l’onglet Fuites.');
    else if (vp !== null && vp > tg[1] + 2) com.push('Tu joues ' + fmtPct(vp) + ' de tes mains, plus que ton profil ' + P.short + ' (' + tg[0] + ' à ' + tg[1] + ' %). Regarde où tu entres trop souvent.');
    else if (vp !== null) com.push('Ton VPIP (' + fmtPct(vp) + ') colle à ton profil ' + P.short + '.');
    if (vp && pr !== null && vp - pr > 6) com.push('Écart VPIP-PFR de ' + Math.round(vp - pr) + ' points : tu paies beaucoup et relances peu. En tournoi, entre plutôt en relançant.');
    var st = pctOf(S.steal, S.stealO), bd = pctOf(S.bbDef, S.bbDefO);
    if (S.stealO >= 15 && st !== null && st < 25) com.push('Tu ne voles que ' + fmtPct(st) + ' du temps quand personne n’est entré en CO, au bouton ou en SB : c’est là que les jetons sont faciles. Vise au moins 30 à 40 %.');
    if (S.bbDefO >= 10 && bd !== null && bd < 30) com.push('En BB face à un vol, tu défends ' + fmtPct(bd) + ' : avec une cote déjà payée, tu peux défendre plus large.');
    if (S.limp > 0 && S.limp / Math.max(1, S.n) > 0.02) com.push('Tu limpes ' + S.limp + ' fois. Hors SB, ouvre ou couche-toi.');
    var g = '<div class="grid2">' +
      stat('Mains', S.n, '') + stat('Résultat', fmtBB(S.net), (Math.round(bb100 * 10) / 10 + ' BB / 100 mains').replace('.', ','), S.net >= 0 ? '#4fe08f' : '#ff8080') +
      stat('VPIP', fmtPct(vp), 'mains jouées · cible ' + tg[0] + '-' + tg[1] + ' %') + stat('PFR', fmtPct(pr), 'mains relancées · cible ' + tg[2] + '-' + tg[3] + ' %') +
      stat('3-bet', fmtPct(pctOf(S.b3, S.b3o)), 'face à une ouverture (' + S.b3o + ' fois)') + stat('Vol', fmtPct(pctOf(S.steal, S.stealO)), 'ouverture CO, bouton, SB quand personne n’est entré') +
      stat('Défense BB', fmtPct(pctOf(S.bbDef, S.bbDefO)), 'face à un vol (' + S.bbDefO + ' fois)') + stat('Fold au 3-bet', fmtPct(pctOf(S.f3f, S.f3o)), 'après ton ouverture (' + S.f3o + ' fois)') +
      stat('Abattage', fmtPct(pctOf(S.sd, S.sf)), 'quand tu vois le flop') + stat('Gagné à l’abattage', fmtPct(pctOf(S.sw, S.sd)), '') + '</div>';
    return U().yo(com.join(' ')) + g;
  }
  function positionsTab(S) {
    var order = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    return '<div class="card stack"><b>Par position</b><div class="muted small">« Conforme » : part de tes décisions préflop (ouverture et défense) identiques à ta range.</div><table class="tbl"><tr><th>Position</th><th>Mains</th><th>VPIP</th><th>PFR</th><th>Résultat</th><th>Conforme</th></tr>' +
      order.filter(function (p) { return S.byPos[p]; }).map(function (p) { var P = S.byPos[p]; return '<tr><td>' + window.PA.POS_LABEL[p] + '</td><td>' + P.n + '</td><td>' + fmtPct(pctOf(P.v, P.n)) + '</td><td>' + fmtPct(pctOf(P.r, P.n)) + '</td><td style="color:' + (P.net >= 0 ? '#4fe08f' : '#ff8080') + '">' + fmtBB(P.net) + '</td><td>' + (P.cmp ? fmtPct(pctOf(P.ok, P.cmp)) : '—') + '</td></tr>'; }).join('') + '</table></div>';
  }
  function fuitesTab(S) {
    var L = leaks(S).filter(function (l) { return l.n >= 2; }).slice(0, 8);
    var iso = S.dev.slice(-20).reverse().map(function (d) {
      var where = d.c.s.type === 'open' ? 'ouverture ' + window.PA.POS_LABEL[d.x.p] : window.PA.POS_LABEL[d.x.p] + ' face à ' + window.PA.POS_LABEL[d.x.op];
      return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:6px 0"><span><b>' + showHand(d.x) + '</b> · ' + where + ' · ' + Math.round(d.x.st) + ' BB<br><span class="small muted">Toi : ' + actFr(d.c.mine, d.c.s.type) + ' · ta range : ' + actFr(d.c.want, d.c.s.type) + '</span></span><button class="btn" data-hact="range" data-v="' + S.dev.indexOf(d) + '" style="min-height:40px;padding:4px 10px">Range</button></div>';
    }).join('');
    var isoCard = S.dev.length ? '<div class="card stack"><b>Tous les écarts avec ta range</b><div class="small muted">' + S.dev.length + (S.dev.length > 1 ? ' décisions préflop différentes' : ' décision préflop différente') + ' de ta range, les plus récentes en premier.</div>' + iso + '</div>' : '';
    if (!L.length) return U().yo(S.dev.length ? 'Pas encore de fuite qui se répète : seulement des écarts isolés, listés ci-dessous. Il faut plus de mains pour voir une vraie tendance.' : 'Aucun écart avec ta range sur ces mains. Bravo.') + isoCard;
    return U().yo('Voici les écarts qui reviennent le plus entre tes mains et ta range. Commence par le premier : c’est celui qui te coûte le plus souvent.') +
      L.map(function (l, i) {
        var g = S.dev.filter(function (d) { return (d.c.verdict + '|' + d.c.s.type + '|' + d.x.p + (d.c.s.type === 'def' ? '|' + d.x.op : '')) === l.k; });
        var ex = g.slice(-1)[0];
        return '<div class="card stack"><div class="row" style="justify-content:space-between"><b>' + (i + 1) + '. ' + l.txt + '</b><span class="chip">' + l.n + ' fois</span></div>' +
          '<div class="small muted">Exemples : ' + g.slice(-5).map(function (d) { return showHand(d.x) + ' (ta range : ' + actFr(d.c.want, d.c.s.type) + ')'; }).join(' · ') + '</div>' +
          '<button class="btn" data-hact="range" data-v="' + S.dev.indexOf(ex) + '">Voir dans ma range</button></div>';
      }).join('') + isoCard;
  }
  function coupsTab(H) {
    var db0 = loadDB();
    var big = H.filter(function (x) { return x.log; }).sort(function (a, b) { return Math.abs(b.net) - Math.abs(a.net); }).slice(0, 30);
    if (!big.length) return U().yo('Pas encore de gros coup (10 BB ou plus) dans ces mains.') + exchangeBlock(db0) + receivedBlock(db0);
    return U().yo('Les coups où tu as engagé ou gagné le plus. Ouvre-les pour les rejouer dans ta tête : qu’aurais-tu fait autrement ?') +
      big.map(function (x) {
        var open = AV.open === x.id;
        var c = compare(window.PA.player().profile || 'tag', { hand: x.h }, { pos: x.p, ctx: x.cx, act: x.a, openerPos: x.op, bbStack: x.st });
        var note = c ? (c.verdict === 'ok' || c.verdict === 'other' ? 'Préflop conforme à ta range.' : 'Préflop : ta range dit « ' + actFr(c.want, c.s.type) + ' », tu as choisi « ' + actFr(c.mine, c.s.type) + ' ».') : '';
        return '<div class="card stack"><button class="row" data-hact="open" data-v="' + x.id + '" style="justify-content:space-between;background:none;border:0;color:inherit;padding:0;text-align:left;width:100%"><span><b>' + showHand(x) + '</b> · ' + window.PA.POS_LABEL[x.p] + ' · ' + String(x.st).replace('.', ',') + ' BB</span><span style="color:' + (x.net >= 0 ? '#4fe08f' : '#ff8080') + ';font-weight:700">' + fmtBB(x.net) + '</span></button>' +
          (open ? '<div class="small muted">' + U().esc(x.t) + ' · ' + x.d.replace(/^(\d{4})-(\d\d)-(\d\d) (\d\d:\d\d).*/, '$3/$2/$1 $4') + '</div><div class="stack" style="gap:2px">' + x.log.map(function (l) { return l[0] === '#' ? '<div style="margin-top:6px"><b>' + ({ flop: 'Flop', turn: 'Turn', river: 'River' }[l.slice(1).split(' ')[0]]) + '</b> ' + boardTxt(l.split(' ').slice(1).join(' ')) + '</div>' : '<div>' + boardTxt(U().esc(l)) + '</div>'; }).join('') + '</div>' + (note ? U().yo(note) : '') + '<button class="btn" data-hact="share" data-v="' + x.id + '">Partager en image</button>' + notesBlock(x) : '') + '</div>';
      }).join('') + exchangeBlock(db0) + receivedBlock(db0);
  }
  /* ---------- Commentaires et échange de mains (avec Lionel ou un autre joueur) ---------- */
  function notesBlock(x) {
    var ui = U(), N = x.notes || [];
    return '<div class="stack" style="gap:6px;border-top:1px solid var(--line);padding-top:8px"><b>Commentaires</b>' +
      (N.length ? N.map(function (n) { return '<div class="small"><b>' + ui.esc(n.by) + '</b> <span class="muted">' + new Date(n.at).toLocaleDateString('fr-FR') + '</span><br>' + ui.esc(n.t).replace(/\n/g, '<br>') + '</div>'; }).join('') : '<div class="small muted">Aucun commentaire. Note ce que tu en penses, ou envoie la main à Lionel pour avoir son avis.</div>') +
      '<textarea id="hn_' + x.id + '" rows="2" placeholder="Ton commentaire…" style="width:100%;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:8px;font:inherit"></textarea>' +
      '<button class="btn" data-hact="addnote" data-v="' + x.id + '">Ajouter le commentaire</button></div>';
  }
  function exchangeBlock(db) {
    var n = db.hands.filter(function (x) { return x.log && x.notes && x.notes.length; }).length;
    return '<div class="card stack"><b>Échanger des mains commentées</b><div class="small muted">Envoie tes mains commentées à Lionel (ou à un autre joueur de l’appli) : il les importe, ajoute ses commentaires et te les renvoie. Ses commentaires s’ajoutent alors aux tiens.</div>' +
      '<button class="btn gold" data-hact="sendnotes"' + (n ? '' : ' disabled') + '>Envoyer mes ' + n + ' mains commentées</button>' +
      '<label class="btn" style="text-align:center">Importer des mains reçues<input type="file" accept=".json,application/json" data-hfile="mains" style="display:none"></label>' + (AV.xmsg ? '<div class="small">' + U().esc(AV.xmsg) + '</div>' : '') + '</div>';
  }
  function receivedBlock(db) {
    var R = db.recus || []; if (!R.length) return '';
    return '<h2>Mains reçues</h2>' + R.map(function (x) {
      var open = AV.open === 'r' + x.id;
      return '<div class="card stack"><button class="row" data-hact="open" data-v="r' + x.id + '" style="justify-content:space-between;background:none;border:0;color:inherit;padding:0;text-align:left;width:100%"><span><b>' + showHand(x) + '</b> · ' + U().esc(x.from || '') + '</span><span class="small muted">' + (x.notes || []).length + ' comm.</span></button>' +
        (open ? '<div class="stack" style="gap:2px">' + (x.log || []).map(function (l) { return l[0] === '#' ? '<div style="margin-top:6px"><b>' + ({ flop: 'Flop', turn: 'Turn', river: 'River' }[l.slice(1).split(' ')[0]]) + '</b> ' + boardTxt(l.split(' ').slice(1).join(' ')) + '</div>' : '<div>' + boardTxt(U().esc(l)) + '</div>'; }).join('') + '</div>' + notesBlock(x) : '') + '</div>';
    }).join('') + '<button class="btn gold" data-hact="sendrecus">Renvoyer les mains reçues avec mes commentaires</button>';
  }
  function findHand(db, id) { var r = null; db.hands.forEach(function (x) { if (x.id === id) r = x; }); (db.recus || []).forEach(function (x) { if (x.id === id) r = x; }); return r; }
  function deliver(obj, name) {
    var txt = JSON.stringify(obj);
    if (window.PAAndroid && PAAndroid.shareFile) { PAAndroid.shareFile(btoa(unescape(encodeURIComponent(txt))), name, 'application/json'); return; }
    if (pcApp()) { fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, content: txt }) }).then(function (r) { return r.json(); }).then(function (j) { AV.xmsg = 'Fichier enregistré dans ' + j.path + ' : envoie-le par mail ou par message.'; U().render(); }).catch(function () { AV.xmsg = 'Enregistrement impossible.'; U().render(); }); return; }
    if (window.PA_SYNC && window.PA_SYNC.shareFile(txt, name)) return;
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function sendHands(list) {
    var me = window.PA.player().pseudo, d = new Date();
    deliver({ app: 'Poker Academy', kind: 'mains', from: me, at: Date.now(), hands: list.map(function (x) { return { id: x.id, d: x.d, t: x.t, h: x.h, c: x.c, p: x.p, st: x.st, net: x.net, bb: x.bb, log: x.log, notes: x.notes || [], from: x.from }; }) },
      'mains-commentees-' + me.replace(/[^A-Za-z0-9]/g, '') + '-' + d.toISOString().slice(0, 10) + '.json');
  }
  function importHands(text) {
    var j; try { j = JSON.parse(text); } catch (e) { j = null; }
    if (!j || j.kind !== 'mains' || !j.hands) { AV.xmsg = 'Ce fichier n’est pas un envoi de mains Poker Academy.'; return; }
    var db = loadDB(), me = window.PA.player().pseudo, back = 0, nw = 0; db.recus = db.recus || [];
    j.hands.forEach(function (h) {
      var mine = null; db.hands.forEach(function (x) { if (x.id === h.id) mine = x; });
      var tgt = mine; if (!tgt) (db.recus).forEach(function (x) { if (x.id === h.id) tgt = x; });
      if (!tgt) { tgt = { id: h.id, d: h.d, t: h.t, h: h.h, c: h.c, p: h.p, st: h.st, net: h.net, bb: h.bb, log: h.log, notes: [], from: j.from }; db.recus.unshift(tgt); nw++; } else back++;
      tgt.notes = tgt.notes || [];
      (h.notes || []).forEach(function (n) { if (!tgt.notes.some(function (m) { return m.at === n.at && m.by === n.by; })) tgt.notes.push(n); });
      tgt.notes.sort(function (a, b) { return a.at - b.at; });
    });
    saveDB(db); AV.xmsg = (nw ? nw + ' main(s) reçue(s) de ' + j.from + '. ' : '') + (back ? back + ' main(s) déjà connue(s), commentaires de ' + j.from + ' ajoutés.' : '');
  }
  function tournoisTab(S) {
    var sum = loadDB().sum || {};
    var T = Object.keys(S.tours).map(function (k) { return S.tours[k]; }).sort(function (a, b) { return a.d < b.d ? 1 : -1; });
    return '<div class="card stack"><b>Par tournoi</b><table class="tbl"><tr><th>Tournoi</th><th>Mains</th><th>Jetons</th><th>Place</th></tr>' + T.map(function (t) {
      var sm = t.ti && sum[t.ti];
      var place = sm && sm.place ? sm.place + '<sup>e</sup>' + (sm.players ? ' / ' + sm.players : '') + (sm.won ? '<div class="small" style="color:#4fe08f">+' + String(sm.won).replace('.', ',') + ' €</div>' : '') : '<span class="muted">—</span>';
      return '<tr><td>' + U().esc(t.name) + '<div class="small muted">' + t.d.slice(0, 10).split('-').reverse().join('/') + (t.bi ? ' · ' + String(t.bi).replace('.', ',') + ' €' : '') + (sm && sm.dur ? ' · ' + U().esc(sm.dur.replace(/\s*\d+s\s*$/, '')) : '') + '</div></td><td>' + t.n + '</td><td style="color:' + (t.net >= 0 ? '#4fe08f' : '#ff8080') + '">' + fmtBB(t.net) + '</td><td>' + place + '</td></tr>';
    }).join('') + '</table><div class="small muted">Jetons gagnés ou perdus, en BB, sur les mains jouées. La place vient du fichier « summary » de Winamax : importe-le avec les mains.</div></div>';
  }
  function view() {
    var ui = U(), db = loadDB(), p = window.PA.player(), prof = p.profile || 'tag';
    var body = '<div class="stack"><h1>Analyser</h1>';
    if (!db.hands.length) {
      if (AV.tab === 'club') return ui.shell('analyser', body + '<button class="back" data-hact="tab" data-v="resume">‹ Analyser</button>' + clubTab(db) + '</div>');
      if (AV.tab === 'adv') return ui.shell('analyser', body + '<button class="back" data-hact="tab" data-v="resume">‹ Analyser</button><h2>Adversaires du club</h2>' + carnetTab() + '</div>');
      body += syncPanel();
      body += ui.yo('Envoie-moi tes mains Winamax ou note tes mains du club : je calcule tes statistiques, je les compare à ta range et je te montre où tu perds des jetons. Tout reste sur cet appareil.') + importPanel(true) +
        '<button class="btn gold" data-hact="tab" data-v="club">Noter une main du club</button><button class="btn" data-hact="tab" data-v="adv">Carnet des adversaires du club</button>';
      return ui.shell('analyser', body + '</div>');
    }
    var H = filtered(db), S = stats(H, prof);
    var nc = db.hands.filter(function (x) { return x.src === 'club'; }).length;
    body += '<div class="muted small">' + (db.hands.length - nc) + ' mains Winamax' + (db.hero ? ' (<b>' + ui.esc(db.hero) + '</b>)' : '') + ' · ' + nc + ' mains du club</div>' + tabs();
    if (AV.tab === 'resume') body += resume(H, S, prof);
    else if (AV.tab === 'positions') body += positionsTab(S);
    else if (AV.tab === 'fuites') { AV.S = S; body += fuitesTab(S); }
    else if (AV.tab === 'coups') body += coupsTab(H);
    else if (AV.tab === 'postflop') body += postflopTab(H);
    else if (AV.tab === 'tournois') body += tournoisTab(S);
    else if (AV.tab === 'club') body += clubTab(db);
    else if (AV.tab === 'adv') body += carnetTab();
    else body += syncPanel() + importPanel(false) + '<div class="card stack"><b>Effacer les mains importées</b><p class="muted small">Supprime les mains de ce joueur sur cet appareil. Tes fichiers Winamax ne sont pas touchés.</p><button class="btn" data-hact="clear" style="border-color:#e03131;color:#ff8080">' + (AV.armClear ? 'Confirmer : effacer les mains' : 'Effacer les mains') + '</button></div>';
    return ui.shell('analyser', body + '</div>');
  }
  function readFiles(list) {
    var files = Array.prototype.filter.call(list, function (f) { return /\.txt$/i.test(f.name); });
    if (!files.length) { AV.msg = 'Aucun fichier de mains (.txt) trouvé.'; U().render(); return; }
    AV.busy = true; AV.msg = null; U().render();
    var texts = [], left = files.length;
    files.forEach(function (f) {
      var r = new FileReader();
      r.onload = function () { texts.push(String(r.result)); done(); };
      r.onerror = done; r.readAsText(f, 'utf-8');
    });
    function done() {
      if (--left > 0) return;
      var res = importTexts(texts);
      AV.busy = false;
      AV.msg = res.read ? res.added + ' nouvelles mains importées (' + res.read + ' lues, ' + files.length + ' fichiers). Total : ' + res.total + '.' + (res.full ? ' La mémoire de l’appareil est pleine : seules les mains les plus récentes sont gardées.' : '') : 'Je n’ai reconnu aucune main Winamax dans ces fichiers.';
      if (res.added) AV.tab = 'resume';
      U().render();
    }
  }



  /* ---------- Partager une main en image ---------- */
  var SU = { s: ['♠', '#111'], h: ['♥', '#d61f1f'], d: ['♦', '#d61f1f'], c: ['♣', '#111'] };
  function drawCard(g, x, y, w, h, card) {
    g.fillStyle = '#fff'; g.strokeStyle = '#ffd43b'; g.lineWidth = 3;
    var r = 12; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); g.stroke();
    var su = SU[card[1]] || ['?', '#111'], rk = card[0] === 'T' ? '10' : card[0];
    g.fillStyle = su[1]; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 ' + Math.round(h * 0.38) + 'px "Big Shoulders Display", Impact, sans-serif'; g.fillText(rk, x + w / 2, y + h * 0.36);
    g.font = Math.round(h * 0.36) + 'px sans-serif'; g.fillText(su[0], x + w / 2, y + h * 0.74);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }
  function wrapText(g, text, maxW) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  function handImage(x) {
    var W = 1080, lines = [], P = window.PA.POS_LABEL[x.p] || x.p;
    var c = compare(window.PA.player().profile || 'tag', { hand: x.h }, { pos: x.p, ctx: x.cx, act: x.a, openerPos: x.op, bbStack: x.st });
    var cv = document.createElement('canvas'), g = cv.getContext('2d');
    g.font = '36px "IBM Plex Sans", Arial, sans-serif';
    var body = [];
    if (x.log) x.log.forEach(function (l) { body.push(l[0] === '#' ? { street: l.slice(1).split(' ')[0], cards: l.split(' ').slice(1) } : { t: l }); });
    else body.push({ t: (x.cx === 'unopened' ? 'Personne n’était entré' : x.cx === 'limped' ? 'Un ou des limps devant' : 'Ouverture ' + (window.PA.POS_LABEL[x.op] || '')) + ' · ' + actFr(x.a, x.cx === 'vsOpen' ? 'def' : 'open') });
    if (x.note) body.push({ t: 'Note : ' + x.note });
    // hauteur
    var H = 420; body.forEach(function (b) { H += b.street ? 150 : 52 * Math.max(1, wrapText(g, b.t, W - 120).length); });
    if (c) H += 120; H += 110;
    cv.width = W; cv.height = H;
    g.fillStyle = '#0b0b0d'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffd43b'; g.fillRect(0, 0, W, 14);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#ffd43b'; g.font = '800 64px "Big Shoulders Display", Impact, sans-serif'; g.fillText('POKER ACADEMY', 60, 100);
    g.fillStyle = '#c9c9cf'; g.font = '32px "IBM Plex Sans", Arial, sans-serif';
    g.fillText((x.t || '') + ' · ' + x.d.slice(0, 10).split('-').reverse().join('/'), 60, 150);
    // main
    if (x.c) { var cs = x.c.split(' '); drawCard(g, 60, 190, 130, 180, cs[0]); drawCard(g, 205, 190, 130, 180, cs[1]); }
    else { g.fillStyle = '#fff'; g.font = '800 120px "Big Shoulders Display", Impact, sans-serif'; g.fillText(x.h.replace(/T/g, '10'), 60, 330); }
    g.fillStyle = '#fff'; g.font = '700 44px "IBM Plex Sans", Arial, sans-serif'; g.fillText(P + ' · ' + String(Math.round(x.st)) + ' BB', 380, 260);
    g.fillStyle = x.net >= 0 ? '#4fe08f' : '#ff8080'; g.font = '700 40px "IBM Plex Sans", Arial, sans-serif'; g.fillText(fmtBB(x.net), 380, 320);
    var y = 430;
    body.forEach(function (b) {
      if (b.street) {
        g.fillStyle = '#ffd43b'; g.font = '700 36px "IBM Plex Sans", Arial, sans-serif'; g.fillText({ flop: 'Flop', turn: 'Turn', river: 'River' }[b.street] || b.street, 60, y + 70);
        b.cards.forEach(function (cd, i) { drawCard(g, 220 + i * 100, y + 10, 86, 120, cd); }); y += 150;
      } else {
        g.fillStyle = '#e8e8ec'; g.font = '36px "IBM Plex Sans", Arial, sans-serif';
        wrapText(g, b.t, W - 120).forEach(function (ln) { g.fillText(ln, 60, y + 36); y += 52; });
      }
    });
    if (c) {
      y += 20; g.fillStyle = '#1b1b20'; g.fillRect(40, y, W - 80, 90); g.fillStyle = '#ffd43b'; g.font = '700 32px "IBM Plex Sans", Arial, sans-serif';
      g.fillText('Ma range : ' + actFr(c.want, c.s.type) + ' · Mon choix : ' + actFr(c.mine, c.s.type), 64, y + 56); y += 100;
    }
    g.fillStyle = '#8a8a93'; g.font = '28px "IBM Plex Sans", Arial, sans-serif'; g.fillText('Partagé depuis Poker Academy', 60, H - 40);
    return cv;
  }
  function shareHand(id) {
    var x = loadDB().hands.filter(function (h) { return h.id === id; })[0]; if (!x) return;
    var cv = handImage(x), url = cv.toDataURL('image/png'), name = 'main-' + x.h + '-' + x.d.slice(0, 10) + '.png';
    var old = document.getElementById('paShare'); if (old) old.remove();
    var box = document.createElement('div'); box.id = 'paShare';
    box.setAttribute('style', 'position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;overflow:auto');
    var canShare = false; try { canShare = !!(navigator.canShare && navigator.share); } catch (e) {}
    box.innerHTML = '<img src="' + url + '" alt="La main en image" style="display:block;width:auto;height:auto;max-width:min(520px,100%);max-height:68vh;object-fit:contain;flex:none;border-radius:12px;border:2px solid #ffd43b">' +
      '<div class="row" style="flex-wrap:wrap;justify-content:center">' +
      (window.PAAndroid ? '<button class="btn gold" data-hact="shareAndroid">Partager</button>' : (canShare ? '<button class="btn gold" data-hact="shareNative">Partager</button>' : '')) +
      (window.PAAndroid ? '' : '<a class="btn' + (canShare ? '' : ' gold') + '" href="' + url + '" download="' + name + '">Enregistrer l’image</a>') +
      '<button class="btn" data-hact="shareClose">Fermer</button></div>' +
      '<div class="small muted" style="text-align:center">Sur PC, tu peux aussi faire un clic droit sur l’image puis « Copier l’image », et la coller dans un message.</div>';
    document.body.appendChild(box);
    AV.shareUrl = url; AV.shareName = name; AV.shareCanvas = cv;
  }
  /* ---------- Carnet des adversaires du club ---------- */
  var OPP = [
    ['nit', 'Nit (très serré)', '~10/8', 'Vole-le, couche-toi face à sa grosse mise.'],
    ['reg', 'Régulier', '~18/15', 'Joue standard, cherche ses petites fuites.'],
    ['lag', 'Large-agressif', '~28/22', 'Paie plus large, piège tes grosses mains.'],
    ['lp', 'Large-passif', '~35/10', 'Isole-le et mise fort pour la valeur ; respecte ses relances.'],
    ['station', 'Calling station', '~40/6', 'Jamais de bluff, mise gros sur trois rues.'],
    ['maniac', 'Maniac', '45+/35+', 'Laisse-le bluffer, paie plus large.'],
    ['fan', 'Récréatif fantasque', 'variable', 'Reste simple, lis ses tailles, mise pour la valeur.'],
    ['surv', 'Survivant', '~12/10', 'Vole-le à la bulle, respecte son tapis.']];
  var OPPI = {}; OPP.forEach(function (o) { OPPI[o[0]] = o; });
  var CA = { edit: null, q: '' };
  function opps() { var p = window.PA.player(); p.opps = p.opps || []; return p.opps; }
  function carnetTab() {
    var ui = U(), L = opps().slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
    var e = CA.edit ? (CA.edit === 'new' ? { id: 'new', name: '', prof: 'fan', note: '' } : opps().filter(function (o) { return o.id === CA.edit; })[0]) : null;
    if (e && (CA.tmpName !== undefined || CA.tmpNote !== undefined)) { e = { id: e.id, name: CA.tmpName !== undefined ? CA.tmpName : e.name, prof: e.prof, note: CA.tmpNote !== undefined ? CA.tmpNote : e.note }; }
    var form = e ? '<div class="card stack"><b>' + (e.id === 'new' ? 'Nouvel adversaire' : 'Modifier la fiche') + '</b>' +
      '<label class="stack" style="gap:4px"><span class="small muted">Pseudo ou prénom</span><input id="opName" value="' + ui.esc(e.name) + '" style="min-height:44px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 10px;font:inherit"></label>' +
      '<div class="small muted">Son profil</div><div class="seg">' + OPP.map(function (o) { return '<button class="' + (CA.prof === o[0] ? 'on' : '') + '" data-hact="opProf" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      (CA.prof ? '<div class="small muted">Mains jouées / relance : ' + OPPI[CA.prof][2] + ' · ' + OPPI[CA.prof][3] + '</div>' : '') +
      '<label class="stack" style="gap:4px"><span class="small muted">Note libre (ce qu’il a montré, ses habitudes, ses tailles)</span><textarea id="opNote" rows="3" style="background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:8px;font:inherit">' + ui.esc(e.note || '') + '</textarea></label>' +
      '<div class="row"><button class="btn gold" data-hact="opSave" style="flex:1">Enregistrer</button><button class="btn" data-hact="opCancel">Annuler</button>' + (e.id !== 'new' ? '<button class="btn" data-hact="opDel" style="border-color:#e03131;color:#ff8080">' + (CA.armDel ? 'Confirmer' : 'Supprimer') + '</button>' : '') + '</div></div>' : '';
    var list = L.length ? L.map(function (o) {
      var P = OPPI[o.prof] || OPPI.fan;
      return '<div class="card stack" style="gap:6px"><div class="row" style="justify-content:space-between"><b class="disp" style="font-size:1.3em">' + ui.esc(o.name) + '</b><span class="chip">' + P[1] + '</span></div><div class="small">' + P[3] + '</div>' + (o.note ? '<div class="small muted">' + ui.esc(o.note) + '</div>' : '') + '<div class="row" style="justify-content:space-between"><span class="small muted">Mis à jour le ' + new Date(o.upd).toLocaleDateString('fr-FR') + '</span><button class="btn" data-hact="opEdit" data-v="' + o.id + '" style="min-height:40px;padding:4px 12px">Modifier</button></div></div>';
    }).join('') : '';
    return ui.yo(L.length ? 'Relis ces fiches avant une soirée au club : un seul ajustement par joueur suffit. Mets-les à jour quand quelqu’un montre ses cartes.' : 'Crée une fiche par habitué du club : son profil parmi les huit, et ce que tu as remarqué. Avant chaque soirée, tu relis ses fiches et tu sais comment jouer contre chacun.') +
      (e ? form : '<button class="btn gold" data-hact="opNew">Ajouter un adversaire</button>') + list;
  }
  function opSave() {
    var name = (document.getElementById('opName').value || '').trim(), note = document.getElementById('opNote').value || '';
    if (!name) return;
    var L = opps();
    if (CA.edit === 'new') L.push({ id: 'o' + Date.now(), name: name, prof: CA.prof || 'fan', note: note, upd: Date.now() });
    else L.forEach(function (o) { if (o.id === CA.edit) { o.name = name; o.prof = CA.prof || o.prof; o.note = note; o.upd = Date.now(); } });
    window.PA.save(); CA.edit = null; CA.prof = null; CA.tmpName = undefined; CA.tmpNote = undefined;
  }
  /* ---------- Saisie rapide des mains du club ---------- */
  var CF = { pos: null, r1: null, r2: null, suited: false, st: 40, cx: 'unopened', op: null, a: null, res: 'pre', amt: '', note: '', fb: null };
  var POS_ALL = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  function clubHand() {
    if (!CF.r1 || !CF.r2) return null;
    var i1 = RANKS.indexOf(CF.r1), i2 = RANKS.indexOf(CF.r2);
    if (i1 === i2) return CF.r1 + CF.r2;
    return (i1 < i2 ? CF.r1 + CF.r2 : CF.r2 + CF.r1) + (CF.suited ? 's' : 'o');
  }
  function showHand(x) { return x.c ? cardsTxt(x.c) : '<span class="disp" style="font-size:1.1em">' + x.h.replace('T', '10') + '</span>'; }
  function segBtns(k, opts, cur) { return '<div class="seg">' + opts.map(function (o) { return '<button class="' + (String(cur) === String(o[0]) ? 'on' : '') + '" data-hact="cf" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function actOptions() {
    if (CF.cx === 'unopened') return CF.pos === 'BB' ? [['check', 'Checker']] : [['fold', 'Fold'], ['limp', 'Limp'], ['raise', 'Ouvrir'], ['allin', 'Tapis']];
    if (CF.cx === 'limped') return [['fold', 'Fold'], ['call', CF.pos === 'BB' ? 'Checker' : 'Limper aussi'], ['raise', 'Relancer'], ['allin', 'Tapis']];
    return [['fold', 'Fold'], ['call', 'Payer'], ['raise', 'Sur-relancer (3-bet)'], ['allin', 'Tapis']];
  }
  function clubForm() {
    var h = clubHand(), pair = CF.r1 && CF.r1 === CF.r2;
    var ranks = function (k) { return '<div class="seg">' + RANKS.split('').map(function (r) { return '<button class="' + (CF[k] === r ? 'on' : '') + '" data-hact="cf" data-k="' + k + '" data-v="' + r + '" style="min-width:44px">' + (r === 'T' ? '10' : r) + '</button>'; }).join('') + '</div>'; };
    var openers = POS_ALL.slice(0, CF.pos ? POS_ALL.indexOf(CF.pos) : 9).filter(function (p) { return p !== 'BB'; });
    var mic = (window.SpeechRecognition || window.webkitSpeechRecognition) ? '<button class="btn" data-hact="mic" style="min-height:44px">' + (AV.listening ? 'J’écoute…' : '🎤 Dicter') + '</button>' : '';
    var ready = CF.pos && h && CF.a;
    return '<div class="card stack"><b>Nouvelle main du club</b>' +
      '<div class="small muted">Ta position</div>' + segBtns('pos', POS_ALL.map(function (p) { return [p, window.PA.POS_LABEL[p].replace('UTG+2 (MP)', 'MP')]; }), CF.pos) +
      '<div class="small muted">Ta main · 1<sup>re</sup> carte</div>' + ranks('r1') + '<div class="small muted">2<sup>e</sup> carte</div>' + ranks('r2') +
      (CF.r1 && CF.r2 && !pair ? segBtns('suited', [['true', 'Assorties'], ['false', 'Dépareillées']], CF.suited) : '') +
      (h ? '<div>Main : <b class="disp" style="font-size:1.3em">' + h.replace(/T/g, '10') + '</b></div>' : '') +
      '<div class="small muted">Ton tapis</div>' + segBtns('st', [[10, '10 BB'], [15, '15'], [20, '20'], [25, '25'], [30, '30'], [40, '40'], [60, '60'], [100, '100+']], CF.st) +
      '<div class="small muted">Avant toi</div>' + segBtns('cx', [['unopened', 'Personne n’est entré'], ['limped', 'Un ou des limps'], ['vsOpen', 'Quelqu’un a ouvert']], CF.cx) +
      (CF.cx === 'vsOpen' ? '<div class="small muted">Qui a ouvert ?</div>' + (openers.length ? segBtns('op', openers.map(function (p) { return [p, window.PA.POS_LABEL[p].replace('UTG+2 (MP)', 'MP')]; }), CF.op) : '<div class="small muted">Choisis d’abord ta position.</div>') : '') +
      '<div class="small muted">Ce que tu as fait</div>' + segBtns('a', actOptions(), CF.a) +
      '<div class="small muted">Résultat du coup</div>' + segBtns('res', [['pre', 'Fini avant le flop'], ['win', 'Gagné'], ['lose', 'Perdu']], CF.res) +
      (CF.res !== 'pre' ? '<label class="small muted">Combien (en BB, facultatif) <input id="cfAmt" inputmode="decimal" value="' + U().esc(CF.amt) + '" style="width:90px;min-height:40px;margin-left:6px;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:4px 8px"></label>' : '') +
      '<div class="small muted">Note (facultative)</div><div class="row"><textarea id="cfNote" rows="2" style="flex:1;background:var(--panel2);color:var(--ink);border:2px solid var(--line);border-radius:10px;padding:8px;font:inherit">' + U().esc(CF.note) + '</textarea>' + mic + '</div>' +
      '<button class="btn gold" data-hact="cfSave"' + (ready ? '' : ' disabled style="opacity:.5"') + '>Enregistrer la main</button>' +
      (CF.fb ? U().yo(CF.fb) : '') + '</div>';
  }
  function clubTab(db) {
    var club = db.hands.filter(function (x) { return x.src === 'club'; }).slice(-30).reverse();
    var list = club.length ? '<div class="card stack"><b>Tes mains du club</b>' + club.map(function (x) {
      return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:6px 0"><span>' + showHand(x) + ' · ' + window.PA.POS_LABEL[x.p] + ' · ' + x.st + ' BB · ' + actFr(x.a, x.cx === 'vsOpen' ? 'def' : 'open') + '<br><span class="small muted">' + x.d.slice(0, 10).split('-').reverse().join('/') + (x.note ? ' · ' + U().esc(x.note) : '') + '</span></span><span class="row" style="gap:6px"><button class="btn" data-hact="share" data-v="' + x.id + '" style="min-height:40px;padding:4px 10px">Image</button><button class="btn" data-hact="cfDel" data-v="' + x.id + '" style="min-height:40px;padding:4px 10px">Suppr.</button></span></div>';
    }).join('') + '</div>' : '';
    return U().yo('Note tes mains du club dès que possible, entre deux coups ou le soir même : position, main, ce qui s’est passé avant toi et ton choix. Je te dis tout de suite ce que dit ta range, et ces mains comptent dans tes statistiques.') + clubForm() + list;
  }
  function saveClub() {
    var nEl = document.getElementById('cfNote'), aEl = document.getElementById('cfAmt');
    if (nEl) CF.note = nEl.value; if (aEl) CF.amt = aEl.value;
    var h = clubHand(); if (!CF.pos || !h || !CF.a) return;
    var now = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var d = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    var a = CF.a === 'check' ? 'check' : CF.a, cx = CF.cx === 'vsOpen' && !CF.op ? 'limped' : CF.cx;
    var amt = num(CF.amt || 0), net = CF.res === 'win' ? amt : (CF.res === 'lose' ? -amt : 0);
    var x = { id: 'club-' + now.getTime(), src: 'club', d: d, t: 'Club du ' + d.slice(0, 10).split('-').reverse().join('/'), ti: 'club-' + d.slice(0, 10), bi: 0, ko: 0, lv: 0, bb: 1, n: 9,
      h: h, c: null, p: CF.pos, st: CF.st, cx: cx, a: a, op: cx === 'vsOpen' ? CF.op : null,
      v: (a === 'call' && !(CF.pos === 'BB' && cx === 'limped')) || a === 'limp' || a === 'raise' || a === 'allin' ? 1 : 0, r: a === 'raise' || a === 'allin' ? 1 : 0,
      b3: cx === 'vsOpen' && (a === 'raise' || a === 'allin') ? 1 : 0, f3: 0, f3a: null, sd: 0, sw: 0, sf: 0, net: net, note: CF.note || '' };
    var db = loadDB(); db.hands.push(x); db.hands.sort(function (p, q) { return p.d < q.d ? -1 : (p.d > q.d ? 1 : 0); }); saveDB(db);
    var c = compare(window.PA.player().profile || 'tag', { hand: h }, { pos: x.p, ctx: x.cx, act: x.a, openerPos: x.op, bbStack: x.st });
    var hs = h.replace(/T/g, '10');
    CF.fb = 'Main enregistrée. ' + (!c ? 'Pas de comparaison possible avec ta range sur ce coup-là (limps ou blindes).' : (c.verdict === 'ok' || c.verdict === 'other' ? 'Avec ' + hs + ' en ' + window.PA.POS_LABEL[x.p] + ', c’est ce que dit ta range. Bien joué.' : 'Avec ' + hs + ' en ' + window.PA.POS_LABEL[x.p] + ', ta range dit « ' + actFr(c.want, c.s.type) + ' » et tu as choisi « ' + actFr(c.mine, c.s.type) + ' ». ' + (c.verdict === 'tight' ? 'Tu as été trop prudent sur ce coup.' : 'Cette main est hors de ta range ici.')));
    AV.lastClub = c ? { sit: c.s, hand: h } : null;
    CF.pos = null; CF.r1 = null; CF.r2 = null; CF.suited = false; CF.cx = 'unopened'; CF.op = null; CF.a = null; CF.res = 'pre'; CF.amt = ''; CF.note = '';
  }
  function dictate() {
    var R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) return;
    var nEl = document.getElementById('cfNote'); if (nEl) CF.note = nEl.value;
    try {
      var rec = new R(); rec.lang = 'fr-FR'; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = function (e) { var t = e.results[0][0].transcript; CF.note = (CF.note ? CF.note + ' ' : '') + t; };
      rec.onend = function () { AV.listening = false; U().render(); };
      rec.onerror = function () { AV.listening = false; U().render(); };
      AV.listening = true; rec.start(); U().render();
    } catch (e) { AV.listening = false; }
  }
  document.addEventListener('change', function (e) { if (e.target && (e.target.id === 'hhDir' || e.target.id === 'hhFiles')) readFiles(e.target.files); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-hact]') : null; if (!t) return;
    var a = t.getAttribute('data-hact'), v = t.getAttribute('data-v');
    if (a === 'tab') { AV.tab = v; AV.armClear = false; }
    else if (a === 'per') AV.per = v;
    else if (a === 'open') AV.open = AV.open === v ? null : v;
    else if (a === 'addnote') { var ta = document.getElementById('hn_' + v), txt = ta && ta.value.trim(); if (txt) { var db = loadDB(), x = findHand(db, v); if (x) { x.notes = x.notes || []; x.notes.push({ by: window.PA.player().pseudo, at: Date.now(), t: txt }); saveDB(db); } } }
    else if (a === 'sendnotes') { sendHands(loadDB().hands.filter(function (x) { return x.log && x.notes && x.notes.length; })); return; }
    else if (a === 'sendrecus') { sendHands(loadDB().recus || []); return; }
    else if (a === 'pfopen') { var rr = AV.pf && AV.pf.R[+t.getAttribute('data-v')]; if (rr && window.PA_SOLVER) window.PA_SOLVER.openExplorer(rr); return; }
    else if (a === 'clear') { if (!AV.armClear) AV.armClear = true; else { window.PA_HH.clear(); AV.armClear = false; AV.msg = null; AV.tab = 'resume'; } }
    else if (a === 'cf') {
      var k = t.getAttribute('data-k'), nEl = document.getElementById('cfNote'), aEl = document.getElementById('cfAmt');
      if (nEl) CF.note = nEl.value; if (aEl) CF.amt = aEl.value;
      CF.fb = null;
      if (k === 'st') CF.st = +v; else if (k === 'suited') CF.suited = v === 'true'; else CF[k] = v;
      if (k === 'pos' || k === 'cx') { CF.a = null; if (CF.op && CF.pos && POS_ALL.indexOf(CF.op) >= POS_ALL.indexOf(CF.pos)) CF.op = null; }
    }
    else if (a === 'cfSave') saveClub();
    else if (a === 'syncNow') { SY.msg = null; autoSync(true); }
    else if (a === 'share') { shareHand(v); return; }
    else if (a === 'shareClose') { var bx = document.getElementById('paShare'); if (bx) bx.remove(); return; }
    else if (a === 'shareAndroid') { try { window.PAAndroid.shareImage(AV.shareUrl.split(',')[1], AV.shareName); } catch (er) {} return; }
    else if (a === 'shareNative') { AV.shareCanvas.toBlob(function (bl) { var f = new File([bl], AV.shareName, { type: 'image/png' }); try { if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: 'Une main de poker' }).catch(function () {}); } catch (er) {} }); return; }
    else if (a === 'opNew') { CA.tmpName = undefined; CA.tmpNote = undefined; CA.edit = 'new'; CA.prof = 'fan'; CA.armDel = false; }
    else if (a === 'opEdit') { CA.tmpName = undefined; CA.tmpNote = undefined; CA.edit = v; CA.prof = (opps().filter(function (o) { return o.id === v; })[0] || {}).prof; CA.armDel = false; }
    else if (a === 'opProf') { var ne = document.getElementById('opName'), no = document.getElementById('opNote'); CA.prof = v; if (ne) CA.tmpName = ne.value; if (no) CA.tmpNote = no.value; }
    else if (a === 'opCancel') { CA.edit = null; CA.prof = null; CA.tmpName = undefined; CA.tmpNote = undefined; }
    else if (a === 'opSave') opSave();
    else if (a === 'opDel') { if (!CA.armDel) CA.armDel = true; else { var p0 = window.PA.player(); p0.opps = opps().filter(function (o) { return o.id !== CA.edit; }); window.PA.save(); CA.edit = null; CA.armDel = false; } }
    else if (a === 'cfDel') { var db2 = loadDB(); db2.hands = db2.hands.filter(function (x) { return x.id !== v; }); saveDB(db2); }
    else if (a === 'mic') { dictate(); return; }
    else if (a === 'src') AV.src = v;
    else if (a === 'range') { var d = AV.S && AV.S.dev[+v]; if (d && window.PA_UI_openRange) window.PA_UI_openRange({ sit: d.c.s, hand: d.x.h }); return; }
    U().render();
  });

  document.addEventListener('change', function (e) { var t = e.target; if (t && t.getAttribute && t.getAttribute('data-hfile') === 'mains' && t.files && t.files[0]) { var r = new FileReader(); r.onload = function () { importHands(String(r.result)); U().render(); }; r.readAsText(t.files[0]); } });
  window.PA_HH = { flopInfo: flopInfo, parseFile: parseFile, parseHand: parseHand, preflopInfo: preflopInfo, compare: compare, importTexts: importTexts, loadDB: loadDB, saveDB: saveDB, stats: stats, leaks: leaks, pctOf: pctOf, positions: positions, handCode: handCode, ACT_FR: ACT_FR,
    view: view, opps: opps, OPP: OPP, leaksFor: function () { var db = loadDB(), p = window.PA.player(); return db.hands.length ? leaks(stats(db.hands, p.profile || 'tag')) : []; }, statsAll: function () { var db = loadDB(), p = window.PA.player(); return db.hands.length ? stats(db.hands, p.profile || 'tag') : null; }, clear: function () { try { localStorage.removeItem(key()); } catch (e) {} } };
})();
