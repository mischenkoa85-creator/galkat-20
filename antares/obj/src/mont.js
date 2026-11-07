// ================= «Монтаж» — покроковий монтаж усього об'єкта (src/mont.js, ред. 2 — 05.11.2026)
// Ред. 1 власник відхилив (05.11, 17:08): гальмує, камера смикається, послідовність неправильна. Ред. 2 — за режисерським сценарієм 26.10 і рішенням 05.11, 17:16:
// • дах цеху — захватками: одна арка — одна захватка, від гребеня симетрично до ендов (шпильки M10 тягнуть лаги через гребінь), арки зі сходу на захід;
//   автокран (06.11) переїжджає: арка 1 — зі сходу, 2–4 — з півночі, 5 — із заходу; контейнери — біля своєї ТП;
//   у захватці: блоки з матами → лаги з кутниками і крайніми профілями → гільзи, муфти, шпильки → модулі (насуваються по лагах) і притиски;
// • етап 1: плити і контейнери біля ТП-5913, потім ТП-6923, фасади, ліхтарі, склад, АБК; наприкінці — електрика;
// • камера — режисер: один спокійний кадр на крок (для арки — з південного торця вздовж гребеня), переліт між кадрами; дотик — пауза; ніякого «стеження»;
// • швидкодія: щокадру змінюється лише поточний крок, тіні на час ролика заморожені (оновлюються на зміні кроку);
// • зразок виробу (4 с повільно, незалежно від швидкості) — лише при першій появі виробу; лічильники; кран; підсумок.
{ const T_=window.__twin, ST=T_.stages, RN=T_.roofnode, FP=T_.facpv, L28=T_.lan28, A=T_.abk, EW=T_.elecwa;
if(T_.clean&&RN&&ST){
const tb=$('#tabs'), bt=document.createElement('button'); bt.type='button'; bt.setAttribute('role','tab'); bt.dataset.s='mont'; bt.textContent='Монтаж'; tb.appendChild(bt);
bt.onclick=()=>{ state.sec='mont'; if(state.sheet==='peek') sheetSet('half'); apply(); };
if(!ONSECS.includes('mont')) ONSECS.push('mont');
const S=ST.sums(), BR=RN.BOM.roof||{q:{}}, BW=RN.BOM.wh||{q:{}}, BL=RN.BOM.lan||{q:{}}, G_=RN.G_;
const MG=new THREE.Group(); MG.name='montage2'; MG.visible=false; scene.add(MG);
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x), vis=o=>{ for(let x=o;x;x=x.parent) if(x.visible===false&&x!==scene) return false; return true; };
const MM={zn:std(lin(0xb9c3ca),{metalness:0.55,roughness:0.42}),bl:std(lin(0xa3a199),{roughness:0.95}),mt:std(lin(0x2b2b2b),{roughness:0.95}),sl:std(lin(0x8fa3b2),{metalness:0.3,roughness:0.45}),rod:std(lin(0xc3cbd1),{metalness:0.6,roughness:0.35}),al:std(lin(0xd5dadd),{metalness:0.5,roughness:0.35}),
  crane:std(lin(0xe3a51c),{roughness:0.5,metalness:0.25}),pal:std(lin(0xb98a55),{roughness:0.9})};
const roofIms=(R28=>{ const V=R28&&R28.VG['1']; return V?V.children.filter(o=>o.userData.part==='roof'):[]; })(T_.r28);
const modMat0=roofIms[0]?(Array.isArray(roofIms[0].material)?roofIms[0].material[0]:roofIms[0].material).clone():MM.al;
// ---------- арки даху цеху (між ендовами, розріз 1-1): сход → захід, як іде кран
const ARCH=[[-0.13,17.87],[18.14,35.86],[36.39,54.10],[54.39,72.11],[72.68,96.49]].map(([a,b],i)=>({i,a,b,m:(a+b)/2})).sort((p,q)=>q.m-p.m);
ARCH.forEach((r,j)=>{ r.no=j+1; });
const archOf=X=>ARCH.find(r=>X>=r.a-0.4&&X<=r.b+0.4)||ARCH.reduce((p,q)=>Math.abs(q.m-X)<Math.abs(p.m-X)?q:p);
const BXG=(w,h,d,y)=>new THREE.BoxGeometry(w,h,d).translate(0,y,0);
const SIMP={blk:[BXG(0.3,0.06,0.3,-0.071),'bl'],mat:[BXG(0.32,0.003,0.32,-0.1025),'mt'],blk2:[BXG(0.3,0.06,0.3,-0.071),'bl'],mat2:[BXG(0.32,0.003,0.32,-0.1025),'mt'],lag:[BXG(1,0.041,0.041,-0.0205),'zn'],xprof:[new THREE.BoxGeometry(0.041,0.041,1).translate(0,-0.0205,0),'zn'],
  sleeve:[BXG(0.2,0.035,0.0455,-0.0255),'sl'],sleeveE:[BXG(0.1,0.035,0.0455,-0.0255),'sl'],cpl:[BXG(0.05,0.017,0.017,-0.0515),'sl'],rod:[new THREE.BoxGeometry(0.01,0.01,1),'rod'],jam:[BXG(0.017,0.017,0.008,0),'rod'],
  mcl:[BXG(0.05,0.008,0.044,0.037),'al'],zcl:[BXG(0.05,0.036,0.026,0.018),'al'],ang:[BXG(0.15,0.041,0.15,-0.0205),'zn'],pv:[BXG(2.364,0.033,1.283,0.0165),'pv']};
const PH=[['blk','Блоки з муфтою на матах',['mat','blk','mat2','blk2']],['lag','Лаги, кутники, крайні профілі',['lag','xprof','ang']],['rod','Гільзи, муфти, шпильки M10 через гребінь',['sleeve','sleeveE','cpl','rod','jam']],['mod','Модулі і притиски',['pv','mcl','zcl']]];
// деталі даху: порядок — арка (схід → захід), далі від гребеня до ендов (обидва схили разом), далі з півдня на північ
const RT={}; { const W_=new THREE.Matrix4(), L_={};
  RN.MODS.filter(m=>m.grp==='roof').forEach(m=>{ const X=m.c.x, Y=-m.c.z, r=archOf(X), key=[r.no,Math.round(Math.abs(X-r.m)*2)/2,Y];
    RN.rec(m).concat([['pv',new THREE.Matrix4()]]).forEach(([k,M])=>{ if(!SIMP[k]) return; (L_[k]=L_[k]||[]).push({key,M:W_.multiplyMatrices(m.T,M).clone()}); }); });
  Object.entries(L_).forEach(([k,L])=>{ L.sort((p,q)=>p.key[0]-q.key[0]||p.key[1]-q.key[1]||p.key[2]-q.key[2]);
    const im=new THREE.InstancedMesh(SIMP[k][0],SIMP[k][1]==='pv'?modMat0:MM[SIMP[k][1]],L.length); L.forEach((x,i)=>im.setMatrixAt(i,x.M)); im.count=0; im.castShadow=k==='pv'; im.receiveShadow=true; im.frustumCulled=false; MG.add(im);
    const st={}; L.forEach((x,i)=>{ const a=x.key[0]; if(!st[a]) st[a]={s:i,n:0}; st[a].n++; }); RT[k]={im,N:L.length,st}; }); }
// автокран на виносних опорах (власник 06.11: «нормальний кран, і він може подавати з різних сторін»): шасі 4 осі, поворотна частина з кабіною
// і противагою, телескопічна стріла з 4 секцій, канат, гак; стоїть біля тієї сторони, з якої ближче до поточної роботи
const CRN=new THREE.Group(); MG.add(CRN);
const CRM={y:MM.crane,d:std(lin(0x3b4248),{roughness:0.6,metalness:0.4}),w:std(lin(0x1c1f22),{roughness:0.9}),g:std(lin(0xd6dadc),{roughness:0.5,metalness:0.3})};
const cbx=(w,h,d,m,x,y,z,p)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=true; (p||CRN).add(o); return o; };
cbx(12.5,1.1,2.55,CRM.y,0,1.55,0); cbx(2.2,1.9,2.5,CRM.y,5.6,2.6,0); cbx(1.0,0.9,2.3,CRM.g,6.4,2.9,0);           // рама, кабіна шасі, скло
[-4.6,-3.1,2.4,3.9].forEach(x=>[-1,1].forEach(sd=>{ const wl=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.62,0.55,16),CRM.w); wl.rotation.x=Math.PI/2; wl.position.set(x,0.62,sd*1.2); CRN.add(wl); }));
[[-4.2,1],[-4.2,-1],[3.6,1],[3.6,-1]].forEach(([x,sd])=>{ cbx(0.35,0.35,3.6,CRM.d,x,1.2,sd*2.9); cbx(0.3,1.0,0.3,CRM.d,x,0.55,sd*4.5); cbx(0.9,0.12,0.9,CRM.d,x,0.06,sd*4.5); });   // виносні опори 7,2 м
const TUR=new THREE.Group(); TUR.position.set(-1.6,2.1,0); CRN.add(TUR);                                          // поворотна частина
{ const r=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,0.4,24),CRM.d); r.position.y=0.2; TUR.add(r); }
cbx(4.6,1.2,2.4,CRM.y,-0.6,1.0,0,TUR); cbx(1.6,1.3,2.0,CRM.d,-2.6,1.2,0,TUR); cbx(1.4,1.5,0.9,CRM.y,0.9,1.4,1.05,TUR); cbx(1.1,0.8,0.05,CRM.g,1.2,1.6,1.51,TUR);   // платформа, противага, кабіна крана
const BM=new THREE.Group(); BM.position.set(0.8,1.9,0); TUR.add(BM);                                                // стріла: шарнір над поворотною частиною
const SEC=[0.95,0.8,0.66,0.53].map((t,i)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(1,t,t*0.85),i?CRM.y:CRM.y); o.castShadow=true; BM.add(o); return o; });
const RP=new THREE.Mesh(new THREE.BoxGeometry(0.04,1,0.04),CRM.d); MG.add(RP);
const HK=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.7,0.35),CRM.d); MG.add(HK);
const PAL=new THREE.Mesh(new THREE.BoxGeometry(1.2,1,0.8).translate(0,0.5,0),MM.pal); MG.add(PAL);
// стоянки: X, Y (м), напрям шасі (0 — уздовж X, 1 — уздовж Y); орієнтовні — проїзди, мережі й межі ділянки уточнити на місці
const CRP={east:{X:101.8,Y:42,ax:1,n:'зі сходу, між ТП-5913 і контейнерами'},nE:{X:63.3,Y:103.8,ax:0,n:'з півночі'},nC:{X:45.2,Y:103.8,ax:0,n:'з півночі'},
  nW:{X:30.5,Y:104,ax:0,n:'з півночі, біля ТП-6923'},west:{X:-6.6,Y:48,ax:1,n:'із заходу'},tp6923:{X:24.5,Y:111.6,ax:1,n:'біля ТП-6923, зі сходу від контейнерів'}};
