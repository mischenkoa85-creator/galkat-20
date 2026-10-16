"""Довідники модуля «Склад» (крок 1) для ses11/data.js.

Що робить:
  - номенклатура, незалежна від проєкту: код, назва, розмір/марка, од., маса од., тип обліку, власник, аналоги;
  - специфікації виробів (BOM на 1 одиницю дії звіту) з колонки «дія-драйвер» рядків специфікації дахів:
    кількість на 1 = кількість у рядку / обсяг дії на даху (точний дріб [чисельник, знаменник]);
    однакові набори для різних дахів зливаються в один виріб; допускається вкладеність (виріб у виробі);
  - відповідність «рядок специфікації даху → код номенклатури» (stock.specMap);
  - перелік на зберігання ГАЛ-КАТ для дахів 10–11 з CSV (stock.storagePlan);
  - налаштування проєкту в meta: acceptance, customerSeesContractorStock, hiddenWorks;
  - блок CATALOG у apps-script/Code.gs (між маркерами BEGIN/END CATALOG): власник і облік позицій, потреба об’єктів,
    ключі старих «Видач» — сервер за ним перевіряє позиції, ліміти й видимість для замовника.

Решта data.js не змінюється (перевіряється побайтно). Повторний запуск дає той самий результат.

Запуск (без cd, абсолютні шляхи):
  C:/Python314/python.exe -I -X utf8 D:/галкат/10_Код/galkat-20/ses11/tools/build_stock.py ^
      D:/галкат/10_Код/galkat-20/ses11/data.js D:/галкат/08_Склад/Матеріали_відкладених_дахів_на_зберігання_ГАЛ-КАТ.csv ^
      D:/галкат/10_Код/galkat-20/ses11/apps-script/Code.gs
Перевірка: ses11/tools/check_bom.py.
"""
import csv
import json
import sys
from fractions import Fraction

PREFIX = 'window.SES11='

# Один і той самий матеріал у різних дахах записано по-різному — зводимо до одного написання.
ALIAS = {
    ('Монтажна гайка М8 з обоймою', ''): ('Монтажна гайка з обоймою', 'М8'),
    ('Болт М8*30 вн.шест. н/ж', ''): ('Болт вн.шест. н/ж', 'М8х30'),
    ('Гровер 8 н/ж', ''): ('Гровер н/ж', '8'),
}
GROUPS = [  # префікс коду, назва групи номенклатури
    ('MK', 'Металоконструкції і кріплення'),
    ('EL', 'Модулі і провід'),
    ('LT', 'Кабельні лотки'),
    ('GF', 'Гофротруба'),
    ('TR', 'Тросовий перехід'),
    ('DC', 'Щити DC'),
]
SPEC_GROUP = {
    'Металоконструкції і кріплення': 'MK',
    'Модулі і провід': 'EL',
    'Кабельний лоток': 'LT',
    'Гофротруба': 'GF',
    'Перехід на тросі Дах 1 → Дах 11': 'TR',
}
# назви виробів за дією звіту
PRODUCT_NAME = {
    'tri': 'Трикутник',
    'pv': 'Модуль встановлений',
    'strings': 'Стрінг підключений',
    'tray': 'Лоток встановлений',
    'ballast': 'Баласт розкладений',
    'rails': 'Мінірейка встановлена',
    'gofra': 'Гофротруба прокладена, 1 м',
    'rope': 'Перехід на тросі',
    'dc_box': 'Щит DC встановлений',
}
NO_MATERIAL = {
    'lift_bal': 'підйом лише переміщує матеріал на дах, не списує',
    'lift_mk': 'підйом лише переміщує матеріал на дах, не списує',
    'lift_pv': 'підйом лише переміщує матеріал на дах, не списує',
    'test': 'перевірка без матеріалів',
    'handover': 'здача без матеріалів',
}
KP = 'kp'  # вкладений виріб: кріплення притиску М8 (гайка з обоймою + болт + гровер)


def load(path):
    t = open(path, encoding='utf-8').read()
    lines = t.split('\n')
    body = lines[1]
    assert body.startswith(PREFIX) and body.endswith(';'), 'data.js: неочікуваний формат'
    return lines, json.loads(body[len(PREFIX):-1])


