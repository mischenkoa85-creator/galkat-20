
// ---------- assembly steps
const STEPS=['Обстеження і розбивка покрівлі','Мати і баласт','Трикутники і сполучники','Модулі на даху цеху і спойлери','Склад: модулі на скатах 11°, 17°, 22°','Стрінги і DC-траси','Зрівнювання потенціалів','Блискавкоприймачі й дріт на даху','Спуски і заземлювачі','Основа УЗЕ і контур заземлення','Шафи MPS, Galaxy і навіс','Силові лінії до ТП'];
const NS=STEPS.length;
let STEP=0;
const SV={layout:[1,1],mats:[2,99],ball:[2,99],tri:[3,99],conn:[3,99],pv:[4,99],spoil:[4,99],whpv:[5,99],dc:[6,6],bond:[7,7],lps:[8,99],zones:[8,8],down:[9,99],downUG:[9,9],essF:[10,99],essUG:[10,10],essE:[11,99],essC:[11,99],ac:[12,12]};
const HL={2:['ball','mat'],3:['tri','conn'],4:['pvL','spoil'],5:['pvL','pvP','block'],8:['alu','holder','mbase','mast6'],9:['k682','strip','rod'],10:['cushion','sleeper','frame','fm','rod','strip'],11:['gal','mps','sm','col','sheet','boxPV','boxAKB','cont'],12:['tray','cable','trough']};
function setGroundOpacity(op){ MAT.ground.transparent=op<1; MAT.ground.opacity=op; MAT.ground.depthWrite=op>=1; MAT.ground.needsUpdate=true; }
function setPvOpacity(op){ [MAT.pvL,MAT.pvP].forEach(m=>{ m.transparent=op<1; m.opacity=op; m.depthWrite=op>=1; m.needsUpdate=true; }); }
function setTpOpacity(op){ MAT.tp.transparent=op<1; MAT.tp.opacity=op; MAT.tp.depthWrite=op>=1; MAT.tp.needsUpdate=true; }
function effMode(){ if(STEP===6) return 'string'; if(STEP>0) return 'base'; if($('#L-heat').checked) return 'heat'; if($('#shadeOn').checked) return 'shade'; return 'base'; }
function applyLayers(){
  G.bld.visible=$('#L-bld').checked; G.obs.visible=$('#L-obs').checked;
  const pv=$('#L-pv').checked; G.pv.visible=pv; G.whpv.visible=pv;
  const bal=$('#L-bal').checked; ['tri','ball','mats','conn','spoil'].forEach(n=>G[n].visible=bal);
  G.lps.visible=$('#L-lps').checked; G.zones.visible=$('#L-zones').checked; G.down.visible=$('#L-down').checked; G.downUG.visible=false;
  G.bond.visible=$('#L-bond').checked; G.dc.visible=$('#L-dc').checked; G.ac.visible=$('#L-ac').checked;
  const e=$('#L-ess').checked; G.essF.visible=e; G.essE.visible=e; G.essC.visible=e&&ESSV==='cont'; G.essUG.visible=false;
  G.axes.visible=$('#L-axes').checked; G.layout.visible=false;
  roofHeat=$('#L-heat').checked; colorRoof(); setGroundOpacity(1); setTpOpacity(1); setPvOpacity(1); }

// ---------- elements appear one by one inside a step (progress slider + replay)
let PROG=1, growRaf=0, growing=false;
const setCnt=(im,p)=>{ if(im.userData.total===undefined) im.userData.total=im.count; im.count=Math.round(im.userData.total*p); };
const drw=(ln,p)=>{ const n=ln.geometry.attributes.position.count; ln.geometry.setDrawRange(0,Math.round(n*p/2)*2); };
const kids=(g,p)=>{ const k=g.children, n=k.length; k.forEach((c,i)=>{ c.visible=i<Math.ceil(n*p-1e-9); }); };
const GROW={
 2:p=>{ setCnt(matIM,p); setCnt(balIM,p); },
 3:p=>{ setCnt(triIM,p); setCnt(conIM,p); },
 4:p=>{ setCnt(roofL,p); setCnt(spoIM,p); },
 5:p=>{ setCnt(whL,p); setCnt(whP,p); setCnt(blockIM,p); },
 6:p=>{ drw(dcLine,p); },
 7:p=>{ drw(bondLine,p); },
 8:p=>{ const a=Math.min(1,p/0.5), b=Math.max(0,(p-0.5)/0.5); setCnt(mbaseIM,a); setCnt(rodIM,a); setCnt(mtipIM,a); setCnt(holdIM,b); drw(wireLine,b); },
 9:p=>{ setCnt(downIM,p); setCnt(k682IM,p); setCnt(stripIM,p); setCnt(rodIM2,p); setCnt(ugIM,p); drw(downLine,p); },
 10:p=>{ kids(G.essF,Math.min(1,p/0.75)); const b=Math.max(0,(p-0.75)/0.25); setCnt(essRodIM,b); setCnt(essStripIM,b); },
 11:p=>{ kids(G.essE,p); kids(G.essC,p); essVisApply(); },
 12:p=>{ kids(G.ac,p); }
};
function growAll(){ for(let s=2;s<=NS;s++){ const f=GROW[s]; if(f) f(s===STEP?PROG:1); } requestRender(); }
function setProg(p){ PROG=Math.max(0,Math.min(1,p)); syncB(); if(STEP&&GROW[STEP]) GROW[STEP](PROG); $('#sbprog').value=Math.round(PROG*1000); $('#sbpct').textContent=Math.round(PROG*100)+' %'; requestRender(); }
function stopGrow(){ cancelAnimationFrame(growRaf); growing=false; const b=$('#sbplay'); if(b) b.textContent='▶'; }
function playGrow(from){ stopGrow(); if(!STEP||!GROW[STEP]) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ setProg(1); return; }
  growing=true; $('#sbplay').textContent='❚❚'; const t0=performance.now(), dur=3200; setProg(from);
  const tick=n=>{ const p=Math.min(1,from+(n-t0)/dur); setProg(p); if(p<1) growRaf=requestAnimationFrame(tick); else stopGrow(); }; growRaf=requestAnimationFrame(tick); }
$('#sbplay').addEventListener('click',()=>{ if(growing){ stopGrow(); } else playGrow(PROG>=0.999?0:PROG); });
$('#sbprog').addEventListener('input',e=>{ stopGrow(); setProg(+e.target.value/1000); });
// ---------- автопрогравання всього будівництва: 12 кроків за ≈90 с (×1), рух камери і наростання елементів
const TOUR_MS=90000; let tourRaf=0, touring=false, BSPD=1;
function syncB(){ const b=$('#bprog'); if(!b) return; const t=STEP?((STEP-1)+PROG)/NS:1; b.value=Math.round(t*1000); }
function stopTour(){ cancelAnimationFrame(tourRaf); touring=false; const b=$('#bplay'); if(b) b.textContent='▶'; }
function tourTo(t){ t=Math.max(0,Math.min(1,t)); const s=Math.min(NS,Math.floor(t*NS)+1), p=Math.min(1,t*NS-(s-1));
  if(s!==STEP){ STEP=s; PROG=GROW[s]?0:1; applyStep(); goView('s'+s); }
  if(GROW[s]) setProg(p); else syncB(); }
