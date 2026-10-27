# -*- coding: utf-8 -*-
"""Дах цеху Антарес, v3 (27.10.2026, вечір): геометрія за усіма джерелами — розріз 1-1 (DWG), РП, супутник Google (знімок до 2026),
фото й заміри рулеткою 27.10. Що змінилося проти v2:
- ліхтарі за рулеткою: по низу 3,66 м (центри — з розрізу 1-1), гребінь 1,89 м над покрівлею; довжина — за РП (на супутнику збігається ±0,5 м);
- торцеві парапети 1,37 м (південний — рулетка в ендові; північний не міряли — прийнято як південний);
- дефлектори, «грибочки» й труби — за супутником + РП (defl_v3.json): 49 підтверджено, 8 малих труб з РП (уточнити), 5 не враховано;
- поворот будівлі: за супутником 3,8° за годинниковою стрілкою; у кліматі двійника (wx.json) вже закладено 4° — так і лишаємо;
- зони без модулів: ліхтар + 0,25 м, дефлектор + 0,3 м, воронка біля південного парапету (X ≈72) + 0,5 м, рама кондиціонерів + 1 м,
  вихід на дах і портал (X 62–70 — за фото й супутником, уточнити), прохід до рами, двері західної будівлі.
Модулі — ZNSHINE 2 384 × 1 303, довгою стороною вздовж будівлі, по гранях покрівлі (як v2), 3 блоки по 12 рядів з проходами.
Генерація — та сама модель двійника (Meteonorm 8.1, крок 10 хв, горизонт 72 напрями, DSM 0,25 м), U 20, втрати 13,2 %.
Результат: v3/roof_v3.json — кожне місце: генерація з тінню і без, кВт·год/м² на площину модуля, причина, якщо місце зайняте."""
import json, math, sys, csv, numpy as np
D = '/home/claude/work/sun/'; TW = '/home/claude/work/twin/'; V = D + 'v3/'
LH, LW = 1.89, 3.66                        # ліхтар: гребінь над покрівлею і ширина по низу (рулетка 27.10)
PAR = 1.37                                 # торцеві парапети (рулетка 27.10, південь)
ROT = 0.0                                  # wx.json уже в осях будівлі (вісь X = азимут 94°, prep_wx.py); супутник дає 3,8° — збігається
WX = json.load(open(TW + 'wx.json'))
dj = open(TW + 'data.js', encoding='utf-8').read(); S = json.loads(dj[dj.find('{'):dj.rfind('}') + 1])['site']
b = open(TW + 'bess.js', encoding='utf-8').read(); BE = json.loads(b[b.find('{'):b.rfind('}') + 1])
import os
NODEFL = os.environ.get('NODEFL') == '1'                    # варіант для порівняння: дефлекторів немає (як у v2)
DF = [] if NODEFL else [o for o in json.load(open(V + 'defl_v3.json')) if o['st'] in ('є', 'уточнити')]
f = lambda s: float(s.replace(',', '.'))
PR = [dict(sp=r[0], x0=f(r[1]), x1=f(r[2]), z0=f(r[3]), z1=f(r[4]), what=r[7]) for r in list(csv.reader(open(V + 'profile.csv', encoding='utf-8'), delimiter=';'))[1:]]
XP = np.array(sum(([p['x0'], p['x1']] for p in PR), [])); ZP = np.array(sum(([p['z0'], p['z1']] for p in PR), []))
roofZ = lambda x: np.interp(x, XP, ZP)
LANC = [(p['x0'] + p['x1']) / 2 for p in PR if p['what'].startswith('ліхтар')]
LANY = [(l[2], l[3]) for l in S['lan']]
LAN = []
for xc, (y0, y1) in zip(LANC, LANY):
    x0, x1 = xc - LW / 2, xc + LW / 2; LAN.append(dict(x0=x0, x1=x1, xc=xc, y0=y0, y1=y1, zb=max(float(roofZ(x0)), float(roofZ(x1))), h=LH))
