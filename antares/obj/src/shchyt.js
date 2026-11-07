// ================= «Електрика → Щити PV»: щити на моделі з підписами і окреме вікно «щит у 3D» (src/shchyt.js, 07.11.2026)
// Власник 07.11: «коли я стаю на щитах — вони повинні з'явитися, їхня кількість… деталізовані, і внутрішнє… розміри… в окремому екранчику,
// можна його сховати — хрест»; «узгодь ящики по розміру за обладнанням та перетином кабеля, там ще повинно бути маркування; клеми та конектори».
// Компоновка — calc/ep04/shchyt_pv.py → shchytdata.js (креслення «Креслення_компоновки_щита_PV_7-1_Антарес.pdf»): корпус 600 × 500 × 200,
// 24 апарати за паспортами еталонних, 20 отворів знизу, клеми, роз'єми, провідники, маркування; 44 щити — вхід контейнера, вільні входи, лінія.
// Вікно: обертання і масштаб пальцем / мишею; двері, розбір, вид знизу; під 3D — входи зі стрінгами, склад, низ корпусу, маркування цього щита.
// Вікно — загальне (T_.win): те саме віконце далі для лотків.
{ const T_=window.__twin, E4m=T_.elec04, M5m=T_.menu5, EWm=T_.elecwa;
if(T_.clean&&E4m&&M5m&&typeof SHCH!=='undefined'){
const SH=SHCH, BXD={}, E4B={}; SH.boxes.forEach(b=>BXD[b.id]=b); E4m.E4.boxes.forEach(b=>E4B[b.id]=b);
const KCOL={'K-1':0xc0392b,'K-3':0xe67e22,'K-4':0x7b5bd6,'K-5':0x1aa3b4}, KN=k=>String(k).replace('K','К'), TPN={'K-1':'ТП-5913','K-3':'ТП-5913','K-4':'ТП-6923','K-5':'ТП-6923'};
const hx=c=>'#'+new THREE.Color(c).getHexString(), pl=(n,a,b,c)=>{ const d=n%10,h=n%100; return d===1&&h!==11?a:d>=2&&d<=4&&(h<12||h>14)?b:c; };
const strW=n=>pl(n,'стрінг','стрінги','стрінгів'), f1=v=>nf(v,v%1?1:0), dim=a=>`${f1(a.w)} × ${f1(a.h)} × ${f1(a.d)}`;
const stOn=st=>state.lay.stg==='all'||String(st)===state.lay.stg;
const visUp=o=>{ for(let x=o;x;x=x.parent) if(x.visible===false) return false; return true; };
const strOf=id=>{ const B=EWm&&EWm.BX&&EWm.BX[id]; return B&&B.ss?B.ss.slice().sort((p,q)=>String(p.id).localeCompare(String(q.id),'uk',{numeric:true})):[]; };

// ---------- щити на моделі: меш щита з шару elec04 → номер щита
const BOXO=new Map(), BPOS={};
E4m.g.updateMatrixWorld(true);
E4m.g.traverse(o=>{ const inf=o.userData&&o.userData.info; if(!o.isMesh||!inf||typeof inf!=='object'||!inf.t||!/щит PV/.test(inf.t)) return; const id=inf.t.split(' ')[0]; if(!BXD[id]) return; BOXO.set(o,id); if(!BPOS[id]) BPOS[id]=o; });
// ---------- підписи над щитами: номер, стрінги, вхід контейнера (лише в «Щити PV»)
function tagTex(l1,l2,col){ const h=150, c=document.createElement('canvas'), x=c.getContext('2d'), F1='700 60px system-ui,sans-serif', F2='500 40px system-ui,sans-serif';
  x.font=F1; let w=x.measureText(l1).width; x.font=F2; w=Math.ceil(Math.max(w,x.measureText(l2).width)+76); c.width=w; c.height=h;
  x.fillStyle='rgba(255,255,255,0.97)'; x.fillRect(0,0,w,h); x.fillStyle=col; x.fillRect(0,0,26,h); x.strokeStyle=col; x.lineWidth=6; x.strokeRect(3,3,w-6,h-6);
  x.fillStyle='#1d2a33'; x.font=F1; x.textBaseline='top'; x.fillText(l1,48,12); x.font=F2; x.fillStyle='#3f4a52'; x.fillText(l2,48,86);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.userData={ar:w/h}; return t; }
function badgeTex(t,col){ const h=64, c=document.createElement('canvas'), x=c.getContext('2d'), F='700 40px system-ui,sans-serif'; x.font=F; const w=Math.ceil(x.measureText(t).width+44); c.width=w; c.height=h;
  x.fillStyle='rgba(255,255,255,0.97)'; x.fillRect(0,0,w,h); x.fillStyle=col; x.fillRect(0,0,12,h); x.strokeStyle=col; x.lineWidth=4; x.strokeRect(2,2,w-4,h-4); x.fillStyle='#1d2a33'; x.font=F; x.textBaseline='middle'; x.fillText(t,24,h/2+2);
  const tx=new THREE.CanvasTexture(c); tx.encoding=THREE.sRGBEncoding; tx.userData={ar:w/h}; return tx; }
const TG={1:new THREE.Group(),2:new THREE.Group()}; Object.values(TG).forEach(g=>{ g.visible=false; g.name='shchTags'; scene.add(g); });
const TAGS=[];
Object.entries(BPOS).forEach(([id,o])=>{ const b=BXD[id], e=E4B[id]||{}, p=o.getWorldPosition(new V3());
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTex(id,`${b.ns} ${strW(b.ns)} · ${KN(b.K)} вх. ${b.q}`,hx(KCOL[b.K]||0x52514e)),depthWrite:false,transparent:true}));
  const ar=sp.material.map.userData.ar, hh=0.7; sp.scale.set(hh*ar,hh,1); sp.renderOrder=21; sp.userData.shb=id;
  const below=e.z==='fac'&&!e.roof, wall=e.z==='wh'||e.z==='whn'||e.z==='abk'; sp.position.copy(p).add(new V3(0,below?-1.0:1.25,0)); if(below) sp.position.x+=0.5; if(wall) sp.position.z-=0.5;
  (TG[b.st]||TG[1]).add(sp); TAGS.push(sp);
  // здалеку — значок сталого розміру на екрані (≈22 px), щоб усі щити було видно й можна було перелічити; ближче 30 м — повний підпис
  const bd=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeTex(id,hx(KCOL[b.K]||0x52514e)),sizeAttenuation:false,depthWrite:false,transparent:true})); bd.position.copy(sp.position); bd.renderOrder=21; bd.userData.shb=id;
  const ab=bd.material.map.userData.ar; bd.onBeforeRender=function(r,s_,cam){ const H=r.domElement.clientHeight||800, k=cam.projectionMatrix.elements[5]||2, sy=44/(k*H); this.scale.set(sy*ab,sy,1); this.updateMatrixWorld();
    const d=cam.position.distanceTo(this.position), f=Math.min(1,Math.max(0,(d-26)/10)); this.material.opacity=f; sp.material.opacity=1-f; };
  (TG[b.st]||TG[1]).add(bd); TAGS.push(bd); });