function playTour(from){ stopTour(); stopGrow(); touring=true; $('#bplay').textContent='⏸'; let t=from, last=performance.now();
  const tick=n=>{ t+= (n-last)/(TOUR_MS/BSPD); last=n; if(t>=1){ tourTo(1); stopTour(); return; } tourTo(t); tourRaf=requestAnimationFrame(tick); };
  tourTo(t); tourRaf=requestAnimationFrame(tick); }
$('#bplay').addEventListener('click',()=>{ if(touring){ stopTour(); return; } const cur=STEP?((STEP-1)+PROG)/NS:1; playTour(cur>=0.995?0:cur); });
$('#bprog').addEventListener('input',e=>{ const was=touring; stopTour(); stopGrow(); tourTo(+e.target.value/1000); if(was) playTour(+e.target.value/1000); });
$('#bspeed').addEventListener('click',()=>{ BSPD=BSPD>=4?1:BSPD*2; $('#bspeed').textContent='×'+BSPD; });
$('#bmore').addEventListener('click',()=>{ const d=$('.dp[data-dock="build"]'), o=!d.classList.contains('more'); d.classList.toggle('more',o); $('#bmore').setAttribute('aria-expanded',String(o)); requestRender(); });
function applyStep(){
  const s=STEP;
  Object.values(MAT).forEach(m=>{ if(m.emissive) m.emissive.set(0x000000); });
  if(s===0){ applyLayers(); $('#sbtxt').textContent='Готовий об’єкт'; }
  else {
    Object.keys(SV).forEach(n=>{ G[n].visible=s>=SV[n][0]&&s<=SV[n][1]; });
    G.essC.visible=G.essC.visible&&ESSV==='cont';
    G.bld.visible=true; G.obs.visible=true; G.axes.visible=$('#L-axes').checked;
    (HL[s]||[]).forEach(k=>{ if(MAT[k]&&MAT[k].emissive) MAT[k].emissive.set(0x3a2a00); });
    roofHeat=s===1; colorRoof();
    setGroundOpacity(s===9||s===10?0.32:1); setTpOpacity(s===12?0.35:1); setPvOpacity(s===7?0.3:1);
    $('#sbtxt').textContent=`${s}/${NS} · ${STEPS[s-1]}`; $('#sbtxt').title=STEPS[s-1];
  }
  colorModules(effMode()); growAll();
  $$('#stepchips button').forEach(b=>b.setAttribute('aria-pressed', String(+b.dataset.s===s)));
  syncB(); renderStep(); requestRender();
}
function setStep(s, cam){ stopTour(); STEP=Math.max(0,Math.min(NS,s)); stopGrow(); PROG=(STEP&&GROW[STEP])?0:1; applyStep(); if(cam!==false) goView(STEP?'s'+STEP:'over'); if(STEP&&GROW[STEP]) playGrow(0); }

