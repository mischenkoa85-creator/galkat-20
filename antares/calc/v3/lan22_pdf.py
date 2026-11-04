# -*- coding: utf-8 -*-
"""Звіт «ліхтарі розібрати, каркас 22°: модулі горизонтально і вертикально» → PDF."""
import json, asyncio, base64, math
from playwright.async_api import async_playwright
V = '/home/claude/work/sun/v3/'
J = json.load(open(V + 'lan22.json')); M = J['modes']; VAL, COST = J['VAL'], J['COST']
s = open('/home/claude/work/twin/roofv2data.js', encoding='utf-8').read(); R2 = json.loads(s[s.find('{'):s.rfind('}') + 1]); K46 = R2['C']['flush']['K']
FACV = R2['fac']['tot']['all']; WH_N, WH_MWH = 176, 148.7
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',').replace('-', '−')
sg = lambda v, n=1: ('+' if v > 0 else '') + nf(v, n)
img = lambda f: 'data:image/png;base64,' + base64.b64encode(open(V + f, 'rb').read()).decode()
base = M['base']['roof']['mwh']; LEN = sum(f['y1'] - f['y0'] for f in M['base']['F'])
c22 = math.cos(math.radians(22))
rows = []
rows.append(dict(k='46', nm='Модулі на нинішніх ліхтарях, книжково по схилах 46° (v3)', n=K46['n'], st=K46['st'], kwp=K46['kwp'], mwh=K46['mwh'], y=K46['y'], dr=-K46['roof_loss'],
                 roof_m2=None, note='ліхтарі лишаються; модулі на полікарбонатних схилах — потрібен свій каркас'))
for md, nm in (('G1', 'Розібрати, каркас 22°, <b>горизонтально</b> (1 ряд на схил)'), ('V1', 'Розібрати, каркас 22°, <b>вертикально</b> (1 ряд на схил)'),
               ('G2', 'Довідково: 22°, горизонтально 2 ряди на схил')):
    L = M[md]['lan']; hw = M[md]['half']
    rows.append(dict(k=md, nm=nm, n=L['n'], st=L['st'], kwp=L['kwp'], mwh=L['mwh'], y=L['y'], dr=M[md]['roof']['mwh'] - base, roof_m2=2 * hw / c22 * LEN, width=2 * hw,
                     irrE=L['irrE'], irrW=L['irrW'], places=L['places'], drop=L['drop']))
for r in rows:
    r['add'] = r['mwh'] + r['dr']; r['cost'] = r['n'] * COST; r['rev'] = r['add'] * 1000 * VAL; r['pb'] = r['cost'] / r['rev']
    r['allow5'] = 5 * r['rev'] - r['cost']; r['per10k'] = 10000 / r['rev']
