# -*- coding: utf-8 -*-
"""Ліхтарі → каркас 13° або 22° (TILT), модулі вертикально (lan{TILT}_mount.json) → дані для 3D-двійника: v3/lanf{TILT}.json;
збирає обидва в twin/lanfdata.js (ROOFV2.V3.lanf) — запуск: TILT=13 …; TILT=22 … (останній збирає файл).
Додатково — енергія тих самих модулів без тіней (для «тінь забирає»), горизонт = 0."""
import os, sys, json, math, numpy as np
os.environ['TILT'] = os.environ.get('TILT', '13'); TT = int(float(os.environ['TILT']))
sys.path.insert(0, '/home/claude/work/sun/v3'); import lan22 as L
V = L.V; LM, DM, GAP = L.LM, L.DM, L.GAP
SH = json.load(open(V + 'shade_lan.json')); R = json.load(open(V + f'lan{TT}_mount.json')); J = json.load(open(V + (('lan22.json' if TT == 22 else f'lan22_t{TT}.json'))))['modes']['V1']
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
           mount=dict(console=R['console'], frame_half=R['frame_half'], frame_rise=R['frame_rise'], rail=R['rail_m'], mid=R['clamps_mid'], end=R['clamps_end'], up=R['rail_up'], lo=R['rail_lo'], edge=R['edge'],
                      runs=[[r['l'], r['side'], r['y0'], r['y1'], r['n']] for r in R['runs']]),
           cost=dict(tot=1449097, vat=1738917, v245=1593454, kwp=940, old=1411493, lan_mount=2555, area=round(674 * math.cos(math.radians(13)) / math.cos(math.radians(TT)))),
           shade={k: SH[k]['mwh'] for k in SH if isinstance(SH[k], dict) and 'mwh' in SH[k]}, roof_un=SH['base']['un'])
# річна тінь модулів даху в цьому сценарії — для «Тінь за рік» у двійнику: тінь двійника (v3) + різниця «каркас − як зараз» з shade_lan.py
_s = open('/home/claude/work/twin/roofv2data.js', encoding='utf-8').read(); R2 = json.loads(_s[_s.find('{'):_s.rfind('}') + 1])
OK = [m for m in R2['C']['mods'] if m[3] == 'ok']; XY = np.array([[a_, y_] for a_, b_, y_, f_ in SH['xy']])
sh = lambda E, i: (1 - E[i] / SH['un_per'][i]) * 100
RS = []
for m in OK:
    i = int(np.argmin((XY[:, 0] - m[0]) ** 2 + (XY[:, 1] - m[2]) ** 2))
    RS.append(round(max(0.0, (m[5] or 0) + sh(SH['t%d' % TT]['per'], i) - sh(SH['base']['per'], i)), 1))
OUT['roofSh'] = RS
json.dump(OUT, open(V + f'lanf{TT}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
ALL = {t: json.load(open(V + f'lanf{t}.json')) for t in [int(x) for x in os.environ.get('LANF_KEYS', '12,17').split(',')] if os.path.exists(V + f'lanf{t}.json')}
s = 'ROOFV2.V3.lanf=' + json.dumps(ALL, ensure_ascii=False, separators=(',', ':')) + ';'
open('/home/claude/work/twin/lanfdata.js', 'w', encoding='utf-8').write(s)
print('un', round(un, 2), 'mwh', R['mwh'], 'shade %', round((1 - R['mwh'] / un) * 100, 1), len(s) // 1024, 'KB')
