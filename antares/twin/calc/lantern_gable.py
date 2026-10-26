# -*- coding: utf-8 -*-
"""Окремий варіант (запит 26.10, 22:11): модулі «доміком» над світловими ліхтарями даху цеху.
Над кожним ліхтарем — двосхила рама, гребінь уздовж ліхтаря (Y), схили на схід і захід; на кожному схилі один модуль книжково
(2 384 мм по схилу, 1 303 уздовж ліхтаря), крок уздовж ліхтаря 1 325 мм (зазор 20 мм за ZNSHINE). Низ модуля над краєм ліхтаря —
не нижче верху ліхтаря + 0,115 (просвіт за ZNSHINE) + 0,10 (рама). Кути 10/15/20/25°.
Рахуємо: генерацію модулів на ліхтарях (тінь західної будівлі, сусідніх «доміків», рами кондиціонерів…) і втрати модулів даху (база 26.10, 1 705)
від нової тіні «доміків». Модель — як roof_new.py (без вентиляції)."""
import json, math, sys, numpy as np
SRC = open('calc/irr.py', encoding='utf-8').read()
SRC = SRC[:SRC.find('# ---------- точки')].replace("for o in S['obs']:", "for o in []:")
exec(open('calc/lan_tri.py', encoding='utf-8').read()); assert LAN_OLD in SRC; SRC = SRC.replace(LAN_OLD, LAN_NEW)
exec(SRC)
ALB = 0.2; H0 = H.copy()
RF = json.load(open('calc/roof_final.json')); RM = [m for m in RF['mods'] if m[3] in ('old', 'new')]
LANS = [l for l in S['lan']]; LM, DM, PY, CLR = 2.384, 1.303, 1.325, 0.215
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA
LOSS = (1 - .025) * (1 - .015) * (1 - .01) * (1 - .035) * (1 - .03) * (1 - .015) * (1 - .01); GAMT = -0.003; PW, ETA = 0.730, 0.235
def horizon(P):
    HOR = np.zeros((len(P), NA), np.float32)
    for b0 in range(0, len(P), 600):
        p = P[b0:b0 + 600]
        for a in range(NA):
            X = p[:, 0:1] + math.sin(AZ[a]) * DS[None, :]; Y = p[:, 1:2] + math.cos(AZ[a]) * DS[None, :]
            HOR[b0:b0 + len(p), a] = np.maximum(np.arctan2(Hat(X, Y) - p[:, 2:3], DS[None, :]).max(axis=1), 0)
    return HOR
