// ================= Кріплення до болта зблизька: дах цеху, склад, ліхтарі (src/roofnode.js, 05.11.2026)
// Власник 05.11: «зроби повну 3D-модель» → «кріплення до болта скрізь». Деталі — за рішеннями, що вже прийняті:
// • дах цеху (етап 2) — «Лага 0°» / арка 18 м з elements-ses (arka-src/arka.js, variant-laga-0): лага 41×41×1,5 пазом догори під кожним стиком модулів,
//   блок 300×300×60 з муфтою на маті 320×320×3 — 2 на панель на кожній лазі через 1 200 (перший за 575 від торця), болт M8×20 + шайба DIN 9021 у муфту;
//   гільза П 45,5×35×2 (200, на торці 100) знизу на лазі з привареною муфтою M10×50, шпилька M10 1 299 між лагами (права / ліва різьба), контргайки;
//   середній притиск 44×6 з болтом M8×60 і гайкою з пружиною в пазу, на крайніх лагах — Z33, 3 точки на довгий бік (0,17 / 0,5 / 0,83 довжини);
//   на краю ряду — крайній профіль 41×41 за 12 мм від краю панелей на кутниках 150×150×6, блок з матом під кінцем кожної лаги і 2 блоки без мата впритул, Z33 — 2 на панель;
// • склад — розрахунок 26.10 (176 модулів): міні-рейка 380 мм (аналог AR2-MR13-380) під кожною точкою притиску, 4 точки на модуль по довгих сторонах,
//   середній П33 на стику, Z33 на краях ланцюжка; 6 саморізів 5,5×25 EPDM на рейку; рейка — вздовж хвилі профнастилу (по скату);
// • ліхтарі (модулі на склінні) — рейки 41×41 уже в моделі (lan28.js, 2 на схил у зоні притисків ZNSHINE), тут — притиски на рейках; на що спирати рейки — не вирішено.
// Далеко деталей не видно — ближче RD м показуються найближчі NM модулів кожною деталлю. Кількості для специфікації — по всіх модулях моделі (BOM).
{ const R28=window.__twin.r28, L28=window.__twin.lan28;
if(R28&&window.__twin.clean){
const NM=innerWidth<700?22:56, RD=16;
const L=2.384, WD=1.303, TH=0.033, GAP=0.02, PU=L+GAP, PV=WD+GAP, LV=PV/2, LH=0.041, ZC=[0.17,0.5,0.83].map(k=>k*L-L/2), UCL=L/2-0.54;
const M_={zn:std(lin(0xb9c3ca),{metalness:0.55,roughness:0.42}), bl:std(lin(0xa3a199),{roughness:0.95}), mt:std(lin(0x2b2b2b),{roughness:0.95}), sl:std(lin(0x8fa3b2),{metalness:0.3,roughness:0.45}),
  cp:std(lin(0xb98b2f),{metalness:0.5,roughness:0.35}), hw:std(lin(0x6d757b),{metalness:0.7,roughness:0.35}), al:std(lin(0xd5dadd),{metalness:0.5,roughness:0.35}), rod:std(lin(0xc3cbd1),{metalness:0.6,roughness:0.35})};
// ---------- геометрія в рамці модуля: X — уздовж довгого боку, Y — нормаль (вгору), Z — уздовж короткого боку; метри; низ рами модуля — Y = 0
const ext=(pts,len,axis)=>{ const s=new THREE.Shape(); pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); const g=new THREE.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});
  g.translate(0,0,-len/2); if(axis==='x') g.rotateY(Math.PI/2); return g; };
