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
 ['kon','Конструкція',[['kr','Кріплення',{sec:'pz',pane:'kr',cam:'near'}],['bal','Баласт і вага',{sec:'pz',pane:'bal'}],['roz','Розбір на елементи',{sec:'pz',pane:'roz',cam:'near'}],['nav','Навантаження',{sec:'pz',pane:'nav',cam:'top'}],['obs','Обстеження',{sec:'pz',pane:'obs',need:1}]]],
 ['el','Електрика',[['str','Стрінги',{sec:'pz',lay:{str:true}}],['shch','Щити PV',{sec:'pz',lay:{e04:true},pane:'shch'}],['lin','Лінії і лотки',{sec:'pz',lay:{e04:true},cam:'top',pane:'lin'}],
   ['shv','Шафи (Al → Cu)',{sec:'pz',lay:{e04:true},cam:'ess'}],['kont','Контейнери',{sec:'uze'}],['bz','Блискавкозахист',{sec:'pz',pane:'bz'}]]],
 ['gr','Гроші',[['ok','Окупність',{sec:'eko'}],['arb','Арбітраж',{sec:'pz',pane:'arb'}],['sc','Сценарії',{sec:'pz',pane:'sc',cam:'ess'}],['obl','Обладнання',{sec:'pz',pane:'obl'}],['kn','Конструкція',{sec:'pz',pane:'kn'}],['mn','Монтаж',{sec:'pz',pane:'mn'}],
   ['ksh','Кошторис',{sec:'pz',pane:'ksh'}],['sp','Специфікація',{sec:'pz',pane:'sp'}],['bud','Під бюджет',{sec:'pz',pane:'bud'}]]]];
// 06.11 (власник): кошторис, специфікація, конструкція і монтаж у «Грошах» — лише у внутрішній версії (PUB=0 sh build.sh); замовник бачить ціни під ключ
if(window.__PUB!==false) MENU.forEach(m=>{ if(m[0]==='gr') m[2]=m[2].filter(([k])=>!['kn','mn','ksh','sp'].includes(k)); });
if(state.lay.m5&&state.lay.m5.s==='gr'&&!MENU.find(([k])=>k==='gr')[2].some(([k])=>k===state.lay.m5.sub)) state.lay.m5.sub='ok';
const M5=state.lay.m5&&MENU.some(([k])=>k===state.lay.m5.s)?state.lay.m5:(state.lay.m5={s:'obj',sub:'tu'});
const cur=()=>{ const S_=MENU.find(([k])=>k===M5.s)||MENU[0], sub=S_[2].find(([k])=>k===M5.sub)||S_[2][0]; return {S:S_,sub}; };
// ---------- розмітка: рядок шарів над моделлю ховаємо; під розділами — підрозділи
{ const st=document.createElement('style'); st.textContent=`#modes{display:none!important} #tabs > button:not(.m5){display:none!important}
.m5p > .wide,.m5p > .ph,.m5p > .kpis{grid-column:1/-1} #subs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:6px 12px 2px;border-bottom:1px solid var(--line)} #subs::-webkit-scrollbar{display:none}
#subs button{flex:none;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);border-radius:999px;padding:4px 11px;font:inherit;font-size:12.5px;white-space:nowrap}
#subs button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink);font-weight:600} #subs button.need{border-style:dashed}
.m5p .need{border:1px dashed var(--line-2);border-radius:10px;padding:10px 12px;color:var(--ink-2);font-size:13px} .m5p .need b{color:var(--ink)}
.m5p .best{display:inline-block;font:600 10.5px var(--font);padding:1px 6px;border-radius:6px;margin-left:6px;background:var(--surface-3);color:var(--ink)} .m5p tr.cur td{background:var(--surface-2)}
.m5p tr.sub td{font-weight:650;color:var(--ink)} .m5p tr.oth td{color:var(--ink-3)} .m5p tr.oth td.w{color:var(--ink-2)} .m5p details.ld{margin:6px 0 0;border-top:1px solid var(--line);padding-top:6px} .m5p details.ld summary{cursor:pointer;font-size:13px;color:var(--ink);padding:4px 0}
.m5p details.ld table{margin:4px 0 6px}
:root{--s1:#2a78d6;--s2:#eb6834;--s3:#1baf7a;--s4:#eda100;--s5:#e87ba4;--s6:#008300;--s7:#6250d6;--s8:#e34948}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){--s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#c98500;--s5:#d55181;--s6:#008300;--s7:#9085e9;--s8:#e66767} }
:root[data-theme="dark"]{--s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#c98500;--s5:#d55181;--s6:#008300;--s7:#9085e9;--s8:#e66767}
.m5p .gch{position:relative;min-height:230px;touch-action:pan-y} .m5p .gch svg,.m5p .gmc svg{display:block;overflow:visible} .m5p .glg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--ink-2)} .m5p .glg span{display:inline-flex;align-items:center;gap:5px} .m5p .glg b{color:var(--ink);font-weight:600}
.m5p .gg{stroke:var(--line);stroke-width:1} .m5p .ga{fill:var(--ink-3);font-size:10.5px;font-family:var(--font)} .m5p .gv{fill:var(--ink);font-size:11px;font-weight:650;font-family:var(--font)} .m5p .gsb{stroke:var(--surface);stroke-width:1.5}
.m5p .gt{fill:none;stroke:var(--ink);stroke-width:1.5;opacity:.5} .m5p .gx{stroke:var(--ink-2);stroke-width:1;stroke-dasharray:3 3} .m5p .ga2{opacity:.18} .m5p .gl{fill:none;stroke-width:2} .m5p .gd{stroke:var(--surface);stroke-width:2}
.m5p .gtip{position:absolute;z-index:3;background:var(--surface);border:1px solid var(--line-2);border-radius:8px;padding:6px 9px;font-size:12px;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.12);display:flex;flex-direction:column;gap:2px;min-width:180px}
.m5p .gtip span{display:flex;align-items:center;gap:6px;color:var(--ink-2)} .m5p .gtip em{margin-left:auto;font-style:normal;color:var(--ink);font-variant-numeric:tabular-nums;padding-left:10px} .m5p .gtip .tt{border-top:1px solid var(--line);padding-top:3px;margin-top:2px;color:var(--ink);font-weight:600}
.m5p .gms{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px} .m5p .gm{border:1px solid var(--line);border-radius:10px;padding:8px 10px 6px;background:var(--surface);min-width:0}
.m5p .gmh{display:flex;gap:7px;align-items:flex-start;font-size:13px;font-weight:600;color:var(--ink)} .m5p .gmh .sw{margin-top:3px} .m5p .gmh small{display:block;font-weight:400;color:var(--ink-3);font-size:11px}
.m5p .gmv{font-size:12px;color:var(--ink-2);margin:2px 0 0} .m5p .gmv b{font-size:18px;color:var(--ink)} .m5p .gms2{font-size:11px;color:var(--ink-3)}
.m5p .law{font-size:13px;color:var(--ink-2);line-height:1.45;border-left:3px solid var(--s1);padding:4px 0 4px 10px} .m5p .law b{color:var(--ink)} .m5p .law a{color:var(--s1);white-space:nowrap} .m5p .law small{display:block;color:var(--ink-3);font-size:11.5px;margin-top:2px}
.m5p .gx0{stroke:var(--ink-3);stroke-width:1} .m5p .bzw svg{display:block} .m5p .bzw .bzv{display:none;max-width:420px} @media (max-width:700px){ .m5p .bzw .bzh{display:none} .m5p .bzw .bzv{display:block} } .m5p .bzb{fill:var(--surface);stroke:var(--line-2);stroke-width:1.2} .m5p .bzb.k{stroke:var(--ink-3)} .m5p .bzb.g{fill:var(--surface-2)} .m5p .bzt{fill:var(--ink);font-size:13px;font-weight:650;font-family:var(--font)}
.m5p .bzs{fill:var(--ink-2);font-size:11.5px;font-family:var(--font)} .m5p .bzl{stroke:var(--ink-2);stroke-width:1.5} .m5p .bzl.d{stroke-dasharray:4 3} .m5p .bzm{fill:var(--ink-2)} .m5p .es{font-size:10.5px;color:var(--ink-3);margin-left:4px}
.m5p .kb{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px} .m5p .kb button{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:5px 10px;font:inherit;font-size:12.5px;color:var(--ink)}
.m5p .kb button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)} .m5p input[type=number]{font:inherit;padding:5px 8px;border:1px solid var(--line);border-radius:8px;width:160px;background:var(--surface);color:var(--ink)}`; document.head.appendChild(st);
  const sb=document.createElement('div'); sb.id='subs'; sb.setAttribute('role','group'); sb.setAttribute('aria-label','Підрозділи'); const tbar=document.querySelector('.tabbar'); tbar.parentNode.insertBefore(sb,tbar.nextSibling); }
const tabs=$('#tabs');
MENU.forEach(([k,t])=>{ const b=document.createElement('button'); b.type='button'; b.className='m5'; b.setAttribute('role','tab'); b.dataset.s5=k; b.textContent=t; tabs.appendChild(b); b.onclick=()=>go(k); });
$('#tabPrev').onclick=()=>step5(-1); $('#tabNext').onclick=()=>step5(1);
function step5(d){ const i=MENU.findIndex(([k])=>k===M5.s); go(MENU[(i+d+MENU.length)%MENU.length][0]); }
const LAST={}; MENU.forEach(([k,,subs])=>LAST[k]=subs[0][0]);
let rozSt=null;
function rozRun(){ if(state.lay.stg==='1'){ if(XN&&XN.kind==='rn') closeNode(true); camFac(); explode(); } else { setExAll(0); if(RN&&RN.node){ if(xPhone()&&state.sheet!=='peek') sheetSet('peek'); requestAnimationFrame(()=>RN.node()); } else { camNear(); explode(); } } }   // телефон: аркуш згорнуто — вузлу більше місця
function go(s,sub){ if(sub===undefined) sub=LAST[s]||MENU.find(([k])=>k===s)[2][0][0]; M5.s=s; M5.sub=sub; LAST[s]=sub; rozSt=null;
  const {sub:sb}=cur(), o=sb[2]; Object.assign(state.lay,L0,o.lay||{}); if(o.sec==='uze') state.lay.uAC=true; state.sec=o.sec; if(state.sheet==='peek') sheetSet('half');
  apply(); if(o.pane==='roz'||o.cam==='near') document.querySelectorAll('#cams button').forEach(x=>x.setAttribute('aria-pressed','false'));   // камера зблизька — жоден вид не вибрано
  if(o.pane==='roz'){ rozSt=state.lay.stg; rozRun(); } else if(o.cam==='near') camNear(); else if(o.cam&&VIEWS[o.cam]) goCam(o.cam); }
// ---------- камера до модуля зблизька (кріплення видно ближче 16 м)
function camNear(){ if(!RN) return; const st=state.lay.stg, g=st==='1'?'wh':'roof', ms=RN.MODS.filter(m=>m.grp===g&&m.nb.mv&&m.nb.pu&&!m.nb.mu); const m=ms[Math.floor(ms.length*0.35)]||RN.MODS[0];
  const p=m.c.clone().addScaledVector(m.w,1.3).addScaledVector(m.v,-1.9).addScaledVector(m.u,-2.4), t=m.c.clone().addScaledVector(m.u,-1.1); goTo({p:p.toArray(),c:t.toArray()}); }
let exT=null; const FN=()=>T_.facnode;
function setExAll(f){ if(RN&&RN.setEx) RN.setEx(state.lay.stg==='1'?0:f); const fn=FN(); if(fn&&fn.setEx) fn.setEx(state.lay.stg==='2'?0:f); }
function explode(){ const t0=performance.now(); cancelAnimationFrame(exT); const st=()=>{ const f=Math.min(1,(performance.now()-t0)/1400); setExAll(f*f*(3-2*f)); if(f<1) exT=requestAnimationFrame(st); }; setTimeout(()=>{ exT=requestAnimationFrame(st); },900); }
function camFac(){ const fn=FN(); if(!fn) return; const md=fn.MODS.filter(x=>x.n==='kozyrok')[10]||fn.MODS[0], e=md.T.elements, Z=new V3(e[8],e[9],e[10]), X=new V3(e[0],e[1],e[2]), o=new V3(e[12],e[13],e[14]);
  goTo({p:o.clone().addScaledVector(Z,3.4).addScaledVector(X,2.2).add(new V3(0,-1.6,0)).toArray(),c:[o.x,o.y-0.4,o.z]}); }
