# -*- coding: utf-8 -*-
"""Ідея власника 27.10, 21:44: модулі на місці ліхтарів, що не входять у стрінги по 11 (21 місце в розкладці 13°),
підключити напряму до світлодіодних світильників під колишнім ліхтарем — «світять, коли є сонце».
Рахуємо по кроках 10 хв (та сама модель): потужність кожного модуля окремо (без стрінга — без втрат на різну освітленість),
світловий потік, освітленість цеху, години за рік, частка в робочі години. Порівняння: об'єднати залишки між ліхтарями в стрінги (308).
→ v3/led13.json"""
import os, sys, json, math, numpy as np
os.environ['TILT'] = '13'
sys.path.insert(0, '/home/claude/work/sun/v3'); import lan22 as L
V = L.V; LM, DM = L.LM, L.DM; st_, ct = L.st_, L.ct
R = json.load(open(V + 'lan13_mount.json')); J = json.load(open(V + 'lan22_t13.json'))['modes']['V1']
F = J['F']; MODS = R['mods']; used = set(R['used'])
FREE = [k for k in range(len(MODS)) if k not in used]
# ---------- припущення (немає в даних — позначено в звіті)
EFF_LED = 150.0      # лм/Вт — промисловий світлодіодний світильник (типове значення, уточнити в постачальника)
ETA_DRV = 0.92       # ККД DC/DC-драйвера з пошуком максимальної потужності (оцінка)
UF = 0.65            # коефіцієнт використання світлового потоку у високому цеху (оцінка)
SHOP = 96.64 * 96.59 # площа цеху в плані, м² (модель)
WORK = (8.0, 17.0)   # робочі години (оцінка, уточнити графік), будні 5 з 7
GLASS = 1115.0       # площа скління ліхтарів зараз, м² (calc/v3/lan22, README)
P = []; N = []
for k in FREE:
    m = MODS[k]; Ln = F[m['l'] - 1]; sg = 1 if m['side'] == 'E' else -1; nrm = np.array([sg * st_, 0, ct]); N.append(nrm)
    for f_ in (0.2, 0.5, 0.8):
        um = 0.02 + LM * f_; P.append((Ln['xc'] + sg * um * ct + nrm[0] * 0.30, m['y'] + DM / 2, Ln['ridge'] - um * st_ + nrm[2] * 0.30))
P = np.array(P); N = np.array(N); n = len(N)
# ---------- покроково, з годиною доби (як lan22.run_steps)
HOR = L.horizon(P); N3 = np.repeat(N, 3, axis=0); SVF, _ = L.svf(HOR, N3); SVFm = SVF.reshape(-1, 3).mean(1)
modP = lambda poa, ta: np.where(poa > 0, L.PW * poa / 1000 * (1 + L.GAMT * (ta + poa * 0.9 * (1 - L.ETA) / 20 - 25)) * L.LOSS, 0)
rows = []   # (міс, година, вага-годин, ймовірність ясно, P ясно кВт, P хмарно кВт)
for mo, Wm in enumerate(L.WX['mo']):
    wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
    for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
        bx, by = L.tobld(ex, ey); dv = np.array([bx, by, sz]); cosb = np.maximum(N @ dv, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
        az = math.atan2(bx, by); el = math.asin(max(-1, min(1, sz))); fa = (az % (2 * math.pi)) / (2 * math.pi) * L.NA; a0 = int(fa) % L.NA; a1 = (a0 + 1) % L.NA; t = fa - int(fa)
        lit = (el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t).reshape(-1, 3)
        beam = Dn * cosb + Dd * Ai * cosb / cz; gr = Gh * L.ALB * (1 - N[:, 2]) / 2; Go = c_ * Gh
        litm = 0.5 * (lit.mean(1) + lit.min(1)); pc = beam * litm + Dd * (1 - Ai) * SVFm + gr; po = Go * SVFm + Go * L.ALB * (1 - N[:, 2]) / 2
        rows.append((mo, h, wt, p_, float(modP(pc, ta).sum()), float(modP(po, ta).sum())))
A = np.array(rows); wt, pcl, Pc, Po = A[:, 2], A[:, 3], A[:, 4], A[:, 5]; hr = A[:, 1]
E = float((wt * (pcl * Pc + (1 - pcl) * Po)).sum())                     # кВт·год за рік (21 модуль окремо)
inwork = (hr >= WORK[0]) & (hr < WORK[1])
Ework = float((wt * (pcl * Pc + (1 - pcl) * Po))[inwork].sum()) * 5 / 7
kwp = n * L.PW
lm = lambda p: p * 1000 * ETA_DRV * EFF_LED                              # кВт → лм
lux = lambda p: lm(p) * UF / SHOP
need = lambda e: e * SHOP / UF / (ETA_DRV * EFF_LED) / 1000            # кВт світильників для освітленості e на весь цех
# години, коли освітленість від цих модулів ≥ порогу (усі світлові години і робочі)
def hours(thr, work=False):
    m = inwork if work else np.ones(len(A), bool); f = 5 / 7 if work else 1
    return float(((wt * pcl) * (lux(Pc) >= thr) + (wt * (1 - pcl)) * (lux(Po) >= thr))[m].sum()) * f
daylight = float(wt[(Pc > 0) | (Po > 0)].sum())
peak = float(Pc.max())
# червень, ясний полудень; грудень, хмарно, полудень
def at(mo, hh, clear):
    i = np.argmin(np.abs(A[:, 1] - hh) + 100 * (A[:, 0] != mo)); return float(Pc[i] if clear else Po[i])
cases = {k: at(*v) for k, v in dict(jun_clear=(5, 13.0, True), jun_cloud=(5, 13.0, False), dec_clear=(11, 12.5, True), dec_cloud=(11, 12.5, False), mar_clear=(2, 12.5, True)).items()}
OUT = dict(n=n, kwp=round(kwp, 2), kwh=round(E), kwh_work=round(Ework), peak_kw=round(peak, 2), daylight_h=round(daylight),
           cases={k: dict(kw=round(v, 2), klm=round(lm(v) / 1000), lux=round(lux(v))) for k, v in cases.items()},
           hours={str(t): dict(all=round(hours(t)), work=round(hours(t, True))) for t in (25, 50, 100, 150)},
           need={str(e): round(need(e), 1) for e in (100, 200, 300)},
           mods_for_300_clear=math.ceil(need(300) / (cases['jun_clear'] / n)), mods_for_300_cloud=math.ceil(need(300) / max(cases['jun_cloud'] / n, 1e-6)),
           sky=dict(glass=GLASS), pooled=dict(n=R['max']['n'], mwh=R['max']['mwh'], base_n=R['n'], base_mwh=R['mwh']),
           per_lan={l: sum(1 for k in FREE if MODS[k]['l'] == l) for l in range(1, 5)},
           assume=dict(eff=EFF_LED, drv=ETA_DRV, uf=UF, shop=round(SHOP), work=WORK))
OUT['curves'] = {str(mo): [[round(float(r[1]), 3), round(float(r[4]), 3), round(float(r[5]), 3)] for r in A if int(r[0]) == mo] for mo in (2, 5, 11)}
OUT['mo_kwh'] = [round(float((wt * (pcl * Pc + (1 - pcl) * Po))[A[:, 0] == mo].sum())) for mo in range(12)]
json.dump(OUT, open(V + 'led13.json', 'w'), ensure_ascii=False, indent=1)
print({k: v for k, v in OUT.items() if k not in ('curves',)})
