import json, math
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Patch
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 8})
D = '/home/claude/work/sun/v2/'; G = json.load(open(D + 'lan_v2.json')); F = json.load(open(D + 'final_v2.json'))
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
INK, MUT, PE, PW, ROOF, RED = '#1d2a33', '#5b6770', '#2f6fdb', '#7a3fa0', '#b9c3cf', '#b4461b'
K = G['0.10']['K']; M = G['0.10']['mods']; LAN = G['LAN']; th = math.radians(K['tilt']); LM = 2.384; pw = LM * math.cos(th)
keep = set()
for sd in 'EW':
    ms = sorted([m for m in M if m[1] == sd], key=lambda m: -m[3]); keep |= {(m[0], m[1], m[2]) for m in ms[:len(ms) // 11 * 11]}
fig, ax = plt.subplots(figsize=(9.4, 9.0), dpi=170)
ax.add_patch(Rectangle((-12.58, -0.5), 12.0, 97.09, facecolor='#e4e6e8', edgecolor='#9aa7b3', lw=0.5, hatch='////'))
ax.text(-6.6, 48, 'Західна будівля', rotation=90, ha='center', va='center', fontsize=6.6)
ax.add_patch(Rectangle((-0.58, -0.25), 97.38, 96.59, facecolor='#f6f7f8', edgecolor=INK, lw=0.8))
for xa, xb, y, s, kwh, loss, tilt, face, sp in F['mods']:
    if s == 'ok': ax.add_patch(Rectangle((xa + 0.03, y - 1.192), xb - xa - 0.06, 2.384, facecolor=ROOF, lw=0))
for L in LAN: ax.add_patch(Rectangle((L['x0'], L['y0']), L['x1'] - L['x0'], L['y1'] - L['y0'], facecolor='#cfe0ea', edgecolor='#8fa9b8', lw=0.5))
for l, sd, y, kwh, loss in M:
    L = LAN[l - 1]; xc = (L['x0'] + L['x1']) / 2; sg = 1 if sd == 'E' else -1; x0 = xc + (0.01 if sg > 0 else -0.01 - pw)
    if (l, sd, y) in keep: ax.add_patch(Rectangle((x0, y + 0.02), pw, 1.263, facecolor=PE if sg > 0 else PW, lw=0))
    else: ax.add_patch(Rectangle((x0 + 0.05, y + 0.07), pw - 0.1, 1.163, facecolor='none', edgecolor=RED, lw=0.6))
for i, L in enumerate(LAN):
    p = K['perlan'][i]; ax.text((L['x0'] + L['x1']) / 2, L['y1'] + 1.0, f"Л{i + 1}\n{p['n']} місць\n{nf(p['mwh'], 1)} МВт·год", ha='center', va='bottom', fontsize=6.2, color=INK)
ax.set_title(f"Модулі «доміком» на 4 ліхтарях: {K['n']} модулів = {K['st']} стрінги × 11 · {nf(K['kwp'], 1)} кВтп · {nf(K['mwh'], 1)} МВт·год за рік", fontsize=8.2, loc='left', color=INK, weight='bold')
H = [Patch(facecolor=PE, label=f"схил на схід, {K['tilt']:.0f}° ({nf(K['E'])} кВт·год/кВтп)".replace('.', ',')), Patch(facecolor=PW, label=f"схил на захід ({nf(K['W'])} кВт·год/кВтп)"),
     Patch(facecolor='none', edgecolor=RED, label='найслабші — під стрінги по 11'), Patch(facecolor=ROOF, label='модулі даху (1 936, розкладка 27.10)'),
     Patch(facecolor='#cfe0ea', edgecolor='#8fa9b8', label='ліхтарі')]
ax.legend(handles=H, loc='upper left', bbox_to_anchor=(0, -0.03), ncol=3, fontsize=6.3, frameon=False, handlelength=1.6, columnspacing=1.0)
ax.text(1.0, -0.02, 'Північ угорі, схід праворуч. Уздовж ліхтаря модулі книжково з кроком 1 325 мм.', transform=ax.transAxes, fontsize=6, color=MUT, ha='right', va='top')
ax.set_xlim(-13.5, 98); ax.set_ylim(-2, 100); ax.set_aspect('equal'); ax.tick_params(labelsize=6, length=2); ax.set_xticks(range(0, 100, 12)); ax.set_yticks(range(0, 100, 12))
for sp_ in ax.spines.values(): sp_.set_visible(False)
fig.tight_layout(); fig.savefig(D + 'lan_plan_v2.png', bbox_inches='tight'); plt.close(fig); print('ok', len(keep))