// ---------- власні панелі
const stgN=()=>state.lay.stg==='1'?'Етап 1':state.lay.stg==='2'?'Етап 2 · дах цеху':'Весь об\'єкт';
const needB=(t,list)=>`<div class="blk wide"><div class="need"><b>${t}</b>${list?`<ul class="open" style="margin-top:6px">${list.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}</div></div>`;
const head=(ey,h,p)=>`<div class="ph" style="grid-column:1/-1"><span class="eyebrow ours">${ey}</span><h2>${h}</h2>${p?`<p>${p}</p>`:''}</div>`;
function pKut(){ if(!KU) return needB('Потрібно: розрахунок кутів.');
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
function pRik(){ const S=ST.sums(), stg=state.lay.stg, G=[['roof','Дах цеху','2'],['fac','Фасади','1'],['lan','Ліхтарі','1'],['wh','Склад','1'],['ab','АБК','1']].filter(([,,e])=>stg==='all'||e===stg), T=stg==='1'?S.s1:stg==='2'?S.s2:S.all;
  return head('Сонце і генерація · рік',`${stgN()}: ≈${f0(T.mwh)} МВт·год за рік`,`Генерація кожного даху і фасаду окремо — за рік і по місяцях; доба і пори року — у «Стан модулів і доба».${stg==='all'?'':' Інший етап — кнопки етапів над моделлю.'}`)+genBlocks()+
  `<div class="blk wide"><h3>Річна генерація по групах</h3><div class="tw"><table class="cmp an"><thead><tr><th>Група</th><th>Етап</th><th>Модулів</th><th>кВтп</th><th>МВт·год</th><th>кВт·год/кВтп</th></tr></thead><tbody>${G.map(([k,n,e])=>{ const x=S[k]; return `<tr><td class="w">${n}${k==='wh'&&typeof WHNP!=='undefined'&&WHNP?`<small>з опцією «північні скати» +${WHNP.n}</small>`:''}</td><td>${e}</td><td>${nf(x.st)}</td><td>${f1(x.kwp)}</td><td>${f1(x.mwh)}</td><td>${f0(x.mwh*1000/x.kwp)}</td></tr>`; }).join('')}
  <tr class="tot"><td class="w">Разом${stg==='all'?'':' етап '+stg}</td><td></td><td>${nf(T.st)}</td><td>${f1(T.kwp)}</td><td>${f1(T.mwh)}</td><td>${f0(T.mwh*1000/T.kwp)}</td></tr></tbody></table></div></div>`; }
const BOM=RN?RN.BOM:{}, KG={blk:12.98,mat:0.338,sleeve:0.36,sleeveE:0.18,cpl:0.08,rod:0.62,jam:0.006,mcl:0.07,zcl:0.06,ang:1.36,mrail:0.25,lbolt:0.02};
const NM={blkN:'Блок з муфтою без мата — під крайній профіль',sleeveE:'Гільза П 100 на торці з болтом M8',blk2:'Додатковий блок — край поля (F, G)',mat2:'Мат під додатковий блок',lag:'Лага 41×41×1,5, м',xprof:'Крайній профіль 41×41, м',blk:'Блок 300×300×60 з муфтою',mat:'Мат 320×320×3',lbolt:'Болт M8×20 + шайба DIN 9021',sleeve:'Гільза П 200 з 2 болтами M8',sleeveE:'Гільза П 100 з болтом M8',
  cpl:'Муфта M10×50',rod:'Шпилька M10 1 299 мм',jam:'Контргайка M10',mcl:'Середній притиск M8×60',zcl:'Крайній притиск Z33',ang:'Кутник 150×150×6',mrail:'Міні-рейка 380 мм',scr:'Саморізи 5,5×25 EPDM (×6), комплектів'};
const bomRows=keys=>{ const G=[['roof','Дах цеху'],['wh','Склад'],['lan','Ліхтарі']].filter(([g])=>BOM[g]), ks=keys||[...new Set(G.flatMap(([g])=>Object.keys(BOM[g].q)))];
  return `<div class="tw"><table class="cmp an"><thead><tr><th>Деталь</th>${G.map(([,n])=>`<th>${n}</th>`).join('')}</tr></thead><tbody>${ks.map(k=>`<tr><td class="w">${NM[k]||k}</td>${G.map(([g])=>{ const v=BOM[g].q[k]; return `<td>${v?(k==='lag'||k==='xprof'?f1(v):nf(Math.round(v))):'—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`; };
function pKr(){ return head('Конструкція · кріплення','Кріплення до болта — з моделі','Деталі видно зблизька: камера підлітає до модулів даху (етап 2) або складу (етап 1). Кількості — по кожному модулю моделі з його сусідами.')+`<div class="blk wide">${bomRows()}<p class="src">Дах цеху — «Лага 0°», арка 18 м (elements-ses); склад — розрахунок 26.10 на 176 модулів; ліхтарі — притиски на рейках 41×41 (на що спирати рейки — не вирішено). Фасади — «Кубики фасаду», АБК — модель АБК.</p></div>`; }
const LD=typeof LOADS!=='undefined'?LOADS:null, CAT=[['mod','Модулі'],['mnt','Кріплення'],['bal','Баласт'],['el','Лотки, кабелі, щити']], tn=v=>nf(v/1000,v<10000?2:1);
function pBal(){ if(!LD) return needB('Потрібно: розрахунок навантажень.');
  const stg=state.lay.stg, R=k=>LD.rows.find(r=>r.k===k), on=r=>stg==='all'||r.st===stg, r2=R('roof'), sh=LD.groups[0], q=(BOM.roof||{q:{}}).q, B=LD.blocks_roof;
  const blkF=B.lag+B.edge+B.extra, perB=(r2.s.mod+r2.s.mnt)/blkF+12.98+0.338*B.lag/blkF, kpa=perB*9.81/0.1024/1000;
  const sel=LD.rows.filter(r=>on(r)&&r.k!=='fac'), Tsel=sel.reduce((a,r)=>a+r.tot,0);
  const GR=[['Дах цеху',['roof','roof1','lan'],sh],['Склад',['wh','whn'],LD.groups[1]],['АБК',['abA','abL'],LD.groups[2]],['Стіни',['fac'],null]];
  const tr=r=>`<tr class="${on(r)?'':'oth'}"><td class="w">${r.n}<small>${r.note}</small></td><td>${r.st}</td><td>${r.mods?nf(r.mods):'—'}</td><td>${r.A?nf(r.A):'—'}</td>${CAT.map(([c])=>`<td>${r.s[c]?tn(r.s[c]):'—'}</td>`).join('')}<td><b>${tn(r.tot)}</b></td><td>${r.kgm2?nf(r.kgm2,1):'—'}</td></tr>`;
  const sub=g=>g?`<tr class="sub"><td class="w">${g.n}</td><td></td><td>${nf(g.mods)}</td><td>${nf(g.A)}</td>${CAT.map(([c])=>`<td>${g.s[c]?tn(g.s[c]):'—'}</td>`).join('')}<td>${tn(g.tot)}</td><td>${nf(g.kgm2,1)}${g.kgm2_plan?`<small>${nf(g.kgm2_plan,1)} на ${nf(g.plan)} м² у плані</small>`:''}</td></tr>`:'';
  const rows=GR.map(([,ks,g])=>ks.map(k=>R(k)).filter(Boolean).map(tr).join('')+(ks.filter(k=>R(k)).length>1?sub(g):'')).join('');
  const det=r=>`<details class="ld"><summary>${r.n} — ${tn(r.tot)} т по елементах</summary><div class="tw"><table class="cmp an"><thead><tr><th>Елемент</th><th>К-сть</th><th>кг за од.</th><th>т</th></tr></thead><tbody>${CAT.flatMap(([c])=>r.det[c].map(x=>`<tr><td class="w">${x.n}${x.est&&window.__PUB===false?'<span class="es">оцінка</span>':''}</td><td>${nf(x.q,x.q%1?1:0)} ${x.u}</td><td>${nf(x.kg1,x.kg1<1?3:x.kg1<10?2:1)}</td><td>${nf(x.kg/1000,x.kg<1000?3:2)}</td></tr>`)).join('')}</tbody></table></div></details>`;
  const mB=(q.blk||0)+(q.blk2||0)+(q.blkN||0);
  return head('Конструкція · баласт і навантаження',`${stgN()}: ${nf(Tsel/1000,1)} т на дахи`,'Власна вага СЕС на кожен дах: модулі, кріплення, баласт, лотки, кабелі і щити — без снігу і вітру (вони — у «Навантаженні»). Кількості — кошторис 06.11 і кошторис АБК 28.10, маса одиниці — «Елементи SES» і модель кріплення; кабелі, лотки, щити — каталожні значення. кг/м² — на площу під модулями.')+
  `<div class="kpis"><div class="kpi"><span class="k">Дах цеху разом</span><span class="v">${nf(sh.tot/1000,1)} <small>т</small></span><span class="s">поле ${nf(r2.tot/1000,1)} + ліхтарі ${nf(R('lan').tot/1000,1)} + лотки етапу 1 ${nf(R('roof1').tot/1000,1)} · ${nf(sh.kgm2_plan,1)} кг/м² на ${nf(sh.plan)} м² у плані</span></div>
  <div class="kpi"><span class="k">Поле даху цеху</span><span class="v">${nf(r2.kgm2,1)} <small>кг/м²</small></span><span class="s">на ${nf(r2.A)} м² під ${nf(r2.mods)} модулями</span></div>
  <div class="kpi"><span class="k">Баласт поля</span><span class="v">${nf(r2.s.bal/1000,1)} <small>т</small></span><span class="s">${nf(B.lag)} під лаги і кінці лаг + ${nf(B.edge)} без мата під крайні профілі + ${nf(B.extra)} по краю поля + ${nf(B.tray)} під лотки і щити</span></div>
  <div class="kpi"><span class="k">Під одним блоком</span><span class="v">${nf(perB,0)} <small>кг</small></span><span class="s">≈${nf(kpa,1)} кПа на мат 320 × 320 — без снігу</span></div></div>
  <div class="blk wide"><h3>Навантаження на кожен дах</h3><div class="tw"><table class="cmp an"><thead><tr><th>Дах</th><th>Етап</th><th>Модулів</th><th>Під модулями, м²</th>${CAT.map(([,n])=>`<th>${n}, т</th>`).join('')}<th>Разом, т</th><th>кг/м²</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="src">${stg==='all'?'Весь об\'єкт.':`Вибрано етап ${stg} — рядки іншого етапу бліді.`} Фасади — не дах: навантаження на стіни через кронштейни, довідково. Не входять: ходові доріжки й огородження АБК, перехідні містки через лотки, бортики по краю поля даху цеху (вид не вирішено). Модель кріплення двійника на даху цеху: ${nf(Math.round(mB))} блоків (кошторис — ${nf(B.lag+B.edge+B.extra)} без опор лотків).</p>
  ${LD.rows.map(det).join('')}</div>
  ${needB('Потрібно для перевірки покрівель:',[`дах цеху: несуча здатність покриття (обстеження) — порівняти з ${nf(r2.kgm2,1)} кг/м² на полі і ${nf(sh.kgm2_plan,1)} кг/м² у середньому, плюс сніг біля ліхтарів`,`ліхтарі: каркас під ${nf(R('lan').tot/1000,1)} т модулів і рейок (${nf(R('lan').kgm2,1)} кг/м²) і сніг — перевірка КМ; на що спирати рейки — не вирішено`,`склад: профнастил і прогони під ${nf(LD.groups[1].kgm2,1)} кг/м² — рішення за RUDNIK / обстеженням`,`АБК: арка ${nf(R('abA').kgm2,1)} кг/м², нижній дах ${nf(R('abL').kgm2,1)} кг/м² під модулями (баласт) — перевірити покриття`,'мат по мембрані: тиск під блоком зі снігом — після вибору мембрани й утеплювача'])}`; }
function pRoz(){ return head('Конструкція · розбір на елементи',state.lay.stg==='1'?'Вузол фасаду — розібрано':'Вузол даху цеху — розібрано',state.lay.stg==='1'?'Етап 1 — фасад: модулі стають прозорими, деталі відходять від стіни шарами — анкери, кронштейни, консолі й підкоси козирка, рейки, притиски, трос безпеки. Етап 2 або «Разом» — вузол даху.':'Один модуль з кріпленням розходиться шарами: номер біля кожної деталі, ‹ › — по деталях, «Підписи» — назви поруч, «Зібрати» — назад, × — закрити. Решта кріплення навколо — бліде. Етап 1 — вузол фасаду.')+`<div class="blk wide">${bomRows(['mat','blk','blkN','blk2','lbolt','lag','sleeve','sleeveE','cpl','rod','jam','mcl','zcl','xprof','ang'])}${state.lay.stg==='1'?'':'<p class="src">Кількості — по всіх модулях моделі. <button type="button" class="lnk" data-rn="1">↺ Розібрати модуль знову</button></p>'}</div>`; }
function pBz(){ return head('Електрика · блискавкозахист','Блискавкозахист без щогл','Рішення власника 25.10: без щогл, найдешевший практичний варіант — зрівнювання потенціалів конструкцій СЕС, PE до заземлення ТП; контейнери — свій контур заземлення (у «Контейнерах»).')+needB('Потрібно: перерахувати том 7 «БЗ» під поточну розкладку (дах В1, фасади, ліхтарі, склад, АБК) і показати провідники в моделі.'); }
function pObl(){ if(typeof KALK==='undefined') return needB('Потрібно: розрахунок калькулятора.'); const K_=KALK, I=K_.in, e1=state.lay.stg==='1', nV=[...new Set(K_.sc[0].vse.map(x=>x.n))].filter(n=>n).sort((a,b)=>a-b);
  const n=e1?4:(nV.includes(+state.lay.ekoN)?+state.lay.ekoN:nV[0]), x=(e1?K_.sc[0].e1:K_.sc[0].vse).find(q=>q.n===n&&q.rezhym==='lim'), kwp=e1?K_.kwp.e1:K_.kwp.vse;
  return head('Гроші · обладнання',`${e1?'Етап 1':'Весь об\'єкт'} + ${n} ${n<5?'контейнери':'контейнерів'}: ${usd(x.capex.razom)}`,'Капвитрати під ключ, без ПДВ — як у розрахунку окупності: СЕС — за кошторисом 26.10 на кВтп, контейнер — під ключ, EMS і робот для очищення — окремо.')+
  `<div class="blk wide"><table class="cmp an"><tbody><tr><td class="w">СЕС, ${f1(kwp)} кВтп × ${nf(I.capex_ses_usd_kwp)} $/кВтп</td><td>${usd(x.capex.ses)}</td></tr><tr><td class="w">Накопичувачі, ${n} × Golen LES-H20-1205W500C-PS під ключ по ${usd(I.capex_uze_usd)}</td><td>${usd(x.capex.uze)}</td></tr>
  <tr><td class="w">EMS (E-Systems)</td><td>${usd(x.capex.ems)}</td></tr>${x.capex.inshe?`<tr><td class="w">Робот для очищення модулів WanLv WLS-7Pro, 1 шт., з доставкою і розмитненням</td><td>${usd(x.capex.inshe)}</td></tr>`:''}<tr class="tot"><td class="w">Разом, без ПДВ</td><td>${usd(x.capex.razom)}</td></tr></tbody></table>
  <p class="src">Контейнер під ключ ${usd(I.capex_uze_usd)} (${K_.pr.capex_uze_usd}). Мідні лінії до ТП для контейнерів понад 4 — не враховано.</p></div>`; }
function pKn(){ const q=(BOM.roof||{q:{}}).q, w=(BOM.wh||{q:{}}).q, blk=(q.blk||0)*3, lag=(q.lag||0)*190/45.04;
  return head('Гроші · конструкція','Кріплення — кількості з моделі, ціни де відомі','Ціни: блок з муфтою і матом — 3 $ (рішення 26.10); лага 41×41 — 190 грн/м (зведення 23.10).')+
  `<div class="blk wide"><table class="cmp an"><thead><tr><th>Позиція</th><th>Кількість</th><th>Ціна</th><th>Сума</th></tr></thead><tbody>
  <tr><td class="w">Блоки з муфтою і матом, дах цеху</td><td>${nf(Math.round(q.blk||0))}</td><td>3 $</td><td>${usd(blk)}</td></tr><tr><td class="w">Лага 41×41×1,5, м</td><td>${f0(q.lag||0)}</td><td>4,22 $/м</td><td>${usd(lag)}</td></tr>
  <tr class="tot"><td class="w">Разом відомого</td><td></td><td></td><td>${usd(blk+lag)}</td></tr></tbody></table></div>`+needB('Потрібно ціни:',['гільза П з муфтою, шпилька M10, контргайки, притиски, кутники, крайній профіль — з відповідей Koka / XinYang / Lianxiang',`склад: міні-рейки ${nf(Math.round(w.mrail||0))}, притиски ${nf(Math.round((w.mcl||0)+(w.zcl||0)))}`,'фасади і ліхтарі — вузли з «Елементів SES»']); }
function pMn(){ const S=ST.sums(); return head('Гроші · монтаж',`Роботи СЕС: ${usd(S.all.kwp*50)}`,'50 $/кВт — монтаж СЕС, пусконалагодження й електрика (рішення 26.10); EMS і фундаменти — окремо.')+
  `<div class="blk wide"><table class="cmp an"><tbody><tr><td class="w">Етап 1 · ${f1(S.s1.kwp)} кВтп</td><td>${usd(S.s1.kwp*50)}</td></tr><tr><td class="w">Етап 2 · ${f1(S.s2.kwp)} кВтп</td><td>${usd(S.s2.kwp*50)}</td></tr>
  <tr class="tot"><td class="w">Разом</td><td>${usd(S.all.kwp*50)}</td></tr></tbody></table><p class="src">Покроково — «Об'єкт» → «Монтаж — ролик».</p></div>`; }
function pKsh(){ return head('Гроші · кошторис','Кошторис під поточну розкладку','Збирається з тих самих даних: «Обладнання», «Конструкція», «Монтаж».')+needB(`Потрібно: кошторис по позиціях на поточний об'єкт (дах В1, фасади ${typeof FACPV!=='undefined'?nf(FACPV.tot.all.n):'—'}, ліхтарі, склад, АБК, 4 контейнери) — попередній кошторис 26.10 був на 3 контейнери і інший склад поверхонь.`); }
function pSp(){ const S=ST.sums(); return head('Гроші · специфікація','Специфікація з моделі',`${nf(S.all.n)} модулів ZNSHINE ZXN8-BD132-730 (${nf(S.all.st)} у стрінгах, ${S.all.lit} на освітлення) · 4 контейнери Golen LES-H20-1205W500C-PS.`)+
  `<div class="blk wide"><table class="cmp an"><tbody>${[['АБК',S.ab],['Фасади',S.fac],['Ліхтарі',S.lan],['Склад',S.wh],['Дах цеху',S.roof]].map(([n,x])=>`<tr><td class="w">Модулі · ${n}</td><td>${nf(x.n)}</td></tr>`).join('')}</tbody></table></div><div class="blk wide"><h3>Кріплення</h3>${bomRows()}</div>`; }
function pBud(){ if(typeof KALK==='undefined') return needB('Потрібно: розрахунок калькулятора.'); const S=ST.sums(), i_=Math.min(Math.max(+(state.lay.scI??1),0),KALK.sc.length-1), mn=KALK.sc[i_].vse.find(q=>q.n===0&&q.rezhym==='lim'), Mn=mn.mwh, efM=mn.efekt_usd/(Mn.pl+Mn.pb+Mn.px+Mn.pc), om=KALK.in.ekspl_pct/100, B=+(state.lay.budU||500000), goal=state.lay.budG||'ef';
  const G=[['ab','АБК'],['fac','Фасади'],['lan','Ліхтарі'],['wh','Склад'],['roof','Дах цеху']].map(([k,n])=>{ const x=S[k]; return {n,kwp:x.kwp,mwh:x.mwh,cap:x.kwp*KALK.in.capex_ses_usd_kwp,ef:x.mwh*efM}; }).sort((a,b)=>b.mwh/b.cap-a.mwh/a.cap);
  let left=B; const pick=[]; G.forEach(g=>{ if(g.cap<=left){ pick.push({...g,f:1}); left-=g.cap; } else if(left>2e4){ const f=left/g.cap; pick.push({...g,kwp:g.kwp*f,mwh:g.mwh*f,cap:left,ef:g.ef*f,f}); left=0; } });
  const tot=pick.reduce((s_,g)=>({kwp:s_.kwp+g.kwp,mwh:s_.mwh+g.mwh,cap:s_.cap+g.cap,ef:s_.ef+g.ef}),{kwp:0,mwh:0,cap:0,ef:0});
  return head('Гроші · під бюджет',`${usd(B)} → ${f1(tot.kwp)} кВтп · ≈${f0(tot.mwh)} МВт·год`,`Поверхні набираються від найвигіднішої (МВт·год на 1 $) до кінця бюджету; ціна СЕС — ${nf(KALK.in.capex_ses_usd_kwp)} $/кВтп, ефект — ${nf(efM,0)} $ на 1 МВт·год, як у розрахунку «лише СЕС» (споживання ${nf(KALK.sc[i_].mwh)} МВт·год, видача до 2 МВт).`)+
  `<div class="blk wide"><div class="kb"><input type="number" id="budU" min="50000" step="50000" value="${B}" aria-label="Бюджет, $"> <span class="seg" role="group" aria-label="Ціль">${[['ef','Економія'],['gen','Генерація']].map(([k,t])=>`<button type="button" data-budg="${k}" aria-pressed="${goal===k}">${t}</button>`).join('')}</span></div>
  <table class="cmp an"><thead><tr><th>Поверхня</th><th>кВтп</th><th>МВт·год</th><th>Капвитрати</th><th>Ефект за рік</th></tr></thead><tbody>${pick.map(g=>`<tr><td class="w">${g.n}${g.f<1?` <small>частина ${f0(g.f*100)} %</small>`:''}</td><td>${f1(g.kwp)}</td><td>${f0(g.mwh)}</td><td>${usd(g.cap)}</td><td>${usd(g.ef)}</td></tr>`).join('')}
  <tr class="tot"><td class="w">Разом · окупність ${f1(tot.cap/(tot.ef-tot.cap*om))} року</td><td>${f1(tot.kwp)}</td><td>${f0(tot.mwh)}</td><td>${usd(tot.cap)}</td><td>${usd(tot.ef)}</td></tr></tbody></table>
  <p class="src">${goal==='gen'?'Ціль «генерація»: за однакової ціни кВтп порядок той самий — спершу поверхні з найбільшим виробітком на кВтп.':'Ціль «економія»: ефект — гроші на рік, окупність — проста, з експлуатацією '+nf(KALK.in.ekspl_pct,2)+' %.'} Накопичувачі — «Окупність» і «Сценарії» (4 або 8 контейнерів).</p></div>`; }
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
  <p class="src">qp = ${KW?nf(KW.qp*1000,0):'—'} Па на висоті 15,9 м (EN 1991-1-4, місцевість III); власна вага поля ${KW?nf(KW.g*1000,0):'—'} Па (модуль, лага, 2 блоки); γ вітру 1,5, ваги 0,9. Зони — EN для плаского даху, e = ${KW?nf(KW.e,1):'—'} м. c_net для поля модулів уздовж покрівлі — за EN 1991-1-4 і SEAOC (у ДБН схеми для такого поля немає), рішення 05.11. Додатково всього ${KW?nf(KW.extra.tot):'—'} блоків з бортиком по краю поля ${KW?nf(KW.per_len,0):'—'} м.</p></div>
  <div class="blk wide"><h3>Сніг</h3><table class="cmp an"><tbody><tr><td class="w">Поле, μ = 1</td><td>${nf(ms.length-lam)} модулів · ${nf(GF*S0,2)} кПа · ${nf(GF*S0/QM*100,0)} % від 3,6 кПа</td></tr>
  <tr><td class="w">Біля ліхтарів (зона b₁ = h₁ ≈ 1,9 м), μ = 2,0</td><td>${nf(lam)} модулів · ${nf(GF*S0*2,2)} кПа · ${nf(GF*S0*2/QM*100,0)} %</td></tr></tbody></table>
  <p class="src">ДБН дод. Ж: склепінчасті багатопролітні (схема 6) — варіант зі снігом в ендовах лише при f/L > 0,1; у нас 1,19 / 18 = 0,066, тому μ = 1. Біля подовжніх ліхтарів (схема 3) μ обмежено 2,0 для покриття по профнастилу — взято верхню межу (консервативно). Модуль: 5 400 Па випробування / 1,5 = 3,6 кПа.</p></div>
  ${needB('Що ще перевірити:',['сповзання снігу з гладких модулів в ендови і водостоки — у ДБН схеми немає; переріз ендов і обігрів',`зсув поля по схилу до 16°: ${KW?nf(KW.F_slide,0):'—'} кН сумарно тримають шпильки через гребінь (${KW?nf(KW.per_tie,1):'—'} кН на шпильку) — тертя мата по мембрані невідоме до вибору мембрани`,'лага разом з рамою модуля під сніг μ = 2 біля ліхтарів — розрахунок «Лага 0°» зроблено для μ = 1',`несуча здатність покриття цеху: +${LD?nf(LD.rows.find(r=>r.k==='roof').kgm2,1):'≈30'} кг/м² від поля СЕС (у «Баласт і вага») і перерозподіл снігу — потрібне обстеження`,'ліхтарі під 41°: вітер на високі навітряні площини і опора рейок — не вирішено'])}`; }
function pObs(){ const L=[['Несучі конструкції покриття цеху','тип (арки, ферми, прогони), крок, перерізи, стан, проєктні навантаження',`чи витримає навантаження з «Баласт і вага» (поле ${LD?nf(LD.rows.find(r=>r.k==='roof').kgm2,1):'≈30'} кг/м², у середньому ${LD?nf(LD.groups[0].kgm2_plan,1):'≈20'} кг/м²) і сніг біля ліхтарів`],
  ['Покрівля і мембрана','шари, вага, стан; марка і вага нової мембрани; тертя мата по мембрані','баласт, зсув по схилу'],['Ендови й водостоки','переріз, ухил, обігрів, стан','сповзання снігу з модулів'],
  ['Парапети і краї даху','висота, стан, кріплення','бортики, зони F і G'],['Каркаси ліхтарів','стан, переріз, вузли; на що спирати рейки 41×41','модулі під 41° і вітер'],
  ['Стінові панелі фасадів','тип, товщина, міцність; випробування анкерів M10 / M12 на висмикування','фасади і козирки 25°'],['Майданчики контейнерів','ґрунти, підземні мережі, проїзд крана, підпірна стінка ТП-6923','фундаменти Фп-1, кран'],
  ['ТП-5913 і ТП-6923','РУ-0,4 кВ: місце підключення, вільні комірки, прохід кабелів крізь стіну','лінії AC, захист']];
  return head('Конструкція · обстеження','Що виміряти на місці','Без цих даних перевірки «витримає / не витримає» показують «потрібно». Фото обстеження в модель не ставимо.')+
  `<div class="blk wide"><table class="cmp an"><thead><tr><th>Що</th><th>Виміряти, з'ясувати</th><th>Для чого</th><th>Стан</th></tr></thead><tbody>${L.map(([a,b,c])=>`<tr><td class="w">${a}</td><td class="w">${b}</td><td class="w">${c}</td><td>потрібно</td></tr>`).join('')}</tbody></table></div>`; }
// ---------- кошторис по етапах 04.11 (calc/ep04/bom.json): СЕС до PCS — кріплення, баласт, кабелі, щити, лінії, лотки, блискавкозахист
const KI=typeof KOSH!=='undefined'?KOSH.items:null;
function koshTbl(filt){ if(!KI) return window.__PUB!==false?'':needB('Потрібно: кошторис.'); const st=state.lay.stg, S_=st==='all'?['1','2']:[st], rows=S_.flatMap(s=>(KI[s]||[]).map(x=>[s,...x])).filter(r=>!filt||filt(r[1]));
  const G={}; rows.forEach(r=>{ const k=r[1]; (G[k]=G[k]||[]).push(r); }); const tot=rows.reduce((s_,r)=>s_+r[6],0), h=rows.reduce((s_,r)=>s_+r[7],0);
  return `<div class="blk wide"><div class="tw"><table class="cmp an"><thead><tr><th>Позиція</th><th>Етап</th><th>Кількість</th><th>Ціна, $</th><th>Сума, $</th></tr></thead><tbody>${Object.entries(G).map(([g,L])=>`<tr class="tot"><td class="w">${g}</td><td></td><td></td><td></td><td>${(t_=>t_?nf(t_):'у роботах')(Math.round(L.reduce((s_,r)=>s_+r[6],0)))}</td></tr>`+L.map(r=>r[5]||r[6]?`<tr><td class="w">${r[2]}</td><td>${r[0]}</td><td>${nf(r[4],r[4]%1?1:0)} ${r[3]}</td><td>${nf(r[5],2)}</td><td>${nf(Math.round(r[6]))}</td></tr>`:`<tr><td class="w">${r[2]}</td><td>${r[0]}</td><td>${nf(r[4],r[4]%1?1:0)} ${r[3]}</td><td colspan="2" style="text-align:right">у роботах 50 $/кВт · ${nf(Math.round(r[7]))} люд.год</td></tr>`).join('')).join('')}
  <tr class="tot"><td class="w">Разом</td><td></td><td>${nf(Math.round(h))} люд.год</td><td></td><td>${nf(Math.round(tot))}</td></tr></tbody></table></div><p class="src">Кошторис і специфікація по етапах: СЕС до PCS, $ без ПДВ. Модулі, контейнери, EMS — у «Обладнанні».</p></div>`; }
// ---------- Електрика → лінії і лотки: траси і перевірка проходів (calc/ep04/prohody.py, 05.11)
function pLinChk(){ const E4=typeof ELEC04!=='undefined'?ELEC04:null, C=E4&&E4.chk; if(!C) return needB('Потрібно: перевірка проходів.');
  const ZN={'Пд':'Відступ від південного парапету','Пн':'Відступ від північного парапету','Зх':'Відступ від стіни західної будівлі','Сх':'Відступ від східного парапету','Сх–Зх':'Проходи Сх–Зх (протипожежні розриви)','Пн–Пд':'Проходи Пн–Пд уздовж ендов 7 і 10','ендова':'Уздовж ендови між Л1 і Л2 (проходу немає)'};
  const MN={par:'на парапеті',blk:'на блоках'}, ok=(c,r)=>r==null?'':c>=r-0.005?' ✓':' ⚠';
  const rows=C.agg.map(a=>`<tr><td class="w">${ZN[a.z]||a.z}</td><td>${a.req==null?'—':nf(a.req,2)}</td><td>${nf(a.gap,2)}</td><td>${nf(a.clr,2)}${ok(a.clr,a.req)}</td><td>${a.w.join(', ')}</td><td>${a.m.map(m=>MN[m]||m).join(', ')}</td><td>${f1(a.L)}</td></tr>`).join('');
  const bz={}; C.boxes.forEach(b=>{ (bz[b.z]=bz[b.z]||[]).push(b); });
  const brow=Object.entries(bz).map(([z,L])=>{ const m=Math.min(...L.map(b=>b.clr)), r=L[0].req; return `<tr><td class="w">${ZN[z]||z}</td><td>${L.length}</td><td>${r==null?'—':nf(r,2)}</td><td>${nf(m,2)}${ok(m,r)}</td></tr>`; }).join('');
  const Lr=C.agg.reduce((s_,a)=>s_+a.L,0), Lp=C.agg.filter(a=>a.m.includes('par')).reduce((s_,a)=>s_+a.L,0);
  return head('Електрика · лінії і лотки','Лотки біля краю — проходи лишаються вільними','Перевірено на моделі 05.11: лотки й щити стояли посередині проходів і ділили їх навпіл. Тепер — біля краю: смуги Пд, Пн і Сх — на парапеті (без блоків на ходовій смузі), смуга Зх і проходи — на блоках біля краю поля, щити в проходах Сх–Зх — на рамі над лотком біля південного краю (тінь падає в прохід, не на модулі). Спуски — у простінках між вікнами, де немає модулів фасаду.')+
  `<div class="blk wide"><div class="kpis"><div class="kpi"><span class="k">Лотки на даху</span><span class="v">${f0(Lr)} <small>м</small></span><span class="s">${f0(Lp)} м на парапеті · ${f0(Lr-Lp)} м на блоках</span></div>
  <div class="kpi"><span class="k">Переходи через лотки</span><span class="v">${C.stepovers}</span><span class="s">${C.cross} на перетинах смуг · ${C.nbx} біля щитів (стрінги через смугу)</span></div>
  <div class="kpi"><span class="k">Щитів на даху</span><span class="v">${C.boxes.length}</span><span class="s">жоден не стоїть посередині проходу</span></div>
  <div class="kpi"><span class="k">Спуски</span><span class="v">2</span><span class="s">схід Y ${nf(E4.DE[1],1)} · північ X ${nf(E4.DN[0],2)}</span></div></div></div>
  <div class="blk wide"><h3>Скільки лишається вільним біля лотка</h3><div class="tw"><table class="cmp an"><thead><tr><th>Смуга / прохід</th><th>Потрібно, м</th><th>Ширина, м</th><th>Лишається, м</th><th>Лоток</th><th>Кріплення</th><th>Довжина, м</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="src">Потрібна ширина — правила розкладки В1 (IFC 2021 § 1205.3, FK Bauaufsicht), погоджуються з ДСНС. Проходи Сх–Зх: біля лотка лишається ${nf((C.agg.find(a=>a.z==='Сх–Зх')||{}).clr||0,2)} м, біля щита — ${nf(Math.min(...(bz['Сх–Зх']||[{clr:0}]).map(b=>b.clr)),2)} м, менше за 2,49 м розриву, але хід ≥ 1,22 м є (рішення власника 05.11 — «біля краю поля»).</p></div>
  <div class="blk wide"><h3>Щити на даху</h3><div class="tw"><table class="cmp an"><thead><tr><th>Де</th><th>Щитів</th><th>Потрібно, м</th><th>Лишається, м</th></tr></thead><tbody>${brow}</tbody></table></div></div>
  <div class="blk wide"><h3>Що ще відкрито</h3><ul class="open">${C.flags.map(f=>`<li>${f[0].toUpperCase()+f.slice(1)}.</li>`).join('')}
  <li>Біля труб на смугах лишається вузько (труби звужували смугу й раніше): Д57 — 0,60 м між трубою і лотком на парапеті, Д36 — 0,90 м, Д2 — 0,94 м.</li>
  <li>Вздовж ендови між Л1 і Л2 лоток — на підставках біля краю поля, 0,7 м від лівневки ЛВ-2: вісь стоку вільна, але сніг і лід біля лотка — перевірити на місці.</li>
  <li>ШВ К-3 і К-1 — на стіні цеху у 3-метровій зоні між цехом і контейнерами; К-4 і К-5 стоять за 1,74 м один від одного — вільну зону Golen (3 м) погодити з Golen.</li>
  <li>Лотки ліній етапу 1 лежать на даху ще до нової мембрани (етап 2): лотки на блоках при укладанні мембрани знімаються й ставляться назад; кронштейни на парапеті — вище фартуха мембрани.</li>
  <li>Стрінги південного фасаду заходять на дах через парапет — вузол проходу через парапет (короб, герметизація) — потрібно.</li></ul></div>`; }
// ================= 06.11: графіки генерації по місяцях; деталізація щитів, лотків і кабелів, блискавкозахисту (власник 06.11, 03:16)
const MON=['січ','лют','бер','кві','тра','чер','лип','сер','вер','жов','лис','гру'], MONL=['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень'];
const ELD_=typeof ELD!=='undefined'?ELD:null;
// помісячна форма генерації для набору нормалей (та сама модель, що «Стан модулів і доба»: Meteonorm, Ineichen, середня погода), без тіні
function moPOA(ns){ const o=new Array(12).fill(0); if(!ns.length) return o; WX.mo.forEach((W,m)=>{ const wt=W.nd/6; W.st.forEach(s=>{ const G=s[4],Dn=s[5],D=s[6],ext=s[7],ta=s[8],Ai=ext>0?Dn/ext:0,cz=Math.max(s[3],0.01),Go=W.c*G;
  for(const n of ns){ const nz=n[2], cb=Math.max(0,s[1]*n[0]+s[2]*n[1]+s[3]*n[2]), bc=Dn*cb+D*Ai*cb/cz, iso=D*(1-Ai)*(1+nz)/2, gr=G*0.2*(1-nz)/2;
    o[m]+=wt*(W.p*modP(bc+iso+gr,ta,MCFG.ours)+(1-W.p)*modP(Go*(1+nz)/2+Go*0.2*(1-nz)/2,ta,MCFG.ours)); } }); }); return o; }
let GMO=null;
// групи: річна сума — та сама, що в таблиці «Рік»; розподіл по місяцях — з розрахунку кожної поверхні (дах — радіація з тінню 26.10, фасади і козирок — FACPV,
// АБК — 12 стрінгів моделі АБК, ліхтарі і склад — модель доби за нормалями модулів); колір групи сталий (не за рангом)
function genMo(){ if(GMO) return GMO; const S=ST.sums(), FT=typeof FACPV!=='undefined'?FACPV:null, WN=typeof WHNP!=='undefined'&&WHNP?WHNP:null;
  const nrm=f=>{ const L=RN?RN.MODS.filter(f):[], k=Math.max(1,Math.floor(L.length/160)); return L.filter((_,i)=>i%k===0).map(m=>[m.w.x,-m.w.z,m.w.y]); };
  const sc=(sh,tot)=>{ const s=sh.reduce((a,b)=>a+b,0); return sh.map(v=>s>0?v/s*tot:0); }, z12=()=>new Array(12).fill(0);
  const ab=typeof ABK_DC!=='undefined'?ABK_DC.strings.reduce((a,s)=>a.map((v,i)=>v+s.mo[i]),z12()):RADD.mo.roof;
  const fk=FT?S.fac.mwh*1000/FT.tot.all.kwh:0, whS=S.wh.mwh-(WN?WN.mwh:0), whSn=S.wh.n-(WN?WN.n:0);
  const L=[['roof','Дах цеху','2',RADD.mo.roof,S.roof.mwh,S.roof.kwp,'«Лага 0°» по арці, 0–16°'],
    ['facS','Фасад південь','1',FT?FT.mo.S:RADD.mo.S,FT?FT.tot.S.kwh*fk/1000:0,FT?FT.tot.S.kwp:0,'вертикально, азимут 184°'],
    ...(FT&&!FT.tot.Ev.n?[]:[['facE','Фасад схід','1',FT?FT.mo.Ev:RADD.mo.E,FT?FT.tot.Ev.kwh*fk/1000:0,FT?FT.tot.Ev.kwp:0,'вертикально, азимут 94°']]),   // 06.11: вертикальні модулі сходу прибрано
    ['koz','Козирок 25° на сході','1',FT?FT.mo.Ec:RADD.mo.E,FT?FT.tot.Ec.kwh*fk/1000:0,FT?FT.tot.Ec.kwp:0,'верхній ряд східного фасаду'],
    ['lan','Ліхтарі','1',moPOA(nrm(m=>m.grp==='lan')),S.lan.mwh,S.lan.kwp,'на склінні 41–46°, схід і захід'],
    ['wh','Склад, південні скати','1',moPOA(nrm(m=>m.grp==='wh'&&-m.w.z<=0.05)),whS,whSn*0.73,'11° і 22° на південь'],
    ['whn','Склад, північні скати (опція)','1',moPOA(nrm(m=>m.grp==='wh'&&-m.w.z>0.05)),WN?WN.mwh:0,WN?WN.kwp:0,'17° і 22° на північ'],
    ['ab','АБК','1',ab,S.ab.mwh,S.ab.kwp,'арка, нижній дах, надбудова, стіни']];
  GMO=L.map(([k,n,st,sh,tot,kwp,d],i)=>({k,n,st,d,kwp,tot,mo:sc(sh,tot),c:`var(--s${i+1})`})).filter(g=>g.tot>0.05); return GMO; }
const niceTop=v=>{ const p=Math.pow(10,Math.floor(Math.log10(Math.max(v,1e-6)))), r=v/p, s=r<=1?1:r<=1.5?1.5:r<=2?2:r<=2.5?2.5:r<=3?3:r<=4?4:r<=5?5:r<=6?6:r<=8?8:10; return s*p; };
// монотонний кубічний сплайн (Фріч–Карлсон): плавна «парабола» без викидів за дані
function monoSeg(xs,ys){ const n=xs.length, d=[], m=new Array(n); for(let i=0;i<n-1;i++) d.push((ys[i+1]-ys[i])/(xs[i+1]-xs[i]));
  m[0]=d[0]; m[n-1]=d[n-2]; for(let i=1;i<n-1;i++) m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
  for(let i=0;i<n-1;i++){ if(d[i]===0){ m[i]=m[i+1]=0; continue; } const a=m[i]/d[i], b=m[i+1]/d[i], h=a*a+b*b; if(h>9){ const t=3/Math.sqrt(h); m[i]=t*a*d[i]; m[i+1]=t*b*d[i]; } }
  const S=[]; for(let i=0;i<n-1;i++){ const h=(xs[i+1]-xs[i])/3; S.push([xs[i],ys[i],xs[i]+h,ys[i]+m[i]*h,xs[i+1]-h,ys[i+1]-m[i+1]*h,xs[i+1],ys[i+1]]); } return S; }
const fw=v=>Math.round(v*10)/10, segF=S=>S.map(s=>`C${fw(s[2])},${fw(s[3])} ${fw(s[4])},${fw(s[5])} ${fw(s[6])},${fw(s[7])}`).join(''), segR=S=>S.slice().reverse().map(s=>`C${fw(s[4])},${fw(s[5])} ${fw(s[2])},${fw(s[3])} ${fw(s[0])},${fw(s[1])}`).join('');
const mwhF=v=>v>=100?nf(v,0):v>=10?nf(v,1):nf(v,2);
// складений графік по місяцях з наведенням
function drawStack(el,G){ const W=Math.max(300,el.clientWidth), ph=W<560, H=ph?230:270, l=ph?34:44, r=10, t=16, b=24, pw=W-l-r, bw=pw/12;
  const cum=[]; G.forEach((g,k)=>cum.push(g.mo.map((v,m)=>v+(k?cum[k-1][m]:0)))); const tot=cum[cum.length-1], top=niceTop(Math.max(...tot)*1.08);
  const X=m=>l+(m+0.5)*bw, Y=v=>t+(1-v/top)*(H-t-b), xs=MON.map((_,m)=>X(m)), tk=[0,0.25,0.5,0.75,1].map(f=>f*top);
  let s=`<svg width="${W}" height="${H}" role="img" aria-label="Генерація по місяцях, МВт·год">`;
  tk.forEach(v=>{ s+=`<line x1="${l}" x2="${W-r}" y1="${fw(Y(v))}" y2="${fw(Y(v))}" class="gg"/><text x="${l-6}" y="${fw(Y(v)+4)}" class="ga" text-anchor="end">${nf(v,top<10?1:0)}</text>`; });
  G.forEach((g,k)=>{ const up=monoSeg(xs,cum[k].map(Y)), lo=monoSeg(xs,(k?cum[k-1]:tot.map(()=>0)).map(Y));
    s+=`<path d="M${fw(xs[0])},${fw(Y(cum[k][0]))}${segF(up)}L${fw(xs[11])},${fw(Y(k?cum[k-1][11]:0))}${segR(lo)}Z" fill="${g.c}" class="gsb"/>`; });
  const T=monoSeg(xs,tot.map(Y)); s+=`<path d="M${fw(xs[0])},${fw(Y(tot[0]))}${segF(T)}" class="gt"/>`;
  MON.forEach((mn,m)=>{ if(!ph||m%2===0) s+=`<text x="${fw(X(m))}" y="${H-6}" class="ga" text-anchor="middle">${mn}</text>`; });
  const pk=tot.indexOf(Math.max(...tot)); s+=`<text x="${fw(X(pk))}" y="${fw(Y(tot[pk])-6)}" class="gv" text-anchor="middle">${mwhF(tot[pk])}</text>`;
  s+=`<line class="gx" x1="0" x2="0" y1="${t}" y2="${H-b}" style="visibility:hidden"/><rect x="${l}" y="${t}" width="${pw}" height="${H-t-b}" fill="transparent" class="gh"/></svg><div class="gtip" hidden></div>`;
  el.innerHTML=s; const sv=el.querySelector('svg'), ln=el.querySelector('.gx'), tip=el.querySelector('.gtip');
  const show=e=>{ const R=sv.getBoundingClientRect(), px=e.clientX-R.left, m=Math.max(0,Math.min(11,Math.floor((px-l)/bw))); ln.setAttribute('x1',X(m)); ln.setAttribute('x2',X(m)); ln.style.visibility='visible';
    tip.innerHTML=`<b>${MONL[m]}</b>${G.slice().reverse().map(g=>`<span><i class="sw" style="background:${g.c}"></i>${g.n}<em>${mwhF(g.mo[m])}</em></span>`).join('')}<span class="tt">Разом<em>${mwhF(tot[m])} МВт·год</em></span>`; tip.hidden=false;
    const tw=tip.offsetWidth; tip.style.left=Math.max(0,Math.min(W-tw,X(m)+(X(m)>W/2?-tw-12:12)))+'px'; tip.style.top=t+'px'; };
  const hide=()=>{ ln.style.visibility='hidden'; tip.hidden=true; };
  sv.addEventListener('pointermove',show); sv.addEventListener('pointerdown',show); sv.addEventListener('pointerleave',hide); }
// мала крива групи: своя шкала, підпис піку і грудня
function drawMini(el,g){ const W=Math.max(180,el.clientWidth), H=92, l=6, r=6, t=18, b=16, bw=(W-l-r)/12, top=Math.max(...g.mo)*1.05||1, X=m=>l+(m+0.5)*bw, Y=v=>t+(1-v/top)*(H-t-b), xs=MON.map((_,m)=>X(m)), S_=monoSeg(xs,g.mo.map(Y));
  const pk=g.mo.indexOf(Math.max(...g.mo)), lo=g.mo.indexOf(Math.min(...g.mo));
  el.innerHTML=`<svg width="${W}" height="${H}" role="img" aria-label="${g.n}: генерація по місяцях"><line x1="${l}" x2="${W-r}" y1="${H-b}" y2="${H-b}" class="gg"/>
  <path d="M${fw(xs[0])},${fw(H-b)}L${fw(xs[0])},${fw(Y(g.mo[0]))}${segF(S_)}L${fw(xs[11])},${fw(H-b)}Z" fill="${g.c}" class="ga2"/><path d="M${fw(xs[0])},${fw(Y(g.mo[0]))}${segF(S_)}" stroke="${g.c}" class="gl"/>
  <circle cx="${fw(X(pk))}" cy="${fw(Y(g.mo[pk]))}" r="4" fill="${g.c}" class="gd"/><text x="${fw(Math.min(W-30,Math.max(30,X(pk))))}" y="${fw(Y(g.mo[pk])-7)}" class="gv" text-anchor="middle">${mwhF(g.mo[pk])}</text>
  <circle cx="${fw(X(lo))}" cy="${fw(Y(g.mo[lo]))}" r="3" fill="${g.c}" class="gd"/><text x="${fw(Math.min(W-24,Math.max(24,X(lo))))}" y="${fw(Y(g.mo[lo])-6)}" class="ga" text-anchor="middle">${mwhF(g.mo[lo])}</text>
  ${[0,5,11].map(m=>`<text x="${fw(X(m))}" y="${H-3}" class="ga" text-anchor="middle">${MON[m]}</text>`).join('')}</svg>`; }
function drawGen(root){ const G=genMo().filter(g=>state.lay.stg==='all'||g.st===state.lay.stg); const st=root.querySelector('[data-gch]'); if(st) drawStack(st,G);
  root.querySelectorAll('[data-gm]').forEach(el=>{ const g=G.find(x=>x.k===el.dataset.gm); if(g) drawMini(el,g); }); }
let rzT=null; window.addEventListener('resize',()=>{ clearTimeout(rzT); rzT=setTimeout(()=>{ const p=$('#pane'); if(p&&p.querySelector('[data-gch]')) drawGen(p); if(p&&p.querySelector('[data-scch]')) scDraw(p); if(p) arbDraw(p); },200); });
function genBlocks(){ const G=genMo().filter(g=>state.lay.stg==='all'||g.st===state.lay.stg); if(!G.length) return ''; const T=G.reduce((a,g)=>a+g.tot,0), tm=MON.map((_,m)=>G.reduce((a,g)=>a+g.mo[m],0));
  const pk=tm.indexOf(Math.max(...tm)), dec=tm[11];
  return `<div class="blk wide"><h3>Генерація по місяцях — ${G.length>1?'кожна група своїм кольором':G[0].n}, МВт·год</h3>
  <div class="glg">${G.map(g=>`<span><i class="sw" style="background:${g.c}"></i>${g.n} <b>${mwhF(g.tot)}</b></span>`).join('')}</div>
  <div class="gch" data-gch="1"></div>
  <p class="src">Разом ${nf(T,0)} МВт·год за рік: найбільше в ${MONL[pk].replace(/ень$/,'ні').replace(/ий$/,'ому')} — ${mwhF(tm[pk])}, у грудні — ${mwhF(dec)} (у ${(n=>n+' '+(n%10===1&&n%100!==11?'раз':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'рази':'разів'))(Math.round(tm[pk]/Math.max(dec,1e-6)))} менше). Наведіть або натисніть на місяць — внесок кожної групи. Річні суми — ті самі, що в таблиці нижче; розподіл по місяцях: дах цеху — радіація з тінню (розрахунок 26.10), фасади і козирок — розрахунок фасадів 27.10, АБК — 12 стрінгів моделі АБК, ліхтарі і склад — модель «Стан модулів і доба» за нормалями модулів.</p></div>
  <div class="blk wide"><h3>Кожна група окремо — крива за рік</h3><div class="gms">${G.map(g=>`<div class="gm"><div class="gmh"><i class="sw" style="background:${g.c}"></i><span>${g.n}<small>${g.d}</small></span></div>
  <div class="gmv"><b>${mwhF(g.tot)}</b> МВт·год · ${g.kwp?nf(g.tot*1000/g.kwp,0)+' кВт·год/кВтп':''}</div><div class="gmc" data-gm="${g.k}"></div>
  <div class="gms2">літо / зима: ${nf(Math.max(...g.mo)/Math.max(Math.min(...g.mo),1e-6),1)} раза · ${nf(g.tot/T*100,1)} % етапу</div></div>`).join('')}</div>
  <details class="ld"><summary>Таблиця по місяцях, МВт·год</summary><div class="tw"><table class="cmp an"><thead><tr><th>Група</th>${MON.map(m=>`<th>${m}</th>`).join('')}<th>Рік</th></tr></thead><tbody>
  ${G.map(g=>`<tr><td class="w">${g.n}</td>${g.mo.map(v=>`<td>${mwhF(v)}</td>`).join('')}<td><b>${mwhF(g.tot)}</b></td></tr>`).join('')}<tr class="tot"><td class="w">Разом</td>${tm.map(v=>`<td>${mwhF(v)}</td>`).join('')}<td>${nf(T,1)}</td></tr></tbody></table></div></details></div>`; }
// ---------- Електрика → Щити PV: склад обладнання і кабелі по кожному щиту
const stOn=st=>state.lay.stg==='all'||String(st)===state.lay.stg;
function pShch(){ if(!ELD_) return needB('Потрібно: деталізація щитів.'); const B=ELD_.boxes.filter(b=>stOn(b.st)), S_=[1,2].filter(stOn), sum=f=>B.reduce((a,b)=>a+f(b),0);
  const Cq=k=>S_.reduce((a,s)=>a+(ELD_.cables[s].find(c=>c.k===k)||{q:0}).q,0), ns=sum(b=>b.ns), al120=Cq('al120'), al185=Cq('al185'), c6=sum(b=>b.c6), c6e=Cq('c6'), spare=S_.reduce((a,s)=>a+ELD_.shields[s],0)-B.length;
  const eqv=i=>S_.reduce((a,s)=>a+ELD_.eq[i][1+s],0), b7=ELD_.boxes.find(b=>b.ns===7);
  const GO=['fac','lan','wh','whn','abk','roof'], rows=B.slice().sort((a,b)=>GO.indexOf(a.g)-GO.indexOf(b.g)||(+a.id.replace(/\D/g,''))-(+b.id.replace(/\D/g,''))||a.id.localeCompare(b.id));
  const mt=ELD_.mnt.filter(([s])=>stOn(s));
  return head('Електрика · щити PV',`${stgN()}: ${nf(B.length)} щитів PV 7/1 · ${nf(ns)} стрінгів`,`Тип — щит PV 7/1 (до 7 стрінгів, 1 вихід на вхід DC/DC 60 кВт контейнера); склад — за кресленням ЕП.РР4 26.10, той самий щит у кошторисі 06.11: запобіжники gPV на обох полюсах кожного стрінга, роз'єднувач, ОПН тип 1+2, контроль струму. Модуль ZNSHINE 730 Вт: Iкз ${nf(ELD_.mod.isc,2)} А, Iмп ${nf(ELD_.mod.imp,2)} А, стрінг 11 модулів — Uхх ≤ ${nf(ELD_.mod.uoc,1)} В при −25 °C.`)+
  `<div class="kpis"><div class="kpi"><span class="k">Щитів</span><span class="v">${nf(B.length)}</span><span class="s">+ ${nf(spare)} ${spare===1?'запасний':'запасні'} у кошторисі (по 1 на етап)</span></div>
  <div class="kpi"><span class="k">Запобіжників gPV 32 А</span><span class="v">${nf(2*ns)}</span><span class="s">2 на стрінг · ${nf(ns)} пар MC4 на корпусах</span></div>
  <div class="kpi"><span class="k">Кабель Al від щитів</span><span class="v">${nf(Math.round(al120+al185))} <small>м</small></span><span class="s">1×120 — ${nf(Math.round(al120))} м · 1×185 — ${nf(Math.round(al185))} м (2 жили, +3 %)</span></div>
  <div class="kpi"><span class="k">Мідь 1×6 до щитів</span><span class="v">${nf(Math.round(c6))} <small>м</small></span><span class="s">H1Z2Z2-K, стрінги і перемички</span></div></div>
  <div class="blk wide"><h3>Склад щита і разом на ${S_.length>1?"весь об'єкт":'етап '+S_[0]}</h3><div class="tw"><table class="cmp an"><thead><tr><th>Обладнання</th><th>Од.</th><th>На щит з 7 стрінгами</th><th>Разом</th></tr></thead><tbody>
  ${ELD_.eq.map((e,i)=>`<tr><td class="w">${e[0]}</td><td>${e[1]}</td><td>${b7?nf(b7.eq[i]):'—'}</td><td><b>${nf(eqv(i))}</b></td></tr>`).join('')}</tbody></table></div>
  <p class="src">Роз'єднувач — на 1,25 × Iкз щита (до ${nf(Math.max(...B.map(b=>b.dis)),0)} А для 7 стрінгів), обрано ≥ 200 А. Наконечники DTL-2 у щиті — під переріз лінії (2 на щит; ще 2 — у ШВ). Модель і виробник кожної позиції — у специфікації, тут — тип і кількість.</p></div>
  <div class="blk wide"><h3>Де і як встановлено</h3><table class="cmp an"><tbody>${mt.map(([s,m,n])=>`<tr><td class="w">${m}</td><td>етап ${s}</td><td>${nf(n)} щитів</td></tr>`).join('')}</tbody></table></div>
  <div class="blk wide"><h3>Щити по одному — стрінги, струм, лінія, кабель</h3><div class="tw"><table class="cmp an eq"><thead><tr><th>Щит</th><th>Етап</th><th>Стрінгів</th><th>кВтп</th><th>Iмп / Iкз, А</th><th>Лінія Al</th><th>Траса, м</th><th>Al, м</th><th>ΔU, %</th><th>Cu 1×6, м</th><th>RS485, м</th><th>У ШВ</th></tr></thead><tbody>
  ${rows.map(b=>`<tr><td class="w">${b.id} → ${b.K}<small>${b.gn} · ${b.pl}</small></td><td>${b.st}</td><td>${b.ns}</td><td>${nf(b.kwp,1)}</td><td>${nf(b.imp,1)} / ${nf(b.isc,1)}</td><td>2 × 1×${b.S}</td><td>${nf(b.L,1)}</td><td>${nf(Math.round(b.al))}</td><td>${nf(b.du,2)}</td><td>${nf(b.c6)}</td><td>${nf(b.rs)}</td><td>${b.spd}, Cu 1×50 2 × 6 м</td></tr>`).join('')}
  <tr class="tot"><td class="w">Разом</td><td></td><td>${nf(ns)}</td><td>${nf(sum(b=>b.kwp),1)}</td><td></td><td></td><td>${nf(Math.round(sum(b=>b.L)))}</td><td>${nf(Math.round(sum(b=>b.al)))}</td><td></td><td>${nf(Math.round(c6))}</td><td>${nf(sum(b=>b.rs))}</td><td></td></tr></tbody></table></div>
  <p class="src">Траса — довжина лінії від щита до ШВ з запасом 5 % + 4 м; кабель Al — 2 жили × траса × 1,03 на розкрій (як у кошторисі). ΔU — лінія Al при Iмп. Мідь 1×6 — норма кошторису 46,6 м на стрінг + 10 %; склад — за трасами стрінгів до щита на стіні; АБК — кошторис АБК 28.10 пропорційно стрінгам${c6e>c6+1?`; у кошторисі ${nf(c6e)} м — ще 1 стрінг ліхтарів (було 28, у щитах 27) і перемички між ліхтарями 144 м`:''}. PE щита — Cu 1×16 ≈2,5 м до конструкції. F2 — ПЗІП тип 2 у ШВ для ліній з даху і фасадів цеху, F3 — тип 1+2 для ліній з інших будівель (склад, АБК).</p></div>`; }
// ---------- Електрика → лінії і лотки: лотки по місцях, кабелі по марках і перерізах
function linDetail(){ if(!ELD_) return ''; const S_=[1,2].filter(stOn), TL=ELD_.TL.map((t,i)=>[...t,i]).filter(t=>stOn(t[0])).sort((a,b)=>a[0]-b[0]||a[4]-b[4]), W_=['100×50','200×50','300×100','400×100'];
  const byW=W_.map(w=>[w,TL.filter(t=>t[2]===w).reduce((a,t)=>a+t[3],0),S_.reduce((a,s)=>a+(ELD_.TQ[s][w]||0),0)]).filter(x=>x[1]>0);
  const net=byW.reduce((a,x)=>a+x[1],0), Cb=k=>S_.reduce((a,s)=>a+(ELD_.cables[s].find(c=>c.k===k)||{q:0}).q,0);
  const cab=ELD_.cables[1].map((c,i)=>({...c,q1:stOn(1)?c.q:0,q2:stOn(2)?ELD_.cables[2][i].q:0})).filter(c=>c.q1+c.q2>0);
  const al=cab.filter(c=>c.m==='Al').reduce((a,c)=>a+c.q1+c.q2,0), cu=cab.filter(c=>c.m==='Cu'&&c.k!=='rs').reduce((a,c)=>a+c.q1+c.q2,0);
  const sup=ELD_.SUP.map(r=>[r[0],r[1],stOn(1)?r[2]:0,stOn(2)?r[3]:0]).filter(r=>r[2]+r[3]>0);
  const lg=S_.reduce((a,s)=>({120:a[120]+ELD_.lugs[s][120],185:a[185]+ELD_.lugs[s][185]}),{120:0,185:0});
  return `<div class="kpis"><div class="kpi"><span class="k">Лотки</span><span class="v">${nf(Math.round(net))} <small>м</small></span><span class="s">${byW.map(x=>`${x[0]} — ${nf(Math.round(x[1]))}`).join(' · ')}</span></div>
  <div class="kpi"><span class="k">Кабель алюмінієвий</span><span class="v">${nf(Math.round(al))} <small>м</small></span><span class="s">1×120 — ${nf(Cb('al120'))} м · 1×185 — ${nf(Cb('al185'))} м</span></div>
  <div class="kpi"><span class="k">Кабель і провід мідний</span><span class="v">${nf(Math.round(cu))} <small>м</small></span><span class="s">1×6 стрінги ${nf(Cb('c6'))} · 1×50 ${nf(Cb('cu50'))} · 1×16 ${nf(Math.round(Cb('pe16')+Cb('lp16')))} · 1×6 ж-з ${nf(Math.round(Cb('lp6')))}</span></div>
  <div class="kpi"><span class="k">RS485 в екрані</span><span class="v">${nf(Cb('rs'))} <small>м</small></span><span class="s">щит → ШВ уздовж лінії</span></div></div>
  <div class="blk wide"><h3>Кабелі — марка, переріз, метраж</h3><div class="tw"><table class="cmp an"><thead><tr><th>Кабель / провід</th><th>Метал</th><th>мм²</th>${S_.map(s=>`<th>Етап ${s}, м</th>`).join('')}${S_.length>1?'<th>Разом, м</th>':''}</tr></thead><tbody>
  ${cab.map(c=>`<tr><td class="w">${c.n}</td><td>${c.m==='Fe'?'сталь':c.m==='Al'?'алюміній':'мідь'}</td><td>${c.k==='strip'?'25×4':c.k==='rs'?'2×2×0,75':nf(c.s)}</td>${S_.map(s=>`<td>${nf(s===1?c.q1:c.q2,(s===1?c.q1:c.q2)%1?1:0)}</td>`).join('')}${S_.length>1?`<td><b>${nf(c.q1+c.q2,(c.q1+c.q2)%1?1:0)}</b></td>`:''}</tr>`).join('')}
  <tr class="tot"><td class="w">Алюміній разом</td><td></td><td></td>${S_.map(s=>`<td>${nf(cab.filter(c=>c.m==='Al').reduce((a,c)=>a+(s===1?c.q1:c.q2),0))}</td>`).join('')}${S_.length>1?`<td>${nf(Math.round(al))}</td>`:''}</tr>
  <tr class="tot"><td class="w">Мідь разом (без RS485)</td><td></td><td></td>${S_.map(s=>`<td>${nf(Math.round(cab.filter(c=>c.m==='Cu'&&c.k!=='rs').reduce((a,c)=>a+(s===1?c.q1:c.q2),0)))}</td>`).join('')}${S_.length>1?`<td>${nf(Math.round(cu))}</td>`:''}</tr></tbody></table></div>
  <p class="src">Кошторис 06.11 (і кошторис АБК 28.10 для мідних 1×6 АБК); алюміній — з запасом 3 % на розкрій. Наконечники Al/Cu: DTL-2-120 — ${nf(lg[120])}, DTL-2-185 — ${nf(lg[185])} (по 4 на лінію: 2 у щиті, 2 у ШВ). Кожна лінія — у «Щити PV».</p></div>
  <div class="blk wide"><h3>Лотки — де, якої ширини, скільки</h3><div class="tw"><table class="cmp an"><thead><tr><th>Місце</th><th>Етап</th><th>Лоток</th><th>Довжина, м</th></tr></thead><tbody>
  ${TL.map(t=>`<tr><td class="w">${t[1]}</td><td>${t[0]}</td><td>${t[2]}</td><td>${nf(t[3],t[3]%1?1:0)}</td></tr>`).join('')}
  ${byW.map(x=>`<tr class="tot"><td class="w">Лоток ${x[0]} разом</td><td></td><td></td><td>${nf(x[1],1)}${x[2]?`<small>у кошторисі ${nf(x[2],1)} з запасом 5 %</small>`:''}</td></tr>`).join('')}</tbody></table></div>
  <p class="src">Лоток перфорований оцинкований з кришкою; фасонні частини, з'єднувачі з перемичкою заземлення і траверси — у ціні лотка (× 1,53). Ширина — за кількістю ліній у коридорі (до 3 ліній — 100×50, до 6 — 200×50, до 18 — 300×100, до 24 — 400×100). АБК — лотки стрінгів з кошторису АБК 28.10.</p></div>
  <div class="blk wide"><h3>Опори і кріплення лотків</h3><table class="cmp an"><thead><tr><th>Елемент</th><th>Од.</th>${S_.map(s=>`<th>Етап ${s}</th>`).join('')}</tr></thead><tbody>${sup.map(r=>`<tr><td class="w">${r[0]}</td><td>${r[1]}</td>${S_.map(s=>`<td>${r[s+1]?nf(r[s+1]):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
// ---------- Електрика → блискавкозахист: схема ПЗІП, провідники і затискачі по місцях
function bzSVG(){ const bx=(x,y,w,h,t,sb,cl)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="bzb ${cl||''}"/><text x="${x+w/2}" y="${y+21}" text-anchor="middle" class="bzt">${t}</text>${(sb||[]).map((q,i)=>`<text x="${x+w/2}" y="${y+39+i*15}" text-anchor="middle" class="bzs">${q}</text>`).join('')}`;
  const ar=(x1,y1,x2,y2,a,b_,ax,ay,anc)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="bzl" marker-end="url(#bza)"/><text x="${ax}" y="${ay}" text-anchor="${anc||'middle'}" class="bzs">${a}</text>${b_?`<text x="${ax}" y="${ay+(anc?15:26)}" text-anchor="${anc||'middle'}" class="bzs">${b_}</text>`:''}`;
  const dl=(x1,y1,x2,y2,t,tx,ty,anc)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="bzl d"/>${t?`<text x="${tx}" y="${ty}" text-anchor="${anc||'start'}" class="bzs">${t}</text>`:''}`;
  const mk=`<defs><marker id="bza" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L8,4L0,8Z" class="bzm"/></marker></defs>`;
  const B=[['Модулі і кріплення',['рами, лаги, рейки','з’єднані між собою'],''],['Щит PV 7/1',['F1 — ОПН тип 1+2','запобіжники, роз’єднувач'],'k'],['ШВ біля контейнера',['F2 тип 2 — з цеху','F3 тип 1+2 — склад, АБК'],'k'],['Контейнер Golen',['DC/DC → PCS','F4 / F5 AC тип 2'],'k'],['ТП',['F6 тип 1+2','на вводі'],'k']];
  const A=[['1×6 Cu','у рукаві'],['Al 1×120 / 185','+ Cu 1×6 ж-з'],['Cu 1×50','2 × 6 м'],['AC','']], G=['затискачі EN 62561-1','PE Cu 1×16','Cu 1×16','контур','заземлення ТП'];
  // горизонтально (комп'ютер)
  const X=[[0,150],[220,160],[490,150],[710,140],[900,100]];
  let h=`<svg class="bzh" viewBox="0 0 1000 320" width="100%" role="img" aria-label="Схема захисту від перенапруг: від модуля до ТП">${mk}`;
  X.forEach(([x,w],k)=>{ h+=bx(x,28,w,86,...B[k]); if(k<4){ const x1=x+w, x2=X[k+1][0]; h+=ar(x1,71,x2-3,71,A[k][0],A[k][1],(x1+x2)/2,62); } h+=dl(x+w/2,114,x+w/2,214,G[k],k<4?x+w/2+6:x+w/2-6,168,k<4?'start':'end'); });
  h+=`<rect x="0" y="214" width="1000" height="52" rx="8" class="bzb g"/><text x="500" y="236" text-anchor="middle" class="bzt">Зрівнювання потенціалів і заземлення: конструкції СЕС → струмовідводи будівлі → заземлення ТП</text><text x="500" y="254" text-anchor="middle" class="bzs">контури контейнерів — смуга 25×4 до ТП · щогл немає (рішення 25.10)</text>
  <text x="500" y="296" text-anchor="middle" class="bzs">Дані: RS485 від щитів і Ethernet контейнерів — ПЗІП ліній даних F7–F9 біля контейнерів.</text></svg>`;
  // вертикально (телефон)
  let v=`<svg class="bzv" viewBox="0 0 360 640" width="100%" role="img" aria-label="Схема захисту від перенапруг: від модуля до ТП">${mk}`;
  B.forEach((b,k)=>{ const y=10+k*118; v+=bx(10,y,230,74,...b); if(k<4) v+=ar(125,y+74,125,y+115,A[k][0],A[k][1],134,y+92,'start'); v+=dl(240,y+37,300,y+37,'',0,0); });
  v+=`<rect x="300" y="10" width="50" height="546" rx="8" class="bzb g"/><text transform="translate(330,283) rotate(-90)" text-anchor="middle" class="bzt">зрівнювання потенціалів і заземлення</text>`;
  G.forEach((g,k)=>{ v+=`<text x="244" y="${10+k*118+31}" class="bzs" text-anchor="start" style="font-size:9.5px">${['затиск.','PE 1×16','Cu 1×16','контур','ТП'][k]}</text>`; });
  v+=`<text x="10" y="590" class="bzs">Контури контейнерів — смуга 25×4 до ТП; щогл немає.</text><text x="10" y="610" class="bzs">Дані RS485 / Ethernet — ПЗІП F7–F9 біля контейнерів.</text></svg>`;
  return h+v; }
function pBz2(){ if(!ELD_) return head('Електрика · блискавкозахист','Блискавкозахист без щогл')+koshTbl(g=>/Блискавко/.test(g)); const S_=[1,2].filter(stOn), Z=ELD_.LPZ.filter(z=>stOn(z.st));
  return head('Електрика · блискавкозахист','Блискавкозахист без щогл — захист від перенапруг і зрівнювання потенціалів','Рішення 25.10: щогл немає. Усі металеві конструкції СЕС з’єднані між собою і з струмовідводами будівель, кожен щит PV має ОПН тип 1+2 (F1), кожна лінія в ШВ — свій ПЗІП (F2 — з даху і фасадів цеху, F3 тип 1+2 — з інших будівель), AC контейнерів і вводи ТП — F4–F6, лінії даних — F7–F9; контейнери — свій контур заземлення, смугою до ТП.')+
  `<div class="blk wide"><h3>Схема: від модуля до ТП</h3><div class="tw bzw">${bzSVG()}</div></div>
  <div class="blk wide"><h3>ПЗІП (обмежувачі перенапруг) — де і скільки</h3><div class="tw"><table class="cmp an"><thead><tr><th>Позначення</th><th>Тип</th><th>Де</th>${S_.map(s=>`<th>Етап ${s}</th>`).join('')}</tr></thead><tbody>
  ${ELD_.SPD.map(r=>`<tr><td class="w"><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td>${S_.map(s=>`<td>${r[2+s]?nf(r[2+s]):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
  ${Z.map(z=>`<div class="blk wide"><h3>${z.n}</h3><table class="cmp an"><tbody>${z.f1?`<tr><td class="w">ОПН F1 тип 1+2 у щитах PV</td><td>шт</td><td>${nf(z.f1)}</td></tr>`:''}<tr><td class="w">ПЗІП у ШВ / на вводах</td><td></td><td>${z.spd}</td></tr>
  ${z.items.map(r=>`<tr><td class="w">${r[0]}</td><td>${r[1]}</td><td>${typeof r[2]==='number'?nf(r[2],r[2]%1?1:0):r[2]}</td></tr>`).join('')}</tbody></table></div>`).join('')}
  ${KI?`<div class="blk wide"><h3>Позиції кошторису і ціни</h3></div>${koshTbl(g=>/Блискавко/.test(g))}`:''}`; }
function pLin(){ const old=pLinChk(), m=old.match(/^<div class="ph"[^>]*><span[^>]*>[^<]*<\/span><h2>([\s\S]*?)<\/h2>(?:<p>([\s\S]*?)<\/p>)?<\/div>/), rest=m?old.slice(m[0].length):old;
  return head('Електрика · лінії і лотки',`${stgN()}: лотки і кабелі — алюміній, мідь`,'Лотки — по місцях, ширинах і опорах; кабелі — по марках, перерізах і метражу за кошторисом. Нижче — як лотки стоять у проходах даху цеху.')+linDetail()+(m?`<div class="blk wide"><h3>Проходи на даху цеху: ${m[1].replace(/^./,c=>c.toLowerCase())}</h3>${m[2]?`<p class="src">${m[2]}</p>`:''}</div>`:'')+rest; }
// ---------- Гроші → арбітраж: пільга ч. 10 ст. 58-1 (ses_uze/pilga_58_1.py), лаконічно: закон, перемикач, варіанти, доба
const ARBD=['vesna','lito','osin','zyma'], ARBN={vesna:'весна, 21.03',lito:'літо, 21.06',osin:'осінь, 23.09',zyma:'зима, 21.12'};
function arbDay(el,L,v,dk,rm){ const D=L.dni[dk], F=v[rm].dni[dk]; if(!D||!F) return; const W=Math.max(300,el.clientWidth), l=46, r=8, bw=(W-l-r)/24, X=h=>l+(h+0.5)*bw;
  const pH=96, eH=170, pt=12, gap=22, ph=W<560, rdn=D.rdn, pmx=niceTop(Math.max(...rdn)*1.05), Yp=v_=>pt+(1-v_/pmx)*(pH-pt-14);
  const up=F.bl.map((x,h)=>x+F.bx[h]), dn=F.gb.map((x,h)=>x+F.pb[h]), em=niceTop(Math.max(...up,...dn,1)*1.08), e0=pH+gap+eH/2, Ye=v_=>e0-v_/em*(eH/2-8);
  const S=[['gb','--s1','заряд з мережі',-1],['pb','--s3','заряд від СЕС',-1],['bl','--s7','розряд у цех',1],['bx','--s2','розряд у мережу',1]];
  let s=`<svg width="${W}" height="${pH+gap+eH+20}" role="img" aria-label="Доба арбітражу">`;
  [0,0.5,1].forEach(f=>{ const y=Yp(f*pmx); s+=`<line x1="${l}" x2="${W-r}" y1="${fw(y)}" y2="${fw(y)}" class="gg"/><text x="${l-5}" y="${fw(y+4)}" class="ga" text-anchor="end">${nf(f*pmx/1000,f*pmx<10000&&f?1:0)}</text>`; });
  s+=`<text x="${l}" y="9" class="ga">РДН, тис. грн/МВт·год</text><path d="M${rdn.map((p,h)=>`${fw(X(h))},${fw(Yp(p))}`).join('L')}" class="gt" style="opacity:1;stroke-width:2"/>`;
  const hmx=rdn.indexOf(Math.max(...rdn)), hmn=rdn.indexOf(Math.min(...rdn)); s+=`<text x="${fw(X(hmx))}" y="${fw(Yp(rdn[hmx])-5)}" class="gv" text-anchor="middle">${nf(rdn[hmx])}</text><text x="${fw(X(hmn))}" y="${fw(Yp(rdn[hmn])+13)}" class="ga" text-anchor="middle">${nf(rdn[hmn])}</text>`;
  [-1,0,1].forEach(f=>{ const y=Ye(f*em); s+=`<line x1="${l}" x2="${W-r}" y1="${fw(y)}" y2="${fw(y)}" class="${f?'gg':'gx0'}"/><text x="${l-5}" y="${fw(y+4)}" class="ga" text-anchor="end">${nf(Math.abs(f*em)/1000,1)}</text>`; });
  s+=`<text x="${l}" y="${pH+gap-6}" class="ga">МВт·год: вгору — розряд, вниз — заряд</text>`;
  for(let h=0;h<24;h++){ let yu=0, yd=0; const x0=X(h)-bw*0.38, w=bw*0.76;
    S.forEach(([k,c,,sg])=>{ const v_=F[k][h]; if(v_<1) return; if(sg>0){ s+=`<rect x="${fw(x0)}" y="${fw(Ye(yu+v_))}" width="${fw(w)}" height="${fw(Ye(yu)-Ye(yu+v_))}" fill="var(${c})" class="gsb"/>`; yu+=v_; } else { s+=`<rect x="${fw(x0)}" y="${fw(Ye(-yd))}" width="${fw(w)}" height="${fw(Ye(-yd-v_)-Ye(-yd))}" fill="var(${c})" class="gsb"/>`; yd+=v_; } }); }
  [0,6,12,18,23].forEach(h=>{ s+=`<text x="${fw(X(h))}" y="${pH+gap+eH+14}" class="ga" text-anchor="middle">${h}:00</text>`; });
  el.innerHTML=s+'</svg>'; }
// варіант арбітражу: етап 1 — 4 контейнери; весь об'єкт / етап 2 — весь об'єкт з вибраною кількістю (спільно з «Окупністю»)
function arbSel(){ const {i,r,S}=scSt(), nV=[...new Set(S.vse.map(x=>x.n))].filter(n=>n).sort((a,b)=>a-b), n=nV.includes(+state.lay.ekoN)?+state.lay.ekoN:nV[0];
  const e1=state.lay.stg==='1', x=(e1?S.e1:S.vse).find(q=>q.n===(e1?4:n)&&q.rezhym===r); return {i,r,S,n,nV,e1,x,nm:e1?'Етап 1 + 4 контейнери':`Весь об'єкт + ${n} ${kont(n)}`}; }
function arbDraw(p){ const ab=p.querySelector('[data-arb]'); if(!ab||!KA) return; const {x}=arbSel(), dk=state.lay.arbD||ARBD[state.day]||'lito', ds=ARBS[dk];
  if(x&&x.doby&&x.doby[ds]&&KA.doby[ds]) arbDay(ab,{dni:{[dk]:{rdn:KA.doby[ds].rdn}}},{x:{dni:{[dk]:x.doby[ds]}}},dk,'x'); }
const ARBS={vesna:'2026-03-21',lito:'2026-06-21',osin:'2026-09-23',zyma:'2025-12-21'};
function pArb(){ if(!KA) return needB('Потрібно: розрахунок окупності.');
  const {i,r,S,n,nV,e1,x,nm}=arbSel(), I=KA.in, dk=state.lay.arbD||ARBD[state.day]||'lito', ds=ARBS[dk], D=KA.doby[ds], F=x&&x.doby&&x.doby[ds], Z=KA.zakon;
  const ksd=a=>nf(Math.round(a/1000)), per=KA.period.map(d=>d.split('-').reverse().join('.')).join(' – '), avg=(q,p_)=>{ const s_=q.reduce((a,b)=>a+b,0); return s_?q.reduce((a,b,h)=>a+b*p_[h],0)/s_:0; }, sum=q=>q.reduce((a,b)=>a+b,0);
  const rows=[['Етап 1 + 4 контейнери',`${nf(KA.kwp.e1,1)} кВтп`,S.e1.find(q=>q.n===4&&q.rezhym===r),e1]].concat(nV.map(k=>[`Весь об'єкт + ${k} ${kont(k)}`,`${nf(KA.kwp.vse,1)} кВтп`,S.vse.find(q=>q.n===k&&q.rezhym===r),!e1&&k===n]));
  return head('Гроші · арбітраж',`${nm}: ${usd(x.efekt_usd)} на рік · окупність ${okT(x.okupnist)}${x.okupnist!=null&&x.okupnist<=I.horyzont_rokiv?' року':''}`,
    `Накопичувачі заряджаються, коли дешево (від СЕС або з мережі), і розряджаються в цех або в мережу, коли дорого — до ${nf(I.uze_tsykliv_doba)} циклів на добу, якщо спред перекриває втрати і знос ${nf(KA.znos,2)} грн/кВт·год. Ціни РДН ${per}, споживання ${nf(S.mwh)} МВт·год.`)+
  `<div class="blk wide">${Z?`<div class="law"><b>Ч. 10 ст. 58-1</b> Закону «Про ринок електричної енергії» (ред. ${Z.redaktsiia}): ${Z.sut.replace(/^./,c=>c.toLowerCase())} Рахуємо лише з цією пільгою. <a href="${Z.url}" target="_blank" rel="noopener">Текст закону ↗</a><small>${Z.perevirka}.</small></div>`:''}
  <div class="kb" role="group" aria-label="Споживання за рік">${KA.sc.map((s_,k)=>`<button type="button" data-sci="${k}" aria-pressed="${k===i}">${nf(s_.mwh)} МВт·год</button>`).join('')}</div>
  <div class="kb" role="group" aria-label="Видача в мережу">${SCR.map(([k,t])=>`<button type="button" data-scr="${k}" aria-pressed="${k===r}">${t}</button>`).join('')}</div>
  ${e1?'':`<div class="kb" role="group" aria-label="Контейнерів на весь об'єкт">${nV.map(k=>`<button type="button" data-ekon="${k}" aria-pressed="${k===n}">${k} ${kont(k)}</button>`).join('')}</div>`}
  <div class="tw"><table class="cmp an"><thead><tr><th>Варіант</th><th>Ефект, тис. $/рік</th><th>Окупність, років</th><th>NPV, тис. $</th><th>Циклів за рік</th><th>Заряд з мережі, МВт·год</th><th>Розряд у мережу, МВт·год</th></tr></thead><tbody>
  ${rows.map(([t,sm,q,cur])=>q?`<tr class="${cur?'cur':''}"><td class="w">${t}<small>${sm}</small></td><td>${ksd(q.efekt_usd)}</td><td>${okT(q.okupnist)}</td><td>${ksd(q.npv)}</td><td>${nf(q.tsykly_rik)}</td><td>${nf(q.mwh.gb)}</td><td>${nf(q.mwh.bx)}</td></tr>`:'').join('')}</tbody></table></div></div>
  <div class="blk wide"><h3>Доба накопичувачів · ${nm.toLowerCase()}</h3><div class="kb" role="group" aria-label="Доба">${ARBD.map(k=>`<button type="button" data-arbd="${k}" aria-pressed="${k===dk}">${ARBN[k]}</button>`).join('')}</div>
  <div class="glg">${[['--s1','заряд з мережі'],['--s3','заряд від СЕС'],['--s7','розряд у цех'],['--s2','розряд у мережу']].map(([c,t])=>`<span><i class="sw" style="background:var(${c})"></i>${t}</span>`).join('')}<span><i class="sw" style="background:var(--ink)"></i>ціна РДН</span></div>
  <div class="gch" data-arb="1" style="min-height:300px"></div>
  <p class="src">${D&&F?`${ds.split('-').reverse().join('.')}: ${sum(F.gb)>50?`з мережі ${nf(sum(F.gb)/1000,1)} МВт·год по ${nf(avg(F.gb,D.rdn))} грн/МВт·год (РДН)`:`з мережі не заряджали`}, від СЕС ${nf(sum(F.pb)/1000,1)} МВт·год; у цех ${nf(sum(F.bl)/1000,1)}, у мережу ${nf(sum(F.bx)/1000,1)} МВт·год${sum(F.bx)>50?` по ${nf(avg(F.bx,D.rdn))}`:''}. `:''}За рік: розряд ${nf(x.mwh.bl+x.mwh.bx,0)} МВт·год, з них у мережу ${nf(x.mwh.bx,0)}; заряд з мережі ${nf(x.mwh.gb,0)}, від СЕС ${nf(x.mwh.pb,0)}; ${nf(x.dni['2'])} діб з двома циклами.</p></div>
  <div class="blk wide"><p class="src"><b>Враховано:</b> споживання ${nf(S.mwh)} МВт·год за рік, зимою на ${nf(I.zyma_lito_pct)} % більше, ніж улітку (погодинних даних немає); ${nf(I.uze_kw)} кВт / ${nf(I.uze_kwh)} кВт·год на контейнер, розряд до ${nf(I.uze_dod_pct)} %, ККД циклу ${nf(I.uze_kkd_pct)} %; ціни відомі наперед — верхня межа керування (EMS); видача до ${nf(I.vydacha_stsenarii_kw)} кВт — сценарій. Розрахунок ${KA.date.split('-').reverse().join('.')}.</p>
  ${needB('Потрібно:',['ТУ на видачу 2 МВт','статус активного споживача і окремий облік накопичувачів (ч. 5 ст. 58-1)','дозвіл ДТЕК на заряд з мережі і договірна потужність','договір продажу за РДН — комісія трейдера не врахована'])}</div>`; }
// ---------- Гроші → сценарії: калькулятор ses-uze-modul (ses_uze.kalkuliator), споживання 1 100 / 3 000 / 5 000 МВт·год × 4 і 8 контейнерів, лише з пільгою ч. 10 ст. 58-1
const KA=typeof KALK!=='undefined'?KALK:null, SCR=[['lim','Видача до 2 МВт'],['zero','Нульовий експорт']];
const scSt=()=>{ const i=Math.min(Math.max(+(state.lay.scI??1),0),KA.sc.length-1), r=state.lay.scR||'lim'; return {i,r,S:KA.sc[i],V:n=>KA.sc[i].vse.find(x=>x.n===n&&x.rezhym===r)}; };
const okT=v=>v==null||v>KA.in.horyzont_rokiv?'не окупається':nf(v,1), kont=n=>n%10===1&&n%100!==11?'контейнер':[2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?'контейнери':'контейнерів', SCRl={lim:'видача до 2 МВт',zero:'нульовий експорт'};
function scDraw(p){ if(!KA) return; const {i,r}=scSt(), NS=[...new Set(KA.sc[0].vse.map(x=>x.n))].filter(n=>n).sort((a,b)=>a-b), C={[NS[0]]:'--s1',[NS[1]]:'--s2'};
  const a=p.querySelector('[data-scch="ok"]'); if(a){ const W=Math.max(280,a.clientWidth), l=W<480?82:110, rr=W<480?84:96, bh=13, g=12, H=KA.sc.length*(NS.length*(bh+3)+g)+18;
    const vals=KA.sc.flatMap(s=>s.vse.filter(x=>x.n&&x.rezhym===r&&x.okupnist!=null&&x.okupnist<=KA.in.horyzont_rokiv).map(x=>x.okupnist)), top=niceTop(Math.max(4,...vals)*1.05), X=v=>l+v/top*(W-l-rr);
    let s=`<svg width="${W}" height="${H}" role="img" aria-label="Окупність за споживанням">`; [0,0.5,1].forEach(f=>{ const x=X(f*top); s+=`<line x1="${fw(x)}" x2="${fw(x)}" y1="0" y2="${H-16}" class="gg"/><text x="${fw(x)}" y="${H-3}" class="ga" text-anchor="middle">${nf(f*top,f*top%1?1:0)}${f===1?' р.':''}</text>`; });
    let y=2; KA.sc.forEach((sc,k)=>{ const y0=y; NS.forEach(n=>{ const x=sc.vse.find(q=>q.n===n&&q.rezhym===r), ok=x&&x.okupnist!=null&&x.okupnist<=KA.in.horyzont_rokiv;
        s+=ok?`<rect x="${l}" y="${fw(y)}" width="${fw(Math.max(2,X(x.okupnist)-l))}" height="${bh}" rx="3" fill="var(${C[n]})" class="gsb"><title>${nf(sc.mwh)} МВт·год, ${n} ${kont(n)}: ${nf(x.okupnist,1)} року</title></rect><text x="${fw(X(x.okupnist)+5)}" y="${fw(y+bh-2)}" class="gv">${nf(x.okupnist,1)}<tspan class="ga"> · ${n} конт.</tspan></text>`
          :`<text x="${l+4}" y="${fw(y+bh-2)}" class="ga">${n} конт. — не окупається за ${KA.in.horyzont_rokiv} років</text>`; y+=bh+3; });
      s+=`<text x="${l-8}" y="${fw((y0+y-3)/2+4)}" class="${k===i?'gv':'ga'}" text-anchor="end">${nf(sc.mwh)} МВт·год</text>`; y+=g; });
    a.innerHTML=s+'</svg>'; }
  const b=p.querySelector('[data-scch="c2"]'); if(b){ const S=KA.sc[i], W=Math.max(280,b.clientWidth), l=30, rr=6, H=150, pt=10, pb=20, MS=['січ','лют','бер','кві','тра','чер','лип','сер','вер','жов','лис','гру'];
    const vs=NS.map(n=>S.vse.find(q=>q.n===n&&q.rezhym===r)), top=niceTop(Math.max(5,...vs.flatMap(x=>x?x.dni_2_po_misiatsiakh:[0]))), gw=(W-l-rr)/12, bw=Math.min(14,(gw-6)/NS.length), Y=v=>pt+(1-v/top)*(H-pt-pb);
    let s=`<svg width="${W}" height="${H}" role="img" aria-label="Діб з двома циклами по місяцях">`; [0,0.5,1].forEach(f=>{ const yy=Y(f*top); s+=`<line x1="${l}" x2="${W-rr}" y1="${fw(yy)}" y2="${fw(yy)}" class="${f?'gg':'gx0'}"/><text x="${l-5}" y="${fw(yy+4)}" class="ga" text-anchor="end">${nf(f*top)}</text>`; });
    MS.forEach((m,k)=>{ const x0=l+k*gw+(gw-bw*NS.length)/2; vs.forEach((x,j)=>{ if(!x) return; const v=x.dni_2_po_misiatsiakh[k]; if(v>0) s+=`<rect x="${fw(x0+j*bw)}" y="${fw(Y(v))}" width="${fw(bw)}" height="${fw(Y(0)-Y(v))}" rx="2" fill="var(${C[x.n]})" class="gsb"><title>${m}: ${x.n} ${kont(x.n)} — ${v} діб з двома циклами</title></rect>`; });
      s+=`<text x="${fw(l+(k+0.5)*gw)}" y="${H-5}" class="ga" text-anchor="middle">${W<420?m[0].toUpperCase():m}</text>`; });
    b.innerHTML=s+'</svg>'; } }
function pSc(){ if(!KA) return needB('Потрібно: розрахунок сценаріїв.');
  const {i,r,S,V}=scSt(), I=KA.in, NS=[...new Set(S.vse.map(x=>x.n))].filter(n=>n).sort((a,b)=>a-b), X=NS.map(V), best=X.reduce((a,b)=>b&&(!a||b.npv>a.npv)?b:a,null), C={[NS[0]]:'--s1',[NS[1]]:'--s2'};
  const ksd=v=>nf(Math.round(v/1000)), mln=v=>(v<0?'−':'')+nf(Math.abs(v)/1e6,2), per=KA.period.map(d=>d.split('-').reverse().join('.')).join(' – '), kwh=I.uze_kwh*I.uze_dod_pct/100, law=KA.zakon;
  const row=(t,f,sm)=>`<tr><td class="w">${t}${sm?`<small>${sm}</small>`:''}</td>${X.map(x=>`<td>${x?f(x):'—'}</td>`).join('')}</tr>`;
  const zam=x=>x.zamina_roky.length?x.zamina_roky.map(y=>`${y}-й рік`).join(', ')+`<small>${x.n} × ${nf(I.uze_zamina_usd)} $ = ${ksd(x.n*I.uze_zamina_usd)} тис. $</small>`:'—';
  const hh=!best?'Сценарії':best.npv<0?`${nf(S.mwh)} МВт·год, ${SCRl[r]}: жоден варіант не окупається за ${I.horyzont_rokiv} років`:`${nf(S.mwh)} МВт·год, ${SCRl[r]}: краще ${best.n} ${kont(best.n)} — окупність ${okT(best.okupnist)} року, NPV ${mln(best.npv)} млн $`;
  return head('Гроші · сценарії',hh,
    `Уся СЕС ${nf(I.ses_kwp[0],0)} кВтп, ціни РДН ${per}, лише з пільгою ч. 10 ст. 58-1. Розрахунок на весь об'єкт — однаковий для всіх етапів.`)+
  `<div class="blk wide"><div class="kb" role="group" aria-label="Споживання за рік">${KA.sc.map((s_,k)=>`<button type="button" data-sci="${k}" aria-pressed="${k===i}">${nf(s_.mwh)} МВт·год</button>`).join('')}</div>
  <div class="kb" role="group" aria-label="Видача в мережу">${SCR.map(([k,t])=>`<button type="button" data-scr="${k}" aria-pressed="${k===r}">${t}</button>`).join('')}</div>
  <div class="tw"><table class="cmp an"><thead><tr><th></th>${X.map(x=>`<th><i class="sw" style="background:var(${C[x.n]})"></i> ${x.n} ${kont(x.n)}${x===best&&best.npv>0?'<span class="best">більший NPV</span>':''}</th>`).join('')}</tr></thead><tbody>
  ${row('Капвитрати, тис. $',x=>`${ksd(x.capex.razom)}<small>контейнери ${ksd(x.capex.uze)} · СЕС ${ksd(x.capex.ses)} · EMS ${ksd(x.capex.ems)}${x.capex.inshe?` · робот ${ksd(x.capex.inshe)}`:''}</small>`,'без ПДВ')}
  ${row('Ефект за рік, тис. $',x=>`${ksd(x.efekt_usd)}<small>з нього СЕС ${ksd(x.efekt_ses_usd)}</small>`)}
  ${row('Окупність, років',x=>okT(x.okupnist))}
  ${row(`NPV за ${I.horyzont_rokiv} років, млн $`,x=>mln(x.npv),`ставка ${nf(I.stavka_pct)} %`)}
  ${row('IRR',x=>x.irr!=null?nf(x.irr,1)+' %':'—')}
  ${row('Циклів за рік',x=>nf(x.tsykly_rik),`до ${nf(I.uze_tsykliv_doba)} на добу`)}
  ${row('Діб з двома циклами',x=>nf(x.dni['2']))}
  ${row('Заміна батарей',zam,`${nf(I.uze_resurs_tsykliv)} циклів або ${nf(I.uze_strok_rokiv)} років — що раніше`)}
  ${row('Розряд у мережу, МВт·год',x=>nf(x.mwh.bx))}
  ${row('Сонце в мережу / обрізано, МВт·год',x=>`${nf(x.mwh.px)} / ${nf(x.mwh.pc)}`)}
  ${row('Контейнери понад попередній варіант окупаються за, років',x=>x.pryrist?okT(x.pryrist.okupnist):'—',`${NS[0]} — до «лише СЕС», ${NS[1]} — до ${NS[0]}`)}
  </tbody></table></div></div>
  <div class="blk wide"><h3>Окупність за споживанням · ${SCRl[r]}</h3><div class="glg">${NS.map(n=>`<span><i class="sw" style="background:var(${C[n]})"></i>${n} ${kont(n)}</span>`).join('')}</div><div class="gch" data-scch="ok" style="min-height:150px"></div></div>
  <div class="blk wide"><h3>Діб з двома циклами по місяцях · ${nf(S.mwh)} МВт·год</h3><div class="glg">${X.map(x=>x?`<span><i class="sw" style="background:var(${C[x.n]})"></i>${x.n} ${kont(x.n)} — <b>${nf(x.dni['2'])}</b> діб за рік</span>`:'').join('')}</div><div class="gch" data-scch="c2" style="min-height:150px"></div>
  <p class="src">Другий цикл за добу робиться лише тоді, коли спред перекриває втрати і знос батарей.</p></div>
  <div class="blk wide"><div class="kpis"><div class="kpi"><span class="k">Контейнер під ключ</span><span class="v">${nf(I.capex_uze_usd)} <small>$</small></span><span class="s">${KA.pr.capex_uze_usd}</span></div>
  <div class="kpi"><span class="k">Знос батарей</span><span class="v">${nf(KA.znos,2)} <small>грн/кВт·год</small></span><span class="s">заміна ${nf(I.uze_zamina_usd)} $ / (${nf(I.uze_resurs_tsykliv)} циклів × ${nf(kwh,1)} кВт·год) × ${nf(I.kurs,2)} грн/$ / √${nf(I.uze_kkd_pct/100,2)}</span></div>
  <div class="kpi"><span class="k">СЕС</span><span class="v">${nf(I.ses_kwp[0],0)} <small>кВтп</small></span><span class="s">${nf(I.capex_ses_usd_kwp)} $/кВтп — кошторис під ключ 26.10 (18 % + 4 % запасу)</span></div>
  <div class="kpi"><span class="k">Споживання</span><span class="v">${nf(S.mwh)} <small>МВт·год</small></span><span class="s">у середньому ${nf(S.kw)} кВт; зимою на ${nf(I.zyma_lito_pct)} % більше, ніж улітку</span></div></div></div>
  <div class="blk wide">${law?`<div class="law"><b>Ч. 10 ст. 58-1</b> Закону «Про ринок електричної енергії»: рахуємо лише з пільгою — передача і розподіл на заряд з мережі платяться тільки з різниці місячного відбору і відпуску накопичувачів. <a href="${law.url}" target="_blank" rel="noopener">Текст закону ↗</a><small>${law.perevirka}.</small></div>`:''}
  <p class="src"><b>Враховано:</b> ціни РДН погодинно ${per} + передача, диспетчеризація і розподіл на дату кожної доби; сонце — генерація двійника; ${nf(I.uze_kw)} кВт / ${nf(I.uze_kwh)} кВт·год на контейнер, розряд до ${nf(I.uze_dod_pct)} %, ККД циклу ${nf(I.uze_kkd_pct)} %; ціни відомі наперед — верхня межа керування (EMS); видача 2 МВт — сценарій. Розрахунок ${KA.date.split('-').reverse().join('.')}.</p>
  ${needB('Потрібно:',['договірна потужність — зараз відбір не обмежено: 8 контейнерів заряджаються з мережі до 4 МВт','гарантія Golen: ресурс циклів і залишкова ємність (у розрахунку — 6 000 циклів)','мідні лінії до ТП для кожного додаткового контейнера (≈27 тис. $ за кошторисом 26.10) — не враховано','місце для контейнерів 5–8 — у моделі розставлено 4','ТУ на видачу 2 МВт; статус активного споживача і окремий облік накопичувачів (ч. 5 ст. 58-1)'])}</div>`; }
const PANES={arb:pArb,sc:pSc,shch:pShch,lin:pLin,kut:pKut,nav:pNav,obs:pObs,rik:pRik,flow:()=>head('Сонце і генерація · потоки енергії','Потоки енергії')+needB('Потрібно: погодинне споживання з АСКОЕ за 12–36 місяців по трьох точках обліку — тоді показуємо, куди йде енергія щогодини: цех, накопичувачі, мережа.'),
  kr:pKr,bal:pBal,roz:pRoz,bz:pBz2,
  obl:pObl,kn:()=>head('Гроші · конструкція','Кріплення і баласт — кошторис 04.11','')+koshTbl(g=>/Кріплення|Баласт/.test(g)),mn:pMn,ksh:()=>head('Гроші · кошторис',`${stgN()}: СЕС до PCS по позиціях`,'')+(typeof WHNP!=='undefined'&&WHNP&&state.lay.stg!=='2'?`<div class="blk wide"><p class="src"><b>У т. ч. опція етапу 1 «склад, північні скати»</b> — ${WHNP.n} модулів, ${nf(WHNP.kwp,1)} кВтп, ≈${nf(WHNP.mwh,1)} МВт·год за рік: повна ціна <b>${nf(Math.round(WHNP.cost.net))} $</b> без ПДВ (${nf(Math.round(WHNP.cost.vat))} $ з ПДВ). У таблиці нижче — її частина «СЕС до PCS» (група «Склад, північні скати» + щити, лінії, ПЗІП F3, лотки фасаду і перестановка 2 щитів даху на К-4 / К-5 в етапі 2, разом ${nf(Math.round(WHNP.cost.bom_cn+WHNP.cost.bom_ua))} $); модулі ${nf(Math.round(WHNP.cost.mods))} $, роботи ${nf(Math.round(WHNP.cost.works))} $ — у «Обладнанні» і «Монтажі».</p></div>`:'')+koshTbl(),sp:pSp,bud:pBud};
const tuBlock=()=>`<div class="blk wide"><h3>Технічні умови і вихідні дані</h3><table class="cmp an"><tbody>
  <tr><td class="w">Споживання</td><td>сценарії 1 100 / 3 000 / 5 000 МВт·год на рік (власник, 06.11), зимою на 35 % більше, ніж улітку · погодинних даних АСКОЕ немає</td></tr><tr><td class="w">Приєднання</td><td>10 кВ, КТП-5913 2 × 2 500 кВА, КТП-6923 1 × 2 500 кВА · 3 точки обліку</td></tr>
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
  if(p.querySelector('[data-gch],[data-gm]')&&!p.querySelector('[data-arb]')) requestAnimationFrame(()=>drawGen(p));
  if(p.querySelector('[data-arb]')) requestAnimationFrame(()=>arbDraw(p));
  p.querySelectorAll('[data-ekon]').forEach(b=>b.onclick=()=>{ state.lay.ekoN=+b.dataset.ekon; render5(); });
  if(p.querySelector('[data-scch]')) requestAnimationFrame(()=>scDraw(p));
  p.querySelectorAll('[data-sci]').forEach(b=>b.onclick=()=>{ state.lay.scI=+b.dataset.sci; render5(); });
  p.querySelectorAll('[data-scr]').forEach(b=>b.onclick=()=>{ state.lay.scR=b.dataset.scr; render5(); });
  p.querySelectorAll('[data-arbd]').forEach(b=>b.onclick=()=>{ state.lay.arbD=b.dataset.arbd; render5(); });
  p.querySelectorAll('[data-rn]').forEach(b=>b.onclick=()=>{ if(RN&&RN.node) RN.node(); });
  const bu=p.querySelector('#budU'); if(bu) bu.onchange=()=>{ state.lay.budU=Math.max(50000,+bu.value||0); render5(); }; save(); }
const ap0=apply; apply=function(){ const o=cur().sub[2];
  if(state.sec!==o.sec){ const hit=MENU.flatMap(([s,,subs])=>subs.map(x=>[s,x])).find(([,x])=>x[2].sec===state.sec); if(hit){ M5.s=hit[0]; M5.sub=hit[1][0]; } }   // перехід з коду двійника (напр. картка контейнера)
  const o2=cur().sub[2]; if(o2.pane!=='roz'){ setExAll(0); rozSt=null; if(XN&&XN.kind==='rn') closeNode(true); }
  const r=ap0.apply(this,arguments); render5();
  if(o2.pane==='roz'&&rozSt!==null&&rozSt!==state.lay.stg){ rozSt=state.lay.stg; rozRun(); }   // перемкнули етап у «Розборі»: фасад ↔ дах
  return r; };
window.__twin.apply=apply; window.__twin.menu5={MENU,go,cur};
go(M5.s,M5.sub);
} }
