// АБК «Антарес», варіант «ДБН» — модуль моделі для збирання всього об'єкта (двійник цеху, ліхтарі, склад, УЗЕ, АБК).
// window.ABKModel(THREE, D, opts) будує АБК з СЕС у групі root (координати двійника: X — схід, Y — північ, висота; three: x, висота, −y)
// і повертає групи шарів, позиції специфікації (TAGS), модулі (MODS), стрінги, підписи, розрахунок тіні й стану модулів, етапи монтажу.
// opts: ground — земля (за замовчуванням так), ctx — край цеху і ТП-5913 для тіні (у зібраному об'єкті — ні), occ — свої об'єкти-перешкоди для тіні.
window.ABKModel = function (THREE, D, opts) {
opts = opts || {};
const S = new THREE.Group(); S.name = 'ABK';                       // корінь модуля АБК
const I = (t1, d1, t2, d2) => ({uk: [t1, d1], en: [t2, d2]});        // підказка об'єкта двома мовами
const G = D.geo, AL = G.AL, AB = G.AB, DB = D.dbn;
const XC = (AB.x0 + AB.x1) / 2, HW = (AB.x1 - AB.x0) / 2;
const zA = x => AB.h + AB.f * Math.max(0, 1 - ((x - XC) / HW) ** 2);
const P = (x, y, h) => new THREE.Vector3(x, h, -y);              // X схід, Y північ → three: x, висота, −z
const fx = v => String(v).replace('.', ','), fx1 = v => v.toFixed(1).replace('.', ',');
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
if (opts.ground !== false) { const gnd = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), mat.ground); gnd.rotation.x = -Math.PI / 2; gnd.position.copy(P(110, 20, 0)); gnd.receiveShadow = true; S.add(gnd); }
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
if (opts.ctx !== false) {                                            // у зібраному об'єкті цех і ТП — свої
const cx0 = 84, cx1 = 96.64;
box(cx1 - cx0, 15.9, 60, mat.ctx, (cx0 + cx1) / 2, 25, 15.9 / 2, groups.ctx, I('Цех (край, для орієнтації)', 'Східна стіна цеху — X 96,6 м, за 11,7 м від АБК. Покрівля в ендовах +15,9 м, гребені до +18,15 м. Тінь на АБК дає лише ввечері.', 'Workshop (edge, for orientation)', 'Workshop east wall at X 96.6 m, 11.7 m from the admin building. Roof valleys +15.9 m, ridges up to +18.15 m. Shades the building only in the evening.'));
box(103 - 96.64, 4.5, 35, mat.tp, (96.64 + 103) / 2, (-0.4 + 34.6) / 2, 2.25, groups.ctx, I('ТП-5913', 'Прибудова з жовтої цегли вздовж східного фасаду цеху, ≈4,5 м заввишки (оцінка).', 'Substation TP-5913', 'Yellow-brick annex along the workshop east facade, ≈4.5 m high (estimate).'));
}
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
const T = 0.033;
const DROP = new Set(DB.drop.map(i => DB.mods[i].src + ':' + DB.mods[i].i));
const MODREC = {}; DB.mods.forEach((m, j) => { m.j = j; MODREC[m.src + ':' + m.i] = m; });
function modInfo(where, whereEn, extra, extraEn) { return I(where, extra, whereEn, extraEn); }
// пози модулів і кожна деталь кріплення — з abk_mount.json (antares/abk/mount.py, «Елементи SES»)
const MT = D.mount, MP = MT.mods;
const v3 = v => new THREE.Vector3(v[0], v[2], -v[1]);                   // вектор двійника → three
function poseMat(c, xv, nv, sx, sy, sz) {                             // центр, вісь X і нормаль Y (координати двійника), масштаб
  const X = v3(xv).normalize(), Y0 = v3(nv), Y = Y0.sub(X.clone().multiplyScalar(Y0.dot(X))).normalize(), Z = new THREE.Vector3().crossVectors(X, Y);
  return new THREE.Matrix4().makeBasis(X, Y, Z).scale(new THREE.Vector3(sx || 1, sy || 1, sz || 1)).setPosition(P(c[0], c[1], c[2]));
}
function placeMod(mesh, key) { const q = MP[key]; if (!q) return false; mesh.matrixAutoUpdate = true; poseMat(q.c, q.x, q.n).decompose(mesh.position, mesh.quaternion, mesh.scale); return true; }
(function buildArch() {
  D.archD.forEach((m, idx) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(G.dm, T, G.lm), pv[m.face]); placeMod(mesh, 'archD:' + idx);
    mesh.castShadow = mesh.receiveShadow = true; groups.arch.add(mesh);
    Object.assign(mesh.userData, {base: pv[m.face], face0: pv[m.face], dat: m, src: 'archD', idx, key: 'archD:' + idx});
    mesh.userData.info = modInfo(`Модуль на арці · ${m.face === 'E' ? 'схід' : 'захід'} ${fx(m.tilt)}°`, `Arch module · ${m.face === 'E' ? 'east' : 'west'} ${m.tilt}°`,
      `Колонка ${m.col + 1} з 13, вертикально: 2 384 мм уздовж арки, 1 303 мм по дузі; рама на кромках двох лаг 41×41, 3 притиски на кожен довгий бік. X ${fx(m.xa.toFixed(2))}–${fx(m.xb.toFixed(2))}, Y ${fx(m.y0.toFixed(2))}–${fx(m.y1.toFixed(2))} м.`,
      `Column ${m.col + 1} of 13, portrait: 2384 mm along the arch, 1303 mm across; frame on the lips of two 41×41 rails, 3 clamps on each long side. X ${m.xa.toFixed(2)}–${m.xb.toFixed(2)}, Y ${m.y0.toFixed(2)}–${m.y1.toFixed(2)} m.`);
    picks.push(mesh); tag(mesh, 'mod');
  });
})();
(function buildLow() {
  D.low.forEach((m, idx) => {
    const key = 'low:' + idx, out = DROP.has(key) || !m.used;
    let mesh;
    if (!out) {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(G.dm, T, G.lm), pv[m.face]); mesh.castShadow = mesh.receiveShadow = true; placeMod(mesh, key);
      Object.assign(mesh.userData, {base: pv[m.face], face0: pv[m.face], dat: m, src: 'low', idx, key});
      const one = Math.abs(Math.abs(MP[key].tilt) - 15) < 0.01;
      mesh.userData.info = modInfo(`Модуль на нижньому даху · ${m.face === 'W' ? 'захід' : 'схід'} 15°`, `Lower roof module · ${m.face === 'W' ? 'west' : 'east'} 15°`,
        one ? `Одиночний трикутник 15° (модифікація Антарес): 2 трикутники на модуль через 1 400 мм, лага 1 550 на 2 блоках, 4 притиски. Модуль горизонтально, 2 384 мм уздовж Пн–Пд.`
            : `«Домік» 15,36°: пара схід + захід на двох опорах (лага 2 750, 2 балки 1 450, стійка), 4 притиски на панель. Модуль горизонтально, 2 384 мм уздовж Пн–Пд.`,
        one ? `Single 15° triangle (Antares modification): 2 triangles per module 1400 mm apart, 1550 rail on 2 blocks, 4 clamps. Landscape, 2384 mm along N–S.`
            : `Dual-tilt 15.36°: east + west pair on two supports (2750 rail, two 1450 beams, strut), 4 clamps per panel. Landscape, 2384 mm along N–S.`);
      picks.push(mesh); tag(mesh, 'mod');
    } else {
      mesh = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(G.dm, T, G.lm)), new THREE.LineDashedMaterial({color: 0x9aa5ad, dashSize: 0.25, gapSize: 0.15}));
      mesh.computeLineDistances();
      const inf = I('Місце без модуля', 'У «ДБН» 134 місця, у стрінги по 12 входить 132: це місце лишається вільним (біля драбини, у тіні надбудови).', 'Place without a module', 'The DBN layout has 134 places, 132 fit into strings of 12: this place stays empty (next to the ladder, shaded by the stair house).');
      const hit = new THREE.Mesh(new THREE.BoxGeometry(G.dm, 0.05, G.lm), new THREE.MeshBasicMaterial({visible: false})); mesh.add(hit); hit.userData.info = inf; picks.push(hit);
      const sg = m.face === 'W' ? -1 : 1; mesh.position.copy(P((m.xa + m.xb) / 2 - sg * 0.057, (m.y0 + m.y1) / 2, AL.h + 0.3076 + T / 2)); mesh.rotation.z = -sg * 15.36 * Math.PI / 180;
    }
    groups.low.add(mesh);
  });
})();
(function buildNad() {
  D.nad.d6.forEach((m, idx) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(G.dm, T, G.lm), pv[m.face]); mesh.castShadow = mesh.receiveShadow = true;
    placeMod(mesh, 'nad:' + idx); groups.nad.add(mesh); picks.push(mesh); tag(mesh, 'mod');
    Object.assign(mesh.userData, {base: pv[m.face], face0: pv[m.face], dat: m, src: 'nad', idx, key: 'nad:' + idx});
    mesh.userData.info = modInfo(`Модуль на надбудові · ${m.part === 'N' ? 'пн. частина +13,0' : 'пд. частина +11,95'} · ${m.face === 'W' ? 'захід' : 'схід'}`, `Stair house module · ${m.part === 'N' ? 'north part +13.0' : 'south part +11.95'} · ${m.face === 'W' ? 'west' : 'east'}`,
      `«Домік» 15,36°: пара по центру на двох опорах (лага 2 750, 2 балки 1 450, стійка), до парапетів ≈0,9 м.`, `Dual-tilt 15.36°: centred pair on two supports (2750 rail, two 1450 beams, strut), ≈0.9 m to parapets.`);
  });
})();
(function buildWalls() {
  Object.keys(MP).filter(k => k.startsWith('wall:')).forEach(key => {
    const q = MP[key], i = +key.slice(5), P_ = q.how === 'P';
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(G.dm, T, G.lm), pv.S); placeMod(mesh, key);
    mesh.castShadow = mesh.receiveShadow = true; Object.assign(mesh.userData, {base: pv.S, face0: pv.S, src: 'wall', idx: i, key, dat: q}); groups.wall.add(mesh);
    const z0 = q.c[2] - q.h / 2, z1 = q.c[2] + q.h / 2;
    mesh.userData.info = modInfo(`Вертикальний модуль · ${P_ ? 'книжково' : 'альбомно'}`, `Vertical module · ${P_ ? 'portrait' : 'landscape'}`,
      `${P_ ? 'Південна стіна основного блоку над нижнім дахом' : 'Південна стіна надбудови'}. На південь, 90°. Низ +${fx(z0.toFixed(2))}, верх +${fx(z1.toFixed(2))} м; тил рами 160 мм від стіни. ${P_ ? 'Спільні горизонтальні рейки 41×41×2,5 на групу, кронштейни через ≈1,2 м, середні й крайні притиски' : '2 вертикальні рейки 41×41×2,5 по 1 400 на 540 мм від торців, 4 кронштейни, 4 притиски'}, трос безпеки.`,
      `${P_ ? 'Main block south wall above the lower roof' : 'Stair house south wall'}. Facing south, 90°. Bottom +${z0.toFixed(2)}, top +${z1.toFixed(2)} m; frame back 160 mm off the wall. ${P_ ? 'Shared horizontal 41×41×2.5 rails per group, brackets every ≈1.2 m, mid and end clamps' : 'two vertical 41×41×2.5 rails of 1400 at 540 mm from the ends, 4 brackets, 4 clamps'}, safety rope.`);
    picks.push(mesh); tag(mesh, 'mod');
  });
})();
// ---------- кріплення: кожна деталь — екземпляр; тип@група → тег для специфікації
const MATS = {
  zn: mat.lag, fr: mat.frame, blk: mat.blk, rub: M(0x1f2124, {roughness: 1}), al: M(0xdfe4e8, {metalness: 0.35, roughness: 0.35}),
  dk: M(0x6f7a82, {metalness: 0.45, roughness: 0.45}), cu: M(0xb98b2f, {metalness: 0.5, roughness: 0.35}), rod: M(0x9aa3aa, {metalness: 0.6, roughness: 0.32}),
  anc: M(0xc2410c, {roughness: 0.6}), ss: M(0xc9ced2, {metalness: 0.7, roughness: 0.25}),
};
const PT = {   // тип: [геометрія (одиниця по X, якщо масштабується), матеріал, масштабувати по L, тег]
  lag: [new THREE.BoxGeometry(1, 0.041, 0.041), 'zn', 1, 'lag'], prof: [new THREE.BoxGeometry(1, 0.041, 0.041), 'zn', 1, 'prof'],
  dlag: [new THREE.BoxGeometry(1, 0.041, 0.041), 'fr', 1, 'dfr'], dbeam: [new THREE.BoxGeometry(1, 0.041, 0.041), 'fr', 1, 'dfr'], dstrut: [new THREE.BoxGeometry(1, 0.041, 0.041), 'fr', 1, 'dfr'],
  slag: [new THREE.BoxGeometry(1, 0.041, 0.041), 'fr', 1, 'sfr'], sbeam: [new THREE.BoxGeometry(1, 0.041, 0.041), 'fr', 1, 'sfr'], sstrut: [new THREE.BoxGeometry(1, 0.041, 0.041), 'fr', 1, 'sfr'],
  ddiag: [new THREE.BoxGeometry(1, 0.041, 0.041), 'dk', 1, 'diag'], wrail: [new THREE.BoxGeometry(1, 0.041, 0.041), 'fr', 1, 'wr'],
  blk: [new THREE.BoxGeometry(0.3, 0.06, 0.3), 'blk', 0, 'blk'], blkn: [new THREE.BoxGeometry(0.3, 0.06, 0.3), 'blk', 0, 'blkn'], mat: [new THREE.BoxGeometry(0.32, 0.003, 0.32), 'rub', 0, 'mat'],
  cm: [new THREE.BoxGeometry(0.05, 0.012, 0.044), 'al', 0, 'cm'], cz: [new THREE.BoxGeometry(0.05, 0.03, 0.026), 'al', 0, 'cz'], ce: [new THREE.BoxGeometry(0.05, 0.016, 0.04), 'al', 0, 'ce'],
  slv: [new THREE.BoxGeometry(0.2, 0.037, 0.0455), 'dk', 0, 'slv'], cpl: [new THREE.CylinderGeometry(0.0098, 0.0098, 0.05, 6).rotateZ(Math.PI / 2), 'cu', 0, 'slv'],
  rod: [new THREE.CylinderGeometry(0.005, 0.005, 1, 6).rotateZ(Math.PI / 2), 'rod', 1, 'rod'],
  angP: [new THREE.BoxGeometry(1, 0.04, 0.008), 'dk', 1, 'ang'], angL: [new THREE.BoxGeometry(1, 0.04, 0.008), 'dk', 1, 'ang'],
  anc: [new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), 'anc', 0, 'anc'], dbrk: [new THREE.BoxGeometry(0.05, 0.053, 0.05), 'ss', 0, 'brk'],
  wbrk: [new THREE.BoxGeometry(0.06, 0.06, 0.06), 'dk', 0, 'wbrk'],
};
const GRP = {arch: 'arch', dom: 'frame', one: 'frame', wall: 'wrail'};
const MINFO = {
  'lag@arch': ['Лага 41×41×1,5 перфорована', 'Пазом догори, під стиком двох колонок модулів (крайня — 12 мм за рамою); на блоках 300×300×60 з муфтою і матом — 2 на панель через 1 200 мм і під кожним кінцем. Шматки 4 800 і 2 400, стик — у гільзі 200. Лага до блока — M8×20 + DIN 9021 у муфту.', 'Rail 41×41×1.5 perforated', 'Slot up, under the joint of two module columns (edge rail 12 mm outside the frame); on 300×300×60 blocks with coupling and mat — 2 per panel 1200 mm apart and one under each end. 4800 and 2400 pieces, splice inside a 200 sleeve. Rail to block — M8×20 + DIN 9021 into the coupling.'],
  'blk@arch': ['Баластний блок 300×300×60 з муфтою і матом', '13 кг; під лагою — 2 на панель через 1 200 мм (перший за 575 від торця) і під кожним кінцем лаги.', 'Ballast block 300×300×60 with coupling and mat', '13 kg; under rails — 2 per panel 1200 mm apart (first at 575 from the end) and under each rail end.'],
  'blkn@arch': ['Блок під крайнім профілем — без мата', '2 на профіль; верх знято, щоб профіль став урівень з лагами.', 'Block under the edge profile — no mat', '2 per profile; top trimmed so the profile is level with the rails.'],
  'mat@arch': ['Мат гумовий 320×320×3', 'Під кожен блок лаги.', 'Rubber mat 320×320×3', 'Under every rail block.'],
  'cm@arch': ['Притиск середній під раму 33', 'Алюміній, M8×60 DIN 912 A2 у гайку з пружиною в пазу лаги; 3 на довгий бік (0,17 · 0,5 · 0,83 L), один на два модулі.', 'Mid clamp for 33 mm frame', 'Aluminium, M8×60 DIN 912 A2 into a spring nut in the rail slot; 3 per long side (0.17 · 0.5 · 0.83 L), one for two modules.'],
  'cz@arch': ['Притиск Z33', 'На крайній лазі — 3 на довгий бік (M8×25); на крайньому профілі — 2 на короткий бік.', 'Z33 end clamp', 'On the edge rail — 3 per long side (M8×25); on the edge profile — 2 per short side.'],
  'slv@arch': ['Гільза П 45 з привареною муфтою M10×50', 'Знизу на лагу, 2 болти M10×60 з трубкою в бічні отвори; муфта — половина з лівою, половина з правою різьбою. На стику лаг гільза бере обидва шматки.', 'U-sleeve 45 with welded M10×50 coupling', 'From below on the rail, 2 × M10×60 with spacer tube in side holes; coupling half left-hand, half right-hand thread. At a rail splice the sleeve takes both pieces.'],
  'rod@arch': ['Шпилька M10 права / ліва різьба', 'Між муфтами сусідніх лаг на кожному стику модулів у колонці; крутиш — обидва кінці закручуються, лаги стягуються. Через прохід ≤ 1,6 м — така сама шпилька.', 'M10 rod, right / left thread', 'Between couplings of adjacent rails at every module joint in a column; turning it pulls both rails together. Across a passage ≤ 1.6 m — the same rod.'],
  'prof@arch': ['Крайній профіль 41×41×1,5', 'На кінці колонки, поперек лаг, за 12 мм від краю рам: тримає коротку сторону 2 притисками Z33 і бере тягу між лагами на краю ряду; 2 блоки без мата. Через прохід — профіль без притисків.', 'Edge profile 41×41×1.5', 'At the end of a column, across the rails 12 mm beyond the frames: holds the short side with 2 Z33 clamps and ties the rails at the row edge; 2 blocks without mat. Across a passage — a profile without clamps.'],
  'ang@arch': ['Кутник 160/150, t = 8 (правий і лівий)', 'Крайній профіль до лаги: M10×70 крізь кутник(и) і лагу, 2 × M10×60 крізь кутник і профіль.', 'Angle 160/150, t = 8 (right and left)', 'Edge profile to rail: M10×70 through the angle(s) and rail, 2 × M10×60 through angle and profile.'],
  'anc@arch': ['Анкер від сповзання', 'Ланцюжок тяг цієї лінії не переходить гребінь (вентшахти, доріжки) — за правилом КМ даху цеху анкер на верхній лазі відрізка.', 'Anti-slide anchor', 'The tie chain on this line does not cross the ridge (vents, walkways) — per the shop roof rule an anchor on the upper rail of the segment.'],
  'dfr@dom': ['Опора «доміку» 41×41×1,5', 'Лага 2 750 на 4 блоках, дві балки 1 450 з двох боків лаги (шарніри в заводських отворах), стійка посередині, один болт на вершині крізь балка–стійка–балка; П-кронштейн під стійкою. Дві опори на пару панелей, ±0,70 м від центру панелі; кут 15,36°.', 'Dual-tilt support 41×41×1.5', '2750 rail on 4 blocks, two 1450 beams on both sides of the rail (hinges in factory holes), a strut in the middle, one bolt at the apex through beam–strut–beam; U-bracket under the strut. Two supports per panel pair, ±0.70 m from the panel centre; 15.36°.'],
  'brk@dom': ['П-кронштейн, нерж. 304', 'Під стійкою, спинкою на лазі: M10 крізь спинку і проріз лаги, M10 крізь вуха і стійку.', 'U-bracket, stainless 304', 'Under the strut, back on the rail: M10 through the back and rail slot, M10 through the ears and strut.'],
  'blk@dom': ['Баластний блок з муфтою і матом', '4 на опору «доміку»: крайні — 200 мм від торців лаги, середні — по 165 мм від середини.', 'Ballast block with coupling and mat', '4 per dual-tilt support: outer at 200 mm from the rail ends, inner 165 mm from the middle.'],
  'mat@dom': ['Мат гумовий 320×320×3', 'Під кожен блок.', 'Rubber mat 320×320×3', 'Under every block.'],
  'ce@dom': ['Притиск крайній з болтом M8', '4 на панель: на балках двох опор, нижній і верхній край.', 'End clamp with M8 bolt', '4 per panel: on the beams of two supports, lower and upper edge.'],
  'diag@dom': ['Діагональ 41×41×1,5', 'Між сусідніми опорами ряду: від верху стійки до низу стійки сусідньої, 2 болти M10×20.', 'Diagonal 41×41×1.5', 'Between adjacent supports of a row: from the top of a strut to the foot of the next, 2 × M10×20.'],
  'sfr@one': ['Трикутник 15° (модифікація Антарес)', 'Під модулем без пари: лага 1 550 (блоки під кінцями поза трикутником), балка 1 419, стійка 448 у 13-му отворі, П-кронштейн під 15°. 2 трикутники на модуль через 1 400 мм.', '15° triangle (Antares modification)', 'Under an unpaired module: 1550 rail (blocks under the ends outside the triangle), 1419 beam, 448 strut in the 13th hole, 15° U-bracket. 2 triangles per module 1400 mm apart.'],
  'brk@one': ['П-кронштейн під 15°', 'Отвір під болт балки зміщено, щоб не свердлити балку.', 'U-bracket for 15°', 'Bolt hole shifted so the beam is not drilled.'],
  'blk@one': ['Баластний блок з муфтою і матом', '2 на трикутник — під кінцями лаги.', 'Ballast block with coupling and mat', '2 per triangle — under the rail ends.'],
  'mat@one': ['Мат гумовий 320×320×3', 'Під кожен блок.', 'Rubber mat 320×320×3', 'Under every block.'],
  'ce@one': ['Притиск крайній з болтом M8', '4 на модуль: на кінцях балок.', 'End clamp with M8 bolt', '4 per module: at the beam ends.'],
  'diag@one': ['Діагональ 41×41×1,5', 'Між трикутниками сусідніх модулів, 2 болти M10×20.', 'Diagonal 41×41×1.5', 'Between triangles of adjacent modules, 2 × M10×20.'],
  'wr@wall': ['Рейка 41×41×2,5 на стіні', 'На 540 мм від торців модуля, поперек довгої сторони (як вимагає ZNSHINE): у групі книжкових — спільні горизонтальні, в альбомних — по 2 вертикальні 1 400.', 'Wall rail 41×41×2.5', 'At 540 mm from the module ends, across the long side (as ZNSHINE requires): shared horizontal rails for a portrait group, two vertical 1400 rails per landscape module.'],
  'wbrk@wall': ['Кронштейн L 60×60×5 з пазом і анкер M10', 'Паз регулює відстань до стіни ±20 мм; болт M10×35 у рейку. Тип анкера — за випробуванням на вирив.', 'L 60×60×5 slotted bracket and M10 anchor', 'Slot adjusts the wall distance ±20 mm; M10×35 into the rail. Anchor type per pull-out test.'],
  'ce@wall': ['Притиск крайній 80 мм, Al 6005-T6', 'M8 у гайку з пружиною в пазу рейки, 16–20 Н·м.', 'End clamp 80 mm, Al 6005-T6', 'M8 into a spring nut in the rail slot, 16–20 N·m.'],
  'cm@wall': ['Притиск середній 80 мм', 'Між сусідніми модулями групи, на кожній рейці.', 'Mid clamp 80 mm', 'Between adjacent modules of a group, on each rail.'],
};
(function buildMount() {
  const by = {};
  for (const [t, list] of Object.entries(MT.parts)) list.forEach(p => { const k = t + '|' + p.k; (by[k] = by[k] || []).push(p); });
  for (const [key, list] of Object.entries(by)) {
    const [t, g] = key.split('|'), def = PT[t]; if (!def) continue;
    const [geo, mk, scl, tg] = def, im = new THREE.InstancedMesh(geo, MATS[mk], list.length);
    list.forEach((p, i) => im.setMatrixAt(i, poseMat(p.c, p.u, p.n, scl ? p.L : 1, 1, 1)));
    im.instanceMatrix.needsUpdate = true; im.castShadow = t !== 'mat' && t !== 'rod'; im.receiveShadow = true; im.userData.noOcc = true;
    const inf = MINFO[tg + '@' + g];
    if (inf) im.userData.info = I(inf[0], inf[1], inf[2], inf[3]);
    groups.mount.add(im); picks.push(im); tag(im, tg + '@' + g); tag(im, tg); if (!['blk', 'blkn', 'mat'].includes(tg)) tag(im, GRP[g]); if (tg === 'mat' || tg === 'blkn') tag(im, 'blk');
  }
})();

