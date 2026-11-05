# -*- coding: utf-8 -*-
"""Перевірка проходів на даху після розводки 05.11.2026: скільки вільної ширини лишається біля лотків і щитів у кожній смузі / проході,
перетини з трубами, лівневками, виходом на дах. Дані — final.json (відрізки лотків, щити), data.json (модулі В1, труби, лівневки, правила).
Результат — у ../../obj/src/elec04data.js (ELEC04.chk) і в консоль."""
import json, os, collections
H = os.path.dirname(os.path.abspath(__file__)); os.chdir(H)
F = json.load(open('final.json')); D = json.load(open('data.json'))
R = D['roof']; HM = 2.384 / 2; RI = (-0.13, 96.49, -0.25, 96.34)
YS, Y1, Y2, YN = -0.17, 31.34, 62.70, 96.26; XW, XV, XE = 1.985, 18.7, 96.31
REQ = {'Пд': 1.83, 'Пн': 1.83, 'Зх': 1.83, 'Сх': 1.83, 'Сх–Зх': 2.49, 'Пн–Пд': 1.22, 'ендова': None}
def gap_h(y, x0, x1):
    lo, hi = RI[2], RI[3]
    for m in R:
        if m[1] < x0 - 0.01 or m[0] > x1 + 0.01: continue
        if m[2] < y: lo = max(lo, m[2] + HM)
        else: hi = min(hi, m[2] - HM)
    return lo, hi
def gap_v(x, y0, y1):
    lo, hi = RI[0], RI[1]
    for m in R:
        if m[2] + HM < y0 - 0.01 or m[2] - HM > y1 + 0.01: continue
        if (m[0] + m[1]) / 2 < x: lo = max(lo, m[1])
        else: hi = min(hi, m[0])
    return lo, hi
def zone(sg):
    (x0, y0), (x1, y1) = sg['a'], sg['b']
    if abs(y0 - y1) < 1e-6:
        y = y0
        return 'Пд' if abs(y - YS) < 1e-3 else 'Пн' if abs(y - YN) < 1e-3 else 'Сх–Зх'
    x = x0
    return 'Зх' if abs(x - XW) < 1e-3 else 'Сх' if abs(x - XE) < 1e-3 else 'ендова' if abs(x - XV) < 1e-3 else 'Пн–Пд'
foot_blk = lambda w: max(0.30, w / 1000 + 0.10)
dep_par = lambda w: w / 1000 + 0.05
TW = {'100×50': 100, '200×50': 200, '300×100': 300, '400×100': 400}
rows = []
for sg in F['segs']:
    sg = dict(sg, m=sg['mnt'], n=sg['n1'] + sg['n2']); z = zone(sg); w = TW[sg['w']]; (x0, y0), (x1, y1) = sg['a'], sg['b']; hor = abs(y0 - y1) < 1e-6
    # ділянка смуги, вздовж якої йде лоток: лише та частина відрізка, що лежить у смузі (кінці, що перетинають інші смуги, — переходи)
    if hor: lo, hi = gap_h(y0, min(x0, x1) + 0.3, max(x0, x1) - 0.3) if abs(x1 - x0) > 0.7 else gap_h(y0, min(x0, x1), max(x0, x1))
    else: lo, hi = gap_v(x0, min(y0, y1) + 0.3, max(y0, y1) - 0.3) if abs(y1 - y0) > 0.7 else gap_v(x0, min(y0, y1), max(y0, y1))
    gap = hi - lo
    if sg['m'] == 'par': clr = gap - dep_par(w)
    else: clr = gap - foot_blk(w) - 0.05
    L = abs(x1 - x0) + abs(y1 - y0)
    rows.append(dict(z=z, a=sg['a'], b=sg['b'], w=sg['w'], n=sg['n'], st=sg['st'], m=sg['m'], gap=round(gap, 2), clr=round(clr, 2), L=round(L, 2), req=REQ[z]))
# зведення по смугах / проходах: мінімум вільної ширини уздовж лотка, довжина
agg = collections.OrderedDict()
for r in sorted(rows, key=lambda r: list(REQ).index(r['z'])):
    if r['L'] < 1.0: continue        # короткі відрізки-переходи через смугу — окремо
    a = agg.setdefault(r['z'], dict(z=r['z'], req=r['req'], L=0.0, gap=9.0, clr=9.0, m=set(), w=set()))
    a['L'] += r['L']; a['gap'] = min(a['gap'], r['gap']); a['clr'] = min(a['clr'], r['clr']); a['m'].add(r['m']); a['w'].add(r['w'])
