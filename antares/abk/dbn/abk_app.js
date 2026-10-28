// АБК «Антарес», варіант «ДБН» — окрема сторінка (стандарт Антарес): сцена, сонце, панелі, мова UA / EN. Модель — window.ABKModel (abk_model.js).
(function(){
const D = window.ABK_DATA;
// ================= мова: усі тексти — пари UA / EN
let LANG = 'uk';
try { const s = JSON.parse(localStorage.getItem('antares-abk-dbn-v1') || 'null'); if (s && (s.lang === 'en' || s.lang === 'uk')) LANG = s.lang; } catch (e) {}
const L2 = (uk, en) => LANG === 'en' ? en : uk;                       // вибір тексту
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
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

const A = window.ABKModel(THREE, D, {ground: true, ctx: true}); S.add(A.root);
const {I, G, AL, AB, DB, XC, HW, zA, P, fx, fx1, M, mat, pv, hi, hiF, picks, TAGS, tag, groups, LB, MODS, STR, STRO, BYKEY, MODREC, T, s0, s1, s2, s3, SPLIT, pt, canvasTex,
  scol, strMat, pvPart, pvShade, pvBack, pvOff, evaluate, sunAt, sunTimes, sky, tAir, PM, NMIN, GN, LAT, LON, DEG, OCC, STAGES} = A;
const TGT = P(112, 22, 8); sun.target.position.copy(TGT); S.add(sun, sun.target);
const lab = document.getElementById('labels');
LB.forEach(l => { const d = document.createElement('div'); d.className = 'lbl' + (l.cls ? ' ' + l.cls : ''); if (l.cls === 'st') d.style.background = scol(l.k); lab.appendChild(d); l.d = d; });
function labelsText() { LB.forEach(l => l.d.textContent = l.t[LANG]); }
(function () { const s = new THREE.Shape(); s.moveTo(0, 2.2); s.lineTo(0.8, -0.8); s.lineTo(0, -0.3); s.lineTo(-0.8, -0.8); s.lineTo(0, 2.2);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({color: 0xd98a1c})); m.rotation.x = -Math.PI / 2; m.position.copy(P(132, 46.5, 0.05)); S.add(m); })();
const nf = (v, d = 1) => { const s = v.toFixed(d); return LANG === 'en' ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
// ================= сонце в сцені
const skyG = new THREE.Group(); S.add(skyG); const SUNR = 150;
const sunBall = new THREE.Mesh(new THREE.SphereGeometry(4.5, 24, 16), new THREE.MeshBasicMaterial({color: 0xffc23d}));
const glowTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,214,120,0.95)'); gr.addColorStop(0.35, 'rgba(255,190,80,0.35)'); gr.addColorStop(1, 'rgba(255,180,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, transparent: true, depthWrite: false})); glow.scale.set(34, 34, 1);
skyG.add(sunBall, glow);
const pathMat = new THREE.LineBasicMaterial({color: 0xd98a1c, transparent: true, opacity: 0.8});
let pathLine = null; const hourDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.9, 10, 8), new THREE.MeshBasicMaterial({color: 0xd98a1c}), 20); skyG.add(hourDots);
const skyPos = d => TGT.clone().addScaledVector(d, SUNR);
const HRL = [6, 9, 12, 15, 18].map(h => ({h, p: new THREE.Vector3()}));
function buildPath(n) {
  const [sr, ss] = sunTimes(n), pts = [];
  for (let t = sr; t <= ss + 1e-6; t += (ss - sr) / 120) { const s = sunAt(n, t); pts.push(skyPos(s.dir.clone().setY(Math.max(s.dir.y, 0)).normalize())); }
  if (pathLine) { skyG.remove(pathLine); pathLine.geometry.dispose(); }
  pathLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), pathMat); skyG.add(pathLine);
  const o = new THREE.Object3D(); let k = 0;
  for (let h = Math.ceil(sr); h <= Math.floor(ss); h++) { const s = sunAt(n, h); o.position.copy(skyPos(s.dir)); o.updateMatrix(); hourDots.setMatrixAt(k++, o.matrix); }
  hourDots.count = k; hourDots.instanceMatrix.needsUpdate = true;
  HRL.forEach(l => { const on = l.h > sr && l.h < ss; l.on = on; if (on) l.p.copy(skyPos(sunAt(n, l.h).dir)); });
}
// ================= стан інтерфейсу
const $ = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const DAYS = [['21.03', '2026-03-21', 'spring'], ['21.06', '2026-06-21', 'summer'], ['23.09', '2026-09-23', 'autumn'], ['21.12', '2026-12-21', 'winter']];
const SEAS = {spring: ['Весна', 'Spring'], summer: ['Літо', 'Summer'], autumn: ['Осінь', 'Autumn'], winter: ['Зима', 'Winter']};
const MON = [['січ', 'Jan'], ['лют', 'Feb'], ['бер', 'Mar'], ['кві', 'Apr'], ['тра', 'May'], ['чер', 'Jun'], ['лип', 'Jul'], ['сер', 'Aug'], ['вер', 'Sep'], ['жов', 'Oct'], ['лис', 'Nov'], ['гру', 'Dec']];
const MONG = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const MONE = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const doy = s => { const [y, m, d] = s.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5); };
const fmtD = s => { const [, m, d] = s.split('-').map(Number); return LANG === 'en' ? `${d} ${MONE[m - 1]}` : `${d} ${MONG[m - 1]}`; };
const seasonOf = s => { const m = +s.slice(5, 7); return m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn'; };
function hhmm(h) { let hh = Math.floor(h), mm = Math.round((h - hh) * 60); if (mm === 60) { hh++; mm = 0; } return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; }
const DIRS = [['Пн', 'N'], ['Пн-Сх', 'NE'], ['Сх', 'E'], ['Пд-Сх', 'SE'], ['Пд', 'S'], ['Пд-Зх', 'SW'], ['Зх', 'W'], ['Пн-Зх', 'NW']];
function nowSolar() {
  const n0 = doy(new Date().toISOString().slice(0, 10)), B = 2 * Math.PI * (n0 - 81) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const d = new Date(Date.now() + (LON / 15 + eot / 60) * 3600e3);
  return {date: '2026' + d.toISOString().slice(4, 10), t: d.getUTCHours() + d.getUTCMinutes() / 60};
}
const SECS = [['pz', 'Загальне', 'Overview'], ['kosh', 'Кошторис', 'Estimate'], ['spec', 'Специфікація', 'Specification'], ['str', 'Стрінги', 'Strings'], ['el', 'Електрика', 'Electrical'], ['bz', 'Блискавкозахист', 'Lightning'],
  ['mnt', 'Кріплення', 'Mounting'], ['sun', 'Сонце і тінь', 'Sun & shade'], ['dbn', 'Норми ДБН', 'DBN norms'], ['lay', 'Шари', 'Layers'], ['est', 'Що оцінка', 'Assumptions']];
const LAYK = ['arch', 'low', 'nad', 'wall', 'mount', 'str', 'elec', 'lps', 'safety', 'ctx', 'shadow', 'sky', 'labels'];
const state = {sec: 'pz', date: null, t: 13, sheet: null, ctx: true, spd: 1, sunTab: 'now', mode: 'status', lay: {arch: true, low: true, nad: true, wall: true, mount: true, str: false, elec: true, lps: false, safety: true, ctx: true, shadow: true, sky: true, labels: true}};
try { const s = JSON.parse(localStorage.getItem('antares-abk-dbn-v1') || 'null'); if (s) { Object.assign(state, {sec: s.sec || state.sec, sheet: s.sheet || null, ctx: s.ctx !== false, spd: s.spd || 1, sunTab: s.sunTab || 'now', mode: s.mode || 'status'}); if (s.lay) Object.assign(state.lay, s.lay); } } catch (e) {}
const hs = (location.hash || '').slice(1); if (SECS.some(x => x[0] === hs)) state.sec = hs;
if (!SECS.some(x => x[0] === state.sec)) state.sec = 'pz';
function save() { try { localStorage.setItem('antares-abk-dbn-v1', JSON.stringify({sec: state.sec, sheet: state.sheet, ctx: state.ctx, spd: state.spd, sunTab: state.sunTab, mode: state.mode, lay: state.lay, lang: LANG})); } catch (e) {} }
{ const q = nowSolar(), s = sunAt(doy(q.date), q.t); state.date = q.date; state.t = s.alt > 0.05 ? Math.round(q.t * 6) / 6 : 13; }
const N = () => doy(state.date);
// ================= розрахунок «зараз» і за день
let RES = null, DAYR = null, dayJob = null, need = true;
function update() {
  const r = evaluate(N(), state.t, true); RES = r;
  const s = r.s, up = Math.max(s.alt, 0.02), dir = new THREE.Vector3(Math.cos(up) * Math.sin(s.az), Math.sin(up), -Math.cos(up) * Math.cos(s.az));
  sun.position.copy(TGT).addScaledVector(dir, 120); sun.intensity = s.alt > 0 ? 0.25 + 0.75 * Math.min(1, Math.sin(s.alt) * 2) : 0.0;
  hemi.intensity = s.alt > 0 ? 0.55 : 0.35;
  sunBall.position.copy(skyPos(s.dir)); glow.position.copy(sunBall.position); sunBall.visible = glow.visible = s.alt > -0.01;
  paint(); sunUI(); if (state.sec === 'sun' || state.sec === 'str') renderPane(); tipLive(); need = true;
}
const yrMat = []; for (let i = 0; i <= 10; i++) { const c = new THREE.Color().setHSL((1 - i / 10) * 0.33, 0.7, 0.42); yrMat.push(M(c.getHex(), {roughness: 0.6})); }
const OFFMAX = Math.max(...MODS.map(r => r.d.offh), 1);
const FOC = new Set(); let focusKey = null, GHOST = false;
const ghostM = M(0x8aa0b4, {transparent: true, opacity: 0.2, depthWrite: false, roughness: 0.6});
function paint() {
  const day = RES && RES.s.alt > 0, md = state.mode;
  for (const r of MODS) {
    let m = r.mesh.userData.face0;
    if (md === 'strings') m = strMat(r.k);
    else if (md === 'year') m = yrMat[Math.round(r.d.offh / OFFMAX * 10)];
    else if (md === 'status' && day) m = r.state === 'off' ? pvOff : r.state === 'part' ? pvPart : r.state === 'shade' ? pvShade : r.state === 'back' ? pvBack : r.mesh.userData.face0;
    if (GHOST && !FOC.has(r.mesh)) m = ghostM;
    r.mesh.userData.base = m; r.mesh.material = FOC.has(r.mesh) ? hiF : r.mesh === sel ? hi : m;
    r.x.visible = md === 'status' && day && r.state === 'off';
  }
}
function dayKey() { return state.date; }
function startDay() {
  const key = dayKey(); if ((DAYR && DAYR.key === key) || (dayJob && dayJob.key === key)) return;
  const n = N(), [sr, ss] = sunTimes(n), K = Math.max(8, Math.ceil((ss - sr) / 0.25)), dt = (ss - sr) / K;
  const job = dayJob = {key, sr, ss, i: 0, K, pts: [], e: {arch: 0, low: 0, nad: 0, wall: 0}, offh: {}};
  DAYR = null;
  (function step() {
    if (dayJob !== job) return;
    for (let k = 0; k < 2 && job.i < K; k++, job.i++) {
      const t = sr + (job.i + 0.5) * dt, r = evaluate(n, t, false);
      job.pts.push([t, r.all.p, r.tot.arch.p, r.tot.low.p, r.tot.wall.p, r.tot.nad.p, r.all.off]); for (const g in job.e) job.e[g] += r.tot[g].p * dt;
    }
    if (job.i < K) setTimeout(step, 0); else { DAYR = job; dayJob = null; sunUI(); if (state.sec === 'sun') renderPane(); }
  })();
}
const dayE = () => DAYR ? DAYR.e.arch + DAYR.e.low + DAYR.e.nad + DAYR.e.wall : null;
// ================= рядок сонця
const timeEl = $('#time'), dates = $('#dates'), dateEl = $('#date');
function datesUI() {
  dates.innerHTML = '';
  [...DAYS.map(d => [d[0], d[1]]), [L2('Сьогодні', 'Today'), 'today'], [L2('Зараз', 'Now'), 'now']].forEach(([t, v]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.dataset.d = v; dates.appendChild(b);
    b.onclick = () => { if (v === 'now') { const q = nowSolar(); setPlay(false); state.date = q.date; state.t = Math.round(q.t * 6) / 6; } else state.date = v === 'today' ? nowSolar().date : v; dayChanged(); }; });
}
dateEl.onchange = () => { if (/^\d{4}-\d\d-\d\d$/.test(dateEl.value)) { state.date = '2026' + dateEl.value.slice(4); dayChanged(); } };
timeEl.oninput = () => { setPlay(false); state.t = +timeEl.value / 6; update(); };
$('#season').onclick = () => { const i = DAYS.findIndex(d => d[2] === seasonOf(state.date)); state.date = DAYS[(i + 1) % 4][1]; dayChanged(); };
$('#sunmore').onclick = () => { const m = $('#more'), o = m.hidden; m.hidden = !o; $('#sunmore').setAttribute('aria-expanded', String(o)); };
function dayChanged() { buildPath(N()); startDay(); update(); }
function sunUI() {
  const r = RES; if (!r) return;
  timeEl.value = Math.round(state.t * 6); $('#clock').textContent = hhmm(state.t); $('#season').textContent = SEAS[seasonOf(state.date)][LANG === 'en' ? 1 : 0];
  const today = nowSolar().date; dates.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.d === state.date || (b.dataset.d === 'today' && state.date === today && !DAYS.some(d => d[1] === today)))));
  if (dateEl.value !== state.date) dateEl.value = state.date;
  const [sr, ss] = sunTimes(r.n), alt = r.s.alt * DEG, dn = DIRS[Math.round((r.s.az * DEG + 360) % 360 / 45) % 8][LANG === 'en' ? 1 : 0];
  $('#sunx').innerHTML = L2(`${esc(fmtD(state.date))} · висота <b>${nf(Math.max(0, alt), 1)}°</b> · азимут <b>${nf(r.s.az * DEG, 0)}°</b> · схід ${hhmm(sr)} · захід ${hhmm(ss)} · ясне небо · повітря ≈${r.Ta >= 0 ? '+' : '−'}${nf(Math.abs(r.Ta), 0)} °C`,
    `${esc(fmtD(state.date))} · elevation <b>${nf(Math.max(0, alt), 1)}°</b> · azimuth <b>${nf(r.s.az * DEG, 0)}°</b> · sunrise ${hhmm(sr)} · sunset ${hhmm(ss)} · clear sky · air ≈${r.Ta >= 0 ? '+' : '−'}${nf(Math.abs(r.Ta), 0)} °C`);
  let h = `<span class="who">${L2('ДБН', 'DBN')} · ${r.all.n} ${L2('модулів', 'modules')}</span>`;
  if (alt <= 0) h += `<span class="sun">☾ ${L2('сонце за обрієм', 'sun below horizon')}</span>`;
  else h += `<span class="sun">☀ <b>${nf(alt, 0)}°</b> ${dn}</span><span class="offn">${L2('не працює', 'bypassed')} <b class="num">${r.all.off}</b></span><span>${L2('у тіні частково', 'part-shaded')} <b class="num">${r.all.part}</b></span><span>${L2('зараз', 'now')} <b class="num">${nf(r.all.p, 1)} ${L2('кВт', 'kW')}</b> ${L2('ясно', 'clear')} · ${nf(r.all.p / (r.all.n * PM) * 100, 0)} %</span>`;
  h += `<span>${L2('за', 'on')} ${esc(fmtD(state.date))} <b class="num">${dayE() == null ? '…' : nf(dayE(), 0) + ' ' + L2('кВт·год', 'kWh')}</b></span>`;
  $('#now').innerHTML = h;
}
let playT = null; const playBtn = $('#play'), SPDS = [1, 2, 4, 8];
function setPlay(on) { clearInterval(playT); playT = null; playBtn.textContent = on ? '❚❚' : '▶'; const t = on ? L2('Зупинити сонце', 'Stop the sun') : L2('Запустити сонце', 'Run the sun'); playBtn.setAttribute('aria-label', t); playBtn.title = t;
  if (on) { const [sr, ss] = sunTimes(N()); if (state.t >= ss - 0.1 || state.t < sr) state.t = Math.ceil(sr * 6) / 6; playT = setInterval(tickSun, Math.max(30, 170 / state.spd)); } }
