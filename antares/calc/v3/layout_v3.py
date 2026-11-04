# -*- coding: utf-8 -*-
"""Розкладка даху цеху Антарес за картою опромінення (v3, 27.10.2026, вечір).
Вільні місця — roof_v3.json. Для кожного варіанта: модулі → стрінги по 11 (в межах грані: однаковий кут і бік — схід/захід),
різна освітленість у стрінгу — покроково (крок 10 хв, ясна частина): модель обхідних діодів на рівні модуля — стрінг працює на струмі,
що дає найбільшу потужність, модулі зі струмом меншим за нього обходяться. Хмарна частина — без втрат на різну освітленість.
Варіанти: А — усі вільні місця; Б — місця від 1 050 кВт·год/м² (≈90 % від найкращого); В — від 1 100 кВт·год/м² (найкращі м²).
Окремо — модулі книжково по схилах ліхтарів 3,66 × 1,89 (за рулеткою), як додаток до будь-якого варіанта.
Економіка: ціна 1 кВт·год 7,00 грн з ПДВ (5,83 без ПДВ, оцінка власника), ККД PCS 97,5 %, 44,89 грн/$; ≈250 $ на модуль під ключ без ПДВ
(частина СЕС кошторису під ключ 26.10 без УЗЕ, EMS, фундаментів і мідних ліній AC, поділена на 1 925 модулів) — оцінка."""
import json, math, sys, numpy as np, collections
sys.argv = ['x']
exec(open('/home/claude/work/sun/v3/roof_v3.py', encoding='utf-8').read().split("if __name__ == '__main__':")[0])
J = json.load(open(V + ('roof_v3_nodefl.json' if NODEFL else 'roof_v3.json'))); C = [c for c in J['cand'] if c['why'] is None]
VAL = 7.00 / 1.2 / 44.89 * 0.975; COST = 250.0; LM, DM = 2.384, 1.303
def run_steps(P, NRM, U=20, k=3):
    HOR = horizon(P); N3 = np.repeat(NRM, k, axis=0); SVF, SVF0 = svf(HOR, N3)
    SVFm = SVF.reshape(-1, k).mean(1)
    modP = lambda poa, ta: np.where(poa > 0, PW * poa / 1000 * (1 + GAMT * (ta + poa * 0.9 * (1 - ETA) / U - 25)) * LOSS, 0)
    steps = []
    for mo, Wm in enumerate(WX['mo']):
        wt = Wm['nd'] / 6; p_, c_ = Wm['p'], Wm['c']
        for h, ex, ey, sz, Gh, Dn, Dd, ext, ta in Wm['st']:
            bx, by = tobld(ex, ey); dv = np.array([bx, by, sz]); cosb = np.maximum(NRM @ dv, 0); Ai = Dn / ext if ext > 0 else 0; cz = max(sz, 0.01)
            az = math.atan2(bx, by); el = math.asin(max(-1, min(1, sz))); fa = (az % (2 * math.pi)) / (2 * math.pi) * NA; a0 = int(fa) % NA; a1 = (a0 + 1) % NA; t = fa - int(fa)
            lit = (el > HOR[:, a0] * (1 - t) + HOR[:, a1] * t).reshape(-1, k)
            beam = Dn * cosb + Dd * Ai * cosb / cz; gr = Gh * ALB * (1 - NRM[:, 2]) / 2; Go = c_ * Gh
            diff = Dd * (1 - Ai) * SVFm + gr
            # струм модуля ~ найгірша з 3 точок (обхідні діоди стоять на третинах уздовж модуля) — беремо середнє з мінімальною, як компроміс
            litm = 0.5 * (lit.mean(1) + lit.min(1))
            pc = beam * litm + diff; po = Go * SVFm + Go * ALB * (1 - NRM[:, 2]) / 2
            steps.append((mo, wt, p_, modP(pc, ta), pc, modP(po, ta)))
    return steps