// ---------- step panels
const TB=(head,rows)=>`<div class="tw"><table class="spec"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td${typeof c==='number'||/^[\d\s ,.−+×/%–≈]+$/.test(String(c))?' class="n"':''}>${typeof c==='number'?nf(c):c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const KP=items=>`<div class="kpis">${items.map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
const NT=list=>`<ul class="notes">${list.map(x=>Array.isArray(x)?`<li class="${x[0]}">${x[1]}</li>`:`<li>${x}</li>`).join('')}</ul>`;
const HD=t=>`<h4>${t}</h4>`;
const pct=v=>Math.round(v/RSTAT.n*100);
const boards=[1,2,3,4,5,6,7,8].map(b=>{ const ms=MODS.filter(m=>m.b===b); const st={}; ms.forEach(m=>st[m.s]=(st[m.s]||0)+1); const L=Object.values(st);
  return {b, n:ms.length, roof:ms.filter(m=>m.part==='R').length, s17:L.filter(x=>x===17).length, s18:L.filter(x=>x===18).length, s19:L.filter(x=>x===19).length}; });
const whCount=k=>MODS.filter(m=>m.part===k).length;
function stepHTML(s){
 switch(s){
 case 1: return `<p class="lead">Покрівля цеху — п’ять аркових прольотів між ендовами. Трикутники стоятимуть перпендикулярно до неї, тож кожен ряд ляже вздовж арки. Макет фарбує покрівлю за ухилом: зелене — до 5°, жовте — 5–10°, червоне — понад 10°. Сині лінії — розбивка 45 рядів з кроком 2,10 м.</p>`+
  KP([[SEGS.length,'відрізків у 45 рядах'],[`${pct(RSTAT.g5)} %`,'модулів на ухилі > 5°'],[`${nf(RSTAT.max,1)}°`,'найбільший ухил ряду']])+
  HD('Прольоти за розрізом А-А (АБ арк. 7)')+TB(['Осі','Проліт, м','Підйом, м','Ухил біля ендови'],SPANS.map((p,i)=>{ const h=(p[1]-p[0])/2-FL; return [['1–4','4–7','7–10','10–13','13–17'][i],p[1]-p[0],nf(p[2],2)+(i===4?' (умовно)':''),`${nf(Math.atan(2*p[2]/h)*R2D,1)}°`]; }))+
  HD('Підготовчі роботи')+TB(['Робота','Обсяг','Примітка'],[
   ['Технічне обстеження несучих конструкцій покрівлі','звіт','у пакеті РП немає'],
   ['Огляд і ремонт покрівельного килима, ендов, водоприймачів','≈ 9 400 м²','11 водоприймачів Ø100 на АБ арк. 6'],
   ['Розбивка рядів і місць трикутників',`${nf(triM.length)} точок`,'2 на модуль + 1 на відрізок'],
   ['Подача матеріалів на відмітку +15 м','≈ 120 т','баласт ≈ 70 т, модулі ≈ 50 т']])+
  NT([['c','<b>К7.</b> Баласт RUDNIK BalZn15 розрахований на плаский дах. Тут ряди нахилені вздовж арки до '+nf(RSTAT.max,1)+'°: '+RSTAT.g10+' модулів (≈ '+pct(RSTAT.g10)+' %) стоять на ухилі понад 10°. Розрахунку на зсув і перекидання немає.'],['w','<b>С3.</b> Звіту обстеження покрівлі немає. Вітровий район: 3-й в АБ, 2-й у ПЗ.']]);
 case 2: return `<p class="lead">На розбивці кладуть гумові мати 320×320×3, а на них — по два бетонні блоки 300×300×60 (≈ 13 кг) під кожен майбутній трикутник. Мати й блоки йдуть першими: вони фіксують точки опор. Остаточно блок прикручують гвинтом R-LX до основи трикутника (АБ арк. 6 п. 3) — це робиться на кроці 3. За приміткою 1 кількість баласту «розраховує завод-постачальник», але в специфікації й кошторисі вже стоїть 5 396 блоків.</p>`+
  KP([[nf(balM.length),'блоків у макеті (спец. 5 396)'],[nf(matM.length),'матів (спец. 5 396)'],['≈ 70 т','баласту на покрівлі']])+
  HD('Відомість')+TB(['Поз.','Найменування','К-сть','Примітка'],[['1.7','Мат гумовий 320×320×3',5396,'2 на трикутник'],['1.4','Баласт B300300-60.Zn бетонний',5396,'2 на трикутник'],['1.8','Метизи для кріплення баластів',5396,'R-LX 6,3×5×50: 3–4 Н·м'],['—','Гайки М8 притисків','—','2,5–3,3 Н·м']])+
  NT([['w','<b>С3.</b> Несуча здатність покрівлі під додаткові ≈ 0,2 кПа (баласт + модулі) не підтверджена, розрахунку на вітер немає; сніг у документах 1,5 і 1,6 кПа.'],['w','<b>С8.</b> Кошторис КБ7-16-19: 2,47 люд.-год на один 13-кг блок — 13 301 год і 1,81 млн грн.'],['c','<b>К7.</b> На ухилі 10–16° баласт працює на зсув — потрібен розрахунок або механічне кріплення.']]);
 case 3: return `<p class="lead">На розкладені блоки ставлять трикутник BalZn15-1568.1470 «Південь 15°» з оцинкованої сталі, прикручують до нього блоки і через один трикутник з’єднують сполучником Bal15. Трикутники стоять у кожному стику модулів і посередині модуля — по три під модуль, два з них спільні із сусідами.</p>`+
  KP([[nf(triM.length),'трикутників (спец. 2 698)'],[nf(conM.length),'сполучників у макеті (спец. 1 953)'],['8 094','метизів трикутників (поз. 1.10)']])+
  HD('Специфікація кріплення ФЕМ, АБ арк. 8')+TB(['Поз.','Найменування','Спец.','Макет'],[
   ['1.1','Трикутник Zn Південь 15° BalZn15-1568.1470',2698,triM.length],['1.5','Сполучник Bal15 Zn Spol-15Zn-700',1953,conM.length],
   ['1.9','Метизи для кріплення сполучників',3906,'—'],['1.10','Метизи для кріплення трикутників',8094,'—']])+
  NT(['Кількість трикутників — 2 на модуль плюс 1 на кожен відрізок ряду: 2 × 1 260 + 181 = 2 701, у специфікації 2 698.','Свердлити отвори Ø5–5,5 мм під R-LX 6,3×5×50 і Ø6–6,5 мм під R-LX 7,5×6×50; одним буром — не більше 120 отворів (АБ арк. 6, пп. 6–7).',['c','<b>К7.</b> На арці основа трикутника лежить по ухилу покрівлі — рама нахиляється разом з нею.']]);
 case 4: return `<p class="lead">1 260 модулів кладуть альбомно на верхні полиці трикутників і притискають W35 і Z33. Ззаду на кожен модуль ставлять спойлер-профнастил 240×2450 — він закриває простір під модулем від вітру з півночі.</p>`+
  KP([['1 260','модулів · 894,6 кВтп'],['2 520 / 3 232','притисків W35 / Z33'],[nf(spoM.length),'спойлерів (спец. 1 260)']])+
  HD('Модулі на даху цеху за щитами')+TB(['Щит','MS','Модулів на даху'],boards.filter(b=>b.roof).map(b=>[`ЩР-PV(${b.b})`,`MS-${BOARD_MS(b.b)}`,b.roof]))+
  NT([['w','<b>С8.</b> КМ11-168-1: 8 люд.-год на модуль (11 520 год, 1,45 млн грн); КМ11-1-7 — ще 3,2 год/шт.'],['w','<b>С7.</b> Ряди повернуті вздовж арки до ±'+nf(RSTAT.max,0)+'°, а PVsyst рахує одну площину 15° / 4°.']]);
 case 5: return `<p class="lead">180 модулів кладуть паралельно скату на блоки Light_P50-310, прикручені до профнастилу, з притисками Z33 і П30 і каучуковим герметиком в отворах. На двоскатній частині модулі портретні, у три ряди; на прибудовах — альбомні.</p>`+
  KP([['180','модулів · 127,8 кВтп'],[nf(blkM.length),'блоків у макеті (спец. 640)'],['3 × 19','модулів у стрінгах St.1.7–1.9']])+
  HD('Розкладка на складі')+TB(['Частина','Скат','Модулів','Розкладка'],[['Двоскатна, південний скат','22°',whCount('C1'),'портрет, 3 ряди'],['Двоскатна, торцева частина','17°',whCount('C2'),'портрет, 3 ряди'],['Прибудова до осі 4','11°',whCount('B'),'альбом, 5 рядів'],['Прибудова до осі 5','11°',whCount('A'),'альбом, 3 ряди']])+
  HD('Специфікація, скатний дах')+TB(['Поз.','Найменування','К-сть'],[['2.1','Притиск Z33 з кріпленням А2',260],['2.2','Притиск П30 з кріпленням А2',442],['2.3','Блок Light_P50-310',640],['2.4','Герметик каучуковий, уп.',180]])+
  NT([['c','<b>К1.</b> Усі три 19-модульні стрінги — на скаті 22°: Uхх ≈ 1 069 В при −25 °C, обладнання на 1 000 В.'],['n','<b>У5.</b> Ціну кріплень у 24.ims обґрунтовано ресурсом баластної системи 15° для модуля 2278×1134 — і для скатного даху теж.']]);
 case 6: return `<p class="lead">Модулі збирають у 80 стрінгів (колір — номер стрінга в щиті, як на ЕТР арк. 2). H1Z2Z2-K 1×6 вертикально ведуть по металоконструкціях рядів, горизонтально — у гофротрубі d40, стійкій до УФ, під верхнім профілем ряду. Зі складу на цех кабель іде тросовим переходом, далі по краю покрівлі до ЩР-PV на фасаді.</p>`+
  KP([['80','стрінгів · 8 ЩР-PV'],[`${nf(dcLen/1000,1)} км`,'трас на ЕТР арк. 2 (гофра d40 — 4 000 м)'],['23,1 км','кабелю H1Z2Z2-K 1×6']])+
  HD('Стрінги за щитами')+TB(['Щит','MS','Модулів','×17','×18','×19'],boards.map(b=>[`ЩР-PV(${b.b})`,`MS-${BOARD_MS(b.b)}`,b.n,b.s17||'—',b.s18,b.s19||'—']))+
  HD('Тросовий перехід, специфікація')+TB(['Найменування','К-сть'],[['Трос сталевий 6 мм','15 м'],['Болт відкидний DIN 444B, анкер М8','4 + 4'],['Затискачі DIN 741 / 3S200 / DIN 3093','4 + 4 + 4'],['Коуш DIN 6899, талреп DIN 1480','4 + 4']])+
  NT([['c','<b>К1.</b> Uхх при −25 °C: 18 модулів ≈ 1 012 В, 19 — ≈ 1 069 В; запобіжники й роз’єднувачі — 1 000 В DC.'],['w','<b>С1.</b> Запобіжники gPV 25 А менші за 1,5·Iкз (26,3–28,3 А) — потрібні 30 А.'],['w','<b>С6.</b> Стрінги до 288 м в один бік: втрати до 4,3 % проти 1,5 % у PVsyst.']]);
 case 7: return `<p class="lead">Рами модулів і металоконструкції кожного ряду з’єднують проводом ПВ-3 1×6 з наконечниками DT(G)-6 і приєднують до контуру з двох сторін. Контур об’єднують з блискавкозахистом і з заземлюючим провідником силового кабелю на інверторах (ЕТР арк. 3, монтажні вказівки 1–4).</p>`+
  KP([[`${nf(bondLen,0)} м`,'ліній на ЕТР арк. 3'],['2 100 м','ПВ-3нг-LS 1×6 у специфікації'],['1 × 6 мм²','переріз провідника']])+
  NT([['w','<b>С4.</b> Провідник, що з’єднує рами з блискавкозахистом, має бути не менше 16 мм² Cu (ДСТУ EN 62305-3, табл. 9) — 6 мм² замало.'],'Лінії зрівнювання йдуть уздовж основ трикутників; на макеті підняті на 9 см над покрівлею, щоб їх було видно.']);
 case 8: return `<p class="lead">51 блискавкоприймач М-04/40 (4 м) ставлять на бетонні основи 32 кг між рядами, ще два М-05/60 (6 м) на триногах — біля MS-3. Алюмінієвий дріт Ø8 кладуть на тримачі H-303 з бетоном на смугах ПВХ-мембрани К-303 і з’єднують злучниками С-011; на довгих ділянках — компенсатори К-220. Червоні кола — зона захисту R 9,9 м на рівні модулів.</p>`+
  KP([['51 + 2','блискавкоприймачі'],[nf(holdM.length),'тримачів у макеті (спец. 3 200)'],[`${nf(wireLen,0)} м`,'дроту на БЗ арк. 2 (ВОР — 2 000)']])+
  HD('Відомість обсягів, БЗ арк. 15')+TB(['Робота / матеріал','Од.','К-сть'],[['Блискавкоприймач з бетонною основою М-04/40','компл.',51],['Блискавкоприймач М-05/60 на тринозі','компл.',2],['Компенсатор К-220','шт',85],['Тримач дроту H-303 з бетоном','шт',3200],['Дріт алюмінієвий Ø8 по даху','м',2000],['Злучник С-011','шт',430]])+
  NT([['w','<b>С4.</b> R4 = 4,91·10⁻³ > 10⁻³, а другого етапу з LPL II немає; розділову відстань не розраховано.'],['n','<b>У2.</b> Щогли 4 м стоять серед рядів і вранці та ввечері кидають тінь на модулі — див. вкладку «Сонце».']]);
 case 9: return `<p class="lead">Від дроту на покрівлі по фасадах опускають 44 спуски: дріт Ø8 на тримачах H-033, H-016 і H-081 до коробки контрольного з’єднання К-682. Від коробки смуга W-25×4 іде по фасаду і в траншеї до стрижневого заземлювача G-16/30 L = 3 м, який забивають вібромолотом з насадкою SDS-max G-160. Болтові з’єднання в землі обмотують стрічкою G-115.</p>`+
  KP([['44','спуски і коробки К-682'],['44 × 3 м','заземлювачі G-16/30'],['13,86 м³','траншея під смугу']])+
  HD('Відомість обсягів, БЗ арк. 15')+TB(['Робота / матеріал','Од.','К-сть'],[['Дріт алюмінієвий Ø8 по фасаду','м',700],['Смуга W-25×4 по фасаду','м',44],['Розробка ґрунту / засипка траншеї','м³','13,86'],['Смуга W-25×4 у землі','м',66],['Заземлювач G-16/30, L = 3 м','компл.',44],['Коробка К-682 + злучник C-032','шт','44 + 44'],['Обмотка з’єднань стрічкою G-115','м',44]])+
  NT([['n','<b>У1.</b> По фасадах А, К і 17 спуски через 10 м, по фасаду 1 (96 м) — лише на кутах; на складі — через 17–20 м. Для LPL II типова відстань — 10 м.']]);
 case 10: return `<p class="lead">Під кожну групу знімають ґрунт, влаштовують ущільнену піщано-щебеневу подушку 250 мм і кладуть 9 лежнів ЛЖ-16. На лежні — раму РМ-1 зі швелера П16. Під стійки навісу — 5 фундаментів ФМ-1 (С20/25, закладні З-1 з болтами М16×600). Навколо — контур: стрижні d16 L = 4,5 м і смуга 40×4 на глибині 0,7 м. Земля в макеті прозора.</p>`+
  KP([['27 × 430 кг','лежнів ЛЖ-16 ≈ 11,6 т'],['15','фундаментів ФМ-1'],[`${D.rods.length} / 26`,'стрижнів на плані / у спец.']])+
  HD('На одну групу (АБ арк. 3, специфікація)')+TB(['Позиція','К-сть','Маса 1 шт, кг'],[['Лежень ЛЖ-16',9,430],['Рама РМ-1 (швелер П16)','1','588,3'],['Фундамент ФМ-1 + закладна З-1','5 + 5','—'],['Щебенево-піщана суміш, м³','5','—'],['Бетон С20/25 F100 / С8/10, м³','0,84 / 0,15','—']])+
  HD('Контур заземлення УЗЕ')+TB(['Позиція','Специфікація','Макет'],[['Стрижень d16, 4,5 м G-16/45','26',D.rods.length],['Смуга сталева 40×4','100 м',`${nf(essStripLen,0)} м`]])+
  NT([['w','<b>С5.</b> Низ лежнів ≈ 0,75 м при промерзанні 0,9–1,0 м і суглинках; розрахунків основи й геології немає.'],['c','<b>К4.</b> Майданчики MS-1 і MS-2 стоять за ≈ 1 м від фасаду по осі 17.']]);
 case 11: return `<p class="lead">На раму ставлять шафу мікромережі FFD POWER 500 кВт (STS, PCS, ізолюючий трансформатор, 10 MPPT, EMS), п’ять шаф Galaxy261L і пристрої SM. Над ними — навіс: стійки □120×120×4 заввишки 3,0 і 2,75 м, прогони □80×80×4, профнастил ПС-20. ЩР-PV і ЩР-АКБ для MS-1 і MS-2 — на фасаді цеху, для MS-3 — на стійках біля майданчика.</p>`+
  KP([['3 × 500 кВт','шафи мікромережі'],['15 × 261','кВт·год = 3 915'],['8 + 3','ЩР-PV і ЩР-АКБ']])+
  HD('Групи')+TB(['Група','кВтп','Galaxy','ЩР-PV','ЩР-АКБ','ТП'],D.pads.map(p=>[p.id,nf(p.kwp,1),5,p.pvn.join(', '),p.akbn,p.tp]))+
  NT([['c','<b>К4.</b> Пожежну безпеку УЗЕ не розроблено: по 1,3 МВт·год під навісом біля фасаду будівлі IIIa, без розривів і систем пожежогасіння. ПЗ п. 1.7 пише «в окремому приміщенні».'],['c','<b>К3.</b> Порт load шафи — «навантаження острівного режиму» — нікуди не підключений.']]);
 case 12: return `<p class="lead">Від MS-1 і MS-2 — 12 × АВВГнгд 4×240 і 2 × F/FTP у гофротрубах d90 по кабельросту 400×100 на фасаді до ТП-5913. Від MS-3 — 6 × АВВГнгд 4×240 у бетонних лотках Л-17-8 під дорогою, далі кабельростом до ТП-6923. У ТП — шафи ЩР-УЗЕ(AC)-1…3 з вимикачами 800 А і ТС 800/5; на вводах ТП — ТС 5000/5 і 4000/5 для пристроїв SM.</p>`+
  KP([[`${nf(acLen,0)} м`,'трас AC на ЕТР арк. 2'],['1 600 м','АВВГнг-LS 4×240 у спец.'],['900 м','кабельросту в кошторисі']])+
  HD('Кабельрост у локальному кошторисі (ЛК1_02-01-02)')+TB(['Позиція','К-сть','Ціна, грн','Сума, тис. грн'],[['КМ8-395-2 Лоток до 400 мм, монтаж','9 × 100 м','9 955,14','89,6'],['Кабельрост 400×100×3000','300 шт','2 332,17','699,7'],['Кришка 400×3000','300 шт','1 048,72','314,6'],['Комплект кріплення кабелю','2 400','119,11','285,9'],['Комплект кріплення кабельросту до фасаду','1 200','218,32','262,0']])+
  NT([['c','<b>К2.</b> Лінія від шин ТП до ЩР-УЗЕ(AC) не має апарата захисту на початку.'],['c','<b>К3.</b> Острівного режиму немає: grid і load заходять в один щит з одним фідером.'],['w','<b>С2.</b> 3 × (4×240) Al після поправок ≈ 600–700 А при вимикачі 800 А.'],['w','<b>С9.</b> 900 м кабельросту і ≈ 1,56 млн грн матеріалів на трасу до 100 м.'],['c','<b>К6.</b> Лічильників комерційного обліку ACE 6000 немає ні в специфікації, ні в кошторисі.']]);
 } return ''; }
function renderStep(){ const s=STEP, el=$('#stepbody');
  if(!s) el.innerHTML=`<p class="lead">Оберіть крок. Макет покаже, що монтується на цьому кроці, а тут з’являться обсяги, специфікація і зауваження.</p>`;
  else el.innerHTML=`<h3 class="steph"><span>Крок ${s}</span>${STEPS[s-1]}</h3>`+stepHTML(s)+`<div class="stepnav"><button data-go="${s-1}" ${s<=1?'disabled':''}>◀ Попередній</button><button data-go="${s+1}" ${s>=NS?'disabled':''}>Наступний ▶</button></div>`;
  $$('#stepbody [data-go]').forEach(b=>b.addEventListener('click',()=>setStep(+b.dataset.go))); }
$('#stepchips').innerHTML=STEPS.map((t,i)=>`<button data-s="${i+1}" aria-pressed="false" title="${t}">${i+1}</button>`).join('')+`<button data-s="0" aria-pressed="true" class="done">Готовий об’єкт</button>`;
$$('#stepchips button').forEach(b=>b.addEventListener('click',()=>setStep(+b.dataset.s)));
$('#sbprev').addEventListener('click',()=>setStep(STEP?Math.max(1,STEP-1):NS));
$('#sbnext').addEventListener('click',()=>setStep(Math.min(NS,STEP+1)));
$('#sbexit').addEventListener('click',()=>setStep(0));
$('#t-build').addEventListener('click',()=>{ if(!STEP) setStep(1); });

// ---------- theme
function applyTheme(){ const bg=new THREE.Color(css('--scene')||'#dce4e6'); scene.background=bg; scene.fog=new THREE.Fog(bg, 260, 700);
  const dk=isDark(); hemi.intensity=dk?0.4:0.5; MAT.ground.color.set(dk?0x3b4245:0xb9beb6); MAT.wall.color.set(dk?0x6c7377:0xffffff);
  MAT.whWall.color.set(dk?0x5d6468:0xd2d4cc); MAT.tp.color.set(dk?0x6a665e:0xd9d1c1); colorRoof(); requestRender(); }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

// ---------- sun and shading (height map 0,2 m, rays from 5 points of every module)
const LAT=50.45, LON=30.43;
function kyivOffset(d){ const y=d.getUTCFullYear(); const lastSun=m=>{ const t=new Date(Date.UTC(y,m+1,0)); return new Date(Date.UTC(y,m,t.getUTCDate()-t.getUTCDay(),1)); }; return (d>=lastSun(2)&&d<lastSun(9))?3:2; }
function solar(dUTC){
  const rad=Math.PI/180, jd=dUTC.getTime()/86400000+2440587.5, jc=(jd-2451545)/36525;
  const L=(280.46646+jc*(36000.76983+jc*0.0003032))%360, M=357.52911+jc*(35999.05029-0.0001537*jc), e=0.016708634-jc*(0.000042037+0.0000001267*jc);
  const C=Math.sin(rad*M)*(1.914602-jc*(0.004817+0.000014*jc))+Math.sin(rad*2*M)*(0.019993-0.000101*jc)+Math.sin(rad*3*M)*0.000289;
  const app=L+C-0.00569-0.00478*Math.sin(rad*(125.04-1934.136*jc));
  const eps0=23+(26+((21.448-jc*(46.815+jc*(0.00059-jc*0.001813))))/60)/60, eps=eps0+0.00256*Math.cos(rad*(125.04-1934.136*jc));
  const dec=Math.asin(Math.sin(rad*eps)*Math.sin(rad*app))/rad, y=Math.tan(rad*eps/2)**2;
  const eqt=4/rad*(y*Math.sin(2*rad*L)-2*e*Math.sin(rad*M)+4*e*y*Math.sin(rad*M)*Math.cos(2*rad*L)-0.5*y*y*Math.sin(4*rad*L)-1.25*e*e*Math.sin(2*rad*M));
  const mins=dUTC.getUTCHours()*60+dUTC.getUTCMinutes()+dUTC.getUTCSeconds()/60;
  let tst=((mins+eqt+4*LON)%1440+1440)%1440; let ha=tst/4<0?tst/4+180:tst/4-180;
  const cz=Math.sin(rad*LAT)*Math.sin(rad*dec)+Math.cos(rad*LAT)*Math.cos(rad*dec)*Math.cos(rad*ha); const zen=Math.acos(Math.max(-1,Math.min(1,cz)))/rad;
  const ac=Math.acos(Math.max(-1,Math.min(1,((Math.sin(rad*LAT)*Math.cos(rad*zen))-Math.sin(rad*dec))/(Math.cos(rad*LAT)*Math.sin(rad*zen)))))/rad;
  const az = ha>0 ? (ac+180)%360 : (540-ac)%360; return {az, el:90-zen}; }
const HM={x0:-4,y0:-30,c:0.2}; HM.nx=Math.ceil((160-HM.x0)/HM.c); HM.ny=Math.ceil((127-HM.y0)/HM.c);
HM.H=new Float32Array(HM.nx*HM.ny); HM.ID=new Int32Array(HM.nx*HM.ny).fill(-1);
(function buildHM(){ const {x0,y0,c,nx,ny,H,ID}=HM; const cx=i=>x0+(i+0.5)*c, cy=j=>y0+(j+0.5)*c;
  const fillBox=(X0,X1,Y0,Y1,fz,id)=>{ const i0=Math.max(0,Math.floor((X0-x0)/c)), i1=Math.min(nx-1,Math.floor((X1-x0)/c)), j0=Math.max(0,Math.floor((Y0-y0)/c)), j1=Math.min(ny-1,Math.floor((Y1-y0)/c));
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const z=fz(cx(i),cy(j)); if(z===null) continue; const k=j*nx+i; if(z>H[k]){ H[k]=z; ID[k]=id===undefined?-1:id; } } };
  fillBox(SHOP[0],SHOP[1],SHOP[2],SHOP[3],X=>roofZ(X));
  D.lan.forEach(l=>{ const zt=roofZ((l[0]+l[1])/2)+0.55; fillBox(l[0],l[1],l[2],l[3],()=>zt); });
  D.obs.forEach(o=>{ const r=o[2]/2, zt=roofZ(o[0])+obsH(o[2])-0.05; fillBox(o[0]-r,o[0]+r,o[1]-r,o[1]+r,(X,Y)=>Math.hypot(X-o[0],Y-o[1])<=r?zt:null); });
  Object.keys(POLY).forEach(k=>{ const P=POLY[k]; const xs=P.map(p=>p[0]), ys=P.map(p=>p[1]); fillBox(Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys),(X,Y)=>inPoly(P,X,Y)?WHF[k](X,Y):null); });
  TPS.forEach(t=>fillBox(t.b[0],t.b[1],t.b[2],t.b[3],()=>t.h));
  D.pads.forEach(p=>fillBox(p.x0,p.x1,p.y0,p.y1,()=>3.3));
  // modules: top face rasterised as two triangles
  const v=new THREE.Vector3();
  MODS.forEach(m=>{ const P=[[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]].map(([a,b])=>{ v.set(a,0.5,b).applyMatrix4(m.mat); return [v.x,-v.z,v.y]; });
    const xs=P.map(p=>p[0]), ys=P.map(p=>p[1]);
    const tri=(A,B,C,X,Y)=>{ const d=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]); const l1=((B[1]-C[1])*(X-C[0])+(C[0]-B[0])*(Y-C[1]))/d, l2=((C[1]-A[1])*(X-C[0])+(A[0]-C[0])*(Y-C[1]))/d, l3=1-l1-l2; return (l1>=-1e-6&&l2>=-1e-6&&l3>=-1e-6)?l1*A[2]+l2*B[2]+l3*C[2]:null; };
    fillBox(Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys),(X,Y)=>{ const z=tri(P[0],P[1],P[2],X,Y); return z!==null?z:tri(P[0],P[2],P[3],X,Y); },m.i); });
  // lightning masts (Ø40 mm, but one 0,2 m cell)
  D.masts.forEach(mm=>{ const z=(mm[2]===4?surfZ(mm[0],mm[1]):0)+mm[2]; const i=Math.floor((mm[0]-x0)/c), j=Math.floor((mm[1]-y0)/c); if(i>=0&&j>=0&&i<nx&&j<ny){ const k=j*nx+i; if(z>H[k]){ H[k]=z; ID[k]=-2; } } }); })();
