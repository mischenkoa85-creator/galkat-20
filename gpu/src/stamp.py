# -*- coding: utf-8 -*-
"""Основний напис 185 × 55 мм для робочої документації (за формою ДСТУ Б А.2.4-4, спрощено):
ліворуч — зміни і підписи (Розробив, Перевірив, ГІП, Н. контр., Затвердив), праворуч — об'єкт, назва аркуша, стадія «Р», аркуш, масштаб, дата."""
OBJ = 'ТзДВ «Гал-Кат», площадка № 20, вул. Конюшинна, Львів. ГПУ, УЗЕ 1,725 МВт / 5 МВт·год'
DATE = '22.10.2026'
STAGE = 'Р'
ROLES = ['Розробив', 'Перевірив', 'ГІП', 'Н. контр.', 'Затвердив']


def fit(p, s, width, size, font='R', smin=4.6):
    while p.tw(s, size, font) > width and size > smin:
        size -= 0.2
    return size


def wrap(p, s, width, size, font='R'):
    out, line = [], ''
    for w in s.split():
        t = (line + ' ' + w).strip()
        if p.tw(t, size, font) > width and line:
            out.append(line); line = w
        else:
            line = t
    if line: out.append(line)
    return out


def draw(p, M, title, scale, num, total, src):
    W_VIS, MUTED, INK = M.W_VIS, M.MUTED, M.INK
    p.rect(20, 5, M.PW - 25, M.PH - 10, w=0.5)
    x0, y0, w_, h_ = M.PW - 190.0, 5.0, 185.0, 55.0          # A3 — 230, A4 книжкова — 20
    p.rect(x0, y0, w_, h_, w=0.5)
    xl = x0 + 65.0
    p.line(xl, y0, xl, y0 + h_, 0.5)
    # ---- ліва частина: зміни (3 рядки) і підписи
    cw = [7, 10, 10, 13, 15, 10]
    xx = x0
    for c in cw[:-1]:
        xx += c; p.line(xx, y0 + 40, xx, y0 + h_, W_VIS)
    for k in range(1, 3):
        p.line(x0, y0 + 40 + k * 5, xl, y0 + 40 + k * 5, W_VIS)
    p.line(x0, y0 + 40, xl, y0 + 40, 0.5)
    xx = x0
    for t, c in zip(['Зм.', 'Кільк.', 'Арк.', '№ док.', 'Підпис', 'Дата'], cw):
        p.text(xx + c / 2, y0 + 41.4, t, 4.8, anchor='c', col=MUTED); xx += c
    sw = [17, 23, 15, 10]
    xx = x0
    for c in sw[:-1]:
        xx += c; p.line(xx, y0, xx, y0 + 40, W_VIS)
    rh = 40.0 / (len(ROLES) + 1)
    for k in range(1, len(ROLES) + 1):
        p.line(x0, y0 + k * rh, xl, y0 + k * rh, W_VIS)
    yh = y0 + 40 - rh
    xx = x0
    for t, c in zip(['Посада', 'Прізвище', 'Підпис', 'Дата'], sw):
        p.text(xx + c / 2, yh + rh / 2 - 0.9, t, 5.0, anchor='c', col=MUTED); xx += c
    for i, r in enumerate(ROLES):
        yb = yh - (i + 1) * rh
        p.text(x0 + 1.2, yb + rh / 2 - 1.0, r, 5.8)
    # ---- права частина
    xr = x0 + w_
    p.line(xl, y0 + 42, xr, y0 + 42, 0.5)          # об'єкт
    p.line(xl, y0 + 15, xr, y0 + 15, 0.5)          # джерела / організація
    xs = xl + 72.0                                  # колонка стадії
    p.line(xs, y0 + 15, xs, y0 + 42, 0.5)
    p.line(xs, y0 + 33, xr, y0 + 33, W_VIS); p.line(xs, y0 + 24, xr, y0 + 24, W_VIS)
    c3 = (xr - xs) / 3.0
    p.line(xs + c3, y0 + 33, xs + c3, y0 + 42, W_VIS); p.line(xs + 2 * c3, y0 + 33, xs + 2 * c3, y0 + 42, W_VIS)
    p.line(xs + 22, y0 + 24, xs + 22, y0 + 33, W_VIS)
    p.line(xs, y0 + 5, xs, y0 + 15, W_VIS)
    p.text(xl + 1.5, y0 + 51.0, 'Об’єкт', 5.0, col=MUTED)
    ls = wrap(p, OBJ, 116, 7.4, 'B')
    yy = y0 + 46.8 if len(ls) > 1 else y0 + 45.2
    for ln in ls[:2]:
        p.text(xl + 1.5, yy, ln, 7.4, 'B'); yy -= 3.4
    p.text(xl + 1.5, y0 + 38.8, 'Найменування аркуша', 5.0, col=MUTED)
    merged = []
    for r in title:
        if merged and r[:1].islower():
            merged[-1] = merged[-1] + ' ' + r
        else:
            merged.append(r)
    rows = []
    for r in merged:
        rows += wrap(p, r, 69, 8.2, 'B')
    sz = 8.2 if len(rows) <= 3 else 7.0
    yy = y0 + 34.6
    for r in rows[:4]:
        s_ = fit(p, r, 69, sz, 'B'); p.text(xl + 1.5, yy, r, s_, 'B'); yy -= 4.6 if sz > 7.5 else 4.0
    for t, i in (('Стадія', 0), ('Аркуш', 1), ('Аркушів', 2)):
        p.text(xs + i * c3 + c3 / 2, y0 + 39.4, t, 4.8, anchor='c', col=MUTED)
    for v, i in ((STAGE, 0), (str(num), 1), (str(total), 2)):
        p.text(xs + i * c3 + c3 / 2, y0 + 34.6, v, 9.0, 'B', anchor='c')
    p.text(xs + 1.2, y0 + 30.2, 'Масштаб', 4.8, col=MUTED); p.text(xs + 1.2, y0 + 25.6, scale, fit(p, scale, 20, 7.2, 'B'), 'B')
    p.text(xs + 23.2, y0 + 30.2, 'Дата', 4.8, col=MUTED); p.text(xs + 23.2, y0 + 25.6, DATE, 7.2, 'B')
    p.text(xs + 1.2, y0 + 21.2, 'Організація (проєктувальник)', 4.8, col=MUTED)
    p.text(xs + 1.2, y0 + 11.8, 'Шифр', 4.8, col=MUTED)
    p.text(xl + 1.5, y0 + 12.0, 'Джерела', 4.8, col=MUTED)
    yy = y0 + 8.6
    for ln in wrap(p, src.replace('Джерела: ', '').replace('Джерело геометрії: ', ''), 70, 4.8)[:3]:
        p.text(xl + 1.5, yy, ln, 4.8, col=MUTED); yy -= 2.2


