# -*- coding: utf-8 -*-
"""Повна специфікація СЕС АБК, варіант «ДБН» (українською й англійською) → antares/abk/abk_bom.json.
Кількості:
- модулі, стрінги, траси лотків, кабелі DC, перемички, вирівнювання потенціалів — abk_dbn.json (calc/v3/abk_dbn.py, 3D-модель АБК);
- кріплення (арка, «домік», трикутники 15°, стіни) і баласт під ним — кожна деталь з 3D-моделі: antares/abk/abk_mount.json (antares/abk/mount.py,
  типові рішення «Елементи SES»); запас: сталь +3 %, метизи, притиски, шпильки +5 %, блоки +1 %; опори лотків — через 1,5 м;
- інвертор, підключення AC, лічильник, безпека покрівлі — як у кошторисі 28.10."""
import json, math, os
A = '/home/claude/galkat-20/antares/abk/'
D = json.load(open(A + 'abk_dbn.json')); K = json.load(open(A + 'abk_k1.json')); MQ = json.load(open(A + 'abk_mount.json'))['q']
mods = D['mods']; inS = [m for m in mods if m['k']]
NA = sum(1 for m in inS if m['src'] == 'archD'); NL = sum(1 for m in inS if m['src'] == 'low'); NN = sum(1 for m in inS if m['src'] == 'nad'); NW = sum(1 for m in inS if m['src'] == 'wall')
N = len(inS); ST = len(D['strings']); assert N == 132 and NA == 86 and NL == 31 and NN == 6 and NW == 9, (N, NA, NL, NN, NW)
F = lambda v, d=1: f'{v:,.{d}f}'.replace(',', ' ').replace('.', ',')
up = lambda v, s=1: int(math.ceil(v / s - 1e-9) * s)
R1749 = 1749                                                           # модулів даху цеху в кошторисі позицій 26.10 (варіант Б)
per = lambda q: q / R1749 * NA
TS = D['tray_stats']; TL = D['tray_len']; DC = D['dc']
roof_sup = up(TS['roof'] / 1.5); wall_br = up(TS['wall'] / 1.0) + 2
jumps = [j for s in D['strings'] for j in s['jump']]
hose = sum(j['len'] for j in jumps if j['len'] > 3.5 and not j.get('via')) + 0.5 * 2 * ST + 0.6 * NW
ties = (sum(math.dist(*p) for s in D['strings'] for e in ('plus', 'minus') for p in zip(s[e]['pts'][:3], s[e]['pts'][1:4])) + DC['jump']) / 0.5
st3 = lambda v: up(v * 1.03); fx5 = lambda v: up(v * 1.05)                # запас: сталь +3 %, метизи і притиски +5 %
BLKM = MQ['arch_blk'] + MQ['dom_blk'] + MQ['one_blk']; BLKE = MQ['arch_blkn']
BLK = up((BLKM + BLKE + roof_sup) * 1.01)
LPSN = sum(len(g['con']) for g in D['lps']['groups'])
I = []
def it(g, key, uk, en, unit, q, ref, tag, src, qty_in=None):
    I.append(dict(g=g, key=key, uk=uk, en=en, u=unit, q=q, ref=ref, tag=tag, src=src, **({'qin': qty_in} if qty_in is not None else {})))
G = {
 'A': ('Фотомодулі', 'PV modules'), 'B': ('Кріплення на арці — «Лага 0°»: лаги на баласті, шпилькова тяга, крайні профілі', 'Arch roof mounting — "Rail 0°": rails on ballast, rod ties, edge profiles'),
 'C': ('Кріплення 15° — «домік» і трикутники під одиночні модулі (нижній дах і надбудова)', '15° mounting — dual-tilt and triangles for single modules (lower roof and stair house)'), 'D': ('Кріплення на південних стінах — фасадні вузли', 'South wall mounting — facade nodes'),
 'E': ('Кабелі DC і з\'єднання стрінгів', 'DC cabling and string connections'), 'F': ('Лотки і траси', 'Cable trays and routes'),
 'G': ('Інвертор, AC, облік, обмеження видачі', 'Inverter, AC, metering, export limit'), 'H': ('Блискавкозахист і вирівнювання потенціалів', 'Lightning protection and equipotential bonding'),
 'I': ('Безпека покрівлі (ДБН)', 'Roof safety (DBN)'), 'J': ('Баласт', 'Ballast')}
