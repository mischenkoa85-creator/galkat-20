# -*- coding: utf-8 -*-
"""Об'єднання BESS площадок 11 і 20 у загальній 3D-моделі (3d/index.html).

Площадка 20: BESS і PCS Golen строго навпроти ГПУ — геометрія береться зі сторінки «ГПУ, BESS і КЛ-6 кВ»
(gpu/index.html, блок GEO у системі координат тому КБ) і переводиться в систему площадки:
  site = O + x·EU + y·EV,  відмітка в 3D = z_KB + 3,2  (O, EU — SITE20.gpu.frame / eu).
Замість старих «місць А і В» — шар «BESS · площадка 20»: контейнери з фасадами, фундаменти, вимощення,
сходинки, кабельний канал, ділянки під демонтаж; у мережах — нові КЛ-6 кВ і зв'язок до РП «Алюміній»,
перекладені в обхід BESS існуючі КЛ і перенесений поворот газопроводу.
Площадка 11: BESS 1, BESS 2, КТП і КРУН виносяться з групи СЕС в окремий шар «BESS · площадка 11».
Додає вид «BESS 11 і 20», розділ з таблицею, підписи і перехресні посилання.

Запуск з кореня репозиторію:  python3 3d/tools/apply_bess_11_20.py
"""
import json, math, re, sys
import numpy as np

P3 = '3d/index.html'
PG = 'gpu/index.html'
s = open(P3, encoding='utf-8').read()
if 'D.bess20' in s:
    sys.exit('вже застосовано')

# ------------------------------------------------------------------ дані
i0 = s.index('window.SITE20=') + len('window.SITE20=')
i1 = s.index('\n', i0)
raw = s[i0:i1].rstrip()
semi = raw.endswith(';')
D = json.loads(raw.rstrip(';'))
g = open(PG, encoding='utf-8').read()
k = g.index('const GEO=') + len('const GEO=')
GEO, _ = json.JSONDecoder().raw_decode(g[k:])

O = np.array(D['gpu']['frame']['o']); EU = np.array(D['gpu']['eu']); EV = np.array([-EU[1], EU[0]])
Z0 = D['gpu']['frame']['z0']                         # 3,2: ±0,000 тому КБ (320,200) − DATUM 317,0
ANG = math.atan2(EU[1], EU[0])
r2 = lambda v: round(float(v), 2)
r3 = lambda v: round(float(v), 3)


def site(x, y):
    p = O + x * EU + y * EV
    return [r3(p[0]), r3(p[1])]


def sh(z):
    return r2(z + Z0)


def length(pts):
    return sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))


def nl(i, c, p, info, kv=None, o=''):
    """лінія мережі у форматі SITE20.net.lines з точок [x, y, z] у системі КБ"""
    xy = [site(q[0], q[1]) for q in p]
    return {'i': i, 'c': c, 'xy': xy, 'z': [sh(q[2]) for q in p], 'd': None, 'm': None, 'n': None, 'kv': kv, 'o': o,
            'x': False, 'zs': 'глибина за проектом', 'len': r2(length(xy)), 'info': info}


S0 = GEO['bess'][0]
GB = S0['gb']                                        # −0,45 у системі КБ = 319,75 м абс.
G3 = sh(GB)
LF, BF = 6.158, 2.538
CAL = GEO['calc']
f1 = lambda v: ('%.1f' % v).replace('.', ',')

bess_c, pcs_c = S0['bess'], S0['pcs']
units = [
    {'k': 'bess', 'c': site(*bess_c), 'g': G3,
     'info': 'Контейнер BESS · площадка 20 · Golen Power, Annex 1: 5 015 кВт·год, 6058 × 2438 × 2896 мм, ≈ 43 т; '
             'строго навпроти ГПУ-1 (вісь BESS — у створі ГПУ-1); три двостулкові двері з півдня, дві — у західному '
             'торці; фундамент Golen — обв’язувальна балка, 8 колон і цегляне заповнення, верх +0,300. Детально — '
             'сторінка «ГПУ, BESS і КЛ-6 кВ».'},
    {'k': 'pcs', 'c': site(*pcs_c), 'g': G3,
     'info': 'Блок PCS + трансформатор 6 кВ · площадка 20 · Golen Power, Annex 1: 1 725 кВт, 6 кВ, '
             '6058 × 2438 × 2896 мм, ≈ 17 т; навпроти ГПУ-2; відсік LV / HV — на західному торці, звідси КЛ-6 кВ BESS '
             'і канал зв’язку йдуть до РП «Алюміній». Детально — сторінка «ГПУ, BESS і КЛ-6 кВ».'},
]


