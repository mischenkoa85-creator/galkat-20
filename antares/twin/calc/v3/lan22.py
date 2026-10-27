# -*- coding: utf-8 -*-
"""Ліхтарі цеху Антарес: розібрати полікарбонатний «домік» (3,66 × 1,89 м за рулеткою) і на сталевому каркасі зробити двосхилий дах ≈22°
(кут — за словами власника 27.10, 17:09, оглядав ліхтар зсередини; фото 112235–112246), модулі на обидва схили (схід / захід).
Варіанти:
  base — як зараз (v3): ліхтарі-«доміки» 3,66 × 1,89, модулів на ліхтарях немає (перевірка: А = 1 639 модулів, 1 092,9 МВт·год);
  G1   — «горизонтально»: модуль довгою стороною вздовж ліхтаря, 1 ряд на схил, каркас на ширину ліхтаря 3,66 м (гребінь +0,74 над карнизом);
  V1   — «вертикально»: модуль довгою стороною вгору по схилу, 1 ряд на схил; каркас ширший — 4,44 м (виліт по 0,39 м за нинішній ліхтар);
  G2   — довідково: «горизонтально» 2 ряди на схил, каркас 4,89 м.
Карниз (низ модуля) — на 0,30 м над покрівлею біля ліхтаря (оцінка: висоти бортика ліхтаря немає в даних).
Для кожного варіанта: тіні на модулі даху перераховано з новою (нижчою) формою ліхтаря, місця даху біля ширшого каркаса — заново
(ліхтар + 0,25 м); варіант А (усі вільні місця) → стрінги по 11 з моделлю різної освітленості, як у layout_v3.py.
Модулі на ліхтарях — стрінги по 11 уздовж ліхтаря на кожному схилі, залишки — по боках (схід / захід) разом; що не набирає 11 — не ставимо.
→ v3/lan22.json"""
import json, math, sys, os, collections, numpy as np
sys.argv = ['x']
V = '/home/claude/work/sun/v3/'
SRC = open(V + 'roof_v3.py', encoding='utf-8').read()
TOP = SRC.split("if __name__ == '__main__':")[0]
LOOP = """for L in LAN:
    m = box(L['x0'], L['x1'], L['y0'], L['y1'])
    H[m] = np.maximum(RZ[m], L['zb'] + L['h'] * (1 - np.abs(XX[m] - L['xc']) / (LW / 2)))"""
assert LOOP in TOP
ns = {}
exec(TOP.replace(LOOP, 'pass'), ns)                      # DSM без ліхтарів
H0 = ns['H'].copy(); H = ns['H']; XX, YY, RZ, box = ns['XX'], ns['YY'], ns['RZ'], ns['box']
LAN0 = ns['LAN']; LW0, LH0 = ns['LW'], ns['LH']; PR, DF, AC = ns['PR'], ns['DF'], ns['AC']
WX, NA, AZ, tobld = ns['WX'], ns['NA'], ns['AZ'], ns['tobld']
PW, GAMT, ETA, LOSS, ALB = ns['PW'], ns['GAMT'], ns['ETA'], ns['LOSS'], ns['ALB']
horizon, svf = ns['horizon'], ns['svf']
LM, DM, GAP = 2.384, 1.303, 0.022
TILT = 22.0; tg, ct, st_ = math.tan(math.radians(TILT)), math.cos(math.radians(TILT)), math.sin(math.radians(TILT))
CURB = 0.30; THK = 0.16                                   # низ модуля над покрівлею (оцінка); рейка 0,12 + модуль 0,035
VAL = 7.00 / 1.2 / 44.89 * 0.975; COST = 250.0
MODES = {
    'base': dict(name='Як зараз: ліхтарі 3,66 × 1,89 («домік»), без модулів на ліхтарях', half=LW0 / 2),
    'G1': dict(name='Горизонтально, 1 ряд на схил, каркас 3,66 м', half=LW0 / 2, rows=1, orient='L'),
    'V1': dict(name='Вертикально, 1 ряд на схил, каркас 4,44 м', half=(LM + 0.01) * ct, rows=1, orient='P'),
    'G2': dict(name='Горизонтально, 2 ряди на схил, каркас 4,89 м (довідково)', half=(2 * DM + GAP + 0.01) * ct, rows=2, orient='L'),
}
def build_dsm(mode):
    H[:] = H0; M = MODES[mode]; hw = M['half']; F = []
    for L in LAN0:
        x0, x1 = L['xc'] - hw, L['xc'] + hw; m = box(x0, x1, L['y0'], L['y1'])
        if mode == 'base':
            H[m] = np.maximum(RZ[m], L['zb'] + L['h'] * (1 - np.abs(XX[m] - L['xc']) / (LW0 / 2)))
            F.append(dict(x0=L['x0'], x1=L['x1'], y0=L['y0'], y1=L['y1'], xc=L['xc'], zb=L['zb'], ridge=L['zb'] + L['h']))
        else:
            ze = L['zb'] + CURB; zr = ze + hw * tg
            H[m] = np.maximum(RZ[m], (ze + (hw - np.abs(XX[m] - L['xc'])) * tg + THK).astype(np.float32))
            F.append(dict(x0=x0, x1=x1, y0=L['y0'], y1=L['y1'], xc=L['xc'], zb=L['zb'], ze=ze, ridge=zr))
    return F
