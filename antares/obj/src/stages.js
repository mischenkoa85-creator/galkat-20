// ================= Весь об'єкт: АБК за ДБН + цех, два етапи будівництва — src/stages.js (вставляється після lan28.js)
// АБК — модуль antares/abk/dbn/abk_model.js з даними ABK_DATA (abk/dbn/build.py): ті самі координати й three r128, див. abk/dbn/ZBIRKA.md.
// Етап 1: АБК (132 модулі), фасади цеху (південь вертикально; схід — лише верхній ряд козирком 25°, вертикальні прибрано 06.11, facpv.js),
//         ліхтарі без демонтажу — модулі поверх скління (lan28.js, варіант «2»), УЗЕ.
// Етап 2: дах цеху на новій мембрані — розкладка 28.10 В1 / В2 (roof28.js) без місць на ліхтарях.
{ const R28=window.__twin.r28, L28=window.__twin.lan28, FP=window.__twin.facpv;
let A=null;
if(typeof ABKModel!=='undefined'&&typeof ABK_DATA!=='undefined'){
  if(typeof ABK_DC!=='undefined') ABK_DATA.dbn=ABK_DC;              // 05.11: АБК без інвертора — 12 стрінгів по 11, щити ЩА-1 / ЩА-2 → К-3 / К-1 (calc/v3/abk_dc.py)
  A=ABKModel(THREE,ABK_DATA,{ground:false,ctx:true});
  if(typeof ABK_DC!=='undefined'){ ['inv','ac','shch','meter'].forEach(t=>(A.TAGS[t]||[]).forEach(o=>{ o.visible=false; o.userData.hideDC=true; if(o.parent) o.parent.remove(o); }));   // Deye, СІП, щит у ТП, лічильник — не потрібні
    A.root.traverse(o=>{ if(o.isLine&&o.userData.info&&/RS485/.test(JSON.stringify(o.userData.info))) o.visible=false; });
    for(let i=A.LB.length-1;i>=0;i--){ const t=(A.LB[i].t&&A.LB[i].t.uk)||''; if(/Інвертор|СІП|Щит СЕС|Вступний щит|ПЗІП DC і AC/.test(t)) A.LB.splice(i,1); } }
  A.root.name='abk'; scene.add(A.root);
  A.groups.ctx.visible=false;                                       // край цеху і ТП-5913 моделі АБК — лише для тіні на АБК (у двійнику вони свої)
  A.picks.forEach(o=>{ const inf=o.userData.info; if(!inf||typeof inf==='function') return; const [t,d]=Array.isArray(inf)?inf:(inf.uk||inf.en);
    o.userData.info=()=>{ const r=o.userData.rec; let x=''; if(r&&r.d){ const s=(ABK_DATA.dbn.strings||[]).find(q=>q.k===r.k);
        x=` Стрінг S${r.k}${s?` · ${typeof ABK_DC!=='undefined'?'щит ЩА-'+s.mppt+' → '+(s.mppt===1?'К-3':'К-1'):'MPPT '+s.mppt} · ${r.d.ord}-й з ${s.n}`:''} · за рік ≈${nf(r.d.kwh)} кВт·год.`; }
      return {t:'АБК · '+t,d:(d||'')+x}; };
    PICK.push({o}); });
  window.__twin.abk=A;
}
// ---------- етап: '1' | '2' | 'all'
if(!['1','2','all'].includes(state.lay.stg)) state.lay.stg='all';
const STG=()=>state.lay.stg, ON=()=>state.proj==='ours'&&!!(R28&&R28.ON());
const in1=()=>STG()!=='2', in2=()=>STG()!=='1';
// ---------- підсумки етапів
const MP=0.73;
const WHN0=typeof ELECWA!=='undefined'&&ELECWA.whn?ELECWA.whn:null;   // 06.11: + північні скати (опція етапу 1)
const WH={n:176+(WHN0?WHN0.n:0),mwh:148.7+(WHN0?WHN0.mwh:0)};   // склад, наше рішення: 176 модулів (16 стрінгів), 148,7 МВт·год — економічний ефект 26.10 (модель 25.10, пропорційно від 180)
function sums(){ const k=state.lay.r28&&R28.D.V[state.lay.r28]?state.lay.r28:'1', V=R28.D.V[k];
  const fr=V.frame, frS=fr.filter(m=>m[5]>=0), frMWh=V.sum.frame.mwh;
  const roof={n:V.sum.all-fr.length, st:V.sum.st.n-frS.length, lit:V.sum.lit.n-(fr.length-frS.length), mwh:V.sum.st.mwh-frMWh};
  roof.kwp=roof.st*MP;
  let lan={n:fr.length,st:frS.length,lit:fr.length-frS.length,kwp:frS.length*MP,mwh:frMWh};
  if(L28&&L28.K28){ const v0=state.lay.l28v; state.lay.l28v='v2'; const K=L28.K28(); state.lay.l28v=v0; lan={n:K.n,st:K.st,lit:K.lit,kwp:K.kw,mwh:K.gen/1000}; }
  const T=FP?FP.T:null, fac=T?{n:T.all.n,st:T.all.n,lit:0,kwp:T.all.n*MP,mwh:T.all.kwh/1000}:{n:0,st:0,lit:0,kwp:0,mwh:0};
  const ab=A?{n:ABK_DATA.dbn.n,st:ABK_DATA.dbn.n,lit:0,kwp:ABK_DATA.dbn.kwp,mwh:ABK_DATA.dbn.mwh}:{n:0,st:0,lit:0,kwp:0,mwh:0};
  const add=(...a)=>a.reduce((s,x)=>({n:s.n+x.n,st:s.st+x.st,lit:s.lit+x.lit,kwp:s.kwp+x.kwp,mwh:s.mwh+x.mwh}),{n:0,st:0,lit:0,kwp:0,mwh:0});
  const wh={n:WH.n,st:WH.n,lit:0,kwp:WH.n*MP,mwh:WH.mwh};
  const s1=add(ab,fac,lan,wh), s2=roof;
  return {k,ab,fac,lan,wh,roof,s1,s2,all:add(s1,s2)}; }
// ---------- накопичувачі етапу 1: по 2 контейнери на кожну ТП (рішення власника 03.11, 23:15)
const NK={}; let K2=[];
if(BS){ const k2=BS.K.find(k=>k.id==='K-2'); if(k2){ const cx=(k2.box[0]+k2.box[1])/2, cy=(k2.box[2]+k2.box[3])/2; K2=ESS.filter(o=>o.parent===G.oursBase&&Math.abs(o.position.x-cx)<0.6&&Math.abs(-o.position.z-cy)<0.6); }   // К-2 (МС-2) у варіанті «по 2 на ТП» не ставиться
  KCOL['K-4']=0x7b5bd6; KCOL['K-5']=0x1aa3b4;
  // місце — за позначкою власника 04.11 (03:08): на північ від ТП-6923, за приямком, на бермі +1,8 м (стінка 1,8 м — 03:37); дверима на північ (від ТП), AC — по стінці вниз, через приямок у північну стіну ТП
  const g=grp('stgESS',G.ours), Y0=110.4, LL=6.058, WW=2.438, HB=1.8;
  [['K-4',1.2],['K-5',9.0]].forEach(([id,x0])=>{ const k={id,box:[x0,x0+LL,Y0,Y0+WW],lines:0,kwp:0,ac_len:0}, cx=x0+LL/2, cy=Y0+WW/2, xa=x0+LL-0.6;
    const pl=box(LL+2,0.04,WW+2,UZM.plat,cx,HB+0.02,-cy,g); pl.castShadow=false; box(LL+1,0.25,WW+1,MAT.slab,cx,HB+0.175,-cy,g);
    const c=golenH20(k); c.rotation.y=Math.PI; c.position.y+=HB; g.add(c); const body=c.children[0];
    body.userData.info={t:`${id} · Golen LES-H20-1205W500C-PS · ТП-6923, з півночі`,d:`АКБ 1 205 кВт·год, PCS 500 кВт, 12 входів PV по 60 кВт. Етап 1 — без панелей: лише мережа, заряд і розряд (активний споживач); етап 2 — західна половина даху (20 щитів). Місце — за позначкою 04.11: на бермі за приямком ТП-6923, на +1,8 м над проїздом (підпірна стінка 1,8 м), ${nf(Y0-107.1,1)} м від північної стіни ТП і ${nf(Y0-109.2,1)} м від краю стінки; дверима на північ; між К-4 і К-5 — ${nf(9.0-1.2-LL,1)} м. По краю стінки — огородження. Доставка — краном з проїзду (перепад 1,8 м) або з боку в’їзду на півночі — перевірити. Відстані до ТП, до жалюзі камер і до шафи з пропаном біля СХ кута — перевірити. AC — по стінці вниз, через приямок у північну стіну ТП-6923 (≈${nf(Y0-107.1+HB+1,0)} м до стіни). Етап 1: входи PV — ліхтарі (27 стрінгів, 216,8 кВтп), етап 2 — західна половина даху.`};
    const lb=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex([`${id} · ТП-6923 · з півночі`,'500 кВт · 1 205 кВт·год'],512,128,'#'+new THREE.Color(KCOL[id]).getHexString()),depthTest:false,transparent:true}));
    lb.scale.set(0.13,0.0325,1); lb.material.sizeAttenuation=false; lb.position.copy(W(cx,cy,HB+4.6)); lb.renderOrder=18; g.add(lb);
    const ac=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([W(xa,Y0+0.3,HB+0.36),W(xa,Y0-0.4,HB+0.08),W(xa,109.4,HB+0.08),W(xa,109.25,HB-0.05),W(xa,108.85,HB-0.3),W(xa,108.84,0.25),W(xa,108.6,0.08),W(xa,107.4,0.08),W(xa,107.18,0.4),W(xa,107.16,0.9)],false,'catmullrom',0.02),24,0.07,8,false),new THREE.MeshStandardMaterial({color:lin(0xc0392b),roughness:0.5}));
    ac.castShadow=false; g.add(ac); ac.userData.info={t:`Лінія AC ${id} — ТП-6923`,d:'Переріз — за вимогою Golen, як у ліній до ТП-5913 (ВВГнг 3 × (6 × 1×120) + N + PE). Траса: по бермі, по підпірній стінці вниз на 1,8 м, по дну приямку, вводом у північну стіну ТП; де всередині щит 0,4 кВ — уточнити.'}; PICK.push({o:ac}); PICK.push({o:body}); NK[id]=c; });
  NK.g=g; }