function tickSun() { const [sr, ss] = sunTimes(N()); let h = Math.round(state.t * 6) / 6 + 1 / 6; if (h > ss) h = Math.ceil(sr * 6) / 6; state.t = h; update(); }
playBtn.onclick = () => setPlay(!playT);
$('#speed').textContent = '×' + state.spd; $('#speed').onclick = () => { state.spd = SPDS[(SPDS.indexOf(state.spd) + 1) % SPDS.length]; $('#speed').textContent = '×' + state.spd; if (playT) setPlay(true); save(); };
// ================= фокус: позиція специфікації, стрінг, модуль → підсвітка в моделі
const LAYER_OF = {mod: ['arch', 'low', 'nad', 'wall'], lag: ['mount'], arch: ['mount', 'arch'], frame: ['mount'], wrail: ['mount', 'wall'], blk: ['mount', 'elec'], dc: ['str'], tray: ['elec'], inv: ['elec'], ac: ['elec'], shch: ['elec'], meter: ['elec'], bz: ['lps'], p1: ['safety'], plat: ['safety'], rail: ['safety'], walk: ['safety'], safety: ['safety']};
const TAGNAME = {}; D.bom.items.forEach(x => { if (!TAGNAME[x.tag]) TAGNAME[x.tag] = [x.uk, x.en]; });
Object.assign(TAGNAME, {lag: ['Лаги на арці', 'Arch rails'], arch: ['Кріплення на арці', 'Arch mounting'], blk: ['Баластні блоки', 'Ballast blocks'], frame: ['Кріплення «домік» 15°', 'Dual-tilt 15° mounting'], wrail: ['Рейки на стінах', 'Wall rails'],
  dc: ['Кабелі DC стрінгів', 'String DC cables'], tray: ['Лотки 100×50', 'Cable trays 100×50'], inv: ['Інвертор Deye SUN-100K-G03', 'Inverter Deye SUN-100K-G03'], ac: ['Кабель AC 5×70 і RS485', 'AC cable 5×70 and RS485'], shch: ['Щит СЕС', 'PV board'], meter: ['Облік і Zero Export', 'Metering and Zero Export'],
  bz: ['Вирівнювання потенціалів і БЗ', 'Bonding and lightning protection'], p1: ['Драбини П1', 'Ladders P1'], plat: ['Площадка на арці', 'Landing on the arch'], rail: ['Огородження 0,6 м', 'Guardrail 0.6 m'], walk: ['Ходові доріжки', 'Walkways'], mod: ['Фотомодулі', 'PV modules'], safety: ['Безпека на покрівлі', 'Roof safety']});