def kbox(x0, y0, x1, y1, z0, z1, kind, info):
    c = site((x0 + x1) / 2, (y0 + y1) / 2)
    return {'c': c, 'w': r3(abs(x1 - x0)), 'd': r3(abs(y1 - y0)), 'y0': sh(z0), 'h': r3(z1 - z0), 'k': kind, 'info': info}


boxes = []
fi = ('Фундамент {} · площадка 20 · за кресленням Golen: обв’язувальна балка 350 × 350, 8 колон, цегляне заповнення, '
      'верх +0,300 (319,75 + 0,30); 6158 × 2538 мм; глибина — варіант 1 (1,80 м, як у Golen) або 2 (1,50 м), '
      'специфікація — на сторінці «ГПУ, BESS і КЛ-6 кВ».')
for c, nm in ((bess_c, 'BESS'), (pcs_c, 'PCS')):
    boxes.append(kbox(c[0] - LF / 2, c[1] - BF / 2, c[0] + LF / 2, c[1] + BF / 2, GB, GB + 0.3, 'found', fi.format(nm)))
x0 = bess_c[0] - LF / 2; ys = bess_c[1] - 0.8
for w, h in ((0.3, 0.3), (0.6, 0.15)):
    boxes.append(kbox(x0 - w, ys, x0, ys + 1.6, GB, GB + h, 'step',
                      'Сходинки Golen 2 × (300 × 150) біля західного торця BESS — з креслення фундаменту Golen.'))
AP = GEO['apron']
for st in AP['steps']:
    a, b = st['a'], st['b']
    boxes.append(kbox(min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1]), GB, GB + AP['riser'], 'step',
                      'Сходинка біля дверей · ' + st['id'] + ' · висота 150 мм над вимощенням, бетон — майданчик обслуговування BESS.'))
# кабельний канал між фундаментами: кришки на рівні вимощення
cx = pcs_c[0]; ya = bess_c[1] + BF / 2; yb = pcs_c[1] - BF / 2
LCH = round((yb - ya) * 100) * 10; NSL = math.ceil(LCH / 500)
ci = ('Кабельний канал 600 × 800 між фундаментами BESS і PCS · довжина {} м, {} збірних кришок; DC 8 × (1 × 300 мм² Cu), '
      'слабкі струми на полиці; вводи у фундаменти — трубами з резервними протяжками. Попередній розрахунок, не дані Golen.'
      ).format(f1(yb - ya), NSL)
for n in range(NSL):
    y1 = ya + (yb - ya) * n / NSL + 0.006; y2 = ya + (yb - ya) * (n + 1) / NSL - 0.006
    boxes.append(kbox(cx - 0.4, y1, cx + 0.4, y2, GB - 0.06, GB + 0.02, 'lid', ci))

apron = {'outer': [site(*q) for q in AP['outer']], 'holes': [[site(*q) for q in h] for h in AP['holes']], 'y': G3,
         'info': 'Вимощення — майданчик обслуговування BESS і PCS · площадка 20 · бетон 150 мм по щебеню і піску, сітка; '
                 'ширина від фундаментів: захід 1,5 м, південь і північ 1,2 м, схід 0,7 м; {} м²; не над газопроводом '
                 'і не над муфтами КЛ.'.format(f1(AP['area']))}

# ділянки під демонтаж (кабелі під BESS і старий поворот газопроводу)
dem = []
for L in GEO['lines']:
    if L.get('rel') and length(L['p']) > 0.2:
        what = ('Існуюча КЛ 6 кВ, кабель ' + L.get('cab', '')) if L['c'] == 'cable6' else 'Газопровід від ШРП, старий поворот'
        dem.append({'xy': [site(q[0], q[1]) for q in L['p']],
                    'info': 'Демонтувати · {} — ділянка під BESS / біля фундаменту, {} м; замість неї — нова ділянка в обхід '
                            '(показано в шарі «Мережі»).'.format(what, f1(length(L['p'])))})

lab = site(bess_c[0], (bess_c[1] + pcs_c[1]) / 2)
D['bess20'] = {'ang': ANG, 'units': units, 'boxes': boxes, 'apron': apron, 'dem': dem,
               'label': {'x': lab[0], 'y': lab[1], 'top': r2(G3 + 0.3 + 2.896 + 4.2)},
               'kw': 1725, 'kwh': 5015}
del D['bess']
for L in D['elabels']:
    if L['t'] in ('КРУН 6 кВ', 'КТП 2×1000', 'BESS 1, 2'):
        L['b11'] = True
        if L['t'] == 'BESS 1, 2':
            L['t'] = 'BESS 1, 2 · площадка 11'; L['sub'] = '2 × Golen LES-H20 · 1 000 кВт / 2 410 кВт·год · ГП 08.10.2026'

