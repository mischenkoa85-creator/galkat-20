// ================= Фасади цеху і сусідні будівлі за фото обстеження 26.10.2026 (src/fasad.js; вставляється після obst.js)
// Панелі, вікна, ворота, кабелі, ДГУ, сходи, контейнери, ТП, адмінкорпус, покриття двору. Положення й розміри — оцінка за фото
// (±1–3 м), рулеткою не міряно. Генерацію і тіні від цих елементів не перераховано.
{
const FA=grp('fasad',G.site);
let sd=7; const rnd=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
const fno=(...ids)=>ids.map(id=>{ const i=FOTO.p.findIndex(p=>p[0]===id); return i<0?'':i+1; }).join(', ');
const pick=(o,t,d)=>{ o.userData.info={t,d}; PICK.push({o}); return o; };
const EST='Положення й розміри — оцінка за фото, рулеткою не міряно.';
// ---------- текстури (малюються на canvas; 1 текстура на тип)
function ctex(w,h,draw,rx,ry){ const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); draw(x,w,h); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8;
  if(rx){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); } return t; }
const rep=(t,rx,ry)=>{ const k=t.clone(); k.needsUpdate=true; k.wrapS=k.wrapT=THREE.RepeatWrapping; k.repeat.set(rx,ry); return k; };
const tm=(t,o)=>new THREE.MeshStandardMaterial(Object.assign({map:t,roughness:0.85,metalness:0},o||{}));
const frameR=(x,w,h,f,c)=>{ x.fillStyle=c; x.fillRect(0,0,w,f); x.fillRect(0,h-f,w,f); x.fillRect(0,0,f,h); x.fillRect(w-f,0,f,h); };
// бетонні стінові панелі: плитка 6 × 6 м, шви через 1,2 м, патьоки
const CONC=ctex(512,512,(x,w,h)=>{ x.fillStyle='#8c8b86'; x.fillRect(0,0,w,h); const p=h/5;
  for(let r=0;r<5;r++){ const v=(rnd()-0.5)*26; x.fillStyle=v>0?`rgba(255,255,255,${v/120})`:`rgba(0,0,0,${-v/120})`; x.fillRect(0,r*p,w,p); }
  for(let i=0;i<5000;i++){ x.fillStyle=rnd()<0.5?'rgba(0,0,0,0.07)':'rgba(255,255,255,0.07)'; x.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2); }
  for(let i=0;i<45;i++){ const sx=rnd()*w, sy=Math.floor(rnd()*5)*p+3, L=30+rnd()*120, g=x.createLinearGradient(0,sy,0,sy+L); g.addColorStop(0,'rgba(40,40,36,0.14)'); g.addColorStop(1,'rgba(40,40,36,0)'); x.fillStyle=g; x.fillRect(sx,sy,2+rnd()*5,L); }
  for(let r=0;r<5;r++){ x.fillStyle='rgba(55,55,52,0.8)'; x.fillRect(0,r*p,w,2.5); x.fillStyle='rgba(255,255,255,0.18)'; x.fillRect(0,r*p+2.5,w,1.2); }
  x.fillStyle='rgba(55,55,52,0.8)'; x.fillRect(0,0,2.5,h); });
// цегла: жовта (ТП, адмінкорпус) — плитка 1 × 1 м, 13 рядів
const brickT=(cols,mort)=>ctex(256,256,(x,w,h)=>{ x.fillStyle=mort; x.fillRect(0,0,w,h); const ch=h/13, bw=64;
  for(let r=0;r<13;r++) for(let k=-1;k<5;k++){ x.fillStyle=cols[Math.floor(rnd()*cols.length)]; x.fillRect(k*bw+(r%2)*bw/2+1.5,r*ch+1.5,bw-3,ch-3); }
  for(let i=0;i<1500;i++){ x.fillStyle='rgba(0,0,0,0.06)'; x.fillRect(rnd()*w,rnd()*h,2,2); } });
const YBRICK=brickT(['#c79f62','#cfa86c','#bd955b','#c48e57','#b8834f','#caa56b','#a87445'],'#cdbf9f');
const GLASS_UP=(x,w,h,o)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,o[0]); g.addColorStop(1,o[1]); x.fillStyle=g; x.fillRect(0,0,w,h);
  x.fillStyle='rgba(255,255,255,0.09)'; for(let i=0;i<3;i++){ const a=rnd()*w; x.beginPath(); x.moveTo(a,0); x.lineTo(a+w*0.1,0); x.lineTo(a-w*0.12,h); x.lineTo(a-w*0.22,h); x.fill(); } };
