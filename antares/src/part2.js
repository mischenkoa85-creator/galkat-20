(function(){
"use strict";
const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
let need=true, occT=0; function requestRender(){ need=true; clearTimeout(occT); occT=setTimeout(()=>{ try{ computeOcc(); need=true; }catch(e){} },220); }
const nf=(v,d)=>Number(v).toLocaleString('uk-UA',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
const D2R=Math.PI/180, R2D=180/Math.PI;

// ---------- tabs
// нижня панель керування: свій набір елементів для кожної вкладки, її можна сховати
const DOCKN={model:['Шари макета','вмикайте й вимикайте групи елементів'],build:['Монтаж','кроки, перемотування, показ по черзі'],node:['Вузол','вигляд, розбір на елементи'],sun:['Сонце','дата, час, затінення'],find:['Зауваження','фільтр за важливістю']};
let dockOpen=true;
try{ const v=localStorage.getItem('ant-dock'); dockOpen = v===null ? true : v==='1'; }catch(e){ dockOpen=true; }
function dockSet(open){ dockOpen=open; const d=$('#dock'); d.classList.toggle('closed',!open); $('#dockhandle').setAttribute('aria-expanded',String(open)); $('#dockar').textContent=open?'▾':'▴'; $('#docktxt').textContent=open?'Сховати':'Показати'; try{ localStorage.setItem('ant-dock',open?'1':'0'); }catch(e){} }
function dockSync(tab){ const has=!!document.querySelector('.dp[data-dock="'+tab+'"]'); $('#dock').hidden=!has; $$('.dp').forEach(p=>p.hidden=p.dataset.dock!==tab); if(has){ $('#dockname').textContent=DOCKN[tab][0]; $('#dockhint').textContent=DOCKN[tab][1]; } }
$('#dockhandle').addEventListener('click',()=>dockSet(!dockOpen));
$$('#layers label').forEach(l=>{ const s=l.querySelector('.src'); if(s) l.title=s.textContent; });
dockSet(dockOpen); dockSync('model');
$$('.tabs button').forEach(b => b.addEventListener('click', () => {
  $$('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
  $$('.pane').forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab);
  dockSync(b.dataset.tab);
  document.querySelector('.app').classList.toggle('wide', b.dataset.tab==='note');
  try { localStorage.setItem('ant-tab', b.dataset.tab); } catch(e) {}
}));
try { const t = localStorage.getItem('ant-tab'); if (t) { const b = document.querySelector('.tabs [data-tab="'+t+'"]'); if (b) b.click(); } } catch(e) {}

// ---------- findings (rendered even if WebGL fails)
const FINDS = [
 {s:'c',id:'К1',t:'Стрінги по 19 модулів — понад 1 000 В у мороз',p:'За даними ПЗ (Uхх 50,44 В) при −25 °C: 18 модулів ≈ 1 012 В, 19 — ≈ 1 069 В; за даними ENF (47,7 В, −0,23 %/°C) 19 модулів ≈ 1 011 В. Запобіжники gPV і роз’єднувачі в ЩР-PV — на 1 000 В DC. Усі три 19-модульні стрінги (St.1.7–1.9) лежать на скаті складу 22°. Паспорт модуля в ПЗ не збігається з ENF (47,7 В / 18,86 А) і сам із собою (ККД 22,9 % замість 21,4 %).',r:'ПЗ ЕТР; ЕТР арк. 2; специфікація «Щити» поз. 7–14',v:'s6'},
 {s:'c',id:'К2',t:'Лінія від шин ТП до ЩР-УЗЕ(AC) без захисту на початку',p:'ПВ-3 12×1×150 довжиною 22–31 м іде від шин 0,4 кВ ТП до шафи ЩР-УЗЕ(AC) без апарата захисту на початку лінії. Вимикачі QF 800 А стоять лише в самій шафі.',r:'ЕТР, однолінійна схема; специфікація «Щити» поз. 1–3',v:'s12'},
 {s:'c',id:'К3',t:'Острівний режим не спроєктовано',p:'Порт load шафи FFD і QF x.2 підписані «навантаження острівного режиму», але нікуди не ведуть. За кабельним журналом і grid, і load заходять в один ЩР-СЕС з одним фідером до шин ТП.',r:'ЕТР, однолінійна схема, кабельний журнал',v:'s12'},
 {s:'c',id:'К4',t:'Пожежна безпека УЗЕ не розроблена',p:'ТЗ п. 26 і ПЗ ЕТР п. 2.8 виключили протипожежні рішення. Групи MS-1 і MS-2 (по 1,3 МВт·год LFP на майданчику 11 × 2,4 м) стоять під навісом за ≈ 1 м від фасаду будівлі IIIa по осі 17; відстаней і протипожежних розривів немає. ПЗ п. 1.7 пише «в окремому приміщенні».',r:'ТЗ п. 26; ПЗ ЕТР пп. 1.7, 2.8; ЕТР арк. 2',v:'s11'},
 {s:'c',id:'К5',t:'Клас наслідків CC2, а не CC1',p:'У ПЗ чотири арифметичні помилки: Фв 20 386 замість 23 983; «17 328 + 2 097 = 22 483»; у суму підставлено 2 358 м.р.з.п. замість 90,78 тис. грн; 24 841 / 8,647 = 2 873, а не 2 442. Правильно — 26 171 тис. грн ≈ 3 027 м.р.з.п., це понад поріг CC1 (2 500) за ДСТУ 8855:2019. Отже потрібні експертиза і дозвіл.',r:'ПЗ, розрахунок класу наслідків'},
 {s:'c',id:'К6',t:'Приєднання до мережі не оформлене',p:'Лист 2025/12-07-02-АГ (05.02.2026): «ТУ не потрібні». ПЗ ЕТР п. 2.14 пише про відпуск надлишку за ТУ, схема — Zero Export із пристроями SM. Власник ТП не вказаний. Потрібне повідомлення ОСР (КСР, гл. 4.12, дод. 11); з 01.09.2026 (№ 1358) це «складна площадка» комерційного обліку. Лічильників ACE 6000 немає ні в специфікації, ні в кошторисі.',r:'Лист 02-АГ; ПЗ ЕТР п. 2.14; специфікація'},
 {s:'c',id:'К7',t:'Баласт для плаского даху на аркових прольотах',p:'Розріз А-А: прольоти 18 м, ендови між ними, підйом 1,19 м. Трикутники стоять перпендикулярно до покрівлі, тож ряд вздовж арки нахилений: у макеті ухил > 5° під <b id="f-k7a">—</b> модулів, > 10° — під <b id="f-k7b">—</b>, максимум <b id="f-k7c">—</b>. Система RUDNIK BalZn15 — «для плаского даху», розрахунку на зсув і перекидання немає.',r:'АБ арк. 6–8; ЕТР арк. 2',v:'s1'},
 {s:'w',id:'С1',t:'Запобіжники gPV 25 А замалі',p:'Iкз модуля 17,5–18,9 А; 1,5 × Iкз = 26,3–28,3 А. Для стрінгових запобіжників потрібні 30 А.',r:'Специфікація «Щити» поз. 7–14',v:'s6'},
 {s:'w',id:'С2',t:'АВВГнгд 3×(4×240) на межі за струмом',p:'999 А без поправок; 12 кабелів у гофротрубах на кабельросту дають після поправок ≈ 600–700 А при потрібних 722–800 А і вимикачі 800 А.',r:'ЕТР, кабельний журнал',v:'s12'},
 {s:'w',id:'С3',t:'Покрівлю не обстежено, вітер не пораховано',p:'Звіту обстеження покрівлі в пакеті немає. Баласт ≈ 70 т і модулі ≈ 50 т — ≈ 0,2 кПа додатково. Кількість баласту «визначає постачальник», а в кошторисі вона вже є. Вітровий район: 3-й в АБ, 2-й у ПЗ; сніг 1,5 проти 1,6 кПа.',r:'АБ арк. 1, 6; ПЗ',v:'s2'},
 {s:'w',id:'С4',t:'Блискавкозахист без другого етапу і розділової відстані',p:'R4 = 4,91·10⁻³ > 10⁻³, а етапу з LPL II немає. Розділову відстань між LPS і рамами модулів не розраховано. Рами з’єднано з LPS проводом 1×6 мм² — для такого з’єднання потрібно ≥ 16 мм² Cu.',r:'БЗ, розрахунок ризику; ЕТР арк. 3',v:'s8'},
 {s:'w',id:'С5',t:'Основа УЗЕ вище глибини промерзання',p:'Лежні ЛЖ-16 на подушці 250 мм: низ ≈ 0,75 м при промерзанні 0,9–1,0 м і суглинках. Розрахунків основи й інженерної геології немає.',r:'АБ арк. 2–3',v:'s10'},
 {s:'w',id:'С6',t:'Втрати в DC-стрінгах більші за PVsyst',p:'Стрінговий кабель — до 288 м в один бік. Втрати при STC у середньому 2,15 %, максимум 4,3 %; у PVsyst — 1,5 %. Варто розглянути збірні щити на даху.',r:'ЕТР арк. 2; PVsyst',v:'s6'},
 {s:'w',id:'С7',t:'PVsyst без аркової геометрії і тіней',p:'Одна площина 15° / 4°, без 3D-затінення (ряди починають затіняти один одного при сонці нижче ≈ 22°, у грудні сонце піднімається до 16°), без забруднення, трансформатора і батареї. Реалістично 1 070–1 120 МВт·год/рік.',r:'PVsyst',v:'sun'},
 {s:'w',id:'С8',t:'Кошторис: ознаки завищення ≈ 7–8 млн грн',p:'КБ7-16-19 баласт: 2,47 люд.-год на 13-кг блок (13 301 год, 1,81 млн). КМ11-168-1: 8 год на модуль (1,45 млн). КМ8-409 гофротруба: машини 1,94 млн. Дріт W-08/AL 373 грн/м (схоже, ціна за кг), лоток Л-17-8 39 845 грн/м, ЛЖ-16 13 376 грн/шт (схоже, ціна за м³). З накладними й ПДВ ≈ 11–12 млн.',r:'Кошторис 2025/12-06-К'},
 {s:'w',id:'С9',t:'900 м кабельросту на трасу до 100 м',p:'Локальний кошторис: КМ8-395-2 «Лоток … шириною до 400 мм» — 9 × 100 м; кабельрост 400×100×3000 — 300 шт (699 651 грн), кришки — 300 шт (314 616 грн), комплекти кріплення 1 200 + 2 400 (547 848 грн). За ЕТР арк. 2 кабельрост іде лише по фасадах: від MS-2 до входу в ТП-5913 ≈ 45 м і від MS-3 до ТП-6923 ≈ 25 м. ≈ 1,56 млн грн матеріалів без ПДВ.',r:'ЛК1_02-01-02 поз. 21–25; ЕТР арк. 2',v:'s12'},
 {s:'n',id:'У1',t:'Спуски на складі через 17–20 м, на фасаді по осі 1 — жодного',p:'Для об’єкта прийнято LPL II, типова відстань між спусками — 10 м. На цеху по фасадах А, К і 17 спуски через 10 м, а по фасаду 1 (96 м) — лише на кутах. На складі — через 17–20 м. Уточнити, чи фасад по осі 1 примикає до іншої будівлі.',r:'БЗ арк. 2; ДСТУ EN 62305-3, табл. 4',v:'s9'},
 {s:'n',id:'У2',t:'Щогли 4 м стоять серед рядів',p:'51 блискавкоприймач М-04/40 заввишки 4 м поставлено між рядами. Вранці й увечері тінь від щогли лягає на сусідні модулі; вкладка «Сонце» показує, скільки модулів у тіні в обраний момент.',r:'БЗ арк. 2',v:'sun'},
 {s:'n',id:'У3',t:'Розбіжності між специфікацією, схемою й кошторисом',p:'ТС на ТП-5913: 5000/5 на схемі і в специфікації, 4000/5 у кошторисі. SM: 3 на схемі, 2 у PDF-специфікації й кошторисі. Запас кабелю 13–28 % при заявлених 5 %. ЩР-PV(3) у xlsx віднесено до MPS-2. Стрижнів d16 4,5 м: 26 у специфікації, 28 на ЕТР арк. 3.',r:'Специфікація; кошторис; ЕТР арк. 3'},
 {s:'n',id:'У4',t:'Шаблонні залишки й дрібні невідповідності',p:'Адреса «Київська область, м. Київ». У 24.ims збереглася назва іншого об’єкта («ТОВ “Агро-Еталон”, Вінницька обл., с. Василівка»). Дефектні акти — «капітальний ремонт». Орієнтація: «південний захід» у ПЗ, 4° у PVsyst. Каркаси: «алюміній» у ПОБ, Zn-сталь у специфікації. Тривалість: розраховано 1,69 міс., прийнято 24.',r:'ПЗ; ПОБ; 24.ims'},
 {s:'n',id:'У5',t:'Ціна кріплень обґрунтована іншим модулем',p:'У 24.ims ресурс «Вузол кріплення ZN 1 ФЕМ (2278×1134×35), баластна, 15°, альбомне, зі спойлером» — модуль іншого розміру; той самий ресурс підставлено й для скатного даху складу.',r:'24.ims',v:'s5'}
];
const SEVN = {c:'Критично', w:'Суттєво', n:'Уточнити'};
let showFinding = () => {};
function renderFinds(f){
  $('#finds').innerHTML = FINDS.filter(x => f==='all' || x.s===f).map(x =>
   `<article class="find" data-s="${x.s}"><span class="tag">${x.id} · ${SEVN[x.s]}</span><h3>${x.t}</h3><p>${x.p}</p><div class="ref">${x.r}</div>${x.v?`<button class="go" data-v="${x.v}">Показати на макеті</button>`:''}</article>`).join('');
  $$('#finds .go').forEach(b => b.addEventListener('click', () => showFinding(b.dataset.v)));
  if (window.__k7) window.__k7();
}
const cnt = s => FINDS.filter(x => x.s===s).length;
$('#sum').innerHTML = `<div class="c"><b>${cnt('c')}</b><span>критичні</span></div><div class="w"><b>${cnt('w')}</b><span>суттєві</span></div><div class="n"><b>${cnt('n')}</b><span>уточнити</span></div>`;
$$('#filter button').forEach(b => b.addEventListener('click', () => { $$('#filter button').forEach(x => x.classList.toggle('on', x===b)); renderFinds(b.dataset.f); }));
renderFinds('all');

if (typeof THREE === 'undefined' || !THREE.OrbitControls) { $('#loading').textContent = 'Не вдалося завантажити 3D-бібліотеку'; return; }

// ---------- renderer / scene  (world: x = X along axes 1→17, z = −Y along А→К, y = height)
const canvas = $('#gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, preserveDrawingBuffer:true}); }
catch(e){ $('#loading').textContent = 'WebGL недоступний у цьому переглядачі'; return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.3, 3000);
const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI*0.495; controls.screenSpacePanning = false;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const isDark = () => { const t=document.documentElement.getAttribute('data-theme'); return t ? t==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
const CEN=[70,45];
const hemi = new THREE.HemisphereLight(0xeef3ff, 0x8a8f7a, 0.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3dd, 0.95); sun.castShadow = true;
const SMAP = renderer.capabilities.maxTextureSize>=4096 ? 4096 : 2048;
sun.shadow.mapSize.set(SMAP,SMAP); const sc=sun.shadow.camera; sc.left=-105; sc.right=105; sc.top=105; sc.bottom=-105; sc.near=1; sc.far=600; sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.04;
scene.add(sun); scene.add(sun.target); sun.target.position.set(CEN[0],0,-CEN[1]);

const G={}; function grp(n,parent){ const g=new THREE.Group(); g.name=n; (parent||scene).add(g); G[n]=g; return g; }
['ground','bld','obs','axes','layout','mats','tri','conn','ball','pv','spoil','whpv','dc','bond','lps','zones','down','downUG','essF','essUG','essE','ac'].forEach(n=>grp(n));
const W=(X,Y,h)=>new THREE.Vector3(X,h,-Y);
const _M=new THREE.Matrix4(), _Q=new THREE.Quaternion(), _S=new THREE.Vector3(), _V=new THREE.Vector3();
const XA=new THREE.Vector3(1,0,0), ZA=new THREE.Vector3(0,0,1), UP=new THREE.Vector3(0,1,0);
const pick=[]; function info(obj, text){ obj.userData.info=text; pick.push(obj); return obj; }

// ---------- geometry of the site
const HV=13.81, HE=5.0, FL=0.75;               // valley (gutter) level, warehouse eaves, flat strip at each valley
const SPANS=[[0,18,1.19],[18,36,1.19],[36,54,1.19],[54,72,1.19],[72,96,1.6]];
function archAt(X){ for(const s of SPANS){ if(X>=s[0]&&X<=s[1]){ const c=(s[0]+s[1])/2, h=(s[1]-s[0])/2-FL, d=X-c; if(Math.abs(d)>=h) return [0,0]; return [s[2]*(1-d*d/h/h), -2*s[2]*d/h/h]; } } return [0,0]; }
const roofZ=X=>HV+archAt(Math.max(0,Math.min(96,X)))[0];
const roofK=X=>archAt(Math.max(0,Math.min(96,X)))[1];
const SHOP=[-0.15,96.64,-0.5,96.59];
const T11=Math.tan(11*D2R), T17=Math.tan(17*D2R), T22=Math.tan(22*D2R);
const POLY={A:[[54.98,-25.08],[66.55,-25.03],[70.82,-24.51],[73.5,-24.51],[73.5,-15.5],[53.75,-18.65]],
            B:[[73.5,-24.5],[98.1,-24.5],[98.1,-12.5],[92.4,-12.5],[73.5,-15.5]],
            C1:[[98.1,-24.5],[146.1,-24.5],[146.1,-6.5],[98.1,-6.5]],
            C2:[[146.1,-24.5],[155.1,-24.5],[155.1,-6.5],[146.1,-6.5]]};
const WHF={A:(X,Y)=>HE+(Y+25.05)*T11, B:(X,Y)=>HE+(Y+24.5)*T11, C1:(X,Y)=>HE+(9-Math.abs(Y+15.5))*T22, C2:(X,Y)=>HE+(9-Math.abs(Y+15.5))*T17};
const SLOPE={A:11,B:11,C1:22,C2:17};
const TPS=[{id:'ТП-6923',b:[-0.5,19.5,96.6,107.1],h:4.5,t:'ТП-6923 · ТМЗ-2500\nЩР-УЗЕ(AC)-3 усередині'},{id:'',b:[19.5,24.2,96.6,99.4],h:3.5},{id:'ТП-5913',b:[96.64,103.0,-0.4,34.6],h:4.5,t:'ТП-5913 · 2 × ТМЗ-2500\nЩР-УЗЕ(AC)-1, -2 усередині'}];
function inPoly(P,x,y){ let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i],b=P[j]; if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) c=!c; } return c; }
function partAt(X,Y){ if(X>=SHOP[0]&&X<=SHOP[1]&&Y>=SHOP[2]&&Y<=SHOP[3]) return 'R'; for(const k in POLY) if(inPoly(POLY[k],X,Y)) return k; return null; }
function surfZ(X,Y){ const p=partAt(X,Y); if(p==='R') return roofZ(X); if(p) return WHF[p](X,Y);
  for(const t of TPS){ const b=t.b; if(X>=b[0]&&X<=b[1]&&Y>=b[2]&&Y<=b[3]) return t.h; } return null; }

// ---------- materials
const lam=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
const std=(c,m,r,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:m,roughness:r},o||{}));
const MAT={
  ground:lam(0xb9beb6), wall:lam(0xdadcd6,{side:THREE.DoubleSide}), roof:lam(0xffffff,{vertexColors:true,side:THREE.DoubleSide}),
  lan:std(0xb4cbd9,0.1,0.25,{transparent:true,opacity:0.82}), obs:std(0x9aa3a8,0.6,0.45),
  whWall:lam(0xd2d4cc,{side:THREE.DoubleSide}), whRoof:std(0x8d989e,0.45,0.55,{side:THREE.DoubleSide}), tp:lam(0xd9d1c1,{side:THREE.DoubleSide}),
  tri:std(0xb9c0c4,0.75,0.35), ball:lam(0x9d9a93), mat:lam(0x2c2c2c), conn:std(0xa8b0b5,0.75,0.35), spoil:std(0xc2c8cb,0.5,0.5,{side:THREE.DoubleSide}),
  block:lam(0x5c6166), alu:std(0xdfe5e8,0.85,0.3), mbase:lam(0x9b978f), holder:lam(0x8f8b84),
  k682:lam(0x34424a), dwire:lam(0x1f2a30), strip:std(0x9aa3a8,0.7,0.4), rod:std(0x9aa3a8,0.7,0.4),
  cushion:lam(0xc9b68c), sleeper:lam(0xaaa69d), frame:std(0x56626b,0.6,0.5), fm:lam(0xa9a39a), col:std(0x7f8a90,0.5,0.5),
  sheet:std(0x9aa6ad,0.5,0.5,{side:THREE.DoubleSide}), gal:lam(0xe7eaec), mps:lam(0x8796a3), sm:lam(0xb7c0c6), boxPV:lam(0xdfe3e6), boxAKB:lam(0x6d7f8c),
  tray:std(0xb5bcc0,0.6,0.4), cable:lam(0xc0392b), trough:lam(0xa7a39b), mast6:std(0xdfe5e8,0.85,0.3)
};
const LINE={wire:new THREE.LineBasicMaterial({color:0x5fc2e0}), dc:new THREE.LineBasicMaterial({color:0xff8c1a}), bond:new THREE.LineBasicMaterial({color:0x2fc24a}),
  zone:new THREE.LineBasicMaterial({color:0xd0453a,transparent:true,opacity:0.6}), rope:new THREE.LineBasicMaterial({color:0x30363a}), down:new THREE.LineBasicMaterial({color:0x5fc2e0}), layout:new THREE.LineBasicMaterial({color:0x2446a3})};

