# -*- coding: utf-8 -*-
"""Звіт 27.10 (21:44): дах АБК — карта радіації, варіанти розкладки, кошторис; ідея «модулі поза стрінгами → світлодіоди» → рисунки + PDF."""
import json, math, base64, asyncio, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Polygon
from matplotlib.colors import Normalize
V = '/home/claude/work/sun/v3/'
J = json.load(open(V + 'abk.json')); C = json.load(open(V + 'abk_cost.json')); LD = json.load(open(V + 'led13.json'))
G = J['geo']; AL, AB = G['AL'], G['AB']; VAR = J['var']; CV, CC = C['var'], C['comb']
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 7.2})
INK, MUT = '#1d2a33', '#5b6770'
LM, DM = 2.384, 1.303; T15 = math.radians(15); DEP = DM * math.cos(T15)
XC, HW = (AB['x0'] + AB['x1']) / 2, (AB['x1'] - AB['x0']) / 2
zA = lambda x: AB['h'] + AB['f'] * np.clip(1 - ((np.asarray(x) - XC) / HW) ** 2, 0, 1)
nf = lambda v, n=0: (f'{v:,.{n}f}').replace(',', ' ').replace('.', ',').replace('-', '−')
def outline(ax, lw=0.6):
    ax.add_patch(Rectangle((AL['x0'], AL['y0']), AL['x1'] - AL['x0'], AL['y1'] - AL['y0'], fill=False, ec=INK, lw=lw))
    ax.add_patch(Rectangle((AB['x0'], AB['y0']), AB['x1'] - AB['x0'], AB['y1'] - AB['y0'], fill=False, ec=INK, lw=lw))
    s = G['stair']; ax.add_patch(Rectangle((s[0], s[2]), s[1] - s[0], s[3] - s[2], fc='#c49c63', ec=INK, lw=0.5, hatch='////', alpha=0.85))
    ax.text((s[0] + s[1]) / 2, (s[2] + s[3]) / 2, 'надбудова\nсходів\n+12,6', ha='center', va='center', fontsize=5.6, color=INK)
    for x, y in G['vents']: ax.add_patch(Circle((x, y), 0.6, fc='#3a3f43', ec=INK, lw=0.4))
    for x, y, dx, dy, h in G['boxes']: ax.add_patch(Rectangle((x - dx / 2, y - dy / 2), dx, dy, fc='#9aa3a8', ec=INK, lw=0.4))
    ax.set_xlim(104.5, 131.5); ax.set_ylim(3.5, 48); ax.set_aspect('equal'); ax.set_xlabel('X, м (схід →)'); ax.set_ylabel('Y, м (північ ↑)')
    ax.text(105.0, 46.6, '← цех за 11,7 м', fontsize=5.8, color=MUT); ax.text(129.0, 33, 'арка\n+13,2…14,5', fontsize=5.6, color=MUT, ha='left')
    ax.text(129.0, 13, 'плаский\n+10,0', fontsize=5.6, color=MUT, ha='left')
# ---------- 1. карта радіації
M = np.array([[m[0], m[1], m[3]] for m in J['map']])
fig, ax = plt.subplots(figsize=(4.4, 6.6), dpi=230)
norm = Normalize(800, 1200); cm = plt.get_cmap('YlOrRd')
for x, y, v in M: ax.add_patch(Rectangle((x - 0.25, y - 0.25), 0.5, 0.5, color=cm(norm(v)), lw=0))
outline(ax)
sm = plt.cm.ScalarMappable(norm=norm, cmap=cm); cb = fig.colorbar(sm, ax=ax, fraction=0.05, pad=0.02); cb.set_label('кВт·год/м² за рік, на площину покрівлі (нижче 800 — як 800)')
ax.set_title('Дах АБК — сонячна радіація з тінями, клітинка 0,5 м', fontsize=8, loc='left', color=INK, weight='bold')
fig.tight_layout(); fig.savefig(V + 'abk_map.png'); plt.close(fig)
mL = M[[m[2] == 'L' for m in J['map']]][:, 2]; mA = M[[m[2] == 'A' for m in J['map']]][:, 2]
I0L = np.mean([m[4] for m in J['map'] if m[2] == 'L']); I0A = np.mean([m[4] for m in J['map'] if m[2] == 'A'])
# ---------- 2. розкладки К1 і К3
ycm = plt.get_cmap('YlGnBu'); yn = Normalize(550, 1100)
def draw(ax, keys, title):
    outline(ax, 0.5)
    for k in keys:
        for m in VAR[k]['mods']:
            col = ycm(yn(m['kwh'] / 0.73)) if m['st'] >= 0 else '#ffffff'
            ax.add_patch(Rectangle((m['x0'], m['y0']), m['x1'] - m['x0'], m['y1'] - m['y0'], fc=col, ec='#2a3f55' if m['st'] >= 0 else '#9aa3a8', lw=0.35, ls='-' if m['st'] >= 0 else '--'))
            if m['how'] == 'ew':      # гребінь «доміку»
                pass
    n = sum(VAR[k]['n'] for k in keys); mw = sum(VAR[k]['mwh'] for k in keys)
    ax.set_title(f'{title}\n{n} модулів, {nf(mw, 1)} МВт·год за рік', fontsize=7.4, loc='left', color=INK, weight='bold')
