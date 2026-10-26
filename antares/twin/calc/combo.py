# -*- coding: utf-8 -*-
"""КОМБІНОВАНИЙ: верхній ряд козирків 25° під парапетом (Пд 14,70 м, Сх 14,00 м) + вертикальні модулі впритул нижче, низ ≥ 4,0 м.
Верх вертикальних — на 1,10 м нижче верху козирка (під нижньою пластиною консолі). Тінь козирка на вертикальні модулі: пряме — профільний кут, розсіяне — sin(φc). Антарес, 26.10.2026.
Розкладка: ряди знизу вгору, у кожному ряду — альбомна (2 384 × 1 303) або книжкова (1 303 × 2 384) орієнтація; висоти рядів добирає
динамічне програмування (максимум модулів), у ряду — зліва направо в перший вільний проміжок. Обходимо вікна, ворота, жалюзі (+0,10 м),
сходи, вентканал, спуски лотків УЗЕ, кабелі на «лапках» (схід, північ). Генерація — модель як у двійнику (U 20 — на стіні з повітряним зазором)."""
import json, math, numpy as np
SRC = open('/home/claude/work/sun/irr.py', encoding='utf-8').read(); exec(SRC[:SRC.find('# ---------- точки')])
st = open('/home/claude/work/sun/stats.py', encoding='utf-8').read(); ns = {'np': np}; exec(st[st.find('up = lambda'):st.find('NAMES =')], ns); OPN = ns['OPN']
LM, DM, G2, MRG, H0 = 2.384, 1.303, 0.02, 0.10, 4.0; ALB = 0.2
def arch_top(x): return float(roofZ(min(96.64, max(0.0, x)))) + 1.2
CAN = {'S': 14.70, 'E': 14.00}; CA, CD = 1.303 * math.cos(math.radians(25)), 1.303 * math.sin(math.radians(25))   # виліт 1,181, перепад 0,551
FAC = {
  'S': dict(nw=(0, -1, 0), P=lambda s, h: (s, -0.5 - 0.15, h), segs=[(0.05, 58.2), (65.9, 96.55)], top=lambda s: min(arch_top(s) - 0.10, CAN['S'] - 1.10), extra=[]),
  'E': dict(nw=(1, 0, 0), P=lambda s, h: (96.64 + 0.15, s, h), segs=[(-0.4, 53.6), (54.6, 62.9), (64.2, 73.6), (74.4, 96.5)], top=lambda s: min(HV + 0.5 - 0.10, CAN['E'] - 1.10),
            extra=[(30.0, 96.6, 5.25, 6.45), (-0.4, 34.6, 0, 4.6)])}
RECT = {k: [(o[0] - MRG, o[1] + MRG, o[2] - MRG, o[3] + MRG) for o in OPN[k]] + [tuple(e) for e in FAC[k]['extra']] for k in FAC}
def blocked(k, a, b, h0, h1):
    for x0, x1, y0, y1 in RECT[k]:
        if a < x1 and b > x0 and h0 < y1 and h1 > y0: return True
    return False
def row(k, h0, W, H):
    out = []
    for a0, b0 in FAC[k]['segs']:
        s = a0
        while s + W <= b0 + 1e-9:
            if s + W <= b0 and h0 + H <= min(FAC[k]['top'](s), FAC[k]['top'](s + W)) and not blocked(k, s, s + W, h0, h0 + H): out.append((s, h0, W, H)); s += W + G2
            else: s += 0.05
    return out
def plan(k):
    hs = np.round(np.arange(H0, 17.5, 0.05), 3); memo = {}
    def f(i):
        if i >= len(hs): return (0, [])
        if i in memo: return memo[i]
        best = f(i + 1)
        for W, H in ((LM, DM), (DM, LM)):
            r = row(k, hs[i], W, H)
            if not r: continue
            j = i + int(round((H + G2) / 0.05)); c, rest = f(j)
            if c + len(r) > best[0]: best = (c + len(r), r + rest)
        memo[i] = best; return best
    import sys; sys.setrecursionlimit(10000)
    return f(0)[1]
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA
LOSS = (1 - .025) * (1 - .015) * (1 - .01) * (1 - .035) * (1 - .03) * (1 - .015) * (1 - .01); GAMT = -0.003; PW, U, ETA = 0.730, 20, 0.235
modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS, 0)
RES = {}
for k, F in FAC.items():
    M = plan(k); nw = np.array(F['nw'], float)
    P = np.array([F['P'](s + W / 2, h + H / 2) for s, h, W, H in M])
    HOR = np.zeros((len(P), NA), np.float32)
    for a in range(NA):
        X = P[:, 0:1] + math.sin(AZ[a]) * DS[None, :]; Y = P[:, 1:2] + math.cos(AZ[a]) * DS[None, :]
        HOR[:, a] = np.maximum(np.arctan2(Hat(X, Y) - P[:, 2:3], DS[None, :]).max(axis=1), 0)
    SVF = np.zeros(len(P))
    for a in range(NA):
        for e in EL:
            v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); c = float(nw @ v)
            if c > 0: SVF += c * math.cos(e) * dEl * dAz / math.pi * (e > HOR[:, a])
    CT = CAN[k]; ys = np.array([[h + H * t for t in np.linspace(0.05, 0.95, 7)] for s, h, W, H in M])      # точки по висоті модуля
    gap = (CT - CD) - ys; RD = (gap / np.sqrt(gap ** 2 + (CA - 0.03) ** 2)).mean(axis=1)                       # розсіяне: частка неба під козирком
    SVF = SVF * RD
    E = np.zeros(len(P)); POA = np.zeros(len(P)); Eun = np.zeros(len(P))
    for Wm in WX['mo']:
        wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
        for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
            dv = np.array([ex, ey, sz]); cosb = max(float(nw @ dv), 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
            az = math.atan2(ex, ey); el = math.asin(max(-1, min(1, sz))); f_ = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(f_) % NA; a1 = (a0 + 1) % NA; t = f_ - int(f_)
            vis = el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t
            o_ = float(nw @ dv); litc = ((ys + (CA - 0.03) * sz / max(o_, 1e-6)) < (CT - CD)).mean(axis=1) if o_ > 0 else np.ones(len(P))
            vis = vis * litc
            pc = (Dn * cosb + Dd * Ai * cosb / cz) * vis + Dd * (1 - Ai) * SVF + Gh * ALB * 0.5; po = c_ * Gh * SVF + c_ * Gh * ALB * 0.5
            E += wt * (p_ * modP(pc, ta) + (1 - p_) * modP(po, ta)); POA += wt / 1000 * (p_ * pc + (1 - p_) * po)
    n = len(M); nL = sum(1 for m in M if m[2] > 2); RES[k] = dict(n=n, land=nL, port=n - nL, kwp=round(n * PW, 2), kwh=round(float(E.sum())), kwh_kwp=round(float(E.sum()) / (n * PW)) if n else 0,
                                                                   poa=round(float(POA.mean())), area=round(n * LM * DM), mods=[[round(s, 3), round(h, 3), W, H, round(float(e), 1)] for (s, h, W, H), e in zip(M, E)])
    rows = sorted(set(round(m[1], 2) for m in M))
    print(k, {x: RES[k][x] for x in ('n', 'land', 'port', 'kwp', 'kwh', 'kwh_kwp', 'poa', 'area')}, 'rows at', rows)
json.dump(RES, open('/home/claude/work/sun/combo.json', 'w'), ensure_ascii=False)
