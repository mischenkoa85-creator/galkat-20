/* Модульні тести apps-script/Code.gs у Node з імітацією SpreadsheetApp/DriveApp (gas_mock.js).
   Запуск без cd: node D:/галкат/10_Код/galkat-20/ses11/tools/test_code_gs.js */
'use strict';
const assert = require('assert');
const { makeServer, oldSpreadsheet } = require('./gas_mock');

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok  ' + name); };
const ADM = '111111', KOM = '222222', IVAN = '333333', ZAM = '444444', OLEG = '555555';
const z2 = x => String(x).padStart(2, '0');
const now = new Date(); const TODAY = now.getFullYear() + '-' + z2(now.getMonth() + 1) + '-' + z2(now.getDate());
const col = (S, sheet, name) => S.ss.rows(sheet)[0].indexOf(name);

/* стара таблиця (версія 16.10) + власні колонки власника праворуч: «Телефон» у «Доступи», «Коментар» у «Звіти» */
const OLD = oldSpreadsheet();
OLD['Доступи'][0].push('Телефон'); OLD['Доступи'][3].push('+380671112233');
OLD['Звіти'][0].push('Коментар'); OLD['Звіти'][1].push('мій коментар');
const S = makeServer(OLD);
const before = JSON.parse(JSON.stringify({ z: S.ss.rows('Звіти'), v: S.ss.rows('Видачі'), d: S.ss.rows('Доступи') }));

t('1. ensureSheets_ на старій таблиці: нові аркуші під блокуванням, старі рядки без змін, stockStart', () => {
  S.clearEvents();
  assert.strictEqual(S.call(ADM, 'login').ok, true);
  assert.ok(S.events().includes('lock'), 'створення аркушів — під LockService');
  for (const nm of ['Номенклатура', 'Надходження', 'Рух', 'Серійні']) assert.ok(S.ss.getSheetByName(nm), nm);
  assert.strictEqual(S.ss.rows('Номенклатура').length, 47, 'дзеркало довідника — 46 позицій');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(S.ss.rows('Видачі'))), before.v);
  const set = Object.fromEntries(S.ss.rows('Налаштування').slice(1).map(r => [r[0], r[1]]));
  assert.strictEqual(set.stockStart, TODAY, 'stockStart = день першого запуску');
  assert.strictEqual(S.ss.rows('Налаштування').length, 5, 'дописано лише рядок stockStart');
  /* повторний запит: усе готове — блокування для аркушів не береться */
  S.clearEvents(); S.call(ADM, 'login');
  assert.deepStrictEqual(S.events(), []);
  assert.strictEqual(S.ss.sheets.length, 10);
});

t('1. гонка першого запиту: повторна перевірка всередині блокування, рядок під заголовком не губиться', () => {
  const E = makeServer({ 'Аркуш1': [] });
  /* поки запит чекав на блокування, інший запит створив аркуші й записав рядок у «Рух» */
  E.opts.onLock = () => { E.ctx.createSheets_(E.ss); E.ss.getSheetByName('Рух').rows.push(['V1', '2026-10-17', 'видача']); };
  assert.strictEqual(E.call('000000', 'login').error, 'bad_code');
  assert.strictEqual(E.ss.sheets.filter(s => s.name === 'Рух').length, 1);
  assert.deepStrictEqual(E.ss.rows('Рух').map(r => r[0]), ['ID документа', 'V1']);
  assert.strictEqual(E.ss.rows('Налаштування').filter(r => r[0] === 'stockStart').length, 1);
});

