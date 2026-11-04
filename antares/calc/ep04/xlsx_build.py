# -*- coding: utf-8 -*-
"""Кошторис і специфікація СЕС і УЗЕ Антарес по етапах (04.11.2026) — Excel з формулами."""
import json, math, collections, openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment
BM = json.load(open('bom.json')); F = json.load(open('final.json')); W = json.load(open('wind.json')); W2 = json.load(open('wind2.json')); RB2 = W2['res']['з бортиками по краю поля']; RN2 = W2['res']['без бортиків']
OUT = '/mnt/user-data/outputs/Кошторис_і_специфікація_СЕС_і_УЗЕ_Антарес_по_етапах_04.11.2026.xlsx'
AR = 'Arial'; BLUE = Font(name=AR, size=9, color='0000FF'); BLK = Font(name=AR, size=9); GRN = Font(name=AR, size=9, color='008000'); BB = Font(name=AR, size=9, bold=True)
H1 = Font(name=AR, size=12, bold=True); SUB = Font(name=AR, size=8, color='5B6770'); HDR = PatternFill('solid', fgColor='E6EBF0'); SEC = PatternFill('solid', fgColor='F3F5F7'); YEL = PatternFill('solid', fgColor='FFFF00')
thin = Side(style='thin', color='C4CCD3'); BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
USD = '#,##0;(#,##0);-'; USD2 = '#,##0.00;(#,##0.00);-'; QTY = '#,##0.##;(#,##0.##);-'; PCT = '0.0%'
wb = openpyxl.Workbook()
# ---------------- Параметри
P = wb.active; P.title = 'Параметри'
P['A1'] = 'Параметри кошторису по етапах — 04.11.2026'; P['A1'].font = H1
P['A2'] = 'Синій — вихідні дані (можна змінювати), чорний — формули, зелений — посилання на інший аркуш, жовте тло — оцінка, яку треба підтвердити. $ без ПДВ.'; P['A2'].font = SUB
for c, h_ in zip('ABCD', ('Параметр', 'Значення', 'Од.', 'Джерело')): P[f'{c}4'] = h_; P[f'{c}4'].font = BB; P[f'{c}4'].fill = HDR
PR = [('COM', 'Наша комісія від закупівлі в Китаї', 0.05, '', 'договір комісії, КП ES-261026-01', PCT, 0),
      ('MOD', 'Фотомодуль ZNSHINE ZXN8-BD132-730, FOB', 73, '$', 'КП 26.10', USD, 0),
      ('SPARE', 'Запас модулів', 0.02, '', 'КП 26.10', PCT, 0),
      ('GOLEN', 'Контейнер Golen LES-H20-1205W500C-PS, FOB', 190000, '$', 'КП ES-261026-01', USD, 0),
      ('DG', 'Доставка контейнера УЗЕ до об’єкта', 15000, '$', 'рішення власника 26.10', USD, 0),
      ('D40', "Доставка 40'HQ Шанхай → об'єкт", 7000, '$', 'кошторис 26.10', USD, 0),
      ('MPC', "Модулів у 40'HQ", 594, 'шт', 'паспорт ZNSHINE', QTY, 0),
      ('INS', 'Страхування вантажу (крім УЗЕ)', 0.003, '', 'кошторис 26.10', PCT, 0),
      ('BRK', 'Митний брокер, декларації (на поставку)', 240, '$', 'кошторис 26.10', USD, 0),
      ('BLK', 'Баластний блок з муфтою і матом', 3, '$', 'рішення власника 26.10', USD2, 0),
      ('BLKD', 'Доставка блока на об’єкт', 0.34, '$', 'кошторис 26.10 (2 228 $ на 6 583 блоки)', USD2, 0),
      ('WRK', 'Роботи: встановлення і наладка СЕС, електромонтаж DC і AC', 50, '$/кВтп', 'рішення власника 26.10', USD, 0),
      ('PW', 'Потужність модуля', 0.73, 'кВтп', '730 Вт', '0.00', 0),
      ('MECH', 'Механізація (автокран) на модуль даху / ліхтаря / складу', 1.46, '$', 'кошторис 27.10, поз. 5.2', USD2, 0),
      ('CONS', 'Витратні матеріали на модуль', 1.22, '$', 'кошторис 27.10, поз. 5.8', USD2, 0),
      ('LIFT', 'Автовишка ≥ 18 м на весь монтаж фасадів', 6000, '$', 'оцінка — підтвердити', USD, 1),
      ('EMS', "EMS об'єкта (E-Systems)", 25000, '$', 'рішення власника', USD, 0),
      ('RES', 'Запас, від собівартості', 0.04, '', 'рішення власника 26.10', PCT, 0),
      ('GEN', 'Винагорода генпідрядника, від собівартості (без запасу)', 0.18, '', 'рішення власника 26.10', PCT, 0),
      ('VAT', 'ПДВ', 0.2, '', 'ПКУ', PCT, 0),
      ('RATE', 'Ставка робіт для довідки (люд.год)', 15.59, '$', '700 грн/люд.год', USD2, 0)]
ROW = {}
for i, (k, nm, v, u, src, fmt, est) in enumerate(PR):
    r = 5 + i; ROW[k] = r
    P[f'A{r}'] = nm; P[f'B{r}'] = v; P[f'C{r}'] = u; P[f'D{r}'] = src
    P[f'A{r}'].font = BLK; P[f'B{r}'].font = BLUE; P[f'B{r}'].number_format = fmt; P[f'D{r}'].font = SUB
    if est: P[f'B{r}'].fill = YEL
    for c in 'ABCD': P[f'{c}{r}'].border = BOX