// рамка вибраного щита
const SEL=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:0x2a78d6,depthTest:false,transparent:true,opacity:0.95}));
SEL.visible=false; SEL.renderOrder=22; scene.add(SEL);
function selBox(id){ const o=id&&BPOS[id]; if(!o){ SEL.visible=false; need=true; return; } const bb=new THREE.Box3().setFromObject(o); bb.getCenter(SEL.position); SEL.scale.copy(bb.getSize(new V3()).addScalar(0.16)); SEL.visible=true; need=true; }
function flyTo(id){ const o=BPOS[id], e=E4B[id]||{}; if(!o||typeof goTo!=='function') return; const c=o.getWorldPosition(new V3());
  const d=e.z==='wh'||e.z==='whn'||e.z==='abk'?[2.2,2.4,-6.5]:e.z==='fac'&&!e.roof?(e.f==='S'?[1.6,1.4,6.5]:[6.5,1.4,1.6]):[3.6,4.8,5.6];
  goTo({p:[c.x+d[0],c.y+d[1],c.z+d[2]],c:[c.x,c.y,c.z]}); }

// ================= вікно «щит у 3D»
const WIN={open:false,id:null,dirty:true,door:1,doorT:1,ex:0,exT:0,loop:false,cam:null};
const WD=document.createElement('div'); WD.id='shWin'; WD.hidden=true; WD.setAttribute('role','dialog'); WD.setAttribute('aria-label','Щит PV у 3D');
WD.innerHTML=`<div class="sw-h"><div><b class="sw-t"></b><small class="sw-s"></small></div><button type="button" class="sw-x" aria-label="Закрити" title="Закрити">✕</button></div>
<div class="sw-v"><canvas></canvas><div class="sw-b"><button type="button" data-a="door" aria-pressed="true">Двері відчинені</button><button type="button" data-a="ex" aria-pressed="false">Розібрати</button><button type="button" data-a="fr">Спереду</button><button type="button" data-a="bot">Знизу</button></div><div class="sw-g">потягніть — обертати · колесо / два пальці — масштаб</div></div>
<div class="sw-i"></div>`;
($('#view')||canvas.parentElement).appendChild(WD);
{ const st=document.createElement('style'); st.textContent=`#shWin{position:absolute;right:12px;top:8px;z-index:7;width:460px;max-height:calc(100% - 16px);display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.16);overflow:hidden}
#shWin[hidden]{display:none} #shWin .sw-h{display:flex;align-items:flex-start;gap:8px;padding:8px 8px 7px 12px;border-bottom:1px solid var(--line)} #shWin .sw-h>div{flex:1;min-width:0}
#shWin .sw-t{display:block;font-size:14px;color:var(--ink)} #shWin .sw-s{display:block;font-size:11.5px;color:var(--ink-3);line-height:1.35;margin-top:1px}
#shWin .sw-x{flex:none;width:34px;height:34px;border:1px solid var(--line);background:var(--surface-2);border-radius:8px;font-size:16px;line-height:1;color:var(--ink);cursor:pointer}
#shWin .sw-v{position:relative;flex:none;background:linear-gradient(#f1f3f5,#dde2e6)} @media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #shWin .sw-v{background:linear-gradient(#2a2d30,#1f2224)}} :root[data-theme="dark"] #shWin .sw-v{background:linear-gradient(#2a2d30,#1f2224)}
#shWin canvas{display:block;width:100%;height:300px;touch-action:none;cursor:grab} #shWin .sw-g{position:absolute;left:10px;top:6px;font-size:10.5px;color:var(--ink-3);pointer-events:none}
#shWin .sw-b{display:flex;gap:6px;flex-wrap:wrap;padding:6px 8px;border-bottom:1px solid var(--line);background:var(--surface)}
#shWin .sw-b button{font:inherit;font-size:12px;padding:5px 9px;border:1px solid var(--line-2);border-radius:7px;background:var(--surface);color:var(--ink);cursor:pointer}
#shWin .sw-b button[aria-pressed="true"]{border-color:var(--accent);color:var(--accent)}
#shWin .sw-i{overflow:auto;padding:8px 12px 14px;font-size:12.5px;line-height:1.45;color:var(--ink-2)} #shWin .sw-i h4{margin:12px 0 4px;font-size:12.5px;color:var(--ink)} #shWin .sw-i p{margin:4px 0}
#shWin .sw-k{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:2px 0 4px} #shWin .sw-k div{background:var(--surface-2);border-radius:8px;padding:5px 7px} #shWin .sw-k small{display:block;font-size:10.5px;color:var(--ink-3)} #shWin .sw-k b{font-size:13.5px;color:var(--ink)}
#shWin table{width:100%;border-collapse:collapse;font-size:12px} #shWin td,#shWin th{padding:3px 4px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top} #shWin th{font-weight:600;color:var(--ink-3);font-size:11px}
#shWin td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums} #shWin td.c{white-space:nowrap;color:var(--ink)} #shWin .ok{color:var(--ok,#2e8a57);font-weight:700} #shWin .fr{color:var(--ink-3)}
.m5p button.shb{font:inherit;font-weight:650;color:var(--accent);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:2px} .m5p tr.on td{background:color-mix(in srgb,var(--accent) 10%,transparent)}
@media(max-width:700px){#shWin{left:8px;right:8px;top:8px;width:auto;max-height:calc(100% - 16px)} #shWin canvas{height:220px} #shWin .sw-g{display:none} #shWin .sw-k{grid-template-columns:repeat(2,1fr)}}`; document.head.appendChild(st); }

