# -*- coding: utf-8 -*-
import json, collections, math
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont('DV', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DVB', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
OUT = '/mnt/user-data/outputs/Аналіз_електрики_блискавкозахисту_кріплення_і_баласту_Антарес_етапи_1_і_2_04.11.2026.pdf'
nf = lambda v, d=0: (f'{v:,.{d}f}').replace(',', ' ').replace('.', ',')
INK = colors.HexColor('#1d2b36'); MUT = colors.HexColor('#5b6770'); ACC = colors.HexColor('#0f6e78'); LINE = colors.HexColor('#c4ccd3'); HEAD = colors.HexColor('#e6edf0')
H1 = ParagraphStyle('h1', fontName='DVB', fontSize=15, leading=19, textColor=INK, spaceAfter=4)
H2 = ParagraphStyle('h2', fontName='DVB', fontSize=11.2, leading=14.5, textColor=ACC, spaceBefore=9, spaceAfter=4)
P = ParagraphStyle('p', fontName='DV', fontSize=8.6, leading=11.6, textColor=INK, spaceAfter=3)
S = ParagraphStyle('s', fontName='DV', fontSize=7.4, leading=9.6, textColor=MUT, spaceAfter=2)
B = ParagraphStyle('b', parent=P, leftIndent=9, bulletIndent=0)
TC = ParagraphStyle('tc', fontName='DV', fontSize=7.4, leading=9.2, textColor=INK)
TCB = ParagraphStyle('tcb', fontName='DVB', fontSize=7.4, leading=9.2, textColor=INK)
def tbl(data, widths, bold_last=False, num_from=1, zebra=True):
    rows = [[Paragraph(str(c), TCB if (i == 0 or (bold_last and i == len(data) - 1)) else TC) for c in r] for i, r in enumerate(data)]
    t = Table(rows, colWidths=[w * mm for w in widths], repeatRows=1)
    st = [('GRID', (0, 0), (-1, -1), 0.4, LINE), ('BACKGROUND', (0, 0), (-1, 0), HEAD), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
          ('LEFTPADDING', (0, 0), (-1, -1), 3), ('RIGHTPADDING', (0, 0), (-1, -1), 3), ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]
    for c in range(num_from, len(widths)): st.append(('ALIGN', (c, 1), (c, -1), 'RIGHT'))
    if bold_last: st.append(('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3f5f7')))
    t.setStyle(TableStyle(st)); return t
bl = lambda t: Paragraph(t, B, bulletText='•')
