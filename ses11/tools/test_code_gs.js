/* Модульні тести apps-script/Code.gs у Node з імітацією SpreadsheetApp/DriveApp (gas_mock.js).
   Запуск без cd: node D:/галкат/10_Код/galkat-20/ses11/tools/test_code_gs.js */
'use strict';
const assert = require('assert');
const { makeServer, oldSpreadsheet } = require('./gas_mock');

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok  ' + name); };
const ADM = '111111', KOM = '222222', IVAN = '333333', ZAM = '444444', OLEG = '555555';

const S = makeServer(oldSpreadsheet());
const before = JSON.parse(JSON.stringify({ z: S.ss.rows('Звіти'), v: S.ss.rows('Видачі'), d: S.ss.rows('Доступи') }));

t('ensureSheets_ на старій таблиці: нові аркуші, старі рядки без змін', () => {
  const r = S.call(ADM, 'login');
  assert.strictEqual(r.ok, true);
  for (const n of ['Номенклатура', 'Надходження', 'Рух', 'Серійні']) assert.ok(S.ss.getSheetByName(n), n);
  assert.deepStrictEqual(S.ss.rows('Надходження')[0].slice(0, 10), ['ID документа', 'Дата', 'Постачальник / накладна', 'Позиція', 'Найменування', 'Кількість', 'Од.', 'Власник', 'Серійні номери', 'Фото']);
  assert.deepStrictEqual(S.ss.rows('Рух')[0].slice(0, 12), ['ID документа', 'Дата', 'Тип', 'Звідки', 'Куди', 'Дах', 'Позиція', 'Найменування', 'Кількість', 'Серійні номери', 'Причина', 'Хто']);
  assert.deepStrictEqual(S.ss.rows('Серійні')[0], ['Серійний номер', 'Позиція', 'Статус', 'Місце', 'Дах', 'Останній документ', 'Змінено']);
  /* старі аркуші: заголовок дописано праворуч, рядки даних не змінено */
  assert.strictEqual(S.ss.rows('Доступи')[0][5], 'Бригада');
  assert.strictEqual(S.ss.rows('Звіти')[0][12], 'Бригада');
  assert.deepStrictEqual(S.ss.rows('Звіти').slice(1).map(r => r.slice(0, 12)).map(r => JSON.stringify(r)), before.z.slice(1).map(r => JSON.stringify(r)));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(S.ss.rows('Видачі'))), before.v);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(S.ss.rows('Доступи').slice(1))), before.d.slice(1));
  assert.strictEqual(S.ss.getSheetByName('Налаштування').rows.length, 4, 'налаштування не дописуються в наявний аркуш');
  /* другий запуск нічого не дублює */
  S.call(ADM, 'login');
  assert.strictEqual(S.ss.sheets.length, 10);
  assert.strictEqual(S.ss.rows('Доступи')[0].length, 6);
});
/* бригада Івана — у новій колонці */
S.ss.getSheetByName('Доступи').rows[3][5] = 'Бригада 1';

t('auth: бригада виконавця з колонки «Бригада», інакше — ім’я', () => {
  assert.strictEqual(S.call(IVAN, 'login').me.brigade, 'Бригада 1');
  S.ss.getSheetByName('Доступи').rows.push(['666666', 'Степан', 'виконавець', 'так', '']);
  assert.strictEqual(S.call('666666', 'login').me.brigade, 'Степан');
  assert.strictEqual(S.call(KOM, 'login').me.brigade, undefined);
  assert.strictEqual(S.call(OLEG, 'login').error, 'bad_code');
});

const rec = (cid, extra) => Object.assign({ cid, d: '2026-10-17', doc: 'ТОВ «Постачальник», ВН №15', lines: [
  { c: 'EL01', q: 3, name: 'Модуль LONGI', unit: 'шт', owner: 'ГАЛ-КАТ', serials: ['LR001', 'LR002', 'LR003'] },
  { c: 'MK01', q: 100, name: 'Балка 1250', unit: 'шт', owner: 'підрядник' }] }, extra || {});

t('receipt: права — лише комірник і адмін', () => {
  assert.strictEqual(S.call(IVAN, 'receipt', rec('cRECEIPT0001')).error, 'forbidden');
  assert.strictEqual(S.call(ZAM, 'receipt', rec('cRECEIPT0001')).error, 'forbidden');
  assert.strictEqual(S.ss.rows('Надходження').length, 1);
});

