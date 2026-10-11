# -*- coding: utf-8 -*-
"""Drawing set for GAL-KAT site 20: layout plan + BESS container foundation (A3, 3 sheets).
Geometry source: Golen Power Technology, Annex 1 - Response 1 (reference drawings)."""
import math, random, sys
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FD = '/usr/share/fonts/truetype/dejavu/'
pdfmetrics.registerFont(TTFont('R', FD + 'DejaVuSansCondensed.ttf'))
pdfmetrics.registerFont(TTFont('B', FD + 'DejaVuSansCondensed-Bold.ttf'))
pdfmetrics.registerFont(TTFont('I', FD + 'DejaVuSansCondensed-Oblique.ttf'))

PW, PH = 420.0, 297.0
W_CUT, W_VIS, W_THIN, W_HAIR = 0.5, 0.3, 0.15, 0.09
INK = (0.08, 0.10, 0.13)
MUTED = (0.38, 0.42, 0.46)
ACC = (0.66, 0.32, 0.0)
C_RC = (0.84, 0.85, 0.86)
C_BR = (0.95, 0.86, 0.80)
C_SOIL = (0.93, 0.91, 0.86)
C_CONT = (0.94, 0.96, 0.98)

# ---- source geometry, mm ----
L, B, H = 6058, 2438, 2896
SITE_W, SITE_D, GAP = 16058, 19876, 5000
OFF, BEAM = 50, 350
LF, BF = L + 2 * OFF, B + 2 * OFF          # 6158 x 2538
COLX = [0, 2000, 3808, 5808]                # column left edges along the long side
F_TOP, COL_BOT, BEAM_BOT = 300, -1500, -1850
assert LF == 6158 and BF == 2538
assert SITE_W == GAP + L + GAP and SITE_D == GAP + B + GAP + B + GAP


# ---- doors (mm, local unit coordinates: x east from the west end, z south from the north side) ----
BESS_S = [(570, 2311, 881), (2361, 4104, 881), (4153, 5933, 884.5)]   # hinge pair + leaf width, Golen layout
BESS_W = [(143, 865, 1), (2276, 1251, -1)]                              # hinge z, leaf width, closing direction
LE = 3119                                    # enclosed part of the PCS block (LV / HV + transformer)
PX0, PX1, PZ0, PZ1 = 3166, 6013, 549, 1812   # PCS cabinet inside the open frame
PCS_X, PCS_LEAF = [3166, 3894, 4622, 5343], 670
TR_N, TR_S = (1215, 2800, 790), (1420, 2845, 712)
SK_W = 1155
assert sum((570, 1741, 50, 1743, 49, 1780, 125)) == L


def fmt_mm(v):
    return ('%g' % v).replace('.', ',')


def draw_door(p, X, Y, hx, hz, w, d, n, amax=90, detail=False, label=None):
    """Leaf drawn open at 90 deg; dashed arc (and ghost leaf) up to the largest angle."""
    def pt(deg):
        a = math.radians(deg)
        return hx + w * (d[0] * math.cos(a) + n[0] * math.sin(a)), hz + w * (d[1] * math.cos(a) + n[1] * math.sin(a))
    tx, tz = pt(90)
    steps = max(8, int(amax / 6))
    p.poly([(X(x), Y(z)) for x, z in (pt(amax * i / steps) for i in range(steps + 1))], W_HAIR + 0.02, MUTED, dash=[0.9, 0.6])
    if amax > 90 and detail:
        gx, gz = pt(amax)
        p.line(X(hx), Y(hz), X(gx), Y(gz), W_HAIR + 0.05, MUTED, dash=[1.8, 0.8])
    p.line(X(hx), Y(hz), X(tx), Y(tz), 0.4 if detail else 0.22)
    if not detail:
        return
    p.circle(X(hx), Y(hz), 0.5, w=0, fill=INK)
    if label:
        mx, mz = (hx + tx) / 2, (hz + tz) / 2
        if n[1] != 0:      # leaf runs vertically on the sheet: text beside it, on the side of its own opening
            p.text(X(mx) + (3.0 if d[0] > 0 else -0.9), Y(mz), label, 6.4, anchor='c', rot=90)
        else:              # leaf runs horizontally
            p.text(X(mx), Y(mz) + (-3.0 if d[1] > 0 else 0.9), label, 6.4, anchor='c')


def unit_bess(p, X, Y, detail=False):
    k = abs(X(1000) - X(0)) / 1000.0
    p.rect(X(0), Y(B), L * k, B * k, w=W_CUT, fill=C_CONT)
    p.line(X(520), Y(0), X(520), Y(B), W_THIN, dash=[1.2, 0.8])
    for a_, b_, w_ in BESS_S:
        draw_door(p, X, Y, a_, B, w_, (1, 0), (0, 1), 120, detail, fmt_mm(w_))
        draw_door(p, X, Y, b_, B, w_, (-1, 0), (0, 1), 120, detail, fmt_mm(w_))
    for hz, w_, dz in BESS_W:
        draw_door(p, X, Y, 0, hz, w_, (0, dz), (-1, 0), 120, detail, fmt_mm(w_))


def unit_pcs(p, X, Y, detail=False):
    k = abs(X(1000) - X(0)) / 1000.0
    p.rect(X(0), Y(B), L * k, B * k, w=W_THIN, fill=(0.975, 0.98, 0.985))      # open frame footprint
    p.rect(X(0), Y(B), LE * k, B * k, w=W_CUT, fill=C_CONT)                     # enclosure
    for zz in (0, B - 160):
        p.rect(X(L - 160), Y(zz + 160), 160 * k, 160 * k, w=W_VIS, fill=(0.3, 0.33, 0.37))
    p.rect(X(PX0), Y(PZ1), (PX1 - PX0) * k, (PZ1 - PZ0) * k, w=W_VIS, fill=C_CONT)   # PCS cabinet
    p.line(X(1138), Y(0), X(1138), Y(B), W_THIN)
    p.line(X(0), Y(815), X(1138), Y(815), W_THIN)
    lab = 'приблизно ' if False else '≈ '
    draw_door(p, X, Y, 0, 60, SK_W, (0, 1), (-1, 0), 90, detail, lab + str(SK_W))
    draw_door(p, X, Y, 0, B - 60, SK_W, (0, -1), (-1, 0), 90, detail, lab + str(SK_W))
    for (a_, b_, w_), zz, nz in ((TR_N, 0, -1), (TR_S, B, 1)):
        draw_door(p, X, Y, a_, zz, w_, (1, 0), (0, nz), 90, detail, lab + str(w_))
        draw_door(p, X, Y, b_, zz, w_, (-1, 0), (0, nz), 90, detail, lab + str(w_))
    for i, xv in enumerate(PCS_X):
        draw_door(p, X, Y, xv, PZ0, PCS_LEAF, (1, 0), (0, -1), 90, detail, (lab + str(PCS_LEAF)) if i == 0 else None)
        draw_door(p, X, Y, xv, PZ1, PCS_LEAF, (1, 0), (0, 1), 90, detail, (lab + str(PCS_LEAF)) if i == 0 else None)