// ================= кольори стрінгів
const SCOL = ['#e6194b', '#f58231', '#d4b106', '#3cb44b', '#16a3c7', '#4363d8', '#911eb4', '#f032e6', '#7fb800', '#b05e2b', '#5e6b7a'];
const scol = k => SCOL[(k - 1) % SCOL.length];
const sMat = {}; const strMat = k => sMat[k] || (sMat[k] = M(new THREE.Color(scol(k)).getHex(), {roughness: 0.5, metalness: 0.05}));
const LB = [];                                                        // підписи: [позиція, {uk, en}, клас, шар]
const lbl = (pos, uk, en, cls = '', layer = null, k = 0) => { LB.push({p: pos, t: {uk, en}, cls, layer, k}); };
const V3 = a => P(a[0], a[1], a[2]);
function tubeOf(pts, r, m, grp, info, tg) {
  const vs = pts.map(V3); if (vs.length < 2) return null;
  const segs = []; for (let i = 0; i < vs.length - 1; i++) if (vs[i].distanceTo(vs[i + 1]) > 1e-4) segs.push([vs[i], vs[i + 1]]);
  const path = new THREE.CurvePath(); segs.forEach(([a, b]) => path.add(new THREE.LineCurve3(a, b)));
  const n = Math.max(4, Math.round(path.getLength() * 2));
  const t = new THREE.Mesh(new THREE.TubeGeometry(path, n, r, 5, false), m); t.userData.noOcc = true; grp.add(t);
  if (info) { t.userData.info = info; picks.push(t); } if (tg) tag(t, tg); return t;
}
function beam(a, b, w, h, m, grp, info, tg) {                          // прямий брусок від a до b (план X, Y, висота)
  const A = V3(a), B = V3(b), L = A.distanceTo(B); if (L < 1e-3) return null;
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, L), m); o.position.copy(A).add(B).multiplyScalar(0.5);
  const d = B.clone().sub(A).normalize(); if (Math.abs(d.y) > 0.9) o.up.set(1, 0, 0); o.lookAt(B);
  o.castShadow = o.receiveShadow = true; grp.add(o); if (info) { o.userData.info = info; picks.push(o); } if (tg) tag(o, tg); return o;
}
const roofZ = (x, y) => (x > AB.x0 && x < AB.x1 && y > AB.y0 && y < AB.y1) ? zA(x) : (x > s0 && x < s1 && y > s2 && y < s3) ? (y < SPLIT ? 11.95 : 13.0) : AL.h;
// ---------- лотки 100×50 з кришкою на опорах з блоком через 1,5 м
const trayM = M(0xb9c0c4, {metalness: 0.55, roughness: 0.35}), iTray = I('Лоток 100×50 з кришкою', 'Перфорований оцинкований лоток із кришкою: кабелі стрінгів 1×6 до інвертора і провідник вирівнювання Cu 1×6. На даху — на траверсах і блоках через 1,5 м, на стінах — на кронштейнах з анкерами через 1,0 м. Траси разом ≈106 м, у специфікації 117 м (+10 %), 8 горизонтальних і 10 вертикальних кутів, 7 трійників.',
  'Cable tray 100×50 with lid', 'Perforated galvanised tray with lid: string cables 1×6 to the inverter and the Cu 1×6 bonding conductor. On roofs — on cross-bars and blocks every 1.5 m, on walls — on anchored brackets every 1.0 m. Routes ≈106 m, 117 m in the bill of materials (+10 %), 8 horizontal and 10 vertical bends, 7 tees.');
