// ================= Чиста збірка «Антарес · весь об'єкт» — src/clean.js (лише в antares/obj/build.sh, після stages.js)
// Без Вінницького проєкту. Два розділи: «Об'єкт» і «Сонце і генерація». Над моделлю — лише перемикач етапів.
// Усі модулі одного кольору (без розфарбовування станом), тіні — справжні від сонця; генерація «зараз» — живий розрахунок
// тіні й потужності кожного модуля етапу (та сама модель, що в «Сонці» двійника: Meteonorm 8.1, ясно / середня погода; без втрат від стрінгів).
{ const ST=window.__twin.stages, R28=window.__twin.r28, L28=window.__twin.lan28, FP=window.__twin.facpv, A=window.__twin.abk;
if(ST&&R28&&L28){
window.__twin.clean=true;
// ---------- стан: лише наш об'єкт, дах В1, ліхтарі без демонтажу (модулі на склі), фасади
state.proj='ours'; if(!['pz','sun'].includes(state.sec)) state.sec='pz';
Object.assign(state.lay,{r28:'1',l28:true,l28v:'v2',l28s:2,fac25:true,rad:false,sunPlain:false,sunYear:false});
// ---------- інтерфейс: без Вінниці, невідповідностей, фото; два розділи
const hide=el=>{ if(el) el.style.display='none'; };
hide($('#proj')); hide($('#misChip')); hide($('#fotoChip'));
['ridge','wh','node'].forEach(c=>hide($(`#cams button[data-c="${c}"]`)));
{ const h=document.querySelector('header h1'); if(h) h.innerHTML='Антарес · СЕС і накопичувачі<small>АБК і цех · два етапи</small>'; document.title='Антарес · весь об\'єкт'; }
document.querySelectorAll('#tabs button').forEach(b=>{ if(!['pz','sun'].includes(b.dataset.s)) hide(b); else if(b.dataset.s==='pz') b.textContent='Об\'єкт'; });
ONSECS.splice(0,ONSECS.length,'pz','sun');
{ const fc=$('#fotoChip'); if(fc&&fc.getAttribute('aria-pressed')==='true') fc.click(); }
// ---------- один колір: модулі «на освітлення» — як решта
{ const V=R28.VG['1']; if(V){ const ims=V.children.filter(o=>o.userData.part==='roof'); if(ims.length>1){ const m0=Array.isArray(ims[0].material)?ims[0].material.map(x=>x.clone()):ims[0].material.clone(); ims.slice(1).forEach(o=>o.material=m0); } }   // окрема копія: у r128 один матеріал на InstancedMesh з instanceColor і без нього ламає рендер
  const MT=L28.MT; if(MT&&MT.mModL&&MT.mMod){ MT.mModL.color.copy(MT.mMod.color); if(MT.mMod.map) MT.mModL.map=MT.mMod.map; MT.mModL.needsUpdate=true; } }
genPaint=function(){ WHI.forEach((w,i)=>w.im.material=WHMAT[i]); };
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
const SETS={};
function buildSets(){ const V=R28.VG['1'], roofIm=V?V.children.filter(o=>o.userData.part==='roof')[0]:null;
  SETS.roof={kind:'roof',cfg:MCFG.ours,g:geomsOf(roofIm)};
  const lan=[]; L28.LG28.forEach(q=>{ const g=q.v2m&&q.v2m['1']; if(g) g.traverse(o=>{ if(o.isInstancedMesh){ const m=Array.isArray(o.material)?o.material:[o.material]; if(m.includes(L28.MT.mModL)&&!m.includes(L28.MT.mMod)) return; lan.push(...geomsOf(o)); } }); });
  SETS.lan={kind:'roof',cfg:MCFG.ours,g:lan};
  SETS.fac={kind:'fac',cfg:MCFG.whours,g:FP?[FP.pvL,FP.pvP,FP.pc].flatMap(geomsOf):[]};
  SETS.wh={kind:'wh',cfg:MCFG.whours,g:GEN.wh};
  Object.values(SETS).forEach(S=>S.f=new Float32Array(S.g.length)); }
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
  ['ab','fac','lan','wh','roof'].forEach(k=>out.g[k]={Pc:0,Pa:0,n:0,sh:0,on:inStage(k)});
  if(st){ const d=[st[1],st[2],st[3]]; out.alt=Math.asin(st[3]);
    ['fac','lan','wh','roof'].forEach(k=>{ const S=SETS[k], G=out.g[k]; if(!G.on) return;
      S.g.forEach((g,i)=>{ S.f[i]=dot3(d,g.n)>0?litC(g,S.kind,d):0; });
      const r=powerStep(S.g,S.f,st,W_,S.cfg); G.Pc=r.Pc; G.Pa=W_.p*r.Pc+(1-W_.p)*r.Po; G.n=S.g.length; G.sh=r.n[1]+r.n[2]+r.n[3]; });
    if(A&&out.g.ab.on){ const rr=A.evaluate(DOY[state.day],solarT(),false), G=out.g.ab, k0=out.g.fac.Pc>0?out.g.fac.Pa/out.g.fac.Pc:W_.p;
      G.Pc=rr.all.p; G.Pa=rr.all.p*k0; G.n=rr.all.n; G.sh=rr.all.n-rr.all.sun; } }
  else ['fac','lan','wh','roof'].forEach(k=>{ out.g[k].n=SETS[k].g.length; });
  if(!st&&A) out.g.ab.n=A.MODS.length;
  Object.values(out.g).forEach(G=>{ if(G.on){ out.Pc+=G.Pc; out.Pa+=G.Pa; } });
  NOW=out; nowKey=state.day+'|'+Math.round(state.hour*6)+'|'+state.lay.stg; }
function solarT(){ const dd=DAYS[state.day], n=DOY[state.day], off=kyivOffset(2026,dd[1],dd[2]), B=2*Math.PI*(n-81)/364, eot=9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B); return state.hour-off+LON/15+eot/60; }
// не частіше ніж раз на 150 мс (повзунок, ▶)
genRefresh=function(){ const key=state.day+'|'+Math.round(state.hour*6)+'|'+state.lay.stg; if(key===nowKey&&NOW){ sunUI(); panelNow(); return; }
  if(job) return; job=setTimeout(()=>{ job=null; compute(); sunUI(); panelNow(); need=true; },NOW?150:0); };
