# -*- coding: utf-8 -*-
"""Підсумок розкладки на даху за розрізом 1-1 (27.10.2026): поріг тіні 15 %, підгонка під стрінги по 11, варіанти."""
import json, glob, numpy as np, collections
D = 'calc/v2/'
BASE = 'roof_v2_1.5_0.25.json'; THR = 15
J = json.load(open(D + BASE)); A = J['cand']; C = [c for c in A if c['why'] is None]
key = lambda c: (c['xa'], c['y'])
sel0 = [c for c in C if c['loss'] <= THR]; drop = sorted(sel0, key=lambda c: c['kwh'])[:len(sel0) % 11]; dk = {key(c) for c in drop}
sel = [c for c in sel0 if key(c) not in dk]
for c in A:
    c['s'] = 'ok' if c['why'] is None and key(c) not in dk and c['loss'] <= THR else ('str' if key(c) in dk else (c['why'] or 'shade'))
summ = lambda s: dict(n=len(s), st=len(s) // 11, kwp=round(len(s) * 0.73, 1), mwh=round(sum(c['kwh'] for c in s) / 1000, 1), y=round(sum(c['kwh'] for c in s) / len(s) / 0.73))
R = dict(base=summ(sel), thr=THR, LH=J['LH'], LAN=J['LAN'], ZONES=J['ZONES'], ROWS=J['ROWS'], FAC=J['FAC'],
         cnt=collections.Counter(c['s'] for c in A), cand=len(A))
# по прольотах і орієнтації
R['span'] = []
for sp in ['1–4', '4–7', '7–10', '10–13', '13–17']:
    s = [c for c in sel if c['sp'] == sp]; e = [c for c in s if c['face'] == 'E']; w = [c for c in s if c['face'] == 'W']
    R['span'].append(dict(sp=sp, n=len(s), kwp=round(len(s) * 0.73, 1), mwh=round(sum(c['kwh'] for c in s) / 1000, 1), y=round(sum(c['kwh'] for c in s) / max(1, len(s)) / 0.73),
                          E=len(e), W=len(w), cols=len(set(c['xa'] for c in s))))
# варіанти: поріг × висота ліхтаря × відступ від ліхтаря
V = []
for fn in sorted(glob.glob(D + 'roof_v2_*_*.json')):
    j = json.load(open(fn)); cc = [c for c in j['cand'] if c['why'] is None]; lcx = float(fn.split('_')[-1][:-5])
    for t in (10, 15, 20):
        s = [c for c in cc if c['loss'] <= t]; s = sorted(s, key=lambda c: -c['kwh'])[:len(s) // 11 * 11]
        V.append(dict(LH=j['LH'], lcx=lcx, thr=t, n=len(s), st=len(s) // 11, kwp=round(len(s) * 0.73, 1), mwh=round(sum(c['kwh'] for c in s) / 1000, 1), y=round(sum(c['kwh'] for c in s) / len(s) / 0.73)))
R['var'] = V
# колонки біля західної стіни
cols = sorted(set(c['xa'] for c in C if c['sp'] == '1–4'))[:7]
R['west'] = [dict(xa=x, n=sum(1 for c in C if c['xa'] == x), loss=round(float(np.mean([c['loss'] for c in C if c['xa'] == x])), 1),
                  y=round(float(np.mean([c['kwh'] for c in C if c['xa'] == x])) / 0.73), tilt=next(c['tilt'] for c in C if c['xa'] == x),
                  face=next(c['face'] for c in C if c['xa'] == x), kept=sum(1 for c in sel if c['xa'] == x)) for x in cols]
R['lanadj'] = round(float(np.mean([c['loss'] for c in sel if any(abs(c['xb'] - L['x0']) < 0.35 or abs(c['xa'] - L['x1']) < 0.35 for L in J['LAN']) and 23 < c['y'] < 79])), 1)
R['old'] = dict(n=1705, kwp=1244.6, mwh=1206.7, y=970)
R['wh'] = dict(n=176, st=16); R['fac'] = dict(n=319, st=29)
R['total'] = dict(n=R['base']['n'] + 176 + 319, st=R['base']['st'] + 16 + 29, kwp=round((R['base']['n'] + 495) * 0.73, 1))
R['mods'] = [[c['xa'], c['xb'], c['y'], c['s'], round(c.get('kwh', 0)), c.get('loss', None), c['tilt'], c['face'], c['sp']] for c in A]
json.dump(R, open(D + 'final_v2.json', 'w'), ensure_ascii=False)
for k in ('base', 'cnt', 'span', 'west', 'lanadj', 'total'): print(k, R[k])
for v in V: print(v)