const T={
  // великі сучасні вікна верхнього ряду (схід, північ): біла рама, світле дзеркальне скло, жалюзі
  up:ctex(512,372,(x,w,h)=>{ GLASS_UP(x,w,h,['#d4dce1','#a6b5bf']); x.fillStyle='rgba(255,255,255,0.12)'; for(let y=0;y<h;y+=7) x.fillRect(0,y,w,2);
    x.fillStyle='#f4f5f5'; frameR(x,w,h,9,'#f4f5f5'); [0.25,0.5,0.75].forEach(f=>x.fillRect(f*w-3,0,6,h)); x.fillRect(0,0.3*h,w,5); }),
  tall:ctex(512,535,(x,w,h)=>{ GLASS_UP(x,w,h,['#d7dee3','#a3b2bc']); x.fillStyle='rgba(255,255,255,0.12)'; for(let y=0;y<h;y+=7) x.fillRect(0,y,w,2);
    frameR(x,w,h,9,'#f4f5f5'); x.fillStyle='#f4f5f5'; [0.25,0.5,0.75].forEach(f=>x.fillRect(f*w-3,0,6,h)); [1/3,2/3].forEach(f=>x.fillRect(0,f*h-2,w,5)); }),
  // старі вікна над ТП-5913: темне скло, сіра рама
  old:ctex(512,280,(x,w,h)=>{ GLASS_UP(x,w,h,['#59646b','#3b444a']); frameR(x,w,h,8,'#8a9196'); x.fillStyle='#8a9196'; for(let i=1;i<6;i++) x.fillRect(i*w/6-2,0,4,h); x.fillRect(0,h*0.45,w,4); }),
  // нижні вікна сходу й півночі: темне скло, іржаві ґрати
  bar:ctex(512,244,(x,w,h)=>{ x.fillStyle='#2d3337'; x.fillRect(0,0,w,h); for(let i=0;i<14;i++){ x.fillStyle=`rgba(120,135,145,${0.05+rnd()*0.12})`; x.fillRect(rnd()*w,rnd()*h,40+rnd()*60,30+rnd()*40); }
    frameR(x,w,h,9,'#6c7276'); x.fillStyle='#6c7276'; for(let i=1;i<4;i++) x.fillRect(i*w/4-3,0,6,h);
    x.fillStyle='#6a5236'; for(let px=14;px<w;px+=26) x.fillRect(px,0,2,h); [h/3,2*h/3].forEach(y=>x.fillRect(0,y-2,w,4)); }),
  // нижні вікна півдня: білі ґрати-сітка, бірюзовий відлив
  grid:ctex(512,262,(x,w,h)=>{ x.fillStyle='#6f7a80'; x.fillRect(0,0,w,h); for(let i=0;i<10;i++){ x.fillStyle=`rgba(200,210,215,${0.05+rnd()*0.1})`; x.fillRect(rnd()*w,rnd()*h,60,40); }
    x.fillStyle='#e3e6e7'; for(let px=0;px<w;px+=36) x.fillRect(px,0,4,h); for(let py=0;py<h;py+=36) x.fillRect(0,py,w,4); frameR(x,w,h,8,'#cfd3d5'); x.fillStyle='#3a9c97'; x.fillRect(0,h-9,w,9); }),
  // малі вікна з білими ґратками вентиляції (південь, ≈5,3 м)
  louv:ctex(256,104,(x,w,h)=>{ x.fillStyle='#f1f3f3'; x.fillRect(0,0,w,h); x.fillStyle='#aab1b5'; for(let y=12;y<h-10;y+=7) x.fillRect(12,y,w-24,3); x.fillStyle='#f1f3f3'; x.fillRect(w/2-4,0,8,h); frameR(x,w,h,8,'#e7eaeb'); }),
  // стрічкові вікна півдня: темне скло, руді дерев'яні рами
  rib:ctex(512,200,(x,w,h)=>{ GLASS_UP(x,w,h,['#68747c','#353d43']); frameR(x,w,h,7,'#a86a2e'); x.fillStyle='#a86a2e'; for(let i=1;i<4;i++) x.fillRect(i*w/4-3,0,6,h); x.fillRect(0,h*0.42,w,5); x.fillStyle='#8a8f93'; for(let i=1;i<8;i+=2) x.fillRect(i*w/8-1,0,2,h); }),
  // сірі розпашні металеві ворота з хвірткою
  gate:ctex(400,420,(x,w,h)=>{ x.fillStyle='#7c8995'; x.fillRect(0,0,w,h); for(let i=0;i<30;i++){ x.fillStyle=`rgba(255,255,255,${rnd()*0.05})`; x.fillRect(rnd()*w,rnd()*h,30,80); }
    frameR(x,w,h,12,'#5f6b75'); x.fillStyle='#4f5a63'; x.fillRect(w/2-3,0,6,h); x.fillRect(0,h*0.48,w,3);
    x.strokeStyle='#4a545c'; x.lineWidth=4; x.strokeRect(w/2+40,h-212,92,200); x.fillStyle='#2d3338'; x.fillRect(w/2+118,h-118,8,14);
    [0.15,0.5,0.85].forEach(f=>{ x.fillRect(4,f*h,14,16); x.fillRect(w-18,f*h,14,16); });
    const g=x.createLinearGradient(0,h-60,0,h); g.addColorStop(0,'rgba(120,70,30,0)'); g.addColorStop(1,'rgba(120,70,30,0.35)'); x.fillStyle=g; x.fillRect(0,h-60,w,60); }),
  // чорні секційні ворота з білою рамкою хвіртки
  sect:ctex(300,390,(x,w,h)=>{ x.fillStyle='#33373a'; x.fillRect(0,0,w,h); for(let y=0;y<h;y+=26){ x.fillStyle='#24282a'; x.fillRect(0,y,w,2); x.fillStyle='#43474a'; x.fillRect(0,y+2,w,1); }
    frameR(x,w,h,6,'#2a2d2f'); x.strokeStyle='#e9ecee'; x.lineWidth=6; x.strokeRect(w/2-48,h-214,96,210); x.fillStyle='#c9cdd0'; x.fillRect(w/2+30,h-112,5,18); }),
  // ворота ТП з жалюзі і знаком
  tp6:null, tp7:null,
  tlouv:ctex(256,100,(x,w,h)=>{ x.fillStyle='#8c9499'; x.fillRect(0,0,w,h); x.fillStyle='#6a7277'; for(let y=8;y<h-6;y+=8) x.fillRect(6,y,w-12,4); frameR(x,w,h,6,'#7b8388'); }),
  door:ctex(100,220,(x,w,h)=>{ x.fillStyle='#87929a'; x.fillRect(0,0,w,h); frameR(x,w,h,5,'#6b757c'); x.fillStyle='#2d3338'; x.fillRect(w-20,h*0.48,6,14); }),
  // вікна західної будівлі і адмінкорпусу: біла рама ПВХ
  wb:ctex(140,160,(x,w,h)=>{ GLASS_UP(x,w,h,['#5d6a73','#36404a']); frameR(x,w,h,9,'#eef0f0'); x.fillStyle='#eef0f0'; x.fillRect(w/2-3,0,6,h); }),
  wbar:ctex(140,190,(x,w,h)=>{ GLASS_UP(x,w,h,['#4a555d','#2b3238']); frameR(x,w,h,9,'#eef0f0'); x.fillStyle='#3a3f43'; for(let px=18;px<w;px+=24) x.fillRect(px,0,3,h); x.fillRect(0,h/2,w,3); }),
  adm:ctex(180,150,(x,w,h)=>{ GLASS_UP(x,w,h,['#6b7a84','#3d4851']); frameR(x,w,h,9,'#f2f3f3'); x.fillStyle='#f2f3f3'; x.fillRect(w/2-3,0,6,h); x.fillRect(0,h*0.32,w/2,5); }),
  rev:null };
const tpG=n=>ctex(260,240,(x,w,h)=>{ x.fillStyle='#8f979c'; x.fillRect(0,0,w,h); frameR(x,w,h,8,'#737b80'); x.fillStyle='#646c71'; x.fillRect(w/2-2,0,4,h);
  [[14,h-78,w/2-24,62],[w/2+10,h-78,w/2-24,62],[14,16,w/2-24,40],[w/2+10,16,w/2-24,40]].forEach(([a,b,c,d])=>{ x.fillStyle='#737b80'; x.fillRect(a,b,c,d); x.fillStyle='#5b6368'; for(let y=b+6;y<b+d-4;y+=7) x.fillRect(a+4,y,c-8,3); });
  x.fillStyle='#f2f2ee'; x.fillRect(22,70,62,24); x.fillStyle='#222'; x.font='bold 15px sans-serif'; x.fillText('Тр-р №'+n,25,88);
  x.beginPath(); x.moveTo(w*0.75,66); x.lineTo(w*0.75+26,112); x.lineTo(w*0.75-26,112); x.closePath(); x.fillStyle='#f0c419'; x.fill(); x.lineWidth=3; x.strokeStyle='#1d1d1d'; x.stroke(); });
T.tp6=tpG(6); T.tp7=tpG(7);
const MW={}; Object.keys(T).forEach(k=>{ if(T[k]) MW[k]=tm(T[k],{roughness:/up|tall|old|rib|wb|adm|bar|grid/.test(k)?0.35:0.7,metalness:/up|tall|old|rib|wb|adm/.test(k)?0.15:0.05}); });
MW.rev=std(lin(0x4f5355),{roughness:0.9});
// ---------- грані: точка (s — уздовж грані, h — висота, o — відступ назовні), напрям уздовж (ax); нормаль = ax × вгору
const UP=new V3(0,1,0);
const FACE={
  S:{p:(s,h,o)=>new V3(s,h,0.5+o),ax:new V3(1,0,0)},             // південний фасад цеху, Y = −0,5
  N:{p:(s,h,o)=>new V3(s,h,-96.59-o),ax:new V3(-1,0,0)},         // північний, Y = 96,59
  E:{p:(s,h,o)=>new V3(96.64+o,h,-s),ax:new V3(0,0,-1)},         // східний, X = 96,64 (s — це Y)
  NV:{p:(s,h,o)=>new V3(s,h,-98.2-o),ax:new V3(-1,0,0)},         // тамбур з воротами на півночі
  SV:{p:(s,h,o)=>new V3(s,h,2.3+o),ax:new V3(1,0,0)},            // тамбур на півдні
  T5E:{p:(s,h,o)=>new V3(103+o,h,-s),ax:new V3(0,0,-1)},         // ТП-5913, схід
  T5N:{p:(s,h,o)=>new V3(s,h,-34.6-o),ax:new V3(-1,0,0)},        // ТП-5913, північ
  T6N:{p:(s,h,o)=>new V3(s,h,-107.1-o),ax:new V3(-1,0,0)},       // ТП-6923, північ
  T6sN:{p:(s,h,o)=>new V3(s,h,-99.4-o),ax:new V3(-1,0,0)},       // прибудова ТП-6923, північ
  WN:{p:(s,h,o)=>new V3(s,h,-96.59-o),ax:new V3(-1,0,0)}, WS:{p:(s,h,o)=>new V3(s,h,0.5+o),ax:new V3(1,0,0)}, WE:{p:(s,h,o)=>new V3(-0.15+o,h,-s),ax:new V3(0,0,-1)},
  AW:{p:(s,h,o)=>new V3(108.3-o,h,-s),ax:new V3(0,0,1)}, AW2:{p:(s,h,o)=>new V3(108.5-o,h,-s),ax:new V3(0,0,1)},   // АБК: захід південного і основного блоків
  AS:{p:(s,h,o)=>new V3(s,h,-6.6+o),ax:new V3(1,0,0)}, AS2:{p:(s,h,o)=>new V3(s,h,-20.3+o),ax:new V3(1,0,0)}};      // АБК: південь нижнього блоку і основного над нижнім дахом