genPanelUpdate=function(){};
// ---------- рядок унизу
const kn=v=>nf(v,0);
sunUI=(f=>function(){ f.apply(this,arguments); const el=$('#now'); if(!el) return; const S=ST.sums(), stg=state.lay.stg, x=stg==='1'?S.s1:stg==='2'?S.s2:S.all;
  const nm=stg==='1'?'Етап 1':stg==='2'?'Етап 2 · дах':'Весь об\'єкт', sun=(el.innerHTML.match(/<span class="sun">.*?<\/span>/)||[''])[0];
  const now=NOW&&NOW.alt>0?`<span>зараз <b class="num">${kn(NOW.Pc)} кВт</b> ясно · ${kn(NOW.Pa)} кВт сер.</span>`:'';
  el.innerHTML=`<span class="who ours">${nm}</span>${sun}${now}<span><b class="num">${nf(x.st)}</b> модулів · ${nf(x.kwp,0)} кВтп · за рік <b class="num">≈${nf(x.mwh,0)} МВт·год</b></span>`; })(sunUI);
// ---------- над моделлю: лише етапи; легенда — один рядок
hudCtx=(f=>function(){ f.apply(this,arguments); const m=$('#modes'); if(!m) return; const S=ST.sums(), stg=state.lay.stg;
  m.innerHTML=''; [['1',`Етап 1 · ${nf(S.s1.st)}`],['2',`Етап 2 · дах · ${nf(S.s2.st)}`],['all',`Весь об'єкт · ${nf(S.all.st)}`]].forEach(([v,t])=>{ const b=document.createElement('button'); b.type='button'; b.textContent=t; b.setAttribute('aria-pressed',String(stg===v)); b.onclick=()=>ST.setStage(v); m.appendChild(b); });
  m.hidden=false; const bar=$('#l28bar'); if(bar) bar.hidden=true;
  const l=$('#legend'); if(l&&state.sec==='sun'){ l.innerHTML=`<span class="t">Тіні — справжні, від сонця на вибраний час</span><span>▶ — день по 10 хв</span>`; l.hidden=false; l.classList.remove('min'); } })(hudCtx);
// ---------- розділ «Сонце і генерація»
const MOS=['весна (21.03)','літо (21.06)','осінь (23.09)','зима (21.12)'];
function rowsNow(){ if(!NOW) return ''; const S=ST.sums(), Y={ab:S.ab,fac:S.fac,lan:S.lan,wh:S.wh,roof:S.roof};
  return ['ab','fac','lan','wh','roof'].filter(k=>NOW.g[k].on).map(k=>{ const G=NOW.g[k];
    return `<tr><td>${NAMES[k]}</td><td>${nf(Y[k].st)}</td><td id="gn_${k}">${NOW.alt>0?`<b>${kn(G.Pc)}</b> / ${kn(G.Pa)}`:'—'}</td><td id="gs_${k}">${NOW.alt>0?nf(G.sh):'—'}</td><td>${nf(Y[k].mwh,1)}</td></tr>`; }).join(''); }
