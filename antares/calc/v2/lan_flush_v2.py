# -*- coding: utf-8 -*-
"""Модулі рівно по схилах ліхтаря (запит власника 27.10, 07:41): не вище ліхтаря, без «доміку» над ним.
Модуль лежить на схилі паралельно, 0,12 м над ним; верхній край — на 0,03 м від гребеня, низ — не нижче основи ліхтаря.
Книжково (2 384 мм по схилу) — якщо довжина схилу ≥ 2,44 м, інакше альбомно (1 303 мм по схилу, 2 384 уздовж ліхтаря).
Висота гребеня ліхтаря невідома (оцінка 1,5 м) — рахуємо 1,0 / 1,5 / 2,0 м. Тінь на модулі даху — різниця з тим самим DSM без модулів.
Плюс профіль потужності одного модуля (без тіні) для оцінки освітлення від модулів, що не входять у стрінги."""
import json, math, sys, numpy as np
D = '/home/claude/work/sun/v2/'
SRC = open(D + 'roof_v2.py', encoding='utf-8').read()
F = json.load(open(D + 'final_v2.json')); RM = [m for m in F['mods'] if m[3] == 'ok']
OUT = {}
for LHv in (1.0, 1.5, 2.0):
    sys.argv = ['x', str(LHv), '0.25']
    exec(SRC[:SRC.find('# ---------- кандидати')]); exec(SRC[SRC.find('# ---------- горизонт і генерація'):SRC.find('P = []; N = []')])
    D = '/home/claude/work/sun/v2/'; LM, DM = 2.384, 1.303
    RP = []; RN = []
    for xa, xb, y, s_, kwh, loss, tilt, face, sp in RM:
        xm = (xa + xb) / 2; k = (float(roofZ(xb)) - float(roofZ(xa))) / (xb - xa); nv = np.array([-k, 0, 1.0]); RN.append(nv / np.linalg.norm(nv))
        for t in (-0.892, 0.0, 0.888): RP.append((xm, y + t, float(roofZ(xm)) + 0.12 + 0.033 + 0.03))
    RP = np.array(RP); RN = np.array(RN)
    ERb, _, _ = energy(RP, RN, 20)                                   # дах без модулів на ліхтарях (цей самий LH)
    mods = []; geo = []
    for li, L in enumerate(LAN):
        xc = (L['x0'] + L['x1']) / 2; hw = (L['x1'] - L['x0']) / 2; th = math.atan2(LHv, hw); Ls = math.hypot(hw, LHv); c, s = math.cos(th), math.sin(th)
        por = Ls >= 0.03 + LM + 0.02; A = LM if por else DM; Bd = DM if por else LM; pit = Bd + 0.022
        n = int((L['y1'] - L['y0'] + 0.022) // pit); ys = (L['y0'] + L['y1']) / 2 - (n * pit - 0.022) / 2
        geo.append(dict(l=li + 1, tilt=round(math.degrees(th), 1), Ls=round(Ls, 2), por=por, n=n, free=round(Ls - 0.03 - A, 2)))
        for side, sg in (('E', 1), ('W', -1)):
            nrm = np.array([sg * s, 0, c])
            for i in range(n):
                y0 = ys + i * pit
                if por: sp_ = [(0.03 + A * u, y0 + Bd / 2) for u in (0.2, 0.5, 0.8)]
                else: sp_ = [(0.03 + A / 2, y0 + Bd * u) for u in (0.2, 0.5, 0.8)]
                pts = [(xc + sg * sa * c + nrm[0] * 0.183, yy, L['zb'] + LHv - sa * s + nrm[2] * 0.183) for sa, yy in sp_]
                mods.append(dict(l=li + 1, side=side, y=round(y0, 3), n=nrm, pts=pts))
        # модулі в DSM: поверхня ліхтаря + 0,153 м по нормалі
        xa_, xb_ = 0.03 * c, (0.03 + A) * c; m = (np.abs(XX - xc) >= xa_) & (np.abs(XX - xc) <= xb_) & (YY >= ys) & (YY <= ys + n * pit)
        H[m] = np.maximum(H[m], (L['zb'] + LHv * (1 - np.abs(XX[m] - xc) / hw) + 0.153 / c).astype(np.float32))
    E, Eun, Emo = energy(np.array([p for m in mods for p in m['pts']]), np.array([m['n'] for m in mods]), 20)
    ERm, _, _ = energy(RP, RN, 20); dR = ERb - ERm
    for m, e, u in zip(mods, E, Eun): m['kwh'] = round(float(e), 1); m['loss'] = round(float(1 - e / u) * 100, 1)
    keep = []; left = []
    for sd in 'EW':
        ms = sorted([m for m in mods if m['side'] == sd], key=lambda m: -m['kwh']); keep += ms[:len(ms) // 11 * 11]; left += ms[len(ms) // 11 * 11:]
    K = dict(LH=LHv, geo=geo, places=len(mods), n=len(keep), st=len(keep) // 11, kwp=round(len(keep) * 0.73, 1), mwh=round(sum(m['kwh'] for m in keep) / 1000, 1),
             left=len(left), left_mwh=round(sum(m['kwh'] for m in left) / 1000, 2), all_mwh=round(sum(m['kwh'] for m in mods) / 1000, 1))
    K['y'] = round(K['mwh'] * 1000 / K['kwp']) if K['kwp'] else 0
    K['roof_loss'] = round(float(dR.sum()) / 1000, 2); K['roof_hit'] = int((dR > 5).sum()); K['roof_max'] = round(float((dR / ERb).max()) * 100, 2)
    K['net'] = round(K['mwh'] - K['roof_loss'], 1); K['roof_base'] = round(float(ERb.sum()) / 1000, 1)
    for sd in 'EW':
        ms = [m for m in mods if m['side'] == sd]; K[sd] = round(sum(m['kwh'] for m in ms) / len(ms) / 0.73)
    K['perlan'] = [dict(no=i + 1, E=round(float(np.mean([m['loss'] for m in mods if m['l'] == i + 1 and m['side'] == 'E'])), 1),
                        W=round(float(np.mean([m['loss'] for m in mods if m['l'] == i + 1 and m['side'] == 'W'])), 1),
                        kE=round(float(np.mean([m['kwh'] for m in mods if m['l'] == i + 1 and m['side'] == 'E'])) / 0.73),
                        kW=round(float(np.mean([m['kwh'] for m in mods if m['l'] == i + 1 and m['side'] == 'W'])) / 0.73),
                        n=sum(1 for m in mods if m['l'] == i + 1), mwh=round(sum(m['kwh'] for m in mods if m['l'] == i + 1) / 1000, 1)) for i in range(4)]
    K['mo'] = [round(float(Emo[i].sum()) / 1000, 2) for i in range(12)]
    OUT[f'{LHv:.1f}'] = dict(K=K, mods=[[m['l'], m['side'], m['y'], m['kwh'], m['loss']] for m in mods], left=[[m['l'], m['side'], m['y'], m['kwh']] for m in left])
    print(LHv, {k: v for k, v in K.items() if k not in ('perlan', 'mo', 'geo')}, geo[1], K['perlan'])
# ---------- профіль потужності одного модуля на схилі ліхтаря 1,5 м (без тіні) — для освітлення
th = math.atan2(1.5, 1.435); PROF = {}
for sd, sg in (('E', 1), ('W', -1)):
    nv = np.array([sg * math.sin(th), 0, math.cos(th)]); sv = (1 + nv[2]) / 2; rows = []
    for mo, Wm in enumerate(WX['mo']):
        p_, c_ = Wm['p'], Wm['c']; cl = []; oc = []; hrs = []
        for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
            dv = np.array([ex, ey, sz]); cosb = max(float(nv @ dv), 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
            gr = Gh * ALB * (1 - nv[2]) / 2; pc = Dn * cosb + Dd * Ai * cosb / cz + Dd * (1 - Ai) * sv + gr; Go = c_ * Gh; po = Go * sv + Go * ALB * (1 - nv[2]) / 2
            P = lambda poa: PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / 20 - 25)) * LOSS if poa > 0 else 0
            cl.append(P(pc)); oc.append(P(po)); hrs.append(h)
        w = [8 <= h < 17 for h in hrs]
        mc = float(np.mean([v for v, k in zip(cl, w) if k])); mo_ = float(np.mean([v for v, k in zip(oc, w) if k]))
        rows.append(dict(mo=mo + 1, p=p_, clear_max=round(max(cl) * 1000), clear_day=round(mc * 1000), over_day=round(mo_ * 1000), mix_day=round((p_ * mc + (1 - p_) * mo_) * 1000)))
    PROF[sd] = rows
OUT['PROF'] = PROF; OUT['LAN'] = LAN
json.dump(OUT, open(D + 'lan_flush_v2.json', 'w'), ensure_ascii=False)
for sd in 'EW':
    for r in PROF[sd]: print(sd, r)