X0, X1, Y0, Y1 = -0.58, 96.8, -0.25, 96.34
# ---------- DSM 0,25 м
R = 0.25; GX0, GY0 = -45.0, -45.0
gx = np.arange(GX0 + R / 2, 165, R); gy = np.arange(GY0 + R / 2, 150, R); XX, YY = np.meshgrid(gx, gy)
H = np.zeros_like(XX, dtype=np.float32)
def put(m, v): H[m] = np.maximum(H[m], (v[m] if np.ndim(v) else v))
box = lambda x0, x1, y0, y1: (XX >= x0) & (XX <= x1) & (YY >= y0) & (YY <= y1)
RZ = roofZ(XX).astype(np.float32)
put(box(X0, X1, -0.5, 96.59), RZ)
put(box(X0, X1, -0.5, -0.25), RZ + PAR); put(box(X0, X1, 96.34, 96.59), RZ + PAR)          # торцеві парапети
put(box(96.49, 96.8, -0.5, 96.59), np.float32(16.06 + 0.5))                                   # схід ≈0,5 м
put(box(-12.58, -0.58, -0.5, 96.59), np.float32(15.9 + 6.8))                                  # західна будівля
for L in LAN:
    m = box(L['x0'], L['x1'], L['y0'], L['y1'])
    H[m] = np.maximum(RZ[m], L['zb'] + L['h'] * (1 - np.abs(XX[m] - L['xc']) / (LW / 2)))
AC = S['ac']; put(box(AC['x0'], AC['x1'], AC['y0'], AC['y1']), np.float32(max(float(roofZ(AC['x0'])), float(roofZ(AC['x1']))) + AC['h']))
for o in DF:
    m = (XX - o['x']) ** 2 + (YY - o['y']) ** 2 <= (o['d'] / 2) ** 2; put(m, np.float32(float(roofZ(o['x'])) + o['h']))
for x0, x1, y0, y1, h in [(58.4, 65.6, -2.45, -0.5, 15.9 + 3.9), (-0.5, 19.5, 96.6, 107.1, 4.5), (96.8, 103.0, -0.4, 34.6, 4.5),
                          (108.3, 127.5, 6.6, 20.3, 10.5), (116.3, 121.5, 8.0, 17.8, 12.6),   # АБК, південний блок і надбудова (супутник 27.10; висоти — оцінка)
                          (66.0, 71.0, -2.7, -0.95, 2.4), (55.9, 58.35, -3.2, -0.75, 2.6)]:
    put(box(x0, x1, y0, y1), np.float32(h))
# АБК, основний блок: арковий дах уздовж Пн–Пд, карниз 13,2 + стріла 1,3 + парапети ≤ 0,7 (оцінка) — нижче покрівлі цеху (≥ 15,9), тіні на дах цеху не дає
_ax = (XX - 118.25) / 9.75; put(box(108.5, 128.0, 20.3, 45.2), (13.2 + 1.3 * np.clip(1 - _ax ** 2, 0, 1) + 0.5).astype(np.float32))
for k in BE['K']: put(box(k['box'][0], k['box'][1], k['box'][2], k['box'][3]), np.float32(3.2))
def Hat(x, y):
    ix = np.clip(((x - GX0) / R).astype(np.int32), 0, len(gx) - 1); iy = np.clip(((y - GY0) / R).astype(np.int32), 0, len(gy) - 1); return H[iy, ix]
# ---------- горизонт, небо, сонце (у координатах будівлі)
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA; ALB = 0.2
LOSS = (1 - .025) * (1 - .015) * (1 - .01) * (1 - .035) * (1 - .03) * (1 - .015) * (1 - .01); GAMT = -0.003; PW, ETA = 0.730, 0.235
cR, sR = math.cos(ROT), math.sin(ROT)
def tobld(ex, ey): return ex * cR - ey * sR, ex * sR + ey * cR     # схід/північ → X/Y будівлі
def horizon(P):
    HOR = np.zeros((len(P), NA), np.float32)
    for b0 in range(0, len(P), 600):
        p = P[b0:b0 + 600]
        for a in range(NA):
            X = p[:, 0:1] + math.sin(AZ[a]) * DS[None, :]; Y = p[:, 1:2] + math.cos(AZ[a]) * DS[None, :]
            HOR[b0:b0 + len(p), a] = np.maximum(np.arctan2(Hat(X, Y) - p[:, 2:3], DS[None, :]).max(axis=1), 0)
    return HOR