const iCross = I('Перехід лотка через прохід', 'Лоток з кришкою впоперек доріжки або проходу — низький, по ньому можна переступити; у місці переходу кришка закріплена фіксаторами.', 'Tray crossing a walkway', 'Low lidded tray across a walkway or passage, can be stepped over; the lid is secured with clips at the crossing.');
const supPts = [];
Object.entries(DB.trays).forEach(([key, t]) => {
  const pts = t.pts;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dz = Math.abs(b[2] - a[2]), dh = Math.hypot(b[0] - a[0], b[1] - a[1]);
    beam(a, b, 0.1, 0.05, trayM, groups.elec, t.note === 'crossing' && key !== 'pass' && i === pts.length - 2 ? iCross : key === 'pass' ? iCross : iTray, 'tray');
    if (dz < 0.3 || dh > dz) { const n = Math.floor(dh / 1.5); for (let k = 1; k <= n; k++) { const f = k / (n + 1), x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f; supPts.push([x, y, roofZ(x, y)]); } }
  }
});
{ const B = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.06, 0.3), mat.blk, supPts.length), TR = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.041, 0.041), mat.frame, supPts.length), o = new THREE.Object3D();
  supPts.forEach(([x, y, z], i) => { o.position.copy(P(x, y, z + 0.03)); o.updateMatrix(); B.setMatrixAt(i, o.matrix); o.position.copy(P(x, y, z + 0.08)); o.updateMatrix(); TR.setMatrixAt(i, o.matrix); });
  [B, TR].forEach(x => { x.castShadow = x.receiveShadow = true; groups.elec.add(x); x.userData.info = I('Опора лотка', 'Траверса 41×41×2,5 (L = 0,2 м) на баластному блоці з муфтою, через 1,5 м; лоток кріпиться 2 болтами M8 з гайкою з пружиною.', 'Tray support', 'Cross-bar 41×41×2.5 (L = 0.2 m) on a ballast block with coupling, every 1.5 m; tray fixed with 2 M8 bolts with spring nuts.'); picks.push(x); tag(x, 'tray'); });
  tag(B, 'blk'); }
