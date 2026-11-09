# -*- coding: utf-8 -*-
"""Публічна версія 3D (GitHub Pages) з фото лише площадки 11 (вул. Конюшинна, 11).
Номери авто й обличчя на фото розмито заздалегідь (фото лежать у img/ph/), фото площадок 14, 20 і вулиці не публікуються.
Запуск у теці 3d/:  python3 tools/publish_p11_photos.py"""
import json, os, sys
P = 'index.html'; s = open(P, encoding='utf-8').read()
i = s.index('window.SITE20=') + len('window.SITE20='); j = s.index('\n', i)
raw = s[i:j]; tail = ';' if raw.rstrip().endswith(';') else ''
d = json.loads(raw.rstrip().rstrip(';'))
ph = d['photos']; keep = {sh['file'] for sh in ph['shots'] if sh.get('pl') == 11}
ph['shots'] = [sh for sh in ph['shots'] if sh['file'] in keep]
ph['stations'] = [st for st in ph['stations'] if st.get('pl') == 11]
ph['groups'] = [g for g in ph['groups'] if g.get('pl') == 11]
assert {sh['series'] for sh in ph['shots']} <= {st['series'] for st in ph['stations']}
pb = d['pbind']
pb['shots'] = {k: v for k, v in pb['shots'].items() if k in keep}
for key in ('buildings', 'fences'):
    out = {}
    for k, B in pb[key].items():
        L = [x for x in B['photos'] if x[0] in keep]
        if L: B['photos'] = L; out[k] = B
    pb[key] = out
missing = [f for f in keep if not (os.path.exists('img/ph/%s.jpg' % f) and os.path.exists('img/ph/%s_t.jpg' % f))]
assert not missing, missing
n_roof = sum(1 for sh in ph['shots'] if sh.get('roof')); n_gr = len(ph['shots']) - n_roof
s = s[:i] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + tail + s[j:]

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:80]); s = s.replace(a, b)

rep("  const PUBLIC = true;                                     // публічна версія (GitHub Pages): без фото з площадки",
    "  const PUBLIC = false;                                    // публічна версія (GitHub Pages): фото лише площадки 11, номери авто й обличчя розмито")
# фільтри галереї: лише площадка 11 і фото з даху
for v, t in (('14', 'Площадка 14'), ('20', 'Площадка 20'), ('0', 'Вулиця')):
    rep('      <button class="btn" type="button" data-phf="%s">%s</button>\n' % (v, t), '')
# пояснення
a = s[s.index('<p class="note" id="pubNote" hidden>'):]; a = a[:a.index('</p>') + 4]
rep(a, '<p class="note" id="pubNote">Це публічна версія моделі. Фото в ній — лише з площадки 11 (вул. Конюшинна, 11): '
       '%d знімків, з них %d з даху цеху 18. Номери автомобілів і обличчя людей на фото розмито. Фото площадок 14 і 20 та вулиці '
       '(серед них інтер’єри ТП і РП) сюди не включено — вони є в робочій версії моделі й у папці проекту на Google Диску.</p>' % (len(ph['shots']), n_roof))
a = s[s.index('<p class="note">Усі фото з папки «Архетектура»: 27 знімків'):]; a = a[:a.index('</p>') + 4]
b = a.replace('Усі фото з папки «Архетектура»: 27 знімків із даху цеху 18 і 168 наземних знімків площадок 11, 14, 20 і вулиці (13–14.10.2026), розкладені за будівлями.',
              'Фото площадки 11 з папки «Архетектура»: %d знімків із даху цеху 18 і %d наземних (14.10.2026), розкладені за будівлями; номери авто й обличчя розмито.' % (n_roof, n_gr))
assert b != a; rep(a, b)
a = s[s.index('<p class="note">Для кожного фото модель відрендерено'):]; a = a[:a.index('</p>') + 4]
b = a.replace('Будівель із фото — 29, парканів, воріт і об’єктів двору з фото — 23.',
              'Будівель із фото — %d, парканів, воріт і об’єктів двору з фото — %d.' % (len(pb['buildings']), len(pb['fences'])))
assert b != a; rep(a, b)
rep('<p class="note" id="phNote14">', '<p class="note" id="phNote14" hidden>')
rep('(червона, жовта, зелена — дах; синя — площадка 11; зелена — площадка 14; коричнева — площадка 20; фіолетова — вулиця)',
    '(червона, жовта, зелена — дах; синя — площадка 11)')
a = s[s.index('Так само розв’язано точки P2'):]; a = a[:a.index('резервуара).') + len('резервуара).')]
rep(' ' + a, '')
open(P, 'w', encoding='utf-8').write(s)
print('shots', len(ph['shots']), 'roof', n_roof, 'buildings', len(pb['buildings']), 'fences', len(pb['fences']))