let R=null, SS=null, SC=null, CT=null, BG=null, PARTS=null;
function init(){ const cv=WD.querySelector('canvas'); R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true}); R.setPixelRatio(Math.min(2,devicePixelRatio||1)); R.outputEncoding=THREE.sRGBEncoding;
  SS=new THREE.Scene(); SC=new THREE.PerspectiveCamera(30,1.5,0.01,20);
  SS.add(new THREE.HemisphereLight(0xffffff,0x9aa0a6,0.78)); const d1=new THREE.DirectionalLight(0xffffff,0.72); d1.position.set(1.2,1.7,2.3); SS.add(d1); const d2=new THREE.DirectionalLight(0xffffff,0.32); d2.position.set(-1.6,-0.8,1.1); SS.add(d2);
  CT=new THREE.OrbitControls(SC,cv); CT.enableDamping=true; CT.dampingFactor=0.14; CT.minDistance=0.22; CT.maxDistance=3.2; CT.rotateSpeed=0.8; CT.addEventListener('change',()=>{ WIN.dirty=true; });
  CT.addEventListener('start',()=>{ WIN.cam=null; }); }
function cvH(){ const cv=WD.querySelector('canvas'), V=WD.parentElement, ph=V.clientWidth<700, top=8, hd=WD.querySelector('.sw-h').offsetHeight||50;
  const av=V.clientHeight-top-8-hd-38-(ph?90:110); cv.style.height=Math.round(Math.max(ph?160:180,Math.min(ph?240:330,av)))+'px'; }
function fit(){ const cv=R.domElement, w=cv.clientWidth, h=cv.clientHeight; if(!w||!h) return; const pr=R.getPixelRatio(); if(cv.width!==Math.round(w*pr)||cv.height!==Math.round(h*pr)) R.setSize(w,h,false); if(Math.abs(SC.aspect-w/h)>1e-3){ SC.aspect=w/h; SC.updateProjectionMatrix(); } }
const VW={fr:[[0.58,0.16,1.24],[0.0,-0.04,0.0]],bot:[[0.48,-1.2,0.78],[0.0,-0.24,0.02]],ex:[[-0.8,0.42,1.38],[0.0,-0.03,0.08]]};
function view(k,now){ const v=VW[k]; if(now){ SC.position.set(...v[0]); CT.target.set(...v[1]); CT.update(); WIN.cam=null; } else WIN.cam={p0:SC.position.clone(),c0:CT.target.clone(),p1:new V3(...v[0]),c1:new V3(...v[1]),t:0}; WIN.dirty=true; }

// ---------- матеріали і геометрії (спільні для всіх щитів)
const mm=(c,o)=>std(lin(c),o||{});
const M={enc:mm(0xd2d5d1,{roughness:0.62}),gas:mm(0x232527,{roughness:0.9}),plate:mm(0xb3bac0,{metalness:0.5,roughness:0.42}),rail:mm(0xc9d0d6,{metalness:0.6,roughness:0.32}),
  fh:mm(0xe8eae6,{roughness:0.55}),fhC:mm(0xbfc3c0,{roughness:0.5}),fhE:mm(0xa3a8ac,{roughness:0.6,transparent:true,opacity:0.5}),red:mm(0xc8423b,{roughness:0.5}),blk:mm(0x2a2d30,{roughness:0.6}),
  spd:mm(0xdfe1dd,{roughness:0.5}),spdG:mm(0x9aa0a4,{roughness:0.6}),grn:mm(0x38a35a,{roughness:0.35}),mon:mm(0x4c5b69,{roughness:0.5}),lcd:mm(0x9fc7a3,{roughness:0.3}),
  cu:mm(0xb87333,{metalness:0.75,roughness:0.32}),brass:mm(0xc9a548,{metalness:0.7,roughness:0.35}),qs:mm(0x4d5359,{roughness:0.55}),qsC:mm(0x737a81,{roughness:0.5}),
  xt:mm(0x9aa1a7,{roughness:0.55}),xtO:mm(0xe39a2b,{roughness:0.5}),xtB:mm(0x3d7dd0,{roughness:0.5}),duct:mm(0x969da3,{roughness:0.7}),ductC:mm(0xb7bdc2,{roughness:0.65}),
  ye:mm(0xf0c419,{roughness:0.5}),pe:mm(0x3f9a4f,{roughness:0.5}),gy:mm(0x80888e,{roughness:0.6}),al:mm(0x1c1e21,{roughness:0.72}),lug:mm(0xc9c4b8,{metalness:0.72,roughness:0.3}),
  wR:mm(0xc8423b,{roughness:0.6}),wB:mm(0x2b2e31,{roughness:0.6}),wPE:mm(0x5aa63e,{roughness:0.6}),wRS:mm(0x8c9399,{roughness:0.6}),mc4:mm(0x1e2124,{roughness:0.5}),glnd:mm(0x2d3135,{roughness:0.6}),
  met:mm(0x8a9298,{metalness:0.55,roughness:0.4}),shR:mm(0xd2453d,{roughness:0.45}),shB:mm(0x3a3f45,{roughness:0.45})};
