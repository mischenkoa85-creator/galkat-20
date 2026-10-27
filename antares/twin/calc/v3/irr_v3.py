# -*- coding: utf-8 -*-
"""Сонячне опромінення на кожні 0,5 × 0,5 м даху цеху (v3, 27.10.2026): кВт·год/м² за рік і по місяцях у площині покрівлі
(або схилу ліхтаря), з тінню від усього, що є в моделі v3 (ліхтарі 3,66 × 1,89, парапети 1,37, західна будівля, рама кондиціонерів,
дефлектори за супутником і РП). Без тіні — те саме місце без перешкод (лише небо, закрите самою площиною).
→ v3/irr_v3.json (сітка, значення) і /home/claude/work/twin/raddata_v3.js для двійника."""
import json, math, sys, numpy as np
sys.argv = ['x']
exec(open('/home/claude/work/sun/v3/roof_v3.py', encoding='utf-8').read().split("if __name__ == '__main__':")[0])
RES = 0.5
xs = np.arange(RES / 2, 96.64, RES); ys = np.arange(RES / 2, 96.34, RES); nx, ny = len(xs), len(ys)
pts = []; nrm = []; kind = []; idx = []
def slope(x):
    e = 0.05; return (float(roofZ(x + e)) - float(roofZ(x - e))) / (2 * e)
for j, y in enumerate(ys):
    for i, x in enumerate(xs):
        k = 'roof'; z = float(roofZ(x)); sl = slope(x)
        for L in LAN:
            if L['x0'] <= x <= L['x1'] and L['y0'] <= y <= L['y1']:
                k = 'lan'; z = L['zb'] + L['h'] * (1 - abs(x - L['xc']) / (LW / 2)); sl = (L['h'] / (LW / 2)) * (1 if x < L['xc'] else -1)
        occ = AC['x0'] <= x <= AC['x1'] and AC['y0'] <= y <= AC['y1']
        for o in DF:
            if (x - o['x']) ** 2 + (y - o['y']) ** 2 <= (o['d'] / 2) ** 2: occ = True
        if occ: k = 'occ'
        nv = np.array([-sl, 0, 1.0]); nv /= np.linalg.norm(nv)
        pts.append((x, y, z + 0.05)); nrm.append(nv); kind.append(k); idx.append((i, j))
P = np.array(pts); N = np.array(nrm)
use = np.array([k != 'occ' for k in kind])
R_ = run(P[use], N[use], k=1, irr_only=True)
I = np.full(len(P), np.nan); Iu = np.full(len(P), np.nan); Imo = np.full((12, len(P)), np.nan)
I[use] = R_['I']; Iu[use] = R_['Iun']; Imo[:, use] = R_['Imo']
GHI = sum(sum(wm['nd'] / 6 * (wm['p'] * st[4] + (1 - wm['p']) * wm['c'] * st[4]) for st in wm['st']) for wm in WX['mo']) / 1000
print('cells', len(P), 'roof', kind.count('roof'), 'lan', kind.count('lan'), 'occ', kind.count('occ'), 'GHI', round(GHI))
r = np.array([k == 'roof' for k in kind]); l = np.array([k == 'lan' for k in kind])
for nm, m in (('roof', r), ('lan', l)):
    v = I[m]; print(nm, 'mean', round(np.nanmean(v)), 'p10', round(np.nanpercentile(v, 10)), 'p50', round(np.nanpercentile(v, 50)), 'p90', round(np.nanpercentile(v, 90)), 'max', round(np.nanmax(v)),
                    'shade %', round(float(1 - np.nansum(v) / np.nansum(Iu[m])) * 100, 1))
OUT = dict(res=RES, nx=nx, ny=ny, x0=0.0, y0=0.0, ghi=round(GHI, 1),
           k=''.join('r' if k == 'roof' else 'l' if k == 'lan' else 'o' for k in kind),
           e=[None if np.isnan(v) else int(round(v)) for v in I], u=[None if np.isnan(v) else int(round(v)) for v in Iu],
           mo=[[None if np.isnan(v) else round(float(v), 1) for v in Imo[m]] for m in range(12)])
json.dump(OUT, open(V + 'irr_v3.json', 'w'))
print('saved')
