import json, math, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, Patch
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 8})
D = 'calc/'; G = json.load(open(D + 'lantern_gable.json')); RF = json.load(open(D + 'roof_final.json'))
TW = 'src/'; d = open(TW + 'data.js', encoding='utf-8').read(); S = json.loads(d[d.find('{'):d.rfind('}') + 1])['site']
HV, FL, SP = S['HV'], S['FL'], S['spans']
def arch(X):
    X = min(96, max(0, X))
    for a, b, r in SP:
        if a <= X <= b:
            c = (a + b) / 2; h = (b - a) / 2 - FL; dd = X - c; return 0 if abs(dd) >= h else r * (1 - dd * dd / h / h)
    return 0
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
INK, MUT, PE, PW_, ROOF, LAN = '#1d2a33', '#5b6770', '#2f6fdb', '#7a3fa0', '#22345f', '#cfe0ea'
V = G['var']['flush45']; GT = V['T']; th = math.radians(GT['tilt']); LM = 2.384; A10 = G['var']['gable10']['T']
# ---------- 1. переріз через ліхтар 2
l = G['lans'][1]; xc = (l['x0'] + l['x1']) / 2; hw = 1.7; zb = max(arch(l['x0']), arch(l['x1'])); h = GT['h']
fig, ax = plt.subplots(figsize=(9.2, 3.4), dpi=170)
xs = np.linspace(xc - 6.5, xc + 6.5, 300); zs = np.array([arch(x) for x in xs])
ax.fill_between(xs, zs - 0.35, zs, color='#c4ccd3', lw=0); ax.plot(xs, zs, color=INK, lw=0.8)
ax.add_patch(Polygon([(l['x0'], arch(l['x0'])), (l['x0'], zb), (xc, zb + h), (l['x1'], zb), (l['x1'], arch(l['x1']))], closed=True, facecolor=LAN, edgecolor='#8fa9b8', lw=0.8))
ax.text(xc, zb + 0.45, 'ліхтар', ha='center', va='center', fontsize=6.4, color=INK)
c, sn = math.cos(th), math.sin(th); u0 = max(0.02, (hw / c - LM) / 2); off = 0.15 / c
for sg, col in ((1, PE), (-1, PW_)):
    pts = [(xc + sg * u * c, zb + h - u * sn + off) for u in (u0, u0 + LM)]
    ax.plot([p[0] for p in pts], [p[1] for p in pts], color=col, lw=3.2, solid_capstyle='butt')
    for u in (u0 + 0.54, u0 + LM - 0.54): ax.add_patch(Rectangle((xc + sg * u * c - 0.03, zb + h - u * sn + 0.02), 0.06, 0.08, facecolor='#7f8a90', lw=0))
# альтернатива: навіс 10° над гребенем (пунктир)
t10 = math.radians(10); hx = LM * math.cos(t10); zr = zb + h + 0.215
for sg in (1, -1): ax.plot([xc + sg * 0.01, xc + sg * (0.01 + hx)], [zr, zr - hx * math.tan(t10)], color='#9aa7b3', lw=1.0, ls=(0, (3, 2)))
ax.text(xc - hx - 0.1, zr - hx * math.tan(t10), 'для порівняння: навіс 10°\nнад гребенем (пунктир)', fontsize=5.8, color=MUT, ha='right', va='center')
RMc = sorted({(m[0], m[1]) for m in RF['mods'] if m[3] in ('old', 'new') and l['y0'] < m[2] < l['y1']})
for xa_, xb_ in RMc:
    if xc - 6.5 < xa_ and xb_ < xc + 6.5: ax.plot([xa_ + 0.03, xb_ - 0.03], [arch(xa_ + 0.03) + 0.12, arch(xb_ - 0.03) + 0.12], color=ROOF, lw=2.2, solid_capstyle='butt')
