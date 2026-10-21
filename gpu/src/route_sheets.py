# -*- coding: utf-8 -*-
"""Аркуші 1–2: план траси КЛ-6 кВ від ГПУ до РП «Алюміній» з BESS і профіль траси з перерізами."""
import math

C = {'water': (0.04, 0.56, 0.41), 'gas': (0.78, 0.57, 0.0), 'cable6': (0.82, 0.14, 0.17), 'cable': (0.56, 0.25, 0.68),
     'heat': (0.77, 0.34, 0.11), 'sewer': (0.48, 0.33, 0.2), 'storm': (0.48, 0.33, 0.2)}
KL = (0.76, 0.09, 0.36)          # нові КЛ-6 кВ
HIT = (0.88, 0.08, 0.18)
NAME = {'water': 'водопровід', 'gas': 'газопровід', 'cable6': 'кабель 6 кВ', 'cable': 'кабель', 'heat': 'теплотраса', 'sewer': 'каналізація', 'storm': 'дощова каналізація'}
f2 = lambda v: ('%.2f' % v).replace('.', ',')
f1 = lambda v: ('%.1f' % v).replace('.', ',')


def frame(m, p, title, scale, num, src):
    """Рамка й штамп як у комплекті площадки 20, з власним рядком джерел."""
    p.rect(20, 5, m.PW - 25, m.PH - 10, w=0.5)
    x0, y0, w_, h_ = 230, 5, 185, 40
    p.rect(x0, y0, w_, h_, w=0.5)
    xs = x0 + 115
    p.line(xs, y0, xs, y0 + h_, 0.5); p.line(x0, y0 + 28, xs, y0 + 28, m.W_VIS); p.line(x0, y0 + 7, xs, y0 + 7, m.W_VIS)
    for i in range(1, 4):
        p.line(xs, y0 + i * 10, x0 + w_, y0 + i * 10, m.W_VIS)
    p.line(xs + 22, y0, xs + 22, y0 + h_, m.W_VIS)
    p.text(x0 + 2, y0 + 36.5, 'Об’єкт', 5.6, col=m.MUTED)
    p.text(x0 + 2, y0 + 31, 'ТзДВ «Гал-Кат», площадка № 20. ГПУ, УЗЕ 1,725 МВт / 5 МВт·год', 8.2, 'B')
    p.text(x0 + 2, y0 + 23.8, 'Аркуш', 5.6, col=m.MUTED)
    yy = y0 + 17.2
    for row in title:
        p.text(x0 + 2, yy, row, 10.5, 'B'); yy -= 5.2
    p.text(x0 + 2, y0 + 2.3, src, 5.6, col=m.MUTED)
    for i, (k, v) in enumerate([('Стадія', 'Ескіз'), ('Масштаб', scale), ('Дата', '21.10.2026'), ('Аркуш', '%d / 6' % num)]):
        yb = y0 + h_ - (i + 1) * 10
        p.text(xs + 1.5, yb + 3.6, k, 6.2, col=m.MUTED); p.text(xs + 24, yb + 3.3, v, 8.6, 'B')
    s = 'ЕСКІЗ · НЕ ДЛЯ БУДІВНИЦТВА'
    sw = p.tw(s, 8.5, 'B')
    p.rect(m.PW - 8 - sw - 5, m.PH - 15.5, sw + 5, 6.5, w=0.35, col=m.ACC)
    p.text(m.PW - 8 - sw - 2.5, m.PH - 13.6, s, 8.5, 'B', col=m.ACC)


def rot_rect(c, u, l, w):
    ux, uy = u; nx, ny = uy, -ux
    pts = []
    for a, b in ((-l / 2, -w / 2), (l / 2, -w / 2), (l / 2, w / 2), (-l / 2, w / 2)):
        pts.append((c[0] + ux * a + nx * b, c[1] + uy * a + ny * b))
    return pts