class Pen:
    def __init__(self, c):
        self.c = c

    def lw(self, w, col=INK, dash=None):
        self.c.setLineWidth(w * mm)
        self.c.setStrokeColorRGB(*col)
        self.c.setDash(*([[d * mm for d in dash], 0] if dash else [[], 0]))
        self.c.setLineCap(0)

    def line(self, x1, y1, x2, y2, w=W_VIS, col=INK, dash=None):
        self.lw(w, col, dash)
        self.c.line(x1 * mm, y1 * mm, x2 * mm, y2 * mm)

    def poly(self, pts, w=W_VIS, col=INK, dash=None, fill=None, close=False):
        self.lw(w, col, dash)
        p = self.c.beginPath()
        p.moveTo(pts[0][0] * mm, pts[0][1] * mm)
        for x, y in pts[1:]:
            p.lineTo(x * mm, y * mm)
        if close:
            p.close()
        if fill:
            self.c.setFillColorRGB(*fill)
        self.c.drawPath(p, stroke=1 if w else 0, fill=1 if fill else 0)

    def rect(self, x, y, w_, h_, w=W_VIS, col=INK, dash=None, fill=None):
        self.poly([(x, y), (x + w_, y), (x + w_, y + h_), (x, y + h_)], w, col, dash, fill, close=True)

    def circle(self, x, y, r, w=W_THIN, col=INK, fill=None):
        self.lw(w, col)
        if fill:
            self.c.setFillColorRGB(*fill)
        self.c.circle(x * mm, y * mm, r * mm, stroke=1 if w else 0, fill=1 if fill else 0)

    def arc(self, cx, cy, r, a0, a1, w=W_HAIR, col=INK, dash=None):
        self.lw(w, col, dash)
        p = self.c.beginPath()
        p.arc((cx - r) * mm, (cy - r) * mm, (cx + r) * mm, (cy + r) * mm, a0, a1 - a0)
        self.c.drawPath(p, stroke=1, fill=0)

    def text(self, x, y, s, size=7.2, font='R', anchor='l', col=INK, rot=0, bg=None):
        c = self.c
        if bg and not rot:
            w_ = self.tw(s, size, font)
            xl = x if anchor == 'l' else (x - w_ / 2 if anchor == 'c' else x - w_)
            self.rect(xl - 0.5, y - 0.75, w_ + 1.0, size * 0.3528 * 0.95 + 1.0, w=0, fill=bg)
        c.saveState()
        c.setFillColorRGB(*col)
        c.setFont(font, size)
        c.translate(x * mm, y * mm)
        if rot:
            c.rotate(rot)
        if anchor == 'c':
            c.drawCentredString(0, 0, s)
        elif anchor == 'r':
            c.drawRightString(0, 0, s)
        else:
            c.drawString(0, 0, s)
        c.restoreState()

    def tw(self, s, size=7.2, font='R'):
        return pdfmetrics.stringWidth(s, font, size) / mm

    def para(self, x, y, s, width, size=6.8, font='R', lead=3.05, col=INK, indent=0):
        """Wrapped text block; returns y of the next line."""
        words, line, first = s.split(), '', True
        for wd in words:
            t = (line + ' ' + wd).strip()
            if self.tw(t, size, font) > width - (0 if first else indent):
                self.text(x + (0 if first else indent), y, line, size, font, col=col)
                y -= lead
                line, first = wd, False
            else:
                line = t
        if line:
            self.text(x + (0 if first else indent), y, line, size, font, col=col)
            y -= lead
        return y

    # ---- hatches (paper mm) ----
    def _clip(self, x, y, w_, h_):
        p = self.c.beginPath()
        p.rect(x * mm, y * mm, w_ * mm, h_ * mm)
        self.c.clipPath(p, stroke=0, fill=0)

    def hatch(self, x, y, w_, h_, step=1.5, ang=45, w=W_HAIR, col=INK):
        c = self.c
        c.saveState()
        self._clip(x, y, w_, h_)
        self.lw(w, col)
        n = int((w_ + h_) / step) + 2
        for i in range(-n, n + 1):
            x0 = x + i * step
            if ang == 45:
                c.line(x0 * mm, y * mm, (x0 + h_) * mm, (y + h_) * mm)
            else:
                c.line(x0 * mm, y * mm, (x0 - h_) * mm, (y + h_) * mm)
        c.restoreState()

    def rc(self, x, y, w_, h_, outline=W_CUT, seed=1):
        """Reinforced concrete in section: grey fill, sparse 45 deg hatch, aggregate dots."""
        self.rect(x, y, w_, h_, w=0, fill=C_RC)
        self.hatch(x, y, w_, h_, step=2.2, ang=45)
        rnd = random.Random(seed * 7919 + int(x * 13 + y * 7))
        self.c.setFillColorRGB(*INK)
        for _ in range(int(w_ * h_ * 0.16)):
            self.c.circle((x + rnd.random() * w_) * mm, (y + rnd.random() * h_) * mm, 0.12 * mm, stroke=0, fill=1)
        if outline:
            self.rect(x, y, w_, h_, w=outline)

    def brick(self, x, y, w_, h_, outline=W_CUT):
        """Brick masonry in section: warm fill, dense 45 deg hatch."""
        self.rect(x, y, w_, h_, w=0, fill=C_BR)
        self.hatch(x, y, w_, h_, step=0.95, ang=135)
        if outline:
            self.rect(x, y, w_, h_, w=outline)

    def brick_face(self, x, y, w_, h_, course=1.9, unit=6.2):
        """Brick wall seen in elevation (not cut)."""
        self.rect(x, y, w_, h_, w=0, fill=(0.975, 0.93, 0.90))
        c = self.c
        c.saveState()
        self._clip(x, y, w_, h_)
        self.lw(W_HAIR, (0.55, 0.42, 0.36))
        n = int(h_ / course) + 1
        for i in range(n + 1):
            yy = y + i * course
            c.line(x * mm, yy * mm, (x + w_) * mm, yy * mm)
            o = (unit / 2) if i % 2 else 0
            xx = x - unit + o
            while xx < x + w_:
                c.line(xx * mm, yy * mm, xx * mm, (yy + course) * mm)
                xx += unit
        c.restoreState()

    def soil(self, x1, x2, y, depth=3.2):
        """Natural ground symbol below a ground line."""
        c = self.c
        c.saveState()
        self._clip(min(x1, x2), y - depth, abs(x2 - x1), depth)
        self.lw(W_HAIR, INK)
        xx = min(x1, x2) - 4
        k = 0
        while xx < max(x1, x2) + 4:
            if k % 4 != 3:
                c.line(xx * mm, y * mm, (xx - depth) * mm, (y - depth) * mm)
            xx += 0.9
            k += 1
        c.restoreState()

    def compact(self, x1, x2, y, depth=2.4):
        """Compacted base: fill plus alternating strokes."""
        self.rect(x1, y - depth, x2 - x1, depth, w=0, fill=C_SOIL)
        c = self.c
        c.saveState()
        self._clip(x1, y - depth, x2 - x1, depth)
        self.lw(W_HAIR, INK)
        xx, k = x1 - 3, 0
        while xx < x2 + 3:
            if k % 2:
                c.line(xx * mm, y * mm, (xx - depth) * mm, (y - depth) * mm)
            else:
                c.line(xx * mm, y * mm, (xx + depth) * mm, (y - depth) * mm)
            xx += 1.6
            k += 1
        c.restoreState()
        self.line(x1, y, x2, y, W_THIN)

    # ---- dimensions (paper mm) ----
    def tick(self, x, y, s=1.1):
        self.line(x - s, y - s, x + s, y + s, 0.28)

    def dim_h(self, x1, x2, y_obj, y_dim, txt, size=7.0, ext=True):
        sg = 1 if y_dim > y_obj else -1
        if ext:
            for xx in (x1, x2):
                self.line(xx, y_obj + sg * 1.0, xx, y_dim + sg * 1.4, W_HAIR + 0.03)
        self.line(x1 - 1.2, y_dim, x2 + 1.2, y_dim, W_HAIR + 0.03)
        self.tick(x1, y_dim)
        self.tick(x2, y_dim)
        self.text((x1 + x2) / 2, y_dim + 0.75, txt, size, anchor='c')

    def dim_v(self, y1, y2, x_obj, x_dim, txt, size=7.0, ext=True):
        sg = 1 if x_dim > x_obj else -1
        if ext:
            for yy in (y1, y2):
                self.line(x_obj + sg * 1.0, yy, x_dim + sg * 1.4, yy, W_HAIR + 0.03)
        self.line(x_dim, y1 - 1.2, x_dim, y2 + 1.2, W_HAIR + 0.03)
        self.tick(x_dim, y1)
        self.tick(x_dim, y2)
        self.text(x_dim - 0.75, (y1 + y2) / 2, txt, size, anchor='c', rot=90)

    def level(self, x, y, txt, shelf=11.5, size=7.0):
        """Level mark: open arrow touching the level, shelf with the value (metres)."""
        self.line(x - 2.5, y, x + 2.5, y, W_HAIR + 0.03)
        self.poly([(x - 1.3, y + 2.0), (x, y), (x + 1.3, y + 2.0)], W_THIN)
        self.line(x, y, x, y + 3.6, W_THIN)
        self.line(x, y + 3.6, x + shelf, y + 3.6, W_THIN)
        self.text(x + 1.0, y + 4.3, txt, size)

    def leader(self, x, y, tx, ty, txt, size=6.8, anchor='l', lines=None, dot=True, bg=None):
        """Leader from object point (x,y) to a text shelf starting at (tx,ty)."""
        rows = lines or [txt]
        wmax = max(self.tw(r, size) for r in rows)
        x_end = tx + wmax + 0.8 if anchor == 'l' else tx - wmax - 0.8
        if bg:
            self.rect(min(tx, x_end) - 0.3, ty - 0.5, abs(x_end - tx) + 0.6, len(rows) * 2.9 + 1.0, w=0, fill=bg)
        self.line(x, y, tx, ty, W_HAIR + 0.03)
        self.line(tx, ty, x_end, ty, W_HAIR + 0.03)
        if dot:
            self.circle(x, y, 0.32, w=0, fill=INK)
        for i, r in enumerate(rows):
            yy = ty + 0.8 + (len(rows) - 1 - i) * 2.9 if True else ty
            if anchor == 'l':
                self.text(tx + 0.4, yy, r, size)
            else:
                self.text(tx - 0.4, yy, r, size, anchor='r')

    def view_title(self, x, y, txt, scale=None):
        self.text(x, y, txt, 10.5, 'B')
        w = self.tw(txt, 10.5, 'B')
        self.line(x, y - 1.1, x + w, y - 1.1, 0.3)
        if scale:
            self.text(x + w + 2.5, y, scale, 8, 'R', col=MUTED)

    def breakline(self, x1, x2, y, w=W_THIN):
        xm = (x1 + x2) / 2
        self.poly([(x1 - 1.5, y), (xm - 1.2, y), (xm - 0.5, y + 1.4), (xm + 0.5, y - 1.4), (xm + 1.2, y), (x2 + 1.5, y)], w)


