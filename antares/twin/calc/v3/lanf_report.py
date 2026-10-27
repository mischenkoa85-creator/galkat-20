# -*- coding: utf-8 -*-
"""Звіт 27.10 (22:29): ліхтарі розібрати, модулі вертикально на каркасі 22° (і 13° для порівняння) — тіні на дах і на самі модулі → рисунки + PDF."""
import json, math, base64, asyncio, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon
from matplotlib.colors import Normalize, TwoSlopeNorm
V = '/home/claude/work/sun/v3/'
SH = json.load(open(V + 'shade_lan.json')); D = {t: json.load(open(V + f'lanf{t}.json')) for t in (22, 13)}
M22 = json.load(open(V + 'lan22_mount.json')); M13 = json.load(open(V + 'lan13_mount.json'))
B = json.load(open(V + 'lan22.json'))['modes']['base']['roof']['mwh']
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 7.2})
INK, MUT = '#1d2a33', '#5b6770'
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',').replace('-', '−')
LM, DM = 2.384, 1.303
lan = lambda key: SH['none']['mwh'] - SH[key]['mwh']
# ---------- 1. план: зміна генерації модулів даху (22° проти «як зараз») + модулі на ліхтарях
fig, ax = plt.subplots(figsize=(7.6, 6.0), dpi=220)
d = np.array(SH['t22']['per']) - np.array(SH['base']['per'])
nrm = TwoSlopeNorm(vmin=-5, vcenter=0, vmax=max(5, float(np.percentile(d, 99.5)))); cm = plt.get_cmap('RdBu')
for (xa, xb, y, f), v in zip(SH['xy'], d):
    if xa > 78: continue
    ax.add_patch(Rectangle((xa, y - LM / 2), xb - xa, LM, color=cm(nrm(v)), lw=0))
F = D[22]['F']; t = math.radians(22); ct = math.cos(t)
for f in F:
    ax.add_patch(Rectangle((f[0] - 1.83, f[1]), 3.66, f[2] - f[1], fill=False, ec='#8a6f4d', lw=0.5, ls='--'))
used = set(M22['used'])
for k, m in enumerate(M22['mods']):
    x0 = m['x'] - LM * ct / 2
    ax.add_patch(Rectangle((x0, m['y']), LM * ct, m['y1'] - m['y'], fc='#2a5db0' if k in used else '#ffffff', ec='white' if k in used else '#9aa3a8', lw=0.2, ls='-' if k in used else '--', alpha=0.9))