const FOCMAT = new Map();
function clearFocus(quiet) {
  FOCMAT.forEach((m, o) => { o.material = m; }); FOCMAT.clear(); FOC.clear(); focusKey = null; GHOST = false; $('#focusbar').hidden = true;
  if (!quiet) { paint(); need = true; if (['spec', 'kosh', 'str', 'el', 'bz', 'mnt'].includes(state.sec)) renderPane(); }
}
function bboxOf(objs) {
  const b = new THREE.Box3(), v = new THREE.Vector3(), m4 = new THREE.Matrix4();
  objs.forEach(o => {
    o.updateMatrixWorld(true);
    if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); b.expandByPoint(v); } }
    else b.expandByObject(o);
  });
  return b;
}
function flyTo(b, k = 1) {
  if (b.isEmpty()) return; const c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3()).length();
  const dir = cam.position.clone().sub(ctl.target).normalize(); if (dir.y < 0.35) { dir.y = 0.45; dir.normalize(); }
  const dist = Math.max(9, sz * 1.15 * k + 4); anim = {p0: cam.position.clone(), t0: ctl.target.clone(), p: c.clone().addScaledVector(dir, dist), t: c, s: performance.now()};
}
function focus(key, label) {
  clearFocus(true); focusKey = key; GHOST = ['lag', 'arch', 'blk', 'frame', 'wrail', 'bz', 'dc', 'tray'].includes(key);
  let objs = [], layers = [];
  if (key.startsWith('S')) { const k = +key.slice(1); objs = [...(STR[k] || []).map(r => r.mesh), ...(STRO[k] || [])]; layers = ['str', ...new Set((STR[k] || []).map(r => r.g))]; }
  else if (key.startsWith('m:')) { const r = BYKEY[key.slice(2)]; if (r) { objs = [r.mesh]; layers = [r.g]; } }
  else { objs = TAGS[key] || []; layers = LAYER_OF[key] || []; }
  layers.forEach(l => { if (!state.lay[l]) { state.lay[l] = true; } }); setVis(true);
  objs.forEach(o => { if (o.isLine || o.isLineSegments) return; if (o.userData.rec) { FOC.add(o); return; } FOCMAT.set(o, o.material); o.material = hiF; });
  $('#focustxt').textContent = label || (TAGNAME[key] ? TAGNAME[key][LANG === 'en' ? 1 : 0] : key); $('#focusbar').hidden = false;
  paint(); flyTo(bboxOf(objs.filter(o => !o.isLine)), key === 'mod' ? 0.75 : 1); need = true;
  if (['spec', 'kosh', 'str', 'el', 'bz', 'mnt', 'sun'].includes(state.sec)) renderPane();
}
$('#focusx').onclick = () => clearFocus();
// ================= вкладки і розділи
const tabs = $('#tabs'), pane = $('#pane');
function tabsUI() {
  tabs.innerHTML = '';
  SECS.forEach(([k, u, e]) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.s = k; b.textContent = L2(u, e); b.onclick = () => { state.sec = k; if (state.sheet === 'peek') sheetSet('half'); apply(); }; tabs.appendChild(b); });
}
function stepSec(dir) { const i = SECS.findIndex(x => x[0] === state.sec); state.sec = SECS[(i + dir + SECS.length) % SECS.length][0]; apply(); }
$('#tabPrev').onclick = () => stepSec(-1); $('#tabNext').onclick = () => stepSec(1);
const stat = (v, k) => `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`;
const kvHTML = rows => `<dl class="kv">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${r[1]}${r[2] ? `<small>${esc(r[2])}</small>` : ''}</dd>`).join('')}</dl>`;
const usd = v => (LANG === 'en' ? '$' + nf(v, 0) : nf(v, 0) + ' $');
const E = D.est, BOMN = D.bom.n, NIN = DB.n;
const go = (k, t) => `<button type="button" data-go="${k}">${esc(t)}</button>`;
const qtyF = v => Number.isInteger(v) ? nf(v, 0) : nf(v, 1);
// ---------- Загальне
function panelPZ() {
  const kwp = NIN * PM;
  return `<div class="ph"><span class="eyebrow">${L2('Адмінкорпус · варіант «ДБН»', 'Admin building · DBN option')}</span><h2>${L2(`${NIN} модулів · ${nf(kwp, 2)} кВтп · інвертор Deye 100 кВт`, `${NIN} modules · ${nf(kwp, 2)} kWp · Deye 100 kW inverter`)}</h2>
    <p>${L2('ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А. Розкладка з ходовими доріжками, драбинами П1 і огородженням 0,6 м; 11 стрінгів по 12 модулів на 6 MPPT; без видачі в мережу.', 'Antares LLC, Kyiv, 1-A Mykoly Vasylenka St. Layout with walkways, P1 ladders and a 0.6 m guardrail; 11 strings of 12 modules on 6 MPPT; no export to the grid.')}</p></div>
  <div class="blk"><div class="stats">${stat(usd(E.tot), L2('під ключ без ПДВ', 'turnkey excl. VAT'))}${stat(usd(E.totv), L2('з ПДВ 20 %', 'incl. VAT 20 %'))}${stat(nf(E.e_ac, 1) + ' ' + L2('МВт·год', 'MWh'), L2('на виході інвертора за рік', 'inverter output per year'))}${stat(nf(E.e_pb, 1) + ' ' + L2('року', 'years'), L2('проста окупність без ПДВ', 'simple payback excl. VAT'))}</div></div>
  <div class="blk"><h3>${L2('Де модулі', 'Where the modules are')}</h3>${kvHTML([[L2('Арка (лаги на баласті)', 'Arch (rails on ballast)'), BOMN.NA, L2('2 доріжки 0,8 м і зв\'язка', '2 walkways 0.8 m and a tie')], [L2('Нижній дах, «домік» 15°', 'Lower roof, dual-tilt 15°'), BOMN.NL, L2('2 місця біля драбини вільні', '2 places by the ladder left empty')],
    [L2('Надбудова, «домік» 15°', 'Stair house, dual-tilt 15°'), BOMN.NN], [L2('Південні стіни, вертикально', 'South walls, vertical'), BOMN.NW], [L2('Разом у стрінгах', 'Total in strings'), `<b>${NIN}</b>`, `${BOMN.ST} × ${DB.L}`]])}</div>
  <div class="blk"><h3>${L2('Що є в моделі', 'What the model shows')}</h3><ul class="blist">
    <li>${L2('усі модулі натискаються: стрінг, MPPT, місце в стрінгу, генерація за рік, коли не працює (графік за місяцями й годинами), стан зараз;', 'every module is clickable: string, MPPT, position in string, annual yield, when it is bypassed (month × hour chart), state now;')}</li>
    <li>${L2('стрінги кольорами, кабелі «+» і «−» до інвертора, перемички; лотки, інвертор, кабель AC, щит СЕС, облік;', 'strings in colours, + and − cables to the inverter, jumpers; trays, inverter, AC cable, PV board, metering;')}</li>
    <li>${L2('блискавкозахист і вирівнювання потенціалів, кріплення (лаги, баласт, «домік», рейки на стінах), драбини, огородження, доріжки;', 'lightning protection and bonding, mounting (rails, ballast, dual-tilt, wall rails), ladders, guardrail, walkways;')}</li>
    <li>${L2('тінь зараз і за день, модулі, що не працюють, — червоні з хрестом; специфікація — кожна позиція показує себе в моделі.', 'shade now and over the day, bypassed modules in red with a cross; specification — every item shows itself in the model.')}</li></ul>
    <div class="chips2">${go('spec', L2('Специфікація', 'Specification'))}${go('str', L2('Стрінги', 'Strings'))}${go('el', L2('Електрика', 'Electrical'))}${go('bz', L2('Блискавкозахист', 'Lightning'))}${go('sun', L2('Сонце і тінь', 'Sun & shade'))}</div></div>
  <div class="blk"><h3>${L2('Кошторис, $ без ПДВ', 'Estimate, USD excl. VAT')}</h3>${kvHTML([[L2('Закупівля в Китаї', 'Purchase in China'), nf(E.sec.t1, 0)], [L2('Комісія', 'Commission'), nf(E.sec.t2, 0)], [L2('Доставка і мито', 'Delivery and duty'), nf(E.sec.t3, 0)], [L2('Купуємо в Україні', 'Purchased in Ukraine'), nf(E.sec.t4, 0)], [L2('Роботи', 'Works'), nf(E.sec.t5, 0)], [L2('Запас і винагорода', 'Contingency and fee'), nf(E.sec.t6, 0)], [L2('Разом під ключ', 'Total turnkey'), `<b>${nf(E.tot, 0)}</b>`, `${nf(E.pkwp, 0)} $/${L2('кВтп', 'kWp')}`]])}
    <p class="src">${L2('Кошторис будівництва під ключ СЕС АБК, варіант «ДБН», 28.10.2026 — PDF і Excel з формулами (окремі файли).', 'Turnkey estimate, admin building PV, DBN option, 28 Oct 2026 — PDF and Excel with formulas (separate files).')}</p></div>`;
}
// ---------- Кошторис: усі рядки кошторису ДБН, рядок → позиція в моделі
const KF = A.EKF;                                                     // рядок кошторису → позиція в моделі (abk_model.js)
const u2 = u => u ? (u.split(' / ')[LANG === 'en' ? 1 : 0] || u) : '';
const pctF = v => nf(v * 100, v * 100 % 1 ? 1 : 0) + ' %';
function effF(r) { const u = r.u || '', v = r.s;
  const d = /МВт/.test(u) ? 1 : /кВтп \/ kWp/.test(u) ? 2 : /\$\/кВт·год/.test(u) ? 3 : /рок/.test(u) ? 1 : 0;
  const un = /кВт·год\/кВтп/.test(u) ? L2('кВт·год/кВтп', 'kWh/kWp') : /\$\/кВт·год/.test(u) ? L2('$/кВт·год', '$/kWh') : u2(u);
  return `${nf(v, d)} ${esc(un)}`; }
function panelKosh() {
  const R = E.rows || [], en = LANG === 'en';
  let h = `<div class="ph"><span class="eyebrow">${L2('Кошторис будівництва під ключ · варіант «ДБН» · 28.10.2026', 'Turnkey construction estimate · DBN option · 28 Oct 2026')}</span><h2>${L2(`${usd(E.tot)} без ПДВ · ${usd(E.totv)} з ПДВ`, `${usd(E.tot)} excl. VAT · ${usd(E.totv)} incl. VAT`)}</h2>
    <p>${L2('Натисніть рядок — позиція підсвітиться в моделі. Ціни в доларах США, без ПДВ.', 'Click a line — the item lights up in the model. Prices in US dollars, excl. VAT.')}</p></div>
  <div class="blk"><div class="stats">${stat(usd(E.tot), L2('під ключ без ПДВ', 'turnkey excl. VAT'))}${stat(usd(E.totv), L2('з ПДВ 20 %', 'incl. VAT 20 %'))}${stat(usd(E.tot245), L2('з ПДВ, модулі за пільгою «245»', 'incl. VAT, modules under "245"'))}${stat(nf(E.pkwp, 0) + ' $', L2('на 1 кВтп без ПДВ', 'per kWp excl. VAT'))}</div></div>
  <div class="blk wide"><table class="spec kosh"><thead><tr><th>№</th><th>${L2('Позиція', 'Item')}</th><th class="hide-s">${L2('Од.', 'Unit')}</th><th class="hide-s" style="text-align:right">${L2('К-сть', 'Qty')}</th><th class="hide-s" style="text-align:right">${L2('Ціна, $', 'Price, $')}</th><th style="text-align:right">${L2('Сума, $', 'Sum, $')}</th></tr></thead><tbody>`;
  let inEff = false;
  for (const r of R) {
    if (r.t === 'sec') { inEff = /^7\./.test(r.uk); h += `<tr class="g"><td colspan="6">${esc(en ? r.en : r.uk)}</td></tr>`; continue; }
    if (r.t === 'tot') {
      const big = /^РАЗОМ ПІД КЛЮЧ/.test(r.uk) || /^СОБІВАРТІСТЬ/.test(r.uk);
      const v = inEff ? effF(r) : /На 1 кВтп/.test(r.uk) ? nf(r.s, 0) : nf(r.s, 0);
      h += `<tr class="t${big ? ' big' : ''}"><td></td><td colspan="4">${esc(en ? r.en : r.uk)}</td><td class="n">${v}</td></tr>`; continue; }
    const f = KF[r.no], isp = r.u == null, pr = r.pr, cur = f && focusKey === f;
    const prs = isp ? (pr < 1 ? pctF(pr) : '×' + nf(pr, 4)) : (pr ? nf(pr, pr < 1000 && pr % 1 ? 2 : 0) : '—');
    const q = isp ? '' : (Number.isInteger(r.q) ? nf(r.q, 0) : nf(r.q, 1));
    const duty = r.duty ? ` · ${L2('мито', 'duty')} ${pctF(r.duty)}` : '';
    h += `<tr class="it${cur ? ' cur' : ''}${f ? '' : ' nf'}"${f ? ` data-f="${f}" data-l="${esc(en ? r.en : r.uk)}"` : ''}><td>${r.no}</td><td>${esc(en ? r.en : r.uk)}<small>${esc(en ? r.uk : r.en)}</small><small class="bs">${esc(r.src || '')}${duty}</small></td><td class="hide-s">${esc(u2(r.u))}</td><td class="n hide-s">${q}</td><td class="n hide-s">${prs}</td><td class="n b">${r.s ? nf(r.s, 0) : '—'}</td></tr>`;
  }
  return h + `</tbody></table></div>
  <div class="blk"><h3>${L2('Файли кошторису', 'Estimate files')}</h3><p class="src">${esc(E.file || '')}.pdf · .xlsx — ${L2('PDF дві мови; Excel з формулами, ціни у жовтих клітинках.', 'PDF in two languages; Excel with formulas, prices in yellow cells.')}</p>
    <div class="chips2">${go('spec', L2('Специфікація', 'Specification'))}${go('f:mod', L2('Модулі в моделі', 'Modules in the model'))}${go('f:inv', L2('Інвертор', 'Inverter'))}${go('f:safety', L2('Безпека', 'Safety'))}</div></div>`;
}
// ---------- Специфікація
function panelSpec() {
  let h = `<div class="ph"><span class="eyebrow">${L2('Специфікація · варіант «ДБН»', 'Bill of materials · DBN option')}</span><h2>${L2(`${D.bom.items.length} позицій — натисніть рядок, щоб побачити в моделі`, `${D.bom.items.length} items — click a row to see it in the model`)}</h2>
    <p>${L2('Кількості — з цієї 3D-моделі і розрахунку стрінгів; ціни — у кошторисі за рядком.', 'Quantities from this 3D model and the string design; prices are in the estimate line shown.')}</p></div><div class="blk wide"><table class="spec"><thead><tr><th>№</th><th>${L2('Позиція', 'Item')}</th><th>${L2('Од.', 'Unit')}</th><th style="text-align:right">${L2('К-сть', 'Qty')}</th><th class="hide-s">${L2('Рядок', 'Line')}</th></tr></thead><tbody>`;
  for (const [g, nm] of Object.entries(D.bom.groups)) {
    const its = D.bom.items.filter(x => x.g === g); if (!its.length) continue;
    h += `<tr class="g"><td colspan="5">${g}. ${esc(nm[LANG === 'en' ? 1 : 0])}</td></tr>`;
    its.forEach((x, i) => { const u = x.u.split(' / ')[LANG === 'en' ? 1 : 0] || x.u; h += `<tr class="it${focusKey === x.tag ? ' cur' : ''}" data-f="${x.tag}" data-l="${esc(x[LANG === 'en' ? 'en' : 'uk'])}"><td>${g}${i + 1}</td><td>${esc(x[LANG === 'en' ? 'en' : 'uk'])}<small>${esc(x[LANG === 'en' ? 'uk' : 'en'])}</small></td><td>${esc(u)}</td><td class="n">${qtyF(x.q)}</td><td class="r hide-s">${esc(x.ref)}</td></tr>`; });
  }
  return h + `</tbody></table></div>`;
}
// ---------- Стрінги
const PN = {A: ['арка', 'arch'], L: ['нижній дах', 'lower roof'], N: ['надбудова', 'stair house'], W: ['стіни', 'walls']}, FN = {E: ['схід', 'E'], W: ['захід', 'W'], S: ['південь', 'S']};
function panelStr() {
  const r = RES, up = r && r.s.alt > 0;
  const rows = [...DB.strings].sort((a, b) => a.mppt - b.mppt || a.k - b.k).map(s => { const z = up ? r.strs[s.k] : null, offh = (STR[s.k] || []).reduce((a, q) => a + q.d.offh, 0);
    return `<tr class="go${focusKey === 'S' + s.k ? ' cur' : ''}" data-f="S${s.k}"><td class="l"><span class="swc" style="background:${scol(s.k)}"></span>S${s.k}</td><td>${s.mppt}</td><td class="l">${s.parts.split('').map(p => PN[p][LANG === 'en' ? 1 : 0]).join(' + ')} · ${s.faces.split('').map(f => FN[f][LANG === 'en' ? 1 : 0]).join(', ')}</td><td>${nf(s.mwh, 2)}</td><td>${nf(s.mism, 1)}</td><td>${nf(s.dc, 0)}</td><td>${nf(offh, 0)}</td><td>${z ? `${z.act}/${z.n}` : '—'}</td></tr>`; }).join('');
  return `<div class="ph"><span class="eyebrow">${L2('Стрінги і MPPT · Deye SUN-100K-G03', 'Strings and MPPT · Deye SUN-100K-G03')}</span><h2>${L2(`${DB.strings.length} стрінгів по ${DB.L} модулів, 6 MPPT по 2 стрінги`, `${DB.strings.length} strings of ${DB.L} modules, 6 MPPT with 2 strings each`)}</h2>
    <p>${L2('Натисніть рядок — стрінг підсвітиться в моделі разом з кабелями. Режим «Стрінги» вгорі фарбує всі модулі за стрінгами.', 'Click a row — the string and its cables are highlighted. The Strings mode above colours all modules by string.')}</p></div>
  <div class="blk wide"><table class="cmp"><thead><tr><th>${L2('Стрінг', 'String')}</th><th>MPPT</th><th style="text-align:left">${L2('Де · грані', 'Where · faces')}</th><th>${L2('МВт·год', 'MWh')}</th><th>${L2('Невідп., %', 'Mism., %')}</th><th>DC, ${L2('м', 'm')}</th><th>${L2('Не працює, мод.-год/рік', 'Bypassed, mod-h/yr')}</th><th>${L2('Зараз у роботі', 'Working now')}</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="blk"><h3>${L2('Перевірка напруг і струмів', 'Voltage and current check')}</h3>${kvHTML([[`Voc ${L2('при', 'at')} −30 °C`, `${nf(DB.strings[0].voc30, 0)} ${L2('В', 'V')} ≤ 1 000`], [`Vmp ${L2('при', 'at')} 70 °C`, `${nf(DB.strings[0].vmp70, 0)} ${L2('В', 'V')} ≥ 250`], [`Vmp ${L2('при', 'at')} −10 °C`, `${nf(DB.L * 45.93, 0)} ${L2('В', 'V')} ≤ 850`], [L2('Струм на MPPT (2 стрінги)', 'Current per MPPT (2 strings)'), `35,0 ${L2('А', 'A')} ≤ 40`], [L2('Isc на MPPT', 'Isc per MPPT'), `37,0 ${L2('А', 'A')} ≤ 60`]])}</div>
  <div class="blk"><h3>${L2('Як зібрано', 'How they are made up')}</h3><p>${L2('Стрінги — з модулів однієї грані й близького нахилу («змійкою» по колонках); залишки різних орієнтацій — спільні стрінги, якщо втрати від невідповідності ≤ 12 %. Стрінг стін і доміків (S11) — на окремому MPPT 6. Кабель під модулями йде вздовж лаги, далі — у лотку до інвертора; між модулями через доріжку чи на інший дах — перемички.', 'Strings are made of modules of the same face and similar tilt (snaking along columns); leftovers of different orientations form shared strings if mismatch losses ≤ 12 %. The wall and dual-tilt string (S11) is on its own MPPT 6. Under the modules the cable runs along the rail, then in the tray to the inverter; across walkways or to another roof — jumpers.')}</p>
    <p class="src">${L2('Генерація і невідповідність — повна модель K1 (Meteonorm 8.1, тіні DSM, байпас-діоди); «не працює» — модуль обходиться діодом за ясного неба.', 'Yield and mismatch — full K1 model (Meteonorm 8.1, DSM shading, bypass diodes); bypassed — module bypassed by its diodes under clear sky.')}</p></div>`;
}
// ---------- Електрика: однолінійна схема
function sldSVG() {
  const W = 640, Hh = 300, mp = DB.mppt, bx = (x, y, w, h, t1, t2, f) => `<g class="go" data-f="${f}"><rect class="bx" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><text x="${x + w / 2}" y="${y + h / 2 - (t2 ? 3 : -4)}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">${esc(t1)}</text>${t2 ? `<text x="${x + w / 2}" y="${y + h / 2 + 11}" text-anchor="middle" font-size="9.5" fill="var(--ink-2)">${esc(t2)}</text>` : ''}</g>`;
  let s = '';
  mp.forEach((g, i) => { const y = 14 + i * 46; s += `<g class="go" data-f="S${g[0]}"><rect class="bx" x="8" y="${y}" width="120" height="36" rx="6"/>` + g.map((k, j) => `<rect x="${16 + j * 52}" y="${y + 8}" width="46" height="20" rx="4" fill="${scol(k)}"/><text x="${39 + j * 52}" y="${y + 22}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">S${k}</text>`).join('') + `</g>`;
    s += `<line x1="128" y1="${y + 18}" x2="192" y2="${y + 18}" stroke="var(--dcp)" stroke-width="1.6"/><text x="160" y="${y + 13}" text-anchor="middle" font-size="9" fill="var(--ink-3)">MPPT ${i + 1}</text>`; });
  s += bx(192, 14, 132, 272, 'Deye SUN-100K-G03', L2('100 кВт · DC ≤ 1 000 В', '100 kW · DC ≤ 1000 V'), 'inv');
  s += `<text x="258" y="70" text-anchor="middle" font-size="9.5" fill="var(--ink-2)">${L2('DC-роз\'єднувач', 'DC switch')}</text><text x="258" y="84" text-anchor="middle" font-size="9.5" fill="var(--ink-2)">${L2('ПЗІП DC/AC тип II', 'SPD DC/AC type II')}</text><text x="258" y="226" text-anchor="middle" font-size="9.5" fill="var(--ink-2)">Zero Export</text>`;
  s += `<line x1="324" y1="150" x2="392" y2="150" stroke="var(--ink)" stroke-width="2.2"/><text x="358" y="140" text-anchor="middle" font-size="9" fill="var(--ink-2)">5×70 Cu</text><text x="358" y="166" text-anchor="middle" font-size="9" fill="var(--ink-2)">45 ${L2('м', 'm')}</text>`;
  s += bx(392, 110, 112, 80, L2('Щит СЕС', 'PV board'), L2('QF 200 А · ПЗІП т2', 'MCCB 200 A · SPD t2'), 'shch');
  s += `<line x1="504" y1="150" x2="528" y2="150" stroke="var(--ink)" stroke-width="2.2"/>`;
  s += bx(528, 96, 106, 108, L2('Вступний щит', 'Main board'), L2('ТС 250 А + DTSU666', 'CT 250 A + DTSU666'), 'meter');
  s += `<line x1="581" y1="96" x2="581" y2="40" stroke="var(--ink)" stroke-width="2.2"/><text x="581" y="32" text-anchor="middle" font-size="10" font-weight="600" fill="var(--ink)">${L2('Мережа 0,4 кВ', 'Grid 0.4 kV')}</text>`;
  s += `<path d="M581 204 V250 H258 V286" fill="none" stroke="var(--ours)" stroke-width="1.4" stroke-dasharray="5 3"/><text x="420" y="264" text-anchor="middle" font-size="9.5" fill="var(--ours)">RS485 ${L2('лічильник → інвертор', 'meter → inverter')}</text>`;
  return `<svg class="sld" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${L2('Однолінійна схема', 'Single-line diagram')}">${s}</svg>`;
}
function panelEl() {
  return `<div class="ph"><span class="eyebrow">${L2('Електрика · DC до 1 000 В', 'Electrical · DC up to 1000 V')}</span><h2>${L2('Стрінги → інвертор Deye → щит СЕС → вступний щит АБК', 'Strings → Deye inverter → PV board → building main board')}</h2><p>${L2('Натисніть блок схеми — він підсвітиться в моделі.', 'Click a block of the diagram to highlight it in the model.')}</p></div>
  <div class="blk wide">${sldSVG()}</div>
  <div class="blk"><h3>${L2('Інвертор', 'Inverter')}</h3>${kvHTML([[L2('Модель', 'Model'), 'Deye SUN-100K-G03'], [L2('Потужність AC', 'AC power'), `100 ${L2('кВт', 'kW')}`, L2('DC/AC = 0,96', 'DC/AC = 0.96')], [L2('Входи', 'Inputs'), '6 MPPT × 2', '40 A / Isc 60 A'], [L2('Напруги', 'Voltages'), L2('DC ≤ 1 000 В, MPPT 200–850', 'DC ≤ 1000 V, MPPT 200–850')], [L2('Струм AC', 'AC current'), L2('до 159,4 А при 400 В', 'up to 159.4 A at 400 V')], [L2('Місце', 'Place'), L2('пн. стіна надбудови, +10,6', 'stair house north wall, +10.6'), L2('у тіні, над лотком', 'in shade, above the tray')]])}
    <div class="chips2">${go('f:inv', L2('Показати інвертор', 'Show the inverter'))}${go('f:tray', L2('Лотки', 'Trays'))}${go('f:dc', L2('Кабелі DC', 'DC cables'))}</div></div>
  <div class="blk"><h3>${L2('Підключення і облік', 'Connection and metering')}</h3>${kvHTML([[L2('Кабель AC', 'AC cable'), L2('ВВГнг 5×70 мм², 45 м', 'VVGng 5×70 mm², 45 m'), L2('у надбудову і стояком сходів', 'into the stair house and down the stair riser')], [L2('Щит СЕС', 'PV board'), 'ABB A2B 250 TMF 200', L2('IP54, ПЗІП AC тип 2 4P', 'IP54, AC SPD type 2 4P')], [L2('Облік', 'Metering'), 'CHINT DTSU666', L2('трансформатори струму 250 А на вводі', '250 A CTs on the incomer')], [L2('Режим', 'Mode'), 'Zero Export', L2('без видачі в мережу; ОСР — повідомлення за Додатком 11 КСР', 'no export; DSO notified per Annex 11 of the Distribution Code')]])}
    <div class="chips2">${go('f:ac', L2('Кабель AC', 'AC cable'))}${go('f:shch', L2('Щит СЕС', 'PV board'))}${go('f:meter', L2('Облік', 'Metering'))}</div></div>
  <div class="blk"><h3>${L2('Траси DC', 'DC routes')}</h3><p>${L2(`Лотки 100×50 з кришкою: по доріжках арки і зв'язці, спуск по південній стіні основного блоку за надбудовою (1 м від драбини П1), уздовж стін на нижньому даху, з надбудови по її північній стіні. Траси ≈${nf(DB.tray_len, 0)} м; кабель 1×6 — «+» ${nf(DB.dc.plus, 0)} м, «−» ${nf(DB.dc.minus, 0)} м, перемички ${nf(DB.dc.jump, 0)} м (${DB.dc.njump}).`, `Trays 100×50 with lids: along the arch walkways and tie, down the main block south wall behind the stair house (1 m from ladder P1), along walls on the lower roof, from the stair house down its north wall. Routes ≈${nf(DB.tray_len, 0)} m; 1×6 cable — + ${nf(DB.dc.plus, 0)} m, − ${nf(DB.dc.minus, 0)} m, jumpers ${nf(DB.dc.jump, 0)} m (${DB.dc.njump}).`)}</p></div>`;
}
// ---------- Блискавкозахист
function panelBZ() {
  const it = D.bom.items.filter(x => x.g === 'H'), nmG = {arch: L2('арка', 'arch'), low: L2('нижній дах', 'lower roof'), nad: L2('надбудова', 'stair house'), wall: L2('стіни', 'walls')};
  return `<div class="ph"><span class="eyebrow">${L2('Блискавкозахист і вирівнювання потенціалів', 'Lightning protection and equipotential bonding')}</span><h2>${L2('Без зовнішніх щогл — як том 7 СЕС цеху', 'No external masts — as volume 7 of the shop PV')}</h2>
    <p>${L2('Каркас кожного блоку кріплення з\'єднано провідником Cu 1×6 у лотках з PE інвертора, а через PE кабелю AC — з головною заземлювальною шиною будівлі; у місці переходу лотка через парапет — приєднання Cu 1×16 до наявного прутка. Перенапруги — ПЗІП тип II в інверторі на DC і AC, тип 2 у щиті СЕС, ПЗІП RS485.', 'The frame of every mounting block is bonded with Cu 1×6 in the trays to the inverter PE, and via the AC cable PE to the building main earthing bar; where the tray crosses the parapet, Cu 1×16 is connected to the existing rod. Surges — type II SPD in the inverter on DC and AC, type 2 in the PV board, RS485 SPD.')}</p></div>
  <div class="blk"><h3>${L2('Що входить', 'What is included')}</h3>${kvHTML(it.map(x => [x[LANG === 'en' ? 'en' : 'uk'], `${qtyF(x.q)} ${x.u.split(' / ')[LANG === 'en' ? 1 : 0] || x.u}`]))}<div class="chips2">${go('f:bz', L2('Показати в моделі', 'Show in the model'))}</div></div>
  <div class="blk"><h3>${L2(`Блоки кріплення — ${DB.lps.groups.length}, по 2 приєднання`, `Mounting blocks — ${DB.lps.groups.length}, 2 connections each`)}</h3>${kvHTML(DB.lps.groups.map(g => [`${nmG[g.g.split('-')[0]]} · ${g.g.split('-')[1]}`, `${g.n} ${L2('мод.', 'mod.')}`]))}</div>
  <div class="note warn wide">${L2('Наявний пруток на парапетах основного блоку схожий на блискавкоприймач старої системи: при обстеженні перевірити, чи є спуски й заземлення. Тип покрівлі (горюча чи ні) впливає на ризик пожежі даху від удару блискавки.', 'The existing rod on the main block parapets looks like an old air-termination: check for down-conductors and earthing during the survey. Roof type (combustible or not) affects the roof fire risk from a strike.')}</div>`;
}
// ---------- Кріплення
function panelMnt() {
  const sect = g => kvHTML(D.bom.items.filter(x => x.g === g).map(x => [x[LANG === 'en' ? 'en' : 'uk'], `${qtyF(x.q)} ${x.u.split(' / ')[LANG === 'en' ? 1 : 0] || x.u}`]));
  return `<div class="ph"><span class="eyebrow">${L2('Кріплення і баласт', 'Mounting and ballast')}</span><h2>${L2('Арка — лаги на баласті, як на даху цеху; дахи — «домік» 15°; стіни — рейки', 'Arch — rails on ballast as on the shop roof; roofs — dual-tilt 15°; walls — rails')}</h2></div>
  <div class="blk"><h3>${L2(`Арка — ${BOMN.NA} модулів`, `Arch — ${BOMN.NA} modules`)}</h3>${sect('B')}<div class="chips2">${go('f:arch', L2('Показати', 'Show'))}</div></div>
  <div class="blk"><h3>${L2(`«Домік» 15° — ${BOMN.NL + BOMN.NN} модулів`, `Dual-tilt 15° — ${BOMN.NL + BOMN.NN} modules`)}</h3>${sect('C')}<div class="chips2">${go('f:frame', L2('Показати', 'Show'))}</div>
    <h3 style="margin-top:8px">${L2(`Стіни — ${BOMN.NW} модулів`, `Walls — ${BOMN.NW} modules`)}</h3>${sect('D')}<div class="chips2">${go('f:wrail', L2('Показати', 'Show'))}</div></div>
  <div class="blk"><h3>${L2('Баласт', 'Ballast')}</h3>${kvHTML([[L2('Під лаги арки', 'Under arch rails'), nf(D.bom.blk.arch, 0)], [L2('Під крайні профілі', 'Under edge profiles'), nf(D.bom.blk.edge, 0)], [L2('«Домік», 4 на модуль', 'Dual-tilt, 4 per module'), nf(D.bom.blk.dom, 0)], [L2('Опори лотків', 'Tray supports'), nf(D.bom.blk.tray, 0)], [L2('Разом до замовлення (+1 %)', 'Total to order (+1 %)'), `<b>${nf(D.bom.blk.tot, 0)}</b>`, L2('300×300×60, 13 кг, з муфтою і матом', '300×300×60, 13 kg, with coupling and mat')]])}<div class="chips2">${go('f:blk', L2('Показати', 'Show'))}</div></div>`;
}
// ---------- Сонце і тінь
function heatSVG(get, maxV, title, hours = [4, 21]) {
  const [h0, h1] = hours, cw = 18, ch = 14, l = 34, t = 14, W = l + (h1 - h0) * cw + 4, H = t + 12 * ch + 18;
  let s = '';
  for (let mo = 0; mo < 12; mo++) { s += `<text x="${l - 4}" y="${t + mo * ch + 10}" text-anchor="end" font-size="9" fill="var(--ink-3)">${MON[mo][LANG === 'en' ? 1 : 0]}</text>`;
    for (let h = h0; h < h1; h++) { const v = get(mo, h); if (v == null) continue; const a = Math.min(1, v / maxV); s += `<rect x="${l + (h - h0) * cw}" y="${t + mo * ch}" width="${cw - 1}" height="${ch - 1}" rx="2" fill="${v <= 0 ? 'var(--surface-2)' : `rgba(208,59,59,${(0.15 + 0.85 * a).toFixed(2)})`}"><title>${MON[mo][LANG === 'en' ? 1 : 0]} ${h}:00 — ${nf(v, 1)}</title></rect>`; } }
  for (let h = h0; h < h1; h += 2) s += `<text x="${l + (h - h0) * cw + cw / 2}" y="${H - 4}" text-anchor="middle" font-size="9" fill="var(--ink-3)">${h}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${s}</svg>`;
}
function chartSVG() {
  if (!DAYR) return `<p class="src">${L2('Рахую день…', 'Computing the day…')}</p>`;
  const W = 380, H = 170, l = 36, r = 30, t = 10, b = 22, x0 = Math.floor(DAYR.sr), x1 = Math.ceil(DAYR.ss), xs = h => l + (h - x0) / (x1 - x0) * (W - l - r);
  const mx = Math.max(...DAYR.pts.map(p => p[1]), 1), top = Math.max(10, Math.ceil(mx / 20) * 20), ys = v => t + (1 - v / top) * (H - t - b), yo = v => t + (1 - v / 40) * (H - t - b);
  const path = k => DAYR.pts.map((p, i) => (i ? 'L' : 'M') + xs(p[0]).toFixed(1) + ',' + ys(p[k]).toFixed(1)).join('');
  const offp = DAYR.pts.map((p, i) => (i ? 'L' : 'M') + xs(p[0]).toFixed(1) + ',' + yo(p[6]).toFixed(1)).join('');
  const grid = [0, top / 2, top].map(v => `<line x1="${l}" x2="${W - r}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)"/><text x="${l - 4}" y="${ys(v) + 4}" text-anchor="end" font-size="10" fill="var(--ink-3)">${nf(v, 0)}</text>`).join('');
  const g2 = [0, 20, 40].map(v => `<text x="${W - r + 4}" y="${yo(v) + 4}" font-size="10" fill="var(--off)">${v}</text>`).join('');
  const hx = [6, 9, 12, 15, 18].filter(h => h > x0 && h < x1).map(h => `<text x="${xs(h)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--ink-3)">${h}:00</text>`).join('');
  const cx = xs(Math.max(x0, Math.min(x1, state.t)));
  return `<svg class="gchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${L2('Потужність і кількість модулів, що не працюють, за добу', 'Power and number of bypassed modules over the day')}">${grid}${g2}${hx}
    <path d="${offp}" fill="none" stroke="var(--off)" stroke-width="1.4" stroke-dasharray="3 2"/><path d="${path(1)}" fill="none" stroke="var(--sun)" stroke-width="2.4"/>
    <line x1="${cx}" x2="${cx}" y1="${t}" y2="${H - b}" stroke="var(--ink)" stroke-dasharray="3 3"/><text x="${l + 4}" y="${t + 10}" font-size="10" fill="var(--ink-3)">${L2('кВт', 'kW')}</text></svg>
    <div class="legend" style="background:transparent;border:0;padding:0"><span><i class="sw" style="background:var(--sun)"></i>${L2('потужність, кВт', 'power, kW')}</span><span><i class="sw" style="background:var(--off)"></i>${L2('не працює, модулів (права шкала)', 'bypassed modules (right axis)')}</span></div>`;
}
function stateBars(q) { const n = q.n || 1; return `<div class="bars" role="img"><i style="width:${q.sun / n * 100}%;background:var(--ok)"></i><i style="width:${q.part / n * 100}%;background:var(--part)"></i><i style="width:${(q.shade + q.back) / n * 100}%;background:var(--shade)"></i><i style="width:${q.off / n * 100}%;background:var(--off)"></i></div>`; }
function panelSun() {
  const r = RES, Tb = state.sunTab, up = r.s.alt > 0;
  const seg = `<div class="seg" role="group">${[['now', L2('Зараз', 'Now')], ['day', L2('Доба', 'Day')], ['year', L2('Рік', 'Year')]].map(([v, t]) => `<button type="button" data-st="${v}" aria-pressed="${Tb === v}">${t}</button>`).join('')}</div>`;
  const head = `<div class="ph"><span class="eyebrow">${L2('Сонце і тінь · які модулі коли працюють', 'Sun and shade · which modules work when')}</span><h2>${Tb === 'year' ? L2('Рік: коли модулі не працюють', 'Year: when modules are bypassed') : esc(fmtD(state.date)) + ', ' + hhmm(state.t)}</h2>${seg}</div>`;
  const method = `<p class="src wide">${L2('Не працює — модуль обходиться байпас-діодом: його струм нижчий за робочий струм стрінга (тінь або інша орієнтація). Струм стрінга — за найбільшою потужністю, стрінг тримає не менше 6 модулів у роботі (MPPT від 200 В). Тінь — промені до сонця з 9 точок модуля (будівля, надбудова, парапети, тумби, драбини, огородження, лотки, сусідні модулі). Ясне небо (Мейнел), сонячний час. «Рік» — повна модель K1, Meteonorm 8.1, кожні 10 хв розрахункових днів місяців.',
    'Bypassed — the module current is below the string operating current (shade or different orientation), so its bypass diodes conduct. String current is set for maximum power, keeping at least 6 modules working (MPPT from 200 V). Shade — rays to the sun from 9 points of each module (building, stair house, parapets, curbs, ladders, guardrail, trays, neighbouring modules). Clear sky (Meinel), solar time. Year — full K1 model, Meteonorm 8.1, every 10 min of the monthly design days.')}</p>`;
  if (Tb === 'year') {
    const top = [...MODS].sort((a, b) => b.d.offh - a.d.offh).slice(0, 14);
    return head + `<div class="blk"><h3>${L2('Скільки модулів не працює — середнє за годину', 'How many modules are bypassed — hourly average')}</h3>${heatSVG((mo, h) => DB.hour.n[mo][h] ? DB.hour.off[mo][h] : null, Math.max(...DB.hour.off.flat(), 1), 'heat')}
      <p class="src">${L2('Рядки — місяці, стовпці — години (місцевий час), колір — скільки модулів у середньому обходиться діодами за ясного неба.', 'Rows — months, columns — hours (local time), colour — average number of bypassed modules under clear sky.')}</p></div>
      <div class="blk"><h3>${L2('Найдовше не працюють за рік', 'Bypassed longest per year')}</h3><table class="cmp"><thead><tr><th>${L2('Модуль', 'Module')}</th><th>${L2('Стрінг', 'String')}</th><th>${L2('год/рік', 'h/yr')}</th><th>${L2('кВт·год', 'kWh')}</th></tr></thead><tbody>${top.map(q => `<tr class="go" data-f="m:${q.key}"><td class="l">${GN[q.g][LANG === 'en' ? 1 : 0]} · ${q.d.face}</td><td><span class="swc" style="background:${scol(q.k)}"></span>S${q.k}</td><td>${nf(q.d.offh, 0)}</td><td>${nf(q.d.kwh, 0)}</td></tr>`).join('')}</tbody></table>
      <p class="src">${L2('Режим «Річна тінь» угорі фарбує модулі за годинами, коли вони не працюють. Натисніть модуль — його графік за місяцями й годинами.', 'The Annual shade mode above colours modules by bypassed hours. Click a module to see its month × hour chart.')}</p></div>` + method;
  }
  if (Tb === 'day') return head + `<div class="blk">${chartSVG()}</div><div class="blk"><div class="stats">${stat(dayE() == null ? '…' : nf(dayE(), 0) + ' ' + L2('кВт·год', 'kWh'), L2('за день, ясне небо, з тінями і байпасами', 'per day, clear sky, with shade and bypassing'))}${stat(DAYR ? nf(Math.max(...DAYR.pts.map(p => p[6])), 0) : '…', L2('найбільше модулів не працює одночасно', 'max modules bypassed at once'))}</div></div>` + method;
  const offs = MODS.filter(q => q.state === 'off');
  const strRows = Object.entries(r.strs).sort((a, b) => a[0] - b[0]).map(([k, z]) => `<tr class="go" data-f="S${k}"><td class="l"><span class="swc" style="background:${scol(+k)}"></span>S${k}</td><td>${z.act}/${z.n}</td><td>${nf(z.p, 2)}</td></tr>`).join('');
  return head + `<div class="blk"><div class="stats">${stat(up ? nf(r.all.p, 1) + ' ' + L2('кВт', 'kW') : '0', up ? L2(`зараз, ${nf(r.all.p / (r.all.n * PM) * 100, 0)} % від ${nf(r.all.n * PM, 1)} кВтп`, `now, ${nf(r.all.p / (r.all.n * PM) * 100, 0)} % of ${nf(r.all.n * PM, 1)} kWp`) : L2('сонце за обрієм', 'sun below horizon'))}${stat(up ? `<span style="color:var(--off)">${r.all.off}</span>` : '—', L2('модулів не працює (обхід діодом)', 'modules bypassed'))}</div>
      ${up ? stateBars(r.all) : ''}
      ${kvHTML([[L2('На сонці', 'In sun'), String(r.all.sun)], [L2('Частково в тіні, працюють', 'Part-shaded, working'), String(r.all.part)], [L2('У тіні або сонце позаду, працюють на розсіяному', 'Shaded or sun behind, on diffuse light'), String(r.all.shade + r.all.back)], [L2('Не працюють', 'Bypassed'), `<b style="color:var(--off)">${r.all.off}</b>`]])}</div>
    <div class="blk"><h3>${L2('Стрінги зараз', 'Strings now')}</h3><table class="cmp"><thead><tr><th>${L2('Стрінг', 'String')}</th><th>${L2('У роботі', 'Working')}</th><th>${L2('кВт', 'kW')}</th></tr></thead><tbody>${strRows}</tbody></table></div>
    <div class="blk"><h3>${L2('Не працюють зараз', 'Bypassed now')}</h3>${offs.length ? `<div class="chips2">${offs.map(q => go('m:' + q.key, `S${q.k} · ${GN[q.g][LANG === 'en' ? 1 : 0]}`)).join('')}</div>` : `<p>${up ? L2('Усі модулі працюють.', 'All modules are working.') : '—'}</p>`}</div>` + method;
}
// ---------- Норми ДБН
function panelDBN() {
  const REQ = [
    [L2('Пожежна драбина П1 на перепаді дахів понад 1 м', 'Fire ladder P1 at roof height differences over 1 m'), 'ДБН В.1.1-7:2016 п. 8.8–8.9', 'ok', L2(`П1 на південній стіні основного блоку, X ≈${nf(D.ladP1.x, 1)}`, `P1 on the main block south wall, X ≈${nf(D.ladP1.x, 1)}`), 'p1'],
    [L2('Площадка з огорожею 0,6 м перед виходом на покрівлю', 'Landing with 0.6 m guard at the roof exit'), 'ДБН В.1.1-7:2016 табл. 5', 'ok', L2('на арці, у колонці зв\'язки', 'on the arch, in the tie column'), 'plat'],
    [L2('Драбина не ближче 1 м від вікон і дверей', 'Ladder at least 1 m from windows and doors'), 'ДБН В.1.1-7:2016 п. 8.10', 'q', L2('вікна на стіні — перевірити на місці', 'windows on the wall — check on site'), 'p1'],
    [L2('Огородження покрівлі не нижче 0,6 м, металеве', 'Roof guard at least 0.6 m, steel'), 'ДБН В.1.1-7:2016 п. 8.12; ДБН В.2.6-220:2017 п. 6.1.2', 'ok', L2('поручень 0,6 м на арці і надбудові; схід арки — парапет 0,7', '0.6 m rail on the arch and stair house; arch east — 0.7 m parapet'), 'rail'],
    [L2('Ходові доріжки до обладнання, що не заважають стоку води', 'Walkways to equipment not obstructing drainage'), 'ДБН В.2.6-220:2017 п. 7.1.3', 'ok', L2('2 доріжки 0,8 м і зв\'язка, прохід на нижньому даху', '2 walkways 0.8 m and a tie, path on the lower roof'), 'walk'],
    [L2('Драбини П1 на надбудову (≈2,25 і ≈1,05 м)', 'Ladders P1 to the stair house (≈2.25 and ≈1.05 m)'), 'ДБН В.1.1-7:2016 п. 8.8', 'ok', L2('західна стіна і між частинами', 'west wall and between parts'), 'p1'],
    [L2('Технічне обстеження будівлі перед монтажем', 'Technical survey of the building before installation'), L2('Порядок КМУ № 406', 'CMU Procedure No. 406'), 'q', L2('звіту немає', 'no report yet'), null],
    [L2('Модулі на стінах: пожежна безпека фасаду', 'Wall modules: facade fire safety'), 'ДБН В.1.1-7:2016', 'q', L2('матеріал стіни — цегла; кріплення — перевірити в проєкті', 'wall is brick; fixing — check in design'), null],
    [L2('Блискавкозахист і вирівнювання потенціалів', 'Lightning protection and bonding'), L2('ДСТУ EN 62305; том 7 СЕС цеху', 'DSTU EN 62305; shop PV volume 7'), 'ok', L2('без щогл: вирівнювання, ПЗІП', 'no masts: bonding, SPDs'), 'bz']];
  const SYM = {ok: '✓', no: '✗', q: '?'};
  return `<div class="ph"><span class="eyebrow">${L2('Норми ДБН · варіант «ДБН»', 'DBN norms · DBN option')}</span><h2>${L2('Що виконано в моделі', 'What the model complies with')}</h2><p>${L2('✓ — виконано в моделі, ? — перевірити на місці або в проєкті. Натисніть вимогу — покаже в моделі.', '✓ — done in the model, ? — check on site or in design. Click a requirement to see it in the model.')}</p></div>
  <div class="blk wide"><div class="reqs">${REQ.map(([t, c, k, x, f]) => `<div class="req"${f ? ` data-f="${f}" style="cursor:pointer"` : ''}><div class="rq"><b>${esc(t)}</b><small>${esc(c)}</small></div><span class="st ${k}"><i>${SYM[k]}</i>${esc(x)}</span></div>`).join('')}</div></div>
  <div class="note warn wide">${L2('Перевірено за текстами ДБН В.1.1-7:2016 (розділ 8) і ДБН В.2.6-220:2017 (до п. 7.6). Ширина доріжок 0,8 м — наше рішення: у прочитаному тексті ширини немає. Це не експертиза, а перелік для проєктувальника й обстеження.', 'Checked against DBN V.1.1-7:2016 (section 8) and DBN V.2.6-220:2017 (up to cl. 7.6). Walkway width 0.8 m is our decision: the text read gives no width. Not an expert review — a checklist for the designer and the survey.')}</div>`;
}
// ---------- Шари
function layHTML(list) { return `<div class="lay">${list.map(([k, t, col, cnt]) => `<label for="lay-${k}"><input type="checkbox" id="lay-${k}" data-k="${k}" ${state.lay[k] ? 'checked' : ''}><span class="sw" style="background:${col}"></span>${esc(t)}<span class="cnt">${cnt || ''}</span></label>`).join('')}</div>`; }
function panelLay() {
  return `<div class="ph"><span class="eyebrow">${L2('Шари', 'Layers')}</span><h2>${L2('Що показувати в моделі', 'What to show in the model')}</h2><p>${L2('Вимкнений шар модулів лишається в розрахунку тіні — модулі затінюють сусідів.', 'Hidden module layers still count in the shade calculation.')}</p></div>
  <div class="blk"><h3>${L2('Модулі', 'Modules')}</h3>${layHTML([['arch', L2('Арка', 'Arch'), 'var(--east)', String(BOMN.NA)], ['low', L2('Нижній дах', 'Lower roof'), 'var(--west)', String(BOMN.NL)], ['nad', L2('Надбудова', 'Stair house'), 'var(--ours)', String(BOMN.NN)], ['wall', L2('Південні стіни', 'South walls'), 'var(--south)', String(BOMN.NW)]])}</div>
  <div class="blk"><h3>${L2('Системи', 'Systems')}</h3>${layHTML([['str', L2('Стрінги: кабелі і перемички', 'Strings: cables and jumpers'), scol(1)], ['elec', L2('Електрика: інвертор, лотки, AC, щити', 'Electrical: inverter, trays, AC, boards'), 'var(--ours)'], ['lps', L2('Блискавкозахист і вирівнювання', 'Lightning protection and bonding'), 'var(--bz)'],
    ['mount', L2('Кріплення і баласт', 'Mounting and ballast'), 'var(--line-2)'], ['safety', L2('Драбини, огородження, доріжки', 'Ladders, guardrail, walkways'), '#d8d0b8'], ['ctx', L2('Цех і ТП-5913 поруч', 'Workshop and TP-5913 nearby'), 'var(--line-2)'], ['shadow', L2('Тіні від сонця', 'Sun shadows'), 'var(--ink-3)'], ['sky', L2('Сонце і його шлях', 'Sun and its path'), 'var(--sun)'], ['labels', L2('Підписи', 'Labels'), 'var(--ink-3)']])}</div>`;
}
// ---------- Що оцінка
function panelEst() {
  return `<div class="ph"><span class="eyebrow">${L2('Що оцінка, а що виміряно', 'What is estimated and what is measured')}</span><h2>${L2('Висоти — оцінка, план — супутник ±0,5 м', 'Heights estimated, plan from satellite ±0.5 m')}</h2></div>
  <div class="note warn">${L2('Висоти рулеткою не міряно: південний блок 10,0 м, карниз основного 13,2 м, стріла арки 1,3 м, надбудова ≈3,3 і ≈2,25 м над дахом за рядами цегли (±0,15 м). Тип покрівлі нижнього даху і несуча здатність дахів — немає в даних. Місце вступного щита АБК і траса AC усередині — за обстеженням; у кошторисі кабель AC 45 м.', 'Heights not measured: south block 10.0 m, main block eaves 13.2 m, arch rise 1.3 m, stair house ≈3.3 and ≈2.25 m above the roof from brick courses (±0.15 m). Lower roof type and roof load capacity — not in the data. Main board location and the AC route inside — per survey; 45 m AC cable in the estimate.')}</div>
  <div class="blk"><h3>${L2('Виміряти на місці', 'Measure on site')}</h3><ul class="blist"><li>${L2('висоту карниза основного блоку і стрілу арки; висоту парапетів;', 'main block eaves height and arch rise; parapet heights;')}</li><li>${L2('де двері з надбудови на дах і де вступний щит АБК;', 'where the stair house roof door and the main board are;')}</li><li>${L2('чи немає вікон на стіні біля драбини П1 (≥ 1 м);', 'whether there are windows on the wall near ladder P1 (≥ 1 m);')}</li><li>${L2('чи діє пруток на парапетах як блискавкоприймач (спуски, заземлення).', 'whether the parapet rod works as an air-termination (down-conductors, earthing).')}</li></ul></div>
  <div class="blk"><h3>${L2('Звідки цифри', 'Where the numbers come from')}</h3><ul class="blist"><li>${L2('розкладка — calc/v3/abk.py, antares/abk/layout.py; стрінги, тінь за рік, траси — calc/v3/abk_dbn.py;', 'layout — calc/v3/abk.py, antares/abk/layout.py; strings, annual shade, routes — calc/v3/abk_dbn.py;')}</li><li>${L2('специфікація — calc/abk_kosh/bom.py; кошторис — calc/abk_kosh/build.py (ставки кошторису під ключ 27.10, ціни України 28.10);', 'bill of materials — calc/abk_kosh/bom.py; estimate — calc/abk_kosh/build.py (rates of the 27.10 turnkey estimate, Ukrainian prices 28.10);')}</li><li>${L2('деталі будівлі — фото 26–27.10 (дах АБК, фасади); декор у тінь не входить.', 'building details — photos 26–27.10 (roof, facades); decoration is not in the shade model.')}</li></ul></div>`;
}
function renderPane() {
  const st = $('#panes').scrollTop, s = state.sec;
  pane.innerHTML = s === 'sun' ? panelSun() : s === 'spec' ? panelSpec() : s === 'kosh' ? panelKosh() : s === 'str' ? panelStr() : s === 'el' ? panelEl() : s === 'bz' ? panelBZ() : s === 'mnt' ? panelMnt() : s === 'lay' ? panelLay() : s === 'est' ? panelEst() : s === 'dbn' ? panelDBN() : panelPZ();
  pane.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { state.sunTab = b.dataset.st; renderPane(); save(); });
  pane.querySelectorAll('.lay input').forEach(inp => inp.onchange = () => { state.lay[inp.dataset.k] = inp.checked; setVis(); save(); });
  pane.querySelectorAll('[data-f]').forEach(el => el.onclick = () => { const f = el.dataset.f; if (focusKey === f) { clearFocus(); return; } focus(f, el.dataset.l); });
  pane.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const g = b.dataset.go; if (g.startsWith('f:')) { focus(g.slice(2)); return; } if (g.startsWith('m:')) { focus(g); return; } state.sec = g; apply(); });
  $('#panes').scrollTop = st;
}
// ================= шари
function setVis(quiet) {
  const L = state.lay; ['arch', 'low', 'nad', 'wall', 'mount', 'ctx', 'str', 'elec', 'lps', 'safety'].forEach(k => groups[k].visible = L[k]);
  skyG.visible = L.sky; lab.hidden = !L.labels;
  if (R.shadowMap.enabled !== L.shadow) { R.shadowMap.enabled = L.shadow; S.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); }); }
  if (!quiet) { startDay(); update(); } else need = true;
  if (state.sec === 'lay') renderPane();
}
// ================= режими і легенда
function hudCtx() {
  const modes = [['status', L2('Стан зараз', 'Status now')], ['strings', L2('Стрінги', 'Strings')], ['year', L2('Річна тінь', 'Annual shade')], ['plain', L2('Звичайний', 'Plain')]];
  const mEl = $('#modes'); mEl.setAttribute('aria-label', L2('Режим', 'Mode')); mEl.innerHTML = modes.map(([k, t]) => `<button type="button" data-m="${k}" aria-pressed="${state.mode === k}">${esc(t)}</button>`).join('');
  mEl.querySelectorAll('button').forEach(b => b.onclick = () => { state.mode = b.dataset.m; if (state.mode === 'strings' && !state.lay.str) { state.lay.str = true; setVis(true); } hudCtx(); paint(); need = true; save(); });
  const md = state.mode, sw = c => `<i class="sw" style="background:${c}"></i>`;
  $('#legend').innerHTML = md === 'strings' ? `<span class="t">${L2('Стрінги', 'Strings')}</span>` + DB.strings.map(s => `<span>${sw(scol(s.k))}S${s.k}·${s.mppt}</span>`).join('')
    : md === 'year' ? `<span class="t">${L2('Не працює за рік', 'Bypassed per year')}</span><span>${sw('hsl(120,70%,42%)')}0 ${L2('год', 'h')}</span><span>${sw('hsl(60,70%,42%)')}${nf(OFFMAX / 2, 0)}</span><span>${sw('hsl(0,70%,42%)')}${nf(OFFMAX, 0)} ${L2('год', 'h')}</span>`
    : md === 'plain' ? `<span class="t">${L2('Модулі', 'Modules')}</span><span>${sw('var(--east)')}${L2('на схід', 'east')}</span><span>${sw('var(--west)')}${L2('на захід', 'west')}</span><span>${sw('var(--south)')}${L2('стіни', 'walls')}</span><span>${sw('#d8d0b8')}${L2('доріжки', 'walkways')}</span>`
    : `<span class="t">${L2('Стан зараз', 'Status now')}</span><span>${sw('var(--east)')}${sw('var(--west)')}${L2('на сонці', 'in sun')}</span><span>${sw('var(--part)')}${L2('частково', 'partly')}</span><span>${sw('var(--shade)')}${L2('тінь / позаду', 'shade / behind')}</span><span>${sw('var(--off)')}✕ ${L2('не працює', 'bypassed')}</span>`;
}
function apply() {
  document.querySelectorAll('#tabs button').forEach(b => { const on = b.dataset.s === state.sec; b.setAttribute('aria-selected', on ? 'true' : 'false'); if (on) { const tb = $('#tabs'), x = b.offsetLeft - tb.clientWidth / 2 + b.offsetWidth / 2; tb.scrollTo({left: Math.max(0, x), behavior: RM ? 'auto' : 'smooth'}); } });
  renderPane(); hudCtx(); sunUI(); save();
}
// ================= мова
const langsEl = $('#langs');
function langUI() { langsEl.innerHTML = [['uk', 'УКР'], ['en', 'ENG']].map(([k, t]) => `<button type="button" data-l="${k}" aria-pressed="${LANG === k}">${t}</button>`).join(''); langsEl.querySelectorAll('button').forEach(b => b.onclick = () => setLang(b.dataset.l)); }
function staticUI() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'uk'; document.title = L2('АБК Антарес · СЕС · ДБН', 'Antares admin building · PV · DBN');
  $('#ttl').innerHTML = L2('АБК Антарес · СЕС на даху<small>адмінкорпус · варіант «ДБН»</small>', 'Antares admin building · rooftop PV<small>DBN-compliant option</small>');
  $('#view').setAttribute('aria-label', L2('3D-модель', '3D model')); cv.setAttribute('aria-label', L2('3D-модель адмінкорпусу з сонячними модулями', '3D model of the admin building with PV modules'));
  $('#cams').setAttribute('aria-label', L2('Вид', 'View')); $('#compass').title = L2('Північ', 'North'); $('#ntxt').textContent = L2('Пн', 'N');
  $('#sheet').setAttribute('aria-label', L2('Сонце і розділи', 'Sun and sections')); $('#grab').setAttribute('aria-label', L2('Згорнути або розгорнути панель', 'Collapse or expand the panel')); $('#grab').title = L2('Тягніть або натисніть', 'Drag or click');
  $('#speed').title = L2('Швидкість', 'Speed'); $('#time').setAttribute('aria-label', L2('Час доби (сонячний)', 'Time of day (solar)')); $('#season').title = L2('Сезон', 'Season'); $('#sunmore').title = L2('Дата і деталі', 'Date and details');
  $('#date').setAttribute('aria-label', L2('Будь-яка дата', 'Any date')); $('#tabPrev').setAttribute('aria-label', L2('Попередній розділ', 'Previous section')); $('#tabNext').setAttribute('aria-label', L2('Наступний розділ', 'Next section'));
  $('#tabs').setAttribute('aria-label', L2('Розділи', 'Sections')); $('#focusx').title = L2('Зняти підсвітку', 'Clear highlight');
  ctxSet(state.ctx); setPlay(!!playT); camsUI(); datesUI(); tabsUI(); labelsText();
  HRL.forEach(l => l.d.textContent = l.h + ':00');
  if (focusKey) $('#focustxt').textContent = TAGNAME[focusKey] ? TAGNAME[focusKey][LANG === 'en' ? 1 : 0] : $('#focustxt').textContent;
}
function setLang(l) { LANG = l; langUI(); staticUI(); if (sel) hideTip(); apply(); }
// ================= камера: види
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const VIEWS = {over: {t: ['Огляд', 'Overview'], p: P(146, -12, 34), c: P(118, 26, 10)}, top: {t: ['Зверху', 'Top'], p: P(118.2, 25.9, 78), c: P(118.2, 26, 10)}, south: {t: ['З півдня', 'From south'], p: P(118, -30, 16), c: P(118, 22, 10)},
  sun: {t: ['Проти сонця', 'Into the sun'], dyn: true}, arch: {t: ['Арка', 'Arch'], p: P(134, 16, 22), c: P(118, 33, 13.5)}, low: {t: ['Нижній дах', 'Lower roof'], p: P(126, -2, 19), c: P(118, 13, 10)},
  nad: {t: ['Надбудова', 'Stair house'], p: P(104, 6, 17.5), c: P(118.9, 13.5, 11.8)}, inv: {t: ['Інвертор', 'Inverter'], p: P(122.6, 20.0, 11.9), c: P(119.0, 18.0, 10.85)}, wall: {t: ['Стіни', 'Walls'], p: P(118, -4, 15), c: P(118, 16, 11.5)}};
