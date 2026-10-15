/**
 * Журнал СЕС площадки 11 (ГалКат, проєкт ОС-108) — сервер для сайту
 * https://mischenkoa85-creator.github.io/galkat-20/ses11/
 *
 * Зберігає звіти робіт, видачі зі складу і фото в Google-таблиці та на Google Диску.
 * Доступ — за особистими кодами з аркуша «Доступи».
 *
 * Як встановити (один раз):
 *   1. Виконати функцію setup — створить аркуші та код адміністратора (у аркуші «Доступи»).
 *   2. Розгорнути → Нове розгортання → Вебзастосунок: «Виконувати як: я», «Доступ: усі».
 *   3. Скопіювати адресу вебзастосунку (…/exec) і передати для сайту.
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

const TABS = {
  access: { name: 'Доступи', head: ['Код', 'Ім’я', 'Роль', 'Активний', 'Примітка'] },
  reports: { name: 'Звіти', head: ['ID звіту', 'Дата', 'Об’єкт', 'Дія', 'Кількість', 'Кран, маш.-год', 'Фото дня', 'Фото, шт', 'Примітка', 'Хто', 'Записано'] },
  stock: { name: 'Видачі', head: ['ID видачі', 'Дата', 'Дах', 'Позиція', 'Найменування', 'Кількість', 'Примітка', 'Хто', 'Записано'] },
  settings: { name: 'Налаштування', head: ['Параметр', 'Значення', 'Пояснення'] },
  norms: { name: 'Норми', head: ['Ключ', 'Норма, люд-год/од.', 'Пояснення'] },
  plan: { name: 'Обсяги', head: ['Об’єкт', 'Дія', 'Обсяг', 'Пояснення'] }
};
const DEFAULT_SETTINGS = [
  ['day1', '', 'День 1 за план-графіком договору (дата РРРР-ММ-ДД): перший робочий день після виконання стартових умов, п. 3.1'],
  ['days', 60, 'Строк монтажу і ПНР у робочих днях, п. 3.2 договору'],
  ['week', 5, 'Робочих днів на тиждень: 5 (Пн–Пт) або 6 (Пн–Сб)'],
  ['rain', 60, 'Ймовірність дощу, %, з якої день вважається дощовим для робіт на даху'],
  ['gust', 12, 'Пориви вітру, м/с, з яких кран і монтаж модулів — під ризиком'],
  ['holidays', '', 'Неробочі дати через кому, РРРР-ММ-ДД']
];

/* ---------------- setup ---------------- */
function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheets_(ss);
  const sh = ss.getSheetByName(TABS.access.name);
  if (sh.getLastRow() < 2) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    sh.appendRow([code, 'Адміністратор', 'адмін', 'так', 'Змініть ім’я; код можна змінити']);
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
      if (k === 'reports' || k === 'stock') sh.getRange('B:B').setNumberFormat('@');
      if (k === 'access') sh.getRange('A:A').setNumberFormat('@');
      if (k === 'settings') sh.getRange(2, 1, DEFAULT_SETTINGS.length, 3).setValues(DEFAULT_SETTINGS);
      sh.autoResizeColumns(1, t.head.length);
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
    switch (req.action) {
      case 'login': return out_({ ok: true, me: me });
      case 'data': return out_({ ok: true, me: me, data: readAll_(ss) });
      case 'report':
        if (!(me.role === 'адмін' || me.role === 'виконавець')) return out_({ ok: false, error: 'forbidden' });
        return out_(saveReport_(ss, me, req));
      case 'stock':
        if (!(me.role === 'адмін' || me.role === 'комірник')) return out_({ ok: false, error: 'forbidden' });
        return out_(saveStock_(ss, me, req));
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
      return { name: String(r[1] || 'Без імені').trim(), role: ROLES.indexOf(role) >= 0 ? role : 'замовник' };
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

/* ---------------- read ---------------- */
function readAll_(ss) {
  const rep = ss.getSheetByName(TABS.reports.name).getDataRange().getValues();
  const reports = {};
  for (let i = 1; i < rep.length; i++) {
    const r = rep[i]; const id = String(r[0]); if (!id) continue;
    const x = reports[id] || (reports[id] = { id: id, d: ymd_(r[1]), o: String(r[2]), items: {}, crane: 0, photo: '', photos: 0, n: '', by: '', at: '' });
    const w = String(r[3]); const q = Number(r[4]);
    if (w && w !== '—' && isFinite(q)) x.items[w] = (x.items[w] || 0) + q;
    if (Number(r[5]) > 0) x.crane += Number(r[5]);
    if (r[6]) x.photo = String(r[6]);
    if (Number(r[7]) > 0) x.photos = Math.max(x.photos, Number(r[7]));
    if (r[8]) x.n = String(r[8]);
    x.by = String(r[9] || ''); x.at = stamp_(r[10]);
  }
  const st = ss.getSheetByName(TABS.stock.name).getDataRange().getValues();
  const stock = {};
  for (let i = 1; i < st.length; i++) {
    const r = st[i]; const id = String(r[0]); if (!id) continue;
    const x = stock[id] || (stock[id] = { id: id, d: ymd_(r[1]), o: String(r[2]), items: {}, n: '', by: '', at: '' });
    const k = String(r[3]); const q = Number(r[5]);
    if (k && isFinite(q)) x.items[k] = (x.items[k] || 0) + q;
    if (r[6]) x.n = String(r[6]);
    x.by = String(r[7] || ''); x.at = stamp_(r[8]);
  }
  const settings = {};
  const s = ss.getSheetByName(TABS.settings.name).getDataRange().getValues();
  for (let i = 1; i < s.length; i++) { const k = String(s[i][0]).trim(); if (k) settings[k] = s[i][1] instanceof Date ? ymd_(s[i][1]) : s[i][1]; }
  const norms = {};
  const n = ss.getSheetByName(TABS.norms.name).getDataRange().getValues();
  for (let i = 1; i < n.length; i++) { const k = String(n[i][0]).trim(); const v = Number(n[i][1]); if (k && isFinite(v) && n[i][1] !== '') norms[k] = v; }
  const plan = {};
  const p = ss.getSheetByName(TABS.plan.name).getDataRange().getValues();
  for (let i = 1; i < p.length; i++) { const o = String(p[i][0]).trim(); const w = String(p[i][1]).trim(); const v = Number(p[i][2]); if (o && w && isFinite(v) && p[i][2] !== '') plan[o + '.' + w] = v; }
  return { reports: Object.values(reports), stock: Object.values(stock), settings: settings, norms: norms, plan: plan };
}

/* ---------------- write ---------------- */
function newId_(prefix) {
  return prefix + Utilities.formatDate(new Date(), TZ, 'yyMMddHHmmss') + Math.floor(Math.random() * 1000);
}

function dayFolder_(objectId, d) {
  const root = DriveApp.getFolderById(PHOTO_FOLDERS[objectId]);
  const it = root.getFoldersByName(d);
  return it.hasNext() ? it.next() : root.createFolder(d);
}

function saveReport_(ss, me, req) {
  const d = String(req.d || ''); const o = String(req.o || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  if (OBJECTS.indexOf(o) < 0) return { ok: false, error: 'bad_object' };
  const items = req.items || {}; const keys = Object.keys(items).filter(function (w) { return /^[a-z_0-9]{2,20}$/.test(w) && isFinite(Number(items[w])) && Number(items[w]) !== 0; });
  const crane = Math.max(0, Number(req.crane) || 0);
  const photos = Array.isArray(req.photos) ? req.photos.slice(0, MAX_PHOTOS) : [];
  if (!keys.length && !crane && !photos.length) return { ok: false, error: 'empty' };
  const id = newId_('R');
  let folderUrl = '';
  let saved = 0;
  if (photos.length) {
    const folder = dayFolder_(o, d);
    folderUrl = folder.getUrl();
    const stamp = Utilities.formatDate(new Date(), TZ, 'HHmmss');
    photos.forEach(function (p, i) {
      if (!p || !p.b64) return;
      const blob = Utilities.newBlob(Utilities.base64Decode(p.b64), p.mime || 'image/jpeg', (o === 'S' ? 'Загальна' : 'Дах' + o) + '_' + d + '_' + stamp + '_' + (i + 1) + '.jpg');
      folder.createFile(blob); saved++;
    });
  }
  const note = String(req.note || '').slice(0, 300);
  const now = new Date();
  const rows = [];
  if (!keys.length) rows.push([id, d, o, '—', '', crane || '', folderUrl, saved || '', note, me.name, now]);
  keys.forEach(function (w, i) { rows.push([id, d, o, w, Number(items[w]), i === 0 ? (crane || '') : '', folderUrl, i === 0 ? (saved || '') : '', i === 0 ? note : '', me.name, now]); });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = ss.getSheetByName(TABS.reports.name);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally { lock.releaseLock(); }
  return { ok: true, id: id, photo: folderUrl, photos: saved };
}

function saveStock_(ss, me, req) {
  const d = String(req.d || ''); const o = String(req.o || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  if (OBJECTS.indexOf(o) < 0 || o === 'S') return { ok: false, error: 'bad_object' };
  const items = req.items || {};
  const keys = Object.keys(items).filter(function (k) { return /^[a-z0-9]{1,8}$/.test(k) && isFinite(Number(items[k].q)) && Number(items[k].q) !== 0; });
  if (!keys.length) return { ok: false, error: 'empty' };
  const id = newId_('V'); const note = String(req.note || '').slice(0, 200); const now = new Date();
  const rows = keys.map(function (k, i) { return [id, d, o, k, String(items[k].name || '').slice(0, 200), Number(items[k].q), i === 0 ? note : '', me.name, now]; });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = ss.getSheetByName(TABS.stock.name);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally { lock.releaseLock(); }
  return { ok: true, id: id };
}

function deleteRows_(ss, me, req) {
  const kind = req.kind === 'stock' ? 'stock' : 'reports';
  const id = String(req.id || ''); if (!id) return { ok: false, error: 'bad_id' };
  const sh = ss.getSheetByName(TABS[kind].name);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const vals = sh.getDataRange().getValues();
    const idx = []; let author = '';
    for (let i = 1; i < vals.length; i++) if (String(vals[i][0]) === id) { idx.push(i + 1); author = String(kind === 'stock' ? vals[i][7] : vals[i][9]); }
    if (!idx.length) return { ok: false, error: 'not_found' };
    const own = author === me.name && ((kind === 'reports' && me.role === 'виконавець') || (kind === 'stock' && me.role === 'комірник'));
    if (!(me.role === 'адмін' || own)) return { ok: false, error: 'forbidden' };
    for (let j = idx.length - 1; j >= 0; j--) sh.deleteRow(idx[j]);
  } finally { lock.releaseLock(); }
  return { ok: true };
}
