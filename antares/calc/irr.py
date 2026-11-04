# -*- coding: utf-8 -*-
"""Річна сонячна радіація на кожен м² — дах цеху, дах складу, фасади цеху (Пд, Сх, Пн). Антарес, 26.10.2026.
Клімат — як у двійнику (wx.json: Meteonorm 8.1 з PVsyst РП, ясні + хмарні дні під місячні суми, крок 10 хв).
Модель на площині — як у двійнику (b_final/gen.py): пряма + навколосонячна (Hay) у тіні гасне; ізотропна розсіяна × частка видимого неба;
відбита від землі, альбедо 0,2. Тіні: цифрова модель висот 0,25 м (будівлі, парапети, ліхтарі, перешкоди, ТП, адмінкорпус, контейнери УЗЕ…),
горизонт для кожної точки — 72 напрями по 5°. Осі двійника: X — на азимут 94°, Y — на 4°."""
import json, math, numpy as np, time
T0 = time.time()
TW = '/home/claude/work/twin/'
WX = json.load(open(TW + 'wx.json'))
d = open(TW + 'data.js', encoding='utf-8').read(); D = json.loads(d[d.find('{'):d.rfind('}') + 1]); S = D['site']
b = open(TW + 'bess.js', encoding='utf-8').read(); B = json.loads(b[b.find('{'):b.rfind('}') + 1])
HV, HE, FL, SPANS = S['HV'], S['HE'], S['FL'], S['spans']
PROF = S.get('prof')   # розріз 1-1 (DWG замовника, 27.10): грані [x0, x1, z0, z1]
def arch(X):
    if PROF:
        X = np.clip(np.asarray(X, float), PROF[0][0], PROF[-1][1]); z = np.zeros_like(X); k = np.zeros_like(X)
        for x0, x1, z0, z1 in PROF[::-1]:
            m = (X >= x0 - 1e-9) & (X <= x1 + 1e-9); kk = (z1 - z0) / max(1e-6, x1 - x0); z = np.where(m, z0 + kk * (X - x0) - HV, z); k = np.where(m, kk, k)
        return z, k
    X = np.clip(np.asarray(X, float), 0, 96); z = np.zeros_like(X); k = np.zeros_like(X)
    for s0, s1, r in SPANS:
        m = (X >= s0 - 1e-9) & (X <= s1 + 1e-9); c = (s0 + s1) / 2; h = (s1 - s0) / 2 - FL; dd = X - c; inn = m & (np.abs(dd) < h)
        z = np.where(inn, r * (1 - dd * dd / h / h), z); k = np.where(inn, -2 * r * dd / h / h, k)
    return z, k
roofZ = lambda X: HV + arch(X)[0]
T11, T17, T22 = (math.tan(math.radians(a)) for a in (11, 17, 22))
POLY = {'A': [[54.98, -25.08], [66.55, -25.03], [70.82, -24.51], [73.5, -24.51], [73.5, -15.5], [53.75, -18.65]],
        'B': [[73.5, -24.5], [98.1, -24.5], [98.1, -12.5], [92.4, -12.5], [73.5, -15.5]],
        'C1': [[98.1, -24.5], [146.1, -24.5], [146.1, -6.5], [98.1, -6.5]], 'C2': [[146.1, -24.5], [155.1, -24.5], [155.1, -6.5], [146.1, -6.5]]}
WHF = {'A': lambda X, Y: HE + (Y + 25.05) * T11, 'B': lambda X, Y: HE + (Y + 24.5) * T11,
       'C1': lambda X, Y: HE + (9 - np.abs(Y + 15.5)) * T22, 'C2': lambda X, Y: HE + (9 - np.abs(Y + 15.5)) * T17}
def inpoly(P, x, y):
    c = np.zeros(np.broadcast(x, y).shape, bool); n = len(P)
    for i in range(n):
        a, bb = P[i], P[i - 1]
        cond = ((a[1] > y) != (bb[1] > y)) & (x < (bb[0] - a[0]) * (y - a[1]) / ((bb[1] - a[1]) or 1e-12) + a[0]); c ^= cond
    return c
# ---------- цифрова модель висот (DSM), 0,25 м
R = 0.25; GX0, GX1, GY0, GY1 = -45.0, 165.0, -45.0, 150.0
gx = np.arange(GX0 + R / 2, GX1, R); gy = np.arange(GY0 + R / 2, GY1, R); XX, YY = np.meshgrid(gx, gy)   # [iy, ix]
H = np.zeros_like(XX, dtype=np.float32)
def put(mask, val): H[mask] = np.maximum(H[mask], val[mask] if hasattr(val, 'shape') and np.ndim(val) else val)
def boxm(x0, x1, y0, y1): return (XX >= x0) & (XX <= x1) & (YY >= y0) & (YY <= y1)
for k, P in POLY.items():
    m = inpoly(P, XX, YY); put(m, WHF[k](XX, YY).astype(np.float32))