// ---------- видимість
const ABK_SEC={arch:1,low:1,wall:1,nad:1,xm:1,mount:s=>s!=='bz',elec:s=>s==='pz'||s==='ep'||s==='bud',str:s=>s==='ep',lps:s=>s==='bz',safety:s=>s==='pz'||s==='km'||s==='bud'};
function abkVis(){ if(!A) return; const s=effSec(), on=state.proj==='ours'&&(!ON()||in1());
  Object.entries(ABK_SEC).forEach(([k,f])=>{ if(A.groups[k]) A.groups[k].visible=on&&(f===1||f(s)); }); }
const svS=setVis; setVis=function(){ svS.apply(this,arguments); abkVis(); if(!ON()) return;
  const g=R28.VG[state.lay.r28]; if(g) g.children.forEach(o=>{ if(o.userData.part==='roof'||o.userData.part==='zone') o.visible=in2(); });
  if(L28&&L28.LG28){ const k=state.lay.r28; L28.LG28.forEach(q=>{ if(q.v2m&&q.v2m[k]){ q.v2m[k].visible=q.v2m[k].visible&&in1(); q.v2r[k].visible=q.v2r[k].visible&&in1(); } }); }
  if(FP&&FP.FG) FP.FG.visible=FP.FG.visible&&in1();
  if(G.uze) G.uze.visible=G.uze.visible&&in1();
  WHI.forEach(w=>{ w.im.visible=in1(); });                          // склад — етап 1
  K2.forEach(o=>o.visible=false); if(NK.g) NK.g.visible=true; };
