# -*- coding: utf-8 -*-
"""Електрика складу і АБК (етап 1), 04.11.2026 — доповнення до ep_opt / final.
Склад: 3 щити PV 7/1 на північній стіні складу (ЩС-С1…С3, 5 / 6 / 5 стрінгів по 11), лінії Al до ШВ К-3 / К-1 за новими місцями
контейнерів (по 2 на ТП-5913, паралельно цеху): спуск по стіні складу → траншея через проїзд уздовж південного торця ТП-5913 →
підйом на кут цеху → лоток по східному фасаду над ТП-5913 (разом із лініями фасадів) → ШВ. Траса умовна (траншея чи повітряний перехід — уточнити).
АБК: стрінги і лотки — abk/abk_dbn.json (Deye SUN-100K-G03, 11 стрінгів по 12); AC — СІП-4 4×70 за варіантами 1 і 3.
→ wh_abk.json і ../../obj/src/elecwadata.js (const ELECWA)."""
import json, math, os
H = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(H, 'final.json'))) if os.path.exists(os.path.join(H, 'final.json')) else None
s = open(os.path.join(H, '../../obj/src/elec04data.js'), encoding='utf-8').read(); E4 = json.loads(s[s.find('{'):s.rfind('}') + 1])
IMP, ISC, VOP = 17.51, 18.51, 430.0
RHO = {'Al': 0.0316, 'Cu': 0.0196}
PRICE = {120: 2.04, 185: 3.12, 240: 4.07}; K_IMP = 1.2; LUG = {120: 1.54, 185: 2.04, 240: 2.54}
TARIFF, DISC, YEARS = 0.13, 0.10, 25; PVF = (1 - (1 + DISC) ** -YEARS) / DISC
TAU = 551.0 * 0.95                                   # год, τ ep_opt для складу (0,95 × дах)
SH = E4['shv']; XF = 96.64 + 0.3; HF = 5.0; YT = -2.0  # лоток фасаду (X, висота), траншея на 1,5 м південніше ТП-5913
# 05.11: лоток по східному фасаду — на 5,0 м (над дахом прибудови ТП-5913 4,5 м і нижче наявних ярусів кабелів 5,6 і 6,1 м); ШВ — на стіні цеху навпроти торців К-3 / К-1
def plen(P): return sum(math.dist(P[i], P[i + 1]) for i in range(len(P) - 1))
def route(b):
    X, Y, K = b['X'], b['Y'], b['K']; sx, sy = SH[K]
    return [(X, Y, 1.2), (X, Y, 0.0), (X, YT, 0.0), (XF, YT, 0.0), (XF, -0.5, 0.0), (XF, -0.5, HF), (XF, sy - 0.7, HF), (XF, sy - 0.7, 2.0), (sx + 0.05, sy - 0.45, 1.6)]
def best(L, ns):
    out = []
    for S in (120, 185, 240):
        I = ns * IMP; pk = I * I * 2 * RHO['Al'] * L / S / 1000; du = pk * 1000 / I / VOP * 100
        if ns * ISC * 1.25 > {120: 250, 185: 320, 240: 380}[S]: continue
        cab = 2 * L * PRICE[S] * K_IMP + 4 * LUG[S]; npv = pk * TAU * TARIFF * PVF
        out.append(dict(S=S, pk=pk, du=du, e=pk * TAU, cab=cab, npv=npv, tot=cab + npv))
    return min(out, key=lambda o: o['tot'])
D0 = json.load(open(os.path.join(H, 'data.json')))
OLD = {b['n']: b['L'] - (12.0 if b['K'] == 'K-2' else 0) for b in D0['ep']['boxes'] if b['zone'] == 'склад'}   # довжини до старих місць контейнерів (ep_opt)
WH = []
for b in E4['boxes']:
    if b['z'] != 'wh': continue
    P = route(b); Lr = plen(P); L = Lr * 1.05 + 4.0; r = best(L, b['ns'])
    trench = math.dist(P[1], P[2]) + math.dist(P[2], P[3]) + math.dist(P[3], P[4])
    WH.append(dict(id=b['id'], K=b['K'], ns=b['ns'], kwp=b['kwp'], X=b['X'], Y=b['Y'], pts=[list(map(lambda v: round(v, 3), p)) for p in P], Lr=round(Lr, 1), L=round(L, 1),
                   L_old=round(OLD.get(b['id'], b['L']), 1), trench=round(trench, 1), **{k: round(v, 3) if isinstance(v, float) else v for k, v in r.items()}))
