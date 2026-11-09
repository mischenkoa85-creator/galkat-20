# -*- coding: utf-8 -*-
"""Антарес — специфікація метизів і кріпильних виробів для замовлення в Китаї (10.11.2026), частини 1 і 2, UA / EN.
Частина 1 — склад, фасади і козирок, ліхтарі, АБК, лотки й щити частини 1; частина 2 — дах цеху (розкладка В1), лотки й щити частини 2
(рішення власника 09.11: будувати двома частинами). Кількості — з моделі:
- дах цеху: кількості Тому 3 КМ на 1 749 модулів (twin montage: гільз 1 895, болтів M10×60 3 790, шпильок 1 561 + 70, гайок 3 262 / 1 631,
  M10×70 1 128, M10×60 до профілю 1 816, притисків 4 227 / 3 032), × 1 831 / 1 749 (В1, ep04/bom.py); болти M8×20 — лише під блоки лаг
  (4 274 + 482) і додаткові блоки зон F і G (164): блоки під крайніми профілями прибрано 07.11;
- склад: південь 176 — розрахунок 26.10 (до замовлення 418 / 2 508 / 97 / 322), північні скати 121 — ланцюжки з ep04/wh_abk.json;
- фасади: 264 вертикальні + 33 козирка (ep04/data.json → fac; набір метизів — calc/fasad/fac_dbn.py);
- ліхтарі: 316 модулів, 652 притиски (ep04/bom.py) → 10 рядів: крайніх 40, середніх 612;
- АБК: antares/abk/abk_bom.json (уже із запасом);
- лотки: опори на блоках і рами щитів — ep04/final.json (як у bom.py).
Запас: метизи, притиски, шпильки +5 % (правило власника); у позиціях АБК запас уже враховано."""
import json, math, os, sys
from pathlib import Path
H = Path(__file__).resolve().parent; C = H.parent; A = C.parent
up = lambda v: int(math.ceil(v - 1e-9))
R = lambda q: up(q * 1.05)                                  # +5 %

# ---------- маси одиниці, кг (довідково: з геометрії стандартів; перевірені — dinmark: M10×60 40,9 г, M8×20 11,8, гайка M10 10,2, M8 4,6, DIN 9021 M8 6,0)
m933 = lambda d, L: {10: (0.0111 + 0.000522 * L) * 0.965, 8: (0.0061 + 0.0003285 * L) * 0.93}[d]
m912 = lambda L: 0.0074 + 0.000331 * L                      # DIN 912 M8 A2
NUT10, NUT8, W125_10, W125_8, W9021_10, W9021_8, W127_8 = 0.0102, 0.0046, 0.0036, 0.0018, 0.0122, 0.0060, 0.0011
TUBE, SNUT, CLAMP, SLV, ROD_M = 0.020, 0.043, 0.10, 0.42, 0.52   # трубка 14×1,75×38; гайка з пружиною 35×20×8; притиск Al (як у моделі); гільза з муфтою (розрахунок 25.10); шпилька M10 (Ø 9,2 ефективний), кг/м
K_M10_60 = m933(10, 60) + 2 * W125_10 + NUT10 + TUBE
K_M10_70a = m933(10, 70) + NUT10 + 2 * W125_10; K_M10_60a = m933(10, 60) + NUT10 + 2 * W125_10
K_MID = CLAMP + m912(60) + SNUT; K_Z33 = CLAMP + m912(25) + SNUT; K_B8 = m933(8, 20) + W9021_8