# A
it('A', 'mod', 'Фотомодуль ZNSHINE ZXN8-BD132-730, 730 Вт, 2 384 × 1 303 × 33 мм, виводи 1,2–1,4 м', 'PV module ZNSHINE ZXN8-BD132-730, 730 W, 2384 × 1303 × 33 mm, leads 1.2–1.4 m', 'шт / pcs', up(N * 1.02), '1.1', 'mod',
   f'{N} у стрінгах (арка {NA}, нижній дах {NL}, надбудова {NN}, стіни {NW}) + 2 % / {N} in strings + 2 %', N)
# B — арка, «Лага 0°» (variant-laga-0, arka-src, правила КМ даху цеху Б 25.10); кількості — з 3D-моделі
MQs = lambda *k: sum(MQ[x] for x in k)
nrod = MQs('arch_rod', 'arch_rod_pass'); nprof = MQs('arch_prof', 'arch_prof_pass')
B = [('lag48', 'Лага 41×41×1,5 перфорована оцинкована, 4 800 мм (бічні отвори Ø10,5 через 100, від торців 50)', 'Rail 41×41×1.5 perforated galvanised, 4800 mm (side holes Ø10.5 at 100, 50 from ends)', 'шт / pcs', st3(MQ['arch_lag4800']), 'lag@arch',
      f"{MQ['arch_lag4800']} — 2 комірки на шматок; лаги {F(MQ['arch_lag_m'])} м / 2 cells per piece"),
     ('lag24', 'Лага 41×41×1,5 перфорована оцинкована, 2 400 мм', 'Rail 41×41×1.5 perforated galvanised, 2400 mm', 'шт / pcs', st3(MQ['arch_lag2400']), 'lag@arch', f"{MQ['arch_lag2400']} — непарна комірка / odd cell"),
     ('slv', 'Гільза П 45,5×35×2, 200 мм, з привареною муфтою M10×50 (ліва / права різьба)', 'U-sleeve 45.5×35×2, 200 mm, with welded M10×50 coupling (LH / RH thread)', 'шт / pcs', st3(MQ['arch_slv']), 'slv@arch',
      f"{MQ['arch_slv']}: на кожній лазі в лінії тяги, на стиках лаг / on every rail of a tie line, at rail splices"),
     ('b60', 'Болт M10×60 + 2 шайби DIN 125 + гайка + трубка 14×1,75×38 (гільза до лаги)', 'Bolt M10×60 + 2 washers DIN 125 + nut + tube 14×1.75×38 (sleeve to rail)', 'компл / set', fx5(MQ['arch_m10x60s']), 'slv@arch', f"2 на гільзу: {MQ['arch_m10x60s']} / 2 per sleeve"),
     ('rod', 'Шпилька M10 права / ліва різьба, 1 299 мм', 'Threaded rod M10 RH / LH, 1299 mm', 'шт / pcs', fx5(nrod), 'rod@arch',
      f"{MQ['arch_rod']} між модулями в колонці + {MQ['arch_rod_pass']} через прохід / between modules + across passage"),
     ('nr', 'Гайка M10 права (контргайки шпильок)', 'Nut M10 RH (rod lock nuts)', 'шт / pcs', fx5(2 * nrod), 'rod@arch', '2 на шпильку / 2 per rod'),
     ('nl', 'Гайка M10 ліва', 'Nut M10 LH', 'шт / pcs', fx5(nrod), 'rod@arch', '1 на шпильку / 1 per rod'),
     ('edge', 'Профіль 41×41×1,5 крайній, 1 263 мм', 'Edge profile 41×41×1.5, 1263 mm', 'шт / pcs', st3(nprof), 'prof@arch',
      f"{MQ['arch_prof']} на кінцях колонок + {MQ['arch_prof_pass']} через прохід / column ends + across passage"),
     ('ang', 'Кутник 160/150, t = 8, оцинкований (правий і лівий порівну)', 'Angle bracket 160/150, t = 8, galvanised (equal RH and LH)', 'шт / pcs', st3(MQ['arch_ang']), 'ang@arch', '2 на профіль / 2 per profile'),
     ('b70', 'Болт M10×70 + гайка + шайби (кутник до лаги)', 'Bolt M10×70 + nut + washers (angle to rail)', 'компл / set', fx5(MQ['arch_m10x70']), 'ang@arch', f"{MQ['arch_m10x70']}: один на точку лаги / one per rail point"),
     ('b60a', 'Болт M10×60 + гайка + шайби (кутник до профілю)', 'Bolt M10×60 + nut + washers (angle to profile)', 'компл / set', fx5(MQ['arch_m10x60a']), 'ang@arch', '2 на кутник / 2 per angle'),
     ('cm', 'Притиск середній під раму 33 мм, Al, з болтом M8×60 DIN 912 A2 і гайкою з пружиною', 'Mid clamp for 33 mm frame, Al, with M8×60 DIN 912 A2 bolt and spring nut', 'шт / pcs', fx5(MQ['arch_cm']), 'cm@arch',
      f"{int(MQ['arch_cm'])}: 3 на довгий бік на спільній лазі / 3 per long side on a shared rail"),
     ('cz', 'Притиск Z33, Al, з болтом M8×25 DIN 912 A2 і гайкою з пружиною', 'Z33 clamp, Al, with M8×25 DIN 912 A2 bolt and spring nut', 'шт / pcs', fx5(MQ['arch_cz'] + MQ['arch_czp']), 'cz@arch',
      f"{int(MQ['arch_cz'])} на крайніх лагах + {MQ['arch_czp']} на крайніх профілях / on edge rails + on edge profiles"),
     ('b8', 'Болт M8×20 + шайба DIN 9021 (лага / профіль до муфти блока)', 'Bolt M8×20 + washer DIN 9021 (rail / profile to block coupling)', 'компл / set', fx5(MQ['arch_m8']), 'lag@arch', f"1 на блок: {int(MQ['arch_m8'])} / 1 per block"),
     ('anc', 'Анкер від сповзання до основи покрівлі, з герметизацією', 'Anti-slide anchor to the roof deck, with sealing', 'шт / pcs', MQ['arch_anchor'], 'anc@arch',
      f"{MQ['arch_anchor']}: ланцюжок тяг лінії не переходить гребінь — анкер на верхній лазі (правило КМ даху цеху) / tie chain does not cross the ridge")]