// ---------- helpers
function bx(w,h,d,x,y,z,rx){ const g=new THREE.BoxGeometry(w,h,d); if(rx) g.rotateX(rx); g.translate(x||0,y||0,z||0); return g; }
function merge(list){ const gs=list.map(g=>g.index?g.toNonIndexed():g); let n=0; gs.forEach(g=>n+=g.attributes.position.count);
  const p=new Float32Array(n*3), q=new Float32Array(n*3); let o=0; gs.forEach(g=>{ p.set(g.attributes.position.array,o*3); q.set(g.attributes.normal.array,o*3); o+=g.attributes.position.count; });
  const m=new THREE.BufferGeometry(); m.setAttribute('position',new THREE.BufferAttribute(p,3)); m.setAttribute('normal',new THREE.BufferAttribute(q,3)); return m; }
function inst(geo, mat, mats, parent, cast){ const im=new THREE.InstancedMesh(geo,mat,Math.max(1,mats.length)); im.count=mats.length; mats.forEach((m,i)=>im.setMatrixAt(i,m)); im.castShadow=cast!==false; im.receiveShadow=true; im.frustumCulled=false; im.instanceMatrix.needsUpdate=true; parent.add(im); return im; }
function box(w,h,d,mat,x,y,z,parent){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; if(parent) parent.add(m); return m; }
function boxXY(X0,X1,Y0,Y1,z0,z1,mat,parent){ return box(Math.abs(X1-X0),z1-z0,Math.abs(Y1-Y0),mat,(X0+X1)/2,(z0+z1)/2,-(Y0+Y1)/2,parent); }
function segLines(pairs, mat, parent){ const a=new Float32Array(pairs.length*3); pairs.forEach((v,i)=>{ a[i*3]=v.x; a[i*3+1]=v.y; a[i*3+2]=v.z; }); const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(a,3)); const l=new THREE.LineSegments(g,mat); parent.add(l); return l; }
// route over roofs: follows surfaces; spans gaps in the air between two roofs; drops to ground where it leaves a roof
function route(X1,Y1,X2,Y2,off,gnd){ const L=Math.hypot(X2-X1,Y2-Y1), n=Math.max(1,Math.ceil(L/0.5)), hA=surfZ(X1,Y1), hB=surfZ(X2,Y2), out=[]; let prev=null;
  for(let i=0;i<=n;i++){ const t=i/n, X=X1+(X2-X1)*t, Y=Y1+(Y2-Y1)*t; let h=surfZ(X,Y), air=false;
    if(h===null){ if(hA!==null&&hB!==null){ h=hA+(hB-hA)*t; air=true; } else h=gnd; }
    const v=W(X,Y,h+(air?0:off)); if(prev&&Math.abs(prev.y-v.y)>1.2&&!air){ out.push(W(X,Y,prev.y)); } out.push(v); prev=v; }
  return out; }
