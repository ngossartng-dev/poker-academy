/* Poker Academy — export du championnat : classeur Excel (.xlsx) et PDF, fabriqués dans l’appli, sans connexion */
(function () {
  'use strict';
  function L() { return window.PA_LEAGUE; }
  function f1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function dfr(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function hm(t) { return t ? new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''; }
  function utf8(s) { return new TextEncoder().encode(s); }

  /* ---------- Les données, une fois pour les deux formats ---------- */
  function yearData(year) {
    var lg = L(), list = lg.load().list.filter(function (x) { return x.date.slice(0, 4) === year; });
    var champ = list.filter(function (x) { return x.type !== 'libre'; });
    var st = lg.standings(list);
    var ws = {}; list.forEach(function (x) { (ws[lg.week(x.date)] = ws[lg.week(x.date)] || []).push(x); });
    var weeks = [], cum = [];
    Object.keys(ws).sort().forEach(function (w) {
      cum = cum.concat(ws[w]);
      var gen = lg.standings(cum), rk = {}; gen.forEach(function (o, i) { rk[o.name.toLowerCase()] = { r: i + 1, t: o.total }; });
      var stw = lg.standings(ws[w]);
      weeks.push({ w: w, label: lg.weekLabel(w), games: ws[w].map(function (x) { return lg.TYPES[x.type].short + ' du ' + dfr(x.date) + ' : ' + (x.winner || '—'); }).join(' · '),
        rows: stw.map(function (o, i) { var g = rk[o.name.toLowerCase()] || {}; return { rank: i + 1, name: o.name, pts: o.total, cum: g.t, gen: g.r }; }) });
    });
    return { year: year, list: list, nChamp: champ.length, nMer: list.filter(function (x) { return x.type === 'mercredi'; }).length, nDeep: list.filter(function (x) { return x.type === 'deep'; }).length, st: st, weeks: weeks.reverse() };
  }
  function tnTitle(tn) { return L().TYPES[tn.type].name + ' du ' + dfr(tn.date); }
  function tnSub(tn) { return tn.n + ' joueurs' + (tn.re ? ' · ' + tn.re + ' re-entry' : '') + (tn.add ? ' · ' + tn.add + ' add-on' : '') + (tn.type === 'deep' ? ' · points ×1,4' : tn.type === 'libre' ? ' · hors championnat' : '') + (tn.holder ? ' · tête mise à prix : ' + tn.holder : ''); }

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
  // styles : 1 en-tête or sur noir · 2 titre · 3 sous-titre · 4 podium · 5 podium centré · 6 centré · 7 bandeau de semaine · 8 texte
  var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="15"/><color rgb="FF8A6A12"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFE3C26A"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font></fonts>' +
    '<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF141414"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7ECC9"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/></patternFill></fill></fills>' +
    '<borders count="2"><border/><border><bottom style="thin"><color rgb="FFD0D0D0"/></bottom></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="9"><xf xfId="0" borderId="0" fillId="0" fontId="0" numFmtId="0"/>' +
    '<xf xfId="0" borderId="0" numFmtId="0" fontId="3" fillId="2" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf xfId="0" borderId="0" fillId="0" numFmtId="0" fontId="2" applyFont="1"/><xf xfId="0" borderId="0" fillId="0" numFmtId="0" fontId="4" applyFont="1"/>' +
    '<xf xfId="0" numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf xfId="0" numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
    '<xf xfId="0" fillId="0" fontId="0" numFmtId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf xfId="0" borderId="0" numFmtId="0" fontId="1" fillId="4" applyFont="1" applyFill="1"/><xf xfId="0" fillId="0" fontId="0" numFmtId="0" borderId="1" applyBorder="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
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
  function tnRowsXl(tn) {
    return tn.rows.map(function (r) {
      var s = r.place <= 3 ? 4 : 8, sc = r.place <= 3 ? 5 : 6;
      return [{ v: r.place, s: sc }, { v: r.name, s: s }, { v: r.entries || 1, s: sc }, { v: r.pts, s: sc }, { v: r.bonus || '', s: sc }, { v: r.total, s: sc }, { v: r.koBy || (r.place === 1 ? 'vainqueur' : ''), s: s }, { v: hm(r.koAt), s: sc }, { v: r.koLevel || '', s: sc }];
    });
  }
  var TN_HEAD = ['Place', 'Joueur', 'Entrées', 'Points de place', 'Prime', 'Total', 'Éliminé par', 'Heure', 'Niveau'], TN_W = [8, 22, 9, 10, 8, 9, 22, 9, 12];
  function stRowsXl(st) {
    return st.map(function (o, i) { var p = i < 3, s = p ? 4 : 8, sc = p ? 5 : 6; return [{ v: p ? ['1er', '2e', '3e'][i] : i + 1, s: sc }, { v: o.name, s: s }, { v: o.total, s: sc }, { v: Math.round(o.pts * 10) / 10, s: sc }, { v: o.bonus || '', s: sc }, { v: o.n, s: sc }, { v: o.wins || '', s: sc }, { v: o.best < 99 ? o.best : '', s: sc }, { v: o.kos || '', s: sc }]; });
  }
  function yearXlsx(year) {
    var D = yearData(year), now = new Date().toLocaleDateString('fr-FR');
    var s1 = { name: 'Classement ' + year, widths: [7, 24, 10, 11, 9, 10, 10, 11, 12], freeze: 4,
      rows: [[{ v: 'Championnat du club · classement ' + year, s: 2 }], [{ v: D.nChamp + ' tournois au championnat (' + D.nMer + ' mercredi, ' + D.nDeep + ' deep) · édité le ' + now + ' · Poker Academy', s: 3 }], [],
        H(['Rang', 'Joueur', 'Points', 'Points de place', 'Primes', 'Tournois', 'Victoires', 'Meilleure place', 'Éliminations'])].concat(stRowsXl(D.st), [[], [{ v: 'Barème : le 1er marque autant de points qu’il y a de joueurs, le dernier 1 point. Deep du vendredi ×1,4. Prime de ' + L().BONUS + ' points pour qui élimine le vainqueur du tournoi précédent du même type. Les 3 premiers sont récompensés.', s: 3 }]]) };
    s1.rows[3].h = 30;
    var r2 = [[{ v: 'Semaine par semaine · ' + year, s: 2 }], [{ v: 'Points marqués dans la semaine, puis total et rang au classement général à la fin de la semaine.', s: 3 }], [], H(['Semaine', 'Rang', 'Joueur', 'Points de la semaine', 'Total cumulé', 'Rang général'])];
    r2[3].h = 30;
    D.weeks.forEach(function (w) {
      r2.push([{ v: w.label, s: 7 }, { v: '', s: 7 }, { v: w.games, s: 7 }, { v: '', s: 7 }, { v: '', s: 7 }, { v: '', s: 7 }]);
      w.rows.forEach(function (o) { r2.push([{ v: w.w, s: 8 }, { v: o.rank, s: 6 }, { v: o.name, s: 8 }, { v: o.pts, s: 6 }, { v: o.cum, s: 6 }, { v: o.gen, s: 6 }]); });
    });
    var r3 = [[{ v: 'Les tournois · ' + year, s: 2 }], [{ v: 'Résultat complet de chaque tournoi : qui a sorti qui, à quelle heure, à quel niveau.', s: 3 }], [], H(['Date', 'Tournoi'].concat(TN_HEAD))];
    r3[3].h = 30;
    D.list.slice().reverse().forEach(function (tn) {
      r3.push([{ v: dfr(tn.date), s: 7 }, { v: tnTitle(tn), s: 7 }, { v: '', s: 7 }, { v: tnSub(tn), s: 7 }].concat([0, 0, 0, 0, 0, 0, 0].map(function () { return { v: '', s: 7 }; })));
      tnRowsXl(tn).forEach(function (r) { r3.push([{ v: dfr(tn.date), s: 8 }, { v: L().TYPES[tn.type].short, s: 8 }].concat(r)); });
    });
    return xlsx([s1, { name: 'Semaine par semaine', widths: [11, 7, 30, 12, 11, 10], freeze: 4, rows: r2 }, { name: 'Tournois', widths: [11, 12].concat(TN_W), freeze: 4, land: true, rows: r3 }]);
  }
  function tnXlsx(tn) {
    var r = [[{ v: tnTitle(tn), s: 2 }], [{ v: tnSub(tn) + ' · vainqueur : ' + (tn.winner || '—'), s: 3 }], [], H(TN_HEAD)].concat(tnRowsXl(tn));
    r[3].h = 30;
    return xlsx([{ name: 'Résultats', widths: TN_W, freeze: 4, rows: r }]);
  }

  /* ---------- PDF (A4, polices Helvetica intégrées aux lecteurs) ---------- */
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
  var PW = 595.28, PH = 841.89, M = 40;
  var GOLD = '0.79 0.62 0.20', INK = '0.08 0.08 0.08', GREY = '0.42 0.42 0.42', DARK = '0.08 0.08 0.08', PALE = '0.97 0.93 0.79', ZEB = '0.955 0.955 0.955';
  function Doc(title) {
    var pages = [], cur = null, y = 0, d = {};
    function page() { cur = []; pages.push(cur); y = PH - M; }
    d.rect = function (x, yy, w, h, rgb) { cur.push(rgb + ' rg ' + x.toFixed(2) + ' ' + yy.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re f'); };
    d.text = function (x, yy, s, size, bold, rgb, align, w) {
      var t = w ? fit(s, w, size, bold) : String(s), xx = x;
      if (align === 'c') xx = x + (w - tw(t, size, bold)) / 2; else if (align === 'r') xx = x + w - tw(t, size, bold);
      cur.push('BT ' + (rgb || INK) + ' rg /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + xx.toFixed(2) + ' ' + yy.toFixed(2) + ' Td (' + pdesc(t) + ') Tj ET');
    };
    d.need = function (h) { if (!cur || y - h < M + 24) { page(); d.band(); } };
    d.band = function () { d.rect(0, PH - 30, PW, 30, DARK); d.rect(0, PH - 32, PW, 2, GOLD); d.text(M, PH - 20, 'POKER ACADEMY', 10, true, GOLD); d.text(M + 110, PH - 20, title, 10, false, '0.85 0.85 0.85', 'r', PW - 2 * M - 110); y = PH - 56; };
    d.h1 = function (s, sub) { d.need(60); d.text(M, y - 18, s, 20, true, INK); y -= 26; if (sub) { d.text(M, y - 12, sub, 9.5, false, GREY, null, PW - 2 * M); y -= 18; } d.rect(M, y - 2, 60, 2.5, GOLD); y -= 14; };
    d.h2 = function (s, sub) { d.need(70); d.text(M, y - 13, s, 13, true, INK, null, PW - 2 * M); y -= 18; if (sub) { d.text(M, y - 10, sub, 8.5, false, GREY, null, PW - 2 * M); y -= 14; } y -= 4; };
    d.note = function (s) { var words = String(s).split(' '), line = ''; words.forEach(function (w) { if (tw(line + ' ' + w, 8.5) > PW - 2 * M) { d.need(12); d.text(M, y - 9, line.trim(), 8.5, false, GREY); y -= 12; line = ''; } line += ' ' + w; }); if (line.trim()) { d.need(12); d.text(M, y - 9, line.trim(), 8.5, false, GREY); y -= 12; } };
    // tableau : cols = [{ t, w, a }] (largeurs relatives), rows = [[valeurs]], hi(i) = ligne en or
    d.table = function (cols, rows, hi) {
      var tot = cols.reduce(function (a, c) { return a + c.w; }, 0), W = PW - 2 * M, xs = [], x = M;
      cols.forEach(function (c) { xs.push(x); x += c.w / tot * W; });
      function head() { d.rect(M, y - 18, W, 18, DARK); cols.forEach(function (c, i) { d.text(xs[i] + 4, y - 12.5, c.t, 8, true, GOLD, c.a || 'l', c.w / tot * W - 8); }); y -= 18; }
      d.need(18 + 17 * Math.min(rows.length, 3)); head();
      rows.forEach(function (r, ri) {
        if (y - 17 < M + 24) { page(); d.band(); head(); }
        var h = hi && hi(ri);
        if (h) d.rect(M, y - 17, W, 17, PALE); else if (ri % 2) d.rect(M, y - 17, W, 17, ZEB);
        if (h) d.rect(M, y - 17, 3, 17, GOLD);
        r.forEach(function (v, i) { d.text(xs[i] + 4, y - 11.8, v === null || v === undefined ? '' : v, 9, !!h || (cols[i].b), INK, cols[i].a || 'l', cols[i].w / tot * W - 8); });
        y -= 17;
      });
      y -= 12;
    };
    d.podium = function (st) {
      if (!st.length) return; d.need(100);
      var W = (PW - 2 * M - 20) / 3, order = [1, 0, 2], hts = [70, 84, 62];
      order.forEach(function (k, j) {
        var o = st[k]; if (!o) return; var x = M + j * (W + 10), h = hts[k], base = y - 92;
        d.rect(x, base, W, h, k === 0 ? GOLD : PALE); d.rect(x, base + h - 3, W, 3, k === 0 ? DARK : GOLD);
        d.text(x, base + h - 20, ['1er', '2e', '3e'][k], 11, true, k === 0 ? DARK : '0.55 0.42 0.08', 'c', W);
        d.text(x + 6, base + h - 36, o.name, 12, true, INK, 'c', W - 12);
        d.text(x, base + 8, f1(o.total) + ' pts', 11, true, INK, 'c', W);
      });
      y -= 106;
    };
    d.bytes = function () {
      var n = pages.length, objs = [];
      objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
      objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
      var kids = [];
      pages.forEach(function (p, i) {
        var po = 5 + i * 2, co = po + 1;
        p.push('BT ' + GREY + ' rg /F1 8 Tf ' + M + ' 22 Td (' + pdesc('Édité le ' + new Date().toLocaleDateString('fr-FR') + ' avec Poker Academy · merci à Lionel et au club') + ') Tj ET');
        var pg = 'Page ' + (i + 1) + ' / ' + n; p.push('BT ' + GREY + ' rg /F1 8 Tf ' + (PW - M - tw(pg, 8)).toFixed(2) + ' 22 Td (' + pg + ') Tj ET');
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
  var ST_COLS = [{ t: 'Rang', w: 6, a: 'c' }, { t: 'Joueur', w: 22 }, { t: 'Points', w: 9, a: 'c', b: 1 }, { t: 'Tournois', w: 9, a: 'c' }, { t: 'Victoires', w: 9, a: 'c' }, { t: 'Primes', w: 8, a: 'c' }, { t: 'Meilleure', w: 9, a: 'c' }, { t: 'Élim.', w: 7, a: 'c' }];
  function stRowsPdf(st) { return st.map(function (o, i) { return [i < 3 ? ['1er', '2e', '3e'][i] : i + 1, o.name, f1(o.total), o.n, o.wins || '', o.bonus ? '+' + f1(o.bonus) : '', o.best < 99 ? o.best + (o.best === 1 ? 'er' : 'e') : '', o.kos || '']; }); }
  var TN_COLS = [{ t: 'Place', w: 6, a: 'c' }, { t: 'Joueur', w: 19 }, { t: 'Points', w: 8, a: 'c', b: 1 }, { t: 'Prime', w: 6, a: 'c' }, { t: 'Éliminé par', w: 17 }, { t: 'Heure', w: 7, a: 'c' }, { t: 'Niveau', w: 10, a: 'c' }];
  function tnRowsPdf(tn) { return tn.rows.map(function (r) { return [r.place, r.name + (r.entries > 1 ? ' (' + r.entries + ' entrées)' : ''), f1(r.total), r.bonus ? '+' + f1(r.bonus) : '', r.koBy || (r.place === 1 ? 'vainqueur' : ''), hm(r.koAt), r.koLevel || '']; }); }
  function tnPdfInto(doc, tn) { doc.h2(tnTitle(tn) + ' · vainqueur : ' + (tn.winner || '—'), tnSub(tn)); doc.table(TN_COLS, tnRowsPdf(tn), function (i) { return i < 3; }); }
  function yearPdf(year) {
    var D = yearData(year), doc = Doc('Championnat du club ' + year);
    doc.h1('Classement ' + year, D.nChamp + ' tournois au championnat · ' + D.nMer + ' mercredi · ' + D.nDeep + ' deep · les 3 premiers sont récompensés');
    doc.podium(D.st);
    doc.table(ST_COLS, stRowsPdf(D.st), function (i) { return i < 3; });
    doc.note('Barème : le 1er marque autant de points qu’il y a de joueurs, le 2e un de moins… le dernier 1 point. Deep du vendredi : points ×1,4. Prime : ' + L().BONUS + ' points pour qui élimine le vainqueur du tournoi précédent du même type.');
    if (D.weeks.length) {
      doc.need(9999); doc.h1('Semaine par semaine', 'Points marqués dans la semaine, puis total et rang au classement général à la fin de la semaine.');
      D.weeks.forEach(function (w) {
        doc.h2(w.label, w.games);
        doc.table([{ t: 'Rang', w: 6, a: 'c' }, { t: 'Joueur', w: 24 }, { t: 'Points semaine', w: 11, a: 'c', b: 1 }, { t: 'Total', w: 9, a: 'c' }, { t: 'Rang général', w: 10, a: 'c' }], w.rows.map(function (o) { return [o.rank, o.name, f1(o.pts), o.cum !== undefined ? f1(o.cum) : '', o.gen || '']; }), function (i) { return i === 0; });
      });
    }
    if (D.list.length) { doc.need(9999); doc.h1('Les tournois', 'Résultat complet : qui a sorti qui, à quelle heure, à quel niveau.'); D.list.slice().reverse().forEach(function (tn) { tnPdfInto(doc, tn); }); }
    return doc.bytes();
  }
  function tnPdf(tn) { var doc = Doc(tnTitle(tn)); doc.h1(tnTitle(tn), tnSub(tn)); doc.table(TN_COLS, tnRowsPdf(tn), function (i) { return i < 3; }); return doc.bytes(); }

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
