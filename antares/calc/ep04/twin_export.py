# -*- coding: utf-8 -*-
"""final.json → ../../obj/src/elec04data.js (ELEC04): щити, траси ліній по даху (коридори як у final.py), спуски, ШВ, лотки, входи (04.11.2026).
Ідентифікатори щитів — ті самі, що були у двійнику (фасади — за фасадом і місцем, дах — за координатами)."""
import json, os, math
os.environ.setdefault('MERGED', '1')
from ep_opt import graph, dijk, path, DE, DN
H = os.path.dirname(os.path.abspath(__file__))
F = json.load(open(os.path.join(H, 'final.json')))
p = os.path.join(H, '../../obj/src/elec04data.js'); s = open(p, encoding='utf-8').read(); i = s.find('{'); j = s.rfind('}') + 1; E = json.loads(s[i:j])
old = E['boxes']
def oid(r):
    if r.get('id'): return r['id']
    if r['z'] == 'fac': return min((b for b in old if b['z'] == 'fac' and b['f'] == r['f']), key=lambda b: abs(b['s'] - r['s']))['id']
    return min((b for b in old if b['z'] == 'roof'), key=lambda b: (b['X'] - r['X']) ** 2 + (b['Y'] - r['Y']) ** 2)['id']
boxes, routes = [], []
for r in F['rows']:
    b = {'id': oid(r), 'st': r['st'], 'z': r['z'], 'ns': r['ns'], 'K': r['K'], 'L': round(r['L'], 1), 'S': r['S'], 'du': round(r['du'], 2), 'kwp': round(r['ns'] * 8.0311, 1)}
    if r['z'] == 'fac':
        b.update(f=r['f'], s=r['s'])
        if r.get('roof'): b.update(roof=1, X=round(r['X'], 2), Y=round(r['Y'], 2))   # 05.11: щит на даху біля парапету
    elif r['z'] == 'wh': o = next(x for x in old if x['id'] == b['id']); b.update(X=o['X'], Y=o['Y'])
    else: b.update(X=r['X'], Y=r['Y'])
    boxes.append(b)
    if r['z'] in ('roof', 'lan') or (r['z'] == 'fac' and r.get('roof')):
        d = 'E' if r['K'] in ('K-3', 'K-1') else 'N'; st = (r['X'], r['Y'])
        dist, prev = dijk(graph([st]), st); pts = path(prev, st, DE if d == 'E' else DN)
        routes.append({'id': b['id'], 'st': r['st'], 'K': r['K'], 'pts': [[round(x, 2), round(y, 2)] for x, y in pts], 'd': d})
order = {b['id']: k for k, b in enumerate(old)}; boxes.sort(key=lambda b: order.get(b['id'], 999))
assert len({b['id'] for b in boxes}) == len(boxes) == len(old), 'щити не зійшлися з двійником'
E.update(boxes=boxes, routes=routes, T={str(k): v for k, v in F['T'].items()}, inp=F['inp'], kwp={k: round(v, 1) for k, v in F['kwp'].items()}, var=F.get('var', '1'),
         segs=[dict(a=[round(v, 3) for v in g['a']], b=[round(v, 3) for v in g['b']], n=g['n1'] + g['n2'], w=g['w'], st=g['st'], m=g['mnt']) for g in F['segs']],
         cross=F['cross'], shv={k: list(v) for k, v in F['shv'].items()}, DE=list(F['DE']), DN=list(F['DN']),
         lines={'Y': [-0.17, 31.34, 62.70, 96.26], 'X': [1.985, 18.7, 37.58, 55.91, 96.31]})
open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(E, ensure_ascii=False, separators=(',', ':')) + s[j:])
print('ELEC04: варіант', E['var'], 'щитів', len(boxes), 'трас', len(routes), 'входи', E['inp'])