# ------------------------------------------------------------------ мережі
lines = D['net']['lines']
ids = {}
for n_, L in enumerate(lines):
    ids.setdefault(L['i'], []).append(n_)

# газопровід 117: обрізати старий поворот біля BESS (останню точку) — далі нова ділянка 9118 і продовження 9117
L117 = lines[ids[117][0]]
L117['xy'] = L117['xy'][:-1]; L117['z'] = L117['z'][:-1]; L117['len'] = r2(length(L117['xy']))
geo_by = {}
for L in GEO['lines']:
    geo_by.setdefault(L['i'], []).append(L)
gnew = geo_by[9118][0]; gtail = geo_by[9117][0]
new = [
    nl(9118, 'gas', gnew['p'], 'Газопровід від ШРП — перекладання повороту (проект) · нова ділянка {} м: поворот перенесено '
       'на 2,6 м на південь (до y ≈ 1,6 у системі тому КБ), щоб BESS не стояв над газопроводом; відстань від фундаменту '
       'BESS — понад 2 м (охоронна зона), розробка ґрунту в зоні 2 м — вручну. Глибина 1,2 м умовно.'.format(f1(length(gnew['p'])))),
    nl(9117, 'gas', gtail['p'], 'Газопровід до ШРП · продовження за генпланом 2023, {} м; глибина 1,2 м умовно.'.format(f1(length(gtail['p'])))),
]
# існуючі КЛ 6 кВ 228–235: ділянки під BESS прибираються, нові — в обхід зі сходу
keep = {}
for i in range(228, 236):
    keep[i] = [L for L in geo_by.get(i, []) if not L.get('rel') and length(L['p']) > 0.05]
rm = []
for i in range(228, 236):
    for n_ in ids.get(i, []):
        rm.append(n_)
for n_ in sorted(rm, reverse=True):
    old = lines.pop(n_)
for i in range(228, 236):
    for L in keep[i]:
        q = nl(i, 'cable6', L['p'], None, kv=6)
        q['zs'] = 'умовна глибина 0.8 м'; del q['info']
        new.append(q)
RT = GEO['route']
for n_, R in enumerate(RT['reroute']):
    new.append(nl(9300 + n_, 'cable6', R['p'],
                  'Кабелі 6 кВ · {} — перекладено в обхід BESS зі сходу (проект): нова ділянка {} м замість {} м під '
                  'BESS, дві з’єднувальні муфти; глибина 1,2 м, у місцях перетину — у трубах.'.format(
                      R['id'].replace('існуюча ', 'існуюча '), f1(R['L']), f1(R['Lold'])), kv=6, o='перекладено в обхід BESS'))
# нові КЛ-6 кВ і зв'язок до РП «Алюміній»
kl = {L['id']: L for L in RT['kl']}
lens = {L['id']: L for L in CAL.get('lines', [])} if isinstance(CAL.get('lines'), list) else {}
for n_, T in enumerate(RT['trunk']):
    p = (kl[T['id']]['p'] + T['p'][1:]) if T['id'] in kl else T['p']
    src = 'від ' + kl[T['id']]['from'] if T['id'] in kl else 'від відсіку LV / HV блока PCS'
    new.append(nl(9400 + n_, 'cable6', p,
                  'Кабелі 6 кВ · {} (проект) · {} до РП «Алюміній»: траса {} м у плані{}; під проїздом — '
                  'горизонтальний прокол {} м на глибині ≈ {} м у трубі ПЕ; у траншеї — 0,9 м. Детально — сторінка '
                  '«ГПУ, BESS і КЛ-6 кВ».'.format(T['id'], src, f1(length(p)),
                                                  (', з них від муфти {} м ({} м з урахуванням глибини)'.format(f1(T['L']), f1(T['Lz']))
                                                   if T['id'] in kl else ' ({} м з урахуванням глибини)'.format(f1(T['Lz']))),
                                                  f1(RT['bore']['L']), f1(RT['bore']['dep'])), kv=6, o='проект'))
for n_, C in enumerate(RT['comms']):
    new.append(nl(9500 + n_, 'cable', C['p'],
                  'Інші кабелі · {} (проект) · канал зв’язку ГПУ — EMS — РП «Алюміній», {} м, у трубі; глибина 0,8 м, '
                  'під проїздом — у спільному проколі з КЛ-6 кВ.'.format(C['id'], f1(length(C['p'])))))