# ---------- дах цеху (частина 2)
k = 1831 / 1749
rod_all = 2202.1 * k * 1.05                                 # м, як у кошторисі (bom.py)
rod_n = R(1561 * k); rod_p = R(70 * k); rod_pm = rod_all - rod_n * 1.299
ROOF = [
 ('slv', 'Гільза П 45,5×35×2, L 200, з привареною муфтою M10×50 (половина — ліва різьба), цинк', 'U-sleeve 45.5×35×2, L 200, with welded coupling nut M10×50 (half LH thread), zinc',
  'шт', R(1895 * k), SLV, 'під кожним стиком модулів; бере і стик шматків лаги'),
 ('b60', 'Болт M10×60 DIN 933 + 2 шайби DIN 125 + гайка DIN 934 + трубка 14×1,75×38', 'Bolt M10×60 DIN 933 + 2 washers DIN 125 + nut DIN 934 + tube 14×1.75×38',
  'компл', R(3790 * k), K_M10_60, '2 на гільзу, крізь бічні отвори лаги'),
 ('rod', 'Шпилька M10, L 1 299, різьба права з одного кінця і ліва з іншого, цинк', 'Threaded rod M10, L 1299, RH thread one end / LH other end, zinc',
  'шт', rod_n, ROD_M * 1.299, 'між муфтами сусідніх лаг'),
 ('rodp', 'Шпилька M10 права / ліва через прохід, L 570–1 580 (за кресленням КМ)', 'Threaded rod M10 RH/LH across passage, L 570–1580 (per drawing)',
  'шт', rod_p, ROD_M * rod_pm / rod_p, f'разом {rod_pm:.0f} м'.replace('.', ',')),
 ('nr', 'Гайка M10 DIN 934, права різьба (контргайки шпильок)', 'Nut M10 DIN 934, RH thread (rod lock nuts)', 'шт', R(3262 * k), NUT10, '2 на шпильку'),
 ('nl', 'Гайка M10 DIN 934, ліва різьба', 'Nut M10 DIN 934, LH thread', 'шт', R(1631 * k), NUT10, '1 на шпильку'),
 ('b70', 'Болт M10×70 DIN 933 + гайка DIN 934 + 2 шайби DIN 125 (кутник до лаги)', 'Bolt M10×70 DIN 933 + nut DIN 934 + 2 washers DIN 125 (angle to rail)', 'компл', R(1128 * k), K_M10_70a, 'край ряду'),
 ('b60a', 'Болт M10×60 DIN 933 + гайка DIN 934 + 2 шайби DIN 125 (кутник до профілю)', 'Bolt M10×60 DIN 933 + nut DIN 934 + 2 washers DIN 125 (angle to profile)', 'компл', R(1816 * k), K_M10_60a, 'край ряду'),
 ('cm', 'Притиск середній Al 6005-T6 під раму 33 мм + болт M8×60 DIN 912 A2 + гайка M8 з пружиною в паз 41×41', 'Mid clamp Al 6005-T6 for 33 mm frame + bolt M8×60 DIN 912 A2 + M8 spring channel nut for 41×41',
  'компл', R(4227 * k), K_MID, 'між рамами на спільній лазі'),
 ('cz', 'Притиск крайній Z33 Al + болт M8×25 DIN 912 A2 + гайка M8 з пружиною в паз 41×41', 'End clamp Z33 Al + bolt M8×25 DIN 912 A2 + M8 spring channel nut for 41×41',
  'компл', R(3032 * k), K_Z33, 'на крайніх лагах і профілях'),
 ('b8', 'Болт M8×20 DIN 933 + шайба DIN 9021 M8 (лага до муфти блока)', 'Bolt M8×20 DIN 933 + washer DIN 9021 M8 (rail to block coupling nut)', 'компл', R((4274 + 482) * k + 164), K_B8, '1 на блок, разом з додатковими блоками зон F і G'),
]
# ---------- склад (частина 1): південь 176 — до замовлення 26.10; північ 121 — ланцюжки
WH = json.load(open(C / 'ep04' / 'wh_abk.json', encoding='utf-8'))['whn']['mods']
import collections
rows = collections.defaultdict(list)
for m in WH:
    if m[4]: rows[(m[2], round(m[1], 2))].append(m[0])
ch = []
for xs in rows.values():
    xs = sorted(xs); run = 1
    for a, b in zip(xs, xs[1:]):
        if b - a < 1.45: run += 1
        else: ch.append(run); run = 1
    ch.append(run)
