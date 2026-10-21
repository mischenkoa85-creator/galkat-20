# -*- coding: utf-8 -*-
"""Креслення: траса КЛ-6 кВ від ГПУ до РП «Алюміній», BESS (місця В і В′) і фундаменти BESS / PCS у двох варіантах.
Фундаментні аркуші — з ../../src/draw.py (комплект площадки 20), параметризовані за глибиною.
Запуск:  python3 kreslennya.py out.pdf"""
import json, math, os, sys, types

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'src', 'draw.py')
DATA = json.load(open(os.path.join(HERE, 'route_data.json'), encoding='utf-8'))
DATE = '21.10.2026'
TOTAL = 6


def rep(s, a, b, n=1):
    assert s.count(a) == n, (s.count(a), a[:90])
    return s.replace(a, b)


def load_variant(v, sheets):
    """draw.py з глибиною варіанта v (1 — низ −1,850 за Golen, 2 — низ −1,500)."""
    s = open(SRC, encoding='utf-8').read()
    if v == 2:
        s = rep(s, 'F_TOP, COL_BOT, BEAM_BOT = 300, -1500, -1850', 'F_TOP, COL_BOT, BEAM_BOT = 300, -1150, -1500')
        s = rep(s, 'COL_ST_Y = [-1450 + 200 * i for i in range(8)] + [50, 150, 250]', 'COL_ST_Y = [-1050 + 200 * i for i in range(6)] + [50, 150, 250]')
        s = rep(s, "('f', '4', 12, 'A500C', 2240, 'Г 2040 + 200', 32,", "('f', '4', 12, 'A500C', 1890, 'Г 1690 + 200', 32,")
    s = rep(s, "assert LF == 6158 and BF == 2538", "assert LF == 6158 and BF == 2538\nLV = lambda z: ('−' if z < 0 else '+' if z > 0 else '') + ('%.3f' % (abs(z) / 1000.0)).replace('.', ',')")
    s = rep(s, "p.text(x0 + 2, y0 + 31, 'ТзДВ «Гал-Кат», площадка № 20. УЗЕ 1,725 МВт / 5 МВт·год', 8.2, 'B')",
            "p.text(x0 + 2, y0 + 31, 'ТзДВ «Гал-Кат», площадка № 20. ГПУ, УЗЕ 1,725 МВт / 5 МВт·год', 8.2, 'B')")
    s = rep(s, "('Дата', '12.10.2026')", "('Дата', '%s')" % DATE)
    # ---- аркуш «Фундамент»
    s = rep(s, "frame(p, ['Фундамент контейнера BESS', 'План, розрізи 1–1 і 2–2, вузол А'], '1 : 40; 1 : 10', 3, 5)",
            "frame(p, ['Фундамент BESS і PCS · варіант %d' % VARIANT, 'План, розрізи 1–1 і 2–2, вузол А'], '1 : 40; 1 : 10', SHEET_F, TOTAL)")
    s = rep(s, "'5458 × 1838 у світлі, глибина 1800 від верху фундаменту'", "'5458 × 1838 у світлі, глибина %d від верху фундаменту' % (F_TOP - COL_BOT)")
    s = rep(s, "    for zz, t in ((F_TOP, '+0,300'), (0, '0,000'), (COL_BOT, '−1,500'), (BEAM_BOT, '−1,850')):\n        p.line(X(LF) + 1.2",
            "    for zz, t in ((F_TOP, '+0,300'), (0, '0,000'), (COL_BOT, LV(COL_BOT)), (BEAM_BOT, LV(BEAM_BOT))):\n        p.line(X(LF) + 1.2")
    s = rep(s, "p.dim_v(Z(BEAM_BOT), Z(F_TOP), xr, xr + 24, '2150')", "p.dim_v(Z(BEAM_BOT), Z(F_TOP), xr, xr + 24, str(F_TOP - BEAM_BOT))")
    s = rep(s, "('Бетон C25, колони 8 шт.', '1,76 м³'),", "('Бетон C25, колони 8 шт.', fnum(V_COLS, 2) + ' м³'),")
    s = rep(s, "('Бетон разом', '3,72 м³'),", "('Бетон разом', fnum(V_BEAM + V_COLS, 2) + ' м³'),")
    s = rep(s, "('Кладка, площа стін (h = 1,8 м)', '23,7 м²'),", "('Кладка, площа стін (h = %s м)' % fnum((F_TOP - COL_BOT) / 1000.0, 2), fnum(W_LEN * (F_TOP - COL_BOT) / 1e6, 1) + ' м²'),")
    s = rep(s, "'Ескіз виконано за довідковим кресленням виробника (Golen, Annex 1 – Response 1, аркуш Reference Foundation Drawing of 5MWh BESS Container). Розміри в міліметрах, позначки в метрах.',",
            "VAR_NOTE + ' Ескіз — за довідковим кресленням Golen (Annex 1 – Response 1, Reference Foundation Drawing of 5MWh BESS Container). Фундамент блока PCS — того самого типу: Golen його не дав. Розміри в мм, позначки в м від верху землі біля блока.',")
    s = rep(s, "'Орієнтовний тиск під підошвою балки ≈ 120 кПа (контейнер 43 т і власна вага фундаменту ≈ 24 т на площу ≈ 5,6 м²). Перевірити за ґрунтовими умовами; глибину закладання звірити з глибиною промерзання.',",
            "'Орієнтовний тиск під підошвою балки ≈ %d кПа (контейнер BESS 43 т і власна вага фундаменту ≈ %d т на площу ≈ 5,6 м²). Перевірити за ґрунтовими умовами; глибину закладання звірити з нормативною глибиною промерзання (ДБН В.2.1-10) і вишукуваннями.' % PRESS,")
    for a, b in (("наведено на аркуші 4.", "наведено на аркуші ' + str(SHEET_R) + '."), ("(аркуш 4).", "(аркуш ' + str(SHEET_R) + ').")):
        s = rep(s, a, b)
    s = rep(s, "('Сталь, усього (аркуш 4)',", "('Сталь, усього (аркуш %d)' % SHEET_R,")
    # ---- аркуш «Армування»: позначки прив'язано до низу балки й низу колон
    a0 = s.index('def sheet_rebar(c):'); a1 = s.index('# Sheet 5: 3D views')
    r = s[a0:a1]
    r = rep(r, "frame(p, ['Армування фундаменту', 'Каркаси, специфікація, кабельний канал'], '1 : 40; 1 : 20; 1 : 10', 4, 5)",
            "frame(p, ['Армування фундаменту · варіант %d' % VARIANT, 'Каркаси, специфікація, кабельний канал'], '1 : 40; 1 : 20; 1 : 10', SHEET_R, TOTAL)")
    r = rep(r, "YE = lambda y: ey0 + (y + 1950) * kk", "YE = lambda y: ey0 + (y - (BEAM_BOT - PREP)) * kk")
    r = rep(r, "(F_TOP + 1500) * kk", "(F_TOP - COL_BOT) * kk")
    r = rep(r, "chain = [(250, 300, '50'), (-50, 250, '3×100'), (-1450, -50, '7×200 = 1400'), (-1500, -1450, '50')]",
            "chain = [(250, 300, '50'), (-50, 250, '3×100'), (COL_ST_Y[0], -50, '%d×200 = %d' % ((-50 - COL_ST_Y[0]) // 200, -50 - COL_ST_Y[0])), (COL_BOT, COL_ST_Y[0], str(COL_ST_Y[0] - COL_BOT))]")
    r = rep(r, "p.text(xd - 1.6, YE(-1475) - 1.0, '50', 6.0, anchor='r')", "p.text(xd - 1.6, YE((COL_BOT + COL_ST_Y[0]) / 2.0) - 1.0, str(COL_ST_Y[0] - COL_BOT), 6.0, anchor='r')")
    r = rep(r, "p.dim_v(YE(-1500), YE(300), XE(0), xd - 6.5, '1800', size=6.2)", "p.dim_v(YE(COL_BOT), YE(300), XE(0), xd - 6.5, str(F_TOP - COL_BOT), size=6.2)")
    r = rep(r, "for zz, t in ((F_TOP, '+0,300'), (0, '0,000'), (-1500, '−1,500'), (-1850, '−1,850')):", "for zz, t in ((F_TOP, '+0,300'), (0, '0,000'), (COL_BOT, LV(COL_BOT)), (BEAM_BOT, LV(BEAM_BOT))):")
    r = rep(r, "'−1,950'", "LV(BEAM_BOT - PREP)")
    r = rep(r, "YE(-1680)", "YE(BEAM_BOT + 170)"); r = rep(r, "YE(-1700)", "YE(BEAM_BOT + 150)")
    r = rep(r, "YE(-1250)", "YE(COL_BOT + 250)", 2); r = rep(r, "YE(-980)", "YE(COL_BOT + 520)"); r = rep(r, "YE(-1080)", "YE(COL_BOT + 420)")
    r = r.replace('-1950', '(BEAM_BOT - PREP)').replace('-1784', '(BEAM_BOT + 66)').replace('-1850', 'BEAM_BOT').replace('-1500', 'COL_BOT')
    r = rep(r, "slabel(130.5, '4', 'Ø12 A500C, L = 2240', G)", "slabel(130.5, '4', 'Ø12 A500C, L = %d' % POS4, G)")
    r = rep(r, "p.text(sx + 5.6, 115, '2040', 6.0, anchor='c', rot=90)", "p.text(sx + 5.6, 115, str(POS4 - 200), 6.0, anchor='c', rot=90)")
    s = s[:a0] + r + s[a1:]
    m = types.ModuleType('draw_v%d' % v)
    m.__dict__.update({'VARIANT': v, 'SHEET_F': sheets[0], 'SHEET_R': sheets[1], 'TOTAL': TOTAL})
    exec(compile(s, 'draw_v%d.py' % v, 'exec'), m.__dict__)
    m.POS4 = [x for x in m.REBAR if x[1] == '4'][0][4]
    m.W_LEN = 2 * ((m.COLX[1] - m.BEAM) + (m.COLX[2] - m.COLX[1] - m.BEAM) + (m.COLX[3] - m.COLX[2] - m.BEAM)) + 2 * (m.BF - 2 * m.BEAM)
    h = (m.F_TOP - m.COL_BOT) / 1000.0
    w_found = (m.V_BEAM + m.V_COLS) * 2.5 + m.W_LEN / 1000.0 * 0.35 * h * 1.8
    m.PRESS = (round((43 + w_found) * 9.81 / (0.35 * (2 * 6.158 + 2 * (2.538 - 0.7))) / 5.0) * 5, round(w_found))
    m.VAR_NOTE = ('Варіант 1 — як у Golen: низ балки −1,850, колони 1800 мм.' if v == 1 else
                  'Варіант 2 — глибина 1,5 м: та сама конструкція, підошву піднято на 350 мм — низ балки −1,500, колони 1450 мм.')
    m.STEEL = sum(m.steel_by('f').values()) + 8 * m.MN_KG
    m.BRICK_V = m.W_LEN / 1000.0 * 0.35 * h
    return m


