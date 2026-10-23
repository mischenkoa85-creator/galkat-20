(function(){
"use strict";
const DATA = /*DATA*/null;
const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
const nf = (v, d) => Number(v).toLocaleString('uk-UA', {minimumFractionDigits: d || 0, maximumFractionDigits: d || 0});
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const store = {get(k){ try{ return localStorage.getItem('m3d-' + k); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem('m3d-' + k, v); }catch(e){} }};

// ================= geometry (same as the calculation)
const HV = 13.81, HE = 5.0, FL = 0.75;
const SPANS = [[0,18,1.19],[18,36,1.19],[36,54,1.19],[54,72,1.19],[72,96,1.6]];
const SHOP = [-0.15, 96.64, -0.5, 96.59];
function archAt(X){ for(const s of SPANS){ if(X >= s[0] && X <= s[1]){ const c = (s[0]+s[1])/2, h = (s[1]-s[0])/2 - FL, d = X - c; if(Math.abs(d) >= h) return [0,0]; return [s[2]*(1-d*d/h/h), -2*s[2]*d/h/h]; } } return [0,0]; }
const roofZ = X => HV + archAt(Math.max(0, Math.min(96, X)))[0];
const roofK = X => archAt(Math.max(0, Math.min(96, X)))[1];
const T11 = Math.tan(11*D2R), T17 = Math.tan(17*D2R), T22 = Math.tan(22*D2R);
const POLY = {A:[[54.98,-25.08],[66.55,-25.03],[70.82,-24.51],[73.5,-24.51],[73.5,-15.5],[53.75,-18.65]],
              B:[[73.5,-24.5],[98.1,-24.5],[98.1,-12.5],[92.4,-12.5],[73.5,-15.5]],
              C1:[[98.1,-24.5],[146.1,-24.5],[146.1,-6.5],[98.1,-6.5]],
              C2:[[146.1,-24.5],[155.1,-24.5],[155.1,-6.5],[146.1,-6.5]]};
const WHF = {A:(X,Y)=>HE+(Y+25.05)*T11, B:(X,Y)=>HE+(Y+24.5)*T11, C1:(X,Y)=>HE+(9-Math.abs(Y+15.5))*T22, C2:(X,Y)=>HE+(9-Math.abs(Y+15.5))*T17};
const SLOPE = {A:11, B:11, C1:22, C2:17};
const TPS = [{n:'ТП-6923', b:[-0.5,19.5,96.6,107.1], h:4.5}, {n:'', b:[19.5,24.2,96.6,99.4], h:3.5}, {n:'ТП-5913', b:[96.64,103.0,-0.4,34.6], h:4.5}];
function inPoly(P, x, y){ let c = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const a = P[i], b = P[j]; if(((a[1] > y) !== (b[1] > y)) && (x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1]) + a[0])) c = !c; } return c; }
function whPart(X, Y){ for(const k in POLY) if(inPoly(POLY[k], X, Y)) return k; return null; }
function surfZ(X, Y){ if(X >= SHOP[0] && X <= SHOP[1] && Y >= SHOP[2] && Y <= SHOP[3]) return roofZ(X); const p = whPart(X, Y); if(p) return WHF[p](X, Y);
  for(const t of TPS){ const b = t.b; if(X >= b[0] && X <= b[1] && Y >= b[2] && Y <= b[3]) return t.h; } return 0; }
const MOD_L = 2.384, MOD_W = 1.303, MOD_T = 0.035;
const obsH = d => d >= 1.5 ? 1.9 : d >= 1.2 ? 1.6 : d >= 0.9 ? 1.3 : d >= 0.5 ? 1.0 : 0.7;
const BASE_HEX = '#5d7db3';
const VN = {A: 'А', B: 'Б'};
const VCFG = {B:{hoff:0.12, U:20, svf:1.0}, A:{hoff:0.35, U:29, svf:0.965}};

// ================= sun and irradiance (port of shade.py)
const LAT = 50.45*D2R, LON = 30.52;
const GHI = [0.75,1.45,2.75,4.1,5.4,5.7,5.7,5.0,3.5,2.0,0.85,0.55], MD = [31,28,31,30,31,30,31,31,30,31,30,31];
const T_MAX = [0,1,7,15,21,24,26,26,20,13,6,1], T_MIN = [-5,-5,-1,5,10,14,16,15,10,5,1,-3];
const PSTC = 0.730, GAM = -0.0030, ALB = 0.2, DT = 1/6, NST = 144;
const OTHER_A = 0.975*0.985*0.99*0.98*0.975*0.985*0.99;
VCFG.A.other = OTHER_A; VCFG.B.other = OTHER_A*0.985*0.995;
function sunAt(doy, h){ const dec = 23.45*D2R*Math.sin(2*Math.PI*(284+doy)/365), w = 15*(h-12)*D2R;
  const se = Math.sin(LAT)*Math.sin(dec) + Math.cos(LAT)*Math.cos(dec)*Math.cos(w);
  const x = -Math.cos(dec)*Math.sin(w), y = Math.cos(LAT)*Math.sin(dec) - Math.sin(LAT)*Math.cos(dec)*Math.cos(w);
  return [Math.asin(Math.max(-1, Math.min(1, se))), [x, y, se]]; }
function clearSky(el, doy){ if(el <= 0.3*D2R) return [0,0]; const e = el*R2D, sn = Math.sin(el), am = 1/(sn + 0.50572*Math.pow(e+6.07995, -1.6364)), e0 = 1 + 0.033*Math.cos(2*Math.PI*doy/365);
  const dni = 1353*e0*Math.pow(0.7, Math.pow(am, 0.678)), tb = dni/(1361*e0), dhi = Math.max(0, 1361*e0*sn*(0.271 - 0.294*tb)); return [dni, dhi]; }
