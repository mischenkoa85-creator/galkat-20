// ================= «Будівництво»: покроковий 3D-монтаж обох проєктів (src/montage.js, ред. 2 — 26.10.2026)
// Переписано за промтом «Промт_3D_монтаж_Антарес_режисерський_сценарій_26.10» (docs/), бо версію 6de2c86 власник відхилив:
// немає деталізації, блок не прозорий, камера смикається, розкладання не з усіх боків, розмітки не видно.
// Що тут: камера-«оператор» на пружині з критичним загасанням (сферичні координати, межі швидкості, прозорість перешкод);
// палети, пачки, ящики й коробки по периметру — кожна деталь летить по дузі з найближчої, усі фронти одночасно;
// товсті лінії (LineSegments2) — синя розмітка, кабелі, провідник; прозорий зразок блока над першим хрестиком на даху;
// детальні зразки (лага з перфорацією, гільза з муфтою і болтами, шпилька права/ліва, кутники, щит 7/1, панель, лоток, міні-рейка);
// картка ліворуч (setViewOffset), виноски лише на зразку; усе в сцені — функція часу t (повзунок працює назад без помилок).
// build.sh вставляє файл у кінець app.js (перед останнім «})();»): видно сцену, стан і функції двійника. Увесь код — в окремому блоці.
{
const MT={active:false,proj:null,t:0,play:false,spd:1,free:false,tls:{},tp:{},T:null,last:0,dirty:true,uiT:0,actIx:-1,shotIx:-1,paneKey:'',sumClosed:false,auto:false,fr:0,camMoved:true,ui:null};
const SPDS=[1,2,5,0.5];
const c01=x=>x<0?0:x>1?1:x, lerp=(a,b,u)=>a+(b-a)*u;
const sm=x=>{ x=c01(x); return x*x*(3-2*x); }, s5=x=>{ x=c01(x); return x*x*x*(x*(x*6-15)+10); };
const eOut=x=>{ x=c01(x); return 1-Math.pow(1-x,3); }, eIn=x=>{ x=c01(x); return x*x*x; };
const eBack=x=>{ x=c01(x); const c=1.5; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const hsh=i=>{ const x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); };
const V=(x,y,z)=>new V3(x,y,z), YA=new V3(0,1,0), ONE3=new V3(1,1,1), WHITE=new THREE.Color(1,1,1), FLASH=new THREE.Color(2.1,1.75,1.05);
const lc=c=>new THREE.Color(c).convertSRGBToLinear();
const fm=m=>m==null?'—':m<1?nf(m*1000,m<0.01?1:0)+' г':nf(m,m<10?2:1)+' кг';
const ft=v=>v>=1000?nf(v/1000,v>=1e5?0:1)+' т':nf(v,0)+' кг';
const fq=v=>typeof v==='number'?nf(v,Math.abs(v%1)>1e-9?1:0):v;
const fmtT=s=>{ s=Math.max(0,Math.round(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const ub=(S_,x)=>{ let lo=0,hi=S_.length; while(lo<hi){ const m=(lo+hi)>>1; if(S_[m]<=x) lo=m+1; else hi=m; } return lo; };
const wide=()=>canvas.parentElement.clientWidth>=760;
const MTG=new THREE.Group(); MTG.name='montage'; MTG.visible=false; scene.add(MTG);
const _m=new M4(), _m2=new M4(), _v=new V3(), _v2=new V3(), _qa=new Q(), _qb=new Q(), _sa=new V3(), _sb=new V3(), _c=new THREE.Color();
const T_=(x,y,z)=>new M4().makeTranslation(x,y,z), Ry=a=>new M4().makeRotationY(a), Rz=a=>new M4().makeRotationZ(a), Rx=a=>new M4().makeRotationX(a);

// ---------- матеріали: кольори родин виробів однакові в усьому фільмі (промт, розд. 5)
const MM={};
{ const S_=(c,o)=>{ const m=new THREE.MeshStandardMaterial(Object.assign({roughness:0.6,metalness:0.1},o||{})); m.color.set(c).convertSRGBToLinear(); if(o&&o.emissive!==undefined) m.emissive.set(o.emissive).convertSRGBToLinear(); return m; };
  Object.assign(MM,{ conc:S_(0x9d9a93,{roughness:0.95}), concX:S_(0xc9c6be,{roughness:0.9,transparent:true,opacity:0.25,depthWrite:false}), mat:S_(0x262626,{roughness:1}),
    brass:S_(0xb8902f,{metalness:0.6,roughness:0.35}), zn:S_(0xc3cbd1,{metalness:0.3,roughness:0.48}), znX:S_(0xb9c2c9,{metalness:0.3,roughness:0.5,transparent:true,opacity:0.22,depthWrite:false,side:THREE.DoubleSide}),
    yz:S_(0xc59a38,{metalness:0.55,roughness:0.38}), steelD:S_(0x4a5056,{metalness:0.6,roughness:0.4}), rodP:S_(0xe0782b,{metalness:0.3,roughness:0.45}), lh:S_(0xc2410c,{roughness:0.6}),
    al:S_(0xd9dde0,{metalness:0.35,roughness:0.35}), hw:S_(0x8f979d,{metalness:0.6,roughness:0.35}), a2:S_(0xaeb4b9,{metalness:0.5,roughness:0.3}),
    red:S_(0xc0392b,{roughness:0.5}), black:S_(0x1d2226,{roughness:0.55}), tray:S_(0x9fb3c4,{metalness:0.4,roughness:0.45,side:THREE.DoubleSide}), trayD:S_(0x7f97ab,{metalness:0.4,roughness:0.45}),
    green:S_(0x2fa84f,{roughness:0.5}), gy:S_(0x9ccc3c,{roughness:0.5}), cu:S_(0xc0703a,{metalness:0.6,roughness:0.35}), wood:S_(0xb98a55,{roughness:0.9}), card:S_(0xc9a36b,{roughness:0.9}),
    crane:S_(0xe3a51c,{roughness:0.5,metalness:0.25}), craneD:S_(0x3b4248,{roughness:0.6,metalness:0.4}), frame:S_(0xc9cfd4,{metalness:0.45,roughness:0.35}),
    back:S_(0xeef0f2,{roughness:0.7}), cab:S_(0xdfe4e8,{roughness:0.5}), cabX:S_(0xdfe4e8,{roughness:0.5,transparent:true,opacity:0.3,depthWrite:false,side:THREE.DoubleSide}),
    dark:S_(0x2b3035,{roughness:0.6}), white:S_(0xf2f2ee,{roughness:0.6}), yellow:S_(0xe8c33a,{roughness:0.5}), blue:S_(0x2f6fd6,{roughness:0.5}), gray:S_(0x6d757b,{metalness:0.4,roughness:0.5}),
    sheet:S_(0xa7a59c,{metalness:0.3,roughness:0.6,side:THREE.DoubleSide}), epdm:S_(0x18191a,{roughness:0.9}), mis:S_(0xd64545,{roughness:0.6,emissive:0x3a0a0a}),
    glass:S_(0xdfe8f0,{roughness:0.08,metalness:0.1,transparent:true,opacity:0.35,depthWrite:false}), cells:new THREE.MeshStandardMaterial({color:0xffffff,map:pvTexP,roughness:0.35,metalness:0.2}),
    vc:new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.75,metalness:0.12}), chalk:new THREE.MeshBasicMaterial({color:lc(0x2f6fd6)}),
    ghost:new THREE.MeshBasicMaterial({color:lc(0x2f6fd6),transparent:true,opacity:0.2,depthWrite:false}), hose:S_(0x8d959b,{metalness:0.6,roughness:0.4}), slab:S_(0xa9aba5,{roughness:0.95}) }); }

// ---------- геометрія: допоміжне (метри; локальна система виробу: x — уздовж дуги на схід, y — нормаль покрівлі, z — на південь)
function gB(w,h,d,x,y,z){ const g=new THREE.BoxGeometry(w,h,d); g.translate(x||0,y||0,z||0); return g; }
function gC(r,h,seg,ax,x,y,z,r2){ const g=new THREE.CylinderGeometry(r,r2==null?r:r2,h,seg||12); if(ax==='x') g.rotateZ(Math.PI/2); else if(ax==='z') g.rotateX(Math.PI/2); g.translate(x||0,y||0,z||0); return g; }
function gHex(af,h,ax,x,y,z){ const r=af/Math.sqrt(3), g=new THREE.CylinderGeometry(r,r,h,6); g.rotateY(Math.PI/6); if(ax==='x') g.rotateZ(Math.PI/2); else if(ax==='z') g.rotateX(Math.PI/2); g.translate(x||0,y||0,z||0); return g; }
function gRing(R,r,h,ax,x,y,z,seg){ const s=new THREE.Shape(); s.absarc(0,0,R,0,Math.PI*2,false); const p=new THREE.Path(); p.absarc(0,0,r,0,Math.PI*2,true); s.holes.push(p);
  const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:seg||14}); g.translate(0,0,-h/2); if(ax==='y') g.rotateX(Math.PI/2); else if(ax==='x') g.rotateY(Math.PI/2); g.translate(x||0,y||0,z||0); return g; }
function gProf(pts,L){ const s=new THREE.Shape(); pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); s.closePath(); const g=new THREE.ExtrudeGeometry(s,{depth:L,bevelEnabled:false}); g.translate(0,0,-L/2); return g; }
function gMerge(list,keepUV){ const gs=list.map(g=>g.index?g.toNonIndexed():g); gs.forEach(g=>{ if(!g.attributes.normal) g.computeVertexNormals(); });
  let n=0; gs.forEach(g=>n+=g.attributes.position.count); const col=gs.every(g=>g.attributes.color), uv=keepUV&&gs.every(g=>g.attributes.uv);
  const P=new Float32Array(n*3), N=new Float32Array(n*3), C=col?new Float32Array(n*3):null, U=uv?new Float32Array(n*2):null; let o=0;
  gs.forEach(g=>{ const c=g.attributes.position.count; P.set(g.attributes.position.array.subarray(0,c*3),o*3); N.set(g.attributes.normal.array.subarray(0,c*3),o*3); if(C) C.set(g.attributes.color.array.subarray(0,c*3),o*3); if(U) U.set(g.attributes.uv.array.subarray(0,c*2),o*2); o+=c; });
  const m=new THREE.BufferGeometry(); m.setAttribute('position',new THREE.BufferAttribute(P,3)); m.setAttribute('normal',new THREE.BufferAttribute(N,3)); if(C) m.setAttribute('color',new THREE.BufferAttribute(C,3)); if(U) m.setAttribute('uv',new THREE.BufferAttribute(U,2)); m.computeBoundingSphere(); return m; }
function gTint(g,hex){ g=g.index?g.toNonIndexed():g; if(!g.attributes.normal) g.computeVertexNormals(); const c=lc(hex), n=g.attributes.position.count, a=new Float32Array(n*3); for(let i=0;i<n;i++){ a[i*3]=c.r; a[i*3+1]=c.g; a[i*3+2]=c.b; } g.setAttribute('color',new THREE.BufferAttribute(a,3)); return g; }
const gM=(g,M)=>{ g.applyMatrix4(M); return g; };
function mesh_(g,m,p,cast){ const o=new THREE.Mesh(g,m); o.castShadow=cast!==false; o.receiveShadow=true; if(p) p.add(o); return o; }
function grp_(p,x,y,z){ const g=new THREE.Group(); if(x!==undefined) g.position.set(x,y,z); if(p) p.add(g); return g; }

// ---------- текстури: перфорація лаги Ø10,5 через 100 мм (alphaMap), різьба шпильки, комірки — з двійника (pvTexP)
const HOLETEX=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,128,128); x.fillStyle='#000';
  x.beginPath(); x.ellipse(64,64,0.128*128,0.0525*128,0,0,Math.PI*2); x.fill(); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t; })();
const THRTEX=(()=>{ const c=document.createElement('canvas'); c.width=16; c.height=64; const x=c.getContext('2d'); for(let i=0;i<64;i++){ const v=150+Math.round(70*Math.sin(i/64*Math.PI*2*8)); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(0,i,16,1); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; return t; })();
MM.lagS=new THREE.MeshStandardMaterial({color:lc(0xc3cbd1),metalness:0.3,roughness:0.48,alphaMap:HOLETEX,alphaTest:0.5,side:THREE.DoubleSide});
MM.lagSX=new THREE.MeshStandardMaterial({color:lc(0xb9c2c9),metalness:0.3,roughness:0.5,alphaMap:HOLETEX,alphaTest:0.12,side:THREE.DoubleSide,transparent:true,opacity:0.32,depthWrite:false});
THRTEX.repeat.set(1,14); MM.thr=new THREE.MeshStandardMaterial({color:lc(0x8f979d),map:THRTEX,metalness:0.6,roughness:0.35});
{ const t2=THRTEX.clone(); t2.repeat.set(1,180); t2.needsUpdate=true; MM.thrR=new THREE.MeshStandardMaterial({color:lc(0x6f777d),map:t2,metalness:0.6,roughness:0.35}); }

// переріз лаги 41×41×1,5 пазом догори (з arka.js): u поперек, v від низу
const LW=0.041, LT=0.0015, HL=0.063, HT=0.104;
const LAGP=(()=>{ const a=LW/2,t=LT,s=0.011,r=0.009,Wd=LW; return [[-a,0],[a,0],[a,Wd],[s,Wd],[s,Wd-r],[s+t,Wd-r],[s+t,Wd-t],[a-t,Wd-t],[a-t,t],[-(a-t),t],[-(a-t),Wd-t],[-(s+t),Wd-t],[-(s+t),Wd-r],[-s,Wd-r],[-s,Wd],[-a,Wd]]; })();
// лага довжиною L уздовж z; низ — на висоті y0; UV: бічні стінки — отвір на половині висоти, дно — по осі; крок 100 мм, перший за 50 мм від торця
function lagGeo(L,y0){ const s=new THREE.Shape(); LAGP.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:L,bevelEnabled:false}); const P=g.attributes.position, N=g.attributes.normal, U=g.attributes.uv;
  for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i); const hor=Math.abs(N.getY(i))>0.5; U.setXY(i,hor?x/LW+0.5:y/LW,z/0.1+0.5); }
  g.translate(0,y0==null?HL:y0,-L/2); return g; }

// ---------- товсті лінії (LineSegments2); якщо бібліотеки немає — звичайні
const FAT=!!(THREE.LineSegments2&&THREE.LineMaterial&&THREE.LineSegmentsGeometry);
const LMATS=[];
function fatLines(pairs,color,width,parent,o){ o=o||{}; let obj;
  if(FAT&&pairs.length){ const a=new Float32Array(pairs.length*3); pairs.forEach((v,i)=>{ a[i*3]=v.x; a[i*3+1]=v.y; a[i*3+2]=v.z; });
    const g=new THREE.LineSegmentsGeometry(); g.setPositions(a); const m=new THREE.LineMaterial({color:lc(color),linewidth:width,transparent:!!o.opacity,opacity:o.opacity||1,depthTest:o.depthTest!==false});
    m.resolution.set(canvas.width||1000,canvas.height||700); LMATS.push(m); obj=new THREE.LineSegments2(g,m); obj.userData.fat=true; obj.userData.n=pairs.length/2; g.instanceCount=pairs.length/2; }
  else { const a=new Float32Array(Math.max(2,pairs.length)*3); pairs.forEach((v,i)=>{ a[i*3]=v.x; a[i*3+1]=v.y; a[i*3+2]=v.z; }); const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(a,3));
    obj=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:lc(color),transparent:!!o.opacity,opacity:o.opacity||1})); obj.userData.n=pairs.length/2; }
  obj.frustumCulled=false; obj.renderOrder=o.ro||3; obj.userData.k=-1; if(parent) parent.add(obj); return obj; }
function lineShow(o,k){ k=Math.max(0,Math.min(o.userData.n,k|0)); if(o.userData.k===k) return; o.userData.k=k; if(o.userData.fat) o.geometry.instanceCount=k; else o.geometry.setDrawRange(0,k*2); o.visible=k>0; need=true; }
function lmRes(){ const w=canvas.width, h=canvas.height; LMATS.forEach(m=>m.resolution.set(w,h)); }
try{ new ResizeObserver(()=>{ lmRes(); need=true; }).observe(canvas); }catch(e){}

// ---------- палети, пачки, ящики, коробки: де стоять у кожен момент
// kind: 'drop' — з'являється над місцем і опускається; 'crane' — шлях гака; 'ground' — на землі без руху. Зникає (стискається), коли розібрано.
class Pals{
  constructor(parts,n,parent){ this.n=n; this.ims=parts.map(([g,m])=>{ const im=new THREE.InstancedMesh(g,m,Math.max(1,n)); im.frustumCulled=false; im.castShadow=true; im.receiveShadow=true; for(let i=0;i<n;i++) im.setMatrixAt(i,ZERO); parent.add(im); return im; });
    this.R=new Array(n); this.a=new Float32Array(n).fill(1e9); this.v=new Float32Array(n).fill(1e9); this.kind=new Array(n).fill('drop'); this.custom=new Array(n); this.key=new Float32Array(n).fill(-9); this.drop=0.7; this.sx=[]; }
  vis(k,t){ return t>=this.a[k]&&t<this.v[k]+0.35; }
  moving(k,t){ if(this.custom[k]) return this.custom[k].moving(t); if(this.kind[k]==='drop'&&t>=this.a[k]&&t<this.a[k]+this.drop) return true; return t>=this.v[k]&&t<this.v[k]+0.35; }
  phase(k,t){ if(this.moving(k,t)) return 1; return t<this.a[k]?0:2; }
  pose(k,t,out){ const R=this.R[k]; if(this.custom[k]) return this.custom[k].pose(t,out);
    out.copy(R); if(this.kind[k]==='drop'&&t<this.a[k]+this.drop){ const u=(t-this.a[k])/this.drop; out.elements[13]+=2.2*(1-eOut(u)); } return out; }
  count(t){ let c=0; for(let k=0;k<this.n;k++) if(t>=this.a[k]+(this.custom[k]?this.custom[k].land-this.a[k]:this.drop)&&t<this.v[k]) c++; return c; }
  set(t){ let d=false; for(let k=0;k<this.n;k++){ const vis=this.vis(k,t), mv=vis&&this.moving(k,t), key=vis?10+this.phase(k,t):0; if(key===this.key[k]&&!mv) continue; this.key[k]=key; d=true;
      if(!vis) this.ims.forEach(im=>im.setMatrixAt(k,ZERO)); else { this.pose(k,t,_m); if(t>=this.v[k]){ const s=1-sm((t-this.v[k])/0.35); _m.decompose(_v,_qa,_sa); _sa.multiplyScalar(Math.max(0.001,s)); _m.compose(_v,_qa,_sa); } this.ims.forEach(im=>im.setMatrixAt(k,_m)); } }
    if(d){ this.ims.forEach(im=>im.instanceMatrix.needsUpdate=true); need=true; } }
}
// ---------- вироби: кожен з палети по дузі на своє місце (або опускається / виростає на місці); щойно поставлений коротко світиться
// mode: 'fly' — з палети по дузі; 'via' — з палети на проміжне місце, далі насунути (панелі по лагах); 'drop' — опускається з висоти; 'pop' — виростає з віддачею
class Mover{
  constructor(parts,n,parent,o){ o=o||{}; this.n=n; this.o=o; this.P=o.pals||null; this.mode=o.mode||'fly';
    this.ims=parts.map(([g,m])=>{ const mm=m.clone(); const im=new THREE.InstancedMesh(g,mm,Math.max(1,n)); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled=false; im.castShadow=o.cast!==false; im.receiveShadow=true;
      for(let i=0;i<n;i++){ im.setMatrixAt(i,ZERO); im.setColorAt(i,o.bc?o.bc[i]:WHITE); } parent.add(im); return im; }); this.bc=o.bc||null;
    this.F=new Array(n); this.slot=new Array(n); this.via=null; this.pal=new Int32Array(n).fill(-1); this.ts=new Float32Array(n).fill(1e9); this.td=new Float32Array(n).fill(0.6);
    this.arc=new Float32Array(n).fill(o.arc==null?1.0:o.arc); this.hide=null; this.key=new Int8Array(n).fill(-1); this.fl=o.fl==null?0.6:o.fl; this.drop=o.drop||0.25; this.spin=o.spin||0; this.lands=null; this.dim=1; }
  times(){ const a=new Float32Array(this.n); for(let i=0;i<this.n;i++) a[i]=this.ts[i]+this.td[i]; this.lands=a.slice().sort(); this.te=a; return this; }
  placed(t){ return ub(this.lands,t); }
  first(){ return this.lands[0]; } last(){ return this.lands[this.n-1]; }
  setDim(f){ if(this.dim===f) return; this.dim=f; this.ims.forEach(im=>{ if(!im.material.userData.c0) im.material.userData.c0=im.material.color.clone(); im.material.color.copy(im.material.userData.c0).multiplyScalar(f); }); need=true; }
  set(t){ const P=this.P; let d=false, dc=false;
    for(let i=0;i<this.n;i++){ const ts=this.ts[i], te=ts+this.td[i], k=this.pal[i]; let st;
      if((this.hide&&t>=this.hide[i])||(this.hideI&&this.hideI.has(i)&&t>=this.hideI.get(i)[0]&&t<this.hideI.get(i)[1])) st=0; else if(t>=te) st=t<te+this.fl?4:3; else if(t>=ts) st=2; else if(k>=0&&P&&P.vis(k,t)) st=1; else st=0;
      const mv=st===2||st===4||(st===1&&P.moving(k,t)), key=st===1?10+P.phase(k,t):st;
      if(key===this.key[i]&&!mv) continue; const was=this.key[i]; this.key[i]=key; d=true;
      if(st===0){ this.mat(i,ZERO); continue; }
      const B=this.bc?this.bc[i]:WHITE;
      if(st===3||st===4){ this.mat(i,this.F[i]); const f=st===4?(t-te)/this.fl:1; _c.copy(B).multiply(FLASH).lerp(B,sm(f)); this.col(i,_c); dc=true; continue; }
      if(was===4||was===3){ this.col(i,B); dc=true; }
      if(st===1){ this.mat(i,_m.multiplyMatrices(P.pose(k,t,_m2),this.slot[i])); continue; }
      const u=(t-ts)/this.td[i]; this.flight(i,u,ts); }
    if(d){ this.ims.forEach(im=>{ im.instanceMatrix.needsUpdate=true; if(dc) im.instanceColor.needsUpdate=true; }); need=true; } }
  mat(i,M){ for(const im of this.ims) im.setMatrixAt(i,M); }
  col(i,c){ for(const im of this.ims) im.setColorAt(i,c); }
  flight(i,u,ts){ const F=this.F[i], k=this.pal[i];
    if(this.mode==='pop'||(k<0&&this.mode!=='drop'&&this.mode!=='via')){ F.decompose(_v,_qa,_sa); const s=eBack(u); _sa.multiplyScalar(Math.max(0.0001,s)); this.mat(i,_m.compose(_v,_qa,_sa)); return; }
    if(this.mode==='drop'||k<0){ F.decompose(_v,_qa,_sa); const e=s5(u); _v.y+=this.drop*(1-e); if(this.spin){ _qb.setFromAxisAngle(YA,(1-e)*this.spin); _qa.multiply(_qb); } this.mat(i,_m.compose(_v,_qa,_sa)); return; }
    this.P.pose(k,ts,_m2); _m.multiplyMatrices(_m2,this.slot[i]); _m.decompose(_v,_qa,_sa);
    if(this.mode==='via'&&this.via){ const VIA=this.via[i]; if(u<0.55){ const w=u/0.55; VIA.decompose(_v2,_qb,_sb); const e=s5(w); const h=Math.max(0.6,this.arc[i]); const y0=_v.y, y1=_v2.y; _v.lerp(_v2,e); _v.y=lerp(y0,y1,e)+h*Math.sin(Math.PI*Math.min(1,w*1.05)); _qa.slerp(_qb,s5((w-0.1)/0.8)); _sa.lerp(_sb,e); this.mat(i,_m.compose(_v,_qa,_sa)); return; }
      const w=(u-0.55)/0.45; VIA.decompose(_v,_qa,_sa); F.decompose(_v2,_qb,_sb); const e=s5(w); _v.lerp(_v2,e); _qa.slerp(_qb,e); this.mat(i,_m.compose(_v,_qa,_sa)); return; }
    F.decompose(_v2,_qb,_sb); const e=s5(u), y0=_v.y, y1=_v2.y; _v.lerp(_v2,e); _v.y=lerp(y0,y1,e)+this.arc[i]*Math.sin(Math.PI*u)+0.25*Math.sin(Math.PI*c01(u*2.2))*(1-u);
    _qa.slerp(_qb,s5((u-0.12)/0.76)); _sa.lerp(_sb,e); if(this.spin){ _qb.setFromAxisAngle(YA,(1-e)*this.spin); _qa.multiply(_qb); } this.mat(i,_m.compose(_v,_qa,_sa)); }
}
// розклад: перші k — повільно і по одній (камера близько), решта — рівномірно з нерівним зсувом, щоб не було «маршу»
function sched(n,t0,T,o){ const k=Math.min(n,o.k||0), s=new Float32Array(n), d=new Float32Array(n), gs=o.gs||1.5, ds=o.ds||1.3, df=o.df||0.6;
  for(let i=0;i<k;i++){ s[i]=t0+i*gs; d[i]=ds; }
  const tf=t0+k*gs+(k?0.4:0), m=n-k, span=Math.max(0.1,t0+T-tf-df);
  for(let j=0;j<m;j++){ const i=k+j; s[i]=tf+span*(m>1?(j+0.6*(hsh(i)-0.5))/(m-1):0); s[i]=Math.max(tf,Math.min(tf+span,s[i])); d[i]=df*(0.85+0.3*hsh(i*7+3)); }
  return {s,d,tf,te:t0+T}; }
// лінії, що «прокладаються»: перші k відрізків з'являються до t
function LRev(o,times){ this.o=o; this.a=Float32Array.from(times); }
LRev.prototype.set=function(t){ lineShow(this.o,ub(this.a,t)); };
LRev.prototype.frac=function(t){ return ub(this.a,t)/Math.max(1,this.a.length); };
function lineTimes(n,t0,t1){ const a=[]; for(let i=0;i<n;i++) a.push(t0+(t1-t0)*i/Math.max(1,n)); return a; }
// видимість групи об'єктів з t0 до t1 (з легким підйомом)
function VAct(objs,t0,t1){ this.o=objs; this.t0=t0; this.t1=t1==null?1e9:t1; this.st=null; }
VAct.prototype.set=function(t){ const on=t>=this.t0&&t<this.t1; this.o.forEach(o=>{ if(o.visible!==on){ o.visible=on; need=true; } }); };
// довільна функція часу
function Fn(f){ this.f=f; } Fn.prototype.set=function(t){ this.f(t); };


// ---------- деталі блока з еталона 23.10 (TRI.geo: block1 — бетон з ухилом верху 1° і ребрами R1, mat1 — мат 320×320×3, mu1 — закладна): мм у осях GLB → метри
const MTGEO={"block1":{"p":"Hvsk+or9Hvsk+uL/HvvcBYr9HvvcBeL/ggD3/5n/ggD3/63/ggAJAJn/ggAJAK3/hQDl/5n/hQDl/63/hQAbAJn/hQAbAK3/igDU/5n/igDU/63/igAsAJn/igAsAK3/kgDE/5n/kgDE/63/kgA8AJn/kgA8AK3/nAC1/5n/nAC1/63/nABLAJn/nABLAK3/qACo/5n/qACo/63/qABYAJn/qABYAK3/tgCd/5n/tgCd/63/tgBjAJn/tgBjAK3/uQDa/4r9uQDa/7b+uQDa/63/uQDa/+L/uQAmAIr9uQAmALb+uQAmAK3/uQAmAOL/xgCU/5n/xgCU/63/xgBsAJn/xgBsAK3/0gD9/7b+0gD9/5n/0gADALb+0gADAJn/0wD3/7b+0wD3/5n/0wAJALb+0wAJAJn/1QDx/7b+1QDx/5n/1QAPALb+1QAPAJn/1wCN/5n/1wCN/63/1wDs/7b+1wDs/5n/1wAUALb+1wAUAJn/1wBzAJn/1wBzAK3/2wDn/7b+2wDn/5n/2wAZALb+2wAZAJn/3wDj/7b+3wDj/5n/3wAdALb+3wAdAJn/4wDf/7b+4wDf/5n/4wAhALb+4wAhAJn/6ACJ/5n/6ACJ/63/6AB3AJn/6AB3AK3/6QDc/7b+6QDc/5n/6QAkALb+6QAkAJn/7gDa/7b+7gDa/5n/7gAmALb+7gAmAJn/9ADY/7b+9ADY/5n/9AAoALb+9AAoAJn/+gCI/5n/+gCI/63/+gC1/4r9+gC1/7b++gC1/63/+gC1/+L/+gDY/7b++gDY/5n/+gAoALb++gAoAJn/+gBLAIr9+gBLALb++gBLAK3/+gBLAOL/+gB4AJn/+gB4AK3/AAHY/7b+AAHY/5n/AAEoALb+AAEoAJn/BgHa/7b+BgHa/5n/BgEmALb+BgEmAJn/CwHc/7b+CwHc/5n/CwEkALb+CwEkAJn/DAGJ/5n/DAGJ/63/DAF3AJn/DAF3AK3/EQHf/7b+EQHf/5n/EQEhALb+EQEhAJn/FQHj/7b+FQHj/5n/FQEdALb+FQEdAJn/GQHn/7b+GQHn/5n/GQEZALb+GQEZAJn/HQGN/5n/HQGN/63/HQHs/7b+HQHs/5n/HQEUALb+HQEUAJn/HQFzAJn/HQFzAK3/HwHx/7b+HwHx/5n/HwEPALb+HwEPAJn/IQH3/7b+IQH3/5n/IQEJALb+IQEJAJn/IgH9/7b+IgH9/5n/IgEDALb+IgEDAJn/LgGU/5n/LgGU/63/LgFsAJn/LgFsAK3/OwHa/4r9OwHa/7b+OwHa/63/OwHa/+L/OwEmAIr9OwEmALb+OwEmAK3/OwEmAOL/PgGd/5n/PgGd/63/PgFjAJn/PgFjAK3/TAGo/5n/TAGo/63/TAFYAJn/TAFYAK3/WAG1/5n/WAG1/63/WAFLAJn/WAFLAK3/YgHE/5n/YgHE/63/YgE8AJn/YgE8AK3/agHU/5n/agHU/63/agEsAJn/agEsAK3/bwHl/5n/bwHl/63/bwEbAJn/bwEbAK3/cgH3/5n/cgH3/63/cgEJAJn/cgEJAK3/1gYk+or91gYk+uL/1gbcBYr91gbcBeL/","i":"AwAAAAEAAwACAAAAYQAjAAEAxQBhAAEAAwAjACcAAwABACMAowBhAMUAaQADACcAxwCnAKMAxwBpAKcAxwCjAMUAxwADAGkAxgACAAMAxgADAMcAXgAAACAAxAAAAF4AAgAkACAAAgAgAAAAoADEAF4AZgAkAAIAxgCgAKQAxgCkAGYAxgDEAKAAxgBmAAIAxAABAAAAxADFAAEAxwDFAMQAxwDEAMYAogBgAGEAowCiAGEAYQAiACMAYQBgACIAIwAmACcAIwAiACYAJgBoAGkAJwAmAGkAaQCmAKcAaQBoAKYApgCiAKMApwCmAKMApQCgAKEApQCkAKAAoQBeAF8AoQCgAF4AXwAgACEAXwBeACAAIQAkACUAIQAgACQAJQBmAGcAJQAkAGYAZwCkAKUAZwBmAKQAIgApAB0AIgAdABkAIgAZABUAIgAVABEAIgARAA0AIgANAAkAIgAJAAUAYACJAHkAYAB5AF0AYABdAE0AYABNADkAYAA5ACkAYAApACIAnQCJAGAAJgAFAAcAJgAHAAsAJgALAA8AJgAPABMAJgAiAAUAFwAmABMAGwAmABcAogCxAK0AogCtAKkAogCpAJ0AogCdAGAAHwAmABsAtQCxAKIAKwAmAB8AuQC1AKIAaAAmACsAPwBoACsAvQC5AKIATwBoAD8AwQC9AKIAawBoAE8AwwDBAKIAwwCiAKYAewBoAGsAvwDDAKYAjwBoAHsAuwC/AKYAnwBoAI8AtwC7AKYAqwBoAJ8AqwCmAGgAswC3AKYArwCmAKsArwCzAKYAQgAlAEYASgBGACUAPAAlAEIAUgAlAGcAUgBKACUANgAlADwAVgBSAGcAMgAlADYAWgBWAGcALgAlADIAZABaAGcAbgBkAGcAIQAsADAAIQAuACwAIQAlAC4AcgBuAGcANAAhADAAdgByAGcAOgAhADQAQAAhADoARAAhAEAASAAhAEQAUAAhAEgApQB+AHYApQCCAH4ApQCGAIIApQCMAIYApQCSAIwApQB2AGcAlgCSAKUAmgCWAKUAXwAhAFAAXwBwAHQAXwBsAHAAXwBiAGwAXwBYAGIAXwBUAFgAXwBQAFQAoQCYAJoAoQCUAJgAoQCQAJQAoQCKAJAAoQCEAIoAoQCAAIQAoQB8AIAAoQB0AHwAoQBfAHQAoQCaAKUAegBrAGoAegB7AGsAjgCPAHsAjgB7AHoAngCfAI8AngCPAI4AqgCfAJ4AqgCrAJ8ArgCrAKoArgCvAKsAsgCvAK4AsgCzAK8AtgCzALIAtgC3ALMAugC3ALYAugC7ALcAvgC7ALoAvgC/ALsAwgC/AL4AwgDDAL8AwgDBAMMAwADBAMIAvADBAMAAvAC9AMEAvAC5AL0AuAC5ALwAtAC5ALgAtAC1ALkAsAC1ALQAsACxALUArACxALAArACtALEAqACpAK0AqACtAKwAqACdAKkAnACdAKgAiACdAJwAiACJAJ0AeAB5AIkAeABdAHkAeACJAIgAXABdAHgATABdAFwATABNAF0AOAA5AE0AOABNAEwAKAApADkAKAA5ADgAHAAdACkAHAApACgAGAAZAB0AGAAdABwAFAAVABkAFAAZABgAEAARABUAEAAVABQAEAANABEADAANABAACAANAAwACAAJAA0ABAAJAAgABAAFAAkABgAFAAQABgAHAAUABgALAAcACgALAAYADgALAAoADgAPAAsAEgAPAA4AEgATAA8AFgATABIAFgAXABMAGgAXABYAGgAbABcAHgAbABoAHgAfABsAKgAfAB4AKgArAB8APgArACoAPgA/ACsATgA/AD4ATgBPAD8AagBPAE4AagBrAE8AbgBvAGUAbgBlAGQAcgBzAG8AcgBvAG4AdgB3AHMAdgBzAHIAfgB/AHcAfgB3AHYAggCDAH8AggB/AH4AhgCHAIMAhgCDAIIAjACNAIcAjACHAIYAkgCTAI0AkgCNAIwAlgCXAJMAlgCTAJIAmgCbAJcAmgCZAJsAmgCXAJYAmACZAJoAlACVAJkAlACZAJgAkACRAJUAkACVAJQAigCLAJEAigCFAIsAigCRAJAAhACFAIoAgACBAIUAgACFAIQAfAB9AIEAfACBAIAAdAB1AH0AdAB9AHwAcABxAHUAcAB1AHQAbABtAHEAbABxAHAAYgBjAG0AYgBtAGwAWABZAGMAWABjAGIAVABVAFkAVABZAFgAUABRAFUAUABJAFEAUABVAFQASABJAFAARABFAEkARABJAEgAQABBAEUAQAA7AEEAQABFAEQAOgA7AEAAOgA1ADsANAA1ADoAMAA1ADQAMAAxADUALAAxADAALAAtADEALgAtACwALgAvAC0AMgAvAC4AMgAzAC8ANgAzADIANgA3ADMAPAA3ADYAPAA9ADcAQgA9ADwAQgBDAD0ARgBDAEIARgBHAEMASgBLAEcASgBHAEYAUgBTAEsAUgBLAEoAVgBXAFMAVgBTAFIAWgBbAFcAWgBXAFYAZABlAFsAZABbAFoAQQAYAEUAQQAUABgAQQAQABQASQBFABgASQAcACgASQAYABwAOwAQAEEAUQBJACgANQAQADsANQAMABAAVQBRACgAVQA4AEwAVQAoADgAMQAIAAwAMQAMADUAWQBVAEwALQAIADEALQAEAAgAYwBMAFwAYwBZAEwALwAEAC0ALwAGAAQALwAKAAYAbQBcAHgAbQBjAFwAMwAKAC8AcQB4AIgAcQBtAHgANwAOAAoANwAKADMAdQCIAJwAdQBxAIgAPQASAA4APQAOADcAfQCcAKgAfQB1AJwAQwAWABIAQwASAD0AgQB9AKgAgQCoAKwARwAWAEMAhQCBAKwAGgAWAEcAsACFAKwAHgAaAEcAHgBHAEsAtACLAIUAtACFALAAKgBLAFMAKgAeAEsAuACVAJEAuACRAIsAuACLALQAPgBTAFcAPgAqAFMAvACZAJUAvACVALgATgA+AFcATgBXAFsATgBbAGUAwACZALwAagBOAGUAwgCZAMAAwgCbAJkAegBlAG8AegBqAGUAvgCbAMIAvgCTAJcAvgCXAJsAjgB6AG8AjgBvAHMAugCTAL4AngCOAHMAngBzAHcAtgCTALoAtgCNAJMAqgCeAHcAqgB3AH8AqgB/AIMAsgCNALYAsgCDAIcAsgCHAI0ArgCqAIMArgCDALIA","u32":false},"mu1":{"p":"ggD3/5n/ggD3/63/ggAJAJn/ggAJAK3/hQDl/5n/hQDl/63/hQAbAJn/hQAbAK3/igDU/5n/igDU/63/igAsAJn/igAsAK3/kgDE/5n/kgDE/63/kgA8AJn/kgA8AK3/nAC1/5n/nAC1/63/nABLAJn/nABLAK3/qACo/5n/qACo/63/qABYAJn/qABYAK3/tgCd/5n/tgCd/63/tgBjAJn/tgBjAK3/uQDa/4r9uQDa/7b+uQDa/63/uQDa/+L/uQAmAIr9uQAmALb+uQAmAK3/uQAmAOL/xgCU/5n/xgCU/63/xgBsAJn/xgBsAK3/0gD9/4r90gD9/0/+0gD9/7b+0gD9/5n/0gADAIr90gADAE/+0gADALb+0gADAJn/0wD3/4r90wD3/0/+0wD3/7b+0wD3/5n/0wAJAIr90wAJAE/+0wAJALb+0wAJAJn/1QDx/4r91QDx/0/+1QDx/7b+1QDx/5n/1QAPAIr91QAPAE/+1QAPALb+1QAPAJn/1wCN/5n/1wCN/63/1wDs/4r91wDs/0/+1wDs/7b+1wDs/5n/1wAUAIr91wAUAE/+1wAUALb+1wAUAJn/1wBzAJn/1wBzAK3/2wDn/4r92wDn/0/+2wDn/7b+2wDn/5n/2wAZAIr92wAZAE/+2wAZALb+2wAZAJn/3wDj/4r93wDj/0/+3wDj/7b+3wDj/5n/3wAdAIr93wAdAE/+3wAdALb+3wAdAJn/4wDf/4r94wDf/0/+4wDf/7b+4wDf/5n/4wAhAIr94wAhAE/+4wAhALb+4wAhAJn/6ACJ/5n/6ACJ/63/6AB3AJn/6AB3AK3/6QDc/4r96QDc/0/+6QDc/7b+6QDc/5n/6QAkAIr96QAkAE/+6QAkALb+6QAkAJn/7gDa/4r97gDa/0/+7gDa/7b+7gDa/5n/7gAmAIr97gAmAE/+7gAmALb+7gAmAJn/9ADY/4r99ADY/0/+9ADY/7b+9ADY/5n/9AAoAIr99AAoAE/+9AAoALb+9AAoAJn/+gCI/5n/+gCI/63/+gC1/4r9+gC1/7b++gC1/63/+gC1/+L/+gDY/4r9+gDY/0/++gDY/7b++gDY/5n/+gAoAIr9+gAoAE/++gAoALb++gAoAJn/+gBLAIr9+gBLALb++gBLAK3/+gBLAOL/+gB4AJn/+gB4AK3/AAHY/4r9AAHY/0/+AAHY/7b+AAHY/5n/AAEoAIr9AAEoAE/+AAEoALb+AAEoAJn/BgHa/4r9BgHa/0/+BgHa/7b+BgHa/5n/BgEmAIr9BgEmAE/+BgEmALb+BgEmAJn/CwHc/4r9CwHc/0/+CwHc/7b+CwHc/5n/CwEkAIr9CwEkAE/+CwEkALb+CwEkAJn/DAGJ/5n/DAGJ/63/DAF3AJn/DAF3AK3/EQHf/4r9EQHf/0/+EQHf/7b+EQHf/5n/EQEhAIr9EQEhAE/+EQEhALb+EQEhAJn/FQHj/4r9FQHj/0/+FQHj/7b+FQHj/5n/FQEdAIr9FQEdAE/+FQEdALb+FQEdAJn/GQHn/4r9GQHn/0/+GQHn/7b+GQHn/5n/GQEZAIr9GQEZAE/+GQEZALb+GQEZAJn/HQGN/5n/HQGN/63/HQHs/4r9HQHs/0/+HQHs/7b+HQHs/5n/HQEUAIr9HQEUAE/+HQEUALb+HQEUAJn/HQFzAJn/HQFzAK3/HwHx/4r9HwHx/0/+HwHx/7b+HwHx/5n/HwEPAIr9HwEPAE/+HwEPALb+HwEPAJn/IQH3/4r9IQH3/0/+IQH3/7b+IQH3/5n/IQEJAIr9IQEJAE/+IQEJALb+IQEJAJn/IgH9/4r9IgH9/0/+IgH9/7b+IgH9/5n/IgEDAIr9IgEDAE/+IgEDALb+IgEDAJn/LgGU/5n/LgGU/63/LgFsAJn/LgFsAK3/OwHa/4r9OwHa/7b+OwHa/63/OwHa/+L/OwEmAIr9OwEmALb+OwEmAK3/OwEmAOL/PgGd/5n/PgGd/63/PgFjAJn/PgFjAK3/TAGo/5n/TAGo/63/TAFYAJn/TAFYAK3/WAG1/5n/WAG1/63/WAFLAJn/WAFLAK3/YgHE/5n/YgHE/63/YgE8AJn/YgE8AK3/agHU/5n/agHU/63/agEsAJn/agEsAK3/bwHl/5n/bwHl/63/bwEbAJn/bwEbAK3/cgH3/5n/cgH3/63/cgEJAJn/cgEJAK3/","i":"mgCNAJsAmgCMAI0AogCbAKMAogCaAJsAqgCjAKsAqgCiAKMAtgCrALcAtgCqAKsAvgC3AL8AvgC2ALcAxgC/AMcAxgC+AL8A0ADHANEA0ADGAMcA2gDRANsA2gDQANEA4gDbAOMA4gDaANsA6gDjAOsA6gDrAOcA6gDiAOMA5gDqAOcA3gDnAN8A3gDmAOcA1gDfANcA1gDeAN8AzADXAM0AzADNAMMAzADWANcAwgDMAMMAugDDALsAugDCAMMAsgC7ALMAsgC6ALsApgCzAKcApgCyALMAngCnAJ8AngCmAKcAlgCfAJcAlgCeAJ8AiACXAIkAiACWAJcAegCJAHsAegCIAIkAcgB7AHMAcgB6AHsAagBzAGsAagBrAF8AagByAHMAXgBqAF8AVgBfAFcAVgBeAF8ATgBXAE8ATgBPAEUATgBWAFcARABOAEUARABFADsAOgBEADsAMgA6ADsAMgA7ADMAKgAyADMAKgAzACsALgAqACsALgArAC8ANgAuAC8ANgAvADcAPgA2ADcAPgA3AD8ASAA+AD8ASAA/AEkAUgBIAEkAUgBJAFMAWgBSAFMAWgBTAFsAYgBbAGMAYgBaAFsAbgBjAG8AbgBiAGMAdgBvAHcAdgBuAG8AfgB3AH8AfgB2AHcAjAB/AI0AjAB+AH8ATwBXABQATwAUABAATwAQAAwAXwAUAFcAXwAkABgAXwAYABQARQBPAAwAawAkAF8AOwBFAAwAOwAMAAgAcwAkAGsAcwBkAEAAcwBAACQAMwAIAAQAMwA7AAgAewBkAHMAKwAzAAQAKwAEAAAAiQCAAGQAiQBkAHsALwArAAAALwAAAAIALwACAAYAlwCsAIAAlwCAAIkANwAvAAYAnwDIAKwAnwCsAJcAPwAGAAoAPwA3AAYApwDsAMgApwDIAJ8ASQAKAA4ASQA/AAoAswD4AOwAswDsAKcAUwAOABIAUwBJAA4AuwD4ALMAuwD8APgAWwBTABIAwwD8ALsAFgBbABIAAAH8AMMAGgBbABYAGgBjAFsABAHDAM0ABAEAAcMAJgBvAGMAJgBjABoACAHXAN8ACAHNANcACAEEAc0ASgB3AG8ASgBvACYADAHfAOcADAEIAd8AZgB3AEoAZgB/AHcAZgCNAH8AEAEMAecAkgCNAGYAEgEQAecAEgHnAOsArgCbAI0ArgCNAJIADgESAesADgHjANsADgHrAOMA0gCbAK4A0gCjAJsACgEOAdsA7gCjANIA7gCrAKMABgEKAdsABgHbANEA+gCrAO4A+gC3AKsA+gC/ALcAAgEGAdEAAgHHAL8AAgHRAMcA/gC/APoA/gACAb8AUgBaACEAYgAhAFoASABSACEAbgCPACEAbgAhAGIAPgBIACEAdgCPAG4ANgA+ACEAfgCPAHYALgA2ACEAjACPAH4AmgCPAIwAHQAyACoAHQAqAC4AHQAuACEAogCPAJoAOgAyAB0AqgCPAKIARAA6AB0ATgBEAB0AVgBOAB0AXgBWAB0AagBeAB0A9QCqALYA9QC2AL4A9QC+AMYA9QDGANAA9QDQANoA9QCPAKoA4gD1ANoA6gD1AOIAgwBqAB0AgwCmAJ4AgwCeAJYAgwCWAIgAgwCIAHoAgwB6AHIAgwByAGoA8QDqAOYA8QDmAN4A8QDeANYA8QDWAMwA8QDMAMIA8QDCALoA8QC6ALIA8QCyAKYA8QCmAIMA8QD1AOoArgCTAJIArgCvAJMA0gDTAK8A0gCvAK4A7gDvANMA7gDTANIA+gDvAO4A+gD7AO8A/gD7APoA/gD/APsAAgH/AP4AAgEDAf8ABgEDAQIBBgEHAQMBCgEHAQYBCgELAQcBDgELAQoBDgEPAQsBEgEPAQ4BEgETAQ8BEgERARMBEAERARIBDAERARABDAENAREBDAEJAQ0BCAEJAQwBBAEJAQgBBAEFAQkBAAEFAQQBAAEBAQUB/AABAQAB/AD9AAEB+AD5AP0A+AD9APwA+ADtAPkA7ADtAPgAyADtAOwAyADJAO0ArACtAMkArACBAK0ArADJAMgAgACBAKwAZACBAIAAZABlAIEAQABBAGUAQABlAGQAJAAlAEEAJABBAEAAGAAZACUAGAAlACQAFAAVABkAFAAZABgAEAARABUAEAAVABQADAANABEADAARABAADAAJAA0ACAAJAAwABAAJAAgABAAFAAkAAAAFAAQAAAABAAUAAgABAAAAAgADAAEAAgAHAAMABgAHAAIACgAHAAYACgALAAcADgALAAoADgAPAAsAEgAPAA4AEgATAA8AFgATABIAFgAXABMAGgAXABYAGgAbABcAJgAbABoAJgAnABsASgAnACYASgBLACcAZgBLAEoAZgBnAEsAkgBnAGYAkgCTAGcAjwD0APUAjwCOAPQA9QDwAPEA9QD0APAAIQCOAI8AIQAgAI4A8QCCAIMA8QDwAIIAHQAgACEAHQAcACAAgwAcAB0AgwCCABwAHgAZACUAHgAVABkAHgARABUAHgANABEAHgAJAA0AHgAFAAkAHgABAAUAhACtAMkAhACBAK0AhABlAIEAhABBAGUAhAAlAEEAhAAeACUA7QCEAMkAIgADAAEAIgAHAAMAIgALAAcAIgAPAAsAIgABAB4AEwAPACIAFwATACIA8gD9AAEB8gD5AP0A8gDtAPkA8gCEAO0AGwAXACIABQHyAAEBJwAbACIACQHyAAUBkAAnACIASwAnAJAADQHyAAkBZwBLAJAAEQHyAA0BkwBnAJAAEwHyABEBEwH2APIArwCTAJAADwH2ABMB0wCvAJAACwH2AA8B7wDTAJAABwH2AAsB+wDvAJAA+wCQAPYAAwH2AAcB/wD7APYA/wD2AAMBUAAgAFgAYABYACAARgAgAFAAbAAgAI4AbABgACAAPAAgAEYAdABsAI4ANAAgADwAfAB0AI4ALAAgADQAigB8AI4AmACKAI4AHAAoADAAHAAsACgAHAAgACwAoACYAI4AOAAcADAAqACgAI4AQgAcADgATAAcAEIAVAAcAEwAXAAcAFQAaAAcAFwA9AC0AKgA9AC8ALQA9ADEALwA9ADOAMQA9ADYAM4A9ACoAI4A4ADYAPQA6ADgAPQAggAcAGgAggCcAKQAggCUAJwAggCGAJQAggB4AIYAggBwAHgAggBoAHAA8ADkAOgA8ADcAOQA8ADUANwA8ADKANQA8ADAAMoA8AC4AMAA8ACwALgA8ACkALAA8ACCAKQA8ADoAPQA9gDyAPMA9wD2APMA8gCEAIUA8wDyAIUAhQAeAB8AhQCEAB4AHwAiACMAHwAeACIAIgCQAJEAIwAiAJEAkQD2APcAkQCQAPYAmACLAIoAmACZAIsAoAChAJkAoACpAKEAoACZAJgAqACpAKAAtACpAKgAtAC1AKkAvAC1ALQAvAC9ALUAvADFAL0AxADFALwAzgDFAMQAzgDPAMUAzgDZAM8A2ADZAM4A4ADZANgA4ADhANkA4ADpAOEA6ADpAOAA6ADlAOkA5ADlAOgA3ADlAOQA3ADdAOUA1ADdANwA1ADVAN0A1ADLANUAygDLANQAygDBAMsAwADBAMoAuADBAMAAuAC5AMEAsAC5ALgAsACxALkApAClALEApACxALAAnACdAKUAnAClAKQAlACVAJ0AlACHAJUAlACdAJwAhgCHAJQAeAB5AIcAeABxAHkAeACHAIYAcABxAHgAaABpAHEAaABxAHAAXABdAGkAXABpAGgAVABVAF0AVABNAFUAVABdAFwATABDAE0ATABNAFQAQgBDAEwAOABDAEIAOAA5AEMAOAAxADkAMAAxADgAKAAxADAAKAApADEAKAAtACkALAAtACgANAAtACwANAA1AC0APAA1ADQAPAA9ADUARgA9ADwARgBHAD0ARgBRAEcAUABRAEYAUABZAFEAWABZAFAAYABZAFgAYABhAFkAbABhAGAAbABtAGEAdABtAGwAdAB1AG0AfAB1AHQAfAB9AHUAfACLAH0AigCLAHwA8wD3AJEA8wCRACMA8wAjAB8A8wAfAIUAaQBdAFUAeQBxAGkAKQBDADkAKQA5ADEANQApAC0ApQCdAJUAUQA1AD0AUQA9AEcAYQBRAFkAywDBALkAywC5ALEAbQBVAE0AbQBNAEMAbQBDACkAbQApADUAbQBRAGEAbQA1AFEA3QDVAMsAfQBtAHUAfQBVAG0AmQB9AIsA4QDpAOUA4QDlAN0AoQBVAH0AoQB9AJkAoQBpAFUAoQB5AGkAqQB5AKEAqQCVAIcAqQCHAHkAzwDZAOEAtQCVAKkAtQCxAKUAtQClAJUAxQDhAN0AxQDPAOEAvQDFAN0AvQCxALUAvQDdAMsAvQDLALEA","u32":false},"mat1":{"p":"uvrA+eL/uvrA+QAAuvpABuL/uvpABgAAOgfA+eL/OgfA+QAAOgdABuL/OgdABgAA","i":"AgAAAAEAAwACAAEABgAFAAQABwAFAAYABwABAAUABwADAAEABgAEAAAABgAAAAIABQABAAAABAAFAAAABwACAAMABgACAAcA","u32":false}};
function partGeoR(k,shift){ const g=MTGEO[k], p=b64(g.p,Int16Array), idx=b64(g.i,g.u32?Uint32Array:Uint16Array); const pos=new Float32Array(p.length); for(let i=0;i<p.length;i++) pos[i]=p[i]/10;
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setIndex(new THREE.BufferAttribute(idx,1)); const ng=geo.toNonIndexed(); ng.applyMatrix4(G2L); ng.translate(0,0,shift||0); ng.computeVertexNormals(); return ng; }


// ---------- камера-«оператор»: центр уваги, азимут, кут над горизонтом, відстань (логарифм), кут огляду — пружини з критичним загасанням
// x(Δt) = ((v₀ + ω·x₀)·Δt + x₀)·e^(−ωΔt): швидкість неперервна від першого кадру; межі швидкості й прискорення; горизонт рівний
const CAM={tg:new V3(50,8,-46),az:1.0,el:0.6,lD:Math.log(170),fov:38,vt:new V3(),vaz:0,vel:0,vlD:0,vfov:0,init:false,lastSpec:null};
const CW={t:3.0,a:2.5,d:3.0,f:2.5};
function sp1(x,v,X,w,dt){ const x0=x-X, e=Math.exp(-w*dt), nx=X+((v+w*x0)*dt+x0)*e, nv=(v-w*(v+w*x0)*dt)*e; return [nx,nv]; }
function lim(x,v,nx,nv,vmax,amax,dt){ let cv=Math.max(-vmax,Math.min(vmax,nv)); const dv=cv-v, am=amax*dt; if(dv>am) cv=v+am; else if(dv<-am) cv=v-am; if(cv===nv) return [nx,nv]; return [x+(v+cv)/2*dt,cv]; }
function wrapA(a){ while(a>Math.PI) a-=2*Math.PI; while(a<-Math.PI) a+=2*Math.PI; return a; }
function camReset(s){ CAM.tg.copy(s.tgt); CAM.az=s.az; CAM.el=s.el; CAM.lD=Math.log(s.dist); CAM.fov=s.fov||38; CAM.vt.set(0,0,0); CAM.vaz=CAM.vel=CAM.vlD=CAM.vfov=0; CAM.init=true; }
function camFromView(){ const p=camera.position, c=controls.target, d=p.clone().sub(c), D=Math.max(0.3,d.length()); CAM.tg.copy(c); CAM.lD=Math.log(D/camF()); CAM.el=Math.asin(Math.max(-1,Math.min(1,d.y/D))); CAM.az=Math.atan2(d.x,d.z); CAM.fov=camera.fov; CAM.vt.set(0,0,0); CAM.vaz=CAM.vel=CAM.vlD=CAM.vfov=0; CAM.init=true; }
const camF=()=>camera.aspect<1?Math.min(2.1,0.6/camera.aspect+0.45):1;   // на телефоні (портрет) — далі, щоб виріб умістився
function specFloor(s){ // кадр не нижче покрівлі + 1,2 м: підняти кут, а не штовхати камеру
  const D=s.dist*camF(); for(let k=0;k<8;k++){ const c=Math.cos(s.el), x=s.tgt.x+D*c*Math.sin(s.az), y=s.tgt.y+D*Math.sin(s.el), z=s.tgt.z+D*c*Math.cos(s.az), f=surfZ(x,-z), fl=(f===null?0:f)+1.25; if(y>=fl||s.el>1.2) break; s.el=Math.min(1.25,s.el+0.06); } return s; }
function camStep(s,dt){ specFloor(s); if(!CAM.init){ camReset(s); return; }
  const n=Math.max(1,Math.ceil(dt/(1/120))), h=dt/n, D=Math.exp(CAM.lD), close=D<25;
  for(let k=0;k<n;k++){
    // центр: пружина по кожній осі, межа швидкості залежить від відстані (близько — повільно)
    const vmax=Math.max(0.05,Math.min(30,0.5*Math.exp(CAM.lD))), amax=Math.max(0.1,vmax*1.4);
    const nx=[], nv=[]; ['x','y','z'].forEach((a,i)=>{ const r=sp1(CAM.tg[a],CAM.vt[a],s.tgt[a],CW.t,h); nx[i]=r[0]; nv[i]=r[1]; });
    let cx=nv[0], cy=nv[1], cz=nv[2], clamp=false; const sp=Math.hypot(cx,cy,cz); if(sp>vmax){ const f=vmax/sp; cx*=f; cy*=f; cz*=f; clamp=true; }
    let dx=cx-CAM.vt.x, dy=cy-CAM.vt.y, dz=cz-CAM.vt.z; const dv=Math.hypot(dx,dy,dz), am=amax*h; if(dv>am){ const f=am/dv; dx*=f; dy*=f; dz*=f; cx=CAM.vt.x+dx; cy=CAM.vt.y+dy; cz=CAM.vt.z+dz; clamp=true; }
    if(clamp){ CAM.tg.x+=(CAM.vt.x+cx)/2*h; CAM.tg.y+=(CAM.vt.y+cy)/2*h; CAM.tg.z+=(CAM.vt.z+cz)/2*h; CAM.vt.set(cx,cy,cz); } else { CAM.tg.set(nx[0],nx[1],nx[2]); CAM.vt.set(nv[0],nv[1],nv[2]); }
    // відстань: на логарифмі; поки центр далеко від потрібного — не підходити ближче, ніж до нього (підйом — переліт — спуск)
    const left=_v.copy(s.tgt).sub(CAM.tg).length(), lDd=Math.log(Math.max(s.dist,left*1.15));
    let r=sp1(CAM.lD,CAM.vlD,lDd,CW.d,h); r=lim(CAM.lD,CAM.vlD,r[0],r[1],0.8,1.1,h); CAM.lD=r[0]; CAM.vlD=r[1];
    const amx=(close?30:21)*D2R;
    const az1=CAM.az+wrapA(s.az-CAM.az); r=sp1(CAM.az,CAM.vaz,az1,CW.a,h); r=lim(CAM.az,CAM.vaz,r[0],r[1],amx,38*D2R,h); CAM.az=r[0]; CAM.vaz=r[1];
    const elT=Math.max(s.el,lerp(s.el,0.85,c01((left-15)/30)));   // далекий переліт — підйом на загальний план
    r=sp1(CAM.el,CAM.vel,elT,CW.a,h); r=lim(CAM.el,CAM.vel,r[0],r[1],amx,30*D2R,h); CAM.el=Math.max(0.12,Math.min(1.3,r[0])); CAM.vel=r[1];
    r=sp1(CAM.fov,CAM.vfov,s.fov||38,CW.f,h); CAM.fov=r[0]; CAM.vfov=r[1]; }
  CAM.az=wrapA(CAM.az); }
function floorAt(x,z){ let m=0; for(const [dx,dz] of [[0,0],[3,0],[-3,0],[0,3],[0,-3]]){ const f=surfZ(x+dx,-(z+dz)); if(f!==null&&f>m) m=f; } return m+1.2; }
function camApply(dt){ const D=Math.exp(CAM.lD)*camF(), c=Math.cos(CAM.el); const p=_v.set(CAM.tg.x+D*c*Math.sin(CAM.az),CAM.tg.y+D*Math.sin(CAM.el),CAM.tg.z+D*c*Math.cos(CAM.az));
  // не нижче покрівлі + 1,2 м (і землі + 1,2 м)
  const flT=floorAt(p.x,p.z); if(CAM.fl==null||!dt) { CAM.fl=flT; CAM.vfl=0; } else { const r=sp1(CAM.fl,CAM.vfl,flT,flT>CAM.fl?6:1.3,dt); CAM.fl=r[0]; CAM.vfl=r[1]; } const fl=CAM.fl; if(p.y<fl+0.35) p.y=fl+0.35*Math.exp((p.y-fl-0.35)/0.35);   // м'яко, без зламу швидкості
  if(camera.position.distanceToSquared(p)>1e-10||Math.abs(camera.fov-CAM.fov)>1e-4){ MT.camMoved=true; }
  camera.position.copy(p); controls.target.copy(CAM.tg); camera.lookAt(CAM.tg); if(Math.abs(camera.fov-CAM.fov)>1e-4) camera.fov=CAM.fov;
  camera.near=Math.max(0.03,D*0.01); camera.far=3000; camera.updateProjectionMatrix(); need=true; }
// стандартні плани: загальний — навколо цеху; 3/4; зразок — облет з малою швидкістю
const SITE_C=V(50,6,-46);
const shotWide=(az0,az1,el,dist,c)=>u=>({tgt:c||SITE_C,az:lerp(az0,az1,s5(u)),el,dist,fov:38});
const shotAt=(p,az0,az1,el,d0,d1,f)=>u=>({tgt:p,az:lerp(az0,az1,s5(u)),el,dist:lerp(d0,d1==null?d0:d1,s5(u)),fov:f||38});
const shotPan=(A,B,az0,az1,el,d0,d1)=>u=>({tgt:A.clone().lerp(B,s5(u)),az:lerp(az0,az1,s5(u)),el,dist:lerp(d0,d1==null?d0:d1,s5(u)),fov:38});

// ---------- перешкоди: вентиляція, ліхтарі, ТП і кран між камерою та центром стають прозорими (25 %), плавно за 0,3 с
const OBST={list:[],ray:new THREE.Raycaster(),on:false};
function obstInit(){ if(OBST.list.length) return; G.site.traverse(o=>{ if(o.isMesh&&(o.material===MAT.obs||o.material===MAT.lan||o.material===MAT.tp)) OBST.list.push({o,m0:o.material,m:null,a:1,t:1}); }); }
function obstAdd(o){ o.traverse(x=>{ if(x.isMesh) OBST.list.push({o:x,m0:x.material,m:null,a:1,t:1}); }); }
function obstOn(on){ OBST.on=on; OBST.list.forEach(r=>{ if(on){ if(!r.m){ r.m=r.m0.clone(); r.m.transparent=true; } r.o.material=r.m; r.a=r.t=1; r.m.opacity=1; r.m.depthWrite=true; } else { r.o.material=r.m0; } }); }
function obstTick(dt){ if(!OBST.on) return; if(MT.camMoved){ const P=camera.position, d=_v2.copy(controls.target).sub(P), L=d.length(); d.normalize(); OBST.ray.set(P,d); OBST.ray.far=Math.max(0.1,L-0.4);
    const hit=new Set(OBST.ray.intersectObjects(OBST.list.map(r=>r.o).filter(o=>o.visible),false).map(h=>h.object)); OBST.list.forEach(r=>{ r.t=hit.has(r.o)?0.25:1; }); }
  OBST.list.forEach(r=>{ if(r.a===r.t) return; const s=dt/0.3*0.75; r.a=r.a<r.t?Math.min(r.t,r.a+s):Math.max(r.t,r.a-s); r.m.opacity=r.a; r.m.depthWrite=r.a>0.99; need=true; }); }

// ---------- світло монтажу: сонце низько з південного заходу (35°), темніші покрівля і земля, легкий туман на загальних планах
const LIGHT={saved:null};
function lightOn(){ if(LIGHT.saved) return; LIGHT.saved={sp:sun.position.clone(),si:sun.intensity,hi:hemi.intensity,roof:MAT.roof.color.clone(),gr:MAT.ground.color.clone(),wr:MAT.whRoof.color.clone(),fog:scene.fog,exp:renderer.toneMappingExposure};
  const alt=36*D2R, az=225*D2R, e=Math.sin(az)*Math.cos(alt), nn=Math.cos(az)*Math.cos(alt), u=Math.sin(alt); sun.position.copy(sun.target.position).add(V(e*320,u*320,-nn*320));
  sun.intensity=1.25; hemi.intensity=0.42; MAT.roof.color.multiplyScalar(0.46); MAT.ground.color.multiplyScalar(0.66); MAT.whRoof.color.multiplyScalar(0.72);
  scene.fog=new THREE.Fog(scene.background?scene.background.clone():new THREE.Color(0xdfe6ec),260,900); renderer.toneMappingExposure=1.08; need=true; }
function lightOff(){ const s=LIGHT.saved; if(!s) return; sun.position.copy(s.sp); sun.intensity=s.si; hemi.intensity=s.hi; MAT.roof.color.copy(s.roof); MAT.ground.color.copy(s.gr); MAT.whRoof.color.copy(s.wr); scene.fog=s.fog; renderer.toneMappingExposure=s.exp; LIGHT.saved=null; need=true; }

// ---------- автокран: шасі на виносних опорах, поворотна частина, телескопічна стріла, канат, гак, стропи; положення гака — функція часу
function Crane(parent,X,Y){ const g=grp_(parent); g.position.copy(W(X,Y,0)); this.g=g; this.X=X; this.Y=Y; const m=MM.crane, d=MM.craneD;
  const B=(w,h,dd,mat,x,y,z,p)=>{ const o=mesh_(gB(w,h,dd),mat,p||g); o.position.set(x,y,z); return o; };
  B(2.55,1.0,11,m,0,1.0,0); B(2.5,1.5,1.9,m,0,2.1,-4.6); B(2.6,0.9,1.0,d,0,1.65,-5.25); B(2.4,0.5,9,d,0,0.45,0.4);
  [-3.6,3.6].forEach(z=>[-1,1].forEach(s=>{ B(2.4,0.22,0.3,d,s*2.3,0.6,z); B(0.6,0.08,0.6,d,s*3.55,0.04,z); B(0.18,0.55,0.18,d,s*3.55,0.32,z); }));
  [-4.2,-2.8,1.6,3.0].forEach(z=>[-1,1].forEach(s=>{ const w=mesh_(gC(0.55,0.42,16,'x'),d,g); w.position.set(s*1.15,0.55,z); }));
  const tur=grp_(g,0,1.55,2.0); this.tur=tur; B(2.3,1.2,3.2,m,0,0.6,0.3,tur); B(0.95,1.05,1.2,d,-0.8,1.6,-0.7,tur); B(0.9,0.12,1.0,MM.glass,-0.8,2.1,-0.7,tur);
  this.piv=new V3(X,3.35,-Y+2.6); this.b1=mesh_(gB(0.6,0.62,1,0,0,0.5),m,parent); this.b2=mesh_(gB(0.46,0.48,1,0,0,0.5),m,parent); this.b3=mesh_(gB(0.34,0.36,1,0,0,0.5),m,parent);
  const hook=grp_(parent); this.hook=hook; mesh_(gB(0.38,0.5,0.28),d,hook); mesh_(new THREE.TorusGeometry(0.13,0.035,8,14,Math.PI*1.4).rotateZ(-Math.PI*0.2).translate(0,-0.4,0),d,hook);
  this.rope=fatLines([new V3(),new V3(0,1,0)],0x30363a,2.2,parent); this.sl=fatLines(new Array(8).fill(0).map(()=>new V3()),0x30363a,1.8,parent);
  this.parts=[g,this.b1,this.b2,this.b3,hook]; }
Crane.prototype.set=function(h,corners){ const P=this.piv, tip=V(h.x,Math.max(h.y+5.5,P.y+6),h.z), d=tip.clone().sub(P), L=d.length();
  this.tur.rotation.y=Math.atan2(d.x,d.z)-0;
  [[this.b1,0,0.46],[this.b2,0.4,0.76],[this.b3,0.7,1.0]].forEach(([b,a0,a1])=>{ b.position.copy(P).addScaledVector(d,a0); b.lookAt(tip); b.scale.set(1,1,Math.max(0.3,L*(a1-a0))); });
  this.hook.position.set(h.x,h.y+0.35,h.z);
  const pa=[tip.x,tip.y,tip.z,h.x,h.y+0.62,h.z]; if(this.rope.userData.fat) this.rope.geometry.setPositions(pa); else this.rope.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pa),3));
  if(corners){ const a=[]; corners.forEach(c=>a.push(h.x,h.y-0.1,h.z,c.x,c.y,c.z)); if(this.sl.userData.fat) this.sl.geometry.setPositions(a); else this.sl.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(a),3)); this.sl.visible=true; } else this.sl.visible=false;
  this.rope.visible=true; need=true; };
// докладний підйом: вантаж з машини (A) — вгору — поворот стріли — опускання на місце (B); гак повертається на стоянку
function liftPath(A,B,c,t0,t1,top){ const D=t1-t0, H=Math.max(new V3().setFromMatrixPosition(B).y+3.2,top||17);
  return {t0,t1,land:t0+D*0.86,moving:t=>t>=t0+D*0.16&&t<t0+D*0.86,
    pose(t,out){ const u=(t-t0)/D; if(u<=0.16) return out.copy(A); if(u>=0.86) return out.copy(B); const w=(u-0.16)/0.7; A.decompose(_v,_qa,_sa); B.decompose(_v2,_qb,_sb); let x,y,z;
      if(w<0.32){ const e=s5(w/0.32); x=_v.x; z=_v.z; y=lerp(_v.y,H,e); }
      else if(w<0.74){ const e=s5((w-0.32)/0.42); const a0=Math.atan2(_v.x-c.x,_v.z-c.z), a1=Math.atan2(_v2.x-c.x,_v2.z-c.z); let da=wrapA(a1-a0); const r0=Math.hypot(_v.x-c.x,_v.z-c.z), r1=Math.hypot(_v2.x-c.x,_v2.z-c.z), aa=a0+da*e, rr=lerp(r0,r1,e); x=c.x+rr*Math.sin(aa); z=c.z+rr*Math.cos(aa); y=H; }
      else { const e=s5((w-0.74)/0.26); x=_v2.x; z=_v2.z; y=lerp(H,_v2.y,e); }
      _qa.slerp(_qb,s5((w-0.3)/0.5)); return out.compose(_v.set(x,y,z),_qa,ONE3); } }; }


// ---------- шкала часу проєкту: акти → кадри (у кожного кадру — функція камери, картка, лічильники); оновлювачі сцени — функції часу
function TL(proj){ this.proj=proj; this.t=0; this.acts=[]; this.shots=[]; this.ups=[]; this.cnt=[]; this.samp=[]; this.slow=[]; this.mus=[]; this.stops=[]; this.sfx=[]; this.root=grp_(MTG); this.root.visible=false; this.prep=[]; this.post=[]; this.cur=null; this.T=0; }
TL.prototype.act=function(id,title,lead){ const a={id,no:this.acts.length,title,lead,t0:this.t,t1:null,shots:[]}; if(this.cur) this.cur.t1=this.t; this.acts.push(a); this.cur=a; return a; };
TL.prototype.shot=function(dur,d){ const a=this.cur, s=Object.assign({t0:this.t,t1:this.t+dur,act:a,no:a.shots.length,id:a.no+'.'+(a.shots.length+1)},d); a.shots.push(s); this.shots.push(s);
  if(d.slow) this.slow.push([s.t0,s.t1]); if(d.mus) this.mus.push({t:s.t0,m:d.mus}); this.t+=dur; return s; };
TL.prototype.up=function(o){ this.ups.push(o); return o; };
TL.prototype.counter=function(c){ c.act=this.cur.id; this.cnt.push(c); return c; };
TL.prototype.sample=function(s){ this.samp.push(s); return s; };
TL.prototype.fx=function(times,kind){ times.forEach(t=>this.sfx.push([t,kind])); };
TL.prototype.done=function(){ this.ups.forEach(u=>{ if(u instanceof Mover) u.times(); }); this.T=this.t;
  // склейка через затемнення 0,4 с — лише між актами і лише коли переліт великий (центр далі 40 м або масштаб змінюється понад утричі)
  this.cuts=[]; this.acts.forEach((a,k)=>{ if(!k||!a.shots.length) return; const p=this.shots[this.shots.indexOf(a.shots[0])-1]; if(!p) return; const A=p.cam(1,p.t1), B=a.shots[0].cam(0,a.shots[0].t0);
    if(A.tgt.distanceTo(B.tgt)>40||Math.abs(Math.log(A.dist/B.dist))>1.1){ a.shots[0].cut=true; this.cuts.push(a.t0); } }); this.cutT=Float32Array.from(this.cuts); this.cur.t1=this.t; this.shotT=Float32Array.from(this.shots.map(s=>s.t0)); this.sfx.sort((a,b)=>a[0]-b[0]); this.sfxT=Float32Array.from(this.sfx.map(x=>x[0])); };
TL.prototype.shotAt=function(t){ const i=Math.max(0,ub(this.shotT,t)-1); return this.shots[Math.min(i,this.shots.length-1)]; };
TL.prototype.actAt=function(t){ return this.shotAt(t).act; };
TL.prototype.isSlow=function(t){ return this.slow.some(s=>t>=s[0]&&t<s[1]); };
TL.prototype.camSpec=function(t){ const s=this.shotAt(t), u=c01((t-s.t0)/(s.t1-s.t0)); return s.cam(u,t); };
TL.prototype.musAt=function(t){ let m='calm'; for(const x of this.mus) if(x.t<=t) m=x.m; return m; };
TL.prototype.set=function(t){ for(const u of this.ups) u.set(t); };

// ---------- інтерфейс розділу: картка ліворуч (телефон — знизу, згортається), транспорт унизу, виноски на зразку, зупинки, підсумок
{ const st=document.createElement('style'); st.textContent=`
.mtcard{position:absolute;left:10px;top:10px;bottom:68px;z-index:5;width:clamp(270px,27%,340px);display:flex;flex-direction:column;pointer-events:none}
.mtcard>.in{pointer-events:auto;max-height:100%;overflow:auto;background:color-mix(in srgb,var(--surface) 95%,transparent);border:1px solid var(--line);border-radius:12px;padding:10px 12px 10px;backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.12);scrollbar-width:thin}
.mtcard .ey{display:flex;align-items:center;gap:6px;font:600 11.5px var(--mono);letter-spacing:.02em;color:var(--ink-3);text-transform:uppercase}
.mtcard .ey .ac{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:6px;background:var(--ink);color:var(--surface);font-weight:700}
.mtcard .ey button{margin-left:auto;border:1px solid var(--line);background:var(--surface-2);border-radius:7px;height:24px;min-width:26px;color:var(--ink-2);font-size:12px;display:none}
.mtcard h3{margin:4px 0 4px;font-size:16px;line-height:1.25}
.mtcard p{margin:0 0 6px;font-size:12.8px;line-height:1.42;color:var(--ink-2)}
.mtcard p.nd{color:#b0552a;font-size:12px} .mtcard p.nd b{font-weight:650}
.mtcard ol.pt{list-style:none;margin:6px 0;padding:0;display:flex;flex-direction:column;gap:4px}
.mtcard ol.pt li{display:grid;grid-template-columns:20px 1fr;gap:2px 7px;font-size:12px;line-height:1.3;padding:4px 0;border-top:1px solid var(--line)}
.mtcard ol.pt li b.n{font:700 10.5px/18px var(--mono);width:18px;height:18px;border-radius:50%;background:var(--ink);color:var(--surface);text-align:center}
.mtcard ol.pt li span{font-weight:600;color:var(--ink)} .mtcard ol.pt li em{grid-column:2;font-style:normal;color:var(--ink-3);font-size:11.5px}
.mtcard ol.pt li i{grid-column:2;font-style:normal;font:500 11.5px var(--mono);color:var(--ink-2)}
.mtcard ol.pt li.on{background:color-mix(in srgb,var(--accent) 10%,transparent);border-radius:6px}
.mtcard dl.kv{margin:6px 0 4px}
.mtcard .cn{display:flex;flex-direction:column;gap:3px;margin-top:6px;padding-top:6px;border-top:1px solid var(--line)}
.mtcard .cn div{display:flex;align-items:baseline;gap:6px;font-size:12px;color:var(--ink-2)} .mtcard .cn b{font:650 13px var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}
.mtcard .cn small{font:500 11.5px var(--mono);color:var(--ink-3)} .mtcard .cn .ms{color:var(--ink)}
.mtcard .src{margin-top:6px;font-size:11px;color:var(--ink-3)}
.mtcard .st{display:inline-flex;gap:3px} .mtcard .st i{font:700 9.5px/14px var(--mono);font-style:normal;padding:0 4px;border-radius:4px;background:var(--surface-3);color:var(--ink-2)}
.mtbar{position:absolute;left:10px;right:10px;bottom:10px;z-index:6;display:flex;align-items:center;gap:6px;background:color-mix(in srgb,var(--surface) 95%,transparent);border:1px solid var(--line);border-radius:12px;padding:6px 9px;backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.14)}
.mtbar button{flex:none;height:32px;min-width:32px;border-radius:8px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);font-size:13px;padding:0 9px;white-space:nowrap}
.mtbar button.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent);min-width:44px;font-weight:600}
.mtbar button[aria-pressed="false"]{color:var(--ink-3)}
.mtbar .tl{position:relative;flex:1 1 auto;min-width:60px;height:32px;display:flex;align-items:center}
.mtbar .tl input{width:100%;accent-color:var(--accent);margin:0}
.mtbar .tl .tk{position:absolute;left:8px;right:8px;top:2px;height:6px;pointer-events:none} .mtbar .tl .tk i{position:absolute;top:0;width:1.5px;height:6px;background:var(--ink-3);opacity:.7}
.mtbar .cs{display:none} .mtbar .tm{flex:none;font:500 12px var(--mono);color:var(--ink-2);white-space:nowrap}
#mtVol{width:70px;flex:none;accent-color:var(--accent)}
.mtl{position:absolute;inset:0;pointer-events:none;z-index:4;overflow:hidden}
.mtl svg{position:absolute;inset:0;width:100%;height:100%} .mtl svg path{fill:none;stroke:var(--ink-2);stroke-width:1;opacity:.85} .mtl svg circle{fill:var(--ink)}
.mtx{position:absolute;left:0;top:0;display:flex;gap:6px;align-items:flex-start;font-size:11.5px;line-height:1.25;color:var(--ink);background:color-mix(in srgb,var(--surface) 94%,transparent);border:1px solid var(--line);border-radius:7px;padding:4px 8px 4px 5px;width:max-content;max-width:250px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.mtx b{font:700 10.5px/16px var(--mono);min-width:16px;height:16px;border-radius:50%;background:var(--ink);color:var(--surface);text-align:center;flex:none}
.mtx span{display:flex;flex-direction:column;min-width:0} .mtx .nm{font-weight:600} .mtx em{font-style:normal;color:var(--ink-3);font:400 11px var(--mono)}
.mtx.on{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 30%,transparent)}
.mtn{position:absolute;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:var(--ink);color:var(--surface);font:700 11px/20px var(--mono);text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.mtstop{position:absolute;right:66px;top:10px;z-index:6;width:min(420px,calc(100% - 420px));background:var(--surface);border:1px solid #d64545;border-left:5px solid #d64545;border-radius:10px;padding:8px 12px;font-size:12.5px;line-height:1.42;color:var(--ink-2);box-shadow:0 6px 18px rgba(0,0,0,.18)}
.mtstop b{display:flex;gap:8px;align-items:center;color:#d64545;font-size:13.5px;margin-bottom:3px} .mtstop b i{font:700 12px/22px var(--mono);font-style:normal;min-width:22px;height:22px;border-radius:50%;background:#d64545;color:#fff;text-align:center}
.mtstop.inf{border-color:var(--accent)} .mtstop.inf b{color:var(--accent)} .mtstop.inf b i{background:var(--accent)}
.mtfade{position:absolute;inset:0;z-index:3;background:#0b0d0e;opacity:0;pointer-events:none}
.mtsum{position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:7;width:min(640px,calc(100% - 24px));max-height:calc(100% - 96px);overflow:auto;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px 10px;box-shadow:0 10px 30px rgba(0,0,0,.2)}
.mtsum h2{margin:0 0 6px;font-size:15px} .mtsum .x{position:absolute;right:8px;top:6px;border:0;background:none;font-size:18px;color:var(--ink-2)}
.mtsum .cmp td,.mtsum .cmp th{padding:4px 6px}
.mtst{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.mtst button{width:100%;display:flex;gap:8px;align-items:baseline;text-align:left;font-size:13px;line-height:1.3;color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:6px 9px}
.mtst button em{font:500 11px var(--mono);color:var(--ink-3);font-style:normal;min-width:22px} .mtst button small{margin-left:auto;font:500 11px var(--mono);color:var(--ink-3)}
.mtst button[aria-current="true"]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--surface))} .mtst button.done em{color:var(--ok)}
table.mtq td.n{white-space:nowrap} table.mtq tr.cur td{background:var(--surface-2)}
@media (max-width:760px){
  .mtcard{left:6px;right:6px;top:auto;bottom:56px;width:auto;max-height:36%;}
  .mtcard .ey button{display:inline-grid;place-items:center}
  .mtcard.min .in>*:not(.ey):not(h3){display:none} .mtcard.min h3{margin-bottom:0;font-size:14px}
  .mtcard h3{font-size:14.5px} .mtcard p{font-size:12.3px}
  .mtbar{left:6px;right:6px;bottom:6px;padding:5px 6px;gap:4px} .mtbar button{padding:0 7px;min-width:30px} #mtVol{display:none} .mtbar .tm small{display:none}
  .mtbar .cl{display:none} .mtbar .cs{display:inline}
  .mtstop{right:8px;left:8px;width:auto;top:8px} .mtsum{top:8px;max-height:calc(100% - 80px)}
}`; document.head.appendChild(st); }
const VIEWEL=$('#view');
VIEWEL.insertAdjacentHTML('beforeend',`<div class="mtfade" id="mtfade"></div><div class="mtl" id="mtl" hidden aria-hidden="true"><svg id="mtln" xmlns="http://www.w3.org/2000/svg"></svg></div>
<div class="mtcard" id="mtcard" hidden><div class="in" id="mtci"></div></div><div class="mtstop" id="mtstop" hidden></div><div class="mtsum" id="mtsum" hidden></div>
<div class="mtbar" id="mtbar" hidden><button type="button" id="mtPlay" class="pri" aria-label="Пуск монтажу" title="Пуск (пробіл)">▶</button><button type="button" id="mtSpd" title="Швидкість фронтів; зразки й перші штуки — завжди ×1">×1</button>
<button type="button" id="mtPrev" aria-label="Попередній кадр" title="Попередній кадр">‹</button><button type="button" id="mtNext" aria-label="Наступний кадр" title="Наступний кадр">›</button>
<div class="tl"><input type="range" id="mtPos" min="0" max="1000" step="1" value="0" aria-label="Час монтажу"><div class="tk" id="mtTk"></div></div><span class="tm" id="mtClock">0:00</span>
<button type="button" id="mtCam" aria-pressed="true" title="Камера за сценарієм; торкання моделі — вільна камера"><span class="cl">Камера:</span><span class="cs">Кам.</span> авто</button><button type="button" id="mtSnd" aria-pressed="true" title="Музика і звуки">♪</button><input type="range" id="mtVol" min="0" max="100" step="1" aria-label="Гучність"></div>`);
const CAMH=w=>`<span class="cl">Камера:</span><span class="cs">Кам.</span> ${w}`;
const UI={card:$('#mtcard'),ci:$('#mtci'),bar:$('#mtbar'),play:$('#mtPlay'),spd:$('#mtSpd'),prev:$('#mtPrev'),next:$('#mtNext'),pos:$('#mtPos'),tk:$('#mtTk'),clock:$('#mtClock'),cam:$('#mtCam'),snd:$('#mtSnd'),vol:$('#mtVol'),lab:$('#mtl'),svg:$('#mtln'),stop:$('#mtstop'),sum:$('#mtsum'),fade:$('#mtfade')};
const SRCN={П:'з проєкту',Р:'розрахунок',З:'рішення власника',О:'оцінка, перевірити'};
const badge=k=>k?`<span class="st"><i title="${SRCN[k]||''}">${k}</i></span>`:'';
const kvHTML=rows=>`<dl class="kv">${rows.map(r=>`<dt>${esc(r[0])} ${badge(r[2])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>`;
const ND='немає в даних';

// ---------- музика: власна, з браузера (Web Audio), ля мінор, 112 уд./хв (такт 2,14 с); спокійно під зразок, ритм під фронти; тихі «тук» і «клац» посадки
const SND={ctx:null,on:true,vol:0.55,mode:'calm',playing:false,step:0,nt:0,bus:{}};
try{ const s=JSON.parse(localStorage.getItem('antares-mt-snd')||'null'); if(s){ SND.on=s.on!==false; if(typeof s.vol==='number') SND.vol=s.vol; } }catch(e){}
const sndSave=()=>{ try{ localStorage.setItem('antares-mt-snd',JSON.stringify({on:SND.on,vol:SND.vol})); }catch(e){} };
const BPM=112, SPB=60/BPM/4, mf=n=>440*Math.pow(2,(n-69)/12);
const PROG=[{pad:[57,60,64],b:45,a:[69,72,76,81]},{pad:[57,60,65],b:41,a:[69,72,77,81]},{pad:[55,60,64],b:48,a:[67,72,76,79]},{pad:[55,59,62],b:43,a:[67,71,74,79]}];
const ARP=[0,1,2,3,2,1,2,0, 1,2,3,2,1,3,2,1];
const MIX={calm:{pad:0.2,arp:0.1,bass:0,kick:0,hat:0,snr:0},drive:{pad:0.13,arp:0.12,bass:0.2,kick:0.42,hat:0.07,snr:0.15},end:{pad:0.24,arp:0.07,bass:0.06,kick:0,hat:0,snr:0}};
function sndInit(){ if(SND.ctx) return true; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false; let c; try{ c=new AC(); }catch(e){ return false; } SND.ctx=c;
  const comp=c.createDynamicsCompressor(); comp.threshold.value=-20; comp.knee.value=10; comp.ratio.value=3; comp.connect(c.destination);
  const m=c.createGain(); m.gain.value=0; m.connect(comp); SND.master=m;
  const dl=c.createDelay(1); dl.delayTime.value=SPB*3; const fb=c.createGain(); fb.gain.value=0.3; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2400; dl.connect(lp); lp.connect(fb); fb.connect(dl); const wet=c.createGain(); wet.gain.value=0.3; lp.connect(wet); wet.connect(m);
  Object.keys(MIX.calm).forEach(k=>{ const g=c.createGain(); g.gain.value=0; g.connect(m); SND.bus[k]=g; }); SND.bus.arp.connect(dl);
  const nb=c.createBuffer(1,c.sampleRate,c.sampleRate), dd=nb.getChannelData(0); for(let i=0;i<dd.length;i++) dd[i]=Math.random()*2-1; SND.noise=nb;
  SND.nt=c.currentTime+0.1; SND.step=0; setInterval(sndTick,25); sndMix(true); return true; }
function sndMix(now){ const c=SND.ctx; if(!c) return; const t=c.currentTime, X=MIX[SND.mode]||MIX.calm; Object.keys(X).forEach(k=>{ const g=SND.bus[k].gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(X[k],t+(now?0.05:1.4)); });
  const mg=SND.master.gain, tg=SND.on&&SND.playing?0.55*SND.vol:0; mg.cancelScheduledValues(t); mg.setValueAtTime(mg.value,t); mg.linearRampToValueAtTime(tg,t+0.35); }
function sndMode(m){ if(SND.mode===m) return; SND.mode=m; sndMix(false); }
function env(g,t,a,v,r){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(v,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+r); }
function vPad(t,ns,dur){ const c=SND.ctx; ns.forEach(n=>[-7,7].forEach(dt=>{ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=mf(n); o.detune.value=dt; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=SND.mode==='drive'?1400:850; f.Q.value=0.5;
  const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.05,t+0.6); g.gain.setValueAtTime(0.05,t+dur-0.3); g.gain.linearRampToValueAtTime(0,t+dur+0.8); o.connect(f); f.connect(g); g.connect(SND.bus.pad); o.start(t); o.stop(t+dur+0.9); })); }
function vPl(t,n,v,bus){ const c=SND.ctx, o=c.createOscillator(); o.type=SND.mode==='drive'?'square':'triangle'; o.frequency.value=mf(n); const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=SND.mode==='drive'?2600:1800; const g=c.createGain(); env(g,t,0.004,v,0.28); o.connect(f); f.connect(g); g.connect(bus||SND.bus.arp); o.start(t); o.stop(t+0.36); }
function vBass(t,n){ const c=SND.ctx, o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=mf(n); const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; f.Q.value=5; const g=c.createGain(); env(g,t,0.006,0.5,0.2); o.connect(f); f.connect(g); g.connect(SND.bus.bass); o.start(t); o.stop(t+0.3); }
function vKick(t){ const c=SND.ctx, o=c.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12); const g=c.createGain(); env(g,t,0.002,1,0.3); o.connect(g); g.connect(SND.bus.kick); o.start(t); o.stop(t+0.36); }
function vNoise(t,type,fq,q,v,r,bus){ const c=SND.ctx, s=c.createBufferSource(); s.buffer=SND.noise; const f=c.createBiquadFilter(); f.type=type; f.frequency.value=fq; f.Q.value=q; const g=c.createGain(); env(g,t,0.002,v,r); s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t+r+0.05); }
function sndStep(s,t){ const bar=(s>>4)%4, st=s%16, ch=PROG[bar], m=SND.mode;
  if(st===0) vPad(t,ch.pad,16*SPB);
  if(m==='drive'||st%2===0) vPl(t,ch.a[ARP[st]],m==='drive'?(st%4===0?0.16:0.1):0.13);
  if(m==='drive'){ if(st%2===0) vBass(t,ch.b+[0,0,12,0,0,12,0,7][st/2]); if(st%4===0) vKick(t); if(st===4||st===12){ vNoise(t,'bandpass',1800,0.8,0.6,0.16,SND.bus.snr); }
    if(st%4===2) vNoise(t,'highpass',7000,0.7,0.5,0.05,SND.bus.hat); else if(st%2===1) vNoise(t,'highpass',8000,0.7,0.18,0.03,SND.bus.hat); }
  if(m==='end'&&st===0) vBass(t,ch.b); }
function sndTick(){ const c=SND.ctx; if(!c) return; if(!(SND.on&&SND.playing)){ SND.nt=c.currentTime+0.06; return; } if(SND.nt<c.currentTime) SND.nt=c.currentTime+0.02;
  while(SND.nt<c.currentTime+0.14){ sndStep(SND.step,SND.nt); SND.step=(SND.step+1)%64; SND.nt+=SPB; } }
function sndSting(){ const c=SND.ctx; if(!c||!(SND.on&&SND.playing)) return; const t=c.currentTime+0.03; [76,81,84,88].forEach((n,i)=>vPl(t+i*0.075,n,0.2,SND.bus.arp)); vNoise(t,'highpass',5000,0.5,0.12,0.7,SND.master); }
function sndPlaying(on){ SND.playing=on; if(on&&!SND.ctx) sndInit(); if(SND.ctx&&SND.ctx.state==='suspended') try{ SND.ctx.resume(); }catch(e){} sndMix(false); }
function sfx(kind){ const c=SND.ctx; if(!c||!(SND.on&&SND.playing)) return; const t=c.currentTime+0.01, now=performance.now(); if(now-(SND.lastFx||0)<85) return; SND.lastFx=now;
  if(kind==='tuk'){ const o=c.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(55,t+0.09); const g=c.createGain(); env(g,t,0.003,0.32,0.14); o.connect(g); g.connect(SND.master); o.start(t); o.stop(t+0.2); vNoise(t,'lowpass',700,0.7,0.12,0.06,SND.master); }
  else if(kind==='klac'){ vNoise(t,'highpass',5200,1.2,0.22,0.035,SND.master); vNoise(t+0.03,'bandpass',3200,4,0.12,0.03,SND.master); }
  else if(kind==='zip'){ vNoise(t,'bandpass',2400,2,0.12,0.12,SND.master); } }


// ---------- місця для палет, пачок, ящиків і коробок по периметру покрівлі цеху: не на модулях, не на вентиляції; стіна — під палетою
const EDG={W:{p:s=>[0.92,s],lo:3,hi:93.6}, E:{p:s=>[95.5,s],lo:3,hi:93.6}, S:{p:s=>[s,1.05],lo:3,hi:93.6}, N:{p:s=>[s,95.35],lo:3,hi:93.6}};
function edgeOf(X,Y,eds){ const d={W:X,E:96.6-X,S:Y,N:96.6-Y}; let e=eds[0]; eds.forEach(k=>{ if(d[k]<d[e]) e=k; }); return {e,s:(e==='S'||e==='N')?X:Y}; }
function blockedOn(e,half){ const out=[]; S.obs.forEach(o=>{ const r=o[2]/2+half+0.45; if(e==='W'&&o[0]<3.6) out.push([o[1]-r,o[1]+r]); if(e==='E'&&o[0]>92.4) out.push([o[1]-r,o[1]+r]); if(e==='S'&&o[1]<3.6) out.push([o[0]-r,o[0]+r]); if(e==='N'&&o[1]>92.9) out.push([o[0]-r,o[0]+r]); }); return out; }
function spread(des,g,lo,hi,blk){ const s_=des.map(v=>Math.max(lo,Math.min(hi,v)));
  for(let it=0;it<120;it++){ let mv=false;
    for(let i=0;i<s_.length;i++) for(const b of blk) if(s_[i]>b[0]&&s_[i]<b[1]){ s_[i]=(s_[i]-b[0]<b[1]-s_[i])?b[0]:b[1]; mv=true; }
    for(let i=1;i<s_.length;i++){ if(s_[i]-s_[i-1]<g-1e-6){ const c=(s_[i]+s_[i-1])/2; s_[i-1]=c-g/2; s_[i]=c+g/2; mv=true; } }
    for(let i=0;i<s_.length;i++){ if(s_[i]<lo){ s_[i]=lo; mv=true; } if(s_[i]>hi){ s_[i]=hi; mv=true; } }
    if(!mv) break; } return s_; }
// розбити вироби на палети по cap: кожен — до найближчого краю, у палеті — спершу найближчі (фронт росте від краю всередину)
function makePallets(pts,cap,eds,len){ const by={}; eds.forEach(e=>by[e]=[]); pts.forEach((p,i)=>{ if(!p) return; const q=edgeOf(p[0],p[1],eds); by[q.e].push({i,s:q.s,p}); });
  const out=[]; eds.forEach(e=>{ const L=by[e].sort((a,b)=>a.s-b.s); if(!L.length) return; const ch=[]; for(let i=0;i<L.length;i+=cap) ch.push(L.slice(i,i+cap));
    const des=ch.map(c=>c[c.length>>1].s), s_=spread(des,len+0.6,EDG[e].lo,EDG[e].hi,blockedOn(e,len/2));
    ch.forEach((c,k)=>{ const [X,Y]=EDG[e].p(s_[k]); const items=c.map(o=>o.i).sort((a,b)=>Math.hypot(pts[a][0]-X,pts[a][1]-Y)-Math.hypot(pts[b][0]-X,pts[b][1]-Y)); out.push({X,Y,e,items}); }); });
  return out; }
// палета на покрівлі: нахил за дугою; along — довга вісь уздовж краю ('x' — локальна x уздовж краю)
function palMat(p,along){ const X=p.X, Y=p.Y, a=Math.atan(roofK(X)); let y=roofZ(X); if(p.e==='S'||p.e==='N'){ y=Math.max(roofZ(X-0.6),roofZ(X+0.6),y)-0.0; }
  const q=new Q().setFromAxisAngle(ZA,(p.e==='S'||p.e==='N')?a:0); const rot=(p.e==='W'||p.e==='E')?(along==='z'?0:Math.PI/2):(along==='z'?Math.PI/2:0); q.multiply(new Q().setFromAxisAngle(YA,rot));
  return new M4().compose(W(X,Y,y+0.002),q,ONE3); }
const angOf=p=>Math.atan2(p.Y-48,p.X-48);
function sortPallets(list,first){ const a0=angOf(list[first]); const d=list.map((p,i)=>({p,i,a:i===first?-10:((angOf(p)-a0+Math.PI*4)%(Math.PI*2))})); d.sort((x,y)=>x.a-y.a); return d.map(o=>o.p); }
// геометрія палет і тари
function palletGeo(Lx,Dz){ const g=[]; for(let i=0;i<5;i++) g.push(gB(Lx,0.022,0.1,0,0.133,-Dz/2+0.05+i*(Dz-0.1)/4)); [-1,0,1].forEach(s=>{ g.push(gB(Lx,0.078,0.1,0,0.083,s*(Dz/2-0.05))); g.push(gB(Lx,0.022,0.1,0,0.011,s*(Dz/2-0.05))); }); return gMerge(g); }
const PAL_H=0.144;
function bearersGeo(L){ return gMerge([gB(0.1,0.08,0.1,0,0.04,-L*0.3),gB(0.1,0.08,0.1,0,0.04,L*0.3),gB(0.42,0.04,0.1,0,0.1,-L*0.3),gB(0.42,0.04,0.1,0,0.1,L*0.3)]); }
function crateGeo(Lx,Dz,H){ const t=0.018; return gMerge([gB(Lx,0.02,Dz,0,0.01,0),gB(Lx,H,t,0,H/2,Dz/2-t/2),gB(Lx,H,t,0,H/2,-Dz/2+t/2),gB(t,H,Dz,Lx/2-t/2,H/2,0),gB(t,H,Dz,-Lx/2+t/2,H/2,0)]); }
// кадр у точці покрівлі цеху (з rf двійника: x — уздовж дуги, y — нормаль)
const frm=(X,Y,h)=>{ rf(X,Y,h||0); return new M4().compose(_p.clone(),_q.clone(),ONE3); };
const pathPts=(p,off)=>{ const out=[]; for(let i=0;i<p.length-1;i++){ const seg=route(p[i][0],p[i][1],p[i+1][0],p[i+1][1],off,0.3); if(out.length) seg.shift(); out.push(...seg); } return out; };
const segsOf=(pts,acc)=>{ for(let i=0;i<pts.length-1;i++) acc.push(pts[i],pts[i+1]); return acc; };
// розбити відрізок на частини по ≤ step м (щоб «прокладався»)
function chop(a,b,step){ const out=[], L=a.distanceTo(b), n=Math.max(1,Math.ceil(L/step)); for(let i=0;i<n;i++){ out.push(a.clone().lerp(b,i/n),a.clone().lerp(b,(i+1)/n)); } return out; }

// ---------- зразок: виріб у сцені, деталі розходяться вздовж осі складання по черзі, пауза з виносками, збирання у зворотному порядку
// parts: [{nm,sz,m,q,qs,o,ex:[dx,dy,dz]}]; ex — зсув у системі зразка; tA — початок розходження, tC — початок збирання
function explode(parts,t,tA,tC,gap){ gap=gap||0.16; const n=parts.length; parts.forEach((p,i)=>{ if(!p.ex) return; if(!p.b) p.b=p.o.position.clone();
    const wo=s5((t-(tA+i*gap))/0.9), wi=s5((t-(tC+(n-1-i)*gap))/0.9), w=Math.max(0,wo-wi); p.o.position.set(p.b.x+p.ex[0]*w,p.b.y+p.ex[1]*w,p.b.z+p.ex[2]*w); }); }
const labOn=(s,t)=>t>=s.la&&t<s.lb;


// ================= Наш варіант Б (E-Systems): 14 актів ≈ 5:50 при ×1 (промт, розд. 8)
function buildOurs(){ const T=new TL('ours'), R=T.root, E=EPX, rrS=new Set(E.rr);
  // ----- дані: блоки (лаги 4 274, кінці 482, крайні профілі 848 без мата), шматки лаг, гільзи, шпильки, профілі, анкери, притиски, модулі
  const BL=[]; OD.blk.forEach(b=>BL.push({X:LX(b[0]),Y:b[1],m:1,k:0,l:b[0]})); OD.eblk.forEach(b=>BL.push({X:LX(b[0]),Y:b[1],m:1,k:1,l:b[0]})); OD.xblk.forEach(b=>BL.push({X:b[0],Y:b[1],m:0,k:2}));
  const NB=BL.length, NMAT=OD.blk.length+OD.eblk.length;
  const LP=[]; LG.forEach((l,i)=>{ const L=l[2]-l[1]; let y=l[1]; const n=Math.floor(L/4.8+1e-6); for(let k=0;k<n;k++){ LP.push({l:i,X:l[0],y0:y,y1:y+4.8,L:4.8}); y+=4.8; } if(L-n*4.8>0.01) LP.push({l:i,X:l[0],y0:y,y1:l[2],L:2.4}); });
  const N48=LP.filter(p=>p.L>3).length, N24=LP.length-N48;
  const mods=OM.map((m,i)=>i).filter(i=>!rrS.has(i));
  // ----- демо-ряд: колонка модулів між двома лагами біля східного краю, на висоті ≈44 м, без вентиляції й ліхтарів поруч
  const clear=(X,Y,r)=>S.obs.every(o=>Math.hypot(o[0]-X,o[1]-Y)>o[2]/2+r)&&S.lan.every(q=>X<q[0]-r||X>q[1]+r||Y<q[2]-r||Y>q[3]+r);
  let DL=-1, DJ=-1, best=-1e9;
  LG.forEach((l,i)=>{ if(l[0]<74||l[0]>92.5||l[1]>36||l[2]<54) return; const j=LG.findIndex(m=>m[0]-l[0]>1.15&&m[0]-l[0]<1.45&&m[1]<40&&m[2]>50); if(j<0) return;
    if(!clear(l[0],44,3.6)||!clear(LG[j][0],44,3.6)) return; if(l[0]>best){ best=l[0]; DL=i; DJ=j; } });
  if(DL<0){ DL=LG.findIndex(l=>l[0]>80); DJ=DL+1; }
  const DX=LX(DL), DXJ=LX(DJ);
  const near1=(arr,f)=>{ let b=-1,bd=1e9; arr.forEach((x,i)=>{ const d=f(x,i); if(d<bd){ bd=d; b=i; } }); return b; };
  const dB=near1(BL,b=>b.k===0&&b.l===DL?Math.abs(b.Y-44):1e9), DBk=BL[dB];
  const dCol=OM.map((m,i)=>i).filter(i=>Math.abs(OM[i].Xa-DX)<0.02&&Math.abs(OM[i].Xb-DXJ)<0.02&&!rrS.has(i)).sort((a,b)=>OM[a].Y-OM[b].Y);
  const dSl=near1(OD.sl,s=>s[0]===DL&&OD.rods.some(r=>r[0]===DL&&r[1]===DJ&&Math.abs(r[2]-s[1])<0.01)?Math.abs(s[1]-45.5):1e9), DS=OD.sl[dSl];
  const dSlJ=near1(OD.sl,s=>s[0]===DJ&&Math.abs(s[1]-DS[1])<0.01?0:1e9);
  const dRod=near1(OD.rods,r=>r[0]===DL&&r[1]===DJ&&Math.abs(r[2]-DS[1])<0.01?0:1e9);
  const dXp=near1(OD.xp,x=>x[0]===DL&&x[1]===DJ?x[2]:1e9), DXP=OD.xp[dXp];
  const dBox=near1(E.boxes,b=>b.r?Math.hypot(b.X-(DX-4),b.Y-50):1e9), DBX=E.boxes[dBox];
  const dStr=near1(E.strings,s=>s.r&&s.m.some(m=>dCol.includes(m))?(s.b===dBox?0:1)+Math.abs(OM[s.m[0]].Y-44)/100:1e9);
  const roofP=(X,Y,h)=>W(X,Y,roofZ(X)+(h||0));

  // ===== акт 0. Об'єкт
  T.act('intro','Об\'єкт','Дах цеху 96 × 96 м з п\'ятьма арковими прольотами, склад зі скатними дахами, ТП-5913 і майданчик контейнерів біля фасаду по осі 17.');
  T.shot(8,{title:'Станція, яку будуємо',text:'Наш варіант Б: панелі паралельно покрівлі на прямих лагах, баласт із муфтою, тяга шпильками між лагами. На цеху 1 749 панелей, на складі 176.',
    kv:[['Панелі','1 925 × 730 Вт = 1 405,25 кВтп','П'],['Цех / склад','1 749 / 176','П'],['Стрінги','175 по 11 модулів','Р'],['Щити PV 7/1','26 (23 на даху, 3 на складі)','Р'],['Накопичувачі','3 × Golen LES-H20','З']],
    cam:u=>({tgt:V(56,4,-44),az:lerp(1.05,0.78,s5(u)),el:lerp(0.35,0.6,s5(u)),dist:lerp(260,165,s5(u)),fov:38}),mus:'calm'});

  // ===== акт 1. Розмітка: сині шнури по осях лаг, хрестик під кожен блок; демо-ряд крупно, далі від усіх країв до середини
  T.act('mark','Розмітка','Осі 241 лінії лаг — синя крейда; хрестик під кожен блок: під лагою 575 + 1 200·k від торця, під кінцем лаги — за 30 мм, під крайнім профілем — по 2 на модуль.');
  const crossGeo=gMerge([gB(0.34,0.003,0.016,0,0.0015,0),gB(0.016,0.003,0.34,0,0.0015,0)]);
  const crossMv=T.up(new Mover([[crossGeo,MM.chalk]],NB,R,{mode:'pop',cast:false,fl:0}));
  const cordP=[], cordT=[]; let t1a;
  { const a=T.t, dA=a+1.2, dB_=a+5.4, fA=a+6.4, fB=a+13.2; t1a=a;
    // шнури: відрізки по 0,5 м, кожна лінія «клацає» за 0,7 с; демо — дві лінії ряду, решта — від західного і східного країв до середини
    const lineT=LG.map((l,i)=>i===DL?dA:i===DJ?dA+1.1:fA+(fB-fA-1)*c01(Math.min(l[0],96.6-l[0])/48)*0.95+0.08*hsh(i));
    LG.forEach((l,i)=>{ const z=roofZ(l[0])+0.005, A=W(l[0],l[1]-0.15,z), B=W(l[0],l[2]+0.15,z), seg=chop(A,B,0.5), n=seg.length/2, dur=i===DL||i===DJ?1.0:0.7; for(let k=0;k<n;k++){ cordP.push(seg[2*k],seg[2*k+1]); cordT.push(lineT[i]+dur*k/n); } });
    const ord=cordT.map((t,i)=>i).sort((x,y)=>cordT[x]-cordT[y]), P2=[], T2=[]; ord.forEach(i=>{ P2.push(cordP[2*i],cordP[2*i+1]); T2.push(cordT[i]); });
    const cord=fatLines(P2,0x2f6fd6,3,R,{ro:4}); var cordR=T.up(new LRev(cord,T2));
    // хрестики: демо-ряд по одному (лінії DL і DJ між сусідніми модулями), далі всі — від країв до середини (відстань до найближчого краю)
    const demoX=BL.map((b,i)=>i).filter(i=>(BL[i].l===DL||BL[i].l===DJ)&&Math.abs(BL[i].Y-DBk.Y)<6.5).sort((a,b)=>Math.abs(BL[a].Y-DBk.Y)-Math.abs(BL[b].Y-DBk.Y)||BL[a].X-BL[b].X);
    const dset=new Set(demoX); BL.forEach((b,i)=>{ crossMv.F[i]=frm(b.X,b.Y,0.0005); });
    demoX.forEach((i,k)=>{ crossMv.ts[i]=dA+1.6+k*(dB_-dA-1.8)/demoX.length; crossMv.td[i]=0.35; });
    BL.forEach((b,i)=>{ if(dset.has(i)) return; const e=Math.min(b.X,96.6-b.X,b.Y,96.6-b.Y); crossMv.ts[i]=fA+(fB-fA-0.6)*c01(e/48)+0.25*hsh(i); crossMv.td[i]=0.3; });
    crossMv.times();
    T.shot(6,{title:'Демо-ряд біля східного краю',text:'Два шнури по осях лаг ряду, хрестики під блоки — по одному. Блоки під лагою — за 575 + 1 200·k мм від торця лаги.',
      kv:[['Під лагою','575 + 1 200·k від торця','П'],['Під кінцем лаги','центр за 30 мм від торця','П'],['Під крайнім профілем','2 на модуль, без мата','П']],
      cam:u=>({tgt:roofP((DX+DXJ)/2,DBk.Y+1.5,0),az:lerp(0.22,0.62,s5(u)),el:0.96,dist:15,fov:38}),slow:true});
    T.shot(8,{title:'Розмітка всього даху',text:'Шнури й хрестики розходяться від усіх країв до середини. Розмітка лишається до кінця етапу лаг; хрестик зникає під блоком.',
      cam:u=>({tgt:V(50,6,-48),az:lerp(1.3,1.0,s5(u)),el:lerp(0.95,0.82,s5(u)),dist:lerp(120,140,s5(u)),fov:38}),mus:'drive'});
    T.counter({nm:'Хрестики під блоки',tot:NB,n:t=>crossMv.placed(t),note:'4 274 + 482 + 848'}); }

  // ===== акт 2. Баласт
  T.act('blk','Баласт','Блок «Баласт із муфтою» 300×300×60 на гумовому маті; палета — 60 блоків (рішення 26.10); палети по периметру, кожен блок — з найближчої.');
  const blkGeoM=gMerge([gTint(gB(0.32,0.003,0.32,0,0.0015,0),0x262626),gTint(gB(0.3,0.06,0.3,0,0.033,0),0x9d9a93),gTint(gC(0.0075,0.0012,8,'y',0,0.0634,0),0xb8902f)]);
  const blkGeoX=gMerge([gTint(gB(0.3,0.06,0.3,0,0.03,0),0x9d9a93),gTint(gC(0.0075,0.0012,8,'y',0,0.0604,0),0xb8902f)]);
  const CR={X:107.5,Y:43}, crane=new Crane(R,CR.X,CR.Y); crane.parts.forEach(o=>obstAdd(o));
  const toPal=BL.map((b,i)=>i===dB?null:[b.X,b.Y]);
  const BPALS=makePallets(toPal,60,['W','E','S','N'],1.2);
  let bp0=0; { let bd=1e9; BPALS.forEach((p,k)=>{ const d=Math.hypot(p.X-DBk.X,p.Y-DBk.Y)+(p.e==='E'?0:1000); if(d<bd){ bd=d; bp0=k; } }); }
  const BP=sortPallets(BPALS,bp0);
  const bPal=T.up(new Pals([[palletGeo(1.2,0.8),MM.wood]],BP.length,R));
  const blkM=T.up(new Mover([[blkGeoM,MM.vc]],NMAT,R,{pals:bPal,arc:1.0})), blkX=T.up(new Mover([[blkGeoX,MM.vc]],NB-NMAT,R,{pals:bPal,arc:1.0}));
  const bMv=i=>i<NMAT?[blkM,i]:[blkX,i-NMAT];
  const sampleB={}; let tLandDemo=0, tBdemo0=0;
  { const t0=T.t;
    // 2.1 зразок у контексті: блок висить 1 м над першим хрестиком, бетон прозорий; мат, болт M8×35, шайба, муфта M8×30 розходяться вертикально
    const SBF=frm(DBk.X,DBk.Y,0), up=new V3(0,1,0).applyQuaternion(new Q().setFromRotationMatrix(SBF));
    const g=grp_(R); g.matrixAutoUpdate=false; g.visible=false;
    const bk=mesh_(partGeoR('block1',0.025),MM.concX.clone(),g,false), mt=mesh_(partGeoR('mat1',0.025),MM.mat,g);
    const bolt=grp_(g); mesh_(gHex(0.013,0.0053,'y',0,0.0057,0),MM.hw,bolt); mesh_(gC(0.004,0.035,12,'y',0,0.0083+0.0175,0),MM.thr,bolt);
    const wsh=mesh_(gRing(0.012,0.0042,0.002,'y',0,0.0093,0),MM.hw,g), mu=grp_(g); mesh_(gHex(0.013,0.03,'y',0,0.048,0),MM.yz,mu); mesh_(gC(0.0041,0.0305,10,'y',0,0.048,0),MM.dark,mu);
    const P=[{nm:'Мат гумовий 320×320×3',sz:'шорсткий, під блоки лаг',m:0.4,q:NMAT,o:mt,ex:[0,-0.10,0]},
      {nm:'Болт M8×35 головкою на маті',sz:'закладна, залита в бетон',m:null,q:NB,o:bolt,ex:[0,0.14,0]},
      {nm:'Шайба 24 × 8,4 × 2',sz:'над головкою болта',m:null,q:NB,o:wsh,ex:[0,0.22,0]},
      {nm:'Муфта M8×30 DIN 6334',sz:'верх врівень з бетоном',m:null,q:NB,o:mu,ex:[0,0.32,0]},
      {nm:'Блок «Баласт із муфтою» 300×300×60',sz:'верх з ухилом 1°, ребра R1',m:13,q:NB,o:bk,ex:null}];
    const sh=T.shot(11.5,{title:'Зразок: блок над першим хрестиком',text:'Бетон прозорий: видно мат, болт M8×35 головкою на маті, шайбу і муфту M8×30 — верх муфти врівень з бетоном, вода над нею не стоїть.',parts:P,
      kv:[['Бетон','0,00536 м³ ≈ 12,85 кг','Р'],['Блок з матом і закладною','≈ 13,3 кг','Р'],['Блоки на дах','5 604 (4 274 + 482 + 848)','П'],['Мати','4 756 (під блоки лаг)','П']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(SBF).addScaledVector(up,1.03),az:0.7+u*220*D2R,el:lerp(0.42,0.5,u),dist:1.1,fov:36}),slow:true,mus:'calm'});
    const s=T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+3.0+5*0.16+0.9,lb:sh.t0+8.4,root:g}); sampleB.s=s;
    // 2.2 блок опускається на хрестик, хрестик зникає; камера відходить
    const sh2=T.shot(3,{title:'Блок на хрестик',text:'Блок стає непрозорим і лягає на хрестик муфтою вгору. Далі за цим зразком кладуть усі.',kv:[['Блок','центр на хрестику, сторони вздовж шнура','П']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(SBF).addScaledVector(up,0.35*(1-s5(u))),az:0.7+220*D2R+u*0.25,el:0.6,dist:lerp(1.4,2.6,s5(u)),fov:38}),slow:true});
    tLandDemo=sh2.t0+2.2;
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<tLandDemo; g.visible=on; if(!on) return; const u=t-sh.t0; explode(P,t,sh.t0+3.0,sh.t0+8.4);
      const k=t<sh2.t0?0:s5((t-sh2.t0)/2.2), hgt=1.0*(1-k), rot=(t<sh2.t0?(t-sh.t0)/11.5*0.9:0.9*(1-k));
      g.matrix.copy(SBF).multiply(T_(0,hgt,0)).multiply(Ry(rot)); g.matrixWorldNeedsUpdate=true;
      const op=t<sh.t0+9.8?0.25:t<sh.t0+11.0?lerp(0.25,1,s5((t-sh.t0-9.8)/1.2)):1; bk.material.opacity=op; bk.material.transparent=op<0.99; bk.material.depthWrite=op>0.99; need=true; }));
    const [mv0,i0]=bMv(dB); mv0.F[i0]=frm(DBk.X,DBk.Y,0); mv0.ts[i0]=tLandDemo; mv0.td[i0]=0.01;
    crossMv.hide=new Float32Array(NB).fill(1e9); crossMv.hide[dB]=tLandDemo;
    T.fx([tLandDemo],'tuk');
    // 2.3 кран: палета з 60 блоками з машини на східний край; камера на землі з південного боку осі «кран — край даху»
    const t3=T.t, P0=BP[0], R0=palMat(P0,'x'), truck=T_(CR.X+5.5,0.95,-(CR.Y+6.5)).multiply(Ry(Math.PI/2)), c=W(CR.X,CR.Y,0);
    const lp=liftPath(truck,R0,c,t3+0.4,t3+8.6,17.5); bPal.custom[0]=lp; bPal.R[0]=R0; bPal.a[0]=t3; tBdemo0=t3;
    T.up(new Fn(t=>{ const on=t>=t3-0.5&&t<t3+11; crane.g.visible=crane.b1.visible=crane.b2.visible=crane.b3.visible=crane.hook.visible=on; crane.rope.visible=on; if(!on){ crane.sl.visible=false; return; }
      const u=(t-t3)/8.2; let h, cs=null; const PK=W(CR.X-1,CR.Y-6,9.5);
      if(t<t3+0.4||t>t3+9.8){ h=PK; } else { lp.pose(t,_m); _m.decompose(_v,_qa,_sa); const top=_v.clone(); top.y+=2.9; if(t<t3+1.7){ h=PK.clone().lerp(top,s5((t-t3-0.4)/1.3)); } else if(t<t3+8.2){ h=top; cs=[[0.6,0.4],[-0.6,0.4],[-0.6,-0.4],[0.6,-0.4]].map(([x,z])=>new V3(x,PAL_H+0.52,z).applyMatrix4(_m)); } else { h=top.clone().lerp(PK,s5((t-t3-8.2)/1.6)); } }
      crane.set(h,cs); }));
    T.up(new Fn(t=>{ const on=t>=t3-0.5&&t<t3+11; if(truckG.visible!==on){ truckG.visible=on; need=true; } }));
    const truckG=grp_(R); truckG.visible=false; { const tb=T_(CR.X+5.5,0,-(CR.Y+6.5)).multiply(Ry(Math.PI/2)); const tg=grp_(truckG); tg.applyMatrix4(tb);
      mesh_(gB(2.5,0.9,8.5,0,0.45+0.35,0),MM.craneD,tg); mesh_(gB(2.5,0.12,7,0,0.92,0.6),MM.gray,tg); mesh_(gB(2.5,2.2,1.9,0,1.5,-4.1),MM.white,tg); [-3.2,-1.8,2.5].forEach(z=>[-1,1].forEach(sx=>{ const w=mesh_(gC(0.48,0.38,14,'x'),MM.dark,tg); w.position.set(sx*1.1,0.48,z); })); }
    T.shot(9,{title:'Кран подає палету на дах',text:'Автокран між ТП-5913 і майданчиком контейнерів. Палета з 60 блоками — з машини на східний край, над стіною.',
      kv:[['Палета','1 200 × 800, 8 шарів по 8 (останній — 4)','О'],['Маса палети','60 × 13,4 ≈ 0,8 т','Р'],['Кран','між ТП-5913 і контейнерами (як 23.10)','З']],
      cam:(u,t)=>{ lp.pose(Math.max(lp.t0,Math.min(t,lp.t1)),_m2); const p=new V3().setFromMatrixPosition(_m2); p.y=Math.max(3,p.y-1.0); return {tgt:p,az:lerp(2.45,2.15,u),el:lerp(0.2,0.3,u),dist:lerp(30,34,u),fov:40}; },slow:true});
    // 2.4 решта палет — по колу по периметру
    const t4=T.t; for(let k=1;k<BP.length;k++){ bPal.R[k]=palMat(BP[k],'x'); bPal.a[k]=t4+0.3+(k-1)/(BP.length-1)*4.2; }
    T.shot(6,{title:'Палети по периметру',text:`Решта палет — по колу вздовж країв даху, над стінами: ${BP.length} палет по 60. Ще 16 палет — під рами щитів і опори лотків, на етапах 6–7.`,
      kv:[['Палет під лаги і профілі',nf(BP.length),'Р'],['Блоків на палеті','60','З']],cam:u=>({tgt:new V3().setFromMatrixPosition(R0).lerp(V(50,6,-48),s5(u)),az:lerp(2.15,1.45,s5(u)),el:lerp(0.3,0.62,s5(u)),dist:lerp(34,150,s5(u)),fov:38})});
    T.counter({nm:'Палети з блоками на даху зараз',tot:BP.length,n:t=>bPal.count(t),cur:1});
    // 2.5 перші 8 блоків з верхнього шару демо-палети; 2.6 усі палети працюють одночасно
    const t5=T.t, t6=t5+7, ND=8, S6=t6+0.4, D6=9.0;
    BP.forEach((p,k)=>{ const n=p.items.length; let last=0;
      p.items.forEach((bi,r)=>{ const q=n-1-r, layer=Math.floor(q/8), cc=q%8, ix=cc%4, iz=Math.floor(cc/4), [mv,i]=bMv(bi);
        mv.slot[i]=T_(-0.45+ix*0.3,PAL_H+layer*0.063,-0.15+iz*0.3); mv.pal[i]=k; mv.F[i]=BL[bi].m?frm(BL[bi].X,BL[bi].Y,0):frm(BL[bi].X,BL[bi].Y,0);
        let ts,td; if(k===0&&r<ND){ td=1.35; ts=t5+0.7+r*(5.6/ND); } else { td=0.62*(0.85+0.3*hsh(bi)); const rr=k===0?r-ND:r; ts=S6+(rr/60)*(D6-1.2)+0.35*(hsh(bi*3)-0.5)*(D6/60); }
        mv.ts[i]=ts; mv.td[i]=td; mv.arc[i]=Math.min(1.5,0.8+0.04*Math.hypot(p.X-BL[bi].X,p.Y-BL[bi].Y)); crossMv.hide[bi]=ts+td; last=Math.max(last,ts+td); });
      bPal.v[k]=last+0.25; });
    blkM.times(); blkX.times();
    const fx=[]; BP[0].items.slice(0,ND).forEach(bi=>{ const [mv,i]=bMv(bi); fx.push(mv.ts[i]+mv.td[i]); }); T.fx(fx,'tuk');
    T.shot(7,{title:'Перші 8 блоків з демо-палети',text:'З верхнього шару — по дузі на найближчі хрестики. Фронт росте від краю всередину.',
      cam:u=>({tgt:roofP(lerp(BP[0].X-3.5,BP[0].X-5.5,u),BP[0].Y,0.4),az:lerp(2.2,2.55,s5(u)),el:0.6,dist:9,fov:38}),slow:true});
    T.shot(10,{title:'Усі фронти',text:'Усі палети працюють одночасно: блоки йдуть з усіх країв до середини. Порожні палети забирають з даху.',
      cam:u=>({tgt:V(50,6,-48),az:lerp(1.2,1.2+35*D2R,s5(u)),el:0.72,dist:lerp(150,135,u),fov:38}),mus:'drive'});
    T.fx(lineTimes(30,S6,S6+D6),'tuk');
    T.counter({nm:'Блоки на даху',tot:NB,n:t=>blkM.placed(t)+blkX.placed(t),m:13,g:'blk',note:'4 274 під лаги + 482 під кінці лаг + 848 під крайні профілі'});
    T.counter({nm:'Мати 320×320×3',tot:NMAT,n:t=>blkM.placed(t),m:0.4,g:'blk'}); }

  // ===== акт 3. Лаги
  T.act('lag','Лаги','Лага 41×41×1,5 перфорована, пазом догори: шматки 4 800 / 2 400 мм — 1 040 / 57, 241 лінія, 5 128,8 м (Том 3 КМ). Лага до блока — болт M8×20 із шайбою DIN 9021 у муфту.');
  const g48=lagGeo(4.8,HL), g24=lagGeo(2.4,HL);
  const LPI48=LP.map((p,i)=>i).filter(i=>LP[i].L>3), LPI24=LP.map((p,i)=>i).filter(i=>LP[i].L<=3);
  const lagMv48=T.up(new Mover([[g48,MM.lagS]],LPI48.length,R,{arc:1.2})), lagMv24=T.up(new Mover([[g24,MM.lagS]],LPI24.length,R,{arc:1.2}));
  const lMv=i=>{ const a=LPI48.indexOf(i); return a>=0?[lagMv48,a]:[lagMv24,LPI24.indexOf(i)]; };
  const lpIdx=new Map(); LPI48.forEach((p,k)=>lpIdx.set(p,[lagMv48,k])); LPI24.forEach((p,k)=>lpIdx.set(p,[lagMv24,k]));
  const boltGeo=gMerge([gTint(gC(0.012,0.002,10,'y',0,HL+LT+0.001,0),0xaeb4b9),gTint(gHex(0.013,0.0053,'y',0,HL+LT+0.002+0.00265,0),0x8f979d)]);
  const boltMv=T.up(new Mover([[boltGeo,MM.vc]],NB,R,{mode:'drop',drop:0.06,spin:Math.PI*8,cast:false,fl:0.4}));
  let tLag0=0, dLP=-1;
  { const t0=T.t; tLag0=t0;
    // демо-шматок: на лінії DL, що накриває демо-блок
    dLP=LP.findIndex(p=>p.l===DL&&DBk.Y>=p.y0-1e-6&&DBk.Y<=p.y1+1e-6);
    const DLPc=(LP[dLP].y0+LP[dLP].y1)/2;
    // 3.1 зразок над демо-рядом: шматок 4 800 і 2 400, перфорація; вставка — болт M8×20 + DIN 9021 крізь паз лаги в муфту блока
    const g=grp_(R); g.visible=false; const SF=frm(DX,DLPc,0); g.matrixAutoUpdate=false;
    const l48=mesh_(lagGeo(4.8,0),MM.lagS,g), l24=mesh_(lagGeo(2.4,0),MM.lagS,g); l48.position.set(0,0.75,0); l24.position.set(0.28,0.75,-1.2);
    const P=[{nm:'Лага 41×41×1,5, шматок 4 800',sz:'на 2 модулі; отвори Ø10,5 через 100 мм',m:4.8*1.744,q:N48,o:l48,ex:[0,0.25,0]},{nm:'Лага 41×41×1,5, шматок 2 400',sz:'останній при непарній кількості модулів',m:2.4*1.744,q:N24,o:l24,ex:[0.25,0.1,0]}];
    const ins=grp_(R); ins.visible=false; ins.matrixAutoUpdate=false; const IF=frm(DBk.X,DBk.Y,0);
    const ib=grp_(ins); mesh_(gHex(0.013,0.0053,'y',0,0.0027,0),MM.hw,ib); mesh_(gC(0.004,0.02,12,'y',0,-0.01,0),MM.thr,ib); const iw=mesh_(gRing(0.012,0.0042,0.002,'y',0,0,0,16),MM.a2,ins);
    const insB=grp_(R); insB.visible=false; insB.matrixAutoUpdate=false; mesh_(partGeoR('block1',0.025),MM.concX,insB,false); mesh_(partGeoR('mat1',0.025),MM.mat,insB); { const m=grp_(insB); mesh_(gHex(0.013,0.03,'y',0,0.048,0),MM.yz,m); mesh_(gHex(0.013,0.0053,'y',0,0.0057,0),MM.hw,m); mesh_(gC(0.004,0.035,10,'y',0,0.026,0),MM.thr,m); }
    const stub=mesh_(lagGeo(0.7,HL),MM.lagSX,insB,false);
    const sh=T.shot(11,{title:'Зразок: лага і кріплення до блока',text:'Шматки 4 800 і 2 400 з перфорацією — без різання. Лага лягає пазом догори; болт M8×20 із шайбою DIN 9021 проходить крізь паз у муфту блока.',
      parts:P.concat([{nm:'Болт M8×20 DIN 933 + шайба DIN 9021',sz:'крізь паз лаги в муфту блока',m:0.0178,q:NB,o:ib,ex:null}]),
      kv:[['Шматків','1 040 × 4 800 + 57 × 2 400','П'],['Разом','5 128,8 м · 1,744 кг/м','П'],['Ліній','241','П'],['Болтів M8×20 + DIN 9021',nf(NB),'П']],
      cam:u=>u<0.6?{tgt:new V3().setFromMatrixPosition(SF).add(V(0,0.85,0)).add(V(0,0,-1.6)),az:lerp(0.35,0.95,s5(u/0.6)),el:0.38,dist:lerp(2.6,2.2,u),fov:36}:{tgt:new V3().setFromMatrixPosition(IF).add(V(0,0.08,0)),az:lerp(0.9,1.5,s5((u-0.6)/0.4)),el:0.55,dist:0.7,fov:34},slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t0+6.6,parts:P,la:sh.t0+3.4,lb:sh.t0+5.6,root:g});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t0+6.6; g.visible=on; if(on){ explode(P,t,sh.t0+2.4,sh.t0+5.2); g.matrix.copy(SF); g.matrixWorldNeedsUpdate=true; need=true; }
      const on2=t>=sh.t0+6.4&&t<sh.t1+0.1; ins.visible=insB.visible=on2; if(on2){ const v=s5((t-sh.t0-7.4)/2.4); ins.matrix.copy(IF).multiply(T_(0,HL+LT+0.002+0.06*(1-v),0)); ib.rotation.y=-(1-v)*Math.PI*8; ins.matrixWorldNeedsUpdate=true; insB.matrix.copy(IF); insB.matrixWorldNeedsUpdate=true; stub.position.y=0.25*(1-s5((t-sh.t0-6.5)/0.8)); need=true; } }));
    { const [mv,i]=bMv(dB); mv.hideI=mv.hideI||new Map(); mv.hideI.set(i,[sh.t0+6.4,sh.t1+0.1]); }
    // 3.2 пачки по західному і східному краях (шматки вздовж ліній — орієнтація зберігається в польоті); скільки в пачці — немає в даних
    const pts=LP.map((p,i)=>[p.X,(p.y0+p.y1)/2]);
    const LPAL=makePallets(pts,40,['W','E'],4.9); let lp0=0; { let bd=1e9; LPAL.forEach((p,k)=>{ const d=Math.abs(p.Y-(LP[dLP].y0+LP[dLP].y1)/2)+(p.e==='E'?0:1000); if(d<bd){ bd=d; lp0=k; } }); }
    { const P_=LPAL[lp0]; const j=P_.items.indexOf(dLP); if(j>0){ P_.items.splice(j,1); P_.items.unshift(dLP); } else if(j<0){ LPAL.forEach(p=>{ const q=p.items.indexOf(dLP); if(q>=0) p.items.splice(q,1); }); P_.items.unshift(dLP); } }
    const LPS=sortPallets(LPAL,lp0); const lPal=T.up(new Pals([[bearersGeo(4.8),MM.wood]],LPS.length,R)); lPal.drop=0.6; lagMv48.P=lagMv24.P=lPal;
    const t2=T.t; LPS.forEach((p,k)=>{ lPal.R[k]=palMat(p,'z'); lPal.a[k]=t2+0.2+k/LPS.length*3.2; });
    T.shot(4,{title:'Пачки лаг по краях',text:'Пачки — уздовж західного і східного країв: шматок летить, зберігаючи орієнтацію вздовж своєї лінії.',nd:'Скільки шматків у пачці — немає в даних (у моделі — умовно).',
      kv:[['Пачок у моделі',nf(LPS.length),'О'],['Шматків у пачці',ND,'']],cam:u=>({tgt:V(50,6,-48),az:lerp(1.45,1.2,s5(u)),el:0.7,dist:140,fov:38})});
    // 3.3 перший шматок з пачки на блоки демо-ряду; болти крутяться в муфти; 3.4 усі фронти
    const t3=T.t, t4=t3+8, S4=t4+0.3, D4=8.4;
    LPS.forEach((p,k)=>{ const n=p.items.length; let last=0;
      p.items.forEach((pi,r)=>{ const q=n-1-r, layer=Math.floor(q/8), cc=q%8, [mv,i]=lpIdx.get(pi);
        mv.slot[i]=T_(-0.16+cc*0.046,0.12-HL+layer*0.043,0); mv.pal[i]=k; mv.F[i]=frm(LP[pi].X,(LP[pi].y0+LP[pi].y1)/2,0);
        let ts,td; if(pi===dLP){ ts=t3+0.6; td=2.6; } else { td=0.75*(0.85+0.3*hsh(pi)); const rr=k===0?r-1:r; ts=S4+(rr/40)*(D4-1.2)+0.3*(hsh(pi*5)-0.5)*(D4/40); }
        mv.ts[i]=ts; mv.td[i]=td; mv.arc[i]=Math.min(1.5,0.9+0.03*Math.hypot(p.X-LP[pi].X,p.Y-(LP[pi].y0+LP[pi].y1)/2)); last=Math.max(last,ts+td); });
      lPal.v[k]=last+0.25; });
    lagMv48.times(); lagMv24.times();
    // болти M8×20: коли лягла лага над блоком (крайні профілі — на етапі 5)
    const lagLand=i=>{ const [mv,k]=lpIdx.get(i); return mv.ts[k]+mv.td[k]; };
    BL.forEach((b,i)=>{ boltMv.F[i]=frm(b.X,b.Y,0); if(b.k===2){ boltMv.ts[i]=1e9; return; } const pi=LP.findIndex(p=>p.l===b.l&&b.Y>=p.y0-0.01&&b.Y<=p.y1+0.01); const tl=pi>=0?lagLand(pi):S4+D4;
      boltMv.ts[i]=pi===dLP?tl+0.25+0.55*Math.abs(b.Y-DBk.Y)/2.4:tl+0.15+0.5*hsh(i); boltMv.td[i]=pi===dLP?1.1:0.45; });
    T.fx([t3+3.2],'tuk');
    T.shot(8,{title:'Перший шматок на демо-ряд',text:'Шматок 4 800 з пачки по дузі — на блоки демо-ряду. Болти M8×20 крутяться в муфти: 3–5 обертів.',
      cam:u=>({tgt:roofP(lerp(DX+3,DX,s5(u/0.5)),(LP[dLP].y0+LP[dLP].y1)/2+lerp(0,-1.2,u),0.3),az:lerp(1.75,2.05,s5(u)),el:lerp(0.5,0.6,u),dist:lerp(9,5.5,s5(u)),fov:38}),slow:true});
    T.shot(9,{title:'Усі лінії лаг',text:'Шматки з усіх пачок одночасно, від країв до середини. Розмітка під лагами зникає.',cam:u=>({tgt:V(50,6,-48),az:lerp(0.95,1.35,s5(u)),el:0.68,dist:132,fov:38}),mus:'drive'});
    T.up(new VAct([cordR.o],-1,S4+D4));
    const lagLen=t=>{ let s=0; [lagMv48,lagMv24].forEach((mv,w)=>{ s+=mv.placed(t)*(w?2.4:4.8); }); return s; };
    T.counter({nm:'Лаги, м',tot:5128.8,n:t=>Math.round(lagLen(t)*10)/10,mf:t=>lagLen(t)*1.744,g:'met',unit:'м',note:`шматки 4 800 × ${N48} + 2 400 × ${N24}`});
    T.counter({nm:'Болти M8×20 + шайба DIN 9021',tot:NB,n:t=>boltMv.placed(t),m:0.0178,g:'met',note:'848 — під крайні профілі, на етапі 5'}); }
  boltMv.times();


  // ===== акт 4. Гільзи і шпильки
  T.act('sl','Гільзи і шпильки','Гільза П 45,5×35×2, L 200 з привареною муфтою M10×50 — під кожним стиком модулів (бере і стик шматків лаги), 2 болти M10×60 з трубкою крізь лагу; шпилька M10 права/ліва між муфтами сусідніх лаг стягує лаги (Том 3 КМ).');
  const YC=HL-0.002-0.0085, YR=HL+0.0205;
  const GU=(()=>{ const a=0.02075, b=a+0.002, y0=HL-0.002, y1=y0+0.035; return [[-b,y0],[b,y0],[b,y1],[a,y1],[a,HL],[-a,HL],[-a,y1],[-b,y1]]; })();
  const slBolts=z=>[gTint(gHex(0.017,0.0064,'x',0.0272,YR,z),0xaeb4b9),gTint(gHex(0.017,0.008,'x',-0.0285,YR,z),0xaeb4b9)];
  const slGeo=gMerge([gTint(gProf(GU,0.2),0xc59a38),gTint(gHex(0.017,0.05,'x',0,YC,0),0xb4892a),gTint(gB(0.022,0.0012,0.008,-0.012,YC-0.0086,0),0xc2410c),
    gTint(gHex(0.017,0.008,'x',0.029,YC,0),0xaeb4b9),gTint(gHex(0.017,0.008,'x',-0.029,YC,0),0xd9822b),...slBolts(-0.05),...slBolts(0.05)]);
  const rodGeo=gC(0.005,1,8,'x',0,0,0);
  const NSL=OD.sl.length, NROD=OD.rods.length;
  const crG=crateGeo(0.8,0.6,0.32), crR=crateGeo(1.42,0.42,0.22);
  const slMv=T.up(new Mover([[slGeo,MM.vc]],NSL,R,{arc:1.0,cast:false})), rodMv=T.up(new Mover([[rodGeo,MM.steelD]],NROD,R,{arc:1.1,cast:false,bc:OD.rods.map(r=>r[3]===2?lc(0xe0782b).multiplyScalar(2.2):WHITE)}));
  const rodM=r=>{ const xa=LX(r[0])+0.025, xb=LX(r[1])-0.025, za=roofZ(xa)+YC, zb=roofZ(xb)+YC, a=Math.atan2(zb-za,xb-xa); return new M4().compose(W((xa+xb)/2,r[2],(za+zb)/2),new Q().setFromAxisAngle(ZA,a),V(Math.hypot(xb-xa,zb-za),1,1)); };
  let tSl1=0;
  { const t0=T.t;
    // 4.1 зразок на демо-стику: «рентген» лаги, гільза наїжджає знизу, болти M10×60 з трубками, шпилька вкручується і стягує лаги
    const SF=frm(DX,DS[1],0), SJ=frm(DXJ,DS[1],0), g=grp_(R), gj=grp_(R); g.visible=gj.visible=false; g.matrixAutoUpdate=gj.matrixAutoUpdate=false;
    const mk=(par)=>{ const o={}; o.sl=mesh_(gProf(GU,0.2),MM.yz,par); o.cp=mesh_(gHex(0.017,0.05,'x',0,YC,0),MM.yz,par); mesh_(gB(0.022,0.0012,0.008,-0.012,YC-0.0086,0),MM.lh,o.cp);
      o.b=[-0.05,0.05].map(z=>{ const b=grp_(par,0,YR,z); mesh_(gC(0.005,0.066,12,'x',-0.002,0,0),MM.thr,b); mesh_(gHex(0.017,0.0064,'x',0.0272,0,0),MM.a2,b); const tb=mesh_(gRing(0.007,0.00525,0.038,'x',0,0,0,14),MM.gray,par); tb.position.set(0,YR,z); const nt=mesh_(gHex(0.017,0.008,'x',-0.0285,0,0),MM.a2,par); nt.position.set(0,YR,z); return {b,tb,nt}; });
      o.jr=mesh_(gHex(0.017,0.008,'x',0.029,YC,0),MM.a2,par); o.jl=mesh_(gHex(0.017,0.008,'x',-0.029,YC,0),MM.lhn||MM.rodP,par); return o; };
    const A=mk(g), B=mk(gj);
    const span=new V3().setFromMatrixPosition(SJ).sub(new V3().setFromMatrixPosition(SF)).length()-0.05;
    const rod=grp_(g,0.025,YC,0); const rodC=mesh_(gC(0.0046,1.299,14,'x',1.299/2,0,0),MM.thrR,rod);
    const P=[{nm:'Гільза П 45,5×35×2, L 200',sz:'знизу на лагу; бере і стик шматків лаги',m:0.42,q:NSL,o:A.sl},{nm:'Муфта M10×50 приварена',sz:'половина — ліва різьба (помаранчева мітка)',m:null,q:NSL,o:A.cp},
      {nm:'Болт M10×60 + трубка 14×1,75×38',sz:'2 на гільзу, крізь заводські бічні отвори лаги',m:0.0409,q:NSL*2,o:A.b[1].b},{nm:'Шпилька M10 1 299',sz:'права різьба із заходу, ліва — зі сходу',m:null,q:NROD,qs:'1 561 + 70 через прохід',o:rodC},
      {nm:'Гайки M10 права / ліва',sz:'контргайки біля муфт',m:0.0102,q:4893,qs:'3 262 + 1 631',o:A.jr}];
    const sh=T.shot(14,{title:'Зразок: гільза, болти і шпилька на демо-стику',text:'Лага напівпрозора («рентген»). Гільза наїжджає знизу, 2 болти M10×60 з трубками входять крізь лагу. Шпилька вкручується в муфти сусідніх лаг: обертання стягує обидві лаги.',parts:P,
      kv:[['Гільз','1 895 (856 на стиках шматків)','П'],['Болтів M10×60','3 790','П'],['Шпильок','1 561 + через прохід 29 / 15 / 26','П'],['Гайки','праві 3 262, ліві 1 631','П']],
      cam:u=>{ const a=new V3().setFromMatrixPosition(SF), b=new V3().setFromMatrixPosition(SJ); return u<0.66?{tgt:a.clone().add(V(0.02,0.07,0)),az:lerp(0.85,1.75,s5(u/0.66)),el:0.38,dist:lerp(0.8,0.65,u),fov:34}:{tgt:a.clone().lerp(b,0.5).add(V(0,0.06,0)),az:lerp(0.55,0.35,s5((u-0.66)/0.34)),el:lerp(0.45,0.62,s5((u-0.66)/0.34)),dist:lerp(0.9,1.6,s5((u-0.66)/0.34)),fov:36}; },slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+9.6,lb:sh.t1-0.2,root:g});
    tSl1=sh.t1;
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=gj.visible=on; const Lm=[lagMv48,lagMv24].map(m=>m.ims[0].material);
      Lm.forEach(m=>{ const x=on&&t>sh.t0+2.4&&t<sh.t1-0.6; if(m.userData.xr!==x){ m.userData.xr=x; m.transparent=x; m.opacity=x?0.3:1; m.alphaTest=x?0.12:0.5; m.depthWrite=!x; m.needsUpdate=true; } });
      if(!on) return; const u=t-sh.t0-2.2;
      [[g,SF,A,0],[gj,SJ,B,0.6]].forEach(([G_,F_,o,dl])=>{ G_.matrix.copy(F_); G_.matrixWorldNeedsUpdate=true; const v=s5((u-0.4-dl)/1.4); o.sl.position.y=-0.09*(1-v); o.cp.position.y=-0.09*(1-v);
        o.b.forEach((q,k)=>{ const w=s5((u-2.0-dl-k*0.5)/1.2); q.b.position.x=0.09*(1-w); q.b.rotation.x=-(1-w)*Math.PI*8; q.tb.visible=w>0.02; q.nt.position.x=-0.06*(1-s5((u-3.0-dl-k*0.4)/0.8)); q.nt.visible=u>2.8+dl; });
        o.jr.visible=o.jl.visible=u>5.2; });
      const w=s5((u-4.6)/2.6); rod.position.x=0.025+(-0.35)*(1-w); rod.rotation.x=-w*Math.PI*10; rod.visible=u>4.2; need=true; }));
    slMv.hideI=new Map([[dSl,[0,sh.t1-0.05]],[dSlJ,[0,sh.t1-0.05]]]); rodMv.hideI=new Map([[dRod,[0,sh.t1-0.05]]]);
    // 4.2 перші 3 стики вздовж ряду; 4.3 усі фронти; ящики по периметру
    const t2=T.t, t3=t2+6, S3=t3+0.3, D3=11;
    const SPAL=makePallets(OD.sl.map((s,i)=>i===dSl||i===dSlJ?null:[LX(s[0]),s[1]]),120,['W','E','S','N'],0.8), RPAL=makePallets(OD.rods.map((r,i)=>i===dRod?null:[(LX(r[0])+LX(r[1]))/2,r[2]]),120,['W','E','S','N'],1.42);
    const nearE=(L,X,Y)=>{ let b=0,bd=1e9; L.forEach((p,k)=>{ const d=Math.hypot(p.X-X,p.Y-Y)+(p.e==='E'?0:1000); if(d<bd){ bd=d; b=k; } }); return b; };
    const SP=sortPallets(SPAL,nearE(SPAL,DX,DS[1])), RP_=sortPallets(RPAL,nearE(RPAL,DX,DS[1]));
    // зсунути ящики шпильок уздовж краю, щоб не стали на ящики гільз
    RP_.forEach(p=>{ if(p.e==='W'||p.e==='E') p.Y=Math.min(93.4,p.Y+1.25); else p.X=Math.min(93.4,p.X+1.25); });
    const sPal=T.up(new Pals([[crG,MM.wood]],SP.length,R)), rPal=T.up(new Pals([[crR,MM.wood]],RP_.length,R)); slMv.P=sPal; rodMv.P=rPal;
    SP.forEach((p,k)=>{ sPal.R[k]=palMat(p,'x'); sPal.a[k]=t2+0.1+k/SP.length*2.5; }); RP_.forEach((p,k)=>{ rPal.R[k]=palMat(p,'x'); rPal.a[k]=t2+0.3+k/RP_.length*2.5; });
    const near3=OD.sl.map((s,i)=>i).filter(i=>OD.sl[i][0]===DL&&i!==dSl).sort((a,b)=>Math.abs(OD.sl[a][1]-DS[1])-Math.abs(OD.sl[b][1]-DS[1])).slice(0,3);
    const first=new Map(near3.map((i,k)=>[i,k]));
    SP.forEach((p,k)=>{ const n=p.items.length; let last=0; p.items.forEach((si,r)=>{ const q=n-1-r, layer=Math.floor(q/24), cc=q%24; slMv.slot[si]=T_(-0.3+(cc%6)*0.12,0.03-HL+layer*0.05,-0.2+Math.floor(cc/6)*0.13).multiply(Ry(Math.PI/2)); slMv.pal[si]=k;
        let ts,td; if(first.has(si)){ ts=t2+1.2+first.get(si)*1.5; td=1.3; } else { td=0.62*(0.85+0.3*hsh(si)); ts=S3+(r/120)*(D3*0.62)+0.25*(hsh(si*3)-0.5); } slMv.ts[si]=ts; slMv.td[si]=td; last=Math.max(last,ts+td); }); sPal.v[k]=last+0.3; });
    OD.sl.forEach((s,i)=>{ slMv.F[i]=frm(LX(s[0]),s[1],0); }); slMv.ts[dSl]=slMv.ts[dSlJ]=sh.t1-0.06; slMv.td[dSl]=slMv.td[dSlJ]=0.01;
    RP_.forEach((p,k)=>{ const n=p.items.length; let last=0; p.items.forEach((ri,r)=>{ const q=n-1-r, layer=Math.floor(q/30), cc=q%30; rodMv.slot[ri]=T_(0,0.03+layer*0.011,-0.17+cc*0.0115).multiply(new M4().makeScale(1.299,1,1)); rodMv.pal[ri]=k;
        const ts=S3+D3*0.3+(r/120)*(D3*0.62)+0.25*(hsh(ri*7)-0.5), td=0.7*(0.85+0.3*hsh(ri)); rodMv.ts[ri]=ts; rodMv.td[ri]=td; last=Math.max(last,ts+td); }); rPal.v[k]=last+0.3; });
    OD.rods.forEach((r,i)=>{ rodMv.F[i]=rodM(r); }); rodMv.ts[dRod]=sh.t1-0.06; rodMv.td[dRod]=0.01;
    // перші 3 стики: шпильки за гільзами
    near3.forEach((si,k)=>{ const s=OD.sl[si], ri=OD.rods.findIndex(r=>r[0]===DL&&Math.abs(r[2]-s[1])<0.01); if(ri>=0&&ri!==dRod){ rodMv.ts[ri]=t2+2.2+k*1.5; rodMv.td[ri]=1.2; }
      const sj=OD.sl.findIndex(x=>x[0]===DJ&&Math.abs(x[1]-s[1])<0.01); if(sj>=0){ slMv.ts[sj]=t2+1.5+k*1.5; slMv.td[sj]=1.2; } });
    slMv.times(); rodMv.times();
    T.shot(6,{title:'Перші три стики',text:'Гільзи — з ящиків біля пачок, шпильки — за гільзами. Права різьба — із заходу, ліва — зі сходу.',
      cam:u=>({tgt:roofP((DX+DXJ)/2,DS[1]-1.2-u*2.2,0.2),az:lerp(2.0,2.35,s5(u)),el:0.62,dist:6.5,fov:38}),slow:true});
    T.shot(11,{title:'Усі фронти',text:'Гільзи і шпильки з ящиків по периметру — з усіх боків до середини. Помаранчеві — шпильки через прохід на гребені.',cam:u=>({tgt:V(50,6,-48),az:lerp(1.35,0.95,s5(u)),el:0.78,dist:lerp(115,128,u),fov:38}),mus:'drive'});
    T.counter({nm:'Гільзи 200 з муфтою M10×50',tot:NSL,n:t=>slMv.placed(t),m:0.42,g:'met'}); T.counter({nm:'Болти M10×60 з трубкою',tot:NSL*2,n:t=>slMv.placed(t)*2,m:0.0409,g:'met'});
    T.counter({nm:'Шпильки M10',tot:NROD,n:t=>rodMv.placed(t),note:'1 561 + 70 через прохід (помаранчеві); маси шпильки в паспортах немає'}); T.counter({nm:'Гайки M10 праві + ліві',tot:4893,n:t=>Math.round(rodMv.placed(t)*3),m:0.0102,g:'met'}); }

  // ===== акт 5. Крайні профілі й анкери
  T.act('xp','Крайні профілі й анкери','На краю кожного ряду лаги зв\'язує крайній профіль 41×41 ≈1 263 на кутниках 160/150 t = 8; під профілем — 2 блоки без мата. Анкери від сповзання — на верхній лазі рядів уздовж ліхтарів (Том 3 КМ).');
  const NXP=OD.xp.length;
  const xpGeo=lagGeo(1,0).rotateY(Math.PI/2);
  const angGeo=gMerge([gB(0.008,0.037,0.16,0.004,HL+0.0205,0.08),gB(0.15,0.037,0.008,0.075,HL+0.0205,0.004)]);
  const xpMv=T.up(new Mover([[xpGeo,MM.lagS]],NXP,R,{arc:1.1})), angMv=T.up(new Mover([[angGeo,MM.hw]],NXP*2,R,{mode:'drop',drop:0.12,cast:false}));
  const anGeo=gMerge([gTint(gC(0.06,0.012,16,'y',0,0.006,0),0x6d757b),gTint(gC(0.012,0.16,10,'y',0,0.08,0),0x8a3b2a),gTint(gHex(0.019,0.01,'y',0,0.165,0),0xaeb4b9)]);
  const anMv=T.up(new Mover([[anGeo,MM.vc]],OD.an.length,R,{mode:'pop'}));
  const xpM=x=>{ const xa=LX(x[0])+0.0295, xb=LX(x[1])-0.0295, za=roofZ(xa)+HL, zb=roofZ(xb)+HL, a=Math.atan2(zb-za,xb-xa); return new M4().compose(W((xa+xb)/2,x[2],(za+zb)/2-0.0),new Q().setFromAxisAngle(ZA,a),V(Math.hypot(xb-xa,zb-za),1,1)); };
  const angM=(x,side)=>{ const l=side?x[1]:x[0], xs=side?-1:1, dir=x[3]; const th=xs>0?(dir>0?0:Math.PI/2):(dir>0?-Math.PI/2:Math.PI); return frm(LX(l),x[2],0).multiply(T_(xs*0.0205,0,dir*0.0205)).multiply(Ry(th)); };
  { const t0=T.t;
    const SF=frm(DX,DXP[2],0), g=grp_(R); g.visible=false; g.matrixAutoUpdate=false; const w=new V3().setFromMatrixPosition(frm(DXJ,DXP[2],0)).sub(new V3().setFromMatrixPosition(SF)).length();
    const pr=mesh_(lagGeo(w-0.059,0).rotateY(Math.PI/2),MM.lagS,g); pr.position.set(w/2,HL,0);
    const an1=mesh_(angGeo.clone(),MM.hw,g); an1.applyMatrix4(T_(0.0205,0,DXP[3]*0.0205).multiply(Ry(DXP[3]>0?0:Math.PI/2))); const an2=mesh_(angGeo.clone(),MM.hw,g); an2.applyMatrix4(T_(w-0.0205,0,DXP[3]*0.0205).multiply(Ry(DXP[3]>0?-Math.PI/2:Math.PI)));
    const b70=grp_(g); [0.0,w].forEach((x,k)=>{ const s=k?-1:1; mesh_(gC(0.005,0.07,12,'x',x+s*0.012,YR,DXP[3]*0.09),MM.thr,b70); mesh_(gHex(0.017,0.0064,'x',x+s*0.048,YR,DXP[3]*0.09),MM.a2,b70); });
    const b60=grp_(g); [0.0,w].forEach((x,k)=>{ const s=k?-1:1; [0.06,0.12].forEach(dx=>{ mesh_(gC(0.005,0.06,12,'z',x+s*dx,YR,DXP[3]*0.005),MM.thr,b60); mesh_(gHex(0.017,0.0064,'z',x+s*dx,YR,DXP[3]*0.034),MM.a2,b60); }); });
    const xbs=BL.map((b,i)=>i).filter(i=>BL[i].k===2&&Math.abs(BL[i].Y-DXP[2])<0.4&&BL[i].X>DX&&BL[i].X<DXJ);
    const P=[{nm:'Профіль крайній 41×41×1,5',sz:'≈1 263; верх — на рівні верху лаг',m:1.263*1.744,q:NXP,qs:'424 + 30 через прохід',o:pr,ex:[0,0.2,0]},{nm:'Кутник 160/150 t = 8',sz:'2 на профіль',m:0.7,q:NXP*2,o:an1,ex:[0,0.12,DXP[3]*0.06]},
      {nm:'Болт M10×70 крізь кутник і лагу',sz:'+ гайка',m:null,q:1128,o:b70,ex:[0,0.07,DXP[3]*0.12]},{nm:'Болт M10×60 крізь кутник і профіль',sz:'+ гайка',m:0.0409,q:1816,o:b60,ex:[0,0.1,DXP[3]*0.18]}];
    const sh=T.shot(10,{title:'Зразок: край ряду',text:'Профіль 41×41 між лагами на кутниках 160/150 t = 8; під ним — 2 блоки без мата (розкладені на етапі баласту), болти M8×20 у їхні муфти.',parts:P,nd:'Анкер від сповзання: тип і кріплення — після обстеження покрівлі (немає в даних).',
      kv:[['Профілів','424 ≈1 263 + 30 через прохід (530 / 760 / 1 540)','П'],['Кутників','908','П'],['Блоків під профілями','848 без мата','П'],['Анкерів','194 (162 уздовж ліхтарів, 32 біля гребеня)','П']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(SF).lerp(new V3().setFromMatrixPosition(frm(DXJ,DXP[2],0)),0.35).add(V(0,0.1,0)),az:lerp(DXP[3]>0?2.3:0.75,DXP[3]>0?2.95:1.4,s5(u)),el:0.55,dist:lerp(1.6,1.9,u),fov:36}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+4.2,lb:sh.t1-1.0,root:g});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=on; if(!on) return; g.matrix.copy(SF); g.matrixWorldNeedsUpdate=true; explode(P,t,sh.t0+2.6,sh.t1-2.6,0.2); need=true; }));
    const t2=T.t, S2=t2+0.4, D2=11.0;
    // профілі — з ящиків гільз (уже стоять); кутники за профілем; анкери — на місці
    const ord=OD.xp.map((x,i)=>i).sort((a,b)=>{ const ea=Math.min(LX(OD.xp[a][0]),96.6-LX(OD.xp[a][0]),OD.xp[a][2],96.6-OD.xp[a][2]), eb=Math.min(LX(OD.xp[b][0]),96.6-LX(OD.xp[b][0]),OD.xp[b][2],96.6-OD.xp[b][2]); return ea-eb; });
    ord.forEach((xi,k)=>{ const x=OD.xp[xi]; xpMv.F[xi]=xpM(x); let ts=xi===dXp?sh.t1-0.05:S2+(k/NXP)*(D2-1.4)+0.2*(hsh(xi)-0.5), td=xi===dXp?0.01:0.7; xpMv.ts[xi]=ts; xpMv.td[xi]=td; xpMv.pal[xi]=-1;
      [0,1].forEach(sd=>{ angMv.F[xi*2+sd]=angM(x,sd); angMv.ts[xi*2+sd]=xi===dXp?ts:ts-0.25; angMv.td[xi*2+sd]=xi===dXp?0.01:0.3; }); });
    xpMv.mode='drop'; xpMv.drop=0.35;
    // болти M8×20 у блоки під профілем — коли ліг профіль
    BL.forEach((b,i)=>{ if(b.k!==2) return; let xi=-1,bd=1e9; OD.xp.forEach((x,j)=>{ if(Math.abs(x[2]-b.Y)<0.45&&b.X>LX(x[0])&&b.X<LX(x[1])){ const d=Math.abs(x[2]-b.Y); if(d<bd){ bd=d; xi=j; } } }); boltMv.ts[i]=xi>=0?xpMv.ts[xi]+xpMv.td[xi]+0.1+0.3*hsh(i):S2+D2; boltMv.td[i]=0.4; });
    const oa=OD.an.map((a,i)=>i).sort((a,b)=>LX(OD.an[b][0])-LX(OD.an[a][0])); oa.forEach((ai,k)=>{ const a=OD.an[ai]; anMv.F[ai]=frm(LX(a[0])+0.12,a[1],0); anMv.ts[ai]=S2+2+(k/oa.length)*(D2-3.5); anMv.td[ai]=0.5; });
    xpMv.times(); angMv.times(); anMv.times(); boltMv.times();
    T.shot(12,{title:'Усі краї рядів',text:'Профілі на кутниках по всіх краях рядів; анкери від сповзання — на верхній лазі рядів біля ліхтарів.',nd:'Тип анкера — після обстеження покрівлі (немає в даних), показано умовно.',
      cam:u=>({tgt:V(48,6,-48),az:lerp(0.7,1.15,s5(u)),el:0.82,dist:122,fov:38}),mus:'drive'});
    T.counter({nm:'Крайні профілі',tot:NXP,n:t=>xpMv.placed(t),m:1.263*1.744,g:'met',note:'424 + 30 через прохід'}); T.counter({nm:'Кутники 160/150 t = 8',tot:NXP*2,n:t=>angMv.placed(t),m:0.7,g:'met'});
    T.counter({nm:'Анкери від сповзання',tot:OD.an.length,n:t=>anMv.placed(t),note:'тип — після обстеження'}); }

  // ===== акт 6. Щити PV 7/1
  T.act('box','Щити PV 7/1','26 щитів PV 7/1: 23 на рамах 41×41 на 4 блоках на даху цеху, 3 на складі — кріплення на скаті не визначено (питання власнику).');
  const KC=k=>lc(KCOL[k]);
  const frameParts=()=>[gTint(gB(0.041,0.041,1.2,-0.25,HL+0.0205,0),0x9aa5ad),gTint(gB(0.041,0.041,1.2,0.25,HL+0.0205,0),0x9aa5ad),gTint(gB(0.041,0.9,0.041,-0.25,0.104+0.45,-0.13),0x9aa5ad),gTint(gB(0.041,0.9,0.041,0.25,0.104+0.45,-0.13),0x9aa5ad),
    gTint(gB(0.6,0.041,0.041,0,0.52,-0.089),0x9aa5ad),gTint(gB(0.6,0.041,0.041,0,0.88,-0.089),0x9aa5ad)];
  const bodyParts=y=>[gTint(gB(0.6,0.5,0.2,0,y,0),0xdfe4e8),gTint(gB(0.58,0.48,0.008,0,y,0.104),0xd3d8dc),gTint(gB(0.65,0.012,0.35,0,y+0.285,0.03),0xc9cfd4),gTint(gB(0.04,0.08,0.012,0.24,y,0.112),0x3a4045)];
  const boxGeoR=gMerge([...frameParts(),...bodyParts(0.70)]), boxGeoW=gMerge(bodyParts(0.0)), stripeG=gB(0.5,0.05,0.004,0,0.92,0.11), stripeW=gB(0.5,0.05,0.004,0,0.22,0.11);
  const RB=E.boxes.map((b,i)=>i).filter(i=>E.boxes[i].r), WB=E.boxes.map((b,i)=>i).filter(i=>!E.boxes[i].r);
  const boxF=b=>{ const z=surfZ(b.X,b.Y); return new M4().compose(W(b.X,b.Y,(z===null?0.3:z)),new Q(),ONE3); };
  const bxMv=T.up(new Mover([[boxGeoR,MM.vc]],RB.length,R,{mode:'drop',drop:1.6})), bxS=T.up(new Mover([[stripeG,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5})]],RB.length,R,{mode:'drop',drop:1.6,cast:false,bc:RB.map(i=>KC(E.boxes[i].K))}));
  const bwMv=T.up(new Mover([[boxGeoW,MM.vc]],WB.length,R,{mode:'drop',drop:1.2})), bwS=T.up(new Mover([[stripeW,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5})]],WB.length,R,{mode:'drop',drop:1.2,cast:false,bc:WB.map(i=>KC(E.boxes[i].K))}));
  const NFB=RB.length*4, NSUP=E.sup.length;
  const fbMv=T.up(new Mover([[blkGeoM,MM.vc]],NFB,R,{arc:1.0})), supMv=T.up(new Mover([[blkGeoM,MM.vc]],NSUP,R,{arc:1.0}));
  // палети під рами щитів і опори лотків: 16 по 60, по периметру
  const FS_PTS=[]; RB.forEach((bi,k)=>{ const b=E.boxes[bi]; [[-0.25,-0.45],[-0.25,0.45],[0.25,-0.45],[0.25,0.45]].forEach(([dx,dy])=>FS_PTS.push([b.X+dx,b.Y+dy])); }); E.sup.forEach(s=>FS_PTS.push([s[0],s[1]]));
  const FPAL=makePallets(FS_PTS,60,['W','E','S','N'],1.2); const fPal=T.up(new Pals([[palletGeo(1.2,0.8),MM.wood]],FPAL.length,R)); fbMv.P=fPal; supMv.P=fPal;
  { const t0=T.t; FPAL.forEach((p,k)=>{ fPal.R[k]=palMat(p,'x'); fPal.a[k]=t0+0.2+k/FPAL.length*1.6; });
    // 6.1 зразок на місці щита: блоки → опорні → стійки → поперечки → щит на 4 кронштейнах → двері → що всередині
    const DBF=boxF(DBX), g=grp_(R); g.visible=false; g.matrixAutoUpdate=false;
    const blks=[[-0.25,-0.45],[-0.25,0.45],[0.25,-0.45],[0.25,0.45]].map(([dx,dy])=>{ const m=mesh_(blkGeoM,MM.vc,g); m.position.set(dx,0,-dy); return m; });
    const rails=[-0.25,0.25].map(x=>mesh_(gB(0.041,0.041,1.2,x,HL+0.0205,0),MM.frame,g)), posts=[-0.25,0.25].map(x=>mesh_(gB(0.041,0.9,0.041,x,0.104+0.45,-0.13),MM.frame,g)), bars=[0.52,0.88].map(y=>mesh_(gB(0.6,0.041,0.041,0,y,-0.089),MM.frame,g));
    const bx=grp_(g,0,0.70,0); mesh_(gB(0.6,0.5,0.012,0,0,-0.094),MM.cab,bx); mesh_(gB(0.012,0.5,0.2,-0.294,0,0),MM.cab,bx); mesh_(gB(0.012,0.5,0.2,0.294,0,0),MM.cab,bx); mesh_(gB(0.6,0.012,0.2,0,0.244,0),MM.cab,bx); mesh_(gB(0.6,0.012,0.2,0,-0.244,0),MM.cab,bx);
    [[-0.27,0.2],[0.27,0.2],[-0.27,-0.2],[0.27,-0.2]].forEach(([x,y])=>mesh_(gB(0.03,0.04,0.03,x+Math.sign(x)*0.03,y,-0.12),MM.hw,bx));
    const door=grp_(bx,-0.3,0,0.1); mesh_(gB(0.6,0.5,0.012,0.3,0,0),MM.cab,door); mesh_(gB(0.5,0.05,0.004,0.3,0.22,0.008),new THREE.MeshStandardMaterial({color:KC(DBX.K)}),door); mesh_(gB(0.04,0.08,0.012,0.54,0,0.012),MM.dark,door);
    const inner=grp_(bx,0,0,-0.085); [0.12,-0.04].forEach(y=>mesh_(gB(0.5,0.035,0.008,0,y,0),MM.al,inner));
    const fus=grp_(inner); for(let i=0;i<14;i++){ const c=i%7, r=Math.floor(i/7); mesh_(gB(0.018,0.085,0.06,-0.21+c*0.036,0.12-r*0.16,0.03),MM.white,fus); mesh_(gB(0.012,0.02,0.002,-0.21+c*0.036,0.15-r*0.16,0.061),r?MM.black:MM.red,fus); }
    const sw=grp_(inner,0.19,0.1,0.035); mesh_(gB(0.075,0.11,0.07,0,0,0),MM.dark,sw); mesh_(gB(0.03,0.05,0.02,0,0,0.045),MM.red,sw);
    const spd=grp_(inner,0.19,-0.06,0.032); mesh_(gB(0.054,0.09,0.065,0,0,0),MM.white,spd); mesh_(gB(0.03,0.012,0.002,0,0.02,0.034),MM.green,spd);
    const mon=grp_(inner,0.0,-0.155,0.03); mesh_(gB(0.12,0.06,0.05,0,0,0),MM.blue,mon); const pe=mesh_(gB(0.3,0.015,0.015,-0.05,-0.215,0.01),MM.yellow,inner);
    const mc=grp_(bx,0,-0.27,0); for(let i=0;i<7;i++){ [-1,1].forEach(s=>mesh_(gC(0.009,0.05,10,'y',-0.18+i*0.06+s*0.012,0,0),s<0?MM.black:MM.dark,mc)); }
    const can=mesh_(gB(0.65,0.012,0.35,0,0.985,0.03),MM.frame,g);
    const HL_=[{o:mc,nm:'7 пар MC4 знизу',sz:'входи стрінгів XS1…XS7'},{o:fus,nm:'14 запобіжників gPV 32 А 10×38',sz:'на обох полюсах кожного стрінга'},{o:sw,nm:'Роз\'єднувач 2P ≥ 200 А DC-PV2',sz:''},{o:spd,nm:'ОПН PV тип 1+2',sz:'Ucpv ≥ 1 000 В, Up ≤ 4,0 кВ — F1 за Томом 7'},{o:mon,nm:'Контроль струму 8 кан. Modbus',sz:'адреса = вхід QF'},{o:pe,nm:'Шина PE',sz:''}];
    const P=[{nm:'Блок з матом під раму',sz:'4 на раму',m:13.4,q:NFB,o:blks[3]},{nm:'Рама 41×41×2,5 HDG',sz:'опорні 2 × 1 200, стійки 2 × 900, поперечки 2 × 600',m:14,q:RB.length,o:posts[1]},
      {nm:'Щит PV 7/1, IP66 ≥ 600 × 500 × 200',sz:'клас II, 4 кронштейни; низ +0,450, верх +0,950',m:null,q:E.boxes.length,o:bx},{nm:'Козирок 650 × 350',sz:'над щитом',m:1.3,q:E.boxes.length,o:can}].concat(HL_.map(h=>({nm:h.nm,sz:h.sz,m:null,q:null,o:h.o,hl:1})));
    const sh=T.shot(13.5,{title:'Зразок: щит PV 7/1 на рамі',text:'Збирання за кроками: 4 блоки → опорні 1 200 → стійки 900 → поперечки 600 → щит на 4 кронштейнах. Двері відчиняються; по черзі підсвічено, що всередині.',parts:P,
      kv:[['Входів','до 7 стрінгів × 11 модулів','Р'],['Uхх (−25 °C)','≤ 612,6 В','Р'],['Iмп / Iкз','122,6 / 129,6 А','Р'],['Вихід','Al 2 × 1×120…240 до ШВ','Р'],['Маса щита у зборі',ND,'']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(DBF).add(V(0,lerp(0.45,0.7,s5(u)),0)),az:lerp(0.15,-0.55,s5(u)),el:lerp(0.42,0.26,s5(u)),dist:lerp(2.9,1.75,s5(u)),fov:38}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+6.8,lb:sh.t1,root:g,hl:{t0:sh.t0+8.4,dt:0.8,list:P.filter(p=>p.hl)}});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=on; if(!on) return; g.matrix.copy(DBF); g.matrixWorldNeedsUpdate=true; const u=t-sh.t0-1.8;
      blks.forEach((m,i)=>{ const v=s5((u-0.2-i*0.18)/0.6); m.position.y=0.5*(1-v); m.visible=u>0.2+i*0.18; });
      rails.forEach((m,i)=>{ const v=s5((u-1.2-i*0.2)/0.7); m.position.y=0.4*(1-v); m.visible=u>1.2+i*0.2; }); posts.forEach((m,i)=>{ const v=s5((u-2.0-i*0.2)/0.7); m.position.y=0.5*(1-v); m.visible=u>2.0; });
      bars.forEach((m,i)=>{ const v=s5((u-2.7-i*0.2)/0.6); m.position.z=0.35*(1-v); m.visible=u>2.7; }); { const v=s5((u-3.4)/0.9); bx.position.z=0.5*(1-v); bx.visible=u>3.4; } can.visible=u>4.0; can.position.y=0.25*(1-s5((u-4.0)/0.6));
      door.rotation.y=-1.85*s5((u-5.2)/1.2)*(1-s5((u-11.0)/0.9)); need=true; }));
    // 6.2 решта 22 щити на дах: блоки з палет, далі рама зі щитом; колір смуги — контейнер; 6.3 — 3 щити складу
    const t2=T.t, t3=t2+8;
    const ordB=RB.map((bi,k)=>k).sort((a,b)=>angOf({X:E.boxes[RB[a]].X,Y:E.boxes[RB[a]].Y})-angOf({X:E.boxes[RB[b]].X,Y:E.boxes[RB[b]].Y}));
    RB.forEach((bi,k)=>{ const b=E.boxes[bi]; bxMv.F[k]=boxF(b); bxS.F[k]=boxF(b); const ts=bi===dBox?sh.t1-0.05:t2+0.9+ordB.indexOf(k)/RB.length*5.6; bxMv.ts[k]=bxS.ts[k]=ts+(bi===dBox?0:0.7); bxMv.td[k]=bxS.td[k]=bi===dBox?0.01:0.8; });
    // блоки під рами — з палет, за 0,7 с до рами
    const fpItem=new Map(); FPAL.forEach((p,k)=>p.items.forEach((it,r)=>fpItem.set(it,[k,r,p.items.length])));
    RB.forEach((bi,k)=>{ const b=E.boxes[bi]; [[-0.25,-0.45],[-0.25,0.45],[0.25,-0.45],[0.25,0.45]].forEach(([dx,dy],q)=>{ const i=k*4+q, it=fpItem.get(i); fbMv.F[i]=frm(b.X+dx,b.Y+dy,0);
      if(it){ const [pk,r,n]=it, qq=n-1-r; fbMv.pal[i]=pk; fbMv.slot[i]=T_(-0.45+(qq%4)*0.3,PAL_H+Math.floor(qq/8)*0.063,-0.15+Math.floor((qq%8)/4)*0.3); }
      fbMv.ts[i]=bi===dBox?sh.t1-0.05:bxMv.ts[k]-0.75+q*0.05; fbMv.td[i]=bi===dBox?0.01:0.6; }); });
    WB.forEach((bi,k)=>{ const b=E.boxes[bi]; const z=surfZ(b.X,b.Y); bwMv.F[k]=bwS.F[k]=new M4().compose(W(b.X,b.Y,(z===null?0.3:z)+0.45),new Q(),ONE3); bwMv.ts[k]=bwS.ts[k]=t3+1.2+k*0.9; bwMv.td[k]=bwS.td[k]=0.8; });
    T.shot(8,{title:'Щити на дах',text:'23 щити на рамах: колір смуги на дверях — контейнер, до якого йде лінія Al (K-1 синій, K-2 помаранчевий, K-3 зелений).',
      cam:u=>({tgt:V(52,8,-50).lerp(V(84,6,-26),s5((u-0.35)/0.65)),az:lerp(1.2,0.78,s5(u)),el:lerp(0.72,0.6,s5(u)),dist:lerp(105,108,u),fov:38}),mus:'drive'});
    T.shot(5,{title:'Щити на складі',text:'3 щити (ЩС-С1, С2, С3) — на скаті складу.',nd:'Кріплення щита на скаті складу не визначено (питання власнику, 26.10) — показано без кріплення.',
      cam:u=>({tgt:W(116,-15,6),az:lerp(0.5,0.78,s5(u)),el:0.5,dist:lerp(52,46,u),fov:38})});
    T.counter({nm:'Щити PV 7/1',tot:E.boxes.length,n:t=>bxMv.placed(t)+bwMv.placed(t),note:'23 на даху + 3 на складі'}); T.counter({nm:'Рами 41×41 на 4 блоках',tot:RB.length,n:t=>bxMv.placed(t),m:14,g:'el'});
    T.counter({nm:'Блоки з матом під рами',tot:NFB,n:t=>fbMv.placed(t),m:13.4,g:'blk'});
    // (fbMv.times() — після розкладу опор лотків, бо палети спільні)
    var fpItemS=fpItem; }


  // ===== акт 7. Лотки і опори
  T.act('tray','Лотки','Поза модулями кабелі йдуть у лотках з кришками на опорах «блок з матом + траверса 41×41»; фасонні, містки над ендовами, спуск по фасаду лотком 600×100 (дані лотків 26.10).');
  const trM=new M4(); const trNear=(X,Y)=>{ const d=E.desc; return Math.hypot(X-d[0],Y-d[1]); };
  const trayU=gMerge([gB(1,0.06,1,0,-0.47,0),gB(1,1,0.04,0,0,0.48),gB(1,1,0.04,0,0,-0.48)]), coverG=gB(1.0,0.04,1.06,0,0.52,0);
  const trayIM=[], coverIM=[], trayT=[], trayRev=[];
  let tTray0=0;
  { const t0=T.t; tTray0=t0;
    // 7.1 зразок: опора і лоток 100×50 з кришкою
    let si=-1,bd=1e9; E.sup.forEach((s,i)=>{ if(s[2]!==0) return; const d=Math.hypot(s[0]-DBX.X,s[1]-DBX.Y); if(d<bd&&d>2.5){ bd=d; si=i; } }); if(si<0) si=0;
    const s0=E.sup[si], SF=new M4().compose(W(s0[0],s0[1],surfZ(s0[0],s0[1])||HV),new Q(),ONE3); EP.trav.getMatrixAt(si,trM); trM.decompose(_v,_qa,_sa); const alongX=_sa.x<_sa.z; // траверса поперек лотка
    const g=grp_(R); g.visible=false; g.matrixAutoUpdate=false; const rot=alongX?Math.PI/2:0;
    const sp=grp_(g); mesh_(blkGeoM,MM.vc,sp); const tr=grp_(g); tr.rotation.y=rot; mesh_(gB(0.2,0.041,0.041,0,HL+0.0205,0),MM.trayD,tr); const bo=grp_(tr); mesh_(gHex(0.013,0.0053,'y',0,HL+0.044,0),MM.hw,bo); mesh_(gRing(0.012,0.0042,0.002,'y',0,HL+0.042,0,14),MM.a2,bo);
    const ly=grp_(g,0,0.104,0); ly.rotation.y=rot; const lt=grp_(ly); mesh_(gB(0.1,0.0015,1.5,0,0,0),MM.tray,lt); mesh_(gB(0.0015,0.05,1.5,-0.05,0.025,0),MM.tray,lt); mesh_(gB(0.0015,0.05,1.5,0.05,0.025,0),MM.tray,lt);
    const cbl=grp_(ly); mesh_(gC(0.004,1.5,8,'z',-0.025,0.006,0),MM.red,cbl); mesh_(gC(0.004,1.5,8,'z',-0.012,0.006,0),MM.black,cbl); mesh_(gC(0.0075,1.5,10,'z',0.02,0.009,0),MM.al,cbl); mesh_(gC(0.0075,1.5,10,'z',0.035,0.009,0),MM.al,cbl);
    const cv=mesh_(gB(0.104,0.0015,1.5,0,0.052,0),MM.tray,ly);
    const Q_=E.Q.trays, P=[{nm:'Опора: блок 300×300×60 з матом',sz:'крок 1,5 м',m:13.4,q:NSUP,o:sp,ex:[0,-0.08,0]},{nm:'Траверса 41×41×2,5 + болт M8×20',sz:'поперек лотка, болт у муфту блока',m:null,q:NSUP,o:tr,ex:[0,0.1,0]},
      {nm:'Лоток 100×50 перфорований',sz:'кабелі 1×6 і лінії Al',m:null,q:Q_['100×50'].all,qs:nf(Q_['100×50'].all,1)+' м',o:lt,ex:[0,0.24,0]},{nm:'Кабелі в лотку',sz:'«+», «−» 1×6 і Al 1×120…240',m:null,q:'',o:cbl,ex:[0,0.36,0]},{nm:'Кришка лотка',sz:'на всю трасу',m:null,q:'',o:cv,ex:[0,0.5,0]}];
    const sh=T.shot(10,{title:'Зразок: опора і лоток з кришкою',text:'Лотки не кріпляться до покрівлі: стоять на опорах «блок з матом + траверса». Лоток над водою не лежить — над ендовами містки.',parts:P,
      kv:E.types.map(t=>['Лоток '+t,nf(Q_[t].all,1)+' м','Р']).concat([['Опор',nf(NSUP),'Р'],['Маса лотків',ND,'']]),
      cam:u=>({tgt:new V3().setFromMatrixPosition(SF).add(V(0,0.2,0)),az:lerp(0.6,1.5,s5(u)),el:0.42,dist:lerp(1.9,1.7,u),fov:36}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+4.2,lb:sh.t1-1.6,root:g});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=on; if(!on) return; g.matrix.copy(SF); g.matrixWorldNeedsUpdate=true; explode(P,t,sh.t0+2.6,sh.t1-3.2,0.18); need=true; }));
    // 7.2 опори з палет (з усіх боків), потім траси «прокладаються» від щитів до спуску; фасонні, містки, спуск по фасаду
    const t2=T.t, S2=t2+0.2, D2=6.0, L0=t2+4.5, L1=t2+12.6;
    const trv=T.up(new Mover([[gB(1,1,1),MM.trayD]],NSUP,R,{mode:'drop',drop:0.2,cast:false}));
    E.sup.forEach((s,i)=>{ const z=surfZ(s[0],s[1]); supMv.F[i]=new M4().compose(W(s[0],s[1],z===null?0.3:z),new Q(),ONE3); const it=fpItemS.get(NFB+i); if(it){ const [pk,r,n]=it, qq=n-1-r; supMv.pal[i]=pk; supMv.slot[i]=T_(-0.45+(qq%4)*0.3,PAL_H+Math.floor(qq/8)*0.063,-0.15+Math.floor((qq%8)/4)*0.3); }
      const rr=it?it[1]:0; supMv.ts[i]=i===si?sh.t1-0.05:S2+(rr/60)*(D2-1)+0.3*(hsh(i)-0.5); supMv.td[i]=i===si?0.01:0.6; EP.trav.getMatrixAt(i,trv.F[i]=new M4()); trv.ts[i]=supMv.ts[i]+supMv.td[i]+0.1; trv.td[i]=0.3; });
    supMv.times(); fbMv.times(); trv.times();
    FPAL.forEach((p,k)=>{ let last=0; p.items.forEach(it=>{ const t_=it<NFB?fbMv.ts[it]+fbMv.td[it]:supMv.ts[it-NFB]+supMv.td[it-NFB]; last=Math.max(last,t_); }); fPal.v[k]=last+0.3; });
    let dmax=1; EP.tray.forEach(im=>{ for(let i=0;i<im.count;i++){ im.getMatrixAt(i,trM); trM.decompose(_v,_qa,_sa); dmax=Math.max(dmax,trNear(_v.x,-_v.z)); } });
    EP.tray.forEach((im,t)=>{ const L=[]; for(let i=0;i<im.count;i++){ im.getMatrixAt(i,trM); const M=trM.clone(); M.decompose(_v,_qa,_sa); L.push({M,t:L0+(L1-L0-0.6)*(1-trNear(_v.x,-_v.z)/dmax)+0.15*hsh(i+t*999)}); }
      L.sort((a,b)=>a.t-b.t); const tim=new THREE.InstancedMesh(trayU,MM.tray,Math.max(1,L.length)), cim=new THREE.InstancedMesh(coverG,MM.trayD,Math.max(1,L.length)); [tim,cim].forEach(x=>{ x.frustumCulled=false; x.castShadow=x===tim; x.receiveShadow=true; R.add(x); });
      L.forEach((x,i)=>{ tim.setMatrixAt(i,x.M); cim.setMatrixAt(i,x.M); }); const ta=Float32Array.from(L.map(x=>x.t)), ca=Float32Array.from(L.map(x=>x.t+0.5));
      trayIM.push(tim); coverIM.push(cim); trayT.push(ta); trayRev.push(T.up(new Fn(tt=>{ const a=ub(ta,tt), b=ub(ca,tt); if(tim.count!==a){ tim.count=a; need=true; } if(cim.count!==b){ cim.count=b; need=true; } }))); });
    const fit=new THREE.InstancedMesh(gB(1,1,1),MM.trayD,Math.max(1,E.fits.length)); fit.frustumCulled=false; R.add(fit); const fT=[]; E.fits.forEach((f,i)=>{ EP.fit.getMatrixAt(i,trM); fit.setMatrixAt(i,trM); fT.push(L0+(L1-L0)*(1-trNear(f[0],f[1])/dmax)+0.3); });
    const fo=fT.map((t,i)=>i).sort((a,b)=>fT[a]-fT[b]); fo.forEach((i,k)=>{ EP.fit.getMatrixAt(i,trM); fit.setMatrixAt(k,trM); }); const fTs=Float32Array.from(fo.map(i=>fT[i]));
    const vx=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09,0.09,1,12),MM.yellow,Math.max(1,E.vx.length)); vx.frustumCulled=false; R.add(vx); E.vx.forEach((v,i)=>{ EP.vx.getMatrixAt(i,trM); vx.setMatrixAt(i,trM); });
    T.up(new Fn(t=>{ const a=ub(fTs,t); if(fit.count!==a){ fit.count=a; need=true; } const b=t>=L1-1.2?E.vx.length:0; if(vx.count!==b){ vx.count=b; need=true; } }));
    const fac=new THREE.Mesh(EP.facade.geometry,MM.tray); fac.position.copy(EP.facade.position); fac.visible=false; R.add(fac); T.up(new VAct([fac],L1-0.6,null));
    T.shot(14,{title:'Опори й траси лотків',text:'Опори — з палет з усіх боків; лотки «прокладаються» від щитів до спуску на фасаді по осі 17; кришки — слідом.',
      cam:u=>u<0.36?{tgt:V(50,6,-48),az:lerp(1.0,1.18,s5(u/0.36)),el:0.8,dist:118,fov:38}:{tgt:W(lerp(80,90,s5((u-0.36)/0.64)),lerp(58,63,s5((u-0.36)/0.64)),HV+1),az:lerp(1.35,1.0,s5((u-0.36)/0.64)),el:0.62,dist:lerp(52,42,u),fov:38},mus:'drive'});
    const trTot=Object.values(Q_).reduce((s,x)=>s+x.all,0), nTr=trayT.reduce((s,a)=>s+a.length,0);
    T.counter({nm:'Опори лотків (блок з матом + траверса)',tot:NSUP,n:t=>supMv.placed(t),m:13.4,g:'blk'});
    T.counter({nm:'Лотки з кришками, м',tot:Math.round(trTot*10)/10,n:t=>{ let k=0; trayT.forEach(a=>k+=ub(a,t)); return Math.round(trTot*k/nTr*10)/10; },unit:'м',note:E.types.map(t=>t+' — '+nf(Q_[t].all,0)+' м').join(', ')});
    T.counter({nm:'Фасонні і містки над ендовами',tot:E.fits.length+E.vx.length,n:t=>ub(fTs,t)+(t>=L1-1.2?E.vx.length:0)}); }

  // ===== акт 8. Кабелі
  T.act('cab','Кабелі','Під модулями «+» і «−» 1×6 — стяжкою УФ до бічної стінки лаги через 0,5 м, без рукава; поза модулями — у лотку; перемички понад 3,5 м — у металорукаві Ø25 (рішення 26.10).');
  const BPAL=['#2f6fdb','#e0782b','#2c9a5b','#c23b6b','#7b5bd6','#c9a227','#1aa3b4','#d9534f','#5c8f2f','#a0522d','#3a7ca5','#e377c2','#8c6d31','#17becf'];
  const mcen=i=>{ const m=OM[i]; return [(m.Xa+m.Xb)/2,m.Y]; };
  { const t0=T.t, Q_=E.Q;
    // 8.1 вставка під лагою
    const SF=frm(DXJ,DS[1]+1.0,0), g=grp_(R); g.visible=false; g.matrixAutoUpdate=false;
    mesh_(lagGeo(1.4,HL),MM.lagS,g); mesh_(blkGeoM,MM.vc,g).position.z=0.5;
    const cp=mesh_(gC(0.0035,1.36,10,'z',0.0245,HL+0.012,0),MM.red,g), cm=mesh_(gC(0.0035,1.36,10,'z',0.0245,HL+0.026,0),MM.black,g);
    const ti=grp_(g); for(let z=-0.5;z<=0.51;z+=0.5){ mesh_(new THREE.TorusGeometry(0.03,0.0018,6,18).scale(1,0.85,1).rotateY(Math.PI/2).translate(0.006,HL+0.02,z),MM.dark,ti); }
    const mc=grp_(g,0.05,HL+0.02,0.74); mesh_(gC(0.008,0.07,10,'z',0,0,0),MM.black,mc); mesh_(gC(0.008,0.07,10,'z',0.022,0,0.03),MM.dark,mc);
    const hs=mesh_(gC(0.0125,0.9,14,'z',-0.16,0.0125,0.1),MM.hose,g);
    const P=[{nm:'Кабель 1×6 «+» (червоний)',sz:'уздовж бічної стінки лаги',m:0.075,q:Q_.red,qs:nf(Q_.red,0)+' м',o:cp,ex:[0.07,0.06,0]},{nm:'Кабель 1×6 «−» (чорний)',sz:'',m:0.075,q:Q_.black,qs:nf(Q_.black,0)+' м',o:cm,ex:[0.12,0.1,0]},
      {nm:'Стяжка УФ',sz:'через 0,5 м',m:null,q:'',o:ti,ex:[0.16,0.02,0]},{nm:'Роз\'єми MC4, пари',sz:'як на модулях ZNSHINE',m:null,q:Q_.mc4,o:mc,ex:[0.1,0.12,0.1]},{nm:'Перемичка понад 3,5 м у металорукаві Ø25',sz:'між рядами',m:0.3,q:Q_.hose,qs:nf(Q_.hose,1)+' м рукава',o:hs,ex:[-0.12,0.05,0]}];
    const sh=T.shot(9.5,{title:'Вставка: кабель під лагою',text:'«+» і «−» стрінга лежать уздовж бічної стінки лаги, стяжка УФ через 0,5 м. Перемичка між рядами довша за 3,5 м — у металорукаві Ø25.',parts:P,
      kv:[['«+» / «−»',nf(Q_.red,0)+' / '+nf(Q_.black,0)+' м','Р'],['Перемичок',nf(Q_.jumpers),'Р'],['Металорукав Ø25',nf(Q_.hose,1)+' м','Р'],['MC4, пари',nf(Q_.mc4),'Р']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(SF).add(V(0.02,0.04,0)),az:lerp(1.05,1.75,s5(u)),el:0.4,dist:lerp(1.05,0.9,u),fov:34}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+3.6,lb:sh.t1-1.2,root:g});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=on; if(!on) return; g.matrix.copy(SF); g.matrixWorldNeedsUpdate=true; explode(P,t,sh.t0+2.2,sh.t1-2.8,0.18); need=true; }));
    // 8.2 демо-стрінг помаранчевою товстою лінією: від щита — «+» до кінця стрінга, «−» — назад; 8.3 усі стрінги кольорами щитів, лінії Al до спуску
    const s=E.strings[dStr], t2=T.t; const dp=[], dt=[]; const pp=pathPts(s.pp,0.24), mp=pathPts(s.mp,0.25);
    const tot=pp.length+mp.length; pp.forEach((p,i)=>{ if(i){ dp.push(pp[i-1],p); dt.push(t2+0.4+2.4*i/pp.length); } }); mp.forEach((p,i)=>{ if(i){ dp.push(mp[i-1],p); dt.push(t2+2.9+2.4*i/mp.length); } });
    s.j.forEach(([a,b])=>{ const A=mcen(a), B=mcen(b); segsOf(route(A[0],A[1],B[0],B[1],0.23,0.3),dp); while(dt.length<dp.length/2) dt.push(t2+5.3); });
    const dso=fatLines(dp,0xff7a00,5,R,{ro:6}); T.up(new LRev(dso,dt)); T.up(new VAct([dso],t2,t2+6+8));
    const sb=E.boxes[s.b], cen=W((OM[s.m[0]].Xa+sb.X)/2,(OM[s.m[0]].Y+sb.Y)/2,HV+1);
    T.shot(6,{title:'Демо-стрінг: '+s.id+' → '+sb.n,text:`11 модулів, ${E.kc[s.k]||s.kind}. Обидва кінці приходять до щита: «+» і «−» — по лотку і під лагами.`,kv:[['Модулів у стрінгу','11','Р'],['Uхх при −25 °C','612,6 В (межа PCS 660 В)','Р'],['Вхід щита',sb.n+' → '+sb.K,'Р']],
      cam:u=>({tgt:cen,az:lerp(1.35,1.65,s5(u)),el:1.0,dist:lerp(34,30,u),fov:38}),slow:true});
    const t3=T.t; const byB=E.boxes.map(()=>({p:[],t:[]}));
    E.strings.forEach((st,si)=>{ if(!st.r||si===dStr) return; const acc=byB[st.b]; const a=pathPts(st.pp,0.07), b=pathPts(st.mp,0.075), ts=t3+0.3+3.6*hsh(si); for(let i=1;i<a.length;i++){ acc.p.push(a[i-1],a[i]); acc.t.push(ts+1.6*i/a.length); } for(let i=1;i<b.length;i++){ acc.p.push(b[i-1],b[i]); acc.t.push(ts+0.3+1.6*i/b.length); } });
    byB.forEach((x,k)=>{ if(!x.p.length) return; const o=x.t.map((t,i)=>i).sort((a,b)=>x.t[a]-x.t[b]); const P2=[],T2=[]; o.forEach(i=>{ P2.push(x.p[2*i],x.p[2*i+1]); T2.push(x.t[i]); }); const L=fatLines(P2,parseInt(BPAL[k%BPAL.length].slice(1),16),2.2,R); T.up(new LRev(L,T2)); });
    { const jp=[], jt=[], jl=[], jlt=[]; E.strings.forEach((st,si)=>{ if(!st.r) return; st.j.forEach(([a,b,l])=>{ const A=mcen(a),B=mcen(b); const seg=route(A[0],A[1],B[0],B[1],0.065,0.3); for(let i=1;i<seg.length;i++){ (l>3.5?jl:jp).push(seg[i-1],seg[i]); (l>3.5?jlt:jt).push(t3+3.4+2.4*hsh(si)); } }); });
      const so=(P_,T_)=>{ const o=T_.map((t,i)=>i).sort((a,b)=>T_[a]-T_[b]); return [o.flatMap(i=>[P_[2*i],P_[2*i+1]]),o.map(i=>T_[i])]; };
      let [a,b]=so(jp,jt); T.up(new LRev(fatLines(a,0x8a96a0,1.6,R),b)); [a,b]=so(jl,jlt); T.up(new LRev(fatLines(a,0xe0782b,2.6,R),b)); }
    const alL={'K-1':{p:[],t:[]},'K-2':{p:[],t:[]},'K-3':{p:[],t:[]}};
    E.boxes.forEach((b,i)=>{ if(!b.r) return; const off=0.13+(['K-1','K-2','K-3'].indexOf(b.K))*0.012, pts=pathPts(b.lp,off), ts=t3+4.2+2.2*hsh(i*13); for(let k=1;k<pts.length;k++){ alL[b.K].p.push(pts[k-1],pts[k]); alL[b.K].t.push(ts+1.6*k/pts.length); } });
    Object.entries(alL).forEach(([K,x])=>{ const o=x.t.map((t,i)=>i).sort((a,b)=>x.t[a]-x.t[b]); T.up(new LRev(fatLines(o.flatMap(i=>[x.p[2*i],x.p[2*i+1]]),KCOL[K],3.2,R),o.map(i=>x.t[i]))); });
    T.shot(8,{title:'Усі стрінги і лінії Al',text:'175 стрінгів до 26 щитів — колір лінії = щит. Від щитів до спуску на фасаді — лінії Al, колір = контейнер (K-1, K-2, K-3).',
      cam:u=>({tgt:V(52,6,-48),az:lerp(0.95,1.25,s5(u)),el:1.05,dist:126,fov:38}),mus:'drive'});
    const fr=t=>c01((t-t3-0.3)/5.5), fa=t=>c01((t-t3-4.2)/3.8), alTot=Q_.al['120']+Q_.al['185']+Q_.al['240'];
    T.counter({nm:'Кабель 1×6 «+», м',tot:Q_.red,n:t=>Math.round(Q_.red*fr(t)*10)/10,m:0.075,g:'el',unit:'м'}); T.counter({nm:'Кабель 1×6 «−», м',tot:Q_.black,n:t=>Math.round(Q_.black*fr(t)*10)/10,m:0.075,g:'el',unit:'м'});
    T.counter({nm:'Перемички',tot:Q_.jumpers,n:t=>Math.round(Q_.jumpers*c01((t-t3-3.4)/2.4)),note:'понад 3,5 м — у металорукаві Ø25 (помаранчеві)'});
    T.counter({nm:'Лінії Al до спуску, м',tot:Math.round(alTot*10)/10,n:t=>Math.round(alTot*fa(t)*10)/10,mf:t=>(Q_.al['120']*0.55+Q_.al['185']*0.8+Q_.al['240']*1.0)*fa(t),g:'el',unit:'м'}); }

  // ===== акт 9. Панелі
  T.act('pv','Панелі','Панелі ZNSHINE 730 Вт: коробки по 33 біля північного і південного країв; панель кладуть на лаги ближче до середини ряду і насувають до її місця; ряд заповнюється від країв до середини; притиски — після кожної панелі.');
  const modTop=gB(1.243,0.003,2.324,0,0.0315,0), modFr=gMerge([gB(0.03,0.033,2.384,0.6365,0.0165,0),gB(0.03,0.033,2.384,-0.6365,0.0165,0),gB(1.243,0.033,0.03,0,0.0165,1.177),gB(1.243,0.033,0.03,0,0.0165,-1.177),gB(1.24,0.002,2.32,0,0.004,0)]);
  const modF=(m)=>{ const za=roofZ(m.Xa)+HT, zb=roofZ(m.Xb)+HT, a=Math.atan2(zb-za,m.Xb-m.Xa); return new M4().compose(W((m.Xa+m.Xb)/2,m.Y,(za+zb)/2),new Q().setFromAxisAngle(ZA,a),ONE3); };
  const NM=mods.length, pvMv=T.up(new Mover([[modFr,MM.frame],[modTop,MM.cells]],NM,R,{mode:'via',arc:1.2}));
  const NCL=OD.cl.length, clGeo=gMerge([gTint(gProf([[-0.008,-0.012],[0.008,-0.012],[0.008,0],[0.022,0],[0.022,0.006],[-0.022,0.006],[-0.022,0],[-0.008,0]],0.05).translate(0,0.137,0),0xd9dde0),gTint(gC(0.0065,0.008,6,'y',0,0.147,0),0x8f979d)]);
  const zGeo=gMerge([gTint(gB(0.04,0.006,0.035,0,0.14,0),0xd9dde0),gTint(gB(0.006,0.033,0.035,0.017,0.122,0),0xd9dde0),gTint(gC(0.0065,0.008,10,'y',-0.004,0.147,0),0x8f979d)]);
  const clMv=T.up(new Mover([[clGeo,MM.vc]],NCL,R,{mode:'drop',drop:0.05,cast:false,fl:0.5})), NZ=OD.xp.filter(x=>!x[4]).length*2, zxMv=T.up(new Mover([[zGeo,MM.vc]],NZ,R,{mode:'drop',drop:0.05,cast:false,fl:0.5}));
  { const t0=T.t;
    // ряди: модулі між двома лагами підряд; кожен — до коробки біля ближчого краю (північ / південь)
    const pts=mods.map(i=>[(OM[i].Xa+OM[i].Xb)/2,OM[i].Y]);
    const runs=new Map(); mods.forEach((i,k)=>{ const m=OM[i], key=m.Xa.toFixed(2)+'|'+m.Xb.toFixed(2); if(!runs.has(key)) runs.set(key,[]); runs.get(key).push(k); });
    const runOf=new Int32Array(NM), mid=new Float32Array(NM); runs.forEach(L=>{ L.sort((a,b)=>OM[mods[a]].Y-OM[mods[b]].Y); let cur=[L[0]]; const flush=()=>{ const y0=OM[mods[cur[0]]].Y, y1=OM[mods[cur[cur.length-1]]].Y; cur.forEach(k=>mid[k]=(y0+y1)/2); };
      for(let j=1;j<L.length;j++){ if(OM[mods[L[j]]].Y-OM[mods[L[j-1]]].Y>2.6){ flush(); cur=[]; } cur.push(L[j]); } flush(); });
    // демо: 3 крайні панелі демо-колонки біля південного краю
    const dk=mods.map((i,k)=>k).filter(k=>dCol.includes(mods[k])).sort((a,b)=>OM[mods[a]].Y-OM[mods[b]].Y).slice(0,3);
    const MPALS=makePallets(pts.map((p,k)=>dk.includes(k)?null:p),33,['S','N'],2.42);
    let mp0=0; { let bd=1e9; MPALS.forEach((p,k)=>{ const d=Math.abs(p.X-(DX+DXJ)/2)+(p.e==='S'?0:1000); if(d<bd){ bd=d; mp0=k; } }); }
    { const P_=MPALS[mp0]; dk.slice().reverse().forEach(k=>P_.items.unshift(k)); while(P_.items.length>33){ const x=P_.items.pop(); let nb=-1,nd=1e9; MPALS.forEach((p,j)=>{ if(j===mp0||p.items.length>=33) return; const d=Math.hypot(p.X-pts[x][0],p.Y-pts[x][1]); if(d<nd){ nd=d; nb=j; } }); if(nb>=0) MPALS[nb].items.push(x); } }
    const MP=sortPallets(MPALS,mp0), postG=gMerge([[-1.18,-0.62],[1.18,-0.62],[-1.18,0.62],[1.18,0.62]].map(([x,z])=>gB(0.06,1.25,0.06,x,PAL_H+0.62,z)));
    const mPal=T.up(new Pals([[palletGeo(2.42,1.32),MM.wood],[postG,MM.card]],MP.length,R)); pvMv.P=mPal;
    MP.forEach((p,k)=>{ mPal.R[k]=palMat(p,'x'); mPal.a[k]=t0+0.3+k/MP.length*4.6; });
    T.shot(6,{title:'Коробки з панелями',text:`Коробки по 33 панелі (паспорт ZNSHINE) — біля північного і південного країв, навпроти своїх рядів: ${MP.length} коробок на ${nf(NM)} панелей цеху.`,
      kv:[['У коробці','33 панелі','П'],['Маса коробки','33 × 36,5 ≈ 1,2 т','Р'],['Коробок на цех',nf(MP.length),'Р']],cam:u=>({tgt:V(50,6,-48),az:lerp(1.55,1.3,s5(u)),el:0.6,dist:150,fov:38})});
    // 9.2 зразок панелі над демо-рядом
    const dm=OM[mods[dk[0]]], SF=modF(dm), g=grp_(R); g.visible=false; g.matrixAutoUpdate=false; const pg=grp_(g,0,0,0);
    const gl1=mesh_(gB(2.324,0.002,1.243,0,0.031,0).rotateY(Math.PI/2),MM.glass,pg), cl_=mesh_(modTop.clone().translate(0,-0.012,0),MM.cells,pg), gl2=mesh_(gB(2.324,0.002,1.243,0,0.016,0).rotateY(Math.PI/2),MM.glass,pg), frg=mesh_(modFr,MM.frame,pg);
    const jb=grp_(pg,0,-0.004,-0.35); mesh_(gB(0.14,0.02,0.1,0,0,0),MM.black,jb); const lead=s_=>{ const pts_=[]; for(let i=0;i<=20;i++){ const u=i/20; pts_.push(V(s_*(0.05+u*0.45),-0.012-0.02*Math.sin(u*Math.PI),0.06+0.15*Math.sin(u*Math.PI*1.5))); } mesh_(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts_),30,0.0032,6,false),MM.black,jb); mesh_(gC(0.009,0.06,10,'x',s_*0.53,-0.012,0.06+0.15*Math.sin(Math.PI*1.5)),s_<0?MM.black:MM.dark,jb); }; lead(-1); lead(1);
    const P=[{nm:'Скло фронтальне 2,0 мм',sz:'загартоване',m:null,q:'',o:gl1,ex:[0,0.42,0]},{nm:'132 напівелементи N-type (6 × 22)',sz:'ККД 23,5 %',m:null,q:'',o:cl_,ex:[0,0.24,0]},{nm:'Скло тильне 2,0 мм',sz:'двостороння, 80 ± 10 %',m:null,q:'',o:gl2,ex:[0,0.08,0]},
      {nm:'Рама 33 мм',sz:'2 384 × 1 303 × 33',m:36.5,q:1925,qs:'1 749 цех + 176 склад',o:frg,ex:null},{nm:'Коробка IP68, 3 діоди, виводи з MC4',sz:'кабель 4 мм²',m:null,q:'',o:jb,ex:[0,-0.2,0]}];
    const sh=T.shot(11.5,{title:'Зразок: панель ZNSHINE 730 Вт',text:'Шари розходяться: скло, комірки, тильне скло, рама, коробка з виводами.',parts:P,
      kv:[['Потужність','730 Вт','П'],['Розмір','2 384 × 1 303 × 33','П'],['Маса','36,5 кг','П'],['Uхх / Iкз','49,50 В / 18,51 А','П'],['Uмп / Iмп','41,70 В / 17,51 А','П']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(SF).add(V(0,1.35,0)),az:lerp(0.55,1.55,s5(u)),el:lerp(0.5,0.38,u),dist:lerp(4.4,3.9,u),fov:38}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+4.4,lb:sh.t1-2.4,root:g});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=on; if(!on) return; const u=t-sh.t0; g.matrix.copy(SF).multiply(T_(0,1.3,0)).multiply(Rx(-0.32+0.18*Math.sin(u/11.5*Math.PI))).multiply(Ry(u/11.5*0.6)); g.matrixWorldNeedsUpdate=true; explode(P,t,sh.t0+2.4,sh.t1-3.4,0.2); need=true; }));
    // 9.3 перші 3 панелі крупно; 9.4 усі фронти
    const t3=T.t, t4=t3+14, S4=t4+0.3, D4=18.2;
    mods.forEach((i,k)=>{ const m=OM[i]; pvMv.F[k]=modF(m); const dy=mid[k]-m.Y, push=dk.includes(k)?Math.sign(dy)*Math.min(Math.abs(dy),4.8):Math.sign(dy)*Math.min(Math.abs(dy),2.4); pvMv.via=pvMv.via||new Array(NM); pvMv.via[k]=modF({Xa:m.Xa,Xb:m.Xb,Y:m.Y+push}).multiply(T_(0,0.004,0)); });
    MP.forEach((p,k)=>{ const n=p.items.length; let last=0; p.items.forEach((mk,r)=>{ const q=n-1-r; pvMv.slot[mk]=T_(0,PAL_H+0.02+q*0.036,0).multiply(Ry(Math.PI/2)); pvMv.pal[mk]=k;
        let ts,td; const di=dk.indexOf(mk); if(di>=0){ ts=t3+0.6+di*4.3; td=2.9; } else { td=0.95*(0.85+0.3*hsh(mk)); const rr=k===0?r-3:r; ts=S4+(rr/33)*(D4-1.4)+0.3*(hsh(mk*3)-0.5)*(D4/33); }
        pvMv.ts[mk]=ts; pvMv.td[mk]=td; pvMv.arc[mk]=Math.min(1.5,0.8+0.03*Math.hypot(p.X-pts[mk][0],p.Y-pts[mk][1])); last=Math.max(last,ts+td); }); mPal.v[k]=last+0.3; });
    pvMv.times();
    // притиски: на лагах — коли лягли сусідні панелі (після кожної панелі); Z33 на профілях — коли лягла крайня панель ряду
    const land=new Map(); mods.forEach((i,k)=>land.set(i,pvMv.ts[k]+pvMv.td[k]));
    const byX=new Map(); mods.forEach(i=>{ const m=OM[i]; [m.Xa,m.Xb].forEach(x=>{ const kk=x.toFixed(3); if(!byX.has(kk)) byX.set(kk,[]); byX.get(kk).push(i); }); });
    let clSkip=0; OD.cl.forEach((c,ci)=>{ const X=LX(c[0]); clMv.F[ci]=frm(X,c[1],0); if(c[2]) clMv.F[ci].multiply(Ry(0)); const L=(byX.get(X.toFixed(3))||[]).filter(i=>Math.abs(OM[i].Y-c[1])<1.22); let tm=-1; L.forEach(i=>{ tm=Math.max(tm,land.get(i)); });
      if(tm<0){ clSkip++; clMv.ts[ci]=1e9; return; } const demo=tm<S4; clMv.ts[ci]=tm+(demo?0.25+0.35*hsh(ci):0.05+0.25*hsh(ci)); clMv.td[ci]=demo?0.45:0.25; });
    let zk=0, zSkip=0; OD.xp.forEach(x=>{ if(x[4]) return; const xa=LX(x[0]), xb=LX(x[1]), mm=mods.find(i=>Math.abs(OM[i].Xa-xa)<0.02&&Math.abs(OM[i].Xb-xb)<0.02&&Math.abs(OM[i].Y-x[2])<1.6);
      [0.25,0.75].forEach(f=>{ const X=xa+(xb-xa)*f; zxMv.F[zk]=frm(X,x[2],0).multiply(Ry(Math.PI/2*(x[3]>0?1:-1))); if(mm===undefined){ zxMv.ts[zk]=1e9; zSkip++; } else { const tm=land.get(mm); zxMv.ts[zk]=tm+(tm<S4?0.6:0.1)+0.2*hsh(zk); zxMv.td[zk]=0.3; } zk++; }); });
    clMv.times(); zxMv.times();
    const fx=[]; dk.forEach(k=>fx.push(pvMv.ts[k]+pvMv.td[k])); T.fx(fx,'tuk'); const fc=[]; for(let i=0;i<NCL;i++) if(clMv.ts[i]<S4) fc.push(clMv.ts[i]+clMv.td[i]); T.fx(fc,'klac'); T.fx(lineTimes(40,S4,S4+D4),'klac');
    const dmm=OM[mods[dk[1]]];
    T.shot(14,{title:'Перші три панелі',text:'З коробки — на лаги ближче до середини ряду, далі насунути вздовж лаг до краю. Z33 на крайньому профілі — одразу після панелі; середній на спільній лазі — коли ляже сусідня панель.',nd:'Притиски після кожної панелі чи після ряду — власник не уточнив; прийнято після кожної.',
      kv:[['Притисків середніх / Z33','4 227 / 3 032','П'],['Гайка M8 з пружиною в паз лаги','7 259','П']],
      cam:u=>({tgt:roofP((dmm.Xa+dmm.Xb)/2,dmm.Y+1.4-u*1.6,0.3),az:lerp(2.45,2.9,s5(u)),el:0.55,dist:lerp(7.5,6.2,s5(u)),fov:38}),slow:true});
    const rem=[]; E.rr.forEach(i=>{ const m=OM[i], y0=m.Y-1.17, y1=m.Y+1.17, a=m.Xa+0.03, b=m.Xb-0.03, h=x=>roofZ(x)+0.14; const c=[W(a,y0,h(a)),W(b,y0,h(b)),W(b,y1,h(b)),W(a,y1,h(a))]; for(let k=0;k<4;k++) rem.push(c[k],c[(k+1)%4]); rem.push(c[0],c[2],c[1],c[3]); });
    const remO=fatLines(rem,0x7c8790,2.2,R); remO.visible=false; T.up(new VAct([remO],S4+D4-0.8,null));
    T.shot(20,{title:'Усі фронти',text:`Панелі з усіх коробок одночасно, ряди — від країв до середини. Наприкінці ${E.rr.length} місць без модулів — сірим контуром (кріплення під ними є, притисків немає).`,
      cam:u=>u<0.55?{tgt:V(50,6,-48),az:lerp(1.05,1.55,s5(u/0.55)),el:0.66,dist:lerp(140,128,u),fov:38}:{tgt:V(50,6,-48).lerp(V(78,5,-22),s5((u-0.55)/0.45)),az:lerp(1.55,0.95,s5((u-0.55)/0.45)),el:lerp(0.66,0.8,s5((u-0.55)/0.45)),dist:lerp(128,112,u),fov:38},mus:'drive'});
    T.counter({nm:'Панелі на цеху',tot:NM,n:t=>pvMv.placed(t),m:36.5,g:'mod'}); T.counter({nm:'Притиски на лагах (середні + Z33)',tot:NCL,n:t=>clMv.placed(t),skip:clSkip,note:`${nf(clSkip)} — біля місць без модулів, не ставимо`});
    T.counter({nm:'Притиски Z33 на крайніх профілях',tot:NZ,n:t=>zxMv.placed(t),skip:zSkip,note:zSkip?`${zSkip} — біля місць без модулів, не ставимо`:''}); T.counter({nm:'Потужність на цеху, кВтп',tot:Math.round(NM*0.73*100)/100,n:t=>Math.round(pvMv.placed(t)*73)/100,unit:'кВтп'}); }


  // ===== акт 10. Склад
  T.act('wh','Склад','176 модулів на профнастилі складу: міні-рейка під кожною точкою притиску, 4 точки на модуль по довгих сторонах (розрахунок складу 26.10, ред. 2).');
  const WL=whLayout(EP.whRem);
  const qOf=(part,Y)=>{ const sgn=(part==='C1'||part==='C2')&&Y>-15.5?-1:1; return new Q().setFromAxisAngle(XA,sgn*SLOPE[part]*D2R); };
  const railGeo=gMerge([gTint(gB(0.38,0.03,0.04,0,0.015,0),0xd9dde0),gTint(gB(0.36,0.003,0.05,0,0.0015,0),0x18191a),...[-0.16,-0.1,-0.04,0.04,0.1,0.16].map(x=>gTint(gHex(0.008,0.004,'y',x,0.032,0),0x8f979d))]);
  const whClG=gMerge([gTint(gB(0.05,0.008,0.04,0,0.004,0),0xd9dde0),gTint(gC(0.0065,0.006,10,'y',0,0.011,0),0x8f979d)]);
  const NR=WL.rails.length, NWM=WL.mods.length;
  const rlMv=T.up(new Mover([[railGeo,MM.vc]],NR,R,{mode:'drop',drop:0.25,cast:false})), wpMv=T.up(new Mover([[modFr,MM.frame],[modTop,MM.cells]],NWM,R,{arc:1.4})), wcMv=T.up(new Mover([[whClG,MM.vc]],WL.cl.length,R,{mode:'drop',drop:0.05,cast:false}));
  { const t0=T.t;
    // 10.1 зразок: профнастил, міні-рейка на 6 саморізах з EPDM, притиски П33 і Z33
    const r0=WL.rails[0], q0=qOf(r0.part,r0.Y), SF=new M4().compose(W(r0.X,r0.Y,WHF[r0.part](r0.X,r0.Y)),q0,ONE3).multiply(Ry(r0.land?Math.PI/2:0)), g=grp_(R); g.visible=false; g.matrixAutoUpdate=false;
    const shG=grp_(g); for(let k=0;k<6;k++){ mesh_(gB(0.2,0.0008,0.9,-0.5+k*0.2,0,0),MM.sheet,shG); mesh_(gB(0.04,0.024,0.9,-0.4+k*0.2,0.012,0),MM.sheet,shG); }
    const rl=grp_(g,0,0.024,0); mesh_(gB(0.38,0.03,0.04,0,0.015,0),MM.al,rl); const ep=mesh_(gB(0.36,0.003,0.05,0,0.024,0),MM.epdm,g);
    const sc=grp_(g); [-0.16,-0.1,-0.04,0.04,0.1,0.16].forEach(x=>{ mesh_(gHex(0.008,0.004,'y',x,0.058,0),MM.hw,sc); mesh_(gC(0.0028,0.03,8,'y',x,0.04,0),MM.thr,sc); });
    const p33=grp_(g,0.06,0.06,0); mesh_(gB(0.05,0.008,0.04,0,0.004,0),MM.al,p33); mesh_(gC(0.0065,0.006,10,'y',0,0.011,0),MM.hw,p33);
    const z33=grp_(g,-0.13,0.06,0); mesh_(gB(0.04,0.008,0.035,0,0.004,0),MM.al,z33); mesh_(gB(0.006,0.033,0.035,-0.017,-0.012,0),MM.al,z33);
    const mc=mesh_(gB(0.5,0.033,0.4,0.33,0.0765,0.1),MM.frame,g);
    const P=[{nm:'Профнастил складу',sz:'скат 11° / 17° / 22°',m:null,q:'',o:shG,ex:null},{nm:'Ущільнювач EPDM',sz:'під рейкою',m:null,q:'',o:ep,ex:[0,0.06,0]},{nm:'Міні-рейка (аналог AR2-MR13-380)',sz:'380 мм',m:null,q:398,qs:'398 (418 до замовлення)',o:rl,ex:[0,0.14,0]},
      {nm:'Саморіз 5,5×25 з EPDM',sz:'6 на рейку',m:null,q:2388,o:sc,ex:[0,0.26,0]},{nm:'Притиск середній П33',sz:'між рамами, болт M8',m:null,q:306,o:p33,ex:[0,0.36,0]},{nm:'Притиск крайній Z33',sz:'на краю ланцюжка',m:null,q:92,o:z33,ex:[0,0.36,0]},{nm:'Модуль (кут рами)',sz:'з етапу панелей',m:36.5,q:176,o:mc,ex:[0.12,0.5,0]}];
    const sh=T.shot(10,{title:'Зразок: міні-рейка на профнастилі',text:'Під кожною точкою притиску — міні-рейка на 6 саморізах з EPDM; модулі — довгою стороною один до одного.',parts:P,nd:'Точки на довгій стороні — за інструкцією ZNSHINE (не отримано), показано на чвертях.',
      kv:[['За розкладкою','рейок 398, П33 306, Z33 92','Р'],['Проєкт RUDNIK','Light_P50-310 640, Z33 260, П33 442','П'],['Не ставимо','модулі № 1, 2, 166, 167','Р']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(SF).add(V(0,0.1,0)),az:lerp(0.5,1.35,s5(u)),el:0.5,dist:lerp(1.4,1.25,u),fov:36}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+4.2,lb:sh.t1-1.2,root:g});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=on; if(!on) return; g.matrix.copy(SF); g.matrixWorldNeedsUpdate=true; explode(P,t,sh.t0+2.6,sh.t1-2.8,0.18); need=true; }));
    // 10.2 рейки, потім панелі зі стопок на землі біля складу; притиски — після кожної
    const t2=T.t;
    const rOrd=WL.rails.map((r,i)=>i).sort((a,b)=>WL.rails[b].X-WL.rails[a].X||WL.rails[a].Y-WL.rails[b].Y);
    rOrd.forEach((ri,k)=>{ const r=WL.rails[ri], q=qOf(r.part,r.Y); rlMv.F[ri]=new M4().compose(W(r.X,r.Y,WHF[r.part](r.X,r.Y)+0.002),q,ONE3).multiply(Ry(r.land?Math.PI/2:0)); rlMv.ts[ri]=t2+0.3+k/NR*4.4; rlMv.td[ri]=0.35; });
    const STK=[]; { const L=WL.mods.map((m,i)=>i).sort((a,b)=>WL.mods[a].m.X-WL.mods[b].m.X); for(let i=0;i<L.length;i+=33) STK.push(L.slice(i,i+33)); }
    const wPal=T.up(new Pals([[palletGeo(2.42,1.32),MM.wood]],STK.length,R)); wpMv.P=wPal; const landW=new Map();
    STK.forEach((L,k)=>{ const X=lerp(66,146,STK.length>1?k/(STK.length-1):0.5); wPal.R[k]=new M4().compose(W(X,-28.6,0),new Q(),ONE3); wPal.a[k]=t2+0.4+k*0.3; let last=0;
      L.forEach((wi,r)=>{ const it=WL.mods[wi], m=it.m, q=qOf(m.part,m.Y); wpMv.F[wi]=new M4().compose(W(m.X,m.Y,WHF[m.part](m.X,m.Y)+0.032),q,ONE3).multiply(Ry(m.land?Math.PI/2:0)); wpMv.slot[wi]=T_(0,PAL_H+0.02+(L.length-1-r)*0.036,0).multiply(Ry(Math.PI/2)); wpMv.pal[wi]=k;
        const ts=t2+5.0+(r/33)*7.4+0.2*hsh(wi); wpMv.ts[wi]=ts; wpMv.td[wi]=1.0; landW.set(it.key,ts+1.0); last=Math.max(last,ts+1.0); }); wPal.v[k]=last+0.3; });
    WL.cl.forEach((c,k)=>{ const q=qOf(c.part,c.Y); wcMv.F[k]=new M4().compose(W(c.X,c.Y,WHF[c.part](c.X,c.Y)+0.066),q,ONE3).multiply(Ry(c.land?Math.PI/2:0)); const tm=Math.max(...c.adj.map(a=>landW.get(a)??-1)); wcMv.ts[k]=tm>0?tm+0.05+0.2*hsh(k):1e9; wcMv.td[k]=0.25; });
    rlMv.times(); wpMv.times(); wcMv.times();
    T.shot(14,{title:'Рейки, панелі, притиски',text:'Спершу міні-рейки, далі панелі зі стопок біля складу; притиски — після кожної панелі.',nd:'Що замовляти — за розкладкою (398 / 306 / 92) чи за RUDNIK (640 / 260 / 442) — рішення власника.',
      cam:u=>({tgt:W(lerp(124,108,s5(u)),-15,5),az:lerp(0.35,0.75,s5(u)),el:0.55,dist:lerp(62,70,u),fov:38}),mus:'drive'});
    const tP=Float32Array.from(WL.cl.map((c,k)=>c.z?1e9:wcMv.ts[k]+wcMv.td[k]).sort((a,b)=>a-b)), tZ=Float32Array.from(WL.cl.map((c,k)=>c.z?wcMv.ts[k]+wcMv.td[k]:1e9).sort((a,b)=>a-b));
    T.counter({nm:'Міні-рейки',tot:NR,n:t=>rlMv.placed(t)}); T.counter({nm:'Притиски П33',tot:WL.nm,n:t=>ub(tP,t)}); T.counter({nm:'Притиски Z33',tot:WL.nz,n:t=>ub(tZ,t)}); T.counter({nm:'Панелі на складі',tot:NWM,n:t=>wpMv.placed(t),m:36.5,g:'whmod'}); }

  // ===== акт 11. Блискавкозахист
  T.act('bz','Блискавкозахист','Без щогл (Том 7): каркас — 19 механічно зв\'язаних блоків по 2 приєднання, провідник вирівнювання ПВ-3 1×6 у лотках уздовж ліній DC, ПЗІП F1 у щитах і F2/F3 у шафах вводу.');
  { const t0=T.t;
    const SF=frm(DX,DS[1]-0.4,0), g=grp_(R); g.visible=false; g.matrixAutoUpdate=false;
    mesh_(lagGeo(0.9,HL),MM.lagS,g); const sl=mesh_(gProf(GU,0.2),MM.yz,g); sl.position.z=0.25;
    const cl=grp_(g,0.0205,HL+0.024,-0.15); mesh_(gB(0.012,0.04,0.05,0.006,0,0),MM.cu,cl); mesh_(gHex(0.013,0.006,'x',0.015,0,0),MM.hw,cl);
    const wpts=[V(0.03,HL+0.024,-0.15),V(0.09,HL+0.03,-0.2),V(0.14,HL+0.01,-0.32),V(0.16,0.012,-0.45)]; const wr=mesh_(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wpts),24,0.0022,6,false),MM.gy,g);
    const tw=grp_(g,0,YR,0.3); const tg=mesh_(gRing(0.0105,0.0055,0.0016,'x',-0.0254,0,0,18),MM.cu,tw); mesh_(gHex(0.017,0.008,'x',-0.0295,0,0),MM.a2,tw);
    const P=[{nm:'Затискач до лаги + провід Cu 6 мм²',sz:'опір ≤ 0,2 Ом',m:null,q:38,qs:'38 (19 × 2)',o:cl,ex:[0.1,0.06,0]},{nm:'Провід Cu 6 мм² до провідника вирівнювання',sz:'жовто-зелений',m:null,q:'',o:wr,ex:[0.14,0.04,0]},
      {nm:'Шайба контактна зубчаста',sz:'під гайки болтів гільз — каркас неперервний',m:null,q:3790,o:tg,ex:[-0.1,0.06,0]}];
    const sh=T.shot(8,{title:'Зразок: приєднання каркаса',text:'Ризик за ДСТУ EN 62305-2:2022 з узгодженою системою ПЗІП — щогли не потрібні (Том 7). Каркас лаг з\'єднаний зубчастими шайбами, кожен блок — 2 приєднання.',parts:P,
      kv:[['Блоків каркаса','19','П'],['Приєднань','38','П'],['Провідник ПВ-3 1×6','596,5 м траси','П']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(SF).add(V(0.04,0.05,0)),az:lerp(0.75,1.5,s5(u)),el:0.45,dist:lerp(1.1,0.95,u),fov:34}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+3.6,lb:sh.t1-0.4,root:g});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=on; if(!on) return; g.matrix.copy(SF); g.matrixWorldNeedsUpdate=true; explode(P,t,sh.t0+2.4,sh.t1-1.6,0.2); need=true; }));
    const t2=T.t, pr=[], tt=[]; const all=OU.net.concat(OU.net_wh); let L=0; all.forEach(s=>L+=Math.hypot(s[1][0]-s[0][0],s[1][1]-s[0][1])); let acc=0;
    all.forEach(s=>{ const pts=route(s[0][0],s[0][1],s[1][0],s[1][1],0.2,0.1), l=Math.hypot(s[1][0]-s[0][0],s[1][1]-s[0][1]); for(let i=1;i<pts.length;i++){ pr.push(pts[i-1],pts[i]); tt.push(t2+0.4+6.8*(acc+l*i/pts.length)/L); } acc+=l; });
    T.up(new LRev(fatLines(pr,0x2fa84f,3,R),tt));
    const dots=[]; BLK.forEach(b=>b.p.forEach(p=>dots.push(p))); const dG=new THREE.SphereGeometry(0.2,14,10); const dMv=T.up(new Mover([[dG,new THREE.MeshBasicMaterial({color:lc(0x2fa84f)})]],dots.length,R,{mode:'pop',cast:false}));
    dots.forEach((p,i)=>{ dMv.F[i]=new M4().compose(W(p[0],p[1],roofZ(p[0])+0.18),new Q(),ONE3); dMv.ts[i]=t2+1.0+i*0.15; dMv.td[i]=0.4; }); dMv.times();
    T.shot(10,{title:'Провідник вирівнювання і приєднання',text:'ПВ-3 1×6 зеленою лінією — у лотках уздовж ліній DC до спуску; 38 приєднань блоків каркаса.',nd:'Провідник у двійнику — по трасах 25.10 (на нові лотки ще не перекладено).',
      cam:u=>({tgt:V(50,6,-48),az:lerp(1.25,0.95,s5(u)),el:0.9,dist:120,fov:38}),mus:'drive'});
    T.counter({nm:'Приєднання блоків каркаса',tot:dots.length,n:t=>dMv.placed(t)}); T.counter({nm:'Провідник ПВ-3 1×6, м траси',tot:596.5,n:t=>Math.round(596.5*c01((t-t2-0.4)/6.8)*10)/10,unit:'м'}); }

  // ===== акт 12. Накопичувач енергії
  T.act('uze','Накопичувач енергії','3 контейнери Golen LES-H20 краном на плити Фп-1 біля фасаду по осі 17, торцем до стіни, 3,0 м від неї (Том 8).');
  const conts=BS?BS.K.map(k=>{ const c=golenH20(k); c.visible=false; R.add(c); return {k,c,F:c.matrix.clone().compose(c.position.clone(),c.quaternion.clone(),ONE3)}; }):[];
  { const t0=T.t; const twin=ESS.filter(o=>o.parent===G.oursBase&&!o.isInstancedMesh), slabs=twin.filter(o=>o.isMesh&&(o.material===MAT.slab||o.material===UZM.plat)), shv=twin.filter(o=>o.isMesh&&o.material===MAT.cab);
    T.prep.push(()=>{ twin.forEach(o=>{ rVis(o); o.visible=false; }); });
    T.up(new VAct([UZ.trench].filter(Boolean),t0+0.6,null)); T.up(new VAct(slabs,t0+1.6,null)); T.up(new VAct(shv,t0+3.2,null));
    T.shot(6,{title:'Траншея, плити, шафи вводу',text:'Траншея з трубами ПНД від ТП-5913 до контейнерів, плити Фп-1 на щебеневій підготовці, шафи вводу ШВ біля фасаду.',
      kv:[['Плита Фп-1','7 058 × 3 438 × 250, C20/25 F100 W4','П'],['Траншея',nf(BS?BS.Q.trench_len:0,1)+' м','П'],['Шафи вводу ШВ','3','П']],cam:u=>({tgt:W(101,62,1),az:lerp(1.75,1.45,s5(u)),el:0.48,dist:lerp(48,40,u),fov:38})});
    // 12.2 перший контейнер — докладно краном (камера з одного боку осі крана), двері відчиняються; 12.3 ще два, лінії AC і Al
    const CR2={X:113.5,Y:64}, cr2=new Crane(R,CR2.X,CR2.Y), cc=W(CR2.X,CR2.Y,0); cr2.parts.forEach(o=>o.visible=false); cr2.rope.visible=cr2.sl.visible=false;
    const t2=T.t, order=[1,0,2].filter(i=>conts[i]), tl=[t2+0.6,t2+12.6,t2+17.4], dur=[8.6,4.6,4.6];
    const truck=k=>T_(CR2.X+6,1.25,-(CR2.Y-6+k*0.0)).multiply(Ry(Math.PI/2));
    const LF=order.map((ci,j)=>{ const c=conts[ci], B=new M4().compose(c.c.position.clone(),new Q(),ONE3); return {c,lp:liftPath(truck(j),B,cc,tl[j],tl[j]+dur[j],10.5)}; });
    T.up(new Fn(t=>{ LF.forEach(({c,lp})=>{ const on=t>=lp.t0-0.2; c.c.visible=on; if(!on) return; lp.pose(Math.min(t,lp.t1),_m); _m.decompose(c.c.position,_qa,_sa); c.c.quaternion.copy(_qa); });
      const act=LF.find(x=>t>=x.lp.t0-1.2&&t<x.lp.t1+1.4), on=t>=t2-0.3&&t<t2+24; cr2.parts.forEach(o=>o.visible=on); cr2.rope.visible=on; if(!on){ cr2.sl.visible=false; return; }
      const PK=W(CR2.X-1,CR2.Y+6,8); let h=PK, cs=null; if(act){ const lp=act.lp; lp.pose(Math.min(Math.max(t,lp.t0),lp.t1),_m); _m.decompose(_v,_qa,_sa); const top=_v.clone(); top.y+=5.4;
        if(t<lp.t0+lp.t1*0+(lp.t1-lp.t0)*0.16) h=PK.clone().lerp(top,s5((t-(lp.t0-1.2))/1.2+0.0)); else if(t<lp.land) { h=top; cs=[[2.9,1.1],[-2.9,1.1],[-2.9,-1.1],[2.9,-1.1]].map(([x,z])=>new V3(x,2.95,z).applyMatrix4(_m)); } else h=top.clone().lerp(PK,s5((t-lp.land)/1.4)); }
      cr2.set(h,cs); need=true; }));
    obstAdd(cr2.g); [cr2.b1,cr2.b2,cr2.b3].forEach(o=>obstAdd(o));
    // двері першого контейнера
    const C0=LF[0].c.c, doors=[]; C0.traverse(o=>{ if(o.isMesh&&o.material===UZM.door&&o.position.z>1) doors.push(o); });
    const piv=doors.map(o=>{ const w=o.geometry.parameters.width, p=grp_(C0,o.position.x-w/2,o.position.y,o.position.z); C0.remove(o); o.position.set(w/2,0,0); p.add(o); return p; });
    const tD=tl[0]+dur[0]+0.4;
    T.up(new Fn(t=>{ piv.forEach((p,i)=>{ p.rotation.y=-1.7*s5((t-tD-i*0.25)/1.6)*(1-s5((t-tD-6.2)/1.4)); }); }));
    const K0=LF[0].c.k;
    T.shot(12,{title:'Контейнер Golen LES-H20 краном',text:`Кран переносить ${K0.id} з машини на плиту; камера — з одного боку від осі «кран — плита». Двері відчиняються.`,
      kv:[['АКБ / PCS','1 205 кВт·год / 500 кВт','П'],['Маса','≈ 20 т','П'],['Ціна','190 000 $ FOB × 3 = 570 000 $','П'],['Доставка','15 000 $ за контейнер','З']],
      cam:u=>u<0.72?{tgt:W(lerp(CR2.X+2,102.6,s5((u-0.1)/0.55)),lerp(CR2.Y-4,K0.yc,s5((u-0.1)/0.55)),lerp(2,4.5,s5(u/0.5))),az:lerp(2.25,2.0,u),el:0.22,dist:lerp(34,30,u),fov:40}:{tgt:W(102.6,K0.yc,1.6),az:lerp(2.4,2.75,s5((u-0.72)/0.28)),el:0.2,dist:lerp(14,11,s5((u-0.72)/0.28)),fov:38},slow:true,mus:'calm'});
    const t3=T.t;
    T.up(new VAct([UZ.ac].filter(Boolean),t3+7,null)); T.up(new VAct([UZ.dc].filter(Boolean),t3+8,null));
    T.shot(12,{title:'Ще два контейнери і лінії',text:'Лінії AC до ТП-5913 (мідь, вимога Golen) і лінії Al від спуску по фасаду до шаф вводу.',
      kv:[['AC на контейнер','18 × 1×120 + 6 × 1×95, мідь','П'],['Захист на початку лінії','QF 800 А у ТП-5913','П'],['УЗЕ разом',BS?nf(BS.cost.tot)+' $ без ПДВ':'—','П']],
      cam:u=>({tgt:W(lerp(104,101,s5(u)),lerp(62,58,s5(u)),2),az:lerp(1.95,1.55,s5(u)),el:lerp(0.3,0.5,s5(u)),dist:lerp(40,52,s5(u)),fov:38}),mus:'drive'});
    const nC=t=>LF.filter(x=>t>=x.lp.land).length;
    T.counter({nm:'Контейнери Golen LES-H20',tot:3,n:nC}); T.counter({nm:'Ємність, кВт·год',tot:3615,n:t=>nC(t)*1205,unit:'кВт·год'}); T.counter({nm:'Обладнання, $ FOB',tot:570000,n:t=>nC(t)*190000,unit:'$'}); }

  // ===== акт 13. Підсумок
  T.act('sum','Підсумок','Наш варіант Б змонтовано.');
  T.shot(15,{title:'Станція змонтована',text:'1 925 панелей 730 Вт — 1 405,25 кВтп; 3 накопичувачі по 1 205 кВт·год. Підсумок — у картці над моделлю.',
    cam:u=>({tgt:V(58,4,-46),az:lerp(0.7,0.7+120*D2R,s5(u)),el:lerp(0.5,0.42,u),dist:lerp(175,190,u),fov:38}),mus:'end',sum:true});
  T.done();
  // підготовка сцени: прибрати кріплення двійника, показати базу (будівлі), склад — свій
  T.prep.push(()=>{ [ourMods,lagMesh,OUR.blk,OUR.mat,OUR.sl,OUR.cp,OUR.rods,OUR.xp,OUR.ang,OUR.cl,OUR.an,oBZ.boxes].forEach(o=>{ if(o){ rVis(o); o.visible=false; } });
    [G.oursBZ,G.ep].forEach(g=>{ if(g){ rVis(g); g.visible=false; } }); if(G.uze){ rVis(G.uze); G.uze.visible=true; G.uze.children.forEach(o=>{ rVis(o); o.visible=false; }); if(UZ.lbl) UZ.lbl.children.forEach(o=>{ rVis(o); o.visible=false; }); }
    WHI.forEach(w=>{ rVis(w.im); w.im.visible=false; }); rVis(MARKS); MARKS.visible=false; });
  T.sum=()=>sumOurs(T);
  T.demo={DL,DJ,dB,dSl,dXp,dBox,dStr,DX,Y:DBk.Y};
  return T; }

// склад: ланцюжки модулів довгою стороною один до одного; рейки під точками, притиски на краях ланцюжків і стиках (розрахунок складу 26.10, ред. 2)
function whLayout(skip){ const items=[[],[]]; [WHM.filter(m=>m.land),WHM.filter(m=>!m.land)].forEach((L,w)=>L.forEach((m,k)=>{ const key=w+':'+k; if(!skip||!skip.has(key)) items[w].push({m,w,k,key}); }));
  const groups=new Map(); items.flat().forEach(it=>{ const m=it.m, g=m.land?('W'+Math.round(m.X)):(m.part+'_'+m.Y.toFixed(1)); if(!groups.has(g)) groups.set(g,[]); groups.get(g).push(it); });
  const rails=[], cl=[], mods=[]; const STEP=1.34;
  groups.forEach(L=>{ const land=L[0].m.land; L.sort((a,b)=>land?a.m.Y-b.m.Y:a.m.X-b.m.X); const ch=[]; let cur=[L[0]];
    for(let j=1;j<L.length;j++){ const d=land?L[j].m.Y-L[j-1].m.Y:L[j].m.X-L[j-1].m.X; if(d>STEP*1.5){ ch.push(cur); cur=[]; } cur.push(L[j]); } ch.push(cur);
    ch.forEach(c=>{ const n=c.length; for(let e=0;e<=n;e++){ const a=c[e-1], b=c[e], ref=(b||a).m, adj=[a,b].filter(Boolean).map(x=>x.key), z=e===0||e===n?1:0;
        let ex; if(land){ ex=e===0?ref.Y-0.6715:e===n?ref.Y+0.6715:(a.m.Y+b.m.Y)/2; } else { ex=e===0?ref.X-0.67:e===n?ref.X+0.67:(a.m.X+b.m.X)/2; }
        [-0.596,0.596].forEach(q=>{ const X=land?ref.X+q:ex, Y=land?ex:ref.Y+q; rails.push({X,Y,part:ref.part,land}); cl.push({X,Y,part:ref.part,land,z,adj}); }); } }); });
  items.flat().forEach(it=>mods.push(it)); mods.sort((a,b)=>b.m.X-a.m.X||a.m.Y-b.m.Y);
  return {rails,cl,mods,nz:cl.filter(c=>c.z).length,nm:cl.filter(c=>!c.z).length}; }

// підсумок нашого Б
function massBy(T,t){ const g={blk:0,met:0,mod:0,el:0,whmod:0}; T.cnt.forEach(c=>{ if(!c.g) return; const n=c.n(t); g[c.g]+=c.mf?c.mf(t):(c.m||0)*n; }); return g; }
const AREA=(SHOP[1]-SHOP[0])*(SHOP[3]-SHOP[2]);
function sumOurs(T){ const t=T.T, g=massBy(T,t), E=EPX, rr=new Set(E.rr); let gen=0; YEAR.kwh.ours.forEach((v,i)=>{ if(!rr.has(i)) gen+=v; });
  const whIdx=[WHM.filter(m=>m.land),WHM.filter(m=>!m.land)], rw=new Set(); E.rw.forEach(j=>{ const p=EP.whi[j]; if(p) rw.add(p[0]===0?p[1]:whIdx[0].length+p[1]); }); YEAR.kwh.whours.forEach((v,i)=>{ if(!rw.has(i)) gen+=v; });
  const roof=g.blk+g.met+g.mod+g.el; const pl=BS.cost.plant;
  return {title:'Наш варіант Б',rows:[['Панелі','1 925','1 749 цех + 176 склад, ZNSHINE 730 Вт'],['Потужність','1 405,25 кВтп',''],['Генерація за рік',nf(gen/1000,1)+' МВт·год','одна модель двійника для обох проєктів, з тінями'],
    ['Баласт на даху цеху',ft(g.blk),'блоки 13 кг і мати 0,4 кг (лаги, профілі, рами щитів, опори лотків)'],['Метал і метизи',ft(g.met),'лаги, профілі, гільзи, кутники, болти, гайки, шайби з відомою масою'],['Модулі на цеху',ft(g.mod),'1 749 × 36,5 кг'],['Електрика на даху',ft(g.el),'рами щитів, кабелі 1×6, лінії Al'],
    ['Разом на дах цеху',ft(roof),nf(roof/AREA,1)+' кг/м² у плані ('+nf(AREA,0)+' м²)'],['Склад',ft(g.whmod),'176 модулів; маса рейок і притисків не вказана'],['Накопичувачі','3 × 1 205 = 3 615 кВт·год','3 × Golen LES-H20, 570 000 $ FOB; УЗЕ разом '+nf(BS.cost.tot)+' $'],
    ['Станція під ключ, з ПДВ',nf(pl.cn.price)+' / '+nf(pl.ua.price)+' $','матеріали з Китаю / з України']],
    note:'Маси без паспорта (шпильки, притиски, MC4, щити у зборі, лотки, траверси, міні-рейки, анкери) у підсумок не входять. Том 3 КМ: на даху цеху з модулями 152,9 т (на 1 773 модулі, без рам щитів і опор лотків).'}; }


// ================= Вінницький проєкт (РП 2025/12-07): 11 актів; невідповідності РП — «зупинки»: наїзд, червоний номер, пауза з карткою, відхід
function viewSpec(v,dz){ const c=new V3(...v.c), p=new V3(...v.p), d=p.clone().sub(c), D=d.length(); return {tgt:c,az:Math.atan2(d.x,d.z),el:Math.asin(Math.max(-1,Math.min(1,d.y/D))),dist:D*(dz||1),fov:38}; }
function buildRP(){ const T=new TL('rp'), R=T.root;
  const misT=id=>{ const i=MIS.findIndex(m=>m.id===id); return i<0?null:{n:i+1,m:MIS[i]}; };
  const stop=(t0,t1,id)=>{ const x=misT(id); if(x) T.stops.push({t0,t1,id,n:x.n,t:x.m.t,d:typeof x.m.d==='function'?x.m.d():x.m.d}); };
  const stopShot=(dur,id,title,extra)=>{ const x=misT(id); const s=T.shot(dur,Object.assign({title:`Невідповідність ${x.n}: ${title}`,text:typeof x.m.d==='function'?x.m.d():x.m.d,cam:u=>{ const v=viewSpec(x.m.view()); v.az+=0.25*(s5(u)-0.5); v.dist*=lerp(1.05,0.92,s5(u)); return v; },slow:true},extra||{})); stop(s.t0+0.3,s.t1,id); return s; };
  // ряди трикутників (відрізки рядів), блоки — 2 під трикутник, центри за 65 мм від торців основи 1 400 (АБ арк. 6)
  const NT=RT.length, BLR=[]; RT.forEach((t,i)=>{ [0.065,1.335].forEach(d=>BLR.push({X:t.X,Y:t.Y-MOD_X+d,t:i})); });
  const segs=new Map(); RT.forEach((t,i)=>{ if(!segs.has(t.si)) segs.set(t.si,[]); segs.get(t.si).push(i); });
  const clear=(X,Y,r)=>S.obs.every(o=>Math.hypot(o[0]-X,o[1]-Y)>o[2]/2+r)&&S.lan.every(q=>X<q[0]-r||X>q[1]+r||Y<q[2]-r||Y>q[3]+r);
  let dT=0,bd=1e9; RT.forEach((t,i)=>{ if(t.k!==2*t.n||t.n<4) return; const d=Math.abs(t.Y-46)+Math.abs(t.X-88)*0.3; if(d<bd&&clear(t.X,t.Y,4)){ bd=d; dT=i; } });
  const DT=RT[dT], dSeg=segs.get(DT.si), dBl=dT*2+1, roofP=(X,Y,h)=>W(X,Y,roofZ(X)+(h||0));
  // ===== 0. Об'єкт
  T.act('intro','Об\'єкт','Вінницький проєкт РП 2025/12-07: модулі Shinefar 710 Вт на баластних трикутниках RUDNIK 15°, 53 щогли, 3 майданчики FFD + 15 Galaxy261L.');
  T.shot(8,{title:'Що будуємо за РП',text:'1 440 модулів 710 Вт (1 260 цех + 180 склад), 1 022,4 кВтп. Невідповідності РП показано по ходу монтажу — червоним, з номером зі списку двійника.',
    kv:[['Модулі','1 260 + 180 = 1 440','П'],['Потужність','1 022,4 кВтп','П'],['Трикутники','2 702 (оцифровка плану РП)','Р'],['Стрінги','80 по 17–19','П'],['УЗЕ','3 × FFD 500 кВт + 15 × Galaxy261L','П']],
    cam:u=>({tgt:V(56,4,-44),az:lerp(1.05,0.78,s5(u)),el:lerp(0.35,0.6,s5(u)),dist:lerp(260,165,s5(u)),fov:38}),mus:'calm'});
  // ===== 1. Розмітка: шнури по осях блоків рядів і хрестики
  T.act('mark','Розмітка','Шнури рядів по осях блоків і хрестик під кожен блок трикутника — за планом покрівлі РП (оцифровка).');
  const crossGeo=gMerge([gB(0.34,0.003,0.016,0,0.0015,0),gB(0.016,0.003,0.34,0,0.0015,0)]), crossMv=T.up(new Mover([[crossGeo,MM.chalk]],BLR.length,R,{mode:'pop',cast:false,fl:0}));
  { const a=T.t, dA=a+1.2, fA=a+6.2, fB=a+11.4, P2=[], T2=[];
    const segT=si=>{ const L=segs.get(si), t0=RT[L[0]]; const e=Math.min(t0.X,96.6-RT[L[L.length-1]].X,t0.Y,96.6-t0.Y); return si===DT.si?dA:fA+(fB-fA-0.8)*c01(e/48)+0.1*hsh(si); };
    const cp=[], ct=[]; segs.forEach((L,si)=>{ const a0=RT[L[0]], a1=RT[L[L.length-1]]; [0.065,1.335].forEach(d=>{ const y=a0.Y-MOD_X+d, seg=route(a0.X-0.3,y,a1.X+0.3,y,0.005,0), t0=segT(si); for(let i=1;i<seg.length;i++){ cp.push(seg[i-1],seg[i]); ct.push(t0+(si===DT.si?1.4:0.6)*i/seg.length); } }); });
    const o=ct.map((t,i)=>i).sort((x,y)=>ct[x]-ct[y]); o.forEach(i=>{ P2.push(cp[2*i],cp[2*i+1]); T2.push(ct[i]); }); const cord=fatLines(P2,0x2f6fd6,3,R,{ro:4}); var cordR=T.up(new LRev(cord,T2));
    BLR.forEach((b,i)=>{ crossMv.F[i]=frm(b.X,b.Y,0.0005); const dm=RT[b.t].si===DT.si; crossMv.ts[i]=dm?dA+1.6+Math.abs(RT[b.t].X-DT.X)/12*2.4:fA+(fB-fA-0.6)*c01(Math.min(b.X,96.6-b.X,b.Y,96.6-b.Y)/48)+0.2*hsh(i); crossMv.td[i]=0.3; });
    T.shot(5,{title:'Демо-ряд',text:'Два шнури по осях блоків ряду; хрестик під кожен блок — центри за 65 мм від торців основи 1 400.',cam:u=>({tgt:roofP(DT.X-3,DT.Y-MOD_X+0.7,0),az:lerp(0.35,0.7,s5(u)),el:0.95,dist:15,fov:38}),slow:true});
    T.shot(7,{title:'Розмітка всього даху',text:'Ряди трикутників схід — захід; шнури й хрестики від усіх країв до середини.',cam:u=>({tgt:V(50,6,-48),az:lerp(1.3,1.05,s5(u)),el:0.85,dist:130,fov:38}),mus:'drive'});
    T.counter({nm:'Хрестики під блоки',tot:BLR.length,n:t=>crossMv.placed(t)}); }
  // ===== 2. Баласт на матах
  T.act('blk','Баласт на матах','Баласт B300300-60, 13 кг — 2 на трикутник; мат під кожен блок; гвинт R-LX 6,3×50 крізь основу (АБ арк. 6, 8).');
  const bG=gMerge([gTint(gB(0.32,0.003,0.32,0,0.0015,0),0x262626),gTint(gB(0.3,0.06,0.3,0,0.033,0),0x9d9a93)]);
  const CR={X:107.5,Y:43}, crane=new Crane(R,CR.X,CR.Y); crane.parts.forEach(o=>obstAdd(o));
  const BPALS=makePallets(BLR.map((b,i)=>i===dBl?null:[b.X,b.Y]),60,['W','E','S','N'],1.2); let bp0=0; { let bb=1e9; BPALS.forEach((p,k)=>{ const d=Math.hypot(p.X-DT.X,p.Y-DT.Y)+(p.e==='E'?0:1000); if(d<bb){ bb=d; bp0=k; } }); }
  const BP=sortPallets(BPALS,bp0), bPal=T.up(new Pals([[palletGeo(1.2,0.8),MM.wood]],BP.length,R)), bMv=T.up(new Mover([[bG,MM.vc]],BLR.length,R,{pals:bPal,arc:1.0}));
  crossMv.hide=new Float32Array(BLR.length).fill(1e9);
  { // 2.1 зразок над хрестиком: блок без закладної, гвинт R-LX крізь основу трикутника
    const b0=BLR[dBl], SBF=frm(b0.X,b0.Y,0), g=grp_(R); g.visible=false; g.matrixAutoUpdate=false;
    const mt=mesh_(gB(0.32,0.003,0.32,0,0.0015,0),MM.mat,g), bk=mesh_(gB(0.3,0.06,0.3,0,0.033,0),MM.concX.clone(),g,false), sc=grp_(g,0,0.07,0); mesh_(gHex(0.008,0.004,'y',0,0.002,0),MM.hw,sc); mesh_(gC(0.0032,0.05,10,'y',0,-0.025,0),MM.thr,sc);
    const P=[{nm:'Мат під баласт',sz:'під кожен блок',m:null,q:5396,qs:'5 396 (АБ арк. 8)',o:mt,ex:[0,-0.1,0]},{nm:'Баласт B300300-60',sz:'300×300×60, без закладної',m:13,q:BLR.length,qs:nf(BLR.length)+' у 3D',o:bk,ex:null},{nm:'Гвинт R-LX 6,3×50',sz:'крізь основу трикутника в блок',m:null,q:5396,o:sc,ex:[0,0.22,0]}];
    const sh=T.shot(10,{title:'Зразок: баласт на маті',text:'Блок висить над першим хрестиком, бетон прозорий: закладної немає — основу трикутника кріплять гвинтом R-LX прямо в бетон.',parts:P,
      kv:[['Блоків у 3D',nf(BLR.length)+' (2 × '+nf(NT)+')','Р'],['За АБ арк. 8','мати 5 396, гвинти 5 396','П']],cam:u=>({tgt:new V3().setFromMatrixPosition(SBF).add(V(0,0.95,0)),az:0.6+u*200*D2R,el:0.45,dist:1.15,fov:36}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+4.2,lb:sh.t1-2.6,root:g});
    const tLand=sh.t1-0.2; T.up(new Fn(t=>{ const on=t>=sh.t0&&t<tLand; g.visible=on; if(!on) return; explode(P,t,sh.t0+2.6,sh.t1-3.0); const k=s5((t-(sh.t1-1.6))/1.4); g.matrix.copy(SBF).multiply(T_(0,1.0*(1-k),0)).multiply(Ry((t-sh.t0)/10*0.8*(1-k))); g.matrixWorldNeedsUpdate=true; const op=t<sh.t1-2.2?0.25:1; bk.material.opacity=op; bk.material.transparent=op<1; bk.material.depthWrite=op>=1; need=true; }));
    bMv.F[dBl]=SBF; bMv.ts[dBl]=tLand; bMv.td[dBl]=0.01; crossMv.hide[dBl]=tLand;
    // 2.2 кран; 2.3 палети по периметру; 2.4 усі фронти
    const t3=T.t, P0=BP[0], R0=palMat(P0,'x'), truck=T_(CR.X+5.5,0.95,-(CR.Y+6.5)).multiply(Ry(Math.PI/2)), c=W(CR.X,CR.Y,0), lp=liftPath(truck,R0,c,t3+0.4,t3+8.0,17.5);
    bPal.custom[0]=lp; bPal.R[0]=R0; bPal.a[0]=t3;
    const PK=W(CR.X-1,CR.Y-6,9.5);
    T.up(new Fn(t=>{ const on=t>=t3-0.5&&t<t3+10; crane.parts.forEach(o=>o.visible=on); crane.rope.visible=on; if(!on){ crane.sl.visible=false; return; } let h=PK, cs=null;
      if(t>=t3+0.4&&t<=t3+9.4){ lp.pose(t,_m); _m.decompose(_v,_qa,_sa); const top=_v.clone(); top.y+=2.9; if(t<t3+1.6) h=PK.clone().lerp(top,s5((t-t3-0.4)/1.2)); else if(t<t3+7.6){ h=top; cs=[[0.6,0.4],[-0.6,0.4],[-0.6,-0.4],[0.6,-0.4]].map(([x,z])=>new V3(x,PAL_H+0.52,z).applyMatrix4(_m)); } else h=top.clone().lerp(PK,s5((t-t3-7.6)/1.6)); }
      crane.set(h,cs); }));
    T.shot(9,{title:'Кран подає палету',text:'Автокран на тому самому місці, що й для нашого варіанта; палета — 60 блоків (рішення власника 26.10).',kv:[['Палет',nf(BP.length),'Р'],['На палеті','60 блоків','З']],
      cam:(u,t)=>{ lp.pose(Math.max(lp.t0,Math.min(t,lp.t1)),_m2); const p=new V3().setFromMatrixPosition(_m2); p.y=Math.max(3,p.y-1); return {tgt:p,az:lerp(2.45,2.15,u),el:lerp(0.2,0.3,u),dist:lerp(30,34,u),fov:40}; },slow:true});
    const t4=T.t; for(let k=1;k<BP.length;k++){ bPal.R[k]=palMat(BP[k],'x'); bPal.a[k]=t4+0.2+(k-1)/(BP.length-1)*3.2; }
    T.shot(6,{title:'Палети по периметру',text:`${BP.length} палет по 60 — уздовж країв даху, над стінами.`,cam:u=>({tgt:new V3().setFromMatrixPosition(R0).lerp(V(50,6,-48),s5(u)),az:lerp(2.15,1.45,s5(u)),el:lerp(0.3,0.62,s5(u)),dist:lerp(34,150,s5(u)),fov:38})});
    const t5=T.t, S5=t5+0.3, D5=8.6;
    BP.forEach((p,k)=>{ const n=p.items.length; let last=0; p.items.forEach((bi,r)=>{ const q=n-1-r, layer=Math.floor(q/8), cc=q%8; bMv.slot[bi]=T_(-0.45+(cc%4)*0.3,PAL_H+layer*0.063,-0.15+Math.floor(cc/4)*0.3); bMv.pal[bi]=k; bMv.F[bi]=frm(BLR[bi].X,BLR[bi].Y,0);
        const ts=k===0&&r<6?S5+r*0.9:S5+(r/60)*(D5-1)+0.3*(hsh(bi)-0.5), td=k===0&&r<6?1.2:0.6; bMv.ts[bi]=ts; bMv.td[bi]=td; crossMv.hide[bi]=ts+td; last=Math.max(last,ts+td); }); bPal.v[k]=last+0.25; });
    T.shot(9,{title:'Усі фронти',text:'Блоки з усіх палет одночасно, на мати. Основа трикутника — гвинтами R-LX у блоки.',cam:u=>({tgt:V(50,6,-48),az:lerp(1.2,1.6,s5(u)),el:0.72,dist:135,fov:38}),mus:'drive'});
    { const SC=[[3,5,0xf1d36b],[5,10,0xf0a040],[10,15,0xe06a2c],[15,99,0xb83226]], L=RMOD.map((m,j)=>j).filter(j=>RMOD[j].slope>=3), ov=new THREE.InstancedMesh(new THREE.BoxGeometry(2.38,0.02,1.3),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.75,depthWrite:false}),Math.max(1,L.length));
      L.forEach((j,k)=>{ const m=RMOD[j]; ov.setMatrixAt(k,RT[m.i].F.clone().multiply(T_(0,0.09,-MOD_X))); const c=SC.find(x=>m.slope>=x[0]&&m.slope<x[1]); ov.setColorAt(k,lc(c[2])); }); ov.frustumCulled=false; ov.visible=false; R.add(ov);
      const st=stopShot(6,'slope','незакріплений баласт на ухилі до 16°',{kv:[['3–5°','жовті','Р'],['5–10°','помаранчеві','Р'],['10–15°','червоно-помаранчеві','Р'],['понад 15°','темно-червоні','Р']]}); T.up(new VAct([ov],st.t0,st.t1+0.4)); }
    T.counter({nm:'Баласт B300300-60 (у 3D)',tot:BLR.length,n:t=>bMv.placed(t),m:13,g:'blk'}); T.counter({nm:'Палети з блоками на даху зараз',tot:BP.length,n:t=>bPal.count(t),cur:1}); }
  // ===== 3. Трикутники
  T.act('tri','Трикутники','Трикутник BalZn15-1568.1470, 15° (АБ арк. 6): U 45×40×3, основа 1 400, пояс 1 160, стійка ≈345, 3 болти M8 — збирають унизу, краном на дах, на блоки.');
  const triG=gMerge(['base','rail','strut'].map(k=>gTint(obbGeo(k),0xb9c2c9)));
  const TABLE=new M4().compose(W(116.5,40,0.9),new Q().setFromAxisAngle(YA,Math.PI/2),ONE3);
  { const t0=T.t; const tg=grp_(R); tg.visible=false; { const tb=grp_(tg); tb.applyMatrix4(TABLE); mesh_(gB(0.9,0.05,1.8,0,-0.025,-0.7),MM.wood,tb); [-0.35,0.35].forEach(x=>[0.1,-1.5].forEach(z=>mesh_(gB(0.06,0.88,0.06,x,-0.47,z),MM.craneD,tb))); }
    const asm=grp_(tg); asm.applyMatrix4(TABLE); const parts={}; [['base',MM.zn],['strut',MM.zn],['rail',MM.zn],['hw',MM.hw]].forEach(([k,m])=>{ const g=grp_(asm); mesh_(partGeo(k),m,g); parts[k]=g; }); tg.updateMatrixWorld(true); const AC=new THREE.Box3().setFromObject(asm).getCenter(new V3());
    const P=[{nm:'Основа U 45×40×3, 1 400',sz:'на 2 блоки',m:null,q:NT,o:parts.base,ex:[0,0,0]},{nm:'Стійка U 45×40×3, ≈345',sz:'',m:null,q:NT,o:parts.strut,ex:[0,0.25,0]},{nm:'Пояс U 45×40×3, 1 160',sz:'під модуль 1 134 мм',m:null,q:NT,o:parts.rail,ex:[0,0.5,0]},{nm:'Болти M8 з гайками',sz:'3 на трикутник, у перехрестях прорізів',m:null,q:'',o:parts.hw,ex:[0.3,0.4,0]}];
    const sh=T.shot(14,{title:'Збирання трикутника внизу',text:'Біля крана, на столі: основа → стійка → пояс → 3 болти M8 у перехрестях заводських прорізів (нічого не свердлиться).',parts:P,
      kv:[['Маса трикутника','≈6,73 кг (наша 3D-модель)','Р'],['Кут','15°','П'],['Трикутників',nf(NT),'Р']],cam:u=>({tgt:AC.clone().add(V(0,0.12,0)),az:lerp(2.3,2.3+200*D2R,s5(u)),el:0.42,dist:lerp(2.4,2.0,u),fov:38}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+11.0,lb:sh.t1,root:tg});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1+31; tg.visible=on; if(!on) return; const u=t-sh.t0-2.2; const f=(a,b)=>s5((u-a)/(b-a));
      parts.base.position.set(0,0.6*(1-f(0.4,1.6)),0); parts.base.visible=u>0.4; parts.strut.position.set(0,0.5*(1-f(2.0,3.4)),0); parts.strut.visible=u>2.0; parts.rail.position.set(0,0.6*(1-f(3.8,5.4)),0); parts.rail.visible=u>3.8;
      parts.hw.position.set(0.25*(1-f(5.8,7.2)),0,0); parts.hw.visible=u>5.8; asm.visible=u<sh.t1-sh.t0+0.5; need=true; }));
    stopShot(6,'mod','пояс 1 160 під модуль 1 134');
    // 3.2 кран — палета трикутників на бік, 30 у стосі (у даних немає, умовно); 3.3 решта палет; 3.4 перший трикутник на блоки; 3.5 фронти
    const triMv=T.up(new Mover([[triG,MM.vc]],NT,R,{arc:1.4}));
    const TPALS=makePallets(RT.map((t,i)=>i===dT?null:[t.X,t.Y]),30,['W','E','S','N'],1.6); let tp0=0; { let bb=1e9; TPALS.forEach((p,k)=>{ const d=Math.hypot(p.X-DT.X,p.Y-DT.Y)+(p.e==='E'?0:1000); if(d<bb){ bb=d; tp0=k; } }); }
    TPALS[tp0].items.unshift(dT); const TP=sortPallets(TPALS,tp0), tPal=T.up(new Pals([[palletGeo(1.6,1.2),MM.wood]],TP.length,R)); triMv.P=tPal;
    const t3=T.t, P0=TP[0], R0=palMat(P0,'x'), truck=T_(CR.X+5.5,0.95,-(CR.Y+6.5)).multiply(Ry(Math.PI/2)), c=W(CR.X,CR.Y,0), lp=liftPath(truck,R0,c,t3+0.4,t3+7.4,17.5);
    tPal.custom[0]=lp; tPal.R[0]=R0; tPal.a[0]=t3; const PK=W(CR.X-1,CR.Y-6,9.5);
    T.up(new Fn(t=>{ if(t<t3-0.5||t>=t3+9) return; crane.parts.forEach(o=>o.visible=true); crane.rope.visible=true; let h=PK, cs=null;
      if(t>=t3+0.4&&t<=t3+8.6){ lp.pose(t,_m); _m.decompose(_v,_qa,_sa); const top=_v.clone(); top.y+=3.2; if(t<t3+1.5) h=PK.clone().lerp(top,s5((t-t3-0.4)/1.1)); else if(t<t3+7.0){ h=top; cs=[[0.8,0.6],[-0.8,0.6],[-0.8,-0.6],[0.8,-0.6]].map(([x,z])=>new V3(x,PAL_H+0.9,z).applyMatrix4(_m)); } else h=top.clone().lerp(PK,s5((t-t3-7.0)/1.6)); }
      crane.set(h,cs); }));
    const TRI_SIDE=Ry(Math.PI/2).multiply(new M4().makeRotationZ(-Math.PI/2));   // на бік: основа вздовж палети (X), висота трикутника — поперек (−Z), товщина профілю — вгору
    T.shot(8,{title:'Кран: палета трикутників',text:'Трикутники кладуть на бік, у стос. Камера тримається одного боку від осі «кран — край даху».',nd:'Скільки трикутників на палеті — немає в даних (у моделі — умовно 30).',
      cam:(u,t)=>{ lp.pose(Math.max(lp.t0,Math.min(t,lp.t1)),_m2); const p=new V3().setFromMatrixPosition(_m2); p.y=Math.max(3,p.y-1); return {tgt:p,az:lerp(2.45,2.2,u),el:lerp(0.2,0.3,u),dist:lerp(30,33,u),fov:40}; },slow:true});
    const t4=T.t; for(let k=1;k<TP.length;k++){ tPal.R[k]=palMat(TP[k],'x'); tPal.a[k]=t4+0.2+(k-1)/(TP.length-1)*3.2; }
    T.shot(6,{title:'Палети трикутників по периметру',text:`${TP.length} палет — по колу вздовж країв даху.`,cam:u=>({tgt:new V3().setFromMatrixPosition(R0).lerp(V(50,6,-48),s5(u)),az:lerp(2.2,1.45,s5(u)),el:lerp(0.3,0.62,s5(u)),dist:lerp(33,150,s5(u)),fov:38})});
    const t5=T.t, t6=t5+6, S6=t6+0.3, D6=8.6;
    TP.forEach((p,k)=>{ const n=p.items.length; let last=0; p.items.forEach((ti,r)=>{ const q=n-1-r, layer=Math.floor(q/2), side=q%2; triMv.slot[ti]=T_(0.7,PAL_H+0.03+layer*0.058,side?0.55:-0.03).multiply(TRI_SIDE); triMv.pal[ti]=k; triMv.F[ti]=RT[ti].F;
        const ts=ti===dT?t5+0.6:S6+((k===0?r-1:r)/30)*(D6-1)+0.3*(hsh(ti)-0.5), td=ti===dT?2.4:0.7; triMv.ts[ti]=ts; triMv.td[ti]=td; last=Math.max(last,ts+td); }); tPal.v[k]=last+0.3; });
    T.shot(6,{title:'Перший трикутник на блоки',text:'Основа лягає на 2 блоки; гвинти R-LX крізь основу в бетон.',cam:u=>({tgt:new V3().setFromMatrixPosition(DT.F).add(V(0,0.3,0)),az:lerp(1.9,2.3,s5(u)),el:0.5,dist:lerp(6.5,4.2,s5(u)),fov:38}),slow:true});
    T.shot(9,{title:'Усі фронти',text:'Трикутники з палет по периметру — з усіх боків до середини.',cam:u=>({tgt:V(50,6,-48),az:lerp(0.95,1.35,s5(u)),el:0.7,dist:132,fov:38}),mus:'drive'});
    T.up(new VAct([cordR.o],-1,S6+D6));
    stopShot(6,'val','опори одного модуля на різних ухилах');
    T.counter({nm:'Трикутники BalZn15-1568.1470',tot:NT,n:t=>triMv.placed(t),m:6.73,g:'met'}); T.counter({nm:'Палети трикутників на даху зараз',tot:TP.length,n:t=>tPal.count(t),cur:1});
    // крупні плани: детальні трикутники біля камери (до 24), спрощені — далі
    const det=['base','rail','strut','hw'].map(k=>{ const im=new THREE.InstancedMesh(partGeo(k),k==='hw'?MM.hw:MM.zn,24); im.count=0; im.frustumCulled=false; im.castShadow=true; R.add(im); return im; });
    triMv.hideI=new Map(); let cur=[];
    T.post.push(()=>{ const tg=controls.target, near=camera.position.distanceTo(tg)<20&&MT.T===T; cur.forEach(i=>{ triMv.hideI.delete(i); triMv.key[i]=-1; }); cur=[];
      if(near){ const tx=tg.x, ty=-tg.z; cur=RT.map((t,i)=>[(t.X-tx)**2+(t.Y-ty)**2,i]).filter(a=>a[0]<12*12&&triMv.key[a[1]]===3).sort((a,b)=>a[0]-b[0]).slice(0,24).map(a=>a[1]); }
      cur.forEach((i,k)=>{ triMv.hideI.set(i,[-1e9,1e9]); triMv.key[i]=-1; det.forEach(im=>im.setMatrixAt(k,RT[i].F)); }); det.forEach(im=>{ im.count=cur.length; im.instanceMatrix.needsUpdate=true; }); triMv.set(MT.t); need=true; }); }
  // ===== 4. Сполучники
  T.act('con','Сполучники','Сполучник Spol-15Zn-700 між основами сусідніх рядів, болт M8 у кожну основу.');
  const conMv=T.up(new Mover([[obbGeo('con'),MM.hw]],CON.length,R,{mode:'drop',drop:0.4}));
  { const t0=T.t, c0=CON.findIndex(c=>c.i===dT||c.j===dT), C0=CON[c0<0?0:c0];
    const sh=T.shot(5,{title:'Сполучник між рядами',text:'U 38×36×3, L 700 — болт M8 у кожну основу. На кресленні крок рядів 2 000 (1 400 + 600).',kv:[['Сполучників у 3D',nf(CON.length),'Р'],['Маса','≈1,60 кг (наша 3D-модель)','Р']],
      cam:u=>({tgt:new V3(0,0.085,-0.35).applyMatrix4(C0.M),az:lerp(1.2,1.7,s5(u)),el:0.5,dist:lerp(2.4,1.8,s5(u)),fov:38}),slow:true});
    const ord=CON.map((c,j)=>j).sort((a,b)=>Math.min(RT[CON[a].i].X,96.6-RT[CON[a].i].X,RT[CON[a].i].Y,96.6-RT[CON[a].i].Y)-Math.min(RT[CON[b].i].X,96.6-RT[CON[b].i].X,RT[CON[b].i].Y,96.6-RT[CON[b].i].Y));
    ord.forEach((j,k)=>{ conMv.F[j]=CON[j].M; conMv.ts[j]=j===(c0<0?0:c0)?t0+1.2:t0+5.3+(k/ord.length)*4.4; conMv.td[j]=j===(c0<0?0:c0)?1.3:0.4; });
    T.shot(5,{title:'Усі сполучники',text:'Сполучники зв\'язують основи сусідніх рядів по всьому даху.',cam:u=>({tgt:V(55,6,-50),az:lerp(1.3,1.1,u),el:0.8,dist:118,fov:38}),mus:'drive'});
    // зупинка 2: червоні — не дістають до основ
    const bad=CON.map((c,j)=>j).filter(j=>CON[j].ov<=0), red=new THREE.InstancedMesh(gB(0.74,0.06,0.07,0,0.09,-0.35),new THREE.MeshBasicMaterial({color:lc(0xd64545),transparent:true,opacity:0.8,depthWrite:false}),Math.max(1,bad.length));
    bad.forEach((j,k)=>red.setMatrixAt(k,CON[j].M)); red.frustumCulled=false; red.visible=false; R.add(red);
    const st=stopShot(6,'con','сполучник 700 не дістає до основ'); T.up(new VAct([red],st.t0,st.t1+0.4));
    T.counter({nm:'Сполучники Spol-15Zn-700',tot:CON.length,n:t=>conMv.placed(t),m:1.6,g:'met',note:`${nf(bad.length)} не дістають до основ`}); }
  // ===== 5. Модулі, спойлери, притиски
  T.act('pv','Модулі','Модулі Shinefar 710 Вт альбомно на поясах трьох трикутників, спойлер Vitr-240×2450 за стійками, притиски W35 / Z33.');
  const MODL=new M4().compose(new V3(0,MOD_H,-MOD_X),new Q().setFromAxisAngle(XA,15*D2R),new V3(1,1,1));
  const rmTop=gB(2.324,0.003,1.243,0,0.0175+0.0015,0), rmFr=gMerge([gB(2.384,0.035,0.03,0,0,0.6365),gB(2.384,0.035,0.03,0,0,-0.6365),gB(0.03,0.035,1.243,1.177,0,0),gB(0.03,0.035,1.243,-1.177,0,0),gB(2.32,0.002,1.24,0,-0.014,0)]);
  const rmMv=T.up(new Mover([[rmFr,MM.frame],[rmTop,MAT.pvL]],RMOD.length,R,{arc:1.3})), spMv=T.up(new Mover([[partGeo('spoiler'),MAT.sp]],DATA.rpm.sp.length,R,{mode:'drop',drop:0.3,cast:false})), clN=RPM_.cl.count, clMv=T.up(new Mover([[gB(1,1,1),MM.al]],clN,R,{mode:'drop',drop:0.05,cast:false,fl:0.4}));
  { const t0=T.t; const MS=RPM_.mods; const MF=RMOD.map((m,j)=>{ const M=new M4(); MS.getMatrixAt(j,M); M.decompose(_v,_qa,_sa); return new M4().compose(_v,_qa,ONE3); });
    const RMP=makePallets(RMOD.map(m=>[RT[m.i].X,RT[m.i].Y]),33,['W','E','S','N'],2.42); let mp0=0; { let bb=1e9; RMP.forEach((p,k)=>{ const d=Math.hypot(p.X-DT.X,p.Y-DT.Y)+(p.e==='E'?0:1000); if(d<bb){ bb=d; mp0=k; } }); }
    const MP=sortPallets(RMP,mp0), postG=gMerge([[-1.18,-0.62],[1.18,-0.62],[-1.18,0.62],[1.18,0.62]].map(([x,z])=>gB(0.06,1.25,0.06,x,PAL_H+0.62,z))), mPal=T.up(new Pals([[palletGeo(2.42,1.32),MM.wood],[postG,MM.card]],MP.length,R)); rmMv.P=mPal;
    MP.forEach((p,k)=>{ mPal.R[k]=palMat(p,'x'); mPal.a[k]=t0+0.2+k/MP.length*3; });
    const dm=RMOD.findIndex(m=>m.i===dT-1), DM=MF[Math.max(0,dm)], g=grp_(R); g.visible=false; g.matrixAutoUpdate=false; const pg=grp_(g);
    mesh_(rmFr,MM.frame,pg); mesh_(rmTop,MAT.pvL,pg); const spo=mesh_(gB(2.45,0.24,0.004,0,-0.05,-0.72),MAT.sp,g); const cl=grp_(g,1.2,0.04,0.55); mesh_(gB(0.05,0.03,0.04,0,0,0),MM.al,cl); mesh_(gB(0.04,0.03,0.04,0.3,0,0),MM.al,cl);
    const P=[{nm:'Модуль Shinefar SF-M21/G132710',sz:'710 Вт, 2 384 × 1 303 × 35',m:33.8,q:1440,qs:'1 260 цех + 180 склад',o:pg,ex:[0,0.3,0]},{nm:'Спойлер Vitr-240×2450',sz:'за стійками, на 2 трикутники',m:null,q:1260,o:spo,ex:[0,0,-0.3]},{nm:'Притиски W35 / Z33',sz:'2 520 + 3 232 (АБ арк. 8)',m:null,q:5752,o:cl,ex:[0.2,0.25,0.1]}];
    const sh=T.shot(10,{title:'Зразок: модуль 710 Вт і спойлер',text:'Модуль альбомно на поясах трьох трикутників під 15°; спойлер — за стійками.',parts:P,kv:[['Uхх (ПЗ РП)','50,44 В','П'],['Маса','33,8 кг (enfsolar)','П'],['Потужність','1 022,4 кВтп','П']],
      cam:u=>({tgt:new V3().setFromMatrixPosition(DM).add(V(0,1.3,0)),az:lerp(0.5,1.5,s5(u)),el:0.38,dist:lerp(4.6,4.0,u),fov:38}),slow:true,mus:'calm'});
    T.sample({t0:sh.t0,t1:sh.t1,parts:P,la:sh.t0+4.4,lb:sh.t1-1.8,root:g});
    T.up(new Fn(t=>{ const on=t>=sh.t0&&t<sh.t1; g.visible=on; if(!on) return; g.matrix.copy(DM).multiply(T_(0,1.2,0)).multiply(Ry((t-sh.t0)/10*0.5)); g.matrixWorldNeedsUpdate=true; explode(P,t,sh.t0+2.6,sh.t1-3.0); need=true; }));
    const t2=T.t, t3=t2+8, S3=t3+0.3, D3=9.4, land=new Float32Array(RMOD.length);
    MP.forEach((p,k)=>{ const n=p.items.length; let last=0; p.items.forEach((mj,r)=>{ rmMv.slot[mj]=T_(0,PAL_H+0.02+(n-1-r)*0.036,0); rmMv.pal[mj]=k; rmMv.F[mj]=MF[mj];
        const ts=k===0&&r<3?t2+0.6+r*2.4:S3+((k===0?r-3:r)/33)*(D3-1.2)+0.3*(hsh(mj)-0.5), td=k===0&&r<3?2.0:0.8; rmMv.ts[mj]=ts; rmMv.td[mj]=td; land[mj]=ts+td; last=Math.max(last,ts+td); }); mPal.v[k]=last+0.3; });
    const midOf=new Map(RMOD.map((m,j)=>[m.i,j]));
    DATA.rpm.sp.forEach((ti,j)=>{ spMv.F[j]=RT[ti].F; const mj=midOf.get(ti+1)??midOf.get(ti-1); spMv.ts[j]=mj!=null?land[mj]+0.05:1e9; spMv.td[j]=0.35; });
    const ev=RT.map((t,i)=>i).filter(i=>RT[i].k%2===0); ev.forEach((ti,e)=>{ const a=midOf.get(ti-1), b=midOf.get(ti+1), tm=Math.max(a!=null?land[a]:-1,b!=null?land[b]:-1); [0,1].forEach(q=>{ const k=e*2+q; if(k>=clN) return; const M=new M4(); RPM_.cl.getMatrixAt(k,M); clMv.F[k]=M; clMv.ts[k]=tm>0?tm+0.05:1e9; clMv.td[k]=0.25; }); });
    const m0=RT[RMOD[MP[0].items[0]].i];
    T.shot(8,{title:'Перші модулі',text:'З коробки — на пояси трьох трикутників; спойлер і притиски — одразу.',cam:u=>({tgt:roofP(m0.X,m0.Y,0.6),az:lerp(1.85,2.2,s5(u)),el:0.5,dist:lerp(9,7,u),fov:38}),slow:true});
    T.shot(10,{title:'Усі фронти',text:'Модулі з коробок по периметру, від країв до середини.',cam:u=>({tgt:V(50,6,-48),az:lerp(1.35,0.95,s5(u)),el:0.66,dist:135,fov:38}),mus:'drive'});
    const sag=RMOD.map((m,j)=>j).filter(j=>RMOD[j].sag>=15), ov=new THREE.InstancedMesh(new THREE.BoxGeometry(2.39,0.05,1.31),new THREE.MeshBasicMaterial({color:lc(0xe8a33d),transparent:true,opacity:0.6,depthWrite:false}),Math.max(1,sag.length));
    sag.forEach((j,k)=>{ ov.setMatrixAt(k,MF[j].clone().multiply(T_(0,0.04,0))); }); ov.frustumCulled=false; ov.visible=false; R.add(ov);
    const st=stopShot(6,'sag','модуль на трьох опорах по дузі'); T.up(new VAct([ov],st.t0,st.t1+0.4));
    T.counter({nm:'Модулі на цеху',tot:RMOD.length,n:t=>rmMv.placed(t),m:33.8,g:'mod'}); T.counter({nm:'Спойлери Vitr-240×2450',tot:DATA.rpm.sp.length,n:t=>spMv.placed(t)}); T.counter({nm:'Притиски (у 3D — по 2 на пояс)',tot:clN,n:t=>clMv.placed(t),note:'за АБ арк. 8 — 5 752'});
    T.counter({nm:'Потужність на цеху, кВтп',tot:Math.round(RMOD.length*0.71*10)/10,n:t=>Math.round(rmMv.placed(t)*71)/100,unit:'кВтп'}); }
  // ===== 6. Склад
  T.act('wh','Склад','180 модулів на профнастилі складу; кріплення RUDNIK — кількості за специфікацією, розташування в РП не показано.');
  { const t0=T.t, WM=[]; WHI.forEach((w,wi)=>{ for(let k=0;k<w.n;k++){ const M=new M4(); w.im.getMatrixAt(k,M); WM.push({M,w:wi}); } });
    const L=WM.filter(x=>x.w===0), Pm=WM.filter(x=>x.w===1); const mvs=[[L,MAT.pvL],[Pm,MAT.pvP]].map(([list,mat])=>{ const mv=T.up(new Mover([[BOX,mat]],list.length,R,{mode:'drop',drop:0.8})); list.forEach((x,k)=>{ mv.F[k]=x.M; mv.ts[k]=t0+0.8+(k/list.length)*8; mv.td[k]=0.5; }); return mv; });
    T.shot(12,{title:'Модулі на складі',text:'Модулі на скатах 22°, 17° і 11°.',nd:'Кількості RUDNIK з розкладки не виходять: блоки Light_P50-310 — 640, Z33 — 260, П33 — 442; за розкладкою 180 модулів — 404 рейки, 88 Z33, 316 П33 (невідповідність у проєкті).',
      kv:[['Light_P50-310 (специфікація)','640','П'],['Z33 / П33 (специфікація)','260 / 442','П'],['За розкладкою','404 / 88 / 316','Р']],cam:u=>({tgt:W(lerp(124,110,s5(u)),-15,5),az:lerp(0.35,0.75,s5(u)),el:0.55,dist:66,fov:38}),mus:'drive'});
    T.counter({nm:'Панелі на складі',tot:180,n:t=>mvs[0].placed(t)+mvs[1].placed(t),m:33.8,g:'whmod'}); }
  // ===== 7. ЩР-PV
  T.act('ep','Щити і стрінги','80 стрінгів по 17–19 модулів до 8 ЩР-PV на фасадах; ЩР-АКБ — біля майданчиків УЗЕ. Розводки по модулях у даних РП немає.');
  { const t0=T.t, boxes=[]; RP.pads.forEach(p=>{ (p.pv||[]).forEach(r=>boxes.push({r,n:'ЩР-PV',pad:p.id})); if(p.akb) boxes.push({r:p.akb,n:'ЩР-АКБ',pad:p.id}); });
    const bmv=T.up(new Mover([[BOX,MM.cab]],boxes.length,R,{mode:'drop',drop:0.8}));
    boxes.forEach((b,k)=>{ const r=b.r; bmv.F[k]=new M4().compose(W((r[0]+r[1])/2,(r[2]+r[3])/2,1.5),new Q(),V(r[1]-r[0],1.0,r[3]-r[2])); bmv.ts[k]=t0+0.8+k*0.4; bmv.td[k]=0.6; });
    T.shot(7,{title:'ЩР-PV на фасадах',text:'По 10 стрінгів на щит; кабель 1×6 до 288 м в один бік.',nd:'Висота і відмітка щитів у даних РП не задані — показано умовно 1,0 м на +1,0.',
      kv:[['Стрінги','74 × 18 + 3 × 19 + 3 × 17','П'],['Кабель 1×6','21,9 км','П']],cam:u=>({tgt:W(97,68,2),az:lerp(1.9,1.6,s5(u)),el:0.32,dist:lerp(30,24,u),fov:38})});
    stopShot(7,'uoc','Uхх стрінгів у мороз понад 1 000 В');
    T.counter({nm:'ЩР-PV і ЩР-АКБ',tot:boxes.length,n:t=>bmv.placed(t)}); T.counter({nm:'Стрінги',tot:80,n:t=>Math.round(80*c01((t-t0-0.8)/5))}); }
  // ===== 8. Блискавкозахист
  T.act('bz','Блискавкозахист','53 щогли (51 × 4 м M-04/40 і 2 × 6 м) на бетонних основах, дріт Ø8 на тримачах, 44 спуски, вирівнювання, заземлювачі (БЗ арк. 2).');
  { const t0=T.t, n=RP.masts.length; const rodM=[], baseM=[]; for(let i=0;i<n;i++){ const a=new M4(), b=new M4(); rpBZ.masts[0].getMatrixAt(i,a); rpBZ.masts[1].getMatrixAt(i,b); rodM.push(a); baseM.push(b); }
    const ord=RP.masts.map((m,i)=>i).sort((a,b)=>RP.masts[b][0]-RP.masts[a][0]); const mR=T.up(new Mover([[new THREE.CylinderGeometry(1,1,1,10),MAT.mast]],n,R,{mode:'drop',drop:2.0})), mB=T.up(new Mover([[new THREE.CylinderGeometry(0.28,0.32,0.18,16),MAT.conc]],n,R,{mode:'drop',drop:0.6}));
    ord.forEach((i,k)=>{ mB.F[i]=baseM[i]; mR.F[i]=rodM[i]; const ts=k===0?t0+0.8:t0+4+k/n*4; mB.ts[i]=ts; mB.td[i]=0.4; mR.ts[i]=ts+0.35; mR.td[i]=k===0?1.2:0.5; });
    const m0=RP.masts[ord[0]];
    T.shot(6,{title:'Щогла M-04/40 на бетонних основах',text:'Комплект 47,5 кг: основи 30 + 15 кг, Ø 300/400 (каталог FS); захисний кут 68°.',kv:[['Щогл','51 × 4 м + 2 × 6 м','П'],['Спусків',String(RP.down.length),'П']],
      cam:u=>({tgt:W(m0[0],m0[1],HV+2),az:lerp(0.6,1.2,s5(u)),el:0.3,dist:lerp(10,8,u),fov:38}),slow:true,mus:'calm'});
    const wp=[]; RP.wire.forEach(s=>segsOf(route(s[0],s[1],s[2],s[3],0.12,0.1),wp)); T.up(new LRev(fatLines(wp,0x2a9fd0,2.6,R),lineTimes(wp.length/2,t0+6.5,t0+11)));
    const dp=[]; RP.down.forEach(p=>{ const top=mastBase(p[0],p[1]); dp.push(...chop(W(p[0],p[1],top),W(p[0],p[1],0.9),1.5)); }); T.up(new LRev(fatLines(dp,0x2a9fd0,2.6,R),lineTimes(dp.length/2,t0+9,t0+12)));
    const bp=[]; RP.bond.forEach(s=>segsOf(route(s[0],s[1],s[2],s[3],0.06,0.05),bp)); T.up(new LRev(fatLines(bp,0x3cae4f,1.8,R),lineTimes(bp.length/2,t0+8,t0+12.5)));
    const ep=[]; RP.strip.forEach(s=>ep.push(W(s[0],s[1],0.03),W(s[2],s[3],0.03))); RP.rods.forEach(r=>ep.push(W(r[0],r[1],0.03),W(r[0],r[1],-1.2))); T.up(new LRev(fatLines(ep,0x8a5a2b,2.2,R),lineTimes(ep.length/2,t0+11,t0+13)));
    T.shot(8,{title:'Щогли, дріт, спуски',text:'Дріт Ø8 між щоглами на тримачах, спуски по фасадах до заземлювачів, вирівнювання рядів.',cam:u=>({tgt:V(50,6,-48),az:lerp(1.1,0.75,s5(u)),el:0.62,dist:150,fov:38}),mus:'drive'});
    T.up(new VAct([rpBZ.cones],T.t,T.t+4.2)); T.prep.push(()=>{ rVis(G.rpBZ); G.rpBZ.visible=true; G.rpBZ.children.forEach(o=>{ if(o!==rpBZ.cones){ rVis(o); o.visible=false; } }); rVis(rpBZ.cones); rpBZ.cones.visible=false; });
    T.shot(4,{title:'Зони захисту щогл',text:'Конуси захисту 68°. У нашому варіанті щогл немає (Том 7: ризик з узгодженою системою ПЗІП).',cam:u=>({tgt:V(50,6,-48),az:lerp(0.75,0.6,u),el:0.55,dist:160,fov:38})});
    T.counter({nm:'Щогли',tot:n,n:t=>mR.placed(t),mf:t=>{ let c=0; for(let i=0;i<n;i++) if(RP.masts[i][2]===4&&t>=mR.ts[i]+mR.td[i]) c++; return c*47.5; },g:'met',note:'51 × M-04/40 (47,5 кг) + 2 × 6 м (маса — немає в даних)'}); }
  // ===== 9. Накопичувач енергії
  T.act('uze','Накопичувач енергії','3 майданчики: шафа FFD POWER 500 кВт + 5 × Galaxy261L під навісом; MS-1 і MS-2 — до ТП-5913, MS-3 — до ТП-6923.');
  { const t0=T.t, own=ESS.filter(o=>o.parent===G.rpBase), slabs=own.filter(o=>o.material===MAT.slab), gal=own.filter(o=>o.userData.info&&/^Galaxy/.test(o.userData.info.t)), ffd=own.filter(o=>o.userData.info&&/^FFD/.test(o.userData.info.t)), sm=own.filter(o=>o.userData.info&&/^SM/.test(o.userData.info.t));
    T.prep.push(()=>{ own.forEach(o=>{ rVis(o); o.visible=false; }); });
    slabs.forEach((o,k)=>T.up(new VAct([o],t0+0.8+k*0.3,null))); [...gal,...ffd,...sm].forEach((o,k)=>T.up(new VAct([o],t0+2+k*0.18,null)));
    T.shot(8,{title:'Майданчики УЗЕ',text:'Плити майданчиків, шафи Galaxy261L і FFD під навісом біля фасаду.',kv:[['Galaxy261L','261 кВт·год, 2 680 кг (ffdpower.com)','П'],['Разом','15 × 261 = 3 915 кВт·год','П'],['Шафи FFD (кошторис РП)','≈32,3 млн грн ≈ '+nf(Math.round(32.3e6/UAH))+' $','П']],
      cam:u=>({tgt:W(99,66,1.2),az:lerp(1.75,1.45,s5(u)),el:lerp(0.78,0.86,s5(u)),dist:lerp(27,22,u),fov:38}),mus:'calm'});
    stopShot(5,'uzeqf','лінія ТП — ЩР-УЗЕ без захисту на початку'); stopShot(5,'uzefire','пожежна безпека УЗЕ не розроблена');
    const nG=t=>gal.filter((o,k)=>t>=t0+2+k*0.18).length; T.counter({nm:'Galaxy261L',tot:gal.length,n:nG}); T.counter({nm:'Ємність, кВт·год',tot:3915,n:t=>nG(t)*261,unit:'кВт·год'});
    T.act('uze3','Майданчик MS-3','MS-3 біля ТП-6923, на півночі ділянки: шафа FFD і 5 × Galaxy261L.');
    stopShot(6,'uzeisl','острівний режим не спроєктовано'); }
  // ===== 10. Підсумок
  T.act('sum','Підсумок','Вінницький проєкт змонтовано.');
  { const x=misT('gen'); T.shot(12,{title:'Станція за РП змонтована',text:'Підсумок — у картці над моделлю.',nd:x?`Невідповідність ${x.n}: ${x.m.t}.`:'',cam:u=>({tgt:V(58,4,-46),az:lerp(0.7,0.7+120*D2R,s5(u)),el:lerp(0.5,0.42,u),dist:lerp(175,190,u),fov:38}),mus:'end',sum:true}); if(x) stop(T.t-11,T.t,'gen'); }
  T.done();
  T.prep.push(()=>{ [...RPM_.lod,...RPM_.det,RPM_.blk,RPM_.mat,RPM_.mods,RPM_.sp,RPM_.cl,RPM_.con,...RPM_.detC].forEach(o=>{ rVis(o); o.visible=false; }); WHI.forEach(w=>{ rVis(w.im); w.im.visible=false; }); rVis(MARKS); MARKS.visible=true; MARKS.children.forEach(o=>{ rVis(o); o.visible=false; }); });
  T.sum=()=>sumRP(T); T.demo={dT,X:DT.X,Y:DT.Y}; return T; }
function sumRP(T){ const t=T.T, g=massBy(T,t), roof=g.blk+g.met+g.mod;
  return {title:'Вінницький проєкт',rows:[['Панелі','1 440','1 260 цех + 180 склад, Shinefar 710 Вт'],['Потужність','1 022,4 кВтп',''],['Генерація за рік',nf(YEAR.tot.rp/1000,1)+' МВт·год','та сама модель двійника; у PVsyst РП — 1 182,8 (невідповідність 6)'],
    ['Баласт на даху цеху',ft(g.blk),'5 404 × 13 кг у 3D (мати — маса не вказана)'],['Метал',ft(g.met),'трикутники 6,73 кг, сполучники 1,60 кг (наша 3D-модель), щогли M-04/40 47,5 кг'],['Модулі на цеху',ft(g.mod),'1 260 × 33,8 кг'],
    ['Разом на дах цеху',ft(roof),nf(roof/AREA,1)+' кг/м² у плані ('+nf(AREA,0)+' м²)'],['Склад',ft(g.whmod),'180 модулів; кріплення RUDNIK — маса не вказана'],['Накопичувачі','15 × 261 = 3 915 кВт·год','3 × FFD 500 кВт + 15 × Galaxy261L (40,2 т); шафи ≈32,3 млн грн ≈ '+nf(Math.round(32.3e6/UAH))+' $'],
    ['Кошторис РП','106 591 тис. грн','з ПДВ, ціни на 27.03.2026 ≈ '+nf(Math.round(106591e3/UAH))+' $']],
    note:'Маси без паспорта (спойлери, притиски, шурупи R-LX, мати, щогли 6 м, шафи FFD) у підсумок не входять. Невідповідності — розділ «Невідповідності».'}; }


// ================= реєстр змін двійника: при виході з розділу все повертається як було
const REG={vis:new Map()};
const rVis=o=>{ if(o&&!REG.vis.has(o)) REG.vis.set(o,o.visible); };
function regRestore(){ REG.vis.forEach((v,o)=>o.visible=v); REG.vis.clear(); need=true; }

// ================= виноски на зразку: колонка праворуч з тонкими лініями (комп'ютер) або номери біля деталей (телефон)
let LABS=[], LABK=null;
function clearLabels(){ LABS.forEach(l=>l.el.remove()); LABS=[]; UI.svg.innerHTML=''; UI.lab.hidden=true; LABK=null; }
function makeLabels(s){ clearLabels(); LABK=s; const ph=!wide(); let n=0; s.parts.forEach(p=>{ if(!p.nm) return; n++; const el=document.createElement('div');
    if(ph){ el.className='mtn'; el.textContent=n; } else { el.className='mtx'; el.innerHTML=`<b>${n}</b><span><span class="nm">${esc(p.nm)}</span>${p.sz?`<em>${esc(p.sz)}</em>`:''}</span>`; }
    UI.lab.appendChild(el); LABS.push({el,p,n,w:0,h:0}); });
  UI.lab.hidden=false; LABS.forEach(l=>{ l.w=l.el.offsetWidth; l.h=l.el.offsetHeight; }); }
const _b3=new THREE.Box3();
function placeLabels(s,t){ if(!LABS.length) return; const on=labOn(s,t), r=canvas.getBoundingClientRect(), Wd=r.width, Ht=r.height; const op=Math.min(c01((t-s.la)/0.4),c01((s.lb-t)/0.4)); UI.lab.style.opacity=op.toFixed(2); if(!on) return;
  if(s.root) s.root.updateMatrixWorld(true); const hlI=hlIndex(s,t);
  const pts=LABS.map(l=>{ const o=l.p.o; o.updateMatrixWorld(true); _b3.setFromObject(o); const c=_b3.isEmpty()?o.getWorldPosition(new V3()):_b3.getCenter(new V3()); const v=c.project(camera), x=(v.x+1)/2*Wd, y=(1-v.y)/2*Ht, ok=v.z<1&&isFinite(x)&&isFinite(y)&&x>-50&&x<Wd+50;
    l.el.classList.toggle('on',hlI===l.n-1); return {l,x:ok?x:Wd*0.6,y:ok?y:Ht*0.4,ok}; });
  if(!wide()){ pts.forEach(q=>{ q.l.el.style.transform=`translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px)`; q.l.el.style.display=q.ok?'':'none'; }); UI.svg.innerHTML=''; return; }
  const colW=Math.max(...LABS.map(l=>l.w)), X0=Wd-colW-16, top=58, bot=Math.max(top+40,Ht-(UI.bar.offsetHeight+24)), ord=pts.slice().sort((a,b)=>a.y-b.y);
  const gap=6, tot=ord.reduce((s_,q)=>s_+q.l.h,0)+gap*(ord.length-1); let y=top;
  if(tot>=bot-top) ord.forEach(q=>{ q.ly=y; y+=q.l.h+gap; });
  else { ord.forEach(q=>{ q.ly=Math.max(y,q.y-q.l.h/2); y=q.ly+q.l.h+gap; }); let lim=bot; for(let i=ord.length-1;i>=0;i--){ ord[i].ly=Math.min(ord[i].ly,lim-ord[i].l.h); lim=ord[i].ly-gap; } if(ord[0].ly<top){ const d=top-ord[0].ly; ord.forEach(q=>q.ly+=d); } }
  let svg=''; ord.forEach(q=>{ const ly=Math.max(top,q.ly); q.l.el.style.transform=`translate(${X0}px,${ly}px)`; const yy=ly+9; if(q.ok&&q.x<X0-24) svg+=`<path d="M${q.x.toFixed(1)},${q.y.toFixed(1)} L${(X0-22).toFixed(1)},${yy.toFixed(1)} L${(X0-2).toFixed(1)},${yy.toFixed(1)}"/><circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="2.6"/>`; });
  UI.svg.innerHTML=svg; }
// підсвічування по черзі (щит: MC4, запобіжники, роз'єднувач, ОПН, контроль струму, PE)
function hlIndex(s,t){ if(!s.hl) return -1; const k=Math.floor((t-s.hl.t0)/s.hl.dt); if(k<0||k>=s.hl.list.length) return -1; return s.parts.filter(p=>p.nm).indexOf(s.hl.list[k]); }
const HLM=new Map();
function hlApply(s,t){ if(!s||!s.hl) return; const k=Math.floor((t-s.hl.t0)/s.hl.dt); s.hl.list.forEach((p,i)=>{ let ms=HLM.get(p); if(!ms){ ms=[]; p.o.traverse(o=>{ if(o.isMesh){ o.material=o.material.clone(); ms.push(o.material); } }); HLM.set(p,ms); }
    const on=i===k, f=on?0.55+0.35*Math.sin((t-s.hl.t0)*9):0; ms.forEach(m=>{ m.emissive.setRGB(f*0.25,f*0.5,f*1.0); }); }); need=true; }

// ================= картка ліворуч
function cardBuild(T,s){ const a=s.act, parts=(s.parts||[]).filter(p=>p.nm);
  let h=`<div class="ey"><span class="ac">${a.no}</span><span>${esc(a.title)} · ${s.id}</span><button type="button" id="mtcMin" aria-label="Згорнути картку" title="Згорнути / розгорнути">${UI.card.classList.contains('min')?'▴':'▾'}</button></div><h3>${esc(s.title)}</h3>`;
  if(s.text) h+=`<p>${esc(s.text)}</p>`;
  if(s.nd) h+=`<p class="nd">⚠ ${esc(s.nd)}</p>`;
  if(parts.length) h+=`<ol class="pt">${parts.map((p,i)=>{ const q=p.qs||(p.q!==''&&p.q!=null?fq(p.q):''), tot=p.m!=null&&typeof p.q==='number'?ft(p.m*p.q):''; return `<li data-pi="${i}"><b class="n">${i+1}</b><span>${esc(p.nm)}</span>${p.sz?`<em>${esc(p.sz)}</em>`:''}${(p.m!=null||q)?`<i>${p.m!=null?fm(p.m):'маса —'}${q?' × '+esc(q):''}${tot?' = '+tot:''}</i>`:''}</li>`; }).join('')}</ol>`;
  if(s.kv) h+=kvHTML(s.kv);
  h+=`<div class="cn" id="mtcn"></div>`;
  UI.ci.innerHTML=h; const b=$('#mtcMin'); if(b) b.onclick=()=>{ const m=UI.card.classList.toggle('min'); b.textContent=m?'▴':'▾'; try{ localStorage.setItem('antares-mt-min',m?'1':'0'); }catch(e){} viewOffset(); }; MT.cnTxt=''; }
function cardTick(T,s,t){ const el=$('#mtcn'); if(!el) return; const cs=T.cnt.filter(c=>c.act===s.act.id), g=massBy(T,t), roof=g.blk+g.met+g.mod+g.el;
  let h=cs.map(c=>`<div><b>${fq(c.n(t))}</b><small>${c.cur?'':'/ '+fq(c.tot)}${c.unit&&c.unit!=='шт'?' '+esc(c.unit):''}</small><span>${esc(c.nm)}</span></div>`).join('');
  if(roof>0) h+=`<div class="ms"><b>${ft(roof)}</b><span>на даху цеху (з відомою масою)</span></div>`;
  if(h!==MT.cnTxt){ MT.cnTxt=h; el.innerHTML=h; }
  const hi=s.parts?hlIndex(MT.T.samp.find(x=>x.parts===s.parts)||{},t):-1; UI.ci.querySelectorAll('ol.pt li').forEach((li,i)=>li.classList.toggle('on',i===hi)); }
// зсув кадру від картки (setViewOffset): об'єкт — у вільній частині
function viewOffset(){ if(!MT.active){ camera.clearViewOffset(); return; } const v=canvas.parentElement, w=v.clientWidth, h=v.clientHeight; if(!w||!h) return; const vr=v.getBoundingClientRect(), cr=UI.ci.getBoundingClientRect(), bh=UI.bar.offsetHeight+16; let ox=0, oy=0;
  if(wide()&&!UI.card.hidden) ox=-(cr.right-vr.left+6)/2; else if(!UI.card.hidden) oy=Math.min(h*0.34,(cr.height+bh+8)/2); oy+=wide()?bh/2:0;
  camera.setViewOffset(w,h,ox,oy,w,h); camera.updateProjectionMatrix(); need=true; }
try{ new ResizeObserver(()=>{ if(MT.active) viewOffset(); }).observe(UI.ci); new ResizeObserver(()=>{ if(MT.active) viewOffset(); }).observe(canvas.parentElement); }catch(e){}

// ================= нижня панель розділу (аркуш): акти, зразок, змонтовано
function pane(force){ if(state.sec!=='bud'||!MT.T) return; const T=MT.T, t=MT.t, s=T.shotAt(t), a=s.act, smp=T.samp.find(x=>t>=x.t0&&t<x.t1)||null, key=T.proj+'|'+a.no+'|'+(smp?T.samp.indexOf(smp):-1); const P=$('#pane');
  if(force||MT.paneKey!==key||!P.querySelector('.mtq')){ MT.paneKey=key; const rp=T.proj==='rp'; const sm=smp||T.samp.find(x=>x.t0>=a.t0&&x.t0<a.t1);
    P.innerHTML=`<div class="ph"><span class="eyebrow ${rp?'rp':'ours'}">${rp?'Вінницький проєкт · РП 2025/12-07':'Наш варіант Б · E-Systems'} · Будівництво</span><h2>Монтаж: ${T.acts.length} актів, ${fmtT(T.T)} при ×1</h2><p>▶ і повзунок — під моделлю; ×2 / ×5 прискорюють фронти, зразки й перші штуки — завжди ×1. Торкання моделі — вільна камера; «Камера: авто» — повернути. Два натискання на виріб — перехід до його зразка.</p></div>`
     +`<div class="blk"><h3>Акти</h3><ol class="mtst">${T.acts.map(x=>`<li><button type="button" data-mst="${x.no}" ${x===a?'aria-current="true"':''} class="${t>=x.t1?'done':''}"><em>${x.no}</em><span>${esc(x.title)}</span><small>${fmtT(x.t0)}</small></button></li>`).join('')}</ol></div>`
     +`<div class="blk"><h3>${esc(a.title)}</h3><p class="src" style="margin:0 0 6px">${esc(a.lead||'')}</p>${sm?`<table class="cmp mtq"><thead><tr><th>Зразок</th><th>Маса</th><th>К-сть</th><th>Разом</th></tr></thead><tbody>${sm.parts.filter(p=>p.nm).map((p,i)=>`<tr><td><b class="num">${i+1}.</b> ${esc(p.nm)}${p.sz?`<br><small>${esc(p.sz)}</small>`:''}</td><td>${fm(p.m)}</td><td>${esc(p.qs||fq(p.q??''))}</td><td>${p.m!=null&&typeof p.q==='number'?ft(p.m*p.q):'—'}</td></tr>`).join('')}</tbody></table>`:''}</div>`
     +`<div class="blk"><h3>Змонтовано</h3><table class="cmp mtq"><thead><tr><th>Елемент</th><th>Є / усього</th><th>Маса</th></tr></thead><tbody>${T.cnt.map((c,i)=>`<tr data-ci="${i}"><td>${esc(c.nm)}${c.note?`<br><small>${esc(c.note)}</small>`:''}</td><td class="n" data-cn="${i}"></td><td data-cm="${i}"></td></tr>`).join('')}</tbody></table>`
     +`<p class="src">${rp?'Кількості — з 3D двійника (оцифровка плану РП) і специфікації РП; маси — з паспортів виробників, де знайдено; трикутник і сполучник — з нашої 3D-моделі. Розташування кріплення складу RUDNIK у РП немає.':'Кількості — Том 3 КМ (25.10), стрінги і щити (26.10), лотки (26.10), склад (26.10, ред. 2), Том 7, Том 8. Маси — з паспортів і документів проєкту; без маси — чого немає в паспортах. Притиски після кожної панелі — прийнято (власник не уточнив); кріплення 3 щитів на складі не визначено; скільки шматків лаги в пачці — немає в даних.'}</p></div>`;
    P.querySelectorAll('[data-mst]').forEach(b=>b.onclick=()=>{ jump(T.acts[+b.dataset.mst].t0+0.01); }); }
  T.cnt.forEach((c,i)=>{ const x=P.querySelector(`[data-cn="${i}"]`), y=P.querySelector(`[data-cm="${i}"]`); if(!x) return; const n=c.n(t), tx=c.cur?`${fq(n)}`:`${fq(n)} / ${fq(c.tot)}${c.unit&&c.unit!=='шт'?' '+c.unit:''}`; if(x.textContent!==tx) x.textContent=tx;
    const m=c.mf?c.mf(t):c.m!=null?c.m*n:null, mt=m==null?'—':ft(m); if(y.textContent!==mt) y.textContent=mt; const tr=x.parentElement, on=c.act===a.id; if(tr.classList.contains('cur')!==on) tr.classList.toggle('cur',on); }); }

// ================= стан, кадр
function enter(){ const P=state.proj; MT.active=true; MT.proj=P;
  if(P==='rp'){ RPM_.cur.forEach(i=>RPM_.lod.forEach(im=>im.setMatrixAt(i,RT[i].F))); RPM_.curC.forEach(j=>RPM_.con.setMatrixAt(j,CON[j].M)); RPM_.det.concat(RPM_.detC).forEach(im=>{ im.count=0; im.instanceMatrix.needsUpdate=true; }); RPM_.lod.forEach(im=>im.instanceMatrix.needsUpdate=true); RPM_.con.instanceMatrix.needsUpdate=true; RPM_.cur=[]; RPM_.curC=[]; }
  const T=MT.tls[P]||(MT.tls[P]=P==='ours'?buildOurs():buildRP()); MT.T=T; T.prep.forEach(f=>f());
  MTG.visible=true; Object.values(MT.tls).forEach(x=>x.root.visible=x===T);
  const hw=$('#hudwrap'); if(hw){ MT.hud=hw.style.display; hw.style.display='none'; } const sr=document.querySelector('.sunrow'); if(sr) sr.hidden=true; const rd=$('#now'); if(rd){ MT.rd=rd.style.display; rd.style.display='none'; }
  MT.sheet0=state.sheet; if(state.sheet!=='peek') sheetSet('peek'); UI.card.hidden=false; UI.bar.hidden=false; try{ if(localStorage.getItem('antares-mt-min')==='1') UI.card.classList.add('min'); }catch(e){}
  UI.tk.innerHTML=T.acts.slice(1).map(a=>`<i style="left:${(a.t0/T.T*100).toFixed(2)}%" title="${esc(a.title)}"></i>`).join('');
  lightOn(); obstInit(); obstOn(true); lmRes();
  MT.t=Math.min(MT.tp[P]||0,T.T); MT.dirty=true; MT.actIx=-1; MT.shotIx=-1; MT.paneKey=''; MT.sumClosed=false; MT.free=false; UI.cam.setAttribute('aria-pressed','true'); UI.cam.innerHTML=CAMH('авто');
  T.set(MT.t); CAM.init=false; viewOffset(); camStep(T.camSpec(MT.t),0); CAM.fl=null; camApply(0); pane(true); ui(true); MT.last=performance.now();
  try{ localStorage.setItem('antares-mt-on','1'); }catch(e){} need=true; }
function leave(){ if(!MT.active) return; MT.tp[MT.proj]=MT.t; if(MT.play) setPlayM(false); MT.active=false; regRestore(); MTG.visible=false;
  [UI.card,UI.bar,UI.lab,UI.stop,UI.sum].forEach(e=>e.hidden=true); const hw=$('#hudwrap'); if(hw) hw.style.display=MT.hud||''; const sr=document.querySelector('.sunrow'); if(sr) sr.hidden=false; const rd=$('#now'); if(rd) rd.style.display=MT.rd||'';
  if(MT.sheet0&&state.sheet==='peek'&&MT.sheet0!=='peek') sheetSet(MT.sheet0); lightOff(); obstOn(false); camera.clearViewOffset(); camera.near=0.1; camera.fov=38; camera.updateProjectionMatrix(); clearLabels(); MT.stopId=null; try{ localStorage.removeItem('antares-mt-on'); }catch(e){} need=true; }
function setPlayM(on){ const T=MT.T; if(on&&MT.t>=T.T-0.05){ MT.t=0; MT.dirty=true; MT.sumClosed=false; MT.jumped=true; } MT.play=on; UI.play.textContent=on?'❚❚':'▶'; UI.play.setAttribute('aria-label',on?'Пауза':'Пуск монтажу'); UI.play.title=on?'Пауза (пробіл)':'Пуск (пробіл)';
  MT.last=performance.now(); sndPlaying(on); if(on) sndMode(T.musAt(MT.t)); }
function jump(t){ MT.t=Math.max(0,Math.min(MT.T.T,t)); MT.dirty=true; MT.jumped=true; MT.sumClosed=false; need=true; }
UI.play.onclick=()=>setPlayM(!MT.play);
UI.spd.onclick=()=>{ MT.spd=SPDS[(SPDS.indexOf(MT.spd)+1)%SPDS.length]; UI.spd.textContent='×'+String(MT.spd).replace('.',','); };
UI.prev.onclick=()=>{ const T=MT.T, s=T.shotAt(MT.t), i=T.shots.indexOf(s); jump(MT.t-s.t0>1.5?s.t0+0.01:T.shots[Math.max(0,i-1)].t0+0.01); };
UI.next.onclick=()=>{ const T=MT.T, s=T.shotAt(MT.t), i=T.shots.indexOf(s); if(i<T.shots.length-1) jump(T.shots[i+1].t0+0.01); };
UI.pos.oninput=()=>jump(+UI.pos.value/1000*MT.T.T);
UI.cam.onclick=()=>{ MT.free=!MT.free; if(!MT.free){ camFromView(); } UI.cam.setAttribute('aria-pressed',String(!MT.free)); UI.cam.innerHTML=CAMH(MT.free?'вільна':'авто'); };
UI.snd.onclick=()=>{ SND.on=!SND.on; UI.snd.setAttribute('aria-pressed',String(SND.on)); if(SND.on&&MT.play) sndPlaying(true); sndMix(false); sndSave(); };
UI.snd.setAttribute('aria-pressed',String(SND.on)); UI.vol.value=Math.round(SND.vol*100);
UI.vol.oninput=()=>{ SND.vol=+UI.vol.value/100; sndMix(true); sndSave(); };
controls.addEventListener('start',()=>{ if(MT.active&&!MT.free){ MT.free=true; UI.cam.setAttribute('aria-pressed','false'); UI.cam.innerHTML=CAMH('вільна'); } });
window.addEventListener('keydown',e=>{ if(!MT.active||(e.target.closest&&e.target.closest('input,textarea,select'))) return; if(e.code==='Space'&&!(e.target.closest&&e.target.closest('button'))){ e.preventDefault(); setPlayM(!MT.play); } });

// один крок часу: сцена, камера, перешкоди, виноски — і для живого перегляду, і для відео покадрово (фіксований dt)
function step(dt,real){ const T=MT.T; let sp=1;
  if(MT.play){ sp=MT.spd<1?MT.spd:(T.isSlow(MT.t)?1:MT.spd); const t0=MT.t; MT.t=Math.min(T.T,MT.t+dt*sp); MT.dirty=true;
    if(T.sfxT&&sp<=2){ let i=ub(T.sfxT,t0); while(i<T.sfx.length&&T.sfx[i][0]<=MT.t){ sfx(T.sfx[i][1]); i++; } }
    const a0=T.actAt(t0), a1=T.actAt(MT.t); if(a0!==a1) sndSting(); sndMode(T.musAt(MT.t)); if(MT.t>=T.T) setPlayM(false); }
  const t=MT.t; if(MT.dirty){ T.set(t); MT.dirty=false; need=true; }
  let cut=false; if(T.cutT&&MT.tPrev!=null&&t>MT.tPrev){ const i=ub(T.cutT,MT.tPrev); if(i<T.cutT.length&&T.cutT[i]<=t) cut=true; } MT.tPrev=t;
  if(!MT.free){ const spec=T.camSpec(t); if(MT.jumped||cut){ camReset(spec); MT.jumped=false; CAM.fl=null; camApply(0); } else { camStep(spec,MT.play?dt*sp:dt); camApply(MT.play?dt*sp:dt); } }
  { let f=0; if(T.cutT) for(const c of T.cutT){ const d=Math.abs(t-c); if(d<0.4) f=Math.max(f,1-d/0.4); } const s_=f.toFixed(2); if(UI.fade.style.opacity!==s_) UI.fade.style.opacity=s_; }
  MT.jumped=false; obstTick(dt); if(T.post.length&&(MT.camMoved||MT.postT!==t)){ MT.postT=t; T.post.forEach(f=>f()); } MT.camMoved=false;
  const smp=T.samp.find(x=>t>=x.t0&&t<x.t1)||null; if(smp!==LABK){ if(smp) makeLabels(smp); else clearLabels(); }
  if(smp){ placeLabels(smp,t); hlApply(smp,t); need=true; } }
function mtTick(now){ if(!MT.active){ MT.last=now; return; } MT.fr++; const dt=Math.min(0.1,Math.max(0,(now-MT.last)/1000)); MT.last=now; if(MT.video) return;
  step(dt,true); if(MT.play) need=true; if(now-MT.uiT>120){ MT.uiT=now; ui(false); } }
function ui(force){ const T=MT.T, t=MT.t, s=T.shotAt(t);
  if(s!==MT.shotIx||force){ MT.shotIx=s; cardBuild(T,s); viewOffset(); } cardTick(T,s,t);
  UI.pos.value=String(Math.round(t/T.T*1000)); UI.clock.innerHTML=fmtT(t)+'<small> / '+fmtT(T.T)+'</small>';
  // зупинка (невідповідність Вінниці)
  const w=T.stops.find(x=>t>=x.t0&&t<x.t1)||null, wid=w?w.id:null; if(wid!==MT.stopId){ MT.stopId=wid;
    if(w){ UI.stop.className='mtstop'+(w.inf?' inf':''); UI.stop.innerHTML=`<b><i>${w.n||'i'}</i>${w.n?`Невідповідність ${w.n} з ${MIS.length}. `:''}${esc(w.t)}</b><span>${esc(w.d||'')}</span>`; UI.stop.hidden=false; } else UI.stop.hidden=true;
    if(T.proj==='rp'){ MARKS.children.forEach(o=>o.visible=false); if(w&&w.n){ const i=w.n-1; if(MARKS.children[i*2]){ MARKS.children[i*2].visible=true; MARKS.children[i*2+1].visible=true; } } misPaint(w&&w.paint?w.paint:null); need=true; } }
  // підсумок
  const sumOn=!!s.sum&&t>=s.t0+1.6&&!MT.sumClosed; if(sumOn&&UI.sum.hidden){ const S_=T.sum(); UI.sum.innerHTML=`<button type="button" class="x" aria-label="Закрити">×</button><h2>Підсумок · ${esc(S_.title)}</h2><table class="cmp"><tbody>${S_.rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td style="text-align:left;font-family:var(--font);color:var(--ink-3)">${esc(r[2])}</td></tr>`).join('')}</tbody></table><p class="src">${esc(S_.note)}</p>`;
    UI.sum.querySelector('.x').onclick=()=>{ MT.sumClosed=true; UI.sum.hidden=true; }; UI.sum.hidden=false; } else if(!sumOn) UI.sum.hidden=true;
  if(s.act.no!==MT.actIx){ MT.actIx=s.act.no; MT.paneKey=''; } pane(force); }

// ================= підключення розділу «Будівництво» до двійника
if(EP&&EP.box) EP.box.material=EP.box.material.clone();
{ const b=SECS.find(x=>x[0]==='bud'); if(b) b[2]=1; ONSECS.length=0; SECS.filter(x=>x[2]).forEach(x=>ONSECS.push(x[0]));
  const tb=document.querySelector('#tabs button[data-s="bud"]'); if(tb){ tb.disabled=false; tb.removeAttribute('title'); } }
const apply0=apply; apply=function(){ const go=MT.play||MT.auto; MT.auto=false; if(MT.active) leave(); apply0(); if(state.sec==='bud'){ enter(); if(go) setPlayM(true); } };
{ const tb=document.querySelector('#tabs button[data-s="bud"]'); if(tb) tb.addEventListener('click',()=>{ if(state.sec!=='bud') MT.auto=true; },true); }
const rpDetail0=rpDetail; rpDetail=function(){ if(state.sec==='bud') return; rpDetail0(); };
const loop0=loop; loop=function(now){ mtTick(now); loop0(now); };
{ let on=false; try{ on=localStorage.getItem('antares-mt-on')==='1'; }catch(e){} if((location.hash||'')==='#bud'||on){ state.sec='bud'; apply(); } }
// для перевірки і відео: кадр за кадром з фіксованим кроком
window.__twin.apply=apply;
window.__twin.mt={MT,CAM,jump:t=>{ jump(t); step(0,false); },play:setPlayM,cur:()=>MT.T,SND,
  acts:()=>MT.T.acts.map(a=>[a.id,a.title,+a.t0.toFixed(2),+(a.t1||0).toFixed(2)]),shots:()=>MT.T.shots.map(s=>[s.id,s.title,+s.t0.toFixed(2),+s.t1.toFixed(2)]),
  count:()=>MT.T.cnt.map(c=>[c.nm,c.n(MT.t),c.tot,c.cur?1:0,c.skip||0]),demo:()=>MT.T.demo,
  video:on=>{ MT.video=!!on; if(on){ MT.play=false; } },
  warm:(t,secs,dt)=>{ jump(Math.max(0,t-secs)); step(0,false); for(let tt=Math.max(0,t-secs);tt<t;tt+=dt){ MT.t=tt; MT.dirty=true; step(dt,false); } },
  frame:(t,dt)=>{ MT.t=t; MT.dirty=true; if(MT.play) MT.play=false; step(dt,false); ui(false); renderer.render(scene,camera); need=false; return [camera.position.toArray(),controls.target.toArray(),CAM.az,CAM.el,Math.exp(CAM.lD)]; },
  dbg:()=>({rpBZ,ourMods,OM,RP,WHI}),
  look:(q,az,el,d)=>{ const z=surfZ(q[0],q[1]), tg=W(q[0],q[1],(z==null?0:z)+q[2]), c=Math.cos(el); camera.position.set(tg.x+d*c*Math.sin(az),tg.y+d*Math.sin(el),tg.z+d*c*Math.cos(az)); controls.target.copy(tg); camera.lookAt(tg); camera.updateMatrixWorld(); MT.T.post.forEach(f=>f()); renderer.render(scene,camera); need=false; return camera.position.toArray(); },
  camTrack:(t0,t1,dt)=>{ const T=MT.T, out=[]; let tt=t0, prev=null; MT.jumped=true; while(tt<=t1){ MT.t=tt; const spec=T.camSpec(tt); let cut=false; if(prev!=null){ const i=ub(T.cutT,prev); cut=i<T.cutT.length&&T.cutT[i]<=tt; } prev=tt; if(MT.jumped||cut){ camReset(spec); MT.jumped=false; CAM.fl=null; camApply(0); } else { camStep(spec,dt); camApply(dt); } out.push([tt,camera.position.x,camera.position.y,camera.position.z,controls.target.x,controls.target.y,controls.target.z,CAM.az,CAM.el,Math.exp(CAM.lD),cut?1:0]); tt+=dt; } return out; }};
// ================= Два натискання підряд — елемент розбирається (будь-який розділ). Вузли — тим самим механізмом, що й «Вузол по деталях»:
// xNew / xLayer / xPart / xHide у app.js; xShow показує, підписи й картка — спільні. ly.ex — куди деталь відходить (м, світові осі), без нього — вгору за рівнем.
{
const XL=(N,L,name,q,ex,warn)=>{ const ly=xLayer(N,L,name,q,warn); if(ex) ly.ex=new V3(ex[0],ex[1],ex[2]); return ly; };
const XT=(F,x,y,z)=>F.clone().multiply(T_(x,y,z));
const TR=v=>new M4().makeTranslation(v.x,v.y,v.z);
const blkG=gMerge([gTint(gB(0.32,0.003,0.32,0,0.0015,0),0x262626),gTint(gB(0.3,0.06,0.3,0,0.033,0),0x9d9a93),gTint(gC(0.0075,0.0012,8,'y',0,0.0634,0),0xb8902f)]);
const hOf=(X,Y)=>{ const z=surfZ(X,Y); return z===null?0.3:z; };
const geoOf=new Map(); const G_=(k,f)=>{ if(!geoOf.has(k)) geoOf.set(k,f()); return geoOf.get(k); };

// ---------- 1. Щит PV 7/1 (Наш Б): блоки, рама, корпус, начиння, двері, козирок — як у зразку монтажу 6.1
function boxNode(i){ const E=EPX, b=E.boxes[i]; if(!b) return null; const R=!!b.r, h=hOf(b.X,b.Y), F=TR(W(b.X,b.Y,h)), N=xNew(state.proj,i,0.3); N.dim=[];
  xHide(N,EP.box,i); if(R) for(let k=0;k<4;k++){ xHide(N,EP.frame,i*4+k); xHide(N,EP.bblk,i*4+k); } if(oBZ&&oBZ.boxes) xHide(N,oBZ.boxes,i);
  const y0=R?0.70:0.45, up=R?0.62:0.35, Fb=XT(F,0,y0,0), NB=E.boxes.length, NR=E.boxes.filter(x=>x.r).length;
  if(R){ const iB={t:'Блок 300×300×60 з матом, 13,4 кг',d:'4 під раму щита; рама — болтами M8×20 у муфти блоків'};
    const lB=XL(N,0,'Блок з матом під раму',`4 шт · ${nf(4*13.4,1)} кг`); [[-0.25,-0.45],[-0.25,0.45],[0.25,-0.45],[0.25,0.45]].forEach(([dx,dy])=>xPart(lB,blkG,MM.vc,XT(F,dx,0,-dy),iB));
    const iR={t:'Рама 41×41×2,5 HDG, 14 кг',d:'Опорні 2 × 1 200 на блоках, стійки 2 × 900, поперечки 2 × 600; щит на 4 кронштейнах'};
    const lR=XL(N,1,'Опорні профілі 41×41, 1 200','2 шт',[0,0.2,0]); [-0.25,0.25].forEach(x=>xPart(lR,G_('br'+x,()=>gB(0.041,0.041,1.2,x,HL+0.0205,0)),MM.frame,F,iR));
    const lP=XL(N,2,'Стійки 900 і поперечки 600 (рама 14 кг)',`2 + 2 · рам ${NR}`,[0,0.36,0]); [-0.25,0.25].forEach(x=>xPart(lP,G_('bp'+x,()=>gB(0.041,0.9,0.041,x,0.104+0.45,-0.13)),MM.frame,F,iR));
    [0.52,0.88].forEach(y=>xPart(lP,G_('bb'+y,()=>gB(0.6,0.041,0.041,0,y,-0.089)),MM.frame,F,iR)); }
  const iC={t:'Щит PV 7/1, IP66, ≥ 600 × 500 × 200',d:'Клас II, 4 кронштейни; низ +0,450, верх +0,950 над покрівлею'+(R?'':'. Кріплення на скаті складу не визначено (питання власнику)')};
  const lC=XL(N,3,'Корпус щита PV 7/1, IP66, ≥ 600 × 500 × 200',`клас II · щитів ${NB}`,[0,up,0],R?'':'Кріплення на скаті складу не визначено');
  [gB(0.6,0.5,0.012,0,0,-0.094),gB(0.012,0.5,0.2,-0.294,0,0),gB(0.012,0.5,0.2,0.294,0,0),gB(0.6,0.012,0.2,0,0.244,0),gB(0.6,0.012,0.2,0,-0.244,0)].forEach((g,k)=>xPart(lC,G_('bc'+k,()=>g),MM.cab,Fb,iC));
  [[-0.27,0.2],[0.27,0.2],[-0.27,-0.2],[0.27,-0.2]].forEach(([x,y],k)=>xPart(lC,G_('bk'+k,()=>gB(0.03,0.04,0.03,x+Math.sign(x)*0.03,y,-0.12)),MM.hw,Fb,iC));
  const Fi=XT(Fb,0,0,-0.085), fw=[0,up,0.42];
  const lF=XL(N,4,'14 запобіжників gPV 32 А 10×38','на обох полюсах кожного стрінга',fw);
  [0.12,-0.04].forEach((y,k)=>xPart(lF,G_('din'+k,()=>gB(0.5,0.035,0.008,0,y,0)),MM.al,Fi,{t:'DIN-рейка',d:'Під запобіжники'}));
  for(let k=0;k<14;k++){ const c=k%7, r=Math.floor(k/7), inf={t:'Запобіжник gPV 32 А 10×38',d:`Вхід ${c+1}, полюс ${r?'«−»':'«+»'}`}; xPart(lF,G_('fu'+k,()=>gB(0.018,0.085,0.06,-0.21+c*0.036,0.12-r*0.16,0.03)),MM.white,Fi,inf); xPart(lF,G_('fc'+k,()=>gB(0.012,0.02,0.002,-0.21+c*0.036,0.15-r*0.16,0.061)),r?MM.black:MM.red,Fi,inf); }
  const lS=XL(N,4,'Роз\'єднувач 2P ≥ 200 А DC-PV2','',[0.12,up,0.48]); xPart(lS,G_('sw',()=>gB(0.075,0.11,0.07,0.19,0.1,0.035)),MM.dark,Fi,{t:'Роз\'єднувач 2P ≥ 200 А DC-PV2',d:'Вимикає вихід щита'}); xPart(lS,G_('swh',()=>gB(0.03,0.05,0.02,0.19,0.1,0.08)),MM.red,Fi,{t:'Роз\'єднувач',d:''});
  const lD=XL(N,4,'ОПН PV тип 1+2','Ucpv ≥ 1 000 В, Up ≤ 4,0 кВ — F1 за Томом 7',[0.16,up,0.36]); xPart(lD,G_('spd',()=>gB(0.054,0.09,0.065,0.19,-0.06,0.032)),MM.white,Fi,{t:'ОПН PV тип 1+2 (F1)',d:'Ucpv ≥ 1 000 В, Up ≤ 4,0 кВ — Том 7'}); xPart(lD,G_('spdw',()=>gB(0.03,0.012,0.002,0.19,-0.04,0.066)),MM.green,Fi,{t:'ОПН',d:''});
  const lM=XL(N,4,'Контроль струму 8 кан. Modbus','адреса = вхід QF',[0,up-0.06,0.5]); xPart(lM,G_('mon',()=>gB(0.12,0.06,0.05,0,-0.155,0.03)),MM.blue,Fi,{t:'Контроль струму 8 кан.',d:'Modbus; адреса = вхід QF'});
  const lE=XL(N,4,'Шина PE','',[0,up-0.1,0.3]); xPart(lE,G_('pe',()=>gB(0.3,0.015,0.015,-0.05,-0.215,0.01)),MM.yellow,Fi,{t:'Шина PE',d:''});
  const lK=XL(N,4,'7 пар MC4 знизу','входи стрінгів XS1…XS7',[0,up-0.22,0.18]); for(let k=0;k<7;k++) [-1,1].forEach(s=>xPart(lK,G_('mc'+k+s,()=>gC(0.009,0.05,10,'y',-0.18+k*0.06+s*0.012,-0.27,0)),s<0?MM.black:MM.dark,Fb,{t:'Конектори MC4',d:`Вхід XS${k+1}: «+» і «−»`}));
  const sc=new THREE.MeshStandardMaterial({color:lc(KCOL[b.K]||0x888888),roughness:0.5});
  const lDr=XL(N,5,'Двері з колірною смугою контейнера',b.K,[-0.72,up,0.1]); xPart(lDr,G_('dr',()=>gB(0.6,0.5,0.012,0,0,0.1)),MM.cab,Fb,{t:'Двері щита',d:'Смуга — колір контейнера '+b.K}); xPart(lDr,G_('drs',()=>gB(0.5,0.05,0.004,0,0.22,0.108)),sc,Fb,{t:'Колірна смуга',d:b.K}); xPart(lDr,G_('drh',()=>gB(0.04,0.08,0.012,0.24,0,0.112)),MM.dark,Fb,{t:'Ручка',d:''});
  const lV=XL(N,6,'Козирок 650 × 350','1,3 кг',[0,up+0.42,0]); xPart(lV,G_('cv',()=>gB(0.65,0.012,0.35,0,0.285,0.03)),MM.frame,Fb,{t:'Козирок 650 × 350, 1,3 кг',d:'Над щитом'});
  N.title=`${b.n} · щит PV 7/1 → ${b.K}`; N.sub=`${b.s.length} стрінгів, ${nf(b.kWp,1)} кВтп, Iмп ${nf(b.Imp,1)} А; вихід Al 2 × 1×${b.Al}, ${nf(b.L,1)} м; маса щита у зборі — немає в даних`;
  N.c=W(b.X,b.Y,h+y0); N.top=0.9; N.vd=2.6; N.vdir=new V3(0.55,0.42,1); return N; }

// ---------- 2. Лоток з опорами (Наш Б): ділянка ±0,9 м від точки — опори, траверси, лоток, кабелі, кришка
function trayNode(hit){ const E=EPX, P=hit.point, X=P.x, Y=-P.z; let best=null, bd=1e9;
  E.runs.forEach((r,ri)=>{ const vx=r[2]-r[0], vy=r[3]-r[1], L2=vx*vx+vy*vy||1, u=Math.max(0,Math.min(1,((X-r[0])*vx+(Y-r[1])*vy)/L2)), d=Math.hypot(r[0]+vx*u-X,r[1]+vy*u-Y); if(d<bd){ bd=d; best=ri; } });
  if(best===null||bd>1.2) return null; const r=E.runs[best], t=r[4], typ=E.types[t], TWd=E.tw[typ][0]/1000, THd=E.tw[typ][1]/1000, im=EP.tray[t], N=xNew(state.proj,best,0.3); N.dim=[];
  const dir=new V3(r[2]-r[0],0,-(r[3]-r[1])).normalize(), M=new M4(), p=new V3(), q=new Q(), s=new V3(), hw=0.9;
  const pieces=[]; for(let k=0;k<im.count;k++){ im.getMatrixAt(k,M); M.decompose(p,q,s); if(s.x<1e-4) continue; const dx=p.x-P.x, dz=p.z-P.z, along=dx*dir.x+dz*dir.z, lat=Math.abs(-dx*dir.z+dz*dir.x); if(Math.abs(along)<=hw&&lat<0.06) pieces.push({k,p:p.clone(),q:q.clone(),L:s.x}); }
  if(!pieces.length) return null; pieces.forEach(o=>xHide(N,im,o.k));
  const sups=[]; E.sup.forEach((sp,k)=>{ if(sp[2]!==t) return; const w=W(sp[0],sp[1],0), dx=w.x-P.x, dz=w.z-P.z, along=dx*dir.x+dz*dir.z, lat=Math.abs(-dx*dir.z+dz*dir.x); if(Math.abs(along)<=hw+0.1&&lat<0.08) sups.push(k); });
  const NS=E.sup.length, Q_=E.Q.trays[typ];
  const lB=XL(N,0,'Опора: блок 300×300×60 з матом',`${sups.length} шт тут · ${nf(NS)} усього`), lT=XL(N,1,'Траверса 41×41×2,5 + болт M8×20 у муфту','поперек лотка',[0,0.12,0]);
  sups.forEach(k=>{ const sp=E.sup[k], h=hOf(sp[0],sp[1]); xHide(N,EP.blk,k); const Mt=xHide(N,EP.trav,k); xPart(lB,blkG,MM.vc,TR(W(sp[0],sp[1],h)),{t:'Блок 300×300×60 з матом, 13,4 кг',d:'Опора лотка, крок 1,5 м; лоток не кріпиться до покрівлі'});
    xPart(lT,BOX,MM.trayD,Mt,{t:'Траверса 41×41×2,5',d:`Довжина ${nf((TWd+0.1)*1000,0)} мм; лоток — 2 болти M8 у гайки з пружиною`}); xPart(lT,G_('bh',()=>gHex(0.013,0.0053,'y',0,0,0)),MM.hw,TR(W(sp[0],sp[1],h+0.104)),{t:'Болт M8×20 у муфту блока',d:''}); });
  const lL=XL(N,2,`Лоток ${typ} перфорований`,`${nf(Q_.all,1)} м усього`,[0,0.3,0]), lW=XL(N,3,'Кабелі в лотку',r[5]?`${r[5]} лін. Al${r[6]?' + 1×6':''}`:'кабелі 1×6',[0,0.52,0]), lV=XL(N,4,'Кришка лотка','на всю трасу',[0,0.74,0]);
  const nAl=(r[5]||0)*2, dAl=0.026, cols=Math.max(1,Math.floor((TWd-0.01)/(dAl+0.004)));
  pieces.forEach(o=>{ const F=new M4().compose(o.p,o.q,ONE3), L=o.L, iL={t:`Лоток ${typ} з кришкою`,d:`Заповнення ${nf(r[8]*100,0)} % (≤ 40 %); ділянка ${nf(r[7],1)} м`};
    xPart(lL,gB(L,0.0015,TWd,0,-THd/2,0),MM.tray,F,iL); xPart(lL,gB(L,THd,0.0015,0,0,TWd/2),MM.tray,F,iL); xPart(lL,gB(L,THd,0.0015,0,0,-TWd/2),MM.tray,F,iL);
    xPart(lV,gB(L,0.0015,TWd+0.006,0,THd/2+0.003,0),MM.trayD,F,{t:'Кришка лотка',d:'На всю трасу; лоток над водою не лежить — над ендовами містки'});
    for(let c=0;c<nAl;c++){ const col=c%cols, row=Math.floor(c/cols); xPart(lW,gC(dAl/2,L,8,'x',0,-THd/2+dAl/2+row*dAl,-TWd/2+0.006+dAl/2+col*(dAl+0.004)),MM.al,F,{t:'Лінія Al 2 × 1×120…240',d:`${r[5]} лін. на ділянці; від щита до ШВ`}); }
    if(r[6]||!r[5]) [MM.red,MM.black].forEach((m,j)=>xPart(lW,gC(0.0035,L,6,'x',0,-THd/2+0.004+(nAl?Math.ceil(nAl/cols)*dAl:0),TWd/2-0.012-j*0.01),m,F,{t:j?'Кабель 1×6 «−»':'Кабель 1×6 «+»',d:'Від стрінгів до щита; кількість по ділянці — у кабельному журналі'})); });
  N.title=`Лоток ${typ} · ділянка ${nf(r[7],1)} м`; N.sub=`${r[5]?r[5]+' лін. Al':'лише кабелі 1×6'}${r[6]&&r[5]?' + кабелі 1×6':''}; заповнення ${nf(r[8]*100,0)} %; опори «блок з матом + траверса», крок 1,5 м; маса лотків — немає в даних`;
  N.c=P.clone(); N.top=0.8; N.vd=2.4; N.vdir=new V3(-dir.z*0.9+dir.x*0.35,0.55,dir.x*0.9+dir.z*0.35); return N; }

// ---------- 3. Контейнер Golen LES-H20 на плиті Фп-1 (Наш Б): ЩПС, плита, сітки, закладні, корпус, двері, кондиціонери
function golenNode(hit){ if(!BS) return null; const P=hit.point, X=P.x, Y=-P.z; let k=null; BS.K.forEach(q=>{ const s=q.slab; if(X>=s[0]-1.5&&X<=s[1]+1.5&&Y>=s[2]-1.5&&Y<=s[3]+1.5) k=q; }); if(!k) return null;
  const grp=ESS.find(o=>o.isGroup&&o.children.some(c=>c.userData.info&&String(c.userData.info.t||'').startsWith(k.id+' · Golen'))); if(!grp) return null;
  const sl=ESS.find(o=>o.isMesh&&o.userData.info&&String(o.userData.info.t||'').startsWith('Фундамент Фп-1 · '+k.id));
  const N=xNew(state.proj,BS.K.indexOf(k),0.3); N.dim=[]; N.unhide=[grp].concat(sl?[sl]:[]); grp.updateMatrixWorld(true);
  const s=k.slab, cx=(s[0]+s[1])/2, cy=(s[2]+s[3])/2, Ls=s[1]-s[0], Ds=s[3]-s[2], F=TR(W(cx,cy,0));
  const l0=XL(N,0,'ЩПС 350 під плитою','ущільнення ≥ 98 %',[0,0.36,0]); xPart(l0,gB(Ls+0.2,0.35,Ds+0.2,0,-0.125,0),MM.conc,F,{t:'Щебенево-піщана суміш 350 мм',d:'Під плитою Фп-1 (том 8, арк. 3); у моделі показано над землею'});
  const l1=XL(N,1,'Плита Фп-1 7 058 × 3 438 × 250','C20/25 F100 W4, верх +0,300',[0,0.9,0]); xPart(l1,gB(Ls,0.25,Ds,0,0.175,0),MM.slab,F,{t:'Плита Фп-1 7 058 × 3 438 × 250',d:'Бетон C20/25 F100 W4, верх +0,300; майданчик обслуговування 1 м (том 8, арк. 3)'});
  const l2=XL(N,2,'2 сітки Ø12 A500C, крок 200','у плиті',[0,1.45,0]); const nx=Math.floor((Ls-0.1)/0.2)+1, nz=Math.floor((Ds-0.1)/0.2)+1, ir={t:'Сітка Ø12 A500C, крок 200',d:'2 сітки в плиті Фп-1, захисний шар — за томом 8'};
  [0.1,0.25].forEach(y=>{ xPart(l2,G_('rx'+nz+y,()=>gMerge(Array.from({length:nz},(_,j)=>gC(0.006,Ls-0.1,6,'x',0,y,-Ds/2+0.05+j*0.2)))),MM.steelD,F,ir); xPart(l2,G_('rz'+nx+y,()=>gMerge(Array.from({length:nx},(_,j)=>gC(0.006,Ds-0.1,6,'z',-Ls/2+0.05+j*0.2,y+0.012,0)))),MM.steelD,F,ir); });
  const gc=grp.position, l3=XL(N,3,'4 закладні МН-1','під кути контейнера (у 3D умовно)',[0,1.95,0]); [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([a,c])=>xPart(l3,G_('mn',()=>gB(0.3,0.012,0.3,0,0,0)),MM.steelD,TR(new V3(gc.x+a*2.85,0.306,gc.z+c*1.05)),{t:'Закладна МН-1',d:'4 шт у плиті (том 8, арк. 3); розмір і положення — за кресленням, у 3D умовно під кутовими фітингами'}));
  const lB=XL(N,4,'Контейнер 20 фт 6 058 × 2 438 × 2 896','≈ 20 т, IP54',[0,2.45,0]), lD=XL(N,5,'Двері відсіків','4 спереду + 1 у торці',[0,2.45,1.3]), lA=XL(N,5,'Кондиціонери на стінах','2 спереду, 4 ззаду',[0,4.0,0]);
  const iB={t:`${k.id} · Golen LES-H20-1205W500C-PS`,d:'20 фт, IP54, ≈ 20 т; АКБ 1 205 кВт·год (5 кластерів × 241), PCS 500 кВт, 12 PV-входів по 60 кВт; повітряне охолодження, аерозольне пожежогасіння'};
  grp.children.forEach(o=>{ if(!(o.isMesh)) return; const m=o.material, M=o.matrixWorld.clone(); let ly=lB, inf=iB;
    if(m===UZM.door){ ly=lD; inf={t:'Двері відсіку',d:'Відсіки АКБ, DC/DC (QF1…QF12 — автомати PV-входів) і PCS; торцеві двері — вхід'}; } else if(m===UZM.ac){ ly=lA; inf={t:'Кондиціонер',d:'Повітряне охолодження контейнера'}; }
    if(o.isInstancedMesh){ const c=new THREE.InstancedMesh(o.geometry,m,o.count); for(let j=0;j<o.count;j++){ o.getMatrixAt(j,_m2); c.setMatrixAt(j,_m2); } c.matrixAutoUpdate=false; c.matrix.copy(M); c.castShadow=true; c.userData.info=inf; ly.g.add(c);
      if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); for(let j=0;j<o.count;j++){ o.getMatrixAt(j,_m2); ly.box.union(o.geometry.boundingBox.clone().applyMatrix4(M.clone().multiply(_m2))); } return; }
    xPart(ly,o.geometry,m,M,inf); });
  N.title=`${k.id} · Golen LES-H20 на плиті Фп-1`; N.sub='АКБ 1 205 кВт·год, PCS 500 кВт, 12 PV-входів; що де всередині (кластери АКБ, PCS, DC/DC) — немає в даних, тому начиння не показано';
  N.c=W(cx,cy,1.4); N.top=2.6; N.vd=12.5; N.vdir=new V3(0.62,0.5,1); return N; }

// ---------- 4. Щогла блискавкозахисту (Вінниця): основи 30 + 15 кг, щогла
function mastNode(i){ const m=RP.masts[i]; if(!m) return null; const N=xNew('rp',i,0.3); N.dim=[]; const h=m[2], z=(()=>{ const M=new M4(); rpBZ.masts[1].getMatrixAt(i,M); return new V3().setFromMatrixPosition(M).y-0.09; })(), F=TR(W(m[0],m[1],z));
  xHide(N,rpBZ.masts[0],i); xHide(N,rpBZ.masts[1],i);
  const iB={t:'Бетонна основа щогли',d:'Комплект FS: основи 30 + 15 кг, Ø 300 / 400 (каталог FS); висота основ — немає в даних, у 3D умовно'};
  const l0=XL(N,0,'Основа бетонна Ø 400, 30 кг','каталог FS'); xPart(l0,G_('mb0',()=>gC(0.2,0.1,24,'y',0,0.05,0)),MM.conc,F,iB);
  const l1=XL(N,1,'Основа бетонна Ø 300, 15 кг','каталог FS',[0,0.35,0]); xPart(l1,G_('mb1',()=>gC(0.15,0.09,24,'y',0,0.145,0)),MM.conc,F,iB);
  const l2=XL(N,2,h===4?'Щогла М-04/40, 4 м':'Щогла М-05/60, 6 м',h===4?'51 шт':'2 шт',[0,0.75,0]); xPart(l2,G_('mr'+h,()=>gC(0.045,h,12,'y',0,0.19+h/2,0)),MAT.mast||MM.zn,F,{t:h===4?'Щогла М-04/40, 4 м':'Щогла М-05/60, 6 м',d:h===4?'Захисний кут 68°, радіус на рівні основи 9,9 м (БЗ арк. 2); комплект 47,5 кг':'Біля майданчика MS-3; радіус 6,4 м'});
  N.title=(h===4?'Щогла М-04/40':'Щогла М-05/60')+' на бетонних основах'; N.sub='РП 2025/12-07, БЗ арк. 2; 53 щогли (51 × 4 м і 2 × 6 м), дріт Ø8 на тримачах, 44 спуски';
  N.c=W(m[0],m[1],z+h*0.4); N.top=1.2; N.vd=h+3.2; N.vdir=new V3(0.7,0.25,0.8); return N; }

// ---------- реєстр: що розбирається подвійним натисканням (модулі з кріпленням — у app.js)
XB.push({has:o=>o===EP.box||(oBZ&&o===oBZ.boxes), build:(o,id)=>boxNode(id)});
XB.push({has:o=>(EP.tray&&EP.tray.includes(o))||o===EP.blk||o===EP.trav||o===EP.fit||o===EP.vx, build:(o,id,p)=>trayNode({point:p})});
XB.push({has:o=>!!(o.isMesh&&state.proj==='ours'&&ESS.some(g=>g.isGroup&&g.children.includes(o)))||!!(o.userData&&o.userData.info&&String(o.userData.info.t||'').startsWith('Фундамент Фп-1')), build:(o,id,p)=>golenNode({point:p})});
XB.push({has:o=>!!(rpBZ.masts&&(o===rpBZ.masts[0]||o===rpBZ.masts[1])), build:(o,id)=>mastNode(id)});

// ---------- підказка один раз: «двічі натисніть — розбереться»
{ const k='antares-twin-dbl'; let seen=false; try{ seen=localStorage.getItem(k)==='1'; }catch(e){}
  const el=document.createElement('div'); el.className='xhint'; el.textContent='Двічі натисніть на елемент — він розбереться'; el.hidden=true;
  const st=document.createElement('style'); st.textContent='.xhint{position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:7;background:var(--ink);color:var(--surface);font-size:13px;padding:7px 12px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.2);pointer-events:none;transition:opacity .4s;white-space:nowrap}';
  document.head.appendChild(st); (document.getElementById('view')||canvas.parentElement).appendChild(el);
  if(!seen){ setTimeout(()=>{ el.hidden=false; setTimeout(()=>{ el.style.opacity=0; setTimeout(()=>el.hidden=true,500); },6500); },2500); try{ localStorage.setItem(k,'1'); }catch(e){} } }

// ---------- «Будівництво»: два натискання на виріб — перехід до його зразка (початок кадру зі зразком того етапу, де виріб з'являється)
{ let dn=null, tap=null;
  const actOf=o=>{ const T=MT.T; if(!T) return null; for(const u of T.ups){ const ims=u.ims||null; if(ims&&ims.includes(o)) return u.act; } for(const sm of T.samp){ let q=o; while(q){ if(q===sm.root) return T.shotAt(sm.t0).act; q=q.parent; } } return null; };
  canvas.addEventListener('pointerdown',e=>{ dn=[e.clientX,e.clientY]; });
  canvas.addEventListener('pointerup',e=>{ if(!MT.active||!dn||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>(e.pointerType==='touch'?12:5)) return;
    const now=performance.now(), dbl=tap&&now-tap.t<420&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<(e.pointerType==='touch'?36:12); tap=dbl?null:{t:now,x:e.clientX,y:e.clientY}; if(!dbl) return;
    const T=MT.T, r=canvas.getBoundingClientRect();
    const L=[]; T.root.traverse(o=>{ if(!o.isMesh||o.isLineSegments2) return; let q=o; while(q){ if(!q.visible) return; q=q.parent; } L.push(o); });
    let h=null; for(const [dx,dy] of [[0,0],[6,0],[-6,0],[0,6],[0,-6]]){ mouse.set((e.clientX+dx-r.left)/r.width*2-1,-(e.clientY+dy-r.top)/r.height*2+1); ray.setFromCamera(mouse,camera); h=ray.intersectObjects(L,false).find(x=>actOf(x.object)); if(h) break; } if(!h) return; const a=actOf(h.object), sh=a.shots.find(s=>s.parts)||a.shots[0]; if(!sh) return;
    jump(sh.t0+0.01); MT.free=false; UI.cam.setAttribute('aria-pressed','true'); UI.cam.innerHTML=CAMH('авто'); setPlayM(true); });
  const up0=TL.prototype.up; TL.prototype.up=function(o){ if(o&&typeof o==='object') o.act=this.cur; return up0.call(this,o); }; }
}

}