function panelNow(){ const tb=document.getElementById('gNowBody'); if(tb) tb.innerHTML=rowsNow(); const t=document.getElementById('gNowTot'); if(t&&NOW) t.innerHTML=NOW.alt>0?`<b>${kn(NOW.Pc)}</b> / ${kn(NOW.Pa)}`:'—'; const h=document.getElementById('gNowH'); if(h) h.textContent=`${hhmm(state.hour)} · ${MOS[state.day]}`; }
panelSun=function(){ if(!NOW) compute(); const S=ST.sums(), stg=state.lay.stg, x=stg==='1'?S.s1:stg==='2'?S.s2:S.all, nm=stg==='1'?'Етап 1':stg==='2'?'Етап 2 · дах':'Весь об\'єкт';
  return `<div class="ph"><span class="eyebrow ours">Сонце і генерація · ${nm}</span><h2>за рік ≈${nf(x.mwh,0)} МВт·год · ${nf(x.kwp,0)} кВтп</h2>
  <p>Тягніть час або натисніть ▶ — сонце йде по дню, тіні на модулях справжні. Потужність «зараз» рахується для кожного модуля з його тінню; пора року — кнопка поруч із часом.</p></div>
  <table class="cmp"><thead><tr><th>Група</th><th>Модулів</th><th>Зараз, кВт<br><small>ясно / сер.</small></th><th>У тіні</th><th>МВт·год за рік</th></tr></thead>
  <tbody id="gNowBody">${rowsNow()}</tbody><tbody><tr class="tot"><td>Разом <small id="gNowH">${hhmm(state.hour)} · ${MOS[state.day]}</small></td><td>${nf(x.st)}</td><td id="gNowTot">${NOW&&NOW.alt>0?`<b>${kn(NOW.Pc)}</b> / ${kn(NOW.Pa)}`:'—'}</td><td></td><td><b>${nf(x.mwh,1)}</b></td></tr></tbody></table>
  <p class="src">«Зараз»: Meteonorm 8.1, ясне небо і середня погода цього дня; тінь — від ліхтарів (лишаються, гребінь 1,89 м), труб даху, сусідніх будівель, АБК і ТП; без втрат від різної освітленості в стрінгах і без затінення модуль на модуль. АБК — модель K1 АБК (з байпас-діодами). «За рік» — розрахунки розкладок: АБК (ДБН 28.10), фасади (fac_v2), ліхтарі (28.10, скло), склад (26.10), дах (28.10 В1 — ще без тіні від ліхтарів, що лишаються).</p>`; };
// ---------- один колір і для АБК: модулі всіх орієнтацій — той самий матеріал, що на цеху (раніше — свій колір на кожну орієнтацію)
if(A){ const PVA=MAT.pvP.clone(); A.MODS.forEach(r=>{ if(!r.mesh) return; r.mesh.material=PVA; r.mesh.userData.face0=PVA; r.mesh.userData.base=PVA; }); }
// проходи й відступи на даху — без кольорових смуг (порожня покрівля)
setVis=(f=>function(){ f.apply(this,arguments); const V=R28.VG['1']; if(V) V.children.forEach(o=>{ if(o.userData.part==='zone') o.visible=false; }); })(setVis);
// ---------- натискання на модуль: підсумок його групи, етапу і всього об'єкта
const STGN={ab:'етап 1',fac:'етап 1',lan:'етап 1',wh:'етап 1',roof:'етап 2'};
function grpInfo(k){ const S=ST.sums(), Y=S[k], G=NOW&&NOW.g[k], E=k==='roof'?S.s2:S.s1, T=FP&&FP.T;
  const now=G&&G.on&&NOW.alt>0?` Зараз (${hhmm(state.hour)}, ${SEASN[state.day].toLowerCase()}): ${kn(G.Pc)} кВт ясно · ${kn(G.Pa)} кВт сер.`:'';
  const det=k==='fac'&&T?` Південь — ${T.S.n} вертикально; схід — козирок 25° ${T.Ec.n} + вертикально ${T.Ev.n}.`:k==='lan'?' 4 ліхтарі без демонтажу, модулі поверх скління (≈41°).':k==='roof'?' Дах В1 на новій мембрані, без місць на ліхтарях.':k==='ab'?' Дах, надбудова і стіни АБК за ДБН, інвертор Deye 100 кВт.':' Модулі на скатах профнастилу.';
  return {t:`${NAMES[k]} · ${STGN[k]}`, d:`${nf(Y.st)} модулів${Y.lit?` (+${Y.lit} на освітлення)`:''} · ${nf(Y.kwp,1)} кВтп · за рік ≈${nf(Y.mwh,1)} МВт·год.${det}${now} ${k==='roof'?'Етап 2':'Етап 1'} разом: ${nf(E.st)} модулів · ${nf(E.kwp,0)} кВтп · ≈${nf(E.mwh,0)} МВт·год. Весь об'єкт: ${nf(S.all.st)} модулів · ${nf(S.all.kwp,0)} кВтп · ≈${nf(S.all.mwh,0)} МВт·год за рік.`}; }
{ const set=(o,k)=>{ if(o) o.userData.info=()=>grpInfo(k); };
  const V=R28.VG['1']; if(V) V.children.forEach(o=>{ if(o.userData.part==='roof') set(o,'roof'); });
  L28.LG28.forEach(q=>{ const g=q.v2m&&q.v2m['1']; if(g) g.traverse(o=>{ if(o.isInstancedMesh) set(o,'lan'); }); });
  if(FP) [FP.pvL,FP.pvP,FP.pc].forEach(o=>set(o,'fac'));
  WHI.forEach(w=>set(w.im,'wh'));
  if(A) A.MODS.forEach(r=>set(r.mesh,'ab')); }
