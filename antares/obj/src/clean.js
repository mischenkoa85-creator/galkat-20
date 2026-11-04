// ================= Чиста збірка «Антарес · весь об'єкт» — src/clean.js (лише в antares/obj/build.sh, після stages.js)
// Шаблон двійника СЕС (власник 04.11, 12:26: «один шаблон, за допомогою якого ми завжди будемо робити так»; зрозуміле меню, без фото і без РП):
// над моделлю — види; етапи + одна кнопка розділу; легенда. Унизу — час, підсумок, розділи «Об'єкт» · «Сонце і генерація» · «Накопичувачі». Опис — antares/obj/Шаблон_3D-двійника_СЕС_і_УЗЕ.md
// В «Об'єкті» модулі одного кольору; у «Сонці» — колір за станом на вибраний час (кнопка «Стан модулів»), тіні — справжні від сонця; генерація за добу — розрахунок
// тіні й потужності кожного модуля етапу (та сама модель, що в «Сонці» двійника: Meteonorm 8.1, ясно / середня погода; без втрат від стрінгів).
{ const ST=window.__twin.stages, R28=window.__twin.r28, L28=window.__twin.lan28, FP=window.__twin.facpv, A=window.__twin.abk;
if(ST&&R28&&L28){
window.__twin.clean=true;
// ---------- стан: лише наш об'єкт, дах В1, ліхтарі без демонтажу (модулі на склі), фасади
// ---------- ШАБЛОН: види і розділи (порядок і назви — лише тут)
VIEWS.over={t:'Огляд',p:[178,92,58],c:[62,4,-46]};   // з південного сходу: АБК, ТП-5913, К-3 / К-1, південний і східний фасади, дах
const TPL={ views:[['over','Огляд'],['top','Зверху'],['ess','ТП-5913'],['ess2','ТП-6923'],['lan28','Ліхтар'],['abk','АБК']],
  secs:[['pz','Об\'єкт'],['sun','Сонце і генерація'],['uze','Накопичувачі']] };
state.proj='ours'; if(!TPL.secs.some(([k])=>k===state.sec)) state.sec='pz';
const CAP=1205, KK=[['K-3','ТП-5913','ess'],['K-1','ТП-5913','ess'],['K-4','ТП-6923','ess2'],['K-5','ТП-6923','ess2']], ZN={fac:'фасади',wh:'склад',lan:'ліхтарі',roof:'дах'};
Object.assign(state.lay,{r28:'1',l28:true,l28v:'v2',l28s:2,fac25:true,rad:false,sunPlain:false,sunYear:false});
// ---------- інтерфейс: без РП, невідповідностей, фото; два розділи
const hide=el=>{ if(el) el.style.display='none'; };
{ const fc=$('#fotoChip'); if(fc&&fc.getAttribute('aria-pressed')==='true') fc.click(); }   // фото обстеження вимкнути, потім сховати
{ const pj=$('#proj'); if(pj) pj.remove(); }   // перемикача проєктів у чистій збірці немає взагалі (власник 04.11: «забути РП»)
{ const st=document.createElement('style'); st.textContent='#misChip,#fotoChip,#proj{display:none!important}'; document.head.appendChild(st); }   // без фото і без невідповідностей
{ const cams=$('#cams'); if(cams){ const bs=[...cams.querySelectorAll('button')]; bs.forEach(b=>hide(b));
  TPL.views.forEach(([k,t])=>{ const b=bs.find(x=>x.dataset.c===k); if(!b) return; b.textContent=t; b.style.display=''; cams.appendChild(b); const dsc=VIEWS[k]&&Object.getOwnPropertyDescriptor(VIEWS[k],'t'); if(dsc&&!dsc.get) VIEWS[k].t=t; }); } }
{ const h=document.querySelector('header h1'); if(h) h.innerHTML='Антарес · СЕС і накопичувачі<small>АБК і цех · два етапи</small>'; document.title='Антарес · весь об\'єкт'; }
{ const tb=$('#tabs'), bs=[...tb.querySelectorAll('button')]; bs.forEach(b=>hide(b));
  TPL.secs.forEach(([k,t])=>{ const b=bs.find(x=>x.dataset.s===k); if(!b) return; b.textContent=t; b.style.display=''; b.disabled=false; b.classList.remove('mis'); tb.appendChild(b); }); }
ONSECS.splice(0,ONSECS.length,...TPL.secs.map(([k])=>k));
// ---------- один колір: модулі «на освітлення» — як решта
{ const V=R28.VG['1']; if(V){ const ims=V.children.filter(o=>o.userData.part==='roof'); if(ims.length>1){ const m0=Array.isArray(ims[0].material)?ims[0].material.map(x=>x.clone()):ims[0].material.clone(); ims.slice(1).forEach(o=>o.material=m0); } }   // окрема копія: у r128 один матеріал на InstancedMesh з instanceColor і без нього ламає рендер
  const MT=L28.MT; if(MT&&MT.mModL&&MT.mMod){ MT.mModL.color.copy(MT.mMod.color); if(MT.mMod.map) MT.mModL.map=MT.mMod.map; MT.mModL.needsUpdate=true; } }
genPaint=function(){ WHI.forEach((w,i)=>w.im.material=WHMAT[i]); };
// ---------- стан модулів у «Сонці» (власник 04.11, 05:13): які працюють, а які ні при освітленні на вибраний час — колір на кожен модуль; кнопка «Стан модулів»
// 0 — на сонці, працює повністю; 1 — частково в тіні; 2 — у тіні або сонце з тилу (лише розсіяне світло; в АБК — і модулі, обійдені діодом); 3 — ніч
const STC=['#2e8a57','#e3a21a','#c8423b','#5d636b'], STS=['працює · на сонці','частково в тіні','у тіні / сонце ззаду','ніч'], STL=STC.map(c=>lin(c));
const STM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5,metalness:0.08});
const ABM=STL.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.5,metalness:0.08}));
const PVA=A?MAT.pvP.clone():null;
// ---------- склад — 176 модулів (26.10, ред. 2): 4 місця попередньої розкладки без модулів не показуються
if(EP&&EP.whRem) EP.whRem.forEach(key=>{ const [w,k]=key.split(':').map(Number), W_=WHI[w]; if(W_){ W_.im.setMatrixAt(k,ZERO); W_.im.instanceMatrix.needsUpdate=true; } });
// ---------- модулі для живого розрахунку: роблю геометрію з екземплярів (світові координати, нормаль — найтонша вісь)
const _I=new M4(), _M=new M4(), _S=new M4(), _bs=new V3(), _bc=new V3();
function geo2(M){ const e=M.elements, ax=[BLD(e[0],e[1],e[2]),BLD(e[4],e[5],e[6]),BLD(e[8],e[9],e[10])], p=BLD(e[12],e[13],e[14]);
  const L=ax.map(v=>Math.hypot(...v)), k=L.indexOf(Math.min(...L)), o=[0,1,2].filter(j=>j!==k);
  let n=ax[k].map(v=>v/(L[k]||1)); if(Math.abs(n[2])>0.2){ if(n[2]<0) n=n.map(v=>-v); } else if((p[0]-48)*n[0]+(p[1]-48)*n[1]<0) n=n.map(v=>-v);
  const qc=p.map((v,i)=>v+n[i]*L[k]/2), a=ax[o[0]].map(v=>v/2), b=ax[o[1]].map(v=>v/2), la=L[o[0]]/2, lb=L[o[1]]/2, AA=la>=lb?a:b, BB=la>=lb?b:a, s=[];
  [-0.75,-0.25,0.25,0.75].forEach(u=>[-0.5,0.5].forEach(w=>s.push(qc.map((c,i)=>c+AA[i]*u+BB[i]*w+n[i]*0.012))));
  return {qc,n,a,b,a2:la*la,b2:lb*lb,s}; }
function geomsOf(im){ const out=[]; if(!im||!im.isInstancedMesh||!im.count) return out; im.updateWorldMatrix(true,false);
  if(!im.geometry.boundingBox) im.geometry.computeBoundingBox(); im.geometry.boundingBox.getSize(_bs); im.geometry.boundingBox.getCenter(_bc);
  _S.makeScale(_bs.x||1e-3,_bs.y||1e-3,_bs.z||1e-3); _S.setPosition(_bc);
  for(let i=0;i<im.count;i++){ im.getMatrixAt(i,_I); _M.multiplyMatrices(im.matrixWorld,_I).multiply(_S); out.push(geo2(_M)); } return out; }
const SETS={}, MESH=new Map();   // MESH: сітка → її власний матеріал (повертається, коли стан модулів вимкнено)
const refsOf=im=>{ const r=[]; if(im&&im.isInstancedMesh) for(let i=0;i<im.count;i++) r.push([im,i]); return r; };
function buildSets(){ const V=R28.VG['1'], rims=V?V.children.filter(o=>o.userData.part==='roof'):[], roofIm=rims[0]||null;
  SETS.roof={kind:'roof',cfg:MCFG.ours,g:geomsOf(roofIm),ref:refsOf(roofIm)};
  const lan=[], lr=[], lit=[], ltr=[];
  rims.slice(1).forEach(o=>{ lit.push(...geomsOf(o)); ltr.push(...refsOf(o)); });   // модулі даху на освітлення — лише колір
  L28.LG28.forEach(q=>{ const g=q.v2m&&q.v2m['1']; if(g) g.traverse(o=>{ if(o.isInstancedMesh){ const m=Array.isArray(o.material)?o.material:[o.material];
    if(m.includes(L28.MT.mModL)&&!m.includes(L28.MT.mMod)){ lit.push(...geomsOf(o)); ltr.push(...refsOf(o)); return; } lan.push(...geomsOf(o)); lr.push(...refsOf(o)); } }); });
  SETS.lan={kind:'roof',cfg:MCFG.ours,g:lan,ref:lr};
  const fm=FP?[FP.pvL,FP.pvP,FP.pc]:[];
  SETS.fac={kind:'fac',cfg:MCFG.whours,g:fm.flatMap(geomsOf),ref:fm.flatMap(refsOf)};
  const whOK=g=>!(EP&&EP.whRem&&EP.whRem.has(WHI.findIndex(w=>w.im===g.mesh)+':'+g.k)), whG=GEN.wh.filter(whOK);
  SETS.wh={kind:'wh',cfg:MCFG.whours,g:whG,ref:whG.map(g=>[g.mesh,g.k])};
  SETS.lit={kind:'roof',cfg:MCFG.ours,g:lit,ref:ltr,only:true};
  Object.values(SETS).forEach(S=>{ S.f=new Float32Array(S.g.length); S.tf=new Float32Array(S.g.length); S.one=new Float32Array(S.g.length).fill(1); S.cat=new Uint8Array(S.g.length);
    S.ref.forEach(([im])=>{ if(MESH.has(im)) return;
      // сітки без кольору на екземпляр отримують власну копію матеріалу (у r128 спільний матеріал на сітках з instanceColor і без нього ламає рендер)
      if(!im.instanceColor){ im.material=Array.isArray(im.material)?im.material.map(x=>x.clone()):im.material.clone(); for(let i=0;i<im.count;i++) im.setColorAt(i,white); im.instanceColor.needsUpdate=true; }
      MESH.set(im,im.material); }); }); }
// перешкоди: ліхтарі 28.10 лишаються (бортик 3,66 м, гребінь 1,89 м), труби даху 28.10, АБК
function obstacles(){ LANG.length=0; L28.LANS.forEach(L=>LANG.push({xc:L.xc,hw:1.83,y0:L.y0,y1:L.y1,zb:L.zb,h:1.89})); ZTOP=Math.max(...LANG.map(L=>L.zb+L.h))+0.6;
  OBSC.length=0; (R28.D.pipes||[]).forEach(([n,x,y,d,h])=>{ const z=roofZ(x); OBSC.push([x,y,d/2,z-0.05,z+h-0.05]); }); }
const ABKB=[[108.5,128.0,20.3,45.2,0,14.5],[108.3,127.5,6.6,20.3,0,10.0],[116.3,121.5,8.0,17.8,0,12.6]];
function litC(g,kind,d){ let lit=0; for(const o of g.s){ let hit;
    if(kind==='wh') hit=whHit(o,d)||TPB.some(b=>rayBox(o,d,b));
    else if(kind==='fac') hit=OBX.some(b=>rayBox(o,d,b))||TPB.some(b=>rayBox(o,d,b))||ABKB.some(b=>rayBox(o,d,b));
    else hit=shopRoofHit(o,d)||OBX.some(b=>rayBox(o,d,b))||OBSC.some(c=>rayCyl(o,d,c));
    if(!hit) lit++; } return lit/g.s.length; }