const archSide=r=>r.no===1?'east':r.no===2?'nE':r.no===3?'nC':r.no===4?'nW':'west';
function craneAt(k){ const p=CRP[k]; CRN.position.copy(W(p.X,p.Y,0)); CRN.rotation.y=p.ax?Math.PI/2:0; CRN.updateMatrixWorld(true); }
function craneTo(tgt,hookY){ CRN.updateMatrixWorld(true); const inv=CRN.getWorldQuaternion(new THREE.Quaternion()).invert();
  const d0=new V3().subVectors(tgt,TUR.getWorldPosition(new V3())).applyQuaternion(inv); TUR.rotation.y=Math.atan2(-d0.z,d0.x); CRN.updateMatrixWorld(true);   // поворот на ціль
  const piv=BM.getWorldPosition(new V3()), tip=new V3(tgt.x,Math.max(hookY+4.5,piv.y+5),tgt.z), dl=new V3().subVectors(tip,piv).applyQuaternion(inv);
  const hz=Math.hypot(dl.x,dl.z), L=Math.hypot(hz,dl.y); BM.rotation.z=Math.atan2(dl.y,hz);                                   // підйом стріли
  const e=Math.max(0,(L-11)/3); SEC.forEach((o,i)=>{ o.scale.x=11; o.position.x=i*e+5.5; });                              // 4 секції по 11 м, висунуті рівно
  CRN.updateMatrixWorld(true); const tipW=new V3(L,0,0).applyMatrix4(BM.matrixWorld);
  RP.position.set(tipW.x,(tipW.y+hookY+0.35)/2,tipW.z); RP.scale.y=Math.max(0.1,tipW.y-hookY-0.35); HK.position.set(tipW.x,hookY,tipW.z); }
