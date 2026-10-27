# -*- coding: utf-8 -*-
"""Ліхтарі → каркас ≈13°, 297 модулів вертикально (lan13_mount.json) → дані для 3D-двійника: twin/lan13data.js (ROOFV2.V3.lan13).
Додатково — енергія тих самих модулів без тіней (для «тінь забирає»), горизонт = 0."""
import os, sys, json, math, numpy as np
os.environ['TILT'] = '13'
sys.path.insert(0, '/home/claude/work/sun/v3'); import lan22 as L
V = L.V; LM, DM, GAP = L.LM, L.DM, L.GAP
R = json.load(open(V + 'lan13_mount.json')); J = json.load(open(V + 'lan22_t13.json'))['modes']['V1']
F = J['F']; MODS = R['mods']; used = set(R['used'])
st_, ct = L.st_, L.ct
# без тіней: ті самі точки, що в lan13_mount.py, горизонт 0
P = []; N = []
for m in MODS:
    Ln = F[m['l'] - 1]; sg = 1 if m['side'] == 'E' else -1; nrm = np.array([sg * st_, 0, ct]); N.append(nrm)
    for f_ in (0.2, 0.5, 0.8):
        um = 0.02 + LM * f_; P.append((Ln['xc'] + sg * um * ct + nrm[0] * 0.30, m['y'] + DM / 2, Ln['ridge'] - um * st_ + nrm[2] * 0.30))
L.horizon = lambda P_: np.zeros((len(P_), L.NA), dtype=np.float32)
ST0, _ = L.run_steps(np.array(P), np.array(N)); E0 = L.mod_kwh(ST0, len(MODS))
un = sum(E0[k] for k in used) / 1000
sidx = {}
for j, s in enumerate(R['strings']):
    for k in s['ids']: sidx[k] = j
OUT = dict(tilt=R['tilt'], hw=R['half'], cl=R['clamp'], thk=L.THK, curb=L.CURB,
           F=[[round(f['xc'], 3), round(f['y0'], 3), round(f['y1'], 3), round(f['zb'], 3), round(f['ze'], 3), round(f['ridge'], 3)] for f in F],
           mods=[[m['l'], m['side'], m['y'], m['kwh'], sidx.get(k, -1), round(float(E0[k]), 1)] for k, m in enumerate(MODS)],
           strings=[[s['id'], s['side'], s['n'], s['mwh'], s['mism']] for s in R['strings']],
           K=dict(places=R['places'], n=R['n'], st=R['st'], kwp=R['kwp'], mwh=R['mwh'], y=R['y'], mism=R['mism'], un=round(un, 2),
                  roof=J['roof']['mwh'], roof_n=J['roof']['n'], roof_st=J['roof']['st'], pure=R['pure'], max=R['max']),
           mo=R['mo'], roof_mo=J['roof']['mo'],
           mount=dict(rail=R['rail_m'], mid=R['clamps_mid'], end=R['clamps_end'], up=R['rail_up'], lo=R['rail_lo'], edge=R['edge'],
                      runs=[[r['l'], r['side'], r['y0'], r['y1'], r['n']] for r in R['runs']]),
           cost=dict(tot=1449097, vat=1738917, v245=1593454, kwp=940, old=1411493, lan_mount=2555, area=674))
s = 'ROOFV2.V3.lan13=' + json.dumps(OUT, ensure_ascii=False, separators=(',', ':')) + ';'
open('/home/claude/work/twin/lan13data.js', 'w', encoding='utf-8').write(s)
print('un', round(un, 2), 'mwh', R['mwh'], 'shade %', round((1 - R['mwh'] / un) * 100, 1), len(s) // 1024, 'KB')