lines.extend(new)

out = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
s = s[:i0] + out + (';' if semi else '') + s[i1:]


# ------------------------------------------------------------------ код
def rep(old, new_, cnt=1):
    global s
    n = s.count(old)
    if n != cnt:
        sys.exit('не знайдено (%d): %s' % (n, old[:90]))
    s = s.replace(old, new_)


# шари
rep('<label class="chip"><input type="checkbox" id="lyrBessV" checked><span class="sw"></span>BESS · місце В</label>\n'
    '        <label class="chip"><input type="checkbox" id="lyrBessA"><span class="sw"></span>BESS · місце А</label>',
    '<label class="chip"><input type="checkbox" id="lyrBess20" checked><span class="sw"></span>BESS · площадка 20</label>\n'
    '        <label class="chip"><input type="checkbox" id="lyrBess11" checked><span class="sw"></span>BESS · площадка 11</label>')
rep('bessV: new THREE.Group(),\n      bessA: new THREE.Group(), ', 'bess20: new THREE.Group(),\n      ')

# побудова BESS площадки 20
a = s.index("    // ---------------- BESS (Golen, два місця з моделі «РП-1198, ГПУ і BESS») ----------------")
b = s.index("    });\n    });\n", a) + len("    });\n    });\n")
JS20 = r'''    // ---------------- BESS площадки 20 (Golen, Annex 1): строго навпроти ГПУ — з моделі «ГПУ, BESS і КЛ-6 кВ» ----------------
    if (D.bess20) {
      const B = D.bess20, LB = layers.bess20, BL = 6.058, BB = 2.438, BH = 2.896, LE = 3.119, hasDocB = typeof document !== 'undefined';
      const mS = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .6, metalness: .2 }, o || {}));
      const MB = { frame: mS(0x38424a, { metalness: .5 }), steel: mS(0x8d969c, { metalness: .6, roughness: .4 }), alu: mS(0xc4cacd, { metalness: .6, roughness: .35 }),
        found: mS(0xa7abad, { roughness: .9, metalness: 0 }), step: mS(0xb3b6b4, { roughness: .9, metalness: 0 }), lid: mS(0xc9cdd0, { roughness: .9, metalness: 0 }),
        apron: mS(0xaeb1ab, { roughness: .95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
        dem: mS(0xd0021b, { metalness: 0, emissive: 0x6a0010, emissiveIntensity: .4 }) };
      const canv = (Lm, Hm, draw) => { if (!hasDocB) return null; const PX = 60, c = document.createElement('canvas'); c.width = Math.max(8, Math.round(Lm * PX)); c.height = Math.max(8, Math.round(Hm * PX));
        const g = c.getContext('2d'), X = m => m * PX, Y = m => c.height - m * PX; draw(g, X, Y, c); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };
      const corr = (g, X, Y, c, base) => { g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
        for (let x = 0; x < c.width; x += X(0.14)) { g.fillStyle = 'rgba(80,88,94,.16)'; g.fillRect(x, 0, X(0.05), c.height); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x + X(0.07), 0, X(0.02), c.height); }
        g.fillStyle = '#38424a'; g.fillRect(0, 0, c.width, X(0.12)); g.fillRect(0, Y(0.16), c.width, X(0.16)); g.fillRect(0, 0, X(0.16), c.height); g.fillRect(c.width - X(0.16), 0, X(0.16), c.height); };
      const door = (g, X, Y, s0, w, h, o) => { o = o || {};
        g.fillStyle = o.fill || '#eef1f3'; g.fillRect(X(s0), Y(0.2 + h), X(w), X(h));
        if (o.louver) { g.fillStyle = '#7f888f'; for (let z = 0.3; z < h; z += 0.09) g.fillRect(X(s0 + 0.06), Y(0.2 + z), X(w - 0.12), 2); }
        if (o.fans) [1.7, 1.05].forEach(b2 => { g.fillStyle = '#2a333c'; g.beginPath(); g.arc(X(s0 + w * 0.5), Y(0.2 + b2), X(0.26), 0, 7); g.fill(); });
        g.strokeStyle = '#4f585d'; g.lineWidth = 3; g.strokeRect(X(s0), Y(0.2 + h), X(w), X(h));
        if (o.dbl) { g.beginPath(); g.moveTo(X(s0 + w / 2), Y(0.2 + h)); g.lineTo(X(s0 + w / 2), Y(0.2)); g.stroke(); }
        g.fillStyle = '#2b3238'; (o.dbl ? [s0 + w / 2 - 0.12, s0 + w / 2 + 0.09] : [s0 + w - 0.14]).forEach(x => g.fillRect(X(x), Y(1.35), X(0.03), X(0.32)));
        g.fillStyle = '#f2c230'; const tx = s0 + w / 2; g.beginPath(); g.moveTo(X(tx), Y(0.2 + h + 0.28)); g.lineTo(X(tx - 0.12), Y(0.2 + h + 0.08)); g.lineTo(X(tx + 0.12), Y(0.2 + h + 0.08)); g.closePath(); g.fill(); };
      const txt = (g, X, Y, t, x, z, sz, col) => { g.fillStyle = col || '#24435f'; g.font = 'bold ' + Math.round(X(sz)) + 'px "PT Sans Narrow","Arial Narrow",Arial,sans-serif'; g.textAlign = 'center'; g.fillText(t, X(x), Y(z)); };
      const tm = t => t ? new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, roughness: .55, metalness: .15 }) : MB.alu;
      const bessMats = () => [
        tm(canv(BB, BH, (g, X, Y, c) => corr(g, X, Y, c, '#e9edf0'))),
        tm(canv(BB, BH, (g, X, Y, c) => { corr(g, X, Y, c, '#e9edf0'); door(g, X, Y, 0.143, 0.865, 2.42, {}); door(g, X, Y, 1.031, 1.245, 2.42, { fans: 1 }); })),
        tm(canv(BL, BB, (g, X, Y, c) => { g.fillStyle = '#dfe3e6'; g.fillRect(0, 0, c.width, c.height); txt(g, X, Y, 'BESS', BL / 2, BB / 2 - 0.14, 0.5, '#7a4300'); })), MB.frame,
        tm(canv(BL, BH, (g, X, Y, c) => { corr(g, X, Y, c, '#e9edf0'); [[0.570, 2.311], [2.361, 4.104], [4.153, 5.933]].forEach(p => door(g, X, Y, p[0], p[1] - p[0], 2.42, { dbl: 1 })); txt(g, X, Y, 'BESS · 5 015 кВт·год', BL / 2, 2.72, 0.16); })),
        tm(canv(BL, BH, (g, X, Y, c) => { corr(g, X, Y, c, '#e9edf0'); txt(g, X, Y, 'BESS', BL / 2, 1.6, 0.42); }))];
      const pcsMats = () => [
        tm(canv(BB, BH - 0.28, (g, X, Y, c) => corr(g, X, Y, c, '#dde2e6'))),
        tm(canv(BB, BH - 0.28, (g, X, Y, c) => { corr(g, X, Y, c, '#dde2e6'); door(g, X, Y, 0.06, 2.31, 2.2, { dbl: 1 }); txt(g, X, Y, 'LV / HV 6 кВ', BB / 2, 2.42, 0.15); })),
        tm(canv(LE, BB, (g, X, Y, c) => { g.fillStyle = '#d4d9dc'; g.fillRect(0, 0, c.width, c.height); txt(g, X, Y, 'PCS', LE / 2, BB / 2 - 0.12, 0.42, '#7a4300'); })), MB.frame,
        tm(canv(LE, BH - 0.28, (g, X, Y, c) => { corr(g, X, Y, c, '#dde2e6'); door(g, X, Y, 1.420, 1.424, 2.2, { dbl: 1, louver: 1, fill: '#9aa3a8' }); })),
        tm(canv(LE, BH - 0.28, (g, X, Y, c) => { corr(g, X, Y, c, '#dde2e6'); door(g, X, Y, LE - 2.800, 1.58, 2.2, { dbl: 1, louver: 1, fill: '#9aa3a8' }); }))];
      const cabT = canv(2.85, 2.25, (g, X, Y, c) => { g.fillStyle = '#e6eaed'; g.fillRect(0, 0, c.width, c.height); [0, 0.728, 1.456, 2.177].forEach(x => { g.strokeStyle = '#4f585d'; g.lineWidth = 3; g.strokeRect(X(x + 0.03), Y(2.15), X(0.64), X(2.0)); g.fillStyle = '#3fbf7f'; g.fillRect(X(x + 0.5), Y(1.9), X(0.05), X(0.05)); }); txt(g, X, Y, 'PCS', 1.42, 2.02, 0.14); });
      const edgeM = new THREE.LineBasicMaterial({ color: 0x2b3238, transparent: true, opacity: .55 });
      const unit = u => {
        const grp = new THREE.Group(); grp.position.set(u.c[0], u.g + 0.3, -u.c[1]); grp.rotation.y = B.ang; grp.name = 'BESS20_' + u.k;
        const add = (w, h, d, mat, x, y, z, edge) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x + w / 2 - BL / 2, y + h / 2, z + d / 2 - BB / 2); m.castShadow = true; m.receiveShadow = true;
          m.userData.info = u.info; m.userData.matFacade = mat; m.userData.matSource = srcMat.drawings; pickables.push(m); grp.add(m);
          if (edge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeM); e.position.copy(m.position); grp.add(e); } return m; };
        if (u.k === 'bess') add(BL, BH, BB, bessMats(), 0, 0, 0, 1);
        else {
          add(LE, BH - 0.28, BB, pcsMats(), 0, 0.16, 0, 1);
          add(BL, 0.16, BB, MB.frame, 0, 0, 0); add(BL - LE, 0.02, BB - 0.06, MB.steel, LE, 0.16, 0.03);
          [[BL - 0.16, 0], [BL - 0.16, BB - 0.16], [LE - 0.12, 0], [LE - 0.12, BB - 0.12]].forEach(p => add(0.16, BH - 0.12, 0.16, MB.frame, p[0], 0, p[1]));
          add(BL - LE, 0.12, BB, MB.frame, LE, BH - 0.12, 0); add(BL - LE - 0.1, 0.02, BB - 0.1, MB.alu, LE + 0.05, BH - 0.02, 0.05);
          const ct = tm(cabT); add(2.847, 2.25, 1.263, [MB.frame, MB.frame, MB.alu, MB.frame, ct, ct], 3.166, 0.18, 0.549, 1);
        }
        LB.add(grp);
      };
      B.units.forEach(unit);
      B.boxes.forEach((q, n) => placeBox(LB, q.w, q.h, q.d, q.c[0], q.c[1], q.y0, MB[q.k] || MB.found, 'BESS20_' + q.k + '_' + n, q.info, B.ang));
      { const A = B.apron, sh = new THREE.Shape(A.outer.map(q => new THREE.Vector2(q[0], q[1])));
        A.holes.forEach(hh => sh.holes.push(new THREE.Path(hh.map(q => new THREE.Vector2(q[0], q[1])))));
        const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(geo, MB.apron); m.position.y = A.y + 0.03; m.receiveShadow = true; m.name = 'BESS20_apron';
        m.userData.info = A.info; m.userData.matFacade = MB.apron; m.userData.matSource = srcMat.drawings; pickables.push(m); LB.add(m); }
      B.dem.forEach((q, n) => {
        const pts = q.xy.map(p => new THREE.Vector3(p[0], terrainAt(p[0], p[1]) + 0.6, -p[1]));
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.01), Math.max(4, pts.length * 3), 0.14, 6, false), MB.dem);
        m.name = 'BESS20_dem_' + n; m.userData.info = q.info; m.userData.matFacade = MB.dem; m.userData.matSource = MB.dem; pickables.push(m); LB.add(m);
      });
    }
'''
s = s[:a] + JS20 + s[b:]

