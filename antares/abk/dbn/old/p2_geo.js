// ================= мова: усі тексти — пари UA / EN
let LANG = 'uk';
try { const s = JSON.parse(localStorage.getItem('antares-abk-dbn-v1') || 'null'); if (s && (s.lang === 'en' || s.lang === 'uk')) LANG = s.lang; } catch (e) {}
const L2 = (uk, en) => LANG === 'en' ? en : uk;                       // вибір тексту
const I = (t1, d1, t2, d2) => ({uk: [t1, d1], en: [t2, d2]});        // підказка об'єкта двома мовами
const G = D.geo, AL = G.AL, AB = G.AB, DB = D.dbn;
const XC = (AB.x0 + AB.x1) / 2, HW = (AB.x1 - AB.x0) / 2;
const zA = x => AB.h + AB.f * Math.max(0, 1 - ((x - XC) / HW) ** 2);
const P = (x, y, h) => new THREE.Vector3(x, h, -y);              // X схід, Y північ → three: x, висота, −z
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fx = v => String(v).replace('.', ','), fx1 = v => v.toFixed(1).replace('.', ',');

const cv = document.getElementById('cv'), stage = cv.parentElement;
const R = new THREE.WebGLRenderer({canvas: cv, antialias: true});
R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const S = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
const ctl = new THREE.OrbitControls(cam, cv); ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.maxPolarAngle = Math.PI * 0.495;
const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f86, 0.55); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); const sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 300; sun.shadow.bias = -0.0004;
const TGT = P(112, 22, 8); sun.target.position.copy(TGT); S.add(sun, sun.target);

const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({color: c, roughness: 0.85, metalness: 0}, o));
const mat = {
  wall: M(0xb9b4a6), wall2: M(0xa9a596), roofL: M(0x55595c, {roughness: 0.95}),
  par: M(0x8d8a80), zn: M(0xb9c0c4, {metalness: 0.6, roughness: 0.35}), ctx: M(0x9fa3a0, {transparent: true, opacity: 0.55}),
  tp: M(0xd2b071, {transparent: true, opacity: 0.7}), lag: M(0x9aa3a8, {metalness: 0.55, roughness: 0.4}), blk: M(0x8e8e88),
  ground: M(0xc9cfc6, {roughness: 1}), frame: M(0xc3c8cc, {metalness: 0.5, roughness: 0.4}),
};
const pv = {E: M(0x2a568a, {roughness: 0.55, metalness: 0.08}), W: M(0x237071, {roughness: 0.55, metalness: 0.08}), L: M(0x5a4b98, {roughness: 0.55, metalness: 0.08}), S: M(0x4b3f8c, {roughness: 0.5, metalness: 0.08})};
const hi = M(0xd98a1c, {roughness: 0.4, emissive: 0x6b3d00}), hiF = M(0xff9a1f, {roughness: 0.4, emissive: 0x8a4a00, transparent: true, opacity: 0.95});
const picks = [], TAGS = {};                                          // TAGS: позиція специфікації → об'єкти сцени
const tag = (o, t) => { (TAGS[t] = TAGS[t] || []).push(o); o.userData.tag = o.userData.tag || t; return o; };
const groups = {arch: new THREE.Group(), low: new THREE.Group(), wall: new THREE.Group(), nad: new THREE.Group(), mount: new THREE.Group(), ctx: new THREE.Group(), bld: new THREE.Group(),
  safety: new THREE.Group(), str: new THREE.Group(), elec: new THREE.Group(), lps: new THREE.Group(), xm: new THREE.Group()};
Object.values(groups).forEach(g => S.add(g));
function box(w, h, d, m, x, y, z, grp, info) {         // центр у (x, y-північ, z-висота центру)
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.copy(P(x, y, z)); b.castShadow = b.receiveShadow = true;
  (grp || groups.bld).add(b); if (info) { b.userData.info = info; picks.push(b); } return b;
}
// ---------- земля
const gnd = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), mat.ground); gnd.rotation.x = -Math.PI / 2; gnd.position.copy(P(110, 20, 0)); gnd.receiveShadow = true; S.add(gnd);
// ---------- південний блок
const EST = {uk: 'Висота — оцінка за поверхами, рулеткою не міряно; план — супутник Google (±0,5 м).', en: 'Height estimated from storeys, not measured; plan from Google satellite (±0.5 m).'};
const ALbody = box(AL.x1 - AL.x0, AL.h, AL.y1 - AL.y0, mat.wall2, (AL.x0 + AL.x1) / 2, (AL.y0 + AL.y1) / 2, AL.h / 2, null,
  I('Південний блок АБК', `${fx1(AL.x1 - AL.x0)} × ${fx1(AL.y1 - AL.y0)} м, 3 поверхи, плаский дах +10,0 м. ${EST.uk}`, 'South block of the admin building', `${(AL.x1 - AL.x0).toFixed(1)} × ${(AL.y1 - AL.y0).toFixed(1)} m, 3 storeys, flat roof +10.0 m. ${EST.en}`));
const pl = G.par.lo, pt = 0.25;
const ALpar = [];
ALpar.push(box(AL.x1 - AL.x0, pl, pt, mat.par, (AL.x0 + AL.x1) / 2, AL.y0 + pt / 2, AL.h + pl / 2, null, I('Парапет південного блоку', '≈0,5 м (оцінка) — південь, захід, схід. Відступ модулів 0,5 м: біля парапетів ринви з водою (фото 27.10).', 'South block parapet', '≈0.5 m (estimate) — south, west, east. Modules kept 0.5 m away: water gutters along the parapets (photos 27.10).')));
ALpar.push(box(pt, pl, AL.y1 - AL.y0, mat.par, AL.x0 + pt / 2, (AL.y0 + AL.y1) / 2, AL.h + pl / 2));
ALpar.push(box(pt, pl, AL.y1 - AL.y0, mat.par, AL.x1 - pt / 2, (AL.y0 + AL.y1) / 2, AL.h + pl / 2));
const [s0, s1, s2, s3] = G.stair;
const SPLIT = 13.95, PARH = 0.3, WT = 0.38;
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
const BRICK = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#c9bf9f'; g.fillRect(0, 0, w, h); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let r = 0; r < 16; r++) for (let x = (r % 2) * -26; x < w; x += 52) {
    const o = rnd() < 0.07, l = o ? 62 + rnd() * 8 : 72 + rnd() * 9, hue = o ? 24 + rnd() * 8 : 44 + rnd() * 6; g.fillStyle = `hsl(${hue},${o ? 45 : 42 + rnd() * 12}%,${l}%)`; g.fillRect(x + 1.5, r * 16 + 1.5, 49, 13); }
});
const PROF = canvasTex(32, 256, (g, w, h) => {
  for (let y = 0; y < h; y++) { const k = Math.cos(y / h * 5 * 2 * Math.PI); const v = 205 + 38 * k; g.fillStyle = `rgb(${v},${v + 4},${v + 8})`; g.fillRect(0, y, w, 1); }
});
const bitum = M(0x2e3236, {roughness: 0.95}), coping = M(0xa8a49a, {roughness: 0.9});
function brickMat(lenM, hM) { const t = BRICK.clone(); t.needsUpdate = true; t.repeat.set(lenM / 2.5, hM / 1.2); return M(0xffffff, {map: t}); }
const BRICKV = canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#c9bf9f'; g.fillRect(0, 0, w, h); let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let r = 0; r < 16; r++) for (let y = (r % 2) * -26; y < h; y += 52) {
    const o = rnd() < 0.07, l = o ? 62 + rnd() * 8 : 72 + rnd() * 9, hue = o ? 24 + rnd() * 8 : 44 + rnd() * 6; g.fillStyle = `hsl(${hue},${o ? 45 : 42 + rnd() * 12}%,${l}%)`; g.fillRect(r * 16 + 1.5, y + 1.5, 13, 49); }
});
const ROLL = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#383c3f'; g.fillRect(0, 0, w, h); let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1400; i++) { const v = 48 + rnd() * 22; g.fillStyle = `rgba(${v},${v + 3},${v + 5},0.5)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(20,22,24,0.9)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(90,94,96,0.55)'; g.fillRect(x + 2, 0, 1, h); }
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(70,74,76,0.35)'; g.fillRect(rnd() * w, rnd() * h, 20 + rnd() * 40, 12 + rnd() * 30); }
});
const COPT = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#a7a397'; g.fillRect(0, 0, w, h); let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) { const v = 140 + rnd() * 50; g.fillStyle = `rgba(${v},${v - 4},${v - 14},0.5)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${190 + rnd() * 30},${170 + rnd() * 30},${50 + rnd() * 30},${0.35 + rnd() * 0.4})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 3, 0, 7); g.fill(); }
  for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(70,70,64,0.5)'; g.fillRect(x, 0, 1, h); }
});
const repT = (T, u, v) => { const t = T.clone(); t.needsUpdate = true; t.repeat.set(u, v); return t; };
const brickW = () => M(0xffffff, {map: repT(BRICK, 1 / 2.5, 1 / 1.2)});
const brickVW = () => M(0xffffff, {map: repT(BRICKV, 1 / 1.2, 1 / 2.5)});
const rollM = (u, v) => M(0xffffff, {map: repT(ROLL, u / 4, v / 4), roughness: 0.95});
const copM = len => M(0xffffff, {map: repT(COPT, len / 4, 1), roughness: 0.9});
{ const dX = AL.x1 - AL.x0, dY = AL.y1 - AL.y0;
  ALbody.material = [brickMat(dY, AL.h), brickMat(dY, AL.h), rollM(dX, dY), mat.wall2, brickMat(dX, AL.h), brickMat(dX, AL.h)];
  ALpar.forEach(b => { const pr = b.geometry.parameters, L = Math.max(pr.width, pr.depth); b.material = brickMat(L, G.par.lo); }); }
