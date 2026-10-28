# -*- coding: utf-8 -*-
"""АБК: стрінги під інвертор Deye SUN-100K-G03 (1000 В, 6 MPPT, MPPT 200–850 В, ≤40 А на MPPT) — запит 28.10, 16:12.
Модуль ZNSHINE ZXN8-BD132-730 (паспорт): Voc 49,5 В, Isc 18,51 А, Vmp 41,7 В, Imp 17,51 А, Voc −0,25 %/K.
Довжина стрінга L однакова для всіх: Voc(−30 °C) = L × 56,3 В ≤ 1000 В → L ≤ 17; Vmp(70 °C) ≈ 37,0 В × L ≥ 250 В (старт) → L ≥ 7.
На MPPT — 1 або 2 стрінги (2 × 17,51 = 35,0 А ≤ 40 А). Модель генерації — як у abk_var.py (повна модель K1).
→ antares/abk/abk_deye.json"""
import os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'abk_var.py'), encoding='utf-8').read()
exec(src.split("NADJ = J['nad']; OUT = {}")[0])              # модель, модулі, стіни, strings(), dsm_nad()
VOC30, VMP70, VMPm10, IMP, ISC = 49.5 * (1 + 0.0025 * 55), 37.0, 41.7 * (1 + 0.0029 * 35), 17.51, 18.51
INV = (119.0, 17.55, 10.6)                                   # Deye на північній стіні надбудови, у проході до основного блоку (тінь, захист)
def strings_L(M, E, ST, Lm):
    grp = collections.defaultdict(list)
    for i, m in enumerate(M):
        key = m['face'] + ('<5' if m['tilt'] < 5 else '5-10' if m['tilt'] < 10 else '>10') if m['how'] == 'flush' else m['face']
        grp[key].append(i)
    S_ = []; left = collections.defaultdict(list)
    for key, ii in grp.items():
        ii = sorted(ii, key=lambda i: (M[i].get('col', 0), M[i]['x0'], M[i]['y0'])); k = len(ii) // Lm; S_ += [ii[s * Lm:(s + 1) * Lm] for s in range(k)]; left[key[0]] += ii[k * Lm:]
    drop = []
    for f, ii in left.items():
        ii = sorted(ii, key=lambda i: -E[i]); k = len(ii) // Lm; S_ += [ii[s * Lm:(s + 1) * Lm] for s in range(k)]; drop += ii[k * Lm:]
    while len(drop) >= Lm:
        dd = sorted(drop, key=lambda i: -E[i]); best = None
        for f in ('W', 'E', 'S', None):
            pool = [i for i in dd if M[i]['face'] == f] if f else []
            ex = (pool + [i for i in dd if i not in pool])[:Lm]; e, e0, _ = L.string_energy(ST, ex)
            if e / e0 > 0.88 and (best is None or e > best[1]): best = (ex, e)
        if not best: break
        S_.append(best[0]); drop = [i for i in dd if i not in best[0]]
    return S_, drop
def pos(m):
    p = np.mean(np.array(m['pts']), axis=0); return p