fig, axs = plt.subplots(1, 2, figsize=(7.6, 6.0), dpi=230)
draw(axs[0], ['A_flush', 'L_ew'], 'К1: арка по даху + нижній дах «домік» 15°'); draw(axs[1], ['A_south', 'L_south'], 'К3: трикутники 15° на південь на обох дахах')
axs[1].set_ylabel('')
sm = plt.cm.ScalarMappable(norm=yn, cmap=ycm); cb = fig.colorbar(sm, ax=axs, fraction=0.025, pad=0.02); cb.set_label('кВт·год/кВтп за рік (білі пунктирні — поза стрінгами)')
fig.savefig(V + 'abk_lay.png', bbox_inches='tight'); plt.close(fig)
# ---------- 3. розрізи
fig, axs = plt.subplots(3, 1, figsize=(7.6, 5.4), dpi=230, gridspec_kw=dict(height_ratios=[1.15, 1, 1]))
ax = axs[0]; xs = np.linspace(AB['x0'], AB['x1'], 300); ax.fill_between(xs, 11.2, zA(xs), color='#e7e3dc'); ax.plot(xs, zA(xs), color=INK, lw=0.8)
for x0, h in ((AB['x0'], 0.5), (AB['x1'] - 0.25, 0.7)): ax.add_patch(Rectangle((x0, AB['h']), 0.25, h, color='#c49c63'))
cols = sorted({(m['x0'], m['x1']) for m in VAR['A_flush']['mods']})
for a, b in cols:
    za, zb = float(zA(a)), float(zA(b)); n = np.array([-(zb - za), b - a]); n /= np.linalg.norm(n); o = 0.12
    ax.plot([a + n[0] * o, b + n[0] * o], [za + n[1] * o, zb + n[1] * o], color='#2a5db0', lw=2.2, solid_capstyle='butt')
ax.set_title('Арка АБК, розріз Сх–Зх: «по даху», як на цеху — 13 колонок модулів на лагах 0,12 м, ухил від 0° біля гребеня до ≈15° біля парапетів', fontsize=7, loc='left', color=INK)
ax.set_xlim(107.5, 129); ax.set_ylim(11.2, 15.4); ax.set_aspect('equal'); ax.set_yticks([12, 13, 14, 15]); ax.text(108.0, 14.7, 'захід', fontsize=6, color=MUT); ax.text(127.2, 14.7, 'схід', fontsize=6, color=MUT)
ax = axs[1]; ax.fill_between([AL['y0'], AL['y1']], 8.6, AL['h'], color='#e7e3dc'); ax.plot([AL['y0'], AL['y1']], [AL['h']] * 2, color=INK, lw=0.8)
ax.add_patch(Rectangle((AL['y0'], AL['h']), 0.25, 0.5, color='#c49c63')); ax.add_patch(Rectangle((AL['y1'], 8.6), 2.0, AB['h'] - 8.6, color='#e7e3dc')); ax.plot([AL['y1'], AL['y1']], [AL['h'], AB['h']], color=INK, lw=0.8)
ax.text(AL['y1'] + 0.2, AB['h'] - 0.6, 'стіна основного блоку', fontsize=5.6, color=MUT)
rows = sorted({m['y0'] for m in VAR['L_south']['mods']})
for y in rows:
    ax.plot([y, y + DEP], [AL['h'] + G['hlow'], AL['h'] + G['hlow'] + DM * math.sin(T15)], color='#2a5db0', lw=2.2, solid_capstyle='butt')
    ax.plot([y + DEP, y + DEP], [AL['h'], AL['h'] + G['hlow'] + DM * math.sin(T15)], color='#7f8f99', lw=0.6); ax.plot([y, y], [AL['h'], AL['h'] + G['hlow']], color='#7f8f99', lw=0.6)