const pairsOf=(pts,acc)=>{ for(let i=0;i<pts.length-1;i++) acc.push(pts[i],pts[i+1]); return acc; };

// ---------- ground
const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,360),MAT.ground); ground.rotation.x=-Math.PI/2; ground.position.set(72,-0.01,-46); ground.receiveShadow=true; G.ground.add(ground);

// ---------- shop: arched roof, gable walls, side walls
const bMeshes=[];
const wallTex=(function(){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.fillStyle='#ffffff'; x.fillRect(0,0,128,128); x.fillStyle='#d9dcdf'; for(let i=0;i<128;i+=16) x.fillRect(i,0,2,128); x.fillStyle='#e5e8ea'; x.fillRect(0,62,128,3);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; return t; })();
MAT.wall.map=wallTex; MAT.wall.needsUpdate=true;
const roofXs=[]; for(let x=SHOP[0];x<SHOP[1];x+=0.25) roofXs.push(x); roofXs.push(SHOP[1]);
const roofGeo=(function(){ const n=roofXs.length, pos=new Float32Array(n*2*3), col=new Float32Array(n*2*3), idx=[];
  roofXs.forEach((X,i)=>{ const z=roofZ(X); pos.set([X,z,-SHOP[2], X,z,-SHOP[3]],i*6); });
  for(let i=0;i<n-1;i++){ const a=i*2,b=a+1,c=a+2,d=a+3; idx.push(a,c,b, b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('color',new THREE.BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals(); return g; })();
const roofMesh=new THREE.Mesh(roofGeo,MAT.roof); roofMesh.receiveShadow=true; roofMesh.castShadow=true; G.bld.add(roofMesh); bMeshes.push(roofMesh);
info(roofMesh,'Покрівля цеху: 5 аркових прольотів\n18 + 18 + 18 + 18 + 24 м, ендови між ними\nверх арки +15,0 (H = 15 м за БЗ)');
let roofHeat=false;
function colorRoof(){ const c=roofGeo.attributes.color.array, dk=isDark(), base=dk?[0.36,0.39,0.41]:[0.80,0.82,0.83];
  roofXs.forEach((X,i)=>{ let col=base; if(roofHeat){ const a=Math.abs(Math.atan(roofK(X))*R2D); col= a<5?(dk?[0.27,0.42,0.33]:[0.62,0.78,0.64]): a<10?[0.90,0.72,0.25]:[0.85,0.33,0.25]; }
    c.set(col,i*6); c.set(col,i*6+3); }); roofGeo.attributes.color.needsUpdate=true; }
(function walls(){ const prof=[]; for(let i=roofXs.length-1;i>=0;i--) prof.push(new THREE.Vector2(roofXs[i],roofZ(roofXs[i])));
  const sh=new THREE.Shape([new THREE.Vector2(SHOP[0],0),new THREE.Vector2(SHOP[1],0)].concat(prof)); const g=new THREE.ShapeGeometry(sh);
  const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)/8,uv.getY(i)/8);
  [SHOP[2],SHOP[3]].forEach(Y=>{ const m=new THREE.Mesh(g,MAT.wall); m.position.z=-Y; m.castShadow=true; m.receiveShadow=true; G.bld.add(m); bMeshes.push(m); });
  [SHOP[0],SHOP[1]].forEach(X=>{ const L=SHOP[3]-SHOP[2]; const pg=new THREE.PlaneGeometry(L,HV); const u=pg.attributes.uv; for(let i=0;i<u.count;i++) u.setXY(i,u.getX(i)*L/8,u.getY(i)*HV/8);
    const m=new THREE.Mesh(pg,MAT.wall); m.rotation.y=Math.PI/2; m.position.set(X,HV/2,-(SHOP[2]+SHOP[3])/2); m.castShadow=true; m.receiveShadow=true; G.bld.add(m); bMeshes.push(m); }); })();

// lanterns and roof obstacles
D.lan.forEach((l,i)=>{ const zb=Math.min(roofZ(l[0]),roofZ(l[1]))-0.05, zt=roofZ((l[0]+l[1])/2)+0.55; const m=boxXY(l[0],l[1],l[2],l[3],zb,zt,MAT.lan,G.obs); bMeshes.push(m);
  info(m,`Зенітний ліхтар ${i+1}\n${nf(l[1]-l[0],1)} × ${nf(l[3]-l[2],1)} м на гребені арки\nвисота над покрівлею ≈0,5 м (умовно)`); });
const obsH=d=>d>=1.5?1.9:d>=1.2?1.6:d>=0.9?1.3:d>=0.5?1.0:0.7;
D.obs.forEach(o=>{ const h=obsH(o[2]); const m=new THREE.Mesh(new THREE.CylinderGeometry(o[2]/2,o[2]/2,h,18),MAT.obs); m.position.set(o[0],roofZ(o[0])+h/2-0.05,-o[1]); m.castShadow=true; m.receiveShadow=true; G.obs.add(m); bMeshes.push(m);
  info(m,`Вентшахта / дефлектор Ø${nf(o[2],2)} м\nвисота ≈${nf(h,1)} м (умовно)`); });
$('#obs-src').textContent=`4 + ${D.obs.length}`;

// warehouse (single- and double-pitch parts) and substations
function prism(P,hF,wallMat,roofMat,parent,ridgeY){
  const pos=[];
  for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.ceil(L/1.0));
    for(let k=0;k<n;k++){ const t0=k/n, t1=(k+1)/n, x0=a[0]+(b[0]-a[0])*t0, y0=a[1]+(b[1]-a[1])*t0, x1=a[0]+(b[0]-a[0])*t1, y1=a[1]+(b[1]-a[1])*t1, h0=hF(x0,y0), h1=hF(x1,y1);
      pos.push(x0,0,-y0, x1,0,-y1, x1,h1,-y1, x0,0,-y0, x1,h1,-y1, x0,h0,-y0); } }
  const wg=new THREE.BufferGeometry(); wg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); wg.computeVertexNormals();
  const wm=new THREE.Mesh(wg,wallMat); wm.castShadow=true; wm.receiveShadow=true; parent.add(wm);
  const pieces=ridgeY===undefined?[P]:[P.map(p=>[p[0],Math.min(p[1],ridgeY)]),P.map(p=>[p[0],Math.max(p[1],ridgeY)])];
  const rp=[]; pieces.forEach(Q=>{ const c=Q.map(p=>new THREE.Vector2(p[0],p[1])); const tr=THREE.ShapeUtils.triangulateShape(c,[]);
    const cy=Q.reduce((s,p)=>s+p[1],0)/Q.length;
    tr.forEach(t=>t.forEach(i=>{ const p=Q[i]; const yy=ridgeY===undefined?p[1]:(cy<ridgeY?Math.min(p[1],ridgeY-1e-6):Math.max(p[1],ridgeY+1e-6)); rp.push(p[0],hF(p[0],yy),-p[1]); })); });
  const rg=new THREE.BufferGeometry(); rg.setAttribute('position',new THREE.Float32BufferAttribute(rp,3)); rg.computeVertexNormals();
  const rm=new THREE.Mesh(rg,roofMat); rm.castShadow=true; rm.receiveShadow=true; parent.add(rm); return [wm,rm]; }
