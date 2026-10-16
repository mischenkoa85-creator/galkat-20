/**
 * Журнал СЕС площадки 11 (ГалКат, проєкт ОС-108) — сервер для сайту
 * https://mischenkoa85-creator.github.io/galkat-20/ses11/
 *
 * Зберігає звіти робіт, документи складу і фото в Google-таблиці та на Google Диску.
 * Доступ — за особистими кодами з аркуша «Доступи».
 *
 * Як встановити (один раз):
 *   1. Виконати функцію setup — створить аркуші та код адміністратора (у аркуші «Доступи»).
 *   2. Розгорнути → Нове розгортання → Вебзастосунок: «Виконувати як: я», «Доступ: усі».
 *   3. Скопіювати адресу вебзастосунку (…/exec) і передати для сайту.
 *
 * Зміни 16.10.2026:
 *   - ідемпотентність: сайт надсилає ID запису з телефона (cid). Повтор із черги офлайн із тим самим cid
 *     не створює другий запис — сервер повертає вже записаний (dup: true). Колонка «ID клієнта».
 *   - записи складу мають «Тип»: «видача» (як раніше) або «зберігання ГАЛ-КАТ» — передача матеріалів
 *     відкладених дахів 10–11 на відповідальне зберігання ТзДВ «ГАЛ-КАТ», з номером акта (колонка «Акт»).
 *   - нові колонки дописуються праворуч у наявні аркуші самі, старі рядки не змінюються.
 *
 * Зміни 17.10.2026 — модуль «Склад», кроки 1–2:
 *   - нові аркуші «Номенклатура» (дзеркало довідника, за бажанням), «Надходження», «Рух», «Серійні».
 *     Створюються самі, якщо їх немає; наявні аркуші й рядки не змінюються.
 *   - колонка «Бригада» в «Доступи» (для виконавця; порожньо — бригада = ім’я) і в «Звіти» (бригада автора звіту).
 *   - дії: receipt (надходження), move (видача / повернення / брак / передача на зберігання / інвентаризація),
 *     stock без items — читання документів і залишків за місцями (stock з items — як раніше, запис у «Видачі»).
 *   - писати склад можуть лише комірник і адмін; виконавець читає лише рух своєї бригади;
 *     замовник — давальницькі матеріали ГАЛ-КАТ завжди, матеріали підрядника — якщо в «Налаштування»
 *     customerSeesContractorStock = так.
 *   Після заміни коду: Розгорнути → Керувати розгортаннями → редагувати → Нова версія.
 */

const SHEET_ID = '1muZlfeTZ3U5FoOCJ7Pbu1u5Jg8Dw0KVevxPisuX0d0Y';
const TZ = 'Europe/Kyiv';
const PHOTO_FOLDERS = {
  '1': '1Tiw8pVq_NpKVJqC6ul0swUcPlTvtsDiN', '2': '1hpR58TU6YNunEWBLWOdw910eAv3niHZV',
  '3': '1EvqNegY9elOC8KB2VhxUxdIR0Tx2VIus', '4': '1BUDiD3xfUXUAmfUmrcNU8aNKIZL3EDkP',
  '5': '1L-j0eFM6pXjUQnIbYf6bhnjpMApsiVmD', '6': '1kSWZ86_SSbIDqscXanjpLtzzYXd1fbVT',
  '7': '1l7rf0p_tXY2e-I-52vB9faHYFEQEZYQW', '8': '1YS5Fx7aep3WCJ1RlvBUSuGQnHwbh6Lxr',
  '9': '1tmJdNkYU-zQCffz4YHldrUox9uMiGQ1b', '10': '1ULm5sAUwqL5ak5RN8UAabue84_8VYCOC',
  '11': '1KJlSYPOwR5mxcWamAkhWZh4lNQZHGLUI', 'S': '1hmhkMO8utPaSVNM9cTjvdVj8Ahok2iDj'
};
const OBJECTS = Object.keys(PHOTO_FOLDERS);
const ROLES = ['адмін', 'виконавець', 'комірник', 'замовник'];
const MAX_PHOTOS = 8;
const STOCK_TYPES = ['видача', 'зберігання ГАЛ-КАТ'];
const CID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/* ---- склад (крок 2) ---- */
const P_STORE = 'склад';
const P_KEEP = 'зберігання ГАЛ-КАТ';
const P_SCRAP = 'брак';
const P_BRIG = 'бригада: ';
const OWNERS = ['підрядник', 'ГАЛ-КАТ'];
/* тип документа → дозволені місця «звідки» / «куди» (вид місця) */
const MOVE_TYPES = {
  'видача': { from: ['склад'], to: ['бригада'], roof: true },
  'повернення': { from: ['бригада'], to: ['склад'] },
  'брак': { from: ['склад', 'бригада'], to: ['брак'], reason: true },
  'передача на зберігання': { from: ['склад'], to: ['зберігання'], roof: true },
  'інвентаризація': { from: ['склад', 'бригада', 'зберігання'], to: [''], signed: true, reason: true }
};
/* статус серійного номера за видом місця; «вмонтовано» ставитиме приймання (крок 3) */
const SERIAL_STATUS = { 'склад': 'склад', 'бригада': 'бригада', 'зберігання': 'зберігання', 'брак': 'брак' };
const ITEM_RE = /^[A-Za-z0-9_.-]{1,16}$/;
const SERIAL_RE = /^[A-Za-z0-9._\/-]{3,40}$/;
const MAX_LINES = 100;
const MAX_SERIALS = 2000;
const MAX_DOC_PHOTOS = 4;

