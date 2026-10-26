# -*- coding: utf-8 -*-
"""Дах цеху — нова розкладка модулів (26.10.2026, 21:50): вентиляцію (42 дефлектори/шахти з креслень) з даху прибрано;
лишаються ліхтарі, рама 11 кондиціонерів, портал і вихід на дах; враховано тінь західної будівлі (+6,8 м), парапетів, сходів.
Сітка — та сама, що в остаточній розкладці 25.10 (62 колонки між лагами × 36 рядів по 2,4 м, проходи 2,56 м): 2 232 місця.
Для кожного місця — річна енергія модуля з тінню і без (3 точки по довжині модуля, горизонт 72 напрями, модель двійника).
Виключаємо: ліхтарі (як 25.10), зону кондиціонерів і доступу, модулі з втратою від тіні понад поріг."""
import json, math, sys, numpy as np, collections
WITH_VENTS = '--vents' in sys.argv
SRC = open('calc/irr.py', encoding='utf-8').read()
SRC = SRC[:SRC.find('# ---------- точки')].replace("for o in S['obs']:", "for o in (S['obs'] if WITH_VENTS else []):")
exec(open('calc/lan_tri.py', encoding='utf-8').read()); assert LAN_OLD in SRC; SRC = SRC.replace(LAN_OLD, LAN_NEW)
exec(SRC)
ALB = 0.2
D = json.load(open('/tmp/claude-0/-home-claude/a46e64fa-3229-5beb-8862-98d878ef89e1/scratchpad/bz/dv.json')); NM = D['nm']; L = NM['lines']; MM = NM['mods']
ROWS = sorted(set(m[2] for m in MM)); LAN = NM['lan']
COLS = sorted({(L[m[0]][0], L[m[1]][0], L[m[0]][3], L[m[0]][4]) for m in MM})
present = {(L[m[0]][0], L[m[1]][0], m[2]) for m in MM}
ov = lambda a0, a1, b0, b1: a0 < b1 and b0 < a1
ZONES = [dict(n='рама кондиціонерів + 1 м, прохід від виходу на дах і труби', x=(60.1, 65.5), y=(2.0, 20.5)),
         dict(n='стійки порталу + 0,3 м', x=(57.6, 60.9), y=(0.3, 3.0)),
         dict(n='прохід від дверей західної будівлі (1,5 м)', x=(-0.2, 1.5), y=(85.0, 88.0))]
cand = []
for xa, xb, arch_i, side in COLS:
    for y in ROWS:
        r = (xa / 1000, xb / 1000, (y - 1192) / 1000, (y + 1192) / 1000)          # y у розкладці — центр модуля (лаги 2,282–31,082 = ряди 3,482…29,882 ± 1,192)
        lan = any(ov(xa, xb, l[0] - 1000, l[1] + 1000) and ov(y - 1192, y + 1192, l[2] - 2000, l[3] + 2000) for l in LAN) and (xa, xb, y) not in present
        zone = next((z['n'] for z in ZONES if ov(r[0], r[1], *z['x']) and ov(r[2], r[3], *z['y'])), None)
        cand.append(dict(xa=r[0], xb=r[1], y=y / 1000, y0=r[2], arch=arch_i, side=side, old=(xa, xb, y) in present, lan=lan, zone=zone))
print('grid', len(cand), 'old', sum(c['old'] for c in cand), 'lantern', sum(c['lan'] for c in cand), 'zone', sum(1 for c in cand if c['zone'] and not c['lan']))
C = [c for c in cand if not c['lan']]
# точки і нормалі
P = []; NRM = []
for c in C:
    xm = (c['xa'] + c['xb']) / 2; za, zb = float(roofZ(c['xa'])), float(roofZ(c['xb'])); k = (zb - za) / (c['xb'] - c['xa'])
    n = np.array([-k, 0, 1.0]) / math.hypot(k, 1); c['tilt'] = round(math.degrees(math.atan(abs(k))), 1)
    for t in (-0.892, 0.0, 0.888): P.append((xm, c['y'] + t, (za + zb) / 2 + 0.15))
    NRM.append(n)
