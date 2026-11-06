# -*- coding: utf-8 -*-
"""Навантаження від СЕС на кожен дах (06.11.2026, власник: «потрібно додати загальне навантаження на кожен дах»).

Кількості — з кошторису (bom.json етапи 1–2; кошторис АБК 28.10 — abk/abk_mount.json, abk_bom.json; лотки — final.json, wh_abk.json),
маса одиниці — з «Елементів SES» і моделі кріплення двійника (roofnode.js), решта — каталожні значення з позначкою «оцінка».
Постійне навантаження (власна вага), без снігу і вітру; кг/м² — на площу під модулями (n × 2,404 × 1,323 м).
→ loads.json і ../../obj/src/loads.js (const LOADS)"""
import json, math, os, collections
H = os.path.dirname(os.path.abspath(__file__)); os.chdir(H)
B = json.load(open('bom.json', encoding='utf-8')); F = json.load(open('final.json', encoding='utf-8')); W = json.load(open('wh_abk.json', encoding='utf-8'))
F0 = json.load(open('final_whn0.json', encoding='utf-8'))
AM = json.load(open('../../abk/abk_mount.json', encoding='utf-8'))['q']; AB = json.load(open('../../abk/abk_bom.json', encoding='utf-8'))
AD = json.load(open('../../abk/abk_dbn.json', encoding='utf-8'))
IT = {st: B['items'][st] for st in ('1', '2')}
def q(st, grp, key):                       # кількість позиції кошторису за початком назви
    L = [x for x in IT[st] if x['grp'] == grp and x['name'].startswith(key)]
    assert len(L) == 1, (st, grp, key, len(L)); return L[0]['q']
# ---------- маса одиниці, кг
MOD = 36.5                                 # ZNSHINE ZXN8-BD132-730, 2 384 × 1 303 × 33
KG = dict(lag=1.743, rail25=2.767, sleeve=0.44, b10=0.07, rod=0.48, nut=0.011, ang=1.36, cl=0.07, b8=0.02, blk=12.98, mat=0.338,
          fbrk=0.35, fcl=0.08, rope=0.10, lbrk=0.35, whm=1.4, box=35.0, al120=0.45, al185=0.68, c6=0.075, rs=0.06, cu16=0.17, cu6=0.06)
TRAY = {'100×50': 2.2, '200×50': 3.3, '300×100': 5.6, '400×100': 7.0, '600×100': 9.8}; FIT = 1.3   # лоток з кришкою, кг/м; фасонні, траверси, з'єднувачі +30 %
EST = {'box', 'al120', 'al185', 'c6', 'rs', 'fbrk', 'lbrk', 'b10', 'tray'}   # каталожні значення — оцінка
PU, PV = 2.404, 1.323; AMOD = PU * PV
def L(name, n, unit, k, kg=None, note=''):
    m = (kg if kg is not None else KG[k]); return dict(n=name, q=round(n, 1), u=unit, kg1=m, kg=round(n * m, 1), est=(k in EST), note=note)
def row(key, name, st, nmods, parts, plan=None, note=''):
    P = collections.OrderedDict((c, []) for c in ('mod', 'mnt', 'bal', 'el'))
    for c, x in parts: P[c].append(x)
    s = {c: round(sum(x['kg'] for x in v), 1) for c, v in P.items()}; tot = sum(s.values()); A = nmods * AMOD
    return dict(k=key, n=name, st=st, mods=nmods, A=round(A, 1), plan=plan, s=s, tot=round(tot, 1), kgm2=round(tot / A, 1) if A else None,
                kgm2_plan=round(tot / plan, 1) if plan else None, det={c: v for c, v in P.items()}, note=note)
ROWS = []
# ---------- лотки і лінії на даху цеху (final.json segs: лоток на блоках / на парапеті; лінії по 2 жили Al)
seg = collections.Counter(); al = {1: 0.0, 2: 0.0}
for s_ in F['segs']:
    l = abs(s_['a'][0] - s_['b'][0]) + abs(s_['a'][1] - s_['b'][1]); seg[(s_['st'], s_['w'])] += l
    al[1] += l * s_['n1'] * 2; al[2] += l * s_['n2'] * 2
kAl = {st: (q(st, 'Лінії DC щит → ШВ', 'Кабель Al 1×120') * KG['al120'] + q(st, 'Лінії DC щит → ШВ', 'Кабель Al 1×185') * KG['al185'])
       / (q(st, 'Лінії DC щит → ШВ', 'Кабель Al 1×120') + q(st, 'Лінії DC щит → ШВ', 'Кабель Al 1×185')) for st in ('1', '2')}
