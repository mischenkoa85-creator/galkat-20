(function(){
"use strict";
const $=s=>document.querySelector(s);
const D2R=Math.PI/180;
const nf=(v,d)=>Number(v).toLocaleString('uk-UA',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(typeof THREE==='undefined'||!THREE.OrbitControls){ $('#loading').textContent='Не вдалося завантажити 3D-бібліотеку. Перевірте з’єднання й оновіть сторінку.'; return; }

// ================= геометрія майданчика (м; X — осі 1→17, Y — осі А→К, на північ)
const S=DATA.site, HV=S.HV, HE=S.HE, FL=S.FL, SPANS=S.spans, SHOP=S.shop;
function arch(X){ X=Math.max(0,Math.min(96,X)); for(const s of SPANS){ if(X>=s[0]-1e-9&&X<=s[1]+1e-9){ const c=(s[0]+s[1])/2, h=(s[1]-s[0])/2-FL, d=X-c; if(Math.abs(d)>=h) return [0,0]; return [s[2]*(1-d*d/h/h), -2*s[2]*d/h/h]; } } return [0,0]; }
const roofZ=X=>HV+arch(X)[0], roofK=X=>arch(X)[1];
const T11=Math.tan(11*D2R), T17=Math.tan(17*D2R), T22=Math.tan(22*D2R);
const POLY={A:[[54.98,-25.08],[66.55,-25.03],[70.82,-24.51],[73.5,-24.51],[73.5,-15.5],[53.75,-18.65]],
            B:[[73.5,-24.5],[98.1,-24.5],[98.1,-12.5],[92.4,-12.5],[73.5,-15.5]],
            C1:[[98.1,-24.5],[146.1,-24.5],[146.1,-6.5],[98.1,-6.5]],
            C2:[[146.1,-24.5],[155.1,-24.5],[155.1,-6.5],[146.1,-6.5]]};
const WHF={A:(X,Y)=>HE+(Y+25.05)*T11, B:(X,Y)=>HE+(Y+24.5)*T11, C1:(X,Y)=>HE+(9-Math.abs(Y+15.5))*T22, C2:(X,Y)=>HE+(9-Math.abs(Y+15.5))*T17};
const SLOPE={A:11,B:11,C1:22,C2:17};
const TPS=[{b:[-0.5,19.5,96.6,107.1],h:4.5,n:'ТП-6923'},{b:[19.5,24.2,96.6,99.4],h:3.5,n:''},{b:[96.64,103.0,-0.4,34.6],h:4.5,n:'ТП-5913'}];
function inPoly(P,x,y){ let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i],b=P[j]; if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) c=!c; } return c; }
function partAt(X,Y){ if(X>=SHOP[0]&&X<=SHOP[1]&&Y>=SHOP[2]&&Y<=SHOP[3]) return 'R'; for(const k in POLY) if(inPoly(POLY[k],X,Y)) return k; return null; }
function surfZ(X,Y){ const p=partAt(X,Y); if(p==='R') return roofZ(X); if(p) return WHF[p](X,Y); for(const t of TPS){ const b=t.b; if(X>=b[0]&&X<=b[1]&&Y>=b[2]&&Y<=b[3]) return t.h; } return null; }

// ================= three.js
const V3=THREE.Vector3, M4=THREE.Matrix4, Q=THREE.Quaternion;
const W=(X,Y,h)=>new V3(X,h,-Y);
const XA=new V3(1,0,0), ZA=new V3(0,0,1);
const canvas=$('#gl');
let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:false}); }catch(e){ $('#loading').textContent='WebGL недоступний у цьому переглядачі.'; return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,1,0.1,3000);
const controls=new THREE.OrbitControls(camera,canvas);
controls.enableDamping=true; controls.dampingFactor=0.12; controls.maxPolarAngle=Math.PI*0.495; controls.screenSpacePanning=false;
let need=true;
function sceneBg(){ const c=getComputedStyle(document.documentElement).getPropertyValue('--sky').trim(); scene.background=new THREE.Color(c||'#dfe6ec'); need=true; }
sceneBg();
try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change',sceneBg); }catch(e){}
new MutationObserver(sceneBg).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
const hemi=new THREE.HemisphereLight(0xeef3ff,0x8a8f7a,0.55); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff4e0,0.95); sun.castShadow=true;
const SMAP=renderer.capabilities.maxTextureSize>=4096&&window.innerWidth>=900?4096:2048; sun.shadow.mapSize.set(SMAP,SMAP);
{ const c=sun.shadow.camera; c.left=-120; c.right=120; c.top=120; c.bottom=-120; c.near=1; c.far=700; }
sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.04;
const CEN=[72,46]; sun.target.position.copy(W(CEN[0],CEN[1],0)); scene.add(sun,sun.target);

const std=(color,o={})=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:0.85,metalness:0.0},o));
const MAT={
  ground:std(0xb3bba9), roof:std(0xa3abaf,{roughness:0.95,side:THREE.DoubleSide}), wall:std(0xd6d2c8,{side:THREE.DoubleSide}),
  lan:std(0xc9d6dc,{roughness:0.3,metalness:0.1}), obs:std(0x7f8a90,{metalness:0.4,roughness:0.5}),
  whRoof:std(0xa7a59c,{side:THREE.DoubleSide}), whWall:std(0xcfc9bb,{side:THREE.DoubleSide}), tp:std(0xc2bfb5),
  pv:std(0x1f2f45,{roughness:0.35,metalness:0.25}), pvI:std(0xffffff,{roughness:0.4,metalness:0.2}), pvIGhost:std(0xffffff,{roughness:0.6,metalness:0.0,transparent:true,opacity:0.55,depthWrite:false}),
  lag:std(0xffffff,{metalness:0.5,roughness:0.45}), conc:std(0xb8b6ae), steel:std(0x9aa5ad,{metalness:0.6,roughness:0.4}),
  cont:std(0xe9ecee,{roughness:0.6}), cab:std(0xd7dcdf,{roughness:0.5}), spd:std(0xe0782b,{roughness:0.5,emissive:0x3a1a05}),
  cone:new THREE.MeshBasicMaterial({color:0xdc9a52,transparent:true,opacity:0.13,depthWrite:false,side:THREE.DoubleSide}),
  mast:std(0x8e979c,{metalness:0.7,roughness:0.35}), slab:std(0xa9aba5)};
Object.values(MAT).forEach(m=>{ if(m.color) m.color.convertSRGBToLinear(); if(m.emissive) m.emissive.convertSRGBToLinear(); });
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
function mesh(g,m,parent,shadow=true){ const o=new THREE.Mesh(g,m); o.castShadow=shadow; o.receiveShadow=true; parent.add(o); return o; }
function box(w,h,d,m,x,y,z,parent){ const o=mesh(new THREE.BoxGeometry(w,h,d),m,parent); o.position.set(x,y,z); return o; }
function lines(pairs,color,parent,opts={}){ const a=new Float32Array(pairs.length*3); pairs.forEach((v,i)=>{ a[i*3]=v.x; a[i*3+1]=v.y; a[i*3+2]=v.z; });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(a,3));
  const o=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,transparent:!!opts.opacity,opacity:opts.opacity||1})); o.frustumCulled=false; parent.add(o); return o; }
const pairsOf=(pts,acc)=>{ for(let i=0;i<pts.length-1;i++) acc.push(pts[i],pts[i+1]); return acc; };
// траса по поверхнях: над дахами з відступом, проміжки — у повітрі, поза дахом — на землі
function route(X1,Y1,X2,Y2,off,gnd){ const L=Math.hypot(X2-X1,Y2-Y1), n=Math.max(1,Math.ceil(L/0.5)), hA=surfZ(X1,Y1), hB=surfZ(X2,Y2), out=[]; let prev=null;
  for(let i=0;i<=n;i++){ const t=i/n, X=X1+(X2-X1)*t, Y=Y1+(Y2-Y1)*t; let h=surfZ(X,Y), air=false;
    if(h===null){ if(hA!==null&&hB!==null){ h=hA+(hB-hA)*t; air=true; } else h=gnd; }
    const v=W(X,Y,h+(air?0:off)); if(prev&&Math.abs(prev.y-v.y)>1.2&&!air) out.push(W(X,Y,prev.y)); out.push(v); prev=v; }
  return out; }
const G={}; function grp(name,parent){ const g=new THREE.Group(); g.name=name; (parent||scene).add(g); G[name]=g; return g; }
['site','rp','rpBase','rpBZ','ours','oursBase','oursBZ'].forEach(n=>grp(n));
G.rp.add(G.rpBase,G.rpBZ); G.ours.add(G.oursBase,G.oursBZ);
const PICK=[];   // {obj, info(instanceId)}

// ================= будівлі
{ const g=mesh(new THREE.PlaneGeometry(520,420),MAT.ground,G.site,false); g.rotation.x=-Math.PI/2; g.position.set(75,-0.02,-48); }
const roofXs=[]; for(let x=SHOP[0];x<SHOP[1];x+=0.25) roofXs.push(x); roofXs.push(SHOP[1]);
{ const n=roofXs.length, pos=new Float32Array(n*6), idx=[];
  roofXs.forEach((X,i)=>{ const z=roofZ(X); pos.set([X,z,-SHOP[2], X,z,-SHOP[3]],i*6); });
  for(let i=0;i<n-1;i++){ const a=i*2; idx.push(a,a+2,a+1, a+1,a+2,a+3); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); mesh(g,MAT.roof,G.site,false);
  const prof=[]; for(let i=roofXs.length-1;i>=0;i--) prof.push(new THREE.Vector2(roofXs[i],roofZ(roofXs[i])));
  const sh=new THREE.Shape([new THREE.Vector2(SHOP[0],0),new THREE.Vector2(SHOP[1],0)].concat(prof)); const wg=new THREE.ShapeGeometry(sh);
  [SHOP[2],SHOP[3]].forEach(Y=>{ const m=mesh(wg,MAT.wall,G.site); m.position.z=-Y; });
  [SHOP[0],SHOP[1]].forEach(X=>{ const L=SHOP[3]-SHOP[2]; const m=mesh(new THREE.PlaneGeometry(L,HV),MAT.wall,G.site); m.rotation.y=Math.PI/2; m.position.set(X,HV/2,-(SHOP[2]+SHOP[3])/2); }); }
S.lan.forEach(l=>{ const zb=Math.min(roofZ(l[0]),roofZ(l[1]))-0.05, zt=HV+l[4]; const o=box(l[1]-l[0],zt-zb,l[3]-l[2],MAT.lan,(l[0]+l[1])/2,(zb+zt)/2,-(l[2]+l[3])/2,G.site); o.userData.info={t:'Зенітний ліхтар',d:`${nf(l[1]-l[0],1)} × ${nf(l[3]-l[2],1)} м, на гребені арки`}; PICK.push({o}); });
S.obs.forEach(o=>{ const m=mesh(new THREE.CylinderGeometry(o[2]/2,o[2]/2,o[3],18),MAT.obs,G.site); m.position.set(o[0],roofZ(o[0])+o[3]/2-0.05,-o[1]); });
function prism(P,hF,wallMat,roofMat,parent,ridgeY){ const pos=[];
  for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], L=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.ceil(L/1.0));
    for(let k=0;k<n;k++){ const t0=k/n, t1=(k+1)/n, x0=a[0]+(b[0]-a[0])*t0, y0=a[1]+(b[1]-a[1])*t0, x1=a[0]+(b[0]-a[0])*t1, y1=a[1]+(b[1]-a[1])*t1, h0=hF(x0,y0), h1=hF(x1,y1);
      pos.push(x0,0,-y0, x1,0,-y1, x1,h1,-y1, x0,0,-y0, x1,h1,-y1, x0,h0,-y0); } }
  const wg=new THREE.BufferGeometry(); wg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); wg.computeVertexNormals(); mesh(wg,wallMat,parent);
  const pieces=ridgeY===undefined?[P]:[P.map(p=>[p[0],Math.min(p[1],ridgeY)]),P.map(p=>[p[0],Math.max(p[1],ridgeY)])], rp=[];
  pieces.forEach(Qp=>{ const c=Qp.map(p=>new THREE.Vector2(p[0],p[1])), tr=THREE.ShapeUtils.triangulateShape(c,[]), cy=Qp.reduce((s,p)=>s+p[1],0)/Qp.length;
    tr.forEach(t=>t.forEach(i=>{ const p=Qp[i]; const yy=ridgeY===undefined?p[1]:(cy<ridgeY?Math.min(p[1],ridgeY-1e-6):Math.max(p[1],ridgeY+1e-6)); rp.push(p[0],hF(p[0],yy),-p[1]); })); });
  const rg=new THREE.BufferGeometry(); rg.setAttribute('position',new THREE.Float32BufferAttribute(rp,3)); rg.computeVertexNormals(); mesh(rg,roofMat,parent,false); }
Object.keys(POLY).forEach(k=>prism(POLY[k],WHF[k],MAT.whWall,MAT.whRoof,G.site,(k==='C1'||k==='C2')?-15.5:undefined));
TPS.forEach(t=>{ const b=t.b; const o=box(b[1]-b[0],t.h,b[3]-b[2],MAT.tp,(b[0]+b[1])/2,t.h/2,-(b[2]+b[3])/2,G.site); if(t.n){ o.userData.info={t:t.n,d:'Трансформаторна підстанція'}; PICK.push({o}); } });

// ================= модулі і кріплення
const BOX=new THREE.BoxGeometry(1,1,1);
function inst(geo,mat,n,parent,shadow=true){ const m=new THREE.InstancedMesh(geo,mat,Math.max(1,n)); m.count=n; m.castShadow=shadow; m.receiveShadow=true; parent.add(m); return m; }
const _p=new V3(), _q=new Q(), _s=new V3(), _M=new M4(), ONE=new V3(1,1,1), ZERO=new M4().makeScale(0,0,0), QI=new Q(), white=new THREE.Color(1,1,1);
// текстура модуля: 132 напівелементи, 6 × 22
const pvTex=(()=>{ const c=document.createElement('canvas'); c.width=528; c.height=288; const x=c.getContext('2d');
  x.fillStyle='#dfe5ec'; x.fillRect(0,0,528,288); x.fillStyle='#22345f'; const cw=(528-16)/22, ch=(288-16)/6;
  for(let i=0;i<22;i++) for(let j=0;j<6;j++) x.fillRect(8+i*cw+1.2,8+j*ch+1.2,cw-2.4,ch-2.4);
  x.fillStyle='#dfe5ec'; x.fillRect(262,8,4,272); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t; })();
const pvTexP=pvTex.clone(); pvTexP.center.set(0.5,0.5); pvTexP.rotation=Math.PI/2; pvTexP.needsUpdate=true;
MAT.pvL=new THREE.MeshStandardMaterial({color:0xffffff,map:pvTex,roughness:0.38,metalness:0.2});
MAT.pvP=new THREE.MeshStandardMaterial({color:0xffffff,map:pvTexP,roughness:0.38,metalness:0.2});
MAT.pvPG=new THREE.MeshStandardMaterial({color:0xffffff,map:pvTexP,roughness:0.6,transparent:true,opacity:0.5,depthWrite:false}); MAT.pvPK=new THREE.MeshStandardMaterial({color:lin(0x5d7fae),roughness:0.5,transparent:true,opacity:0.22,depthWrite:false});
MAT.pvLG=new THREE.MeshStandardMaterial({color:lin(0x5d7fae),roughness:0.5,transparent:true,opacity:0.22,depthWrite:false});
MAT.zn=std(0xb9c3ca,{metalness:0.55,roughness:0.42}); MAT.znD=std(0x8d989f,{metalness:0.6,roughness:0.4}); MAT.blk=std(0xa3a199,{roughness:0.95}); MAT.mat=std(0x2b2b2b,{roughness:0.95});
MAT.hw=std(0x6d757b,{metalness:0.7,roughness:0.35}); MAT.al=std(0xd5dadd,{metalness:0.5,roughness:0.35}); MAT.sp=std(0xc5ccd1,{metalness:0.5,roughness:0.4,side:THREE.DoubleSide});
MAT.rod=std(0xc0392b,{metalness:0.4,roughness:0.45}); MAT.rodP=std(0xe0782b,{metalness:0.4,roughness:0.45}); MAT.sl=std(0x7f8f99,{metalness:0.6,roughness:0.35}); MAT.anc=std(0xc0392b,{roughness:0.6});
['zn','znD','blk','mat','hw','al','sp','rod','rodP','sl','anc'].forEach(k=>MAT[k].color.convertSRGBToLinear());
// окремі матеріали для сіток з кольором на екземпляр (r128 не розрізняє програми з instanceColor і без нього на одному матеріалі)
MAT.pvLr=MAT.pvL.clone(); MAT.pvPo=MAT.pvP.clone(); MAT.conM=MAT.znD.clone();
const WHM=DATA.rp.mods.filter(m=>m[1]<=-1).map(m=>({X:m[0],Y:m[1],land:m[2],part:m[0]<73.5?'A':m[0]<98.1?'B':m[0]<146.1?'C1':'C2'}));
const WHI=[];
{ const land=WHM.filter(m=>m.land), port=WHM.filter(m=>!m.land);
  [[land,MAT.pvL],[port,MAT.pvP]].forEach(([list,mat])=>{ const im=inst(BOX,mat,list.length,G.site); WHI.push({im,n:list.length}); list.forEach((m,i)=>im.setColorAt(i,white));
    list.forEach((m,i)=>{ const sgn=(m.part==='C1'||m.part==='C2')&&m.Y>-15.5?-1:1; _q.setFromAxisAngle(XA,sgn*SLOPE[m.part]*D2R);
      _M.compose(W(m.X,m.Y,WHF[m.part](m.X,m.Y)+0.08),_q,m.land?_s.set(2.384,0.035,1.303):_s.set(1.303,0.035,2.384)); im.setMatrixAt(i,_M); });
    im.userData.info=()=>({t:'Склад: модуль на міні-рейках',d:'180 модулів на скатах профнастилу, однаково в обох проєктах (ЕТР арк. 2)'}); PICK.push({o:im}); }); }

// ---------- кріплення Вінницького проєкту: трикутник за кресленням АБ арк. 6 (база 1 400, пояс 1 160, стійка ≈345), мм у осях GLB → локальні метри
function b64(s,Ty){ const bin=atob(s), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return new Ty(u.buffer); }
const G2L=new M4().set(0,0.001,0,0, 0,0,-0.001,0, -0.001,0,0,0, 0,0,0,1);
function partGeo(k){ const g=TRI.geo[k], p=b64(g.p,Int16Array), idx=b64(g.i,g.u32?Uint32Array:Uint16Array);
  const pos=new Float32Array(p.length); for(let i=0;i<p.length;i++) pos[i]=p[i]/g.s;
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setIndex(new THREE.BufferAttribute(idx,1));
  const ng=geo.toNonIndexed(); ng.applyMatrix4(G2L); ng.computeVertexNormals(); return ng; }
function obbGeo(k){ const o=TRI.info.obb[k], g=new THREE.BoxGeometry(o.e[0],o.e[1],o.e[2]); const a=o.ax.map(v=>new V3(v[0],v[1],v[2]));
  g.applyMatrix4(new M4().makeBasis(a[0],a[1],a[2]).setPosition(o.c[0],o.c[1],o.c[2])); g.applyMatrix4(G2L); return g; }
const MOD_X=TRI.info.mod[0]/1000, MOD_H=TRI.info.mod[1]/1000;     // центр модуля від південного торця основи і над покрівлею
const RT=DATA.rpm.tris.map(t=>({X:t[0],Y:t[1],k:t[2],si:t[3],n:t[4]}));
RT.forEach(t=>{ t.F=new M4().compose(W(t.X,t.Y-MOD_X,roofZ(t.X)),new Q().setFromAxisAngle(ZA,Math.atan(roofK(t.X))),ONE); });
// сполучник посередині між основами сусідніх рядів: заходження = (700 − (крок − 1 400)) / 2
const CON=DATA.rpm.con.map(([i,j])=>{ const p=RT[j].Y-RT[i].Y, st=(1.4+p)/2-0.35; return {i,j,p,ov:Math.round((0.7-(p-1.4))/2*1000),M:new M4().copy(RT[i].F).multiply(new M4().makeTranslation(0,0,-st))}; });
// модулі: центр над трикутником 2j+1; показники для невідповідностей
const RMOD=[]; RT.forEach((t,i)=>{ if(t.k%2!==0) return; if(t.k>=2*t.n) return; const a=RT[i], m=RT[i+1], b=RT[i+2], th=[a,m,b].map(x=>Math.atan(roofK(x.X))/D2R);
  RMOD.push({i:i+1, sag:(roofZ(m.X)-(roofZ(a.X)+roofZ(b.X))/2)*1000, dth:Math.max(...th)-Math.min(...th), slope:Math.abs(th[1])}); });
