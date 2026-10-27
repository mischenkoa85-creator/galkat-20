# -*- coding: utf-8 -*-
"""Дані v3 (27.10.2026, вечір) для 3D-двійника:
- ROOFV2.C / D / E — розкладка даху за обмірами 27.10 і супутником, варіанти А (усі місця), Б (від 1 050 кВт·год/м²), В (від 1 100);
  формат як у сценарію B (roofv2.js): lan, mods [xa, xb, y, статус, кВт·год, тінь %], sum, base, flush (модулі книжково на ліхтарях 3,66 × 1,89);
- ROOFV2.V3 — дефлектори (супутник + РП), підсумки варіантів, параметри економіки;
- RADD.cells.roof — опромінення покрівлі 0,5 × 0,5 м з v3 (irr_v3.json) замість 1 × 1 м від 26.10.
Запуск після roof_v3.py, irr_v3.py, layout_v3.py."""
import json, math, sys, numpy as np, collections
sys.argv = ['x']
exec(open('/home/claude/work/sun/v3/roof_v3.py', encoding='utf-8').read().split("if __name__ == '__main__':")[0])
TWD = '/home/claude/work/twin/'
J = json.load(open(V + 'roof_v3.json')); L3 = json.load(open(V + 'layout_v3.json')); IR = json.load(open(V + 'irr_v3.json'))
cand = J['cand']; free = [c for c in cand if c['why'] is None]
key = lambda c: (round(c['xa'], 3), round(c['y'], 3))
fidx = {key(c): i for i, c in enumerate(free)}
LM, DM = 2.384, 1.303
def pack_sum(ids, strings):
    mo = np.zeros(12); un = 0.0
    for s in strings:
        pass
    return None
OUT = {}
for code, V_ in zip('CDE', L3['VARS']):
    inS = {}
    for s in V_['strings']:
        for i in s['ids']: inS[i] = s['id']
    thr = {'C': 0, 'D': 1050, 'E': 1100}[code]
    mods = []
    for c in cand:
        if c['why'] is None:
            i = fidx[key(c)]; st = 'ok' if i in inS else ('thr' if c['irr'] < thr else 'str')
            mods.append([c['xa'], c['xb'], c['y'], st, c['kwh'], c['loss'], c['irr'], inS.get(i, -1)])
        else:
            mods.append([c['xa'], c['xb'], c['y'], c['why'], None, None, None, -1])
    ok = [c for c in free if fidx[key(c)] in inS]
    un = sum(c['un'] for c in ok) / 1000
    mo = [round(x, 3) for x in V_['mo']]
    OUT[code] = dict(lan=[[L['x0'], L['x1'], L['y0'], L['y1'], L['zb'], L['h']] for L in LAN], mods=mods,
                     sum=dict(mwh=V_['mwh'], un=round(un, 2), mo=mo),
                     base=dict(n=V_['n'], st=V_['st'], kwp=V_['kwp'], mwh=V_['mwh'], y=V_['y'], mism=V_['mism'], drop=V_['drop'], sel=V_['sel'], irr=V_['irr'], cost=V_['cost'], rev=V_['rev'], pb=V_['pb']),
                     thr=thr)
# ---------- модулі книжково на ліхтарях 3,66 × 1,89: річна генерація кожного, тінь від них на модулі даху (варіант А)
th = math.atan2(LH, LW / 2); cs, sn = math.cos(th), math.sin(th)
LP = []; LN = []; LMODS = L3['LMODS']
for m in LMODS:
    Lq = LAN[m['l'] - 1]; sg = 1 if m['side'] == 'E' else -1; nrm = np.array([sg * sn, 0, cs]); LN.append(nrm)
    for sa in (0.02 + LM * 0.2, 0.02 + LM * 0.5, 0.02 + LM * 0.8):
        LP.append((Lq['xc'] + sg * sa * cs + nrm[0] * 0.183, m['y'] + DM / 2, Lq['zb'] + Lq['h'] - sa * sn + nrm[2] * 0.183))
