# -*- coding: utf-8 -*-
"""Звіт 28.10: ліхтарі розібрати (скління 46°), лишити каркас 12–13° на бортику 0,30–0,40 м (власник, разом з руберойдом) → модулі вертикально.
Дані — res_*.json (lan22.py V1 і lan13_mount.py з CURB 0,30/0,35/0,40 і TILT 12/13; труби — 11 за фото 28.10), lan_base28.json (як зараз)."""
import json, math, base64, asyncio, sys
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle, FancyArrowPatch
sys.path.insert(0, '/tmp/claude-0/-home-claude/48137fe6-4c58-5aa6-90c7-d55006f4596f/scratchpad/roofdr')
import roofobj as R
V = '/home/claude/work/sun/v3/'
OUT = '/home/claude/out/roof/Розрахунок_ліхтарі_розібрати_каркас_12–13°_бортик_300–400_мм_Антарес_28.10.2026.pdf'
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',').replace('-', '−')
BASE = json.load(open(V + 'lan_base28.json'))['modes']['base']['roof']
ROWS = []
for T in (12, 13):
    for C in ('0.30', '0.35', '0.40'):
        m = json.load(open(V + f'res_mount_t{T}_c{C}.json')); r = json.load(open(V + f'res_lan22_t{T}_c{C}.json'))['modes']['V1']['roof']
        ROWS.append(dict(T=T, C=float(C), n=m['n'], st=m['st'], kwp=m['kwp'], lan=m['mwh'], y=m['y'], roof=r['mwh'], rn=r['n']))
M13 = json.load(open(V + 'res_mount_t13_c0.35.json'))
# ---------- рисунок: переріз ліхтаря 2 (типовий), що лишається і що прибрати
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 7.4})
INK, MUT, RED, GRN, BLU = '#1d2a33', '#5b6770', '#c0392b', '#1e8a3c', '#2a5db0'
F = R.FRAMES[1]; xc = F['xc']; zb = F['zb']; c = 0.35; t = math.radians(13); hw = 1.5; LM = 2.384
fig, ax = plt.subplots(figsize=(7.4, 3.6), dpi=220)
xs = [xc + d / 20 for d in range(-70, 101)]
ax.fill_between([x - xc for x in xs], [R.roofZ(x) - 0.25 for x in xs], [R.roofZ(x) for x in xs], color='#d9dde1', lw=0)
ax.plot([x - xc for x in xs], [R.roofZ(x) for x in xs], color=INK, lw=1.0)
# демонтоване скління (за рулеткою: низ 3,66, гребінь 1,89 над покрівлею)
apex = zb + 1.89
for s in (-1, 1): ax.plot([s * 1.83, 0], [zb + 0.30, apex], color=RED, lw=1.1, ls=(0, (4, 2)))
ax.text(-1.05, apex - 0.35, 'скління ≈42–46° —\nприбрати', color=RED, ha='right', fontsize=7)
ax.plot([0], [apex], marker='v', color=RED, ms=3); ax.text(0.08, apex + 0.03, '+1,89 (рулетка, було)', color=RED, fontsize=6.6, va='bottom')
# бортик 0,30–0,40 з руберойдом
for s in (-1, 1):
    x0 = s * 1.83 - (0.18 if s > 0 else 0)
    zr = R.roofZ(xc + s * 1.83)
    ax.add_patch(Rectangle((x0, zr), 0.18, zb + c - zr, fc='#bfe3c6', ec=GRN, lw=0.9, hatch='////'))
ax.plot([-1.83, 1.83], [zb + c, zb + c], color=GRN, lw=1.4)
# каркас: кутники 13° і центральний профіль
for s in (-1, 1): ax.plot([s * hw, 0], [zb + c, zb + c + hw * math.tan(t)], color=GRN, lw=2.2, solid_capstyle='butt')
ax.add_patch(Rectangle((-0.06, zb + c + hw * math.tan(t) - 0.12), 0.12, 0.12, fc=GRN, ec=GRN))
# модулі вертикально, 1 ряд на схил, на 2 рейках
off = 0.155; zr0 = zb + c + hw * math.tan(t) + off
for s in (-1, 1):
    u0, u1 = 0.02, 0.02 + LM
    ax.plot([s * u0 * math.cos(t), s * u1 * math.cos(t)], [zr0 - u0 * math.sin(t), zr0 - u1 * math.sin(t)], color=BLU, lw=3.2, solid_capstyle='butt', alpha=0.85)
    for u in (0.02 + 0.54, 0.02 + LM - 0.54):
        x = s * u * math.cos(t); z = zr0 - u * math.sin(t)
        ax.plot([x], [z - 0.07], marker='s', ms=3.2, color=INK)
        zf = zb + c + (hw - min(abs(x), hw)) * math.tan(t) if abs(x) <= hw else None
        if zf is None: ax.plot([x, x], [z - 0.1, zb + c], color=INK, lw=0.8)