const RPM_={}, ND=24; let XN=null;
{ const n=RT.length, P=G.rpBase;
  const lod=[['base',MAT.zn],['rail',MAT.zn],['strut',MAT.zn]].map(([k,m])=>{ const im=inst(obbGeo(k),m,n,P); RT.forEach((t,i)=>im.setMatrixAt(i,t.F)); return im; });
  const blk=inst(partGeo('block'),MAT.blk,n,P), mat=inst(partGeo('mat'),MAT.mat,n,P,false);
  RT.forEach((t,i)=>{ blk.setMatrixAt(i,t.F); mat.setMatrixAt(i,t.F); });
  mat.userData.info=()=>({t:'Мат під баласт',d:'Під кожен блок; 5 396 за АБ арк. 8'}); PICK.push({o:mat,when:()=>state.proj==='rp'});
  RPM_.lod=lod; RPM_.blk=blk; RPM_.mat=mat;
  const MODL=new M4().compose(new V3(0,MOD_H,-MOD_X),new Q().setFromAxisAngle(XA,15*D2R),new V3(2.384,0.035,1.303));
  const im=inst(BOX,MAT.pvLr,RMOD.length,P); RMOD.forEach((m,j)=>{ im.setMatrixAt(j,_M.copy(RT[m.i].F).multiply(MODL)); im.setColorAt(j,white); });
  im.userData.info=j=>{ const m=RMOD[j]; return {t:'Модуль Shinefar SF-M21/G132710, 710 Вт',d:`Альбомно на трикутниках 15°. Ухил покрівлі під модулем ${nf(m.slope,1)}°; середній трикутник вищий за лінію крайніх на ${nf(Math.max(0,m.sag),0)} мм; різниця нахилу опор ${nf(m.dth,1)}°.`}; };
  PICK.push({o:im,when:()=>!(state.sec==='km'&&state.lay.ghost)}); RPM_.mods=im;
  // спойлер Vitr-240×2450 на стійках, від трикутника 2j на схід
  const sp=DATA.rpm.sp, spm=inst(partGeo('spoiler'),MAT.sp,sp.length,P); sp.forEach((i,j)=>spm.setMatrixAt(j,RT[i].F)); RPM_.sp=spm;
  spm.userData.info=()=>({t:'Спойлер Vitr-240×2450',d:'Планка за стійками вздовж ряду, перекриває два трикутники (АБ арк. 6, поз. 6)'}); PICK.push({o:spm,when:()=>state.sec==='km'});
  // притиски W35 / Z33 — на поясах трикутників стиків і кінців ряду, по 2 на пояс (схема)
  const ev=RT.filter(t=>t.k%2===0), cl=inst(BOX,MAT.al,ev.length*2,P,false); const ca=Math.cos(15*D2R), sa=Math.sin(15*D2R);
  ev.forEach((t,i)=>[-0.33,0.33].forEach((s,q)=>{ _M.copy(t.F).multiply(new M4().compose(new V3(0,MOD_H+s*sa+0.022,-MOD_X-s*ca),new Q().setFromAxisAngle(XA,15*D2R),new V3(0.035,0.012,0.05))); cl.setMatrixAt(i*2+q,_M); }));
  cl.userData.info=i=>{ const t=ev[i>>1]; return {t:t.k===0||t.k===2*t.n?'Притиск Z33 (крайній)':'Притиск W35 (середній)',d:'По 2 на пояс, місце — схема; АБ арк. 8: W35 — 2 520, Z33 — 3 232'}; }; PICK.push({o:cl,when:()=>state.proj==='rp'&&state.sec==='km'}); RPM_.cl=cl;
  // сполучники Spol-15Zn-700 між основами сусідніх рядів
  const con=inst(obbGeo('con'),MAT.conM,CON.length,P); CON.forEach((c,j)=>{ con.setMatrixAt(j,c.M); con.setColorAt(j,white); }); RPM_.con=con;
  const conInfo=j=>{ const c=CON[j]; return {t:'Сполучник Spol-15Zn-700',d:`U 38×36×3, L 700, болт M8 у кожну основу. Крок рядів тут ${nf(c.p*1000,0)} мм, між основами ${nf(c.p*1000-1400,0)} мм — ${c.ov>0?'заходження '+c.ov+' мм':'до основ не дістає'+(c.ov<0?' ('+(-c.ov)+' мм)':'')}; на кресленні — крок 2 000, по 50 мм в основу.`}; };
  con.userData.info=conInfo; PICK.push({o:con,when:()=>state.proj==='rp'});
  const trInfo=i=>{ const t=RT[i]; return {t:'Трикутник BalZn15-1568.1470, 15°',d:`За АБ арк. 6: U 45×40×3, основа 1 400, пояс 1 160, стійка ≈345, 3 болти M8; 2 блоки 300×300×60 по 13 кг на матах, виступають за основу на 85 мм (1 568 у марці — габарит по блоках), гвинт R-LX у кожен блок. Відрізок ряду з ${t.n} модулів.`}; };
  lod.forEach(im=>{ im.userData.info=trInfo; PICK.push({o:im,when:()=>state.proj==='rp'}); });
  blk.userData.info=()=>({t:'Баласт B300300-60, 13 кг',d:'2 на трикутник, центри за 65 мм від торців основи; мат, гвинт R-LX 6,3×50 крізь основу'}); PICK.push({o:blk,when:()=>state.proj==='rp'});
  RPM_.det=[['base',MAT.zn],['rail',MAT.zn],['strut',MAT.zn],['hw',MAT.hw]].map(([k,m])=>{ const im=inst(partGeo(k),m,ND,P); im.count=0; im.frustumCulled=false; return im; });
  RPM_.detC=[['con',MAT.znD],['conhw',MAT.hw]].map(([k,m])=>{ const im=inst(partGeo(k),m,ND,P); im.count=0; im.frustumCulled=false; return im; });
  RPM_.det.forEach(im=>{ im.userData.info=k=>trInfo(RPM_.cur[k]); PICK.push({o:im,when:()=>state.proj==='rp'}); });
  RPM_.detC.forEach(im=>{ im.userData.info=k=>conInfo(RPM_.curC[k]); PICK.push({o:im,when:()=>state.proj==='rp'}); });
  RPM_.cur=[]; RPM_.curC=[]; }
const conOf=new Map(CON.map((c,j)=>[c.i,j]));
function rpDetail(){ if(!G.rp.visible) return; const tg=controls.target, near=camera.position.distanceTo(tg)<34;
  RPM_.cur.forEach(i=>RPM_.lod.forEach(im=>im.setMatrixAt(i,RT[i].F))); RPM_.curC.forEach(j=>RPM_.con.setMatrixAt(j,CON[j].M));
  const xr=XN&&XN.proj==='rp'?XN:null; if(xr){ xr.tris.forEach(i=>RPM_.lod.forEach(im=>im.setMatrixAt(i,ZERO))); xr.cons.forEach(j=>RPM_.con.setMatrixAt(j,ZERO)); }
  let pick=[];
  if(near){ const tx=tg.x, ty=-tg.z; pick=RT.map((t,i)=>[(t.X-tx)**2+(t.Y-ty)**2,i]).filter(a=>a[0]<14*14&&!(xr&&xr.triSet.has(a[1]))).sort((a,b)=>a[0]-b[0]).slice(0,ND).map(a=>a[1]); }
  const pc=pick.filter(i=>conOf.has(i)).map(i=>conOf.get(i)).filter(j=>!(xr&&xr.conSet.has(j)));
  pick.forEach((i,k)=>{ RPM_.lod.forEach(im=>im.setMatrixAt(i,ZERO)); RPM_.det.forEach(im=>im.setMatrixAt(k,RT[i].F)); });
  pc.forEach((j,k)=>{ RPM_.con.setMatrixAt(j,ZERO); RPM_.detC.forEach(im=>im.setMatrixAt(k,CON[j].M)); });
  RPM_.det.forEach(im=>{ im.count=pick.length; im.instanceMatrix.needsUpdate=true; }); RPM_.detC.forEach(im=>{ im.count=pc.length; im.instanceMatrix.needsUpdate=true; });
  RPM_.lod.forEach(im=>im.instanceMatrix.needsUpdate=true); RPM_.con.instanceMatrix.needsUpdate=true;
  RPM_.cur=pick; RPM_.curC=pc; need=true; }

// ---------- Наш варіант Б: модулі паралельно покрівлі на прямих лагах
const OM=DATA.ours.mods.map(m=>({Xa:m[0],Xb:m[1],Y:m[2],b:m[3]}));
const ourMods=inst(BOX,MAT.pvPo,OM.length,G.oursBase);
OM.forEach((m,i)=>{ const za=roofZ(m.Xa)+0.104, zb=roofZ(m.Xb)+0.104, ang=Math.atan2(zb-za,m.Xb-m.Xa), L=Math.hypot(m.Xb-m.Xa,zb-za)-0.02;
  _q.setFromAxisAngle(ZA,ang); const up=new V3(-Math.sin(ang),Math.cos(ang),0);
  _p.copy(W((m.Xa+m.Xb)/2,m.Y,(za+zb)/2)).addScaledVector(up,0.0175); _M.compose(_p,_q,_s.set(L,0.035,2.384)); ourMods.setMatrixAt(i,_M); });
const BLK=DATA.ours.blocks;
ourMods.userData.info=i=>state.sec==='bz'?{t:`Модуль · блок каркаса ${OM[i].b}`,d:(b=>b?`Блок ${b.no}: ${b.n} ліній лаг, ${nf(b.mods)} модулів; 2 приєднання до провідника вирівнювання`:'')(BLK.find(x=>x.no===OM[i].b))}:{t:'Модуль ZNSHINE ZXN8-BD132-730, 730 Вт',d:'Паралельно покрівлі на лагах 41×41, низ рами на 104 мм над покрівлею'}; PICK.push({o:ourMods,when:()=>!(state.sec==='km'&&state.lay.ghost)});
const LG=DATA.ours.lines, LX=i=>LG[i][0];
// кадр у точці X, Y, висота h над покрівлею вздовж нормалі
function rf(X,Y,h,out){ const k=roofK(X), a=Math.atan(k); _q.setFromAxisAngle(ZA,a); const up=new V3(-Math.sin(a),Math.cos(a),0); _p.copy(W(X,Y,roofZ(X))).addScaledVector(up,h); return _p; }
const lagMesh=inst(BOX,MAT.lag,LG.length,G.oursBase);
LG.forEach((l,i)=>{ rf(l[0],(l[1]+l[2])/2,0.0835); _M.compose(_p,_q,_s.set(0.041,0.041,l[2]-l[1])); lagMesh.setMatrixAt(i,_M); });
const BLKCOL=['#2f6fdb','#e0782b','#2c9a5b','#c23b6b','#7b5bd6','#c9a227','#1aa3b4','#d9534f','#5c8f2f','#a0522d','#3a7ca5','#e377c2','#8c6d31','#17becf','#9467bd','#bcbd22','#ff7f0e','#2ca02c','#d62728'];
const steelCol=lin(0x9aa5ad);
function lagColors(byBlock){ LG.forEach((l,i)=>lagMesh.setColorAt(i,byBlock&&l[3]?lin(BLKCOL[(l[3]-1)%BLKCOL.length]):steelCol)); lagMesh.instanceColor.needsUpdate=true; }
function modColors(byBlock){ OM.forEach((m,i)=>ourMods.setColorAt(i,byBlock&&m.b?lin(BLKCOL[(m.b-1)%BLKCOL.length]):white)); ourMods.instanceColor.needsUpdate=true; }
lagColors(false); modColors(false);
lagMesh.userData.info=i=>{ const b=BLK.find(x=>x.no===LG[i][3]); return state.sec==='bz'?{t:`Лага 41×41×1,5 · блок каркаса ${b?b.no:'—'}`,d:b?`${b.n} ліній лаг, ${nf(b.mods)} модулів; 2 приєднання до провідника вирівнювання`:''}:{t:'Лага 41×41×1,5 пазом догори',d:`Лінія ${nf(LG[i][2]-LG[i][1],1)} м: шматки 4 800 і 2 400, стики в гільзах 200`}; }; PICK.push({o:lagMesh});
const OD=DATA.det, OUR={};
{ const P=G.oursBase;
  const B=[...OD.blk.map(b=>[LX(b[0]),b[1],1]),...OD.eblk.map(b=>[LX(b[0]),b[1],1]),...OD.xblk.map(b=>[b[0],b[1],0])];
  const blk=inst(BOX,MAT.blk,B.length,P), mat=inst(BOX,MAT.mat,B.filter(b=>b[2]).length,P,false); let m=0;
  B.forEach((b,i)=>{ rf(b[0],b[1],b[2]?0.033:0.03); _M.compose(_p,_q,_s.set(0.3,0.06,0.3)); blk.setMatrixAt(i,_M); if(b[2]){ rf(b[0],b[1],0.0015); _M.compose(_p,_q,_s.set(0.32,0.003,0.32)); mat.setMatrixAt(m++,_M); } });
  blk.userData.info=i=>i<OD.blk.length?{t:'Блок «Баласт із муфтою» 300×300×60, 13 кг',d:'Під лагою, 575 + 1 200·k від торця; мат 320×320×3; лага — болтом M8×20 у муфту'}:i<OD.blk.length+OD.eblk.length?{t:'Блок під кінцем лаги',d:'Центр за 30 мм від торця лаги, з матом'}:{t:'Блок під крайнім профілем',d:'2 на модуль, за 300 мм від осей лаг, без мата'};
  PICK.push({o:blk,when:()=>state.proj==='ours'}); OUR.blk=blk; OUR.mat=mat;
  const sl=inst(BOX,MAT.sl,OD.sl.length,P), cp=inst(BOX,MAT.hw,OD.sl.length,P); sl.userData.info=()=>({t:'Гільза П 45,5×35×2, L 200, з муфтою M10×50',d:'На стику модулів під лагою, 2 болти M10×60 крізь лагу; муфта знизу — права і ліва різьба під шпильки'});
  OD.sl.forEach((s,i)=>{ rf(LX(s[0]),s[1],0.0785); _M.compose(_p,_q,_s.set(0.0455,0.035,0.2)); sl.setMatrixAt(i,_M); rf(LX(s[0]),s[1],0.0525); _M.compose(_p,_q,_s.set(0.05,0.017,0.017)); cp.setMatrixAt(i,_M); }); cp.userData.info=sl.userData.info; PICK.push({o:cp,when:()=>state.proj==='ours'});
  PICK.push({o:sl,when:()=>state.proj==='ours'}); OUR.sl=sl; OUR.cp=cp;
  const rods=[...OD.rods], rd=inst(BOX,MAT.rod,rods.length,P);
  rods.forEach((r,i)=>{ const xa=LX(r[0])+0.025, xb=LX(r[1])-0.025, za=roofZ(xa)+0.0525, zb=roofZ(xb)+0.0525, a=Math.atan2(zb-za,xb-xa);
    _M.compose(W((xa+xb)/2,r[2],(za+zb)/2),_q.setFromAxisAngle(ZA,a),_s.set(Math.hypot(xb-xa,zb-za),0.01,0.01)); rd.setMatrixAt(i,_M); rd.setColorAt(i,r[3]===2?lin(0xe0782b):white); });
  rd.userData.info=i=>rods[i][3]===2?{t:'Шпилька M10 через прохід на гребені',d:'570 / 790 / 1 580 мм; права / ліва різьба, контргайки'}:{t:'Шпилька M10 1 299 мм',d:'Між муфтами гільз сусідніх лаг, права різьба із заходу, ліва — зі сходу'}; PICK.push({o:rd,when:()=>state.proj==='ours'}); OUR.rods=rd;
  const xp=inst(BOX,MAT.zn,OD.xp.length,P), ang=inst(BOX,MAT.hw,OD.xp.length*2,P);
  OD.xp.forEach((x,i)=>{ const xa=LX(x[0])+0.0295, xb=LX(x[1])-0.0295, za=roofZ(xa)+0.0805, zb=roofZ(xb)+0.0805, a=Math.atan2(zb-za,xb-xa);
    _M.compose(W((xa+xb)/2,x[2],(za+zb)/2),_q.setFromAxisAngle(ZA,a),_s.set(Math.hypot(xb-xa,zb-za),0.041,0.041)); xp.setMatrixAt(i,_M);
    [[LX(x[0])+0.0245],[LX(x[1])-0.0245]].forEach(([X],k)=>{ rf(X,x[2]-x[3]*0.0965,0.0825); _M.compose(_p,_q,_s.set(0.008,0.039,0.16)); ang.setMatrixAt(i*2+k,_M); }); });
  xp.userData.info=i=>OD.xp[i][4]?{t:'Профіль 41×41 через прохід',d:'530 / 760 / 1 540 мм на кутниках 160/150 між верхніми лагами двох схилів'}:{t:'Крайній профіль 41×41×1,5, ≈1 263 мм',d:'На краю ряду між лагами, на 2 блоках без мата; кутники 160/150 t = 8, Z33 на модулі'};
  PICK.push({o:xp,when:()=>state.proj==='ours'}); OUR.xp=xp; OUR.ang=ang;
  const cl=inst(BOX,MAT.al,OD.cl.length,P,false); OD.cl.forEach((c,i)=>{ rf(LX(c[0]),c[1],0.143); _M.compose(_p,_q,_s.set(0.05,0.012,0.04)); cl.setMatrixAt(i,_M); }); OUR.cl=cl; cl.userData.info=i=>OD.cl[i][2]?{t:'Притиск Z33 (крайній)',d:'На крайньому профілі або кінці лаги, болт M8 у паз лаги'}:{t:'Притиск середній',d:'Між рамами сусідніх модулів, болт M8 з гайкою з пружиною в паз лаги'}; PICK.push({o:cl,when:()=>state.proj==='ours'&&state.sec==='km'});
  const an=inst(new THREE.CylinderGeometry(0.06,0.06,0.16,12),MAT.anc,OD.an.length,P); OD.an.forEach((a,i)=>{ rf(LX(a[0])+0.12,a[1],0.08); _M.compose(_p,_q,ONE); an.setMatrixAt(i,_M); });
  an.userData.info=()=>({t:'Анкер від сповзання',d:'На верхній лазі ряду, що не переходить гребінь; тип і кріплення — за обстеженням покрівлі'}); PICK.push({o:an,when:()=>state.proj==='ours'}); OUR.an=an; }

// ================= Вінницький проєкт — БЗ
const RP=DATA.rp;
const L4=RP.masts.filter(m=>m[2]===4), L6=RP.masts.filter(m=>m[2]===6);
function mastBase(x,y){ let top=null; for(const dx of [-0.3,0,0.3]) for(const dy of [-0.3,0,0.3]){ const z=surfZ(x+dx,y+dy); if(z!==null&&(top===null||z>top)) top=z; } return top===null?0:top; }
const rpBZ={};
{ const all=RP.masts; const rod=inst(new THREE.CylinderGeometry(1,1,1,10),MAT.mast,all.length,G.rpBZ), base=inst(new THREE.CylinderGeometry(0.28,0.32,0.18,16),MAT.conc,all.length,G.rpBZ);
  all.forEach((m,i)=>{ const z=mastBase(m[0],m[1]); _M.compose(W(m[0],m[1],z+m[2]/2),_q.set(0,0,0,1),_s.set(0.045,m[2],0.045)); rod.setMatrixAt(i,_M); _M.compose(W(m[0],m[1],z+0.09),_q,_s.set(1,1,1)); base.setMatrixAt(i,_M); });
  rod.userData.info=i=>{ const m=all[i]; return m[2]===4?{t:'Щогла М-04/40, 4 м',d:'На бетонній основі серед рядів; захисний кут 68°, радіус на рівні основи 9,9 м (БЗ арк. 2)'}:{t:'Щогла М-05/60, 6 м',d:'Біля майданчика MS-3; радіус на рівні основи 6,4 м (БЗ арк. 2)'}; };
  PICK.push({o:rod,when:()=>state.proj==='rp'&&state.sec==='bz'}); rpBZ.masts=[rod,base];
  const cones=new THREE.Group(); G.rpBZ.add(cones); rpBZ.cones=cones;
  all.forEach(m=>{ const z=mastBase(m[0],m[1]), h=m[2], R=h===4?9.9:6.4; const c=new THREE.Mesh(new THREE.ConeGeometry(R,h,48,1,true),MAT.cone); c.position.copy(W(m[0],m[1],z+h/2)); c.renderOrder=2; cones.add(c); }); }
{ const pr=[]; RP.wire.forEach(s=>pairsOf(route(s[0],s[1],s[2],s[3],0.12,0.1),pr)); rpBZ.wire=lines(pr,0x2a9fd0,G.rpBZ);
  const dp=[]; RP.down.forEach(p=>{ const top=mastBase(p[0],p[1]); dp.push(W(p[0],p[1],top),W(p[0],p[1],0.9)); });
  rpBZ.down=lines(dp,0x2a9fd0,G.rpBZ);
  const tj=inst(new THREE.BoxGeometry(0.16,0.22,0.08),MAT.cab,RP.down.length,G.rpBZ); RP.down.forEach((p,i)=>{ _M.compose(W(p[0],p[1],0.9),_q.set(0,0,0,1),_s.set(1,1,1)); tj.setMatrixAt(i,_M); });
  tj.userData.info=i=>({t:'Спуск і контрольне з’єднання',d:`Спуск ${i+1} з ${RP.down.length}: дріт Ø8 по фасаду, заземлювач у землі`}); PICK.push({o:tj,when:()=>state.proj==='rp'&&state.sec==='bz'}); rpBZ.tj=tj;
  const bp=[]; RP.bond.forEach(s=>pairsOf(route(s[0],s[1],s[2],s[3],0.06,0.05),bp)); rpBZ.bond=lines(bp,0x3cae4f,G.rpBZ,{opacity:0.85});
  const ep=[]; RP.strip.forEach(s=>ep.push(W(s[0],s[1],0.03),W(s[2],s[3],0.03))); RP.rods.forEach(r=>ep.push(W(r[0],r[1],0.03),W(r[0],r[1],-1.2)));
  rpBZ.earth=lines(ep,0x8a5a2b,G.rpBZ); }
// майданчики УЗЕ за РП (шафи FFD, Galaxy261L)
const ESS=[];
RP.pads.forEach(p=>{ ESS.push(box(p.x1-p.x0,0.3,p.y1-p.y0,MAT.slab,(p.x0+p.x1)/2,0.15,-(p.y0+p.y1)/2,G.rpBase));
  const cab=(r,h,info)=>{ const o=box(r[1]-r[0],h,r[3]-r[2],MAT.cab,(r[0]+r[1])/2,0.3+h/2,-(r[2]+r[3])/2,G.rpBase); ESS.push(o); o.userData.info=info; PICK.push({o,when:()=>state.proj==='rp'}); };
  p.gal.forEach(r=>cab(r,2.3,{t:`Galaxy261L · ${p.id}`,d:'Шафа АКБ 261 кВт·год (LFP), 5 на майданчик'}));
  cab(p.mps,2.2,{t:`FFD POWER 500 кВт · ${p.id}`,d:`Шафа мікромережі (PCS, STS, трансформатор); ${p.tp}`});
  p.sm.forEach(r=>cab(r,1.8,{t:`SM · ${p.id}`,d:'Пристрій обмеження генерації (Zero Export)'})); });

