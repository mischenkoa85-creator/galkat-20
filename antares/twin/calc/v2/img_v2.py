import json, math, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, Patch
from matplotlib.lines import Line2D
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 8})
D = '/home/claude/work/sun/v2/'; R = json.load(open(D + 'final_v2.json'))
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
INK, MUT, RED, AC, STR = '#1d2a33', '#5b6770', '#b4461b', '#7a3fa0', '#c9781c'
CLS = [(5, '#22345f', 'тінь до 5 %'), (10, '#3f6fb5', '5–10 %'), (15, '#86a9d6', '10–15 %')]
FAC = R['FAC']; LAN = R['LAN']; LH = R['LH']
# ---------- план
fig, ax = plt.subplots(figsize=(9.4, 9.8), dpi=170)
ax.add_patch(Rectangle((-12.58, -0.5), 12.0, 97.09, facecolor='#e4e6e8', edgecolor='#9aa7b3', lw=0.5, hatch='////'))
ax.text(-6.6, 48, 'Західна будівля\n≈6,8 м над покрівлею\n(фото)', rotation=90, ha='center', va='center', fontsize=6.6)
ax.add_patch(Rectangle((-0.58, -0.25), 97.38, 96.59, facecolor='#f6f7f8', edgecolor=INK, lw=0.8))
for p in FAC: ax.plot([p['x0'], p['x0']], [-0.25, 96.34], color='#c9d0d5', lw=0.4)
for x in (17.87, 36.12, 54.25, 72.4): ax.plot([x, x], [-0.25, 96.34], color='#8fa9b8', lw=0.8, ls=(0, (4, 2)))
for L in LAN: ax.add_patch(Rectangle((L['x0'], L['y0']), L['x1'] - L['x0'], L['y1'] - L['y0'], facecolor='#cfe0ea', edgecolor='#8fa9b8', lw=0.5))
for xa, xb, y, s, kwh, loss, tilt, face, sp in R['mods']:
    y0 = y - 1.192
    if s == 'ok':
        col = next(c for t, c, _ in CLS if loss <= t); ax.add_patch(Rectangle((xa + 0.03, y0), xb - xa - 0.06, 2.384, facecolor=col, lw=0))
    elif s in ('shade', 'ac', 'portal', 'door', 'str'):
        ax.add_patch(Rectangle((xa + 0.08, y0 + 0.05), xb - xa - 0.16, 2.284, facecolor='none', edgecolor={'shade': RED, 'str': STR}.get(s, AC), lw=0.45, ls=(0, (1.6, 1.0))))
for z in R['ZONES']: ax.add_patch(Rectangle((z['x'][0], z['y'][0]), z['x'][1] - z['x'][0], z['y'][1] - z['y'][0], facecolor='none', edgecolor=AC, lw=0.8, ls=(0, (3, 1.5)), zorder=5))
_d = open('/home/claude/work/twin/data.js', encoding='utf-8').read(); _A = json.loads(_d[_d.find('{'):_d.rfind('}') + 1])['site']['ac']
ax.add_patch(Rectangle((_A['x0'], _A['y0']), _A['x1'] - _A['x0'], _A['y1'] - _A['y0'], facecolor=AC, lw=0, zorder=6))
ax.add_patch(Rectangle((58.4, -2.45), 7.2, 1.95, facecolor='#9aa7b3', lw=0)); ax.text(62, -3.7, 'сходи', fontsize=6, ha='center')
for i, (sp, x) in enumerate([('1–4', 9.0), ('4–7', 27.1), ('7–10', 45.2), ('10–13', 63.3), ('13–17', 84.4)]):
    s = R['span'][i]; ax.text(x, 97.6, f"осі {sp}\n{s['n']} мод.", ha='center', va='bottom', fontsize=6.4, color=INK)
B = R['base']
ax.set_title(f"Дах цеху за розрізом 1-1: {nf(B['n'])} модулів = {B['st']} стрінгів × 11 · {nf(B['kwp'], 1)} кВтп · {nf(B['mwh'], 1)} МВт·год за рік", fontsize=8.2, loc='left', color=INK, weight='bold')
H = [Patch(facecolor=c, label=f'модулі: {t}') for _, c, t in CLS] + [Patch(facecolor='none', edgecolor=RED, ls='--', label='прибрано: тінь > 15 %'),
     Patch(facecolor='none', edgecolor=AC, ls='--', label='кондиціонери, портал, двері'), Patch(facecolor='none', edgecolor=STR, ls='--', label='під стрінги по 11'),
     Patch(facecolor='#cfe0ea', edgecolor='#8fa9b8', label='ліхтарі (X — креслення, Y — РП)'), Line2D([], [], color='#c9d0d5', label='злами граней через ≈3 м'),
     Line2D([], [], color='#8fa9b8', ls='--', label='ендови')]