function profMat(col, lenM) { const t = PROF.clone(); t.needsUpdate = true; t.repeat.set(lenM, 1); return M(col, {map: t, metalness: 0.45, roughness: 0.45}); }
function nadb(y0, y1, H, col, hc, info) {
  const x0 = s0, x1 = s1, L = Math.max(x1 - x0, y1 - y0), zr = AL.h + H - PARH;
  const bm = brickMat(L, H), body = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, zr - AL.h, y1 - y0), [bm, bm, bitum, bm, bm, bm]);
  body.position.copy(P((x0 + x1) / 2, (y0 + y1) / 2, (AL.h + zr) / 2)); body.castShadow = body.receiveShadow = true; groups.bld.add(body);
  body.userData.info = info; picks.push(body);
  const pm = brickMat(L, PARH), sides = [[x0, x1, y0, y0 + WT], [x0, x0 + WT, y0, y1], [x1 - WT, x1, y0, y1]];
  if (y1 !== SPLIT) sides.push([x0, x1, y1 - WT, y1]);
  sides.forEach(([a, b, c, d]) => {
    const pp = new THREE.Mesh(new THREE.BoxGeometry(b - a, PARH, d - c), pm); pp.position.copy(P((a + b) / 2, (c + d) / 2, zr + PARH / 2));
    pp.castShadow = pp.receiveShadow = true; groups.bld.add(pp); pp.userData.info = info; picks.push(pp);
    const cp = new THREE.Mesh(new THREE.BoxGeometry(b - a + 0.1, 0.06, d - c + 0.1), coping); cp.position.copy(P((a + b) / 2, (c + d) / 2, zr + PARH + 0.03));
    cp.castShadow = cp.receiveShadow = true; groups.bld.add(cp);
  });
  const pf = profMat(col, 1), t = 0.025;
  [[x0 - t, x1 + t, y0 - t, y0], [x0 - t, x1 + t, y1, y1 + t], [x0 - t, x0, y0, y1], [x1, x1 + t, y0, y1]].forEach(([a, b, c, d]) => {
    if (y0 === SPLIT && c === y0 - t) return;
    const k = new THREE.Mesh(new THREE.BoxGeometry(b - a, hc, d - c), pf); k.position.copy(P((a + b) / 2, (c + d) / 2, AL.h + hc / 2));
    k.castShadow = k.receiveShadow = true; groups.bld.add(k);
  });
  return zr;
}
const EPH = {uk: 'Висота — за рядами цегли на фото 26.10 (123523) і 27.10 (112733): 75 мм на ряд, ±0,15 м від даху південного блоку (сам дах +10,0 — оцінка). План 5,2 × 9,8 м — супутник.',
  en: 'Height from brick courses in photos 26.10 (123523) and 27.10 (112733): 75 mm per course, ±0.15 m from the south block roof (roof +10.0 is an estimate). Plan 5.2 × 9.8 m from satellite.'};
nadb(SPLIT, s3, 3.3, 0xd4dade, 1.08, I('Надбудова сходів — північна частина (вища)',
  `5,2 × 3,85 м, ≈3,3 м над дахом південного блоку (верх ≈+13,3). Плаский дах у парапеті ≈0,3 м, бітумна покрівля, бетонні плити по парапету. Знизу ≈1,1 м — світлий профлист. На північній стіні — інвертор, по східній частині даху — лоток з надбудови. ${EPH.uk}`,
  'Stair house — north part (higher)', `5.2 × 3.85 m, ≈3.3 m above the south block roof (top ≈+13.3). Flat roof within a ≈0.3 m parapet, bituminous roofing, concrete copings. Lower ≈1.1 m clad with light profiled sheet. The inverter is on the north wall; a cable tray runs along the east side of the roof. ${EPH.en}`));
nadb(s2, SPLIT, 2.25, 0x9aa2a8, 1.02, I('Надбудова сходів — південна частина (нижча)',
  `5,2 × 5,95 м, ≈2,25 м над дахом південного блоку (верх ≈+12,25). Плаский дах у парапеті ≈0,3 м, бітумна покрівля, бетонні плити по парапету. Знизу ≈1,0 м — сірий профлист. На південній стіні — 2 модулі. ${EPH.uk}`,
  'Stair house — south part (lower)', `5.2 × 5.95 m, ≈2.25 m above the south block roof (top ≈+12.25). Flat roof within a ≈0.3 m parapet, bituminous roofing, concrete copings. Lower ≈1.0 m clad with grey profiled sheet. Two modules on the south wall. ${EPH.en}`));