ax.set_title(f'Нижній дах, розріз Пд–Пн (західна частина): трикутники 15° на південь, крок рядів {nf(G["pitch"], 1)} м, як у РП', fontsize=7, loc='left', color=INK)
ax.set_xlim(5.5, 23); ax.set_ylim(8.6, 13.6); ax.set_aspect('equal'); ax.text(5.8, 13.0, 'південь', fontsize=6, color=MUT); ax.set_yticks([9, 10, 11, 12, 13])
ax = axs[2]; ax.fill_between([AL['x0'], AL['x1']], 8.6, AL['h'], color='#e7e3dc'); ax.plot([AL['x0'], AL['x1']], [AL['h']] * 2, color=INK, lw=0.8)
for x0 in (AL['x0'], AL['x1'] - 0.25): ax.add_patch(Rectangle((x0, AL['h']), 0.25, 0.5, color='#c49c63'))
s = G['stair']; ax.add_patch(Rectangle((s[0], AL['h']), s[1] - s[0], G['zst'] - AL['h'], fc='#c49c63', ec=INK, lw=0.4, hatch='////')); ax.text((s[0] + s[1]) / 2, 12.9, 'надбудова сходів', ha='center', fontsize=5.6, color=MUT)
for a, b, f in sorted({(m['x0'], m['x1'], m['face']) for m in VAR['L_ew']['mods']}):
    lo = a if f == 'W' else b; hi = b if f == 'W' else a
    ax.plot([lo, hi], [AL['h'] + G['hlow'], AL['h'] + G['hlow'] + DM * math.sin(T15)], color='#2a5db0', lw=2.2, solid_capstyle='butt')
ax.set_title('Нижній дах, розріз Зх–Сх: «домік» схід–захід 15° — пари модулів гребенем уздовж Пн–Пд, прохід 0,4 м між парами', fontsize=7, loc='left', color=INK)
ax.set_xlim(107.5, 128.5); ax.set_ylim(8.6, 13.6); ax.set_aspect('equal'); ax.set_yticks([9, 10, 11, 12, 13])
for a in axs: a.tick_params(labelsize=6); a.set_xlabel('м', fontsize=6)
fig.tight_layout(); fig.savefig(V + 'abk_sec.png'); plt.close(fig)
# ---------- 4. світлодіоди: світловий потік від 21 модуля по годинах
fig, ax = plt.subplots(figsize=(7.6, 2.5), dpi=230)
eff = LD['assume']['eff'] * LD['assume']['drv']
for mo, lab, col in (('5', 'червень', '#c77a2a'), ('2', 'березень', '#2e8b57'), ('11', 'грудень', '#2a5db0')):
    d = np.array(LD['curves'][mo]); ax.plot(d[:, 0], d[:, 1] * eff, color=col, lw=1.4, label=f'{lab}, ясно'); ax.plot(d[:, 0], d[:, 2] * eff, color=col, lw=1.0, ls='--', label=f'{lab}, хмарно')
ax2 = ax.twinx(); lo, hi = ax.get_ylim(); ax2.set_ylim(lo * 1000 * LD['assume']['uf'] / LD['assume']['shop'], hi * 1000 * LD['assume']['uf'] / LD['assume']['shop']); ax2.set_ylabel('лк у середньому по цеху', fontsize=6.5)
ax.set_xlabel('година (київський час)'); ax.set_ylabel('тис. лм'); ax.set_xlim(4, 21); ax.grid(alpha=0.25); ax.legend(fontsize=5.8, ncol=3, loc='upper left', frameon=False)
ax.set_title(f'21 модуль поза стрінгами → світильники напряму: світловий потік за день ({nf(LD["assume"]["eff"])} лм/Вт, драйвер {nf(LD["assume"]["drv"] * 100)} %)', fontsize=7.4, loc='left', color=INK, weight='bold')
fig.tight_layout(); fig.savefig(V + 'led13.png'); plt.close(fig)
# ---------- HTML
k1, k2, k3, k4 = CC['K1'], CC['K2'], CC['K3'], CC['K4']
TOT27 = 1449097; KWP27 = 1541.76
dN, dM, dS = k1['n'] - k3['n'], k1['mwh'] - k3['mwh'], k1['tot'] - k3['tot']; mpb = dS / (dM * 1000 * C['R']['val'])
dS2, dM2 = k1['tot'] - k2['tot'], k1['mwh'] - k2['mwh']; mpb2 = dS2 / (dM2 * 1000 * C['R']['val'])
NAMES = dict(A_flush='Арка — по даху, як на цеху (вертикально, лаги 0,12 м)', A_south='Арка — трикутники 15° на південь, кожен модуль окремо по дузі',
             L_south='Нижній дах — трикутники 15° на південь, крок 2,1 м', L_ew='Нижній дах — «домік» схід–захід 15°', L_flat='Нижній дах — плоско 0° (довідково)')