for key, uk, en, u, q, tg, src in B: it('B', key, uk, en, u, q, '1.2' if key != 'anc' else '4.13', tg, src)
# C — «домік» (variant-domik) і трикутник 15° модифікація Антарес (variant-antares-41)
nd, no = MQ['dom_tri'], MQ['one_tri']
C = [('dlag', 'Лага «доміку» 41×41×1,5, 2 750 мм', 'Dual-tilt rail 41×41×1.5, 2750 mm', 'шт / pcs', st3(nd), 'dfr@dom', f"{nd} опор: {MQ['dom']} доміків × 2 / supports: domes × 2"),
     ('dbeam', 'Балка 41×41×1,5, 1 450 мм (отвори шарніра і вершини — заводські)', 'Beam 41×41×1.5, 1450 mm (hinge and apex holes factory)', 'шт / pcs', st3(2 * nd), 'dfr@dom', '2 на опору / 2 per support'),
     ('dstr', 'Стійка 41×41×1,5, 365 мм', 'Strut 41×41×1.5, 365 mm', 'шт / pcs', st3(nd), 'dfr@dom', '1 на опору / 1 per support'),
     ('dbrk', 'П-кронштейн, нерж. 304, t = 3', 'U-bracket, stainless 304, t = 3', 'шт / pcs', st3(nd), 'brk@dom', '1 на опору / 1 per support'),
     ('db', 'Болти M10 опори (2 × M10×100 шарніри, M10×140 вершина, M10×65 стійка, M10×60 кронштейн) + шайби + фланцеві гайки', 'Support bolts M10 (2 × M10×100 hinges, M10×140 apex, M10×65 strut, M10×60 bracket) + washers + flange nuts', 'компл / set', fx5(5 * nd), 'dfr@dom', '5 на опору / 5 per support'),
     ('ddg', 'Діагональ 41×41×1,5, 1 100 мм + 2 болти M10×20 з фланцевими гайками', 'Diagonal 41×41×1.5, 1100 mm + 2 bolts M10×20 with flange nuts', 'шт / pcs', st3(MQ['dom_diag']), 'diag@dom', 'між сусідніми доміками ряду / between adjacent domes in a row'),
     ('dce', 'Притиск крайній під раму 33 мм з болтом M8 і гайкою з пружиною', 'End clamp for 33 mm frame with M8 bolt and spring nut', 'шт / pcs', fx5(MQ['dom_ce']), 'ce@dom', f"4 на панель: {MQ['dom_ce']} / 4 per panel"),
     ('db8', 'Болт M8×20 + шайба DIN 9021 (лага до муфти блока)', 'Bolt M8×20 + washer DIN 9021 (rail to block coupling)', 'компл / set', fx5(MQ['dom_blk']), 'dfr@dom', '4 на опору / 4 per support'),
     ('slag', 'Лага трикутника 15° 41×41×1,5, 1 550 мм', '15° triangle rail 41×41×1.5, 1550 mm', 'шт / pcs', st3(no), 'sfr@one', f"{no} трикутників: {MQ['one']} модулів × 2 / triangles: modules × 2"),
     ('sbeam', 'Балка 41×41×1,5, 1 419 мм', 'Beam 41×41×1.5, 1419 mm', 'шт / pcs', st3(no), 'sfr@one', '1 на трикутник / 1 per triangle'),
     ('sstr', 'Стійка 41×41×1,5, 448 мм (13-й отвір від шарніра)', 'Strut 41×41×1.5, 448 mm (13th hole from hinge)', 'шт / pcs', st3(no), 'sfr@one', '1 на трикутник / 1 per triangle'),
     ('sbrk', 'П-кронштейн під 15°, нерж. 304 (зміщений отвір під болт балки)', 'U-bracket for 15°, stainless 304 (shifted beam bolt hole)', 'шт / pcs', st3(no), 'brk@one', '1 на трикутник / 1 per triangle'),
     ('sb', 'Болти M10×60 (3) і M10×20 (3) трикутника + шайби + фланцеві гайки', 'Triangle bolts M10×60 (3) and M10×20 (3) + washers + flange nuts', 'компл / set', fx5(6 * no), 'sfr@one', '6 на трикутник / 6 per triangle'),
     ('sdg', 'Діагональ 41×41×1,5, 1 100 мм + 2 болти M10×20 з фланцевими гайками', 'Diagonal 41×41×1.5, 1100 mm + 2 bolts M10×20 with flange nuts', 'шт / pcs', st3(MQ['one_diag']), 'diag@one', 'між трикутниками сусідніх модулів / between triangles of adjacent modules'),
     ('sce', 'Притиск крайній під раму 33 мм з болтом M8 і гайкою з пружиною', 'End clamp for 33 mm frame with M8 bolt and spring nut', 'шт / pcs', fx5(MQ['one_ce']), 'ce@one', f"4 на модуль: {MQ['one_ce']} / 4 per module"),
     ('sb8', 'Болт M8×20 + шайба DIN 9021 (лага до муфти блока)', 'Bolt M8×20 + washer DIN 9021 (rail to block coupling)', 'компл / set', fx5(MQ['one_blk']), 'sfr@one', '2 на трикутник / 2 per triangle')]
