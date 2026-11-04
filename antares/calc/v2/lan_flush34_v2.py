# -*- coding: utf-8 -*-
"""Модулі книжково рівно по схилах ліхтаря за розмірами РП: ліхтар 3,40 × 1,74 м (запит власника 27.10, 07:52 — «книжково ляже дуже добре»).
Центри ліхтарів — з розрізу 1-1 (там 2,87 м — можливо, отвір у плиті; центри РП і розрізу розходяться на 0,03–0,46 м).
Схил √(1,70² + 1,74²) = 2,43 м ≥ 2 384 + 20 мм — модуль книжково вміщується.
Дах — розкладка з відступом від ліхтаря 0,5 м від краю 2,87 (= ≈0,27 м від краю 3,40): без неї модулі даху впираються в ліхтар 3,40."""
import json, math, sys, numpy as np
D = '/home/claude/work/sun/v2/'; HW, LHv = 1.70, 1.74
SRC = open(D + 'roof_v2.py', encoding='utf-8').read()
SRC = SRC.replace("LAN = [dict(x0=a, x1=b_,", f"LAN = [dict(x0=(a + b_) / 2 - {HW}, x1=(a + b_) / 2 + {HW},")
sys.argv = ['x', str(LHv), '0.5']
exec(SRC[:SRC.find('# ---------- кандидати')]); exec(SRC[SRC.find('# ---------- горизонт і генерація'):SRC.find('P = []; N = []')])
D = '/home/claude/work/sun/v2/'; LM, DM = 2.384, 1.303
# дах: розкладка LCX 0,5, поріг тіні 15 %, підгонка під 11
J = json.load(open(D + 'roof_v2_1.5_0.50.json')); C = [c for c in J['cand'] if c['why'] is None and c['loss'] <= 15]
C = sorted(C, key=lambda c: -c['kwh'])[:len(C) // 11 * 11]
gap = min(min(abs(c['xb'] - L['x0']), abs(c['xa'] - L['x1'])) for c in C for L in LAN if L['y0'] - 1.2 < c['y'] < L['y1'] + 1.2)
RP = []; RN = []
for c in C:
    xm = (c['xa'] + c['xb']) / 2; k = (float(roofZ(c['xb'])) - float(roofZ(c['xa']))) / (c['xb'] - c['xa']); nv = np.array([-k, 0, 1.0]); RN.append(nv / np.linalg.norm(nv))
    for t in (-0.892, 0.0, 0.888): RP.append((xm, c['y'] + t, float(roofZ(xm)) + 0.12 + 0.033 + 0.03))
RP = np.array(RP); RN = np.array(RN)
ERb, _, _ = energy(RP, RN, 20)
mods = []; geo = []
for li, L in enumerate(LAN):
    xc = (L['x0'] + L['x1']) / 2; hw = HW; th = math.atan2(LHv, hw); Ls = math.hypot(hw, LHv); c, s = math.cos(th), math.sin(th)
    n = int((L['y1'] - L['y0'] + 0.022) // 1.325); ys = (L['y0'] + L['y1']) / 2 - (n * 1.325 - 0.022) / 2
    a0, a1 = 0.02, 0.02 + LM                                       # уздовж схилу від гребеня
    bot = dict(x=round(a1 * c + 0.12 * s - hw, 3), z=round(LHv - a1 * s + 0.12 * c, 3))   # низ модуля відносно краю ліхтаря і його основи
    geo.append(dict(l=li + 1, tilt=round(math.degrees(th), 1), Ls=round(Ls, 3), n=n, free=round(Ls - a1, 3), bot=bot))
    for side, sg in (('E', 1), ('W', -1)):
        nrm = np.array([sg * s, 0, c])
        for i in range(n):
            y0 = ys + i * 1.325
            pts = [(xc + sg * sa * c + nrm[0] * 0.183, y0 + DM / 2, L['zb'] + LHv - sa * s + nrm[2] * 0.183) for sa in (a0 + LM * 0.2, a0 + LM * 0.5, a0 + LM * 0.8)]
            mods.append(dict(l=li + 1, side=side, y=round(y0, 3), n=nrm, pts=pts))
    m = (np.abs(XX - xc) >= a0 * c) & (np.abs(XX - xc) <= a1 * c + 0.12 * s) & (YY >= ys) & (YY <= ys + n * 1.325)
    H[m] = np.maximum(H[m], (L['zb'] + LHv * (1 - np.abs(XX[m] - xc) / hw).clip(0) + 0.153 / c).astype(np.float32))
E, Eun, Emo = energy(np.array([p for m in mods for p in m['pts']]), np.array([m['n'] for m in mods]), 20)
ERm, _, _ = energy(RP, RN, 20); dR = ERb - ERm
for m, e, u in zip(mods, E, Eun): m['kwh'] = round(float(e), 1); m['loss'] = round(float(1 - e / u) * 100, 1)
keep = []; left = []
for sd in 'EW':
    ms = sorted([m for m in mods if m['side'] == sd], key=lambda m: -m['kwh']); keep += ms[:len(ms) // 11 * 11]; left += ms[len(ms) // 11 * 11:]
K = dict(places=len(mods), n=len(keep), st=len(keep) // 11, kwp=round(len(keep) * 0.73, 1), mwh=round(sum(m['kwh'] for m in keep) / 1000, 1),
         left=len(left), left_mwh=round(sum(m['kwh'] for m in left) / 1000, 2), geo=geo, gap=round(gap, 3))
K['y'] = round(K['mwh'] * 1000 / K['kwp'])
K['roof_n'] = len(C); K['roof_st'] = len(C) // 11; K['roof_kwp'] = round(len(C) * 0.73, 1); K['roof_base'] = round(float(ERb.sum()) / 1000, 1)
K['roof_loss'] = round(float(dR.sum()) / 1000, 2); K['roof_hit'] = int((dR > 5).sum()); K['roof_max'] = round(float((dR / ERb).max()) * 100, 2); K['net'] = round(K['mwh'] - K['roof_loss'], 1)
for sd in 'EW':
    ms = [m for m in mods if m['side'] == sd]; K[sd] = round(sum(m['kwh'] for m in ms) / len(ms) / 0.73)
K['perlan'] = [dict(no=i + 1, n=sum(1 for m in mods if m['l'] == i + 1),
                    E=round(float(np.mean([m['loss'] for m in mods if m['l'] == i + 1 and m['side'] == 'E'])), 1), W=round(float(np.mean([m['loss'] for m in mods if m['l'] == i + 1 and m['side'] == 'W'])), 1),
                    kE=round(float(np.mean([m['kwh'] for m in mods if m['l'] == i + 1 and m['side'] == 'E'])) / 0.73), kW=round(float(np.mean([m['kwh'] for m in mods if m['l'] == i + 1 and m['side'] == 'W'])) / 0.73),
                    mwh=round(sum(m['kwh'] for m in mods if m['l'] == i + 1) / 1000, 1)) for i in range(4)]
K['mo'] = [round(float(Emo[i].sum()) / 1000, 2) for i in range(12)]
OUT = dict(K=K, LAN=LAN, mods=[[m['l'], m['side'], m['y'], m['kwh'], m['loss']] for m in mods])
json.dump(OUT, open(D + 'lan_flush34_v2.json', 'w'), ensure_ascii=False)
print({k: v for k, v in K.items() if k not in ('perlan', 'mo', 'geo')}); print(geo[1]); print(K['perlan'])
