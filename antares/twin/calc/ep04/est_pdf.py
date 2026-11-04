from pdfkit import *
import openpyxl
X = "/mnt/user-data/outputs/Кошторис_і_специфікація_СЕС_і_УЗЕ_Антарес_по_етапах_04.11.2026.xlsx"
wb = openpyxl.load_workbook(X, data_only=True)
OUT = '/mnt/user-data/outputs/Кошторис_будівництва_під_ключ_СЕС_і_УЗЕ_Антарес_по_етапах_04.11.2026.pdf'
doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=13 * mm, rightMargin=13 * mm, topMargin=13 * mm, bottomMargin=13 * mm, title='Кошторис будівництва під ключ СЕС і УЗЕ Антарес по етапах', author='E-Systems')
def foot(c, d):
    c.saveState(); c.setFont('DV', 7); c.setFillColor(MUT); c.drawString(13 * mm, 7 * mm, 'ТОВ «ЕСІСТЕМС ЕНЕРДЖІ» · ТОВ МК «Антарес» · кошторис по етапах, 04.11.2026 · $ без ПДВ, якщо не вказано інше'); c.drawRightString(197 * mm, 7 * mm, f'стор. {d.page}'); c.restoreState()
s = [Paragraph('Кошторис будівництва під ключ — СЕС і УЗЕ по етапах', H1),
     Paragraph('ТОВ МК «Антарес», Київ. Етап 1 — фасади, ліхтарі без демонтажу, склад, АБК, 4 контейнери Golen LES-H20 (по 2 на ТП-5913 і ТП-6923). Етап 2 — дах цеху В1 на новій мембрані. Розрахунок 04.11.2026 (розподіл щитів між ТП, переріз Al, лотки, блискавкозахист); формули — у файлі Excel з тією самою назвою.', S)]
Z = wb['Зведення']; nfz = lambda v: nf(v) if isinstance(v, (int, float)) else (v or '')
z = [['Етап', 'Склад', 'Без ПДВ, $', 'З ПДВ, $', 'З ПДВ, «245», $', 'кВтп', 'МВт·год/рік']]
for r in (5, 6, 7): z.append([Z.cell(r, 1).value, Z.cell(r, 2).value or '', nfz(Z.cell(r, 3).value), nfz(Z.cell(r, 4).value), nfz(Z.cell(r, 5).value), nf(Z.cell(r, 6).value, 1), nfz(Z.cell(r, 7).value)])
s.append(tbl(z, [18, 66, 22, 22, 22, 14, 18], bold_last=True))
s.append(Paragraph('«245» — модулі й накопичувачі ввозяться на замовника без ПДВ (пільга до 01.01.2029). Етап 1 на ≈80 % — 4 контейнери Golen (820 000 $ з доставкою).', S))
for t in ('Етап 1', 'Етап 2'):
    S_ = wb[t]; s.append(Paragraph(S_['A1'].value, H2))
    rows = [['№', 'Позиція', 'Од.', 'К-сть', 'Ціна, $', 'Сума, $']]
    for r in range(5, S_.max_row + 1):
        a, b, c, d_, e, g = (S_.cell(r, k).value for k in (1, 2, 3, 4, 5, 7))
        if b is None and a is None: continue
        if a and not b: rows.append([f'<b>{a}</b>', '', '', '', '', '']); continue
        if b and (str(b).startswith('Варіант') or str(b).startswith('Резерв')):
            rows.append(['', f'<i>{b}</i>', '', '', '', nfz(g) + ' *']); continue
        if isinstance(b, str) and len(b) > 200: continue
        rows.append([a or '', b or '', c or '', nf(d_, 2 if isinstance(d_, float) and d_ < 1 else 0) if isinstance(d_, (int, float)) else '', nf(e, 2) if isinstance(e, (int, float)) else '', nfz(g)])
    t_ = tbl(rows, [10, 104, 13, 17, 17, 23])
    for i_, rw in enumerate(rows):
        if isinstance(rw[0], str) and rw[0].startswith('<b>'): t_.setStyle(TableStyle([('SPAN', (0, i_), (-1, i_)), ('BACKGROUND', (0, i_), (-1, i_), colors.HexColor('#f3f5f7'))]))
    s.append(t_)
    s.append(Paragraph('* не входить у суму — варіант або резерв до розрахунку на вітер.', S))
doc.build(s, onFirstPage=foot, onLaterPages=foot); print(OUT)
