# -*- coding: utf-8 -*-
"""Модулі книжково рівно по схилах ліхтаря 3,40 × 1,74 м (РП) — PDF (27.10.2026, запит 07:52)."""
import json, asyncio
from playwright.async_api import async_playwright
D = '/home/claude/work/sun/v2/'
G = json.load(open(D + 'lan_flush34_v2.json')); K = G['K']; g = K['geo'][1]
GG = json.load(open(D + 'lan_v2.json'))['0.10']['K']; FL = json.load(open(D + 'lan_flush_v2.json'))['1.5']['K']; B = json.load(open(D + 'final_v2.json'))['base']
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
tot = dict(n=K['roof_n'] + K['n'], st=K['roof_st'] + K['st'], kwp=round((K['roof_n'] + K['n']) * 0.73, 1), mwh=round(K['roof_base'] - K['roof_loss'] + K['mwh'], 1))
totG = dict(n=B['n'] + GG['n'], mwh=round(B['mwh'] - GG['roof_loss'] + GG['mwh'], 1)); totF = dict(n=B['n'] + FL['n'], mwh=round(B['mwh'] - FL['roof_loss'] + FL['mwh'], 1))
CT = (f"<tr class='sel'><td>Книжково по схилах ліхтаря</td><td>3,40 × 1,74 (РП)</td><td class='n'>{K['places']} / {K['n']}</td><td class='n'>{nf(K['mwh'], 1)}</td><td class='n'>−{nf(K['roof_loss'], 1)}</td><td class='n'>+{nf(K['net'], 1)}</td><td class='n'>{nf(K['roof_n'])}</td><td class='n'>{nf(tot['n'])}</td><td class='n'>{nf(tot['mwh'], 1)}</td></tr>"
      f"<tr><td>«Домік» над ліхтарем (07:29)</td><td>2,87 × 1,5 (розріз, оцінка)</td><td class='n'>{GG['places']} / {GG['n']}</td><td class='n'>{nf(GG['mwh'], 1)}</td><td class='n'>−{nf(GG['roof_loss'], 1)}</td><td class='n'>+{nf(GG['net'], 1)}</td><td class='n'>{nf(B['n'])}</td><td class='n'>{nf(totG['n'])}</td><td class='n'>{nf(totG['mwh'], 1)}</td></tr>"
      f"<tr><td>Альбомно по схилах (07:41)</td><td>2,87 × 1,5 (розріз, оцінка)</td><td class='n'>{FL['places']} / {FL['n']}</td><td class='n'>{nf(FL['mwh'], 1)}</td><td class='n'>−{nf(FL['roof_loss'], 1)}</td><td class='n'>+{nf(FL['net'], 1)}</td><td class='n'>{nf(B['n'])}</td><td class='n'>{nf(totF['n'])}</td><td class='n'>{nf(totF['mwh'], 1)}</td></tr>")
