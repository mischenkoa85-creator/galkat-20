# -*- coding: utf-8 -*-
"""Дані для двійника: дах 28.10 без ліхтарів, два варіанти розкладки модулів → src/roof28data.js (ROOF28).
Вар. 1 — з проходами і відступами (pv_cands.json, pv_eval.json, pv_check.json); вар. 2 — максимальний (*_max.json).
Модулі поза стрінгами (s = −1) — на освітлення цеху. Каркаси ліхтарів 13° на бортику 0,30 (roofobj.FRAMES), площина модулів — як у lan22 (V1)."""
import os, sys, json, math
W = os.path.dirname(os.path.abspath(__file__)) + '/'; sys.path.insert(0, W)
import roofobj as R
OUT = os.path.join(W, '..', '..', 'src', 'roof28data.js')
N = json.load(open(W + 'pv_norms.json', encoding='utf-8'))
r = lambda v, n=3: round(float(v), n)
def var(sfx, S):
    C = json.load(open(W + f'pv_cands{sfx}.json')); E = json.load(open(W + f'pv_eval{sfx}.json')); K = json.load(open(W + f'pv_check{sfx}.json'))
    zones = []
    for z in C['Z']:
        if z['k'] not in ('path', 'perimeter'): continue
        x0, x1 = max(z['x'][0], R.XWin), min(z['x'][1], R.XE_in); y0, y1 = max(z['y'][0], R.YS_in), min(z['y'][1], R.YN_in)
        if x1 - x0 >= 0.05 and y1 - y0 >= 0.05: zones.append([r(x0), r(x1), r(y0), r(y1), z['k'], z['n']])
    return dict(
        roof=[[r(m['xa']), r(m['xb']), r(m['y']), round(m['kwh']), m['s']] for m in E['roof_mods']],
        frame=[[m['l'], m['side'], r(m['y']), r(m['y1']), round(m['kwh']), m['s']] for m in E['frame_mods']],
        zones=zones, rules=C['rules'],
        sum=dict(roof=E['roof'], frame=E['frame'], st=E['total'], lit=S['lit'], all=S['all'], pct=round(S['pct'], 1)),
        chk={k: K[k] for k in ('west', 'east', 'south', 'north', 'ac', 'door', 'exit', 'portal', 'pipes', 'drains', 'field_max_dx', 'field_max_dy')} | dict(paths=K['paths'], fields=len(K['fields'])))
D = dict(date='28.10.2026',
         xs=sorted(set(r(x) for p in R.PR for x in (p['x0'], p['x1']))),
         roofIn=[R.XWin, R.XE_in, R.YS_in, R.YN_in],
         frames=[dict(id=F['id'], xc=r(F['xc']), y0=F['y0'], y1=F['y1'], zb=F['zb'], ze=F['ze'], zr=F['zr'], half=R.HALF, tilt=R.TILT, hw=2.333, thk=0.16) for F in R.FRAMES],
         pipes=[[o['n'], r(o['x'], 2), r(o['y'], 2), o['d'], o['h'], o['phsrc']] for o in R.DEFL if o['cls'] == 'є'],
         drains=[[d['id'], r(d['x'], 2), r(d['y'], 2), d['st']] for d in R.DRAINS],
         V={'1': var('', N['S1']), '2': var('_max', N['S2'])},
         rows=N['rows'], notes=N['sheet10_notes'], v2notes=N['v2_notes'])
s = 'const ROOF28=' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';'
open(OUT, 'w', encoding='utf-8').write(s)
print('roof28data.js', len(s) // 1024, 'KB', {k: (len(v['roof']), len(v['frame'])) for k, v in D['V'].items()})