// ---------- інвертор Deye SUN-100K-G03 на північній стіні надбудови
const IV = DB.inv.pos;
const invBody = box(IV.w, IV.h, IV.d, M(0xe9ecee, {roughness: 0.45, metalness: 0.2}), IV.x, IV.y, IV.z0 + IV.h / 2, groups.elec,
  I('Інвертор Deye SUN-100K-G03', `100 кВт, 3 фази 400 В, 6 MPPT по 2 стрінги, DC до 1 000 В, MPPT 200–850 В, 40 А на MPPT; DC-роз'єднувач, ПЗІП тип II на DC і AC; ККД 98,2 % (європейський); IP65, 81 кг, 824 × 516 × 313 мм. На північній стіні надбудови над нижнім дахом (+10,6) — у тіні, низ 0,6 м над покрівлею. Знизу — вводи DC з лотка, справа — кабель AC у надбудову.`,
    'Inverter Deye SUN-100K-G03', `100 kW, 3-phase 400 V, 6 MPPT with 2 strings each, DC up to 1000 V, MPPT 200–850 V, 40 A per MPPT; DC switch, type II SPD on DC and AC; Euro efficiency 98.2 %; IP65, 81 kg, 824 × 516 × 313 mm. On the north wall of the stair house above the lower roof (+10.6), in shade, bottom 0.6 m above the roof. DC inputs from the tray below, AC cable into the stair house on the right.`));
