// ================= «Будівництво»: покроковий 3D-монтаж обох проєктів (src/montage.js, 26.10.2026)
// build.sh вставляє цей файл у кінець app.js (перед останнім «})();»), тому тут видно сцену, стан і функції двійника.
// Правила — документ проєкту «Антарес_3D_монтаж_правила_розробки_26.10»: лише дані двійника і документів проєкту,
// чого немає — показано без значення; зразок кожного елемента — завжди повільно; лічильники = кількості з документів.
{
const MT={active:false,proj:null,t:0,play:false,spd:1,free:false,tls:{},tp:{},T:null,last:0,dirty:true,sample:null,blend:null,uiT:0,warnId:null,sumClosed:false,stageIx:-1,paneKey:''};
const SPDS=[1,2,5];
const V=(x,y,z)=>new V3(x,y,z);
const c01=x=>x<0?0:x>1?1:x;
const smooth=x=>{ x=c01(x); return x*x*(3-2*x); };
const eOut=x=>{ x=c01(x); return 1-Math.pow(1-x,3); };
const eBack=x=>{ x=c01(x); const c=1.6; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const fm=m=>m==null?'—':m<1?nf(m*1000,m<0.01?1:0)+' г':nf(m,m<10?2:1)+' кг';
const ft=v=>v>=1000?nf(v/1000,v>=1e5?0:1)+' т':nf(v,0)+' кг';
const fq=v=>typeof v==='number'?nf(v,Math.abs(v%1)>1e-9?1:0):v;
const fmtT=s=>{ s=Math.max(0,Math.round(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const wide=()=>{ const v=canvas.parentElement; return v.clientWidth>=760; };
const ub=(S,x)=>{ let lo=0,hi=S.length; while(lo<hi){ const m=(lo+hi)>>1; if(S[m]<=x) lo=m+1; else hi=m; } return lo; };
const MTG=new THREE.Group(); MTG.name='montage'; MTG.visible=false; scene.add(MTG);
const _m=new M4(), _v=new V3(), _v2=new V3(), _qq=new Q(), _ss=new V3();

// ---------- матеріали монтажу
const MM={ wood:std(0xb98a55,{roughness:0.9}), crane:std(0xe3a51c,{roughness:0.5,metalness:0.25}), craneD:std(0x3b4248,{roughness:0.6,metalness:0.4}),
  card:std(0xc9a874,{roughness:0.9}), table:std(0x8f918b,{roughness:0.8}), red:std(0xc62828,{roughness:0.5}), black:std(0x22272b,{roughness:0.5}),
  hose:std(0x6f7376,{metalness:0.5,roughness:0.5}), steel:std(0x9aa5ad,{metalness:0.55,roughness:0.4}), zn:std(0xb9c3ca,{metalness:0.55,roughness:0.42}),
  conc:std(0xb5b2a9,{roughness:0.95}), sheet:std(0xa7a59c,{metalness:0.3,roughness:0.6,side:THREE.DoubleSide}), alu:std(0xd5dadd,{metalness:0.5,roughness:0.35}),
  cu:std(0xc77a3a,{metalness:0.6,roughness:0.4}), green:std(0x8fbf1f,{roughness:0.5}), cab:std(0xdfe4e8,{roughness:0.5}), dark:std(0x3a4045,{roughness:0.6,metalness:0.4}),
  white:std(0xf2f2ee,{roughness:0.5}), orange:std(0xe0782b,{roughness:0.5}), blue:std(0x2a5db0,{roughness:0.5}), yellow:std(0xe8c547,{roughness:0.5}) };
Object.values(MM).forEach(m=>m.color.convertSRGBToLinear());
MM.glass=new THREE.MeshStandardMaterial({color:lin(0xcfe3f0),roughness:0.08,metalness:0.1,transparent:true,opacity:0.38,depthWrite:false});
MM.cells=new THREE.MeshStandardMaterial({color:0xffffff,map:pvTex,roughness:0.4,metalness:0.2});
MM.ghost=new THREE.MeshStandardMaterial({color:lin(0x5d7fae),roughness:0.5,transparent:true,opacity:0.25,depthWrite:false});
const BX=(w,h,d,m,x=0,y=0,z=0,p)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; if(p) p.add(o); return o; };
const CY=(r,h,m,x=0,y=0,z=0,p,seg=16,ax)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),m); o.position.set(x,y,z); if(ax==='x') o.rotation.z=Math.PI/2; if(ax==='z') o.rotation.x=Math.PI/2; o.castShadow=true; o.receiveShadow=true; if(p) p.add(o); return o; };
const GR=(p,x=0,y=0,z=0)=>{ const g=new THREE.Group(); g.position.set(x,y,z); if(p) p.add(g); return g; };
// болт: шестигранна голова + стрижень, вісь y, голова вгорі; d і L у мм
function bolt(d,L,m,p,x=0,y=0,z=0,ax){ const g=GR(p,x,y,z), k=d*0.65/1000, R=d*0.95/1000; CY(R,k,m,0,L/2000+k/2,0,g,6); CY(d/2000,L/1000,m,0,0,0,g,10);
  if(ax==='x') g.rotation.z=-Math.PI/2; if(ax==='-x') g.rotation.z=Math.PI/2; if(ax==='z') g.rotation.x=Math.PI/2; return g; }
// кадр на покрівлі цеху: точка X, Y і висота h уздовж нормалі
function fr(X,Y,h){ const a=Math.atan(roofK(X)), q=new Q().setFromAxisAngle(ZA,a), up=V(-Math.sin(a),Math.cos(a),0); return {p:W(X,Y,roofZ(X)).addScaledVector(up,h),q,a}; }
function view(p,c){ return {p:V(...p),c:V(...c)}; }
function look(X,Y,h,D,az,el){ const c=W(X,Y,h), o=V(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).multiplyScalar(D); return {p:c.clone().add(o),c}; }
const OV_SE=view([150,82,52],[50,4,-46]), OV_SW=view([-46,84,52],[50,4,-46]), OV_NE=view([150,80,-150],[52,4,-48]), TOPV=view([56,175,-20],[52,0,-46]);
function orbit(cx,cy,cz,R,h,a0,a1,t0,t1){ return {fn:t=>{ const s=smooth((t-t0)/(t1-t0)), a=a0+(a1-a0)*s; return {p:V(cx+R*Math.sin(a),h,cz+R*Math.cos(a)),c:V(cx,cy,cz)}; }}; }
function pan(A,B,t0,t1){ return {fn:t=>{ const s=smooth((t-t0)/(t1-t0)), a=evV(A,t), b=evV(B,t); return {p:a.p.lerp(b.p,s),c:a.c.lerp(b.c,s)}; }}; }

// ---------- реєстр змін, щоб при виході з розділу повернути сцену як була
const REG={vis:new Map(),mat:new Map(),rng:new Map(),pos:new Map(),zero:new Set()};
const rVis=o=>{ if(!REG.vis.has(o)) REG.vis.set(o,o.visible); };
const rMat=im=>{ if(!REG.mat.has(im)) REG.mat.set(im,Float32Array.from(im.instanceMatrix.array)); return REG.mat.get(im); };
const rRng=l=>{ if(!REG.rng.has(l)) REG.rng.set(l,[l.geometry.drawRange.start,l.geometry.drawRange.count]); };
const rPos=o=>{ if(!REG.pos.has(o)) REG.pos.set(o,o.position.clone()); return REG.pos.get(o); };
function regRestore(){ REG.mat.forEach((a,im)=>{ im.instanceMatrix.array.set(a); im.instanceMatrix.needsUpdate=true; }); REG.vis.forEach((v,o)=>o.visible=v);
  REG.rng.forEach((r,l)=>l.geometry.setDrawRange(r[0],r[1])); REG.pos.forEach((p,o)=>o.position.copy(p));
  REG.vis.clear(); REG.mat.clear(); REG.rng.clear(); REG.pos.clear(); REG.zero.clear(); }
const zeroAll=im=>{ if(REG.zero.has(im)) return; REG.zero.add(im); rMat(im); const a=im.instanceMatrix.array, z=ZERO.elements; for(let i=0;i<im.count;i++) a.set(z,i*16); im.instanceMatrix.needsUpdate=true; };

// ---------- розкладання екземплярів: кожен має час початку s і тривалість d; вигляд — функція часу
function Rev(im,items,kind,o){ items.sort((a,b)=>a.s-b.s); const n=items.length; this.im=im; this.n=n; this.kind=kind; this.o=o||{};
  this.I=new Int32Array(n); this.S=new Float32Array(n); this.D=new Float32Array(n); this.A=new Array(n); let dm=0;
  items.forEach((x,k)=>{ this.I[k]=x.i; this.S[k]=x.s; this.D[k]=Math.max(0.02,x.d); this.A[k]=x.a; if(x.d>dm) dm=x.d; }); this.dm=dm+0.02; this.fin=0; this.hi=0; this.O=null;
  this.t0=n?this.S[0]:0; this.t1=n?this.S[n-1]+dm:0; }
Rev.prototype.bind=function(){ this.O=rMat(this.im); zeroAll(this.im); this.fin=0; this.hi=0; };
Rev.prototype.put=function(k,p){ const i=this.I[k], a=this.im.instanceMatrix.array, O=this.O, b=i*16; for(let j=0;j<16;j++) a[b+j]=O[b+j]; if(p>=1) return;
  const kd=this.kind, x=this.A[k]||this.o;
  if(kd==='drop'){ a[b+13]+=(x.h||0.6)*(1-eOut(p)); }
  else if(kd==='pop'){ const s=Math.max(0.001,eBack(p)); for(const j of [0,1,2,4,5,6,8,9,10]) a[b+j]*=s; }
  else if(kd==='grow'){ const f=Math.max(0.002,eOut(p)); for(const j of [8,9,10]){ a[b+j]=O[b+j]*f; a[b+j+4]+=O[b+j]*(1-f)/2; } }
  else if(kd==='slide'){ const q=0.32; if(p<q){ a[b+13]+=(x.h||0.6)*(1-eOut(p/q)); a[b+14]+=x.dz; } else a[b+14]+=x.dz*(1-smooth((p-q)/(1-q))); } };
Rev.prototype.set=function(t){ const n=this.n; if(!n) return; const S=this.S, hi=ub(S,t), lo=ub(S,t-this.dm), arr=this.im.instanceMatrix.array; let ch=false;
  if(this.hi>hi){ for(let k=hi;k<this.hi;k++) arr.set(ZERO.elements,this.I[k]*16); ch=true; }
  if(lo>this.fin){ for(let k=this.fin;k<lo;k++) this.put(k,1); ch=true; }
  for(let k=lo;k<hi;k++){ this.put(k,(t-S[k])/this.D[k]); ch=true; }
  this.fin=lo; this.hi=hi; if(ch) this.im.instanceMatrix.needsUpdate=true; };
Rev.prototype.cnt=function(){ return this.hi; };
// лінії: прокладання за drawRange
function LRev(l,s0,s1){ this.l=l; this.seg=l.geometry.attributes.position.count/2; this.s0=s0; this.s1=s1; this.k=-1;
  const p=l.geometry.attributes.position.array, cum=new Float32Array(this.seg+1); for(let i=0;i<this.seg;i++){ const b=i*6; cum[i+1]=cum[i]+Math.hypot(p[b+3]-p[b],p[b+4]-p[b+1],p[b+5]-p[b+2]); } this.cum=cum; }
LRev.prototype.bind=function(){ rRng(this.l); this.k=-1; this.l.geometry.setDrawRange(0,0); };
LRev.prototype.set=function(t){ const f=c01((t-this.s0)/(this.s1-this.s0)), k=Math.floor(this.seg*f+1e-6); if(k!==this.k){ this.l.geometry.setDrawRange(0,k*2); this.k=k; } };
LRev.prototype.frac=function(){ return this.seg?Math.max(0,this.k)/this.seg:0; };
// видимість об'єктів з моменту t0 (до t1), з підйомом-опусканням
function VAct(objs,t0,t1,h){ this.o=objs; this.t0=t0; this.t1=t1==null?1e9:t1; this.h=h||0; this.st=null; }
VAct.prototype.bind=function(){ this.o.forEach(o=>{ rVis(o); if(this.h) rPos(o); o.visible=false; }); this.st=null; };
VAct.prototype.set=function(t){ const v=t>=this.t0&&t<this.t1, p=this.h?c01((t-this.t0)/0.9):1, st=v?(p<1?'a':'v'):'h'; if(st===this.st&&st!=='a') return; this.st=st;
  this.o.forEach(o=>{ o.visible=v; if(this.h){ const b=REG.pos.get(o); if(b) o.position.set(b.x,b.y+this.h*(1-eOut(p)),b.z); } }); };
// палети і стопки по периметру: з'являються і зникають, коли їх розібрали
function Stacks(parent,slots,parts,n,ap){ this.n=n; this.slots=slots; this.A=ap; this.R=new Float32Array(n).fill(1e9); this.st=new Int8Array(n).fill(-1);
  this.ims=parts.map(pt=>{ const im=inst(BOX,pt.m,n,parent); im.frustumCulled=false; return {im,pt}; }); this.F=[];
  for(let k=0;k<n;k++){ const sl=slots[k%slots.length], tier=Math.floor(k/slots.length), f=fr(sl.X,sl.Y,0); _qq.copy(f.q).multiply(new Q().setFromAxisAngle(V(0,1,0),sl.rot?Math.PI/2:0)); this.F.push({p:f.p,q:_qq.clone(),tier}); } }
Stacks.prototype.bind=function(){ this.st.fill(-1); this.ims.forEach(({im})=>{ const a=im.instanceMatrix.array; for(let k=0;k<this.n;k++) a.set(ZERO.elements,k*16); im.instanceMatrix.needsUpdate=true; }); };
Stacks.prototype.set=function(t){ let ch=false; for(let k=0;k<this.n;k++){ const v=t>=this.A[k]&&t<this.R[k], p=v?c01((t-this.A[k])/0.35):0, st=v?(p<1?1:2):0; if(st===this.st[k]&&st!==1) continue; this.st[k]=st; ch=true;
    const F=this.F[k], sc=st===1?Math.max(0.01,eBack(p)):1;
    this.ims.forEach(({im,pt})=>{ if(!v){ im.setMatrixAt(k,ZERO); return; } const hh=pt.y+F.tier*pt.th; _v.set(0,hh*sc,0).applyQuaternion(F.q).add(F.p); _m.compose(_v,F.q,_ss.set(pt.w*sc,pt.h*sc,pt.d*sc)); im.setMatrixAt(k,_m); }); }
  if(ch) this.ims.forEach(({im})=>im.instanceMatrix.needsUpdate=true); };
Stacks.prototype.cnt=function(t){ let c=0; for(let k=0;k<this.n;k++) if(t>=this.A[k]&&t<this.R[k]) c++; return c; };

// ---------- автокран: шасі, поворотна частина, телескопічна стріла, канат, гак; один підйом показано докладно
function Crane(parent,X,Y,ta){ const g=GR(parent); g.position.copy(W(X,Y,0)); this.g=g; this.ta=ta; this.L=[]; this.X=X; this.Y=Y;
  BX(10.2,1.0,2.55,MM.craneD,0,1.0,0,g); BX(10.0,0.55,2.5,MM.crane,0,1.75,0,g); BX(2.3,2.0,2.5,MM.crane,5.0,2.2,0,g); BX(0.06,1.1,2.2,MM.glass,6.17,2.5,0,g);
  [-3.6,-2.2,1.2,2.6,4.2].forEach(x=>[-1.15,1.15].forEach(z=>CY(0.55,0.42,MM.black,x,0.55,z,g,20,'z')));
  [[-4.6,1],[-4.6,-1],[3.6,1],[3.6,-1]].forEach(([x,s])=>{ BX(0.32,0.32,2.6,MM.crane,x,1.15,s*2.35,g); BX(0.6,0.12,0.6,MM.conc,x,0.06,s*3.55,g); BX(0.2,1.0,0.2,MM.craneD,x,0.6,s*3.55,g); });
  this.tur=GR(g,-2.6,2.05,0); BX(3.2,1.3,2.5,MM.crane,0,0.65,0,this.tur); BX(1.6,1.4,0.9,MM.crane,-0.3,0.7,-0.9,this.tur); BX(1.2,1.2,1.6,MM.craneD,-1.8,0.6,0,this.tur);
  this.piv=V(X-2.6,3.4,-Y); const bg=new THREE.BoxGeometry(1,0.78,0.72); bg.translate(0.5,0,0); this.boom=new THREE.Mesh(bg,MM.crane); this.boom.castShadow=true; parent.add(this.boom);
  const bg2=new THREE.BoxGeometry(1,0.6,0.56); bg2.translate(0.5,0,0); this.boom2=new THREE.Mesh(bg2,MM.craneD); this.boom2.castShadow=true; parent.add(this.boom2);
  const cg=new THREE.BufferGeometry(); cg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3)); this.cable=new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:0x1d1f21})); this.cable.frustumCulled=false; parent.add(this.cable);
  this.hook=GR(parent); BX(0.42,0.5,0.3,MM.craneD,0,0.25,0,this.hook); BX(0.12,0.3,0.12,MM.yellow,0,-0.12,0,this.hook);
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(24),3)); this.sl=new THREE.LineSegments(sg,new THREE.LineBasicMaterial({color:0x6b6f73})); this.sl.frustumCulled=false; parent.add(this.sl);
  this.parts=[this.boom,this.boom2,this.cable,this.hook,this.sl]; }
Crane.prototype.lift=function(o){ o.Hc=Math.max(o.A.y,o.B.y)+o.rig+3.5; this.L.push(o); return o; };
Crane.prototype.bind=function(){ this.L.forEach(L=>{ if(L.real){ rVis(L.load); rPos(L.load); } }); };
Crane.prototype.hookAt=function(L,u){ const P=this.piv, A=L.A, B=L.B, rig=L.rig, H=L.Hc;
  const pa=V(A.x,A.y+rig,A.z), pb=V(B.x,B.y+rig,B.z), ha=V(A.x,H,A.z), hb=V(B.x,H,B.z); let hk, att;
  if(u<0.12){ hk=V(A.x,H,A.z).lerp(pa,smooth(u/0.12)); att=false; }
  else if(u<0.4){ hk=pa.clone().lerp(ha,smooth((u-0.12)/0.28)); att=true; }
  else if(u<0.72){ const s=smooth((u-0.4)/0.32), a0=Math.atan2(A.z-P.z,A.x-P.x), a1=Math.atan2(B.z-P.z,B.x-P.x); let da=a1-a0; while(da>Math.PI) da-=2*Math.PI; while(da<-Math.PI) da+=2*Math.PI;
    const r0=Math.hypot(A.x-P.x,A.z-P.z), r1=Math.hypot(B.x-P.x,B.z-P.z), a=a0+da*s, r=r0+(r1-r0)*s; hk=V(P.x+r*Math.cos(a),H,P.z+r*Math.sin(a)); att=true; }
  else if(u<0.92){ hk=hb.clone().lerp(pb,smooth((u-0.72)/0.2)); att=true; }
  else { hk=pb.clone().lerp(V(B.x,B.y+rig+2.2,B.z),smooth((u-0.92)/0.08)); att=false; }
  return {hk,att}; };