// ---------- цілі етапу 1 (екземпляри — лічильником, групи — опусканням згори)
const lanM=[], lanR=[]; if(L28) L28.LG28.forEach(q=>{ if(q.v2m&&q.v2m['1']) q.v2m['1'].traverse(o=>{ if(o.isInstancedMesh) lanM.push(o); }); if(q.v2r&&q.v2r['1']) lanR.push(q.v2r['1']); });
const CNT=[]; scene.traverse(o=>{ const u=o.userData&&o.userData.info; if(o.isMesh&&u&&typeof u==='object'&&/^K-[1345] · Golen/.test(u.t||'')&&o.parent&&!CNT.includes(o.parent)) CNT.push(o.parent); });
const SLB=[]; scene.traverse(o=>{ const p=o.geometry&&o.geometry.parameters; if(o.isMesh&&p&&Math.abs(p.height-0.25)<1e-3&&((Math.abs(p.width-7.058)<0.02&&Math.abs(p.depth-3.438)<0.02)||(Math.abs(p.width-3.438)<0.02&&Math.abs(p.depth-7.058)<0.02))) SLB.push(o); });
const wp=o=>o.getWorldPosition(new V3()), at6923=o=>wp(o).z<-90;
const I=im=>im&&im.isInstancedMesh?{im,N:im.count}:null, Gd=(o,h)=>o?{g:o,y0:o.position.y,h:h||3}:null;
const fpI=FP?[FP.vbr,FP.vr,FP.arm,FP.strut,FP.plate,FP.anc,FP.clp,FP.vcl].map(I).filter(Boolean):[], fpM=FP?[FP.pvL,FP.pvP,FP.pc].map(I).filter(Boolean):[];
const abkM=A?['mount','arch','low','wall','nad'].map(k=>Gd(A.groups[k],2)).filter(Boolean):[];
const E4=T_.elec04, ew=(EW?[EW.g,EW.g2,EW.gE]:[]).concat(E4&&E4.g?[E4.g]:[]).map(x=>{ const r=Gd(x,0.01); if(r) r.force=true; return r; }).filter(Boolean);
const nr=x=>Math.round(x), V_=(p,c)=>({p,c}), RZ=X=>roofZ(Math.min(96.5,Math.max(0,X)));
const shotArch=r=>V_(W(r.m+9,-16,RZ(r.m)+15).toArray(),W(r.m,26,RZ(r.m)).toArray());
const STEPS=[
 {e:1,n:'Плити Фп-1 біля ТП-5913',s:'slab',t:SLB.filter(o=>!at6923(o)).map(o=>Gd(o,0.6)),c:[['Плит Фп-1',2]],size:'7 058 × 3 438 × 250 мм, C20/25',kg:'бетон 6,19 м³ (≈14,9 т), арматура 514 кг',qty:'4 плити — по 2 біля кожної ТП; контур заземлення 29 м на плиту',cam:'ess',dur:5},
 {e:1,n:'Контейнери К-3, К-1 — краном',s:'cont',crane:'east',t:CNT.filter(o=>!at6923(o)).map(o=>Gd(o,7)),c:[['Контейнерів',2]],size:'6 058 × 2 438 × 2 896 мм · PCS 500 кВт · АКБ 1 205 кВт·год',kg:'≈20 т кожен',qty:'4 — К-3, К-1 біля ТП-5913; К-4, К-5 біля ТП-6923',price:typeof KALK!=='undefined'?`під ключ ${nf(KALK.in.capex_uze_usd)} $ за контейнер`:'',cam:'ess',dur:7},
 {e:1,n:'Плити і контейнери К-4, К-5 біля ТП-6923',crane:'tp6923',t:SLB.filter(at6923).map(o=>Gd(o,0.6)).concat(CNT.filter(at6923).map(o=>Gd(o,7))),c:[['Контейнерів',2]],cam:'ess2',dur:7},
 {e:1,n:'Фасади: кронштейни, рейки, анкери',s:'fac',t:fpI,c:[['Деталей кріплення фасадів',fpI.reduce((s_,x)=>s_+x.N,0)]],size:'рейка 41×41×2,0 · кронштейн 60×180×5 · анкер M10',kg:'вузли — «Кубики фасаду»',qty:`на ${nf(S.fac.n)} модулів фасадів і козирка`,cam:'over',dur:8},
 {e:1,n:'Фасади: модулі',s:'mod',t:fpM,c:[['Модулів фасадів',S.fac.n]],size:'ZNSHINE ZXN8-BD132-730 · 2 384 × 1 303 × 33 мм',kg:'36,5 кг',qty:`${nf(S.fac.n)} модулів · ${nf(S.fac.kwp,1)} кВтп`,pw:true,cam:'over',dur:8},
 {e:1,n:'Ліхтарі: рейки 41×41',s:'lrail',t:lanR.map(o=>Gd(o,1.5)),c:[['Рейок, м',typeof LAN28!=='undefined'&&LAN28.q?nr(LAN28.q.RAIL):0]],size:'41×41, 2 на схил у зоні притисків',kg:'1,743 кг/м',qty:'на 4 ліхтарях; на що спирати — не вирішено',cam:'lan28',dur:5},
 {e:1,n:'Ліхтарі: модулі і притиски',t:lanM.map(I),c:[['Модулів на ліхтарях',S.lan.n],['Притисків',nr((BL.q.mcl||0)+(BL.q.zcl||0))]],cam:'lan28',dur:7},
 {e:1,n:'Склад: міні-рейки і модулі',s:'wh',t:WHI.map(w=>I(w.im)),c:[['Модулів складу',S.wh.n],['Міні-рейок',nr(BW.q.mrail||0)],['Саморізів',nr((BW.q.scr||0)*6)]],size:'міні-рейка 380 мм, 6 саморізів 5,5×25 EPDM',kg:'рейка ≈0,25 кг',qty:`${nf(S.wh.n)} модулів на профнастилі`,cam:'wh',dur:7},
 {e:1,n:'АБК: кріплення і модулі',t:abkM,c:[['Модулів АБК',S.ab.n]],cam:'abk',dur:6},
];
const PI={blk:{size:'300 × 300 × 60 мм з муфтою; мат 320 × 320 × 3',kg:'12,98 кг · мат 0,34 кг',qty:`${nf(nr(BR.q.blk||0))} блоків — 2 на панель на кожній лазі; додатково ${nf(nr(BR.q.blk2||0))} лише по краю поля (зони F, G)`,c:k=>[['Блоків',RT.blk.st[k].n+((RT.blk2&&RT.blk2.st[k])||{n:0}).n],['Матів',RT.mat.st[k].n+((RT.mat2&&RT.mat2.st[k])||{n:0}).n]]},
  lag:{size:'41×41×1,5 пазом догори, хлист 4,8 м; кутник 150×150×6',kg:'1,743 кг/м',qty:`${nf(nr(BR.q.lag||0))} м лаг на даху`,c:k=>[['Лаг, відрізків',RT.lag.st[k].n],['Кутників',(RT.ang.st[k]||{n:0}).n]]},
  rod:{size:'гільза П 45,5×35×2 · муфта M10×50 · шпилька M10 1 299 мм, права / ліва різьба',kg:'гільза 0,36 кг · шпилька 0,62 кг',qty:'шпилька між лагами на кожній панелі; через гребінь — пара схилів',c:k=>[['Шпильок',RT.rod.st[k].n],['Гільз',RT.sleeve.st[k].n+((RT.sleeveE.st[k]||{n:0}).n)]]},
  mod:{size:'ZNSHINE 730 Вт; середній притиск M8×60, Z33',kg:'36,5 кг',qty:`${nf(S.roof.n)} модулів даху · насуваються по лагах від проходу`,pw:true,c:k=>[['Модулів',RT.pv.st[k].n],['Притисків',RT.mcl.st[k].n+((RT.zcl.st[k]||{n:0}).n)]]}};
