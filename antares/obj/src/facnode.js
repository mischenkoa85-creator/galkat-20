// ================= Кубики фасаду зблизька (src/facnode.js): справжні вузли кріплення з деталей elements-ses (model/variant_fasad.py → export_fasad_twin.py → FACNODE)
// Далеко — спрощені рейки й кронштейни (facpv.js); ближче RD м — найближчі NM вузлів кожною деталлю: рейка, кронштейн, анкер, болт, гайка, шайби, притиск, гайка в пазу, пластина заземлення, трос.
{ const FP=window.__twin.facpv;
if(FP&&typeof FACNODE!=='undefined'){
const FN=FACNODE, NM=innerWidth<700?14:24, RD=14, FG=FP.FG, NAME={vert_alb:'вертикально, альбомно',vert_kn:'вертикально, книжково',kozyrok:'козирок 25°'};
const dec=(b,w)=>{ const s=atob(b), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return w===2?new Uint16Array(u.buffer):w===4?new Uint32Array(u.buffer):new Float32Array(u.buffer); };
const CM={zn:std(lin(0xb6c0c6),{metalness:0.55,roughness:0.4}), st:std(lin(0x9aa5ac),{metalness:0.5,roughness:0.45}), ss:std(lin(0xd7dbde),{metalness:0.8,roughness:0.25}),
  al:std(lin(0xcfd4d8),{metalness:0.65,roughness:0.3}), cu:std(lin(0xc98a4b),{metalness:0.7,roughness:0.35}), rope:std(lin(0xf0f2f3),{roughness:0.5}), resin:std(lin(0x6b6f72),{roughness:0.9})};
const PG={}; Object.entries(FN.parts).forEach(([id,p])=>{ PG[id]={pos:dec(p.p,0),idx:dec(p.i,p.w),c:p.c,n:p.n}; });
const NI={}, NG={};
Object.entries(FN.nodes).forEach(([n,L])=>{ const acc={}, cnt={};
  L.forEach(r=>{ const pid=r[0], g=PG[pid]; if(!g) return; const m=r.slice(1), A=acc[g.c]||(acc[g.c]={p:[],i:[],n:0}), P=g.pos; cnt[g.n]=(cnt[g.n]||0)+1;
    for(let k=0;k<P.length;k+=3){ const x=P[k],y=P[k+1],z=P[k+2]; A.p.push((m[0]*x+m[1]*y+m[2]*z+m[3])/1000,(m[4]*x+m[5]*y+m[6]*z+m[7])/1000,(m[8]*x+m[9]*y+m[10]*z+m[11])/1000); }
    for(let k=0;k<g.idx.length;k++) A.i.push(g.idx[k]+A.n); A.n+=P.length/3; });
  NI[n]=cnt; NG[n]={};
  Object.entries(acc).forEach(([c,A])=>{ const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3)); geo.setIndex(A.i); geo.computeVertexNormals();
    const im=new THREE.InstancedMesh(geo,CM[c],NM); im.count=0; im.frustumCulled=false; im.castShadow=false; im.receiveShadow=false; im.userData.node=n; FG.add(im); NG[n][c]=im;
    im.userData.info=()=>({t:`Кубики фасаду: вузол «${NAME[n]}»`,d:Object.entries(NI[n]).map(([k,v])=>`${k} — ${v}`).join('; ')+'. Деталі — elements-ses, сторінка «Кубики фасаду»; розрахунок — за ДБН 04.11.'});
    PICK.push({o:im,when:()=>FG.visible&&im.count>0}); }); });
// модулі: вузол, матриця вузол → світ (мм вузла вже переведено в м), центр, індекси спрощених деталей
const MODS=[], up=new V3(0,1,0), MX=new THREE.Matrix4();
FP.V.forEach((m,k)=>{ const [f,s,h,W,H]=m, F=FP.FR[f], o=F.P(s+W/2,h+H/2,0), X=F.al.clone(), Z=new V3().crossVectors(X,up);
  const T=new THREE.Matrix4().makeBasis(X,up,Z).setPosition(o);
  MODS.push({n:W>2?'vert_alb':'vert_kn',T,c:F.P(s+W/2,h+H/2,0.18),hide:[[FP.vr,[2*k,2*k+1]],[FP.vbr,[4*k,4*k+1,4*k+2,4*k+3]],[FP.vcl,[4*k,4*k+1,4*k+2,4*k+3]]]}); });
