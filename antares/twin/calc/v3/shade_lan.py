# -*- coding: utf-8 -*-
"""Скільки тіні дають ліхтарі на модулі даху цеху: як зараз (1,89 м), каркас 22°, каркас 13°, і без ліхтарів (межа).
Ті самі 1 639 місць даху (варіант А), сума по модулях (без стрінгів) — щоб відокремити саме тінь. → v3/shade_lan.json"""
import os, sys, json, numpy as np
sys.path.insert(0, '/home/claude/work/sun/v3')
OUT = {}
def roof_energy(L, C):
    P = []; N = []
    for c in C:
        nv = np.array([-c['k'], 0, 1.0]); nv /= np.linalg.norm(nv); N.append(nv)
        for t in (-0.892, 0.0, 0.888): P.append((c['xm'], c['y'] + t, c['zm'] + 0.12 + 0.033 + 0.03))
    ST, I = L.run_steps(np.array(P), np.array(N)); E = L.mod_kwh(ST, len(C))
    h_ = L.horizon; L.horizon = lambda P_: np.zeros((len(P_), L.NA), np.float32); ST0, _ = L.run_steps(np.array(P), np.array(N)); E0 = L.mod_kwh(ST0, len(C)); L.horizon = h_
    return E, E0
import importlib
for tilt in ('22', '13'):
    os.environ['TILT'] = tilt
    if 'lan22' in sys.modules: L = importlib.reload(sys.modules['lan22'])
    else: import lan22 as L
    Fb = L.build_dsm('base'); C = L.roof_cands(Fb); inS = set(json.load(open(L.V + 'lan22.json'))['modes']['base']['roof']['inS'])
    C = [c for i, c in enumerate(C) if i in inS]
    if 'base' not in OUT:
        E, E0 = roof_energy(L, C); OUT['base'] = dict(mwh=round(E.sum() / 1000, 2), un=round(E0.sum() / 1000, 2), per=[round(float(x), 1) for x in E]); OUT['un_per'] = [round(float(x), 1) for x in E0]
        L.H[:] = L.H0; E, E0 = roof_energy(L, C); OUT['none'] = dict(mwh=round(E.sum() / 1000, 2), un=round(E0.sum() / 1000, 2), per=[round(float(x), 1) for x in E])
        OUT['xy'] = [[c['xa'], c['xb'], c['y'], c['face']] for c in C]
    L.build_dsm('V1'); E, E0 = roof_energy(L, C); OUT['t' + tilt] = dict(mwh=round(E.sum() / 1000, 2), un=round(E0.sum() / 1000, 2), per=[round(float(x), 1) for x in E])
    print(tilt, len(C), {k: (v['mwh'], v['un']) for k, v in OUT.items() if isinstance(v, dict) and 'mwh' in v})
json.dump(OUT, open('/home/claude/work/sun/v3/shade_lan.json', 'w'))
b, n = OUT['base']['mwh'], OUT['none']['mwh']
for k in ('base', 't22', 't13', 'none'): print(k, OUT[k]['mwh'], 'від ліхтарів:', round(n - OUT[k]['mwh'], 2), 'МВт·год', round((n - OUT[k]['mwh']) / (n - b) * 100), '% від нинішньої')