// поза режимом етапів — як було: 3 контейнери на МС-1…МС-3, без К-4 / К-5
const svK=setVis; setVis=function(){ svK.apply(this,arguments); if(ON()) return; K2.forEach(o=>o.visible=true); if(NK.g) NK.g.visible=false; WHI.forEach(w=>{ w.im.visible=true; }); };
// перемикання етапу: ліхтарі — без демонтажу (варіант «2 · модулі на склі», етап «готово»), фасади увімкнено
function setStage(v){ state.lay.stg=v; state.lay.l28=true; state.lay.l28v='v2'; state.lay.l28s=2; state.lay.fac25=true; if(!state.lay.r28) state.lay.r28='1'; apply(); save(); }
const hudS=hudCtx; hudCtx=function(){ hudS.apply(this,arguments); if(!ON()||state.sec!=='pz') return;
  const m=$('#modes'); if(!m) return; const S=sums();
  const add=(key,t,on,fn,ttl)=>{ const b=document.createElement('button'); b.type='button'; b.dataset.m=key; b.textContent=t; if(ttl) b.title=ttl; b.setAttribute('aria-pressed',String(!!on)); b.onclick=fn; m.insertBefore(b,m.firstChild); };
  add('stgA',`Весь об'єкт · ${nf(S.all.n)}`,STG()==='all',()=>setStage('all'));
  add('stg2',`Етап 2 · дах · ${nf(S.s2.n)}`,STG()==='2',()=>setStage('2'),'Покрівля цеху на новій мембрані');
  add('stg1',`Етап 1 · ${nf(S.s1.n)}`,STG()==='1',()=>setStage('1'),'АБК, фасади цеху (південь, схід), ліхтарі без демонтажу, УЗЕ');
  m.hidden=false;
  // у режимі етапів: ряд покриттів ліхтарів не потрібен (ліхтарі без демонтажу, модулі на склі), легенда — коротка, за етапом
  const bar=$('#l28bar'); if(bar) bar.hidden=true;
  const l=$('#legend'); if(l){ const x=STG()==='1'?S.s1:STG()==='2'?S.s2:S.all, sw=(c,t)=>`<span><i class="sw" style="background:${c}"></i>${t}</span>`;
    const nm=STG()==='1'?'Етап 1':STG()==='2'?'Етап 2 · дах':'Весь об\'єкт';
    const p1=`<span>АБК ${S.ab.n} · фасади ${S.fac.n} · ліхтарі ${S.lan.n-S.lan.lit} · склад ${S.wh.n}</span>${sw('#e8b23a',`на освітлення (${S.lan.lit})`)}<span>контейнери: К-3, К-1 — ТП-5913; К-4, К-5 — ТП-6923, з півночі</span>`;
    const p2=`<span>дах В1: ${nf(S.roof.st)} у стрінгах</span>${sw('#e8b23a',`на освітлення (${S.roof.lit})`)}${sw('#2e8b57','прохід')}${sw('#8cc98c','відступ')}${sw('#4a4f53','труби')}${sw('#2a78d6','лівневки')}`;
    l.innerHTML=`<span class="t">${nm} · ${nf(x.st)} модулів · ${nf(x.kwp,0)} кВтп · ≈${nf(x.mwh,0)} МВт·год</span>`+(STG()==='1'?p1:STG()==='2'?p2:`<span>етап 1: ${nf(S.s1.st)}</span><span>етап 2: ${nf(S.s2.st)}</span>${sw('#e8b23a',`на освітлення (${S.all.lit})`)}`);
    l.hidden=false; }
  };