// ---------- «Об'єкт»: структурована аналітика замість старих звітів (порівняння з Вінницею, В1 / В2, покриття ліхтарів)
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
ul.open{margin:0;padding-left:18px;color:var(--ink-2);font-size:12.5px;display:flex;flex-direction:column;gap:3px}`; document.head.appendChild(st); }
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
  <tr><td class="w">ТП-5913 · К-3, К-1<span class="stg">LES-H20 на МС-3, МС-1 біля східного фасаду; входи PV — фасади і склад (441,7 кВтп), етап 2 — схід даху</span></td><td>1 000</td><td>2 410</td></tr>
  <tr><td class="w">ТП-6923 · К-4, К-5<span class="stg">LES-H20 з півночі від ТП-6923, на бермі +1,8 м за приямком (за позначкою 04.11); входи PV — ліхтарі (216,8 кВтп), етап 2 — захід даху</span></td><td>1 000</td><td>2 410</td></tr>
  <tr class="tot"><td class="w">Цех · 4 контейнери</td><td>2 000</td><td>4 820</td></tr>
  <tr><td class="w">АБК · окремо<span class="stg">LES-241L120-PSC (із зарядкою авто) або LES-241L120-PS (гібрид); місце уточнюється</span></td><td>120</td><td>241</td></tr></tbody></table>
  <p class="src">Ємність остаточно — за погодинними даними АСКОЕ від ДТЕК (запит надіслано через ТОВ МК «АНТАРЕС»).</p></div>
  <div class="blk"><h3>Що ще відкрито</h3><ul class="open"><li>Тінь від ліхтарів, що лишаються, на модулі даху етапу 2 — річну генерацію перерахувати.</li><li>К-4, К-5 з півночі від ТП-6923 на бермі +1,8 м: огородження по краю стінки, під’їзд крана (з проїзду чи з в’їзду на півночі), паркан не міряно; відстані до ТП, жалюзі й шафи з пропаном — перевірити.</li><li>Накопичувач АБК: варіант (із зарядкою чи без) і місце біля АБК; панелі АБК — на MPPT гібрида замість Deye.</li><li>Розподіл стрінгів даху між парами контейнерів.</li><li>Ємність накопичувачів — після даних ДТЕК.</li></ul></div>`; };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('.kpi[data-stg]'); if(b) ST.setStage(b.dataset.stg); });
// ---------- старі підказки: без В2 і без старого варіанта Б з 3 контейнерами
scene.traverse(o=>{ const u=o.userData&&o.userData.info; if(u&&typeof u==='object'&&typeof u.d==='string'&&/\(В2\)/.test(u.d)) u.d=u.d.replace(/\s*або\s*[\d,]+\s*м\s*\(В2\)/g,''); });
if(BS) ESS.forEach(o=>{ if(!o.isGroup||!o.children.length) return; const body=o.children[0], u=body.userData&&body.userData.info; if(!u||typeof u!=='object'||!/^K-[13] /.test(u.t||'')) return; const id=u.t.slice(0,3);
  body.userData.info={t:`${id} · Golen LES-H20-1205W500C-PS · ТП-5913`,d:`АКБ 1 205 кВт·год, PCS 500 кВт, 12 входів PV по 60 кВт. Пара К-3 + К-1: етап 1 — фасади і склад (55 стрінгів, 441,7 кВтп), етап 2 — східна половина даху. Майданчик ${id==='K-3'?'МС-3':'МС-1'} біля східного фасаду, торець PCS — 3,0 м від стіни.`}; });
// ---------- старт
window.__twin.cleanDbg={SETS,litC,obstacles,compute,get NOW(){return NOW;}};
buildSets(); apply();
}
}