ARCH.forEach(r=>PH.forEach(([ph,nm,keys],j)=>{ if(!RT.pv.st[r.no]) return; STEPS.push({e:2,arch:r,ph,n:`Дах цеху · арка ${r.no} з ${ARCH.length}: ${nm.charAt(0).toLowerCase()+nm.slice(1)}`,s:r.no===ARCH[0].no?ph:null,...PI[ph],c:PI[ph].c(r.no),
  t:keys.filter(k=>RT[k]&&RT[k].st[r.no]).map(k=>({rt:RT[k],a:r.no})),shot:shotArch(r),crane:archSide(r),dur:ph==='mod'?7:5}); }));
STEPS.push({e:0,n:'Електрика: стрінги, щити PV, лінії до контейнерів',s:'box',t:ew,c:[['Стрінгів',259]],size:'щит PV 7/1 · 600 × 500 × 200 мм',kg:'—',qty:'259 стрінгів по 11, щити PV → контейнери',cam:'over',dur:6});
STEPS.forEach(s_=>{ s_.t=s_.t.filter(Boolean); });
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
  box:()=>{ const S=window.__twin.shch; return S?[S.model('ЩД-12')]:[MSH(new THREE.BoxGeometry(0.6,0.5,0.2),std(lin(0xd9dde0),{roughness:0.5}))]; }};