const SAMP=[[0,0],[-0.35,-0.3],[0.35,-0.3],[-0.35,0.3],[0.35,0.3]].map(([a,b])=>new THREE.Vector3(a,0.5,b));
const SPTS=MODS.map(m=>SAMP.map(s=>{ const v=s.clone().applyMatrix4(m.mat); return [v.x,-v.z,v.y+0.025]; }));
function computeShade(dX,dY,dZ){ const {x0,y0,c,nx,ny,H,ID}=HM; const hor=Math.hypot(dX,dY); const out=new Uint8Array(MODS.length); const fr=new Float32Array(MODS.length); out.frac=fr; if(dZ<=0.02||hor<1e-6) return out;
  const st=c*0.9, sx=dX/hor*st, sy=dY/hor*st, sz=dZ/hor*st, ZM=21.5;
  for(let m=0;m<MODS.length;m++){ let hits=0, ctr=false; const pts=SPTS[m];
    for(let q=0;q<pts.length;q++){ let X=pts[q][0], Y=pts[q][1], Z=pts[q][2], sh=false;
      for(let n=0;n<600;n++){ X+=sx; Y+=sy; Z+=sz; if(Z>ZM) break; const i=Math.floor((X-x0)/c), j=Math.floor((Y-y0)/c); if(i<0||j<0||i>=nx||j>=ny) break;
        const k=j*nx+i; if(ID[k]!==m&&H[k]>Z+0.03){ sh=true; break; } }
      if(sh){ hits++; if(q===0) ctr=true; } }
    out[m]=ctr?2:hits?1:0; fr[m]=hits/pts.length; }
  return out; }
