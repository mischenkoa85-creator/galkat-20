// Радіація АБК і козирка сходу — готовим розрахунком для двійника (06.11.2026), щоб телефон не рахував.
// Відкриває index.html?radcalc=1 (розрахунок у браузері, clean.js: abkPrep → abkStep → abkBuild), чекає кінця і пише src/radxdata.js (const RADX).
// node tools/radx_export.js   (потрібні playwright і three@0.128 — THREE_DIR, типово локальна копія); далі sh build.sh
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const NM = process.env.THREE_DIR || '/tmp/claude-0/-home-claude/6829313d-b922-5d9d-9fbb-ebbe29d3bf3e/scratchpad/chk/node_modules/three';
const MAP = { 'three.min.js': '/build/three.min.js', 'OrbitControls.js': '/examples/js/controls/OrbitControls.js', 'LineSegmentsGeometry.js': '/examples/js/lines/LineSegmentsGeometry.js',
  'LineMaterial.js': '/examples/js/lines/LineMaterial.js', 'LineSegments2.js': '/examples/js/lines/LineSegments2.js', 'LineGeometry.js': '/examples/js/lines/LineGeometry.js', 'Line2.js': '/examples/js/lines/Line2.js' };
const OBJ = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/^https?:\/\/(cdnjs|cdn\.jsdelivr)/, r => { const f = MAP[path.basename(new URL(r.request().url()).pathname)]; return f ? r.fulfill({ body: fs.readFileSync(NM + f), contentType: 'application/javascript' }) : r.abort(); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('file://' + path.join(OBJ, 'index.html') + '?radcalc=1', { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(4000);
  await p.evaluate(() => { document.querySelector('button.m5[data-s5=gen]').click(); setTimeout(() => document.querySelector('#subs button[data-sub=rad]').click(), 500); });
  await p.waitForFunction(() => window.__twin.cleanDbg.ABR.done, null, { timeout: 600000, polling: 1000 });
  const R = await p.evaluate(() => { const A = window.__twin.cleanDbg.ABR, r1 = v => Math.round(v * 10) / 10;
    return { n: A.cells.length, e: A.cells.map(q => r1(q.E)), e0: A.cells.map(q => r1(q.E0)), st: Object.fromEntries(Object.entries(A.st).map(([k, s]) => [k, { mean: r1(s.mean), shade: r1(s.shade), n: s.n || s.area }])) }; });
  if (errs.length) throw new Error(errs.join('\n'));
  fs.writeFileSync(path.join(OBJ, 'src', 'radxdata.js'), '// Радіація АБК і козирка сходу за рік, кВт·год/м² на клітинку (tools/radx_export.js, ' + new Date().toISOString().slice(0, 10) + '): порядок — як abkCells() + kozCells() у clean.js\nconst RADX=' + JSON.stringify({ n: R.n, e: R.e, e0: R.e0 }) + ';\n');
  console.log('RADX', R.n, 'клітинок;', JSON.stringify(R.st)); await b.close();
})();