Crane.prototype.set=function(t){ const vis=t>=this.ta; this.g.visible=vis; this.parts.forEach(o=>o.visible=vis);
  let act=null,u=0,last=null; this.L.forEach(L=>{ const uu=(t-L.t0)/(L.t1-L.t0); if(uu>=0&&uu<=1){ act=L; u=uu; } if(uu>1) last=L;
    const ld=L.load; if(uu<0){ ld.visible=vis&&t>=L.tShow; ld.position.copy(L.A); } else if(uu>1){ ld.visible=L.after!=='hide'; ld.position.copy(L.B); } });
  if(!vis) return; let hk, att=false, H;
  if(act){ const r=this.hookAt(act,u); hk=r.hk; att=r.att; H=act.Hc; if(att){ act.load.visible=true; act.load.position.set(hk.x,hk.y-act.rig,hk.z); } else if(u<0.12){ act.load.visible=true; act.load.position.copy(act.A); } else { act.load.visible=act.after!=='hide'||u<0.999; act.load.position.copy(act.B); } }
  else if(last){ H=last.Hc; hk=V(last.B.x,last.B.y+last.rig+2.2,last.B.z); }
  else { const L=this.L[0]; H=L?L.Hc:12; hk=L?V(L.A.x,H,L.A.z):V(this.piv.x-6,10,this.piv.z); }
  const P=this.piv, tip=V(hk.x,H+3.2,hk.z), d=tip.clone().sub(P), Lb=d.length(); d.normalize();
  _qq.setFromUnitVectors(V(1,0,0),d); this.boom.position.copy(P); this.boom.quaternion.copy(_qq); this.boom.scale.set(Lb*0.55,1,1);
  this.boom2.position.copy(P).addScaledVector(d,Lb*0.5); this.boom2.quaternion.copy(_qq); this.boom2.scale.set(Lb*0.5,1,1);
  this.tur.rotation.y=-Math.atan2(tip.z-P.z,tip.x-P.x)+Math.PI;
  const ca=this.cable.geometry.attributes.position.array; ca.set([tip.x,tip.y-0.3,tip.z,hk.x,hk.y+0.5,hk.z, tip.x+0.2,tip.y-0.3,tip.z,hk.x+0.12,hk.y+0.5,hk.z]); this.cable.geometry.attributes.position.needsUpdate=true;
  this.hook.position.copy(hk);
  const sa=this.sl.geometry.attributes.position.array; if(act&&att){ const L=act, w=L.sw||[0.55,0.4], b=V(hk.x,hk.y-L.rig+(L.top||0.5),hk.z); let q=0;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sz])=>{ sa.set([hk.x,hk.y,hk.z,b.x+sx*w[0],b.y,b.z+sz*w[1]],q); q+=6; }); this.sl.visible=true; }
  else this.sl.visible=false; this.sl.geometry.attributes.position.needsUpdate=true; };

// ---------- зразок: виріб повільно обертається, деталі розлітаються і збираються; підписи збоку з виносками
const SP=W(121,22,0);
const SAMPT=new THREE.Group(); MTG.add(SAMPT); BX(2.6,0.86,1.4,MM.table,0,0.43,0,SAMPT); SAMPT.position.copy(SP); SAMPT.visible=false;
function Sample(def,t0,Ts){ this.def=def; this.t0=t0; this.Ts=Ts; this.t1=t0+Ts; this.g=null; this.parts=null; }
Sample.prototype.build=function(){ if(this.g) return; const d=this.def, g=new THREE.Group(); g.position.copy(SP).add(V(0,d.table===false?0:0.9,0)); MTG.add(g); this.g=g; g.visible=false;
  this.inner=GR(g); this.parts=d.make(this.inner).map(p=>Object.assign({},p,{home:p.o.position.clone(),ex:V(...(p.ex||[0,0,0]))}));
  // рамка камери: сфера навколо зібраного і розібраного виробу
  g.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(this.inner); this.parts.forEach(p=>p.o.position.copy(p.home).add(p.ex)); g.updateMatrixWorld(true); b.union(new THREE.Box3().setFromObject(this.inner)); this.parts.forEach(p=>p.o.position.copy(p.home));
  const sp=b.getBoundingSphere(new THREE.Sphere()); this.R=sp.radius; this.cy=sp.center.y-g.position.y; };
Sample.prototype.bind=function(){ this.build(); this.g.visible=false; };
Sample.prototype.e=function(u){ const T=this.Ts; return u<0.9?0:u<0.9+0.3*T?smooth((u-0.9)/(0.3*T)):u<0.74*T?1:u<T-0.9?1-smooth((u-0.74*T)/(0.26*T-0.9)):0; };
Sample.prototype.set=function(t){ const u=t-this.t0, v=u>=0&&u<=this.Ts; this.g.visible=v; if(!v) return; const e=this.e(u), sc=u<0.7?Math.max(0.05,eBack(u/0.7)):u>this.Ts-0.4?Math.max(0.05,1-(u-this.Ts+0.4)/0.4):1;
  this.g.scale.setScalar(sc); this.inner.rotation.y=(this.def.rot0||0.5)+(this.def.spin===false?0:0.2*u);
  this.parts.forEach(p=>{ p.o.position.copy(p.home).addScaledVector(p.ex,e); }); if(this.def.anim) this.def.anim(u,e,this.parts,this); };
Sample.prototype.on=function(t){ const u=t-this.t0; return u>=0.8&&u<=this.Ts-0.35; };
function sView(d,s){ return {fn:()=>{ if(!s.g) s.build(); const c=SP.clone().add(V(0,(d.table===false?0:0.9)+(s.cy??d.cy??0),0)), el=d.el??0.42, az=-(d.az??0.8), D=Math.max(d.near||0,(s.R||1)/Math.sin(camera.fov*D2R/2)*1.2);
  const o=V(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).multiplyScalar(D), p=c.clone().add(o);
  if(wide()){ const f=o.clone().negate().normalize(), r=V(0,0,0).crossVectors(f,V(0,1,0)).normalize(), hw=D*Math.tan(camera.fov*D2R/2)*camera.aspect; r.multiplyScalar(hw*0.3); p.add(r); c.add(r); }
  return {p,c}; }}; }

// ---------- шкала часу проєкту
function TL(proj){ this.proj=proj; this.t=0; this.st=[]; this.acts=[]; this.cams=[]; this.caps=[]; this.slow=[]; this.warn=[]; this.tags=[]; this.mus=[]; this.cnt=[]; this.samp=[]; this.root=GR(MTG); this.root.visible=false; this.prep=[]; }
TL.prototype.stage=function(id,title,lead){ if(this.cur) this.cur.t1=this.t; const s={id,title,lead,t0:this.t,t1:null,cnt:[],no:this.st.length}; this.st.push(s); this.cur=s; return s; };
TL.prototype.adv=function(dt){ this.t+=dt; return this.t; };
TL.prototype.view=function(a,b,v){ this.cams.push({t:a,v},{t:b,v}); };
TL.prototype.cap=function(t,txt){ this.caps.push({t,txt}); };
TL.prototype.act=function(a){ this.acts.push(a); return a; };
TL.prototype.counter=function(c){ c.st=this.cur.id; this.cnt.push(c); this.cur.cnt.push(c); return c; };
TL.prototype.music=function(t,m){ this.mus.push({t,m}); };
TL.prototype.slowI=function(a,b){ this.slow.push([a,b]); };
TL.prototype.sample=function(def){ const Ts=def.T||12, t0=this.t, s=new Sample(def,t0,Ts); this.samp.push(s); this.act(s); this.slowI(t0,t0+Ts); this.view(t0+1.4,t0+Ts-0.2,sView(def,s));
  this.cap(t0,def.cap||('Зразок: '+def.title)); this.music(t0,'calm'); this.adv(Ts); return s; };
TL.prototype.done=function(){ this.cur.t1=this.t; this.T=this.t; this.cams.sort((a,b)=>a.t-b.t); this.caps.sort((a,b)=>a.t-b.t); this.mus.sort((a,b)=>a.t-b.t); };
TL.prototype.isSlow=function(t){ return this.slow.some(([a,b])=>t>=a&&t<b); };
TL.prototype.stageAt=function(t){ let s=this.st[0]; for(const x of this.st) if(x.t0<=t+1e-6) s=x; return s; };
// розклад: перші k повільно (камера близько), решта рівномірно швидко
function sched(n,t0,T,o){ const k=Math.min(n,o.k||0), s=new Float32Array(n), d=new Float32Array(n); for(let i=0;i<k;i++){ s[i]=t0+i*o.gs; d[i]=o.ds; }
  const tf=t0+k*(o.gs||0), tf1=Math.max(tf,t0+T-o.df), m=n-k; for(let j=0;j<m;j++){ s[k+j]=tf+(m>1?(tf1-tf)*j/(m-1):0); d[k+j]=o.df; } return {s,d,tf,te:t0+T}; }
const nv=v=>({p:Array.isArray(v.p)?V(...v.p):v.p.clone(),c:Array.isArray(v.c)?V(...v.c):v.c.clone()});
function evV(v,t){ return v.fn?v.fn(t):nv(v); }
function camAt(T,t){ const K=T.cams; if(!K.length) return null; let i=0; while(i<K.length-1&&K[i+1].t<=t) i++; const a=K[i], b=K[i+1];
  if(!b||t<=a.t) return evV(a.v,Math.max(t,a.t)); if(a.v===b.v) return evV(a.v,t); const s=smooth((t-a.t)/(b.t-a.t)), A=evV(a.v,a.t), B=evV(b.v,b.t); return {p:A.p.lerp(B.p,s),c:A.c.lerp(B.c,s)}; }

// ---------- місця для палет і стопок по периметру покрівлі цеху (вільні від модулів, ліхтарів і перешкод)
function roofSlots(rects,step,w,d){ const out=[], S_=DATA.site;
  const free=(X,Y,rot)=>{ const hx=(rot?d:w)/2+0.12, hy=(rot?w:d)/2+0.12; if(X-hx<SHOP[0]+0.1||X+hx>SHOP[1]-0.1||Y-hy<SHOP[2]+0.1||Y+hy>SHOP[3]-0.1) return false;
    for(const o of S_.obs) if(Math.abs(o[0]-X)<hx+o[2]/2+0.3&&Math.abs(o[1]-Y)<hy+o[2]/2+0.3) return false;
    for(const l of S_.lan) if(X+hx>l[0]-0.4&&X-hx<l[1]+0.4&&Y+hy>l[2]-0.4&&Y-hy<l[3]+0.4) return false;
    for(const r of rects) if(X+hx>r[0]&&X-hx<r[1]&&Y+hy>r[2]&&Y-hy<r[3]) return false; return true; };
  const add=(X,Y,rot)=>{ if(free(X,Y,rot)) out.push({X,Y,rot}); };
  const xe=SHOP[1]-0.95, xw=SHOP[0]+0.75, ys=SHOP[2]+0.7, yn=SHOP[3]-0.75;
  for(let Y=43;Y<SHOP[3]-1;Y+=step) add(xe,Y,1); for(let Y=43-step;Y>SHOP[2]+1;Y-=step) add(xe,Y,1);
  for(let X=SHOP[1]-3;X>SHOP[0]+1;X-=step) add(X,ys,0); for(let Y=SHOP[2]+3;Y<SHOP[3]-1;Y+=step) add(xw,Y,1); for(let X=SHOP[0]+3;X<SHOP[1]-3;X+=step) add(X,yn,0);
  return out; }
const PALP=[{m:MM.wood,w:1.2,h:0.144,d:0.8,y:0.072,th:0.63},{m:MAT.blk,w:1.2,h:0.48,d:0.6,y:0.384,th:0.63}];
const PANP=[{m:MM.wood,w:2.42,h:0.12,d:1.32,y:0.06,th:1.3},{m:MM.card,w:2.42,h:1.12,d:1.32,y:0.68,th:1.3}];
function palletObj(parent){ const g=GR(parent); BX(1.2,0.144,0.8,MM.wood,0,0.072,0,g); BX(1.2,0.48,0.6,MAT.blk,0,0.384,0,g); g.visible=false; return g; }

// ---------- музика: власна, з браузера (Web Audio), ля мінор, 112 уд./хв; спокійно під зразок, ритм під розкладання
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

// ---------- розмітка інтерфейсу: панель керування, підписи зразка, картки
{ const st=document.createElement('style'); st.textContent=`
.mtbar{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:5;display:flex;flex-direction:column;gap:5px;width:min(880px,calc(100% - 20px));background:color-mix(in srgb,var(--surface) 95%,transparent);border:1px solid var(--line);border-radius:12px;padding:7px 9px 7px 11px;backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.14)}
.mtbar .t{display:flex;flex-direction:column;min-width:0;font-size:12px;color:var(--ink-2);line-height:1.35}
.mtbar .t b{color:var(--ink);font-size:13.5px;font-weight:650}
.mtbar .t b em{font-style:normal;font:500 11.5px var(--mono);color:var(--ink-3);margin-right:6px}
.mtbar .t span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mtc{display:flex;align-items:center;gap:5px;min-width:0}
.mtc button{flex:none;height:30px;min-width:32px;border-radius:8px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);font-size:13px;padding:0 9px;white-space:nowrap}
.mtc button.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent);min-width:42px;font-weight:600}
.mtc button[aria-pressed="false"]{color:var(--ink-3)}
.mtc input[type=range]{accent-color:var(--accent);min-width:0}
#mtPos{flex:1 1 auto;min-width:50px}
#mtVol{width:68px;flex:none}
.mtc .tm{flex:none;font:500 12px var(--mono);color:var(--ink-2);text-align:right;white-space:nowrap}
.mtl{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden}
.mtx{position:absolute;left:0;top:0;display:flex;gap:6px;align-items:flex-start;font-size:11.5px;line-height:1.25;color:var(--ink);background:color-mix(in srgb,var(--surface) 94%,transparent);border:1px solid var(--line);border-radius:7px;padding:4px 8px 4px 5px;width:max-content;max-width:300px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.mtx b{font:700 10.5px/16px var(--mono);min-width:16px;height:16px;border-radius:50%;background:var(--ink);color:var(--surface);text-align:center;flex:none}
.mtx span{display:flex;flex-direction:column;min-width:0}
.mtx .nm{font-weight:600;white-space:normal}
.mtx em{font-style:normal;color:var(--ink-3);font:400 11px var(--mono);white-space:normal}
.mtx i{font-style:normal;color:var(--ink-2);font:500 11px var(--mono);white-space:normal}
.mtn{position:absolute;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:var(--ink);color:var(--surface);font:700 11px/20px var(--mono);text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.mtl svg path{fill:none;stroke:var(--ink-3);stroke-width:1;opacity:.9} .mtl svg circle{fill:var(--ink)}
.mtinfo{position:absolute;left:10px;bottom:118px;z-index:3;width:max-content;max-width:min(300px,30%);background:color-mix(in srgb,var(--surface) 94%,transparent);border:1px solid var(--line);border-radius:9px;padding:7px 10px;font-size:12px;line-height:1.4;color:var(--ink-2);backdrop-filter:blur(6px)}
.mtinfo b{display:block;color:var(--ink);font-size:13px;margin-bottom:2px}
.mtinfo div{font-family:var(--mono);font-size:11.5px}
.mtwarn{position:absolute;right:66px;top:10px;z-index:4;width:max-content;max-width:min(500px,calc(100% - 140px));background:var(--surface);border:1px solid #d64545;border-left:4px solid #d64545;border-radius:9px;padding:7px 11px;font-size:12px;line-height:1.4;color:var(--ink-2);box-shadow:0 4px 14px rgba(0,0,0,.14)}
.mtwarn b{color:#d64545;display:block;font-size:13px}
.mtwarn.inf{border-color:var(--accent)} .mtwarn.inf b{color:var(--accent)}
.mtwarn.low{right:auto;left:10px;top:auto;bottom:118px;max-width:min(420px,40%)}
.mtwarn span{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.mttag{position:absolute;left:0;top:0;z-index:3;pointer-events:none;background:var(--ink);color:var(--surface);font:600 11.5px/1.3 var(--font);padding:3px 8px;border-radius:6px;white-space:nowrap;transform-origin:0 100%}
.mtsum{position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:6;width:min(640px,calc(100% - 24px));max-height:calc(100% - 150px);overflow:auto;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px 10px;box-shadow:0 10px 30px rgba(0,0,0,.2)}
.mtsum h2{margin:0 0 6px;font-size:15px} .mtsum .x{position:absolute;right:8px;top:6px;border:0;background:none;font-size:18px;color:var(--ink-2)}
.mtsum .cmp td,.mtsum .cmp th{padding:4px 6px}
.mtst{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.mtst button{width:100%;display:flex;gap:8px;align-items:baseline;text-align:left;font-size:13px;line-height:1.3;color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:6px 9px}
.mtst button em{font:500 11px var(--mono);color:var(--ink-3);font-style:normal;min-width:30px}
.mtst button small{margin-left:auto;font:500 11px var(--mono);color:var(--ink-3)}
.mtst button[aria-current="true"]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--surface))}
.mtst button.done em{color:var(--ok)}
table.mtq td.n{white-space:nowrap} table.mtq tr.cur td{background:var(--surface-2)}
@media (max-width:700px){ .mtbar{left:6px;right:6px;bottom:6px;transform:none;width:auto;padding:6px 7px 6px 9px;gap:4px} #mtVol{display:none} .mtc button{padding:0 7px;min-width:30px;height:32px}
  .mtbar .t span{-webkit-line-clamp:2} .mtinfo{display:none} .mtwarn{top:auto;bottom:112px;max-width:calc(100% - 16px);left:8px;transform:none} .mtsum{top:8px;max-height:calc(100% - 128px)} #mtCam{padding:0 6px} .mtc .tm small{display:none} }
`; document.head.appendChild(st); }
const VIEWEL=$('#view');
VIEWEL.insertAdjacentHTML('beforeend',`<div class="mtl" id="mtl" hidden aria-hidden="true"><svg class="xln" id="mtln" xmlns="http://www.w3.org/2000/svg"></svg></div>
<div class="mtinfo" id="mtinfo" hidden></div><div class="mtwarn" id="mtwarn" hidden></div><div class="mttag" id="mttag" hidden></div><div class="mtsum" id="mtsum" hidden></div>
<div class="mtbar" id="mtbar" hidden><div class="t"><b id="mtT"></b><span id="mtS"></span></div>
<div class="mtc"><button type="button" id="mtPlay" class="pri" aria-label="Пуск монтажу" title="Пуск">▶</button><button type="button" id="mtSpd" title="Швидкість розкладання (зразки — завжди повільно)">×1</button>
<button type="button" id="mtPrev" aria-label="Попередній етап" title="Попередній етап">‹</button><button type="button" id="mtNext" aria-label="Наступний етап" title="Наступний етап">›</button>
<input type="range" id="mtPos" min="0" max="1000" step="1" value="0" aria-label="Час монтажу"><span class="tm" id="mtClock">0:00</span>
<button type="button" id="mtCam" aria-pressed="true" title="Камера за монтажем; торкання моделі — вільна камера">Камера</button><button type="button" id="mtSnd" aria-pressed="true" title="Музика">♪</button><input type="range" id="mtVol" min="0" max="100" step="1" aria-label="Гучність музики"></div></div>`);
const UI={prev:$('#mtPrev'),next:$('#mtNext'),bar:$('#mtbar'),T:$('#mtT'),S:$('#mtS'),play:$('#mtPlay'),spd:$('#mtSpd'),pos:$('#mtPos'),clock:$('#mtClock'),cam:$('#mtCam'),snd:$('#mtSnd'),vol:$('#mtVol'),lab:$('#mtl'),svg:$('#mtln'),info:$('#mtinfo'),warn:$('#mtwarn'),tag:$('#mttag'),sum:$('#mtsum')};
UI.vol.value=Math.round(SND.vol*100);