Object.keys(POLY).forEach(k=>{ const ms=prism(POLY[k],WHF[k],MAT.whWall,MAT.whRoof,G.bld,(k==='C1'||k==='C2')?-15.5:undefined); bMeshes.push(...ms);
  ms.forEach(m=>info(m,`Склад, частина ${k==='C1'||k==='C2'?'двоскатна':'односхила'}\nскат ${SLOPE[k]}°, карниз +5,0 (умовно)`)); });
TPS.forEach(t=>{ const m=boxXY(t.b[0],t.b[1],t.b[2],t.b[3],0,t.h,MAT.tp,G.bld); bMeshes.push(m); if(t.t) info(m,t.t); });

// ---------- modules
const PV_L=2.384, PV_W=1.303, PV_T=0.035, TILT=15*D2R, HC=0.31;
const pvTex=(function(){ const c=document.createElement('canvas'); c.width=528; c.height=288; const x=c.getContext('2d');
  x.fillStyle='#e9edf3'; x.fillRect(0,0,528,288); x.fillStyle='#c3cee6';
  const cw=(528-16)/22, ch=(288-16)/6; for(let i=0;i<22;i++) for(let j=0;j<6;j++) x.fillRect(8+i*cw+1.2,8+j*ch+1.2,cw-2.4,ch-2.4);
  x.fillStyle='#e9edf3'; x.fillRect(262,8,4,272);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t; })();
const pvTexP=pvTex.clone(); pvTexP.center.set(0.5,0.5); pvTexP.rotation=Math.PI/2; pvTexP.needsUpdate=true;
MAT.pvL=std(0xffffff,0.25,0.38,{map:pvTex}); MAT.pvP=std(0xffffff,0.25,0.38,{map:pvTexP});
const MODS=D.mods.map((m,i)=>{ const [X,Y,b,s,land]=m; const part=Y>-1?'R':X<73.5?'A':X<98.1?'B':X<146.1?'C1':'C2';
  const o={i,X,Y,b,s,land,part}; const sc=land?new THREE.Vector3(PV_L,PV_T,PV_W):new THREE.Vector3(PV_W,PV_T,PV_L);
  if(part==='R'){ const a=Math.atan(roofK(X)); o.roll=a*R2D; const qr=new THREE.Quaternion().setFromAxisAngle(ZA,a), qt=new THREE.Quaternion().setFromAxisAngle(XA,TILT);
    const q=qr.clone().multiply(qt); const p=W(X,Y,roofZ(X)).add(new THREE.Vector3(0,HC,0).applyQuaternion(qr)); o.mat=new THREE.Matrix4().compose(p,q,sc); }
  else { const sl=SLOPE[part]*D2R, q=new THREE.Quaternion().setFromAxisAngle(XA,sl); const p=W(X,Y,WHF[part](X,Y)+0.07); o.slope=SLOPE[part]; o.mat=new THREE.Matrix4().compose(p,q,sc); }
  return o; });
const BOARD_MS=b=>b<=3?1:b<=6?2:3;
const strLen={}; MODS.forEach(m=>{ const k=m.b+'.'+m.s; strLen[k]=(strLen[k]||0)+1; });
// rows of the shop roof split into segments (row after row, west to east): the build animation follows this order
const rowsMap=new Map(); MODS.filter(m=>m.part==='R').forEach(m=>{ const k=m.Y.toFixed(1); if(!rowsMap.has(k)) rowsMap.set(k,[]); rowsMap.get(k).push(m); });
const SEGS=[]; [...rowsMap.keys()].sort((a,b)=>a-b).map(k=>rowsMap.get(k)).forEach(list=>{ list.sort((a,b)=>a.X-b.X); let cur=[list[0]]; for(let i=1;i<list.length;i++){ if(list[i].X-list[i-1].X>2.6){ SEGS.push(cur); cur=[]; } cur.push(list[i]); } SEGS.push(cur); });
const ROOF_ORDER=SEGS.flat(), WH_ORDER=MODS.filter(m=>m.part!=='R').sort((a,b)=>a.Y-b.Y||a.X-b.X);
const ALL_ORDER=ROOF_ORDER.concat(WH_ORDER);
const unit=new THREE.BoxGeometry(1,1,1);
const landM=ALL_ORDER.filter(m=>m.land), portM=ALL_ORDER.filter(m=>!m.land);
function pvMesh(list,mat,parent){ const im=inst(unit,mat,list.map(m=>m.mat),parent); im.userData.list=list; list.forEach((m,k)=>{ m.im=im; m.k=k; }); return im; }
// roof and warehouse modules go into separate groups so the steps can show them apart
const roofL=pvMesh(landM.filter(m=>m.part==='R'),MAT.pvL,G.pv), whL=pvMesh(landM.filter(m=>m.part!=='R'),MAT.pvL,G.whpv), whP=pvMesh(portM,MAT.pvP,G.whpv);
const PVIM=[roofL,whL,whP]; PVIM.forEach(im=>{ im.userData.node=true; });
PVIM.forEach(im=>{ pick.push(im); im.userData.infoFn=k=>{ const m=im.userData.list[k];
  return `Модуль ${m.i+1} · ЩР-PV(${m.b}) · стрінг ${m.s}\nстрінг ${strLen[m.b+'.'+m.s]} модулів → MS-${BOARD_MS(m.b)}\n`+(m.part==='R'?`дах цеху · трикутник 15°\nповорот уздовж арки ${nf(Math.abs(m.roll),1)}°`:`склад · паралельно скату ${m.slope}°`); }; });
const COL_BASE=new THREE.Color(0x2a4a8f);
let colorMode='base', shadeState=null;
function colorModules(mode){ colorMode=mode||colorMode; const c=new THREE.Color();
  PVIM.forEach(im=>{ im.userData.list.forEach((m,k)=>{
    if(colorMode==='string'){ c.setHSL(((m.s-1)/10+0.02*(m.b%2))%1, 0.72, 0.38+0.06*((m.b-1)%3)); }
    else if(colorMode==='heat'&&m.part==='R'){ const a=Math.abs(m.roll); c.set(a<5?0x2a4a8f:a<10?0xe0a21b:0xd2412f); }
    else if(colorMode==='shade'&&shadeState){ const s=shadeState[m.i]; c.set(s===2?0xe0711b:s===1?0xe9c46a:0x2a4a8f); }
    else c.copy(COL_BASE);
    im.setColorAt(k,c); }); if(im.instanceColor) im.instanceColor.needsUpdate=true; }); requestRender(); }