function setSample(k){ while(SP.children.length) SP.remove(SP.children[0]); const L_=(SAMP[k]||SAMP.mod)(); L_.forEach(o=>SP.add(o));
  const b=new THREE.Box3().setFromObject(SP), c=b.getCenter(new V3()), r=b.getSize(new V3()).length()/2||1; SP.children.forEach(o=>o.position.sub(c));
  SC.position.set(r*1.6,r*1.1,r*1.9); SC.lookAt(0,0,0); SC.near=r/50; SC.far=r*20; SC.updateProjectionMatrix(); }
// ---------- хід: f кроку j; попередні — повністю, наступні — нуль; щокадру — лише поточний
const MT={on:false,play:false,spd:1,i:0,ph:'samp',ts:0,tp:0,last:0,done:false,stg0:null,ui:0,seen:new Set()};
function setT(x,f){ if(x.skip) return;
  if(x.rt){ const s_=x.rt.st[x.a]; const n=s_.s+Math.round(s_.n*f); if(x.rt.im.count!==n){ x.rt.im.count=n; } return; }
  if(x.im){ const n=Math.round(x.N*f); if(x.im.count!==n){ x.im.count=n; x.im.instanceMatrix.needsUpdate=true; } if(f>0) x.im.visible=true; }
  else if(x.g){ x.g.visible=f>0||!!x.keep; x.g.position.y=x.y0+(1-ease(f))*x.h; } }