n_roof = sum(1 for r in F['rows'] if r['z'] == 'roof'); n_lan = sum(1 for r in F['rows'] if r['z'] == 'lan')
ns_lan = sum(r['ns'] for r in F['rows'] if r['z'] == 'lan')
def trays(st, extra_m=0.0):
    out = [L(f'Лоток {w} з кришкою і фасонними (+30 %)', m + (extra_m if w == '100×50' else 0), 'м', 'tray', TRAY[w] * FIT) for w, m in sorted(seg.items()) if False]
    for (s2, w), m in sorted(seg.items()):
        if s2 == st: out.append(L(f'Лоток {w} з кришкою, фасонні, траверси (+30 %)', m + (extra_m if w == '100×50' else 0), 'м', 'tray', TRAY[w] * FIT))
    return out
# ---------- 1. Дах цеху — поле В1 (етап 2)
G2, GB = 'Кріплення · дах В1', 'Баласт · дах В1'
n2 = 1831; rb2 = [x for x in IT['2'] if x['grp'] == 'Баласт · лотки і щити'][0]['q']
W2 = json.load(open('wind2.json', encoding='utf-8')); X2 = W2['res']['з бортиками по краю поля']['tot']
p = [('mod', L('Модуль ZNSHINE 730 Вт', n2, 'шт', 'mod', MOD)),
     ('mnt', L('Лага 41×41×1,5', q('2', G2, 'Лага'), 'м', 'lag')), ('mnt', L('Профіль 41×41×1,5 крайній і через прохід', q('2', G2, 'Профіль'), 'м', 'lag')),
     ('mnt', L('Гільза 200 з муфтою M10×50', q('2', G2, 'Гільза'), 'шт', 'sleeve')), ('mnt', L('Шпилька M10', q('2', G2, 'Шпилька'), 'м', 'rod')),
     ('mnt', L('Гайки M10', q('2', G2, 'Гайки'), 'шт', 'nut')), ('mnt', L('Кутник 160/150', q('2', G2, 'Кутник'), 'шт', 'ang')),
     ('mnt', L('Болти M10 з шайбами і гайками (гільзи, кутники)', q('2', G2, 'Болт M10×60') + q('2', G2, 'Болт M10×70'), 'компл', 'b10')),
     ('mnt', L('Притиски середні і Z33 з болтом', q('2', G2, 'Притиск'), 'шт', 'cl')), ('mnt', L('Болт M8×20 + шайба DIN 9021', q('2', G2, 'Болт M8×20'), 'компл', 'b8')),
     ('bal', L('Блок 300×300×60 з муфтою — під лаги і кінці лаг', q('2', GB, 'Блок 300×300×60'), 'шт', 'blk')),
     ('bal', L('Мат 320×320×3 під блок', q('2', GB, 'Блок 300×300×60'), 'шт', 'mat')),
     ('bal', L('Блок з муфтою без мата — під крайні профілі', q('2', GB, 'Блок з муфтою без мата'), 'шт', 'blk')),
     ('bal', L('Додатковий блок з матом — кути і край поля (зони F, G)', X2, 'шт', 'blk', KG['blk'] + KG['mat'])),
     ('bal', L('Блок з муфтою і матом — опори лотків і рами щитів', rb2, 'шт', 'blk', KG['blk'] + KG['mat'])),
     ('el', L('Щит PV 7/1 на рамі 41×41 з козирком', n_roof, 'шт', 'box')),
     ('el', L('Кабель Al у лотках даху (2 жили на лінію)', al[2], 'м', 'al120', kAl['2'])),
     ('el', L('Кабель H1Z2Z2-K 1×6', q('2', 'Кабелі DC 1×6', 'Кабель H1Z2Z2-K'), 'м', 'c6')),
     ('el', L('Кабель RS485 і PE Cu 1×16 щитів', q('2', 'Щити PV', 'Кабель RS485'), 'м', 'rs')),
     ('el', L('Провід Cu 1×6 вирівнювання', q('2', 'Блискавкозахист', 'Провід Cu 1×6'), 'м', 'cu6'))] + [('el', x) for x in trays(2, 6 * n_roof)]
