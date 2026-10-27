# -*- coding: utf-8 -*-
"""Фасадні модулі на геометрії розрізу 1-1 (27.10.2026): будівля на ≈2 м вища, ніж у моделі 26.10.
Південь — вертикально (s_opt.py → gen_s.py), схід — козирок 25° під парапетом + вертикально нижче (combo.py).
Правила 26.10 (рішення власника 21:32–21:40): на сході прибрано нижній ряд над ТП-5913 і книжкові між вікнами; стрінги по 11 — без найслабших.
Козирок сходу: верх на 0,31 м нижче верху парапету (як 26.10), U 29, втрати 11,4 % — як у fac25.py.
Вікна, ворота, кабелі — як у моделі 26.10 (оцінка за фото); на розрізі 1-1 на стіні сходу є позначки 1,2 / 3,6 / 7,23 / 10,13 м — можливо, вікна (звірити)."""
import json, math, numpy as np
SRC = open('/home/claude/work/sun/irr.py', encoding='utf-8').read(); exec(SRC[:SRC.find('# ---------- точки')])
D = '/home/claude/work/sun/'
VS = json.load(open(D + 'vert_s2.json'))['S']['mods']; CB = json.load(open(D + 'combo.json'))['E']['mods']
CAN_E = round(ZE - 0.31, 2)
# ---------- козирок сходу (один ряд під парапетом)
BETA = 25.0; DM, LM, GAP = 1.303, 2.384, 0.02; PM = LM + GAP; cb, sb = math.cos(math.radians(BETA)), math.sin(math.radians(BETA))
SEGS = [(-0.4, 53.6), (54.6, 62.9), (64.2, 73.6), (74.4, 96.5)]
nw = np.array([1.0, 0, 0]); nn = nw * sb + np.array([0, 0, 1.0]) * cb
C = []
for a, b in SEGS:
    m = int((b - a + GAP) // PM); s0 = a + ((b - a) - (m * PM - GAP)) / 2
    for i in range(m): sc = s0 + i * PM + LM / 2; C.append((round(sc, 3), np.array([96.64 + DM * cb / 2, sc, CAN_E - DM * sb / 2])))
NA = 72; AZ = np.radians(np.arange(NA) * 360 / NA); DS = np.concatenate([np.arange(0.25, 20, 0.25), np.arange(20, 60, 0.5), np.arange(60, 170, 1.0)])
EL = np.radians(np.arange(2.5, 90, 5)); dEl = math.radians(5); dAz = 2 * math.pi / NA; ALB = 0.2
LOSS_A = 0.975 * 0.985 * 0.99 * 0.98 * 0.975 * 0.985 * 0.99; GAMT = -0.003; PW, U, ETA = 0.730, 29, 0.235
modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS_A, 0)
P = np.array([c[1] for c in C]); HOR = np.zeros((len(P), NA), np.float32)
for a in range(NA):
    X = P[:, 0:1] + math.sin(AZ[a]) * DS[None, :]; Y = P[:, 1:2] + math.cos(AZ[a]) * DS[None, :]
    HOR[:, a] = np.maximum(np.arctan2(Hat(X, Y) - P[:, 2:3], DS[None, :]).max(axis=1), 0)
SVF = np.zeros(len(P))
for a in range(NA):
    for e in EL:
        v = np.array([math.sin(AZ[a]) * math.cos(e), math.cos(AZ[a]) * math.cos(e), math.sin(e)]); c = float(nn @ v)
        if c > 0: SVF += c * math.cos(e) * dEl * dAz / math.pi * (e > HOR[:, a])
