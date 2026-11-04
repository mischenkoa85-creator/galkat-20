# -*- coding: utf-8 -*-
# Вставка в draw.py (exec): аркуші 9–11 — модулі у двох варіантах і норми; шари DXF 50–53 (вар. 1), 60–63 (вар. 2).
# Вар. 1 — з проходами і відступами: pv_cands.json, pv_eval.json, pv_check.json; вар. 2 — максимальний: *_max.json.
# Модулі поза стрінгами (s = −1) теж ставляться — на освітлення цеху (рішення власника 28.10).
# Тексти — pv_norms.json (pv_norms_build.py).
PVN = json.load(open(W + 'pv_norms.json', encoding='utf-8'))
PV_FR_EDGE = (0.02 + 2.384) * math.cos(math.radians(13))
KPV = dict(mod='#cfe0f5', modE='#2a5db0', fr='#b9d3ef', lit='#fbe3a6', litE='#b7791f', path='#e6f2e3', pathE='#2e8b57', per='#eef6ec')
def pv_var(sfx, lay):
    return dict(C=json.load(open(W + f'pv_cands{sfx}.json')), E=json.load(open(W + f'pv_eval{sfx}.json')), K=json.load(open(W + f'pv_check{sfx}.json')), L=lay)
PVV = [pv_var('', dict(roof='50_В1_МОДУЛІ_ДАХ', frame='51_В1_МОДУЛІ_КАРКАСИ', path='52_В1_ПРОХОДИ', lit='53_В1_МОДУЛІ_ОСВІТЛЕННЯ')),
       pv_var('_max', dict(roof='60_В2_МОДУЛІ_ДАХ', frame='61_В2_МОДУЛІ_КАРКАСИ', path='62_В2_ПРОХОДИ', lit='63_В2_МОДУЛІ_ОСВІТЛЕННЯ'))]
