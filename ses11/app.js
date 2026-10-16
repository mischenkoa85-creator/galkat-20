/* Журнал СЕС площадки 11 — клієнтська частина. Дані проєкту: data.js; сервер: Google Apps Script (config.js). */
(function () {
  'use strict';
  const D = window.SES11;
  const CFG = window.SES11_CONFIG || {};
  const API = (CFG.API_URL || '').trim();
  const W = Object.fromEntries(D.works.map(w => [w.id, w]));
  const O = Object.fromEntries(D.objects.map(o => [o.id, o]));
  const OBJS = D.objects;
  const ROOFS = OBJS.filter(o => o.id !== 'S');
  /* обсяг 2026 — дахи 1–9 і загальна частина (100 % = 1624 модулі); дахи 10–11 відкладено на 2027 (data.js: phase, status, storage) */
  const isDef = o => !!o && o.phase === '2027';
  const OBJS26 = OBJS.filter(o => !isDef(o));
  const ROOFS26 = ROOFS.filter(o => !isDef(o));
  const DEFR = ROOFS.filter(isDef);
  const STORE = 'зберігання ГАЛ-КАТ';
  const GNAME = Object.fromEntries(D.groups.map(g => [g.id, g.name]));
  const ROOF_G = ['lift', 'ballast', 'frame', 'pv', 'dc', 'test'];
  const S_G = ['site', 'rp'];
  const CLS = D.classes;
  const $ = id => document.getElementById(id);
  const view = $('view');
  const NF0 = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });
  const NF1 = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 });
  const NF2 = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });
  const fmt = (v, d) => (d === 2 ? NF2 : d === 1 ? NF1 : NF0).format(v);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pctTxt = p => { if (p == null || !isFinite(p)) return '—'; const v = p * 100; if (v > 0 && v < 1) return fmt(v, 1) + ' %'; return fmt(Math.floor(v + 1e-9), 0) + ' %'; };
  const pct1 = p => fmt((p || 0) * 100, 1) + ' %';
  const dpct = p => (p >= 0 ? '+' : '−') + fmt(Math.abs(p) * 100, Math.abs(p) * 100 < 10 ? 1 : 0) + ' %';
  const z2 = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + z2(d.getMonth() + 1) + '-' + z2(d.getDate());
  const today = () => ymd(new Date());
  const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
  const dLabel = s => { const [y, m, d] = s.split('-'); return d + '.' + m + '.' + y; };
  const dShort = s => { const [, m, d] = s.split('-'); return d + '.' + m; };
  const WD = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const WDL = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'];
  const MON = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const MONN = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
  const longDate = s => { const d = parseD(s); return WDL[d.getDay()].replace(/^./, c => c.toUpperCase()) + ', ' + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
  const objName = o => o.id === 'S' ? 'Загальна частина' : o.name;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- state ---------------- */
  const st = {
    code: '', me: null, data: { reports: [], stock: [], settings: {}, norms: {}, plan: {} },
    loaded: false, loadErr: '', wx: null, wxErr: '', rDraft: {}, crane: {}, photos: {}, note: {}, photoLink: {},
    sDraft: {}, sNote: '', sAct: '', period: 'd', psel: null, delArm: null, busy: false, rDate: today(), sDate: today(),
    srvRep: [], srvStock: [], cachedAt: 0, queue: [], flushing: false, open: {},
    /* склад (крок 2): документи з сервера (skSrv) і разом із чергою телефона (sk); чернетки форм */
    skSrv: { receipts: [], moves: [], serials: [], bal: {}, brigades: [], cfg: {} }, sk: { receipts: [], moves: [] }, skLoaded: false, skErr: '', skf: 'all',
    rc: { d: today(), doc: '', pick: '', q: '', ser: '', lines: [], photos: [] },
    iv: { d: today(), o: '', br: '', q: {}, ser: {}, why: '', reason: '', sign: '' },
    rt: { d: today(), br: '', o: '', q: {}, ser: {}, reason: '' },
    bk: { d: today(), from: 'склад', q: {}, ser: {}, reason: '' },
    zb: { d: today(), o: '10', act: '', note: '', q: {}, init: {} },
    zal: { v: 'place', o: '1' },
    op: { d: '', place: 'склад', pick: '', q: '', ser: '', lines: [] }
  };
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }, del(k) { try { localStorage.removeItem(k); } catch (e) { } } };
  st.code = LS.get('ses11.code') || '';
  try { st.me = JSON.parse(LS.get('ses11.me') || 'null'); } catch (e) { st.me = null; }
  const role = () => st.me ? st.me.role : '';
  const PREVIEW = !API;
  const canReport = () => PREVIEW || role() === 'адмін' || role() === 'виконавець';
  const canStock = () => !!API && (role() === 'адмін' || role() === 'комірник');
  /* вкладка «Склад»: комірник і адмін — усе; замовник — залишки (давальницькі завжди, підрядника — за налаштуванням); виконавець — своя бригада */
  const canSeeStock = () => !!API && !!st.me && ['адмін', 'комірник', 'замовник', 'виконавець'].includes(role());
  const num = v => { const x = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; };
  const r3 = v => Math.round(v * 1000) / 1000;
  const stamp = () => { const d = new Date(); return ymd(d) + 'T' + z2(d.getHours()) + ':' + z2(d.getMinutes()) + ':' + z2(d.getSeconds()); };
  const newCid = () => { const b = new Uint8Array(8); try { crypto.getRandomValues(b); } catch (e) { for (let i = 0; i < 8; i++) b[i] = Math.random() * 256; } return 'c' + Date.now().toString(36) + Array.from(b, x => z2(x.toString(16))).join(''); };
  const DEV = LS.get('ses11.dev') || (() => { const d = newCid().slice(1); LS.set('ses11.dev', d); return d; })();
  const buzz = () => { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) { } };

  /* ---------------- api ---------------- */
  async function api(action, payload) {
    const res = await fetch(API, { method: 'POST', body: JSON.stringify(Object.assign({ action, code: st.code }, payload || {})) });
    if (!res.ok) throw { error: 'http', message: 'HTTP ' + res.status };
    let j; try { j = await res.json(); } catch (e) { throw { error: 'http', message: 'сервер відповів не JSON' }; }
    if (!j.ok) throw j;
    return j;
  }
  const errText = e => {
    const c = e && e.error;
    if (c === 'bad_code') return 'Код не підходить або вимкнений. Перевірте код у керівника.';
    if (c === 'forbidden') return 'Для цієї дії у вашої ролі немає права.';
    if (c === 'empty') return 'Немає що записати: вкажіть кількість, кран або фото.';
    if (c === 'bad_date') return 'Перевірте дату.';
    if (c === 'not_found') return 'Запис уже видалено.';
    if (c === 'bad_object') return 'Невідомий дах.';
    if (c === 'bad_type') return 'Невідомий тип запису складу.';
    const m = e && e.message ? ': ' + e.message : '';
    if (c === 'bad_item') return 'Невідома позиція номенклатури.';
    if (c === 'bad_qty') return 'Перевірте кількість.';
    if (c === 'bad_place') return 'Невірне місце «звідки» або «куди».';
    if (c === 'bad_lines') return 'Забагато рядків або серійних номерів в одному документі.';
    if (c === 'bad_serial') return 'Недопустимі символи в серійному номері' + m + '.';
    if (c === 'serial_dup') return 'Серійний номер уже є на обліку' + m + '.';
    if (c === 'serial_unknown') return 'Такого серійного номера немає на обліку' + m + '.';
    if (c === 'serial_state') return 'Серійний номер зараз в іншому місці' + m + '.';
    if (c === 'serial_count') return 'Кількість не дорівнює числу серійних номерів.';
    if (c === 'need_reason') return 'Вкажіть причину: брак або видача понад ліміт.';
    if (c === 'in_use') return 'Не можна видалити: серійні номери вже є в пізніших документах' + m + '.';
    if (c === 'bad_request' && /^over_limit/.test(e.message || '')) return 'Понад ліміт даху або наявність — потрібна причина (' + String(e.message).replace(/^over_limit:\s*/, '') + ').';
    if (c === 'bad_request') return 'Сервер не прийняв запис' + m + '.';
    if (c === 'http') return 'Сервер тимчасово недоступний' + m + '.';
    if (c === 'server') return 'Помилка сервера: ' + (e.message || '') + '. Спробуйте ще раз.';
    return 'Немає зв’язку з сервером. Перевірте інтернет і спробуйте ще раз.';
  };
  function applyData(d) {
    st.srvRep = (d.reports || []).filter(r => O[r.o] && /^\d{4}-\d{2}-\d{2}$/.test(r.d)).map(r => ({ id: r.id, cid: String(r.cid || ''), d: r.d, o: r.o, items: cleanItems(O[r.o], r.items), crane: Number(r.crane) || 0, photo: /^https:\/\//.test(r.photo || '') ? r.photo : '', photos: Number(r.photos) || 0, n: String(r.n || ''), by: String(r.by || ''), at: String(r.at || ''), br: String(r.br || '') }));
    st.srvStock = (d.stock || []).filter(s => O[s.o] && s.o !== 'S').map(s => ({ id: s.id, cid: String(s.cid || ''), d: s.d, o: s.o, items: s.items || {}, type: String(s.type || 'видача'), act: String(s.act || ''), n: String(s.n || ''), by: String(s.by || ''), at: String(s.at || '') }));
    st.data.settings = d.settings || {}; st.data.norms = d.norms || {}; st.data.plan = d.plan || {};
    mergeQueue();
  }
  async function load(silent) {
    if (!API || !st.code) return;
    try {
      const j = await api('data');
      st.me = j.me; LS.set('ses11.me', JSON.stringify(j.me));
      const d = j.data || {};
      applyData(d);
      let sk = null;
      if (canSeeStock()) {
        try { const s = await api('stockRead'); sk = s.stock || {}; applyStock(sk); st.skErr = ''; }
        catch (e) { if (e && e.error === 'bad_code') throw e; st.skErr = errText(e); }
      }
      LS.set('ses11.cache', JSON.stringify({ t: Date.now(), code: st.code, d, sk }));
      st.loaded = true; st.loadErr = ''; st.cachedAt = 0;
    } catch (e) {
      if (e && e.error === 'bad_code') { logout(); return; }
      st.loadErr = errText(e);
    }
    if (!silent || !isTyping()) render();
  }
  /* остання відповідь сервера — щоб без зв’язку бачити готовність і «лишилось» */
  function loadCache() {
    if (!API || !st.code) return;
    try { const c = JSON.parse(LS.get('ses11.cache') || 'null'); if (c && c.code === st.code && c.d) { applyData(c.d); if (c.sk) applyStock(c.sk); st.loaded = true; st.cachedAt = c.t; } } catch (e) { }
  }
  /* документи складу з сервера (вже відфільтровані сервером за роллю) */
  function applyStock(s) {
    const lines = ls => (Array.isArray(ls) ? ls : []).filter(l => l && l.c && isFinite(Number(l.q))).map(l => ({ c: String(l.c), name: String(l.name || ''), q: Number(l.q), unit: String(l.unit || ''), owner: String(l.owner || ''), serials: Array.isArray(l.serials) ? l.serials.map(String) : [] }));
    st.skSrv = {
      receipts: (s.receipts || []).filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.d)).map(r => ({ id: String(r.id), cid: String(r.cid || ''), d: r.d, doc: String(r.doc || ''), lines: lines(r.lines), photo: /^https:\/\//.test(r.photo || '') ? r.photo : '', by: String(r.by || ''), at: String(r.at || '') })),
      moves: (s.moves || []).filter(m => /^\d{4}-\d{2}-\d{2}$/.test(m.d)).map(m => ({ id: String(m.id), cid: String(m.cid || ''), d: m.d, type: String(m.type || ''), from: String(m.from || ''), to: String(m.to || ''), o: String(m.o || ''), lines: lines(m.lines), reason: String(m.reason || ''), act: String(m.act || ''), sign: /^https:\/\//.test(m.sign || '') ? m.sign : '', by: String(m.by || ''), at: String(m.at || '') })),
      serials: Array.isArray(s.serials) ? s.serials : [], bal: s.bal || {}, brigades: Array.isArray(s.brigades) ? s.brigades.map(String) : [], cfg: s.cfg || {}
    };
    st.skLoaded = true; mergeQueue();
  }
  function cleanItems(o, items) { const out = {}; for (const w in (items || {})) { const q = Number(items[w]); if (o.plan[w] && isFinite(q) && q !== 0) out[w] = q; } return out; }
  function isTyping() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); }
  function logout() { st.code = ''; st.me = null; LS.del('ses11.code'); LS.del('ses11.me'); LS.del('ses11.cache'); st.srvRep = []; st.srvStock = []; st.data = { reports: [], stock: [], settings: {}, norms: {}, plan: {} }; st.skSrv = { receipts: [], moves: [], serials: [], bal: {}, brigades: [], cfg: {} }; st.skLoaded = false; mergeQueue(); st.loaded = false; render(); }

  /* ---------------- offline queue: IndexedDB «ses11/queue» ----------------
     Кожен запис (звіт, видача, передача на зберігання) спершу лягає в чергу на телефоні з ідентифікатором cid,
     потім надсилається. Сервер за cid не записує повтор, тож повторні спроби не задвоюють обсяг.
     Поле kind — дія сервера; сюди ж пізніше лягатимуть реєстрація і повідомлення чату. */
  const QDB = { db: null, tried: false };
  function qOpen() {
    return new Promise(res => {
      if (QDB.db || QDB.tried) return res(QDB.db); QDB.tried = true;
      try { const rq = indexedDB.open('ses11', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('queue', { keyPath: 'cid' }); rq.onsuccess = () => { QDB.db = rq.result; res(QDB.db); }; rq.onerror = () => res(null); rq.onblocked = () => res(null); } catch (e) { res(null); }
    });
  }
  function qTx(mode, fn) {
    return new Promise((res, rej) => {
      if (!QDB.db) return res(null);
      const tx = QDB.db.transaction('queue', mode); const rq = fn(tx.objectStore('queue'));
      tx.oncomplete = () => res(rq ? rq.result : null); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
    });
  }
  async function qLoad() { await qOpen(); try { const all = await qTx('readonly', s => s.getAll()); if (all) st.queue = all.sort((a, b) => a.at.localeCompare(b.at)); } catch (e) { } mergeQueue(); }
  async function qPut(e) { await qOpen(); await qTx('readwrite', s => s.put(e)); if (!st.queue.some(x => x.cid === e.cid)) st.queue.push(e); mergeQueue(); qInfo(); }
  async function qDel(cid) { st.queue = st.queue.filter(x => x.cid !== cid); try { await qTx('readwrite', s => s.delete(cid)); } catch (e) { } mergeQueue(); qInfo(); }
  function mergeQueue() {
    const rc = new Set(st.srvRep.map(r => r.cid).filter(Boolean)); const sc = new Set(st.srvStock.map(s => s.cid).filter(Boolean)); const me = st.me ? st.me.name : 'цей телефон';
    const myBr = st.me && st.me.brigade ? st.me.brigade : '';
    st.data.reports = st.srvRep.concat(st.queue.filter(q => q.kind === 'report' && O[q.body.o] && !rc.has(q.cid)).map(q => ({ id: q.cid, cid: q.cid, d: q.body.d, o: q.body.o, items: cleanItems(O[q.body.o], q.body.items), crane: Number(q.body.crane) || 0, photo: '', photos: (q.body.photos || []).length, n: String(q.body.note || ''), by: me, at: q.at, pending: true, err: q.err || '', br: myBr })));
    st.data.stock = st.srvStock.concat(st.queue.filter(q => q.kind === 'stock' && O[q.body.o] && !sc.has(q.cid)).map(q => { const items = {}; for (const k in q.body.items) items[k] = q.body.items[k].q; return { id: q.cid, cid: q.cid, d: q.body.d, o: q.body.o, items, type: q.body.type || 'видача', act: String(q.body.act || ''), n: String(q.body.note || ''), by: me, at: q.at, pending: true, err: q.err || '' }; }));
    /* документи складу з черги телефона додаються до серверних, щоб залишки змінювались одразу */
    const kc = new Set(st.skSrv.receipts.concat(st.skSrv.moves).map(x => x.cid).filter(Boolean));
    st.sk = {
      receipts: st.skSrv.receipts.concat(st.queue.filter(q => q.kind === 'receipt' && !kc.has(q.cid)).map(q => skDoc(q, me))),
      moves: st.skSrv.moves.concat(st.queue.filter(q => q.kind === 'move' && !kc.has(q.cid)).map(q => skDoc(q, me)))
    };
  }
  function skDoc(q, by, id) {
    const b = q.body; const lines = (b.lines || []).map(l => ({ c: l.c, name: l.name || '', q: Number(l.q) || 0, unit: l.unit || '', owner: l.owner || '', serials: l.serials || [] }));
    const x = { id: id || q.cid, cid: q.cid, d: b.d, lines, by, at: q.at };
    if (!id) { x.pending = true; x.err = q.err || ''; }
    if (q.kind === 'receipt') return Object.assign(x, { doc: String(b.doc || ''), photo: '' });
    return Object.assign(x, { type: b.type, from: b.from || '', to: b.to || '', o: b.o || '', reason: String(b.reason || ''), act: String(b.act || ''), sign: '' });
  }
  async function enqueue(kind, body) {
    const e = { cid: newCid(), kind, dev: DEV, at: stamp(), body, err: '', tries: 0 };
    if (!QDB.db) { await qOpen(); }
    if (QDB.db) await qPut(e); else { st.queue.push(e); mergeQueue(); qInfo(); }
    return e;
  }
  /* Помилки сервера:
     - постійні (PERM) — запис лишається в черзі з позначкою «не прийнято», поки людина не натисне «Повторити» або «Скасувати»;
     - залежні від порядку чи тимчасові (RETRY: серійні, понад ліміт, збій сервера) — повтор із наростаючою паузою;
       після QMAX невдач поспіль запис теж позначається і чекає «Повторити».
     Невдалий запис НЕ зупиняє чергу: наступні записи (звіти) надсилаються далі. Без зв’язку — зупинка до наступної спроби.
     Нічого не видаляється без дії людини. */
  const PERM = ['forbidden', 'bad_date', 'bad_object', 'bad_type', 'empty', 'bad_request', 'unknown_action', 'bad_id',
    'bad_item', 'bad_qty', 'bad_place', 'bad_lines', 'bad_serial', 'serial_count', 'need_reason'];
  const RETRY = ['serial_unknown', 'serial_state', 'serial_dup', 'server', 'http'];
  const QMAX = 5;
  const qBackoff = () => Number(LS.get('ses11.qbackoff')) || 15000; /* мс; змінюється лише для перевірки */
  const isRetry = e => RETRY.includes(e.error) || /^serial_(unknown|state|dup)/.test(e.error) || (e.error === 'bad_request' && /^over_limit/.test(e.message || ''));
  let qTimer = 0;
  async function qSave(q) { try { await qTx('readwrite', s => s.put(q)); } catch (x) { } }
  async function flush() {
    if (!API || !st.code || st.flushing || !st.queue.some(q => !q.err && !(q.next > Date.now()))) { qInfo(); qSchedule(); return; }
    st.flushing = true; qInfo(); let sent = 0, kinds = {};
    try {
      for (const q of st.queue.slice()) {
        if (q.err || q.next > Date.now()) continue;
        try { const j = await api(q.kind, Object.assign({ cid: q.cid }, q.body)); accepted(q, j); await qDel(q.cid); sent++; kinds[q.kind] = (kinds[q.kind] || 0) + 1; }
        catch (e) {
          if (e && e.error === 'bad_code') { st.flushing = false; logout(); return; }
          if (!e || !e.error) break; /* немає зв’язку — повторю пізніше тим самим cid */
          q.tries = (q.tries || 0) + 1;
          if (isRetry(e) || !PERM.includes(e.error)) {
            q.fails = (q.fails || 0) + 1; q.last = errText(e);
            if (q.fails >= QMAX) { q.err = errText(e) + ' Спроб: ' + q.fails + '.'; q.next = 0; }
            else q.next = Date.now() + qBackoff() * Math.pow(2, q.fails - 1);
          } else q.err = errText(e);
          await qSave(q); mergeQueue(); continue;
        }
      }
    } finally { st.flushing = false; }
    qInfo(); qSchedule();
    if (sent) {
      const nsk = (kinds.stock || 0) + (kinds.receipt || 0) + (kinds.move || 0);
      toast(kinds.report ? 'Надіслано звітів: ' + kinds.report + (nsk ? ', документів складу: ' + nsk : '') + '.' : 'Документи складу надіслано: ' + nsk + '.');
      await load(true);
    }
  }
  /* наступна спроба для записів на паузі */
  function qSchedule() {
    clearTimeout(qTimer); const nx = st.queue.filter(q => !q.err && q.next > 0).map(q => q.next); if (!nx.length) return;
    qTimer = setTimeout(() => { if (!st.busy) flush(); else qSchedule(); }, Math.max(50, Math.min(...nx) - Date.now() + 20));
  }
  /* «Повторити»: зняти позначку «не прийнято» і надіслати знову */
  async function onRetry(b) {
    const q = st.queue.find(x => x.cid === b.dataset.retry); if (!q) return;
    q.err = ''; q.fails = 0; q.next = 0; q.last = ''; await qSave(q); mergeQueue(); render(); flush();
  }
  /* прийнятий сервером запис одразу стає «серверним», щоб до наступного завантаження обсяги не стрибали */
  function accepted(q, j) {
    const b = q.body; const me = st.me ? st.me.name : ''; const id = (j && j.id) || q.cid;
    if (q.kind === 'report' && O[b.o]) st.srvRep.push({ id, cid: q.cid, d: b.d, o: b.o, items: cleanItems(O[b.o], b.items), crane: Number(b.crane) || 0, photo: (j && /^https:\/\//.test(j.photo || '')) ? j.photo : '', photos: (j && Number(j.photos)) || 0, n: String(b.note || ''), by: me, at: q.at, br: st.me && st.me.brigade ? st.me.brigade : '' });
    if (q.kind === 'receipt') st.skSrv.receipts.push(skDoc(q, me, id));
    if (q.kind === 'move') st.skSrv.moves.push(skDoc(q, me, id));
    if (q.kind === 'stock' && O[b.o]) { const items = {}; for (const k in b.items) items[k] = b.items[k].q; st.srvStock.push({ id, cid: q.cid, d: b.d, o: b.o, items, type: b.type || 'видача', act: String(b.act || ''), n: String(b.note || ''), by: me, at: q.at }); }
  }
  const qWait = () => st.queue.length;
  function qText() {
    const n = qWait(); const bad = st.queue.filter(q => q.err).length;
    if (!n) return API ? 'Усе надіслано.' : '';
    if (!API) return 'Чекає відправки: ' + n + '. Сервер звітів ще не підключено — записи зберігаються на цьому телефоні й надішлються самі після підключення.';
    if (!st.code) return 'Чекає відправки: ' + n + '. Увійдіть зі своїм кодом — тоді надішлю.';
    if (bad) return 'Чекає відправки: ' + n + ', з них не прийнято сервером: ' + bad + ' — відкрийте чергу нижче.';
    if (st.flushing) return 'Чекає відправки: ' + n + '. Надсилаю…';
    return 'Чекає відправки: ' + n + '. ' + (navigator.onLine === false ? 'Немає зв’язку — надішлю сам, щойно з’явиться інтернет.' : 'Надішлю сам, щойно сервер відповість.');
  }
  function qInfo() {
    const n = qWait(); const p = $('qpill');
    if (p) { p.hidden = !n; p.textContent = 'чекає відправки: ' + n; p.classList.toggle('bad', st.queue.some(q => q.err)); }
    const l = $('qline'); if (l) { l.textContent = qText(); l.classList.toggle('wait', !!n); }
  }

  /* ---------------- model ---------------- */
  const normKey = (o, w) => (o.kind === 'rail' && w === 'lift_mk') ? 'lift_mk@rail' : w;
  const defNorm = k => D.extraNorms[k] != null ? D.extraNorms[k] : W[k].norm;
  function normOf(k) { const v = st.data.norms && st.data.norms[k]; return (typeof v === 'number' && isFinite(v) && v >= 0) ? v : defNorm(k); }
  const projQ = (o, w) => o.plan[w].q;
  function planQ(o, w) { const v = st.data.plan && st.data.plan[o.id + '.' + w]; return (typeof v === 'number' && isFinite(v) && v >= 0) ? v : o.plan[w].q; }
  function hrs(o, w) { const pq = planQ(o, w); let h = pq * normOf(normKey(o, w)); if (w === 'strings') h += o.plan[w].wire * (projQ(o, w) ? pq / projQ(o, w) : 1) * normOf('wire'); return h; }
  const unitOf = (o, w) => o.plan[w].u || W[w].unit;
  const worksOf = o => Object.keys(o.plan);
  const wname = (o, w) => (w === 'lift_mk' && o.kind === 'rail') ? 'Підйом мінірейок і кріплення на дах' : W[w].name;
  const wshort = (o, w) => (w === 'lift_mk' && o.kind === 'rail') ? 'Підйом мінірейок' : W[w].short;
  const isContr = (o, w) => W[w].who === 'v';
  function rawAgg(upto, from, extra, oid) {
    const m = {};
    for (const r of st.data.reports) { if (upto && r.d > upto) continue; if (from && r.d < from) continue; if (oid && r.o !== oid) continue; for (const w in r.items) { const k = r.o + '.' + w; m[k] = (m[k] || 0) + r.items[w]; } }
    if (extra) for (const k in extra) m[k] = (m[k] || 0) + extra[k];
    return m;
  }
  function effective(m) {
    const e = Object.assign({}, m);
    for (const o of ROOFS) {
      const g = w => m[o.id + '.' + w] || 0; const p = o.plan;
      if (p.tri) {
        const ratio = projQ(o, 'ballast') / projQ(o, 'tri');
        const b = Math.max(g('ballast'), Math.min(planQ(o, 'ballast'), ratio * g('tri')));
        e[o.id + '.ballast'] = b;
        e[o.id + '.lift_bal'] = Math.max(g('lift_bal'), Math.min(planQ(o, 'lift_bal'), b));
        e[o.id + '.lift_mk'] = Math.max(g('lift_mk'), Math.min(planQ(o, 'lift_mk'), g('tri')));
      }
      if (p.rails) e[o.id + '.lift_mk'] = Math.max(g('lift_mk'), Math.min(planQ(o, 'lift_mk'), g('rails')));
      e[o.id + '.lift_pv'] = Math.max(g('lift_pv'), Math.min(planQ(o, 'lift_pv'), g('pv')));
    }
    return e;
  }
  const agg = (upto, extra) => effective(rawAgg(upto, null, extra));
  const doneOf = (m, o, w) => m[o.id + '.' + w] || 0;
  function pctW(m, o, w) { const p = planQ(o, w); if (!p) return 1; return Math.max(0, Math.min(1, doneOf(m, o, w) / p)); }
  function sumPct(m, objs, groups, filt) {
    let h = 0, e = 0;
    for (const o of objs) for (const w of worksOf(o)) {
      if (groups && !groups.includes(W[w].g)) continue;
      if (filt && !filt(o, w)) continue;
      const x = hrs(o, w); h += x; e += x * pctW(m, o, w);
    }
    return h > 0 ? e / h : null;
  }
  const totalH = (objs, filt) => { let h = 0; for (const o of (objs || OBJS26)) for (const w of worksOf(o)) if (!filt || filt(o, w)) h += hrs(o, w); return h; };
  const earned = (m, objs, filt) => { let e = 0; for (const o of (objs || OBJS26)) for (const w of worksOf(o)) if (!filt || filt(o, w)) e += hrs(o, w) * pctW(m, o, w); return e; };
  function consumed(m, o, row) { const drv = row[7]; const pq = projQ(o, drv); return pq ? row[5] / pq * doneOf(m, o, drv) : 0; }
  /* видано на дах за ключами рядків специфікації: старі «Видачі» + документи складу (видача − повернення на цей дах) */
  function issuedMap(oid, L) { L = L || ledger(); const m = {}; const k = SPECK[oid] || {}; const x = L.roofIss[oid] || {}; for (const c in x) if (k[c]) m[k[c]] = (m[k[c]] || 0) + x[c]; return m; }
  function stepOf(p) { if (p == null) return -1; if (p <= 0) return 0; if (p >= 0.999999) return 5; return Math.min(5, Math.max(1, Math.ceil(p * 5 - 1e-9))); }
  const stepFill = s => s < 0 ? 'transparent' : 'var(--s' + s + ')';
  const isDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const stepInk = s => isDark() ? (s === 5 ? 'var(--s-ink-dark)' : 'var(--ink)') : (s >= 4 ? 'var(--s-ink-light)' : 'var(--ink)');

  /* ---------------- contract calendar ---------------- */
  function S() {
    const s = st.data.settings || {};
    return {
      day1: /^\d{4}-\d{2}-\d{2}$/.test(String(s.day1 || '').trim()) ? String(s.day1).trim() : '',
      days: Number(s.days) > 0 ? Number(s.days) : 60, week: Number(s.week) === 6 ? 6 : 5,
      rain: Number(s.rain) > 0 ? Number(s.rain) : 60, gust: Number(s.gust) > 0 ? Number(s.gust) : 12,
      holidays: String(s.holidays || '').split(/[,;\s]+/).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x))
    };
  }
  function isWork(ds) { const s = S(); if (s.holidays.includes(ds)) return false; const wd = parseD(ds).getDay(); return s.week === 6 ? wd !== 0 : (wd !== 0 && wd !== 6); }
  function workIndex(ds) { const s = S(); if (!s.day1 || ds < s.day1) return 0; let n = 0; for (let d = s.day1; d <= ds; d = addDays(d, 1)) { if (isWork(d)) n++; if (n > 2000) break; } return n; }
  function dateOfWork(n) { const s = S(); if (!s.day1 || n < 1) return null; let k = 0; let d = s.day1; for (let i = 0; i < 4000; i++) { if (isWork(d)) { k++; if (k === n) return d; } d = addDays(d, 1); } return null; }
  function planFrac(n) {
    const sc = S().days / 60; let h = 0, p = 0;
    for (const o of OBJS26) for (const w of worksOf(o)) {
      if (!isContr(o, w)) continue; const x = hrs(o, w); h += x;
      const stg = D.stages.find(s => s.id === W[w].stage) || D.stages[1];
      const a = (stg.a - 1) * sc, b = stg.b * sc; p += x * Math.max(0, Math.min(1, (n - a) / (b - a)));
    }
    return h ? p / h : 0;
  }

  /* ---------------- weather ---------------- */
  async function loadWeather() {
    const cached = (() => { try { return JSON.parse(LS.get('ses11.wx') || 'null'); } catch (e) { return null; } })();
    if (cached && Date.now() - cached.t < 3 * 3600 * 1000) { st.wx = cached.d; return; }
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + D.meta.lat + '&longitude=' + D.meta.lon + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset,daylight_duration&wind_speed_unit=ms&timezone=Europe%2FKyiv&past_days=31&forecast_days=16';
    try {
      const r = await fetch(url); const j = await r.json(); const dd = j.daily; const days = {};
      dd.time.forEach((t, i) => { days[t] = { code: dd.weather_code[i], tmax: dd.temperature_2m_max[i], tmin: dd.temperature_2m_min[i], rain: dd.precipitation_sum[i], pop: dd.precipitation_probability_max[i], wind: dd.wind_speed_10m_max[i], gust: dd.wind_gusts_10m_max[i], rise: dd.sunrise[i], set: dd.sunset[i], light: dd.daylight_duration[i] / 3600 }; });
      st.wx = days; st.wxErr = ''; LS.set('ses11.wx', JSON.stringify({ t: Date.now(), d: days }));
    } catch (e) { st.wxErr = 'Прогноз погоди не завантажився.'; if (cached) st.wx = cached.d; }
  }
  const WXT = c => c == null ? '' : c === 0 ? 'ясно' : c <= 3 ? 'хмарно' : c <= 48 ? 'туман' : c <= 57 ? 'мряка' : c <= 67 ? 'дощ' : c <= 77 ? 'сніг' : c <= 82 ? 'зливи' : c <= 86 ? 'снігопад' : 'гроза';
  function roofFlag(w) {
    if (!w) return { k: 'na', t: 'немає прогнозу' }; const s = S();
    if ((w.pop != null && w.pop >= s.rain) || w.rain >= 3 || w.code >= 95) return { k: 'bad', t: 'дощ — роботи на даху під ризиком' };
    if (w.tmax != null && w.tmax < 5) return { k: 'warn', t: 'нижче +5 °C — вантажні роботи не рекомендовані' };
    if ((w.pop != null && w.pop >= 30) || w.rain >= 0.5) return { k: 'warn', t: 'можливий дощ' };
    return { k: 'ok', t: 'сприятливо' };
  }
  function craneFlag(w) {
    if (!w || w.gust == null) return { k: 'na', t: '—' }; const g = S().gust;
    if (w.gust >= g + 3) return { k: 'bad', t: 'кран і модулі — ні' };
    if (w.gust >= g) return { k: 'warn', t: 'пориви — обережно' };
    return { k: 'ok', t: 'можна' };
  }
  const hm = s => s ? s.slice(11, 16) : '—';
  const durTxt = h => Math.floor(h) + ' год ' + z2(Math.round((h - Math.floor(h)) * 60) % 60) + ' хв';

  /* ---------------- ui helpers ---------------- */
  const tip = $('tip');
  function showTip(html, x, y) { tip.innerHTML = html; tip.hidden = false; const r = tip.getBoundingClientRect(); let l = x + 14, t = y + 14; if (l + r.width > innerWidth - 8) l = x - r.width - 14; if (l < 8) l = 8; if (t + r.height > innerHeight - 8) t = y - r.height - 14; if (t < 8) t = 8; tip.style.left = l + 'px'; tip.style.top = t + 'px'; }
  const hideTip = () => { tip.hidden = true; };
  let toastT; function toast(t) { const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 4000); }
  const meter = (p, cls) => '<div class="meter' + (p >= 0.999999 ? ' done' : '') + (cls ? ' ' + cls : '') + '"><i style="width:' + (Math.max(0, Math.min(1, p || 0)) * 100).toFixed(1) + '%"></i></div>';
  function cellHtml(p, extra) { if (p == null) return '<div class="cell na' + (extra || '') + '">—</div>'; const k = stepOf(p); return '<div class="cell' + (k === 0 ? ' zero' : '') + (extra || '') + '" style="background:' + stepFill(k) + ';color:' + stepInk(k) + '">' + (k === 5 ? '✓ 100' : pctTxt(p).replace(' %', '')) + '</div>'; }

  /* ---------------- routing ---------------- */
  function route() {
    const h = (location.hash || '#/').slice(1);
    const p = h.split('/').filter(Boolean);
    if (p[0] === 'd' && O[p[1]]) return { r: 'roof', o: p[1], t: p[2] || (canReport() && !PREVIEW && !isDef(O[p[1]]) ? 'zvit' : 'plan') };
    if (p[0] === 'zvit') return { r: 'zv', o: O[p[1]] && !isDef(O[p[1]]) ? p[1] : null };
    if (p[0] === 'sklad') return { r: 'sk', t: p[1] || '', o: O[p[2]] ? p[2] : '' };
    if (p[0] === 'analityka') return { r: 'an' };
    if (p[0] === 'pogoda') return { r: 'wx' };
    if (p[0] === 'metod') return { r: 'me' };
    return { r: 'home' };
  }
  window.addEventListener('hashchange', () => { hideTip(); render(); window.scrollTo({ top: 0, behavior: 'auto' }); });

  function renderShell(rt) {
    const map = { home: 'home', roof: rt.t === 'zvit' && canReport() ? 'zv' : 'home', zv: 'zv', sk: 'sk', an: 'an', wx: 'wx', me: 'me' };
    for (const a of document.querySelectorAll('#nav a')) { if (a.dataset.r === 'zv') a.hidden = !canReport(); if (a.dataset.r === 'sk') a.hidden = !canSeeStock(); if (a.dataset.r === map[rt.r]) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
    $('who').innerHTML = st.me ? '<span class="who-n"><b>' + esc(st.me.name) + '</b><span class="who-r"> · ' + esc(st.me.role) + '</span></span><button class="btn ghost" type="button" id="logout" style="padding:4px 8px">Вийти</button>' : (API ? '' : '<span class="who-badge">без сервера</span>');
    const lo = $('logout'); if (lo) lo.onclick = () => logout();
    qInfo();
  }

  function render() {
    const rt = route(); renderShell(rt);
    if (API && !st.code) { view.innerHTML = loginHtml(); bindLogin(); return; }
    if (rt.r === 'zv' && !rt.o && canReport()) { const last = LS.get('ses11.roof'); if (O[last] && !isDef(O[last])) { location.replace('#/zvit/' + last); return; } }
    const banner = !API ? '<div class="banner">Сервер звітів ще не підключено. Звіти й фото можна вносити: вони зберігаються на цьому телефоні й чекають відправки, а надішлються самі, щойно підключать таблицю Google.</div>' : (st.loadErr ? '<div class="banner" data-kind="warn">' + esc(st.loadErr) + (st.cachedAt ? ' Показую дані, збережені ' + esc(dLabel(ymd(new Date(st.cachedAt)))) + ' о ' + esc(new Date(st.cachedAt).toTimeString().slice(0, 5)) + '.' : '') + ' <button class="btn" type="button" id="retry">Оновити</button></div>' : (!st.loaded ? '<div class="banner">Завантажую звіти…</div>' : ''));
    let html = '';
    if (rt.r === 'home') html = homeHtml();
    else if (rt.r === 'roof') html = roofHtml(rt);
    else if (rt.r === 'zv') html = rt.o ? zvHtml(O[rt.o]) : pickHtml();
    else if (rt.r === 'sk') html = skHtml(rt);
    else if (rt.r === 'an') html = analyticsHtml();
    else if (rt.r === 'wx') html = weatherHtml();
    else html = methodHtml();
    const ae = document.activeElement; const fid = ae && ae.id;
    view.innerHTML = banner + html;
    const rb = $('retry'); if (rb) rb.onclick = () => { load(); flush(); };
    if (rt.r === 'home' || (rt.r === 'zv' && !rt.o)) bindHome();
    else if (rt.r === 'zv') bindReport(O[rt.o]);
    else if (rt.r === 'roof') bindRoof(rt);
    else if (rt.r === 'sk') bindSk(rt);
    else if (rt.r === 'an') bindAnalytics();
    if (fid && $(fid) && document.activeElement !== $(fid)) { try { $(fid).focus({ preventScroll: true }); } catch (e) { } }
  }

  /* ---------------- login ---------------- */
  function loginHtml() {
    return '<section class="card login"><h1 style="font-size:24px">Вхід у журнал СЕС</h1><p class="ink2">Введіть особистий код, який вам видав керівник робіт. Код запам’ятається на цьому телефоні.</p><form id="loginF" class="login"><input id="codeIn" inputmode="numeric" autocomplete="one-time-code" placeholder="••••••" aria-label="Особистий код" required><button class="btn primary" type="submit" id="loginB">Увійти</button><div class="hint" id="loginH" aria-live="polite"></div></form></section>';
  }
  function bindLogin() {
    $('loginF').addEventListener('submit', async e => {
      e.preventDefault(); const code = $('codeIn').value.trim(); if (!code) return;
      $('loginB').disabled = true; $('loginH').className = 'hint'; $('loginH').textContent = 'Перевіряю…';
      st.code = code;
      try { const j = await api('login'); st.me = j.me; LS.set('ses11.code', code); LS.set('ses11.me', JSON.stringify(j.me)); render(); load(); flush(); }
      catch (err) { st.code = ''; $('loginH').className = 'hint err'; $('loginH').textContent = errText(err); $('loginB').disabled = false; }
    });
  }

  /* ---------------- home: genplan ---------------- */
  const LABEL = { '7': { x: 1094, y: 52, ext: true }, '9': { x: 728, y: 700, ext: true, anchor: 'start', lx: 716, ly: 726 } };
  const DEF = D.meta.deferred || {};
  function defSum() {
    const mods = DEFR.reduce((a, o) => a + o.modules, 0); const kw = DEF.kw != null ? DEF.kw : mods * D.meta.wp / 1000;
    const ids = DEFR.map(o => o.id); const ys = DEF.year || '2027';
    return { mods, kw, ids, year: ys, txt: 'Відкладено на ' + ys + ': дахи ' + (ids.length === 2 ? ids.join('–') : ids.join(', ')) + ', ' + fmt(mods) + ' мод., ' + fmt(kw, 1) + ' кВт' };
  }
  function mapSvg(m) {
    const g = D.geom;
    let s = '<svg viewBox="0 14 1250 1030" role="img" aria-label="Генплан площадки 11: дахи 2026 залиті кольором за готовністю, дахи 2027 сірі заштриховані"><defs><pattern id="h27" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)"><rect class="h27-bg" width="18" height="18"/><path class="h27-ln" d="M0 0 V18"/></pattern></defs>';
    for (const b of g.buildings) s += '<path class="bld" d="' + b + '"/>';
    for (const o of ROOFS) {
      const r = g.roofs[o.id];
      if (isDef(o)) { s += '<path class="roof dfr" data-o="' + o.id + '" tabindex="0" role="link" aria-label="' + o.name + ', відкладено на ' + (o.phase || '2027') + '" fill="url(#h27)" fill-rule="evenodd" d="' + r.d + '"/>'; continue; }
      const p = sumPct(m, [o]); const k = stepOf(p); s += '<path class="roof" data-o="' + o.id + '" tabindex="0" role="link" aria-label="' + o.name + ', готовність ' + pctTxt(p) + '" fill="' + stepFill(Math.max(k, 0)) + '" fill-rule="evenodd" d="' + r.d + '"/>';
    }
    for (const o of ROOFS) {
      const r = g.roofs[o.id]; const L = LABEL[o.id];
      if (isDef(o)) { s += '<text class="dfr-t" x="' + r.cx + '" y="' + (r.cy - 6) + '" text-anchor="middle"><tspan class="lbl-n" x="' + r.cx + '">' + o.name + '</tspan><tspan class="lbl-p" x="' + r.cx + '" dy="1.05em">' + esc(o.phase || '2027') + '</tspan></text>'; continue; }
      const p = sumPct(m, [o]); const k = stepOf(p);
      if (L && L.ext) { if (L.lx != null) s += '<path class="leader" d="M' + L.lx + ' ' + L.ly + ' L' + (L.x - 4) + ' ' + (L.y + 8) + '"/>'; s += '<text class="ext" x="' + L.x + '" y="' + L.y + '" text-anchor="' + (L.anchor || 'middle') + '"><tspan class="lbl-n">' + o.name + ' </tspan><tspan class="lbl-p">' + pctTxt(p) + '</tspan></text>'; }
      else s += '<text x="' + r.cx + '" y="' + (r.cy - 6) + '" text-anchor="middle" fill="' + stepInk(k) + '"><tspan class="lbl-n" x="' + r.cx + '">' + o.name + '</tspan><tspan class="lbl-p" x="' + r.cx + '" dy="1.05em">' + pctTxt(p) + '</tspan></text>';
    }
    const ps = sumPct(m, [O.S]);
    s += '<g data-o="S" class="roof" tabindex="0" role="link" aria-label="Загальна частина: траси, щити DC, BESS, готовність ' + pctTxt(ps) + '" style="stroke:none"><rect class="tp" x="148" y="668" width="28" height="28" rx="4"/><text class="tp-t" x="138" y="680" text-anchor="end">ТП · BESS</text><text class="tp-t" x="138" y="706" text-anchor="end" style="font-weight:700">' + pctTxt(ps) + '</text></g>';
    const bar = 20000 / g.ptmm;
    s += '<g transform="translate(1100 1034)"><path d="M0 0 H' + bar.toFixed(1) + '" stroke="var(--ink-2)" stroke-width="3"/><path d="M0 -8 V8 M' + bar.toFixed(1) + ' -8 V8" stroke="var(--ink-2)" stroke-width="2"/><text class="north" x="' + (bar / 2).toFixed(1) + '" y="-14" text-anchor="middle">20 м</text></g>';
    s += '<g transform="translate(1214 930)"><path d="M0 -40 L12 0 L0 -8 L-12 0 Z" fill="var(--ink-2)"/><text class="north" x="0" y="26" text-anchor="middle">Пн</text></g></svg>';
    return s;
  }
  function contractStatus(m) {
    const s = S(); const filt = isContr;
    const fact = sumPct(m, OBJS26, null, filt) || 0;
    if (!s.day1) return { has: false, fact };
    const n = workIndex(today()); const plan = planFrac(n);
    let nEq = 0; for (let k = 0; k <= s.days * 1.5; k++) { if (planFrac(k) <= fact + 1e-9) nEq = k; else break; }
    return { has: true, n, plan, fact, lag: n - nEq, end: dateOfWork(s.days) };
  }
  const legendHtml = () => '<div class="legend"><span>Готовність даху:</span><span class="ramp">' + [0, 1, 2, 3, 4, 5].map(i => '<i style="background:var(--s' + i + ');' + (i === 0 ? 'outline:1px solid var(--line-2);outline-offset:-1px' : '') + '"></i>').join('') + '</span><span>0 % → 100 %, крок 20 %</span>' + (DEFR.length ? '<span class="dfr-key"><i class="dfr-sw"></i>' + esc(defSum().year) + ' — відкладено, у 100 % не входить</span>' : '') + '</div>';
  function defCard(o) { const c = CLS.find(x => x.id === o.cls); return '<a class="rcard dfr" href="#/d/' + o.id + '"><span class="t"><b>' + objName(o) + '</b><span>' + esc(o.phase) + '</span></span><span class="s">' + fmt(o.modules) + ' модулів · ' + fmt(o.modules * D.meta.wp / 1000, 1) + ' кВт · ' + esc(c ? c.name.toLowerCase() : '') + '</span><span class="s">будівлю ще не збудовано · матеріали на зберіганні ' + esc(o.storage && o.storage.holder ? o.storage.holder.replace('ТзДВ ', '') : 'ГАЛ-КАТ') + '</span></a>'; }
  function homeHtml() {
    const m = agg(); const t = today(); const m0 = agg(addDays(t, -1));
    const all = sumPct(m, OBJS26) || 0; const dToday = all - (sumPct(m0, OBJS26) || 0);
    const cs = contractStatus(m); const ds = defSum();
    const modsP = ROOFS26.reduce((a, o) => a + planQ(o, 'pv'), 0); const mods = ROOFS26.reduce((a, o) => a + Math.min(doneOf(m, o, 'pv'), planQ(o, 'pv')), 0);
    const tiles = [
      ['Готовність 2026', pctTxt(all), 'сьогодні ' + dpct(dToday), all],
      cs.has ? ['Підрядник за договором', pctTxt(cs.fact), 'план на сьогодні ' + pctTxt(cs.plan) + ' · робочий день ' + cs.n + ' з ' + S().days, cs.fact] : ['Підрядник за договором', pctTxt(cs.fact), 'вкажіть «День 1» у таблиці, щоб бачити план', cs.fact],
      ['Модулі змонтовано', fmt(mods) + ' / ' + fmt(modsP), 'обсяг 2026: дахи 1–9 · ' + fmt(mods * D.meta.wp / 1000, 1) + ' з ' + fmt(modsP * D.meta.wp / 1000, 2) + ' кВт', mods / modsP],
      cs.has ? ['Відставання від графіка', cs.lag > 0 ? fmt(cs.lag) + ' роб. дн.' : (cs.lag < 0 ? 'випередження ' + fmt(-cs.lag) : 'за графіком'), 'здача за договором: ' + (cs.end ? dLabel(cs.end) : '—'), null] : ['Звітів у журналі', fmt(st.data.reports.length), st.data.reports.length ? 'останній ' + dLabel(st.data.reports.reduce((a, r) => r.d > a ? r.d : a, '')) : 'ще немає', null]
    ];
    const tileH = tiles.map(x => '<div class="tile"><div class="lbl">' + x[0] + '</div><div class="val num">' + x[1] + '</div><div class="of">' + x[2] + '</div>' + (x[3] != null ? meter(x[3]) : '') + '</div>').join('');
    const todayBy = {}; for (const r of st.data.reports) if (r.d === t) todayBy[r.o] = (todayBy[r.o] || 0) + 1;
    const cards = OBJS26.map(o => { const p = sumPct(m, [o]); const c = CLS.find(x => x.id === o.cls); return '<a class="rcard" href="#/d/' + o.id + '"><span class="t"><b>' + objName(o) + '</b><span>' + pctTxt(p) + '</span></span>' + meter(p) + '<span class="s">' + (o.id === 'S' ? 'траси, щити DC, BESS, РП, ПНР' : fmt(o.modules) + ' модулів · ' + esc(c ? c.name.toLowerCase() : '')) + '</span>' + (todayBy[o.id] ? '<span class="today">сьогодні звітів: ' + todayBy[o.id] + '</span>' : '') + '</a>'; }).join('');
    const cta = canReport() ? '<a class="cta" href="#/zvit"><span><b>Внести звіт за сьогодні</b><span>відкриється останній дах — кілька дотиків і «Записати»</span></span><i aria-hidden="true">→</i></a>' : '';
    const dfr = DEFR.length ? '<p class="dfr-line" id="dfrLine"><i class="dfr-sw" aria-hidden="true"></i><span><b>' + esc(ds.txt) + '</b> — у 100 % не входять. Будівель ще немає; матеріали передаються ГАЛ-КАТ на зберігання.</span></p>' : '';
    return cta + '<section class="card"><div class="kpis home">' + tileH + '</div>' + dfr + '</section>' +
      '<section class="card map"><div class="card-h"><h2>Генплан площадки 11</h2><p>Натисніть на дах, щоб відкрити його план, специфікацію і роботи</p></div><div class="map-wrap" id="map">' + mapSvg(m) + '</div><p class="small muted map-hint">Генплан можна гортати пальцем убік.</p>' + legendHtml() + '</section>' +
      '<section class="card"><div class="card-h"><h2>Дахи 2026 і загальна частина</h2><p>100 % = ' + fmt(modsP) + ' модулів' + (D.meta.contractModules ? ' (Додаток №3 — ' + fmt(D.meta.contractModules) + ')' : '') + '</p></div><div class="roofs">' + cards + '</div></section>' +
      (DEFR.length ? '<section class="card dfr-sec"><div class="card-h"><h2>' + esc(ds.txt) + '</h2><p>' + esc(DEF.src || '') + '</p></div><div class="roofs">' + DEFR.map(defCard).join('') + '</div></section>' : '');
  }
  function bindHome() {
    const host = $('map'); if (!host) return;
    if (host.scrollWidth > host.clientWidth + 2) { host.scrollLeft = st.mapX != null ? st.mapX : (host.scrollWidth - host.clientWidth) / 2; host.addEventListener('scroll', () => { st.mapX = host.scrollLeft; }, { passive: true }); }
    const zv = route().r === 'zv';
    const go = id => { if (zv && isDef(O[id])) { toast(O[id].name + ' відкладено на 2027 — звіти по ньому не вносяться.'); return; } location.hash = zv ? '#/zvit/' + id : '#/d/' + id; };
    host.addEventListener('click', e => { const t = e.target.closest('[data-o]'); if (t) go(t.dataset.o); });
    host.addEventListener('keydown', e => { const t = e.target.closest && e.target.closest('[data-o]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(t.dataset.o); } });
    host.addEventListener('mousemove', e => { const t = e.target.closest('[data-o]'); if (!t) return hideTip(); const o = O[t.dataset.o]; if (isDef(o)) return showTip('<b>' + objName(o) + ' — ' + esc(o.phase) + '</b><br>відкладено: будівлю ще не збудовано<br>' + fmt(o.modules) + ' модулів, матеріали на зберіганні ГАЛ-КАТ', e.clientX, e.clientY); const m = agg(); const gs = o.id === 'S' ? S_G : ROOF_G; showTip('<b>' + objName(o) + ' — ' + pctTxt(sumPct(m, [o])) + '</b><br>' + gs.filter(g => worksOf(o).some(w => W[w].g === g)).map(g => GNAME[g] + ': ' + pctTxt(sumPct(m, [o], [g]))).join('<br>'), e.clientX, e.clientY); });
    host.addEventListener('mouseleave', hideTip);
  }

  /* ---------------- report: pick a roof (лише коли телефон ще не пам’ятає дах) ---------------- */
  function pickHtml() {
    if (!canReport()) { if (!st.me) return '<section class="card"><div class="empty">Завантажую…</div></section>'; location.hash = '#/'; return ''; }
    const m = agg(); const t = today();
    const last = {}; const todayN = {};
    for (const r of st.data.reports) { if (!last[r.o] || r.d > last[r.o]) last[r.o] = r.d; if (r.d === t) todayN[r.o] = (todayN[r.o] || 0) + 1; }
    const btn = o => { const p = sumPct(m, [o]); const c = CLS.find(x => x.id === o.cls); return '<a class="rcard pick" href="#/zvit/' + o.id + '"><span class="t"><b>' + objName(o) + '</b><span>' + pctTxt(p) + '</span></span>' + meter(p) + '<span class="s">' + (o.id === 'S' ? 'траси, щити DC, BESS, заземлення, ПНР' : fmt(o.modules) + ' модулів · ' + esc(c ? c.name.toLowerCase() : '')) + '</span>' + (todayN[o.id] ? '<span class="today">сьогодні звітів: ' + todayN[o.id] + '</span>' : last[o.id] ? '<span class="s">останній звіт ' + dLabel(last[o.id]) + '</span>' : '') + '</a>'; };
    return '<section class="card"><div class="card-h"><h1 style="font-size:24px">Звіт за день</h1><p>' + longDate(t) + '</p></div><p class="ink2" style="margin-bottom:14px">Виберіть дах — один раз. Телефон його запам’ятає, і наступного разу звіт відкриється одразу на ньому.</p><div class="roofs picks">' + OBJS26.map(btn).join('') + '</div>' + (DEFR.length ? '<p class="small muted" style="margin-top:12px">' + esc(defSum().txt) + ' — звіти по них не вносяться.</p>' : '') + '</section>' +
      '<section class="card map"><div class="card-h"><h2>Або виберіть на генплані</h2></div><div class="map-wrap" id="map">' + mapSvg(m) + '</div>' + legendHtml() + '</section>';
  }

  /* ---------------- roof screen ---------------- */
  const TABS = [['zvit', 'Внести за день'], ['plan', 'План і обсяги'], ['spec', 'Специфікація'], ['hist', 'Історія']];
  function roofHtml(rt) {
    const o = O[rt.o]; const m = agg(); const p = sumPct(m, [o]); const dfr = isDef(o);
    const tabs = TABS.filter(t => t[0] !== 'zvit' || (canReport() && !dfr)).filter(t => t[0] !== 'spec' || o.id !== 'S').filter(t => t[0] !== 'hist' || !dfr).map(t => (dfr && t[0] === 'spec') ? ['spec', 'На зберіганні ГАЛ-КАТ'] : t);
    let t = rt.t; if (!tabs.some(x => x[0] === t)) t = tabs[0][0];
    if (t === 'zvit') LS.set('ses11.roof', o.id);
    const i = o.info || {}; const c = CLS.find(x => x.id === o.cls);
    const facts = o.id === 'S' ? '<span>Траси DC і 0,4 кВ, щити захисту DC1 і DC2, BESS, РП-0,4 кВ і РП-6 кВ, заземлення, ПНР. Роботи замовника позначено окремо.</span>' :
      ['<span>Система: <b>' + esc(i.system) + (i.cover ? ', ' + esc(i.cover) : '') + '</b></span>', '<span>Група: <b>' + esc(c ? c.name : '') + '</b></span>', '<span>Модулів: <b>' + fmt(o.modules) + '</b> (' + fmt(o.modules * D.meta.wp / 1000, 1) + ' кВт)</span>', '<span>Стрінгів: <b>' + fmt(i.strings) + '</b>, ліній до щита DC: <b>' + fmt(i.lines) + '</b></span>', i.ballast_t ? '<span>На підйом: <b>≈' + fmt(i.ballast_t + i.modules_t) + ' т</b></span>' : ''].join('');
    const dnote = dfr ? '<div class="dfr-note"><b>Відкладено на ' + esc(o.phase) + '.</b> ' + esc(o.statusNote || '') + (o.storage ? ' Матеріали — на відповідальному зберіганні ' + esc(o.storage.holder) + (o.storage.act ? ', акт ' + esc(o.storage.act) + (o.storage.date ? ' від ' + esc(dLabel(o.storage.date)) : '') : ', акт ще не підписано') + '.' : '') + ' У готовність 2026 цей дах не входить.</div>' : '';
    let body = '';
    if (t === 'zvit') body = reportHtml(o, m, false);
    else if (t === 'plan') body = planTabHtml(o, m);
    else if (t === 'spec') body = specHtml(o, m);
    else body = histHtml(o);
    return '<div class="crumb"><a href="#/">← Генплан</a>' + (canReport() ? '<span class="muted">·</span><a href="#/zvit">Звіт</a>' : '') + '</div>' +
      '<section class="card"><div class="roofhead"><div><h1>' + objName(o) + '</h1><div class="dayfacts" style="margin-top:6px">' + facts + '</div></div><div class="dp num">' + (dfr ? esc(o.phase) + '<small>відкладено</small>' : pctTxt(p) + '<small>готовність</small>') + '</div></div>' + (dfr ? dnote : meter(p)) +
      '<nav class="subtabs" style="margin-top:14px" aria-label="Розділи об’єкта">' + tabs.map(x => '<a href="#/d/' + o.id + '/' + x[0] + '"' + (x[0] === t ? ' aria-current="page"' : '') + '>' + x[1] + '</a>').join('') + '</nav></section>' + body;
  }

  /* ---- 30-секундний звіт: останній дах відкрито одразу, великі плитки дій ---- */
  function zvHtml(o) {
    if (!canReport()) { if (!st.me) return '<section class="card"><div class="empty">Завантажую…</div></section>'; location.hash = '#/'; return ''; }
    LS.set('ses11.roof', o.id);
    return reportHtml(o, agg(), true);
  }
  const stepFor = u => (u === 'м³') ? 0.5 : 1;
  const draft = oid => st.rDraft[oid] || (st.rDraft[oid] = {});
  /* великі дії — плитки; підйом (зараховується сам), трос, здача даху й роботи замовника — у «Ще» */
  const minorW = (o, w) => o.id === 'S' ? W[w].who !== 'v' : (W[w].g === 'lift' || w === 'handover' || w === 'rope');
  const remOf = (m, o, w) => Math.max(0, planQ(o, w) - doneOf(m, o, w));
  function remTxt(o, w, m0, m1) {
    const u = esc(unitOf(o, w)); const pq = planQ(o, w); const a = pq - doneOf(m0, o, w); const b = pq - doneOf(m1, o, w);
    if (Math.abs(a - b) < 1e-9) return a <= 1e-9 ? 'виконано ✓' : 'лишилось <b>' + fmt(a, 2) + '</b> з ' + fmt(pq, 2) + ' ' + u;
    if (b < -1e-9) return '<b class="over-t">понад обсяг на ' + fmt(-b, 2) + ' ' + u + '</b>';
    if (b <= 1e-9) return '<b class="ok-t">буде виконано ✓</b>';
    return 'лишиться <b>' + fmt(b, 2) + '</b> з ' + fmt(pq, 2) + ' ' + u;
  }
  function tileHtml(o, w, m, dr) {
    const u = unitOf(o, w); const rem = remOf(m, o, w); const sp = stepFor(u); const v = dr[w] != null ? dr[w] : '';
    const max = Math.max(sp, Math.ceil(rem / sp) * sp); const nm = esc(wshort(o, w));
    const who = W[w].who === 'z' ? ' <span class="who-badge">замовник</span>' : W[w].who === 'e2' ? ' <span class="who-badge">етап 2</span>' : '';
    const chips = rem > 0 ? [10, 50].filter(c => c < rem).map(c => '<button type="button" class="qchip" data-add="' + w + '" data-k="' + c + '">+' + c + '</button>').join('') + '<button type="button" class="qchip all" data-set="' + w + '" data-k="' + r3(rem) + '">усе ' + fmt(rem, 2) + '</button>' : '';
    return '<div class="qt' + (num(v) ? ' has' : '') + (rem <= 0 ? ' done' : '') + '" id="t-' + w + '"><div class="qt-h"><span class="qt-n">' + nm + who + '<span class="act-d">' + esc(wname(o, w)) + '</span></span><span class="qt-r" id="r-' + w + '">' + remTxt(o, w, m, m) + '</span></div>' +
      '<div class="qt-c"><button type="button" class="qbtn" data-step="' + w + '" data-k="-1" aria-label="' + nm + ': мінус ' + fmt(sp, 1) + '">−</button><input type="number" id="nm-' + w + '" inputmode="decimal" step="any" placeholder="0" value="' + esc(v) + '" aria-label="' + nm + ', зроблено за день, ' + esc(u) + '"><button type="button" class="qbtn" data-step="' + w + '" data-k="1" aria-label="' + nm + ': плюс ' + fmt(sp, 1) + '">+</button><span class="act-u">' + esc(u) + '</span></div>' +
      (chips ? '<div class="qchips">' + chips + '</div>' : '') +
      '<input type="range" id="rg-' + w + '" min="0" max="' + max + '" step="' + sp + '" value="' + (num(v) > 0 ? Math.min(max, num(v)) : 0) + '" aria-label="' + nm + ', бігунок"' + (rem <= 0 ? ' disabled' : '') + '>' +
      '<div class="act-x" id="x-' + w + '"></div></div>';
  }
  const CAM = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13.5" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const thumbsHtml = list => list.map((p, i) => '<figure><img src="' + p.url + '" alt="Фото ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="Прибрати фото ' + (i + 1) + '">✕</button></figure>').join('');
  const saveLabel = () => 'Записати' + (st.rDate !== today() ? ' за ' + dShort(st.rDate) : '');
  function roofNav(o) { return '<nav class="qroofs" id="qroofs" aria-label="Дах для звіту">' + OBJS26.map(x => '<a href="#/zvit/' + x.id + '"' + (x.id === o.id ? ' aria-current="page"' : '') + '>' + (x.id === 'S' ? 'Загальна' : esc(x.name)) + '</a>').join('') + '</nav>'; }
  function reportHtml(o, m, nav) {
    const dr = draft(o.id); const groups = o.id === 'S' ? S_G : ROOF_G; const ws = [];
    for (const g of groups) for (const w of worksOf(o)) if (W[w].g === g) ws.push(w);
    const main = ws.filter(w => !minorW(o, w)); const minor = ws.filter(w => minorW(o, w));
    const tiles = main.filter(w => remOf(m, o, w) > 0).concat(main.filter(w => remOf(m, o, w) <= 0)).map(w => tileHtml(o, w, m, dr)).join('');
    const openMore = st.open.more || minor.some(w => num(dr[w])) || num(st.crane[o.id]) > 0 || !!st.note[o.id];
    let more = minor.map(w => tileHtml(o, w, m, dr)).join('');
    if (o.plan.lift_pv) more += '<div class="act"><div class="crane-row"><label for="rCrane" class="act-n" style="font-size:15px">Кран, машино-години за день</label><input type="number" id="rCrane" inputmode="decimal" step="0.5" min="0" placeholder="0" value="' + esc(st.crane[o.id] || '') + '"><span class="act-u">маш.-год</span></div><div class="act-x" id="x-crane"></div></div>';
    more += '<div class="fld qnote"><label for="rNote">Примітка</label><input type="text" id="rNote" maxlength="300" value="' + esc(st.note[o.id] || '') + '" placeholder="ділянка, ряди, зауваження"></div>';
    const ph = st.photos[o.id] || [];
    return '<form class="card qform" id="rep" autocomplete="off">' + (nav ? roofNav(o) : '') +
      '<div class="qtop"><div class="qtitle"><b>' + objName(o) + '</b><span class="num">' + pctTxt(sumPct(m, [o])) + '</span></div><div class="fld qdate"><label for="rDate">Дата</label><input type="date" id="rDate" value="' + esc(st.rDate) + '" max="' + today() + '" required></div></div>' +
      '<div id="already">' + alreadyHtml(o) + '</div>' +
      '<p class="small muted qhelp">Скільки зроблено за день: «+», «−», швидкі «+10», «+50» або число. Болти, притиски, конектори, провід і підйом списуються самі.</p>' +
      '<div class="qtiles">' + tiles + '</div>' +
      '<div class="qphoto"><label class="photobtn">' + CAM + '<span>Фото</span><input type="file" id="rCam" accept="image/*" capture="environment"></label><label class="galbtn">з галереї<input type="file" id="rFiles" accept="image/*" multiple></label></div>' +
      '<div class="thumbs" id="thumbs">' + thumbsHtml(ph) + '</div>' +
      '<details class="qmore" id="qmore"' + (openMore ? ' open' : '') + '><summary>' + (o.id === 'S' ? 'Роботи замовника, EMS, примітка' : 'Ще: підйом, кран, здача даху, примітка') + '</summary>' + (o.id === 'S' ? '' : '<p class="small muted">Підйом баласту, профілю й модулів зараховується сам за трикутниками, мінірейками й модулями. Тут — лише те, що піднято наперед.</p>') + '<div class="qtiles">' + more + '</div></details>' +
      '<div class="sumbar qbar"><span class="sum" id="rSum">Дій не вибрано</span><button class="btn primary qsave" type="submit" id="rSave">' + saveLabel() + '</button><div class="qline" id="qline" aria-live="polite"></div></div><div class="hint" id="rHint" aria-live="polite"></div>' +
      queueHtml() + '</form>';
  }
  function alreadyHtml(o) {
    const rs = st.data.reports.filter(r => r.o === o.id && r.d === st.rDate).sort((a, b) => a.at.localeCompare(b.at));
    if (!rs.length) return '';
    return '<div class="already"><b>Уже внесено за ' + dShort(st.rDate) + ':</b>' + rs.map(r => '<div class="dlist">' + Object.keys(r.items).map(w => '<span class="dpill">' + esc(wshort(o, w)) + ' <b>' + (r.items[w] > 0 ? '+' : '') + fmt(r.items[w], 2) + '</b> ' + esc(unitOf(o, w)) + '</span>').join('') + (r.crane ? '<span class="dpill">Кран <b>' + fmt(r.crane, 1) + '</b> маш.-год</span>' : '') + (r.photos ? '<span class="dpill">Фото <b>' + r.photos + '</b></span>' : '') + '<span class="small muted">' + esc(r.by) + (r.at ? ', ' + esc(r.at.slice(11, 16)) : '') + '</span>' + (r.pending ? '<span class="pend' + (r.err ? ' bad' : '') + '">' + (r.err ? 'не прийнято: ' + esc(r.err) : 'чекає відправки') + '</span><button class="btn ghost del" type="button" data-unq="' + esc(r.cid) + '">' + (st.delArm === r.cid ? 'Скасувати звіт?' : 'Скасувати') + '</button>' : '') + '</div>').join('') + '<p class="small muted">Вносьте лише те, що зроблено понад це, інакше обсяг задвоїться.</p></div>';
  }
  /* черга на телефоні: що ще не дійшло до сервера */
  function queueHtml() {
    if (!st.queue.length) return '';
    const row = q => { const b = q.body; const o = O[b.o]; let what = '';
      if (q.kind === 'report') what = Object.keys(b.items || {}).map(w => o && o.plan[w] ? esc(wshort(o, w)) + ' <b>' + fmt(b.items[w], 2) + '</b>' : '').filter(Boolean).join(', ') + (b.crane ? ', кран ' + fmt(b.crane, 1) : '') + ((b.photos || []).length ? ', фото ' + b.photos.length : '');
      else if (q.kind === 'receipt') what = 'надходження' + (b.doc ? ', ' + esc(b.doc) : '') + ', позицій ' + (b.lines || []).length;
      else if (q.kind === 'move') what = esc(b.type) + (isBr(b.to) ? ' → ' + esc(brName(b.to)) : isBr(b.from) ? ', ' + esc(brName(b.from)) : '') + (b.act ? ', акт ' + esc(b.act) : '') + ', позицій ' + (b.lines || []).length;
      else what = (b.type === STORE ? 'передача на зберігання' : 'видача зі складу') + (b.act ? ', акт ' + esc(b.act) : '') + ', позицій ' + Object.keys(b.items || {}).length;
      const pend = q.err ? '<span class="pend bad">не прийнято: ' + esc(q.err) + '</span>' : q.next > Date.now() ? '<span class="pend">повтор о ' + esc(new Date(q.next).toTimeString().slice(0, 5)) + (q.last ? ': ' + esc(q.last) : '') + '</span>' : '<span class="pend">чекає відправки</span>';
      return '<div class="it" data-q="' + esc(q.cid) + '"><span class="dt">' + dShort(b.d) + '</span><span class="what"><b>' + esc(o ? objName(o) : 'Склад') + '</b> · ' + (what || 'без дій') + pend + '</span>' + (q.err || q.next > Date.now() ? '<button class="btn ghost del" type="button" data-retry="' + esc(q.cid) + '">Повторити</button>' : '') + '<button class="btn ghost del" type="button" data-unq="' + esc(q.cid) + '">' + (st.delArm === q.cid ? 'Скасувати?' : 'Скасувати') + '</button></div>'; };
    return '<details class="qlist" id="qlist"' + (st.open.queue ? ' open' : '') + '><summary>Черга на цьому телефоні: ' + st.queue.length + '</summary><div class="iss">' + st.queue.map(row).join('') + '</div><p class="small muted">Записи надсилаються по черзі, з тим самим номером запису, тому повторна спроба не задвоїть обсяг.</p></details>';
  }
  function reportItems(o) { const dr = draft(o.id); const items = {}; for (const w of worksOf(o)) { const v = Number(String(dr[w] == null ? '' : dr[w]).replace(',', '.')); if (isFinite(v) && v !== 0) items[w] = Math.round(v * 1000) / 1000; } return items; }
  function updateSum(o) {
    const items = reportItems(o); const extra = {}; for (const w in items) extra[o.id + '.' + w] = items[w];
    const m0 = agg(), m1 = agg(null, extra);
    for (const w of worksOf(o)) {
      const x = $('x-' + w); if (!x) continue; const notes = [];
      if (items[w]) { notes.push('після запису: ' + pctTxt(pctW(m1, o, w)) + ' цієї дії'); }
      const auto = doneOf(m1, o, w) - doneOf(m0, o, w) - (items[w] || 0); if (auto > 1e-9) notes.push('<b>+' + fmt(auto, 1) + ' ' + esc(unitOf(o, w)) + '</b> зарахується автоматично');
      x.innerHTML = notes.join(' · '); const card = x.closest('.qt, .act'); if (card) card.classList.toggle('has', !!items[w]);
      const rr = $('r-' + w); if (rr) rr.innerHTML = remTxt(o, w, m0, m1);
    }
    const c = Number(String(st.crane[o.id] || '').replace(',', '.')); const xc = $('x-crane');
    if (xc) { const t = (items.lift_bal || 0) * D.meta.ballastKg + (items.lift_pv || 0) * D.meta.moduleKg; xc.innerHTML = t > 0 ? 'піднято ≈ <b>' + fmt(t / 1000, 1) + ' т</b> (баласт ≈' + fmt(D.meta.ballastKg) + ' кг/плита — оцінка, модуль 41,6 кг)' : ''; }
    const n = Object.keys(items).length; const ph = (st.photos[o.id] || []).length;
    $('rSum').innerHTML = (n ? 'Дій: <b>' + n + '</b> · ' + objName(o).toLowerCase() + ' <b>' + dpct((sumPct(m1, [o]) || 0) - (sumPct(m0, [o]) || 0)) + '</b> · 2026 <b>' + dpct((sumPct(m1, OBJS26) || 0) - (sumPct(m0, OBJS26) || 0)) + '</b>' : 'Дій не вибрано') + (c > 0 ? ' · кран ' + fmt(c, 1) + ' маш.-год' : '') + (ph ? ' · фото <b>' + ph + '</b>' : '');
  }
  async function compress(file) {
    let bmp; try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { bmp = await createImageBitmap(file); }
    const max = 1600; const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
    const b64 = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
    return { b64, mime: 'image/jpeg', url: URL.createObjectURL(blob), size: blob.size };
  }
  function bindReport(o) {
    const form = $('rep'); if (!form) return; updateSum(o); qInfo();
    const nav = $('qroofs'); const cur = nav && nav.querySelector('[aria-current]'); if (cur) nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2);
    const setV = (w, v) => { const dr = draft(o.id); dr[w] = v === '' || v == null ? '' : String(v); const n = $('nm-' + w); if (n) n.value = dr[w]; const r = $('rg-' + w); if (r) r.value = Math.max(0, Math.min(Number(r.max), num(dr[w]))); updateSum(o); };
    form.addEventListener('click', e => {
      const b = e.target.closest('[data-add],[data-step],[data-set]'); if (!b || !form.contains(b)) return; e.preventDefault(); buzz();
      const dr = draft(o.id);
      if (b.dataset.add) { const w = b.dataset.add; setV(w, r3(num(dr[w]) + Number(b.dataset.k))); }
      else if (b.dataset.set) setV(b.dataset.set, Number(b.dataset.k));
      else { const w = b.dataset.step; const v = r3(Math.max(0, num(dr[w]) + Number(b.dataset.k) * stepFor(unitOf(o, w)))); setV(w, v || ''); }
    });
    form.addEventListener('input', e => {
      const t = e.target; const dr = draft(o.id);
      if (t.id === 'rCrane') { st.crane[o.id] = t.value; return updateSum(o); }
      if (t.id === 'rNote') { st.note[o.id] = t.value; return; }
      if (t.id === 'rDate') { st.rDate = t.value || today(); $('rSave').textContent = saveLabel(); const al = $('already'); if (al) al.innerHTML = alreadyHtml(o); return; }
      const mm = /^(rg|nm)-(.+)$/.exec(t.id); if (!mm) return; const w = mm[2];
      if (mm[1] === 'rg') { dr[w] = t.value === '0' ? '' : t.value; const n = $('nm-' + w); if (n) n.value = dr[w]; }
      else { dr[w] = t.value; const r = $('rg-' + w); const v = Number(String(t.value).replace(',', '.')); if (r && isFinite(v)) r.value = Math.max(0, Math.min(Number(r.max), v)); }
      updateSum(o);
    });
    const md = $('qmore'); if (md) md.addEventListener('toggle', () => { st.open.more = md.open; });
    const ql = $('qlist'); if (ql) ql.addEventListener('toggle', () => { st.open.queue = ql.open; });
    const addFiles = async e => {
      const files = [...e.target.files]; e.target.value = ''; const list = st.photos[o.id] || (st.photos[o.id] = []);
      const h = $('rHint'); h.className = 'hint'; h.textContent = 'Стискаю фото…';
      for (const f of files) { if (list.length >= 8) { toast('Не більше 8 фото в одному звіті'); break; } try { list.push(await compress(f)); } catch (err) { toast('Це фото не вдалося відкрити: ' + f.name); } }
      h.textContent = ''; $('thumbs').innerHTML = thumbsHtml(list); updateSum(o);
    };
    $('rCam').addEventListener('change', addFiles); $('rFiles').addEventListener('change', addFiles);
    $('thumbs').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; const list = st.photos[o.id] || []; list.splice(Number(b.dataset.rm), 1); $('thumbs').innerHTML = thumbsHtml(list); updateSum(o); });
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (st.busy) return; const h = $('rHint'); h.className = 'hint';
      const items = reportItems(o); const crane = Number(String(st.crane[o.id] || '').replace(',', '.')) || 0; const photos = st.photos[o.id] || [];
      if (!Object.keys(items).length && !(crane > 0) && !photos.length) { h.className = 'hint err'; h.textContent = 'Вкажіть хоча б одну дію, кран або додайте фото.'; return; }
      st.busy = true; $('rSave').disabled = true; h.textContent = 'Зберігаю…';
      try {
        await enqueue('report', { d: st.rDate, o: o.id, items, crane, note: st.note[o.id] || '', photos: photos.map(p => ({ b64: p.b64, mime: p.mime })) });
        st.rDraft[o.id] = {}; delete st.crane[o.id]; st.photos[o.id] = []; st.note[o.id] = '';
        toast(!API ? 'Звіт збережено на телефоні. Сервер ще не підключено — надішлеться після підключення.' : !QDB.db ? 'Звіт у черзі. Не закривайте сторінку, доки він не надішлеться.' : (navigator.onLine === false ? 'Звіт збережено на телефоні. Немає зв’язку — надішлю, щойно з’явиться.' : 'Звіт збережено. Надсилаю…'));
        st.busy = false; render(); window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
        flush();
      } catch (err) { h.className = 'hint err'; h.textContent = 'Не вдалося зберегти звіт на телефоні (' + String(err && err.message || err) + '). Дані форми на місці — натисніть «Записати» ще раз.'; }
      finally { st.busy = false; const b = $('rSave'); if (b) b.disabled = false; }
    });
  }

  /* ---- plan tab ---- */
  function planTabHtml(o, m) {
    const groups = o.id === 'S' ? S_G : ROOF_G; const oH = totalH([o]); const raw = rawAgg();
    let s = '<section class="card"><div class="card-h"><h2>Обсяги і готовність</h2><p>Обсяг — за проєктом ОС-108' + (Object.keys(st.data.plan || {}).some(k => k.startsWith(o.id + '.')) ? ', частину змінено в таблиці («Обсяги»)' : '') + '</p></div><div class="scroll"><table class="works"><thead><tr><th>Дія</th><th class="n">Обсяг</th><th class="unitc">Од.</th><th class="n">Виконано</th><th>Готовність</th><th class="n share">Частка</th></tr></thead><tbody>';
    for (const g of groups) {
      const gw = worksOf(o).filter(w => W[w].g === g); if (!gw.length) continue;
      s += '<tr class="grp"><td colspan="6">' + GNAME[g] + '<span class="gp">' + pctTxt(sumPct(m, [o], [g])) + '</span></td></tr>';
      for (const w of gw) {
        const pq = planQ(o, w); const dn = doneOf(m, o, w); const pw = pctW(m, o, w); const r0 = raw[o.id + '.' + w] || 0;
        const who = W[w].who === 'z' ? ' <span class="who-badge">замовник</span>' : W[w].who === 'e2' ? ' <span class="who-badge">етап 2</span>' : '';
        s += '<tr><td class="wname">' + esc(wname(o, w)) + who + '</td><td class="n num planc">' + fmt(pq, 2) + (pq !== projQ(o, w) ? '<span class="ovr">у проєкті ' + fmt(projQ(o, w), 2) + '</span>' : '') + '</td><td class="unitc unit">' + esc(unitOf(o, w)) + '</td><td class="n num">' + fmt(dn, 2) + '<span class="ofplan"> з ' + fmt(pq, 2) + ' ' + esc(unitOf(o, w)) + '</span>' + (dn - r0 > 1e-9 ? '<span class="ofplan" style="display:block">авто ' + fmt(dn - r0, 1) + '</span>' : '') + '</td><td class="pcell"><div class="pv">' + meter(pw) + '<b>' + (pw >= 0.999999 ? '<span class="ok-tag">✓</span>' : pctTxt(pw).replace(' %', '')) + '</b></div></td><td class="n share num">' + fmt(hrs(o, w) / oH * 100, 1) + ' %</td></tr>';
      }
    }
    s += '</tbody></table></div></section>';
    if (o.id !== 'S') {
      const ab = 'img/ab-' + z2(Number(o.id)) + '.jpg'; const etr = 'img/etr-' + D.etr[o.id] + '.jpg';
      s += sheetBlock('Схема розміщення металоконструкцій — ' + o.name, 'ОС-108-АБ арк. ' + o.info.ab, ab, 'ab') + sheetBlock('Схема з’єднання поля ФЕМ — ' + o.name, 'ОС-108-ЕТР арк. ' + o.info.etr + (['2', '9', '3', '4', '6', '7', '8'].includes(o.id) ? ' (на аркуші кілька дахів)' : ''), etr, 'etr');
      s += '<section class="card"><p class="small ink2">Фото даху: <a href="' + esc(o.photos) + '" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600">папка «' + esc(o.name) + '» на Google Диску ↗</a></p></section>';
    }
    return s;
  }
  function sheetBlock(title, sub, src, key) {
    return '<section class="card sheetimg"><div class="card-h"><h2>' + esc(title) + '</h2><p>' + esc(sub) + '</p></div><div class="zoom"><button class="btn" type="button" data-z="' + key + '" data-k="1">Вмістити</button><button class="btn" type="button" data-z="' + key + '" data-k="2">×2</button><button class="btn" type="button" data-z="' + key + '" data-k="3">×3</button><a class="btn ghost" href="' + src + '" target="_blank" rel="noopener">Відкрити окремо ↗</a></div><div class="box"><img id="img-' + key + '" src="' + src + '" alt="' + esc(title) + '" loading="lazy" style="width:100%"></div></section>';
  }

  /* ---- spec / stock tab ---- */
  const rowNote = r => r[8] ? '<span class="rnote">' + esc(r[8]) + '</span>' : '';
  const pendTag = x => x.pending ? '<span class="pend' + (x.err ? ' bad' : '') + '">' + (x.err ? 'не прийнято: ' + esc(x.err) : 'чекає відправки') + '</span>' : '';
  function specHtml(o, m) {
    if (isDef(o)) return storeHtml(o);
    const L = ledger(); const iss = issuedMap(o.id, L); const anyIss = Object.keys(iss).length > 0;
    let s = '<section class="card"><div class="card-h"><h2>Специфікація і склад</h2><p>«Вкладено» рахується зі звітів робіт пропорційно до проєкту на одиницю дії</p></div>';
    if (canStock()) s += '<p class="setrow"><a class="btn primary" href="#/sklad/vyd/' + o.id + '">Видати бригаді — у «Склад» →</a><span class="small muted">видача тепер іде з ліміту даху, на бригаду, з підписом</span></p>';
    if (!anyIss) s += '<p class="small ink2">Видач по ' + o.name.replace('Дах', 'даху') + ' ще не вносилось, тому «У бригади» показує мінус на все, що вже вкладено за звітами.</p>';
    s += '<div class="scroll"><table class="stock"><thead><tr><th>Позиція</th><th>Од.</th><th class="n">За проєктом</th><th class="n">Видано</th><th class="n">Вкладено</th><th class="n">У бригади</th><th class="n">Ще видати</th><th>Дж.</th></tr></thead><tbody>';
    let g = '';
    for (const r of o.spec) {
      if (r[1] !== g) { g = r[1]; s += '<tr class="grp"><td colspan="8">' + esc(g) + '</td></tr>'; }
      const is = iss[r[0]] || 0; const co = consumed(m, o, r); let flag = '';
      if (anyIss && co > is + 1e-6 && co > 0) flag = '<span class="flag bad">вкладено більше, ніж видано</span>'; else if (is > r[5] * 1.05 + 1e-6) flag = '<span class="flag warn">видано понад проєкт</span>';
      s += '<tr><td class="nm">' + esc(r[2]) + (r[3] ? ' <span class="muted">' + esc(r[3]) + '</span>' : '') + rowNote(r) + flag + '</td><td>' + esc(r[4]) + '</td><td class="n">' + fmt(r[5]) + '</td><td class="n">' + fmt(is, 1) + '</td><td class="n">' + fmt(co, 1) + '</td><td class="n">' + fmt(is - co, 1) + '</td><td class="n">' + fmt(Math.max(0, r[5] - is), 1) + '</td><td><span class="src">' + r[6] + '</span></td></tr>';
    }
    s += '</tbody></table></div>';
    s += '<p class="small muted" style="margin-top:8px">П — з проєкту ОС-108; Р — розраховано з даних проєкту; О — обміряно з креслення, уточнити по місцю.</p></section>';
    const list = st.data.stock.filter(x => x.o === o.id && x.type !== STORE).map(x => [x.d + x.at, stockLine(o, x)])
      .concat(st.sk.moves.filter(x => x.o === o.id && (x.type === 'видача' || x.type === 'повернення')).map(x => [x.d + x.at, skDocLine(x, true)]))
      .sort((a, b) => b[0].localeCompare(a[0])).slice(0, 50);
    s += '<section class="card"><div class="card-h"><h2>Видачі по ' + o.name.replace('Дах', 'даху') + '</h2></div><div class="iss">' + (list.length ? list.map(x => x[1]).join('') : '<div class="empty">Видач ще немає.</div>') + '</div></section>';
    return s;
  }
  function stockLine(o, x) {
    const nameOf = k => { const r = o.spec.find(y => y[0] === k); return r ? r[2] + (r[3] ? ' ' + r[3] : '') : k; };
    return '<div class="it"><span class="dt">' + dLabel(x.d) + '</span><span class="what">' + (x.type === STORE && x.act ? '<b>Акт ' + esc(x.act) + '</b>: ' : '') + Object.keys(x.items).map(k => esc(nameOf(k)) + ' — <b class="num">' + fmt(x.items[k], 2) + '</b>').join('; ') + (x.n ? ' <span class="muted">· ' + esc(x.n) + '</span>' : '') + ' <span class="muted">· ' + esc(x.by) + '</span>' + pendTag(x) + '</span>' + (x.pending ? '<button class="btn ghost del" type="button" data-unq="' + esc(x.cid) + '">' + (st.delArm === x.cid ? 'Скасувати?' : 'Скасувати') + '</button>' : canDel('stock', x) ? '<button class="btn ghost del" type="button" data-del="' + esc(x.id) + '" data-kind="stock">' + (st.delArm === x.id ? 'Видалити?' : 'Видалити') + '</button>' : '') + '</div>';
  }
  /* відкладені дахи: матеріали передаються ТзДВ «ГАЛ-КАТ» на відповідальне зберігання (записи складу з типом «зберігання ГАЛ-КАТ») */
  /* передано на зберігання ГАЛ-КАТ за ключами рядків специфікації: старі записи «зберігання ГАЛ-КАТ» + документи «передача на зберігання» */
  function storeMap(oid, L) {
    L = L || ledger(); const q = {}, acts = {}; const k = SPECK[oid] || {}; const x = L.roofKeep[oid] || {};
    for (const c in x) if (k[c]) q[k[c]] = (q[k[c]] || 0) + x[c];
    const addAct = (key, a) => { if (!key || !a) return; const l = acts[key] || (acts[key] = []); if (!l.includes(a)) l.push(a); };
    for (const s of st.data.stock) if (s.o === oid && s.type === STORE) for (const key in s.items) addAct(key, s.act);
    for (const m of st.sk.moves) if (m.o === oid && m.type === 'передача на зберігання') for (const l of m.lines) addAct(k[l.c], m.act);
    return { q, acts };
  }
  function storeHtml(o) {
    const sm = storeMap(o.id); const sg = o.storage || {};
    const full = o.spec.filter(r => (sm.q[r[0]] || 0) >= r[5] - 1e-9).length;
    let s = '<section class="card"><div class="card-h"><h2>На зберіганні ГАЛ-КАТ</h2><p>утримувач ' + esc(sg.holder || 'ТзДВ «ГАЛ-КАТ»') + ' · акт: ' + (sg.act ? esc(sg.act) + (sg.date ? ' від ' + esc(dLabel(sg.date)) : '') : 'ще не підписано') + ' · передано повністю ' + full + ' з ' + o.spec.length + ' позицій</p></div>';
    s += '<p class="small ink2" style="margin-bottom:10px">' + esc(sg.note || '') + ' Кількості — з проєкту ОС-108; під час передачі звіряйте з фактом на складі й вносьте фактичну кількість.</p>';
    if (canStock()) s += '<p class="setrow"><a class="btn primary" href="#/sklad/zber/' + o.id + '">Передати на зберігання — у «Склад» →</a><span class="small muted">кількості вже заповнені з переліку</span></p>';
    s += '<div class="scroll"><table class="stock store"><thead><tr><th>Позиція</th><th>Од.</th><th class="n">За проєктом</th><th class="n">Передано ГАЛ-КАТ</th><th>Акт</th><th class="n">Залишок<br><span class="muted" style="font-weight:400">ще передати</span></th><th>Дж.</th></tr></thead><tbody>';
    let g = '';
    for (const r of o.spec) {
      if (r[1] !== g) { g = r[1]; s += '<tr class="grp"><td colspan="7">' + esc(g) + '</td></tr>'; }
      const is = sm.q[r[0]] || 0; let flag = '';
      if (r[7] === 'tray') flag = '<span class="flag warn">лотки — лише після рішення щодо трас дахів 1, 3, 4</span>';
      if (is > r[5] + 1e-6) flag += '<span class="flag warn">передано понад проєкт</span>';
      s += '<tr><td class="nm">' + esc(r[2]) + (r[3] ? ' <span class="muted">' + esc(r[3]) + '</span>' : '') + rowNote(r) + flag + '</td><td>' + esc(r[4]) + '</td><td class="n">' + fmt(r[5]) + '</td><td class="n">' + (is ? fmt(is, 2) : '<span class="muted">—</span>') + '</td><td>' + (sm.acts[r[0]] ? esc(sm.acts[r[0]].join(', ')) : '<span class="muted">—</span>') + '</td><td class="n">' + fmt(Math.max(0, r[5] - is), 2) + '</td><td><span class="src">' + r[6] + '</span></td></tr>';
    }
    s += '</tbody></table></div>';
    s += '<p class="small muted" style="margin-top:8px">П — з проєкту ОС-108; Р — розраховано з даних проєкту; О — обміряно з креслення, уточнити по місцю. Той самий перелік: 08_Склад/Матеріали_відкладених_дахів_на_зберігання_ГАЛ-КАТ.csv.</p></section>';
    const list = st.data.stock.filter(x => x.o === o.id && x.type === STORE).map(x => [x.d + x.at, stockLine(o, x)])
      .concat(st.sk.moves.filter(x => x.o === o.id && x.type === 'передача на зберігання').map(x => [x.d + x.at, skDocLine(x, true)]))
      .sort((a, b) => b[0].localeCompare(a[0])).slice(0, 50);
    s += '<section class="card"><div class="card-h"><h2>Передачі на зберігання по ' + o.name.replace('Дах', 'даху') + '</h2></div><div class="iss">' + (list.length ? list.map(x => x[1]).join('') : '<div class="empty">Передач ще немає.</div>') + '</div></section>';
    return s;
  }
  function canDel(kind, x) { if (!API || !st.me || x.pending) return false; if (role() === 'адмін') return true; if (x.by !== st.me.name) return false; return kind === 'stock' ? role() === 'комірник' : role() === 'виконавець'; }
  function stockItems(o) { const dr = st.sDraft[o.id] || {}; const items = {}; for (const k in dr) { const v = Number(String(dr[k]).replace(',', '.')); if (isFinite(v) && v !== 0) { const r = o.spec.find(x => x[0] === k); items[k] = { q: Math.round(v * 1000) / 1000, name: r ? r[2] + (r[3] ? ' ' + r[3] : '') : k }; } } return items; }
  const sSumTxt = o => (isDef(o) ? 'Позицій до передачі: <b>' : 'Позицій до видачі: <b>') + Object.keys(stockItems(o)).length + '</b>';
  function bindSpec(o) {
    const t = view.querySelector('.stock'); if (!t) return;
    const upd = () => { const e = $('sSum'); if (e) e.innerHTML = sSumTxt(o); };
    upd();
    const b = $('sSave'); if (b) b.addEventListener('click', async () => {
      const h = $('sHint'); h.className = 'hint'; const items = stockItems(o); const store = isDef(o);
      if (!Object.keys(items).length) { h.className = 'hint err'; h.textContent = 'Вкажіть кількість хоча б по одній позиції.'; return; }
      b.disabled = true; h.textContent = 'Записую…';
      try {
        await enqueue('stock', Object.assign({ d: st.sDate, o: o.id, items, note: st.sNote, type: store ? STORE : 'видача' }, store ? { act: st.sAct } : {}));
        st.sDraft[o.id] = {}; st.sNote = ''; st.sAct = '';
        toast(store ? 'Передачу на зберігання збережено. Надсилаю…' : 'Видачу збережено. Надсилаю…'); render(); flush();
      } catch (err) { h.className = 'hint err'; h.textContent = 'Не вдалося зберегти на телефоні: ' + String(err && err.message || err); b.disabled = false; }
    });
  }
  async function onDelete(b) {
    const id = b.dataset.del; const kind = b.dataset.kind || 'reports';
    if (st.delArm !== id) { st.delArm = id; b.textContent = kind === 'reports' ? 'Видалити звіт?' : 'Видалити?'; setTimeout(() => { if (st.delArm === id) { st.delArm = null; if (!isTyping()) render(); } }, 4000); return; }
    st.delArm = null; b.disabled = true;
    try { await api('delete', { kind, id }); toast('Видалено.'); await load(); } catch (err) { toast(errText(err)); b.disabled = false; }
  }
  /* скасувати запис, що ще чекає в черзі на телефоні (на сервер він не потрапить) */
  async function onUnqueue(b) {
    const id = b.dataset.unq;
    if (st.delArm !== id) { st.delArm = id; b.textContent = 'Скасувати?'; setTimeout(() => { if (st.delArm === id) { st.delArm = null; if (!isTyping()) render(); } }, 4000); return; }
    st.delArm = null; if (st.flushing) { toast('Саме надсилаю — спробуйте за мить.'); return; }
    await qDel(id); toast('Запис прибрано з черги.'); render();
  }

  /* ================= СКЛАД (кроки 1–2) =================
     Довідники — data.js → stock (крок 1, tools/build_stock.py): номенклатура, специфікації виробів (BOM на 1 одиницю
     дії звіту, точні дроби), відповідність рядків специфікації даху кодам, перелік на зберігання ГАЛ-КАТ.
     Місця: «склад», «бригада: …», «зберігання ГАЛ-КАТ», «брак»; «вмонтовано» рахується зі звітів через специфікації.
     Залишок бригади = видано − вмонтовано − повернуто − брак; мінус — перевитрата.
     Гачки наступних кроків: крок 3 — mountedCalc() дає ПОПЕРЕДНЄ списання, остаточне — після приймання
     (D.meta.acceptance, D.meta.hiddenWorks); крок 4 — PDF-акти з документів st.sk (номер = id документа);
     крок 5 — палети й QR як ще одне місце в документах «Рух». */
  const SK = D.stock || { items: [], products: {}, bom: {}, specMap: {}, storagePlan: {} };
  const ITEM = Object.fromEntries(SK.items.map(i => [i.code, i]));
  const IORD = Object.fromEntries(SK.items.map((i, k) => [i.code, k]));
  const P_STORE = 'склад', P_KEEP = STORE, P_SCRAP = 'брак', P_BRIG = 'бригада: ', NOBR = 'без бригади';
  const brPlace = b => P_BRIG + b;
  const isBr = p => String(p || '').indexOf(P_BRIG) === 0;
  const brName = p => isBr(p) ? p.slice(P_BRIG.length) : p;
  const isCust = c => !!ITEM[c] && ITEM[c].owner === 'customer';
  const isSerial = c => !!ITEM[c] && ITEM[c].track === 'serial';
  const ownerTxt = c => isCust(c) ? 'ГАЛ-КАТ' : 'підрядник';
  const itemTxt = c => { const i = ITEM[c]; return i ? i.name + (i.size ? ' ' + i.size : '') : c; };
  const unitTxt = c => ITEM[c] ? ITEM[c].unit : '';
  const byItem = (a, b) => (IORD[a] == null ? 1e6 : IORD[a]) - (IORD[b] == null ? 1e6 : IORD[b]);
  const isTray = c => !!ITEM[c] && ITEM[c].group === 'Кабельні лотки';
  const r6 = v => Math.round(v * 1e6) / 1e6;
  const q2 = v => fmt(Math.round(v * 100) / 100, 2);
  const negq = (v, tag) => v < -1e-9 ? '<b class="neg">' + q2(v) + '</b>' + (tag ? '<span class="neg-t">' + tag + '</span>' : '') : q2(v);
  const add3 = (m, a, b, q) => { const x = m[a] || (m[a] = {}); x[b] = r6((x[b] || 0) + q); };
  const ownBadge = c => isCust(c) ? ' <span class="who-badge own-g">давальницький</span>' : '';
  const SER_RE = /^[A-Za-z0-9._\/-]{3,40}$/;
  const serSplit = t => String(t || '').split(/[\s,;]+/).filter(Boolean);
  const serList = t => [...new Set(serSplit(t))];
  function serHint(t) { const raw = serSplit(t); const u = serList(t); const bad = u.filter(s => !SER_RE.test(s)); return 'номерів: <b>' + u.length + '</b>' + (raw.length > u.length ? ' · повторів прибрано: ' + (raw.length - u.length) : '') + (bad.length ? ' · <b class="neg">з помилкою: ' + esc(bad.slice(0, 3).join(', ')) + '</b>' : ''); }
  /* рядок специфікації даху → код; код → перший ключ рядка на цьому даху */
  const SPECK = {}; for (const oid in SK.specMap) { const r = SPECK[oid] = {}; for (const k in SK.specMap[oid]) if (!r[SK.specMap[oid][k]]) r[SK.specMap[oid][k]] = k; }
  const cfgSeeAll = () => { const c = st.skSrv.cfg || {}; if (typeof c.customerSeesContractorStock === 'boolean') return c.customerSeesContractorStock; const v = st.data.settings.customerSeesContractorStock; if (v != null && v !== '') return /^(так|true|yes|1)$/i.test(String(v).trim()); return !!D.meta.customerSeesContractorStock; };
  const contractorVisible = () => role() !== 'замовник' || cfgSeeAll();
  const filtOk = c => (contractorVisible() || isCust(c)) && (st.skf === 'all' || (st.skf === 'g') === isCust(c));

  /* специфікація виробу, розгорнута до матеріалів (з вкладеними виробами): {код: [чисельник, знаменник]} на 1 одиницю дії */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const BOMC = {};
  function bomFlat(oid, act) {
    const key = oid + '.' + act; if (BOMC[key]) return BOMC[key];
    const out = {}; const b = SK.bom[oid] && SK.bom[oid][act];
    const walk = (pid, n, d, depth) => {
      const p = SK.products[pid]; if (!p || depth > 5) return;
      for (const [ref, a, bb, loss] of p.parts) {
        let nn = n * a * (100 + (loss || 0)), dd = d * bb * 100; const g = gcd(nn, dd); nn /= g; dd /= g;
        if (SK.products[ref]) { walk(ref, nn, dd, depth + 1); continue; }
        const x = out[ref]; if (!x) { out[ref] = [nn, dd]; continue; }
        const n2 = x[0] * dd + nn * x[1], d2 = x[1] * dd, g2 = gcd(n2, d2); out[ref] = [n2 / g2, d2 / g2];
      }
    };
    if (b) walk(b[0], b[1], 1, 0);
    return (BOMC[key] = out);
  }
  /* потреба об’єкта за проєктом: обсяг дії × специфікація виробу (для дахів = рядкам специфікації, перевірено check_bom.py) */
  const NEED = {};
  function needOf(oid) {
    if (NEED[oid]) return NEED[oid]; const o = O[oid]; const m = {};
    for (const a in (SK.bom[oid] || {})) { if (!o.plan[a]) continue; const f = bomFlat(oid, a); for (const c in f) m[c] = (m[c] || 0) + o.plan[a].q * f[c][0] / f[c][1]; }
    for (const c in m) m[c] = r6(m[c]);
    return (NEED[oid] = m);
  }
  function roofCodes(oid) { const seen = new Set(); for (const r of (O[oid].spec || [])) { const c = (SK.specMap[oid] || {})[r[0]]; if (c) seen.add(c); } for (const c of Object.keys(needOf(oid)).sort(byItem)) seen.add(c); return [...seen]; }

  /* stockStart — дата переходу на облік складу («Налаштування»). Звіти й старі «Видачі» раніше неї
     не йдуть у залишки бригад і складу (лише у «вмонтовано» по дахах і в ліміти дахів); стан на цю дату — «Початкові залишки». */
  const stockStart = () => { const v = String((st.skSrv.cfg || {}).stockStart || st.data.settings.stockStart || '').trim().slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''; };
  const PRE = '\u0000до обліку';
  /* ПОПЕРЕДНЄ списання за звітами: обсяг дії × специфікація виробу, по дахах і бригадах.
     Баласт під трикутниками, що зараховується сам (effective), іде на бригади пропорційно до їхніх трикутників. */
  function mountedCalc() {
    const byRoof = {}, byBr = {}; const m = agg(); const ss0 = stockStart();
    for (const o of OBJS) {
      const bo = SK.bom[o.id]; if (!bo) continue;
      const raw = {};
      for (const r of st.data.reports) { if (r.o !== o.id) continue; const b = ss0 && r.d < ss0 ? PRE : (r.br || NOBR); const x = raw[b] || (raw[b] = {}); for (const w in r.items) x[w] = (x[w] || 0) + r.items[w]; }
      for (const a in bo) {
        if (!o.plan[a]) continue;
        const vol = {}; let R = 0; for (const b in raw) if (raw[b][a]) { vol[b] = raw[b][a]; R += raw[b][a]; }
        const extra = doneOf(m, o, a) - R;
        if (extra > 1e-9) {
          const drv = a === 'ballast' ? 'tri' : a; let T = 0; for (const b in raw) T += Math.max(0, raw[b][drv] || 0);
          if (T > 0) { for (const b in raw) if (raw[b][drv] > 0) vol[b] = (vol[b] || 0) + extra * raw[b][drv] / T; } else vol[NOBR] = (vol[NOBR] || 0) + extra;
        }
        const f = bomFlat(o.id, a);
        for (const b in vol) for (const c in f) { const q = vol[b] * f[c][0] / f[c][1]; add3(byRoof, o.id, c, q); if (b !== PRE) add3(byBr, b, c, q); }
      }
    }
    return { byRoof, byBr };
  }
  /* залишки: place — місце → позиція (усе); doc — лише документи складу (так рахує наявність сервер);
     бригада → позиція → {видано, вмонтовано, повернуто, брак, інвентаризація, початкові}; дах → видано / зберігання */
  function ledger() {
    const L = { place: {}, doc: {}, br: {}, roofIss: {}, roofKeep: {}, rec: {}, mnt: {} };
    const P = (p, c, q) => { if (p) { add3(L.place, p, c, q); add3(L.doc, p, c, q); } };
    const B = (b, c, k, q) => { const m = L.br[b] || (L.br[b] = {}); const x = m[c] || (m[c] = { iss: 0, mnt: 0, ret: 0, brk: 0, inv: 0, opn: 0 }); x[k] = r6(x[k] + q); };
    for (const r of st.sk.receipts) for (const l of r.lines) { P(P_STORE, l.c, l.q); L.rec[l.c] = r6((L.rec[l.c] || 0) + l.q); }
    for (const mv of st.sk.moves) for (const l of mv.lines) {
      if (mv.type === 'інвентаризація' || mv.type === 'початкові залишки') { P(mv.from, l.c, l.q); if (isBr(mv.from)) B(brName(mv.from), l.c, mv.type === 'інвентаризація' ? 'inv' : 'opn', l.q); continue; }
      P(mv.from, l.c, -l.q); P(mv.to, l.c, l.q);
      if (mv.type === 'видача') { B(brName(mv.to), l.c, 'iss', l.q); if (mv.o) add3(L.roofIss, mv.o, l.c, l.q); }
      else if (mv.type === 'повернення') { B(brName(mv.from), l.c, 'ret', l.q); if (mv.o) add3(L.roofIss, mv.o, l.c, -l.q); }
      else if (mv.type === 'брак' && isBr(mv.from)) B(brName(mv.from), l.c, 'brk', l.q);
      else if (mv.type === 'передача на зберігання' && mv.o) add3(L.roofKeep, mv.o, l.c, l.q);
    }
    /* записи «Видачі» до модуля «Склад» (ключі рядків специфікації даху, без бригади): до stockStart — лише в ліміти дахів */
    const ss0 = stockStart();
    for (const s of st.data.stock) {
      const map = SK.specMap[s.o] || {}; const pre = ss0 && s.d < ss0;
      for (const k in s.items) {
        const c = map[k]; const q = Number(s.items[k]) || 0; if (!c || !q) continue;
        if (s.type === STORE) { if (!pre) { add3(L.place, P_STORE, c, -q); add3(L.place, P_KEEP, c, q); } add3(L.roofKeep, s.o, c, q); }
        else { if (!pre) { add3(L.place, P_STORE, c, -q); add3(L.place, brPlace(NOBR), c, q); B(NOBR, c, 'iss', q); } add3(L.roofIss, s.o, c, q); }
      }
    }
    const M = mountedCalc(); L.mnt = M.byRoof;
    for (const b in M.byBr) for (const c in M.byBr[b]) { const q = M.byBr[b][c]; add3(L.place, brPlace(b), c, -q); B(b, c, 'mnt', q); }
    return L;
  }
  const brBal = x => r6(x.iss - x.mnt - x.ret - x.brk + x.inv + x.opn);
  const docAvail = (L, place, c) => (L.doc[place] || {})[c] || 0;
  const placeLabel = p => p === P_STORE ? 'Склад' : p === P_KEEP ? 'На зберіганні ГАЛ-КАТ' : 'Бригада ' + brName(p);
  function brigadeList(L) {
    const out = []; const add = b => { if (b && b !== NOBR && !out.includes(b)) out.push(b); };
    st.skSrv.brigades.forEach(add); Object.keys(L.br).forEach(add); return out;
  }

  /* ---- вкладка «Склад» ---- */
  const SK_TABS = [['zal', 'Залишки'], ['nadh', 'Надходження'], ['vyd', 'Видача'], ['pov', 'Повернення'], ['brak', 'Брак'], ['zber', 'Зберігання'], ['poch', 'Початкові залишки']];
  function skHtml(rt) {
    if (!canSeeStock()) { if (!st.me) return '<section class="card"><div class="empty">Завантажую…</div></section>'; location.hash = '#/'; return ''; }
    const tabs = canStock() ? SK_TABS : SK_TABS.slice(0, 1);
    const t = tabs.some(x => x[0] === rt.t) ? rt.t : 'zal';
    const worker = role() === 'виконавець';
    const sub = worker ? 'бригада «' + esc(st.me.brigade || st.me.name) + '»: видано, вмонтовано за звітами, повернуто, брак' : role() === 'замовник' ? (contractorVisible() ? 'давальницькі матеріали ГАЛ-КАТ і матеріали підрядника' : 'давальницькі матеріали ГАЛ-КАТ: модулі, щитки DC, провід') : 'надходження, видача бригадам, повернення, брак, зберігання ГАЛ-КАТ';
    let s = '<section class="card"><div class="card-h"><h1 style="font-size:24px">' + (worker ? 'Матеріали бригади' : 'Склад') + '</h1><p>' + sub + '</p></div>' +
      (tabs.length > 1 ? '<nav class="subtabs" aria-label="Розділи складу">' + tabs.map(x => '<a href="#/sklad/' + x[0] + '"' + (x[0] === t ? ' aria-current="page"' : '') + '>' + x[1] + '</a>').join('') + '</nav>' : '') +
      (st.skErr ? '<p class="hint err" style="margin-top:8px">' + esc(st.skErr) + '</p>' : !st.skLoaded ? '<p class="small muted" style="margin-top:8px">Завантажую документи складу…</p>' : '') + '</section>';
    const L = ledger();
    if (t === 'nadh') s += rcHtml(); else if (t === 'vyd') s += ivHtml(L, rt); else if (t === 'pov') s += rtHtml(L); else if (t === 'brak') s += bkHtml(L); else if (t === 'zber') s += zbHtml(L, rt); else if (t === 'poch') s += opHtml(L); else s += zalHtml(L);
    return s;
  }
  function itemOptions(sel) {
    const groups = [['Давальницькі ГАЛ-КАТ', SK.items.filter(i => i.owner === 'customer')]];
    for (const g of [...new Set(SK.items.filter(i => i.owner !== 'customer').map(i => i.group))]) groups.push([g, SK.items.filter(i => i.owner !== 'customer' && i.group === g)]);
    return '<option value="">— виберіть позицію —</option>' + groups.map(([g, list]) => '<optgroup label="' + esc(g) + '">' + list.map(i => '<option value="' + esc(i.code) + '"' + (i.code === sel ? ' selected' : '') + '>' + esc(i.name + (i.size ? ' ' + i.size : '') + ', ' + i.unit) + (i.track === 'serial' ? ' · сер. №' : '') + '</option>').join('') + '</optgroup>').join('');
  }
  const filterSeg = () => contractorVisible() ? '<div class="periods" role="group" aria-label="Власник матеріалу">' + [['all', 'Усі'], ['c', 'Підрядника'], ['g', 'Давальницькі']].map(x => '<button type="button" data-skf="' + x[0] + '" aria-pressed="' + (st.skf === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' : '';
  const dateFld = (id, v, label) => '<div class="fld"><label for="' + id + '">' + label + '</label><input type="date" id="' + id + '" value="' + esc(v) + '" max="' + today() + '"></div>';
  const saveBar = (id, label, sum) => '<div class="sumbar"><span class="sum" id="' + id + 'Sum">' + sum + '</span><button class="btn primary" type="submit" id="' + id + 'Save">' + label + '</button></div><div class="hint" id="skHint" aria-live="polite"></div>';
  const serBox = (id, v, ph) => '<textarea class="ser" id="' + id + '" rows="2" cols="8" placeholder="' + (ph || 'серійні номери — по одному в рядку, стільки, скільки штук') + '">' + esc(v || '') + '</textarea>';
  /* таблиця позицій із полем кількості: розділи «підрядника» і «давальницькі» */
  function qtyTable(pfx, codes, rowFn, cols) {
    const secs = [['c', 'Матеріали підрядника', codes.filter(c => !isCust(c))], ['g', 'Давальницькі ГАЛ-КАТ — модулі, щитки DC, провід', codes.filter(isCust)]];
    let s = '<div class="scroll"><table class="stock sk" id="' + pfx + 'T"><thead><tr><th>Позиція</th>' + cols.map(c => '<th class="n">' + c + '</th>').join('') + '</tr></thead><tbody>';
    let any = false;
    for (const [k, name, list] of secs) { const l = list.filter(filtOk); if (!l.length) continue; any = true; s += '<tr class="grp" data-sec="' + k + '"><td colspan="' + (cols.length + 1) + '">' + name + '</td></tr>' + l.map(rowFn).join(''); }
    return any ? s + '</tbody></table></div>' : '<div class="empty">Немає позицій для показу.</div>';
  }
  const qIn = (id, v, label) => '<input type="number" inputmode="decimal" step="any" min="0" id="' + id + '" value="' + esc(v == null ? '' : v) + '" placeholder="0" aria-label="' + esc(label) + '">';

  /* ---- набір рядків документа (надходження, початкові залишки): позиція → кількість або серійні номери ---- */
  function lineBuilder(k, empty) {
    const f = st[k]; const it = ITEM[f.pick]; const ser = it && it.track === 'serial';
    const lines = f.lines.map((l, i) => '<div class="it" data-c="' + esc(l.c) + '"><span class="what"><b>' + esc(itemTxt(l.c)) + '</b> — <b class="num">' + q2(l.q) + '</b> ' + esc(unitTxt(l.c)) + ownBadge(l.c) + (l.serials.length ? '<span class="sn">сер. № (' + l.serials.length + '): ' + esc(l.serials.slice(0, 4).join(', ')) + (l.serials.length > 4 ? '…' : '') + '</span>' : '') + '</span><button class="btn ghost del" type="button" data-lnrm="' + k + ':' + i + '">Прибрати</button></div>').join('');
    return '<div class="skadd"><div class="fld grow"><label for="' + k + 'Item">Позиція</label><select id="' + k + 'Item">' + itemOptions(f.pick) + '</select></div>' +
      (ser ? '<div class="fld grow wide"><label for="' + k + 'Ser">Серійні номери — по одному в рядку або вставте список</label>' + serBox(k + 'Ser', f.ser, 'LR8…') + '<span class="small muted" id="' + k + 'SerN">' + serHint(f.ser) + '</span></div>'
        : '<div class="fld"><label for="' + k + 'Q">Кількість' + (it ? ', ' + esc(it.unit) : '') + '</label>' + qIn(k + 'Q', f.q, 'Кількість') + '</div>') +
      '<button class="btn" type="button" id="' + k + 'Add" data-lnadd="' + k + '">Додати в документ</button></div>' +
      (it && it.analogs ? '<p class="small muted">Аналог: ' + it.analogs.map(a => esc(itemTxt(a.code)) + ' — ' + esc(a.note)).join('; ') + '</p>' : '') +
      '<div class="iss" id="' + k + 'Lines">' + (lines || '<div class="empty">' + empty + '</div>') + '</div>';
  }
  function lineAdd(k) {
    const f = st[k]; const h = $('skHint'); h.className = 'hint err';
    const c = f.pick; const it = ITEM[c]; if (!it) { h.textContent = 'Виберіть позицію.'; return; }
    let q, serials = [];
    if (it.track === 'serial') {
      serials = serList(f.ser); const bad = serials.filter(s => !SER_RE.test(s));
      if (!serials.length) { h.textContent = 'Введіть серійні номери — кількість дорівнює їх числу.'; return; }
      if (bad.length) { h.textContent = 'Перевірте серійні номери: ' + bad.slice(0, 3).join(', '); return; }
      const known = new Set(st.skSrv.serials.map(x => x.sn)); f.lines.forEach(l => l.serials.forEach(s => known.add(s)));
      const dup = serials.filter(s => known.has(s)); if (dup.length) { h.textContent = 'Уже на обліку: ' + dup.slice(0, 3).join(', '); return; }
      q = serials.length;
    } else { q = num(f.q); if (!(q > 0)) { h.textContent = 'Вкажіть кількість.'; return; } }
    f.lines.push({ c, q: r6(q), serials }); f.pick = ''; f.q = ''; f.ser = ''; render();
  }
  const docLines = f => f.lines.map(l => ({ c: l.c, q: l.q, name: itemTxt(l.c), unit: unitTxt(l.c), owner: ownerTxt(l.c), serials: l.serials }));

  /* ---- Надходження ---- */
  function rcHtml() {
    const f = st.rc;
    return '<form class="card skf" id="skf" data-form="rc" autocomplete="off"><div class="card-h"><h2>Надходження на склад</h2><p>накладна, кількість, серійні номери модулів і щитків DC</p></div>' +
      '<div class="skrow">' + dateFld('rcD', f.d, 'Дата') + '<div class="fld grow"><label for="rcDoc">Постачальник, накладна №</label><input type="text" id="rcDoc" maxlength="120" value="' + esc(f.doc) + '" placeholder="ТОВ …, ВН № … від …"></div></div>' +
      lineBuilder('rc', 'Додайте позиції накладної.') +
      '<div class="qphoto"><label class="galbtn">' + CAM + '<span>Фото накладної</span><input type="file" id="rcFiles" accept="image/*" multiple></label></div><div class="thumbs" id="rcThumbs">' + st.rc.photos.map((p, i) => '<figure><img src="' + p.url + '" alt="Накладна, фото ' + (i + 1) + '"><button type="button" data-rcph="' + i + '" aria-label="Прибрати фото ' + (i + 1) + '">✕</button></figure>').join('') + '</div>' +
      saveBar('rc', 'Записати надходження', 'Позицій: <b>' + f.lines.length + '</b>') + queueHtml() + '</form>';
  }

  /* ---- Початкові залишки: стан на дату переходу на облік — склад, бригади, зберігання ---- */
  function opHtml(L) {
    const f = st.op; if (!f.d) f.d = stockStart() || today();
    const places = [P_STORE].concat(brigadeList(L).map(brPlace), [P_KEEP]);
    if (!places.includes(f.place)) f.place = P_STORE;
    const done = st.sk.moves.filter(m => m.type === 'початкові залишки' && m.from === f.place).length;
    return '<form class="card skf" id="skf" data-form="op" autocomplete="off"><div class="card-h"><h2>Початкові залишки</h2><p>фактичний стан на дату переходу на облік: ' + esc(stockStart() ? dLabel(stockStart()) : 'не задано') + '</p></div>' +
      '<p class="small ink2">Звіти й видачі раніше цієї дати в залишки бригад не входять. Матеріал, що вже лежить у бригади чи на складі, внесіть тут — інакше нова робота покаже хибну перевитрату.</p>' +
      '<div class="skrow">' + dateFld('opD', f.d, 'Дата') + '<div class="fld grow"><label for="opPlace">Місце</label><select id="opPlace">' + places.map(p => '<option value="' + esc(p) + '"' + (p === f.place ? ' selected' : '') + '>' + esc(placeLabel(p)) + '</option>').join('') + '</select></div></div>' +
      lineBuilder('op', 'Додайте позиції, що фактично є в цьому місці.') +
      (done ? '<p class="small muted">Для цього місця вже внесено документів: ' + done + '.</p>' : '') +
      saveBar('op', 'Записати початкові залишки', 'Позицій: <b>' + f.lines.length + '</b>') + queueHtml() + '</form>';
  }

  /* ---- Видача бригаді: дах → бригада → позиції, у межах потреби даху ---- */
  function ivRem(L, o, c) { return r6(Math.max(0, (needOf(o)[c] || 0) - ((L.roofIss[o] || {})[c] || 0))); }
  function ivFlag(L, c) {
    const f = st.iv; const q = num(f.q[c]); if (!(q > 0)) return '';
    const rem = ivRem(L, f.o, c); const oh = docAvail(L, P_STORE, c); const out = [];
    if (q > rem + 1e-9) out.push('<b class="neg">понад ліміт на ' + q2(q - rem) + '</b>');
    if (q > oh + 1e-9) out.push('<span class="warn-t">на складі лише ' + q2(oh) + '</span>');
    const n = serList(f.ser[c]).length; if (isSerial(c) && n !== q) out.push('<span class="warn-t">серійних ' + n + ' з ' + q2(q) + '</span>');
    return out.join(' · ');
  }
  const ivIsOver = (L, c, v) => v > ivRem(L, st.iv.o, c) + 1e-9 || v > docAvail(L, P_STORE, c) + 1e-9;
  const ivOver = L => Object.keys(st.iv.q).filter(c => ivIsOver(L, c, num(st.iv.q[c])));
  function ivSumTxt(L) { const n = Object.keys(st.iv.q).filter(c => num(st.iv.q[c]) > 0).length; const ov = ivOver(L).length; return 'Позицій: <b>' + n + '</b>' + (ov ? ' · <b class="neg">понад ліміт або наявність: ' + ov + '</b>' : ''); }
  function ivHtml(L, rt) {
    const f = st.iv; const last = LS.get('ses11.roof');
    if (rt.o && !isDef(O[rt.o]) && SK.bom[rt.o]) f.o = rt.o;
    if (!O[f.o] || isDef(O[f.o]) || !SK.bom[f.o]) f.o = O[last] && !isDef(O[last]) ? last : '1';
    const brs = brigadeList(L); if (!f.br && brs.length) f.br = brs[0];
    if (!brs.includes(f.br)) f.br = brs[0] || '';
    const need = needOf(f.o); const iss = L.roofIss[f.o] || {}; const sk = L.doc[P_STORE] || {};
    const row = c => { const nd = need[c] || 0, is = iss[c] || 0, rem = ivRem(L, f.o, c), oh = sk[c] || 0, v = f.q[c];
      return '<tr id="ivr-' + c + '" data-c="' + c + '"' + (ivIsOver(L, c, num(v)) ? ' class="lim"' : '') + '><td class="nm">' + esc(itemTxt(c)) + ownBadge(c) + '<span class="sub">потреба ' + q2(nd) + ' · видано ' + q2(is) + ' · на складі ' + negq(oh) + ' ' + esc(unitTxt(c)) + '</span><span class="flag" id="ivf-' + c + '">' + ivFlag(L, c) + '</span>' + (isSerial(c) ? serBox('ivs-' + c, f.ser[c]) : '') + '</td><td class="n rem" data-v="' + rem + '">' + q2(rem) + '</td><td class="n">' + qIn('ivq-' + c, v, 'Видати: ' + itemTxt(c)) + '</td></tr>'; };
    const over = ivOver(L).length > 0;
    return '<form class="card skf" id="skf" data-form="iv" autocomplete="off"><div class="card-h"><h2>Видача бригаді</h2><p>ліміт — потреба даху за проєктом мінус уже видане; понад ліміт — лише з причиною</p></div>' +
      '<div class="skrow">' + dateFld('ivD', f.d, 'Дата') + '<div class="fld"><label for="ivO">Дах</label><select id="ivO">' + OBJS26.filter(o => SK.bom[o.id]).map(o => '<option value="' + o.id + '"' + (o.id === f.o ? ' selected' : '') + '>' + esc(objName(o)) + '</option>').join('') + '</select></div>' +
      '<div class="fld grow"><label for="ivBr">Бригада</label>' + (brs.length ? '<select id="ivBr">' + brs.map(b => '<option' + (b === f.br ? ' selected' : '') + '>' + esc(b) + '</option>').join('') + '</select>' : '<p class="hint err" id="ivNoBr">Бригад немає: впишіть бригаду виконавцю в аркуші «Доступи» (колонка «Бригада»).</p>') + '</div></div>' +
      filterSeg() + qtyTable('iv', roofCodes(f.o), row, ['Ще можна', 'Видати']) +
      '<div class="skwhy" id="ivWhyBox"' + (over ? '' : ' hidden') + '><b>Понад ліміт даху або понад наявність на складі — вкажіть причину</b><div class="skrow"><div class="fld"><label for="ivWhy">Причина</label><select id="ivWhy"><option value="">— виберіть —</option>' + ['заміна браку', 'втрата', 'зміна проєкту', 'інше'].map(x => '<option' + (x === f.why ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div><div class="fld grow"><label for="ivReason">Пояснення</label><input type="text" id="ivReason" maxlength="150" value="' + esc(f.reason) + '" placeholder="акт браку, що змінилось у проєкті"></div></div></div>' +
      '<div class="fld"><span class="lab">Підпис бригадира пальцем — необов’язково</span><canvas class="sign" id="ivSign" width="600" height="160" aria-label="Поле для підпису бригадира"></canvas><div><button type="button" class="btn ghost" id="ivSignClr">Очистити підпис</button></div></div>' +
      saveBar('iv', 'Записати видачу', ivSumTxt(L)) + queueHtml() + '</form>';
  }
  function ivUpdate(c) {
    const L = ledger(); const f = st.iv;
    if (c) { const fl = $('ivf-' + c); if (fl) fl.innerHTML = ivFlag(L, c); const tr = $('ivr-' + c); if (tr) tr.classList.toggle('lim', ivIsOver(L, c, num(f.q[c]))); }
    const box = $('ivWhyBox'); if (box) box.hidden = !ivOver(L).length;
    const s = $('ivSum'); if (s) s.innerHTML = ivSumTxt(L);
  }
  function setupSign(cv) {
    const ctx = cv.getContext('2d');
    const clear = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; };
    clear();
    if (st.iv.sign) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0); im.src = st.iv.sign; }
    let on = false;
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', e => { on = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { } const [x, y] = pt(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y + 0.1); ctx.stroke(); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!on) return; const [x, y] = pt(e); ctx.lineTo(x, y); ctx.stroke(); });
    const end = () => { if (!on) return; on = false; st.iv.sign = cv.toDataURL('image/png'); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    const b = $('ivSignClr'); if (b) b.onclick = () => { st.iv.sign = ''; clear(); };
  }

  /* ---- Повернення: бригада → склад; дах — щоб повернути ліміт ---- */
  const rtOver = L => Object.keys(st.rt.q).filter(c => num(st.rt.q[c]) > docAvail(L, brPlace(st.rt.br), c) + 1e-9);
  function rtHtml(L) {
    const f = st.rt; const brs = brigadeList(L); if (!brs.includes(f.br)) f.br = brs[0] || '';
    const m = L.br[f.br] || {}; const codes = Object.keys(m).filter(c => m[c].iss > 0 || Math.abs(brBal(m[c])) > 1e-9).sort(byItem);
    const row = c => '<tr data-c="' + c + '"><td class="nm">' + esc(itemTxt(c)) + ownBadge(c) + '<span class="sub">видано ' + q2(m[c].iss) + ' · вмонтовано ' + q2(m[c].mnt) + ' ' + esc(unitTxt(c)) + '</span>' + (isSerial(c) ? serBox('rts-' + c, f.ser[c]) : '') + '</td><td class="n">' + negq(brBal(m[c])) + '</td><td class="n">' + qIn('rtq-' + c, f.q[c], 'Повернути: ' + itemTxt(c)) + '</td></tr>';
    return '<form class="card skf" id="skf" data-form="rt" autocomplete="off"><div class="card-h"><h2>Повернення на склад</h2><p>від бригади; дах — якщо повернене знову можна видати на нього</p></div>' +
      '<div class="skrow">' + dateFld('rtD', f.d, 'Дата') + '<div class="fld grow"><label for="rtBr">Бригада</label><select id="rtBr">' + (brs.length ? brs.map(b => '<option' + (b === f.br ? ' selected' : '') + '>' + esc(b) + '</option>').join('') : '<option value="">бригад ще немає</option>') + '</select></div>' +
      '<div class="fld"><label for="rtO">Дах (повертає ліміт)</label><select id="rtO"><option value="">не вказано</option>' + OBJS26.filter(o => SK.bom[o.id]).map(o => '<option value="' + o.id + '"' + (o.id === f.o ? ' selected' : '') + '>' + esc(objName(o)) + '</option>').join('') + '</select></div></div>' +
      filterSeg() + (codes.length ? qtyTable('rt', codes, row, ['У бригади', 'Повернути']) : '<div class="empty">У бригади немає виданих матеріалів.</div>') +
      '<div class="skwhy" id="rtWhyBox"' + (rtOver(L).length ? '' : ' hidden') + '><b>Повертається більше, ніж видано за документами — вкажіть причину</b><div class="fld"><label for="rtReason">Причина</label><input type="text" id="rtReason" maxlength="150" value="' + esc(f.reason || '') + '" placeholder="видано до переходу на облік, помилка видачі…"></div></div>' +
      saveBar('rt', 'Записати повернення', 'Позицій: <b>' + Object.keys(f.q).filter(c => num(f.q[c]) > 0).length + '</b>') + queueHtml() + '</form>';
  }

  /* ---- Брак: зі складу або з бригади, з причиною ---- */
  function bkHtml(L) {
    const f = st.bk; const brs = brigadeList(L); const places = [P_STORE].concat(brs.map(brPlace));
    if (!places.includes(f.from)) f.from = P_STORE;
    const bal = L.place[f.from] || {}; const codes = Object.keys(bal).filter(c => bal[c] > 1e-9).sort(byItem);
    const row = c => '<tr data-c="' + c + '"><td class="nm">' + esc(itemTxt(c)) + ownBadge(c) + (isSerial(c) ? serBox('bks-' + c, f.ser[c]) : '') + '</td><td class="n">' + q2(bal[c]) + '</td><td class="n">' + qIn('bkq-' + c, f.q[c], 'Брак: ' + itemTxt(c)) + '</td></tr>';
    return '<form class="card skf" id="skf" data-form="bk" autocomplete="off"><div class="card-h"><h2>Брак і втрата</h2><p>списання з причиною; акт браку — крок 4</p></div>' +
      '<div class="skrow">' + dateFld('bkD', f.d, 'Дата') + '<div class="fld grow"><label for="bkFrom">Звідки</label><select id="bkFrom">' + places.map(p => '<option value="' + esc(p) + '"' + (p === f.from ? ' selected' : '') + '>' + esc(p === P_STORE ? 'Склад' : 'Бригада ' + brName(p)) + '</option>').join('') + '</select></div></div>' +
      '<div class="fld"><label for="bkReason">Причина (обов’язково)</label><input type="text" id="bkReason" maxlength="200" value="' + esc(f.reason) + '" placeholder="тріщина модуля, погнуто при підйомі, втрата…"></div>' +
      filterSeg() + (codes.length ? qtyTable('bk', codes, row, ['Є', 'Брак']) : '<div class="empty">Тут немає матеріалів.</div>') +
      saveBar('bk', 'Записати брак', 'Позицій: <b>' + Object.keys(f.q).filter(c => num(f.q[c]) > 0).length + '</b>') + queueHtml() + '</form>';
  }

  /* ---- Передача на зберігання ГАЛ-КАТ: дахи 10–11, кількості з переліку 08_Склад/…csv ---- */
  function zbHtml(L, rt) {
    const f = st.zb; if (rt.o && isDef(O[rt.o])) f.o = rt.o; if (!O[f.o] || !isDef(O[f.o])) f.o = (DEFR[0] || {}).id;
    if (!f.o) return '<section class="card"><div class="empty">Відкладених дахів немає.</div></section>';
    const plan = SK.storagePlan[f.o] || {}; const kept = L.roofKeep[f.o] || {}; const sk = L.doc[P_STORE] || {};
    if (!f.init[f.o]) { f.init[f.o] = true; const q = f.q[f.o] = {}; for (const c in plan) { const rem = r6(plan[c] - (kept[c] || 0)); if (rem > 0 && !isTray(c) && !isSerial(c)) q[c] = String(rem); } }
    const dq = f.q[f.o] || (f.q[f.o] = {}); const ds = f.ser || (f.ser = {});
    const codes = Object.keys(plan).sort(byItem);
    const row = c => { const rem = r6(Math.max(0, plan[c] - (kept[c] || 0))); const q = num(dq[c]); const oh = sk[c] || 0;
      return '<tr data-c="' + c + '"><td class="nm">' + esc(itemTxt(c)) + ownBadge(c) + '<span class="sub">за переліком ' + q2(plan[c]) + ' · передано ' + q2(kept[c] || 0) + ' · на складі ' + negq(oh) + ' ' + esc(unitTxt(c)) + '</span>' + (isTray(c) ? '<span class="flag warn-t">лотки — лише після рішення щодо трас дахів 1, 3, 4</span>' : '') + '<span class="flag" id="zbf-' + c + '">' + (q > oh + 1e-9 ? '<span class="warn-t">на складі лише ' + q2(oh) + '</span>' : '') + '</span>' + (isSerial(c) ? serBox('zbs-' + c, ds[c]) : '') + '</td><td class="n">' + q2(rem) + '</td><td class="n">' + qIn('zbq-' + c, dq[c], 'Передати: ' + itemTxt(c)) + '</td></tr>'; };
    return '<form class="card skf" id="skf" data-form="zb" autocomplete="off"><div class="card-h"><h2>Передача на зберігання ГАЛ-КАТ</h2><p>відкладені дахи; кількості заповнено з переліку — звірте з фактом</p></div>' +
      '<div class="skrow">' + dateFld('zbD', f.d, 'Дата') + '<div class="fld"><label for="zbO">Дах</label><select id="zbO">' + DEFR.map(o => '<option value="' + o.id + '"' + (o.id === f.o ? ' selected' : '') + '>' + esc(o.name) + ' (' + esc(o.phase) + ')</option>').join('') + '</select></div>' +
      '<div class="fld"><label for="zbAct">Акт №</label><input type="text" id="zbAct" maxlength="60" value="' + esc(f.act) + '" placeholder="номер акта"></div>' +
      '<div class="fld grow"><label for="zbNote">Примітка</label><input type="text" id="zbNote" maxlength="200" value="' + esc(f.note) + '" placeholder="місце зберігання, стан, хто прийняв"></div></div>' +
      filterSeg() + qtyTable('zb', codes, row, ['Ще передати', 'Передати']) +
      '<p class="small muted">Перелік: ' + esc(SK.storageSrc || '') + '. Лотки не передаються, доки немає рішення щодо трас дахів 1, 3, 4. Модулі — лише з серійними номерами. Якщо на складі менше, ніж передаєте, — у примітці вкажіть причину.</p>' +
      saveBar('zb', 'Записати передачу на зберігання', 'Позицій: <b>' + Object.keys(dq).filter(c => num(dq[c]) > 0).length + '</b>') + queueHtml() + '</form>';
  }

  /* ---- Залишки: за місцями, за дахами, за власником ---- */
  function placeCard(id, title, sub, bal, tag) {
    const codes = Object.keys(bal || {}).filter(c => Math.abs(bal[c]) > 1e-9 && filtOk(c)).sort(byItem);
    return '<section class="card place" data-place="' + esc(id) + '"><div class="card-h"><h2>' + title + '</h2><p>' + sub + '</p></div>' + (codes.length ? '<div class="scroll"><table class="stock zal"><thead><tr><th>Позиція</th><th class="n">Кількість</th></tr></thead><tbody>' + codes.map(c => '<tr data-c="' + c + '"><td class="nm">' + esc(itemTxt(c)) + ownBadge(c) + '</td><td class="n bal" data-v="' + bal[c] + '">' + negq(bal[c], bal[c] < 0 ? tag : '') + ' <span class="muted">' + esc(unitTxt(c)) + '</span></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">Порожньо.</div>') + '</section>';
  }
  function brigadeCard(L, b) {
    const m = L.br[b] || {}; const codes = Object.keys(m).filter(c => filtOk(c) && ['iss', 'mnt', 'ret', 'brk', 'inv', 'opn'].some(k => Math.abs(m[c][k]) > 1e-9)).sort(byItem);
    const over = codes.filter(c => brBal(m[c]) < -1e-9).length;
    return '<section class="card place" data-place="' + esc(brPlace(b)) + '"><div class="card-h"><h2>Бригада «' + esc(b) + '»</h2><p>' + (over ? '<b class="neg">перевитрата: ' + over + ' поз.</b> · ' : '') + 'залишок = початковий + видано − вмонтовано − повернуто − брак</p></div>' +
      (codes.length ? '<div class="scroll"><table class="stock zal brt"><thead><tr><th>Позиція</th><th class="n wd">Видано</th><th class="n wd">Вмонт.</th><th class="n wd">Поверн.</th><th class="n wd">Брак</th><th class="n">Залишок</th></tr></thead><tbody>' +
        codes.map(c => { const x = m[c]; const v = brBal(x); return '<tr data-c="' + c + '"' + (v < -1e-9 ? ' class="lim"' : '') + '><td class="nm">' + esc(itemTxt(c)) + ownBadge(c) + '<span class="sub">' + esc(unitTxt(c)) + '<span class="ph"> · видано ' + q2(x.iss) + ' · вмонт. ' + q2(x.mnt) + ' · поверн. ' + q2(x.ret) + ' · брак ' + q2(x.brk) + '</span>' + (x.opn ? ' · початковий залишок ' + q2(x.opn) : '') + (x.inv ? ' · інвентаризація ' + q2(x.inv) : '') + '</span></td><td class="n wd">' + q2(x.iss) + '</td><td class="n wd">' + q2(x.mnt) + '</td><td class="n wd">' + q2(x.ret) + '</td><td class="n wd">' + q2(x.brk) + '</td><td class="n bal" data-v="' + v + '">' + negq(v, 'перевитрата') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">Матеріалів не видавали.</div>') + '</section>';
  }
  function serialCard() {
    const list = st.skSrv.serials.filter(x => filtOk(x.c)); if (!list.length) return '';
    const by = {}; for (const x of list) { const k = x.c + '|' + x.status; by[k] = (by[k] || 0) + 1; }
    const codes = [...new Set(list.map(x => x.c))].sort(byItem); const sts = ['склад', 'бригада', 'вмонтовано', 'зберігання', 'брак'];
    return '<section class="card"><div class="card-h"><h2>Серійні номери</h2><p>модулі й щитки DC за статусом</p></div><div class="scroll"><table class="stock zal"><thead><tr><th>Позиція</th>' + sts.map(s => '<th class="n">' + s + '</th>').join('') + '</tr></thead><tbody>' + codes.map(c => '<tr data-c="' + c + '"><td class="nm">' + esc(itemTxt(c)) + '</td>' + sts.map(s => '<td class="n">' + (by[c + '|' + s] || '<span class="muted">—</span>') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></section>';
  }
  function zalHtml(L) {
    if (role() === 'виконавець') return brigadeCard(L, st.me.brigade || st.me.name) + '<p class="small muted" style="padding:0 4px">Вмонтовано — попередньо, за вашими звітами і специфікаціями виробів. Остаточне списання — після приймання прорабом.</p>';
    const z = st.zal; let s = '<section class="card"><div class="skbar"><div class="periods" role="group" aria-label="Як показати">' + [['place', 'За місцями'], ['roof', 'За дахами'], ['owner', 'За власником']].map(x => '<button type="button" data-skv="' + x[0] + '" aria-pressed="' + (z.v === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' + filterSeg() + '</div>' +
      (contractorVisible() ? '' : '<p class="small ink2" style="margin-top:8px">Показано давальницькі матеріали ГАЛ-КАТ. Залишки матеріалів підрядника приховано налаштуванням проєкту.</p>') + '</section>';
    if (z.v === 'roof') {
      const roofs = OBJS.filter(o => SK.bom[o.id]); if (!roofs.some(o => o.id === z.o)) z.o = roofs[0].id;
      const o = O[z.o]; const need = needOf(o.id); const iss = L.roofIss[o.id] || {}; const mnt = L.mnt[o.id] || {}; const keep = L.roofKeep[o.id] || {}; const dfr = isDef(o);
      const codes = roofCodes(o.id).filter(filtOk);
      s += '<section class="card"><div class="skrow"><div class="fld"><label for="zalO">Дах</label><select id="zalO">' + roofs.map(x => '<option value="' + x.id + '"' + (x.id === o.id ? ' selected' : '') + '>' + esc(objName(x)) + (isDef(x) ? ' (' + esc(x.phase) + ')' : '') + '</option>').join('') + '</select></div></div>' +
        '<div class="scroll"><table class="stock zal"><thead><tr><th>Позиція</th><th class="n">Потреба</th><th class="n">' + (dfr ? 'На зберіганні' : 'Видано') + '</th><th class="n">Вмонт.</th><th class="n">' + (dfr ? 'Ще передати' : 'Ще видати') + '</th></tr></thead><tbody>' +
        codes.map(c => { const got = dfr ? (keep[c] || 0) : (iss[c] || 0); return '<tr data-c="' + c + '"><td class="nm">' + esc(itemTxt(c)) + ownBadge(c) + '<span class="sub">' + esc(unitTxt(c)) + '</span></td><td class="n">' + q2(need[c] || 0) + '</td><td class="n">' + q2(got) + '</td><td class="n">' + q2(mnt[c] || 0) + '</td><td class="n">' + q2(Math.max(0, (need[c] || 0) - got)) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="small muted" style="margin-top:8px">Вмонтовано — попередньо, за звітами монтажників і специфікаціями виробів.</p></section>';
    } else if (z.v === 'owner') {
      const codes = [...new Set(Object.keys(L.rec).concat(...Object.values(L.place).map(Object.keys), ...Object.values(L.mnt).map(Object.keys)))].filter(filtOk).sort(byItem);
      const sum = (c, pred) => Object.keys(L.place).filter(pred).reduce((a, p) => a + ((L.place[p] || {})[c] || 0), 0);
      const mt = c => Object.values(L.mnt).reduce((a, m) => a + (m[c] || 0), 0);
      for (const [g, title] of [[true, 'Давальницькі ГАЛ-КАТ'], [false, 'Матеріали підрядника']]) {
        const list = codes.filter(c => isCust(c) === g); if (!list.length) continue;
        s += '<section class="card place" data-owner="' + (g ? 'ГАЛ-КАТ' : 'підрядник') + '"><div class="card-h"><h2>' + title + '</h2><p>' + (g ? 'для звіту ГАЛ-КАТ: отримано / вмонтовано / залишок / брак' : 'власність підрядника') + '</p></div><div class="scroll"><table class="stock zal"><thead><tr><th>Позиція</th><th class="n">Отримано</th><th class="n">Склад</th><th class="n">Бригади</th><th class="n">Вмонт.</th><th class="n">Зберіг.</th><th class="n">Брак</th></tr></thead><tbody>' +
          list.map(c => '<tr data-c="' + c + '"><td class="nm">' + esc(itemTxt(c)) + '<span class="sub">' + esc(unitTxt(c)) + '</span></td><td class="n">' + q2(L.rec[c] || 0) + '</td><td class="n">' + negq(sum(c, p => p === P_STORE)) + '</td><td class="n">' + negq(sum(c, isBr)) + '</td><td class="n">' + q2(mt(c)) + '</td><td class="n">' + q2(sum(c, p => p === P_KEEP)) + '</td><td class="n">' + q2(sum(c, p => p === P_SCRAP)) + '</td></tr>').join('') + '</tbody></table></div></section>';
      }
      s += serialCard();
    } else {
      s += placeCard(P_STORE, 'Склад', 'мінус — видано більше, ніж оприбутковано', L.place[P_STORE], 'немає надходження');
      for (const b of Object.keys(L.br).sort((a, b) => (a === NOBR) - (b === NOBR) || a.localeCompare(b))) s += brigadeCard(L, b);
      s += placeCard(P_KEEP, 'На зберіганні ГАЛ-КАТ', 'матеріали відкладених дахів 10–11', L.place[P_KEEP]);
      const mt = {}; for (const o in L.mnt) for (const c in L.mnt[o]) mt[c] = r6((mt[c] || 0) + L.mnt[o][c]);
      s += placeCard('вмонтовано', 'Вмонтовано', 'попередньо, за звітами монтажників; по дахах — «За дахами»', mt);
      s += placeCard(P_SCRAP, 'Брак і втрати', 'списано з причиною', L.place[P_SCRAP]);
    }
    if (canStock() || role() === 'замовник') {
      const docs = st.sk.receipts.concat(st.sk.moves).sort((a, b) => (b.d + b.at).localeCompare(a.d + a.at)).slice(0, 40);
      s += '<section class="card"><div class="card-h"><h2>Документи складу</h2><p>останні 40</p></div><div class="iss">' + (docs.length ? docs.map(x => skDocLine(x)).join('') : '<div class="empty">Документів ще немає.</div>') + '</div></section>';
    }
    return s;
  }
  const canDelDoc = x => !!API && !!st.me && !x.pending && (role() === 'адмін' || (role() === 'комірник' && x.by === st.me.name));
  function skDocLine(x, inRoof) {
    const mv = !!x.type; const kind = mv ? 'moves' : 'receipts';
    const head = !mv ? 'Надходження' + (x.doc ? ': ' + esc(x.doc) : '') : x.type === 'видача' ? 'Видача → ' + esc(brName(x.to)) : x.type === 'повернення' ? 'Повернення від ' + esc(brName(x.from)) : x.type === 'брак' ? 'Брак · ' + esc(isBr(x.from) ? brName(x.from) : 'склад') : x.type === 'передача на зберігання' ? 'На зберігання ГАЛ-КАТ' : x.type === 'початкові залишки' ? 'Початкові залишки · ' + esc(placeLabel(x.from)) : 'Інвентаризація · ' + esc(x.from);
    const roof = mv && x.o && O[x.o] && !inRoof ? ' · ' + esc(objName(O[x.o])) : '';
    const lines = x.lines.map(l => esc(itemTxt(l.c)) + ' — <b class="num">' + q2(l.q) + '</b>' + (l.serials && l.serials.length ? ' <span class="muted">(сер. № ' + l.serials.length + ')</span>' : '')).join('; ');
    return '<div class="it"><span class="dt">' + dLabel(x.d) + '</span><span class="what"><b>' + head + '</b>' + roof + (x.act ? ' · акт ' + esc(x.act) : '') + ': ' + lines + (x.reason ? ' <span class="muted">· ' + esc(x.reason) + '</span>' : '') + (x.sign ? ' <a href="' + esc(x.sign) + '" target="_blank" rel="noopener">підпис ↗</a>' : '') + (x.photo ? ' <a href="' + esc(x.photo) + '" target="_blank" rel="noopener">накладна ↗</a>' : '') + ' <span class="muted">· ' + esc(x.by) + '</span>' + pendTag(x) + '</span>' +
      (x.pending ? '<button class="btn ghost del" type="button" data-unq="' + esc(x.cid) + '">' + (st.delArm === x.cid ? 'Скасувати?' : 'Скасувати') + '</button>' : canDelDoc(x) ? '<button class="btn ghost del" type="button" data-del="' + esc(x.id) + '" data-kind="' + kind + '">' + (st.delArm === x.id ? 'Видалити?' : 'Видалити') + '</button>' : '') + '</div>';
  }

  /* ---- події вкладки «Склад» (один набір слухачів на #view) ---- */
  const skOn = () => route().r === 'sk';
  function skSet(path) { try { history.replaceState(null, '', '#/sklad/' + path); } catch (e) { } render(); }
  view.addEventListener('input', e => {
    if (!skOn()) return; const id = e.target.id || ''; const v = e.target.value; let m;
    if (id === 'rcD') st.rc.d = v || today(); else if (id === 'rcDoc') st.rc.doc = v; else if (id === 'opD') st.op.d = v || today();
    else if ((m = /^(rc|op)Q$/.exec(id))) st[m[1]].q = v;
    else if ((m = /^(rc|op)Ser$/.exec(id))) { st[m[1]].ser = v; const n = $(m[1] + 'SerN'); if (n) n.innerHTML = serHint(v); }
    else if (id === 'ivD') st.iv.d = v || today(); else if (id === 'ivReason') st.iv.reason = v; else if (id === 'rtReason') st.rt.reason = v;
    else if ((m = /^iv([qs])-(.+)$/.exec(id))) { (m[1] === 'q' ? st.iv.q : st.iv.ser)[m[2]] = v; ivUpdate(m[2]); }
    else if (id === 'rtD') st.rt.d = v || today(); else if ((m = /^rt([qs])-(.+)$/.exec(id))) { (m[1] === 'q' ? st.rt.q : st.rt.ser)[m[2]] = v; const bx = $('rtWhyBox'); if (bx) bx.hidden = !rtOver(ledger()).length; }
    else if (id === 'bkD') st.bk.d = v || today(); else if (id === 'bkReason') st.bk.reason = v; else if ((m = /^bk([qs])-(.+)$/.exec(id))) (m[1] === 'q' ? st.bk.q : st.bk.ser)[m[2]] = v;
    else if (id === 'zbD') st.zb.d = v || today(); else if (id === 'zbAct') st.zb.act = v; else if (id === 'zbNote') st.zb.note = v;
    else if ((m = /^zb([qs])-(.+)$/.exec(id))) { if (m[1] === 'q') { st.zb.q[st.zb.o][m[2]] = v; const oh = docAvail(ledger(), P_STORE, m[2]); const fl = $('zbf-' + m[2]); if (fl) fl.innerHTML = num(v) > oh + 1e-9 ? '<span class="warn-t">на складі лише ' + q2(oh) + '</span>' : ''; } else st.zb.ser[m[2]] = v; }
    const sum = { rt: () => Object.keys(st.rt.q).filter(c => num(st.rt.q[c]) > 0).length, bk: () => Object.keys(st.bk.q).filter(c => num(st.bk.q[c]) > 0).length, zb: () => Object.keys(st.zb.q[st.zb.o] || {}).filter(c => num(st.zb.q[st.zb.o][c]) > 0).length }[id.slice(0, 2)];
    if (sum) { const el = $(id.slice(0, 2) + 'Sum'); if (el) el.innerHTML = 'Позицій: <b>' + sum() + '</b>'; }
  });
  view.addEventListener('change', e => {
    if (!skOn()) return; const id = e.target.id || ''; const v = e.target.value;
    const mi = /^(rc|op)Item$/.exec(id);
    if (mi) { const f = st[mi[1]]; f.pick = v; f.q = ''; f.ser = ''; render(); const n = $(mi[1] + 'Ser') || $(mi[1] + 'Q'); if (n) n.focus(); }
    else if (id === 'opPlace') { st.op.place = v; render(); }
    else if (id === 'ivO') { st.iv.o = v; st.iv.q = {}; st.iv.ser = {}; skSet('vyd/' + v); }
    else if (id === 'ivBr') { st.iv.br = v; render(); }
    else if (id === 'ivWhy') st.iv.why = v;
    else if (id === 'rtBr') { st.rt.br = v; st.rt.q = {}; st.rt.ser = {}; render(); }
    else if (id === 'rtO') st.rt.o = v;
    else if (id === 'bkFrom') { st.bk.from = v; st.bk.q = {}; st.bk.ser = {}; render(); }
    else if (id === 'zbO') { st.zb.o = v; skSet('zber/' + v); }
    else if (id === 'zalO') { st.zal.o = v; render(); }
  });
  view.addEventListener('click', e => {
    if (!skOn()) return; const t = e.target;
    const f = t.closest('[data-skf]'); if (f) { st.skf = f.dataset.skf; render(); return; }
    const v = t.closest('[data-skv]'); if (v) { st.zal.v = v.dataset.skv; render(); return; }
    const ad = t.closest('[data-lnadd]'); if (ad) { lineAdd(ad.dataset.lnadd); return; }
    const rm = t.closest('[data-lnrm]'); if (rm) { const [k, i] = rm.dataset.lnrm.split(':'); st[k].lines.splice(Number(i), 1); render(); return; }
    const ph = t.closest('[data-rcph]'); if (ph) { st.rc.photos.splice(Number(ph.dataset.rcph), 1); render(); }
  });
  view.addEventListener('change', async e => {
    if (!skOn() || e.target.id !== 'rcFiles') return;
    const files = [...e.target.files]; e.target.value = '';
    for (const fl of files) { if (st.rc.photos.length >= 4) { toast('Не більше 4 фото накладної'); break; } try { st.rc.photos.push(await compress(fl)); } catch (err) { toast('Це фото не вдалося відкрити: ' + fl.name); } }
    render();
  });
  /* рядки документа з чернетки: {код: кількість}, {код: серійні} → [{c, q, name, unit, owner, serials, over}] або текст помилки */
  function draftLines(q, ser, over) {
    const out = [];
    for (const c of Object.keys(q).sort(byItem)) {
      const v = num(q[c]); if (!(v > 0)) continue;
      const s = serList(ser[c]); const bad = s.filter(x => !SER_RE.test(x));
      if (bad.length) return 'Перевірте серійні номери: ' + bad.slice(0, 3).join(', ');
      if (isSerial(c) ? s.length !== v : s.length) return itemTxt(c) + (isSerial(c) ? ': потрібні серійні номери — ' + s.length + ' з ' + q2(v) + '.' : ': серійні номери лише для модулів і щитків.');
      out.push({ c, q: r6(v), name: itemTxt(c), unit: unitTxt(c), owner: ownerTxt(c), serials: s, over: !!(over && over(c, v)) });
    }
    return out.length ? out : 'Вкажіть кількість хоча б по одній позиції.';
  }
  view.addEventListener('submit', async e => {
    if (!skOn()) return; const form = e.target.closest('#skf'); if (!form) return;
    e.preventDefault(); if (st.busy) return;
    const h = $('skHint'); const err = t => { h.className = 'hint err'; h.textContent = t; };
    const kind = form.dataset.form; let body, msg, reset;
    if (kind === 'rc') {
      const f = st.rc; if (!f.lines.length) return err('Додайте хоча б одну позицію в документ.');
      body = { d: f.d, doc: f.doc.trim(), lines: docLines(f), photos: f.photos.map(p => ({ b64: p.b64, mime: p.mime })) };
      msg = 'Надходження збережено'; reset = () => { st.rc = { d: f.d, doc: '', pick: '', q: '', ser: '', lines: [], photos: [] }; };
    } else if (kind === 'iv') {
      const f = st.iv; const L = ledger(); const br = String(f.br || '').trim();
      if (!br || !brigadeList(L).includes(br)) return err('Виберіть бригаду зі списку.');
      const lines = draftLines(f.q, f.ser, (c, v) => ivIsOver(L, c, v)); if (typeof lines === 'string') return err(lines);
      let reason = '';
      if (lines.some(l => l.over)) { if (!f.why) return err('Видача понад ліміт даху або наявність: виберіть причину.'); if (f.why === 'інше' && !f.reason.trim()) return err('Поясніть причину видачі понад ліміт.'); reason = f.why + (f.reason.trim() ? ': ' + f.reason.trim() : ''); }
      body = { type: 'видача', d: f.d, from: P_STORE, to: brPlace(br), o: f.o, lines, reason };
      if (f.sign) body.sign = { b64: f.sign.split(',')[1] };
      msg = 'Видачу бригаді «' + br + '» збережено'; reset = () => { f.q = {}; f.ser = {}; f.why = ''; f.reason = ''; f.sign = ''; };
    } else if (kind === 'rt') {
      const f = st.rt; const L = ledger(); if (!f.br) return err('Виберіть бригаду.');
      const lines = draftLines(f.q, f.ser, (c, v) => v > docAvail(L, brPlace(f.br), c) + 1e-9); if (typeof lines === 'string') return err(lines);
      if (lines.some(l => l.over) && !String(f.reason || '').trim()) return err('Повертається більше, ніж видано: вкажіть причину.');
      body = { type: 'повернення', d: f.d, from: brPlace(f.br), to: P_STORE, o: f.o, lines, reason: String(f.reason || '').trim() };
      msg = 'Повернення збережено'; reset = () => { f.q = {}; f.ser = {}; f.reason = ''; };
    } else if (kind === 'bk') {
      const f = st.bk; if (!f.reason.trim()) return err('Вкажіть причину браку.');
      const lines = draftLines(f.q, f.ser); if (typeof lines === 'string') return err(lines);
      body = { type: 'брак', d: f.d, from: f.from, to: P_SCRAP, lines, reason: f.reason.trim() };
      msg = 'Брак записано'; reset = () => { f.q = {}; f.ser = {}; f.reason = ''; };
    } else if (kind === 'zb') {
      const f = st.zb; const L = ledger(); const lines = draftLines(f.q[f.o] || {}, f.ser || {}, (c, v) => v > docAvail(L, P_STORE, c) + 1e-9); if (typeof lines === 'string') return err(lines);
      if (lines.some(l => l.over) && !f.note.trim()) return err('На складі менше, ніж передаєте: у примітці вкажіть причину.');
      body = { type: 'передача на зберігання', d: f.d, from: P_STORE, to: P_KEEP, o: f.o, act: f.act.trim(), reason: f.note.trim(), lines };
      msg = 'Передачу на зберігання збережено'; reset = () => { f.q[f.o] = {}; f.ser = {}; f.act = ''; f.note = ''; };
    } else if (kind === 'op') {
      const f = st.op; if (!f.lines.length) return err('Додайте хоча б одну позицію.');
      body = { type: 'початкові залишки', d: f.d || today(), from: f.place, lines: docLines(f) };
      msg = 'Початкові залишки записано'; reset = () => { f.lines = []; f.pick = ''; f.q = ''; f.ser = ''; };
    } else return;
    st.busy = true; const b = form.querySelector('button[type=submit]'); if (b) b.disabled = true; h.className = 'hint'; h.textContent = 'Зберігаю…';
    try {
      await enqueue(kind === 'rc' ? 'receipt' : 'move', body); reset();
      toast(msg + (navigator.onLine === false ? '. Немає зв’язку — надішлю, щойно з’явиться.' : '. Надсилаю…'));
      st.busy = false; render(); window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); flush();
    } catch (x) { err('Не вдалося зберегти на телефоні: ' + String(x && x.message || x)); }
    finally { st.busy = false; const bb = $(kind + 'Save'); if (bb) bb.disabled = false; }
  });
  function bindSk() {
    const cv = $('ivSign'); if (cv) setupSign(cv);
    const ql = $('qlist'); if (ql) ql.addEventListener('toggle', () => { st.open.queue = ql.open; });
  }

  /* ---- history & periods ---- */
  const isoWeekStart = s => { const d = parseD(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return ymd(d); };
  function periodKey(s, p) { return p === 'd' ? s : p === 'w' ? isoWeekStart(s) : s.slice(0, 7); }
  function periodRange(k, p) { if (p === 'd') return [k, k]; if (p === 'w') return [k, addDays(k, 6)]; const [y, m] = k.split('-').map(Number); const last = new Date(y, m, 0).getDate(); return [k + '-01', k + '-' + z2(last)]; }
  function periodLabel(k, p) { if (p === 'd') return WD[parseD(k).getDay()] + ' ' + dShort(k); if (p === 'w') { const e = addDays(k, 6); return dShort(k) + '–' + dShort(e); } const [y, m] = k.split('-').map(Number); return MONN[m - 1] + ' ' + y; }
  const ACT_COLS = ['ballast', 'tri', 'rails', 'pv', 'strings', 'test'];
  function periodRows(oid, p) {
    const reps = st.data.reports.filter(r => !oid || r.o === oid);
    const keys = [...new Set(reps.map(r => periodKey(r.d, p)))].sort().reverse();
    const objs = oid ? [O[oid]] : OBJS26;
    return keys.map(k => {
      const [a, b] = periodRange(k, p); const rs = reps.filter(r => r.d >= a && r.d <= b);
      const sums = {}; for (const r of rs) for (const w in r.items) sums[w] = (sums[w] || 0) + r.items[w];
      const g = (sumPct(agg(b), objs) || 0) - (sumPct(agg(addDays(a, -1)), objs) || 0);
      return { k, a, b, rs, sums, gain: g, crane: rs.reduce((x, r) => x + r.crane, 0), photos: rs.reduce((x, r) => x + r.photos, 0), days: new Set(rs.map(r => r.d)).size };
    });
  }
  function periodTable(oid, rows) {
    const p = st.period;
    let s = '<div class="scroll"><table class="ptable"><thead><tr><th>' + (p === 'd' ? 'День' : p === 'w' ? 'Тиждень' : 'Місяць') + '</th><th class="n">Приріст</th>' + ACT_COLS.map(w => '<th class="n">' + esc(W[w].short) + '</th>').join('') + '<th class="n">Кран, маш.-год</th><th class="n">Фото</th><th class="n">Звітів</th></tr></thead><tbody>';
    if (!rows.length) s += '<tr><td colspan="' + (ACT_COLS.length + 5) + '" class="muted">Звітів ще немає.</td></tr>';
    for (const r of rows) s += '<tr class="click' + (st.psel === r.k ? ' sel' : '') + '" data-pk="' + r.k + '"><td>' + periodLabel(r.k, p) + (p !== 'd' ? ' <span class="muted">· ' + r.days + ' дн.</span>' : '') + '</td><td class="n"><b>' + dpct(r.gain) + '</b></td>' + ACT_COLS.map(w => '<td class="n">' + (r.sums[w] ? fmt(r.sums[w], 1) : '<span class="muted">—</span>') + '</td>').join('') + '<td class="n">' + (r.crane ? fmt(r.crane, 1) : '—') + '</td><td class="n">' + (r.photos || '—') + '</td><td class="n">' + r.rs.length + '</td></tr>';
    return s + '</tbody></table></div>';
  }
  function recordsHtml(rs) {
    if (!rs.length) return '<div class="empty">Записів за цей період немає.</div>';
    const byDay = {}; for (const r of rs) (byDay[r.d] = byDay[r.d] || []).push(r);
    let s = '';
    for (const d of Object.keys(byDay).sort().reverse()) {
      const w = st.wx && st.wx[d];
      s += '<div class="dayhead"><h3>' + longDate(d) + '</h3><div class="dayfacts">' + (w ? '<span>' + esc(WXT(w.code)) + ', ' + fmt(w.tmin) + '…' + fmt(w.tmax) + ' °C, опади ' + fmt(w.rain, 1) + ' мм, пориви ' + fmt(w.gust) + ' м/с</span><span>світловий день ' + durTxt(w.light) + '</span>' : '') + '</div></div>';
      for (const r of byDay[d].sort((a, b) => a.at.localeCompare(b.at))) {
        const o = O[r.o]; const lifted = ((r.items.lift_bal || 0) * D.meta.ballastKg + (r.items.lift_pv || 0) * D.meta.moduleKg) / 1000;
        s += '<div class="dobj"><h4>' + objName(o) + '<span>' + esc(r.by) + (r.at ? ' · ' + esc(r.at.slice(11, 16)) : '') + '</span></h4><div class="dlist">' + Object.keys(r.items).map(w => '<span class="dpill">' + esc(wshort(o, w)) + ' <b>' + (r.items[w] > 0 ? '+' : '') + fmt(r.items[w], 2) + '</b> ' + esc(unitOf(o, w)) + '</span>').join('') + (r.crane ? '<span class="dpill">Кран <b>' + fmt(r.crane, 1) + '</b> маш.-год' + (lifted ? ' · ≈' + fmt(lifted, 1) + ' т' : '') + '</span>' : '') + '</div><div class="drep">' + (r.n ? '<span class="nt">' + esc(r.n) + '</span>' : '') + (r.photo ? '<a href="' + esc(r.photo) + '" target="_blank" rel="noopener">Фото: ' + r.photos + ' ↗</a>' : r.photos ? '<span class="muted">фото: ' + r.photos + '</span>' : '<span class="muted">без фото</span>') + pendTag(r) + (canDel('reports', r) ? '<button class="btn ghost del" type="button" data-del="' + esc(r.id) + '" data-kind="reports">' + (st.delArm === r.id ? 'Видалити звіт?' : 'Видалити') + '</button>' : '') + '</div></div>';
      }
    }
    return s;
  }
  function periodSwitch() { return '<div class="periods" role="group" aria-label="Період">' + [['d', 'Дні'], ['w', 'Тижні'], ['m', 'Місяці']].map(x => '<button type="button" data-per="' + x[0] + '" aria-pressed="' + (st.period === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'; }
  function histHtml(o) {
    const rows = periodRows(o.id, st.period); if (st.psel && !rows.some(r => r.k === st.psel)) st.psel = null; if (!st.psel && rows[0]) st.psel = rows[0].k;
    const sel = rows.find(r => r.k === st.psel);
    return '<section class="card"><div class="card-h"><h2>Історія ' + o.name.replace('Дах', 'даху') + '</h2>' + periodSwitch() + '</div>' + periodTable(o.id, rows) + '</section><section class="card" id="records"><div class="card-h"><h2>' + (sel ? 'Записи: ' + periodLabel(sel.k, st.period) : 'Записи') + '</h2></div>' + recordsHtml(sel ? sel.rs : []) + '</section>';
  }
  function bindRoof(rt) {
    const o = O[rt.o];
    if ($('rep')) bindReport(o);
    bindSpec(o);
  }
  /* one delegated set of listeners on the persistent #view container */
  view.addEventListener('click', e => {
    const del = e.target.closest('[data-del]'); if (del) { onDelete(del); return; }
    const unq = e.target.closest('[data-unq]'); if (unq) { onUnqueue(unq); return; }
    const rty = e.target.closest('[data-retry]'); if (rty) { onRetry(rty); return; }
    const per = e.target.closest('[data-per]'); if (per) { st.period = per.dataset.per; st.psel = null; render(); return; }
    const pk = e.target.closest('[data-pk]'); if (pk) { st.psel = pk.dataset.pk; render(); const rec = $('records'); if (rec && pk.tagName !== 'path') rec.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); return; }
    const z = e.target.closest('[data-z]'); if (z) { const img = $('img-' + z.dataset.z); if (img) img.style.width = (Number(z.dataset.k) * 100) + '%'; return; }
  });
  view.addEventListener('input', e => {
    const rt = route(); if (rt.r !== 'roof') return; const o = O[rt.o]; const id = e.target.id || '';
    const mm = /^sk-(.+)$/.exec(id);
    if (mm) { (st.sDraft[o.id] || (st.sDraft[o.id] = {}))[mm[1]] = e.target.value; const el = $('sSum'); if (el) el.innerHTML = 'Позицій до видачі: <b>' + Object.keys(stockItems(o)).length + '</b>'; }
    else if (id === 'sDate') st.sDate = e.target.value || today();
    else if (id === 'sNote') st.sNote = e.target.value;
    else if (id === 'sAct') st.sAct = e.target.value;
  });

  /* ---------------- analytics ---------------- */
  function planFactSvg() {
    const s = S(); if (!s.day1) return '<div class="empty">Щоб побачити план-графік, адміністратор вказує «День 1» (перший робочий день за договором) в аркуші «Налаштування» таблиці.</div>';
    const nNow = workIndex(today()); const N = Math.max(s.days, nNow, 10);
    const host = 900, H = 260, ml = 40, mr = 16, mt = 12, mb = 30; const Wd = host;
    const x = n => ml + n / N * (Wd - ml - mr); const y = p => mt + (1 - p) * (H - mt - mb);
    let svg = '<svg viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="План-графік договору проти факту">';
    for (let i = 0; i <= 4; i++) { const v = i / 4; svg += '<line class="gl" x1="' + ml + '" x2="' + (Wd - mr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="tk" x="' + (ml - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (v * 100) + '</text>'; }
    for (let n = 0; n <= N; n += 10) svg += '<text class="tk" x="' + x(n) + '" y="' + (H - 8) + '" text-anchor="middle">' + n + '</text>';
    let pl = ''; for (let n = 0; n <= N; n++) pl += (n ? 'L' : 'M') + x(n).toFixed(1) + ' ' + y(planFrac(n)).toFixed(1);
    svg += '<path class="plan" d="' + pl + '"/>';
    let fl = ''; const pts = [];
    for (let n = 1; n <= nNow; n++) { const d = dateOfWork(n); if (!d) break; const f = sumPct(agg(d), OBJS26, null, isContr) || 0; pts.push([n, f]); fl += (fl ? 'L' : 'M') + x(n).toFixed(1) + ' ' + y(f).toFixed(1); }
    if (fl) svg += '<path class="fact" d="' + fl + '"/>';
    if (nNow > 0) svg += '<line class="today" x1="' + x(nNow) + '" x2="' + x(nNow) + '" y1="' + mt + '" y2="' + y(0) + '"/><text class="tk" x="' + x(nNow) + '" y="' + (mt + 10) + '" text-anchor="start" dx="4">сьогодні</text>';
    if (pts.length) { const l = pts[pts.length - 1]; svg += '<circle cx="' + x(l[0]) + '" cy="' + y(l[1]) + '" r="4.5" fill="var(--s4)" stroke="var(--panel)" stroke-width="2"/>'; }
    svg += '</svg>';
    return '<div class="lg"><span><i style="background:var(--muted)"></i>план за Додатком №2</span><span><i style="background:var(--s4)"></i>факт підрядника</span></div><div class="chart">' + svg + '</div>';
  }
  function gainBars(rows) {
    const list = rows.slice(0, 14).reverse(); if (!list.length) return '';
    const Wd = 900, H = 200, ml = 40, mr = 10, mt = 10, mb = 28; const mx = Math.max(0.01, ...list.map(r => r.gain));
    const bw = Math.min(28, (Wd - ml - mr) / list.length * 0.6); const step = (Wd - ml - mr) / list.length;
    const y = v => mt + (1 - v / mx) * (H - mt - mb);
    let s = '<svg viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="Приріст готовності за період">';
    for (let i = 0; i <= 3; i++) { const v = mx * i / 3; s += '<line class="gl" x1="' + ml + '" x2="' + (Wd - mr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="tk" x="' + (ml - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmt(v * 100, 1) + '</text>'; }
    list.forEach((r, i) => { const cx = ml + step * i + step / 2; const v = Math.max(0, r.gain); const yy = y(v); s += '<path class="bar" data-pk="' + r.k + '" d="M' + (cx - bw / 2) + ' ' + y(0) + ' V' + (yy + 4) + ' Q' + (cx - bw / 2) + ' ' + yy + ' ' + (cx - bw / 2 + 4) + ' ' + yy + ' H' + (cx + bw / 2 - 4) + ' Q' + (cx + bw / 2) + ' ' + yy + ' ' + (cx + bw / 2) + ' ' + (yy + 4) + ' V' + y(0) + ' Z"><title>' + periodLabel(r.k, st.period) + ': ' + dpct(r.gain) + '</title></path><text class="tk" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + (st.period === 'm' ? periodLabel(r.k, 'm').slice(0, 3) : dShort(r.k)) + '</text>'; });
    s += '<line class="ax" x1="' + ml + '" x2="' + (Wd - mr) + '" y1="' + y(0) + '" y2="' + y(0) + '"/></svg>';
    return '<div class="chart">' + s + '</div>';
  }
  function forecast() {
    const m = agg(); const dates = [...new Set(st.data.reports.map(r => r.d))].sort();
    const deltas = []; let prev = 0; for (const d of dates) { const e = earned(agg(d), OBJS26, isContr); deltas.push(e - prev); prev = e; }
    const recent = deltas.slice(-10).filter(h => h > 0); const pace = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const total = totalH(OBJS26, isContr); const remain = Math.max(0, total - earned(m, OBJS26, isContr));
    let fin = null, wdays = 0, rainSkip = 0;
    if (pace > 0 && remain > 0 && recent.length >= 3) {
      let left = remain; let d = today();
      for (let i = 0; i < 900 && left > 1e-6; i++) { d = addDays(d, 1); if (!isWork(d)) continue; const w = st.wx && st.wx[d]; if (w && roofFlag(w).k === 'bad') { rainSkip++; continue; } const light = w ? w.light : 9; left -= pace * Math.min(1, Math.max(0.3, (light - 1) / 8)); wdays++; }
      fin = left <= 1e-6 ? d : null;
    }
    return { pace, total, remain, fin, wdays, rainSkip, n: recent.length };
  }
  function paceTable() {
    const acts = ['ballast', 'tri', 'rails', 'pv', 'tray', 'strings', 'test']; const stat = {};
    for (const r of st.data.reports) { const o = O[r.o]; if (o.id === 'S') continue; for (const w in r.items) { if (!acts.includes(w) || r.items[w] <= 0) continue; const k = o.cls + '|' + w; const x = stat[k] = stat[k] || { sum: 0, days: new Set() }; x.sum += r.items[w]; x.days.add(r.d); } }
    let s = '<div class="scroll"><table class="pace"><thead><tr><th>Дія</th>' + CLS.map(c => '<th class="n">' + esc(c.name) + '<br><span class="muted" style="font-weight:400">дахи ' + c.roofs + '</span></th>').join('') + '</tr></thead><tbody>';
    for (const w of acts) { s += '<tr><td>' + esc(W[w].short) + ', ' + esc(W[w].unit) + '/день</td>'; for (const c of CLS) { const has = ROOFS26.some(o => o.cls === c.id && o.plan[w]); const x = stat[c.id + '|' + w]; s += '<td class="n">' + (!has ? '<span class="muted">—</span>' : x ? fmt(x.sum / x.days.size, 1) + ' <span class="muted">· ' + x.days.size + ' дн.</span>' : '<span class="muted">немає даних</span>') + '</td>'; } s += '</tr>'; }
    return s + '</tbody></table></div>';
  }
  function analyticsHtml() {
    const m = agg(); const cs = contractStatus(m); const f = forecast(); const s = S();
    const rows = periodRows(null, st.period); if (st.psel && !rows.some(r => r.k === st.psel)) st.psel = null; if (!st.psel && rows[0]) st.psel = rows[0].k; const sel = rows.find(r => r.k === st.psel);
    const k = [
      ['Підрядник: факт', pctTxt(cs.fact), cs.has ? 'план на сьогодні ' + pctTxt(cs.plan) : 'план — після «День 1»'],
      ['Робочий день', cs.has ? fmt(cs.n) + ' з ' + s.days : '—', cs.has ? 'День 1: ' + dLabel(s.day1) + (cs.end ? ' · здача ' + dLabel(cs.end) : '') : 'не вказано в таблиці'],
      ['Темп', f.pace ? fmt(f.pace, 1) + ' люд-год/день' : '—', f.n ? 'середнє за ' + f.n + ' дн. зі звітами' : 'потрібно 3 дні зі звітами'],
      ['Прогноз завершення', f.fin ? dLabel(f.fin) : '—', f.fin ? 'ще ' + f.wdays + ' роб. дн.' + (f.rainSkip ? ', дощових пропущено ' + f.rainSkip : '') : 'з’явиться після 3 днів зі звітами']
    ];
    let mtx = '<div class="scroll"><table class="matrix"><thead><tr><th>Об’єкт</th>' + ROOF_G.map(g => '<th>' + GNAME[g] + '</th>').join('') + '<th>Разом, %</th></tr></thead><tbody>';
    for (const o of ROOFS26) { mtx += '<tr><th><a href="#/d/' + o.id + '" style="color:inherit;text-decoration:none"><span class="nm">' + o.name + '</span></a></th>'; for (const g of ROOF_G) { const has = worksOf(o).some(w => W[w].g === g); mtx += '<td>' + cellHtml(has ? sumPct(m, [o], [g]) : null) + '</td>'; } mtx += '<td>' + cellHtml(sumPct(m, [o]), ' tot') + '</td></tr>'; }
    mtx += '<tr class="sum"><th><a href="#/d/S" style="color:inherit;text-decoration:none"><span class="nm">Загальна частина</span></a></th><td colspan="' + ROOF_G.length + '"><span class="small muted" style="padding-left:8px">виконавець ' + pctTxt(sumPct(m, [O.S], null, isContr)) + ' · замовник ' + pctTxt(sumPct(m, [O.S], null, (o, w) => W[w].who === 'z')) + '</span></td><td>' + cellHtml(sumPct(m, [O.S]), ' tot') + '</td></tr>' + (DEFR.length ? '<tr class="dfr-row"><th><span class="nm">Дахи ' + DEFR.map(o => o.id).join('–') + '</span></th><td colspan="' + (ROOF_G.length + 1) + '"><span class="small muted" style="padding-left:8px">відкладено на ' + esc(defSum().year) + ' — у шахматку, графік і прогноз не входять</span></td></tr>' : '') + '</tbody></table></div>';
    return '<section class="card"><div class="kpis">' + k.map(t => '<div class="tile"><div class="lbl">' + t[0] + '</div><div class="val num">' + t[1] + '</div><div class="of">' + t[2] + '</div></div>').join('') + '</div><p class="small ink2">' + esc(D.meta.contract) + '. Роботи замовника (бетон, установка BESS, AC-кабелі, РП) і EMS (етап 2) у план підрядника не входять.</p><p class="small ink2" style="margin-top:6px">Обсяг 2026 — дахи ' + ROOFS26.map(o => o.id).join(', ') + ' і загальна частина: ' + fmt(ROOFS26.reduce((a, o) => a + o.modules, 0)) + ' модулів = 100 %' + (D.meta.contractModules ? ' (Додаток №3 — ' + fmt(D.meta.contractModules) + ')' : '') + '. ' + (DEFR.length ? esc(defSum().txt) + ' — окремо.' : '') + '</p></section>' +
      '<section class="card"><div class="card-h"><h2>План-графік договору і факт</h2><p>Відсоток робіт підрядника за робочими днями</p></div>' + planFactSvg() + '</section>' +
      '<section class="card"><div class="card-h"><h2>Виконано за період</h2>' + periodSwitch() + '</div>' + gainBars(rows) + periodTable(null, rows) + '</section>' +
      '<section class="card" id="records"><div class="card-h"><h2>' + (sel ? 'Записи: ' + periodLabel(sel.k, st.period) : 'Записи') + '</h2></div>' + recordsHtml(sel ? sel.rs : []) + '</section>' +
      '<section class="card"><div class="card-h"><h2>Шахматка: дах × етап</h2></div>' + mtx + '</section>' +
      '<section class="card"><div class="card-h"><h2>Темп за складністю даху</h2><p>Середній обсяг за день, коли дію звітували на дахах групи</p></div>' + paceTable() + '</section>';
  }
  function bindAnalytics() { }

  /* ---------------- weather page ---------------- */
  function weatherHtml() {
    if (!st.wx) { loadWeather().then(() => { if (route().r === 'wx') render(); }); return '<section class="card"><div class="empty">' + (st.wxErr || 'Завантажую прогноз…') + '</div></section>'; }
    const t = today(); const s = S(); let rows = '';
    for (let i = -3; i < 16; i++) {
      const d = addDays(t, i); const w = st.wx[d]; if (!w) continue; const rf = roofFlag(w); const cf = craneFlag(w); const past = d < t;
      rows += '<tr' + (!isWork(d) ? ' class="we"' : '') + '><td><b>' + WD[parseD(d).getDay()] + '</b> ' + dShort(d) + (d === t ? ' <span class="muted">сьогодні</span>' : past ? ' <span class="muted">минуло</span>' : '') + '</td><td>' + esc(WXT(w.code)) + '</td><td class="n">' + fmt(w.tmin) + '…' + fmt(w.tmax) + ' °C</td><td class="n">' + (w.pop != null ? fmt(w.pop) + ' %' : '—') + ' · ' + fmt(w.rain, 1) + ' мм</td><td class="n">' + fmt(w.wind, 1) + ' / <b>' + fmt(w.gust, 1) + '</b> м/с</td><td class="hide-s"><span class="num">' + durTxt(w.light) + '</span> <span class="muted">' + hm(w.rise) + '–' + hm(w.set) + '</span></td><td><span class="badge ' + rf.k + '">' + rf.t + '</span></td><td><span class="badge ' + cf.k + '">' + cf.t + '</span></td></tr>';
    }
    return '<section class="card"><div class="card-h"><h2>Погода на площадці на 16 днів</h2><p>Open-Meteo, координати площадки · оновлюється кожні 3 години</p></div><div class="scroll"><table class="wx"><thead><tr><th>День</th><th>Небо</th><th class="n">Температура</th><th class="n">Дощ</th><th class="n">Вітер / пориви</th><th class="hide-s">Світловий день</th><th>Роботи на даху</th><th>Кран, модулі</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="small ink2" style="margin-top:10px">Дощовий день — ймовірність від ' + s.rain + ' % або опади від 3 мм. Кран і модулі під ризиком — пориви від ' + s.gust + ' м/с, заборона — від ' + (s.gust + 3) + ' м/с. Нижче +5 °C вантажні роботи не рекомендовані (п. 9.3 пояснювальної записки ОС-108). Пороги змінюються в аркуші «Налаштування».</p></section>';
  }

  /* ---------------- method page ---------------- */
  function methodHtml() {
    const rows = []; for (const g of [...ROOF_G, ...S_G]) for (const wk of D.works.filter(w => w.g === g)) { const objs = OBJS26.filter(o => o.plan[wk.id]); const q = objs.reduce((a, o) => a + planQ(o, wk.id), 0); const h = objs.reduce((a, o) => a + hrs(o, wk.id), 0); rows.push([g, wk, q, h]); }
    const total = totalH(); let tb = ''; let g0 = '';
    for (const [g, wk, q, h] of rows) { if (g !== g0) { g0 = g; tb += '<tr class="grp"><td colspan="5">' + GNAME[g] + '</td></tr>'; } tb += '<tr><td>' + esc(wk.name) + (wk.who === 'z' ? ' <span class="who-badge">замовник</span>' : wk.who === 'e2' ? ' <span class="who-badge">етап 2</span>' : '') + '</td><td class="muted">' + esc(wk.unit || 'компл.') + '</td><td class="n num">' + fmt(normOf(wk.id), 3) + '</td><td class="n num">' + fmt(q, 1) + '</td><td class="n num">' + fmt(h / total * 100, 1) + ' %</td></tr>'; }
    return '<section class="card"><div class="card-h"><h2>Як рахується готовність</h2></div><div class="method"><div class="txt">' +
      '<p>Виконавець звітує <b>великими діями</b>: розклав баласт, зібрав і поставив трикутники, поставив модулі, підключив стрінги. Дрібні елементи — болти, гайки, шурупи, притиски, конектори, провід — списуються самі, пропорційно до проєкту на одиницю дії.</p>' +
      '<p>Кожна дія має <b>обсяг за проєктом ОС-108</b> і <b>норму</b> в людино-годинах на одиницю. Обсяг × норма = вага дії. Готовність — вага виконаного, поділена на вагу всього.</p>' +
      '<p><b>Баласт під трикутниками</b> зараховується сам (2 плити на трикутник), але тільки той, що ще не відмічений окремо. Підйом зараховується за поставленими трикутниками, мінірейками й модулями.</p>' +
      (DEFR.length ? '<p><b>Обсяг 2026</b> — дахи ' + ROOFS26.map(o => o.id).join(', ') + ' і загальна частина: ' + fmt(ROOFS26.reduce((a, o) => a + o.modules, 0)) + ' модулів = 100 %. ' + esc(defSum().txt) + ': будівель ще немає, тому ці дахи не входять у готовність, графік, шахматку і прогноз; їхні матеріали обліковуються як передані на зберігання ГАЛ-КАТ.</p>' : '') +
      '<p><b>План-графік</b> — Додаток №2 до договору: мобілізація дні 1–5, монтаж СЕС 6–40, УЗЕ 20–45, комутація і перевірки 35–52, ПНР 53–58, здача до дня 60. План підрядника рахується тільки з його робіт; роботи замовника і EMS (етап 2) показано окремо.</p>' +
      '<p><b>Склад.</b> Кожна дія звіту — це виріб зі своєю специфікацією на 1 одиницю: «Трикутник», «Модуль встановлений» (з вкладеним «Кріпленням притиску М8»), «Стрінг підключений», «Лоток встановлений» тощо. Вона взята з рядків специфікації даху: кількість у рядку / обсяг дії. Звіт «зібрав 10 трикутників» списує з бригади 10 × специфікацію трикутника — попередньо, до приймання. Залишок бригади = видано − вмонтовано − повернуто − брак; мінус — перевитрата. Давальницькі матеріали ГАЛ-КАТ (модулі, щитки DC, провід Solar) обліковуються окремо, модулі й щитки — за серійними номерами. Норми втрат — 0 %. Приймання прихованих робіт: ' + esc({ foreman: 'прораб підрядника', supervision: 'технагляд замовника', both: 'прораб, потім технагляд' }[String(st.data.settings.acceptance || D.meta.acceptance || 'foreman').trim()] || 'прораб підрядника') + ' (' + (D.meta.hiddenWorks || []).map(h => esc(h.name.toLowerCase())).join('; ') + ') — наступний етап.</p>' +
      '<p><b>Де що змінювати.</b> Коди і ролі — аркуш «Доступи», День 1 і пороги погоди — «Налаштування», норми — «Норми» (ключ дії і число), уточнені обсяги — «Обсяги» (дах, ключ дії, обсяг).' + (role() === 'адмін' ? ' <a href="' + esc(D.meta.sheetUrl) + '" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600">Відкрити таблицю ↗</a>' : '') + '</p>' +
      '<p class="small muted">Маса плити баласту ≈' + fmt(D.meta.ballastKg) + ' кг — оцінка. Лінія 2PV12.2 (206 м) є в кабельному журналі, але не на схемах дахів — в обсяги не включена.</p>' +
      '</div><div><div class="scroll"><table class="norms"><thead><tr><th>Дія</th><th>Од.</th><th class="n">Норма</th><th class="n">Обсяг</th><th class="n">Частка</th></tr></thead><tbody>' + tb + '<tr class="grp"><td colspan="3">Разом</td><td class="n num" colspan="2">' + fmt(total) + ' люд-год</td></tr></tbody></table></div><p class="small muted" style="margin-top:6px">Ключі норм: назва дії англійською з таблиці коду (наприклад tri, pv, strings, wire, lift_mk@rail).</p></div></div></section>';
  }

  /* ---------------- boot ---------------- */
  loadCache();
  render();
  qLoad().then(() => { if (!isTyping()) render(); flush(); });
  loadWeather().then(() => { const r = route().r; if (r === 'wx' || r === 'an' || (r === 'roof' && /hist/.test(location.hash))) { if (!isTyping()) render(); } });
  if (API && st.code) load();
  window.addEventListener('online', () => { flush(); if (API && st.code) load(true); });
  window.addEventListener('offline', qInfo);
  setInterval(() => { if (st.queue.length && !st.busy) flush(); }, 30000);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
  setInterval(() => { if (document.visibilityState === 'visible' && API && st.code && !st.busy) load(true); }, 120000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && API && st.code && !st.busy) { load(true); flush(); } });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!isTyping()) render(); });
})();
