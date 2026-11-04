import json, math, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 8})
D = '/home/claude/work/sun/v2/'; G = json.load(open(D + 'lan_flush_v2.json')); F = json.load(open(D + 'final_v2.json'))
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
INK, MUT, PE, PW, ROOF = '#1d2a33', '#5b6770', '#2f6fdb', '#7a3fa0', '#22345f'
FAC = F['FAC']; pts = sorted({(p['x0'], p['z0']) for p in FAC} | {(p['x1'], p['z1']) for p in FAC}); px = [p[0] for p in pts]; pz = [p[1] for p in pts]
L = G['LAN'][1]; xc = (L['x0'] + L['x1']) / 2; hw = (L['x1'] - L['x0']) / 2; LM, DM = 2.384, 1.303
fig, axs = plt.subplots(1, 2, figsize=(9.4, 3.0), dpi=170)
for ax, LH in zip(axs, (1.5, 2.0)):
    K = G[f'{LH:.1f}']['K']; th = math.atan2(LH, hw); c, s = math.cos(th), math.sin(th); por = K['geo'][1]['por']; A = LM if por else DM
    xs = np.linspace(xc - 4.2, xc + 4.2, 200); zs = np.interp(xs, px, pz)
    ax.fill_between(xs, zs - 0.35, zs, color='#c4ccd3', lw=0); ax.plot(xs, zs, color=INK, lw=0.8)
    ax.add_patch(Polygon([(L['x0'], L['zb']), (xc, L['zb'] + LH), (L['x1'], L['zb'])], closed=True, facecolor='#cfe0ea', edgecolor='#8fa9b8', lw=0.7))
    ax.plot([L['x1'], L['x1']], [float(np.interp(L['x1'], px, pz)), L['zb']], color='#8fa9b8', lw=0.7)
    for sg, col in ((1, PE), (-1, PW)):
        a, b = 0.03, 0.03 + A; o = 0.12
        ax.plot([xc + sg * (a * c + o * s), xc + sg * (b * c + o * s)], [L['zb'] + LH - a * s + o * c, L['zb'] + LH - b * s + o * c], color=col, lw=3.0, solid_capstyle='butt')
    for xa, xb, y, st, kwh, loss, tilt, face, sp in F['mods']:
        if st != 'ok' or abs(y - 49.281) > 0.01 or not (xc - 4.2 < xa and xb < xc + 4.2): continue
        za, zb = np.interp([xa, xb], px, pz); ax.plot([xa, xb], [za + 0.15, zb + 0.15], color=ROOF, lw=2.0, solid_capstyle='butt')
    t = (f"гребінь {nf(LH, 1)} м → схил {nf(K['geo'][1]['Ls'], 2)} м, {nf(K['geo'][1]['tilt'], 0)}°\n" +
         (f"книжково: 2 384 мм уміщується" if por else f"книжково не влазить (2 384 > {nf(K['geo'][1]['Ls'] * 1000)} мм) →\nальбомно, 1 303 мм по схилу; низ схилу {nf(K['geo'][1]['free'], 2)} м відкритий"))
    ax.text(xc - 4.1, L['zb'] + 2.35, t, fontsize=6.3, va='top', color=INK)
    ax.text(xc + 4.1, L['zb'] + 2.35, f"{K['places']} місць · {K['n']} у стрінгах\n{nf(K['mwh'], 1)} МВт·год · тінь на дах −{nf(K['roof_loss'], 1)}", fontsize=6.3, va='top', ha='right', color=INK)
    ax.set_aspect('equal'); ax.set_xlim(xc - 4.2, xc + 4.2); ax.set_ylim(16.9, L['zb'] + 2.45); ax.axis('off')
    ax.set_title(f"Ліхтар з гребенем {nf(LH, 1)} м" + (' (оцінка за фото)' if LH == 1.5 else ''), fontsize=7.6, loc='left', color=INK, weight='bold')
fig.text(0.01, 0.0, 'Розріз через ліхтар 2, справжній масштаб. Модулі (синій — схід, фіолетовий — захід) лежать на схилах ліхтаря, 0,12 м над ним, не вище гребеня. Темно-сині — модулі даху.', fontsize=5.9, color=MUT)
fig.tight_layout(); fig.savefig(D + 'lan_flush_sec_v2.png', bbox_inches='tight'); plt.close(fig); print('ok')