// ---------- основний блок: стіни + арка
(function () {
  const sh = new THREE.Shape(); sh.moveTo(AB.x0, 0); sh.lineTo(AB.x1, 0);
  const N = 40; for (let i = N; i >= 0; i--) { const x = AB.x0 + (AB.x1 - AB.x0) * i / N; sh.lineTo(x, zA(x)); }
  sh.lineTo(AB.x0, 0);
  const g = new THREE.ExtrudeGeometry(sh, {depth: AB.y1 - AB.y0, bevelEnabled: false, curveSegments: 1});
  const walls = new THREE.Mesh(g, [brickW(), brickVW()]); walls.position.set(0, 0, -AB.y1); walls.castShadow = walls.receiveShadow = true; walls.userData.noOcc = true; groups.bld.add(walls);
  walls.userData.info = I('Основний блок АБК', `${fx1(AB.x1 - AB.x0)} × ${fx1(AB.y1 - AB.y0)} м, 4 поверхи. Дах арковий, гребінь уздовж Пн–Пд: карниз +13,2 м, стріла 1,3 м (оцінка), покрівля бітумна рулонна. ${EST.uk}`,
    'Main block of the admin building', `${(AB.x1 - AB.x0).toFixed(1)} × ${(AB.y1 - AB.y0).toFixed(1)} m, 4 storeys. Arched roof, ridge N–S: eaves +13.2 m, rise 1.3 m (estimate), bituminous roll roofing. ${EST.en}`); picks.push(walls);
  const sh2 = new THREE.Shape(); sh2.moveTo(AB.x0, AB.h - 0.02);
  for (let i = 0; i <= N; i++) { const x = AB.x0 + (AB.x1 - AB.x0) * i / N; sh2.lineTo(x, zA(x) + 0.01); }
  for (let i = N; i >= 0; i--) { const x = AB.x0 + (AB.x1 - AB.x0) * i / N; sh2.lineTo(x, zA(x) - 0.05); }
  const rf = new THREE.Mesh(new THREE.ExtrudeGeometry(sh2, {depth: AB.y1 - AB.y0 - 0.02, bevelEnabled: false, curveSegments: 1}), rollM(1, 1));
  rf.position.set(0, 0, -AB.y1 + 0.01); rf.receiveShadow = true; rf.castShadow = true; rf.userData.noOcc = true; groups.bld.add(rf);
  const pW = box(pt, G.par.w, AB.y1 - AB.y0, mat.par, AB.x0 + pt / 2, (AB.y0 + AB.y1) / 2, AB.h + G.par.w / 2, null, I('Західний парапет основного блоку', '≈0,5 м над карнизом (оцінка); біля нього ринва з водою і пруток по парапету. Поручень 0,6 м — варіант «ДБН».', 'Main block west parapet', '≈0.5 m above eaves (estimate); water gutter and a rod along it. 0.6 m guardrail — DBN option.'));
  const pE = box(pt, G.par.e, AB.y1 - AB.y0, mat.par, AB.x1 - pt / 2, (AB.y0 + AB.y1) / 2, AB.h + G.par.e / 2, null, I('Східний парапет основного блоку', '≈0,7 м над карнизом (оцінка) — огородження не потрібне.', 'Main block east parapet', '≈0.7 m above eaves (estimate) — no guardrail needed.'));
  for (const yy of [AB.y0, AB.y1 - pt]) {
    const s3_ = new THREE.Shape(); s3_.moveTo(AB.x0, zA(AB.x0));
    for (let i = 0; i <= N; i++) { const x = AB.x0 + (AB.x1 - AB.x0) * i / N; s3_.lineTo(x, zA(x) + G.par.g); }
    for (let i = N; i >= 0; i--) { const x = AB.x0 + (AB.x1 - AB.x0) * i / N; s3_.lineTo(x, zA(x)); }
    const gp = new THREE.Mesh(new THREE.ExtrudeGeometry(s3_, {depth: pt, bevelEnabled: false, curveSegments: 1}), [brickW(), brickVW()]);
    gp.position.set(0, 0, -(yy + pt)); gp.castShadow = gp.receiveShadow = true; gp.userData.noOcc = true; groups.bld.add(gp);
  }
  pW.material = brickMat(AB.y1 - AB.y0, G.par.w); pE.material = brickMat(AB.y1 - AB.y0, G.par.e);
})();
// ---------- деталі за фото (декор — у тінь і генерацію не входить)
const wireMeshes = [];
(function () {
  const deco = (m, info) => { m.castShadow = m.receiveShadow = true; m.userData.noOcc = true; if (info) { m.userData.info = info; picks.push(m); } groups.bld.add(m); return m; };
  const bx = (w, h, d, mt, x, y, z, info) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt); m.position.copy(P(x, y, z)); return deco(m, info); };
  const iCop = I('Бетонні плити на парапеті', 'Плити ≈0,4 м завширшки з напуском, зверху лишайник і мох (фото 27.10: 110806, 110904, 110949, 110951). Внутрішня грань парапету обклеєна бітумом ≈0,3 м. Розміри — оцінка.',
    'Concrete parapet copings', 'Copings ≈0.4 m wide with overhang, lichen and moss on top (photos 27.10). Inner face of the parapet covered with bitumen ≈0.3 m. Dimensions estimated.');
  const bit = M(0x26292c, {roughness: 0.95}), CW = pt + 0.16, CT = 0.06;
  [[AB.x0 + pt / 2, null, AB.y0, AB.y1, AB.h + G.par.w, +1], [AB.x1 - pt / 2, null, AB.y0, AB.y1, AB.h + G.par.e, -1],
   [AL.x0 + pt / 2, null, AL.y0, AL.y1, AL.h + G.par.lo, +1], [AL.x1 - pt / 2, null, AL.y0, AL.y1, AL.h + G.par.lo, -1], [null, AL.y0 + pt / 2, AL.x0, AL.x1, AL.h + G.par.lo, +1]].forEach(([x, y, a, b, zt, sg]) => {
    const L = b - a, zr = x !== null ? (zt === AL.h + G.par.lo ? AL.h : AB.h) : AL.h;
    if (x !== null) { bx(CW, CT, L, copM(L), x, (a + b) / 2, zt + CT / 2, iCop); bx(0.012, Math.min(0.3, zt - zr), L, bit, x + sg * (pt / 2 + 0.006), (a + b) / 2, zr + Math.min(0.3, zt - zr) / 2); }
    else { bx(L, CT, CW, copM(L), (a + b) / 2, y, zt + CT / 2, iCop); bx(L, 0.3, 0.012, bit, (a + b) / 2, y + sg * (pt / 2 + 0.006), zr + 0.15); }
  });
  for (const yy of [AB.y0, AB.y1 - pt]) {
    const shp = new THREE.Shape(), N = 40; shp.moveTo(AB.x0 - 0.05, zA(AB.x0) + G.par.g);
    for (let i = 0; i <= N; i++) { const x = AB.x0 + (AB.x1 - AB.x0) * i / N; shp.lineTo(x, zA(x) + G.par.g + CT); }
    for (let i = N; i >= 0; i--) { const x = AB.x0 + (AB.x1 - AB.x0) * i / N; shp.lineTo(x, zA(x) + G.par.g); }
    const cp = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, {depth: CW, bevelEnabled: false, curveSegments: 1}), M(0xa7a397, {roughness: 0.9})); cp.position.set(0, 0, -(yy + pt / 2 + CW / 2)); deco(cp, iCop);
  }
  const iWire = I('Пруток по верху парапету', 'Сталевий пруток ≈8 мм на плитах парапету по периметру основного блоку (фото 27.10: 110806, 110904, 110949, 110951) — схоже на блискавкоприймач старої системи. У місці переходу лотка DC через південний парапет до нього приєднано провідник Cu 1×16 вирівнювання потенціалів.',
    'Rod along the parapet top', 'Steel rod ≈8 mm on the parapet copings around the main block (photos 27.10) — looks like an old lightning air-termination. Where the DC tray crosses the south parapet, a Cu 1×16 bonding conductor is connected to it.');
  const wireM = M(0x6b4a33, {roughness: 0.7, metalness: 0.4}), tube = (pts) => { const m = deco(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 4), 0.012, 5, false), wireM), iWire); wireMeshes.push(m); tag(m, 'bz'); return m; };
  tube([P(AB.x0 + pt / 2, AB.y0, AB.h + G.par.w + CT + 0.012), P(AB.x0 + pt / 2, AB.y1, AB.h + G.par.w + CT + 0.012)]);
  tube([P(AB.x1 - pt / 2, AB.y0, AB.h + G.par.e + CT + 0.012), P(AB.x1 - pt / 2, AB.y1, AB.h + G.par.e + CT + 0.012)]);
  for (const yy of [AB.y0 + pt / 2, AB.y1 - pt / 2]) { const pts = []; for (let i = 0; i <= 24; i++) { const x = AB.x0 + (AB.x1 - AB.x0) * i / 24; pts.push(P(x, yy, zA(x) + G.par.g + CT + 0.012)); } tube(pts); }
  const frame = M(0xf2f2ee, {roughness: 0.6}), glass = M(0x93a8b6, {roughness: 0.2, metalness: 0.1}), lint = M(0xb8b6ae, {roughness: 0.95});
  const acM = M(0xeef0ee, {roughness: 0.5}), acK = M(0x1f2224, {roughness: 0.6}), brM = M(0x9aa0a4, {metalness: 0.5, roughness: 0.5});
  const FACE = {W: {n: [-1, 0]}, S: {n: [0, -1]}, N: {n: [0, 1]}, E: {n: [1, 0]}};
  const at = (f, wall, u, d) => f === 'W' || f === 'E' ? [wall + FACE[f].n[0] * d, u] : [u, wall + FACE[f].n[1] * d];
  const slab = (f, wall, u, z, w, h, t, mt, d, info) => { const [x, y] = at(f, wall, u, d); return f === 'W' || f === 'E' ? bx(t, h, w, mt, x, y, z, info) : bx(w, h, t, mt, x, y, z, info); };
  function win(f, wall, u, z0, w, h, info, opt = {}) {
    const zc = z0 + h / 2;
    slab(f, wall, u, z0 + h + 0.1, w + 0.3, 0.2, 0.05, lint, 0.025, info); slab(f, wall, u, z0 - 0.04, w + 0.12, 0.05, 0.12, lint, 0.05);
    slab(f, wall, u, zc, w, h, 0.06, frame, 0.03, info); slab(f, wall, u, zc, w - 0.12, h - 0.12, 0.07, opt.dark ? acK : glass, 0.035, info);
    const nm = opt.panes || (w > 1.9 ? 3 : 2); for (let k = 1; k < nm; k++) slab(f, wall, u - w / 2 + w * k / nm, zc, 0.05, h - 0.12, 0.075, frame, 0.04);
  }
  function door(f, wall, u, w, h, info) { slab(f, wall, u, h / 2, w, h, 0.06, frame, 0.03, info); slab(f, wall, u, h * 0.62, w - 0.14, h * 0.62, 0.07, glass, 0.035, info); slab(f, wall, u, h * 0.2, w - 0.14, 0.04, 0.075, frame, 0.04); if (w > 1.1) slab(f, wall, u, h / 2, 0.05, h - 0.1, 0.075, frame, 0.04); }
  function ac(f, wall, u, z, info, dark) { slab(f, wall, u, z, 0.8, 0.55, 0.28, dark ? acK : acM, 0.2, info); for (const du of [-0.3, 0.3]) slab(f, wall, u + du, z - 0.29, 0.04, 0.03, 0.36, brM, 0.18); }
  const iWs = I('Вікна південного фасаду', 'Південний блок, 3 поверхи: на 2-му і 3-му — по 4 вікна, унизу — вхід із рожевою стіною і козирком, праворуч — вікно (фото 26.10, 27.10). Розміри — за пропорціями (±0,3 м), положення ±1 м.',
    'South facade windows', 'South block, 3 storeys: 4 windows on the 2nd and 3rd floors, entrance with a pink wall and canopy below, a window to the right (photos 26.10, 27.10). Sizes from proportions (±0.3 m), positions ±1 m.');
  const iWw = I('Вікна західного фасаду', 'Фасад уздовж проїзду до ТП-5913: внизу вітрини складу і двері, на поверхах — вікна з кондиціонерами. Розміри і положення — оцінка, ±1 м.', 'West facade windows', 'Facade along the driveway to substation TP-5913: shop windows and doors below, windows with air-conditioners above. Sizes and positions estimated, ±1 m.');
  const iWn = I('Північний фасад', 'Вікна лише в східній половині, між ними — два оцинковані вентканали; унизу — двері з козирком і рольворота; західна половина глуха (фото 26.10 144815). Положення ±1 м.', 'North facade', 'Windows only in the east half with two galvanised ducts between them; door with canopy and roller gate below; west half blank (photo 26.10). Positions ±1 m.');
  const iAC = I('Кондиціонери на фасадах', 'Зовнішні блоки на кронштейнах під вікнами (фото 26.10, 27.10). Кількість і положення — оцінка.', 'Air-conditioners on facades', 'Outdoor units on brackets under windows (photos 26.10, 27.10). Number and positions estimated.');
  const AW = AL.x0, BW = AB.x0, AS = AL.y0, BN = AB.y1;
  for (const z0 of [4.6, 7.1]) for (const x of [110.2, 113.1, 118.3, 121.6]) win('S', AS, x, z0, 1.4, 1.5, iWs);
  win('S', AS, 123.0, 0.9, 1.3, 1.4, iWs);
  { const pink = M(0xcfa79c, {roughness: 0.95}), canM = M(0xd9dcde, {metalness: 0.4, roughness: 0.5}), postM = M(0x6d7377, {metalness: 0.5, roughness: 0.5});
    slab('S', AS, 118.25, 1.45, 5.2, 2.9, 0.06, pink, 0.03, iWs);
    door('S', AS, 116.9, 1.0, 2.15, iWs); door('S', AS, 119.4, 1.2, 2.15, iWs);
    bx(5.6, 0.12, 2.1, canM, 118.25, AS - 1.05, 3.0, I('Козирок над входом', 'Сірий металевий козирок ≈5,6 × 2,1 м на двох похилих стійках (фото 27.10). Розміри — оцінка.', 'Entrance canopy', 'Grey steel canopy ≈5.6 × 2.1 m on two inclined posts (photo 27.10). Dimensions estimated.'));
    for (const x of [116.0, 120.5]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.1, 8), postM); st.position.copy(P(x + (x < 118 ? 0.2 : -0.2), AS - 1.75, 1.5)); st.rotation.z = x < 118 ? -0.12 : 0.12; deco(st); }
    bx(3.2, 0.3, 1.2, lint, 118.6, AS - 0.6, 0.15); }
  { const cm = M(0x1d1f21, {roughness: 0.6}), pts = []; for (let x = AL.x0 - 0.3; x <= 126; x += 0.8) pts.push(P(x, AS - 0.08, 3.65 - 0.07 * Math.sin(Math.PI * ((x - AL.x0) % 2.4) / 2.4)));
    deco(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 4, 0.012, 5, false), cm), I('Кабель із лампами на південному фасаді', 'На гачках ≈3,6 м, з патронами для ламп через ≈0,8 м; на Пд-Зх куті — прожектор (фото 27.10).', 'Lamp cable on the south facade', 'On hooks at ≈3.6 m with lamp holders every ≈0.8 m; floodlight at the SW corner (photo 27.10).'));
    for (let x = AL.x0 + 0.5; x <= 125.5; x += 0.8) slab('S', AS, x, 3.55, 0.05, 0.12, 0.05, cm, 0.1);
    slab('S', AS, AL.x0 + 1.0, 4.0, 0.3, 0.25, 0.12, acK, 0.1); }
  win('W', AW, 8.3, 0.8, 2.4, 1.7, iWw, {panes: 2}); win('W', AW, 11.4, 0.8, 1.7, 1.6, iWw); door('W', AW, 14.2, 1.3, 2.25, iWw); door('W', AW, 18.6, 1.3, 2.25, iWw);
  for (const z0 of [4.5, 7.2]) for (const y of [11.4, 15.0]) win('W', AW, y, z0, 1.2, 1.4, iWw);
  ac('W', AW, 9.6, 3.6, iAC, true); ac('W', AW, 11.4, 4.1, iAC); ac('W', AW, 15.0, 6.9, iAC);
  const COLS = [24.1, 27.1, 30.8, 33.3, 36.4, 38.8, 41.3];
  COLS.forEach((y, k) => { for (const z0 of [4.5, 7.2, 10.0]) win('W', BW, y, z0, k ? 1.05 : 1.5, k ? 1.4 : 1.6, iWw);
    if (k !== 0) win('W', BW, y, 0.9, 1.05, 1.3, iWw); if (k % 2 === 1) ac('W', BW, y, 4.2, iAC); if (k % 2 === 0) ac('W', BW, y, 6.9, iAC); if (k % 3 === 1) ac('W', BW, y, 9.7, iAC); });
  door('W', BW, 22.3, 1.3, 2.25, iWw);
  { const pm = M(0x222527, {roughness: 0.6}); for (const y of [21.4, 21.8]) { const pp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 12.2, 8), pm); pp.position.copy(P(BW - 0.12, y, 6.1)); deco(pp, I('Труби на західному фасаді', 'Дві чорні вертикальні труби від землі під карниз (фото 26.10) — водостік чи кабельні стояки, з фото не видно.', 'Pipes on the west facade', 'Two black vertical pipes from ground to eaves (photo 26.10) — drainpipes or cable risers, not clear from photos.')); }
    const pl2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.4), pm); pl2.position.copy(P(BW - 0.55, 23.0, 7.0)); deco(pl2, iAC); }
  for (const x of [126.4, 124.9, 122.7, 120.7]) for (const z0 of [7.2, 10.0]) win('N', BN, x, z0, 1.1, 1.4, iWn);
  for (const x of [126.0, 120.7]) win('N', BN, x, 4.5, 1.1, 1.4, iWn);
  const ductM = M(0xb4bcc1, {metalness: 0.3, roughness: 0.45});
  for (const x of [123.8, 121.7]) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12.4 - 2.6 + 0.9, 0.45), ductM); d.position.copy(P(x, BN + 0.3, (2.6 + 13.3) / 2)); deco(d, I('Оцинкований вентканал', 'Два вертикальні канали ≈0,6 × 0,45 м від ≈2,6 м до верху парапету (фото 26.10). Розміри — оцінка.', 'Galvanised duct', 'Two vertical ducts ≈0.6 × 0.45 m from ≈2.6 m to the parapet top (photo 26.10). Dimensions estimated.')); }
  door('N', BN, 127.2, 1.2, 2.3, iWn); bx(1.8, 0.06, 1.4, M(0x1e2124, {roughness: 0.6}), 127.0, BN + 0.7, 2.75, iWn);
  slab('N', BN, 121.5, 1.35, 2.4, 2.7, 0.05, M(0xe4e5e2, {roughness: 0.7}), 0.03, iWn);
  { const inf = M(0xd9cf9e, {roughness: 0.95}); slab('N', BN, 115.4, 1.6, 2.6, 1.6, 0.02, inf, 0.012, iWn); slab('N', BN, 118.4, 8.1, 1.1, 2.4, 0.02, M(0xb86d4a, {roughness: 0.95}), 0.012, iWn); }
  const iCab = I('Кабель на західному фасаді', 'Чорний кабель на гачках під карнизом, з двома спусками донизу (фото 26.10). Чий і куди йде — немає в даних.', 'Cable on the west facade', 'Black cable on hooks under the eaves with two drops (photo 26.10). Owner and destination unknown.');
  const cabM = M(0x1d1f21, {roughness: 0.6}), cab = pts => deco(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 6, 0.015, 5, false), cabM), iCab);
  const xc = AB.x0 - 0.06, run = []; for (let y = 44.6; y >= 32.0 - 1e-6; y -= 0.9) { const k = ((44.6 - y) / 3.15) % 1; run.push(P(xc, y, 12.3 - 0.25 * Math.sin(Math.PI * k) - (44.6 - y) * 0.012)); }
  cab(run); cab([P(xc, 44.6, 12.35), P(xc, 44.6, 9.0), P(xc, 44.7, 8.0)]); cab([P(xc, 32.0, 12.2), P(xc, 32.0, 10.6), P(xc, 32.05, 8.0)]);
  const iACe = I('Кондиціонери на східному фасаді', '≈13 зовнішніх блоків уздовж східного фасаду під парапетом (фото 27.10 — знято згори). Висота і крок — оцінка.', 'Air-conditioners on the east facade', '≈13 outdoor units along the east facade below the parapet (photos 27.10, taken from above). Height and spacing estimated.');
  for (let i = 0; i < 13; i++) ac('E', AB.x1, 21.8 + i * 1.85, [10.9, 8.1, 5.3][i % 3], iACe);
})();
// ---------- вентшахти і вентвиходи
const tumbS = M(0x2f3336, {roughness: 0.95}), tumbT = M(0x66704a, {roughness: 1}), rust = M(0xa4562f, {roughness: 0.6, metalness: 0.3});
G.vents.forEach(([x, y, r, h, kind, src]) => {
  const z0 = zA(x), add = (geo, m, zc) => { const c = new THREE.Mesh(geo, m); c.position.copy(P(x, y, zc)); c.castShadow = c.receiveShadow = true; groups.bld.add(c); return c; };
  let parts;
  if (kind === 'o') {
    parts = [add(new THREE.CylinderGeometry(r - 0.03, r - 0.03, h - 0.06, 24), tumbS, z0 + (h - 0.06) / 2), add(new THREE.CylinderGeometry(r, r, 0.06, 24), rust, z0 + h - 0.03)];
    parts.forEach(c => c.userData.info = I('Вентвихід з рудою кришкою', `Низька кругла тумба Ø≈${fx(2 * r)} м, ≈${fx(h)} м над покрівлею, руда металева кришка (фото 27.10). X ${fx(x)}, Y ${fx(y)} м (±0,5).`, 'Vent with rusty cap', `Low round curb Ø≈${2 * r} m, ≈${h} m above the roof, rusty steel cap (photo 27.10). X ${x}, Y ${y} m (±0.5).`));
  } else if (kind === 'h') {
    const ped = add(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 24), [tumbS, tumbT, tumbS], z0 + 0.15);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 20, 1, false, 0, Math.PI), mat.zn); cap.rotation.z = Math.PI / 2; cap.rotation.y = Math.PI / 2;
    cap.position.copy(P(x, y, z0 + 0.3 + 0.12)); cap.castShadow = true; groups.bld.add(cap);
    const bs = add(new THREE.BoxGeometry(0.9, 0.12, 0.64), mat.zn, z0 + 0.36); bs.rotation.y = Math.PI / 2;
    parts = [ped, cap, bs];
    parts.forEach(c => c.userData.info = I('Оцинкований ковпак на тумбі', `Півциліндр ≈0,9 × 0,64 м на круглій тумбі, верх ≈${fx(h)} м над покрівлею (фото 27.10). X ${fx(x)}, Y ${fx(y)} м. Навколо — 0,3 м без модулів.`, 'Galvanised hood on a curb', `Half-cylinder ≈0.9 × 0.64 m on a round curb, top ≈${h} m above the roof (photo 27.10). X ${x}, Y ${y} m. 0.3 m clearance to modules.`));
  } else {
    parts = [add(new THREE.CylinderGeometry(r, r, h, 28), [tumbS, tumbT, tumbS], z0 + h / 2)];
    parts[0].userData.info = I('Вентшахта на арці', `Кругла тумба Ø${fx(2 * r)} м (рулетка), ≈${fx(h)} м над покрівлею, обклеєна бітумом. Навколо — 0,3 м без модулів. X ${fx(x)}, Y ${fx(y)} м.`, 'Vent shaft on the arch', `Round curb Ø${2 * r} m (measured), ≈${h} m above the roof, bitumen-covered. 0.3 m clearance to modules. X ${x}, Y ${y} m.`);
  }
  parts.forEach(c => picks.push(c));
  const moss = new THREE.Mesh(new THREE.RingGeometry(r * 0.98, r + 0.28, 28), M(0xa8a24c, {roughness: 1, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2}));
  moss.rotation.x = -Math.PI / 2; moss.position.copy(P(x, y, z0 + 0.01)); moss.userData.noOcc = true; groups.bld.add(moss);
});
G.boxes.forEach(([x, y, dx, dy, h], i) => { if (!i) {
    const hd = new THREE.Mesh(new THREE.BoxGeometry(dx + 0.16, 0.05, dy + 0.3), mat.zn); hd.position.copy(P(x, y + 0.12, zA(x) + h + 0.1)); hd.rotation.x = 0.35; hd.castShadow = true; hd.userData.noOcc = true; groups.bld.add(hd); }
  box(dx, h, dy, mat.zn, x, y, zA(x) + h / 2, null, I(i ? 'Низький вентвихід' : 'Високий вентвихід', `${fx(dx)} × ${fx(dy)} м, висота ≈${fx(h)} м над покрівлею (оцінка). Оцинкований.`, i ? 'Low vent outlet' : 'High vent outlet', `${dx} × ${dy} m, height ≈${h} m above the roof (estimate). Galvanised.`)); });