const TABS = {
  access: { name: 'Доступи', head: ['Код', 'Ім’я', 'Роль', 'Активний', 'Примітка', 'Бригада'] },
  reports: { name: 'Звіти', head: ['ID звіту', 'Дата', 'Об’єкт', 'Дія', 'Кількість', 'Кран, маш.-год', 'Фото дня', 'Фото, шт', 'Примітка', 'Хто', 'Записано', 'ID клієнта', 'Бригада'] },
  stock: { name: 'Видачі', head: ['ID видачі', 'Дата', 'Дах', 'Позиція', 'Найменування', 'Кількість', 'Примітка', 'Хто', 'Записано', 'Тип', 'Акт', 'ID клієнта'] },
  settings: { name: 'Налаштування', head: ['Параметр', 'Значення', 'Пояснення'] },
  norms: { name: 'Норми', head: ['Ключ', 'Норма, люд-год/од.', 'Пояснення'] },
  plan: { name: 'Обсяги', head: ['Об’єкт', 'Дія', 'Обсяг', 'Пояснення'] },
  nomen: { name: 'Номенклатура', head: ['Код', 'Назва', 'Розмір / марка', 'Од.', 'Маса од., кг', 'Облік', 'Власник', 'Аналоги', 'Примітка'] },
  receipts: { name: 'Надходження', head: ['ID документа', 'Дата', 'Постачальник / накладна', 'Позиція', 'Найменування', 'Кількість', 'Од.', 'Власник', 'Серійні номери', 'Фото', 'Хто', 'Записано', 'ID клієнта'] },
  moves: { name: 'Рух', head: ['ID документа', 'Дата', 'Тип', 'Звідки', 'Куди', 'Дах', 'Позиція', 'Найменування', 'Кількість', 'Серійні номери', 'Причина', 'Хто', 'Підпис', 'Записано', 'Власник', 'Акт', 'ID клієнта'] },
  serials: { name: 'Серійні', head: ['Серійний номер', 'Позиція', 'Статус', 'Місце', 'Дах', 'Останній документ', 'Змінено'] }
};
/* номер колонки «ID клієнта» (з 1) */
const CID_COL = { reports: 12, stock: 12, receipts: 13, moves: 17 };
/* колонка «Хто» (з 0) — для видалення власних записів */
const WHO_COL = { reports: 9, stock: 7, receipts: 10, moves: 11 };
const TEXT_COLS = { reports: ['B:B'], stock: ['B:B'], access: ['A:A'], receipts: ['B:B', 'D:D', 'I:I'], moves: ['B:B', 'G:G', 'J:J'], serials: ['A:A', 'B:B'], nomen: ['A:A'] };
const DEFAULT_SETTINGS = [
  ['day1', '', 'День 1 за план-графіком договору (дата РРРР-ММ-ДД): перший робочий день після виконання стартових умов, п. 3.1'],
  ['days', 60, 'Строк монтажу і ПНР у робочих днях, п. 3.2 договору'],
  ['week', 5, 'Робочих днів на тиждень: 5 (Пн–Пт) або 6 (Пн–Сб)'],
  ['rain', 60, 'Ймовірність дощу, %, з якої день вважається дощовим для робіт на даху'],
  ['gust', 12, 'Пориви вітру, м/с, з яких кран і монтаж модулів — під ризиком'],
  ['holidays', '', 'Неробочі дати через кому, РРРР-ММ-ДД'],
  ['acceptance', 'foreman', 'Хто приймає приховані роботи: foreman (прораб підрядника), supervision (технагляд замовника), both (обидва послідовно)'],
  ['customerSeesContractorStock', 'ні', 'Замовник бачить залишки матеріалів підрядника: так / ні. Давальницькі ГАЛ-КАТ замовник бачить завжди']
];

/* ---------------- setup ---------------- */
function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheets_(ss);
  const sh = ss.getSheetByName(TABS.access.name);
  if (sh.getLastRow() < 2) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    sh.appendRow([code, 'Адміністратор', 'адмін', 'так', 'Змініть ім’я; код можна змінити', '']);
    Logger.log('Код адміністратора: ' + code);
  }
  const first = ss.getSheets()[0];
  if (first.getName() === 'Аркуш1' || first.getName() === 'Sheet1') { if (first.getLastRow() === 0) ss.deleteSheet(first); }
  Logger.log('Готово. Аркуші створено.');
}