# ---------- місця модулів на даху (як у roof_v3.py), виключення біля ліхтарів — за шириною каркаса
def roof_cands(F):
    MRG, LCX = 0.12, 0.25
    FAC = [p for p in PR if p['what'].startswith('грань')]
    ROWS = [3.482 + 2.406 * k for k in range(12)] + [34.845 + 2.406 * k for k in range(12)] + [66.208 + 2.406 * k for k in range(12)]
    ZONES = [dict(k='ac', x=tuple(AC['zone']['x']), y=tuple(AC['zone']['y'])), dict(k='exit', x=(62.0, 70.0), y=(-0.25, 3.6)),
             dict(k='exit', x=(63.5, 69.5), y=(-0.25, 6.5)), dict(k='door', x=(-0.6, 1.6), y=(85.0, 88.0)), dict(k='drain', x=(71.3, 72.9), y=(-0.25, 1.9))]
    ov = lambda a0, a1, b0, b1: a0 < b1 and b0 < a1
    def hitc(xa, xb, ya, yb, cx, cy, r):
        dx = max(xa - cx, 0, cx - xb); dy = max(ya - cy, 0, cy - yb); return dx * dx + dy * dy < r * r
    out = []
    for fi, p in enumerate(FAC):
        dx, dz = p['x1'] - p['x0'], p['z1'] - p['z0']; Ls = math.hypot(dx, dz); c, s = dx / Ls, dz / Ls; k = dz / dx
        n = int((Ls - 2 * MRG + GAP) // (DM + GAP)); used = n * DM + (n - 1) * GAP; st0 = (Ls - used) / 2
        for j in range(n):
            u0 = st0 + j * (DM + GAP); u1 = u0 + DM; xa, xb = p['x0'] + u0 * c, p['x0'] + u1 * c; um = (u0 + u1) / 2
            xm, zm = p['x0'] + um * c, p['z0'] + um * s
            for y in ROWS:
                ya, yb = y - LM / 2, y + LM / 2; why = None
                for L in F:
                    if ov(xa, xb, L['x0'] - LCX, L['x1'] + LCX) and ov(ya, yb, L['y0'] - 0.5, L['y1'] + 0.5): why = 'lan'
                if not why:
                    for o in DF:
                        if hitc(xa, xb, ya, yb, o['x'], o['y'], o['d'] / 2 + 0.3): why = 'defl'; break
                if not why: why = next((z['k'] for z in ZONES if ov(xa, xb, *z['x']) and ov(ya, yb, *z['y'])), None)
                if why is None:
                    out.append(dict(f=fi, j=j, xa=round(xa, 3), xb=round(xb, 3), xm=xm, zm=zm, y=y, k=k, tilt=round(math.degrees(math.atan(abs(k))), 1), face='W' if k > 0 else 'E'))
    return out
# ---------- покрокове моделювання (як layout_v3.run_steps)
def run_steps(P, NRM, U=20, k=3):
    HOR = horizon(P); N3 = np.repeat(NRM, k, axis=0); SVF, SVF0 = svf(HOR, N3); SVFm = SVF.reshape(-1, k).mean(1)
    modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS, 0)
    steps = []; I = np.zeros(len(NRM))
    for mo, Wm in enumerate(WX['mo']):
        wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
        for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
            bx, by = tobld(ex, ey); dv = np.array([bx, by, sz]); cosb = np.maximum(NRM @ dv, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
            az = math.atan2(bx, by); el = math.asin(max(-1, min(1, sz))); fa = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(fa) % NA; a1 = (a0 + 1) % NA; t = fa - int(fa)
            lit = (el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t).reshape(-1, k)
            beam = Dn * cosb + Dd * Ai * cosb / cz; gr = Gh * ALB * (1 - NRM[:, 2]) / 2; Go = c_ * Gh
            litm = 0.5 * (lit.mean(1) + lit.min(1)); pc = beam * litm + Dd * (1 - Ai) * SVFm + gr; po = Go * SVFm + Go * ALB * (1 - NRM[:, 2]) / 2
            steps.append((mo, wt, p_, modP(pc, ta), pc, modP(po, ta))); I += wt * (p_ * pc + (1 - p_) * po) / 1000
    return steps, I
def mod_kwh(steps, n):
    E = np.zeros(n)
    for mo, wt, p_, Pc, pc, Po in steps: E += wt * (p_ * Pc + (1 - p_) * Po)
    return E
def string_energy(steps, ids):
    ids = np.array(ids); E = 0.0; Esum = 0.0; Emo = np.zeros(12)
    for mo, wt, p_, Pc, pc, Po in steps:
        I = pc[ids]; Psum = Pc[ids].sum(); Pov = Po[ids].sum()
        if Psum > 0:
            Is = np.sort(I)[::-1]; best = max(Is[n] * (n + 1) for n in range(len(Is))); f = best / I.sum() if I.sum() > 0 else 0
        else: f = 1.0
        e = wt * (p_ * Psum * f + (1 - p_) * Pov); E += e; Emo[mo] += e; Esum += wt * (p_ * Psum + (1 - p_) * Pov)
    return E, Esum, Emo
def roof_strings(C):
    byf = collections.defaultdict(list)
    for i, c in enumerate(C): byf[c['f']].append(i)
    S_ = []; left = collections.defaultdict(list)
    for f, ii in sorted(byf.items()):
        cols = collections.defaultdict(list)
        for i in ii: cols[C[i]['j']].append(i)
        order = []
        for n, j in enumerate(sorted(cols)): order += sorted(cols[j], key=lambda i: C[i]['y'] * (1 if n % 2 == 0 else -1))
        m = len(order) // 11; S_ += [order[s * 11:(s + 1) * 11] for s in range(m)]; rest = order[m * 11:]
        if rest:
            t_ = C[rest[0]]['tilt']; left[(C[rest[0]]['face'], 'low' if t_ <= 6 else 'mid' if t_ < 14 else 'high')].extend(rest)
    for key, ii in left.items():
        ii = sorted(ii, key=lambda i: -C[i]['kwh']); m = len(ii) // 11; S_ += [ii[s * 11:(s + 1) * 11] for s in range(m)]
    return S_
def roof_A(F):
    C = roof_cands(F); P = []; N = []
    for c in C:
        nv = np.array([-c['k'], 0, 1.0]); nv /= np.linalg.norm(nv); N.append(nv)
        for t in (-0.892, 0.0, 0.888): P.append((c['xm'], c['y'] + t, c['zm'] + 0.12 + 0.033 + 0.03))
    ST, I = run_steps(np.array(P), np.array(N)); E = mod_kwh(ST, len(C))
    for i, c in enumerate(C): c['kwh'] = float(E[i]); c['irr'] = float(I[i])
    S_ = roof_strings(C); tot = 0; tot0 = 0; mo = np.zeros(12)
    for ids in S_:
        e, e0, emo = string_energy(ST, ids); tot += e; tot0 += e0; mo += emo
    n = sum(len(s) for s in S_)
    return dict(free=len(C), n=n, st=len(S_), kwp=round(n * PW, 2), mwh=round(tot / 1000, 2), mism=round((1 - tot / tot0) * 100, 2), y=round(tot / n / PW),
                mo=[round(x / 1000, 3) for x in mo], C=[dict(xa=c['xa'], xb=c['xb'], y=c['y'], kwh=round(c['kwh'], 1)) for c in C],
                inS=sorted(i for s in S_ for i in s))
def lan_mods(F, mode):
    M = MODES[mode]; hw = M['half']; P = []; N = []; MODS = []
    for li, L in enumerate(F):
        Ly = L['y1'] - L['y0']
        if M['orient'] == 'L': pitch, alongL, upL = LM + GAP, LM, DM
        else: pitch, alongL, upL = DM + GAP, DM, LM
        n = int((Ly + GAP) // pitch); ys = (L['y0'] + L['y1']) / 2 - (n * pitch - GAP) / 2
        for side, sg in (('E', 1), ('W', -1)):
            nrm = np.array([sg * st_, 0, ct])
            for r in range(M['rows']):
                u0 = 0.02 + r * (upL + GAP)                     # від гребеня вниз по схилу
                for i in range(n):
                    y0 = ys + i * pitch; MODS.append(dict(l=li + 1, side=side, row=r, y=round(y0, 3), y1=round(y0 + alongL, 3),
                                                          u0=round(u0, 3), u1=round(u0 + upL, 3), x=round(L['xc'] + sg * (u0 + upL / 2) * ct, 3)))
                    N.append(nrm)
                    if M['orient'] == 'L':
                        um = u0 + upL / 2
                        for t in (-0.892, 0.0, 0.888): P.append((L['xc'] + sg * um * ct + nrm[0] * 0.30, y0 + alongL / 2 + t, L['ridge'] - um * st_ + nrm[2] * 0.30))
                    else:
                        for f_ in (0.2, 0.5, 0.8):
                            um = u0 + upL * f_; P.append((L['xc'] + sg * um * ct + nrm[0] * 0.30, y0 + alongL / 2, L['ridge'] - um * st_ + nrm[2] * 0.30))
    ST, I = run_steps(np.array(P), np.array(N)); E = mod_kwh(ST, len(MODS))
    for i, m in enumerate(MODS): m['kwh'] = round(float(E[i]), 1); m['irr'] = round(float(I[i]), 1)
    S_ = []; rest = {'E': [], 'W': []}
    for li in range(len(F)):
        for sd in 'EW':
            for r in range(M['rows']):
                ii = sorted([i for i, m in enumerate(MODS) if m['l'] == li + 1 and m['side'] == sd and m['row'] == r], key=lambda i: MODS[i]['y'])
                S_ += [ii[s * 11:(s + 1) * 11] for s in range(len(ii) // 11)]; rest[sd] += ii[len(ii) // 11 * 11:]
    drop = []
    for sd in 'EW':
        ii = sorted(rest[sd], key=lambda i: -MODS[i]['kwh']); m = len(ii) // 11; S_ += [ii[s * 11:(s + 1) * 11] for s in range(m)]; drop += ii[m * 11:]
    tot = 0; tot0 = 0; mo = np.zeros(12); SS = []
    for sid, ids in enumerate(S_):
        e, e0, emo = string_energy(ST, ids); tot += e; tot0 += e0; mo += emo; SS.append(dict(ids=ids, mwh=round(e / 1000, 3), side=MODS[ids[0]]['side'], l=MODS[ids[0]]['l']))
    n = sum(len(s) for s in S_)
    for i in drop: MODS[i]['drop'] = 1
    return dict(places=len(MODS), n=n, st=len(S_), drop=len(drop), kwp=round(n * PW, 2), mwh=round(tot / 1000, 2), mism=round((1 - tot / tot0) * 100, 2) if tot0 else 0,
                y=round(tot / n / PW) if n else 0, irr=round(float(np.mean([MODS[i]['irr'] for s in S_ for i in s]))), mo=[round(x / 1000, 3) for x in mo],
                irrE=round(float(np.mean([m['irr'] for m in MODS if m['side'] == 'E']))), irrW=round(float(np.mean([m['irr'] for m in MODS if m['side'] == 'W']))),
                mods=MODS, strings=SS)
if __name__ == '__main__':
    OUT = dict(tilt=TILT, curb=CURB, thk=THK, VAL=VAL, COST=COST, modes={})
    for mode in (sys.argv[1:] or os.environ.get('MODES', 'base,G1,V1,G2').split(',')):
        F = build_dsm(mode); R = dict(name=MODES[mode]['name'], half=round(MODES[mode]['half'], 3), F=F)
        R['roof'] = roof_A(F)
        print(mode, 'roof A:', {k: R['roof'][k] for k in ('free', 'n', 'st', 'kwp', 'mwh', 'mism', 'y')}, flush=True)
        if mode != 'base':
            R['lan'] = lan_mods(F, mode)
            print(mode, 'lanterns:', {k: R['lan'][k] for k in ('places', 'n', 'st', 'drop', 'kwp', 'mwh', 'mism', 'y', 'irr', 'irrE', 'irrW')}, flush=True)
        OUT['modes'][mode] = R
        json.dump(OUT, open(V + 'lan22.json', 'w'), ensure_ascii=False)
    print('saved')