t('3. «Бригада» — за назвою заголовка, після останньої колонки; «Телефон» і «Коментар» не чіпаються', () => {
  assert.strictEqual(col(S, 'Доступи', 'Бригада'), 6);
  assert.strictEqual(col(S, 'Звіти', 'Бригада'), 13);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(S.ss.rows('Доступи').slice(1).map(r => r.slice(0, 6)))), before.d.slice(1).map(r => r.slice(0, 6)));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(S.ss.rows('Звіти')[1].slice(0, 13))), before.z[1].slice(0, 13));
  /* без значення в «Бригада» бригада = ім’я, а не телефон із колонки 6 */
  assert.strictEqual(S.call(IVAN, 'login').me.brigade, 'Іван');
  S.ss.getSheetByName('Доступи').rows[3][col(S, 'Доступи', 'Бригада')] = 'Бригада 1';
  assert.strictEqual(S.call(IVAN, 'login').me.brigade, 'Бригада 1');
  assert.strictEqual(S.call(OLEG, 'login').error, 'bad_code');
  const r = S.call(IVAN, 'report', { cid: 'cREPORT00001', d: TODAY, o: '6', items: { tri: 10 } });
  assert.strictEqual(r.ok, true);
  const last = S.ss.rows('Звіти').slice(-1)[0];
  assert.strictEqual(last[13], 'Бригада 1'); assert.ok(last[12] === undefined || last[12] === '', '«Коментар» нового рядка не заповнено');
  assert.deepStrictEqual(S.call(KOM, 'data').data.reports.map(x => x.br), ['Бригада 1', 'Бригада 1']);
});

t('2. формули й автотипи: апостроф для = + - @, читання повертає оригінал; текстові колонки — «@»', () => {
  const note = '=HYPERLINK("http://x","y")';
  assert.strictEqual(S.call(IVAN, 'report', { cid: 'cREPORT00002', d: TODAY, o: '6', items: { pv: 1 }, note }).ok, true);
  assert.strictEqual(S.ss.rows('Звіти').slice(-1)[0][8], "'" + note);
  assert.strictEqual(S.call(KOM, 'data').data.reports.find(x => x.cid === 'cREPORT00002').n, note);
  const rc = S.call(KOM, 'receipt', { cid: 'cRECEIPT0001', d: TODAY, doc: '+380 ТОВ «Постачальник», ВН 3/10', lines: [
    { c: 'EL01', q: 3, name: '@модуль', serials: ['LR001', 'LR002', '00123'] }, { c: 'MK01', q: 100, owner: 'ГАЛ-КАТ' }] });
  assert.strictEqual(rc.ok, true, JSON.stringify(rc));
  const row = S.ss.rows('Надходження')[1];
  assert.strictEqual(row[2], "'+380 ТОВ «Постачальник», ВН 3/10"); assert.strictEqual(row[4], "'@модуль");
  const sr = S.call(KOM, 'stockRead').stock.receipts[0];
  assert.strictEqual(sr.doc, '+380 ТОВ «Постачальник», ВН 3/10'); assert.strictEqual(sr.lines[0].name, '@модуль');
  assert.deepStrictEqual(sr.lines[0].serials, ['LR001', 'LR002', '00123']);
  assert.strictEqual(S.ss.rows('Серійні')[3][0], '00123');
  const f = nm => S.ss.getSheetByName(nm).formats.map(x => x[0] + x[1]);
  for (const c of ['A:A@', 'B:B@']) assert.ok(f('Серійні').includes(c), 'Серійні ' + c);
  for (const c of ['C:C@', 'I:I@']) assert.ok(f('Надходження').includes(c), 'Надходження ' + c);
  for (const c of ['J:J@', 'K:K@', 'P:P@']) assert.ok(f('Рух').includes(c), 'Рух ' + c);
  /* setup() ставить формат «@» і на текстові колонки старих аркушів (примітка, акт) */
  S.ctx.setup();
  assert.ok(f('Звіти').includes('I:I@') && f('Видачі').includes('K:K@'));
});

t('7. власник — з довідника сервера, не з запиту', () => {
  assert.strictEqual(S.ss.rows('Надходження')[2][7], 'підрядник', 'MK01 з owner «ГАЛ-КАТ» від клієнта — все одно підрядник');
  assert.strictEqual(S.ss.rows('Надходження')[1][7], 'ГАЛ-КАТ');
});

t('receipt/move: права — лише комірник і адмін', () => {
  for (const code of [IVAN, ZAM]) {
    assert.strictEqual(S.call(code, 'receipt', { cid: 'cRECEIPTX001', d: TODAY, lines: [{ c: 'MK01', q: 1 }] }).error, 'forbidden');
    assert.strictEqual(S.call(code, 'move', { cid: 'cMOVEX000001', d: TODAY, type: 'брак', from: 'склад', to: 'брак', reason: 'x', lines: [{ c: 'MK01', q: 1 }] }).error, 'forbidden');
  }
});

