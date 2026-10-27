# -*- coding: utf-8 -*-
"""Рисунки до розрахунку «ліхтарі розібрати, каркас 22°»: розрізи (зараз / горизонтально / вертикально) і план модулів на ліхтарях."""
import json, math, sys, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon
from matplotlib.colors import LinearSegmentedColormap
sys.path.insert(0, '/home/claude/work/sun/v3'); import lan22 as L22
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 7.5})
V = '/home/claude/work/sun/v3/'; J = json.load(open(V + 'lan22.json')); roofZ = L22.ns['roofZ']
INK, MUT, BL, GL = '#1d2a33', '#5b6770', '#2a5db0', '#9fd3e6'
LM, DM = 2.384, 1.303; t22 = math.radians(22); c22, s22 = math.cos(t22), math.sin(t22)
F4 = J['modes']['base']['F'][3]; xc, zb = F4['xc'], F4['zb']
# ---------- 1. розрізи
fig, axs = plt.subplots(1, 3, figsize=(7.6, 1.75), dpi=220, sharey=True)
xs = np.linspace(xc - 4.2, xc + 4.2, 300)
def roof(ax):
    ax.fill_between(xs, 16.4, roofZ(xs), color='#d9dde1'); ax.plot(xs, roofZ(xs), color=INK, lw=0.9)
def dim(ax, x0, x1, y, t):
    ax.annotate('', xy=(x0, y), xytext=(x1, y), arrowprops=dict(arrowstyle='<->', lw=0.55, color=MUT)); ax.text((x0 + x1) / 2, y - 0.17, t, ha='center', va='top', fontsize=6, color=MUT)
# зараз
ax = axs[0]; roof(ax)
ax.add_patch(Polygon([(xc - 1.83, zb), (xc, zb + 1.89), (xc + 1.83, zb)], closed=True, fc=GL, ec='#5a8fa8', lw=0.8, alpha=0.8))
ax.text(xc, zb + 0.55, 'полікарбонат\n46°', ha='center', fontsize=6, color='#1f5f78')
dim(ax, xc - 1.83, xc + 1.83, zb - 0.12, '3,66 (рулетка)'); ax.annotate('', xy=(xc + 2.3, zb), xytext=(xc + 2.3, zb + 1.89), arrowprops=dict(arrowstyle='<->', lw=0.55, color=MUT))
ax.text(xc + 2.4, zb + 0.95, '1,89', fontsize=6, color=MUT, va='center')
ax.set_title('Зараз: ліхтар-«домік»', fontsize=7.5, loc='left', weight='bold', color=INK)
def gable(ax, hw, rows, orient, title):
    roof(ax); ze = zb + 0.30; zr = ze + hw * math.tan(t22)
    ax.add_patch(Polygon([(xc - hw, ze), (xc, zr), (xc + hw, ze), (xc + hw, zb), (xc - hw, zb)], closed=True, fc='#efe6d8', ec='#8a6f4d', lw=0.7))
    up = DM if orient == 'L' else LM
    for sg in (1, -1):
        for r in range(rows):
            u0 = 0.02 + r * (up + 0.022); u1 = u0 + up
            p0 = (xc + sg * u0 * c22, zr - u0 * s22); p1 = (xc + sg * u1 * c22, zr - u1 * s22)
            ax.plot([p0[0], p1[0]], [p0[1] + 0.14, p1[1] + 0.14], color=BL, lw=3.2, solid_capstyle='butt')
    ax.plot([xc - 1.83, xc - 1.83], [zb, zb + 0.15], color='#5a8fa8', lw=0.8, ls=':'); ax.plot([xc + 1.83, xc + 1.83], [zb, zb + 0.15], color='#5a8fa8', lw=0.8, ls=':')
    dim(ax, xc - hw, xc + hw, zb - 0.12, f'{2 * hw:.2f}'.replace('.', ','))
    ax.annotate('', xy=(xc + hw + 0.35, ze), xytext=(xc + hw + 0.35, zr + 0.16), arrowprops=dict(arrowstyle='<->', lw=0.55, color=MUT))
    ax.text(xc + hw + 0.45, (ze + zr) / 2, f'{zr + 0.16 - zb:.2f}'.replace('.', ',') + '\nнад\nпокр.', fontsize=5.6, color=MUT, va='center')
    ax.text(xc, zr + 0.42, '22°', ha='center', fontsize=6.5, color='#8a6f4d')
    ax.set_title(title, fontsize=7.5, loc='left', weight='bold', color=INK)