// ---------- розрахунок «зараз»
const NAMES={ab:'АБК',fac:'Фасади цеху',lan:'Ліхтарі (модулі на склі)',wh:'Склад',roof:'Дах цеху'};
const inStage=k=>{ const s=state.lay.stg; return s==='all'||(s==='2'?k==='roof':k!=='roof'); };
let NOW=null, nowKey='', job=null;
function compute(){ if(!SETS.roof) buildSets(); obstacles();
  const W_=WX.day[state.day], st=wxStep(state.day,state.hour), out={alt:0,g:{},Pc:0,Pa:0};
  ['ab','fac','lan','wh','roof'].forEach(k=>out.g[k]={Pc:0,Pa:0,n:0,sh:0,cnt:[0,0,0],on:inStage(k)});
  if(st){ const d=[st[1],st[2],st[3]]; out.alt=Math.asin(st[3]);
    ['fac','lan','wh','roof','lit'].forEach(k=>{ const S=SETS[k], G=out.g[k]; if(G&&!G.on) return;
      S.g.forEach((g,i)=>{ const c=dot3(d,g.n); S.f[i]=c>0?litC(g,S.kind,d):0; S.cat[i]=c<=0?2:S.f[i]>=0.999?0:S.f[i]>0?1:2; });
      if(!G) return; S.cat.forEach(c=>G.cnt[c]++);
      const r=powerStep(S.g,S.f,st,W_,S.cfg); G.Pc=r.Pc; G.Pa=W_.p*r.Pc+(1-W_.p)*r.Po; G.n=S.g.length; G.sh=r.n[1]+r.n[2]+r.n[3]; });
    if(A&&out.g.ab.on){ const rr=A.evaluate(DOY[state.day],solarT(),true), G=out.g.ab, k0=out.g.fac.Pc>0?out.g.fac.Pa/out.g.fac.Pc:W_.p;
      G.Pc=rr.all.p; G.Pa=rr.all.p*k0; G.n=rr.all.n; G.sh=rr.all.n-rr.all.sun; G.cnt=[rr.all.sun,rr.all.part,rr.all.n-rr.all.sun-rr.all.part]; } }
  else ['fac','lan','wh','roof'].forEach(k=>{ out.g[k].n=SETS[k].g.length; });
  if(!st&&A) out.g.ab.n=A.MODS.length;
  Object.values(out.g).forEach(G=>{ if(G.on){ out.Pc+=G.Pc; out.Pa+=G.Pa; } });
  NOW=out; nowKey=state.day+'|'+Math.round(state.hour*6)+'|'+state.lay.stg; }
function solarT(day=state.day,h=state.hour){ const dd=DAYS[day], n=DOY[day], off=kyivOffset(2026,dd[1],dd[2]), B=2*Math.PI*(n-81)/364, eot=9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B); return h-off+LON/15+eot/60; }
// ---------- генерація за добу: усі 10-хвилинні кроки характерного дня (Meteonorm 8.1), тінь кожного модуля на кожному кроці; рахується частинами у фоні —
// спершу вибраний день, далі решта пір року (для порівняння). c — ясне небо, a — середня погода дня, c0 / a0 — те саме без тіні (для втрат від тіні).
const GK=['ab','fac','lan','wh','roof'], DT=1/6, DAYC=[null,null,null,null], DAYP=[null,null,null,null]; let dayT=null;
function daySlice(day){ const W_=WX.day[day], N=W_.st.length; let P=DAYP[day];
  if(!P){ const z=()=>new Float32Array(N); P=DAYP[day]={k:0,h:W_.st.map(s=>s[0]),g:Object.fromEntries(GK.map(k=>[k,{c:z(),a:z(),c0:z(),a0:z()}]))}; }
  obstacles(); const t0=performance.now();   // перешкоди — щоразу (інші модулі між частинами можуть перебудувати LANG під свій варіант ліхтаря)
  while(P.k<N&&performance.now()-t0<30){ const k=P.k, st=W_.st[k], d=[st[1],st[2],st[3]];
    ['fac','lan','wh','roof'].forEach(q=>{ const S=SETS[q], f=S.tf, G=P.g[q]; S.g.forEach((g,i)=>{ f[i]=dot3(d,g.n)>0?litC(g,S.kind,d):0; });
      const a=powerStep(S.g,f,st,W_,S.cfg), b=powerStep(S.g,S.one,st,W_,S.cfg);
      G.c[k]=a.Pc; G.a[k]=W_.p*a.Pc+(1-W_.p)*a.Po; G.c0[k]=b.Pc; G.a0[k]=W_.p*b.Pc+(1-W_.p)*b.Po; });
    if(A){ const rr=A.evaluate(DOY[day],solarT(day,st[0]),false), G=P.g.ab, F=P.g.fac, k0=F.c[k]>0?F.a[k]/F.c[k]:W_.p;
      G.c[k]=G.c0[k]=rr.all.p; G.a[k]=G.a0[k]=rr.all.p*k0; }   // АБК — модель K1 з байпас-діодами; без окремого «без тіні»
    P.k++; }
  if(P.k>=N){ DAYC[day]=P; return true; } return false; }
const dayPct=day=>{ const P=DAYP[day]; return P?Math.round(P.k/WX.day[day].st.length*100):0; };
function dayRun(){ if(dayT||DAYC.every(Boolean)) return; if(!SETS.roof) buildSets(); obstacles();
  const tick=()=>{ dayT=null; const d=DAYC[state.day]?[0,1,2,3].find(i=>!DAYC[i]):state.day; if(d===undefined) return;
    const done=daySlice(d); if(done||d===state.day){ sunUI(); if(done) panelNow(); else if(state.sec==='sun'){ const h=document.getElementById('gSunH'), q=document.getElementById('gPct'); if(h) h.innerHTML=sunHead(); if(q) q.textContent=dayPct(d); } }
    dayT=setTimeout(tick,d===state.day?0:15); };
  dayT=setTimeout(tick,0); }
// суми за добу для набору груп: повна доба і накопичено до години upto (кроки, що вже минули)
function dayE(day,keys,upto){ const P=DAYC[day]; if(!P) return null; const o={c:0,a:0,c0:0,a0:0,cN:0,aN:0,kc:0,ka:0};
  P.h.forEach((h,i)=>{ const past=upto!=null&&h<upto; keys.forEach(k=>{ const G=P.g[k]; o.c+=G.c[i]*DT; o.a+=G.a[i]*DT; if(k!=='ab'){ o.c0+=G.c0[i]*DT; o.a0+=G.a0[i]*DT; o.kc+=G.c[i]*DT; o.ka+=G.a[i]*DT; }
    if(past){ o.cN+=G.c[i]*DT; o.aN+=G.a[i]*DT; } }); });
  o.lc=o.c0>0?1-o.kc/o.c0:0; o.la=o.a0>0?1-o.ka/o.a0:0; return o; }
const stKeys=()=>GK.filter(inStage);
const fe=(v,ref=v)=>ref>=1000?`${nf(v/1000,ref>=10000?1:2)} МВт·год`:`${nf(v,0)} кВт·год`;   // одиниця — за більшим числом рядка
// ---------- колір модулів за станом
const statOn=()=>state.sec==='sun'&&state.lay.stat!==false;
let painted=false;
function statusPaint(){ if(!statOn()||!NOW){ if(!painted) return; MESH.forEach((m,im)=>{ im.material=m; for(let i=0;i<im.count;i++) im.setColorAt(i,white); im.instanceColor.needsUpdate=true; });
    if(A) A.MODS.forEach(r=>{ if(r.mesh){ r.mesh.material=PVA; r.mesh.userData.base=PVA; } }); painted=false; need=true; return; }
  const night=!(NOW.alt>0); MESH.forEach((m,im)=>{ im.material=STM; });
  Object.values(SETS).forEach(S=>S.ref.forEach(([im,k],i)=>im.setColorAt(k,STL[night?3:S.cat[i]]))); MESH.forEach((m,im)=>{ im.instanceColor.needsUpdate=true; });
  if(A) A.MODS.forEach(r=>{ if(!r.mesh) return; const c=night||r.state==='night'?3:r.state==='sun'?0:r.state==='part'?1:2; r.mesh.material=ABM[c]; r.mesh.userData.base=ABM[c]; });
  painted=true; need=true; }
function stCounts(){ const c=[0,0,0]; let n=0; if(NOW) GK.forEach(k=>{ const G=NOW.g[k]; if(!G.on) return; n+=G.n; G.cnt.forEach((v,i)=>c[i]+=v); }); return {c,n}; }
function legendSun(){ const l=$('#legend'); if(!l||state.sec!=='sun') return; l.hidden=false; l.classList.remove('min');
  if(state.lay.rad){ l.innerHTML=`<span class="t">Сонце за рік, кВт·год/м²</span>`+RCc.map((c,i)=>`<span><i class="sw" style="background:${c}"></i>${RADD.cln[i]}</span>`).join('')+(ABR.done?'':`<span>АБК — рахую ${ABR.pct} %</span>`); return; }
  if(state.lay.stat===false){ l.innerHTML=`<span class="t">Тіні — справжні, від сонця на вибраний час</span><span>▶ — день по 10 хв</span>`; return; }
  const C=stCounts(), sw=i=>`<i class="sw" style="background:${STC[i]}"></i>`;
  l.innerHTML=`<span class="t">Стан модулів о ${hhmm(state.hour)}</span>`+(!NOW||!(NOW.alt>0)?`<span>${sw(3)}ніч — не працюють усі ${nf(C.n)}</span>`
    :[0,1,2].map(i=>`<span>${sw(i)}${STS[i]} <b class="num">${nf(C.c[i])}</b></span>`).join('')); }
// не частіше ніж раз на 150 мс (повзунок, ▶)
genRefresh=function(){ dayRun(); const key=state.day+'|'+Math.round(state.hour*6)+'|'+state.lay.stg; if(key===nowKey&&NOW){ sunUI(); panelNow(); legendSun(); statusPaint(); return; }
  if(job) return; job=setTimeout(()=>{ job=null; compute(); sunUI(); panelNow(); legendSun(); statusPaint(); need=true; },NOW?150:0); };
genPanelUpdate=function(){};
// ---------- рядок унизу: генерація за добу і накопичено до вибраного часу (замість потужності «зараз»)
const kn=v=>nf(v,0);
sunUI=(f=>function(){ f.apply(this,arguments); const el=$('#now'); if(!el) return; const S=ST.sums(), stg=state.lay.stg, x=stg==='1'?S.s1:stg==='2'?S.s2:S.all;
  const nm=stg==='1'?'Етап 1':stg==='2'?'Етап 2 · дах':'Весь об\'єкт', sun=(el.innerHTML.match(/<span class="sun">.*?<\/span>/)||[''])[0];
  let day=''; if(state.sec==='uze'){ const es=KK.map(([K])=>eK(K,state.day,stKeys(),state.hour)); if(es.every(Boolean)){ const A_=es.reduce((s_,e)=>s_+e.a,0), N_=es.reduce((s_,e)=>s_+e.aN,0);
      day=`<span>у контейнери з ранку до ${hhmm(state.hour)} <b class="num">${fe(N_,A_)}</b> · за добу ${fe(A_)} сер.</span><span>${nf(N_/(4*CAP)*100,0)} % від 4 × 1 205 кВт·год</span>`; } else day=`<span>енергія за добу — рахую ${dayPct(state.day)} %</span>`; }
  if(state.sec==='sun'||state.sec==='pz'){ const E=dayE(state.day,stKeys(),state.hour);
    day=E?`<span>за добу ${DAYS[state.day][0]} <b class="num">${fe(E.c)}</b> ясно · ${fe(E.a,E.c)} сер.</span><span>накопичено до ${hhmm(state.hour)} <b class="num">${fe(E.cN,E.c)}</b> ясно · ${fe(E.aN,E.c)} сер.</span>`
      :`<span>генерація за добу — рахую ${dayPct(state.day)} %</span>`; }
  el.innerHTML=`<span class="who ours">${nm}</span>${sun}${day}<span><b class="num">${nf(x.st)}</b> модулів · ${nf(x.kwp,0)} кВтп · за рік <b class="num">≈${nf(x.mwh,0)} МВт·год</b></span>`; })(sunUI);