// ---------- контекст: край цеху і ТП-5913
const cx0 = 84, cx1 = 96.64;
box(cx1 - cx0, 15.9, 60, mat.ctx, (cx0 + cx1) / 2, 25, 15.9 / 2, groups.ctx, I('Цех (край, для орієнтації)', 'Східна стіна цеху — X 96,6 м, за 11,7 м від АБК. Покрівля в ендовах +15,9 м, гребені до +18,15 м. Тінь на АБК дає лише ввечері.', 'Workshop (edge, for orientation)', 'Workshop east wall at X 96.6 m, 11.7 m from the admin building. Roof valleys +15.9 m, ridges up to +18.15 m. Shades the building only in the evening.'));
box(103 - 96.64, 4.5, 35, mat.tp, (96.64 + 103) / 2, (-0.4 + 34.6) / 2, 2.25, groups.ctx, I('ТП-5913', 'Прибудова з жовтої цегли вздовж східного фасаду цеху, ≈4,5 м заввишки (оцінка).', 'Substation TP-5913', 'Yellow-brick annex along the workshop east facade, ≈4.5 m high (estimate).'));
// ================= безпека покрівлі за ДБН: П1 на арку з площадкою, огородження, П1 на надбудову, доріжки
(function () {
  const L = D.ladP1, y = AB.y0 - L.off, z0 = AL.h, z1 = L.ztop + 1.0, hw = L.w / 2, steel = M(0x6f7880, {roughness: 0.5, metalness: 0.6});
  const info = I('Пожежна драбина П1 на арку', `Стаціонарна вертикальна металева драбина з нижнього даху (+10,0) на арку: перепад ≈${fx(Math.round((L.ztop - AL.h) * 10) / 10)} м — тип П1 (ДБН В.1.1-7:2016 п. 8.8–8.9), не ближче 1 м від вікон і дверей (п. 8.10). Ширина 0,6 м, 0,2 м від стіни, поручні на 1 м вище парапету. Довжина в кошторисі — 5,8 м.`,
    'Fire ladder P1 to the arch roof', `Fixed vertical steel ladder from the lower roof (+10.0) to the arch: height ≈${(Math.round((L.ztop - AL.h) * 10) / 10)} m — type P1 (DBN V.1.1-7:2016 cl. 8.8–8.9), at least 1 m from windows and doors (cl. 8.10). Width 0.6 m, 0.2 m off the wall, handrails 1 m above the parapet. 5.8 m in the estimate.`);
  const infoP = I('Площадка з огорожею 0,6 м', 'Площадка перед виходом на покрівлю арки, огорожа 0,6 м (ДБН В.1.1-7:2016 табл. 5), у колонці зв\'язки між доріжками.', 'Landing with 0.6 m guard', 'Landing at the exit onto the arch roof with a 0.6 m guard (DBN V.1.1-7:2016 table 5), in the tie column between walkways.');
  const add = (geo, x, yy, z, rot, tg = 'p1') => { const m = new THREE.Mesh(geo, steel); m.position.copy(P(x, yy, z)); if (rot) m.rotation.set(...rot); m.castShadow = true; m.userData.info = tg === 'plat' ? infoP : info; groups.safety.add(m); picks.push(m); tag(m, tg); return m; };
  for (const dx of [-hw, hw]) add(new THREE.BoxGeometry(0.05, z1 - z0, 0.05), L.x + dx, y, (z0 + z1) / 2);
  for (let z = z0 + 0.3; z < L.ztop + 0.05; z += 0.3) add(new THREE.CylinderGeometry(0.012, 0.012, L.w, 6), L.x, y, z, [0, 0, Math.PI / 2]);
  for (const dx of [-hw, hw]) add(new THREE.BoxGeometry(0.04, 0.04, 0.55), L.x + dx, AB.y0 + 0.07, z1 - 0.02);
  const qx0 = L.cx0 + 0.06, qx1 = L.cx1 - 0.06, qw = qx1 - qx0, qc = (qx0 + qx1) / 2, py0 = AB.y0 + pt + 0.03, pz = zA(qc) + 0.02;
  add(new THREE.BoxGeometry(qw, 0.04, 0.8), qc, py0 + 0.4, pz, null, 'plat');
  for (const [x, yy] of [[qx0, py0], [qx1, py0], [qx0, py0 + 0.8], [qx1, py0 + 0.8]]) add(new THREE.BoxGeometry(0.04, 0.6, 0.04), x, yy, pz + 0.3, null, 'plat');
  add(new THREE.BoxGeometry(0.04, 0.04, 0.8), qx0, py0 + 0.4, pz + 0.6, null, 'plat'); add(new THREE.BoxGeometry(0.04, 0.04, 0.8), qx1, py0 + 0.4, pz + 0.6, null, 'plat');
})();
(function () {
  const steel = M(0x8f979e, {roughness: 0.5, metalness: 0.6}), HR = 0.6, info = I('Огородження покрівлі 0,6 м', 'Будинок понад 10 м (карниз +13,2): огородження по периметру не нижче 600 мм, металеве — ДБН В.1.1-7:2016 п. 8.12, ДБН В.2.6-220:2017 п. 6.1.2. Парапети заходу і торців ≈0,5 м — поручень на 0,6 м над покрівлею; схід ≈0,7 м — досить.',
    'Roof guardrail 0.6 m', 'Building over 10 m (eaves +13.2): perimeter guard at least 600 mm, steel — DBN V.1.1-7:2016 cl. 8.12, DBN V.2.6-220:2017 cl. 6.1.2. West and end parapets ≈0.5 m — rail at 0.6 m above the roof; east ≈0.7 m — sufficient.');
  const seg = (a, b) => { const v = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, v.length(), 6), steel); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); m.castShadow = true; m.userData.info = info; groups.safety.add(m); picks.push(m); tag(m, 'rail'); };
  const xw = AB.x0 + pt / 2; for (let y = AB.y0; y < AB.y1 - 0.01; y += 1.5) { const y2 = Math.min(AB.y1, y + 1.5); seg(P(xw, y, AB.h + HR), P(xw, y2, AB.h + HR)); seg(P(xw, y, AB.h + G.par.g), P(xw, y, AB.h + HR)); }
  for (const yy of [AB.y0 + pt / 2, AB.y1 - pt / 2]) { const N = 26;
    for (let i = 0; i < N; i++) { const xa = AB.x0 + (AB.x1 - AB.x0) * i / N, xb = AB.x0 + (AB.x1 - AB.x0) * (i + 1) / N;
      if (yy < 21 && xb > D.ladP1.x - 0.5 && xa < D.ladP1.x + 0.5) continue;
      seg(P(xa, yy, zA(xa) + HR), P(xb, yy, zA(xb) + HR)); if (i % 2 === 0) seg(P(xa, yy, zA(xa) + G.par.g), P(xa, yy, zA(xa) + HR)); } }
})();
(function () {
  const steel = M(0x6f7880, {roughness: 0.5, metalness: 0.6}), rail = M(0x8f979e, {roughness: 0.5, metalness: 0.6}), NB = D.nad;
  const infoL = I('Драбина П1 на надбудову', 'Перепади: нижній дах → пд. частина ≈2,25 м, пд. → пн. частина ≈1,05 м — понад 1 м, драбина П1 (ДБН В.1.1-7:2016 п. 8.8). Потрібна для обслуговування модулів на надбудові. Перша — на західній стіні біля межі частин, друга — на південній стіні пн. частини. Разом у кошторисі 5,6 м.',
    'Ladder P1 to the stair house', 'Height differences: lower roof → south part ≈2.25 m, south → north part ≈1.05 m — over 1 m, so ladder P1 (DBN V.1.1-7:2016 cl. 8.8). Needed to service the stair house modules. First on the west wall at the part boundary, second on the south wall of the north part. 5.6 m in total in the estimate.');
  const add = (geo, x, y, z, rot, mt, info, tg) => { const m = new THREE.Mesh(geo, mt); m.position.copy(P(x, y, z)); if (rot) m.rotation.set(...rot); m.castShadow = true; m.userData.info = info; groups.safety.add(m); picks.push(m); tag(m, tg); return m; };
  NB.lad.forEach(L => {
    const z1 = L.ztop + 1.0, hw = 0.3;
    for (const d of [-hw, hw]) { const [x, y] = L.axis === 'x' ? [L.x, L.y + d] : [L.x + d, L.y]; add(new THREE.BoxGeometry(0.05, z1 - L.z0, 0.05), x, y, (L.z0 + z1) / 2, null, steel, infoL, 'p1'); }
    for (let z = L.z0 + 0.3; z < L.ztop + 0.05; z += 0.3) add(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), L.x, L.y, z, L.axis === 'x' ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2], steel, infoL, 'p1');
  });
  const infoR = I('Огородження надбудови 0,6 м', 'Покрівлі надбудови вище 10 м (+11,95 і +13,0), парапети ≈0,3 м — поручень на 0,6 м над покрівлею (ДБН В.1.1-7:2016 п. 8.12, ДБН В.2.6-220:2017 п. 6.1.2). Розриви — на виходах драбин.', 'Stair house guardrail 0.6 m', 'Stair house roofs above 10 m (+11.95 and +13.0), parapets ≈0.3 m — rail 0.6 m above the roof (DBN V.1.1-7:2016 cl. 8.12, DBN V.2.6-220:2017 cl. 6.1.2). Gaps at ladder exits.');
  const seg = (a, b) => { const v = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, v.length(), 6), rail); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); m.castShadow = true; m.userData.info = infoR; groups.safety.add(m); picks.push(m); tag(m, 'rail'); };
  const ring = (pts, zr, gaps) => {
    const H = zr + 0.6, Hp = zr + NB.parh;
    for (let k = 0; k < pts.length - 1; k++) {
      const [xa, ya] = pts[k], [xb, yb] = pts[k + 1], L = Math.hypot(xb - xa, yb - ya), n = Math.max(1, Math.round(L / 1.2));
      for (let i = 0; i < n; i++) {
        const x0 = xa + (xb - xa) * i / n, y0 = ya + (yb - ya) * i / n, x1 = xa + (xb - xa) * (i + 1) / n, y1 = ya + (yb - ya) * (i + 1) / n, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
        if (gaps.some(([g0, g1, h0, h1]) => xm >= g0 && xm <= g1 && ym >= h0 && ym <= h1)) continue;
        seg(P(x0, y0, H), P(x1, y1, H)); seg(P(x0, y0, Hp), P(x0, y0, H));
      }
    }
  };
  const S0_ = G.stair[0], S1_ = G.stair[1], S2_ = G.stair[2], S3_ = G.stair[3], h = NB.wt / 2, SP = NB.split, L1 = NB.lad[0], L2 = NB.lad[1];
  ring([[S0_ + h, SP], [S0_ + h, S2_ + h], [S1_ - h, S2_ + h], [S1_ - h, SP]], NB.zrs, [[S0_ - 0.1, S0_ + 0.5, L1.y - 0.45, L1.y + 0.45]]);
  ring([[S0_ + h, SP + h], [S0_ + h, S3_ - h], [S1_ - h, S3_ - h], [S1_ - h, SP + h], [S0_ + h, SP + h]], NB.zrn, [[L2.x - 0.45, L2.x + 0.45, SP - 0.1, SP + 0.5]]);
})();
(function () {
  const wm = M(0xd8d0b8, {roughness: 1, polygonOffset: true, polygonOffsetFactor: -2});
  const info = k => k === 'low' ? I('Прохід до драбини', 'Від надбудови до драбини П1 — смуга вздовж східної стіни надбудови (≈1,0 м) і між надбудовою та основним блоком. Гумові плити 0,8 м.', 'Path to the ladder', 'From the stair house to ladder P1 — strip along the stair house east wall (≈1.0 m) and between the stair house and the main block. Rubber tiles 0.8 m.')
    : I('Ходова доріжка 0,8 м', 'ДБН В.2.6-220:2017 п. 7.1.3: на покрівлях з обладнанням, яке потребує обслуговування, — ходові доріжки, що не заважають стоку води. Дві доріжки схід–захід (після 3-го і 6-го рядів) і зв\'язка від драбини: кожен модуль не далі 2 рядів від доріжки. Гумові плити 500×500×20, разом 63 м².',
      'Walkway 0.8 m', 'DBN V.2.6-220:2017 cl. 7.1.3: roofs with equipment needing service get walkways that do not obstruct drainage. Two E–W walkways (after rows 3 and 6) and a tie from the ladder: each module at most 2 rows from a walkway. Rubber tiles 500×500×20, 63 m² in total.');
  D.walks.forEach(w => {
    const g = new THREE.BufferGeometry(), pos = [], idx = [];
    if (w.kind === 'arch') { const N = 30; for (let i = 0; i <= N; i++) { const x = w.x0 + (w.x1 - w.x0) * i / N, z = zA(x) + 0.015; pos.push(x, z, -w.y0, x, z, -w.y1); if (i) { const a = 2 * i; idx.push(a - 2, a, a - 1, a - 1, a, a + 1); } } }
    else { const za = w.kind === 'low' ? AL.h + 0.012 : zA(w.x0) + 0.015, zb = w.kind === 'low' ? AL.h + 0.012 : zA(w.x1) + 0.015; pos.push(w.x0, za, -w.y0, w.x0, za, -w.y1, w.x1, zb, -w.y0, w.x1, zb, -w.y1); idx.push(0, 2, 1, 1, 2, 3); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, wm); m.material.side = THREE.DoubleSide; m.receiveShadow = true; m.userData.noOcc = true; m.userData.info = info(w.kind); groups.safety.add(m); picks.push(m); tag(m, 'walk');
  });
})();
// ================= модулі (лише «ДБН»): арка з доріжками, нижній дах «домік», надбудова «домік», південні стіни
const T = 0.033, LIFT = 0.12;
const DROP = new Set(DB.drop.map(i => DB.mods[i].src + ':' + DB.mods[i].i));
const MODREC = {}; DB.mods.forEach((m, j) => { m.j = j; MODREC[m.src + ':' + m.i] = m; });
function modInfo(where, whereEn, extra, extraEn) { return I(where, extra, whereEn, extraEn); }
(function buildArch() {
  D.archD.forEach((m, idx) => {
    const xm = (m.xa + m.xb) / 2, zm = (m.za + m.zb) / 2, k = (m.zb - m.za) / (m.xb - m.xa), ym = (m.y0 + m.y1) / 2;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(G.dm, T, G.lm), pv[m.face]); mesh.position.copy(P(xm, ym, zm + LIFT + T / 2)); mesh.rotation.z = Math.atan(k);
    mesh.castShadow = mesh.receiveShadow = true; groups.arch.add(mesh);
    Object.assign(mesh.userData, {base: pv[m.face], face0: pv[m.face], dat: m, src: 'archD', idx, key: 'archD:' + idx});
    mesh.userData.info = modInfo(`Модуль на арці · ${m.face === 'E' ? 'схід' : 'захід'} ${fx(m.tilt)}°`, `Arch module · ${m.face === 'E' ? 'east' : 'west'} ${m.tilt}°`,
      `Колонка ${m.col + 1} з 13, вертикально: 2 384 мм уздовж арки, 1 303 мм по дузі. X ${fx(m.xa.toFixed(2))}–${fx(m.xb.toFixed(2))}, Y ${fx(m.y0.toFixed(2))}–${fx(m.y1.toFixed(2))} м. Лаги 41×41 на блоках 300×300×60, як на даху цеху.`,
      `Column ${m.col + 1} of 13, portrait: 2384 mm along the arch, 1303 mm across. X ${m.xa.toFixed(2)}–${m.xb.toFixed(2)}, Y ${m.y0.toFixed(2)}–${m.y1.toFixed(2)} m. Rails 41×41 on 300×300×60 blocks, as on the shop roof.`);
    picks.push(mesh); tag(mesh, 'mod');
  });
})();
(function buildLags() {
  const list = D.archD, grp = groups.mount;
  const cols = {}; list.forEach(m => { (cols[m.col] = cols[m.col] || {xa: m.xa, xb: m.xb, rows: new Set()}).rows.add(m.y0); });
  const ids = Object.keys(cols).map(Number).sort((a, b) => a - b); const lines = [];
  ids.forEach((c, i) => {
    const cur = cols[c], prev = cols[ids[i - 1]], adj = prev && c - ids[i - 1] === 1;
    if (prev && !adj) lines.push({x: prev.xb - 0.012, rows: prev.rows});
    lines.push({x: adj ? (prev.xb + cur.xa) / 2 : cur.xa + 0.012, rows: new Set([...cur.rows, ...(adj ? prev.rows : [])])});
    if (i === ids.length - 1) lines.push({x: cur.xb - 0.012, rows: cur.rows});
  });
  const lagG = new THREE.BoxGeometry(0.041, 0.041, G.lm + 0.022), blkG = new THREE.BoxGeometry(0.3, 0.06, 0.3);
  let nl = 0, nb = 0; lines.forEach(l => { nl += l.rows.size; nb += l.rows.size * 2; });
  const Lm = new THREE.InstancedMesh(lagG, mat.lag, Math.max(nl, 1)), Bm = new THREE.InstancedMesh(blkG, mat.blk, Math.max(nb, 1));
  const o = new THREE.Object3D(); let a = 0, b = 0;
  lines.forEach(l => l.rows.forEach(y0 => {
    const z = zA(l.x); o.rotation.set(0, 0, 0);
    o.position.copy(P(l.x, y0 + G.lm / 2, z + 0.065 + 0.0205)); o.updateMatrix(); Lm.setMatrixAt(a++, o.matrix);
    for (const dy of [0.575, 1.775]) { o.position.copy(P(l.x, y0 + dy, z + 0.03)); o.updateMatrix(); Bm.setMatrixAt(b++, o.matrix); }
  }));
  Lm.count = a; Bm.count = b;
  [Lm, Bm].forEach(x => { x.castShadow = x.receiveShadow = true; grp.add(x); });
  Lm.userData.info = I('Лага 41×41×1,5', 'Спільна для двох сусідніх колонок модулів, як на даху цеху (варіант Б): лаги 4 800 / 2 400 мм, гільзи з муфтою і шпильки M10 між лагами на кожному модулі, крайні профілі з кутниками. Специфікація — розділ B.',
    'Rail 41×41×1.5', 'Shared by two adjacent module columns, as on the shop roof (variant B): 4800 / 2400 mm rails, sleeves with couplings and M10 rods between rails at every module, edge profiles with angles. Bill of materials — section B.');
  Bm.userData.info = I('Баластний блок 300×300×60', '13 кг, з муфтою і матом: 2 на модуль на кожній лазі, під крайні профілі — без мата. Разом з «доміком» і опорами лотків — 494 шт.', 'Ballast block 300×300×60', '13 kg with coupling and mat: 2 per module on each rail, edge profiles without mat. 494 in total with dual-tilt and tray supports.');
  picks.push(Lm, Bm); tag(Lm, 'lag'); tag(Lm, 'arch'); tag(Bm, 'blk'); tag(Bm, 'arch');
})();
const frames = [];
const iFrame = I('Опори «доміку» 15°', 'Трикутники ГалКат 15° схід–захід, П-кронштейни, 4 притиски на модуль; низ модуля ≈0,15 м над покрівлею, 4 баластні блоки на модуль. Специфікація — розділ C.', 'Dual-tilt 15° supports', 'GalKat 15° triangles east–west, U-brackets, 4 clamps per module; module bottom ≈0.15 m above the roof, 4 ballast blocks per module. Bill of materials — section C.');
(function buildLow() {
  const tg = 15 * Math.PI / 180;
  D.low.forEach((m, idx) => {
    const sg = m.face === 'W' ? -1 : 1, xm = (m.xa + m.xb) / 2, ym = (m.y0 + m.y1) / 2, zc = AL.h + G.hlow + G.rise / 2, key = 'low:' + idx, out = DROP.has(key) || !m.used;
    let mesh;
    if (!out) {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(G.dm, T, G.lm), pv[m.face]); mesh.castShadow = mesh.receiveShadow = true;
      Object.assign(mesh.userData, {base: pv[m.face], face0: pv[m.face], dat: m, src: 'low', idx, key});
      mesh.userData.info = modInfo(`Модуль на нижньому даху · ${m.face === 'W' ? 'захід' : 'схід'} 15°`, `Lower roof module · ${m.face === 'W' ? 'west' : 'east'} 15°`,
        `«Домік» 15°: модуль горизонтально (2 384 мм уздовж Пн–Пд), низ ≈0,15 м над покрівлею. X ${fx(m.xa.toFixed(2))}–${fx(m.xb.toFixed(2))}, Y ${fx(m.y0.toFixed(2))}–${fx(m.y1.toFixed(2))} м.`,
        `Dual-tilt 15°: landscape (2384 mm along N–S), bottom ≈0.15 m above the roof. X ${m.xa.toFixed(2)}–${m.xb.toFixed(2)}, Y ${m.y0.toFixed(2)}–${m.y1.toFixed(2)} m.`);
      frames.push(m); picks.push(mesh); tag(mesh, 'mod');
    } else {
      mesh = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(G.dm, T, G.lm)), new THREE.LineDashedMaterial({color: 0x9aa5ad, dashSize: 0.25, gapSize: 0.15}));
      mesh.computeLineDistances();
      const inf = I('Місце без модуля', 'У «ДБН» 134 місця, у стрінги по 12 входить 132: це місце лишається вільним (біля драбини, у тіні надбудови).', 'Place without a module', 'The DBN layout has 134 places, 132 fit into strings of 12: this place stays empty (next to the ladder, shaded by the stair house).');
      const hit = new THREE.Mesh(new THREE.BoxGeometry(G.dm, 0.05, G.lm), new THREE.MeshBasicMaterial({visible: false})); mesh.add(hit); hit.userData.info = inf; picks.push(hit);
    }
    mesh.position.copy(P(xm, ym, zc + T / 2)); mesh.rotation.z = -sg * tg; groups.low.add(mesh);
  });
})();
function buildLowFrames(fr, grp) {
  const tg = 15 * Math.PI / 180, DEP = G.dep, RISE = G.rise, HL = G.hlow;
  const rail = new THREE.BoxGeometry(0.041, 0.041, G.lm), postG = new THREE.BoxGeometry(0.041, 1, 0.041), blkG = new THREE.BoxGeometry(0.3, 0.06, 0.3);
  const R1 = new THREE.InstancedMesh(rail, mat.frame, fr.length * 2), PS = new THREE.InstancedMesh(postG, mat.frame, fr.length * 4), BK = new THREE.InstancedMesh(blkG, mat.blk, fr.length * 4);
  const o = new THREE.Object3D(); let a = 0, b = 0, c = 0;
  fr.forEach(m => {
    const lo = m.lo, sg = m.face === 'W' ? -1 : 1, ym = (m.y0 + m.y1) / 2, zr = m.zr || AL.h;
    for (const f of [0.15, 0.85]) {
      const x = lo - sg * f * DEP, h = zr + HL + f * RISE - 0.025;
      o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0); o.position.copy(P(x, ym, h)); o.updateMatrix(); R1.setMatrixAt(a++, o.matrix);
      for (const dy of [0.54, G.lm - 0.54]) { const ph = h - zr; o.scale.set(1, ph, 1); o.position.copy(P(x, m.y0 + dy, zr + ph / 2)); o.updateMatrix(); PS.setMatrixAt(b++, o.matrix);
        o.scale.set(1, 1, 1); o.position.copy(P(x, m.y0 + dy, zr + 0.03)); o.updateMatrix(); BK.setMatrixAt(c++, o.matrix); }
    }
  });
  [R1, PS, BK].forEach(x => { x.castShadow = x.receiveShadow = true; grp.add(x); });
  R1.userData.info = PS.userData.info = iFrame; BK.userData.info = I('Баластні блоки «доміку»', '4 блоки 300×300×60 з муфтою і матом на модуль.', 'Dual-tilt ballast blocks', '4 blocks 300×300×60 with coupling and mat per module.');
  picks.push(R1, PS, BK); tag(R1, 'frame'); tag(PS, 'frame'); tag(BK, 'blk');
}
buildLowFrames(frames, groups.mount);
(function buildNad() {
  const tg = 15 * Math.PI / 180, fr = [];
  D.nad.d6.forEach((m, idx) => {
    const sg = m.face === 'W' ? -1 : 1, xm = (m.xa + m.xb) / 2, ym = (m.y0 + m.y1) / 2, zc = m.zr + G.hlow + G.rise / 2;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(G.dm, T, G.lm), pv[m.face]); mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.copy(P(xm, ym, zc + T / 2)); mesh.rotation.z = -sg * tg; groups.nad.add(mesh); picks.push(mesh); tag(mesh, 'mod');
    Object.assign(mesh.userData, {base: pv[m.face], face0: pv[m.face], dat: m, src: 'nad', idx, key: 'nad:' + idx});
    mesh.userData.info = modInfo(`Модуль на надбудові · ${m.part === 'N' ? 'пн. частина +13,0' : 'пд. частина +11,95'} · ${m.face === 'W' ? 'захід' : 'схід'}`, `Stair house module · ${m.part === 'N' ? 'north part +13.0' : 'south part +11.95'} · ${m.face === 'W' ? 'west' : 'east'}`,
      `«Домік» 15°: пара по центру, до парапетів ≈0,96 м. X ${fx(m.xa.toFixed(2))}–${fx(m.xb.toFixed(2))}, Y ${fx(m.y0.toFixed(2))}–${fx(m.y1.toFixed(2))} м.`, `Dual-tilt 15°: centred pair, ≈0.96 m to parapets. X ${m.xa.toFixed(2)}–${m.xb.toFixed(2)}, Y ${m.y0.toFixed(2)}–${m.y1.toFixed(2)} m.`);
    fr.push(m);
  });
  buildLowFrames(fr, groups.mount);
})();
const WALLM = [];
(function buildWalls() {
  const GAPW = 0.022, off = 0.1, zb = AL.h + 0.5;
  const fill = (a, b, w) => { const n = Math.floor((b - a + GAPW) / (w + GAPW)), st = a + (b - a - (n * (w + GAPW) - GAPW)) / 2; return Array.from({length: n}, (_, i) => st + i * (w + GAPW)); };
  for (const [a, b] of [[AB.x0 + 0.5, s0 - 0.5], [Math.max(s1 + 0.5, G.ladder.x1 + G.ladder.clr), AB.x1 - 0.5]])
    fill(a, b, G.dm).forEach(x => WALLM.push({x0: x, x1: x + G.dm, z0: zb, z1: zb + G.lm, y: AB.y0, how: 'P', where: ['Південна стіна основного блоку над нижнім дахом', 'Main block south wall above the lower roof']}));
  fill(s0 + 0.2, s1 - 0.2, G.lm).forEach(x => WALLM.push({x0: x, x1: x + G.lm, z0: zb, z1: zb + G.dm, y: s2, how: 'L', where: ['Південна стіна надбудови (нижча частина)', 'Stair house south wall (lower part)']}));
  const railG = new THREE.BoxGeometry(1, 0.041, 0.041), R2 = new THREE.InstancedMesh(railG, mat.frame, WALLM.length * 2), o = new THREE.Object3D(); let k = 0;
  WALLM.forEach((m, i) => {
    const w = m.x1 - m.x0, h = m.z1 - m.z0, xm = (m.x0 + m.x1) / 2, zm = (m.z0 + m.z1) / 2;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, T), pv.S); mesh.position.copy(P(xm, m.y - off - T / 2, zm));
    mesh.castShadow = mesh.receiveShadow = true; Object.assign(mesh.userData, {base: pv.S, face0: pv.S, src: 'wall', idx: i, key: 'wall:' + i, dat: m}); groups.wall.add(mesh);
    mesh.userData.info = modInfo(`Вертикальний модуль · ${m.how === 'P' ? 'книжково' : 'альбомно'}`, `Vertical module · ${m.how === 'P' ? 'portrait' : 'landscape'}`,
      `${m.where[0]}. На південь, 90°. Низ +${fx(m.z0.toFixed(2))}, верх +${fx(m.z1.toFixed(2))} м, 0,1 м від стіни; 2 рейки 41×41 на кронштейнах з анкерами, притиски.`, `${m.where[1]}. Facing south, 90°. Bottom +${m.z0.toFixed(2)}, top +${m.z1.toFixed(2)} m, 0.1 m off the wall; 2 rails 41×41 on anchored brackets, clamps.`);
    picks.push(mesh); tag(mesh, 'mod');
    for (const f of [0.54, (m.how === 'P' ? h : w) - 0.54]) {
      o.rotation.set(0, 0, 0);
      if (m.how === 'P') { o.scale.set(w + 0.1, 1, 1); o.position.copy(P(xm, m.y - off / 2, m.z0 + f)); }
      else { o.rotation.z = Math.PI / 2; o.scale.set(h + 0.1, 1, 1); o.position.copy(P(m.x0 + f, m.y - off / 2, zm)); }
      o.updateMatrix(); R2.setMatrixAt(k++, o.matrix);
    }
  });
  R2.castShadow = true; groups.mount.add(R2); R2.userData.info = I('Рейки на стіні', 'Рейки 41×41 на кронштейнах з анкерами через ≤ 1,0 м, притиски середні й кінцеві. Специфікація — розділ D.', 'Wall rails', 'Rails 41×41 on anchored brackets every ≤ 1.0 m, mid and end clamps. Bill of materials — section D.'); picks.push(R2); tag(R2, 'wrail');
})();