for i, f in enumerate(F): ax.text(f[0], f[2] + 1.0, f'Ліхтар {i + 1}', ha='center', fontsize=6.4, weight='bold', color=INK)
ax.set_xlim(-1, 78); ax.set_ylim(0, 82); ax.set_aspect('equal'); ax.set_xlabel('X, м (схід →)'); ax.set_ylabel('Y, м (північ ↑)')
sm = plt.cm.ScalarMappable(norm=nrm, cmap=cm); cb = fig.colorbar(sm, ax=ax, fraction=0.03, pad=0.02); cb.set_label('модулі даху: зміна, кВт·год за рік (каркас 22° проти «як зараз»)')
ax.set_title(f'Каркас 22°: {M22["n"]} модулів на місці ліхтарів (сині), порожні місця — пунктир;\nмодулі даху — зміна генерації проти «як зараз»', fontsize=7.4, loc='left', color=INK, weight='bold')
fig.tight_layout(); fig.savefig(V + 'lanf_plan.png'); plt.close(fig)
# ---------- 2. розріз: тінь від ліхтаря при низькому сонці (схід/захід, висота 15°)
fig, axs = plt.subplots(1, 3, figsize=(7.6, 2.4), dpi=220, sharey=True)
el = math.radians(15)
for ax, (name, h, w, mod) in zip(axs, (('Як зараз: ліхтар 3,66 × 1,89', 1.89, 1.83, None), ('Каркас 22°', D[22]['F'][0][5] - D[22]['F'][0][3] + 0.16, D[22]['hw'], 22), ('Каркас 13°', D[13]['F'][0][5] - D[13]['F'][0][3] + 0.16, D[13]['hw'], 13))):
    base = 0.30 if mod else 0.0
    if mod:
        ax.add_patch(Polygon([(-1.83, 0), (1.83, 0), (1.83, base + (w - 1.83) * math.tan(math.radians(mod))), (0, base + w * math.tan(math.radians(mod))), (-1.83, base + (w - 1.83) * math.tan(math.radians(mod)))], fc='#6f777c', ec=INK, lw=0.4))
        for sg in (-1, 1): ax.plot([0, sg * w], [h, h - w * math.tan(math.radians(mod))], color='#2a5db0', lw=2.4, solid_capstyle='butt')
        top = h; edge = h - w * math.tan(math.radians(mod)); half = w
    else:
        ax.add_patch(Polygon([(-1.83, 0), (1.83, 0), (0, h)], fc='#e6ebe2', ec=INK, lw=0.4)); top = h; half = 1.83; edge = 0
    sh = top / math.tan(el)          # довжина тіні від гребеня по покрівлі (пласка апроксимація)
    ax.add_patch(Rectangle((half, 0), sh - half, 0.06, color='#b4461b')); ax.plot([0, sh], [top, 0], color='#d08a1a', lw=0.6, ls='--')
    ax.text(0, -0.55, name, ha='center', fontsize=6.4, color=INK); ax.text((half + sh) / 2, 0.15, f'тінь {nf(sh - half, 1)} м', ha='center', fontsize=6.0, color='#b4461b')
    ax.axhline(0, color=INK, lw=0.6); ax.set_xlim(-3, 8.5); ax.set_ylim(-0.8, 2.3); ax.set_aspect('equal'); ax.axis('off')
fig.suptitle('Тінь від гребеня на покрівлю при сонці на висоті 15° (ранок / вечір, схід або захід) — без урахування ухилу граней арки', fontsize=7, color=MUT, x=0.01, ha='left')
fig.tight_layout(); fig.savefig(V + 'lanf_sec.png'); plt.close(fig)
# ---------- HTML
k22, k13 = D[22]['K'], D[13]['K']
tot = lambda k: k['roof'] + k['mwh']
img = lambda f: 'data:image/png;base64,' + base64.b64encode(open(V + f, 'rb').read()).decode()
gain = d[d > 0.5]; ng = len(gain); nl = int((d < -0.5).sum())
rows = [('Гребінь каркаса над основою ліхтаря', '1,89 м', nf(D[22]['F'][0][5] - D[22]['F'][0][3], 2) + ' м', nf(D[13]['F'][0][5] - D[13]['F'][0][3], 2) + ' м'),
        ('Ширина по модулях (виступ за край ліхтаря)', '3,66 м', f"{nf(2 * M22['edge'], 2)} м (+{nf(M22['edge'] - 1.83, 2)})", f"{nf(2 * M13['edge'], 2)} м (+{nf(M13['edge'] - 1.83, 2)})"),
        ('Модулів на місці ліхтарів = стрінгів', '—', f"{k22['n']} = {k22['st']}", f"{k13['n']} = {k13['st']}"),
        ('Вони дають, МВт·год за рік (кВт·год/кВтп)', '—', f"<b>{nf(k22['mwh'], 1)}</b> ({k22['y']})", f"<b>{nf(k13['mwh'], 1)}</b> ({k13['y']})"),
        ('Тінь на самих цих модулях', '—', f"−{nf((1 - k22['mwh'] / k22['un']) * 100, 1)} %", f"−{nf((1 - k13['mwh'] / k13['un']) * 100, 1)} %"),
        ('Тінь від ліхтарів на модулі даху, МВт·год за рік', f"−{nf(lan('base'), 1)}", f"−{nf(lan('t22'), 1)} (на {nf((1 - lan('t22') / lan('base')) * 100)} % менше)", f"−{nf(lan('t13'), 1)} (на {nf((1 - lan('t13') / lan('base')) * 100)} % менше)"),
        ('Дах цеху, 1 639 модулів, МВт·год (стрінги)', nf(B, 1), f"{nf(k22['roof'], 1)} (+{nf(k22['roof'] - B, 1)})", f"{nf(k13['roof'], 1)} (+{nf(k13['roof'] - B, 1)})"),
        ('<b>Дах + ліхтарі</b>', f'1 639 · {nf(B, 1)}', f"1 936 · <b>{nf(tot(k22), 1)}</b>", f"1 936 · <b>{nf(tot(k13), 1)}</b>"),
        ('Нова покрівля прорізу', '—', f"≈{nf(D[22]['cost']['area'])} м²", f"≈{nf(D[13]['cost']['area'])} м²")]
