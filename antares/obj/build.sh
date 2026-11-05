#!/bin/sh
# Збірка 3D-двійника «Антарес · весь об'єкт»: джерела — src/ (app.js + модулі, clean.js — шаблон меню і розділи), модель АБК — ../abk/dbn/.
# Результат — index.html (артефакт «Антарес · весь об'єкт»).
cd "$(dirname "$0")" && python3 - <<'PY'
r = lambda f: open('src/' + f, encoding='utf-8').read()
app = r('app.js'); cut = app.rstrip().rfind('})();')
mods = ['montage.js', 'obst.js', 'fasad.js', 'rad.js', 'facpv.js', 'facnode.js', 'roofv2.js', 'roofv3.js', 'roof28.js', 'lan28.js', 'stages.js', 'clean.js', 'elec04.js', 'elecwa.js', 'roofnode.js', 'bessdet.js', 'eko.js', 'mont.js', 'menu5.js']
app = app[:cut] + '\n'.join(r(f) for f in mods) + '\n' + app[cut:]
data = ('data.js', 'tri.js', 'wx.js', 'year.js', 'bess.js', 'ep.js', 'foto.js', 'raddata.js', 'facpvdata.js', 'roofv2data.js', 'lanfdata.js', 'roof28data.js', 'lan28data.js', 'elec04data.js', 'facnodedata.js', 'elecwadata.js', 'elecstrdata.js', 'ekodata.js', 'kutdata.js')
rd = lambda f: 'const FOTO={"g":{},"p":[]};' if f == 'foto.js' else r(f)   # фото обстеження в 3D-моделі не використовуємо (власник 04.11, 14:37) — порожні дані
body = r('tpl.html').replace('<script>/*DATA*/</script>', ''.join('<script>' + rd(f) + '</script>' for f in data) + ''.join('<script>' + open('../abk/dbn/' + f, encoding='utf-8').read() + '</script>' for f in ('abk_data.js', 'abk_model.js'))).replace('<script>/*APP*/</script>', '<script>' + app + '</script>')
body = body.replace('<title>Антарес 3D-двійник</title>', "<title>Антарес · весь об'єкт</title>")
head = '<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
open('index.html', 'w', encoding='utf-8').write(head + body + '\n</html>\n')
print('built obj/index.html', len(head + body) // 1024, 'KB')
PY