let recId;
t('receipt: запис, серійні у «Серійні», фото накладної на Диск', () => {
  const r = S.call(KOM, 'receipt', rec('cRECEIPT0001', { photos: [{ b64: Buffer.from('jpg').toString('base64'), mime: 'image/jpeg' }] }));
  assert.strictEqual(r.ok, true, JSON.stringify(r)); recId = r.id;
  const rows = S.ss.rows('Надходження');
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[1][3], 'EL01'); assert.strictEqual(rows[1][7], 'ГАЛ-КАТ'); assert.strictEqual(rows[1][8], 'LR001\nLR002\nLR003');
  assert.ok(/^https:\/\/drive/.test(rows[1][9]));
  assert.strictEqual(rows[1][12], 'cRECEIPT0001');
  const ser = S.ss.rows('Серійні').slice(1);
  assert.deepStrictEqual(ser.map(r => [r[0], r[1], r[2], r[3]]), [['LR001', 'EL01', 'склад', 'склад'], ['LR002', 'EL01', 'склад', 'склад'], ['LR003', 'EL01', 'склад', 'склад']]);
});

t('receipt: повтор із тим самим cid — dup, без нових рядків', () => {
  const r = S.call(KOM, 'receipt', rec('cRECEIPT0001'));
  assert.deepStrictEqual([r.ok, r.dup, r.id], [true, true, recId]);
  assert.strictEqual(S.ss.rows('Надходження').length, 3);
  assert.strictEqual(S.ss.rows('Серійні').length, 4);
});

t('receipt: перевірки — дубль серійного, кількість ≠ серійних, порожньо, погана дата', () => {
  assert.strictEqual(S.call(KOM, 'receipt', rec('cRECEIPT0002')).error, 'serial_dup');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0003', d: '2026-10-17', lines: [{ c: 'EL01', q: 2, owner: 'ГАЛ-КАТ', serials: ['X1001'] }] }).error, 'serial_count');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0004', d: '2026-10-17', lines: [] }).error, 'empty');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0005', d: '17.10', lines: [{ c: 'MK01', q: 1 }] }).error, 'bad_date');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0006', d: '2026-10-17', lines: [{ c: 'MK01', q: -1 }] }).error, 'bad_qty');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0007', d: '2026-10-17', lines: [{ c: 'MK 01', q: 1 }] }).error, 'bad_item');
  assert.strictEqual(S.ss.rows('Надходження').length, 3);
});

const BR = 'бригада: Бригада 1';
const issue = (cid, extra) => Object.assign({ cid, d: '2026-10-17', type: 'видача', from: 'склад', to: BR, o: '6', lines: [
  { c: 'EL01', q: 2, owner: 'ГАЛ-КАТ', serials: ['LR001', 'LR002'] }, { c: 'MK01', q: 50, owner: 'підрядник' }] }, extra || {});

t('move: права і перевірки місць', () => {
  assert.strictEqual(S.call(IVAN, 'move', issue('cMOVE0000001')).error, 'forbidden');
  assert.strictEqual(S.call(ZAM, 'move', issue('cMOVE0000001')).error, 'forbidden');
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000001', { type: 'продаж' })).error, 'bad_type');
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000001', { from: 'бригада: X' })).error, 'bad_place');
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000001', { o: '' })).error, 'bad_object');
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000001', { lines: [{ c: 'MK01', q: 999, owner: 'підрядник', over: true }] })).error, 'need_reason');
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000001', { lines: [{ c: 'EL01', q: 1, owner: 'ГАЛ-КАТ', serials: ['NOPE1'] }] })).error, 'serial_unknown');
  assert.strictEqual(S.ss.rows('Рух').length, 1);
});

let issueId;
t('move видача: рядки, серійні → бригада, повтор cid — dup', () => {
  const r = S.call(KOM, 'move', issue('cMOVE0000001', { sign: { b64: Buffer.from('png').toString('base64') } }));
  assert.strictEqual(r.ok, true, JSON.stringify(r)); issueId = r.id;
  assert.ok(/^https:\/\/drive/.test(r.sign));
  const rows = S.ss.rows('Рух');
  assert.strictEqual(rows.length, 3);
  assert.deepStrictEqual(rows[1].slice(2, 9), ['видача', 'склад', BR, '6', 'EL01', '', 2]);
  const ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(r => [r[0], r]));
  assert.deepStrictEqual([ser.LR001[2], ser.LR001[3], ser.LR001[4], ser.LR001[5]], ['бригада', BR, '6', issueId]);
  assert.strictEqual(ser.LR003[2], 'склад');
  const d = S.call(KOM, 'move', issue('cMOVE0000001'));
  assert.deepStrictEqual([d.dup, d.id], [true, issueId]);
  assert.strictEqual(S.ss.rows('Рух').length, 3);
  /* той самий модуль удруге видати не можна — він уже в бригади */
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000002', { lines: [{ c: 'EL01', q: 1, owner: 'ГАЛ-КАТ', serials: ['LR001'] }] })).error, 'serial_state');
});

