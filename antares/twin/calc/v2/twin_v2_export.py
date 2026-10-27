# -*- coding: utf-8 -*-
"""Дані для 3D-двійника (27.10.2026): дах за розрізом 1-1 і модулі на ліхтарях — два сценарії ліхтаря.
А — ліхтар 2,87 м (розріз 1-1), гребінь 1,5 м (оцінка): дах 1 936 (final_v2.json) + «доміки» над ліхтарями (lan_v2.json, винос 0,10).
Б — ліхтар 3,40 × 1,74 м (РП) на центрах розрізу: дах 1 782 (розкладка з відступом 0,5 м від краю 2,87) + книжково по схилах (lan_flush34_v2.json).
Для кожного набору — річна генерація з тінню і без, по місяцях (та сама модель, що в розрахунках). → /home/claude/work/twin/roofv2data.js"""
import json, math, sys, numpy as np
D = '/home/claude/work/sun/v2/'; LM, DM = 2.384, 1.303
SRC0 = open(D + 'roof_v2.py', encoding='utf-8').read()
def setup(lh, hw=None):
    src = SRC0 if hw is None else SRC0.replace("LAN = [dict(x0=a, x1=b_,", f"LAN = [dict(x0=(a + b_) / 2 - {hw}, x1=(a + b_) / 2 + {hw},")
    g = {'__name__': 'x'}; sys.argv = ['x', str(lh), '0.25']
    exec(src[:src.find('# ---------- кандидати')], g); exec(src[src.find('# ---------- горизонт і генерація'):src.find('P = []; N = []')], g); return g
def roofpts(g, mods):
    P = []; N = []
    for xa, xb, y in mods:
        xm = (xa + xb) / 2; k = (float(g['roofZ'](xb)) - float(g['roofZ'](xa))) / (xb - xa); nv = np.array([-k, 0, 1.0]); N.append(nv / np.linalg.norm(nv))
        for t in (-0.892, 0.0, 0.888): P.append((xm, y + t, float(g['roofZ'](xm)) + 0.12 + 0.033 + 0.03))
    return np.array(P), np.array(N)
def pack(E, Eun, Emo, idx=None):
    idx = np.arange(len(E)) if idx is None else np.array(idx, int)
    return dict(mwh=round(float(E[idx].sum()) / 1000, 2), un=round(float(Eun[idx].sum()) / 1000, 2), mo=[round(float(Emo[m][idx].sum()) / 1000, 3) for m in range(12)])
OUT = {}
# ================= А: ліхтар 2,87 × 1,5
g = setup(1.5); F = json.load(open(D + 'final_v2.json')); OK = [m for m in F['mods'] if m[3] == 'ok']
P, N = roofpts(g, [(m[0], m[1], m[2]) for m in OK]); E, Eun, Emo = g['energy'](P, N, 20)
A = dict(lan=[[L['x0'], L['x1'], L['y0'], L['y1'], L['zb'], 1.5] for L in g['LAN']], base=F['base'], cnt=F['cnt'], span=F['span'], zones=F['ZONES'],
         mods=[[m[0], m[1], m[2], m[3], m[4], m[5]] for m in F['mods']], sum=pack(E, Eun, Emo))