const PANEL_AZ=180;
const dateIn=$('#date'), timeIn=$('#time');
(function(){ // старт — реальні дата й час у Києві (час обмежено світлою частиною доби)
  const n=new Date(), P={}; try{ new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Kiev',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(n).forEach(x=>{P[x.type]=x.value}); }catch(e){}
  const z=x=>String(x).padStart(2,'0'); dateIn.value=P.year?`${P.year}-${P.month}-${P.day}`:`${n.getFullYear()}-${z(n.getMonth()+1)}-${z(n.getDate())}`;
  const m=P.hour?(+P.hour*60+ +P.minute):(n.getHours()*60+n.getMinutes()); timeIn.value=Math.max(240,Math.min(1320,Math.round(m/5)*5)); })();
$('#sunmore').addEventListener('click',()=>{ const d=$('.dp[data-dock="sun"]'), o=!d.classList.contains('more'); d.classList.toggle('more',o); $('#sunmore').setAttribute('aria-expanded',String(o)); requestRender(); });
const fmt=(v,d)=>v.toFixed(d).replace('.',',');
let sunPath=null;
function localToUTC(dateStr, minutes){ const [Y,Mo,Dd]=dateStr.split('-').map(Number); const guess=new Date(Date.UTC(Y,Mo-1,Dd,12)); const off=kyivOffset(guess); return new Date(Date.UTC(Y,Mo-1,Dd,0,minutes-off*60)); }
const sunDot=new THREE.Mesh(new THREE.SphereGeometry(2.4,16,12), new THREE.MeshBasicMaterial({color:0xf0b44a})); scene.add(sunDot);
function updateSun(){
  if(!dateIn.value) return;
  const m=+timeIn.value; $('#timeo').textContent=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const s=solar(localToUTC(dateIn.value,m)), rad=D2R;
  const dir=new THREE.Vector3(Math.sin(s.az*rad)*Math.cos(s.el*rad), Math.sin(s.el*rad), -Math.cos(s.az*rad)*Math.cos(s.el*rad));
  const tgt=new THREE.Vector3(CEN[0],0,-CEN[1]);
  sun.position.copy(tgt).addScaledVector(dir,300); sun.intensity = s.el>0 ? 0.35+0.8*Math.min(1,s.el/25) : 0;
  const cosI=Math.sin(s.el*rad)*Math.cos(TILT)+Math.cos(s.el*rad)*Math.sin(TILT)*Math.cos((s.az-PANEL_AZ)*rad), inc=Math.acos(Math.max(-1,Math.min(1,cosI)))*R2D;
  shadeState = s.el>0 ? computeShade(dir.x,-dir.z,dir.y) : null; genInstant(s,shadeState);
  let full=0, part=0, fullR=0, fullW=0; if(shadeState) MODS.forEach((mm,i)=>{ const v=shadeState[i]; if(v===2){ full++; if(mm.part==='R') fullR++; else fullW++; } else if(v===1) part++; });
  const off=kyivOffset(localToUTC(dateIn.value,720)), rowEl=Math.atan(0.337/(2.10-1.259))*R2D;
  $('#sunkv').innerHTML=`<dt>Азимут / висота</dt><dd>${fmt(s.az,1)}° / ${fmt(s.el,1)}°</dd><dt>Кут падіння на ряди цеху</dt><dd>${s.el>0?fmt(inc,1)+'°'+(cosI<0?' (сонце за площиною модулів)':''):'—'}</dd>`+
    `<dt>Центр модуля в тіні</dt><dd>${s.el>0?`${full} з 1 440 (цех ${fullR}, склад ${fullW})`:'ніч'}</dd><dt>Частково в тіні</dt><dd>${s.el>0?part:'—'}</dd>`+
    `<dt>Ряди без взаємного затінення</dt><dd>при висоті сонця > ${fmt(rowEl,1)}° (крок 2,10 м, нахил 15°)</dd><dt>Час</dt><dd>UTC+${off}</dd>`;
  { seasLabel(); const tm=$('#timeo').textContent; $('#sunread').innerHTML=`<b class="sr-t">${tm}</b>${genChip()}`;
    $('#sunx').innerHTML = s.el>0 ? `висота <b>${fmt(s.el,0)}°</b> · азимут <b>${fmt(s.az,0)}°</b><br>у тіні ${full} · частково ${part}` : 'сонце під горизонтом'; }
  if(sunPath){ scene.remove(sunPath); sunPath.geometry.dispose(); }
  const pts=[]; for(let t=180;t<=1380;t+=10){ const q=solar(localToUTC(dateIn.value,t)); if(q.el<-2) continue; const d=new THREE.Vector3(Math.sin(q.az*rad)*Math.cos(q.el*rad), Math.sin(q.el*rad), -Math.cos(q.az*rad)*Math.cos(q.el*rad)); pts.push(tgt.clone().addScaledVector(d,130)); }
  sunPath=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({color:0xd08a1a,dashSize:3,gapSize:2})); sunPath.computeLineDistances(); scene.add(sunPath);
  sunDot.position.copy(tgt).addScaledVector(dir,130); sunDot.visible=s.el>0;
  if(effMode()==='shade') colorModules('shade');
  requestRender(); }
