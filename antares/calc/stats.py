# -*- coding: utf-8 -*-
"""Зведення радіації по поверхнях + дані для двійника (rad.js-дані RADD)."""
import json, numpy as np
O = json.load(open('/home/claude/work/sun/rad.json'))
CL = [600, 850, 1000, 1100, 1150]          # межі класів, кВт·год/м²·рік
CLN = ['< 600', '600–850', '850–1 000', '1 000–1 100', '1 100–1 150', '≥ 1 150']
# вікна, ворота, жалюзі — як у fasad.js (s0, s1, h0, h1)
up = lambda a, b, n: [((a + (b - a) * k / n + a + (b - a) * (k + 1) / n) / 2) for k in range(n)]
OPN = {'S': [], 'N': [], 'E': []}
for k, c in enumerate(up(-0.5, 96.59, 16)):
    OPN['E'].append((c - 2.2, c + 2.2, 6.5, 8.8) if k < 4 else (c - 2.2, c + 2.2, 6.6, 11.2) if k in (7, 12) else (c - 2.2, c + 2.2, 6.6, 9.7))
for k, c in enumerate(up(-0.15, 96.64, 16)):
    OPN['N'].append((c - 2.6, c + 2.6, 6.6, 11.2) if k in (8, 9) else (c - 2.2, c + 2.2, 6.6, 9.7))
    s = 7.6 + ((k * 7) % 3) * 0.3; h = 1.6 + ((k * 5) % 3) * 0.35; OPN['S'].append((c - 2.2, c + 2.2, s, s + h))
    if k in (7, 8, 11, 12, 14): OPN['S'].append((c - 2.2, c + 2.2, 10.2, 11.7))
OPN['E'] += [(84.0, 88.4, 1.3, 3.4), (90.0, 94.6, 1.3, 3.4), (76.3, 80.5, 0, 4.1)]
OPN['N'] += [(a, b, 1.3, 3.4) for a, b in [(36.2, 40.6), (42.2, 46.6), (48.2, 52.6), (66.2, 70.6), (72.2, 76.6), (84.2, 88.6), (90.2, 94.6)]]
OPN['S'] += [(a, b, 1.2, 3.35) for a, b in [(24.5, 28.5), (30.5, 34.7), (35.0, 38.4), (42.6, 46.0), (46.3, 50.4), (51.0, 52.0)]] + [(65.9, 70.6, 2.0, 3.6)]
OPN['S'] += [(a, b, 0, 3.9) for a, b in [(38.8, 41.8), (52.2, 55.2), (62.3, 65.1)]] + [(8.0, 11.6, 0, 4.0), (18.0, 21.6, 0, 4.0), (71.6, 76.0, 0, 4.4)]
OPN['S'] += [(a, b, 5.3, 5.95) for a, b in [(36.5, 38.0), (40.2, 41.4), (43.0, 44.8), (47.4, 49.5), (51.8, 53.4), (54.4, 55.2), (55.9, 57.4), (58.2, 59.6), (60.0, 61.2)]] + [(86.0, 86.8, 3.6, 4.4)]
def opening(k, s, h):
    for a, b, h0, h1 in OPN.get(k, []):
        ov = max(0, min(s + 0.5, b) - max(s - 0.5, a)) * max(0, min(h + 0.5, h1) - max(h - 0.5, h0))
        if ov > 0.3: return True
    return False
NAMES = {'roof': 'Дах цеху (по дузі арок)', 'S': 'Південний фасад (азимут 184°)', 'E': 'Східний фасад (94°)', 'N': 'Північний фасад (4°)',
         'whA': 'Склад, частина A (11° на південь)', 'whB': 'Склад, частина B (11° на південь)', 'whC1': 'Склад, частина C1 (двосхилий 22°)'}
ST = {}; TW = {}
for k, rows in O['surf'].items():
    free = [r for r in rows if r[5] is not None]
    win = [r for r in free if k in ('S', 'N', 'E') and opening(k, r[2], r[3])]
    wall = [r for r in free if not (k in ('S', 'N', 'E') and opening(k, r[2], r[3]))]
    v = np.array([r[5] for r in wall]); vu = np.array([r[6] for r in wall])
    cls = [int(((v >= ([0] + CL)[i]) & (v < (CL + [1e9])[i])).sum()) for i in range(6)]
    ST[k] = dict(name=NAMES[k], cells=len(rows), covered=len(rows) - len(free), openings=len(win), area=len(wall), mean=round(float(v.mean())), min=int(v.min()), max=int(v.max()),
                 p10=int(np.percentile(v, 10)), p90=int(np.percentile(v, 90)), shade=round(float(1 - v.sum() / vu.sum()) * 100, 1), cls=cls,
                 low25=int((np.array([r[3] for r in wall]) < 2.5).sum()) if k in ('S', 'N', 'E') else 0)
    # для двійника: [s, h (або y), z(центр), e, втрата %, вікно 0/1]
    nx = max(r[0] for r in rows) + 1; ny = max(r[1] for r in rows) + 1; e = [0] * (nx * ny); l = [0] * (nx * ny); w = [0] * (nx * ny)
    for r in free:
        n = r[1] * nx + r[0]; e[n] = r[5]; l[n] = int(round((1 - r[5] / r[6]) * 100)) if r[6] else 0; w[n] = 1 if (k in ('S', 'N', 'E') and opening(k, r[2], r[3])) else 0
    r0 = min(rows, key=lambda r: (r[1], r[0]))
    TW[k] = dict(nx=nx, ny=ny, s0=round(r0[2] - r0[0], 2) if k not in ('S', 'N', 'E') else round(r0[2] - r0[0], 2), t0=round(r0[3] - r0[1], 2), e=e, l=l, w=''.join(map(str, w)) if k in ('S', 'N', 'E') else '')
for k, s in ST.items(): print(k, s)
json.dump(dict(st=ST, cl=CL, cln=CLN, mo=O['mo'], ghi=O['meta']['ghi']), open('/home/claude/work/sun/stats.json', 'w'), ensure_ascii=False, indent=1)
open('/home/claude/work/twin/raddata.js', 'w', encoding='utf-8').write('const RADD=' + json.dumps(dict(cells=TW, st=ST, cl=CL, cln=CLN, ghi=O['meta']['ghi'], mo=O['mo']), ensure_ascii=False, separators=(',', ':')) + ';')
import os; print(os.path.getsize('/home/claude/work/twin/raddata.js') // 1024, 'KB')