# СЕС: BESS, КТП і КРУН площадки 11 — в окрему групу (не ховаються з «Без СЕС»)
rep("    const eq = new THREE.Group(); eq.name = 'ground_equipment'; group.add(eq);",
    "    const eq = new THREE.Group(); eq.name = 'ground_equipment'; group.add(eq);\n"
    "    const eq11 = new THREE.Group(); eq11.name = 'bess11';                // BESS, КТП і КРУН — окремий шар «BESS · площадка 11»")
rep("pad.userData.info = o.info; eq.add(pad); }", "pad.userData.info = o.info; eq11.add(pad); }")
rep("roof.userData.info = o.info; eq.add(roof); pick.push(roof); }", "roof.userData.info = o.info; eq11.add(roof); pick.push(roof); }")
rep("      }\n      eq.add(m);\n    });", "      }\n      (o.k === 'bess' || o.k === 'krun' || o.k === 'ktp' ? eq11 : eq).add(m);\n    });")
rep("    return { group, pick, setState, infoAt, roofOf, selectRoof, roofCentre, labelPoint, zones: zonesG, roofs: RF,",
    "    return { group, bess11: eq11, pick, setState, infoAt, roofOf, selectRoof, roofCentre, labelPoint, zones: zonesG, roofs: RF,")