// ---------- над моделлю: лише етапи; легенда — один рядок
hudCtx=(f=>function(){ f.apply(this,arguments); const m=$('#modes'); if(!m) return; const S=ST.sums(), stg=state.lay.stg;
  m.innerHTML=''; document.querySelectorAll('#stgseg button').forEach(b=>{ const v=b.dataset.stg, x=v==='1'?S.s1:v==='2'?S.s2:S.all; b.setAttribute('aria-pressed',String(stg===v)); b.title=`${b.title.split(' · ')[0]} · ${nf(x.st)} модулів`; b.onclick=()=>ST.setStage(v); });   // етапи — у шапці, де був перемикач проєктів (власник 04.11, 22:49)
  m.hidden=false; const bar=$('#l28bar'); if(bar) bar.hidden=true;
  if(state.sec==='sun'&&!state.lay.rad){
    [['stat','Стан модулів','Колір модуля — його стан на вибраний час: на сонці, частково в тіні, у тіні',()=>state.lay.stat!==false,()=>{ state.lay.stat=state.lay.stat===false; }]].forEach(([k,txt,ttl,on,fn])=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=txt; b.title=ttl; b.setAttribute('aria-pressed',String(on())); b.onclick=()=>{ fn(); apply(); save(); }; m.appendChild(b); }); }
  const T=SECTOG[state.sec]; if(T){ const [key,txt,ttl]=T, b=document.createElement('button'); b.type='button'; b.textContent=txt; b.title=ttl; b.setAttribute('aria-pressed',String(state.lay[key]!==false));
    b.onclick=()=>{ state.lay[key]=state.lay[key]===false; apply(); save(); }; m.appendChild(b); }
  if(state.sec==='sun') legendSun(); if(state.sec==='uze') legendUZE(); })(hudCtx);
// одна кнопка на розділ (у «Об'єкті» — «Електрика», її ставить elec04.js)
const SECTOG={uze:['uAC','Лінії AC','Лінії AC контейнерів до ТП і СІП від АБК до ТП-5913']};
// ---------- розділ «Сонце і генерація»: генерація за добу, накопичено до вибраного часу, стан модулів, аналітика
const MOS=['весна (21.03)','літо (21.06)','осінь (23.09)','зима (21.12)'];
const GN=[['roof','Дах цеху'],['fac','Фасади цеху'],['lan','Ліхтарі — модулі на склі'],['wh','Склад'],['ab','АБК']];
const pc0=v=>v>0?`${nf(v*100,1)} %`:'—';
function curveSVG(day,keys){ const P=DAYC[day]; if(!P) return `<p class="src">Крива доби — рахую ${dayPct(day)} %…</p>`;
  const n=P.h.length, C=new Float32Array(n), Av=new Float32Array(n); P.h.forEach((h,i)=>keys.forEach(k=>{ C[i]+=P.g[k].c[i]; Av[i]+=P.g[k].a[i]; }));
  const W=360,H=168,l=40,r=8,t=12,b=22, h0=Math.floor(P.h[0]-DT/2), h1=Math.ceil(P.h[n-1]+DT/2), mx=Math.max(1,...C), st=mx>2000?500:mx>800?200:mx>300?100:50, top=Math.ceil(mx/st)*st;
  const X=h=>l+(h-h0)/(h1-h0)*(W-l-r), Y=v=>t+(1-v/top)*(H-t-b), path=A=>P.h.map((h,i)=>`${i?'L':'M'}${X(h).toFixed(1)},${Y(A[i]).toFixed(1)}`).join('');
  const nowH=state.hour, past=P.h.map((h,i)=>[h,i]).filter(([h])=>h<nowH);
  const area=past.length?`M${X(past[0][0]-DT/2).toFixed(1)},${Y(0)}`+past.map(([h,i])=>`L${X(h).toFixed(1)},${Y(C[i]).toFixed(1)}`).join('')+`L${X(past[past.length-1][0]).toFixed(1)},${Y(0)}Z`:'';
  let g=''; for(let v=0;v<=top;v+=st) g+=`<line x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${l-5}" y="${Y(v)+3.5}" class="ya">${nf(v,0)}</text>`;
  let xa=''; for(let h=Math.ceil(h0/2)*2;h<=h1;h+=2) xa+=`<text x="${X(h)}" y="${H-6}" class="xa">${h}</text>`;
  const nx=X(Math.min(h1,Math.max(h0,nowH)));
  return `<div class="cv" data-day="${day}" data-keys="${keys.join(',')}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Потужність протягом доби, ясно і середня погода">${g}${xa}
    ${area?`<path d="${area}" class="acc"/>`:''}<path d="${path(Av)}" class="la"/><path d="${path(C)}" class="lc"/>
    <line x1="${nx}" x2="${nx}" y1="${t}" y2="${Y(0)}" class="nw"/><text x="${nx+3}" y="${t+8}" class="xa nwt">${hhmm(nowH)}</text>
    <line class="hx" x1="0" x2="0" y1="${t}" y2="${Y(0)}" visibility="hidden"/><circle class="hc" r="4" visibility="hidden"/><circle class="ha" r="4" visibility="hidden"/>
    <rect x="${l}" y="${t}" width="${W-l-r}" height="${Y(0)-t}" fill="transparent" class="hit" data-x0="${l}" data-x1="${W-r}" data-h0="${h0}" data-h1="${h1}" data-top="${top}" data-t="${t}" data-b="${Y(0)}"/></svg><div class="ctip" hidden></div></div>`; }
function sunBody(){ if(!NOW) compute(); const S=ST.sums(), stg=state.lay.stg, x=stg==='1'?S.s1:stg==='2'?S.s2:S.all, keys=stKeys(), d=state.day, E=dayE(d,keys,state.hour), H=hhmm(state.hour);
  const tile=(k,big,sub)=>`<div class="kpi"><span class="k">${k}</span><span class="v">${big}</span><span class="s">${sub}</span></div>`, C=stCounts(), night=!NOW||!(NOW.alt>0);
  const kpis=`<div class="kpis">${E?tile(`За добу · ${DAYS[d][0]}`,`${fe(E.c).replace(/ (\S+)$/,' <small>$1</small>')}`,`ясне небо · ${nf(E.c/x.kwp,2)} кВт·год/кВтп`)
    +tile('За добу · сер. погода',`${fe(E.a,E.c).replace(/ (\S+)$/,' <small>$1</small>')}`,`${nf(E.a/x.kwp,2)} кВт·год/кВтп · ${nf(E.a/E.c*100,0)} % від ясного`)
    +tile(`Накопичено до ${H}`,`${fe(E.cN,E.c).replace(/ (\S+)$/,' <small>$1</small>')}`,`ясно · сер. ${fe(E.aN,E.c)} · ${nf(E.c?E.cN/E.c*100:0,0)} % доби`)
    +tile('Втрати від тіні за добу',`${nf(E.lc*100,1)} <small>%</small>`,`ясно · сер. ${nf(E.la*100,1)} % (без АБК)`):tile('Генерація за добу',`<span id="gPct">${dayPct(d)}</span> <small>%</small>`,'рахую тінь кожного модуля на кожному 10-хв кроці дня…')}
    ${tile(`Стан модулів о ${H}`,night?`ніч`:`${nf(C.c[0])} <small>з ${nf(C.n)}</small>`,night?'не працюють усі':`на сонці · частково ${nf(C.c[1])} · у тіні ${nf(C.c[2])}`)}</div>`;
  // по групах
  const rows=GN.filter(([k])=>inStage(k)).map(([k,n])=>{ const Y=S[k], e=dayE(d,[k],state.hour), G=NOW&&NOW.g[k];
    return `<tr><td class="w">${n}<small>${nf(Y.st)} мод. · ${nf(Y.kwp,1)} кВтп · ${nf(Y.mwh,1)} МВт·год/рік</small></td><td>${e?`<b>${nf(e.c,0)}</b> / ${nf(e.a,0)}`:'…'}</td><td>${e?nf(e.a/Y.kwp,2):'…'}</td><td>${e?`${nf(e.cN,0)} / ${nf(e.aN,0)}`:'…'}</td><td>${e?(k==='ab'?'—':pc0(e.lc)):'…'}</td><td>${E&&e?`${nf(e.a/E.a*100,0)} %`:'…'}</td></tr>`; }).join('');
  const tot=`<tr class="tot"><td class="w">Разом<small>${nf(x.st)} мод. · ${nf(x.kwp,0)} кВтп</small></td><td>${E?`<b>${nf(E.c,0)}</b> / ${nf(E.a,0)}`:'…'}</td><td>${E?nf(E.a/x.kwp,2):'…'}</td><td>${E?`${nf(E.cN,0)} / ${nf(E.aN,0)}`:'…'}</td><td>${E?pc0(E.lc):'…'}</td><td>${E?'100 %':'…'}</td></tr>`;
  const grp=`<div class="blk wide"><h3>Генерація за добу по групах · ${MOS[d]}</h3><div class="tw"><table class="cmp an gt"><thead><tr><th>Група</th><th>За добу, кВт·год<br><small>ясно / сер.</small></th><th>кВт·год/ кВтп<br><small>сер.</small></th><th>До ${H}, кВт·год<br><small>ясно / сер.</small></th><th>Втрати від тіні<br><small>ясно</small></th><th>Частка</th></tr></thead><tbody>${rows}${tot}</tbody></table></div></div>`;
  // стан модулів зараз
  const sw=i=>`<i class="sw" style="background:${STC[i]}"></i>`;
  const srows=GN.filter(([k])=>inStage(k)).map(([k,n])=>{ const G=NOW&&NOW.g[k]; return `<tr><td class="w">${n}</td>${night?`<td>—</td><td>—</td><td>${nf(G?G.n:0)}</td>`:G.cnt.map(v=>`<td>${nf(v)}</td>`).join('')}</tr>`; }).join('');
  const stb=`<div class="blk"><h3>Стан модулів о ${H} · ${MOS[d]}</h3><div class="tw"><table class="cmp an"><thead><tr><th>Група</th><th>${sw(0)}Працює<br><small>на сонці</small></th><th>${sw(1)}Частково<br><small>у тіні</small></th><th>${sw(2)}У тіні<br><small>або ззаду</small></th></tr></thead><tbody>${srows}
    <tr class="tot"><td class="w">Разом</td>${night?`<td>—</td><td>—</td><td>${nf(C.n)}</td>`:C.c.map(v=>`<td><b>${nf(v)}</b></td>`).join('')}</tr></tbody></table></div>
    <p class="src">Колір у моделі — той самий (кнопка «Стан модулів» над моделлю). «У тіні» — модуль бере лише розсіяне світло (≈10–25 % від сонця); в АБК сюди ж — модулі, обійдені діодом через нижчий струм у стрінгу.${night?' Зараз ніч — не працює жоден модуль.':''}</p></div>`;
  // крива доби
  const cv=`<div class="blk"><h3>Потужність протягом доби, кВт</h3><div class="lg"><span><i class="ln c"></i>ясне небо</span><span><i class="ln a"></i>середня погода</span><span><i class="ar"></i>накопичено до ${H}</span></div>${curveSVG(d,keys)}</div>`;
  // пори року
  const SE=[0,1,2,3].map(i=>dayE(i,keys,null)), smx=Math.max(1,...SE.map(e=>e?e.c:0));
  const sr=[0,1,2,3].map(i=>{ const e=SE[i]; return `<tr${i===d?' class="cur"':''}><td class="w">${MOS[i]}</td><td>${e?`<b>${nf(e.c,0)}</b><span class="gb" style="width:${Math.max(3,Math.round(56*e.c/smx))}px"></span>`:`${dayPct(i)} %…`}</td><td>${e?nf(e.a,0):'…'}</td><td>${e?nf(e.a/x.kwp,2):'…'}</td><td>${e?pc0(e.lc):'…'}</td></tr>`; }).join('');
  const sea=`<div class="blk"><h3>Доба по порах року, кВт·год</h3><div class="tw"><table class="cmp an"><thead><tr><th>День</th><th>Ясно</th><th>Сер.</th><th>на кВтп<br><small>сер.</small></th><th>Тінь<br><small>втрати</small></th></tr></thead><tbody>${sr}</tbody></table></div>
    <p class="src">Чотири характерні дні (рівнодення і сонцестояння); середня погода — частка ясних днів цього місяця за Meteonorm 8.1. Річна генерація — у розділі «Об'єкт».</p></div>`;
  return (state.lay.rad?radBlock():'')+kpis+grp+cv+stb+sea+`<p class="src" style="grid-column:1/-1">Генерація за добу — сума за всі 10-хвилинні кроки дня з тінню кожного модуля на кожному кроці: Meteonorm 8.1, ясне небо і середня погода цього дня; тінь — від ліхтарів (лишаються, гребінь 1,89 м), труб даху, сусідніх будівель, АБК і ТП; без втрат від різної освітленості в стрінгах і без затінення модуль на модуль. АБК — модель K1 АБК (з байпас-діодами). «За рік» — розрахунки розкладок: АБК (ДБН 28.10), фасади (fac_v2), ліхтарі (28.10, скло), склад (26.10), дах (28.10 В1 — ще без тіні від ліхтарів, що лишаються).</p>`; }