// ================= Наш варіант Б
function buildOurs(){ const T=new TL('ours'), R=T.root, E=EPX;
  const rr=new Set(E.rr);
  // --- блоки (той самий порядок, що OUR.blk), мати — лише під блоками з b[2]
  const B=[...OD.blk.map(b=>[LX(b[0]),b[1],1]),...OD.eblk.map(b=>[LX(b[0]),b[1],1]),...OD.xblk.map(b=>[b[0],b[1],0])];
  const matOf=[]; { let m=0; B.forEach((b,i)=>{ matOf[i]=b[2]?m++:-1; }); }
  const serp=(arr,X,Y)=>arr.sort((a,b)=>{ const ba=Math.round(X(a)/1.3), bb=Math.round(X(b)/1.3); if(ba!==bb) return bb-ba; return ba%2?Y(b)-Y(a):Y(a)-Y(b); });
  const mods=OM.map((m,i)=>i).filter(i=>!rr.has(i));
  const rects=OM.map(m=>[m.Xa-0.05,m.Xb+0.05,m.Y-1.25,m.Y+1.25]);
  const slots=roofSlots(rects,2.4,1.2,0.8), slotsP=roofSlots(rects,2.9,2.42,1.32);
  const BLK_ROOF=B.length+E.boxes.filter(b=>b.r).length*4+E.sup.length, NPAL=Math.ceil(BLK_ROOF/60);
  const CR={X:107.5,Y:43};

  // 0. вступ
  T.stage('intro','Вступ','Наш варіант Б (E-Systems): 1 925 панелей ZNSHINE 730 Вт на прямих лагах, 175 стрінгів, 26 щитів PV 7/1, 3 контейнери Golen.');
  T.view(0,5,OV_SE); T.cap(0,'Наш варіант Б: 1 925 панелей 730 Вт — 1 749 на цеху і 176 на складі, 1 405,25 кВтп. Натисніть ▶ — монтаж іде етапами, кожен новий виріб спершу показано зразком.'); T.music(0,'calm'); T.adv(5);

  // 1. розмітка
  T.stage('mark','Розмітка','Осі 241 лінії лаг за розкладкою Тому 3 КМ (аркуш 2).');
  { const t0=T.t, pts=[], ord=LG.map((l,i)=>i).sort((a,b)=>LG[b][0]-LG[a][0]); ord.forEach(i=>{ const l=LG[i], z=roofZ(l[0])+0.014; pts.push(W(l[0],l[1],z),W(l[0],l[2],z)); });
    const mk=lines(pts,0xf6f1df,R); T.mark=mk; const rv=T.act(new LRev(mk,t0+0.6,t0+7.2)); T.view(t0+1.4,t0+8,TOPV);
    T.cap(t0,'Розмітка: осі 241 лінії лаг крейдою по покрівлі — 5 128,8 м (Том 3 КМ).'); T.counter({nm:'Лінії лаг — розмітка',tot:241,n:()=>Math.max(0,rv.k)}); T.adv(8); }

  // 2. кран і палети блоків
  T.stage('crane','Кран і палети блоків','Автокран — між ТП-5913 і майданчиком контейнерів (як у монтажі 23.10). Палета — 60 блоків (рішення власника 26.10).');
  const crane=T.act(new Crane(R,CR.X,CR.Y,T.t)); let pal;
  { const t0=T.t, s0=slots[0], f0=fr(s0.X,s0.Y,0), lp=palletObj(R); lp.rotation.y=Math.PI/2;
    const L=crane.lift({t0:t0+1,t1:t0+10,A:W(103.6,40.2,0),B:f0.p,load:lp,rig:2.6,top:0.62,sw:[0.5,0.32],tShow:t0,after:'hide'}); T.slowI(t0,t0+10.2);
    T.view(t0+1.2,t0+10.4,{fn:t=>{ const s=smooth((t-t0-1)/9); return {p:V(122,10+8*s,-18+4*s),c:V(101-3*s,5+8*s,-41.5)}; }});
    T.cap(t0,`Кран піднімає палету: 60 блоків по 13 кг = 780 кг. Усього на дах цеху — ${nf(BLK_ROOF)} блоків (під лаги ${nf(B.length)}, рами щитів ${nf(E.boxes.filter(b=>b.r).length*4)}, опори лотків ${nf(E.sup.length)}) — ${nf(NPAL)} палет.`);
    const ap=new Float32Array(NPAL); for(let k=0;k<NPAL;k++) ap[k]=k===0?t0+10:t0+10.3+k*0.045; pal=T.act(new Stacks(R,slots,PALP,NPAL,ap));
    T.view(t0+12.2,t0+15,OV_SE); T.cap(t0+10.2,`Решта палет — по периметру покрівлі: ${nf(NPAL)} палет по 60 блоків.`);
    T.counter({nm:'Палети з блоками на даху',tot:NPAL,n:t=>pal.cnt(t),unit:'шт'}); T.adv(15); }

  // 3. баласт
  T.stage('blk','Баласт','Блоки «Баласт із муфтою» 300×300×60 на матах — під лаги, кінці лаг і крайні профілі (Том 3 КМ).');
  const cons=[]; let rBlk,rMat;
  { T.sample({title:'Блок «Баласт із муфтою»',T:12,dist:1.15,cy:0.06,el:0.5,
      info:['Під лагою — 575 + 1 200·k від торця','Під крайнім профілем — 848 блоків без мата','Лага кріпиться болтом M8×20 у муфту блока','Блоки виготовляють в Україні'],
      make:g=>{ const P=[]; P.push({nm:'Мат гумовий 320×320×3',sz:'шорсткий, під блоки лаг',m:0.4,q:4756,o:BX(0.32,0.003,0.32,MAT.mat,0,0.0015,0,g)});
        P.push({nm:'Блок «Баласт із муфтою»',sz:'300×300×60, бетон',m:13,q:5604,o:BX(0.3,0.06,0.3,MAT.blk,0,0.033,0,g),ex:[0,0.08,0]});
        P.push({nm:'Муфта M8×30 DIN 6334',sz:'залита в блок',m:null,q:5604,o:CY(0.0075,0.03,MAT.hw,0,0.05,0,g,6),ex:[0,0.2,0]});
        P.push({nm:'Шайба DIN 9021 M8',sz:'8,4 × 24 × 2',m:0.00602,q:5604,o:CY(0.012,0.002,MAT.hw,0,0.075,0,g,20),ex:[0,0.29,0]});
        P.push({nm:'Болт M8×20 DIN 933 8.8',sz:'лага до блока',m:0.01175,q:5604,o:bolt(8,20,MAT.hw,g,0,0.088,0),ex:[0,0.4,0]}); return P; }});
    const t0=T.t, ord=serp(B.map((b,i)=>i),i=>B[i][0],i=>B[i][1]), S=sched(ord.length,t0+1.6,26,{k:4,gs:1.5,ds:1.3,df:0.45}); T.slowI(t0,S.tf);
    const it=[], im=[]; ord.forEach((i,k)=>{ it.push({i,s:S.s[k],d:S.d[k],a:{h:k<4?1.1:0.6}}); if(matOf[i]>=0) im.push({i:matOf[i],s:S.s[k]-(k<4?0.55:0.16),d:S.d[k]*0.4,a:{h:k<4?0.5:0.25}}); cons.push(S.s[k]); });
    rBlk=T.act(new Rev(OUR.blk,it,'drop')); rMat=T.act(new Rev(OUR.mat,im,'drop'));
    const b0=B[ord[0]]; T.view(t0+1.6,S.tf,look(b0[0],b0[1],roofZ(b0[0]),4.2,0.9,0.5)); T.view(S.tf+2.2,t0+27.6,pan(OV_SE,view([120,48,40],[60,6,-40]),S.tf+2.2,t0+27.6));
    for(let k=0;k<4;k++){ const b=B[ord[k]]; T.tags.push({t0:S.s[k],t1:S.s[k]+1.5,txt:`Блок ${k+1} з ${nf(B.length)} · ${b[2]?'на маті':'під крайній профіль, без мата'}`,p:fr(b[0],b[1],0.25).p}); }
    T.cap(t0,'Перші блоки — на мати, за розміткою; далі бригада йде рядами.'); T.cap(S.tf,`Розкладено блоки під лаги ${nf(OD.blk.length)}, під кінці лаг ${nf(OD.eblk.length)}, під крайні профілі ${nf(OD.xblk.length)} (без мата).`); T.music(S.tf,'drive');
    T.counter({nm:'Блоки під лаги, кінці лаг і крайні профілі',tot:5604,n:()=>rBlk.cnt(),m:13,g:'blk'}); T.counter({nm:'Мати 320×320×3',tot:4756,n:()=>rMat.cnt(),m:0.4,g:'blk'});
    T.adv(28); }

  // 4. лаги
  T.stage('lag','Лаги','Лага 41×41×1,5 перфорована: шматки 4 800 / 2 400 мм — 1 040 / 57, 241 лінія (Том 3 КМ).');
  let rLag; const lagLen=LG.map(l=>l[2]-l[1]);
  { T.sample({title:'Лага 41×41×1,5',T:9,dist:6.2,cy:0.3,el:0.35,az:0.6,
      info:['241 лінія, 5 128,8 м, 1,744 кг/м','Отвори Ø10,5 через 100 мм','Без різання: 4 800 — на 2 модулі, 2 400 — останній при непарній кількості'],
      make:g=>[{nm:'Лага 41×41×1,5, 4 800 мм',sz:'на 2 модулі',m:4.8*1.744,q:1040,o:BX(4.8,0.041,0.041,MM.steel,0,0.12,0,g),ex:[0,0.35,0]},
               {nm:'Лага 41×41×1,5, 2 400 мм',sz:'на 1 модуль',m:2.4*1.744,q:57,o:BX(2.4,0.041,0.041,MM.steel,-1.2,0.02,0.35,g),ex:[0,0.05,0.4]}]});
    const t0=T.t, ord=LG.map((l,i)=>i).sort((a,b)=>LG[b][0]-LG[a][0]||LG[a][1]-LG[b][1]), S=sched(ord.length,t0+1.6,18,{k:2,gs:2.2,ds:2.0,df:0.7}); T.slowI(t0,S.tf);
    rLag=T.act(new Rev(lagMesh,ord.map((i,k)=>({i,s:S.s[k],d:S.d[k]})),'grow'));
    const l0=LG[ord[0]]; T.view(t0+1.6,S.tf,look(l0[0],l0[1]+3,roofZ(l0[0]),9,0.7,0.45)); T.view(S.tf+2,t0+19.6,pan(view([150,60,30],[62,6,-40]),OV_SW,S.tf+2,t0+19.6));
    T.tags.push({t0:S.s[0],t1:S.s[0]+2.2,txt:`Лінія лаг 1 з 241 · ${nf(lagLen[ord[0]],1)} м`,p:W(l0[0],l0[1]+1,roofZ(l0[0])+0.4)});
    T.cap(t0,'Лаги кладуть на блоки і кріплять болтом M8×20 із шайбою DIN 9021 у муфту блока.'); T.music(S.tf,'drive');
    T.act(new VAct([T.mark],-1,t0+19.6));
    const lagDone=()=>{ let s=0; for(let k=0;k<rLag.hi;k++) s+=lagLen[rLag.I[k]]; return s; };
    T.counter({nm:'Лаги, м',tot:5128.8,n:lagDone,m:1.744,g:'met',unit:'м'}); T.counter({nm:'Болт M8×20 + шайба DIN 9021 (лага до блока)',tot:5604,n:()=>Math.round(5604*lagDone()/5128.8),m:0.01777,g:'met'});
    T.adv(19.6); }

  // 5. гільзи і шпильки
  T.stage('sl','Гільзи і шпильки','Гільза 200 з муфтою M10×50 під кожним стиком модулів; шпилька M10 права/ліва між муфтами стягує лаги (Том 3 КМ).');
  let rSl,rRod;
  { T.sample({title:'Гільза з муфтою і шпилька M10',T:13,dist:1.6,cy:0.05,el:0.55,az:0.5,
      info:['Гільза бере і стик шматків лаги — 856 на стиках','Шпилька: права різьба із заходу, ліва — зі сходу','Обертання шпильки стягує лаги','Через прохід на гребені: 570 / 790 / 1 580 — 29 / 15 / 26'],
      make:g=>{ const P=[], x0=0.65;
        [-x0,x0].forEach(x=>BX(0.041,0.041,0.7,MM.steel,x,0.0205,0,g));
        P.push({nm:'Лага 41×41 (з етапу лаг)',sz:'дві сусідні лінії',m:null,q:'',o:GR(g)});
        [-1,1].forEach((s,k)=>{ const sg=GR(g,s*x0,0,0); BX(0.0455,0.006,0.2,MAT.sl,0,0.044,0,sg); BX(0.004,0.035,0.2,MAT.sl,0.0228,0.026,0,sg); BX(0.004,0.035,0.2,MAT.sl,-0.0228,0.026,0,sg); CY(0.0098,0.05,MAT.hw,-s*0.05,0.03,0,sg,6,'x');
          if(!k) P.push({nm:'Гільза П 45,5×35×2, L 200, з муфтою M10×50',sz:'муфта приварена',m:0.42,q:1895,o:sg,ex:[0,0.16,0]}); else P.push({nm:'',o:sg,ex:[0,0.16,0],hide:1}); });
        const bs=GR(g); [-1,1].forEach(s=>[-0.05,0.05].forEach(z=>bolt(10,60,MAT.hw,bs,s*(x0+0.045),0.025,z,s>0?'x':'-x'))); P.push({nm:'Болт M10×60 з трубкою 14×1,75×38',sz:'2 на гільзу, крізь лагу',m:0.0409,q:3790,o:bs,ex:[0,0.08,0.18]});
        const rd=GR(g); CY(0.005,1.18,MAT.rod,0,0.03,0,rd,10,'x'); P.push({nm:'Шпилька M10 1 299, права + ліва різьба',sz:'між муфтами гільз',m:null,q:1561,qs:'1 561 + 70 через прохід',o:rd,ex:[0,0.3,0],spin:1});
        const nt=GR(g); [-0.5,-0.42,0.5].forEach(x=>CY(0.0098,0.008,MAT.hw,x,0.03,0,nt,6,'x')); P.push({nm:'Гайка M10 права / ліва',sz:'контргайки на шпильці',m:0.0102,q:4893,qs:'3 262 + 1 631',o:nt,ex:[0,0.38,0]}); return P; },
      anim:(u,e,P)=>{ const r=P.find(p=>p.spin); if(r) r.o.rotation.x=u*2.4; }});
    const t0=T.t, ordS=serp(OD.sl.map((s,i)=>i),i=>LX(OD.sl[i][0]),i=>OD.sl[i][1]), S=sched(ordS.length,t0+1.6,13,{k:3,gs:1.5,ds:1.3,df:0.4}); T.slowI(t0,S.tf);
    const it=ordS.map((i,k)=>({i,s:S.s[k],d:S.d[k],a:{h:k<3?0.8:0.4}})); rSl=T.act(new Rev(OUR.sl,it.map(x=>Object.assign({},x)),'drop')); T.act(new Rev(OUR.cp,it.map(x=>Object.assign({},x)),'drop'));
    const ordR=serp(OD.rods.map((r,i)=>i),i=>LX(OD.rods[i][0]),i=>OD.rods[i][2]), S2=sched(ordR.length,S.tf+3,t0+18-S.tf-3,{k:0,df:0.45});
    rRod=T.act(new Rev(OUR.rods,ordR.map((i,k)=>({i,s:S2.s[k],d:S2.d[k],a:{h:0.35}})),'drop'));
    const s0=OD.sl[ordS[0]]; T.view(t0+1.6,S.tf,look(LX(s0[0]),s0[1],roofZ(LX(s0[0])),2.6,0.8,0.5)); T.view(S.tf+2,t0+19.6,pan(view([128,40,10],[70,8,-30]),view([20,46,25],[46,8,-40]),S.tf+2,t0+19.6));
    for(let k=0;k<3;k++){ const s=OD.sl[ordS[k]]; T.tags.push({t0:S.s[k],t1:S.s[k]+1.5,txt:`Гільза ${k+1} з ${nf(OD.sl.length)} · 2 болти M10×60`,p:fr(LX(s[0]),s[1],0.3).p}); }
    T.cap(t0,'Гільзи — під стики модулів, кожна на 2 болтах M10×60 крізь лагу; потім шпильки між муфтами сусідніх лаг.'); T.music(S.tf,'drive');
    T.counter({nm:'Гільзи 200 з муфтою M10×50',tot:1895,n:()=>rSl.cnt(),m:0.42,g:'met'}); T.counter({nm:'Болти M10×60 з трубкою',tot:3790,n:()=>rSl.cnt()*2,m:0.0409,g:'met'});
    T.counter({nm:'Шпильки M10 (1 561 + 70 через прохід)',tot:1631,n:()=>rRod.cnt()}); T.counter({nm:'Гайки M10 праві + ліві',tot:4893,n:()=>rRod.cnt()*3,m:0.0102,g:'met'});
    T.adv(19.6); }

  // 6. крайні профілі й анкери
  T.stage('xp','Крайні профілі й анкери','Крайній профіль 41×41 на кутниках 160/150 t = 8 на краю кожного ряду; анкери від сповзання вздовж ліхтарів (Том 3 КМ).');
  let rXp,rAn; const xpLen=OD.xp.map(x=>LX(x[1])-LX(x[0])-0.059);
  { T.sample({title:'Крайній профіль на кутниках',T:10,dist:1.9,cy:0.05,el:0.5,az:0.9,
      info:['424 крайні ≈1 263 + 30 через прохід (530 / 760 / 1 540 — 16 / 4 / 10)','Під профілем 2 блоки без мата (848)','Анкер: тип і кріплення — після обстеження покрівлі'],
      make:g=>{ const P=[]; [-0.65,0.65].forEach(x=>BX(0.041,0.041,0.7,MM.steel,x,0.0805,-0.35,g)); P.push({nm:'Лаги (з етапу лаг)',sz:'',m:null,q:'',o:GR(g)});
        P.push({nm:'Профіль крайній 41×41×1,5',sz:'≈1 263 мм',m:1.263*1.744,q:454,qs:'424 + 30',o:BX(1.26,0.041,0.041,MAT.zn,0,0.0805,0.08,g),ex:[0,0.22,0.1]});
        const an=GR(g); [-1,1].forEach(s=>{ BX(0.008,0.16,0.16,MAT.hw,s*0.6,0.08,0.02,an); BX(0.16,0.008,0.16,MAT.hw,s*0.6,0.004,0.02,an); }); P.push({nm:'Кутник 160/150 t = 8',sz:'2 на профіль',m:0.7,q:908,o:an,ex:[0,0.12,0]});
        const b1=GR(g); [-1,1].forEach(s=>{ bolt(10,70,MAT.hw,b1,s*0.66,0.09,-0.03,s>0?'x':'-x'); bolt(10,60,MAT.hw,b1,s*0.56,0.09,0.08,'z'); }); P.push({nm:'Болти M10×70 / M10×60',sz:'кутник до лаги / до профілю',m:null,q:2944,qs:'1 128 + 1 816',o:b1,ex:[0,0.06,0.25]});
        P.push({nm:'Блок під профілем, без мата',sz:'300×300×60 (розкладено на етапі баласту)',m:13,q:848,o:BX(0.3,0.06,0.3,MAT.blk,0.3,0.03,0.08,g)});
        P.push({nm:'Анкер від сповзання',sz:'тип — після обстеження',m:null,q:194,o:CY(0.06,0.16,MAT.anc,0.95,0.08,-0.55,g,14),ex:[0.15,0.1,0]}); return P; }});
    const t0=T.t, ord=serp(OD.xp.map((x,i)=>i),i=>LX(OD.xp[i][0]),i=>OD.xp[i][2]), S=sched(ord.length,t0+1.6,11,{k:2,gs:1.8,ds:1.5,df:0.45}); T.slowI(t0,S.tf);
    rXp=T.act(new Rev(OUR.xp,ord.map((i,k)=>({i,s:S.s[k],d:S.d[k],a:{h:0.5}})),'drop'));
    const ia=[]; ord.forEach((i,k)=>[0,1].forEach(q=>ia.push({i:i*2+q,s:S.s[k]-0.1*S.d[k],d:S.d[k],a:{h:0.3}}))); T.act(new Rev(OUR.ang,ia,'drop'));
    const oa=OD.an.map((a,i)=>i).sort((a,b)=>LX(OD.an[b][0])-LX(OD.an[a][0])), S2=sched(oa.length,S.tf+1,t0+11-S.tf,{k:0,df:0.5}); rAn=T.act(new Rev(OUR.an,oa.map((i,k)=>({i,s:S2.s[k],d:S2.d[k]})),'pop'));
    const x0=OD.xp[ord[0]]; T.view(t0+1.6,S.tf,look(LX(x0[0]),x0[2],roofZ(LX(x0[0])),3,0.9,0.5)); T.view(S.tf+2,t0+13,OV_SE);
    T.cap(t0,'На краю кожного ряду лаги зв\'язує крайній профіль на кутниках; анкери від сповзання — на верхній лазі рядів біля ліхтарів.'); T.music(S.tf,'drive');
    T.counter({nm:'Крайні профілі (424 + 30 через прохід)',tot:454,n:()=>rXp.cnt(),m:null,g:'met',mf:()=>{ let s=0; for(let k=0;k<rXp.hi;k++) s+=xpLen[rXp.I[k]]; return s*1.744; }});
    T.counter({nm:'Кутники 160/150 t = 8',tot:908,n:()=>rXp.cnt()*2,m:0.7,g:'met'}); T.counter({nm:'Анкери від сповзання',tot:194,n:()=>rAn.cnt()});
    T.adv(13); }

  // 7. щити PV
  T.stage('box','Щити PV 7/1','26 щитів PV 7/1: 23 на рамах на даху цеху (рама 41×41 на 4 блоках), 3 на складі — кріплення на скаті не визначено.');
  const consF=[]; let rBox;
  { T.sample({title:'Щит PV 7/1 на рамі',T:13,dist:3.2,cy:0.5,el:0.22,az:0.25,spin:false,rot0:-0.35,
      info:['До 7 стрінгів × 11 модулів; Uхх ≤ 612,6 В (−25 °C)','Iмп 122,6 А, Iкз 129,6 А; вихід Al 2 × 1×120…240','Усередині: 7 пар MC4, 14 запобіжників gPV 32 А, роз\'єднувач 2P ≥ 200 А, ОПН тип 1+2, контроль струму 8 кан. Modbus','Маса щита у зборі — від виробника (не надано)'],
      make:g=>{ const P=[]; const bb=GR(g); [[-0.25,-0.45],[-0.25,0.45],[0.25,-0.45],[0.25,0.45]].forEach(([x,z])=>{ BX(0.3,0.06,0.3,MAT.blk,x,0.033,z,bb); BX(0.32,0.003,0.32,MAT.mat,x,0.0015,z,bb); });
        P.push({nm:'Блок з матом під раму',sz:'4 на раму',m:13.4,q:92,o:bb});
        const fm_=GR(g); [-0.25,0.25].forEach(x=>{ BX(0.041,0.041,1.2,MM.steel,x,0.0855,0,fm_); BX(0.041,0.9,0.041,MM.steel,x,0.555,0.13,fm_); }); [0.52,0.88].forEach(y=>BX(0.6,0.041,0.041,MM.steel,0,y,0.105,fm_));
        P.push({nm:'Рама 41×41×2,5 HDG',sz:'опорні 2 × 1 200, стійки 2 × 900, поперечки 2 × 600',m:14,q:23,o:fm_,ex:[0,0.1,0]});
        const bxg=GR(g,0,0.7,0.0); const bd=GR(bxg,0,0,0.04); BX(0.6,0.5,0.012,MAT.cab,0,0,-0.094,bd); BX(0.012,0.5,0.2,MAT.cab,-0.294,0,0,bd); BX(0.012,0.5,0.2,MAT.cab,0.294,0,0,bd); BX(0.6,0.012,0.2,MAT.cab,0,0.244,0,bd); BX(0.6,0.012,0.2,MAT.cab,0,-0.244,0,bd);
        BX(0.52,0.035,0.01,MM.dark,0,0.08,-0.08,bd); for(let k=0;k<14;k++) BX(0.026,0.07,0.06,k%2?MM.black:MM.red,-0.2+k*0.031,0.08,-0.05,bd); BX(0.14,0.13,0.08,MM.dark,0.08,-0.1,-0.045,bd); BX(0.07,0.1,0.06,MM.yellow,-0.12,-0.1,-0.055,bd); BX(0.09,0.06,0.04,MM.blue,-0.2,-0.12,-0.07,bd);
        for(let k=0;k<7;k++){ CY(0.008,0.04,MM.black,-0.18+k*0.06,-0.27,0.0,bd,10); }
        const dp=GR(bd,-0.3,0,0.1); BX(0.6,0.5,0.012,MAT.cab,0.3,0,0,dp); P.push({nm:'Щит PV 7/1, корпус IP66 ≥ 600×500×200',sz:'клас II, 4 кронштейни',m:null,q:26,o:bxg,ex:[0,0.3,0.15],door:dp});
        P.push({nm:'Козирок 650×350',sz:'над щитом',m:1.3,q:26,o:BX(0.65,0.012,0.35,MAT.cab,0,0.985,0.04,g),ex:[0,0.55,0]}); return P; },
      anim:(u,e,P)=>{ const b=P.find(p=>p.door); if(b) b.door.rotation.y=-1.9*c01((u-2.5)/2)*(1-c01((u-10.2)/1.6)); }});
    const t0=T.t, ord=E.boxes.map((b,i)=>i).sort((a,b)=>(E.boxes[b].r-E.boxes[a].r)||(E.boxes[b].X-E.boxes[a].X)), S=sched(ord.length,t0+1.6,10,{k:1,gs:3.6,ds:3.4,df:0.8}); T.slowI(t0,S.tf);
    const ib=[],iF=[],iX=[]; ord.forEach((i,k)=>{ const b=E.boxes[i], s=S.s[k], d=S.d[k]; if(b.r){ for(let q=0;q<4;q++){ ib.push({i:i*4+q,s:s+q*0.03*d,d:0.3*d,a:{h:0.5}}); iF.push({i:i*4+q,s:s+0.3*d,d:0.3*d,a:{h:0.6}}); consF.push(s); } }
      iX.push({i,s:s+(b.r?0.6*d:0),d:b.r?0.4*d:d,a:{h:0.7}}); });
    T.act(new Rev(EP.bblk,ib,'drop')); T.act(new Rev(EP.frame,iF,'drop')); rBox=T.act(new Rev(EP.box,iX,'drop'));
    const b0=E.boxes[ord[0]]; T.view(t0+1.6,S.tf,look(b0.X,b0.Y,EP.bz[ord[0]]+0.6,4.6,0.6,0.35)); T.view(S.tf+2,t0+9.6,OV_SE); T.view(t0+11.2,t0+16,VIEWS.wh);
    T.warn.push({t0:t0+11.4,t1:t0+16,inf:1,t:'Щити на складі',d:'3 щити (ЩС-С1, С2, С3) — на скаті складу. Як їх кріпити, не визначено (питання власнику, 26.10) — показано без кріплення.'});
    T.cap(t0,'Щити PV: блоки під раму, рама 41×41, щит на 4 кронштейнах; номер щита і контейнер — кольором.'); T.music(S.tf,'drive');
    T.counter({nm:'Щити PV 7/1 (23 дах + 3 склад)',tot:26,n:()=>rBox.cnt()}); T.counter({nm:'Рами щитів 41×41',tot:23,n:()=>Math.min(23,rBox.cnt()),m:14,g:'el'}); const consFA=Float32Array.from(consF); T.counter({nm:'Блоки з матом під рами',tot:92,n:t=>ub(consFA,t),m:13.4,g:'blk'});
    T.adv(16); }

  // 8. лотки
  T.stage('tray','Лотки і опори','Лотки з кришками за типорозмірами на опорах «блок з матом + траверса 41×41», фасонні, містки над ендовами, спуск по фасаду (дані лотків 26.10).');
  const consS=[]; let rSup; const segAll=[];
  { const Q_=E.Q.trays, totTr=Object.values(Q_).reduce((s,x)=>s+x.all,0);
    T.sample({title:'Лоток 100×50 на опорі',T:10,dist:1.25,cy:0.1,el:0.42,az:0.7,
      info:['Лотки: '+E.types.map(t=>t+' — '+nf(Q_[t].all,1)+' м').join(', '),'Фасонні: кут 90° '+E.Q.fits.b+', трійник '+E.Q.fits.t+', хрестовина '+E.Q.fits.x+', заглушка '+E.Q.fits.e,'Містки над ендовами — '+E.Q.vx+'; кронштейни на фасаді — '+E.Q.facbr,'Маса лотків — лише оцінка, у лічильник не входить'],
      make:g=>{ const P=[]; const sp=GR(g); BX(0.32,0.003,0.32,MAT.mat,0,0.0015,0,sp); BX(0.3,0.06,0.3,MAT.blk,0,0.033,0,sp); P.push({nm:'Опора: блок 300×300×60 з матом',sz:'крок 1,5 м',m:13.4,q:E.sup.length,o:sp});
        const tr=GR(g); BX(0.041,0.041,0.2,MM.steel,0,0.0835,0,tr); bolt(8,20,MAT.hw,tr,0,0.11,0); P.push({nm:'Траверса 41×41×2,5 + болт M8×20',sz:'поперек лотка',m:null,q:E.sup.length,o:tr,ex:[0,0.12,0]});
        const ly=GR(g,0,0.104,0); BX(0.1,0.0015,1.5,MAT.zn,0,0,0,ly); BX(0.0015,0.05,1.5,MAT.zn,-0.05,0.025,0,ly); BX(0.0015,0.05,1.5,MAT.zn,0.05,0.025,0,ly); CY(0.004,1.5,MM.red,-0.02,0.008,0,ly,8,'z'); CY(0.004,1.5,MM.black,0.0,0.008,0,ly,8,'z'); CY(0.006,1.5,MM.alu,0.025,0.01,0,ly,8,'z');
        P.push({nm:'Лоток 100×50 перфорований',sz:'з кабелями 1×6',m:null,q:Q_['100×50'].all,qs:nf(Q_['100×50'].all,1)+' м',o:ly,ex:[0,0.28,0]});
        P.push({nm:'Кришка лотка 100',sz:'на всю трасу',m:null,q:'',o:BX(0.104,0.0015,1.5,MAT.zn,0,0.16,0,g),ex:[0,0.48,0]}); return P; }});
    const t0=T.t, ord=serp(E.sup.map((s,i)=>i),i=>E.sup[i][0],i=>E.sup[i][1]), S=sched(ord.length,t0+1.6,8,{k:2,gs:1.4,ds:1.2,df:0.4}); T.slowI(t0,S.tf);
    const it=ord.map((i,k)=>({i,s:S.s[k],d:S.d[k],a:{h:0.5}})); rSup=T.act(new Rev(EP.blk,it.map(x=>Object.assign({},x)),'drop')); T.act(new Rev(EP.trav,it.map(x=>Object.assign({},x,{s:x.s+0.15})),'drop')); ord.forEach((i,k)=>consS.push(S.s[k]));
    // лотки: ділянки всіх типорозмірів у порядку трас
    EP.tray.forEach((im,t)=>{ for(let i=0;i<im.count;i++) segAll.push({t,i}); });
    const S2=sched(segAll.length,t0+5,9,{k:0,df:0.3}); const per=E.types.map(()=>[]); segAll.forEach((x,k)=>per[x.t].push({i:x.i,s:S2.s[k],d:S2.d[k],a:{h:0.4}}));
    const rTr=per.map((L,t)=>T.act(new Rev(EP.tray[t],L,'drop')));
    const S3=sched(E.fits.length,t0+13,2,{k:0,df:0.3}); T.act(new Rev(EP.fit,E.fits.map((f,i)=>({i,s:S3.s[i],d:S3.d[i]})),'pop'));
    T.act(new Rev(EP.vx,E.vx.map((v,i)=>({i,s:t0+13.5+i*0.05,d:0.4})),'pop')); T.act(new VAct([EP.facade],t0+14,null,1.5));
    const s0=E.sup[ord[0]]; T.view(t0+1.6,S.tf,look(s0[0],s0[1],surfZ(s0[0],s0[1])||HV,3,0.6,0.45)); T.view(S.tf+2,t0+16,pan(OV_SE,view([60,95,70],[52,4,-46]),S.tf+2,t0+16));
    T.cap(t0,'Опори лотків — блок з матом і траверса через 1,5 м; лотки з кришками; містки над ендовами — лоток над водою не лежить.'); T.music(S.tf,'drive');
    const trDone=()=>{ let n=0; rTr.forEach(r=>n+=r.cnt()); return n; };
    T.counter({nm:'Опори лотків (блок з матом)',tot:E.sup.length,n:()=>rSup.cnt(),m:13.4,g:'blk'}); T.counter({nm:'Лотки з кришками, м',tot:Math.round(totTr*10)/10,n:()=>Math.round(totTr*trDone()/segAll.length),unit:'м'});
    T.counter({nm:'Фасонні і містки',tot:E.fits.length+E.vx.length,n:t=>ub(S3.s,t)+(t>=t0+13.5?Math.min(E.vx.length,Math.floor((t-t0-13.5)/0.05)+1):0)});
    T.adv(16); }

  // 9. кабелі
  T.stage('cab','Кабелі','Кабелі 1×6 під модулями — стяжкою УФ до бічної стінки лаги через 0,5 м, без рукава; поза модулями — у лотку; перемички понад 3,5 м — у металорукаві Ø25 (рішення 26.10).');
  let rP,rM,rJ,rJL,rAl;
  { const Q_=E.Q;
    T.sample({title:'Кабель 1×6 під лагою',T:11,dist:1.4,cy:0.05,el:0.4,az:0.75,
      info:['«+» '+nf(Q_.red,1)+' м, «−» '+nf(Q_.black,1)+' м (з перемичками)','Перемичок '+Q_.jumpers+'; металорукав Ø25 — '+nf(Q_.hose,1)+' м','Лінії Al: 1×120 — '+nf(Q_.al['120'],1)+' м, 1×185 — '+nf(Q_.al['185'],0)+' м, 1×240 — '+nf(Q_.al['240'],1)+' м','RS485 — '+nf(Q_.rs485,1)+' м'],
      make:g=>{ const P=[]; BX(0.041,0.041,1.4,MM.steel,0,0.0205,0,g); P.push({nm:'Лага (з етапу лаг)',sz:'',m:null,q:'',o:GR(g)});
        P.push({nm:'Кабель 1×6 «+» (червоний)',sz:'уздовж бічної стінки лаги',m:0.075,q:Q_.red,qs:nf(Q_.red,1)+' м',o:CY(0.0035,1.36,MM.red,0.0245,0.028,0,g,8,'z'),ex:[0.08,0.06,0]});
        P.push({nm:'Кабель 1×6 «−» (чорний)',sz:'',m:0.075,q:Q_.black,qs:nf(Q_.black,1)+' м',o:CY(0.0035,1.36,MM.black,0.0245,0.014,0,g,8,'z'),ex:[0.14,0.02,0]});
        const ti=GR(g); for(let z=-0.6;z<=0.61;z+=0.5) BX(0.034,0.05,0.005,MM.dark,0.013,0.022,z,ti); P.push({nm:'Стяжка УФ',sz:'через 0,5 м',m:null,q:'',o:ti,ex:[0.2,0,0]});
        const mc=GR(g,0.06,0.03,0.78); CY(0.008,0.07,MM.black,0,0,0,mc,10,'z'); CY(0.008,0.07,MM.black,0.025,0,0.02,mc,10,'z'); P.push({nm:'Конектори MC4, пари',sz:'як на модулях ZNSHINE',m:null,q:Q_.mc4,o:mc,ex:[0.12,0.1,0.15]});
        P.push({nm:'Перемичка в металорукаві Ø25',sz:'понад 3,5 м',m:0.3,q:Q_.hose,qs:nf(Q_.hose,1)+' м рукава',o:CY(0.0125,0.9,MM.hose,-0.12,0.02,0.1,g,12,'z'),ex:[-0.15,0.05,0]}); return P; }});
    const t0=T.t; T.slowI(t0,t0+2);
    rP=T.act(new LRev(EP.cP,t0+1.2,t0+12)); rM=T.act(new LRev(EP.cM,t0+1.6,t0+12.6)); rJ=T.act(new LRev(EP.jS,t0+9,t0+13)); rJL=T.act(new LRev(EP.jL,t0+9,t0+13));
    const al=EP.al.map((l,k)=>T.act(new LRev(l,t0+12.5+k*0.6,t0+17)));
    T.view(t0+1.6,t0+6,look(52,40,HV+1,26,0.9,0.75)); T.view(t0+8,t0+18,pan(view([60,90,30],[52,4,-40]),OV_NE,t0+8,t0+18));
    T.cap(t0,'Кабелі «+» і «−» кожного стрінга — від щита до кінцевих модулів; перемички між рядами; далі лінії Al від щитів до спуску по фасаду.'); T.music(t0+2,'drive');
    const fr2=()=>(rP.frac()+rM.frac())/2, fAl=()=>al.reduce((s,r)=>s+r.frac(),0)/al.length, alTot=Q_.al['120']+Q_.al['185']+Q_.al['240'], alKg=(Q_.al['120']*0.55+Q_.al['185']*0.8+Q_.al['240']*1.0)/alTot;
    T.counter({nm:'Кабель 1×6 «+», м',tot:Q_.red,n:()=>Math.round(Q_.red*rP.frac()),m:0.075,g:'el',unit:'м'}); T.counter({nm:'Кабель 1×6 «−», м',tot:Q_.black,n:()=>Math.round(Q_.black*rM.frac()),m:0.075,g:'el',unit:'м'});
    T.counter({nm:'Перемички (понад 3,5 м — у рукаві)',tot:Q_.jumpers,n:()=>Math.round(Q_.jumpers*(rJ.frac()+rJL.frac())/2)}); T.counter({nm:'Конектори MC4, пари',tot:Q_.mc4,n:()=>Math.round(Q_.mc4*fr2())});
    T.counter({nm:'Лінії Al до спуску і контейнерів, м',tot:Math.round(alTot*10)/10,n:()=>Math.round(alTot*fAl()),m:alKg,g:'el',unit:'м'});
    T.adv(18); }

  // 10. панелі
  T.stage('pv','Панелі','Панелі ZNSHINE 730 Вт: стопки по периметру, кожну кладуть на лаги посередині ряду і насувають до краю; ряд заповнюється від країв до середини; притиски — після кожної панелі.');
  let rPv,clT,zT;
  { T.sample({title:'Панель ZNSHINE ZXN8-BD132-730',T:14,dist:3.3,cy:0.35,el:0.42,az:0.55,
      info:['730 Вт · 2 384 × 1 303 × 33 мм · 36,5 кг','Uхх 49,50 В · Iкз 18,51 А · Uмп 41,70 В · Iмп 17,51 А','Двостороння, скло-скло 2,0 + 2,0 мм, 132 напівелементи','Коробка 33 шт ≈ 1,2 т; на цех — 53 коробки'],
      make:g=>{ const P=[], pg=GR(g,0,0.35,0); pg.rotation.x=-0.35; const L=2.384, Bw=1.303;
        P.push({nm:'Скло фронтальне 2,0 мм',sz:'загартоване',m:null,q:'',o:BX(L-0.04,0.002,Bw-0.04,MM.glass,0,0.03,0,pg),ex:[0,0.32,0]});
        P.push({nm:'132 напівелементи N-type (6 × 22)',sz:'ККД 23,5 %',m:null,q:'',o:BX(L-0.04,0.0015,Bw-0.04,MM.cells,0,0.017,0,pg),ex:[0,0.16,0]});
        P.push({nm:'Скло тильне 2,0 мм',sz:'двосторонність 80 ± 10 %',m:null,q:'',o:BX(L-0.04,0.002,Bw-0.04,MM.glass,0,0.006,0,pg),ex:[0,0.02,0]});
        const fg=GR(pg); BX(L,0.033,0.03,MAT.al,0,0.0165,Bw/2-0.015,fg); BX(L,0.033,0.03,MAT.al,0,0.0165,-Bw/2+0.015,fg); BX(0.03,0.033,Bw,MAT.al,L/2-0.015,0.0165,0,fg); BX(0.03,0.033,Bw,MAT.al,-L/2+0.015,0.0165,0,fg);
        P.push({nm:'Модуль у зборі: рама 33 мм',sz:'2 384 × 1 303 × 33',m:36.5,q:1925,qs:'1 749 цех + 176 склад',o:fg,ex:[0,-0.1,0]});
        const jb=GR(pg,0,-0.01,-0.3); BX(0.14,0.02,0.1,MM.black,0,0,0,jb); CY(0.003,0.4,MM.black,-0.04,-0.01,0.25,jb,8,'z'); CY(0.003,0.4,MM.red,0.04,-0.01,0.25,jb,8,'z'); P.push({nm:'Коробка IP68, 3 діоди',sz:'кабель 4 мм², MC4',m:null,q:'',o:jb,ex:[0,-0.22,0]});
        const cl=GR(g,1.5,0.0,0.75); BX(0.041,0.041,0.6,MM.steel,0,0.0205,0,cl); BX(0.05,0.012,0.04,MAT.al,0,0.06,0.1,cl); bolt(8,60,MAT.hw,cl,0,0.05,0.1); BX(0.05,0.012,0.04,MAT.al,0,0.06,-0.15,cl);
        P.push({nm:'Притиски: середній 4 227, Z33 3 032',sz:'Z33 — 2 184 на лагах + 848 на крайніх профілях; гайка M8 з пружиною в паз',m:null,q:7259,o:cl,ex:[0.15,0.18,0]}); return P; }});
    const t0=T.t;
    // стопки панелей по периметру: 1 749 / 33 = 53 коробки
    const NST=Math.ceil(mods.length/33), ap=new Float32Array(NST); for(let k=0;k<NST;k++) ap[k]=t0+0.4+k*0.06; const stk=T.act(new Stacks(R,slotsP,PANP,NST,ap));
    T.view(t0+1.2,t0+4,OV_SE); T.cap(t0,`Коробки по 33 панелі (паспорт ZNSHINE) — по периметру покрівлі: ${NST} коробок на ${nf(mods.length)} панелей цеху.`);
    // ряди між двома лагами
    const col=new Map(); mods.forEach(i=>{ const m=OM[i], k=m.Xa.toFixed(2)+'|'+m.Xb.toFixed(2); if(!col.has(k)) col.set(k,[]); col.get(k).push(i); });
    const cols=[]; col.forEach(L=>{ L.sort((a,b)=>OM[a].Y-OM[b].Y); let cur=[L[0]]; for(let j=1;j<L.length;j++){ if(OM[L[j]].Y-OM[L[j-1]].Y>2.6){ cols.push(cur); cur=[]; } cur.push(L[j]); } cols.push(cur); });
    cols.sort((a,b)=>OM[b[0]].Xa-OM[a[0]].Xa||OM[a[0]].Y-OM[b[0]].Y);
    const seq=[]; cols.forEach(c=>{ const y0=OM[c[0]].Y, y1=OM[c[c.length-1]].Y, ym=(y0+y1)/2; c.slice().sort((a,b)=>Math.abs(OM[b].Y-ym)-Math.abs(OM[a].Y-ym)||OM[a].Y-OM[b].Y).forEach(i=>seq.push({i,dz:OM[i].Y-ym})); });
    const tL=t0+4.2, S=sched(seq.length,tL,48,{k:3,gs:2.9,ds:2.7,df:0.55}); T.slowI(tL,S.tf);
    rPv=T.act(new Rev(ourMods,seq.map((x,k)=>({i:x.i,s:S.s[k],d:S.d[k],a:{dz:x.dz,h:k<3?0.9:0.5}})),'slide'));
    const land=new Float32Array(OM.length).fill(-1); seq.forEach((x,k)=>land[x.i]=S.s[k]+S.d[k]);
    // притиски: з'являються, коли лягла остання із сусідніх панелей (після кожної панелі)
    const byX=new Map(); OM.forEach((m,i)=>[m.Xa,m.Xb].forEach(x=>{ const k=x.toFixed(3); if(!byX.has(k)) byX.set(k,[]); byX.get(k).push(i); }));
    const ic=[]; let clSkip=0; OD.cl.forEach((c,ci)=>{ const X=LX(c[0]), L=(byX.get(X.toFixed(3))||[]).filter(i=>Math.abs(OM[i].Y-c[1])<1.2); let tm=-1, any=false; L.forEach(i=>{ if(land[i]>=0){ any=true; tm=Math.max(tm,land[i]); } }); if(!any){ clSkip++; return; } ic.push({i:ci,s:tm+0.02,d:tm<S.tf+1?0.5:0.22}); });
    const rCl=T.act(new Rev(OUR.cl,ic,'pop')); clT=Float32Array.from(ic.map(x=>x.s).sort((a,b)=>a-b));
    const zt=[]; let zSkip=0; OD.xp.forEach(x=>{ if(x[4]) return; const m=OM.findIndex(m=>Math.abs(m.Xa-LX(x[0]))<0.01&&Math.abs(m.Xb-LX(x[1]))<0.01&&Math.abs(m.Y-x[2])<1.3); if(m<0||land[m]<0){ zSkip+=2; return; } zt.push(land[m],land[m]); }); zT=Float32Array.from(zt.sort((a,b)=>a-b));
    stk.R.set(Array.from({length:NST},(_,k)=>S.s[Math.min(seq.length-1,k*33+32)]));
    T.act(new VAct([EP.rem],S.te-1,null));
    const m0=OM[seq[0].i]; T.view(tL+0.4,S.tf,look((m0.Xa+m0.Xb)/2,m0.Y-seq[0].dz/2,roofZ(m0.Xa),7.5,0.45,0.42)); T.view(S.tf+2,tL+48,pan(view([150,70,40],[60,6,-40]),view([-30,80,30],[48,6,-46]),S.tf+2,tL+48));
    for(let k=0;k<3;k++){ const m=OM[seq[k].i]; T.tags.push({t0:S.s[k],t1:S.s[k]+2.8,txt:`Панель ${k+1} з ${nf(seq.length)} · від середини ряду до краю`,p:W((m.Xa+m.Xb)/2,m.Y,roofZ(m.Xa)+0.5)}); }
    T.cap(tL,'Панель кладуть на лаги посередині ряду і насувають уздовж лаг до її місця; притиски ставлять одразу після кожної панелі (прийнято: власник не уточнив, після панелі чи після ряду).'); T.music(S.tf,'drive');
    T.cap(S.te-1,`На цеху — ${nf(seq.length)} панелей. ${E.rr.length} місць без модулів (сірий контур) — кріплення під ними лишається, притиски не ставимо: ${nf(clSkip)} на лагах і ${nf(zSkip)} на профілях.`);
    T.counter({nm:'Панелі на цеху',tot:seq.length,n:()=>rPv.cnt(),m:36.5,g:'mod'}); T.counter({nm:'Притиски на лагах (середні + Z33)',tot:6411,n:t=>ub(clT,t),note:`${nf(clSkip)} — біля місць без модулів`});
    T.counter({nm:'Притиски Z33 на крайніх профілях',tot:848,n:t=>ub(zT,t),note:`${nf(zSkip)} — біля місць без модулів`});
    T.counter({nm:'Потужність на цеху, кВтп',tot:Math.round(seq.length*0.73*100)/100,n:()=>Math.round(rPv.cnt()*73)/100,unit:'кВтп'});
    T.adv(4.2+48+1); }

  // 11. склад
  T.stage('wh','Склад','176 модулів на профнастилі складу: міні-рейка під кожною точкою притиску, 4 точки на модуль по довгих сторонах (розрахунок складу 26.10, ред. 2).');
  let rRail,rWp; const WL=whLayout(EP.whRem);
  { T.sample({title:'Міні-рейка на профнастилі',T:10,dist:1.25,cy:0.06,el:0.5,az:0.7,
      info:['За розкладкою: рейок 398, П33 306, Z33 92 (ланцюжок з n модулів: рейок 2(n+1), П 2(n−1), Z 4)','Проєкт RUDNIK: блоки Light_P50-310 640, Z33 260, П33 442 — з розкладки не виходять','Точки на довгій стороні — за інструкцією ZNSHINE (не отримано); показано на чвертях','Не ставимо модулі № 1, 2, 166, 167'],
      make:g=>{ const P=[]; const sh=GR(g); for(let k=0;k<6;k++){ BX(0.2,0.0008,0.8,MM.sheet,-0.5+k*0.2,0,0,sh); BX(0.04,0.02,0.8,MM.sheet,-0.4+k*0.2,0.01,0,sh); }
        P.push({nm:'Профнастил складу',sz:'скат 11° / 17° / 22°',m:null,q:'',o:sh});
        P.push({nm:'Міні-рейка (аналог AR2-MR13-380)',sz:'380 мм',m:null,q:398,qs:'398 (418 до замовлення)',o:BX(0.38,0.03,0.04,MAT.al,0,0.035,0,g),ex:[0,0.12,0]});
        const sc=GR(g); [-0.16,-0.1,-0.04,0.04,0.1,0.16].forEach(x=>bolt(5.5,25,MAT.hw,sc,x,0.06,0)); P.push({nm:'Саморіз 5,5×25 з EPDM',sz:'6 на рейку',m:null,q:2388,o:sc,ex:[0,0.24,0]});
        P.push({nm:'Притиск середній П33',sz:'під раму 33 мм, болт M8',m:null,q:306,o:BX(0.05,0.03,0.04,MAT.al,0.08,0.07,0,g),ex:[0,0.36,0]});
        P.push({nm:'Притиск крайній Z33',sz:'',m:null,q:92,o:BX(0.04,0.03,0.04,MAT.al,-0.12,0.07,0,g),ex:[0,0.36,0]});
        P.push({nm:'Модуль (кут)',sz:'з етапу панелей',m:36.5,q:176,o:BX(0.5,0.033,0.4,MM.cells,0.29,0.07,0.1,g),ex:[0.15,0.5,0]}); return P; }});
    const t0=T.t; T.slowI(t0,t0+2);
    const S=sched(WL.rails.length,t0+1.5,5,{k:0,df:0.3}); rRail=T.act(new Rev(WL.railIm,WL.rails.map((r,k)=>({i:k,s:S.s[k],d:S.d[k],a:{h:0.3}})),'drop'));
    const wm=WL.mods, S2=sched(wm.length,t0+6.8,9,{k:0,df:0.45}), landW=new Map(); const pw=[[],[]];
    wm.forEach((m,k)=>{ pw[m.w].push({i:m.k,s:S2.s[k],d:S2.d[k],a:{h:0.6}}); landW.set(m.key,S2.s[k]+S2.d[k]); });
    rWp=pw.map((L,w)=>T.act(new Rev(WHI[w].im,L,'drop')));
    const ic=WL.cl.map((c,k)=>({i:k,s:Math.max(...c.adj.map(a=>landW.get(a)??-1))+0.02,d:0.25})).filter(x=>x.s>0);
    const rCw=T.act(new Rev(WL.clIm,ic,'pop')); const tP=Float32Array.from(ic.filter(x=>WL.cl[x.i].z===0).map(x=>x.s).sort((a,b)=>a-b)), tZ=Float32Array.from(ic.filter(x=>WL.cl[x.i].z===1).map(x=>x.s).sort((a,b)=>a-b));
    T.view(t0+1.4,t0+16,pan(VIEWS.wh,view([158,26,22],[118,4,16]),t0+1.4,t0+16));
    T.warn.push({t0:t0+6,t1:t0+11,inf:1,t:'Склад: за розкладкою чи за RUDNIK',d:'За розкладкою — 398 міні-рейок, 306 П33, 92 Z33; у проєкті RUDNIK — 640 блоків Light_P50-310, 260 Z33, 442 П33. Що замовляти — рішення власника.'});
    T.cap(t0,'Міні-рейки на саморізах із EPDM, далі панелі; притиски — після кожної панелі.'); T.music(t0+2,'drive');
    T.counter({nm:'Міні-рейки',tot:398,n:()=>rRail.cnt()}); T.counter({nm:'Притиски П33',tot:306,n:t=>ub(tP,t)}); T.counter({nm:'Притиски Z33',tot:92,n:t=>ub(tZ,t)});
    T.counter({nm:'Панелі на складі',tot:176,n:()=>rWp[0].cnt()+rWp[1].cnt(),m:36.5,g:'whmod'});
    T.adv(16.5); }

  // 12. блискавкозахист
  T.stage('bz','Блискавкозахист','Без щогл (Том 7): каркас — 19 механічно зв\'язаних блоків по 2 приєднання, провідник вирівнювання ПВ-3 1×6 у лотках, ПЗІП у щитах і шафах вводу.');
  let rDot,rNet;
  { T.sample({title:'Приєднання каркаса до провідника вирівнювання',T:9,dist:1.2,cy:0.05,el:0.45,az:0.8,
      info:['Ризик за ДСТУ EN 62305-2:2022 з узгодженою системою ПЗІП — щогли не потрібні (Том 7)','ПЗІП F1 у щитах PV, F2/F3 у шафах вводу ШВ','Провідник у двійнику — по трасах 25.10 (на нові лотки ще не перекладено)'],
      make:g=>{ const P=[]; BX(0.041,0.041,0.8,MM.steel,0,0.0205,0,g); P.push({nm:'Лага каркаса',sz:'',m:null,q:'',o:GR(g)});
        const cl=GR(g,0.03,0.03,0); BX(0.02,0.05,0.06,MM.cu,0,0,0,cl); bolt(8,25,MAT.hw,cl,0.02,0,0,'x'); P.push({nm:'Затискач до лаги + провід Cu 6 мм²',sz:'опір ≤ 0,2 Ом',m:null,q:38,qs:'38 (19 × 2)',o:cl,ex:[0.12,0.08,0]});
        P.push({nm:'Провідник вирівнювання ПВ-3 1×6',sz:'у лотках уздовж ліній DC',m:null,q:596.5,qs:'596,5 м траси',o:CY(0.004,0.9,MM.green,0.35,0.03,0,g,8,'z'),ex:[0.15,0.05,0]});
        P.push({nm:'Шайба контактна зубчаста',sz:'під гайки болтів гільз',m:null,q:3790,o:CY(0.01,0.002,MAT.hw,-0.03,0.045,0.2,g,16),ex:[0,0.2,0]}); return P; }});
    const t0=T.t; rDot=T.act(new Rev(oBZ.dots,Array.from({length:oBZ.dots.count},(_,i)=>({i,s:t0+1.5+i*0.12,d:0.4})),'pop')); rNet=T.act(new LRev(oBZ.net,t0+1.5,t0+8)); T.act(new LRev(oBZ.br,t0+1.5,t0+7));
    const other=G.oursBZ.children.filter(o=>o!==oBZ.net&&o!==oBZ.br&&o!==oBZ.dots&&o!==oBZ.desc&&o!==oBZ.ring); T.act(new VAct(other,t0+6,null,0.4));
    T.view(t0+1.4,t0+10,pan(view([110,70,10],[50,6,-46]),view([40,90,40],[50,4,-46]),t0+1.4,t0+10));
    T.cap(t0,'Провідник вирівнювання — у лотках уздовж ліній DC; кожен блок каркаса приєднано у двох місцях.'); T.music(t0+1.5,'drive');
    T.counter({nm:'Приєднання блоків каркаса',tot:38,n:()=>rDot.cnt()}); T.counter({nm:'Провідник вирівнювання ПВ-3 1×6, м траси',tot:596.5,n:()=>Math.round(5965*rNet.frac())/10,unit:'м'});
    T.adv(10); }

  // 13. накопичувач енергії
  T.stage('uze','Накопичувач енергії','3 контейнери Golen LES-H20 краном на плити Фп-1 біля фасаду по осі 17, торцем до стіни, 3,0 м від неї (Том 8).');
  let nCont=()=>0;
  { const conts=ESS.filter(o=>o.isGroup&&o.parent===G.oursBase), slabs=ESS.filter(o=>o.isMesh&&o.parent===G.oursBase&&(o.material===MAT.slab||o.material===UZM.plat)), shv=ESS.filter(o=>o.isMesh&&o.parent===G.oursBase&&o.material===MAT.cab&&o.geometry.parameters&&Math.abs(o.geometry.parameters.width-0.8)<1e-6);
    const c0=BS.cost;
    T.sample({title:'Контейнер Golen LES-H20-1205W500C-PS',T:13,dist:13,cy:1.2,el:0.32,az:0.55,table:false,
      info:['АКБ 1 205 кВт·год · PCS 500 кВт · 12 входів PV по 60 кВтп · ≈20 т','Ціна: 190 000 $ FOB за контейнер × 3 = 570 000 $; доставка 15 000 $ за контейнер','УЗЕ разом '+nf(c0.tot)+' $ без ПДВ (Том 8): обладнання, плити, заземлення, траси, AC до ТП-5913, EMS 25 000 $'],
      make:g=>{ const P=[], k=BS.K[1], c=golenH20(k); c.position.set(0,0.25,0); g.add(c); const sl=BX(7.058,0.25,3.438,MAT.slab,0,0.125,0,g);
        const doors=[]; c.traverse(o=>{ if(o.isMesh&&o.material===UZM.door&&o.position.z>1) doors.push(o); });
        const dp=doors.map(o=>{ const w=o.geometry.parameters.width, pv=GR(c,o.position.x-w/2,o.position.y,o.position.z); c.remove(o); o.position.set(w/2,0,0); pv.add(o); return pv; });
        P.push({nm:'Контейнер 20 фт: АКБ 1 205 кВт·год, PCS 500 кВт',sz:'6 058 × 2 438 × 2 896',m:null,q:3,qs:'3 шт · 190 000 $ FOB',o:c,doors:dp,ex:[0,0.9,0]});
        P.push({nm:'Плита Фп-1, C20/25 F100 W4',sz:'7 058 × 3 438 × 250, 2 сітки Ø12',m:null,q:3,o:sl}); return P; },
      anim:(u,e,P)=>{ const p=P.find(x=>x.doors); if(p) p.doors.forEach(d=>d.rotation.y=-1.7*c01((u-2.4)/2.2)*(1-c01((u-10.6)/1.8))); }});
    const t0=T.t; T.act(new VAct([UZ.trench],t0+1,null,0.5)); T.act(new VAct(slabs,t0+1.6,null,1.2)); T.act(new VAct(shv,t0+2.6,null,1.0));
    const tl=[t0+4,t0+9.5,t0+15]; const lifts=conts.map((c,k)=>{ const B_=rPos(c).clone(), A=W(116,52+k*2.6,0); return crane.lift({t0:tl[k],t1:tl[k]+5.2,A,B:B_,load:c,rig:4.2,top:2.95,sw:[2.9,1.1],tShow:t0+1,after:'keep',real:1}); });
    conts.forEach(c=>{ rVis(c); });
    T.slowI(tl[0],tl[0]+5.2);
    T.act(new VAct([UZ.ac],t0+20.5,null,0)); T.act(new VAct([UZ.dc],t0+21,null,0)); T.act(new LRev(oBZ.desc,t0+21,t0+23)); T.act(new LRev(oBZ.ring,t0+21.5,t0+23.5)); T.act(new VAct(UZ.lbl?UZ.lbl.children:[],t0+21.5,null));
    T.view(t0+1.4,t0+3.6,VIEWS.ess); T.view(t0+4.2,t0+20.4,{fn:t=>{ const s=smooth((t-t0-4)/16); return {p:V(128-6*s,17+3*s,-26-14*s),c:V(104,3,-56-4*s)}; }}); T.view(t0+21.6,t0+24,VIEWS.ess);
    T.cap(t0,'Траншея з трубами ПНД, плити Фп-1 і шафи вводу ШВ; контейнери — краном з машини.'); T.cap(t0+20.5,'Лінії AC до ТП-5913 (мідь 6 × 1×120 на фазу, вимога Golen) і лінії Al від спуску по фасаду до ШВ.'); T.music(t0+4,'drive');
    nCont=t=>tl.filter(x=>t>=x+5.2).length;
    T.counter({nm:'Контейнери Golen LES-H20',tot:3,n:nCont}); T.counter({nm:'Ємність, кВт·год',tot:3615,n:t=>nCont(t)*1205,unit:'кВт·год'}); T.counter({nm:'Обладнання, $ FOB',tot:570000,n:t=>nCont(t)*190000,unit:'$'});
    T.adv(24); }

  // 14. підсумок
  T.stage('sum','Підсумок','Наш варіант Б змонтовано.');
  { const t0=T.t; T.view(t0+1.6,t0+16,orbit(50,4,-46,128,78,0.9,2.6,t0+1.6,t0+16)); T.music(t0,'end'); T.cap(t0,'Наш варіант Б змонтовано. Підсумок — у картці і в панелі.'); T.adv(16); }
  T.done();
  // палети: розбирають блоки під лаги, під рами щитів і під опори лотків — у порядку розкладання
  { const all=cons.concat(consF.slice().sort((a,b)=>a-b),consS.slice().sort((a,b)=>a-b)); pal.R.set(Array.from({length:pal.n},(_,k)=>k===0?Math.max(all[Math.min(all.length-1,59)],pal.A[0]+0.4):all[Math.min(all.length-1,k*60+59)])); }
  T.prep.push(()=>{ [G.ep,G.uze,G.oursBZ].forEach(g=>{ if(g){ rVis(g); g.visible=true; } }); if(EP.hl){ rVis(EP.hl); EP.hl.visible=false; }
    [...EP.tray,EP.facade,EP.blk,EP.trav,EP.fit,EP.vx,...EP.al,EP.cP,EP.cM,EP.jS,EP.jL,EP.box,EP.frame,EP.bblk].forEach(o=>{ rVis(o); o.visible=true; });
    if(oBZ.boxes){ rVis(oBZ.boxes); oBZ.boxes.visible=false; } [oBZ.net,oBZ.br,oBZ.dots,oBZ.desc,oBZ.ring].forEach(o=>{ rVis(o); o.visible=true; }); if(UZ.pit){ rVis(UZ.pit); UZ.pit.visible=false; }
    ourMods.material=MAT.pvPo; WHI.forEach(w=>w.im.visible=true); rVis(MARKS); MARKS.visible=false; });
  T.sum=()=>sumOurs(T); return T; }