let anim = null, camNow = 'over';
function goCam(k, inst) {
  let p, t; const v = VIEWS[k]; camNow = k;
  if (v.dyn) {
    const s = RES ? RES.s : sunAt(N(), state.t), hz = new THREE.Vector3(s.dir.x, 0, s.dir.z); if (hz.lengthSq() < 1e-6) hz.set(0, 0, 1); hz.normalize();
    const B = P(118, 24, 12); p = B.clone().addScaledVector(hz, -60); p.y = 28;
    const el = q => Math.atan2(q.y - p.y, Math.hypot(q.x - p.x, q.z - p.z)), eB = el(B), eS = el(skyPos(s.dir));
    const pitch = s.alt > 0 && eS - eB < 34 / DEG ? (eS + eB) / 2 : eB + 7 / DEG;
    t = p.clone().add(new THREE.Vector3(hz.x * Math.cos(pitch), Math.sin(pitch), hz.z * Math.cos(pitch)).multiplyScalar(60));
  } else { p = v.p; t = v.c; }
  if (inst || RM) { cam.position.copy(p); ctl.target.copy(t); ctl.update(); need = true; return; }
  anim = {p0: cam.position.clone(), t0: ctl.target.clone(), p, t, s: performance.now()};
}
const cams = $('#cams');
function camsUI() { cams.innerHTML = ''; Object.entries(VIEWS).forEach(([k, v]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.c = k; b.textContent = v.t[LANG === 'en' ? 1 : 0]; b.setAttribute('aria-pressed', String(k === camNow));
  b.onclick = () => { cams.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); goCam(k); }; cams.appendChild(b); }); }