# щити
BXR = []
for r in F['rows']:
    if not (r['z'] in ('roof', 'lan') or r.get('roof')): continue
    x, y = r['X'], r['Y']
    if abs(y - YS) < 1e-3: z, dep = 'Пд', 0.45; lo, hi = gap_h(0.5, x - 0.45, x + 0.45)
    elif abs(y - YN) < 1e-3: z, dep = 'Пн', 0.45; lo, hi = gap_h(95.0, x - 0.45, x + 0.45)
    elif abs(x - XE) < 1e-3: z, dep = 'Сх', 0.60; lo, hi = gap_v(95.0, y - 0.45, y + 0.45)
    else: z, dep = 'Сх–Зх', 0.60 + 0.05; lo, hi = gap_h(y + 0.5, x - 0.45, x + 0.45)
    gap = hi - lo
    if r['z'] == 'lan': gap = 2.51        # біля ліхтаря: прохід Сх–Зх між рядами полів
    BXR.append(dict(id=r.get('id'), z=z, x=x, y=y, gap=round(gap, 2), clr=round(gap - dep, 2), req=REQ[z]))
# труби, лівневки, вихід
FLAGS = []
for p in D['pipes']:
    px, py, d = p[1], p[2], p[3]
    for r in rows:
        (x0, y0), (x1, y1) = r['a'], r['b']
        if min(x0, x1) - d / 2 - 0.3 <= px <= max(x0, x1) + d / 2 + 0.3 and min(y0, y1) - d / 2 - 0.3 <= py <= max(y0, y1) + d / 2 + 0.3:
            FLAGS.append(f'труба Д{p[0]} (X {px}, Y {py}) — {r["z"]}: лоток за {max(0.0, round(min(abs(px - x0), abs(py - y0)) - d / 2, 2))} м')
for nm, dx, dy, _ in D['drains']:
    for r in rows:
        (x0, y0), (x1, y1) = r['a'], r['b']
        dist = max(min(x0, x1) - dx, 0, dx - max(x0, x1)) + max(min(y0, y1) - dy, 0, dy - max(y0, y1))
        if dist < 0.6 and r['m'] == 'blk': FLAGS.append(f'{nm} (X {dx}, Y {dy}) — лоток на блоках за {round(dist, 2)} м: місток над зоною лівневки')
ex = D['rules']['exit']
for r in rows:
    (x0, y0), (x1, y1) = r['a'], r['b']
    if abs(y0 - y1) < 1e-6 and ex['y'][0] - 0.1 <= y0 <= ex['y'][1] and min(x0, x1) < ex['x'][1] and max(x0, x1) > ex['x'][0]:
        FLAGS.append(f'вихід на дах (X {ex["x"][0]}–{ex["x"][1]}): лоток на парапеті Пд проходить повз — потрібно: як влаштовано вихід; якщо через парапет — лоток обійти зовні парапету')
FLAGS = sorted(set(FLAGS))
NC = len(F['cross']) + sum(F['nbx_cross'].values())
CHK = dict(agg=[dict(a, L=round(a['L'], 1), m=sorted(a['m']), w=sorted(a['w'])) for a in agg.values()], boxes=BXR, flags=FLAGS, cross=len(F['cross']), nbx=sum(F['nbx_cross'].values()), stepovers=NC)
p = '../../obj/src/elec04data.js'; s = open(p, encoding='utf-8').read(); i = s.find('{'); j = s.rfind('}') + 1; E = json.loads(s[i:j]); E['chk'] = CHK
open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(E, ensure_ascii=False, separators=(',', ':')) + s[j:])
for a in CHK['agg']: print(f"{a['z']:7} треба {a['req'] or '—'}  смуга {a['gap']:.2f}  лишається ≥ {a['clr']:.2f}  {a['L']:6.1f} м  {a['m']} {a['w']}")
bz = collections.defaultdict(list)
for b in BXR: bz[b['z']].append(b['clr'])
for z, v in bz.items(): print(f'щити {z}: {len(v)} шт., лишається ≥ {min(v):.2f} м (треба {REQ[z]})')
print('переходи', CHK['cross'], '+ біля щитів', CHK['nbx'], '=', NC); [print(' •', f) for f in FLAGS]