rep("  const SES = buildSES(THREE, D.ses);\n  scene.add(SES.group);",
    "  const SES = buildSES(THREE, D.ses);\n  scene.add(SES.group); scene.add(SES.bess11);")
rep("ray.intersectObjects([PHC.group, SES.group, FEN.group, SITE.group,", "ray.intersectObjects([PHC.group, SES.group, SES.bess11, FEN.group, SITE.group,")

# мережі: власний опис для нових ліній
rep("    function lineInfo(L) {\n", "    function lineInfo(L) {\n      if (L.info) return L.info;\n")

# підписи
rep("  const bessV = D.bess.find(b => b.key === 'V').items[0].c, bessA = D.bess.find(b => b.key === 'A').items[0].c;\n",
    "  const B20 = D.bess20.label;\n")
rep("    extraLabels.push(['bessV', label('BESS · місце В', new THREE.Vector3(bessV[0], 9, -bessV[1]), 1.0, 'основне, не вибране')]);\n"
    "    extraLabels.push(['bessA', label('BESS · місце А', new THREE.Vector3(bessA[0], 9, -bessA[1]), 1.0, 'запасне, не вибране')]);\n",
    "    extraLabels.push(['bess20', label('BESS · площадка 20', new THREE.Vector3(B20.x, B20.top, -B20.y), 1.0, 'Golen · 1 725 кВт / 5 015 кВт·год · навпроти ГПУ', 'planned')]);\n"
    )
