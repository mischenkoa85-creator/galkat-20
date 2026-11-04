import json, math, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 8})
D = '/home/claude/work/sun/v2/'; G = json.load(open(D + 'lan_v2.json')); F = json.load(open(D + 'final_v2.json'))
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
INK, MUT, PE, PW, ROOF = '#1d2a33', '#5b6770', '#2f6fdb', '#7a3fa0', '#22345f'
FAC = F['FAC']; pts = sorted({(p['x0'], p['z0']) for p in FAC} | {(p['x1'], p['z1']) for p in FAC}); px = [p[0] for p in pts]; pz = [p[1] for p in pts]
L = G['LAN'][1]; xc = (L['x0'] + L['x1']) / 2; K = G['0.10']['K']; th = math.radians(K['tilt']); LM = 2.384
fig, ax = plt.subplots(figsize=(9.4, 3.9), dpi=170)
xs = np.linspace(xc - 7.5, xc + 7.5, 300); zs = np.interp(xs, px, pz)
ax.fill_between(xs, zs - 0.45, zs, color='#c4ccd3', lw=0); ax.plot(xs, zs, color=INK, lw=0.8)
ax.add_patch(Polygon([(L['x0'], float(np.interp(L['x0'], px, pz))), (xc, L['zb'] + 1.5), (L['x1'], float(np.interp(L['x1'], px, pz)))], closed=True, facecolor='#cfe0ea', edgecolor='#8fa9b8', lw=0.7, ls='--'))
ax.text(xc, L['zb'] + 0.45, 'ліхтар\n(гребінь ≈1,5 м — оцінка)', ha='center', fontsize=6, color='#5f7f92')
zlo = L['zb'] + 0.15; zr = zlo + LM * math.sin(th); hs = 1.435 + 0.10 - 0.01
for sg, col in ((1, PE), (-1, PW)):
    ax.plot([xc + sg * 0.01, xc + sg * (0.01 + LM * math.cos(th))], [zr, zr - LM * math.sin(th)], color=col, lw=3.2, solid_capstyle='butt')
    for u in (0.54, LM - 0.54): ax.add_patch(Rectangle((xc + sg * (0.01 + u * math.cos(th)) - 0.03, zr - u * math.sin(th) - 0.09), 0.06, 0.06, facecolor='#7f8a90', lw=0))
    xe = xc + sg * hs; ax.plot([xe, xe], [zlo, float(np.interp(xe, px, pz))], color='#7f8a90', lw=1.0)
for xa, xb, y, s, kwh, loss, tilt, face, sp in F['mods']:
    if s != 'ok' or abs(y - 49.281) > 0.01 or not (xc - 7.5 < xa and xb < xc + 7.5): continue
    za, zb = np.interp([xa, xb], px, pz); ax.plot([xa, xb], [za + 0.15, zb + 0.15], color=ROOF, lw=2.2, solid_capstyle='butt')
ax.annotate('', xy=(xc - hs - 0.01, zr + 0.25), xytext=(xc + hs + 0.01, zr + 0.25), arrowprops=dict(arrowstyle='<->', lw=0.6, color=INK))
ax.text(xc, zr + 0.32, f"{nf(K['width'], 2)} м — «домік» (ліхтар 2,87 м, винос по 0,10 м)", ha='center', va='bottom', fontsize=6.5)
ax.text(xc + 0.15, zr + 0.02, f"гребінь +{nf(zr, 2)} ({nf(zr - L['zb'], 2)} м над основою)", fontsize=6.3, va='bottom')
ax.text(xc + 1.25, zr - 1.0, f"схід {nf(K['tilt'], 0)}°: модуль книжково,\n2 384 мм по схилу, 2 рейки", fontsize=6.3, color=PE)
ax.text(xc - 1.25, zr - 1.0, f"захід {nf(K['tilt'], 0)}°", fontsize=6.3, color=PW, ha='right')
ax.text(L['x1'] + 0.35, float(np.interp(L['x1'], px, pz)) + 0.32, '0,19 м до модулів даху', fontsize=6, color=MUT)
ax.text(xc - 7.4, 15.25, 'Висоти від ±0,000 (креслення). Розріз через ліхтар 2 (осі 4–7), справжній масштаб. Стійки рами — по краях ліхтаря; схема, не КМ.', fontsize=6, color=MUT)
ax.set_aspect('equal'); ax.set_xlim(xc - 7.6, xc + 7.6); ax.set_ylim(15.1, 20.5); ax.axis('off')
ax.set_title('Модулі «доміком» над ліхтарем: два модулі книжково сходяться над гребенем', fontsize=8, loc='left', color=INK, weight='bold')
fig.tight_layout(); fig.savefig(D + 'lan_sec_v2.png', bbox_inches='tight'); plt.close(fig); print('ok')
