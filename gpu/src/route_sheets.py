# -*- coding: utf-8 -*-
"""Аркуші 1–3: план мереж (BESS навпроти ГПУ, КЛ-6 кВ і зв’язок до РП «Алюміній», перекладання існуючих КЛ),
профіль КЛ BESS з перерізами, розрахунок кабелів і деталь перекладання."""
import math

C = {'water': (0.04, 0.56, 0.41), 'gas': (0.78, 0.57, 0.0), 'cable6': (0.82, 0.14, 0.17), 'cable': (0.56, 0.25, 0.68),
     'heat': (0.77, 0.34, 0.11), 'sewer': (0.48, 0.33, 0.2), 'storm': (0.48, 0.33, 0.2)}
KL = (0.76, 0.09, 0.36)          # нові КЛ-6 кВ
RER = (0.48, 0.12, 0.64)         # вставки перекладених КЛ
CM = (0.0, 0.54, 0.48)           # канал зв'язку
REL = (0.55, 0.58, 0.61)         # ділянки під демонтаж
HIT = (0.88, 0.08, 0.18)
PIT = (0.55, 0.35, 0.12)
NAME = {'water': 'водопровід', 'gas': 'газопровід', 'cable6': 'кабель 6 кВ', 'cable': 'кабель', 'heat': 'теплотраса', 'sewer': 'каналізація', 'storm': 'дощова каналізація',
        'rer': 'вставка КЛ 6 кВ', 'new6': 'нова КЛ 6 кВ', 'comm': 'зв’язок'}
TOTAL = 7
f2 = lambda v: ('%.2f' % v).replace('.', ',')
f1 = lambda v: ('%.1f' % v).replace('.', ',')
ab = lambda z: ('%.2f' % (320.2 + z)).replace('.', ',')


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
        sz = 10.5
        while p.tw(row, sz, 'B') > 111 and sz > 7: sz -= 0.3
        p.text(x0 + 2, yy, row, sz, 'B'); yy -= 5.2
    p.text(x0 + 2, y0 + 2.3, src, 5.6 if p.tw(src, 5.6) < 112 else 5.0, col=m.MUTED)
    for i, (k, v) in enumerate([('Стадія', 'Ескіз'), ('Масштаб', scale), ('Дата', '21.10.2026'), ('Аркуш', '%d / %d' % (num, TOTAL))]):
        yb = y0 + h_ - (i + 1) * 10
        p.text(xs + 1.5, yb + 3.6, k, 6.2, col=m.MUTED); p.text(xs + 24, yb + 3.3, v, 8.6 if len(v) < 20 else 7.0, 'B')
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


def foot(c, hl=3.079, hb=1.269):
    return [(c[0] - hl, c[1] - hb), (c[0] + hl, c[1] - hb), (c[0] + hl, c[1] + hb), (c[0] - hl, c[1] + hb)]


def num_tag(p, x, y, n, col=None, r=2.0, size=6.2):
    col = col or (0.08, 0.1, 0.13)
    p.circle(x, y, r, w=0.3, col=col, fill=(1, 1, 1))
    p.text(x, y - size * 0.125, str(n), size, 'B', anchor='c', col=col)


def check_rows(D):
    ch = D['checks']
    bs = {(c['kind'], c['what']): c for c in ch['bess']}
    gpar = [c for c in ch['par'] if c.get('from_drawing') and not c['ok']]
    gb = [c for c in ch['cross'] if c['bc'] == 'gas' and c['bore']]
    gtop = min(c['gap'] for c in gb if 'зв’язок' in c['a']); gbot = min(c['gap'] for c in gb if 'зв’язок' not in c['a'])
    xb = [c['gap'] for c in ch['cross'] if 'BESS' in c['a'] and c['bc'] in ('cable6', 'rer')]
    xc = [c['gap'] for c in ch['cross'] if ('зв’язок' in c['a'] or c['bc'] == 'comm') and not c['bore']]
    pc = [c['dist'] for c in ch['par'] if c['bc'] == 'comm' or 'зв’язок' in c['a']]
    jb = [j for j in ch['joints'] if not j['ok']]
    bld = {c['name']: c for c in ch['bld']}
    dp = ch['depth']
    rf = min(bs[('BESS', 'вставки перекладених КЛ')]['dist'], bs[('PCS', 'вставки перекладених КЛ')]['dist'])
    rng = lambda v: f2(min(v)) + ('–' + f2(max(v)) if max(v) - min(v) >= 0.005 else '')
    return [
        ('Глибина до верху труби: КЛ ГПУ / BESS / зв’язок', '≥ 0,7 м · 2.3.84', '%s / %s / %s' % (f2(dp['trench_top']), f2(dp['bess_top']), f2(dp['comm_top'])), 'так'),
        ('Зв’язок над перетинами (≤ 5 м, у трубах)', '≥ 0,5 м · 2.3.84', f2(dp['comm_x_top']) + ' м', 'так'),
        ('BESS / PCS до газопроводів', '2 м низ., 4 м сер. · ДБН 360-92', '%s / %s м' % (f2(bs[('BESS', 'газопровід (низький тиск)')]['dist']), f2(bs[('PCS', 'газопровід (низький тиск)')]['dist'])), 'тиск?'),
        ('Фундаменти BESS, PCS до вставок КЛ', '≥ 0,6 м · 2.3.85', f2(rf) + ' м', 'так'),
        ('Вставки КЛ до газопроводів біля паркану', '≥ 1 м · 2.3.88', f2(ch['rer_gas']['dist']) + ' м', 'так'),
        ('Муфти вставок до сусіднього кабелю', '≥ 0,25 м · 2.3.100', f2(min(j['dist'] for j in jb)) + ' → ' + f2(min(j['after'] for j in jb)) + ' м', 'відвести'),
        ('КЛ BESS × існуючі КЛ і вставки', '≥ 0,15 м у трубах · 2.3.94', rng(xb) + ' м', 'так'),
        ('Зв’язок × КЛ і газопровід', '≥ 0,15 / 0,25 м · 2.3.94, 95', rng(xc) + ' м', 'так'),
        ('Зв’язок уздовж силових КЛ', '≥ 0,1 м · 2.3.86', 'від ' + f2(min(pc)) + ' м', 'так'),
        ('Прокол × газопроводи: верх. / ниж. ряд', '≥ 0,25 м у трубі · 2.3.95', '%s / %s м' % (f2(gtop), f2(gbot)), 'так'),
        ('КЛ ГПУ уздовж газу від ШРП (креслення)', '≥ 1 м · 2.3.88', rng([c['dist'] for c in gpar]) + ' м', 'НІ'),
        ('Складська будівля №2 (проект)', '≥ 0,6 м · 2.3.85', f2(bld['Складська будівля №2 (проект)']['dist']) + ' м', 'так'),
        ('РП «Алюміній», крім вводів', '≥ 0,6 м · 2.3.85', f2(bld['РП «Алюміній», крім вводів']['dist']) + ' м', 'так'),
        ('Плити Фпм-1 під ГПУ', '≥ 0,6 м · 2.3.85', f2(bld['Плита Фпм-1 ГПУ-1']['dist']) + ' м', 'так'),
    ]


