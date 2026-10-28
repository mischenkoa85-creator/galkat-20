# АБК «ДБН» — підготовка до збирання всього об'єкта (28.10.2026)

Модель АБК розділена на модуль і окрему сторінку. Модуль вставляється в двійник (`antares/twin`) без перерахунку: ті самі координати, той самий three.js r128.

## Файли

| Файл | Що це |
|---|---|
| `abk_model.js` | `window.ABKModel(THREE, D, opts)`: будує АБК з СЕС у групі `root`, без DOM (лише canvas для текстур) |
| `abk_data.js` | `window.ABK_DATA = {...}`: розкладка, стрінги, траси, специфікація, кошторис (генерує `build.py`) |
| `abk_app.js` | окрема сторінка (стандарт Антарес): сцена, сонце, панелі, UA / EN; викликає `ABKModel` |
| `p1_head.html` | CSS і розмітка окремої сторінки |
| `build.py` | `index.html` = p1 + model + app + дані; плюс `abk_data.js` |
| `old/` | p2_geo / p3_el / p4_ui до розділення, у збірку не входять |

Дані: `abk_k1.json` (layout.py), `abk_dbn.json` (calc/v3/abk_dbn.py), `abk_bom.json` (calc/abk_kosh/bom.py), `abk_est.json` (calc/abk_kosh/pdf.py; рядки кошторису в `rows`).

## Виклик у двійнику

```js
// після three r128 і OrbitControls:
// <script src="abk_data.js"></script><script src="abk_model.js"></script>
const A = ABKModel(THREE, ABK_DATA, {ground: false, ctx: false, occ: [/* меші цеху, ТП, складу — для тіні на АБК */]});
scene.add(A.root);
const r = A.evaluate(dayOfYear, solarHour, true);   // стан кожного модуля і стрінга
A.paintStatus(r);                                   // колір: сонце / частково / тінь / позаду / ✕ не працює
```

- `ground: false` — земля двійника своя; `ctx: false` — край цеху і ТП-5913 у моделі АБК потрібні лише для окремої сторінки.
- `occ` — об'єкти двійника, що кидають тінь на АБК; без них тінь від цеху на АБК не рахується.
- Координати ті самі, що в двійнику: X — схід, Y — північ; three: `(x, висота, −y)`. АБК: південний блок X 108,3–127,5, Y 6,6–20,3; основний X 108,5–128,0, Y 20,3–45,2.

## Що повертає `ABKModel`

- `root`: група АБК. `groups`: шари `arch, low, wall, nad, mount, ctx, bld, safety, str, elec, lps, xm`.
- `TAGS`: позиція специфікації → об'єкти сцени. Позиції: `mod, lag, arch, frame, wrail, blk, dc, tray, inv, ac, shch, meter, bz, p1, plat, rail, walk, safety`.
- `MODS`: 132 модулі. Кожен має стрінг `k`, MPPT, місце в стрінгу, генерацію за рік, години без роботи, графік 12×24 і стан зараз. Також `STR` / `STRO` (модулі й кабелі стрінга) і `BYKEY`.
- `evaluate`, `paintStatus`, `sunAt`, `sunTimes`, `sky`, `tAir`: тінь і стан модулів (модель K1, bypass при ≥ 6 робочих у стрінгу).
- `picks`: об'єкти з підказкою `userData.info = {uk: [назва, опис], en: [...]}`. У двійнику підказка має вигляд `{t, d}`, тому: `A.picks.forEach(o => pick(o, ...o.userData.info.uk))`.
- `LB`: підписи `[позиція, {uk, en}, клас, шар]`.
- `STAGES`: етапи монтажу для «Будівництва» (`blk → arch → frame → wrail → tray → mod → dc → inv → ac → bz → safety`). У кожного етапу є `objs`, `items` (специфікація), `est` (рядки кошторису) і `sum`, $.
- `est` (кошторис ДБН: `rows`, `tot`, `totv`, `tot245`, `sec`…), `bom`. `EKF`: рядок кошторису → позиція в моделі.

## Що змінити в двійнику при збиранні

1. `src/fasad.js`, розділ 5, блок «адмінкорпус (АБК)» (рядки ≈222–261): спрощений АБК замінити на `ABKModel` або сховати, щоб не було двох будівель.
2. `build.sh`: додати `abk_data.js` у дані і `abk_model.js` перед `app.js`.
3. Розділи двійника. АБК дає дані так:
   - `pz` — підсумок АБК;
   - `bz` — `TAGS.bz`, шар `lps`;
   - `km` — `TAGS.arch / frame / wrail / blk`;
   - `ep` — стрінги `STR / STRO`, `TAGS.inv / ac / shch / meter`, лотки `TAGS.tray`;
   - `sun` — `evaluate` + `paintStatus`;
   - `bud` — `STAGES`;
   - `est` — `est.rows` разом із кошторисом цеху і УЗЕ.

## Кошторис у моделі

На окремій сторінці є вкладка «Кошторис / Estimate»: усі 59 рядків кошторису ДБН 28.10.2026 двома мовами, з підсумками, ПДВ, «245» та ефектом. Рядок, що має позицію в моделі (23 рядки), підсвічує її при натисканні.