const box=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x||0,y||0,z||0);
const cyl=(r,h,ax,x,y,z,seg)=>{ const g=new THREE.CylinderGeometry(r,r,h,seg||12); if(ax==='x') g.rotateZ(Math.PI/2); if(ax==='z') g.rotateX(Math.PI/2); return g.translate(x||0,y||0,z||0); };
const hex=(s,h,ax,x,y,z)=>cyl(s/Math.sqrt(3),h,ax,x,y,z,6);
const mrg=gs=>{ const B=THREE.BufferGeometryUtils; if(B&&B.mergeBufferGeometries) return B.mergeBufferGeometries(gs.map(g=>g.index?g.toNonIndexed():g));
  const n=gs.reduce((s,g)=>s+(g.index?g.index.count:g.attributes.position.count),0), P=new Float32Array(n*3), N=new Float32Array(n*3); let o=0;
  gs.forEach(g0=>{ const g=g0.index?g0.toNonIndexed():g0; g.computeVertexNormals(); P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3); o+=g.attributes.position.count; });
  const r=new THREE.BufferGeometry(); r.setAttribute('position',new THREE.BufferAttribute(P,3)); r.setAttribute('normal',new THREE.BufferAttribute(N,3)); return r; };
// профіль 41×41×1,5 пазом догори (паз 22, загин 9): переріз у площині (Z, Y), верх профілю Y = 0
const a=0.0205, s=0.011, t=0.0015, r=0.009, H=LH;
const C41=[[-a,-H],[a,-H],[a,0],[s,0],[s,-r],[s+t,-r],[s+t,-t],[a-t,-t],[a-t,-H+t],[-(a-t),-H+t],[-(a-t),-t],[-(s+t),-t],[-(s+t),-r],[-s,-r],[-s,0],[-a,0]];
const G_={
  lag:ext(C41,1,'x'),                                                                    // уздовж X, довжина — масштаб
  xprof:ext(C41,1,'z'),                                                                  // крайній профіль уздовж Z
  blk:box(0.3,0.06,0.3,0,-LH-0.03,0), mat:box(0.32,0.003,0.32,0,-LH-0.0615,0),
  lbolt:mrg([cyl(0.012,0.002,'y',0,-LH+0.0025,0), hex(0.013,0.0053,'y',0,-LH+0.0062,0)]),   // шайба DIN 9021 і голівка M8×20 у пазу лаги
  sleeve:mrg([ext([[-0.02275,-0.043],[0.02275,-0.043],[0.02275,-0.008],[0.02075,-0.008],[0.02075,-0.041],[-0.02075,-0.041],[-0.02075,-0.008],[-0.02275,-0.008]],0.2,'x'),
    ...[-0.05,0.05].flatMap(u=>[cyl(0.004,0.064,'z',u,-0.0205,0), hex(0.013,0.0053,'z',u,-0.0205,0.0255), hex(0.013,0.0065,'z',u,-0.0205,-0.0262)])]),
  sleeveE:mrg([ext([[-0.02275,-0.043],[0.02275,-0.043],[0.02275,-0.008],[0.02075,-0.008],[0.02075,-0.041],[-0.02075,-0.041],[-0.02075,-0.008],[-0.02275,-0.008]],0.1,'x'),
    cyl(0.004,0.064,'z',0,-0.0205,0), hex(0.013,0.0053,'z',0,-0.0205,0.0255), hex(0.013,0.0065,'z',0,-0.0205,-0.0262)]),
  cpl:hex(0.017,0.05,'z',0,-0.0515,0),                                                   // муфта M10×50 під гільзою, вісь — уздовж шпильки
  rod:cyl(0.005,1,'z',0,0,0,10), jam:hex(0.017,0.008,'z',0,0,0),
  mcl:mrg([box(0.05,0.006,0.044,0,TH+0.003,0), hex(0.013,0.0053,'y',0,TH+0.0086,0), cyl(0.004,0.07,'y',0,TH-0.029,0)]),   // середній притиск, болт M8×60
  zcl:mrg([box(0.05,0.003,0.026,0,0.0015,-0.013), box(0.05,TH+0.004,0.003,0,(TH+0.004)/2,0.0015), box(0.05,0.003,0.012,0,TH+0.0055,0.009), hex(0.013,0.0053,'y',0,0.0057,-0.013)]),   // Z33: полиця на лазі, стінка, полиця над рамою (+Z)
  ang:mrg([box(0.15,0.041,0.006,0,-0.0205,0), box(0.006,0.041,0.15,0,-0.0205,0)]),           // кутник 150×150×6 у плані, висотою профілю
  mrail:box(1,0.06,0.04,0,-0.03,0),                                                       // міні-рейка 380 (масштаб X), заповнює висоту до профнастилу
  scr:mrg([-0.15,-0.09,-0.03,0.03,0.09,0.15].map(u=>hex(0.008,0.006,'y',u,-0.0005,0.012))),   // 6 саморізів 5,5×25 EPDM на рейку (голівки)
};
// ---------- модулі: рамка з екземпляра (світ ← модуль), сусіди
const MODS=[], _M=new THREE.Matrix4(), _p=new V3(), _q=new Q(), _s=new V3(), ex=new V3(), ey=new V3(), ez=new V3();
function addFrom(im,grp,skip){ if(!im||!im.isInstancedMesh) return; im.updateWorldMatrix(true,false);
  if(!im.geometry.boundingBox) im.geometry.computeBoundingBox(); const bs=im.geometry.boundingBox.getSize(new V3()), bc=im.geometry.boundingBox.getCenter(new V3());
  for(let i=0;i<im.count;i++){ if(skip&&skip(i)) continue; im.getMatrixAt(i,_M); _M.premultiply(im.matrixWorld); _M.multiply(new THREE.Matrix4().makeTranslation(bc.x,bc.y,bc.z)); _M.decompose(_p,_q,_s); if(_s.x*_s.y*_s.z<1e-9) continue;
    const ax=[new V3(1,0,0).applyQuaternion(_q),new V3(0,1,0).applyQuaternion(_q),new V3(0,0,1).applyQuaternion(_q)], sc=[_s.x*bs.x,_s.y*bs.y,_s.z*bs.z];
    const o=[0,1,2].sort((p,q)=>sc[p]-sc[q]); let w=ax[o[0]].clone(), u=ax[o[2]].clone(); if(w.y<0) w.negate(); const v=new V3().crossVectors(u,w).normalize(); u.crossVectors(w,v).normalize();
    const c=_p.clone().addScaledVector(w,-sc[o[0]]/2), T=new THREE.Matrix4().makeBasis(u,w,v).setPosition(c);
    MODS.push({grp,im,i,c,u,v,w,T,nb:{}}); } }
