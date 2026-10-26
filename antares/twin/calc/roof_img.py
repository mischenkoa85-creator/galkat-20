import json, math, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Patch
from matplotlib.lines import Line2D
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 8})
R = json.load(open('calc/roof_final.json'))
TW = 'src/'; d = open(TW + 'data.js', encoding='utf-8').read(); S = json.loads(d[d.find('{'):d.rfind('}') + 1])['site']
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
INK, MUT, OLD, NEW, RED, AC = '#1d2a33', '#5b6770', '#22345f', '#2c9a5b', '#b4461b', '#7a3fa0'
fig, ax = plt.subplots(figsize=(9.2, 9.6), dpi=170)
ax.add_patch(Rectangle((-12.15, -0.5), 12.0, 97.09, facecolor='#e4e6e8', edgecolor='#9aa7b3', lw=0.5, hatch='////'))
ax.text(-6.15, 48, 'Західна будівля\n≈6,8 м над дахом цеху\n(висота — за фото;\nширина й довжина\nне виміряні)', rotation=90, ha='center', va='center', fontsize=6.6, color=INK)
ax.add_patch(Rectangle((-0.15, -0.5), 96.79, 97.09, facecolor='#f6f7f8', edgecolor=INK, lw=0.8))
for l in S['lan']: ax.add_patch(Rectangle((l[0], l[2]), l[1] - l[0], l[3] - l[2], facecolor='#cfe0ea', edgecolor='#8fa9b8', lw=0.4))
STR = '#c9781c'
for xa, xb, y, s, kwh, loss in R['mods']:
    y0 = y - 1.192
    if s in ('old', 'new'): ax.add_patch(Rectangle((xa + 0.02, y0), xb - xa - 0.04, 2.384, facecolor=OLD if s == 'old' else NEW, lw=0))
    else: ax.add_patch(Rectangle((xa + 0.06, y0 + 0.04), xb - xa - 0.12, 2.304, facecolor='none', edgecolor=STR if s == 'str' else RED, lw=0.5 if s == 'str' else 0.45, ls=(0, (1.6, 1.0))))
for o in S['obs']: ax.add_patch(Circle((o[0], o[1]), o[2] / 2, facecolor='none', edgecolor='#c9cfd4', lw=0.7, ls=(0, (1.2, 1)), zorder=4))
for Z in R['zones']: ax.add_patch(Rectangle((Z['x'][0], Z['y'][0]), Z['x'][1] - Z['x'][0], Z['y'][1] - Z['y'][0], facecolor='none', edgecolor=AC, lw=0.9, ls=(0, (3, 1.5)), zorder=5))
ax.add_patch(Rectangle((61.45, 7), 1.5, 12, facecolor=AC, lw=0)); ax.text(67.0, 1.2, '11 кондиціонерів на рамі\n(положення за фото, ±3 м)', fontsize=6, color=AC, va='center', bbox=dict(facecolor='white', edgecolor='none', pad=1.2), zorder=6)
for x, y in ((58, 0.6), (60.6, 0.6), (58, 2.6), (60.6, 2.6)): ax.add_patch(Rectangle((x - 0.15, y - 0.15), 0.3, 0.3, facecolor='#4b5560', lw=0))
ax.plot([58, 60.6, 60.6, 58, 58], [0.6, 0.6, 2.6, 2.6, 0.6], color='#4b5560', lw=0.6); ax.text(54.5, 1.6, 'портал', fontsize=5.8, color=INK, ha='right', va='center')
ax.add_patch(Rectangle((58.4, -2.45), 7.2, 1.95, facecolor='#9aa7b3', lw=0)); ax.text(62.0, -3.6, 'сходи, вихід на дах', fontsize=5.8, ha='center', color=INK)
ax.add_patch(Rectangle((-0.35, 86.0), 0.4, 1.0, facecolor=INK, lw=0)); ax.text(-0.9, 86.5, 'двері на дах →', fontsize=5.6, color=INK, ha='right', va='center', bbox=dict(facecolor='#e4e6e8', edgecolor='none', pad=0.8))
for c in R['COL'][:6]:
    xm = (c['xa'] + c['xb']) / 2; ax.text(xm, 97.6, f"{nf(c['loss'], 1)} %", rotation=90, fontsize=5.6, ha='center', va='bottom', color=RED if c['k'] <= R['drop'] else MUT)
ax.text(-0.2, 102.6, 'втрата від тіні по колонках →', fontsize=5.8, color=MUT, ha='left')
B = R['base']
ax.set_title(f"Дах цеху — розкладка 26.10 без вентиляції: {nf(B['n'])} модулів = {B['st']} стрінгів × 11 · {nf(B['kwp'], 1)} кВтп · {nf(B['mwh'], 1)} МВт·год за рік",
             fontsize=8.2, loc='left', color=INK, weight='bold')
cnt = R['cnt']
H = [Patch(facecolor=OLD, label=f"лишаються з розкладки 25.10 — {nf(cnt['old'])}"), Patch(facecolor=NEW, label=f"нові місця, де стояла вентиляція — {cnt['new']} (ще {cnt['new_all'] - cnt['new']} прибрано під стрінги)"),
     Patch(facecolor='none', edgecolor=RED, ls='--', label=f"прибрані: тінь західної будівлі {cnt['west']} (4 колонки), кондиціонери {cnt['ac']}, портал {cnt['portal']}"),
     Patch(facecolor='none', edgecolor=STR, ls='--', label=f"прибрані під стрінги по 11 — {cnt['str']} найслабших"),
     Patch(facecolor='none', edgecolor=AC, ls='--', label='кондиціонери: рама + 1 м, прохід від виходу, труби; портал'),
     Patch(facecolor='#cfe0ea', edgecolor='#8fa9b8', label='світлові ліхтарі (відступи — як 25.10)'),
     Line2D([], [], marker='o', ls='', mfc='none', mec='#8a949b', label='колишня вентиляція — прибрана')]
ax.legend(handles=H, loc='upper left', bbox_to_anchor=(0, -0.045), ncol=2, fontsize=6.4, frameon=False, handlelength=1.6, columnspacing=1.2)
ax.text(1.0, -0.035, 'Північ угорі, схід праворуч. Модуль 2384 × 1303, ряди по 2,4 м, проходи як 25.10.', transform=ax.transAxes, fontsize=6, color=MUT, ha='right', va='top')
ax.set_xlim(-13, 98); ax.set_ylim(-5, 106); ax.set_aspect('equal'); ax.tick_params(labelsize=6, length=2)
ax.set_xticks(range(0, 100, 12)); ax.set_yticks(range(0, 100, 12))
for sp in ax.spines.values(): sp.set_visible(False)
fig.tight_layout(); fig.savefig('calc/img/roof26.png', bbox_inches='tight')
fig.savefig('calc/Розкладка_модулів_на_даху_без_вентиляції_Антарес_26.10.2026.png', bbox_inches='tight')