for key, uk, en, u, q, tg, src in C: it('C', key, uk, en, u, q, '1.3', tg, src)
# D — фасадні вузли «Вертикально, книжково» (спільні рейки на групу) і «Вертикально, альбомно»
D_ = [('wrail', 'Рейка 41×41×2,5 оцинкована на стіні, у розмір', 'Wall rail 41×41×2.5 galvanised, cut to size', 'м / m', round(MQ['wall_rail_m'] * 1.03, 1), 'wr@wall',
       f"{MQ['wall_rail_n']} рейок, {F(MQ['wall_rail_m'])} м: на 540 мм від торців модуля / {MQ['wall_rail_n']} rails at 540 mm from module ends"),
      ('wbrk', 'Кронштейн L 60×60×5 з пазом, цинк + анкер M10 + болт M10×35 з гайкою і 2 шайбами', 'Bracket L 60×60×5 slotted, galvanised + M10 anchor + M10×35 bolt with nut and 2 washers', 'компл / set', fx5(MQ['wall_brk']), 'wbrk@wall', f"{MQ['wall_brk']}: через ≈1,2 м на спільній рейці, 2 на рейку альбомного / every ≈1.2 m"),
      ('wce', 'Притиск крайній 80 мм, Al 6005-T6, під раму 33 + болт M8 і гайка з пружиною', 'End clamp 80 mm, Al 6005-T6, for 33 mm frame + M8 bolt and spring nut', 'шт / pcs', fx5(MQ['wall_ce']), 'ce@wall', f"{MQ['wall_ce']}"),
      ('wcm', 'Притиск середній 80 мм, Al 6005-T6 + болт M8 і гайка з пружиною', 'Mid clamp 80 mm, Al 6005-T6 + M8 bolt and spring nut', 'шт / pcs', fx5(MQ['wall_cm']), 'cm@wall', f"{MQ['wall_cm']}: між модулями групи, на кожній рейці / between modules, on each rail"),
      ('wgnd', 'Пластина заземлювальна під притиск', 'Earthing plate under clamp', 'шт / pcs', MQ['wall_gnd'], 'ce@wall', '1 на модуль / 1 per module'),
      ('wrope', 'Трос безпеки Ø3 AISI 316 у ПВХ ≈0,6 м з коушем, 2 втулками, гайкою-вушком M8 і болтом', 'Safety rope Ø3 AISI 316 in PVC ≈0.6 m with thimble, 2 ferrules, M8 eye nut and bolt', 'компл / set', MQ['wall_rope'], 'wr@wall', '1 на модуль, крізь заводський отвір рами / 1 per module through factory frame hole')]