gable(axs[1], J['modes']['G1']['half'], 1, 'L', 'Горизонтально: 1 ряд на схил')
axs[1].annotate('низ схилу 0,65 м —\nможна полікарбонат', xy=(xc - 1.55, zb + 0.42), xytext=(xc - 4.1, zb + 1.55), fontsize=5.4, color='#8a6f4d', arrowprops=dict(arrowstyle='-', lw=0.5, color='#8a6f4d'))
gable(axs[2], J['modes']['V1']['half'], 1, 'P', 'Вертикально: 1 ряд на схил')
for ax in axs:
    ax.set_xlim(xc - 4.3, xc + 4.3); ax.set_ylim(zb - 0.75, zb + 2.25); ax.set_aspect('equal'); ax.tick_params(labelsize=5.5)
    ax.set_xticks([]); ax.spines[['top', 'right']].set_visible(False)
axs[0].set_ylabel('м над ±0,000', fontsize=6)
fig.text(0.01, 0.03, 'Ліхтар № 4 (біля виходу), розріз поперек ліхтаря, дивимось на північ. Синім — модулі 2 384 × 1 303 мм; пунктир — межа нинішнього ліхтаря. '
         'Карниз нового каркаса — 0,30 м над покрівлею (оцінка), модуль на рейці +0,16 м.', fontsize=5.8, color=MUT)
fig.tight_layout(); fig.savefig(V + 'lan22_sec.png', bbox_inches='tight'); plt.close(fig)
# ---------- 2. план модулів на ліхтарях (кВт·год/кВтп)
cm = LinearSegmentedColormap.from_list('y', ['#6b2a6e', '#b4461b', '#e8892a', '#f6c453', '#fff3b0'])
fig, axs = plt.subplots(1, 2, figsize=(7.6, 3.0), dpi=220)
for ax, md in zip(axs, ('G1', 'V1')):
    R = J['modes'][md]; LN = R['lan']
    ax.add_patch(Rectangle((0, 0), 96.64, 96.34, color='#f1f3f5'))
    for c in R['roof']['C']: ax.add_patch(Rectangle((c['xa'], c['y'] - 1.192), c['xb'] - c['xa'], 2.384, color='#d3d8dd', lw=0))
    for f in R['F']: ax.add_patch(Rectangle((f['x0'], f['y0']), f['x1'] - f['x0'], f['y1'] - f['y0'], fill=False, ec='#8a6f4d', lw=0.5))
    for m in LN['mods']:
        y_ = m['kwh'] / 0.73; col = '#c2c8cd' if m.get('drop') else cm(np.clip((y_ - 880) / 120, 0, 1))
        x0 = m['x'] - (DM if md == 'G1' else LM) * c22 / 2; w = (DM if md == 'G1' else LM) * c22
        ax.add_patch(Rectangle((x0, m['y']), w, m['y1'] - m['y'], color=col, ec='white', lw=0.15))
    ax.set_xlim(-1, 97.6); ax.set_ylim(20, 81); ax.set_aspect('equal'); ax.tick_params(labelsize=5.5)
    ax.set_title(f"{'Горизонтально' if md == 'G1' else 'Вертикально'}: {LN['n']} = {LN['st']} × 11 мод., " + f"{LN['mwh']:.1f}".replace('.', ',') + " МВт·год", fontsize=7, loc='left', weight='bold', color=INK)
sm = plt.cm.ScalarMappable(cmap=cm, norm=plt.Normalize(880, 1000)); cb = fig.colorbar(sm, ax=axs, fraction=0.025, pad=0.02); cb.set_label('кВт·год/кВтп за рік', fontsize=6.5); cb.ax.tick_params(labelsize=5.5)
fig.text(0.02, -0.02, 'Сірі прямокутники — модулі даху (варіант А); коричневі рамки — каркаси на місці ліхтарів; сірі на ліхтарі — поза стрінгами по 11. '
         'Схід — праворуч від гребеня, захід — ліворуч.', fontsize=5.8, color=MUT)
fig.savefig(V + 'lan22_plan.png', bbox_inches='tight'); plt.close(fig)
print('ok')