// склад: ланцюжки модулів довгою стороною один до одного; рейки під точками, притиски на краях ланцюжків і стиках
function whLayout(skip){ const items=[[],[]]; [WHM.filter(m=>m.land),WHM.filter(m=>!m.land)].forEach((L,w)=>L.forEach((m,k)=>{ const key=w+':'+k; if(!skip||!skip.has(key)) items[w].push({m,w,k,key}); }));
  const groups=new Map(); items.flat().forEach(it=>{ const m=it.m, g=m.land?('W'+Math.round(m.X)):(m.part+'_'+m.Y.toFixed(1)); if(!groups.has(g)) groups.set(g,[]); groups.get(g).push(it); });
  const rails=[], cl=[], mods=[]; const STEP=1.34;
  groups.forEach(L=>{ const land=L[0].m.land; L.sort((a,b)=>land?a.m.Y-b.m.Y:a.m.X-b.m.X); const ch=[]; let cur=[L[0]];
    for(let j=1;j<L.length;j++){ const d=land?L[j].m.Y-L[j-1].m.Y:L[j].m.X-L[j-1].m.X; if(d>STEP*1.5){ ch.push(cur); cur=[]; } cur.push(L[j]); } ch.push(cur);
    ch.forEach(c=>{ const n=c.length; for(let e=0;e<=n;e++){ const a=c[e-1], b=c[e], ref=(b||a).m, adj=[a,b].filter(Boolean).map(x=>x.key), z=e===0||e===n?1:0;
        let ex; if(land){ ex=e===0?ref.Y-0.6715:e===n?ref.Y+0.6715:(a.m.Y+b.m.Y)/2; } else { ex=e===0?ref.X-0.67:e===n?ref.X+0.67:(a.m.X+b.m.X)/2; }
        [-0.596,0.596].forEach(q=>{ const X=land?ref.X+q:ex, Y=land?ex:ref.Y+q; rails.push({X,Y,part:ref.part,land}); cl.push({X,Y,part:ref.part,land,z,adj}); }); } });
    });
  items.flat().forEach(it=>mods.push(it)); mods.sort((a,b)=>b.m.X-a.m.X||a.m.Y-b.m.Y);
  const qOf=(part,Y)=>{ const sgn=(part==='C1'||part==='C2')&&Y>-15.5?-1:1; return new Q().setFromAxisAngle(XA,sgn*SLOPE[part]*D2R); };
  const railIm=inst(BOX,MAT.al,rails.length,MTG), clIm=inst(BOX,MAT.al,cl.length,MTG,false);
  rails.forEach((r,i)=>{ const q=qOf(r.part,r.Y); _m.compose(W(r.X,r.Y,WHF[r.part](r.X,r.Y)+0.035),q,r.land?_ss.set(0.04,0.03,0.38):_ss.set(0.38,0.03,0.04)); railIm.setMatrixAt(i,_m); });
  cl.forEach((r,i)=>{ const q=qOf(r.part,r.Y); _m.compose(W(r.X,r.Y,WHF[r.part](r.X,r.Y)+0.108),q,_ss.set(r.z?0.04:0.05,0.016,0.04)); clIm.setMatrixAt(i,_m); });
  railIm.visible=clIm.visible=false; railIm.frustumCulled=clIm.frustumCulled=false;
  return {rails,cl,mods,railIm,clIm,nz:cl.filter(c=>c.z).length,nm:cl.filter(c=>!c.z).length}; }

