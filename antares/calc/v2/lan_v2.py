# -*- coding: utf-8 -*-
"""Модулі «доміком» над ліхтарями на геометрії розрізу 1-1 (запит власника 27.10, 07:29).
Над ліхтарем 2,87 м — рама з двох схилів, на кожному один модуль книжково (2 384 мм по схилу); верхні краї сходяться над гребенем
(зазор 20 мм), нижні — над краями ліхтаря з виносом OV за основу. Кут схилу виходить з геометрії: cos θ = (1,435 + OV − 0,01) / 2,384.
Низ модуля — на 0,15 м вище верхнього краю основи ліхтаря (17,66). Уздовж ліхтаря крок 1 325 мм.
Рахуємо генерацію «доміків» і що вони забирають тінню в модулів даху (база 27.10, 1 936)."""
import json, math, sys, numpy as np
D = '/home/claude/work/sun/v2/'; LM, DM = 2.384, 1.303
SRC = open(D + 'roof_v2.py', encoding='utf-8').read()
sys.argv = ['x', '1.5', '0.25']
exec(SRC[:SRC.find('# ---------- кандидати')]); exec(SRC[SRC.find('# ---------- горизонт і генерація'):SRC.find('P = []; N = []')])
D = '/home/claude/work/sun/v2/'; LM, DM = 2.384, 1.303
H1 = H.copy()                                                   # DSM бази: ліхтарі 1,5 м
F = json.load(open(D + 'final_v2.json')); RM = [m for m in F['mods'] if m[3] == 'ok']
RP = []; RN = []
for xa, xb, y, s, kwh, loss, tilt, face, sp in RM:
    xm = (xa + xb) / 2; k = (float(roofZ(xb)) - float(roofZ(xa))) / (xb - xa); nv = np.array([-k, 0, 1.0]); RN.append(nv / np.linalg.norm(nv))
    for t in (-0.892, 0.0, 0.888): RP.append((xm, y + t, float(roofZ(xm)) + 0.12 + 0.033 + 0.03))
RP = np.array(RP); RN = np.array(RN); ER0 = np.array([m[4] for m in RM], float)
OUT = {}
for OV in (0.0, 0.10):
    H[:] = H1; hs = 1.435 + OV - 0.01; th = math.acos(hs / LM); c, s = math.cos(th), math.sin(th); mods = []
    for li, L in enumerate(LAN):
        xc = (L['x0'] + L['x1']) / 2; zlo = L['zb'] + 0.15; zr = zlo + LM * s           # низ модуля і гребінь (верх модуля)
        n = int((L['y1'] - L['y0'] + 0.02) // 1.325); ys = (L['y0'] + L['y1']) / 2 - (n * 1.325 - 0.022) / 2
        for side, sg in (('E', 1), ('W', -1)):
            for i in range(n):
                pts = [(xc + sg * (0.01 + u * c), ys + i * 1.325 + DM / 2, zr - u * s + 0.033 + 0.03) for u in (0.2 * LM, 0.5 * LM, 0.8 * LM)]
                mods.append(dict(l=li + 1, side=side, y=round(ys + i * 1.325, 3), sg=sg, pts=pts))
        m = (np.abs(XX - xc) <= hs + 0.01) & (YY >= ys) & (YY <= ys + n * 1.325)
        H[m] = np.maximum(H[m], (zr + 0.033 - (np.abs(XX[m] - xc) - 0.01).clip(0) * math.tan(th)).astype(np.float32))
    NR = np.array([[m['sg'] * s, 0, c] for m in mods])
    E, Eun, Emo = energy(np.array([p for m in mods for p in m['pts']]), NR, 25)
    ER, _, _ = energy(RP, RN, 20); dR = ER0 - ER
    for m, e, u in zip(mods, E, Eun): m['kwh'] = round(float(e), 1); m['loss'] = round(float(1 - e / u) * 100, 1)
    keep = []
    for sd in 'EW':
        ms = sorted([m for m in mods if m['side'] == sd], key=lambda m: -m['kwh']); keep += ms[:len(ms) // 11 * 11]
    K = dict(n=len(keep), st=len(keep) // 11, kwp=round(len(keep) * 0.73, 1), mwh=round(sum(m['kwh'] for m in keep) / 1000, 1))
    K['y'] = round(K['mwh'] * 1000 / K['kwp']); K['roof_loss'] = round(float(dR.sum()) / 1000, 1); K['net'] = round(K['mwh'] - K['roof_loss'], 1)
    K.update(tilt=round(math.degrees(th), 1), ridge=round(zr - LAN[1]['zb'], 2), width=round(2 * (hs + 0.01), 2), places=len(mods),
             E=round(sum(m['kwh'] for m in mods if m['side'] == 'E') / sum(1 for m in mods if m['side'] == 'E') / 0.73),
             W=round(sum(m['kwh'] for m in mods if m['side'] == 'W') / sum(1 for m in mods if m['side'] == 'W') / 0.73),
             roof_hit=int((dR > 5).sum()), roof_max=round(float((dR / ER0).max()) * 100, 1),
             perlan=[dict(no=i + 1, n=sum(1 for m in mods if m['l'] == i + 1), mwh=round(sum(m['kwh'] for m in mods if m['l'] == i + 1) / 1000, 1)) for i in range(4)],
             mo=[round(float(Emo[i].sum()) / 1000, 2) for i in range(12)])
    OUT[f'{OV:.2f}'] = dict(K=K, mods=[[m['l'], m['side'], m['y'], m['kwh'], m['loss']] for m in mods], dR=[round(float(x), 1) for x in dR])
    print(OV, {k: v for k, v in K.items() if k not in ('perlan', 'mo')}, K['perlan'])
OUT['LAN'] = LAN; OUT['base'] = F['base']
json.dump(OUT, open(D + 'lan_v2.json', 'w'), ensure_ascii=False)