tag(invBody, 'inv');
{ const fr = box(IV.w * 0.86, IV.h * 0.7, 0.01, M(0x2a3238, {roughness: 0.5}), IV.x, IV.y + IV.d / 2 + 0.006, IV.z0 + IV.h * 0.55, groups.elec); fr.userData.info = invBody.userData.info; picks.push(fr); tag(fr, 'inv');
  const led = box(0.12, 0.03, 0.012, new THREE.MeshBasicMaterial({color: 0x37c871}), IV.x - 0.25, IV.y + IV.d / 2 + 0.012, IV.z0 + IV.h * 0.82, groups.elec); led.userData.noOcc = true;
  const br = box(IV.w * 0.9, 0.06, 0.08, mat.frame, IV.x, IV.y - IV.d / 2 + 0.02, IV.z0 + IV.h + 0.02, groups.elec); tag(br, 'inv'); }
lbl(P(IV.x, IV.y + 0.4, IV.z0 + IV.h + 0.5), 'Інвертор Deye 100 кВт', 'Inverter Deye 100 kW', 'el', 'elec');
// ---------- кабелі стрінгів: «змійка» по модулях, «+» і «−» до інвертора, перемички
const STRO = {};                                                      // стрінг → об'єкти
const dcM = M(0x22272b, {roughness: 0.6});
DB.strings.forEach(s => {
  const k = s.k, sm = strMat(k), list = STRO[k] = [];
  const iS = I(`Стрінг S${k} · MPPT ${s.mppt}`, `${s.n} модулів, ${fx(s.mwh.toFixed(2))} МВт·год за рік, невідповідність ${fx(s.mism)} %. Кабель «+» ${fx(s.plus.len)} м, «−» ${fx(s.minus.len)} м, перемички ${fx(s.jump.reduce((a, j) => a + j.len, 0).toFixed(1))} м (${s.jump.length}). Кабель під модулями — уздовж лаги, далі в лотку.`,
    `String S${k} · MPPT ${s.mppt}`, `${s.n} modules, ${s.mwh.toFixed(2)} MWh per year, mismatch ${s.mism} %. Cable + ${s.plus.len} m, − ${s.minus.len} m, jumpers ${s.jump.reduce((a, j) => a + j.len, 0).toFixed(1)} m (${s.jump.length}). Under the modules the cable runs along the rail, then in the tray.`);
  const ch = s.chain.map(j => { const c = DB.mods[j].c; return [c[0], c[1], c[2] + 0.07]; });
  for (let i = 0; i < ch.length - 1; i++) {
    const a = DB.mods[s.chain[i]], b = DB.mods[s.chain[i + 1]], jmp = s.jump.find(q => q.a === s.chain[i] && q.b === s.chain[i + 1]);
    if (jmp) { const m = tubeOf(jmp.pts.map(p => [p[0], p[1], p[2] + 0.07]), 0.018, sm, groups.str, iS, 'dc'); if (m) list.push(m); }
    else { const m = tubeOf([ch[i], ch[i + 1]], 0.022, sm, groups.str, iS, 'dc'); if (m) list.push(m); }
  }
  const hp = tubeOf(s.plus.pts.map((p, i) => i < 3 ? [p[0], p[1], p[2] + 0.07] : [p[0], p[1], p[2] + 0.04]), 0.014, sm, groups.str, iS, 'dc'); if (hp) list.push(hp);
  const hm = tubeOf(s.minus.pts.map((p, i) => i < 3 ? [p[0], p[1], p[2] + 0.07] : [p[0] + 0.02, p[1] + 0.02, p[2] + 0.04]), 0.014, dcM, groups.str, iS, 'dc'); if (hm) list.push(hm);
  const c0 = DB.mods[s.chain[0]].c; lbl(P(c0[0], c0[1], c0[2] + 0.55), `S${k}`, `S${k}`, 'st', 'str', k);
});
// ---------- AC: інвертор → у надбудову → стояк сходів → щит СЕС і вступний щит АБК (усередині — поверх стін)
const acM = M(0x1b1e21, {roughness: 0.6}), ovM = c => new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: 0.85, depthTest: false});
const iAC = I('Кабель AC ВВГнг 5×70 мм², мідь', 'Від інвертора — у надбудову сходів і стояком сходів до щита СЕС біля вступного щита АБК; у кошторисі 45 м. Струм інвертора до 159,4 А, вимикач 200 А. Уздовж — кабель RS485 від лічильника до інвертора (55 м).', 'AC cable VVGng 5×70 mm², copper', 'From the inverter into the stair house and down the stair riser to the PV board next to the building main board; 45 m in the estimate. Inverter current up to 159.4 A, 200 A breaker. RS485 cable from the meter to the inverter runs alongside (55 m).');
const AC0 = [IV.x + IV.w / 2 - 0.05, IV.y, IV.z0 + 0.2], AC1 = [IV.x + IV.w / 2 + 0.25, IV.y, IV.z0 + 0.2], AC2 = [IV.x + IV.w / 2 + 0.25, s3 + 0.02, IV.z0 + 0.2];
tubeOf([AC0, AC1, AC2], 0.022, acM, groups.elec, iAC, 'ac');
const RISE = [[IV.x + IV.w / 2 + 0.25, s3 - 0.4, IV.z0 + 0.2], [IV.x + IV.w / 2 + 0.25, s3 - 0.4, 0.9], [117.6, 9.4, 0.9]];
{ const g = new THREE.BufferGeometry().setFromPoints([V3(AC2), ...RISE.map(V3)]); const ln = new THREE.Line(g, new THREE.LineDashedMaterial({color: 0x1b1e21, dashSize: 0.3, gapSize: 0.2, depthTest: false, transparent: true}));
  ln.computeLineDistances(); ln.renderOrder = 5; groups.elec.add(ln); tag(ln, 'ac'); }