# ---------- АБК
A = json.load(open(os.path.join(H, '../../abk/abk_dbn.json'), encoding='utf-8')); AD = json.load(open(os.path.join(H, '../../abk/abk_deye.json'), encoding='utf-8'))['dbn']
s = open(os.path.join(H, '../../abk/dbn/abk_data.js'), encoding='utf-8').read(); ABD = json.loads(s[s.find('{'):s.rfind('}') + 1]); AC = ABD['mount']['ac']
inv = A['inv']; I_ac = inv['iac']; R70 = 0.443; X70 = 0.08                     # Ом/км, СІП-4 4×70 (Al): R при 20 °C ≈ 0,443, X ≈ 0,08
def du_ac(L, I=I_ac, cos=1.0): return math.sqrt(3) * I * L / 1000 * (R70 * cos + X70 * math.sin(math.acos(cos))) / 400 * 100
def p_ac(L, I=I_ac): return 3 * I * I * R70 * L / 1000 / 1000
L1 = AC['len'] + AC['span_len'] * 0  # довжина СІП до ТП-5913 за моделлю АБК (з підвісом)
V3P = [[108.35, 45.1, 4.5], [106.3, 53.4, 3.4]]
def v3len():
    a, b = [108.35, 45.1, 4.5], [106.3, 53.4, 3.4]; sp = []
    for i in range(11):
        t = i / 10; sp.append([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - 0.35 * 4 * t * (1 - t)])
    P = [[108.24, 20, 10.3], [108.35, 20.3, 10.2], [108.35, 44.8, 10.2]] + sp + [[106.3, 53.4, 0.4], [106.3, 62.8, 0.4]]
    return plen(P)
L3 = v3len() + 8.0                                   # + від інвертора до західного парапету (як у варіанті 1, ≈8 м по даху)
TAU_A = 551.0 * (A['kwp'] / inv['pac']) ** 2        # год: τ ep_opt (Σ(G/1000)²Δt) з поправкою кВтп / Pac
DCL = A['dc']['plus'] + A['dc']['minus'] + A['dc']['jump']; RL = RHO['Cu'] / 6.0          # 1×6 мм² Cu, Ом/м
DCP = len(A['strings']) * (IMP ** 2) * RL * DCL / len(A['strings']) / 1000            # кВт при STC (Imp на всіх стрінгах)
DCU = DCP * 1000 / (len(A['strings']) * IMP * 41.69 * A['L'] * 0.9) * 100              # % від потужності при STC (Vmp × 0,9 — нагрів)
TAU_AC = 1000.0                                      # год еквівалентної повної потужності (Deye 100 кВт, 87 МВт·год)
ab = dict(inv=inv['model'], pac=inv['pac'], iac=I_ac, nmppt=inv['nmppt'], n=A['n'], kwp=A['kwp'], mwh=A['mwh'], strings=len(A['strings']), L=A['L'], mppt=A['mppt'],
          voc30=AD['voc30'], vmp70=AD['vmp70'], tray=A['tray_len'], tray_stats=A['tray_stats'], pos=inv['pos'],
          var1=dict(L=round(L1, 1), du=round(du_ac(L1), 2), pk=round(p_ac(L1), 2), e=round(p_ac(L1) * TAU_A, 0), to='щит СЕС у ТП-5913, шини 0,4 кВ'),
          var3=dict(L=round(L3, 1), du=round(du_ac(L3), 2), pk=round(p_ac(L3), 2), e=round(p_ac(L3) * TAU_A, 0), to='К-3 / К-1 (точка підключення — уточнити в Golen)'),
          dc=dict(A['dc'], loop=round(DCL / len(A['strings']), 1), pk=round(DCP, 3), du=round(DCU, 2), e=round(DCP * 551.0, 0)))
# спільна траншея: відгалуження від кожного щита на північ до Y −2,0 + магістраль уздовж Y −2,0 до кута цеху + до кута
xs = [w['X'] for w in WH]; trench_total = sum(abs(w['Y'] - YT) for w in WH) + (max(xs) - XF) + abs(-0.5 - YT)
# оновити щити складу в даних двійника (довжина, переріз, ΔU — під нові місця контейнерів)
p4 = os.path.join(H, '../../obj/src/elec04data.js'); t = open(p4, encoding='utf-8').read(); D4 = json.loads(t[t.find('{'):t.rfind('}') + 1])
for bx in D4['boxes']:
    for w in WH:
        if bx['id'] == w['id']: bx.update(L=w['L'], S=w['S'], du=round(w['du'], 2))
open(p4, 'w', encoding='utf-8').write(t[:t.find('{')] + json.dumps(D4, ensure_ascii=False, separators=(',', ':')) + t[t.rfind('}') + 1:])
OUT = dict(wh=WH, abk=ab, trench=round(trench_total, 1), note='траса складу умовна: траншея через проїзд чи повітряний перехід — уточнити; АБК варіант 2 (власний накопичувач) — без AC до ТП')
json.dump(OUT, open(os.path.join(H, 'wh_abk.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(H, '../../obj/src/elecwadata.js'), 'w', encoding='utf-8').write('const ELECWA=' + json.dumps(OUT, ensure_ascii=False, separators=(',', ':')) + ';')
for w in WH: print(w['id'], w['K'], 'L', w['L'], '(було', w['L_old'], ')', 'S', w['S'], 'du', w['du'], 'pk', w['pk'], 'траншея', w['trench'])
print('АБК', {k: v for k, v in ab.items() if k not in ('mppt', 'tray_stats', 'pos')})