assert sum(ch) == 121
nr_ = sum(2 * (n + 1) for n in ch); nP_ = sum(2 * (n - 1) for n in ch); nZ_ = 4 * len(ch)
WHS = [
 ('mr', 'Міні-рейка Al 380 мм з EPDM під профнастил (аналог AR2-MR13-380)', 'Mini rail Al 380 mm with EPDM for trapezoidal sheet (like AR2-MR13-380)', 'шт', 418 + R(nr_), None, 'під кожною точкою притиску'),
 ('scr', 'Саморіз 5,5×25 з шайбою EPDM (до профнастилу)', 'Self-drilling screw 5.5×25 with EPDM washer (to trapezoidal sheet)', 'шт', 2508 + R(6 * nr_), None, '6 на міні-рейку'),
 ('p33', 'Притиск середній П33 під раму 33 мм + болт M8×25 A2 + гайка', 'Mid clamp P33 for 33 mm frame + bolt M8×25 A2 + nut', 'компл', 322 + R(nP_), CLAMP + m912(25) + NUT8, 'на стику двох модулів'),
 ('z33', 'Притиск крайній Z33 + болт M8×25 A2 + гайка', 'End clamp Z33 + bolt M8×25 A2 + nut', 'компл', 97 + R(nZ_), CLAMP + m912(25) + NUT8, 'на торці ланцюжка'),
]
# ---------- фасади і козирок (частина 1): fac_dbn.py, набір на модуль
DD = json.load(open(C / 'ep04' / 'data.json', encoding='utf-8'))['fac']
NV, NC = len(DD['vert']), len(DD['can']); assert (NV, NC) == (264, 33)
FAC = [
 ('fb', 'Болт M10×60 DIN 933 8.8 Zn + гайка M10 DIN 934 + 2 шайби DIN 9021 M10 (кронштейн до рейки)', 'Bolt M10×60 DIN 933 8.8 Zn + nut M10 DIN 934 + 2 washers DIN 9021 M10 (bracket to rail)',
  'компл', R(4 * NV), m933(10, 60) + NUT10 + 2 * W9021_10, 'крізь паз кронштейна і обидві стінки рейки'),
 ('fce', 'Притиск крайній Al 6005-T6, 80 мм, під раму 33 мм', 'End clamp Al 6005-T6, 80 mm, for 33 mm frame', 'шт', R(4 * NV + 4 * NC), CLAMP, 'вертикальні 4 + козирок 4 на модуль'),
 ('fcb', 'Болт M8×50 DIN 912 A2 + шайба DIN 125 + шайба пружинна DIN 127', 'Bolt M8×50 DIN 912 A2 + washer DIN 125 + spring washer DIN 127', 'компл', R(4 * NV + 4 * NC), m912(50) + W125_8 + W127_8, 'притиски'),
 ('fsn', 'Гайка M8 з пружиною під паз 41×41', 'M8 spring channel nut for 41×41', 'шт', R(4 * NV + 4 * NC), SNUT, 'притиски'),
 ('fgp', 'Пластина заземлювальна під притиск (пробиває анодування рами)', 'Grounding plate under clamp (pierces frame anodizing)', 'шт', R(NV + NC), None, '1 на модуль'),
 ('frope', 'Трос Ø3 7×19 AISI 316 у ПВХ', 'Wire rope Ø3 7×19 AISI 316, PVC coated', 'м', round(0.6 * (NV + NC) * 1.05, 1), None, 'трос безпеки: петля ≈0,6 м на модуль'),
 ('fth', 'Коуш Ø3 нерж.', 'Thimble Ø3, stainless', 'шт', R(NV + NC), None, 'трос безпеки'),
 ('ffr', 'Втулка обтискна Cu луджена Ø3', 'Crimp ferrule Ø3, tinned Cu', 'шт', R(2 * (NV + NC)), None, '2 на петлю'),
 ('fey', 'Гайка-вушко M8 DIN 582 + болт M8×20 DIN 933 Zn', 'Eye nut M8 DIN 582 + bolt M8×20 DIN 933 Zn', 'компл', R(NV + NC), None, 'трос безпеки: вушко на рейці / консолі'),
 ('fcb10', 'Болт M10×70 DIN 933 8.8 Zn + гайка + 2 шайби (вузли консолі козирка)', 'Bolt M10×70 DIN 933 8.8 Zn + nut + 2 washers (canopy bracket joints)', 'компл', R(6 * NC), K_M10_70a, 'консоль — щоки, підкіс — щоки, підкіс — консоль'),
]
# ---------- ліхтарі (частина 1): 316 модулів на 2 рейках на схил, 652 притиски = 2·316 + 2·10 рядів
LAN = [
 ('lm', 'Притиск середній Al 6005-T6 під раму 33 мм + болт M8×60 DIN 912 A2 + гайка M8 з пружиною в паз 41×41', 'Mid clamp Al 6005-T6 for 33 mm frame + bolt M8×60 DIN 912 A2 + M8 spring channel nut for 41×41',
  'компл', R(2 * (316 - 10)), K_MID, 'між модулями на рейці'),
 ('lz', 'Притиск крайній Z33 Al + болт M8×25 DIN 912 A2 + гайка M8 з пружиною в паз 41×41', 'End clamp Z33 Al + bolt M8×25 DIN 912 A2 + M8 spring channel nut for 41×41', 'компл', R(4 * 10), K_Z33, 'на кінцях рядів'),
]
# ---------- АБК (частина 1): abk_bom.json, запас уже є
AB = {x['key']: x for x in json.load(open(A / 'abk' / 'abk_bom.json', encoding='utf-8'))['items']}
q = lambda key: AB[key]['q']
ABK = [
 ('aslv', ROOF[0][1], ROOF[0][2], 'шт', q('slv'), SLV, 'дах «лага 0°»'),
 ('ab60', ROOF[1][1], ROOF[1][2], 'компл', q('b60'), K_M10_60, '2 на гільзу'),
 ('arod', ROOF[2][1], ROOF[2][2], 'шт', q('rod'), ROD_M * 1.299, 'між модулями і через прохід'),
 ('anr', ROOF[4][1], ROOF[4][2], 'шт', q('nr'), NUT10, '2 на шпильку'),
 ('anl', ROOF[5][1], ROOF[5][2], 'шт', q('nl'), NUT10, '1 на шпильку'),
 ('ab70', ROOF[6][1], ROOF[6][2], 'компл', q('b70'), K_M10_70a, ''),
 ('ab60a', ROOF[7][1], ROOF[7][2], 'компл', q('b60a'), K_M10_60a, ''),
 ('acm', ROOF[8][1], ROOF[8][2], 'компл', q('cm'), K_MID, ''),
 ('acz', ROOF[9][1], ROOF[9][2], 'компл', q('cz'), K_Z33, 'дах «лага 0°»: крайні лаги і профілі'),
 ('ace', 'Притиск крайній Al під раму 33 мм + болт M8 DIN 912 A2 + гайка M8 з пружиною в паз 41×41', 'End clamp Al for 33 mm frame + bolt M8 DIN 912 A2 + M8 spring channel nut for 41×41', 'компл', q('dce') + q('sce'), K_Z33, '«домік» і трикутники 15°, 4 на модуль'),
 ('ace80', 'Притиск крайній Al 6005-T6, 80 мм, під раму 33 мм + болт M8 + гайка з пружиною (стіни)', 'End clamp Al 6005-T6, 80 mm, for 33 mm frame + M8 bolt + spring nut (walls)', 'компл', q('wce'), K_Z33, 'стіни АБК'),
 ('acm80', 'Притиск середній Al 6005-T6, 80 мм + болт M8 + гайка з пружиною (стіни)', 'Mid clamp Al 6005-T6, 80 mm + M8 bolt + spring nut (walls)', 'компл', q('wcm'), K_MID, 'між модулями групи на стіні'),
 ('ab8', ROOF[10][1], ROOF[10][2], 'компл', q('b8') + q('db8') + q('sb8'), K_B8, '1 на блок'),
 ('adb', 'Болт M10 опори «доміка» (2 × M10×100, M10×140, M10×65, M10×60) + шайба + фланцева гайка', 'Bolt M10 for "dome" support (2× M10×100, M10×140, M10×65, M10×60) + washer + flange nut',
  'компл', q('db'), (2 * m933(10, 100) + m933(10, 140) + m933(10, 65) + m933(10, 60)) / 5 + W125_10 + 0.014, '5 на опору'),
 ('asb', 'Болти трикутника 15°: M10×60 (3) і M10×20 (3) + шайби + фланцеві гайки', 'Triangle 15° bolts: M10×60 (3) and M10×20 (3) + washers + flange nuts', 'компл', q('sb'), (m933(10, 60) + m933(10, 20)) / 2 + W125_10 + 0.014, '6 на трикутник'),
 ('adg', 'Болт M10×20 + фланцева гайка (діагоналі 41×41)', 'Bolt M10×20 + flange nut (41×41 diagonals)', 'компл', 2 * (q('ddg') + q('sdg')), m933(10, 20) + 0.014, '2 на діагональ'),
 ('awb', 'Болт M10×35 + гайка + 2 шайби (кронштейн стіни до рейки)', 'Bolt M10×35 + nut + 2 washers (wall bracket to rail)', 'компл', q('wbrk'), m933(10, 35) + NUT10 + 2 * W125_10, 'стіни АБК'),
 ('arope', 'Трос безпеки Ø3 AISI 316 у ПВХ ≈0,6 м з коушем, 2 втулками, гайкою-вушком M8 і болтом', 'Safety rope Ø3 AISI 316 PVC ≈0.6 m with thimble, 2 ferrules, eye nut M8 and bolt', 'компл', q('wrope'), None, '1 на модуль стіни'),
]
# ---------- лотки і щити PV: опори на блоках і рами щитів (ep04/final.json)
F = json.load(open(C / 'ep04' / 'final.json')); MNT = {int(kk): v for kk, v in F['mnt'].items()}
rws = F['rows']; Y1_, Y2_ = 31.34, 62.70
sup = {st: round(MNT[st].get('blk', 0) * 0.77) for st in (1, 2)}
box_blk2 = len([r for r in rws if r['st'] == 2 and r['z'] == 'roof' and (abs(r['Y'] - Y1_) < 1e-6 or abs(r['Y'] - Y2_) < 1e-6)])
assert (sup[1], sup[2], box_blk2) == (114, 202, 17), (sup, box_blk2)
TR = {1: [('tb', 'Болт M8×20 DIN 933 + шайба DIN 9021 M8 (траверса або рама щита до муфти блока)', 'Bolt M8×20 DIN 933 + washer DIN 9021 M8 (cross-bar or box frame to block coupling nut)', 'компл',
           R(sup[1] + 16 + 10) + q('trb'), K_B8, 'опори лотків на блоках, рами щитів ліхтарів, лоток ліній АБК, дах АБК'),
          ('tn', 'Болт M8×20 + гайка M8 з пружиною + шайба (лоток до траверси)', 'Bolt M8×20 + M8 spring channel nut + washer (tray to cross-bar)', 'компл', R(2 * (sup[1] + 10)) + q('trn'), m933(8, 20) + SNUT + W125_8, '2 на опору'),
          ('tp', 'Кріплення лотка до профнастилу складу (сідло з саморізами)', 'Tray fixing to trapezoidal sheet (saddle with self-drilling screws)', 'компл', R(111), None, 'через 1,5 м')],
      2: [('tb', None, None, 'компл', R(sup[2] + 4 * box_blk2), K_B8, 'опори лотків на блоках, рами щитів у проходах'),
          ('tn', None, None, 'компл', R(2 * sup[2]), m933(8, 20) + SNUT + W125_8, '2 на опору')]}