function stepF(j){ return j<MT.i?1:j>MT.i?0:MT.done?1:MT.ph==='samp'?0:Math.min(1,MT.tp/STEPS[j].dur); }
function paintAll(){ Object.values(RT).forEach(rt=>{ rt.im.count=0; }); STEPS.forEach((s_,j)=>{ const f=stepF(j); s_.t.forEach(x=>{ if(x.rt){ if(f>0){ const q=x.rt.st[x.a]; x.rt.im.count=Math.max(x.rt.im.count,q.s+Math.round(q.n*f)); } } else setT(x,f); }); }); renderer.shadowMap.needsUpdate=true; need=true; }
function paintCur(){ const s_=STEPS[MT.i], f=stepF(MT.i); s_.t.forEach(x=>setT(x,f));
  const ck=s_.crane; CRN.visible=RP.visible=HK.visible=!!ck; PAL.visible=false;
  if(ck){ craneAt(ck);
    if(s_.arch){ const r=s_.arch, sd=ck, sw=(f-0.5)*8;                                           // точка подачі — на арці біля краю з боку крана
      const X=sd==='east'?r.b-6:sd==='west'?r.a+6:r.m+sw, Y=sd==='east'||sd==='west'?CRP[sd].Y+sw:90.6, z=RZ(X), lift=Math.abs(Math.sin(f*Math.PI*3));
      PAL.visible=s_.ph==='blk'&&f<1; if(PAL.visible){ PAL.position.copy(W(X,Y,z+0.1)); PAL.scale.y=Math.max(0.05,1-f); }
      craneTo(W(X,Y,z),z+1.6+6*lift); }
    else { const tg=s_.t.map(x=>x.g).filter(o=>o&&CNT.includes(o)), k=Math.min(tg.length-1,Math.floor(f*tg.length)), o=tg[Math.max(0,k)];  // гак над контейнером, що опускається
      if(o){ const p=wp(o); craneTo(new V3(p.x,p.y,p.z),p.y+3.4); } else craneTo(W(CRP[ck].X+12,CRP[ck].Y,2),6); } }
  need=true; }
// ---------- зразок і кадр кроку
const camOf=s_=>s_.shot||(s_.cam&&VIEWS[s_.cam])||VIEWS.over;
function go(j,keepPlay){ MT.i=Math.max(0,Math.min(STEPS.length-1,j)); const s_=STEPS[MT.i]; MT.ts=0; MT.tp=0; MT.done=false;
  MT.ph=s_.s&&!MT.seen.has(s_.s)?'samp':'play'; if(s_.s){ MT.seen.add(s_.s); setSample(s_.s); } SV.hidden=!s_.s&&!s_.size; SV.querySelector('canvas').style.display=s_.s?'':'none';
  const prev=STEPS[MT.i-1], v=camOf(s_); if(!prev||camOf(prev)!==v) goTo(v); paintAll(); paintCur(); ui(true); }
function enter(){ if(MT.on) return; MT.on=true; MG.visible=true; document.querySelectorAll('#cams button').forEach(x=>x.setAttribute('aria-pressed','false'));   // камера ролика — свої кадри roofIms.forEach(o=>o.visible=false);
  STEPS.forEach(s_=>s_.t.forEach(x=>{ x.skip=!x.force&&!x.rt&&!vis(x.g||x.im); })); const dg=RN.IMS.lag&&RN.IMS.lag.parent; if(dg) dg.visible=false;
  renderer.shadowMap.autoUpdate=false; MT.seen.clear(); MT.play=true; go(0); MT.last=performance.now(); requestAnimationFrame(tick); }
function leave(){ if(!MT.on) return; MT.on=false; MT.play=false; MG.visible=false; SV.hidden=true; renderer.shadowMap.autoUpdate=true; const dg=RN.IMS.lag&&RN.IMS.lag.parent; if(dg) dg.visible=true;
  STEPS.forEach(s_=>s_.t.forEach(x=>{ if(x.skip) return; if(x.im){ x.im.count=x.N; x.im.instanceMatrix.needsUpdate=true; } else if(x.g){ x.g.position.y=x.y0; x.g.visible=true; } }));   // 06.11: після ролика контейнери і плити — знову видимі (раніше лишались схованими)
  roofIms.forEach(o=>o.visible=true); if(MT.stg0) state.lay.stg=MT.stg0; }