for c, w in zip('ABCD', (58, 14, 8, 56)): P.column_dimensions[c].width = w
p = lambda k: f"Параметри!$B${ROW[k]}"
items = BM['items']
def find(st, pref): return [x for x in items[str(st)] if x['name'].startswith(pref)]
# ---------------- аркуш етапу
def stage_sheet(title, st, spec):
    S = wb.create_sheet(title)
    S['A1'] = spec['h1']; S['A1'].font = H1; S['A2'] = spec['h2']; S['A2'].font = SUB
    hd = ('№', 'Позиція', 'Од.', 'К-сть', 'Ціна, $', 'Мито', 'Сума, $', 'Люд.год', 'Підстава / примітка')
    for c, t in zip('ABCDEFGHI', hd): S[f'{c}4'] = t; S[f'{c}4'].font = BB; S[f'{c}4'].fill = HDR; S[f'{c}4'].alignment = Alignment(wrap_text=True, vertical='top')
    r = [5]; marks = {}
    def sec(t):
        S[f'A{r[0]}'] = t; S[f'A{r[0]}'].font = BB
        for c in 'ABCDEFGHI': S[f'{c}{r[0]}'].fill = SEC
        r[0] += 1
    def item(no, nm, u, q, pr, duty=None, hrs=None, src='', qf=BLUE, pf=BLUE, gsum=None, est=False):
        rr = r[0]; S[f'A{rr}'] = no; S[f'B{rr}'] = nm; S[f'C{rr}'] = u; S[f'D{rr}'] = q; S[f'E{rr}'] = pr; S[f'I{rr}'] = src
        if duty is not None: S[f'F{rr}'] = duty; S[f'F{rr}'].number_format = PCT; S[f'F{rr}'].font = BLUE
        S[f'G{rr}'] = gsum if gsum else f'=D{rr}*E{rr}'
        if hrs is not None: S[f'H{rr}'] = hrs; S[f'H{rr}'].number_format = '#,##0.0;;-'; S[f'H{rr}'].font = BLUE
        S[f'D{rr}'].font = qf; S[f'E{rr}'].font = pf; S[f'D{rr}'].number_format = QTY; S[f'E{rr}'].number_format = USD2; S[f'G{rr}'].number_format = USD
        for c in 'ABCI': S[f'{c}{rr}'].font = BLK if c != 'I' else SUB
        S[f'B{rr}'].alignment = Alignment(wrap_text=True, vertical='top'); S[f'I{rr}'].alignment = Alignment(wrap_text=True, vertical='top')
        if est: S[f'E{rr}'].fill = YEL
        for c in 'ABCDEFGHI': S[f'{c}{rr}'].border = BOX
        r[0] += 1; return rr
    def total(nm, rows, key):
        rr = r[0]; S[f'B{rr}'] = nm; S[f'B{rr}'].font = BB; S[f'G{rr}'] = '=' + '+'.join(f'G{x}' for x in rows) if rows else '=0'; S[f'G{rr}'].font = BB; S[f'G{rr}'].number_format = USD
        S[f'H{rr}'] = '=' + '+'.join(f'H{x}' for x in rows) if rows else '=0'; S[f'H{rr}'].number_format = '#,##0;;-'; S[f'H{rr}'].font = BB
        marks[key] = rr; r[0] += 2; return rr
    # 1. Китай
    sec('1. Закупівля в Китаї, FOB'); c1 = []; golen = mods = None
    for it in spec['cn']:
        rr = item(*it['a'], **it.get('k', {})); c1.append(rr)
        if it.get('tag') == 'golen': golen = rr
        if it.get('tag') == 'mods': mods = rr
    T1 = total('Разом закупівля в Китаї', c1, 'T1')
    sec('2. Наша комісія — супровід замовлення за договором комісії')
    b1 = item('2.1', 'Комісія від закупівлі в Китаї', '', f"={p('COM')}", None, None, None, '5 %: 70 % одразу, 30 % після прибуття', qf=GRN, gsum=f"=G{T1}*{p('COM')}"); S[f'D{b1}'].number_format = PCT
    T2 = total('Разом комісія', [b1], 'T2')
    sec("3. Доставка до об'єкта, страхування, митне оформлення, мито"); c3 = []
    nonbess = [x for x in c1 if x not in (golen, mods)]
    if spec['nG']: c3.append(item('3.1', 'Контейнери УЗЕ Golen: море, авто, страхування, митне оформлення', 'конт.', spec['nG'], f"={p('DG')}", src='по 15 000 $', pf=GRN))
    c3.append(item('3.2', "Контейнери 40'HQ з модулями", 'конт.', f"=ROUNDUP(D{mods}/{p('MPC')},0)", f"={p('D40')}", src="модулі по 594 у 40'HQ", qf=BLK, pf=GRN))
    c40 = item('3.3', "Контейнери 40'HQ з кріпленням, кабелями, щитами, лотками", 'конт.', spec['c40'], f"={p('D40')}", src=spec['c40src'], pf=GRN); c3.append(c40)
    ins = item('3.4', 'Страхування вантажу, крім УЗЕ', '', f"={p('INS')}", None, gsum=f"=(G{T1}-{('G' + str(golen)) if golen else '0'})*{p('INS')}", src='від вартості товару', qf=GRN); S[f'D{ins}'].number_format = PCT; c3.append(ins)
    c3.append(item('3.5', 'Митний брокер, декларації', 'компл', 1, f"={p('BRK')}", src='', pf=GRN))
    dsum = '+'.join(f'G{x}' for x in nonbess); dsp = '+'.join(f'G{x}*F{x}' for x in nonbess)
    c3.append(item('3.6', 'Мито на товари, крім модулів і УЗЕ (пільга «245»)', '', None, None, gsum=f"=({dsp})*(1+(D{c40}*E{c40}+({dsum})*{p('INS')})/({dsum}))", src='ставки за кодами УКТ ЗЕД; база — митна вартість з доставкою'))
    T3 = total('Разом доставка і мито', c3, 'T3')
    sec('4. Купуємо в Україні'); c4 = [item(*it['a'], **it.get('k', {})) for it in spec['ua']]
    T4 = total('Разом купуємо в Україні', c4, 'T4')
    sec('5. Роботи, фундаменти, EMS'); c5 = [item(*it['a'], **it.get('k', {})) for it in spec['wk']]
    T5 = total('Разом роботи, фундаменти, EMS', c5, 'T5')
    TS = r[0]; S[f'B{TS}'] = 'СОБІВАРТІСТЬ (розділи 1–5)'; S[f'G{TS}'] = f'=G{T1}+G{T2}+G{T3}+G{T4}+G{T5}'; S[f'H{TS}'] = f'=H{T1}+H{T3}+H{T4}+H{T5}'
    for c in 'BGH': S[f'{c}{TS}'].font = BB
    S[f'G{TS}'].number_format = USD; S[f'H{TS}'].number_format = '#,##0'; r[0] += 2
    sec('6. Запас і винагорода генпідрядника')
    f1 = item('6.1', 'Запас', '', f"={p('RES')}", None, gsum=f"=G{TS}*{p('RES')}", src='4 % від собівартості', qf=GRN); S[f'D{f1}'].number_format = PCT
    f2 = item('6.2', 'Винагорода генпідрядника', '', f"={p('GEN')}", None, gsum=f"=G{TS}*{p('GEN')}", src='18 % від собівартості, без запасу', qf=GRN); S[f'D{f2}'].number_format = PCT
    r[0] += 1
    def line(nm, gsum, bold=True):
        rr = r[0]; S[f'B{rr}'] = nm; S[f'G{rr}'] = gsum; S[f'G{rr}'].number_format = USD
        for c in 'BG': S[f'{c}{rr}'].font = BB if bold else BLK
        r[0] += 1; return rr
    TT = line(spec['tt'], f'=G{TS}+G{f1}+G{f2}')
    extra = []
    for nm, val, v245 in spec.get('lumps', []):
        rr = item('', nm, 'компл', 1, val, src='під ключ — з власним запасом і винагородою; ПДВ — нижче', pf=BLUE); extra.append((rr, v245))
    TA = line('РАЗОМ ПІД КЛЮЧ, $ без ПДВ', '=' + '+'.join([f'G{TT}'] + [f'G{x}' for x, _ in extra]))
    TV = line('ПДВ 20 % на всю суму', f"=G{TA}*{p('VAT')}", False)
    TTV = line('РАЗОМ ПІД КЛЮЧ, $ з ПДВ', f'=G{TA}+G{TV}')
    r[0] += 1
    gx = f'-G{golen}' if golen else ''
    TV2 = line('ПДВ 20 %, якщо модулі й накопичувачі ввозяться на замовника за пільгою «245»', f"=(G{TT}{gx}-G{mods})*{p('VAT')}" + ''.join(f'+{v}' for _, v in extra), False)
    TT2 = line('РАЗОМ ПІД КЛЮЧ, $ з ПДВ (з пільгою «245»)', f'=G{TA}+G{TV2}')
    KW = line('Потужність СЕС етапу, кВтп', spec['kwp'], False); S[f'G{KW}'].number_format = '#,##0.0'
    PK = line('На 1 кВтп СЕС, $ без ПДВ (з УЗЕ, якщо є)', f'=G{TA}/G{KW}', False)
    r[0] += 1
    for nm, val, note in spec.get('opts', []):
        rr = r[0]; S[f'B{rr}'] = nm; S[f'G{rr}'] = val; S[f'G{rr}'].number_format = USD; S[f'G{rr}'].font = BLUE; S[f'I{rr}'] = note; S[f'I{rr}'].font = SUB; S[f'B{rr}'].font = BLK
        S[f'B{rr}'].alignment = Alignment(wrap_text=True, vertical='top'); S[f'I{rr}'].alignment = Alignment(wrap_text=True, vertical='top'); r[0] += 1
    r[0] += 1
    for t in spec['notes']:
        S[f'B{r[0]}'] = t; S[f'B{r[0]}'].font = SUB; S[f'B{r[0]}'].alignment = Alignment(wrap_text=True, vertical='top'); S.merge_cells(f'B{r[0]}:I{r[0]}'); S.row_dimensions[r[0]].height = 26; r[0] += 1
    for c, w in zip('ABCDEFGHI', (6, 58, 8, 10, 11, 7, 12, 9, 46)): S.column_dimensions[c].width = w
    S.freeze_panes = 'A5'; S.sheet_view.zoomScale = 100
    return dict(S=S, TA=TA, TT=TT, TTV=TTV, TT2=TT2, KW=KW, TS=TS, T1=T1, T3=T3, T4=T4, T5=T5, golen=golen, mods=mods)