// дах: усі модулі розкладки В1 (у стрінгах і на освітлення)
const RV=R28.VG['1']; if(RV) RV.children.filter(o=>o.userData.part==='roof').forEach(o=>addFrom(o,'roof'));
// склад: без 4 місць, яких не ставимо
{ const rem=(typeof EP!=='undefined'&&EP&&EP.whRem)?EP.whRem:null; WHI.forEach((w,wi)=>addFrom(w.im,'wh',k=>rem&&rem.has(wi+':'+k))); }
// ліхтарі: модулі на склінні (варіант 2, розкладка В1)
if(L28) L28.LG28.forEach(q=>{ const g=q.v2m&&q.v2m['1']; if(g) g.traverse(o=>{ if(o.isInstancedMesh) addFrom(o,'lan'); }); });
// сусіди: по стику довгого боку (±Z) і короткого (±X)
{ const key=p=>Math.round(p.x/1.5)+','+Math.round(p.y/1.5)+','+Math.round(p.z/1.5), H_=new Map();
  MODS.forEach((m,i)=>{ const k=key(m.c); if(!H_.has(k)) H_.set(k,[]); H_.get(k).push(i); });
  const d=new V3();
  MODS.forEach(m=>{ const kx=Math.round(m.c.x/1.5), ky=Math.round(m.c.y/1.5), kz=Math.round(m.c.z/1.5);
    for(let a1=-2;a1<=2;a1++) for(let b1=-1;b1<=1;b1++) for(let c1=-2;c1<=2;c1++){ const L_=H_.get((kx+a1)+','+(ky+b1)+','+(kz+c1)); if(!L_) continue;
      L_.forEach(j=>{ const n=MODS[j]; if(n===m||n.grp!==m.grp) return; d.subVectors(n.c,m.c); const du=d.dot(m.u), dv=d.dot(m.v), dw=Math.abs(d.dot(m.w));
        if(dw>0.25) return; if(Math.abs(du)<0.3&&Math.abs(Math.abs(dv)-PV)<0.15) m.nb[dv<0?'mv':'pv']=true; if(Math.abs(dv)<0.3&&Math.abs(Math.abs(du)-PU)<0.2) m.nb[du<0?'mu':'pu']=true; }); } }); }
