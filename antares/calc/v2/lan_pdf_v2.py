# -*- coding: utf-8 -*-
"""Варіант: модулі «доміком» над ліхтарями на геометрії розрізу 1-1 (27.10.2026) → PDF."""
import json, asyncio, numpy as np
from playwright.async_api import async_playwright
D = '/home/claude/work/sun/v2/'; G = json.load(open(D + 'lan_v2.json')); F = json.load(open(D + 'final_v2.json'))
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',')
K = G['0.10']['K']; K0 = G['0.00']['K']; M = G['0.10']['mods']; B = F['base']; LAN = G['LAN']
# правило даху (тінь ≤ 15 %)
E_ = sorted([m for m in M if m[1] == 'E'], key=lambda m: -m[3]); W_ = sorted([m for m in M if m[1] == 'W' and m[4] <= 15], key=lambda m: -m[3])
k15 = E_[:len(E_) // 11 * 11] + W_[:len(W_) // 11 * 11]; R15 = dict(n=len(k15), st=len(k15) // 11, kwp=round(len(k15) * 0.73, 1), mwh=round(sum(m[3] for m in k15) / 1000, 1))
R15['y'] = round(R15['mwh'] * 1000 / R15['kwp'])
# по ліхтарях
LT = ''
for i, L in enumerate(LAN):
    r = {sd: [m for m in M if m[0] == i + 1 and m[1] == sd] for sd in 'EW'}
    LT += (f"<tr><td>Л{i + 1}</td><td class='n'>{nf(L['x0'], 2)}–{nf(L['x1'], 2)}</td><td class='n'>{nf(L['y0'], 1)}–{nf(L['y1'], 1)} ({nf(L['y1'] - L['y0'], 1)} м)</td>"
           f"<td class='n'>{len(r['E'])} + {len(r['W'])}</td>"
           f"<td class='n'>{nf(np.mean([m[3] for m in r['E']]) / 0.73)} / {nf(np.mean([m[3] for m in r['W']]) / 0.73)}</td>"
           f"<td class='n'>{nf(np.mean([m[4] for m in r['E']]), 1)} / {nf(np.mean([m[4] for m in r['W']]), 1)} %</td><td class='n'>{nf(K['perlan'][i]['mwh'], 1)}</td></tr>")
LT += f"<tr class='sel'><td colspan='3'>Разом місць</td><td class='n'>{K['places'] // 2} + {K['places'] // 2}</td><td class='n'>{nf(K['E'])} / {nf(K['W'])}</td><td></td><td class='n'>{nf(sum(p['mwh'] for p in K['perlan']), 1)}</td></tr>"
roofloss15 = K['roof_loss']
VT = (f"<tr class='sel'><td>Винос 0,10 м за край ліхтаря — <b>основний</b></td><td class='n'>{nf(K['tilt'], 1)}°</td><td class='n'>{nf(K['ridge'], 2)} / {nf(K['width'], 2)}</td><td class='n'>{K['n']} / {K['st']}</td><td class='n'>{nf(K['kwp'], 1)}</td><td class='n'>{nf(K['mwh'], 1)}</td><td class='n'>{nf(K['y'])}</td><td class='n'>−{nf(K['roof_loss'], 1)}</td><td class='n'>+{nf(K['net'], 1)}</td></tr>"
      f"<tr><td>Без виносу: низ модулів над краями ліхтаря</td><td class='n'>{nf(K0['tilt'], 1)}°</td><td class='n'>{nf(K0['ridge'], 2)} / {nf(K0['width'], 2)}</td><td class='n'>{K0['n']} / {K0['st']}</td><td class='n'>{nf(K0['kwp'], 1)}</td><td class='n'>{nf(K0['mwh'], 1)}</td><td class='n'>{nf(K0['y'])}</td><td class='n'>−{nf(K0['roof_loss'], 1)}</td><td class='n'>+{nf(K0['net'], 1)}</td></tr>"
      f"<tr><td>Основний, але за правилом даху (тінь ≤ 15 %): без західного схилу Л1</td><td class='n'>{nf(K['tilt'], 1)}°</td><td class='n'>{nf(K['ridge'], 2)} / {nf(K['width'], 2)}</td><td class='n'>{R15['n']} / {R15['st']}</td><td class='n'>{nf(R15['kwp'], 1)}</td><td class='n'>{nf(R15['mwh'], 1)}</td><td class='n'>{nf(R15['y'])}</td><td class='n'>≈ −{nf(roofloss15, 1)}</td><td class='n'>≈ +{nf(R15['mwh'] - roofloss15, 1)}</td></tr>")
mo = K['mo']; ms = sum(mo); MN = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру']
MT = '<tr>' + ''.join(f'<th class="n">{m}</th>' for m in MN) + '</tr><tr>' + ''.join(f'<td class="n">{nf(v / ms * 100, 1)}</td>' for v in mo) + '</tr>'
TOT = dict(n=B['n'] + K['n'], st=B['st'] + K['st'], kwp=round((B['n'] + K['n']) * 0.73, 1), mwh=round(B['mwh'] - K['roof_loss'] + K['mwh'], 1))
ALL = dict(n=TOT['n'] + 176 + 319, st=TOT['st'] + 16 + 29); ALL['kwp'] = round(ALL['n'] * 0.73, 1)
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Модулі доміком на ліхтарях — Антарес</title><style>
@page {{ size:A4; margin:12mm 13mm 14mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.3pt; line-height:1.36; color:#1d2a33; margin:0; }}
h1 {{ font-size:14pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.5pt; margin:3.5mm 0 1.5mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:8pt; margin-bottom:3.5mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.6mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:15pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.4pt; color:#5b6770; }}
.key {{ background:#f3f5f7; border:0.6pt solid #c4ccd3; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2.5mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .warn ol {{ margin:0; }}
table {{ border-collapse:collapse; width:100%; font-size:7.6pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:1.1mm 1.5mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; font-variant-numeric:tabular-nums; }} td.n {{ white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; font-weight:700; }} img {{ width:100%; display:block; }} .src {{ font-size:7.2pt; color:#5b6770; }} .pb {{ break-before:page; }}
</style></head><body>
<h1>Антарес — модулі «доміком» над ліхтарями (геометрія розрізу 1-1)</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 07:29: «поставимо під кутом на ліхтарі… модуль вертикально, 2,40… два штуки доміком, закриємо фонар. Скільки влізе і скільки будуть генерувати». Окремий варіант до розкладки даху 27.10 ({nf(B['n'])} модулів).</div>
<div class="tiles"><div class="tile"><div class="v">{K['n']}</div><div class="k">модулів 730 Вт = {K['st']} стрінги × 11 ({K['places']} місць на 4 ліхтарях)</div></div>
<div class="tile"><div class="v">{nf(K['kwp'], 1)}</div><div class="k">кВтп</div></div>
<div class="tile"><div class="v">{nf(K['mwh'], 1)}</div><div class="k">МВт·год за рік · {nf(K['y'])} кВт·год/кВтп</div></div>
<div class="tile"><div class="v">+{nf(K['net'], 1)}</div><div class="k">МВт·год чистими: мінус тінь «доміків» на модулях даху ({nf(K['roof_loss'], 1)})</div></div></div>
<div class="key"><b>Коротко</b><ul>
<li><b>Так, два модулі книжково сходяться над ліхтарем.</b> Ліхтар за кресленням 2,87 м завширшки; модуль 2 384 мм кладемо по схилу, верхні краї сходяться над гребенем (зазор 20 мм), нижні виходять на 0,10 м за край ліхтаря. Кут тоді задає сама геометрія: <b>{nf(K['tilt'], 0)}° на схід і на захід</b>, «домік» {nf(K['width'], 2)} м завширшки, гребінь на {nf(K['ridge'], 2)} м над основою ліхтаря (+{nf(17.66 + K['ridge'], 2)} від ±0,000). Ліхтар (гребінь ≈1,5 м — оцінка) повністю під модулями.</li>
<li><b>Скільки влізе:</b> уздовж ліхтаря крок 1 325 мм (1 303 + 20 мм): Л1 — по 36 на схил, Л2–Л4 — по 41, разом {K['places']} місць. Під стрінги по 11 окремо для сходу і заходу — по {K['n'] // 2} на схил = <b>{K['n']} модулів, {K['st']} стрінги</b> (14 «схід» + 14 «захід» на різні MPPT).</li>
<li><b>Скільки генерують:</b> схід {nf(K['E'])}, захід {nf(K['W'])} кВт·год/кВтп; у середньому {nf(K['y'])} — на {nf((1 - K['y'] / B['y']) * 100, 0)} % менше, ніж модулі даху ({nf(B['y'])}). Захід слабший через тінь західної будівлі: на Л1 західний схил втрачає {nf(17.8, 1)} %, на Л2–Л4 — 2–4 %; схід — 0,5–1,3 %.</li>
<li><b>Що забирають у даху:</b> «доміки» вищі за ліхтар і затінюють сусідні модулі даху: {K['roof_hit']} модулів втрачають понад 5 кВт·год за рік, найбільше — {nf(K['roof_max'], 1)} %; разом −{nf(K['roof_loss'], 1)} МВт·год (0,9 % генерації даху). Чистий приріст <b>+{nf(K['net'], 1)} МВт·год</b>.</li>
<li><b>Дах + ліхтарі:</b> {nf(TOT['n'])} модулів = {TOT['st']} стрінги, {nf(TOT['kwp'], 1)} кВтп, ≈{nf(TOT['mwh'], 1)} МВт·год. З складом (176) і фасадами (319, до перерахунку) — {nf(ALL['n'])} модулів = {ALL['st']} стрінгів, {nf(ALL['kwp'], 1)} кВтп: <b>потужність PCS перевірити</b>.</li></ul></div>
<img src="lan_sec_v2.png" style="margin-bottom:2mm">
<table><tr><th>Варіант</th><th class="n">Кут</th><th class="n">Гребінь над основою / ширина, м</th><th class="n">Модулів / стрінгів</th><th class="n">кВтп</th><th class="n">МВт·год</th><th class="n">кВт·год/кВтп</th><th class="n">Тінь на дах, МВт·год</th><th class="n">Чистими</th></tr>{VT}</table>
<p class="src">Без виносу кут крутіший (53°) — генерація на 2 % менша і тінь на дах трохи більша; винос 0,10 м закриває стик ліхтаря з покрівлею від дощу. Третій рядок — якщо тримати те саме правило, що для даху (прибирати модулі з тінню понад 15 %): західний схил Л1 (17,8 %) випадає. Тінь на дах у ньому — з тим самим «доміком» (≈).</p>
<div class="pb"></div><h2 style="margin-top:0">План і ліхтарі</h2>
<img src="lan_plan_v2.png" style="width:86%;margin:0 auto 1mm">
<table><tr><th>Ліхтар</th><th class="n">X від осі 1, м</th><th class="n">Y, м (довжина)</th><th class="n">Місць схід + захід</th><th class="n">кВт·год/кВтп схід / захід</th><th class="n">Тінь схід / захід</th><th class="n">МВт·год, усі місця</th></tr>{LT}</table>
<p class="src">Червоним на плані — {K['places'] - K['n']} найслабші місця, які не входять у стрінги по 11 (котрі саме — неважливо, у межах схилу вони майже однакові). X — креслення (розріз 1-1), Y — РП.</p>
<p><b>Генерація за місяцями, % від річної:</b></p><table>{MT}</table>
<p class="src">Найбільше — травень–липень: крутий схід–захід працює вранці й увечері, коли сонце високо і схід–захід сонця далеко на півночі; узимку сонце низько на півдні, і 50° схід/захід майже не працюють (грудень — {nf(mo[11] / ms * 100, 1)} % річної).</p>
<div class="warn"><b>Що треба знати, перш ніж іти далі</b><ol>
<li><b>Світло в цеху.</b> Якщо ліхтар світлопрозорий (скло, полікарбонат) — модулі його повністю закриють, денне світло в прольоті зникне. Чим заповнений ліхтар — <b>немає в даних</b>, на фото не видно.</li>
<li><b>Димовидалення.</b> Якщо в ліхтарях є фрамуги або клапани димовидалення — закривати їх не можна; тоді «доміки» лише на ділянках без них.</li>
<li><b>Висота й форма ліхтаря — обміряти.</b> Розрахунок узяв гребінь ≈1,5 м (оцінка); рама влазить, поки гребінь ліхтаря нижче ≈1,8 м. На розрізі ліхтар показано плитою з верхом +17,93 — якщо це борт ≈0,27 м, низ модулів треба підняти на ≈0,2 м (гребінь «доміку» ≈+19,8; кількість не зміниться, тінь на дах трохи більша).</li>
<li><b>Рама і кріплення.</b> Окрема двосхила рама над кожним ліхтарем зі стійками по його краях, кріплення крізь покрівлю до ферм / плит (не до ліхтаря). Модулі за інструкцією ZNSHINE: 2 рейки уздовж ліхтаря — поперек довгої сторони, затискачі на довгих сторонах на 540 мм від кінців. <b>Кут 50° схід/захід — погодити з ZNSHINE</b> (у їхній відповіді його немає).</li>
<li><b>Вітер.</b> «Домік» ≈2 м заввишки на +19,6 м — вітрова парусність і відрив; перерахувати КМ за ДБН В.1.2-2:2006.</li>
<li><b>Сніг.</b> З 50° сніг з'їжджатиме на модулі даху за 0,19 м — сніговий мішок біля ліхтаря; перевірити навантаження на крайні модулі даху або залишити біля ліхтаря прохід.</li>
<li><b>Обслуговування ліхтаря</b> (покрівля, герметизація) під рамою стане складним — погодити з власником.</li>
<li>Вартість рами — <b>немає в даних</b>, потрібен ескіз КМ.</li></ol></div>
<h2>Як рахували</h2><p class="src">Та сама модель, що для розкладки даху 27.10 (розріз 1-1): цифрова модель висот 0,25 м з покрівлею за гранями, ліхтарями (двосхилі, гребінь 1,5 м — оцінка), західною будівлею, парапетами, рамою кондиціонерів, сходами; горизонт 72 напрями; клімат Meteonorm 8.1 з PVsyst проєкту, крок 10 хв; модуль ZNSHINE ZXN8-BD132-730, −0,30 %/°C, U 25 (провітрюваний «домік»), втрати ≈13 %, тильна сторона не врахована. «Доміки» додано в модель висот — так пораховано і тінь на них самих, і тінь від них на 1 936 модулів даху (різниця з базою 27.10). Тінь модуля — втрата річної генерації порівняно з тим самим модулем без перешкод. Це варіант до розкладки даху, а не заміна: модулі даху біля ліхтарів лишаються як є.</p>
</body></html>'''
open(D + 'lan_v2.html', 'w', encoding='utf-8').write(H)
OUTF = '/home/claude/work/sun/Розрахунок_варіанта_модулі_доміком_на_ліхтарях_за_розрізом_1-1_Антарес_27.10.2026.pdf'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + D + 'lan_v2.html'); await pg.wait_for_timeout(800)
        await pg.pdf(path=OUTF, format='A4', print_background=True, margin={'top': '13mm', 'bottom': '15mm', 'left': '15mm', 'right': '13mm'},
                     display_header_footer=True, header_template='<div></div>', footer_template='<div style="font-family:DejaVu Sans;font-size:6.5pt;color:#5b6770;width:100%;padding:0 13mm 0 15mm;display:flex;justify-content:space-between"><span>Антарес — модулі «доміком» над ліхтарями, розріз 1-1 · E-Systems · 27.10.2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>')
        await b.close()
asyncio.run(main()); print('ok', OUTF, R15, TOT, ALL)