BZ = {1: q('bws'), 2: R(3790 * k)}

# ---------- зведення: групи і рядки (частина 1, частина 2)
G = []
def grp(uk, en, lines): G.append(dict(uk=uk, en=en, lines=lines))
L = lambda key, uk, en, u, q1, q2, mu, note: dict(key=key, uk=uk, en=en, u=u, q1=q1, q2=q2, mu=mu, note=note)
grp('Дах цеху — лаги на баласті, шпилькова тяга', 'Workshop roof — rails on ballast, threaded-rod ties', [L(kk, uk, en, u, 0, qq, mu, nt) for kk, uk, en, u, qq, mu, nt in ROOF])
grp('Склад — профнастил, міні-рейки', 'Warehouse — trapezoidal sheet, mini rails', [L(kk, uk, en, u, qq, 0, mu, nt) for kk, uk, en, u, qq, mu, nt in WHS])
grp('Фасади і козирок 25°', 'Facades and 25° canopy', [L(kk, uk, en, u, qq, 0, mu, nt) for kk, uk, en, u, qq, mu, nt in FAC])
grp('Ліхтарі цеху', 'Workshop roof lanterns', [L(kk, uk, en, u, qq, 0, mu, nt) for kk, uk, en, u, qq, mu, nt in LAN])
grp('АБК', 'Administrative building', [L(kk, uk, en, u, qq, 0, mu, nt) for kk, uk, en, u, qq, mu, nt in ABK])
t1 = {x[0]: x for x in TR[1]}; t2 = {x[0]: x for x in TR[2]}
grp('Лотки і рами щитів PV', 'Cable trays and PV box frames', [
    L('tb', t1['tb'][1], t1['tb'][2], 'компл', t1['tb'][4], t2['tb'][4], K_B8, '1 на блок'),
    L('tn', t1['tn'][1], t1['tn'][2], 'компл', t1['tn'][4], t2['tn'][4], t1['tn'][5], '2 на опору'),
    L('tp', t1['tp'][1], t1['tp'][2], 'компл', t1['tp'][4], 0, None, 'склад, через 1,5 м')])
