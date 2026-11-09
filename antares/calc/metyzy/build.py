# -*- coding: utf-8 -*-
"""metyzy.json → Excel (100 %, Arial) і PDF (A4 альбомна, UA / EN) — специфікація метизів для замовлення в Китаї, Антарес."""
import json, subprocess, sys, html
from pathlib import Path
H = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(H / 'spec.py')], check=True, stdout=subprocess.DEVNULL)
D = json.load(open(H / 'metyzy.json', encoding='utf-8'))
CODE, DATE = 'ЕСЕ-1011-01-КМ.С', '10.11.2026'
NAME = 'Специфікація_метизів_для_замовлення_в_Китаї_Антарес_частини_1_і_2'
TITLE = 'Специфікація метизів і кріпильних виробів для замовлення в Китаї'
TITLE_EN = 'Fasteners and fixing hardware — purchase specification'


def nf(v, d=0):
    s = f'{v:,.{d}f}'.replace(',', ' ').replace('.', ',')
    return s


def qf(v):
    return nf(v, 1) if abs(v - round(v)) > 1e-9 else nf(v)


# ---------------- Excel
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
wb = Workbook(); ws = wb.active; ws.title = 'Специфікація'
F = lambda b=False, s=10, c='1D2A33': Font(name='Arial', size=s, bold=b, color=c)
HEAD = PatternFill('solid', fgColor='E6EBF0'); SUB = PatternFill('solid', fgColor='F3F5F7'); thin = Side(style='thin', color='C4CCD3')
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
ws['A1'] = f'{TITLE} · {TITLE_EN}'; ws['A1'].font = F(True, 13)
ws['A2'] = f'ТОВ МК «Антарес», Київ — СЕС 2 079,8 кВтп · {CODE} · {DATE} · E-Systems'; ws['A2'].font = F(False, 10, '5B6770')
ws['A3'] = 'Кількості до замовлення — із запасом 5 % (метизи, притиски, шпильки). Частина 1 — склад, фасади, ліхтарі, АБК; частина 2 — дах цеху. Маса — довідкова.'; ws['A3'].font = F(False, 9, '5B6770')
hdr = ['№', 'Позиція', 'Item', 'Од. / Unit', 'Частина 1', 'Частина 2', 'Разом / Total', 'Маса од., кг', 'Маса, кг', 'Примітка']
r = 5
for i, h in enumerate(hdr, 1):
    c = ws.cell(r, i, h); c.font = F(True, 10); c.fill = HEAD; c.border = BOX; c.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center')
n = 0; r += 1; first = r
for g in D['groups']:
    c = ws.cell(r, 1, f"{g['uk']} · {g['en']}"); c.font = F(True, 10); ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=10)
    for j in range(1, 11): ws.cell(r, j).fill = SUB; ws.cell(r, j).border = BOX
    r += 1
    for x in g['lines']:
        n += 1
        vals = [n, x['uk'], x['en'], x['u'], x['q1'] or None, x['q2'] or None, None, x['mu'], None, x['note']]
        for j, v in enumerate(vals, 1):
            c = ws.cell(r, j, v); c.font = F(); c.border = BOX
            c.alignment = Alignment(wrap_text=j in (2, 3, 10), vertical='top', horizontal='right' if j in (1, 5, 6, 7, 8, 9) else 'left')
        ws.cell(r, 7, f'=SUM(E{r}:F{r})'); ws.cell(r, 7).font = F(True)
        if x['mu'] is not None: ws.cell(r, 9, f'=G{r}*H{r}')
        ws.cell(r, 5).number_format = ws.cell(r, 6).number_format = ws.cell(r, 7).number_format = '# ##0.##;;'
        ws.cell(r, 8).number_format = '0.000'; ws.cell(r, 9).number_format = '# ##0.0'
        r += 1