shop = boxm(-0.15, 96.64, -0.5, 96.59); RZ = roofZ(XX).astype(np.float32); put(shop, RZ)
put(boxm(-0.15, 96.64, -0.5, -0.25), RZ + 1.2); put(boxm(-0.15, 96.64, 96.34, 96.59), RZ + 1.2); ZE = float(roofZ(96.64)) + 0.5 if PROF else HV + 0.5; put(boxm(96.39, 96.64, -0.5, 96.59), ZE)
for l in S['lan']:
    if PROF:   # двосхилий ліхтар (РП 3,40 × 1,74, центри — розріз 1-1)
        zb = max(float(roofZ(l[0])), float(roofZ(l[1]))); xc = (l[0] + l[1]) / 2; hw = (l[1] - l[0]) / 2; m = boxm(l[0], l[1], l[2], l[3]); put(m, (zb + l[4] * (1 - np.abs(XX - xc) / hw)).astype(np.float32))
    else: put(boxm(l[0], l[1], l[2], l[3]), HV + l[4])
for o in ([] if PROF else S['obs']):   # вентиляцію з даху прибрано (26.10)
    m = (XX - o[0]) ** 2 + (YY - o[1]) ** 2 <= (o[2] / 2 + 0.05) ** 2; put(m, float(roofZ(o[0])) + o[3])
AC = S.get('ac')
if AC: put(boxm(AC['x0'], AC['x1'], AC['y0'], AC['y1']), max(float(roofZ(AC['x0'])), float(roofZ(AC['x1']))) + AC['h'])   # рама кондиціонерів 14,5 × 2,4 × 2,2 (27.10)
else: put(boxm(61.45, 62.95, 7, 19), float(roofZ(62.2)) + 2.15)
OBJ = [  # x0,x1,y0,y1,h — будівлі й предмети за фото/двійником
    (-12.15, -0.15, -0.5, 96.59, HV + 6.8, 'західна будівля'), (-0.5, 19.5, 96.6, 107.1, 4.5, 'ТП-6923'), (19.5, 24.2, 96.6, 99.4, 3.5, 'прибудова'),
    (96.64, 103.0, -0.4, 34.6, 4.5, 'ТП-5913'), (108.3, 127.5, 6.6, 20.3, 10.5, 'адмінкорпус, південний блок (3 пов.) з парапетом'), (116.3, 121.5, 8.0, 17.8, 12.6, 'надбудова сходів на АБК'),
    (58.4, 65.6, -2.45, -0.5, 19.8 if PROF else 17.7, 'сходи'),
    (66.0, 71.0, -2.7, -0.95, 2.4, 'ДГУ'), (55.9, 58.35, -3.2, -0.75, 2.6, 'контейнер'), (42.6, 46.6, -3.3, -0.9, 2.6, 'побутівка'),
    (30.7, 38.6, -1.45, -1.05, 0.85, 'кондиціонери'), (25.6, 31.4, 96.59, 98.2, 4.6, 'тамбур Пн'), (79.5, 85.5, -2.3, -0.5, 3.7, 'тамбур Пд'),
    (96.85, 99.15, 35.2, 37.6, 2.5, 'шафа'), (105.9, 108.3, 8.65, 11.85, 3.0, 'вхід адмінкорпусу')]