const QD={};   // тип → злиті прямокутники
function quad(type,f,s0,s1,h0,h1,o){ const F=FACE[f], q=QD[type]||(QD[type]={p:[],n:[],u:[],i:[]}), b=q.p.length/3, n=new V3().crossVectors(F.ax,UP);
  // s — координата вздовж грані (X для S/N/…; Y для E/T5E/WE/AW); s0 — лівий край, якщо дивитися ззовні
  [[s0,h0,0,0],[s1,h0,1,0],[s1,h1,1,1],[s0,h1,0,1]].forEach(([s,h,u,v])=>{ const pt=F.p(s,h,o); q.p.push(pt.x,pt.y,pt.z); q.n.push(n.x,n.y,n.z); q.u.push(u,v); });
  q.i.push(b,b+1,b+2,b,b+2,b+3); }
// вікно / ворота: відкіс (темна рамка) + саме заповнення
function op(f,a,b,h0,h1,type,noRev){ const s0=FACE[f].ax.x<0||FACE[f].ax.z>0?b:a, s1=s0===b?a:b;   // ліворуч → праворуч, якщо дивитися на фасад ззовні
  if(!noRev) quad('rev',f,s0+(s1>s0?-0.07:0.07),s1+(s1>s0?0.07:-0.07),h0-0.07,h1+0.07,0.025); quad(type,f,s0,s1,h0,h1,0.04); }
function flush(){ Object.keys(QD).forEach(k=>{ const q=QD[k], g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(q.p,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(q.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(q.u,2)); g.setIndex(q.i); const m=mesh(g,MW[k],FA,false); m.userData.ft=k; QM[k]=m; delete QD[k]; }); }
const QM={};

// ================= 1. Бетонна «шкіра» фасадів цеху (південь, північ — по арках з парапетом; схід — до верху парапету)
const RXp=X=>roofZ(Math.max(0,Math.min(96.64,X)))+1.2;
{ const top=[]; for(let x=96.64;x>=-0.15-1e-9;x-=0.5) top.push(new THREE.Vector2(Math.max(x,-0.15),RXp(x)));
  const sh=new THREE.Shape([new THREE.Vector2(-0.15,0),new THREE.Vector2(96.64,0)].concat(top)), g=new THREE.ShapeGeometry(sh);
  const cm=tm(rep(CONC,1/6,1/6),{side:THREE.DoubleSide,roughness:0.95});
  const s=mesh(g,cm,FA,false); s.position.z=0.515; pick(s,'Південний фасад цеху',`Збірні бетонні панелі, сірі, з патьоками. Внизу — ворота (чорні секційні й сірі розпашні), вікна з білими ґратами; на ≈5,3 м — ряд малих вікон з ґратками вентиляції; вище — стрічкові вікна з рудими дерев'яними рамами. На ≈4,0 і 4,6 м уздовж фасаду — тонкі кабелі. Фото № ${fno('144546','144600','144601','144614','144615','144617')}. ${EST}`);
  const n=mesh(g,cm,FA,false); n.position.z=-96.605; pick(n,'Північний фасад цеху',`Збірні бетонні панелі. Унизу — вікна з темним склом та іржавими ґратами, тамбур із сірими воротами; на ≈5,6 і 6,1 м — 2 яруси кабелів на кронштейнах; вище — великі сучасні вікна з білими рамами. Фото № ${fno('144002','144004','144012','144049','144102','144221')}. ${EST}`);
  const H=HV+0.5, e=mesh(new THREE.PlaneGeometry(97.09,H),tm(rep(CONC,97.09/6,H/6),{roughness:0.95}),FA,false); e.rotation.y=Math.PI/2; e.position.set(96.655,H/2,-48.045);
  pick(e,'Східний фасад цеху',`Бетонні панелі; унизу — сірі ворота й вікна з іржавими ґратами (північна частина), на південь — прибудова ТП-5913 з жовтої цегли; на ≈5,6 і 6,1 м — 2 яруси кабелів на кронштейнах; вище — великі вікна з білими рамами; оцинкований вентканал. Фото № ${fno('143856','143858','143901','143918')}. ${EST}`); }
// верхні вікна: прольоти по ≈6 м
const bays=(a,b,n)=>Array.from({length:n},(_,k)=>[a+(b-a)*k/n,a+(b-a)*(k+1)/n]);
bays(-0.5,96.59,16).forEach(([a,b],k)=>{ const c=(a+b)/2;
  if(k<4) op('E',c-2.2,c+2.2,6.5,8.8,'old'); else if(k===7||k===12) op('E',c-2.2,c+2.2,6.6,11.2,'tall'); else op('E',c-2.2,c+2.2,6.6,9.7,'up'); });
bays(-0.15,96.64,16).forEach(([a,b],k)=>{ const c=(a+b)/2;
  if(k===8||k===9) op('N',c-2.6,c+2.6,6.6,11.2,'tall'); else op('N',c-2.2,c+2.2,6.6,9.7,'up'); });
bays(-0.15,96.64,16).forEach(([a,b],k)=>{ const c=(a+b)/2, s=7.6+((k*7)%3)*0.3, h=1.6+((k*5)%3)*0.35;
  op('S',c-2.2,c+2.2,s,s+h,'rib'); if([7,8,11,12,14].includes(k)) op('S',c-2.2,c+2.2,10.2,11.7,'rib'); });
// нижній ряд: схід (північна частина), північ, південь
[[84.0,88.4],[90.0,94.6]].forEach(([a,b])=>op('E',a,b,1.3,3.4,'bar'));
op('E',76.3,80.5,0,4.1,'gate');
[[36.2,40.6],[42.2,46.6],[48.2,52.6],[66.2,70.6],[72.2,76.6],[84.2,88.6],[90.2,94.6]].forEach(([a,b])=>op('N',a,b,1.3,3.4,'bar'));
[[24.5,28.5],[30.5,34.7],[35.0,38.4],[42.6,46.0],[46.3,50.4],[51.0,52.0],[65.9,70.6]].forEach(([a,b],i)=>op('S',a,b,i===6?2.0:1.2,i===6?3.6:3.35,'grid'));
[[38.8,41.8],[52.2,55.2],[62.3,65.1]].forEach(([a,b])=>op('S',a,b,0,3.9,'sect'));
[[8.0,11.6],[18.0,21.6]].forEach(([a,b])=>op('S',a,b,0,4.0,'gate')); op('S',71.6,76.0,0,4.4,'gate');
[[36.5,38.0],[40.2,41.4],[43.0,44.8],[47.4,49.5],[51.8,53.4],[54.4,55.2],[55.9,57.4],[58.2,59.6],[60.0,61.2]].forEach(([a,b])=>op('S',a,b,5.3,5.95,'louv'));
op('S',86.0,86.8,3.6,4.4,'tlouv');
// тамбури з воротами
{ const cm=tm(rep(CONC,1,1),{roughness:0.95});
  pick(box(5.8,4.6,1.61,cm,28.5,2.3,-(96.59+0.8),FA),'Тамбур із сірими воротами — північний фасад',`Бетонний тамбур, ворота ≈3,6 × 3,8 м. Фото № ${fno('144049','144102','144109')}. ${EST}`); op('NV',26.7,30.3,0,3.8,'gate',true);
  pick(box(6,3.7,1.8,cm,82.5,1.85,1.4,FA),'Тамбур із сірими воротами — південний фасад',`Низька прибудова з воротами в південному проїзді. Фото № ${fno('144530','144532')}. ${EST}`); op('SV',80.7,84.3,0,3.1,'gate',true); }

// ================= 2. Кабелі на південному фасаді (тонкі, ≈4,0 і 4,6 м) і вертикальна труба
{ const cm=std(lin(0x1c1f22),{roughness:0.6});
  [[4.0,0.012],[4.6,0.012]].forEach(([h,r])=>{ const pts=[]; for(let x=30;x<=78;x+=0.5){ const ph=((x-30)%6)/6; pts.push(W(x,-0.58,h-0.14*Math.sin(Math.PI*ph))); }
    pick(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),400,r,4,false),cm,FA,false),'Кабелі на південному фасаді',`Тонкі кабелі вздовж фасаду на ≈4,0 і 4,6 м (над воротами), кріплення через ≈6 м; поруч камери відеоспостереження й ліхтарі. Фото № ${fno('144600','144601','144614')}. Що за кабелі — з'ясувати. ${EST}`); });
  pick(mesh(new THREE.CylinderGeometry(0.03,0.03,13.6,6),std(lin(0x7a5434),{roughness:0.7}),FA,false),'Вертикальна іржава труба / кабель',`Південний фасад, схід. Фото № ${fno('144530')}. ${EST}`).position.set(88.6,7.1,0.6);
  // ліхтарі й камери
  [[53.7,4.9],[63.5,4.9],[74.0,5.6]].forEach(([x,h])=>{ box(0.08,0.08,0.45,std(lin(0x2d3236)),x,h,0.72,FA); const l=mesh(new THREE.SphereGeometry(0.13,10,8),std(lin(0x5f8d78),{roughness:0.4}),FA,false); l.position.set(x,h-0.12,0.95); });
  [[48,4.7],[57,4.7],[61,4.8],[69,4.7]].forEach(([x,h])=>box(0.12,0.12,0.2,std(lin(0xeeeeee)),x,h,0.62,FA)); }