ax.text(xc + hw * 0.55 + 0.35, zb + h * 0.45 + 0.25, f"схил на схід ≈{nf(GT['tilt'], 0)}°:\nмодуль книжково на 2 рейках,\nнизом на 0,15 м над листом", fontsize=6.2, color=PE, va='bottom')
ax.text(xc - hw * 0.55 - 0.35, zb + h * 0.45 + 0.25, f"схил на захід ≈{nf(GT['tilt'], 0)}°", fontsize=6.2, color=PW_, va='bottom', ha='right')
ax.annotate('', xy=(l['x0'], arch(l['x0']) - 0.2), xytext=(l['x1'], arch(l['x0']) - 0.2), arrowprops=dict(arrowstyle='<->', lw=0.6, color=INK))
ax.text(xc, arch(l['x0']) - 0.27, '3,4 м', ha='center', va='top', fontsize=6.2)
ax.text(xc + 0.1, zb + h + 0.32, f"гребінь ліхтаря ≈{nf(h, 2)} м над покрівлею", fontsize=6.2, color=INK, va='bottom')
ax.text(xc + 4.6, arch(xc + 4.6) - 0.3, 'модулі даху', fontsize=6.2, color=ROOF, va='top')
ax.text(xc - 6.5, -0.95, 'Ліхтар — за кресленнями (ширина 3,4 м, висота 1,74 м → схили ≈46°); на фото 123924, 123951 схили ≈40–45°. Розміри й каркас ліхтаря не обміряні. Схема, не КМ.', fontsize=6.0, color=MUT)
ax.set_aspect('equal'); ax.set_xlim(xc - 6.6, xc + 6.6); ax.set_ylim(-1.1, 4.0); ax.axis('off')
ax.set_title(f"Переріз через ліхтар 2 (X {nf(l['x0'], 1)}–{nf(l['x1'], 1)} м): модулі на схилах ліхтаря «доміком»", fontsize=8, loc='left', color=INK, weight='bold')
fig.tight_layout(); fig.savefig(D + 'img/lan_sec.png', bbox_inches='tight'); plt.close(fig)
# ---------- 2. план: «доміки» і втрати модулів даху від їхньої тіні
RM = [m for m in RF['mods'] if m[3] in ('old', 'new')]; dR = np.array(V['dR']); ER0 = np.array([m[4] for m in RM], float); rel = dR / ER0 * 100
fig, ax = plt.subplots(figsize=(9.2, 8.6), dpi=170)
ax.add_patch(Rectangle((-0.15, -0.5), 96.79, 97.09, facecolor='#f6f7f8', edgecolor=INK, lw=0.8))
CL = [(0.5, '#d9dde1'), (1, '#f3c48a'), (1.5, '#e0782b'), (100, '#b4461b')]
for (xa, xb, y, s, kwh, loss), r in zip(RM, rel):
    col = next(c for t, c in CL if r < t); ax.add_patch(Rectangle((xa + 0.02, y - 1.192), xb - xa - 0.04, 2.384, facecolor=col, lw=0))
for li, ln in enumerate(G['lans']):
    xc = (ln['x0'] + ln['x1']) / 2; ax.add_patch(Rectangle((ln['x0'], ln['y0']), ln['x1'] - ln['x0'], ln['y1'] - ln['y0'], facecolor='none', edgecolor='#8fa9b8', lw=0.6, ls=(0, (2, 1.5))))
    for lno, side, y, kwh, loss in V['mods']:
        if lno == li + 1:
            sg = 1 if side == 'E' else -1; xw = LM * math.cos(th); ax.add_patch(Rectangle((xc if sg > 0 else xc - xw, y), xw, 1.303, facecolor=PE if side == 'E' else PW_, lw=0))
    pl = GT['perlan'][li]; ax.text(xc, ln['y1'] + 1.2, f"Л{li + 1}: {pl['n']} мод.\n{nf(pl['mwh'], 1)} МВт·год", ha='center', va='bottom', fontsize=6.2, color=INK)
ax.add_patch(Rectangle((-12.15, -0.5), 12.0, 97.09, facecolor='#e4e6e8', edgecolor='#9aa7b3', lw=0.5, hatch='////')); ax.text(-6.15, 48, 'Західна будівля', rotation=90, ha='center', va='center', fontsize=6.6)
H = [Patch(facecolor=PE, label='модулі на ліхтарях: схил на схід'), Patch(facecolor=PW_, label='модулі на ліхтарях: схил на захід')] + \
    [Patch(facecolor=c, label=f'модулі даху: додаткова тінь {a}') for c, a in zip([c for _, c in CL], ['до 0,5 %', '0,5–1 %', '1–1,5 %', '1,5–2 %'])]
ax.legend(handles=H, loc='upper left', bbox_to_anchor=(0, -0.02), ncol=3, fontsize=6.4, frameon=False, handlelength=1.4)
ax.set_title(f"Модулі на схилах 4 ліхтарів: {GT['n']} місць, {nf(GT['mwh'], 1)} МВт·год; модулі даху втрачають {nf(GT['roof_loss'], 1)} МВт·год", fontsize=8, loc='left', color=INK, weight='bold')
ax.set_xlim(-13, 98); ax.set_ylim(-2, 100); ax.set_aspect('equal'); ax.tick_params(labelsize=6, length=2); ax.set_xticks(range(0, 100, 12)); ax.set_yticks(range(0, 100, 12))
for sp in ax.spines.values(): sp.set_visible(False)
fig.tight_layout(); fig.savefig(D + 'img/lan_plan.png', bbox_inches='tight'); plt.close(fig)
print('ok')
