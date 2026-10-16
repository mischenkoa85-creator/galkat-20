/* Перевірка вкладки «Склад» у справжньому Chrome (Playwright, headless), телефон 390×844.
   Усі запити до Apps Script перехоплює route-мок: відповідає справжній Code.gs у Node (gas_mock.js),
   тож жоден запит не йде на робочий сервер. Шрифти й погода — порожні заглушки; усе інше зовнішнє — блокується.
   Запуск (без cd), сайт віддає python -m http.server --directory D:/галкат/10_Код/galkat-20 --bind 127.0.0.1 8765:
     set PLAYWRIGHT=<шлях до node_modules/playwright>
     node D:/галкат/10_Код/galkat-20/ses11/tools/e2e_sklad.js http://127.0.0.1:8765 D:/галкат/08_Склад/_скріни */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const { makeServer } = require('./gas_mock');

const BASE = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
const SHOTS = process.argv[3] || path.join(__dirname, '_shots');
fs.mkdirSync(SHOTS, { recursive: true });
const ORIGIN = new URL(BASE).origin;

/* «таблиця» з нуля: setup() і чотири коди */
const S = makeServer({ 'Аркуш1': [] });
S.ctx.setup();
S.ss.getSheetByName('Доступи').rows = [S.ss.rows('Доступи')[0],
  ['111111', 'Адмін', 'адмін', 'так', '', ''],
  ['222222', 'Комірник Петро', 'комірник', 'так', '', ''],
  ['333333', 'Іван', 'виконавець', 'так', '', 'Бригада 1'],
  ['444444', 'ГАЛ-КАТ, технагляд', 'замовник', 'так', '', '']];
const setSetting = (k, v) => { const sh = S.ss.getSheetByName('Налаштування'); const r = sh.rows.find(x => x && x[0] === k); if (r) r[1] = v; else sh.rows.push([k, v, '']); };