// оцинкований вентканал на сході, біла труба на півночі, шафа з балонами, ліхтар біля воріт
{ const zn=std(lin(0xb9c0c4),{metalness:0.6,roughness:0.35});
  const d=mesh(new THREE.CylinderGeometry(0.22,0.22,HV+1.5-4.8,14),zn,FA); d.position.set(97.0,(HV+1.5+4.8)/2,-54.1); pick(d,'Оцинкований вентканал на східному фасаді',`Від ≈4,8 м до даху. Фото № ${fno('143858','143901')}. ${EST}`);
  const wp=new THREE.CatmullRomCurve3([W(31.0,97.3,4.6),W(31.0,96.85,5.2),W(32.5,96.85,5.25),W(46,96.85,5.25)],false,'catmullrom',0.1);
  pick(mesh(new THREE.TubeGeometry(wp,60,0.08,8,false),std(lin(0xe8eaea),{roughness:0.5}),FA),'Біла труба на північному фасаді',`Фото № ${fno('144049','144102')}. ${EST}`);
  const gc=box(1.0,1.5,0.6,std(lin(0xe9ebeb),{roughness:0.5}),91.6,1.15,-97.05,FA); pick(gc,'Шафа з газовими балонами',`Північний фасад, біля північно-східного кута. Фото № ${fno('144024','144025')}. ${EST}`);
  box(0.5,0.08,0.06,std(lin(0x2d3236)),75.6,4.8,-96.95,FA); }

// ================= 3. Сходи (пожежні, на дах) — за фото № 68: майданчики по черзі ліворуч / праворуч через ≈2,2 м
{ const st=std(lin(0x5e676d),{metalness:0.5,roughness:0.5}), rust=std(lin(0x7c5636),{roughness:0.75}), par=[];
  const XL=[61.0,62.3], XR=[64.3,65.6], YW=-0.55, YF=-2.45, lev=[2.6,4.95,7.3,9.65,12.0,14.35,16.7]; while(lev[lev.length-1]<RXp(61.65)+0.2) lev.push(+(lev[lev.length-1]+2.35).toFixed(2)); const top=lev[lev.length-1]+1.0;   // до верху парапету (висота будівлі — розріз 1-1)
  [[XL[0],YF],[XR[1],YF],[XL[0],YW-0.15],[XR[1],YW-0.15]].forEach(([x,y])=>par.push(box(0.14,top,0.14,st,x,top/2,-y,FA)));
  const rail=(a,b)=>{ const L=a.distanceTo(b), m=mesh(new THREE.CylinderGeometry(0.022,0.022,L,5),st,FA,false); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP,b.clone().sub(a).normalize()); par.push(m); };
  const land=(x0,x1,h)=>{ par.push(box(x1-x0,0.06,YW-YF,rust,(x0+x1)/2,h,-(YW+YF)/2,FA)); rail(W(x0,YF,h+1.0),W(x1,YF,h+1.0)); [x0,x1].forEach(x=>rail(W(x,YF,h),W(x,YF,h+1.0))); };
  lev.forEach((h,i)=>{ const L=i%2===0; land(L?XL[0]:XR[0],L?XL[1]:XR[1],h);
    if(i<lev.length-1){ const h1=lev[i+1], xa=L?XL[1]:XR[0], xb=L?XR[0]:XL[1], yc=(YW+YF)/2+(i%2?0.45:-0.45), run=Math.abs(xb-xa), len=Math.hypot(run,h1-h), ang=Math.atan2(h1-h,xb-xa);
      [yc-0.45,yc+0.45].forEach(y=>{ const s=box(len,0.18,0.05,st,(xa+xb)/2,(h+h1)/2,-y,FA); s.rotation.z=ang; par.push(s); });
      const n=11, tr=inst(new THREE.BoxGeometry(0.22,0.035,0.9),rust,n,FA); for(let k=1;k<=n;k++){ const t=k/(n+1); _M.compose(new V3(xa+(xb-xa)*t,h+(h1-h)*t,-yc),QI,ONE); tr.setMatrixAt(k-1,_M); } par.push(tr);
      rail(W(xa,yc-0.45,h+1.0),W(xb,yc-0.45,h1+1.0)); } });
  // нижній майданчик біля контейнера і короткий марш униз; верхній перехід через парапет
  land(58.4,59.8,1.0); { const s=box(Math.hypot(1.2,1.0),0.16,0.05,st,60.4,0.5,2.85,FA); s.rotation.z=-Math.atan2(1.0,1.2); par.push(s); }
  { const h0=1.0, h1=lev[0], xa=59.8, xb=61.0, len=Math.hypot(xb-xa,h1-h0); [-1.35,-2.25].forEach(y=>{ const s=box(len,0.16,0.05,st,(xa+xb)/2,(h0+h1)/2,-y,FA); s.rotation.z=Math.atan2(h1-h0,xb-xa); par.push(s); });
    const n=7, tr=inst(new THREE.BoxGeometry(0.2,0.035,0.9),rust,n,FA); for(let k=1;k<=n;k++){ const t=k/(n+1); _M.compose(new V3(xa+(xb-xa)*t,h0+(h1-h0)*t,1.8),QI,ONE); tr.setMatrixAt(k-1,_M); } par.push(tr); }
  par.push(box(1.3,0.06,1.4,rust,61.65,lev[lev.length-1],0.2,FA));
  par.forEach(o=>pick(o,'Зовнішні сталеві сходи на дах (південний фасад)',`Майданчики по черзі ліворуч і праворуч через ≈2,2 м, марші між ними; внизу — майданчик біля білого контейнера, нагорі — перехід через парапет до порталу. Сходинки й майданчики сильно поіржавілі. Фото № ${fno('144600','124421','124423','144546')}. ${EST}`));
  // козирок над воротами під сходами, бак-навіс з ємностями (IBC), лебідка
  box(3.4,0.05,1.2,std(lin(0x8a6a4a),{roughness:0.7}),63.7,4.15,1.1,FA);
  const sh=std(lin(0x3c4247),{roughness:0.7,side:THREE.DoubleSide}), ibc=std(lin(0xdfe3e2),{roughness:0.4});
  [box(1.4,0.05,1.3,sh,61.6,1.95,1.2,FA),box(0.04,1.9,1.3,sh,60.9,0.95,1.2,FA),box(0.04,1.9,1.3,sh,62.3,0.95,1.2,FA),box(1.4,1.9,0.04,sh,61.6,0.95,0.6,FA)].forEach(o=>pick(o,'Навіс з ємностями (IBC) і насосами — схоже на паливо для ДГУ',`Фото № ${fno('144600')}. ${EST}`));
  [61.25,61.95].forEach((x,i)=>{ box(0.62,1.1,1.0,ibc,x,0.6,1.2,FA); box(0.25,0.25,0.12,std(lin(i?0xc23a2b:0xe8c22a)),x,1.25,1.75,FA); });
  box(0.7,0.45,0.5,std(lin(0x3a3f44),{metalness:0.4}),62.4,0.3,2.0,FA); }
