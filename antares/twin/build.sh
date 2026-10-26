#!/bin/sh
# Збирає index.html із src/: tpl.html (розмітка, CSS) + data.js (геометрія обох проєктів) + tri.js (трикутник РП за АБ арк. 6)
# + wx.js (клімат з PVsyst РП) + year.js (генерація за рік і місяці) + bess.js (УЗЕ: контейнери, траси, кошторис)
# + ep.js (Електрика: стрінги Б, щити PV, лінії Al, лотки) + app.js (сцена, розділи, сонце, УЗЕ, електрика, невідповідності)
# + montage.js (Будівництво: покроковий монтаж; вставляється в кінець app.js перед «})();» — не викидати при оновленні)
# + foto.js (точки зйомки фото обстеження 26.10.2026) + obst.js (будівлі й елементи за фото, перегляд фото; вставляється після montage.js)
# Самих фото в репозиторії немає (номери авто, договори) — вони лише в приватній версії двійника; тут перегляд показує «Фото немає в цій версії».
cd "$(dirname "$0")" && python3 - <<'PY'
r = lambda f: open('src/' + f, encoding='utf-8').read()
app = r('app.js'); cut = app.rstrip().rfind('})();')   # montage.js (Будівництво) — всередину app.js, у ту саму область видимості
app = app[:cut] + r('montage.js') + '\n' + r('obst.js') + '\n' + app[cut:]
body = r('tpl.html').replace('<script>/*DATA*/</script>', ''.join('<script>' + r(f) + '</script>' for f in ('data.js', 'tri.js', 'wx.js', 'year.js', 'bess.js', 'ep.js', 'foto.js'))).replace('<script>/*APP*/</script>', '<script>' + app + '</script>')
head = '<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
open('index.html', 'w', encoding='utf-8').write(head + body + '\n</html>\n')
print('built index.html', len(head + body) // 1024, 'KB')
PY