def quantities():
    out = {}
    for v in (1, 2):
        m = load_variant(v, (0, 0))
        out[v] = {'beam': m.V_BEAM, 'cols': m.V_COLS, 'conc': m.V_BEAM + m.V_COLS, 'prep': m.V_PREP, 'brick': m.BRICK_V,
                  'wall': m.W_LEN * (m.F_TOP - m.COL_BOT) / 1e6, 'steel': m.STEEL, 'h': (m.F_TOP - m.COL_BOT) / 1000.0,
                  'bot': m.BEAM_BOT, 'press': m.PRESS[0], 'self': m.PRESS[1], 'pos4': m.POS4, 'nst': m.N_ST}
    return out


if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == '--q':
    print(json.dumps(quantities(), indent=1, ensure_ascii=False))
    sys.exit()

import route_sheets   # noqa: E402  (аркуші 1–2: траса і профіль)

if __name__ == '__main__':
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm
    out = sys.argv[1]
    m1 = load_variant(1, (3, 4)); m2 = load_variant(2, (5, 6))
    c = canvas.Canvas(out, pagesize=(m1.PW * mm, m1.PH * mm))
    c.setTitle('ГалКат, площадка 20: траса КЛ-6 кВ від ГПУ до РП «Алюміній», BESS і фундаменти у двох варіантах')
    c.setAuthor('Ескіз за кресленням траси КЛ-6 кВ (знімок), томом 4 КБ, генпланом 2023 і кресленнями Golen')
    c.setSubject('ГПУ, УЗЕ 1,725 МВт / 5 МВт·год, КЛ-6 кВ')
    q = quantities()
    route_sheets.sheet_plan(c, m1, DATA, q)
    route_sheets.sheet_profile(c, m1, DATA, q)
    m1.sheet_foundation(c); m1.sheet_rebar(c)
    m2.sheet_foundation(c); m2.sheet_rebar(c)
    c.save()
    print('saved', out)