// ================= натискання: підказка
const ray = new THREE.Raycaster(), mp = new THREE.Vector2(), tip = $('#tip'); let sel = null, down = null, tipT = 0;
function hideTip() { tip.hidden = true; if (sel && sel.userData.base && !FOC.has(sel)) sel.material = sel.userData.base; sel = null; need = true; }
const STN = {sun: ['на сонці — працює', 'in sun — working'], part: ['частково в тіні — працює', 'part-shaded — working'], shade: ['у тіні — на розсіяному світлі', 'in shade — on diffuse light'], back: ['сонце позаду модуля — на розсіяному', 'sun behind the module — on diffuse light'], off: ['НЕ ПРАЦЮЄ — обхід байпас-діодом', 'BYPASSED — diodes conducting'], night: ['сонце за обрієм', 'sun below horizon']};
function tipLive() { const el = tip.querySelector('.live'); if (!el || !sel || !sel.userData.rec || !RES) return; const r = sel.userData.rec;
  el.className = 'live' + (r.state === 'off' ? ' off' : '');
  el.textContent = RES.s.alt <= 0 ? `${hhmm(state.t)}: ${L2('сонце за обрієм — 0 Вт', 'sun below horizon — 0 W')}`
    : `${hhmm(state.t)}: ${STN[r.state][LANG === 'en' ? 1 : 0]}${r.state === 'part' ? ` (${nf(r.f * 100, 0)} %)` : ''} · ${nf(r.poa, 0)} ${L2('Вт/м²', 'W/m²')} · ≈${nf(r.p * 1000, 0)} ${L2('Вт', 'W')}`; }