const brdM = ovM(0x0f6b80), vruM = ovM(0x52514e), mtM = ovM(0xd98a1c);
const shch = box(0.6, 0.4, 0.25, brdM, 117.6, 9.25, 1.2, groups.elec, I('Щит СЕС', 'Корпус IP54 400 × 600 × 250 (IEK ЩМП-4.6.2), автоматичний вимикач ABB A2B 250 TMF 200 (3P, 200 А), ПЗІП AC тип 2 4P (Eaton SPCT2-280/4). Поруч із вступним щитом АБК, внизу сходів; точне місце — за обстеженням.',
  'PV board', 'Enclosure IP54 400 × 600 × 250 (IEK ShchMP-4.6.2), breaker ABB A2B 250 TMF 200 (3P, 200 A), AC surge protector type 2 4P (Eaton SPCT2-280/4). Next to the building main board at the foot of the stairs; exact place per survey.'));
shch.renderOrder = 6; tag(shch, 'shch');
const vru = box(0.8, 1.2, 0.3, vruM, 116.6, 9.25, 1.0, groups.elec, I('Вступний щит АБК і облік', 'Існуючий вступний щит будівлі: тут трансформатори струму 250 А на вводі і лічильник CHINT DTSU666 — інвертор обмежує потужність так, щоб у мережу не йшло нічого (Zero Export). Місце щита — за обстеженням.',
  'Building main board and metering', 'Existing building main board: 250 A current transformers on the incomer and a CHINT DTSU666 meter — the inverter limits power so nothing is exported (Zero Export). Board location per survey.'));
vru.renderOrder = 6; tag(vru, 'meter');
const mtr = box(0.12, 0.2, 0.08, mtM, 116.6, 9.05, 1.35, groups.elec); mtr.renderOrder = 7; mtr.userData.info = vru.userData.info; picks.push(mtr); tag(mtr, 'meter');
lbl(P(117.1, 9.25, 2.0), 'Щит СЕС · вступний щит · лічильник', 'PV board · main board · meter', 'el', 'elec');
// ---------- блискавкозахист і вирівнювання потенціалів (без зовнішніх щогл, як том 7 СЕС цеху)
const bzM = M(0x7fa82a, {roughness: 0.5, metalness: 0.2}), bz16 = M(0x5d8a12, {roughness: 0.5, metalness: 0.2});
const iB6 = I('Провідник вирівнювання Cu 1×6 мм² ж-з', 'Іде в лотках уздовж трас DC до інвертора; відгалуження до кожного механічно зв\'язаного блоку кріплення — по 2 приєднання затискачами EN 62561-1. Разом 245 м. Зовнішніх щогл немає: каркас з\'єднано між собою і з PE інвертора, а через PE кабелю AC — з головною заземлювальною шиною будівлі.',
  'Bonding conductor Cu 1×6 mm² green-yellow', 'Runs in the trays along the DC routes to the inverter; branches to every mechanically connected mounting block — 2 connections each with EN 62561-1 clamps. 245 m in total. No external masts: the frames are bonded together and to the inverter PE, and via the AC cable PE to the building main earthing bar.');
Object.values(DB.trays).forEach(t => tubeOf(t.pts.map(p => [p[0] + 0.03, p[1] + 0.03, p[2] + 0.035]), 0.008, bzM, groups.lps, iB6, 'bz'));
const iCon = I('Приєднання до кріплення', 'Затискач EN 62561-1 на лазі / рейці, контактні зубчасті шайби під болти гільз — каркас блоку електрично з\'єднаний.', 'Connection to the mounting', 'EN 62561-1 clamp on the rail; serrated contact washers under the sleeve bolts make the block frame electrically continuous.');
const conG = new THREE.SphereGeometry(0.06, 10, 8);
DB.lps.groups.forEach(g => g.con.forEach(c => {
  tubeOf(c.pts.map(p => [p[0], p[1], p[2] - 0.02]), 0.008, bzM, groups.lps, iB6, 'bz');
  const s = new THREE.Mesh(conG, bzM); s.position.copy(V3([c.pts[0][0], c.pts[0][1], c.pts[0][2] - 0.02])); s.userData.info = iCon; s.userData.noOcc = true; groups.lps.add(s); picks.push(s); tag(s, 'bz');
}));
const iB16 = I('Провідник Cu 1×16 мм² ж-з', 'Від провідника вирівнювання — до PE інвертора і до наявного прутка на парапеті в місці, де лоток DC переходить через південний парапет основного блоку (контрольне з\'єднання, наконечники 16 мм²). Разом 6 м.', 'Cu 1×16 mm² green-yellow conductor', 'From the bonding conductor to the inverter PE and to the existing parapet rod where the DC tray crosses the main block south parapet (test joint, 16 mm² lugs). 6 m in total.');
{ const t = DB.lps.tie, d = DB.trays.desc.pts, top = d[2];
  tubeOf([[top[0] + 0.03, top[1], top[2] + 0.03], [t[0], t[1], t[2] + 0.07]], 0.011, bz16, groups.lps, iB16, 'bz');
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), bz16); s.position.copy(V3([t[0], t[1], t[2] + 0.07])); s.userData.info = iB16; groups.lps.add(s); picks.push(s); tag(s, 'bz');
  const n = DB.inv.node; tubeOf([[n[0] + 0.03, n[1] + 0.03, n[2] + 0.035], [IV.x - IV.w / 2 + 0.05, IV.y - 0.1, IV.z0 + 0.05]], 0.011, bz16, groups.lps, iB16, 'bz'); }
lbl(P(DB.lps.tie[0], DB.lps.tie[1], DB.lps.tie[2] + 0.9), 'Приєднання до прутка на парапеті', 'Bond to the parapet rod', 'bz', 'lps');
lbl(P(IV.x - 0.6, IV.y + 0.3, IV.z0 - 0.15), 'ПЗІП DC і AC тип II — в інверторі', 'SPD DC and AC type II — in the inverter', 'bz', 'lps');
lbl(P(117.6, 9.25, 2.6), 'ПЗІП AC тип 2 — у щиті СЕС; ПЗІП RS485', 'SPD AC type 2 — in the PV board; RS485 SPD', 'bz', 'lps');
// ---------- позначка «не працює»: хрест на модулі
const xMat = new THREE.MeshBasicMaterial({color: 0xe23a2e});
function addX(mesh) {
  const isWall = mesh.userData.src === 'wall', g = mesh.geometry.parameters, w = g.width, l = isWall ? g.height : g.depth, d = Math.hypot(w, l), ang = Math.atan2(l, w);
  const grp = new THREE.Group();
  for (const s of [1, -1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(d * 0.92, isWall ? 0.07 : 0.006, isWall ? 0.006 : 0.07), xMat);
    if (isWall) { b.rotation.z = s * ang; b.position.z = T / 2 + 0.008; } else { b.rotation.y = s * ang; b.position.y = T / 2 + 0.008; }
    b.userData.noOcc = true; grp.add(b);
  }
  grp.visible = false; mesh.add(grp); return grp;
}