colorModules('base');
const rollAbs=MODS.filter(m=>m.part==='R').map(m=>Math.abs(m.roll));
const RSTAT={n:rollAbs.length, g5:rollAbs.filter(a=>a>5).length, g10:rollAbs.filter(a=>a>10).length, g15:rollAbs.filter(a=>a>15).length, max:Math.max(...rollAbs)};
window.__k7=()=>{ const a=$('#f-k7a'); if(!a) return; a.textContent=`${RSTAT.g5} з ${RSTAT.n} (${Math.round(RSTAT.g5/RSTAT.n*100)} %)`; $('#f-k7b').textContent=`${RSTAT.g10} (${Math.round(RSTAT.g10/RSTAT.n*100)} %)`; $('#f-k7c').textContent=`${nf(RSTAT.max,1)}°`; };
window.__k7();

// ---------- ballast system on the shop roof (RUDNIK BalZn15): per row segment 2n+1 triangles
const triGeo=merge([bx(0.04,0.03,1.568,0,0.021,0), bx(0.04,0.13,0.04,0,0.1,0.63), bx(0.04,0.44,0.04,0,0.25,-0.63), bx(0.04,0.03,1.302,0,0.3,0,Math.atan2(0.33,1.26))]);
const triM=[], balM=[], matM=[], conM=[], spoM=[], layoutPairs=[], triMod=[], balMod=[], matMod=[], conMod=[], spoMod=[];
const HALF=1.2075;
SEGS.forEach(seg=>{ const Y=seg[0].Y, x0=seg[0].X-HALF, n=seg.length; seg.forEach((m,j)=>{ m.seg=seg; m.j=j; });
  for(let k=0;k<=2*n;k++){ const X=x0+k*HALF, a=Math.atan(roofK(X)), q=new THREE.Quaternion().setFromAxisAngle(ZA,a), base=W(X,Y,roofZ(X));
    const M=new THREE.Matrix4().compose(base,q,new THREE.Vector3(1,1,1)); triM.push(M); triMod.push(seg[Math.min(k>>1,n-1)]);
    [-0.5,0.5].forEach(dz=>{ balM.push(M.clone().multiply(new THREE.Matrix4().makeTranslation(0,0.066,dz))); matM.push(M.clone().multiply(new THREE.Matrix4().makeTranslation(0,0.003,dz))); balMod.push(seg[Math.min(k>>1,n-1)]); matMod.push(seg[Math.min(k>>1,n-1)]); });
    if(k%2===0&&k<2*n){ conMod.push(seg[k>>1]); const Xm=X+HALF/2, am=Math.atan(roofK(Xm)); conM.push(new THREE.Matrix4().compose(W(Xm,Y,roofZ(Xm)),new THREE.Quaternion().setFromAxisAngle(ZA,am),new THREE.Vector3(1,1,1)).multiply(new THREE.Matrix4().makeTranslation(0,0.05,-0.72))); } }
  seg.forEach(m=>{ spoMod.push(m); const a=Math.atan(roofK(m.X)); const M=new THREE.Matrix4().compose(W(m.X,Y,roofZ(m.X)),new THREE.Quaternion().setFromAxisAngle(ZA,a),new THREE.Vector3(1,1,1));
    spoM.push(M.multiply(new THREE.Matrix4().makeTranslation(0,0.27,-0.69)).multiply(new THREE.Matrix4().makeRotationX(17.5*D2R))); });
  const xa=x0, xb=x0+2*n*HALF; [Y+0.65,Y-0.65].forEach(yy=>{ pairsOf(route(xa,yy,xb,yy,0.04,0),layoutPairs); }); });
const triIM=inst(triGeo,MAT.tri,triM,G.tri), balIM=inst(new THREE.BoxGeometry(0.3,0.06,0.3),MAT.ball,balM,G.ball), matIM=inst(new THREE.BoxGeometry(0.32,0.006,0.32),MAT.mat,matM,G.mats,false),
      conIM=inst(new THREE.BoxGeometry(HALF,0.03,0.04),MAT.conn,conM,G.conn), spoIM=inst(new THREE.BoxGeometry(2.45,0.4,0.004),MAT.spoil,spoM,G.spoil);
info(triIM,'Трикутник BalZn15-1568.1470 «Південь 15°», Zn\nстоїть перпендикулярно до покрівлі'); info(balIM,'Баласт B300300-60 бетонний, ≈13 кг\n2 на трикутник, гвинти R-LX до основи'); info(spoIM,'Спойлер-профнастил Vitr-240×2450 Zn\nвітровий щиток з півночі, 1 на модуль'); info(conIM,'Сполучник Bal15 Zn — через один трикутник');
triIM.userData.mods=triMod; balIM.userData.mods=balMod; matIM.userData.mods=matMod; conIM.userData.mods=conMod; spoIM.userData.mods=spoMod; [triIM,balIM,conIM,spoIM].forEach(im=>{ im.userData.node=true; });
segLines(layoutPairs,LINE.layout,G.layout);
// warehouse mounting blocks (Light_P50-310) under module corners
const blkM=[]; WH_ORDER.forEach(m=>{ const sl=SLOPE[m.part]*D2R, q=new THREE.Quaternion().setFromAxisAngle(XA,sl);
  const du=(m.land?PV_L:PV_W)/2-0.3, dv=(m.land?PV_W:PV_L)/2-0.25;
  [[-du,-dv],[du,-dv],[-du,dv],[du,dv]].forEach(([u,v])=>{ const off=new THREE.Vector3(u,0,v).applyQuaternion(q); const X=m.X+off.x, Y=m.Y-off.z; blkM.push(new THREE.Matrix4().compose(W(X,Y,WHF[m.part](X,Y)+0.025),q,new THREE.Vector3(1,1,1))); }); });
const blockIM=info(inst(new THREE.BoxGeometry(0.31,0.05,0.1),MAT.block,blkM,G.whpv),'Блок Light_P50-310 на профнастилі складу\nз притисками Z33 / П30 і герметиком');

// ---------- DC routes (strings) and the rope crossing from the warehouse to the shop
const dcPairs=[]; D.dc.forEach(s=>pairsOf(route(s[0],s[1],s[2],s[3],0.18,0.3),dcPairs));
// drops from the roof edge to the ЩР-PV boxes on the facade (MS-1, MS-2) and to MS-3 along the trough
D.pads.forEach(p=>p.pv.forEach(b=>{ const Y=(b[2]+b[3])/2, X=(b[0]+b[1])/2; if(p.id!=='MS-3'){ dcPairs.push(W(96.7,Y,HV+0.18),W(96.75,Y,1.7)); } }));
const dcLine=segLines(dcPairs,LINE.dc,G.dc);
const ropeA=W(98.1,-6.51,HE+0.3), ropeB=W(96.64,-0.51,HV+0.3);
segLines([ropeA,ropeB],LINE.rope,G.dc);
const ropeTag=new THREE.Object3D(); ropeTag.position.copy(ropeA).lerp(ropeB,0.5); G.dc.add(ropeTag);
const dcLen=D.dc.reduce((s,q)=>s+Math.hypot(q[2]-q[0],q[3]-q[1]),0);

// ---------- equipotential bonding (ПВ-3 1×6) along rows
const bondPairs=[]; D.bond.forEach(s=>pairsOf(route(s[0],s[1],s[2],s[3],0.12,0.15),bondPairs)); const bondLine=segLines(bondPairs,LINE.bond,G.bond);
const bondLen=D.bond.reduce((s,q)=>s+Math.hypot(q[2]-q[0],q[3]-q[1]),0);

// ---------- lightning protection: masts, wire on holders, protection zones
const roofMasts=D.masts.filter(m=>m[2]===4), groundMasts=D.masts.filter(m=>m[2]===6);
const mBaseM=[], mRodM=[], mTipM=[];
roofMasts.forEach(m=>{ const z=surfZ(m[0],m[1]); mBaseM.push(new THREE.Matrix4().makeTranslation(m[0],z+0.07,-m[1])); mRodM.push(new THREE.Matrix4().makeTranslation(m[0],z+0.14+1.43,-m[1])); mTipM.push(new THREE.Matrix4().makeTranslation(m[0],z+3.0+0.5,-m[1])); });
const mbaseIM=info(inst(new THREE.CylinderGeometry(0.24,0.26,0.14,16),MAT.mbase,mBaseM,G.lps),'Бетонна основа 32 кг блискавкоприймача М-04/40');
const rodIM=inst(new THREE.CylinderGeometry(0.035,0.035,2.86,8),MAT.alu,mRodM,G.lps); info(rodIM,'Блискавкоприймач М-04/40, L = 4,0 м\nшпиль Ø16 + Ø10 (на макеті товщий), зона захисту R 9,9 м');
const mtipIM=inst(new THREE.CylinderGeometry(0.022,0.022,1.0,8),MAT.alu,mTipM,G.lps);
// two 6 m masts on tripods at MS-3
groundMasts.forEach(m=>{ const g=new THREE.Group(); g.position.set(m[0],0,-m[1]); G.lps.add(g);
  for(let k=0;k<3;k++){ const a=k*2*Math.PI/3; const f=box(0.03,1.6,0.03,MAT.alu,Math.cos(a)*0.45,0.75,Math.sin(a)*0.45,g); f.rotation.set(Math.sin(a)*0.33,0,-Math.cos(a)*0.33); box(0.3,0.15,0.3,MAT.mbase,Math.cos(a)*0.85,0.075,Math.sin(a)*0.85,g); }
  const mm=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.045,6,8),MAT.mast6); mm.position.y=3.0; mm.castShadow=true; g.add(mm); info(mm,'Блискавкоприймач М-05/60 на тринозі, L = 6,0 м\nзахист групи MS-3'); });