VR = ''
for k in ('A_flush', 'A_south', 'L_south', 'L_ew', 'L_flat'):
    v, c = VAR[k], CV[k]
    VR += (f"<tr{' class=sel' if k in ('A_flush', 'L_ew') else ''}><td>{NAMES[k]}</td><td class=n>{v['places']}</td><td class=n>{v['n']} = {v['st']}</td><td class=n>{nf(v['kwp'], 1)}</td>"
           f"<td class=n>{nf(v['mwh'], 1)}</td><td class=n>{v['y']}</td><td class=n>{nf(v['shade'], 1)} %</td><td class=n>{nf(c['tot'])}</td><td class=n>{nf(c['per_kwp'])}</td><td class=n>{nf(c['pb'], 1)}</td></tr>")
CR = ''
for key in ('K1', 'K2', 'K3', 'K4'):
    c = CC[key]
    CR += (f"<tr{' class=sel' if key == 'K1' else ''}><td><b>{key}</b> — {c['name']}</td><td class=n>{c['n']} = {c['st']}</td><td class=n>{nf(c['kwp'], 1)}</td><td class=n>{nf(c['mwh'], 1)}</td>"
           f"<td class=n>{nf(c['tot'])}</td><td class=n>{nf(c['vat'])}</td><td class=n>{nf(c['vat245'])}</td><td class=n>{nf(c['per_kwp'])}</td><td class=n>{nf(c['pb'], 1)}</td></tr>")