def frame(p, sheet_title, scale, num, total):
    """Sheet border and title block."""
    c = p.c
    p.rect(20, 5, PW - 25, PH - 10, w=0.5)
    x0, y0, w_, h_ = 230, 5, 185, 40
    p.rect(x0, y0, w_, h_, w=0.5)
    xs = x0 + 115
    p.line(xs, y0, xs, y0 + h_, 0.5)
    p.line(x0, y0 + 28, xs, y0 + 28, W_VIS)
    p.line(x0, y0 + 7, xs, y0 + 7, W_VIS)
    for i in range(1, 4):
        p.line(xs, y0 + i * 10, x0 + w_, y0 + i * 10, W_VIS)
    p.line(xs + 22, y0, xs + 22, y0 + h_, W_VIS)
    p.text(x0 + 2, y0 + 36.5, 'Об’єкт', 5.6, col=MUTED)
    p.text(x0 + 2, y0 + 31, 'ТзДВ «Гал-Кат», площадка № 20. УЗЕ 1,725 МВт / 5 МВт·год', 8.2, 'B')
    p.text(x0 + 2, y0 + 23.8, 'Аркуш', 5.6, col=MUTED)
    yy = y0 + 17.2
    for row in sheet_title:
        p.text(x0 + 2, yy, row, 10.5, 'B')
        yy -= 5.2
    p.text(x0 + 2, y0 + 2.3, 'Джерело геометрії: Golen Power Technology, Annex 1 – Response 1 (довідкові креслення)', 5.9, col=MUTED)
    rows = [('Стадія', 'Ескіз'), ('Масштаб', scale), ('Дата', '11.10.2026'), ('Аркуш', '%d / %d' % (num, total))]
    for i, (k, v) in enumerate(rows):
        yb = y0 + h_ - (i + 1) * 10
        p.text(xs + 1.5, yb + 3.6, k, 6.2, col=MUTED)
        p.text(xs + 24, yb + 3.3, v, 8.6, 'B')
    # status stamp
    s = 'ЕСКІЗ · НЕ ДЛЯ БУДІВНИЦТВА'
    sw = p.tw(s, 8.5, 'B')
    p.rect(PW - 8 - sw - 5, PH - 15.5, sw + 5, 6.5, w=0.35, col=ACC)
    p.text(PW - 8 - sw - 2.5, PH - 13.6, s, 8.5, 'B', col=ACC)


def notes(p, x, y, title, items, width, size=6.8, lead=3.05, gap=1.0):
    p.text(x, y, title, 8.6, 'B')
    y -= 4.6
    for i, s in enumerate(items, 1):
        lab = '%d.' % i
        p.text(x, y, lab, size)
        y = p.para(x + 4.2, y, s, width - 4.2, size, lead=lead) - gap
    return y


def table(p, x, y, cols, rows, size=6.8, rh=5.0, head=True):
    """Simple grid table; cols = [(title, width, anchor)], y = top."""
    wt = sum(cw for _, cw, _ in cols)
    n = len(rows) + (1 if head else 0)
    p.rect(x, y - n * rh, wt, n * rh, w=W_VIS)
    for i in range(1, n):
        p.line(x, y - i * rh, x + wt, y - i * rh, W_THIN)
    xx = x
    for t, cw, an in cols[:-1]:
        xx += cw
        p.line(xx, y, xx, y - n * rh, W_THIN)
    r0 = 0
    if head:
        xx = x
        for t, cw, an in cols:
            p.text(xx + cw / 2, y - rh + 1.6, t, size - 0.4, 'B', anchor='c')
            xx += cw
        r0 = 1
    for i, row in enumerate(rows):
        xx = x
        yb = y - (i + r0 + 1) * rh + 1.6
        for (t, cw, an), val in zip(cols, row):
            if an == 'c':
                p.text(xx + cw / 2, yb, val, size, anchor='c')
            elif an == 'r':
                p.text(xx + cw - 1.2, yb, val, size, anchor='r')
            else:
                p.text(xx + 1.2, yb, val, size)
            xx += cw
    return y - n * rh