def I(no, nm, u, q, pr, duty=None, hrs=None, src='', est=False, tag=None, qf=BLUE, pf=BLUE):
    return dict(a=(no, nm, u, q, pr, duty, hrs, src), k=dict(est=est, qf=qf, pf=pf), tag=tag)
rows1 = [r for r in F['rows'] if r['st'] == 1]; rows2 = [r for r in F['rows'] if r['st'] == 2]
def lines_items(st, base_no, rows):
    al = collections.Counter(); n = collections.Counter()
    for r_ in rows: al[r_['S']] += 2 * r_['L']; n[r_['S']] += 1
    out = []; k = 0
    for S_, L in sorted(al.items()):
        k += 1; out.append(I(f'{base_no}.{k}', f'Кабель Al 1×{S_} мм², 0,6/1 кВ (АВВГ / NA2XY), +3 % на розкрій', 'м', round(L * 1.03), {120: 2.04, 185: 3.12, 240: 4.07}[S_], 0.07, round(L * 1.03 * 0.0409, 1), f'{n[S_]} ліній; переріз — мінімум «кабель + втрати за 25 р.», du ≤ 2,5 %'))
        k += 1; out.append(I(f'{base_no}.{k}', f'Наконечник Al/Cu DTL-2-{S_}', 'шт', 4 * n[S_], {120: 1.54, 185: 2.04, 240: 2.54}[S_], 0, round(4 * n[S_] * 0.46, 1), '2 жили × 2 кінці'))
    k += 1; out.append(I(f'{base_no}.{k}', 'Кабель Cu 1×50 ШВ → вхід DC/DC (2 × 6 м на лінію), наконечники ТМЛ 50, термоусадка', 'лінія', len(rows), 12 * 7.96 + 4 * 0.51 + 4 * 0.05, 0.07, len(rows) * 1.0, 'кошторис 26.10'))
    return out
