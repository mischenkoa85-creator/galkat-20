const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const SRC = '/home/claude/ant3d/Антарес_3D_макет_монтажу.html';
const OUT = '/home/claude/ant3d/t/';
let h = fs.readFileSync(SRC, 'utf8');
h = h.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'file://' + path.resolve('node_modules/three/build/three.min.js'))
     .replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', 'file://' + path.resolve('node_modules/three/examples/js/controls/OrbitControls.js'));
h = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + h + '</body></html>';
fs.writeFileSync(OUT + 'test.html', h);
const shots = JSON.parse(process.argv[2] || '[]');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: { width: s.w || 1440, height: s.h || 880 }, deviceScaleFactor: 1, colorScheme: s.dark ? 'dark' : 'light' });
    const page = await ctx.newPage();
    const logs = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', e => logs.push('pageerror: ' + e.message));
    const t0 = Date.now();
    await page.goto('file://' + OUT + 'test.html' + (s.hash || ''));
    await page.waitForTimeout(s.wait || 2500);
    if (s.js) { await page.evaluate(s.js); await page.waitForTimeout(s.wait2 || 2000); }
    await page.screenshot({ path: OUT + s.name + '.png', fullPage: !!s.full });
    const info = await page.evaluate(() => { const l = document.getElementById('loading'); return { loading: l ? l.textContent : null, sun: (document.getElementById('sunkv') || {}).innerText }; });
    console.log(s.name, (Date.now() - t0) + 'ms', JSON.stringify(info).slice(0, 400));
    logs.slice(0, 12).forEach(l => console.log('   ', l.slice(0, 300)));
    await ctx.close();
  }
  await browser.close();
})();
