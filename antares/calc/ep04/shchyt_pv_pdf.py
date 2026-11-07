# -*- coding: utf-8 -*-
"""Креслення компоновки щита PV 7/1 (A3, PDF) з shchyt_pv.json: вид спереду без дверей, вид знизу, розріз по глибині,
склад з габаритами, клеми і роз'єми, маркування, перевірки, таблиця 44 щитів. → out/Креслення_компоновки_щита_PV_7-1_Антарес.pdf"""
import json, os, html, sys
from pathlib import Path
H = Path(__file__).resolve().parent
D = json.load(open(H / 'shchyt_pv.json', encoding='utf-8'))
FONTS = Path(os.environ.get('FONTS', H.parents[3] / 'ses-uze-modul' / 'kp' / 'antares' / 'fonts'))
E, A, G = D['enc'], D['aps'], D['gl']
pw, ph = E['plate']; ox, oy = (E['w'] - pw) / 2, (E['h'] - ph) / 2
COL = {'fh': '#f3d36b', 'spd': '#7fb8d9', 'qs': '#5d636b', 'mon': '#e8742a', 'bus': '#c98a3a', 'xt': '#9bc79b', 'pe': '#6aa86a', 'duct': '#d8dde2'}
e = html.escape
nf = lambda v, d=0: f'{v:,.{d}f}'.replace(',', ' ').replace('.', ',')

def front(s=1 / 3.5):
    W, Hh = E['w'], E['h']; o = []
    o.append(f'<svg viewBox="-50 -12 {W + 170} {Hh + 62}" width="{(W + 170) * s}mm" height="{(Hh + 62) * s}mm" font-family="InterK" font-size="11">')
    o.append(f'<rect x="0" y="0" width="{W}" height="{Hh}" fill="#fafbfc" stroke="#1d2a33" stroke-width="2.5"/>')
    o.append(f'<rect x="{ox}" y="{oy}" width="{pw}" height="{ph}" fill="#eef1f4" stroke="#8a96a0" stroke-width="1"/>')
    for a in A:
        x, y = ox + a['x'], Hh - (oy + a['y'] + a['h'])
        o.append(f'<rect x="{x}" y="{y}" width="{a["w"]}" height="{a["h"]}" fill="{COL[a["k"]]}" stroke="#1d2a33" stroke-width="0.8"/>')
        if a['k'] == 'fh':
            o.append(f'<text x="{x + a["w"] / 2}" y="{y + a["h"] / 2}" font-size="8.5" text-anchor="middle" transform="rotate(-90 {x + a["w"] / 2} {y + a["h"] / 2})" dy="3">{e(a["id"])}</text>')
        elif a['k'] != 'duct' and a['w'] < 30:
            o.append(f'<text x="{x + a["w"] / 2}" y="{y + a["h"] / 2}" font-size="9" font-weight="600" text-anchor="middle" transform="rotate(-90 {x + a["w"] / 2} {y + a["h"] / 2})" dy="3">{e(a["id"])}</text>')
        elif a['k'] != 'duct':
            o.append(f'<text x="{x + a["w"] / 2}" y="{y + a["h"] / 2 + 4}" text-anchor="middle" font-weight="600" fill="{"#fff" if a["k"] in ("qs",) else "#1d2a33"}">{e(a["id"])}</text>')
    # розміри
    o.append(f'<line x1="0" y1="{Hh + 22}" x2="{W}" y2="{Hh + 22}" stroke="#46535d"/><text x="{W / 2}" y="{Hh + 38}" text-anchor="middle">{W}</text>')
    o.append(f'<line x1="-22" y1="0" x2="-22" y2="{Hh}" stroke="#46535d"/><text x="-30" y="{Hh / 2}" text-anchor="middle" transform="rotate(-90 -30 {Hh / 2})">{Hh}</text>')
    qs = next(a for a in A if a['id'] == 'QS1'); qy = Hh - (oy + qs['y'])
    for g in G:
        if g['id'] in ('G1', 'G2'):
            o.append(f'<line x1="{g["x"]}" y1="{Hh}" x2="{g["x"]}" y2="{qy}" stroke="#c8423b" stroke-width="1.6" stroke-dasharray="6 4"/>')
    o.append(f'<line x1="{W + 16}" y1="{qy}" x2="{W + 16}" y2="{Hh}" stroke="#c8423b"/><line x1="{W + 10}" y1="{qy}" x2="{W + 22}" y2="{qy}" stroke="#c8423b"/><line x1="{W + 10}" y1="{Hh}" x2="{W + 22}" y2="{Hh}" stroke="#c8423b"/>'
             f'<text x="{W + 30}" y="{(qy + Hh) / 2}" fill="#c8423b" font-size="10" text-anchor="middle" transform="rotate(-90 {W + 30} {(qy + Hh) / 2})">{nf(Hh - qy)}</text>'
             f'<text x="{W + 40}" y="{qy + 4}" fill="#c8423b" font-size="9">клеми QS1</text><text x="{W + 40}" y="{qy + 16}" fill="#c8423b" font-size="9">Al 1×S —</text><text x="{W + 40}" y="{qy + 28}" fill="#c8423b" font-size="9">знизу через</text><text x="{W + 40}" y="{qy + 40}" fill="#c8423b" font-size="9">G1, G2 прямо</text>')
    o.append('</svg>'); return ''.join(o)