def tray_items(st, base_no):
    out = []; k = 0
    for w, L in sorted(F['T'][str(st)].items()):
        k += 1; out.append(I(f'{base_no}.{k}', f'Лоток перфорований {w} з кришкою, оцинкований, + фасонні, з’єднувачі, траверси, фіксатори (×1,53 до ціни лотка)', 'м', round(L * 1.05, 1), round({'100×50': 3.66, '200×50': 5.52, '300×100': 9.99, '400×100': 13.40}[w] * 1.53, 2), 0.001, round(L * 1.05 * 0.209, 1), 'довжина — за трасами розрахунку 04.11'))
    return out
def cn_from(st, grp, base_no, duty):
    out = []
    for k, x in enumerate([x for x in items[str(st)] if x['grp'] == grp and x['src'] == 'cn' and x['p']], 1):
        out.append(I(f'{base_no}.{k}', x['name'], x['unit'], round(x['q'], 1), x['p'], duty, round(x['h'], 1), x['note'] or 'кошторис 26.10 / розрахунок 04.11', est='оцінка' in x['name']))
    return out
def ua_from(st, grp, prefix=None):
    return [x for x in items[str(st)] if x['grp'] == grp and x['src'] == 'ua' and (prefix is None or x['name'].startswith(prefix))]
# ---------- Етап 1
nb1 = len(rows1); blk1 = sum(x['q'] for x in items['1'] if 'Блок' in x['name'])
cn1 = [I('1.1', 'Накопичувач Golen LES-H20-1205W500C-PS: 1 205 кВт·год, PCS 500 кВт, 12 входів DC/DC по 60 кВт', 'шт', 4, f"={p('GOLEN')}", 0, None, 'по 2 на ТП: К-3, К-1 — ТП-5913; К-4, К-5 — ТП-6923; пільга «245»', tag='golen', pf=GRN),
       I('1.2', 'Фотомодулі ZNSHINE ZXN8-BD132-730 з виводами 1,2–1,4 м: фасади 429, ліхтарі 316, склад 176 (+2 %)', 'шт', f"=ROUNDUP(921*(1+{p('SPARE')}),0)", f"={p('MOD')}", 0, None, 'КП 26.10; пільга «245»', tag='mods', qf=BLK, pf=GRN)]