// clock time: solar → Kyiv time (EET, +1 h in summer)
function eot(doy){ const B = 2*Math.PI*(doy-81)/364; return 9.87*Math.sin(2*B) - 7.53*Math.cos(B) - 1.5*Math.sin(B); }
function lastSun(y, m){ const d = new Date(Date.UTC(y, m, 0)); return d.getUTCDate() - d.getUTCDay(); }
function isDST(y, m, d){ const md = m*100 + d; return md >= 300 + lastSun(y, 3) && md < 1000 + lastSun(y, 10); }
function clockShift(doy, dst){ return -eot(doy)/60 - (LON - 30)/15 + (dst ? 1 : 0); }
const hhmm = t => { let m = Math.round(t*60); m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m/60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const doyOf = (m, d) => MD.slice(0, m-1).reduce((a, b) => a + b, 0) + Math.min(d, MD[m-1]);

// ================= shading engine per variant
const ENG = {};
function frame(kind, X, Y, hoff){ const k = roofK(X), phi = -Math.atan(k), sp = Math.sin(phi), cp = Math.cos(phi), rn = [sp, 0, cp];
  let u, v, n, du, dv;
  if(kind === 'B'){ u = [cp, 0, -sp]; v = [0, 1, 0]; n = rn; du = MOD_W; dv = MOD_L; }
  else { const t = 15*D2R, s = Math.sin(t), c = Math.cos(t); u = [cp, 0, -sp]; v = [s*sp, c, s*cp]; n = [c*sp, -s, c*cp]; du = MOD_L; dv = MOD_W; }
  return {C:[X + rn[0]*hoff, Y, roofZ(X) + rn[2]*hoff], n, u, v, du, dv}; }
function engine(V){
  if(ENG[V]) return ENG[V];
  const cfg = VCFG[V], mods = DATA[V].mods, M = mods.length;
  const C = new Float64Array(M*3), N = new Float64Array(M*3), U = new Float64Array(M*3), Vv = new Float64Array(M*3), P = new Float64Array(M*27);
  let du = 0, dv = 0; const g = [-0.4, 0, 0.4];
  mods.forEach((m, i) => { const f = frame(V, m[0], m[1], cfg.hoff); du = f.du; dv = f.dv;
    for(let a = 0; a < 3; a++){ C[i*3+a] = f.C[a]; N[i*3+a] = f.n[a]; U[i*3+a] = f.u[a]; Vv[i*3+a] = f.v[a]; }
    let k = 0; for(const a of g) for(const b of g){ for(let c = 0; c < 3; c++) P[(i*9+k)*3+c] = f.C[c] + a*du*f.u[c] + b*dv*f.v[c]; k++; } });
  const LAN = DATA.lan.map((l, i) => [l[0], l[1], l[2], l[3], HV + SPANS[i][2] + 0.55])
    .concat(DATA[V].boxes.map(b => [b[3]-0.33, b[3]+0.33, b[4]-0.18, b[4]+0.18, roofZ(b[3]) + 1.05]));
  const CYL = DATA.obs.map(o => [o[0], o[1], o[2]/2, roofZ(o[0]) - 0.05, roofZ(o[0]) + obsH(o[2])])
    .concat(DATA.masts.filter(m => m[1] < 96.6).map(m => [m[0], m[1], 0.03, roofZ(m[0]), roofZ(m[0]) + 4.0]));
  let NB = null;
  if(V === 'A'){ const cell = 7, grid = new Map(), key = (a, b) => a + ',' + b;
    for(let i = 0; i < M; i++){ const k = key(Math.floor(C[i*3]/cell), Math.floor(C[i*3+1]/cell)); if(!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
    NB = [];
    for(let i = 0; i < M; i++){ const gx = Math.floor(C[i*3]/cell), gy = Math.floor(C[i*3+1]/cell), list = [];
      for(let a = -1; a <= 1; a++) for(let b = -1; b <= 1; b++){ const c = grid.get(key(gx+a, gy+b)); if(!c) continue;
        for(const j of c){ if(j === i) continue; const dx = C[j*3] - C[i*3], dy = C[j*3+1] - C[i*3+1]; if(dx*dx + dy*dy <= 49) list.push(j); } }
      NB.push(Int32Array.from(list)); } }
  // warehouse: south slopes (as in the 3D geometry): 22° on C1, 17° on C2, 11° on the single-pitch parts
  const WN = DATA.wh.map(m => { const t = (m[0] >= 98.1 && m[0] < 146.1 ? 22 : m[0] >= 146.1 ? 17 : 11)*D2R; return [0, -Math.sin(t), Math.cos(t)]; });
  return ENG[V] = {V, M, C, N, U, Vv, P, du, dv, LAN, CYL, NB, WN, cfg};
}
function shadeCounts(E, s, el, out){
  const P = E.P, np = E.M*9, sx = s[0], sy = s[1], sz = s[2], sxy = sx*sx + sy*sy, shh = Math.sqrt(sxy), terr = el < 18*D2R;
  const LAN = E.LAN, CYL = E.CYL, NB = E.NB, C = E.C, N = E.N, U = E.U, Vv = E.Vv, hu = E.du/2, hv = E.dv/2, zlo = HV - 0.1;
  const ix = sx !== 0 ? 1/sx : 0, iy = sy !== 0 ? 1/sy : 0, iz = sz !== 0 ? 1/sz : 0;
  out.fill(0);
  for(let p = 0; p < np; p++){
    const px = P[p*3], py = P[p*3+1], pz = P[p*3+2]; let hit = false;
    for(let k = 0; k < LAN.length && !hit; k++){ const b = LAN[k]; let tmin = -Infinity, tmax = Infinity, t1, t2;
      if(sx !== 0){ t1 = (b[0]-px)*ix; t2 = (b[1]-px)*ix; if(t1 > t2){ const t = t1; t1 = t2; t2 = t; } if(t1 > tmin) tmin = t1; if(t2 < tmax) tmax = t2; } else if(px < b[0] || px > b[1]) continue;
      if(sy !== 0){ t1 = (b[2]-py)*iy; t2 = (b[3]-py)*iy; if(t1 > t2){ const t = t1; t1 = t2; t2 = t; } if(t1 > tmin) tmin = t1; if(t2 < tmax) tmax = t2; } else if(py < b[2] || py > b[3]) continue;
      if(sz !== 0){ t1 = (zlo-pz)*iz; t2 = (b[4]-pz)*iz; if(t1 > t2){ const t = t1; t1 = t2; t2 = t; } if(t1 > tmin) tmin = t1; if(t2 < tmax) tmax = t2; } else if(pz < zlo || pz > b[4]) continue;
      if(tmax > Math.max(tmin, 1e-3)) hit = true; }
    for(let k = 0; k < CYL.length && !hit; k++){ const c = CYL[k], dx = px - c[0], dy = py - c[1], bq = dx*sx + dy*sy, cq = dx*dx + dy*dy - c[2]*c[2], disc = bq*bq - sxy*cq;
      if(disc <= 0) continue; const sq = Math.sqrt(disc), ta2 = (-bq + sq)/sxy; if(ta2 <= 1e-3) continue;
      const ta1 = Math.max((-bq - sq)/sxy, 0), z1 = pz + ta1*sz, z2 = pz + ta2*sz; if(z1 < c[4] && z2 > c[3]) hit = true; }
    if(!hit && terr){ const ux = sx/shh, uy = sy/shh, uz = sz/shh;
      for(let k = 0; k < 116; k++){ const d = 0.3 + 0.3*k, X = px + d*ux, Y = py + d*uy, Z = pz + d*uz;
        if(Y > SHOP[2] && Y < SHOP[3] && X > 0 && X < 96 && Z < roofZ(X) - 0.01){ hit = true; break; } } }
    if(!hit && NB){ const nb = NB[(p/9)|0];
      for(let q = 0; q < nb.length && !hit; q++){ const j = nb[q]*3, nx = N[j], ny = N[j+1], nz = N[j+2];
        let den = nx*sx + ny*sy + nz*sz; if(Math.abs(den) < 1e-9) den = 1e-9;
        const t = ((C[j]-px)*nx + (C[j+1]-py)*ny + (C[j+2]-pz)*nz)/den; if(t <= 1e-3) continue;
        const qx = px + t*sx - C[j], qy = py + t*sy - C[j+1], qz = pz + t*sz - C[j+2];
        if(Math.abs(qx*U[j] + qy*U[j+1] + qz*U[j+2]) < hu && Math.abs(qx*Vv[j] + qy*Vv[j+1] + qz*Vv[j+2]) < hv) hit = true; } }
    if(hit) out[(p/9)|0]++;
  }
  return out;
}
function power(E, cnt, s, dni, dhi, ta){
  const N = E.N, M = E.M, cfg = E.cfg, ghi = dni*s[2] + dhi; let pc = 0, po = 0, sh = 0;
  for(let i = 0; i < M; i++){ const nx = N[i*3], ny = N[i*3+1], nz = N[i*3+2], frac = cnt[i]/9;
    if(frac > 0.05) sh++;
    const cosi = Math.max(0, nx*s[0] + ny*s[1] + nz*s[2]);
    const Gc = dni*cosi*(1-frac) + dhi*(1+nz)/2*cfg.svf + ALB*ghi*(1-nz)/2, Go = 0.3*ghi*(1+nz)/2*cfg.svf + 0.3*ALB*ghi*(1-nz)/2;
    pc += PSTC*Gc/1000*(1 + GAM*(ta + Gc*0.9*0.79/cfg.U - 25))*cfg.other;
    po += PSTC*Go/1000*(1 + GAM*(ta + Go*0.9*0.79/cfg.U - 25))*cfg.other; }
  let wc = 0, wo = 0;
  for(const n of E.WN){ const nz = n[2], cw = Math.max(0, n[1]*s[1] + nz*s[2]);
    const Gc = dni*cw + dhi*(1+nz)/2 + ALB*ghi*(1-nz)/2, Go = 0.3*ghi*(1+nz)/2 + 0.3*ALB*ghi*(1-nz)/2;
    wc += PSTC*Gc/1000*(1 + GAM*(ta + Gc*0.9*0.79/29 - 25))*OTHER_A;
    wo += PSTC*Go/1000*(1 + GAM*(ta + Go*0.9*0.79/29 - 25))*OTHER_A; }
  return {pc, po, wc, wo, sh: sh/M};
}
// one day: steps every 10 min (solar time), shading per module per step
const DAYS = new Map();
function dayKey(V, doy){ return V + ':' + doy; }
function dayInit(V, doy, mo){
  const k = dayKey(V, doy); if(DAYS.has(k)) return DAYS.get(k);
  const E = engine(V), steps = []; let Cday = 0;
  for(let i = 0; i < NST; i++){ const h = (i + 0.5)*DT, [el, s] = sunAt(doy, h), [dni, dhi] = clearSky(el, doy);
    if(dni === 0 && dhi === 0) continue; steps.push({i, h, el, s, dni, dhi}); Cday += (dni*s[2] + dhi)*DT/1000; }
  const Ov = 0.3*Cday, f = Math.max(0, Math.min(1, (GHI[mo] - Ov)/(Cday - Ov)));
  const D = {V, doy, mo, f, steps, cnt: steps.map(() => null), res: steps.map(() => null), done: 0};
  D.byI = new Map(steps.map((st, j) => [st.i, j]));
  DAYS.set(k, D); if(DAYS.size > 8){ DAYS.delete(DAYS.keys().next().value); }
  return D;
}
function dayStep(D, j){
  if(D.cnt[j]) return; const E = engine(D.V), st = D.steps[j], mo = D.mo;
  const ta = (T_MAX[mo] + T_MIN[mo])/2 + (T_MAX[mo] - T_MIN[mo])/2*Math.cos(2*Math.PI*(st.h - 15)/24);
  const cnt = shadeCounts(E, st.s, st.el, new Uint8Array(E.M));
  D.cnt[j] = cnt; D.res[j] = power(E, cnt, st.s, st.dni, st.dhi, ta); D.done++;
}
function daySync(V, m, d){ const D = dayInit(V, doyOf(m, d), m-1); D.steps.forEach((_, j) => dayStep(D, j)); return D; }

// ================= charts (SVG)
const SVGNS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent){ const e = document.createElementNS(SVGNS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
function niceMax(v){ if(v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v/p; return ([1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find(k => n <= k + 1e-9))*p; }
function lineChart(host, o){
  host.innerHTML = ''; const Wd = 380, H = o.h || 190, m = {l: 40, r: 10, t: 10, b: 22}, iw = Wd - m.l - m.r, ih = H - m.t - m.b;
  const svg = el('svg', {viewBox: `0 0 ${Wd} ${H}`, role: 'img', 'aria-label': o.label || ''}, host);
  const ymax = niceMax(o.ymax || Math.max(1, ...o.series.flatMap(s => s.y))), X = x => m.l + (x - o.x0)/(o.x1 - o.x0)*iw, Y = y => m.t + ih - y/ymax*ih;
  for(let k = 0; k <= 4; k++){ const v = ymax*k/4, y = Y(v); el('line', {x1: m.l, x2: Wd - m.r, y1: y, y2: y, class: k ? 'grid' : 'base'}, svg); el('text', {x: m.l - 6, y: y + 3.5, 'text-anchor': 'end', class: 'ax'}, svg).textContent = o.yfmt ? o.yfmt(v) : nf(v); }
  for(let x = Math.ceil(o.x0/2)*2; x <= o.x1; x += 2){ el('text', {x: X(x), y: H - 6, 'text-anchor': 'middle', class: 'ax'}, svg).textContent = String(x).padStart(2, '0'); }
  o.series.forEach(s => { if(s.bars){ const bw = Math.max(1, iw/(o.x1 - o.x0)*s.bw - 1); s.x.forEach((x, i) => { if(s.y[i] <= 0) return; el('rect', {x: X(x) - bw/2, y: Y(s.y[i]), width: bw, height: Math.max(0.5, ih + m.t - Y(s.y[i])), rx: Math.min(2, bw/2), fill: s.color}, svg); }); return; }
    let d = ''; s.x.forEach((x, i) => { d += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(s.y[i]).toFixed(1); });
    if(s.area){ el('path', {d: d + `L${X(s.x[s.x.length-1]).toFixed(1)} ${Y(0)}L${X(s.x[0]).toFixed(1)} ${Y(0)}Z`, fill: s.color, opacity: 0.14}, svg); }
    el('path', {d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dash ? '5 4' : 'none'}, svg); });
  // direct labels at the peaks, pushed apart
  if(o.labels){ const L = o.series.map(s => { let k = 0; s.y.forEach((v, i) => { if(v > s.y[k]) k = i; }); return {s, x: X(s.x[k]), y: Y(s.y[k]) - 6}; }).sort((a, b) => a.y - b.y);
    for(let i = 1; i < L.length; i++) if(Math.abs(L[i].x - L[i-1].x) < 70 && L[i].y - L[i-1].y < 13) L[i].y = L[i-1].y + 13;
    L.forEach(l => { const t = el('text', {x: Math.min(Wd - m.r - 2, Math.max(m.l + 2, l.x + 6)), y: Math.max(m.t + 9, l.y), class: 'dl'}, svg); t.textContent = l.s.name; }); }
  const mk = el('line', {y1: m.t, y2: m.t + ih, stroke: 'var(--ink-2)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0}, svg);
  const cross = el('line', {y1: m.t, y2: m.t + ih, stroke: 'var(--ink-3)', 'stroke-width': 1, opacity: 0}, svg);
  const tip = document.createElement('div'); tip.className = 'ctip'; tip.hidden = true; host.appendChild(tip);
  const hit = el('rect', {x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent'}, svg);
  function at(s, x){ if(x < s.x[0] - 1e-9 || x > s.x[s.x.length-1] + 1e-9) return 0; let k = 0; while(k < s.x.length - 1 && s.x[k+1] < x) k++; if(k >= s.x.length - 1) return s.y[k]; const t = (x - s.x[k])/(s.x[k+1] - s.x[k] || 1); return s.bars ? s.y[Math.abs(x - s.x[k]) < Math.abs(x - s.x[k+1]) ? k : k+1] : s.y[k] + (s.y[k+1] - s.y[k])*t; }
  function move(ev){ const r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left)/r.width*Wd; if(sx < m.l || sx > Wd - m.r){ tip.hidden = true; cross.setAttribute('opacity', 0); return; }
    const x = o.x0 + (sx - m.l)/iw*(o.x1 - o.x0); cross.setAttribute('x1', sx); cross.setAttribute('x2', sx); cross.setAttribute('opacity', 1);
    tip.innerHTML = `<div class="h">${hhmm(x)}</div>` + o.series.map(s => `<div class="r"><span class="sw" style="background:${s.color};width:9px;height:9px"></span>${s.name}: <b>${(o.tfmt || o.yfmt || nf)(at(s, x))}</b></div>`).join('');
    tip.hidden = false; const hw = tip.offsetWidth, px = ev.clientX - host.getBoundingClientRect().left; tip.style.left = Math.max(0, Math.min(host.clientWidth - hw, px + (px > host.clientWidth/2 ? -hw - 12 : 12))) + 'px'; tip.style.top = '4px'; }
  hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move); hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('opacity', 0); });
  return {marker(x){ if(x === null){ mk.setAttribute('opacity', 0); return; } mk.setAttribute('x1', X(x)); mk.setAttribute('x2', X(x)); mk.setAttribute('opacity', 0.9); }};
}
function barChart(host, o){
  host.innerHTML = ''; const Wd = 380, H = 200, m = {l: 40, r: 8, t: 12, b: 22}, iw = Wd - m.l - m.r, ih = H - m.t - m.b, n = o.v.length;
  const svg = el('svg', {viewBox: `0 0 ${Wd} ${H}`, role: 'img', 'aria-label': o.label || ''}, host), ymax = niceMax(Math.max(...o.v)), Y = y => m.t + ih - y/ymax*ih, bw = iw/n;
  for(let k = 0; k <= 4; k++){ const v = ymax*k/4; el('line', {x1: m.l, x2: Wd - m.r, y1: Y(v), y2: Y(v), class: k ? 'grid' : 'base'}, svg); el('text', {x: m.l - 6, y: Y(v) + 3.5, 'text-anchor': 'end', class: 'ax'}, svg).textContent = nf(v); }
  const tip = document.createElement('div'); tip.className = 'ctip'; tip.hidden = true; host.appendChild(tip);
  o.v.forEach((v, i) => { const x = m.l + i*bw + bw*0.16, w = bw*0.68, y = Y(v);
    el('path', {d: `M${x} ${Y(0)}V${y + 3}Q${x} ${y} ${x + 3} ${y}H${x + w - 3}Q${x + w} ${y} ${x + w} ${y + 3}V${Y(0)}Z`, fill: o.color}, svg);
    el('text', {x: x + w/2, y: H - 6, 'text-anchor': 'middle', class: 'ax'}, svg).textContent = o.c[i];
    const hr = el('rect', {x: m.l + i*bw, y: m.t, width: bw, height: ih, fill: 'transparent'}, svg);
    const show = ev => { tip.innerHTML = `<div class="h">${o.full[i]}</div>${nf(v, 1)} ${o.unit}`; tip.hidden = false; const px = (x + w/2)/Wd*host.clientWidth; tip.style.left = Math.max(0, Math.min(host.clientWidth - tip.offsetWidth, px - tip.offsetWidth/2)) + 'px'; tip.style.top = Math.max(0, y/H*host.clientHeight - 44) + 'px'; };
    hr.addEventListener('pointermove', show); hr.addEventListener('pointerdown', show); hr.addEventListener('pointerleave', () => tip.hidden = true); });
  const mi = o.v.indexOf(Math.max(...o.v)); el('text', {x: m.l + mi*bw + bw/2, y: Y(o.v[mi]) - 4, 'text-anchor': 'middle', class: 'dl'}, svg).textContent = nf(o.v[mi], 0);
}

// ---------- Сезони
const SEAS_ORDER = ['Зима','Весна','Літо','Осінь'], SEAS_COL = {'Зима': '--s1', 'Літо': '--s2', 'Весна': '--s3', 'Осінь': '--s4'};
const SEAS_DATE = {'Зима': [12, 21], 'Весна': [3, 20], 'Літо': [6, 21], 'Осінь': [9, 23]};
let SEAW = 'avg';
function seasonSeries(V){ const S = DATA.season[V]; return SEAS_ORDER.map(n => { const s = S.seasons.find(x => x.name === n), [m, d] = SEAS_DATE[n], doy = doyOf(m, d), sh = clockShift(doy, isDST(2027, m, d));
  const y = s.clr.map((c, i) => SEAW === 'clr' ? c : SEAW === 'ovc' ? s.ovc[i] : s.f*c + (1 - s.f)*s.ovc[i]);
  return {name: n, color: css(SEAS_COL[n]), x: s.h.map(h => h + sh), y, f: s.f, date: s.date}; }); }
function renderSeasons(){
  const ser = seasonSeries(VAR);
  $('#sea-sub').textContent = `Варіант ${VN[VAR]}: ${nf(DATA[VAR].mods.length)} модулів на цеху + ${DATA.wh.length} на складі, ${nf(DATA.sum[VAR].kwp, 1)} кВт пікових. День сезону: 21.12, 20.03, 21.06, 23.09.`;
  $('#sea-lg').innerHTML = ser.map(s => `<span><i style="background:${s.color}"></i>${s.name} ${s.date}</span>`).join('');
  lineChart($('#sea-chart'), {x0: 4, x1: 22, series: ser, labels: true, tfmt: v => nf(v) + ' кВт', label: 'Потужність у день кожного сезону'});
  // hourly table
  const hours = []; for(let h = 4; h < 22; h++) hours.push(h);
  const tab = ser.map(s => { const b = {}; s.x.forEach((x, i) => { const k = Math.floor(x); b[k] = (b[k] || 0) + s.y[i]*DATA.season[VAR].DT; }); return b; });
  const rows = hours.filter(h => tab.some(b => (b[h] || 0) >= 0.5));
  let html = `<table class="t num"><thead><tr><th>Година</th>${ser.map(s => `<th><span class="dot" style="background:${s.color}"></span>${s.name}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(h => { html += `<tr><td>${String(h).padStart(2, '0')}–${String(h+1).padStart(2, '0')}</td>${tab.map(b => `<td>${b[h] >= 0.5 ? nf(b[h]) : '—'}</td>`).join('')}</tr>`; });
  html += `</tbody><tfoot><tr><td>За добу</td>${tab.map(b => `<td>${nf(Object.values(b).reduce((a, c) => a + c, 0))}</td>`).join('')}</tr></tfoot></table>`;
  $('#sea-table').innerHTML = html;
}
$$('#sea-w button').forEach(b => b.addEventListener('click', () => { SEAW = b.dataset.w; $$('#sea-w button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderSeasons(); }));

// ---------- Місяці
const MON_S = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'], MON_F = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
function renderMonths(){
  const S = DATA.season[VAR], o = VAR === 'A' ? 'B' : 'A', So = DATA.season[o], k = DATA.sum[VAR];
  const shop = S.monthly.reduce((a, m) => a + m.shop, 0);
  $('#mon-stats').innerHTML = `<div class="stat"><div class="v num">${nf(S.annual, 1)}</div><div class="k">МВт·год за рік, варіант ${VN[VAR]}</div></div><div class="stat"><div class="v num">${nf(S.annual*1000/k.kwp)}</div><div class="k">кВт·год на кВт пікової</div></div><div class="stat"><div class="v num">${nf(So.annual, 1)}</div><div class="k">МВт·год, варіант ${VN[o]} (${VAR === 'B' ? '−' : '+'}${nf(Math.abs(1 - So.annual/S.annual)*100, 0)} %)</div></div>`;
  barChart($('#mon-chart'), {v: S.monthly.map(m => m.mwh), c: MON_S, full: MON_F, unit: 'МВт·год', color: css('--s1'), label: 'Генерація по місяцях'});
  $('#mon-table').innerHTML = `<table class="t num"><thead><tr><th>Місяць</th><th>Цех</th><th>Склад</th><th>Разом</th></tr></thead><tbody>${S.monthly.map((m, i) => `<tr><td>${MON_F[i]}</td><td>${nf(m.shop, 1)}</td><td>${nf(m.mwh - m.shop, 1)}</td><td>${nf(m.mwh, 1)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Рік, МВт·год</td><td>${nf(shop, 1)}</td><td>${nf(S.annual - shop, 1)}</td><td>${nf(S.annual, 1)}</td></tr></tfoot></table>`;
  $('#mon-note').textContent = `Та сама модель, що й у порівняльному розрахунку: Київ, ясне небо + хмарність за кліматом місяця, тіні кожні 10 хв, тінь від щитів PV урахована. Склад: 57 модулів на односхилій частині лежать на скаті 11°; у зведенні 22.10 їх пораховано як 22°, тому там рік більший на ≈ 2,5 МВт·год (${nf(k.E, 1)}). Для порівняння А і Б різниці немає — склад однаковий.`;
}

// ---------- Проходи
function renderWalk(){
  const b = $('#walk-body'), g = '#0ca30c';
  if(VAR === 'B'){ const a = DATA.access.B, n = DATA.B.mods.length, c = [BASE_HEX, '#fab219', '#ec835a', '#d03b3b'], t = ['біля проходу', 'за 1 модуль', 'за 2 модулі', 'за 3 модулі'];
    const runs = DATA.access.runs, rmax = Math.max(...Object.keys(runs).map(Number));
    b.innerHTML = `<p>Модулі лежать суцільним полем по арці. Проходи — смуги, де модулів немає:</p>
    <div class="rows">
      <div class="rowi"><span class="sw" style="background:${g};opacity:.75"></span><div>Ендови <b>1,5 м</b><div class="x">4 шт. на всю довжину цеху, рівні</div></div></div>
      <div class="rowi"><span class="sw" style="background:${g};opacity:.75"></span><div>По краю даху <b>2 м</b><div class="x">з усіх чотирьох боків</div></div></div>
      <div class="rowi"><span class="sw" style="background:${g};opacity:.75"></span><div>Поперечні <b>1 м</b><div class="x">2 шт., ділять дах на 3 блоки</div></div></div>
      <div class="rowi"><span class="sw" style="background:${g};opacity:.5"></span><div>По гребеню арки <b>0,8 м</b><div class="x">там, де немає ліхтаря</div></div></div>
      <div class="rowi"><span class="sw" style="background:${g};opacity:.5"></span><div>Навколо ліхтарів <b>0,5 м</b><div class="x">біля вентшахт — теж 0,5 м вільно</div></div></div>
    </div>
    <h3>Чи до кожного модуля можна дістатися</h3>
    <div class="acc">${[0,1,2,3].map(k => `<div style="flex:${a[k]};background:${c[k]}" title="${t[k]}: ${a[k]}"></div>`).join('')}</div>
    <div class="rows">${[0,1,2,3].map(k => `<div class="rowi"><span class="sw" style="background:${c[k]}"></span><div><b class="num">${nf(a[k])}</b> модулів ${t[k]} <span class="x">(${nf(a[k]/n*100)} %)</span></div></div>`).join('')}</div>
    <p>Між проходами — від 1 до ${rmax} модулів поперек арки, найчастіше 3–6. Найдальший модуль — за 3 модулі (≈ 4 м) від проходу. Якщо прохід 0,5 м біля ліхтарів не рахувати, найдальший — за 4 модулі: ${nf(DATA.access.B_nolan[3])} модулів за 3 і більше.</p>
    <p class="note">Увімкніть «Доступ» над макетом — модулі пофарбуються за відстанню до проходу.</p>`; }
  else { b.innerHTML = `<p>Ряди на трикутниках 15° з кроком 2,10 м: між рядами вільно <b>0,84 м</b>, тож до кожного модуля можна підійти спереду.</p>
    <div class="rows">
      <div class="rowi"><span class="sw" style="background:${g};opacity:.75"></span><div>Над ендовами <b>2,45 м</b><div class="x">модулі над ендовами прибрано; над 4-ю — 4,3 м</div></div></div>
      <div class="rowi"><span class="sw" style="background:${g};opacity:.75"></span><div>По краю даху <b>≈ 1,8–2,3 м</b></div></div>
    </div>
    <p class="note">Проходи між рядами не підсвічено — їх видно на макеті.</p>`; }
}


// ---------- Кошторис
function renderEst(){
  const E = DATA.est, secs = Object.keys(E.sec.A), cell = (V, k) => { const v = E.sec[V][k]; return [v[0] + v[2], v[1] + v[2]]; };
  const lump = it => it[3] === 'компл' && it[4] === 1 && it[5] === 1;
  let h = `<p>Матеріали + роботи, $ без ПДВ. Ціни — зі зведення 22.10, кількості — з розрахунку 23.10 (розкладка, щити, кабелі). AC-частина й УЗЕ сюди не входять.</p>`;
  h += `<table class="t num"><thead><tr><th>Розділ</th><th>А Китай</th><th>А Україна</th><th>Б Китай</th><th>Б Україна</th></tr></thead><tbody>`;
  secs.forEach(k => { const a = cell('A', k), b = cell('B', k), lp = E.items.some(it => it[0] === k && lump(it)) && E.items.filter(it => it[0] === k && it[1]).every(lump);
    h += `<tr><td>${k.replace(/^\d+\.\s*/, '')}${lp ? '<span class="tag w">за проєктом</span>' : ''}</td><td>${nf(a[0])}</td><td>${nf(a[1])}</td><td>${nf(b[0])}</td><td>${nf(b[1])}</td></tr>`; });
  h += `</tbody><tfoot><tr><td>Разом</td><td>${nf(E.tot.A.cn)}</td><td>${nf(E.tot.A.ua)}</td><td>${nf(E.tot.B.cn)}</td><td>${nf(E.tot.B.ua)}</td></tr></tfoot></table>`;
  h += `<p class="note">«Китай» / «Україна» — де купуються матеріали; роботи однакові в обох стовпцях (реальна трудомісткість, 450 грн/люд.год).</p>`;
  h += `<h3>Що пораховано поштучно, а що — комплектом</h3><div class="rows">
    <div class="rowi"><span class="sw" style="background:var(--s3)"></span><div><b>Поштучно для А і Б окремо:</b> модулі; кріплення — лаги, трикутники, з'єднувачі, затиски, болти й шайби, блоки, анкери; кабель 6 мм², конектори MC4, гофра, стяжки; щити PV із запобіжниками й роз'ємами, роз'єднувачі біля PCS, RS485 і PE; лінії щит–PCS з наконечниками; лотки з кришками, опорами й з'єднувачами; ПНР.</div></div>
    <div class="rowi"><span class="sw" style="background:#fab219"></span><div><b>Одним комплектом із зведення, однаково для А і Б:</b> блискавкозахист і зрівнювання потенціалів; доставка й механізація; кріплення модулів, щитів і лотків на складі.<div class="x">Для Б блискавкозахист і доставку ще не перераховано: модулів на 622 більше, баласту на 32 т більше, лаги треба приєднати до системи зрівнювання.</div></div></div></div>`;
  h += `<h3>Позиції</h3>`;
  secs.forEach(k => { const its = E.items.filter(it => it[0] === k);
    h += `<details><summary>${k}</summary><table class="t num"><thead><tr><th>Позиція</th><th>Од.</th><th>А</th><th>Б</th></tr></thead><tbody>` +
      its.map(it => `<tr><td class="l">${it[1] ? '' : '<span class="tag">робота</span> '}${it[2]}${lump(it) ? '<span class="tag w">комплект</span>' : ''}</td><td>${it[3]}</td><td>${it[4] ? nf(it[4], it[4] % 1 ? 1 : 0) : '—'}</td><td>${it[5] ? nf(it[5], it[5] % 1 ? 1 : 0) : '—'}</td></tr>`).join('') + `</tbody></table></details>`; });
  $('#est-body').innerHTML = h;
}
function initPanelsOnly(){ $$('.tabs button').forEach(b => b.addEventListener('click', () => { $$('.tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b))); $$('.pane').forEach(p => p.hidden = p.dataset.p !== b.dataset.t); })); renderSeasons(); renderMonths(); renderWalk(); renderEst(); }
// ================= UI state
let VAR = store.get('var') === 'A' ? 'A' : 'B';
let MODE = ['now','year','acc','box'].includes(store.get('mode')) ? store.get('mode') : 'now';
function kyivNow(){ const n = new Date(), P = {}; try{ new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Kiev', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(n).forEach(x => P[x.type] = x.value); }catch(e){}
  return P.year ? {y: +P.year, m: +P.month, d: +P.day, t: +P.hour + (+P.minute)/60} : {y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), t: n.getHours() + n.getMinutes()/60}; }
const NOW = kyivNow();
let DATE = {y: NOW.y, m: NOW.m, d: NOW.d};
let STEP = null;          // index into the 144-step grid
let CUR = null;           // current day object
const MS_COL = () => [css('--s1'), css('--s2'), css('--s3')];

// ================= 3D
if(typeof THREE === 'undefined' || !THREE.OrbitControls){ $('#loading').textContent = 'Не вдалося завантажити 3D-бібліотеку. Перевірте з’єднання й оновіть сторінку.'; initPanelsOnly(); return; }
const canvas = $('#gl');
let renderer;
try{ renderer = new THREE.WebGLRenderer({canvas, antialias: true}); }catch(e){ $('#loading').textContent = 'WebGL недоступний у цьому переглядачі'; initPanelsOnly(); return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 3000);
const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.09; controls.maxPolarAngle = Math.PI*0.495; controls.screenSpacePanning = false; controls.minDistance = 4; controls.maxDistance = 600;
const W = (X, Y, h) => new THREE.Vector3(X, h, -Y);
const XA = new THREE.Vector3(1,0,0), ZA = new THREE.Vector3(0,0,1), ONE = new THREE.Vector3(1,1,1);
const hemi = new THREE.HemisphereLight(0xf2f5ff, 0x8d907f, 0.3); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e2, 1.25); sun.castShadow = true;
const SMAP = renderer.capabilities.maxTextureSize >= 4096 ? 4096 : 2048;
sun.shadow.mapSize.set(SMAP, SMAP); { const c = sun.shadow.camera; c.left = -112; c.right = 112; c.top = 112; c.bottom = -112; c.near = 1; c.far = 700; }
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.035;
const CEN = W(76, 36, 0); sun.target.position.copy(CEN); scene.add(sun); scene.add(sun.target);
const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 14), new THREE.MeshBasicMaterial({color: 0xffc94a})); scene.add(sunDisc);
const SUN_R = 175; let sunPath = null;
const G = {}; const grp = (n, parent) => { const g = new THREE.Group(); g.name = n; (parent || scene).add(g); G[n] = g; return g; };
['site','bld','obs','masts','wh','sunG'].forEach(n => grp(n));
G.sunG.add(sunDisc);
const VG = {A:{}, B:{}};
['A','B'].forEach(V => { const root = grp('v' + V); VG[V].root = root; ['mods','mount','anch','boxes','lines','walk'].forEach(n => { const g = new THREE.Group(); root.add(g); VG[V][n] = g; }); });
const pickable = [];
const lam = (c, o) => new THREE.MeshLambertMaterial(Object.assign({color: c}, o || {}));
const std = (c, m, r, o) => new THREE.MeshStandardMaterial(Object.assign({color: c, metalness: m, roughness: r}, o || {}));
const MAT = {ground: lam(0xbfc3ba), wall: lam(0xdcded8, {side: THREE.DoubleSide}), roof: lam(0xd3d6d6, {side: THREE.DoubleSide}),
  lan: std(0xb6cfdd, 0.1, 0.25, {transparent: true, opacity: 0.85}), obs: std(0x9aa3a8, 0.55, 0.45), mast: std(0xc9cfd2, 0.6, 0.4),
  whWall: lam(0xd2d4cc, {side: THREE.DoubleSide}), whRoof: std(0xa76d5e, 0.3, 0.65, {side: THREE.DoubleSide}), tp: lam(0xd9d1c1),
  rail: std(0xc5ccd0, 0.6, 0.4), block: lam(0x8f9196), frame: std(0xc9d0d4, 0.55, 0.45), anch: lam(0xd03b3b), box: lam(0xffffff)};
function bx(w, h, d, x, y, z, rx){ const g = new THREE.BoxGeometry(w, h, d); if(rx) g.rotateX(rx); g.translate(x || 0, y || 0, z || 0); return g; }
function merge(list){ const gs = list.map(g => g.index ? g.toNonIndexed() : g); let n = 0; gs.forEach(g => n += g.attributes.position.count);
  const p = new Float32Array(n*3), q = new Float32Array(n*3); let o = 0; gs.forEach(g => { p.set(g.attributes.position.array, o*3); q.set(g.attributes.normal.array, o*3); o += g.attributes.position.count; });
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(p, 3)); m.setAttribute('normal', new THREE.BufferAttribute(q, 3)); return m; }
function inst(geo, mat, mats, parent, cast){ const im = new THREE.InstancedMesh(geo, mat, Math.max(1, mats.length)); im.count = mats.length; mats.forEach((m, i) => im.setMatrixAt(i, m));
  im.castShadow = cast !== false; im.receiveShadow = true; im.frustumCulled = false; im.instanceMatrix.needsUpdate = true; parent.add(im); return im; }
function boxXY(X0, X1, Y0, Y1, z0, z1, mat, parent){ const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(X1-X0), z1-z0, Math.abs(Y1-Y0)), mat); m.position.set((X0+X1)/2, (z0+z1)/2, -(Y0+Y1)/2); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
const rollQ = X => new THREE.Quaternion().setFromAxisAngle(ZA, Math.atan(roofK(X)));
function onRoof(X, Y, h, q){ const rn = new THREE.Vector3(0, 1, 0).applyQuaternion(q); return W(X, Y, roofZ(X)).addScaledVector(rn, h); }

// ground, shop, lanterns, obstacles
{ const g = new THREE.Mesh(new THREE.PlaneGeometry(460, 380), MAT.ground); g.rotation.x = -Math.PI/2; g.position.set(76, -0.01, -40); g.receiveShadow = true; G.site.add(g); }
const roofXs = []; for(let x = SHOP[0]; x < SHOP[1]; x += 0.25) roofXs.push(x); roofXs.push(SHOP[1]);
{ const n = roofXs.length, pos = new Float32Array(n*6), idx = [];
  roofXs.forEach((X, i) => { const z = roofZ(X); pos.set([X, z, -SHOP[2], X, z, -SHOP[3]], i*6); });
  for(let i = 0; i < n-1; i++){ const a = i*2; idx.push(a, a+2, a+1, a+1, a+2, a+3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, MAT.roof); m.receiveShadow = true; m.castShadow = true; G.bld.add(m);
  const prof = []; for(let i = roofXs.length-1; i >= 0; i--) prof.push(new THREE.Vector2(roofXs[i], roofZ(roofXs[i])));
  const sh = new THREE.Shape([new THREE.Vector2(SHOP[0], 0), new THREE.Vector2(SHOP[1], 0)].concat(prof)), wg = new THREE.ShapeGeometry(sh);
  [SHOP[2], SHOP[3]].forEach(Y => { const w = new THREE.Mesh(wg, MAT.wall); w.position.z = -Y; w.castShadow = true; w.receiveShadow = true; G.bld.add(w); });
  [SHOP[0], SHOP[1]].forEach(X => { const L = SHOP[3] - SHOP[2], w = new THREE.Mesh(new THREE.PlaneGeometry(L, HV), MAT.wall); w.rotation.y = Math.PI/2; w.position.set(X, HV/2, -(SHOP[2]+SHOP[3])/2); w.castShadow = true; w.receiveShadow = true; G.bld.add(w); }); }
DATA.lan.forEach((l, i) => { const m = boxXY(l[0], l[1], l[2], l[3], Math.min(roofZ(l[0]), roofZ(l[1])) - 0.05, HV + SPANS[i][2] + 0.55, MAT.lan, G.obs);
  m.userData.tip = `<b>Зенітний ліхтар ${i+1}</b>\n${nf(l[1]-l[0],1)} × ${nf(l[3]-l[2],1)} м, ≈ 0,55 м над гребенем`; pickable.push(m); });
DATA.obs.forEach(o => { const h = obsH(o[2]), m = new THREE.Mesh(new THREE.CylinderGeometry(o[2]/2, o[2]/2, h, 18), MAT.obs);
  m.position.set(o[0], roofZ(o[0]) + h/2 - 0.05, -o[1]); m.castShadow = true; m.receiveShadow = true; G.obs.add(m);
  m.userData.tip = `<b>Вентшахта / дефлектор</b>\nØ ${nf(o[2],2)} м, висота ≈ ${nf(h,1)} м`; pickable.push(m); });
{ const mats = [], tops = []; DATA.masts.forEach(m => { const z0 = surfZ(m[0], m[1]); mats.push(new THREE.Matrix4().compose(W(m[0], m[1], z0 + m[2]/2), new THREE.Quaternion(), new THREE.Vector3(1, m[2], 1))); tops.push(new THREE.Matrix4().makeTranslation(m[0], z0 + 0.06, -m[1])); });
  const im = inst(new THREE.CylinderGeometry(0.045, 0.06, 1, 8), MAT.mast, mats, G.masts); im.userData.tipf = () => '<b>Щогла блискавкоприймача</b>\nМ-04/40, 4 м';  pickable.push(im);
  inst(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 12), MAT.block, tops, G.masts); }
// warehouse and substations
function prism(P, hF, wallMat, roofMat, parent, ridgeY){
  const pos = [];
  for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.ceil(L));
    for(let k = 0; k < n; k++){ const t0 = k/n, t1 = (k+1)/n, x0 = a[0]+(b[0]-a[0])*t0, y0 = a[1]+(b[1]-a[1])*t0, x1 = a[0]+(b[0]-a[0])*t1, y1 = a[1]+(b[1]-a[1])*t1, h0 = hF(x0, y0), h1 = hF(x1, y1);
      pos.push(x0,0,-y0, x1,0,-y1, x1,h1,-y1, x0,0,-y0, x1,h1,-y1, x0,h0,-y0); } }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.computeVertexNormals();
  const wm = new THREE.Mesh(wg, wallMat); wm.castShadow = true; wm.receiveShadow = true; parent.add(wm);
  const pieces = ridgeY === undefined ? [P] : [P.map(p => [p[0], Math.min(p[1], ridgeY)]), P.map(p => [p[0], Math.max(p[1], ridgeY)])], rp = [];
  pieces.forEach(Q => { const tr = THREE.ShapeUtils.triangulateShape(Q.map(p => new THREE.Vector2(p[0], p[1])), []), cy = Q.reduce((s, p) => s + p[1], 0)/Q.length;
    tr.forEach(t => t.forEach(i => { const p = Q[i], yy = ridgeY === undefined ? p[1] : (cy < ridgeY ? Math.min(p[1], ridgeY - 1e-6) : Math.max(p[1], ridgeY + 1e-6)); rp.push(p[0], hF(p[0], yy), -p[1]); })); });
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.computeVertexNormals();
  const rm = new THREE.Mesh(rg, roofMat); rm.castShadow = true; rm.receiveShadow = true; parent.add(rm); return [wm, rm]; }
Object.keys(POLY).forEach(k => { const ms = prism(POLY[k], WHF[k], MAT.whWall, MAT.whRoof, G.wh, (k === 'C1' || k === 'C2') ? -15.5 : undefined);
  ms.forEach(m => { m.userData.tip = `<b>Склад</b>\n${k === 'C1' || k === 'C2' ? 'двосхилий' : 'односхилий'} дах, скат ${SLOPE[k]}°`; pickable.push(m); }); });
TPS.forEach(t => { const m = boxXY(t.b[0], t.b[1], t.b[2], t.b[3], 0, t.h, MAT.tp, G.wh); if(t.n){ m.userData.tip = `<b>${t.n}</b>`; pickable.push(m); } });
// north arrow
{ const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#30353a'; x.beginPath(); x.moveTo(64, 6); x.lineTo(98, 70); x.lineTo(64, 56); x.lineTo(30, 70); x.closePath(); x.fill(); x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.fillText('Пн', 64, 118);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({map: t, transparent: true}));
  m.rotation.x = -Math.PI/2; m.position.set(-14, 0.05, -100); G.site.add(m); }

// ---------- modules
function pvTexture(cols, rows){ const s = 24, c = document.createElement('canvas'); c.width = cols*s + 16; c.height = rows*s + 16; const x = c.getContext('2d');
  x.fillStyle = '#eef1f5'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#c4cfe2';
  for(let i = 0; i < cols; i++) for(let j = 0; j < rows; j++) x.fillRect(8 + i*s + 1.2, 8 + j*s + 1.2, s - 2.4, s - 2.4);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
MAT.pvP = std(0xffffff, 0.2, 0.42, {map: pvTexture(6, 22)});     // portrait: 1303 along x, 2384 along z
MAT.pvL = std(0xffffff, 0.2, 0.42, {map: pvTexture(22, 6)});     // landscape
const LIN = h => new THREE.Color(h).convertSRGBToLinear();
const BASE = LIN(BASE_HEX);
const MODS = {};
function buildB(){
  const V = 'B', d = DATA.B, mats = [];
  d.mods.forEach(m => { const q = rollQ(m[0]); mats.push(new THREE.Matrix4().compose(onRoof(m[0], m[1], VCFG.B.hoff, q), q, ONE)); });
  const im = inst(new THREE.BoxGeometry(MOD_W, MOD_T, MOD_L), MAT.pvP, mats, VG.B.mods); MODS.B = im;
  // rails along Y at module joints, blocks under them (inner rail 4 per cell, edge rail 2)
  const rows = new Map(); d.mods.forEach(m => { const k = m[1].toFixed(3); if(!rows.has(k)) rows.set(k, []); rows.get(k).push(m); });
  const rails = [], blocks = [];
  rows.forEach(list => { list.sort((a, b) => a[2] - b[2]); let seg = [list[0]]; const segs = [];
    for(let i = 1; i < list.length; i++){ if(list[i][2] - list[i-1][3] > 0.1){ segs.push(seg); seg = []; } seg.push(list[i]); } segs.push(seg);
    segs.forEach(sg => { const xs = [[sg[0][2], 1]]; for(let i = 1; i < sg.length; i++) xs.push([(sg[i-1][3] + sg[i][2])/2, 0]); xs.push([sg[sg.length-1][3], 1]);
      const Y = sg[0][1];
      xs.forEach(([x, edge]) => { const q = rollQ(x); rails.push(new THREE.Matrix4().compose(onRoof(x, Y, 0.086, q), q, ONE));
        (edge ? [-0.601, 0.601] : [-0.9015, -0.3005, 0.3005, 0.9015]).forEach(o => blocks.push(new THREE.Matrix4().compose(onRoof(x, Y + o, 0.035, q), q, ONE))); }); }); });
  inst(new THREE.BoxGeometry(0.04, 0.032, 2.40), MAT.rail, rails, VG.B.mount);
  inst(new THREE.BoxGeometry(0.40, 0.07, 0.20), MAT.block, blocks, VG.B.mount);
  VG.B.nRails = rails.length; VG.B.nBlocks = blocks.length;
}
function buildA(){
  const d = DATA.A, mats = [], frames = [], blocks = [];
  const qt = new THREE.Quaternion().setFromAxisAngle(XA, 15*D2R);
  d.mods.forEach(m => { const qr = rollQ(m[0]), q = qr.clone().multiply(qt); mats.push(new THREE.Matrix4().compose(onRoof(m[0], m[1], VCFG.A.hoff, qr), q, ONE));
    const base = new THREE.Matrix4().compose(W(m[0], m[1], roofZ(m[0])), qr, ONE); frames.push(base);
    [-0.842, 0.842].forEach(x => [-0.55, 0.55].forEach(z => blocks.push(base.clone().multiply(new THREE.Matrix4().makeTranslation(x, 0.035, z))))); });
  const im = inst(new THREE.BoxGeometry(MOD_L, MOD_T, MOD_W), MAT.pvL, mats, VG.A.mods); MODS.A = im;
  const t15 = Math.tan(15*D2R), yr = 0.3125, hf = yr - 0.629*t15 - 0.11, hr = yr + 0.629*t15 - 0.11;
  const fg = merge([-0.842, 0.842].flatMap(x => [bx(0.04, 0.04, 1.36, x, 0.09, 0), bx(0.04, hf + 0.02, 0.04, x, 0.11 + hf/2, 0.629), bx(0.04, hr + 0.02, 0.04, x, 0.11 + hr/2, -0.629), bx(0.04, 0.04, 1.36, x, yr, 0, 15*D2R)]));
  inst(fg, MAT.frame, frames, VG.A.mount);
  inst(new THREE.BoxGeometry(0.20, 0.07, 0.40), MAT.block, blocks, VG.A.mount);
  VG.A.nBlocks = blocks.length;
}
function buildCommon(V){
  const d = DATA[V];
  // anchors: a red pin through the module
  const am = d.anch.map(i => new THREE.Matrix4().makeTranslation(d.mods[i][0], roofZ(d.mods[i][0]) + 0.3, -d.mods[i][1]));
  const pin = merge([bx(0.06, 0.6, 0.06, 0, 0, 0), new THREE.SphereGeometry(0.11, 12, 8).translate(0, 0.32, 0)]);
  const ai = inst(pin, MAT.anch, am, VG[V].anch); ai.userData.tipf = () => `<b>Анкер до покрівлі</b>\n${V === 'B' ? 'кожен 20-й модуль, у смузі 9 м від краю — кожен 3-й' : 'за схемою: кожен 20-й, біля краю — кожен 3-й'}`; pickable.push(ai);
  // PV boxes (shop + warehouse)
  const bm = [], bc = [], tips = [];
  d.boxes.forEach(b => { bm.push(new THREE.Matrix4().makeTranslation(b[3], roofZ(b[3]) + 0.525, -b[4])); bc.push(b[2]); tips.push(`<b>${b[1]}</b> → MS-${b[2]}\nщит PV на даху цеху, 0,66 × 0,36 × 1,05 м`); });
  DATA.whbox[V].forEach(b => { bm.push(new THREE.Matrix4().makeTranslation(b[1], surfZ(b[1], b[2]) + 0.525, -b[2])); bc.push(+b[0].split('-')[1][0]); tips.push(`<b>${b[0]}</b>\nщит PV на складі`); });
  const bi = inst(new THREE.BoxGeometry(0.66, 1.05, 0.36), MAT.box, bm, VG[V].boxes); bi.userData.ms = bc; bi.userData.tipf = i => tips[i]; pickable.push(bi); VG[V].boxMesh = bi;
  // lines box → PCS: ribbons on the roof
  [1, 2, 3].forEach(ms => { const pos = [];
    d.paths.filter(p => p[0] === ms).forEach(([_, pts]) => { for(let k = 0; k < pts.length - 1; k++){ const [x0, y0] = pts[k], [x1, y1] = pts[k+1], L = Math.hypot(x1-x0, y1-y0); if(L < 1e-6) continue;
      const n = Math.max(1, Math.ceil(L/0.5)), ox = -(y1-y0)/L*0.09, oy = (x1-x0)/L*0.09;
      for(let i = 0; i < n; i++){ const ta = i/n, tb = (i+1)/n, xa = x0+(x1-x0)*ta, ya = y0+(y1-y0)*ta, xb = x0+(x1-x0)*tb, yb = y0+(y1-y0)*tb, za = surfZ(xa, ya) + 0.05 + ms*0.012, zb = surfZ(xb, yb) + 0.05 + ms*0.012;
        pos.push(xa+ox, za, -(ya+oy), xb+ox, zb, -(yb+oy), xb-ox, zb, -(yb-oy), xa+ox, za, -(ya+oy), xb-ox, zb, -(yb-oy), xa-ox, za, -(ya-oy)); } } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide})); m.userData.ms = ms; m.renderOrder = 2; VG[V].lines.add(m);
    m.userData.tip = `<b>Лінії щит → MS-${ms}</b>\nалюмінієвий кабель у лотку по даху`; pickable.push(m); });
  // walkways
  const walks = V === 'B' ? DATA.walk.concat(DATA.lanclr) : walkA();
  const kinds = {};
  walks.forEach(w => { (kinds[w[4]] = kinds[w[4]] || []).push(w); });
  Object.keys(kinds).forEach(k => { const pos = [];
    kinds[k].forEach(([x0, x1, y0, y1]) => { const xs = []; for(let x = x0; x < x1; x += 0.25) xs.push(x); xs.push(x1);
      for(let i = 0; i < xs.length - 1; i++){ const a = xs[i], b = xs[i+1], za = roofZ(a) + 0.03, zb = roofZ(b) + 0.03; pos.push(a, za, -y0, b, zb, -y0, b, zb, -y1, a, za, -y0, b, zb, -y1, a, za, -y1); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const narrow = /0,5|0,8/.test(k);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color: 0x0ca30c, transparent: true, opacity: narrow ? 0.30 : 0.42, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2}));
    m.renderOrder = 3; m.userData.tip = `<b>Прохід: ${k}</b>`; VG[V].walk.add(m); pickable.push(m); });
}
function walkA(){ // A: free strips over valleys and along the roof edges (between rows there is a 0,84 m gap)
  const xs = DATA.A.mods.map(m => m[0]), ys = DATA.A.mods.map(m => m[1]), out = [];
  [18, 36, 54, 72].forEach(v => { const w = Math.max(...xs.filter(x => x < v)) + MOD_L/2, e = Math.min(...xs.filter(x => x > v)) - MOD_L/2; out.push([w, e, SHOP[2], SHOP[3], `над ендовою ${nf(e - w, 2)} м`]); });
  const x0 = Math.min(...xs) - MOD_L/2, x1 = Math.max(...xs) + MOD_L/2, y0 = Math.min(...ys) - 0.63, y1 = Math.max(...ys) + 0.63;
  out.push([SHOP[0], SHOP[1], SHOP[2], y0, 'край даху'], [SHOP[0], SHOP[1], y1, SHOP[3], 'край даху'], [SHOP[0], x0, SHOP[2], SHOP[3], 'край даху'], [x1, SHOP[1], SHOP[2], SHOP[3], 'край даху']);
  return out; }
// warehouse modules (same in both variants)
let WHM;
{ const mats = []; DATA.wh.forEach(m => { const p = whPart(m[0], m[1]) || 'C1', q = new THREE.Quaternion().setFromAxisAngle(XA, SLOPE[p]*D2R);
    if(m[2]) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2)); mats.push(new THREE.Matrix4().compose(W(m[0], m[1], WHF[p](m[0], m[1]) + 0.07), q, ONE)); });
  WHM = inst(new THREE.BoxGeometry(MOD_W, MOD_T, MOD_L), MAT.pvP, mats, G.wh); WHM.userData.tipf = i => `<b>Модуль на складі</b>\nпівденний скат ${SLOPE[whPart(DATA.wh[i][0], DATA.wh[i][1]) || 'C1']}°, не затінюється`; pickable.push(WHM);
  for(let i = 0; i < DATA.wh.length; i++) WHM.setColorAt(i, BASE); WHM.instanceColor.needsUpdate = true; }

// ---------- camera
// [position, target, radius to fit]; world: x = X, y = height, z = −Y
const VIEWS = {iso: [[200, 120, 104], [78, 6, -38], 74], top: [[77, 255, -40.8], [77, 0, -41], 86], arch: [[28, 19.5, 16], [28, 14.2, -30], 0],
  south: [[52, 34, 92], [52, 12, -40], 66], wh: [[112, 30, 64], [106, 5, 15], 36]};
let camAnim = 0, OW = 1, OH = 1;
function goView(k, instant){ const v = VIEWS[k]; if(!v) return; $$('#cams button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === k)));
  const t = new THREE.Vector3(...v[1]), p = new THREE.Vector3(...v[0]);
  if(v[2]){ const vf = camera.fov*D2R, hf = 2*Math.atan(Math.tan(vf/2)*camera.aspect), need = v[2]/Math.sin(Math.min(vf, hf)/2)*1.02, cur = p.distanceTo(t); if(need > cur || camera.aspect < 1.2) p.sub(t).setLength(Math.max(need, cur*0.75)).add(t); }
  cancelAnimationFrame(camAnim);
  if(instant || matchMedia('(prefers-reduced-motion: reduce)').matches){ camera.position.copy(p); controls.target.copy(t); controls.update(); req(); return; }
  const p0 = camera.position.clone(), t0 = controls.target.clone(), T0 = performance.now();
  const step = n => { const u = Math.min(1, (n - T0)/850), e = u < 0.5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2)/2; camera.position.lerpVectors(p0, p, e); controls.target.lerpVectors(t0, t, e); controls.update(); req(); if(u < 1) camAnim = requestAnimationFrame(step); };
  camAnim = requestAnimationFrame(step); }
const setView = k => goView(k, true);
$$('#cams button').forEach(b => b.addEventListener('click', () => goView(b.dataset.c)));

// ---------- render loop
let need = true; function req(){ need = true; }
controls.addEventListener('change', req);
function resize(){ const v = $('#view'), w = v.clientWidth, h = v.clientHeight; if(!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w/h; OW = w; OH = h; hudShift(); req(); }
// on narrow screens shift the picture down by half of the controls' height, so the model sits in the free part of the view
function hudShift(){ let s = 0; if(OW < 700){ const vr = $('#view').getBoundingClientRect(), r = $('#hudwrap').getBoundingClientRect(); s = Math.max(0, Math.min(OH*0.4, r.bottom - vr.top))/2; }
  if(s > 1) camera.setViewOffset(OW, OH, 0, -Math.round(s), OW, OH); else camera.clearViewOffset(); camera.updateProjectionMatrix(); req(); }
new ResizeObserver(resize).observe($('#view'));
const needle = $('#needle');
function loop(){ requestAnimationFrame(loop); const moved = controls.update(); if(need || moved){ needle.style.transform = `rotate(${(controls.getAzimuthalAngle()*R2D).toFixed(1)}deg)`; renderer.render(scene, camera); need = false; } }
function themeScene(){ const dark = document.documentElement.getAttribute('data-theme') ? document.documentElement.getAttribute('data-theme') === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  scene.background = new THREE.Color(css('--sky')); MAT.ground.color.set(dark ? 0x4a4d48 : 0xbfc3ba); MAT.roof.color.set(dark ? 0x9fa3a4 : 0xd3d6d6); hemi.intensity = dark ? 0.28 : 0.3; recolor(); req(); }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeScene);
new MutationObserver(themeScene).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});

// ---------- tooltip
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let downAt = null;
function pickAt(cx, cy){ const r = canvas.getBoundingClientRect(); ptr.set((cx - r.left)/r.width*2 - 1, -(cy - r.top)/r.height*2 + 1); ray.setFromCamera(ptr, camera);
  const objs = pickable.filter(o => { let p = o; while(p){ if(!p.visible) return false; p = p.parent; } return true; }).concat([MODS[VAR]].filter(o => o.visible && o.parent.visible && o.parent.parent.visible));
  const hits = ray.intersectObjects(objs, false); if(!hits.length) return null; const h = hits[0], o = h.object;
  if(o === MODS[VAR]) return modTip(h.instanceId);
  if(o.userData.tipf) return o.userData.tipf(h.instanceId);
  return o.userData.tip || null; }
function showTip(html, cx, cy){ const t = $('#tip'); if(!html){ t.hidden = true; return; } t.innerHTML = html; t.hidden = false; const r = $('#view').getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
  let x = cx - r.left + 14, y = cy - r.top + 14; if(x + w > r.width - 6) x = cx - r.left - w - 14; if(y + h > r.height - 6) y = cy - r.top - h - 14; t.style.left = Math.max(6, x) + 'px'; t.style.top = Math.max(6, y) + 'px'; }
let hoverRaf = 0;
canvas.addEventListener('pointermove', e => { if(e.pointerType !== 'mouse' || e.buttons) return; if(hoverRaf) return; hoverRaf = requestAnimationFrame(() => { hoverRaf = 0; showTip(pickAt(e.clientX, e.clientY), e.clientX, e.clientY); }); });
canvas.addEventListener('pointerleave', () => showTip(null));
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; if(e.pointerType === 'mouse') showTip(null); });
canvas.addEventListener('pointerup', e => { if(!downAt) return; const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6; downAt = null; if(!moved && e.pointerType !== 'mouse') showTip(pickAt(e.clientX, e.clientY), e.clientX, e.clientY); });
function modTip(i){ const d = DATA[VAR], m = d.mods[i], bi = d.box[i], b = d.boxes[bi], st = d.st[i], loss = d.Eu[i] > 0 ? (1 - d.E[i]/d.Eu[i])*100 : 0;
  let s = `<b>Модуль ${nf(i+1)}</b> · варіант ${VN[VAR]}\n${b ? b[1] + ' → MS-' + b[2] : ''}, стрінг ${st} (${d.ns[st]} мод.)\nЗа рік ${nf(d.E[i])} кВт·год, тінь −${nf(loss, 1)} %`;
  if(VAR === 'B') s += `\nДо проходу: ${d.acc[i] === 0 ? 'поруч' : d.acc[i] + ' ' + (d.acc[i] === 1 ? 'модуль' : 'модулі')}`;
  if(CUR && STEP !== null && CUR.byI.has(STEP)){ const j = CUR.byI.get(STEP); if(CUR.cnt[j]) s += `\nЗараз: ${CUR.cnt[j][i] ? 'тінь на ' + Math.round(CUR.cnt[j][i]/9*100) + ' % площі' : 'на сонці'}`; }
  return s; }

// ---------- colours
const C_WARN = LIN('#fab219'), C_SER = LIN('#ec835a'), C_CRIT = LIN('#d03b3b');
const RAMP_HEX = ['#f9cdb3', '#f6b48f', '#eb6834', '#b4461b', '#73290d'], RAMP = RAMP_HEX.map(LIN), WHITE = LIN('#ffffff');
const LOSS_B = [1, 3, 6, 10];
const tmpC = new THREE.Color();
function recolor(){
  if(typeof THREE === 'undefined' || !MODS[VAR]) return;
  const V = VAR, d = DATA[V], im = MODS[V], M = d.mods.length;
  let cnt = null; if(MODE === 'now' && CUR && CUR.V === V && STEP !== null && CUR.byI.has(STEP)){ const j = CUR.byI.get(STEP); cnt = CUR.cnt[j]; }
  const ms = MS_COL().map(LIN);
  for(let i = 0; i < M; i++){ let c = BASE;
    if(MODE === 'now'){ if(cnt){ const k = cnt[i]; c = k === 0 ? BASE : k <= 4 ? C_WARN : k <= 8 ? C_SER : C_CRIT; } }
    else if(MODE === 'year'){ const l = d.Eu[i] > 0 ? (1 - d.E[i]/d.Eu[i])*100 : 0; c = l < LOSS_B[0] ? BASE : l < LOSS_B[1] ? RAMP[0] : l < LOSS_B[2] ? RAMP[1] : l < LOSS_B[3] ? RAMP[2] : RAMP[4]; }
    else if(MODE === 'acc'){ const a = V === 'B' ? d.acc[i] : 0; c = a === 0 ? BASE : a === 1 ? C_WARN : a === 2 ? C_SER : C_CRIT; }
    else if(MODE === 'box'){ const b = d.boxes[d.box[i]]; tmpC.copy(ms[(b ? b[2] : 1) - 1]); if(d.box[i] % 2) tmpC.lerp(WHITE, 0.45); c = tmpC; }
    im.setColorAt(i, c); }
  im.instanceColor.needsUpdate = true;
  // boxes and lines by MS
  ['A','B'].forEach(v => { const bi = VG[v].boxMesh; if(!bi) return; bi.userData.ms.forEach((k, i) => bi.setColorAt(i, ms[k-1])); bi.instanceColor.needsUpdate = true;
    VG[v].lines.children.forEach(l => l.material.color.copy(ms[l.userData.ms - 1])); });
  legend(); req();
}
function legend(){
  const L = $('#legend'), r = (c, t) => `<span><i class="sw" style="background:${c}"></i>${t}</span>`, base = BASE_HEX;
  let h = '';
  if(MODE === 'now') h = `<span class="t">Тінь зараз</span>` + r(base, 'на сонці') + r('#fab219', 'до ½ модуля') + r('#ec835a', 'понад ½') + r('#d03b3b', 'увесь модуль');
  else if(MODE === 'year') h = `<span class="t">Втрати від тіні за рік</span>` + r(base, '< 1 %') + r(RAMP_HEX[0], '1–3 %') + r(RAMP_HEX[1], '3–6 %') + r(RAMP_HEX[2], '6–10 %') + r(RAMP_HEX[4], '> 10 %');
  else if(MODE === 'acc') h = VAR === 'B' ? `<span class="t">До проходу</span>` + r(base, 'поруч') + r('#fab219', 'за 1 модуль') + r('#ec835a', 'за 2') + r('#d03b3b', 'за 3') : `<span class="t">Доступ</span>` + r(base, 'кожен ряд має прохід 0,84 м');
  else { const c = MS_COL(); h = `<span class="t">Щит → PCS</span>` + r(c[0], 'MS-1') + r(c[1], 'MS-2') + r(c[2], 'MS-3') + `<span style="color:var(--ink-3)">сусідні щити — різний тон</span>`; }
  L.innerHTML = h;
}
$$('#modes button').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.m === MODE)); b.addEventListener('click', () => { MODE = b.dataset.m; store.set('mode', MODE); $$('#modes button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); recolor(); }); });

// ---------- build everything
buildB(); buildA(); buildCommon('B'); buildCommon('A');
['A','B'].forEach(V => { for(let i = 0; i < DATA[V].mods.length; i++) MODS[V].setColorAt(i, BASE); MODS[V].instanceColor.needsUpdate = true; });

// ---------- layers
const LAYERS = [
  ['mods', 'Модулі', () => `${nf(DATA[VAR].mods.length)} на цеху + ${DATA.wh.length} на складі`],
  ['mount', 'Кріплення', () => VAR === 'B' ? `лаги ${nf(VG.B.nRails)} відрізків, блоків ${nf(VG.B.nBlocks)}` : `трикутники, блоків ${nf(VG.A.nBlocks)}`],
  ['anch', 'Анкери', () => `${nf(DATA[VAR].anch.length)} шт.`],
  ['boxes', 'Щити PV', () => `${DATA[VAR].boxes.length} на цеху + ${DATA.whbox[VAR].length} на складі`],
  ['lines', 'Лінії щит → PCS', () => 'по даху, колір — MS'],
  ['walk', 'Проходи', () => VAR === 'B' ? 'ендови, краї, гребені, поперечні' : 'ендови і краї'],
  ['obs', 'Ліхтарі й вентшахти', () => `4 + ${DATA.obs.length}`],
  ['masts', 'Щогли блискавкозахисту', () => `${DATA.masts.length} шт.`],
  ['wh', 'Склад і ТП', () => ''],
  ['sunG', 'Сонце і його шлях за добу', () => '']];
let LAYV = {}; try{ LAYV = JSON.parse(store.get('layers') || '{}'); }catch(e){}
function applyLayers(){ LAYERS.forEach(([k]) => { const on = LAYV[k] !== false; if(G[k]) G[k].visible = on; ['A','B'].forEach(V => { if(VG[V][k]) VG[V][k].visible = on; }); }); req(); }
function renderLayers(){ $('#lay-body').innerHTML = LAYERS.map(([k, t, x]) => `<label><input type="checkbox" data-k="${k}" ${LAYV[k] !== false ? 'checked' : ''}>${t}<span class="x">${x()}</span></label>`).join('') + '<p class="note">Наведіть або торкніться модуля, щита чи проходу — з’явиться підказка.</p>';
  $$('#lay-body input').forEach(i => i.addEventListener('change', () => { LAYV[i.dataset.k] = i.checked; store.set('layers', JSON.stringify(LAYV)); applyLayers(); })); }

// ---------- variant
function setVar(V){ VAR = V; store.set('var', V); $$('#var button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === V)));
  VG.A.root.visible = V === 'A'; VG.B.root.visible = V === 'B'; renderLayers(); applyLayers(); showTip(null); loadDay(); renderSeasons(); renderMonths(); renderWalk(); renderEst(); }
$$('#var button').forEach(b => b.addEventListener('click', () => setVar(b.dataset.v)));

// ================= time / sun
const timeEl = $('#time');
function curDoy(){ return doyOf(DATE.m, DATE.d); }
function shift(){ return clockShift(curDoy(), isDST(DATE.y, DATE.m, DATE.d)); }
function placeSun(){ if(!CUR || STEP === null) return; const st = CUR.steps[CUR.byI.get(STEP)]; if(!st) return;
  const s = st.s, dir = new THREE.Vector3(s[0], s[2], -s[1]).normalize(); sun.position.copy(CEN).addScaledVector(dir, 330); sunDisc.position.copy(CEN).addScaledVector(dir, SUN_R);
  sun.intensity = Math.max(0.8, Math.min(2.4, 0.72/Math.max(0.05, Math.sin(st.el)))); req(); }
const DIRS = ['Пн','Пн-Сх','Сх','Пд-Сх','Пд','Пд-Зх','Зх','Пн-Зх'];
function readout(){
  const now = $('#now'); if(!CUR || STEP === null){ now.innerHTML = ''; return; }
  const j = CUR.byI.get(STEP), st = CUR.steps[j], az = ((Math.atan2(st.s[0], st.s[1])*R2D) + 360) % 360, dn = DIRS[Math.round(az/45) % 8];
  let h = `<span class="sun">☀ <b class="num">${nf(st.el*R2D, 0)}°</b> ${dn}</span>`;
  const r = CUR.res[j];
  if(r){ const M = DATA[VAR].mods.length, nsh = Math.round(r.sh*M);
    h += `<span>у тіні <b class="num">${nf(nsh)}</b> з ${nf(M)} (${nf(r.sh*100, 0)} %)</span><span>зараз <b class="num">${nf(r.pc + r.wc)} кВт</b> ясно · ${nf(CUR.f*(r.pc + r.wc) + (1-CUR.f)*(r.po + r.wo))} кВт сер.</span>`; }
  else h += `<span class="busy">рахую тіні…</span>`;
  now.innerHTML = h;
  const s0 = CUR.steps[0], s1 = CUR.steps[CUR.steps.length-1], sh = shift();
  $('#sunx').innerHTML = `висота <b>${nf(st.el*R2D, 1)}°</b> · азимут <b>${nf(az, 0)}°</b> · схід ${hhmm(s0.h - DT/2 + sh)} · захід ${hhmm(s1.h + DT/2 + sh)}`; }
function setStep(i, fromUser){ if(!CUR) return; const lo = CUR.steps[0].i, hi = CUR.steps[CUR.steps.length-1].i; STEP = Math.max(lo, Math.min(hi, i)); timeEl.value = STEP;
  const j = CUR.byI.get(STEP); if(!CUR.cnt[j]) dayStep(CUR, j);
  $('#clock').textContent = hhmm((STEP + 0.5)*DT + shift()); placeSun(); readout(); if(MODE === 'now') recolor(); drawDayMarker(); }
timeEl.addEventListener('input', () => { stopPlay(); setStep(+timeEl.value, true); });
let playT = null, SPD = 1; const SPDS = [1, 2, 4, 8];
function tick(){ const hi = CUR.steps[CUR.steps.length-1].i; if(STEP >= hi){ setStep(CUR.steps[0].i); return; } setStep(STEP + 1); }
function startPlay(){ clearInterval(playT); playT = setInterval(tick, Math.max(30, 170/SPD)); }
function stopPlay(){ if(playT){ clearInterval(playT); playT = null; } $('#play').textContent = '▶'; $('#play').setAttribute('aria-label', 'Запустити сонце'); $('#play').title = 'Запустити сонце'; }
$('#play').addEventListener('click', () => { if(playT){ stopPlay(); return; } $('#play').textContent = '❚❚'; $('#play').setAttribute('aria-label', 'Зупинити'); $('#play').title = 'Зупинити';
  if(STEP >= CUR.steps[CUR.steps.length-1].i) setStep(CUR.steps[0].i); startPlay(); });
$('#speed').addEventListener('click', () => { SPD = SPDS[(SPDS.indexOf(SPD) + 1) % SPDS.length]; $('#speed').textContent = '×' + SPD; if(playT) startPlay(); });
// date: season button cycles the four season days, ⋯ opens the date and the details
const dateEl = $('#date');
const SEAS3 = [['Зима', 12, 21], ['Весна', 3, 20], ['Літо', 6, 21], ['Осінь', 9, 23]];
const seasOf = m => m === 12 || m < 3 ? 0 : m < 6 ? 1 : m < 9 ? 2 : 3;
function syncDateUI(){ const {y, m, d} = DATE; dateEl.value = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; $('#season').textContent = SEAS3[seasOf(m)][0];
  $$('#dates button').forEach(b => { const k = b.dataset.d; let on; if(k === 'now') on = m === NOW.m && d === NOW.d && y === NOW.y; else { const [bm, bd] = k.split('-').map(Number); on = bm === m && bd === d; } b.setAttribute('aria-pressed', String(on)); }); }
function setDate(y, m, d){ DATE = {y, m, d}; syncDateUI(); loadDay(); }
$$('#dates button').forEach(b => b.addEventListener('click', () => { const k = b.dataset.d; if(k === 'now') setDate(NOW.y, NOW.m, NOW.d); else { const [m, d] = k.split('-').map(Number); setDate(DATE.y, m, d); } }));
$('#season').addEventListener('click', () => { const k = (seasOf(DATE.m) + 1) % 4; setDate(DATE.y, SEAS3[k][1], SEAS3[k][2]); });
dateEl.addEventListener('change', () => { const v = dateEl.value.split('-').map(Number); if(v.length === 3 && v[0]) setDate(v[0], v[1], v[2]); });
$('#sunmore').addEventListener('click', () => { const m = $('#more'), o = m.hidden; m.hidden = !o; $('#sunmore').setAttribute('aria-expanded', String(o)); });
function drawSunPath(D){ if(sunPath){ G.sunG.remove(sunPath); sunPath.geometry.dispose(); }
  const pts = D.steps.map(st => CEN.clone().addScaledVector(new THREE.Vector3(st.s[0], st.s[2], -st.s[1]).normalize(), SUN_R));
  sunPath = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({color: 0xd08a1a, dashSize: 4, gapSize: 3})); sunPath.computeLineDistances(); G.sunG.add(sunPath); }
// day computation in chunks
let dayJob = 0;
function loadDay(){
  stopPlay(); const job = ++dayJob, D = dayInit(VAR, curDoy(), DATE.m - 1); CUR = D;
  timeEl.min = D.steps[0].i; timeEl.max = D.steps[D.steps.length-1].i;
  let st = STEP; if(st === null){ const k = Math.round((NOW.t - shift())/DT - 0.5); st = (k >= D.steps[0].i && k <= D.steps[D.steps.length-1].i) ? k : Math.round((12.5 - shift())/DT - 0.5); }
  drawSunPath(D);
  setStep(st);
  const prog = $('#day-prog'), bar = prog.firstElementChild;
  function chunk(){ if(job !== dayJob) return; const t0 = performance.now();
    for(let j = 0; j < D.steps.length && performance.now() - t0 < 32; j++) if(!D.cnt[j]) dayStep(D, j);
    const pct = D.done/D.steps.length; prog.hidden = pct >= 1; bar.style.width = (pct*100).toFixed(0) + '%';
    if(D.done < D.steps.length){ setTimeout(chunk, 0); } else { renderDay(); readout(); } }
  renderDayHead(); chunk();
}

// ---------- Доба
const MON_G = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
let dayCh = null;
function renderDayHead(){ $('#day-h').textContent = `${DATE.d} ${MON_G[DATE.m-1]} · варіант ${VN[VAR]}`;
  const D = CUR, s0 = D.steps[0], s1 = D.steps[D.steps.length-1], sh = shift();
  $('#day-sub').textContent = `Схід ≈ ${hhmm(s0.h - DT/2 + sh)}, захід ≈ ${hhmm(s1.h + DT/2 + sh)}, сонце в зеніті о ${hhmm(12 + sh)} · київський час${isDST(DATE.y, DATE.m, DATE.d) ? ' (літній)' : ''}. Середня погода: ясно ${nf(D.f*100)} % часу.`;
  $('#day-stats').innerHTML = '<div class="stat"><div class="v">…</div><div class="k">рахую тіні по 10 хв</div></div>'; $('#day-chart').innerHTML = ''; $('#day-shade').innerHTML = ''; dayCh = null; $('#day-lg').innerHTML = ''; }
function renderDay(){
  const D = CUR; if(D.done < D.steps.length) return; const sh = shift(), xs = D.steps.map(s => s.h + sh);
  const clr = D.res.map(r => r.pc + r.wc), avg = D.res.map(r => D.f*(r.pc + r.wc) + (1-D.f)*(r.po + r.wo));
  const eC = clr.reduce((a, b) => a + b, 0)*DT/1000, eA = avg.reduce((a, b) => a + b, 0)*DT/1000;
  // what the shading takes: same day without shading
  const E = engine(VAR); let un = 0; D.steps.forEach(st => { const ta = (T_MAX[D.mo] + T_MIN[D.mo])/2 + (T_MAX[D.mo] - T_MIN[D.mo])/2*Math.cos(2*Math.PI*(st.h - 15)/24); un += power(E, new Uint8Array(E.M), st.s, st.dni, st.dhi, ta).pc; });
  const shopC = D.res.reduce((a, r) => a + r.pc, 0), loss = un > 0 ? (1 - shopC/un)*100 : 0, peak = Math.max(...clr);
  $('#day-stats').innerHTML = `<div class="stat"><div class="v num">${nf(eA, 2)}</div><div class="k">МВт·год за добу, середня погода</div></div><div class="stat"><div class="v num">${nf(eC, 2)}</div><div class="k">МВт·год, якщо весь день ясно</div></div><div class="stat"><div class="v num">−${nf(loss, 1)} %</div><div class="k">забирає тінь на даху цеху (ясний день)</div></div>`;
  const c1 = css('--s1'), c2 = css('--s2');
  $('#day-lg').innerHTML = `<span><i style="background:${c1}"></i>ясне небо, пік ${nf(peak)} кВт</span><span><i style="background:${c2}"></i>середня погода</span>`;
  dayCh = lineChart($('#day-chart'), {x0: 4, x1: 22, series: [{name: 'ясно', color: c1, x: xs, y: clr}, {name: 'середня', color: c2, x: xs, y: avg, area: true}], tfmt: v => nf(v) + ' кВт', label: 'Потужність за годинами'});
  lineChart($('#day-shade'), {x0: 4, x1: 22, h: 120, ymax: 100, series: [{name: 'у тіні', color: css('--ink-3'), x: xs, y: D.res.map(r => r.sh*100), bars: true, bw: DT}], yfmt: v => nf(v) + ' %', tfmt: v => nf(v, 0) + ' %', label: 'Частка модулів у тіні'});
  drawDayMarker();
}
function drawDayMarker(){ if(dayCh && STEP !== null) dayCh.marker((STEP + 0.5)*DT + shift()); }


// ================= sheet, tabs, legend toggle
const SHEETS = ['peek', 'half', 'full'];
let sheetS = SHEETS.includes(store.get('sheet')) ? store.get('sheet') : (matchMedia('(max-width: 700px)').matches ? 'peek' : 'half');
function sheetSet(st){ sheetS = st; $('#sheet').dataset.s = st; store.set('sheet', st); }
{ const g = $('#grab'); let y0 = null, moved = false;
  g.addEventListener('pointerdown', e => { y0 = e.clientY; moved = false; try{ g.setPointerCapture(e.pointerId); }catch(x){} });
  g.addEventListener('pointermove', e => { if(y0 !== null && Math.abs(e.clientY - y0) > 14) moved = true; });
  g.addEventListener('pointerup', e => { if(y0 === null) return; const dy = e.clientY - y0, i = SHEETS.indexOf(sheetS); y0 = null;
    if(moved) sheetSet(SHEETS[Math.max(0, Math.min(2, i + (dy < 0 ? 1 : -1)))]); else sheetSet(SHEETS[(i + 1) % 3]); });
  g.addEventListener('pointercancel', () => { y0 = null; }); }
$$('.tabs button').forEach(b => b.addEventListener('click', () => { $$('.tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b))); $$('.pane').forEach(p => p.hidden = p.dataset.p !== b.dataset.t); store.set('tab', b.dataset.t); $('#panes').scrollTop = 0; if(sheetS === 'peek') sheetSet('half'); }));
{ const t = store.get('tab'); const b = t && document.querySelector(`.tabs [data-t="${t}"]`); const s0 = sheetS; if(b) b.click(); sheetSet(s0); }
let ctxOpen = store.get('ctx') !== '0';
function ctxSet(o){ ctxOpen = o; $('#ctx').hidden = !o; const b = $('#ctxtoggle'); b.textContent = o ? '▴' : '▾'; b.setAttribute('aria-expanded', String(o)); b.title = o ? 'Сховати колір і легенду' : 'Показати колір і легенду'; b.setAttribute('aria-label', b.title); store.set('ctx', o ? '1' : '0'); hudShift(); }
$('#ctxtoggle').addEventListener('click', () => ctxSet(!ctxOpen));
sheetSet(sheetS); resize(); ctxSet(ctxOpen); goView('iso', true); themeScene();
syncDateUI();
setVar(VAR);
loop();
$('#loading').hidden = true;
window.__m3d = {pickAt, daySync, DATA, seasonSeries, engine, shadeCounts, setDate, setStep, setView, setVar, camera, controls, req, setMode: m => { const b = document.querySelector(`#modes [data-m="${m}"]`); if(b) b.click(); }};
})();