// ================= підписи будівлі
lbl(P(XC, 46.5, AB.h + AB.f + 1.2), 'Основний блок · арка +13,2…14,5', 'Main block · arch +13.2…14.5');
lbl(P(112.0, 7.5, AL.h + 1.6), 'Південний блок · +10,0', 'South block · +10.0');
lbl(P((s0 + s1) / 2, (SPLIT + s3) / 2, AL.h + 3.3 + 0.9), 'Надбудова, пн. частина +13,3', 'Stair house, north +13.3');
lbl(P((s0 + s1) / 2, (s2 + SPLIT) / 2, AL.h + 2.25 + 0.9), 'Надбудова, пд. частина +12,25', 'Stair house, south +12.25');
lbl(P(90, 50, 17.3), 'Цех', 'Workshop', '', 'ctx'); lbl(P(99.8, 17, 5.6), 'ТП-5913', 'TP-5913', '', 'ctx');
lbl(P(D.ladP1.x, 20.0, D.ladP1.ztop + 1.6), 'Драбина П1', 'Ladder P1', '', 'safety');
lbl(P(132, 50, 0.3), 'Пн ↑', 'N ↑', 'n');
// ================= сонце: положення, ясне небо
const LAT = 50.4 * Math.PI / 180, LON = 30.5, DEG = 180 / Math.PI;
function sunAt(n, t) {
  const dec = 23.44 / DEG * Math.sin(2 * Math.PI * (284 + n) / 365), H = (t - 12) * 15 / DEG;
  const alt = Math.asin(Math.sin(LAT) * Math.sin(dec) + Math.cos(LAT) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(LAT) - Math.tan(dec) * Math.cos(LAT)) + Math.PI;
  return {alt, az, dec, dir: new THREE.Vector3(Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az))};
}
function sunTimes(n) { const dec = 23.44 / DEG * Math.sin(2 * Math.PI * (284 + n) / 365), c = -Math.tan(LAT) * Math.tan(dec); const H0 = Math.acos(Math.max(-1, Math.min(1, c))) * DEG / 15; return [12 - H0, 12 + H0]; }
function sky(n, alt) {
  if (alt <= 0) return {dni: 0, dhi: 0, ghi: 0};
  const hd = alt * DEG, am = 1 / (Math.sin(alt) + 0.50572 * Math.pow(hd + 6.07995, -1.6364));
  const dni = 1361 * (1 + 0.033 * Math.cos(2 * Math.PI * n / 365)) * Math.pow(0.7, Math.pow(am, 0.678)), dhi = 0.1 * dni;
  return {dni, dhi, ghi: dni * Math.sin(alt) + dhi};
}
const tAir = n => 8 + 12 * Math.sin(2 * Math.PI * (n - 110) / 365);
// ================= модулі для розрахунку: 9 точок, стрінги
const pvPart = M(0xd4962e, {roughness: 0.6, metalness: 0.05}), pvShade = M(0x4f585f, {roughness: 0.7, metalness: 0.05}), pvBack = M(0x7d8a9c, {roughness: 0.7, metalness: 0.05}), pvOff = M(0xb3261e, {roughness: 0.6, metalness: 0.05, emissive: 0x3a0806});
const MODS = [], BYKEY = {}, STR = {};
[groups.arch, groups.low, groups.nad, groups.wall].forEach(g => g.children.forEach(m => {
  if (!m.isMesh || !m.userData.key) return; const d = MODREC[m.userData.key]; if (!d || !d.k) return;
  const isW = false, gp = m.geometry.parameters;
  const r = {mesh: m, g: {archD: 'arch', low: 'low', nad: 'nad', wall: 'wall'}[m.userData.src], key: m.userData.key, d, k: d.k, ax: isW ? 'z' : 'y', w: gp.width, l: isW ? gp.height : gp.depth};
  m.updateMatrixWorld(true); m.userData.rec = r;
  r.n = (r.ax === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)).applyQuaternion(m.quaternion).normalize();
  r.pts = []; for (const a of [-1 / 3, 0, 1 / 3]) for (const b of [-1 / 3, 0, 1 / 3]) r.pts.push(m.localToWorld(r.ax === 'y' ? new THREE.Vector3(a * r.w, T / 2 + 0.02, b * r.l) : new THREE.Vector3(a * r.w, b * r.l, T / 2 + 0.02)));
  r.f = 0; r.cos = 0; r.poa = 0; r.p = 0; r.state = 'night'; r.x = addX(m);
  MODS.push(r); BYKEY[r.key] = r; (STR[r.k] = STR[r.k] || []).push(r); (STRO[r.k] = STRO[r.k] || []);
}));
const OCC = [], rc = new THREE.Raycaster(), hitTmp = [];
rc.near = 0; rc.far = 300;
[groups.bld, groups.ctx, groups.arch, groups.low, groups.nad, groups.wall, groups.safety, groups.elec, ...(opts.occ || [])].forEach(g => g.traverse(o => {
  if (!o.isMesh || o.isInstancedMesh || o.userData.noOcc) return;
  const ms = Array.isArray(o.material) ? o.material : [o.material]; if (ms.every(m => m.visible === false || m.depthTest === false)) return;
  o.updateMatrixWorld(true); if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  const s = o.geometry.boundingSphere.clone().applyMatrix4(o.matrixWorld); OCC.push({o, x: s.center.x, y: s.center.y, z: s.center.z, r2: s.radius * s.radius});
}));
const ZTOP = AB.h + AB.f + G.par.g + 0.05;
function archHit(o, d) {
  const on = -o.z, dn = -d.z;
  for (const yf of [AB.y0, AB.y0 + pt, AB.y1 - pt, AB.y1]) {
    if (Math.abs(dn) < 1e-9) break; const s = (yf - on) / dn; if (s <= 0) continue;
    const x = o.x + d.x * s, h = o.y + d.y * s; if (x > AB.x0 && x < AB.x1 && h < zA(x) + G.par.g) return true;
  }
  for (let s = 0.05; s < 60; s += 0.2) {
    const h = o.y + d.y * s; if (h > ZTOP) return false;
    const x = o.x + d.x * s, y = on + dn * s;
    if (x > AB.x0 && x < AB.x1 && y > AB.y0 && y < AB.y1 && h < zA(x) - 0.004) return true;
  }
  return false;
}
function blocked(o, d, self) {
  if (archHit(o, d)) return true;
  rc.ray.origin.copy(o); rc.ray.direction.copy(d);
  for (const c of OCC) {
    if (c.o === self || !c.o.visible) continue;
    const ox = c.x - o.x, oy = c.y - o.y, oz = c.z - o.z, L2 = ox * ox + oy * oy + oz * oz, tca = ox * d.x + oy * d.y + oz * d.z;
    if (L2 > c.r2 && tca < 0) continue; if (L2 - tca * tca > c.r2) continue;
    hitTmp.length = 0; c.o.raycast(rc, hitTmp); if (hitTmp.length) return true;
  }
  return false;
}
const PM = 0.730, NMIN = DB.nmin;
const GN = {arch: ['Арка', 'Arch'], low: ['Нижній дах', 'Lower roof'], nad: ['Надбудова', 'Stair house'], wall: ['Південні стіни', 'South walls']};
// стан кожного модуля: тінь з 9 точок, потім стрінг — струм за найбільшою потужністю, модуль зі струмом нижче за струм стрінга обходиться діодом (не працює)
function evaluate(n, t, store) {
  const s = sunAt(n, t), sk = sky(n, s.alt), Ta = tAir(n), out = [];
  for (const r of MODS) {
    const cos = r.n.dot(s.dir); let f = 1;
    if (s.alt > 0 && cos > 0) { let k = 0; for (const p of r.pts) if (blocked(p, s.dir, r.mesh)) k++; f = k / r.pts.length; }
    const cb = r.n.y, beam = s.alt > 0 ? sk.dni * Math.max(0, cos) * (1 - f) : 0;
    const poa = beam + sk.dhi * (1 + cb) / 2 + 0.2 * sk.ghi * (1 - cb) / 2;
    out.push({r, f, cos, poa});
  }
  const byK = {}; out.forEach(e => (byK[e.r.k] = byK[e.r.k] || []).push(e));
  const tot = {}; for (const g in GN) tot[g] = {n: 0, sun: 0, part: 0, shade: 0, back: 0, off: 0, p: 0};
  const strs = {};
  for (const k in byK) {
    const L = byK[k], I_ = L.map(e => e.poa).sort((a, b) => b - a); let best = -1, cur = 0;
    for (let i = Math.min(NMIN, I_.length) - 1; i < I_.length; i++) { const v = I_[i] * (i + 1); if (v > best) { best = v; cur = I_[i]; } }
    let act = 0, pS = 0;
    for (const e of L) {
      const tc = Ta + e.poa / 800 * 23, kT = (1 - 0.003 * (tc - 25)) * 0.9;
      let st;
      if (s.alt <= 0) st = 'night';
      else if (e.poa < cur * 0.985) st = 'off';
      else if (e.cos <= 0.02) st = 'back';
      else if (e.f > 0.999) st = 'shade';
      else if (e.f > 0.001) st = 'part';
      else st = 'sun';
      const p = st === 'off' || st === 'night' ? 0 : PM * cur / 1000 * kT;
      e.state = st; e.p = p; if (st !== 'off' && st !== 'night') act++; pS += p;
      const q = tot[e.r.g]; q.n++; if (st !== 'night') q[st]++; q.p += p;
      if (store) { e.r.f = e.f; e.r.cos = e.cos; e.r.poa = e.poa; e.r.state = st; e.r.p = p; e.r.cur = cur; }
    }
    strs[k] = {act, n: L.length, cur, p: pS, v: act * 37.5 * Math.min(1, 0.9 + cur / 10000)};
  }
  const all = {n: 0, sun: 0, part: 0, shade: 0, back: 0, off: 0, p: 0}; for (const g in tot) for (const kk in all) all[kk] += tot[g][kk];
  return {n, t, s, sk, Ta, tot, all, strs};
}
// стан модулів кольором — для двійника; сторінка АБК має свій paint з режимами і фокусом. res = evaluate(день року, год, true)
function paintStatus(res) {
  const day = res && res.s.alt > 0;
  for (const r of MODS) { const m = !day ? r.mesh.userData.face0 : r.state === 'off' ? pvOff : r.state === 'part' ? pvPart : r.state === 'shade' ? pvShade : r.state === 'back' ? pvBack : r.mesh.userData.face0;
    r.mesh.userData.base = m; r.mesh.material = m; if (r.x) r.x.visible = !!day && r.state === 'off'; }
}
// ================= етапи монтажу і зведення по позиціях — для збирання всього об'єкта
TAGS.safety = [...(TAGS.p1 || []), ...(TAGS.plat || []), ...(TAGS.rail || []), ...(TAGS.walk || [])];
const qty = (tags, gl) => D.bom.items.filter(x => (gl || []).includes(x.g) || tags.includes(x.tag));
// рядок кошторису → позиція в моделі (рядки без позиції — комісія, страхування, мито, доставка кріплення, механізація, витратні, запас, винагорода)
const EKF = {'1.1': 'mod', '1.2': 'arch', '1.3': 'frame', '1.4': 'wrail', '1.5': 'dc', '1.6': 'tray', '1.7': 'bz', '1.8': 'meter', '3.1': 'mod',
  '4.1': 'inv', '4.2': 'blk', '4.3': 'ac', '4.4': 'shch', '4.5': 'shch', '4.6': 'meter', '4.7': 'blk', '4.8': 'p1', '4.9': 'plat', '4.10': 'p1', '4.11': 'rail', '4.12': 'walk', '4.13': 'anc', '5.1': 'mod', '5.4': 'safety'};