t('receipt: повтор cid — dup; дубль серійного; порожньо; погана дата', () => {
  const d = S.call(KOM, 'receipt', { cid: 'cRECEIPT0001', d: TODAY, lines: [{ c: 'MK01', q: 1 }] });
  assert.deepStrictEqual([d.ok, d.dup], [true, true]);
  assert.strictEqual(S.ss.rows('Надходження').length, 3);
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0002', d: TODAY, lines: [{ c: 'EL01', q: 1, serials: ['LR001'] }] }).error, 'serial_dup');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0003', d: TODAY, lines: [] }).error, 'empty');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0004', d: '17.10', lines: [{ c: 'MK01', q: 1 }] }).error, 'bad_date');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0005', d: TODAY, lines: [{ c: 'MK01', q: -1 }] }).error, 'bad_qty');
});

t('8. позиції: невідомий код, серійні обов’язкові й дорівнюють кількості', () => {
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0006', d: TODAY, lines: [{ c: 'ZZ99', q: 1 }] }).error, 'bad_item');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0007', d: TODAY, lines: [{ c: 'EL01', q: 2 }] }).error, 'serial_count');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0008', d: TODAY, lines: [{ c: 'EL01', q: 2, serials: ['X1001'] }] }).error, 'serial_count');
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0009', d: TODAY, lines: [{ c: 'MK01', q: 1, serials: ['X1002'] }] }).error, 'serial_count');
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000090', d: TODAY, type: 'видача', from: 'склад', to: 'бригада: Бригада 1', o: '6', lines: [{ c: 'EL01', q: 1 }] }).error, 'serial_count');
  assert.strictEqual(S.ss.rows('Надходження').length, 3);
});

const BR = 'бригада: Бригада 1';
const issue = (cid, extra) => Object.assign({ cid, d: TODAY, type: 'видача', from: 'склад', to: BR, o: '6', lines: [
  { c: 'EL01', q: 2, serials: ['LR001', 'LR002'] }, { c: 'MK01', q: 50 }] }, extra || {});

t('5. бригада «куди» — лише з «Доступи» або вже наявна в «Русі»', () => {
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000001', { to: 'бригада: Невідома' })).error, 'bad_place');
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000001', { to: 'бригада: Олег' })).error, 'bad_place', 'вимкнений виконавець — не бригада');
  assert.strictEqual(S.ss.rows('Рух').length, 1);
});

let issueId;
t('12. підпис на Диск до блокування; розмір підпису обмежено', () => {
  const big = { b64: 'A'.repeat(300 * 1024) };
  assert.strictEqual(S.call(KOM, 'move', issue('cMOVE0000001', { sign: big })).error, 'bad_request');
  S.clearEvents();
  const r = S.call(KOM, 'move', issue('cMOVE0000001', { sign: { b64: Buffer.from('png').toString('base64') } }));
  assert.strictEqual(r.ok, true, JSON.stringify(r)); issueId = r.id;
  const ev = S.events(); assert.ok(ev.indexOf('file') >= 0 && ev.indexOf('file') < ev.indexOf('lock'), 'файл — до блокування: ' + ev.join(','));
  assert.ok(/^https:\/\/drive/.test(S.ss.rows('Рух')[1][12]));
});

t('5. бригада, що лишилась лише в «Русі», приймається', () => {
  S.ss.getSheetByName('Доступи').rows[3][col(S, 'Доступи', 'Бригада')] = 'Бригада 2';
  const r = S.call(KOM, 'move', { cid: 'cMOVE0000002', d: TODAY, type: 'повернення', from: BR, to: 'склад', o: '6', lines: [{ c: 'MK01', q: 5 }] });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  S.ss.getSheetByName('Доступи').rows[3][col(S, 'Доступи', 'Бригада')] = 'Бригада 1';
});