def string_energy(steps, ids):
    ids = np.array(ids); E = 0.0; Esum = 0.0; Emo = np.zeros(12)
    for mo, wt, p_, Pc, pc, Po in steps:
        I = pc[ids]; Psum = Pc[ids].sum(); Pov = Po[ids].sum()
        if Psum > 0:
            Is = np.sort(I)[::-1]; best = max(Is[n] * (n + 1) for n in range(len(Is))); f = best / I.sum() if I.sum() > 0 else 0
        else: f = 1.0
        e = wt * (p_ * Psum * f + (1 - p_) * Pov); E += e; Emo[mo] += e; Esum += wt * (p_ * Psum + (1 - p_) * Pov)
    return E, Esum, Emo
# ---------- PV-моделювання всіх вільних місць по кроках
P = []; N = []
for c_ in C:
    nv = np.array([-c_['k'], 0, 1.0]); nv /= np.linalg.norm(nv); N.append(nv)
    for t in (-0.892, 0.0, 0.888): P.append((c_['xm'], c_['y'] + t, c_['zm'] + 0.12 + 0.033 + 0.03))
ST = run_steps(np.array(P), np.array(N))
def strings_for(sel):
    """sel — індекси C. Групи — грань f (той самий кут і бік); у грані змійкою: колонка j=0 вгору по Y, j=1 вниз; по 11 підряд.
    Залишки граней з однаковим боком і кутом (±0,5°) збираємо в додаткові стрінги; що не набирає 11 — не ставимо (найслабші)."""
    byf = collections.defaultdict(list)
    for i in sel: byf[C[i]['f']].append(i)
    S_ = []; left = collections.defaultdict(list)
    for f, ii in sorted(byf.items()):
        cols = collections.defaultdict(list)
        for i in ii: cols[C[i]['j']].append(i)
        order = []
        for n, j in enumerate(sorted(cols)):
            order += sorted(cols[j], key=lambda i: C[i]['y'] * (1 if n % 2 == 0 else -1))
        m = len(order) // 11
        for s in range(m): S_.append(order[s * 11:(s + 1) * 11])
        rest = order[m * 11:]
        if rest:
            t_ = C[rest[0]]['tilt']; left[(C[rest[0]]['face'], 'low' if t_ <= 6 else 'mid' if t_ < 14 else 'high')].extend(rest)
    drop = []
    for key, ii in left.items():
        ii = sorted(ii, key=lambda i: -C[i]['kwh']); m = len(ii) // 11
        for s in range(m): S_.append(ii[s * 11:(s + 1) * 11])
        drop += ii[m * 11:]
    return S_, drop
def variant(name, cond):
    sel = [i for i, c_ in enumerate(C) if cond(c_)]
    S_, drop = strings_for(sel)
    res = []; tot = 0; tot0 = 0; mo = np.zeros(12)
    for sid, ids in enumerate(S_):
        e, e0, emo = string_energy(ST, ids); res.append(dict(id=sid, ids=ids, mwh=round(e / 1000, 3), mism=round((1 - e / e0) * 100, 2) if e0 else 0,
                                                             face=C[ids[0]]['face'], tilt=C[ids[0]]['tilt'])); tot += e; tot0 += e0; mo += emo
    n = sum(len(s) for s in S_)
    out = dict(name=name, n=n, st=len(S_), kwp=round(n * 0.73, 2), mwh=round(tot / 1000, 1), mwh_nomism=round(tot0 / 1000, 1), mism=round((1 - tot / tot0) * 100, 2),
               y=round(tot / n / 0.73), drop=len(drop), sel=len(sel), mo=[round(x / 1000, 2) for x in mo],
               cost=round(n * COST), rev=round(tot * VAL), pb=round(n * COST / (tot * VAL), 2),
               irr=round(float(np.mean([C[i]['irr'] for s in S_ for i in s]))), strings=res)
    print(f"{name}: місць {len(sel)}, у стрінгах {n} = {len(S_)} × 11, {out['kwp']} кВтп, {out['mwh']} МВт·год (без різної освітленості {out['mwh_nomism']}, −{out['mism']} %), "
          f"{out['y']} кВт·год/кВтп, опромінення {out['irr']} кВт·год/м², ≈{out['cost']} $ → {out['rev']} $/рік, окупність {out['pb']} р.; поза стрінгами {len(drop)}")
    return out