def plan_pv(V):
    PVC, PVE, PVK, L = V['C'], V['E'], V['K'], V['L']
    G = Prims(); ink = C['ink']; thin = LW['thin']; hair = LW['hair']
    xb = -4.2
    G.rect('05_ЗАХІДНА_БУДІВЛЯ', xb, R.YS_out, R.XW, R.YN_out, lw=thin, c=ink, fc=K['west'], hatch='////', z=1)
    G.line('05_ЗАХІДНА_БУДІВЛЯ', (R.XW, R.YS_out), (R.XW, R.YN_out), lw=LW['main'], c=ink, z=4)
    G.text('40_ТЕКСТ', (-2.35, 48.0), 'ЗАХІДНА БУДІВЛЯ (+6,8 м над покрівлею, вікна на рівні даху)', FS['small'], 90, 'center', 'center', bg=True)
    G.rect('24_ІНШЕ', R.XW - 0.18, R.DOOR['y'] - R.DOOR['w'] / 2, R.XW + 0.12, R.DOOR['y'] + R.DOOR['w'] / 2, lw=thin, c=ink, fc=K['other'], z=6)
    for (x0, y0, x1, y1) in ((R.XW, R.YS_out, R.XE_out, R.YS_in), (R.XW, R.YN_in, R.XE_out, R.YN_out), (R.XE_in, R.YS_out, R.XE_out, R.YN_out)):
        G.rect('04_ПАРАПЕТИ', x0, y0, x1, y1, lw=thin, c=ink, fc=K['par'], z=3)
    G.rect('00_ПОКРІВЛЯ_КОНТУР', R.XW, R.YS_in, R.XE_in, R.YN_in, lw=LW['main'], c=ink, fc='none', z=4)
    # проходи і відступи (вільні від модулів зони) — під модулями
    for z in PVC['Z']:
        if z['k'] not in ('path', 'perimeter'): continue
        x0, x1 = max(z['x'][0], R.XWin), min(z['x'][1], R.XE_in); y0, y1 = max(z['y'][0], R.YS_in), min(z['y'][1], R.YN_in)
        if x1 - x0 < 0.05 or y1 - y0 < 0.05: continue
        G.rect(L['path'], x0, y0, x1, y1, lw=0.0001, c=KPV['path'], fc=KPV['path'] if z['k'] == 'path' else KPV['per'], z=1.5)
    for v in R.VALLEYS:
        G.line('03_ЕНДОВИ', (v['xc'], R.YS_in), (v['xc'], R.YN_in), lw=hair, c=K['valley'], ls='-.', z=2)
    G.line('02_ГРАНІ_ПОКРІВЛІ', (R.RIDGE24['x'], R.YS_in), (R.RIDGE24['x'], R.YN_in), lw=hair, c=ink, ls=(0, (6, 2, 1, 2)), z=2)
    for n, x in R.AXES:
        G.line('01_ОСІ', (x, -2.6), (x, R.YS_out), lw=hair, c=ink, ls='-.', z=3)
        G.circ('01_ОСІ', (x, -3.95), 1.35, lw=thin, c=ink, fc='#ffffff', z=6); G.text('01_ОСІ', (x, -3.95), str(n), FS['text'], 0, 'center', 'center', bold=True)
    for (a, xa), (b, xb_) in zip(R.AXES, R.AXES[1:]):
        G.P.append(('dim', '42_РОЗМІРИ', (xa, -6.6), (xb_, -6.6), f'{nf((xb_ - xa) * 1000)}', dict()))
    for F in R.FRAMES:
        G.rect('12_КАРКАС_КОНТУР', F['xc'] - R.HALF, F['y0'], F['xc'] + R.HALF, F['y1'], lw=hair, c=K['ang'], fc='none', z=2.5)
        G.line('10_КАРКАС_ЦЕНТРАЛЬНИЙ_ПРОФІЛЬ', (F['xc'], F['y0']), (F['xc'], F['y1']), lw=LW['main'], c=K['frame'], z=6)
        G.text('40_ТЕКСТ', (F['xc'], F['y1'] + 1.55), F['id'], FS['text'], 0, 'center', 'center', bold=True, bg=True)
    # модулі: у стрінгах — сині; поза стрінгами (освітлення) — жовті
    LMm = 2.384
    for m in PVE['roof_mods']:
        lit = m['s'] < 0
        G.rect(L['lit'] if lit else L['roof'], m['xa'], m['y'] - LMm / 2, m['xb'], m['y'] + LMm / 2, lw=hair, c=KPV['litE'] if lit else KPV['modE'], fc=KPV['lit'] if lit else KPV['mod'], z=5)
    for m in PVE['frame_mods']:
        lit = m['s'] < 0; F = R.FRAMES[m['l'] - 1]; sg = 1 if m['side'] == 'E' else -1
        G.rect(L['lit'] if lit else L['frame'], min(F['xc'], F['xc'] + sg * PV_FR_EDGE), m['y'], max(F['xc'], F['xc'] + sg * PV_FR_EDGE), m['y1'], lw=hair,
               c=KPV['litE'] if lit else KPV['modE'], fc=KPV['lit'] if lit else KPV['fr'], z=5)
    A = R.AC; G.rect('20_РАМА_КОНДИЦІОНЕРІВ', A['x0'], A['y0'], A['x1'], A['y1'], lw=thin, c=ink, fc=K['ac'], z=6)
    E = R.EXIT_LAND; G.rect('21_ВИХІД_ПОРТАЛ', E['x0'], E['y0'], E['x1'], E['y1'], lw=thin, c=ink, fc=K['exit'], z=7)
    st = R.STAIRS; G.rect('21_ВИХІД_ПОРТАЛ', st['x0'], st['y0'], st['x1'], st['y1'], lw=hair, c=ink, ls='--', fc='none', z=4)
    for (x, y) in R.PORTAL_POSTS: G.rect('21_ВИХІД_ПОРТАЛ', x - 0.2, y - 0.2, x + 0.2, y + 0.2, lw=thin, c=ink, fc=ink, z=8)
    G.text('40_ТЕКСТ', (62.7, 1.7), 'вихід на дах', FS['small'], 0, 'left', 'center', bg=True)
    for o in R.DEFL:
        if o['cls'] != 'є': continue
        G.circ('22_ДЕФЛЕКТОРИ_ФОТО', (o['x'], o['y']), o['d'] / 2, lw=thin, c=ink, fc=K['phok'], z=8)
    for d in R.DRAINS:
        sure = d['st'] != 'уточнити'
        G.circ('23_ЛІВНЕВКИ' if sure else '23_ЛІВНЕВКИ_УТОЧНИТИ', (d['x'], d['y']), R.DRAIN_RING / 2, lw=thin, c=K['drain'], ls='-' if sure else '--', fc='#ffffff', z=9)
        G.circ('23_ЛІВНЕВКИ' if sure else '23_ЛІВНЕВКИ_УТОЧНИТИ', (d['x'], d['y']), R.DRAIN_CAP / 2, lw=hair, c=K['drain'], fc=K['drain'] if sure else '#ffffff', z=10)
    for p in PVC['rules']['paths_y']:
        G.text(L['path'], (90.5, p['yc']), f"прохід {nf(p['w'], 2)} м", FS['small'], 0, 'center', 'center', c=KPV['pathE'], bold=True, bg=True)
    for p in PVC['rules']['paths_x']:
        G.text(L['path'], (p['xc'], 80.6), f"прохід {nf(p['w'], 2)} м", FS['small'], 90, 'center', 'center', c=KPV['pathE'], bold=True, bg=True)
    k = PVK
    G.P.append(('dim', '42_РОЗМІРИ', (R.XWin, 14.0), (R.XWin + k['west'], 14.0), nf(k['west'], 2), dict()))
    G.P.append(('dim', '42_РОЗМІРИ', (R.XE_in - k['east'], 14.0), (R.XE_in, 14.0), nf(k['east'], 2), dict()))
    G.P.append(('dim', '42_РОЗМІРИ', (40.0, R.YS_in), (40.0, R.YS_in + k['south']), nf(k['south'], 2), dict(v=True)))
    G.P.append(('dim', '42_РОЗМІРИ', (40.0, R.YN_in - k['north']), (40.0, R.YN_in), nf(k['north'], 2), dict(v=True)))
    return G