// ---------- рецепти: [ключ, матриця в рамці модуля]
const Tm=(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z), Sx=(m,k)=>m.multiply(new THREE.Matrix4().makeScale(k,1,1)), Sz=(m,k)=>m.multiply(new THREE.Matrix4().makeScale(1,1,k));
const RY=a_=>new THREE.Matrix4().makeRotationY(a_);
function roofParts(m){ const o=[], nb=m.nb, lines=[-LV].concat(nb.pv?[]:[LV]);
  const u0=nb.mu?-PU/2:-L/2, u1=nb.pu?PU/2:L/2, ur=nb.pu?PU/2-0.019:L/2-0.05;
  lines.forEach(z=>{ o.push(['lag',Sx(Tm((u0+u1)/2,0,z),u1-u0)]);
    [-0.617,0.583].forEach(u=>{ o.push(['blk',Tm(u,0,z)],['mat',Tm(u,0,z)],['lbolt',Tm(u,0,z)]); });
    o.push([nb.pu?'sleeve':'sleeveE',Tm(ur,0,z)],['cpl',Tm(ur,0,z)]);
    if(!nb.mu) o.push(['blk',Tm(-L/2+0.03,0,z)],['mat',Tm(-L/2+0.03,0,z)],['ang',Tm(-L/2+0.075,0,z+(z<0?0.024:-0.024))]);
    if(!nb.pu) o.push(['blk',Tm(L/2-0.03,0,z)],['mat',Tm(L/2-0.03,0,z)],['ang',Tm(L/2-0.075,0,z+(z<0?0.024:-0.024))]); });
  o.push(['rod',Sz(Tm(ur,-0.0515,0),1.299)]); [-1,1].forEach(sg=>[0.031,0.043].forEach(k=>o.push(['jam',Tm(ur,-0.0515,sg*(LV-k))])));
  ZC.forEach(u=>{ if(nb.mv) o.push(['mcl',Tm(u,0,-LV)]); else o.push(['zcl',Tm(u,0,-WD/2-0.012)]); if(!nb.pv) o.push(['zcl',Tm(u,0,WD/2+0.012).multiply(RY(Math.PI))]); });
  [[nb.mu,-1],[nb.pu,1]].forEach(([has,sg])=>{ if(has) return; const ue=sg*(L/2+0.012);
    o.push(['xprof',Sz(Tm(ue,0,0),PV)]); [-LV+0.30,-LV+0.60].forEach(z=>o.push(['blk',Tm(ue,0,z)]));
    [-0.33,0.33].forEach(z=>o.push(['zcl',Tm(sg*(L/2+0.012),0,z).multiply(RY(sg>0?-Math.PI/2:Math.PI/2))])); });
  return o; }
const FALL=new V3();
function whParts(m){ const o=[], nb=m.nb; FALL.set(0,-1,0).projectOnPlane(m.w).normalize(); const alongU=Math.abs(FALL.dot(m.u))>0.7;
  const edges=[[-WD/2,'mv',1]].concat([[WD/2,'pv',-1]]);
  edges.forEach(([z,k,sg])=>{ const shared=nb[k]; if(k==='pv'&&shared) return;   // спільний стик рахує модуль з боку −Z
    [-UCL,UCL].forEach(u=>{ const zz=shared?(k==='mv'?-LV:LV):z+(sg>0?-0.03:0.03);
      const R_=alongU?Tm(u,0,zz):Tm(u,0,zz).multiply(RY(Math.PI/2)); o.push(['mrail',Sx(R_.clone(),0.38)],['scr',R_.clone().multiply(Tm(0,-0.0595,0))]);
      if(shared) o.push(['mcl',Tm(u,0,k==='mv'?-LV:LV)]); else o.push(['zcl',sg>0?Tm(u,0,-WD/2-0.012):Tm(u,0,WD/2+0.012).multiply(RY(Math.PI))]); }); });
  return o; }
