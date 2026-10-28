# -*- coding: utf-8 -*-
"""Повна специфікація СЕС АБК, варіант «ДБН» (українською й англійською) → antares/abk/abk_bom.json.
Кількості:
- модулі, стрінги, траси лотків, кабелі DC, перемички, вирівнювання потенціалів — abk_dbn.json (calc/v3/abk_dbn.py, 3D-модель АБК);
- кріплення на арці — як на даху цеху (варіант Б, «по даху»): кількість на модуль за кошторисом позицій 26.10 (1 749 модулів даху), × модулі арки;
  баласт — як у кошторисі під ключ 27.10 (2,7193 блока з матом і 0,4851 без мата на модуль даху), «домік» — 4 блоки на модуль, опори лотків — через 1,5 м;
- кріплення на стінах — 2 рейки 41×41 на групу модулів, кронштейни через 1,0 м, притиски на кожному стику і краях;
- інвертор, підключення AC, лічильник, безпека покрівлі — як у кошторисі 28.10."""
import json, math, os
A = '/home/claude/galkat-20/antares/abk/'
D = json.load(open(A + 'abk_dbn.json')); K = json.load(open(A + 'abk_k1.json'))
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
# стіни: групи модулів (книжково — суцільні рейки на групу, альбомно на надбудові — 2 вертикальні рейки на модуль)
WALL = [('west', 5, 'P'), ('east', 2, 'P'), ('nad', 2, 'L')]
rail = brk = clamp = 0.0
for g, n, how in WALL:
    if how == 'P':
        L_ = n * 1.303 + (n - 1) * 0.022 + 0.1; rail += 2 * L_; brk += 2 * (up(L_ / 1.0) + 1); clamp += 2 * ((n - 1) + 2)
    else:
        rail += n * 2 * 1.403; brk += n * 2 * 2; clamp += n * 2 * 2
blk_arch = NA * 4457 / 1639; blk_edge = NA * 795 / 1639; blk_dom = (NL + NN) * 4
BLK = up((blk_arch + blk_edge + blk_dom + roof_sup) * 1.01)
LPSN = sum(len(g['con']) for g in D['lps']['groups'])
I = []
def it(g, key, uk, en, unit, q, ref, tag, src, qty_in=None):
    I.append(dict(g=g, key=key, uk=uk, en=en, u=unit, q=q, ref=ref, tag=tag, src=src, **({'qin': qty_in} if qty_in is not None else {})))
G = {
 'A': ('Фотомодулі', 'PV modules'), 'B': ('Кріплення на арці — лаги на баласті', 'Arch roof mounting — rails on ballast'),
 'C': ('Кріплення «домік» 15° — нижній дах і надбудова', 'Dual-tilt 15° mounting — lower roof and stair house'), 'D': ('Кріплення на південних стінах', 'South wall mounting'),
 'E': ('Кабелі DC і з\'єднання стрінгів', 'DC cabling and string connections'), 'F': ('Лотки і траси', 'Cable trays and routes'),
 'G': ('Інвертор, AC, облік, обмеження видачі', 'Inverter, AC, metering, export limit'), 'H': ('Блискавкозахист і вирівнювання потенціалів', 'Lightning protection and equipotential bonding'),
 'I': ('Безпека покрівлі (ДБН)', 'Roof safety (DBN)'), 'J': ('Баласт', 'Ballast')}
# A
it('A', 'mod', 'Фотомодуль ZNSHINE ZXN8-BD132-730, 730 Вт, 2 384 × 1 303 × 33 мм, виводи 1,2–1,4 м', 'PV module ZNSHINE ZXN8-BD132-730, 730 W, 2384 × 1303 × 33 mm, leads 1.2–1.4 m', 'шт / pcs', up(N * 1.02), '1.1', 'mod',
   f'{N} у стрінгах (арка {NA}, нижній дах {NL}, надбудова {NN}, стіни {NW}) + 2 % / {N} in strings + 2 %', N)
# B — як варіант Б даху цеху, на модуль
B = [('lag', 'Лага 41×41×1,5 перфорована оцинкована (4 800 і 2 400 мм)', 'Rail 41×41×1.5 perforated galvanised (4800 and 2400 mm)', 'м / m', 5282.7),
     ('slv', 'Гільза 200 з привареною муфтою M10×50 (ліва / права)', 'Sleeve 200 with welded coupling M10×50 (LH / RH)', 'шт / pcs', 1989.8),
     ('b60', 'Болт M10×60 + 2 шайби + гайка + трубка', 'Bolt M10×60 + 2 washers + nut + tube', 'компл / set', 3979.5),
     ('rod', 'Шпилька M10 права / ліва різьба', 'Threaded rod M10 RH / LH', 'м / m', 2202.1),
     ('nr', 'Гайка M10 права', 'Nut M10 RH', 'шт / pcs', 3425.1), ('nl', 'Гайка M10 ліва', 'Nut M10 LH', 'шт / pcs', 1712.6),
     ('edge', 'Профіль 41×41×1,5 крайній', 'Edge profile 41×41×1.5', 'м / m', 579.3),
     ('ang', 'Кутник 160/150, t = 8 (правий і лівий)', 'Angle bracket 160/150, t = 8 (RH and LH)', 'шт / pcs', 935.2),
     ('b70', 'Болт M10×70 / M10×60 + гайка (кутники)', 'Bolt M10×70 / M10×60 + nut (angle brackets)', 'компл / set', 3091.2),
     ('clp', 'Притиск середній / Z33 під раму 33 мм з болтом і гайкою з пружиною', 'Mid clamp / Z33 for 33 mm frame with bolt and spring nut', 'шт / pcs', 7622.0),
     ('b8', 'Болт M8×20 + шайба DIN 9021 (лага / профіль до блока)', 'Bolt M8×20 + washer DIN 9021 (rail / profile to block)', 'компл / set', 5884.2)]