def bottom(s=1 / 3.5):
    W, Dd = E['w'], E['d']; o = [f'<svg viewBox="-50 -12 {W + 170} {Dd + 64}" width="{(W + 170) * s}mm" height="{(Dd + 64) * s}mm" font-family="InterK" font-size="10">']
    o.append(f'<rect x="0" y="0" width="{W}" height="{Dd}" fill="#fafbfc" stroke="#1d2a33" stroke-width="2.5"/>')
    o.append(f'<text x="{W + 6}" y="10" font-size="9" fill="#6b7680">стіна</text><text x="{W + 6}" y="{Dd}" font-size="9" fill="#6b7680">двері</text>')
    for g in G:
        c = '#c8423b' if g['id'].endswith('+') else '#1d2a33' if g['id'].endswith('−') else '#14929c'
        o.append(f'<circle cx="{g["x"]}" cy="{g["z"]}" r="{g["dia"] / 2}" fill="#fff" stroke="{c}" stroke-width="1.6"/>')
        lab = g['id'].replace('XS', '') if g['k'] == 'mc4' else g['id']
        o.append(f'<text x="{g["x"]}" y="{g["z"] + g["dia"] / 2 + 11}" text-anchor="middle" font-size="8.5">{e(lab)}</text>')
    o.append(f'<line x1="0" y1="{Dd + 30}" x2="{W}" y2="{Dd + 30}" stroke="#46535d"/><text x="{W / 2}" y="{Dd + 45}" text-anchor="middle">{W}</text>')
    o.append(f'<line x1="-22" y1="0" x2="-22" y2="{Dd}" stroke="#46535d"/><text x="-30" y="{Dd / 2}" text-anchor="middle" transform="rotate(-90 -30 {Dd / 2})">{Dd}</text>')
    o.append('</svg>'); return ''.join(o)

def side(s=1 / 3.5):
    Dd, Hh = E['d'], E['h']; pz = E['plate_z']; o = [f'<svg viewBox="-50 -30 {Dd + 110} {Hh + 80}" width="{(Dd + 110) * s}mm" height="{(Hh + 80) * s}mm" font-family="InterK" font-size="10">']
    o.append(f'<rect x="0" y="0" width="{Dd}" height="{Hh}" fill="#fafbfc" stroke="#1d2a33" stroke-width="2.5"/>')
    o.append(f'<rect x="{pz - 3}" y="{oy}" width="3" height="{ph}" fill="#8a96a0"/>')
    for a in A:
        if a['k'] in ('duct',): continue
        y = Hh - (oy + a['y'] + a['h'])
        o.append(f'<rect x="{pz}" y="{y}" width="{a["d"]}" height="{a["h"]}" fill="{COL[a["k"]]}" fill-opacity=".55" stroke="#1d2a33" stroke-width=".5"/>')
    for a in A:
        y = Hh - (oy + a['y'] + a['h'])
        if a['id'] in ('QS1', 'FV1', 'F1+', 'F1−', 'A1', 'XT1'):
            lab = {'F1+': 'F+', 'F1−': 'F−'}.get(a['id'], a['id'])
            o.append(f'<text x="{pz + a["d"] - 4}" y="{y + 11 if a["id"] != "FV1" else y + a["h"] - 4}" font-size="8.5" font-weight="600" text-anchor="end">{e(lab)} · {nf(a["d"], 1 if a["d"] % 1 else 0)}</text>')
    dmax = max(a['d'] for a in A)
    o.append(f'<line x1="{pz + dmax}" y1="-12" x2="{pz + dmax}" y2="{Hh}" stroke="#c8423b" stroke-dasharray="4 3"/><text x="{pz + dmax + 4}" y="-16" fill="#c8423b" font-size="9.5">{nf(pz + dmax)}</text>')
    o.append(f'<line x1="0" y1="{Hh + 22}" x2="{Dd}" y2="{Hh + 22}" stroke="#46535d"/><text x="{Dd / 2}" y="{Hh + 38}" text-anchor="middle">{Dd}</text>')
    o.append(f'<text x="{Dd + 8}" y="{Hh / 2}" font-size="9" fill="#6b7680">двері</text><text x="-8" y="{Hh / 2}" font-size="9" fill="#6b7680" text-anchor="end">стіна</text>')
    o.append('</svg>'); return ''.join(o)