const BXG=new THREE.BoxGeometry(1,1,1), CYL=new THREE.CylinderGeometry(1,1,1,14), CYL6=new THREE.CylinderGeometry(1,1,1,6), SPH=new THREE.SphereGeometry(1,10,8), PLN=new THREE.PlaneGeometry(1,1);
const bx=(par,m,w,h,d,x,y,z)=>{ const o=new THREE.Mesh(BXG,m); o.scale.set(w,h,d); o.position.set(x,y,z); par.add(o); return o; };
const cy=(par,m,r,h,x,y,z,ax,g)=>{ const o=new THREE.Mesh(g||CYL,m); o.scale.set(r,h,r); o.position.set(x,y,z); if(ax==='z') o.rotation.x=Math.PI/2; if(ax==='x') o.rotation.z=Math.PI/2; par.add(o); return o; };
const _u=new V3(0,1,0);
function seg(par,m,r,a,b){ const d=new V3().subVectors(b,a), L=d.length(); if(L<1e-5) return; const o=new THREE.Mesh(CYL,m); o.scale.set(r,L,r); o.position.copy(a).addScaledVector(d,0.5); o.quaternion.setFromUnitVectors(_u,d.multiplyScalar(1/L)); par.add(o); }
function wire(par,m,r,pts){ for(let i=1;i<pts.length;i++) seg(par,m,r,pts[i-1],pts[i]); for(let i=1;i<pts.length-1;i++){ const s=new THREE.Mesh(SPH,m); s.scale.setScalar(r); s.position.copy(pts[i]); par.add(s); } }
const TEX=new Map();
function txt(lines,o){ o=o||{}; const w=o.w||256, h=o.h||64, key=lines.join('|')+'|'+w+'|'+h+'|'+(o.bg||'')+(o.fg||'')+(o.bd||''); if(TEX.has(key)) return TEX.get(key);
  const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.fillStyle=o.bg||'#fff'; x.fillRect(0,0,w,h);
  if(o.bd){ const lw=Math.max(3,h*0.04); x.strokeStyle=o.bd; x.lineWidth=lw; x.strokeRect(lw/2,lw/2,w-lw,h-lw); }
  x.fillStyle=o.fg||'#1d2a33'; x.textAlign='center'; x.textBaseline='middle'; const n=lines.length, lh=h/n;
  lines.forEach((l,i)=>{ let f=Math.floor(lh*(o.fs||0.62)); const wt=i===0&&o.b!==false?700:500; x.font=`${wt} ${f}px system-ui,sans-serif`; while(x.measureText(l).width>w*0.92&&f>6){ f--; x.font=`${wt} ${f}px system-ui,sans-serif`; } x.fillText(l,w/2,lh*(i+0.5)); });
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; TEX.set(key,t); return t; }
function warnTex(){ const key='warn'; if(TEX.has(key)) return TEX.get(key); const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.clearRect(0,0,128,128);
  x.fillStyle='#f2c40f'; x.strokeStyle='#1d1d1d'; x.lineWidth=8; x.lineJoin='round'; x.beginPath(); x.moveTo(64,8); x.lineTo(122,116); x.lineTo(6,116); x.closePath(); x.fill(); x.stroke();
  x.fillStyle='#1d1d1d'; x.beginPath(); x.moveTo(72,34); x.lineTo(46,80); x.lineTo(62,80); x.lineTo(54,104); x.lineTo(82,62); x.lineTo(66,62); x.lineTo(74,34); x.closePath(); x.fill();
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; TEX.set(key,t); return t; }
const plt=(par,tex,w,h,x,y,z,o)=>{ const m=new THREE.Mesh(PLN,new THREE.MeshBasicMaterial({map:tex,transparent:!!(o&&o.tr),toneMapped:false})); m.scale.set(w,h,1); m.position.set(x,y,z); if(o&&o.rx) m.rotation.x=o.rx; if(o&&o.rz) m.rotation.z=o.rz; par.add(m); return m; };