def norm(name, size):
    return ALIAS.get((name, size), (name, size))


def frac(q, v):
    f = Fraction(q).limit_denominator(10 ** 9) if isinstance(q, float) else Fraction(q)
    f = f / Fraction(v)
    return [f.numerator, f.denominator]


def build(D, csv_path):
    D.pop('stock', None)
    meta = D['meta']
    for k in ('acceptance', 'customerSeesContractorStock', 'hiddenWorks'):
        meta.pop(k, None)

    # ---------- номенклатура ----------
    items, by_key, seq = [], {}, {p: 0 for p, _ in GROUPS}
    gname = dict(GROUPS)

    def add_item(prefix, name, size, unit, **kw):
        seq[prefix] += 1
        it = {'code': '%s%02d' % (prefix, seq[prefix]), 'name': name, 'size': size, 'unit': unit,
              'kg': None, 'pack': None, 'track': 'qty', 'owner': 'contractor', 'group': gname[prefix],
              'analogs': [], 'aliases': []}
        it.update(kw)
        items.append(it)
        by_key[(name, size, unit)] = it
        return it

    spec_map = {}
    for o in D['objects']:
        m = spec_map.setdefault(o['id'], {})
        for r in o['spec']:
            key, grp, name, size, unit = r[0], r[1], r[2], r[3], r[4]
            cn, cs = norm(name, size)
            it = by_key.get((cn, cs, unit))
            if not it:
                prefix = 'GF' if cn.startswith('Труба ПВХ гофрована') else SPEC_GROUP[grp]
                it = add_item(prefix, cn, cs, unit)
            if (cn, cs) != (name, size) and [name, size] not in it['aliases']:
                it['aliases'].append([name, size])
            m[key] = it['code']
        if not m:
            del spec_map[o['id']]

    for it in items:
        if it['name'].startswith('Модуль LONGI'):
            it.update(track='serial', owner='customer', kg=meta.get('moduleKg'))
        elif it['name'].startswith('Провід Solar'):
            it.update(owner='customer')
        elif it['name'].startswith('Баласт 400х400х80'):
            it.update(kg=meta.get('ballastKg'), note='маса — оцінка ≈%s кг/плита' % meta.get('ballastKg'))
    # саморіз: креслення АБ — М4х17, переліки АБ — М4х15 (перевірка за ОС-108 16.10.2026)
    s17 = by_key[('Саморіз', 'М4х17', 'шт')]
    s15 = add_item('MK', 'Саморіз', 'М4х15', 'шт', note='переліки АБ.19/21/22/23; креслення АБ.8/10/11/12 — М4х17')
    s17['analogs'].append({'code': s15['code'], 'note': 'з погодженням'})
    s15['analogs'].append({'code': s17['code'], 'note': 'з погодженням'})
    dc = add_item('DC', 'Щит захисту DC', 'DC1, DC2', 'шт', track='serial', owner='customer',
                  note='давальницький ГАЛ-КАТ; у специфікації даху немає — потреба за дією «Щити DC» загальної частини')
    for it in items:
        if not it['aliases']:
            del it['aliases']
        if not it['analogs']:
            del it['analogs']
    code_of = {(it['name'], it['size'], it['unit']): it['code'] for it in items}

    # ---------- специфікації виробів ----------
    products = {KP: {'name': 'Кріплення притиску М8', 'unit': 'компл.', 'act': None,
                     'parts': [[code_of[('Монтажна гайка з обоймою', 'М8', 'шт')], 1, 1, 0],
                               [code_of[('Болт вн.шест. н/ж', 'М8х30', 'шт')], 1, 1, 0],
                               [code_of[('Гровер н/ж', '8', 'шт')], 1, 1, 0]],
                     'roofs': []}}
    kp_codes = [p[0] for p in products[KP]['parts']]
    bom, nseq = {}, {}
    for o in D['objects']:
        acts = {}
        for r in o['spec']:
            acts.setdefault(r[7], {})
            c = spec_map[o['id']][r[0]]
            acts[r[7]][c] = acts[r[7]].get(c, 0) + r[5]
        if o['id'] == 'S' and o['plan'].get('dc_box'):
            acts['dc_box'] = {dc['code']: o['plan']['dc_box']['q']}
        ob = {}
        for a, qs in acts.items():
            vol = o['plan'][a]['q']
            parts = []
            kq = [qs.get(c) for c in kp_codes]
            nest = a == 'pv' and kq[0] is not None and kq.count(kq[0]) == 3
            for c, q in qs.items():
                if nest and c in kp_codes:
                    continue
                parts.append([c] + frac(q, vol) + [0])
            if nest:
                parts.append([KP] + frac(kq[0], vol) + [0])
            parts.sort(key=lambda p: (p[0] == KP, p[0]))
            pid = None
            for k, p in products.items():
                if p['act'] == a and p['parts'] == parts:
                    pid = k
                    break
            if not pid:
                nseq[a] = nseq.get(a, 0) + 1
                pid = '%s.%d' % (a, nseq[a])
                products[pid] = {'name': PRODUCT_NAME[a], 'unit': (o['plan'][a].get('u') or next(w['unit'] for w in D['works'] if w['id'] == a) or 'компл.'),
                                 'act': a, 'parts': parts, 'roofs': []}
            products[pid]['roofs'].append(o['id'])
            if nest and o['id'] not in products[KP]['roofs']:
                products[KP]['roofs'].append(o['id'])
            ob[a] = [pid, 1]
        if ob:
            bom[o['id']] = ob
    for p in products.values():
        p['variant'] = ('дах ' if len(p['roofs']) == 1 else 'дахи ') + ', '.join(p['roofs'])

    # ---------- перелік на зберігання ГАЛ-КАТ (дахи 10–11) з CSV ----------
    storage = {}
    if csv_path:
        with open(csv_path, encoding='utf-8-sig', newline='') as f:
            for row in csv.DictReader(f, delimiter=';'):
                roof = row['Дах'].replace('Дах ', '').strip()
                if not roof.isdigit():
                    continue
                grp, _, name = row['Позиція'].partition(': ')
                cn, cs = norm(name, row['Розмір'])
                c = code_of[(cn, cs, row['Од.'])]
                q = float(row['Кількість'].replace(',', '.'))
                storage.setdefault(roof, {})[c] = int(q) if q == int(q) else q

    D['stock'] = {
        'v': 1,
        'src': 'Згенеровано ses11/tools/build_stock.py з рядків специфікації дахів (колонка «дія-драйвер»); перевірка — ses11/tools/check_bom.py',
        'owners': {'contractor': 'підрядник', 'customer': 'давальницький ГАЛ-КАТ'},
        'items': items,
        'products': products,
        'bom': bom,
        'noMaterial': NO_MATERIAL,
        'specMap': spec_map,
        'storagePlan': storage,
        'storageSrc': '08_Склад/Матеріали_відкладених_дахів_на_зберігання_ГАЛ-КАТ.csv',
    }
    meta['acceptance'] = 'foreman'
    meta['customerSeesContractorStock'] = False
    meta['hiddenWorks'] = [
        {'id': 'pads', 'name': 'Підкладки під баласт', 'by': ['ballast'], 'gates': ['tri'],
         'note': 'підкладки UKRIZOL під плитами баласту; акт — до встановлення трикутників'},
        {'id': 'ballast', 'name': 'Баласт під каркасом перед модулями', 'by': ['ballast', 'tri'], 'gates': ['pv'],
         'note': 'баласт закривається модулями; акт — до монтажу модулів'},
        {'id': 'ground', 'name': 'Заземлення й вирівнювання потенціалів', 'by': ['ground'], 'gates': ['test', 'pnr'],
         'note': 'акт — до перевірки стрінгів і ПНР'},
        {'id': 'trays', 'name': 'Кабелі в лотках перед закриттям кришками', 'by': ['strings'], 'gates': ['test'],
         'note': 'кришки лотків закриваються після акта; перевірка стрінгів — після'},
        {'id': 'bess', 'name': 'Кабельний канал BESS перед засипкою', 'by': ['trench', 'pnd'], 'gates': ['trench'],
         'note': 'засипка — частина дії «Траншеї»: її завершення — після акта'},
    ]
    return D