// ---------- легенда згортається (усі розділи): видно перший рядок і кнопку; на телефоні — згорнута, поки не розгорнути
if(state.lay.legOpen===undefined) state.lay.legOpen=window.innerWidth>=700;
const hudL=hudCtx; hudCtx=function(){ hudL.apply(this,arguments); const l=$('#legend'); if(!l||l.hidden||!l.children.length) return;
  if(l.children.length<2){ l.classList.remove('min'); return; }
  const open=!!state.lay.legOpen, b=document.createElement('button'); b.type='button'; b.className='lgx'; b.textContent=open?'▴ менше':'▾ ще'; b.setAttribute('aria-expanded',String(open)); b.title=open?'Згорнути легенду':'Розгорнути легенду';
  b.onclick=e=>{ e.stopPropagation(); state.lay.legOpen=!state.lay.legOpen; hudCtx(); save(); }; l.insertBefore(b,l.children[1]); l.classList.toggle('min',!open); };
// ---------- панель «Загальне»: склад етапів
const row=(t,x,cls)=>`<tr class="${cls||''}"><td>${t}</td><td>${nf(x.n)}${x.lit?` <small>(${x.lit} на освітлення)</small>`:''}</td><td>${nf(x.kwp,1)}</td><td>${nf(x.mwh,1)}</td></tr>`;
const pzS=panelPZ; panelPZ=function(){ const h=pzS.apply(this,arguments); if(!ON()) return h; const S=sums(), VN={'1':'В1 · з проходами','2':'В2 · максимальний'}, c=q=>STG()===q?' class="cur"':'';
  return `<div class="ph"><span class="eyebrow ours">Весь об'єкт · АБК і цех · два етапи</span><h2>${nf(S.all.n)} модулів · ${nf(S.all.kwp,0)} кВтп · ≈${nf(S.all.mwh,0)} МВт·год за рік</h2>
  <p>Етап 1 — те, що можна ставити зараз: АБК за ДБН, фасади цеху і ліхтарі без демонтажу (модулі поверх скління), накопичувачі. Етап 2 — покрівля цеху, коли покладуть нову мембрану.</p></div>
  <table class="cmp"><thead><tr><th></th><th>Модулів</th><th>кВтп</th><th>МВт·год за рік</th></tr></thead><tbody>
  <tr${c('1')}><td colspan="4"><b>Етап 1</b> <button type="button" class="lnk stgtg" data-t="1">показати</button></td></tr>
  ${row('АБК — дах, надбудова, стіни (ДБН)',S.ab)}${row('Фасади цеху: південь вертикально, схід — козирок 25° під парапетом',S.fac)}${row('Ліхтарі без демонтажу — модулі поверх скління',S.lan)}${row('Склад — модулі на скатах',S.wh)}
  ${row('Разом етап 1',S.s1,'tot')}
  <tr${c('2')}><td colspan="4"><b>Етап 2</b> <button type="button" class="lnk stgtg" data-t="2">показати</button></td></tr>
  ${row(`Дах цеху на новій мембрані · розкладка 28.10 ${VN[S.k]} без місць на ліхтарях`,S.roof)}
  ${row('Весь об\'єкт',S.all,'tot')}</tbody></table>
  <p class="src">кВтп і МВт·год — модулі у стрінгах (жовті «на освітлення» — окремо). АБК — розрахунок ДБН 28.10 (модель K1), 12 стрінгів по 11 у К-3 / К-1 (05.11); фасади — висота будівлі за розрізом 1-1; ліхтарі — місця розкладки 28.10 на склінні 41–46°, опромінення площини (lan28); дах — розкладка 28.10 мінус каркаси ліхтарів. Тінь від ліхтарів, що лишаються, на модулі даху етапу 2 ще не перерахована (у розкладці 28.10 — каркаси 13° на бортику 0,30 м, нижчі за скління). Склад — 176 модулів, 148,7 МВт·год (економічний ефект 26.10).</p>
  <div class="blk"><h3>Накопичувачі — етап 1: по 2 контейнери на кожну ТП</h3><p class="src">4 × Golen LES-H20-1205W500C-PS = 2 000 кВт / 4 820 кВт·год. <b>ТП-5913</b> — К-3 і К-1 на майданчиках МС-3, МС-1 біля східного фасаду (як у нашому рішенні); входи PV етапу 1 — фасади, склад, ліхтарі і АБК (94 стрінги, 754,8 кВтп), на етапі 2 — ще 8 щитів сходу даху. <b>ТП-6923</b> — К-4 і К-5 з півночі від ТП, на бермі за приямком, на +1,8 м над проїздом (місце — за позначкою 04.11; паркан, під’їзд крана і відстані ще не перевіряли); на етапі 1 — без панелей, лише мережа (заряд і розряд), на етапі 2 — західна половина даху (20 щитів). На пару контейнерів — 24 входи по 60 кВт (до 1 440 кВт). Для АБК — окремий накопичувач, 2 варіанти: Golen LES-241L120-PSC (із зарядкою авто) або LES-241L120-PS (гібрид); у модель — після вибору місця.</p></div>`+h; };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('.stgtg'); if(b) setStage(b.dataset.t); });
