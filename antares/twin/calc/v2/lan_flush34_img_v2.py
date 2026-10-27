import json, math, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 8})
D = '/home/claude/work/sun/v2/'; G = json.load(open(D + 'lan_flush34_v2.json')); F = json.load(open(D + 'final_v2.json'))
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
INK, MUT, PE, PW, ROOF = '#1d2a33', '#5b6770', '#2f6fdb', '#7a3fa0', '#22345f'
FAC = F['FAC']; pts = sorted({(p['x0'], p['z0']) for p in FAC} | {(p['x1'], p['z1']) for p in FAC}); px = [p[0] for p in pts]; pz = [p[1] for p in pts]
J = json.load(open(D + 'roof_v2_1.5_0.50.json')); C = [c for c in J['cand'] if c['why'] is None and c['loss'] <= 15]; C = sorted(C, key=lambda c: -c['kwh'])[:len(C) // 11 * 11]
K = G['K']; L = G['LAN'][1]; xc = (L['x0'] + L['x1']) / 2; HW, LH, LM = 1.70, 1.74, 2.384; th = math.atan2(LH, HW); c, s = math.cos(th), math.sin(th)
L0 = F['LAN'][1]
fig, ax = plt.subplots(figsize=(9.4, 3.3), dpi=170)
xs = np.linspace(xc - 5.2, xc + 5.2, 240); zs = np.interp(xs, px, pz)
ax.fill_between(xs, zs - 0.35, zs, color='#c4ccd3', lw=0); ax.plot(xs, zs, color=INK, lw=0.8)
ax.add_patch(Polygon([(L['x0'], L['zb']), (xc, L['zb'] + LH), (L['x1'], L['zb'])], closed=True, facecolor='#cfe0ea', edgecolor='#8fa9b8', lw=0.7))
for xe in (L['x0'], L['x1']): ax.plot([xe, xe], [float(np.interp(xe, px, pz)), L['zb']], color='#8fa9b8', lw=0.7)
ax.plot([L0['x0'], L0['x1']], [L['zb'] - 0.04, L['zb'] - 0.04], color='#b4461b', lw=1.0, ls=(0, (2, 1)))
ax.text(xc, L['zb'] - 0.2, 'отвір 2,87 м (розріз 1-1)', ha='center', fontsize=5.8, color='#b4461b')
for sg, col in ((1, PE), (-1, PW)):
    a, b = 0.02, 0.02 + LM; o = 0.12
    ax.plot([xc + sg * (a * c + o * s), xc + sg * (b * c + o * s)], [L['zb'] + LH - a * s + o * c, L['zb'] + LH - b * s + o * c], color=col, lw=3.2, solid_capstyle='butt')
    for u in (0.54, LM - 0.54): ax.plot([xc + sg * ((a + u) * c + 0.05 * s)], [L['zb'] + LH - (a + u) * s + 0.05 * c], marker='s', ms=2.2, color='#7f8a90')
for cc in C:
    if abs(cc['y'] - 49.281) > 0.01 or not (xc - 5.2 < cc['xa'] and cc['xb'] < xc + 5.2): continue
    za, zb = np.interp([cc['xa'], cc['xb']], px, pz); ax.plot([cc['xa'], cc['xb']], [za + 0.15, zb + 0.15], color=ROOF, lw=2.2, solid_capstyle='butt')
ax.annotate('', xy=(L['x0'], L['zb'] + LH + 0.35), xytext=(L['x1'], L['zb'] + LH + 0.35), arrowprops=dict(arrowstyle='<->', lw=0.6, color=INK))
ax.text(xc, L['zb'] + LH + 0.42, 'ліхтар 3,40 × 1,74 м (РП) · схил 2,43 м', ha='center', fontsize=6.6)
ax.text(xc + 1.35, L['zb'] + 1.15, f"схід {nf(K['geo'][1]['tilt'], 0)}°: книжково,\n2 384 мм + 20 мм біля гребеня,\nвнизу лишається 29 мм", fontsize=6.2, color=PE)
ax.text(xc - 1.35, L['zb'] + 1.15, f"захід {nf(K['geo'][1]['tilt'], 0)}°", fontsize=6.2, color=PW, ha='right')
ax.text(xc - 5.1, L['zb'] + LH + 0.4, f"{K['places']} місць · {K['n']} у стрінгах · {nf(K['mwh'], 1)} МВт·год\nтінь на модулі даху −{nf(K['roof_loss'], 1)} МВт·год", fontsize=6.4, va='top', color=INK)
ax.text(xc - 5.1, 16.75, 'Розріз через ліхтар 2, справжній масштаб. Модулі 0,12 м над схилом ліхтаря, рейки уздовж ліхтаря (сірі квадрати), притиски на 540 мм від кінців. Темно-сині — модулі даху (відступ від ліхтаря ≥ 0,27 м).', fontsize=5.8, color=MUT)
ax.set_aspect('equal'); ax.set_xlim(xc - 5.2, xc + 5.2); ax.set_ylim(16.65, L['zb'] + LH + 0.6); ax.axis('off')
ax.set_title('Модулі книжково рівно по схилах ліхтаря: не вище ліхтаря, зверху сходяться біля гребеня', fontsize=8, loc='left', color=INK, weight='bold')
fig.tight_layout(); fig.savefig(D + 'lan_flush34_sec_v2.png', bbox_inches='tight'); plt.close(fig); print('ok')
