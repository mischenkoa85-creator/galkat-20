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

# ---- reinforcement (preliminary; beam 4Ø12 + Ø8@200 after Golen, everything else my proposal) ----
KGM = {6: 0.222, 8: 0.395, 10: 0.617, 12: 0.888}       # kg per metre
COVER, A_BAR = 40, 54                                   # cover to the stirrup; bar centre from the face (40 + 8 + 12/2)
PREP = 100                                              # lean concrete under the ring beam (recommended)
ST_OUT = BEAM - 2 * COVER                               # stirrup outer size, 270
BEAM_ST_X = [50 + 200 * i for i in range(31)] + [LF - 50]          # stirrups of a long beam (x)
BEAM_ST_Z = [BEAM + 50 + 200 * i for i in range(9)] + [BF - BEAM - 50]   # stirrups of a short beam (z)
COL_ST_Y = [-1450 + 200 * i for i in range(8)] + [50, 150, 250]   # column stirrups (levels, mm)
N_ST = 2 * len(BEAM_ST_X) + 2 * len(BEAM_ST_Z) + 8 * len(COL_ST_Y)
# channel, cover slabs, lintels
CH_L, CH_W, CH_T, CH_D, CH_COV = 4900, 600, 100, 450, 80
SLAB_N, SLAB_L = 10, 478
U_Z = [50 + 200 * i for i in range(25)]
# position: (diameter, class, length mm, shape, count per unit, note)
REBAR = [
    ('f', '1', 12, 'A500C', 6080, '', 8, 'балка, поздовжні'),
    ('f', '2', 12, 'A500C', 2460, '', 8, 'балка, торці'),
    ('f', '3', 12, 'A500C', 1200, 'Г 600 × 600', 16, 'кути балки'),
    ('f', '4', 12, 'A500C', 2240, 'Г 2040 + 200', 32, 'колони, 4 на колону'),
    ('f', '5', 8, 'A240C', 1240, 'хомут 270 × 270', N_ST, '%d балка + %d колони' % (2 * len(BEAM_ST_X) + 2 * len(BEAM_ST_Z), 8 * len(COL_ST_Y))),
    ('c', '6', 8, 'A500C', 1640, 'П 470 + 700 + 470', len(U_Z), 'крок 200'),
    ('c', '7', 8, 'A500C', 4840, '', 8, '4 у дні, по 2 у стінах'),
    ('s', '8', 8, 'A500C', 750, '', 4, 'поперечні, знизу'),
    ('s', '9', 8, 'A500C', 430, '', 5, 'поздовжні'),
    ('l', '10', 10, 'A500C', 860, '', 3, 'нижні'),
    ('l', '11', 6, 'A240C', 310, '', 5, 'поперечні'),
]
MN_PLATE = 0.300 * 0.300 * 0.012 * 7850                # kg
MN_ANCH = 4 * 0.230 * KGM[12]
MN_KG = MN_PLATE + MN_ANCH


def unit_mass(d, length):
    return length / 1000.0 * KGM[d]


def steel_by(group):
    """kg by (class, diameter) for one unit of the group."""
    out = {}
    for g, pos, d, cl, ln, shp, n, note in REBAR:
        if g == group:
            out[(cl, d)] = out.get((cl, d), 0) + n * unit_mass(d, ln)
    return out


# concrete, m3
V_BEAM = BEAM * BEAM * (2 * LF + 2 * (BF - 2 * BEAM)) / 1e9
V_COLS = 8 * BEAM * BEAM * (F_TOP - COL_BOT) / 1e9
V_PREP = PREP * ((LF + 2 * PREP) * (BF + 2 * PREP) - (LF - 2 * BEAM - 2 * PREP) * (BF - 2 * BEAM - 2 * PREP)) / 1e9
V_CHAN = ((CH_W + 2 * CH_T) * CH_T + 2 * CH_T * CH_D) * CH_L / 1e9
V_SLABS = SLAB_N * (CH_W + 2 * CH_T) * SLAB_L * CH_COV / 1e9
V_LINT = 2 * 900 * BEAM * 120 / 1e9



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
    rows = [('Стадія', 'Ескіз'), ('Масштаб', scale), ('Дата', '12.10.2026'), ('Аркуш', '%d / %d' % (num, total))]
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
    frame(p, ['План розміщення обладнання', 'УЗЕ на майданчику'], '1 : 100', 1, 5)
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
                   (5, 'стінки й дно 100 мм, бетон C25, армування — аркуш 4; основа — ущільнений ґрунт')):
        p.text(rx + 72, yk, '%d —' % n_, 6.2, 'B')
        yk = p.para(rx + 78, yk, t_, 98, 6.2, lead=2.8) - 0.4
    c.showPage()