RL = run(np.array(LP), np.array(LN), 20)
# стрінги ліхтарів — як у layout_v3 (по 11 уздовж схилу, залишки сходу і заходу разом)
keep = set(); rest = {'E': [], 'W': []}
for li in range(4):
    for sd in 'EW':
        ii = sorted([i for i, m in enumerate(LMODS) if m['l'] == li + 1 and m['side'] == sd], key=lambda i: LMODS[i]['y'])
        keep.update(ii[:len(ii) // 11 * 11]); rest[sd] += ii[len(ii) // 11 * 11:]
for sd in 'EW': keep.update(rest[sd][:len(rest[sd]) // 11 * 11])
kp = sorted(keep); left = [i for i in range(len(LMODS)) if i not in keep]
# тінь від модулів на ліхтарях на модулі даху (варіант А): DSM з модулями на схилах
okA = [c for c in free if fidx[key(c)] in {i for s in L3['VARS'][0]['strings'] for i in s['ids']}]
P = []; N = []
for c in okA:
    nv = np.array([-c['k'], 0, 1.0]); nv /= np.linalg.norm(nv); N.append(nv)
    for t in (-0.892, 0.0, 0.888): P.append((c['xm'], c['y'] + t, c['zm'] + 0.12 + 0.033 + 0.03))
E0 = run(np.array(P), np.array(N), 20)['E']
for Lq in LAN:
    n = int((Lq['y1'] - Lq['y0'] + 0.022) // 1.325); ys = (Lq['y0'] + Lq['y1']) / 2 - (n * 1.325 - 0.022) / 2
    m = (np.abs(XX - Lq['xc']) >= 0.02 * cs) & (np.abs(XX - Lq['xc']) <= (0.02 + LM) * cs + 0.12 * sn) & (YY >= ys) & (YY <= ys + n * 1.325)
    H[m] = np.maximum(H[m], (Lq['zb'] + Lq['h'] * (1 - np.abs(XX[m] - Lq['xc']) / (LW / 2)).clip(0) + 0.153 / cs).astype(np.float32))
E1 = run(np.array(P), np.array(N), 20)['E']; dR = E0 - E1
lm = [[m['l'], m['side'], m['y'], round(float(RL['E'][i]), 1), round(float(1 - RL['E'][i] / RL['Eun'][i]) * 100, 1), 1 if i in keep else 0] for i, m in enumerate(LMODS)]
LV = L3['LAN']; roof_loss = round(float(dR.sum()) / 1000, 2)
perlan = [dict(no=l + 1, n=sum(1 for m in LMODS if m['l'] == l + 1), mwh=round(sum(RL['E'][i] for i, m in enumerate(LMODS) if m['l'] == l + 1) / 1000, 1)) for l in range(4)]
FL = dict(K=dict(places=len(LMODS), n=LV['n'], st=LV['st'], kwp=LV['kwp'], mwh=LV['mwh'], y=LV['y'], roof_loss=roof_loss, net=round(LV['mwh'] - roof_loss, 1),
                 E=round(float(np.mean([RL['E'][i] for i, m in enumerate(LMODS) if m['side'] == 'E'])) / 0.73), W=round(float(np.mean([RL['E'][i] for i, m in enumerate(LMODS) if m['side'] == 'W'])) / 0.73),
                 roof_hit=int((dR > 5).sum()), roof_max=round(float((dR / E0).max()) * 100, 2), perlan=perlan, left=len(left), left_mwh=round(sum(RL['E'][i] for i in left) / 1000, 2), gap=0.25, tilt=LV['tilt']),
          th=round(math.degrees(th), 2), mods=lm,
          sum=dict(mwh=LV['mwh'], un=round(sum(RL['Eun'][i] for i in kp) / 1000, 2), mo=[round(float(RL['Emo'][mo][kp].sum()) / 1000, 3) for mo in range(12)]), dR=[round(float(x), 1) for x in dR])
for code in 'CDE': OUT[code]['flush'] = FL
print('lantern', FL['K'])
# ---------- без дефлекторів (якщо їх приберуть при заміні покрівлі) — для порівняння
try:
    LN_ = json.load(open(V + 'layout_v3_nodefl.json'))['VARS']
    NOD = [dict(n=v['n'], st=v['st'], kwp=v['kwp'], mwh=v['mwh'], y=v['y']) for v in LN_]
except Exception: NOD = None
DF_ = json.load(open(V + 'defl_v3.json'))
V3 = dict(date='27.10.2026', defl=[[o['n'], o['x'], o['y'], o['d'], o['h'], o['src'], o['st']] for o in DF_], vars={c: OUT[c]['base'] for c in 'CDE'}, nodefl=NOD,
          val=round(L3['VAL'], 4), cost=L3['COST'], ac=dict(x0=AC['x0'], x1=AC['x1'], y0=AC['y0'], y1=AC['y1']), par=PAR, lan=dict(w=LW, h=LH), lanv=LV)
s = open(TWD + 'roofv2data.js', encoding='utf-8').read(); R2 = json.loads(s[s.find('{'):s.rfind('}') + 1])
for c in 'CDE': R2[c] = OUT[c]
R2['V3'] = V3
open(TWD + 'roofv2data.js', 'w', encoding='utf-8').write('const ROOFV2=' + json.dumps(R2, ensure_ascii=False, separators=(',', ':')) + ';')
# ---------- RADD: дах 0,5 м з v3
s = open(TWD + 'raddata.js', encoding='utf-8').read(); RD = json.loads(s[s.find('{'):s.rfind('}') + 1]) if 'v3txt' not in s else json.loads(open(TWD + 'raddata_v2_backup.js', encoding='utf-8').read().split('=', 1)[1].rstrip(';'))
k = IR['k']; e = IR['e']; u = IR['u']
E_ = [0 if (k[i] != 'r' or e[i] is None) else e[i] for i in range(len(e))]
Lp = [0 if (k[i] != 'r' or e[i] is None or not u[i]) else int(round((1 - e[i] / u[i]) * 100)) for i in range(len(e))]
W_ = ''.join('0' if k[i] == 'r' else '1' for i in range(len(e)))
RD['cells']['roof'] = dict(nx=IR['nx'], ny=IR['ny'], s0=IR['res'] / 2, t0=IR['res'] / 2, res=IR['res'], e=E_, l=Lp, w=W_, v3=1)
RD['cl'] = [850, 1000, 1050, 1100, 1150]; RD['cln'] = ['< 850', '850–1 000', '1 000–1 050', '1 050–1 100', '1 100–1 150', '≥ 1 150']
for nm_, c_ in RD['cells'].items():
    if nm_ == 'roof': continue
    ee = [v for i_, v in enumerate(c_['e']) if v and not (c_.get('w') and c_['w'][i_] == '1')]
    ee = np.array(ee); RD['st'][nm_]['cls'] = [int(((ee >= ([0] + RD['cl'])[i]) & (ee < (RD['cl'] + [1e9])[i])).sum()) for i in range(6)]
vals = np.array([v for v, kk in zip(E_, k) if kk == 'r' and v > 0]); A = IR['res'] ** 2
cl = RD['cl']; cls = [int(((vals >= ([0] + cl)[i]) & (vals < (cl + [1e9])[i])).sum() * A) for i in range(6)]
RD['st']['roof'] = dict(name='Дах цеху (грані за розрізом 1-1, v3)', cells=len(vals), area=round(len(vals) * A), mean=round(float(vals.mean())), min=round(float(vals.min())), max=round(float(vals.max())),
                        p10=round(float(np.percentile(vals, 10))), p90=round(float(np.percentile(vals, 90))), shade=round(float(1 - vals.sum() / sum(uu for uu, kk in zip(u, k) if kk == 'r' and uu)) * 100, 1), cls=cls)
# смуги біля стін для тексту
def band(x0, x1, y0, y1):
    m = [(e[i]) for i in range(len(e)) if k[i] == 'r' and e[i]]
    xs = np.arange(IR['res'] / 2, 96.64, IR['res']); ys = np.arange(IR['res'] / 2, 96.34, IR['res'])
    sel = [e[j * IR['nx'] + i] for j, y in enumerate(ys) for i, x in enumerate(xs) if x0 <= x < x1 and y0 <= y < y1 and k[j * IR['nx'] + i] == 'r' and e[j * IR['nx'] + i]]
    seu = [u[j * IR['nx'] + i] for j, y in enumerate(ys) for i, x in enumerate(xs) if x0 <= x < x1 and y0 <= y < y1 and k[j * IR['nx'] + i] == 'r' and e[j * IR['nx'] + i]]
    return round((1 - sum(sel) / sum(seu)) * 100) if sel else None
RD['v3txt'] = dict(w0=band(0, 1, 5, 90), w4=band(3.5, 4.5, 5, 90), w7=band(6.5, 7.5, 5, 90), s0=band(5, 90, 0, 0.5), s1=band(5, 90, 0.5, 1.5), n0=band(5, 90, 95.5, 96.34), e0=band(95.5, 96.64, 5, 90),
                   good=round(sum(cls[4:])), area=RD['st']['roof']['area'])
open(TWD + 'raddata.js', 'w', encoding='utf-8').write('const RADD=' + json.dumps(RD, ensure_ascii=False, separators=(',', ':')) + ';')
print('roofv2data', len(open(TWD + 'roofv2data.js').read()) // 1024, 'KB; raddata', len(open(TWD + 'raddata.js').read()) // 1024, 'KB')
print(RD['st']['roof']); print(RD['v3txt'])
