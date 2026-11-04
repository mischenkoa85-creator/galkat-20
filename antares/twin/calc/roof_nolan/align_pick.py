# -*- coding: utf-8 -*-
"""Підбір початку сітки колонок на кожній арці (власник 04.11, 02:53 «вирівняй у один ряд»): для кожного з трьох початків
(0 — від західної ендови, 1 — по центру, 2 — від східної) — розкладка і генерація (../v3/pv_eval.py, 11 труб — DFFILE=defl_final.json), далі на кожній арці береться
початок з найбільшою генерацією модулів (кВт·год за рік, тінь — модель v3). Записує aligned_origin у файл правил RULES."""
import os, sys, json, subprocess, collections
W = os.path.dirname(os.path.abspath(__file__)) + '/'; RF = os.environ.get('RULES', W + 'pv_rules.json'); TMP = os.environ.get('TMP', '/tmp/')
R = json.load(open(RF, encoding='utf-8')); R.pop('aligned_origin', None); json.dump(R, open(RF, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
res = {}
for o in (0, 1, 2):
    c, e = TMP + f'al_c{o}.json', TMP + f'al_e{o}.json'
    env = dict(os.environ, RULES=RF, OUT=c, ALIGN_O=','.join([str(o)] * 5))
    subprocess.run([sys.executable, W + 'pv_layout.py'], env=env, check=True, capture_output=True)
    subprocess.run([sys.executable, W + '../v3/pv_eval.py'], env=dict(os.environ, CANDS=c, OUT=e, DFFILE=os.environ.get('DFFILE', 'defl_final.json')), check=True, capture_output=True, cwd=W + '../v3')
    E = json.load(open(e)); s = collections.defaultdict(float); n = collections.Counter()
    for m in E['roof_mods']: s[m['f']] += m['kwh']; n[m['f']] += 1
    res[o] = (s, n)
arches = sorted(res[0][0]); best = []
for f in arches:
    b = max((0, 1, 2), key=lambda o: res[o][0][f]); best.append(b)
    print('арка', f, {o: (res[o][1][f], round(res[o][0][f] / 1000, 1)) for o in (0, 1, 2)}, '→', b)
R['aligned_origin'] = best; json.dump(R, open(RF, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('aligned_origin', best)