// ================= Наш варіант Б — контейнери, ШВ, БЗ
const OU=DATA.ours;
Object.entries(OU.cont).forEach(([ms,c])=>{ const w=c[1]-c[0], d=c[3]-c[2];
  ESS.push(box(w+1.5,0.3,d+0.6,MAT.slab,(c[0]+c[1])/2,0.15,-(c[2]+c[3])/2,G.oursBase));
  const o=box(w,2.896,d,MAT.cont,(c[0]+c[1])/2,0.3+1.448,-(c[2]+c[3])/2,G.oursBase); ESS.push(o); o.userData.info={t:`${ms} · Golen LES-H20-1205W500C-PS`,d:`Контейнер 20 фт: PCS 500 кВт, АКБ 1 205 кВт·год, 12 PV-входів; ліній від ШВ — ${OU.nlines[ms]}`}; PICK.push({o,when:()=>state.proj==='ours'}); });
const oBZ={};
{ // провідник вирівнювання ПВ-3 1×6 у лотках уздовж ліній DC
  const pr=[]; OU.net.forEach(s=>pairsOf(route(s[0][0],s[0][1],s[1][0],s[1][1],0.16,0.1),pr)); OU.net_wh.forEach(s=>pairsOf(route(s[0][0],s[0][1],s[1][0],s[1][1],0.16,0.1),pr));
  oBZ.net=lines(pr,0x8fbf1f,G.oursBZ);
  const br=[]; BLK.forEach(b=>b.p.forEach((p,k)=>{ const q=b.q[k]; br.push(W(p[0],p[1],roofZ(p[0])+0.12),W(q[0],q[1],roofZ(q[0])+0.16)); })); oBZ.br=lines(br,0x8fbf1f,G.oursBZ);
  const n=BLK.length*2, dots=inst(new THREE.SphereGeometry(0.22,12,8),new THREE.MeshBasicMaterial({color:0x8fbf1f}),n,G.oursBZ,false); let k=0;
  const dinfo=[]; BLK.forEach(b=>b.p.forEach(p=>{ _M.compose(W(p[0],p[1],roofZ(p[0])+0.14),_q.set(0,0,0,1),_s.set(1,1,1)); dots.setMatrixAt(k++,_M); dinfo.push(b); }));
  dots.userData.info=i=>({t:`Приєднання блоку каркаса ${dinfo[i].no}`,d:'Затискач до лаги, провід Cu 6 мм² до провідника вирівнювання; опір ≤ 0,2 Ом'}); PICK.push({o:dots,when:()=>state.proj==='ours'&&state.sec==='bz'}); oBZ.dots=dots;
  // щити PV з ПЗІП F1
  const bx=inst(new THREE.BoxGeometry(0.6,0.5,0.2),MAT.cab,OU.boxes.length,G.oursBase);
  OU.boxes.forEach((b,i)=>{ const z=surfZ(b.c[0],b.c[1]); _M.compose(W(b.c[0],b.c[1],(z===null?0.3:z)+0.75),_q.set(0,0,0,1),_s.set(1,1,1)); bx.setMatrixAt(i,_M); });
  bx.userData.info=i=>({t:`${OU.boxes[i].l} · щит PV 6/1`,d:`ПЗІП F1 тип 1+2 у щиті; лінія до ШВ-${OU.boxes[i].ms.slice(-1)} · ${OU.boxes[i].ms}`}); PICK.push({o:bx,when:()=>state.proj==='ours'});
  oBZ.boxes=bx; ESS.push(bx);
  const tag=inst(new THREE.BoxGeometry(0.62,0.12,0.22),MAT.spd,OU.boxes.length,G.oursBZ,false);
  OU.boxes.forEach((b,i)=>{ const z=surfZ(b.c[0],b.c[1]); _M.compose(W(b.c[0],b.c[1],(z===null?0.3:z)+1.06),_q.set(0,0,0,1),_s.set(1,1,1)); tag.setMatrixAt(i,_M); });
  // ШВ, спуски Cu 16, заземлювачі контейнерів
  const dp=[], rg=[];
  Object.entries(OU.shv).forEach(([ms,p])=>{ const o=box(0.8,1.2,0.3,MAT.cab,p[0],1.1,-p[1],G.oursBase); ESS.push(o); o.userData.info={t:`ШВ-${ms.slice(-1)} · шафа вводу`,d:`Перехід Al → Cu 50 мм², ПЗІП ${ms==='MS-1'?'F2 × 9 і F3 × 3':'F2 × '+OU.nlines[ms]}, шина PE`}; PICK.push({o,when:()=>state.proj==='ours'});
    box(0.82,0.1,0.32,MAT.spd,p[0],1.75,-p[1],G.oursBZ);
    const d=OU.desc[ms], c=OU.cont[ms]; dp.push(W(d[0],d[1],HV),W(d[0],d[1],0.25)); dp.push(W(d[0],d[1],0.25),W(p[0],p[1],0.25)); dp.push(W(p[0],p[1],0.25),W((c[0]+c[1])/2,(c[2]+c[3])/2,0.25));
    const x0=c[0]-1.25, x1=c[1]+1.25, y0=c[2]-0.8, y1=c[3]+0.8; const R=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
    R.forEach((a,i)=>{ const b=R[(i+1)%4]; rg.push(W(a[0],a[1],0.04),W(b[0],b[1],0.04)); }); });
  oBZ.desc=lines(dp,0x8fbf1f,G.oursBZ); oBZ.ring=lines(rg,0x8a5a2b,G.oursBZ); }

// ================= сонце (Київ 50,46° пн. ш., 30,42° сх. д.; вісь Y будівлі — азимут 4°)
const LAT=50.46*D2R, LON=30.42;
function kyivOffset(y,mo,d){ const last=m=>{ const t=new Date(Date.UTC(y,m,31)); return 31-t.getUTCDay(); }; const a=Date.UTC(y,2,last(2)), b=Date.UTC(y,9,last(9)), t=Date.UTC(y,mo,d); return t>=a&&t<b?3:2; }
function sunPos(mo,d,hLocal){ const y=2026, off=kyivOffset(y,mo,d); const ms=Date.UTC(y,mo,d)+(hLocal-off)*3600e3; const n=(ms-Date.UTC(2000,0,1,12))/864e5;
  const L=(280.46+0.9856474*n)%360, g=(357.528+0.9856003*n)*D2R, lam=(L+1.915*Math.sin(g)+0.02*Math.sin(2*g))*D2R, eps=(23.439-4e-7*n)*D2R;
  const ra=Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam)), dec=Math.asin(Math.sin(eps)*Math.sin(lam));
  const gmst=(280.46061837+360.98564736629*n)%360, H=((gmst+LON)*D2R-ra);
  const alt=Math.asin(Math.sin(LAT)*Math.sin(dec)+Math.cos(LAT)*Math.cos(dec)*Math.cos(H));
  let az=Math.atan2(-Math.sin(H),Math.tan(dec)*Math.cos(LAT)-Math.sin(LAT)*Math.cos(H)); if(az<0) az+=2*Math.PI;
  return {alt,az,off}; }
const DAYS=[['21.03',2,21],['21.06',5,21],['23.09',8,23],['21.12',11,21]], SEASN=['Весна','Літо','Осінь','Зима'], SUNNOW={alt:0,az:0};
const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(3.2,20,14),new THREE.MeshBasicMaterial({color:0xffc94a})); scene.add(sunDisc);
let sunPath=null;
function drawSunPath(){ if(sunPath){ scene.remove(sunPath); sunPath.geometry.dispose(); } const dd=DAYS[state.day], pts=[];
  for(let h=3;h<=22;h+=1/6){ const s=sunPos(dd[1],dd[2],h); if(s.alt<=0) continue; const e=Math.sin(s.az)*Math.cos(s.alt), nn=Math.cos(s.az)*Math.cos(s.alt), sx=e*Math.cos(4*D2R)-nn*Math.sin(4*D2R), sy=e*Math.sin(4*D2R)+nn*Math.cos(4*D2R);
    pts.push(sun.target.position.clone().addScaledVector(new V3(sx,Math.sin(s.alt),-sy).normalize(),175)); }
  sunPath=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:0xd08a1a,dashSize:4,gapSize:3})); sunPath.computeLineDistances(); scene.add(sunPath); }
function placeSun(){ const dd=DAYS[state.day], s=sunPos(dd[1],dd[2],state.hour); const e=Math.sin(s.az)*Math.cos(s.alt), nn=Math.cos(s.az)*Math.cos(s.alt), u=Math.sin(s.alt);
  const bx=Math.cos(4*D2R), by=-Math.sin(4*D2R); // вісь X будівлі = азимут 94°
  const sx=e*bx+nn*by, sy=e*Math.sin(4*D2R)+nn*Math.cos(4*D2R);
  const v=new V3(sx,Math.max(u,0.02),-sy).normalize(); sun.position.copy(sun.target.position).addScaledVector(v,320);
  const k=Math.max(0,Math.sin(s.alt)); sun.intensity=0.15+1.0*Math.min(1,k*1.6); hemi.intensity=0.35+0.3*Math.min(1,k*2); sun.castShadow=s.alt>0;
  const hh=Math.floor(state.hour), mm=Math.round((state.hour-hh)*60);
  SUNNOW.alt=s.alt; SUNNOW.az=s.az; sunDisc.position.copy(sun.target.position).addScaledVector(v,175); sunDisc.visible=s.alt>0;
  if(typeof genRefresh==='function') genRefresh(effSec()==='sun'&&!state.lay.sunPlain);
  need=true; }

// ================= сонце і генерація: одна модель для обох проєктів
// Ясне небо (DNI — Meinel, GHI — Haurwitz), розсіяне ізотропне, альбедо 0,2. Тіні: дах-арка, ліхтарі, перешкоди, ТП, будівлі,
// щогли БЗ і сусідні ряди трикутників (Вінниця). Потужність — на модулях, постійний струм, без нагріву, кабелів і інвертора.
const BLD=(x,y,z)=>[x,-z,y];
const dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function geomOf(M){ const e=M.elements, ax=BLD(e[0],e[1],e[2]), ay=BLD(e[4],e[5],e[6]), az=BLD(e[8],e[9],e[10]), p=BLD(e[12],e[13],e[14]);
  const ly=Math.hypot(...ay), n=ay.map(v=>v/ly), qc=p.map((v,i)=>v+ay[i]*0.5), a=ax.map(v=>v/2), b=az.map(v=>v/2);
  const la=Math.hypot(...a), lb=Math.hypot(...b), A=la>=lb?a:b, B=la>=lb?b:a, s=[];
  [-0.75,-0.25,0.25,0.75].forEach(u=>[-0.5,0.5].forEach(v=>s.push(qc.map((c,i)=>c+A[i]*u+B[i]*v+n[i]*0.012))));
  return {qc,n,a,b,a2:la*la,b2:lb*lb,s}; }
function meshGeoms(im,n){ const out=[], M=new M4(); for(let i=0;i<n;i++){ im.getMatrixAt(i,M); out.push(geomOf(M)); } return out; }
const GEN={rp:meshGeoms(RPM_.mods,RMOD.length), ours:meshGeoms(ourMods,OM.length), wh:[]};
WHI.forEach(w=>{ meshGeoms(w.im,w.n).forEach((g,j)=>{ g.mesh=w.im; g.k=j; GEN.wh.push(g); }); });
const LANB=S.lan.map(l=>[l[0],l[1],l[2],l[3],HV-3,HV+l[4]]);
const OBSC=S.obs.map(o=>{ const z=roofZ(o[0]); return [o[0],o[1],o[2]/2,z-0.05,z+o[3]-0.05]; });
const TPB=TPS.map(t=>[t.b[0],t.b[1],t.b[2],t.b[3],0,t.h]);
const MASTS=RP.masts.map(m=>{ const z=mastBase(m[0],m[1]); return [m[0],m[1],z,z+m[2]]; });
function rayBox(o,d,b){ let t0=0.02,t1=1e9; for(let k=0;k<3;k++){ const lo=b[k*2], hi=b[k*2+1];
  if(Math.abs(d[k])<1e-9){ if(o[k]<lo||o[k]>hi) return false; continue; } let ta=(lo-o[k])/d[k], tb=(hi-o[k])/d[k]; if(ta>tb){ const t=ta; ta=tb; tb=t; }
  if(ta>t0) t0=ta; if(tb<t1) t1=tb; if(t0>t1) return false; } return true; }
function rayCyl(o,d,c){ const fx=o[0]-c[0], fy=o[1]-c[1], A=d[0]*d[0]+d[1]*d[1]; if(A<1e-12) return false; const B=2*(fx*d[0]+fy*d[1]), C2=fx*fx+fy*fy-c[2]*c[2], D=B*B-4*A*C2;
  if(D<0) return false; const q=Math.sqrt(D); let t0=(-B-q)/(2*A); const t1=(-B+q)/(2*A); if(t1<0.02) return false; t0=Math.max(t0,0.02);
  const z0=o[2]+d[2]*t0, z1=o[2]+d[2]*t1; return Math.min(z0,z1)<=c[4]&&Math.max(z0,z1)>=c[3]; }
function shopRoofHit(o,d){ const hl=Math.hypot(d[0],d[1]); if(hl<1e-6) return false; const zTop=HV+1.65; if(o[2]>=zTop) return false;
  const tMax=Math.min((zTop-o[2])/d[2],70/hl), st=0.35/hl;
  for(let t=0.25/hl;t<=tMax;t+=st){ const X=o[0]+d[0]*t, Y=o[1]+d[1]*t; if(X<SHOP[0]||X>SHOP[1]||Y<SHOP[2]||Y>SHOP[3]) return false; if(o[2]+d[2]*t<roofZ(X)) return true; } return false; }
function whHit(o,d){ const hl=Math.hypot(d[0],d[1]); if(hl<1e-6) return false; const zTop=HV+1.65; const tMax=Math.min((zTop-o[2])/d[2],80/hl), st=0.4/hl;
  for(let t=0.3/hl;t<=tMax;t+=st){ const X=o[0]+d[0]*t, Y=o[1]+d[1]*t, z=o[2]+d[2]*t, p=partAt(X,Y); if(!p) continue; if(z<(p==='R'?roofZ(X):WHF[p](X,Y))) return true; } return false; }
// сітка трикутникових рядів Вінниці для взаємного затінення
const QG=new Map(), QMARK=new Int32Array(GEN.rp.length); let qstamp=0; const qkey=(x,y)=>Math.floor(x)*4096+Math.floor(y+100);
GEN.rp.forEach((g,i)=>{ const xs=[],ys=[]; [-1,1].forEach(u=>[-1,1].forEach(v=>{ xs.push(g.qc[0]+g.a[0]*u+g.b[0]*v); ys.push(g.qc[1]+g.a[1]*u+g.b[1]*v); }));
  for(let x=Math.floor(Math.min(...xs));x<=Math.floor(Math.max(...xs));x++) for(let y=Math.floor(Math.min(...ys));y<=Math.floor(Math.max(...ys));y++){ const k=qkey(x,y); let a=QG.get(k); if(!a){ a=[]; QG.set(k,a); } a.push(i); } });
function quadHit(o,d,q){ const dn=dot3(d,q.n); if(Math.abs(dn)<1e-9) return false; const t=((q.qc[0]-o[0])*q.n[0]+(q.qc[1]-o[1])*q.n[1]+(q.qc[2]-o[2])*q.n[2])/dn; if(t<=1e-3) return false;
  const h=[o[0]+d[0]*t-q.qc[0],o[1]+d[1]*t-q.qc[1],o[2]+d[2]*t-q.qc[2]]; return Math.abs(dot3(h,q.a)/q.a2)<=1&&Math.abs(dot3(h,q.b)/q.b2)<=1; }
function rowsHit(o,d,self,tanAlt){ const hl=Math.hypot(d[0],d[1]); if(hl<1e-6) return false; const dmax=Math.min(9,0.75/Math.max(tanAlt,0.02)); qstamp++;
  for(let s=0;s<=dmax;s+=0.5){ const a=QG.get(qkey(o[0]+d[0]/hl*s,o[1]+d[1]/hl*s)); if(!a) continue;
    for(const j of a){ if(j===self||QMARK[j]===qstamp) continue; QMARK[j]=qstamp; if(quadHit(o,d,GEN.rp[j])) return true; } } return false; }
// тінь щогли на площині модуля (тонка стійка): відрізок тіні перетинає модуль
function mastHit(g,d,tanAlt){ const dn=dot3(d,g.n); if(dn<=0) return false;
  for(const m of MASTS){ const dx=m[0]-g.qc[0], dy=m[1]-g.qc[1]; if(dx*d[0]+dy*d[1]<-1.5) continue; if(Math.hypot(dx,dy)>(m[3]-g.qc[2])/Math.max(tanAlt,0.02)+2) continue;
    const f=z=>dx*g.n[0]+dy*g.n[1]+(z-g.qc[2])*g.n[2]; let za=m[2], zb=m[3]; const fa=f(za), fb=f(zb); if(fa<0&&fb<0) continue;
    if(fa<0) za=za+(zb-za)*(-fa)/(fb-fa); else if(fb<0) zb=za+(zb-za)*fa/(fa-fb);
    const pr=z=>{ const t=f(z)/dn, q=[dx-d[0]*t,dy-d[1]*t,z-g.qc[2]-d[2]*t]; return [dot3(q,g.a)/g.a2,dot3(q,g.b)/g.b2]; };
    const p0=pr(za), p1=pr(zb); let t0=0,t1=1; const ex=[p1[0]-p0[0],p1[1]-p0[1]], ok=[[-ex[0],p0[0]+1],[ex[0],1-p0[0]],[-ex[1],p0[1]+1],[ex[1],1-p0[1]]].every(([pp,qq])=>{
      if(Math.abs(pp)<1e-12) return qq>=0; const r=qq/pp; if(pp<0){ if(r>t1) return false; if(r>t0) t0=r; } else { if(r<t0) return false; if(r<t1) t1=r; } return true; });
    if(ok&&t0<=t1) return true; } return false; }
function litFrac(g,i,set,d,tanAlt){ let lit=0; for(const o of g.s){ let hit=false;
    if(set==='wh'){ hit=whHit(o,d)||TPB.some(b=>rayBox(o,d,b)); }
    else { hit=shopRoofHit(o,d)||LANB.some(b=>rayBox(o,d,b))||OBSC.some(c=>rayCyl(o,d,c))||(set==='rp'&&rowsHit(o,d,i,tanAlt)); }
    if(!hit) lit++; }
  let f=lit/g.s.length; if(set==='rp'&&f>0&&mastHit(g,d,tanAlt)) f=Math.min(f,0.67); return f; }
const DOY=[80,172,266,355];
function sunVec(day,h){ const dd=DAYS[day], s=sunPos(dd[1],dd[2],h); const e=Math.sin(s.az)*Math.cos(s.alt), nn=Math.cos(s.az)*Math.cos(s.alt);
  return {alt:s.alt, d:[e*Math.cos(4*D2R)-nn*Math.sin(4*D2R), e*Math.sin(4*D2R)+nn*Math.cos(4*D2R), Math.sin(s.alt)]}; }
// Генерація — модель розрахунку 25.10 (b_final/gen.py): Meteonorm 8.1 з PVsyst проєкту, ясне небо Ineichen, ясні + хмарні дні під місячні
// суми, навколосонячна + ізотропна розсіяна, альбедо 0,2, температура PVsyst (U 20 — модулі по даху, 29 — на трикутниках і на складі), втрати 11,4 %.
const YR=(typeof YEAR!=='undefined')?YEAR:null;
const LOSS=(1-.025)*(1-.015)*(1-.01)*(1-.035)*(1-.03)*(1-.015)*(1-.01), GAMT=-0.003;
const LOSS_A=0.975*0.985*0.99*0.98*0.975*0.985*0.99;   // 11,4 % — трикутники і склад (розрахунок 23.10); модулі по даху — ще ≈2 % (LOSS, 25.10)
const MCFG={rp:{P:0.710,U:29,eta:0.229,L:LOSS_A}, ours:{P:0.730,U:20,eta:0.235,L:LOSS}, whrp:{P:0.710,U:29,eta:0.229,L:LOSS_A}, whours:{P:0.730,U:29,eta:0.235,L:LOSS_A}};
const modP=(poa,ta,c)=>poa<=0?0:c.P*poa/1000*(1+GAMT*(ta+poa*0.9*(1-c.eta)/c.U-25))*c.L;
function shadeStep(set,list,d,store){ const tanAlt=d[2]/Math.max(1e-6,Math.hypot(d[0],d[1]));
  list.forEach((g,i)=>{ store[i]=dot3(d,g.n)>0?litFrac(g,i,set,d,tanAlt):0; }); }