def sheet_plan(cv, m, D, Q):
    p = m.Pen(cv)
    SRC = 'Джерела: креслення траси КЛ-6 кВ (знімок 21.10.2026), том 4 КБ 15/2026-02-КБ, генплан 2023, Golen Annex 1, 3D-модель площадки'
    frame(m, p, ['Траса КЛ-6 кВ від ГПУ до РП «Алюміній»', 'План з BESS і мережами, перевірка за ПУЕ'], '1 : 250', 1, SRC)
    k = 4.0                                      # 1 : 250
    x0, y0, ox, oy = -4.0, -2.0, 24.0, 48.0
    X = lambda x: ox + (x - x0) * k
    Y = lambda y: oy + (y - y0) * k
    inside = lambda x, y: -4 <= x <= 47.5 and -2 <= y <= 57.5
    p.view_title(24, 288.5, 'План', 'М 1 : 250 · осі тому КБ: x від осі 1 на схід, y від осі А на північ')
    cv.saveState(); pth = cv.beginPath(); pth.rect(X(-4) * m.mm, Y(-2) * m.mm, 51.5 * k * m.mm, 59.5 * k * m.mm); cv.clipPath(pth, stroke=0, fill=0)
    # ---- існуючі мережі
    for l in D['lines']:
        col = C.get(l['c'], (0.5, 0.5, 0.5))
        pts = [(X(q[0]), Y(q[1])) for q in l['p']]
        p.poly(pts, 0.35 if l['c'] in ('water', 'gas', 'heat', 'sewer') else 0.25, col, dash=[1.6, 0.9] if l['x'] else None)
    for w in D['wells']:
        p.circle(X(w['x']), Y(w['y']), 1.6, w=0.25, col=C.get(w['c'], (0.4, 0.4, 0.4)))
    for o in D['objs']:
        if o['t'] == 'ШРП':
            p.rect(X(o['x']) - 3.6, Y(o['y']) - 2.0, 7.2, 4.0, w=0.3, col=C['gas'], fill=(1, 0.95, 0.8)); p.text(X(o['x']), Y(o['y']) - 0.9, 'ШРП', 5.4, 'B', anchor='c')
        else:
            p.circle(X(o['x']), Y(o['y']), 2.0, w=0.3, col=C['water'])
    # паркани
    for f in D['fences']:
        pts = [(X(q[0]), Y(q[1])) for q in f['xy']]
        p.poly(pts, 0.3, (0.35, 0.38, 0.42))
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1])
            if L < 1: continue
            for t in range(1, int(L / 6) + 1):
                q = (a[0] + (b[0] - a[0]) * t * 6 / L, a[1] + (b[1] - a[1]) * t * 6 / L); dx, dy = (b[1] - a[1]) / L, -(b[0] - a[0]) / L
                p.line(q[0], q[1], q[0] + dx * 1.2, q[1] + dy * 1.2, 0.25, (0.35, 0.38, 0.42))
    # будівлі
    for b in D['parts']:
        pts = [(X(q[0]), Y(q[1])) for q in b['xy']]
        p.poly(pts, 0.45, m.INK, dash=[2.4, 1.0] if 'проект' in b['name'] else None, fill=(0.97, 0.93, 0.85) if 'проект' in b['name'] else (0.93, 0.93, 0.93), close=True)
    rp = D['rp']; pts = [(X(q[0]), Y(q[1])) for q in rp['xy']]
    p.poly(pts, 0.6, m.INK, fill=(0.95, 0.86, 0.80), close=True)
    tr = [(X(q[0]), Y(q[1])) for q in rp['tr']['xy']]
    p.poly(tr, 0.3, m.MUTED, dash=[1.2, 0.8], close=True)
    # майданчик ГПУ, плити, контейнери, Фм-1
    p.rect(X(-2.02), Y(1.02), 20 * k, 16 * k, w=0.35, col=(0.12, 0.25, 0.6), dash=[2.0, 0.8])
    for y in (3, 11):
        p.rect(X(0), Y(y), 16 * k, 4 * k, w=0.3, fill=(0.9, 0.91, 0.92))
        p.rect(X(0.48), Y(y + 0.5), 14.94 * k, 3.25 * k, w=0.45, col=(0.12, 0.25, 0.6), fill=(0.86, 0.9, 0.97))
    p.text(X(8), Y(13.1) - 1.2, 'ГПУ-2', 7.4, 'B', anchor='c', col=(0.12, 0.25, 0.6))
    p.text(X(8), Y(5.1) - 1.2, 'ГПУ-1', 7.4, 'B', anchor='c', col=(0.12, 0.25, 0.6))
    for (fx, fy) in ((0, 18), (19, 0)):
        p.rect(X(fx - 1.2), Y(fy - 1.2), 2.4 * k, 2.4 * k, w=0.3, fill=(0.9, 0.91, 0.92))
    # ---- BESS: місце В (пунктир) і В′ (суцільно)
    for s in D['bess']:
        new = s['key'] == 'V2'
        for kind, c in (('BESS', s['bess']), ('PCS', s['pcs'])):
            x_, y_ = c[0] - 3.079, c[1] - 1.269
            if new:
                p.rect(X(x_), Y(y_), 6.158 * k, 2.538 * k, w=0.5, fill=(0.98, 0.91, 0.82))
                p.rect(X(c[0] - 3.029), Y(c[1] - 1.219), 6.058 * k, 2.438 * k, w=0.3, col=m.ACC, dash=[3, 0.8, 0.5, 0.8])
                p.text(X(c[0]), Y(c[1]) - 1.2, kind if kind == 'BESS' else 'PCS + Т 6 кВ', 6.6, 'B', anchor='c')
            else:
                p.rect(X(x_), Y(y_), 6.158 * k, 2.538 * k, w=0.45, col=HIT, dash=[1.6, 1.0])
        if new:
            p.rect(X(s['pcs'][0] - 0.4), Y(s['pcs'][1] + 1.269), 0.8 * k, (s['bess'][1] - s['pcs'][1] - 2.538) * k, w=0.3, fill=(0.9, 0.9, 0.9))
        else:
            p.text(X(s['pcs'][0] - 3.3), Y(s['pcs'][1]) - 1.0, 'В', 8.5, 'B', anchor='r', col=HIT)
    v2 = [s for s in D['bess'] if s['key'] == 'V2'][0]
    p.text(X(v2['pcs'][0] - 3.3), Y(v2['pcs'][1]) - 1.0, 'В′', 8.5, 'B', anchor='r', col=m.ACC)
    # ---- нові КЛ-6 кВ
    R = D['route']
    for kl in R['kl']:
        p.poly([(X(q[0]), Y(q[1])) for q in kl['p'][1:]], 0.7, KL)
    for T in R['trunk']:
        p.poly([(X(q[0]), Y(q[1])) for q in T['p']], 0.7, KL)
    for mf in R['muffs']:
        x_, y_ = X(mf['x']), Y(mf['y'])
        p.poly([(x_, y_ + 1.8), (x_ + 1.2, y_), (x_, y_ - 1.8), (x_ - 1.2, y_)], 0.3, KL, fill=KL, close=True)
    for pt in R['pits']:
        p.poly([(X(a), Y(b)) for a, b in rot_rect(pt['c'], pt['u'], pt['l'], pt['w'])], 0.45, (0.55, 0.35, 0.12), fill=(0.96, 0.9, 0.8), close=True)
    B = R['bore']
    u = (B['b'][0] - B['a'][0], B['b'][1] - B['a'][1]); L = math.hypot(*u); u = (u[0] / L, u[1] / L); n = (u[1], -u[0])
    for s_ in (-0.32, 0.32):
        p.line(X(B['a'][0] + n[0] * s_), Y(B['a'][1] + n[1] * s_), X(B['b'][0] + n[0] * s_), Y(B['b'][1] + n[1] * s_), 0.3, m.INK, dash=[2.2, 0.8])
    if v2.get('hv'):
        p.poly([(X(q[0]), Y(q[1])) for q in v2['hv']['p']], 0.45, KL, dash=[2.0, 1.2])
    # конфлікти
    p.circle(X(28.62), Y(33.4), 5.0, w=0.6, col=HIT)
    p.circle(X(21.7), Y(15.5), 4.2, w=0.6, col=HIT)
    cv.restoreState()
    # ---- підписи
    lab = lambda x, y, tx, ty, t, **kw: p.leader(X(x), Y(y), X(tx), Y(ty), t, size=kw.get('size', 6.0), lines=kw.get('lines'), anchor=kw.get('anchor', 'l'), bg=(1, 1, 1))
    lab(18.4, 4.9, 25.0, 1.2, '', lines=['КЛ-6 кВ №1 від ГПУ-1: 1×120/50, L = 20 м', '(10 м по ГПУ, гофротруба d120, L = 15 м)'])
    lab(18.4, 13.1, 25.0, 8.0, '', lines=['КЛ-6 кВ №2 від ГПУ-2: 1×120/50, L = 20 м'])
    lab(21.5, 10.79, 25.0, 4.8, 'муфта №1')
    lab(21.1, 18.71, 25.0, 11.3, 'муфта №2')
    lab(22.2, 21.9, 12.2, 24.8, '', lines=['робочий котлован', '3 × 2 × 2 м'], anchor='r')
    lab(39.1, 52.1, 31.5, 56.0, '', lines=['приймальний котлован 2 × 2 × 2 м'], anchor='r')
    lab(33.0, 39.5, 37.5, 33.5, '', lines=['прокол №1, L = 33 м,', 'труби SDR17 + резервні'])
    lab(41.71, 52.78, 47.0, 49.8, '', lines=['ввід крізь стіну,', '10 м по РУ-6 кВ'], anchor='r')
    lab(44.2, 47.5, 46.6, 44.0, '', lines=['РП «Алюміній»', '(зах. прибудова корп. 9)'], anchor='r')
    lab(44.0, 60.0 if False else 56.5, 46.6, 57.0, '', lines=['трансформаторні камери'], anchor='r')
    lab(28.9, 34.3, 35.5, 27.0, '', lines=['3 × АПвЗгаПу-6 1×240/50 × 2 лінії,', 'Lзаг = 55 м; у траншеї — труба d140'])
    lab(34.1, 43.6, 38.5, 36.3, '', lines=['газопроводи вздовж паркану 14/20'])
    lab(21.9, 6.0, 25.0, -0.9, 'газопровід від ШРП')
    lab(28.62, 33.4, 9.0, 33.0, '', lines=['місце В: прокол під PCS,', 'BESS — 0,06 м до труб'], anchor='r')
    lab(21.7, 15.5, 9.0, 19.0, '', lines=['КЛ за 0,2–1,0 м від газу', '(треба ≥ 1 м)'], anchor='r')
    lab(v2['bess'][0] - 2.0, v2['bess'][1] + 1.0, 18.8, 55.5, '', lines=['місце В′: зсув на 9,5 м на північ,', 'PCS — 1,0 м, BESS — 4,5 м до проколу'], anchor='r')
    if v2.get('hv'):
        q = v2['hv']['p'][8]; lab(q[0], q[1], 29.0, 51.0, '', lines=['лінія 6 кВ від PCS — умовно'], anchor='r')
    for b in D['parts']:
        if 'проект' in b['name']:
            p.text(X(12.0), Y(30.0), 'Складська будівля №2 (проект)', 7.0, 'B', anchor='c', col=m.MUTED)
    p.text(X(-1.0), Y(-0.8), 'майданчик ГПУ 20 × 16 м', 5.8, col=(0.12, 0.25, 0.6))
    # прокол: розмір
    a_, b_ = (B['a'][0] - n[0] * 1.6, B['a'][1] - n[1] * 1.6), (B['b'][0] - n[0] * 1.6, B['b'][1] - n[1] * 1.6)
    p.line(X(a_[0]), Y(a_[1]), X(b_[0]), Y(b_[1]), m.W_HAIR + 0.03)
    for q in (a_, b_):
        p.tick(X(q[0]), Y(q[1]))
    mid = ((a_[0] + b_[0]) / 2 - n[0] * 0.5, (a_[1] + b_[1]) / 2 - n[1] * 0.5)
    p.text(X(mid[0]), Y(mid[1]), 'L = 33,0', 6.4, anchor='c', rot=math.degrees(math.atan2(u[1], u[0])))
    # зсув В → В′
    s1 = [s for s in D['bess'] if s['key'] == 'V'][0]
    p.dim_v(Y(s1['pcs'][1]), Y(v2['pcs'][1]), X(25.4), X(23.4), '9500', size=6.0)
    # стрілка півночі (осі КБ повернуті на 1,46° від півночі генплану)
    nx_, ny_ = 38.0, 266.0
    p.circle(nx_, ny_ + 2.5, 8.0, w=0.25, fill=(1, 1, 1))
    a = math.radians(1.46)
    tip = (nx_ + math.sin(a) * 9, ny_ + math.cos(a) * 9)
    p.poly([(nx_ - 2.2, ny_ - 3), tip, (nx_ + 2.2, ny_ - 3), (nx_, ny_ - 1.4)], 0.3, m.INK, fill=m.INK, close=True)
    p.text(tip[0], tip[1] + 1.4, 'Пн', 7.0, 'B', anchor='c')
    # масштабна лінійка
    for i in range(5):
        p.rect(X(-3) + i * 4 * k * 0.5, 51.0 - 0.0, 2 * k, 1.2, w=0.2, fill=m.INK if i % 2 == 0 else (1, 1, 1))
    p.text(X(-3), 53.4, '0', 5.6); p.text(X(-3) + 20 * k * 0.5, 53.4, '10 м', 5.6, anchor='c')

    # ---- таблиця перевірок
    ch = D['checks']
    rx = 238.0
    p.text(rx, 285.5, 'Перевірка відстаней за ПУЕ, гл. 2.3', 8.6, 'B')
    p.text(rx, 281.6, 'у світлі; глибини існуючих мереж умовні (газ 1,2 м, кабелі 0,8 м) — потрібні шурфи', 5.8, col=m.MUTED)
    par_gas = [c for c in ch['par'] if c['net'] == 'gas' and c['x'] < 25]
    cx_gas = [c for c in ch['cross'] if c['net'] == 'gas' and c['x'] < 25]
    cx_bore = [c for c in ch['cross'] if c['net'] == 'gas' and c['bore']]
    c6 = [c for c in ch['cross'] if c['net'] == 'cable6']
    par6 = [c for c in ch['par'] if c['net'] == 'cable6']
    bld = {c['name']: c for c in ch['bld']}
    bs = {(c['place'], c['kind']): c for c in ch['bess']}
    rows = [
        ('Глибина траншеї до верху труби', '≥ 0,7 м · 2.3.84', f2(ch['depth']['trench_top']) + ' м', 'так'),
        ('Газопровід від ШРП, паралельно', '≥ 1 м · 2.3.88', f2(min(c['dist'] for c in par_gas)) + '–' + f2(max(c['dist'] for c in par_gas)) + ' м', 'НІ'),
        ('Той самий газопровід, перетин біля котлована', '≥ 0,25 м у трубі · 2.3.95', '≈ ' + f2(max(0, min(c['gap'] for c in cx_gas))) + ' м', 'НІ'),
        ('Газопроводи біля паркану 14/20, прокол', '≥ 0,25 м у трубі · 2.3.95', f2(min(c['gap'] for c in cx_bore)) + '–' + f2(max(c['gap'] for c in cx_bore)) + ' м', 'межа'),
        ('Кабель 6 кВ, перетин проколом', '≥ 0,15 м з розділенням · 2.3.94', f2(min(c['gap'] for c in c6)) + ' м', 'так'),
        ('Кабелі 6 кВ поруч, паралельно', '≥ 0,1 м · 2.3.86', (f2(min(c['dist'] for c in par6)) + ' м') if par6 else 'не зближ.', 'так'),
        ('Складська будівля №2 (проект)', '≥ 0,6 м · 2.3.85', f2(bld['Складська будівля №2 (проект)']['dist']) + ' м', 'так'),
        ('РП «Алюміній», крім вводу', '≥ 0,6 м · 2.3.85', f2(bld['РП «Алюміній» (крім місця вводу)']['dist']) + ' м', 'так'),
        ('Плити Фпм-1 під ГПУ', '≥ 0,6 м · 2.3.85', f2(bld['Плита Фпм-1 ГПУ-1']['dist']) + ' м', 'так'),
        ('Фундаменти, місце В: PCS / BESS', '≥ 0,6 м · 2.3.85', 'під PCS / ' + f2(bs[('V', 'BESS')]['dist']) + ' м', 'НІ'),
        ('Фундаменти, місце В′: PCS / BESS', '≥ 0,6 м · 2.3.85', f2(bs[('V2', 'PCS')]['dist']) + ' / ' + f2(bs[('V2', 'BESS')]['dist']) + ' м', 'так'),
        ('Муфта №2 до КЛ №1', '≥ 0,25 м · 2.3.100', f2(ch['muff']['dist']) + ' м', 'так'),
    ]
    yb = m.spec_table(p, rx, 279.0, [('Що перевірено', 62, 'l'), ('Норма, пункт ПУЕ', 44, 'l'), ('У моделі', 31, 'r'), ('Висновок', 18, 'c')],
                      rows, size=5.9, rh=4.4)
    for i, r in enumerate(rows):
        if r[3] != 'так':
            yy = 279.0 - 5.2 - (i + 1) * 4.4
            p.rect(rx + 137.2, yy + 0.4, 17.6, 3.6, w=0.35, col=HIT if r[3] == 'НІ' else m.ACC)
    # ---- умовні позначення
    ly = yb - 7.5
    p.text(rx, ly, 'Умовні позначення', 8.6, 'B')
    items = [(KL, None, 0.7, 'нові КЛ-6 кВ за кресленням траси'), (KL, [2.0, 1.2], 0.45, 'лінія 6 кВ від PCS — умовно'),
             (m.INK, [2.2, 0.8], 0.3, 'межі пучка труб проколу'), (C['gas'], None, 0.35, 'газопровід (генплан 2023)'),
             (C['water'], None, 0.35, 'водопровід'), (C['cable6'], None, 0.25, 'кабелі 6 кВ існуючі'), (C['cable'], None, 0.25, 'інші кабелі'),
             (HIT, [1.6, 1.0], 0.45, 'BESS на місці В (вибране раніше)')]
    yy = ly - 5.0
    for i, (col, dash, w, t) in enumerate(items):
        xx = rx + (i % 2) * 80
        if i and i % 2 == 0: yy -= 4.4
        p.line(xx, yy + 1.0, xx + 9, yy + 1.0, w, col, dash=dash); p.text(xx + 11, yy, t, 6.0)
    yy -= 4.6
    p.rect(rx, yy - 0.2, 9, 3.0, w=0.5, fill=(0.98, 0.91, 0.82)); p.text(rx + 11, yy, 'BESS і PCS на місці В′ (запропоновано)', 6.0)
    p.poly([(rx + 84.5, yy + 2.6), (rx + 85.7, yy + 1.0), (rx + 84.5, yy - 0.6), (rx + 83.3, yy + 1.0)], 0.3, KL, fill=KL, close=True); p.text(rx + 91, yy, 'з’єднувальна муфта', 6.0)
    yy -= 4.4
    p.circle(rx + 4.5, yy + 1.0, 2.0, w=0.6, col=HIT); p.text(rx + 11, yy, 'порушення норми', 6.0)
    p.rect(rx + 80, yy - 0.3, 9, 3.0, w=0.45, col=(0.55, 0.35, 0.12), fill=(0.96, 0.9, 0.8)); p.text(rx + 91, yy, 'котлован', 6.0)
    # ---- примітки
    notes = [
        'Трасу знято зі знімку креслення траси КЛ-6 кВ (телефон, 21.10.2026). Знімок прив’язано за майданчиком ГПУ 20 × 16 м: масштаб 18,93 пкс/м, поворот 1,49°. Точність ±1 м. Газопроводи біля паркану 14/20 і будівля №2 зі знімку лягають на генплан з розбіжністю до 0,7 м, довжина КЛ №2 (≈ 53 м разом з опусканням у котловани і 10 м по РУ) відповідає підпису Lзаг = 55 м.',
        'РП «Алюміній» — західна двоповерхова прибудова алюмінієвого корпусу 9: приймальний котлован стоїть під її західною стіною. Креслень РП у матеріалах немає.',
        'ГПУ стоять як у томі КБ. На кресленні траси ГПУ-1 показано дзеркально до ГПУ-2 (обладнання на даху — з південного боку). У томі КБ плити однакові, отвір 600 × 400 під кабелі — біля південного краю кожної.',
        'Місце В несумісне з трасою: прокол проходить під блоком PCS. Запропоновано місце В′ — той самий комплект на 9,5 м північніше; його фундаменти — на аркушах 3–6.',
        'КЛ від муфт до робочого котлована йде впритул до газопроводу від ШРП, котлован — на ньому. Звірити з оригіналом креслення; за потреби відсунути КЛ на захід або погодити з газовою службою.',
        'Перед проколом і копанням котлованів шурфами уточнити положення і глибину газопроводів і кабелів (усі глибини існуючих мереж на генплані умовні).',
    ]
    ny_ = yy - 8.0
    p.text(rx, ny_, 'Примітки', 8.6, 'B')
    y1 = ny_ - 4.4
    for i, s in enumerate(notes, 1):
        p.text(rx, y1, '%d.' % i, 6.0)
        y1 = p.para(rx + 3.8, y1, s, 172.0, 6.0, lead=2.7) - 0.5
    cv.showPage()