// ---------- рядок унизу
const suS=sunUI; sunUI=function(){ suS.apply(this,arguments); if(!ON()||state.sec==='sun') return; const el=$('#now'); if(!el) return; const S=sums(), x=STG()==='1'?S.s1:STG()==='2'?S.s2:S.all;
  const nm=STG()==='1'?'Етап 1 · АБК, фасади, ліхтарі':STG()==='2'?'Етап 2 · дах цеху':'Весь об\'єкт · етапи 1 + 2', sun=(el.innerHTML.match(/<span class="sun">.*?<\/span>/)||[''])[0];
  el.innerHTML=`<span class="who ours">${nm}</span>${sun}<span><b class="num">${nf(x.n)}</b> модулів · ${nf(x.kwp,0)} кВтп</span><span>за рік <b class="num">≈${nf(x.mwh,0)} МВт·год</b></span>`; };
// ---------- АБК у «Сонці»: стан кожного модуля (модель K1 АБК) за сонячним часом дня й години двійника
function solarT(){ const dd=DAYS[state.day], n=DOY[state.day], off=kyivOffset(2026,dd[1],dd[2]), B=2*Math.PI*(n-81)/364, eot=9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);
  return state.hour-off+LON/15+eot/60; }
function abkSun(){ if(!A||window.__twin.clean) return; // у чистій збірці колір АБК веде лише statusPaint (clean.js) — інакше кожен крок сонця скидав колір і модулі блимали
  const on=!window.__twin.clean&&effSec()==='sun'&&state.proj==='ours'&&!state.lay.sunPlain&&(!ON()||in1());
  if(on){ const r=A.evaluate(DOY[state.day],solarT(),true); A.paintStatus(r); } else A.paintStatus(null); need=true; }