grp('Блискавкозахист', 'Lightning protection', [L('bws', 'Шайба контактна зубчаста M10 під болти гільз', 'Serrated contact washer M10 under sleeve bolts', 'шт', BZ[1], BZ[2], None, '2 на гільзу')])
for g in G:
    for x in g['lines']:
        x['q'] = x['q1'] + x['q2']; x['kg'] = None if x['mu'] is None else x['mu'] * x['q']
g3 = lambda v: f'{v:,}'.replace(',', '\u00a0')
HOLD = [
 ('Анкер M10 кронштейна фасаду (клиновий або хімічний) + шайба DIN 125 + гайка', f"{g3(R(4 * NV))} шт", 'тип — після випробувань на вирив, не менше 5 на фасад (ФБС чи залізобетон)'),
 ('Анкер M12 хімічний (шпилька 8.8) пластин козирка + шайба + гайка', f"{g3(R(8 * NC))} шт", 'після тих самих випробувань'),
 ('Анкер M10 кронштейнів стін АБК', f"{g3(q('wbrk'))} шт", 'тип — за матеріалом стіни'),
 ('Кронштейни лотків з анкерами — парапет, фасади, стіни', f"{g3(313 + 103 + 22 + q('trw'))} / 65 шт (частина 1 / 2)", 'анкер — за матеріалом парапету і стін'),
 ('Кронштейн рейки до каркаса ліхтаря з болтами', f"{g3(up(868 * 1.03))} шт", 'на що спирати рейку — не вирішено (полікарбонат не несучий)'),
 ('Кріплення 12 мережевих інверторів', '12 компл.', 'місце і спосіб (стіна ТП чи стійка) не визначені'),
 ('Анкери від сповзання на даху АБК', f"{g3(q('anc'))} шт", 'на даху цеху анкерів немає (рішення власника 05.11); для АБК — після обстеження покрівлі'),
]
NOT = ['Муфта M8×30 DIN 6334, болт M8×35 і шайба DIN 9021 у баластних блоках — у складі блоків, Україна.',
       'Троси повітряних переходів склад і АБК → цех з талрепами M10 і затискачами — Україна.',
       'Затискачі блискавкозахисту EN 62561-1 — Україна.',
       "Метизи з'єднувачів і фасонних частин лотків — у комплекті з лотками; метизи рам щитів PV — у комплекті щитів."]
