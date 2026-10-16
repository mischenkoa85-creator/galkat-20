const { chromium } = require('playwright-core'); const path=require('path');
(async()=>{
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport:{width:1440,height:900} })).newPage(); const logs=[];
  page.on('pageerror',e=>logs.push('pageerror: '+e.message)); page.on('console',m=>{ if(m.type()==='error'&&!/TUNNEL/.test(m.text())) logs.push(m.text()); });
  await page.goto('file://'+path.resolve('test.html')+'#s4'); await page.waitForTimeout(6000);
  const pt=await page.evaluate(()=>{ const d=__dbg, m=d.MODS[d.MODS.findIndex(x=>x.part==='R'&&x.X>40&&x.X<50&&x.Y>40&&x.Y<45)]; const v=new d.camera.position.constructor(); v.setFromMatrixPosition(m.mat); v.project(d.camera); const r=document.querySelector('#gl').getBoundingClientRect(); return {x:r.left+(v.x+1)/2*r.width, y:r.top+(1-v.y)/2*r.height, i:m.i}; });
  console.log(JSON.stringify(pt));
  await page.mouse.move(pt.x,pt.y); await page.waitForTimeout(400);
  console.log('tip:', await page.evaluate(()=>document.querySelector('#tip').hidden?'hidden':document.querySelector('#tip').textContent));
  await page.mouse.click(pt.x,pt.y); await page.waitForTimeout(2500);
  console.log('node title:', await page.evaluate(()=>document.querySelector('#node-title').textContent+' | tab: '+document.querySelector('#t-node').getAttribute('aria-selected')));
  await page.screenshot({path:'click.png'}); logs.forEach(l=>console.log('LOG',l)); await browser.close(); })();
