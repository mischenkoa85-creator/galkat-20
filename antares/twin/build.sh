#!/bin/sh
# Збирає index.html із src/: tpl.html (розмітка, CSS) + data.js (геометрія обох проєктів) + tri.js (трикутник РП за АБ арк. 6)
# + wx.js (клімат з PVsyst РП) + year.js (генерація за рік і місяці) + bess.js (УЗЕ: контейнери, траси, кошторис)
# + ep.js (Електрика: стрінги Б, щити PV, лінії Al, лотки) + app.js (сцена, розділи, сонце, УЗЕ, електрика, невідповідності)
# + montage.js (Будівництво: покроковий монтаж; вставляється в кінець app.js перед «})();» — не викидати при оновленні)
# + foto.js (точки зйомки фото обстеження 26 і 27.10.2026; 27.10 — з датою в 8-му полі) + obst.js (будівлі й елементи за фото, перегляд фото; вставляється після montage.js)
# + raddata.js / rad.js (радіація на кожен м² за рік: дах, склад, фасади; розрахунок calc/irr.py + calc/stats.py; режим «Радіація, м²» у «Сонці»)
# + facpvdata.js / facpv.js (фасадні модулі: південь вертикально, схід — козирок 25° + вертикально; calc/vert.py, combo.py, fac25.py; перемикач у «Загальному»)
# + roofv2data.js / roofv2.js (27.10: дах гранями за розрізом 1-1; два сценарії ліхтаря — 3,40 × 1,74 за РП з модулями книжково по схилах і 2,87 за розрізом з «доміками»;
#   тіні й потужність цих модулів у «Сонці», дуги сонця за сезонами; calc/v2/twin_v2_export.py). roofnew.js / roofnewdata.js (26.10) у збірку більше не входять.
# + roofv3.js (27.10, вечір: v3 — дах за обмірами й супутником: дефлектори, ліхтарі 3,66 × 1,89, варіанти А/Б/В як сценарії C/D/E у roofv2.js; карта опромінення 0,5 м у raddata.js; calc/v3)
# + lanfdata.js (27.10, вечір: ліхтарі розібрати → каркас 22° або 13°, 297 модулів вертикально, 27 стрінгів; calc/v3/lan13_mount.py (TILT) → shade_lan.py → lanf_twin_export.py;
#   сценарії «Ліхтарі → каркас 22° / 13°» у roofv2.js з живими тінями і річною тінню даху, порівняння в «Загальному» — roofv3.js)
# + fasad.js (фасади цеху: панелі, вікна, ворота, кабелі; ДГУ, сходи, контейнери, ТП, адмінкорпус, покриття двору; після obst.js)
# Самих фото в репозиторії немає (номери авто, договори) — вони лише в приватній версії двійника; тут перегляд показує «Фото немає в цій версії».
cd "$(dirname "$0")" && python3 - <<'PY'
r = lambda f: open('src/' + f, encoding='utf-8').read()
app = r('app.js'); cut = app.rstrip().rfind('})();')   # montage.js (Будівництво) — всередину app.js, у ту саму область видимості
app = app[:cut] + r('montage.js') + '\n' + r('obst.js') + '\n' + r('fasad.js') + '\n' + r('rad.js') + '\n' + r('facpv.js') + '\n' + r('roofv2.js') + '\n' + r('roofv3.js') + '\n' + app[cut:]
body = r('tpl.html').replace('<script>/*DATA*/</script>', ''.join('<script>' + r(f) + '</script>' for f in ('data.js', 'tri.js', 'wx.js', 'year.js', 'bess.js', 'ep.js', 'foto.js', 'raddata.js', 'facpvdata.js', 'roofv2data.js', 'lanfdata.js'))).replace('<script>/*APP*/</script>', '<script>' + app + '</script>')
head = '<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
open('index.html', 'w', encoding='utf-8').write(head + body + '\n</html>\n')
print('built index.html', len(head + body) // 1024, 'KB')
PY