function ensureSheets_(ss) {
  for (const k in TABS) {
    const t = TABS[k];
    let sh = ss.getSheetByName(t.name);
    if (!sh) {
      sh = ss.insertSheet(t.name);
      sh.getRange(1, 1, 1, t.head.length).setValues([t.head]).setFontWeight('bold').setBackground('#e8eef6');
      sh.setFrozenRows(1);
      (TEXT_COLS[k] || []).forEach(function (a1) { sh.getRange(a1).setNumberFormat('@'); });
      if (k === 'settings') sh.getRange(2, 1, DEFAULT_SETTINGS.length, 3).setValues(DEFAULT_SETTINGS);
      sh.autoResizeColumns(1, t.head.length);
    } else {
      /* аркуш створено старою версією: дописати відсутні заголовки праворуч */
      const lc = sh.getLastColumn();
      if (lc >= 1 && lc < t.head.length) sh.getRange(1, lc + 1, 1, t.head.length - lc).setValues([t.head.slice(lc)]).setFontWeight('bold').setBackground('#e8eef6');
    }
  }
}

/* ---------------- web app ---------------- */
function doGet() {
  return ContentService.createTextOutput('Журнал СЕС площадки 11: сервер працює.');
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, error: 'bad_request' }); }
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    ensureSheets_(ss);
    const me = auth_(ss, req.code);
    if (!me) return out_({ ok: false, error: 'bad_code' });
    const writer = me.role === 'адмін' || me.role === 'комірник';
    switch (req.action) {
      case 'login': return out_({ ok: true, me: me });
      case 'data': return out_({ ok: true, me: me, data: readAll_(ss) });
      case 'report':
        if (!(me.role === 'адмін' || me.role === 'виконавець')) return out_({ ok: false, error: 'forbidden' });
        return out_(saveReport_(ss, me, req));
      case 'stock':
        /* з items — запис старого формату («Видачі»), як раніше; без items — читання складу */
        if (req.items && typeof req.items === 'object') {
          if (!writer) return out_({ ok: false, error: 'forbidden' });
          return out_(saveStock_(ss, me, req));
        }
        return out_({ ok: true, me: me, stock: readStock_(ss, me) });
      case 'receipt':
        if (!writer) return out_({ ok: false, error: 'forbidden' });
        return out_(saveReceipt_(ss, me, req));
      case 'move':
        if (!writer) return out_({ ok: false, error: 'forbidden' });
        return out_(saveMove_(ss, me, req));
      case 'delete':
        return out_(deleteRows_(ss, me, req));
      default: return out_({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return out_({ ok: false, error: 'server', message: String(err && err.message || err) });
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function auth_(ss, code) {
  code = String(code || '').trim();
  if (!code) return null;
  const rows = ss.getSheetByName(TABS.access.name).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]).trim() === code) {
      const active = String(r[3]).trim().toLowerCase();
      if (active === 'ні' || active === 'no' || active === 'false') return null;
      const role = String(r[2]).trim().toLowerCase();
      const me = { name: String(r[1] || 'Без імені').trim(), role: ROLES.indexOf(role) >= 0 ? role : 'замовник' };
      if (me.role === 'виконавець') me.brigade = String(r[5] || '').trim().slice(0, 60) || me.name;
      return me;
    }
  }
  return null;
}

function ymd_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v || '').trim();
}

function stamp_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "yyyy-MM-dd'T'HH:mm:ss");
  return String(v || '');
}

function yes_(v) { return v === true || /^(так|true|yes|1|да)$/i.test(String(v == null ? '' : v).trim()); }

/* ім’я виконавця → бригада (для звітів, записаних до появи колонки «Бригада») */
function brigades_(ss) {
  const rows = ss.getSheetByName(TABS.access.name).getDataRange().getValues();
  const byName = {}; const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; if (String(r[2]).trim().toLowerCase() !== 'виконавець') continue;
    const name = String(r[1] || '').trim(); const br = String(r[5] || '').trim().slice(0, 60) || name;
    if (name && !byName[name]) byName[name] = br;
    const active = String(r[3]).trim().toLowerCase();
    if (br && list.indexOf(br) < 0 && !(active === 'ні' || active === 'no' || active === 'false')) list.push(br);
  }
  return { byName: byName, list: list };
}