// wire Ø8 on concrete holders H-303
const wirePairs=[], wireLen=D.wire.reduce((s,q)=>s+Math.hypot(q[2]-q[0],q[3]-q[1]),0), holdStep=Math.max(0.5,wireLen/3200);
const holdM=[];
D.wire.forEach(s=>{ pairsOf(route(s[0],s[1],s[2],s[3],0.13,0.1),wirePairs); const L=Math.hypot(s[2]-s[0],s[3]-s[1]), n=Math.max(1,Math.round(L/holdStep));
  for(let i=0;i<=n;i++){ const t=i/n, X=s[0]+(s[2]-s[0])*t, Y=s[1]+(s[3]-s[1])*t, z=surfZ(X,Y); if(z===null) continue; holdM.push(new THREE.Matrix4().makeTranslation(X,z+0.055,-Y)); } });
const wireLine=segLines(wirePairs,LINE.wire,G.lps);
const holdIM=info(inst(new THREE.CylinderGeometry(0.06,0.08,0.11,8),MAT.holder,holdM,G.lps,false),'Тримач дроту H-303 з бетоном\nна смузі ПВХ-мембрани К-303');
// protection zones R = 9,9 m at module level
const zonePairs=[]; roofMasts.forEach(m=>{ let prev=null; for(let k=0;k<=72;k++){ const a=k/72*Math.PI*2, X=m[0]+9.9*Math.cos(a), Y=m[1]+9.9*Math.sin(a); const z=surfZ(X,Y); const v=W(X,Y,(z===null?roofZ(Math.max(0,Math.min(96,X))):z)+0.62); if(prev) zonePairs.push(prev,v); prev=v; } });
segLines(zonePairs,LINE.zone,G.zones);

// ---------- down conductors, test joints K-682, strip W-25×4, rods G-16/30
const CENTRES=[['R',48.2,48],['A',63.5,-21.5],['B',85.8,-19],['C1',122,-15.5],['C2',150.6,-15.5]];
const downPairs=[], downM=[], k682M=[], stripM=[], rodM=[], stripUG=[];
D.down.forEach(p=>{ let top=0; for(const dx of [-0.6,0,0.6]) for(const dy of [-0.6,0,0.6]){ const z=surfZ(p[0]+dx,p[1]+dy); if(z!==null&&z>top) top=z; }
  let best=null; const onShop=p[0]>=SHOP[0]-0.3&&p[0]<=SHOP[1]+0.3&&p[1]>=SHOP[2]-0.3&&p[1]<=SHOP[3]+0.3;
  CENTRES.forEach(c=>{ if(onShop!==(c[0]==='R')) return; const d=Math.hypot(p[0]-c[1],p[1]-c[2]); if(!best||d<best.d) best={c,d}; });
  // outward direction: snap to the facade the point sits on
  let ox=p[0]-best.c[1], oy=p[1]-best.c[2]; const P=best.c[0]==='R'?null:POLY[best.c[0]];
  if(best.c[0]==='R'){ const fx=Math.min(Math.abs(p[0]-SHOP[0]),Math.abs(p[0]-SHOP[1])), fy=Math.min(Math.abs(p[1]-SHOP[2]),Math.abs(p[1]-SHOP[3])); if(fx<fy) oy=0; else ox=0; }
  else if(Math.abs(ox)/14>Math.abs(oy)/9) oy=0; else ox=0;
  const L=Math.hypot(ox,oy)||1; ox/=L; oy/=L;
  const X=p[0]+ox*0.06, Y=p[1]+oy*0.06;
  downPairs.push(W(X,Y,top),W(X,Y,0.9)); downM.push(new THREE.Matrix4().compose(W(X,Y,(top+0.9)/2),new THREE.Quaternion(),new THREE.Vector3(1,top-0.9,1)));
  k682M.push(new THREE.Matrix4().makeTranslation(X,0.75,-Y));
  stripM.push(new THREE.Matrix4().compose(W(X,Y,0.3),new THREE.Quaternion(),new THREE.Vector3(1,1,1)));
  const gx=p[0]+ox*1.5, gy=p[1]+oy*1.5;
  stripUG.push([p[0],p[1],gx,gy]); rodM.push(new THREE.Matrix4().makeTranslation(gx,-2.0,-gy)); });
const downLine=segLines(downPairs,LINE.down,G.down);
const downIM=info(inst(new THREE.BoxGeometry(0.07,1,0.07),MAT.dwire,downM,G.down),'Спуск: дріт алюмінієвий Ø8 по фасаду (на макеті товщий)\nтримачі H-033 / H-016 / H-081');
const k682IM=info(inst(new THREE.BoxGeometry(0.36,0.46,0.24),MAT.k682,k682M,G.down),'Коробка контрольного з’єднання К-682\nзлучник C-032');
const stripIM=inst(new THREE.BoxGeometry(0.06,0.6,0.06),MAT.strip,stripM,G.down);
const rodIM2=info(inst(new THREE.CylinderGeometry(0.025,0.025,3.0,6),MAT.rod,rodM,G.downUG),'Стрижневий заземлювач G-16/30, L = 3,0 м\nзабивається вібромолотом з насадкою G-160');
const ugM=stripUG.map(s=>{ const L=Math.hypot(s[2]-s[0],s[3]-s[1]), a=Math.atan2(-(s[3]-s[1]),s[2]-s[0]); return new THREE.Matrix4().compose(W((s[0]+s[2])/2,(s[1]+s[3])/2,-0.5),new THREE.Quaternion().setFromAxisAngle(UP,a),new THREE.Vector3(L,1,1)); });
const ugIM=inst(new THREE.BoxGeometry(1,0.04,0.025),MAT.strip,ugM,G.downUG);

// ---------- ESS pads: foundations, frame, earthing (essF / essUG), equipment and canopy (essE)
const SLP=[0.5,2.105,2.71,3.315,4.37,5.425,6.48,7.535,8.59];
const essTags=[];
D.pads.forEach(p=>{ const alongY=p.axis==='y';
  const cu=alongY?(p.y0+p.y1)/2:(p.x0+p.x1)/2, cv=alongY?(p.x0+p.x1)/2:(p.y0+p.y1)/2;
  // local (u along the long side, v across, v>0 = away from the building)
  const away = alongY ? 1 : 1;
  const L2W=(u,v)=>alongY?[cv+v*away,cu+u]:[cu+u,cv+v*away];
  const bxUV=(u0,u1,v0,v1,z0,z1,mat,par)=>{ const a=L2W(u0,v0), b=L2W(u1,v1); return boxXY(Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1]),z0,z1,mat,par); };
  const len=(alongY?p.y1-p.y0:p.x1-p.x0), wid=(alongY?p.x1-p.x0:p.y1-p.y0);
  info(bxUV(-len/2,len/2,-wid/2,wid/2,-0.25,-0.005,MAT.cushion,G.essF),`${p.id}: ущільнена піщано-щебенева подушка 250 мм\nмайданчик ${nf(len,1)} × ${nf(wid,1)} м (ЕТР арк. 2)`);
  SLP.forEach(u=>{ info(bxUV(u-4.545-0.15,u-4.545+0.15,-0.8,0.8,0,0.45,MAT.sleeper,G.essF),'Лежень залізобетонний ЛЖ-16, 430 кг\n9 шт на групу (серія 3.407.1-157)'); });
  [-0.675,0.675].forEach(v=>bxUV(-4.545,4.545,v-0.032,v+0.032,0.45,0.61,MAT.frame,G.essF));
  [-4.545,4.545].forEach(u=>bxUV(u-0.032,u+0.032,-0.675,0.675,0.45,0.61,MAT.frame,G.essF));
  const FM=[[-4.725,1.1,2.75],[0,1.1,2.75],[4.725,1.1,2.75],[-4.725,-1.1,3.0],[4.725,-1.1,3.0]];
  FM.forEach(([u,v,h])=>{ info(bxUV(u-0.175,u+0.175,v-0.175,v+0.175,-1.2,0.2,MAT.fm,G.essF),'Фундамент ФМ-1, бетон С20/25 F100\nзакладна З-1, болти М16×600'); bxUV(u-0.3,u+0.3,v-0.3,v+0.3,-1.3,-1.2,MAT.fm,G.essF);
    info(bxUV(u-0.06,u+0.06,v-0.06,v+0.06,0.2,0.2+h,MAT.col,G.essE),`Стійка навісу □120×120×4, h = ${nf(h,2)} м`); });
  const hAt=v=>0.2+2.75+(1.1-v)/2.2*0.25+0.04;
  [-1.1,0,1.1].forEach(v=>bxUV(-4.69,4.69,v-0.04,v+0.04,hAt(v)-0.04,hAt(v)+0.04,MAT.col,G.essE));
  // sloped profiled sheet ПС-20 2500×9750
  const sh=new THREE.Mesh(new THREE.BoxGeometry(alongY?2.5:9.75,0.02,alongY?9.75:2.5),MAT.sheet); const mid=L2W(0,0); sh.position.set(mid[0],hAt(0)+0.06,-mid[1]);
  if(alongY) sh.rotation.z=-Math.atan(0.25/2.2); else sh.rotation.x=-Math.atan(0.25/2.2);
  sh.castShadow=true; sh.receiveShadow=true; G.essE.add(sh); info(sh,`${p.id}: навіс з профнастилу ПС-20, 9,75 × 2,5 м\nстійки 3,0 / 2,75 м`); bMeshes.push(sh);
  // cabinets (positions straight from ЕТР арк. 2)
  const top=0.61, Hc=1.85;
  p.gal.forEach((g,i)=>info(boxXY(g[0],g[1],g[2],g[3],top,top+Hc,MAT.gal,G.essE),`${p.id}: Galaxy261L №${i+1}\nLFP 261 кВт·год, рідинне охолодження, IP54`));
  p.sm.forEach(g=>info(boxXY(g[0],g[1],g[2],g[3],top,top+1.2,MAT.sm,G.essE),`${p.id}: пристрій обмеження генерації SM / щит керування`));
  const mp=p.mps; info(boxXY(mp[0],mp[1],mp[2],mp[3],top,top+Hc,MAT.mps,G.essE),`${p.id}: шафа мікромережі FFD POWER 500 кВт\nSTS · PCS · IT 500 кВА · 10 MPPT · EMS\n${nf(p.kwp,1)} кВтп → ${p.tp}`);
  // ЩР-PV and ЩР-АКБ: on the facade for MS-1/2, on a stand for MS-3
  p.pv.forEach((b,i)=>{ const X=(b[0]+b[1])/2, Y=(b[2]+b[3])/2; const m=alongY?boxXY(96.66,96.82,Y-0.25,Y+0.25,1.15,1.75,MAT.boxPV,G.essE):boxXY(X-0.25,X+0.25,120.05,120.21,1.15,1.75,MAT.boxPV,G.essE); info(m,`${p.pvn[i]} · WRP18-3\n10 ОПН T1+T2, 20 запобіжників gPV 25 А / 1000 В`); });
  const a=p.akb, Xa=(a[0]+a[1])/2, Ya=(a[2]+a[3])/2; info(alongY?boxXY(96.66,97.06,Ya-0.5,Ya+0.5,0.9,1.7,MAT.boxAKB,G.essE):boxXY(Xa-0.5,Xa+0.5,120.05,120.45,0.9,1.7,MAT.boxAKB,G.essE),`${p.akbn} · GT 80-100-40 IP66\n5 роз’єднувачів + NH2 gPV 250 А / 1000 В`);
  if(!alongY){ [[31.85,120.3],[36.2,120.3]].forEach(q=>boxXY(q[0]-0.04,q[0]+0.04,q[1]-0.04,q[1]+0.04,0,1.9,MAT.col,G.essE)); }
  const t=new THREE.Object3D(); const c=L2W(0,0); t.position.set(c[0],top+Hc+0.3,-c[1]); G.essE.add(t); essTags.push([t,p]); });