rep("    (D.elabels || []).forEach(L => extraLabels.push([L.planned ? 'energyP' : 'energy',",
    "    (D.elabels || []).forEach(L => extraLabels.push([L.b11 ? 'bess11' : L.planned ? 'energyP' : 'energy',")
rep("k === 'bessV' ? isOn('lyrBessV') : k === 'bessA' ? isOn('lyrBessA') :", "k === 'bess20' ? isOn('lyrBess20') : k === 'bess11' ? isOn('lyrBess11') :")
rep("  bind('lyrBessV', on => { SITE.layers.bessV.visible = on; });\n  bind('lyrBessA', on => { SITE.layers.bessA.visible = on; });\n",
    "  bind('lyrBess20', on => { SITE.layers.bess20.visible = on; });\n  bind('lyrBess11', on => { SES.bess11.visible = on; });\n")

# види
rep('        <button class="btn" type="button" data-view="gpu">ГПУ і BESS</button>\n',
    '        <button class="btn" type="button" data-view="gpu">ГПУ і BESS</button>\n'
    '        <button class="btn" type="button" data-view="bess">BESS 11 і 20</button>\n')
rep("    gpu: { t: V(-88, 50, 5), p: V(-63, 29, 21) },\n",
    "    gpu: { t: V(-80, 50, 5), p: V(-52, 22, 26) },\n"
    "    bess: { t: V(-40, -30, 2), p: V(45, -168, 168) },\n"
    "    bess20: { t: V(-67.5, 51, 4), p: V(-44, 27, 20) },\n"
    "    bess11: { t: V(-4.5, -92, 5), p: V(-30, -112, 19) },\n")
# #bess у посиланні — одразу вид «BESS 11 і 20»
rep("  resize(); setView(VIEWS.site, true);\n",
    "  resize(); setView(VIEWS.site, true);\n"
    "  if (location.hash === '#bess') { setView(VIEWS.bess, true); document.querySelectorAll('[data-view]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.view === 'bess'))); }\n")

# факти, тексти
rep("    ['Рельєф', '317,2…322,6 м абс.'],\n", "    ['Рельєф', '317,2…322,6 м абс.'],\n    ['BESS (проект)', '2 725 кВт · 7 425 кВт·год · площадки 11 і 20'],\n")
rep('BESS і КТП, дахова СЕС', 'BESS площадок 11 і 20, КТП, дахова СЕС')
rep('BESS — контейнери Golen на двох можливих місцях із моделі «РП-1198, ГПУ і BESS»; остаточне місце не вибране.',
    'BESS площадки 20 — контейнер BESS і блок PCS Golen (Annex 1) строго навпроти ГПУ-1 і ГПУ-2, на фундаментах Golen з '
    'вимощенням, сходинками й кабельним каналом між ними; у шарі мереж — нові КЛ-6 кВ від ГПУ і BESS та канал зв’язку до '
    'РП «Алюміній» (прокол під проїздом), дві існуючі КЛ 6 кВ, перекладені в обхід BESS, і перенесений поворот газопроводу '
    'від ШРП; ділянки під демонтаж — червоним. Усе — з моделі «ГПУ, BESS і КЛ-6 кВ» (сторінка gpu/), система координат '
    'тому КБ переведена в систему площадки за плитами ГПУ.')