/* ---------------- read ---------------- */
function readAll_(ss) {
  const rep = ss.getSheetByName(TABS.reports.name).getDataRange().getValues();
  const brs = brigades_(ss).byName;
  const reports = {};
  for (let i = 1; i < rep.length; i++) {
    const r = rep[i]; const id = String(r[0]); if (!id) continue;
    const x = reports[id] || (reports[id] = { id: id, cid: String(r[11] || ''), d: ymd_(r[1]), o: String(r[2]), items: {}, crane: 0, photo: '', photos: 0, n: '', by: '', at: '', br: '' });
    const w = String(r[3]); const q = Number(r[4]);
    if (w && w !== '—' && isFinite(q)) x.items[w] = (x.items[w] || 0) + q;
    if (Number(r[5]) > 0) x.crane += Number(r[5]);
    if (r[6]) x.photo = String(r[6]);
    if (Number(r[7]) > 0) x.photos = Math.max(x.photos, Number(r[7]));
    if (r[8]) x.n = String(r[8]);
    x.by = String(r[9] || ''); x.at = stamp_(r[10]);
    x.br = String(r[12] || '').trim() || brs[x.by] || '';
  }
  const st = ss.getSheetByName(TABS.stock.name).getDataRange().getValues();
  const stock = {};
  for (let i = 1; i < st.length; i++) {
    const r = st[i]; const id = String(r[0]); if (!id) continue;
    const x = stock[id] || (stock[id] = { id: id, cid: String(r[11] || ''), d: ymd_(r[1]), o: String(r[2]), items: {}, type: String(r[9] || '').trim() || 'видача', act: String(r[10] || ''), n: '', by: '', at: '' });
    const k = String(r[3]); const q = Number(r[5]);
    if (k && isFinite(q)) x.items[k] = (x.items[k] || 0) + q;
    if (r[6]) x.n = String(r[6]);
    x.by = String(r[7] || ''); x.at = stamp_(r[8]);
  }
  const settings = readSettings_(ss);
  const norms = {};
  const n = ss.getSheetByName(TABS.norms.name).getDataRange().getValues();
  for (let i = 1; i < n.length; i++) { const k = String(n[i][0]).trim(); const v = Number(n[i][1]); if (k && isFinite(v) && n[i][1] !== '') norms[k] = v; }
  const plan = {};
  const p = ss.getSheetByName(TABS.plan.name).getDataRange().getValues();
  for (let i = 1; i < p.length; i++) { const o = String(p[i][0]).trim(); const w = String(p[i][1]).trim(); const v = Number(p[i][2]); if (o && w && isFinite(v) && p[i][2] !== '') plan[o + '.' + w] = v; }
  return { reports: Object.values(reports), stock: Object.values(stock), settings: settings, norms: norms, plan: plan };
}

function readSettings_(ss) {
  const settings = {};
  const s = ss.getSheetByName(TABS.settings.name).getDataRange().getValues();
  for (let i = 1; i < s.length; i++) { const k = String(s[i][0]).trim(); if (k) settings[k] = s[i][1] instanceof Date ? ymd_(s[i][1]) : s[i][1]; }
  return settings;
}

const splitSerials_ = v => String(v || '').split(/[\s,;]+/).filter(Boolean);

/* документи складу. Фільтр за роллю:
   адмін, комірник — усе; виконавець — лише рух своєї бригади; замовник — давальницькі ГАЛ-КАТ,
   матеріали підрядника — лише якщо customerSeesContractorStock. */