# =====================================================================
# Sheet 1: layout plan, 1:100
# =====================================================================
def sheet_layout(c):
    p = Pen(c)
    frame(p, ['План розміщення обладнання', 'УЗЕ на майданчику'], '1 : 100', 1, 4)
    k = 0.01
    ox, oy = 54.0, 62.0
    X = lambda x: ox + x * k
    Y = lambda z: oy + (SITE_D - z) * k          # z grows to the south (down on the sheet)
    p.view_title(ox - 30, 286.5, 'План розміщення обладнання', 'М 1 : 100')

    # zone boundary
    p.rect(X(0), Y(SITE_D), SITE_W * k, SITE_D * k, w=W_THIN, dash=[5, 1.2, 0.6, 1.2], fill=(0.985, 0.988, 0.985))
    x0, x1 = GAP, GAP + L
    z_s, z_b = GAP, GAP + B + GAP               # north edges of PCS block and BESS container

    # --- PCS + transformer block (pos. 2) ---
    unit_pcs(p, lambda x: X(x0 + x), lambda z: Y(z_s + z))
    p.text(X(x0 + 569), Y(z_s + 520), 'LV', 6.0, anchor='c')
    p.text(X(x0 + 569), Y(z_s + 1760), 'HV', 6.0, anchor='c')
    p.text(X(x0 + 2128), Y(z_s + 1180), 'Транс-', 6.0, anchor='c')
    p.text(X(x0 + 2128), Y(z_s + 1470), 'форматор', 6.0, anchor='c')
    p.text(X(x0 + 4590), Y(z_s + 1290), 'PCS', 7.0, 'B', anchor='c')

    # --- BESS container (pos. 1) ---
    unit_bess(p, lambda x: X(x0 + x), lambda z: Y(z_b + z))
    p.text(X(x0 + 3290), Y(z_b + 1150), 'Контейнер BESS', 7.5, 'B', anchor='c')
    p.text(X(x0 + 3290), Y(z_b + 1560), '5 МВт·год', 6.5, anchor='c')

    # position marks
    def pos(n, x, z, tx, tz):
        p.line(X(x), Y(z), tx, tz, W_HAIR + 0.03)
        p.circle(X(x), Y(z), 0.35, w=0, fill=INK)
        p.circle(tx, tz, 3.0, w=W_VIS, fill=(1, 1, 1))
        p.text(tx, tz - 1.25, str(n), 9, 'B', anchor='c')
    # cable channel between the foundations (preliminary sizing)
    cxp, za_, zb_ = x0 + L / 2, z_s + B + OFF, z_b - OFF
    p.rect(X(cxp - 400), Y(zb_), 800 * k, (zb_ - za_) * k, w=W_VIS, fill=(0.86, 0.87, 0.88))
    for dx_ in (-300, 300):
        p.line(X(cxp + dx_), Y(za_), X(cxp + dx_), Y(zb_), W_HAIR + 0.03, dash=[1.0, 0.7])
    pos(3, cxp + 250, (za_ + zb_) / 2, X(x1 + 2300), Y((za_ + zb_) / 2))
    pos(1, x1 - 500, z_b + 500, X(x1 + 2300), Y(z_b - 900))
    pos(2, x1 - 500, z_s + 500, X(x1 + 2300), Y(z_s - 900))
    p.leader(X(x0 + 200), Y(z_b + 600), X(x0 - 4300), Y(z_b - 1500), '', lines=['електрична зона,', 'блок рідинного охолодження'], size=6.3)
    p.leader(X(SITE_W - 1500), Y(0), X(SITE_W - 5200), Y(0) + 6.5, 'умовна межа зони розміщення', size=6.3, dot=False)

    # dimension chains
    yb = Y(SITE_D)
    for a_, b_, t in ((0, x0, '5000'), (x0, x1, '6058'), (x1, SITE_W, '5000')):
        p.dim_h(X(a_), X(b_), yb, yb - 8, t)
    p.dim_h(X(0), X(SITE_W), yb, yb - 15.5, '16058')
    xl = X(0)
    zs = [0, z_s, z_s + B, z_b, z_b + B, SITE_D]
    for a_, b_, t in zip(zs[:-1], zs[1:], ('5000', '2438', '5000', '2438', '5000')):
        p.dim_v(Y(b_), Y(a_), xl, xl - 8, t)
    p.dim_v(Y(SITE_D), Y(0), xl, xl - 15.5, '19876')
    # light extension lines from the containers to the chains
    for zz in (z_s, z_s + B, z_b, z_b + B):
        p.line(xl, Y(zz), X(x0) - 1, Y(zz), W_HAIR, MUTED, dash=[0.6, 0.9])
    for xx in (x0, x1):
        p.line(X(xx), yb, X(xx), Y(z_b + B) - 1, W_HAIR, MUTED, dash=[0.6, 0.9])

    # ---- right column ----
    rx = 236.0
    p.text(rx, 273, 'Експлікація обладнання', 8.6, 'B')
    yb = table(p, rx, 270.5, [('Поз.', 10, 'c'), ('Найменування', 98, 'l'), ('Габарит Д × Ш × В, мм', 44, 'c'), ('Маса', 20, 'c')], [
        ('1', 'Контейнер BESS: LFP 314 А·год, 5 015 кВт·год, рідинне охолодження', '6058 × 2438 × 2896', '≈ 43 т'),
        ('2', 'Блок PCS 1 725 кВт з трансформатором 6 кВ (масляний), відсіки LV/HV', '6058 × 2438 × 2896', '≈ 17 т'),
        ('3', 'Кабельний канал між блоками зі знімними плитами (попередній розрахунок)', '4900 × 600 × 450 у світлі', '—'),
    ], size=6.6, rh=5.4)

    p.text(rx, yb - 8, 'Основні показники', 8.6, 'B')
    yb = table(p, rx, yb - 10.5, [('k', 112, 'l'), ('v', 60, 'r')], [
        ('Зона розміщення (з відступами)', '16 058 × 19 876 мм, ≈ 319 м²'),
        ('Відступ від контейнерів до межі зони', '5 000 мм з кожного боку'),
        ('Відстань між контейнерами', '5 000 мм'),
        ('Позначка верху фундаменту контейнера BESS', '+0,300'),
    ], size=6.6, rh=5.0, head=False)

    yn = notes(p, rx, yb - 8, 'Примітки', [
        'План виконано за довідковим кресленням виробника (Golen, Annex 1 – Response 1, аркуш Layout Drawing). Розміри в міліметрах.',
        'Відступи 5000 мм — рекомендація виробника. Протипожежні відстані до будівель і споруд, проїзди та огорожу перевіряє проєктувальник за чинними нормами.',
        'Двері показано відчиненими на 90°, штрихова дуга — до найбільшого кута. Ширини стулок, кути й зону відчинення наведено на аркуші 2.',
        'Шафи PCS стоять у відкритій частині рами блока поз. 2, їхні дверцята — у глибині контуру (за планом Golen).',
        'Фундамент під блок поз. 2 виробник не надав — запросити. Для масляного трансформатора передбачити маслоприймач.',
        'Кабелі між блоками, кабель 6 кВ до точки приєднання і кабелі зв’язку постачає замовник. Траси на плані не показано.',
        'Прив’язку до місцевості й орієнтацію за сторонами світу визначити на генплані.',
        'Кабельний канал поз. 3 і кабелі в ньому — попередній розрахунок, а не дані Golen. Остаточні перерізи — за переліком кабелів виробника. Канал проходить під зоною відчинення дверей трансформатора, тому плити мають витримувати прохід людей.',
    ], width=176, size=6.6, lead=2.95, gap=0.8)

    # ---- hoisting sketch (end view), 1:100 ----
    kh = 0.01
    ty_ = yn - 4.5
    p.text(rx, ty_, 'Схема стропування контейнера BESS', 8.6, 'B')
    p.text(rx, ty_ - 3.8, 'вигляд з торця, М 1 : 100', 7.0, col=MUTED)
    wv, hv = B * kh, H * kh
    hx, hy = rx + 23.0, ty_ - 68.0
    p.rect(hx - wv / 2, hy, wv, hv, w=W_VIS, fill=C_CONT)
    for sx in (-1, 1):
        for yy in (hy, hy + hv - 1.6):
            p.rect(hx + sx * wv / 2 - (0 if sx < 0 else 1.6), yy, 1.6, 1.6, w=W_THIN, fill=(0.3, 0.33, 0.37))
    hh = (B / 2) / math.tan(math.radians(30)) * kh
    top = hy + hv + hh
    for sx in (-1, 1):
        p.line(hx + sx * wv / 2, hy + hv, hx, top, W_VIS)
    p.line(hx, hy + hv + 3, hx, top, W_HAIR + 0.03, dash=[1.2, 0.8])
    p.arc(hx, top, 10, 240, 270, w=W_THIN)
    p.text(hx - 12.5, top - 9.5, '≤ 30°', 6.6)
    p.circle(hx, top + 1.2, 1.2, w=W_VIS)
    p.line(hx, top + 2.4, hx, top + 6.0, W_VIS)
    p.text(hx, hy + hv / 2 - 1, '≈ 43 т', 7.5, 'B', anchor='c')
    p.leader(hx + wv / 4, hy + hv + hh / 2, hx + 17, hy + hv + hh / 2 + 4, '', lines=['4 стропи,', 'довжина ≥ 4000'], size=6.3, dot=False)
    p.leader(hx + wv / 2 - 0.8, hy + hv - 0.8, hx + 17, hy + hv - 6, 'верхні кутові фітинги', size=6.3)
    p.dim_h(hx - wv / 2, hx + wv / 2, hy, hy - 5.5, '2438', size=6.4)
    p.dim_v(hy, hy + hv, hx - wv / 2, hx - wv / 2 - 6, '2896', size=6.4)
    notes(p, rx, hy - 12.5, 'Вимоги виробника до підйому', [
        'Піднімати за верхні кутові фітинги; кут між стропами не більше 60°.',
        'Перед підйомом оглянути стропи й замкнути всі двері.',
        'Нахил корпусу не більше 5°. Косий підйом і волочіння заборонені.',
        'Не піднімати за сильного вітру та негоди.',
        'Маса: BESS ≈ 43 т, блок PCS ≈ 17 т.',
    ], width=82, size=6.2, lead=2.8, gap=0.5)

    # ---- cable channel section, 1:10 (preliminary sizing) ----
    kc = 0.1
    cx0 = rx + 84.0                       # outer left face of the channel on the sheet
    ct = ty_ - 15.0                       # level of the cover top
    XC = lambda x: cx0 + x * kc
    YC = lambda y: ct + y * kc            # y in mm, 0 at the cover top, negative downwards
    p.text(rx + 72, ty_, 'Переріз кабельного каналу поз. 3', 8.6, 'B')
    p.text(rx + 72, ty_ - 3.8, 'М 1 : 10 · попередній розрахунок, не дані Golen', 7.0, col=MUTED)
    # ground on both sides (surface 20 mm below the cover top)
    for xa, xb in ((-60, 0), (800, 880)):
        p.line(XC(xa), YC(-20), XC(xb), YC(-20), W_VIS)
        p.soil(XC(xa), XC(xb), YC(-20), depth=2.6)
    p.compact(XC(-40), XC(840), YC(-630), depth=2.2)
    p.rc(XC(0), YC(-630), 80, 10, seed=91)                       # bottom
    p.rc(XC(0), YC(-530), 10, 45, seed=92)                       # walls
    p.rc(XC(700), YC(-530), 10, 45, seed=93)
    p.rc(XC(0), YC(-80), 80, 8, seed=94)                         # cover slab
    p.rect(XC(100), YC(-530), 60, 45, w=0, fill=(1, 1, 1))
    # shelf with small cables, earthing strip, DC cables
    p.line(XC(100), YC(-530 + 248), XC(205), YC(-530 + 248), 0.6)
    for xx, r_, col in ((175, 1.4, (0.48, 0.53, 0.56)), (145, 0.8, (0.56, 0.44, 0.75)), (125, 0.6, (0.18, 0.62, 0.42)), (111, 0.6, (0.18, 0.62, 0.42))):
        p.circle(XC(xx), YC(-530 + 248) + r_ + 0.3, r_, w=W_HAIR + 0.04, fill=col)
    p.rect(XC(640), YC(-530), 4.0, 0.5, w=W_HAIR, fill=(0.62, 0.70, 0.23))
    for i in range(8):
        col = (0.75, 0.22, 0.17) if i % 2 == 0 else (0.12, 0.18, 0.23)
        p.circle(XC(400 - 140 + 40 * i), YC(-530) + 1.65, 1.65, w=W_HAIR + 0.04, fill=col)

    def callout(n, x, y, tx, ty):
        p.line(XC(x), YC(y), XC(tx), YC(ty), W_HAIR + 0.03)
        p.circle(XC(tx), YC(ty), 2.2, w=W_THIN, fill=(1, 1, 1))
        p.text(XC(tx), YC(ty) - 0.95, str(n), 6.8, 'B', anchor='c')
    callout(1, 400, -505, 400, -400)
    callout(2, 150, -270, 290, -190)
    callout(3, 660, -527, 600, -450)
    callout(4, 560, -40, 560, 55)
    callout(5, 750, -300, 862, -230)
    # dimensions
    yb_ = YC(-630) - 2.6
    for a_, b_ in ((0, 100), (100, 700), (700, 800)):
        p.dim_h(XC(a_), XC(b_), yb_, yb_ - 5.5, str(b_ - a_), size=6.4)
    p.dim_h(XC(0), XC(800), yb_, yb_ - 11.5, '800', size=6.4)
    xl_ = XC(-60) - 1.0
    for a_, b_ in ((-630, -530), (-530, -80), (-80, 0)):
        p.dim_v(YC(a_), YC(b_), xl_, xl_ - 5.5, str(b_ - a_), size=6.4)
    p.dim_v(YC(-630), YC(0), xl_, xl_ - 11.5, '630', size=6.4)
    yk = yb_ - 18.5
    for n_, t_ in ((1, '8 силових DC-кабелів 1×300 мм² Cu (4 «+» і 4 «−»), один шар'),
                   (2, 'полиця: власні потреби 5×25…35 мм², контрольний кабель, зв’язок'),
                   (3, 'смуга заземлення 40×4'),
                   (4, 'знімна плита перекриття 80 мм'),
                   (5, 'стінки й дно 100 мм, бетон; основа — ущільнений ґрунт')):
        p.text(rx + 72, yk, '%d —' % n_, 6.2, 'B')
        yk = p.para(rx + 78, yk, t_, 98, 6.2, lead=2.8) - 0.4
    c.showPage()