FP.C.forEach((m,k)=>{ const [f,r,top,s]=m, F=FP.FR[f], o=F.P(s,top-FP.KTOP,0), X=F.al.clone(), Z=new V3().crossVectors(X,up);
  const T=new THREE.Matrix4().makeBasis(X,up,Z).setPosition(o), R=(a,n)=>Array.from({length:n},(_,i)=>a*k+i);
  MODS.push({n:'kozyrok',T,c:F.P(s,top-0.4,0.6),hide:[[FP.arm,R(2,2)],[FP.strut,R(2,2)],[FP.plate,R(4,4)],[FP.anc,R(8,8)],[FP.clp,R(4,4)]]}); });
const ZERO=new THREE.Matrix4().makeScale(0,0,0), ORIG=new Map(), tmp=new THREE.Matrix4();
function hideSimple(md,on){ md.hide.forEach(([im,ids])=>{ ids.forEach(i=>{ const key=im.uuid+':'+i; if(on){ if(!ORIG.has(key)){ im.getMatrixAt(i,tmp); ORIG.set(key,tmp.clone()); } im.setMatrixAt(i,ZERO); }
  else if(ORIG.has(key)){ im.setMatrixAt(i,ORIG.get(key)); ORIG.delete(key); } }); im.instanceMatrix.needsUpdate=true; }); }
let SEL=new Set(), lastP=new V3(1e9,0,0), lastV=null, SKIPF=-1;
function upd(force){ const vis=FG.visible&&FG.parent&&FG.parent.visible!==false; if(!force&&vis===lastV&&camera.position.distanceTo(lastP)<0.4) return; lastP.copy(camera.position); lastV=vis;
  const want=new Set();
  if(vis){ const L=[]; MODS.forEach((md,i)=>{ const d=camera.position.distanceTo(md.c); if(d<RD) L.push([d,i]); }); L.sort((a,b)=>a[0]-b[0]); L.slice(0,NM).forEach(([d,i])=>want.add(i)); }
  if(SKIPF>=0) want.add(SKIPF);   // розібраний модуль: спрощені деталі сховані, деталі вузла — у розборі
  SEL.forEach(i=>{ if(!want.has(i)) hideSimple(MODS[i],false); }); want.forEach(i=>{ if(!SEL.has(i)) hideSimple(MODS[i],true); }); SEL=want;
  const per={vert_alb:[],vert_kn:[],kozyrok:[]}; want.forEach(i=>{ if(i!==SKIPF) per[MODS[i].n].push(MODS[i]); });
  Object.entries(NG).forEach(([n,cls])=>{ const L=per[n]; Object.entries(cls).forEach(([c,im])=>{ L.forEach((md,j)=>im.setMatrixAt(j,EXF>0?md.T.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,(FXO[c]||0)*EXF)):md.T)); im.count=L.length; im.instanceMatrix.needsUpdate=true; }); });
  need=true; }
controls.addEventListener('change',()=>upd(false)); setInterval(()=>upd(false),500);
const svN=setVis; setVis=function(){ svN.apply(this,arguments); upd(true); };
// розбір: від стіни назовні — анкери, кронштейни, консолі й підкоси, рейки, притиски, трос; модулі фасаду прозорі
let EXF=0; const FXO={ss:0.08,resin:0,st:0.25,zn:0.45,cu:0.45,al:0.75,rope:0.95}, FGH=new Map();
function fghost(on){ [FP.pvL,FP.pvP,FP.pc].filter(Boolean).forEach(im=>{ const mt=im.material; if(on&&!FGH.has(mt)){ FGH.set(mt,[mt.transparent,mt.opacity,mt.depthWrite]); mt.transparent=true; mt.opacity=0.22; mt.depthWrite=false; mt.needsUpdate=true; }
  if(!on&&FGH.has(mt)){ const [a_,o_,d_]=FGH.get(mt); mt.transparent=a_; mt.opacity=o_; mt.depthWrite=d_; mt.needsUpdate=true; FGH.delete(mt); } }); }