t('8. наявність і ліміт даху рахує сервер; понад — лише з причиною (інакше bad_request)', () => {
  /* на складі 100 − 50 + 5 = 55 балок; ліміт даху 6: 656 − 45 = 611 */
  let r = S.call(KOM, 'move', issue('cMOVE0000003', { lines: [{ c: 'MK01', q: 60 }] }));
  assert.deepStrictEqual([r.error, /^over_limit: MK01: є 55/.test(r.message)], ['bad_request', true], JSON.stringify(r));
  r = S.call(KOM, 'move', issue('cMOVE0000003', { o: '5', lines: [{ c: 'MK01', q: 1 }] }));
  assert.ok(r.error === 'bad_request' && /ліміт 0/.test(r.message), 'балки на даху 5 немає в потребі: ' + JSON.stringify(r));
  r = S.call(KOM, 'move', { cid: 'cMOVE0000004', d: TODAY, type: 'повернення', from: BR, to: 'склад', lines: [{ c: 'MK01', q: 999 }] });
  assert.strictEqual(r.error, 'bad_request', 'повернути більше, ніж видано — лише з причиною');
  r = S.call(KOM, 'move', issue('cMOVE0000003', { lines: [{ c: 'MK01', q: 60 }], reason: 'заміна браку' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(S.ss.rows('Рух').slice(-1)[0][10], 'заміна браку');
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000005', d: TODAY, type: 'брак', from: BR, to: 'брак', lines: [{ c: 'MK01', q: 1 }] }).error, 'need_reason');
});

t('6. «Початкові залишки»: нові серійні в місці; дубль серійного — відмова', () => {
  const r = S.call(KOM, 'move', { cid: 'cMOVE0000006', d: TODAY, type: 'початкові залишки', from: BR, lines: [{ c: 'MK02', q: 10 }, { c: 'EL01', q: 1, serials: ['OPEN001'] }] });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  const ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(x => [x[0], x]));
  assert.deepStrictEqual([ser.OPEN001[2], ser.OPEN001[3]], ['бригада', BR]);
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000007', d: TODAY, type: 'початкові залишки', from: 'склад', lines: [{ c: 'EL01', q: 1, serials: ['00123'] }] }).error, 'serial_dup');
  const b = S.call(KOM, 'stockRead').stock;
  assert.strictEqual(b.bal[BR].MK02, 10);
  assert.strictEqual(b.cfg.stockStart, TODAY);
});

t('move повернення, брак, зберігання, інвентаризація; серійні за місцями', () => {
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000008', d: TODAY, type: 'повернення', from: BR, to: 'склад', o: '6', lines: [{ c: 'EL01', q: 1, serials: ['LR002'] }] }).ok, true);
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000009', d: TODAY, type: 'брак', from: BR, to: 'брак', reason: 'погнута', lines: [{ c: 'MK01', q: 1 }] }).ok, true);
  assert.strictEqual(S.call(KOM, 'move', { cid: 'cMOVE0000010', d: TODAY, type: 'передача на зберігання', from: 'склад', to: 'зберігання ГАЛ-КАТ', o: '10', act: '-АКТ-1', reason: 'склад у мінусі — надходження ще не внесено', lines: [{ c: 'MK01', q: 20 }, { c: 'EL01', q: 1, serials: ['00123'] }] }).ok, true);
  assert.strictEqual(S.ss.rows('Рух').slice(-1)[0][15], "'-АКТ-1");
  assert.strictEqual(S.call(ADM, 'move', { cid: 'cMOVE0000011', d: TODAY, type: 'інвентаризація', from: 'склад', reason: 'перерахунок', lines: [{ c: 'MK01', q: -2 }] }).ok, true);
  const ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(x => [x[0], x]));
  assert.deepStrictEqual([ser.LR001[3], ser.LR002[3], ser['00123'][3], ser['00123'][4]], [BR, 'склад', 'зберігання ГАЛ-КАТ', '10']);
  const b = S.call(KOM, 'stockRead').stock.bal;
  /* склад MK01: 100 − 50 + 5 − 60 − 20 − 2 = −27 (видача 60 — з причиною); бригада: 50 − 5 + 60 − 1 = 104 */
  assert.deepStrictEqual([b['склад'].MK01, b[BR].MK01, b['зберігання ГАЛ-КАТ'].MK01, b['брак'].MK01], [-27, 104, 20, 1]);
});

t('11. stockRead — читання; stock — лише запис старого формату з об’єктом items', () => {
  assert.strictEqual(S.call(KOM, 'stockRead').ok, true);
  assert.strictEqual(S.call(KOM, 'stock').error, 'bad_request');
  assert.strictEqual(S.call(KOM, 'stock', { items: 'm1' }).error, 'bad_request');
  assert.strictEqual(S.call(KOM, 'stock', { items: [] }).error, 'bad_request');
  assert.strictEqual(S.call(KOM, 'stock', { items: null }).error, 'bad_request');
  const r = S.call(KOM, 'stock', { cid: 'cLEGACY00001', d: TODAY, o: '6', items: { e1: { q: 3, name: '=Модуль' }, m2: { q: 4, name: 'Лага' } } });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(S.call(KOM, 'stock', { cid: 'cLEGACY00001', d: TODAY, o: '6', items: { m1: { q: 3 } } }).dup, true);
  assert.strictEqual(S.call(IVAN, 'stock', { cid: 'cLEGACY00002', d: TODAY, o: '6', items: { m1: { q: 3 } } }).error, 'forbidden');
  assert.strictEqual(S.ss.rows('Видачі').slice(-1)[0][4], 'Лага');
  assert.strictEqual(S.ss.rows('Видачі').slice(-2)[0][4], "'=Модуль");
});

t('7. замовник: старі «Видачі» і склад — давальницькі завжди, підрядника — за налаштуванням', () => {
  const keys = () => S.call(ZAM, 'data').data.stock.map(x => Object.keys(x.items).join(',')).join('|');
  assert.strictEqual(keys(), 'e1', 'm1, m2 (підрядника) приховано, e1 (модуль) видно');
  let s = S.call(ZAM, 'stockRead').stock;
  assert.ok(s.receipts.every(x => x.lines.every(l => l.owner === 'ГАЛ-КАТ')) && s.moves.every(x => x.lines.every(l => l.owner === 'ГАЛ-КАТ')));
  assert.strictEqual(s.bal['склад'].MK01, undefined);
  assert.strictEqual(s.cfg.contractorVisible, false);
  S.ss.getSheetByName('Налаштування').rows.push(['customerSeesContractorStock', 'так', '']);
  assert.strictEqual(keys(), 'm1|e1,m2');
  s = S.call(ZAM, 'stockRead').stock;
  assert.strictEqual(s.bal['склад'].MK01, -27);
  S.ss.getSheetByName('Налаштування').rows.pop();
  assert.strictEqual(S.call(KOM, 'data').data.stock.length, 2, 'комірник бачить усе');
});

t('stockRead: виконавець бачить лише рух своєї бригади', () => {
  const r = S.call(IVAN, 'stockRead').stock;
  assert.strictEqual(r.receipts.length, 0);
  assert.ok(r.moves.length > 0 && r.moves.every(m => m.from === BR || m.to === BR));
  assert.deepStrictEqual(Object.keys(r.bal), [BR]);
  assert.ok(r.serials.every(x => x.place === BR));
});

t('10. атомарність: серійні пишуться першими; обрив перед рядками документа виправляється при повторі', () => {
  S.ss.getSheetByName('Рух').failOnce = 'обрив зв’язку з таблицею';
  const req = issue('cMOVE0000012', { lines: [{ c: 'EL01', q: 1, serials: ['LR001'] }], from: BR, to: 'склад', type: 'повернення' });
  const r1 = S.call(KOM, 'move', req);
  assert.strictEqual(r1.error, 'server');
  let ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(x => [x[0], x]));
  assert.strictEqual(ser.LR001[3], 'склад', 'серійні вже переписано, документа ще немає');
  assert.ok(!S.ss.rows('Рух').some(x => x[16] === 'cMOVE0000012'));
  const r2 = S.call(KOM, 'move', req);
  assert.strictEqual(r2.ok, true, JSON.stringify(r2));
  ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(x => [x[0], x]));
  assert.deepStrictEqual([ser.LR001[3], ser.LR001[5]], ['склад', r2.id]);
  /* dup: «Серійні» зіпсовано вручну — повтор того самого cid їх відновлює */
  S.ss.getSheetByName('Серійні').rows.splice(1);
  const r3 = S.call(KOM, 'move', req);
  assert.deepStrictEqual([r3.ok, r3.dup, r3.id], [true, true, r2.id]);
  ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(x => [x[0], x]));
  assert.deepStrictEqual(Object.keys(ser).sort(), ['00123', 'LR001', 'LR002', 'OPEN001']);
  assert.strictEqual(ser.LR001[5], r2.id);
});