def svf(HOR, N3):
    S_ = np.zeros(len(N3)); S0 = np.zeros(len(N3))
    for a in range(NA):
        for e in EL:
            v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); cc = N3 @ v
            w = np.where(cc > 0, cc, 0) * math.cos(e) * dEl * dAz / math.pi; S0 += w; S_ += w * (e > HOR[:, a])
    return S_, S0
def run(P, NRM, U=20, k=3, irr_only=False):
    """P — точки (k на модуль), NRM — нормаль модуля. Повертає PV-енергію з тінню/без і по місяцях, а також опромінення площини, кВт·год/м²."""
    HOR = horizon(P); N3 = np.repeat(NRM, k, axis=0); SVF, SVF0 = svf(HOR, N3)
    SVFm = SVF.reshape(-1, k).mean(1); SVF0m = SVF0.reshape(-1, k).mean(1)
    modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS, 0)
    n = len(NRM); E = np.zeros(n); Eun = np.zeros(n); Emo = np.zeros((12, n)); I = np.zeros(n); Iun = np.zeros(n); Imo = np.zeros((12, n))
    for mo, Wm in enumerate(WX['mo']):
        wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
        for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
            bx, by = tobld(ex, ey); dv = np.array([bx, by, sz]); cosb = np.maximum(NRM @ dv, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
            az = math.atan2(bx, by); el = math.asin(max(-1, min(1, sz))); fa = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(fa) % NA; a1 = (a0 + 1) % NA; t = fa - int(fa)
            lit = (el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t).reshape(-1, k).mean(1)
            beam = Dn * cosb + Dd * Ai * cosb / cz; gr = Gh * ALB * (1 - NRM[:, 2]) / 2; Go = c_ * Gh
            pc = beam * lit + Dd * (1 - Ai) * SVFm + gr; po = Go * SVFm + Go * ALB * (1 - NRM[:, 2]) / 2
            uc = beam + Dd * (1 - Ai) * SVF0m + gr; uo = Go * SVF0m + Go * ALB * (1 - NRM[:, 2]) / 2
            ii = wt * (p_ * pc + (1 - p_) * po) / 1000; I += ii; Imo[mo] += ii; Iun += wt * (p_ * uc + (1 - p_) * uo) / 1000
            if not irr_only:
                e = wt * (p_ * modP(pc, ta) + (1 - p_) * modP(po, ta)); E += e; Emo[mo] += e; Eun += wt * (p_ * modP(uc, ta) + (1 - p_) * modP(uo, ta))
    return dict(E=E, Eun=Eun, Emo=Emo, I=I, Iun=Iun, Imo=Imo)
if __name__ == '__main__':
    # ---------- кандидати модулів на гранях (як v2)
    LM, DM, GAP, MRG = 2.384, 1.303, 0.022, 0.12; LCX = 0.25
    FAC = [p for p in PR if p['what'].startswith('грань')]
    ROWS = [3.482 + 2.406 * k for k in range(12)] + [34.845 + 2.406 * k for k in range(12)] + [66.208 + 2.406 * k for k in range(12)]
    ZONES = [dict(k='ac', n='рама кондиціонерів + 1 м', x=tuple(AC['zone']['x']), y=tuple(AC['zone']['y'])),
             dict(k='exit', n='вихід на дах і портал (X 62–70 — уточнити)', x=(62.0, 70.0), y=(-0.25, 3.6)),
             dict(k='exit', n='прохід від виходу до рами', x=(63.5, 69.5), y=(-0.25, 6.5)),
             dict(k='door', n='прохід від дверей західної будівлі', x=(-0.6, 1.6), y=(85.0, 88.0)),
             dict(k='drain', n='воронка біля південного парапету + 0,5 м', x=(71.3, 72.9), y=(-0.25, 1.9))]
    ov = lambda a0, a1, b0, b1: a0 < b1 and b0 < a1
    def hitc(xa, xb, ya, yb, cx, cy, r):
        dx = max(xa - cx, 0, cx - xb); dy = max(ya - cy, 0, cy - yb); return dx * dx + dy * dy < r * r
    cand = []
    for fi, p in enumerate(FAC):
        dx, dz = p['x1'] - p['x0'], p['z1'] - p['z0']; Ls = math.hypot(dx, dz); c, s = dx / Ls, dz / Ls; k = dz / dx
        n = int((Ls - 2 * MRG + GAP) // (DM + GAP)); used = n * DM + (n - 1) * GAP; st = (Ls - used) / 2
        for j in range(n):
            u0 = st + j * (DM + GAP); u1 = u0 + DM; xa, xb = p['x0'] + u0 * c, p['x0'] + u1 * c; um = (u0 + u1) / 2
            xm, zm = p['x0'] + um * c, p['z0'] + um * s
            for y in ROWS:
                ya, yb = y - LM / 2, y + LM / 2; why = None
                for L in LAN:
                    if ov(xa, xb, L['x0'] - LCX, L['x1'] + LCX) and ov(ya, yb, L['y0'] - 0.5, L['y1'] + 0.5): why = 'lan'
                if not why:
                    for o in DF:
                        if hitc(xa, xb, ya, yb, o['x'], o['y'], o['d'] / 2 + 0.3): why = 'defl'; break
                if not why:
                    why = next((z['k'] for z in ZONES if ov(xa, xb, *z['x']) and ov(ya, yb, *z['y'])), None)
                cand.append(dict(f=fi, sp=p['sp'], j=j, xa=round(xa, 3), xb=round(xb, 3), xm=round(xm, 3), zm=round(zm, 3), y=round(y, 3), k=k,
                                 tilt=round(math.degrees(math.atan(abs(k))), 1), face='W' if k > 0 else 'E', why=why))
    C = [c_ for c_ in cand if c_['why'] is None]
    import collections
    print('cand', len(cand), 'free', len(C), collections.Counter(c_['why'] for c_ in cand))
    P = []; N = []
    for c_ in C:
        nv = np.array([-c_['k'], 0, 1.0]); nv /= np.linalg.norm(nv); N.append(nv)
        for t in (-0.892, 0.0, 0.888): P.append((c_['xm'], c_['y'] + t, c_['zm'] + 0.12 + 0.033 + 0.03))
    R_ = run(np.array(P), np.array(N), 20)
    A = DM * LM
    for i, c_ in enumerate(C):
        c_['kwh'] = round(float(R_['E'][i]), 1); c_['un'] = round(float(R_['Eun'][i]), 1); c_['loss'] = round(float(1 - R_['E'][i] / R_['Eun'][i]) * 100, 2)
        c_['irr'] = round(float(R_['I'][i]), 1); c_['mo'] = [round(float(R_['Emo'][m][i]), 2) for m in range(12)]
    json.dump(dict(LAN=LAN, ZONES=ZONES, ROWS=ROWS, DF=DF, PAR=PAR, ROT=4.0, cand=cand), open(V + ('roof_v3_nodefl.json' if NODEFL else 'roof_v3.json'), 'w'), ensure_ascii=False)
    E = np.array([c_['kwh'] for c_ in C]); print('free', len(C), 'MWh', round(E.sum() / 1000, 1), 'kWh/kWp', round(E.sum() / len(C) / 0.73))
    for thr in (5, 10, 15, 20, 100):
        sel = [c_ for c_ in C if c_['loss'] <= thr]; n_ = len(sel); e_ = sum(c_['kwh'] for c_ in sel)
        print(f'thr {thr}%: {n_} ({n_ // 11}×11+{n_ % 11}) {n_ * 0.73:.1f} kWp {e_ / 1000:.1f} MWh {e_ / n_ / 0.73:.0f} kWh/kWp')