const net = { gas: 0, actions: {}, blocked: [], local: 0 };
const errors = [];
let n = 0;
const ok = (name) => { n++; console.log('ok  ' + name); };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'uk-UA', colorScheme: 'light' });
  await ctx.route('**/*', async route => {
    const req = route.request(); const u = new URL(req.url());
    if (u.origin === ORIGIN) { net.local++; return route.continue(); }
    if (/(^|\.)script\.google(usercontent)?\.com$/.test(u.hostname)) {
      net.gas++;
      let body = {}; try { body = JSON.parse(req.postData() || '{}'); } catch (e) { }
      net.actions[body.action] = (net.actions[body.action] || 0) + 1;
      const res = req.method() === 'POST' ? S.post(req.postData() || '') : { ok: false, error: 'bad_request' };
      return route.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: JSON.stringify(res) });
    }
    if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return route.fulfill({ status: 200, headers: { 'content-type': 'text/css', 'access-control-allow-origin': '*' }, body: '' });
    if (u.hostname === 'api.open-meteo.com') return route.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: JSON.stringify({ daily: { time: [] } }) });
    net.blocked.push(u.href); return route.abort();
  });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  const go = async h => { await page.goto(BASE + '/ses11/' + h); await page.waitForSelector('#view > *'); await settle(); };
  const settle = async () => { await page.waitForFunction(() => { const p = document.getElementById('qpill'); return p && p.hidden; }, null, { timeout: 15000 }); await page.waitForTimeout(250); };
  const login = async code => {
    if (await page.$('#logout')) await page.click('#logout');
    await page.waitForSelector('#codeIn'); await page.fill('#codeIn', code); await page.click('#loginB');
    await page.waitForSelector('#logout'); await page.waitForTimeout(400);
  };
  const val = async (place, c) => page.$eval('[data-place="' + place + '"] tr[data-c="' + c + '"] .bal', e => Number(e.dataset.v)).catch(() => null);
  const near = (a, b, msg) => assert.ok(a !== null && Math.abs(a - b) < 1e-6, msg + ': ' + a + ' ≠ ' + b);
  const submit = async id => { await page.click('#' + id); await settle(); };
  const shot = async name => { await page.evaluate(() => { document.getElementById('toast').hidden = true; window.scrollTo(0, 0); const s = document.createElement('style'); s.id = 'shotfix'; s.textContent = '.sumbar,.appbar{position:static!important}'; document.head.appendChild(s); }); await page.screenshot({ path: path.join(SHOTS, name), fullPage: true }); await page.evaluate(() => document.getElementById('shotfix').remove()); };
  const noHScroll = async label => { const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, document.body.scrollWidth]); assert.ok(w[0] <= w[1] && w[2] <= w[1], label + ': горизонтальна прокрутка ' + w.join('/')); };

  /* 1. комірник: надходження з серійними номерами */
  await page.goto(BASE + '/ses11/#/sklad/nadh');
  await login('222222');
  await go('#/sklad/nadh');
  assert.ok(await page.isVisible('#nav a[data-r="sk"]'), 'вкладка «Склад» є в меню комірника');
  await page.fill('#rcDoc', 'ТОВ «Сонячні системи», ВН № 1017 від 17.10.2026');
  await page.selectOption('#rcItem', 'EL01');
  await page.fill('#rcSer', 'LR-A0001\nLR-A0002\nLR-A0003\nLR-A0004\nLR-A0004');
  assert.ok((await page.textContent('#rcSerN')).includes('повторів прибрано: 1'));
  await page.click('#rcAdd');
  for (const [c, q] of [['MK01', '100'], ['MK05', '200'], ['MK08', '40']]) { await page.selectOption('#rcItem', c); await page.fill('#rcQ', q); await page.click('#rcAdd'); }
  assert.strictEqual(await page.$$eval('#rcLines .it', l => l.length), 4);
  await shot('sklad_nadhodzhennia.png');
  await noHScroll('надходження');
  await submit('rcSave');
  assert.strictEqual(S.ss.rows('Надходження').length, 5);
  assert.deepStrictEqual(S.ss.rows('Серійні').slice(1).map(r => r[0] + ':' + r[2]), ['LR-A0001:склад', 'LR-A0002:склад', 'LR-A0003:склад', 'LR-A0004:склад']);
  ok('надходження: 4 позиції, 4 серійні номери на складі (повтор у списку прибрано)');

  /* 2. видача бригаді на дах 6: ліміт і причина */
  await go('#/sklad/vyd/6');
  assert.strictEqual(await page.$eval('#ivBr', e => e.value), 'Бригада 1');
  near(await page.$eval('tr[data-c="MK01"] .rem', e => Number(e.dataset.v)), 656, 'ліміт балки = потреба даху 6');
  await page.fill('#ivq-MK01', '50'); await page.fill('#ivq-MK05', '100'); await page.fill('#ivq-EL01', '2'); await page.fill('#ivs-EL01', 'LR-A0001 LR-A0002');
  await page.fill('#ivq-MK08', '250');
  assert.ok(await page.isVisible('#ivWhyBox'), 'понад ліміт — з’являється вибір причини');
  const flag = await page.textContent('#ivf-MK08');
  assert.ok(flag.includes('понад ліміт на 31') && flag.includes('на складі лише 40'), 'попередження: ' + flag);
  assert.ok(await page.$eval('#ivr-MK08', e => e.classList.contains('lim')));
  await page.click('#ivSave');
  assert.ok((await page.textContent('#skHint')).includes('виберіть причину'), 'без причини понад ліміт не записує');
  assert.strictEqual(S.ss.rows('Рух').length, 1);
  const box = await page.$eval('#ivSign', e => { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  await page.mouse.move(box[0] + 30, box[1] + 90); await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(box[0] + 30 + i * 18, box[1] + 90 - Math.sin(i / 2) * 40);
  await page.mouse.up();
  await page.$eval('#ivSum', e => e.scrollIntoView({ block: 'center' }));
  await shot('sklad_vydacha.png');
  await noHScroll('видача');
  await page.fill('#ivq-MK08', '');
  assert.ok(!(await page.isVisible('#ivWhyBox')), 'у межах ліміту причина не потрібна');
  await submit('ivSave');
  const mv = S.ss.rows('Рух').slice(1);
  assert.deepStrictEqual(mv.map(r => [r[2], r[3], r[4], r[5], r[6], r[8]]), [['видача', 'склад', 'бригада: Бригада 1', '6', 'MK01', 50], ['видача', 'склад', 'бригада: Бригада 1', '6', 'MK05', 100], ['видача', 'склад', 'бригада: Бригада 1', '6', 'EL01', 2]]);
  assert.ok(/^https:\/\/drive/.test(mv[0][12]), 'підпис бригадира збережено на Диск');
  assert.deepStrictEqual(S.ss.rows('Серійні').slice(1).map(r => r[0] + ':' + r[3]), ['LR-A0001:бригада: Бригада 1', 'LR-A0002:бригада: Бригада 1', 'LR-A0003:склад', 'LR-A0004:склад']);
  ok('видача: ліміт даху, попередження «понад ліміт» і «на складі лише», причина обов’язкова, підпис, серійні → бригада');

  /* 3. монтажник звітує 10 трикутників — залишок бригади зменшується за специфікацією виробу */
  await login('333333');
  await go('#/zvit/6');
  await page.fill('#nm-tri', '10');
  await submit('rSave');
  assert.strictEqual(S.ss.rows('Звіти').slice(-1)[0][12], 'Бригада 1');
  await go('#/sklad');
  assert.ok((await page.textContent('h1')).includes('Матеріали бригади'));
  assert.strictEqual(await page.$$eval('[data-place]', l => l.length), 1, 'виконавець бачить лише свою бригаду');
  near(await val('бригада: Бригада 1', 'MK01'), 40, 'балка: 50 − 10');
  near(await val('бригада: Бригада 1', 'MK05'), 80, 'баласт: 100 − 2 × 10 (зараховується сам)');
  near(await val('бригада: Бригада 1', 'MK02'), -10, 'лага: не видавали, вмонтовано 10');
  near(await val('бригада: Бригада 1', 'MK08'), -20 * 219 / 1312, 'UKRIZOL: 20 плит × 219/1312');
  near(await val('бригада: Бригада 1', 'MK09'), -10 * 1231 / 328, 'болт М10х20 за специфікацією трикутника даху 6');
  assert.ok((await page.textContent('[data-place="бригада: Бригада 1"] tr[data-c="MK02"]')).includes('перевитрата'));
  assert.ok(await page.$eval('[data-place="бригада: Бригада 1"] tr[data-c="MK02"] .neg', e => getComputedStyle(e).color !== getComputedStyle(document.body).color), 'перевитрата — червоним');
  await noHScroll('бригада');
  ok('звіт 10 трикутників: балка 40, баласт 80, лага −10 (перевитрата, червоним), дробові кріплення за специфікацією');

  /* 4. комірник: повернення, брак, передача на зберігання (дах 10) */
  await login('222222');
  await go('#/sklad/pov');
  await page.selectOption('#rtO', '6');
  await page.fill('#rtq-MK01', '5');
  await submit('rtSave');
  await go('#/sklad/brak');
  await page.selectOption('#bkFrom', 'бригада: Бригада 1');
  await page.fill('#bkq-MK01', '1');
  await page.click('#bkSave');
  assert.ok((await page.textContent('#skHint')).includes('причину'), 'брак без причини не записується');
  await page.fill('#bkReason', 'погнута при підйомі');
  await submit('bkSave');
  await go('#/sklad/zber/10');
  const pre = await page.$$eval('#zbT input[type=number]', l => Object.fromEntries(l.map(e => [e.id.slice(4), e.value])));
  const plan10 = (await page.evaluate(() => window.SES11.stock.storagePlan['10']));
  for (const c in plan10) { const tray = (await page.evaluate(x => window.SES11.stock.items.find(i => i.code === x).group, c)) === 'Кабельні лотки'; assert.strictEqual(pre[c], tray ? '' : String(plan10[c]), 'передзаповнено з CSV: ' + c); }
  assert.strictEqual(pre.EL01, '176'); assert.strictEqual(pre.MK05, '704'); assert.strictEqual(pre.LT01, '');
  for (const id of Object.keys(pre)) await page.fill('#zbq-' + id, '');
  await page.fill('#zbq-MK01', '20'); await page.fill('#zbq-EL01', '2'); await page.fill('#zbs-EL01', 'LR-A0003\nLR-A0004');
  await page.fill('#zbAct', 'АКТ-10/1');
  await submit('zbSave');
  const last = S.ss.rows('Рух').slice(-2);
  assert.deepStrictEqual(last.map(r => [r[2], r[4], r[5], r[6], r[8], r[15]]), [['передача на зберігання', 'зберігання ГАЛ-КАТ', '10', 'MK01', 20, 'АКТ-10/1'], ['передача на зберігання', 'зберігання ГАЛ-КАТ', '10', 'EL01', 2, 'АКТ-10/1']]);
  ok('повернення 5, брак 1 з причиною, передача на зберігання даху 10 (передзаповнено з CSV, лотки — ні)');

  /* 5. залишки: арифметика */
  await go('#/sklad/zal');
  near(await val('склад', 'MK01'), 35, 'склад балки: 100 − 50 + 5 − 20');
  near(await val('бригада: Бригада 1', 'MK01'), 34, 'бригада: 50 − 10 − 5 − 1');
  near(await val('зберігання ГАЛ-КАТ', 'MK01'), 20, 'на зберіганні');
  near(await val('зберігання ГАЛ-КАТ', 'EL01'), 2, 'модулі на зберіганні');
  near(await val('бригада: Бригада 1', 'EL01'), 2, 'модулі в бригади');
  near(await val('вмонтовано', 'MK01'), 10, 'вмонтовано');
  near(await val('брак', 'MK01'), 1, 'брак');
  near(await val('склад', 'MK05'), 100, 'склад баласту: 200 − 100');
  assert.strictEqual(await val('склад', 'EL01'), null, 'модулів на складі 0 — рядка немає');
  await shot('sklad_zalyshky.png');
  await noHScroll('залишки');
  await page.click('[data-skv="roof"]'); await page.selectOption('#zalO', '6');
  const r6row = await page.$$eval('tr[data-c="MK01"] td', l => l.map(e => e.textContent.trim()));
  assert.deepStrictEqual(r6row.slice(1), ['656', '45', '10', '611'], 'дах 6: потреба, видано (50 − 5), вмонтовано, ще видати');
  await page.click('[data-skv="owner"]');
  assert.ok(await page.isVisible('[data-owner="ГАЛ-КАТ"] tr[data-c="EL01"]'));
  await noHScroll('за власником');
  await page.click('[data-skv="place"]');
  ok('залишки: склад 35, бригада 34, зберігання 20, вмонтовано 10, брак 1; дах 6 — видано 45, ще 611');

  /* 6. замовник: давальницькі завжди, підрядника — за налаштуванням */
  await login('444444');
  await go('#/sklad');
  assert.ok(!(await page.isVisible('nav.subtabs')), 'замовник не має форм складу');
  assert.strictEqual(await page.$$eval('tr[data-c="MK01"]', l => l.length), 0, 'балки підрядника приховано');
  near(await val('зберігання ГАЛ-КАТ', 'EL01'), 2, 'замовник бачить модулі на зберіганні');
  near(await val('бригада: Бригада 1', 'EL01'), 2, 'замовник бачить модулі в бригади');
  assert.ok((await page.textContent('#view')).includes('приховано налаштуванням'));
  await shot('sklad_zamovnyk.png');
  await noHScroll('замовник');
  setSetting('customerSeesContractorStock', 'так');
  await page.reload(); await page.waitForSelector('[data-place="склад"] tr[data-c="MK01"]', { timeout: 15000 }); await settle();
  near(await val('склад', 'MK01'), 35, 'з налаштуванням «так» замовник бачить склад підрядника');
  near(await val('бригада: Бригада 1', 'MK01'), 34, 'і бригаду');
  assert.ok(!(await page.textContent('#view')).includes('приховано налаштуванням'));
  await shot('sklad_zamovnyk_usi.png');
  setSetting('customerSeesContractorStock', 'ні');
  ok('замовник: «ні» — лише давальницькі; «так» — і матеріали підрядника');

  /* 7. телефон 390 px, світла й темна тема: без горизонтальної прокрутки */
  await login('222222');
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const h of ['#/sklad/zal', '#/sklad/nadh', '#/sklad/vyd/6', '#/sklad/pov', '#/sklad/brak', '#/sklad/zber/10', '#/', '#/d/6/spec', '#/d/10/spec', '#/metod']) { await go(h); await noHScroll(scheme + ' ' + h); }
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.ok(scheme === 'dark' ? bg === 'rgb(15, 18, 21)' : bg === 'rgb(243, 245, 247)', scheme + ' тема: тло ' + bg);
  }
  await go('#/sklad/zal');
  await shot('sklad_zalyshky_temna.png');
  await page.emulateMedia({ colorScheme: 'light' });
  ok('390×844, світла і темна: без горизонтальної прокрутки на 10 екранах');

  /* 8. мережа і консоль */
  assert.strictEqual(net.blocked.length, 0, 'заблоковано зовнішні запити: ' + net.blocked.join(', '));
  assert.ok(net.gas > 0);
  assert.deepStrictEqual(errors, [], 'помилки консолі');
  ok('запитів до Apps Script: ' + net.gas + ', усі — у мок (' + Object.entries(net.actions).map(x => x.join(' ')).join(', ') + '); помилок консолі: 0');

  await browser.close();
  console.log('\nE2E «Склад» пройдено: ' + n + ' блоків. Скріни: ' + SHOTS);
})().catch(async e => { console.error('ПОМИЛКА:', e && e.stack || e); console.error('консоль:', errors); process.exit(1); });