def tbl(head, rows, cls=''):
    return f'<table class="{cls}"><tr>' + ''.join(f'<th>{h}</th>' for h in head) + '</tr>' + ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows) + '</table>'

def cnt(a):
    return 7 if a['k'] == 'fh' else 1
grp = {}
for a in A:
    k = a['n'].split(' — ')[0] if a['k'] == 'fh' else a['n']
    grp.setdefault(k, [a, 0]); grp[k][1] += 1
sklad = [[e(a['id'] if n == 1 else (a['id'][:1] + '1' + a['id'][-1] + '…' + a['id'][:1] + '7' + a['id'][-1])), e(k), f'{nf(a["w"], 1 if a["w"] % 1 else 0)} × {nf(a["h"], 1 if a["h"] % 1 else 0)} × {nf(a["d"], 1 if a["d"] % 1 else 0)}', n]
         for k, (a, n) in grp.items()]
holes = {}
for g in G:
    k = g['n'].split(' вхід')[0] if g['k'] == 'mc4' else g['n']
    holes.setdefault(k, [g, 0]); holes[k][1] += 1
niz = [[e(g['id'] if n == 1 else g['id'].replace('1', '1…7', 1)), e(k), f'Ø {nf(g["dia"], 1 if g["dia"] % 1 else 0)}' + (f', затиск {g["rng"][0]}–{g["rng"][1]}' if g.get('rng') else ''), n] for k, (g, n) in holes.items()]
ex = next(b for b in D['boxes'] if b['id'] == 'ЩД-12')
fill = lambda t: t.format(id=ex['id'], K=ex['K'].replace('K', 'К'), q=ex['q'], ns=ex['ns'], kwp=nf(ex['kwp'], 1), isc=nf(ex['isc'], 1), s='…', j='1…7')
CSS = f"""@font-face {{ font-family: 'InterK'; src: url('{(FONTS / 'InterK-Regular.ttf').as_uri()}'); font-weight: 400 }}
@font-face {{ font-family: 'InterK'; src: url('{(FONTS / 'InterK-SemiBold.ttf').as_uri()}'); font-weight: 600 }}
@font-face {{ font-family: 'InterK'; src: url('{(FONTS / 'InterK-Bold.ttf').as_uri()}'); font-weight: 700 }}
@page {{ size: A3 landscape; margin: 10mm }} * {{ box-sizing: border-box; margin: 0; padding: 0 }}
body {{ font-family: 'InterK'; font-size: 8.4pt; color: #1d2a33; line-height: 1.35 }}
.pg {{ height: 277mm; display: grid; gap: 5mm; page-break-after: always; position: relative }} .pg:last-child {{ page-break-after: auto }}
.p2 {{ grid-template-columns: 1fr 1fr }} .pg > div {{ min-width: 0 }} table.bx td {{ white-space: nowrap }}
h1 {{ font-size: 13pt; font-weight: 700 }} h2 {{ font-size: 9.6pt; font-weight: 700; margin: 2.2mm 0 1.2mm; color: #0f6f78 }} .sub {{ color: #46535d; margin-bottom: 2mm }}
table {{ border-collapse: collapse; width: 100%; font-size: 7.6pt }} th {{ background: #eef1f4; text-align: left; font-weight: 600 }}
th, td {{ border: .5pt solid #c3ccd3; padding: .8mm 1.2mm; vertical-align: top }} td:last-child, th:last-child {{ text-align: right; white-space: nowrap }}
.ok {{ color: #2e8a57; font-weight: 700 }} .no {{ color: #c8423b; font-weight: 700 }} .v {{ display: flex; gap: 4mm; align-items: flex-start }}
.ft {{ position: absolute; bottom: 0; left: 0; right: 0; border-top: .6pt solid #1d2a33; padding-top: 1.5mm; display: flex; justify-content: space-between; font-size: 7.6pt; color: #46535d }}
.leg span {{ display: inline-block; width: 3mm; height: 3mm; margin: 0 1mm 0 3mm; vertical-align: -.5mm; border: .4pt solid #1d2a33 }}
.small {{ font-size: 7.2pt; color: #46535d }}"""
leg = ''.join(f'<span style="background:{c}"></span>{n}' for n, c in [('запобіжники', COL['fh']), ('ОПН', COL['spd']), ('роз\'єднувач', COL['qs']), ('контроль струму', COL['mon']),
                                                                    ('шини', COL['bus']), ('клеми', COL['xt']), ('PE', COL['pe']), ('канал', COL['duct'])])