cn1 += cn_from(1, 'Кріплення · фасади', '1.3', 0.008) + cn_from(1, 'Кріплення · ліхтарі', '1.4', 0.008)
cn1 += [I('1.5', 'Кріплення складу: міні-рейки, притиски, метизи на профнастилі', 'модуль', 176, round(21500 / 1925, 2), 0.008, 70.4, 'КП 26.10, на модуль'),
        I('1.6', 'Кабелі DC 1×6, MC4, металорукав, втулки, стяжки, бирки — на стрінг', 'стрінг', 83, 60, 0.067, round(83 * (46.6 * 0.0182 + 3.6 * 0.19 + 0.2), 1), 'КП 26.10: 60 $ на стрінг; стрінгів: фасади 39, склад 16, ліхтарі 28 (по схилах)'),
        I('1.7', 'Перемички 1×6 між сусідніми ліхтарями (4 стрінги з залишків схилів)', 'м', 144, 0.68, 0.067, 2.6, 'Л1+Л2, Л3+Л4, схід і захід'),
        I('1.8', 'Щит PV 7/1 у зборі: IP66, gPV, ПЗІП T1+T2 (F1), роз’єднувач, контроль струму, рама, козирок', 'шт', nb1 + 1, 437, 0.052, (nb1 + 1) * 9.0, f'фасади 7, склад 3, ліхтарі 4 + 1 запасний; КП 26.10: 420 + рама 17'),
        I('1.9', 'Шафа вводу ШВ біля контейнера: перехід Al/Cu, шини, PE, стійка — на 12 входів', 'шт', 4, 220, 0.052, 32.0, 'КП 26.10: ШВ 200 + стійка 20'),
        I('1.10', 'Кабель RS485 2×2×0,75 в екрані уздовж ліній; PE щитів Cu 1×16', 'компл', 1, round(sum(x['cost'] for x in items['1'] if x['grp'] == 'Щити PV' and ('RS485' in x['name'] or 'PE щита' in x['name'])) / 1.2, 2), 0.07, 30.0, 'розрахунок 04.11')]
cn1 += lines_items(1, '1.11', rows1) + tray_items(1, '1.12')
cn1 += [I('1.13', 'Кронштейни лотка на фасаді і на стіні над ТП-6923 з анкерами, через 1 м', 'шт', round((96.64 - 17.4) + 52 + 26), 3.09, 0.0, 59.6, 'кошторис 26.10')]
cn1 += cn_from(1, 'Блискавкозахист', '1.14', 0.05)
cn1 += [I('1.15', "Підключення УЗЕ: шафа ЩР-УЗЕ(AC), наконечники AC, заземлення, зв'язок — на контейнер", 'шт', 4, round(4100 / 3, 2), 0.05, None, 'КП 26.10, на контейнер')]
cu5913 = (2536.38 * 21.75 + 845.46 * 17.22) * 2 / 3
ua1 = [I('4.1', 'Баластний блок з муфтою і матом — опори лотків на даху і рами щитів ліхтарів', 'шт', round(blk1), f"={p('BLK')}", None, round(blk1 * 0.0396, 1), '0,77 блока на 1 м лотка + 4 на щит', pf=GRN),
       I('4.2', 'Доставка блоків на об’єкт', 'шт', round(blk1), f"={p('BLKD')}", None, None, '', pf=GRN),
       I('4.3', 'Кабель ВВГнг 1×120 мм², мідь — AC К-3, К-1 → ТП-5913 (6 жил на фазу)', 'м', round(2536.38 * 2 / 3, 1), 21.75, None, round(138.3 * 2 / 3, 1), 'Том 8, на 2 контейнери біля ТП-5913'),
       I('4.4', 'Кабель ВВГнг 1×95 мм², мідь — N і PE, К-3, К-1', 'м', round(845.46 * 2 / 3, 1), 17.22, None, round(46.1 * 2 / 3, 1), 'Том 8'),
       I('4.5', 'Кабель ВВГнг 1×120 мм², мідь — AC К-4, К-5 → ТП-6923 (траса ≈20 м + 10 %)', 'м', 2 * 18 * 22, 21.75, None, 2 * 18 * 22 * 0.06, 'оцінка траси: де в ТП-6923 щит 0,4 кВ — уточнити', est=True),
       I('4.6', 'Кабель ВВГнг 1×95 мм², мідь — N і PE, К-4, К-5', 'м', 2 * 6 * 22, 17.22, None, 2 * 6 * 22 * 0.06, 'те саме', est=True)]
for k, x in enumerate(ua_from(1, 'Блискавкозахист'), 7):
    if x['p']: ua1.append(I(f'4.{k}', x['name'], x['unit'], x['q'], x['p'], None, round(x['h'], 1), 'Україна'))
ua1.append(I('4.20', 'Місток лотка над приямком ТП-6923 на берму, стійки на бермі', 'компл', 1, 250, None, 12.0, 'оцінка', est=True))
wk1 = [I('5.1', 'Встановлення і наладка СЕС, електромонтаж DC і AC (фасади, ліхтарі, склад)', 'кВтп', f"=921*{p('PW')}", f"={p('WRK')}", None, round(sum(x['h'] for x in items['1']), 0), '50 $/кВтп; люд.год — довідково, за розрахунком 04.11', qf=BLK, pf=GRN),
       I('5.2', 'Механізація: автокран — ліхтарі і склад', 'модуль', 316 + 176, f"={p('MECH')}", pf=GRN),
       I('5.3', 'Механізація: автовишка ≥ 18 м на монтаж фасадів', 'компл', 1, f"={p('LIFT')}", src='оцінка', pf=GRN),
       I('5.4', 'Витратні матеріали, ЗІЗ, вивезення упаковки', 'модуль', 921, f"={p('CONS')}", pf=GRN),
       I('5.5', 'Фундаменти Фп-1 і майданчики обслуговування', 'шт', 4, round(10519 / 3, 2), src='Том 8; під К-4, К-5 на бермі — геодезія і рівень плит', ),
       I('5.6', 'Заземлення контейнерів: кільце 25×4, 4 стрижні, Cu 95 до фітингів', 'шт', 4, round(1497 / 3, 2), src='Том 8'),
       I('5.7', 'Кабельні траси на ділянці: ТП-5913 (2 контейнери)', 'компл', 1, round(5453 * 2 / 3, 2), src='Том 8'),
       I('5.8', 'Траси біля ТП-6923: по підпірній стінці і приямку, огородження краю берми 1,8 м', 'компл', 1, 1500, src='оцінка', est=True),
       I('5.9', 'Прохід кабелів крізь стіну ТП з ущільненням', 'шт', 2, 414, src='Том 8'),
       I('5.10', 'Встановлення контейнерів автокраном', 'шт', 4, round(1475 / 3, 2), src='Том 8; К-4, К-5 — подача на берму +1,8 м'),
       I('5.11', "EMS об'єкта (E-Systems)", 'компл', 1, f"={p('EMS')}", pf=GRN)]