CAT_BEGIN = '/* BEGIN CATALOG'
CAT_END = '/* END CATALOG */'


def server_catalog(D):
    """Довідник для сервера (Code.gs): власник і тип обліку позицій, потреба об’єктів, ключі старих «Видач»."""
    st = D['stock']
    items = {it['code']: ['g' if it['owner'] == 'customer' else 'c', 's' if it['track'] == 'serial' else 'q',
                          it['name'] + (' ' + it['size'] if it['size'] else ''), it['unit']] for it in st['items']}
    need, legacy = {}, {}
    for o in D['objects']:
        n = {}
        for r in o['spec']:
            c = st['specMap'][o['id']][r[0]]
            n[c] = n.get(c, 0) + r[5]
        for a, (pid, coef) in st['bom'].get(o['id'], {}).items():
            if o['spec']:
                continue
            for ref, num, den, loss in st['products'][pid]['parts']:
                n[ref] = n.get(ref, 0) + o['plan'][a]['q'] * num / den * coef
        if n:
            need[o['id']] = {c: (int(v) if v == int(v) else v) for c, v in n.items()}
        if st['specMap'].get(o['id']):
            legacy[o['id']] = st['specMap'][o['id']]
    return {'items': items, 'need': need, 'legacy': legacy}


def write_catalog(gs_path, D):
    t = open(gs_path, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in t else '\n'
    a, b = t.find(CAT_BEGIN), t.find(CAT_END)
    assert a >= 0 and b > a, 'Code.gs: немає маркерів BEGIN/END CATALOG'
    cat = server_catalog(D)
    block = (CAT_BEGIN + ' — згенеровано tools/build_stock.py з data.js; не редагувати вручну.' + nl +
             '   items: код → [власник c|g, облік q|s, назва, од.]; need: об’єкт → код → потреба за проєктом; legacy: об’єкт → ключ рядка специфікації → код */' + nl +
             'const CATALOG = {' + nl +
             '  items: ' + json.dumps(cat['items'], ensure_ascii=False, separators=(',', ':')) + ',' + nl +
             '  need: ' + json.dumps(cat['need'], ensure_ascii=False, separators=(',', ':')) + ',' + nl +
             '  legacy: ' + json.dumps(cat['legacy'], ensure_ascii=False, separators=(',', ':')) + nl +
             '};' + nl)
    t = t[:a] + block + t[b:]
    with open(gs_path, 'w', encoding='utf-8', newline='') as f:
        f.write(t)


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else 'D:/галкат/10_Код/galkat-20/ses11/data.js'
    csv_path = sys.argv[2] if len(sys.argv) > 2 else 'D:/галкат/08_Склад/Матеріали_відкладених_дахів_на_зберігання_ГАЛ-КАТ.csv'
    gs_path = sys.argv[3] if len(sys.argv) > 3 else path.replace('data.js', 'apps-script/Code.gs')
    lines, D = load(path)
    before = json.loads(json.dumps(D))
    build(D, csv_path)
    # усе, крім нових ключів, лишилося як було
    after = json.loads(json.dumps(D))
    after.pop('stock')
    for k in ('acceptance', 'customerSeesContractorStock', 'hiddenWorks'):
        after['meta'].pop(k)
    before.pop('stock', None)
    for k in ('acceptance', 'customerSeesContractorStock', 'hiddenWorks'):
        before['meta'].pop(k, None)
    assert after == before, 'змінено щось поза stock/meta-налаштуваннями'
    lines[0] = '/* Дані проєкту ОС-108 для журналу СЕС площадки 11. Згенеровано з робочого проєкту; правки 16.10.2026 — у meta.fixes і в примітках рядків. Довідники складу (stock, meta.acceptance/customerSeesContractorStock/hiddenWorks) — ses11/tools/build_stock.py, 17.10.2026. */'
    lines[1] = PREFIX + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';'
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))
    write_catalog(gs_path, D)
    st = D['stock']
    print('номенклатура: %d позицій; виробів: %d; дахів із BOM: %d; на зберігання: %s' % (
        len(st['items']), len(st['products']), len(st['bom']), {k: len(v) for k, v in st['storagePlan'].items()}))


if __name__ == '__main__':
    main()