function modHeat(d) {
  const off = d.off, prt = d.prt;
  return heatSVG((mo, h) => { const a = '0123456789a'.indexOf(off[mo * 24 + h]) / 10; return DB.hour.n[mo][h] ? a * 100 : null; }, 100, 'module');
}
function showTip(o, e) {
  const inf = o.userData.info, [h, dsc] = Array.isArray(inf) ? inf : inf[LANG];
  let extra = '';
  if (o.userData.rec) {
    const r = o.userData.rec, d = r.d, s = DB.strings.find(q => q.k === r.k);
    extra = `<span class="yr">${L2(`Стрінг <b style="display:inline;color:${scol(r.k)}">S${r.k}</b> · MPPT ${s.mppt} · ${d.ord}-й з ${s.n} · за рік ≈${nf(d.kwh, 0)} кВт·год (${nf(d.kwh / PM, 0)} кВт·год/кВтп)`, `String <b style="display:inline;color:${scol(r.k)}">S${r.k}</b> · MPPT ${s.mppt} · #${d.ord} of ${s.n} · ≈${nf(d.kwh, 0)} kWh per year (${nf(d.kwh / PM, 0)} kWh/kWp)`)}</span>
      <span class="hm">${modHeat(d)}<small>${L2(`Не працює ≈${nf(d.offh, 0)} год за рік за ясного неба (частково в тіні ≈${nf(d.prth, 0)} год). Рядки — місяці, стовпці — години; чим червоніше, тим більша частка години модуль обходиться діодом.`, `Bypassed ≈${nf(d.offh, 0)} h per year under clear sky (part-shaded ≈${nf(d.prth, 0)} h). Rows — months, columns — hours; redder means a larger share of the hour bypassed.`)}</small></span>`;
  }
  tip.innerHTML = `<button type="button" class="x" aria-label="${L2('Закрити', 'Close')}">×</button><b>${esc(h)}</b>${esc(dsc)}${extra}${o.userData.rec ? '<span class="live"></span>' : ''}`;
  tip.querySelector('.x').onclick = hideTip; tip.hidden = false; tipT = performance.now(); tipLive();
  const r = cv.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight; let x = e ? e.clientX - r.left + 14 : 12, y = e ? e.clientY - r.top + 14 : 60;
  if (x + tw > r.width - 8) x = r.width - tw - 8; if (y + th > r.height - 8) y = (e ? e.clientY - r.top : r.height) - th - 14;
  tip.style.transform = `translate(${Math.max(8, x)}px,${Math.max(8, y)}px)`;
}
cv.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
cv.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const r = cv.getBoundingClientRect(); mp.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mp, cam);
  const hit = ray.intersectObjects(picks.filter(o => { let v = true, p = o; while (p) { if (!p.visible) v = false; p = p.parent; } return v; }), false)[0];
  if (sel && sel.userData.base && !FOC.has(sel)) sel.material = sel.userData.base; sel = null;
  if (hit && hit.object.userData.info) { sel = hit.object; if (sel.userData.base && !FOC.has(sel)) sel.material = hi; showTip(sel, e); } else hideTip();
  need = true;
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!tip.hidden) hideTip(); else if (focusKey) clearFocus(); } });
// ================= нижня панель
const SHEETS = ['peek', 'half', 'full'];
function sheetSet(s) { state.sheet = s; $('#sheet').dataset.s = s; save(); }
{ const g = $('#grab'); let y0 = null, moved = false;
  g.addEventListener('pointerdown', e => { y0 = e.clientY; moved = false; try { g.setPointerCapture(e.pointerId); } catch (x) {} });
  g.addEventListener('pointermove', e => { if (y0 !== null && Math.abs(e.clientY - y0) > 14) moved = true; });
  g.addEventListener('pointerup', e => { if (y0 === null) return; const dy = e.clientY - y0, i = SHEETS.indexOf(state.sheet); y0 = null;
    if (moved) sheetSet(SHEETS[Math.max(0, Math.min(2, i + (dy < 0 ? 1 : -1)))]); else sheetSet(SHEETS[(i + 1) % 3]); });
  g.addEventListener('pointercancel', () => { y0 = null; }); }
if (!SHEETS.includes(state.sheet)) state.sheet = matchMedia('(max-width: 700px)').matches ? 'peek' : 'half';
$('#sheet').dataset.s = state.sheet;
function ctxSet(o) { state.ctx = o; $('#ctx').hidden = !o; const b = $('#ctxtoggle'); b.textContent = o ? '▴' : '▾'; b.setAttribute('aria-expanded', String(o)); b.title = o ? L2('Сховати режими і легенду', 'Hide modes and legend') : L2('Показати режими і легенду', 'Show modes and legend'); b.setAttribute('aria-label', b.title); save(); }
$('#ctxtoggle').onclick = () => ctxSet(!state.ctx);
// ================= тема, розмір, кадр
function theme() { const c = new THREE.Color(css('--sky') || '#dfe6ec'); S.background = c; mat.ground.color.set(css('--ground') || '#c9cfc6'); need = true; }
new MutationObserver(theme).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', theme); } catch (e) {}
function size() { const w = stage.clientWidth, h = stage.clientHeight; R.setSize(w, h, false); cam.aspect = w / Math.max(h, 1); cam.updateProjectionMatrix(); need = true; }
new ResizeObserver(size).observe(stage);
ctl.addEventListener('change', () => { need = true; if (!tip.hidden && performance.now() - tipT > 600) hideTip(); });
const v = new THREE.Vector3(), needle = $('#needle');
HRL.forEach(l => { const d = document.createElement('div'); d.className = 'lbl hr'; d.textContent = l.h + ':00'; lab.appendChild(d); l.d = d; });
function frame(now) {
  requestAnimationFrame(frame);
  if (anim) { const k = Math.min(1, (now - anim.s) / 900), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    cam.position.lerpVectors(anim.p0, anim.p, e); ctl.target.lerpVectors(anim.t0, anim.t, e); if (k >= 1) anim = null; need = true; }
  ctl.update();
  if (!need) return; need = false;
  needle.style.transform = `rotate(${(ctl.getAzimuthalAngle() * DEG).toFixed(1)}deg)`;
  R.render(S, cam);
  const w = stage.clientWidth, h = stage.clientHeight;
  const put = (pos, d) => { v.copy(pos).project(cam); if (v.z > 1) { d.style.display = 'none'; return; } d.style.display = ''; d.style.left = ((v.x + 1) / 2 * w) + 'px'; d.style.top = ((1 - v.y) / 2 * h) + 'px'; };
  LB.forEach(l => { if (l.layer && !state.lay[l.layer]) { l.d.style.display = 'none'; return; } put(l.p, l.d); });
  HRL.forEach(l => { if (!l.on || !skyG.visible) { l.d.style.display = 'none'; return; } put(l.p, l.d); });
}
theme(); buildPath(N()); size(); goCam('over', true);
langUI(); staticUI(); setVis(true); startDay(); update(); apply(); $('#loading').hidden = true; requestAnimationFrame(frame);
window.__abk = {state, evaluate, update, apply, goCam, sheetSet, setPlay, MODS, OCC, focus, clearFocus, setLang, dayR: () => DAYR, res: () => RES, cam, ctl, TAGS, STR, setDate: d => { state.date = d; dayChanged(); }, setTime: t => { state.t = t; update(); }};
})();
</script>

