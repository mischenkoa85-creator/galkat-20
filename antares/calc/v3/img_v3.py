# -*- coding: utf-8 -*-
"""Рисунки для звіту v3: план об'єктів на супутнику, карта опромінення 0,5 м, розкладки А / Б / В."""
import json, math, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Polygon
from matplotlib.colors import LinearSegmentedColormap
from PIL import Image
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 7.5})
V = '/home/claude/work/sun/v3/'; SAT = '/home/claude/work/sat/'
J = json.load(open(V + 'roof_v3.json')); L3 = json.load(open(V + 'layout_v3.json')); IR = json.load(open(V + 'irr_v3.json'))
LAN = J['LAN']; DF = json.load(open(V + 'defl_v3.json')); ZON = J['ZONES']
dj = open('/home/claude/work/twin/data.js', encoding='utf-8').read(); S = json.loads(dj[dj.find('{'):dj.rfind('}') + 1])['site']; AC = S['ac']
INK, MUT = '#1d2a33', '#5b6770'
def frame(ax, lim=(-3, 100, -3, 100)):
    ax.set_xlim(lim[0], lim[1]); ax.set_ylim(lim[2], lim[3]); ax.set_aspect('equal')
    ax.set_xticks(range(0, 100, 10)); ax.set_yticks(range(0, 100, 10)); ax.tick_params(labelsize=6, length=2); ax.grid(color='#ffffff', lw=0.3, alpha=0.35)
# ---------- 1. супутник + об'єкти
im = Image.open(SAT + 'rect_A_0.1m.png')       # X −3…100, Y −3…100, 0,1 м/пкс (Google, знімок до 2026)
fig, ax = plt.subplots(figsize=(7.4, 7.4), dpi=200)
ax.imshow(im, extent=[-3, 100, -3, 100])
for L in LAN:
    ax.add_patch(Rectangle((L['x0'], L['y0']), L['x1'] - L['x0'], L['y1'] - L['y0'], fill=False, ec='#00e5ff', lw=0.9))
ax.add_patch(Rectangle((AC['x0'], AC['y0']), AC['x1'] - AC['x0'], AC['y1'] - AC['y0'], fill=False, ec='#ff4fd8', lw=1.0))
ax.add_patch(Rectangle((62, -0.25), 8, 3.85, fill=False, ec='#7dff6b', lw=0.9, ls='--'))
ax.add_patch(Circle((72, 1.12), 0.5, fill=False, ec='#ffe14d', lw=0.9))
col = {'є': '#ff3b30', 'уточнити': '#ffb020', 'під рамою кондиціонерів — ймовірно знято': '#9aa3a8', 'немає на супутнику (ділянку видно) — не враховуємо': '#9aa3a8'}
for o in DF:
    c = col[o['st']]; ax.add_patch(Circle((o['x'], o['y']), max(o['d'] / 2, 0.35) + 0.25, fill=False, ec=c, lw=0.8))
    ax.text(o['x'] + 0.9, o['y'] + 0.6, str(o['n']), color=c, fontsize=4.6, weight='bold')
frame(ax)
ax.set_title('Дах цеху на супутнику Google (знімок до 2026) і об\'єкти моделі v3', fontsize=8.5, loc='left', color=INK, weight='bold')
from matplotlib.lines import Line2D
hl = [Line2D([], [], color='#00e5ff', lw=1, label='ліхтарі 3,66 м (рулетка), довжина — РП'), Line2D([], [], color='#ff4fd8', lw=1, label='рама кондиціонерів (фото, ±2 м)'),
      Line2D([], [], color='#7dff6b', lw=1, ls='--', label='вихід і портал (X 62–70, уточнити)'), Line2D([], [], color='#ffe14d', lw=1, label='воронка (рулетка)'),
      Line2D([], [], marker='o', color='#ff3b30', lw=0, mfc='none', label='дефлектор: є (супутник)'), Line2D([], [], marker='o', color='#ffb020', lw=0, mfc='none', label='мала труба з РП — уточнити'),
      Line2D([], [], marker='o', color='#9aa3a8', lw=0, mfc='none', label='не враховано (знято / немає)')]
ax.legend(handles=hl, loc='upper center', bbox_to_anchor=(0.5, -0.04), ncol=3, fontsize=5.8, frameon=False)
fig.savefig(V + 'v3_sat.png', bbox_inches='tight'); plt.close(fig)
# ---------- 2. карта опромінення
nx, ny = IR['nx'], IR['ny']; E = np.array([np.nan if (v is None or k != 'r') else v for v, k in zip(IR['e'], IR['k'])], float).reshape(ny, nx)
El = np.array([np.nan if (v is None or k != 'l') else v for v, k in zip(IR['e'], IR['k'])], float).reshape(ny, nx)
cm = LinearSegmentedColormap.from_list('sun', ['#2b1a3d', '#6b2a6e', '#b4461b', '#e8892a', '#f6c453', '#fff3b0'])
fig, ax = plt.subplots(figsize=(7.4, 7.0), dpi=200)
m = ax.imshow(E, origin='lower', extent=[0, 96.64, 0, 96.34], cmap=cm, vmin=800, vmax=1185, interpolation='nearest')
ax.imshow(El, origin='lower', extent=[0, 96.64, 0, 96.34], cmap='Greys', vmin=600, vmax=1400, alpha=0.55, interpolation='nearest')
for o in DF:
    if o['st'] in ('є', 'уточнити'): ax.add_patch(Circle((o['x'], o['y']), o['d'] / 2, color='#1d2a33'))
