/* Імітація Google Apps Script (SpreadsheetApp, DriveApp, LockService, Utilities, ContentService) для перевірки
   apps-script/Code.gs у Node без мережі. Таблиця й Диск — у пам’яті. Використовують test_code_gs.js і e2e_sklad.js. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Range {
  constructor(sh, r, c, nr, nc) { this.sh = sh; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = this.sh.rows[this.r - 1 + i] || [];
      const v = [];
      for (let j = 0; j < this.nc; j++) { const x = row[this.c - 1 + j]; v.push(x === undefined || x === null ? '' : x); }
      out.push(v);
    }
    return out;
  }
  setValues(v) {
    if (v.length !== this.nr || v.some(r => r.length !== this.nc)) throw new Error('setValues: розмір ' + v.length + '×' + (v[0] || []).length + ' ≠ ' + this.nr + '×' + this.nc + ' (' + this.sh.name + ')');
    for (let i = 0; i < this.nr; i++) {
      const row = this.sh.rows[this.r - 1 + i] || (this.sh.rows[this.r - 1 + i] = []);
      for (let j = 0; j < this.nc; j++) row[this.c - 1 + j] = v[i][j];
    }
    this.sh.writes++;
    return this;
  }
  clearContent() { for (let i = 0; i < this.nr; i++) { const row = this.sh.rows[this.r - 1 + i]; if (row) for (let j = 0; j < this.nc; j++) row[this.c - 1 + j] = ''; } return this; }
  setFontWeight() { return this; }
  setBackground() { return this; }
  setNumberFormat(f) { this.sh.formats.push([this.a1 || (this.r + ':' + this.c), f]); return this; }
}

class Sheet {
  constructor(name, rows) { this.name = name; this.rows = (rows || []).map(r => r.slice()); this.formats = []; this.writes = 0; }
  getName() { return this.name; }
  getLastRow() { for (let i = this.rows.length - 1; i >= 0; i--) if ((this.rows[i] || []).some(v => v !== '' && v !== undefined && v !== null)) return i + 1; return 0; }
  getLastColumn() { let m = 0; for (const r of this.rows) if (r) for (let j = r.length - 1; j >= 0; j--) if (r[j] !== '' && r[j] !== undefined && r[j] !== null) { m = Math.max(m, j + 1); break; } return m; }
  getRange(a, b, c, d) {
    if (typeof a === 'string') { const rg = new Range(this, 1, 1, 1, 1); rg.a1 = a; return rg; }
    return new Range(this, a, b, c || 1, d || 1);
  }
  getDataRange() { return new Range(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  appendRow(v) { this.rows[this.getLastRow()] = v.slice(); }
  deleteRow(i) { this.rows.splice(i - 1, 1); }
  setFrozenRows() { }
  autoResizeColumns() { }
}

class Spreadsheet {
  constructor(sheets) { this.sheets = []; for (const n in (sheets || {})) this.sheets.push(new Sheet(n, sheets[n])); }
  getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; }
  insertSheet(n) { const s = new Sheet(n, []); this.sheets.push(s); return s; }
  getSheets() { return this.sheets.slice(); }
  deleteSheet(s) { this.sheets = this.sheets.filter(x => x !== s); }
  rows(n) { const s = this.getSheetByName(n); return s ? s.rows.filter(r => r && r.some(v => v !== '' && v != null)) : null; }
}

let folderSeq = 0;
class Folder {
  constructor(name) { this.name = name; this.id = 'F' + (++folderSeq); this.folders = []; this.files = []; }
  getFoldersByName(n) { const list = this.folders.filter(f => f.name === n); let i = 0; return { hasNext: () => i < list.length, next: () => list[i++] }; }
  createFolder(n) { const f = new Folder(n); this.folders.push(f); return f; }
  createFile(blob) { const f = { name: blob.name, mime: blob.mime, size: blob.bytes.length, trashed: false, setTrashed(v) { this.trashed = v; } }; this.files.push(f); return f; }
  getUrl() { return 'https://drive.google.com/drive/folders/' + this.id; }
}

const z2 = n => String(n).padStart(2, '0');
function formatDate(d, tz, fmt) {
  const Y = d.getFullYear(), M = z2(d.getMonth() + 1), D = z2(d.getDate()), h = z2(d.getHours()), m = z2(d.getMinutes()), s = z2(d.getSeconds());
  if (fmt === 'yyyy-MM-dd') return Y + '-' + M + '-' + D;
  if (fmt === "yyyy-MM-dd'T'HH:mm:ss") return Y + '-' + M + '-' + D + 'T' + h + ':' + m + ':' + s;
  if (fmt === 'yyMMddHHmmss') return String(Y).slice(2) + M + D + h + m + s;
  if (fmt === 'HHmmss') return h + m + s;
  throw new Error('formatDate: ' + fmt);
}

/* sheets: { 'Назва': [[...рядок 1], ...] } — стан таблиці до запуску (наприклад, стара версія) */
function makeServer(sheets, opts) {
  opts = opts || {};
  const ss = new Spreadsheet(sheets);
  const drive = {};
  const log = [];
  const ctx = {
    console,
    SpreadsheetApp: { openById: () => ss },
    DriveApp: { getFolderById: id => drive[id] || (drive[id] = new Folder('root:' + id)) },
    LockService: { getScriptLock: () => ({ waitLock() { }, releaseLock() { } }) },
    Utilities: {
      formatDate,
      base64Decode: b => Array.from(Buffer.from(String(b), 'base64')),
      newBlob: (bytes, mime, name) => ({ bytes, mime, name })
    },
    ContentService: { createTextOutput: s => ({ s, mime: '', setMimeType(m) { this.mime = m; return this; }, getContent() { return this.s; } }), MimeType: { JSON: 'application/json' } },
    Logger: { log: m => log.push(String(m)) }
  };
  vm.createContext(ctx);
  const code = fs.readFileSync(opts.code || path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');
  vm.runInContext(code, ctx, { filename: 'Code.gs' });
  const post = body => JSON.parse(ctx.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).getContent());
  const call = (code, action, payload) => post(Object.assign({ action, code }, payload || {}));
  const evalIn = src => vm.runInContext(src, ctx);
  return { ss, drive, log, ctx, post, call, evalIn };
}

