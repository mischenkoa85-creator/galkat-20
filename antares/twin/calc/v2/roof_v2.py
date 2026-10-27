# -*- coding: utf-8 -*-
"""Дах цеху Антарес за кресленням замовника (розріз 1-1, 27.10.2026): розкладка модулів на гранях і тіні.
Профіль — v2/profile.csv (грані по ≈3 м, ендови +15,90, ліхтарі 2,87 м зміщені від осі прольоту). Висоти — від ±0,000.
Модулі лежать на гранях паралельно (не через злам): довгою стороною вздовж будівлі (Y), по 2 поперек грані з зазором 20 мм,
відступ 0,12 м від зламу грані; уздовж Y — крок 2 406 мм (ZNSHINE), 3 блоки по 12 рядів з проходами, як у розкладці 25.10.
Тіні — цифрова модель висот 0,25 м: західна будівля (+6,8 м над покрівлею біля стіни, за фото), парапети (торці +1,2 м, схід +0,5 м),
двосхилі ліхтарі (гребінь +LH над основою — оцінка за фото, креслення показує лише плиту), рама кондиціонерів, сходи, усі грані даху.
Генерація — модель двійника (Meteonorm 8.1, ясні/хмарні дні, крок 10 хв), 3 точки на модуль уздовж Y, горизонт 72 напрями."""
import json, math, sys, csv, numpy as np
D = 'calc/'; TW = 'src/'
LH = float(sys.argv[1]) if len(sys.argv) > 1 else 1.5          # висота гребеня ліхтаря над його основою, м (оцінка)
LCX = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25        # відступ модуля від основи ліхтаря поперек (X), м
WX = json.load(open(TW + 'wx.json'))
dj = open(TW + 'data.js', encoding='utf-8').read(); S = json.loads(dj[dj.find('{'):dj.rfind('}') + 1])['site']
b = open(TW + 'bess.js', encoding='utf-8').read(); BE = json.loads(b[b.find('{'):b.rfind('}') + 1])
f = lambda s: float(s.replace(',', '.'))
PR = [dict(sp=r[0], x0=f(r[1]), x1=f(r[2]), z0=f(r[3]), z1=f(r[4]), what=r[7]) for r in list(csv.reader(open(D + 'v2/profile.csv', encoding='utf-8'), delimiter=';'))[1:]]
XP = np.array(sum(([p['x0'], p['x1']] for p in PR), [])); ZP = np.array(sum(([p['z0'], p['z1']] for p in PR), []))
roofZ = lambda x: np.interp(x, XP, ZP)                           # покрівля по X (ліхтарі — плита на розрізі)
LANX = [(p['x0'], p['x1']) for p in PR if p['what'].startswith('ліхтар')]
LANY = [(l[2], l[3]) for l in S['lan']]                          # уздовж будівлі — з моделі 25.10 (креслення РП)
LAN = [dict(x0=a, x1=b_, y0=c, y1=d, zb=max(float(roofZ(a)), float(roofZ(b_)))) for (a, b_), (c, d) in zip(LANX, LANY)]
X0, X1, Y0, Y1 = -0.58, 96.8, -0.25, 96.34                       # покрівля між стінами й торцевими парапетами
# ---------- DSM
R = 0.25; GX0, GY0 = -45.0, -45.0
gx = np.arange(GX0 + R / 2, 165, R); gy = np.arange(GY0 + R / 2, 150, R); XX, YY = np.meshgrid(gx, gy)
H = np.zeros_like(XX, dtype=np.float32)
def put(m, v): H[m] = np.maximum(H[m], (v[m] if np.ndim(v) else v))
box = lambda x0, x1, y0, y1: (XX >= x0) & (XX <= x1) & (YY >= y0) & (YY <= y1)
RZ = roofZ(XX).astype(np.float32)
put(box(X0, X1, -0.5, 96.59), RZ)
put(box(X0, X1, -0.5, -0.25), RZ + 1.2); put(box(X0, X1, 96.34, 96.59), RZ + 1.2)        # торцеві парапети
put(box(96.49, 96.8, -0.5, 96.59), np.float32(16.06 + 0.5))                               # схід: ≈0,5 м (фото)
put(box(-12.58, -0.58, -0.5, 96.59), np.float32(15.9 + 6.8))                              # західна будівля (фото)
H0 = H.copy()
def lanterns(h):
    for L in LAN:
        m = box(L['x0'], L['x1'], L['y0'], L['y1']); xc = (L['x0'] + L['x1']) / 2; hw = (L['x1'] - L['x0']) / 2
        H[m] = np.maximum(RZ[m], L['zb'] + h * (1 - np.abs(XX[m] - xc) / hw))
