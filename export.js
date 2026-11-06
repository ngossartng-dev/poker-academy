/* Poker Academy — export du championnat : classeur Excel (.xlsx) et PDF illustré, fabriqués dans l’appli, sans connexion */
(function () {
  'use strict';
  function L() { return window.PA_LEAGUE; }
  function f1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function dfr(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function dm(iso) { var p = iso.split('-'); return p[2] + '/' + p[1]; }
  function hm(t) { return t ? new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function r1(x) { return Math.round(x * 10) / 10; }

  /* ---------- Les données, une fois pour les deux formats ---------- */
  function yearData(year) {
    var lg = L(), list = lg.load().list.filter(function (x) { return x.date.slice(0, 4) === year; });
    var champ = list.filter(function (x) { return x.type !== 'libre'; });
    var st = lg.standings(list), seen = {}, prim = 0;
    champ.forEach(function (tn) { tn.rows.forEach(function (r) { seen[r.name.toLowerCase()] = 1; prim += r.bonus || 0; }); });
    var ws = {}; list.forEach(function (x) { (ws[lg.week(x.date)] = ws[lg.week(x.date)] || []).push(x); });
    var weeks = [], cum = [];
    Object.keys(ws).sort().forEach(function (w) {
      cum = cum.concat(ws[w]);
      var gen = lg.standings(cum), rk = {}, pts = {};
      gen.forEach(function (o, i) { rk[o.name.toLowerCase()] = { r: i + 1, t: o.total }; });
      var stw = lg.standings(ws[w]); stw.forEach(function (o) { pts[o.name.toLowerCase()] = o.total; });
      var first = ws[w].map(function (x) { return x.date; }).sort()[0];
      weeks.push({ w: w, short: 'S' + w.slice(6), from: first, label: lg.weekLabel(w), deep: ws[w].some(function (x) { return x.type === 'deep'; }),
        games: ws[w].map(function (x) { return lg.TYPES[x.type].short + ' du ' + dfr(x.date) + ' : ' + (x.winner || '—'); }).join(' · '),
        pts: pts, rk: rk, rows: stw.map(function (o, i) { var g = rk[o.name.toLowerCase()] || {}; return { rank: i + 1, name: o.name, pts: o.total, cum: g.t, gen: g.r }; }) });
    });
    var nT = list.length;
    return { year: year, list: list, nT: nT, nChamp: champ.length, nMer: list.filter(function (x) { return x.type === 'mercredi'; }).length, nDeep: list.filter(function (x) { return x.type === 'deep'; }).length,
      nLib: list.filter(function (x) { return x.type === 'libre'; }).length, nPlayers: Object.keys(seen).length, avgPlayers: nT ? r1(list.reduce(function (a, x) { return a + x.n; }, 0) / nT) : 0,
      primes: r1(prim), st: st, weeks: weeks };
  }
  function tnTitle(tn) { return L().TYPES[tn.type].name + ' du ' + dfr(tn.date); }
  function tnSub(tn) { return tn.n + ' joueurs' + (tn.re ? ' · ' + tn.re + ' re-entry' : '') + (tn.add ? ' · ' + tn.add + ' add-on' : '') + (tn.type === 'deep' ? ' · points ×1,4' : tn.type === 'libre' ? ' · hors championnat' : '') + (tn.holder ? ' · tête mise à prix : ' + tn.holder : ''); }
  function tnBounty(tn) { var r = tn.rows.filter(function (x) { return x.bonus; })[0]; return r ? r.name : ''; }
  function tnLength(tn) { var t = tn.rows.map(function (r) { return r.koAt; }).filter(Boolean); if (t.length < 2) return ''; var m = Math.round((Math.max.apply(null, t) - Math.min.apply(null, t)) / 60000); return Math.floor(m / 60) + ' h ' + ('0' + m % 60).slice(-2); }
  /* ---------- Excel ---------- */
  var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  // archive zip sans compression (suffisant pour un classeur de quelques Ko)
  function zip(files) {
    var parts = [], central = [], off = 0, d = new Date();
    var dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    function hdr(n) { return new DataView(new ArrayBuffer(n)); }
    files.forEach(function (f) {
      var name = utf8(f.name), data = typeof f.data === 'string' ? utf8(f.data) : f.data, crc = crc32(data);
      var h = hdr(30); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = hdr(46); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    var csize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var e = hdr(22); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    var all = parts.concat(central, [new Uint8Array(e.buffer)]), len = all.reduce(function (a, b) { return a + b.length; }, 0), out = new Uint8Array(len), p = 0;
    all.forEach(function (b) { out.set(b, p); p += b.length; });
    return out;
  }
  function xe(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function col(i) { var s = ''; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; } return s; }
  // styles : 1 en-tête or sur noir · 2 titre · 3 sous-titre · 4 podium · 5 podium centré · 6 centré · 7 bandeau · 8 texte · 9 bandeau deep
  // 10 moyenne 0,0 · 11 étiquette de chiffre clé · 12 chiffre clé · 13 podium moyenne 0,0 · 14 total en gras · 15 prime en rouge
  function xf(a) { return '<xf xfId="0" numFmtId="' + (a.n || 0) + '" fontId="' + (a.f || 0) + '" fillId="' + (a.l || 0) + '" borderId="' + (a.b || 0) + '"' + (a.n ? ' applyNumberFormat="1"' : '') + (a.f ? ' applyFont="1"' : '') + (a.l ? ' applyFill="1"' : '') + (a.b ? ' applyBorder="1"' : '') + (a.al ? ' applyAlignment="1"><alignment horizontal="' + a.al + '" vertical="center"' + (a.w ? ' wrapText="1"' : '') + '/></xf>' : '/>'); }
  var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="0.0"/></numFmts>' +
    '<fonts count="7"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF8A6A12"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFE3C26A"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font><font><b/><sz val="18"/><color rgb="FF8A6A12"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFC0262D"/><name val="Calibri"/></font></fonts>' +
    '<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF141414"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7ECC9"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFD0D0D0"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="17">' +
    [{}, { f: 3, l: 2, al: 'center', w: 1 }, { f: 2 }, { f: 4 }, { f: 1, l: 3, b: 1 }, { f: 1, l: 3, b: 1, al: 'center' }, { b: 1, al: 'center' }, { f: 1, l: 4 }, { b: 1 }, { f: 3, l: 2 },
      { n: 164, b: 1, al: 'center' }, { f: 4, l: 3, al: 'center', w: 1 }, { f: 5, l: 3, al: 'center' }, { n: 164, f: 1, l: 3, b: 1, al: 'center' }, { f: 1, b: 1, al: 'center' }, { f: 6, b: 1, al: 'center' }, { f: 4, al: 'left', w: 1 }].map(xf).join('') +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  // barres de données et dégradés (mise en forme conditionnelle d’Excel)
  var prio = 0;
  function bar(ref, rgb) { return '<conditionalFormatting sqref="' + ref + '"><cfRule type="dataBar" priority="' + (++prio) + '"><dataBar><cfvo type="num" val="0"/><cfvo type="max"/><color rgb="' + rgb + '"/></dataBar></cfRule></conditionalFormatting>'; }
  function heat(ref) { return '<conditionalFormatting sqref="' + ref + '"><cfRule type="colorScale" priority="' + (++prio) + '"><colorScale><cfvo type="num" val="0"/><cfvo type="max"/><color rgb="FFFFFFFF"/><color rgb="FFD4A72C"/></colorScale></cfRule></conditionalFormatting>'; }
  // feuille : { name, widths, rows: [[cellule…]], freeze } ; cellule = valeur ou { v, s }
  function sheetXml(sh) {
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>';
    if (sh.freeze) x += '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + sh.freeze + '" topLeftCell="A' + (sh.freeze + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
    x += '<cols>' + sh.widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols><sheetData>';
    sh.rows.forEach(function (r, ri) {
      x += '<row r="' + (ri + 1) + '"' + (r.h ? ' ht="' + r.h + '" customHeight="1"' : '') + '>';
      r.forEach(function (c, ci) {
        if (c === null || c === undefined || c === '') return;
        var v = typeof c === 'object' ? c.v : c, s = typeof c === 'object' && c.s ? ' s="' + c.s + '"' : '', ref = col(ci) + (ri + 1);
        if (v === null || v === undefined || v === '') { if (s) x += '<c r="' + ref + '"' + s + '/>'; return; }
        x += typeof v === 'number' ? '<c r="' + ref + '"' + s + '><v>' + v + '</v></c>' : '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + xe(v) + '</t></is></c>';
      });
      x += '</row>';
    });
    x += '</sheetData>';
    if (sh.merge && sh.merge.length) x += '<mergeCells count="' + sh.merge.length + '">' + sh.merge.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('') + '</mergeCells>';
    if (sh.cf) x += sh.cf.join('');
    return x + '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="' + (sh.land ? 'landscape' : 'portrait') + '" fitToWidth="1" fitToHeight="0"/></worksheet>';
  }
  function xlsx(sheets) {
    var ns = sheets.map(function (s, i) { return { name: s.name.replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31), i: i + 1 }; });
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + ns.map(function (s) { return '<Override PartName="/xl/worksheets/sheet' + s.i + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + ns.map(function (s) { return '<sheet name="' + xe(s.name) + '" sheetId="' + s.i + '" r:id="rId' + s.i + '"/>'; }).join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ns.map(function (s) { return '<Relationship Id="rId' + s.i + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + s.i + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (ns.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: STYLES }
    ];
    sheets.forEach(function (s, i) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s) }); });
    return zip(files);
  }
  function H(a) { return a.map(function (t) { return { v: t, s: 1 }; }); }
  function band(cells, s) { return cells.map(function (v) { return { v: v, s: s }; }); }
  function tnRowsXl(tn) {
    return tn.rows.map(function (r) {
      var p = r.place <= 3, s = p ? 4 : 8, sc = p ? 5 : 6;
      return [{ v: p ? ['1er', '2e', '3e'][r.place - 1] : r.place, s: sc }, { v: r.name, s: s }, { v: r.entries || 1, s: sc }, { v: r.pts, s: sc }, { v: r.bonus ? r.bonus : '', s: r.bonus ? 15 : sc }, { v: r.total, s: p ? 5 : 14 }, { v: r.koBy || (r.place === 1 ? 'vainqueur' : ''), s: s }, { v: hm(r.koAt), s: sc }, { v: r.koLevel || '', s: sc }];
    });
  }
  var TN_HEAD = ['Place', 'Joueur', 'Entrées', 'Points de place', 'Prime', 'Total', 'Éliminé par', 'Heure', 'Niveau'], TN_W = [8, 22, 9, 10, 8, 9, 22, 9, 12];
  function kpiRows(pairs) { var a = [], b = []; pairs.forEach(function (p) { a.push({ v: p[0], s: 11 }); b.push({ v: p[1], s: 12 }); }); a.h = 30; b.h = 34; return [a, b]; }
  function yearXlsx(year) {
    var D = yearData(year), now = new Date().toLocaleDateString('fr-FR'); prio = 0;
    // 1. classement : chiffres clés, puis le tableau avec barres
    var head = H(['Rang', 'Joueur', 'Total', 'Mercredi', 'Deep ×1,4', 'Primes', 'Tournois', 'Moyenne / tournoi', 'Victoires', 'Meilleure place', 'Éliminations']); head.h = 32;
    var r1s = [[{ v: 'Championnat du club · ' + year, s: 2 }], [{ v: 'Édité le ' + now + ' · Poker Academy · le deep rapporte ×1,4 et compte dans le même classement que les mercredis', s: 3 }], []]
      .concat(kpiRows([['Tournois', D.nT], ['Mercredis', D.nMer], ['Deeps (×1,4)', D.nDeep], ['Joueurs classés', D.nPlayers], ['Moyenne de joueurs par tournoi', D.avgPlayers], ['Points de prime', D.primes]]), [[], head]);
    var top = r1s.length;
    D.st.forEach(function (o, i) {
      var p = i < 3, s = p ? 4 : 8, sc = p ? 5 : 6;
      r1s.push([{ v: p ? ['1er', '2e', '3e'][i] : i + 1, s: sc }, { v: o.name, s: s }, { v: o.total, s: p ? 5 : 14 }, { v: o.mer || '', s: sc }, { v: o.deep || '', s: sc }, { v: o.bonus || '', s: o.bonus ? 15 : sc }, { v: o.n, s: sc }, { v: o.moy, s: p ? 13 : 10 }, { v: o.wins || '', s: sc }, { v: o.best < 99 ? o.best : '', s: sc }, { v: o.kos || '', s: sc }]);
    });
    var last = r1s.length;
    r1s.push([], [{ v: 'Barème : le 1er marque autant de points qu’il y a de joueurs, le dernier 1 point. Deep du vendredi ×1,4. Prime de ' + L().BONUS + ' points pour qui élimine le vainqueur du tournoi précédent du même type. Moyenne = total ÷ tournois joués. Les 3 premiers sont récompensés.', s: 16 }]);
    var s1 = { name: 'Classement ' + year, widths: [8, 22, 11, 11, 11, 9, 10, 12, 10, 11, 12], freeze: top, rows: r1s, merge: ['A' + (last + 2) + ':K' + (last + 2)],
      cf: D.st.length ? [bar('C' + (top + 1) + ':C' + last, 'FFD4A72C'), heat('H' + (top + 1) + ':H' + last)] : [] };
    r1s[last + 1].h = 32;
    // 2. semaine par semaine : une colonne par semaine, couleur selon les points
    var W = D.weeks, h2 = H(['Rang', 'Joueur'].concat(W.map(function (w) { return w.short + '\n' + dm(w.from) + (w.deep ? ' · deep' : ''); }), ['Total'])); h2.h = 34;
    var r2 = [[{ v: 'Semaine par semaine · ' + year, s: 2 }], [{ v: 'Points marqués chaque semaine (plus la case est dorée, plus il y a de points). Total = classement général.', s: 3 }], [], h2];
    D.st.forEach(function (o, i) {
      var k = o.name.toLowerCase(), p = i < 3;
      r2.push([{ v: p ? ['1er', '2e', '3e'][i] : i + 1, s: p ? 5 : 6 }, { v: o.name, s: p ? 4 : 8 }].concat(W.map(function (w) { var v = w.pts[k]; return { v: v === undefined ? '' : v, s: 6 }; }), [{ v: o.total, s: 14 }]));
    });
    var r2end = r2.length, lastCol = col(W.length + 1);
    r2.push([], [{ v: 'Vainqueurs', s: 7 }]); W.forEach(function (w) { r2.push([{ v: w.short, s: 8 }, { v: w.games, s: 8 }]); });
    var s2 = { name: 'Semaine par semaine', widths: [7, 22].concat(W.map(function () { return 9; }), [10]), freeze: 4, rows: r2, cf: W.length && D.st.length ? [heat('C5:' + lastCol + r2end), bar(col(W.length + 2) + '5:' + col(W.length + 2) + r2end, 'FFD4A72C')] : [] };
    // 3. les tournois en un coup d’œil
    var h3 = H(['Date', 'Tournoi', 'Joueurs', 'Re-entry', 'Add-on', 'Vainqueur', 'Tête mise à prix', 'Prime gagnée par', 'Durée']); h3.h = 30;
    var r3 = [[{ v: 'Les tournois · ' + year, s: 2 }], [{ v: D.nT + ' tournois · moyenne de ' + f1(D.avgPlayers) + ' joueurs par tournoi', s: 3 }], [], h3];
    D.list.slice().reverse().forEach(function (tn) {
      var dp = tn.type === 'deep';
      r3.push([{ v: dfr(tn.date), s: 6 }, { v: L().TYPES[tn.type].name + (dp ? ' ×1,4' : ''), s: dp ? 9 : 8 }, { v: tn.n, s: 6 }, { v: tn.re || '', s: 6 }, { v: tn.add || '', s: 6 }, { v: tn.winner || '', s: 4 }, { v: tn.holder || '', s: 8 }, { v: tnBounty(tn), s: tnBounty(tn) ? 15 : 8 }, { v: tnLength(tn), s: 6 }]);
    });
    var s3 = { name: 'Tournois', widths: [11, 24, 9, 9, 9, 18, 18, 18, 9], freeze: 4, rows: r3, cf: D.list.length ? [bar('C5:C' + r3.length, 'FFD4A72C')] : [] };
    // 4. le détail de chaque tournoi
    var r4 = [[{ v: 'Résultats détaillés · ' + year, s: 2 }], [{ v: 'Qui a sorti qui, à quelle heure, à quel niveau.', s: 3 }], []];
    D.list.slice().reverse().forEach(function (tn) {
      r4.push(band([tnTitle(tn) + ' · vainqueur : ' + (tn.winner || '—'), '', '', tnSub(tn), '', '', '', '', ''], tn.type === 'deep' ? 9 : 7));
      var hh = H(TN_HEAD); hh.h = 30; r4.push(hh);
      r4 = r4.concat(tnRowsXl(tn)); r4.push([]);
    });
    var s4 = { name: 'Résultats détaillés', widths: TN_W, rows: r4, land: true };
    return xlsx([s1, s2, s3, s4]);
  }
  function tnXlsx(tn) {
    prio = 0;
    var hh = H(TN_HEAD); hh.h = 30;
    var r = [[{ v: tnTitle(tn), s: 2 }], [{ v: tnSub(tn), s: 3 }], []].concat(kpiRows([['Joueurs', tn.n], ['Re-entry', tn.re || 0], ['Add-on', tn.add || 0], ['Vainqueur', tn.winner || '—'], ['Durée', tnLength(tn) || '—']]), [[], hh], tnRowsXl(tn));
    return xlsx([{ name: 'Résultats', widths: TN_W, freeze: 7, rows: r, cf: [bar('F8:F' + r.length, 'FFD4A72C')] }]);
  }
  var WR = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  var WB = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
  var WIN = { 8364: 128, 8230: 133, 8216: 145, 8217: 146, 8220: 147, 8221: 148, 8226: 149, 8211: 150, 8212: 151, 338: 140, 339: 156, 8240: 137 };
  function win(s) { var o = ''; s = String(s); for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); o += String.fromCharCode(c < 128 || (c >= 160 && c < 256) ? c : WIN[c] || 63); } return o; }
  function tw(s, size, bold) {
    var t = String(s).normalize('NFD').replace(/[̀-ͯ]/g, ''), W = bold ? WB : WR, w = 0;
    for (var i = 0; i < t.length; i++) { var c = t.charCodeAt(i); w += c >= 32 && c <= 126 ? W[c - 32] : 556; }
    return w * size / 1000;
  }
  function fit(s, w, size, bold) { s = String(s); if (tw(s, size, bold) <= w) return s; while (s.length > 1 && tw(s + '…', size, bold) > w) s = s.slice(0, -1); return s + '…'; }
  function pdesc(s) { return win(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  /* ---------- PDF illustré (A4, polices Helvetica intégrées aux lecteurs) ---------- */
  var PW = 595.28, PH = 841.89, M = 36, CW = PW - 2 * M;
  var GOLD = '0.80 0.63 0.20', DEEPC = '0.36 0.25 0.07', RED = '0.76 0.15 0.17', INK = '0.10 0.10 0.10', GREY = '0.45 0.45 0.45', DARK = '0.07 0.07 0.07',
    PALE = '0.98 0.95 0.84', ZEB = '0.965 0.965 0.965', TRACK = '0.93 0.93 0.93', WHITE = '1 1 1', SILVER = '0.66 0.67 0.70', BRONZE = '0.70 0.44 0.20';
  var MEDAL = [GOLD, SILVER, BRONZE], LINES = [GOLD, RED, DARK, '0.18 0.42 0.72', '0.20 0.56 0.32'];
  function mix(t) { // blanc → or selon t (0..1)
    var a = [1, 1, 1], b = [0.83, 0.63, 0.16]; return a.map(function (v, i) { return (v + (b[i] - v) * t).toFixed(3); }).join(' ');
  }
  function Doc(title) {
    var pages = [], cur = null, d = {}; d.y = 0;
    function n2(v) { return (+v).toFixed(2); }
    function page() { cur = []; pages.push(cur); d.band(); }
    d.rect = function (x, y, w, h, rgb) { if (w <= 0 || h <= 0) return; cur.push(rgb + ' rg ' + n2(x) + ' ' + n2(y) + ' ' + n2(w) + ' ' + n2(h) + ' re f'); };
    d.circle = function (cx, cy, r, rgb) { var k = 0.5523 * r; cur.push(rgb + ' rg ' + n2(cx + r) + ' ' + n2(cy) + ' m ' + [[cx + r, cy + k, cx + k, cy + r, cx, cy + r], [cx - k, cy + r, cx - r, cy + k, cx - r, cy], [cx - r, cy - k, cx - k, cy - r, cx, cy - r], [cx + k, cy - r, cx + r, cy - k, cx + r, cy]].map(function (c) { return c.map(n2).join(' ') + ' c'; }).join(' ') + ' f'); };
    d.line = function (pts, rgb, w, dash) { cur.push((dash ? '[2 2] 0 d ' : '') + rgb + ' RG ' + w + ' w 1 J 1 j ' + pts.map(function (p, i) { return n2(p[0]) + ' ' + n2(p[1]) + (i ? ' l' : ' m'); }).join(' ') + ' S' + (dash ? ' [] 0 d' : '')); };
    d.text = function (x, y, s, size, bold, rgb, align, w) {
      var t = w ? fit(s, w, size, bold) : String(s), xx = x;
      if (align === 'c') xx = x + (w - tw(t, size, bold)) / 2; else if (align === 'r') xx = x + w - tw(t, size, bold);
      cur.push('BT ' + (rgb || INK) + ' rg /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + n2(xx) + ' ' + n2(y) + ' Td (' + pdesc(t) + ') Tj ET');
    };
    d.band = function () { d.rect(0, PH - 30, PW, 30, DARK); d.rect(0, PH - 32.5, PW, 2.5, GOLD); d.text(M, PH - 19.5, 'POKER ACADEMY', 10, true, GOLD); d.text(M + 120, PH - 19.5, title, 9.5, false, '0.85 0.85 0.85', 'r', CW - 120); d.y = PH - 54; };
    d.newPage = page;
    d.need = function (h) { if (!cur || d.y - h < M + 22) page(); };
    d.h1 = function (s, sub, right) {
      d.need(70); d.text(M, d.y - 22, s, 24, true, INK, null, CW - 90); if (right) d.text(M, d.y - 22, right, 24, true, GOLD, 'r', CW); d.y -= 30;
      if (sub) { d.text(M, d.y - 11, sub, 9.5, false, GREY, null, CW); d.y -= 17; } d.rect(M, d.y - 2, 54, 3, GOLD); d.y -= 16;
    };
    d.h2 = function (s, sub) { d.need(46); d.text(M, d.y - 13, s, 14, true, INK, null, CW); d.y -= 18; if (sub) { d.text(M, d.y - 10, sub, 8.5, false, GREY, null, CW); d.y -= 14; } d.y -= 6; };
    d.note = function (s, size) { size = size || 8.5; var line = ''; String(s).split(' ').forEach(function (w) { if (tw(line + ' ' + w, size) > CW) { d.need(12); d.text(M, d.y - 9, line.trim(), size, false, GREY); d.y -= 12; line = ''; } line += ' ' + w; }); if (line.trim()) { d.need(12); d.text(M, d.y - 9, line.trim(), size, false, GREY); d.y -= 12; } };
    // tuiles de chiffres clés : [[étiquette, valeur, précision]]
    d.kpis = function (list) {
      d.need(70); var g = 10, w = (CW - g * (list.length - 1)) / list.length, h = 62, y0 = d.y - h;
      list.forEach(function (k, i) {
        var x = M + i * (w + g); d.rect(x, y0, w, h, PALE); d.rect(x, y0 + h - 3, w, 3, k[3] || GOLD);
        d.text(x + 8, y0 + h - 15, String(k[0]).toUpperCase(), 7, true, GREY, null, w - 16);
        d.text(x + 8, y0 + 22, String(k[1]), String(k[1]).length > 9 ? 13 : 20, true, k[3] === RED ? RED : INK, null, w - 16);
        if (k[2]) d.text(x + 8, y0 + 8, k[2], 7, false, GREY, null, w - 16);
      });
      d.y = y0 - 16;
    };
    // podium : 2e, 1er, 3e
    d.podium = function (st, sub) {
      if (!st.length) return; d.need(130);
      var w = 130, g = 14, x0 = M + (CW - 3 * w - 2 * g) / 2, base = d.y - 124, H = [50, 36, 26];
      [1, 0, 2].forEach(function (k, j) {
        var o = st[k]; if (!o) return; var x = x0 + j * (w + g), h = H[k];
        d.rect(x, base, w, h, k === 0 ? DARK : '0.20 0.20 0.20'); d.rect(x, base + h - 3, w, 3, MEDAL[k]);
        d.text(x, base + h / 2 - 7, String(k + 1), k === 0 ? 22 : 17, true, MEDAL[k], 'c', w);
        var cy = base + h + 20; d.circle(x + w / 2, cy, 16, MEDAL[k]); d.circle(x + w / 2, cy, 12.5, WHITE); d.circle(x + w / 2, cy, 11, MEDAL[k]);
        d.text(x + w / 2 - 11, cy - 4.5, ['1er', '2e', '3e'][k], 9.5, true, k === 0 ? DARK : WHITE, 'c', 22);
        d.text(x, cy + 37, o.name, 12.5, true, INK, 'c', w);
        d.text(x, cy + 22, f1(o.total) + ' pts' + (sub ? '' : ''), 10, true, '0.55 0.42 0.08', 'c', w);
      });
      d.y = base - 14;
    };
    d.legend = function (items) { var x = M; d.need(16); items.forEach(function (it) { d.rect(x, d.y - 9, 9, 9, it[1]); d.text(x + 13, d.y - 8, it[0], 8, false, INK); x += 22 + tw(it[0], 8); }); d.y -= 18; };
    // classement en barres : mercredi (or), deep (bronze), primes (rouge)
    d.bars = function (st) {
      var nameW = 128, bx = M + 26 + nameW, bw = CW - 26 - nameW - 92, max = Math.max.apply(null, st.map(function (o) { return o.total; }).concat([1]));
      function head() { d.text(bx, d.y - 8, 'POINTS', 7, true, GREY); d.text(bx + bw + 4, d.y - 8, 'TOTAL', 7, true, GREY, 'r', 44); d.text(bx + bw + 50, d.y - 8, 'MOYENNE', 7, true, GREY, 'r', 42); d.y -= 14; }
      d.need(60); head();
      st.forEach(function (o, i) {
        if (d.y - 23 < M + 22) { page(); head(); }
        var yc = d.y - 11.5, p = i < 3;
        if (p) d.rect(M, d.y - 23, CW, 23, PALE); else if (i % 2) d.rect(M, d.y - 23, CW, 23, ZEB);
        d.circle(M + 11, yc, 9, p ? MEDAL[i] : '0.86 0.86 0.86'); d.text(M + 2, yc - 3.2, String(i + 1), 8.5, true, p && i !== 0 ? WHITE : INK, 'c', 18);
        d.text(M + 26, yc + 1, o.name, 10.5, true, INK, null, nameW - 4);
        d.text(M + 26, yc - 9, o.n + ' tournoi' + (o.n > 1 ? 's' : '') + (o.wins ? ' · ' + o.wins + ' victoire' + (o.wins > 1 ? 's' : '') : '') + (o.kos ? ' · ' + o.kos + ' élim.' : ''), 7, false, GREY, null, nameW - 4);
        d.rect(bx, yc - 5, bw, 10, TRACK);
        var x = bx, sc = bw / max;
        [[o.mer, GOLD], [o.deep, DEEPC], [o.bonus, RED]].forEach(function (s) { if (s[0] > 0) { d.rect(x, yc - 5, s[0] * sc, 10, s[1]); x += s[0] * sc; } });
        d.text(bx + bw + 4, yc - 4, f1(o.total), 11.5, true, INK, 'r', 44);
        d.text(bx + bw + 50, yc - 3.5, f1(o.moy), 9.5, false, INK, 'r', 42);
        d.y -= 23;
      });
      d.y -= 8;
    };
    // la course au titre : points cumulés des 5 premiers, semaine après semaine
    d.race = function (D) {
      var top = D.st.slice(0, 5), W = D.weeks; if (!top.length || W.length < 2) return;
      d.need(200); var lw = 120, x0 = M + 30, x1 = M + CW - lw - 10, y0 = d.y - 165, y1 = d.y - 8;
      var max = Math.max.apply(null, top.map(function (o) { return o.total; })), step = max > 120 ? 40 : max > 60 ? 20 : 10, top2 = Math.ceil(max / step) * step || step;
      for (var v = 0; v <= top2; v += step) { var yy = y0 + v / top2 * (y1 - y0); d.line([[x0, yy], [x1, yy]], v ? '0.85 0.85 0.85' : '0.5 0.5 0.5', v ? 0.5 : 0.8, !!v); d.text(M, yy - 3, String(v), 7, false, GREY, 'r', 24); }
      var X = function (i) { return x0 + (W.length === 1 ? 0 : i / (W.length - 1) * (x1 - x0)); };
      var lab = Math.ceil(W.length / 12);
      W.forEach(function (w, i) { if (i % lab === 0 || i === W.length - 1) d.text(X(i) - 20, y0 - 12, w.short, 7, false, GREY, 'c', 40); if (w.deep) d.rect(X(i) - 1, y0, 2, 4, DEEPC); });
      top.slice().reverse().forEach(function (o, jj) {
        var j = top.length - 1 - jj, k = o.name.toLowerCase(), pts = [];
        W.forEach(function (w, i) { var g = w.rk[k]; pts.push([X(i), y0 + (g ? g.t : 0) / top2 * (y1 - y0)]); });
        d.line(pts, LINES[j], j === 0 ? 2.6 : 1.8);
        pts.forEach(function (p) { d.circle(p[0], p[1], j === 0 ? 2.6 : 2, LINES[j]); });
      });
      top.forEach(function (o, j) { var yy = y1 - 6 - j * 22; d.rect(x1 + 14, yy - 2, 12, 4, LINES[j]); d.circle(x1 + 20, yy, 3, LINES[j]); d.text(x1 + 32, yy - 1, o.name, 9, true, INK, null, lw - 30); d.text(x1 + 32, yy - 11, f1(o.total) + ' pts', 7.5, false, GREY); });
      d.y = y0 - 26;
    };
    // carte des semaines : une colonne par semaine, case dorée selon les points
    d.heat = function (D) {
      var W = D.weeks, st = D.st; if (!W.length || !st.length) return;
      var per = 13, max = 0; W.forEach(function (w) { Object.keys(w.pts).forEach(function (k) { max = Math.max(max, w.pts[k]); }); });
      for (var c0 = 0; c0 < W.length; c0 += per) {
        var ws = W.slice(c0, c0 + per), nameW = 110, cw = Math.min(30, (CW - 20 - nameW - 46) / ws.length), gx = M + 20 + nameW;
        var headH = 26, head = function () {
          ws.forEach(function (w, i) { d.rect(gx + i * cw + 1, d.y - headH, cw - 2, headH, w.deep ? DEEPC : DARK); d.text(gx + i * cw, d.y - 11, w.short, 7.5, true, GOLD, 'c', cw); d.text(gx + i * cw, d.y - 21, dm(w.from), 6.5, false, '0.85 0.85 0.85', 'c', cw); });
          d.rect(gx + ws.length * cw + 4, d.y - headH, 42, headH, GOLD); d.text(gx + ws.length * cw + 4, d.y - 16, 'TOTAL', 7.5, true, DARK, 'c', 42); d.y -= headH + 2;
        };
        d.need(headH + 18 * Math.min(4, st.length)); head();
        st.forEach(function (o, i) {
          if (d.y - 17 < M + 22) { page(); head(); }
          var k = o.name.toLowerCase(), yc = d.y - 8.5;
          d.text(M, yc - 3, String(i + 1), 8, true, i < 3 ? '0.55 0.42 0.08' : GREY, 'r', 14); d.text(M + 20, yc - 3, o.name, 8.5, i < 3, INK, null, nameW - 4);
          ws.forEach(function (w, j) {
            var v = w.pts[k], x = gx + j * cw + 1;
            if (v === undefined) { d.rect(x, d.y - 16, cw - 2, 15, '0.975 0.975 0.975'); d.text(x, yc - 3, '–', 7, false, '0.75 0.75 0.75', 'c', cw - 2); }
            else { var t = v / (max || 1); d.rect(x, d.y - 16, cw - 2, 15, mix(0.12 + 0.88 * t)); d.text(x, yc - 3, f1(v), 7, t > 0.55, INK, 'c', cw - 2); }
          });
          d.rect(gx + ws.length * cw + 4, d.y - 16, 42, 15, PALE); d.text(gx + ws.length * cw + 4, yc - 3.5, f1(o.total), 8.5, true, INK, 'c', 42);
          d.y -= 17;
        });
        d.y -= 10;
      }
    };
    // fiche d’un tournoi : bandeau coloré, chiffres, tableau avec médailles et prime en rouge
    d.tourney = function (tn, bare) {
      var dp = tn.type === 'deep', lib = tn.type === 'libre', bg = dp ? DARK : lib ? '0.55 0.55 0.55' : GOLD, fg = dp ? GOLD : lib ? WHITE : DARK;
      var cols = [[0, 30, 'c', '#'], [30, 130, 'l', 'Joueur'], [160, 46, 'c', 'Points'], [206, 36, 'c', 'Prime'], [242, 130, 'l', 'Éliminé par'], [372, 44, 'c', 'Heure'], [416, CW - 416, 'c', 'Niveau']];
      function thead() { d.rect(M, d.y - 15, CW, 15, '0.20 0.20 0.20'); cols.forEach(function (c) { d.text(M + c[0] + 4, d.y - 10.5, c[3].toUpperCase(), 6.8, true, '0.85 0.85 0.85', c[2], c[1] - 8); }); d.y -= 15; }
      d.need(30 + 22 + 15 + 18 * Math.min(4, tn.rows.length));
      if (!bare) {
      d.rect(M, d.y - 30, CW, 30, bg); d.text(M + 10, d.y - 19.5, L().TYPES[tn.type].name + (dp ? '  ×1,4' : ''), 13, true, fg, null, CW - 150); d.text(M, d.y - 19.5, dfr(tn.date), 11, true, fg, 'r', CW - 10); d.y -= 30;
      var chips = [tn.n + ' joueurs'].concat(tn.re ? [tn.re + ' re-entry'] : [], tn.add ? [tn.add + ' add-on'] : [], tnLength(tn) ? ['durée ' + tnLength(tn)] : [], ['vainqueur : ' + (tn.winner || '—')], tn.holder ? ['tête mise à prix : ' + tn.holder] : []);
      d.rect(M, d.y - 22, CW, 22, PALE); var x = M + 8;
      chips.forEach(function (c, i) { var w = tw(c, 8, i === chips.length - 1 && tn.holder); if (x + w > M + CW - 6) return; d.text(x, d.y - 14.5, c, 8, /vainqueur/.test(c), /tête/.test(c) ? RED : INK); x += w + 16; });
      d.y -= 24; }
      thead();
      tn.rows.forEach(function (r, i) {
        if (d.y - 17 < M + 22) { page(); thead(); }
        var p = r.place <= 3, yc = d.y - 8.5;
        if (p) d.rect(M, d.y - 17, CW, 17, PALE); else if (i % 2) d.rect(M, d.y - 17, CW, 17, ZEB);
        if (p) { d.circle(M + 15, yc, 7, MEDAL[r.place - 1]); d.text(M + 8, yc - 2.8, String(r.place), 7.5, true, r.place === 1 ? DARK : WHITE, 'c', 14); }
        else d.text(M + 4, yc - 3, String(r.place), 8.5, false, GREY, 'c', 22);
        d.text(M + cols[1][0] + 4, yc - 3, r.name + (r.entries > 1 ? '  (' + r.entries + ' entrées)' : ''), 9, p, INK, null, cols[1][1] - 8);
        d.text(M + cols[2][0] + 4, yc - 3, f1(r.total), 9, true, INK, 'c', cols[2][1] - 8);
        if (r.bonus) d.text(M + cols[3][0] + 4, yc - 3, '+' + f1(r.bonus), 9, true, RED, 'c', cols[3][1] - 8);
        d.text(M + cols[4][0] + 4, yc - 3, r.koBy || (r.place === 1 ? 'vainqueur' : ''), 9, false, r.koBy ? INK : '0.55 0.42 0.08', null, cols[4][1] - 8);
        d.text(M + cols[5][0] + 4, yc - 3, hm(r.koAt), 8.5, false, GREY, 'c', cols[5][1] - 8);
        d.text(M + cols[6][0] + 4, yc - 3, r.koLevel || '', 8.5, false, GREY, 'c', cols[6][1] - 8);
        d.y -= 17;
      });
      d.y -= 16;
    };
    d.bytes = function () {
      var n = pages.length, objs = [];
      objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
      objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
      var kids = [];
      pages.forEach(function (p, i) {
        var po = 5 + i * 2, co = po + 1;
        p.push(GOLD + ' rg ' + M + ' 34 ' + CW.toFixed(2) + ' 0.6 re f');
        p.push('BT ' + GREY + ' rg /F1 7.5 Tf ' + M + ' 22 Td (' + pdesc('Édité le ' + new Date().toLocaleDateString('fr-FR') + ' avec Poker Academy · merci à Lionel et au club') + ') Tj ET');
        var pg = 'Page ' + (i + 1) + ' / ' + n; p.push('BT ' + GREY + ' rg /F1 7.5 Tf ' + (PW - M - tw(pg, 7.5)).toFixed(2) + ' 22 Td (' + pg + ') Tj ET');
        var s = p.join('\n');
        objs[po] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + co + ' 0 R >>';
        objs[co] = '<< /Length ' + s.length + ' >>\nstream\n' + s + '\nendstream';
        kids.push(po + ' 0 R');
      });
      objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>';
      var out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', off = [];
      for (var i = 1; i < objs.length; i++) { off[i] = out.length; out += i + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
      var xr = out.length; out += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
      for (var j = 1; j < objs.length; j++) out += ('000000000' + off[j]).slice(-10) + ' 00000 n \n';
      out += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R /Info << /Title (' + pdesc(title) + ') /Producer (Poker Academy) >> >>\nstartxref\n' + xr + '\n%%EOF\n';
      var b = new Uint8Array(out.length); for (var k = 0; k < out.length; k++) b[k] = out.charCodeAt(k) & 255; return b;
    };
    return d;
  }
  function yearPdf(year) {
    var D = yearData(year), doc = Doc('Championnat du club ' + year);
    doc.newPage();
    doc.h1('Championnat du club', 'Classement général : mercredis et deeps comptent ensemble (le deep rapporte ×1,4) · les 3 premiers sont récompensés', year);
    doc.kpis([['Tournois', D.nT, D.nMer + ' mercredi · ' + D.nDeep + ' deep' + (D.nLib ? ' · ' + D.nLib + ' hors champ.' : '')], ['Joueurs classés', D.nPlayers, 'au moins un tournoi'], ['Moyenne de joueurs', f1(D.avgPlayers), 'par tournoi'], ['Primes', '+' + f1(D.primes), 'points de prime', RED]]);
    doc.podium(D.st);
    doc.h2('Classement général');
    doc.legend([['Mercredi', GOLD], ['Deep ×1,4', DEEPC], ['Primes', RED]]);
    doc.bars(D.st);
    doc.note('Barème : le 1er marque autant de points qu’il y a de joueurs, le 2e un de moins… le dernier 1 point. Deep du vendredi : points ×1,4, ajoutés au même total que les mercredis. Prime : ' + L().BONUS + ' points pour qui élimine le vainqueur du tournoi précédent du même type. Moyenne = total ÷ tournois joués.');
    if (D.weeks.length) {
      doc.newPage(); doc.h1('La saison semaine après semaine', 'Course au titre (points cumulés des 5 premiers), puis les points marqués chaque semaine.');
      if (D.weeks.length > 1) { doc.h2('La course au titre'); doc.race(D); }
      doc.h2('Points par semaine', 'Plus la case est dorée, plus le joueur a marqué · en-tête bronze : semaine avec un deep');
      doc.heat(D);
      doc.h2('Vainqueurs de la semaine');
      var wl = D.weeks.slice().reverse(), half = Math.ceil(wl.length / 2), cw2 = CW / 2;
      for (var q = 0; q < half; q++) { doc.need(13); [wl[q], wl[q + half]].forEach(function (w, c) { if (!w) return; var x = M + c * cw2; doc.text(x, doc.y - 9, w.short, 8, true, '0.55 0.42 0.08'); doc.text(x + 28, doc.y - 9, w.games, 8, false, INK, null, cw2 - 34); }); doc.y -= 13; }
    }
    if (D.list.length) { doc.newPage(); doc.h1('Les tournois', 'Qui a sorti qui, à quelle heure, à quel niveau · prime en rouge'); D.list.slice().reverse().forEach(function (tn) { doc.tourney(tn); }); }
    return doc.bytes();
  }
  function tnPdf(tn) {
    var doc = Doc(tnTitle(tn)); doc.newPage();
    doc.h1(L().TYPES[tn.type].name, tnSub(tn), dm(tn.date));
    doc.kpis([['Joueurs', tn.n, tn.re ? tn.re + ' re-entry' : ''], ['Add-on', tn.add || 0, ''], ['Durée', tnLength(tn) || '—', 'première à dernière sortie'], ['Vainqueur', tn.winner || '—', tn.type === 'deep' ? 'points ×1,4' : '']]);
    doc.tourney(tn, true);
    return doc.bytes();
  }
  /* ---------- Envoi du fichier ---------- */
  function b64(u8) { var s = ''; for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  var MIME = { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pdf: 'application/pdf' };
  function deliver(bytes, name, done) {
    var ext = name.split('.').pop(), mime = MIME[ext];
    if (window.PAAndroid && window.PAAndroid.shareFile) { window.PAAndroid.shareFile(b64(bytes), name, mime); done('Fichier prêt : choisis l’appli pour l’ouvrir ou l’envoyer.'); return; }
    if (window.PA_SYNC && window.PA_SYNC.isPC) {
      fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, b64: b64(bytes), open: true }) })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { done('Fichier enregistré et ouvert : ' + j.path); }).catch(function () { done('Enregistrement impossible.'); });
      return;
    }
    try { var f = new File([bytes], name, { type: mime }); if (window.PA_SYNC && window.PA_SYNC.isIOS && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: name }).catch(function () {}); done('Fichier prêt.'); return; } } catch (e) {}
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 30000);
    done('Fichier créé : ' + name);
  }
  function slug(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function year(y, fmt, done) { deliver(fmt === 'pdf' ? yearPdf(y) : yearXlsx(y), 'Championnat-' + y + '.' + fmt, done); }
  function tournament(id, fmt, done) {
    var tn = L().load().list.filter(function (x) { return x.id === id; })[0]; if (!tn) { done('Tournoi introuvable.'); return; }
    deliver(fmt === 'pdf' ? tnPdf(tn) : tnXlsx(tn), slug(L().TYPES[tn.type].short + '-' + tn.date) + '.' + fmt, done);
  }
  window.PA_EXPORT = { year: year, tournament: tournament, _yearXlsx: yearXlsx, _yearPdf: yearPdf, _tnPdf: tnPdf, _tnXlsx: tnXlsx };
})();
