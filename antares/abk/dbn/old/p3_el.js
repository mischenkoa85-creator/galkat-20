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