// потужність набору при ясному (c) і хмарному (o) небі з уже порахованою тінню; acc — річні суми на модуль (з тінню і без)
function powerStep(list,f,st,wx,cfg,acc,wt){ const d=[st[1],st[2],st[3]], G=st[4],Dn=st[5],D=st[6],ext=st[7],ta=st[8], Ai=ext>0?Dn/ext:0, cz=Math.max(st[3],0.01), Go=wx.c*G;
  let Pc=0,Po=0; const n=[0,0,0,0];
  list.forEach((g,i)=>{ const nz=g.n[2], cosb=Math.max(0,dot3(d,g.n)), bc=Dn*cosb+D*Ai*cosb/cz, iso=D*(1-Ai)*(1+nz)/2, gr=G*0.2*(1-nz)/2;
    const pc=modP(bc*f[i]+iso+gr,ta,cfg), po=modP(Go*(1+nz)/2+Go*0.2*(1-nz)/2,ta,cfg); Pc+=pc; Po+=po;
    n[cosb<=0?3:f[i]>=0.999?0:f[i]>=0.5?1:f[i]>0?2:3]++;
    if(acc){ acc.sh[i]+=wt*(wx.p*pc+(1-wx.p)*po); acc.un[i]+=wt*(wx.p*modP(bc+iso+gr,ta,cfg)+(1-wx.p)*po); } });
  return {Pc,Po,n}; }
const GSTATE={rp:new Float32Array(GEN.rp.length), ours:new Float32Array(GEN.ours.length), wh:new Float32Array(GEN.wh.length)};
const add4=(a,b)=>a.map((v,i)=>v+b[i]);
function stepAll(st,wx,store,acc,wt){ const d=[st[1],st[2],st[3]], S=store||{rp:new Float32Array(GEN.rp.length),ours:new Float32Array(GEN.ours.length),wh:new Float32Array(GEN.wh.length)};
  shadeStep('rp',GEN.rp,d,S.rp); shadeStep('ours',GEN.ours,d,S.ours); shadeStep('wh',GEN.wh,d,S.wh);
  const r=powerStep(GEN.rp,S.rp,st,wx,MCFG.rp,acc&&acc.rp,wt), wr=powerStep(GEN.wh,S.wh,st,wx,MCFG.whrp,acc&&acc.whrp,wt),
        o=powerStep(GEN.ours,S.ours,st,wx,MCFG.ours,acc&&acc.ours,wt), wo=powerStep(GEN.wh,S.wh,st,wx,MCFG.whours,acc&&acc.whours,wt);
  const mix=(a,b)=>({Pc:a.Pc+b.Pc, Pa:wx.p*(a.Pc+b.Pc)+(1-wx.p)*(a.Po+b.Po), n:add4(a.n,b.n)});
  return {rp:mix(r,wr), ours:mix(o,wo), shop:{rp:wx.p*r.Pc+(1-wx.p)*r.Po, ours:wx.p*o.Pc+(1-wx.p)*o.Po}}; }
function wxStep(day,h){ const W=WX.day[day]; let best=null,bd=1e9; W.st.forEach(s=>{ const d=Math.abs(s[0]-h); if(d<bd){ bd=d; best=s; } }); return bd<=0.09?best:null; }
function genNow(){ const W=WX.day[state.day], st=wxStep(state.day,state.hour);
  if(!st){ GSTATE.rp.fill(0); GSTATE.ours.fill(0); GSTATE.wh.fill(0); const z=k=>({Pc:0,Pa:0,n:[0,0,0,(k==='rp'?GEN.rp.length:GEN.ours.length)+GEN.wh.length]}); return {alt:0, rp:z('rp'), ours:z('ours')}; }
  const r=stepAll(st,W,GSTATE); return {alt:Math.asin(st[3]), rp:r.rp, ours:r.ours}; }
const SHC=['#4a78bd','#f2b705','#eb6834','#c0392b'], SHN=['на сонці','тінь до ½ модуля','понад ½','увесь модуль'], SHL=SHC.map(c=>lin(c));
const LSC=['#4a78bd','#9cc0e8','#f2b705','#eb6834','#c0392b'], LSN=['до 1 %','1–3 %','3–6 %','6–12 %','понад 12 %'], LSL=LSC.map(c=>lin(c));
const lcol=l=>LSL[l<0.01?0:l<0.03?1:l<0.06?2:l<0.12?3:4];
const SUNMAT={rp:new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5,metalness:0.1}), ours:new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5,metalness:0.1}), wh:WHI.map(()=>new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5,metalness:0.1}))};
const WHMAT=WHI.map(w=>w.im.material);
const fcol=f=>f>=0.999?SHL[0]:f>=0.5?SHL[1]:f>0?SHL[2]:SHL[3];
function genPaint(on){ WHI.forEach((w,i)=>w.im.material=on?SUNMAT.wh[i]:WHMAT[i]); if(on){ RPM_.mods.material=SUNMAT.rp; ourMods.material=SUNMAT.ours; }
  const yr=on&&state.lay.sunYear&&YR, L=YR&&YR.loss;
  GEN.rp.forEach((g,i)=>RPM_.mods.setColorAt(i,!on?white:yr?lcol(L.rp[i]/1000):fcol(GSTATE.rp[i]))); RPM_.mods.instanceColor.needsUpdate=true;
  GEN.ours.forEach((g,i)=>ourMods.setColorAt(i,!on?white:yr?lcol(L.ours[i]/1000):fcol(GSTATE.ours[i]))); ourMods.instanceColor.needsUpdate=true;
  GEN.wh.forEach((g,i)=>g.mesh.setColorAt(g.k,!on?white:yr?lcol(L.wh[i]/1000):fcol(GSTATE.wh[i]))); WHI.forEach(w=>w.im.instanceColor.needsUpdate=true); need=true; }
// доба: кожні 10 хв, ясно і середня погода, обидва проєкти; рахується частинами
const CURVE={}; let curveJob=null;
function dayCurve(day,done){ if(CURVE[day]){ done&&done(CURVE[day]); return; } if(curveJob&&curveJob.day===day) return;
  const W=WX.day[day], H=W.st.map(s=>s[0]), out={h:H,p:W.p,rpC:new Float32Array(H.length),rpA:new Float32Array(H.length),oursC:new Float32Array(H.length),oursA:new Float32Array(H.length),rpSh:new Float32Array(H.length),oursSh:new Float32Array(H.length)}; let k=0; curveJob={day};
  (function step(){ const t0=performance.now(); while(k<H.length&&performance.now()-t0<30){ const r=stepAll(W.st[k],W);
      out.rpC[k]=r.rp.Pc; out.rpA[k]=r.rp.Pa; out.oursC[k]=r.ours.Pc; out.oursA[k]=r.ours.Pa;
      out.rpSh[k]=1-r.rp.n[0]/r.rp.n.reduce((a,b)=>a+b,0); out.oursSh[k]=1-r.ours.n[0]/r.ours.n.reduce((a,b)=>a+b,0); k++; }
    if(k<H.length){ setTimeout(step,0); return; } CURVE[day]=out; curveJob=null; done&&done(out); })(); }
function energyTo(cv,key,h){ let e=0; for(let i=0;i<cv.h.length;i++){ if(cv.h[i]>h+1e-6) break; e+=cv[key][i]/6; } return e; }
// рік: 12 місяців (15-те), та сама модель; рахується один раз при збиранні сторінки (yearCalc у headless) і вбудовується як YEAR
function yearCalc(){ const nR=GEN.rp.length, nO=GEN.ours.length, nW=GEN.wh.length, z=n=>({sh:new Float64Array(n),un:new Float64Array(n)});
  const acc={rp:z(nR),ours:z(nO),whrp:z(nW),whours:z(nW)}, mo={rp:[],ours:[],rpShop:[],oursShop:[]};
  WX.mo.forEach(W=>{ let er=0,eo=0,sr=0,so=0; const wt=W.nd/6;
    W.st.forEach(st=>{ const r=stepAll(st,W,null,acc,wt); er+=r.rp.Pa*wt; eo+=r.ours.Pa*wt; sr+=r.shop.rp*wt; so+=r.shop.ours*wt; });
    mo.rp.push(Math.round(er)); mo.ours.push(Math.round(eo)); mo.rpShop.push(Math.round(sr)); mo.oursShop.push(Math.round(so)); });
  const loss=(a)=>Array.from(a.sh,(v,i)=>a.un[i]>0?Math.round((1-v/a.un[i])*1000):0), kwh=a=>Array.from(a.sh,v=>Math.round(v));
  const sum=a=>a.reduce((x,y)=>x+y,0);
  return {mo, kwh:{rp:kwh(acc.rp),ours:kwh(acc.ours),whrp:kwh(acc.whrp),whours:kwh(acc.whours)}, loss:{rp:loss(acc.rp),ours:loss(acc.ours),wh:loss(acc.whrp)},
    tot:{rp:sum(mo.rp),ours:sum(mo.ours),rpShop:sum(mo.rpShop),oursShop:sum(mo.oursShop),rpUn:Math.round(sum(acc.rp.un)+sum(acc.whrp.un)),oursUn:Math.round(sum(acc.ours.un)+sum(acc.whours.un))}}; }

// ================= стан, перемикачі
const SECS=[['pz','Загальне',1],['bz','Блискавкозахист',1],['km','Кріплення модулів',1],['ep','Електрика',0],['uze','Накопичувач енергії',0],['bud','Будівництво',0],['sun','Сонце і генерація',1],['est','Кошторис',0],['mis','Невідповідності',1]];
const state={proj:'ours',sec:'pz',day:1,hour:12,mis:null,sheet:null,ctx:true,spd:1,sunTab:'day',lay:{sunPlain:false,sunYear:false,cones:true,wire:true,bond:true,earth:true,blocks:true,net:true,spd:true,desc:true,ghost:true,bzMods:false,bzMount:false,kMods:true,rTri:true,rBal:true,rCon:true,rSp:true,rCl:true,oLag:true,oBlk:true,oSl:true,oRod:true,oXp:true,oCl:true,oAn:true}};
try{ const s=JSON.parse(localStorage.getItem('antares-twin-v1')||'null'); if(s){ Object.assign(state,{proj:s.proj||state.proj,sec:s.sec||state.sec,day:s.day??state.day,hour:s.hour??state.hour,mis:s.mis||null,sheet:s.sheet||null,ctx:s.ctx!==false,spd:s.spd||1,sunTab:s.sunTab||'day'}); if(s.lay) Object.assign(state.lay,s.lay); } }catch(e){}
const hs=(location.hash||'').slice(1); if(SECS.some(x=>x[0]===hs&&x[2])) state.sec=hs;
if(!SECS.some(x=>x[0]===state.sec&&x[2])) state.sec='bz';
function save(){ try{ localStorage.setItem('antares-twin-v1',JSON.stringify(state)); }catch(e){} }
const tabs=$('#tabs');
SECS.forEach(([k,t,on])=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('role','tab'); b.dataset.s=k; b.textContent=t; b.disabled=!on; if(k==='mis') b.className='mis'; if(!on) b.title='Розділ додамо далі'; b.onclick=()=>{ state.sec=k; if(state.sheet==='peek') sheetSet('half'); apply(); }; tabs.appendChild(b); });
const ONSECS=SECS.filter(x=>x[2]).map(x=>x[0]);
function stepSec(dir){ const i=ONSECS.indexOf(state.sec); state.sec=ONSECS[(i+dir+ONSECS.length)%ONSECS.length]; apply(); }
$('#tabPrev').onclick=()=>stepSec(-1); $('#tabNext').onclick=()=>stepSec(1);
document.querySelectorAll('#proj button').forEach(b=>b.onclick=()=>{ state.proj=b.dataset.p; apply(); });
const dates=$('#dates'); DAYS.forEach((d,i)=>{ const b=document.createElement('button'); b.type='button'; b.textContent=d[0]; b.onclick=()=>{ state.day=i; apply(); }; dates.appendChild(b); });
const timeEl=$('#time'); timeEl.oninput=()=>{ setPlay(false); state.hour=+timeEl.value/6; placeSun(); sunUI(); };
$('#season').onclick=()=>{ const ord=[3,0,1,2]; state.day=ord[(ord.indexOf(state.day)+1)%4]; apply(); };
$('#sunmore').onclick=()=>{ const m=$('#more'), o=m.hidden; m.hidden=!o; $('#sunmore').setAttribute('aria-expanded',String(o)); };
const effSec=()=>{ if(state.sec!=='mis') return state.sec; const M=MIS.find(x=>x.id===state.mis); return M?M.sec:'km'; };

function setVis(){ const P=state.proj, sec=effSec(), BZ=sec==='bz', KM=sec==='km', SUN=sec==='sun', L=state.lay, on=k=>!KM||L[k];
  G.rp.visible=P==='rp'; G.ours.visible=P==='ours';
  // блискавкозахист: у своєму розділі; щогли Вінниці — ще й у «Сонці», бо дають тінь
  G.rpBZ.visible=P==='rp'&&(BZ||SUN); rpBZ.cones.visible=BZ&&L.cones; rpBZ.wire.visible=rpBZ.down.visible=rpBZ.tj.visible=BZ&&L.wire; rpBZ.bond.visible=BZ&&L.bond; rpBZ.earth.visible=BZ&&L.earth;
  G.oursBZ.visible=P==='ours'&&BZ; oBZ.net.visible=L.net; oBZ.br.visible=L.net; oBZ.dots.visible=L.net; oBZ.desc.visible=L.desc; oBZ.ring.visible=L.desc;
  G.oursBZ.children.forEach(o=>{ if(o.material===MAT.spd) o.visible=L.spd; });
  // у кожному розділі — лише його елементи; решта за перемикачами
  const showMods=BZ?L.bzMods:KM?L.kMods:true, showMount=BZ?L.bzMount:true;
  ESS.forEach(o=>o.visible=!(KM||SUN)); WHI.forEach(w=>w.im.visible=showMods);
  const MM=MIS.find(x=>x.id===state.mis), mis=P==='rp'&&MM&&MM.sec==='km'&&(state.sec==='mis'||state.sec==='km')?state.mis:null;
  const ghost=KM&&(mis==='mod'||mis==='con'||(L.ghost&&!['sag','val','slope'].includes(mis))), byB=P==='ours'&&BZ&&L.blocks; if(!SUN||L.sunPlain) genPaint(false); misPaint(mis);
  ourMods.material=byB?MAT.pvPG:ghost?MAT.pvPK:MAT.pvPo; ourMods.castShadow=!(byB||ghost); ourMods.visible=showMods; lagColors(byB); modColors(byB);
  RPM_.mods.material=mis==='mod'?MAT.pvMod:['sag','val','slope'].includes(mis)?MAT.pvHL:ghost?MAT.pvLG:MAT.pvLr; RPM_.mods.castShadow=!ghost; RPM_.mods.visible=showMods;
  const rm=k=>showMount&&on(k);
  [...RPM_.lod,...RPM_.det].forEach(o=>o.visible=rm('rTri')); RPM_.blk.visible=RPM_.mat.visible=rm('rBal');
  [RPM_.con,...RPM_.detC].forEach(o=>o.visible=rm('rCon')); RPM_.sp.visible=rm('rSp'); RPM_.cl.visible=rm('rCl');
  lagMesh.visible=BZ||on('oLag'); OUR.blk.visible=OUR.mat.visible=rm('oBlk'); OUR.sl.visible=OUR.cp.visible=rm('oSl'); OUR.rods.visible=rm('oRod');
  OUR.xp.visible=OUR.ang.visible=rm('oXp'); OUR.cl.visible=rm('oCl'); OUR.an.visible=rm('oAn');
  if(SUN) genRefresh(!L.sunPlain);
  markersVis(); need=true; }

// ================= невідповідності Вінницького проєкту на арковій покрівлі
const HL={red:lin(0xd64545),amber:lin(0xe8a33d),y:lin(0xf1d36b),o:lin(0xf0a040),ro:lin(0xe06a2c),r2:lin(0xb83226)};
const slopeCol=v=>v<3?white:v<5?HL.y:v<10?HL.o:v<15?HL.ro:HL.r2;
const NSAG=RMOD.filter(m=>m.sag>=15).length, NVAL=RMOD.filter(m=>m.dth>=13).length, NCON=CON.filter(c=>c.ov<=0).length;
const SLB=[[0,3],[3,5],[5,10],[10,15],[15,99]].map(([a,b])=>RMOD.filter(m=>m.slope>=a&&m.slope<b).length);
const SAGR=(()=>{ const v=RMOD.filter(m=>m.sag>=15).map(m=>m.sag); return [Math.floor(Math.min(...v)),Math.ceil(Math.max(...v))]; })();
const DTHR=(()=>{ const v=RMOD.filter(m=>m.dth>=13).map(m=>m.dth); return [Math.floor(Math.min(...v)),Math.floor(Math.max(...v))]; })();
function near(list,f){ let best=null,bd=1e9; list.forEach(x=>{ const d=f(x); if(d<bd){ bd=d; best=x; } }); return best; }
function viewAt(c,off){ return {c:[c.x,c.y,c.z],p:[c.x+off[0],c.y+off[1],c.z+off[2]]}; }
const MIS=[
 {id:'mod',sec:'km',t:'Трикутник під модуль 2278×1134',
  d:'Ресурс кошторису — «Вузол кріплення ZN 1 ФЕМ (2278×1134×35)»; на АБ арк. 6 пояс 1 160, модуль 1134 лягає по 13 мм від його кінців. На плані покрівлі модулі йдуть уздовж ряду з кроком 2 415 мм — це формат 2384×1303 (Shinefar 710 Вт). Модуль 1303 довший за пояс на 143 мм: по центру пояса він виходить за кінці на 71,5 мм, а нижня кромка опускається до верху основи (за відновленою моделлю — на 13 мм нижче; висоту з креслення відновлено з точністю ≈17 мм).',
  leg:[['#e8a33d','модуль 2384×1303 (напівпрозорий)']],
  view:()=>{ const t=near(RT.filter(t=>t.k===2*t.n),t=>(t.X-21.7)**2+(t.Y-41)**2); return viewAt(W(t.X,t.Y-MOD_X+0.68,roofZ(t.X)+0.26),[2.3,0.3,0.1]); }},
 {id:'con',sec:'km',t:'Сполучник 700 не дістає до основ',
  d:()=>`На кресленні 1 400 + 600 + 1 400: сполучник 700 = 600 між основами + по 50 мм у кожну, тобто крок рядів 2 000. На плані покрівлі ряди через 2 100–2 110 мм, між основами 700–710 мм — сполучник до основ не дістає: ${nf(NCON)} з ${nf(CON.length)} місць у 3D.`,
  leg:[['#d64545','не дістає до основ']],
  view:()=>{ const c=near(CON,c=>(RT[c.i].X-60)**2+(RT[c.i].Y-70)**2), v=new V3(0,0.085,-0.35).applyMatrix4(c.M); return viewAt(v,[0.6,0.5,0.3]); }},
 {id:'sag',sec:'km',t:'Плаский модуль на трьох опорах по дузі',
  d:()=>`Модуль спирається на 3 трикутники, а покрівля під ними вигнута: середній трикутник вищий за лінію крайніх на ${SAGR[0]}–${SAGR[1]} мм — ${nf(NSAG)} модулів. Модуль або не дістає крайніх опор, або його притискають із вигином; вузла для арки в РП немає.`,
  leg:[['#e8a33d','середній вищий на 15 мм і більше']],
  view:()=>viewAt(W(64,30,HV+0.6),[-15,8,17])},
 {id:'val',sec:'km',t:'Біля ендов опори одного модуля на різних ухилах',
  d:()=>`${nf(NVAL)} модулів стоять одночасно на арці і на смузі біля ендови: нахил трикутників під одним модулем відрізняється на ${DTHR[0]}–${DTHR[1]}°. Так, як намальовано, їх не змонтувати. Ширина пласкої смуги біля ендови в моделі — 0,75 м (оцінка за розрізом А-А).`,
  leg:[['#d64545','різниця нахилу опор 13° і більше']],
  view:()=>viewAt(W(36,46,HV+0.3),[7,5.5,10])},
 {id:'slope',sec:'km',t:'Незакріплений баласт на ухилі до 16°',
  d:()=>`Ухил уздовж рядів під модулями: до 3° — ${SLB[0]}, 3–5° — ${SLB[1]}, 5–10° — ${SLB[2]}, 10–15° — ${SLB[3]}, понад 15° — ${SLB[4]}. Виробники допускають незакріплений баласт до 3–5° (K2 — до 3°, Van der Valk, IronRidge — до 5°), далі — анкери. Розрахунку на зсув і вітер у РП немає; кількість і вагу баласту віддано постачальнику (примітка АБ арк. 6).`,
  leg:[['#f1d36b','3–5°'],['#f0a040','5–10°'],['#e06a2c','10–15°'],['#b83226','понад 15°']],
  view:()=>VIEWS.over},
 {id:'gen',sec:'sun',t:'Генерацію пораховано як для плаского даху',
  d:'PVsyst проєкту: 1 182,8 МВт·год за рік — усі модулі в одній площині 15° / азимут 4°, без 3D-тіней, без забруднення і трансформатора, втрати в кабелях стрінгів 1,5 % (за їхньою розводкою — у середньому 2,15 %). На арці модулі повернуті на схід і захід до 16°, у стрінгах змішані різні кути; тінь дають ліхтарі, 51 щогла, гребені арок і сусідні ряди (кут затінення ≈22°, сонце в грудні — до 16°). Двійник рахує їхню розкладку тією самою моделлю, що й наш варіант (клімат Києва з того ж PVsyst, тінь на кожному модулі): '+(YR?nf(YR.tot.rp/1000,1)+' МВт·год, на '+nf((1-YR.tot.rp/1182800)*100,1)+' % менше':'')+'. Наші попередні оцінки: 1 070–1 120 (розбір РП 15.10), ≈1 125 (3D, 16.10), ≈1 011 без модулів біля ендов (23.10).',
  leg:[['#4a78bd','на сонці'],['#f3a43b','частково в тіні'],['#30353d','у тіні']],
  view:()=>VIEWS.over}];