last = r - 1
ws.cell(r, 2, 'Маса разом, кг (довідково) · Total weight, kg').font = F(True)
ws.cell(r, 5, f'=SUMPRODUCT(E{first}:E{last},H{first}:H{last})'); ws.cell(r, 6, f'=SUMPRODUCT(F{first}:F{last},H{first}:H{last})'); ws.cell(r, 9, f'=SUM(I{first}:I{last})')
for j in range(1, 11): ws.cell(r, j).fill = SUB; ws.cell(r, j).border = BOX; ws.cell(r, j).font = F(True)
for j in (5, 6, 9): ws.cell(r, j).number_format = '# ##0'; ws.cell(r, j).alignment = Alignment(horizontal='right')
for col, w in zip('ABCDEFGHIJ', (5, 58, 50, 9, 11, 11, 12, 11, 11, 40)): ws.column_dimensions[col].width = w
ws.freeze_panes = 'A6'; ws.sheet_view.zoomScale = 100
w2 = wb.create_sheet('Не замовляти до рішення')
for i, h in enumerate(('Позиція', 'Кількість', 'Що потрібно вирішити'), 1):
    c = w2.cell(1, i, h); c.font = F(True); c.fill = HEAD; c.border = BOX
for i, (a, b, c_) in enumerate(D['hold'], 2):
    for j, v in enumerate((a, b, c_), 1):
        c = w2.cell(i, j, v); c.font = F(); c.border = BOX; c.alignment = Alignment(wrap_text=True, vertical='top')
for col, w in zip('ABC', (60, 26, 70)): w2.column_dimensions[col].width = w
w2.sheet_view.zoomScale = 100
w3 = wb.create_sheet('Вимоги і примітки')
w3['A1'] = 'Уточнити в постачальника'; w3['A1'].font = F(True, 11)
for i, t in enumerate(D['clar'], 2): w3.cell(i, 1, f'{i - 1}. {t}').font = F()
o = len(D['clar']) + 3
w3.cell(o, 1, 'Не входить у цю специфікацію').font = F(True, 11)
for i, t in enumerate(D['ne'], o + 1): w3.cell(i, 1, f'— {t}').font = F()
w3.column_dimensions['A'].width = 150; w3.sheet_view.zoomScale = 100
wb.save(H / f'{NAME}.xlsx')

# ---------------- PDF (HTML → Chromium)
e = html.escape
rows = []; n = 0
for g in D['groups']:
    rows.append(f'<tr class="g"><td colspan="8">{e(g["uk"])} <span>· {e(g["en"])}</span></td></tr>')
    for x in g['lines']:
        n += 1
        rows.append(f'<tr><td class="n">{n}</td><td class="nm">{e(x["uk"])}<i>{e(x["en"])}</i></td><td>{e(x["u"])}</td>'
                    f'<td class="n">{qf(x["q1"]) if x["q1"] else "—"}</td><td class="n">{qf(x["q2"]) if x["q2"] else "—"}</td><td class="n b">{qf(x["q"])}</td>'
                    f'<td class="n">{nf(x["kg"], 1) if x["kg"] is not None else "—"}</td><td class="nt">{e(x["note"])}</td></tr>')
T = D['tot']
rows.append(f'<tr class="tot"><td></td><td>Маса разом, кг (довідково) <i>Total weight, kg (reference)</i></td><td></td><td class="n">{nf(T["kg1"])}</td><td class="n">{nf(T["kg2"])}</td>'
            f'<td class="n b">{nf(T["kg1"] + T["kg2"])}</td><td></td><td class="nt">без позицій, маси яких немає</td></tr>')
