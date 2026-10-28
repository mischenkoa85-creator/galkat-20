# -*- coding: utf-8 -*-
"""Незалежна геометрична перевірка розкладки (28.10.2026): по фактичних прямокутниках модулів (не по правилах, з яких їх ставили).
- відступи від стіни західної будівлі, парапетів; від рами кондиціонерів, виходу, дверей, труб, воронок;
- поля модулів: модулі з'єднані, якщо між ними зазор < PATH (ширина проходу) → розміри кожного поля (габарит X × Y);
- ширина кожного проходу Сх–Зх і Пн–Пд на всю довжину;
- немає перетинів модулів між собою.
вхід: pv_eval.json + pv_cands.json → pv_check.json"""
import os, sys, json, math, collections
W = os.path.dirname(os.path.abspath(__file__)) + '/'; sys.path.insert(0, W)
import roofobj as R
LM, DM = 2.384, 1.303; FR_EDGE = (0.02 + LM) * math.cos(math.radians(13))
EV = json.load(open(os.environ.get('EVAL', W + 'pv_eval.json'))); CA = json.load(open(os.environ.get('CANDS', W + 'pv_cands.json')))
RU = CA['rules']; PATH = min([p['w'] for p in RU['paths_y']] + [p['w'] for p in RU['paths_x']] + [9])
rect = []
for m in EV['roof_mods']:
    if m['s'] >= 0: rect.append(('roof', m['xa'], m['xb'], m['y'] - LM / 2, m['y'] + LM / 2))
for m in EV['frame_mods']:
    if m['s'] >= 0:
        F = R.FRAMES[m['l'] - 1]; sg = 1 if m['side'] == 'E' else -1
        rect.append(('frame', min(F['xc'], F['xc'] + sg * FR_EDGE), max(F['xc'], F['xc'] + sg * FR_EDGE), m['y'], m['y1']))
n = len(rect)
gapd = lambda a, b: math.hypot(max(0, a[1] - b[2], b[1] - a[2]), max(0, a[3] - b[4], b[3] - a[4]))
# перетини
over = sum(1 for i in range(n) for j in range(i + 1, n) if rect[i][1] < rect[j][2] - 1e-6 and rect[j][1] < rect[i][2] - 1e-6 and rect[i][3] < rect[j][4] - 1e-6 and rect[j][3] < rect[i][4] - 1e-6)
# поля: union-find із зазором < PATH
par = list(range(n))
def fd(i):
    while par[i] != i: par[i] = par[par[i]]; i = par[i]
    return i
import bisect
order = sorted(range(n), key=lambda i: rect[i][1])
for a in range(n):
    i = order[a]
    for b in range(a + 1, n):
        j = order[b]
        if rect[j][1] - rect[i][2] >= PATH: break
        if gapd(rect[i], rect[j]) < PATH - 1e-6: par[fd(i)] = fd(j)
G = collections.defaultdict(list)
for i in range(n): G[fd(i)].append(i)
fields = []
for k, ii in G.items():
    x0 = min(rect[i][1] for i in ii); x1 = max(rect[i][2] for i in ii); y0 = min(rect[i][3] for i in ii); y1 = max(rect[i][4] for i in ii)
    fields.append(dict(n=len(ii), x0=round(x0, 2), x1=round(x1, 2), y0=round(y0, 2), y1=round(y1, 2), dx=round(x1 - x0, 2), dy=round(y1 - y0, 2)))
fields.sort(key=lambda f: (f['y0'], f['x0']))
# відступи
mind = lambda f: round(min(f(r) for r in rect), 3)
chk = dict(
    n=n, overlaps=over, path_min=PATH,
    west=mind(lambda r: r[1] - R.XWin), east=mind(lambda r: R.XE_in - r[2]), south=mind(lambda r: r[3] - R.YS_in), north=mind(lambda r: R.YN_in - r[4]),
    ac=mind(lambda r: math.hypot(max(0, R.AC['x0'] - r[2], r[1] - R.AC['x1']), max(0, R.AC['y0'] - r[4], r[3] - R.AC['y1']))),
    door=mind(lambda r: math.hypot(max(0, r[1] - R.XWin), max(0, R.DOOR['y'] - R.DOOR['w'] / 2 - r[4], r[3] - R.DOOR['y'] - R.DOOR['w'] / 2))),
    exit=mind(lambda r: math.hypot(max(0, R.EXIT_LAND['x0'] - r[2], r[1] - R.EXIT_LAND['x1']), max(0, R.EXIT_LAND['y0'] - r[4], r[3] - R.EXIT_LAND['y1']))),
    portal=mind(lambda r: min(math.hypot(max(0, x - 0.2 - r[2], r[1] - x - 0.2), max(0, y - 0.2 - r[4], r[3] - y - 0.2)) for x, y in R.PORTAL_POSTS)),
    pipes=mind(lambda r: min(math.hypot(max(0, o['x'] - r[2], r[1] - o['x']), max(0, o['y'] - r[4], r[3] - o['y'])) - o['d'] / 2 for o in R.DEFL if o['cls'] == 'є')),
    drains=mind(lambda r: min(math.hypot(max(0, d['x'] - r[2], r[1] - d['x']), max(0, d['y'] - r[4], r[3] - d['y'])) for d in R.DRAINS)),
    fields=fields, field_max_dx=max(f['dx'] for f in fields), field_max_dy=max(f['dy'] for f in fields))
# ширина проходів: найменший зазор між модулями по обидва боки смуги
paths = []
for p in RU['paths_y']:
    lo = max([r[4] for r in rect if r[4] <= p['yc']] or [None]); hi = min([r[3] for r in rect if r[3] >= p['yc']] or [None])
    paths.append(dict(kind='Сх–Зх', at=p['yc'], need=p['w'], got=round(hi - lo, 3)))
for p in RU['paths_x']:
    y0, y1 = p.get('y0', -1), p.get('y1', 98)
    lo = max([r[2] for r in rect if r[2] <= p['xc'] and r[4] > y0 and r[3] < y1] or [None]); hi = min([r[1] for r in rect if r[1] >= p['xc'] and r[4] > y0 and r[3] < y1] or [None])
    paths.append(dict(kind='Пн–Пд', at=p['xc'], need=p['w'], got=round(hi - lo, 3)))
chk['paths'] = paths
json.dump(chk, open(os.environ.get('OUT', W + 'pv_check.json'), 'w'), ensure_ascii=False, indent=1)
print({k: v for k, v in chk.items() if k != 'fields'}); print('fields', len(fields)); [print(f) for f in fields]