function panelNow(){ if(state.sec==='uze'){ const pn=$('#pane'); if(pn&&typeof panelUZE==='function') pn.innerHTML=panelUZE(); return; } const el=document.getElementById('gSunBody'); if(el) el.innerHTML=sunBody(); const h=document.getElementById('gSunH'); if(h) h.innerHTML=sunHead(); }
function sunHead(){ const E=dayE(state.day,stKeys(),state.hour); return E?`за добу ${DAYS[state.day][0]} ≈${fe(E.c)} ясно · ${fe(E.a,E.c)} сер.`:`генерація за добу — рахую ${dayPct(state.day)} %`; }
panelSun=function(){ if(!NOW) compute(); dayRun(); const S=ST.sums(), stg=state.lay.stg, x=stg==='1'?S.s1:stg==='2'?S.s2:S.all, nm=stg==='1'?'Етап 1':stg==='2'?'Етап 2 · дах':'Весь об\'єкт';
  return `<div class="ph"><span class="eyebrow ours">Сонце і генерація · ${nm}</span><h2 id="gSunH">${sunHead()}</h2>
  <p>${MOS[state.day][0].toUpperCase()+MOS[state.day].slice(1)} · ${nf(x.st)} модулів · ${nf(x.kwp,0)} кВтп · за рік ≈${nf(x.mwh,0)} МВт·год. Тягніть час або натисніть ▶ — сонце йде по дню, тіні справжні, колір модуля — його стан; пора року — кнопка поруч із часом.</p></div>
  <div id="gSunBody" class="sunb">${sunBody()}</div>`; };
// наведення на криву доби: година, потужність ясно / сер., накопичено до цієї години
document.addEventListener('pointermove',e=>{ const hit=e.target&&e.target.classList&&e.target.classList.contains('hit')?e.target:null, cvs=document.querySelectorAll('.cv');
  cvs.forEach(cv=>{ const sv=cv.querySelector('svg'), tip=cv.querySelector('.ctip'), hx=sv.querySelector('.hx'), hc=sv.querySelector('.hc'), ha=sv.querySelector('.ha');
    if(!hit||!cv.contains(hit)){ tip.hidden=true; [hx,hc,ha].forEach(o=>o.setAttribute('visibility','hidden')); return; }
    const P=DAYC[+cv.dataset.day]; if(!P) return; const keys=cv.dataset.keys.split(','), D=hit.dataset, r=sv.getBoundingClientRect(), vx=(e.clientX-r.left)/r.width*360;
    const h=+D.h0+(vx-+D.x0)/(+D.x1-+D.x0)*(+D.h1-+D.h0); let i=0,bd=1e9; P.h.forEach((v,j)=>{ const dd=Math.abs(v-h); if(dd<bd){ bd=dd; i=j; } });
    let c=0,a=0,cn=0,an=0; keys.forEach(k=>{ const G=P.g[k]; c+=G.c[i]; a+=G.a[i]; for(let j=0;j<=i;j++){ cn+=G.c[j]*DT; an+=G.a[j]*DT; } });
    const X=+D.x0+(P.h[i]-+D.h0)/(+D.h1-+D.h0)*(+D.x1-+D.x0), Yv=v=>+D.t+(1-v/+D.top)*(+D.b-+D.t);
    hx.setAttribute('x1',X); hx.setAttribute('x2',X); hc.setAttribute('cx',X); hc.setAttribute('cy',Yv(c)); ha.setAttribute('cx',X); ha.setAttribute('cy',Yv(a)); [hx,hc,ha].forEach(o=>o.setAttribute('visibility','visible'));
    tip.innerHTML=`<b>${hhmm(P.h[i]-DT/2)}–${hhmm(P.h[i]+DT/2)}</b><br>ясно <b>${nf(c,0)} кВт</b> · сер. ${nf(a,0)} кВт<br>з ранку: ${fe(cn)} ясно · ${fe(an,cn)} сер.`; tip.hidden=false;
    const px=(X/360)*r.width, tw=tip.offsetWidth||190; tip.style.left=Math.max(0,px+10+tw>r.width?px-10-tw:px+10)+'px'; tip.style.top='6px'; }); });
// ---------- один колір і для АБК: модулі всіх орієнтацій — той самий матеріал, що на цеху (раніше — свій колір на кожну орієнтацію)
if(A){ A.MODS.forEach(r=>{ if(!r.mesh) return; r.mesh.material=PVA; r.mesh.userData.face0=PVA; r.mesh.userData.base=PVA; }); }
// проходи й відступи на даху — без кольорових смуг (порожня покрівля)
setVis=(f=>function(){ f.apply(this,arguments); const V=R28.VG['1']; if(V) V.children.forEach(o=>{ if(o.userData.part==='zone') o.visible=false; }); })(setVis);
// контейнери: по 2 на кожну ТП — К-3, К-1 біля ТП-5913 (зі stages.js NK — К-4, К-5 біля ТП-6923) видно в обох розділах і на всіх етапах; ШВ-2 старої схеми (К-2 не ставиться) — ні
const K13=[], SHV2=ESS.filter(o=>{ const u=o.userData&&o.userData.info; return u&&typeof u==='object'&&/^ШВ-2 /.test(u.t||''); });
if(BS) ['K-3','K-1'].forEach(id=>{ const k=BS.K.find(x=>x.id===id); if(!k) return; const cx=(k.box[0]+k.box[1])/2, cy=(k.box[2]+k.box[3])/2;
  ESS.forEach(o=>{ if(o.parent===G.oursBase&&Math.abs(o.position.x-cx)<0.6&&Math.abs(-o.position.z-cy)<0.6) K13.push(o); }); });
// К-3, К-1 біля ТП-5913 (рівна ділянка, без берми) — паралельно будівлі (власник 04.11, 15:05): довгою стороною вздовж східного фасаду, 3,0 м від стіни, двері на схід (від стіни)
const K13N=grp('k13new',G.ours), K13P={};
if(BS) ['K-3','K-1'].forEach(id=>{ const k=BS.K.find(x=>x.id===id); if(!k) return; const LL=6.058, WW=2.438, cy=(k.box[2]+k.box[3])/2, x0=96.64+3.0, cx=x0+WW/2;
  K13P[id]={cx,cy,box:[x0,x0+WW,cy-LL/2,cy+LL/2]};
  const pl=box(WW+2,0.04,LL+2,UZM.plat,cx,0.02,-cy,K13N); pl.castShadow=false; const sl=box(WW+1,0.25,LL+1,MAT.slab,cx,0.175,-cy,K13N);
  sl.userData.info={t:`Фундамент Фп-1 · ${id}`,d:'Плита 3 438 × 7 058 × 250, C20/25 F100 W4, 2 сітки Ø12 A500C крок 200, верх +0,300; ЩПС 350; 4 закладні МН-1; майданчик обслуговування навколо. Розвернуто паралельно фасаду (04.11).'}; PICK.push({o:sl,when:()=>K13N.visible});
  const c=golenH20({id,box:[cx-LL/2,cx+LL/2,cy-WW/2,cy+WW/2],lines:0,kwp:0,ac_len:0}); c.rotation.y=Math.PI/2; K13N.add(c); const body=c.children[0];
  body.userData.info={t:`${id} · Golen LES-H20-1205W500C-PS · ТП-5913`,d:`АКБ 1 205 кВт·год, PCS 500 кВт, 12 входів PV по 60 кВт. Пара К-3 + К-1: етап 1 — усі панелі етапу 1: фасади, склад і ліхтарі (14 щитів, 82 стрінги, 658,5 кВтп); етап 2 — ще 10 щитів сходу даху. Біля східного фасаду на рівній ділянці, паралельно будівлі: довгою стороною вздовж стіни, 3,0 м від неї, двері на схід; лінія AC — до ТП-5913.`};
  PICK.push({o:body,when:()=>K13N.visible}); });
const K13L=grp('k13lbl',G.ours);
if(BS) ['K-3','K-1'].forEach(id=>{ const k=BS.K.find(x=>x.id===id); if(!k||!K13P[id]) return; const cx=K13P[id].cx, cy=K13P[id].cy;
  const lb=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex([`${id} · ТП-5913 · схід`,'500 кВт · 1 205 кВт·год'],512,128,'#'+new THREE.Color(KCOL[id]).getHexString()),depthTest:false,transparent:true}));
  lb.scale.set(0.13,0.0325,1); lb.material.sizeAttenuation=false; lb.position.copy(W(cx,cy,4.9)); lb.renderOrder=18; K13L.add(lb); });
setVis=(f=>function(){ f.apply(this,arguments); const on=state.proj==='ours'&&R28.ON(); K13.forEach(o=>o.visible=false); K13N.visible=on; K13L.visible=on; SHV2.forEach(o=>o.visible=false); statusPaint(); })(setVis);
// ---------- розділ «Накопичувачі»: 4 контейнери по 2 на ТП + АБК (базово — СІП до ТП-5913, опція — власний накопичувач); енергія від панелей у кожен за добу
// підписи контейнерів — лише в «Накопичувачах» або зблизька (не висять над іншими будівлями)
// ---------- АБК: 3 варіанти (власник 04.11, 13:42): 1 — СІП-4 4×70 до щита СЕС у ТП-5913 (модель АБК, 28.10); 2 — власний накопичувач АБК, без СІП до ТП;
// 3 — СІП до контейнерів К-3 / К-1 (траса умовна, пунктиром: дах АБК → західний фасад → підвіс через проїзд → у землі до К-3 / К-1; точку підключення — уточнити в Golen)
const ABV=()=>['1','2','3'].includes(state.lay.abkV)?state.lay.abkV:'1';
if(A&&A.root) A.root.updateMatrixWorld(true);
const ACX=A&&A.TAGS?[...new Set([...(A.TAGS.ac||[]),...(A.TAGS.shch||[])])]:[], _bb3=new THREE.Box3(), _cc3=new V3();
const ACR=ACX.filter(o=>{ _bb3.setFromObject(o); if(_bb3.isEmpty()) return false; _bb3.getCenter(_cc3); return _cc3.x>=108.2; });   // дах АБК (інвертор → західний парапет) — спільне для 1 і 3
const V3G=grp('abkV3',G.ours); V3G.visible=false;
const V3P=(()=>{ const a=[108.35,45.1,4.5], b=[106.3,53.4,3.4], sp=[]; for(let i=0;i<=10;i++){ const t=i/10; sp.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t-0.35*4*t*(1-t)]); }
  return [[108.24,20,10.3],[108.35,20.3,10.2],[108.35,44.8,10.2],...sp,[106.3,53.4,0.4],[106.3,62.8,0.4]]; })();
const V3L=V3P.slice(1).reduce((s_,p,i)=>s_+Math.hypot(p[0]-V3P[i][0],p[1]-V3P[i][1],p[2]-V3P[i][2]),0);
{ const mt=new THREE.MeshStandardMaterial({color:lin(0xd98a1c),roughness:0.5}), pts=V3P.map(p=>W(p[0],p[1],p[2]));
  let on=true, acc=0; for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], L=a.distanceTo(b), n=Math.max(1,Math.round(L/0.6));
    for(let j=0;j<n;j++){ if(on){ const p0=a.clone().lerp(b,j/n), p1=a.clone().lerp(b,(j+1)/n); const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(p0,p1),1,0.06,6,false),mt); m.castShadow=false; V3G.add(m); } on=!on; } }
  const hit=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'catmullrom',0.0),Math.max(24,pts.length*3),0.35,6,false),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  hit.userData.info={t:'Варіант 3 · СІП від АБК до контейнерів К-3 / К-1',d:`Траса умовна: той самий провід від інвертора Deye 100 кВт, що й у варіанті 1, — з даху АБК західним фасадом на кронштейнах до північного кута, підвісом через проїзд до контейнерів, далі в землі до К-3 і К-1; ≈${nf(V3L,0)} м від західного парапету АБК. Точку підключення в контейнері (шини AC чи щит) — уточнити в Golen; переріз перевірити на цю довжину.`};
  V3G.add(hit); PICK.push({o:hit,when:()=>V3G.visible});
  const lb=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex(['Варіант 3 · СІП АБК → К-3 / К-1',`траса умовна · ≈${nf(V3L,0)} м`],512,128,'#b4461b'),depthTest:false,transparent:true}));
  lb.scale.set(0.13,0.0325,1); lb.material.sizeAttenuation=false; lb.position.copy(W(107.4,49,6.2)); lb.renderOrder=18; V3G.add(lb); }