// ================= Вінницький проєкт
function buildRP(){ const T=new TL('rp'), R=T.root, CR={X:107.5,Y:43};
  const rows=new Map(); RT.forEach((t,i)=>{ if(!rows.has(t.si)) rows.set(t.si,[]); rows.get(t.si).push(i); });
  const ordT=[]; [...rows.values()].sort((a,b)=>RT[a[0]].Y-RT[b[0]].Y).forEach((L,r)=>{ L.sort((a,b)=>RT[a].X-RT[b].X); if(r%2) L.reverse(); ordT.push(...L); });
  const rects=RT.map(t=>[t.X-0.7,t.X+0.7,t.Y-MOD_X-0.2,t.Y-MOD_X+1.6]); const slots=roofSlots(rects,2.4,1.2,0.8);
  const NBLK=RT.length*2, NPAL=Math.ceil(NBLK/60);
  const misT=id=>{ const i=MIS.findIndex(m=>m.id===id); return i<0?null:{n:i+1,m:MIS[i]}; };
  const mw=(t0,t1,id,paint)=>{ const x=misT(id); if(x) T.warn.push({t0,t1,id,n:x.n,t:x.m.t,d:typeof x.m.d==='function'?x.m.d():x.m.d,paint}); };
  T.stage('intro','Вступ','Вінницький проєкт РП 2025/12-07: 1 440 модулів Shinefar 710 Вт на баластних трикутниках RUDNIK 15°, 53 щогли, 3 майданчики FFD + 15 Galaxy261L.');
  T.view(0,5,OV_SE); T.cap(0,'Вінницький проєкт: 1 440 модулів 710 Вт (1 260 цех + 180 склад), 1 022,4 кВтп. Невідповідності проєкту показано по ходу монтажу. Натисніть ▶.'); T.music(0,'calm'); T.adv(5);
  T.stage('mark','Розмітка','Місця 2 702 трикутників за планом покрівлі РП (оцифровка «Підключення PV Антарес»).');
  { const t0=T.t, pts=[]; ordT.forEach(i=>{ const t=RT[i], z=roofZ(t.X)+0.014, y=t.Y-MOD_X+0.7; pts.push(W(t.X-0.18,y,z),W(t.X+0.18,y,z),W(t.X,y-0.7,z),W(t.X,y+0.7,z)); });
    const mk=lines(pts,0xf6f1df,R); T.mark=mk; const rv=T.act(new LRev(mk,t0+0.6,t0+7.2)); T.view(t0+1.4,t0+8,TOPV);
    T.cap(t0,'Розмітка: осі трикутників рядами схід — захід, 182 ряди.'); T.counter({nm:'Місця трикутників — розмітка',tot:RT.length,n:()=>Math.max(0,Math.round(rv.k/2))}); T.adv(8); }
  T.stage('crane','Кран і палети блоків','Автокран — на тому самому місці, що й для нашого варіанта (між ТП-5913 і майданчиками). Палета — 60 блоків (рішення власника 26.10).');
  const crane=T.act(new Crane(R,CR.X,CR.Y,T.t)); let pal;
  { const t0=T.t, s0=slots[0], f0=fr(s0.X,s0.Y,0), lp=palletObj(R); lp.rotation.y=Math.PI/2;
    crane.lift({t0:t0+1,t1:t0+10,A:W(103.6,40.2,0),B:f0.p,load:lp,rig:2.6,top:0.62,sw:[0.5,0.32],tShow:t0,after:'hide'}); T.slowI(t0,t0+10.2);
    T.view(t0+1.2,t0+10.4,{fn:t=>{ const s=smooth((t-t0-1)/9); return {p:V(122,10+8*s,-18+4*s),c:V(101-3*s,5+8*s,-41.5)}; }});
    T.cap(t0,`Кран піднімає палету: 60 блоків B300300-60 по 13 кг. На дах — ${nf(NBLK)} блоків у 3D (2 на трикутник), ${nf(NPAL)} палет.`);
    const ap=new Float32Array(NPAL); for(let k=0;k<NPAL;k++) ap[k]=k===0?t0+10:t0+10.3+k*0.05; pal=T.act(new Stacks(R,slots,PALP,NPAL,ap));
    T.view(t0+12.2,t0+15,OV_SE); T.cap(t0+10.2,'Решта палет — по периметру покрівлі.'); T.counter({nm:'Палети з блоками на даху',tot:NPAL,n:t=>pal.cnt(t)}); T.adv(15); }
  T.stage('blk','Баласт на матах','Баласт B300300-60, 13 кг — 2 на трикутник, центри за 65 мм від торців основи; мат під кожен блок (АБ арк. 8).');
  let rB; const cons=[];
  { const TG=TRI.geo; T.sample({title:'Баласт B300300-60 на матах',T:10,dist:2.3,cy:0.1,el:0.5,az:0.7,
      info:['У 3D 5 404 блоки (2 × 2 702 трикутники); мат — 5 396 за АБ арк. 8','Шуруп R-LX 6,3×50 — 5 396 (специфікація РП)','Незакріплений баласт на ухилі до 16° — невідповідність 5'],
      make:g=>{ const P=[], o=GR(g); const mt=new THREE.Mesh(partGeo('mat'),MAT.mat), bk=new THREE.Mesh(partGeo('block'),MAT.blk); [mt,bk].forEach(x=>{ x.castShadow=true; });
        const box3=new THREE.Box3().setFromObject(bk), c=box3.getCenter(V(0,0,0)); const gm=GR(g,-c.x,-box3.min.y,-c.z), gb=GR(g,-c.x,-box3.min.y,-c.z); gm.add(mt); gb.add(bk);
        P.push({nm:'Мат під баласт',sz:'2 на трикутник',m:null,q:5396,o:gm}); P.push({nm:'Баласт B300300-60',sz:'300×300×60',m:13,q:5404,qs:'5 404 у 3D',o:gb,ex:[0,0.1,0]});
        P.push({nm:'Шуруп R-LX 6,3×50',sz:'у блок',m:null,q:5396,o:bolt(6.3,50,MAT.hw,g,0,0.12,0),ex:[0,0.36,0]}); return P; }});
    const t0=T.t, S=sched(ordT.length,t0+1.6,22,{k:3,gs:1.6,ds:1.4,df:0.4}); T.slowI(t0,S.tf);
    const it=ordT.map((i,k)=>({i,s:S.s[k],d:S.d[k],a:{h:k<3?1:0.55}})); rB=T.act(new Rev(RPM_.blk,it.map(x=>Object.assign({},x)),'drop')); T.act(new Rev(RPM_.mat,it.map(x=>Object.assign({},x,{s:x.s-0.15,a:{h:0.25}})),'drop'));
    ordT.forEach((i,k)=>{ cons.push(S.s[k],S.s[k]); });
    const t0_=RT[ordT[0]]; T.view(t0+1.6,S.tf,look(t0_.X,t0_.Y,roofZ(t0_.X),4.5,0.8,0.5)); T.view(S.tf+2,t0+23.6,pan(OV_SE,view([120,48,40],[60,6,-40]),S.tf+2,t0+23.6));
    for(let k=0;k<3;k++){ const t=RT[ordT[k]]; T.tags.push({t0:S.s[k],t1:S.s[k]+1.6,txt:`Трикутник ${k+1} з ${nf(RT.length)}: 2 блоки на матах`,p:fr(t.X,t.Y-MOD_X+0.7,0.3).p}); }
    T.cap(t0,'Під кожен трикутник — 2 блоки на матах; блоки до основи — шурупами R-LX.'); T.music(S.tf,'drive');
    T.view(t0+24.2,t0+30,VIEWS.over); mw(t0+24,t0+30,'slope');
    T.counter({nm:'Баласт B300300-60 (у 3D)',tot:NBLK,n:()=>rB.cnt()*2,m:13,g:'blk'}); T.counter({nm:'Мати під баласт (АБ арк. 8)',tot:5396,n:()=>Math.min(5396,rB.cnt()*2)});
    T.adv(30); }
  T.stage('tri','Трикутники','Трикутник BalZn15-1568.1470, 15° (АБ арк. 6): U 45×40×3, основа 1 400, пояс 1 160 — збирають унизу, краном на дах, на блоки.');
  let rT;
  { T.sample({title:'Трикутник RUDNIK за АБ арк. 6',T:14,dist:1.9,cy:0.25,el:0.3,az:0.9,
      info:['Збирають унизу; піднімають краном','6,73 кг — маса з нашої 3D-моделі за АБ арк. 6','Під модуль 1 134 (ресурс кошторису), а на плані — модуль 1 303'],
      make:g=>{ const P=[]; const parts=[['base','Основа U 45×40×3, 1 400','',[0,0,0]],['strut','Стійки U 45×40×3','',[0,0.16,0.1]],['rail','Пояс U 45×40×3, 1 160','під модуль 1 134 мм',[0,0.38,0]],['hw','Болти M8 з гайками','8 094 компл. на трикутники',[0.25,0.26,0]]];
        const tmp=new THREE.Mesh(partGeo('base')); const box3=new THREE.Box3().setFromObject(tmp), c=box3.getCenter(V(0,0,0));
        parts.forEach(([k,nm,sz,ex],j)=>{ const o=GR(g,-c.x,-box3.min.y,-c.z), m=new THREE.Mesh(partGeo(k),k==='hw'?MAT.hw:MAT.zn); m.castShadow=true; o.add(m);
          P.push({nm,sz,m:j===0?6.73:null,q:j===0?RT.length:j===3?8094:'',qs:j===0?nf(RT.length)+' трикутників (у зборі)':undefined,o,ex}); }); return P; }});
    mw(T.t-8,T.t-1,'mod');
    const t0=T.t, S=sched(ordT.length,t0+1.6,24,{k:3,gs:1.8,ds:1.6,df:0.45}); T.slowI(t0,S.tf);
    const it=ordT.map((i,k)=>({i,s:S.s[k],d:S.d[k],a:{h:k<3?1.2:0.6}})); const rr_=RPM_.lod.map(im=>T.act(new Rev(im,it.map(x=>Object.assign({},x)),'drop'))); rT=rr_[0];
    const t0_=RT[ordT[0]]; T.view(t0+1.6,S.tf,look(t0_.X,t0_.Y,roofZ(t0_.X)+0.3,4.8,0.75,0.45)); T.view(S.tf+2,t0+25.6,pan(view([128,46,30],[60,6,-40]),OV_SW,S.tf+2,t0+25.6));
    T.cap(t0,'Трикутники ставлять на блоки рядами; основа — шурупами до баласту.'); T.music(S.tf,'drive');
    const mv=MIS.find(m=>m.id==='val'); if(mv){ T.view(t0+26.2,t0+32,mv.view()); mw(t0+26,t0+32,'val','val'); }
    T.counter({nm:'Трикутники BalZn15-1568.1470',tot:RT.length,n:()=>rT.cnt(),m:6.73,g:'met'});
    T.act(new VAct([T.mark],-1,t0+25.6));
    T.adv(32); }
  T.stage('con','Сполучники','Сполучник Spol-15Zn-700 між основами сусідніх рядів, болт M8 у кожну основу.');
  let rC;
  { T.sample({title:'Сполучник Spol-15Zn-700',T:9,dist:1.3,cy:0.05,el:0.5,az:0.8,info:['На кресленні крок рядів 2 000 (1 400 + 600); на плані — 2 100–2 110','1,60 кг — маса з нашої 3D-моделі'],
      make:g=>{ const P=[]; const tmp=new THREE.Mesh(partGeo('con')); const b3=new THREE.Box3().setFromObject(tmp), c=b3.getCenter(V(0,0,0));
        [['con','Сполучник Spol-15Zn-700','U 38×36×3, L 700',1.6,CON.length,[0,0,0]],['conhw','Болти M8','у кожну основу',null,'',[0,0.15,0]]].forEach(([k,nm,sz,m,q,ex])=>{ const o=GR(g,-c.x,-b3.min.y,-c.z), ms=new THREE.Mesh(partGeo(k),k==='conhw'?MAT.hw:MAT.znD); ms.castShadow=true; o.add(ms); P.push({nm,sz,m,q,o,ex}); }); return P; }});
    const t0=T.t, ord=CON.map((c,j)=>j).sort((a,b)=>ordT.indexOf(CON[a].i)-ordT.indexOf(CON[b].i)), S=sched(ord.length,t0+1.6,14,{k:2,gs:1.6,ds:1.4,df:0.4}); T.slowI(t0,S.tf);
    rC=T.act(new Rev(RPM_.con,ord.map((j,k)=>({i:j,s:S.s[k],d:S.d[k],a:{h:0.5}})),'drop'));
    const c0=CON[ord[0]], tc=RT[c0.i]; T.view(t0+1.6,S.tf,look(tc.X,tc.Y+1,roofZ(tc.X)+0.2,3.5,0.7,0.5)); T.view(S.tf+2,t0+15.6,OV_SE);
    const mc=MIS.find(m=>m.id==='con'); if(mc){ T.view(t0+16.2,t0+22,mc.view()); mw(t0+16,t0+22,'con','con'); }
    T.cap(t0,'Сполучники зв\'язують основи сусідніх рядів.'); T.music(S.tf,'drive');
    T.counter({nm:'Сполучники Spol-15Zn-700',tot:CON.length,n:()=>rC.cnt(),m:1.6,g:'met'}); T.adv(22); }
  T.stage('pv','Панелі, спойлери, притиски','Модулі Shinefar 710 Вт альбомно на 3 трикутниках, спойлери Vitr-240×2450, притиски W35 / Z33.');
  let rM;
  { T.sample({title:'Модуль Shinefar 710 Вт і спойлер',T:13,dist:3.4,cy:0.4,el:0.38,az:0.6,
      info:['710 Вт · 2 384 × 1 303 × 35 мм · 33,8 кг (enfsolar, SF-M21/132; у РП марка SF-M21/G132710 — звірити)','Uхх 50,44 В (ПЗ РП)','1 260 на цеху + 180 на складі = 1 440, 1 022,4 кВтп'],
      make:g=>{ const P=[], pg=GR(g,0,0.45,0); pg.rotation.x=-0.26; const L=2.384, Bw=1.303; BX(L-0.04,0.0015,Bw-0.04,MM.cells,0,0.017,0,pg); BX(L-0.04,0.003,Bw-0.04,MM.glass,0,0.03,0,pg);
        const fg=GR(pg); BX(L,0.035,0.03,MAT.al,0,0.0175,Bw/2-0.015,fg); BX(L,0.035,0.03,MAT.al,0,0.0175,-Bw/2+0.015,fg); BX(0.03,0.035,Bw,MAT.al,L/2-0.015,0.0175,0,fg); BX(0.03,0.035,Bw,MAT.al,-L/2+0.015,0.0175,0,fg);
        P.push({nm:'Модуль Shinefar SF-M21/G132710',sz:'710 Вт, рама 35 мм',m:33.8,q:1440,o:pg,ex:[0,0.25,0]});
        P.push({nm:'Спойлер Vitr-240×2450',sz:'за стійками, на 2 трикутники',m:null,q:1260,o:BX(2.45,0.24,0.004,MAT.sp,0,0.25,-0.72,g),ex:[0,0,-0.3]});
        const cl=GR(g,1.0,0.62,0.4); BX(0.05,0.03,0.04,MAT.al,0,0,0,cl); BX(0.04,0.03,0.04,MAT.al,0.3,0,0,cl); P.push({nm:'Притиски W35 (середній) / Z33 (крайній)',sz:'специфікація РП',m:null,q:5752,qs:'2 520 + 3 232',o:cl,ex:[0.2,0.25,0.1]}); return P; }});
    const t0=T.t, ordM=RMOD.map((m,j)=>j).sort((a,b)=>ordT.indexOf(RMOD[a].i)-ordT.indexOf(RMOD[b].i)), S=sched(ordM.length,t0+1.6,34,{k:3,gs:2.2,ds:2.0,df:0.5}); T.slowI(t0,S.tf);
    rM=T.act(new Rev(RPM_.mods,ordM.map((j,k)=>({i:j,s:S.s[k],d:S.d[k],a:{h:k<3?1:0.6}})),'drop'));
    const land=new Float32Array(RMOD.length); ordM.forEach((j,k)=>land[j]=S.s[k]+S.d[k]); const midOf=new Map(RMOD.map((m,j)=>[m.i,j]));
    const sp=DATA.rpm.sp, isp=[]; sp.forEach((ti,j)=>{ const mj=midOf.get(ti+1)??midOf.get(ti-1); if(mj!=null) isp.push({i:j,s:land[mj]+0.05,d:0.4,a:{h:0.3}}); }); const rS=T.act(new Rev(RPM_.sp,isp,'drop'));
    const ev=RT.map((t,i)=>i).filter(i=>RT[i].k%2===0), icl=[]; ev.forEach((ti,e)=>{ const a=midOf.get(ti-1), b=midOf.get(ti+1); const tm=Math.max(a!=null?land[a]:-1,b!=null?land[b]:-1); if(tm>0) [0,1].forEach(q=>icl.push({i:e*2+q,s:tm+0.03,d:0.3})); });
    const rCl=T.act(new Rev(RPM_.cl,icl,'pop'));
    const m0=RT[RMOD[ordM[0]].i]; T.view(t0+1.6,S.tf,look(m0.X,m0.Y,roofZ(m0.X)+0.5,6,0.7,0.45)); T.view(S.tf+2,t0+35.6,pan(view([140,60,40],[60,6,-40]),view([-20,70,30],[48,6,-46]),S.tf+2,t0+35.6));
    for(let k=0;k<3;k++){ const t=RT[RMOD[ordM[k]].i]; T.tags.push({t0:S.s[k],t1:S.s[k]+2.2,txt:`Модуль ${k+1} з ${nf(RMOD.length)} на 3 трикутниках`,p:W(t.X,t.Y,roofZ(t.X)+0.9)}); }
    T.cap(t0,'Модуль кладуть альбомно на пояси трьох трикутників, спойлер — за стійками, притиски — на стиках і кінцях рядів.'); T.music(S.tf,'drive');
    const ms=MIS.find(m=>m.id==='sag'); if(ms){ T.view(t0+36.2,t0+42,ms.view()); mw(t0+36,t0+42,'sag','sag'); }
    T.counter({nm:'Модулі на цеху',tot:RMOD.length,n:()=>rM.cnt(),m:33.8,g:'mod'}); T.counter({nm:'Спойлери Vitr-240×2450',tot:1260,n:()=>rS.cnt()}); T.counter({nm:'Притиски (у 3D — по 2 на пояс)',tot:icl.length,n:()=>rCl.cnt(),note:'за специфікацією РП — 5 752'});
    T.counter({nm:'Потужність на цеху, кВтп',tot:Math.round(RMOD.length*0.71*10)/10,n:()=>Math.round(rM.cnt()*71)/100,unit:'кВтп'});
    T.adv(42); }
  T.stage('wh','Склад','180 модулів на профнастилі складу; кріплення RUDNIK за специфікацією ЕТР поз. 2.');
  let rW;
  { const t0=T.t; const L=[[],[]]; let k=0; const ord=WHM.map((m,j)=>j).sort((a,b)=>WHM[b].X-WHM[a].X||WHM[a].Y-WHM[b].Y), li=[0,0]; const idx=WHM.map(m=>m.land?li[0]++:li[1]++);
    const S=sched(ord.length,t0+1.6,10,{k:0,df:0.45}); ord.forEach((j,q)=>L[WHM[j].land?0:1].push({i:idx[j],s:S.s[q],d:S.d[q],a:{h:0.6}})); rW=L.map((x,w)=>T.act(new Rev(WHI[w].im,x,'drop')));
    T.view(t0+1.4,t0+16,pan(VIEWS.wh,view([158,26,22],[118,4,16]),t0+1.4,t0+16));
    T.warn.push({t0:t0+11,t1:t0+16.5,t:'Склад: кількості RUDNIK не виходять з розкладки',d:'Проєкт: блоки Light_P50-310 — 640, Z33 — 260, П33 — 442, метизи блоків — 3 840. За розкладкою 180 модулів (4 точки на модуль) — 404 рейки / блоки, 88 Z33, 316 П33; середніх щонайбільше 358. Розташування блоків у РП не показано.'});
    T.cap(t0,'Склад: модулі на скатах 22°, 17° і 11°; кількості кріплення — за специфікацією РП.'); T.music(t0+1.6,'drive');
    T.counter({nm:'Панелі на складі',tot:180,n:()=>rW[0].cnt()+rW[1].cnt(),m:33.8,g:'whmod'}); T.counter({nm:'Блоки Light_P50-310 (специфікація)',tot:640,n:t=>t>=t0+11?640:0}); T.counter({nm:'Притиски Z33 / П33 (специфікація)',tot:702,n:t=>t>=t0+11?702:0,note:'260 + 442'});
    T.adv(16.5); }
  T.stage('ep','Щити і стрінги','80 стрінгів по 17–19 модулів до 8 ЩР-PV на фасадах; ЩР-АКБ — біля майданчиків УЗЕ. Розводки по модулях у даних РП немає.');
  { const boxes=[]; RP.pads.forEach(p=>{ (p.pv||[]).forEach((r,k)=>boxes.push({r,n:'ЩР-PV',pad:p.id})); if(p.akb) boxes.push({r:p.akb,n:'ЩР-АКБ',pad:p.id}); });
    const objs=boxes.map(b=>{ const r=b.r, w=r[1]-r[0], d=r[3]-r[2], o=BX(w,1.0,d,b.n==='ЩР-PV'?MAT.cab:MM.white,(r[0]+r[1])/2,1.5,-(r[2]+r[3])/2,R); o.userData.info={t:`${b.n} · ${b.pad}`,d:'План — за даними РП; висота і відмітка в даних не задані (показано умовно 1,0 м на відмітці +1,0)'}; o.visible=false; PICK.push({o,when:()=>state.sec==='bud'}); return o; });
    T.sample({title:'ЩР-PV на фасаді',T:9,dist:3.8,cy:0.5,el:0.25,az:0.6,info:['80 стрінгів: 74 × 18 + 3 × 19 + 3 × 17 модулів','Кабель 1×6 — 21,9 км, до 288 м в один бік','Запобіжники й роз\'єднувачі ЩР-PV — на 1 000 В DC'],
      make:g=>{ const P=[]; P.push({nm:'ЩР-PV',sz:'по 10 стрінгів; план 1 030 × 370, висота — немає в даних',m:null,q:8,o:BX(1.03,1.0,0.37,MAT.cab,0,0.5,0,g)}); P.push({nm:'ЩР-АКБ',sz:'біля майданчиків',m:null,q:3,o:BX(1.03,1.0,0.37,MM.white,1.4,0.5,0,g),ex:[0.3,0,0]}); return P; }});
    const t0=T.t; objs.forEach((o,k)=>T.act(new VAct([o],t0+1.5+k*0.4,null,0.8)));
    T.view(t0+1.4,t0+6,view([118,14,-50],[97,4,-66])); T.view(t0+7,t0+13,MIS.find(m=>m.id==='uoc').view()); mw(t0+7,t0+13,'uoc');
    T.cap(t0,'Щити на фасаді по осі 17 біля MS-1 і MS-2 та біля MS-3; кабелі стрінгів — до 288 м в один бік.'); T.music(t0+1.5,'drive');
    T.counter({nm:'Стрінги (74 × 18 + 3 × 19 + 3 × 17)',tot:80,n:t=>Math.round(80*c01((t-t0-1.5)/5))}); T.counter({nm:'ЩР-PV і ЩР-АКБ',tot:objs.length,n:t=>objs.filter((o,k)=>t>=t0+1.5+k*0.4).length});
    T.adv(13); }
  T.stage('bz','Блискавкозахист','53 щогли (51 × 4 м M-04/40 і 2 × 6 м) на бетонних основах, дріт Ø8, 44 спуски, вирівнювання, заземлювачі.');
  let rMa;
  { T.sample({title:'Щогла M-04/40 на бетонних основах',T:10,dist:7.2,cy:2.1,el:0.25,az:0.6,table:false,info:['Комплект 47,5 кг: основи 30 + 15 кг, Ø 300/400 (каталог FS)','Щогли 6 м — 2 шт, маса в каталозі не знайдена','Дріт '+nf(RP.wire.reduce((s,w)=>s+Math.hypot(w[2]-w[0],w[3]-w[1]),0),0)+' м у плані, спусків '+RP.down.length+', стрижнів заземлення '+RP.rods.length],
      make:g=>{ const P=[]; P.push({nm:'Основа бетонна 30 кг, Ø 400',sz:'',m:30,q:51,o:CY(0.2,0.12,MM.conc,0,0.06,0,g,20)}); P.push({nm:'Основа бетонна 15 кг, Ø 300',sz:'',m:15,q:51,o:CY(0.15,0.1,MM.conc,0,0.17,0,g,20),ex:[0,0.3,0]});
        P.push({nm:'Щогла M-04/40, 4 м',sz:'комплект з основами 47,5 кг',m:47.5,q:51,o:CY(0.0225,4,MAT.mast,0,2.22,0,g,12),ex:[0,0.7,0]}); return P; }});
    const t0=T.t, n=RP.masts.length, S=sched(n,t0+1.6,9,{k:1,gs:2.2,ds:2,df:0.4}), ord=RP.masts.map((m,i)=>i).sort((a,b)=>RP.masts[b][0]-RP.masts[a][0]); T.slowI(t0,S.tf);
    const it=ord.map((i,k)=>({i,s:S.s[k],d:S.d[k],a:{h:k<1?2:1.2}})); rMa=T.act(new Rev(rpBZ.masts[0],it.map(x=>Object.assign({},x)),'drop')); T.act(new Rev(rpBZ.masts[1],it.map(x=>Object.assign({},x,{s:x.s-0.2})),'drop'));
    T.act(new LRev(rpBZ.wire,t0+6,t0+12)); T.act(new LRev(rpBZ.down,t0+9,t0+12)); T.act(new Rev(rpBZ.tj,RP.down.map((p,i)=>({i,s:t0+9.5+i*0.05,d:0.3})),'pop')); T.act(new LRev(rpBZ.bond,t0+8,t0+13)); T.act(new LRev(rpBZ.earth,t0+11,t0+13));
    T.act(new VAct([rpBZ.cones],t0+13.5,t0+18));
    const m0=RP.masts[ord[0]]; T.view(t0+1.6,S.tf,look(m0[0],m0[1],HV+2,9,0.7,0.35)); T.view(S.tf+2,t0+13,pan(OV_SE,OV_SW,S.tf+2,t0+13)); T.view(t0+13.6,t0+18,OV_SE);
    T.cap(t0,'Щогли ставлять серед рядів на бетонні основи; дріт Ø8 між щоглами, спуски по фасадах, вирівнювання, заземлювачі.'); T.cap(t0+13.5,'Зони захисту щогл. У нашому варіанті щогл немає (Том 7: ризик із ПЗІП).'); T.music(S.tf,'drive');
    T.counter({nm:'Щогли (51 × M-04/40 + 2 × 6 м)',tot:n,n:()=>rMa.cnt(),mf:()=>{ let c=0; for(let k=0;k<rMa.hi;k++) if(RP.masts[rMa.I[k]][2]===4) c++; return c*47.5; },g:'met'});
    T.adv(18); }
  T.stage('uze','Накопичувач енергії','3 майданчики: шафа FFD POWER 500 кВт + 5 × Galaxy261L під навісом; MS-1 і MS-2 — до ТП-5913, MS-3 — до ТП-6923.');
  { const own=ESS.filter(o=>o.parent===G.rpBase), slabs=own.filter(o=>o.material===MAT.slab), gal=own.filter(o=>o.userData.info&&/^Galaxy/.test(o.userData.info.t)), ffd=own.filter(o=>o.userData.info&&/^FFD/.test(o.userData.info.t)), sm=own.filter(o=>o.userData.info&&/^SM/.test(o.userData.info.t));
    const usd=Math.round(32.3e6/UAH);
    T.sample({title:'Galaxy261L і шафа FFD POWER 500 кВт',T:12,dist:8.6,cy:1.2,el:0.3,az:0.6,table:false,
      info:['Galaxy261L: 261 кВт·год (LFP), 1 150 × 1 435 × 2 280, 2 680 кг (ffdpower.com)','FFD POWER 500 кВт: PCS, STS, трансформатор 500 кВА, 10 MPPT — маса не вказана','Шафи FFD за кошторисом РП ≈32,3 млн грн без ПДВ ≈ '+nf(usd)+' $'],
      make:g=>{ const P=[]; P.push({nm:'Galaxy261L, АКБ 261 кВт·год',sz:'1 150 × 1 435 × 2 280',m:2680,q:15,o:BX(1.15,2.28,1.435,MAT.cab,-0.8,1.14,0,g),ex:[-0.4,0,0]}); P.push({nm:'Шафа FFD POWER 500 кВт',sz:'PCS, STS, трансформатор',m:null,q:3,o:BX(1.04,2.2,1.6,MM.white,0.8,1.1,0,g),ex:[0.4,0,0]}); return P; }});
    const t0=T.t; slabs.forEach((o,k)=>T.act(new VAct([o],t0+1.4+k*0.3,null,0.8))); [...gal,...ffd,...sm].forEach((o,k)=>T.act(new VAct([o],t0+3+k*0.18,null,1.2)));
    T.view(t0+1.4,t0+8,VIEWS.ess); const m7=MIS.find(m=>m.id==='uzeqf'), m8=MIS.find(m=>m.id==='uzefire'), m9=MIS.find(m=>m.id==='uzeisl');
    T.view(t0+8.6,t0+13,m7.view()); mw(t0+8.4,t0+13,'uzeqf'); T.view(t0+13.6,t0+18,m8.view()); mw(t0+13.4,t0+18,'uzefire'); T.view(t0+18.6,t0+23,m9.view()); mw(t0+18.4,t0+23,'uzeisl');
    T.cap(t0,'Плити майданчиків, шафи Galaxy261L і FFD під навісом біля фасаду.'); T.music(t0+1.5,'drive');
    const nG=t=>gal.filter((o,k)=>t>=t0+3+k*0.18).length;
    T.counter({nm:'Galaxy261L',tot:gal.length,n:nG}); T.counter({nm:'Шафи FFD POWER 500 кВт',tot:ffd.length,n:t=>ffd.filter((o,k)=>t>=t0+3+(gal.length+k)*0.18).length}); T.counter({nm:'Ємність, кВт·год',tot:3915,n:t=>nG(t)*261,unit:'кВт·год'});
    T.adv(23); }
  T.stage('sum','Підсумок','Вінницький проєкт змонтовано.');
  { const t0=T.t; T.view(t0+1.6,t0+16,orbit(50,4,-46,128,78,0.9,2.6,t0+1.6,t0+16)); T.music(t0,'end'); T.cap(t0,'Вінницький проєкт змонтовано. Підсумок — у картці і в панелі.'); T.adv(16); }
  T.done();
  pal.R.set(Array.from({length:pal.n},(_,k)=>k===0?Math.max(cons[Math.min(cons.length-1,59)],pal.A[0]+0.4):cons[Math.min(cons.length-1,k*60+59)]));
  T.prep.push(()=>{ rVis(G.rpBZ); G.rpBZ.visible=true; ['wire','down','tj','bond','earth'].forEach(k=>{ rVis(rpBZ[k]); rpBZ[k].visible=true; }); rVis(rpBZ.masts[0]); rpBZ.masts.forEach(o=>{ rVis(o); o.visible=true; });
    rVis(MARKS); MARKS.visible=true; MARKS.children.forEach(o=>{ rVis(o); o.visible=false; }); WHI.forEach(w=>w.im.visible=true); });
  T.sum=()=>sumRP(T); return T; }