ROWS.append(row('roof', 'Дах цеху — поле В1', '2', n2, p, note='Після нової мембрани. Блоки — 2 на панель на кожній лазі, під кінцями лаг і по 2 без мата під крайніми профілями; по краю поля (зони F, G) — додаткові.'))
# ---------- 2. Дах цеху — лотки, лінії і щити етапу 1 (лінії ліхтарів і фасадів з даху; до нової мембрани — знімаються і ставляться назад)
rb1 = [x for x in IT['1'] if x['grp'] == 'Баласт · лотки і щити' and x['name'].startswith('Блок з муфтою і матом — опори лотків на блоках')][0]['q']
p = [('bal', L('Блок з муфтою і матом — опори лотків, рами щитів ліхтарів і ЩФ-5', rb1, 'шт', 'blk', KG['blk'] + KG['mat'])),
     ('el', L('Щит PV 7/1 на рамі (4 ліхтарів + ЩФ-5)', n_lan + 1, 'шт', 'box')),
     ('el', L('Кабель Al у лотках даху (2 жили на лінію)', al[1], 'м', 'al120', kAl['1'])),
     ('el', L('Провід Cu 1×6 вирівнювання', 568, 'м', 'cu6'))] + [('el', x) for x in trays(1, 6 * n_lan)]
ROWS.append(row('roof1', 'Дах цеху — лотки, лінії і щити етапу 1', '1', 0, p, note='Лінії ліхтарів і фасадів по парапету і на блоках до спусків К-3/К-1 і К-4/К-5.'))
# ---------- 3. Ліхтарі Л1–Л4 (етап 1) — на каркас ліхтарів
GL = 'Кріплення · ліхтарі'; nl = 316
p = [('mod', L('Модуль ZNSHINE 730 Вт', nl, 'шт', 'mod', MOD)),
     ('mnt', L('Рейка 41×41 на каркасі ліхтаря', q('1', GL, 'Рейка 41×41'), 'м', 'lag')),
     ('mnt', L('Кронштейн рейки до каркаса з болтами', q('1', GL, 'Кронштейн'), 'шт', 'lbrk')), ('mnt', L('Притиски Al', q('1', GL, 'Притиск'), 'шт', 'cl')),
     ('el', L('Кабель H1Z2Z2-K 1×6 стрінгів ліхтарів', ns_lan * 46.6 * 1.1, 'м', 'c6'))]
ROWS.append(row('lan', 'Ліхтарі Л1–Л4 — на склінні', '1', nl, p, note='Навантаження на каркас ліхтарів; на що спирати рейки — не вирішено.'))
# ---------- 4–5. Склад: південні скати (етап 1) і північні скати (опція етапу 1)
WN = W['whn']; QW = W['q']; nws = 176
dtray = F['T']['1'].get('100×50', 0) - F0['T']['1'].get('100×50', 0) - (WN['q']['tray'] if WN else 0)   # лоток на даху від опції (гребінь, скат)
tr_s = QW['tray_prof'] - max(0.0, dtray)
p = [('mod', L('Модуль ZNSHINE 730 Вт', nws, 'шт', 'mod', MOD)), ('mnt', L('Міні-рейки 380, притиски, саморізи (модель кріплення)', nws, 'модуль', 'whm')),
     ('el', L('Лоток 100×50 на профнастилі (край, гребінь, скат)', tr_s, 'м', 'tray', TRAY['100×50'] * FIT)),
     ('el', L('Кабель H1Z2Z2-K 1×6 стрінгів складу', QW['str_wh'], 'м', 'c6'))]
ROWS.append(row('wh', 'Склад — південні скати A, B, C1', '1', nws, p, note='Профнастил; щити ЩС-С1…С3 — на стінах.'))
if WN:
    p = [('mod', L('Модуль ZNSHINE 730 Вт', WN['n'], 'шт', 'mod', MOD)), ('mnt', L('Міні-рейки 380, притиски, саморізи (модель кріплення)', WN['n'], 'модуль', 'whm')),
         ('el', L('Лоток 100×50 на профнастилі (гребінь, скат)', max(0.0, dtray), 'м', 'tray', TRAY['100×50'] * FIT)),
         ('el', L('Кабель H1Z2Z2-K 1×6 стрінгів', WN['q']['str_m'], 'м', 'c6'))]
    ROWS.append(row('whn', 'Склад — північні скати C1, C2 (опція)', '1', WN['n'], p, note='Опція етапу 1; щити ЩС-Пн1 / Пн2 — на стіні.'))