// білий блок-контейнер, сірі побутівки, кондиціонери на землі, стелажі
{ const wh=std(lin(0xeaedeb),{roughness:0.5}), gr=std(lin(0x7d868e),{roughness:0.6});
  const c=box(2.45,2.6,2.45,wh,57.1,1.35,1.975,FA); pick(c,'Білий блок-контейнер біля сходів',`2,45 × 2,45 м (оцінка), двері на південь із жовтою табличкою, кондиціонер збоку. Фото № ${fno('144600','144614')}. ${EST}`);
  box(0.9,2.1,0.03,MW.door,56.9,1.15,3.21,FA);
  box(0.25,0.18,0.02,std(lin(0xf0c419)),57.15,1.6,3.23,FA);
  const g1=box(4.0,2.6,2.4,gr,44.6,1.3,2.1,FA); pick(g1,'Сіра побутівка',`Фото № ${fno('144614','144617','144618')}. ${EST}`); box(0.9,0.9,0.03,MW.wb,44.6,1.6,3.32,FA);
  // кондиціонери (зовнішні блоки) в ряд на землі
  const acT=ctex(128,120,(x,w,h)=>{ x.fillStyle='#eceeee'; x.fillRect(0,0,w,h); x.fillStyle='#9aa1a5'; x.beginPath(); x.arc(w*0.42,h/2,h*0.38,0,7); x.fill(); x.strokeStyle='#eceeee'; x.lineWidth=3; for(let r=8;r<h*0.38;r+=8){ x.beginPath(); x.arc(w*0.42,h/2,r,0,7); x.stroke(); } x.fillStyle='#d5d9da'; for(let y=10;y<h-8;y+=6) x.fillRect(w*0.84,y,w*0.12,3); });
  const acM=[tm(acT,{roughness:0.5}),std(lin(0xeceeee),{roughness:0.5})];
  for(let i=0;i<8;i++){ const a=mesh(new THREE.BoxGeometry(0.95,0.85,0.4),[acM[1],acM[1],acM[1],acM[1],acM[0],acM[1]],FA); a.position.set(31.2+i*0.98,0.5,1.25); pick(a,'Зовнішні блоки кондиціонерів на землі',`Південний проїзд, ≈8 шт. у ряд. Фото № ${fno('144617','144618','124411')}. ${EST}`); }
  [[76.7,0.4],[77.7,0.35],[78.8,0.45]].forEach(([x,d],i)=>{ const r=box(1.1,1.9,d,std(lin(i===1?0x4e6a8c:0x5a6168),{metalness:0.3}),x,0.95,0.75+d/2,FA); r.rotation.x=-0.12; }); }