for key, uk, en, u, q, tg, src in D_: it('D', key, uk, en, u, q, '1.4', tg, src)
# E
it('E', 'pvr', 'Кабель сонячний H1Z2Z2-K 1×6 мм², 1,5 кВ DC, червоний («+»)', 'Solar cable H1Z2Z2-K 1×6 mm², 1.5 kV DC, red (+)', 'м / m', up(DC['plus'] * 1.1, 10), '1.5', 'dc', f'траси «+» {F(DC["plus"])} м + 10 % / routes + 10 %')
it('E', 'pvb', 'Кабель сонячний H1Z2Z2-K 1×6 мм², 1,5 кВ DC, чорний («−», перемички)', 'Solar cable H1Z2Z2-K 1×6 mm², 1.5 kV DC, black (−, jumpers)', 'м / m', up((DC['minus'] + DC['jump']) * 1.1, 10), '1.5', 'dc',
   f'«−» {F(DC["minus"])} м + перемички {F(DC["jump"])} м ({DC["njump"]} шт.) + 10 % / minus + jumpers + 10 %')
it('E', 'mc4', "Роз'єм MC4 (пара штекер + гніздо) під 6 мм²", 'MC4 connector pair (male + female) for 6 mm²', 'пар / pairs', up((2 * ST + 2 * DC['njump']) * 1.05), '1.5', 'dc',
   f'2 на стрінг + 2 на перемичку, + 5 %; на інверторі — у комплекті / 2 per string + 2 per jumper; inverter side included')