def pv_sheet(n, V, S, title, vtitle, notes, warn, with_paths):
    sh = S_.Sheet(DOC, n, title)
    G = plan_pv(V); a, xm, ym, wv, hv = plan_view(sh, G)
    sh.view_title(xm, ym + hv + 2.5, vtitle, SC)
    Rf, Fr, T, Lt = S['roof'], S['frame'], S['st'], S['lit']
    lg = [(LG_rect(KPV['mod'], KPV['modE']), f"Модуль ZNSHINE 730 Вт 2 384 × 1 303 на гранях покрівлі, у стрінгах — {Rf['n']} ({Rf['st']} стрінгів по 11)"),
          (LG_rect(KPV['fr'], KPV['modE']), f"Модуль на каркасі ліхтаря 13°, книжково, у стрінгах — {Fr['n']} ({Fr['st']} стрінгів)"),
          (LG_rect(KPV['lit'], KPV['litE']), f"Модуль поза стрінгами — на освітлення цеху — {Lt['n']}")]
    if with_paths: lg += [(LG_rect(KPV['path'], KPV['path']), 'Прохід / протипожежний розрив — модулів немає')]
    lg += [(LG_rect(KPV['per'], KPV['per']), 'Відступ від стіни і парапетів — модулів немає'),
           (LG_rect(K['ac']), 'Рама кондиціонерів; вихід на дах, портал'),
           (LG_circ(K['phok'], C['ink']), 'Труба вентиляції (11, за фото)'),
           (LG_circ('#ffffff', K['drain'], inner=K['drain']), 'Лівневка; пунктир — не встановлено')]
    legend_custom(sh, lg)
    sh.table('Підсумок', [('', 40, 'l'), ('Модулів', 14, 'r'), ('кВтп', 16, 'r'), ('МВт·год/рік', 20, 'r')], [
        ['Грані покрівлі, у стрінгах', str(Rf['n']), nf(Rf['kwp'], 1), nf(Rf['mwh'], 1)],
        ['Каркаси ліхтарів 13°, у стрінгах', str(Fr['n']), nf(Fr['kwp'], 1), nf(Fr['mwh'], 1)],
        ['Разом у мережу', f"{T['n']:,}".replace(',', ' '), nf(T['kwp'], 1), nf(T['mwh'], 1)],
        ['На освітлення (потенційно)', str(Lt['n']), nf(Lt['kwp'], 1), nf(Lt['mwh'], 1)],
        ['Усього модулів', f"{S['all']:,}".replace(',', ' '), nf(T['kwp'] + Lt['kwp'], 1), '']], bold_rows=(2, 4), fs=FS['text'])
    north(sh, 404, 70)
    sh.notes(notes, warn=warn)
    sh.save(pdf)
S_ = S
pv_sheet(9, PVV[0], PVN['S1'], 'Модулі, варіант 1: з проходами і відступами', 'Варіант 1 — з проходами і відступами (норми, арк. 11)', PVN['v1_notes'], PVN.get('v1_warn', ()), True)
pv_sheet(10, PVV[1], PVN['S2'], 'Модулі, варіант 2: максимальний', 'Варіант 2 — максимальний, без проходів', PVN['v2_notes'], PVN.get('v2_warn', ()), False)
# ================= аркуш 11: норми, правила і перевірка
PVK = PVV[0]['K']
sh = S.Sheet(DOC, 11, 'Розміщення модулів: норми, правила, перевірка')
yb = sh.table('Норми і прийняті правила (варіант 1)', [('Вимога', 46, 'l'), ('Норма / джерело', 92, 'l'), ('Прийнято', 40, 'l'), ('Фактично', 26, 'l'), ('', 8, 'c')],
              PVN['rows'], zone='wide', x=24, y=286, width=212, fs=FS['text'] - 0.3)
yf = sh.table('Поля модулів варіанта 1 (між проходами)', [('№', 8, 'c'), ('X, м', 40, 'l'), ('Y, м', 40, 'l'), ('Габарит, м', 50, 'l'), ('Модулів', 30, 'r')],
         [[str(i + 1), f"{nf(f['x0'], 1)}–{nf(f['x1'], 1)}", f"{nf(f['y0'], 1)}–{nf(f['y1'], 1)}", f"{nf(f['dx'], 1)} × {nf(f['dy'], 1)}", str(f['n'])] for i, f in enumerate(sorted(PVK['fields'], key=lambda f: (f['y0'], f['x0'])))],
         zone='wide', x=244, y=286, width=168, fs=FS['small'])
sh.table('Порівняння варіантів', [('', 72, 'l'), ('Модулів', 22, 'r'), ('кВтп', 24, 'r'), ('МВт·год/рік', 26, 'r')], PVN['compare'], zone='wide', x=244, y=yf - 6, width=168, fs=FS['text'] - 0.3, bold_rows=(2, 5, 6))
sh.notes(PVN['sheet10_notes'], warn=PVN.get('sheet10_warn', ()))
sh.save(pdf)