def run(name, A, LW, NADL):
    M = A + LW + WALLS + M_dom(NADL, 'nad', 'N')
    H[:] = H_BASE; dsm_nad(NADL)
    P = np.array([p for m in M for p in m['pts']]); N = np.array([m['n'] for m in M]); ST, Ir = L.run_steps(P, N); E = L.mod_kwh(ST, len(M)); H[:] = H_BASE
    best = None
    for Lm in range(10, 18):
        S_, drop = strings_L(M, E, ST, Lm)
        if len(S_) > 12: continue
        tot = sum(L.string_energy(ST, s)[0] for s in S_)
        if best is None or tot > best['tot'] + 1e-6: best = dict(L=Lm, S=S_, drop=drop, tot=tot)
    S_, Lm = best['S'], best['L']
    SR = []
    for k, ids in enumerate(S_):
        e, e0, _ = L.string_energy(ST, ids); ps = np.array([pos(M[i]) for i in ids]); c = ps.mean(axis=0)
        ext = float(np.max(np.ptp(ps[:, :2], axis=0)))
        run1 = abs(c[0] - INV[0]) + abs(c[1] - INV[1]) + abs(c[2] - INV[2]) + ext / 2           # до інвертора однією полярністю, м
        SR.append(dict(k=k, n=len(ids), parts=''.join(sorted(set(M[i]['part'] for i in ids))), faces=''.join(sorted(set(M[i]['face'] for i in ids))),
                       tilt=round(float(np.mean([M[i]['tilt'] for i in ids])), 1), mwh=round(e / 1000, 3), mism=round((1 - e / e0) * 100, 1), dc_m=round(2 * run1 * 1.1 + 4, 1), ids=ids))
    # MPPT: пари стрінгів однієї грані (схожий нахил), змішаний стрінг (стіни) — окремо; MPPT не більше 6
    need = max(0, len(SR) - 6); pairs = []; left = []
    for f in ('E', 'W'):
        g = sorted([x for x in SR if x['faces'] == f], key=lambda x: (x['parts'], x['tilt']))
        while len(g) >= 2 and len(pairs) < need: pairs.append([g.pop(0)['k'], g.pop(0)['k']])
        left += g
    left += [x for x in SR if x['faces'] not in ('E', 'W')]
    left = sorted(left, key=lambda x: (len(x['faces']) > 1, x['mism']))
    while len(pairs) < need and len(left) >= 2: pairs.append([left.pop(0)['k'], left.pop(0)['k']])
    mppt = pairs + [[x['k']] for x in left]
    n = sum(s['n'] for s in SR); cnt = collections.Counter(m['part'] for m in M)
    r = dict(name=name, places=len(M), arch=cnt['A'], low=cnt['L'], nad=cnt['N'], wall=cnt['W'], L=Lm, st=len(SR), n=n, drop=len(best['drop']), kwp=round(n * PW, 2),
             mwh=round(best['tot'] / 1000, 1), y=round(best['tot'] / n / PW), mppt=mppt, nmppt=len(mppt),
             voc30=round(Lm * VOC30, 1), vmp70=round(Lm * VMP70, 1), vmpm10=round(Lm * VMPm10, 1), imp_mppt=round(max(len(g) for g in mppt) * IMP, 1), isc_mppt=round(max(len(g) for g in mppt) * ISC, 1),
             dc_m=round(sum(s['dc_m'] for s in SR)), st_cnt=dict(collections.Counter(M[i]['part'] for s in SR for i in s['ids'])), drop_by=dict(collections.Counter(M[i]['part'] for i in best['drop'])), strings=[{k: v for k, v in s.items() if k != 'ids'} for s in SR])
    print(f"{name}: L={Lm}, {r['st']} стрінгів, {r['nmppt']} MPPT {mppt}, у стрінгах {n} з {len(M)}, {r['kwp']} кВтп, {r['mwh']} МВт·год, {r['y']} кВт·год/кВтп; "
          f"Voc(−30) {r['voc30']} В, Vmp 70 °C {r['vmp70']} В, Vmp −10 °C {r['vmpm10']} В, I MPPT {r['imp_mppt']} А; DC 1×6 ≈{r['dc_m']} м")
    for s in SR: print('   ', s['k'], s['n'], s['parts'], s['faces'], s['tilt'], s['mwh'], s['mism'], s['dc_m'])
    return r
NADJ = J['nad']; OUT = {}
OUT['as'] = run('Як є', M_arch(J['arch'], 'arch'), M_dom(LOWU, 'low', 'L'), NADJ['d6'])
OUT['dbn'] = run('ДБН', M_arch(J['archD'], 'archD'), M_dom(LOWU, 'low', 'L'), NADJ['d6'])
OUT['inv'] = dict(model='Deye SUN-100K-G03', vmax=1000, start=250, mppt_v=[200, 850], nmppt=6, imax_mppt=40, isc_mppt=60, pac=100, place=INV)
json.dump(OUT, open('/home/claude/galkat-20/antares/abk/abk_deye.json', 'w'), ensure_ascii=False, indent=1)