VIEWS.abkv={t:'АБК — варіанти',p:[86,50,4],c:[105,4,-35]};
const LBL=()=>[...(G.stgESS?G.stgESS.children.filter(o=>o.isSprite):[]),...K13L.children,...V3G.children.filter(o=>o.isSprite)];
function lblVis(){ const all=state.sec==='uze'; LBL().forEach(sp=>{ sp.visible=all||camera.position.distanceTo(sp.position)<70; }); need=true; }
if(typeof controls!=='undefined'&&controls.addEventListener) controls.addEventListener('change',lblVis);
if(UZ.lbl&&UZ.lbl.parent) UZ.lbl.parent.remove(UZ.lbl);   // старі підписи 3 контейнерів (з К-2) — прибрати зовсім (цикл рендеру їх вмикає зблизька)
setVis=(f=>function(){ f.apply(this,arguments); const U=state.sec==='uze', ac=state.lay.uAC!==false;
  if(G.uze){ G.uze.visible=U&&ac&&state.proj==='ours'; ['trench','pit','dc','lbl'].forEach(k=>{ if(UZ[k]) UZ[k].visible=false; }); if(UZ.ac){ UZ.ac.visible=true; UZ.ac.traverse(o=>{ const u=o.userData&&o.userData.info; if(u&&typeof u==='object'&&/K-2/.test(u.t||'')) o.visible=false; }); } }
  if(U&&A&&A.groups.elec) A.groups.elec.visible=ac&&state.proj==='ours'&&inStage('ab');
  const v=ABV(); ACX.forEach(o=>{ o.visible=v==='1'||(v==='3'&&ACR.includes(o)); });
  V3G.visible=v==='3'&&state.proj==='ours'&&inStage('ab')&&((U&&ac)||state.sec==='pz');
  lblVis(); })(setVis);
// кВтп щитів PV кожного контейнера по зонах (аналіз 04.11), зведені до кВтп розкладок; входи — по щиту на вхід DC/DC
function kZones(){ const E=typeof ELEC04!=='undefined'?ELEC04:null; if(!E) return null; const S=ST.sums(), raw={}, tot={}, inp={};
  E.boxes.forEach(b=>{ const r=raw[b.K]=raw[b.K]||{}; r[b.z]=(r[b.z]||0)+b.kwp; tot[b.z]=(tot[b.z]||0)+b.kwp; const q=inp[b.K]=inp[b.K]||{1:0,2:0}; q[b.st]++; });
  const out={}; Object.entries(raw).forEach(([k,r])=>{ out[k]={z:{},inp:inp[k]}; Object.entries(r).forEach(([z,v])=>out[k].z[z]=S[z]&&tot[z]?v*S[z].kwp/tot[z]:v); }); return out; }
function eK(K,day,keys,upto=null){ const KZ=kZones(); if(!KZ||!KZ[K]||!DAYC[day]) return null; const S=ST.sums(); let c=0,a=0,kw=0,cN=0,aN=0;
  Object.entries(KZ[K].z).forEach(([z,v])=>{ if(!keys.includes(z)) return; const e=dayE(day,[z],upto); c+=v*e.c/S[z].kwp; a+=v*e.a/S[z].kwp; cN+=v*e.cN/S[z].kwp; aN+=v*e.aN/S[z].kwp; kw+=v; }); return {c,a,kw,cN,aN}; }
function legendUZE(){ const l=$('#legend'); if(!l) return; l.hidden=false; l.classList.remove('min'); const sw=k=>`<i class="sw" style="background:#${new THREE.Color(KCOL[k]).getHexString()}"></i>`;
  l.innerHTML=`<span class="t">Накопичувачі · по 2 на ТП</span><span>${sw('K-3')}К-3 ${sw('K-1')}К-1 — ТП-5913</span><span>${sw('K-4')}К-4 ${sw('K-5')}К-5 — ТП-6923</span><span>${({'1':'АБК → ТП-5913 по СІП','2':'АБК — свій накопичувач','3':'АБК → К-3 / К-1 по СІП (умовно)'})[ABV()]}</span>`; }
panelUZE=function(){ dayRun(); const S=ST.sums(), stg=state.lay.stg, keys=stKeys(), d=state.day, KZ=kZones(), f0=v=>nf(v,0), f1=v=>nf(v,1);
  const nm=stg==='1'?'Етап 1':stg==='2'?'Етап 2 · дах':'Весь об\'єкт', pend=`<span class="stg">рахую ${dayPct(d)} %…</span>`;
  const zs=K=>Object.entries((KZ&&KZ[K]&&KZ[K].z)||{}).filter(([z])=>keys.includes(z)).map(([z,v])=>`${ZN[z]} ${f0(v)}`).join(', ')||'—';
  const cards=KK.map(([K,tp,cam])=>{ const e=eK(K,d,keys,state.hour), q=KZ&&KZ[K]?KZ[K].inp:{1:0,2:0}, ni=stg==='1'?q[1]:stg==='2'?q[2]:q[1]+q[2];
    if(e&&!(e.kw>0)) return `<button type="button" class="kpi" data-cam="${cam}"><span class="k">${K.replace('K','К')} · ${tp}</span><span class="v">лише мережа</span><span class="s">етап 1 — без панелей: заряд від мережі в дешеві години, розряд у пікові (активний споживач)</span><span class="s">AC 500 кВт → ${tp} · входи PV — з етапу 2 (${q[2]} з 12)</span></button>`;
    return `<button type="button" class="kpi" data-cam="${cam}"><span class="k">${K.replace('K','К')} · ${tp}</span><span class="v">${e?`${f0(e.a)} <small>кВт·год за добу</small>`:'…'}</span>
      <span class="s">${e?(e.a>CAP?`${f0(e.a/CAP*100)} % ємності — понад ємність ≈${f0(e.a-CAP)}: цеху або в мережу`:`${f0(e.a/CAP*100)} % ємності від панелей`)+` · ясно ${f0(e.c)}`:pend}</span><span class="s">з ранку до ${hhmm(state.hour)}: ${e?`<b>${f0(e.aN)}</b> кВт·год · ${f0(e.aN/CAP*100)} %`:'…'}</span><span class="s">${ni} входів PV з 12 · ${e?f1(e.kw):'…'} кВтп: ${zs(K)}</span></button>`; }).join('');
  const SE=[0,1,2,3];
  const row=(K,tp)=>`<tr><td class="w">${K.replace('K','К')}<small>${tp}</small></td>${SE.map(i=>{ const e=eK(K,i,keys); return `<td${i===d?' class="cur"':''}>${e?`<b>${f0(e.a)}</b><small>${f0(e.a/CAP*100)} %</small>`:'…'}</td>`; }).join('')}</tr>`;
  const sum=SE.map(i=>{ const es=KK.map(([K])=>eK(K,i,keys)); return es.every(Boolean)?es.reduce((s_,e)=>s_+e.a,0):null; });
  const ab=inStage('ab'), abE=SE.map(i=>dayE(i,['ab'],null));
  const tab=`<div class="blk wide"><h3>Від панелей у контейнери за добу, кВт·год · середня погода</h3><div class="tw"><table class="cmp an"><thead><tr><th>Контейнер</th>${SE.map(i=>`<th${i===d?' class="cur"':''}>${MOS[i]}</th>`).join('')}</tr></thead><tbody>
    ${KK.map(([K,tp])=>row(K,tp)).join('')}<tr class="tot"><td class="w">Разом у 4 контейнери<small>ємність 4 × 1 205 = 4 820</small></td>${sum.map((v,i)=>`<td${i===d?' class="cur"':''}>${v!=null?`<b>${f0(v)}</b><small>${f0(v/(4*CAP)*100)} %</small>`:'…'}</td>`).join('')}</tr>
    ${ab?(()=>{ const v=ABV(), nmA={'1':['АБК → ТП-5913 · вар. 1','по СІП на шини 0,4 кВ ТП-5913: заряд К-3 / К-1 або мережа'],'2':['АБК → свій накопичувач · вар. 2','під числом — % від 241 кВт·год'],'3':['АБК → К-3 / К-1 · вар. 3','по СІП прямо в контейнери (траса умовна)']}[v];
      const r1=`<tr><td class="w">${nmA[0]}<small>${nmA[1]}</small></td>${abE.map((e,i)=>`<td${i===d?' class="cur"':''}>${e?`<b>${f0(e.a)}</b>${v==='2'?`<small>${f0(e.a/241*100)} %</small>`:''}`:'…'}</td>`).join('')}</tr>`;
      const r2=v==='2'?'':`<tr class="tot"><td class="w">Разом з АБК<small>частка від 4 820</small></td>${sum.map((s_,i)=>{ const e=abE[i]; return `<td${i===d?' class="cur"':''}>${s_!=null&&e?`<b>${f0(s_+e.a)}</b><small>${f0((s_+e.a)/(4*CAP)*100)} %</small>`:'…'}</td>`; }).join('')}</tr>`;
      return r1+r2; })():''}</tbody></table></div>
    <p class="src">Під числом — частка ємності АКБ, яку за добу дають панелі (для АБК у варіанті 2 — від 241 кВт·год власного накопичувача). Решту ємності контейнери беруть із мережі через PCS 500 кВт за графіком — його складемо після погодинних даних АСКОЕ від ДТЕК.</p></div>`;
  const e1=dayE(d,['ab'],null), v=ABV(), ev=e1?`${f0(e1.a)} <small>кВт·год за добу</small>`:'…';
  const vc=(k,ttl,val,l1,l2)=>`<button type="button" class="kpi${v===k?' cur':''}" data-abkv="${k}" aria-pressed="${v===k}"><span class="k">${ttl}</span><span class="v">${val}</span><span class="s">${l1}</span>${l2?`<span class="s">${l2}</span>`:''}</button>`;
  const abk=ab?`<div class="blk wide"><h3>АБК — 3 варіанти · ${MOS[d]} · натисніть, щоб показати в моделі</h3><div class="kpis">
    ${vc('1','1 · СІП до ТП-5913',ev,'Deye SUN-100K → СІП-4 4×70, підвіс 8,1 м через проїзд → щит СЕС у ТП-5913 → шини 0,4 кВ: заряд К-3 / К-1 їхніми лініями AC або мережа','окремого накопичувача немає (модель АБК, 28.10)')}
    ${vc('2','2 · Власний накопичувач АБК','120 <small>кВт</small> · 241 <small>кВт·год</small>',`Golen LES-241L120-PS (гібрид) або -PSC (із зарядкою авто); панелі АБК — на MPPT гібрида, СІП до ТП не потрібен${e1?`; за добу панелі заповнюють ≈${f0(e1.a/241*100)} %`:''}`,'місце біля АБК — уточнюється')}
    ${vc('3','3 · СІП до контейнерів К-3 / К-1',ev,`той самий провід з даху АБК — західним фасадом і підвісом через проїзд до К-3 / К-1, ≈${f0(V3L)} м (траса умовна); енергія АБК — прямо в контейнери`,'точку підключення в контейнері — уточнити в Golen')}</div></div>`:'';
  return `<div class="ph"><span class="eyebrow ours">Накопичувачі · ${nm}</span><h2>4 × Golen LES-H20 · 2 000 кВт · 4 820 кВт·год</h2>
  <p>По 2 контейнери на кожну ТП, ставляться в етапі 1. Кожен: PCS 500 кВт, АКБ 1 205 кВт·год, до 12 входів PV по 60 кВт (DC/DC). Енергія від панелей — ${MOS[d]}, для вибраного етапу; натисніть картку — камера перейде до контейнера.</p></div>
  <div class="kpis">${cards}</div>${tab}${abk}
  <p class="src" style="grid-column:1/-1">Енергія від панелей — розрахунок доби з тінню кожного модуля (розділ «Сонце і генерація»); розподіл по контейнерах — за кВтп щитів PV, підключених до кожного (аналіз електрики 04.11); без утрат перетворення в DC/DC і АКБ. Етап 1: К-3 і К-1 — фасади і склад, К-4 і К-5 — ліхтарі; етап 2 — дах цеху на всі чотири.</p>`; };