ax.legend(handles=H, loc='upper left', bbox_to_anchor=(0, -0.04), ncol=3, fontsize=6.3, frameon=False, handlelength=1.6, columnspacing=1.0)
ax.text(1.0, -0.03, 'Північ угорі, схід праворуч. Модулі довгою стороною вздовж будівлі, по 2 на грань.', transform=ax.transAxes, fontsize=6, color=MUT, ha='right', va='top')
ax.set_xlim(-13.5, 98); ax.set_ylim(-5, 104); ax.set_aspect('equal'); ax.tick_params(labelsize=6, length=2); ax.set_xticks(range(0, 100, 12)); ax.set_yticks(range(0, 100, 12))
for sp_ in ax.spines.values(): sp_.set_visible(False)
fig.tight_layout(); fig.savefig(D + 'plan_v2.png', bbox_inches='tight'); fig.savefig('/home/claude/work/sun/Розкладка_модулів_на_даху_за_розрізом_1-1_Антарес_27.10.2026.png', bbox_inches='tight'); plt.close(fig)
# ---------- розріз (вертикаль ×3)
VX = 3.0; Y = min(R['ROWS'], key=lambda v: abs(v - 50))
fig, ax = plt.subplots(figsize=(10, 3.3), dpi=170)
pts = sorted({(p['x0'], p['z0']) for p in FAC} | {(p['x1'], p['z1']) for p in FAC})
prof = [(-0.58, 16.15)] + pts + [(96.8, 16.06)]
xs = [p[0] for p in prof]; zs = [(p[1] - 15.0) * VX for p in prof]
ax.fill_between(xs, [-0.6 * VX] * len(xs), zs, color='#d9dde1', lw=0); ax.plot(xs, zs, color=INK, lw=0.8)
ax.add_patch(Rectangle((-8, -0.6 * VX), 7.42, (22.7 - 14.4) * VX, facecolor='#e4e6e8', edgecolor='#9aa7b3', hatch='////', lw=0.5))
ax.text(-4.3, (21.6 - 15) * VX, 'західна\nбудівля\n+22,7', ha='center', fontsize=6)
for L in LAN:
    xc = (L['x0'] + L['x1']) / 2; ax.add_patch(Polygon([(L['x0'], (L['zb'] - 15) * VX), (xc, (L['zb'] + LH - 15) * VX), (L['x1'], (L['zb'] - 15) * VX)], closed=True, facecolor='#cfe0ea', edgecolor='#8fa9b8', lw=0.6, ls='--'))
for xa, xb, y, s, kwh, loss, tilt, face, sp in R['mods']:
    if abs(y - round(Y, 3)) > 0.01 or s != 'ok': continue
    za, zb = np.interp([xa, xb], [p[0] for p in pts], [p[1] for p in pts]); col = next(c for t, c, _ in CLS if loss <= t)
    ax.plot([xa, xb], [(za + 0.15 - 15) * VX, (zb + 0.15 - 15) * VX], color=col, lw=2.4, solid_capstyle='butt')
for xa, xb, y, s, kwh, loss, tilt, face, sp in R['mods']:
    if abs(y - round(Y, 3)) > 0.01 or s != 'shade': continue
    za, zb = np.interp([xa, xb], [p[0] for p in pts], [p[1] for p in pts]); ax.plot([xa, xb], [(za + 0.15 - 15) * VX, (zb + 0.15 - 15) * VX], color=RED, lw=1.2, ls=(0, (2, 1)))
for x, z, t in [(18.0, 15.9, '+15,90'), (36.1, 15.9, '+15,90'), (7.5, 17.66, '+17,66'), (84.5, 18.15, '+18,15'), (96.5, 15.96, '+15,96')]:
    ax.annotate(t, (x, (z - 15) * VX), xytext=(x, (z - 15) * VX + 1.6), ha='center', fontsize=6, arrowprops=dict(arrowstyle='-', lw=0.4, color=MUT))
ax.text(10.5, (17.66 + LH - 15) * VX + 0.5, f'ліхтар — гребінь ≈{nf(LH, 1)} м (оцінка)', ha='center', fontsize=5.8, color='#5f7f92')
ax.text(-8, -3.3, f'Розріз уздовж осі X на Y {nf(Y, 1)} м (через ліхтарі). Вертикаль збільшено втричі. Модулі: колір — тінь, червоний пунктир — прибрані (тінь > 15 %).', fontsize=6, color=MUT)
ax.set_xlim(-9, 98); ax.set_ylim(-3.8, 25); ax.set_aspect('equal'); ax.axis('off')
ax.set_title('Розріз 1-1 (креслення замовника): грані по ≈3 м, по 2 модулі на грань', fontsize=8, loc='left', color=INK, weight='bold')
fig.tight_layout(); fig.savefig(D + 'sec_v2.png', bbox_inches='tight'); plt.close(fig)
print('ok')
