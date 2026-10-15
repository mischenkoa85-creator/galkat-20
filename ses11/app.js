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
    sDraft: {}, sNote: '', period: 'd', psel: null, delArm: null, busy: false, rDate: today(), sDate: today()
  };
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }, del(k) { try { localStorage.removeItem(k); } catch (e) { } } };
  st.code = LS.get('ses11.code') || '';
  try { st.me = JSON.parse(LS.get('ses11.me') || 'null'); } catch (e) { st.me = null; }
  const role = () => st.me ? st.me.role : '';
  const canReport = () => !!API && (role() === 'адмін' || role() === 'виконавець');
  const canStock = () => !!API && (role() === 'адмін' || role() === 'комірник');

  /* ---------------- api ---------------- */
  async function api(action, payload) {
    const res = await fetch(API, { method: 'POST', body: JSON.stringify(Object.assign({ action, code: st.code }, payload || {})) });
    if (!res.ok) throw { error: 'http', message: 'HTTP ' + res.status };
    const j = await res.json();
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
    if (c === 'server') return 'Помилка сервера: ' + (e.message || '') + '. Спробуйте ще раз.';
    return 'Немає зв’язку з сервером. Перевірте інтернет і спробуйте ще раз.';
  };
  async function load(silent) {
    if (!API || !st.code) return;
    try {
      const j = await api('data');
      st.me = j.me; LS.set('ses11.me', JSON.stringify(j.me));
      const d = j.data || {};
      st.data = {
        reports: (d.reports || []).filter(r => O[r.o] && /^\d{4}-\d{2}-\d{2}$/.test(r.d)).map(r => ({ id: r.id, d: r.d, o: r.o, items: cleanItems(O[r.o], r.items), crane: Number(r.crane) || 0, photo: /^https:\/\//.test(r.photo || '') ? r.photo : '', photos: Number(r.photos) || 0, n: String(r.n || ''), by: String(r.by || ''), at: String(r.at || '') })),
        stock: (d.stock || []).filter(s => O[s.o] && s.o !== 'S').map(s => ({ id: s.id, d: s.d, o: s.o, items: s.items || {}, n: String(s.n || ''), by: String(s.by || ''), at: String(s.at || '') })),
        settings: d.settings || {}, norms: d.norms || {}, plan: d.plan || {}
      };
      st.loaded = true; st.loadErr = '';
    } catch (e) {
      if (e && e.error === 'bad_code') { logout(); return; }
      st.loadErr = errText(e);
    }
    if (!silent || !isTyping()) render();
  }
  function cleanItems(o, items) { const out = {}; for (const w in (items || {})) { const q = Number(items[w]); if (o.plan[w] && isFinite(q) && q !== 0) out[w] = q; } return out; }
  function isTyping() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); }
  function logout() { st.code = ''; st.me = null; LS.del('ses11.code'); LS.del('ses11.me'); st.data = { reports: [], stock: [], settings: {}, norms: {}, plan: {} }; st.loaded = false; render(); }

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
  const totalH = (objs, filt) => { let h = 0; for (const o of (objs || OBJS)) for (const w of worksOf(o)) if (!filt || filt(o, w)) h += hrs(o, w); return h; };
  const earned = (m, objs, filt) => { let e = 0; for (const o of (objs || OBJS)) for (const w of worksOf(o)) if (!filt || filt(o, w)) e += hrs(o, w) * pctW(m, o, w); return e; };
  function consumed(m, o, row) { const drv = row[7]; const pq = projQ(o, drv); return pq ? row[5] / pq * doneOf(m, o, drv) : 0; }
  function issuedMap(oid) { const m = {}; for (const s of st.data.stock) { if (s.o !== oid) continue; for (const k in s.items) m[k] = (m[k] || 0) + Number(s.items[k]); } return m; }
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
    for (const o of OBJS) for (const w of worksOf(o)) {
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
    if (p[0] === 'd' && O[p[1]]) return { r: 'roof', o: p[1], t: p[2] || (canReport() ? 'zvit' : 'plan') };
    if (p[0] === 'analityka') return { r: 'an' };
    if (p[0] === 'pogoda') return { r: 'wx' };
    if (p[0] === 'metod') return { r: 'me' };
    return { r: 'home' };
  }
  window.addEventListener('hashchange', () => { hideTip(); render(); window.scrollTo({ top: 0, behavior: 'auto' }); });

  function renderShell(rt) {
    const map = { home: 'home', roof: 'home', an: 'an', wx: 'wx', me: 'me' };
    for (const a of document.querySelectorAll('#nav a')) { if (a.dataset.r === map[rt.r]) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
    $('who').innerHTML = st.me ? '<span class="who-n"><b>' + esc(st.me.name) + '</b><span class="who-r"> · ' + esc(st.me.role) + '</span></span><button class="btn ghost" type="button" id="logout" style="padding:4px 8px">Вийти</button>' : (API ? '' : '<span class="who-badge">без сервера</span>');
    const lo = $('logout'); if (lo) lo.onclick = () => logout();
  }

  function render() {
    const rt = route(); renderShell(rt);
    if (API && !st.code) { view.innerHTML = loginHtml(); bindLogin(); return; }
    const banner = !API ? '<div class="banner">Сервер звітів ще не підключено. Сайт показує генплан, плани дахів, обсяги й погоду; звіти, фото і склад з’являться після підключення таблиці Google.</div>' : (st.loadErr ? '<div class="banner" data-kind="warn">' + esc(st.loadErr) + ' <button class="btn" type="button" id="retry">Оновити</button></div>' : (!st.loaded ? '<div class="banner">Завантажую звіти…</div>' : ''));
    let html = '';
    if (rt.r === 'home') html = homeHtml();
    else if (rt.r === 'roof') html = roofHtml(rt);
    else if (rt.r === 'an') html = analyticsHtml();
    else if (rt.r === 'wx') html = weatherHtml();
    else html = methodHtml();
    const ae = document.activeElement; const fid = ae && ae.id;
    view.innerHTML = banner + html;
    const rb = $('retry'); if (rb) rb.onclick = () => load();
    if (rt.r === 'home') bindHome();
    else if (rt.r === 'roof') bindRoof(rt);
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
      try { const j = await api('login'); st.me = j.me; LS.set('ses11.code', code); LS.set('ses11.me', JSON.stringify(j.me)); render(); load(); }
      catch (err) { st.code = ''; $('loginH').className = 'hint err'; $('loginH').textContent = errText(err); $('loginB').disabled = false; }
    });
  }

  /* ---------------- home: genplan ---------------- */
  const LABEL = { '7': { x: 1094, y: 52, ext: true }, '9': { x: 728, y: 700, ext: true, anchor: 'start', lx: 716, ly: 726 } };
  function mapSvg(m) {
    const g = D.geom;
    let s = '<svg viewBox="0 14 1250 1030" role="img" aria-label="Генплан площадки 11: дахи залиті кольором за готовністю">';
    for (const b of g.buildings) s += '<path class="bld" d="' + b + '"/>';
    for (const o of ROOFS) { const r = g.roofs[o.id]; const p = sumPct(m, [o]); const k = stepOf(p); s += '<path class="roof" data-o="' + o.id + '" tabindex="0" role="link" aria-label="' + o.name + ', готовність ' + pctTxt(p) + '" fill="' + stepFill(Math.max(k, 0)) + '" fill-rule="evenodd" d="' + r.d + '"/>'; }
    for (const o of ROOFS) {
      const r = g.roofs[o.id]; const p = sumPct(m, [o]); const k = stepOf(p); const L = LABEL[o.id];
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
    const fact = sumPct(m, OBJS, null, filt) || 0;
    if (!s.day1) return { has: false, fact };
    const n = workIndex(today()); const plan = planFrac(n);
    let nEq = 0; for (let k = 0; k <= s.days * 1.5; k++) { if (planFrac(k) <= fact + 1e-9) nEq = k; else break; }
    return { has: true, n, plan, fact, lag: n - nEq, end: dateOfWork(s.days) };
  }
  function homeHtml() {
    const m = agg(); const t = today(); const m0 = agg(addDays(t, -1));
    const all = sumPct(m, OBJS) || 0; const dToday = all - (sumPct(m0, OBJS) || 0);
    const cs = contractStatus(m);
    const modsP = ROOFS.reduce((a, o) => a + planQ(o, 'pv'), 0); const mods = ROOFS.reduce((a, o) => a + Math.min(doneOf(m, o, 'pv'), planQ(o, 'pv')), 0);
    const tiles = [
      ['Готовність проєкту', pctTxt(all), 'сьогодні ' + dpct(dToday), all],
      cs.has ? ['Підрядник за договором', pctTxt(cs.fact), 'план на сьогодні ' + pctTxt(cs.plan) + ' · робочий день ' + cs.n + ' з ' + S().days, cs.fact] : ['Підрядник за договором', pctTxt(cs.fact), 'вкажіть «День 1» у таблиці, щоб бачити план', cs.fact],
      ['Модулі змонтовано', fmt(mods), 'з ' + fmt(modsP) + ' · ' + fmt(mods * D.meta.wp / 1000, 1) + ' кВт', mods / modsP],
      cs.has ? ['Відставання від графіка', cs.lag > 0 ? fmt(cs.lag) + ' роб. дн.' : (cs.lag < 0 ? 'випередження ' + fmt(-cs.lag) : 'за графіком'), 'здача за договором: ' + (cs.end ? dLabel(cs.end) : '—'), null] : ['Звітів у журналі', fmt(st.data.reports.length), st.data.reports.length ? 'останній ' + dLabel(st.data.reports.reduce((a, r) => r.d > a ? r.d : a, '')) : 'ще немає', null]
    ];
    const tileH = tiles.map(x => '<div class="tile"><div class="lbl">' + x[0] + '</div><div class="val num">' + x[1] + '</div><div class="of">' + x[2] + '</div>' + (x[3] != null ? meter(x[3]) : '') + '</div>').join('');
    const todayBy = {}; for (const r of st.data.reports) if (r.d === t) todayBy[r.o] = (todayBy[r.o] || 0) + 1;
    const cards = OBJS.map(o => { const p = sumPct(m, [o]); const c = CLS.find(x => x.id === o.cls); return '<a class="rcard" href="#/d/' + o.id + '"><span class="t"><b>' + objName(o) + '</b><span>' + pctTxt(p) + '</span></span>' + meter(p) + '<span class="s">' + (o.id === 'S' ? 'траси, щити DC, BESS, РП, ПНР' : fmt(o.modules) + ' модулів · ' + esc(c ? c.name.toLowerCase() : '')) + '</span>' + (todayBy[o.id] ? '<span class="today">сьогодні звітів: ' + todayBy[o.id] + '</span>' : '') + '</a>'; }).join('');
    return '<section class="card"><div class="kpis home">' + tileH + '</div></section>' +
      '<section class="card map"><div class="card-h"><h2>Генплан площадки 11</h2><p>Натисніть на дах, щоб відкрити його план, специфікацію і роботи</p></div><div class="map-wrap" id="map">' + mapSvg(m) + '</div><p class="small muted map-hint">Генплан можна гортати пальцем убік.</p><div class="legend"><span>Готовність даху:</span><span class="ramp">' + [0, 1, 2, 3, 4, 5].map(i => '<i style="background:var(--s' + i + ');' + (i === 0 ? 'outline:1px solid var(--line-2);outline-offset:-1px' : '') + '"></i>').join('') + '</span><span>0 % → 100 %, крок 20 %</span></div></section>' +
      '<section class="card"><div class="card-h"><h2>Дахи і загальна частина</h2></div><div class="roofs">' + cards + '</div></section>';
  }
  function bindHome() {
    const host = $('map'); if (!host) return;
    if (host.scrollWidth > host.clientWidth + 2) { host.scrollLeft = st.mapX != null ? st.mapX : (host.scrollWidth - host.clientWidth) / 2; host.addEventListener('scroll', () => { st.mapX = host.scrollLeft; }, { passive: true }); }
    host.addEventListener('click', e => { const t = e.target.closest('[data-o]'); if (t) location.hash = '#/d/' + t.dataset.o; });
    host.addEventListener('keydown', e => { const t = e.target.closest && e.target.closest('[data-o]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); location.hash = '#/d/' + t.dataset.o; } });
    host.addEventListener('mousemove', e => { const t = e.target.closest('[data-o]'); if (!t) return hideTip(); const o = O[t.dataset.o]; const m = agg(); const gs = o.id === 'S' ? S_G : ROOF_G; showTip('<b>' + objName(o) + ' — ' + pctTxt(sumPct(m, [o])) + '</b><br>' + gs.filter(g => worksOf(o).some(w => W[w].g === g)).map(g => GNAME[g] + ': ' + pctTxt(sumPct(m, [o], [g]))).join('<br>'), e.clientX, e.clientY); });
    host.addEventListener('mouseleave', hideTip);
  }

  /* ---------------- roof screen ---------------- */
  const TABS = [['zvit', 'Внести за день'], ['plan', 'План і обсяги'], ['spec', 'Специфікація'], ['hist', 'Історія']];
  function roofHtml(rt) {
    const o = O[rt.o]; const m = agg(); const p = sumPct(m, [o]);
    const tabs = TABS.filter(t => t[0] !== 'zvit' || canReport()).filter(t => t[0] !== 'spec' || o.id !== 'S');
    let t = rt.t; if (!tabs.some(x => x[0] === t)) t = tabs[0][0];
    const i = o.info || {}; const c = CLS.find(x => x.id === o.cls);
    const facts = o.id === 'S' ? '<span>Траси DC і 0,4 кВ, щити захисту DC1 і DC2, BESS, РП-0,4 кВ і РП-6 кВ, заземлення, ПНР. Роботи замовника позначено окремо.</span>' :
      ['<span>Система: <b>' + esc(i.system) + (i.cover ? ', ' + esc(i.cover) : '') + '</b></span>', '<span>Група: <b>' + esc(c ? c.name : '') + '</b></span>', '<span>Модулів: <b>' + fmt(o.modules) + '</b> (' + fmt(o.modules * D.meta.wp / 1000, 1) + ' кВт)</span>', '<span>Стрінгів: <b>' + fmt(i.strings) + '</b>, ліній до щита DC: <b>' + fmt(i.lines) + '</b></span>', i.ballast_t ? '<span>На підйом: <b>≈' + fmt(i.ballast_t + i.modules_t) + ' т</b></span>' : ''].join('');
    let body = '';
    if (t === 'zvit') body = reportHtml(o, m);
    else if (t === 'plan') body = planTabHtml(o, m);
    else if (t === 'spec') body = specHtml(o, m);
    else body = histHtml(o);
    return '<div class="crumb"><a href="#/">← Генплан</a></div>' +
      '<section class="card"><div class="roofhead"><div><h1>' + objName(o) + '</h1><div class="dayfacts" style="margin-top:6px">' + facts + '</div></div><div class="dp num">' + pctTxt(p) + '<small>готовність</small></div></div>' + meter(p) +
      '<nav class="subtabs" style="margin-top:14px" aria-label="Розділи об’єкта">' + tabs.map(x => '<a href="#/d/' + o.id + '/' + x[0] + '"' + (x[0] === t ? ' aria-current="page"' : '') + '>' + x[1] + '</a>').join('') + '</nav></section>' + body;
  }

  /* ---- report form ---- */
  const stepFor = u => (u === 'м³') ? 0.5 : 1;
  const draft = oid => st.rDraft[oid] || (st.rDraft[oid] = {});
  function reportHtml(o, m) {
    const dr = draft(o.id); const groups = o.id === 'S' ? S_G : ROOF_G; let s = '';
    for (const g of groups) {
      const gw = worksOf(o).filter(w => W[w].g === g); if (!gw.length) continue;
      s += '<div class="rep-grp">' + (g === 'lift' ? 'Кран / підйом на дах' : GNAME[g]) + '</div><div class="acts">';
      for (const w of gw) {
        const u = unitOf(o, w); const pq = planQ(o, w); const rem = Math.max(0, pq - doneOf(m, o, w)); const v = dr[w] != null ? dr[w] : '';
        const max = Math.max(stepFor(u), Math.ceil(rem / stepFor(u)) * stepFor(u));
        const who = W[w].who === 'z' ? ' <span class="who-badge">замовник</span>' : W[w].who === 'e2' ? ' <span class="who-badge">етап 2</span>' : '';
        s += '<div class="act' + (Number(v) ? ' has' : '') + (rem <= 0 ? ' done' : '') + '"><div class="act-h"><span class="act-n">' + esc(wshort(o, w)) + who + '<span class="act-d">' + esc(wname(o, w)) + '</span></span><span class="act-r">' + (rem <= 0 ? 'виконано ✓' : 'лишилось ' + fmt(rem, 2) + ' з ' + fmt(pq, 2) + ' ' + esc(u)) + '</span></div>' +
          '<div class="act-c"><input type="range" id="rg-' + w + '" min="0" max="' + max + '" step="' + stepFor(u) + '" value="' + (Number(v) > 0 ? Math.min(max, Number(v)) : 0) + '" aria-label="' + esc(wshort(o, w)) + ', бігунок"' + (rem <= 0 ? ' disabled' : '') + '><input type="number" id="nm-' + w + '" inputmode="decimal" step="any" placeholder="0" value="' + esc(v) + '" aria-label="' + esc(wshort(o, w)) + ', кількість"><span class="act-u">' + esc(u) + '</span></div><div class="act-x" id="x-' + w + '"></div></div>';
        if (w === 'lift_pv') s += '<div class="act"><div class="crane-row"><label for="rCrane" class="act-n" style="font-size:15px">Кран, машино-години за день</label><input type="number" id="rCrane" inputmode="decimal" step="0.5" min="0" placeholder="0" value="' + esc(st.crane[o.id] || '') + '"><span class="act-u">маш.-год</span></div><div class="act-x" id="x-crane"></div></div>';
      }
      s += '</div>';
    }
    const ph = st.photos[o.id] || [];
    return '<form class="card" id="rep" autocomplete="off"><div class="rep-top"><div class="fld"><label for="rDate">Дата</label><input type="date" id="rDate" value="' + esc(st.rDate) + '" max="' + today() + '" required></div><p class="small muted" style="max-width:52ch">Вкажіть, скільки зроблено за день, бігунком або числом. Болти, притиски, конектори й провід списуються самі.</p></div>' + s +
      '<div class="rep-grp">Фото і примітка</div><div class="photos-in"><label class="filebtn">Додати фото<input type="file" id="rFiles" accept="image/*" multiple></label><div class="thumbs" id="thumbs">' + ph.map((p, i) => '<figure><img src="' + p.url + '" alt="Фото ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="Прибрати фото">✕</button></figure>').join('') + '</div><p class="small muted">До 8 фото. Вони стискаються на телефоні й зберігаються на Google Диску в папці «' + esc(objName(o)) + '» за датою звіту.</p></div>' +
      '<div class="fld" style="margin-top:10px"><label for="rNote">Примітка</label><input type="text" id="rNote" maxlength="300" value="' + esc(st.note[o.id] || '') + '" placeholder="ділянка, ряди, зауваження"></div>' +
      '<div class="sumbar"><span class="sum" id="rSum">Нічого не вибрано</span><button class="btn primary" type="submit" id="rSave">Записати за ' + dShort(st.rDate) + '</button></div><div class="hint" id="rHint" aria-live="polite"></div></form>';
  }
  function reportItems(o) { const dr = draft(o.id); const items = {}; for (const w of worksOf(o)) { const v = Number(String(dr[w] == null ? '' : dr[w]).replace(',', '.')); if (isFinite(v) && v !== 0) items[w] = Math.round(v * 1000) / 1000; } return items; }
  function updateSum(o) {
    const items = reportItems(o); const extra = {}; for (const w in items) extra[o.id + '.' + w] = items[w];
    const m0 = agg(), m1 = agg(null, extra);
    for (const w of worksOf(o)) {
      const x = $('x-' + w); if (!x) continue; const notes = [];
      if (items[w]) { notes.push('після запису: ' + pctTxt(pctW(m1, o, w)) + ' цієї дії'); if (doneOf(m1, o, w) > planQ(o, w) + 1e-9) notes.push('<b style="color:var(--warn)">понад обсяг проєкту</b>'); }
      const auto = doneOf(m1, o, w) - doneOf(m0, o, w) - (items[w] || 0); if (auto > 1e-9) notes.push('<b>+' + fmt(auto, 1) + ' ' + esc(unitOf(o, w)) + '</b> зарахується автоматично');
      x.innerHTML = notes.join(' · '); const card = x.closest('.act'); if (card) card.classList.toggle('has', !!items[w]);
    }
    const c = Number(String(st.crane[o.id] || '').replace(',', '.')); const xc = $('x-crane');
    if (xc) { const t = (items.lift_bal || 0) * D.meta.ballastKg + (items.lift_pv || 0) * D.meta.moduleKg; xc.innerHTML = t > 0 ? 'піднято ≈ <b>' + fmt(t / 1000, 1) + ' т</b> (баласт ≈' + fmt(D.meta.ballastKg) + ' кг/плита — оцінка, модуль 41,6 кг)' : ''; }
    const n = Object.keys(items).length; const ph = (st.photos[o.id] || []).length;
    $('rSum').innerHTML = (n ? 'Дій: <b>' + n + '</b> · ' + objName(o).toLowerCase() + ' <b>' + dpct((sumPct(m1, [o]) || 0) - (sumPct(m0, [o]) || 0)) + '</b> · проєкт <b>' + dpct((sumPct(m1, OBJS) || 0) - (sumPct(m0, OBJS) || 0)) + '</b>' : 'Дій не вибрано') + (c > 0 ? ' · кран ' + fmt(c, 1) + ' маш.-год' : '') + (ph ? ' · фото ' + ph : '');
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
    const form = $('rep'); if (!form) return; updateSum(o);
    form.addEventListener('input', e => {
      const t = e.target; const dr = draft(o.id);
      if (t.id === 'rCrane') { st.crane[o.id] = t.value; return updateSum(o); }
      if (t.id === 'rNote') { st.note[o.id] = t.value; return; }
      if (t.id === 'rDate') { st.rDate = t.value || today(); $('rSave').textContent = 'Записати за ' + dShort(st.rDate); return; }
      const mm = /^(rg|nm)-(.+)$/.exec(t.id); if (!mm) return; const w = mm[2];
      if (mm[1] === 'rg') { dr[w] = t.value === '0' ? '' : t.value; const n = $('nm-' + w); if (n) n.value = dr[w]; }
      else { dr[w] = t.value; const r = $('rg-' + w); const v = Number(String(t.value).replace(',', '.')); if (r && isFinite(v)) r.value = Math.max(0, Math.min(Number(r.max), v)); }
      updateSum(o);
    });
    $('rFiles').addEventListener('change', async e => {
      const files = [...e.target.files]; e.target.value = ''; const list = st.photos[o.id] || (st.photos[o.id] = []);
      const h = $('rHint'); h.className = 'hint'; h.textContent = 'Стискаю фото…';
      for (const f of files) { if (list.length >= 8) { toast('Не більше 8 фото в одному звіті'); break; } try { list.push(await compress(f)); } catch (err) { toast('Це фото не вдалося відкрити: ' + f.name); } }
      h.textContent = ''; $('thumbs').innerHTML = list.map((p, i) => '<figure><img src="' + p.url + '" alt="Фото ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="Прибрати фото">✕</button></figure>').join(''); updateSum(o);
    });
    $('thumbs').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; const list = st.photos[o.id] || []; list.splice(Number(b.dataset.rm), 1); render(); });
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (st.busy) return; const h = $('rHint'); h.className = 'hint';
      const items = reportItems(o); const crane = Number(String(st.crane[o.id] || '').replace(',', '.')) || 0; const photos = st.photos[o.id] || [];
      if (!Object.keys(items).length && !(crane > 0) && !photos.length) { h.className = 'hint err'; h.textContent = 'Вкажіть хоча б одну дію, кран або додайте фото.'; return; }
      st.busy = true; $('rSave').disabled = true; h.textContent = photos.length ? 'Надсилаю звіт і ' + photos.length + ' фото…' : 'Надсилаю звіт…';
      try {
        const j = await api('report', { d: st.rDate, o: o.id, items, crane, note: st.note[o.id] || '', photos: photos.map(p => ({ b64: p.b64, mime: p.mime })) });
        st.rDraft[o.id] = {}; delete st.crane[o.id]; st.photos[o.id] = []; st.note[o.id] = '';
        toast('Звіт записано' + (j.photos ? ', фото: ' + j.photos : '') + '.');
        await load();
      } catch (err) { h.className = 'hint err'; h.textContent = errText(err) + ' Дані форми збережено — натисніть «Записати» ще раз.'; }
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
  function specHtml(o, m) {
    const iss = issuedMap(o.id); const dr = st.sDraft[o.id] || (st.sDraft[o.id] = {}); const can = canStock(); const anyIss = st.data.stock.some(x => x.o === o.id);
    let s = '<section class="card"><div class="card-h"><h2>Специфікація і склад</h2><p>«Вкладено» рахується зі звітів робіт пропорційно до проєкту на одиницю дії</p></div>';
    if (can) s += '<div class="setrow"><div class="fld"><label for="sDate">Дата видачі</label><input type="date" id="sDate" value="' + esc(st.sDate) + '" max="' + today() + '"></div><div class="fld" style="flex:1 1 260px"><label for="sNote">Кому і примітка</label><input type="text" id="sNote" maxlength="200" value="' + esc(st.sNote) + '" placeholder="бригадир, накладна"></div></div>';
    if (!anyIss) s += '<p class="small ink2">Видач по ' + o.name.replace('Дах', 'даху') + ' ще не вносилось, тому «У бригади» показує мінус на все, що вже вкладено за звітами.</p>';
    s += '<div class="scroll"><table class="stock"><thead><tr><th>Позиція</th><th>Од.</th><th class="n">За проєктом</th><th class="n">Видано</th><th class="n">Вкладено</th><th class="n">У бригади</th><th class="n">Ще видати</th>' + (can ? '<th class="n">Видати зараз</th>' : '') + '<th>Дж.</th></tr></thead><tbody>';
    let g = '';
    for (const r of o.spec) {
      if (r[1] !== g) { g = r[1]; s += '<tr class="grp"><td colspan="' + (can ? 9 : 8) + '">' + esc(g) + '</td></tr>'; }
      const is = iss[r[0]] || 0; const co = consumed(m, o, r); let flag = '';
      if (anyIss && co > is + 1e-6 && co > 0) flag = '<span class="flag bad">вкладено більше, ніж видано</span>'; else if (is > r[5] * 1.05 + 1e-6) flag = '<span class="flag warn">видано понад проєкт</span>';
      s += '<tr><td class="nm">' + esc(r[2]) + (r[3] ? ' <span class="muted">' + esc(r[3]) + '</span>' : '') + flag + '</td><td>' + esc(r[4]) + '</td><td class="n">' + fmt(r[5]) + '</td><td class="n">' + fmt(is, 1) + '</td><td class="n">' + fmt(co, 1) + '</td><td class="n">' + fmt(is - co, 1) + '</td><td class="n">' + fmt(Math.max(0, r[5] - is), 1) + '</td>' + (can ? '<td class="n"><input type="number" inputmode="decimal" step="any" id="sk-' + r[0] + '" value="' + esc(dr[r[0]] == null ? '' : dr[r[0]]) + '" placeholder="0" aria-label="Видати: ' + esc(r[2]) + '"></td>' : '') + '<td><span class="src">' + r[6] + '</span></td></tr>';
    }
    s += '</tbody></table></div>';
    if (can) s += '<div class="sumbar"><span class="sum" id="sSum">Позицій до видачі: 0</span><button class="btn primary" type="button" id="sSave">Записати видачу</button></div><div class="hint" id="sHint" aria-live="polite"></div>';
    s += '<p class="small muted" style="margin-top:8px">П — з проєкту ОС-108; Р — розраховано з даних проєкту; О — обміряно з креслення, уточнити по місцю.</p></section>';
    const list = st.data.stock.filter(x => x.o === o.id).sort((a, b) => (b.d + b.at).localeCompare(a.d + a.at)).slice(0, 50);
    const nameOf = k => { const r = o.spec.find(x => x[0] === k); return r ? r[2] + (r[3] ? ' ' + r[3] : '') : k; };
    s += '<section class="card"><div class="card-h"><h2>Видачі по ' + o.name.replace('Дах', 'даху') + '</h2></div><div class="iss">' + (list.length ? list.map(x => '<div class="it"><span class="dt">' + dLabel(x.d) + '</span><span class="what">' + Object.keys(x.items).map(k => esc(nameOf(k)) + ' — <b class="num">' + fmt(x.items[k], 2) + '</b>').join('; ') + (x.n ? ' <span class="muted">· ' + esc(x.n) + '</span>' : '') + ' <span class="muted">· ' + esc(x.by) + '</span></span>' + (canDel('stock', x) ? '<button class="btn ghost del" type="button" data-del="' + esc(x.id) + '" data-kind="stock">' + (st.delArm === x.id ? 'Видалити?' : 'Видалити') + '</button>' : '') + '</div>').join('') : '<div class="empty">Видач ще немає.</div>') + '</div></section>';
    return s;
  }
  function canDel(kind, x) { if (!API || !st.me) return false; if (role() === 'адмін') return true; if (x.by !== st.me.name) return false; return kind === 'stock' ? role() === 'комірник' : role() === 'виконавець'; }
  function stockItems(o) { const dr = st.sDraft[o.id] || {}; const items = {}; for (const k in dr) { const v = Number(String(dr[k]).replace(',', '.')); if (isFinite(v) && v !== 0) { const r = o.spec.find(x => x[0] === k); items[k] = { q: Math.round(v * 1000) / 1000, name: r ? r[2] + (r[3] ? ' ' + r[3] : '') : k }; } } return items; }
  function bindSpec(o) {
    const t = view.querySelector('.stock'); if (!t) return;
    const upd = () => { const e = $('sSum'); if (e) e.innerHTML = 'Позицій до видачі: <b>' + Object.keys(stockItems(o)).length + '</b>'; };
    upd();
    const b = $('sSave'); if (b) b.addEventListener('click', async () => {
      const h = $('sHint'); h.className = 'hint'; const items = stockItems(o);
      if (!Object.keys(items).length) { h.className = 'hint err'; h.textContent = 'Вкажіть кількість хоча б по одній позиції.'; return; }
      b.disabled = true; h.textContent = 'Записую…';
      try { await api('stock', { d: st.sDate, o: o.id, items, note: st.sNote }); st.sDraft[o.id] = {}; st.sNote = ''; toast('Видачу записано.'); await load(); }
      catch (err) { h.className = 'hint err'; h.textContent = errText(err); b.disabled = false; }
    });
  }
  async function onDelete(b) {
    const id = b.dataset.del; const kind = b.dataset.kind || 'reports';
    if (st.delArm !== id) { st.delArm = id; b.textContent = kind === 'stock' ? 'Видалити?' : 'Видалити звіт?'; setTimeout(() => { if (st.delArm === id) { st.delArm = null; if (!isTyping()) render(); } }, 4000); return; }
    st.delArm = null; b.disabled = true;
    try { await api('delete', { kind, id }); toast('Видалено.'); await load(); } catch (err) { toast(errText(err)); b.disabled = false; }
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
    const objs = oid ? [O[oid]] : OBJS;
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
        s += '<div class="dobj"><h4>' + objName(o) + '<span>' + esc(r.by) + (r.at ? ' · ' + esc(r.at.slice(11, 16)) : '') + '</span></h4><div class="dlist">' + Object.keys(r.items).map(w => '<span class="dpill">' + esc(wshort(o, w)) + ' <b>' + (r.items[w] > 0 ? '+' : '') + fmt(r.items[w], 2) + '</b> ' + esc(unitOf(o, w)) + '</span>').join('') + (r.crane ? '<span class="dpill">Кран <b>' + fmt(r.crane, 1) + '</b> маш.-год' + (lifted ? ' · ≈' + fmt(lifted, 1) + ' т' : '') + '</span>' : '') + '</div><div class="drep">' + (r.n ? '<span class="nt">' + esc(r.n) + '</span>' : '') + (r.photo ? '<a href="' + esc(r.photo) + '" target="_blank" rel="noopener">Фото: ' + r.photos + ' ↗</a>' : '<span class="muted">без фото</span>') + (canDel('reports', r) ? '<button class="btn ghost del" type="button" data-del="' + esc(r.id) + '" data-kind="reports">' + (st.delArm === r.id ? 'Видалити звіт?' : 'Видалити') + '</button>' : '') + '</div></div>';
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
    for (let n = 1; n <= nNow; n++) { const d = dateOfWork(n); if (!d) break; const f = sumPct(agg(d), OBJS, null, isContr) || 0; pts.push([n, f]); fl += (fl ? 'L' : 'M') + x(n).toFixed(1) + ' ' + y(f).toFixed(1); }
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
    const deltas = []; let prev = 0; for (const d of dates) { const e = earned(agg(d), OBJS, isContr); deltas.push(e - prev); prev = e; }
    const recent = deltas.slice(-10).filter(h => h > 0); const pace = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const total = totalH(OBJS, isContr); const remain = Math.max(0, total - earned(m, OBJS, isContr));
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
    for (const w of acts) { s += '<tr><td>' + esc(W[w].short) + ', ' + esc(W[w].unit) + '/день</td>'; for (const c of CLS) { const has = ROOFS.some(o => o.cls === c.id && o.plan[w]); const x = stat[c.id + '|' + w]; s += '<td class="n">' + (!has ? '<span class="muted">—</span>' : x ? fmt(x.sum / x.days.size, 1) + ' <span class="muted">· ' + x.days.size + ' дн.</span>' : '<span class="muted">немає даних</span>') + '</td>'; } s += '</tr>'; }
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
    for (const o of ROOFS) { mtx += '<tr><th><a href="#/d/' + o.id + '" style="color:inherit;text-decoration:none"><span class="nm">' + o.name + '</span></a></th>'; for (const g of ROOF_G) { const has = worksOf(o).some(w => W[w].g === g); mtx += '<td>' + cellHtml(has ? sumPct(m, [o], [g]) : null) + '</td>'; } mtx += '<td>' + cellHtml(sumPct(m, [o]), ' tot') + '</td></tr>'; }
    mtx += '<tr class="sum"><th><a href="#/d/S" style="color:inherit;text-decoration:none"><span class="nm">Загальна частина</span></a></th><td colspan="' + ROOF_G.length + '"><span class="small muted" style="padding-left:8px">виконавець ' + pctTxt(sumPct(m, [O.S], null, isContr)) + ' · замовник ' + pctTxt(sumPct(m, [O.S], null, (o, w) => W[w].who === 'z')) + '</span></td><td>' + cellHtml(sumPct(m, [O.S]), ' tot') + '</td></tr></tbody></table></div>';
    return '<section class="card"><div class="kpis">' + k.map(t => '<div class="tile"><div class="lbl">' + t[0] + '</div><div class="val num">' + t[1] + '</div><div class="of">' + t[2] + '</div></div>').join('') + '</div><p class="small ink2">' + esc(D.meta.contract) + '. Роботи замовника (бетон, установка BESS, AC-кабелі, РП) і EMS (етап 2) у план підрядника не входять.</p></section>' +
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
    const rows = []; for (const g of [...ROOF_G, ...S_G]) for (const wk of D.works.filter(w => w.g === g)) { const objs = OBJS.filter(o => o.plan[wk.id]); const q = objs.reduce((a, o) => a + planQ(o, wk.id), 0); const h = objs.reduce((a, o) => a + hrs(o, wk.id), 0); rows.push([g, wk, q, h]); }
    const total = totalH(); let tb = ''; let g0 = '';
    for (const [g, wk, q, h] of rows) { if (g !== g0) { g0 = g; tb += '<tr class="grp"><td colspan="5">' + GNAME[g] + '</td></tr>'; } tb += '<tr><td>' + esc(wk.name) + (wk.who === 'z' ? ' <span class="who-badge">замовник</span>' : wk.who === 'e2' ? ' <span class="who-badge">етап 2</span>' : '') + '</td><td class="muted">' + esc(wk.unit || 'компл.') + '</td><td class="n num">' + fmt(normOf(wk.id), 3) + '</td><td class="n num">' + fmt(q, 1) + '</td><td class="n num">' + fmt(h / total * 100, 1) + ' %</td></tr>'; }
    return '<section class="card"><div class="card-h"><h2>Як рахується готовність</h2></div><div class="method"><div class="txt">' +
      '<p>Виконавець звітує <b>великими діями</b>: розклав баласт, зібрав і поставив трикутники, поставив модулі, підключив стрінги. Дрібні елементи — болти, гайки, шурупи, притиски, конектори, провід — списуються самі, пропорційно до проєкту на одиницю дії.</p>' +
      '<p>Кожна дія має <b>обсяг за проєктом ОС-108</b> і <b>норму</b> в людино-годинах на одиницю. Обсяг × норма = вага дії. Готовність — вага виконаного, поділена на вагу всього.</p>' +
      '<p><b>Баласт під трикутниками</b> зараховується сам (2 плити на трикутник), але тільки той, що ще не відмічений окремо. Підйом зараховується за поставленими трикутниками, мінірейками й модулями.</p>' +
      '<p><b>План-графік</b> — Додаток №2 до договору: мобілізація дні 1–5, монтаж СЕС 6–40, УЗЕ 20–45, комутація і перевірки 35–52, ПНР 53–58, здача до дня 60. План підрядника рахується тільки з його робіт; роботи замовника і EMS (етап 2) показано окремо.</p>' +
      '<p><b>Де що змінювати.</b> Коди і ролі — аркуш «Доступи», День 1 і пороги погоди — «Налаштування», норми — «Норми» (ключ дії і число), уточнені обсяги — «Обсяги» (дах, ключ дії, обсяг).' + (role() === 'адмін' ? ' <a href="' + esc(D.meta.sheetUrl) + '" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600">Відкрити таблицю ↗</a>' : '') + '</p>' +
      '<p class="small muted">Маса плити баласту ≈' + fmt(D.meta.ballastKg) + ' кг — оцінка. Лінія 2PV12.2 (206 м) є в кабельному журналі, але не на схемах дахів — в обсяги не включена.</p>' +
      '</div><div><div class="scroll"><table class="norms"><thead><tr><th>Дія</th><th>Од.</th><th class="n">Норма</th><th class="n">Обсяг</th><th class="n">Частка</th></tr></thead><tbody>' + tb + '<tr class="grp"><td colspan="3">Разом</td><td class="n num" colspan="2">' + fmt(total) + ' люд-год</td></tr></tbody></table></div><p class="small muted" style="margin-top:6px">Ключі норм: назва дії англійською з таблиці коду (наприклад tri, pv, strings, wire, lift_mk@rail).</p></div></div></section>';
  }

  /* ---------------- boot ---------------- */
  render();
  loadWeather().then(() => { const r = route().r; if (r === 'wx' || r === 'an' || (r === 'roof' && /hist/.test(location.hash))) { if (!isTyping()) render(); } });
  if (API && st.code) load();
  setInterval(() => { if (document.visibilityState === 'visible' && API && st.code && !st.busy) load(true); }, 120000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && API && st.code && !st.busy) load(true); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!isTyping()) render(); });
})();
