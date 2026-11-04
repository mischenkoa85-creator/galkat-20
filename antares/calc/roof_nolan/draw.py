# -*- coding: utf-8 -*-
"""Креслення «Покрівля цеху без ліхтарів: каркаси 13°, об'єкти, лівневки, сонячне опромінення» (28.10.2026).
5 аркушів A3 (стандарт E-Systems) → PDF; той самий план → DXF з шарами (метри, осі моделі)."""
import sys, os, json, math, textwrap
import numpy as np
W = os.path.dirname(os.path.abspath(__file__)) + '/'
sys.path.insert(0, '/tmp/claude-0/-home-claude/48137fe6-4c58-5aa6-90c7-d55006f4596f/scratchpad/std')
import estd as S
from estd import C, FS, LW, MM
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Polygon, FancyArrowPatch
from matplotlib.colors import ListedColormap, BoundaryNorm, LinearSegmentedColormap, to_rgb
from matplotlib.backends.backend_pdf import PdfPages
import roofobj as R

OUT = W + 'out/'; os.makedirs(OUT, exist_ok=True)
NAME = 'Креслення_покрівля_цеху_без_ліхтарів_каркаси_13°_об’єкти_лівневки_радіація_Антарес'
IRR = json.load(open(W + 'irr_nolan.json'))
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',').replace('-', '−')
DOC = S.Doc('ЕСЕ-2610-01-ПК', 'Сонячна електростанція на покрівлі цеху ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А',
            ('Покрівля цеху: стан після демонтажу ліхтарів і розміщення модулів' if os.path.exists(W + 'pv_eval.json') else 'Покрівля цеху. Вихідні дані: стан після демонтажу ліхтарів'), N=11 if os.path.exists(W + 'pv_eval.json') else 8)
# ------------------------------------------------------------------ кольори об'єктів
K = dict(roof='#ffffff', par=C['conc'], west='#e7e2d8', valley='#3f6e95', frame='#1d2a33', ang='#5b6770', lan='#9aa5ae',
         ac='#e9eef2', acu='#ffffff', exit='#d8c3ad', defl='#ffffff', phok='#bfe3c6', drain='#2a78d6', drain2='#2a78d6', other='#b4461b')
# одноколірна (помаранчева) послідовна шкала: світле — менше, темне — більше
BANDS = [0, 700, 850, 950, 1025, 1075, 1110, 1140, 1160, 1200]
_cm = LinearSegmentedColormap.from_list('sun', ['#fff7f0', '#fde3cc', '#f9c29a', '#f49f68', '#ec7a3e', '#d65a22', '#b04315'])
BCOL = [_cm(i / (len(BANDS) - 2)) for i in range(len(BANDS) - 1)]
BLAB = ['< 700', '700–850', '850–950', '950–1 025', '1 025–1 075', '1 075–1 110', '1 110–1 140', '1 140–1 160', '≥ 1 160']

# ------------------------------------------------------------------ примітиви плану (одні й ті самі для PDF і DXF)
class Prims:
    def __init__(self): self.P = []
    def poly(self, layer, pts, closed=True, **st): self.P.append(('poly', layer, [tuple(map(float, p)) for p in pts], closed, st))
    def line(self, layer, p0, p1, **st): self.poly(layer, [p0, p1], False, **st)
    def rect(self, layer, x0, y0, x1, y1, **st): self.poly(layer, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], True, **st)
    def circ(self, layer, cen, r, **st): self.P.append(('circle', layer, (float(cen[0]), float(cen[1])), float(r), st))
    def text(self, layer, xy, t, fs=None, rot=0, ha='left', va='center', **st): self.P.append(('text', layer, (float(xy[0]), float(xy[1])), t, fs or FS['small'], rot, ha, va, st))