hold = ''.join(f'<tr><td>{e(a)}</td><td class="n">{e(b)}</td><td>{e(c)}</td></tr>' for a, b, c in D['hold'])
clar = ''.join(f'<li>{e(t)}</li>' for t in D['clar']); ne = ''.join(f'<li>{e(t)}</li>' for t in D['ne'])
CSS = """
@page { size: A4 landscape; margin: 12mm 12mm 14mm 12mm }
* { box-sizing: border-box }
body { font-family: 'DejaVu Sans', sans-serif; color: #1d2a33; font-size: 7.6pt; margin: 0; background: #fff }
.top { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.4pt solid #1d2a33; padding-bottom: 6pt; margin-bottom: 8pt }
h1 { font-size: 14pt; margin: 0 0 2pt } .en { color: #5b6770; font-size: 9pt } .code { text-align: right; font-size: 9pt } .code b { font-size: 12pt; display: block }
.intro { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14pt; margin-bottom: 8pt; font-size: 7.6pt; line-height: 1.4 }
.intro p { margin: 0 0 3pt }
table { width: 100%; border-collapse: collapse }
th { background: #e6ebf0; font-weight: 700; padding: 3pt 4pt; border: .35pt solid #c4ccd3; text-align: left; font-size: 7.2pt }
td { padding: 2.4pt 4pt; border: .35pt solid #c4ccd3; vertical-align: top }
td.n { text-align: right; white-space: nowrap } td.b { font-weight: 700 } td.nm i, .tot i { display: block; color: #5b6770; font-style: normal; font-size: 6.6pt; margin-top: 1pt }
td.nt { color: #5b6770; font-size: 6.8pt }
tr.g td { background: #f3f5f7; font-weight: 700; padding-top: 4pt } tr.g span { font-weight: 400; color: #5b6770 }
tr.tot td { background: #f3f5f7; font-weight: 700 }
thead { display: table-header-group } tr { page-break-inside: avoid }
.sec { margin-top: 10pt; page-break-inside: avoid } h2 { font-size: 9.5pt; margin: 0 0 4pt }
.warn { border: 1pt solid #b4461b; background: #fbeee9; padding: 6pt 8pt } .warn th { background: #f5ddd3 }
ul { margin: 0; padding-left: 14pt } li { margin-bottom: 2pt }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14pt }
"""
HTML = f"""<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>{TITLE}</title><style>{CSS}</style></head><body>
<div class="top"><div><h1>{TITLE}</h1><div class="en">{TITLE_EN} · ТОВ МК «Антарес», Київ — СЕС 2 079,8 кВтп</div></div>
<div class="code"><b>{CODE}</b>E-Systems · {DATE}</div></div>
<div class="intro"><div>
<p><b>Що це.</b> Метизи, притиски, шпильки і гільзи з муфтами для кріплення модулів, лотків і рам щитів — для запиту ціни і замовлення в Китаї. Ціни — від постачальника.</p>
<p><b>Частини.</b> Частина 1 — склад (південні й північні скати), фасади і козирок 25°, ліхтарі цеху, АБК, лотки й щити частини 1. Частина 2 — дах цеху після нової мембрани, лотки й щити частини 2.</p></div><div>
<p><b>Кількості до замовлення</b> — із запасом 5 % на метизи, притиски і шпильки. Модуль — ZNSHINE ZXN8-BD132-730, рама 33 мм; профіль лаг і рейок — 41×41, перфорація Ø10,5.</p>
<p><b>Маса</b> — довідкова: з геометрії стандартів DIN і розрахунку гільзи; для упаковки і доставки — дані постачальника.</p></div></div>
<table><thead><tr><th style="width:3%">№</th><th>Позиція · Item</th><th style="width:5%">Од.</th><th style="width:7%">Частина 1</th><th style="width:7%">Частина 2</th><th style="width:7%">Разом</th><th style="width:6%">Маса, кг</th><th style="width:22%">Примітка</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table>
<div class="sec warn"><h2>Не замовляти до рішення</h2><table><tr><th style="width:38%">Позиція</th><th style="width:18%">Кількість</th><th>Що потрібно вирішити</th></tr>{hold}</table></div>
<div class="sec two"><div><h2>Уточнити в постачальника</h2><ul>{clar}</ul></div><div><h2>Не входить у цю специфікацію</h2><ul>{ne}</ul></div></div>
</body></html>"""
(H / 'metyzy.html').write_text(HTML, encoding='utf-8')
from playwright.sync_api import sync_playwright
FOOT = (f'<div style="width:100%;font-family:DejaVu Sans;font-size:7px;color:#5b6770;padding:0 12mm;display:flex;justify-content:space-between">'
        f'<span>{CODE} · {TITLE} · Антарес</span><span>Аркуш <span class="pageNumber"></span> з <span class="totalPages"></span></span></div>')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); pg.goto((H / 'metyzy.html').as_uri()); pg.wait_for_timeout(300)
    pg.pdf(path=str(H / f'{NAME}.pdf'), format='A4', landscape=True, print_background=True, display_header_footer=True,
           header_template='<div></div>', footer_template=FOOT, margin=dict(top='12mm', bottom='14mm', left='12mm', right='12mm'))
    b.close()
print('ok', n, 'позицій')
