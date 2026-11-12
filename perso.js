/* Poker Academy — profil Perso construit à partir du test de profil.
   Base : la range du club. Puis, groupe de positions par groupe, on élargit ou on resserre d'un ou deux crans
   si tes réponses le montrent nettement. Enfin, tes choix réels du test (quand un profil
   les joue aussi) sont repris main par main. Les erreurs (aucun profil ne joue ainsi) ne sont pas copiées. */
(function () {
  'use strict';
  var PA = window.PA, LADDER = ['nit', 'tag', 'equilibre', 'lag'];
  var GROUP_POS = { early: ['UTG', 'UTG+1', 'MP'], mid: ['LJ', 'HJ'], late: ['CO', 'BTN', 'SB'], bb: ['BB'] };
  var GROUP_SCEN = { early: 'early', mid: 'oop', late: 'ip' }, GROUP_SCEN2 = { late: 'bvb' };
  function groupOf(s) { if (s.type === 'def' && s.pos === 'BB') return 'bb'; var i = PA.POS.indexOf(s.pos); return i <= 2 ? 'early' : (i <= 4 ? 'mid' : 'late'); }
  // Base : la range du club. Par groupe de positions, si tes réponses au test sont nettement plus larges ou plus serrées
  // que cette base, on élargit ou on resserre d'un ou deux crans (le même cran que d'une place à la suivante).
  function build(answers, best) {
    var cnt = { early: [0, 0, 0], mid: [0, 0, 0], late: [0, 0, 0], bb: [0, 0, 0] }; // [plus large, plus serré, total]
    answers.forEach(function (a) {
      var s = a.q.sit; if (s.bubble || (s.type !== 'open' && s.type !== 'def' && s.type !== 'vs3bet')) return;
      var g = s.type === 'vs3bet' ? ({ early: 'early', oop: 'mid', ip: 'late', bvb: 'late' }[s.scen] || 'late') : groupOf(s);
      var ref = PA.actionFor('club', s, a.q.hand), play = a.given && a.given !== 'fold', refPlay = ref !== 'fold';
      cnt[g][2]++; if (play && !refPlay) cnt[g][0]++; if (!play && refPlay) cnt[g][1]++;
    });
    var gp = {}, shift = {};
    Object.keys(cnt).forEach(function (g) {
      var c = cnt[g], d = c[0] - c[1], sh = 0;
      if (d >= 2 && c[0] >= Math.max(2, c[2] * 0.15)) sh = d >= 5 ? 2 : 1;
      else if (-d >= 2 && c[1] >= Math.max(2, c[2] * 0.15)) sh = -d >= 5 ? -2 : -1;
      shift[g] = sh; gp[g] = LADDER[Math.max(0, Math.min(3, 1 + sh))];
    });
    var perso = {}, changed = 0;
    function put(s, cm) {
      var key = PA.sitKey(s), ref = PA.chart('club', s), ov = null;
      PA.HANDS.forEach(function (h) { if (cm[h] !== ref[h]) { ov = ov || {}; ov[h] = cm[h]; } });
      if (ov) perso[key] = ov;
    }
    Object.keys(GROUP_POS).forEach(function (g) {
      var sh = shift[g]; if (!sh) return;
      GROUP_POS[g].forEach(function (pos) {
        if (pos !== 'BB') {
          // ouverture à 40 BB et plus : la range du club, décalée de sh crans
          var cm = {}, st = Math.max(0, Math.min(6, PA.CLUB_STEP[pos] + sh)); PA.HANDS.forEach(function (h) { cm[h] = 'fold'; }); PA.clubOpen(st).forEach(function (h) { cm[h] = 'raise'; });
          put({ type: 'open', pos: pos, bb: 100 }, cm);
          var cm2 = {}, st2 = Math.max(-1, Math.min(6, PA.CLUB_MID_STEP[pos] + sh)); PA.HANDS.forEach(function (h) { cm2[h] = 'fold'; }); PA.clubOpen(st2).forEach(function (h) { cm2[h] = 'raise'; });
          put({ type: 'open', pos: pos, bb: 30 }, cm2);
        }
        var ops = PA.validOpeners(pos); if (pos !== 'BB') ops = ops.filter(function (o) { return o !== 'SB'; });
        [100, 30].forEach(function (bb) { ops.forEach(function (o) { var sd = { type: 'def', pos: pos, opener: o, bb: bb }; put(sd, PA.chart(gp[g], sd)); }); });
      });
    });
    // tes vrais choix du test, s'ils sont jouables (la range du club ou un des profils les joue)
    answers.forEach(function (a) {
      var s = a.q.sit; if (!a.given || s.bubble || (s.type !== 'open' && s.type !== 'def' && s.type !== 'vs3bet')) return;
      var ok = PA.actionFor('club', s, a.q.hand) === a.given || PA.BASE_PROFILES.some(function (id) { return PA.actionFor(id, s, a.q.hand) === a.given; });
      if (!ok) return;
      var key = PA.sitKey(s), base = PA.chart('club', s)[a.q.hand];
      var cur = perso[key] && perso[key][a.q.hand] !== undefined ? perso[key][a.q.hand] : base;
      if (cur !== a.given) { changed++; perso[key] = perso[key] || {}; if (a.given === base) delete perso[key][a.q.hand]; else perso[key][a.q.hand] = a.given; }
    });
    return { perso: perso, groups: gp, shift: shift, cnt: cnt, hands: changed, base: best };
  }
  var GNAME = { early: 'début de table (UTG à MP)', mid: 'milieu de table (LJ, HJ)', late: 'fin de table (CO, bouton, SB)', bb: 'défense de la grosse blinde' };
  function summary(r) {
    var sh = r.shift || {};
    return '<div class="small muted">Base : la range du club (6-max : la 1re place à parler, puis un cran plus large jusqu’au bouton ; petite blinde comme le bouton).</div>' + Object.keys(GNAME).map(function (g) { var n = sh[g] || 0, c = Math.abs(n) + ' cran' + (Math.abs(n) > 1 ? 's' : ''); return '<div>' + GNAME[g] + ' : <b>' + (n > 0 ? 'élargie de ' + c : n < 0 ? 'resserrée de ' + c : 'range du club') + '</b></div>'; }).join('') +
      (r.hands ? '<div class="small muted">Plus ' + r.hands + ' main' + (r.hands > 1 ? 's' : '') + ' reprise' + (r.hands > 1 ? 's' : '') + ' telle' + (r.hands > 1 ? 's' : '') + ' que tu les as jouées pendant le test.</div>' : '');
  }
  window.PA_PERSO = { build: build, summary: summary };
})();