# =====================================================================
# Sheet 2: door opening scheme, 1:50
# =====================================================================
def sheet_doors(c):
    p = Pen(c)
    frame(p, ['Схема відчинення дверей', 'Контейнер BESS і блок PCS'], '1 : 50', 2, 4)
    k = 0.02
    ox = 64.0
    X = lambda x: ox + x * k
    p.view_title(24, 286.5, 'Схема відчинення дверей', 'М 1 : 50')
    W = (1, 1, 1)

    def envelope(pts):
        p.poly(pts, 0.3, ACC, dash=[4, 1, 0.6, 1])

    def tag(x, y, t):
        w_ = p.tw(t, 7.2, 'B') + 2.2
        p.rect(x - w_ / 2, y - 1.3, w_, 4.6, w=W_THIN, fill=W)
        p.text(x, y, t, 7.2, 'B', anchor='c')

    # ------------------------------------------------ PCS block (pos. 2)
    top = 249.0
    Y = lambda z: top - z * k
    p.text(24, 279.5, 'Поз. 2. Блок PCS + трансформатор', 9, 'B')
    p.text(24 + p.tw('Поз. 2. Блок PCS + трансформатор', 9, 'B') + 3, 279.5, 'розміри дверей приблизні, зняті з масштабу креслення Golen', 7, col=MUTED)
    unit_pcs(p, X, Y, detail=True)
    p.text(X(569), Y(470), 'LV', 7, 'B', anchor='c')
    p.text(X(569), Y(1700), 'HV', 7, 'B', anchor='c')
    p.text(X(2128), Y(1230), 'Трансформатор', 7, 'B', anchor='c')
    p.text(X((PX0 + PX1) / 2), Y(1150), 'Шафи PCS', 7, 'B', anchor='c')
    p.text(X((PX0 + PX1) / 2), Y(1380), 'у відкритій рамі', 6.2, anchor='c', col=MUTED)
    # opening zones
    envelope([(X(-SK_W), Y(0)), (X(-SK_W), Y(B))])
    envelope([(X(1000), Y(-TR_N[2])), (X(3020), Y(-TR_N[2]))])
    envelope([(X(1200), Y(B + TR_S[2])), (X(3060), Y(B + TR_S[2]))])
    tag(X(-SK_W / 2), Y(B / 2) - 1.0, 'Д4')
    tag(X(2132), Y(B + 430), 'Д5')
    tag(X(2008), Y(-470), 'Д6')
    tag(X(PX1) - 7.0, Y(PZ0 + 150) - 3.4, 'Д7')
    tag(X(PX1) - 7.0, Y(PZ1 - 150), 'Д7')
    # dimensions (approximate, scaled)
    yn = Y(-TR_N[2]) + 1.0
    for a_, b_ in ((0, 1215), (1215, 2800), (2800, L)):
        p.dim_h(X(a_), X(b_), yn, yn + 6.5, str(b_ - a_))
    ys = Y(B + TR_S[2]) - 1.0
    ch = [0, 1420, 2845, 3166, 3894, 4622, 5343, L]
    for a_, b_ in zip(ch[:-1], ch[1:]):
        p.dim_h(X(a_), X(b_), ys, ys - 6.5, str(b_ - a_))
    xr = X(L)
    for a_, b_ in ((0, PZ0), (PZ0, PZ1), (PZ1, B)):
        p.dim_v(Y(b_), Y(a_), xr + 1.0, xr + 9, str(b_ - a_))
    p.dim_h(X(-SK_W), X(0), Y(0) + 9.0, Y(0) + 15.5, str(SK_W))
    p.dim_v(Y(0), Y(-TR_N[2]), X(1000) - 1.0, X(1000) - 7.5, str(TR_N[2]))
    p.dim_v(Y(B + TR_S[2]), Y(B), X(1200) - 1.0, X(1200) - 7.5, str(TR_S[2]))

    # ------------------------------------------------ BESS container (pos. 1)
    top2 = 152.0
    Y2 = lambda z: top2 - z * k
    p.text(24, 170.5, 'Поз. 1. Контейнер BESS', 9, 'B')
    p.text(24 + p.tw('Поз. 1. Контейнер BESS', 9, 'B') + 3, 170.5, 'ширини стулок і кути — за кресленням Golen', 7, col=MUTED)
    unit_bess(p, X, Y2, detail=True)
    p.text(X(3290), Y2(1050), 'Батарейний відсік', 7.5, 'B', anchor='c')
    p.text(X(3290), Y2(1330), 'двері лише з цього боку', 6.2, anchor='c', col=MUTED)
    p.leader(X(260), Y2(480), X(900), Y2(300), 'електрична зона', size=6.3)
    p.leader(X(260), Y2(1800), X(900), Y2(2000), '', lines=['блок рідинного', 'охолодження'], size=6.3)
    envelope([(X(-1251), Y2(0)), (X(-1251), Y2(B))])
    envelope([(X(0), Y2(B + 884.5)), (X(L), Y2(B + 884.5))])
    for (a_, b_, w_), t in zip(BESS_S, ('Д1', 'Д1', 'Д1')):
        xm = X((a_ + b_) / 2)
        tag(xm, Y2(B + 300), t)
        p.text(xm, Y2(B + 560), '> 120°', 6.4, anchor='c', bg=W)
    tag(X(-520), Y2(520) - 1.0, 'Д2')
    p.text(X(-520), Y2(760), '120°', 6.4, anchor='c')
    tag(X(-640), Y2(1560) - 1.0, 'Д3')
    p.text(X(-640), Y2(1800), '> 120°', 6.4, anchor='c')
    # hinge chain along the door side
    yb = Y2(B + 884.5) - 1.0
    ch = [0, 570, 2311, 2361, 4104, 4153, 5933, L]
    for a_, b_ in zip(ch[:-1], ch[1:]):
        if b_ - a_ > 200:
            p.dim_h(X(a_), X(b_), yb, yb - 6.5, str(b_ - a_))
        else:
            p.line(X(a_), yb - 1.0, X(a_), yb - 7.9, W_HAIR + 0.03)
            p.line(X(b_), yb - 1.0, X(b_), yb - 7.9, W_HAIR + 0.03)
    p.text(X(2336), yb - 10.2, '50', 6.2, anchor='c')
    p.text(X(4128), yb - 10.2, '49', 6.2, anchor='c')
    p.text(X(5995), yb - 10.2, '125', 6.2, anchor='c')
    p.line(X(5933) - 1.2, yb - 6.5, X(L) + 1.2, yb - 6.5, W_HAIR + 0.03)
    p.tick(X(L), yb - 6.5)
    p.dim_h(X(0), X(L), yb, yb - 14.5, '6058')
    # hinge offsets on the end, zone depths
    xw = X(-1251) - 1.0
    p.dim_v(Y2(2276), Y2(143), xw, xw - 6.5, '2133')
    p.text(xw - 7.2, Y2(143) + 3.4, '143', 6.2, anchor='c')
    p.text(xw - 7.2, Y2(2276) - 5.6, '162', 6.2, anchor='c')
    for zz in (0, B):
        p.line(xw - 1.0, Y2(zz), xw - 7.9, Y2(zz), W_HAIR + 0.03)
    p.dim_h(X(-1251), X(0), Y2(0) + 1.0, Y2(0) + 7.5, '1251')
    p.dim_v(Y2(B + 884.5), Y2(B), X(L) + 1.0, X(L) + 8.5, '884,5')

    # ------------------------------------------------ right column: schedule, legend, notes
    rx = 236.0
    p.text(rx, 273, 'Відомість дверей', 8.6, 'B')
    yb = table(p, rx, 270.5, [('Поз.', 9, 'c'), ('Де', 43, 'l'), ('Що за дверима', 37, 'l'), ('Стулки, мм', 49, 'l'), ('Кут', 20, 'c'), ('Джерело', 18, 'c')], [
        ('Д1', 'BESS, зовнішня довга сторона', 'батарейний відсік', '3 двостулкові: 2×881, 2×881, 2×884,5', '> 120°', 'Golen'),
        ('Д2', 'BESS, торець', 'електрична зона', '1 стулка 865', '120°', 'Golen'),
        ('Д3', 'BESS, торець', 'блок рідинного охолодження', '1 стулка 1251', '> 120°', 'Golen'),
        ('Д4', 'Блок PCS, торець', 'відсіки LV і HV', '2 стулки ≈ 1155', 'не вказано', 'масштаб'),
        ('Д5', 'Блок PCS, бік до BESS', 'трансформатор', '2 стулки ≈ 712', 'не вказано', 'масштаб'),
        ('Д6', 'Блок PCS, зовнішній бік', 'трансформатор', '2 стулки ≈ 790', 'не вказано', 'масштаб'),
        ('Д7', 'Блок PCS, обидва боки', 'шафи PCS', '4 + 4 стулки ≈ 670', '90° на плані', 'масштаб'),
    ], size=6.3, rh=5.6)

    yl = yb - 9
    p.text(rx, yl, 'Умовні позначення', 8.6, 'B')
    yl -= 6.5
    p.circle(rx + 1.0, yl + 0.9, 0.5, w=0, fill=INK)
    p.line(rx + 1.0, yl + 0.9, rx + 14, yl + 0.9, 0.4)
    p.text(rx + 17, yl, 'стулка, відчинена на 90°; крапка — петля', 6.8)
    yl -= 5.6
    p.line(rx, yl + 0.9, rx + 14, yl + 0.9, W_HAIR + 0.05, MUTED, dash=[1.8, 0.8])
    p.text(rx + 17, yl, 'стулка на найбільшому куті та шлях її краю', 6.8)
    yl -= 5.6
    p.line(rx, yl + 0.9, rx + 14, yl + 0.9, 0.3, ACC, dash=[4, 1, 0.6, 1])
    p.text(rx + 17, yl, 'межа зони відчинення (найбільший виступ стулки)', 6.8)
    yl -= 5.6
    tag(rx + 7, yl, 'Д1')
    p.text(rx + 17, yl, 'позиція у відомості дверей', 6.8)

    notes(p, rx, yl - 9.5, 'Примітки', [
        'Контейнер BESS: петлі, ширини стулок і кути взято з креслення Golen (Layout Drawing). Розміри в міліметрах.',
        'Блок PCS: виробник не вказав ні ширин стулок, ні кутів. Ширини й положення петель знято з масштабу креслення (точність близько ±20 мм), стулки показано на 90°. Уточнити у виробника.',
        'Зона відчинення: BESS — 885 мм від довгої стіни та 1251 мм від торця; блок PCS — близько 1155 мм від торця, 790 і 712 мм від довгих сторін. У цій зоні не ставити огорожу, стояки, шафи чи опори.',
        'У BESS сусідні стулки різних дверей мають петлі через 50 мм, тому обидві одночасно відчиняються не більше ніж на 90° (висновок із геометрії).',
        'Шафи PCS стоять у глибині відкритої рами: дверцята за 549 мм від зовнішнього краю і за 626 мм від краю з боку BESS. Відчинена стулка виступає за контур рами приблизно на 120 і 45 мм.',
        'Верх фундаменту +0,300, тож поріг дверей вищий за рівень землі. Сходинки Golen показав лише з торця BESS; майданчики для обслуговування решти дверей передбачити проєктом.',
    ], width=176, size=6.6)
    c.showPage()