// ================= підсумки
const AREA=(SHOP[1]-SHOP[0])*(SHOP[3]-SHOP[2]);
function massBy(T,t){ const g={blk:0,met:0,mod:0,el:0,whmod:0}; T.cnt.forEach(c=>{ if(!c.g) return; const n=c.n(t); g[c.g]+=c.mf?c.mf():(c.m||0)*n; }); return g; }
function sumOurs(T){ const t=T.T, g=massBy(T,t), E=EPX, rr=new Set(E.rr); let gen=0; YEAR.kwh.ours.forEach((v,i)=>{ if(!rr.has(i)) gen+=v; });
  const whIdx=[WHM.filter(m=>m.land),WHM.filter(m=>!m.land)], rw=new Set(); E.rw.forEach(j=>{ const p=EP.whi[j]; if(p) rw.add(p[0]===0?p[1]:whIdx[0].length+p[1]); }); YEAR.kwh.whours.forEach((v,i)=>{ if(!rw.has(i)) gen+=v; });
  const roof=g.blk+g.met+g.mod+g.el; const pl=BS.cost.plant;
  return {title:'Наш варіант Б',rows:[['Панелі','1 925','1 749 цех + 176 склад, ZNSHINE 730 Вт'],['Потужність','1 405,25 кВтп',''],['Генерація за рік',nf(gen/1000,1)+' МВт·год','одна модель двійника для обох проєктів, з тінями'],
    ['Баласт на даху цеху',ft(g.blk),'блоки 13 кг і мати 0,4 кг'],['Метал і метизи',ft(g.met),'лаги, профілі, гільзи, кутники, болти, гайки, шайби з відомою масою'],['Модулі на цеху',ft(g.mod),'1 749 × 36,5 кг'],['Електрика на даху',ft(g.el),'рами щитів, кабелі 1×6, металорукав, лінії Al'],
    ['Разом на дах цеху',ft(roof),nf(roof/AREA,1)+' кг/м² у плані ('+nf(AREA,0)+' м²)'],['Склад',ft(g.whmod),'176 модулів; маса рейок і притисків не вказана'],['Накопичувачі','3 × 1 205 = 3 615 кВт·год','3 × Golen LES-H20, 570 000 $ FOB; УЗЕ разом '+nf(BS.cost.tot)+' $'],
    ['Станція під ключ, з ПДВ',nf(pl.cn.price)+' / '+nf(pl.ua.price)+' $','матеріали з Китаю / з України']],
    note:'Маси без паспорта (шпильки, притиски, MC4, щити у зборі, лотки, міні-рейки) у підсумок не входять. Том 3 КМ: на даху цеху з модулями 152,9 т (на 1 773 модулі, без рам щитів і опор лотків).'}; }
