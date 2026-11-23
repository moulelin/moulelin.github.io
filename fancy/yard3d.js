// 吉祥's yard in 3D. 吉祥 itself stays the 2D drawing from the page, standing on top of this scene;
// this file draws the garden around it and tells the page where the ground and the kennel door are.
// Without WebGL nothing here runs and the flat yard stays.
import * as THREE from './vendor/three.module.min.js';

(function () {
  const JX = window.JX, yard = document.getElementById('yard'), pet = document.getElementById('pet');
  if (!JX || !yard || !pet) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return; }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PI = Math.PI, rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- small builders ---------- */
  const mats = {};
  function M(color, o) {
    const k = color + JSON.stringify(o || '');
    return mats[k] || (mats[k] = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: .82, metalness: 0 }, o)));
  }
  function mesh(geo, mat, p, s, r) {
    const m = new THREE.Mesh(geo, mat);
    if (p) m.position.set(p[0], p[1], p[2]);
    if (s) m.scale.set(s[0], s[1], s[2]);
    if (r) m.rotation.set(r[0], r[1], r[2]);
    m.castShadow = true;
    return m;
  }
  const G = {
    sph: (r, w, h) => new THREE.SphereGeometry(r, w || 28, h || 20),
    cyl: (a, b, h, n) => new THREE.CylinderGeometry(a, b, h, n || 20),
    box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
    cone: (r, h, n) => new THREE.ConeGeometry(r, h, n || 20),
    tor: (r, t, arc) => new THREE.TorusGeometry(r, t, 10, 28, arc || PI * 2)
  };
  function group(p, kids) { const g = new THREE.Group(); if (p) g.position.set(p[0], p[1], p[2]); (kids || []).forEach(k => g.add(k)); return g; }

  const C = { dark: '#3a2a26' };

  /* ---------- the garden ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 2, .1, 120);
  const hemi = new THREE.HemisphereLight('#ffffff', '#b9e3a8', 1.5);
  const sun = new THREE.DirectionalLight('#fff3dd', 2.2);
  sun.position.set(5, 9, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536); sun.shadow.radius = 5; sun.shadow.bias = -.0005;
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 9, bottom: -5, near: 1, far: 30 });
  scene.add(hemi, sun);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement; cv.className = 'yard3d';
  yard.insertBefore(cv, yard.querySelector('.kennel') || yard.firstChild);

  const xmas = () => yard.classList.contains('xmas');
  const month = new Date().getMonth() + 1;
  const season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';

  // ground, with soft darker patches, and hills behind the fence
  const grassMat = new THREE.MeshStandardMaterial({ color: '#a5dc8f', roughness: 1 });
  const ground = mesh(new THREE.PlaneGeometry(80, 26), grassMat, [0, 0, -4], null, [-PI / 2, 0, 0]);
  ground.castShadow = false; ground.receiveShadow = true; scene.add(ground);
  const patchMat = new THREE.MeshStandardMaterial({ color: '#93d07c', roughness: 1 });
  const patches = new THREE.Group(); scene.add(patches);
  for (let i = 0; i < 26; i++) { const p = mesh(new THREE.CircleGeometry(rand(.5, 1.5), 24), patchMat, [rand(-13, 13), .006, rand(-5.5, 3)], [1.5, .7, 1], [-PI / 2, 0, 0]); p.castShadow = false; p.receiveShadow = true; patches.add(p); }
  const hillMat = new THREE.MeshStandardMaterial({ color: '#b9e6a2', roughness: 1 });
  const hills = new THREE.Group(); scene.add(hills);
  [[-9, 7, 2.3], [1, 9, 3], [11, 8, 2.5], [-19, 8, 2.2], [20, 9, 2.4]].forEach(h => { const m = mesh(G.sph(1, 32, 16), hillMat, [h[0], -.4, -11.5], [h[1], h[2], 2]); m.castShadow = false; hills.add(m); });

  const things = {}, clickable = [];
  function add(name, g, click) { things[name] = g; scene.add(g); if (click) { g.userData.click = click; clickable.push(g); } return g; }

  // 吉祥's house
  (function () {
    const wood = M('#f7d3a3'), woodD = M('#e9b77f'), roofM = M('#ff8fab'), k = new THREE.Group();
    const w = 2.1, h = 1.15, dp = 1.9, t = .09;
    const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h); shape.lineTo(0, h + .82); shape.lineTo(-w / 2, h); shape.closePath();
    const door = new THREE.Path(); door.moveTo(-.52, 0); door.lineTo(-.52, .62); door.absarc(0, .62, .52, PI, 0, true); door.lineTo(.52, 0); door.closePath(); shape.holes.push(door);
    const front = mesh(new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false }), wood, [0, 0, dp / 2 - t]); front.receiveShadow = true; k.add(front);
    const backS = new THREE.Shape(); backS.moveTo(-w / 2, 0); backS.lineTo(w / 2, 0); backS.lineTo(w / 2, h); backS.lineTo(0, h + .82); backS.lineTo(-w / 2, h); backS.closePath();
    k.add(mesh(new THREE.ExtrudeGeometry(backS, { depth: t, bevelEnabled: false }), woodD, [0, 0, -dp / 2]));
    k.add(mesh(G.box(t, h, dp), wood, [-w / 2 + t / 2, h / 2, 0]), mesh(G.box(t, h, dp), wood, [w / 2 - t / 2, h / 2, 0]));
    k.add(mesh(G.box(w, .05, dp), woodD, [0, .025, 0]));
    const inside = mesh(G.box(w - .2, h, dp - .2), new THREE.MeshStandardMaterial({ color: '#6b4636', side: THREE.BackSide, roughness: 1 }), [0, h / 2, 0]); inside.castShadow = false; k.add(inside);
    const rl = Math.hypot(w / 2, .82) + .34, ra = Math.atan2(.82, w / 2);
    [1, -1].forEach(s => k.add(mesh(G.box(rl, .1, dp + .36), roofM, [s * (w / 4 + .06), h + .41 + .07, 0], null, [0, 0, -s * ra])));
    k.add(mesh(G.box(.16, .12, dp + .4), M('#ff7a9c'), [0, h + .9, 0]));
    const cushion = mesh(G.sph(.6), M('#ffb3c6'), [0, .08, .15], [1.25, .2, 1]); cushion.castShadow = false; k.add(cushion);
    // name plate
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
    x.fillStyle = '#fff6ea'; x.beginPath(); x.roundRect(4, 4, 248, 88, 24); x.fill(); x.lineWidth = 6; x.strokeStyle = '#8a5a44'; x.stroke();
    x.fillStyle = '#5a3e46'; x.font = '600 50px "PingFang SC","Microsoft YaHei",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('吉祥 ♥', 128, 52);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const plate = mesh(new THREE.PlaneGeometry(.78, .3), new THREE.MeshStandardMaterial({ map: tex, roughness: .9 }), [0, h + .42, dp / 2 + .012], null, [0, 0, -.05]); plate.castShadow = false; k.add(plate);
    const lamp = new THREE.PointLight('#ffcf8a', 0, 6, 1.6); lamp.position.set(0, .9, .2); k.add(lamp); k.userData.lamp = lamp;
    k.userData.door = dp / 2;
    add('kennel', k);
  })();

  // the tree of the season
  (function () {
    const leaf = { spring: ['#ffc4d6', '#ffa9c4', '#ffdbe6'], summer: ['#8fd07a', '#75c063', '#a9de93'], autumn: ['#ffb45e', '#f58f3e', '#ffd07a'], winter: ['#f4f8fc', '#e2ebf5', '#ffffff'] }[season];
    const t = new THREE.Group(), crown = new THREE.Group(), bark = M('#9b6a4c');
    t.add(mesh(G.cyl(.2, .3, 2, 14), bark, [0, 1, 0]));
    t.add(mesh(G.cyl(.09, .13, .9, 10), bark, [.36, 1.75, 0], null, [0, 0, -.8]), mesh(G.cyl(.08, .12, .8, 10), bark, [-.33, 1.9, .05], null, [0, 0, .75]));
    crown.position.y = 2.1;
    [[0, 1.05, 0, 1.15], [-.85, .55, .1, .85], [.9, .6, 0, .9], [-.2, .5, .6, .8], [.3, 1.5, -.2, .75], [-.55, 1.25, -.3, .7], [.25, .35, -.55, .75]].forEach(function (b, i) {
      const m = mesh(new THREE.IcosahedronGeometry(b[3], 4), M(leaf[i % leaf.length], { roughness: .95 }), [b[0], b[1], b[2]]); crown.add(m);
    });
    t.add(crown); t.userData.crown = crown; t.userData.shake = -9; t.userData.leaf = leaf;
    add('tree', t, function () { t.userData.shake = clock; dropLeaves(14); });
  })();
  // leaves that fall from the tree
  const leaves = [];
  function dropLeaves(n) {
    const t = things.tree; if (!t || reduceMotion) return;
    for (let i = 0; i < n && leaves.length < 60; i++) {
      const m = mesh(new THREE.CircleGeometry(.07, 6), M(t.userData.leaf[i % 3], { side: THREE.DoubleSide }), [t.position.x + rand(-1.3, 1.3), rand(2.4, 3.8), t.position.z + rand(-.5, .9)]);
      m.castShadow = false; m.userData = { vy: rand(.5, 1), ph: rand(0, 6), land: 0 }; scene.add(m); leaves.push(m);
    }
  }

  // picket fence along the back
  const fence = new THREE.Group(); scene.add(fence);
  (function () {
    const white = M('#ffffff', { roughness: .9 });
    for (let i = -34; i <= 34; i++) {
      fence.add(mesh(G.box(.2, .82, .06), white, [i * .42, .41, 0]));
      fence.add(mesh(G.cone(.142, .16, 4), white, [i * .42, .9, 0], [1, 1, .3], [0, PI / 4, 0]));
    }
    fence.add(mesh(G.box(29, .09, .05), white, [0, .3, -.04]), mesh(G.box(29, .09, .05), white, [0, .62, -.04]));
  })();

  // mailbox: the flag goes up when there is a new note; tap it to open the letters
  (function () {
    const g = new THREE.Group(), red = M('#ff6f7f', { roughness: .6 });
    g.add(mesh(G.cyl(.06, .07, 1, 10), M('#a9785a'), [0, .5, 0]));
    g.add(mesh(G.box(.62, .22, .4), red, [0, 1.11, 0]), mesh(G.cyl(.2, .2, .62, 20), red, [0, 1.22, 0], null, [0, 0, PI / 2]));
    g.add(mesh(G.box(.02, .3, .34), M('#ffe9ec'), [.315, 1.2, 0]));
    const flag = group([.1, 1.2, .21], [mesh(G.box(.04, .34, .03), M('#ffd25e'), [0, .17, 0]), mesh(G.box(.16, .12, .03), M('#ffd25e'), [.06, .3, 0])]);
    flag.rotation.z = -PI / 2; g.add(flag); g.userData.flag = flag;
    const note = mesh(G.box(.3, .2, .02), M('#fff8f0'), [.36, 1.22, 0], null, [0, PI / 2, .25]); note.visible = false; g.add(note); g.userData.note = note;
    add('mailbox', g, function () { JX.mail(); });
  })();

  // food bowl
  add('bowl', group(null, [mesh(G.cyl(.3, .22, .16, 24), M('#ff9db7'), [0, .08, 0]), mesh(G.cyl(.25, .25, .02, 24), M('#8a5a3c'), [0, .155, 0]), mesh(G.sph(.06), M('#a9714b'), [.06, .17, .04]), mesh(G.sph(.055), M('#a9714b'), [-.08, .17, -.03]), mesh(G.sph(.05), M('#b98058'), [.0, .18, -.09])]));

  // garden lamp: lights up at night; tap to switch it
  (function () {
    const g = new THREE.Group(), iron = M('#5b5f6b', { roughness: .5 });
    g.add(mesh(G.cyl(.05, .07, 2.2, 10), iron, [0, 1.1, 0]), mesh(G.cyl(.14, .16, .08, 12), iron, [0, .04, 0]), mesh(G.cone(.2, .14, 12), iron, [0, 2.55, 0]));
    const glass = mesh(G.sph(.17), new THREE.MeshStandardMaterial({ color: '#fff3cf', emissive: '#ffc968', emissiveIntensity: 0, roughness: .4 }), [0, 2.33, 0]); glass.castShadow = false; g.add(glass);
    const light = new THREE.PointLight('#ffd08a', 0, 9, 1.4); light.position.set(0, 2.3, 0); g.add(light);
    g.userData = { glass: glass, light: light, on: null };
    add('lamp', g, function () { g.userData.on = !(g.userData.on == null ? night : g.userData.on); });
  })();

  // pond with a rubber duck
  (function () {
    const g = new THREE.Group();
    const water = mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ color: '#8fd3f4', roughness: .15, metalness: .1 }), [0, .02, 0], [1.5, 1, 1], [-PI / 2, 0, 0]); water.castShadow = false; water.receiveShadow = true; g.add(water);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; g.add(mesh(G.sph(rand(.13, .2), 12, 8), M(i % 3 ? '#d9d4cc' : '#c4beb4'), [Math.cos(a) * 1.55, .03, Math.sin(a) * 1.05], [1, .55, 1])); }
    [[-.6, .3], [.5, -.4], [.8, .35]].forEach(p => { const l = mesh(new THREE.CircleGeometry(.2, 16, .4, PI * 1.8), M('#7cc47a', { side: THREE.DoubleSide }), [p[0], .035, p[1]], null, [-PI / 2, 0, rand(0, 6)]); l.castShadow = false; g.add(l); });
    g.add(mesh(G.sph(.05), M('#ff9ec0'), [.82, .07, .36]));
    const duck = group([0, .06, 0], [mesh(G.sph(.17), M('#ffd84d', { roughness: .5 }), null, [1.2, .85, 1]), mesh(G.sph(.12), M('#ffd84d', { roughness: .5 }), [.14, .18, 0]), mesh(G.cone(.05, .1, 10), M('#ff9838'), [.27, .17, 0], [1, 1, 1.4], [0, 0, -PI / 2]), mesh(G.sph(.018), M(C.dark), [.2, .22, .08]), mesh(G.sph(.018), M(C.dark), [.2, .22, -.08]), mesh(G.cone(.07, .12, 8), M('#ffd84d'), [-.2, .08, 0], null, [0, 0, .9])]);
    g.add(duck); g.userData.duck = duck;
    add('pond', g, function () { g.userData.quack = clock; JX.toast('嘎嘎！🦆'); });
  })();

  // stepping stones, flowers, bushes, mushrooms, toys
  const stones = new THREE.Group(); scene.add(stones);
  for (let i = 0; i < 5; i++) { const s = mesh(G.cyl(.3, .32, .05, 14), M('#e6dfd3', { roughness: 1 }), [0, .025, 0], [rand(1, 1.25), 1, rand(.75, .9)]); s.castShadow = false; s.receiveShadow = true; stones.add(s); }
  function flower(color, tall) {
    const g = new THREE.Group(), h = tall || rand(.28, .42);
    g.add(mesh(G.cyl(.018, .022, h, 6), M('#6fbf6a'), [0, h / 2, 0]), mesh(G.sph(.05, 10, 8), M('#ffd25e'), [0, h + .02, 0]));
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; g.add(mesh(G.sph(.062, 10, 8), M(color), [Math.cos(a) * .075, h + .015, Math.sin(a) * .075], [1, .55, 1])); }
    g.add(mesh(G.sph(.06, 8, 6), M('#6fbf6a'), [.06, h * .4, 0], [1.3, .3, .6]));
    return g;
  }
  function tulip(color) {
    const g = new THREE.Group(), h = rand(.34, .46);
    g.add(mesh(G.cyl(.02, .024, h, 6), M('#6fbf6a'), [0, h / 2, 0]), mesh(G.sph(.085, 12, 10), M(color), [0, h + .05, 0], [.85, 1.15, .85]), mesh(G.sph(.07, 8, 6), M('#6fbf6a'), [.07, h * .35, 0], [1.4, .28, .5], [0, 0, .5]));
    return g;
  }
  const flowers = new THREE.Group(); scene.add(flowers);
  const FL = ['#ff9ec0', '#ffffff', '#ffd25e', '#c9a7ff', '#ff8f8f', '#9fd0ff'];
  for (let i = 0; i < 34; i++) { const f = i % 3 === 0 ? tulip(FL[i % FL.length]) : flower(FL[i % FL.length]); f.userData.ph = rand(0, 6); flowers.add(f); }
  function bush(color) { return group(null, [mesh(G.sph(.42, 16, 12), M(color), [0, .3, 0]), mesh(G.sph(.33, 16, 12), M(color), [.38, .24, .05]), mesh(G.sph(.3, 16, 12), M(color), [-.36, .22, .04]), mesh(G.sph(.26, 16, 12), M(color), [.1, .5, -.1])]); }
  add('bush1', bush('#7fc96d')); add('bush2', bush('#8fd47c')); add('bush3', bush('#7fc96d'));
  function mushroom() { return group(null, [mesh(G.cyl(.05, .06, .14, 10), M('#fff6e8'), [0, .07, 0]), mesh(new THREE.SphereGeometry(.13, 16, 10, 0, PI * 2, 0, PI / 2), M('#ff6f7f'), [0, .13, 0]), mesh(G.sph(.025, 8, 6), M('#ffffff'), [.05, .22, .04]), mesh(G.sph(.02, 8, 6), M('#ffffff'), [-.06, .2, 0]), mesh(G.sph(.02, 8, 6), M('#ffffff'), [0, .2, -.07])]); }
  add('mush1', mushroom()); add('mush2', mushroom());
  add('ball', group(null, [mesh(G.sph(.17), M('#ff7a9c', { roughness: .5 }), [0, .17, 0]), mesh(G.tor(.172, .02), M('#ffffff'), [0, .17, 0], null, [PI / 2, 0, 0])]));
  add('bone', group(null, [mesh(G.cyl(.04, .04, .3, 8), M('#fff6e8'), [0, .05, 0], null, [0, 0, PI / 2]), mesh(G.sph(.06, 10, 8), M('#fff6e8'), [.16, .05, .04]), mesh(G.sph(.06, 10, 8), M('#fff6e8'), [.16, .05, -.04]), mesh(G.sph(.06, 10, 8), M('#fff6e8'), [-.16, .05, .04]), mesh(G.sph(.06, 10, 8), M('#fff6e8'), [-.16, .05, -.04])]));

  // Christmas: a tree with a star, presents and a snowman
  (function () {
    const t = new THREE.Group(), green = M('#4fa56f');
    t.add(mesh(G.cyl(.12, .15, .4, 10), M('#9b6a4c'), [0, .2, 0]));
    [[.85, .9, .75], [.68, .8, 1.3], [.5, .7, 1.8], [.32, .55, 2.25]].forEach(c => t.add(mesh(G.cone(c[0], c[1], 20), green, [0, c[2], 0])));
    const star = mesh(new THREE.OctahedronGeometry(.16), new THREE.MeshStandardMaterial({ color: '#ffd84d', emissive: '#ffb300', emissiveIntensity: .6 }), [0, 2.66, 0]); t.add(star); t.userData.star = star;
    const bulbs = [];
    for (let i = 0; i < 16; i++) { const y = .55 + i * .11, r = .8 - i * .036, a = i * 2.4; const b = mesh(G.sph(.06, 10, 8), new THREE.MeshStandardMaterial({ color: ['#ff6f7f', '#ffd84d', '#8ec2ff', '#ffffff'][i % 4], emissive: ['#ff3f5f', '#ffb300', '#4f9bff', '#ffffff'][i % 4], emissiveIntensity: .3 }), [Math.cos(a) * r * .8, y, Math.sin(a) * r * .8]); b.castShadow = false; t.add(b); bulbs.push(b); }
    t.userData.bulbs = bulbs;
    [['#ff6f7f', '#ffffff', -.75, .45, .34], ['#8ec2ff', '#ffd84d', .7, .55, .28], ['#ffd84d', '#ff6f7f', .25, .85, .22]].forEach(function (p) {
      t.add(group([p[2], p[4] / 2, p[3]], [mesh(G.box(p[4], p[4], p[4]), M(p[0])), mesh(G.box(p[4] + .01, p[4] + .01, .06), M(p[1])), mesh(G.box(.06, p[4] + .01, p[4] + .01), M(p[1])), mesh(G.sph(.05), M(p[1]), [0, p[4] / 2 + .03, 0])]));
    });
    t.visible = false; add('xtree', t);
    const s = new THREE.Group(), snow = M('#ffffff', { roughness: .95 });
    s.add(mesh(G.sph(.42), snow, [0, .36, 0]), mesh(G.sph(.3), snow, [0, .94, 0]), mesh(G.cone(.04, .2, 8), M('#ff9838'), [.36, .95, 0], null, [0, 0, -PI / 2]));
    s.add(mesh(G.sph(.03), M(C.dark), [.26, 1.03, .1]), mesh(G.sph(.03), M(C.dark), [.26, 1.03, -.1]), mesh(G.tor(.25, .06), M('#e5484d'), [0, .72, 0], null, [PI / 2, 0, 0]), mesh(G.cyl(.2, .2, .26, 14), M('#3a3f55'), [0, 1.32, 0]), mesh(G.cyl(.3, .3, .03, 14), M('#3a3f55'), [0, 1.2, 0]));
    s.visible = false; add('snowman', s);
  })();

  // butterflies by day, fireflies at night
  const flyers = [];
  for (let i = 0; i < 3; i++) {
    const col = ['#ffb3d1', '#ffe08a', '#b9d4ff'][i], b = new THREE.Group();
    const wm = new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: .9 });
    const l = group(null, [mesh(new THREE.CircleGeometry(.09, 10), wm, [0, 0, .08], [1, 1, 1], [-PI / 2, 0, 0])]), r = group(null, [mesh(new THREE.CircleGeometry(.09, 10), wm, [0, 0, -.08], null, [-PI / 2, 0, 0])]);
    l.children[0].castShadow = r.children[0].castShadow = false;
    b.add(l, r); b.userData = { l: l, r: r, ph: rand(0, 6), cx: 0, cz: 0 }; scene.add(b); flyers.push(b);
  }
  const flies = [];
  for (let i = 0; i < 9; i++) { const f = mesh(G.sph(.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0' })); f.castShadow = false; f.userData.ph = rand(0, 20); scene.add(f); flies.push(f); }

  let W = 0, H = 0, S = 60, clock = 0, night = false, home = new THREE.Vector3(), homePx = 0;

  const v3 = new THREE.Vector3();
  function px(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }; }
  function layout() {
    W = yard.clientWidth; H = yard.clientHeight; if (!W || !H) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const want = Math.max(58, Math.min(92, W / 8.4)), gb = Math.round(H * .17);
    const dist = (H / 2) / (Math.tan(camera.fov * PI / 360) * want);
    camera.position.set(0, dist * .3, dist);
    let lo = -6, hi = 6;                      // aim the camera so the line 吉祥 walks on sits gb pixels above the bottom edge
    for (let i = 0; i < 30; i++) { const ty = (lo + hi) / 2; camera.lookAt(0, ty, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld(); if (H - px(0, 0, 0).y > gb) lo = ty; else hi = ty; }
    S = px(1, 0, 0).x - px(0, 0, 0).x;        // pixels per unit on that line
    const small = W < 620, hw = z => (W / 2) / (px(1, 0, z).x - px(0, 0, z).x);
    const at = (name, fx, z, ry, sc) => { const g = things[name]; g.position.set(fx * hw(z), 0, z); if (ry != null) g.rotation.y = ry; if (sc) g.scale.setScalar(sc); return g; };
    fence.position.set(0, 0, -6.2);
    at('kennel', small ? -.5 : -.66, small ? -2.7 : -2.5, .22, small ? 1.12 : 1.18);
    at('tree', small ? .74 : .74, small ? -4.6 : -3.8, 0, small ? .68 : .9);
    at('mailbox', small ? .84 : .36, small ? -1.3 : -2.9, small ? -.5 : -.3);
    at('lamp', small ? .04 : -.2, small ? -5.2 : -4.6, 0);
    at('pond', small ? .3 : .12, small ? -2.5 : -1.9, 0, small ? .62 : 1);
    at('bowl', small ? -.1 : -.36, small ? -1.5 : -1.3);
    at('bush1', -.97, -4.9, 0, 1.2); at('bush2', .98, -1.7, 0, 1); at('bush3', small ? .22 : .34, -5.4, 0, 1.3);
    at('mush1', small ? .86 : .56, small ? -3.6 : -2.5); at('mush2', small ? .93 : .6, small ? -3.3 : -2.2, 0, .7);
    at('ball', small ? -.05 : .52, small ? -1 : -1.1); at('bone', small ? -.86 : -.9, -1.2, .6);
    at('xtree', small ? .16 : .22, small ? -4.6 : -4.3, 0, small ? .95 : 1.15); at('snowman', small ? .42 : .86, small ? -2.9 : -3.3, -.5, small ? .8 : 1);
    const k = things.kennel;
    stones.children.forEach((s, i) => { const f = (i + .6) / 5; s.position.set(k.position.x + .25 + f * 1.1 + (i % 2 ? .12 : -.1), .025, k.position.z + 1.3 + f * (1.35 - k.position.z - 1.3) * .8); });
    // flowers: some along the fence, some in the lawn, none on the walking line
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    flowers.children.forEach(function (f, i) {
      const z = i < 14 ? -5.7 + rnd() * .5 : i < 26 ? -4.6 + rnd() * 3.2 : .7 + rnd() * .8;
      let fx = (rnd() * 2 - 1) * hw(z) * .98;
      const clear = (g, r) => g.visible !== false && Math.hypot(fx - g.position.x, (z - g.position.z) * 1.3) < r * g.scale.x;
      for (let n = 0; n < 8 && (clear(k, 2.1) || clear(things.pond, 2) || clear(things.tree, .7) || clear(things.xtree, 1.2)); n++) fx = (rnd() * 2 - 1) * hw(z) * .98;
      f.visible = !(clear(k, 2.1) || clear(things.pond, 2));
      f.position.set(fx, 0, z); f.scale.setScalar(.6 + rnd() * .35);
    });
    // the spot in front of the kennel door: 吉祥 walks to it, then settles there, a little smaller because it is further back
    const off = (k.userData.door + .35) * k.scale.x;
    home.set(k.position.x + Math.sin(k.rotation.y) * off, 0, k.position.z + Math.cos(k.rotation.y) * off);
    const hp = px(home.x, 0, home.z); homePx = hp.x;
    yard.style.setProperty('--gb', gb + 'px');
    yard.style.setProperty('--hb', Math.round(H - hp.y) + 'px');
    yard.style.setProperty('--hs', ((px(home.x + 1, 0, home.z).x - hp.x) / S * .86).toFixed(3));
    JX.setGround(gb);
    draw();
  }
  function mood() {
    const ph = JX.phase(), wx = JX.wx() || {}, x = xmas(), snowy = x || wx.kind === 'snow';
    night = ph === 'night';
    const dull = wx.kind === 'rain' || wx.kind === 'cloud' || wx.kind === 'fog' || wx.kind === 'snow';
    if (night) { hemi.color.set('#9fb0ff'); hemi.groundColor.set('#46557e'); hemi.intensity = 1.0; sun.color.set('#b5c4ff'); sun.intensity = .8; }
    else if (ph === 'dusk') { hemi.color.set('#fff1e2'); hemi.groundColor.set('#d9cfae'); hemi.intensity = 1.9; sun.color.set('#ffcfa6'); sun.intensity = 2; }
    else { hemi.color.set('#ffffff'); hemi.groundColor.set('#dff3cf'); hemi.intensity = dull ? 2.5 : 2.4; sun.color.set('#fff6e6'); sun.intensity = dull ? 1.3 : 2.4; }
    grassMat.color.set(snowy ? '#f4f8fc' : '#a8e08f');
    patchMat.color.set(snowy ? '#e6eef7' : '#97d47e');
    hillMat.color.set(snowy ? '#ffffff' : '#b9e6a2');
    things.xtree.visible = things.snowman.visible = x;
    things.pond.visible = !x;
    flowers.visible = !snowy;
    const lamp = things.lamp.userData, on = lamp.on == null ? night : lamp.on;
    lamp.glass.material.emissiveIntensity = on ? 1.6 : 0; lamp.light.intensity = on ? (night ? 26 : 8) : 0;
    things.kennel.userData.lamp.intensity = night ? 5 : 0;
  }

  let lastT = 0, moodT = -9;
  function draw() { renderer.render(scene, camera); }
  function frame(ms) {
    const t = ms / 1000, dt = Math.min(.05, t - (lastT || t)); lastT = t; clock = t;
    if (t - moodT > 1) { moodT = t; mood(); }
    // wind in the tree and the flowers
    const w = JX.wx() || {}, wind = Math.min(70, w.wind == null ? 8 : w.wind), dir = w.dir == null ? -1 : -Math.sin(w.dir * PI / 180);
    const tr = things.tree, sh = t - tr.userData.shake, shake = sh < 2.5 ? Math.exp(-sh * 2) * Math.sin(sh * 22) * .12 : 0;
    tr.userData.crown.rotation.z = -dir * wind / 300 + Math.sin(t * (1 + wind / 40)) * (.012 + wind / 900) + shake;
    tr.userData.crown.rotation.x = Math.sin(t * .8 + 1) * (.008 + wind / 1400);
    flowers.children.forEach(f => { f.rotation.z = -dir * wind / 260 + Math.sin(t * 2 + f.userData.ph) * (.03 + wind / 500); });
    if (Math.random() < dt * (.25 + wind / 20) && season !== 'summer') dropLeaves(1);
    for (let i = leaves.length - 1; i >= 0; i--) {
      const l = leaves[i], u = l.userData;
      if (u.land) { if (t - u.land > 9) { scene.remove(l); leaves.splice(i, 1); } continue; }
      l.position.y -= u.vy * dt; l.position.x += (dir * wind / 22 + Math.sin(t * 2 + u.ph) * .5) * dt; l.rotation.x += dt * 3; l.rotation.z += dt * 2;
      if (l.position.y <= .02) { l.position.y = .02; l.rotation.set(-PI / 2, 0, u.ph); u.land = t; }
    }
    // mailbox flag
    const mb = things.mailbox, fresh = !!(document.getElementById('bMail') || {}).classList && document.getElementById('bMail').classList.contains('new');
    mb.userData.flag.rotation.z += ((fresh ? 0 : -PI / 2) - mb.userData.flag.rotation.z) * Math.min(1, dt * 5);
    mb.userData.note.visible = fresh; mb.position.y = fresh ? Math.abs(Math.sin(t * 5)) * .05 : 0;
    // duck
    const pond = things.pond, duck = pond.userData.duck, q = t - (pond.userData.quack || -9);
    duck.position.set(Math.cos(t * .25) * .75, .06 + Math.sin(t * 2.2) * .012 + (q < .5 ? Math.sin(q * PI * 2) * .2 : 0), Math.sin(t * .25) * .5);
    duck.rotation.y = -t * .25 - PI / 2; duck.rotation.z = Math.sin(t * 1.8) * .06;
    // butterflies and fireflies
    flyers.forEach(function (b, i) {
      const u = b.userData, a = t * .5 + u.ph, r = 2.4 + i;
      b.visible = !night && !xmas() && w.kind !== 'rain' && w.kind !== 'snow';
      b.position.set(Math.sin(a) * r + Math.sin(a * 2.3) * .6, 1 + Math.sin(a * 3.1) * .45 + i * .25, -2.4 + Math.cos(a * 1.4) * 1.8);
      b.rotation.y = -a; const f = Math.sin(t * 22 + i) * 1.1; u.l.rotation.x = f; u.r.rotation.x = -f;
    });
    flies.forEach(function (f) { const a = t * .3 + f.userData.ph; f.visible = night; f.position.set(Math.sin(a * 1.3) * 6, .7 + Math.sin(a * 2.1) * .5, -3 + Math.cos(a) * 2.4); f.material.opacity = 1; f.scale.setScalar(.6 + Math.abs(Math.sin(t * 2 + f.userData.ph)) * .8); });
    // Christmas lights
    const xt = things.xtree;
    if (xt.visible) { xt.userData.star.rotation.y = t; xt.userData.bulbs.forEach((b, i) => { b.material.emissiveIntensity = .25 + (Math.sin(t * 3 + i * 1.7) > 0 ? 1.1 : 0); }); }
    draw();
    if (seen && !document.hidden && !reduceMotion) requestAnimationFrame(frame); else running = false;
  }
  let running = false, seen = true;
  function go() { if (!running) { running = true; lastT = 0; requestAnimationFrame(frame); } }

  // taps on things in the garden
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  cv.addEventListener('click', function (e) {
    const r = cv.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(clickable, true)[0]; if (!hit) return;
    let o = hit.object; while (o && !o.userData.click) o = o.parent;
    if (o) o.userData.click();
  });

  yard.classList.add('is3d');
  JX.homeX = function () { return homePx; };
  layout(); mood();
  window.addEventListener('resize', layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(yard);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; if (seen) go(); }).observe(yard);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && seen) go(); });
  if (reduceMotion) { frame(performance.now()); setInterval(function () { frame(performance.now()); }, 1000); } else go();

})();