# =====================================================================
# Sheet 3: BESS container foundation, 1:40
# =====================================================================
def sheet_foundation(c):
    p = Pen(c)
    frame(p, ['Фундамент контейнера BESS', 'План, розрізи 1–1 і 2–2, вузол А'], '1 : 40; 1 : 10', 3, 4)
    k = 1 / 40.0

    # ------------------------------------------------ plan
    ox, oy = 50.0, 203.0
    X = lambda x: ox + x * k
    Y = lambda y: oy + y * k
    p.view_title(ox - 22, 286.5, 'План фундаменту', 'М 1 : 40 (контейнер умовно знято)')
    # brick wall ring, then columns over it
    p.rect(X(0), Y(0), LF * k, BF * k, w=0, fill=C_BR)
    p.hatch(X(0), Y(0), LF * k, BF * k, step=0.95, ang=135)
    p.rect(X(BEAM), Y(BEAM), (LF - 2 * BEAM) * k, (BF - 2 * BEAM) * k, w=W_CUT, fill=(1, 1, 1))
    p.rect(X(0), Y(0), LF * k, BF * k, w=W_CUT)
    for yy in (0, BF - BEAM):
        for i, xx in enumerate(COLX):
            p.rc(X(xx), Y(yy), BEAM * k, BEAM * k, seed=i + (10 if yy else 0))
            p.rect(X(xx + 25), Y(yy + 25), 300 * k, 300 * k, w=W_THIN, dash=[0.8, 0.5])
    # container outline
    p.rect(X(OFF), Y(OFF), L * k, B * k, w=0.32, col=ACC, dash=[3, 0.8, 0.5, 0.8])
    p.text(X(LF / 2), Y(BF / 2) + 3.2, 'Кабельний простір', 8.2, 'B', anchor='c')
    p.text(X(LF / 2), Y(BF / 2) - 0.6, '5458 × 1838 у світлі, глибина 1800 від верху фундаменту', 6.6, anchor='c')
    p.text(X(LF / 2), Y(BF / 2) - 4.2, 'контур контейнера 6058 × 2438 (штрихпунктир)', 6.4, anchor='c', col=ACC)
    # steps at the door end (west)
    sw = 1600
    for i in (1, 2):
        p.rect(X(-300 * i), Y(BF / 2 - sw / 2), 300 * k, sw * k, w=W_THIN, fill=(0.93, 0.94, 0.95))
    p.leader(X(-450), Y(BF / 2 + sw / 2 - 150), X(-750), Y(BF) + 8.5, '', lines=['сходинки 2 × (300 × 150),', 'бік і ширину уточнити'], size=6.3)
    # section marks
    ya = Y(BEAM / 2)
    for xa, xb in ((X(0) - 4.5, X(0) - 1.0), (X(LF) + 1.0, X(LF) + 4.5)):
        p.line(xa, ya, xb, ya, 0.7)
    p.line(X(0) - 3.6, ya, X(0) - 3.6, ya + 4.2, W_VIS)
    p.poly([(X(0) - 4.4, ya + 2.8), (X(0) - 3.6, ya + 4.6), (X(0) - 2.8, ya + 2.8)], w=W_THIN, fill=INK, close=True)
    p.line(X(LF) + 3.6, ya, X(LF) + 3.6, ya + 4.2, W_VIS)
    p.poly([(X(LF) + 2.8, ya + 2.8), (X(LF) + 3.6, ya + 4.6), (X(LF) + 4.4, ya + 2.8)], w=W_THIN, fill=INK, close=True)
    p.text(X(0) - 6.4, ya + 1.2, '1', 9, 'B', anchor='c')
    p.text(X(LF) + 6.4, ya + 1.2, '1', 9, 'B', anchor='c')
    xc = X(COLX[1] + BEAM / 2)
    for ya_, yb_ in ((Y(BF) + 1.0, Y(BF) + 4.5), (Y(0) - 4.5, Y(0) - 1.0)):
        p.line(xc, ya_, xc, yb_, 0.7)
    for yy in (Y(BF) + 3.6, Y(0) - 3.6):
        p.line(xc, yy, xc - 3.0, yy, W_VIS)
        p.poly([(xc - 2.0, yy - 0.8), (xc - 3.6, yy), (xc - 2.0, yy + 0.8)], w=W_THIN, fill=INK, close=True)
    p.text(xc + 2.2, Y(BF) + 2.2, '2', 9, 'B', anchor='c')
    p.text(xc + 2.2, Y(0) - 4.8, '2', 9, 'B', anchor='c')
    # node mark at the north-east column
    p.circle(X(COLX[3] + BEAM / 2), Y(BF - BEAM / 2), 6.5, w=W_THIN)
    p.text(X(COLX[3] + BEAM / 2) - 9.0, Y(BF - BEAM / 2) - 8.0, 'А', 10, 'B', anchor='c')
    # leaders
    p.leader(X(COLX[2] + 175), Y(BF - 175), X(COLX[2] + 900), Y(BF) + 8.5, '', lines=['колона 350 × 350, 8 шт.,', 'із закладною деталлю зверху'], size=6.3)
    p.leader(X(1150), Y(BF - 175), X(450), Y(BF) + 8.5, 'цегляна кладка', size=6.3)
    # dimensions
    edges = [0, 350, 2000, 2350, 3808, 4158, 5808, 6158]
    for a_, b_ in zip(edges[:-1], edges[1:]):
        p.dim_h(X(a_), X(b_), Y(0), Y(0) - 9, str(b_ - a_))
    p.dim_h(X(0), X(LF), Y(0), Y(0) - 16, '6158')
    for a_, b_ in ((0, 350), (350, 2188), (2188, 2538)):
        p.dim_v(Y(a_), Y(b_), X(LF) + 7.5, X(LF) + 14, str(b_ - a_))
    p.dim_v(Y(0), Y(BF), X(LF) + 7.5, X(LF) + 21, '2538')

    # ------------------------------------------------ section 1-1
    Y0 = 128.0
    Z = lambda z: Y0 + z * k
    p.view_title(ox - 22, 176.5, '1–1', 'М 1 : 40 (по осі поздовжньої стіни)')
    gl, gr = X(-900), X(LF + 500)
    # compacted base under the ring beam
    p.compact(X(-250), X(LF + 250), Z(BEAM_BOT))
    # ring beam (cut lengthwise)
    p.rc(X(0), Z(BEAM_BOT), LF * k, BEAM * k, seed=3)
    for zz in (BEAM_BOT + 45, COL_BOT - 45):
        p.line(X(40), Z(zz), X(LF - 40), Z(zz), 0.32)
    xs_ = 100
    while xs_ < LF:
        p.line(X(xs_), Z(BEAM_BOT + 45), X(xs_), Z(COL_BOT - 45), W_HAIR + 0.03)
        xs_ += 200
    # brick infill and columns
    for i in range(3):
        xa = COLX[i] + BEAM
        p.brick(X(xa), Z(COL_BOT), (COLX[i + 1] - xa) * k, (F_TOP - COL_BOT) * k)
    for i, xx in enumerate(COLX):
        p.rc(X(xx), Z(COL_BOT), BEAM * k, (F_TOP - COL_BOT) * k, seed=20 + i)
        p.line(X(xx + 25), Z(F_TOP) + 0.18, X(xx + 325), Z(F_TOP) + 0.18, 0.55)
    # container (lower part) with break line
    ct = F_TOP + 950
    p.rect(X(OFF), Z(F_TOP) + 0.4, L * k, (ct - F_TOP) * k - 0.4, w=0, fill=C_CONT)
    p.line(X(OFF), Z(F_TOP) + 0.4, X(OFF + L), Z(F_TOP) + 0.4, W_VIS)
    p.line(X(OFF), Z(F_TOP) + 0.4, X(OFF), Z(ct), W_VIS)
    p.line(X(OFF + L), Z(F_TOP) + 0.4, X(OFF + L), Z(ct), W_VIS)
    p.line(X(OFF), Z(F_TOP + 160), X(OFF + L), Z(F_TOP + 160), W_THIN)
    p.breakline(X(OFF), X(OFF + L), Z(ct))
    p.text(X(LF / 2), Z(F_TOP + 480), 'Контейнер BESS, ≈ 43 т', 7.6, 'B', anchor='c')
    # steps (door end), ground lines
    p.poly([(X(0), Z(F_TOP)), (X(-300), Z(F_TOP)), (X(-300), Z(150)), (X(-600), Z(150)), (X(-600), Z(0)), (X(0), Z(0))],
           w=W_VIS, fill=(0.90, 0.91, 0.92), close=True)
    p.line(gl, Z(0), X(-600), Z(0), W_VIS)
    p.line(X(LF), Z(0), gr, Z(0), W_VIS)
    p.soil(gl, X(0), Z(0))
    p.soil(X(LF), gr, Z(0))
    # levels
    lx = X(LF) + 13.5
    for zz, t in ((F_TOP, '+0,300'), (0, '0,000'), (COL_BOT, '−1,500'), (BEAM_BOT, '−1,850')):
        p.line(X(LF) + 1.2, Z(zz), lx - 2.5, Z(zz), W_HAIR + 0.03)
        p.level(lx, Z(zz), t)
    # leaders
    W = (1, 1, 1)
    p.leader(X(COLX[1] + 175), Z(-560), X(COLX[1] + 620), Z(-420), '', lines=['колона 350 × 350,', 'бетон C25'], size=6.3, bg=W)
    p.leader(X(4500), Z(-1000), X(4700), Z(-860), '', lines=['цегляна кладка,', 'розчин М20'], size=6.3, bg=W)
    p.leader(X(520), Z(BEAM_BOT + 170), X(760), Z(BEAM_BOT) - 9.5, 'обв’язувальна балка 350 × 350, бетон C25: 4Ø12, хомути Ø8 крок 200', size=6.3)
    p.leader(X(3800), Z(BEAM_BOT) - 1.2, X(4020), Z(BEAM_BOT) - 9.5, 'ущільнений ґрунт, коефіцієнт ущільнення ≥ 0,94', size=6.3)
    p.leader(X(COLX[2] + 175), Z(F_TOP) + 0.2, X(COLX[2] + 560), Z(F_TOP + 950) + 5.5, 'закладна деталь на оголовку колони', size=6.3)
    p.leader(X(-450), Z(160), X(-860), Z(F_TOP) + 9.5, 'сходинки', size=6.3)
    p.text(X(LF / 2), Z(BEAM_BOT) - 16.5, 'Горизонтальні розміри — за планом (розріз у проєкційному зв’язку з планом).', 6.3, 'I', anchor='c', col=MUTED)
    yb = Z(BEAM_BOT) - 2.4

    # ------------------------------------------------ section 2-2
    ox2 = 250.0
    X2 = lambda x: ox2 + x * k
    p.view_title(ox2 - 12, 176.5, '2–2', 'М 1 : 40')
    p.compact(X2(-250), X2(BF + 250), Z(BEAM_BOT))
    # far end wall and far beam in elevation
    p.brick_face(X2(BEAM), Z(COL_BOT), (BF - 2 * BEAM) * k, (F_TOP - COL_BOT) * k)
    p.rect(X2(BEAM), Z(BEAM_BOT), (BF - 2 * BEAM) * k, BEAM * k, w=W_THIN, fill=(0.93, 0.935, 0.94))
    p.line(X2(BEAM), Z(F_TOP), X2(BF - BEAM), Z(F_TOP), W_THIN)
    # cut columns and beams
    for j, xx in enumerate((0, BF - BEAM)):
        p.rc(X2(xx), Z(COL_BOT), BEAM * k, (F_TOP - COL_BOT) * k, seed=40 + j)
        p.rc(X2(xx), Z(BEAM_BOT), BEAM * k, BEAM * k, seed=50 + j)
        p.rect(X2(xx + 40), Z(BEAM_BOT + 40), 270 * k, 270 * k, w=0.3)
        for dx in (62, 288):
            for dz in (62, 288):
                p.circle(X2(xx + dx), Z(BEAM_BOT + dz), 0.42, w=0, fill=INK)
        p.line(X2(xx + 25), Z(F_TOP) + 0.18, X2(xx + 325), Z(F_TOP) + 0.18, 0.55)
    # cable supports (schematic)
    for xx in (BEAM + 250, BF - BEAM - 250):
        p.line(X2(xx), Z(COL_BOT), X2(xx), Z(COL_BOT + 420), W_VIS)
    p.line(X2(BEAM + 150), Z(COL_BOT + 420), X2(BF - BEAM - 150), Z(COL_BOT + 420), W_VIS)
    p.line(X2(BEAM + 150), Z(COL_BOT + 250), X2(BF - BEAM - 150), Z(COL_BOT + 250), W_VIS)
    for i in range(5):
        p.circle(X2(BEAM + 420 + i * 250), Z(COL_BOT + 420) + 1.0, 0.9, w=W_THIN, fill=(1, 1, 1))
    p.text(X2(BF / 2), Z(-330), 'кабельний простір', 6.8, 'B', anchor='c', bg=W)
    p.text(X2(BF / 2), Z(-470), 'у глибині — торцева стіна', 6.0, anchor='c', col=MUTED, bg=W)
    p.text(X2(BF / 2), Z(COL_BOT + 560), 'кабельні опори (умовно)', 6.0, anchor='c', bg=W)
    # container
    p.rect(X2(OFF), Z(F_TOP) + 0.4, B * k, (ct - F_TOP) * k - 0.4, w=0, fill=C_CONT)
    p.line(X2(OFF), Z(F_TOP) + 0.4, X2(OFF + B), Z(F_TOP) + 0.4, W_VIS)
    p.line(X2(OFF), Z(F_TOP) + 0.4, X2(OFF), Z(ct), W_VIS)
    p.line(X2(OFF + B), Z(F_TOP) + 0.4, X2(OFF + B), Z(ct), W_VIS)
    p.line(X2(OFF), Z(F_TOP + 160), X2(OFF + B), Z(F_TOP + 160), W_THIN)
    p.breakline(X2(OFF), X2(OFF + B), Z(ct))
    p.text(X2(BF / 2), Z(F_TOP + 480), 'Контейнер BESS', 7.2, 'B', anchor='c')
    # ground
    g1, g2 = X2(-700), X2(BF + 450)
    p.line(g1, Z(0), X2(0), Z(0), W_VIS)
    p.line(X2(BF), Z(0), g2, Z(0), W_VIS)
    p.soil(g1, X2(0), Z(0))
    p.soil(X2(BF), g2, Z(0))
    # dimensions
    for a_, b_ in ((0, 350), (350, 2188), (2188, 2538)):
        p.dim_h(X2(a_), X2(b_), yb, yb - 7.5, str(b_ - a_))
    p.dim_h(X2(0), X2(BF), yb, yb - 14.5, '2538')
    xr = X2(BF)
    for a_, b_ in ((BEAM_BOT, COL_BOT), (COL_BOT, 0), (0, F_TOP)):
        p.dim_v(Z(a_), Z(b_), xr, xr + 17, str(b_ - a_))
    p.dim_v(Z(BEAM_BOT), Z(F_TOP), xr, xr + 24, '2150')

    # ------------------------------------------------ node A, 1:10
    kn = 0.1
    nx0, ny0 = 350.0, 206.0                      # column lower-left (break) corner
    XN = lambda x: nx0 + x * kn
    YN = lambda z: ny0 + (z + 300) * kn          # z relative to the column top (+0,300)
    p.view_title(312, 286.5, 'Вузол А', 'М 1 : 10')
    p.rc(XN(0), YN(-300), 350 * kn, 300 * kn, outline=0, seed=77)
    p.line(XN(0), YN(-300), XN(0), YN(0), W_CUT)
    p.line(XN(350), YN(-300), XN(350), YN(0), W_CUT)
    p.line(XN(0), YN(0), XN(350), YN(0), W_CUT)
    p.breakline(XN(0), XN(350), YN(-300))
    # embedded plate with hooked anchors
    p.rect(XN(25), YN(0), 300 * kn, 12 * kn, w=W_VIS, fill=(0.25, 0.28, 0.32))
    for ax in (95, 255):
        p.line(XN(ax), YN(0), XN(ax), YN(-170), 0.7)
        sgn = 1 if ax < 175 else -1
        p.arc(XN(ax) + sgn * 1.2, YN(-170), 1.2, 180 if sgn > 0 else 270, 270 if sgn > 0 else 360, w=0.7)
    # column rebar (schematic, as on the reference detail)
    for rx_ in (40, 310):
        p.line(XN(rx_), YN(-300), XN(rx_), YN(-40), 0.45)
    p.line(XN(40), YN(-40), XN(310), YN(-40), 0.45)
    for zz in (-90, -170, -250):
        for rx_ in (27, 323):
            p.circle(XN(rx_), YN(zz), 0.45, w=0, fill=INK)
    # container bottom rail and wall (outer face 50 mm inside the column outer face)
    p.rect(XN(140), YN(12), 160 * kn, 160 * kn, w=W_VIS, fill=C_CONT)
    p.rect(XN(150), YN(22), 140 * kn, 140 * kn, w=W_THIN, fill=(1, 1, 1))
    p.rect(XN(262), YN(172), 38 * kn, 180 * kn, w=W_VIS, fill=C_CONT)
    p.line(XN(-60), YN(172), XN(262), YN(172), W_VIS)
    p.breakline(XN(250), XN(312), YN(352))
    p.poly([(XN(-60) , YN(172)), (XN(-60) - 0.6, YN(172) + 1.2), (XN(-60) + 0.6, YN(172) - 1.2)], W_THIN)
    # weld marks
    for wx, sgn in ((300, 1), (140, -1)):
        p.poly([(XN(wx), YN(12)), (XN(wx + sgn * 16), YN(12)), (XN(wx), YN(28))], w=W_THIN, fill=INK, close=True)
    # dims and labels
    p.dim_h(XN(0), XN(350), YN(-300), YN(-300) - 6.5, '350')
    p.dim_h(XN(300), XN(350), YN(352), YN(352) + 5.5, '50')
    p.line(XN(350), YN(0), XN(350), YN(352) + 1.4, W_HAIR, MUTED, dash=[0.6, 0.9])
    p.level(XN(350) + 7.5, YN(0), '+0,300')
    p.line(XN(350) + 1, YN(0), XN(350) + 5, YN(0), W_HAIR + 0.03)
    p.leader(XN(60), YN(6), XN(-170), YN(120), '', lines=['закладна пластина', 'з анкерами'], size=6.2, anchor='r')
    p.leader(XN(150), YN(90), XN(-170), YN(260), '', lines=['нижня рама', 'контейнера'], size=6.2, anchor='r')
    p.leader(XN(308), YN(18), XN(390), YN(120), '', lines=['зварювання', 'по контуру опори'], size=6.2)
    p.leader(XN(281), YN(290), XN(390), YN(250), 'стінка контейнера', size=6.2)
    p.leader(XN(200), YN(-230), XN(-170), YN(-200), '', lines=['колона 350 × 350,', 'бетон C25'], size=6.2, anchor='r')

    # ------------------------------------------------ legend, quantities, notes
    lx0, ly0 = 345.0, 189.0
    p.text(lx0, ly0, 'Умовні позначення', 8.6, 'B')
    yy = ly0 - 8.5
    p.rc(lx0, yy, 11, 5.2, outline=W_VIS, seed=5)
    p.text(lx0 + 13.5, yy + 1.6, 'залізобетон у розрізі', 6.8)
    yy -= 7.2
    p.brick(lx0, yy, 11, 5.2, outline=W_VIS)
    p.text(lx0 + 13.5, yy + 1.6, 'цегляна кладка у розрізі', 6.8)
    yy -= 7.2
    p.compact(lx0, lx0 + 11, yy + 5.2, depth=5.2)
    p.rect(lx0, yy, 11, 5.2, w=W_VIS)
    p.text(lx0 + 13.5, yy + 1.6, 'ущільнений ґрунт основи', 6.8)
    yy -= 7.2
    p.line(lx0, yy + 4.6, lx0 + 11, yy + 4.6, W_VIS)
    p.soil(lx0, lx0 + 11, yy + 4.6)
    p.text(lx0 + 13.5, yy + 1.6, 'природний ґрунт', 6.8)

    yy -= 9.5
    p.text(lx0, yy, 'Обсяги (орієнтовно)', 8.6, 'B')
    table(p, lx0, yy - 2.5, [('k', 46, 'l'), ('v', 20, 'r')], [
        ('Бетон C25, балка 350 × 350', '1,96 м³'),
        ('Бетон C25, колони 8 шт.', '1,76 м³'),
        ('Бетон разом', '3,72 м³'),
        ('Кладка, площа стін (h = 1,8 м)', '23,7 м²'),
        ('Арматура Ø12 (без напусків)', '64 м'),
        ('Хомути Ø8, крок 200', '≈ 80 шт.'),
    ], size=6.4, rh=4.6, head=False)

    ny = 55.5
    col_w = 97.0
    items = [
        'Ескіз виконано за довідковим кресленням виробника (Golen, Annex 1 – Response 1, аркуш Reference Foundation Drawing of 5MWh BESS Container). Розміри в міліметрах, позначки в метрах.',
        'Бетон C25 за позначенням виробника (орієнтовно C20/25). Балка 350 × 350: 4Ø12 поздовжні, хомути Ø8 з кроком 200. Армування колон виробник не специфікував — за розрахунком.',
        'Основа — ущільнений ґрунт, коефіцієнт ущільнення не менше 0,94.',
        'Між колонами — цегляна кладка на розчині М20 (позначення виробника). Товщину кладки на кресленні Golen не вказано, показано умовно 350 мм.',
        'На оголовках колон — закладні деталі, раму контейнера приварити до них (вузол А). Розміри пластин і анкерів уточнити у виробника.',
        'До заведення кабелів установити кабельні опори внизу фундаменту. Отвори для вводу кабелів і відведення води з кабельного простору на кресленні Golen не показані — передбачити проєктом.',
        'Сходинки показано з боку торцевих дверей контейнера. Бік розміщення і ширину уточнити.',
        'Орієнтовний тиск під підошвою балки ≈ 120 кПа (контейнер 43 т і власна вага фундаменту ≈ 24 т на площу ≈ 5,6 м²). Перевірити за ґрунтовими умовами; глибину закладання звірити з глибиною промерзання.',
        'Креслення є ескізом і не замінює робочу документацію. Перед бетонуванням потрібні підтвердження Golen і розрахунок проєктувальника.',
    ]
    p.text(25, ny, 'Примітки', 8.6, 'B')
    y1 = ny - 4.6
    xcol = 25.0
    for i, s in enumerate(items, 1):
        # estimate height to decide on column break
        if i == 6:
            xcol, y1 = 25.0 + col_w + 6, ny - 4.6
        p.text(xcol, y1, '%d.' % i, 6.5)
        y1 = p.para(xcol + 4.0, y1, s, col_w - 4.0, 6.5, lead=2.9) - 0.7
    c.showPage()