it('E', 'hose', 'Металорукав сталевий у ПВХ-оболонці Ø25, стійкий до УФ — виходи з поля і перемички поза лотками', 'PVC-coated steel conduit Ø25, UV resistant — field exits and jumpers outside trays', 'м / m', up(hose * 1.1), '1.5', 'dc', f'{F(hose)} м + 10 %')
it('E', 'bush', 'Втулка ізолююча на кінець металорукава Ø25', 'Insulating end bush for conduit Ø25', 'шт / pcs', up((2 * ST + 2 * NW) * 1.05), '1.5', 'dc', '2 на вихід стрінга і на модуль стіни / 2 per string exit and wall module')
it('E', 'tie', 'Стяжка кабельна 300×4,8 PA66, стійка до УФ, уп. 100', 'Cable tie 300×4.8 PA66 UV resistant, pack of 100', 'уп / pack', up(ties / 100 + 0.5), '1.5', 'dc', f'кабель під модулями і перемички через 0,5 м: {F(ties, 0)} шт / every 0.5 m')
it('E', 'lab', 'Бирка маркувальна УФ-стійка з друком', 'UV-resistant printed cable label', 'шт / pcs', 4 * ST + 6, '1.5', 'dc', '4 на стрінг, 4 на AC, 2 на RS485 / 4 per string, 4 AC, 2 RS485')
# F
nsec = up(TL * 1.1 / 3.0)
it('F', 'tray', 'Лоток перфорований 100×50 з кришкою, оцинкований, секція 3 м', 'Perforated cable tray 100×50 with lid, galvanised, 3 m section', 'м / m', nsec * 3, '1.6', 'tray', f'траси {F(TL)} м + 10 %, цілими секціями / routes + 10 %, full sections')
it('F', 'trh', 'Кут горизонтальний 90° 100×50 з кришкою', 'Horizontal 90° bend 100×50 with lid', 'шт / pcs', TS['corners_h'], '1.6', 'tray', '3D-траси / 3D routes')
it('F', 'trv', 'Кут вертикальний 90° 100×50 з кришкою (зовнішній / внутрішній)', 'Vertical 90° bend 100×50 with lid (outside / inside)', 'шт / pcs', TS['corners_v'], '1.6', 'tray', '3D-траси / 3D routes')
it('F', 'trt', 'Трійник 100×50 з кришкою', 'Tee 100×50 with lid', 'шт / pcs', TS['tees'], '1.6', 'tray', 'стики трас / route junctions')
it('F', 'tre', 'Заглушка торцева 100×50', 'End cap 100×50', 'шт / pcs', TS['ends'], '1.6', 'tray', 'кінці трас / route ends')
it('F', 'trc', "З'єднувач лотків з перемичкою заземлення", 'Tray coupler with earth bridge', 'шт / pcs', nsec, '1.6', 'tray', 'на стик секцій / per section joint')
it('F', 'trk', 'Фіксатор кришки від вітру', 'Lid wind clip', 'шт / pcs', 2 * nsec + TS['corners_h'] + TS['corners_v'] + TS['tees'], '1.6', 'tray', '2 на секцію, 1 на фасонний / 2 per section, 1 per fitting')
it('F', 'trs', 'Траверса опори лотка — профіль 41×41×2,5, L = 0,2 м', 'Tray support cross-bar 41×41×2.5, L = 0.2 m', 'шт / pcs', roof_sup, '1.6', 'tray', f'опори на даху через 1,5 м: {F(TS["roof"])} м / roof supports every 1.5 m')
it('F', 'trb', 'Болт M8×20 + шайба DIN 9021 (траверса → муфта блока)', 'Bolt M8×20 + washer DIN 9021 (cross-bar to block coupling)', 'компл / set', roof_sup, '1.6', 'tray', '1 на опору / 1 per support')
it('F', 'trn', 'Болт M8×20 + гайка з пружиною + шайба (лоток → траверса)', 'Bolt M8×20 + spring nut + washer (tray to cross-bar)', 'компл / set', 2 * roof_sup, '1.6', 'tray', '2 на опору / 2 per support')
it('F', 'trw', 'Кронштейн лотка на стіну з анкером, через 1,0 м', 'Wall bracket for tray with anchor, every 1.0 m', 'шт / pcs', wall_br, '1.6', 'tray', f'спуски по стінах {F(TS["wall"])} м / wall runs')
# G
it('G', 'inv', "Інвертор мережевий Deye SUN-100K-G03: 100 кВт, 3 фази 400 В, 6 MPPT, DC до 1 000 В, IP65; DC-роз'єднувач, ПЗІП тип II на DC і AC; кронштейн і роз'єми DC у комплекті",
   'Grid inverter Deye SUN-100K-G03: 100 kW, 3-phase 400 V, 6 MPPT, DC up to 1000 V, IP65; DC switch, type II SPD on DC and AC; bracket and DC connectors included', 'шт / pcs', 1, '4.1', 'inv', 'паспорт Deye / Deye datasheet')