ax.add_patch(Rectangle((AC['x0'], AC['y0']), AC['x1'] - AC['x0'], AC['y1'] - AC['y0'], color='#ffffff', ec='#1d2a33', lw=0.5))
cb = plt.colorbar(m, ax=ax, fraction=0.04, pad=0.02); cb.set_label('кВт·год/м² за рік у площині покрівлі', fontsize=7); cb.ax.tick_params(labelsize=6)
frame(ax, (0, 96.64, 0, 96.34)); ax.grid(False)
ax.set_title('Сонячне опромінення покрівлі, кВт·год/м² за рік (сітка 0,5 × 0,5 м, з тінями)', fontsize=8.5, loc='left', color=INK, weight='bold')
ax.text(0, -6.5, 'Сірим — схили ліхтарів (світлопрозорі); чорні кола — дефлектори й труби; білий прямокутник — рама кондиціонерів. Горизонтальна площина без тіні — 1 180 кВт·год/м².', fontsize=6, color=MUT)
fig.savefig(V + 'v3_irr.png', bbox_inches='tight'); plt.close(fig)
# ---------- 3. розкладки
C = L3['C']; WHYC = {'lan': '#cfe0ea', 'defl': '#8a5a2b', 'ac': '#7a3fa0', 'exit': '#7a3fa0', 'door': '#7a3fa0', 'drain': '#ffe14d'}
cand = J['cand']
def layout(ax, V_, title, small=False):
    inS = {}
    for s in V_['strings']:
        for i in s['ids']: inS[i] = s['id']
    ax.add_patch(Rectangle((0, 0), 96.64, 96.34, color='#f1f3f5', zorder=0))
    for L in LAN: ax.add_patch(Rectangle((L['x0'], L['y0']), L['x1'] - L['x0'], L['y1'] - L['y0'], color='#cfe0ea', ec='#8fa9b8', lw=0.3))
    for o in DF:
        if o['st'] in ('є', 'уточнити'): ax.add_patch(Circle((o['x'], o['y']), max(o['d'] / 2, 0.3), color='#6b4a2e'))
    ax.add_patch(Rectangle((AC['x0'], AC['y0']), AC['x1'] - AC['x0'], AC['y1'] - AC['y0'], color='#7a3fa0'))
    norm = lambda v: (np.clip(v, 900, 1185) - 900) / 285
    for i, c in enumerate(C):
        col_ = cm(0.25 + 0.75 * norm(c['irr'])) if i in inS else '#d7dce0'
        ax.add_patch(Rectangle((c['xa'], c['y'] - 1.192), c['xb'] - c['xa'], 2.384, color=col_, ec='#ffffff' if i in inS else '#c2c8cd', lw=0.12))
    frame(ax, (-1, 97.5, -1, 97.3)); ax.grid(False)
    ax.set_title(title, fontsize=7 if small else 8.5, loc='left', color=INK, weight='bold')
fig, ax = plt.subplots(figsize=(7.4, 7.4), dpi=200)
A = L3['VARS'][0]
layout(ax, A, f"Варіант А — усі вільні місця: {A['n']:,} модулів = {A['st']} стрінгів × 11, {A['kwp']:.1f} кВтп, {A['mwh']:.1f} МВт·год".replace(',', ' ').replace('.', ','))
ax.text(-1, -5.5, 'Колір модуля — опромінення його площини (світліше — більше); сірі — вільні місця поза стрінгами по 11; коричневі кола — дефлектори; фіолетовий — рама кондиціонерів; блакитні — ліхтарі (вільні).', fontsize=6, color=MUT)
fig.savefig(V + 'v3_lay_A.png', bbox_inches='tight'); plt.close(fig)
fig, axs = plt.subplots(1, 2, figsize=(7.4, 3.9), dpi=200)
for ax, V_, nm in zip(axs, L3['VARS'][1:], ('Б · від 1 050 кВт·год/м²', 'В · від 1 100 кВт·год/м²')):
    layout(ax, V_, f"{nm}: {V_['n']:,} модулів, {V_['mwh']:.1f} МВт·год".replace(',', ' ').replace('.', ','), small=True)
fig.tight_layout(); fig.savefig(V + 'v3_lay_BV.png', bbox_inches='tight'); plt.close(fig)
print('ok')