hyb_245 = (49171 - 38000) * 0.2
S1 = stage_sheet('Етап 1', 1, dict(h1='Етап 1 — фасади, ліхтарі без демонтажу, склад, 4 контейнери Golen; АБК — окремими сумами', h2='$ без ПДВ. Синій — вихідні дані, чорний — формули, зелений — з аркуша «Параметри», жовте тло — оцінка. Кількості — розрахунок 04.11 за 3D-двійником.',
    cn=cn1, nG=4, c40=1, c40src='кріплення фасадів і ліхтарів, щити, лінії, лотки (≈8 т)', ua=ua1, wk=wk1, tt='РАЗОМ ЦЕХ (СЕС і 4 УЗЕ), $ без ПДВ',
    lumps=[('СЕС АБК 132 модулі, 96,4 кВтп, Deye 100 кВт — кошторис 28.10', 40981, 6225), ('Накопичувач АБК Golen LES-241L120-PS (120 кВт / 241 кВт·год) — оцінка до котирування', 49171, round(hyb_245))],
    kwp="=(921+132)*Параметри!$B$%d" % ROW['PW'],
    notes=['Модулі «на освітлення» (8 на ліхтарях) — у кількості модулів; світлодіодні світильники не входять.', 'Не входить: обстеження фасадів і випробування анкерів, обстеження каркаса ліхтарів, геодезія берми, перенесення шафи з пропаном, доплата за виводи модулів 1,2–1,4 м.']))
# ---------- Етап 2
nb2 = len(rows2); k2 = 1831 / 1749
blk_lag = round(4803.6 * k2) + round(856.5 * k2); blk_tr = sum(x['q'] for x in items['2'] if x['grp'] == 'Баласт · лотки і щити')
cn2 = [I('1.1', 'Фотомодулі ZNSHINE ZXN8-BD132-730 з виводами 1,2–1,4 м: дах В1 1 826 + 5 на освітлення (+2 %)', 'шт', f"=ROUNDUP(1831*(1+{p('SPARE')}),0)", f"={p('MOD')}", 0, None, 'КП 26.10; пільга «245»', tag='mods', qf=BLK, pf=GRN),
       I('1.2', 'Кріплення даху на лагах: лаги 41×41×1,5, гільзи з муфтами, шпильки M10 на кожному стику, крайні профілі, кутники, притиски, метизи — на модуль', 'модуль', 1831, round(21500 / 1925, 2), 0.008, round(sum(x['h'] for x in items['2'] if x['grp'] == 'Кріплення · дах В1'), 1), 'КП 26.10 на модуль; кількості позиціями — див. аркуш «Метал і баласт»'),
       I('1.3', 'Кабелі DC 1×6, MC4, металорукав, втулки, стяжки, бирки — на стрінг', 'стрінг', 166, 60, 0.067, round(166 * (46.6 * 0.0182 + 3.6 * 0.19 + 0.2), 1), 'КП 26.10: 60 $ на стрінг'),
       I('1.4', 'Щит PV 7/1 у зборі: IP66, gPV, ПЗІП T1+T2 (F1), роз’єднувач, контроль струму, рама 41×41 на 4 блоках, козирок', 'шт', nb2 + 1, 437, 0.052, (nb2 + 1) * 9.0, f'{nb2} + 1 запасний; КП 26.10'),
       I('1.5', 'Кабель RS485 2×2×0,75 в екрані уздовж ліній; PE щитів Cu 1×16', 'компл', 1, round(sum(x['cost'] for x in items['2'] if x['grp'] == 'Щити PV' and ('RS485' in x['name'] or 'PE щита' in x['name'])) / 1.2, 2), 0.07, 50.0, 'розрахунок 04.11')]