PT = ''.join(f"<tr><td>Л{p['no']}</td><td class='n'>{p['n'] // 2} + {p['n'] // 2}</td><td class='n'>{nf(p['E'], 1)} %</td><td class='n'>{nf(p['W'], 1)} %</td><td class='n'>{nf(p['kE'])} / {nf(p['kW'])}</td><td class='n'>{nf(p['mwh'], 1)}</td></tr>" for p in K['perlan'])
PT += f"<tr class='sel'><td>Разом</td><td class='n'>{K['places'] // 2} + {K['places'] // 2}</td><td></td><td></td><td class='n'>{nf(K['E'])} / {nf(K['W'])}</td><td class='n'>{nf(sum(p['mwh'] for p in K['perlan']), 1)}</td></tr>"
mo = K['mo']; ms = sum(mo); MN = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру']
MT = '<tr>' + ''.join(f'<th class="n">{m}</th>' for m in MN) + '</tr><tr>' + ''.join(f'<td class="n">{nf(v / ms * 100, 1)}</td>' for v in mo) + '</tr>'
light_jun = K['left'] * 268 * 150 / 625; light_dec = K['left'] * 50 * 150 / 625
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Модулі книжково по схилах ліхтарів — Антарес</title><style>
@page {{ size:A4; margin:12mm 13mm 14mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.1pt; line-height:1.33; color:#1d2a33; margin:0; }}
h1 {{ font-size:14pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.5pt; margin:3.5mm 0 1.5mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:8pt; margin-bottom:3.5mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.6mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:15pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.4pt; color:#5b6770; }}
.key {{ background:#f3f5f7; border:0.6pt solid #c4ccd3; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .warn ol, .warn ul {{ margin:0; }}
.two {{ display:grid; grid-template-columns:1.1fr 1fr; gap:4mm; }}
table {{ border-collapse:collapse; width:100%; font-size:7.5pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:1.1mm 1.4mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; font-variant-numeric:tabular-nums; }} td.n {{ white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; font-weight:700; }} img {{ width:100%; display:block; }} .src {{ font-size:7.2pt; color:#5b6770; }} .pb {{ break-before:page; }}
</style></head><body>
<h1>Антарес — модулі книжково рівно по схилах ліхтарів</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 07:52: «книжково він якраз ляже дуже добре». Ліхтар — за розмірами РП 3,40 × 1,74 м; центри ліхтарів і покрівля — розріз 1-1.</div>
<div class="tiles"><div class="tile"><div class="v">{K['n']}</div><div class="k">модулів = {K['st']} стрінги × 11 ({K['places']} місць на 4 ліхтарях)</div></div>
<div class="tile"><div class="v">{nf(K['mwh'], 1)}</div><div class="k">МВт·год за рік · {nf(K['y'])} кВт·год/кВтп · {nf(K['kwp'], 1)} кВтп</div></div>
<div class="tile"><div class="v">−{nf(K['roof_loss'], 1)}</div><div class="k">МВт·год тінь на модулі даху (у «доміку» −{nf(GG['roof_loss'], 1)})</div></div>
<div class="tile"><div class="v">+{nf(K['net'], 1)}</div><div class="k">МВт·год чистими</div></div></div>
<div class="key"><b>Коротко</b><ul>
<li><b>Так, книжково лягає.</b> За РП ліхтар 3,40 м завширшки і 1,74 м заввишки — схил {nf(g['Ls'], 2)} м під {nf(g['tilt'], 0)}°. Модуль 2 384 мм + 20 мм зазору біля гребеня → унизу лишається {nf(g['free'] * 1000)} мм. Низ модуля — на {nf(g['bot']['z'], 2)} м над основою ліхтаря і на {nf(g['bot']['x'], 2)} м за її краєм, верхні краї сходяться біля гребеня — нічого не вище ліхтаря.</li>
<li><b>Чому раніше не вміщалося:</b> о 07:41 я брав ширину 2,87 м з розрізу 1-1 і гребінь 1,5 м (оцінка) — схил 2,08 м. Можливо, 2,87 м на розрізі — отвір у плиті, а не сам ліхтар; центри ліхтарів на РП і на розрізі близькі, але розходяться на 0,03–0,46 м (креслення — «проработка»). Це не доведено — ліхтар треба обміряти.</li>
<li><b>Скільки:</b> уздовж ліхтаря крок 1 325 мм — Л1 по 36 на схил, Л2–Л4 по 41, разом {K['places']} місць. Стрінги по 11 окремо схід і захід — <b>{K['n']} модулів, {K['st']} стрінги</b>; {K['left']} поза стрінгами ({nf(K['left_mwh'], 1)} МВт·год за рік) — на освітлення під ліхтарем, як ви пропонували.</li>
<li><b>Тіні:</b> схили розходяться від гребеня — схід і захід один одного не затіняють. Схід втрачає 0,3–1,3 %, захід на Л2–Л4 — 1,8–4,2 % (західна будівля ввечері), західний схил Л1 — 17,8 %. Модулі даху: ліхтар росте лише на висоту рейки й модуля — −{nf(K['roof_loss'], 1)} МВт·год ({K['roof_hit']} модулів втрачають понад 5 кВт·год, найбільше {nf(K['roof_max'], 1)} %).</li>
<li><b>Краще за «домік»:</b> більше енергії, утричі менше тіні на дах, немає окремої рами над ліхтарем; вітер і сніг — як на самому ліхтарі.</li></ul></div>
<img src="lan_flush34_sec_v2.png" style="margin-bottom:2mm">
<div class="warn"><b>Наслідок для даху, якщо ліхтар справді 3,40 м</b><ul>
<li>У розкладці 27.10 (1 936 модулів) найближчі модулі даху стоять за 0,29 м від краю 2,87 — тобто впритул до краю 3,40. Тоді біля кожного ліхтаря з обох боків випадає колонка: <b>дах — {nf(K['roof_n'])} модулі = {K['roof_st']} стрінги, {nf(K['roof_kwp'], 1)} кВтп, {nf(K['roof_base'], 1)} МВт·год</b> (−154 модулі; тінь ліхтаря 1,74 м уже врахована). Найближчий модуль даху — за {nf(K['gap'], 2)} м від ліхтаря.</li>
<li>Тобто кількість на даху залежить від ширини ліхтаря більше, ніж від того, як класти модулі на ліхтар. <b>Обміряти ліхтар — перше, що треба зробити.</b></li></ul></div>
<div class="pb"></div>
<h2 style="margin-top:0">Порівняння варіантів ліхтаря</h2>
<table><tr><th>Варіант</th><th>Ліхтар, м</th><th class="n">Місць / у стрінгах</th><th class="n">МВт·год</th><th class="n">Тінь на дах</th><th class="n">Чистими</th><th class="n">Модулів на даху</th><th class="n">Дах + ліхтарі, модулів</th><th class="n">Дах + ліхтарі, МВт·год</th></tr>{CT}</table>
<p class="src">Варіанти з ліхтарем 2,87 м не можна напряму порівнювати з 3,40 м: різниться і сам дах. Якщо ліхтар 3,40 × 1,74 — правильний перший рядок.</p>
<div class="two"><div><b>По ліхтарях</b>
<table><tr><th>Ліхтар</th><th class="n">Місць схід + захід</th><th class="n">Тінь схід</th><th class="n">Тінь захід</th><th class="n">кВт·год/кВтп схід / захід</th><th class="n">МВт·год, усі місця</th></tr>{PT}</table>
<b>Генерація за місяцями, % від річної</b><table>{MT}</table></div>
<div><b>Кріплення</b><ul class="src" style="padding-left:4mm">
<li>Книжково на схилі: 2 рейки горизонтально уздовж ліхтаря (поперек довгої сторони), притиски на довгих сторонах на 540 мм від кінців — за інструкцією ZNSHINE; між модулями 22 мм.</li>
<li>Рейки — до каркаса ліхтаря (на фото схили в рамах із частими ребрами) або на кронштейнах до його опорної рами. Чи витримає каркас ≈15 кг/м² (модулі 11,8 + рейки) плюс сніг і вітер — <b>немає в даних</b>.</li>
<li>Запас по довжині схилу є: низ модуля може трохи виступати за край ліхтаря — модулі даху за {nf(K['gap'], 1)} м. Але якщо схил коротший за ≈2,30 м, низ модуля впреться в бортик — обміряти.</li>
<li>Кут {nf(g['tilt'], 0)}° схід/захід — погодити з ZNSHINE (у їхній відповіді його немає).</li></ul>
<b>Світло в цеху</b><p class="src" style="margin-top:1mm">На фото схили ліхтаря схожі на скління в металевих рамах — книжково модулі закриють їх повністю. {K['left']} модулів поза стрінгами на світлодіоди напряму: у середньому за червневий робочий день ≈{nf(light_jun, -1 if False else 0)} м² при 300 лк, у грудні ≈{nf(light_dec)} м² (оцінка як у розрахунку 07:41). Чи дозволить проєктант закрити ліхтарі (природне освітлення, ДБН В.2.5-28) і чи є в них димовидалення — з'ясувати.</p></div></div>
<div class="warn"><b>Що з'ясувати на даху</b><ol>
<li>Ліхтар: ширина по низу скління і по бортику, висота гребеня, <b>довжина схилу</b> (потрібно ≥ 2,41 м, за РП 2,43), чи однакові всі 4.</li>
<li>Скління чи глухі панелі; фрамуги, клапани димовидалення.</li>
<li>Каркас схилів — крок ребер, переріз, до чого кріпити рейки.</li></ol></div>
<h2>Як рахували</h2><p class="src">Модель розкладки даху 27.10 (розріз 1-1): цифрова модель висот 0,25 м; ліхтар — двосхила призма 3,40 × 1,74 м (РП) з центрами за розрізом; модулі 0,12 м над схилами додано в модель — пораховано тінь на них і від них на модулі даху. Дах — розкладка з відступом від ліхтаря ≥ 0,25 м від краю 3,40 (поріг тіні 15 %, стрінги по 11). Meteonorm 8.1, крок 10 хв; ZNSHINE ZXN8-BD132-730, U 20, втрати ≈13 %, без тильної сторони.</p>
</body></html>'''
open(D + 'lan_flush34_v2.html', 'w', encoding='utf-8').write(H)
OUTF = '/home/claude/work/sun/Розрахунок_варіанта_модулі_книжково_по_схилах_ліхтарів_3,4×1,74_Антарес_27.10.2026.pdf'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + D + 'lan_flush34_v2.html'); await pg.wait_for_timeout(800)
        await pg.pdf(path=OUTF, format='A4', print_background=True, margin={'top': '13mm', 'bottom': '15mm', 'left': '15mm', 'right': '13mm'},
                     display_header_footer=True, header_template='<div></div>', footer_template='<div style="font-family:DejaVu Sans;font-size:6.5pt;color:#5b6770;width:100%;padding:0 13mm 0 15mm;display:flex;justify-content:space-between"><span>Антарес — модулі книжково по схилах ліхтарів 3,40 × 1,74 м · E-Systems · 27.10.2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>')
        await b.close()
asyncio.run(main()); print('ok', OUTF, tot, totG, totF, round(light_jun), round(light_dec))