VARS = [variant('А', lambda c_: True), variant('Б', lambda c_: c_['irr'] >= 1050), variant('В', lambda c_: c_['irr'] >= 1100)]
# граничний ефект: що дає кожен наступний шар місць
for a, b in ((0, 1), (1, 2)):
    dn = VARS[a]['n'] - VARS[b]['n']; de = (VARS[a]['mwh'] - VARS[b]['mwh']) * 1000
    print(f"{VARS[a]['name']} проти {VARS[b]['name']}: +{dn} модулів, +{de / 1000:.1f} МВт·год, {de / dn / 0.73:.0f} кВт·год/кВтп, окупність додаткових {dn * COST / (de * VAL):.1f} р.")
# ---------- ліхтарі: книжково по схилах 3,66 × 1,89 (за рулеткою), рейки на 0,12 м над схилом
th = math.atan2(LH, LW / 2); cs, sn = math.cos(th), math.sin(th); Ls = math.hypot(LW / 2, LH)
LP = []; LN = []; LMODS = []
for li, L in enumerate(LAN):
    n = int((L['y1'] - L['y0'] + 0.022) // 1.325); ys = (L['y0'] + L['y1']) / 2 - (n * 1.325 - 0.022) / 2
    for side, sg in (('E', 1), ('W', -1)):
        nrm = np.array([sg * sn, 0, cs])
        for i in range(n):
            y0 = ys + i * 1.325
            LMODS.append(dict(l=li + 1, side=side, y=round(y0, 3), tilt=round(math.degrees(th), 1)))
            LN.append(nrm)
            for sa in (0.02 + LM * 0.2, 0.02 + LM * 0.5, 0.02 + LM * 0.8):
                LP.append((L['xc'] + sg * sa * cs + nrm[0] * 0.183, y0 + DM / 2, L['zb'] + L['h'] - sa * sn + nrm[2] * 0.183))
LST = run_steps(np.array(LP), np.array(LN))
lsel = list(range(len(LMODS))); LS = []; lrest = {'E': [], 'W': []}
for li in range(4):
    for sd in 'EW':
        ii = sorted([i for i in lsel if LMODS[i]['l'] == li + 1 and LMODS[i]['side'] == sd], key=lambda i: LMODS[i]['y'])
        for s in range(len(ii) // 11): LS.append(ii[s * 11:(s + 1) * 11])
        lrest[sd] += ii[len(ii) // 11 * 11:]
for sd in 'EW':
    ii = lrest[sd]
    for s in range(len(ii) // 11): LS.append(ii[s * 11:(s + 1) * 11])
le = 0; le0 = 0
for ids in LS:
    e, e0, _ = string_energy(LST, ids); le += e; le0 += e0
ln = sum(len(s) for s in LS)
LANV = dict(places=len(LMODS), n=ln, st=len(LS), kwp=round(ln * 0.73, 2), mwh=round(le / 1000, 1), y=round(le / ln / 0.73), tilt=round(math.degrees(th), 1),
            slope=round(Ls, 3), free=round(Ls - 0.02 - LM, 3), pb=round(ln * COST / (le * VAL), 2))
print('ліхтарі:', LANV)
json.dump(dict(VAL=VAL, COST=COST, C=[dict(xa=c_['xa'], xb=c_['xb'], y=c_['y'], f=c_['f'], j=c_['j'], face=c_['face'], tilt=c_['tilt'], kwh=c_['kwh'], irr=c_['irr'], loss=c_['loss'])
                                         for c_ in C], VARS=VARS, LAN=LANV, LMODS=LMODS), open(V + ('layout_v3_nodefl.json' if NODEFL else 'layout_v3.json'), 'w'), ensure_ascii=False)