controls.addEventListener('start',()=>{ if(MT.on&&MT.play){ MT.play=false; ui(true); } });   // дотик до моделі — пауза, камера ваша
function tick(now){ if(!MT.on) return; const dt=Math.min(0.1,(now-MT.last)/1000); MT.last=now;
  if(!SV.hidden&&!SV.classList.contains('min')){ SP.rotation.y+=dt*0.35; const cv=SV.querySelector('canvas'), w=SV.clientWidth-16, h=cv.clientHeight; if(SR._w!==w||SR._h!==h){ SR.setSize(w,h,false); SC.aspect=w/Math.max(1,h); SC.updateProjectionMatrix(); SR._w=w; SR._h=h; } SR.render(SS,SC); }
  if(MT.play&&!MT.done){ if(MT.ph==='samp'){ MT.ts+=dt; if(MT.ts>=4){ MT.ph='play'; } } else { MT.tp+=dt*MT.spd; paintCur(); if(MT.tp>=STEPS[MT.i].dur){ if(MT.i<STEPS.length-1) go(MT.i+1); else { MT.done=true; MT.play=false; paintAll(); goTo(VIEWS.over); ui(true); } } } }
  if(now-MT.ui>300){ MT.ui=now; ui(false); } requestAnimationFrame(tick); }
// ---------- панель
const cnt=(s_,f)=>s_.c.map(([n,v])=>[n,Math.round(v*f),v]);
function sampleCard(){ const s_=STEPS[MT.i], f=stepF(MT.i), P_=s_.ph?PI[s_.ph]:s_;
  SV.querySelector('.mt-l').innerHTML=`<b>${s_.n}</b><span class="mt-d">${P_.size?P_.size+'<br>':''}${P_.kg&&P_.kg!=='—'?'маса: '+P_.kg+'<br>':''}${P_.qty||''}${s_.price?'<br><b style="display:inline">'+s_.price+'</b>':''}${P_.pw?'<br>модуль 730 Вт':''}</span>
  <div class="mt-c">${cnt(s_,f).map(([n,v,t])=>`${nf(v)} <small style="font:500 11px var(--font)">/ ${nf(t)} ${n.toLowerCase()}</small>`).join('<br>')}</div>${MT.ph==='samp'&&!MT.done?'<small>зразок · 4 с</small>':''}`; }
function summary(){ const kg=Object.entries(BR.q).reduce((s_,[k,v])=>s_+(k==='lag'||k==='xprof'?v*1.743:k==='blk'||k==='mat'?0:({sleeve:0.36,sleeveE:0.18,cpl:0.08,rod:0.62,jam:0.006,mcl:0.07,zcl:0.06,ang:1.36,lbolt:0.02}[k]||0)*v),0), bal=(BR.q.blk||0)*12.98+(BR.q.mat||0)*0.338;
  return `<div class="blk wide"><h3>Підсумок монтажу</h3><div class="kpis"><div class="kpi"><span class="k">Потужність</span><span class="v">${nf(S.all.kwp,1)} <small>кВтп</small></span><span class="s">${nf(S.all.n)} модулів 730 Вт</span></div>
  <div class="kpi"><span class="k">Генерація за рік</span><span class="v">≈${nf(S.all.mwh)} <small>МВт·год</small></span><span class="s">етап 1 ≈${nf(S.s1.mwh)} · етап 2 ≈${nf(S.s2.mwh)}</span></div>
  <div class="kpi"><span class="k">Накопичувачі</span><span class="v">4 <small>контейнери</small></span><span class="s">2 000 кВт / 4 820 кВт·год</span></div>
  <div class="kpi"><span class="k">Маса на даху цеху</span><span class="v">${nf((kg+bal+S.roof.n*36.5)/1000,1)} <small>т</small></span><span class="s">метал ${nf(kg/1000,1)} т · баласт ${nf(bal/1000,1)} т · модулі ${nf(S.roof.n*36.5/1000,1)} т</span></div></div></div>`; }