SEC = '''
  <section aria-labelledby="h-bess">
    <h2 id="h-bess">BESS на площадках 11 і 20</h2>
    <p class="note">Накопичувачі енергії обох площадок — на одній моделі, кожна площадка окремим шаром («BESS · площадка 11», «BESS · площадка 20»). Вид «BESS 11 і 20» показує обидві; натисніть на рядок — модель наблизиться до обладнання. Усе обладнання — проект, станом на 14.10.2026 не встановлено.</p>
    <div class="tbl-wrap" style="max-height:none">
      <table class="sestab">
        <thead><tr><th>Площадка</th><th>Обладнання</th><th>кВт</th><th>кВт·год</th><th>Габарит, маса</th><th>Підключення</th><th>Звідки</th></tr></thead>
        <tbody id="bessRows"></tbody>
      </table>
    </div>
    <p class="note">Площадка 20 детально — на сторінці <a href="../gpu/">«ГПУ, BESS і КЛ-6 кВ»</a>: фундаменти двох варіантів глибини, вводи кабелів у трубах, кабельний канал, заземлення, траса КЛ-6 кВ і зв’язку з перевіркою відстаней, перекладання існуючих КЛ і газопроводу. Креслення: <a href="../gpu/kreslennya-trasa-kl6-bess-fundamenty.pdf">комплект, 10 аркушів A3</a>; фундамент для друку — <a href="../gpu/kreslennya-fundament-bess-var1-1-80.pdf">варіант 1</a>, <a href="../gpu/kreslennya-fundament-bess-var2-1-50.pdf">варіант 2</a>; <a href="../gpu/specyfikatsiia-robit-fundamenty-bess.pdf">специфікація матеріалів і перелік робіт</a>.</p>
  </section>
'''
anchor = '  <section aria-labelledby="h-ph">'
rep(anchor, SEC.lstrip('\n') + '\n' + anchor)

JSROWS = r'''
  // ----- BESS площадок 11 і 20: таблиця -----
  {
    const EQ = D.ses.equip.filter(o => o.k === 'bess' || o.k === 'ktp' || o.k === 'krun');
    const R = [
      ['20', 'BESS · контейнер 20 футів', '—', '5 015', '6058 × 2438 × 2896 мм, ≈ 43 т', 'DC — каналом 600 × 800 до PCS', 'Golen, Annex 1; строго навпроти ГПУ-1', 'bess20'],
      ['20', 'PCS + трансформатор 6 кВ', '1 725', '—', '6058 × 2438 × 2896 мм, ≈ 17 т', 'КЛ-6 кВ BESS до РП «Алюміній», прокол під проїздом', 'Golen, Annex 1; навпроти ГПУ-2', 'bess20']
    ];
    EQ.filter(o => o.k === 'bess').forEach(o => R.push(['11', o.name + ' · LES-H20-1205W500C-PS-EU', '500', '1 205', '6058 × 2438 × 2896 мм, ≈ 20 т', '6 кВ: КРУН → КТП → BESS', 'ОС-108-ЕТР, ГП 08.10.2026', 'bess11']));
    EQ.filter(o => o.k === 'ktp').forEach(o => R.push(['11', o.name + ' кВА', '—', '—', `${fmt(o.w, 2)} × ${fmt(o.d, 2)} м`, 'від КРУН 6 кВ', 'ГП 08.10.2026', 'bess11']));
    EQ.filter(o => o.k === 'krun').forEach(o => R.push(['11', 'КРУН 6 кВ', '—', '—', `${fmt(o.w, 2)} × ${fmt(o.d, 2)} м`, 'ввід 6 кВ площадки 11', 'ГП 08.10.2026', 'bess11']));
    R.push(['', '<b>Разом BESS</b>', '<b>2 725</b>', '<b>7 425</b>', '', '', '', 'bess']);
    const tb = document.getElementById('bessRows');
    R.forEach(r => { const tr = document.createElement('tr'); tr.tabIndex = 0; tr.style.cursor = 'pointer';
      tr.innerHTML = r.slice(0, 7).map((c, j) => `<td${j >= 2 && j <= 3 ? ' style="text-align:right"' : ''}>${c}</td>`).join('');
      const go = () => { setView(VIEWS[r[7]]); document.querySelectorAll('[data-view]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.view === r[7])));
        if (r[7] === 'bess20') document.getElementById('lyrBess20').checked || document.getElementById('lyrBess20').click();
        if (r[7] === 'bess11') document.getElementById('lyrBess11').checked || document.getElementById('lyrBess11').click();
        document.querySelector('.plate').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      tr.addEventListener('click', go); tr.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); tb.appendChild(tr); });
  }
'''
rep("  // ----- picking -----\n", JSROWS + "\n  // ----- picking -----\n")

open(P3, 'w', encoding='utf-8').write(s)
print('ok', len(new), 'нових ліній; demolish', len(dem), '; boxes', len(boxes))