def plan(mode='full'):
    """mode: 'full' — аркуш 1; 'rad' — контури поверх шару опромінення (аркуш 2)."""
    G = Prims(); full = mode == 'full'
    ink = C['ink']; thin = LW['thin']; hair = LW['hair']
    # західна будівля (смуга з розривом)
    xb = -4.2
    G.rect('05_ЗАХІДНА_БУДІВЛЯ', xb, R.YS_out, R.XW, R.YN_out, lw=thin, c=ink, fc=K['west'] if full else 'none', hatch='////' if full else None, z=1)
    zz = [(xb, R.YS_out - 0.6)] + [(xb + (0.45 if k % 2 else -0.45), R.YS_out + 6 + k * 3) for k in range(31)] + [(xb, R.YN_out + 0.6)]
    G.poly('05_ЗАХІДНА_БУДІВЛЯ', zz, False, lw=hair, c=ink, z=2)
    G.line('05_ЗАХІДНА_БУДІВЛЯ', (R.XW, R.YS_out), (R.XW, R.YN_out), lw=LW['main'], c=ink, z=4)
    G.text('40_ТЕКСТ', (-2.35, 48.0), 'ЗАХІДНА БУДІВЛЯ — вища за покрівлю цеху на ≈6,8 м (стіна на всю довжину цеху)', FS['small'], 90, 'center', 'center', bg=full)
    # двері із західної будівлі
    G.rect('24_ІНШЕ', R.XW - 0.18, R.DOOR['y'] - R.DOOR['w'] / 2, R.XW + 0.12, R.DOOR['y'] + R.DOOR['w'] / 2, lw=thin, c=ink, fc=K['other'], z=6)
    if full: G.text('40_ТЕКСТ', (0.7, R.DOOR['y'] + 0.1), 'двері на дах, поруч драбина\nі кондиціонер на стіні', FS['small'], 0, 'left', 'center', bg=True)
    # парапети
    for (x0, y0, x1, y1) in ((R.XW, R.YS_out, R.XE_out, R.YS_in), (R.XW, R.YN_in, R.XE_out, R.YN_out), (R.XE_in, R.YS_out, R.XE_out, R.YN_out)):
        G.rect('04_ПАРАПЕТИ', x0, y0, x1, y1, lw=thin, c=ink, fc=K['par'], z=3)
    # огорожа з труб по східному парапету: стійки ≈2,4 м
    if full:
        for k in range(int((R.YN_out - R.YS_out) // 2.4) + 1):
            y = R.YS_out + k * 2.4; G.line('04_ПАРАПЕТИ', (R.XE_in + 0.05, y), (R.XE_out - 0.05, y), lw=hair, c=ink, z=4)
    # контур покрівлі
    G.rect('00_ПОКРІВЛЯ_КОНТУР', R.XW, R.YS_in, R.XE_in, R.YN_in, lw=LW['main'], c=ink, fc='none', z=4)
    # переломи граней покрівлі
    for x in R.BREAKS:
        if R.XW < x < R.XE_in and not any(v['x0'] - 0.01 <= x <= v['x1'] + 0.01 for v in R.VALLEYS):
            G.line('02_ГРАНІ_ПОКРІВЛІ', (x, R.YS_in), (x, R.YN_in), lw=hair, c=C['line'] if full else '#ffffff', ls='-', z=2 if full else 5, alpha=1 if full else 0.0)
    # ендови і низ біля стін
    for v in R.VALLEYS:
        for xx in (v['x0'], v['x1']): G.line('03_ЕНДОВИ', (xx, R.YS_in), (xx, R.YN_in), lw=hair, c=K['valley'], z=3)
        G.line('03_ЕНДОВИ', (v['xc'], R.YS_in), (v['xc'], R.YN_in), lw=thin, c=K['valley'], ls='-.', z=3)
        if full: G.text('40_ТЕКСТ', (v['xc'] + 0.45, 31.5), f'ендова +15,90', FS['small'], 90, 'left', 'top', c=K['valley'], bg=True)
    for x, lab in ((R.XWin, 'низ біля стіни +15,86'), (R.XE_in - 0.02, 'низ біля парапету +15,96')):
        G.line('03_ЕНДОВИ', (x, R.YS_in), (x, R.YN_in), lw=thin, c=K['valley'], ls=':', z=3)
        if full: G.text('40_ТЕКСТ', (x + (0.45 if x < 10 else -0.45), 22.0 if x < 10 else 74.6), lab, FS['small'], 90, 'left', 'top' if x < 10 else 'bottom', c=K['valley'], bg=True)
    # гребінь прольоту 13–17
    G.line('02_ГРАНІ_ПОКРІВЛІ', (R.RIDGE24['x'], R.YS_in), (R.RIDGE24['x'], R.YN_in), lw=thin, c=ink, ls=(0, (6, 2, 1, 2, 1, 2)), z=3)
    if full: G.text('40_ТЕКСТ', (R.RIDGE24['x'] + 0.45, 52.0), 'гребінь +18,15', FS['small'], 90, 'left', 'top', bg=True)
    # стрілки стоку (рядок Y 88)
    if full:
        for p in R.PR:
            if not p['what'].startswith('грань'): continue
            L = p['x1'] - p['x0']; xm = (p['x0'] + p['x1']) / 2; dn = 1 if p['z1'] < p['z0'] else -1; h = min(1.0, 0.33 * L)
            G.P.append(('arrow', '41_СТІК', (xm - dn * h, 88.6), (xm + dn * h, 88.6), dict(lw=hair + 0.15, c=K['valley'])))
    # осі
    for n, x in R.AXES:
        G.line('01_ОСІ', (x, -2.6), (x, R.YS_out), lw=hair, c=ink, ls='-.', z=3)
        G.circ('01_ОСІ', (x, -3.95), 1.35, lw=thin, c=ink, fc='#ffffff', z=6)
        G.text('01_ОСІ', (x, -3.95), str(n), FS['text'], 0, 'center', 'center', bold=True)
    for (a, xa), (b, xb_) in zip(R.AXES, R.AXES[1:]):
        G.P.append(('dim', '42_РОЗМІРИ', (xa, -6.6), (xb_, -6.6), f'{nf((xb_ - xa) * 1000)}', dict()))
    G.P.append(('dim', '42_РОЗМІРИ', (98.6, R.YS_in), (98.6, R.YN_in), f'{nf((R.YN_in - R.YS_in) * 1000)} (між внутрішніми гранями парапетів)', dict(v=True)))
    # каркаси ліхтарів
    for F in R.FRAMES:
        xc, y0, y1 = F['xc'], F['y0'], F['y1']
        G.rect('12_ЛІХТАР_ДЕМОНТОВАНО', xc - R.LAN_TAPE_W / 2, y0, xc + R.LAN_TAPE_W / 2, y1, lw=hair, c=K['lan'] if full else '#ffffff', ls='--', fc='none', z=4)
        G.rect('12_КАРКАС_КОНТУР', xc - R.HALF, y0, xc + R.HALF, y1, lw=hair, c=K['ang'] if full else ink, fc='none', z=5)
        for y in F['ang']: G.line('11_КАРКАС_КУТНИКИ_13', (xc - R.HALF, y), (xc + R.HALF, y), lw=thin if full else hair, c=K['ang'] if full else ink, z=5)
        G.line('10_КАРКАС_ЦЕНТРАЛЬНИЙ_ПРОФІЛЬ', (xc, y0), (xc, y1), lw=LW['main'] + 0.3, c=K['frame'], z=6)
        G.text('40_ТЕКСТ', (xc, y1 + 1.55), F['id'], FS['text'], 0, 'center', 'center', bold=True, bg=full)
    # рама кондиціонерів
    A = R.AC
    G.rect('20_РАМА_КОНДИЦІОНЕРІВ', A['x0'], A['y0'], A['x1'], A['y1'], lw=thin, c=ink, fc=K['ac'] if full else '#d9dde1', z=6)
    if full:
        for u in R.AC_UNITS: G.rect('20_РАМА_КОНДИЦІОНЕРІВ', u['x'] - u['d'] / 2, u['y'] - u['w'] / 2, u['x'] + u['d'] / 2, u['y'] + u['w'] / 2, lw=hair, c=ink, fc=K['acu'], z=7)
        for (x, y) in R.AC_LEGS: G.rect('20_РАМА_КОНДИЦІОНЕРІВ', x - 0.225, y - 0.225, x + 0.225, y + 0.225, lw=hair, c=C['mute'], fc='none', z=7)
        e = R.AC_EBOX; G.rect('20_РАМА_КОНДИЦІОНЕРІВ', e['x0'], e['y0'], e['x1'], e['y1'], lw=hair, c=ink, fc=C['mute'], z=7)
        d = R.AC_DUCT; G.rect('20_РАМА_КОНДИЦІОНЕРІВ', d['x0'], d['y0'], d['x1'], d['y1'], lw=hair, c=ink, fc='none', ls='--', z=7)
        G.P.append(('callout', '40_ТЕКСТ', (A['x1'], 9.2), (73.6, 9.6), 'рама кондиціонерів 14,5 × 2,4 м,\nh 2,2 м: 13 + 3 VRF + 8 блоків,\n4 щитки на північному торці', {}))
    # вихід на дах, сходи (зовні), портал
    E = R.EXIT_LAND; G.rect('21_ВИХІД_ПОРТАЛ', E['x0'], E['y0'], E['x1'], E['y1'], lw=thin, c=ink, fc=K['exit'] if full else 'none', z=7)
    st = R.STAIRS; G.rect('21_ВИХІД_ПОРТАЛ', st['x0'], st['y0'], st['x1'], st['y1'], lw=hair, c=ink, ls='--', fc='none', z=4)
    if full:
        for k in range(1, 12): x = st['x0'] + k * (st['x1'] - st['x0']) / 12; G.line('21_ВИХІД_ПОРТАЛ', (x, st['y0']), (x, st['y1']), lw=hair, c=C['line'], z=4)
    for (x, y) in R.PORTAL_POSTS: G.rect('21_ВИХІД_ПОРТАЛ', x - 0.2, y - 0.2, x + 0.2, y + 0.2, lw=thin, c=ink, fc=ink, z=8)
    for (x, ya, yb) in R.PORTAL_BEAMS_Y: G.line('21_ВИХІД_ПОРТАЛ', (x, ya), (x, yb), lw=thin, c=ink, ls='--', z=7)
    for (y, xa, xb2) in R.PORTAL_BEAMS_X: G.line('21_ВИХІД_ПОРТАЛ', (xa, y), (xb2, y), lw=thin, c=ink, ls='--', z=7)
    if full:
        G.text('40_ТЕКСТ', (59.3, 3.75), 'портал H≈3,4', FS['small'], 0, 'center', 'bottom', bg=True)
        G.text('40_ТЕКСТ', (62.7, 1.55), 'вихід на дах', FS['small'], 0, 'left', 'center', bg=True)
        G.text('40_ТЕКСТ', (58.2, -1.5), 'сходи (зовні)', FS['small'], 0, 'right', 'center', bg=True)
    # дефлектори
    for o in R.DEFL:
        c = (o['x'], o['y']); r = o['d'] / 2
        if o['grp'] == 'фото': G.circ('22_ДЕФЛЕКТОРИ_ФОТО', c, r, lw=LW['main'] if full else thin, c=ink, fc=K['phok'] if full else '#d9dde1', z=8)
        elif o['cls'] == 'є': G.circ('22_ДЕФЛЕКТОРИ_GOOGLE', c, r, lw=thin, c=ink, fc=K['defl'] if full else '#d9dde1', z=8)
        else:
            if not full: continue
            G.circ('22_ДЕФЛЕКТОРИ_НЕМАЄ', c, r, lw=hair, c=C['mute'], ls=':', fc='none', z=8)
            for s_ in (-1, 1): G.line('22_ДЕФЛЕКТОРИ_НЕМАЄ', (c[0] - r * 0.6, c[1] - s_ * r * 0.6), (c[0] + r * 0.6, c[1] + s_ * r * 0.6), lw=hair, c=C['mute'], z=8)
        if full: G.text('40_ТЕКСТ', (c[0] + r + 0.25, c[1] + 0.05), f'Д{o["n"]}', FS['small'] - 0.6, 0, 'left', 'center', c=C['mute'] if o['cls'] == 'немає' else ink, bold=o['grp'] == 'фото')
    # лівневки
    for d in R.DRAINS:
        c = (d['x'], d['y']); sure = d['st'] != 'уточнити'
        G.circ('23_ЛІВНЕВКИ' if sure else '23_ЛІВНЕВКИ_УТОЧНИТИ', c, R.DRAIN_RING / 2, lw=thin, c=K['drain'], ls='-' if sure else '--', fc='#ffffff', z=9)
        G.circ('23_ЛІВНЕВКИ' if sure else '23_ЛІВНЕВКИ_УТОЧНИТИ', c, R.DRAIN_CAP / 2, lw=hair, c=K['drain'], fc=K['drain'] if sure else '#ffffff', z=10)
        if not sure: G.text('23_ЛІВНЕВКИ_УТОЧНИТИ', c, '?', FS['small'] - 1.2, 0, 'center', 'center', c=K['drain'], bold=True)
        if full or True:
            dy = 1.55 if d['pos'] == 'південь' else -1.55 if d['pos'] == 'північ' else 1.25
            dx = 0.55 if d['x'] < 90 else -0.55
            G.text('40_ТЕКСТ', (d['x'] + dx, d['y'] + dy), d['id'], FS['small'] - 0.4, 0, 'left' if dx > 0 else 'right', 'center', c=K['drain'], bold=True, bg=True)
    # інше: розрив у східному парапеті, стійка, кабель
    b = R.EAST_BREAK; G.rect('24_ІНШЕ', b['x0'], b['y0'], b['x1'], b['y1'], lw=thin, c=K['other'], fc='#ffffff', z=9)
    p = R.STEEL_POST_S; G.rect('24_ІНШЕ', p['x'] - 0.2, p['y'] - 0.2, p['x'] + 0.2, p['y'] + 0.2, lw=thin, c=K['other'], fc=K['other'], z=9)
    cb = R.CABLE_S
    if full:
        G.P.append(('callout', '40_ТЕКСТ', (b['x0'], (b['y0'] + b['y1']) / 2), (85.0, 30.4), 'розрив парапету, білий короб', dict(side='l', xr=95.6)))
        G.P.append(('callout', '40_ТЕКСТ', (p['x'], p['y']), (74.8, -1.6), 'стійка', {}))
        G.line('24_ІНШЕ', (cb['x'] - 3, R.YS_in + 0.08), (cb['x'] + 3, R.YS_in + 0.08), lw=thin, c=K['other'], ls=(0, (1, 1.2)), z=9)
        G.P.append(('callout', '40_ТЕКСТ', (cb['x'] + 2.0, R.YS_in + 0.08), (80.8, -1.6), 'кабель на кліпсах по парапету', {}))
    return G

# ------------------------------------------------------------------ рендер у matplotlib
def lsmap(ls): return ls if ls is not None else '-'
def render(ax, G, kpt):
    """kpt — коефіцієнт: 1 мм аркуша = kpt м (для стрілок/виносок)."""
    for it in G.P:
        k = it[0]
        if k == 'poly':
            _, L, pts, closed, st = it
            if st.get('alpha', 1) == 0: continue
            if closed:
                ax.add_patch(Polygon(pts, closed=True, fc=st.get('fc', 'none') or 'none', ec=st.get('c', C['ink']), lw=st.get('lw', LW['thin']),
                                     ls=lsmap(st.get('ls')), hatch=st.get('hatch'), zorder=st.get('z', 3), joinstyle='miter'))
            else:
                xs, ys = zip(*pts); ax.plot(xs, ys, color=st.get('c', C['ink']), lw=st.get('lw', LW['thin']), ls=lsmap(st.get('ls')), zorder=st.get('z', 3), solid_capstyle='butt')
        elif k == 'circle':
            _, L, c, r, st = it
            ax.add_patch(Circle(c, r, fc=st.get('fc', 'none') or 'none', ec=st.get('c', C['ink']), lw=st.get('lw', LW['thin']), ls=lsmap(st.get('ls')), zorder=st.get('z', 5)))
        elif k == 'text':
            _, L, xy, t, fs, rot, ha, va, st = it
            kw = dict(fontsize=fs, rotation=rot, ha=ha, va=va, color=st.get('c', C['ink']), zorder=12, weight='bold' if st.get('bold') else 'normal', linespacing=1.12,
                      rotation_mode='anchor')
            if st.get('bg'): kw['bbox'] = dict(fc='white', ec='none', pad=0.25, alpha=0.9)
            ax.text(xy[0], xy[1], t, **kw)
        elif k == 'arrow':
            _, L, p0, p1, st = it
            ax.annotate('', xy=p1, xytext=p0, arrowprops=dict(arrowstyle='-|>', lw=st['lw'], color=st['c'], mutation_scale=4.5, shrinkA=0, shrinkB=0), zorder=6)
        elif k == 'dim':
            _, L, p0, p1, t, st = it; lw = LW['hair'] + 0.1; v = st.get('v')
            ax.annotate('', xy=p0, xytext=p1, arrowprops=dict(arrowstyle='<|-|>', lw=lw, color=C['ink'], mutation_scale=4, shrinkA=0, shrinkB=0), zorder=6)
            if v:
                for p in (p0, p1): ax.plot([p[0] - 0.9, p[0] + 0.6], [p[1], p[1]], color=C['ink'], lw=lw)
                ax.text(p0[0] + 0.5, (p0[1] + p1[1]) / 2, t, fontsize=FS['small'], rotation=90, ha='center', va='bottom', rotation_mode='anchor', color=C['ink'])
            else:
                for p in (p0, p1): ax.plot([p[0], p[0]], [p[1] - 0.6, p[1] + 0.9], color=C['ink'], lw=lw)
                ax.text((p0[0] + p1[0]) / 2, p0[1] + 0.35, t, fontsize=FS['small'], ha='center', va='bottom', color=C['ink'])
        elif k == 'callout':
            _, L, xy, xt, t, st = it; fs = FS['small']; lines = t.split('\n'); w = max(len(l) for l in lines) * fs / MM * 0.6 * kpt + 0.5 * kpt
            side = st.get('side', 'r'); x0 = xt[0] if side == 'r' else xt[0] - w
            if side == 'l' and st.get('xr'): x0 = st['xr'] - w; xt = (st['xr'], xt[1])
            ax.plot([xy[0], xt[0]], [xy[1], xt[1]], color=C['ink'], lw=LW['hair'] + 0.1, zorder=11); ax.plot([x0, x0 + w], [xt[1], xt[1]], color=C['ink'], lw=LW['hair'] + 0.1, zorder=11)
            ax.add_patch(Circle(xy, 0.25 * kpt, fc=C['ink'], ec='none', zorder=11))
            ax.text(x0 + 0.25 * kpt, xt[1] + 0.25 * kpt, t, fontsize=fs, va='bottom', ha='left', color=C['ink'], zorder=12, linespacing=1.12, bbox=dict(fc='white', ec='none', pad=0.2, alpha=0.9))

# ------------------------------------------------------------------ поле опромінення
nx, ny = IRR['nx'], IRR['ny']
EG = np.array([np.nan if v is None else v for v in IRR['e']], float).reshape(ny, nx)
KG = np.array(list(IRR['k'])).reshape(ny, nx)
XG = IRR['x0'] + 0.25 + 0.5 * np.arange(nx); YG = IRR['y0'] + 0.25 + 0.5 * np.arange(ny)
EXT = [IRR['x0'], IRR['x0'] + nx * 0.5, IRR['y0'], IRR['y0'] + ny * 0.5]
CMAP = ListedColormap(BCOL); NORM = BoundaryNorm(BANDS, CMAP.N)
STAT = IRR['stats']
def frame_stats():
    out = []
    for F in R.FRAMES:
        m = (KG == 'f') & (np.abs(XG[None, :] - F['xc']) <= R.HALF) & (YG[:, None] >= F['y0']) & (YG[:, None] <= F['y1'])
        w = m & (XG[None, :] < F['xc']); e = m & (XG[None, :] > F['xc'])
        out.append(dict(id=F['id'], W=float(np.nanmean(EG[w])), E=float(np.nanmean(EG[e])), Wmin=float(np.nanmin(EG[w])), Emin=float(np.nanmin(EG[e])), n=int(m.sum())))
    return out
FST = frame_stats()

# ------------------------------------------------------------------ аркуші
XL, YL = (-4.6, 99.6), (-7.6, 99.4)
SC = 500; KPT = SC / 1000            # 1 мм аркуша = 0,5 м
def plan_view(sh, G, heat=False):
    w = (XL[1] - XL[0]) * 1000 / SC; h = (YL[1] - YL[0]) * 1000 / SC
    x_mm = 24 + (224 - w) / 2; y_mm = 66
    a = sh.view(x_mm, y_mm, XL, YL, SC)
    if heat:
        a.imshow(np.ma.masked_invalid(EG), extent=EXT, origin='lower', cmap=CMAP, norm=NORM, interpolation='nearest', zorder=0.5)
    render(a, G, KPT)
    return a, x_mm, y_mm, w, h
def north(sh, x, y, L=11):
    ang = math.radians(-4.0)        # вісь Y будівлі — азимут ≈4°: північ на 4° лівіше від осі Y
    dx, dy = math.sin(ang) * L, math.cos(ang) * L
    sh.ax.annotate('', xy=(x + dx, y + dy), xytext=(x, y), arrowprops=dict(arrowstyle='-|>', lw=0.8, color=C['ink'], mutation_scale=9))
    sh.T(x + dx * 1.12, y + dy * 1.12 + 0.5, 'Пн', FS['text'], ha='center', va='bottom', weight='bold')
    sh.T(x - 3.0, y + 2, 'вісь Y будівлі —\nазимут ≈4°', FS['small'], va='bottom', ha='right', color=C['mute'])

def legend_custom(sh, items, title='Умовні позначення', x=None, width=None):
    z = S.Z['info']; x = z[0] if x is None else x; width = (z[2] - z[0]) if width is None else width
    y = sh.block_title(title, 'info', x=x) - 0.6; ax = sh.ax
    for draw, text in items:
        lines = textwrap.wrap(text, S.chars(width - 13, FS['text'])); yc = y - 2.0
        draw(ax, x, yc)
        for i, ln in enumerate(lines): sh.T(x + 12, y - 0.4 - i * 3.3, ln, FS['text'], va='top')
        y -= max(4.6, 3.3 * len(lines) + 1.2)
    sh.info_y = y - 3
def LG_rect(fc, ec=C['ink'], ls='-', hatch=None, lw=LW['thin']): return lambda ax, x, y: ax.add_patch(Rectangle((x, y - 1.5), 9, 3.0, fc=fc, ec=ec, ls=ls, hatch=hatch, lw=lw))
def LG_line(c=C['ink'], lw=LW['thin'], ls='-'): return lambda ax, x, y: ax.plot([x, x + 9], [y, y], color=c, lw=lw, ls=ls)
def LG_circ(fc, ec, ls='-', inner=None, q=False):
    def f(ax, x, y):
        ax.add_patch(Circle((x + 4.5, y), 1.4, fc=fc, ec=ec, ls=ls, lw=LW['thin']))
        if inner: ax.add_patch(Circle((x + 4.5, y), 0.75, fc=inner, ec=ec, lw=LW['hair']))
        if q: ax.text(x + 4.5, y, '?', fontsize=4.6, ha='center', va='center', color=ec, weight='bold')
    return f
def LG_frame():
    def f(ax, x, y):
        ax.add_patch(Rectangle((x, y - 1.7), 9, 3.4, fc='none', ec=K['lan'], ls='--', lw=LW['hair']))
        ax.add_patch(Rectangle((x + 0.8, y - 1.4), 7.4, 2.8, fc='none', ec=K['ang'], lw=LW['hair']))
        for xx in (x + 0.8, x + 3.3, x + 5.7, x + 8.2): ax.plot([xx, xx], [y - 1.4, y + 1.4], color=K['ang'], lw=LW['thin'])
        ax.plot([x + 0.8, x + 8.2], [y, y], color=K['frame'], lw=LW['main'] + 0.3)
    return f
def LG_arrow():
    return lambda ax, x, y: ax.annotate('', xy=(x + 9, y), xytext=(x, y), arrowprops=dict(arrowstyle='-|>', lw=0.5, color=K['valley'], mutation_scale=5))

pdf = PdfPages(OUT + NAME + '.pdf')
# ================= аркуш 1: план покрівлі
sh = S.Sheet(DOC, 1, 'План покрівлі цеху без ліхтарів: каркаси, об’єкти, лівневки')
G1 = plan('full'); a, xm, ym, wv, hv = plan_view(sh, G1)
sh.view_title(xm, ym + hv + 2.5, 'План покрівлі цеху після демонтажу ліхтарів', SC)
legend_custom(sh, [
    (LG_frame(), 'Каркас ліхтаря (Л1–Л4): центральний профіль (товста лінія) і кутники 13° з обох боків, ширина 3,0 м; пунктир — контур демонтованого ліхтаря 3,66 м. Кутники — умовно через ≈3 м (крок не виміряно)'),
    (LG_rect(K['ac']), 'Рама зовнішніх блоків кондиціонерів з блоками, щитками й опорами'),
    (lambda ax, x, y: ax.add_patch(Circle((x + 4.5, y), 1.4, fc=K['phok'], ec=C['ink'], lw=LW['main'])), f"Труба вентиляції — є на фото обстеження 26–27.10 ({sum(o['grp'] == 'фото' for o in R.DEFL)}); Д — номер у відомості, арк. 5"),
    *([(LG_circ('#ffffff', C['ink']), f"Труба — лише на знімку Google, на фото не перевірено ({sum(o['grp'] == 'супутник' for o in R.DEFL)})")] if any(o['grp'] == 'супутник' for o in R.DEFL) else []),
    (lambda ax, x, y: (ax.add_patch(Circle((x + 4.5, y), 1.4, fc='none', ec=C['mute'], ls=':', lw=LW['hair'])), ax.plot([x + 3.6, x + 5.4], [y - 0.9, y + 0.9], color=C['mute'], lw=LW['hair']), ax.plot([x + 3.6, x + 5.4], [y + 0.9, y - 0.9], color=C['mute'], lw=LW['hair'])),
     f"Труби немає — прибрано ({sum(o['cls'] == 'немає' for o in R.DEFL)}): на фото місце видно, а труби немає ({sum(o['grp'] == 'фото-немає' for o in R.DEFL)}); за словами власника 28.10 ({sum(o['grp'] == 'власник-немає' for o in R.DEFL)}); лише в РП, на знімку Google не видно ({sum(o['grp'] == 'немає' for o in R.DEFL)}). У розрахунку не враховано"),
    (LG_circ('#ffffff', K['drain'], inner=K['drain']), 'Лівневка (водостічна воронка): ЛВ-1…12 — по 3 в кожній ендові; ЛВ-14 — біля західної стіни (фото)'),
    (LG_circ('#ffffff', K['drain'], ls='--', q=True), 'Лівневка біля стіни — чи є, не встановлено (ЛВ-13, 15–18, положення умовне)'),
    (LG_line(K['valley'], LW['thin'], '-.'), 'Ендова (низ покрівлі), +15,90; тонкі сині — межі пласкої смуги; пунктир — низ біля стін'),
    (LG_line(C['line'], LW['hair']), 'Перелом граней покрівлі (грані ≈3 м, розріз 1-1)'),
    (LG_arrow(), 'Напрям стоку води по гранях'),
    (LG_rect(C['conc']), 'Парапет; на східному — огорожа з труб (стійки ≈2,4 м)'),
    (LG_rect(K['exit']), 'Вихід на дах — верхній майданчик сходів; пунктир — сходи зовні, балки порталу'),
    (lambda ax, x, y: ax.add_patch(Rectangle((x + 3.6, y - 0.9), 1.8, 1.8, fc=C['ink'], ec='none')), 'Стійка сталевого порталу, H ≈3,4 м'),
    (LG_rect(K['other'], K['other']), 'Інше за фото: двері із західної будівлі, стійка біля парапету, розрив парапету, кабель'),
])
sh.table('Каркаси ліхтарів', [('', 7, 'l'), ('Xц, м', 9, 'r'), ('Y, м', 15, 'r'), ('L, м', 8, 'r'), ('Кутників*', 11, 'r')],
         [[F['id'], nf(F['xc'], 2), f"{nf(F['y0'], 2)}–{nf(F['y1'], 2)}", nf(F['L'], 1), f"{F['n_ang']} × 2"] for F in R.FRAMES] +
         [['Разом', '', '', nf(sum(F['L'] for F in R.FRAMES), 1), f"{sum(F['n_ang'] for F in R.FRAMES)} × 2"]], bold_rows=(4,))
sh.para('* умовно, при кроці ≈3 м; фактичний крок виміряти.', fs=FS['small'], color=C['mute'])
north(sh, 404, 70)
sh.notes([
    'Ліхтарі демонтовано (скління, щипці). Лишаються сталеві каркаси: центральний профіль і кутники 13° на обидва боки, ширина 3,0 м (власник; на фото 12,2° ± 0,5°), на бортику з руберойдом 0,30–0,40 м (власник 28.10). Крок і переріз кутників не виміряні — показано умовно. Модулі — арк. 9–10.',
    'Координати — осі моделі, м: X — від осі 1 на схід, Y — на північ (внутрішня грань південного парапету Y = −0,25, північного — 96,34). Відмітки — від ±0,000. Відомість об’єктів — аркуш 4, лівневок і дефлекторів — аркуш 5.',
    'Лівневки: по 3 в кожній ендові — біля парапетів на 0,87 м від стіни (рулетка, ЛВ-10) і посередині (Y 48,05) — за схемою власника. Підтверджено: ЛВ-10 (рулетка, фото), ЛВ-3 (фото 112509, 112519, 123916). Біля західної стіни на фото 112440 є воронка в самому низу покрівлі (ЛВ-14, Y — за схемою); ЛВ-13, 15 і біля східного парапету ЛВ-16…18 — не встановлено.',
    f"Труби вентиляції — {sum(o['cls'] == 'є' for o in R.DEFL)}, усі видно на фото обстеження 26–27.10 (арк. 6–8). Прибрано {sum(o['cls'] == 'немає' for o in R.DEFL)}: де місце на фото видно, а труби немає ({sum(o['grp'] == 'фото-немає' for o in R.DEFL)}); за словами власника 28.10 — на північній частині і між ліхтарями труб немає ({sum(o['grp'] == 'власник-немає' for o in R.DEFL)}; на фото ці місця закриті ліхтарями або далеко); з РП, яких немає на знімку Google ({sum(o['grp'] == 'немає' for o in R.DEFL)}). Нових труб не додавали. Звірено зі знімками екрана Google Maps від 23.10. Рама кондиціонерів, портал, сходи — за фото, розміри оцінні.",
], warn=(3,))
sh.save(pdf)

ND = sum(o['cls'] == 'є' for o in R.DEFL)
# ================= аркуш 2: шар опромінення
sh = S.Sheet(DOC, 2, 'План покрівлі: сонячне опромінення, кВт·год/м² за рік')
G2 = plan('rad'); a, xm, ym, wv, hv = plan_view(sh, G2, heat=True)
sh.view_title(xm, ym + hv + 2.5, 'Сонячне опромінення покрівлі без ліхтарів, кВт·год/м² за рік', SC)
for F, fs_ in zip(R.FRAMES, FST):
    a.text(F['xc'], F['y0'] - 1.6, f"Зх {nf(fs_['W'])} · Сх {nf(fs_['E'])}", fontsize=FS['small'], ha='center', va='center', color=C['ink'], zorder=13,
           bbox=dict(fc='white', ec='none', pad=0.3, alpha=0.92))
y = sh.block_title('Шкала, кВт·год/м² за рік')
for i, (col, lab) in enumerate(zip(BCOL[::-1], BLAB[::-1])):
    yy = y - 1 - i * 4.4; sh.ax.add_patch(Rectangle((254, yy - 3.4), 12, 3.6, fc=col, ec=C['grid'], lw=0.3)); sh.T(269, yy - 1.6, lab, FS['text'], va='center')
sh.ax.add_patch(Rectangle((254, y - 1 - 9 * 4.4 - 3.4), 12, 3.6, fc='#d9dde1', ec=C['grid'], lw=0.3)); sh.T(269, y - 1 - 9 * 4.4 - 1.6, 'зайнято (рама, дефлектори) — не рахували', FS['text'], va='center')
sh.info_y = y - 1 - 10 * 4.4 - 3
s = STAT
sh.table('Підсумок', [('', 30, 'l'), ('Середнє', 11, 'r'), ('10 %', 8, 'r'), ('50 %', 8, 'r'), ('90 %', 8, 'r'), ('Тінь, %', 9, 'r')],
         [[f"Покрівля, {nf(s['roof']['n'] * 0.25)} м²", nf(s['roof']['mean']), nf(s['roof']['p10']), nf(s['roof']['p50']), nf(s['roof']['p90']), nf(s['roof']['shade'], 1)],
          [f"Каркаси 13°, {nf(s['frame']['n'] * 0.25)} м² у плані", nf(s['frame']['mean']), nf(s['frame']['p10']), nf(s['frame']['p50']), nf(s['frame']['p90']), nf(s['frame']['shade'], 1)]] +
         [[f"  {f_['id']}: захід / схід", f"{nf(f_['W'])} / {nf(f_['E'])}", '', '', '', ''] for f_ in FST] +
         [['Горизонтальна площина без тіні (Meteonorm)', nf(IRR['ghi']), '', '', '', '']], shade_rows=(6,))
sh.para('10 / 50 / 90 % — частка клітинок, що мають менше за це значення. Тінь — втрата проти того самого місця без перешкод.', fs=FS['small'], color=C['mute'])
north(sh, 404, 70)
sh.notes([
    'Опромінення — на кожну клітинку 0,5 × 0,5 м за рік, у площині поверхні: на покрівлі — у площині грані; у смузі каркаса (3,0 м) — у площині схилу кутників 13° (схід / захід), тобто там, де лягатимуть модулі. Панелей у моделі немає.',
    f'Тінь — від усього, що є в моделі: парапети 1,37 м, західна будівля (+6,8 м), рама кондиціонерів, {ND} труб вентиляції, сходи, стійки порталу, сусідні будівлі. Ліхтарів немає; тонкі кутники й профіль тіні не дають (менші за крок моделі 0,25 м).',
    'Модель — та сама, що в розрахунках 27.10: Meteonorm 8.1, крок 10 хв, горизонт 72 напрями, розсіяне світло з урахуванням закритого неба, відбиття 0,2. Найслабше — смуга 3–5 м біля західної стіни (≈600–780) і клітинки впритул до дефлекторів.',
], title='Примітки')
sh.save(pdf)

# ================= аркуш 3: розріз 1-1 і каркас ліхтаря
sh = S.Sheet(DOC, 3, 'Розріз 1-1 покрівлі. Каркас ліхтаря після демонтажу')
# --- розріз 1-1: горизонтально 1:500, вертикально 1:100
HX0, HX1 = -2.5, 99.0; VZ0, VZ1 = 15.3, 19.6
kx, kz = 1000 / 500, 1000 / 100
sx0, sz0 = 30, 232
def P1(x, z): return (sx0 + (x - HX0) * kx, sz0 + (z - VZ0) * kz)
ax = sh.ax
px = [P1(x, z) for x, z in zip(R.XP, R.ZP)]
ax.plot(*zip(*px), color=C['ink'], lw=LW['main'], zorder=4)
# західна стіна (з розривом), східний парапет
ax.add_patch(Polygon([P1(R.XW - 1.6, 15.3), P1(R.XW, 15.3), P1(R.XW, 19.4), P1(R.XW - 1.6, 19.4)], fc=K['west'], ec=C['ink'], lw=LW['thin'], hatch='////', zorder=3))
sh.T(*P1(R.XW - 0.8, 19.45), '+22,7 (≈6,8 м над покрівлею)', FS['small'], ha='left', va='bottom', color=C['mute'])
ax.add_patch(Polygon([P1(R.XE_in, 15.96), P1(R.XE_out, 16.06), P1(R.XE_out, 16.56), P1(R.XE_in, 16.56)], fc=C['conc'], ec=C['ink'], lw=LW['thin'], zorder=3))
for F in R.FRAMES:
    xc = F['xc']; zb = F['zb']
    lx = [xc - R.LAN_TAPE_W / 2, xc, xc + R.LAN_TAPE_W / 2]; lz = [R.roofZ(xc - R.LAN_TAPE_W / 2), zb + R.LAN_TAPE_H, R.roofZ(xc + R.LAN_TAPE_W / 2)]
    ax.plot(*zip(*[P1(x, z) for x, z in zip(lx, lz)]), color=K['lan'], lw=LW['hair'], ls='--', zorder=3)
    fr = [P1(xc - R.HALF, F['ze']), P1(xc, F['zr']), P1(xc + R.HALF, F['ze'])]
    ax.plot(*zip(*fr), color=K['frame'], lw=LW['main'] + 0.2, zorder=5)
    ax.add_patch(Rectangle((fr[1][0] - 0.5, fr[1][1] - 0.5), 1.0, 1.0, fc=K['frame'], ec='none', zorder=6))
    sh.T(fr[1][0], fr[1][1] + 1.5, F['id'], FS['small'], ha='center', va='bottom', weight='bold')
for d in [d for d in R.DRAINS if d['pos'] == 'центр']:
    q = P1(d['x'], R.roofZ(d['x'])); sure = d['st'] != 'уточнити'
    ax.add_patch(Circle((q[0], q[1] - 0.2), 0.9, fc=K['drain'] if sure else '#ffffff', ec=K['drain'], lw=0.4, ls='-' if sure else '--', zorder=7))
for v in R.VALLEYS: sh.T(*P1(v['xc'], 15.9 - 0.12), '+15,90', FS['small'], ha='center', va='top', color=K['valley'])
for x, z, t, dx, dy, ha, va in ((R.RIDGE24['x'], R.RIDGE24['z'], '+18,15', 0, 2.0, 'center', 'bottom'), (R.XWin, 15.86, '+15,86', 2.4, -2.2, 'left', 'top'),
                                 (R.XE_in, 15.96, '+15,96', -2.4, -2.2, 'right', 'top')):
    q = P1(x, z); sh.T(q[0] + dx, q[1] + dy, t, FS['small'], ha=ha, va=va, color=C['mute'])
for p in R.PR:
    if p['sl'] and p['what'].startswith('грань'):
        xm_ = (p['x0'] + p['x1']) / 2; q = P1(xm_, (p['z0'] + p['z1']) / 2)
        sh.T(q[0], q[1] - 1.5, f"{p['sl'].replace('-', '')}°", 4.3, ha='center', va='top', color=C['mute'])
for n, x in R.AXES:
    q = P1(x, VZ0); ax.plot([q[0], q[0]], [q[1] - 1.5, q[1] + 2], color=C['ink'], lw=LW['hair'], ls='-.')
    ax.add_patch(Circle((q[0], q[1] - 4.5), 3.0, fc='white', ec=C['ink'], lw=LW['thin'])); sh.T(q[0], q[1] - 4.5, str(n), FS['text'], ha='center', va='center', weight='bold')
sh.view_title(sx0, sz0 + (VZ1 - VZ0) * kz + 7, 'Розріз 1-1 (поперек цеху; горизонтально М 1:500, вертикально М 1:100)')
sh.T(sx0, sz0 + (VZ1 - VZ0) * kz + 3, 'Профіль покрівлі — розріз 1-1 (DWG замовника), ухили граней — під лінією; каркаси — товсті лінії, сірий пунктир — демонтовані ліхтарі; кола — лівневки посередині цеху (пунктир — уточнити).', FS['small'], color=C['mute'])
# --- розріз А-А по каркасу (Л2), М 1:25
F = R.FRAMES[1]; xc = F['xc']
AX0, AX1, AZ0, AZ1 = xc - 1.95, xc + 1.95, 17.05, 19.65
s25 = 1000 / 25; ox, oz = 26, 98
def P2(x, z): return (ox + (x - AX0) * s25, oz + (z - AZ0) * s25)
xx = np.linspace(AX0, AX1, 80); ax.plot(*zip(*[P2(x, R.roofZ(x)) for x in xx]), color=C['ink'], lw=LW['main'], zorder=4)
base = [P2(x, R.roofZ(x)) for x in xx] + [P2(AX1, AZ0 + 0.05), P2(AX0, AZ0 + 0.05)]
ax.add_patch(Polygon(base, fc='#f3f5f7', ec='none', zorder=2))
lx = [xc - R.LAN_TAPE_W / 2, xc, xc + R.LAN_TAPE_W / 2]; lz = [R.roofZ(lx[0]), F['zb'] + R.LAN_TAPE_H, R.roofZ(lx[2])]
ax.plot(*zip(*[P2(x, z) for x, z in zip(lx, lz)]), color=K['lan'], lw=LW['thin'], ls='--', zorder=3)
sh.T(*P2(xc + 1.0, F['zb'] + 1.55), 'контур демонтованого ліхтаря\n3,66 × 1,89 (рулетка 27.10)', FS['small'], ha='left', va='bottom', color=C['mute'])
pa, pr, pb = P2(xc - R.HALF, F['ze']), P2(xc, F['zr']), P2(xc + R.HALF, F['ze'])
for p0 in (pa, pb): ax.plot([p0[0], pr[0]], [p0[1], pr[1]], color=K['frame'], lw=2.6, solid_capstyle='butt', zorder=6)
ax.add_patch(Rectangle((pr[0] - 2.0, pr[1] - 2.0), 4.0, 4.0, fc=K['frame'], ec='none', zorder=7))
# під каркасом — опора кінців кутників (невідомо): пунктир до покрівлі
gW = F['ze'] - R.roofZ(xc - R.HALF); gE = F['ze'] - R.roofZ(xc + R.HALF)
for p0, x in ((pa, xc - R.HALF), (pb, xc + R.HALF)):
    q = P2(x, R.roofZ(x)); ax.plot([p0[0], q[0]], [p0[1], q[1]], color=C['warn'], lw=0.6, ls=(0, (2, 1.5)), zorder=5)
sh.callout(pr, pr[0] + 22, pr[1] + 16, 'центральний профіль\n(переріз не виміряно)')
sh.callout(((pa[0] * 0.4 + pr[0] * 0.6), (pa[1] * 0.4 + pr[1] * 0.6)), ox + 2, pr[1] + 26, 'кутник 13°, приварений до профілю\n(переріз і крок — виміряти)')
qW = P2(xc - R.HALF, (F['ze'] + R.roofZ(xc - R.HALF)) / 2)
sh.callout(qW, ox + 1, pa[1] + 9, 'на що спираються кінці\nкутників — уточнити')
sh.dim(pa, pb, -(pa[1] - P2(0, R.roofZ(xc + 1.95))[1]) - 14, '3 000 (власник)')
sh.dim((pb[0], pb[1]), (pb[0], pr[1]), 26, '346')
q0 = P2(xc + R.HALF, R.roofZ(xc + R.HALF)); sh.dim((pb[0], q0[1]), (pb[0], pb[1]), 12, f'≈{round(gE * 100) * 10:.0f}*', orient='v')
q1 = P2(xc - R.HALF, R.roofZ(xc - R.HALF)); sh.dim((pa[0], q1[1]), (pa[0], pa[1]), -8, f'≈{round(gW * 100) * 10:.0f}*', orient='v')
# кут
from matplotlib.patches import Arc
ax.add_patch(Arc(pb, 40, 40, theta1=180 - 13, theta2=180, lw=0.4, color=C['ink'])); sh.T(pb[0] - 23, pb[1] + 1.2, '13°', FS['text'], ha='right', va='bottom')
for x, z, t in ((xc, F['zr'], f"≈+{nf(F['zr'], 2)}"), (xc - R.HALF, F['ze'], f"≈+{nf(F['ze'], 2)}")):
    q = P2(x, z); ax.plot([q[0], q[0] + 8], [q[1], q[1]], color=C['ink'], lw=LW['hair']); sh.T(q[0] + 8.5, q[1], t, FS['small'], ha='left', va='center')
for x in (xc - 1.83, xc + 1.83):
    q = P2(x, R.roofZ(x)); sh.T(q[0], q[1] - 1.2, f"+{nf(R.roofZ(x), 2)}", FS['small'], ha='center', va='top', color=C['mute'])
sh.T(*P2(xc - 1.9, 17.1), 'покрівля (розріз 1-1)', FS['small'], ha='left', va='bottom', color=C['mute'])
sh.T(*P2(xc + 1.9, 17.1), 'під каркасом — отвір ліхтаря з сіткою (фото 112242);\nзакриття отвору тут не показано', FS['small'], ha='right', va='bottom', color=C['warn'])
sh.view_title(ox, oz + (AZ1 - AZ0) * s25 + 2, f'Розріз А-А — каркас ліхтаря {F["id"]} (однаковий для Л1–Л4)', 25)
# --- фрагмент плану біля південного торця Л4, М 1:100
F4 = R.FRAMES[3]; xc4 = F4['xc']
QX0, QX1, QY0, QY1 = xc4 - 2.6, xc4 + 2.6, F4['y0'] - 1.8, F4['y0'] + 10.6
s100 = 1000 / 100; fx, fy = 192, 76
a4 = sh.view(fx, fy, (QX0, QX1), (QY0, QY1), 100)
for x in R.BREAKS:
    if QX0 < x < QX1: a4.plot([x, x], [QY0, QY1], color=C['line'], lw=LW['hair'], ls=(0, (1, 1.5)))
a4.add_patch(Rectangle((xc4 - 1.83, F4['y0']), 3.66, QY1 - F4['y0'], fc='none', ec=K['lan'], ls='--', lw=LW['thin']))
a4.add_patch(Rectangle((xc4 - R.HALF, F4['y0']), 3.0, QY1 - F4['y0'], fc='none', ec=K['ang'], lw=LW['hair']))
for y in F4['ang']:
    if y <= QY1: a4.plot([xc4 - R.HALF, xc4 + R.HALF], [y, y], color=K['ang'], lw=1.2, solid_capstyle='butt')
a4.plot([xc4, xc4], [F4['y0'], QY1], color=K['frame'], lw=2.2, solid_capstyle='butt')
a4.annotate('', xy=(xc4 + R.HALF + 0.55, F4['ang'][0]), xytext=(xc4 + R.HALF + 0.55, F4['ang'][1]), arrowprops=dict(arrowstyle='<|-|>', lw=0.35, color=C['ink'], mutation_scale=4, shrinkA=0, shrinkB=0))
a4.text(xc4 + R.HALF + 0.75, (F4['ang'][0] + F4['ang'][1]) / 2, f"≈{nf(F4['pitch'], 2)} умовно", fontsize=FS['small'], rotation=90, va='top', ha='center', rotation_mode='anchor', color=C['warn'])
a4.annotate('', xy=(xc4 - R.HALF, QY1 - 0.6), xytext=(xc4 + R.HALF, QY1 - 0.6), arrowprops=dict(arrowstyle='<|-|>', lw=0.35, color=C['ink'], mutation_scale=4, shrinkA=0, shrinkB=0))
a4.text(xc4, QY1 - 0.45, '3 000', fontsize=FS['small'], ha='center', va='bottom', bbox=dict(fc='white', ec='none', pad=0.2))
a4.plot([QX0, QX1], [F4['y0'], F4['y0']], color=C['ink'], lw=LW['hair'], ls='-.')
a4.text(QX0 + 0.1, F4['y0'] - 0.25, f"торець Л4, Y {nf(F4['y0'], 2)}", fontsize=FS['small'], va='top', ha='left')
ys_ = F4['y0'] + 4.5
for sg in (-1, 1):
    a4.plot([xc4 + sg * 1.95, xc4 + sg * 2.5], [ys_, ys_], color=C['ink'], lw=1.2, solid_capstyle='butt')
    a4.text(xc4 + sg * 2.22, ys_ + 0.2, 'А', fontsize=FS['text'], ha='center', va='bottom', weight='bold')
a4.text(xc4 - 1.88, QY1 - 1.6, 'контур\nліхтаря', fontsize=FS['small'] - 0.6, ha='right', va='top', color=C['mute'])
a4.axis('off')
sh.view_title(fx, fy + (QY1 - QY0) * s100 + 2, 'Фрагмент плану каркаса Л4 біля торця', 100)
# інформаційна колонка
sh.table('Каркас ліхтаря — що відомо', [('Параметр', 30, 'l'), ('Значення', 22, 'l'), ('Джерело', 40, 'l')], [
    ['Ширина каркаса', '3,0 м', 'власник 27.10'],
    ['Ухил кутників', '13°', 'власник; на фото 12,2° ± 0,5° (два незалежні виміри)'],
    ['Гребінь над низом кутників', '0,35 м', 'розрахунок: 1,5 × tg 13°'],
    ['Бортик (низ кутників) над покрівлею', '0,30–0,40 м', 'власник 28.10, з руберойдом; за склінням 42–46° — 0,29–0,34; розріз 1-1: +17,93'],
    ['Довжина Л1 / Л2–Л4', '47,8 / 54,7 м', 'РП, супутник (±0,5 м)'],
    ['Демонтований ліхтар', '3,66 × 1,89 м', 'рулетка 27.10 (фото 111904, 111925)'],
    ['Крок кутників', 'не виміряно', 'на кресленні умовно ≈3 м'],
    ['Переріз кутника, профілю', 'не виміряно', '—'],
], fs=FS['small'])
sh.notes(['Крок кутників уздовж ліхтаря — рулеткою між сусідніми кутниками.', 'Переріз кутника і центрального профілю (розміри полиць, товщина) — штангенциркулем або рулеткою.',
          'Висоту бортика рулеткою з обох боків (власник: 0,30–0,40 м) і на що спираються кутники (бортик, бічна балка, стійки).', 'Кут — рівнем на телефоні, прикладеним до кутника біля відкритого щипця.',
          'Стан зварних швів і корозія; чим закриватимуть отвір ліхтаря.'], title='Що виміряти на даху', zone='info', fs=FS['small'])
sh.notes(['Розріз 1-1: висоти перебільшені в 5 разів (вертикальний масштаб 1:100), щоб було видно грані й каркаси.',
          '* — оцінка, не вимір. Червоний пунктир на розрізі А-А — невідома опора кінців кутників.',
          'Відмітки каркаса — від низу ліхтаря за розрізом 1-1 (+17,62 біля Л1–Л4) плюс бортик 0,30 м (власник: 0,30–0,40 м; зі сходу покрівля нижча ще на 0,28 м).'])
sh.save(pdf)

# ================= аркуш 4: відомість об'єктів
sh = S.Sheet(DOC, 4, 'Відомість об’єктів на покрівлі цеху')
rows = [
    ['1', 'Покрівля', 'X −0,58…96,49; Y −0,25…96,34', f"{nf((R.XE_in - R.XW) * (R.YN_in - R.YS_in))} м² у плані; 5 прольотів 4 × 18 + 24 м; грані ≈3 м з ухилом 4–15°; мембрана ТПО 1,5 мм біла", '1', 'розріз 1-1 (DWG); мембрана — додаток 1 до контракту від 22.06.2026'],
    ['2', 'Ендови', 'X 17,87–18,14; 35,86–36,39; 54,10–54,39; 72,11–72,68', 'пласка смуга 0,26–0,57 м, +15,90', '4', 'розріз 1-1'],
    ['3', 'Низ покрівлі біля стін', 'X −0,13 (захід); X 96,49 (схід)', '+15,86 / +15,96', '2', 'розріз 1-1; водовідвід там — уточнити'],
    ['4', 'Гребінь прольоту 13–17', 'X 84,50', '+18,15', '1', 'розріз 1-1'],
    ['5', 'Каркаси ліхтарів після демонтажу Л1–Л4', 'Xц 10,53; 28,52; 46,76; 64,76; Y 30,59–78,39 (Л1), 23,69–78,39', 'центральний профіль + кутники 13° з обох боків, ширина 3,0 м; на бортику 0,30–0,40 м над покрівлею (власник), гребінь +0,35 над низом; крок не виміряно (умовно ≈3 м)', '4', 'ширина, кут — власник; кут на фото 12,2°; довжини — РП, супутник'],
    ['6', 'Отвори ліхтарів під каркасами', 'під Л1–Л4', 'сітка внизу (фото 112242); закриття отворів — окреме рішення', '4', 'фото 112235–112246'],
    ['7', 'Парапет південний', 'Y −0,50…−0,25', '+1,37 над ендовою, +1,65 на уступі (X ≈74); біля виходу — огорожа; по парапету — кабель на кліпсах', '1', 'рулетка 27.10 (113629, 113649), фото 113547, 113634'],
    ['8', 'Парапет північний', 'Y 96,34…96,59', 'уступами; висота прийнята як південний (не міряли)', '1', 'фото 112519'],
    ['9', 'Парапет східний з огорожею', 'X 96,49…96,80', '≈+0,5; огорожа з труб ≈1,1 м, стійки ≈2,4 м', '1', 'фото 123646, 143858 (оцінка)'],
    ['10', 'Розрив у східному парапеті з білим коробом', 'X 96,5–96,8; Y ≈23,2–24,2', 'розмір — оцінка', '1', 'фото 112731'],
    ['11', 'Західна будівля (стіна)', 'X −0,58, на всю довжину цеху', '+6,8 м над покрівлею (63 ряди цегли); вікна на рівні даху', '1', 'фото 123945, 124103; ширина, довжина не виміряні'],
    ['12', 'Двері із західної будівлі на дах', 'X −0,58; Y ≈86,5', 'поруч драбина і кондиціонер на стіні', '1', 'фото 123945, 123946; положення — за фото'],
    ['13', 'Рама зовнішніх блоків кондиціонерів', 'X 67,2–69,6; Y 6,5–21,0', '14,5 × 2,4 м, h 2,2 м; 13 двовентиляторних + 3 VRF + 8 блоків; 4 щитки на північному торці; короб труб; 6 пар опор на плитах (між опорами торця ≈2,20 м)', '1', 'розміри — власник 27.10; положення — фото ±2 м; рулетка 113000'],
    ['14', 'Вихід на дах (верх зовнішніх сходів)', 'майданчик X 61,0–62,3; сходи X 58,4–65,6 (зовні)', 'майданчик через парапет', '1', 'фото 112717, 112720, 113547'],
    ['15', 'Сталевий портал', 'стійки (58,0; 0,6), (60,6; 0,6), (58,0; 2,6), (60,6; 2,6)', 'H ≈3,4 м; балки виходять за парапет; вантажопідйомність невідома', '1', 'фото 124309, 124315; розміри — оцінка'],
    ['16', 'Сталева стійка біля південного парапету', 'X ≈74; Y ≈−0,1', 'на уступі парапету', '1', 'фото 113645'],
    ['17', 'Труби вентиляції (дефлектори)', 'відомість — арк. 5, фото — арк. 6–8', f"усі {sum(o['grp'] == 'фото' for o in R.DEFL)} — на фото обстеження; прибрано {sum(o['cls'] == 'немає' for o in R.DEFL)}: на фото немає ({sum(o['grp'] == 'фото-немає' for o in R.DEFL)}), за словами власника 28.10 ({sum(o['grp'] == 'власник-немає' for o in R.DEFL)}), лише в РП ({sum(o['grp'] == 'немає' for o in R.DEFL)})", str(ND), 'фото 26–27.10, знімок Google (до 2026), РП'],
    ['18', 'Лівневки (водостічні воронки)', 'відомість — арк. 5', '3 в кожній ендові; біля західної стіни — 1 на фото (ще 2 імовірні); біля східного парапету — 3 імовірні', '13 (+5)', 'рулетка, фото, схема власника 28.10'],
    ['19', 'Латки на покрівлі', 'по всьому даху', 'не об’єкти — на плані не показано', '—', 'фото 111955, 112909, 123537'],
]
sh.table(None, [('№', 3, 'c'), ('Об’єкт', 17, 'l'), ('Де, м', 25, 'l'), ('Розміри, висота, склад', 40, 'l'), ('Кільк.', 6, 'c'), ('Джерело', 27, 'l')], rows, zone='wide', fs=FS['text'] + 0.6, y=279)
sh.view_title(24, 281, 'Відомість об’єктів на покрівлі цеху (після демонтажу ліхтарів)')
sh.notes(['Координати — осі моделі (X від осі 1 на схід, Y на північ), відмітки від ±0,000. «Оцінка» — розмір за фото без рулетки.',
          'Труби вентиляції — за фото обстеження 26–27.10 (головне джерело), де фото немає — за знімком Google. Живу звірку з Google Maps 28.10 не виконано (браузер не підключено).',
          'Об’єкти поза покрівлею (сусідні будівлі, ТП, контейнери УЗЕ) на плані не показано, але в розрахунку тіні враховано.'])
sh.save(pdf)

# ================= аркуш 5: відомість лівневок і дефлекторів
sh = S.Sheet(DOC, 5, 'Відомість лівневок і дефлекторів')
stl = {'виміряно': 'виміряно', 'фото': 'фото', 'за схемою': 'за схемою', 'уточнити': 'уточнити'}
drows = [[d['id'], d['line'], d['pos'], nf(round(d['x'] + 1e-6, 2), 2), nf(d['y'], 2), f"+{nf(d['z'], 2)}", stl[d['st']]] for d in R.DRAINS]
yb = sh.table('Лівневки', [('№', 9, 'l'), ('Лінія', 24, 'l'), ('Місце', 11, 'l'), ('X, м', 10, 'r'), ('Y, м', 10, 'r'), ('Відм.', 10, 'r'), ('Статус', 13, 'l')], drows,
         zone='wide', x=24, y=286, width=150, fs=FS['text'], shade_rows=tuple(i for i, d in enumerate(R.DRAINS) if d['st'] == 'уточнити'))
yy = yb
sh.notes(['Схема власника 28.10: лівневки симетричні біля торцевих парапетів, на одній лінії, і одна посередині. Центр — 0,87 м від стіни парапету (рулетка 27.10, фото 113713: 0,86–0,89 м), посередині — Y 48,05; X — середина пласкої смуги ендови.',
          'Виміряно: ЛВ-10 (рулетка, фото 113707, 113713, 113720; видно також на 113634, 123328, 123330). Фото: ЛВ-3 (112509, 112519 — воронка з решіткою в ендові біля північного парапету; 123916), ЛВ-14 (112440, 112444 — воронка біля самої стіни західної будівлі).',
          'ЛВ-13…15 — біля західної стіни: одну воронку видно на фото 112440 (Y точки зйомки не визначено — на плані посередині, ЛВ-14); ЛВ-13 і ЛВ-15 — за симетрією, не бачили. ЛВ-16…18 — біля східного парапету: на фото не бачили. Положення умовне — перевірити, чи є там воронки або отвори в парапеті.',
          'Ковпак ≈Ø0,5 м, обрамлення ≈Ø0,9 м — оцінка за фото (113720: 0,35–0,38 м від краю ковпака, що саме міряли — не зрозуміло).'],
         title='Примітки до лівневок', zone='wide', x=24, y=yy - 2, width=150, fs=FS['text'] - 0.5, warn=(3,))
import re as _re
def _ph(o):
    m = _re.findall(r'1[0-9]{5}', o.get('phsrc', ''))
    return 'фото ' + m[0] if m else ''
def drow(o):
    g = o['grp']; st = ('є, фото' if g == 'фото' and o['ph'] == 'є' else 'є?, фото' if g == 'фото' else 'є, Google' if g == 'супутник' else 'немає, фото' if g == 'фото-немає' else 'немає, власник' if g == 'власник-немає' else 'прибрано')
    src = _ph(o) if g in ('фото', 'фото-немає') else 'власник 28.10' if g == 'власник-немає' else o['src'].replace(' (на супутнику не видно)', '').replace(' (з довгою тінню)', '*').replace('супутник', 'суп.')
    return [f"Д{o['n']}", nf(o['x'], 2), nf(o['y'], 2), nf(o['d'], 2), nf(o['h'], 1), st, src]
DS = sorted(R.DEFL, key=lambda o: o['n'])
hcols = [('№', 6, 'l'), ('X, м', 9, 'r'), ('Y, м', 9, 'r'), ('Ø, м', 7, 'r'), ('H, м', 6, 'r'), ('Статус', 14, 'l'), ('Підстава', 16, 'l')]
sh.table('Дефлектори і труби вентиляції', hcols, [drow(o) for o in DS[:31]], zone='wide', x=180, y=286, width=114, fs=FS['text'] - 0.6,
         shade_rows=tuple(i for i, o in enumerate(DS[:31]) if o['cls'] != 'є'), bold_rows=tuple(i for i, o in enumerate(DS[:31]) if o['grp'] == 'фото'))
sh.table(' ', hcols, [drow(o) for o in DS[31:]], zone='wide', x=298, y=286, width=114, fs=FS['text'] - 0.6,
         shade_rows=tuple(i for i, o in enumerate(DS[31:]) if o['cls'] != 'є'), bold_rows=tuple(i for i, o in enumerate(DS[31:]) if o['grp'] == 'фото'))
sh.notes(['Ø і H — з РП; положення — за знімком Google і РП (модель 27.10). суп.* — на знімку видно довгу тінь. Жирні рядки — труби, які видно на фото обстеження 26–27.10 (арк. 6–8); «є?» — номер визначено за напрямом, ±3 м.',
          'Є (11, усі на фото): біля виходу Д53, Д59, Д62 і біля торця ліхтаря 4 дві малі (Д46); схід (прольот 13–17) — Д49, Д39, Д37, Д10, конуси Д36 і Д57, біля північного парапету Д2. Немає на фото: ендова осі 10 (Д44, Д42, Д33, Д34, Д24, Д26), біля рами й виходу, на сході Д48, Д45, Д13, Д1 і смуга вздовж парапету (Д28, Д23, Д14, Д6). За словами власника 28.10 немає: північна частина (Д7, Д8, Д9) і решта труб зі знімка Google між ліхтарями — на фото ці місця закриті ліхтарями.'], zone='notes')
sh.save(pdf)

# ================= аркуші 6–7: фото з позначками труб
from PIL import Image as _Im, ImageDraw as _ID, ImageFont as _IF
FDP = '/tmp/claude-0/-home-claude/48137fe6-4c58-5aa6-90c7-d55006f4596f/scratchpad/artifact-files/9faf1b11-04e1-4470-acaf-f54d7b58cfce/foto/'
_PF = _IF.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
_MC = {'ok': (20, 160, 60), 'no': (215, 40, 40), 'q': (235, 140, 0)}
def _dcircle(d, x, y, r, col, w, dash=False):
    if not dash: d.ellipse([x - r, y - r, x + r, y + r], outline=col, width=w); return
    for a0 in range(0, 360, 24): d.arc([x - r, y - r, x + r, y + r], a0, a0 + 13, fill=col, width=w)
def annot(name, crop, marks):
    im = _Im.open(FDP + name + '.jpg').convert('RGB'); d = _ID.Draw(im)
    for kind, (x, y), r, text, pos in marks:
        col = _MC[kind]; _dcircle(d, x, y, r, col, 6, dash=(kind == 'no'))
        tw = d.textlength(text, font=_PF); th = 34
        tx, ty = {'u': (x - tw / 2, y - r - th - 6), 'd': (x - tw / 2, y + r + 6), 'l': (x - r - tw - 10, y - th / 2), 'r': (x + r + 10, y - th / 2)}[pos]
        tx = min(max(tx, crop[0] + 4), crop[2] - tw - 4); ty = min(max(ty, crop[1] + 4), crop[3] - th - 4)
        d.rectangle([tx - 5, ty - 3, tx + tw + 5, ty + th], fill=(255, 255, 255)); d.text((tx, ty), text, fill=col, font=_PF)
    return im.crop(crop)
def photo_cell(sh, x, y, w, h, name, crop, marks, cap):
    im = annot(name, crop, marks); iw, ih = im.size; capH = 13
    sc = min(w / iw, (h - capH) / ih); dw, dh = iw * sc, ih * sc; x0 = x; y0 = y + h - dh
    a = sh.fig.add_axes([x0 / S.W3, y0 / S.H3, dw / S.W3, dh / S.H3]); a.imshow(im); a.axis('off')
    sh.ax.add_patch(Rectangle((x0, y0), dw, dh, fc='none', ec=C['line'], lw=0.4))
    for i, ln in enumerate(textwrap.wrap(cap, S.chars(w, FS['small'] + 0.6))[:3]): sh.T(x, y0 - 1.5 - i * 3.2, ln, FS['small'] + 0.6, va='top')
CELLS = [(24, 168), (218, 168), (24, 66), (218, 66)]
def photo_sheet(n, title, items):
    sh = S.Sheet(DOC, n, title)
    sh.view_title(24, 282.5, title)
    for (x, y), it in zip(CELLS, items): photo_cell(sh, x, y, 190, 105, *it)
    sh.notes(['Зелене коло — труба або лівневка є на фото (підпис — номер на плані, арк. 1, 5). Помаранчеве — труба є, номер визначено за напрямом (±3 м) або непевний. Червоний пунктир — тут за знімком Google мала бути труба, а на фото місце видно і труби немає.',
              'Фото обстеження 26–27.10.2026 (приватна версія 3D-двійника, папка «Фото антаріс» на Диску). Номери фото — час зйомки. Напрям і точку зйомки визначено за ліхтарями, рамою кондиціонерів і парапетами.'], fs=FS['small'] + 0.6)
    sh.save(pdf)
photo_sheet(6, 'Фотоперевірка труб: вихід на дах і ендова осі 10', [
    ('20261027_113540', (0, 600, 1200, 900), [('ok', (258, 800), 62, 'Д62', 'u'), ('ok', (608, 778), 58, 'Д53', 'd'), ('ok', (765, 805), 64, 'Д59', 'd'),
                                              ('no', (430, 775), 75, 'Д55, Д58 — немає', 'u'), ('ok', (613, 716), 26, 'Д46', 'r')],
     '113540, 27.10 — від виходу на північ: біля виходу лише 3 труби — Д62, Д53, Д59 (місця з РП); де за знімком Google мали бути Д50, Д55, Д58, — порожньо. Далі біля торця ліхтаря 4 — дві малі труби (Д46). Під рамою кондиціонерів і поруч труб немає.'),
    ('20261027_113538', (300, 640, 1200, 880), [('ok', (525, 790), 50, 'Д62', 'l'), ('ok', (862, 785), 55, 'Д53', 'd'), ('ok', (864, 720), 26, 'Д46', 'r'),
                                                ('no', (688, 746), 28, 'Д44', 'd'), ('no', (782, 742), 36, 'Д42, Д33, Д34, Д24, Д26', 'u')],
     '113538 — уздовж ендови осі 10 між ліхтарями 3 і 4: на 30–60 м від виходу труб немає (місця Д44, Д42, Д33, Д34, Д24, Д26 з РП і знімка Google). Біля торця ліхтаря 4 — дві малі труби з білими ковпаками (Д46).'),
    ('20261027_113009', (450, 520, 1200, 760), [('ok', (790, 655), 42, 'Д59', 'd'), ('ok', (950, 640), 64, 'Д53', 'd'), ('ok', (1155, 655), 44, 'Д62', 'd')],
     '113009 — з півночі, від торця рами кондиціонерів: та сама трійка в тих самих напрямках; найближча — Д53. Інших труб на південь від рами немає (Д51, Д61).'),
    ('20261027_113537', (0, 620, 1200, 900), [('ok', (760, 790), 50, 'Д62', 'd'), ('ok', (1160, 770), 55, 'Д53', 'l'),
                                              ('no', (400, 718), 34, 'Д56', 'u'), ('no', (575, 712), 30, 'Д47', 'd'), ('no', (667, 708), 26, 'Д43', 'u')],
     '113537 — від виходу на захід, до ліхтарів 1–3 і західної будівлі: крім Д62 і Д53 труб немає; на місцях Д43, Д47, Д56 (за знімком Google) порожньо.'),
])
photo_sheet(7, 'Фотоперевірка труб: східний прольот 13–17', [
    ('20261027_112738', (0, 470, 1200, 900), [('ok', (312, 610), 55, 'Д49', 'd'), ('ok', (376, 572), 14, 'Д10', 'u'), ('ok', (397, 584), 24, 'Д37', 'd'),
                                              ('ok', (500, 605), 30, 'Д39', 'u'), ('ok', (550, 627), 16, 'Д36', 'd'), ('ok', (1168, 835), 38, 'Д57', 'l'),
                                              ('no', (717, 672), 28, 'Д45', 'u'), ('no', (186, 608), 34, 'Д48', 'd'), ('no', (81, 594), 18, 'Д13', 'u')],
     '112738, 27.10 — з гребеня прольоту біля південного парапету (точка ≈86; 2) на північ. Видно 6 труб: Д49, Д37, Д10 (далеко), Д39, конус Д36 і праворуч конус Д57 біля парапету. На місцях Д48, Д45, Д13 — порожньо.'),
    ('20261027_112850', (300, 380, 1200, 960), [('ok', (735, 790), 125, 'Д36', 'l'), ('no', (370, 570), 110, 'Д28, Д23, Д14, Д6 — немає', 'u')],
     '112850 — конус Д36 біля східного парапету (у РП є, на знімку Google не видно). На північ уздовж парапету — до самого кінця даху труб немає: місця Д28, Д23, Д14, Д6 і малих труб з РП порожні.'),
    ('20261026_123646', (0, 250, 1200, 900), [('ok', (90, 495), 110, 'Д10', 'r'), ('no', (640, 640), 170, 'Д14, Д6 — немає', 'u')],
     '123646, 26.10 — уздовж східного парапету на північ (точка ≈92; 65): зліва великий дефлектор Д10; далі до північного парапету і північно-східного кута труб немає (Д14, Д6).'),
    ('20261026_123537', (300, 520, 1200, 700), [('q', (1070, 630), 40, 'Д39 або Д36', 'u'), ('ok', (800, 612), 36, 'Д37', 'u'), ('ok', (672, 588), 16, 'Д10', 'u'), ('q', (540, 582), 14, 'Д2?', 'u'),
                                                ('no', (314, 600), 24, 'Д13, Д1', 'u')],
     '123537, 26.10 — з ендови осі 13 на північ: Д37, далеко Д10, біля північного парапету мала труба (за напрямом — Д2). На місцях Д13 і Д1 порожньо.'),
])
photo_sheet(8, 'Фотоперевірка: лівневки і північний захід', [
    ('20261027_112440', (200, 450, 1100, 900), [('ok', (585, 697), 48, 'воронка — ЛВ-14', 'u')],
     '112440, 27.10 — біля стіни західної будівлі: воронка з решіткою в самому низу покрівлі (лінія ЛВ-13…15). Y точки зйомки не визначено — на плані посередині (ЛВ-14).'),
    ('20261026_123916', (300, 600, 1200, 1000), [('ok', (600, 828), 40, 'воронка — ЛВ-3', 'u')],
     '123916, 26.10 — північно-західна частина: воронка в ендові біля північного парапету (ЛВ-3, та сама — на 112509, 112519). Труб на цій ділянці немає (і за знімком Google їх тут немає).'),
    ('20261027_112519', (300, 240, 1200, 470), [('no', (729, 345), 44, 'Д4 — немає', 'd'), ('no', (816, 340), 34, 'Д5 — немає', 'u'), ('ok', (693, 333), 16, 'Д2', 'l')],
     '112519 — уздовж північного парапету на схід: на місцях Д4 і Д5 (за знімком Google) порожньо; далеко біля парапету — одна труба (за напрямом — Д2, та сама, що на 123537).'),
    ('20261026_123924', (0, 520, 1200, 1100), [('q', (1040, 770), 75, 'вода, воронка?', 'u')],
     '123924, 26.10 — ендова на південь між ліхтарями в західній частині: вода біля воронки, труб немає. Між ліхтарями 2 і 3 і на північній частині даху труб немає — за словами власника 28.10 (на фото ці місця закриті ліхтарями).'),
])

if os.path.exists(W + 'pv_eval.json'): exec(open(W + 'draw_pv.py', encoding='utf-8').read())
pdf.close()
print('pdf ok')

# ------------------------------------------------------------------ DXF
import ezdxf
from ezdxf.enums import TextEntityAlignment
doc = ezdxf.new('R2018', setup=True, units=6)          # 6 — метри
doc.header['$LTSCALE'] = 0.5; doc.header['$INSUNITS'] = 6
doc.styles.add('DV', font='DejaVuSans.ttf')
msp = doc.modelspace()
LAYC = {'00_ПОКРІВЛЯ_КОНТУР': (29, 42, 51), '01_ОСІ': (29, 42, 51), '02_ГРАНІ_ПОКРІВЛІ': (154, 165, 174), '03_ЕНДОВИ': (63, 110, 149), '04_ПАРАПЕТИ': (120, 128, 136),
        '05_ЗАХІДНА_БУДІВЛЯ': (150, 120, 90), '10_КАРКАС_ЦЕНТРАЛЬНИЙ_ПРОФІЛЬ': (29, 42, 51), '11_КАРКАС_КУТНИКИ_13': (91, 103, 112), '12_КАРКАС_КОНТУР': (91, 103, 112),
        '12_ЛІХТАР_ДЕМОНТОВАНО': (154, 165, 174), '20_РАМА_КОНДИЦІОНЕРІВ': (60, 70, 80), '21_ВИХІД_ПОРТАЛ': (60, 70, 80), '22_ДЕФЛЕКТОРИ_ФОТО': (20, 140, 60), '22_ДЕФЛЕКТОРИ_GOOGLE': (29, 42, 51),
        '22_ДЕФЛЕКТОРИ_УТОЧНИТИ': (29, 42, 51), '22_ДЕФЛЕКТОРИ_НЕМАЄ': (120, 128, 136), '23_ЛІВНЕВКИ': (42, 120, 214), '23_ЛІВНЕВКИ_УТОЧНИТИ': (42, 120, 214),
        '24_ІНШЕ': (180, 70, 27), '40_ТЕКСТ': (29, 42, 51), '41_СТІК': (63, 110, 149), '42_РОЗМІРИ': (29, 42, 51)}
for nm, rgb in LAYC.items():
    l = doc.layers.add(nm); l.rgb = rgb
LWV = [0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100]
def lw_(pt): mm = pt / MM * 100; return min(LWV, key=lambda v: abs(v - mm))
def lt_(ls):
    if ls in (None, '-'): return 'CONTINUOUS'
    if ls == '--': return 'DASHED'
    if ls == '-.': return 'DASHDOT'
    if ls == ':': return 'DOT'
    return 'DIVIDE'
def rgb_(c): r, g, b = to_rgb(c); return (int(r * 255), int(g * 255), int(b * 255))
TH = lambda pt: pt / MM * KPT * 0.72        # висота тексту в метрах (масштаб 1:500)
AP = {('left', 'top'): 1, ('center', 'top'): 2, ('right', 'top'): 3, ('left', 'center'): 4, ('center', 'center'): 5, ('right', 'center'): 6,
      ('left', 'bottom'): 7, ('center', 'bottom'): 8, ('right', 'bottom'): 9}
def to_dxf(G):
    for it in G.P:
        k = it[0]
        if k == 'poly':
            _, L, pts, closed, st = it
            if st.get('alpha', 1) == 0: continue
            fc = st.get('fc')
            if closed and fc not in (None, 'none'):
                h = msp.add_hatch(dxfattribs={'layer': L}); h.set_solid_fill(rgb=rgb_(fc)); h.paths.add_polyline_path(pts, is_closed=True)
            msp.add_lwpolyline(pts, close=closed, dxfattribs={'layer': L, 'lineweight': lw_(st.get('lw', LW['thin'])), 'linetype': lt_(st.get('ls') if isinstance(st.get('ls'), str) or st.get('ls') is None else 'x')})
        elif k == 'circle':
            _, L, c, r, st = it
            fc = st.get('fc')
            if fc not in (None, 'none') and fc != '#ffffff':
                h = msp.add_hatch(dxfattribs={'layer': L}); h.set_solid_fill(rgb=rgb_(fc)); ep = h.paths.add_edge_path(); ep.add_arc(c, r, 0, 360)
            msp.add_circle(c, r, dxfattribs={'layer': L, 'lineweight': lw_(st.get('lw', LW['thin'])), 'linetype': lt_(st.get('ls'))})
        elif k == 'text':
            _, L, xy, t, fs, rot, ha, va, st = it
            m = msp.add_mtext(t.replace('\n', '\\P'), dxfattribs={'layer': L, 'char_height': TH(fs), 'style': 'DV', 'rotation': rot, 'insert': xy, 'attachment_point': AP[(ha, va)]})
            if st.get('c') and st['c'] != C['ink']: m.rgb = rgb_(st['c'])
        elif k == 'arrow':
            _, L, p0, p1, st = it
            msp.add_line(p0, p1, dxfattribs={'layer': L}); d = np.subtract(p1, p0); d = d / np.linalg.norm(d); n_ = np.array([-d[1], d[0]])
            tip = np.array(p1); bk = tip - d * 0.6
            h = msp.add_hatch(dxfattribs={'layer': L}); h.set_solid_fill(rgb=LAYC[L]); h.paths.add_polyline_path([tuple(tip), tuple(bk + n_ * 0.22), tuple(bk - n_ * 0.22)], is_closed=True)
        elif k == 'dim':
            _, L, p0, p1, t, st = it
            v = st.get('v'); base = (p0[0], 0) if v else (0, p0[1])
            dim = msp.add_linear_dim(base=p0 if not v else (p0[0], p0[1]), p1=p0, p2=p1, angle=90 if v else 0, text=t.split(' (')[0],
                                     dxfattribs={'layer': L}, override={'dimtxt': TH(FS['small']), 'dimasz': 0.5, 'dimexe': 0.3, 'dimexo': 0.0, 'dimgap': 0.15, 'dimtxsty': 'DV'})
            dim.render()
        elif k == 'callout':
            _, L, xy, xt, t, st = it
            if st.get('xr'): xt = (st['xr'], xt[1])
            msp.add_lwpolyline([xy, xt], dxfattribs={'layer': L, 'lineweight': 13})
            msp.add_mtext(t.replace('\n', '\\P'), dxfattribs={'layer': L, 'char_height': TH(FS['small']), 'style': 'DV', 'insert': (xt[0] + (0.2 if st.get('side', 'r') == 'r' else -0.2), xt[1] + 0.2),
                                                             'attachment_point': 7 if st.get('side', 'r') == 'r' else 9})
# шар опромінення — смуги як заливки (контури за тими самими межами)
fig_ = plt.figure(); ax_ = fig_.add_subplot(111)
Z = np.ma.masked_invalid(EG); cs = ax_.contourf(XG, YG, Z, levels=BANDS)
for i, (pth, lab, col) in enumerate(zip(cs.get_paths(), BLAB, BCOL)):
    nm = f'30_РАДІАЦІЯ_{i + 1}_{lab.replace(" ", "").replace("<", "до").replace("≥", "від")}'
    l = doc.layers.add(nm); l.rgb = rgb_(col)
    polys = pth.to_polygons(closed_only=True)
    if not polys: continue
    h = msp.add_hatch(dxfattribs={'layer': nm}); h.set_solid_fill(rgb=rgb_(col))
    for pg in polys:
        if len(pg) >= 3: h.paths.add_polyline_path([tuple(p) for p in pg], is_closed=True)
plt.close(fig_)
lt = doc.layers.add('30_РАДІАЦІЯ_ПІДПИСИ'); lt.rgb = (29, 42, 51)
for F, fs_ in zip(R.FRAMES, FST):
    msp.add_mtext(f"Зх {nf(fs_['W'])} · Сх {nf(fs_['E'])} кВт·год/м²", dxfattribs={'layer': '30_РАДІАЦІЯ_ПІДПИСИ', 'char_height': TH(FS['small']), 'style': 'DV', 'insert': (F['xc'], F['y0'] - 1.6), 'attachment_point': 5})
to_dxf(plan('full'))
if os.path.exists(W + 'pv_eval.json'):          # модулі, проходи — окремими шарами в тому самому кресленні
    for V in PVV:                                 # вар. 1 — шари 50–53, вар. 2 — 60–63 (вмикати по черзі)
        GP = Prims(); LL = set(V['L'].values())
        for nm in LL:
            l = doc.layers.add(nm); l.rgb = (46, 139, 87) if 'ПРОХОДИ' in nm else (183, 121, 31) if 'ОСВІТЛЕННЯ' in nm else (42, 93, 176)
            if V is PVV[1]: l.off()
        for it in plan_pv(V).P:
            if it[1] in LL: GP.P.append(it)
        to_dxf(GP)
# шари радіації — під усім іншим (порядок відображення)
msp.add_mtext('Покрівля цеху Антарес після демонтажу ліхтарів (28.10.2026). Координати — осі моделі, м: X від осі 1 на схід, Y на північ. Шари 30_РАДІАЦІЯ_* — опромінення, кВт·год/м² за рік; 50–53 — модулі, варіант 1 (з проходами); 60–63 — варіант 2 (максимальний, вимкнено); 53/63 — модулі на освітлення.',
              dxfattribs={'layer': '40_ТЕКСТ', 'char_height': 0.6, 'style': 'DV', 'insert': (-4.0, 101.5), 'attachment_point': 7})
doc.saveas(OUT + NAME + '.dxf')
print('dxf ok')