const GRP=()=>{ const out=[]; STEPS.forEach((s_,j)=>{ if(s_.arch){ const last=out[out.length-1]; if(last&&last.arch===s_.arch) last.js.push(j); else out.push({arch:s_.arch,js:[j],n:`Дах цеху · арка ${s_.arch.no} з ${ARCH.length}`}); } else out.push({js:[j],n:s_.n}); }); return out; };
function panelMT(){ const s_=STEPS[MT.i], G=GRP();
  return `<div class="mt" style="display:contents"><div class="ph" style="grid-column:1/-1"><span class="eyebrow ours">Монтаж · ${s_.e===1?'етап 1':s_.e===2?'етап 2 · дах цеху від гребеня до ендов':'електрика'}</span><h2>${MT.done?'Об\'єкт змонтовано':s_.n}</h2>
  <p>Кожна арка — окрема захватка: від гребеня симетрично до ендов, бо шпильки тягнуть лаги через гребінь. Новий виріб спершу показується зразком. Торкніться моделі — показ стане на паузу.</p>
  <div class="pg"><i id="mtPg" style="width:0%"></i></div><div class="ctl"><button type="button" id="mtPlay">${MT.play?'❚❚ Пауза':'▶ Далі'}</button><div class="seg" role="group" aria-label="Швидкість">${[1,2,5].map(v=>`<button type="button" data-mts="${v}" aria-pressed="${MT.spd===v}">×${v}</button>`).join('')}</div><button type="button" id="mtRe">Спочатку</button></div></div>
  <div class="blk"><h3>Кроки</h3><ol class="steps">${G.map((g,q)=>{ const cur=g.js.includes(MT.i)&&!MT.done, done=MT.done||g.js[g.js.length-1]<MT.i; return `<li><button type="button" data-mtj="${g.js[0]}" class="${cur?'cur':done?'done':''}"><i>${q+1}</i>${g.n}</button></li>`; }).join('')}</ol></div>
  <div class="blk"><h3>Уже стоїть</h3><table class="cmp an"><tbody id="mtCnt"></tbody></table></div>${MT.done?summary():''}</div>`; }
function totals(){ const T0={}; STEPS.forEach((s_,j)=>cnt(s_,stepF(j)).forEach(([n,v,t])=>{ const k=n.replace(/, відрізків/,''); T0[k]=T0[k]||[0,0]; T0[k][0]+=v; T0[k][1]+=t; })); return T0; }
function ui(full){ if(state.sec!=='mont') return; const pane=$('#pane');
  if(full||!document.getElementById('mtCnt')){ pane.innerHTML=panelMT(); pane.querySelector('#mtPlay').onclick=()=>{ if(MT.done){ MT.seen.clear(); go(0); MT.play=true; } else MT.play=!MT.play; MT.last=performance.now(); ui(true); };
    pane.querySelector('#mtRe').onclick=()=>{ MT.seen.clear(); go(0); MT.play=true; ui(true); }; pane.querySelectorAll('[data-mts]').forEach(b=>b.onclick=()=>{ MT.spd=+b.dataset.mts; ui(true); });
    pane.querySelectorAll('[data-mtj]').forEach(b=>b.onclick=()=>{ go(+b.dataset.mtj); MT.play=true; ui(true); }); }
  const pg=$('#mtPg'); if(pg) pg.style.width=((MT.i+(MT.done?1:stepF(MT.i)))/STEPS.length*100).toFixed(1)+'%';
  const tb_=$('#mtCnt'), T0=totals(); if(tb_) tb_.innerHTML=Object.entries(T0).filter(([,v])=>v[0]>0).map(([n,[v,t]])=>`<tr><td class="w">${n}</td><td>${nf(v)}${v<t?` / ${nf(t)}`:''}</td></tr>`).join('')||'<tr><td class="w">ще нічого</td><td>—</td></tr>';
  sampleCard(); }
const ap0=apply; apply=function(){ if(state.sec!=='mont'){ if(MT.on) leave(); return ap0.apply(this,arguments); }
  if(!MT.on) MT.stg0=state.lay.stg; state.lay.stg='all'; state.sec='pz'; try{ ap0.apply(this,arguments); } finally{ state.sec='mont'; } enter();
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.s==='mont'?'true':'false'));
  roofIms.forEach(o=>o.visible=false); paintAll(); ui(true); save(); };
const sv0=setVis; setVis=function(){ if(!MT.on) return sv0.apply(this,arguments); const s=state.sec; state.sec='pz'; state.lay.stg='all'; try{ sv0.apply(this,arguments); } finally{ state.sec=s; }
  MG.visible=true; roofIms.forEach(o=>o.visible=false); STEPS.forEach(s_=>s_.t.forEach(x=>{ if(x.skip||x.rt) return; if(x.g) x.g.visible=true; else if(x.im) x.im.visible=true; })); paintAll(); paintCur(); };
window.__twin.apply=apply; window.__twin.mont={MT,STEPS,go,enter,leave,RT,ARCH};
} }