# доміки (винос 0,10)
GV = json.load(open(D + 'lan_v2.json')); K = GV['0.10']['K']; GM = GV['0.10']['mods']
hs = 1.435 + 0.10 - 0.01; th = math.acos(hs / LM); c, s = math.cos(th), math.sin(th); H = g['H']; XX, YY = g['XX'], g['YY']
pts = []; nrm = []; geo = []
for li, L in enumerate(g['LAN']):
    xc = (L['x0'] + L['x1']) / 2; zlo = L['zb'] + 0.15; zr = zlo + LM * s; n = int((L['y1'] - L['y0'] + 0.02) // 1.325); ys = (L['y0'] + L['y1']) / 2 - (n * 1.325 - 0.022) / 2
    geo.append(dict(xc=xc, zr=round(zr, 3), y0=round(ys, 3), n=n))
    msk = (np.abs(XX - xc) <= hs + 0.01) & (YY >= ys) & (YY <= ys + n * 1.325)
    H[msk] = np.maximum(H[msk], (zr + 0.033 - (np.abs(XX[msk] - xc) - 0.01).clip(0) * math.tan(th)).astype(np.float32))
for l, side, y, kwh, loss in GM:
    L = g['LAN'][l - 1]; xc = (L['x0'] + L['x1']) / 2; zr = L['zb'] + 0.15 + LM * s; sg = 1 if side == 'E' else -1
    pts += [(xc + sg * (0.01 + u * c), y + DM / 2, zr - u * s + 0.063) for u in (0.2 * LM, 0.5 * LM, 0.8 * LM)]; nrm.append([sg * s, 0, c])
E2, Eun2, Emo2 = g['energy'](np.array(pts), np.array(nrm), 25)
keep = []
for sd in 'EW':
    ii = sorted([i for i, m in enumerate(GM) if m[1] == sd], key=lambda i: -GM[i][3]); keep += ii[:len(ii) // 11 * 11]
Er, _, _ = g['energy'](P, N, 20)
A['dom'] = dict(K={k: K[k] for k in ('n', 'st', 'kwp', 'mwh', 'y', 'roof_loss', 'net', 'tilt', 'ridge', 'width', 'places', 'E', 'W', 'roof_hit', 'roof_max', 'perlan')},
                th=round(math.degrees(th), 2), hs=hs, geo=geo, mods=[m + [1 if i in set(keep) else 0] for i, m in enumerate(GM)], sum=pack(E2, Eun2, Emo2, keep), dR=[round(float(x), 1) for x in (E - Er)])
print('A roof', A['sum']['mwh'], 'dom', A['dom']['sum']['mwh'], 'roof loss', round(float((E - Er).sum()) / 1000, 2))
# ================= Б: ліхтар 3,40 × 1,74 (РП)
g = setup(1.74, 1.70); J = json.load(open(D + 'roof_v2_1.5_0.50.json'))
Cn = [c_ for c_ in J['cand'] if c_['why'] is None and c_['loss'] <= 15]; Cn = sorted(Cn, key=lambda c_: -c_['kwh']); keepC = Cn[:len(Cn) // 11 * 11]
kk = {(c_['xa'], c_['y']) for c_ in keepC}; dropC = {(c_['xa'], c_['y']) for c_ in Cn[len(Cn) // 11 * 11:]}
P, N = roofpts(g, [(c_['xa'], c_['xb'], c_['y']) for c_ in keepC]); E, Eun, Emo = g['energy'](P, N, 20)
ek = {(c_['xa'], c_['y']): (round(float(e), 1), round(float(1 - e / u) * 100, 1)) for c_, e, u in zip(keepC, E, Eun)}
def stB(c_):
    k = (c_['xa'], c_['y'])
    if k in kk: return 'ok'
    if k in dropC: return 'str'
    if c_['why'] is None: return 'shade'
    return c_['why']
modsB = []
for c_ in J['cand']:
    st = stB(c_); kw, ls = ek.get((c_['xa'], c_['y']), (round(c_.get('kwh', 0) or 0), c_.get('loss')))
    modsB.append([c_['xa'], c_['xb'], c_['y'], st, kw, ls])
B = dict(lan=[[L['x0'], L['x1'], L['y0'], L['y1'], L['zb'], 1.74] for L in g['LAN']], mods=modsB, sum=pack(E, Eun, Emo),
         base=dict(n=len(keepC), st=len(keepC) // 11, kwp=round(len(keepC) * 0.73, 1), mwh=round(float(E.sum()) / 1000, 1), y=round(float(E.sum()) / len(keepC) / 0.73)))
GF = json.load(open(D + 'lan_flush34_v2.json')); KF = GF['K']; FM = GF['mods']; H = g['H']; XX, YY = g['XX'], g['YY']
thf = math.atan2(1.74, 1.70); cf, sf = math.cos(thf), math.sin(thf); pts = []; nrm = []
for li, L in enumerate(g['LAN']):
    xc = (L['x0'] + L['x1']) / 2; n = int((L['y1'] - L['y0'] + 0.022) // 1.325); ys = (L['y0'] + L['y1']) / 2 - (n * 1.325 - 0.022) / 2
    msk = (np.abs(XX - xc) >= 0.02 * cf) & (np.abs(XX - xc) <= (0.02 + LM) * cf + 0.12 * sf) & (YY >= ys) & (YY <= ys + n * 1.325)
    H[msk] = np.maximum(H[msk], (L['zb'] + 1.74 * (1 - np.abs(XX[msk] - xc) / 1.70).clip(0) + 0.153 / cf).astype(np.float32))
for l, side, y, kwh, loss in FM:
    L = g['LAN'][l - 1]; xc = (L['x0'] + L['x1']) / 2; sg = 1 if side == 'E' else -1; nv = np.array([sg * sf, 0, cf])
    pts += [(xc + sg * sa * cf + nv[0] * 0.183, y + DM / 2, L['zb'] + 1.74 - sa * sf + nv[2] * 0.183) for sa in (0.02 + LM * 0.2, 0.02 + LM * 0.5, 0.02 + LM * 0.8)]; nrm.append(nv)
E3, Eun3, Emo3 = g['energy'](np.array(pts), np.array(nrm), 20)
keep = []
for sd in 'EW':
    ii = sorted([i for i, m in enumerate(FM) if m[1] == sd], key=lambda i: -FM[i][3]); keep += ii[:len(ii) // 11 * 11]
Er, _, _ = g['energy'](P, N, 20)
B['flush'] = dict(K={k: KF[k] for k in ('n', 'st', 'kwp', 'mwh', 'y', 'roof_loss', 'net', 'E', 'W', 'roof_hit', 'roof_max', 'perlan', 'left', 'left_mwh', 'places', 'gap')},
                  th=round(math.degrees(thf), 2), mods=[m + [1 if i in set(keep) else 0] for i, m in enumerate(FM)], sum=pack(E3, Eun3, Emo3, keep), dR=[round(float(x), 1) for x in (E - Er)])
print('B roof', B['sum']['mwh'], B['base'], 'flush', B['flush']['sum']['mwh'], 'roof loss', round(float((E - Er).sum()) / 1000, 2))
FAC = json.load(open('/home/claude/work/sun/final_fac_v2.json'))['FACPV']
OUT = dict(A=A, B=B, fac=dict(tot=FAC['tot'], mo=FAC['mo'], strings=FAC['strings']), date='27.10.2026',
           wh=dict(n=176, st=16, kwp=128.5, mwh=None))
open('/home/claude/work/twin/roofv2data.js', 'w', encoding='utf-8').write('const ROOFV2=' + json.dumps(OUT, ensure_ascii=False, separators=(',', ':')) + ';')
import os; print(os.path.getsize('/home/claude/work/twin/roofv2data.js') // 1024, 'KB')