document.addEventListener('click',e=>{ const q=e.target&&e.target.closest&&e.target.closest('.kpi[data-abkv]'); if(q){ state.lay.abkV=q.dataset.abkv; apply(); save(); goTo(VIEWS.abkv); return; } const b=e.target&&e.target.closest&&e.target.closest('.kpi[data-cam]'); if(b){ goCam(b.dataset.cam); const cams=$('#cams'); if(cams) cams.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.c===b.dataset.cam))); } });
// ---------- натискання на модуль: підсумок його групи, етапу і всього об'єкта
const STGN={ab:'етап 1',fac:'етап 1',lan:'етап 1',wh:'етап 1',roof:'етап 2'};
function grpInfo(k){ const S=ST.sums(), Y=S[k], G=NOW&&NOW.g[k], E=k==='roof'?S.s2:S.s1, T=FP&&FP.T;
  const e=dayE(state.day,[k],state.hour), sn=G&&G.on&&NOW.alt>0?` Зараз о ${hhmm(state.hour)}: на сонці ${nf(G.cnt[0])}, частково в тіні ${nf(G.cnt[1])}, у тіні ${nf(G.cnt[2])} з ${nf(G.n)}.`:G&&G.on?` Зараз (${hhmm(state.hour)}) ніч — модулі не працюють.`:'';
  const now=(e?` За добу ${DAYS[state.day][0]} (${SEASN[state.day].toLowerCase()}): ${fe(e.c)} ясно · ${fe(e.a,e.c)} сер. погода (${nf(e.a/Y.kwp,2)} кВт·год/кВтп); накопичено до ${hhmm(state.hour)} — ${fe(e.cN,e.c)} ясно · ${fe(e.aN,e.c)} сер.`:'')+sn;
  const det=k==='fac'&&T?` Південь — ${T.S.n} вертикально; схід — козирок 25° ${T.Ec.n} + вертикально ${T.Ev.n}.`:k==='lan'?' 4 ліхтарі без демонтажу, модулі поверх скління (≈41°).':k==='roof'?' Дах В1 на новій мембрані, без місць на ліхтарях.':k==='ab'?' Дах, надбудова і стіни АБК за ДБН, інвертор Deye 100 кВт.':' Модулі на скатах профнастилу.';
  return {t:`${NAMES[k]} · ${STGN[k]}`, d:`${nf(Y.st)} модулів${Y.lit?` (+${Y.lit} на освітлення)`:''} · ${nf(Y.kwp,1)} кВтп · за рік ≈${nf(Y.mwh,1)} МВт·год.${det}${now} ${k==='roof'?'Етап 2':'Етап 1'} разом: ${nf(E.st)} модулів · ${nf(E.kwp,0)} кВтп · ≈${nf(E.mwh,0)} МВт·год. Весь об'єкт: ${nf(S.all.st)} модулів · ${nf(S.all.kwp,0)} кВтп · ≈${nf(S.all.mwh,0)} МВт·год за рік.`}; }
{ const set=(o,k)=>{ if(o) o.userData.info=()=>grpInfo(k); };
  const V=R28.VG['1']; if(V) V.children.forEach(o=>{ if(o.userData.part==='roof') set(o,'roof'); });
  L28.LG28.forEach(q=>{ const g=q.v2m&&q.v2m['1']; if(g) g.traverse(o=>{ if(o.isInstancedMesh) set(o,'lan'); }); });
  if(FP) [FP.pvL,FP.pvP,FP.pc].forEach(o=>set(o,'fac'));
  WHI.forEach(w=>set(w.im,'wh'));
  if(A) A.MODS.forEach(r=>set(r.mesh,'ab')); }
// ---------- «Об'єкт»: структурована аналітика замість старих звітів (порівняння з РП, В1 / В2, покриття ліхтарів)
{ const st=document.createElement('style'); st.textContent=`
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;grid-column:1/-1}
.kpi{border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--surface-2);display:flex;flex-direction:column;gap:2px;cursor:default}
.kpi.cur{border-color:var(--ours);box-shadow:inset 0 0 0 1px var(--ours)}
.kpi .k{font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3)}
.kpi .v{font:650 18px/1.2 var(--mono);color:var(--ink)} .kpi .v small{font:500 12px var(--font);color:var(--ink-2)}
.kpi .s{font-size:12px;color:var(--ink-2)}
button.kpi{font:inherit;text-align:left;color:inherit;cursor:pointer}
.gb{display:block;height:5px;border-radius:3px;background:var(--ours);opacity:.75;margin:3px 0 0 auto}
.an td{white-space:nowrap} .an td.w{white-space:normal;min-width:7.5em;font-family:var(--font)} .an td small,.an td .stg{display:block;font:500 11px var(--font);color:var(--ink-3);white-space:normal}
.stg{font:600 11px var(--font);color:var(--ink-3)}
ul.open{margin:0;padding-left:18px;color:var(--ink-2);font-size:12.5px;display:flex;flex-direction:column;gap:3px}
#modes .sep{flex:none;width:1px;align-self:stretch;margin:3px 4px;background:var(--line)}
.legend .sw,.cmp .sw{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}
.pane > .sunb{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px 28px;align-items:start;min-width:0} .sunb > .src,.sunb > .wide,.pane > .wide,.pane > .kpis{grid-column:1/-1} .cmp.gt{min-width:600px} .cmp.gt td.w small{display:inline;margin-left:6px}
.tw{overflow-x:auto;max-width:100%} .cmp tr.cur td{background:var(--surface-2)}
.cv{position:relative} .cv svg{display:block;width:100%;height:auto;touch-action:pan-y}
.cv .gl{stroke:var(--line);stroke-width:1} .cv .ya,.cv .xa{font:10px var(--font);fill:var(--ink-3)} .cv .ya{text-anchor:end} .cv .xa{text-anchor:middle} .cv .nwt{text-anchor:start;fill:var(--ink-2)}
.cv .lc{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round} .cv .la{fill:none;stroke:var(--sun);stroke-width:2;stroke-linejoin:round}
.cv .acc{fill:var(--accent);opacity:.16} .cv .nw{stroke:var(--ink-3);stroke-width:1;stroke-dasharray:3 3} .cv .hx{stroke:var(--ink-2);stroke-width:1}
.cv .hc{fill:var(--accent);stroke:var(--surface);stroke-width:2} .cv .ha{fill:var(--sun);stroke:var(--surface);stroke-width:2}
.cv .ctip{position:absolute;pointer-events:none;background:var(--surface);color:var(--ink);border:1px solid var(--line-2);border-radius:8px;padding:5px 8px;font-size:12px;line-height:1.4;box-shadow:0 4px 14px rgba(0,0,0,.14);white-space:nowrap}
.lg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:var(--ink-2)} .lg i{display:inline-block;vertical-align:middle;margin-right:5px}
.cb{display:flex;width:90px;height:8px;border-radius:3px;overflow:hidden;gap:1px;margin-left:auto} .cb i{display:block;height:100%}
.lg .ln{width:16px;height:2px;border-radius:1px} .lg .ln.c{background:var(--accent)} .lg .ln.a{background:var(--sun)} .lg .ar{width:12px;height:10px;border-radius:2px;background:var(--accent);opacity:.25}`; document.head.appendChild(st); }
panelPZ=function(){ const S=ST.sums(), stg=state.lay.stg, f1=v=>nf(v,1), f0=v=>nf(v,0), sy=x=>x.kwp?f0(x.mwh*1000/x.kwp):'—';
  const G=[['roof','Дах цеху','2'],['fac','Фасади цеху','1'],['lan','Ліхтарі — модулі на склі','1'],['wh','Склад','1'],['ab','АБК','1']], mx=Math.max(...G.map(([k])=>S[k].mwh));
  const tile=(v,k,big,sub,line)=>`<button type="button" class="kpi${stg===v?' cur':''}" data-stg="${v}"><span class="k">${k}</span><span class="v">${big}</span><span class="s">${sub}</span>${line?`<span class="s">${line}</span>`:''}</button>`;
  const rows=G.map(([k,n,e])=>{ const x=S[k]; return `<tr><td class="w">${n}<span class="stg">етап ${e} · ${sy(x)} кВт·год/кВтп</span></td><td>${nf(x.st)}${x.lit?`<small>+${x.lit} осв.</small>`:''}</td><td>${f1(x.kwp)}</td><td>${f1(x.mwh)}<span class="gb" style="width:${Math.max(3,Math.round(56*x.mwh/mx))}px"></span></td><td>${f0(x.mwh/S.all.mwh*100)} %</td></tr>`; }).join('');
  return `<div class="ph"><span class="eyebrow ours">Весь об'єкт · АБК і цех</span><h2>${f0(S.all.kwp)} кВтп · ≈${f0(S.all.mwh)} МВт·год за рік</h2>
  <p>${nf(S.all.st)} модулів у мережу (+${S.all.lit} на освітлення) · два етапи · накопичувачі 4 × 500 кВт / 1 205 кВт·год</p></div>
  <div class="kpis">${tile('1','Етап 1 · зараз',`${f0(S.s1.kwp)} <small>кВтп</small>`,`≈${f0(S.s1.mwh)} МВт·год · ${nf(S.s1.st)} модулів`,'АБК, фасади, ліхтарі, склад')}
  ${tile('2','Етап 2 · після мембрани',`${f0(S.s2.kwp)} <small>кВтп</small>`,`≈${f0(S.s2.mwh)} МВт·год · ${nf(S.s2.st)} модулів`,'дах цеху, В1 з проходами')}
  ${tile('all','Весь об\'єкт',`${f0(S.all.kwp)} <small>кВтп</small>`,`≈${f0(S.all.mwh)} МВт·год · ${f0(S.all.mwh*1000/S.all.kwp)} кВт·год/кВтп`,'')}
  <div class="kpi"><span class="k">Накопичувачі · етап 1</span><span class="v">2 000 <small>кВт</small></span><span class="s">4 820 кВт·год · 4 контейнери, по 2 на ТП</span><span class="s">відпуск у мережу до 2 000 кВт</span></div></div>
  <div class="blk"><h3>Генерація за рік по групах</h3><table class="cmp an"><thead><tr><th>Група</th><th>Модулів</th><th>кВтп</th><th>МВт·год</th><th>Частка</th></tr></thead><tbody>${rows}
  <tr class="tot"><td class="w">Разом<span class="stg">${sy(S.all)} кВт·год/кВтп</span></td><td>${nf(S.all.st)}</td><td>${f1(S.all.kwp)}</td><td>${f1(S.all.mwh)}</td><td>100 %</td></tr></tbody></table>
  <p class="src">Модулі ZNSHINE 730 Вт; у стрінгах по 11, модулі «осв.» не складають стрінг і живлять освітлення цеху. МВт·год — розрахунки розкладок: АБК — ДБН 28.10 (на виході інвертора), фасади — 27.10, ліхтарі — 28.10 на склі, склад — 26.10, дах — 28.10 В1 (ще без тіні від ліхтарів, що лишаються).</p></div>
  <div class="blk"><h3>Накопичувачі</h3><table class="cmp an"><thead><tr><th>Де і що</th><th>кВт</th><th>кВт·год</th></tr></thead><tbody>
  <tr><td class="w">ТП-5913 · К-3, К-1<span class="stg">LES-H20 на МС-3, МС-1 біля східного фасаду; етап 1 — усі панелі етапу 1: фасади, склад і ліхтарі (14 щитів, 658,5 кВтп); етап 2 — ще 10 щитів сходу даху</span></td><td>1 000</td><td>2 410</td></tr>
  <tr><td class="w">ТП-6923 · К-4, К-5<span class="stg">LES-H20 з півночі від ТП-6923, на бермі +1,8 м за приямком (за позначкою 04.11); етап 1 — без панелей, лише мережа: заряд і розряд (активний споживач); етап 2 — захід даху (18 щитів)</span></td><td>1 000</td><td>2 410</td></tr>
  <tr class="tot"><td class="w">Цех · 4 контейнери</td><td>2 000</td><td>4 820</td></tr>
  <tr><td class="w">АБК · 3 варіанти<span class="stg">1 — СІП до ТП-5913 (без накопичувача); 2 — власний LES-241L120-PS / -PSC, місце уточнюється; 3 — СІП до К-3 / К-1. Деталі — розділ «Накопичувачі»</span></td><td>${ABV()==='2'?'120':'—'}</td><td>${ABV()==='2'?'241':'—'}</td></tr></tbody></table>
  <p class="src">Ємність остаточно — за погодинними даними АСКОЕ від ДТЕК (запит надіслано через ТОВ МК «АНТАРЕС»).</p></div>
  <div class="blk"><h3>Що ще відкрито</h3><ul class="open"><li>Тінь від ліхтарів, що лишаються, на модулі даху етапу 2 — річну генерацію перерахувати.</li><li>К-4, К-5 з півночі від ТП-6923 на бермі +1,8 м: огородження по краю стінки, під’їзд крана (з проїзду чи з в’їзду на півночі), паркан не міряно; відстані до ТП, жалюзі й шафи з пропаном — перевірити.</li><li>АБК: вибрати варіант 1 / 2 / 3; для 2 — модель (із зарядкою чи без) і місце біля АБК; для 3 — точка підключення в контейнері (Golen) і траса СІП.</li><li>Розподіл стрінгів даху між парами контейнерів.</li><li>Ємність накопичувачів — після даних ДТЕК.</li></ul></div>`; };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('.kpi[data-stg]'); if(b) ST.setStage(b.dataset.stg); });