# ---------- 6–7. АБК: арка (верхній дах) і нижній дах з надбудовою сходів
NA, NL, NN, NW = (AB['n'][k] for k in ('NA', 'NL', 'NN', 'NW'))
tr = collections.Counter()
for k, v in AD['trays'].items(): tr[v['area']] += sum(math.dist(a, b) for a, b in zip(v['pts'], v['pts'][1:]))
c6abk = QW['str_abk']; sh = lambda n: c6abk * n / (NA + NL + NN + NW)
p = [('mod', L('Модуль ZNSHINE 730 Вт', NA, 'шт', 'mod', MOD)),
     ('mnt', L('Лага 41×41×1,5', AM['arch_lag_m'], 'м', 'lag')), ('mnt', L('Профіль 41×41×1,5 крайній', AM['arch_prof_m'], 'м', 'lag')),
     ('mnt', L('Шпилька M10 1 299', AM['arch_rod'] + AM['arch_rod_pass'], 'шт', 'rod', KG['rod'] * 1.299)), ('mnt', L('Гільза 200 з муфтою', AM['arch_slv'], 'шт', 'sleeve')),
     ('mnt', L('Кутник 160/150', AM['arch_ang'], 'шт', 'ang')), ('mnt', L('Болти M10 з гайками', AM['arch_m10x60a'] + AM['arch_m10x60s'] + AM['arch_m10x70'], 'компл', 'b10')),
     ('mnt', L('Притиски середні і Z33', AM['arch_cm'] + AM['arch_cz'] + AM['arch_czp'], 'шт', 'cl')), ('mnt', L('Болт M8×20 + шайба', AM['arch_m8'], 'компл', 'b8')),
     ('bal', L('Блок з муфтою і матом — під лаги', AM['arch_blk'], 'шт', 'blk', KG['blk'] + KG['mat'])), ('bal', L('Блок без мата — під крайні профілі', AM['arch_blkn'], 'шт', 'blk')),
     ('el', L('Лоток на арці', tr['arch'], 'м', 'tray', TRAY['100×50'] * FIT)), ('el', L('Кабель H1Z2Z2-K 1×6 (за часткою модулів)', sh(NA), 'м', 'c6'))]
ROWS.append(row('abA', 'АБК — арка (верхній дах)', '1', NA, p, plan=round(19.5 * 24.9, 1), note='«Лага 0°», як на даху цеху.'))
dom_m = (2.75 + 1.45 + 0.365) * AM['dom_tri'] + 1.1 * AM['dom_diag']; one_m = (1.55 + 1.419 + 0.448) * AM['one_tri'] + 1.1 * AM['one_diag']
blk_tr = AB['blk']['tray']
p = [('mod', L('Модуль ZNSHINE 730 Вт', NL + NN, 'шт', 'mod', MOD)),
     ('mnt', L('«Домік» 15°: лаги, балки, стійки, діагоналі 41×41×1,5', dom_m, 'м', 'lag')), ('mnt', L('Трикутники 15°: лаги, балки, стійки, діагоналі 41×41×1,5', one_m, 'м', 'lag')),
     ('mnt', L('П-кронштейни, болти, притиски', AM['dom_tri'] + AM['one_tri'], 'опора', 'b10', 0.6)),
     ('mnt', L('Притиски крайні', AM['dom_ce'] + AM['one_ce'], 'шт', 'cl')),
     ('bal', L('Блок з муфтою і матом — «домік» і трикутники', AM['dom_blk'] + AM['one_blk'], 'шт', 'blk', KG['blk'] + KG['mat'])),
     ('bal', L('Блок з муфтою і матом — опори лотків (кошторис АБК + лоток ліній до троса)', blk_tr + QW['blk_abk'], 'шт', 'blk', KG['blk'] + KG['mat'])),
     ('el', L('Щити ЩА-1, ЩА-2', 2, 'шт', 'box')),
     ('el', L('Лоток на нижньому даху і надбудові', tr['low'] + tr['lowW'] + tr['lowE'] + tr['stE'] + tr['nad'] + QW['tray_roofA'], 'м', 'tray', TRAY['100×50'] * FIT)),
     ('el', L('Кабель Al ліній ЩА → трос (2 лінії × 2 жили)', QW['tray_roofA'] * 4, 'м', 'al120')),
     ('el', L('Кабель H1Z2Z2-K 1×6 (за часткою модулів)', sh(NL + NN), 'м', 'c6'))]