Ec = np.zeros(len(P)); Emc = np.zeros((12, len(P)))
for mo, Wm in enumerate(WX['mo']):
    wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
    for h, ex, ey, sz, G, Dn, Dd, ext, ta in Wm['st']:
        dv = np.array([ex, ey, sz]); cosb = max(float(nn @ dv), 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
        az = math.atan2(ex, ey); el = math.asin(max(-1, min(1, sz))); f = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(f) % NA; a1 = (a0 + 1) % NA; t = f - int(f)
        vis = el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t
        beam = Dn * cosb + Dd * Ai * cosb / cz; gr = G * ALB * (1 - cb) / 2; Go = c_ * G
        e = wt * (p_ * modP(beam * vis + Dd * (1 - Ai) * SVF + gr, ta) + (1 - p_) * modP(Go * SVF + Go * ALB * (1 - cb) / 2, ta)); Ec += e; Emc[mo] += e
CAN = [dict(s=s, kwh=round(float(Ec[i]), 1), mo=[round(float(x), 1) for x in Emc[:, i]]) for i, (s, _) in enumerate(C)]
# ---------- вертикальні: схід — без нижнього ряду над ТП і книжкових між вікнами (ряди нижче 8 м)
EV = [dict(s=m[0], h=m[1], W=m[2], H=m[3], kwh=m[4], mo=m[5]) for m in CB]; EVrow = [m for m in EV if m['h'] < 8.0]; EV = [m for m in EV if m['h'] >= 8.0]
SV = [dict(s=m[0], h=m[1], W=m[2], H=m[3], kwh=m[4], mo=m[5]) for m in VS]
def fit(L):
    L = sorted(L, key=lambda m: -m['kwh']); n = len(L) // 11 * 11; return L[:n], L[n:]
SVk, SVrm = fit(SV); EVk, EVrm = fit(EV); CNk, CNrm = fit(CAN)
def label(L, pre, key):
    L = sorted(L, key=key)
    for i, m in enumerate(L): m['lab'] = f'{pre}{i // 11 + 1}'
    return [L[i:i + 11] for i in range(0, len(L), 11)]
strS = label(SVk, 'С', lambda m: (round(m['h'] / 2.4), m['s'])); strEv = label(EVk, 'В', lambda m: (round(m['h'], 1), m['s'])); strC = label(CNk, 'К', lambda m: m['s'])
sm = lambda L: dict(n=len(L), kwp=round(len(L) * 0.73, 2), kwh=round(sum(m['kwh'] for m in L)), kwh_kwp=round(sum(m['kwh'] for m in L) / max(1, len(L) * 0.73)))
T = dict(S=sm(SVk), Ev=sm(EVk), Ec=sm(CNk)); T['E'] = sm(EVk + CNk); T['all'] = sm(SVk + EVk + CNk)
T['rm'] = dict(E_bottom=sum(1 for m in EVrow if m['W'] > 2), E_between=sum(1 for m in EVrow if m['W'] < 2), E_rows_kwh=round(sum(m['kwh'] for m in EVrow)),
               Ev_str=len(EVrm), Ec_str=len(CNrm), S_str=len(SVrm), str_kwh=round(sum(m['kwh'] for m in SVrm + EVrm + CNrm)))
MO = {k: [round(sum(m['mo'][i] for m in L)) for i in range(12)] for k, L in (('S', SVk), ('Ev', EVk), ('Ec', CNk))}
nV = len(SVk) + len(EVk); nL = sum(1 for m in SVk + EVk if m['W'] > 2)
FACPV = dict(can=[['E', 0, CAN_E, m['s'], m['kwh'], m.get('lab', '')] for m in sorted(CNk, key=lambda m: m['s'])],
             vert=[['S', m['s'], m['h'], m['W'], m['H'], m['kwh'], m.get('lab', '')] for m in SVk] + [['E', m['s'], m['h'], m['W'], m['H'], m['kwh'], m.get('lab', '')] for m in EVk],
             tot=T, mount={'d': 0.9, 'oc': 0.93, 'V1': 4.61, 'V2': -2.06, 'A_ten': 3.03, 'A_shear': 3.29},
             vmount={'qp': 0.733, 'cp': -1.4, 'Wk': 3.19, 'Wd': 4.78, 'anc_t': 1.2, 'Gk': 0.36, 'wall': 0.16, 'rails': nV * 2, 'rail_m': round(nV * 2.8), 'anchors': nV * 4,
                     'nL': nL, 'nP': nV - nL, 'can_cons': len(CNk) * 2, 'can_anch': len(CNk) * 8},
             rows=[dict(f='E', top=CAN_E)], strings=dict(S=len(strS), Ev=len(strEv), Ec=len(strC)), mo=MO, geo='розріз 1-1, 27.10', ze=round(ZE, 2))
open('/home/claude/work/twin/facpvdata.js', 'w', encoding='utf-8').write('const FACPV=' + json.dumps(FACPV, ensure_ascii=False, separators=(',', ':')) + ';')
json.dump(dict(FACPV=FACPV, Srm=[[m['s'], m['h'], m['W'], m['H'], m['kwh']] for m in SVrm], Evrm=[[m['s'], m['h'], m['W'], m['H'], m['kwh']] for m in EVrm],
               Erow_rm=[[m['s'], m['h'], m['W'], m['H'], m['kwh']] for m in EVrow], canrm=[m['s'] for m in CNrm]), open(D + 'final_fac_v2.json', 'w'), ensure_ascii=False)
print('CAN_E', CAN_E, 'ZE', round(ZE, 2), 'canopy', len(CAN), '→', len(CNk))
for k, v in T.items(): print(k, v)
print('strings', FACPV['strings'], 'mo', {k: sum(v) for k, v in MO.items()})