R = {r['k']: r for r in rows}; G1, V1, G2, K = R['G1'], R['V1'], R['G2'], R['46']
POLY = 2 * math.hypot(1.83, 1.89) * LEN; STRIP = 2 * (1.83 / c22 - 1.323) * LEN
TOT_V1_N = M['V1']['roof']['n'] + V1['n'] + FACV['n'] + WH_N; TOT_V1 = M['V1']['roof']['mwh'] + V1['mwh'] + FACV['kwh'] / 1000 + WH_MWH
def trow(r, cls=''):
    return (f"<tr class='{cls}'><td>{r['nm']}</td><td class='n'>{nf(r['n'])} = {r['st']}</td><td class='n'>{nf(r['kwp'], 1)}</td><td class='n'>{nf(r['mwh'], 1)}</td>"
            f"<td class='n'>{nf(r['y'])}</td><td class='n'>{sg(r['dr'])}</td><td class='n'><b>{sg(r['add'])}</b></td><td class='n'>{nf(r['cost'])}</td><td class='n'>{nf(r['pb'], 1)}</td></tr>")
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Ліхтарі під 22° — Антарес</title><style>
@page {{ size:A4; margin:12mm 13mm 13mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.3pt; line-height:1.38; color:#1d2a33; margin:0; }}
h1 {{ font-size:14pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.5pt; margin:3.5mm 0 1.5mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:8pt; margin-bottom:3mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.7mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:15pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.4pt; color:#5b6770; }}
.key {{ background:#eef4fb; border:0.6pt solid #b9cde4; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2mm 4mm; border-radius:1.5mm; margin-bottom:2mm; font-size:7.8pt; }} .warn ol {{ margin:0; }}
table {{ border-collapse:collapse; width:100%; font-size:7.5pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:0.8mm 1.4mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; font-variant-numeric:tabular-nums; }} td.n {{ white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; }} img {{ width:100%; display:block; }} .src {{ font-size:7.2pt; color:#5b6770; }}
</style></head><body>
<h1>Антарес — ліхтарі розібрати і покласти модулі на каркас 22°: горизонтально чи вертикально</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 17:09: «ліхтарі… фоткав усередині; якщо розберемо конструкцію і зробимо кут металоконструкцій — там приблизно 22°… порахувати розібрати ліхтарі й покласти туди панелі чи вертикально, чи горизонтально»</div>
<div class="tiles"><div class="tile"><div class="v">{nf(V1['n'])}</div><div class="k">модулів на 4 ліхтарях вертикально = {V1['st']} стрінги × 11</div></div>
<div class="tile"><div class="v">{nf(V1['mwh'], 1)}</div><div class="k">МВт·год за рік з ліхтарів ({nf(V1['y'])} кВт·год/кВтп)</div></div>
<div class="tile"><div class="v">{sg(V1['add'])}</div><div class="k">МВт·год разом до даху: ліхтарі + дах {sg(V1['dr'])} (ліхтар нижчий — менше тіні)</div></div>
<div class="tile"><div class="v">{sg(V1['add'] - K['add'])}</div><div class="k">МВт·год на рік більше, ніж модулі на нинішніх ліхтарях під 46°</div></div></div>
<div class="key"><b>Висновок: якщо ліхтарі розбирати — класти вертикально.</b><ul>
<li><b>Вертикально</b> (довга сторона вгору по схилу): {nf(V1['n'])} модулів, {nf(V1['mwh'], 1)} МВт·год — удвічі більше, ніж горизонтально, і на {nf(V1['add'] - K['add'], 1)} МВт·год/рік більше, ніж книжково на нинішніх ліхтарях під 46° ({nf(K['mwh'], 1)} МВт·год, {nf(K['y'])} кВт·год/кВтп). Кут 22° на схід і захід дає {nf(V1['y'])} кВт·год/кВтп — більше за середнє по даху (913). Каркас ширший за ліхтар: {nf(V1['width'], 2)} м проти 3,66 (виліт по 0,39 м), до модулів даху лишається ≥ 0,77 м — місць на даху не втрачаємо.</li>
<li><b>Горизонтально</b> (довга сторона вздовж ліхтаря): на схилі 22° шириною ліхтаря (1,97 м) вміщається лише 1 ряд — {nf(G1['n'])} модулів, {nf(G1['mwh'], 1)} МВт·год. Плюс — низ кожного схилу (0,65 м) вільний: його можна зробити з полікарбонату й лишити цеху ≈{nf(STRIP)} м² світла (зараз ≈{nf(POLY)} м²).</li>
<li>Обидва варіанти знижують ліхтар з 1,89 до 1,2–1,4 м над покрівлею — модулі даху (варіант А, 1 639 шт.) отримують {sg(G1['dr'])}…{sg(V1['dr'])} МВт·год/рік.</li>
<li>Окупність лише модулів — {nf(G1['pb'], 1)}–{nf(V1['pb'], 1)} р., але <b>без розбирання ліхтарів і нової покрівлі</b> над прорізом — їх вартості немає в даних. Щоб окупність не перевищила 5 років, розбирання + нова покрівля можуть коштувати до ≈{nf(V1['allow5'])} $ (вертикально, ≈{nf(V1['allow5'] / V1['roof_m2'])} $/м² нової покрівлі) або ≈{nf(G1['allow5'])} $ (горизонтально, ≈{nf(G1['allow5'] / G1['roof_m2'])} $/м²).</li></ul></div>
<h2>Варіанти (додаток до варіанта А на даху: 1 639 модулів, {nf(base, 1)} МВт·год)</h2>
<table><tr><th style="width:30%">Варіант</th><th class="n">На ліхтарях: модулів = стрінгів</th><th class="n">кВтп</th><th class="n">МВт·год з ліхтарів</th><th class="n">кВт·год/кВтп</th><th class="n">Зміна на даху, МВт·год</th><th class="n">Разом додається, МВт·год</th><th class="n">Модулі під ключ, $</th><th class="n">Окупність модулів, р.</th></tr>
{trow(K)}{trow(G1)}{trow(V1, 'sel')}{trow(G2)}</table>
<p class="src">Модулі ZNSHINE 730 Вт 2 384 × 1 303 мм. Ціна — ≈{nf(COST)} $ на модуль під ключ без ПДВ (частина СЕС кошторису 26.10, оцінка), 1 кВт·год — 7,00 грн з ПДВ (оцінка власника), ККД PCS 97,5 %, 44,89 грн/$. Окупність — без розбирання ліхтарів, нової покрівлі над прорізом, підсилення каркаса й освітлення цеху. Зміна на даху — та сама розкладка А, перерахована з новою формою ліхтаря.</p>
<table style="font-size:7pt"><tr><th style="width:52%">Деталі</th><th class="n">Горизонтально</th><th class="n">Вертикально</th><th class="n">Горизонтально 2 ряди</th></tr>
<tr><td>Ширина каркаса по низу, м</td><td class="n">{nf(G1['width'], 2)}</td><td class="n">{nf(V1['width'], 2)}</td><td class="n">{nf(G2['width'], 2)}</td></tr>
<tr><td>Гребінь з модулем над покрівлею, м (зараз 1,89)</td><td class="n">{nf(M['G1']['F'][0]['ridge'] + 0.16 - M['G1']['F'][0]['zb'], 2)}</td><td class="n">{nf(M['V1']['F'][0]['ridge'] + 0.16 - M['V1']['F'][0]['zb'], 2)}</td><td class="n">{nf(M['G2']['F'][0]['ridge'] + 0.16 - M['G2']['F'][0]['zb'], 2)}</td></tr>
<tr><td>Нова покрівля над прорізами (схили), м² · довжина ліхтарів {nf(LEN, 1)} м</td><td class="n">{nf(G1['roof_m2'])}</td><td class="n">{nf(V1['roof_m2'])}</td><td class="n">{nf(G2['roof_m2'])}</td></tr>
<tr><td>Місць на ліхтарях / поза стрінгами по 11</td><td class="n">{G1['places']} / {G1['drop']}</td><td class="n">{V1['places']} / {V1['drop']}</td><td class="n">{G2['places']} / {G2['drop']}</td></tr>
<tr><td>Опромінення схилу схід / захід, кВт·год/м²</td><td class="n">{nf(G1['irrE'])} / {nf(G1['irrW'])}</td><td class="n">{nf(V1['irrE'])} / {nf(V1['irrW'])}</td><td class="n">{nf(G2['irrE'])} / {nf(G2['irrW'])}</td></tr>
<tr><td>Від каркаса до найближчого модуля даху, м</td><td class="n">1,16</td><td class="n">0,77</td><td class="n">0,54</td></tr>
<tr><td>Розбирання + покрівля, щоб окупність ≤ 5 р., до $ (на м²)</td><td class="n">{nf(G1['allow5'])} ({nf(G1['allow5'] / G1['roof_m2'])})</td><td class="n">{nf(V1['allow5'])} ({nf(V1['allow5'] / V1['roof_m2'])})</td><td class="n">{nf(G2['allow5'])} ({nf(G2['allow5'] / G2['roof_m2'])})</td></tr>
<tr><td>Кожні 10 000 $ на розбирання й покрівлю додають до окупності, р.</td><td class="n">{nf(G1['per10k'], 2)}</td><td class="n">{nf(V1['per10k'], 2)}</td><td class="n">{nf(G2['per10k'], 2)}</td></tr></table>
<p>Уся станція з варіантом А на даху і вертикальними модулями на ліхтарях: дах {nf(M['V1']['roof']['n'])} + ліхтарі {V1['n']} + фасади {FACV['n']} + склад {WH_N} = <b>{nf(TOT_V1_N)} модулів, {nf(TOT_V1_N * 0.73, 1)} кВтп, ≈{nf(TOT_V1, 1)} МВт·год</b> на рік (фасади і склад — розрахунки 26–27.10).</p>
<h2>1. Розрізи: як зараз і як буде</h2>
<img src="{img('lan22_sec.png')}">
<h2>2. Модулі на ліхтарях: генерація кожного модуля</h2>
<img src="{img('lan22_plan.png')}">
<p>Західний схил ліхтаря 1 (найближчого до західної будівлі, +6,8 м над дахом) — у тіні після обіду: 860–880 кВт·год/кВтп; решта — 930–990. На ліхтарі 1 (коротший, 47,8 м) по 8 модулів на схилі горизонтально не добирають до стрінга з 11.</p>
<div class="warn"><b>Що прийнято без замірів і що треба з'ясувати до рішення</b><ol>
<li><b>Кут 22° і розміри внутрішнього каркаса</b> — зі слів власника (оглядав зсередини, фото 112235–112246); з фото кут не виміряти. Потрібно: проліт каркаса, крок ферм, висота над покрівлею, переріз. Ширина нинішнього ліхтаря по низу 3,66 м і гребінь 1,89 м — рулетка 27.10; довжина — за РП.</li>
<li><b>Несуча здатність</b> каркаса під модулі, рейки, сніг на 22° (сходить гірше, ніж з 46°) і вітер — потрібна перевірка КМ; для вертикального варіанта — консолі по 0,39 м за нинішній ліхтар.</li>
<li><b>Нова покрівля над прорізом</b> (сендвіч-панель або профлист з утепленням, примикання до покрівлі цеху), <b>розбирання й вивіз</b> полікарбонату й алюмінієвих рам — вартості немає в даних.</li>
<li><b>Денне світло</b>: зараз ≈{nf(POLY)} м² світлопрозорих схилів; вертикально і 2 ряди — світла не буде, горизонтально — ≈{nf(STRIP)} м² смуг, якщо низ схилів зробити світлопрозорим. Потреба в штучному освітленні цеху і його вартість — немає в даних.</li>
<li>Карниз нового каркаса прийнято на 0,30 м над покрівлею (висоти бортика ліхтаря немає в даних) — на генерацію впливає мало.</li>
<li>{V1['st']} нових стрінгів (вертикально) — стільки ж, скільки у варіанті 46°: перевірити вільні входи щитів PV і інверторів.</li></ol></div>
<p class="src">Розрахунок — та сама модель, що й v3 (27.10, вечір): клімат Meteonorm 8.1 з PVsyst РП (ясні й хмарні дні під місячні суми, крок 10 хв), цифрова модель висот 0,25 м з дефлекторами за супутником і РП, рамою кондиціонерів, парапетами 1,37 м, західною будівлею й АБК; горизонт у 72 напрямах для кожної третини модуля; U 20, втрати 13,2 %; стрінги по 11, різна освітленість у стрінгу — покроково (модель обхідних діодів). Перевірка: без змін ліхтарів модель дає ту саму розкладку А — 1 639 модулів, {nf(base, 1)} МВт·год. Скрипт — calc/v3/lan22.py.</p>
</body></html>'''
open(V + 'lan22.html', 'w', encoding='utf-8').write(H)
OUT = V + 'Розрахунок_варіанта_ліхтарі_розібрати_каркас_22°_модулі_горизонтально_і_вертикально_Антарес_27.10.2026.pdf'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + V + 'lan22.html'); await pg.wait_for_timeout(500)
        await pg.pdf(path=OUT, format='A4', print_background=True, prefer_css_page_size=True); await b.close()
asyncio.run(main())
json.dump(dict(rows=rows, poly=POLY, strip=STRIP, len=LEN, tot_v1=dict(n=TOT_V1_N, mwh=TOT_V1)), open(V + 'lan22_sum.json', 'w'), ensure_ascii=False, indent=1)
for r in rows: print(r['k'], r['n'], round(r['mwh'], 1), round(r['dr'], 2), round(r['add'], 1), round(r['pb'], 2), round(r['allow5']), r.get('roof_m2'))
print('POLY', round(POLY), 'STRIP', round(STRIP), 'TOT', TOT_V1_N, round(TOT_V1, 1)); print(OUT)
