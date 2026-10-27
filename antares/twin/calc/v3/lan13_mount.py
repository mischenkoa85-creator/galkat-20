# -*- coding: utf-8 -*-
"""Ліхтарі розібрати → модулі вертикально (книжково, довгою стороною вгору по схилу) на сталевому каркасі ліхтаря.
Кут — 13° (оцінка за фото 112242, 112246 зсередини: поперечні балки каркаса, еталон — схили скління 46° за рулеткою; власник на око — 20–22°).
Розкладка «зручна для монтажу»:
- по 1 ряду модулів на кожному схилі, 2 рейки вздовж ліхтаря на схил — у зоні притисків ZNSHINE (540 мм від торців модуля, дозволено 477–596);
- стрінг — 11 сусідніх модулів одного схилу одного ліхтаря (без кабелів між ліхтарями);
- залишки одного ліхтаря (схід + захід) — один спільний стрінг 6 + 5 біля того ж торця, якщо набирається 11; що не набирає — місця порожні;
- яким кінцем ліхтаря ставити залишок — вибір за генерацією.
Порівняння: максимум модулів (залишки ліхтарів об'єднано між ліхтарями) і «лише цілі стрінги на схилі».
→ v3/lan13_mount.json"""
import os, sys, json, math, itertools, numpy as np
os.environ['TILT'] = os.environ.get('TILT', '13')
sys.path.insert(0, '/home/claude/work/sun/v3'); import lan22 as L
V = L.V; LM, DM, GAP = L.LM, L.DM, L.GAP; PW = L.PW
F = L.build_dsm('V1'); M = L.MODES['V1']; hw = M['half']; st_, ct = L.st_, L.ct
CL = 0.54                                            # притиск від торця модуля (ZNSHINE: 477–596 мм)
P = []; N = []; MODS = []
for li, Ln in enumerate(F):
    Ly = Ln['y1'] - Ln['y0']; pitch = DM + GAP; n = int((Ly + GAP) // pitch); ys = (Ln['y0'] + Ln['y1']) / 2 - (n * pitch - GAP) / 2
    for side, sg in (('E', 1), ('W', -1)):
        nrm = np.array([sg * st_, 0, ct]); u0 = 0.02
        for i in range(n):
            y0 = ys + i * pitch
            MODS.append(dict(l=li + 1, side=side, i=i, y=round(y0, 3), y1=round(y0 + DM, 3), x=round(Ln['xc'] + sg * (u0 + LM / 2) * ct, 3)))
            N.append(nrm)
            for f_ in (0.2, 0.5, 0.8):
                um = u0 + LM * f_; P.append((Ln['xc'] + sg * um * ct + nrm[0] * 0.30, y0 + DM / 2, Ln['ridge'] - um * st_ + nrm[2] * 0.30))
ST, I = L.run_steps(np.array(P), np.array(N)); E = L.mod_kwh(ST, len(MODS))
for k, m in enumerate(MODS): m['kwh'] = round(float(E[k]), 1); m['irr'] = round(float(I[k]), 1)
idx = lambda l, s: sorted([k for k, m in enumerate(MODS) if m['l'] == l and m['side'] == s], key=lambda k: MODS[k]['i'])
def seng(ids):
    e, e0, emo = L.string_energy(ST, ids); return e, e0, emo
def lantern_plan(l):
    """Найкращий варіант для одного ліхтаря: де залишок (південь / північ) і чи складається спільний стрінг Сх+Зх."""
    Ei, Wi = idx(l, 'E'), idx(l, 'W'); n = len(Ei); m = n // 11; rest = n - m * 11; best = None
    for end in ('S', 'N'):
        if end == 'N': blkE, blkW, rE, rW = Ei[:m * 11], Wi[:m * 11], Ei[m * 11:], Wi[m * 11:]          # залишок біля північного торця
        else: blkE, blkW, rE, rW = Ei[rest:], Wi[rest:], Ei[:rest][::-1], Wi[:rest][::-1]               # залишок біля південного: від блоку назовні
        S = [blkE[s * 11:(s + 1) * 11] for s in range(m)] + [blkW[s * 11:(s + 1) * 11] for s in range(m)]
        cands = [S]
        if 2 * rest >= 11:
            for ne in range(max(0, 11 - rest), min(rest, 11) + 1):
                nw = 11 - ne
                if nw <= rest: cands.append(S + [rE[:ne] + rW[:nw]])
        for SS in cands:
            tot = sum(seng(ids)[0] for ids in SS)
            if best is None or tot > best[0]: best = (tot, end, SS)
    return best
PLAN = []; tot = 0; tot0 = 0; mo = np.zeros(12)
for l in range(1, len(F) + 1):
    t, end, SS = lantern_plan(l)
    for j, ids in enumerate(SS):
        e, e0, emo = seng(ids); tot += e; tot0 += e0; mo += emo
        sides = sorted(set(MODS[k]['side'] for k in ids))
        PLAN.append(dict(id=f'Л{l}-{j + 1}', l=l, side='+'.join(sides), ids=ids, n=len(ids), mwh=round(e / 1000, 3), mism=round((1 - e / e0) * 100, 2),
                         y0=min(MODS[k]['y'] for k in ids), y1=max(MODS[k]['y1'] for k in ids), rest_end=end))
used = sorted(k for s in PLAN for k in s['ids'])
n = len(used)
R = dict(tilt=L.TILT, half=round(hw, 3), width=round(2 * hw, 3), clamp=CL, n=n, st=len(PLAN), kwp=round(n * PW, 2), mwh=round(tot / 1000, 2), mism=round((1 - tot / tot0) * 100, 2),
         y=round(tot / n / PW), mo=[round(x / 1000, 3) for x in mo], places=len(MODS), strings=PLAN, mods=MODS, used=used)
# порівняння: «лише цілі стрінги на схилі» і «максимум» (залишки між ліхтарями)
pure = [];
for l in range(1, len(F) + 1):
    for s in 'EW':
        ii = idx(l, s); m = len(ii) // 11; t1 = sum(seng(ii[k * 11:(k + 1) * 11])[0] for k in range(m)); t2 = sum(seng(ii[len(ii) - (k + 1) * 11:len(ii) - k * 11])[0] for k in range(m))
        pure.append((m * 11, max(t1, t2)))
R['pure'] = dict(n=sum(a for a, b in pure), mwh=round(sum(b for a, b in pure) / 1000, 2))
J13 = json.load(open(V + 'lan22_t13.json'))['modes']['V1']
R['max'] = dict(n=J13['lan']['n'], st=J13['lan']['st'], mwh=J13['lan']['mwh'])
R['roof'] = dict(n=J13['roof']['n'], st=J13['roof']['st'], mwh=J13['roof']['mwh'], base=1092.94)
# рейки: по 2 на схил, довжина = ряд модулів + 0,1 м з кожного боку
runs = {}
for k in used:
    m_ = MODS[k]; key = (m_['l'], m_['side']); a, b = runs.get(key, (1e9, -1e9)); runs[key] = (min(a, m_['y']), max(b, m_['y1']))
R['runs'] = [dict(l=k[0], side=k[1], y0=round(v[0], 2), y1=round(v[1], 2), len=round(v[1] - v[0], 2), n=sum(1 for q in used if (MODS[q]['l'], MODS[q]['side']) == k)) for k, v in sorted(runs.items())]
R['rail_m'] = round(sum(2 * (r['len'] + 0.2) for r in R['runs']), 1)
R['clamps_mid'] = sum(2 * 2 * (r['n'] - 1) for r in R['runs']) // 2        # середній притиск — спільний на 2 модулі: 2 рейки × (n−1)
R['clamps_end'] = sum(2 * 2 for r in R['runs'])                             # кінцеві: 2 рейки × 2 кінці ряду
R['rail_up'] = round((0.02 + CL) * ct, 3); R['rail_lo'] = round((0.02 + LM - CL) * ct, 3); R['edge'] = round((0.02 + LM) * ct, 3)
json.dump(R, open(V + 'lan13_mount.json', 'w'), ensure_ascii=False)
print('places', len(MODS), '→ у стрінгах', n, '=', len(PLAN), 'стрінгів,', R['kwp'], 'кВтп,', R['mwh'], 'МВт·год,', R['y'], 'кВт·год/кВтп, mism', R['mism'], '%')
print('pure', R['pure'], 'max', R['max'], 'roof', R['roof'])
for s in PLAN: print(s['id'], s['side'], s['n'], s['mwh'], s['mism'], round(s['y0'], 1), round(s['y1'], 1), s['rest_end'])
print('runs', R['runs']); print('rail m', R['rail_m'], 'mid clamps', R['clamps_mid'], 'end clamps', R['clamps_end'], 'rails at', R['rail_up'], R['rail_lo'], 'edge', R['edge'])