function lanParts(m){ const o=[], nb=m.nb;
  [-UCL,UCL].forEach(u=>{ if(nb.mv) o.push(['mcl',Tm(u,0,-LV)]); else o.push(['zcl',Tm(u,0,-WD/2-0.012)]); if(!nb.pv) o.push(['zcl',Tm(u,0,WD/2+0.012).multiply(RY(Math.PI))]); });
  return o; }
const REC={roof:roofParts,wh:whParts,lan:lanParts};
// ---------- кількості по всій моделі (специфікація з моделі)
const NAME={lag:'Лага 41×41×1,5, м',xprof:'Крайній профіль 41×41×1,5, м',blk:'Блок 300×300×60 з муфтою',mat:'Мат 320×320×3',lbolt:'Болт M8×20 + шайба DIN 9021 (лага — блок)',
  sleeve:'Гільза П 45,5×35×2, 200 мм, 2 болти M8',sleeveE:'Гільза П 45,5×35×2, 100 мм на торці, 1 болт M8',cpl:'Муфта M10×50 (приварена до гільзи)',rod:'Шпилька M10, 1 299 мм, права / ліва різьба',jam:'Контргайка M10',
  mcl:'Середній притиск з болтом M8×60 і гайкою з пружиною',zcl:'Крайній притиск Z33 з болтом M8',ang:'Кутник 150×150×6',mrail:'Міні-рейка 380 мм (аналог AR2-MR13-380)',scr:'Саморіз 5,5×25 EPDM, комплект 6 шт. на рейку'};
const KG={blk:12.98,mat:0.338,sleeve:0.36,sleeveE:0.18,cpl:0.08,rod:0.62,jam:0.006,mcl:0.07,zcl:0.06,ang:1.36,mrail:0.25,lbolt:0.02};
const BOM={}; MODS.forEach(m=>{ const B=BOM[m.grp]||(BOM[m.grp]={n:0,q:{}}); B.n++; REC[m.grp](m).forEach(([k,M])=>{ const e=M.elements;
  const len=k==='lag'?Math.hypot(e[0],e[1],e[2]):k==='xprof'?Math.hypot(e[8],e[9],e[10]):1; B.q[k]=(B.q[k]||0)+len; }); });
// ---------- сітки деталей (екземпляри на найближчі модулі)
const DG=new THREE.Group(); DG.name='roofnode'; scene.add(DG);
const MATK={lag:'zn',xprof:'zn',blk:'bl',mat:'mt',lbolt:'hw',sleeve:'sl',sleeveE:'sl',cpl:'cp',rod:'rod',jam:'hw',mcl:'al',zcl:'al',ang:'zn',mrail:'al',scr:'hw'};
const IMS={}; Object.keys(G_).forEach(k=>{ const im=new THREE.InstancedMesh(G_[k],M_[MATK[k]],NM*16); im.count=0; im.frustumCulled=false; im.castShadow=false; im.receiveShadow=true; DG.add(im); IMS[k]=im;
  im.userData.info=()=>{ const tot=Object.values(BOM).reduce((s_,B)=>s_+(B.q[k]||0),0), kg=KG[k];
    return {t:NAME[k],d:`На всьому об'єкті з моделі: ${k==='lag'||k==='xprof'?nf(tot,1)+' м':nf(Math.round(tot))+' шт.'}${kg?` · ${nf(kg,kg<0.1?3:2)} кг за штуку`:''}. ${k==='mrail'||k==='scr'?'Склад: розрахунок 26.10 на 176 модулів.':k==='mcl'||k==='zcl'?'Дах цеху — 3 точки на довгий бік; склад і ліхтарі — 2 точки в зоні 540 мм від торців.':'Дах цеху: «Лага 0°», арка 18 м (elements-ses).'} Деталі показуються зблизька, для найближчих модулів.`}; };
  PICK.push({o:im,when:()=>DG.visible&&im.count>0}); });