// точки невідповідностей на сцені (лише для Вінниці)
const MISPOS={mod:()=>{ const v=MIS[0].view(); return new V3(...v.c); }, con:()=>{ const v=MIS[1].view(); return new V3(...v.c); },
  sag:()=>{ const m=near(RMOD.filter(m=>m.sag>=15),m=>(RT[m.i].X-64)**2+(RT[m.i].Y-28)**2); return W(RT[m.i].X,RT[m.i].Y,roofZ(RT[m.i].X)+0.5); },
  val:()=>{ const m=near(RMOD.filter(m=>m.dth>=13),m=>(RT[m.i].X-36)**2+(RT[m.i].Y-50)**2); return W(RT[m.i].X,RT[m.i].Y,roofZ(RT[m.i].X)+0.5); },
  slope:()=>{ const m=near(RMOD.filter(m=>m.slope>=14),m=>(RT[m.i].X-93)**2+(RT[m.i].Y-45)**2); return W(RT[m.i].X,RT[m.i].Y,roofZ(RT[m.i].X)+0.5); },
  gen:()=>W(48,86,HV+1.8)};
function markTex(n){ const c=document.createElement('canvas'); c.width=c.height=96; const x=c.getContext('2d'); x.fillStyle='#d64545'; x.beginPath(); x.arc(48,48,40,0,Math.PI*2); x.fill();
  x.lineWidth=7; x.strokeStyle='#fff'; x.stroke(); x.fillStyle='#fff'; x.font='700 46px "IBM Plex Mono",monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(String(n),48,51); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; }
const MARKS=new THREE.Group(); scene.add(MARKS);
MIS.forEach((m,i)=>{ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:markTex(i+1),depthTest:false,transparent:true})); sp.scale.set(0.05,0.05,1); sp.material.sizeAttenuation=false;
  const p=MISPOS[m.id](); sp.position.copy(p).add(new V3(0,1.2,0)); sp.renderOrder=20; sp.userData.mis=m.id; MARKS.add(sp);
  const st=lines([p,sp.position.clone()],0xd64545,MARKS,{opacity:0.9}); st.renderOrder=19; st.material.depthTest=false; });
function markersVis(){ MARKS.visible=state.proj==='rp'&&state.lay.marks!==false&&!XN; }
function goMis(id){ const m=MIS.find(x=>x.id===id); if(!m) return; closeNode(true); state.proj='rp'; state.sec='mis'; state.mis=id; if(state.sheet==='peek') sheetSet('half'); apply(); goTo(m.view()); }
$('#misN').textContent=MIS.length;
$('#misChip').onclick=()=>{ state.sec='mis'; if(state.sheet==='peek') sheetSet('half'); apply(); };
function misPaint(mis){ const m=RPM_.mods, c=RPM_.con;
  const base=['sag','val','slope'].includes(mis)?NAVY:white;
  RMOD.forEach((x,j)=>m.setColorAt(j,mis==='sag'?(x.sag>=15?HL.amber:base):mis==='val'?(x.dth>=13?HL.red:base):mis==='slope'?(x.slope<3?base:slopeCol(x.slope)):white));
  CON.forEach((x,j)=>c.setColorAt(j,mis==='con'&&x.ov<=0?HL.red:white)); m.instanceColor.needsUpdate=true; c.instanceColor.needsUpdate=true;
  RPM_.detC[0].material=mis==='con'?MAT.conBad:MAT.znD; }
MAT.conBad=std(0xd64545,{metalness:0.4,roughness:0.5}); MAT.conBad.color.convertSRGBToLinear();
MAT.pvHL=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.55,metalness:0.1});
MAT.pvMod=new THREE.MeshStandardMaterial({color:lin(0xe8a33d),roughness:0.5,transparent:true,opacity:0.42,depthWrite:false,side:THREE.DoubleSide});
const NAVY=lin(0x2b3f63);
// ---------- як це в кресленнях РП: джерело (аркуш, вид) і схема «як намальовано / як на даху» (перемальовано за розмірами з креслень)
const MSRC={
 mod:'АБ арк. 6, вузол Б-Б: пояс «1160 max» під модуль шириною 1 134 мм; на цьому ж аркуші марка модуля GDT132A-710W. Кошторис: ресурс «Вузол кріплення ZN 1 ФЕМ (2278×1134×35)». План покрівлі ЕТР арк. 2 і PVsyst: модуль 710 Вт, 2384 × 1303 (крок уздовж ряду 2 415), у специфікації — Shinefar SF-M21/G132710.',
 con:'АБ арк. 6, бічний вид: основа 1 400 + 600 між основами + 1 400; сполучник Spol-15Zn-700 (поз. 5, переріз А-А, вузол «Д») — 600 + по 50 мм у кожну основу. Примітка 4: «З’єднувачі установити через один трикутник». План покрівлі ЕТР арк. 2: ряди через ≈2 100 мм.',
 sag:'АБ арк. 6: система RUDNIK намальована на рівній площині, вузла для дуги немає. АБ арк. 7, розріз А-А: арки 18 м з підйомом 1,19 м (24 м — 1,6 м), ендови між арками. На плані ЕТР арк. 2 ряди йдуть поперек арок, тобто кожен модуль стоїть на дузі.',
 val:'АБ арк. 7, розріз А-А: ендови між арками; ЕТР арк. 2: колонки модулів стоять над ендовами (X ≈ 17,5; 19,9; 34,4; 36,9; 53,8; 70,7; 73,1 м). Вузла кріплення біля ендови в РП немає.',
 slope:'АБ арк. 6, примітка 1: кількість, габарити й вагу баласту «розраховує індивідуально завод-постачальник» — розрахунку на зсув і вітер у РП немає. Вітровий район: 3-й на АБ, 2-й у пояснювальній записці. Ухил під модулями — з профілю розрізу А-А (АБ арк. 7).',
 gen:'Пояснювальна записка ЕТР і звіт PVsyst: одна площина 15° / азимут 4°, без 3D-сцени, без тіней від рядів, щогл і ліхтарів, без забруднення; втрати в кабелях стрінгів 1,5 %.'};
function misFig(id){ const T=(x,y,t,o='')=>`<text ${o} x="${x}" y="${y}" font-size="10.5" fill="var(--ink-2)">${t}</text>`, L=(a,c,w=2,d='')=>`<path d="${a}" fill="none" stroke="${c}" stroke-width="${w}" ${d?`stroke-dasharray="${d}"`:''} stroke-linecap="round"/>`;
  const G='var(--ok)', RD='#d64545', ST='var(--ink-2)', BL='var(--ink-3)';
  const wrap=(h,body,cap)=>`<figure style="margin:0"><svg class="gchart" viewBox="0 0 360 ${h}" role="img" aria-label="${esc(cap)}">${body}</svg><figcaption class="src">${esc(cap)}</figcaption></figure>`;
  if(id==='mod'){ const s=0.21, X=v=>30+v*s, Y=v=>150-v*s, c=Math.cos(15*D2R), sn=Math.sin(15*D2R);
    const rail=[[113,70],[113+1160*c,70+1160*sn]], mid=(113+580*c), midY=70+580*sn;
    const mod=(w,off)=>{ const a=[mid-w/2*c-off*sn, midY-w/2*sn+off*c], b=[mid+w/2*c-off*sn, midY+w/2*sn+off*c]; return `M${X(a[0])},${Y(a[1])}L${X(b[0])},${Y(b[1])}`; };
    let b=L(`M${X(0)},${Y(40)}L${X(1400)},${Y(40)}`,ST,5)+L(`M${X(-85)},${Y(0)}L${X(215)},${Y(0)}M${X(1185)},${Y(0)}L${X(1485)},${Y(0)}`,BL,9);
    b+=L(`M${X(rail[0][0])},${Y(rail[0][1])}L${X(rail[1][0])},${Y(rail[1][1])}`,ST,4)+L(`M${X(1237)},${Y(40)}L${X(1237)},${Y(rail[1][1])}`,ST,4);
    b+=L(mod(1134,40),G,4)+L(mod(1303,82),RD,4,'6 3');
    b+=T(X(560),Y(-30)+0,'основа 1 400')+T(X(780),Y(110),'пояс 1 160 max',`text-anchor="middle"`)+T(8,16,'— модуль 1 134 (на кресленні)',`fill="var(--ok)"`)+T(8,30,'- - модуль 1 303 (у проєкті): +71,5 мм з кожного боку',`fill="#d64545"`);
    return wrap(178,b,'Вузол Б-Б, АБ арк. 6 — перемальовано в масштабі: трикутник, як на кресленні, і модуль 1303 поверх нього.'); }
  if(id==='con'){ const s=0.095, X=v=>14+v*s; const row=(y,gap,lab,col,ov)=>{ const b2=1400+gap; return L(`M${X(0)},${y}L${X(1400)},${y}M${X(b2)},${y}L${X(b2+1400)},${y}`,ST,7)+L(`M${X(1400-ov)},${y-9}L${X(1400-ov+700)},${y-9}`,col,5)
      +T(X(700),y+18,'основа 1 400',`text-anchor="middle"`)+T(X(b2+700),y+18,'основа 1 400',`text-anchor="middle"`)+T(X(1400+gap/2),y-17,lab,`text-anchor="middle" fill="${col}"`); };
    const b=row(48,600,'сполучник 700: по 50 мм в основи','var(--ok)',50)+T(8,14,'На кресленні АБ арк. 6: крок рядів 2 000, між основами 600')+row(128,700,'700 = між основами: заходження 0',RD,0)+T(8,94,'На даху (план ЕТР арк. 2): крок 2 100–2 110, між основами 700–710');
    return wrap(158,b,'Бічний вид АБ арк. 6 і план ЕТР арк. 2 — перемальовано в масштабі.'); }
  if(id==='sag'){ const tri=(x,y,a=0)=>`<g transform="translate(${x},${y}) rotate(${a})">${L('M-14,0L14,0M-12,0L12,-9M12,0L12,-9',ST,1.8)}</g>`;
    let b=T(8,14,'На кресленні: площина — три опори на одній прямій')+L('M20,52L340,52',BL,1.5)+tri(80,52)+tri(180,52)+tri(280,52)+L('M68,40L292,40',G,4);
    const arc=x=>136-40*(1-((x-180)/190)**2); b+=T(8,74,'На даху: дуга (прогин на схемі ×20) — середня опора вища')+L('M20,'+arc(20)+'Q180,'+(arc(180)*2-((arc(20)+arc(340))/2))+' 340,'+arc(340),BL,1.5);
    [80,180,280].forEach(x=>{ b+=tri(x,arc(x),Math.atan(80*(x-180)/190/190)*-57.3*-1); }); b+=L(`M68,${arc(180)-12}L292,${arc(180)-12}`,G,4)+T(180,162,'щілина під крайніми опорами 18–26 мм або вигин модуля',`text-anchor="middle" fill="#d64545"`);
    return wrap(172,b,'Схема: модуль на трьох трикутниках — як на кресленні (рівна площина) і як на арці (розріз А-А, АБ арк. 7).'); }
  if(id==='val'){ let b=T(8,14,'Біля ендови: одна опора на схилі арки, інша — на пласкій смузі')+L('M20,40Q120,60 200,110L340,110',BL,2)+L('M200,110L200,128',BL,1)+T(270,126,'ендова, пласко',`text-anchor="middle"`)+T(90,36,'схил арки 13–16°');
    b+=`<g transform="translate(150,86) rotate(32)">${L('M-14,0L14,0M-12,0L12,-9M12,0L12,-9',ST,1.8)}</g><g transform="translate(250,110)">${L('M-14,0L14,0M-12,0L12,-9M12,0L12,-9',ST,1.8)}</g>`+L('M140,72L262,99',RD,4,'6 3')+T(200,150,'різниця нахилу опор під одним модулем 13–30°',`text-anchor="middle" fill="#d64545"`);
    return wrap(160,b,'Схема: модуль над ендовою (розріз А-А, АБ арк. 7; колонки над ендовами — ЕТР арк. 2).'); }
  if(id==='slope'){ const cols=[[3,'#4a78bd'],[5,'#f1d36b'],[10,'#f0a040'],[15,'#e06a2c'],[99,'#b83226']], h=8.25, r=1.19; let b=T(8,14,'Розріз арки 18 м (АБ арк. 7): ухил уздовж рядів');
    const X=x=>20+x*17.8, Y=z=>120-z*60; let prev=null;
    for(let x=-9;x<=9.0001;x+=0.25){ const d=Math.max(-h,Math.min(h,x)), z=Math.abs(x)<=h?r*(1-d*d/h/h):0, sl=Math.abs(Math.atan(Math.abs(x)<h?2*r*d/h/h:0))/D2R, col=cols.find(c=>sl<c[0])[1];
      if(prev) b+=L(`M${X(prev[0]+9)},${Y(prev[1])}L${X(x+9)},${Y(z)}`,col,5); prev=[x,z]; }
    b+=T(180,150,'баласт без кріплення допускають до 3–5°; далі — анкери або зв’язки',`text-anchor="middle"`)+cols.map((c,i)=>`<rect x="${20+i*66}" y="24" width="10" height="10" fill="${c[1]}"/>`+T(34+i*66,33,['до 3°','3–5°','5–10°','10–15°','> 15°'][i])).join('');
    return wrap(160,b,'Схема: ухил під модулями по профілю арки 18 м (підйом 1,19 м).'); }
  if(id==='gen'){ const pv=1182.8, me=YR?YR.tot.rp/1000:null, X=v=>40+v/1300*300; let b=T(8,16,'Вінницький проєкт, МВт·год за рік');
    b+=`<rect x="40" y="28" width="${X(pv)-40}" height="22" fill="var(--rp)" opacity=".45"/>`+T(44,43,'PVsyst проєкту: '+nf(pv,1),`fill="var(--ink)"`);
    if(me) b+=`<rect x="40" y="60" width="${X(me)-40}" height="22" fill="var(--rp)"/>`+T(44,75,'та сама модель, що й для нашого: '+nf(me,1),`fill="#fff"`);
    b+=T(8,104,'Наші попередні оцінки: 1 070–1 120 (розбір 15.10),')+T(8,118,'≈1 125 (3D, 16.10), ≈1 011 без модулів біля ендов (23.10).');
    return wrap(128,b,'PVsyst — одна площина без тіней; двійник — кожен модуль з тінню і нахилом на арці.'); }
  return ''; }

function panelMis(){ const act=MIS.find(m=>m.id===state.mis);
  return `<div class="ph"><span class="eyebrow rp">Вінницький проєкт · РП 2025/12-07</span><h2>Невідповідності: проєкт плаского даху перенесено на арковий</h2><p>Баластну систему RUDNIK, намальовану на рівній площині (АБ арк. 6), поставлено на аркову покрівлю без вузлів для арки й ендов, без розрахунку на зсув і вітер, з трикутником під модуль іншого розміру. Натисніть пункт або червоний номер на даху — камера покаже місце.</p></div>
  <div class="blk"><ol class="mis">${MIS.map((m,i)=>{ const on=state.mis===m.id; return `<li><button type="button" data-mis="${m.id}" aria-pressed="${on}"><span class="n">${i+1}</span><span>${esc(m.t)}<small>${m.sec==='km'?'Кріплення модулів':'Сонце і генерація'}</small></span></button>${on?`<div class="mis-d"><p>${esc(typeof m.d==='function'?m.d():m.d)}</p></div>`:''}</li>`; }).join('')}</ol></div>
  ${act?`<div class="blk"><h3>${MIS.indexOf(act)+1}. У кресленнях РП</h3><p style="margin:0;font-size:13px">${esc(MSRC[act.id]||'')}</p>${misFig(act.id)}${act.sec==='km'?`<button type="button" class="lnk" data-xnode="mis:${act.id}">↑ Розібрати вузол тут — деталі по шарах</button>`:''}<button type="button" class="lnk" data-mis="">Прибрати підсвічування</button></div>`:''}`; }
function misLink(sec){ const L=MIS.map((m,i)=>[m,i]).filter(([m])=>m.sec===sec); if(state.proj!=='rp'||!L.length) return '';
  return `<button type="button" class="lnk" data-gomis="${L[0][0].id}">⚠ <b>${L.length===1?'Невідповідність':L.length+' невідповідностей'}</b> — ${L.length===1?esc(L[0][0].t.toLowerCase()):'показати на даху'} →</button>`; }

// ================= панель
const C=DATA.cost, UAH=44.89;
const RP_BZ_UAH=1730000;
function cmpTable(rows,cur){ return `<table class="cmp"><thead><tr><th></th><th class="rp">Вінниця</th><th class="ours">Наш Б</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r[3]||''}"><td>${esc(r[0])}</td><td class="${cur==='rp'?'cur':''}">${r[1]}</td><td class="${cur==='ours'?'cur':''}">${r[2]}</td></tr>`).join('')}</tbody></table>`; }
function layHTML(list){ return `<div class="lay">${list.map(([k,t,col,cnt])=>`<label for="lay-${k}"><input type="checkbox" id="lay-${k}" data-k="${k}" ${state.lay[k]?'checked':''}><span class="sw" style="background:${col}"></span>${esc(t)}<span class="cnt">${cnt||''}</span></label>`).join('')}</div>`; }
function panelPZ(){ const rp=state.proj==='rp';
  const head=rp?`<div class="ph"><span class="eyebrow rp">Вінницький проєкт · ТОВ «Промавтоматика Вінниця»</span><h2>РП 2025/12-07: 1 440 модулів на трикутниках 15°</h2><p>Як запроєктовано: баластні трикутники для плаского даху поставлено на аркову покрівлю, ряди схід–захід.</p></div>`
                :`<div class="ph"><span class="eyebrow ours">Наш варіант Б · E-Systems</span><h2>1 953 модулі паралельно покрівлі на прямих лагах</h2><p>Остаточна розкладка 25.10.2026: лаги прямі, усе в один ряд, без щогл і зсувів.</p></div>`;
  const kv=rp?[['Модулі','1 440 × 710 Вт','Shinefar SF-M21/G132710'],['Цех / склад','1 260 / 180',''],['Потужність','1 022,4 кВтп',''],['Кріплення','RUDNIK, 15°','баласт 5 396 блоків 300×300×60'],['УЗЕ','3 × FFD POWER 500 кВт','15 × Galaxy261L = 3 915 кВт·год'],['Генерація','1 182,8 МВт·год','PVsyst проєкту, одна площина 15°/4°'],['Кошторис','106 591 тис. грн','з ПДВ, ціни на 27.03.2026']]
              :[['Модулі','1 953 × 730 Вт','ZNSHINE ZXN8-BD132-730'],['Цех / склад','1 773 / 180',''],['Потужність','1 425,69 кВтп',''],['Кріплення','лага 41×41, 0°','блоки 6 711 × 13 кг, шпильки M10'],['УЗЕ','3 × Golen LES-H20','3 × 1 205 = 3 615 кВт·год'],['Генерація','1 392,8 МВт·год','розрахунок 25.10 з тінями: цех 1 240,7 + склад 152,1'],['Ціна під ключ','1 379 142 $','з ПДВ, матеріали з Китаю; з України — 1 570 011 $']];
  return head+`<dl class="kv">${kv.map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}${r[2]?`<small>${esc(r[2])}</small>`:''}</dd>`).join('')}</dl>`
   +`<div class="blk"><h3>Порівняння</h3>${cmpTable([['Модулів, шт','1 440','1 953'],['кВтп','1 022,4','1 425,69'],['МВт·год за рік','1 182,8','1 392,8'],['кВт·год/кВтп','1 157','977'],['Блоків баласту','5 396','6 711'],['Щогл БЗ','53','0'],['УЗЕ, кВт·год','3 915','3 615']],state.proj)}</div>`
   +`<p class="src">Генерацію порахано різними моделями: у РП — PVsyst без тіней і з однією площиною; у нашому — з тінями від ліхтарів і перешкод на кожен модуль. Модулі нашого варіанта лежать за ухилом арки, тому питома генерація нижча, а станція більша.</p>`; }