P = np.array(P); NRM = np.array(NRM); NP = len(P); NMOD = len(C)
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
HOR = np.zeros((NP, NA), np.float32)
for b0 in range(0, NP, 600):
    p = P[b0:b0 + 600]
    for a in range(NA):
        X = p[:, 0:1] + math.sin(AZ[a]) * DS[None, :]; Y = p[:, 1:2] + math.cos(AZ[a]) * DS[None, :]
        HOR[b0:b0 + len(p), a] = np.maximum(np.arctan2(Hat(X, Y) - p[:, 2:3], DS[None, :]).max(axis=1), 0)
N3 = np.repeat(NRM, 3, axis=0)
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA
SVF = np.zeros(NP); SVF0 = np.zeros(NP)
for a in range(NA):
    for e in EL:
        v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); cc = N3 @ v
        w = np.where(cc > 0, cc, 0) * math.cos(e) * dEl * dAz / math.pi; SVF0 += w; SVF += w * (e > HOR[:, a])
SVFm = SVF.reshape(-1, 3).mean(1); SVF0m = SVF0.reshape(-1, 3).mean(1)
LOSS = (1 - .025) * (1 - .015) * (1 - .01) * (1 - .035) * (1 - .03) * (1 - .015) * (1 - .01); GAMT = -0.003; PW, U, ETA = 0.730, 20, 0.235
modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS, 0)
E = np.zeros(NMOD); Eun = np.zeros(NMOD); Emo = np.zeros((12, NMOD))
for mo, Wm in enumerate(WX['mo']):
    wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
    for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
        dv = np.array([ex, ey, sz]); cosb = np.maximum(NRM @ dv, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
        az = math.atan2(ex, ey); el = math.asin(max(-1, min(1, sz))); f = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(f) % NA; a1 = (a0 + 1) % NA; t = f - int(f)
        lit = (el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t).reshape(-1, 3).mean(1)
        beam = Dn * cosb + Dd * Ai * cosb / cz; gr = Gh * ALB * (1 - NRM[:, 2]) / 2; Go = c_ * Gh
        pc = beam * lit + Dd * (1 - Ai) * SVFm + gr; po = Go * SVFm + Go * ALB * (1 - NRM[:, 2]) / 2
        uc = beam + Dd * (1 - Ai) * SVF0m + gr; uo = Go * SVF0m + Go * ALB * (1 - NRM[:, 2]) / 2
        e = wt * (p_ * modP(pc, ta) + (1 - p_) * modP(po, ta)); E += e; Emo[mo] += e; Eun += wt * (p_ * modP(uc, ta) + (1 - p_) * modP(uo, ta))
for i, c in enumerate(C): c['kwh'] = round(float(E[i]), 1); c['loss'] = round(float(1 - E[i] / Eun[i]) * 100, 2)
tag = 'vents' if WITH_VENTS else 'novents'
json.dump(dict(cand=C, zones=ZONES, lan_removed=sum(c['lan'] for c in cand)), open(f'calc/roof_{tag}.json', 'w'), ensure_ascii=False)
old = [c for c in C if c['old']]; print(tag, 'old layout', len(old), round(sum(c['kwh'] for c in old) / 1000, 1), 'MWh')
for thr in (5, 10, 15, 100):
    sel = [c for c in C if not c['zone'] and c['loss'] <= thr]
    print(f'thr {thr}%: {len(sel)} mods, {sum(c["kwh"] for c in sel)/1000:.1f} MWh, kWh/kWp {sum(c["kwh"] for c in sel)/(len(sel)*0.73):.0f}, new vs old: +{sum(1 for c in sel if not c["old"])} -{sum(1 for c in old if c not in sel)}')