// 07.11: подвійне натискання на модуль фасаду або козирка — розбір вузла цього модуля: від стіни назовні, кожен шар з кількістю
const FCN={}; Object.entries(FN.nodes).forEach(([n,L])=>{ const C={}; L.forEach(r=>{ const g=PG[r[0]]; if(!g) return; const c=C[g.c]||(C[g.c]={}); c[g.n]=(c[g.n]||0)+1; }); FCN[n]=C; });
const FLN={resin:'Розчин хімічних анкерів',st:'Анкери, болти, гайки, шайби',zn:'Рейки 41×41 і кронштейни',ss:'Кріплеж притисків A2, пластина заземлення',cu:'Втулки обтискні Cu',al:'Притиски крайні Al',rope:'Трос безпеки Ø3'};
function nodeF(mi){ const md=MODS[mi]; if(!md) return null; closeNode(true); const N=xNew(state.proj,mi,0.16), C=FCN[md.n], o=new V3().setFromMatrixPosition(md.T), w=md.c.clone().sub(o).normalize();
  const ord=Object.keys(C).sort((a,b)=>(FXO[a]||0)-(FXO[b]||0)||a.localeCompare(b));
  ord.forEach((c,Lv)=>{ const L=C[c], tot=Object.values(L).reduce((a,v)=>a+v,0), nm=md.n==='kozyrok'&&c==='zn'?'Пластини, консолі, підкоси':FLN[c]||c;
    const ly=xLayer(N,Lv,nm,`${tot} шт`); ly.ex=w.clone().multiplyScalar(Lv*N.step); const d=Object.entries(L).map(([k,v])=>`${k} — ${v}`).join('; ');
    const im=NG[md.n]&&NG[md.n][c]; if(im) xPart(ly,im.geometry,im.material,md.T.clone(),{t:nm,d}); ly.d=d; });
  const LvM=ord.length, lyM=xLayer(N,LvM,md.n==='kozyrok'?'Модуль ZNSHINE 730 Вт, 25°':'Модуль ZNSHINE 730 Вт','1 шт'); lyM.ex=w.clone().multiplyScalar(LvM*N.step);
  const K=md.n==='kozyrok'?mi-FP.V.length:mi, im=md.n==='kozyrok'?FP.pc:FP.IDX.L.indexOf(K)>=0?FP.pvL:FP.pvP, ii=md.n==='kozyrok'?K:(im===FP.pvL?FP.IDX.L:FP.IDX.P).indexOf(K);
  if(ii>=0){ const M=xHide(N,im,ii); xPart(lyM,im.geometry,im.material,M,{t:'Модуль ZNSHINE ZXN8-BD132-730, 730 Вт',d:'2 384 × 1 303 × 33, 36,5 кг; 4 притиски на рейках.'}); lyM.d='2 384 × 1 303 × 33, 36,5 кг; 4 притиски на рейках.'; }
  SKIPF=mi; fghost(true); upd(true);
  N.title=md.n==='kozyrok'?'Модуль козирка 25°':'Модуль на фасаді'; N.sub=md.n==='kozyrok'?'консолі з підкосами на хімічних анкерах M12 · трос безпеки':`${NAME[md.n]} · 2 рейки на 4 кронштейнах, анкери M10 · трос безпеки`;
  N.c=md.c.clone(); N.kind='fn'; N.vdir=w.clone().multiplyScalar(0.85).add(new V3(0,0.45,0)).addScaledVector(new V3(1,0,0).applyMatrix4(new THREE.Matrix4().extractRotation(md.T)),0.45).normalize(); N.vd=xPhone()?5.2:3.6; N.top=0.4;
  xShow(N,true); N.shown=true; return N; }
{ const cn0=closeNode; closeNode=function(){ const was=XN&&XN.kind==='fn'; const r=cn0.apply(this,arguments); if(was){ SKIPF=-1; fghost(false); upd(true); } return r; }; }
{ const SIMP=new Set([FP.vr,FP.vbr,FP.vcl,FP.arm,FP.strut,FP.plate,FP.anc,FP.clp].filter(Boolean)), NGS=new Set(); Object.values(NG).forEach(cls=>Object.values(cls).forEach(im=>NGS.add(im)));
  XB.push({has:o=>o===FP.pvL||o===FP.pvP||o===FP.pc||SIMP.has(o)||NGS.has(o),build:(o,id,p)=>{ let mi=-1;
    if(o===FP.pvL) mi=FP.IDX.L[id]; else if(o===FP.pvP) mi=FP.IDX.P[id]; else if(o===FP.pc) mi=FP.V.length+id;
    else if(p){ let bd=1e9; MODS.forEach((m,i)=>{ const d=m.c.distanceToSquared(p); if(d<bd){ bd=d; mi=i; } }); }
    return mi>=0?nodeF(mi):null; }}); }
window.__twin.facnode={MODS,NG,upd,nodeF,get SEL(){ return SEL; },setEx:f=>{ if(Math.abs(f-EXF)<1e-4) return; EXF=f; fghost(f>0); upd(true); }};
} }