ax.text(-3.45, zb + 0.8, 'модулі книжково,\n2 384 мм по схилу', color=BLU, fontsize=7, ha='left', va='bottom')
# розміри
def dim(x0, x1, z, txt, dz=0.06):
    ax.annotate('', xy=(x0, z), xytext=(x1, z), arrowprops=dict(arrowstyle='<|-|>', lw=0.5, color=INK, mutation_scale=5, shrinkA=0, shrinkB=0))
    ax.text((x0 + x1) / 2, z + dz, txt, ha='center', va='bottom', fontsize=6.8)
dim(-1.83, 1.83, zb - 0.62, '3 660 — низ ліхтаря / бортик (рулетка)', dz=-0.17)
ax.annotate('', xy=(2.6, R.roofZ(xc + 1.83)), xytext=(2.6, zb + c), arrowprops=dict(arrowstyle='<|-|>', lw=0.5, color=GRN, mutation_scale=5, shrinkA=0, shrinkB=0))
ax.plot([1.83, 2.65], [zb + c, zb + c], color=GRN, lw=0.4, ls=':'); ax.text(2.7, (zb + c + R.roofZ(xc + 1.83)) / 2 + 0.05, 'бортик з руберойдом\n0,30–0,40 м (власник)\nзі сходу покрівля нижча\nще на 0,28 м', color=GRN, fontsize=6.6, va='center')
ax.text(0, zb + c - 0.08, 'каркас 3 000 (власник): профіль і кутники 12–13°', color=GRN, fontsize=6.8, ha='center', va='top')
ax.text(-3.4, R.roofZ(xc - 3.4) + 0.1, 'захід', color=MUT); ax.text(4.9, R.roofZ(xc + 4.9) + 0.1, 'схід', color=MUT, ha='right')
ax.set_xlim(-3.5, 5.0); ax.set_ylim(zb - 1.05, apex + 0.3); ax.set_aspect('equal'); ax.axis('off')
ax.set_title('Переріз ліхтаря (типовий, Л2–Л4): зелене лишається, червоне — прибрати, синє — модулі', fontsize=8, color=INK, loc='left')
fig.tight_layout(); fig.savefig(V + 'curb_sec.png'); plt.close(fig)
img = base64.b64encode(open(V + 'curb_sec.png', 'rb').read()).decode()
def row(r):
    tot = r['roof'] + r['lan']
    return (f"<tr><td>Каркас {r['T']}°, бортик {nf(r['C'], 2)} м</td><td>{r['n']} = {r['st']} стр.</td><td>{nf(r['kwp'], 1)}</td><td>{nf(r['lan'], 1)}</td>"
            f"<td>{nf(r['y'])}</td><td>{nf(r['roof'], 1)}</td><td><b>{nf(tot, 1)}</b></td><td>+{nf(tot - BASE['mwh'], 1)}</td></tr>")