# =====================================================================
# Sheet 2: door opening scheme, 1:50
# =====================================================================
def sheet_doors(c):
    p = Pen(c)
    frame(p, ['Схема відчинення дверей', 'Контейнер BESS і блок PCS'], '1 : 50', 2, 5)
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
    frame(p, ['Фундамент контейнера BESS', 'План, розрізи 1–1 і 2–2, вузол А'], '1 : 40; 1 : 10', 3, 5)
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
    # lean concrete (recommended) and compacted base under the ring beam
    p.compact(X(-250), X(LF + 250), Z(BEAM_BOT - PREP))
    p.rect(X(-PREP), Z(BEAM_BOT - PREP), (LF + 2 * PREP) * k, PREP * k, w=W_THIN, fill=(0.86, 0.87, 0.88))
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
    p.leader(X(3800), Z(BEAM_BOT - PREP / 2), X(4020), Z(BEAM_BOT) - 12.0, '', lines=['бетонна підготовка 100 мм, C8/10 (рекомендовано),', 'під нею — ґрунт, ущільнений до kу ≥ 0,94'], size=6.3)
    p.leader(X(COLX[2] + 175), Z(F_TOP) + 0.2, X(COLX[2] + 560), Z(F_TOP + 950) + 5.5, 'закладна деталь на оголовку колони', size=6.3)
    p.leader(X(-450), Z(160), X(-860), Z(F_TOP) + 9.5, 'сходинки', size=6.3)
    p.text(X(LF / 2), Z(BEAM_BOT) - 18.5, 'Горизонтальні розміри — за планом (розріз у проєкційному зв’язку з планом).', 6.3, 'I', anchor='c', col=MUTED)
    yb = Z(BEAM_BOT) - 2.4

    # ------------------------------------------------ section 2-2
    ox2 = 250.0
    X2 = lambda x: ox2 + x * k
    p.view_title(ox2 - 12, 176.5, '2–2', 'М 1 : 40')
    p.compact(X2(-250), X2(BF + 250), Z(BEAM_BOT - PREP))
    p.rect(X2(-PREP), Z(BEAM_BOT - PREP), (BF + 2 * PREP) * k, PREP * k, w=W_THIN, fill=(0.86, 0.87, 0.88))
    # far end wall and far beam in elevation
    p.brick_face(X2(BEAM), Z(COL_BOT), (BF - 2 * BEAM) * k, (F_TOP - COL_BOT) * k)
    p.rect(X2(BEAM), Z(BEAM_BOT), (BF - 2 * BEAM) * k, BEAM * k, w=W_THIN, fill=(0.93, 0.935, 0.94))
    p.line(X2(BEAM), Z(F_TOP), X2(BF - BEAM), Z(F_TOP), W_THIN)
    # cut columns and beams
    for j, xx in enumerate((0, BF - BEAM)):
        p.rc(X2(xx), Z(COL_BOT), BEAM * k, (F_TOP - COL_BOT) * k, seed=40 + j)
        p.rc(X2(xx), Z(BEAM_BOT), BEAM * k, BEAM * k, seed=50 + j)
        p.rect(X2(xx + COVER), Z(BEAM_BOT + COVER), ST_OUT * k, ST_OUT * k, w=0.3)
        for dx in (A_BAR, BEAM - A_BAR):
            for dz in (A_BAR, BEAM - A_BAR):
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
    # column rebar (sheet 4): corner bars stop 40 mm under the plate, stirrups at 100 near the top
    for rx_ in (A_BAR, BEAM - A_BAR):
        p.line(XN(rx_), YN(-300), XN(rx_), YN(-40), 0.45, ACC)
    for zz in (y - F_TOP for y in COL_ST_Y if y - F_TOP > -300):
        p.line(XN(COVER), YN(zz), XN(BEAM - COVER), YN(zz), 0.3, ACC)
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
        ('Підготовка C8/10, 100 мм', fnum(V_PREP, 2) + ' м³'),
        ('Сталь, усього (аркуш 4)', '≈ %d кг' % round(sum(steel_by('f').values()) + 8 * MN_KG)),
    ], size=6.4, rh=4.6, head=False)

    ny = 55.5
    col_w = 97.0
    items = [
        'Ескіз виконано за довідковим кресленням виробника (Golen, Annex 1 – Response 1, аркуш Reference Foundation Drawing of 5MWh BESS Container). Розміри в міліметрах, позначки в метрах.',
        'Бетон C25 за позначенням виробника (орієнтовно C20/25). Балка 350 × 350: 4Ø12 поздовжні, хомути Ø8 з кроком 200. Армування колон, кутів і закладні деталі виробник не задав — пропозицію наведено на аркуші 4.',
        'Основа — ущільнений ґрунт, коефіцієнт ущільнення не менше 0,94. Під балкою рекомендую бетонну підготовку 100 мм C8/10: без неї захисний шар 40 мм не забезпечити (аркуш 4).',
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
# Sheet 4: reinforcement of the foundation, the cable channel, slabs and lintels
# =====================================================================
W_BAR, W_ST = 0.5, 0.32


def fnum(v, nd=1):
    return ('%.*f' % (nd, v)).replace('.', ',')


def pos_mark(p, x, y, tx, ty, txt, r=2.3, col=INK, dot=True):
    """Position callout: leader from the bar to a numbered circle."""
    dx, dy = x - tx, y - ty
    d = math.hypot(dx, dy)
    if d > r + 0.2:
        p.line(x, y, tx + dx / d * r, ty + dy / d * r, W_HAIR + 0.03)
    if dot:
        p.circle(x, y, 0.3, w=0, fill=INK)
    p.circle(tx, ty, r, w=W_THIN, col=col, fill=(1, 1, 1))
    p.text(tx, ty - 0.95, txt, 6.6 if len(txt) < 2 else 5.6, 'B', anchor='c', col=col)


def flag(p, x, y, tx, ty, txt, col=INK):
    """Callout for a named item (МН-1, П-1): leader to a framed label whose left edge is at tx."""
    w_ = p.tw(txt, 6.4, 'B') + 2.4
    p.line(x, y, tx, ty, W_HAIR + 0.03)
    p.circle(x, y, 0.3, w=0, fill=INK)
    p.rect(tx, ty - 2.0, w_, 4.2, w=W_THIN, col=col, fill=(1, 1, 1))
    p.text(tx + 1.2, ty - 0.9, txt, 6.4, 'B', col=col)


def stirrup_sq(p, x0, y0, s, col=INK, w=W_ST, hook=1.5):
    """Closed stirrup in section, centreline square, 135-degree hooks at the top-left corner."""
    p.rect(x0, y0, s, s, w=w, col=col)
    p.line(x0 + 0.55, y0 + s, x0 + 0.55 + hook * 0.72, y0 + s - hook * 0.72, w, col)
    p.line(x0, y0 + s - 0.55, x0 + hook * 0.72, y0 + s - 0.55 - hook * 0.72, w, col)


def vbreak(p, x, y1, y2, w=W_THIN):
    ym = (y1 + y2) / 2
    p.poly([(x, y1 - 1.2), (x, ym - 1.2), (x - 1.3, ym - 0.5), (x + 1.3, ym + 0.5), (x, ym + 1.2), (x, y2 + 1.2)], w)


def spec_table(p, x, y, cols, rows, size=6.0, rh=4.5, hh=5.2):
    """Table with a header row and full-width group rows ('g', text). y = top. Returns the bottom."""
    wt = sum(w_ for _, w_, _ in cols)
    p.rect(x, y - hh, wt, hh, w=0, fill=(0.93, 0.94, 0.95))
    xx = x
    for t, w_, an in cols:
        lines = t.split('\n')
        for i, ln in enumerate(lines):
            yy = y - hh / 2 - 0.9 + (len(lines) - 1) * 1.15 - i * 2.3
            p.text(xx + w_ / 2, yy, ln, size - 0.3, 'B', anchor='c')
        xx += w_
    yy = y - hh
    for r in rows:
        if r[0] == 'g':
            p.rect(x, yy - rh, wt, rh, w=0, fill=(0.965, 0.97, 0.975))
            p.text(x + 1.4, yy - rh + 1.5, r[1], size, 'B')
        else:
            bold = r[0] == 'b'
            vals = r[1:] if bold else r
            xx = x
            for (t, w_, an), v in zip(cols, vals):
                f = 'B' if bold else 'R'
                if an == 'c':
                    p.text(xx + w_ / 2, yy - rh + 1.5, v, size, f, anchor='c')
                elif an == 'r':
                    p.text(xx + w_ - 1.2, yy - rh + 1.5, v, size, f, anchor='r')
                else:
                    p.text(xx + 1.2, yy - rh + 1.5, v, size, f)
                if (t, w_, an) != cols[-1]:
                    p.line(xx + w_, yy, xx + w_, yy - rh, W_THIN)
                xx += w_
        p.line(x, yy - rh, x + wt, yy - rh, W_THIN)
        yy -= rh
    xx = x
    for t, w_, an in cols[:-1]:
        xx += w_
        p.line(xx, y, xx, y - hh, W_THIN)
    p.line(x, y - hh, x + wt, y - hh, W_VIS)
    p.rect(x, yy, wt, y - yy, w=W_VIS)
    return yy


def sheet_rebar(c):
    p = Pen(c)
    frame(p, ['Армування фундаменту', 'Каркаси, специфікація, кабельний канал'], '1 : 40; 1 : 20; 1 : 10', 4, 5)
    W = (1, 1, 1)
    G = ACC                                       # bars Golen did not specify (my proposal)

    # ------------------------------------------------ ring beam plan, 1:40
    k = 1 / 40.0
    ox, oy = 46.0, 220.0
    X = lambda x: ox + x * k
    Y = lambda z: oy + z * k
    p.view_title(26, 286.5, 'Армування обв’язувальної балки', 'М 1 : 40 · план на рівні балки')
    p.rect(X(0), Y(0), LF * k, BF * k, w=W_THIN)
    p.rect(X(BEAM), Y(BEAM), (LF - 2 * BEAM) * k, (BF - 2 * BEAM) * k, w=W_THIN)
    for zz in (0, BF - BEAM):
        for xx in COLX:
            p.rect(X(xx), Y(zz), BEAM * k, BEAM * k, w=W_HAIR + 0.03, col=MUTED, dash=[0.8, 0.5])
    for zz in (0, BF - BEAM):
        for xs in BEAM_ST_X:
            p.line(X(xs), Y(zz + COVER), X(xs), Y(zz + BEAM - COVER), W_HAIR + 0.06)
    for xx in (0, LF - BEAM):
        for zs in BEAM_ST_Z:
            p.line(X(xx + COVER), Y(zs), X(xx + BEAM - COVER), Y(zs), W_HAIR + 0.06)
    e = 39
    for zz in (A_BAR, BEAM - A_BAR, BF - BEAM + A_BAR, BF - A_BAR):
        p.line(X(e), Y(zz), X(LF - e), Y(zz), W_BAR)
    for xx in (A_BAR, BEAM - A_BAR, LF - BEAM + A_BAR, LF - A_BAR):
        p.line(X(xx), Y(e), X(xx), Y(BF - e), W_BAR)
    sh = 0.75                                     # L-bars drawn shifted towards the beam axis
    for cx, sx in ((0, 1), (LF, -1)):
        for cz, sz in ((0, 1), (BF, -1)):
            for o, sg in ((A_BAR, 1), (BEAM - A_BAR, -1)):
                px, pz = X(cx + sx * o) + sx * sg * sh, Y(cz + sz * o) + sz * sg * sh
                p.poly([(px + sx * 600 * k, pz), (px, pz), (px, pz + sz * 600 * k)], W_BAR - 0.08, G)
    for zz in (0, BF - BEAM):
        for xx in COLX:
            for a_ in (A_BAR, BEAM - A_BAR):
                for b_ in (A_BAR, BEAM - A_BAR):
                    p.circle(X(xx + a_), Y(zz + b_), 0.42, w=0, fill=G)
    # explanations inside the ring
    xm = X(LF / 2)
    p.text(xm, Y(1330), 'Балка 350 × 350: 4Ø12 A500C (поз. 1, 2), хомути Ø8 A240C (поз. 5) з кроком 200', 6.4, anchor='c')
    p.text(xm, Y(1330) - 3.4, 'У кутах — Г-подібні стержні поз. 3, перепуск 600; точки — випуски колон поз. 4', 6.4, anchor='c')
    p.line(xm - 46, Y(1330) - 7.6, xm - 40, Y(1330) - 7.6, W_BAR)
    p.text(xm - 38.8, Y(1330) - 8.3, 'за кресленням Golen', 6.2)
    p.line(xm + 2, Y(1330) - 7.6, xm + 8, Y(1330) - 7.6, W_BAR, G)
    p.text(xm + 9.2, Y(1330) - 8.3, 'пропозиція (Golen не задав)', 6.2, col=G)
    # callouts
    pos_mark(p, X(4900), Y(BF - BEAM + A_BAR), X(4900), Y(1960), '1')
    pos_mark(p, X(LF - BEAM + A_BAR), Y(1500), X(5480), Y(1500), '2')
    pos_mark(p, X(LF - BEAM + A_BAR) + 0.75, Y(BF - BEAM + A_BAR - 420), X(5480), Y(1960), '3', col=G)
    pos_mark(p, X(COLX[2] + BEAM - A_BAR), Y(BF - BEAM + A_BAR), X(3500), Y(1960), '4', col=G)
    pos_mark(p, X(1050), Y(BEAM - COVER), X(1050), Y(700), '5')
    # section 1-1 across the south beam
    xs1 = X(1150)
    for ya_, yb_ in ((Y(0) - 4.6, Y(0) - 1.0), (Y(BEAM) + 1.0, Y(BEAM) + 4.6)):
        p.line(xs1, ya_, xs1, yb_, 0.7)
    for yy in (Y(0) - 3.8, Y(BEAM) + 3.8):
        p.line(xs1, yy, xs1 - 3.0, yy, W_VIS)
        p.poly([(xs1 - 2.0, yy - 0.8), (xs1 - 3.6, yy), (xs1 - 2.0, yy + 0.8)], w=W_THIN, fill=INK, close=True)
    p.text(xs1 + 2.0, Y(0) - 4.6, '1', 9, 'B', anchor='c')
    p.text(xs1 + 2.0, Y(BEAM) + 2.8, '1', 9, 'B', anchor='c')
    # dimensions
    edges = [0, 350, 2000, 2350, 3808, 4158, 5808, 6158]
    for a_, b_ in zip(edges[:-1], edges[1:]):
        p.dim_h(X(a_), X(b_), Y(0), Y(0) - 9, str(b_ - a_), size=6.6)
    p.dim_h(X(0), X(LF), Y(0), Y(0) - 15.5, '6158', size=6.6)
    for a_, b_ in ((0, 350), (350, 2188), (2188, 2538)):
        p.dim_v(Y(a_), Y(b_), X(LF) + 1.5, X(LF) + 7.5, str(b_ - a_), size=6.6)
    p.dim_v(Y(0), Y(BF), X(LF) + 1.5, X(LF) + 13.5, '2538', size=6.6)
    p.dim_h(X(LF - A_BAR - 600), X(LF - A_BAR), Y(BF), Y(BF) + 4.2, '600', size=6.2)

    # ------------------------------------------------ column cage, 1:20 (cut along the beam)
    kk = 1 / 20.0
    ex0, ey0 = 66.0, 60.0
    XE = lambda x: ex0 + x * kk
    YE = lambda y: ey0 + (y + 1950) * kk
    p.view_title(26, 196.5, 'Каркас колони', 'М 1 : 20 · розріз уздовж балки')
    bl, br = -440, 780
    p.rect(XE(bl), YE(-1950), (br - bl) * kk, PREP * kk, w=0, fill=(0.89, 0.90, 0.91))
    p.line(XE(bl), YE(-1950), XE(br), YE(-1950), W_THIN)
    p.compact(XE(bl), XE(br), YE(-1950), depth=2.0)
    p.line(XE(bl), YE(-1850), XE(br), YE(-1850), W_THIN)
    p.line(XE(bl), YE(-1500), XE(0), YE(-1500), W_THIN)
    p.line(XE(350), YE(-1500), XE(br), YE(-1500), W_THIN)
    for xb in (bl, br):
        vbreak(p, XE(xb), YE(-1950), YE(-1500))
    p.rect(XE(0), YE(-1500), BEAM * kk, (F_TOP + 1500) * kk, w=W_THIN)
    p.line(XE(-320), YE(0), XE(0), YE(0), W_HAIR + 0.04, MUTED, dash=[2.0, 0.8, 0.4, 0.8])
    p.line(XE(350), YE(0), XE(670), YE(0), W_HAIR + 0.04, MUTED, dash=[2.0, 0.8, 0.4, 0.8])
    for yy in (-1850 + A_BAR, -1500 - A_BAR):
        p.line(XE(bl + 25), YE(yy), XE(br - 25), YE(yy), W_BAR)
    beam_st = [x - COLX[1] for x in BEAM_ST_X if bl < x - COLX[1] < br]
    for xs in beam_st:
        p.line(XE(xs), YE(-1850 + COVER), XE(xs), YE(-1500 - COVER), W_ST)
    p.poly([(XE(A_BAR - 200), YE(-1784)), (XE(A_BAR), YE(-1784)), (XE(A_BAR), YE(260))], W_BAR, G)
    p.poly([(XE(BEAM - A_BAR + 200), YE(-1784)), (XE(BEAM - A_BAR), YE(-1784)), (XE(BEAM - A_BAR), YE(260))], W_BAR, G)
    for yy in COL_ST_Y:
        p.line(XE(COVER), YE(yy), XE(BEAM - COVER), YE(yy), W_ST, G)
    p.rect(XE(25), YE(288), 300 * kk, 12 * kk, w=W_THIN, fill=(0.25, 0.28, 0.32))
    for ax, sg in ((95, 1), (255, -1)):
        p.poly([(XE(ax), YE(288)), (XE(ax), YE(130)), (XE(ax + sg * 45), YE(95))], 0.35, G)
    # section 2-2 marks
    ys2 = YE(-760)
    for xa_, xb_ in ((XE(0) - 4.6, XE(0) - 1.0), (XE(350) + 1.0, XE(350) + 4.6)):
        p.line(xa_, ys2, xb_, ys2, 0.7)
    for xx in (XE(0) - 3.8, XE(350) + 3.8):
        p.line(xx, ys2, xx, ys2 - 3.0, W_VIS)
        p.poly([(xx - 0.8, ys2 - 2.0), (xx, ys2 - 3.6), (xx + 0.8, ys2 - 2.0)], w=W_THIN, fill=INK, close=True)
    p.text(XE(0) - 3.8, ys2 + 1.2, '2', 9, 'B', anchor='c')
    p.text(XE(350) + 3.8, ys2 + 1.2, '2', 9, 'B', anchor='c')
    # stirrup spacing chain and column height, left
    xd = XE(0) - 7.5
    chain = [(250, 300, '50'), (-50, 250, '3×100'), (-1450, -50, '7×200 = 1400'), (-1500, -1450, '50')]
    for a_, b_, t in chain:
        p.dim_v(YE(a_), YE(b_), XE(0), xd, t if b_ - a_ > 100 else '', size=6.2)
    p.text(xd - 1.6, YE(275) - 1.0, '50', 6.0, anchor='r')
    p.text(xd - 1.6, YE(-1475) - 1.0, '50', 6.0, anchor='r')
    p.dim_v(YE(-1500), YE(300), XE(0), xd - 6.5, '1800', size=6.2)
    # levels
    lx = XE(br) + 5.5
    for zz, t in ((F_TOP, '+0,300'), (0, '0,000'), (-1500, '−1,500'), (-1850, '−1,850')):
        x_from = XE(350) + 1.0 if zz >= -1500 else XE(br) + 1.0
        p.line(x_from, YE(zz), lx - 2.5, YE(zz), W_HAIR + 0.02, MUTED, dash=[0.6, 0.9])
        p.level(lx, YE(zz), t, shelf=10.5, size=6.4)
    p.line(XE(bl) - 1.0, YE(-1950), XE(bl) - 13.0, YE(-1950), W_HAIR + 0.02, MUTED, dash=[0.6, 0.9])
    p.level(XE(bl) - 14.0, YE(-1950), '−1,950', shelf=10.5, size=6.4)
    # callouts
    pos_mark(p, XE(BEAM - A_BAR), YE(-980), XE(640), YE(-1080), '4', col=G)
    pos_mark(p, XE(BEAM - COVER), YE(-650), XE(640), YE(-560), '5', col=G)
    pos_mark(p, XE(560), YE(-1500 - A_BAR), XE(640), YE(-1250), '1')
    pos_mark(p, XE(beam_st[0]), YE(-1680), XE(-300), YE(-1250), '5')
    flag(p, XE(300), YE(294), XE(470), YE(560), 'МН-1', col=G)
    p.text(XE(BEAM / 2), YE(-1700) - 0.6, 'балка', 6.0, anchor='c', col=MUTED, bg=W)
    p.text(XE(-250), YE(-1950) + 0.9, 'підготовка C8/10', 5.8, anchor='c', col=MUTED)

    # ------------------------------------------------ sections 1:10
    k10 = 0.1

    def section(x0, y0, beam):
        S = lambda x: x0 + x * k10
        T = lambda y: y0 + y * k10
        colr = INK if beam else G
        if beam:
            p.rect(S(-100), T(-100), 550 * k10, 100 * k10, w=W_THIN, fill=(0.89, 0.90, 0.91))
            p.compact(S(-130), S(480), T(-100), depth=1.8)
            p.brick(S(0), T(350), 35, 9.0, outline=W_THIN)
            p.breakline(S(0), S(350), T(440), W_THIN)
        p.rect(S(0), T(0), 35, 35, w=W_VIS)
        stirrup_sq(p, S(COVER + 4), T(COVER + 4), (ST_OUT - 8) * k10, INK if beam else G)
        for a_ in (A_BAR, BEAM - A_BAR):
            for b_ in (A_BAR, BEAM - A_BAR):
                p.circle(S(a_), T(b_), 0.6, w=0, fill=colr)
        yb_ = (T(-100) - 2.6) if beam else (T(0) - 1.0)
        for a_, b_ in ((0, 40), (40, 310), (310, 350)):
            p.dim_h(S(a_), S(b_), yb_, yb_ - 4.6, str(b_ - a_), size=6.0)
        p.dim_h(S(0), S(350), yb_, yb_ - 10.0, '350', size=6.2)
        xl_ = S(-100) - 1.0 if beam else S(0) - 1.0
        if beam:
            p.dim_v(T(-100), T(0), xl_, xl_ - 5.0, '', size=6.0)
            p.text(xl_ - 5.75, T(-50) - 6.0, '100', 6.0, anchor='c', rot=90)
        p.dim_v(T(0), T(350), xl_, xl_ - 5.0, '350', size=6.2)
        n1 = '1' if beam else '4'
        pos_mark(p, S(BEAM - A_BAR), T(BEAM - A_BAR), S(350) + 6.0, T(BEAM - A_BAR) + 3.0, n1, col=colr)
        pos_mark(p, S(BEAM - COVER - 4), T(150), S(350) + 6.0, T(150), '5', col=colr)
    p.view_title(128, 196.5, '1–1', 'М 1 : 10')
    section(140.0, 151.0, True)
    p.view_title(128, 121.5, '2–2', 'М 1 : 10')
    section(140.0, 80.0, False)

    # ------------------------------------------------ bar shapes
    sx = 187.0
    p.view_title(sx, 196.5, 'Форми стержнів')
    p.text(sx, 192.4, 'без масштабу, розміри в мм', 6.0, col=MUTED)

    def slabel(y, n, txt, col=INK):
        p.circle(sx + 2.2, y + 0.8, 2.0, w=W_THIN, col=col, fill=W)
        p.text(sx + 2.2, y - 0.05, n, 6.0, 'B', anchor='c', col=col)
        p.text(sx + 5.6, y, txt, 6.2)
    slabel(185.5, '3', 'Ø12 A500C, L = 1200', G)
    p.poly([(sx + 5, 181), (sx + 5, 165), (sx + 21, 165)], W_BAR, G)
    p.text(sx + 3.6, 173, '600', 6.0, anchor='c', rot=90)
    p.text(sx + 13, 162.4, '600', 6.0, anchor='c')
    slabel(156.5, '5', 'Ø8 A240C, L = 1240')
    stirrup_sq(p, sx + 5, 139.5, 13, INK, W_ST + 0.05, 2.2)
    p.text(sx + 11.5, 136.6, '270', 6.0, anchor='c')
    p.text(sx + 20.6, 146, '270', 6.0, anchor='c', rot=90)
    p.text(sx + 23, 141, 'гаки 135°, 80', 5.8, col=MUTED)
    slabel(130.5, '4', 'Ø12 A500C, L = 2240', G)
    p.poly([(sx + 7, 126.5), (sx + 7, 104), (sx + 13, 104)], W_BAR, G)
    p.text(sx + 5.6, 115, '2040', 6.0, anchor='c', rot=90)
    p.text(sx + 10, 101.4, '200', 6.0, anchor='c')
    p.text(sx + 16, 112, 'у колону', 5.8, col=MUTED)
    p.text(sx + 16, 109.2, 'лапка — у балку', 5.8, col=MUTED)
    slabel(94.5, '6', 'Ø8 A500C, L = 1640', G)
    p.poly([(sx + 5, 90), (sx + 5, 79), (sx + 27, 79), (sx + 27, 90)], W_BAR, G)
    p.text(sx + 3.6, 84.5, '470', 6.0, anchor='c', rot=90)
    p.text(sx + 16, 76.4, '700', 6.0, anchor='c')
    p.text(sx + 16, 82, 'канал', 5.8, anchor='c', col=MUTED)
    p.rect(sx, 66.0, p.tw('МН-1', 6.0, 'B') + 2.2, 4.0, w=W_THIN, col=G, fill=W)
    p.text(sx + 1.1, 67.1, 'МН-1', 6.0, 'B', col=G)
    p.text(sx + 10.6, 67.1, 'лист 300 × 300 × 12', 6.2)
    p.rect(sx + 5, 60.6, 18, 1.0, w=W_THIN, fill=(0.25, 0.28, 0.32))
    for ax, sg in ((sx + 8.5, 1), (sx + 19.5, -1)):
        p.poly([(ax, 60.6), (ax, 55.6), (ax + sg * 1.6, 54.4)], 0.35, G)
    p.text(sx + 25, 57.4, '4 анкери Ø12,', 5.8, col=MUTED)
    p.text(sx + 25, 54.8, 'L = 230', 5.8, col=MUTED)

    # ------------------------------------------------ specification
    rx = 236.0
    p.text(rx, 286.5, 'Специфікація арматури', 8.6, 'B')
    p.text(rx + p.tw('Специфікація арматури', 8.6, 'B') + 2.5, 286.5, 'кількість і маса — на 1 виріб', 6.6, col=MUTED)
    D = 'ДСТУ 3760:2019'
    rows = [('g', 'Фундамент контейнера, на 1 шт. (усього 2: BESS і PCS — умовно)')]
    groups = {'c': 'Кабельний канал, монолітний, L = 4900, 1 шт.',
              's': 'Плита перекриття П-1, 800 × 478 × 80, на 1 шт. (усього %d)' % SLAB_N,
              'l': 'Перемичка ПР-1 над вводом каналу, 900 × 350 × 120, на 1 шт. (усього 2)'}
    last = 'f'
    for g, pos, d, cl, ln, shp, n, note in REBAR:
        if g != last:
            if last == 'f':
                rows.append(('МН-1', '—', 'лист 300×300×12 С245, анкери 4Ø12 A500C, L = 230', '8', fnum(MN_KG, 2), 'уточнити в Golen'))
            rows.append(('g', groups[g]))
            last = g
        name = 'Ø%d %s, L = %d' % (d, cl, ln) + ((' (%s)' % shp) if shp else '')
        rows.append((pos, D, name, str(n), fnum(unit_mass(d, ln), 2), note))
    yb = spec_table(p, rx, 280.0, [('Поз.', 10, 'c'), ('Позначення', 22, 'l'), ('Найменування', 69, 'l'), ('К-сть', 12, 'c'),
                                   ('Маса од., кг', 18, 'c'), ('Примітка', 46, 'l')], rows, size=6.0, rh=4.4)

    # ------------------------------------------------ steel and concrete summary
    f = steel_by('f')
    ch, sl, li = steel_by('c'), steel_by('s'), steel_by('l')
    cols_ = [('A500C', 12), ('A500C', 10), ('A500C', 8), ('A240C', 8), ('A240C', 6)]

    def row(name, st, mn, conc, mult=1, bold=False):
        vals = [st.get(k_, 0) * mult for k_ in cols_]
        tot = sum(vals) + mn * mult
        cells = [fnum(v) if v else '—' for v in vals] + [fnum(mn * mult) if mn else '—', fnum(tot), conc]
        return ((('b', name) if bold else (name,)) + tuple(cells)), vals + [mn * mult, tot]
    r1, v1 = row('Фундамент BESS', f, 8 * MN_KG, fnum(V_BEAM + V_COLS, 2) + ' C25')
    r2, v2 = row('Фундамент PCS (умовно)', f, 8 * MN_KG, fnum(V_BEAM + V_COLS, 2) + ' C25')
    r3 = ('Бетонна підготовка, 2 шт.', '—', '—', '—', '—', '—', '—', '—', fnum(2 * V_PREP, 2) + ' C8/10')
    r4, v4 = row('Кабельний канал', ch, 0, fnum(V_CHAN, 2) + ' C25')
    r5, v5 = row('Плити П-1, %d шт.' % SLAB_N, sl, 0, fnum(V_SLABS, 2) + ' C25', SLAB_N)
    r6, v6 = row('Перемички ПР-1, 2 шт.', li, 0, fnum(V_LINT, 2) + ' C25', 2)
    tot = [sum(v[i] for v in (v1, v2, v4, v5, v6)) for i in range(7)]
    c25 = 2 * (V_BEAM + V_COLS) + V_CHAN + V_SLABS + V_LINT
    r7 = ('b', 'Разом') + tuple(fnum(v) for v in tot) + (fnum(c25 + 2 * V_PREP, 2),)
    ys = yb - 7.0
    p.text(rx, ys, 'Відомість витрати сталі й бетону', 8.6, 'B')
    p.text(rx + p.tw('Відомість витрати сталі й бетону', 8.6, 'B') + 2.5, ys, 'сталь у кг, бетон у м³', 6.6, col=MUTED)
    yb2 = spec_table(p, rx, ys - 2.5, [('Елемент', 40, 'l'), ('Ø12\nA500C', 15, 'r'), ('Ø10\nA500C', 14, 'r'), ('Ø8\nA500C', 14, 'r'),
                                       ('Ø8\nA240C', 14, 'r'), ('Ø6\nA240C', 13, 'r'), ('Закладні\nМН-1', 16, 'r'), ('Сталь\nразом', 17, 'r'),
                                       ('Бетон', 34, 'r')], [r1, r2, r3, r4, r5, r6, r7], size=6.0, rh=4.4, hh=7.0)
    p.text(rx, yb2 - 3.6, 'Бетон: C25 — %s м³, підготовка C8/10 — %s м³. Маса сталі — без відходів і в’язального дроту.' % (fnum(c25, 2), fnum(2 * V_PREP, 2)), 6.0, col=MUTED)

    # ------------------------------------------------ cable channel, 1:10
    kc = 0.1
    cx0, ct = 254.0, 132.0
    XC = lambda x: cx0 + x * kc
    YC = lambda y: ct + y * kc
    p.view_title(rx, 143.5, 'Кабельний канал: армування', 'М 1 : 10 · кабелі не показано')
    for xa, xb in ((-60, 0), (800, 860)):
        p.line(XC(xa), YC(-20), XC(xb), YC(-20), W_THIN)
    p.compact(XC(-40), XC(840), YC(-630), depth=1.8)
    p.poly([(XC(0), YC(-630)), (XC(800), YC(-630)), (XC(800), YC(-80)), (XC(700), YC(-80)), (XC(700), YC(-530)),
            (XC(100), YC(-530)), (XC(100), YC(-80)), (XC(0), YC(-80))], W_VIS, fill=(0.95, 0.955, 0.96), close=True)
    p.rect(XC(0), YC(-80), 80, 8, w=W_VIS, fill=(0.95, 0.955, 0.96))
    p.poly([(XC(50), YC(-110)), (XC(50), YC(-580)), (XC(750), YC(-580)), (XC(750), YC(-110))], W_BAR, G)
    for xx in (150, 317, 483, 650):
        p.circle(XC(xx), YC(-572), 0.42, w=0, fill=G)
    for xx in (58, 742):
        for yy in (-420, -220):
            p.circle(XC(xx), YC(yy), 0.42, w=0, fill=G)
    p.line(XC(25), YC(-51), XC(775), YC(-51), W_BAR - 0.1, G)
    for xx in (40, 220, 400, 580, 760):
        p.circle(XC(xx), YC(-43), 0.42, w=0, fill=G)
    pos_mark(p, XC(750), YC(-330), XC(830), YC(-300), '6', col=G)
    pos_mark(p, XC(483), YC(-572), XC(483), YC(-430), '7', col=G)
    pos_mark(p, XC(58), YC(-420), XC(250), YC(-330), '7', col=G)
    pos_mark(p, XC(310), YC(-51), XC(310), YC(80), '8', col=G)
    pos_mark(p, XC(580), YC(-43), XC(620), YC(80), '9', col=G)
    flag(p, XC(700), YC(-30), XC(840), YC(-30) + 0.9, 'П-1')
    yb_ = YC(-630) - 2.4
    for a_, b_ in ((0, 100), (100, 700), (700, 800)):
        p.dim_h(XC(a_), XC(b_), yb_, yb_ - 4.6, str(b_ - a_), size=6.0)
    p.dim_h(XC(0), XC(800), yb_, yb_ - 9.6, '800', size=6.2)
    xl_ = XC(-60) - 0.8
    for a_, b_ in ((-630, -530), (-530, -80), (-80, 0)):
        p.dim_v(YC(a_), YC(b_), xl_, xl_ - 4.6, str(b_ - a_), size=6.0)
    p.dim_v(YC(-630), YC(0), xl_, xl_ - 9.6, '630', size=6.2)

    # ------------------------------------------------ slab П-1, plan 1:20
    ks = 0.05
    px0, py0 = 352.0, 104.0
    XS = lambda x: px0 + x * ks
    YS = lambda z: py0 + z * ks
    p.view_title(347, 143.5, 'Плита П-1', 'М 1 : 20 · план')
    p.rect(XS(0), YS(0), 800 * ks, SLAB_L * ks, w=W_VIS)
    for zz in (40, 173, 306, 438):
        p.line(XS(25), YS(zz), XS(775), YS(zz), W_BAR - 0.1, G)
    for xx in (40, 220, 400, 580, 760):
        p.line(XS(xx), YS(24), XS(xx), YS(454), W_ST, G)
    pos_mark(p, XS(130), YS(306), XS(130), YS(SLAB_L) + 6.0, '8', col=G)
    pos_mark(p, XS(580), YS(390), XS(650), YS(SLAB_L) + 6.0, '9', col=G)
    p.dim_h(XS(0), XS(800), YS(0), YS(0) - 5.0, '800', size=6.2)
    p.dim_v(YS(0), YS(SLAB_L), XS(800), XS(800) + 5.0, str(SLAB_L), size=6.2)

    # ------------------------------------------------ lintel ПР-1, section 1:10
    kl = 0.1
    lx0, ly0 = 358.0, 72.0
    XL = lambda z: lx0 + z * kl
    YL = lambda y: ly0 + y * kl
    p.view_title(347, 94.5, 'Перемичка ПР-1', 'М 1 : 10 · переріз')
    p.brick(XL(0), YL(120), 35, 6.0, outline=W_THIN)
    p.breakline(XL(0), XL(350), YL(180), W_THIN)
    p.rect(XL(0), YL(0), 35, 12, w=W_VIS, fill=(0.95, 0.955, 0.96))
    p.line(XL(20), YL(38), XL(330), YL(38), W_ST, G)
    for zz in (50, 175, 300):
        p.circle(XL(zz), YL(30), 0.5, w=0, fill=G)
    pos_mark(p, XL(300), YL(30), XL(350) + 6.0, YL(-10), '10', col=G)
    pos_mark(p, XL(240), YL(38), XL(350) + 6.0, YL(110), '11', col=G)
    p.dim_h(XL(0), XL(350), YL(0), YL(0) - 4.6, '350', size=6.2)
    p.dim_v(YL(0), YL(120), XL(0), XL(0) - 4.6, '120', size=6.2)
    p.text(XL(175), YL(0) - 9.6, 'над отвором 600 × 450 у кладці', 5.8, anchor='c', col=MUTED)

    # ------------------------------------------------ notes
    items = [
        'Чорним — армування балки за кресленням Golen (4Ø12, хомути Ø8 з кроком 200). Помаранчевим — те, чого Golen не задав: кутові стержні, колони, закладні деталі, а також канал, плити й перемички (мій попередній розрахунок). Усе перевірити розрахунком проєктувальника.',
        'Арматура за ДСТУ 3760:2019: A500C — поздовжня, A240C — хомути й Ø6. Бетон C25 (≈ C20/25), підготовка — C8/10.',
        'Захисний шар до хомутів 40 мм — лише з бетонною підготовкою 100 мм під балкою. Якщо бетонувати просто по ґрунту, захисний шар знизу потрібен 70–75 мм, і переріз 350 × 350 стає затісним.',
        'Стержні балки не стикувати по довжині; у кутах — Г-подібні стержні поз. 3 з перепуском 600 мм (50d). Хомути замкнені, з гаками 135°.',
        'Випуски колон поз. 4 заводити в каркас балки до нижніх стержнів, лапкою 200 мм уздовж балки. Шов між балкою та колонами очистити й зробити шорстким.',
        'Закладні МН-1 виставити на +0,300 за нівеліром до бетонування колон. Розміри пластин і анкерів погодити з Golen.',
        'Плити П-1 лежать на стінках каналу насухо, їх можна виготовити заздалегідь. Канал проходить під зоною дверей трансформатора, тож плити мають витримувати прохід людей.',
        'Маса в специфікації — без відходів на різання й в’язального дроту; на замовлення додати 3–5 %.',
    ]
    ny, col_w = 50.0, 97.0
    p.text(25, ny, 'Примітки', 8.6, 'B')
    y1, xcol = ny - 4.4, 25.0
    for i, s in enumerate(items, 1):
        if i == 5:
            xcol, y1 = 25.0 + col_w + 5, ny - 4.4
        p.text(xcol, y1, '%d.' % i, 6.2)
        y1 = p.para(xcol + 3.8, y1, s, col_w - 3.8, 6.2, lead=2.75) - 0.6
    c.showPage()


# =====================================================================
# Sheet 5: 3D views
# =====================================================================
def sheet_views(c, img_dir):
    p = Pen(c)
    frame(p, ['Загальний вигляд', '3D-модель майданчика і фундаменту'], 'без масштабу', 5, 5)
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
    img('q_rebar.png', 302, 53, 110, 'д) Арматура (аркуш 4), бетон умовно прозорий.')
    items = [
        'Фундамент блока PCS (помаранчевий, напівпрозорий): Golen дав креслення лише для контейнера BESS.',
        'Відкрита рама з дахом над шафами PCS, висота шаф і дверей.',
        'Те, що видно за дверима, товщина кладки, ширина сходинок.',
        'Кабельний канал і кабелі в ньому: попередній розрахунок, траса в кабельних просторах умовна.',
        'Арматура: темна — за кресленням Golen, помаранчева — пропозиція (Golen не задав).',
        'Інтерактивна модель (двері, шари, арматура, перехід до креслень): mischenkoa85-creator.github.io/galkat-20',
    ]
    ny = 43.0
    p.text(25, ny, 'Що на моделі показано умовно', 8.6, 'B')
    y1, xcol = ny - 4.4, 25.0
    for i, t in enumerate(items, 1):
        if i == 4:
            xcol, y1 = 25.0 + 104, ny - 4.4
        p.text(xcol, y1, '%d.' % i, 6.4)
        y1 = p.para(xcol + 3.8, y1, t, 96.0, 6.4, lead=2.85) - 0.6
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
    sheet_rebar(c)
    sheet_views(c, img_dir)
    c.save()
    print('saved', out)