def sheet_profile(cv, m, D, Q):
    p = m.Pen(cv)
    SRC = 'Джерела: креслення траси КЛ-6 кВ (знімок 21.10.2026), рельєф і мережі — 3D-модель площадки, фундаменти — Golen Annex 1'
    frame(m, p, ['Профіль траси КЛ-6 кВ №2, перерізи', 'Порівняння варіантів фундаменту BESS / PCS'], '1 : 250 / 1 : 50; 1 : 20', 2, SRC)
    R = D['route']; T = [t for t in R['trunk'] if t['id'].endswith('№2')][0]; KLp = [k for k in R['kl'] if k['id'].endswith('№2')][0]
    pts = KLp['p'][2:] + T['p'][1:]
    s = [0.0]
    for i in range(1, len(pts)):
        s.append(s[-1] + math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    G = D['grid']; X0, X1, Y0, Y1 = D['win']
    def hz(x, y):
        fx = min(G['nx'] - 1.001, max(0, x - X0)); fy = min(G['ny'] - 1.001, max(0, y - Y0)); i = int(fx); j = int(fy); tx = fx - i; ty = fy - j; a = j * G['nx'] + i; H = G['cm']
        return (H[a] * (1 - tx) * (1 - ty) + H[a + 1] * tx * (1 - ty) + H[a + G['nx']] * (1 - tx) * ty + H[a + G['nx'] + 1] * tx * ty) / 100.0
    kh, kv = 4.0, 20.0
    sx0, sy0, zref = 52.0, 206.0, -3.4                 # z = -3,4 at the bottom line of the profile
    SX = lambda v: sx0 + v * kh
    SZ = lambda z: sy0 + (z - zref) * kv
    p.view_title(24, 288.5, 'Поздовжній профіль КЛ-6 кВ №2', 'М гор. 1 : 250, верт. 1 : 50 · від виходу з ГПУ-2 до стіни РП')
    smax = s[-1]
    # сітка позначок
    for zz in [x / 2.0 for x in range(-6, 1)]:
        p.line(SX(0), SZ(zz), SX(smax), SZ(zz), m.W_HAIR, (0.8, 0.82, 0.84))
        p.text(SX(0) - 1.5, SZ(zz) - 0.9, ('%.2f' % (320.2 + zz)).replace('.', ','), 5.6, anchor='r', col=m.MUTED)
    gpts = [(SX(si), SZ(hz(q[0], q[1]))) for si, q in zip(s, pts)]
    p.poly(gpts, 0.5, m.INK)
    p.poly([(SX(si), SZ(q[2])) for si, q in zip(s, pts)], 0.8, KL)
    # пікети: котловани, прокол, муфта, перетини
    def s_at(xy):
        best = (1e9, 0)
        for si, q in zip(s, pts):
            d = math.hypot(q[0] - xy[0], q[1] - xy[1])
            if d < best[0]: best = (d, si)
        return best[1]
    marks = [(s_at((21.1, 18.71)), 'муфта №2'), (s_at(R['bore']['a']), 'початок проколу'), (s_at(R['bore']['b']), 'кінець проколу'), (smax, 'стіна РП')]
    for pt in R['pits']:
        sc = s_at(pt['c']); w = pt['l'] * kh
        p.rect(SX(sc) - w / 2, SZ(pt['z'] - pt['d']), w, pt['d'] * kv, w=0.35, col=(0.55, 0.35, 0.12), fill=(0.96, 0.9, 0.8))
        p.text(SX(sc), SZ(pt['z']) + 2.0, ('робочий котлован' if pt['l'] == 3 else 'приймальний котлован'), 5.6, anchor='c', col=(0.45, 0.28, 0.08))
    for j, (si, t) in enumerate(marks):
        p.line(SX(si), SZ(-3.4), SX(si), SZ(0.05), m.W_HAIR, m.MUTED, dash=[0.8, 0.8])
        p.text(SX(si), SZ(0.15) + (3.2 if j % 2 else 0), t, 5.4, anchor='c', col=m.MUTED)
    seen = []
    for c in D['checks']['cross']:
        if not c['line'].endswith('№2'): continue
        si = s_at((c['x'], c['y']))
        if any(abs(si - a) < 3 and c['net'] == b for a, b in seen): continue
        seen.append((si, c['net']))
        col = C.get(c['net'], (0.4, 0.4, 0.4))
        p.circle(SX(si), SZ(c['zn']), 1.3, w=0.35, col=col, fill=(1, 1, 1))
        p.text(SX(si) + 1.8, SZ(c['zn']) - 0.9, NAME[c['net']] + ' (умовно)', 5.4, col=col)
    # таблиця під профілем
    ty = 199.0
    rows_t = [('Земля, м', lambda q: ('%.2f' % (320.2 + hz(q[0], q[1]))).replace('.', ',')), ('Вісь труби, м', lambda q: ('%.2f' % (320.2 + q[2])).replace('.', ',')),
              ('Глибина осі, м', lambda q: f2(hz(q[0], q[1]) - q[2]))]
    p.rect(SX(0) - 28, ty - 3 * 5.0 - 5.0, 28 + smax * kh, 4 * 5.0, w=m.W_VIS)
    for i in range(1, 4):
        p.line(SX(0) - 28, ty - i * 5.0, SX(smax), ty - i * 5.0, m.W_THIN)
    p.line(SX(0), ty, SX(0), ty - 20.0, m.W_THIN)
    for i, (t, fn) in enumerate(rows_t):
        p.text(SX(0) - 27, ty - (i + 1) * 5.0 + 1.6, t, 5.8, 'B')
    p.text(SX(0) - 27, ty - 4 * 5.0 + 1.6, 'Пікет, м', 5.8, 'B')
    stations = [x * 5.0 for x in range(0, int(smax / 5) + 1)]
    if smax - stations[-1] > 2.5: stations.append(smax)
    for st in stations:
        q = None
        for i in range(1, len(s)):
            if s[i] >= st - 1e-6:
                t_ = (st - s[i - 1]) / max(1e-9, s[i] - s[i - 1]); a, b = pts[i - 1], pts[i]
                q = [a[0] + (b[0] - a[0]) * t_, a[1] + (b[1] - a[1]) * t_, a[2] + (b[2] - a[2]) * t_]; break
        if q is None: q = pts[-1]
        xx = SX(st)
        if st > 0: p.line(xx, ty, xx, ty - 20.0, m.W_HAIR)
        for i, (t, fn) in enumerate(rows_t):
            p.text(xx + 0.6, ty - (i + 1) * 5.0 + 1.0, fn(q), 4.9, rot=90 if False else 0)
        p.text(xx + 0.6, ty - 4 * 5.0 + 1.0, f1(st), 4.9)

    # ---- переріз траншеї, 1:20
    k = 2.5
    tx0, tyg = 330.0, 262.0
    XT = lambda x: tx0 + x * 1000 / 20.0 / 1000.0 * 1000 / 1000 * 50  # 1 м = 50 мм
    XT = lambda x: tx0 + x * 50.0
    YT = lambda z: tyg + z * 50.0
    p.view_title(272, 288.5, 'Переріз траншеї', 'М 1 : 20')
    p.poly([(XT(-0.35), YT(0)), (XT(-0.35), YT(-1.0)), (XT(0.35), YT(-1.0)), (XT(0.35), YT(0))], 0.45)
    p.line(XT(-0.9), YT(0), XT(-0.35), YT(0), 0.4); p.line(XT(0.35), YT(0), XT(0.9), YT(0), 0.4)
    p.soil(XT(-0.9), XT(-0.35), YT(0), depth=2.4); p.soil(XT(0.35), XT(0.9), YT(0), depth=2.4)
    p.rect(XT(-0.35), YT(-1.0), 0.7 * 50, 0.3 * 50, w=0, fill=(0.97, 0.94, 0.86))
    for xc in (-0.125, 0.125):
        p.circle(XT(xc), YT(-0.9 + 0.0), 0.07 * 50, w=0.4, col=m.ACC, fill=(1, 1, 1))
        for a in (90, 210, 330):
            p.circle(XT(xc) + math.cos(math.radians(a)) * 1.2, YT(-0.9) + math.sin(math.radians(a)) * 1.2, 1.0, w=0.25, col=KL, fill=KL)
    p.line(XT(-0.3), YT(-0.5), XT(0.3), YT(-0.5), 0.5, HIT, dash=[1.2, 0.6])
    p.rect(XT(-0.5), YT(-0.08), 1.0 * 50, 0.08 * 50, w=0.3, fill=(0.85, 0.85, 0.85))
    p.leader(XT(0.125), YT(-0.9), XT(0.55), YT(-0.75), '', lines=['2 труби d140, у кожній', '3 × 1 × 240/50'], size=5.8)
    p.leader(XT(0.25), YT(-0.5), XT(0.55), YT(-0.42), 'сигнальна стрічка', size=5.8)
    p.leader(XT(-0.2), YT(-0.95), XT(-0.6), YT(-1.25), '', lines=['піщана подушка і засипка'], size=5.8, anchor='r')
    p.leader(XT(0.4), YT(-0.04), XT(0.55), YT(0.12), 'бруківка — розібрати й відновити', size=5.8)
    p.dim_v(YT(-0.9), YT(0), XT(-0.35), XT(-0.62), '900', size=5.8)
    p.dim_h(XT(-0.125), XT(0.125), YT(-1.0), YT(-1.0) - 5.0, '250', size=5.8)
    p.text(XT(0), YT(-1.0) - 10.5, 'до верху труби 830 ≥ 700 (ПУЕ 2.3.84)', 5.8, anchor='c', col=m.MUTED)

    # ---- переріз проколу, 1:20
    bx0, byg = 330.0, 175.0
    XB = lambda x: bx0 + x * 50.0
    YB = lambda z: byg + z * 50.0
    p.view_title(272, 192.0, 'Переріз проколу', 'М 1 : 20')
    p.line(XB(-0.7), YB(0), XB(0.7), YB(0), 0.4); p.soil(XB(-0.7), XB(0.7), YB(0), depth=2.4)
    p.line(XB(-0.7), YB(-1.2), XB(0.7), YB(-1.2), m.W_HAIR, C['gas'], dash=[1.4, 0.8]); p.text(XB(0.72), YB(-1.2) - 0.8, 'газ ≈ 1,2 м (умовно)', 5.4, col=C['gas'])
    for (dx, dz, work) in ((-0.13, 0, 1), (0.13, 0, 1), (-0.13, 0.2, 0), (0.13, 0.2, 0)):
        p.circle(XB(dx), YB(-1.6 + dz), 0.08 * 50, w=0.45, col=m.INK, fill=(1, 1, 1))
        if work:
            for a in (90, 210, 330):
                p.circle(XB(dx) + math.cos(math.radians(a)) * 1.3, YB(-1.6 + dz) + math.sin(math.radians(a)) * 1.3, 1.05, w=0.25, col=KL, fill=KL)
    p.leader(XB(0.13), YB(-1.6), XB(0.35), YB(-1.95), '', lines=['робочі труби SDR17 (Ø прийнято 160)', 'з 3 × 1 × 240/50'], size=5.6)
    p.leader(XB(0.13), YB(-1.4), XB(0.35), YB(-1.05) - 3, '', lines=['резервні труби (к-сть уточнити)'], size=5.6)
    p.dim_v(YB(-1.6), YB(0), XB(-0.25), XB(-0.55), '1600', size=5.8)

    # ---- порівняння варіантів фундаменту
    p.view_title(24, 168.0, 'Фундамент BESS і PCS: два варіанти', '(на 1 фундамент; усього 2 — BESS і PCS)')
    q1, q2 = Q[1] if 1 in Q else Q['1'], Q[2] if 2 in Q else Q['2']
    def row(t, a, b, fmt, unit, diff=True):
        return (t, fmt(a) + unit, fmt(b) + unit, (('−' if b < a else '+') + fmt(abs(b - a)) + unit) if diff and abs(b - a) > 1e-9 else '—')
    lvl = lambda z: ('−%.3f' % (abs(z) / 1000.0)).replace('.', ',')
    rows = [
        ('Низ обв’язувальної балки', lvl(q1['bot']), lvl(q2['bot']), '+0,350'),
        ('Висота колон і кладки', f2(q1['h']) + ' м', f2(q2['h']) + ' м', '−0,35 м'),
        row('Бетон C25: балка 350 × 350', q1['beam'], q2['beam'], f2, ' м³'),
        row('Бетон C25: колони 8 шт.', q1['cols'], q2['cols'], f2, ' м³'),
        ('b', 'Бетон C25 разом', f2(q1['conc']) + ' м³', f2(q2['conc']) + ' м³', '−' + f2(q1['conc'] - q2['conc']) + ' м³'),
        row('Цегляна кладка, М20', q1['brick'], q2['brick'], f2, ' м³'),
        row('Площа кладки', q1['wall'], q2['wall'], f1, ' м²'),
        row('Підготовка C8/10, 100 мм', q1['prep'], q2['prep'], f2, ' м³'),
        ('b', 'Сталь (арк. 4 / 6)', '≈ %d кг' % round(q1['steel']), '≈ %d кг' % round(q2['steel']), '−%d кг' % round(q1['steel'] - q2['steel'])),
        ('Тиск під балкою (BESS 43 т)', '≈ %d кПа' % q1['press'], '≈ %d кПа' % q2['press'], '—'),
        ('Креслення', 'аркуші 3, 4', 'аркуші 5, 6', ''),
    ]
    yb = m.spec_table(p, 24.0, 163.5, [('Позиція', 58, 'l'), ('Варіант 1\nяк у Golen', 30, 'r'), ('Варіант 2\nглибина 1,5 м', 30, 'r'), ('Різниця', 26, 'r')], rows, size=6.0, rh=4.4, hh=7.0)
    notes = [
        'Обидва варіанти — та сама конструкція Golen: обв’язувальна балка 350 × 350 внизу, 8 колон 350 × 350 і цегляна кладка між ними; у варіанті 2 підошву піднято на 350 мм.',
        'Позначки — від середньої позначки землі під блоком: місце В′ — ' + ('%.2f' % (320.2 + [s for s in D['bess'] if s['key'] == 'V2'][0]['gb'])).replace('.', ',') + ' (BESS) і ' + ('%.2f' % (320.2 + [s for s in D['bess'] if s['key'] == 'V2'][0]['gp'])).replace('.', ',') + ' (PCS). Різницю рельєфу між блоками (≈ 0,27 м) вирівняти плануванням.',
        'Вибір варіанта — за розрахунком основи і нормативною глибиною промерзання для ґрунтів площадки (ДБН В.2.1-10, вишукування). Фундамент PCS прийнято того самого типу: Golen його не дав.',
        'Від проколу до фундаментів на місці В′ — 1,0 м (PCS) і 4,5 м (BESS) у плані; прокол іде глибше за підошву обох варіантів, тож при проколі контролювати положення головки.',
    ]
    y1 = yb - 7.0
    p.text(24, y1, 'Примітки', 8.6, 'B'); y1 -= 4.4
    for i, s_ in enumerate(notes, 1):
        p.text(24, y1, '%d.' % i, 6.0); y1 = p.para(27.8, y1, s_, 196.0, 6.0, lead=2.7) - 0.5
    cv.showPage()