ft = lambda p: f'<div class="ft"><span>Щит PV 7/1 — компоновка, клеми, роз\'єми, маркування · СЕС ТОВ МК «Антарес» · {D["date"][8:]}.{D["date"][5:7]}.{D["date"][:4]}</span><span>E-Systems · аркуш {p} з 3</span></div>'
chk = [[e(c['n']), e(c['v']), '<span class="ok">✓</span>' if c['ok'] else '<span class="no">✗</span>'] for c in D['chk'] if 'у межах панелі' not in c['n']]
chk.insert(0, ['Усі 24 апарати в межах панелі з відступом ≥ 10 мм', '—', '<span class="ok">✓</span>' if all(c['ok'] for c in D['chk'] if 'у межах панелі' in c['n']) else '<span class="no">✗</span>'])
bx = [[b['id'], e(b['g']), b['st'], b['K'].replace('K', 'К') + f' · вх. {b["q"]}', b['ns'], b['free'] or '—', f'1×{b["S"]}', b['lug'], nf(b['od'], 1)] for b in D['boxes']]
p1 = f"""<div class="pg"><div>
<h1>Щит PV 7/1 — компоновка за апаратами і перерізом кабелю</h1>
<div class="sub">Корпус {E['w']} × {E['h']} × {E['d']} мм — {e(E['mat'])}; монтажна панель {pw} × {ph}. Один тип на всі 44 щити: розраховано на 7 стрінгів і Al 1×185; щит з меншою кількістю стрінгів має вільні входи.</div>
<div class="v"><div><h2>Вид спереду, двері зняті (М 1:3,5)</h2>{front()}<div class="leg small">{leg}</div>
<h2>Вид знизу — роз'єми MC4 і вводи (М 1:3,5)</h2>{bottom()}</div>
<div><h2>Розріз по глибині (М 1:3,5)</h2>{side()}<div class="small" style="max-width:62mm;margin-top:2mm">Червона лінія — найглибший апарат (роз'єднувач QS1, 125 мм від панелі); до дверей — 20 мм. Ручка QS1 — на дверях.</div></div>
<div style="flex:1"><h2>Перевірки</h2>{tbl(['Перевірка', 'Значення', ''], chk)}</div></div></div>{ft(1)}</div>"""
p2 = f"""<div class="pg p2"><div><h2>Склад щита — апарати і габарити (Ш × В × Г від панелі, мм)</h2>{tbl(['Поз.', 'Найменування', 'Габарит', 'К-сть'], sklad)}
<h2>Низ корпусу — роз'єми і вводи</h2>{tbl(['Поз.', 'Найменування', 'Отвір, мм', 'К-сть'], niz)}
<div class="small" style="margin-top:2mm">Габарити — за паспортами еталонних апаратів: {e('; '.join(v.split(' — ')[0] for v in D['src'].values()))}. Аналоги в замовленні — не більші.</div></div>
<div><h2>Клеми, роз'єми і провідники всередині (на 1 щит, 7 стрінгів)</h2>{tbl(['Де', 'Що', 'Од.', 'К-сть'], [[e(k['m']), e(k['n']), k['u'], nf(k['q'], 1 if k['q'] % 1 else 0)] for k in D['kl']])}
<h2>Маркування (приклад — {ex['id']})</h2>{tbl(['Де', 'Напис', 'К-сть'], [[e(m['w']), e(fill(m['t'])), m['q']] for m in D['mk']])}</div>{ft(2)}</div>"""
p3 = f"""<div class="pg"><div><h2>44 щити — вхід контейнера, вільні входи, лінія і наконечник</h2>{tbl(['Щит', 'Група', 'Етап', 'Вхід контейнера', 'Стрінгів', 'Вільних входів', 'Лінія Al', 'Наконечник у щиті', 'Ø кабелю, мм'], bx, 'bx')}
<div class="small" style="margin-top:2mm">Вхід контейнера: спершу щити етапу 1, далі за групою (АБК, фасади, ліхтарі, склад, склад північ, дах) і номером; та сама цифра — адреса Modbus у шлейфі RS485 контейнера. Вільні входи: роз'єми з заглушками, запобіжники не встановлюють.</div></div>{ft(3)}</div>"""
out = H / 'out'; out.mkdir(exist_ok=True)
hp = out / 'shchyt_pv.html'; hp.write_text(f'<!doctype html><html lang="uk"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{p1}{p2}{p3}</body></html>', encoding='utf-8')
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); pg.goto(hp.as_uri()); pg.wait_for_timeout(400)
    pdf = out / 'Креслення_компоновки_щита_PV_7-1_Антарес.pdf'; pg.pdf(path=str(pdf), prefer_css_page_size=True, print_background=True); b.close()
hp.unlink(); print(pdf)