function sumRP(T){ const t=T.T, g=massBy(T,t), roof=g.blk+g.met+g.mod;
  return {title:'Вінницький проєкт',rows:[['Панелі','1 440','1 260 цех + 180 склад, Shinefar 710 Вт'],['Потужність','1 022,4 кВтп',''],['Генерація за рік',nf(YEAR.tot.rp/1000,1)+' МВт·год','та сама модель двійника; у PVsyst РП — 1 182,8 (невідповідність 6)'],
    ['Баласт на даху цеху',ft(g.blk),'5 404 × 13 кг у 3D (мати — маса не вказана)'],['Метал',ft(g.met),'трикутники 6,73 кг, сполучники 1,60 кг (наша 3D-модель), щогли M-04/40 47,5 кг'],['Модулі на цеху',ft(g.mod),'1 260 × 33,8 кг'],
    ['Разом на дах цеху',ft(roof),nf(roof/AREA,1)+' кг/м² у плані ('+nf(AREA,0)+' м²)'],['Склад',ft(g.whmod),'180 модулів; кріплення RUDNIK — маса не вказана'],['Накопичувачі','15 × 261 = 3 915 кВт·год','3 × FFD 500 кВт + 15 × Galaxy261L (40,2 т); шафи ≈32,3 млн грн ≈ '+nf(Math.round(32.3e6/UAH))+' $'],
    ['Кошторис РП','106 591 тис. грн','з ПДВ, ціни на 27.03.2026 ≈ '+nf(Math.round(106591e3/UAH))+' $']],
    note:'Маси без паспорта (спойлери, притиски, шурупи R-LX, мати, щогли 6 м, шафи FFD) у підсумок не входять. Невідповідності — розділ «Невідповідності».'}; }

// ================= стан, кадр, інтерфейс
function cur(){ return MT.T; }
function setAll(t){ const T=cur(); T.acts.forEach(a=>a.set(t)); }
function samplesAt(t){ return cur().samp.find(s=>t>=s.t0&&t<=s.t1)||null; }
function capAt(t){ const C=cur().caps; let c=C[0]; for(const x of C) if(x.t<=t+1e-6) c=x; return c?c.txt:''; }
function warnAt(t){ return cur().warn.find(w=>t>=w.t0&&t<w.t1)||null; }
function musAt(t){ const M=cur().mus; let m='calm'; for(const x of M) if(x.t<=t) m=x.m; return m; }