def draw_next(p, M, title, num, code=''):
    """Основний напис наступних аркушів текстового документа, 185 × 15 мм (форма 6 ДСТУ Б А.2.4-4, спрощено)."""
    W_VIS, MUTED = M.W_VIS, M.MUTED
    p.rect(20, 5, M.PW - 25, M.PH - 10, w=0.5)
    x0, y0, w_, h_ = M.PW - 190.0, 5.0, 185.0, 15.0
    p.rect(x0, y0, w_, h_, w=0.5)
    cw = [7, 10, 10, 13, 15, 10]
    xx = x0
    for c in cw:
        xx += c; p.line(xx, y0, xx, y0 + h_, W_VIS)
    for k in (1, 2):
        p.line(x0, y0 + k * 5, x0 + 65, y0 + k * 5, W_VIS)
    xx = x0
    for t, c in zip(['Зм.', 'Кільк.', 'Арк.', '№ док.', 'Підпис', 'Дата'], cw):
        p.text(xx + c / 2, y0 + 1.4, t, 4.8, anchor='c', col=MUTED); xx += c
    xa = x0 + w_ - 10
    p.line(xa, y0, xa, y0 + h_, 0.5); p.line(xa, y0 + 8, x0 + w_, y0 + 8, W_VIS)
    p.text(xa + 5, y0 + 10.4, 'Аркуш', 4.8, anchor='c', col=MUTED)
    p.text(xa + 5, y0 + 2.6, str(num), 8.5, 'B', anchor='c')
    p.text(x0 + 67, y0 + 9.4, OBJ, fit(p, OBJ, 106, 6.4, 'B'), 'B')
    p.text(x0 + 67, y0 + 3.6, title, fit(p, title, 106, 6.6), col=MUTED)