const visUp=o=>{ for(let x=o;x;x=x.parent) if(x.visible===false) return false; return true; };
let SEL='', lastP=new V3(1e9,0,0);
function upd(force){ if(!force&&camera.position.distanceTo(lastP)<0.3) return; lastP.copy(camera.position);
  const L_=[]; MODS.forEach((m,i)=>{ const d=camera.position.distanceTo(m.c); if(d<RD) L_.push([d,i]); }); L_.sort((p,q)=>p[0]-q[0]);
  const pick=L_.filter(([d,i])=>visUp(MODS[i].im)).slice(0,NM).map(x=>x[1]), key=pick.join(','); if(!force&&key===SEL) return; SEL=key;
  const per={}; Object.keys(IMS).forEach(k=>per[k]=0); const W_=new THREE.Matrix4();
  pick.forEach(i=>{ const m=MODS[i]; REC[m.grp](m).forEach(([k,M])=>{ const im=IMS[k]; if(per[k]>=im.instanceMatrix.count) return; W_.multiplyMatrices(m.T,M); im.setMatrixAt(per[k]++,W_); }); });
  Object.entries(IMS).forEach(([k,im])=>{ im.count=per[k]; im.instanceMatrix.needsUpdate=true; }); need=true; }
controls.addEventListener('change',()=>upd(false)); setInterval(()=>upd(false),400);
const sv0=setVis; setVis=function(){ sv0.apply(this,arguments); upd(true); };
// ---------- «Об'єкт»: кріплення з моделі (специфікація)
const pz0=panelPZ; panelPZ=function(){ const h=pz0.apply(this,arguments), f=(v,k)=>k==='lag'||k==='xprof'?nf(v,1)+' м':nf(Math.round(v));
  const G=[['roof','Дах цеху · етап 2'],['wh','Склад · етап 1'],['lan','Ліхтарі · етап 1']].filter(([g])=>BOM[g]);
  const ks=[...new Set(G.flatMap(([g])=>Object.keys(BOM[g].q)))];
  const kg=G.map(([g])=>Object.entries(BOM[g].q).reduce((s_,[k,v])=>s_+(k==='lag'||k==='xprof'?v*1.743:(KG[k]||0)*v),0));
  return h+`<div class="blk wide"><h3>Кріплення з моделі — до болта</h3><div class="tw"><table class="cmp an"><thead><tr><th>Деталь</th>${G.map(([g,n])=>`<th>${n}<small>${nf(BOM[g].n)} модулів</small></th>`).join('')}</tr></thead><tbody>
  ${ks.map(k=>`<tr><td class="w">${NAME[k]}</td>${G.map(([g])=>`<td>${BOM[g].q[k]?f(BOM[g].q[k],k):'—'}</td>`).join('')}</tr>`).join('')}
  <tr class="tot"><td class="w">Маса кріплення з баластом, т</td>${kg.map(v=>`<td>${nf(v/1000,1)}</td>`).join('')}</tr></tbody></table></div>
  <p class="src">Підраховано по кожному модулю моделі з його сусідами (стик, край ряду). Деталі видно зблизька — підведіть камеру до модулів. Фасади — вузли «Кубики фасаду», АБК — модель АБК. Рейки ліхтарів (41×41, 2 на схил) — у моделі ліхтаря; на що їх спирати, ще не вирішено.</p></div>`; };
window.__twin.roofnode={MODS,BOM,IMS,upd,G_};
upd(true);
} }