lo = min(r['roof'] + r['lan'] for r in ROWS); hi = max(r['roof'] + r['lan'] for r in ROWS)
r30 = [r for r in ROWS if r['T'] == 13 and r['C'] == 0.30][0]; r40 = [r for r in ROWS if r['T'] == 13 and r['C'] == 0.40][0]
d_curb = (r40['roof'] + r40['lan']) - (r30['roof'] + r30['lan'])
html = f"""<!doctype html><html lang="uk"><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 14mm 14mm 14mm 16mm; }}
body {{ font-family: 'DejaVu Sans', sans-serif; font-size: 9.2pt; color: #1d2a33; line-height: 1.38; }}
h1 {{ font-size: 13.5pt; margin: 0 0 2mm; }} h2 {{ font-size: 10.5pt; margin: 4mm 0 1.5mm; }}
.sub {{ color: #5b6770; font-size: 8.4pt; margin-bottom: 3mm; }}
table {{ border-collapse: collapse; width: 100%; font-size: 8.4pt; margin: 1mm 0 2mm; }}
th, td {{ border: 0.5pt solid #c7cdd2; padding: 1.2mm 1.6mm; text-align: right; }} th {{ background: #eef1f3; font-weight: bold; }}
td:first-child, th:first-child {{ text-align: left; }} tr.base td {{ color: #5b6770; }}
ul {{ margin: 1mm 0 1mm 5mm; padding: 0; }} li {{ margin: 0.6mm 0; }} .note {{ color: #5b6770; font-size: 8.2pt; }}
.key {{ background: #f3f7f4; border-left: 3pt solid #1e8a3c; padding: 2mm 3mm; margin: 2mm 0; }}
</style></head><body>
<h1>Ліхтарі розібрати, лишити каркас 12–13° на бортику — розрахунок</h1>
<div class="sub">ТОВ МК «Антарес», дах цеху · 28.10.2026 · запит власника 10:20: прибрати скління 46°, лишити каркас 12–13° (зелене на фото 123334), бортик разом з руберойдом ≈300–400 мм</div>
<div class="key"><b>Висновок.</b> На каркаси 4 ліхтарів стає <b>{ROWS[0]['n']} модулів = {ROWS[0]['st']} стрінги по 11, {nf(ROWS[0]['kwp'], 1)} кВтп</b>, вони дають <b>≈{nf(r30['lan'])} МВт·год за рік</b>
({nf(min(r['y'] for r in ROWS))}–{nf(max(r['y'] for r in ROWS))} кВт·год/кВтп). Ліхтарі стають нижчими, тож модулі даху отримують ще +6…+9 МВт·год.
Дах і ліхтарі разом — <b>{nf(lo)}–{nf(hi)} МВт·год</b> проти {nf(BASE['mwh'], 1)} зараз. Висота бортика майже не впливає: 0,40 м замість 0,30 м — {nf(d_curb, 1)} МВт·год за рік ({nf(d_curb / (r30['roof'] + r30['lan']) * 100, 1)} %).</div>
<img src="data:image/png;base64,{img}" style="width:100%">
<h2>Генерація за рік, МВт·год</h2>
<table><tr><th>Варіант</th><th>Модулів на ліхтарях</th><th>кВтп</th><th>Модулі на ліхтарях</th><th>кВт·год/кВтп</th><th>Модулі даху ({BASE['n']})</th><th>Дах + ліхтарі</th><th>До «як зараз»</th></tr>
<tr class="base"><td>Як зараз: ліхтарі зі склінням, на них модулів немає</td><td>—</td><td>—</td><td>—</td><td>—</td><td>{nf(BASE['mwh'], 1)}</td><td>{nf(BASE['mwh'], 1)}</td><td>—</td></tr>
{''.join(row(r) for r in ROWS)}</table>
<div class="note">Модулі даху — розкладка А (вільні місця, стрінги по 11) з 11 трубами вентиляції за фото 28.10: {BASE['n']} модулів, {nf(BASE['kwp'], 1)} кВтп. 27.10 з трубами за знімком Google було 1 639 модулів і 1 092,9 МВт·год — тепер місць більше.
Модель та сама, що 27.10 (calc/v3, перевірка: з тим самим набором труб дає ті самі 1 639 модулів і 1 092,94 МВт·год).</div>
<h2>Що лишається і як ставити модулі</h2>
<ul>
<li>Бортик з руберойдом по контуру ліхтаря, 3,66 м по низу (рулетка), висота 0,30–0,40 м над покрівлею (власник). Зі сходу покрівля біля ліхтаря на 0,28 м нижча (розріз 1-1), там бортик відповідно вищий.</li>
<li>На бортику — сталевий каркас: центральний профіль і кутники 12–13° (фото зсередини 12,2° ± 0,5°), 3,0 м (власник); гребінь каркаса на 0,32–0,35 м вище бортика.</li>
<li>Модулі книжково, 1 ряд на схил, на 2 рейках уздовж ліхтаря: верхня — {nf(M13['rail_up'], 2)} м від осі, нижня — {nf(M13['rail_lo'], 2)} м, тобто якраз над бортиком (1,83 м): консоль від каркаса ≈{nf(M13['console'], 2)} м або опора на бортик. Край модуля — {nf(M13['edge'], 2)} м від осі.</li>
<li>Низ модулів ≈ на висоті бортика, гребінь модулів — на 0,5 м вище. Рейок {nf(M13['rail_m'])} м, притисків середніх {M13['clamps_mid']}, кінцевих {M13['clamps_end']}.</li>
<li>Стрінг — 11 сусідніх модулів одного схилу одного ліхтаря; залишок ліхтаря — спільний стрінг схід + захід; {M13['places'] - M13['n']} місць лишаються порожніми.</li>
</ul>
<h2>Що показують фото і креслення</h2>
<ul>
<li>Рулетка 27.10: гребінь ліхтаря 1,89 м над покрівлею (фото 111904, 111907), низ ліхтаря 3,66 м (111925).</li>
<li>Скління на фото зсередини — 41,5–43° від горизонталі, за кресленнями 46°. З низом 3,66 м і гребенем 1,89 м скління 42–46° дає бортик ≈0,29–0,34 м — збігається зі словами власника.</li>
<li>Розріз 1-1 (креслення замовника): верх ліхтаря +17,93 — на 0,27 м вище покрівлі із заходу і на 0,55 м зі сходу.</li>
<li>Сам бортик на фото закритий руберойдом (112124, 123334) — рулеткою його не міряли.</li>
</ul>
<h2>Немає в даних — виміряти</h2>
<ul class="note"><li>Висоту бортика рулеткою з обох боків ліхтаря (захід і схід) і його ширину по верху.</li>
<li>Крок і переріз кутників каркаса, на що вони спираються; перевірка каркаса під модулі, сніг і вітер.</li>
<li>Як закривати отвір ліхтаря під модулями (≈674 м²) і ціну розбирання скління — у кошторисі 27.10 цих робіт немає.</li></ul>
</body></html>"""
open(V + 'curb.html', 'w', encoding='utf-8').write(html)
async def pdf():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + V + 'curb.html'); await pg.wait_for_timeout(400)
        await pg.pdf(path=OUT, format='A4', print_background=True, prefer_css_page_size=True); await b.close()
asyncio.run(pdf()); print(OUT)