function panelBZ(){ const rp=state.proj==='rp';
  if(rp) return `<div class="ph"><span class="eyebrow rp">Вінницький проєкт · розділ БЗ</span><h2>Зовнішній блискавкозахист LPL II: 53 щогли і сітка дроту</h2><p>Захисний кут, сітка блискавкоприймача, спуски через 10 м по фасадах А, К і 17.</p></div>`
   +`<dl class="kv"><dt>Щогли М-04/40, 4 м</dt><dd>51<small>серед рядів модулів</small></dd><dt>Щогли М-05/60, 6 м</dt><dd>2<small>біля MS-3</small></dd><dt>Зона за РП</dt><dd>кут 68°<small>радіус на рівні основи 9,9 м</small></dd><dt>Дріт W-08/AL Ø8</dt><dd>3 000 м<small>на тримачах H-303 через 1 м</small></dd><dt>Спуски і заземлювачі</dt><dd>44</dd><dt>Вирівнювання 1×6</dt><dd>уздовж рядів</dd></dl>`
   +`<div class="blk"><h3>Шари</h3>${layHTML([['cones','Зони захисту щогл','#dc9a52','53'],['wire','Дріт, спуски, контрольні з’єднання','#2a9fd0','44 спуски'],['bond','Вирівнювання вздовж рядів','#3cae4f',''],['earth','Заземлювачі УЗЕ','#8a5a2b',''],['bzMods','Показати модулі','#22345f',''],['bzMount','Показати кріплення','#b9c3ca','']])}</div>`
   +`<div class="blk"><h3>Ризик за ДСТУ EN 62305-2</h3><dl class="kv"><dt>R1 (люди)</dt><dd>6,37·10⁻⁶<small>менше 10⁻⁵, але nz/nt = 200/100 — помилка</small></dd><dt>R4 (економічні втрати)</dt><dd>4,91·10⁻³<small>більше 10⁻³; ≈90 % — перенапруги</small></dd></dl><div class="note warn">Етапу 2 (ризик із заходами) у РП немає. Щогли без ПЗІП ризик R4 не знижують: 4,83·10⁻³. 67 місць модулів зайнято щоглами, щогли затіняють сусідні модулі вранці й увечері.</div></div>`
   +bzCost();
  return `<div class="ph"><span class="eyebrow ours">Наш варіант Б · Том 7 БЗ</span><h2>Без щогл: ПЗІП і заземлення каркаса</h2><p>Підстава — етап 2 розрахунку ризику на вхідних даних РП з узгодженою системою ПЗІП.</p></div>`
   +`<dl class="kv"><dt>Щогли, дріт, спуски</dt><dd>немає</dd><dt>Каркас</dt><dd>19 блоків<small>лаги, з’єднані шпильками і крайніми профілями</small></dd><dt>Приєднань до вирівнювання</dt><dd>38<small>по 2 на блок, ≤ 0,2 Ом</small></dd><dt>Провідник ПВ-3 1×6</dt><dd>${nf(OU.len_roof,1)} м<small>у лотках поруч з лініями DC; склад ${nf(OU.len_wh,1)} м</small></dd><dt>ПЗІП DC</dt><dd>F1 33 · F2 30 · F3 3<small>F1 у щитах PV, F2/F3 у ШВ</small></dd><dt>ПЗІП AC і зв’язку</dt><dd>F4–F6 7 · F7–F9 7</dd><dt>Заземлювачі контейнерів</dt><dd>кільце 25×4 + 4 стрижні</dd><dt>Контактні шайби</dt><dd>3 790<small>2 на гільзу лаги</small></dd></dl>`
   +`<div class="blk"><h3>Шари</h3>${layHTML([['blocks','Блоки каркаса (кольором)','linear-gradient(90deg,#2f6fdb,#e0782b,#2c9a5b,#c23b6b)','19'],['net','Провідник вирівнювання і приєднання','#8fbf1f','38'],['spd','ПЗІП у щитах і ШВ','#e0782b','33 + 3'],['desc','Спуски Cu 16 і заземлювачі контейнерів','#8a5a2b','3'],['bzMods','Показати модулі','#22345f',''],['bzMount','Показати блоки, гільзи, шпильки','#b9c3ca','']])}<div class="plg">${BLK.map(b=>`<span><i style="background:${BLKCOL[(b.no-1)%BLKCOL.length]}"></i>${b.no} · ${b.mods}</span>`).join('')}</div></div>`
   +`<div class="blk"><h3>Ризик за ДСТУ EN 62305-2, етап 2</h3><dl class="kv"><dt>R1 (люди)</dt><dd>2,58·10⁻⁶<small>менше 10⁻⁵</small></dd><dt>R4 (економічні втрати)</dt><dd>3,39·10⁻⁴<small>менше 10⁻³ — забезпечено ПЗІП</small></dd></dl><div class="note ok">Удар у будівлю — у середньому раз на ≈30 років; без щогл звільнено місце під 67 модулів і немає тіней від щогл.</div></div>`
   +bzCost(); }
