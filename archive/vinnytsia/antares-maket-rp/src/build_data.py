import json, collections, math
M3 = '/home/claude/m3d/'
g = json.load(open(M3 + 'geo127.json'))
S = json.load(open(M3 + 'segs127.json'))
L = json.load(open(M3 + 'lps112.json'))
E = json.load(open(M3 + 'eq128.json'))
r2 = lambda v: round(v, 2)

out = {}
# modules: X, Y, board, string, landscape(1)/portrait(0)
out['mods'] = [[r2(m['X']), r2(m['Y']), m['b'], m['s'], 1 if m['o'] == 'EW' else 0] for m in g['mods']]
# roof obstacles (main roof only)
out['obs'] = [[r2(o['X']), r2(o['Y']), o['D']] for o in g['obs'] if -1 < o['X'] < 97 and -1 < o['Y'] < 97]
# lanterns (from ETR arc.2 thick outlines)
out['lan'] = [[8.85, 12.25, 30.59, 78.39], [26.7, 30.1, 23.69, 78.39], [44.7, 48.1, 23.69, 78.39], [62.6, 66.0, 23.69, 78.39]]

def dedupe(segs, minlen=0.0):
    seen = set(); res = []
    for s in segs:
        a = (r2(s[0]), r2(s[1])); b = (r2(s[2]), r2(s[3]))
        if math.hypot(a[0]-b[0], a[1]-b[1]) < max(minlen, 0.02):
            continue
        k = (a, b) if a <= b else (b, a)
        if k in seen: continue
        seen.add(k); res.append([k[0][0], k[0][1], k[1][0], k[1][1]])
    return res

# DC (orange) and AC (red) routes from ETR arc.2
out['dc'] = dedupe([s for s in S['((1.0, 0.5, 0.0), 1.56)']], 0.3)
out['ac'] = dedupe([s for s in S['((1.0, 0.0, 0.0), 0.96)']], 0.3)

# lightning protection (BZ arc.2)
masts = []
for h in L['hexes']:
    X, Y = h
    if X > 120: continue        # legend
    masts.append([r2(X), r2(Y), 6 if Y > 110 else 4])
out['masts'] = masts
wire = [s for s in L['segs']['((0.0, 0.0, 1.0), 0.84)'] if math.hypot(s[2]-s[0], s[3]-s[1]) > 1.0]
wire = [s for s in wire if not (s[0] > 120 and s[1] > 80)]
out['wire'] = dedupe(wire, 1.0) + dedupe(L['segs']['((0.0, 0.0, 1.0), 0.84)q'], 1.0)
# down conductors (ЗП) — orange earth symbols, legend excluded
dn = []
for k, v in []: pass
import pymupdf
d = pymupdf.open('/home/claude/zipin/x/РП_Антарес_2025_12_07_27.03 .pdf')
p = d[111]
Ax, Kx, y1, y17 = 587.3, 1872.3, 364.5, 1649.5
SY = (Kx-Ax)/96; SX = (y17-y1)/96
T = lambda px, py: ((py-y1)/SX, (px-Ax)/SY)
for gg in p.get_drawings():
    col = tuple(round(v, 2) for v in gg['color']) if gg.get('color') else None
    w = round(gg.get('width') or 0, 2)
    if col == (0.95, 0.4, 0.13) and w == 1.68 and any(it[0] == 'c' for it in gg['items']):
        r = gg['rect']
        if r.width/SY > 0.6: continue
        X, Y = T((r.x0+r.x1)/2, (r.y0+r.y1)/2)
        dn.append([r2(X), r2(Y)])
out['down'] = dn

# equipotential bonding (ETR arc.3): rows conductor ПВ-3 1×6 vs ESS steel strip 40×4
bond = []; strip = []
for s in E['segs']['((0.0, 0.87, 0.22), 2.04)']:
    near = (95 < min(s[0], s[2]) < 103 and 50 < min(s[1], s[3]) < 85) or (20 < min(s[0], s[2]) < 42 and 110 < min(s[1], s[3]) < 125)
    (strip if near else bond).append(s)
out['bond'] = dedupe(bond, 0.2)
out['strip'] = dedupe(strip, 0.2)
rods = set()
for c in E['circ']['((0.0, 0.87, 0.22), 2.04)']:
    rods.add((round(c[0], 1), round(c[1], 1)))
out['rods'] = sorted([list(x) for x in rods])

# ESS pads, cabinets (ETR arc.2)
out['pads'] = [
  {'id': 'MS-1', 'x0': 97.65, 'x1': 100.05, 'y0': 57.23, 'y1': 68.23, 'axis': 'y',
   'gal': [[98.3, 99.63, 57.73+1.3*i, 58.88+1.3*i] for i in range(5)],
   'sm': [[98.3, 99.02, 64.23, 64.84], [98.3, 99.02, 64.98, 65.58]], 'mps': [98.3, 99.34, 65.73, 67.33],
   'pv': [[96.64, 97.01, 61.55, 62.58], [96.64, 97.01, 63.05, 64.07], [96.64, 97.01, 64.55, 65.57]], 'akb': [96.64, 97.01, 60.05, 61.07],
   'pvn': ['ЩР-PV(1)', 'ЩР-PV(2)', 'ЩР-PV(3)'], 'akbn': 'ЩР-АКБ(1)', 'kwp': 383.4, 'tp': 'ТП-5913'},
  {'id': 'MS-2', 'x0': 97.65, 'x1': 100.05, 'y0': 69.23, 'y1': 80.23, 'axis': 'y',
   'gal': [[98.3, 99.63, 69.73+1.3*i, 70.89+1.3*i] for i in range(5)],
   'sm': [[98.3, 99.02, 76.23, 76.83], [98.3, 99.02, 76.98, 77.59]], 'mps': [98.3, 99.34, 77.73, 79.34],
   'pv': [[96.64, 97.01, 73.53, 74.56], [96.64, 97.01, 75.04, 76.06], [96.64, 97.01, 76.53, 77.56]], 'akb': [96.64, 97.01, 72.03, 73.05],
   'pvn': ['ЩР-PV(4)', 'ЩР-PV(5)', 'ЩР-PV(6)'], 'akbn': 'ЩР-АКБ(2)', 'kwp': 383.4, 'tp': 'ТП-5913'},
  {'id': 'MS-3', 'x0': 26.35, 'x1': 37.35, 'y0': 117.6, 'y1': 120.0, 'axis': 'x',
   'gal': [[26.85+1.3*i, 28.0+1.3*i, 118.01, 119.35] for i in range(5)],
   'sm': [[33.35, 33.95, 118.63, 119.35], [34.1, 34.7, 118.63, 119.35]], 'mps': [34.85, 36.45, 118.29, 119.35],
   'pv': [[36.84, 37.86, 120.0, 120.36], [35.6, 36.62, 120.0, 120.36]], 'akb': [31.34, 32.37, 120.0, 120.36],
   'pvn': ['ЩР-PV(7)', 'ЩР-PV(8)'], 'akbn': 'ЩР-АКБ(3)', 'kwp': 255.6, 'tp': 'ТП-6923'},
]
json.dump(out, open('/home/claude/ant3d/data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
for k, v in out.items():
    print(k, len(v))
import os; print(os.path.getsize('/home/claude/ant3d/data.json'))