// ================= 4. ДГУ DALGAKIRAN — деталізований кожух (фото № 67, 68)
{ const X0=66.0, X1=71.0, Y0=-0.95, Y1=-2.7, L=X1-X0, D=Y0-Y1, cx=(X0+X1)/2, cz=-(Y0+Y1)/2;
  const cream='#e7e0ca';
  const side=ctex(1000,390,(x,w,h)=>{ x.fillStyle=cream; x.fillRect(0,0,w,h); x.strokeStyle='#bdb59c'; x.lineWidth=3;
    [[0.0,0.17],[0.17,0.47],[0.47,0.73],[0.73,1]].forEach(([a,b])=>x.strokeRect(a*w+2,6,(b-a)*w-4,h-12));
    x.fillStyle='#bdb59c'; for(let y=24;y<h*0.42;y+=9) x.fillRect(18,y,w*0.13,4); for(let y=h*0.5;y<h-20;y+=9) x.fillRect(w*0.1,y,w*0.055,4);
    x.strokeRect(w*0.02,h*0.48,w*0.075,h*0.46); x.strokeRect(w*0.2,h*0.25,w*0.13,h*0.68); x.strokeRect(w*0.33,h*0.25,w*0.13,h*0.68);
    x.fillStyle='#1d1d1d'; [[0.3,0.55],[0.36,0.55],[0.095,0.62]].forEach(([a,b])=>x.fillRect(a*w,b*h,14,18)); [[0.21,0.3],[0.44,0.3],[0.21,0.86],[0.44,0.86]].forEach(([a,b])=>x.fillRect(a*w,b*h,10,10));
    x.fillStyle='#fff'; x.fillRect(w*0.355,h*0.32,w*0.1,h*0.2); x.fillStyle='#c62f2a'; x.fillRect(w*0.355,h*0.46,w*0.1,h*0.06); x.fillStyle='#1d1d1d'; x.font='bold 11px sans-serif'; x.fillText('ДИЗЕЛЬНІ',w*0.36,h*0.39); x.fillText('ЕЛЕКТРОСТАНЦІЇ',w*0.358,h*0.43);
    x.font='bold 26px sans-serif'; x.fillText('DALGAKIRAN',w*0.205,h*0.84);
    x.save(); x.translate(w*0.8,h*0.9); x.rotate(-Math.PI/2); x.font='bold 44px sans-serif'; x.fillStyle='#1d1d1d'; x.fillText('DALGAKIRAN',0,0); x.restore();
    const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(255,255,255,0.05)'); g.addColorStop(1,'rgba(0,0,0,0.06)'); x.fillStyle=g; x.fillRect(0,0,w,h); });
  const endE=ctex(360,390,(x,w,h)=>{ x.fillStyle=cream; x.fillRect(0,0,w,h); x.strokeStyle='#bdb59c'; x.lineWidth=3; x.strokeRect(6,6,w-12,h-12);
    x.fillStyle='#1d1d1d'; x.font='bold 36px sans-serif'; x.fillText('DALGAKIRAN',22,70); x.font='14px sans-serif'; x.fillText('www.dalgakiran-industrial.com',38,92);
    x.fillStyle='#c62f2a'; x.beginPath(); x.moveTo(118,38); x.lineTo(130,18); x.lineTo(142,38); x.fill(); });
  const endW=ctex(360,390,(x,w,h)=>{ x.fillStyle=cream; x.fillRect(0,0,w,h); x.fillStyle='#b5ad94'; for(let y=20;y<h-20;y+=9) x.fillRect(30,y,w-60,4); });
  const plain=tm(ctex(16,16,(x)=>{ x.fillStyle=cream; x.fillRect(0,0,16,16); }),{roughness:0.55});
  const encl=mesh(new THREE.BoxGeometry(L,1.95,D),[tm(endE,{roughness:0.55}),tm(endW,{roughness:0.55}),plain,plain,tm(side,{roughness:0.55}),plain],FA); encl.position.set(cx,0.45+0.975,cz);
  const base=box(L-0.1,0.33,D-0.05,std(lin(0xe2dbc3),{roughness:0.6}),cx,0.28,cz,FA);
  const skid=box(L+0.15,0.1,D+0.05,std(lin(0xa9b0b4),{metalness:0.6,roughness:0.4}),cx,0.05,cz,FA);
  [[X0+0.35,Y0-0.2],[X1-0.35,Y0-0.2],[X0+0.35,Y1+0.2],[X1-0.35,Y1+0.2]].forEach(([x,y])=>box(0.1,0.14,0.04,std(lin(0x9aa3a8),{metalness:0.6}),x,2.47,-y,FA));
  const ex=mesh(new THREE.CylinderGeometry(0.09,0.09,0.32,10),std(lin(0x3a3a3a),{metalness:0.5}),FA); ex.position.set(X1-0.7,2.56,cz);
  // пучок силових кабелів: від лівого (західного) торця по стіні вгору і у вікно
  const cb=std(lin(0x141618),{roughness:0.5}), cbl=[];
  [[-0.08,0],[0.08,0.06],[0,-0.07]].forEach(([dy,dh])=>{ const c=new THREE.CatmullRomCurve3([W(X0+0.05,Y0-0.5+dy,0.5),W(X0-0.15,Y0-0.35+dy,0.25+dh),W(X0-0.15,-0.62,0.3+dh),W(X0-0.1,-0.62,1.6),W(X0+0.1,-0.6,2.15),W(X0+0.3,-0.48,2.25)],false,'catmullrom',0.4);
    cbl.push(mesh(new THREE.TubeGeometry(c,60,0.05,6,false),cb,FA,false)); });
  [encl,base,skid,ex,...cbl].forEach(o=>pick(o,'Дизель-генератор DALGAKIRAN (ДГУ) у шумозахисному кожусі',`Південний проїзд, праворуч від сходів, уздовж фасаду. Кожух кремовий: ліворуч — жалюзі забору повітря, посередині — двоє дверей обслуговування, табличка «Дизельні електростанції», праворуч — логотип; знизу — паливний бак-рама на оцинкованих полозах. Пучок чорних силових кабелів іде від лівого торця по стіні вгору у вікно. Розміри ≈5,0 × 1,75 × 2,4 м — оцінка за фото; модель і потужність — немає в даних (заводської таблички на фото не видно). Що живить і як вмикається (АВР) — з'ясувати: від цього залежить острівний режим УЗЕ. Фото № ${fno('144546','144600')}. ${EST}`)); }

// ================= 5. ТП з жовтої цегли, адмінкорпус
{ const roofM=std(lin(0x45494c),{roughness:0.95});
  const bbox=(x0,x1,y0,y1,h,t,d)=>{ const w=x1-x0, dd=y1-y0, m=[tm(rep(YBRICK,dd,h)),tm(rep(YBRICK,dd,h)),roofM,roofM,tm(rep(YBRICK,w,h)),tm(rep(YBRICK,w,h))];
    const b=mesh(new THREE.BoxGeometry(w+0.04,h+0.02,dd+0.04),m,FA); b.position.set((x0+x1)/2,h/2,-(y0+y1)/2); if(t) pick(b,t,d); return b; };
  bbox(96.64,103,-0.4,34.6,4.5,'ТП-5913 (прибудова з жовтої цегли)',`Трансформаторна підстанція вздовж південної частини східного фасаду; на сході — ворота камер «Тр-р №6», «Тр-р №7» з жалюзі, вище — жалюзійні ґратки. Фото № ${fno('144836','144847','143856')}. ${EST}`);
  bbox(-0.5,19.5,96.6,107.1,4.5,'ТП-6923 (жовта цегла)',`Біля північно-західного кута цеху, великі жалюзі, приямок уздовж. Фото № ${fno('144221','144132')}. ${EST}`);
  bbox(19.5,24.2,96.6,99.4,3.5,'Цегляна прибудова із сірими воротами',`Фото № ${fno('144049','144102','144109')}. ${EST}`);
  op('T5E',18.5,20.8,0,2.4,'tp6'); op('T5E',21.2,23.9,0,2.4,'tp7'); op('T5E',24.4,25.9,0,2.2,'door'); [[18.7,20.6],[21.4,23.7]].forEach(([a,b])=>op('T5E',a,b,2.8,3.5,'tlouv'));
  [[97.6,99.4],[100.0,101.8]].forEach(([a,b])=>{ op('T5N',a,b,0,2.4,'tp6'); op('T5N',a,b,2.8,3.4,'tlouv'); });
  [[2.0,5.5],[7.5,10.0]].forEach(([a,b])=>op('T6N',a,b,2.3,3.4,'tlouv')); op('T6N',12.5,13.7,0,2.2,'door'); op('T6sN',20.6,23.2,0,2.8,'gate');
  // сіра металева шафа-контейнер біля східного фасаду (фото № 48)
  pick(box(2.3,2.5,2.4,std(lin(0x6f7a83),{metalness:0.3,roughness:0.6}),98.0,1.25,-36.4,FA),'Сірий металевий контейнер-шафа біля ТП-5913',`Фото № ${fno('143856')}. ${EST}`);
  // адмінкорпус (АБК): план — супутник Google (кадр 27.10, прив'язка по дефлекторах цеху, ±0,5 м), два блоки:
  //   південний — 3 поверхи, плаский дах із надбудовою сходів; основний — 4 поверхи, дах арковий уздовж Пн–Пд (фото з даху 27.10).
  //   Висоти — оцінка за поверхами, рулеткою не міряно: нижній 10,0 м, карниз основного 13,2 м, стріла арки 1,3 м (як у прольотів цеху ≈ 1/15).
  { const AL={x0:108.3,x1:127.5,y0:6.6,y1:20.3,h:10.0}, AB={x0:108.5,x1:128.0,y0:20.3,y1:45.2,h:13.2,f:1.3}, ABc=(AB.x0+AB.x1)/2, ABw=(AB.x1-AB.x0)/2, N=28;
    const zA=x=>AB.h+AB.f*Math.max(0,1-((x-ABc)/ABw)**2), xs=i=>AB.x0+(AB.x1-AB.x0)*i/N;
    const conc=std(lin(0xb9b4a6),{roughness:0.9}), dk=std(lin(0x3a3f43),{roughness:0.9}), zn2=std(lin(0xb9c0c4),{metalness:0.6,roughness:0.35}), YBRM=std(lin(0xc49c63),{roughness:0.9});
    const EAB='План — супутник Google 27.10 (±0,5 м). Висоти — оцінка за кількістю поверхів і фото з даху, рулеткою не міряно.';
    const EA='Положення — супутник Google 27.10 (±1 м) і фото з даху 27.10; висота даху — оцінка.';
    bbox(AL.x0,AL.x1,AL.y0,AL.y1,AL.h,'Адмінкорпус — південний блок (3 поверхи)',`${(AL.x1-AL.x0).toFixed(1)} × ${(AL.y1-AL.y0).toFixed(1)} м у плані, висота ≈10,0 м (оцінка). Вхід із козирком із заходу, оцинковані вентканали на південному торці, на даху — цегляна надбудова сходів. Фото № ${fno('144719','144721','144734','144815','111449','111148','111150')}. ${EAB}`);
    bbox(AB.x0,AB.x1,AB.y0,AB.y1,AB.h,'Адмінкорпус — основний блок (4 поверхи, дах арковий)',`${(AB.x1-AB.x0).toFixed(1)} × ${(AB.y1-AB.y0).toFixed(1)} м у плані, карниз ≈13,2 м, гребінь арки ≈14,5 м (оцінка). Дах — арка вздовж Пн–Пд, ринви біля західного і східного парапетів. Нижче покрівлі цеху (≥ 15,9 м) — тіні на дах цеху не дає; тінь на східний фасад цеху вранці враховано в розрахунку фасадних модулів 27.10. Фото № ${fno('110754','110756','110954','112809','123523')}. ${EAB}`);
    // арковий дах: оболонка + цегляне заповнення торців + парапети
    { const pos=[], uv=[], idx=[];
      for(let i=0;i<=N;i++){ const x=xs(i), z=zA(x); pos.push(x,z,-AB.y0, x,z,-AB.y1); uv.push(i/N*6,0, i/N*6,8); }
      for(let i=0;i<N;i++){ const a=2*i; idx.push(a,a+2,a+1, a+1,a+2,a+3); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
      pick(mesh(g,std(lin(0x3c4145),{roughness:0.95,side:THREE.DoubleSide}),FA),'Арковий дах основного блоку АБК (бітумна покрівля)',`Арка вздовж Пн–Пд: проліт ${(AB.x1-AB.x0).toFixed(1)} м, стріла ≈1,3 м (оцінка — виміряти від ринви до гребеня). Шви рулонів уздовж даху, ринви з водою біля парапетів. Фото № ${fno('110754','110756','110826','110917','110928','110954')}. ${EAB}`);
      const sh=new THREE.Shape(); sh.moveTo(AB.x0,AB.h); for(let i=0;i<=N;i++) sh.lineTo(xs(i),zA(xs(i))); sh.lineTo(AB.x0,AB.h);
      const gm=std(lin(0xc49c63),{roughness:0.9,side:THREE.DoubleSide}); [AB.y0-0.02,AB.y1+0.02].forEach(y=>{ const m=mesh(new THREE.ShapeGeometry(sh),gm,FA); m.position.z=-y; });
      const bd=new THREE.Shape(); bd.moveTo(AB.x0,AB.h); for(let i=0;i<=N;i++) bd.lineTo(xs(i),zA(xs(i))+0.5); for(let i=N;i>=0;i--) bd.lineTo(xs(i),zA(xs(i)));
      [AB.y0+0.25,AB.y1].forEach(y=>{ const m=mesh(new THREE.ExtrudeGeometry(bd,{depth:0.25,bevelEnabled:false}),YBRM,FA); m.position.z=-y; pick(m,'Парапет торця АБК по арці',`Цегла з бетонним відливом, ≈0,5 м над покрівлею (оцінка). Фото № ${fno('110925','110917')}. ${EAB}`); });
      pick(box(0.25,0.5,AB.y1-AB.y0,YBRM,AB.x0+0.125,AB.h+0.25,-(AB.y0+AB.y1)/2,FA),'Західний парапет АБК (з боку цеху)',`Низький, обклеєний покрівлею, ≈0,5 м (оцінка); за ним, через проїзд і ТП-5913, — бетонна стіна цеху з вікнами. Фото № ${fno('110750','110752','110917','110927')}. ${EAB}`);
      pick(box(0.25,0.7,AB.y1-AB.y0,YBRM,AB.x1-0.125,AB.h+0.35,-(AB.y0+AB.y1)/2,FA),'Східний парапет АБК',`Цегла з бетонним відливом, ≈0,7 м (оцінка); біля нього ринва з водою. Фото № ${fno('110904','110954','110949')}. ${EAB}`); }
    // південний блок: парапети і надбудова сходів
    [[AL.x0,AL.x1,AL.y0,AL.y0+0.25],[AL.x0,AL.x0+0.25,AL.y0,AL.y1],[AL.x1-0.25,AL.x1,AL.y0,AL.y1]].forEach(([x0,x1,y0,y1])=>box(x1-x0,0.5,y1-y0,YBRM,(x0+x1)/2,AL.h+0.25,-(y0+y1)/2,FA));
    pick(box(5.2,2.6,9.8,YBRM,118.9,AL.h+1.3,-12.9,FA),'Цегляна надбудова сходів на південному блоці АБК',`≈5,2 × 9,8 м (супутник), верх ≈1,5 м нижче даху основного блоку (фото), ≈2,6 м над нижнім дахом (оцінка). Фото № ${fno('112809','123523','111150')}. ${EAB}`);
    // вікна: захід — південний блок 3 ряди (без місця входу), основний 4 ряди; південь — торець південного блоку і стіна основного над нижнім дахом
    for(let r=0;r<3;r++) [8.3,11.9,15.5,19.1].forEach(y=>{ if(r===0&&y<12.5) return; op('AW',y-0.8,y+0.8,1.0+r*3.2,2.5+r*3.2,'adm'); });
    for(let r=0;r<4;r++) for(let k=0;k<7;k++){ const y=22.2+k*3.5; op('AW2',y-0.8,y+0.8,1.0+r*3.2,2.5+r*3.2,'adm'); }
    for(let r=0;r<3;r++) [111.6,123.6].forEach(x=>op('AS',x-0.8,x+0.8,1.0+r*3.2,2.5+r*3.2,'adm'));
    op('AS',117.6,120.6,0,3.0,'gate'); [111.0,114.5,122.5,126.0].forEach(x=>op('AS2',x-0.8,x+0.8,10.9,12.3,'adm'));
    const zn=std(lin(0xb9c0c4),{metalness:0.6,roughness:0.35}); [114.6,115.5].forEach(x=>box(0.6,8.2,0.35,zn,x,6.3,-6.4,FA));
    pick(box(2.4,3.0,3.2,std(lin(0xd8b2a4),{roughness:0.8}),107.1,1.5,-10.25,FA),'Вхід в адмінкорпус з козирком',`Фото № ${fno('144721','111449')}. ${EST}`); box(2.8,0.08,3.8,std(lin(0xeeeeee)),106.9,3.05,-10.25,FA);
    // на арковому даху: 5 круглих вентшахт, високий і низький оцинковані вентвиходи, сталевий пруток біля західного парапету
    [[111.4,40.4],[120.8,40.4],[116.6,27.8],[119.6,21.9],[122.2,21.9]].forEach(([x,y])=>{ const z=zA(x), v=mesh(new THREE.CylinderGeometry(0.6,0.62,0.7,20),dk,FA); v.position.set(x,z+0.35,-y);
      const c=mesh(new THREE.CylinderGeometry(0.62,0.62,0.08,20),conc,FA); c.position.set(x,z+0.74,-y);
      [v,c].forEach(o=>pick(o,'Кругла вентшахта на даху АБК',`Бетонна кришка ≈1,2 м (рулетка, фото № ${fno('111051')}), обклеєна покрівлею, мох; на фото — не менше 5. Фото № ${fno('110756','110839','110927','111019')}. ${EA}`)); });
    pick(box(0.6,1.5,0.7,zn2,116.8,zA(116.8)+0.75,-42.3,FA),'Високий оцинкований вентвихід з козирком (дах АБК)',`Фото № ${fno('110912','110957','110826')}. ${EA}`);
    pick(box(0.9,0.45,0.6,zn2,118.0,zA(118.0)+0.23,-43.0,FA),'Низький напівкруглий оцинкований вентвихід (дах АБК)',`Фото № ${fno('110907','110909','110957')}. Те, що 27.10 підписали як «дві супутникові антени» (фото № ${fno('110957')}), — це ці два оцинковані вентвиходи; антен на даху не видно. ${EA}`);
    pick(box(0.03,0.03,AB.y1-AB.y0,zn2,109.0,zA(109.0)+0.05,-(AB.y0+AB.y1)/2,FA),'Сталевий пруток по покрівлі АБК (блискавкозахист / заземлення)',`Пруток Ø≈8–10 мм на тримачах уздовж західного парапету (фото № ${fno('110925')}). ${EA}`); } }

// ================= 6. Західна будівля: вікна, драбини, труба, кондиціонер
{ const top=HV+6.8;
  for(let r=0;r<5;r++) [-10.2,-6.15,-2.1].forEach(x=>{ op('WN',x-0.7,x+0.7,1.2+r*4.0,2.8+r*4.0,'wb'); op('WS',x-0.7,x+0.7,1.2+r*4.0,2.8+r*4.0,'wb'); });
  [72.6,75.6].forEach(y=>op('WE',y-0.55,y+0.55,HV+0.7,HV+2.25,'wbar'));
  const st=std(lin(0x5e676d),{metalness:0.5,roughness:0.5});
  [88.3,3.0].forEach(y=>{ [-0.22,0.22].forEach(d=>{ const r=mesh(new THREE.CylinderGeometry(0.02,0.02,top-HV+0.6,5),st,FA,false); r.position.set(0.0,(top+HV+0.6)/2,-(y+d)); });
    const n=Math.floor((top-HV)/0.3), rg=inst(new THREE.BoxGeometry(0.03,0.03,0.44),st,n,FA,false); for(let k=0;k<n;k++){ _M.compose(new V3(0.0,HV+0.3+k*0.3,-y),QI,ONE); rg.setMatrixAt(k,_M); }
    pick(rg,'Вертикальна драбина на західну будівлю',`Фото № ${fno('123945','124100')}. ${EST}`); });
  const p=new THREE.CatmullRomCurve3([W(0.0,58,HV+1.5),W(0.0,85.6,HV+1.5),W(0.0,85.8,HV+0.3)],false,'catmullrom',0.05);
  pick(mesh(new THREE.TubeGeometry(p,80,0.04,6,false),std(lin(0xcfd3d4)),FA,false),'Труба вздовж стіни західної будівлі',`На ≈1,5 м над покрівлею, спускається біля дверей. Фото № ${fno('123948','124011')}. ${EST}`);
  box(0.3,0.55,0.8,std(lin(0xeeeeee),{roughness:0.5}),0.0,HV+1.8,-85.2,FA);
  const v=mesh(new THREE.CylinderGeometry(0.2,0.2,0.1,14),std(lin(0x2d3236)),FA,false); v.rotation.z=Math.PI/2; v.position.set(-0.1,HV+2.2,-89.3); }

// ================= 7. Покриття двору: бетонні плити в південному проїзді, асфальт на сході і новий асфальт на півночі
{ const slab=ctex(256,256,(x,w,h)=>{ x.fillStyle='#a3a29b'; x.fillRect(0,0,w,h); for(let i=0;i<3000;i++){ x.fillStyle=rnd()<0.5?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.06)'; x.fillRect(rnd()*w,rnd()*h,2,2); }
    for(let i=0;i<6;i++){ x.fillStyle=`rgba(70,60,50,${0.05+rnd()*0.08})`; x.beginPath(); x.ellipse(rnd()*w,rnd()*h,20+rnd()*40,10+rnd()*20,rnd()*3,0,7); x.fill(); }
    x.fillStyle='#55534d'; x.fillRect(0,0,w,3); x.fillRect(0,h/2,w,3); x.fillRect(0,0,3,h); });
  const asph=(c)=>ctex(256,256,(x,w,h)=>{ x.fillStyle=c; x.fillRect(0,0,w,h); for(let i=0;i<4000;i++){ x.fillStyle=rnd()<0.5?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.05)'; x.fillRect(rnd()*w,rnd()*h,1.5,1.5); } });
  const pl=(x0,x1,y0,y1,t,tx,ty)=>{ const m=mesh(new THREE.PlaneGeometry(x1-x0,y1-y0),tm(rep(t,(x1-x0)/tx,(y1-y0)/ty),{roughness:0.95}),FA,false); m.rotation.x=-Math.PI/2; m.position.set((x0+x1)/2,-0.006,-(y0+y1)/2); m.receiveShadow=true; return m; };
  pl(-14,98.1,-16,-0.5,slab,6,6); pl(96.64,110,-8,105,asph('#64676a'),8,8); pl(-14,96.64,96.59,110,asph('#3f4245'),8,8); }

// ================= 8. Кольори за фото: покрівля цеху — темний бітумний рулон, склад — сірий профнастил
MAT.roof.color.copy(lin(0x6d7174)); MAT.whWall.color.copy(lin(0x737b81)); MAT.whRoof.color.copy(lin(0xc3c8cb)); MAT.tp.color.copy(lin(0xc2a06a));
flush();
pick(QM.up,'Великі вікна верхнього ряду (схід, північ)',`Білі рами ПВХ, світле дзеркальне скло, жалюзі; ≈4,4 × 3,1 м, низ на ≈6,6 м. Фото № ${fno('143918','144049')}. ${EST}`);
pick(QM.tall,'Високі вікна (схід, північ)',`≈4,4–5,2 × 4,6 м. Фото № ${fno('144049','143856')}. ${EST}`);
pick(QM.bar,'Нижні вікна з іржавими ґратами',`Темне скло, сталеві рами, ґрати; низ на ≈1,3 м. Фото № ${fno('143918','144024','144049')}. ${EST}`);
pick(QM.grid,'Нижні вікна з білими ґратами (південь)',`Фото № ${fno('144614','144600')}. ${EST}`);
pick(QM.rib,'Стрічкові вікна з рудими дерев\'яними рамами (південь)',`Фото № ${fno('144546','144600','144615')}. ${EST}`);
pick(QM.louv,'Малі вікна з ґратками вентиляції (південь, ≈5,3 м)',`Фото № ${fno('144614','144600')}. ${EST}`);
pick(QM.sect,'Чорні секційні ворота з хвірткою',`≈3 × 3,9 м. Фото № ${fno('144600','144614')}. ${EST}`);
pick(QM.gate,'Сірі розпашні металеві ворота з хвірткою',`Фото № ${fno('143918','144546','144102')}. ${EST}`);
['tp6','tp7'].forEach(k=>QM[k]&&pick(QM[k],'Ворота камер трансформаторів',`Жалюзі знизу й угорі, знак «Обережно, електрична напруга». Фото № ${fno('144836')}. ${EST}`));
QM.old&&pick(QM.old,'Старі вікна над ТП-5913',`Фото № ${fno('143856')}. ${EST}`);
QM.adm&&pick(QM.adm,'Вікна адмінкорпусу (ПВХ)',`Розташування умовне. Фото № ${fno('144719','144721')}. ${EST}`);
QM.wb&&pick(QM.wb,'Вікна західної будівлі',`Північний і південний торці — розташування умовне (5 поверхів). Фото № ${fno('144221','144049')}. ${EST}`);
QM.wbar&&pick(QM.wbar,'Вікна західної будівлі на рівні даху цеху',`Фото № ${fno('124100','124103')}. ${EST}`);
window.__twin.fasad={FA,QM};
}