it('G', 'ac', 'Кабель ВВГнг 5×70 мм², мідь — інвертор → щит СЕС біля вступного щита АБК', 'Cable VVGng 5×70 mm² copper — inverter to PV board at the building main board', 'м / m', 45, '4.3', 'ac', 'по стіні і стояку сходів, + 10 % / along wall and stair riser, + 10 %')
it('G', 'lug70', 'Наконечник мідний луджений ТМЛ 70', 'Tinned copper lug 70 mm²', 'шт / pcs', 10, '5.3', 'ac', '5 жил × 2 кінці / 5 cores × 2 ends')
it('G', 'mccb', 'Автоматичний вимикач ABB FormulA A2B 250 TMF 200, 3P, 200 А', 'Moulded-case breaker ABB FormulA A2B 250 TMF 200, 3P, 200 A', 'шт / pcs', 1, '4.4', 'shch', 'струм інвертора до 159,4 А / inverter current up to 159.4 A')
it('G', 'box', 'Корпус щита IEK ЩМП-4.6.2-0 74 У2, 400 × 600 × 250, IP54 — щит СЕС', 'Enclosure IEK ShchMP-4.6.2-0, 400 × 600 × 250, IP54 — PV board', 'шт / pcs', 1, '4.4', 'shch', '')
it('G', 'spdac', 'ПЗІП AC тип 2, 4P, 280 В (Eaton SPCT2-280/4) — у щиті СЕС', 'AC surge protector type 2, 4P, 280 V (Eaton SPCT2-280/4) — in PV board', 'шт / pcs', 1, '4.5', 'shch', 'вхід AC у будівлю / AC entry into the building')
it('G', 'meter', 'Лічильник CHINT DTSU666 з трансформаторами струму 250 А — на вводі АБК, обмеження видачі в мережу (Zero Export)', 'Meter CHINT DTSU666 with 250 A current transformers — at the building input, export limiting (Zero Export)', 'компл / set', 1, '4.6', 'meter', '')
it('G', 'rs485', 'Кабель RS485 2×2×0,75 мм² в екрані — лічильник → інвертор', 'RS485 cable 2×2×0.75 mm² screened — meter to inverter', 'м / m', 55, '1.8', 'ac', 'уздовж кабелю AC / along AC cable')
it('G', 'gland', 'Прохід кабелів крізь стіну надбудови з ущільненням', 'Cable wall pass-through into the stair house with sealing', 'компл / set', 1, '5.3', 'ac', '')
# H
it('H', 'b6', 'Провід Cu 1×6 мм² жовто-зелений — вирівнювання потенціалів у лотках і відгалуження до кріплення', 'Cu wire 1×6 mm² green-yellow — equipotential bonding in trays and branches to mounting', 'м / m', up(D['lps']['bond6'], 5), '1.7', 'bz',
   f'лотки {F(TL)} м + 10 % і {LPSN} відгалужень / trays + 10 % and {LPSN} branches')