for k in B['K']: OBJ.append((k['box'][0], k['box'][1], k['box'][2], k['box'][3], 3.2, k['id']))
for x0, x1, y0, y1, h, _ in OBJ: put(boxm(x0, x1, y0, y1), h)
# адмінкорпус, основний блок (4 пов.): план — супутник Google 27.10 (±0,5 м); дах арковий уздовж Пн–Пд (фото 27.10);
# карниз 13,2 м і стріла 1,3 м — оцінка (виміряти); парапети: захід 0,5, схід 0,7, торці — по арці +0,5 (оцінка)
ABK = dict(x0=108.5, x1=128.0, y0=20.3, y1=45.2, h=13.2, f=1.3)
ABKZ = lambda X: ABK['h'] + ABK['f'] * np.clip(1 - ((X - (ABK['x0'] + ABK['x1']) / 2) / ((ABK['x1'] - ABK['x0']) / 2)) ** 2, 0, 1)
put(boxm(ABK['x0'], ABK['x1'], ABK['y0'], ABK['y1']), ABKZ(XX).astype(np.float32))
put(boxm(ABK['x0'], ABK['x0'] + 0.25, ABK['y0'], ABK['y1']), ABK['h'] + 0.5); put(boxm(ABK['x1'] - 0.25, ABK['x1'], ABK['y0'], ABK['y1']), ABK['h'] + 0.7)
for ya, yb in ((ABK['y0'], ABK['y0'] + 0.25), (ABK['y1'] - 0.25, ABK['y1'])): put(boxm(ABK['x0'], ABK['x1'], ya, yb), (ABKZ(XX) + 0.5).astype(np.float32))
print('DSM', H.shape, round(time.time() - T0, 1), 's')
def Hat(x, y):
    ix = np.clip(((x - GX0) / R).astype(np.int32), 0, len(gx) - 1); iy = np.clip(((y - GY0) / R).astype(np.int32), 0, len(gy) - 1); return H[iy, ix]
# ---------- точки (центри квадратів 1 × 1 м)
PTS = []   # (surface, i, j, x, y, z, nx, ny, nz, s, h)
xs = np.arange(-0.15 + 0.5, 96.64, 1.0); ys = np.arange(-0.5 + 0.5, 96.59, 1.0)
def zr(x): return float(roofZ(x))
for j, y in enumerate(ys):
    for i, x in enumerate(xs):
        z, k = arch(x); k = float(k); n = np.array([-k, 0, 1]) / math.hypot(k, 1)
        PTS.append(('roof', i, j, x, y, HV + float(z) + 0.15, *n, x, y))
for wnm, (sx, sy, nrm, base) in {'S': ('x', -0.5 - 0.3, (0, -1, 0), None), 'N': ('x', 96.59 + 0.3, (0, 1, 0), None)}.items():
    for i, x in enumerate(xs):
        top = zr(x) + 1.2
        for j, h in enumerate(np.arange(0.5, top, 1.0)): PTS.append((wnm, i, j, x, sy, h, *nrm, x, h))
for i, y in enumerate(ys):
    for j, h in enumerate(np.arange(0.5, ZE, 1.0)): PTS.append(('E', i, j, 96.64 + 0.3, y, h, 1, 0, 0, y, h))
for k in ('A', 'B', 'C1'):
    P = np.array(POLY[k]); x0, x1, y0, y1 = P[:, 0].min(), P[:, 0].max(), P[:, 1].min(), P[:, 1].max()
    for y in np.arange(y0 + 0.5, y1, 1.0):
        for x in np.arange(x0 + 0.5, x1, 1.0):
            if not inpoly(POLY[k], np.array(x), np.array(y)): continue
            z = float(WHF[k](x, y))
            if k in ('A', 'B'): n = np.array([0, -T11, 1]) / math.hypot(T11, 1)
            else: s = 1 if y > -15.5 else -1; n = np.array([0, s * T22, 1]) / math.hypot(T22, 1)
            PTS.append(('wh' + k, int(round(x - x0 - 0.5)), int(round(y - y0 - 0.5)), x, y, z + 0.15, *n, x, y))
NP = len(PTS); print('points', NP)
P = np.array([p[3:9] for p in PTS], dtype=np.float64)
# точка закрита (всередині будівлі / під перешкодою)
cover = Hat(P[:, 0], P[:, 1]) > P[:, 2] + 0.05
# ---------- горизонт: 72 напрями (азимут у системі двійника: 0 — +Y, 90 — +X)
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
HOR = np.zeros((NP, NA), np.float32)
for b0 in range(0, NP, 400):
    p = P[b0:b0 + 400]; nb = len(p)
    for a in range(NA):
        sx, sy = math.sin(AZ[a]), math.cos(AZ[a])
        X = p[:, 0:1] + sx * DS[None, :]; Y = p[:, 1:2] + sy * DS[None, :]
        e = np.arctan2(Hat(X, Y) - p[:, 2:3], DS[None, :]).max(axis=1)
        HOR[b0:b0 + nb, a] = np.maximum(e, 0)
print('horizon', round(time.time() - T0, 1), 's')
N = P[:, 3:6]
# ---------- частка видимого неба для ізотропної розсіяної (з урахуванням нахилу площини)
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA
SVF = np.zeros(NP); SVF0 = np.zeros(NP)
for a in range(NA):
    for e in EL:
        v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); c = N @ v
        w = np.where(c > 0, c, 0) * math.cos(e) * dEl * dAz / math.pi
        SVF0 += w; SVF += w * (e > HOR[:, a])