// ---------- підказки моделі: без посилань на фото обстеження і на проєкт РП (власник 04.11, 14:37)
const SCRUB=x=>{ if(!x||typeof x!=='object') return x; const f=t=>typeof t!=='string'?t:t
    .replace(/\s*\([^()]*[Фф]ото[^()]*\)/g,'').replace(/\s*Фото\s*№\s*[\d,\s–-]*\.?/g,'').replace(/,?\s*(?:—\s*)?за фото(?: обстеження)?(?: [\d.]+)?(?: №\s*\d+)?:?/g,'').replace(/\s*на фото(?: \d+)?/g,'')
    .split(/(?<=[.!?])\s+/).filter(z=>!/РП|РП|[Фф]ото/.test(z)).join(' ').replace(/\s{2,}/g,' ').replace(/\s+([.,;:])/g,'$1').replace(/([.,;])\1+/g,'$1').trim();
  return {...x,t:f(x.t),d:f(x.d)}; };
scene.traverse(o=>{ const u=o.userData&&o.userData.info; if(!u) return; if(typeof u==='function'){ if(!u.__scr){ const g=(...a)=>SCRUB(u(...a)); g.__scr=true; o.userData.info=g; } } else if(typeof u==='object') o.userData.info=SCRUB(u); });
// ---------- старі підказки: без В2 і без старого нашого рішення з 3 контейнерами
scene.traverse(o=>{ const u=o.userData&&o.userData.info; if(u&&typeof u==='object'&&typeof u.d==='string'&&/\(В2\)/.test(u.d)) u.d=u.d.replace(/\s*або\s*[\d,]+\s*м\s*\(В2\)/g,''); });
if(BS) ESS.forEach(o=>{ if(!o.isGroup||!o.children.length) return; const body=o.children[0], u=body.userData&&body.userData.info; if(!u||typeof u!=='object'||!/^K-[13] /.test(u.t||'')) return; const id=u.t.slice(0,3);
  body.userData.info={t:`${id} · Golen LES-H20-1205W500C-PS · ТП-5913`,d:`АКБ 1 205 кВт·год, PCS 500 кВт, 12 входів PV по 60 кВт. Пара К-3 + К-1: етап 1 — усі панелі етапу 1: фасади, склад і ліхтарі (14 щитів, 82 стрінги, 658,5 кВтп); етап 2 — ще 10 щитів сходу даху. Майданчик ${id==='K-3'?'МС-3':'МС-1'} біля східного фасаду, торець PCS — 3,0 м від стіни.`}; });
// ---------- старт
// ---------- «Сонце і генерація» → «Радіація за рік» (власник 04.11, 14:37): колір поверхні за сонцем на м² за рік. Дах і фасади цеху, склад — RADD (rad.js, 26.10);
// АБК — рахується тут: клітинки 1 × 1 м на дахах і стінах АБК (промені на будівлю АБК), сонце за 12 характерних днів місяців Meteonorm (10 хв), тінь від АБК, цеху,
// ТП і будівель поруч, закрите небо; шкала — та сама, що в RADD (зведено до тієї ж горизонталі без тіні).
const RCc=['#f7a062','#ea7428','#cf550c','#a94006','#7f2f04','#561f02'], RCL2=RCc.map(c=>lin(c)), clsR=e=>RADD.cl.reduce((k,t)=>k+(e>=t?1:0),0);
const ABR={cells:null,done:false,pct:0,job:null,im:null,st:null,k:1}, RGA=grp('radABK'); RGA.visible=false;
const ABN={roof:'Дах АБК',S:'Стіни АБК, південь',E:'Стіни АБК, схід',W:'Стіни АБК, захід',N:'Стіни АБК, північ'};
function abkCells(){ const rc=new THREE.Raycaster(), tg=[]; A.root.updateMatrixWorld(true); A.groups.bld.traverse(o=>{ if(o.isMesh&&o.visible!==false) tg.push(o); });
  const out=[], nW=new V3(), mN=new THREE.Matrix3();
  const shoot=(o,d,ok,k)=>{ rc.set(o,d); rc.far=60; const h=rc.intersectObjects(tg,false)[0]; if(!h||!h.face) return; mN.getNormalMatrix(h.object.matrixWorld); nW.copy(h.face.normal).applyMatrix3(mN).normalize(); if(nW.dot(d)>0) nW.negate();
    if(ok(nW,h.point)) out.push({p:h.point.clone(),n:nW.clone(),k}); };
  for(let x=108;x<=128.5;x+=1) for(let y=6;y<=45.5;y+=1) shoot(W(x,y,40),new V3(0,-1,0),(n,q)=>n.y>0.5&&q.y>3,'roof');
  for(let x=108.5;x<=128;x+=1) for(let z=0.5;z<=14.5;z+=1){ shoot(W(x,1.5,z),new V3(0,0,-1),n=>n.z>0.7,'S'); shoot(W(x,49,z),new V3(0,0,1),n=>n.z<-0.7,'N'); }
  for(let y=6.5;y<=45.5;y+=1) for(let z=0.5;z<=14.5;z+=1){ shoot(W(133,y,z),new V3(-1,0,0),n=>n.x>0.7,'E'); shoot(W(104.6,y,z),new V3(1,0,0),n=>n.x<-0.7,'W'); }
  return out; }
// перешкоди для АБК (коробки X0,X1,Y0,Y1,Z0,Z1): блоки АБК, цех, ТП, будівлі поруч; свій блок клітинки не враховується
function abkBoxes(){ const zm=(a,b)=>{ let z=0; for(let x=a;x<=b+1e-6;x+=0.25) z=Math.max(z,roofZ(Math.min(96.64,x))); return z+0.3; }, sh=[[-0.15,56.64,-0.5,96.59,0,zm(0,56.64)]];
  for(let x=56.64;x<96.64-1e-6;x+=2) sh.push([x,x+2,-0.5,96.59,0,zm(x,x+2)]);   // цех — смугами по 2 м зі сходу (арки), щоб тінь на захід АБК не завищувати
  return [...ABKB,...sh,...TPB,...OBX]; }
const HEM=(()=>{ const a=[], N=48, ga=Math.PI*(3-Math.sqrt(5)); for(let i=0;i<N;i++){ const z=1-(i+0.5)/N, r=Math.sqrt(1-z*z), t=ga*i; a.push([r*Math.cos(t),r*Math.sin(t),z]); } return a; })();
function abkPrep(){ const C=abkCells(), BX=abkBoxes();
  ABR.cells=C.map(c=>{ const P=[c.p.x,-c.p.z,c.p.y], n=[c.n.x,-c.n.z,c.n.y], o=P.map((v,i)=>v+n[i]*0.08);
    const bx=BX.filter(b=>!(P[0]>b[0]-0.3&&P[0]<b[1]+0.3&&P[1]>b[2]-0.3&&P[1]<b[3]+0.3&&P[2]>b[4]-0.3&&P[2]<b[5]+0.3));
    // відкрите небо: напрямки півсфери над площиною модуля, що дивляться в небо (z > 0), вага — косинус
    const t1=Math.abs(n[2])<0.9?[0,0,1]:[1,0,0], u=[n[1]*t1[2]-n[2]*t1[1],n[2]*t1[0]-n[0]*t1[2],n[0]*t1[1]-n[1]*t1[0]], ul=Math.hypot(...u), U=u.map(v=>v/ul), V=[n[1]*U[2]-n[2]*U[1],n[2]*U[0]-n[0]*U[2],n[0]*U[1]-n[1]*U[0]];
    let sa=0,sb=0; HEM.forEach(h=>{ const d=[0,1,2].map(i=>U[i]*h[0]+V[i]*h[1]+n[i]*h[2]); if(d[2]<=0) return; sa+=h[2]; if(!bx.some(b=>rayBox(o,d,b))) sb+=h[2]; });
    return {c,P,n,o,bx,svf:sa>0?sb/sa:1,e:0,e0:0}; });
  ABR.m=0; ABR.i=0; }
// один крок місяця: сума за день × днів; шматками у фоні
function abkStep(){ const t0=performance.now(), MO=WX.mo, C=ABR.cells;
  while(ABR.m<MO.length&&performance.now()-t0<28){ const W_=MO[ABR.m], nd=W_.nd, p=W_.p;
    for(const st of W_.st){ const d=[st[1],st[2],st[3]], G=st[4], Dn=st[5], D=st[6], ext=st[7], Ai=ext>0?Dn/ext:0, cz=Math.max(st[3],0.01), Go=W_.c*G;
      for(let j=ABR.i;j<C.length;j++){ const q=C[j], n=q.n, nz=n[2], cb=Math.max(0,d[0]*n[0]+d[1]*n[1]+d[2]*n[2]), bm=Dn*cb+D*Ai*cb/cz, lit=cb>0&&!q.bx.some(b=>rayBox(q.o,d,b))?1:0;
        const iso=D*(1-Ai)*(1+nz)/2, gr=G*0.2*(1-nz)/2, ov=Go*(1+nz)/2, og=Go*0.2*(1-nz)/2;
        q.e+=nd*DT*(p*(bm*lit+iso*q.svf+gr)+(1-p)*(ov*q.svf+og)); q.e0+=nd*DT*(p*(bm+iso+gr)+(1-p)*(ov+og)); } }
    ABR.m++; }
  ABR.pct=Math.round(ABR.m/MO.length*100); return ABR.m>=MO.length; }
function abkGhi(){ let e=0; WX.mo.forEach(W_=>W_.st.forEach(st=>{ const G=st[4], D=st[6], Dn=st[5], ext=st[7], Ai=ext>0?Dn/ext:0, cz=Math.max(st[3],0.01), Go=W_.c*G, bm=Dn*Math.max(0,st[3])+D*Ai*Math.max(0,st[3])/cz;
  e+=W_.nd*DT*(W_.p*(bm+D*(1-Ai))+(1-W_.p)*Go); })); return e/1000; }
function abkBuild(){ const C=ABR.cells, k=RADD.ghi/abkGhi(); ABR.k=k; C.forEach(q=>{ q.E=q.e/1000*k; q.E0=q.e0/1000*k; });
  const PL=new THREE.PlaneGeometry(1,1), mt=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const im=new THREE.InstancedMesh(PL,mt,C.length), Mx=new M4(), qq=new THREE.Quaternion(), Z=new V3(0,0,1), sc=new V3(0.97,0.97,1); im.frustumCulled=false;
  C.forEach((q,i)=>{ qq.setFromUnitVectors(Z,q.c.n); Mx.compose(q.c.p.clone().addScaledVector(q.c.n,0.06),qq,sc); im.setMatrixAt(i,Mx); im.setColorAt(i,RCL2[clsR(q.E)]); });
  im.instanceMatrix.needsUpdate=true; im.instanceColor.needsUpdate=true; RGA.add(im); ABR.im=im;
  im.userData.info=i=>{ const q=C[i]; return {t:`${ABN[q.c.k]} · X ${nf(q.P[0],1)}, Y ${nf(q.P[1],1)}, висота ${nf(q.P[2],1)} м`,d:`${nf(q.E,0)} кВт·год/м² за рік — ${nf(q.E/RADD.ghi*100,0)} % від горизонтальної площини без тіні (${nf(RADD.ghi,0)}). Тінь і закрите небо забирають ${nf((1-q.E/Math.max(1,q.E0))*100,0)} %.`}; };
  PICK.push({o:im,when:()=>RGA.visible});
  const st={}; C.forEach(q=>{ const s_=st[q.c.k]=st[q.c.k]||{area:0,sum:0,sum0:0,min:1e9,max:0,cls:[0,0,0,0,0,0]}; s_.area++; s_.sum+=q.E; s_.sum0+=q.E0; s_.min=Math.min(s_.min,q.E); s_.max=Math.max(s_.max,q.E); s_.cls[clsR(q.E)]++; });
  Object.values(st).forEach(s_=>{ s_.mean=s_.sum/s_.area; s_.shade=(1-s_.sum/s_.sum0)*100; }); ABR.st=st; ABR.done=true; }
