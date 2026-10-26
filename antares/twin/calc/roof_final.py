# -*- coding: utf-8 -*-
"""Підсумок нової розкладки даху цеху (26.10.2026): з roof_novents.json / roof_vents.json (roof_new.py).
База: зона рами кондиціонерів + 1 м; 4 колонки біля західної стіни прибрано (втрати від тіні 15–39 %)."""
import json, numpy as np
ov = lambda a0, a1, b0, b1: a0 < b1 and b0 < a1
J = json.load(open('calc/roof_novents.json')); NV = J['cand']; ZONES = [z for z in J['zones'] if 'двер' not in z['n']]
ZK = {ZONES[0]['n']: 'ac', ZONES[1]['n']: 'portal'}; WV = json.load(open('calc/roof_vents.json'))['cand']
key = lambda c: (round(c['xa'], 3), round(c['y'], 3)); WVk = {key(c): c for c in WV}
for c in NV:
    c['zone'] = next((ZK[z['n']] for z in ZONES if ov(c['xa'], c['xb'], *z['x']) and ov(c['y'] - 1.192, c['y'] + 1.192, *z['y'])), None); c['kwh_v'] = WVk[key(c)]['kwh']
cols = sorted(set(c['xa'] for c in NV)); DROP = 4; XW = cols[DROP]
tw = open('src/year.js', encoding='utf-8').read(); YR = json.loads(tw[tw.find('{'):tw.rfind('}') + 1])
dj = open('src/data.js', encoding='utf-8').read(); DJ = json.loads(dj[dj.find('{'):dj.rfind('}') + 1]); OM = DJ['ours']['mods']
twk = {(round(o[0], 3), round(o[2], 3)): YR['kwh']['ours'][i] for i, o in enumerate(OM)}
def status(c, drop=DROP):
    if c['zone']: return c['zone']
    if c['xa'] < cols[drop]: return 'west'
    return 'old' if c['old'] else 'new'
base0 = [c for c in NV if status(c) in ('old', 'new')]; NSTR = sorted(base0, key=lambda c: c['kwh'])[:len(base0) % 11]; STRK = {key(c) for c in NSTR}
mods = []
for c in NV:
    s = status(c)
    if key(c) in STRK: s = 'str'
    if c['old'] or status(c) in ('old', 'new'): mods.append(dict(xa=c['xa'], xb=c['xb'], y=c['y'], s=s, kwh=c['kwh'], loss=c['loss'], tw=twk.get(key(c))))
old = [c for c in NV if c['old']]
def summ(sel, k='kwh'): n = len(sel); e = sum(c[k] for c in sel); return dict(n=n, kwp=round(n * 0.73, 1), mwh=round(e / 1000, 1), y=round(e / n / 0.73), st=n // 11, rest=n % 11)
VAR = []
for d in (0, 3, 4, 5):
    sel = [c for c in NV if not c['zone'] and c['xa'] >= cols[d]]; v = summ(sel); v.update(drop=d, new=sum(1 for c in sel if not c['old']), rem=sum(1 for c in old if c not in sel))
    fit = sorted(sel, key=lambda c: -c['kwh'])[:len(sel) // 11 * 11]; f = summ(fit); v.update(fn=f['n'], fkwp=f['kwp'], fmwh=f['mwh'], fy=f['y']); VAR.append(v)
COL = []
for k in range(7):
    s = [c for c in NV if c['xa'] == cols[k] and not c['zone']]
    COL.append(dict(k=k + 1, xa=cols[k], xb=s[0]['xb'], dist=round(cols[k] + 0.15, 2), n=len(s), loss=round(float(np.mean([c['loss'] for c in s])), 1),
                    y=round(float(np.mean([c['kwh'] for c in s])) / 0.73), mwh=round(sum(c['kwh'] for c in s) / 1000, 1)))
base = [c for c in base0 if key(c) not in STRK]
inter = [c for c in base if c['xa'] > 20]
R = dict(zones=ZONES, drop=DROP, xw=XW, base=summ(base), old_twin=dict(n=len(OM), mwh=round(YR['tot']['oursShop'] / 1000, 1)),
         old_v=summ(old, 'kwh_v'), old_nv=summ(old), base_v=summ(base, 'kwh_v'),
         cnt={s: sum(1 for m in mods if m['s'] == s) for s in ('old', 'new', 'west', 'ac', 'portal', 'str')}, base0=summ(base0), strm=[[c['xa'], round(c['y'], 3), round(c['loss'], 1)] for c in NSTR], VAR=VAR, COL=COL,
         vent_gain=round((sum(c['kwh'] for c in old) - sum(c['kwh_v'] for c in old)) / 1000, 1),
         west_loss_old=round((sum(twk[key(c)] for c in old) - sum(c['kwh'] for c in old)) / 1000, 1),
         new_y=round(np.mean([c['kwh'] for c in base if not c['old']]) / 0.73), int_ratio=round(float(np.mean([c['kwh'] / twk[key(c)] for c in inter if c['old']])), 3),
         fac=dict(n=319, kwp=232.9, mwh=170.6))
R['cnt']['new_all'] = R['cnt']['new'] + sum(1 for c in NSTR if not c['old']); R['cnt']['str_old'] = sum(1 for c in NSTR if c['old'])
R['wh'] = dict(n=176, kwp=128.5, mwh=148.7)
R['ep'] = dict(n=1925, roof=1749, kwp=1405.25, mwh=1348.8, roof_mwh=1200.1, mism=23.9)
R['total'] = dict(n=R['base']['n'] + 176 + 319, st=R['base']['st'] + 16 + 29, kwp=round((R['base']['n'] + 176 + 319) * 0.73, 1), mwh=round(R['base']['mwh'] + 148.7 + 170.6, 1))
R['mods'] = [[round(m['xa'], 3), round(m['xb'], 3), round(m['y'], 3), m['s'], round(m['kwh']), m['loss']] for m in mods]
json.dump(R, open('calc/roof_final.json', 'w'), ensure_ascii=False)
for k, v in R.items():
    if k != 'mods': print(k, v)