// ---------- модель одного щита: корпус, двері, панель, апарати, провідники, низ (роз'єми MC4, вводи, кабелі)
const EN=SH.enc, W_=EN.w/1000, H_=EN.h/1000, D_=EN.d/1000, OX=(EN.w-EN.plate[0])/2, OY=(EN.h-EN.plate[1])/2, PZ=EN.plate_z;
const P=(x,y,z)=>new V3(-W_/2+(OX+x)/1000,-H_/2+(OY+y)/1000,-D_/2+(PZ+z)/1000);   // панель: мм від лівого нижнього кута панелі, z — від площини панелі
const BT=(x,z)=>[-W_/2+x/1000,-D_/2+z/1000];                                       // низ: мм від лівого краю і від стіни
function model(id){ const b=BXD[id]||SH.boxes[0], ns=b.ns, G=new THREE.Group(), t=0.005, EXP=[];
  const enc=new THREE.Group(); G.add(enc);
  bx(enc,M.enc,W_,H_,t,0,0,-D_/2+t/2);
  [-1,1].forEach(s=>bx(enc,M.enc,t,H_,D_-0.008,s*(W_/2-t/2),0,-0.004)); [-1,1].forEach(s=>bx(enc,M.enc,W_,t,D_-0.008,0,s*(H_/2-t/2),-0.004));
  [-1,1].forEach(s=>bx(enc,M.gas,W_,0.006,0.004,0,s*(H_/2-0.003),D_/2-0.010)); [-1,1].forEach(s=>bx(enc,M.gas,0.006,H_,0.004,s*(W_/2-0.003),0,D_/2-0.010));
  [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sy])=>bx(enc,M.met,0.045,0.03,0.005,sx*(W_/2+0.018),sy*(H_/2-0.045),-D_/2+0.004));   // кріплення до рами / стіни
  // монтажна панель і DIN-рейки
  const pg=new THREE.Group(); G.add(pg); bx(pg,M.plate,EN.plate[0]/1000,EN.plate[1]/1000,0.003,0,0,-D_/2+(PZ-1.5)/1000);
  const A=SH.aps, apF=k=>A.filter(a=>a.k===k), span=L=>[Math.min(...L.map(a=>a.x))-6,Math.max(...L.map(a=>a.x+a.w))+6];
  const rail=(x0,x1,yc)=>{ const p=P((x0+x1)/2,yc,3.75); bx(pg,M.rail,(x1-x0)/1000,0.035,0.0075,p.x,p.y,p.z); };
  [A.filter(a=>a.k==='fh'&&a.id.endsWith('+')),A.filter(a=>a.k==='fh'&&!a.id.endsWith('+')),apF('spd'),apF('mon'),apF('xt')].forEach(L=>{ if(!L.length) return; const [x0,x1]=span(L); rail(x0,x1,L[0].y+L[0].h/2); });
  // апарати
  const AP={};
  A.forEach(a=>{ const g=new THREE.Group(); pg.add(g); const w=a.w/1000,h=a.h/1000,d=a.d/1000; g.position.copy(P(a.x+a.w/2,a.y+a.h/2,0)); AP[a.id]=g; let dz=0.14;
    if(a.k==='fh'){ const j=+a.id.slice(1,-1), pos=a.id.endsWith('+'), used=j<=ns;
      bx(g,M.fh,w,h,d*0.7,0,0,d*0.35); bx(g,used?M.fhC:M.fhE,w*0.88,h*0.52,d*0.3,0,h*0.06,d*0.85); bx(g,pos?M.red:M.blk,w*0.72,0.005,0.002,0,h/2-0.008,d*0.7+0.001);
      [h/2-0.006,-h/2+0.006].forEach(y=>cy(g,M.met,0.0028,0.002,0,y,d*0.7+0.001,'z')); plt(g,txt([a.id],{w:96,h:48}),w*0.86,0.010,0,-h/2+0.016,d*0.7+0.0015); dz=0.13; }
    else if(a.k==='spd'){ bx(g,M.spd,w,h,d*0.62,0,0,d*0.31); [-1,0,1].forEach(i=>{ bx(g,M.spd,w/3-0.0012,h*0.6,d*0.38,i*w/3,0,d*0.81); bx(g,M.grn,w/3*0.55,0.008,0.002,i*w/3,h*0.18,d+0.001); });
      plt(g,txt(['FV1']),0.03,0.012,0,-h/2+0.014,d*0.62+0.0015); dz=0.16; }
    else if(a.k==='mon'){ bx(g,M.mon,w,h,d,0,0,d/2); for(let i=0;i<8;i++) cy(g,M.blk,0.0045,0.004,-w/2+0.02+i*0.022,0,d+0.001,'z'); bx(g,M.lcd,0.03,0.014,0.002,w/2-0.03,0,d+0.001);
      plt(g,txt([`A1 · адр. ${b.q}`]),0.036,0.009,w/2-0.03,-h/2+0.002,d+0.0015); dz=0.2; }
    else if(a.k==='bus'){ const pos=a.id==='W+'; [-1,1].forEach(s=>cy(g,pos?M.red:M.blk,0.008,d-0.005,s*(w/2-0.018),0,(d-0.005)/2,'z')); bx(g,M.cu,w,h,0.005,0,0,d-0.0025);
      for(let i=0;i<8;i++) cy(g,M.met,0.0035,0.003,-w/2+0.03+i*0.027,0,d+0.0005,'z'); bx(g,pos?M.red:M.blk,0.02,h+0.001,0.0055,w/2-0.012,0,d-0.0025); plt(g,txt([a.id]),0.018,0.009,-w/2+0.014,h/2+0.008,0.012); dz=0.06; }
    else if(a.k==='qs'){ bx(g,M.qs,w,h*0.7,d,0,0,d/2); [-1,1].forEach(s=>bx(g,M.qsC,w*0.92,h*0.15,d*0.8,0,s*h*0.425,d*0.4)); bx(g,M.met,0.01,0.01,0.05,0,0,d+0.025);
      plt(g,txt(['QS1','250 А · 1000 В DC'],{w:256,h:96}),0.06,0.022,0,-h*0.2,d+0.0015); dz=0.24; }
    else if(a.k==='xt'){ const n=Math.max(2,Math.round(a.w/6)); for(let i=0;i<n;i++){ bx(g,M.xt,0.0055,h,d,-w/2+0.003+i*0.006,0,d/2); bx(g,i%2?M.xtB:M.xtO,0.0045,0.006,0.002,-w/2+0.003+i*0.006,h/2-0.01,d+0.001); }
      plt(g,txt([a.id]),Math.min(0.03,w*0.9),0.009,0,-h/2-0.008,0.002); dz=0.1; }
    else if(a.k==='pe'){ [-1,1].forEach(s=>cy(g,M.pe,0.008,d-0.006,s*(w/2-0.015),0,(d-0.006)/2,'z')); bx(g,M.brass,w,h,0.006,0,0,d-0.003); for(let i=0;i<7;i++) cy(g,M.met,0.0032,0.004,-w/2+0.012+i*0.019,0,d+0.001,'z');
      plt(g,txt(['PE'],{bg:'#3f9a4f',fg:'#fff'}),0.018,0.01,w/2+0.014,0,0.002); dz=0.06; }
    else if(a.k==='duct'){ bx(g,M.duct,w,h,d*0.9,0,0,d*0.45); bx(g,M.ductC,w+0.002,h+0.002,0.004,0,0,d*0.9+0.002); for(let i=0;i<Math.floor(a.w/14);i++) [-1,1].forEach(s=>bx(g,M.gas,0.004,0.002,d*0.6,-w/2+0.008+i*0.014,s*(h/2+0.0006),d*0.42)); dz=0.03; }
    EXP.push([g,g.position.z,dz]); });
  // провідники (у розборі ховаються)
  const WR=new THREE.Group(); G.add(WR);
  const gl=k=>SH.gl.find(g=>g.id===k), fx=(j,pos)=>{ const a=A.find(q=>q.id===`F${j}${pos?'+':'−'}`); return a.x+a.w/2; };
  for(let j=1;j<=7;j++){ const sp=gl(`XS${j}+`), sm=gl(`XS${j}−`), xp=sp.x-OX, zp=sp.z-PZ, xm=sm.x-OX, zm=sm.z-PZ, mx=7+(j-1)*1.7, cx=fx(j,true), cxm=fx(j,false);
    wire(WR,M.wR,0.0021,[P(xp,-8,zp),P(xp,64,zp),P(xp,88,24),P(18,88,24),P(mx,96,12),P(mx,414+j*1.3,12),P(cx,414+j*1.3,26),P(cx,405,34)]);
    wire(WR,M.wB,0.0021,[P(xm,-8,zm),P(xm,64,zm),P(xm,98,30),P(18,98,30),P(mx+1,104,20),P(mx+1,238+j*0.8,20),P(cxm,238+j*0.8,26),P(cxm,219,34)]);
    wire(WR,M.wR,0.0026,[P(cx,332,30),P(cx,307,30),P(cx,282,33)]); wire(WR,M.wB,0.0026,[P(cxm,146,30),P(cxm,136,33)]); }
  const qs=A.find(a=>a.id==='QS1'), g1=gl('G1'), g2=gl('G2'), x1=g1.x-OX, x2=g2.x-OX, qT=qs.y+qs.h, qB=qs.y;
  wire(WR,M.cu,0.0052,[P(288,272,33),P(298,272,33),P(298,442,40),P(x1,442,52),P(x1,qT+6,62)]); wire(WR,M.cu,0.0052,[P(288,126,33),P(362,126,40),P(362,334,64),P(x2,334,68),P(x2,qT+6,68)]);
  [[x1,M.shR],[x2,M.shB]].forEach(([x,m])=>{ const p=P(x,qT+3,64); bx(WR,M.lug,0.014,0.016,0.006,p.x,p.y,p.z); });
  wire(WR,M.wR,0.0034,[P(312,320,38),P(312,292,38),P(287,292,36),P(287,283,36)]); wire(WR,M.wB,0.0034,[P(326,320,40),P(326,142,32),P(286,142,32),P(286,137,33)]);
  wire(WR,M.wPE,0.0034,[P(342,320,42),P(346,300,30),P(346,46,22),P(271,46,22)]);
  const g3=gl('G3'), g4=gl('G4'), g5=gl('G5');
  wire(WR,M.wPE,0.0042,[P(g3.x-OX,-8,g3.z-PZ),P(g3.x-OX,30,40),P(272,42,26)]);
  [[g4,64],[g5,70]].forEach(([g,xt],i)=>wire(WR,M.wRS,0.0028,[P(g.x-OX,-8,g.z-PZ),P(g.x-OX,62,60),P(g.x-OX-10,92+i*4,22),P(xt,92+i*4,22),P(xt,70,40)]));
  wire(WR,M.wRS,0.0022,[P(50,70,38),P(50,90,22),P(30,90,22),P(30,307,22),P(38,307,30)]);
  const od=(b.od||20)/2000;
  [[x1,M.shR,'+'],[x2,M.shB,'−']].forEach(([x,m])=>{ wire(WR,M.al,od,[P(x,-10,g1.z-PZ),P(x,qB-46,64),P(x,qB-14,62)]); const s=P(x,qB-34,62); cy(WR,m,od*1.12,0.03,s.x,s.y,s.z); const l=P(x,qB-6,62); cy(WR,M.lug,od*0.8,0.018,l.x,l.y,l.z); });
  // низ корпусу: роз'єми MC4, вводи, клапан, кабелі назовні; наклейки біля отворів
  const yb=-H_/2;
  SH.gl.forEach(g=>{ const [x,z]=BT(g.x,g.z);
    if(g.k==='mc4'){ const j=+g.id.slice(2,-1), pos=g.id.endsWith('+'), used=j<=ns;
      cy(enc,M.mc4,0.0095,0.004,x,yb+0.0045,z,null,CYL6); cy(enc,M.mc4,0.0078,0.026,x,yb-0.013,z); cy(enc,pos?M.red:M.blk,0.0082,0.003,x,yb-0.003,z);
      if(used){ cy(enc,M.mc4,0.0076,0.034,x,yb-0.043,z); cy(enc,M.wB,0.003,0.2,x,yb-0.16,z); cy(enc,pos?M.red:M.gy,0.0034,0.014,x,yb-0.075,z); }
      else cy(enc,M.gy,0.0084,0.012,x,yb-0.031,z);
      plt(enc,txt([`${j}${pos?'+':'−'}`],{w:64,h:40,bg:pos?'#c8423b':'#2a2d30',fg:'#fff'}),0.014,0.0085,x,yb-0.0004,z+(pos?-0.0155:0.0155),{rx:Math.PI/2}); }
    else if(g.k==='vent'){ cy(enc,M.glnd,0.0085,0.012,x,yb-0.006,z); cy(enc,M.gy,0.011,0.004,x,yb-0.014,z); }
    else { const r=g.dia/2000; cy(enc,M.glnd,r*1.28,0.01,x,yb-0.005,z,null,CYL6); cy(enc,M.glnd,r*0.98,0.018,x,yb-0.019,z); cy(enc,M.glnd,r*1.28,0.006,x,yb+0.0055,z,null,CYL6);
      if(g.id==='G1'||g.id==='G2'){ cy(enc,M.al,od,0.34,x,yb-0.198,z); cy(enc,g.id==='G1'?M.shR:M.shB,od*1.12,0.03,x,yb-0.12,z); }
      else if(g.id==='G3') cy(enc,M.wPE,0.0045,0.3,x,yb-0.17,z); else cy(enc,M.wRS,0.0035,0.3,x,yb-0.17,z);
      plt(enc,txt([g.id],{w:64,h:40,bg:'#fff'}),0.016,0.0095,x,yb-0.0004,z+r*1.35+0.007,{rx:Math.PI/2}); } });
  // двері: завіси ліворуч, табличка, наклейки небезпеки, ручка роз'єднувача, замки
  const door=new THREE.Group(); door.position.set(-W_/2,0,D_/2-0.004); G.add(door); const dp=new THREE.Group(); dp.position.x=W_/2; door.add(dp);
  bx(dp,M.enc,W_,H_,0.008,0,0,0); [-1,1].forEach(s=>{ bx(dp,M.gas,W_-0.02,0.008,0.003,0,s*(H_/2-0.014),-0.0055); bx(dp,M.gas,0.008,H_-0.02,0.003,s*(W_/2-0.014),0,-0.0055); }); bx(dp,M.met,0.006,0.03,0.006,-W_/2+0.03,0.08,-0.006);
  [0.17,-0.17].forEach(y=>cy(door,M.met,0.006,0.05,0,y,0));
  plt(dp,txt([`${b.id} · щит PV 7/1 → ${KN(b.K)} вх. ${b.q}`,`${b.ns} ${strW(b.ns)} · ${nf(b.kwp,1)} кВтп · Uхх ≤ ${nf(SH.uoc,1)} В DC · Iкз ${nf(b.isc,1)} А · IP66`],{w:1024,h:180,bd:'#1d2a33'}),0.34,0.06,-0.07,0.185,0.0042);
  plt(dp,warnTex(),0.07,0.07,0.215,0.185,0.0042,{tr:true});
  plt(dp,txt(['Увага! Постійна напруга до 1000 В','Два джерела: фотомодулі і накопичувач',`Відключити QS1 і ${KN(b.K)} вх. ${b.q}`],{w:900,h:220,bg:'#f2c40f',fg:'#1d1d1d',bd:'#1d1d1d',fs:0.58}),0.24,0.058,-0.12,-0.185,0.0042);
  plt(dp,warnTex(),0.055,0.055,0.215,-0.185,0.0042,{tr:true});
  { const q=P(qs.x+qs.w/2,qs.y+qs.h/2,0); bx(dp,M.ye,0.078,0.078,0.002,q.x,q.y,0.005); cy(dp,M.shR,0.022,0.012,q.x,q.y,0.011,'z'); bx(dp,M.shR,0.07,0.017,0.022,q.x,q.y,0.024);
    plt(dp,txt(['0'],{w:48,h:48,bg:'#f0c419'}),0.012,0.012,q.x-0.05,q.y,0.0062); plt(dp,txt(['I'],{w:48,h:48,bg:'#f0c419'}),0.012,0.012,q.x,q.y+0.05,0.0062);
    plt(dp,txt([`QS1 — відключення ${b.id}`]),0.11,0.016,q.x,q.y-0.058,0.0042); }
  [0.12,-0.12].forEach(y=>cy(dp,M.blk,0.008,0.012,W_/2-0.026,y,0.008,'z'));
  // розміри
  const DM=new THREE.Group(); G.add(DM); const dl=(a,b_,txt_,off)=>{ wire(DM,M.gy,0.0009,[a,b_]); const m=a.clone().add(b_).multiplyScalar(0.5).add(off); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:txt([txt_],{w:200,h:64,bg:'#ffffff',fs:0.7}),depthTest:false})); s.scale.set(0.085,0.027,1); s.position.copy(m); DM.add(s); };
  dl(new V3(-W_/2,-H_/2-0.045,D_/2),new V3(W_/2,-H_/2-0.045,D_/2),`${EN.w} мм`,new V3(0,-0.016,0));
  dl(new V3(-W_/2-0.045,-H_/2,D_/2),new V3(-W_/2-0.045,H_/2,D_/2),`${EN.h} мм`,new V3(-0.03,0,0));
  dl(new V3(W_/2+0.045,H_/2,-D_/2),new V3(W_/2+0.045,H_/2,D_/2),`${EN.d} мм`,new V3(0.035,0.012,0));
  return {G,enc,door,pg,WR,DM,EXP}; }