function readStock_(ss, me) {
  const settings = readSettings_(ss);
  const seeAll = yes_(settings.customerSeesContractorStock);
  const acceptance = ['foreman', 'supervision', 'both'].indexOf(String(settings.acceptance || '').trim()) >= 0 ? String(settings.acceptance).trim() : 'foreman';
  const full = me.role === 'адмін' || me.role === 'комірник';
  const myPlace = me.role === 'виконавець' ? P_BRIG + me.brigade : '';
  const lineOk = owner => full || me.role === 'виконавець' || seeAll || owner === 'ГАЛ-КАТ';

  const receipts = {};
  if (me.role !== 'виконавець') {
    const rv = ss.getSheetByName(TABS.receipts.name).getDataRange().getValues();
    for (let i = 1; i < rv.length; i++) {
      const r = rv[i]; const id = String(r[0]); if (!id) continue;
      const owner = String(r[7] || '').trim() || 'підрядник'; if (!lineOk(owner)) continue;
      const x = receipts[id] || (receipts[id] = { id: id, cid: String(r[12] || ''), d: ymd_(r[1]), doc: String(r[2] || ''), lines: [], photo: '', by: '', at: '' });
      x.lines.push({ c: String(r[3]), name: String(r[4] || ''), q: Number(r[5]) || 0, unit: String(r[6] || ''), owner: owner, serials: splitSerials_(r[8]) });
      if (r[9]) x.photo = String(r[9]);
      x.by = String(r[10] || ''); x.at = stamp_(r[11]);
    }
  }
  const moves = {};
  const mv = ss.getSheetByName(TABS.moves.name).getDataRange().getValues();
  for (let i = 1; i < mv.length; i++) {
    const r = mv[i]; const id = String(r[0]); if (!id) continue;
    const from = String(r[3] || ''); const to = String(r[4] || '');
    if (myPlace && from !== myPlace && to !== myPlace) continue;
    const owner = String(r[14] || '').trim() || 'підрядник'; if (!lineOk(owner)) continue;
    const x = moves[id] || (moves[id] = { id: id, cid: String(r[16] || ''), d: ymd_(r[1]), type: String(r[2] || ''), from: from, to: to, o: String(r[5] || ''), lines: [], reason: String(r[10] || ''), by: '', sign: '', act: String(r[15] || ''), at: '' });
    x.lines.push({ c: String(r[6]), name: String(r[7] || ''), q: Number(r[8]) || 0, owner: owner, serials: splitSerials_(r[9]) });
    if (r[12]) x.sign = String(r[12]);
    x.by = String(r[11] || ''); x.at = stamp_(r[13]);
  }
  const custItems = {};
  [receipts, moves].forEach(function (m) { for (const id in m) m[id].lines.forEach(function (l) { if (l.owner === 'ГАЛ-КАТ') custItems[l.c] = true; }); });
  const serials = [];
  const sv = ss.getSheetByName(TABS.serials.name).getDataRange().getValues();
  for (let i = 1; i < sv.length; i++) {
    const r = sv[i]; const sn = String(r[0] || '').trim(); if (!sn) continue;
    const x = { sn: sn, c: String(r[1]), status: String(r[2] || ''), place: String(r[3] || ''), o: String(r[4] || ''), doc: String(r[5] || '') };
    if (myPlace && x.place !== myPlace) continue;
    if (me.role === 'замовник' && !seeAll && !custItems[x.c]) continue;
    serials.push(x);
  }
  /* залишки за місцями лише з документів (без списання за звітами — його рахує сайт за специфікаціями виробів) */
  const bal = {};
  const add = function (place, c, q) { if (!place) return; const b = bal[place] || (bal[place] = {}); b[c] = Math.round(((b[c] || 0) + q) * 1000) / 1000; };
  for (const id in receipts) receipts[id].lines.forEach(function (l) { add(P_STORE, l.c, l.q); });
  for (const id in moves) {
    const m = moves[id];
    m.lines.forEach(function (l) { if (m.type === 'інвентаризація') add(m.from, l.c, l.q); else { add(m.from, l.c, -l.q); add(m.to, l.c, l.q); } });
  }
  if (myPlace) for (const p in bal) if (p !== myPlace) delete bal[p];
  let brigades;
  if (full) {
    brigades = brigades_(ss).list;
    for (const id in moves) [moves[id].from, moves[id].to].forEach(function (p) { if (p.indexOf(P_BRIG) === 0) { const b = p.slice(P_BRIG.length); if (brigades.indexOf(b) < 0) brigades.push(b); } });
  } else if (myPlace) brigades = [me.brigade];
  else { brigades = []; for (const id in moves) [moves[id].from, moves[id].to].forEach(function (p) { if (p.indexOf(P_BRIG) === 0) { const b = p.slice(P_BRIG.length); if (brigades.indexOf(b) < 0) brigades.push(b); } }); }
  return {
    receipts: Object.values(receipts), moves: Object.values(moves), serials: serials, bal: bal, brigades: brigades,
    cfg: { customerSeesContractorStock: seeAll, acceptance: acceptance, contractorVisible: full || me.role === 'виконавець' || seeAll }
  };
}

/* ---------------- write ---------------- */
function newId_(prefix) {
  return prefix + Utilities.formatDate(new Date(), TZ, 'yyMMddHHmmss') + Math.floor(Math.random() * 1000);
}

/* перший рядок аркуша з цим ID клієнта або null; col — номер колонки «ID клієнта» (з 1) */
function findCid_(sh, cid, col) {
  if (!cid) return null;
  col = col || 12;
  const last = sh.getLastRow(); if (last < 2) return null;
  const vals = sh.getRange(2, 1, last - 1, col).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][col - 1]) === cid) return vals[i];
  return null;
}

function dayFolder_(objectId, d) {
  const root = DriveApp.getFolderById(PHOTO_FOLDERS[objectId]);
  const it = root.getFoldersByName(d);
  return it.hasNext() ? it.next() : root.createFolder(d);
}

/* фото накладних і підписи: «Загальна частина» → «Склад» → дата */
function stockFolder_(d) {
  const root = DriveApp.getFolderById(PHOTO_FOLDERS.S);
  const a = root.getFoldersByName('Склад'); const sk = a.hasNext() ? a.next() : root.createFolder('Склад');
  const b = sk.getFoldersByName(d); return b.hasNext() ? b.next() : sk.createFolder(d);
}