CLAR = ['Покриття сталевих метизів: гаряче цинкування чи гальванічний цинк — пропозиція постачальника для зовнішнього монтажу на 25 років.',
        'Клас міцності: болти DIN 933 — 8.8, гайки DIN 934 — 8 (для фасадів і козирка — обов\'язково); шпильки M10 — не нижче 4.8.',
        'Гільза з муфтою: муфта 50 мм, половина гільз — з лівою різьбою (мітка фарбою); цинк після зварювання.',
        'Гайка з пружиною — під паз профілю 41×41 постачальника лаг; гарантоване навантаження на гайку.',
        'Притиски — під раму 33 мм модуля ZNSHINE ZXN8-BD132-730, Al 6005-T6, довжина ≥ 60 мм, заходження на раму 8–12 мм.']
TOT = dict(q1=sum(x['q1'] for g in G for x in g['lines']), q2=sum(x['q2'] for g in G for x in g['lines']),
           kg1=sum(x['mu'] * x['q1'] for g in G for x in g['lines'] if x['mu']), kg2=sum(x['mu'] * x['q2'] for g in G for x in g['lines'] if x['mu']))
OUT = dict(groups=G, hold=HOLD, ne=NOT, clar=CLAR, tot=TOT, wh_north=dict(rails=nr_, p33=nP_, z33=nZ_, chains=sorted(ch)), roof_rod_pm=rod_pm)
json.dump(OUT, open(H / 'metyzy.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
if __name__ == '__main__':
    n = 0
    for g in G:
        print('==', g['uk'])
        for x in g['lines']:
            n += 1; print(f"{n:3} {x['uk'][:70]:70} {x['u']:6} {x['q1']:6} {x['q2']:6} {x['q']:6} {'' if x['kg'] is None else round(x['kg'], 1)}")
    print(TOT)