function disposeM(o){ o.traverse(x=>{ if(x.material&&(x.material.isMeshBasicMaterial||x.material.isSpriteMaterial)) x.material.dispose(); }); }
function anim(){ if(!PARTS) return; const e=WIN.ex, s=e*e*(3-2*e);
  PARTS.door.rotation.y=-1.95*WIN.door; PARTS.door.visible=s<0.5; PARTS.enc.position.z=-0.3*s; PARTS.door.position.z=D_/2-0.004-0.3*s; PARTS.pg.position.z=-0.06*s;
  PARTS.EXP.forEach(([g,z0,dz])=>{ g.position.z=z0+dz*1.4*s; }); PARTS.WR.visible=s<0.02; PARTS.DM.visible=s<0.02; }

// ---------- текст під 3D: входи, апарати, низ, клеми і роз'єми, маркування — саме цього щита
function infoHTML(id){ const b=BXD[id], ss=strOf(id), e=E4B[id]||{}, free=7-b.ns, rng=SH.gl.find(g=>g.id==='G1').rng, okC=b.od>=rng[0]&&b.od<=rng[1];
  const F=t=>t.replace(/\{id\}/g,b.id).replace(/\{K\}/g,KN(b.K)).replace(/\{q\}/g,b.q).replace(/\{ns\}/g,b.ns).replace(/\{kwp\}/g,nf(b.kwp,1)).replace(/\{isc\}/g,nf(b.isc,1));
  const inp=[]; for(let j=1;j<=7;j++){ const s=ss[j-1]; inp.push(j<=b.ns?`<tr><td class="c">вх. ${j}</td><td class="c">${s?esc(s.id):'стрінг '+j}</td><td class="n">${s?s.mem.length:11}</td><td class="n">${s?nf(s.mem.length*0.73,2):'8,03'}</td><td>F${j}± — gPV 32 А · «${s?esc(s.id):'…'}± · ${esc(b.id)} вх.${j}»</td></tr>`:`<tr class="fr"><td class="c">вх. ${j}</td><td colspan="3">вільний</td><td>заглушки MC4, тримачі F${j}± без вставок</td></tr>`); }
  const grp={}; SH.aps.forEach(a=>{ const n=a.k==='fh'?'Тримач 10×38 1P 1000 В DC (F1+…F7+, F1−…F7−)':a.n.replace(/ — вхід.*$/,''); const k=a.k==='fh'?'fh':a.id; (grp[k]=grp[k]||{a,n,ids:[]}).ids.push(a.id); });
  const apR=Object.values(grp).map(({a,n,ids})=>`<tr><td class="c">${ids.length>1?esc(a.k==='fh'?'F±':ids.join(', ')):esc(ids[0])}</td><td>${esc(n)}${a.k==='fh'?`<br><small>вставки gPV 32 А — ${2*b.ns}${free?`, без вставок — ${2*free} (вільні входи)`:''}</small>`:a.k==='mon'?`<br><small>адреса Modbus ${b.q} = вхід ${KN(b.K)}</small>`:''}</td><td class="n">${dim(a)}</td><td class="n">${ids.length}</td></tr>`).join('');
  const gR=['XS+','XS−','G1','G2','G3','G4','G5','V1'].map(k=>{ const L=k.startsWith('XS')?SH.gl.filter(g=>g.k==='mc4'&&g.id.endsWith(k.slice(2))):SH.gl.filter(g=>g.id===k); if(!L.length) return ''; const g=L[0];
    const st=k.startsWith('XS')?`${b.ns} зі стрінгами${free?`, ${free} із заглушками`:''}`:k==='G1'||k==='G2'?`Al 1×${b.S}, Ø ${nf(b.od,1)} мм у ${g.rng[0]}–${g.rng[1]} <span class="${okC?'ok':''}">${okC?'✓':'✗'}</span>`:'';
    return `<tr><td class="c">${k.startsWith('XS')?esc(`XS1${k.slice(2)}…XS7${k.slice(2)}`):k}</td><td>${esc(g.n.replace(/ вхід 1/,''))}${st?`<br><small>${st}</small>`:''}</td><td class="n">Ø ${f1(g.dia)}</td><td class="n">${L.length}</td></tr>`; }).join('');
  const klR=SH.kl.map(k=>{ let q=k.q, n=k.n; if(/кабельні на кінцях/.test(n)) q=b.ns; if(/DTL-2/.test(n)) n=n.replace('за перерізом лінії (120 або 185)',`DTL-2-${b.S}`); return `<tr><td class="c">${esc(k.m)}</td><td>${esc(n)}</td><td class="n">${f1(q)} ${esc(k.u)}</td></tr>`; }).join('')+(free?`<tr><td class="c">—</td><td>Заглушки MC4 на вільних входах</td><td class="n">${free} пар</td></tr>`:'');
  const s0=ss[0], mkR=SH.mk.map(m=>{ let t=F(m.t), q=m.q; if(/\{s\}/.test(t)){ t=t.replace(/\{s\}/g,s0?s0.id:'…').replace(/\{j\}/g,'1').replace(/ \(\{s\}.*\)/,''); q=m.q*b.ns; } return `<tr><td class="c">${esc(m.w)}</td><td>${esc(t.replace(/ \([^)]*напр\.[^)]*\)/,''))}</td><td class="n">${q}</td></tr>`; }).join('');
  return `<div class="sw-k"><div><small>Стрінгів</small><b>${b.ns} з 7</b></div><div><small>Потужність</small><b>${nf(b.kwp,1)} кВтп</b></div><div><small>Iкз щита</small><b>${nf(b.isc,1)} А</b></div>
  <div><small>Вхід контейнера</small><b>${KN(b.K)} · ${b.q}</b></div><div><small>Лінія Al</small><b>2 × 1×${b.S}</b></div><div><small>Корпус</small><b>${SH.enc.w}×${SH.enc.h}×${SH.enc.d}</b></div></div>
  <p>${esc(b.pl)}. Лінія ${e.L?`${nf(e.L,1)} м до ШВ ${KN(b.K)}, ΔU ${nf(e.du,2)} %`:`до ШВ ${KN(b.K)}`} — знизу через два вводи M40 прямо в клеми QS1, наконечники ${esc(b.lug)}.</p>
  <h4>Входи — стрінги</h4><table><thead><tr><th>Вхід</th><th>Стрінг</th><th>Мод.</th><th>кВтп</th><th>Запобіжники і маркування кабелю</th></tr></thead><tbody>${inp.join('')}</tbody></table>
  <h4>Апарати на панелі — габарит Ш × В × Г, мм</h4><table><tbody>${apR}</tbody></table>
  <h4>Низ корпусу — роз'єми і вводи</h4><table><tbody>${gR}</tbody></table>
  <h4>Клеми, роз'єми і провідники всередині</h4><table><tbody>${klR}</tbody></table>
  <h4>Маркування</h4><table><tbody>${mkR}</tbody></table>
  <p><small>Корпус ${esc(SH.enc.mat)}; монтажна панель ${SH.enc.plate[0]} × ${SH.enc.plate[1]} мм. Габарити апаратів — за паспортами еталонних; аналоги в замовленні — не більші.</small></p>`; }