def energy(P, NRM, U, k=3):
    """P — k точок на модуль, NRM — нормаль на модуль. Повертає (з тінню, без тіні), кВт·год за рік на модуль."""
    HOR = horizon(P); N3 = np.repeat(NRM, k, axis=0); SVF = np.zeros(len(P)); SVF0 = np.zeros(len(P))
    for a in range(NA):
        for e in EL:
            v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); cc = N3 @ v
            w = np.where(cc > 0, cc, 0) * math.cos(e) * dEl * dAz / math.pi; SVF0 += w; SVF += w * (e > HOR[:, a])
    SVFm = SVF.reshape(-1, k).mean(1); SVF0m = SVF0.reshape(-1, k).mean(1)
    modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS, 0)
    E = np.zeros(len(NRM)); Eun = np.zeros(len(NRM))
    for Wm in WX['mo']:
        wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
        for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
            dv = np.array([ex, ey, sz]); cosb = np.maximum(NRM @ dv, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
            az = math.atan2(ex, ey); el = math.asin(max(-1, min(1, sz))); f = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(f) % NA; a1 = (a0 + 1) % NA; t = f - int(f)
            lit = (el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t).reshape(-1, k).mean(1)
            beam = Dn * cosb + Dd * Ai * cosb / cz; gr = Gh * ALB * (1 - NRM[:, 2]) / 2; Go = c_ * Gh
            pc = beam * lit + Dd * (1 - Ai) * SVFm + gr; po = Go * SVFm + Go * ALB * (1 - NRM[:, 2]) / 2
            uc = beam + Dd * (1 - Ai) * SVF0m + gr; uo = Go * SVF0m + Go * ALB * (1 - NRM[:, 2]) / 2
            E += wt * (p_ * modP(pc, ta) + (1 - p_) * modP(po, ta)); Eun += wt * (p_ * modP(uc, ta) + (1 - p_) * modP(uo, ta))
    return E, Eun
# модулі даху (база 26.10) — точки й нормалі, як у roof_new.py
RP = []; RN = []
for xa, xb, y, s, kwh, loss in RM:
    za, zb = float(roofZ(xa)), float(roofZ(xb)); kk = (zb - za) / (xb - xa); RN.append(np.array([-kk, 0, 1.0]) / math.hypot(kk, 1))
    for t in (-0.892, 0.0, 0.888): RP.append(((xa + xb) / 2, y + t, (za + zb) / 2 + 0.15))
RP = np.array(RP); RN = np.array(RN); ER0 = np.array([m[4] for m in RM], float)
HW = 1.7; OFFN = 0.15 + 0.033                                    # низ рами на 0,15 м над листом ліхтаря, верх модуля +0,033
def lanH(h):
    """Ліхтарі в DSM — двосхилі висотою h над покрівлею біля ліхтаря."""
    Hn = H0.copy()
    for l in LANS:
        m = (XX >= l[0]) & (XX <= l[1]) & (YY >= l[2]) & (YY <= l[3]); xc = (l[0] + l[1]) / 2; zb = float(max(roofZ(l[0]), roofZ(l[1])))
        Hn[m] = np.maximum(RZb[m], (zb + h * (1 - np.abs(XX[m] - xc) / HW))).astype(np.float32)
    return Hn
RZb = roofZ(XX).astype(np.float32)
def layout(kind, h, tilt=None):
    """kind 'flush' — модулі на схилах ліхтаря (кут ліхтаря); 'gable' — двосхилий навіс tilt° над гребенем ліхтаря."""
    Hn = lanH(h); mods = []
    th = math.atan(h / HW) if kind == 'flush' else math.radians(tilt); c, sn = math.cos(th), math.sin(th)
    for li, l in enumerate(LANS):
        x0, x1, y0, y1, _ = l; xc = (x0 + x1) / 2; zb = float(max(roofZ(x0), roofZ(x1)))
        if kind == 'flush':
            Ls = HW / c; u0 = max(0.02, (Ls - LM) / 2); top = lambda u: zb + h - u * sn + OFFN / c; xo = lambda u: u * c
        else:
            zr = zb + h + CLR + 0.01 * math.tan(th); u0 = 0.0; top = lambda u: zr + 0.033 - u * sn; xo = lambda u: 0.01 + u * c
        n = int((y1 - y0 + 0.02) // PY); ys = (y0 + y1) / 2 - (n * PY - 0.022) / 2
        for side, sg in (('E', 1), ('W', -1)):
            for i in range(n):
                pts = [(xc + sg * xo(u0 + s * LM), ys + i * PY + DM / 2, top(u0 + s * LM) + 0.03) for s in (0.2, 0.5, 0.8)]
                mods.append(dict(l=li + 1, side=side, y=ys + i * PY, sg=sg, th=th, pts=pts, xt=round(xo(u0), 3), zt=round(top(u0) - HV, 3), xb=round(xo(u0 + LM), 3), zbm=round(top(u0 + LM) - HV, 3)))
        xmax = xo(u0 + LM) + 0.01; m = (np.abs(XX - xc) <= xmax) & (YY >= ys) & (YY <= ys + n * PY)
        dd = np.abs(XX[m] - xc)
        zz = (zb + h - dd * math.tan(th) + OFFN / c) if kind == 'flush' else (zr + 0.033 - (dd - 0.01).clip(0) * math.tan(th))
        Hn[m] = np.maximum(Hn[m], zz.astype(np.float32))
    return mods, Hn, th
OUT = dict(var={}, lans=[dict(no=i + 1, x0=l[0], x1=l[1], y0=l[2], y1=l[3], h=l[4]) for i, l in enumerate(LANS)])
for key, kind, h, tilt in (('flush45', 'flush', 1.74, None), ('flush40', 'flush', HW * math.tan(math.radians(40)), None), ('gable10', 'gable', 1.74, 10)):
    H[:] = lanH(h); ER0h, _ = energy(RP, RN, 20) if abs(h - 1.74) > 1e-6 else (ER0, None)
    mods, Hn, th = layout(kind, h, tilt); H[:] = Hn
    E, Eun = energy(np.array([p for m in mods for p in m['pts']]), np.array([[m['sg'] * math.sin(th), 0, math.cos(th)] for m in mods]), 20 if kind == 'flush' else 29)
    ER, _ = energy(RP, RN, 20)
    for m, e, u in zip(mods, E, Eun): m['kwh'] = round(float(e), 1); m['loss'] = round(float(1 - e / u) * 100, 1)
    dR = ER0h - ER; side = {s: [m for m in mods if m['side'] == s] for s in 'EW'}
    T = dict(kind=kind, h=round(h, 2), tilt=round(math.degrees(th), 1), n=len(mods), kwp=round(len(mods) * 0.73, 1), mwh=round(float(E.sum()) / 1000, 1), y=round(float(E.sum()) / len(mods) / 0.73),
             E=dict(n=len(side['E']), y=round(sum(m['kwh'] for m in side['E']) / len(side['E']) / 0.73)), W=dict(n=len(side['W']), y=round(sum(m['kwh'] for m in side['W']) / len(side['W']) / 0.73)),
             roof_loss=round(float(dR.sum()) / 1000, 1), roof_hit=int((dR > 5).sum()), roof_max=round(float((dR / ER0h).max()) * 100, 1),
             roof_base=round(float(ER0h.sum()) / 1000, 1), ridge=round(max(m['zt'] for m in mods), 2), eave=round(mods[0]['zbm'], 2), width=round(2 * mods[0]['xb'], 2),
             perlan=[dict(no=i + 1, n=sum(1 for m in mods if m['l'] == i + 1), mwh=round(sum(m['kwh'] for m in mods if m['l'] == i + 1) / 1000, 1)) for i in range(len(LANS))])
    T['net'] = round(T['mwh'] - T['roof_loss'], 1)
    OUT['var'][key] = dict(T=T, geo=dict(xt=mods[0]['xt'], zt=mods[0]['zt'], xb=mods[0]['xb'], zb=mods[0]['zbm']), mods=[[m['l'], m['side'], round(m['y'], 3), m['kwh'], m['loss']] for m in mods], dR=[round(float(x), 1) for x in dR])
    print(key, {k: v for k, v in T.items() if k != 'perlan'}, T['perlan'])
H[:] = H0
json.dump(OUT, open('calc/lantern_gable.json', 'w'), ensure_ascii=False)