it('H', 'b16', 'Провід Cu 1×16 мм² жовто-зелений — до PE інвертора і до наявного прутка на парапеті', 'Cu wire 1×16 mm² green-yellow — to inverter PE and to the existing parapet rod', 'м / m', D['lps']['bond16'], '1.7', 'bz', '')
it('H', 'bcl', 'Затискач до профілю і відгалужувальний EN 62561-1', 'Profile and branch clamp EN 62561-1', 'шт / pcs', LPSN + 4, '1.7', 'bz', f'по 2 на {len(D["lps"]["groups"])} блоків кріплення + 4 / 2 per mounting block + 4')
it('H', 'bws', 'Шайба контактна зубчаста під болти гільз', 'Serrated contact washer under sleeve bolts', 'шт / pcs', fx5(MQ['arch_m10x60s']), '1.7', 'bz', 'як болти M10×60 гільз / as sleeve bolts M10×60')
it('H', 'b16l', 'Наконечник 16 мм² і контрольне з\'єднання', 'Lug 16 mm² and test joint', 'шт / pcs', 4, '1.7', 'bz', '')
it('H', 'spd485', 'ПЗІП лінії RS485', 'RS485 data line surge protector', 'шт / pcs', 1, '1.7', 'bz', '')
# I
it('I', 'p1', 'Драбина П1 на арку з поручнями над парапетом (перепад 4,8 м + 1,0 м)', 'Fixed fire ladder P1 to the arch roof with handrails above parapet (4.8 m + 1.0 m)', 'м / m', 5.8, '4.8', 'p1', 'ДБН В.1.1-7:2016 п. 8.8–8.10')
it('I', 'plat', 'Площадка з огорожею 0,6 м на арці перед виходом на покрівлю', 'Landing with 0.6 m guard on the arch at the roof exit', 'шт / pcs', 1, '4.9', 'plat', 'ДБН В.1.1-7:2016 табл. 5')
it('I', 'p1n', 'Драбини П1 на надбудову сходів (2 шт.: 2,25 + 1,0 м і 1,35 + 1,0 м)', 'Fixed ladders P1 to the stair house (2 pcs: 2.25 + 1.0 m and 1.35 + 1.0 m)', 'м / m', 5.6, '4.10', 'p1', 'ДБН В.1.1-7:2016 п. 8.8')
it('I', 'rail', 'Огородження покрівлі 0,6 м, металеве: захід і торці арки, парапети надбудови', 'Roof guardrail 0.6 m, steel: arch west side and ends, stair house parapets', 'м / m', 99, '4.11', 'rail', 'ДБН В.1.1-7:2016 п. 8.12; ДБН В.2.6-220:2017 п. 6.1.2')
it('I', 'walk', 'Ходові доріжки 0,8 м — гумові плити 500×500×20 мм', 'Walkways 0.8 m — rubber tiles 500×500×20 mm', 'м² / m²', 63, '4.12', 'walk', 'ДБН В.2.6-220:2017 п. 7.1.3')
# J
it('J', 'blk', 'Баластний блок 300×300×60, 13 кг, з муфтою M8×30 і матом 320×320×3', 'Ballast block 300×300×60, 13 kg, with M8×30 coupling and 320×320×3 mat', 'шт / pcs', BLK - up(BLKE * 1.01), '4.2', 'blk',
   f"арка {MQ['arch_blk']}, «домік» {MQ['dom_blk']}, трикутники 15° {MQ['one_blk']}, опори лотків {roof_sup}, + 1 % / arch, dual-tilt, 15° triangles, tray supports, + 1 %")
it('J', 'blkn', 'Баластний блок 300×300×60 з муфтою, без мата, верх знято — під крайні профілі арки', 'Ballast block 300×300×60 with coupling, no mat, top trimmed — under arch edge profiles', 'шт / pcs', up(BLKE * 1.01), '4.2', 'blkn@arch',
   f'2 на крайній профіль: {BLKE} + 1 % / 2 per edge profile + 1 %')
OUT = dict(groups=G, items=I, n=dict(N=N, NA=NA, NL=NL, NN=NN, NW=NW, ST=ST), blk=dict(arch=MQ['arch_blk'], edge=BLKE, dom=MQ['dom_blk'], one=MQ['one_blk'], tray=roof_sup, mount=BLKM + BLKE, tot=BLK), anc=MQ['arch_anchor'])
json.dump(OUT, open(A + 'abk_bom.json', 'w'), ensure_ascii=False, indent=0)
for x in I: print(x['g'], x['key'], x['q'], x['u'], x['ref'])
print('blk', OUT['blk'])