dateIn.addEventListener('input',()=>updateSun());
timeIn.addEventListener('input',updateSun);
$('#shadeOn').addEventListener('change',()=>{ colorModules(effMode()); });
const SEAS3=[['Зима','12-21'],['Весна','03-20'],['Літо','06-21'],['Осінь','09-23']];
const seasOf=d=>{ const m=+(d||'2026-06-01').slice(5,7); return m===12||m<3?0:m<6?1:m<9?2:3; };
function seasLabel(){ $('#season').textContent=SEAS3[seasOf(dateIn.value)][0]; }
$('#season').addEventListener('click',()=>{ const y=(dateIn.value||'2026').slice(0,4), k=(seasOf(dateIn.value)+1)%4; dateIn.value=`${y}-${SEAS3[k][1]}`; updateSun(); });
let playing=null, SPD=1; const SPDS=[1,2,4,8];
$('#speed').addEventListener('click',()=>{ SPD=SPDS[(SPDS.indexOf(SPD)+1)%SPDS.length]; $('#speed').textContent='×'+SPD; });
function playStop(){ if(playing){ cancelAnimationFrame(playing); playing=null; } $('#play').textContent='▶'; }
$('#play').addEventListener('click',()=>{ if(playing){ playStop(); return; }
  $('#play').textContent='⏸'; let last=0; const step=t=>{ if(t-last>90){ last=t; let v=+timeIn.value+5*SPD; if(v>1320) v=240; timeIn.value=v; updateSun(); } playing=requestAnimationFrame(step); }; playing=requestAnimationFrame(step); });