function abkRun(){ if(ABR.done||ABR.job||!A) return; if(!ABR.cells) abkPrep();
  const tick=()=>{ ABR.job=null; const done=abkStep(); if(done){ abkBuild(); setVis(); legendSun(); panelNow(); need=true; return; } legendSun(); ABR.job=setTimeout(tick,0); }; ABR.job=setTimeout(tick,0); }
const radOn2=()=>state.sec==='sun'&&!!state.lay.rad&&state.proj==='ours';
setVis=(f=>function(){ f.apply(this,arguments); const on=radOn2(); RGA.visible=on&&ABR.done; if(!on) return; abkRun();
  G.ours.visible=true; if(FP&&FP.FG) FP.FG.visible=false; WHI.forEach(w=>{ w.im.visible=false; });
  L28.LG28.forEach(q=>{ Object.values(q.v2m||{}).forEach(g=>g.visible=false); Object.values(q.v2r||{}).forEach(g=>g.visible=false); });
  Object.values(R28.VG||{}).forEach(g=>g.children.forEach(o=>{ if(o.userData.part==='roof') o.visible=false; }));
  if(A) ['arch','low','wall','nad','mount','safety','elec','str','lps'].forEach(k=>{ if(A.groups[k]) A.groups[k].visible=false; });
  if(G.rad) G.rad.visible=true; need=true; })(setVis);
// блок у панелі «Сонця»
function radBlock(){ const S=RADD.st, f0=v=>nf(v,0), RN={roof:'Дах цеху',whA:'Склад A, 11° на пд',whB:'Склад B, 11° на пд',whC1:'Склад C1, 2 схили 22°',S:'Фасад цеху, південь',E:'Фасад цеху, схід',N:'Фасад цеху, північ'};
  const bar=c=>`<span class="cb">${c.map((v,i)=>v?`<i style="background:${RCc[i]};flex:${v}"></i>`:'').join('')}</span>`;
  const row=(n,s_)=>`<tr><td class="w">${n}</td><td>${f0(s_.area)}</td><td><b>${f0(s_.mean)}</b></td><td>${f0(s_.max)}</td><td>${f0(s_.mean/RADD.ghi*100)} %</td><td>${nf(s_.shade,1)} %</td><td>${bar(s_.cls)}</td></tr>`;
  const ab=ABR.done?['roof','S','E','W','N'].filter(k=>ABR.st[k]).map(k=>row(ABN[k],ABR.st[k])).join(''):`<tr><td class="w">АБК</td><td colspan="6">рахую ${ABR.pct} %…</td></tr>`;
  return `<div class="blk wide"><h3>Сонце за рік на кожен м² поверхні, кВт·год/м²</h3><div class="tw"><table class="cmp an"><thead><tr><th>Поверхня</th><th>Площа, м²</th><th>Середнє</th><th>Макс.</th><th>Від горизонталі</th><th>Тінь і закрите небо</th><th>Розподіл</th></tr></thead><tbody>
    ${['roof','whA','whB','whC1','S','E','N'].map(k=>row(RN[k],S[k])).join('')}${ab}</tbody></table></div>
    <p class="src">Горизонтальна площина без тіні — ${f0(RADD.ghi)} кВт·год/м² за рік (Meteonorm 8.1). Колір поверхні в моделі — та сама шкала; модулі в цьому шарі сховано. Дах, фасади цеху і склад — розрахунок 26.10 (клітинки 0,5–1 м); АБК — тут, клітинки 1 × 1 м на дахах і стінах, 12 характерних днів місяців по 10 хв, тінь від АБК, цеху, ТП і будівель поруч.</p></div>`; }
{ const v=VIEWS.over; camera.position.set(...v.p); controls.target.set(...v.c); controls.update(); need=true; }   // старт — «Огляд» з південного сходу
// ---------- вкладка «Радіація за рік» (власник 04.11, 18:04: «окремим просто шаром натискаєш і бачимо карту… поверхні по кольору в залежності від того, скільки вони
// на рік отримують сонячної радіації… і середня»): той самий шар радіації (rad.js + АБК тут), окремою вкладкою поруч із «Сонце і генерація»; над поверхнями — середнє
const isRad=()=>state.sec==='sun'&&!!state.lay.rad;
{ const tb=$('#tabs'), sb=tb&&tb.querySelector('button[data-s="sun"]');
  if(sb&&typeof RADD!=='undefined'){ const rb=document.createElement('button'); rb.type='button'; rb.setAttribute('role','tab'); rb.dataset.s='radt'; rb.textContent='Радіація за рік'; sb.after(rb);
    rb.onclick=()=>{ state.sec='sun'; state.lay.rad=true; apply(); };
    tb.querySelectorAll('button[data-s]').forEach(b=>{ if(b!==rb) b.addEventListener('click',()=>{ state.lay.rad=false; },{capture:true}); });
    const ORD=['pz','sun','radt','uze'];
    stepSec=function(dir){ const i=ORD.indexOf(isRad()?'radt':state.sec), n=ORD[((i<0?0:i)+dir+ORD.length)%ORD.length]; if(n==='radt'){ state.sec='sun'; state.lay.rad=true; } else { state.sec=n; state.lay.rad=false; } apply(); };
    const hudR=hudCtx; hudCtx=function(){ hudR.apply(this,arguments); const r=isRad(); sb.setAttribute('aria-selected',String(state.sec==='sun'&&!r)); rb.setAttribute('aria-selected',String(r));
      if(r){ const x=rb.offsetLeft-tb.clientWidth/2+rb.offsetWidth/2; tb.scrollTo({left:Math.max(0,x)}); const m=$('#modes'); if(m) m.hidden=true; } }; } }
// середнє над кожною поверхнею — табличкою на моделі
const RGL=grp('radLbl'); RGL.visible=false; let rglABK=false;
function radTag(l1,l2,hex){ const h=150, c=document.createElement('canvas'), x=c.getContext('2d'), F1='700 50px system-ui,sans-serif', F2='500 40px system-ui,sans-serif';
  x.font=F1; let w=x.measureText(l1).width; x.font=F2; w=Math.ceil(Math.max(w,x.measureText(l2).width)+76); c.width=w; c.height=h;
  x.fillStyle='rgba(255,255,255,0.95)'; x.fillRect(0,0,w,h); x.fillStyle=hex; x.fillRect(0,0,26,h); x.fillStyle='#1d2a33'; x.font=F1; x.textBaseline='top'; x.fillText(l1,48,16); x.font=F2; x.fillStyle='#3f4a52'; x.fillText(l2,48,84);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true,sizeAttenuation:false})); sp.renderOrder=30; sp.userData.ar=w/h; return sp; }
const radLbl=(name,mean,pos,size)=>{ const sp=radTag(name,`≈${nf(mean,0)} кВт·год/м² · ${nf(mean/RADD.ghi*100,0)} %`,RCc[clsR(mean)]), hh=(innerWidth<700?0.042:0.036)*(size>3?1.15:1); sp.scale.set(hh*sp.userData.ar,hh,1); sp.position.copy(pos);
  sp.userData.info={t:`${name}: сонце за рік`,d:`У середньому ${nf(mean,0)} кВт·год/м² за рік — ${nf(mean/RADD.ghi*100,0)} % від горизонтальної площини без тіні (${nf(RADD.ghi,0)}). Колір клітинок — шкала в легенді; натисніть клітинку — її значення.`};
  PICK.push({o:sp,when:()=>RGL.visible}); RGL.add(sp); };
{ const RGx=window.__twin.rad&&window.__twin.rad.RG, K=['roof','S','N','E','whA','whB','whC1'], NM={roof:'Дах цеху',S:'Фасад цеху, південь',N:'Фасад цеху, північ',E:'Фасад цеху, схід',whA:'Склад A',whB:'Склад B',whC1:'Склад C1'};
  if(RGx) RGx.children.forEach((im,i)=>{ const k=K[i], S_=RADD.st[k]; if(!S_||!im.isInstancedMesh) return; const c=new V3(), p=new V3(), M_=new M4(); let n=0;
    for(let j=0;j<im.count;j++){ im.getMatrixAt(j,M_); p.setFromMatrixPosition(M_); c.add(p); n++; } c.divideScalar(Math.max(1,n));
    const off=k==='roof'?new V3(0,4,0):k==='S'?new V3(0,1,4):k==='N'?new V3(0,1,-4):k==='E'?new V3(4,1,0):new V3(0,2.5,0);
    radLbl(NM[k],S_.mean,c.add(off),k==='roof'?3.2:k.startsWith('wh')?1.7:2.4); }); }
function radLblABK(){ if(rglABK||!ABR.done||!ABR.st) return; const r=ABR.cells.filter(q=>q.c.k==='roof'); if(!r.length) return; const c=new V3(); r.forEach(q=>c.add(q.c.p)); c.divideScalar(r.length).add(new V3(0,3,0));
  radLbl('Дах АБК',ABR.st.roof.mean,c,2.2); rglABK=true; }
// панель вкладки
function radStatsAll(){ const S=RADD.st, wh=['whA','whB','whC1'].map(k=>S[k]).filter(Boolean), wa=wh.reduce((a,x)=>a+x.area,0), wm=wa?wh.reduce((a,x)=>a+x.mean*x.area,0)/wa:0; return {roof:S.roof.mean,S:S.S.mean,E:S.E.mean,N:S.N.mean,wh:wm}; }
function radTabPanel(){ const T=radStatsAll(), f0=v=>nf(v,0), tile=(k,v,sub)=>`<div class="kpi"><span class="k">${k}</span><span class="v">${f0(v)} <small>кВт·год/м²</small></span><span class="s">${sub}</span></div>`;
  const ab=ABR.done&&ABR.st&&ABR.st.roof?tile('Дах АБК',ABR.st.roof.mean,`${f0(ABR.st.roof.mean/RADD.ghi*100)} % від горизонталі`):`<div class="kpi"><span class="k">АБК</span><span class="v">…</span><span class="s">рахую ${ABR.pct} %</span></div>`;
  return `<div class="ph"><span class="eyebrow ours">Радіація за рік · кВт·год/м²</span><h2>Скільки сонця отримує кожен м² поверхні за рік</h2>
  <p>Колір поверхні — сонце за рік з тінню (ліхтарі, парапети, сусідні будівлі) і закритим небом; модулі в цьому шарі сховано. Над поверхнями — середнє; натисніть клітинку — її значення.</p></div>
  <div class="kpis">${tile('Дах цеху',T.roof,`${f0(T.roof/RADD.ghi*100)} % від горизонталі`)}${tile('Фасад, південь',T.S,`${f0(T.S/RADD.ghi*100)} % · вертикально`)}${tile('Фасад, схід',T.E,`${f0(T.E/RADD.ghi*100)} % · вертикально`)}${tile('Склад',T.wh,`середнє A, B, C1 за площею`)}${ab}
  ${tile('Горизонталь без тіні',RADD.ghi,'Meteonorm 8.1, Київ — 100 %')}</div><div id="gRadBody" class="sunb">${radBlock()}</div>`; }
const psR=panelSun; panelSun=function(){ return isRad()?radTabPanel():psR.apply(this,arguments); };
const pnR=panelNow; panelNow=function(){ if(isRad()){ radLblABK(); const el=document.getElementById('gRadBody'); if(el) el.innerHTML=radBlock(); return; } return pnR.apply(this,arguments); };
setVis=(f=>function(){ f.apply(this,arguments); const on=radOn2(); RGL.visible=on; if(on) radLblABK(); })(setVis);
window.__twin.cleanDbg={SETS,litC,obstacles,compute,dayE,DAYC,statusPaint,K13,ABR,get NOW(){return NOW;}};
buildSets(); apply();
}
}