// ESS earthing: rods d16 L = 4,5 m and strip 40×4 at −0,7 m
const essRodM=D.rods.map(r=>new THREE.Matrix4().makeTranslation(r[0],-0.7-2.25,-r[1]));
const essRodIM=info(inst(new THREE.CylinderGeometry(0.025,0.025,4.5,6),MAT.rod,essRodM,G.essUG),'Стрижневий заземлювач d16, L = 4,5 м (G-16/45)\nконтур УЗЕ');
const esM=D.strip.map(s=>{ const L=Math.hypot(s[2]-s[0],s[3]-s[1]), a=Math.atan2(-(s[3]-s[1]),s[2]-s[0]); return new THREE.Matrix4().compose(W((s[0]+s[2])/2,(s[1]+s[3])/2,-0.7),new THREE.Quaternion().setFromAxisAngle(UP,a),new THREE.Vector3(L,1,1)); });
const essStripIM=info(inst(new THREE.BoxGeometry(1,0.05,0.03),MAT.strip,esM,G.essUG),'Смуга сталева 40×4 на глибині 0,7 м\nконтур заземлення УЗЕ');
const essStripLen=D.strip.reduce((s,q)=>s+Math.hypot(q[2]-q[0],q[3]-q[1]),0);

// ---------- AC lines to the substations: cable tray on the facades, troughs Л-17-8 under the road
const TRAY_H=2.6;
function trayY(X,Y0,Y1){ const m=boxXY(X,X+0.4,Math.min(Y0,Y1),Math.max(Y0,Y1),TRAY_H,TRAY_H+0.1,MAT.tray,G.ac); boxXY(X+0.1,X+0.3,Math.min(Y0,Y1),Math.max(Y0,Y1),TRAY_H+0.1,TRAY_H+0.16,MAT.cable,G.ac); return m; }
function trayX(Y,X0,X1){ const m=boxXY(Math.min(X0,X1),Math.max(X0,X1),Y,Y+0.4,TRAY_H,TRAY_H+0.1,MAT.tray,G.ac); boxXY(Math.min(X0,X1),Math.max(X0,X1),Y+0.1,Y+0.3,TRAY_H+0.1,TRAY_H+0.16,MAT.cable,G.ac); return m; }
info(trayY(96.66,34.6,78.51),'Кабельрост 400×100 на фасаді по осі 17\n12 × АВВГнгд 4×240 + 2 × F/FTP у гофротрубах d90\nMS-1, MS-2 → ТП-5913, ≈45 м');
[[66.51,'MS-1'],[78.51,'MS-2']].forEach(([Y,id])=>{ boxXY(96.7,98.73,Y-0.12,Y+0.12,TRAY_H,TRAY_H+0.08,MAT.cable,G.ac); boxXY(98.6,98.76,Y-0.12,Y+0.12,0.61+1.85,TRAY_H,MAT.cable,G.ac); });
info(trayX(96.6,19.85,34.69),'Кабельрост на фасаді по осі К\n6 × АВВГнгд 4×240 + F/FTP від MS-3');
info(trayY(19.5-0.4,96.6,106.6),'Кабельрост по стіні ТП-6923');
info(boxXY(34.39,34.99,97.2,116.6,-0.6,0.02,MAT.trough,G.ac),'Лоток інженерних мереж Л-17-8 з плитою перекриття\nпід дорогою, ≈21 м: 6 × АВВГнгд 4×240, F/FTP, H1Z2Z2-K');
boxXY(34.59,34.79,116.6,118.29,0.02,0.7,MAT.cable,G.ac); boxXY(34.59,34.79,96.6,97.2,0.02,TRAY_H,MAT.cable,G.ac);
const sh1=boxXY(99.8,100.8,33.6,34.0,0.6,1.4,MAT.boxAKB,G.ac), sh2=boxXY(101.2,102.2,33.6,34.0,0.6,1.4,MAT.boxAKB,G.ac), sh3=boxXY(9.4,10.4,105.6,106.0,0.6,1.4,MAT.boxAKB,G.ac);
[sh1,sh2].forEach((m,i)=>info(m,`ЩР-УЗЕ(AC)-${i+1} у ТП-5913 · GT 80-100-40\n2 × EB2 800 А, ТС 800/5\nна шинах ТП — без захисту на початку лінії`)); info(sh3,'ЩР-УЗЕ(AC)-3 у ТП-6923 · GT 80-100-40\n2 × EB2 800 А, ТС 800/5');
boxXY(96.9,100.43,34.39,34.59,TRAY_H,TRAY_H+0.08,MAT.cable,G.ac);
const acLen=D.ac.reduce((s,q)=>s+Math.hypot(q[2]-q[0],q[3]-q[1]),0);

// ---------- axes on the ground: 1–17 (6 m) and А–К (12 m)
const LET=['А','Б','В','Г','Д','Е','Ж','И','К'];
function rr(x,l,t,w,h,r){ x.beginPath(); x.moveTo(l+r,t); x.lineTo(l+w-r,t); x.quadraticCurveTo(l+w,t,l+w,t+r); x.lineTo(l+w,t+h-r); x.quadraticCurveTo(l+w,t+h,l+w-r,t+h); x.lineTo(l+r,t+h); x.quadraticCurveTo(l,t+h,l,t+h-r); x.lineTo(l,t+r); x.quadraticCurveTo(l,t,l+r,t); x.closePath(); }
const DECALS=[];
function decalCanvas(text,o){ const c=document.createElement('canvas'), x=c.getContext('2d'), fam='"JetBrains Mono", ui-monospace, monospace';
  const d=112; c.width=c.height=d; x.fillStyle=o.bg; x.beginPath(); x.arc(d/2,d/2,d/2-5,0,7); x.fill(); x.lineWidth=7; x.strokeStyle=o.fg; x.stroke();
  x.font=`600 ${text.length>1?52:64}px ${fam}`; x.fillStyle=o.fg; x.textAlign='center'; x.textBaseline='middle'; x.fillText(text,d/2,d/2+5); return c; }
function paintDecal(d){ const c=decalCanvas(d.text,d.o); d.tex.image=c; d.tex.needsUpdate=true; d.mesh.scale.set(d.o.h,d.o.h,1); }
function decal(text,o){ o=Object.assign({h:2.2,fg:'#2446A3',bg:'rgba(255,255,255,0.92)'},o);
  const tex=new THREE.CanvasTexture(document.createElement('canvas')); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=8;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false})); mesh.rotation.x=-Math.PI/2; mesh.renderOrder=3;
  const holder=new THREE.Object3D(); holder.add(mesh); const d={text,o,tex,mesh,holder,k:0}; DECALS.push(d); paintDecal(d); return holder; }
const axPairs=[];
[1,4,7,10,13,17].forEach(n=>{ const X=(n-1)*6; const h=decal(String(n)); h.position.set(X,0.05,4.0); G.axes.add(h); axPairs.push(W(X,-2.2,0.04),W(X,-0.6,0.04)); });
LET.forEach((l,i)=>{ const Y=i*12; const h=decal(l); h.position.set(-4.0,0.05,-Y); G.axes.add(h); axPairs.push(W(-2.8,Y,0.04),W(-0.6,Y,0.04)); });
segLines(axPairs,new THREE.LineBasicMaterial({color:0x2446a3}),G.axes);