// ---------- відкрити / закрити
function btnSync(){ const d=WD.querySelector('[data-a="door"]'), x=WD.querySelector('[data-a="ex"]'); d.setAttribute('aria-pressed',String(WIN.doorT>0.5)); d.textContent=WIN.doorT>0.5?'Двері відчинені':'Двері зачинені'; x.setAttribute('aria-pressed',String(WIN.exT>0.5)); x.textContent=WIN.exT>0.5?'Зібрати':'Розібрати'; }
function rowsMark(id){ document.querySelectorAll('.m5p [data-shr]').forEach(r=>r.classList.toggle('on',r.dataset.shr===id)); }
function open(id,fly){ if(!BXD[id]) return; if(!R) init(); WIN.id=id; WD.hidden=false;
  if(BG){ SS.remove(BG); disposeM(BG); } PARTS=model(id); BG=PARTS.G; SS.add(BG); WIN.door=WIN.doorT=1; WIN.ex=WIN.exT=0; anim(); btnSync();
  const b=BXD[id], e=E4B[id]||{}; WD.querySelector('.sw-t').textContent=`${id} · щит PV 7/1 → ${KN(b.K)} вх. ${b.q}`;
  WD.querySelector('.sw-s').textContent=`${b.g} · етап ${b.st} · ${TPN[b.K]||''} · ${b.ns} ${strW(b.ns)}, ${nf(b.kwp,1)} кВтп`;
  const I=WD.querySelector('.sw-i'); I.innerHTML=infoHTML(id); I.scrollTop=0;
  if(typeof xPhone==='function'&&xPhone()&&state.sheet&&state.sheet!=='peek'&&typeof sheetSet==='function') sheetSet('peek');
  cvH(); fit(); view('fr',true); selBox(id); rowsMark(id); if(fly) flyTo(id);
  WIN.open=true; WIN.dirty=true; if(!WIN.loop){ WIN.loop=true; requestAnimationFrame(loop); } }