def sheet_plan(cv, m, D, Q):
    p = m.Pen(cv)
    SRC = 'Джерела: креслення траси КЛ-6 кВ (знімок 21.10.2026), том 4 КБ 15/2026-02-КБ, генплан 2023, Golen Annex 1, 3D-модель площадки'
    frame(m, p, ['План мереж: BESS навпроти ГПУ, КЛ-6 кВ і зв’язок', 'до РП «Алюміній», перекладання існуючих КЛ'], '1 : 250', 1, SRC)
    k = 4.0                                      # 1 : 250
    x0, y0, ox, oy = -4.0, -2.0, 24.0, 48.0
    X = lambda x: ox + (x - x0) * k
    Y = lambda y: oy + (y - y0) * k
    p.view_title(24, 288.5, 'План', 'М 1 : 250 · осі тому КБ: x від осі 1 на схід, y від осі А на північ')
    cv.saveState(); pth = cv.beginPath(); pth.rect(X(-4) * m.mm, Y(-2) * m.mm, 51.5 * k * m.mm, 59.5 * k * m.mm); cv.clipPath(pth, stroke=0, fill=0)
    R = D['route']; S = D['bess'][0]
    for c in (S['bess'], S['pcs']):
        p.poly([(X(a), Y(b)) for a, b in foot(c)], 0.5, m.INK, fill=(0.98, 0.91, 0.82), close=True)
        p.poly([(X(a), Y(b)) for a, b in foot(c, 3.029, 1.219)], 0.3, m.ACC, dash=[3, 0.8, 0.5, 0.8], close=True)
    p.rect(X(S['pcs'][0] - 0.4), Y(S['bess'][1] + 1.269), 0.8 * k, (S['pcs'][1] - S['bess'][1] - 2.538) * k, w=0.3, fill=(0.9, 0.9, 0.9))
    for l in D['lines']:
        col = REL if l.get('rel') else C.get(l['c'], (0.5, 0.5, 0.5))
        pts = [(X(q[0]), Y(q[1])) for q in l['p']]
        p.poly(pts, 0.5 if l.get('rel') else 0.35 if l['c'] in ('water', 'gas', 'heat', 'sewer') else 0.25, col,
               dash=[1.0, 0.7] if l.get('rel') else [1.6, 0.9] if l['x'] or l['i'] == 9117 else None)
    for w in D['wells']:
        p.circle(X(w['x']), Y(w['y']), 1.6, w=0.25, col=C.get(w['c'], (0.4, 0.4, 0.4)))
    for o in D['objs']:
        if o['t'] == 'ШРП':
            p.rect(X(o['x']) - 3.6, Y(o['y']) - 2.0, 7.2, 4.0, w=0.3, col=C['gas'], fill=(1, 0.95, 0.8)); p.text(X(o['x']), Y(o['y']) - 0.9, 'ШРП', 5.4, 'B', anchor='c')
        else:
            p.circle(X(o['x']), Y(o['y']), 2.0, w=0.3, col=C['water'])
    for f in D['fences']:
        pts = [(X(q[0]), Y(q[1])) for q in f['xy']]
        p.poly(pts, 0.3, (0.35, 0.38, 0.42))
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1])
            if L < 1: continue
            for t in range(1, int(L / 6) + 1):
                q = (a[0] + (b[0] - a[0]) * t * 6 / L, a[1] + (b[1] - a[1]) * t * 6 / L); dx, dy = (b[1] - a[1]) / L, -(b[0] - a[0]) / L
                p.line(q[0], q[1], q[0] + dx * 1.2, q[1] + dy * 1.2, 0.25, (0.35, 0.38, 0.42))
    for b in D['parts']:
        pts = [(X(q[0]), Y(q[1])) for q in b['xy']]
        p.poly(pts, 0.45, m.INK, dash=[2.4, 1.0] if 'проект' in b['name'] else None, fill=(0.97, 0.93, 0.85) if 'проект' in b['name'] else (0.93, 0.93, 0.93), close=True)
    rp = D['rp']
    p.poly([(X(q[0]), Y(q[1])) for q in rp['xy']], 0.6, m.INK, fill=(0.95, 0.86, 0.80), close=True)
    p.poly([(X(q[0]), Y(q[1])) for q in rp['tr']['xy']], 0.3, m.MUTED, dash=[1.2, 0.8], close=True)
    p.rect(X(-2.02), Y(1.02), 20 * k, 16 * k, w=0.35, col=(0.12, 0.25, 0.6), dash=[2.0, 0.8])
    for y in (3, 11):
        p.rect(X(0), Y(y), 16 * k, 4 * k, w=0.3, fill=(0.9, 0.91, 0.92))
        p.rect(X(0.48), Y(y + 0.5), 14.94 * k, 3.25 * k, w=0.45, col=(0.12, 0.25, 0.6), fill=(0.86, 0.9, 0.97))
    p.text(X(8), Y(13.1) - 1.2, 'ГПУ-2 · 2 500 кВт', 7.0, 'B', anchor='c', col=(0.12, 0.25, 0.6))
    p.text(X(8), Y(5.1) - 1.2, 'ГПУ-1 · 2 500 кВт', 7.0, 'B', anchor='c', col=(0.12, 0.25, 0.6))
    for (fx, fy) in ((0, 18), (19, 0)):
        p.rect(X(fx - 1.2), Y(fy - 1.2), 2.4 * k, 2.4 * k, w=0.3, fill=(0.9, 0.91, 0.92))
    p.text(X(S['bess'][0] - 0.8), Y(S['bess'][1]) - 1.2, 'BESS', 6.8, 'B', anchor='c')
    p.text(X(S['pcs'][0] - 0.8), Y(S['pcs'][1]) - 1.2, 'PCS + Т 6 кВ', 6.4, 'B', anchor='c')
    # ---- нові мережі
    for r in R['reroute']:
        p.poly([(X(q[0]), Y(q[1])) for q in r['p']], 0.6, RER)
    for c in R['comms']:
        p.poly([(X(q[0]), Y(q[1])) for q in (c['p'][1:] if c['p'][0][2] > 0 else c['p'][:-1])], 0.5, CM, dash=[1.6, 0.7])
    for kl in R['kl']:
        p.poly([(X(q[0]), Y(q[1])) for q in kl['p'][1:]], 0.7, KL)
    for T in R['trunk']:
        p.poly([(X(q[0]), Y(q[1])) for q in T['p'][:-1]], 0.7, KL)
    for mf in R['muffs']:
        x_, y_ = X(mf['x']), Y(mf['y'])
        p.poly([(x_, y_ + 1.8), (x_ + 1.2, y_), (x_, y_ - 1.8), (x_ - 1.2, y_)], 0.3, KL, fill=KL, close=True)
    for j in R['joints']:
        x_, y_ = X(j['x']), Y(j['y'])
        p.poly([(x_, y_ + 1.5), (x_ + 1.0, y_), (x_, y_ - 1.5), (x_ - 1.0, y_)], 0.3, RER, fill=RER, close=True)
    kk = R['kks']; p.rect(X(kk['x']) - 1.4, Y(kk['y']) - 1.2, 2.8, 2.4, w=0.4, col=CM, fill=(0.88, 0.97, 0.95))
    for pt in R['pits']:
        p.poly([(X(a), Y(b)) for a, b in rot_rect(pt['c'], pt['u'], pt['l'], pt['w'])], 0.45, PIT, fill=(0.96, 0.9, 0.8), close=True)
    B = R['bore']
    u = (B['b'][0] - B['a'][0], B['b'][1] - B['a'][1]); L = math.hypot(*u); u = (u[0] / L, u[1] / L); n = (u[1], -u[0])
    for s_ in (-0.36, 0.36):
        p.line(X(B['a'][0] + n[0] * s_), Y(B['a'][1] + n[1] * s_), X(B['b'][0] + n[0] * s_), Y(B['b'][1] + n[1] * s_), 0.3, m.INK, dash=[2.2, 0.8])
    p.circle(X(21.7), Y(16.3), 4.6, w=0.6, col=HIT)
    p.circle(X(22.2), Y(21.9), 6.4, w=0.6, col=HIT)
    cv.restoreState()
    # ---- позиції на плані
    tags = [
        (1, (18.7, 4.9), (18.2, -0.9)), (2, (21.5, 10.79), (24.0, 10.2)), (2, (21.1, 18.71), (19.0, 20.6)),
        (3, (21.62, 15.0), (19.5, 15.2)), (4, (S['pcs'][0] - 2.4, 19.0), (25.0, 19.4)), (5, (S['pcs'][0] - 1.9, 18.6), (29.4, 20.2)),
        (5, (18.2, 12.8), (17.7, 9.1)), (6, (kk['x'], kk['y']), (19.2, 11.2)), (7, R['pits'][0]['c'], (19.4, 24.3)),
        (8, ((B['a'][0] + B['b'][0]) / 2, (B['a'][1] + B['b'][1]) / 2), (33.5, 34.8)), (9, R['pits'][1]['c'], (37.4, 49.3)),
        (10, (41.71, 52.5), (40.1, 55.3)), (11, (S['bess'][0] + 1.9, S['bess'][1]), (S['bess'][0] + 1.9, S['bess'][1])),
        (12, (S['pcs'][0] + 1.9, S['pcs'][1]), (S['pcs'][0] + 1.9, S['pcs'][1])), (13, (33.0, 11.0), (35.9, 11.0)),
        (14, (R['joints'][0]['x'], R['joints'][0]['y']), (27.4, 1.8)), (15, (27.3, 11.0), (27.3, 11.0)), (16, (22.42, 13.5), (23.6, 14.4)),
        (16, (25.55, 0.0), (23.6, 0.6)),
    ]
    for n_, (ox_, oy_), (tx, ty) in tags:
        col = RER if n_ in (13, 14) else CM if n_ in (5, 6) else HIT if n_ == 15 else None
        if (tx, ty) != (ox_, oy_):
            p.line(X(ox_), Y(oy_), X(tx), Y(ty), m.W_HAIR + 0.03); p.circle(X(ox_), Y(oy_), 0.32, w=0, fill=m.INK)
        num_tag(p, X(tx), Y(ty), n_, col)
    p.text(X(22.9), Y(17.4), 'А', 8.0, 'B', anchor='c', col=HIT); p.text(X(24.1), Y(23.5), 'Б', 8.0, 'B', anchor='c', col=HIT)
    lab = lambda x, y, tx, ty, t, **kw: p.leader(X(x), Y(y), X(tx), Y(ty), t, size=kw.get('size', 6.0), lines=kw.get('lines'), anchor=kw.get('anchor', 'l'), bg=(1, 1, 1))
    lab(44.2, 47.5, 46.6, 44.0, '', lines=['РП «Алюміній»', '(зах. прибудова корп. 9)'], anchor='r')
    lab(34.1, 43.6, 38.0, 38.0, '', lines=['газопроводи вздовж', 'паркану 14/20'])
    for b in D['parts']:
        if 'проект' in b['name']:
            p.text(X(12.0), Y(30.0), 'Складська будівля №2 (проект)', 7.0, 'B', anchor='c', col=m.MUTED)
    p.text(X(2.0), Y(17.35), 'майданчик ГПУ 20 × 16 м', 5.8, col=(0.12, 0.25, 0.6))
    p.dim_h(X(15.42), X(S['bess'][0] - 3.029), Y(7.6), Y(9.5), f1(D['checks']['gpu_bess']['dist']) + ' м', size=5.8)
    a_, b_ = (B['a'][0] - n[0] * 1.6, B['a'][1] - n[1] * 1.6), (B['b'][0] - n[0] * 1.6, B['b'][1] - n[1] * 1.6)
    p.line(X(a_[0]), Y(a_[1]), X(b_[0]), Y(b_[1]), m.W_HAIR + 0.03)
    for q in (a_, b_):
        p.tick(X(q[0]), Y(q[1]))
    mid = ((a_[0] + b_[0]) / 2 - n[0] * 0.5, (a_[1] + b_[1]) / 2 - n[1] * 0.5)
    p.text(X(mid[0]), Y(mid[1]), 'L = 33,0', 6.4, anchor='c', rot=math.degrees(math.atan2(u[1], u[0])))
    nx_, ny_ = 38.0, 266.0
    p.circle(nx_, ny_ + 2.5, 8.0, w=0.25, fill=(1, 1, 1))
    a = math.radians(1.46)
    tip = (nx_ + math.sin(a) * 9, ny_ + math.cos(a) * 9)
    p.poly([(nx_ - 2.2, ny_ - 3), tip, (nx_ + 2.2, ny_ - 3), (nx_, ny_ - 1.4)], 0.3, m.INK, fill=m.INK, close=True)
    p.text(tip[0], tip[1] + 1.4, 'Пн', 7.0, 'B', anchor='c')
    for i in range(5):
        p.rect(X(-3) + i * 4 * k * 0.5, 51.0, 2 * k, 1.2, w=0.2, fill=m.INK if i % 2 == 0 else (1, 1, 1))
    p.text(X(-3), 53.4, '0', 5.6); p.text(X(-3) + 20 * k * 0.5, 53.4, '10 м', 5.6, anchor='c')

    # ---- таблиця перевірок
    rx = 238.0
    p.text(rx, 285.5, 'Перевірка відстаней: ПУЕ, гл. 2.3; ДБН 360-92', 8.6, 'B')
    p.text(rx, 281.6, 'у світлі; глибини існуючих мереж умовні (газ 1,2 м, кабелі 0,8 м) — потрібні шурфи', 5.8, col=m.MUTED)
    rows = check_rows(D)
    yb = m.spec_table(p, rx, 279.0, [('Що перевірено', 64, 'l'), ('Норма, пункт', 45, 'l'), ('У моделі', 28, 'r'), ('Висновок', 18, 'c')], rows, size=5.6, rh=4.1)
    for i, r in enumerate(rows):
        if r[3] != 'так':
            yy = 279.0 - 5.2 - (i + 1) * 4.1
            p.rect(rx + 137.2, yy + 0.3, 17.6, 3.5, w=0.35, col=HIT if r[3] == 'НІ' else m.ACC)
    # ---- позиції і умовні позначення
    ly = yb - 6.0
    p.text(rx, ly, 'Позиції на плані', 8.6, 'B')
    pos = ['КЛ-6 кВ №1, №2 від ГПУ: 1×120/50, гофротруба d120 (креслення траси)', 'з’єднувальні муфти №1, №2: перехід на 1×240/50',
           'КЛ №1, №2: 3 × АПвЗгаПу-6 1×240/50 у трубах d140, 0,9 м', 'КЛ BESS: 3 × АПвЗгаПу-6 1×240/50 у трубі d160, 0,8 м; біля котлована 1,3 м',
           'канал зв’язку: 3 × ПЕ d40 — оптика, RS-485, резерв; 0,8 м', 'ККС-1 — колодязь зв’язку', 'робочий котлован 3 × 2 × 2,3 м',
           'прокол №1, L = 33 м: 5 труб SDR17 d160 у два ряди', 'приймальний котлован 2 × 2 × 2,3 м', 'чотири вводи в РП «Алюміній» крізь західну стіну',
           'BESS 5 015 кВт·год, фундамент Golen (арк. 4–7)', 'PCS + трансформатор 6 кВ, 1 725 кВт', 'вставки існуючих КЛ 6 кВ a, b: ПНД d110, 1,2 м (арк. 3)',
           'з’єднувальні муфти вставок, 4 шт.', 'ділянки існуючих КЛ під BESS — демонтувати', 'газопровід від ШРП; пунктир — продовження за генпланом']
    yy = ly - 4.4
    for i, t in enumerate(pos):
        col = RER if i + 1 in (13, 14) else CM if i + 1 in (5, 6) else HIT if i + 1 == 15 else None
        xx = rx + (0 if i < 8 else 88)
        y_ = yy - (i % 8) * 4.4
        num_tag(p, xx + 2.0, y_ + 0.9, i + 1, col, r=1.7, size=5.2)
        p.para(xx + 4.8, y_, t, 82.0, 5.3, lead=2.2)
    yy -= 8 * 4.4 + 1.0
    items = [(KL, None, 0.7, 'нові КЛ-6 кВ'), (RER, None, 0.6, 'вставки існуючих КЛ'), (CM, [1.6, 0.7], 0.5, 'канал зв’язку'), (REL, [1.0, 0.7], 0.5, 'під демонтаж'),
             (C['gas'], None, 0.35, 'газопровід'), (C['cable6'], None, 0.25, 'кабелі 6 кВ існуючі'), (m.INK, [2.2, 0.8], 0.3, 'межі пучка проколу'), (C['water'], None, 0.35, 'водопровід')]
    for i, (col, dash, w, t) in enumerate(items):
        xx = rx + (i % 4) * 44; y_ = yy - (i // 4) * 4.0
        p.line(xx, y_ + 1.0, xx + 7, y_ + 1.0, w, col, dash=dash); p.text(xx + 8.5, y_, t, 5.6)
    yy -= 8.4
    p.circle(rx + 3.5, yy + 1.0, 1.8, w=0.6, col=HIT); p.text(rx + 7.5, yy, 'А — КЛ ГПУ ближче 1 м до газопроводу; Б — котлован на газопроводі і КЛ 6 кВ (обидва — з креслення траси)', 5.5)
    notes = [
        'BESS і PCS — навпроти ГПУ, у червоному прямокутнику з креслення; орієнтація Golen: відсік LV / HV і торцеві двері BESS — на захід. Між контейнерами ГПУ і BESS — %s м.' % f1(D['checks']['gpu_bess']['dist']),
        'Під BESS проходили дві існуючі КЛ 6 кВ. Їх ділянки вирізаються і замінюються вставками в обхід зі сходу (арк. 3). Роботи — з відключенням ліній і погодженням власника.',
        'Траса КЛ ГПУ, муфти, котловани і прокол — зі знімку креслення траси (точність ±1 м). Порушення А і Б — звідти: звірити з оригіналом креслення.',
        'Лінія BESS, канал зв’язку, ККС-1 і вставки — пропозиція. Перед роботами шурфами уточнити положення і глибину газопроводів і кабелів.',
    ]
    ny_ = yy - 6.0
    p.text(rx, ny_, 'Примітки', 8.6, 'B')
    y1 = ny_ - 4.2
    for i, s in enumerate(notes, 1):
        p.text(rx, y1, '%d.' % i, 5.8)
        y1 = p.para(rx + 3.8, y1, s, 172.0, 5.8, lead=2.6) - 0.4
    cv.showPage()


def _hz(D):
    G = D['grid']; X0, X1, Y0, Y1 = D['win']
    def hz(x, y):
        fx = min(G['nx'] - 1.001, max(0, x - X0)); fy = min(G['ny'] - 1.001, max(0, y - Y0)); i = int(fx); j = int(fy); tx = fx - i; ty = fy - j; a = j * G['nx'] + i; H = G['cm']
        return (H[a] * (1 - tx) * (1 - ty) + H[a + 1] * tx * (1 - ty) + H[a + G['nx']] * (1 - tx) * ty + H[a + G['nx'] + 1] * tx * ty) / 100.0
    return hz


def sheet_profile(cv, m, D, Q):
    p = m.Pen(cv)
    SRC = 'Джерела: траса — креслення траси КЛ-6 кВ (знімок) і пропозиція; рельєф і мережі — 3D-модель площадки; фундаменти — Golen Annex 1'
    frame(m, p, ['Профіль КЛ-6 кВ BESS, перерізи траншей і проколу', 'Порівняння варіантів фундаменту BESS / PCS'], '1:250 / 1:50; 1:25', 2, SRC)
    R = D['route']; T = [t for t in R['trunk'] if 'BESS' in t['id']][0]
    pts = T['p'][1:]
    s = [0.0]
    for i in range(1, len(pts)):
        s.append(s[-1] + math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    hz = _hz(D)
    kh, kv = 4.0, 20.0
    sx0, sy0, zref = 52.0, 206.0, -3.6
    SX = lambda v: sx0 + v * kh
    SZ = lambda z: sy0 + (z - zref) * kv
    p.view_title(24, 288.5, 'Поздовжній профіль КЛ-6 кВ BESS', 'М гор. 1 : 250, верт. 1 : 50 · від блока PCS до стіни РП')
    smax = s[-1]
    for zz in [x / 2.0 for x in range(-7, 1)]:
        p.line(SX(0), SZ(zz), SX(smax), SZ(zz), m.W_HAIR, (0.8, 0.82, 0.84))
        p.text(SX(0) - 1.5, SZ(zz) - 0.9, ab(zz), 5.6, anchor='r', col=m.MUTED)
    p.poly([(SX(si), SZ(hz(q[0], q[1]))) for si, q in zip(s, pts)], 0.5, m.INK)
    p.poly([(SX(si), SZ(q[2])) for si, q in zip(s, pts)], 0.8, KL)
    def s_at(xy):
        best = (1e9, 0)
        for si, q in zip(s, pts):
            d = math.hypot(q[0] - xy[0], q[1] - xy[1])
            if d < best[0]: best = (d, si)
        return best[1]
    marks = [(0.0, 'PCS'), (s_at(R['bore']['a']), 'початок проколу'), (s_at(R['bore']['b']), 'кінець проколу'), (smax, 'стіна РП')]
    for pt in R['pits']:
        sc = s_at(pt['c']); w = pt['l'] * kh
        p.rect(SX(sc) - w / 2, SZ(pt['z'] - pt['d']), w, pt['d'] * kv, w=0.35, col=PIT, fill=(0.96, 0.9, 0.8))
        p.text(SX(sc), SZ(pt['z']) + 2.0, ('робочий котлован' if pt['l'] == 3 else 'приймальний котлован'), 5.6, anchor='c', col=(0.45, 0.28, 0.08))
    for j, (si, t) in enumerate(marks):
        p.line(SX(si), SZ(-3.5), SX(si), SZ(0.05), m.W_HAIR, m.MUTED, dash=[0.8, 0.8])
        p.text(SX(si), SZ(0.15) + (3.2 if j % 2 else 0), t, 5.4, anchor='c', col=m.MUTED)
    seen = []
    for c in D['checks']['cross']:
        if 'BESS' not in c['a']: continue
        si = s_at((c['x'], c['y']))
        col = RER if c['bc'] == 'rer' else C.get(c['bc'], (0.4, 0.4, 0.4))
        p.circle(SX(si), SZ(c['z2']), 1.1, w=0.35, col=col, fill=(1, 1, 1))
        if any(abs(si - a) < 3 and c['bc'] == b for a, b in seen): continue
        seen.append((si, c['bc']))
        same = [q['gap'] for q in D['checks']['cross'] if 'BESS' in q['a'] and q['bc'] == c['bc'] and abs(s_at((q['x'], q['y'])) - si) < 3]
        t = 'вставки a, b' if c['bc'] == 'rer' else NAME[c['bc']] + ' (умовно)'
        g = f2(min(same)) + ('–' + f2(max(same)) if max(same) - min(same) > 0.005 else '')
        p.text(SX(si) + 1.8, SZ(c['z2']) - 3.2, t + ', зазор ' + g + ' м', 5.2, col=col)
    ty = 199.0
    rows_t = [('Земля, м', lambda q: ab(hz(q[0], q[1]))), ('Вісь труби, м', lambda q: ab(q[2])), ('Глибина осі, м', lambda q: f2(hz(q[0], q[1]) - q[2]))]
    p.rect(SX(0) - 28, ty - 4 * 5.0, 28 + smax * kh, 4 * 5.0, w=m.W_VIS)
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
            p.text(xx + 0.6, ty - (i + 1) * 5.0 + 1.0, fn(q), 4.9)
        p.text(xx + 0.6, ty - 4 * 5.0 + 1.0, f1(st), 4.9)

    # ---- перерізи, 1:25 (1 м = 40 мм)
    def trench(x0_, yg, title, pipes, width, dep_lab, notes_):
        XT = lambda x: x0_ + x * 40.0
        YT = lambda z: yg + z * 40.0
        p.text(x0_ - 28, yg + 9.0, title, 7.4, 'B')
        hw = width / 2
        bot = max(d for _, d, _, _ in pipes) + 0.15
        p.poly([(XT(-hw), YT(0)), (XT(-hw), YT(-bot)), (XT(hw), YT(-bot)), (XT(hw), YT(0))], 0.45)
        p.line(XT(-hw - 0.4), YT(0), XT(-hw), YT(0), 0.4); p.line(XT(hw), YT(0), XT(hw + 0.4), YT(0), 0.4)
        p.soil(XT(-hw - 0.4), XT(-hw), YT(0), depth=2.0); p.soil(XT(hw), XT(hw + 0.4), YT(0), depth=2.0)
        p.rect(XT(-hw), YT(-bot), width * 40, 0.3 * 40, w=0, fill=(0.97, 0.94, 0.86))
        for xc, d, r, col in pipes:
            p.circle(XT(xc), YT(-d), r * 40, w=0.4, col=col, fill=(1, 1, 1))
            if col == KL:
                for a in (90, 210, 330):
                    p.circle(XT(xc) + math.cos(math.radians(a)) * 0.9, YT(-d) + math.sin(math.radians(a)) * 0.9, 0.75, w=0.2, col=KL, fill=KL)
            else:
                for a in (90, 210, 330):
                    p.circle(XT(xc) + math.cos(math.radians(a)) * 0.95, YT(-d) + math.sin(math.radians(a)) * 0.95, 0.75, w=0.25, col=CM)
        dmin = min(d for _, d, _, _ in pipes)
        p.line(XT(-hw + 0.05), YT(-dmin + 0.4), XT(hw - 0.05), YT(-dmin + 0.4), 0.5, HIT, dash=[1.2, 0.6])
        p.dim_v(YT(-pipes[0][1]), YT(0), XT(-hw), XT(-hw) - 5.0, dep_lab, size=5.6)
        p.dim_h(XT(pipes[0][0]), XT(pipes[1][0]), YT(-bot), YT(-bot) - 3.5, str(int(round((pipes[1][0] - pipes[0][0]) * 1000))), size=5.4)
        yy = YT(-bot) - 9.0
        for t in notes_:
            p.text(x0_ - 28, yy, t, 5.3, col=m.MUTED); yy -= 2.5
    trench(306.0, 262.0, 'Т-1. КЛ ГПУ, М 1 : 25', [(-0.2, 0.9, 0.07, KL), (0.2, 0.9, 0.07, KL)], 0.9, '900',
           ['2 труби d140, у кожній 3 × 1 × 240/50;', 'до верху труби 830 ≥ 700 (п. 2.3.84);', 'бруківку розібрати й відновити'])
    trench(378.0, 262.0, 'Т-2. КЛ BESS і зв’язок', [(-0.25, 0.8, 0.08, KL), (0.25, 0.8, 0.055, CM)], 1.0, '800',
           ['d160 з 3 × 1 × 240/50 і d110 з 3 × ПЕ d40;', 'верх ≥ 0,7 м; над перетинами', 'зв’язок — 0,55 м у трубах'])
    bx0, byg = 345.0, 186.0
    XB = lambda x: bx0 + x * 40.0
    YB = lambda z: byg + z * 40.0
    p.text(278.0, byg + 9.0, 'Переріз проколу, М 1 : 25', 7.4, 'B')
    p.line(XB(-0.9), YB(0), XB(0.9), YB(0), 0.4); p.soil(XB(-0.9), XB(0.9), YB(0), depth=2.0)
    p.line(XB(-0.9), YB(-1.25), XB(0.9), YB(-1.25), m.W_HAIR, C['gas'], dash=[1.4, 0.8]); p.text(XB(0.9), YB(-1.25) + 0.8, 'газопроводи ≈ 1,2 м (умовно)', 5.2, col=C['gas'], anchor='r')
    dep = R['bore']['dep']
    p.circle(XB(0), YB(-dep + 0.1), 0.42 * 40, w=0.25, col=m.MUTED)
    for s_, dz, kind in R['bore']['pipes']:
        col = KL if kind.startswith('КЛ') else CM if kind == 'зв’язок' else m.MUTED
        p.circle(XB(s_), YB(-dep + dz), 0.08 * 40, w=0.45, col=m.INK, fill=(1, 1, 1))
        if col != m.MUTED:
            for a in (90, 210, 330):
                p.circle(XB(s_) + math.cos(math.radians(a)) * 1.0, YB(-dep + dz) + math.sin(math.radians(a)) * 1.0, 0.85, w=0.25, col=col, fill=col if col == KL else None)
    p.leader(XB(0.2), YB(-dep), XB(0.6), YB(-dep - 0.35), '', lines=['КЛ №2 · КЛ №1 · КЛ BESS:', 'SDR17 d160 через 200 мм'], size=5.4)
    p.leader(XB(0.1), YB(-dep + 0.2), XB(0.6), YB(-dep + 0.25), '', lines=['зв’язок: 3 × ПЕ d40'], size=5.4)
    p.leader(XB(-0.1), YB(-dep + 0.2), XB(-0.6), YB(-dep + 0.3), '', lines=['резерв', '(≥ 15 %, п. 2.3.105)'], size=5.4, anchor='r')
    p.leader(XB(-0.36), YB(-dep - 0.1), XB(-0.6), YB(-dep - 0.4), '', lines=['розширення', 'Ø ≈ 850'], size=5.4, anchor='r')
    p.dim_v(YB(-dep), YB(0), XB(-0.75), XB(-0.75) - 5, str(int(round(dep * 1000))), size=5.6)
    gmin = min(c['gap'] for c in D['checks']['cross'] if c['bc'] == 'gas' and c['bore'])
    p.text(278.0, YB(-dep - 0.45) - 6.0, 'Зазор до газу — %s м від верхнього ряду (≥ 0,25 м у трубі, п. 2.3.95).' % f2(gmin), 5.4, col=m.MUTED)
    p.text(278.0, YB(-dep - 0.45) - 8.6, 'Прокол поглиблено з 1,6 до 1,85 м, котловани — з 2,0 до 2,3 м.', 5.4, col=m.MUTED)

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
        ('b', 'Сталь (арк. 5 / 7)', '≈ %d кг' % round(q1['steel']), '≈ %d кг' % round(q2['steel']), '−%d кг' % round(q1['steel'] - q2['steel'])),
        ('Тиск під балкою (BESS 43 т)', '≈ %d кПа' % q1['press'], '≈ %d кПа' % q2['press'], '—'),
        ('Креслення', 'аркуші 4, 5', 'аркуші 6, 7', ''),
    ]
    yb = m.spec_table(p, 24.0, 163.5, [('Позиція', 58, 'l'), ('Варіант 1\nяк у Golen', 30, 'r'), ('Варіант 2\nглибина 1,5 м', 30, 'r'), ('Різниця', 26, 'r')], rows, size=6.0, rh=4.4, hh=7.0)
    S = D['bess'][0]
    notes = [
        'Обидва варіанти — та сама конструкція Golen: обв’язувальна балка 350 × 350 внизу, 8 колон 350 × 350 і цегляна кладка між ними; у варіанті 2 підошву піднято на 350 мм.',
        'Позначки — від середньої позначки землі під блоком: ' + ab(S['gb']) + ' (BESS) і ' + ab(S['gp']) + ' (PCS).',
        'Вибір варіанта — за розрахунком основи і нормативною глибиною промерзання для ґрунтів площадки (ДБН В.2.1-10, вишукування). Фундамент PCS прийнято того самого типу: Golen його не дав.',
        'Профіль: КЛ BESS іде на 0,8 м, перед робочим котлованом опускається на 1,3 м під дві існуючі КЛ 6 кВ, у проколі — на 1,85 м разом з КЛ ГПУ. Перетини зі вставками — у трубах.',
    ]
    y1 = yb - 7.0
    p.text(24, y1, 'Примітки', 8.6, 'B'); y1 -= 4.4
    for i, s_ in enumerate(notes, 1):
        p.text(24, y1, '%d.' % i, 6.0); y1 = p.para(27.8, y1, s_, 196.0, 6.0, lead=2.7) - 0.5
    cv.showPage()


def scheme(p, m, D, ytop):
    """Структурна схема: силова частина 6 кВ і канал зв'язку."""
    CAL = D['calc']; cm = CAL['comms']; LN = {l['id']: l for l in CAL['lines']}
    p.text(24, ytop, 'Схема приєднань 6 кВ і зв’язку', 7.6, 'B')
    p.text(24 + p.tw('Схема приєднань 6 кВ і зв’язку', 7.6, 'B') + 3, ytop, 'структурна; комірки РП — за його однолінійною схемою', 5.8, col=m.MUTED)
    y0 = ytop - 8.0
    bw, bh = 34.0, 9.0
    def box(x, y, t1, t2=None, col=None):
        p.rect(x, y - bh, bw, bh, w=0.45, col=col or m.INK, fill=(1, 1, 1))
        p.text(x + bw / 2, y - 3.8, t1, 6.2, 'B', anchor='c')
        if t2: p.text(x + bw / 2, y - 7.2, t2, 5.2, anchor='c', col=m.MUTED)
    rows = [('ГПУ-1', '2 500 кВт, 6,3 кВ', 'КЛ-6кВ №1'), ('ГПУ-2', '2 500 кВт, 6,3 кВ', 'КЛ-6кВ №2'), ('PCS + Т 6 кВ', '1 725 кВт · шафа EMS', 'КЛ-6кВ BESS')]
    xr = 180.0; ytop_rp = y0 + 10.0; ybot_rp = y0 - 2 * 15.0 - bh - 4.0
    p.rect(xr, ybot_rp, 40.0, ytop_rp - ybot_rp, w=0.5, fill=(0.95, 0.86, 0.80))
    p.text(xr + 20, ytop_rp - 4.0, 'РП «Алюміній»', 6.6, 'B', anchor='c'); p.text(xr + 20, ytop_rp - 7.2, 'РУ-6 кВ', 5.6, anchor='c', col=m.MUTED)
    p.line(xr + 4, y0 - 1.0, xr + 4, y0 - 2 * 15.0 - bh + 1.0, 1.2)
    for i, (t1, t2, lid) in enumerate(rows):
        y = y0 - i * 15.0
        box(24.0, y, t1, t2)
        yl = y - bh / 2
        L = LN[lid]
        if i < 2:
            p.line(58.0, yl, 92.0, yl, 0.9, KL)
            xm = 92.0; p.poly([(xm, yl + 1.6), (xm + 1.1, yl), (xm, yl - 1.6), (xm - 1.1, yl)], 0.3, KL, fill=KL, close=True)
            p.text(80.0, yl + 1.2, '1×120/50 Cu, 20 м', 5.2, col=KL, anchor='c')
            p.line(93.1, yl, xr + 4, yl, 0.9, KL)
        else:
            p.line(58.0, yl, xr + 4, yl, 0.9, KL)
        p.text(97.0, yl + 1.2, '3 × 1×240/50 Al, %d м · %d А' % (L['L240'], L['I']), 5.2, col=KL)
        p.circle(xr + 4, yl, 0.7, w=0, fill=m.INK)
        p.text(xr + 6.5, yl - 0.9, 'нова комірка', 5.2)
    # зв'язок: ГПУ-1, ГПУ-2 → ККС-1 → EMS у PCS → РП
    kx, ky = 70.0, y0 - 26.0
    yg1, yg2, yp = y0 - 7.5, y0 - 22.5, y0 - 30.0
    p.poly([(58.0, yg1), (kx + 1.5, yg1), (kx + 1.5, ky + 2.5)], 0.5, CM, dash=[1.4, 0.6])
    p.poly([(58.0, yg2), (kx - 1.5, yg2), (kx - 1.5, ky + 2.5)], 0.5, CM, dash=[1.4, 0.6])
    p.poly([(kx, ky - 2.5), (kx, yp - 2.0), (58.0, yp - 2.0)], 0.5, CM, dash=[1.4, 0.6])
    p.rect(kx - 3, ky - 2.5, 6, 5, w=0.45, col=CM, fill=(0.88, 0.97, 0.95)); p.text(kx + 4.5, ky - 1.0, 'ККС-1', 5.2, 'B', col=CM)
    p.text(kx + 3.0, yg1 - 3.4, '≈ %d м' % cm['fib_g1'], 5.0, col=CM); p.text(60.0, yg2 - 2.6, '≈ %d м' % cm['fib_g2'], 5.0, col=CM)
    ye = yp - bh + 1.5
    p.poly([(58.0, ye), (xr - 8.0, ye), (xr - 8.0, ybot_rp + 3.0), (xr, ybot_rp + 3.0)], 0.5, CM, dash=[1.4, 0.6])
    p.text(97.0, ye - 2.8, 'EMS → РП: оптика + RS-485, ≈ %d м (у проколі — окрема труба)' % cm['fib_rp'], 5.2, col=CM)
    p.text(xr + 1.5, ybot_rp + 0.8, 'SCADA, лічильники', 5.0, col=m.MUTED)
    yc = yp - 17.0
    box(24.0, yc, 'BESS · BMS', '5 015 кВт·год')
    p.line(41.0, yc, 41.0, yp - bh, 0.6, CM)
    p.text(42.5, yc + 1.6, 'BMS ↔ PCS — у каналі між фундаментами', 5.0, col=CM)
    p.para(62.0, yc - 3.0, 'Кожну ділянку зв’язку прокладено трьома трубами ПЕ d40: оптика (8 волокон SM), RS-485 (Modbus RTU, екранована вита пара) і резерв. Шафа EMS у блоці PCS — умовно; місце шафи і протоколи ГПУ уточнити в постачальників.', 158.0, 5.4, lead=2.4, col=m.MUTED)


def sheet_calc(cv, m, D, Q):
    """Аркуш 3: розрахунок КЛ-6 кВ, зв'язок, перекладання існуючих КЛ (деталь 1 : 100, переріз)."""
    p = m.Pen(cv)
    SRC = 'Джерела: Golen Annex 1 (PCS 1 725 кВт), схема 6 кВ (ГПУ 2 × 2 500 кВт), типові каталожні дані АПвЗгаПу, ПУЕ гл. 1.3, 2.3; генплан 2023'
    frame(m, p, ['Розрахунок КЛ-6 кВ, схема і канал зв’язку,', 'перекладання існуючих КЛ 6 кВ з-під BESS'], '1 : 100; 1 : 50', 3, SRC)
    CAL = D['calc']; R = D['route']; ch = D['checks']; S = D['bess'][0]
    p.view_title(24, 288.5, 'Розрахунок КЛ-6 кВ', 'Uном 6,3 кВ · 3 × 1 × 240/50 Al, XLPE')
    rows = []
    for l in CAL['lines']:
        gpu = 'BESS' not in l['id']
        rows.append((l['id'].replace('КЛ-6кВ', 'КЛ') + ' · ' + l['from'], '%d' % l['P'], ('%.2f' % l['cos']).rstrip('0').rstrip('.').replace('.', ','), ('%d / %d' % (l['I'], l['I95'])) if gpu else '%d' % l['I'],
                     '%d' % l['L240'], '%d / %d' % (l['amp']['trench'], l['amp']['bore']), f2(l['dU']), f1(l['loss']), 'НІ' if not l['ok240'] else 'так'))
    yb = m.spec_table(p, 24.0, 283.0, [('Лінія', 30, 'l'), ('P, кВт', 13, 'r'), ('cos φ', 11, 'r'), ('I, А\n0,8 / 0,95', 20, 'r'), ('L фази, м', 15, 'r'),
                                        ('Iдоп, А\nтраншея / прокол', 28, 'r'), ('ΔU, %', 12, 'r'), ('ΔP, кВт', 13, 'r'), ('Al 240', 14, 'c')], rows, size=5.8, rh=4.4, hh=6.6)
    for i, l in enumerate(CAL['lines']):
        if not l['ok240']:
            p.rect(24 + 142 + 0.4, 283.0 - 6.6 - (i + 1) * 4.4 + 0.4, 13.2, 3.6, w=0.35, col=HIT)
    K = CAL['K']
    y1 = yb - 4.0
    txt = [
        'Допустимий струм Al 240 у землі трикутником — %d А (ґрунт 15 °C, 1,2 К·м/Вт, 0,7 м; типові каталожні дані). Поправки: ґрунт 20 °C — %s; труба — %s; '
        'дві лінії поруч у траншеї — %s, глибина 0,9 м — %s; три лінії в проколі через 200 мм — %s, глибина 1,85 м — %s.' % (
            CAL['I0']['Al240'], ('%.3f' % K['t']).replace('.', ','), f2(K['pipe']), f2(K['grp_tr']), f2(K['dep_tr']), f2(K['grp_bore']), f2(K['dep_bore'])),
        'Струм ГПУ — 2 500 кВт при cos φ 0,8 (номінал генератора) і 0,95; PCS — 1 725 кВА. Довжина фази — траса з опусканнями, 2 % запасу, 10 м по РУ-6 кВ (BESS — ще 3 м у PCS). Хвости ГПУ 1×120 (20 м) враховано в ΔU і ΔP як мідні.',
    ]
    for t in txt:
        y1 = p.para(24, y1, t, 196.0, 5.8, lead=2.6) - 0.6
    y1 -= 2.4
    p.text(24, y1, 'КЛ ГПУ: як зробити, щоб прокол тримав %d А' % CAL['lines'][0]['I'], 7.6, 'B')
    rv = [('Al 240 — як на кресленні', '%d А' % CAL['lines'][0]['amp']['bore'], 'лише при cos φ ГПУ ≥ 0,95 (%d А); при 0,8 — до %d кВт' % (CAL['lines'][0]['I95'], CAL['P240_08'])),
          ('Al 400', '%d А' % CAL['alt']['Al400'], 'та сама труба d160; термічна стійкість %s кА за 1 с' % f1(CAL['sc']['Al400_1s'])),
          ('Cu 240', '%d А' % CAL['alt']['Cu240'], 'та сама труба d160; дорожче за Al 400'),
          ('Розрахунок IEC 60287', '—', 'з даними ґрунту (тепловий опір, температура); бентоніт у проколі дає +5–8 %'),
          ('Хвіст 1×120 від ГПУ', 'Cu ≈ %d А' % CAL['alt']['Cu120_tail'], 'Al ≈ %d А — не годиться; Cu — на межі при cos φ 0,8' % CAL['alt']['Al120_tail'])]
    y1 = m.spec_table(p, 24.0, y1 - 2.0, [('Рішення', 46, 'l'), ('Iдоп у проколі', 24, 'r'), ('Примітка', 126, 'l')], rv, size=5.8, rh=4.3)
    y1 -= 4.4
    p.text(24, y1, 'Термічна стійкість до струму КЗ, I = k · S / √t', 7.6, 'B')
    sc = CAL['sc']
    rs = [('Al 240 (k = 94)', f1(sc['Al240_1s']) + ' кА', f1(sc['Al240_05']) + ' кА'), ('Al 400', f1(sc['Al400_1s']) + ' кА', '—'),
          ('Cu 120 — хвіст ГПУ (k = 143)', f1(sc['Cu120_1s']) + ' кА', '—'), ('Екран Cu 50 (k = 141)', f1(sc['scr50_1s']) + ' кА', '—')]
    yt = y1 - 2.0
    y1 = m.spec_table(p, 24.0, yt, [('Провідник', 60, 'l'), ('t = 1 с', 24, 'r'), ('t = 0,5 с', 24, 'r')], rs, size=5.8, rh=4.3)
    p.para(138.0, yt - 3.0, 'Струм КЗ на шинах РП «Алюміній» і час відключення дає мережева організація. Якщо Iк перевищує 22 кА при 1 с, переріз перевірити ще раз.', 82.0, 5.6, lead=2.5, col=m.MUTED)
    y1 -= 4.4
    p.text(24, y1, 'Кабелі, труби і канал зв’язку — специфікація (орієнтовно)', 7.6, 'B')
    cm = CAL['comms']; Lsum = sum(l['L240'] for l in CAL['lines'])
    rm = [('АПвЗгаПу-6 1×240/50 — КЛ №1, №2, BESS', 'м', '%d' % (3 * Lsum), '3 фази × (%s) м' % ' + '.join('%d' % l['L240'] for l in CAL['lines'])),
          ('Труба SDR17 d160 — прокол', 'м', '%d' % round(5 * R['bore']['L']), '5 труб × %s м' % f1(R['bore']['L'])),
          ('Труба ПЕ d40 — зв’язок', 'м', '%d' % round(3 * cm['duct_L']), '3 × %s м траси' % f1(cm['duct_L'])),
          ('Оптичний кабель 8 SM, броньований', 'м', '%d' % round((cm['fib_rp'] + cm['fib_g1'] + cm['fib_g2']) * 1.1), 'EMS → ГПУ-1, ГПУ-2, РП; +10 %'),
          ('RS-485: екранована вита пара 2 × 2 × 0,5', 'м', '%d' % round(cm['rs485'] * 1.1), 'Modbus RTU; +10 %'),
          ('ККС-1, колодязь зв’язку', 'шт.', '1', 'біля муфт, ≈ 700 × 600'),
          ('Вставки існуючих КЛ (марка — як у лінії)', 'м', '%d' % round(sum(r['L'] for r in R['reroute']) * 1.03 + 4), '%s + %s м, +3 %% і по 1 м на муфти' % (f1(R['reroute'][0]['L']), f1(R['reroute'][1]['L']))),
          ('Труба ПНД d110 — вставки', 'м', '%d' % round(sum(r['L'] for r in R['reroute']) - 2), ''),
          ('Муфти з’єднувальні 6 кВ (перехідні, якщо кабель паперовий)', 'шт.', '4', 'для вставок'),
          ('Демонтаж ділянок існуючих КЛ під BESS', 'м', f1(sum(r['Lold'] for r in R['reroute'])), '%s + %s м' % (f1(R['reroute'][0]['Lold']), f1(R['reroute'][1]['Lold'])))]
    y1 = m.spec_table(p, 24.0, y1 - 2.0, [('Позиція', 86, 'l'), ('Од.', 10, 'c'), ('К-сть', 16, 'r'), ('Примітка', 84, 'l')], rm, size=5.6, rh=4.1)
    scheme(p, m, D, y1 - 6.0)

    # ---------------- деталь перекладання, 1 : 100
    xd0, yd0, kd = 238.0, 112.0, 10.0
    XD = lambda x: xd0 + (x - 23.0) * kd
    YD = lambda y: yd0 + (y - 2.0) * kd
    p.view_title(238, 288.5, 'Перекладання існуючих КЛ 6 кВ', 'М 1 : 100 · деталь плану')
    cv.saveState(); pth = cv.beginPath(); pth.rect(XD(23) * m.mm, YD(2) * m.mm, 12.6 * kd * m.mm, 16.6 * kd * m.mm); cv.clipPath(pth, stroke=0, fill=0)
    for c in (S['bess'], S['pcs']):
        p.poly([(XD(a), YD(b)) for a, b in foot(c)], 0.5, m.INK, fill=(0.98, 0.91, 0.82), close=True)
        p.poly([(XD(a), YD(b)) for a, b in foot(c, 3.029, 1.219)], 0.3, m.ACC, dash=[3, 0.8, 0.5, 0.8], close=True)
    p.rect(XD(S['pcs'][0] - 0.4), YD(S['bess'][1] + 1.269), 0.8 * kd, (S['pcs'][1] - S['bess'][1] - 2.538) * kd, w=0.3, fill=(0.9, 0.9, 0.9))
    for l in D['lines']:
        xs = [q[0] for q in l['p']]; ys = [q[1] for q in l['p']]
        if max(xs) < 22 or min(xs) > 36 or max(ys) < 1 or min(ys) > 20: continue
        col = REL if l.get('rel') else C.get(l['c'], (0.5, 0.5, 0.5))
        p.poly([(XD(q[0]), YD(q[1])) for q in l['p']], 0.6 if l['c'] in ('gas', 'cable6') else 0.35, col, dash=[1.4, 0.9] if l.get('rel') or l['i'] == 9117 else None)
    for f in D['fences']:
        if '14 і 20' in f['name']:
            pts = [(XD(q[0]), YD(q[1])) for q in f['xy']]
            p.poly(pts, 0.35, (0.35, 0.38, 0.42))
            for q in pts:
                p.line(q[0], q[1], q[0] + 1.4, q[1], 0.25, (0.35, 0.38, 0.42))
    for r in R['reroute']:
        p.poly([(XD(q[0]), YD(q[1])) for q in r['p']], 0.8, RER)
    for c in R['comms'][2:]:
        p.poly([(XD(q[0]), YD(q[1])) for q in c['p'][:-1]], 0.5, CM, dash=[1.6, 0.7])
    T = [t for t in R['trunk'] if 'BESS' in t['id']][0]
    p.poly([(XD(q[0]), YD(q[1])) for q in T['p'][:-1]], 0.8, KL)
    for j in R['joints']:
        x_, y_ = XD(j['x']), YD(j['y'])
        ang = math.atan2(0.922, -0.387)
        dx, dy = math.cos(ang) * 4.5, math.sin(ang) * 4.5
        p.line(x_ - dx, y_ - dy, x_ + dx, y_ + dy, 2.2, RER)
    cv.restoreState()
    JN = {j['id']: j for j in ch['joints']}
    lab = lambda x, y, tx, ty, lines, an='l': p.leader(XD(x), YD(y), XD(tx), YD(ty), '', size=5.6, lines=lines, anchor=an, bg=(1, 1, 1))
    jpos = {('a', 'A'): (27.6, 5.0, 'r'), ('b', 'A'): (31.0, 2.7, 'l'), ('a', 'B'): (24.6, 15.2, 'l'), ('b', 'B'): (24.9, 18.4, 'l')}
    for j in R['joints']:
        jj = JN['з’єднувальна муфта %s-%s' % (j['cab'], 'півд.' if j['at'] == 'A' else 'півн.')]
        t = ['муфта %s, %s' % (j['cab'], 'півд.' if j['at'] == 'A' else 'півн.'), ('до каб. %s → %s м' % (f2(jj['dist']), f2(jj['after']))) if jj.get('spread') else 'до каб. %s м' % f2(jj['dist'])]
        tx, ty, an = jpos[(j['cab'], j['at'])]
        lab(j['x'], j['y'], tx, ty, t, an)
    ra, rb = R['reroute']
    xa_, xb_ = max(q[0] for q in ra['p']), max(q[0] for q in rb['p'])
    lab(xa_, 9.6, 30.9, 11.3, ['вставка a: %s м' % f1(ra['L']), 'ПНД d110, 1,2 м'], 'r')
    lab(xb_, 13.0, 35.9, 13.4, ['вставка b: %s м' % f1(rb['L']), 'ПНД d110, 1,2 м'])
    lab(27.75, 9.8, 26.7, 11.6, ['під BESS —', 'демонтувати'], 'r')
    lab(34.6, 6.2, 35.9, 6.6, ['газопроводи', 'біля паркану'])
    lab(34.02, 15.9, 35.9, 16.6, ['паркан 14/20'])
    lab(T['p'][3][0], 18.0, 28.2, 18.6, ['КЛ BESS'])
    lab(25.5, 4.15, 24.4, 2.9, ['газопровід', 'від ШРП'], 'r')
    p.text(XD(S['bess'][0] - 1.0), YD(S['bess'][1]) - 1.2, 'BESS', 7.2, 'B', anchor='c')
    p.text(XD(S['pcs'][0] - 1.0), YD(S['pcs'][1]) - 1.2, 'PCS + Т 6 кВ', 7.0, 'B', anchor='c')
    ex = S['bess'][0] + 3.079; ya_ = 11.0
    p.dim_h(XD(ex), XD(xa_ - 0.055), YD(ya_), YD(ya_) + 6.0, f2(xa_ - 0.055 - ex), size=5.4)
    p.dim_h(XD(xb_ + 0.055), XD(34.5), YD(9.0), YD(9.0) - 4.0, f2(ch['rer_gas']['dist']), size=5.2)
    for i in range(3):
        p.rect(XD(23.2) + i * 10, YD(2.3), 10, 1.0, w=0.2, fill=m.INK if i % 2 == 0 else (1, 1, 1))
    p.text(XD(23.2), YD(2.3) + 1.8, '0', 5.4); p.text(XD(23.2) + 30, YD(2.3) + 1.8, '3 м', 5.4, anchor='c')
    # ---------------- переріз по смузі вставок, 1 : 25
    sx0, sy0 = 250.0, 92.0
    XS = lambda x: sx0 + (x - 31.4) * 20.0
    YS = lambda z: sy0 + z * 20.0
    p.text(238, 106.0, 'Переріз 3–3 по смузі вставок, М 1 : 50', 7.6, 'B')
    p.line(XS(ex), YS(0), XS(34.8), YS(0), 0.4); p.soil(XS(ex), XS(34.8), YS(0), depth=1.6)
    fb = -1.85; ft = 0.3
    p.poly([(XS(31.4), YS(ft)), (XS(ex), YS(ft)), (XS(ex), YS(fb)), (XS(31.4), YS(fb))], 0.45, m.INK, fill=(0.86, 0.87, 0.88))
    p.text(XS(31.45), YS(ft) + 1.2, 'фундамент BESS', 5.4)
    p.rect(XS(32.5), YS(-1.35), 0.75 * 20, 0.25 * 20, w=0.0, fill=(0.97, 0.94, 0.86))
    p.poly([(XS(32.5), YS(0)), (XS(32.5), YS(-1.35)), (XS(33.25), YS(-1.35)), (XS(33.25), YS(0))], 0.35)
    for xc in (xa_, xb_):
        p.circle(XS(xc), YS(-1.2), 0.055 * 20, w=0.4, col=RER, fill=(1, 1, 1)); p.circle(XS(xc), YS(-1.2), 0.035 * 20, w=0.2, col=RER, fill=RER)
    p.line(XS(32.55), YS(-0.8), XS(33.2), YS(-0.8), 0.5, HIT, dash=[1.2, 0.6])
    p.line(XS(34.04), YS(0), XS(34.04), YS(1.1), 0.6, (0.35, 0.38, 0.42)); p.text(XS(34.04), YS(1.1) + 1.0, 'паркан', 5.2, anchor='c', col=m.MUTED)
    p.circle(XS(34.5), YS(-1.25), 0.05 * 20, w=0.4, col=C['gas'], fill=(1, 0.95, 0.8)); p.text(XS(34.5) + 1.8, YS(-1.25) - 0.8, 'газ', 5.2, col=C['gas'])
    p.dim_v(YS(-1.2), YS(0), XS(33.25), XS(33.25) + 3.0, '1200', size=5.2)
    p.dim_h(XS(ex), XS(xa_ - 0.055), YS(-1.35), YS(-1.35) - 4.0, f2(xa_ - 0.055 - ex), size=5.2)
    p.dim_h(XS(xb_ + 0.055), XS(34.45), YS(-1.2), YS(-1.2) - 9.5, f2(ch['rer_gas']['dist']), size=5.2)
    p.para(238, YS(fb) - 4.0, 'Вставки на 1,2 м — нижче КЛ BESS (0,8 м) і зв’язку, що їх перетинають; зазори 0,27–0,29 м у трубах.', 98.0, 5.3, lead=2.4, col=m.MUTED)
    wx = 340.0
    p.text(wx, 106.0, 'Порядок перекладання', 7.6, 'B')
    steps = ['Шурфами знайти обидві КЛ і газопроводи; уточнити марку, переріз і власника ліній.',
             'Погодити відключення з власником; прокласти труби ПНД d110 і вставки по смузі x = 32,75 / 33,0.',
             'Відключити кабель, змонтувати муфти: a — y 4,3 і 17,0; b — y 3,3 і 17,7. Біля муфт b у котловані відвести кабель a на 0,1 м.',
             'Випробувати лінію (ПУЕ, гл. 1.8), увімкнути; ділянки під BESS вирізати і демонтувати.',
             'Лише після цього копати котловани фундаментів BESS і PCS.']
    yy = 101.0
    for i, t in enumerate(steps, 1):
        p.text(wx, yy, '%d.' % i, 5.6); yy = p.para(wx + 3.4, yy, t, 71.0, 5.6, lead=2.5) - 0.6
    cv.showPage()