# =====================================================================
# Sheet 4: 3D views
# =====================================================================
def sheet_views(c, img_dir):
    p = Pen(c)
    frame(p, ['Загальний вигляд', '3D-модель майданчика і фундаменту'], 'без масштабу', 4, 4)
    p.view_title(26, 286.5, 'Загальний вигляд (3D-модель)')

    from reportlab.lib.utils import ImageReader

    def img(name, x, y, w_, cap):
        iw, ih = ImageReader(img_dir + '/' + name).getSize()
        h_ = w_ * ih / float(iw)
        c.drawImage(img_dir + '/' + name, x * mm, y * mm, w_ * mm, h_ * mm)
        p.rect(x, y, w_, h_, w=W_VIS)
        p.text(x, y - 4.2, cap, 7.4)
        return h_
    img('q_closed.png', 26, 152, 190, 'а) Розміщення контейнерів, двері зачинені. Підземну частину фундаментів видно крізь умовно прозорий ґрунт.')
    img('q_open.png', 222, 152, 190, 'б) Усі двері відчинені: BESS — з довгого боку та з торця, блок PCS — з торця і з обох довгих боків.')
    img('q_open_pcs.png', 26, 53, 132, 'в) Блок PCS із зовнішнього боку: шафи PCS у відкритій рамі, двері трансформатора.')
    img('q_found.png', 164, 53, 132, 'г) Фундаменти й кабельний канал без ґрунту, плити каналу знято.')
    notes(p, 303, 139, 'Що на моделі показано умовно', [
        'Фундамент блока PCS (помаранчевий, напівпрозорий): Golen дав креслення лише для контейнера BESS.',
        'Відкрита рама з дахом над шафами PCS, висота шаф і дверей.',
        'Те, що видно за дверима, товщина кладки, ширина сходинок.',
        'Кабельний канал і кабелі в ньому: попередній розрахунок, траса в кабельних просторах умовна.',
        'Інтерактивна модель, де двері відчиняються клацанням, надається окремо.',
    ], width=108)
    c.showPage()


if __name__ == '__main__':
    out, img_dir = sys.argv[1], sys.argv[2]
    c = canvas.Canvas(out, pagesize=(PW * mm, PH * mm))
    c.setTitle('ГалКат, площадка 20: план розміщення і фундамент контейнера BESS')
    c.setAuthor('Ескіз за довідковими кресленнями Golen Power Technology')
    c.setSubject('УЗЕ 1,725 МВт / 5 МВт·год')
    sheet_layout(c)
    sheet_doors(c)
    sheet_foundation(c)
    sheet_views(c, img_dir)
    c.save()
    print('saved', out)