function bzCost(){ return `<div class="blk"><h3>Вартість розділу БЗ</h3>${cmpTable([['Матеріали, $',`≈${nf(Math.round(RP_BZ_UAH/UAH/100)*100,0)}`,`${nf(C.bz_m_cn,0)}`],['Роботи, $','—',`${nf(C.bz_work,0)}`],['Разом, $',`≈${nf(Math.round(RP_BZ_UAH/UAH/100)*100,0)}`,`${nf(C.bz_cn,0)}`,'tot']],state.proj)}<p class="src">Вінниця — матеріали БЗ за кошторисом РП (≈1,73 млн грн за курсом 44,89 грн/$), роботи в кошторисі окремо не виділено; дріт W-08/AL узято за 373,19 грн/м, схоже, це ціна за кг. Наш Б — зведення 25.10, матеріали з Китаю; з України — ${nf(C.bz_ua,0)} $. ПЗІП F1 входить у вартість щитів PV.</p></div>`; }
const UAHr=v=>Math.round(v/UAH);
const RP_KM={kit:2136.12, n:1260, bal:1812336};
function panelKM(){ const rp=state.proj==='rp';
  const head=rp?`<div class="ph"><span class="eyebrow rp">Вінницький проєкт · АБ арк. 6 і 8</span><h2>Трикутники RUDNIK BalZn15 на баласті, 15°</h2><p>Альбомно, ряди схід–захід з кроком ≈2,10 м; на відрізку ряду з n модулів 2n + 1 трикутник, крайні спільні.</p></div>`
                :`<div class="ph"><span class="eyebrow ours">Наш варіант Б · Том 3 КМ</span><h2>Лаги 41×41 на блоках, гільзи і шпильки M10</h2><p>Модулі паралельно покрівлі; сусідні лаги стягнуті шпильками крізь муфти гільз, край ряду — профіль 41×41 на кутниках.</p></div>`;
  const kv=rp?[['Трикутник BalZn15-1568.1470','2 698','U 45×40×3: основа 1 400, пояс 1 160, стійка ≈345 (АБ арк. 6); у 3D 2 702'],['Баласт 300×300×60, 13 кг','5 396','2 на трикутник, виступають за основу на 85 мм; гвинт R-LX 6,3×50; 70,1 т'],['Мати під баласт','5 396',''],['Сполучник Spol-15Zn-700','1 953','U 38×36×3 між базами сусідніх рядів; у 3D 1 899'],['Спойлер Vitr-240×2450','1 260','1 на модуль, на два трикутники'],['Притиски W35 / Z33','2 520 / 3 232',''],['Метизи трикутників','8 094','3 комплекти на трикутник']]
              :[['Лага 41×41×1,5','5 128,8 м','241 лінія; 4 800 — 1 040, 2 400 — 57'],['Блоки 300×300×60, 13 кг','6 711',`під лаги ${nf(OD.blk.length)}, кінці ${nf(OD.eblk.length)}, профілі ${nf(OD.xblk.length)}; рами щитів 120, опори лотків 987`],['Мати 320×320×3','5 863',''],['Гільза 200 з муфтою M10×50','1 895','2 болти M10×60 крізь лагу'],['Шпилька M10 1 299','1 561','через прохід 570 / 790 / 1 580 — 29 / 15 / 26'],['Крайній профіль ≈1 263','424','через прохід — 30; кутники 160/150 t = 8 — 908'],['Притиски середні / Z33','4 227 / 3 032',''],['Анкери від сповзання','194','162 уздовж ліхтарів + 32 біля гребеня'],['Маса на даху цеху','88,2 т','без модулів, 49,7 кг на модуль']];
  const lay=rp?[['ghost','Модулі напівпрозорі','#8aa0b8',''],['kMods','Модулі','#22345f','1 260'],['rTri','Трикутники','#b9c3ca','2 702'],['rBal','Баласт і мати','#a3a199','5 404'],['rCon','Сполучники','#8d989f',nf(DATA.rpm.con.length)],['rSp','Спойлери','#c5ccd1','1 260'],['rCl','Притиски','#d5dadd','']]
              :[['ghost','Модулі напівпрозорі','#8aa0b8',''],['kMods','Модулі','#22345f','1 773'],['oLag','Лаги','#9aa5ad','241'],['oBlk','Блоки і мати','#a3a199',nf(OD.blk.length+OD.eblk.length+OD.xblk.length)],['oSl','Гільзи з муфтами','#7f8f99',nf(OD.sl.length)],['oRod','Шпильки (через прохід — помаранчеві)','#c0392b',nf(OD.rods.length)],['oXp','Крайні профілі і кутники','#b9c3ca',nf(OD.xp.length)],['oCl','Притиски','#d5dadd',nf(OD.cl.length)],['oAn','Анкери','#c0392b',nf(OD.an.length)]];
  const note=rp?`<p class="src">Трикутник відновлено з креслення АБ арк. 6 (бічний вид, розріз Б-Б, вузол Д); 1 568 у марці — габарит по блоках. Розкладку сполучників у РП не показано, прим. 4 АБ арк. 6 — «через один трикутник»; у 3D — усі проміжки в смузі 15,5 м від краю даху, далі через ряд трикутників: 1 899 проти 1 953 у специфікації. Наблизьте камеру — з’являться профілі з прорізами і болти.</p>`
                 :`<div class="note warn">Тиск під блоком 49,9 кПа розрахунковий (33,6 нормативний): утеплювач під блоками — не менше 50 кПа на стиск при 10 %, перевірити обстеженням до замовлення блоків.</div><p class="src">Лага на сніг: 151 МПа всередині, 210 біля стику, прогин 5,3 мм; шпилька 5,44 кН (арка 18 м) і 7,3 кН (арка 24 м) — 123 і 155 МПа при межі 224 (КМ.РР).</p>`;
  return head+misLink('km')+`<div class="blk" id="xnb">${xPanelHTML()}</div><dl class="kv">${kv.map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}${r[2]?`<small>${esc(r[2])}</small>`:''}</dd>`).join('')}</dl>`
   +`<div class="blk"><h3>Шари</h3>${layHTML(lay)}</div>`+note
   +`<div class="blk"><h3>Порівняння</h3>${cmpTable([['Модулів на даху цеху','1 260','1 773'],['Положення модуля','15° на трикутнику','за ухилом даху'],['Блоків під модулями','5 396','5 604'],['Блоків на модуль','4,28','3,16'],['Зв’язок рядів','сполучник 700','шпилька M10'],['Зв’язок уздовж ряду','спойлер','лага, стик у гільзі']],state.proj)}</div>`
   +kmCost(); }
function kmCost(){ const rk=UAHr(RP_KM.kit*RP_KM.n), rb=UAHr(RP_KM.bal);
  return `<div class="blk"><h3>Вартість кріплення, дах цеху</h3>${cmpTable([['Матеріали, $',nf(rk),nf(C.km_m_cn)],['Монтаж, $',nf(rb),nf(C.km_work)],['Разом, $',nf(rk+rb),nf(C.km_m_cn+C.km_work),'tot']],state.proj)}<p class="src">Вінниця — кошторис РП за курсом 44,89 грн/$: комплект кріплення 2 136,12 грн × 1 260 модулів (ресурс «Вузол кріплення ZN 1 ФЕМ 2278×1134», модуль іншого розміру); монтаж — лише рядок КБ7-16-19 «баласт», 1 812 336 грн (2,47 люд.-год на блок). Наш Б — зведення 25.10, розділ «2. Кріплення»: лаги, гільзи, шпильки, профілі, кутники, притиски, блоки, анкери; матеріали з Китаю, блоки — Україна; з України — ${nf(C.km_m_ua)} $ матеріалів. Монтаж модулів в обох — окремо, у розділі модулів.</p></div>`; }
const KWP={rp:1022.4, ours:1425.69};
let GNOW=null, genKey='';
function genRefresh(paint){ const key=state.day+'|'+Math.round(state.hour*6); if(key!==genKey||!GNOW){ GNOW=genNow(); genKey=key; } if(paint) genPaint(true); sunUI(); genPanelUpdate(); }
function hhmm(h){ let hh=Math.floor(h), mm=Math.round((h-hh)*60); if(mm===60){ hh++; mm=0; } return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
const DIRS=['Пн','Пн-Сх','Сх','Пд-Сх','Пд','Пд-Зх','Зх','Пн-Зх'];
function sunUI(){ timeEl.value=Math.round(state.hour*6); $('#clock').textContent=hhmm(state.hour); $('#season').textContent=SEASN[state.day];
  dates.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===state.day?'true':'false'));
  const rs=riseSet(state.day), k=state.proj, alt=SUNNOW.alt/D2R, dn=DIRS[Math.round(((SUNNOW.az/D2R)+360)%360/45)%8];
  $('#sunx').innerHTML=`висота <b>${nf(Math.max(0,alt),1)}°</b> · азимут <b>${nf(SUNNOW.az/D2R,0)}°</b> · схід ${hhmm(rs[0])} · захід ${hhmm(rs[1])} · ясне небо`;
  let h=`<span class="who ${k}">${k==='rp'?'Вінницький проєкт':'Наш варіант Б'}</span>`;
  if(alt<=0) h+=`<span class="sun">☾ сонце за обрієм</span>`;
  else { h+=`<span class="sun">☀ <b>${nf(alt,0)}°</b> ${dn}</span>`;
    if(GNOW){ const g=GNOW[k], M=g.n.reduce((a,b)=>a+b,0), sh=M-g.n[0]; h+=`<span>у тіні <b class="num">${nf(sh)}</b> з ${nf(M)} (${nf(sh/M*100,0)} %)</span><span>зараз <b class="num">${nf(g.Pc,0)} кВт</b> ясно · ${nf(g.Pa,0)} кВт сер.</span>`; } }
  if(YR) h+=`<span>за рік <b class="num">${nf(YR.tot[k]/1000,1)} МВт·год</b></span>`;
  $('#now').innerHTML=h; }
const MONN=['січ','лют','бер','кві','тра','чер','лип','сер','вер','жов','лис','гру'];
function chartSVG(cv){ const W=360,H=160,l=36,r=8,t=10,b=22, x0=Math.floor(cv.h[0]), x1=Math.ceil(cv.h[cv.h.length-1]), xs=h=>l+(h-x0)/(x1-x0)*(W-l-r); let mx=0; ['rpC','oursC'].forEach(k=>cv[k].forEach(v=>{ if(v>mx) mx=v; }));
  const top=Math.max(100,Math.ceil(mx/200)*200), ys=v=>t+(1-v/top)*(H-t-b);
  const path=k=>cv.h.map((h,i)=>(i?'L':'M')+xs(h).toFixed(1)+','+ys(cv[k][i]).toFixed(1)).join('');
  const grid=[0,top/2,top].map(v=>`<line x1="${l}" x2="${W-r}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)"/><text x="${l-4}" y="${ys(v)+4}" text-anchor="end" font-size="10" fill="var(--ink-3)">${nf(v)}</text>`).join('');
  const hx=[6,9,12,15,18].filter(h=>h>x0&&h<x1).map(h=>`<text x="${xs(h)}" y="${H-6}" text-anchor="middle" font-size="10" fill="var(--ink-3)">${h}:00</text>`).join('');
  return `<svg class="gchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Потужність за добу, кВт: Вінниця і наш варіант, ясно і середня погода">${grid}${hx}
   <path d="${path('rpC')}" fill="none" stroke="var(--rp)" stroke-width="1.5" stroke-dasharray="4 3"/><path d="${path('oursC')}" fill="none" stroke="var(--ours)" stroke-width="1.5" stroke-dasharray="4 3"/>
   <path d="${path('rpA')}" fill="none" stroke="var(--rp)" stroke-width="2.4"/><path d="${path('oursA')}" fill="none" stroke="var(--ours)" stroke-width="2.4"/>
   <line id="gNowLine" data-x0="${x0}" data-x1="${x1}" x1="${xs(state.hour)}" x2="${xs(state.hour)}" y1="${t}" y2="${H-b}" stroke="var(--ink)" stroke-dasharray="3 3"/><text x="${l+4}" y="${t+10}" font-size="10" fill="var(--ink-3)">кВт</text></svg>`; }
function monSVG(){ const W=360,H=170,l=36,r=6,t=10,b=22, mx=Math.max(...YR.mo.rp,...YR.mo.ours)/1000, top=Math.ceil(mx/40)*40, bw=(W-l-r)/12, ys=v=>t+(1-v/top)*(H-t-b), cur=WX.day[state.day].mo;
  let g=[0,top/2,top].map(v=>`<line x1="${l}" x2="${W-r}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)"/><text x="${l-4}" y="${ys(v)+4}" text-anchor="end" font-size="10" fill="var(--ink-3)">${nf(v)}</text>`).join('');
  YR.mo.rp.forEach((v,i)=>{ const x=l+i*bw, a=v/1000, o=YR.mo.ours[i]/1000;
    g+=`<rect x="${x+bw*0.12}" y="${ys(a)}" width="${bw*0.36}" height="${ys(0)-ys(a)}" fill="var(--rp)" rx="1.5"><title>${MONN[i]}: Вінниця ${nf(a,1)} МВт·год</title></rect><rect x="${x+bw*0.52}" y="${ys(o)}" width="${bw*0.36}" height="${ys(0)-ys(o)}" fill="var(--ours)" rx="1.5"><title>${MONN[i]}: наш Б ${nf(o,1)} МВт·год</title></rect>`;
    g+=`<text x="${x+bw/2}" y="${H-6}" text-anchor="middle" font-size="9.5" fill="${i===cur?'var(--ink)':'var(--ink-3)'}" font-weight="${i===cur?700:400}">${MONN[i]}</text>`; });
  return `<svg class="gchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Генерація по місяцях, МВт·год: Вінниця і наш варіант">${g}<text x="${l+4}" y="${t+10}" font-size="10" fill="var(--ink-3)">МВт·год</text></svg>`; }
function panelSun(){ const rp=state.proj==='rp', k=state.proj, T=state.sunTab||'day';
  const seg=`<div class="seg" role="group" aria-label="Період">${[['day','Доба'],['mon','Місяці'],['year','Рік']].map(([v,t])=>`<button type="button" data-st="${v}" aria-pressed="${T===v}">${t}</button>`).join('')}</div>`;
  const head=`<div class="ph"><span class="eyebrow ${k}">${rp?'Вінницький проєкт':'Наш варіант Б'} · сонце і генерація</span><h2>${T==='day'?DAYS[state.day][0]+' · '+SEASN[state.day].toLowerCase():T==='mon'?'Генерація по місяцях':'Генерація за рік'}</h2>${seg}</div>`;
  const note=`<p class="src">Модель розрахунку 25.10 для обох проєктів: клімат Києва з PVsyst проєкту (Meteonorm 8.1), ясні і хмарні дні під місячні суми, крок 10 хв; тінь від арок, ліхтарів, 42 перешкод, ТП, будівель, 53 щогл і сусідніх рядів трикутників (8 точок на модуль); температура PVsyst (U 20 — модулі по даху, 29 — на трикутниках і на складі); інші втрати 11,4 %, для модулів по даху — 13,2 % (бруд і невідповідність, як у розрахунку 25.10). Без перетворювача, трансформатора й обмежень мережі.</p>`;
  if(T==='mon'){ if(!YR) return head+'<p class="src">Річний розрахунок ще не вбудовано.</p>';
    const rows=YR.mo.rp.map((v,i)=>[MONN[i],nf(v/1000,1),nf(YR.mo.ours[i]/1000,1)]);
    return head+`<div class="blk"><div>${monSVG()}</div><div class="plg"><span><i style="background:var(--rp)"></i>Вінниця</span><span><i style="background:var(--ours)"></i>Наш Б</span></div><p class="src">Наведіть на стовпчик — підпис. Жирним — місяць вибраного дня.</p></div>
      <div class="blk"><h3>По місяцях, МВт·год</h3>${cmpTable([...rows,['Рік',nf(YR.tot.rp/1000,1),nf(YR.tot.ours/1000,1),'tot']],state.proj)}</div>${note}`; }
  if(T==='year'){ if(!YR) return head+'<p class="src">Річний розрахунок ще не вбудовано.</p>';
    const t=YR.tot, ly=x=>nf(x*100,1)+' %', lossR=1-t.rp/t.rpUn, lossO=1-t.ours/t.oursUn, mine=k==='rp'?t.rp:t.ours;
    return head+`<div class="blk"><div class="stats"><div class="stat"><div class="v">${nf(mine/1000,1)}</div><div class="k">МВт·год за рік · ${rp?'Вінниця':'наш Б'}</div></div><div class="stat"><div class="v">${nf(mine/KWP[k],0)}</div><div class="k">кВт·год на 1 кВтп</div></div><div class="stat"><div class="v">−${ly(k==='rp'?lossR:lossO)}</div><div class="k">забирає тінь</div></div><div class="stat"><div class="v">${nf((k==='rp'?t.rpShop:t.oursShop)/1000,1)}</div><div class="k">з них дах цеху, МВт·год</div></div></div>${misLink('sun')}</div>
      <div class="blk"><h3>Обидва проєкти за рік</h3>${cmpTable([['Модулів','1 440','1 953'],['кВтп','1 022,4','1 425,69'],['МВт·год за рік',nf(t.rp/1000,1),nf(t.ours/1000,1),'tot'],['кВт·год на 1 кВтп',nf(t.rp/KWP.rp,0),nf(t.ours/KWP.ours,0)],['Тінь забирає',ly(lossR),ly(lossO)],['Дах цеху, МВт·год',nf(t.rpShop/1000,1),nf(t.oursShop/1000,1)],['Склад, МВт·год',nf((t.rp-t.rpShop)/1000,1),nf((t.ours-t.oursShop)/1000,1)],['У проєкті, МВт·год','1 182,8','1 392,8']],state.proj)}
      <p class="src">«У проєкті»: Вінниця — PVsyst РП (одна площина 15°/4°, без 3D-тіней); наш — розрахунок 25.10 (тінь — 3 точки на модуль). Тут для обох однаково: тінь на 8 точках модуля, з рядами трикутників і щоглами. «Тінь за рік» над моделлю показує, скільки тінь забирає в кожного модуля.</p></div>${note}`; }
  return head+`<div class="blk"><div class="stats"><div class="stat"><div class="v" id="gP">…</div><div class="k" id="gPp">потужність зараз</div></div><div class="stat"><div class="v" id="gE">…</div><div class="k">кВт·год з ранку, сер. погода</div></div><div class="stat"><div class="v" id="gD">…</div><div class="k" id="gDk">кВт·год за добу, сер. погода</div></div><div class="stat"><div class="v" id="gS">…</div><div class="k" id="gSk">модулів у тіні зараз</div></div></div>${misLink('sun')}</div>
  <div class="blk"><h3>Обидва проєкти за добу, кВт</h3><div id="gChart"><p class="src">Рахую добу…</p></div><div class="plg"><span><i style="background:var(--rp)"></i>Вінниця</span><span><i style="background:var(--ours)"></i>Наш Б</span><span>суцільна — середня погода, пунктир — ясно</span></div></div>
  <div class="blk"><h3>У цю мить і за добу</h3><div id="gCmp"></div></div>${note}`; }
function genPanelUpdate(){ if(effSec()!=='sun'||!GNOW||(state.sunTab||'day')!=='day') return; const k=state.proj, g=GNOW[k], el=id=>document.getElementById(id); if(!el('gP')) return;
  const M=g.n.reduce((a,b)=>a+b,0);
  el('gP').textContent=nf(g.Pc,0)+' кВт'; el('gPp').textContent=`о ${hhmm(state.hour)}, ясно (${nf(g.Pc/KWP[k]*100,0)} % від ${nf(KWP[k],1)} кВтп); сер. погода ${nf(g.Pa,0)} кВт`;
  el('gS').textContent=nf(M-g.n[0]); el('gSk').textContent=`з ${nf(M)} у тіні: до ½ — ${nf(g.n[1])}, понад ½ — ${nf(g.n[2])}, увесь — ${nf(g.n[3])}`;
  const cv=CURVE[state.day];
  if(cv){ const kA=k+'A', kC=k+'C'; el('gE').textContent=nf(energyTo(cv,kA,state.hour),0); el('gD').textContent=nf(energyTo(cv,kA,99),0); el('gDk').textContent=`кВт·год за добу, сер. погода (ясно — ${nf(energyTo(cv,kC,99),0)})`;
    const ln=el('gNowLine'); if(!ln) el('gChart').innerHTML=chartSVG(cv); else { const x0=+ln.dataset.x0, x1=+ln.dataset.x1, x=36+(state.hour-x0)/(x1-x0)*(360-44); ln.setAttribute('x1',x); ln.setAttribute('x2',x); }
    const e=(p,kk)=>energyTo(cv,p+kk,99), sh=p=>GNOW[p].n.reduce((a,b)=>a+b,0)-GNOW[p].n[0];
    el('gCmp').innerHTML=cmpTable([['Потужність зараз, ясно, кВт',nf(GNOW.rp.Pc,0),nf(GNOW.ours.Pc,0)],['Модулів у тіні зараз',nf(sh('rp')),nf(sh('ours'))],['З ранку, сер., кВт·год',nf(energyTo(cv,'rpA',state.hour),0),nf(energyTo(cv,'oursA',state.hour),0)],['За добу, сер., кВт·год',nf(e('rp','A'),0),nf(e('ours','A'),0),'tot'],['За добу, ясно, кВт·год',nf(e('rp','C'),0),nf(e('ours','C'),0)],['За добу на 1 кВтп, сер.',nf(e('rp','A')/KWP.rp,2),nf(e('ours','A')/KWP.ours,2)]],state.proj); }
  else { dayCurve(state.day,()=>{ genPanelUpdate(); }); } }
// режими і легенда над моделлю — свої для кожного розділу
function hudCtx(){ const sec=state.sec, e=effSec(), rp=state.proj==='rp', L=state.lay; let modes=[], lg='';
  const tg=(k,t)=>[k,t,!!L[k]];
  if(sec==='bz'){ modes=rp?[tg('cones','Зони щогл'),tg('bzMods','Модулі'),tg('bzMount','Кріплення')]:[tg('blocks','Блоки кольором'),tg('bzMods','Модулі'),tg('bzMount','Кріплення')];
    lg=rp?`<span class="t">Блискавкозахист</span><span><i class="sw" style="background:#dc9a52"></i>зони щогл</span><span><i class="sw" style="background:#2a9fd0"></i>дріт і спуски</span><span><i class="sw" style="background:#3cae4f"></i>вирівнювання</span>`
         :`<span class="t">Блискавкозахист</span><span><i class="sw" style="background:#8fbf1f"></i>провідник вирівнювання</span><span><i class="sw" style="background:#e0782b"></i>ПЗІП</span><span><i class="sw" style="background:#8a5a2b"></i>заземлення</span>`; }
  else if(sec==='km'){ modes=[tg('ghost','Напівпрозорі модулі'),tg('kMods','Модулі')];
    lg=rp?`<span class="t">Кріплення</span><span><i class="sw" style="background:#b9c3ca"></i>трикутники</span><span><i class="sw" style="background:#a3a199"></i>баласт</span><span><i class="sw" style="background:#8d989f"></i>сполучники</span>`
         :`<span class="t">Кріплення</span><span><i class="sw" style="background:#9aa5ad"></i>лаги</span><span><i class="sw" style="background:#a3a199"></i>блоки</span><span><i class="sw" style="background:#c0392b"></i>шпильки</span><span><i class="sw" style="background:#7f8f99"></i>гільзи</span>`; }
  else if(e==='sun'&&sec!=='mis'||state.mis==='gen'&&sec==='mis'){ const yr=!L.sunPlain&&L.sunYear&&YR; modes=[['sunNow','Тінь зараз',!L.sunPlain&&!yr],...(YR?[['sunYr','Тінь за рік',!!yr]]:[]),['sunPlain1','Звичайний вигляд',!!L.sunPlain]];
    lg=L.sunPlain?'':yr?`<span class="t">Тінь за рік забирає</span>${LSC.map((c,i)=>`<span><i class="sw" style="background:${c}"></i>${LSN[i]}</span>`).join('')}`:`<span class="t">Тінь зараз</span>${SHC.map((c,i)=>`<span><i class="sw" style="background:${c}"></i>${SHN[i]}</span>`).join('')}`; }
  if(sec==='mis'){ const M=MIS.find(m=>m.id===state.mis); if(!M) lg=`<span class="t">Невідповідності</span><span>оберіть пункт у панелі або червоний номер на даху</span>`; else if(M.id!=='gen') lg=`<span class="t">${MIS.indexOf(M)+1}. ${esc(M.t)}</span>`+M.leg.map(l=>`<span><i class="sw" style="background:${l[0]}"></i>${esc(l[1])}</span>`).join(''); }
  if(sec==='pz') lg=`<span class="t">${rp?'Вінницький проєкт':'Наш варіант Б'}</span><span>${rp?'1 440 модулів на трикутниках 15°':'1 953 модулі паралельно покрівлі'}</span>`;
  const mEl=$('#modes'); mEl.hidden=!modes.length; mEl.innerHTML=modes.map(([k,t,on])=>`<button type="button" data-m="${k}" aria-pressed="${on}">${esc(t)}</button>`).join('');
  mEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{ const k=b.dataset.m; if(k==='sunNow'){ L.sunPlain=false; L.sunYear=false; } else if(k==='sunYr'){ L.sunPlain=false; L.sunYear=true; } else if(k==='sunPlain1') L.sunPlain=true; else L[k]=!L[k]; apply(); });
  const lEl=$('#legend'); lEl.hidden=!lg; lEl.innerHTML=lg; }
function apply(){ const P=state.proj; if(XN&&(XN.proj!==P||effSec()!=='km')) closeNode(true);
  document.querySelectorAll('#proj button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===P?'true':'false'));
  document.querySelectorAll('#tabs button').forEach(b=>{ const on=b.dataset.s===state.sec; b.setAttribute('aria-selected',on?'true':'false'); if(on){ const tb=$('#tabs'), x=b.offsetLeft-tb.clientWidth/2+b.offsetWidth/2; tb.scrollTo({left:Math.max(0,x),behavior:RM?'auto':'smooth'}); } });
  const pane=$('#pane'), sec=state.sec; pane.innerHTML=sec==='bz'?panelBZ():sec==='km'?panelKM():sec==='sun'?panelSun():sec==='mis'?panelMis():panelPZ();
  pane.querySelectorAll('.lay input').forEach(inp=>inp.onchange=()=>{ state.lay[inp.dataset.k]=inp.checked; setVis(); hudCtx(); save(); });
  pane.querySelectorAll('[data-mis]').forEach(b=>b.onclick=()=>{ const id=b.dataset.mis||null; if(!id||id===state.mis){ state.mis=null; apply(); } else goMis(id); });
  pane.querySelectorAll('[data-gomis]').forEach(b=>b.onclick=()=>goMis(b.dataset.gomis));
  pane.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{ state.sunTab=b.dataset.st; apply(); }); xBind(pane);
  drawSunPath(); setVis(); hudCtx(); placeSun(); sunUI(); save(); hideTip(); rpDetail(); }
// ================= камера
const VIEWS={over:{t:'Огляд',p:[-38,95,-150],c:[56,6,-46]},top:{t:'Зверху',p:[56,215,-47],c:[56,0,-46.5]},ridge:{t:'Арка 18 м',p:[14,24,-30],c:[27,14.5,-41]},wh:{t:'Склад',p:[150,30,40],c:[110,4,16]},ess:{t:'Контейнери',p:[128,26,-48],c:[100,2,-68]},node:{t:'Вузол',dyn:true}};
const cams=$('#cams'); Object.entries(VIEWS).forEach(([k,v])=>{ const b=document.createElement('button'); b.type='button'; b.dataset.c=k; b.textContent=v.t; b.setAttribute('aria-pressed',k==='over'?'true':'false'); b.onclick=()=>{ cams.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); goCam(k); }; cams.appendChild(b); });
let anim=null; const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function nodeView(){ if(state.proj==='rp'){ let best=null,bd=1e9; DATA.rpm.con.forEach(c=>{ const t=RT[c[0]], d=(t.X-21.7)**2+(t.Y-41)**2; if(d<bd){ bd=d; best=t; } }); const c=W(best.X,best.Y+1.09,roofZ(best.X)+0.2); return {c:[c.x,c.y,c.z],p:[c.x+3.4,c.y+1.9,c.z+1.9]}; }
  let best=null,bd=1e9; OD.xp.forEach(x=>{ if(x[4]) return; const X=LX(x[0]), d=(X-21.7)**2+(x[2]-41)**2; if(d<bd){ bd=d; best=[X,x[2]]; } }); const c=W(best[0],best[1],roofZ(best[0])+0.08); return {c:[c.x,c.y,c.z],p:[c.x+1.5,c.y+1.0,c.z+2.0]}; }
function goCam(k){ if(VIEWS[k].dyn){ openNodeHere(); return; } goTo(VIEWS[k]); }
function goTo(v){ const p0=camera.position.clone(), c0=controls.target.clone(), p1=new V3(...v.p), c1=new V3(...v.c);
  if(RM){ camera.position.copy(p1); controls.target.copy(c1); need=true; rpDetail(); return; } anim={t0:performance.now(),p0,c0,p1,c1}; }
camera.position.set(...VIEWS.over.p); controls.target.set(...VIEWS.over.c);
let detT=0; controls.addEventListener('change',()=>{ need=true; detT=performance.now(); if(!tip.hidden&&performance.now()-tipT>600) hideTip(); });

// ================= вибір об’єкта
const ray=new THREE.Raycaster(), mouse=new THREE.Vector2(), tip=$('#tip');
function hideTip(){ tip.hidden=true; }
let tipT=0;
let down=null;
canvas.addEventListener('pointerdown',e=>{ down=[e.clientX,e.clientY]; });
canvas.addEventListener('pointerup',e=>{ if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5) return; const r=canvas.getBoundingClientRect();
  mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(mouse,camera);
  if(MARKS.visible){ const mh=ray.intersectObjects(MARKS.children.filter(o=>o.isSprite),false); if(mh.length){ goMis(mh[0].object.userData.mis); return; } }
  if(XN){ const xh=ray.intersectObject(XG,true).filter(x=>x.object.isMesh); if(xh.length){ showTip(xh[0].object.userData.info,e,r); return; } }
  const objs=PICK.filter(p=>{ let o=p.o; while(o){ if(!o.visible) return false; o=o.parent; } return !p.when||p.when(); });
  const hits=ray.intersectObjects(objs.map(p=>p.o),false); if(!hits.length){ hideTip(); return; }
  const h=hits[0]; if(state.sec==='km'&&XCAN.has(h.object)&&openNodeAt(h.point.x,-h.point.z)) return;
  const u=h.object.userData.info, inf=typeof u==='function'?u(h.instanceId):u; showTip(inf,e,r); });
function showTip(inf,e,r){ if(!inf){ hideTip(); return; } tip.innerHTML=`<b>${esc(inf.t)}</b>${esc(inf.d||'')}`; tip.hidden=false; tipT=performance.now();
  const tw=tip.offsetWidth, th=tip.offsetHeight; let x=e.clientX-r.left+14, y=e.clientY-r.top+14; if(x+tw>r.width-8) x=r.width-tw-8; if(y+th>r.height-8) y=e.clientY-r.top-th-14;
  tip.style.transform=`translate(${Math.max(8,x)}px,${Math.max(8,y)}px)`; }
window.addEventListener('keydown',e=>{ if(e.key==='Escape'){ hideTip(); if(XN) closeNode(); } });

// ================= вузол по деталях: клік по модулю або кріпленню — вузол розходиться шарами вгору, з підписами
const XG=new THREE.Group(); scene.add(XG);
const XMAT={}; const xm=k=>XMAT[k]||(XMAT[k]=MAT[k].clone());
XMAT.lagS=std(0x9aa5ad,{metalness:0.5,roughness:0.45}); XMAT.lagS.color.convertSRGBToLinear();
XMAT.modL=MAT.pvL.clone(); XMAT.modP=MAT.pvP.clone();
XMAT.draw=new THREE.MeshBasicMaterial({color:0x1fae5a});
const EVI=new Map(); { let e=0; RT.forEach((t,i)=>{ if(t.k%2===0) EVI.set(i,e++); }); }
const SPI=new Map(DATA.rpm.sp.map((i,q)=>[i,q]));
const XCAN=new Set([RPM_.mods,...RPM_.lod,...RPM_.det,...RPM_.detC,RPM_.con,RPM_.blk,RPM_.mat,RPM_.sp,RPM_.cl,ourMods,lagMesh,OUR.blk,OUR.mat,OUR.sl,OUR.cp,OUR.rods,OUR.xp,OUR.ang,OUR.cl,OUR.an]);
const xls=$('#xls'), xbar=$('#xbar'), _xv=new V3();
function lagAt(X,Y){ return LG.findIndex(l=>Math.abs(l[0]-X)<2e-3&&Y>=l[1]-0.01&&Y<=l[2]+0.01); }
function rpModAt(X,Y,ok){ let b=-1,bd=9; RMOD.forEach((m,j)=>{ if(ok&&!ok(m)) return; const t=RT[m.i], d=(t.X-X)**2+(t.Y-Y)**2; if(d<bd){ bd=d; b=j; } }); return b; }
function ourModAt(X,Y){ let b=-1,bd=9; OM.forEach((m,i)=>{ const d=((m.Xa+m.Xb)/2-X)**2+(m.Y-Y)**2; if(d<bd){ bd=d; b=i; } }); return b; }
function xNew(proj,idx,step){ return {proj,idx,step,layers:[],hide:[],t0:0,dir:1,anim:false,shown:0}; }
function xLayer(N,L,name,q,warn){ const g=new THREE.Group(); XG.add(g); const o={L,name,q,warn:warn||'',g,box:new THREE.Box3(),n:0,f:0}; N.layers.push(o); return o; }
function xPart(ly,geo,mat,M,info){ const o=new THREE.Mesh(geo,mat); o.matrixAutoUpdate=false; o.matrix.copy(M); o.castShadow=true; o.receiveShadow=true; o.userData.info=info; ly.g.add(o);
  if(!geo.boundingBox) geo.computeBoundingBox(); ly.box.union(geo.boundingBox.clone().applyMatrix4(M)); ly.n++; return o; }
function xHide(N,im,i){ const M=new M4(); im.getMatrixAt(i,M); N.hide.push({im,i,M:M.clone()}); im.setMatrixAt(i,ZERO); im.instanceMatrix.needsUpdate=true; return M; }
const rng=a=>{ const lo=Math.min(...a), hi=Math.max(...a); return lo===hi?nf(lo):nf(lo)+'–'+nf(hi); };

// Вінниця: модуль на трьох трикутниках (крайні спільні з сусідніми модулями)
function buildRP(j){ const m=RMOD[j], tris=[m.i-1,m.i,m.i+1], N=xNew('rp',j,0.26), t0=RT[m.i];
  N.tris=tris; N.triSet=new Set(tris); N.cons=[]; CON.forEach((c,k)=>{ if(N.triSet.has(c.i)) N.cons.push(k); }); N.conSet=new Set(N.cons);
  const bad=N.cons.filter(k=>CON[k].ov<=0), gaps=N.cons.map(k=>Math.round(CON[k].p*1000-1400));
  const gB=RPM_.det[0].geometry, gR=RPM_.det[1].geometry, gS=RPM_.det[2].geometry, gH=RPM_.det[3].geometry, gC=RPM_.detC[0].geometry, gCH=RPM_.detC[1].geometry;
  const lMat=xLayer(N,0,'Мати під баласт',tris.length*2+' шт');
  const lBlk=xLayer(N,1,'Баласт B300300-60, 13 кг',`${tris.length*2} шт · ${tris.length*26} кг`);
  const lCon=N.cons.length?xLayer(N,2,'Сполучник Spol-15Zn-700',N.cons.length+' шт',bad.length?`між основами рядів ${rng(gaps)} мм, на кресленні 600 — до основи не дістає`:''):null;
  const lBase=xLayer(N,3,'Основа U 45×40×3, 1 400',tris.length+' шт');
  const lRail=xLayer(N,4,'Пояс 1 160, стійка ≈345, болти M8',`${tris.length} + ${tris.length}`);
  const q=SPI.get(tris[0]); const lSp=q!==undefined?xLayer(N,5,'Спойлер Vitr-240×2450','1 шт'):null;
  const ends=[tris[0],tris[2]], nZ=ends.filter(i=>RT[i].k===0||RT[i].k===2*RT[i].n).length*2;
  const lCl=xLayer(N,6,nZ?'Притиски W35 / Z33':'Притиски W35',nZ?`${4-nZ} / ${nZ}`:'4 шт');
  const lMod=xLayer(N,7,'Модуль 710 Вт, 2384 × 1303','1 шт','на кресленні — 2278 × 1134 (зелена рамка): звисає за пояс 1 160 на 71,5 мм з кожного боку');
  const triI=i=>({t:'Трикутник BalZn15-1568.1470, 15°',d:`За АБ арк. 6: основа 1 400, пояс 1 160, стійка ≈345, 3 болти M8. Ухил покрівлі під ним ${nf(Math.abs(Math.atan(roofK(RT[i].X))/D2R),1)}°.`});
  tris.forEach(i=>{ const F=RT[i].F; xHide(N,RPM_.mat,i); xHide(N,RPM_.blk,i);
    xPart(lMat,RPM_.mat.geometry,xm('mat'),F,{t:'Мат під баласт',d:'Під кожен блок; 5 396 за АБ арк. 8'});
    xPart(lBlk,RPM_.blk.geometry,xm('blk'),F,{t:'Баласт B300300-60, 13 кг',d:'2 на трикутник, центри за 65 мм від торців основи, виступають за основу на 85 мм; гвинт R-LX 6,3×50 крізь основу'});
    xPart(lBase,gB,xm('zn'),F,triI(i)); [gR,gS].forEach(g=>xPart(lRail,g,xm('zn'),F,triI(i))); xPart(lRail,gH,xm('hw'),F,{t:'Болти M8 трикутника',d:'3 комплекти на трикутник: основа — пояс, основа — стійка, стійка — пояс (АБ арк. 8)'}); });
  N.cons.forEach(k=>{ const c=CON[k], inf={t:'Сполучник Spol-15Zn-700',d:`U 38×36×3, L 700, болт M8 у кожну основу. Крок рядів тут ${nf(c.p*1000)} мм, між основами ${nf(c.p*1000-1400)} мм — ${c.ov>0?'заходження '+c.ov+' мм':'до основи сусіднього ряду не дістає'}; на кресленні — крок 2 000, по 50 мм в основу.`};
    xPart(lCon,gC,c.ov<=0?xm('conBad'):xm('znD'),c.M,inf); xPart(lCon,gCH,xm('hw'),c.M,inf); });
  if(lSp){ const M=xHide(N,RPM_.sp,q); xPart(lSp,RPM_.sp.geometry,xm('sp'),M,{t:'Спойлер Vitr-240×2450',d:'Планка за стійками вздовж ряду, перекриває два трикутники (АБ арк. 6, поз. 6)'}); }
  ends.forEach(i=>{ const e=EVI.get(i); if(e===undefined) return; const z=RT[i].k===0||RT[i].k===2*RT[i].n; [0,1].forEach(s=>{ const M=xHide(N,RPM_.cl,e*2+s); xPart(lCl,BOX,xm('al'),M,{t:z?'Притиск Z33 (крайній)':'Притиск W35 (середній)',d:'По 2 на пояс, місце — схема; АБ арк. 8: W35 — 2 520, Z33 — 3 232'}); }); });
  const MM=xHide(N,RPM_.mods,j); xPart(lMod,BOX,XMAT.modL,MM,{t:'Модуль Shinefar SF-M21/G132710, 710 Вт',d:'2384 × 1303 × 35 (ЕТР арк. 2, PVsyst). Трикутник на АБ арк. 6 — під модуль 2278 × 1134 (зелена рамка): пояс 1 160 коротший за модуль на 143 мм.'});
  { const hx=2.278/2.384/2, hz=1.134/1.303/2, wx=0.016/2.384, wz=0.016/1.303, fr=(x,z,sx,sz)=>{ const o=new THREE.Mesh(BOX,XMAT.draw); o.matrixAutoUpdate=false; o.matrix.copy(MM).multiply(new M4().compose(new V3(x,0.75,z),QI,new V3(sx,0.5,sz))); lMod.g.add(o); };
    fr(0,-hz,2*hx+wx,wz); fr(0,hz,2*hx+wx,wz); fr(-hx,0,wx,2*hz); fr(hx,0,wx,2*hz); }
  RPM_.lod.forEach(im=>tris.forEach(i=>im.setMatrixAt(i,ZERO))); N.cons.forEach(k=>RPM_.con.setMatrixAt(k,ZERO));
  N.title='Вінниця · модуль на 3 трикутниках'; N.sub=`ухил під модулем ${nf(m.slope,1)}° · середній трикутник вищий за лінію крайніх на ${nf(Math.max(0,m.sag))} мм · різниця нахилу опор ${nf(m.dth,1)}°`;
  N.c=W(t0.X,t0.Y,roofZ(t0.X)+0.25); return N; }

// Наш Б: модуль на двох лагах — частка лаг 2,4 м, блоки, гільзи, шпильки, притиски
function buildOurs(i){ const m=OM[i], N=xNew('ours',i,0.3), y0=m.Y-1.2, y1=m.Y+1.2, inY=(y,e=0.005)=>y>=y0-e&&y<=y1+e;
  const la=lagAt(m.Xa,m.Y), lb=lagAt(m.Xb,m.Y), Ls=[la,lb].filter(x=>x>=0), onL=l=>l===la||l===lb, nb=OD.blk.length, ne=OD.eblk.length;
  const B=[], MT=[]; OD.blk.forEach((b,k)=>{ if(onL(b[0])&&inY(b[1],-0.005)){ B.push([k,'b']); MT.push(k); } }); OD.eblk.forEach((b,k)=>{ if(onL(b[0])&&inY(b[1])){ B.push([nb+k,'e']); MT.push(nb+k); } });
  OD.xblk.forEach((b,k)=>{ if(b[0]>m.Xa&&b[0]<m.Xb&&inY(b[1],0.03)) B.push([nb+ne+k,'x']); });
  const SL=[]; OD.sl.forEach((s,k)=>{ if(onL(s[0])&&inY(s[1])) SL.push(k); });
  const RD=[]; OD.rods.forEach((r,k)=>{ if(r[0]===la&&r[1]===lb&&inY(r[2])) RD.push(k); });
  const XP=[]; OD.xp.forEach((x,k)=>{ if(x[0]===la&&x[1]===lb&&inY(x[2],0.03)) XP.push(k); });
  const CL=[]; OD.cl.forEach((c,k)=>{ if(onL(c[0])&&inY(c[1],-0.005)) CL.push(k); });
  const AN=[]; OD.an.forEach((a,k)=>{ if(onL(a[0])&&inY(a[1])) AN.push(k); });
  const lSt=xLayer(N,0,null,'');
  const lMat=MT.length?xLayer(N,0,'Мат 320×320×3',MT.length+' шт'):null;
  const lBlk=xLayer(N,1,'Блок «Баласт із муфтою» 300×300×60',`${B.length} шт · ${B.length*13} кг`);
  const lAn=AN.length?xLayer(N,1,'Анкер від сповзання',AN.length+' шт'):null;
  const lRod=RD.length?xLayer(N,2,'Шпилька M10 1 299, права і ліва різьба',RD.length+' шт'):null;
  const lSl=SL.length?xLayer(N,3,'Гільза 200 з муфтою M10×50, болти M10×60',SL.length+' шт'):null;
  const lLag=xLayer(N,4,'Лага 41×41×1,5 пазом догори',`${Ls.length} × ${nf(2.4,1)} м`);
  const lXp=XP.length?xLayer(N,4,'Крайній профіль 41×41 і кутники 160/150',`${XP.length} + ${XP.length*2}`):null;
  const nZ=CL.filter(k=>OD.cl[k][2]).length, lCl=xLayer(N,5,nZ?'Притиски середні / Z33':'Притиски середні',nZ?`${CL.length-nZ} / ${nZ}`:CL.length+' шт');
  const lMod=xLayer(N,6,'Модуль ZNSHINE 730 Вт, 2384 × 1303','1 шт');
  B.forEach(([k,t])=>{ const M=xHide(N,OUR.blk,k); xPart(lBlk,BOX,xm('blk'),M,t==='b'?{t:'Блок «Баласт із муфтою» 300×300×60, 13 кг',d:'Під лагою, 575 + 1 200·k від торця; мат 320×320×3; лага — болтом M8×20 у муфту'}:t==='e'?{t:'Блок під кінцем лаги',d:'Центр за 30 мм від торця лаги, з матом'}:{t:'Блок під крайнім профілем',d:'2 на модуль, за 300 мм від осей лаг, без мата'}); });
  MT.forEach(k=>{ const M=xHide(N,OUR.mat,k); xPart(lMat,BOX,xm('mat'),M,{t:'Мат 320×320×3',d:'Під блоком лаги, захищає покрівлю'}); });
  AN.forEach(k=>{ const M=xHide(N,OUR.an,k); xPart(lAn,OUR.an.geometry,xm('anc'),M,{t:'Анкер від сповзання',d:'На верхній лазі ряду, що не переходить гребінь; тип і кріплення — за обстеженням покрівлі'}); });
  RD.forEach(k=>{ const M=xHide(N,OUR.rods,k), p=OD.rods[k][3]===2; xPart(lRod,BOX,xm(p?'rodP':'rod'),M,p?{t:'Шпилька M10 через прохід',d:'570 / 790 / 1 580 мм; права / ліва різьба, контргайки'}:{t:'Шпилька M10 1 299 мм',d:'Між муфтами гільз сусідніх лаг, права різьба із заходу, ліва — зі сходу'}); });
  SL.forEach(k=>{ const inf={t:'Гільза П 45,5×35×2, L 200, з муфтою M10×50',d:'На стику модулів під лагою, 2 болти M10×60 крізь лагу; муфта знизу — права і ліва різьба під шпильки'}; xPart(lSl,BOX,xm('sl'),xHide(N,OUR.sl,k),inf); xPart(lSl,BOX,xm('hw'),xHide(N,OUR.cp,k),inf); });
  Ls.forEach(l=>{ const L=LG[l], a=Math.max(L[1],y0), b=Math.min(L[2],y1); xHide(N,lagMesh,l);
    const piece=(ya,yb,ly,info)=>{ if(yb-ya<0.005) return; rf(L[0],(ya+yb)/2,0.0835); xPart(ly,BOX,XMAT.lagS,new M4().compose(_p.clone(),_q.clone(),new V3(0.041,0.041,yb-ya)),info); };
    const li={t:'Лага 41×41×1,5 пазом догори',d:`Під модулем — ${nf(b-a,2)} м; уся лінія ${nf(L[2]-L[1],1)} м зі шматків 4 800 і 2 400, стики в гільзах 200`};
    piece(L[1],a,lSt,li); piece(b,L[2],lSt,li); piece(a,b,lLag,li); });
  XP.forEach(k=>{ const inf=OD.xp[k][4]?{t:'Профіль 41×41 через прохід',d:'530 / 760 / 1 540 мм на кутниках 160/150 між верхніми лагами двох схилів'}:{t:'Крайній профіль 41×41×1,5, ≈1 263 мм',d:'На краю ряду між лагами, на 2 блоках без мата; кутники 160/150 t = 8, Z33 на модулі'};
    xPart(lXp,BOX,xm('zn'),xHide(N,OUR.xp,k),inf); [0,1].forEach(s=>xPart(lXp,BOX,xm('hw'),xHide(N,OUR.ang,k*2+s),inf)); });
  CL.forEach(k=>{ const z=OD.cl[k][2]; xPart(lCl,BOX,xm('al'),xHide(N,OUR.cl,k),z?{t:'Притиск Z33 (крайній)',d:'На крайньому профілі або кінці лаги, болт M8 у паз лаги'}:{t:'Притиск середній',d:'Між рамами сусідніх модулів, болт M8 з гайкою з пружиною в паз лаги'}); });
  xPart(lMod,BOX,XMAT.modP,xHide(N,ourMods,i),{t:'Модуль ZNSHINE ZXN8-BD132-730, 730 Вт',d:'2384 × 1303 × 33, паралельно покрівлі на двох лагах, низ рами на 104 мм над покрівлею'});
  const za=roofZ(m.Xa), zb=roofZ(m.Xb);
  N.title='Наш Б · модуль на двох лагах'; N.sub=`ухил покрівлі під модулем ${nf(Math.abs(Math.atan2(zb-za,m.Xb-m.Xa))/D2R,1)}° · модуль за ухилом даху · лаги стягнуті шпильками крізь муфти гільз`;
  N.c=W((m.Xa+m.Xb)/2,m.Y,(za+zb)/2+0.1); return N; }

// решта кріплення на час розбору — напівпрозора, щоб деталі вузла читалися
const XDIM=['zn','znD','hw','blk','mat','sp','al','conM','conBad','lag','sl','rod','rodP','anc'];
function xDim(on){ XDIM.forEach(k=>{ const m=MAT[k]; if(!m) return; m.transparent=on; m.opacity=on?0.16:1; m.depthWrite=!on; m.needsUpdate=true; }); need=true; }
function xMaxL(N){ return Math.max(...N.layers.map(l=>l.L)); }
function openNode(proj,idx,fly=true){ if(XN&&XN.proj===proj&&XN.idx===idx){ if(XN.dir<0) xPlay(1); return; } closeNode(true);
  XN=proj==='rp'?buildRP(idx):buildOurs(idx); xDim(true); markersVis(); if(proj==='rp') rpDetail();
  XN.layers.forEach(ly=>{ if(!ly.name) return; const el=document.createElement('div'); el.className='xl'; el.style.opacity=0; el.innerHTML=`<span>${esc(ly.name)}<em>${esc(ly.q)}</em>${ly.warn?`<i>${esc(ly.warn)}</i>`:''}</span>`; xls.appendChild(el); ly.el=el; ly.w=el.offsetWidth; ly.h=el.offsetHeight; });
  $('#xbT').textContent=XN.title; $('#xbS').textContent=XN.sub; xbar.hidden=false; hideTip();
  if(fly){ const top=xMaxL(XN)*XN.step, c=XN.c.clone().add(new V3(0,top*0.45,0)), asp=Math.max(0.3,camera.aspect), d=(XN.proj==='rp'?4.6:4.4)*Math.max(1,1.35/asp), dir=(XN.proj==='rp'?new V3(0.7,0.36,0.78):new V3(0.8,0.5,0.6)); if(roofK(XN.c.x)>0.02) dir.x=-dir.x; dir.normalize();
    goTo({c:[c.x,c.y,c.z],p:[c.x+dir.x*d,c.y+dir.y*d,c.z+dir.z*d]}); }
  xPlay(1); xPanel(); need=true; }
function closeNode(silent){ if(!XN) return; const N=XN; XN=null;
  N.hide.forEach(h=>{ h.im.setMatrixAt(h.i,h.M); h.im.instanceMatrix.needsUpdate=true; });
  if(N.proj==='rp'){ N.tris.forEach(i=>RPM_.lod.forEach(im=>im.setMatrixAt(i,RT[i].F))); N.cons.forEach(k=>RPM_.con.setMatrixAt(k,CON[k].M)); RPM_.lod.forEach(im=>im.instanceMatrix.needsUpdate=true); RPM_.con.instanceMatrix.needsUpdate=true; rpDetail(); }
  XG.children.slice().forEach(g=>XG.remove(g));
  xDim(false); markersVis(); xls.innerHTML=''; xbar.hidden=true; if(!silent) xPanel(); need=true; }
function xPlay(dir){ if(!XN) return; XN.dir=dir; XN.t0=performance.now(); XN.anim=true; const b=$('#xbTog'); b.textContent=dir>0?'Зібрати':'Розібрати'; need=true; }
// шари: кожен наступний стартує на 110 мс пізніше; при збиранні — згори вниз
function xTick(now){ if(!XN||!XN.anim) return; const N=XN, mx=xMaxL(N), dur=RM?1:650, gap=RM?0:110; let done=true;
  N.layers.forEach(ly=>{ const del=(N.dir>0?ly.L:mx-ly.L)*gap, s=Math.max(0,Math.min(1,(now-N.t0-del)/dur)); if(s<1) done=false; const e=s*s*(3-2*s), f=N.dir>0?e:1-e; ly.f=f; ly.g.position.y=f*ly.L*N.step; });
  N.shown=Math.max(...N.layers.map(l=>l.L?l.f:0)); if(done) N.anim=false; need=true; }
function xLabels(){ if(!XN) return; camera.updateMatrixWorld(); const v=canvas.parentElement, Wd=v.clientWidth, Hd=v.clientHeight, show=XN.shown>0.6, items=[];
  XN.layers.forEach(ly=>{ if(!ly.el||ly.box.isEmpty()) return; const b=ly.box, dy=ly.g.position.y; let mn=1e9, mxx=-1e9, sy=0, n=0, front=true;
    for(const x of [b.min.x,b.max.x]) for(const y of [b.min.y,b.max.y]) for(const z of [b.min.z,b.max.z]){ _xv.set(x,y+dy,z).project(camera); if(_xv.z>1) front=false; const sx=(_xv.x+1)/2*Wd; mn=Math.min(mn,sx); mxx=Math.max(mxx,sx); sy+=(1-_xv.y)/2*Hd; n++; }
    items.push({ly,mn,mx:mxx,y:sy/n,front}); });
  items.sort((a,b)=>a.y-b.y); let last=-1e9;
  items.forEach(it=>{ const ly=it.ly, w=ly.w||ly.el.offsetWidth, h=ly.h||ly.el.offsetHeight; let y=Math.max(it.y-h/2,last+3); last=y+h; let x=it.mx+6, fl=false;
    if(x+w>Wd-6){ x=it.mn-6-w; fl=true; } if(x<6){ x=Math.max(6,Math.min(Wd-w-6,it.mx+6)); fl=false; }
    ly.el.classList.toggle('l',fl); ly.el.style.transform=`translate(${Math.round(x)}px,${Math.round(Math.min(Hd-h-4,y))}px)`; ly.el.style.opacity=show&&it.front?1:0; }); }
// панель «Кріплення»: що в розібраному вузлі
function xPanelHTML(){ const rp=state.proj==='rp';
  if(!XN) return `<h3>Вузол по деталях</h3><p class="src">Натисніть на модуль або деталь кріплення — вузол розійдеться шарами вгору, біля кожної деталі підпис. «Зібрати» — назад, × — закрити.</p><button type="button" class="lnk" data-xnode="here">↑ Розібрати вузол у центрі екрана</button>`;
  const rows=XN.layers.filter(l=>l.name).slice().sort((a,b)=>b.L-a.L);
  return `<h3>Вузол по деталях · ${esc(XN.title.split(' · ')[1]||'')}</h3><table class="cmp xt"><tbody>${rows.map(l=>`<tr><td>${esc(l.name)}${l.warn?`<small class="w">${esc(l.warn)}</small>`:''}</td><td>${esc(l.q)}</td></tr>`).join('')}</tbody></table><p class="src">${esc(XN.sub)}. ${rp?'Крайні трикутники, притиски й сполучники спільні з сусідніми модулями.':'Гільзи, шпильки і притиски на межі спільні з сусідніми модулями.'}</p><button type="button" class="lnk" data-xnode="close">Закрити вузол</button>`; }
function xPanel(){ const el=document.getElementById('xnb'); if(el){ el.innerHTML=xPanelHTML(); xBind(el); } }
function xBind(root){ root.querySelectorAll('[data-xnode]').forEach(b=>b.onclick=()=>{ const a=b.dataset.xnode; if(a==='close') closeNode(); else if(a==='here') openNodeHere(); else if(a.startsWith('mis:')) misNode(a.slice(4)); }); }
function openNodeAt(X,Y,fly=true){ const rp=state.proj==='rp', i=rp?rpModAt(X,Y):ourModAt(X,Y); if(i<0) return false; openNode(state.proj,i,fly); return true; }
function openNodeDefault(){ if(state.proj==='rp'){ const hasC=m=>CON.some(c=>Math.abs(c.i-m.i)<=1); const j=rpModAt(21.7,41,hasC); if(j>=0) openNode('rp',j); return; }
  let best=null,bd=1e9; OD.xp.forEach(x=>{ if(x[4]) return; const X=(LX(x[0])+LX(x[1]))/2, d=(X-21.7)**2+(x[2]-41)**2; if(d<bd){ bd=d; best=[X,x[2]-x[3]*1.2]; } }); if(best) openNodeAt(best[0],best[1]); }
function openNodeHere(){ if(effSec()!=='km'){ state.sec='km'; apply(); } const t=controls.target; if(camera.position.distanceTo(t)>40||!openNodeAt(t.x,-t.z)) openNodeDefault(); }
function misNode(id){ if(id==='con'){ const c=near(CON,c=>(RT[c.i].X-60)**2+(RT[c.i].Y-70)**2), j=RMOD.findIndex(m=>Math.abs(m.i-c.i)<=1); if(j>=0) openNode('rp',j); return; }
  const p=MISPOS[id](); openNodeAt(p.x,-p.z); }
$('#xbTog').onclick=()=>xPlay(XN&&XN.dir>0?-1:1); $('#xbX').onclick=()=>closeNode();

// ================= цикл
function resize(){ const v=canvas.parentElement, w=v.clientWidth, h=v.clientHeight; if(!w||!h) return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); need=true; }
new ResizeObserver(resize).observe(canvas.parentElement); resize();
function loop(now){ requestAnimationFrame(loop);
  if(anim){ const t=Math.min(1,(now-anim.t0)/900), s=t*t*(3-2*t); camera.position.lerpVectors(anim.p0,anim.p1,s); controls.target.lerpVectors(anim.c0,anim.c1,s); need=true; if(t>=1) anim=null; }
  xTick(now); if(controls.update()) need=true;
  if(detT&&!anim&&now-detT>140){ detT=0; rpDetail(); }
  if(need){ needle.style.transform=`rotate(${(controls.getAzimuthalAngle()/D2R).toFixed(1)}deg)`; if(XN) xLabels(); renderer.render(scene,camera); need=false; } }
// ▶ рух сонця по дню: крок 10 хв, швидкість ×1…×8
const SUNRS={}; function riseSet(day){ if(SUNRS[day]) return SUNRS[day]; let a=null,b=null; for(let h=3;h<=22;h+=1/60){ const up=sunVec(day,h).alt>0; if(up&&a===null) a=h; if(up) b=h; } return SUNRS[day]=[a,b]; }
let playT=null; const playBtn=$('#play'), SPDS=[1,2,4,8];
function setPlay(on){ clearInterval(playT); playT=null; playBtn.textContent=on?'❚❚':'▶'; playBtn.setAttribute('aria-label',on?'Зупинити сонце':'Запустити сонце'); playBtn.title=playBtn.getAttribute('aria-label');
  if(on){ const rs=riseSet(state.day); if(state.hour>=rs[1]-0.1||state.hour<rs[0]) state.hour=Math.ceil(rs[0]*6)/6; playT=setInterval(tickSun,Math.max(30,170/state.spd)); } else save(); }
function tickSun(){ const rs=riseSet(state.day); let h=Math.round(state.hour*6)/6+1/6; if(h>rs[1]) h=Math.ceil(rs[0]*6)/6; state.hour=h; placeSun(); }
playBtn.onclick=()=>setPlay(!playT);
$('#speed').textContent='×'+state.spd; $('#speed').onclick=()=>{ state.spd=SPDS[(SPDS.indexOf(state.spd)+1)%SPDS.length]; $('#speed').textContent='×'+state.spd; if(playT) setPlay(true); save(); };
// нижня панель: мала / половина / повна
const SHEETS=['peek','half','full'];
function sheetSet(st){ state.sheet=st; $('#sheet').dataset.s=st; save(); }
{ const g=$('#grab'); let y0=null, moved=false;
  g.addEventListener('pointerdown',e=>{ y0=e.clientY; moved=false; try{ g.setPointerCapture(e.pointerId); }catch(x){} });
  g.addEventListener('pointermove',e=>{ if(y0!==null&&Math.abs(e.clientY-y0)>14) moved=true; });
  g.addEventListener('pointerup',e=>{ if(y0===null) return; const dy=e.clientY-y0, i=SHEETS.indexOf(state.sheet); y0=null;
    if(moved) sheetSet(SHEETS[Math.max(0,Math.min(2,i+(dy<0?1:-1)))]); else sheetSet(SHEETS[(i+1)%3]); });
  g.addEventListener('pointercancel',()=>{ y0=null; }); }
if(!SHEETS.includes(state.sheet)) state.sheet=matchMedia('(max-width: 700px)').matches?'peek':'half';
$('#sheet').dataset.s=state.sheet;
function ctxSet(o){ state.ctx=o; $('#ctx').hidden=!o; const b=$('#ctxtoggle'); b.textContent=o?'▴':'▾'; b.setAttribute('aria-expanded',String(o)); b.title=o?'Сховати режими і легенду':'Показати режими і легенду'; b.setAttribute('aria-label',b.title); save(); }
$('#ctxtoggle').onclick=()=>ctxSet(!state.ctx); ctxSet(state.ctx);
const needle=$('#needle');
apply(); $('#loading').hidden=true; requestAnimationFrame(loop);
window.__twin={XG,rayAt:(x,y)=>{ const r=canvas.getBoundingClientRect(); mouse.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1); ray.setFromCamera(mouse,camera); const xh=ray.intersectObject(XG,true); return xh.length+' '+(xh[0]?xh[0].object.type+':'+(xh[0].object.userData.info||{}).t:''); },openNode,closeNode,openNodeHere,openNodeDefault,xPlay,misNode,getXN:()=>XN,state,apply,goCam,goTo,goMis,setPlay,sheetSet,yearCalc,MARKS,camera,genNow:()=>genNow(),CURVE,MIS,VIEWS,nodeView,camInfo:()=>JSON.stringify({p:camera.position.toArray().map(v=>+v.toFixed(2)),t:controls.target.toArray().map(v=>+v.toFixed(2)),det:RPM_.cur.length,tri:renderer.info.render.triangles,calls:renderer.info.render.calls}),cam:a=>{ camera.position.set(a[0],a[1],a[2]); controls.target.set(a[3],a[4],a[5]); controls.update(); need=true; rpDetail(); }};
})();