print('svf', round(time.time() - T0, 1), 's  horizontal check', round(float(SVF0[0]), 3))
# ---------- рік: 12 місяців × кроки 10 хв
def hor_at(az):   # горизонт у напрямі сонця (лінійна інтерполяція між 5°-секторами)
    f = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(f) % NA; a1 = (a0 + 1) % NA; t = f - int(f); return HOR[:, a0] * (1 - t) + HOR[:, a1] * t
ALB = 0.2
Esh = np.zeros(NP); Eun = np.zeros(NP); Emo = np.zeros((12, NP)); Ebeam = np.zeros(NP)
for m, W in enumerate(WX['mo']):
    wt = W['nd'] / 6 / 1000; p_, c_ = W['p'], W['c']   # Вт·10 хв → кВт·год
    for st in W['st']:
        h, ex, ey, sz, G, Dn, Dd, ext, ta = st
        dvec = np.array([ex, ey, sz]); cosb = np.maximum(N @ dvec, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
        az = math.atan2(ex, ey); el = math.asin(max(-1, min(1, sz))); vis = (el > hor_at(az)) & (cosb > 0)
        beam = Dn * cosb + Dd * Ai * cosb / cz; iso = Dd * (1 - Ai); gr = G * ALB * (1 - N[:, 2]) / 2
        clear_sh = beam * vis + iso * SVF + gr; clear_un = beam + iso * SVF0 + gr
        Go = c_ * G; ov_sh = Go * SVF + Go * ALB * (1 - N[:, 2]) / 2; ov_un = Go * SVF0 + Go * ALB * (1 - N[:, 2]) / 2
        e_sh = wt * (p_ * clear_sh + (1 - p_) * ov_sh); Esh += e_sh; Emo[m] += e_sh; Eun += wt * (p_ * clear_un + (1 - p_) * ov_un); Ebeam += wt * p_ * beam * vis
print('year', round(time.time() - T0, 1), 's')
# контроль: горизонтальна площина без перешкод = GHI Meteonorm
GH = [25.3, 40.8, 88.5, 128.0, 169.6, 185.7, 182.0, 151.7, 102.9, 61.0, 25.9, 19.0]
Nh = np.array([0, 0, 1.0]); tot = 0
for m, W in enumerate(WX['mo']):
    for st in W['st']:
        h, ex, ey, sz, G, Dn, Dd, ext, ta = st; tot += W['nd'] / 6 / 1000 * (W['p'] * G + (1 - W['p']) * W['c'] * G)
print('GHI check model', round(tot, 1), 'Meteonorm', sum(GH))
# ---------- результат
OUT = {'meta': {'ghi': round(tot, 1), 'date': '2026-10-26', 'note': 'кВт·год/м² за рік на площині поверхні (дах — по дузі арки, фасади — вертикально)'}, 'surf': {}}
for k in ['roof', 'S', 'N', 'E', 'whA', 'whB', 'whC1']:
    idx = [n for n, p in enumerate(PTS) if p[0] == k]
    OUT['surf'][k] = [[PTS[n][1], PTS[n][2], round(PTS[n][9], 2), round(PTS[n][10], 2), round(float(PTS[n][5]), 2), None if cover[n] else int(round(Esh[n])), int(round(Eun[n])), round(float(SVF[n]), 3)] for n in idx]
    v = np.array([Esh[n] for n in idx if not cover[n]])
    if len(v): print(k, 'cells', len(idx), 'free', len(v), 'mean', round(v.mean()), 'min', round(v.min()), 'max', round(v.max()), 'p10', round(np.percentile(v, 10)), 'p90', round(np.percentile(v, 90)))
OUT['mo'] = {k: [round(float(np.mean([Emo[m][n] for n, p in enumerate(PTS) if p[0] == k and not cover[n]])), 1) for m in range(12)] for k in ['roof', 'S', 'N', 'E', 'whA', 'whB', 'whC1']}
json.dump(OUT, open('/home/claude/work/sun/rad.json', 'w'), separators=(',', ':'), ensure_ascii=False)
np.savez_compressed('/home/claude/work/sun/rad_raw.npz', P=P, HOR=HOR, SVF=SVF, Esh=Esh, Eun=Eun, Emo=Emo, cover=cover, kind=np.array([p[0] for p in PTS]))
print('done', round(time.time() - T0, 1), 's')