const ELINES = (D.est && D.est.rows || []).filter(r => r.t === 'line');
const estOf = tags => ELINES.filter(r => tags.includes(EKF[r.no]) || (EKF[r.no] === 'safety' && tags.some(t => ['p1', 'plat', 'rail', 'walk'].includes(t))));
const STAGES = [
  ['blk', 'Баласт: блоки з муфтою і матом під лаги, опори і трикутники, без мата — під крайні профілі', 'Ballast: blocks with coupling and mat under rails, supports and triangles, without mat under edge profiles', ['blk'], ['J']],
  ['arch', 'Арка: лаги, гільзи з муфтами, шпильки, крайні профілі з кутниками, анкери', 'Arch: rails, sleeves with couplings, rods, edge profiles with angles, anchors', ['lag', 'arch', 'anc'], ['B']],
  ['frame', 'Опори «доміку» і трикутники 15° на нижньому даху і надбудові', 'Dual-tilt supports and 15° triangles on the lower roof and stair house', ['frame'], ['C']],
  ['wrail', 'Стіни: кронштейни з анкерами і рейки', 'Walls: anchored brackets and rails', ['wrail'], ['D']],
  ['tray', 'Лотки з опорами і кронштейнами', 'Trays with supports and brackets', ['tray'], ['F']],
  ['mod', 'Фотомодулі з притисками', 'PV modules with clamps', ['mod'], ['A']],
  ['dc', 'Кабелі стрінгів, перемички, MC4', 'String cables, jumpers, MC4', ['dc'], ['E']],
  ['inv', 'Інвертор Deye SUN-100K-G03', 'Inverter Deye SUN-100K-G03', ['inv'], []],
  ['ac', 'Кабель AC, щит СЕС, облік, RS485', 'AC cable, PV board, metering, RS485', ['ac', 'shch', 'meter'], []],
  ['bz', 'Вирівнювання потенціалів, ПЗІП', 'Bonding, surge protection', ['bz'], ['H']],
  ['safety', 'Драбини П1, площадка, огородження, доріжки', 'P1 ladders, landing, guardrail, walkways', ['p1', 'plat', 'rail', 'walk'], ['I']]
].map(([k, uk, en, tags, gl]) => { const est = estOf(tags); return {k, uk, en, tags, objs: [...new Set(tags.flatMap(t => TAGS[t] || []))], items: qty(tags, gl), est, sum: est.reduce((x, r) => x + (r.s || 0), 0)}; });
return {root: S, I, G, AL, AB, DB, XC, HW, zA, P, fx, fx1, M, mat, pv, hi, hiF, picks, TAGS, tag, groups, LB, MODS, STR, STRO, BYKEY, MODREC, T, s0, s1, s2, s3, SPLIT, pt, canvasTex,
  scol, strMat, pvPart, pvShade, pvBack, pvOff, evaluate, sunAt, sunTimes, sky, tAir, PM, NMIN, GN, LAT, LON, DEG, OCC, wireMeshes, STAGES, EKF, paintStatus, est: D.est, bom: D.bom};
};
