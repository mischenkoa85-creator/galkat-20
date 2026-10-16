"""Самоперевірка специфікацій виробів (крок 1 модуля «Склад»).

Для кожного даху: обсяги дій за проєктом × специфікації виробів (з вкладеними виробами) мають дати
рівно ті кількості, що в рядках специфікації даху (data.js, objects[].spec). Арифметика — точні дроби;
округлення допускається лише на рівні даху (сума по позиції), і кожне таке округлення виводиться у звіт.
Окремо: баласт = 2 × трикутники, притиски = 4 × модулі (на трикутниках), перелік на зберігання 10–11 = специфікація.

Запуск (без cd):
  C:/Python314/python.exe -I -X utf8 D:/галкат/10_Код/galkat-20/ses11/tools/check_bom.py D:/галкат/10_Код/galkat-20/ses11/data.js
Код виходу 0 — усе зійшлося; 1 — є розбіжності (вони надруковані).
"""
import json
import sys
from fractions import Fraction

PREFIX = 'window.SES11='


def load(path):
    body = open(path, encoding='utf-8').read().split('\n')[1]
    return json.loads(body[len(PREFIX):-1])


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else 'D:/галкат/10_Код/galkat-20/ses11/data.js'
    D = load(path)
    S = D['stock']
    items = {it['code']: it for it in S['items']}
    prods = S['products']
    bad, rounded, info = [], [], []

    # 1. номенклатура: кожен рядок специфікації веде на позицію з тією самою назвою/розміром/од. (або задокументованим написанням)
    for o in D['objects']:
        for r in o['spec']:
            c = S['specMap'].get(o['id'], {}).get(r[0])
            it = items.get(c)
            if not it:
                bad.append('дах %s, рядок %s «%s»: немає коду номенклатури' % (o['id'], r[0], r[2]))
                continue
            names = [[it['name'], it['size']]] + it.get('aliases', [])
            if [r[2], r[3]] not in names or r[4] != it['unit']:
                bad.append('дах %s, рядок %s «%s %s %s» ≠ %s «%s %s %s»' % (o['id'], r[0], r[2], r[3], r[4], c, it['name'], it['size'], it['unit']))
    for it in S['items']:
        for a in it.get('analogs', []):
            if a['code'] not in items:
                bad.append('аналог %s → %s: немає такої позиції' % (it['code'], a['code']))
    m17 = next((i for i in S['items'] if i['name'] == 'Саморіз' and i['size'] == 'М4х17'), None)
    m15 = next((i for i in S['items'] if i['name'] == 'Саморіз' and i['size'] == 'М4х15'), None)
    if not (m17 and m15 and any(a['code'] == m15['code'] and a['note'] == 'з погодженням' for a in m17.get('analogs', []))
            and any(a['code'] == m17['code'] and a['note'] == 'з погодженням' for a in m15.get('analogs', []))):
        bad.append('аналоги М4×17 ↔ М4×15 «з погодженням» не задані')
    for it in S['items']:
        serial = it['name'].startswith('Модуль LONGI') or it['name'].startswith('Щит захисту DC')
        if (it['track'] == 'serial') != serial:
            bad.append('%s «%s»: тип обліку %s' % (it['code'], it['name'], it['track']))
        cust = serial or it['name'].startswith('Провід Solar')
        if (it['owner'] == 'customer') != cust:
            bad.append('%s «%s»: власник %s' % (it['code'], it['name'], it['owner']))

    # 2. розгортання: обсяг дії × виріб (рекурсивно) → матеріали
    def expand(pid, k, out, depth=0):
        if depth > 5:
            raise ValueError('зациклення виробів на ' + pid)
        for ref, num, den, loss in prods[pid]['parts']:
            q = k * Fraction(num, den) * (1 + Fraction(loss) / 100)
            if ref in prods:
                expand(ref, q, out, depth + 1)
            else:
                out[ref] = out.get(ref, 0) + q
    for p in prods.values():
        for ref, num, den, loss in p['parts']:
            if ref not in prods and ref not in items:
                bad.append('виріб %s: невідома складова %s' % (p['name'], ref))
            if loss != 0:
                bad.append('виріб %s: норма втрат %s %% (має бути 0)' % (p['name'], loss))
    nested = sorted({ref for p in prods.values() for ref, *_ in p['parts'] if ref in prods})

    print('Перевірка специфікацій виробів: %s' % path)
    print('%-6s %-10s %-10s %s' % ('Дах', 'Позицій', 'Збіг', 'Примітка'))
    total_rows = 0
    for o in D['objects']:
        b = S['bom'].get(o['id'], {})
        exp = {}
        for act, (pid, coef) in b.items():
            if act not in o['plan']:
                bad.append('дах %s: дія %s є в BOM, але немає в плані' % (o['id'], act))
                continue
            expand(pid, Fraction(o['plan'][act]['q']).limit_denominator(10 ** 6) * Fraction(coef), exp)
        spec = {}
        for r in o['spec']:
            c = S['specMap'][o['id']][r[0]]
            spec[c] = spec.get(c, 0) + Fraction(r[5]).limit_denominator(10 ** 6)
            if r[7] not in b:
                bad.append('дах %s, рядок %s: дія-драйвер %s без виробу' % (o['id'], r[0], r[7]))
        ok = 0
        for c in sorted(set(spec) | set(exp)):
            e, s = exp.get(c, 0), spec.get(c)
            if s is None:
                info.append('дах %s: %s «%s» × %s — потреба з дії, рядка в специфікації даху немає' % (o['id'], c, items[c]['name'], e))
                continue
            if e == s:
                ok += 1
                continue
            if e.denominator != 1 and round(e) == s:
                rounded.append('дах %s: %s «%s» %s = %.4f → %s' % (o['id'], c, items[c]['name'], e, float(e), s))
                ok += 1
                continue
            bad.append('дах %s: %s «%s» — розгортання %s (%.3f), у специфікації %s' % (o['id'], c, items[c]['name'], e, float(e), s))
        total_rows += len(spec)
        acts_no = [a for a in o['plan'] if a not in b]
        note = ('дії без матеріалу: ' + ', '.join(acts_no)) if acts_no else ''
        print('%-6s %-10d %-10s %s' % (o['id'], len(spec), '%d/%d' % (ok, len(spec)), note))

        # 3. правила
        p = o['plan']
        if 'tri' in p:
            if p['ballast']['q'] != 2 * p['tri']['q']:
                bad.append('дах %s: баласт %s ≠ 2 × трикутники %s' % (o['id'], p['ballast']['q'], p['tri']['q']))
            ball = exp.get(next(c for c, it in items.items() if it['name'].startswith('Баласт 400')), 0)
            if ball != 2 * p['tri']['q']:
                bad.append('дах %s: розгорнутий баласт %s ≠ 2 × %s' % (o['id'], ball, p['tri']['q']))
        if 'pv' in p:
            edge = exp.get(next(c for c, it in items.items() if it['name'] == 'Прижим крайній'), 0)
            mid = exp.get(next(c for c, it in items.items() if it['name'] == 'Прижим міжмодульний'), 0)
            mods = p['pv']['q']
            if 'tri' in p and edge + mid != 4 * mods:
                bad.append('дах %s: притиски %s ≠ 4 × модулі %s' % (o['id'], edge + mid, mods))
            if 'rails' in p:
                if edge + mid != p['rails']['q']:
                    bad.append('дах %s: притиски %s ≠ мінірейки %s' % (o['id'], edge + mid, p['rails']['q']))
                info.append('дах %s (мінірейки): притисків %s = мінірейок %s; на модуль %s, а не 4 — правило «4 × модулі» діє для трикутників' % (o['id'], edge + mid, p['rails']['q'], Fraction(edge + mid, mods)))

    # 4. перелік на зберігання ГАЛ-КАТ = специфікація дахів 10–11
    for roof, plan in S.get('storagePlan', {}).items():
        o = next(x for x in D['objects'] if x['id'] == roof)
        spec = {}
        for r in o['spec']:
            c = S['specMap'][roof][r[0]]
            spec[c] = spec.get(c, 0) + r[5]
        if spec != plan:
            diff = {c: (plan.get(c), spec.get(c)) for c in set(spec) | set(plan) if plan.get(c) != spec.get(c)}
            bad.append('зберігання, дах %s: CSV ≠ специфікація: %s' % (roof, diff))
        else:
            info.append('зберігання, дах %s: CSV = специфікація, %d позицій' % (roof, len(plan)))

    # 5. довідник сервера (Code.gs, блок CATALOG) = data.js: власник, тип обліку, потреба об’єктів, ключі старих «Видач»
    gs = path.replace('data.js', 'apps-script/Code.gs')
    try:
        src = open(gs, encoding='utf-8').read()
        a = src.index('const CATALOG = {')
        b = src.index('/* END CATALOG */')
        body = src[a + len('const CATALOG = '):b].strip().rstrip(';')
        for k in ('items', 'need', 'legacy'):
            body = body.replace('\n  %s: ' % k, '\n  "%s": ' % k)
        cat = json.loads(body)
        for c, it in items.items():
            x = cat['items'].get(c)
            if not x or x[0] != ('g' if it['owner'] == 'customer' else 'c') or x[1] != ('s' if it['track'] == 'serial' else 'q'):
                bad.append('Code.gs CATALOG: позиція %s не збігається з data.js' % c)
        if set(cat['items']) != set(items):
            bad.append('Code.gs CATALOG: інший набір позицій')
        for o in D['objects']:
            want = {}
            for r in o['spec']:
                c = S['specMap'][o['id']][r[0]]
                want[c] = want.get(c, 0) + r[5]
            if o['spec'] and cat['need'].get(o['id']) != want:
                bad.append('Code.gs CATALOG: потреба об’єкта %s ≠ специфікації' % o['id'])
            if S['specMap'].get(o['id']) and cat['legacy'].get(o['id']) != S['specMap'][o['id']]:
                bad.append('Code.gs CATALOG: ключі старих «Видач» об’єкта %s' % o['id'])
        if cat['need'].get('S') != {next(c for c, i in items.items() if i['name'].startswith('Щит захисту DC')): 2}:
            bad.append('Code.gs CATALOG: потреба щитків DC загальної частини')
        info.append('Code.gs CATALOG = data.js: %d позицій, потреба %d об’єктів' % (len(cat['items']), len(cat['need'])))
    except (OSError, ValueError) as e:
        bad.append('Code.gs CATALOG не прочитано: %s' % e)

    print()
    print('Рядків специфікацій: %d; виробів: %d; вкладені вироби: %s' % (total_rows, len(prods), ', '.join('%s «%s»' % (n, prods[n]['name']) for n in nested) or '—'))
    print('Норма втрат: 0 %% для всіх %d складових' % sum(len(p['parts']) for p in prods.values()))
    print('Округлення (лише на рівні даху): %s' % (len(rounded) or 'немає'))
    for x in rounded:
        print('  ~ ' + x)
    for x in info:
        print('  i ' + x)
    if bad:
        print('РОЗБІЖНОСТІ: %d' % len(bad))
        for x in bad:
            print('  ✗ ' + x)
        sys.exit(1)
    print('Розбіжностей немає: обсяги × специфікації виробів = специфікації дахів; баласт = 2 × трикутники; притиски = 4 × модулі на трикутниках.')


if __name__ == '__main__':
    main()
