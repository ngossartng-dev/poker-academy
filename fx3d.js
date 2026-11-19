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
      mEye = M(0xffffff, 0.25, true), mPup = M(0x111111, 0.2, true), mStalk = M(0xd24d4d, 0.5), mCar = M(0xf06c0a, 0.55), mLeaf = M(0x3aa52f, 0.7), mStar = new T.MeshStandardMaterial({ color: 0xffd23a, emissive: 0x8a6400, roughness: 0.4 });
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
    var stars = []; for (var k = 0; k < 3; k++) { var st2 = new T.Mesh(new T.OctahedronGeometry(0.13), mStar); st2.visible = false; S.add(st2); stars.push(st2); }

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
      if (t > 4.0) { head.getWorldPosition(hw); stars.forEach(function (s, k) { s.visible = true; var a = t * 3 + k * 2.09; s.position.set(hw.x + Math.cos(a) * 0.85, hw.y + 0.75 + Math.sin(a * 2) * 0.08, hw.z + Math.sin(a) * 0.85); s.rotation.y = t * 4; }); }
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
  window.PA_FX3D = { poulet: poulet };
})();