// ---------- layers
const exitSteps=()=>{ if(STEP){ stopTour(); stopGrow(); PROG=1; STEP=0; growAll(); $('#stepbar').hidden=true; $$('#stepchips button').forEach(b=>b.setAttribute('aria-pressed', String(+b.dataset.s===0))); renderStep(); Object.values(MAT).forEach(m=>{ if(m.emissive) m.emissive.set(0x000000); }); } };
['#L-bld','#L-obs','#L-pv','#L-bal','#L-heat','#L-lps','#L-zones','#L-down','#L-bond','#L-dc','#L-ac','#L-ess','#L-axes'].forEach(id=>$(id).addEventListener('change',()=>{ exitSteps(); applyLayers(); colorModules(effMode()); requestRender(); }));
$('#L-tags').addEventListener('change',e=>{ tagsOn=e.target.checked; requestRender(); });

// ---------- cameras (world: x = X, y = height, z = −Y)
const VIEWS={
  over:()=>[W(196,-108,118),W(78,28,4)], overP:()=>[W(150,-150,170),W(70,30,4)],
  plan:()=>[W(72,46,240),W(72,46.01,0)],
  arch:()=>[W(28,-16,19.5),W(28,30,14.2)],
  wh:()=>[W(112,-62,24),W(108,-15,5)],
  ess:()=>[W(121,44,13),W(98,70,1.5)],
  ms3:()=>[W(46,142,18),W(28,112,2.5)],
  s1:()=>[W(150,-45,78),W(48,46,13)],
  s2:()=>[W(12.5,-5,17.6),W(17.5,7,14.4)], s3:()=>[W(23,-4.5,17.0),W(17.5,7,14.3)],
  s4:()=>[W(66,-26,40),W(46,32,14)], s5:()=>[W(120,-52,22),W(108,-16,6)],
  s6:()=>[W(126,-46,64),W(58,40,10)], s7:()=>[W(42,-9,23),W(40,14,14)],
  s8:()=>[W(-22,-34,46),W(44,40,14)], s9:()=>[W(30,-33,13),W(49,0,5)],
  s10:()=>[W(113,56,8.5),W(98.8,68,-0.8)], s11:()=>[W(115,58,10.5),W(98.8,69,1.6)],
  s12:()=>[W(121,18,17),W(97,52,2)]
};
let anim=null;
const FIT=new Set(['over','plan','wh','ess','ms3','s1','s4','s5','s6','s8','s9','s12']);
function goView(k, instant){ $$('.hud button').forEach(b=>b.classList.toggle('on',b.dataset.cam===k)); const [p,t]=VIEWS[k]();
  if(FIT.has(k)){ // відстань підбирається так, щоб сфера об'єкта влізла і по ширині, і по висоті вікна
    const R=({over:72,plan:84,s1:80,s4:60,s6:70,s8:70,wh:34,ess:20,ms3:24,s5:30,s9:22,s12:26})[k]||30, vf=camera.fov*Math.PI/180, hf=2*Math.atan(Math.tan(vf/2)*camera.aspect);
    const need=R/Math.sin(Math.min(vf,hf)/2)*1.05, cur=p.distanceTo(t); if(camera.aspect<1.25||need>cur) p.sub(t).setLength(Math.max(need,k==='plan'?0:cur*0.6)).add(t); }
  if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){ camera.position.copy(p); controls.target.copy(t); controls.update(); requestRender(); return; }
  const p0=camera.position.clone(), t0=controls.target.clone(); const t1=performance.now(); cancelAnimationFrame(anim);
  const step=n=>{ const u=Math.min(1,(n-t1)/900), e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2; camera.position.lerpVectors(p0,p,e); controls.target.lerpVectors(t0,t,e); controls.update(); requestRender(); if(u<1) anim=requestAnimationFrame(step); };
  anim=requestAnimationFrame(step); }