t('12. завеликі фото — bad_request; фото накладної — на Диск до блокування', () => {
  const big = [{ b64: 'A'.repeat(2.9e6), mime: 'image/jpeg' }];
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0010', d: TODAY, lines: [{ c: 'MK01', q: 1 }], photos: big }).error, 'bad_request');
  assert.strictEqual(S.call(IVAN, 'report', { cid: 'cREPORT00003', d: TODAY, o: '6', items: { tri: 1 }, photos: big }).error, 'bad_request');
  S.clearEvents();
  assert.strictEqual(S.call(KOM, 'receipt', { cid: 'cRECEIPT0011', d: TODAY, lines: [{ c: 'MK02', q: 5 }], photos: [{ b64: Buffer.from('jpg').toString('base64') }] }).ok, true);
  const ev = S.events(); assert.ok(ev.indexOf('file') >= 0 && ev.indexOf('file') < ev.indexOf('lock'), ev.join(','));
});

t('9. видалення: документ, на серійні якого посилається пізніший рух, — відмова', () => {
  const recId = S.ss.rows('Надходження')[1][0];
  const d1 = S.call(ADM, 'delete', { kind: 'receipts', id: recId });
  assert.strictEqual(d1.error, 'in_use', JSON.stringify(d1));
  assert.strictEqual(S.call(ADM, 'delete', { kind: 'moves', id: issueId }).error, 'in_use', 'видачу LR001/LR002 далі повертали');
  assert.strictEqual(S.call(IVAN, 'delete', { kind: 'moves', id: issueId }).error, 'forbidden');
  /* останній рух LR001 можна видалити — серійний повертається в бригаду */
  const lastId = S.ss.rows('Рух').find(x => x[16] === 'cMOVE0000012')[0];
  assert.strictEqual(S.call(KOM, 'delete', { kind: 'moves', id: lastId }).ok, true);
  const ser = Object.fromEntries(S.ss.rows('Серійні').slice(1).map(x => [x[0], x]));
  assert.strictEqual(ser.LR001[3], BR);
  /* надходження без серійних видаляється */
  const plain = S.ss.rows('Надходження').find(x => x[12] === 'cRECEIPT0011')[0];
  assert.strictEqual(S.call(KOM, 'delete', { kind: 'receipts', id: plain }).ok, true);
});

t('setup на порожній таблиці: усі аркуші, налаштування, stockStart, довідник, код адміністратора', () => {
  const E = makeServer({ 'Аркуш1': [] });
  E.ctx.setup();
  assert.deepStrictEqual(E.ss.sheets.map(s => s.name), ['Доступи', 'Звіти', 'Видачі', 'Налаштування', 'Норми', 'Обсяги', 'Номенклатура', 'Надходження', 'Рух', 'Серійні']);
  const set = Object.fromEntries(E.ss.rows('Налаштування').slice(1).map(r => [r[0], r[1]]));
  assert.deepStrictEqual([set.acceptance, set.customerSeesContractorStock, set.stockStart], ['foreman', 'ні', TODAY]);
  assert.ok(/^\d{6}$/.test(E.ss.rows('Доступи')[1][0]));
  assert.deepStrictEqual(E.ss.rows('Доступи')[0], ['Код', 'Ім’я', 'Роль', 'Активний', 'Примітка', 'Бригада']);
  assert.strictEqual(E.ss.rows('Номенклатура').find(r => r[0] === 'EL01')[4], 'ГАЛ-КАТ');
});

console.log('\nУсі тести Code.gs пройшли: ' + n);