cn2 += lines_items(2, '1.6', rows2) + tray_items(2, '1.7') + cn_from(2, 'Блискавкозахист', '1.8', 0.05)
ua2 = [I('4.1', 'Баластний блок 300×300×60 з муфтою: під лаги і кінці лаг (з матом) і під крайні профілі', 'шт', blk_lag, f"={p('BLK')}", None, round(blk_lag * 0.0396, 1), 'кошторис 26.10 на модуль; ціна з матом — для всіх', pf=GRN),
       I('4.2', 'Баластний блок з муфтою і матом — опори лотків і рами щитів', 'шт', round(blk_tr), f"={p('BLK')}", None, round(blk_tr * 0.0396, 1), '0,77 на 1 м лотка + 4 на щит', pf=GRN),
       I('4.3', 'Доставка блоків на об’єкт', 'шт', blk_lag + round(blk_tr), f"={p('BLKD')}", pf=GRN),
       I('4.4', 'Анкер від сповзання вздовж ліхтарів (SikaRoof Anchor 250)', 'шт', 194, 44.99, None, 145.5, 'Том 3 КМ; варіант — зв’язки до каркаса ліхтарів (нижче)'),
       I('4.4a', f"Додаткові блоки з муфтою і матом — лише кути і смуги біля парапетів (зони F, G; з бортиками), {RB2['F']} + {RB2['G']}", 'шт', RB2['tot'], f"={p('BLK')}", None, round(RB2['tot'] * 0.0396, 1), 'попередній розрахунок на вітер 04.11; у середині поля — без змін', pf=GRN),
       I('4.4b', 'Доставка додаткових блоків', 'шт', RB2['tot'], f"={p('BLKD')}", pf=GRN),
       I('4.4c', 'Бортики по периметру поля: скіс на кінцях лаг, з зазорами для провітрювання, з кріпленням', 'м', round(W2['per_len']), 6.0, None, round(W2['per_len'] * 0.08, 1), 'оцінка ціни; зменшують відрив крайових модулів', est=True)]
for k, x in enumerate(ua_from(2, 'Блискавкозахист'), 5):
    if x['p']: ua2.append(I(f'4.{k}', x['name'], x['unit'], x['q'], x['p'], None, round(x['h'], 1), 'Україна'))
wk2 = [I('5.1', 'Встановлення і наладка СЕС, електромонтаж DC і AC (дах В1)', 'кВтп', f"=1831*{p('PW')}", f"={p('WRK')}", None, round(sum(x['h'] for x in items['2']), 0), '50 $/кВтп; люд.год — довідково', qf=BLK, pf=GRN),
       I('5.2', 'Механізація: автокран — модулі, лаги, блоки, лотки на дах', 'модуль', 1831, f"={p('MECH')}", pf=GRN),
       I('5.3', 'Витратні матеріали, ЗІЗ, вивезення упаковки', 'модуль', 1831, f"={p('CONS')}", pf=GRN)]
S2 = stage_sheet('Етап 2', 2, dict(h1='Етап 2 — дах цеху В1 на новій мембрані (1 831 модуль), підключення до К-3, К-1, К-4, К-5 етапу 1', h2='$ без ПДВ. Синій — вихідні дані, чорний — формули, зелений — з аркуша «Параметри», жовте тло — оцінка.',
    cn=cn2, nG=0, c40=2, c40src='лаги, гільзи, шпильки, притиски, щити, лінії, лотки (як у кошторисі 26.10)', ua=ua2, wk=wk2, tt='РАЗОМ ДАХ (СЕС), $ без ПДВ', kwp=f"=1831*Параметри!$B${ROW['PW']}",
    opts=[('Варіант: 194 зв’язки до сталевого каркаса ліхтарів замість анкерів крізь мембрану (до собівартості)', round(W['tie_cost'] - W['anc_cost']), 'після перевірки каркаса ліхтарів на ≈1,7 кН/м — див. попередній розрахунок на вітер і сповзання'),
          ('Варіант: без бортиків — замість них додаткові блоки в зонах F, G, H (%d замість %d)' % (RN2['tot'], RB2['tot']), round((RN2['tot'] - RB2['tot']) * (3.34 + 0.0396 * 15.59) - W2['skirt_cost']), 'не в сумі; +%.1f т на покрівлю' % (RN2['t'] - RB2['t']))],
    notes=['Не входить: нова мембрана ТПО (кладе «Антарес»), обстеження покриття і розрахунок КМ на вітер, LED-світильники для 5 модулів «на освітлення».', 'Контейнери, ШВ, EMS, магістральні спуски і лотки під лінії етапу 2 — в етапі 1.']))
# ---------- Метал і баласт (етап 2, позиціями)
M = wb.create_sheet('Метал і баласт')
M['A1'] = 'Етап 2 — кріплення даху на лагах (В1) позиціями (довідково, для замовлення); метал і баласт за етапами'; M['A1'].font = H1
for c, t in zip('ABCDEF', ('Позиція', 'Од.', 'К-сть', 'Ціна FOB / Україна, $', 'Сума, $', 'Люд.год')): M[f'{c}3'] = t; M[f'{c}3'].font = BB; M[f'{c}3'].fill = HDR
rr = 4
for x in [x for x in items['2'] if x['grp'] in ('Кріплення · дах В1', 'Баласт · дах В1')]:
    M[f'A{rr}'] = x['name']; M[f'B{rr}'] = x['unit']; M[f'C{rr}'] = round(x['q'], 1); M[f'D{rr}'] = x['p']; M[f'E{rr}'] = f'=C{rr}*D{rr}'; M[f'F{rr}'] = round(x['h'], 1)
    for c in 'ABCDEF': M[f'{c}{rr}'].font = BLUE if c in 'CD' else BLK; M[f'{c}{rr}'].border = BOX
    M[f'C{rr}'].number_format = QTY; M[f'D{rr}'].number_format = USD2; M[f'E{rr}'].number_format = USD; rr += 1