t('move понад ліміт — з причиною проходить', () => {
  const r = S.call(KOM, 'move', issue('cMOVE0000003', { lines: [{ c: 'MK01', q: 5, owner: 'підрядник', over: true }], reason: 'заміна браку' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(S.ss.rows('Рух').slice(-1)[0][10], 'заміна браку');
});

t('move повернення, брак, передача на зберігання, інвентаризація', () => {
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000004', d: '2026-10-17', type: 'повернення', from: BR, to: 'склад', o: '6', lines: [{ c: 'MK01', q: 5, owner: 'підрядник' }, { c: 'EL01', q: 1, owner: 'ГАЛ-КАТ', serials: ['LR002'] }] }).ok, true);
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000005', d: '2026-10-17', type: 'брак', from: BR, to: 'брак', lines: [{ c: 'MK01', q: 1, owner: 'підрядник' }] }).error, 'need_reason');
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000005', d: '2026-10-17', type: 'брак', from: BR, to: 'брак', reason: 'погнута', lines: [{ c: 'MK01', q: 1, owner: 'підрядник' }] }).ok, true);
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000006', d: '2026-10-17', type: 'передача на зберігання', from: 'склад', to: 'зберігання ГАЛ-КАТ', o: '10', act: 'АКТ-1', lines: [{ c: 'MK01', q: 20, owner: 'підрядник' }, { c: 'EL01', q: 1, owner: 'ГАЛ-КАТ', serials: ['LR003'] }] }).ok, true);
  assert.strictEqual(S.call(ADM, 'move', { cid: 'cMOVE0000007', d: '2026-10-17', type: 'інвентаризація', from: 'склад', reason: 'перерахунок', lines: [{ c: 'MK01', q: -2, owner: 'підрядник' }] }).ok, true);
  const ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(r => [r[0], r]));
  assert.deepStrictEqual([ser.LR002[2], ser.LR002[3]], ['склад', 'склад']);
  assert.deepStrictEqual([ser.LR003[2], ser.LR003[3], ser.LR003[4]], ['зберігання', 'зберігання ГАЛ-КАТ', '10']);
});

t('stock (читання): комірник — усе; залишки за документами', () => {
  const r = S.call(KOM, 'stock');
  assert.strictEqual(r.ok, true);
  const b = r.stock.bal;
  /* склад MK01: +100 −50 −5 +5 −20 −2 = 28; бригада: 50 + 5 − 5 − 1 = 49; зберігання 20; брак 1 */
  assert.strictEqual(b['склад'].MK01, 28);
  assert.strictEqual(b[BR].MK01, 49);
  assert.strictEqual(b['зберігання ГАЛ-КАТ'].MK01, 20);
  assert.strictEqual(b['брак'].MK01, 1);
  /* модулі: склад 3 −2 +1 −1 = 1; бригада 1; зберігання 1 */
  assert.deepStrictEqual([b['склад'].EL01, b[BR].EL01, b['зберігання ГАЛ-КАТ'].EL01], [1, 1, 1]);
  assert.strictEqual(r.stock.receipts.length, 1);
  assert.strictEqual(r.stock.moves.length, 6);
  assert.ok(r.stock.brigades.includes('Бригада 1'));
  assert.ok(!r.stock.brigades.includes('Олег'), 'вимкнений код не дає бригади');
});

t('stock: виконавець бачить лише рух своєї бригади', () => {
  const r = S.call(IVAN, 'stock');
  assert.strictEqual(r.stock.receipts.length, 0);
  assert.ok(r.stock.moves.length > 0 && r.stock.moves.every(m => m.from === BR || m.to === BR));
  assert.deepStrictEqual(Object.keys(r.stock.bal), [BR]);
  assert.deepStrictEqual(r.stock.brigades, ['Бригада 1']);
  assert.ok(r.stock.serials.every(s => s.place === BR));
  const other = S.call('666666', 'stock');
  assert.strictEqual(other.stock.moves.length, 0);
  assert.deepStrictEqual(other.stock.bal, {});
});

t('stock: замовник — давальницькі завжди, підрядника — за налаштуванням', () => {
  let r = S.call(ZAM, 'stock');
  const owners = s => [...new Set([].concat(...s.receipts.map(x => x.lines), ...s.moves.map(x => x.lines)).map(l => l.owner))];
  assert.deepStrictEqual(owners(r.stock), ['ГАЛ-КАТ']);
  assert.strictEqual(r.stock.cfg.customerSeesContractorStock, false);
  assert.strictEqual(r.stock.cfg.contractorVisible, false);
  assert.strictEqual(r.stock.bal['склад'].MK01, undefined);
  assert.strictEqual(r.stock.bal['склад'].EL01, 1);
  S.ss.getSheetByName('Налаштування').rows.push(['customerSeesContractorStock', 'так', '']);
  r = S.call(ZAM, 'stock');
  assert.deepStrictEqual(owners(r.stock).sort(), ['ГАЛ-КАТ', 'підрядник']);
  assert.strictEqual(r.stock.bal['склад'].MK01, 28);
  assert.strictEqual(r.stock.cfg.contractorVisible, true);
  S.ss.getSheetByName('Налаштування').rows.pop();
});

t('stock з items — старий запис у «Видачі» працює як раніше', () => {
  const r = S.call(KOM, 'stock', { cid: 'cLEGACY00001', d: '2026-10-17', o: '10', type: 'зберігання ГАЛ-КАТ', act: 'А-2', items: { m1: { q: 3, name: 'Балка' } } });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(S.call(KOM, 'stock', { cid: 'cLEGACY00001', d: '2026-10-17', o: '10', items: { m1: { q: 3 } } }).dup, true);
  assert.strictEqual(S.call(IVAN, 'stock', { cid: 'cLEGACY00002', d: '2026-10-17', o: '10', items: { m1: { q: 3 } } }).error, 'forbidden');
  assert.strictEqual(S.ss.rows('Видачі').length, 3);
});

t('report: пише бригаду автора; data віддає br і для старих звітів', () => {
  const r = S.call(IVAN, 'report', { cid: 'cREPORT00001', d: '2026-10-17', o: '6', items: { tri: 10 } });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(S.ss.rows('Звіти').slice(-1)[0][12], 'Бригада 1');
  const d = S.call(KOM, 'data').data;
  assert.deepStrictEqual(d.reports.map(x => [x.by, x.br]), [['Іван', 'Бригада 1'], ['Іван', 'Бригада 1']]);
  assert.strictEqual(S.call(KOM, 'report', { cid: 'cREPORT00002', d: '2026-10-17', o: '6', items: { tri: 1 } }).error, 'forbidden');
});

t('delete: комірник — власні документи складу; «Серійні» перебудовуються', () => {
  assert.strictEqual(S.call(IVAN, 'delete', { kind: 'moves', id: issueId }).error, 'forbidden');
  assert.strictEqual(S.call(KOM, 'delete', { kind: 'moves', id: issueId }).ok, true);
  const ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(r => [r[0], r]));
  /* без видачі: LR001 на складі; LR002 «повернення» з бригади не застосовується; LR003 — на зберіганні */
  assert.deepStrictEqual([ser.LR001[2], ser.LR001[3]], ['склад', 'склад']);
  assert.deepStrictEqual([ser.LR003[2], ser.LR003[3]], ['зберігання', 'зберігання ГАЛ-КАТ']);
  assert.strictEqual(S.call(ADM, 'delete', { kind: 'receipts', id: recId }).ok, true);
  assert.strictEqual(S.ss.rows('Серійні').length, 1);
});

t('setup на порожній таблиці: усі аркуші, налаштування за замовчуванням, код адміністратора', () => {
  const E = makeServer({ 'Аркуш1': [] });
  E.ctx.setup();
  assert.deepStrictEqual(E.ss.sheets.map(s => s.name), ['Доступи', 'Звіти', 'Видачі', 'Налаштування', 'Норми', 'Обсяги', 'Номенклатура', 'Надходження', 'Рух', 'Серійні']);
  const set = Object.fromEntries(E.ss.rows('Налаштування').slice(1).map(r => [r[0], r[1]]));
  assert.strictEqual(set.acceptance, 'foreman');
  assert.strictEqual(set.customerSeesContractorStock, 'ні');
  assert.ok(/^\d{6}$/.test(E.ss.rows('Доступи')[1][0]));
  assert.ok(E.ss.getSheetByName('Серійні').formats.some(f => f[0] === 'A:A' && f[1] === '@'), 'серійні — як текст');
});

console.log('\nУсі тести Code.gs пройшли: ' + n);