TR = ''.join(f"<tr{' class=sel' if i == 7 else ''}><td>{a}</td><td class=n>{b}</td><td class=n>{c}</td><td class=n>{e}</td></tr>" for i, (a, b, c, e) in enumerate(rows))
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Ліхтарі 22° — тіні</title><style>
@page {{ size:A4; margin:12mm 13mm 13mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.2pt; line-height:1.38; color:#1d2a33; margin:0; }}
h1 {{ font-size:13.5pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.3pt; margin:3.2mm 0 1.4mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:7.8pt; margin-bottom:3mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.6mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:14.5pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.3pt; color:#5b6770; }}
.key {{ background:#eef4fb; border:0.6pt solid #b9cde4; padding:2.4mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2mm 4mm; border-radius:1.5mm; margin-bottom:2mm; font-size:7.8pt; }} .warn ol {{ margin:0; }}
table {{ border-collapse:collapse; width:100%; font-size:7.3pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:0.9mm 1.4mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; }} img {{ width:100%; display:block; }} .src {{ font-size:7pt; color:#5b6770; }}
</style></head><body>
<h1>Антарес — ліхтарі розібрати, модулі на каркасі 22°: тіні на дах і на модулі</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 22:29: «перерахувати тіні, якщо кладемо замість ліхтаря на 22°; чи зникне затінення; 3D-модель з усіма факторами»</div>
<div class="tiles"><div class="tile"><div class="v">{k22['n']}</div><div class="k">модулів на каркасі 22° = {k22['st']} стрінги × 11, {nf(k22['kwp'], 1)} кВтп</div></div>
<div class="tile"><div class="v">{nf(k22['mwh'], 1)}</div><div class="k">МВт·год за рік з цих модулів ({k22['y']} кВт·год/кВтп)</div></div>
<div class="tile"><div class="v">−{nf((1 - lan('t22') / lan('base')) * 100)} %</div><div class="k">тіні від ліхтарів на модулі даху: {nf(lan('base'), 1)} → {nf(lan('t22'), 1)} МВт·год за рік</div></div>
<div class="tile"><div class="v">{nf(tot(k22), 1)}</div><div class="k">МВт·год: дах + ліхтарі (зараз — {nf(B, 1)})</div></div></div>
<div class="key"><b>Чи зникне затінення? Не повністю — меншає на третину.</b><ul>
<li>Зараз ліхтар (гребінь 1,89 м) забирає в модулів даху {nf(lan('base'), 1)} МВт·год за рік. На каркасі 22° гребінь нижчий — 1,2 м (з модулями ≈1,36 м), але ліхтар з модулями ширший на {nf(2 * (M22['edge'] - 1.83), 1)} м: тінь {nf(lan('t22'), 1)} МВт·год. Дах отримує +{nf(k22['roof'] - B, 1)} МВт·год (у стрінгах), модулі між ліхтарями додають до {nf(float(d.max()))} кВт·год за рік кожен; {nl} модулів біля торців ліхтарів трохи втрачають (до {nf(float(d.min()), 1)}) — ліхтар з модулями ширший.</li>
<li>Решта тіні на даху — {nf(SH['base']['un'] - SH['none']['mwh'], 1)} МВт·год за рік — від західної будівлі, дефлекторів, парапетів, рами кондиціонерів і сусідніх граней арки; вона від ліхтарів не залежить.</li>
<li>Самі модулі на каркасі майже не в тіні: −{nf((1 - k22['mwh'] / k22['un']) * 100, 1)} %.</li>
<li>Каркас 13° дає на {nf(tot(k13) - tot(k22), 1)} МВт·год за рік більше: схили дивляться на схід і захід, і що положистіше — то більше сонця опівдні, а тінь на дах менша. Кут вирішує каркас, який є: виміряти рівнем.</li></ul></div>
<h2>Порівняння</h2>
<table><tr><th style="width:40%"></th><th class=n>Ліхтарі як зараз</th><th class=n>Каркас 22°</th><th class=n>Каркас 13°</th></tr>{TR}</table>
<img src="{img('lanf_sec.png')}">
<p class="src">Тінь на дах — сума по 1 639 модулях даху (варіант А) без втрат на різну освітленість, ті самі місця в усіх варіантах: зараз {nf(SH['base']['mwh'], 1)}, каркас 22° — {nf(SH['t22']['mwh'], 1)}, 13° — {nf(SH['t13']['mwh'], 1)}, без ліхтарів зовсім — {nf(SH['none']['mwh'], 1)}, без жодних тіней — {nf(SH['base']['un'], 1)} МВт·год. Модель — та сама, що v3 (Meteonorm 8.1, крок 10 хв, DSM 0,25 м, горизонт 72 напрями, U 20, втрати 13,2 %, стрінги з моделлю байпас-діодів). Карниз каркаса — 0,30 м над покрівлею (оцінка).</p>
<h2>План: що змінюється на даху</h2>
<img src="{img('lanf_plan.png')}" style="width:96%;margin:0 auto">
<p>Розкладка на каркасі 22° — та сама, що 13°: вертикально, 1 ряд на схил, 2 рейки вздовж ліхтаря в зоні притисків ZNSHINE (на {nf(M22['rail_up'], 2)} і {nf(M22['rail_lo'], 2)} м від осі), стрінг — 11 сусідніх модулів одного схилу одного ліхтаря, без кабелів між ліхтарями; порожніх місць — {M22['places'] - M22['n']}. Кошторис під ключ 27.10 — однаковий (рейки {nf(M22['rail_m'], 1)} м, притисків {M22['clamps_mid'] + M22['clamps_end']}); нова покрівля прорізу при 22° — ≈{nf(D[22]['cost']['area'])} м² (при 13° — ≈{nf(D[13]['cost']['area'])}).</p>
<p><b>3D-двійник</b> (приватна версія і GitHub): «Загальне» → «Ліхтарі → каркас 22° · +297» / «каркас 13°» / «На склі ліхтарів». У «Сонці» — живі тіні від нової форми ліхтаря на модулі даху і на модулі каркаса, «Тінь за рік» — річна тінь кожного модуля даху для вибраного кута, рік станції — з цим сценарієм.</p>
<div class="warn"><b>Немає в даних</b><ol><li>Кут і проліт каркаса, висота бічних балок над покрівлею (прийнято карниз 0,30 м) — рівень і рулетка біля відкритого торця.</li>
<li>Ціна розбирання скління і нової покрівлі прорізу; денне світло в цеху після ліхтарів.</li></ol></div>
</body></html>'''
open(V + 'lanf.html', 'w', encoding='utf-8').write(H)
OUT = V + 'Розрахунок_тіней_ліхтарі_розібрати_модулі_на_каркасі_22°_і_13°_Антарес_27.10.2026.pdf'
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + V + 'lanf.html'); await pg.wait_for_timeout(500)
        await pg.pdf(path=OUT, format='A4', print_background=True, prefer_css_page_size=True); await b.close()
asyncio.run(main()); print(OUT)