/* таблиця так, як її залишила версія 16.10.2026: старі заголовки, кілька рядків даних */
function oldSpreadsheet() {
  const now = new Date(2026, 9, 16, 10, 0, 0);
  return {
    'Доступи': [['Код', 'Ім’я', 'Роль', 'Активний', 'Примітка'],
      ['111111', 'Адмін', 'адмін', 'так', ''],
      ['222222', 'Комірник Петро', 'комірник', 'так', ''],
      ['333333', 'Іван', 'виконавець', 'так', ''],
      ['444444', 'Замовник ГАЛ-КАТ', 'замовник', 'так', ''],
      ['555555', 'Олег', 'виконавець', 'ні', '']],
    'Звіти': [['ID звіту', 'Дата', 'Об’єкт', 'Дія', 'Кількість', 'Кран, маш.-год', 'Фото дня', 'Фото, шт', 'Примітка', 'Хто', 'Записано', 'ID клієнта'],
      ['R1', '2026-10-15', '6', 'ballast', 40, '', '', '', '', 'Іван', now, 'cOLDREPORT01']],
    'Видачі': [['ID видачі', 'Дата', 'Дах', 'Позиція', 'Найменування', 'Кількість', 'Примітка', 'Хто', 'Записано', 'Тип', 'Акт', 'ID клієнта'],
      ['V1', '2026-10-15', '6', 'm1', 'Балка 41х41х1,5 мм 1250 мм', 10, 'старий запис', 'Комірник Петро', now, 'видача', '', 'cOLDSTOCK001']],
    'Налаштування': [['Параметр', 'Значення', 'Пояснення'], ['day1', '2026-10-01', ''], ['days', 60, ''], ['week', 5, '']],
    'Норми': [['Ключ', 'Норма, люд-год/од.', 'Пояснення']],
    'Обсяги': [['Об’єкт', 'Дія', 'Обсяг', 'Пояснення']]
  };
}

module.exports = { makeServer, oldSpreadsheet, Sheet, Spreadsheet };