for key, uk, en, u, q in B:
    it('B', key, uk, en, u, up(per(q)), '1.2', 'arch' if key not in ('lag', 'edge') else 'lag', f'як дах цеху, варіант Б: {F(q)} на {F(R1749, 0)} модулів × {NA} / as shop roof, variant B: per module × {NA}')
# C
it('C', 'dom', 'Комплект кріплення «домік» 15° на модуль: трикутники ГалКат, П-кронштейни, 4 притиски, метизи', 'Dual-tilt 15° mounting kit per module: GalKat triangles, U-brackets, 4 clamps, fasteners', 'компл / set', NL + NN, '1.3', 'frame',
   f'нижній дах {NL} + надбудова {NN} / lower roof {NL} + stair house {NN}')
# D
it('D', 'wrail', 'Рейка 41×41 на стіні (суцільна на групу модулів)', 'Wall rail 41×41 (continuous per module group)', 'м / m', up(rail * 1.05), '1.4', 'wrail', f'{F(rail)} м + 5 % / m + 5 %')
it('D', 'wbrk', 'Кронштейн рейки до стіни з анкером, через ≤ 1,0 м', 'Rail-to-wall bracket with anchor, every ≤ 1.0 m', 'шт / pcs', up(brk * 1.03), '1.4', 'wrail', f'{brk:.0f} + 3 %')
it('D', 'wclp', 'Притиск середній / кінцевий Al 6005-T6', 'Mid / end clamp Al 6005-T6', 'шт / pcs', up(clamp * 1.03), '1.4', 'wrail', f'{clamp:.0f} + 3 %')
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
it('H', 'bws', 'Шайба контактна зубчаста під болти гільз', 'Serrated contact washer under sleeve bolts', 'шт / pcs', up(per(3979.5)), '1.7', 'bz', 'як болти M10×60 / as bolts M10×60')
it('H', 'b16l', 'Наконечник 16 мм² і контрольне з\'єднання', 'Lug 16 mm² and test joint', 'шт / pcs', 4, '1.7', 'bz', '')
it('H', 'spd485', 'ПЗІП лінії RS485', 'RS485 data line surge protector', 'шт / pcs', 1, '1.7', 'bz', '')
# I
it('I', 'p1', 'Драбина П1 на арку з поручнями над парапетом (перепад 4,8 м + 1,0 м)', 'Fixed fire ladder P1 to the arch roof with handrails above parapet (4.8 m + 1.0 m)', 'м / m', 5.8, '4.8', 'p1', 'ДБН В.1.1-7:2016 п. 8.8–8.10')
it('I', 'plat', 'Площадка з огорожею 0,6 м на арці перед виходом на покрівлю', 'Landing with 0.6 m guard on the arch at the roof exit', 'шт / pcs', 1, '4.9', 'plat', 'ДБН В.1.1-7:2016 табл. 5')
it('I', 'p1n', 'Драбини П1 на надбудову сходів (2 шт.: 2,25 + 1,0 м і 1,35 + 1,0 м)', 'Fixed ladders P1 to the stair house (2 pcs: 2.25 + 1.0 m and 1.35 + 1.0 m)', 'м / m', 5.6, '4.10', 'p1', 'ДБН В.1.1-7:2016 п. 8.8')
it('I', 'rail', 'Огородження покрівлі 0,6 м, металеве: захід і торці арки, парапети надбудови', 'Roof guardrail 0.6 m, steel: arch west side and ends, stair house parapets', 'м / m', 99, '4.11', 'rail', 'ДБН В.1.1-7:2016 п. 8.12; ДБН В.2.6-220:2017 п. 6.1.2')
it('I', 'walk', 'Ходові доріжки 0,8 м — гумові плити 500×500×20 мм', 'Walkways 0.8 m — rubber tiles 500×500×20 mm', 'м² / m²', 63, '4.12', 'walk', 'ДБН В.2.6-220:2017 п. 7.1.3')
# J
it('J', 'blk', 'Баластний блок 300×300×60, 13 кг, з муфтою і матом', 'Ballast block 300×300×60, 13 kg, with coupling and mat', 'шт / pcs', BLK, '4.2', 'blk',
   f'арка {blk_arch:.0f} + крайні профілі {blk_edge:.0f} + «домік» {blk_dom} + опори лотків {roof_sup}, + 1 % / arch + edge + dual-tilt + tray supports, + 1 %')
OUT = dict(groups=G, items=I, n=dict(N=N, NA=NA, NL=NL, NN=NN, NW=NW, ST=ST), blk=dict(arch=round(blk_arch, 2), edge=round(blk_edge, 2), dom=blk_dom, tray=roof_sup, tot=BLK))
json.dump(OUT, open(A + 'abk_bom.json', 'w'), ensure_ascii=False, indent=0)
for x in I: print(x['g'], x['key'], x['q'], x['u'], x['ref'])
print('blk', OUT['blk'])
