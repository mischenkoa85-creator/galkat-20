// ================= «Монтаж» — покроковий монтаж усього об'єкта (src/mont.js, 05.11.2026)
// Власник 05.11: «зроби повну 3D-модель» → «Покроковий монтаж». Правила 25.10 (Антарес_3D_монтаж_правила_розробки_26.10): кожен виріб спершу —
// зразок, що повільно обертається, з підписами (розмір, маса штуки, кількість на об'єкті); потім живий лічильник, скільки вже стоїть; у панелі — потужність,
// у контейнера — ціна; наприкінці — підсумок: потужність, генерація за рік, модулів, кількості всіх елементів, маса металу, баласту і всієї системи.
// Показ зразка завжди повільний (4 с), хоч яка швидкість; далі — вибрана швидкість. Порядок — етап 1 (те, що ставимо зараз), потім етап 2 (дах цеху після мембрани).
{ const T_=window.__twin, ST=T_.stages, RN=T_.roofnode, FP=T_.facpv, L28=T_.lan28, A=T_.abk, EW=T_.elecwa;
if(T_.clean&&RN&&ST){
const tb=$('#tabs'), bt=document.createElement('button'); bt.type='button'; bt.setAttribute('role','tab'); bt.dataset.s='mont'; bt.textContent='Монтаж'; tb.appendChild(bt);
bt.onclick=()=>{ state.sec='mont'; if(state.sheet==='peek') sheetSet('half'); apply(); };
if(!ONSECS.includes('mont')) ONSECS.push('mont');
const S=ST.sums(), BR=RN.BOM.roof||{q:{}}, BW=RN.BOM.wh||{q:{}}, BL=RN.BOM.lan||{q:{}}, G_=RN.G_;
const MG=new THREE.Group(); MG.name='montage2'; MG.visible=false; scene.add(MG);
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
// ---------- дах цеху для монтажу: усі модулі, прості тіла (з півдня на північ)
const vis=o=>{ for(let x=o;x;x=x.parent) if(x.visible===false&&x!==scene) return false; return true; };
const RM=RN.MODS.filter(m=>m.grp==='roof').sort((a,b)=>b.c.z-a.c.z), RF={}, BXG=(w,h,d,y)=>new THREE.BoxGeometry(w,h,d).translate(0,y,0);
const SIMP={blk:[BXG(0.3,0.06,0.3,-0.071),'bl'],mat:[BXG(0.32,0.003,0.32,-0.1025),'mt'],lag:[BXG(1,0.041,0.041,-0.0205),'zn'],xprof:[new THREE.BoxGeometry(0.041,0.041,1).translate(0,-0.0205,0),'zn'],
  sleeve:[BXG(0.2,0.035,0.0455,-0.0255),'sl'],sleeveE:[BXG(0.1,0.035,0.0455,-0.0255),'sl'],rod:[new THREE.BoxGeometry(0.01,0.01,1),'rod'],mcl:[BXG(0.05,0.008,0.044,0.037),'al'],zcl:[BXG(0.05,0.036,0.026,0.018),'al'],ang:[BXG(0.15,0.041,0.15,-0.0205),'zn']};
const MM={zn:std(lin(0xb9c3ca),{metalness:0.55,roughness:0.42}),bl:std(lin(0xa3a199),{roughness:0.95}),mt:std(lin(0x2b2b2b),{roughness:0.95}),sl:std(lin(0x8fa3b2),{metalness:0.3,roughness:0.45}),rod:std(lin(0xc3cbd1),{metalness:0.6,roughness:0.35}),al:std(lin(0xd5dadd),{metalness:0.5,roughness:0.35})};
const RP={}; // ключ → масив матриць у порядку модулів
{ const W_=new THREE.Matrix4(), rec=RN.rec; RM.forEach(m=>rec(m).forEach(([k,M])=>{ if(!SIMP[k]) return; (RP[k]=RP[k]||[]).push(W_.multiplyMatrices(m.T,M).clone()); })); }
Object.entries(RP).forEach(([k,L_])=>{ const im=new THREE.InstancedMesh(SIMP[k][0],MM[SIMP[k][1]],L_.length); L_.forEach((M,i)=>im.setMatrixAt(i,M)); im.count=0; im.castShadow=false; im.frustumCulled=false; MG.add(im); RF[k]=im; });
// ---------- що показуємо: цілі (екземпляри — лічильником, групи — опусканням згори)
const roofIms=(R28=>{ const V=R28&&R28.VG['1']; return V?V.children.filter(o=>o.userData.part==='roof'):[]; })(T_.r28);
const lanM=[], lanR=[]; if(L28) L28.LG28.forEach(q=>{ if(q.v2m&&q.v2m['1']) q.v2m['1'].traverse(o=>{ if(o.isInstancedMesh) lanM.push(o); }); if(q.v2r&&q.v2r['1']) lanR.push(q.v2r['1']); });
const CNT=[]; scene.traverse(o=>{ const u=o.userData&&o.userData.info; if(o.isMesh&&u&&typeof u==='object'&&/^K-[1345] · Golen/.test(u.t||'')&&o.parent&&!CNT.includes(o.parent)) CNT.push(o.parent); });
const SLB=[]; scene.traverse(o=>{ const p=o.geometry&&o.geometry.parameters; if(o.isMesh&&p&&Math.abs(p.height-0.25)<1e-3&&((Math.abs(p.width-7.058)<0.02&&Math.abs(p.depth-3.438)<0.02)||(Math.abs(p.width-3.438)<0.02&&Math.abs(p.depth-7.058)<0.02))) SLB.push(o); });
const I=(im,lbl)=>im&&im.isInstancedMesh?{im,N:im.parent===MG?im.instanceMatrix.count:im.count,lbl,force:im.parent===MG}:null, Gd=(o,h)=>o?{g:o,y0:o.position.y,h:h||3}:null;
const fpI=FP?[FP.vbr,FP.vr,FP.arm,FP.strut,FP.plate,FP.anc,FP.clp,FP.vcl].map(x=>I(x)).filter(Boolean):[], fpM=FP?[FP.pvL,FP.pvP,FP.pc].map(x=>I(x)).filter(Boolean):[];
const abkM=A?['arch','low','wall','nad'].map(k=>Gd(A.groups[k],2)).filter(Boolean):[];
const E4=T_.elec04, ew=(EW?[EW.g,EW.g2,EW.gE]:[]).concat(E4&&E4.g?[E4.g]:[]).map(x=>{ const r=Gd(x,0.01); if(r) r.force=true; return r; }).filter(Boolean);
const nr=x=>Math.round(x), lagM=nr(BR.q.lag||0);
const STEPS=[
 {e:1,n:'Фундаменти Фп-1',s:'slab',t:SLB.map(o=>Gd(o,0.6)),cam:'ess',c:[['Плит Фп-1',4]],size:'7 058 × 3 438 × 250 мм, C20/25',kg:'бетон 6,19 м³ (≈14,9 т), арматура 514 кг',qty:'4 плити — по 2 біля кожної ТП',dur:6},
 {e:1,n:'Контейнери Golen LES-H20 — краном',s:'cont',cam:'ess',t:CNT.map(o=>Gd(o,7)),c:[['Контейнерів',4]],size:'6 058 × 2 438 × 2 896 мм · PCS 500 кВт · АКБ 1 205 кВт·год',kg:'≈20 т кожен',qty:'4 — К-3, К-1 біля ТП-5913; К-4, К-5 біля ТП-6923',price:'190 000 $ FOB Шанхай + доставка ≈15 000 $ за контейнер',dur:8},
 {e:1,n:'Фасади: кронштейни, рейки, анкери',s:'fac',t:fpI,c:[['Деталей кріплення фасадів',fpI.reduce((s_,x)=>s_+x.N,0)]],size:'рейка 41×41×2,0 · кронштейн 60×180×5 · анкер M10',kg:'вузли — «Кубики фасаду»',qty:'на 429 модулів фасадів і козирка',dur:9},
 {e:1,n:'Фасади: модулі',s:'mod',t:fpM,c:[['Модулів фасадів',S.fac.n]],size:'ZNSHINE ZXN8-BD132-730 · 2 384 × 1 303 × 33 мм',kg:'36,5 кг',qty:`${nf(S.fac.n)} модулів · ${nf(S.fac.kwp,1)} кВтп`,pw:true,dur:9},
 {e:1,n:'Ліхтарі: рейки 41×41',s:'lrail',t:lanR.map(o=>Gd(o,1.5)),c:[['Рейок, м',typeof LAN28!=='undefined'&&LAN28.q?nr(LAN28.q.RAIL):0]],size:'41×41, 2 на схил у зоні притисків',kg:'1,743 кг/м',qty:'на 4 ліхтарях; на що спирати — не вирішено',dur:6},
 {e:1,n:'Ліхтарі: модулі і притиски',s:'mod',t:lanM.map(x=>I(x)),c:[['Модулів на ліхтарях',S.lan.n],['Притисків',nr((BL.q.mcl||0)+(BL.q.zcl||0))]],size:'модулі на склінні 41°',kg:'36,5 кг',qty:`${nf(S.lan.n)} модулів (${S.lan.lit} на освітлення)`,pw:true,dur:8},
 {e:1,n:'Склад: міні-рейки і модулі',s:'wh',t:WHI.map(w=>I(w.im)),c:[['Модулів складу',S.wh.n],['Міні-рейок',nr(BW.q.mrail||0)],['Саморізів',nr((BW.q.scr||0)*6)]],size:'міні-рейка 380 мм, 6 саморізів 5,5×25 EPDM',kg:'рейка ≈0,25 кг',qty:`${nf(S.wh.n)} модулів на профнастилі`,pw:true,dur:8},
 {e:1,n:'АБК: кріплення і модулі',s:'mod',t:(A&&A.groups.mount?[Gd(A.groups.mount,2)]:[]).concat(abkM),c:[['Модулів АБК',S.ab.n]],size:'дах-арка і нижній дах, за ДБН',kg:'36,5 кг',qty:`${nf(S.ab.n)} модулів · ${nf(S.ab.kwp,2)} кВтп · інвертор Deye 100 кВт`,pw:true,dur:7},
 {e:2,follow:1,n:'Дах цеху: блоки з муфтою на матах',s:'blk',t:[I(RF.mat),I(RF.blk)],c:[['Блоків',nr(BR.q.blk||0)],['Матів',nr(BR.q.mat||0)]],size:'300 × 300 × 60 мм з муфтою; мат 320 × 320 × 3',kg:'12,98 кг · мат 0,34 кг',qty:'2 на панель на кожній лазі, через 1 200 мм',dur:10},
 {e:2,follow:1,n:'Дах цеху: лаги 41×41 і крайні профілі',s:'lag',t:[I(RF.lag),I(RF.xprof),I(RF.ang)],c:[['Лаг, м',lagM],['Кутників 150×150',nr(BR.q.ang||0)]],size:'41×41×1,5 пазом догори, хлист 4,8 м',kg:'1,743 кг/м',qty:`${nf(lagM)} м + крайній профіль ${nf(nr(BR.q.xprof||0))} м`,dur:10},
 {e:2,follow:1,n:'Дах цеху: гільзи, муфти, шпильки M10',s:'rod',t:[I(RF.sleeve),I(RF.sleeveE),I(RF.rod)],c:[['Гільз',nr((BR.q.sleeve||0)+(BR.q.sleeveE||0))],['Шпильок',nr(BR.q.rod||0)]],size:'гільза П 45,5×35×2 · шпилька M10 1 299 мм, права / ліва різьба',kg:'гільза 0,36 кг · шпилька 0,62 кг',qty:'шпилька між лагами на кожній панелі',dur:9},
 {e:2,follow:1,n:'Дах цеху: модулі і притиски',s:'mod',t:roofIms.map(x=>I(x)).concat([I(RF.mcl),I(RF.zcl)]),c:[['Модулів даху',S.roof.n],['Притисків',nr((BR.q.mcl||0)+(BR.q.zcl||0))]],size:'ZNSHINE 730 Вт; середній притиск M8×60, Z33',kg:'36,5 кг',qty:`${nf(S.roof.n)} модулів · ${nf(S.roof.kwp,1)} кВтп`,pw:true,dur:12},
 {e:0,n:'Електрика: стрінги, щити PV, лінії до контейнерів',s:'box',t:ew,c:[['Стрінгів',259]],size:'щит PV 7/1 · 0,66 × 1,05 × 0,36 м',kg:'—',qty:'259 стрінгів по 11, щити PV → контейнери',dur:6},
].map(s_=>({...s_,t:s_.t.filter(Boolean)}));
// ---------- зразок у кутку: окремий рендер, повільне обертання
const SV=document.createElement('div'); SV.id='mtSample'; SV.innerHTML='<canvas></canvas><div class="mt-l"></div>'; SV.hidden=true;
(document.querySelector('#view')||canvas.parentElement).appendChild(SV); SV.title='Натисніть, щоб згорнути або розгорнути зразок'; SV.onclick=()=>SV.classList.toggle('min');
{ const st=document.createElement('style'); st.textContent=`#mtSample{position:absolute;right:12px;top:110px;z-index:6;width:300px;background:color-mix(in srgb,var(--surface) 92%,transparent);border:1px solid var(--line);border-radius:12px;padding:8px;box-shadow:0 6px 18px rgba(0,0,0,.12)}
#mtSample canvas{display:block;width:100%;height:170px} #mtSample .mt-l{font-size:12px;line-height:1.45;color:var(--ink-2)} #mtSample .mt-l b{color:var(--ink);font-size:13px;display:block;margin-bottom:2px}
#mtSample .mt-c{font:650 18px/1.2 var(--mono);color:var(--ink);margin-top:3px} #mtSample{cursor:pointer} #mtSample.min canvas,#mtSample.min .mt-d{display:none} @media(max-width:700px){#mtSample{width:158px;top:auto;bottom:8px;right:8px;padding:6px} #mtSample canvas{height:64px} #mtSample .mt-l{font-size:10.5px;line-height:1.35} #mtSample .mt-c{font-size:14px}}
.mt .steps{list-style:none;margin:0;padding:0;display:grid;gap:4px} .mt .steps button{width:100%;text-align:left;font:inherit;font-size:12.5px;color:var(--ink-2);background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:5px 8px;display:flex;gap:8px;align-items:center}
.mt .steps button.cur{border-color:var(--accent);color:var(--ink);font-weight:600} .mt .steps button.done{opacity:.7} .mt .steps i{font-style:normal;font:600 11px var(--mono);color:var(--ink-3);min-width:1.6em}
.mt .ctl{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px} .mt .ctl>button{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:5px 12px;font:inherit;font-size:13px;color:var(--ink)}
.mt .pg{height:6px;border-radius:3px;background:var(--surface-3);overflow:hidden;margin:4px 0} .mt .pg i{display:block;height:100%;background:var(--accent)}`; document.head.appendChild(st); }
const SR=new THREE.WebGLRenderer({canvas:SV.querySelector('canvas'),antialias:true,alpha:true}); SR.setPixelRatio(Math.min(2,devicePixelRatio||1)); SR.outputEncoding=THREE.sRGBEncoding;
const SS=new THREE.Scene(), SC=new THREE.PerspectiveCamera(32,1.6,0.01,100); SS.add(new THREE.HemisphereLight(0xffffff,0x8a9099,0.9)); const DL=new THREE.DirectionalLight(0xffffff,0.9); DL.position.set(3,5,4); SS.add(DL);
const SP=new THREE.Group(); SS.add(SP); const modMat=roofIms[0]?(Array.isArray(roofIms[0].material)?roofIms[0].material[0]:roofIms[0].material).clone():MM.al;
const MSH=(g,m,x,y,z,ry)=>{ const o=new THREE.Mesh(g,m); o.position.set(x||0,y||0,z||0); if(ry) o.rotation.y=ry; return o; };
const SAMP={
  slab:()=>[MSH(new THREE.BoxGeometry(7.058,0.25,3.438),std(lin(0xa6a49c),{roughness:0.9}))],
  cont:()=>{ const c0=CNT.find(o=>vis(o)), c=c0?c0.clone():null; if(c) c.visible=true; if(c){ c.position.set(0,-1.4,0); c.rotation.set(0,0,0); c.children.filter(o=>o.isSprite).forEach(o=>o.visible=false); } return c?[c]:[]; },
  fac:()=>{ const fn=T_.facnode; if(!fn) return []; return Object.values(fn.NG.vert_alb||{}).map(im=>MSH(im.geometry,im.material)); },
  mod:()=>[MSH(new THREE.BoxGeometry(2.384,0.033,1.303),modMat)],
  lrail:()=>{ const o=MSH(G_.lag,MM.zn); o.scale.x=1.2; return [o]; },
  wh:()=>[MSH(G_.mrail,MM.al),MSH(G_.scr,MM.rod),MSH(G_.mcl,MM.al,0,-0.04,0.06)].map((o,i)=>{ if(i===0) o.scale.x=0.38; return o; }),
  blk:()=>[MSH(G_.blk,MM.bl),MSH(G_.mat,MM.mt),MSH(G_.lbolt,MM.rod)],
  lag:()=>{ const o=MSH(G_.lag,MM.zn); o.scale.x=1.2; return [o,MSH(G_.ang,MM.zn,0.6,0,0.024)]; },
  rod:()=>{ const r=MSH(G_.rod,MM.rod,0,-0.0515,0); r.scale.z=0.6; return [MSH(G_.sleeve,MM.sl,0,0,-0.3),MSH(G_.cpl,MM.sl,0,0,-0.3),MSH(G_.sleeve,MM.sl,0,0,0.3),MSH(G_.cpl,MM.sl,0,0,0.3),r]; },
  box:()=>[MSH(new THREE.BoxGeometry(0.66,1.05,0.36),std(lin(0xd9dde0),{roughness:0.5}))]};
function setSample(k){ while(SP.children.length) SP.remove(SP.children[0]); const L_=(SAMP[k]||SAMP.mod)(); L_.forEach(o=>SP.add(o));
  const b=new THREE.Box3().setFromObject(SP), c=b.getCenter(new V3()), r=b.getSize(new V3()).length()/2||1; SP.children.forEach(o=>o.position.sub(c));
  SC.position.set(r*1.6,r*1.1,r*1.9); SC.lookAt(0,0,0); SC.near=r/50; SC.far=r*20; SC.updateProjectionMatrix(); }
// ---------- стан і хід
const MT={on:false,play:false,spd:1,i:0,ph:'samp',ts:0,tp:0,last:0,done:false,stg0:null,ui:0};
const _cm=new THREE.Matrix4(), _cp=new V3();
const camFor=s_=>{ const b=new THREE.Box3(); s_.t.forEach(x=>{ if(x.skip) return; if(x.im){ const im=x.im, N=x.N, k=Math.max(1,Math.floor(N/300)), lim=im.parent===MG?Math.ceil(N*0.3):N; im.updateWorldMatrix(true,false);
    for(let i=0;i<lim;i+=k){ im.getMatrixAt(i,_cm); _cp.setFromMatrixPosition(_cm).applyMatrix4(im.matrixWorld); b.expandByPoint(_cp); } } else if(x.g) b.expandByObject(x.g); }); if(b.isEmpty()) return null;
  const c=b.getCenter(new V3()), r=Math.max(8,b.getSize(new V3()).length()*0.55); return {p:[c.x+r*0.75,c.y+r*0.65,c.z+r*0.8],c:[c.x,c.y,c.z]}; };
function setT(x,f){ if(x.skip) return; if(x.im){ x.im.count=Math.round(x.N*f); x.im.instanceMatrix.needsUpdate=true; if(f>0) x.im.visible=true; }
  else if(x.g){ x.g.visible=f>0||x.keep; x.g.position.y=x.y0+(1-ease(f))*x.h; } }
function stepF(j){ return j<MT.i?1:j>MT.i?0:MT.done?1:MT.ph==='samp'?0:Math.min(1,MT.tp/STEPS[j].dur); }
function paint(){ STEPS.forEach((s_,j)=>{ const f=stepF(j), sub=s_.t.length; s_.t.forEach((x,q)=>setT(x,s_.s==='mod'&&sub>1?Math.min(1,Math.max(0,f*sub-q)):f)); }); need=true; }
function cnt(s_,f){ return s_.c.map(([n,v])=>[n,Math.round(v*f),v]); }
function enter(){ if(MT.on) return; MT.on=true; MG.visible=true; STEPS.forEach(s_=>s_.t.forEach(x=>{ x.skip=!x.force&&!vis(x.g||x.im); })); MG.visible=true; const dg=RN.IMS.lag&&RN.IMS.lag.parent; if(dg) dg.visible=false;
  MT.i=0; MT.ph='samp'; MT.ts=0; MT.tp=0; MT.done=false; MT.play=true; setSample(STEPS[0].s); SV.hidden=false; const v=STEPS[0].cam?VIEWS[STEPS[0].cam]:camFor(STEPS[0]); if(v) goTo(v); MT.last=performance.now(); requestAnimationFrame(tick); }
function leave(){ if(!MT.on) return; MT.on=false; MT.play=false; MG.visible=false; SV.hidden=true; const dg=RN.IMS.lag&&RN.IMS.lag.parent; if(dg) dg.visible=true;
  STEPS.forEach(s_=>s_.t.forEach(x=>{ if(x.im){ x.im.count=x.N; x.im.instanceMatrix.needsUpdate=true; } else if(x.g) x.g.position.y=x.y0; })); if(MT.stg0) state.lay.stg=MT.stg0; }
function go(j){ MT.i=Math.max(0,Math.min(STEPS.length-1,j)); MT.ph='samp'; MT.ts=0; MT.tp=0; MT.done=false; setSample(STEPS[MT.i].s); const s_=STEPS[MT.i], v=s_.cam?VIEWS[s_.cam]:camFor(s_); if(v&&!s_.follow) goTo(v); paint(); ui(true); }
const _fp=new V3(), _fm=new THREE.Matrix4(), OFF=new V3(13,10,12);
function follow(dt){ const s_=STEPS[MT.i]; if(!s_.follow||MT.done) return; const x=s_.t.find(q=>q.im&&!q.skip&&q.im.count>0); if(!x) return;
  x.im.getMatrixAt(Math.max(0,x.im.count-1),_fm); _fp.setFromMatrixPosition(_fm).applyMatrix4(x.im.matrixWorld); const k=1-Math.exp(-dt*1.6);
  controls.target.lerp(_fp,k); camera.position.lerp(_fp.clone().add(OFF),k); controls.update(); need=true; }
function tick(now){ if(!MT.on) return; const dt=Math.min(0.1,(now-MT.last)/1000); MT.last=now;
  SP.rotation.y+=dt*0.35; SR.setSize(SV.clientWidth-16,SV.querySelector('canvas').clientHeight,false); SC.aspect=(SV.clientWidth-16)/Math.max(1,SV.querySelector('canvas').clientHeight); SC.updateProjectionMatrix(); SR.render(SS,SC);
  if(MT.play&&!MT.done){ if(MT.ph==='samp'){ MT.ts+=dt; if(MT.ts>=4) MT.ph='play'; } else { MT.tp+=dt*MT.spd; if(MT.tp>=STEPS[MT.i].dur){ if(MT.i<STEPS.length-1) go(MT.i+1); else { MT.done=true; MT.play=false; goTo(VIEWS.over); ui(true); } } } paint(); follow(dt); }
  if(now-MT.ui>250){ MT.ui=now; ui(false); } requestAnimationFrame(tick); }
// ---------- панель
function sampleCard(){ const s_=STEPS[MT.i], f=stepF(MT.i);
  SV.querySelector('.mt-l').innerHTML=`<b>${s_.n}</b><span class="mt-d">${s_.size}<br>${s_.kg!=='—'?'маса: '+s_.kg+'<br>':''}${s_.qty}${s_.price?'<br><b style="display:inline">'+s_.price+'</b>':''}${s_.pw?'<br>модуль 730 Вт':''}</span>
  <div class="mt-c">${cnt(s_,f).map(([n,v,t])=>`${nf(v)} <small style="font:500 11px var(--font)">/ ${nf(t)} ${n.toLowerCase()}</small>`).join('<br>')}</div>${MT.ph==='samp'&&!MT.done?'<small>зразок · 4 с</small>':''}`; }
function summary(){ const kg=Object.entries(BR.q).reduce((s_,[k,v])=>s_+(k==='lag'||k==='xprof'?v*1.743:k==='blk'||k==='mat'?0:({sleeve:0.36,sleeveE:0.18,cpl:0.08,rod:0.62,jam:0.006,mcl:0.07,zcl:0.06,ang:1.36,lbolt:0.02}[k]||0)*v),0);
  const bal=(BR.q.blk||0)*12.98+(BR.q.mat||0)*0.338, mods=S.all.n*36.5;
  return `<div class="blk wide"><h3>Підсумок монтажу</h3><div class="kpis"><div class="kpi"><span class="k">Потужність</span><span class="v">${nf(S.all.kwp,1)} <small>кВтп</small></span><span class="s">${nf(S.all.n)} модулів 730 Вт</span></div>
  <div class="kpi"><span class="k">Генерація за рік</span><span class="v">≈${nf(S.all.mwh)} <small>МВт·год</small></span><span class="s">етап 1 ≈${nf(S.s1.mwh)} · етап 2 ≈${nf(S.s2.mwh)}</span></div>
  <div class="kpi"><span class="k">Накопичувачі</span><span class="v">4 <small>контейнери</small></span><span class="s">2 000 кВт / 4 820 кВт·год</span></div>
  <div class="kpi"><span class="k">Маса на даху цеху</span><span class="v">${nf((kg+bal+S.roof.n*36.5)/1000,1)} <small>т</small></span><span class="s">метал ${nf(kg/1000,1)} т · баласт ${nf(bal/1000,1)} т · модулі ${nf(S.roof.n*36.5/1000,1)} т</span></div></div>
  <table class="cmp an"><tbody>${STEPS.flatMap(s_=>s_.c.map(([n,v])=>`<tr><td class="w">${n}</td><td>${nf(Math.round(v))}</td></tr>`)).join('')}<tr><td class="w">Маса всіх модулів</td><td>${nf(mods/1000,1)} т</td></tr><tr><td class="w">Контейнери</td><td>4 × ≈20 т</td></tr></tbody></table></div>`; }
function panelMT(){ const s_=STEPS[MT.i];
  return `<div class="mt" style="display:contents"><div class="ph" style="grid-column:1/-1"><span class="eyebrow ours">Монтаж · крок ${MT.i+1} з ${STEPS.length}${s_.e?` · етап ${s_.e}`:''}</span><h2 id="mtH">${MT.done?'Об\'єкт змонтовано':s_.n}</h2>
  <p>Спершу зразок виробу — повільно, з розміром, масою і кількістю; далі він ставиться на об'єкті з лічильником. Етап 1 — те, що ставимо зараз; етап 2 — дах цеху після мембрани.</p>
  <div class="pg"><i id="mtPg" style="width:0%"></i></div><div class="ctl"><button type="button" id="mtPlay">${MT.play?'❚❚ Пауза':'▶ Далі'}</button><div class="seg" role="group" aria-label="Швидкість">${[1,2,5].map(v=>`<button type="button" data-mts="${v}" aria-pressed="${MT.spd===v}">×${v}</button>`).join('')}</div><button type="button" id="mtRe">Спочатку</button></div></div>
  <div class="blk"><h3>Кроки</h3><ol class="steps">${STEPS.map((x,j)=>`<li><button type="button" data-mtj="${j}" class="${j===MT.i?'cur':j<MT.i||MT.done?'done':''}"><i>${j+1}</i>${x.n}</button></li>`).join('')}</ol></div>
  <div class="blk"><h3>Уже стоїть</h3><table class="cmp an"><tbody id="mtCnt"></tbody></table></div>${MT.done?summary():''}</div>`; }
function ui(full){ if(state.sec!=='mont') return; const pane=$('#pane');
  if(full||!document.getElementById('mtCnt')){ pane.innerHTML=panelMT(); pane.querySelector('#mtPlay').onclick=()=>{ if(MT.done){ go(0); MT.play=true; } else MT.play=!MT.play; MT.last=performance.now(); ui(true); };
    pane.querySelector('#mtRe').onclick=()=>{ go(0); MT.play=true; ui(true); }; pane.querySelectorAll('[data-mts]').forEach(b=>b.onclick=()=>{ MT.spd=+b.dataset.mts; ui(true); });
    pane.querySelectorAll('[data-mtj]').forEach(b=>b.onclick=()=>{ go(+b.dataset.mtj); MT.play=true; ui(true); }); }
  const pg=$('#mtPg'); if(pg) pg.style.width=((MT.i+(MT.done?1:stepF(MT.i)))/STEPS.length*100).toFixed(1)+'%';
  const tb_=$('#mtCnt'); if(tb_) tb_.innerHTML=STEPS.flatMap((x,j)=>cnt(x,stepF(j)).map(([n,v,t])=>v?`<tr><td class="w">${n}</td><td>${nf(v)}${v<t?` / ${nf(t)}`:''}</td></tr>`:'')).join('')||'<tr><td class="w">ще нічого</td><td>—</td></tr>';
  sampleCard(); }
const ap0=apply; apply=function(){ if(state.sec!=='mont'){ if(MT.on) leave(); return ap0.apply(this,arguments); }
  if(!MT.on) MT.stg0=state.lay.stg; state.lay.stg='all'; state.sec='pz'; try{ ap0.apply(this,arguments); } finally{ state.sec='mont'; } enter();
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.s==='mont'?'true':'false'));
  paint(); ui(true); save(); };
const sv0=setVis; setVis=function(){ if(!MT.on) return sv0.apply(this,arguments); const s=state.sec; state.sec='pz'; state.lay.stg='all'; try{ sv0.apply(this,arguments); } finally{ state.sec=s; }
  MG.visible=true; STEPS.forEach(s_=>s_.t.forEach(x=>{ if(x.skip) return; if(x.g) x.g.visible=true; else if(x.im) x.im.visible=true; })); paint(); };
window.__twin.apply=apply; window.__twin.mont={MT,STEPS,go,enter,leave,RF};
} }