// ---------- callouts (layout without overlaps, as in the Hostomel model)
const lbox=$('#lbl'), lsvg=lbox.querySelector('svg'), SVGNS='http://www.w3.org/2000/svg';
const TAGS=[]; let OW=0, OH=0, tagsOn=true;
function tag(text,o){ const a=new THREE.Object3D(); a.userData.tag=Object.assign({text:String(text),bg:'rgba(255,255,255,0.95)',fg:'#162026',line:'#2b3a42',pri:5,far:Infinity,c:-1,occ:false,w:0,el:null,shown:false},o||{}); TAGS.push(a); return a; }
function measureTag(t){ const s=t.el.style; s.visibility='hidden'; s.display='block'; t.w=t.el.offsetWidth; t.h=t.el.offsetHeight; s.display=t.shown?'block':'none'; s.visibility=''; }
function tagEl(t){ if(!t.el){ const d=document.createElement('div'); d.className='tg'; d.textContent=t.text; d.style.background=t.bg; d.style.color=t.fg; d.style.borderColor=t.line+'73'; d.style.display='none'; lbox.appendChild(d);
    const g=document.createElementNS(SVGNS,'g'), ln=document.createElementNS(SVGNS,'line'), c=document.createElementNS(SVGNS,'circle');
    ln.setAttribute('stroke',t.line); ln.setAttribute('stroke-width','1.2'); c.setAttribute('r','3'); c.setAttribute('fill',t.line); c.setAttribute('stroke','#fff'); c.setAttribute('stroke-width','1.2');
    g.appendChild(ln); g.appendChild(c); g.style.display='none'; lsvg.appendChild(g); Object.assign(t,{el:d,g,ln,dot:c,w:0}); }
  if(!t.w) measureTag(t); }
function hideTag(t){ if(t.shown){ t.el.style.display='none'; t.g.style.display='none'; t.shown=false; } }
const CANDS=[]; [16,32,52,80].forEach(L=>[[1,-1],[-1,-1],[1,1],[-1,1],[0,-1],[1,0],[-1,0],[0,1]].forEach(([dx,dy])=>{ const f=dx&&dy?0.72:1; CANDS.push([dx*L*f,dy*L*f,dx,dy]); }));
const _p=new THREE.Vector3(), overlap=(r,L)=>L.some(q=>r[0]<q[2]&&r[2]>q[0]&&r[1]<q[3]&&r[3]>q[1]);
function liveTags(){ const out=[]; for(const a of TAGS){ let p=a, vis=true; while(p&&p!==scene){ if(!p.visible) vis=false; p=p.parent; } if(p&&vis) out.push(a); } return out; }
function drawTags(){ const live=liveTags(), placed=new Set();
  if(tagsOn&&OW){ const vr=canvas.getBoundingClientRect(), block=[];
    ['.hud','.compass'].forEach(sel=>{ const e=$(sel); if(!e||e.hidden) return; const r=e.getBoundingClientRect(); if(r.width) block.push([r.left-vr.left-6,r.top-vr.top-6,r.right-vr.left+6,r.bottom-vr.top+22]); });
    const items=[];
    live.forEach(a=>{ const t=a.userData.tag; a.getWorldPosition(_p); const dist=_p.distanceTo(camera.position); if(dist>t.far) return;
      _p.project(camera); if(_p.z>1) return; const x=(_p.x+1)/2*OW, y=(1-_p.y)/2*OH; if(x<3||y<3||x>OW-3||y>OH-3) return; items.push({t,x,y,dist}); });
    items.sort((a,b)=>b.t.pri-a.t.pri||a.dist-b.dist);
    items.forEach(it=>block.push([it.x-5,it.y-5,it.x+5,it.y+5]));
    for(const it of items){ const t=it.t; tagEl(t); let got=null;
      const tryK=k=>{ const c=CANDS[k], ex=it.x+c[0], ey=it.y+c[1]; const l=c[2]>0?ex:c[2]<0?ex-t.w:ex-t.w/2, tp=c[3]<0?ey-t.h:c[3]>0?ey:ey-t.h/2, r=[l,tp,l+t.w,tp+t.h];
        if(l<4||tp<4||r[2]>OW-4||r[3]>OH-4||overlap(r,block)) return false; got={k,r,ex,ey}; return true; };
      if(!(t.c>=0&&tryK(t.c))) for(let k=0;k<CANDS.length;k++) if(tryK(k)) break;
      t.c=got?got.k:-1; if(!got) continue;
      block.push([got.r[0]-3,got.r[1]-3,got.r[2]+3,got.r[3]+3]); placed.add(t);
      if(!t.shown){ t.el.style.display='block'; t.g.style.display=''; t.shown=true; }
      const op=t.occ?'0.42':'1'; t.el.style.opacity=op; t.g.style.opacity=op;
      t.el.style.transform=`translate(${Math.round(got.r[0])}px,${Math.round(got.r[1])}px)`;
      t.ln.setAttribute('x1',it.x.toFixed(1)); t.ln.setAttribute('y1',it.y.toFixed(1)); t.ln.setAttribute('x2',got.ex.toFixed(1)); t.ln.setAttribute('y2',got.ey.toFixed(1));
      t.dot.setAttribute('cx',it.x.toFixed(1)); t.dot.setAttribute('cy',it.y.toFixed(1)); } }
  for(const a of TAGS){ const t=a.userData.tag; if(!placed.has(t)) hideTag(t); } }
const occRay=new THREE.Raycaster();
function computeOcc(){ const occ=G.bld.visible?bMeshes:[]; for(const a of liveTags()){ const t=a.userData.tag; if(t.noOcc||!occ.length){ t.occ=false; continue; }
  a.getWorldPosition(_p); const dd=_p.distanceTo(camera.position); occRay.set(camera.position,_p.clone().sub(camera.position).normalize()); occRay.far=Math.max(0,dd-0.6); t.occ=occRay.intersectObjects(occ,false).length>0; } }
function addTag(parent,pos,text,o){ const a=tag(text,o); a.position.copy(pos); parent.add(a); return a; }
const BLUE='#2446A3';
addTag(G.bld,W(96.64+3.2,17,4.6),'ТП-5913 · 2 × ТМЗ-2500',{pri:6});
addTag(G.bld,W(9.5,101.8,4.6),'ТП-6923 · ТМЗ-2500',{pri:6});
addTag(G.bld,W(122,-15.5,HE+9*T22),'Склад · скати 22° / 17°',{pri:6});
addTag(G.bld,W(80,-14,HE+10*T11),'Прибудови складу · 11°',{pri:4});
addTag(G.obs,W(28.4,60,roofZ(28.4)+0.6),'Зенітний ліхтар на гребені',{pri:3,far:160});
addTag(G.bld,W(36,40,HV+0.05),'Ендова між арками',{pri:3,far:140});
addTag(G.bld,W(84,30,roofZ(84)),'Проліт 13–17: 24 м (профіль умовно)',{pri:2,far:150});
essTags.forEach(([t,p])=>{ t.add(tag(`${p.id} · ${nf(p.kwp,1)} кВтп · 5 × Galaxy261L`,{pri:7,line:'#7a4a00'})); });
{ const m=roofMasts[20]; addTag(G.lps,W(m[0],m[1],surfZ(m[0],m[1])+4.0),'Блискавкоприймач М-04/40 · 4 м',{pri:3,far:120}); }
ropeTag.add(tag('Тросовий перехід DC: склад → цех',{pri:8,line:'#b85c00'}));
addTag(G.ac,W(97.1,56,TRAY_H+0.1),'Кабельрост 400×100 на фасаді',{pri:6,far:160,line:'#a32222'});
addTag(G.ac,W(34.7,107,0),'Лотки Л-17-8 під дорогою',{pri:5,far:160,line:'#a32222'});

// ---------- tooltip
const tip=$('#tip'), mouse=new THREE.Vector2(), pr=new THREE.Raycaster();
function visibleChain(o){ let p=o; while(p){ if(!p.visible) return false; if(p===scene) return true; p=p.parent; } return false; }
function showTip(e){ const r=canvas.getBoundingClientRect(); mouse.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1);
  pr.setFromCamera(mouse,camera); const hits=pr.intersectObjects(pick.filter(visibleChain),false);
  if(!hits.length){ tip.hidden=true; return false; }
  const h=hits[0], o=h.object; let txt=o.userData.infoFn&&h.instanceId!==undefined?o.userData.infoFn(h.instanceId):o.userData.info; if(!txt){ tip.hidden=true; return false; }
  if(o.userData.node) txt+='\n▸ клацніть — розібрати вузол';
  tip.hidden=false; tip.textContent=txt;
  const x=Math.min(e.clientX-r.left+12, r.width-tip.offsetWidth-8), y=Math.min(e.clientY-r.top+12, r.height-tip.offsetHeight-8);
  tip.style.left=Math.max(0,x)+'px'; tip.style.top=Math.max(0,y)+'px'; return true; }
let tipT=0, downAt=null, tipRaf=0;
canvas.addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'){ cancelAnimationFrame(tipRaf); tipRaf=requestAnimationFrame(()=>showTip(e)); } });
canvas.addEventListener('pointerdown',e=>{ downAt=[e.clientX,e.clientY]; if(e.pointerType!=='mouse'){ tip.hidden=true; clearTimeout(tipT); } });
canvas.addEventListener('pointerup',e=>{ if(e.pointerType==='mouse'||!downAt) return; if(Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])<8&&showTip(e)){ clearTimeout(tipT); tipT=setTimeout(()=>tip.hidden=true,4000); } downAt=null; });
let clickAt=null;
canvas.addEventListener('pointerdown',e=>{ clickAt=[e.clientX,e.clientY]; });
canvas.addEventListener('pointerup',e=>{ if(!clickAt) return; const mv=Math.hypot(e.clientX-clickAt[0],e.clientY-clickAt[1]); clickAt=null; if(mv>6) return;
  const r=canvas.getBoundingClientRect(); mouse.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1); pr.setFromCamera(mouse,camera);
  const hit=pr.intersectObjects(pick.filter(visibleChain),false)[0]; if(hit&&hit.object.userData.node&&hit.instanceId!==undefined) openNodeFromHit(hit); });
canvas.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse') tip.hidden=true; });