ROWS.append(row('abL', 'АБК — нижній дах і надбудова сходів', '1', NL + NN, p, plan=round(19.2 * 13.7, 1), note='15°: «домік» і трикутники на блоках.'))
# ---------- 8. Фасади (на стіни — довідково)
GF = 'Кріплення · фасади'; nf_ = 429
p = [('mod', L('Модуль ZNSHINE 730 Вт (цех)', nf_, 'шт', 'mod', MOD)), ('mod', L('Модуль ZNSHINE 730 Вт (стіни АБК)', NW, 'шт', 'mod', MOD)),
     ('mnt', L('Рейка 41×41×2,5', q('1', GF, 'Рейка') + AM['wall_rail_m'], 'м', 'rail25')),
     ('mnt', L('Кронштейн L60×60×5 з анкером M10', q('1', GF, 'Кронштейн') + AM['wall_brk'], 'компл', 'fbrk')),
     ('mnt', L('Притиск крайній Al 80 мм', q('1', GF, 'Притиск') + AM['wall_ce'] + AM['wall_cm'], 'шт', 'fcl')), ('mnt', L('Трос безпеки модуля', q('1', GF, 'Трос') + AM['wall_rope'], 'шт', 'rope')),
     ('mnt', L('Козирок 25°: консолі, підкоси, пластини, анкери', 1, 'компл', 'fbrk', 550.0)),
     ('el', L('Лоток по фасаду (лінії складу і АБК, спуски)', QW['L_fac2'] * 1.05 + F['mnt']['1'].get('fac', 0), 'м', 'tray', TRAY['200×50'] * FIT))]
ROWS.append(row('fac', 'Фасади цеху і стіни АБК — на стіни', '1', nf_ + NW, p, note='Не дах: навантаження на стіни через кронштейни; довідково.'))
# ---------- підсумки по будівлях
PLAN_SHOP = round((96.64 + 0.15) * (96.59 + 0.5), 1)
def grp(name, keys, plan=None):
    R = [r for r in ROWS if r['k'] in keys]; tot = sum(r['tot'] for r in R); A = sum(r['A'] for r in R); s = {c: round(sum(r['s'][c] for r in R), 1) for c in ('mod', 'mnt', 'bal', 'el')}
    return dict(n=name, keys=keys, mods=sum(r['mods'] for r in R), A=round(A, 1), s=s, tot=round(tot, 1), kgm2=round(tot / A, 1) if A else None, plan=plan, kgm2_plan=round(tot / plan, 1) if plan else None)
GROUPS = [grp('Дах цеху разом (поле, ліхтарі, лотки етапу 1)', ['roof', 'roof1', 'lan'], PLAN_SHOP), grp('Склад разом', ['wh', 'whn']), grp('АБК разом (дахи)', ['abA', 'abL'])]
# модель двійника проти кошторису (блоки під лаги і крайні профілі даху цеху) — для перевірки рецепта roofnode.js
OUT = dict(date='06.11.2026', rows=ROWS, groups=GROUPS, plan_shop=PLAN_SHOP, amod=round(AMOD, 3), kg=KG, tray=TRAY,
           blocks_roof=dict(lag=q('2', GB, 'Блок 300×300×60'), edge=q('2', GB, 'Блок з муфтою без мата'), extra=X2, tray=rb2),
           src='Кількості — кошторис 06.11 (bom.json), кошторис АБК 28.10, лотки final.json / wh_abk.json; маса одиниці — «Елементи SES» і модель кріплення двійника; «оцінка» — каталожні значення.')
json.dump(OUT, open('loads.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open('../../obj/src/loads.js', 'w', encoding='utf-8').write('// Навантаження від СЕС на кожен дах — власна вага (calc/ep04/loads.py)\nconst LOADS=' + json.dumps(OUT, ensure_ascii=False, separators=(',', ':')) + ';\n')
if __name__ == '__main__':
    for r in ROWS: print(f"{r['n']:48s} мод {r['mods']:5d}  {r['A']:7.0f} м²  " + '  '.join(f"{c} {r['s'][c]/1000:6.2f}" for c in r['s']) + f"  = {r['tot']/1000:6.2f} т  {r['kgm2'] or 0:5.1f} кг/м²")
    for g in GROUPS: print(f"== {g['n']}: {g['tot']/1000:.1f} т, {g['kgm2']} кг/м² під модулями, {g['kgm2_plan']} кг/м² у плані {g['plan']}")
