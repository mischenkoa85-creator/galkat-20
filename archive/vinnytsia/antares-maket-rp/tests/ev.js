const { chromium } = require('playwright-core');
const fs=require('fs'), path=require('path');
(async()=>{
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport:{width:1440,height:900} }); const page = await ctx.newPage();
  const logs=[]; page.on('pageerror',e=>logs.push('pageerror: '+e.message)); page.on('console',m=>{ if(m.type()==='error'&&!/TUNNEL/.test(m.text())) logs.push(m.text()); });
  await page.goto('file://'+path.resolve('test.html')+(process.argv[3]||'')); await page.waitForTimeout(2500);
  const r=await page.evaluate(process.argv[2]); console.log(JSON.stringify(r)); logs.forEach(l=>console.log('LOG',l.slice(0,300)));
  await browser.close(); })();