lanterns(LH)
put(box(61.45, 62.95, 7, 19), np.float32(float(roofZ(62.2)) + 2.15))                    # рама 11 кондиціонерів (фото)
for x0, x1, y0, y1, h in [(58.4, 65.6, -2.45, -0.5, 15.9 + 3.9), (-0.5, 19.5, 96.6, 107.1, 4.5), (96.8, 103.0, -0.4, 34.6, 4.5), (110, 124, -5, 26, 13.2),
                          (66.0, 71.0, -2.7, -0.95, 2.4), (55.9, 58.35, -3.2, -0.75, 2.6)]:
    put(box(x0, x1, y0, y1), np.float32(h))
for k in BE['K']: put(box(k['box'][0], k['box'][1], k['box'][2], k['box'][3]), np.float32(3.2))
def Hat(x, y):
    ix = np.clip(((x - GX0) / R).astype(np.int32), 0, len(gx) - 1); iy = np.clip(((y - GY0) / R).astype(np.int32), 0, len(gy) - 1); return H[iy, ix]
# ---------- кандидати модулів на гранях
LM, DM, GAP, MRG = 2.384, 1.303, 0.022, 0.12
FAC = [p for p in PR if p['what'].startswith('грань') or p['what'].startswith('ліхтар')]
ROWS = [3.482 + 2.406 * k for k in range(12)] + [34.845 + 2.406 * k for k in range(12)] + [66.208 + 2.406 * k for k in range(12)]
ZONES = [dict(k='ac', n='рама кондиціонерів + 1 м, прохід від виходу, труби', x=(60.1, 65.5), y=(2.0, 20.5)),
         dict(k='portal', n='стійки порталу + 0,3 м', x=(57.6, 60.9), y=(0.3, 3.0)),
         dict(k='door', n='прохід від дверей західної будівлі', x=(-0.6, 1.6), y=(85.0, 88.0))]