const psS=placeSun; placeSun=function(){ psS.apply(this,arguments); abkSun(); };
// ---------- вид «Контейнери»: з АБК у моделі стара точка (над дахом АБК) закрита — дивимось з північного сходу; вид на К-4 / К-5
VIEWS.ess.p=[136,30,-58]; VIEWS.ess.c=[100,1,-66];
// К-4 / К-5 з півночі від ТП-6923 разом із воротами КТП на сході; на вузькому (телефон) — камера вдвічі далі, щоб влізли ворота і обидва контейнери
VIEWS.ess2={t:'Контейнери ТП-6923',get c(){ return innerWidth<innerHeight?[13,1.6,-108]:[8,1.6,-109]; },get p(){ const n=innerWidth<innerHeight, c=this.c, d=[22,12,-15.5], k=n?1.9:1; return c.map((v,i)=>v+d[i]*k); }};
{ const cams=$('#cams'), b=document.createElement('button'); b.type='button'; b.dataset.c='ess2'; b.textContent=VIEWS.ess2.t; b.setAttribute('aria-pressed','false');
  b.onclick=()=>{ cams.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); goCam('ess2'); };
  const e=cams.querySelector('button[data-c="ess"]'); if(e&&e.nextSibling) cams.insertBefore(b,e.nextSibling); else cams.appendChild(b); }
// ---------- вид «АБК»
VIEWS.abk={t:'АБК',p:[158,44,22],c:[114,8,-26]};
{ const cams=$('#cams'), b=document.createElement('button'); b.type='button'; b.dataset.c='abk'; b.textContent=VIEWS.abk.t; b.setAttribute('aria-pressed','false');
  b.onclick=()=>{ cams.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); goCam('abk'); };
  const nd=cams.querySelector('button[data-c="node"]'); if(nd) cams.insertBefore(b,nd); else cams.appendChild(b); }
window.__twin.stages={sums,setStage,A}; apply();
}