M[f'A{rr}'] = 'Разом позиціями (FOB для Китаю, без доставки і мита)'; M[f'A{rr}'].font = BB; M[f'E{rr}'] = f'=SUM(E4:E{rr - 1})'; M[f'E{rr}'].number_format = USD; M[f'E{rr}'].font = BB; M[f'F{rr}'] = f'=SUM(F4:F{rr - 1})'; M[f'F{rr}'].font = BB
rr += 2; mass = BM['mass']
for c, t in zip('ABCD', ('Маса (оцінка)', 'Етап 1, т', 'Етап 2, т', 'Примітка')): M[f'{c}{rr}'] = t; M[f'{c}{rr}'].font = BB; M[f'{c}{rr}'].fill = HDR
for nm, key, note in (('Сталь (кріплення, лотки)', 'steel', 'лага 1,45 кг/м, рейка 41×41×2,5 — 2,1 кг/м, гільза 0,45 кг, шпилька 0,48 кг/м'), ('Алюміній (притиски)', 'al', '0,1 кг на притиск'), ('Баласт', 'ballast', 'блок 13 кг')):
    rr += 1; M[f'A{rr}'] = nm; M[f'B{rr}'] = round(mass['1'][key] / 1000, 2); M[f'C{rr}'] = round(mass['2'][key] / 1000, 2); M[f'D{rr}'] = note; M[f'D{rr}'].font = SUB
for c, w in zip('ABCDEF', (70, 8, 10, 14, 12, 10)): M.column_dimensions[c].width = w
M.sheet_view.zoomScale = 100
# ---------- Зведення
Z = wb.create_sheet('Зведення', 0)
Z['A1'] = 'Кошторис СЕС і УЗЕ ТОВ МК «Антарес» по етапах — зведення (04.11.2026)'; Z['A1'].font = H1
Z['A2'] = '$ без ПДВ, якщо не вказано інше. Кожна сума — посилання на аркуші етапів. Генерація — розрахунки розкладок (етап 1 ≈645 МВт·год з АБК, етап 2 ≈1 255).'; Z['A2'].font = SUB
for c, t in zip('ABCDEFG', ('Етап', 'Склад', 'Під ключ без ПДВ, $', 'З ПДВ, $', 'З ПДВ, пільга «245», $', 'кВтп', 'МВт·год за рік')): Z[f'{c}4'] = t; Z[f'{c}4'].font = BB; Z[f'{c}4'].fill = HDR; Z[f'{c}4'].alignment = Alignment(wrap_text=True)
for i, (nm, comp, Sx, gen) in enumerate((('Етап 1', 'фасади 429, ліхтарі 316, склад 176, АБК 132 модулі; 4 × Golen LES-H20 (2 000 кВт / 4 820 кВт·год), EMS; накопичувач АБК', S1, 645), ('Етап 2', 'дах цеху В1: 1 831 модуль на мембрані, підключення до контейнерів етапу 1', S2, 1255))):
    r_ = 5 + i; t = Sx['S'].title
    Z[f'A{r_}'] = nm; Z[f'B{r_}'] = comp; Z[f'C{r_}'] = f"='{t}'!G{Sx['TA']}"; Z[f'D{r_}'] = f"='{t}'!G{Sx['TTV']}"; Z[f'E{r_}'] = f"='{t}'!G{Sx['TT2']}"; Z[f'F{r_}'] = f"='{t}'!G{Sx['KW']}"; Z[f'G{r_}'] = gen
    for c in 'CDE': Z[f'{c}{r_}'].number_format = USD; Z[f'{c}{r_}'].font = GRN
    Z[f'F{r_}'].number_format = '#,##0.0'; Z[f'F{r_}'].font = GRN; Z[f'G{r_}'].font = BLUE; Z[f'B{r_}'].alignment = Alignment(wrap_text=True, vertical='top'); Z.row_dimensions[r_].height = 30
Z['A7'] = 'Весь об’єкт'; Z['A7'].font = BB
for c in 'CDEFG': Z[f'{c}7'] = f'={c}5+{c}6'; Z[f'{c}7'].font = BB; Z[f'{c}7'].number_format = USD if c in 'CDE' else '#,##0.0'
for r_ in range(4, 8):
    for c in 'ABCDEFG': Z[f'{c}{r_}'].border = BOX
Z['A9'] = 'Довідково'; Z['A9'].font = BB
ref = [('Етап 1, частина УЗЕ: 4 контейнери Golen з доставкою (FOB + 15 000 $), $', f"='Етап 1'!G{S1['golen']}+4*Параметри!$B${ROW['DG']}"),
       ('Етап 2 на 1 кВтп, $ без ПДВ', f"=C6/F6"), ('Весь об’єкт на 1 кВтп, $ без ПДВ', '=C7/F7')]
for i, (nm, fml) in enumerate(ref):
    Z[f'A{10 + i}'] = nm; Z[f'C{10 + i}'] = fml; Z[f'C{10 + i}'].number_format = USD
Z['A14'] = 'Аркуші: «Параметри» — вихідні дані; «Етап 1», «Етап 2» — позиції з формулами; «Метал і баласт» — кріплення етапу 2 позиціями і маси. Дані — аналіз 04.11 (розподіл щитів між ТП-5913 і ТП-6923, переріз Al, лотки, блискавкозахист).'; Z['A14'].font = SUB
for c, w in zip('ABCDEFG', (34, 62, 16, 16, 18, 10, 12)): Z.column_dimensions[c].width = w
for ws in wb.worksheets: ws.sheet_view.zoomScale = 100
wb.save(OUT); print(OUT)