function enter(){ const P=state.proj; MT.active=true; MT.proj=P;
  if(P==='rp'){ RPM_.cur.forEach(i=>RPM_.lod.forEach(im=>im.setMatrixAt(i,RT[i].F))); RPM_.curC.forEach(j=>RPM_.con.setMatrixAt(j,CON[j].M)); RPM_.det.concat(RPM_.detC).forEach(im=>{ im.count=0; im.instanceMatrix.needsUpdate=true; }); RPM_.lod.forEach(im=>im.instanceMatrix.needsUpdate=true); RPM_.con.instanceMatrix.needsUpdate=true; RPM_.cur=[]; RPM_.curC=[]; }
  const T=MT.tls[P]||(MT.tls[P]=P==='ours'?buildOurs():buildRP()); MT.T=T;
  T.prep.forEach(f=>f()); T.acts.forEach(a=>a.bind&&a.bind());
  MTG.visible=true; Object.values(MT.tls).forEach(x=>x.root.visible=x===T); T.samp.forEach(s=>s.g&&(s.g.visible=false));
  MTG.children.forEach(o=>{ if(o.isInstancedMesh) o.visible=P==='ours'; });
  MT.t=Math.min(MT.tp[P]||0,T.T); MT.dirty=true; MT.stageIx=-1; MT.paneKey=''; MT.sumClosed=false; MT.blend={t0:performance.now(),p:camera.position.clone(),c:controls.target.clone()};
  UI.bar.hidden=false; const sr=document.querySelector('.sunrow'); if(sr) sr.hidden=true; setAll(MT.t); pane(true); ui(true);
  try{ localStorage.setItem('antares-mt-on','1'); }catch(e){} need=true; }
function leave(){ MT.tp[MT.proj]=MT.t; if(MT.play) setPlayM(false); MT.active=false; regRestore(); MTG.visible=false; SAMPT.visible=false;
  [UI.bar,UI.lab,UI.info,UI.warn,UI.tag,UI.sum].forEach(e=>e.hidden=true); const sr=document.querySelector('.sunrow'); if(sr) sr.hidden=false; MT.warnId=null; MT.sample=null; clearLabels(); try{ localStorage.removeItem('antares-mt-on'); }catch(e){} need=true; }

function setPlayM(on){ if(on&&MT.t>=cur().T-0.05){ MT.t=0; MT.dirty=true; MT.sumClosed=false; } MT.play=on; UI.play.textContent=on?'❚❚':'▶'; UI.play.setAttribute('aria-label',on?'Пауза':'Пуск монтажу'); UI.play.title=on?'Пауза':'Пуск';
  MT.last=performance.now(); sndPlaying(on); if(on) sndMode(musAt(MT.t)); }
function jump(t){ MT.t=Math.max(0,Math.min(cur().T,t)); MT.dirty=true; MT.sumClosed=false; if(MT.free){} need=true; }
UI.play.onclick=()=>setPlayM(!MT.play);
UI.spd.onclick=()=>{ MT.spd=SPDS[(SPDS.indexOf(MT.spd)+1)%SPDS.length]; UI.spd.textContent='×'+MT.spd; };
UI.prev.onclick=()=>{ const T=cur(), s=T.stageAt(MT.t); const i=s.no-(MT.t-s.t0<1.5?1:0); jump(T.st[Math.max(0,i)].t0+0.01); };
UI.next.onclick=()=>{ const T=cur(), s=T.stageAt(MT.t), n=T.st[s.no+1]; if(n) jump(n.t0+0.01); };
UI.pos.oninput=()=>jump(+UI.pos.value/1000*cur().T);
UI.cam.onclick=()=>{ MT.free=!MT.free; if(!MT.free) MT.blend={t0:performance.now(),p:camera.position.clone(),c:controls.target.clone()}; UI.cam.setAttribute('aria-pressed',String(!MT.free)); };
UI.snd.onclick=()=>{ SND.on=!SND.on; UI.snd.setAttribute('aria-pressed',String(SND.on)); if(SND.on&&MT.play) sndPlaying(true); sndMix(false); sndSave(); };
UI.snd.setAttribute('aria-pressed',String(SND.on));
UI.vol.oninput=()=>{ SND.vol=+UI.vol.value/100; sndMix(true); sndSave(); };
controls.addEventListener('start',()=>{ if(MT.active&&!MT.free){ MT.free=true; UI.cam.setAttribute('aria-pressed','false'); } });
window.addEventListener('keydown',e=>{ if(!MT.active||e.target.closest&&e.target.closest('input,textarea,select')) return; if(e.code==='Space'&&!(e.target.closest&&e.target.closest('button'))){ e.preventDefault(); setPlayM(!MT.play); } });

// ---------- підписи зразка: колонка справа з виносками (комп'ютер) або номери біля деталей (телефон)
let LABS=[];
function clearLabels(){ LABS.forEach(l=>l.el.remove()); LABS=[]; UI.svg.innerHTML=''; UI.lab.hidden=true; }
function makeLabels(s){ clearLabels(); const ph=!wide(); let n=0; s.parts.forEach(p=>{ if(!p.nm) return; n++; const el=document.createElement('div');
    const tot=p.m!=null&&typeof p.q==='number'?ft(p.m*p.q):''; const q=p.qs||(p.q!==''&&p.q!=null?fq(p.q):'');
    if(ph){ el.className='mtn'; el.textContent=n; } else el.className='mtx', el.innerHTML=`<b>${n}</b><span><span class="nm">${esc(p.nm)}</span>${p.sz?`<em>${esc(p.sz)}</em>`:''}${(p.m!=null||q)?`<i>${p.m!=null?fm(p.m):'маса —'}${q?' × '+esc(q):''}${tot?' = '+tot:''}</i>`:''}</span>`;
    UI.lab.appendChild(el); LABS.push({el,p,n,w:0,h:0}); });
  UI.lab.hidden=false; LABS.forEach(l=>{ l.w=l.el.offsetWidth; l.h=l.el.offsetHeight; }); }
function placeLabels(s,t){ if(!LABS.length) return; const on=s.on(t), r=canvas.getBoundingClientRect(), Wd=r.width, Ht=r.height; UI.lab.style.opacity=on?'1':'0'; if(!on) return;
  s.g.updateMatrixWorld(true); const pts=LABS.map(l=>{ const o=l.p.o, b=new THREE.Box3().setFromObject(o); const c=b.isEmpty()?o.getWorldPosition(V(0,0,0)):b.getCenter(V(0,0,0)); const v=c.project(camera), x=(v.x+1)/2*Wd, y=(1-v.y)/2*Ht, ok=v.z<1&&isFinite(x)&&isFinite(y); return {l,x:ok?x:Wd*0.4,y:ok?y:Ht*0.4,ok}; });
  if(!wide()){ pts.forEach(q=>{ q.l.el.style.transform=`translate(${q.x}px,${q.y}px)`; q.l.el.style.display=q.ok?'':'none'; }); UI.svg.innerHTML=''; return; }
  const colW=Math.max(...LABS.map(l=>l.w)), X0=Wd-colW-14, top=64, bot=Math.max(top+40,Ht-(UI.bar.offsetHeight+22)); const ord=pts.slice().sort((a,b)=>a.y-b.y);
  const gap=6, tot=ord.reduce((s,q)=>s+q.l.h,0)+gap*(ord.length-1); let y=top;
  if(tot>=bot-top) ord.forEach(q=>{ q.ly=y; y+=q.l.h+gap; });
  else { ord.forEach(q=>{ q.ly=Math.max(y,q.y-q.l.h/2); y=q.ly+q.l.h+gap; }); let lim=bot; for(let i=ord.length-1;i>=0;i--){ ord[i].ly=Math.min(ord[i].ly,lim-ord[i].l.h); lim=ord[i].ly-gap; } if(ord[0].ly<top){ const d=top-ord[0].ly; ord.forEach(q=>q.ly+=d); } }
  let svg=''; ord.forEach(q=>{ q.l.el.style.transform=`translate(${X0}px,${Math.max(top,q.ly)}px)`; const ly=Math.max(top,q.ly)+9; if(q.ok) svg+=`<path d="M${q.x.toFixed(1)},${q.y.toFixed(1)} L${(X0-22).toFixed(1)},${ly.toFixed(1)} L${(X0-2).toFixed(1)},${ly.toFixed(1)}"/><circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="2.4"/>`; });
  UI.svg.innerHTML=svg; }
function placeTag(t){ const T=cur(), g=T.tags.find(x=>t>=x.t0&&t<x.t1); if(!g){ UI.tag.hidden=true; return; } const r=canvas.getBoundingClientRect(), v=g.p.clone().project(camera);
  if(v.z>1){ UI.tag.hidden=true; return; } UI.tag.hidden=false; if(UI.tag.textContent!==g.txt) UI.tag.textContent=g.txt; UI.tag.style.transform=`translate(${((v.x+1)/2*r.width+8).toFixed(1)}px,${((1-v.y)/2*r.height-30).toFixed(1)}px)`; }

// ---------- кадр анімації
function tick(now){ requestAnimationFrame(tick); MT.fr=(MT.fr||0)+1; if(!MT.active) return; const T=cur(), dt=Math.min(0.1,Math.max(0,(now-MT.last)/1000)); MT.last=now;
  if(MT.play){ const sp=T.isSlow(MT.t)?1:MT.spd, st0=T.stageAt(MT.t); MT.t=Math.min(T.T,MT.t+dt*sp); MT.dirty=true; if(T.stageAt(MT.t)!==st0) sndSting(); if(MT.t>=T.T){ setPlayM(false); } else sndMode(musAt(MT.t)); }
  const t=MT.t; if(MT.dirty){ setAll(t); MT.dirty=false; need=true; }
  const s=samplesAt(t); SAMPT.visible=!!(s&&s.def.table!==false&&t>=s.t0&&t<=s.t1); if(s!==MT.sample){ MT.sample=s; if(s) makeLabels(s); else clearLabels(); MT.paneKey=''; }
  if(!MT.free){ const v=camAt(T,t); if(v){ if(MT.blend){ const k=c01((now-MT.blend.t0)/1100), e=smooth(k); v.p.copy(MT.blend.p.clone().lerp(v.p,e)); v.c.copy(MT.blend.c.clone().lerp(v.c,e)); if(k>=1) MT.blend=null; }
      if(camera.position.distanceToSquared(v.p)>1e-8||controls.target.distanceToSquared(v.c)>1e-8){ camera.position.copy(v.p); controls.target.copy(v.c); need=true; } } }
  if(s){ placeLabels(s,t); need=true; } placeTag(t); if(MT.play||s) need=true;
  if(now-MT.uiT>120){ MT.uiT=now; ui(false); } }
requestAnimationFrame(tick);

function ui(force){ const T=cur(), t=MT.t, st=T.stageAt(t);
  UI.T.innerHTML=`<em>${st.no+1} / ${T.st.length}</em>${esc(st.title)}`; const c=capAt(t); if(UI.S.textContent!==c) UI.S.textContent=c;
  UI.pos.value=String(Math.round(t/T.T*1000)); UI.clock.innerHTML=fmtT(t)+'<small> / '+fmtT(T.T)+'</small>';
  // підказка зразка
  const s=MT.sample; if(s&&s.def.info&&s.on(t)&&!warnAt(t)){ const h=`<b>${esc(s.def.title)}</b>`+s.def.info.map(x=>`<div>${esc(x)}</div>`).join(''); if(UI.info.innerHTML!==h) UI.info.innerHTML=h; UI.info.hidden=false; } else UI.info.hidden=true;
  // невідповідність / примітка
  const w=warnAt(t), wid=w?(w.id||w.t):null; if(wid!==MT.warnId){ MT.warnId=wid;
    if(w){ UI.warn.className='mtwarn'+(w.inf?' inf':'')+(MT.sample&&MT.sample.on(t)?' low':''); UI.warn.innerHTML=`<b>${w.inf?'ℹ ':'⚠ '}${w.n?`Невідповідність ${w.n} з ${MIS.length}. `:''}${esc(w.t)}</b><span>${esc(w.d||'')}</span>`; UI.warn.hidden=false; } else UI.warn.hidden=true;
    if(MT.proj==='rp'){ MARKS.children.forEach(o=>o.visible=false); if(w&&w.n){ const i=w.n-1; if(MARKS.children[i*2]){ MARKS.children[i*2].visible=true; MARKS.children[i*2+1].visible=true; } } misPaint(w&&w.paint?w.paint:null); need=true; } }
  // лічильники в легенді
  const lg=$('#legend'), cs=st.cnt.slice(0,4); const mass=massBy(T,t), mroof=mass.blk+mass.met+mass.mod+mass.el;
  let h=`<span class="t">${esc(st.title)}</span>`+cs.map(c=>`<span>${esc(c.nm)}: <b class="num">${fq(c.n(t))}</b> / ${fq(c.tot)}${c.unit&&c.unit!=='шт'?' '+esc(c.unit):''}</span>`).join('')+(mroof>0?`<span>На даху цеху: <b class="num">${ft(mroof)}</b></span>`:'');
  if(lg.innerHTML!==h){ lg.innerHTML=h; } lg.hidden=false; $('#modes').hidden=true;
  // підсумок
  const sumOn=st.id==='sum'&&t>=st.t0+1.6&&!MT.sumClosed; if(sumOn&&UI.sum.hidden){ const S=T.sum(); UI.sum.innerHTML=`<button type="button" class="x" aria-label="Закрити">×</button><h2>Підсумок · ${esc(S.title)}</h2><table class="cmp"><tbody>${S.rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td style="text-align:left;font-family:var(--font);color:var(--ink-3)">${esc(r[2])}</td></tr>`).join('')}</tbody></table><p class="src">${esc(S.note)}</p>`;
    UI.sum.querySelector('.x').onclick=()=>{ MT.sumClosed=true; UI.sum.hidden=true; }; UI.sum.hidden=false; } else if(!sumOn) UI.sum.hidden=true;
  if(st.no!==MT.stageIx){ MT.stageIx=st.no; MT.paneKey=''; } pane(force); }

// ---------- нижня панель розділу
function pane(force){ if(state.sec!=='bud') return; const T=cur(), t=MT.t, st=T.stageAt(t), s=MT.sample, key=T.proj+'|'+st.no+'|'+(s?T.samp.indexOf(s):-1); const P=$('#pane');
  if(force||MT.paneKey!==key||!P.querySelector('.mtq')){ MT.paneKey=key; const rp=T.proj==='rp';
    const sm=s||T.samp.filter(x=>x.t0>=st.t0&&x.t0<(st.t1??1e9))[0];
    P.innerHTML=`<div class="ph"><span class="eyebrow ${rp?'rp':'ours'}">${rp?'Вінницький проєкт · РП 2025/12-07':'Наш варіант Б · E-Systems'} · Будівництво</span><h2>Монтаж по кроках: ${T.st.length} етапів, ${fmtT(T.T)} при ×1</h2><p>▶ і повзунок — на панелі під моделлю; швидкість ×1 / ×2 / ×5 — для розкладання, зразки йдуть повільно. Торкання моделі — вільна камера, «Камера» — повернути.</p></div>`
     +`<div class="blk"><h3>Етапи</h3><ol class="mtst">${T.st.map(x=>`<li><button type="button" data-mst="${x.no}" ${x===st?'aria-current="true"':''} class="${t>=(x.t1??1e9)?'done':''}"><em>${x.no+1}</em><span>${esc(x.title)}</span><small>${fmtT(x.t0)}</small></button></li>`).join('')}</ol></div>`
     +`<div class="blk"><h3>${esc(st.title)}</h3><p class="src" style="margin:0 0 6px">${esc(st.lead||'')}</p>${sm?`<table class="cmp mtq"><thead><tr><th>Зразок: ${esc(sm.def.title)}</th><th>Маса</th><th>К-сть</th><th>Разом</th></tr></thead><tbody>${sm.parts.filter(p=>p.nm).map((p,i)=>`<tr><td><b class="num">${i+1}.</b> ${esc(p.nm)}${p.sz?`<br><small>${esc(p.sz)}</small>`:''}</td><td>${fm(p.m)}</td><td>${esc(p.qs||fq(p.q??''))}</td><td>${p.m!=null&&typeof p.q==='number'?ft(p.m*p.q):'—'}</td></tr>`).join('')}</tbody></table>${(sm.def.info||[]).map(x=>`<p class="src" style="margin:4px 0 0">${esc(x)}</p>`).join('')}`:'<table class="cmp mtq" hidden></table>'}</div>`
     +`<div class="blk"><h3>Змонтовано</h3><table class="cmp mtq"><thead><tr><th>Елемент</th><th>Є / усього</th><th>Маса</th></tr></thead><tbody>${T.cnt.map((c,i)=>`<tr data-ci="${i}"><td>${esc(c.nm)}${c.note?`<br><small>${esc(c.note)}</small>`:''}</td><td class="n" data-cn="${i}"></td><td data-cm="${i}"></td></tr>`).join('')}</tbody></table>`
     +`<p class="src">${rp?'Кількості — з 3D двійника (оцифровка плану РП) і специфікації РП; маси — з паспортів виробників, де знайдено (каталог FS, ffdpower.com, enfsolar), трикутник і сполучник — з нашої 3D-моделі. Розташування кріплення складу RUDNIK у РП немає.':'Кількості — Том 3 КМ (25.10), розрахунок стрінгів і щитів (26.10), дані лотків (26.10), розрахунок складу (26.10, ред. 2), Том 7, Том 8. Маси метизів — dinmark.com.ua; без маси — чого немає в паспортах. Притиски після кожної панелі — прийнято (власник не уточнив); кріплення 3 щитів на складі не визначено.'}</p></div>`;
    P.querySelectorAll('[data-mst]').forEach(b=>b.onclick=()=>{ jump(T.st[+b.dataset.mst].t0+0.01); }); }
  T.cnt.forEach((c,i)=>{ const a=P.querySelector(`[data-cn="${i}"]`), b=P.querySelector(`[data-cm="${i}"]`); if(!a) return; const n=c.n(t), tx=`${fq(n)} / ${fq(c.tot)}${c.unit&&c.unit!=='шт'?' '+c.unit:''}`; if(a.textContent!==tx) a.textContent=tx;
    const m=c.mf?c.mf():c.m!=null?c.m*n:null, mt=m==null?'—':ft(m); if(b.textContent!==mt) b.textContent=mt; const tr=a.parentElement, on=c.st===st.id; if(tr.classList.contains('cur')!==on) tr.classList.toggle('cur',on); }); }

// ================= підключення розділу «Будівництво» до двійника
// r128 не перемикає програму між InstancedMesh з instanceColor і без: щити з кольором контейнера — окремий матеріал (інакше після «Електрики» падають ПЗІП і контрольні з'єднання на MAT.cab)
if(EP&&EP.box) EP.box.material=EP.box.material.clone();
{ const b=SECS.find(x=>x[0]==='bud'); if(b) b[2]=1; ONSECS.length=0; SECS.filter(x=>x[2]).forEach(x=>ONSECS.push(x[0]));
  const tb=document.querySelector('#tabs button[data-s="bud"]'); if(tb){ tb.disabled=false; tb.removeAttribute('title'); } }
const apply0=apply; apply=function(){ const go=MT.play||MT.auto; MT.auto=false; if(MT.active) leave(); apply0(); if(state.sec==='bud'){ enter(); if(go) setPlayM(true); } };
// натискання вкладки «Будівництво» — це жест користувача: одразу пуск (і музика, якщо ввімкнена)
{ const tb=document.querySelector('#tabs button[data-s="bud"]'); if(tb) tb.addEventListener('click',()=>{ if(state.sec!=='bud') MT.auto=true; },true); }
const rpDetail0=rpDetail; rpDetail=function(){ if(state.sec==='bud') return; rpDetail0(); };
{ let on=false; try{ on=localStorage.getItem('antares-mt-on')==='1'; }catch(e){} if((location.hash||'')==='#bud'||on){ state.sec='bud'; apply(); } }
window.__twin.apply=apply; window.__twin.mt={MT,jump:t=>{ jump(t); setAll(MT.t); },play:setPlayM,cur,SND,whLayout,stages:()=>cur().st.map(s=>[s.id,s.t0,s.t1]),count:()=>cur().cnt.map(c=>[c.nm,c.n(MT.t),c.tot]),camAt:t=>{ const v=camAt(cur(),t); return v&&[v.p.toArray(),v.c.toArray()]; },keys:()=>cur().cams.map(k=>[k.t,!!k.v.fn])};
}