# кошторис К1 по розділах
parts = [CV['A_flush'], CV['L_ew']]
sec = dict(china=sum(p['china'] for p in parts), comm=sum(p['comm'] for p in parts), deliv=sum(p['deliv'] for p in parts), ua=sum(p['ua'] for p in parts), works=sum(p['works'] for p in parts))
box_save = (sum(p['boxes'] for p in parts) - k1['boxes']) * (C['R']['box'] + C['line_m'] * C['R']['line_m'])
sec['china'] -= box_save; sec['comm'] -= box_save * 0.05
costK1 = sum(sec.values()); resfee = k1['tot'] - costK1
chK1 = {kk: sum(p['ch'][kk] for p in parts) for kk in parts[0]['ch']}; chK1['box'] -= (sum(p['boxes'] for p in parts) - k1['boxes']) * C['R']['box']; chK1['line'] -= (sum(p['boxes'] for p in parts) - k1['boxes']) * C['line_m'] * C['R']['line_m']
blocks = sum(p['blocks'] for p in parts)
WORKH = round(9 * 5 / 7 * 365)
img = lambda f: 'data:image/png;base64,' + base64.b64encode(open(V + f, 'rb').read()).decode()
H = f'''<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Дах АБК — радіація і розкладка</title><style>
@page {{ size:A4; margin:12mm 13mm 13mm 15mm; }}
body {{ font-family:'DejaVu Sans',sans-serif; font-size:8.2pt; line-height:1.38; color:#1d2a33; margin:0; }}
h1 {{ font-size:13.5pt; margin:0 0 1.5mm; }} h2 {{ font-size:10.3pt; margin:3.2mm 0 1.4mm; padding-bottom:1mm; border-bottom:0.6pt solid #c4ccd3; break-after:avoid; }}
.sub {{ color:#5b6770; font-size:7.8pt; margin-bottom:3mm; }} p {{ margin:0 0 2mm; }} ul,ol {{ margin:0 0 2mm; padding-left:5mm; }} li {{ margin-bottom:0.6mm; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:2.5mm; margin:2mm 0 3mm; }} .tile {{ background:#f3f5f7; border:0.5pt solid #c4ccd3; border-radius:1.5mm; padding:2.2mm 3mm; }}
.tile .v {{ font-size:14.5pt; font-weight:700; line-height:1.15; }} .tile .k {{ font-size:7.3pt; color:#5b6770; }}
.key {{ background:#eef4fb; border:0.6pt solid #b9cde4; padding:2.4mm 4mm; border-radius:1.5mm; margin-bottom:3mm; }} .key ul {{ margin:0; }}
.warn {{ background:#fbf1ea; border:0.6pt solid #e2b79a; padding:2mm 4mm; border-radius:1.5mm; margin-bottom:2mm; font-size:7.8pt; }} .warn ol {{ margin:0; }}
table {{ border-collapse:collapse; width:100%; font-size:7.2pt; margin:1mm 0 2.5mm; break-inside:avoid; }}
th,td {{ border:0.45pt solid #c4ccd3; padding:0.9mm 1.3mm; text-align:left; vertical-align:top; }} th {{ background:#e6ebf0; }} td.n,th.n {{ text-align:right; white-space:nowrap; }}
tr.sel td {{ background:#eef4fb; }} img {{ width:100%; display:block; }} .src {{ font-size:7pt; color:#5b6770; }} .pb {{ break-before:page; }}
.two {{ display:grid; grid-template-columns:42% minmax(0,1fr); gap:4mm; align-items:start; }} .two > div {{ min-width:0; }}
</style></head><body>
<h1>Антарес — дах адмінкорпусу (АБК): радіація, варіанти розкладки модулів і кошторис</h1>
<div class="sub">ТОВ МК «Антарес», м. Київ, вул. Миколи Василенка, 1-А · E-Systems · варіант Б · 27.10.2026 · запит власника 21:44: «розрахувати сонячну радіацію на дахах АБК, розмістити панелі як краще — трикутники чи плоско, кілька варіантів з кошторисом»</div>
<div class="tiles"><div class="tile"><div class="v">{k1['n']}</div><div class="k">модулів у варіанті К1 = {k1['st']} стрінгів × 11, {nf(k1['kwp'], 1)} кВтп</div></div>
<div class="tile"><div class="v">{nf(k1['mwh'], 1)}</div><div class="k">МВт·год за рік ({k1['y']} кВт·год/кВтп)</div></div>
<div class="tile"><div class="v">{nf(k1['tot'])} $</div><div class="k">під ключ без ПДВ ({nf(k1['per_kwp'])} $/кВтп, лише СЕС — УЗЕ вже є)</div></div>
<div class="tile"><div class="v">{nf(k1['pb'], 1)} р.</div><div class="k">окупність цієї частини ({nf(k1['rev'])} $ за рік)</div></div></div>
<div class="key"><b>Найкраще — К1: на арці модулі «по даху», як на цеху, а на нижньому плаському даху — «домік» схід–захід 15°.</b><ul>
<li><b>Більше енергії і грошей.</b> Проти трикутників на обох дахах (К3) — ще {dN} модулів і {nf(dM, 1)} МВт·год за рік за {nf(dS)} $; ця різниця окупається за {nf(mpb, 1)} р.</li>
<li><b>Арка дає більше, ніж дах цеху:</b> {VAR['A_flush']['y']} кВт·год/кВтп проти 913 — немає ліхтарів і дефлекторів, тінь лише від парапетів і вентшахт ({nf(VAR['A_flush']['shade'], 1)} %). Трикутники на арці дають більше на модуль ({VAR['A_south']['y']}), але вміщується лише {VAR['A_south']['places']} модулів проти {VAR['A_flush']['places']}.</li>
<li><b>Та сама система кріплення, що на цеху:</b> лаги на блоках, шпильки через гребінь тримають обидва схили від сповзання — ті самі деталі й бригада. Трикутники на арці (ухил до 15°) треба ставити кожен окремо по дузі, а понад 5° — анкерувати або зв'язувати; у ціні К3 і К4 цього немає.</li>
<li><b>Нижній дах затінений</b> надбудовою сходів, стіною основного блоку і парапетами — у середньому {nf(np.mean(mL))} кВт·год/м² проти {nf(I0L)} без тіней. «Домік» дає {VAR['L_ew']['y']} кВт·год/кВтп, окупність {nf(CV['L_ew']['pb'], 1)} р. Трикутники на південь там вміщують лише {VAR['L_south']['places']} модулів (у стрінг — {VAR['L_south']['n']}). Якщо нижній дах не займати — К2: {k2['n']} модулів, {nf(k2['mwh'], 1)} МВт·год, {nf(k2['tot'])} $.</li></ul></div>
<h2>Варіанти по дахах</h2>
<table><tr><th style="width:35%">Варіант</th><th class=n>Місць</th><th class=n>Модулів = стрінгів</th><th class=n>кВтп</th><th class=n>МВт·год</th><th class=n>кВт·год/ кВтп</th><th class=n>Тінь</th><th class=n>$ без ПДВ</th><th class=n>$/кВтп</th><th class=n>Окуп., р.</th></tr>{VR}</table>
<h2>Комбінації для всього АБК</h2>
<table><tr><th style="width:36%">Комбінація</th><th class=n>Модулів = стрінгів</th><th class=n>кВтп</th><th class=n>МВт·год</th><th class=n>$ без ПДВ</th><th class=n>$ з ПДВ</th><th class=n>$ з «245»</th><th class=n>$/кВтп</th><th class=n>Окуп., р.</th></tr>{CR}</table>
<p class="src">Ставки — кошторис під ключ 27.10 (дах цеху + ліхтарі + склад): модуль 73 $ FOB (+2 %), кріплення «по даху» {nf(C['R']['flush'], 2)} $/модуль (КП 26.10), трикутники ГалКат 15° {nf(C['R']['tri'], 2)} $/модуль (розрахунок 22.10 + 4 притиски), DC {nf(C['R']['dc'])} $ і лотки {nf(C['R']['tray'])} $ на стрінг, щит PV 7/1 437 $, лінія Al {nf(C['R']['line_m'], 2)} $/м × {nf(C['line_m'])} м на щит, комісія 5 %, доставка {nf(C['R']['c_mod'], 2)} $ за модуль + {nf(C['R']['c_oth'], 2)} $ за інше, мито за ставками кошторису, баластний блок 3 $ (+1 %), роботи 50 $/кВт, механізація {nf(C['R']['mech'], 2)} $/модуль, запас 4 % і винагорода 18 %. «245» — модулі без ПДВ. Окупність — 1 кВт·год = 7,00 грн з ПДВ (оцінка власника), ККД PCS 97,5 %, 44,89 грн/$.</p>
<h2>Що К1 змінює для всієї станції</h2>
<table><tr><th style="width:46%"></th><th class=n>Кошторис 27.10</th><th class=n>+ АБК (К1)</th></tr>
<tr><td>Модулів (дах цеху, ліхтарі, склад / + АБК)</td><td class=n>2 112</td><td class=n>{nf(2112 + k1['n'])}</td></tr>
<tr><td>кВтп / на один контейнер Golen</td><td class=n>{nf(KWP27, 1)} / {nf(KWP27 / 3)}</td><td class=n>{nf(KWP27 + k1['kwp'], 1)} / {nf((KWP27 + k1['kwp']) / 3)}</td></tr>
<tr><td>Стрінгів / щитів PV 7/1 (робочих)</td><td class=n>192 / 30</td><td class=n>{192 + k1['st']} / {30 + k1['boxes']}</td></tr>
<tr><td>Під ключ, $ без ПДВ</td><td class=n>{nf(TOT27)}</td><td class=n>{nf(TOT27 + k1['tot'])}</td></tr></table>
<h2>Кошторис К1 по розділах, $ без ПДВ</h2>
<table><tr><th style="width:64%">Розділ</th><th class=n>Сума</th></tr>
<tr><td>Закупівля в Китаї: модулі {nf(math.ceil(k1['n'] * 1.02))} шт. ({nf(chK1['mod'])}), кріплення ({nf(chK1['mount'])}), кабелі DC ({nf(chK1['dc'])}), щити PV {k1['boxes']} шт. ({nf(chK1['box'])}), лінії Al ({nf(chK1['line'])}), лотки ({nf(chK1['tray'])}), блискавкозахист ({nf(chK1['bz'])})</td><td class=n>{nf(sec['china'])}</td></tr>
<tr><td>Комісія 5 %</td><td class=n>{nf(sec['comm'])}</td></tr><tr><td>Доставка, страхування, мито</td><td class=n>{nf(sec['deliv'])}</td></tr>
<tr><td>Україна: баластні блоки {nf(blocks)} шт. з доставкою</td><td class=n>{nf(sec['ua'])}</td></tr><tr><td>Роботи 50 $/кВт і механізація</td><td class=n>{nf(sec['works'])}</td></tr>
<tr><td>Запас 4 % і винагорода 18 %</td><td class=n>{nf(resfee)}</td></tr><tr><td><b>Разом під ключ</b></td><td class=n><b>{nf(k1['tot'])}</b></td></tr></table>
<div class="warn"><b>Що перевірити до рішення</b><ol>
<li>Golen: допустима потужність PV на контейнер ({nf((KWP27 + k1['kwp']) / 3)} кВтп проти 468 у плані 26.10) і вільні входи PV для ще {k1['boxes']} щитів. Без цього АБК не підключити.</li>
<li>Покрівля і несучі конструкції АБК: арка — бітумна рулонна покрівля (фото 27.10); тип покрівлі нижнього даху і чи витримують обидва дахи баласт ({nf(blocks)} блоків по 13 кг) і модулі ({nf(k1['n'] * 36.5 / 1000, 1)} т) — немає в даних.</li>
<li>Висоти АБК (нижній 10,0 м, карниз арки 13,2 м, стріла 1,3 м) — оцінка за поверхами; від них залежить тінь від цеху (вона невелика — лише пізно ввечері).</li>
<li>Де вихід на дах і як ходити між дахами (прийнято 1 м навколо надбудови сходів); ринви з водою біля парапетів — відступ 0,5 м.</li>
<li>Траса ліній від щитів АБК до контейнера K-3 (≈30 м, оцінка за планом).</li></ol></div>
<h2>Карта радіації</h2>
<div class="two"><img src="{img('abk_map.png')}"><div>
<p>Кожна клітинка 0,5 м — сонячна енергія на площину покрівлі за рік з усіма тінями: цех на заході (з ліхтарями на каркасі 13°), ТП-5913, контейнери, власні парапети, надбудова сходів, вентшахти. Та сама модель, що для даху цеху.</p>
<ul><li><b>Арка:</b> у середньому {nf(np.mean(mA))} кВт·год/м² (без тіней — {nf(I0A)}). Найменше — біля східного парапету 0,7 м і біля вентшахт.</li>
<li><b>Нижній дах:</b> {nf(np.mean(mL))} кВт·год/м² (без тіней — {nf(I0L)}), від {nf(mL.min())} за надбудовою сходів до {nf(mL.max())} біля південного парапету.</li>
<li>Цех на заході вищий на ≈6 м, але стоїть за 11,7 м — тінь на АБК лише ввечері, коли сонце низько.</li></ul>
<p class="src">Модель: Meteonorm 8.1 (клімат РП), крок 10 хв, горизонт у 72 напрямках по DSM 0,25 м, альбедо 0,2. Для модулів — температура (U 20), втрати 13,2 %, стрінги по 11 з моделлю байпас-діодів. Для трикутників сусідні ряди теж дають тінь. Відступи: 0,5 м від парапетів, 0,3 м навколо вентшахт, 1 м навколо надбудови сходів.</p></div></div>
<h2 class="pb">Розкладки</h2>
<img src="{img('abk_lay.png')}">
<img src="{img('abk_sec.png')}" style="margin-top:2mm">
<p class="src">«По даху» — модуль вертикально (2 384 мм уздовж арки), колонки по дузі з кроком 1 325 мм, ряди з кроком 2 406 мм, залишки сходу і заходу — в одному стрінгу (різна освітленість {nf(VAR['A_flush']['strings'][-1]['mism'], 1)} %). Трикутники — модуль горизонтально, 1 303 мм по ухилу 15°, нижній край ≈0,15 м над покрівлею (оцінка за ГалКат 15°); на арці кожен модуль нахилений разом з дугою на 0–15° на схід чи захід, стрінги — з модулів однакового нахилу.</p>
<h2 class="pb">Ідея: модулі поза стрінгами → світлодіоди замість ліхтарів</h2>
<p>У розкладці на ліхтарях (каркас 13°) {LD['n']} місце лишається порожнім: залишок ліхтаря не набирає стрінг по 11 (ліхтар 1 — {LD['per_lan']['1']}, ліхтарі 2–4 — по {LD['per_lan']['2']}). Пропозиція власника: поставити туди модулі і підключити їх напряму до світлодіодних світильників під колишнім ліхтарем — світять, коли є сонце.</p>
<div class="tiles"><div class="tile"><div class="v">{nf(LD['kwp'], 1)}</div><div class="k">кВтп: {LD['n']} модулів, кожен — на свою групу світильників</div></div>
<div class="tile"><div class="v">{nf(LD['kwh'] / 1000, 1)}</div><div class="k">МВт·год за рік на світло; у робочі години (будні 8–17) — {nf(LD['kwh_work'] / 1000, 1)}</div></div>
<div class="tile"><div class="v">{nf(LD['cases']['jun_clear']['klm'] / 1000, 2)} млн лм</div><div class="k">у ясний червневий полудень ≈ {LD['cases']['jun_clear']['lux']} лк у середньому по цеху</div></div>
<div class="tile"><div class="v">{nf(LD['hours']['50']['work'])} год</div><div class="k">за рік у робочий час, коли ≥ 50 лк по цеху</div></div></div>
<img src="{img('led13.png')}">
<table><tr><th style="width:52%"></th><th class=n>Ясно</th><th class=n>Хмарно</th></tr>
<tr><td>Червень, полудень: кВт / лк по цеху</td><td class=n>{nf(LD['cases']['jun_clear']['kw'], 1)} / {LD['cases']['jun_clear']['lux']}</td><td class=n>{nf(LD['cases']['jun_cloud']['kw'], 1)} / {LD['cases']['jun_cloud']['lux']}</td></tr>
<tr><td>Грудень, полудень: кВт / лк по цеху</td><td class=n>{nf(LD['cases']['dec_clear']['kw'], 1)} / {LD['cases']['dec_clear']['lux']}</td><td class=n>{nf(LD['cases']['dec_cloud']['kw'], 1)} / {LD['cases']['dec_cloud']['lux']}</td></tr>
<tr><td>Потужність світильників на весь цех ({nf(LD['assume']['shop'])} м²) для 100 / 200 / 300 лк</td><td class=n colspan=2>{nf(LD['need']['100'], 1)} / {nf(LD['need']['200'], 1)} / {nf(LD['need']['300'], 1)} кВт</td></tr>
<tr><td>Скільки модулів дали б 300 лк по всьому цеху лише від сонця</td><td class=n>{LD['mods_for_300_clear']} (червень)</td><td class=n>{LD['mods_for_300_cloud']} (червень)</td></tr></table>
<div class="key"><b>Висновок: ідея робоча для цих {LD['n']} місць, але ліхтарі вона не замінить.</b><ul>
<li><b>Плюси.</b> Без стрінга, без щита і без інвертора: кожен модуль працює сам (≤ 50 В) — коротка проводка вниз, безпечна напруга в цеху; немає втрат на різну освітленість. Світло, як від ліхтаря, — більше, коли більше сонця.</li>
<li><b>Мало світла для цеху.</b> {LD['n']} модулів у ясний червневий полудень — ≈{LD['cases']['jun_clear']['lux']} лк у середньому по цеху, у хмарний грудень — ≈{LD['cases']['dec_cloud']['lux']} лк. Звичайне освітлення від мережі (через нашу станцію) однаково потрібне; сонячні світильники лише додають світла вдень, а основні з датчиком освітленості тоді притухають — економія ≈{nf(LD['kwh_work'] / 1000, 1)} МВт·год за рік.</li>
<li><b>Що вигідніше для цих місць.</b> Об'єднати залишки сусідніх ліхтарів у стрінги — ще {LD['pooled']['n'] - LD['pooled']['base_n']} модулів у станцію (+{nf(LD['pooled']['mwh'] - LD['pooled']['base_mwh'], 1)} МВт·год, уся енергія корисна), але з кабелем між ліхтарями. Тоді на світильники лишається {LD['n'] - (LD['pooled']['n'] - LD['pooled']['base_n'])} місць. Без кабелів між ліхтарями — усі {LD['n']} на світильники.</li>
<li><b>Головне питання — денне світло після ліхтарів.</b> Якщо зараз удень світло в цеху не вмикають, без ліхтарів на 200–300 лк у робочі години піде ≈{nf(LD['need']['200'] * WORKH / 1000)}–{nf(LD['need']['300'] * WORKH / 1000)} МВт·год за рік ({nf(WORKH)} год). Це треба відняти від +208,6 МВт·год модулів на ліхтарях. Норму освітленості для цеху визначає ДБН В.2.5-28 за видом робіт.</li></ul></div>
<div class="warn"><b>Немає в даних — для кошторису світильників</b><ol>
<li>Чи вмикають зараз світло вдень і графік роботи цеху (прийнято будні 8–17); що роблять у цеху (норма освітленості).</li>
<li>Світильник (прийнято {nf(LD['assume']['eff'])} лм/Вт) і DC-драйвер, що працює напряму від модуля 30–50 В з пошуком максимальної потужності (прийнято ККД {nf(LD['assume']['drv'] * 100)} %), — ціни і постачальник.</li>
<li>Коефіцієнт використання світла в цеху (прийнято {nf(LD['assume']['uf'], 2)}) — від висоти підвісу і кольору стін; точніше — світлотехнічний розрахунок.</li></ol></div>
<p class="src">Розрахунок — calc/v3/led13.py: ті самі {LD['n']} місць і модель, що в розкладці ліхтарів 13°; кожен модуль окремо, крок 10 хв, ясні й хмарні дні як у кліматі РП.</p>
</body></html>'''
open(V + 'abk.html', 'w', encoding='utf-8').write(H)
OUT = V + 'Розрахунок_радіації_і_розкладки_модулів_на_даху_АБК_варіанти_кошторис_і_світлодіоди_від_модулів_Антарес_27.10.2026.pdf'
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + V + 'abk.html'); await pg.wait_for_timeout(500)
        await pg.pdf(path=OUT, format='A4', print_background=True, prefer_css_page_size=True); await b.close()
asyncio.run(main()); print(OUT)
