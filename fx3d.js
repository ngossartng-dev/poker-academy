/* Poker Academy – animations en 3D (three.js, chargé seulement quand on en a besoin) */
(function () {
  'use strict';
  var PI = Math.PI;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeIn(x) { return x * x * x; }
  function back(x) { var c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function bounce(x) { // chute avec petit rebond
    if (x < 0.62) return easeIn(x / 0.62);
    var y = (x - 0.62) / 0.38; return 1 - Math.sin(y * PI) * 0.12 * (1 - y);
  }

  function clayTex(T) { // grain de pâte à modeler
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'), im = g.createImageData(256, 256), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var v = 110 + Math.random() * 60; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); g.globalAlpha = 0.18;
    for (var k = 0; k < 90; k++) { g.strokeStyle = Math.random() < 0.5 ? '#000' : '#fff'; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); var x = Math.random() * 256, y = Math.random() * 256; g.moveTo(x, y); g.quadraticCurveTo(x + Math.random() * 40 - 20, y + Math.random() * 40 - 20, x + Math.random() * 60 - 30, y + Math.random() * 60 - 30); g.stroke(); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2, 2); return t;
  }

  function poulet(box, t0, onFail) {
    var T = window.THREE; if (!T) { onFail && onFail(); return; }
    var W = box.clientWidth || innerWidth, H = box.clientHeight || innerHeight * 0.7, R;
    try { R = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { onFail && onFail(); return; }
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.setSize(W, H);
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    if ('outputColorSpace' in R) R.outputColorSpace = T.SRGBColorSpace;
    box.appendChild(R.domElement);
    var S = new T.Scene(), cam = new T.PerspectiveCamera(30, W / H, 0.1, 100);
    function aim() { var th = Math.tan(15 * PI / 180), d = Math.max(8.5, 2.6 / (th * (W / H))); cam.position.set(0.2, 2.0 + d * 0.08, d); cam.lookAt(-0.5, 1.9, 0); }
    aim();
    S.add(new T.HemisphereLight(0xfff3e2, 0x4a3426, 1.25));
    var sun = new T.DirectionalLight(0xffffff, 2.3); sun.position.set(3, 7, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 1; sc.far = 20; sun.shadow.radius = 5; sun.shadow.bias = -0.0005; S.add(sun);
    var rim = new T.DirectionalLight(0xffd9a8, 0.9); rim.position.set(-5, 3, -4); S.add(rim);
    var gr = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({ opacity: 0.45 })); gr.rotation.x = -PI / 2; gr.receiveShadow = true; S.add(gr);

    var tex = clayTex(T);
    function M(c, r, noBump) { return new T.MeshStandardMaterial({ color: c, roughness: r == null ? 0.82 : r, metalness: 0, bumpMap: noBump ? null : tex, bumpScale: noBump ? 0 : 0.6 }); }
    var mWhite = M(0xf4ede0), mRed = M(0xd8232c, 0.6), mOrange = M(0xf09a1c, 0.6), mBeak = M(0xf6b51e, 0.5), mPink = M(0xff9aa6, 0.9),
      mEye = M(0xffffff, 0.25, true), mPup = M(0x111111, 0.2, true), mStalk = M(0xd24d4d, 0.5), mCar = M(0xf06c0a, 0.55), mLeaf = M(0x3aa52f, 0.7), mStar = new T.MeshStandardMaterial({ color: 0xffd84a, emissive: 0xb08000, emissiveIntensity: 0.8, roughness: 0.35 });
    function ball(r, m, sx, sy, sz, x, y, z) { var o = new T.Mesh(new T.SphereGeometry(r, 48, 32), m); o.scale.set(sx || 1, sy || 1, sz || 1); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; }

    // ---- la poule ----
    var fall = new T.Group(); fall.position.set(0, 0, 0.95); S.add(fall);
    var root = new T.Group(); root.position.set(0, 0, -0.95); fall.add(root);
    var bob = new T.Group(); root.add(bob);
    bob.add(ball(1, mWhite, 1.2, 0.95, 0.92, -0.1, 1.38, 0));            // corps dodu
    bob.add(ball(0.72, mWhite, 1, 1, 1, 0.5, 1.28, 0));                   // poitrail
    bob.add(ball(0.55, mWhite, 1, 0.9, 0.95, -1.05, 1.32, 0));            // derrière
    [[-1.18, 2.05, 0, 0.75], [-1.35, 1.88, 0.2, 1.0], [-1.35, 1.88, -0.2, 1.0], [-1.05, 2.15, 0.12, 0.45], [-1.05, 2.15, -0.12, 0.45]].forEach(function (q) { // queue en boudins
      var b = ball(0.26, mWhite, 0.7, 1.7, 0.7, q[0], q[1], q[2]); b.rotation.z = q[3]; bob.add(b);
    });
    // pattes
    var legs = [];
    [0.34, -0.34].forEach(function (z) {
      var L = new T.Group(); L.position.set(0.05, 0.62, z); bob.add(L); legs.push(L);
      var shin = new T.Mesh(new T.CylinderGeometry(0.075, 0.085, 0.62, 20), mOrange); shin.position.y = -0.31; shin.castShadow = true; L.add(shin);
      [-0.5, 0, 0.5, PI].forEach(function (a, k) { var toe = new T.Mesh(new T.CapsuleGeometry(0.06, k === 3 ? 0.12 : 0.26, 6, 12), mOrange); toe.rotation.z = PI / 2; var g = new T.Group(); g.position.y = -0.6; g.rotation.y = a; toe.position.x = k === 3 ? 0.1 : 0.2; g.add(toe); toe.castShadow = true; L.add(g); });
    });
    // ailes
    var wings = [];
    [1, -1].forEach(function (s) {
      var P = new T.Group(); P.position.set(0.05, 1.78, 0.8 * s); bob.add(P);
      var w = ball(0.62, mWhite, 1.15, 0.6, 0.3, -0.38, -0.3, 0.06 * s); w.rotation.z = 0.25; P.add(w);
      wings.push({ g: P, s: s });
    });
    // tête
    var head = new T.Group(); head.position.set(0.85, 2.38, 0); bob.add(head);
    head.add(ball(0.64, mWhite, 1, 0.95, 0.9));
    [[-0.22, 0.6, 0.35], [0.02, 0.7, 0], [0.26, 0.62, -0.35]].forEach(function (q) { var c = ball(0.17, mRed, 0.85, 1.35, 0.6, q[0], q[1], 0); c.rotation.z = q[2]; head.add(c); });
    head.add(ball(0.13, mRed, 0.8, 1.6, 0.6, 0.6, -0.38, 0));
    [1, -1].forEach(function (s) { head.add(ball(0.13, mPink, 1, 0.6, 0.3, 0.28, -0.15, 0.53 * s)); });
    var up = new T.Mesh(new T.ConeGeometry(0.17, 0.55, 28), mBeak); up.rotation.z = -PI / 2; up.position.set(0.82, -0.02, 0); up.scale.z = 0.8; up.castShadow = true; head.add(up);
    var jaw = new T.Group(); jaw.position.set(0.6, -0.1, 0); head.add(jaw);
    var lo = new T.Mesh(new T.ConeGeometry(0.12, 0.4, 24), mBeak); lo.rotation.z = -PI / 2; lo.position.set(0.18, -0.02, 0); lo.scale.z = 0.8; jaw.add(lo);
    // yeux (comme la v1 : gros yeux ronds qui sortent des orbites)
    var eyes = [];
    [1, -1].forEach(function (s) {
      var base = new T.Vector3(0.42, 0.22, 0.34 * s), dir = base.clone().add(new T.Vector3(0.1, 0.35, 0)).normalize();
      var e = new T.Group(); head.add(e);
      e.add(ball(0.21, mEye, 1, 1.12, 1));
      var pup = ball(0.1, mPup); e.add(pup);
      var hl = ball(0.035, mEye); e.add(hl);
      var st = new T.Mesh(new T.CylinderGeometry(0.045, 0.06, 1, 12), mStalk); st.visible = false; head.add(st);
      eyes.push({ g: e, pup: pup, hl: hl, base: base, dir: dir, st: st, s: s });
    });
    // ---- la carotte ----
    var car = new T.Group(); bob.add(car); // attachée au poulet : elle suit le saut et la chute
    var cone = new T.Mesh(new T.ConeGeometry(0.2, 1.4, 32, 6), mCar); cone.rotation.z = -PI / 2; cone.position.x = 0.7; cone.castShadow = true; car.add(cone);
    for (var r = 0; r < 4; r++) { var ring = new T.Mesh(new T.TorusGeometry(0.17 - r * 0.035, 0.012, 6, 24), M(0xb84a00, 0.7)); ring.rotation.y = PI / 2; ring.position.x = 0.2 + r * 0.25; car.add(ring); }
    var leaves = new T.Group(); car.add(leaves);
    [[0.5, 0.2], [0.15, -0.25], [-0.25, 0.3], [-0.45, -0.15], [0.05, 0.5]].forEach(function (q) {
      var g = new T.Group(); g.rotation.set(q[1], 0, q[0] + PI); leaves.add(g);
      var stem = new T.Mesh(new T.CylinderGeometry(0.025, 0.03, 0.7, 8), mLeaf); stem.position.y = 0.35; stem.castShadow = true; g.add(stem);
      for (var k = 0; k < 3; k++) { var lf = ball(0.08, mLeaf, 0.6, 1.4, 0.3, (k % 2 ? 0.07 : -0.07), 0.35 + k * 0.15, 0); lf.rotation.z = k % 2 ? -0.6 : 0.6; g.add(lf); }
    });
    // étoiles de la PLS
    var shp = new T.Shape(); for (var k = 0; k < 10; k++) { var ra = k % 2 ? 0.07 : 0.17, an = PI / 2 + k * PI / 5; if (k) shp.lineTo(Math.cos(an) * ra, Math.sin(an) * ra); else shp.moveTo(Math.cos(an) * ra, Math.sin(an) * ra); }
    var starG = new T.ExtrudeGeometry(shp, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2 }); starG.center();
    var stars = []; for (var k = 0; k < 5; k++) { var st2 = new T.Mesh(starG, mStar); st2.visible = false; S.add(st2); stars.push(st2); }

    var BUTT = new T.Vector3(-1.52, 1.3, 0), DIR = new T.Vector3(1, -0.12, 0).normalize();
    var P0 = new T.Vector3(-2.6, 7.6, 1.0), P1 = new T.Vector3(-3.3, 2.0, 0.8), END = BUTT.clone().addScaledVector(DIR, -1.05), IN = BUTT.clone().addScaledVector(DIR, -0.12);
    var X = new T.Vector3(1, 0, 0), tmp = new T.Vector3(), q = new T.Quaternion(), UP = new T.Vector3(0, 1, 0), hw = new T.Vector3();

    function bez(t, out) { var a = 1 - t; return out.set(0, 0, 0).addScaledVector(P0, a * a).addScaledVector(P1, 2 * a * t).addScaledVector(END, t * t); }
    function frame(now) {
      var t = (now - t0) / 1000;
      // carotte
      if (t < 1.4) {
        var u = seg(t, 0, 1.4); u = u * (0.55 + 0.45 * u); bez(u, car.position);
        bez(Math.min(1, u + 0.02), tmp); tmp.sub(car.position).normalize(); if (u > 0.9) tmp.lerp(DIR, (u - 0.9) * 10).normalize();
        car.quaternion.setFromUnitVectors(X, tmp);
      } else {
        car.position.lerpVectors(END, IN, easeIn(seg(t, 1.4, 1.5)));
        car.quaternion.setFromUnitVectors(X, DIR);
        leaves.rotation.x = t < 6 ? Math.sin(t * 50) * 0.18 * (1 - seg(t, 4.5, 6)) : 0;
      }
      // poule : respiration, choc, saut, tremblement
      var sq = 1 + Math.sin(t * 9) * 0.015, jump = 0;
      if (t > 1.4 && t < 2.1) { var h = seg(t, 1.4, 2.1); sq = 1 - Math.sin(h * PI * 3) * 0.16 * (1 - h); jump = Math.sin(seg(t, 1.45, 1.95) * PI) * 0.7; }
      bob.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6); bob.position.y = jump;
      bob.position.x = (t > 1.8 && t < 3.5) ? (Math.random() - 0.5) * 0.05 : 0; bob.position.z = (t > 1.8 && t < 3.5) ? (Math.random() - 0.5) * 0.05 : 0;
      // la tête se retourne pour voir arriver la carotte
      var look = seg(t, 0.5, 0.8) * (1 - seg(t, 1.38, 1.5));
      head.rotation.y = -1.0 * easeOut(look); head.rotation.z = (t > 1.48 && t < 3.3) ? 0.25 + Math.sin(t * 40) * 0.04 : 0;
      // ailes qui battent
      var flap = (t > 1.45 && t < 3.1) ? 0.1 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2 * PI * 7.5)) : 0.05 * Math.sin(t * 3);
      if (t > 3.5) flap = 0.25 + 0.08 * Math.sin(t * 2.5); // ailes écartées une fois par terre
      wings.forEach(function (w) { w.g.rotation.x = -flap * w.s; w.g.rotation.z = flap * 0.3; });
      // bec
      var open = 0;
      if (t > 1.48 && t < 2.6) open = 0.2 + 0.4 * Math.abs(Math.sin(t * 2 * PI * 5));
      else if (t > 2.75 && t < 3.4) open = 0.15 + 0.35 * Math.abs(Math.sin(t * 2 * PI * 3.2));
      else if (t > 3.9) open = 0.35;
      jaw.rotation.z = -open;
      // yeux : sortent à 1,8 s, rentrent à 3,5 s
      var ext = t < 1.8 ? 0 : t < 3.5 ? 0.8 * back(seg(t, 1.8, 2.15)) : 0.8 * (1 - easeOut(seg(t, 3.5, 3.65)));
      var sc2 = 1 + ext * 1.0;
      eyes.forEach(function (e) {
        e.g.position.copy(e.base).addScaledVector(e.dir, ext); e.g.scale.setScalar(sc2);
        var pd;
        if (t > 3.6) { var a = t * 9 * e.s; pd = tmp.set(0.16, Math.sin(a) * 0.1, 0.06 * e.s + Math.cos(a) * 0.1); }
        else if (look > 0.5) pd = tmp.set(-0.05, 0.02, 0.19 * e.s);
        else if (ext > 0.1) pd = tmp.set(0.12, 0.0, 0.16 * e.s);
        else pd = tmp.set(0.17, 0.02, 0.1 * e.s);
        pd.normalize().multiplyScalar(0.165); e.pup.position.copy(pd); e.hl.position.copy(pd).multiplyScalar(1.12).add(hw.set(0.02, 0.04, 0.02 * e.s));
        if (ext > 0.05) { e.st.visible = true; e.st.position.copy(e.base).addScaledVector(e.dir, ext / 2); e.st.quaternion.setFromUnitVectors(UP, e.dir); e.st.scale.set(1, ext, 1); } else e.st.visible = false;
      });
      // chute sur le côté, pattes en l’air
      var f = bounce(seg(t, 3.5, 4.1));
      fall.rotation.x = PI / 2 * f; fall.position.set(-0.35 * f, 0, 0.95 - 1.5 * f);
      legs.forEach(function (L, k) { L.rotation.z = t > 4.1 ? Math.sin(t * 22 + k * 2) * 0.25 * (1 - seg(t, 5.2, 6.5)) : 0; });
      // étoiles qui tournent autour de la tête
      if (t > 4.0) { head.getWorldPosition(hw); var gs = easeOut(seg(t, 4.0, 4.3)); stars.forEach(function (s, k) { // couronne d’étoiles qui tourne au-dessus de la tête
        s.visible = true; var a = t * 3.2 + k * 2 * PI / 5; s.position.set(hw.x + 0.25 + Math.cos(a) * 0.62, hw.y + 1.0 + Math.sin(a * 3) * 0.05, hw.z + Math.sin(a) * 0.62);
        s.rotation.set(0, -a, Math.sin(t * 6 + k) * 0.3); s.scale.setScalar(gs * (1 + Math.sin(t * 9 + k * 1.7) * 0.18)); }); }
      R.render(S, cam);
    }
    var started = false, raf = 0;
    function loop(now) {
      if (box.isConnected) started = true;
      if (started && !box.isConnected) { cancelAnimationFrame(raf); try { R.dispose(); R.forceContextLoss(); } catch (e) {} return; }
      var w2 = box.clientWidth, h2 = box.clientHeight; if (w2 && h2 && (w2 !== W || h2 !== H)) { W = w2; H = h2; R.setSize(W, H); cam.aspect = W / H; aim(); cam.updateProjectionMatrix(); }
      frame(performance.now()); raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }
  // ---------- l'âne : braie deux fois, rue, reçoit le bonnet d'âne ----------
  function ane(box, t0, onFail) {
    var T = window.THREE; if (!T) { onFail && onFail(); return; }
    var W = box.clientWidth || innerWidth, H = box.clientHeight || innerHeight * 0.7, R;
    try { R = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { onFail && onFail(); return; }
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.setSize(W, H);
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    if ('outputColorSpace' in R) R.outputColorSpace = T.SRGBColorSpace;
    box.appendChild(R.domElement);
    var S = new T.Scene(), cam = new T.PerspectiveCamera(30, W / H, 0.1, 100);
    function aim() { var th = Math.tan(15 * PI / 180), d = Math.max(10.5, 3.0 / (th * (W / H))); cam.position.set(0.6, 2.9 + d * 0.06, d); cam.lookAt(0.1, 2.65, 0); }
    aim();
    S.add(new T.HemisphereLight(0xfff3e2, 0x4a3426, 1.25));
    var sun = new T.DirectionalLight(0xffffff, 2.3); sun.position.set(3, 7, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 6; sc.bottom = -5; sc.near = 1; sc.far = 20; sun.shadow.radius = 5; sun.shadow.bias = -0.0005; S.add(sun);
    var rim = new T.DirectionalLight(0xffd9a8, 0.9); rim.position.set(-5, 3, -4); S.add(rim);
    var gr = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({ opacity: 0.45 })); gr.rotation.x = -PI / 2; gr.receiveShadow = true; S.add(gr);
    var tex = clayTex(T);
    function M(c, r, noBump) { return new T.MeshStandardMaterial({ color: c, roughness: r == null ? 0.82 : r, metalness: 0, bumpMap: noBump ? null : tex, bumpScale: noBump ? 0 : 0.6 }); }
    var mGrey = M(0x8e8782), mLight = M(0xddd5ca), mDark = M(0x3b3430), mHoof = M(0x2a2420, 0.6), mPink = M(0xe8a3a0, 0.8), mMouth = M(0x6e1420, 0.7, true), mTeeth = M(0xfff8e6, 0.3, true),
      mEye = M(0xffffff, 0.25, true), mPup = M(0x111111, 0.2, true), mCap = M(0xf5efe0, 0.7), mBand = M(0xd4a52c, 0.4), mPom = M(0xd8232c, 0.6);
    function ball(r, m, sx, sy, sz, x, y, z) { var o = new T.Mesh(new T.SphereGeometry(r, 48, 32), m); o.scale.set(sx || 1, sy || 1, sz || 1); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; }
    function cyl(r1, r2, h, m, x, y, z) { var o = new T.Mesh(new T.CylinderGeometry(r1, r2, h, 20), m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; return o; }

    var root = new T.Group(); root.rotation.y = -0.55; root.position.x = -0.35; S.add(root);       // trois-quarts face
    var bob = new T.Group(); root.add(bob);
    bob.add(ball(1, mGrey, 1.35, 0.78, 0.72, -0.1, 1.75, 0));            // corps
    bob.add(ball(0.8, mLight, 1.3, 0.5, 0.75, -0.05, 1.42, 0));          // ventre clair
    var legs = [];
    [[0.75, 0.33], [0.75, -0.33], [-0.95, 0.33], [-0.95, -0.33]].forEach(function (q, k) {
      var L = new T.Group(); L.position.set(q[0], 1.45, q[1]); bob.add(L); legs.push(L);
      L.add(cyl(0.15, 0.12, 1.25, mGrey, 0, -0.62, 0)); L.add(cyl(0.14, 0.16, 0.2, mHoof, 0, -1.33, 0));
    });
    var tail = new T.Group(); tail.position.set(-1.42, 2.0, 0); bob.add(tail);
    var tl = cyl(0.04, 0.05, 0.75, mGrey, 0, -0.35, 0); tail.add(tl); tail.add(ball(0.13, mDark, 0.8, 1.6, 0.8, 0, -0.78, 0)); tail.rotation.z = -0.35;
    // cou + tête (pivot à l’épaule : la tête se lève pour braire)
    var neck = new T.Group(); neck.position.set(0.95, 2.05, 0); bob.add(neck);
    var nk = ball(0.48, mGrey, 0.8, 1.45, 0.72, 0.28, 0.42, 0); nk.rotation.z = -0.55; neck.add(nk);
    for (var k = 0; k < 6; k++) neck.add(ball(0.11, mDark, 1, 1.3, 0.7, -0.08 + k * 0.1, 0.18 + k * 0.17, 0));   // crinière
    var head = new T.Group(); head.position.set(0.55, 1.05, 0); neck.add(head);
    head.add(ball(0.46, mGrey, 1.05, 0.95, 0.88, 0, 0, 0));               // crâne
    var snout = new T.Group(); snout.position.set(0.42, -0.3, 0); snout.rotation.z = -0.5; head.add(snout);
    snout.add(ball(0.32, mGrey, 1.45, 0.95, 0.9, 0.15, 0, 0));
    snout.add(ball(0.33, mLight, 0.95, 0.85, 0.92, 0.48, 0.02, 0));      // museau clair
    [1, -1].forEach(function (s) { snout.add(ball(0.06, mDark, 1, 0.6, 0.6, 0.74, 0.1, 0.13 * s)); });
    snout.add(ball(0.24, mMouth, 1.2, 0.7, 0.8, 0.42, -0.2, 0));         // intérieur de la bouche
    for (var k = 0; k < 4; k++) { var th1 = new T.Mesh(new T.BoxGeometry(0.07, 0.11, 0.09), mTeeth); th1.position.set(0.66, -0.2, -0.13 + k * 0.087); snout.add(th1); }   // dents du haut
    var jaw = new T.Group(); jaw.position.set(0.05, -0.18, 0); snout.add(jaw);
    jaw.add(ball(0.26, mLight, 1.7, 0.45, 0.82, 0.38, -0.06, 0));
    for (var k = 0; k < 4; k++) { var th2 = new T.Mesh(new T.BoxGeometry(0.07, 0.09, 0.08), mTeeth); th2.position.set(0.68, 0.02, -0.12 + k * 0.08); jaw.add(th2); }
    var ears = [];
    [1, -1].forEach(function (s) {
      var E = new T.Group(); E.position.set(-0.1, 0.35, 0.2 * s); head.add(E);
      var e1 = ball(0.15, mGrey, 1, 3.4, 0.55, 0, 0.45, 0); E.add(e1); var e2 = ball(0.09, mPink, 1, 3.6, 0.4, 0.04, 0.45, 0.05 * s); E.add(e2);
      E.add(ball(0.06, mDark, 1, 1.4, 0.6, 0, 0.92, 0));
      E.rotation.x = 0.35 * s; ears.push({ g: E, s: s });
    });
    head.add(ball(0.12, mDark, 1.3, 0.8, 0.9, -0.05, 0.42, 0));          // toupet
    var eyes = [];
    [1, -1].forEach(function (s) {
      var e = new T.Group(); e.position.set(0.22, 0.12, 0.36 * s); head.add(e);
      e.add(ball(0.15, mEye, 1, 1.15, 0.9)); var p = ball(0.07, mPup); e.add(p); var hl = ball(0.025, mEye); e.add(hl);
      var lid = ball(0.155, mGrey, 1.02, 0.6, 0.93, 0, 0.12, 0); e.add(lid);
      eyes.push({ g: e, p: p, hl: hl, lid: lid, s: s });
    });
    // le bonnet d’âne
    var cap = new T.Group(); head.add(cap);
    var cone = new T.Mesh(new T.ConeGeometry(0.34, 1.25, 32), mCap); cone.position.y = 0.62; cone.castShadow = true; cap.add(cone);
    var band = new T.Mesh(new T.TorusGeometry(0.33, 0.05, 10, 32), mBand); band.rotation.x = PI / 2; band.position.y = 0.06; cap.add(band);
    for (var k = 0; k < 3; k++) { var b2 = new T.Mesh(new T.TorusGeometry(0.25 - k * 0.07, 0.025, 8, 28), mBand); b2.rotation.x = PI / 2; b2.position.y = 0.36 + k * 0.28; cap.add(b2); }
    cap.add(ball(0.11, mPom, 1, 1, 1, 0, 1.28, 0));
    cap.visible = false;
    var tmp = new T.Vector3();

    function bray(t, a, b) { var x = seg(t, a, b); return x > 0 && x < 1 ? Math.sin(Math.min(1, x * 4) * PI / 2) * (1 - seg(t, b - 0.12, b)) : 0; }
    function frame(now) {
      var t = (now - t0) / 1000;
      // deux braiments : 0,5–1,7 s et 2,4–3,75 s
      var b1 = bray(t, 0.5, 1.7), b2 = bray(t, 2.4, 3.75), br = Math.max(b1, b2);
      var hi1 = t > 0.5 && t < 0.85, hi2 = t > 2.4 && t < 2.8;     // le « hi » : bouche moins ouverte
      neck.rotation.z = 0.15 + br * 0.75;                            // la tête se lève
      head.rotation.z = br * 0.15;
      var open = br * ((hi1 || hi2) ? 0.35 : 0.85) * (0.85 + 0.15 * Math.sin(t * 60));
      jaw.rotation.z = -open;
      ears.forEach(function (e, k) { e.g.rotation.z = -0.25 - br * (0.6 + 0.35 * Math.sin(t * 22 + k * 1.5)) + Math.sin(t * 2 + k) * 0.05; e.g.rotation.x = (0.35 + br * 0.4) * e.s; });
      bob.position.x = br > 0.2 ? (Math.random() - 0.5) * 0.04 : 0; bob.position.y = 0;
      // ruade pendant le 2e « haaan »
      var kick = Math.sin(seg(t, 2.95, 3.45) * PI);
      bob.rotation.z = -kick * 0.22; bob.position.y = kick * 0.12;
      legs[2].rotation.z = -kick * 1.1; legs[3].rotation.z = -kick * 0.9;
      legs[0].rotation.z = kick * 0.15; legs[1].rotation.z = kick * 0.15;
      tail.rotation.z = -0.35 + Math.sin(t * (br > 0.2 ? 14 : 3)) * (br > 0.2 ? 0.5 : 0.12) - kick * 0.8;
      // le bonnet d’âne tombe du ciel à 4,0 s et atterrit à 4,45 s
      if (t > 4.0) {
        cap.visible = true; var f = seg(t, 4.0, 4.45), y = 0.42 + (1 - f * f) * 6.5, sq = 1;
        if (t > 4.45) { var h2 = seg(t, 4.45, 4.85); sq = 1 - Math.sin(h2 * PI * 2) * 0.15 * (1 - h2); }
        cap.position.set(-0.05, y, 0); cap.rotation.z = 0.18 + (1 - f) * 2.5; cap.scale.set(1 / sq, sq, 1 / sq);
        if (t > 4.45) head.position.y = 1.05 - Math.sin(seg(t, 4.45, 4.7) * PI) * 0.12;
      }
      // yeux : clignent, se plissent en braillant, louchent vers le bonnet
      eyes.forEach(function (e) {
        var px = 0.11, py = 0.0, pz = 0.08 * e.s;
        if (t > 4.45) { px = 0.06; py = 0.11; pz = -0.06 * e.s; }
        else if (br > 0.3) { py = 0.06; }
        e.p.position.set(px, py, pz).normalize().multiplyScalar(0.135); e.hl.position.copy(e.p.position).multiplyScalar(1.1).add(tmp.set(0.02, 0.03, 0.01 * e.s));
        var blink = (t % 2.7 > 2.6 && br < 0.2) ? 1 : 0, sq2 = br > 0.4 ? 0.55 : 0;
        e.lid.position.y = 0.12 - Math.max(blink * 0.12, sq2 * 0.07); e.lid.scale.y = 0.6 + Math.max(blink, sq2) * 0.5;
      });
      R.render(S, cam);
    }
    var started = false, raf = 0;
    function loop() {
      if (box.isConnected) started = true;
      if (started && !box.isConnected) { cancelAnimationFrame(raf); try { R.dispose(); R.forceContextLoss(); } catch (e) {} return; }
      var w2 = box.clientWidth, h2 = box.clientHeight; if (w2 && h2 && (w2 !== W || h2 !== H)) { W = w2; H = h2; R.setSize(W, H); cam.aspect = W / H; aim(); cam.updateProjectionMatrix(); }
      frame(performance.now()); raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }
  // ---------- le loup à poils : all-in, « je m'en fous, je call, j'ai 30 % », perd tout, hurle à la lune ----------
  function loup(box, t0, onFail, env) {
    var T = window.THREE; if (!T) { onFail && onFail(); return; }
    var W = box.clientWidth || innerWidth, H = box.clientHeight || innerHeight * 0.7, R;
    try { R = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { onFail && onFail(); return; }
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.setSize(W, H);
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    if ('outputColorSpace' in R) R.outputColorSpace = T.SRGBColorSpace;
    R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.1;
    box.appendChild(R.domElement);
    var S = new T.Scene(), cam = new T.PerspectiveCamera(30, W / H, 0.1, 100);
    try { // petite pièce lumineuse pour les reflets (yeux brillants, truffe)
      var pm = new T.PMREMGenerator(R), es = new T.Scene(), room = new T.Mesh(new T.BoxGeometry(12, 8, 12), new T.MeshBasicMaterial({ color: 0x3a3632, side: T.BackSide })); es.add(room);
      [[0, 3.9, 0, 6, 0.1, 6, 3], [-5.9, 1, 1, 0.1, 3, 4, 1.6], [5.9, 1.5, -1, 0.1, 2, 3, 1.2], [0, 1, 5.9, 4, 2, 0.1, 1.4]].forEach(function (q) { var m = new T.Mesh(new T.BoxGeometry(q[3], q[4], q[5]), new T.MeshBasicMaterial({ color: new T.Color(q[6], q[6], q[6] * 0.95) })); m.position.set(q[0], q[1], q[2]); es.add(m); });
      S.environment = pm.fromScene(es, 0.04).texture;
    } catch (e) {}
    function aim() { var th = Math.tan(15 * PI / 180), d = Math.max(9, 2.05 / (th * (W / H))); cam.position.set(0.9, 3.4 + d * 0.1, d + 1); cam.lookAt(-0.2, 2.15, 0.5); }
    aim();
    var hemi = new T.HemisphereLight(0xfff3e2, 0x4a3426, 1.25); S.add(hemi);
    var sun = new T.DirectionalLight(0xffffff, 2.3); sun.position.set(3, 7, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 6; sc.bottom = -5; sc.near = 1; sc.far = 25; sun.shadow.radius = 5; sun.shadow.bias = -0.0005; S.add(sun);
    var rim = new T.DirectionalLight(0xffd9a8, 0.9); rim.position.set(-5, 3, -4); S.add(rim);
    var moonL = new T.DirectionalLight(0x9fb8ff, 0); moonL.position.set(-4, 6, -2); S.add(moonL);
    var gr = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({ opacity: 0.45 })); gr.rotation.x = -PI / 2; gr.receiveShadow = true; S.add(gr);
    var tex = clayTex(T);
    function M(c, r, noBump) { return new T.MeshStandardMaterial({ color: c, roughness: r == null ? 0.82 : r, metalness: 0, bumpMap: noBump ? null : tex, bumpScale: noBump ? 0 : 0.6 }); }
    var mFur = M(0xb98c5a), mBack = M(0x8a7764), mCream = M(0xf1e3c8), mDark = M(0x3a2a1e), mNose = M(0x1a1412, 0.35, true), mMouth = M(0x6e1420, 0.7, true), mTeeth = M(0xfff8e6, 0.3, true),
      mEye = M(0xffffff, 0.25, true), mIris = M(0xe0a020, 0.35, true), mPup = M(0x111111, 0.2, true), mFelt = M(0x1f6b3a, 0.95), mWood = M(0x6b3e1e, 0.6), mPink = M(0xe8a3a0, 0.8),
      mMoon = new T.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff0b0, emissiveIntensity: 1.1, roughness: 0.9 });
    var chipMats = [M(0xd8232c, 0.45, true), M(0x2457c9, 0.45, true), M(0x1b1b1b, 0.45, true), M(0xf2f2f2, 0.45, true)], mStripe = M(0xffffff, 0.4, true);
    function ball(r, m, sx, sy, sz, x, y, z) { var o = new T.Mesh(new T.SphereGeometry(r, 48, 32), m); o.scale.set(sx || 1, sy || 1, sz || 1); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; }
    function cyl(r1, r2, h, m, x, y, z) { var o = new T.Mesh(new T.CylinderGeometry(r1, r2, h, 24), m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; }

    // table de poker
    var table = new T.Group(); table.position.set(0, 0, 1.0); S.add(table);
    table.add(cyl(1.0, 1.0, 0.1, mFelt, 0, 1.0, 0));
    var rail = new T.Mesh(new T.TorusGeometry(1.02, 0.09, 14, 64), M(0x2a1a12, 0.45)); rail.rotation.x = PI / 2; rail.position.y = 1.06; rail.castShadow = true; table.add(rail);
    table.add(cyl(1.06, 0.98, 0.1, mWood, 0, 0.94, 0));
    var line = new T.Mesh(new T.TorusGeometry(0.72, 0.008, 6, 64), M(0xd9c27a, 0.5, true)); line.rotation.x = PI / 2; line.position.y = 1.052; table.add(line);
    table.add(cyl(0.12, 0.2, 0.9, mWood, 0, 0.45, 0)); table.add(cyl(0.45, 0.5, 0.06, mWood, 0, 0.03, 0));
    // ---- le loup, avec du vrai poil (technique des « coquilles » : couches de mèches superposées) ----
    function strandTex() { var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'), im = g.createImageData(256, 256), d = im.data;
      for (var i = 0; i < d.length; i += 4) { var v = Math.pow(Math.random(), 0.7) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } g.putImageData(im, 0, 0);
      var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; return t; }
    var STR = strandTex(), NL = 11;
    function furMat(col, h, len, rep) {
      var m = new T.MeshStandardMaterial({ color: col, roughness: 0.95, metalness: 0 });
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uH = { value: h }; sh.uniforms.uLen = { value: len }; sh.uniforms.uTex = { value: STR }; sh.uniforms.uRep = { value: rep };
        sh.vertexShader = 'uniform float uH; uniform float uLen; uniform vec2 uRep; varying vec2 vFu;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * uLen * uH; transformed.y -= uLen * uH * uH * 0.6; vFu = uv * uRep;');
        sh.fragmentShader = 'uniform float uH; uniform sampler2D uTex; varying vec2 vFu;\n' + sh.fragmentShader
          .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n float fn = texture2D(uTex, vFu).r; if (uH > 0.0 && fn < uH) discard;')
          .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= mix(0.35, 1.0, uH) * (0.78 + 0.35 * fn);');
      };
      m.customProgramCacheKey = function () { return 'fur'; };
      return m;
    }
    function shortFur(r, col, sx, sy, sz, x, y, z) { // poil ras (museau) : une seule surface au grain fin
      var m = new T.MeshStandardMaterial({ color: col, roughness: 0.95, bumpMap: STR, bumpScale: 0.4 }); var o = new T.Mesh(new T.SphereGeometry(r, 48, 32), m);
      o.scale.set(sx || 1, sy || 1, sz || 1); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o;
    }
    function furBall(r, col, len, sx, sy, sz, x, y, z, rep) { // sphère + couches de poil
      var geo = new T.SphereGeometry(r, 36, 22), g = new T.Group(); g.scale.set(sx || 1, sy || 1, sz || 1); g.position.set(x || 0, y || 0, z || 0);
      var base = new T.Mesh(geo, furMat(col, 0, len, rep || new T.Vector2(40, 22))); base.castShadow = true; base.receiveShadow = true; g.add(base);
      for (var i = 1; i <= NL; i++) { var l = new T.Mesh(geo, furMat(col, i / NL, len, rep || new T.Vector2(40, 22))); g.add(l); }
      return g;
    }
    function furCone(r, h, col, len, sz, rep) { var geo = new T.ConeGeometry(r, h, 28, 4), g = new T.Group(); g.scale.z = sz || 1;
      var base = new T.Mesh(geo, furMat(col, 0, len, rep || new T.Vector2(20, 8))); base.castShadow = true; g.add(base);
      for (var i = 1; i <= NL; i++) g.add(new T.Mesh(geo, furMat(col, i / NL, len, rep || new T.Vector2(20, 8))));
      return g; }
    function G(col, r) { return new T.MeshPhysicalMaterial({ color: col, roughness: r == null ? 0.12 : r, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 }); }
    var cBack = 0x45474d, cGrey = 0x7d8087, cLight = 0xa9a6a0, cCream = 0xd2c8b6, cMuz = 0x5f6168,
      gNose = G(0x141416, 0.2), gIris = G(0xe0a020, 0.08), gPup = G(0x0a0a0c, 0.05), gWhite = G(0xffffff, 0.05), mLine = new T.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.6 }),
      mMouth = new T.MeshStandardMaterial({ color: 0x5e1420, roughness: 0.7 }), mTongue = new T.MeshStandardMaterial({ color: 0xd9606e, roughness: 0.45 }), mFang = new T.MeshStandardMaterial({ color: 0xfbf6ea, roughness: 0.35 });
    function ball2(r, m, sx, sy, sz, x, y, z) { var o = new T.Mesh(new T.SphereGeometry(r, 48, 32), m); o.scale.set(sx || 1, sy || 1, sz || 1); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; }
    var root = new T.Group(); root.rotation.y = 0.6; S.add(root);
    var bob = new T.Group(); root.add(bob);
    // corps assis : dos foncé, flancs gris, poitrail crème ébouriffé
    bob.add(furBall(0.8, cGrey, 0.09, 0.95, 1.15, 0.9, 0, 1.36, -0.08));
    bob.add(furBall(0.62, cBack, 0.1, 0.9, 1.1, 0.7, 0, 1.6, -0.35));
    bob.add(furBall(0.45, cCream, 0.1, 0.8, 1.15, 0.5, 0, 1.4, 0.38));
    bob.add(furBall(0.34, cLight, 0.12, 1.1, 0.75, 0.7, 0, 2.04, 0.28));           // jabot sous le cou
    [1, -1].forEach(function (s) {
      bob.add(furBall(0.42, cGrey, 0.08, 0.9, 0.85, 1.15, 0.52 * s, 0.48, 0.0));
      bob.add(furBall(0.19, cLight, 0.04, 0.95, 0.6, 1.5, 0.58 * s, 0.13, 0.45));
    });
    var tail = new T.Group(); tail.position.set(-0.55, 0.45, -0.5); bob.add(tail);
    tail.add(furBall(0.24, cGrey, 0.12, 1, 1, 2.0, 0, 0.05, -0.38)); tail.add(furBall(0.26, cBack, 0.13, 1, 1, 1.7, -0.22, 0.1, -0.82)); tail.add(furBall(0.17, 0x2c2d31, 0.1, 1, 1, 1.4, -0.36, 0.13, -1.15));
    tail.rotation.y = 0.9;
    var arms = [];
    [1, -1].forEach(function (s) {
      var A = new T.Group(); A.position.set(0.55 * s, 1.85, 0.18); bob.add(A);
      A.add(furBall(0.15, cGrey, 0.05, 1, 2.6, 1, 0, -0.38, 0));
      A.add(furBall(0.15, cLight, 0.04, 1.05, 0.8, 1.2, 0, -0.78, 0.04));
      A.rotation.x = -0.75; A.rotation.z = 0.08 * s; arms.push(A);
    });
    // tête de loup : crâne, joues ébouriffées, long museau
    var head = new T.Group(); head.position.set(0, 2.62, 0.1); bob.add(head);
    head.add(furBall(0.5, cGrey, 0.07, 1.02, 0.9, 1.0));
    head.add(furBall(0.36, cBack, 0.06, 0.95, 0.55, 0.85, 0, 0.26, -0.08));
    [1, -1].forEach(function (s) { head.add(furBall(0.22, cLight, 0.09, 0.85, 0.9, 0.8, 0.34 * s, -0.14, 0.05)); });
    var snout = new T.Group(); snout.position.set(0, -0.12, 0.38); head.add(snout);
    snout.add(shortFur(0.21, 0x5c5e65, 0.95, 0.78, 2.0, 0, 0.02, 0.2));
        snout.add(ball2(0.14, mMouth, 0.85, 0.45, 1.8, 0, -0.1, 0.2));
    snout.add(ball2(0.08, mTongue, 1, 0.4, 2.2, 0, -0.14, 0.3));
    [1, -1].forEach(function (s) { var f = new T.Mesh(new T.ConeGeometry(0.025, 0.07, 12), mFang); f.rotation.x = PI; f.position.set(0.075 * s, -0.09, 0.5); snout.add(f); });
    snout.add(ball2(0.075, gNose, 1.35, 0.85, 1.0, 0, 0.09, 0.6));
    var jaw = new T.Group(); jaw.position.set(0, -0.1, 0.0); snout.add(jaw);
    jaw.add(shortFur(0.165, 0x8d8a83, 0.95, 0.5, 1.95, 0, 0.0, 0.18));
    var ears = [];
    [1, -1].forEach(function (s) {
      var E = new T.Group(); E.position.set(0.3 * s, 0.36, -0.06); head.add(E);
      var e1 = furCone(0.19, 0.5, cBack, 0.03, 0.45); e1.position.y = 0.22; E.add(e1);
      var e2 = new T.Mesh(new T.ConeGeometry(0.11, 0.32, 32), new T.MeshStandardMaterial({ color: 0x3a3236, roughness: 0.9 })); e2.position.set(0, 0.19, 0.05); e2.scale.z = 0.3; E.add(e2);
      E.rotation.z = -0.28 * s; ears.push({ g: E, s: s });
    });
    // yeux ambrés en amande, cerclés de noir
    var eyes = [];
    [1, -1].forEach(function (s) {
      var e = new T.Group(); e.position.set(0.2 * s, 0.08, 0.44); e.rotation.set(0, 0.35 * s, -0.22 * s); head.add(e);
      e.add(ball2(0.105, mLine, 1.25, 0.75, 0.35, 0, 0, -0.01));
      var ir = ball2(0.088, gIris, 1.2, 0.72, 0.5); e.add(ir);
      var p = ball2(0.045, gPup, 1, 1, 0.6); e.add(p);
      var hl = ball2(0.016, gWhite); e.add(hl);
      var bg = new T.CapsuleGeometry(0.018, 0.12, 4, 8); bg.rotateZ(PI / 2); var brow = new T.Mesh(bg, mLine); brow.position.set(0, 0.11, 0.02); e.add(brow);
      var lid = ball2(0.11, new T.MeshStandardMaterial({ color: 0x55575d, roughness: 1, bumpMap: STR, bumpScale: 0.4 }), 1.25, 0.5, 0.7, 0, 0.07, -0.01); e.add(lid);
      eyes.push({ g: e, ir: ir, p: p, hl: hl, brow: brow, lid: lid, s: s });
    });
    // jetons de casino : dessus imprimé (encoches, anneau, valeur) et tranche rayée
    function chipTex(col, val) {
      var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
      g.fillStyle = col; g.beginPath(); g.arc(128, 128, 128, 0, 2 * PI); g.fill();
      g.fillStyle = '#fff'; for (var k = 0; k < 8; k++) { g.save(); g.translate(128, 128); g.rotate(k * PI / 4); g.fillRect(-14, -128, 28, 30); g.restore(); }
      g.strokeStyle = '#fff'; g.lineWidth = 5; g.setLineDash([10, 8]); g.beginPath(); g.arc(128, 128, 84, 0, 2 * PI); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(128, 128, 64, 0, 2 * PI); g.fill();
      g.fillStyle = col; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(val, 128, 132);
      var t = new T.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = T.SRGBColorSpace; return t;
    }
    function edgeTex(col) {
      var c = document.createElement('canvas'); c.width = 256; c.height = 16; var g = c.getContext('2d');
      g.fillStyle = col; g.fillRect(0, 0, 256, 16); g.fillStyle = '#fff'; for (var k = 0; k < 8; k++) g.fillRect(k * 32 + 8, 0, 14, 16);
      var t = new T.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = T.SRGBColorSpace; return t;
    }
    var CH = [['#c9161d', '5'], ['#1f4fc4', '10'], ['#178a3a', '25'], ['#161616', '100']].map(function (q) {
      var top = new T.MeshStandardMaterial({ map: chipTex(q[0], q[1]), roughness: 0.45 });
      return [new T.MeshStandardMaterial({ map: edgeTex(q[0]), roughness: 0.5 }), top, top];
    });
    var chips = [], tmp = new T.Vector3(), chipG = new T.CylinderGeometry(0.16, 0.16, 0.03, 40);
    [[-0.38, 0, 11], [0, 3, 13], [0.38, 1, 10], [-0.2, 2, 6], [0.2, 0, 7]].forEach(function (st, si) {
      var zz = si < 3 ? 0.42 : 0.72;
      for (var k = 0; k < st[2]; k++) {
        var c = new T.Group(), m = new T.Mesh(chipG, CH[st[1]]); m.castShadow = true; m.receiveShadow = true; c.add(m);
        var x0 = st[0] + (Math.random() - 0.5) * 0.012, y0 = 1.07 + k * 0.031, z0 = zz + (Math.random() - 0.5) * 0.012;
        c.position.set(x0, y0, z0); c.rotation.y = Math.random() * 6; S.add(c);
        chips.push({ g: c, x0: x0, y0: y0, z0: z0, ry: c.rotation.y, vx: (Math.random() - 0.5) * 6, vy: 3 + Math.random() * 4, vz: 1 + Math.random() * 3, rx: (Math.random() - 0.5) * 20, rz: (Math.random() - 0.5) * 20 });
      }
    });
    // la lune
    var moon = ball(0.5, mMoon, 1, 1, 1, -1.5, 4.6, -3); moon.castShadow = false; moon.visible = false; S.add(moon);

    function envAt(x) { if (!env || x < 0) return 0; var i = Math.floor(x / 0.03); return i < env.length ? (+env.charAt(i)) / 9 : 0; }
    function frame(now) {
      var t = (now - t0) / 1000;
      // poussée des jetons (0,8–1,4 s)
      var push = easeOut(seg(t, 0.8, 1.4)), back2 = seg(t, 1.5, 1.9);
      arms.forEach(function (A) { A.rotation.x = -0.75 - push * 0.75 * (1 - back2); });
      bob.rotation.x = push * 0.12 * (1 - back2);
      // voix : « Je m'en fous, je call, j'ai 30 % » (1,5 – 4,5 s), bouche synchronisée
      var v = envAt(t - 1.5), howl = seg(t, 6.0, 6.4) * (1 - seg(t, 10.2, 10.7));
      jaw.rotation.x = v * 0.45 + howl * (0.55 + Math.sin(t * 7) * 0.08);
      // tête : sûr de lui, puis abattu, puis hurle à la lune
      var smug = (t > 1.5 && t < 4.6) ? 1 : 0, sad = seg(t, 5.1, 5.5) * (1 - seg(t, 5.9, 6.3));
      head.rotation.x = -0.05 + smug * Math.sin(t * 3) * 0.04 + sad * 0.35 - howl * 0.85;
      head.rotation.z = smug * 0.12 + sad * 0.1;
      head.rotation.y = smug * 0.15 + howl * 0.25;
      ears.forEach(function (e) { e.g.rotation.z = (-0.3 - sad * 0.9 - howl * 0.2) * e.s; e.g.rotation.x = -sad * 0.4; });
      tail.rotation.y = 0.9 + (t < 4.6 ? Math.sin(t * 9) * 0.25 : 0) - sad * 0.5;
      tail.rotation.x = sad * 0.3;
      bob.position.y = -sad * 0.1;
      // yeux : malins (paupières mi-closes), écarquillés au buzz, tristes, fermés en hurlant
      eyes.forEach(function (e) {
        var lidDown = smug ? 0.55 : 0, shock = (t > 4.95 && t < 5.3) ? 1 : 0;
        if (sad > 0.3) lidDown = 0.35; if (howl > 0.5) lidDown = 1;
        if (shock) lidDown = 0;
        e.lid.position.y = 0.075 - lidDown * 0.06; e.lid.scale.y = 0.45 + lidDown * 0.35;
        e.brow.rotation.z = (smug ? -0.35 : sad > 0.3 ? 0.45 : 0) * e.s; e.brow.position.y = 0.18 + shock * 0.06 - (smug ? 0.02 : 0);
        var px = smug ? 0.04 * -e.s : 0, py = sad > 0.3 ? -0.05 : (shock ? 0 : 0);
        e.ir.position.set(px * 0.5, py * 0.5, 0.012); e.p.position.set(px * 0.6, py * 0.6, 0.03); e.hl.position.set(px * 0.6 + 0.025, py * 0.6 + 0.02, 0.05);
        var sc2 = shock ? 1.25 : 1; e.ir.scale.setScalar(shock ? 0.75 : 1); e.g.scale.setScalar(sc2);
      });
      // jetons : poussés au centre, puis s’envolent au buzz (5,0 s)
      var fly = t - 5.05;
      chips.forEach(function (c, i) {
        var dz = push * (1.0 - c.z0 + 0.35), dx = -c.x0 * push * 0.5;
        if (fly < 0) { c.g.position.set(c.x0 + dx, c.y0, c.z0 + dz); c.g.rotation.set(0, c.ry, 0); }
        else { var tt2 = Math.min(fly, 2.5); c.g.position.set(c.x0 + dx + c.vx * tt2, c.y0 + c.vy * tt2 - 4.9 * tt2 * tt2, c.z0 + dz + c.vz * tt2); c.g.rotation.set(c.rx * tt2, 0, c.rz * tt2); c.g.visible = c.g.position.y > -1; }
      });
      // la nuit tombe, la lune se lève
      var night = seg(t, 5.7, 6.3);
      moon.visible = night > 0; moon.scale.setScalar(Math.max(0.01, back(night)));
      hemi.intensity = 1.25 - night * 0.75; sun.intensity = 2.3 - night * 1.9; moonL.intensity = night * 1.6;
      R.render(S, cam);
    }
    var started = false, raf = 0;
    function loop() {
      if (box.isConnected) started = true;
      if (started && !box.isConnected) { cancelAnimationFrame(raf); try { R.dispose(); R.forceContextLoss(); } catch (e) {} return; }
      var w2 = box.clientWidth, h2 = box.clientHeight; if (w2 && h2 && (w2 !== W || h2 !== H)) { W = w2; H = h2; R.setSize(W, H); cam.aspect = W / H; aim(); cam.updateProjectionMatrix(); }
      frame(performance.now()); raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }
  // le bouchon de Lionel : une bouteille arrive, POP, le bouchon « Château Margot » atterrit sur la table,
  // fait non de la tête, « Non ! Là, c'est pas un call… c'est une relance ! », et envoie les jetons au milieu
  function bouchon(box, t0, onFail, env) {
    var T = window.THREE; if (!T) { onFail && onFail(); return; }
    var W = box.clientWidth || innerWidth, H = box.clientHeight || innerHeight * 0.7, R;
    try { R = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { onFail && onFail(); return; }
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.setSize(W, H);
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    if ('outputColorSpace' in R) R.outputColorSpace = T.SRGBColorSpace;
    R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.1;
    box.appendChild(R.domElement);
    var S = new T.Scene(), cam = new T.PerspectiveCamera(30, W / H, 0.1, 100);
    try { // petite pièce lumineuse pour les reflets (verre de la bouteille, yeux)
      var pm = new T.PMREMGenerator(R), es = new T.Scene(), room = new T.Mesh(new T.BoxGeometry(12, 8, 12), new T.MeshBasicMaterial({ color: 0x3a3632, side: T.BackSide })); es.add(room);
      [[0, 3.9, 0, 6, 0.1, 6, 3], [-5.9, 1, 1, 0.1, 3, 4, 1.6], [5.9, 1.5, -1, 0.1, 2, 3, 1.2], [0, 1, 5.9, 4, 2, 0.1, 1.4]].forEach(function (q) { var m = new T.Mesh(new T.BoxGeometry(q[3], q[4], q[5]), new T.MeshBasicMaterial({ color: new T.Color(q[6], q[6], q[6] * 0.95) })); m.position.set(q[0], q[1], q[2]); es.add(m); });
      S.environment = pm.fromScene(es, 0.04).texture;
    } catch (e) {}
    function aim() { var th = Math.tan(15 * PI / 180), d = Math.max(3.9, 1.15 / (th * (W / H))); cam.position.set(0.1, 1.15 + d * 0.3, 1.25 + d); cam.lookAt(0.02, 1.42, 1.1); }
    aim();
    var hemi = new T.HemisphereLight(0xfff3e2, 0x4a3426, 1.25); S.add(hemi);
    var sun = new T.DirectionalLight(0xffffff, 2.3); sun.position.set(3, 7, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 5; sc.bottom = -4; sc.near = 1; sc.far = 25; sun.shadow.radius = 5; sun.shadow.bias = -0.0005; S.add(sun);
    var rim = new T.DirectionalLight(0xffd9a8, 0.9); rim.position.set(-5, 3, -4); S.add(rim);
    var gr = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({ opacity: 0.45 })); gr.rotation.x = -PI / 2; gr.receiveShadow = true; S.add(gr);
    var tex = clayTex(T);
    function M(c, r, noBump) { return new T.MeshStandardMaterial({ color: c, roughness: r == null ? 0.82 : r, metalness: 0, bumpMap: noBump ? null : tex, bumpScale: noBump ? 0 : 0.6 }); }
    function ball(r, m, sx, sy, sz, x, y, z) { var o = new T.Mesh(new T.SphereGeometry(r, 40, 28), m); o.scale.set(sx || 1, sy || 1, sz || 1); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; }
    function cyl(r1, r2, h, m, x, y, z, seg) { var o = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 32), m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; }
    function canvasTex(c) { var t = new T.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
    var mFelt = M(0x1f6b3a, 0.95), mWood = M(0x6b3e1e, 0.6);

    // table de poker (la même que celle du loup)
    var table = new T.Group(); table.position.set(0, 0, 1.0); S.add(table);
    table.add(cyl(1.0, 1.0, 0.1, mFelt, 0, 1.0, 0, 64));
    var rail = new T.Mesh(new T.TorusGeometry(1.02, 0.09, 14, 64), M(0x2a1a12, 0.45)); rail.rotation.x = PI / 2; rail.position.y = 1.06; rail.castShadow = true; table.add(rail);
    table.add(cyl(1.06, 0.98, 0.1, mWood, 0, 0.94, 0, 64));
    var line = new T.Mesh(new T.TorusGeometry(0.72, 0.008, 6, 64), M(0xd9c27a, 0.5, true)); line.rotation.x = PI / 2; line.position.y = 1.052; table.add(line);
    table.add(cyl(0.12, 0.2, 0.9, mWood, 0, 0.45, 0)); table.add(cyl(0.45, 0.5, 0.06, mWood, 0, 0.03, 0));
    var TOP = 1.055;

    // le liège : grain, pores, marque gravée au fer « CHÂTEAU MARGOT »
    function corkCanvas(withText) { // liège vieilli, rougi par le vin vers le bas
      var c = document.createElement('canvas'); c.width = 1024; c.height = 512; var g = c.getContext('2d');
      g.fillStyle = '#ad8250'; g.fillRect(0, 0, 1024, 512);
      var i, x, y, r, gr;
      for (i = 0; i < 11000; i++) { x = Math.random() * 1024; y = Math.random() * 512; r = Math.random() * 2.4 + 0.4; var l = 120 + Math.random() * 85 | 0; g.fillStyle = 'rgba(' + l + ',' + (l * 0.72 | 0) + ',' + (l * 0.44 | 0) + ',0.55)'; g.fillRect(x, y, r, r); }
      for (i = 0; i < 40; i++) { x = Math.random() * 1024; y = Math.random() * 512; r = 30 + Math.random() * 70; gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(70,42,20,0.22)'); gr.addColorStop(1, 'rgba(70,42,20,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } // taches de vieillesse
      for (i = 0; i < 700; i++) { x = Math.random() * 1024; y = Math.random() * 512; r = Math.random() * 6 + 1.5; g.fillStyle = 'rgba(' + (45 + Math.random() * 35 | 0) + ',26,12,' + (0.4 + Math.random() * 0.45) + ')'; g.beginPath(); g.ellipse(x, y, r * (0.4 + Math.random() * 0.6), r, Math.random() * 3, 0, 2 * PI); g.fill(); }
      g.strokeStyle = 'rgba(50,28,12,0.45)'; g.lineWidth = 1.5; for (i = 0; i < 18; i++) { x = Math.random() * 1024; y = Math.random() * 512; g.beginPath(); g.moveTo(x, y); for (var k = 0; k < 4; k++) { x += (Math.random() - 0.5) * 40; y += 6 + Math.random() * 14; g.lineTo(x, y); } g.stroke(); } // petites fissures
      if (withText) {
        // le vin est remonté par le bas : bord irrégulier, plus foncé tout en bas
        gr = g.createLinearGradient(0, 512, 0, 360); gr.addColorStop(0, 'rgba(78,8,30,0.95)'); gr.addColorStop(0.45, 'rgba(112,18,44,0.75)'); gr.addColorStop(1, 'rgba(120,24,50,0)'); g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, 512); for (x = 0; x <= 1024; x += 16) g.lineTo(x, 392 + Math.sin(x * 0.021) * 18 + Math.sin(x * 0.057 + 1) * 10 + Math.random() * 6); g.lineTo(1024, 512); g.closePath(); g.fill();
        for (i = 0; i < 70; i++) { x = Math.random() * 1024; y = 300 + Math.random() * 140; r = 3 + Math.random() * 12; g.fillStyle = 'rgba(105,16,42,' + (0.25 + Math.random() * 0.35) + ')'; g.beginPath(); g.ellipse(x, y, r, r * (0.6 + Math.random() * 0.5), Math.random() * 3, 0, 2 * PI); g.fill(); } // éclaboussures
        var cx = 512; g.save(); g.fillStyle = 'rgba(48,20,8,0.92)'; g.strokeStyle = 'rgba(48,20,8,0.85)'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 105, 288); g.lineTo(cx + 105, 288); g.moveTo(cx - 105, 418); g.lineTo(cx + 105, 418); g.stroke();
        g.font = 'bold 44px Georgia, "DejaVu Serif", serif'; g.fillText('CHÂTEAU', cx, 324);
        g.font = 'bold 52px Georgia, "DejaVu Serif", serif'; g.fillText('MARGOT', cx, 380);
        g.font = '22px "DejaVu Sans", sans-serif'; g.fillText('★ ★ ★', cx, 440);
        g.restore();
      }
      return c;
    }
    var cc = corkCanvas(true), ccTop = corkCanvas(false);
    function bumpOf(c) { var b = document.createElement('canvas'); b.width = c.width; b.height = c.height; var g = b.getContext('2d'); g.filter = 'grayscale(1) contrast(1.6)'; g.drawImage(c, 0, 0); var t = new T.CanvasTexture(b); return t; }
    var mCorkSide = new T.MeshStandardMaterial({ map: canvasTex(cc), bumpMap: bumpOf(cc), bumpScale: 1.4, roughness: 0.92 });
    var mCorkTop = new T.MeshStandardMaterial({ map: canvasTex(ccTop), bumpMap: bumpOf(ccTop), bumpScale: 1.4, roughness: 0.92 });
    var wc = document.createElement('canvas'); wc.width = wc.height = 256; (function (g) { g.fillStyle = '#c99d68'; g.fillRect(0, 0, 256, 256); var gr2 = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr2.addColorStop(0, 'rgba(70,6,26,0.97)'); gr2.addColorStop(0.85, 'rgba(96,12,38,0.92)'); gr2.addColorStop(1, 'rgba(96,12,38,0.6)'); g.fillStyle = gr2; g.fillRect(0, 0, 256, 256); })(wc.getContext('2d'));
    var mCorkWine = new T.MeshStandardMaterial({ map: canvasTex(wc), roughness: 0.7 });
    var CR = 0.2, CH2 = 0.5;
    var cork = new T.Group(); S.add(cork);          // position / saut
    var body = new T.Group(); cork.add(body);        // écrasement, balancement
    var cm = new T.Mesh(new T.CylinderGeometry(CR, CR * 0.95, CH2, 72, 1, false, PI), [mCorkSide, mCorkTop, mCorkWine]);
    cm.position.y = CH2 / 2; cm.castShadow = true; cm.receiveShadow = true; body.add(cm);
    // le visage
    var mEye = M(0xffffff, 0.25, true), mPup = M(0x141414, 0.2, true), mLine = M(0x3b2210, 0.6, true), mMouth = M(0x5a1020, 0.7, true);
    var gWhite = new T.MeshBasicMaterial({ color: 0xffffff });
    var eyes = [];
    [1, -1].forEach(function (s) {
      var e = new T.Group(); e.position.set(0.078 * s, CH2 / 2 + 0.105, CR * 0.93); body.add(e);
      var w = ball(0.058, mEye, 1, 1.12, 0.55); e.add(w);
      var p = ball(0.028, mPup, 1, 1.1, 0.6, 0, 0, 0.028); e.add(p);
      var hl = new T.Mesh(new T.SphereGeometry(0.009, 12, 8), gWhite); hl.position.set(0.011, 0.013, 0.046); e.add(hl);
      var lid = ball(0.062, mCorkTop, 1.05, 0.62, 0.62, 0, 0.05, 0.004); e.add(lid);
      var bg = new T.CapsuleGeometry(0.011, 0.07, 4, 8); bg.rotateZ(PI / 2); var brow = new T.Mesh(bg, mLine); brow.position.set(0, 0.085, 0.03); e.add(brow);
      eyes.push({ g: e, p: p, hl: hl, lid: lid, brow: brow, s: s });
    });
    var mouth = new T.Group(); mouth.position.set(0, CH2 / 2 + 0.005, CR * 0.96); body.add(mouth);
    var mo = ball(0.045, mMouth, 1, 0.25, 0.35); mouth.add(mo);
    var lip = new T.Mesh(new T.TorusGeometry(0.045, 0.007, 8, 32), mLine); lip.scale.set(1, 0.25, 1); mouth.add(lip);

    // la bouteille (sans marque) : verre vert sombre, étiquette « Cuvée du club »
    var bottle = new T.Group(); S.add(bottle);
    var mGlass = new T.MeshPhysicalMaterial({ color: 0x173a22, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 });
    bottle.add(cyl(0.16, 0.16, 0.62, mGlass, 0, 0.31, 0, 48));
    var sh = ball(0.16, mGlass, 1, 0.75, 1, 0, 0.62, 0); bottle.add(sh);
    bottle.add(cyl(0.056, 0.06, 0.34, mGlass, 0, 0.86, 0, 32));
    var lipR = new T.Mesh(new T.TorusGeometry(0.058, 0.014, 10, 32), mGlass); lipR.rotation.x = PI / 2; lipR.position.y = 1.03; bottle.add(lipR);
    var lc = document.createElement('canvas'); lc.width = 512; lc.height = 256; (function (g) {
      g.fillStyle = '#f3e7c9'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#b8902f'; g.lineWidth = 8; g.strokeRect(150, 18, 212, 220); g.lineWidth = 2; g.strokeRect(160, 28, 192, 200);
      g.fillStyle = '#6e1a2a'; g.textAlign = 'center'; g.font = 'italic bold 34px Georgia, "DejaVu Serif", serif'; g.fillText('Cuvée', 256, 104); g.fillText('du club', 256, 146);
      g.fillStyle = '#b8902f'; g.font = '22px Georgia, serif'; g.fillText('♠ ♥ ♦ ♣', 256, 196);
    })(lc.getContext('2d'));
    var label = new T.Mesh(new T.CylinderGeometry(0.163, 0.163, 0.3, 48, 1, true, PI), new T.MeshStandardMaterial({ map: canvasTex(lc), roughness: 0.8 })); label.position.y = 0.3; bottle.add(label);
    var foil = cyl(0.064, 0.066, 0.16, M(0x6e1426, 0.35, true), 0, 1.0, 0); bottle.add(foil);
    var BX = 0.62, BZ = 0.62;

    // jetons : deux piles à côté du bouchon, poussées au milieu sur « relance »
    function chipTex(col, val) {
      var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
      g.fillStyle = col; g.beginPath(); g.arc(128, 128, 128, 0, 2 * PI); g.fill();
      g.fillStyle = '#fff'; for (var k = 0; k < 8; k++) { g.save(); g.translate(128, 128); g.rotate(k * PI / 4); g.fillRect(-14, -128, 28, 30); g.restore(); }
      g.strokeStyle = '#fff'; g.lineWidth = 5; g.setLineDash([10, 8]); g.beginPath(); g.arc(128, 128, 84, 0, 2 * PI); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(128, 128, 64, 0, 2 * PI); g.fill();
      g.fillStyle = col; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(val, 128, 132);
      return canvasTex(c);
    }
    function edgeTex(col) { var c = document.createElement('canvas'); c.width = 256; c.height = 16; var g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 256, 16); g.fillStyle = '#fff'; for (var k = 0; k < 8; k++) g.fillRect(k * 32 + 8, 0, 14, 16); return canvasTex(c); }
    var CHM = [['#c9161d', '5'], ['#1f4fc4', '10'], ['#178a3a', '25'], ['#161616', '100']].map(function (q) { var top = new T.MeshStandardMaterial({ map: chipTex(q[0], q[1]), roughness: 0.45 }); return [new T.MeshStandardMaterial({ map: edgeTex(q[0]), roughness: 0.5 }), top, top]; });
    var chips = [], chipG = new T.CylinderGeometry(0.11, 0.11, 0.022, 40);
    [[0.08, 1.48, 3, 9, 0], [0.32, 1.42, 0, 8, 1], [-0.62, 1.4, 1, 6, 0], [0.22, 1.66, 2, 6, 1]].forEach(function (st) {
      for (var k = 0; k < st[3]; k++) {
        var c = new T.Mesh(chipG, CHM[st[2]]); c.castShadow = true; c.receiveShadow = true;
        var x0 = st[0] + (Math.random() - 0.5) * 0.008, z0 = st[1] + (Math.random() - 0.5) * 0.008, y0 = TOP + 0.011 + k * 0.0225;
        c.position.set(x0, y0, z0); c.rotation.y = Math.random() * 6; S.add(c);
        // arrivée au pot : un petit tas au milieu de la table
        var a = Math.random() * 2 * PI, rr = 0.05 + Math.random() * 0.14;
        chips.push({ m: c, x0: x0, y0: y0, z0: z0, x1: 0.12 + Math.cos(a) * rr, z1: 0.9 + Math.sin(a) * rr * 0.8, y1: TOP + 0.011 + (k % 4) * 0.0225, d: k * 0.025 + st[4] * 0.05, ry: c.rotation.y });
      }
    });
    // étincelles dorées
    var mGold = new T.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xc8901a, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3 });
    var spark = []; for (var q = 0; q < 22; q++) { var o = new T.Mesh(new T.OctahedronGeometry(0.03 + Math.random() * 0.025), mGold); o.visible = false; S.add(o); spark.push({ m: o, a: Math.random() * 2 * PI, sp: 0.5 + Math.random() * 0.9, up: 0.4 + Math.random() * 0.9, d: Math.random() * 0.35 }); }

    function envAt(x) { if (!env || x < 0) return 0; var i = Math.floor(x / 0.03); return i < env.length ? (+env.charAt(i)) / 9 : 0; }
    var LAND = { x: -0.3, z: 1.42 }, P0 = new T.Vector3(), V = 3.3; // voix à 3,3 s
    function frame(now) {
      var t = (now - t0) / 1000;
      // la bouteille glisse sur la table (0–0,8 s), tremble (0,9–1,5 s), POP à 1,5 s, recule un peu
      var inb = easeOut(seg(t, 0, 0.8)), shake = t > 0.9 && t < 1.5 ? Math.sin(t * 70) * 0.06 * seg(t, 0.9, 1.4) : 0, kick = t > 1.5 ? Math.exp(-(t - 1.5) * 6) * Math.sin((t - 1.5) * 30) * 0.12 : 0;
      bottle.position.set(BX + (1 - inb) * 2.6, TOP, BZ); bottle.rotation.set(0, 0, shake + kick - (1 - inb) * 0.25);
      foil.visible = t < 1.5;
      // le bouchon : dans le goulot, puis vol en tournant et en grossissant, atterrissage debout
      var fl = seg(t, 1.5, 2.35), sq = 0, hop = 0;
      if (t < 1.5) { cork.visible = t > 0.9; cork.position.set(bottle.position.x + Math.sin(-bottle.rotation.z) * 1.0, TOP + 1.0 + (t > 0.9 ? seg(t, 0.9, 1.5) * 0.06 : 0), BZ); cork.scale.setScalar(0.27); cork.rotation.set(0, 0, bottle.rotation.z); }
      else if (fl < 1) {
        cork.visible = true; var sx = BX, sy = TOP + 1.06;
        cork.position.set(sx + (LAND.x - sx) * fl, sy + (TOP - sy) * fl + Math.sin(fl * PI) * 0.75, BZ + (LAND.z - BZ) * fl);
        cork.scale.setScalar(0.27 + 0.73 * easeOut(fl)); cork.rotation.set(fl * PI * 4, 0, fl * PI * 1.2);
      } else {
        cork.visible = true; cork.position.set(LAND.x, TOP, LAND.z); cork.scale.setScalar(1); cork.rotation.set(0, 0, 0);
        sq = t < 2.75 ? Math.exp(-(t - 2.35) * 9) * Math.cos((t - 2.35) * 28) * 0.28 : 0;
      }
      // « Non ! » : il secoue tout le corps (3,3–3,8 s) ; « … pas un call » : penché, sourcils froncés
      var no = t > V && t < V + 0.65 ? Math.sin((t - V) * 26) * (1 - seg(t, V + 0.4, V + 0.65)) : 0;
      var lean = seg(t, V + 0.75, V + 1.1) * (1 - seg(t, V + 2.1, V + 2.3));
      // « …c'est une relance ! » : il s'accroupit, saute, et les jetons partent au pot
      var J = 5.75, jump = seg(t, J, J + 0.45); hop = jump > 0 && jump < 1 ? Math.sin(jump * PI) * 0.45 : 0;
      var crouch = (t > J - 0.25 && t < J) ? Math.sin(seg(t, J - 0.25, J) * PI) : 0;
      var spin = seg(t, 7.2, 7.8);
      body.scale.set(1 + sq * 0.6 + crouch * 0.12, 1 - sq - crouch * 0.18, 1 + sq * 0.6 + crouch * 0.12);
      body.rotation.set(-lean * 0.22, no * 0.55 + easeOut(spin) * 2 * PI, no * 0.12 + Math.sin(t * 5) * 0.03 * lean);
      if (fl >= 1) cork.position.y = TOP + hop + (spin > 0 && spin < 1 ? Math.sin(spin * PI) * 0.22 : 0);
      // yeux : fermés dans la bouteille, s'ouvrent après l'atterrissage, en colère, clin d'œil à la fin
      var open = seg(t, 2.55, 2.75), angry = seg(t, V - 0.1, V + 0.1) * (1 - seg(t, 6.6, 6.9));
      eyes.forEach(function (e) {
        var closed = 1 - open; if (t > 7.85 && t < 8.25 && e.s > 0) closed = 1; // clin d'œil
        if (no) closed = Math.max(closed, 0.15);
        e.lid.position.y = 0.05 - (closed * 0.05) + angry * -0.012; e.lid.scale.y = 0.55 + closed * 0.55 + angry * 0.12;
        e.lid.rotation.z = angry * 0.35 * e.s;
        e.brow.rotation.z = angry * -0.5 * e.s + (1 - angry) * 0.12 * e.s * open; e.brow.position.y = 0.085 - angry * 0.02;
        var px = lean * 0.0 + no * 0.012, py = -lean * 0.008;
        e.p.position.set(px, py, 0.028); e.hl.position.set(px + 0.011, py + 0.013, 0.046);
      });
      // bouche synchronisée sur la voix ; sourire satisfait à la fin
      var v = envAt(t - V), smile = seg(t, 6.9, 7.2);
      mo.scale.set(1 - v * 0.15 + smile * 0.25, 0.22 + v * 1.05, 0.35); lip.scale.set(1 - v * 0.15 + smile * 0.25, 0.22 + v * 1.0 + smile * 0.08, 1);
      mouth.rotation.z = 0;
      // jetons : au pot quand il retombe
      var land = J + 0.42;
      chips.forEach(function (c) {
        var k = easeOut(seg(t, land + c.d, land + c.d + 0.45)), arc = Math.sin(k * PI) * 0.18;
        c.m.position.set(c.x0 + (c.x1 - c.x0) * k, c.y0 + (c.y1 - c.y0) * k + arc, c.z0 + (c.z1 - c.z0) * k);
        c.m.rotation.set(k < 1 && k > 0 ? Math.sin(k * PI) * 0.6 : 0, c.ry + k * 3, 0);
      });
      // étincelles dorées autour du bouchon après la relance
      spark.forEach(function (s) { var u = t - (land + s.d); s.m.visible = u > 0 && u < 1.6; if (!s.m.visible) return; var r2 = 0.25 + s.sp * u * 0.6; s.m.position.set(LAND.x + Math.cos(s.a + u * 2) * r2, TOP + 0.3 + s.up * u - 0.25 * u * u, LAND.z + Math.sin(s.a + u * 2) * r2 * 0.6); s.m.rotation.set(u * 6, u * 5, 0); s.m.scale.setScalar(1 - seg(u, 1.1, 1.6)); });
      R.render(S, cam);
    }
    var started = false, raf = 0;
    function loop() {
      if (box.isConnected) started = true;
      if (started && !box.isConnected) { cancelAnimationFrame(raf); try { R.dispose(); R.forceContextLoss(); } catch (e) {} return; }
      var w2 = box.clientWidth, h2 = box.clientHeight; if (w2 && h2 && (w2 !== W || h2 !== H)) { W = w2; H = h2; R.setSize(W, H); cam.aspect = W / H; aim(); cam.updateProjectionMatrix(); }
      frame(performance.now()); raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }
  window.PA_FX3D = { poulet: poulet, ane: ane, loup: loup, bouchon: bouchon };
})();