$$('.hud button').forEach(b=>b.addEventListener('click',()=>goView(b.dataset.cam)));
showFinding = v=>{ if(/^s\d+$/.test(v)){ $('#t-build').click(); setStep(+v.slice(1)); }
  else if(v==='sun'){ $('#t-sun').click(); exitSteps(); applyLayers(); colorModules(effMode()); const dd=(dateIn.value||'2026').slice(0,4); dateIn.value=`${dd}-12-21`; timeIn.value=600; updateSun(); goView('arch'); }
  else goView(v);
  if(matchMedia('(max-width: 860px)').matches) $('.view').scrollIntoView({behavior:'smooth'}); };

// ---------- render loop
controls.addEventListener('change',requestRender);
function resize(){ const v=$('.view'); const w=v.clientWidth, h=v.clientHeight; if(!w||!h) return; renderer.setSize(w,h,false); camera.aspect=w/h; OW=w; OH=h; hudShift(); requestRender(); }
// на вузьких екранах зсуваємо картинку вниз на половину висоти верхніх елементів керування, щоб модель була в центрі вільної області
function hudShift(){ const hw=$('.hudwrap'); let s=0; if(hw&&OW<700){ const vr=$('.view').getBoundingClientRect(), r=hw.getBoundingClientRect(); s=Math.max(0,Math.min(OH*0.45,r.bottom-vr.top))/2; }
  if(s>1) camera.setViewOffset(OW,OH,0,-Math.round(s),OW,OH); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
window.hudShift=hudShift;
new ResizeObserver(resize).observe($('.view'));
const needle=$('#needle');
function orientDecals(){ const a=controls.getAzimuthalAngle(); const k=Math.round(a/(Math.PI/2)); DECALS.forEach(d=>{ d.holder.rotation.y=k*Math.PI/2; }); }
function loop(){ requestAnimationFrame(loop); if(controls.update()) need=true; if(!need) return; need=false;
  needle.style.transform=`rotate(${(controls.getAzimuthalAngle()*180/Math.PI).toFixed(1)}deg)`; orientDecals(); renderer.render(scene,camera); drawTags(); }
applyTheme(); applyLayers(); applyStep(); updateSun(); resize(); goView('over',true); loop();
window.__ant={camera,controls,goView,setStep,requestRender};
// ---------- links: #build, #sun, #find, #data, #s1…#s12, #plan, #ess …
function readHash(){ const k=location.hash.slice(1); if(!k) return; const tabs=['model','build','node','sun','find','data'];
  if(/^s\d+$/.test(k)&&+k.slice(1)>=1&&+k.slice(1)<=NS){ $('#t-build').click(); setStep(+k.slice(1)); }
  else if(tabs.includes(k)) $(`.tabs [data-tab="${k}"]`).click();
  else if(VIEWS[k]) goView(k); }
readHash(); window.addEventListener('hashchange',readHash);
if('IntersectionObserver' in window){ const tm=$('#tomodel'), narrow=matchMedia('(max-width: 860px)');
  new IntersectionObserver(es=>{ tm.hidden=!(narrow.matches&&!es[0].isIntersecting); },{threshold:0.12}).observe($('.view'));
  tm.addEventListener('click',()=>$('.view').scrollIntoView({behavior:'smooth',block:'start'})); }
document.fonts && document.fonts.ready.then(()=>{ DECALS.forEach(paintDecal); TAGS.forEach(a=>a.userData.tag.w=0); requestRender(); });
$('#loading').remove();
window.__dbg={scene,camera,controls,G,MODS,SEGS,triM,RSTAT,setStep,goView,updateSun,computeShade,HM};
})();