function close(){ if(!WIN.open&&WD.hidden) return; WIN.open=false; WD.hidden=true; WIN.id=null; SEL.visible=false; need=true; rowsMark(null); }
let last=0;
function loop(ts){ if(!WIN.open){ WIN.loop=false; last=0; return; } requestAnimationFrame(loop); const dt=Math.min(0.05,last?(ts-last)/1000:0.016); last=ts; let mv=false;
  [['door','doorT'],['ex','exT']].forEach(([k,kt])=>{ if(WIN[k]!==WIN[kt]){ const d=WIN[kt]-WIN[k], st=dt*1.8; WIN[k]=Math.abs(d)<=st?WIN[kt]:WIN[k]+Math.sign(d)*st; mv=true; } });
  if(WIN.cam){ const c=WIN.cam; c.t=Math.min(1,c.t+dt/0.6); const u=c.t*c.t*(3-2*c.t); SC.position.lerpVectors(c.p0,c.p1,u); CT.target.lerpVectors(c.c0,c.c1,u); if(c.t>=1) WIN.cam=null; mv=true; }
  if(CT.update()) mv=true;
  if(mv||WIN.dirty){ anim(); fit(); R.render(SS,SC); WIN.dirty=false; } }
WD.querySelector('.sw-x').onclick=close;
WD.querySelectorAll('.sw-b button').forEach(bt=>bt.onclick=()=>{ const a=bt.dataset.a;
  if(a==='door'){ WIN.doorT=WIN.doorT>0.5?0:1; if(WIN.exT>0.5) WIN.exT=0; }
  else if(a==='ex'){ WIN.exT=WIN.exT>0.5?0:1; if(WIN.exT>0.5){ WIN.doorT=1; view('ex'); } else view('fr'); }
  else view(a); btnSync(); WIN.dirty=true; });
window.addEventListener('resize',()=>{ if(WIN.open){ cvH(); WIN.dirty=true; } });
if(typeof ResizeObserver!=='undefined') new ResizeObserver(()=>{ if(WIN.open){ cvH(); WIN.dirty=true; } }).observe(WD.parentElement);
window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&WIN.open) close(); });

// ---------- видимість: лише в «Електрика → Щити PV»; натискання на щит або підпис на моделі відкриває вікно
const onShch=()=>state.sec==='pz'&&M5m.cur().sub[0]==='shch'&&visUp(E4m.g);
function sync(){ const on=onShch(); TG[1].visible=on&&stOn(1); TG[2].visible=on&&stOn(2); if(!on&&WIN.open) close(); else if(WIN.open&&!stOn(BXD[WIN.id].st)) close(); need=true; }
const apS=apply; apply=function(){ const r=apS.apply(this,arguments); sync(); return r; }; T_.apply=apply;
let dn=null; canvas.addEventListener('pointerdown',e=>{ dn=[e.clientX,e.clientY]; });
canvas.addEventListener('pointerup',e=>{ if(!onShch()||!dn||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>(e.pointerType==='touch'?12:5)) return;
  const th=ray.intersectObjects(TAGS.filter(s=>visUp(s)),false); let id=th.length?th[0].object.userData.shb:null;
  if(!id){ const h=pickHits()[0]; if(h&&BOXO.has(h.object)) id=BOXO.get(h.object); }
  if(id){ if(typeof hideTip==='function') hideTip(); open(id,false); } });
T_.shch={open,close,model:id=>model(id).G,BOXO,flyTo,WIN};
sync();
} }
