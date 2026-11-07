#!/bin/sh
# Збірка 3D-двійника «Антарес · весь об'єкт»: джерела — src/ (app.js + модулі, clean.js — шаблон меню і розділи), модель АБК — ../abk/dbn/.
# Результат — index.html (артефакт «Антарес · весь об'єкт»): версія для замовника — без кошторису по позиціях і складових ціни.
# PUB=0 sh build.sh → index_vn.html — внутрішня версія з кошторисом, специфікацією, конструкцією і монтажем у «Грошах» (у публічний репозиторій не йде).
cd "$(dirname "$0")" && PUB="${PUB:-1}" python3 - <<'PY'
import os
PUB = os.environ.get('PUB', '1') != '0'
r = lambda f: open('src/' + f, encoding='utf-8').read()
app = r('app.js'); cut = app.rstrip().rfind('})();')
mods = ['montage.js', 'obst.js', 'fasad.js', 'rad.js', 'facpv.js', 'facnode.js', 'roofv2.js', 'roofv3.js', 'roof28.js', 'lan28.js', 'stages.js', 'clean.js', 'elec04.js', 'elecwa.js', 'roofnode.js', 'bessdet.js', 'eko.js', 'mont.js', 'menu5.js']
app = app[:cut] + '\n'.join(r(f) for f in mods) + '\n' + app[cut:]
data = ('data.js', 'tri.js', 'wx.js', 'year.js', 'bess.js', 'ep.js', 'foto.js', 'raddata.js', 'facpvdata.js', 'roofv2data.js', 'lanfdata.js', 'roof28data.js', 'lan28data.js', 'elec04data.js', 'facnodedata.js', 'elecwadata.js', 'elecstrdata.js', 'kutdata.js', 'koshdata.js', 'abkdcdata.js', 'whnprice.js', 'loads.js', 'eldet.js', 'kalkdata.js', 'radxdata.js')
def pub(f, s):   # 06.11 (власник): кошторис і специфікація — лише у внутрішній версії; у публічній — без позицій і цін, опція складу — лише під ключ
    if not PUB or f not in ('koshdata.js', 'whnprice.js', 'data.js', 'bess.js'): return s
    i = s.index('{'); j = s.rstrip().rstrip(';').rindex('}') + 1; D = json.loads(s[i:j])
    z = lambda v: {k: z(x) for k, x in v.items()} if isinstance(v, dict) else [z(x) for x in v] if isinstance(v, list) else 0 if isinstance(v, (int, float)) and not isinstance(v, bool) else v
    if f == 'koshdata.js': D = {k: D[k] for k in ('wind',) if k in D}
    elif f == 'whnprice.js': D['cost'] = {k: D['cost'][k] for k in ('net', 'vat')}
    else: D['cost'] = z(D['cost'])   # старі кошториси (дах 26.10, контейнери 26.10) у чистій збірці не показуються — суми обнулено
    return s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[j:]
import json
rd = lambda f: 'const FOTO={"g":{},"p":[]};' if f == 'foto.js' else pub(f, r(f))   # фото обстеження в 3D-моделі не використовуємо (власник 04.11, 14:37) — порожні дані
import json
def abk(f):   # 06.11 (власник): двійник бачить замовник — кошторису АБК у сторінці немає (модель АБК його не показує)
    s = open('../abk/dbn/' + f, encoding='utf-8').read()
    if f != 'abk_data.js': return '\n'.join(l for l in s.split('\n') if not l.startswith('// рядок кошторису → позиція в моделі'))
    i = s.index('{'); j = s.rstrip().rstrip(';').rindex('}') + 1; D = json.loads(s[i:j]); D['est'] = {'rows': []}
    return s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[j:]
# листи в ОСР — шаблони (ses-uze-modul: python3 -m ses_uze.lysty_osr obiekty/antares [--bez-kontaktiv] --vyhid obj/lysty[_vn]); у публічній — без телефонів і пошти
import base64, glob
LD = 'lysty' if PUB or not glob.glob('lysty_vn/*.pdf') else 'lysty_vn'
LY = [dict(f=os.path.basename(f), n=os.path.basename(f)[:-4].replace('_шаблон', '').replace('_', ' '), b=base64.b64encode(open(f, 'rb').read()).decode()) for f in sorted(glob.glob(LD + '/*.pdf'))]
LYS = '<script>const LYSTY=' + json.dumps(LY, ensure_ascii=False) + ';</script>'
body = r('tpl.html').replace('<script>/*DATA*/</script>', ('<script>window.__PUB=true;</script>' if PUB else '<script>window.__PUB=false;</script>') + LYS + ''.join('<script>' + rd(f) + '</script>' for f in data) + ''.join('<script>' + abk(f) + '</script>' for f in ('abk_data.js', 'abk_model.js'))).replace('<script>/*APP*/</script>', '<script>' + app + '</script>')
body = body.replace('<title>Антарес 3D-двійник</title>', "<title>Антарес · весь об'єкт</title>")
head = '<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
out = 'index.html' if PUB else 'index_vn.html'
if not PUB: body = body.replace("<title>Антарес · весь об'єкт</title>", "<title>Антарес · внутрішня версія</title>")
open(out, 'w', encoding='utf-8').write(head + body + '\n</html>\n')
print('built obj/' + out, len(head + body) // 1024, 'KB')
PY