function saveReport_(ss, me, req) {
  const d = String(req.d || ''); const o = String(req.o || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  if (OBJECTS.indexOf(o) < 0) return { ok: false, error: 'bad_object' };
  const items = req.items || {}; const keys = Object.keys(items).filter(function (w) { return /^[a-z_0-9]{2,20}$/.test(w) && isFinite(Number(items[w])) && Number(items[w]) !== 0; });
  const crane = Math.max(0, Number(req.crane) || 0);
  const photos = Array.isArray(req.photos) ? req.photos.slice(0, MAX_PHOTOS) : [];
  if (!keys.length && !crane && !photos.length) return { ok: false, error: 'empty' };
  const cid = CID_RE.test(String(req.cid || '')) ? String(req.cid) : '';
  const sh = ss.getSheetByName(TABS.reports.name);
  const prev = findCid_(sh, cid);
  if (prev) return { ok: true, dup: true, id: String(prev[0]), photo: String(prev[6] || ''), photos: Number(prev[7]) || 0 };
  const id = newId_('R');
  const files = [];
  let folderUrl = '';
  let saved = 0;
  if (photos.length) {
    const folder = dayFolder_(o, d);
    folderUrl = folder.getUrl();
    const stamp = Utilities.formatDate(new Date(), TZ, 'HHmmss');
    photos.forEach(function (p, i) {
      if (!p || !p.b64) return;
      const blob = Utilities.newBlob(Utilities.base64Decode(p.b64), p.mime || 'image/jpeg', (o === 'S' ? 'Загальна' : 'Дах' + o) + '_' + d + '_' + stamp + '_' + (i + 1) + '.jpg');
      files.push(folder.createFile(blob)); saved++;
    });
  }
  const note = String(req.note || '').slice(0, 300);
  const now = new Date();
  const br = me.brigade || '';
  const rows = [];
  if (!keys.length) rows.push([id, d, o, '—', '', crane || '', folderUrl, saved || '', note, me.name, now, cid, br]);
  keys.forEach(function (w, i) { rows.push([id, d, o, w, Number(items[w]), i === 0 ? (crane || '') : '', folderUrl, i === 0 ? (saved || '') : '', i === 0 ? note : '', me.name, now, cid, br]); });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    /* дві одночасні спроби з тим самим cid: записує лише перша, фото другої — у кошик */
    const again = findCid_(sh, cid);
    if (again) { files.forEach(function (f) { f.setTrashed(true); }); return { ok: true, dup: true, id: String(again[0]), photo: String(again[6] || ''), photos: Number(again[7]) || 0 }; }
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally { lock.releaseLock(); }
  return { ok: true, id: id, photo: folderUrl, photos: saved };
}

/* старий формат складу («Видачі»): лишається для записів із черги телефонів зі старою версією сайту */
function saveStock_(ss, me, req) {
  const d = String(req.d || ''); const o = String(req.o || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  if (OBJECTS.indexOf(o) < 0 || o === 'S') return { ok: false, error: 'bad_object' };
  const items = req.items || {};
  const keys = Object.keys(items).filter(function (k) { return /^[a-z0-9]{1,8}$/.test(k) && isFinite(Number(items[k].q)) && Number(items[k].q) !== 0; });
  if (!keys.length) return { ok: false, error: 'empty' };
  const type = String(req.type || req.phase || 'видача').trim();
  if (STOCK_TYPES.indexOf(type) < 0) return { ok: false, error: 'bad_type' };
  const act = String(req.act || '').slice(0, 60);
  const cid = CID_RE.test(String(req.cid || '')) ? String(req.cid) : '';
  const id = newId_(type === 'видача' ? 'V' : 'Z'); const note = String(req.note || '').slice(0, 200); const now = new Date();
  const rows = keys.map(function (k, i) { return [id, d, o, k, String(items[k].name || '').slice(0, 200), Number(items[k].q), i === 0 ? note : '', me.name, now, type, act, cid]; });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = ss.getSheetByName(TABS.stock.name);
    const prev = findCid_(sh, cid);
    if (prev) return { ok: true, dup: true, id: String(prev[0]) };
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally { lock.releaseLock(); }
  return { ok: true, id: id };
}

/* рядки документа складу: [{c, q, name, unit, owner, serials, over}] → перевірені, або { error } */
function cleanLines_(req, signed) {
  const src = Array.isArray(req.lines) ? req.lines : [];
  if (!src.length) return { error: 'empty' };
  if (src.length > MAX_LINES) return { error: 'bad_lines' };
  const lines = []; const seen = {}; let nSer = 0;
  for (let i = 0; i < src.length; i++) {
    const l = src[i] || {}; const c = String(l.c || '');
    if (!ITEM_RE.test(c)) return { error: 'bad_item' };
    const q = Math.round(Number(l.q) * 1000) / 1000;
    if (!isFinite(q) || q === 0 || (!signed && q < 0) || Math.abs(q) > 1e7) return { error: 'bad_qty' };
    const owner = OWNERS.indexOf(String(l.owner || '')) >= 0 ? String(l.owner) : 'підрядник';
    const serials = Array.isArray(l.serials) ? l.serials.map(function (s) { return String(s).trim(); }).filter(Boolean) : [];
    for (let j = 0; j < serials.length; j++) {
      if (!SERIAL_RE.test(serials[j])) return { error: 'bad_serial', message: serials[j] };
      if (seen[serials[j]]) return { error: 'serial_dup', message: serials[j] };
      seen[serials[j]] = true;
    }
    if (serials.length && (signed || serials.length !== q)) return { error: 'serial_count', message: c };
    nSer += serials.length; if (nSer > MAX_SERIALS) return { error: 'bad_lines' };
    lines.push({ c: c, q: q, name: String(l.name || '').slice(0, 200), unit: String(l.unit || '').slice(0, 20), owner: owner, serials: serials, over: !!l.over });
  }
  return { lines: lines };
}

function placeKind_(p) {
  p = String(p || '');
  if (p === P_STORE) return 'склад';
  if (p === P_KEEP) return 'зберігання';
  if (p === P_SCRAP) return 'брак';
  if (p.indexOf(P_BRIG) === 0 && p.length > P_BRIG.length && p.length <= P_BRIG.length + 60) return 'бригада';
  return p === '' ? '' : null;
}

function savePhotos_(list, d, prefix, files) {
  if (!list.length) return '';
  const folder = stockFolder_(d); const stamp = Utilities.formatDate(new Date(), TZ, 'HHmmss');
  list.forEach(function (p, i) {
    if (!p || !p.b64) return;
    files.push(folder.createFile(Utilities.newBlob(Utilities.base64Decode(p.b64), p.mime || 'image/jpeg', prefix + '_' + d + '_' + stamp + '_' + (i + 1) + (/png/.test(p.mime || '') ? '.png' : '.jpg'))));
  });
  return files.length ? folder.getUrl() : '';
}

function readSerials_(ss) {
  const sh = ss.getSheetByName(TABS.serials.name);
  const vals = sh.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < vals.length; i++) { const sn = String(vals[i][0] || '').trim(); if (sn) map[sn] = { row: i + 1, v: vals[i].slice(0, 7) }; }
  return { sh: sh, map: map };
}

/* записати змінені/нові серійні номери одним викликом на рядок-блок */
function writeSerials_(S, changes) {
  const add = [];
  changes.forEach(function (v) { const x = S.map[v[0]]; if (x) S.sh.getRange(x.row, 1, 1, 7).setValues([v]); else add.push(v); });
  if (add.length) S.sh.getRange(S.sh.getLastRow() + 1, 1, add.length, 7).setValues(add);
}

/* Надходження: склад +; серійні номери модулів і щитків — у «Серійні» зі статусом «склад» */
function saveReceipt_(ss, me, req) {
  const d = String(req.d || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  const L = cleanLines_(req, false); if (L.error) return { ok: false, error: L.error, message: L.message || '' };
  const cid = CID_RE.test(String(req.cid || '')) ? String(req.cid) : '';
  const sh = ss.getSheetByName(TABS.receipts.name);
  const prev = findCid_(sh, cid, CID_COL.receipts);
  if (prev) return { ok: true, dup: true, id: String(prev[0]) };
  const doc = String(req.doc || '').slice(0, 120);
  const id = newId_('N'); const now = new Date(); const files = [];
  const photos = Array.isArray(req.photos) ? req.photos.slice(0, MAX_DOC_PHOTOS) : [];
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const again = findCid_(sh, cid, CID_COL.receipts);
    if (again) return { ok: true, dup: true, id: String(again[0]) };
    const S = readSerials_(ss);
    for (let i = 0; i < L.lines.length; i++) for (let j = 0; j < L.lines[i].serials.length; j++) if (S.map[L.lines[i].serials[j]]) return { ok: false, error: 'serial_dup', message: L.lines[i].serials[j] };
    const link = savePhotos_(photos, d, 'Накладна', files);
    const rows = L.lines.map(function (l) { return [id, d, doc, l.c, l.name, l.q, l.unit, l.owner, l.serials.join('\n'), link, me.name, now, cid]; });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    const ch = [];
    L.lines.forEach(function (l) { l.serials.forEach(function (sn) { ch.push([sn, l.c, SERIAL_STATUS['склад'], P_STORE, '', id, now]); }); });
    if (ch.length) writeSerials_(S, ch);
    return { ok: true, id: id, photo: link, serials: ch.length };
  } finally { lock.releaseLock(); }
}

/* Рух: видача / повернення / брак / передача на зберігання / інвентаризація */
function saveMove_(ss, me, req) {
  const d = String(req.d || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  const type = String(req.type || '').trim(); const T = MOVE_TYPES[type];
  if (!T) return { ok: false, error: 'bad_type' };
  const from = String(req.from || '').trim(); const to = T.signed ? '' : String(req.to || '').trim();
  const fk = placeKind_(from); const tk = placeKind_(to);
  if (T.from.indexOf(fk) < 0 || T.to.indexOf(tk) < 0) return { ok: false, error: 'bad_place' };
  const o = String(req.o || '');
  if (o && OBJECTS.indexOf(o) < 0) return { ok: false, error: 'bad_object' };
  if (T.roof && !o) return { ok: false, error: 'bad_object' };
  const L = cleanLines_(req, !!T.signed); if (L.error) return { ok: false, error: L.error, message: L.message || '' };
  if (T.signed && L.lines.some(function (l) { return l.serials.length; })) return { ok: false, error: 'serial_state' };
  const reason = String(req.reason || '').trim().slice(0, 200);
  if (!reason && (T.reason || L.lines.some(function (l) { return l.over; }))) return { ok: false, error: 'need_reason' };
  const act = String(req.act || '').slice(0, 60);
  const cid = CID_RE.test(String(req.cid || '')) ? String(req.cid) : '';
  const sh = ss.getSheetByName(TABS.moves.name);
  const prev = findCid_(sh, cid, CID_COL.moves);
  if (prev) return { ok: true, dup: true, id: String(prev[0]) };
  const id = newId_({ 'видача': 'V', 'повернення': 'P', 'брак': 'B', 'передача на зберігання': 'Z', 'інвентаризація': 'I' }[type]);
  const now = new Date(); const files = [];
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const again = findCid_(sh, cid, CID_COL.moves);
    if (again) return { ok: true, dup: true, id: String(again[0]) };
    /* серійний номер має бути саме в місці «звідки» і належати цій позиції */
    const S = readSerials_(ss); const ch = [];
    for (let i = 0; i < L.lines.length; i++) {
      const l = L.lines[i];
      for (let j = 0; j < l.serials.length; j++) {
        const x = S.map[l.serials[j]];
        if (!x) return { ok: false, error: 'serial_unknown', message: l.serials[j] };
        if (String(x.v[1]) !== l.c || String(x.v[3]) !== from) return { ok: false, error: 'serial_state', message: l.serials[j] + ': ' + x.v[2] + ', ' + x.v[3] };
        ch.push([l.serials[j], l.c, SERIAL_STATUS[tk], to, o || String(x.v[4] || ''), id, now]);
      }
    }
    const sign = req.sign && req.sign.b64 ? savePhotos_([{ b64: req.sign.b64, mime: 'image/png' }], d, 'Підпис_' + id, files) : '';
    const rows = L.lines.map(function (l, i) { return [id, d, type, from, to, o, l.c, l.name, l.q, l.serials.join('\n'), reason, me.name, i === 0 ? sign : '', now, l.owner, act, cid]; });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    if (ch.length) writeSerials_(S, ch);
    return { ok: true, id: id, sign: sign };
  } finally { lock.releaseLock(); }
}

/* «Серійні» з нуля за «Надходження» і «Рух» у порядку запису — після видалення документа */
function rebuildSerials_(ss) {
  const ev = [];
  const rv = ss.getSheetByName(TABS.receipts.name).getDataRange().getValues();
  for (let i = 1; i < rv.length; i++) splitSerials_(rv[i][8]).forEach(function (sn) { ev.push({ t: rv[i][11], n: i, k: 0, sn: sn, c: String(rv[i][3]), to: P_STORE, o: '', id: String(rv[i][0]) }); });
  const mv = ss.getSheetByName(TABS.moves.name).getDataRange().getValues();
  for (let i = 1; i < mv.length; i++) splitSerials_(mv[i][9]).forEach(function (sn) { ev.push({ t: mv[i][13], n: i, k: 1, sn: sn, c: String(mv[i][6]), to: String(mv[i][4]), o: String(mv[i][5] || ''), id: String(mv[i][0]) }); });
  const tm = v => v instanceof Date ? v.getTime() : (Date.parse(v) || 0);
  ev.sort(function (a, b) { return (tm(a.t) - tm(b.t)) || (a.k - b.k) || (a.n - b.n); });
  const map = {}; const order = [];
  ev.forEach(function (e) {
    if (e.k === 0) { if (!map[e.sn]) order.push(e.sn); map[e.sn] = [e.sn, e.c, SERIAL_STATUS['склад'], P_STORE, '', e.id, e.t]; return; }
    const x = map[e.sn]; if (!x) return;
    const kind = placeKind_(e.to); if (!kind) return;
    map[e.sn] = [e.sn, x[1], SERIAL_STATUS[kind], e.to, e.o || x[4], e.id, e.t];
  });
  const sh = ss.getSheetByName(TABS.serials.name);
  const last = sh.getLastRow(); if (last >= 2) sh.getRange(2, 1, last - 1, 7).clearContent();
  if (order.length) sh.getRange(2, 1, order.length, 7).setValues(order.map(function (sn) { return map[sn]; }));
}

function deleteRows_(ss, me, req) {
  const kind = ['stock', 'receipts', 'moves'].indexOf(req.kind) >= 0 ? req.kind : 'reports';
  const id = String(req.id || ''); if (!id) return { ok: false, error: 'bad_id' };
  const sh = ss.getSheetByName(TABS[kind].name);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const vals = sh.getDataRange().getValues();
    const idx = []; let author = ''; let ser = false;
    for (let i = 1; i < vals.length; i++) if (String(vals[i][0]) === id) {
      idx.push(i + 1); author = String(vals[i][WHO_COL[kind]]);
      if ((kind === 'receipts' && vals[i][8]) || (kind === 'moves' && vals[i][9])) ser = true;
    }
    if (!idx.length) return { ok: false, error: 'not_found' };
    const own = author === me.name && ((kind === 'reports' && me.role === 'виконавець') || (kind !== 'reports' && me.role === 'комірник'));
    if (!(me.role === 'адмін' || own)) return { ok: false, error: 'forbidden' };
    for (let j = idx.length - 1; j >= 0; j--) sh.deleteRow(idx[j]);
    if (ser) rebuildSerials_(ss);
  } finally { lock.releaseLock(); }
  return { ok: true };
}
