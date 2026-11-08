/* Poker Academy — profil Perso construit à partir du test de profil.
   Base : le profil le plus proche. Puis, groupe de positions par groupe, on passe au profil plus large
   ou plus serré si tes réponses le montrent nettement. Enfin, tes choix réels du test (quand un profil
   les joue aussi) sont repris main par main. Les erreurs (aucun profil ne joue ainsi) ne sont pas copiées. */
(function () {
  'use strict';
  var PA = window.PA, LADDER = ['nit', 'tag', 'equilibre', 'lag'];
  var GROUP_POS = { early: ['UTG', 'UTG+1', 'MP'], mid: ['LJ', 'HJ'], late: ['CO', 'BTN', 'SB'], bb: ['BB'] };
  var GROUP_SCEN = { early: 'early', mid: 'oop', late: 'ip' }, GROUP_SCEN2 = { late: 'bvb' };
  function groupOf(s) { if (s.type === 'def' && s.pos === 'BB') return 'bb'; var i = PA.POS.indexOf(s.pos); return i <= 2 ? 'early' : (i <= 4 ? 'mid' : 'late'); }
  function build(answers, best) {
    var cnt = { early: [0, 0, 0], mid: [0, 0, 0], late: [0, 0, 0], bb: [0, 0, 0] }; // [plus large, plus serré, total]
    answers.forEach(function (a) {
      var s = a.q.sit; if (s.bubble || (s.type !== 'open' && s.type !== 'def' && s.type !== 'vs3bet')) return;
      var g = s.type === 'vs3bet' ? ({ early: 'early', oop: 'mid', ip: 'late', bvb: 'late' }[s.scen] || 'late') : groupOf(s);
      var ref = PA.actionFor(best, s, a.q.hand), play = a.given && a.given !== 'fold', refPlay = ref !== 'fold';
      cnt[g][2]++; if (play && !refPlay) cnt[g][0]++; if (!play && refPlay) cnt[g][1]++;
    });
    var bi = LADDER.indexOf(best), gp = {};
    Object.keys(cnt).forEach(function (g) {
      var c = cnt[g], d = c[0] - c[1], sh = 0;
      if (d >= 2 && c[0] >= Math.max(2, c[2] * 0.15)) sh = d >= 5 ? 2 : 1;
      else if (-d >= 2 && c[1] >= Math.max(2, c[2] * 0.15)) sh = -d >= 5 ? -2 : -1;
      gp[g] = LADDER[Math.max(0, Math.min(3, bi + sh))];
    });
    var perso = {}, changed = 0;
    function put(s, src) {
      var key = PA.sitKey(s), ref = PA.chart('tag', s), cm = PA.chart(src, s), ov = null;
      PA.HANDS.forEach(function (h) { if (cm[h] !== ref[h]) { ov = ov || {}; ov[h] = cm[h]; } });
      if (ov) perso[key] = ov;
    }
    Object.keys(GROUP_POS).forEach(function (g) {
      GROUP_POS[g].forEach(function (pos) {
        [100, 30].forEach(function (bb) {
          if (pos !== 'BB') put({ type: 'open', pos: pos, bb: bb }, gp[g]);
          var ops = PA.validOpeners(pos); if (pos !== 'BB') ops = ops.filter(function (o) { return o !== 'SB'; });
          ops.forEach(function (o) { put({ type: 'def', pos: pos, opener: o, bb: bb }, gp[g]); });
        });
      });
      if (GROUP_SCEN[g]) put({ type: 'vs3bet', scen: GROUP_SCEN[g], bb: 100 }, gp[g]);
      if (GROUP_SCEN2[g]) put({ type: 'vs3bet', scen: GROUP_SCEN2[g], bb: 100 }, gp[g]);
    });
    // tes vrais choix du test, s'ils sont jouables (un des profils les joue)
    answers.forEach(function (a) {
      var s = a.q.sit; if (!a.given || s.bubble || (s.type !== 'open' && s.type !== 'def' && s.type !== 'vs3bet')) return;
      var ok = PA.BASE_PROFILES.some(function (id) { return PA.actionFor(id, s, a.q.hand) === a.given; });
      if (!ok) return;
      var key = PA.sitKey(s), base = PA.chart('tag', s)[a.q.hand];
      var cur = perso[key] && perso[key][a.q.hand] !== undefined ? perso[key][a.q.hand] : base;
      if (cur !== a.given) { changed++; perso[key] = perso[key] || {}; if (a.given === base) delete perso[key][a.q.hand]; else perso[key][a.q.hand] = a.given; }
    });
    return { perso: perso, groups: gp, cnt: cnt, hands: changed, base: best };
  }
  var GNAME = { early: 'début de table (UTG à MP)', mid: 'milieu de table (LJ, HJ)', late: 'fin de table (CO, bouton, SB)', bb: 'défense de la grosse blinde' };
  function summary(r) {
    return Object.keys(GNAME).map(function (g) { var pr = PA.PROFILES[r.groups[g]]; return '<div>' + GNAME[g] + ' : <b>' + pr.name + '</b>' + (r.groups[g] !== r.base ? ' <span class="small muted">(' + (LADDER.indexOf(r.groups[g]) > LADDER.indexOf(r.base) ? 'plus large' : 'plus serré') + ' que ta base)</span>' : '') + '</div>'; }).join('') +
      (r.hands ? '<div class="small muted">Plus ' + r.hands + ' main' + (r.hands > 1 ? 's' : '') + ' reprise' + (r.hands > 1 ? 's' : '') + ' telle' + (r.hands > 1 ? 's' : '') + ' que tu les as jouées pendant le test.</div>' : '');
  }
  window.PA_PERSO = { build: build, summary: summary };
})();
