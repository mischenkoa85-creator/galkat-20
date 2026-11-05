// ================= Меню шаблону: 5 розділів по колу і підрозділи під ними (src/menu5.js, 05.11.2026)
// Власник 05.11, 15:51–16:08: рядок над моделлю (Електрика · Стан модулів · Стрінги · Радіація) переноситься вниз; розділи — Об'єкт, Сонце і генерація,
// Конструкція, Електрика, Гроші; під вибраним розділом — ряд підрозділів, натиснув — змінюється модель і картка. «Кут і розміщення» — варіанти кута
// з обчисленим найкращим за генерацією і за ціною кВт·год. Немає даних — підрозділ пише «потрібно: …», без вигаданих чисел.
// Під капотом лишаються розділи двійника (pz, sun, uze, eko, mont) і шари (stat, str, rad, e04, uAC); тут — лише вибір і власні панелі.
{ const T_=window.__twin, ST=T_.stages, RN=T_.roofnode;
if(T_.clean&&ST){
const E=typeof EKO!=='undefined'?EKO:null, KU=typeof KUT!=='undefined'?KUT:null, f0=v=>nf(v,0), f1=v=>nf(v,1), usd=v=>nf(Math.round(v))+' $';
const L0={stat:false,str:false,rad:false,e04:false};
const MENU=[
 ['obj','Об\'єкт',[['tu','Технічні умови',{sec:'pz'}],['mont','Монтаж — ролик',{sec:'mont'}]]],
 ['gen','Сонце і генерація',[['rad','Радіація',{sec:'sun',lay:{rad:true}}],['kut','Кут і розміщення',{sec:'sun',pane:'kut'}],['stat','Стан модулів і доба',{sec:'sun',lay:{stat:true}}],
   ['rik','Рік',{sec:'sun',pane:'rik'}],['flow','Потоки енергії',{sec:'sun',pane:'flow',need:1}]]],
 ['kon','Конструкція',[['kr','Кріплення',{sec:'pz',pane:'kr',cam:'near'}],['bal','Баласт',{sec:'pz',pane:'bal'}],['roz','Розбір на елементи',{sec:'pz',pane:'roz',cam:'near'}],['nav','Навантаження',{sec:'pz',pane:'nav',cam:'top'}],['obs','Обстеження',{sec:'pz',pane:'obs',need:1}]]],
 ['el','Електрика',[['str','Стрінги',{sec:'pz',lay:{str:true}}],['shch','Щити PV',{sec:'pz',lay:{e04:true}}],['lin','Лінії Al',{sec:'pz',lay:{e04:true},cam:'top'}],
   ['shv','Шафи (Al → Cu)',{sec:'pz',lay:{e04:true},cam:'ess'}],['kont','Контейнери',{sec:'uze'}],['bz','Блискавкозахист',{sec:'pz',pane:'bz'}]]],
 ['gr','Гроші',[['ok','Окупність',{sec:'eko'}],['obl','Обладнання',{sec:'pz',pane:'obl'}],['kn','Конструкція',{sec:'pz',pane:'kn'}],['mn','Монтаж',{sec:'pz',pane:'mn'}],
   ['ksh','Кошторис',{sec:'pz',pane:'ksh'}],['sp','Специфікація',{sec:'pz',pane:'sp'}],['bud','Під бюджет',{sec:'pz',pane:'bud'}]]]];
const M5=state.lay.m5&&MENU.some(([k])=>k===state.lay.m5.s)?state.lay.m5:(state.lay.m5={s:'obj',sub:'tu'});
const cur=()=>{ const S_=MENU.find(([k])=>k===M5.s)||MENU[0], sub=S_[2].find(([k])=>k===M5.sub)||S_[2][0]; return {S:S_,sub}; };
// ---------- розмітка: рядок шарів над моделлю ховаємо; під розділами — підрозділи
{ const st=document.createElement('style'); st.textContent=`#modes{display:none!important} #tabs > button:not(.m5){display:none!important}
.m5p > .wide,.m5p > .ph,.m5p > .kpis{grid-column:1/-1} #subs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:6px 12px 2px;border-bottom:1px solid var(--line)} #subs::-webkit-scrollbar{display:none}
#subs button{flex:none;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);border-radius:999px;padding:4px 11px;font:inherit;font-size:12.5px;white-space:nowrap}
#subs button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink);font-weight:600} #subs button.need{border-style:dashed}
.m5p .need{border:1px dashed var(--line-2);border-radius:10px;padding:10px 12px;color:var(--ink-2);font-size:13px} .m5p .need b{color:var(--ink)}
.m5p .best{display:inline-block;font:600 10.5px var(--font);padding:1px 6px;border-radius:6px;margin-left:6px;background:var(--surface-3);color:var(--ink)} .m5p tr.cur td{background:var(--surface-2)}
.m5p .kb{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px} .m5p .kb button{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:5px 10px;font:inherit;font-size:12.5px;color:var(--ink)}
.m5p .kb button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)} .m5p input[type=number]{font:inherit;padding:5px 8px;border:1px solid var(--line);border-radius:8px;width:160px;background:var(--surface);color:var(--ink)}`; document.head.appendChild(st);
  const sb=document.createElement('div'); sb.id='subs'; sb.setAttribute('role','group'); sb.setAttribute('aria-label','Підрозділи'); const tbar=document.querySelector('.tabbar'); tbar.parentNode.insertBefore(sb,tbar.nextSibling); }
const tabs=$('#tabs');
MENU.forEach(([k,t])=>{ const b=document.createElement('button'); b.type='button'; b.className='m5'; b.setAttribute('role','tab'); b.dataset.s5=k; b.textContent=t; tabs.appendChild(b); b.onclick=()=>go(k); });
$('#tabPrev').onclick=()=>step5(-1); $('#tabNext').onclick=()=>step5(1);
function step5(d){ const i=MENU.findIndex(([k])=>k===M5.s); go(MENU[(i+d+MENU.length)%MENU.length][0]); }
const LAST={}; MENU.forEach(([k,,subs])=>LAST[k]=subs[0][0]);
function go(s,sub){ if(sub===undefined) sub=LAST[s]||MENU.find(([k])=>k===s)[2][0][0]; M5.s=s; M5.sub=sub; LAST[s]=sub;
  const {sub:sb}=cur(), o=sb[2]; Object.assign(state.lay,L0,o.lay||{}); if(o.sec==='uze') state.lay.uAC=true; state.sec=o.sec; if(state.sheet==='peek') sheetSet('half');
  apply(); if(o.cam==='near') camNear(); else if(o.cam&&VIEWS[o.cam]) goCam(o.cam); if(o.pane==='roz') explode(); }
// ---------- камера до модуля зблизька (кріплення видно ближче 16 м)
function camNear(){ if(!RN) return; const st=state.lay.stg, g=st==='1'?'wh':'roof', ms=RN.MODS.filter(m=>m.grp===g&&m.nb.mv&&m.nb.pu&&!m.nb.mu); const m=ms[Math.floor(ms.length*0.35)]||RN.MODS[0];
  const p=m.c.clone().addScaledVector(m.w,1.3).addScaledVector(m.v,-1.9).addScaledVector(m.u,-2.4), t=m.c.clone().addScaledVector(m.u,-1.1); goTo({p:p.toArray(),c:t.toArray()}); }
let exT=null; function explode(){ if(!RN||!RN.setEx) return; const t0=performance.now(); cancelAnimationFrame(exT); const st=()=>{ const f=Math.min(1,(performance.now()-t0)/1400); RN.setEx(f*f*(3-2*f)); if(f<1) exT=requestAnimationFrame(st); }; setTimeout(()=>{ exT=requestAnimationFrame(st); },900); }
// ---------- власні панелі
const stgN=()=>state.lay.stg==='1'?'Етап 1':state.lay.stg==='2'?'Етап 2 · дах цеху':'Весь об\'єкт';
const needB=(t,list)=>`<div class="blk wide"><div class="need"><b>${t}</b>${list?`<ul class="open" style="margin-top:6px">${list.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}</div></div>`;
const head=(ey,h,p)=>`<div class="ph" style="grid-column:1/-1"><span class="eyebrow ours">${ey}</span><h2>${h}</h2>${p?`<p>${p}</p>`:''}</div>`;
function pKut(){ if(!KU) return needB('Потрібно: розрахунок кутів (calc/kut/kut_twin.py).');
  const R=KU.roof, pr=R.filter(x=>x.c_kwh), bG=R.reduce((a,x)=>x.mwh>a.mwh?x:a), bP=pr.length?pr.reduce((a,x)=>x.c_kwh<a.c_kwh?x:a):null, sel=state.lay.kutR||'laga0', S_=R.find(x=>x.k===sel)||R[0];
  const kb=`<div class="kb" role="group" aria-label="Кут на даху">${R.map(x=>`<button type="button" data-kut="${x.k}" aria-pressed="${x.k===sel}">${x.kut}${x.k.startsWith('dom')?' домик':x.k==='laga0'?' по арці':''}</button>`).join('')}</div>`;
  const ff=KU.fac, side=state.lay.kutF||'S', F=ff.filter(x=>x.f===side), bF=F.reduce((a,x)=>(x.tw?x.tw.kwh_kwp:x.kwh_kwp)>(a.tw?a.tw.kwh_kwp:a.kwh_kwp)?x:a);
  return head('Сонце і генерація · кут і розміщення',`Дах цеху: ${S_.n}`,`${S_.d}. Найбільше на 1 модуль — ряди на південь під ${nf(KU.opt.nahyl,0)}° (${f0(KU.opt.h)} кВт·год/м² за рік без тіні, горизонталь ${f0(KU.ghi)}), але крок рядів зростає і на те саме поле стає менше модулів.`)+
  `<div class="blk wide">${kb}<div class="kpis"><div class="kpi"><span class="k">Радіація на площину</span><span class="v">${f0(S_.h)} <small>кВт·год/м²</small></span><span class="s">з тінню рядів</span></div>
  <div class="kpi"><span class="k">Модулів на полі даху</span><span class="v">${nf(S_.mods)}</span><span class="s">${f1(S_.kwp)} кВтп</span></div>
  <div class="kpi"><span class="k">Генерація за рік</span><span class="v">${f0(S_.mwh)} <small>МВт·год</small></span><span class="s">${f0(S_.kwh_kwp)} кВт·год/кВтп</span></div>
  <div class="kpi"><span class="k">Ціна СЕС до PCS</span><span class="v">${S_.price?f0(S_.price)+' <small>$/кВтп</small>':'—'}</span><span class="s">${S_.price?`${usd(S_.usd)} · ${nf(S_.c_kwh*100,2)} ¢ за кВт·год за 20 років`:'потрібно: ціна вузла під цей кут'}</span></div></div></div>
  <div class="blk wide"><h3>Усі варіанти даху цеху</h3><div class="tw"><table class="cmp an"><thead><tr><th>Варіант</th><th>кВт·год/м²</th><th>Модулів</th><th>кВтп</th><th>МВт·год</th><th>кВт·год/кВтп</th><th>$/кВтп</th><th>¢ за кВт·год</th></tr></thead><tbody>
  ${R.map(x=>`<tr class="${x.k===sel?'cur':''}"><td class="w">${x.n}${x===bG?'<span class="best">найбільше МВт·год</span>':''}${x===bP?'<span class="best">найдешевша кВт·год</span>':''}<small>${x.src}</small></td><td>${f0(x.h)}</td><td>${nf(x.mods)}</td><td>${f1(x.kwp)}</td><td>${f0(x.mwh)}</td><td>${f0(x.kwh_kwp)}</td><td>${x.price?f0(x.price):'—'}</td><td>${x.c_kwh?nf(x.c_kwh*100,2):'—'}</td></tr>`).join('')}</tbody></table></div>
  <p class="src">Висновок: на цьому даху найбільше енергії дає укладання по арці (${f0(bG.mwh)} МВт·год), ${bP?`і кіловат-година в нього найдешевша з порахованих (${nf(bP.c_kwh*100,2)} ¢)`:'ціни є не для всіх варіантів'}. Ряди під кутом дають більше з модуля, але на поле вміщається на 40–60 % менше модулів. ${KU.note} Ціна — зведення 23.10 (СЕС до PCS, матеріали з Китаю і роботи); для 10°, 20°, 25°, 30°, оптимуму й «домика» ціни вузла ще немає — потрібно порахувати вузли в «Елементах SES».</p></div>
  <div class="blk wide"><h3>Фасади</h3><div class="kb" role="group" aria-label="Фасад">${[['S','Південний'],['E','Східний']].map(([k,t])=>`<button type="button" data-kutf="${k}" aria-pressed="${k===side}">${t}</button>`).join('')}</div>
  <table class="cmp an"><thead><tr><th>Варіант</th><th>кВт·год/м²</th><th>кВт·год/кВтп</th><th>З двійника, з тінню</th></tr></thead><tbody>${F.map(x=>`<tr><td class="w">${x.n}${x===bF?'<span class="best">найбільше з модуля</span>':''}</td><td>${f0(x.h)}</td><td>${f0(x.kwh_kwp)}</td><td>${x.tw?`${f0(x.tw.kwh_kwp)} кВт·год/кВтп · ${x.tw.mods} модулів`:'—'}</td></tr>`).join('')}</tbody></table>
  <p class="src">Один ряд без тіні від будівлі. Козирок дає з модуля більше, але ряди один над одним затінюють (на півдні між рядами потрібно ≈3 м по висоті), і вузол дорожчий; ціни вузлів козирка — потрібно.</p></div>`; }
function pRik(){ const S=ST.sums(), G=[['ab','АБК','1'],['fac','Фасади','1'],['lan','Ліхтарі','1'],['wh','Склад','1'],['roof','Дах цеху','2']];
  return head('Сонце і генерація · рік',`${stgN()}: ≈${f0((state.lay.stg==='1'?S.s1:state.lay.stg==='2'?S.s2:S.all).mwh)} МВт·год за рік`,'Річна генерація по групах — розрахунки розкладок і моделі АБК; доба і пори року — у «Стан модулів і доба».')+
  `<div class="blk wide"><table class="cmp an"><thead><tr><th>Група</th><th>Етап</th><th>Модулів</th><th>кВтп</th><th>МВт·год</th><th>кВт·год/кВтп</th></tr></thead><tbody>${G.map(([k,n,e])=>{ const x=S[k]; return `<tr><td class="w">${n}</td><td>${e}</td><td>${nf(x.st)}</td><td>${f1(x.kwp)}</td><td>${f1(x.mwh)}</td><td>${f0(x.mwh*1000/x.kwp)}</td></tr>`; }).join('')}
  <tr class="tot"><td class="w">Разом</td><td></td><td>${nf(S.all.st)}</td><td>${f1(S.all.kwp)}</td><td>${f1(S.all.mwh)}</td><td>${f0(S.all.mwh*1000/S.all.kwp)}</td></tr></tbody></table></div>`; }
const BOM=RN?RN.BOM:{}, KG={blk:12.98,mat:0.338,sleeve:0.36,sleeveE:0.18,cpl:0.08,rod:0.62,jam:0.006,mcl:0.07,zcl:0.06,ang:1.36,mrail:0.25,lbolt:0.02};
const NM={blk2:'Додатковий блок — край поля (F, G)',mat2:'Мат під додатковий блок',lag:'Лага 41×41×1,5, м',xprof:'Крайній профіль 41×41, м',blk:'Блок 300×300×60 з муфтою',mat:'Мат 320×320×3',lbolt:'Болт M8×20 + шайба DIN 9021',sleeve:'Гільза П 200 з 2 болтами M8',sleeveE:'Гільза П 100 з болтом M8',
  cpl:'Муфта M10×50',rod:'Шпилька M10 1 299 мм',jam:'Контргайка M10',mcl:'Середній притиск M8×60',zcl:'Крайній притиск Z33',ang:'Кутник 150×150×6',mrail:'Міні-рейка 380 мм',scr:'Саморізи 5,5×25 EPDM (×6), комплектів'};
const bomRows=keys=>{ const G=[['roof','Дах цеху'],['wh','Склад'],['lan','Ліхтарі']].filter(([g])=>BOM[g]), ks=keys||[...new Set(G.flatMap(([g])=>Object.keys(BOM[g].q)))];
  return `<div class="tw"><table class="cmp an"><thead><tr><th>Деталь</th>${G.map(([,n])=>`<th>${n}</th>`).join('')}</tr></thead><tbody>${ks.map(k=>`<tr><td class="w">${NM[k]||k}</td>${G.map(([g])=>{ const v=BOM[g].q[k]; return `<td>${v?(k==='lag'||k==='xprof'?f1(v):nf(Math.round(v))):'—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`; };
function pKr(){ return head('Конструкція · кріплення','Кріплення до болта — з моделі','Деталі видно зблизька: камера підлітає до модулів даху (етап 2) або складу (етап 1). Кількості — по кожному модулю моделі з його сусідами.')+`<div class="blk wide">${bomRows()}<p class="src">Дах цеху — «Лага 0°», арка 18 м (elements-ses); склад — розрахунок 26.10 на 176 модулів; ліхтарі — притиски на рейках 41×41 (на що спирати рейки — не вирішено). Фасади — «Кубики фасаду», АБК — модель АБК.</p></div>`; }
function pBal(){ const q=(BOM.roof||{q:{}}).q, b=(q.blk||0)+(q.blk2||0), m=(q.mat||0)+(q.mat2||0), kgB=b*12.98+m*0.338, lag=(q.lag||0)*1.743+(q.xprof||0)*1.743, S=ST.sums(), mods=S.roof.n*36.5, F=KU?KU.field:5808;
  return head('Конструкція · баласт',`Дах цеху: ${nf(Math.round(b))} блоків · ${f1(kgB/1000)} т`,'Стандартний блок 300×300×60 з муфтою на маті 5 мм — 2 на панель на кожній лазі через 1 200 мм; додаткові блоки — лише по краях поля (вітрові зони F і G, бортики), у середині — без додаткового (рішення 04.11, вітер за ДБН).')+
  `<div class="kpis"><div class="kpi"><span class="k">Баласт даху цеху</span><span class="v">${f1(kgB/1000)} <small>т</small></span><span class="s">${nf(Math.round(q.blk||0))} основних (2 на панель на лазі) + ${nf(Math.round(q.blk2||0))} по краю поля</span></div>
  <div class="kpi"><span class="k">Метал даху</span><span class="v">${f1((lag+Object.entries(q).reduce((s_,[k,v])=>s_+(KG[k]&&k!=='blk'&&k!=='mat'?KG[k]*v:0),0))/1000)} <small>т</small></span><span class="s">лаги ${f0(q.lag||0)} м по 1,743 кг/м</span></div>
  <div class="kpi"><span class="k">Модулі даху</span><span class="v">${f1(mods/1000)} <small>т</small></span><span class="s">${nf(S.roof.n)} × 36,5 кг</span></div>
  <div class="kpi"><span class="k">Навантаження на поле</span><span class="v">${f0((kgB+lag+mods)/F)} <small>кг/м²</small></span><span class="s">на ${nf(F)} м² поля розкладки</span></div></div>
  ${needB('Потрібно для перевірки покрівлі:',['несуча здатність покриття цеху (обстеження) — порівняти з навантаженням вище','додаткові блоки по краях поля — кількість з розрахунку вітру за ДБН на поточну розкладку'])}`; }
function pRoz(){ return head('Конструкція · розбір на елементи','Вузол даху цеху — розібрано','Камера підлітає до краю ряду, деталі розходяться вгору шарами: мат і блок, гільза з муфтою і шпилька, лага, болти, притиски над модулем. Інший підрозділ — вузол збирається назад.')+`<div class="blk wide">${bomRows(['mat','blk','lbolt','lag','sleeve','cpl','rod','jam','mcl','zcl','xprof','ang'])}</div>`; }
function pBz(){ return head('Електрика · блискавкозахист','Блискавкозахист без щогл','Рішення власника 25.10: без щогл, найдешевший практичний варіант — зрівнювання потенціалів конструкцій СЕС, PE до заземлення ТП; контейнери — свій контур заземлення (у «Контейнерах»).')+needB('Потрібно: перерахувати том 7 «БЗ» під поточну розкладку (дах В1, фасади, ліхтарі, склад, АБК) і показати провідники в моделі.'); }
function pObl(){ if(!E) return needB('Потрібно: розрахунок економіки.'); const v=E.var[state.lay.ekoM||'lim'], x=state.lay.stg==='1'?v.plan:v.max;
  return head('Гроші · обладнання',`${stgN()==='Етап 2 · дах цеху'?'Весь об\'єкт':stgN()}: ${usd(x.cap.razom)}`,'Капвитрати під ключ, як у розрахунку економіки: СЕС — за кошторисом 26.10 на кВтп, контейнер — під ключ, EMS — окремо.')+
  `<div class="blk wide"><table class="cmp an"><tbody><tr><td class="w">СЕС, ${f1(x.pv)} кВтп × 424 $/кВтп</td><td>${usd(x.cap.ses)}</td></tr><tr><td class="w">Накопичувачі, ${x.nb} контейнери Golen LES-H20 під ключ</td><td>${usd(x.cap.uze)}</td></tr>
  <tr><td class="w">EMS (E-Systems)</td><td>${usd(x.cap.ems)}</td></tr><tr class="tot"><td class="w">Разом, без ПДВ</td><td>${usd(x.cap.razom)}</td></tr></tbody></table>
  <p class="src">Контейнер: 190 000 $ FOB Шанхай + доставка ≈15 000 $; під ключ з фундаментом, заземленням, AC за вимогою Golen — 261 690 $ (кошторис 26.10).</p></div>`; }
function pKn(){ const q=(BOM.roof||{q:{}}).q, w=(BOM.wh||{q:{}}).q, blk=(q.blk||0)*3, lag=(q.lag||0)*190/45.04;
  return head('Гроші · конструкція','Кріплення — кількості з моделі, ціни де відомі','Ціни: блок з муфтою і матом — 3 $ (рішення 26.10); лага 41×41 — 190 грн/м (зведення 23.10).')+
  `<div class="blk wide"><table class="cmp an"><thead><tr><th>Позиція</th><th>Кількість</th><th>Ціна</th><th>Сума</th></tr></thead><tbody>
  <tr><td class="w">Блоки з муфтою і матом, дах цеху</td><td>${nf(Math.round(q.blk||0))}</td><td>3 $</td><td>${usd(blk)}</td></tr><tr><td class="w">Лага 41×41×1,5, м</td><td>${f0(q.lag||0)}</td><td>4,22 $/м</td><td>${usd(lag)}</td></tr>
  <tr class="tot"><td class="w">Разом відомого</td><td></td><td></td><td>${usd(blk+lag)}</td></tr></tbody></table></div>`+needB('Потрібно ціни:',['гільза П з муфтою, шпилька M10, контргайки, притиски, кутники, крайній профіль — з відповідей Koka / XinYang / Lianxiang',`склад: міні-рейки ${nf(Math.round(w.mrail||0))}, притиски ${nf(Math.round((w.mcl||0)+(w.zcl||0)))}`,'фасади і ліхтарі — вузли з «Елементів SES»']); }
function pMn(){ const S=ST.sums(); return head('Гроші · монтаж',`Роботи СЕС: ${usd(S.all.kwp*50)}`,'50 $/кВт — монтаж СЕС, пусконалагодження й електрика (рішення 26.10); EMS і фундаменти — окремо.')+
  `<div class="blk wide"><table class="cmp an"><tbody><tr><td class="w">Етап 1 · ${f1(S.s1.kwp)} кВтп</td><td>${usd(S.s1.kwp*50)}</td></tr><tr><td class="w">Етап 2 · ${f1(S.s2.kwp)} кВтп</td><td>${usd(S.s2.kwp*50)}</td></tr>
  <tr class="tot"><td class="w">Разом</td><td>${usd(S.all.kwp*50)}</td></tr></tbody></table><p class="src">Покроково — «Об'єкт» → «Монтаж — ролик».</p></div>`; }
function pKsh(){ return head('Гроші · кошторис','Кошторис під поточну розкладку','Збирається з тих самих даних: «Обладнання», «Конструкція», «Монтаж».')+needB('Потрібно: кошторис по позиціях на поточний об\'єкт (дах В1, фасади 429, ліхтарі, склад 176, АБК, 4 контейнери) — попередній кошторис 26.10 був на 3 контейнери і інший склад поверхонь.'); }
function pSp(){ const S=ST.sums(); return head('Гроші · специфікація','Специфікація з моделі',`${nf(S.all.n)} модулів ZNSHINE ZXN8-BD132-730 (${nf(S.all.st)} у стрінгах, ${S.all.lit} на освітлення) · 4 контейнери Golen LES-H20-1205W500C-PS.`)+
  `<div class="blk wide"><table class="cmp an"><tbody>${[['АБК',S.ab],['Фасади',S.fac],['Ліхтарі',S.lan],['Склад',S.wh],['Дах цеху',S.roof]].map(([n,x])=>`<tr><td class="w">Модулі · ${n}</td><td>${nf(x.n)}</td></tr>`).join('')}</tbody></table></div><div class="blk wide"><h3>Кріплення</h3>${bomRows()}</div>`; }
function pBud(){ if(!E) return needB('Потрібно: розрахунок економіки.'); const S=ST.sums(), mn=E.var.lim.min, efM=mn.ef/mn.ses, B=+(state.lay.budU||500000), goal=state.lay.budG||'ef';
  const G=[['ab','АБК'],['fac','Фасади'],['lan','Ліхтарі'],['wh','Склад'],['roof','Дах цеху']].map(([k,n])=>{ const x=S[k]; return {n,kwp:x.kwp,mwh:x.mwh,cap:x.kwp*424,ef:x.mwh*efM}; }).sort((a,b)=>b.mwh/b.cap-a.mwh/a.cap);
  let left=B; const pick=[]; G.forEach(g=>{ if(g.cap<=left){ pick.push({...g,f:1}); left-=g.cap; } else if(left>2e4){ const f=left/g.cap; pick.push({...g,kwp:g.kwp*f,mwh:g.mwh*f,cap:left,ef:g.ef*f,f}); left=0; } });
  const tot=pick.reduce((s_,g)=>({kwp:s_.kwp+g.kwp,mwh:s_.mwh+g.mwh,cap:s_.cap+g.cap,ef:s_.ef+g.ef}),{kwp:0,mwh:0,cap:0,ef:0});
  return head('Гроші · під бюджет',`${usd(B)} → ${f1(tot.kwp)} кВтп · ≈${f0(tot.mwh)} МВт·год`,'Поверхні набираються від найвигіднішої (МВт·год на 1 $) до кінця бюджету; ціна СЕС — 424 $/кВтп, ефект — як у розрахунку «лише СЕС».')+
  `<div class="blk wide"><div class="kb"><input type="number" id="budU" min="50000" step="50000" value="${B}" aria-label="Бюджет, $"> <span class="seg" role="group" aria-label="Ціль">${[['ef','Економія'],['gen','Генерація']].map(([k,t])=>`<button type="button" data-budg="${k}" aria-pressed="${goal===k}">${t}</button>`).join('')}</span></div>
  <table class="cmp an"><thead><tr><th>Поверхня</th><th>кВтп</th><th>МВт·год</th><th>Капвитрати</th><th>Ефект за рік</th></tr></thead><tbody>${pick.map(g=>`<tr><td class="w">${g.n}${g.f<1?` <small>частина ${f0(g.f*100)} %</small>`:''}</td><td>${f1(g.kwp)}</td><td>${f0(g.mwh)}</td><td>${usd(g.cap)}</td><td>${usd(g.ef)}</td></tr>`).join('')}
  <tr class="tot"><td class="w">Разом · окупність ${f1(tot.cap/(tot.ef-tot.cap*0.0177))} року</td><td>${f1(tot.kwp)}</td><td>${f0(tot.mwh)}</td><td>${usd(tot.cap)}</td><td>${usd(tot.ef)}</td></tr></tbody></table>
  <p class="src">${goal==='gen'?'Ціль «генерація»: за однакової ціни кВтп порядок той самий — спершу поверхні з найбільшим виробітком на кВтп.':'Ціль «економія»: ефект — гроші на рік, окупність — проста, з експлуатацією 1,77 %.'} Накопичувачі під бюджет — коли буде погодинне споживання АСКОЕ (зараз їх ефект рахується лише для 4 контейнерів у «Окупності»).</p></div>`; }
// ---------- навантаження: вітер (EN 1991-1-4 / c_net — інженерне припущення, calc/ep04/wind*.py) і сніг (ДБН В.1.2-2:2006 зі Зміною № 1), шар на модулях даху
const KW=typeof KOSH!=='undefined'?KOSH.wind:null, GF=1.14, S0=1.55, W0=0.37, QM=3.6;   // γfm (T = 100 р.), кПа; модуль: 5 400 Па фронт / 1,5
const LANS=(T_.r28&&T_.r28.D&&T_.r28.D.frames)||[];
function navOf(m){ const X=m.c.x, Y=-m.c.z, X0=-0.15, X1=96.64, Y0=-0.5, Y1=96.59, dx=Math.min(X-X0,X1-X), dy=Math.min(Y-Y0,Y1-Y), d=Math.min(dx,dy);
  let z='I'; if(KW){ if(d<KW.s10) z=(dx<dy?Math.min(Y-Y0,Y1-Y):Math.min(X-X0,X1-X))<KW.s4?'F':'G'; else if(d<KW.e/2) z='H'; }
  const nearL=LANS.some(L=>Math.abs(X-L.xc)<1.83+1.89&&Y>L.y0-1.89&&Y<L.y1+1.89), mu=nearL?2.0:1.0, sn=GF*S0*mu, us=sn/QM;
  const per=KW?KW.per[z]:0, ex=z==='F'?8:z==='G'?4:0, uw=KW?(per+ (KW.g*KW.A/0.1276))/(ex+KW.g*KW.A/0.1276):0;   // блок 13 кг = 0,1276 кН
  const tie=z==='H'; const u=Math.max(us,tie?Math.min(uw,0.95):uw); return {z,mu,sn,us,uw,ex,tie,u,nearL}; }
const NAVC=[[0.9,'#2e8a57','проходить, запас понад 10 %'],[1.0,'#e3a21a','на межі (запас до 10 %) або тримає зв\'язка шпильками'],[9,'#c8423b','не проходить']];
let navOn=false; const NAV0=new Map();
function navPaint(on){ if(!RN) return; const c=new THREE.Color();
  RN.MODS.filter(m=>m.grp==='roof').forEach(m=>{ const im=m.im; if(!im.instanceColor) return; if(on){ if(!NAV0.has(im)) NAV0.set(im,im.instanceColor.array.slice()); const r=navOf(m), k=NAVC.find(q=>r.u<=q[0])||NAVC[2]; c.set(k[1]).convertSRGBToLinear(); im.setColorAt(m.i,c); im.instanceColor.needsUpdate=true; } });
  if(!on) NAV0.forEach((a,im)=>{ im.instanceColor.array.set(a); im.instanceColor.needsUpdate=true; }), NAV0.clear(); navOn=on; need=true; }
function pNav(){ const ms=RN?RN.MODS.filter(m=>m.grp==='roof'):[], R_=ms.map(navOf), cnt=k=>R_.filter(r=>r.z===k).length, lam=R_.filter(r=>r.nearL).length;
  const col=NAVC.map(([lim,c,t],i)=>[c,t,R_.filter(r=>(i===0?r.u<=0.9:i===1?r.u>0.9&&r.u<=1:r.u>1)).length]);
  return head('Конструкція · навантаження','Дах цеху: вітер і сніг на кожен модуль','Колір модуля — найбільше використання з перевірок нижче (вітер на відрив баласту, сніг на модуль). Київ за ДБН В.1.2-2:2006 зі Зміною № 1: W0 = 370 Па, S0 = 1 550 Па; T = 100 років, γfm 1,14.')+
  `<div class="blk wide"><div class="lg">${col.map(([c,t,n])=>`<span><i class="sw" style="background:${c}"></i>${t} — ${nf(n)}</span>`).join('')}</div></div>
  <div class="blk wide"><h3>Вітер: відрив, зони покрівлі</h3><table class="cmp an"><thead><tr><th>Зона</th><th>Модулів</th><th>c_net</th><th>Блоків додати на модуль</th><th>Стан</th></tr></thead><tbody>
  ${['F','G','H','I'].map(z=>`<tr><td class="w">${z}${z==='F'?' — кути':z==='G'?' — краї поля':z==='H'?' — смуга біля краю':' — середина'}</td><td>${nf(cnt(z))}</td><td>${KW?nf(KW.c[z],2):'—'}</td><td>${KW?(KW.per[z]>0?nf(Math.ceil(KW.per[z])):'—'):'—'}</td><td>${z==='F'?'+8 блоків з бортиком':z==='G'?'+4 блоки з бортиком':z==='H'?'тримає зв\'язка з зоною I':'запас'}</td></tr>`).join('')}</tbody></table>
  <p class="src">qp = ${KW?nf(KW.qp*1000,0):'—'} Па на висоті 15,9 м (EN 1991-1-4, місцевість III); власна вага поля ${KW?nf(KW.g*1000,0):'—'} Па (модуль, лага, 2 блоки); γ вітру 1,5, ваги 0,9. Зони — EN для плаского даху, e = ${KW?nf(KW.e,1):'—'} м. c_net для поля модулів уздовж покрівлі — <b>інженерне припущення</b> (у ДБН схеми немає), рішення 05.11. Додатково всього ${KW?nf(KW.extra.tot):'—'} блоків з бортиком по краю поля ${KW?nf(KW.per_len,0):'—'} м.</p></div>
  <div class="blk wide"><h3>Сніг</h3><table class="cmp an"><tbody><tr><td class="w">Поле, μ = 1</td><td>${nf(ms.length-lam)} модулів · ${nf(GF*S0,2)} кПа · ${nf(GF*S0/QM*100,0)} % від 3,6 кПа</td></tr>
  <tr><td class="w">Біля ліхтарів (зона b₁ = h₁ ≈ 1,9 м), μ = 2,0</td><td>${nf(lam)} модулів · ${nf(GF*S0*2,2)} кПа · ${nf(GF*S0*2/QM*100,0)} %</td></tr></tbody></table>
  <p class="src">ДБН дод. Ж: склепінчасті багатопролітні (схема 6) — варіант зі снігом в ендовах лише при f/L > 0,1; у нас 1,19 / 18 = 0,066, тому μ = 1. Біля подовжніх ліхтарів (схема 3) μ обмежено 2,0 для покриття по профнастилу — взято верхню межу (консервативно). Модуль: 5 400 Па випробування / 1,5 = 3,6 кПа.</p></div>
  ${needB('Що ще перевірити:',['сповзання снігу з гладких модулів в ендови і водостоки — у ДБН схеми немає; переріз ендов і обігрів',`зсув поля по схилу до 16°: ${KW?nf(KW.F_slide,0):'—'} кН сумарно тримають шпильки через гребінь (${KW?nf(KW.per_tie,1):'—'} кН на шпильку) — тертя мата по мембрані невідоме до вибору мембрани`,'лага разом з рамою модуля під сніг μ = 2 біля ліхтарів — розрахунок «Лага 0°» зроблено для μ = 1','несуча здатність покриття цеху: +≈25 кг/м² від поля СЕС і перерозподіл снігу — потрібне обстеження','ліхтарі під 41°: вітер на високі навітряні площини і опора рейок — не вирішено'])}`; }
function pObs(){ const L=[['Несучі конструкції покриття цеху','тип (арки, ферми, прогони), крок, перерізи, стан, проєктні навантаження','чи витримає +25 кг/м² і сніг біля ліхтарів'],
  ['Покрівля і мембрана','шари, вага, стан; марка і вага нової мембрани; тертя мата по мембрані','баласт, зсув по схилу'],['Ендови й водостоки','переріз, ухил, обігрів, стан','сповзання снігу з модулів'],
  ['Парапети і краї даху','висота, стан, кріплення','бортики, зони F і G'],['Каркаси ліхтарів','стан, переріз, вузли; на що спирати рейки 41×41','модулі під 41° і вітер'],
  ['Стінові панелі фасадів','тип, товщина, міцність; випробування анкерів M10 / M12 на висмикування','фасади і козирки 25°'],['Майданчики контейнерів','ґрунти, підземні мережі, проїзд крана, підпірна стінка ТП-6923','фундаменти Фп-1, кран'],
  ['ТП-5913 і ТП-6923','РУ-0,4 кВ: місце підключення, вільні комірки, прохід кабелів крізь стіну','лінії AC, захист']];
  return head('Конструкція · обстеження','Що виміряти на місці','Без цих даних перевірки «витримає / не витримає» показують «потрібно». Фото обстеження в модель не ставимо.')+
  `<div class="blk wide"><table class="cmp an"><thead><tr><th>Що</th><th>Виміряти, з'ясувати</th><th>Для чого</th><th>Стан</th></tr></thead><tbody>${L.map(([a,b,c])=>`<tr><td class="w">${a}</td><td class="w">${b}</td><td class="w">${c}</td><td>потрібно</td></tr>`).join('')}</tbody></table></div>`; }
// ---------- кошторис по етапах 04.11 (calc/ep04/bom.json): СЕС до PCS — кріплення, баласт, кабелі, щити, лінії, лотки, блискавкозахист
const KI=typeof KOSH!=='undefined'?KOSH.items:null;
function koshTbl(filt){ if(!KI) return needB('Потрібно: кошторис calc/ep04.'); const st=state.lay.stg, S_=st==='all'?['1','2']:[st], rows=S_.flatMap(s=>(KI[s]||[]).map(x=>[s,...x])).filter(r=>!filt||filt(r[1]));
  const G={}; rows.forEach(r=>{ const k=r[1]; (G[k]=G[k]||[]).push(r); }); const tot=rows.reduce((s_,r)=>s_+r[6],0), h=rows.reduce((s_,r)=>s_+r[7],0);
  return `<div class="blk wide"><div class="tw"><table class="cmp an"><thead><tr><th>Позиція</th><th>Етап</th><th>Кількість</th><th>Ціна, $</th><th>Сума, $</th></tr></thead><tbody>${Object.entries(G).map(([g,L])=>`<tr class="tot"><td class="w">${g}</td><td></td><td></td><td></td><td>${nf(Math.round(L.reduce((s_,r)=>s_+r[6],0)))}</td></tr>`+L.map(r=>`<tr><td class="w">${r[2]}</td><td>${r[0]}</td><td>${nf(r[4],r[4]%1?1:0)} ${r[3]}</td><td>${nf(r[5],2)}</td><td>${nf(Math.round(r[6]))}</td></tr>`).join('')).join('')}
  <tr class="tot"><td class="w">Разом</td><td></td><td>${nf(Math.round(h))} люд.год</td><td></td><td>${nf(Math.round(tot))}</td></tr></tbody></table></div><p class="src">Кошторис і специфікація по етапах 04.11.2026 (calc/ep04, Excel «Кошторис_і_специфікація_СЕС_і_УЗЕ_Антарес_по_етапах_04.11.2026»): СЕС до PCS, $ без ПДВ. Модулі, контейнери, EMS — у «Обладнанні».</p></div>`; }
const PANES={kut:pKut,nav:pNav,obs:pObs,rik:pRik,flow:()=>head('Сонце і генерація · потоки енергії','Потоки енергії')+needB('Потрібно: погодинне споживання з АСКОЕ за 12–36 місяців по трьох точках обліку — тоді показуємо, куди йде енергія щогодини: цех, накопичувачі, мережа.'),
  kr:pKr,bal:pBal,roz:pRoz,bz:()=>head('Електрика · блискавкозахист','Блискавкозахист без щогл','Рішення 25.10: без щогл — зрівнювання потенціалів конструкцій, PE до заземлення ТП; контейнери — свій контур (у «Контейнерах»). Позиції — з кошторису 04.11.')+koshTbl(g=>/Блискавко/.test(g)),
  obl:pObl,kn:()=>head('Гроші · конструкція','Кріплення і баласт — кошторис 04.11','')+koshTbl(g=>/Кріплення|Баласт/.test(g)),mn:pMn,ksh:()=>head('Гроші · кошторис',`${stgN()}: СЕС до PCS по позиціях`,'')+koshTbl(),sp:pSp,bud:pBud};
const tuBlock=()=>`<div class="blk wide"><h3>Технічні умови і вихідні дані</h3><table class="cmp an"><tbody>
  <tr><td class="w">Споживання</td><td>≈11 000 МВт·год на рік (власник, 05.11) · погодинних даних АСКОЕ немає</td></tr><tr><td class="w">Приєднання</td><td>10 кВ, КТП-5913 2 × 2 500 кВА, КТП-6923 1 × 2 500 кВА · 3 точки обліку</td></tr>
  <tr><td class="w">Видача в мережу</td><td>ТУ немає · план — до 2 000 кВт</td></tr><tr><td class="w">Етапи</td><td>етап 1 — АБК, фасади, ліхтарі, склад, 4 контейнери; етап 2 — дах цеху після мембрани</td></tr></tbody></table></div>`;
// ---------- рендер меню після кожного apply
function render5(){ const {S:S_,sub}=cur();
  tabs.querySelectorAll('button.m5').forEach(b=>{ const on=b.dataset.s5===S_[0]; b.setAttribute('aria-selected',on?'true':'false'); if(on) tabs.scrollTo({left:Math.max(0,b.offsetLeft-tabs.clientWidth/2+b.offsetWidth/2)}); });
  const sb=$('#subs'); sb.innerHTML=S_[2].map(([k,t,o])=>`<button type="button" data-sub="${k}" aria-pressed="${k===sub[0]}" class="${o.need?'need':''}">${t}</button>`).join('');
  sb.querySelectorAll('button').forEach(b=>b.onclick=()=>go(S_[0],b.dataset.sub));
  const o=sub[2], pane=$('#pane'); if((sub[0]==='nav')!==navOn) navPaint(sub[0]==='nav');
  if(o.pane&&PANES[o.pane]){ pane.innerHTML=`<div class="m5p" style="display:contents">${PANES[o.pane]()}</div>`; bindP(pane); }
  else if(sub[0]==='tu') pane.insertAdjacentHTML('afterbegin',`<div style="display:contents">${tuBlock()}</div>`); }
function bindP(p){ p.querySelectorAll('[data-kut]').forEach(b=>b.onclick=()=>{ state.lay.kutR=b.dataset.kut; render5(); });
  p.querySelectorAll('[data-kutf]').forEach(b=>b.onclick=()=>{ state.lay.kutF=b.dataset.kutf; render5(); });
  p.querySelectorAll('[data-budg]').forEach(b=>b.onclick=()=>{ state.lay.budG=b.dataset.budg; render5(); });
  const bu=p.querySelector('#budU'); if(bu) bu.onchange=()=>{ state.lay.budU=Math.max(50000,+bu.value||0); render5(); }; save(); }
const ap0=apply; apply=function(){ const o=cur().sub[2];
  if(state.sec!==o.sec){ const hit=MENU.flatMap(([s,,subs])=>subs.map(x=>[s,x])).find(([,x])=>x[2].sec===state.sec); if(hit){ M5.s=hit[0]; M5.sub=hit[1][0]; } }   // перехід з коду двійника (напр. картка контейнера)
  if(RN&&RN.setEx&&cur().sub[2].pane!=='roz') RN.setEx(0);
  const r=ap0.apply(this,arguments); render5(); return r; };
window.__twin.apply=apply; window.__twin.menu5={MENU,go,cur};
go(M5.s,M5.sub);
} }