ov = lambda a0, a1, b0, b1: a0 < b1 and b0 < a1
cand = []
for fi, p in enumerate(FAC):
    dx, dz = p['x1'] - p['x0'], p['z1'] - p['z0']; Ls = math.hypot(dx, dz); c, s = dx / Ls, dz / Ls; k = dz / dx
    n = int((Ls - 2 * MRG + GAP) // (DM + GAP)); used = n * DM + (n - 1) * GAP; st = (Ls - used) / 2
    crest = p['what'].startswith('ліхтар')
    for j in range(n):
        u0 = st + j * (DM + GAP); u1 = u0 + DM; xa, xb = p['x0'] + u0 * c, p['x0'] + u1 * c; um = (u0 + u1) / 2
        xm, zm = p['x0'] + um * c, p['z0'] + um * s
        for y in ROWS:
            ya, yb = y - LM / 2, y + LM / 2; why = None
            for L in LAN:
                if ov(xa, xb, L['x0'] - LCX, L['x1'] + LCX) and ov(ya, yb, L['y0'] - 0.5, L['y1'] + 0.5): why = 'lan'
            if not why:
                why = next((z['k'] for z in ZONES if ov(xa, xb, *z['x']) and ov(ya, yb, *z['y'])), None)
            cand.append(dict(f=fi, sp=p['sp'], j=j, xa=round(xa, 3), xb=round(xb, 3), xm=round(xm, 3), zm=round(zm, 3), y=round(y, 3), k=k,
                             tilt=round(math.degrees(math.atan(abs(k))), 1), face='W' if k > 0 else 'E', crest=crest, why=why))
C = [c_ for c_ in cand if c_['why'] is None]
print('facets', len(FAC), 'columns', sum(1 for c_ in cand if c_['y'] == ROWS[0]), 'cand', len(cand), 'free', len(C),
      'lan', sum(1 for c_ in cand if c_['why'] == 'lan'), {z['k']: sum(1 for c_ in cand if c_['why'] == z['k']) for z in ZONES})
# ---------- горизонт і генерація
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA; ALB = 0.2
LOSS = (1 - .025) * (1 - .015) * (1 - .01) * (1 - .035) * (1 - .03) * (1 - .015) * (1 - .01); GAMT = -0.003; PW, ETA = 0.730, 0.235
def energy(P, NRM, U, k=3):
    HOR = np.zeros((len(P), NA), np.float32)
    for b0 in range(0, len(P), 600):
        p = P[b0:b0 + 600]
        for a in range(NA):
            X = p[:, 0:1] + math.sin(AZ[a]) * DS[None, :]; Y = p[:, 1:2] + math.cos(AZ[a]) * DS[None, :]
            HOR[b0:b0 + len(p), a] = np.maximum(np.arctan2(Hat(X, Y) - p[:, 2:3], DS[None, :]).max(axis=1), 0)
    N3 = np.repeat(NRM, k, axis=0); SVF = np.zeros(len(P)); SVF0 = np.zeros(len(P))
    for a in range(NA):
        for e in EL:
            v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); cc = N3 @ v
            w = np.where(cc > 0, cc, 0) * math.cos(e) * dEl * dAz / math.pi; SVF0 += w; SVF += w * (e > HOR[:, a])
    SVFm = SVF.reshape(-1, k).mean(1); SVF0m = SVF0.reshape(-1, k).mean(1)
    modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS, 0)
    E = np.zeros(len(NRM)); Eun = np.zeros(len(NRM)); Emo = np.zeros((12, len(NRM)))
    for mo, Wm in enumerate(WX['mo']):
        wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
        for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
            dv = np.array([ex, ey, sz]); cosb = np.maximum(NRM @ dv, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
            az = math.atan2(ex, ey); el = math.asin(max(-1, min(1, sz))); fa = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(fa) % NA; a1 = (a0 + 1) % NA; t = fa - int(fa)
            lit = (el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t).reshape(-1, k).mean(1)
            beam = Dn * cosb + Dd * Ai * cosb / cz; gr = Gh * ALB * (1 - NRM[:, 2]) / 2; Go = c_ * Gh
            pc = beam * lit + Dd * (1 - Ai) * SVFm + gr; po = Go * SVFm + Go * ALB * (1 - NRM[:, 2]) / 2
            uc = beam + Dd * (1 - Ai) * SVF0m + gr; uo = Go * SVF0m + Go * ALB * (1 - NRM[:, 2]) / 2
            e = wt * (p_ * modP(pc, ta) + (1 - p_) * modP(po, ta)); E += e; Emo[mo] += e; Eun += wt * (p_ * modP(uc, ta) + (1 - p_) * modP(uo, ta))
    return E, Eun, Emo
P = []; N = []
for c_ in C:
    nv = np.array([-c_['k'], 0, 1.0]); nv /= np.linalg.norm(nv); N.append(nv)
    for t in (-0.892, 0.0, 0.888): P.append((c_['xm'], c_['y'] + t, c_['zm'] + 0.12 + 0.033 + 0.03))
E, Eun, Emo = energy(np.array(P), np.array(N), 20)
for c_, e, u in zip(C, E, Eun): c_['kwh'] = round(float(e), 1); c_['loss'] = round(float(1 - e / u) * 100, 2)
json.dump(dict(LH=LH, LAN=LAN, ZONES=ZONES, ROWS=ROWS, FAC=FAC, cand=cand, mo=[round(float(x) / 1000, 2) for x in Emo.sum(1)]), open(D + f'v2/roof_v2_{LH:.1f}_{LCX:.2f}.json', 'w'), ensure_ascii=False)
for thr in (5, 10, 15, 20, 100):
    sel = [c_ for c_ in C if c_['loss'] <= thr]; n_ = len(sel); e_ = sum(c_['kwh'] for c_ in sel)
    print(f'LH {LH} thr {thr}%: {n_} ({n_ // 11}×11+{n_ % 11}) {n_ * 0.73:.1f} kWp {e_ / 1000:.1f} MWh {e_ / n_ / 0.73:.0f} kWh/kWp')
