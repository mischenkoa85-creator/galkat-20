// ================= Ліхтарі 28.10 у деталях — src/lan28.js (дані LAN28 ← кошторис покриття 28.10; модулі — ROOF28.V[k].frame)
// Конструкція кожного з 4 ліхтарів на даху 28.10 (roof28.js): бортик, каркас 13°, прогони П-1…П-3 і три покриття —
// А «панелі замість даху», Б профнастил ПК-20 з міні-рейками, Б сендвіч з рейками; 2 — модулі на наявному склі; етапи «як є → демонтаж → готово».
// Осі ліхтарів — ROOF28.frames (розріз 1-1, РП, Google Maps і фото 123924: на ≈1,5 м східніше центру арки). Модулі — ті самі місця, що в розкладці В1 / В2.
// Та сама модель — у каталозі «Елементи СЕС» → Ліхтарі (elements-ses/calculator/lihtar).
{ const R28=window.__twin.r28, COV=(typeof LAN28!=='undefined')?LAN28:null; if(R28&&COV){
const CURB={out:1.83,inn:1.435,top:0.30,endT:0.40};
const FR={half:1.5,ang:13}; FR.rise=FR.half*Math.tan(FR.ang*D2R); FR.len=FR.half/Math.cos(FR.ang*D2R); FR.top=CURB.top+FR.rise;
const GL={half:1.83,ridge:1.89}; GL.th=Math.atan((GL.ridge-CURB.top)/GL.half); GL.slope=Math.hypot(GL.half,GL.ridge-CURB.top);
const MOD={L:2.384,W:1.303,T:0.033,kg:36.5,P:0.730,step:1.325,gapN:0.12,u0:0.02,cl:0.54};
const MRH=0.025, MRL=0.38;
const ARCH=[[-0.13,17.87],[18.14,35.86],[36.39,54.10],[54.39,72.11]];   // арки 18 м між ендовами (розріз 1-1)
const LANS=R28.D.frames.map((F,i)=>({id:F.id,i,xc:F.xc,a:ARCH[i][0],b:ARCH[i][1],y0:F.y0,y1:F.y1,L:F.y1-F.y0,zb:roofZ(F.xc-CURB.out)}));
const KS=Object.keys(R28.D.V), VN={'1':'В1','2':'В2'};
// модулі на кожному ліхтарі для В1 / В2: [y низу, стрінг або null, кВт·год за рік]
const MDS={}; KS.forEach(k=>{ MDS[k]=LANS.map((L,i)=>{ const o={E:[],W:[]}; R28.D.V[k].frame.filter(m=>m[0]===i+1).forEach(m=>o[m[1]].push([m[2],m[5]>=0?'Л '+(m[5]+1):null,m[4]])); o.E.sort((a,b)=>a[0]-b[0]); o.W.sort((a,b)=>a[0]-b[0]); return o; }); });
const runs=list=>{ const out=[]; let r=null; list.forEach(m=>{ if(!r||m[0]>r[r.length-1][0]+MOD.step+0.05){ r=[]; out.push(r); } r.push(m); }); return out; };   // безперервні ділянки (у В1 — розриви на проходах)
const angYs=L=>{ const n=Math.round(L.L/3.04); return Array.from({length:n+1},(_,k)=>L.y0+k*L.L/n); };
const TAG={r:'рулетка',o:'власник',f:'фото',k:'креслення',u:'умовно',n:'немає в даних',c:'розрахунок'};
const tg=(...ks)=>` (${ks.map(k=>TAG[k]).join(', ')})`;
const NM28={pa:'А · панелі замість даху',pn:'Б · профнастил',sw:'Б · сендвіч',v2:'2 · модулі на склі'};
if(state.lay.l28===undefined) state.lay.l28=true;
if(!NM28[state.lay.l28v]) state.lay.l28v='pn';
if(![0,1,2].includes(state.lay.l28s)) state.lay.l28s=2;
const KK=()=>MDS[state.lay.r28]?state.lay.r28:KS[0];
const ON=()=>!!(R28.ON()&&state.lay.l28);
// ---------- геометрія (та сама, що в моделі ліхтаря; X від осі ліхтаря, Y — абсолютна, Z від покрівлі біля бортика)
const LGR=grp('lan28',G.ours);
const M=(c,o={})=>{ const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.75,metalness:0.05},o)); m.color.convertSRGBToLinear(); return m; };
const inf=(o,t,d)=>{ o.userData.info={t,d}; PICK.push({o}); return o; };
const along=(p0,p1,shape,mat,upHint)=>{ const d=new V3().subVectors(p1,p0), L=d.length(); d.normalize();
  const g=new THREE.ExtrudeGeometry(shape,{depth:L,bevelEnabled:false});
  const up=(upHint||new V3(0,1,0)).clone(); up.sub(d.clone().multiplyScalar(up.dot(d))).normalize();
  const x=new V3().crossVectors(up,d);
  const m=new THREE.Mesh(g,mat); m.quaternion.setFromRotationMatrix(new M4().makeBasis(x,up,d)); m.position.copy(p0); m.castShadow=true; m.receiveShadow=true; return m; };
const instAlong=(p0,p1,shape,mat,ys,grp_,infoFn,up)=>{ const base=along(p0,p1,shape,mat,up); base.updateMatrix();
  const im=new THREE.InstancedMesh(base.geometry,mat,ys.length), t=new M4();
  ys.forEach((y,i)=>{ t.makeTranslation(0,0,-y).multiply(base.matrix); im.setMatrixAt(i,t); });
  im.castShadow=true; im.receiveShadow=true; grp_.add(im); if(infoFn){ im.userData.info=i=>infoFn(i); PICK.push({o:im}); } return im; };
const instObj=(geo,mat,list,grp_,infoFn)=>{ const im=new THREE.InstancedMesh(geo,mat,list.length), m4=new M4(), one=new V3(1,1,1), q0=new Q();
  list.forEach(([p,q],i)=>{ m4.compose(p,q||q0,one); im.setMatrixAt(i,m4); });
  im.castShadow=true; im.receiveShadow=true; grp_.add(im); if(infoFn){ im.userData.info=i=>infoFn(i); PICK.push({o:im}); } return im; };
const rectS=(w,h,cx=0,cy=0)=>{ const s=new THREE.Shape(); s.moveTo(cx-w/2,cy-h/2); s.lineTo(cx+w/2,cy-h/2); s.lineTo(cx+w/2,cy+h/2); s.lineTo(cx-w/2,cy+h/2); s.closePath(); return s; };
const angS=(a,t)=>{ const s=new THREE.Shape(); s.moveTo(-a/2,0); s.lineTo(a/2,0); s.lineTo(a/2,t); s.lineTo(-a/2+t,t); s.lineTo(-a/2+t,a); s.lineTo(-a/2,a); s.closePath(); return s; };
const prismXZ=(pts,ya,yb,mat)=>{ const s=new THREE.Shape(); pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:yb-ya,bevelEnabled:false});
  const m=new THREE.Mesh(g,mat); m.position.set(0,0,-ya); m.scale.set(1,1,-1); m.castShadow=true; m.receiveShadow=true; g.computeVertexNormals(); return m; };
const quad=(a,b,c,d,mat)=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute([...a.toArray(),...b.toArray(),...c.toArray(),...a.toArray(),...c.toArray(),...d.toArray()],3));
  g.computeVertexNormals(); const m=new THREE.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; return m; };
const tri=(a,b,c,mat)=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute([...a.toArray(),...b.toArray(),...c.toArray()],3)); g.computeVertexNormals(); const m=new THREE.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; return m; };
const lns=(segs,color,grp_,op)=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(segs.flatMap(v=>v.toArray()),3));
  const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:op||1})); grp_.add(m); return m; };
const quatB=(a,n,b)=>new Q().setFromRotationMatrix(new M4().makeBasis(a,n,b));

// ---------- матеріали (спільні для 4 ліхтарів)
const GH={mats:[]};
const MT28=(()=>{ const cvm=document.createElement('canvas'); cvm.width=132; cvm.height=240; const mx=cvm.getContext('2d');
  mx.fillStyle='#1d2a3a'; mx.fillRect(0,0,132,240); mx.strokeStyle='rgba(160,180,205,0.35)'; mx.lineWidth=1;
  for(let i=1;i<6;i++){ mx.beginPath(); mx.moveTo(i*22,0); mx.lineTo(i*22,240); mx.stroke(); }
  for(let j=1;j<22;j++){ mx.beginPath(); mx.moveTo(0,j*240/22); mx.lineTo(132,j*240/22); mx.stroke(); }
  mx.strokeStyle='#c9ced3'; mx.lineWidth=4; mx.strokeRect(2,2,128,236);
  const txm=new THREE.CanvasTexture(cvm); txm.encoding=THREE.sRGBEncoding; txm.anisotropy=4;
  const mMod=new THREE.MeshStandardMaterial({map:txm,roughness:0.35,metalness:0.15}), mSideM=M(0xb9bec4,{metalness:0.5,roughness:0.4});
  const mModL=new THREE.MeshStandardMaterial({map:txm,color:0xf2c14e,roughness:0.4,metalness:0.1}); mModL.color.convertSRGBToLinear();
  const mGlass=new THREE.MeshStandardMaterial({color:0x9fc6d8,transparent:true,opacity:0.32,roughness:0.15,metalness:0.0,side:THREE.DoubleSide,depthWrite:false}); mGlass.color.convertSRGBToLinear();
  const mAl=M(0x8f9aa2,{metalness:0.6,roughness:0.35}), mGab=M(0x7d8a8f,{roughness:0.7,metalness:0.3,side:THREE.DoubleSide});
  const gGlass=mGlass.clone(), gAl=mAl.clone(), gGab=mGab.clone();
  [gGlass,gAl,gGab].forEach(m=>{ m.transparent=true; m.userData.op0=m.opacity; GH.mats.push(m); });
  const cov=k=>({edge:k==='pn'?M(0x7c8489,{metalness:0.35,roughness:0.5}):M(0xd9b75f,{roughness:0.95}),bot:M(k==='pn'?0x7c8489:0xf2f2ee,{roughness:0.8}),
    fl:k==='pn'?M(0x8f979c,{metalness:0.35,roughness:0.45}):M(0xe9ebe5,{roughness:0.5}),
    gm:k==='pn'?M(0x8f979c,{metalness:0.3,roughness:0.5,side:THREE.DoubleSide}):M(0xe9ebe5,{roughness:0.6,side:THREE.DoubleSide})});
  return {mMod,mModL,mSideM,matsS:[mSideM,mSideM,mMod,mSideM,mSideM,mSideM],matsL:[mSideM,mSideM,mModL,mSideM,mSideM,mSideM],
    geoM:new THREE.BoxGeometry(MOD.W,MOD.T,MOD.L),glass:[mGlass,mAl,mGab],ghost:[gGlass,gAl,gGab],
    curb:M(0x55524c,{roughness:0.95}),ang:M(0x7a4a2c,{roughness:0.6,metalness:0.3}),beam:M(0xd9d6cf,{roughness:0.55,metalness:0.35}),side:M(0x6e4a32,{roughness:0.6,metalness:0.3}),
    stud:M(0xb8b4ab,{metalness:0.6,roughness:0.4}),rail:M(0xa7adb3,{metalness:0.55,roughness:0.4}),bk:M(0x8b9196,{metalness:0.5,roughness:0.45}),
    pur:M(0x5d666d,{metalness:0.45,roughness:0.5}),pad:M(0x3e4246,{metalness:0.3,roughness:0.7}),pn:cov('pn'),sw:cov('sw'),
    gStud:new THREE.CylinderGeometry(0.006,0.006,0.08,6),gBk:new THREE.BoxGeometry(0.06,0.075,0.05),gPad:new THREE.BoxGeometry(0.12,0.012,0.10),
    joint:M(0x6b7075,{metalness:0.5,roughness:0.45}),epdm:M(0x161616,{roughness:0.9}),tops:{pn:[],sw:[]},gMR:new THREE.BoxGeometry(MRL,MRH,0.07),gCl:new THREE.BoxGeometry(0.045,0.012,0.06),clamp:M(0x9aa3aa,{metalness:0.6,roughness:0.35}),
    hole:M(0x2b2d2f,{roughness:1})}; })();
const MT=MT28;
const KV2={E:1051/1170,W:953/1122};   // модуль на склі 41–46° проти 13°: опромінення площини, розрахунок 28.10

function buildLantern(L){
  const g={L}, root=new THREE.Group(); root.position.set(L.xc,L.zb,0); LGR.add(root); g.root=root;
  const rz=x=>roofZ(L.xc+x)-L.zb, y0=L.y0, y1=L.y1, AY=angYs(L), id=L.id;
  const grpL=(parent,name)=>{ const x=new THREE.Group(); parent.add(x); g[name]=x; return x; };
  const tanA=Math.tan(FR.ang*D2R);
  // ---- бортик і проріз
  grpL(root,'curb');
  const curbInfo=[`Бортик ліхтаря ${id} з руберойдом`,`По низу ${nf(2*CURB.out,2)} м${tg('r')}; висота 0,30–0,40 м${tg('o')} (у моделі 0,30). Вісь — X ${nf(L.xc,2)} м: на ≈${nf(L.xc-(L.a+L.b)/2,1)} м східніше центру арки${tg('k')} (розріз 1-1, РП, Google Maps, фото 123924). Проріз 2,87 м${tg('k')}. Матеріал і ширина по верху${tg('n')}.`];
  const endPts=[]; for(let i=0;i<=12;i++){ const x=-CURB.inn+2*CURB.inn*i/12; endPts.push([x,rz(x)]); } endPts.push([CURB.inn,CURB.top],[-CURB.inn,CURB.top]);
  [prismXZ([[-CURB.out,rz(-CURB.out)],[-CURB.inn,rz(-CURB.inn)],[-CURB.inn,CURB.top],[-CURB.out,CURB.top]],y0-CURB.endT,y1+CURB.endT,MT.curb),
   prismXZ([[CURB.inn,rz(CURB.inn)],[CURB.out,rz(CURB.out)],[CURB.out,CURB.top],[CURB.inn,CURB.top]],y0-CURB.endT,y1+CURB.endT,MT.curb),
   prismXZ(endPts,y0-CURB.endT,y0,MT.curb),prismXZ(endPts,y1,y1+CURB.endT,MT.curb)].forEach(m=>{ g.curb.add(m); inf(m,...curbInfo); });
  { let zh=-1; for(let i=0;i<=12;i++) zh=Math.max(zh,rz(-CURB.inn+2*CURB.inn*i/12)); zh+=0.012;
    const h=quad(W(-CURB.inn,y0,zh),W(CURB.inn,y0,zh),W(CURB.inn,y1,zh),W(-CURB.inn,y1,zh),MT.hole); h.castShadow=false; g.curb.add(h);
    inf(h,`Проріз ліхтаря ${id} — під ним цех`,`${nf(2*CURB.inn,2)} × ${nf(L.L,1)} м${tg('k')}. Під прорізом — сітка-рабиця${tg('f')}.`); }
  // ================= ВАРІАНТ 1: що лишається після демонтажу
  const v1=grpL(root,'v1'); grpL(v1,'v1ang'); grpL(v1,'v1beam'); grpL(v1,'v1mesh');
  const angInfo=()=>({t:`Кутник каркаса 13° · ${id}`,d:`Поперечний кутник від середньої балки до бічної — «доміком», по 2 на перетин, ${AY.length} перетинів. Кут 13°${tg('o')} (фото 12,2° ± 0,5°${tg('f')}). При каркасі 3,0 м${tg('o')} — ${nf(FR.len,2)} м по схилу, підйом ${nf(FR.rise,2)} м. Крок ${nf(AY[1]-AY[0],2)} м і переріз 63×63 — умовно${tg('u')}.`});
  const frameInto=(target,withInfo)=>{
    [-1,1].forEach(sg=>instAlong(W(sg*FR.half,0,CURB.top),W(0.04*sg,0,CURB.top+(FR.half-0.04)*tanA),angS(0.063,0.005),MT.ang,AY,target,withInfo?angInfo:()=>({t:`Каркас ${id} під склінням`,d:`Кутники 13°, бічні і середня балки. У варіанті 2 лишається як є; чи можна передати на нього навантаження від модулів${tg('n')}.`})));
    const sInfo=[`Бічна балка каркаса ${id}`,`По верху бортика на ${nf(FR.half,2)} м від осі (каркас 3,0 м${tg('o')}); на неї спираються кутники. Переріз (у моделі кутник 63) і кріплення до бортика${tg('n')}.`];
    [-1,1].forEach(sg=>{ const m=along(W(sg*FR.half,y0,CURB.top),W(sg*FR.half,y1,CURB.top),angS(0.063,0.005),MT.side); target.add(m); inf(m,...sInfo); });
    const mid=along(W(0,y0,FR.top-0.10),W(0,y1,FR.top-0.10),rectS(0.08,0.12,0,0.06),MT.beam); target.add(mid);
    inf(mid,`Середня балка ${id} з різьбовими шпильками`,`Поздовжня балка по осі ліхтаря, на ${nf(FR.rise,2)} м вище бічних (13° при 3,0 м${tg('c')}). На ній шпильки${tg('f')}; стійки до гребеня скління знімаємо. Переріз, опори між фермами і крок шпильок${tg('n')}.`);
  };
  frameInto(g.v1ang,true); g.v1beam.add(...g.v1ang.children.slice(2));
  instObj(MT.gStud,MT.stud,AY.slice(1,-1).flatMap(y=>[-0.025,0.025].map(dx=>[W(dx,y+0.12,FR.top+0.06)])),g.v1beam,()=>({t:'Шпильки на середній балці',d:`Видно на фото зсередини${tg('f')}; крок${tg('n')}.`}));
  const zm=CURB.top-0.03, ms=[];
  for(let x=-CURB.inn;x<=CURB.inn+1e-6;x+=0.24) ms.push(W(x,y0,zm),W(x,y1,zm));
  for(let y=y0;y<=y1+1e-6;y+=0.24) ms.push(W(-CURB.inn,y,zm),W(CURB.inn,y,zm));
  lns(ms,0x8d8c84,g.v1mesh,0.5);
  // ---- скління: «що знімаємо» (варіант 1) або наявний ліхтар (варіант 2)
  const glazing=(target,mats,ghost)=>{
    const [mG,mA,mGb]=mats, add=(o,t,d)=>{ target.add(o); inf(o,t,d); return o; };
    const gt=`Скління ${id} — полікарбонат в алюмінієвих профілях`, gd=`Схил ${nf(GL.th/D2R,0)}° і ${nf(GL.slope,2)} м від верху бортика (низ ${nf(2*GL.half,2)} м, гребінь ${nf(GL.ridge,2)} м над покрівлею${tg('r')}); фото 41,5–43°${tg('f')}, РП 46°${tg('k')}.${ghost?' Знімаємо.':''}`;
    [-1,1].forEach(sg=>add(quad(W(sg*GL.half,y0,CURB.top),W(sg*GL.half,y1,CURB.top),W(0,y1,GL.ridge),W(0,y0,GL.ridge),mG),gt,gd));
    [y0,y1].forEach(y=>add(tri(W(-GL.half,y,CURB.top),W(GL.half,y,CURB.top),W(0,y,GL.ridge),mGb),`Торець ${id}`,`Сталевий лист з утеплювачем${tg('f')}.${ghost?' Знімаємо.':''}`));
    const at=`Алюмінієві профілі скління ${id}`, ad=`Гребінь, низ і ребра по схилу; переріз і крок ребер${tg('n')}, у моделі — на кроці кутників${tg('u')}.`;
    add(along(W(0,y0,GL.ridge-0.03),W(0,y1,GL.ridge-0.03),rectS(0.08,0.06),mA),at,ad);
    [-1,1].forEach(sg=>add(along(W(sg*GL.half,y0,CURB.top),W(sg*GL.half,y1,CURB.top),rectS(0.06,0.06,0,0.03),mA),at,ad));
    [-1,1].forEach(sg=>instAlong(W(sg*(GL.half-0.02),0,CURB.top+0.02),W(0.02*sg,0,GL.ridge-0.03),rectS(0.05,0.05),mA,AY,target,()=>({t:at,d:ad})));
    instAlong(W(0,0,FR.top+0.02),W(0,0,GL.ridge-0.06),rectS(0.05,0.05),mA,AY.slice(1,-1).map(y=>y+0.12),target,()=>({t:`Стійка ${id} від середньої балки до гребеня`,d:`Видно на фото зсередини${tg('f')}; тримає гребінь скління.${ghost?' Знімаємо.':''}`}),new V3(1,0,0));
  };
  glazing(grpL(v1,'ghost'),MT.ghost,true);
  // ---- покриття (варіант 1): прогони П-1…П-3, профнастил або сендвіч, оздоблення, рейки, модулі
  const th=FR.ang*D2R, cs=Math.cos(th), sn=Math.sin(th), Z0A=CURB.top+FR.half*tanA+0.065, SL=COV.q.SLP;
  const YA=y0-0.35, YB=y1+0.35, YM=(YA+YB)/2, LEN=YB-YA;
  const pt=(sg,u,d,y)=>W(sg*(u*cs+d*sn),y,Z0A-u*sn+d*cs);
  const nrm=sg=>new V3(sg*sn,cs,0), qS=sg=>quatB(new V3(0,0,sg>0?-1:1),nrm(sg),new V3(sg*cs,-sn,0));
  const UP1=0.10/cs, UP2=0.02+MOD.cl, UP3=0.02+MOD.L-MOD.cl, d3=(CURB.top+0.01-(Z0A-UP3*sn))/cs;
  grpL(v1,'covPur');
  const purInfo={1:[`П-1 ${id} — труба 100×50×2 біля гребеня`,`0,10 м від осі, на кутниках; тримає верх покриття і коньок. Зварювання або болти${tg('o')}.`],
    2:[`П-2 ${id} — труба 100×50×3 під верхньою рейкою`,`${nf(UP2*cs,2)} м від осі, у зоні притисків ZNSHINE. Проліт = крок кутників (умовно): ${nf(COV.chk.sig,0)} МПа, прогин ${nf(COV.chk.f,1)} мм — проходить${tg('c')}. На кутник ${nf(COV.chk.P,1)} кН: кутник 63×63 (умовно) не проходить — ${nf(COV.chk.siga,0)} МПа${tg('c')}.`],
    3:[`П-3 ${id} — труба 80×40×2 на бортику`,`${nf(UP3*cs,2)} м від осі, під нижньою рейкою; на підкладках, анкер M10 через 1,0 м. Матеріал бортика${tg('n')}.`]};
  [-1,1].forEach(sg=>{
    [[1,UP1,0.10,0.05,0.05],[2,UP2,0.10,0.05,0.05],[3,UP3,0.08,0.04,d3+0.04]].forEach(([k,u,h,w,dc])=>{ const m=along(pt(sg,u,dc,y0-0.15),pt(sg,u,dc,y1+0.15),rectS(w,h),MT.pur,nrm(sg)); g.covPur.add(m); inf(m,...purInfo[k]); });
    const pads=[]; for(let y=y0-0.1;y<=y1+0.11;y+=1.0) pads.push([W(sg*(UP3*cs+(d3+0.04)*sn),y,CURB.top+0.006)]);
    instObj(MT.gPad,MT.pad,pads,g.covPur,()=>({t:`Підкладка з анкером M10 під П-3 · ${id}`,d:`Через 1,0 м по бортику${tg('u')}.`}));
  });
  // модулі В1 / В2 (місця з розкладки даху 28.10)
  const MDk=k=>MDS[k][L.i], nmk=k=>MDk(k).E.length+MDk(k).W.length;
  const modInfo=(where,isV2,k)=>m=>{ const kwh=m.kwh*(isV2?KV2[m.sd]:1);
    return {t:`Модуль ${m.k+1} з ${nmk(k)} · ${id} · ${m.sd==='E'?'схід':'захід'} · ${m.name?'стрінг '+m.name:'поза стрінгами — на освітлення цеху'}`,
      d:`≈${nf(kwh,0)} кВт·год за рік · ${m.name?'у мережу':'на освітлення'}. ${isV2?'Перераховано з 13° на скло 41–46° за опроміненням площини (розрахунок 28.10). ':`Розрахунок v3 для розкладки ${VN[k]} (тінь від сусідніх елементів). `}ZNSHINE ZXN8-BD132-730, 730 Вт, 2 384 × 1 303 × 33, 36,5 кг${tg('k')}. ${where}`}; };
  const modsInst=(target,place,infoFn,k)=>{ const S=[], Lt=[], mS=[], mL=[], MD=MDk(k);
    ['E','W'].forEach(sd=>{ const sg=sd==='E'?1:-1; MD[sd].forEach(([y,name,kwh],j)=>{ const it=place(sg,y+MOD.W/2); (name?S:Lt).push(it); (name?mS:mL).push({sd,k:j,name,kwh}); }); });
    if(S.length) instObj(MT.geoM,MT.matsS,S,target,i=>infoFn(mS[i])); if(Lt.length) instObj(MT.geoM,MT.matsL,Lt,target,i=>infoFn(mL[i])); };
  const edges=list=>{ const gap=MOD.step-MOD.W, out=[]; runs(list).forEach(r=>{ const ys=r.map(m=>m[0]); out.push([ys[0]-gap/2,1]); ys.forEach((y,j)=>out.push([y+MOD.W+gap/2,j===ys.length-1?2:0])); }); return out; };   // [y, 0 — стик, 1 — початок ряду, 2 — кінець]
  const clY=(y,f)=>f===1?y+0.03:f===2?y-0.03:y;
  const ribTex=(pitch,col,dark)=>{ const c=document.createElement('canvas'); c.width=64; c.height=8; const x=c.getContext('2d'); x.fillStyle=col; x.fillRect(0,0,64,8); x.fillStyle=dark; x.fillRect(0,0,14,8); x.fillStyle='rgba(255,255,255,0.28)'; x.fillRect(16,0,4,8);
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(LEN/pitch,1); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; return t; };
  const kGroups=c=>{ c.mr={}; c.md={}; KS.forEach(k=>{ c.mr[k]=new THREE.Group(); c.md[k]=new THREE.Group(); c.add(c.mr[k],c.md[k]); }); };
  const cover=kind=>{
    const c=new THREE.Group(), pn=kind==='pn', T=pn?0.02:0.10, dT=0.10+T, K=MT[kind]; kGroups(c);
    const top=new THREE.MeshStandardMaterial({map:ribTex(pn?0.139:0.333,pn?'#8f979c':'#e4e6df',pn?'#6f777c':'#c9ccc4'),roughness:0.55,metalness:pn?0.35:0.12}); MT.tops[kind].push(top);
    const ci=pn?[`Профнастил ПК-20 0,5 мм · ${id}`,`Листи 2,0 м від гребеня до звису 0,10 за бортик. На 4 ліхтарі: ${COV.q.PNS} листів, ${nf(COV.q.PNA,0)} м²; саморізи 4,8×35 з EPDM у прогони. Без утеплення: якщо цех опалюється — конденсат. 310 грн/м² з ПДВ (ukrbyd.com, 28.10).`]
      :[`Сендвіч-панель покрівельна, мінвата 100 мм · ${id}`,`Панелі 2,0 м від гребеня до звису 0,10 за бортик. На 4 ліхтарі: ${COV.q.SWN} шт., ${nf(COV.q.SWA,0)} м², ≈${nf(COV.q.MSWT,1)} т; кріплення 5,5 мм у прогони. 1 850 грн/м² з ПДВ (prom.ua 1 570–2 160, 28.10).`];
    [-1,1].forEach(sg=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(LEN,T,SL),[K.edge,K.edge,top,K.bot,K.edge,K.edge]); m.quaternion.copy(qS(sg)); m.position.copy(pt(sg,SL/2,0.10+T/2,YM)); m.castShadow=true; m.receiveShadow=true; c.add(m); inf(m,...ci);
      const rd=new THREE.Mesh(new THREE.BoxGeometry(LEN+0.02,0.004,0.24),K.fl); rd.quaternion.copy(qS(sg)); rd.position.copy(pt(sg,0.10,dT+0.004,YM)); rd.castShadow=true; c.add(rd); inf(rd,pn?'Коньок':'Коньок: зовнішній, внутрішній, мінвата',`${nf(COV.q.RIDG,0)} м на 4 ліхтарі, з ущільнювачем.`);
      const e=pt(sg,SL,dT,YM), dp=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.08+T,LEN),K.fl); dp.position.set(e.x+sg*0.004,e.y-(0.08+T)/2,e.z); dp.castShadow=true; c.add(dp); inf(dp,pn?'Капельник':'Капельник із заглушкою',`Звис 0,10 м за бортик — вода на основну покрівлю. ${nf(COV.q.DRPM,0)} м на 4 ліхтарі.`);
      [YA,YB].forEach(y=>{ const ep=new THREE.Mesh(new THREE.BoxGeometry(0.004,T+0.06,SL),K.fl); ep.quaternion.copy(qS(sg)); ep.position.copy(pt(sg,SL/2,0.10+T/2,y+(y<YM?-0.003:0.003))); c.add(ep); inf(ep,'Торцева планка',`${nf(COV.q.ENDM,1)} м на 4 ліхтарі.`); });
      KS.forEach(k=>{ const list=MDk(k)[sg>0?'E':'W']; if(!list.length) return;
        if(!pn){ const bks=[];
          runs(list).forEach(r=>{ const ra=r[0][0]-0.1, rb=r[r.length-1][0]+MOD.W+0.1;
            [UP2,UP3].forEach(u=>{ const rl=along(pt(sg,u,dT+0.0955,ra),pt(sg,u,dT+0.0955,rb),rectS(0.041,0.041),MT.rail,nrm(sg)); c.md[k].add(rl);
              inf(rl,`Рейка 41×41 на кронштейнах · ${id}`,`Над ${u===UP2?'П-2':'П-3'}: кронштейн з EPDM крізь покриття в прогон через 1,0 м, висота 75 мм — модуль 0,12 м над покриттям (ZNSHINE ≥ 0,115). На 4 ліхтарі (318 модулів): рейок ${nf(COV.q.RAIL,0)} м, кронштейнів ${COV.q.BRKN}.`);
              for(let y=ra+0.2;y<rb;y+=1.0) bks.push([pt(sg,u,dT+0.0375,y),qS(sg)]); }); });
          instObj(MT.gBk,MT.bk,bks,c.md[k],()=>({t:'Кронштейн рейки',d:'Крізь покриття в прогон, з EPDM, через 1,0 м.'})); }
        else {   // кріплення на профнастил — як на складі: міні-рейка під кожною точкою притиску, П33 на стиках, Z33 на торцях рядів
          const ed=edges(list), mr=[], mi=[], cl=[], ci2=[];
          [UP2,UP3].forEach((u,row)=>ed.forEach(([y,f])=>{ mr.push([pt(sg,u,dT+MRH/2,y),qS(sg)]); mi.push(row);
            cl.push([pt(sg,u,dT+MRH+MOD.T+0.006,clY(y,f)),qS(sg)]); ci2.push(f>0); }));
          instObj(MT.gMR,MT.rail,mr,c.mr[k],i=>({t:`Міні-рейка 380 мм з EPDM · ${id}`,d:`Під точкою притиску ${mi[i]?'нижнього':'верхнього'} ряду — 540 мм від торця модуля (ZNSHINE 477–596), поперек хвиль ПК-20 над ${mi[i]?'П-3 на бортику':'П-2'}: навантаження з модуля йде в хвилі листа і одразу в прогін. 6 саморізів 5,5×25 з EPDM у верх хвиль, герметик — як на складі 26.10. На 4 ліхтарі (318 модулів): ${COV.q.MRN} міні-рейок, ${nf(COV.q.MRSC,0)} саморізів. Переріз у моделі умовний.`}));
          instObj(MT.gCl,MT.clamp,cl,c.md[k],i=>ci2[i]?{t:'Притиск крайній Z33',d:`Al 6005-T6, на торці ряду; ${COV.q.CLE} на 4 ліхтарі (318 модулів).`}:{t:'Притиск середній П33',d:`Al 6005-T6, на стику двох модулів, болт M8 A2 у міні-рейку, 16–20 Н·м, заходження на раму 8–12 мм (ZNSHINE). ${COV.q.CLM} на 4 ліхтарі (318 модулів).`});
        } });
    });
    const zM=pn?MRH+MOD.T/2:0.116+MOD.T/2;
    KS.forEach(k=>modsInst(c.md[k],(sg,yc)=>[pt(sg,0.02+MOD.L/2,dT+zM,yc),qS(sg)],modInfo(pn?`Вертикально 13° на міні-рейках над П-2 і П-3, рама на ${nf(MRH*1000,0)} мм над хвилею; верх модулів ≈${nf(Z0A+dT+MRH+MOD.T,2)} м над покрівлею.`:`Вертикально 13° на 2 рейках над П-2 і П-3; верх модулів ≈${nf(Z0A+dT+0.149,2)} м над покрівлею.`,false,k),k));
    const und=x=>Z0A-(x/cs)*sn+0.10*cs, gp=[[-CURB.out,CURB.top],[CURB.out,CURB.top],[CURB.out,und(CURB.out)],[0,Z0A+0.10/cs],[-CURB.out,und(CURB.out)]];
    [[YA,YA+0.01],[YB-0.01,YB]].forEach(([a,b])=>{ const m=prismXZ(gp,a,b,K.gm); c.add(m); inf(m,'Закриття трикутного торця',pn?'Гладкий лист 0,5 мм, ≈1 м² на торець.':'Сендвіч або лист з мінватою, ≈1 м² на торець.'); });
    v1.add(c); return c;
  };
  const coverPA=()=>{   // А: панелі самі стають дахом — профілі під стиками на П-1…П-3, EPDM, П33 на стиках, коник (схема власника 28.10; розміри умовні)
    const c=new THREE.Group(); kGroups(c);
    const dB=0.10, dE=dB+0.008, Tsh=new THREE.Shape();
    [[-0.05,0],[0.05,0],[0.05,0.005],[0.005,0.005],[0.005,0.05],[-0.005,0.05],[-0.005,0.005],[-0.05,0.005]].forEach((q,i)=>i?Tsh.lineTo(q[0],q[1]):Tsh.moveTo(q[0],q[1])); Tsh.closePath();
    [-1,1].forEach(sg=>{
      const a0=pt(sg,0.02,dB,0), a1=pt(sg,0.02+MOD.L,dB,0);
      KS.forEach(k=>{ const list=MDk(k)[sg>0?'E':'W']; if(!list.length) return; const ed=edges(list), ys=ed.map(e=>e[0]);
        instAlong(a0,a1,Tsh,MT.joint,ys,c.mr[k],()=>({t:`Профіль під стик · ${id}`,d:`Два кутники 50×50×5${tg('u')} вниз по схилу під стиком двох модулів, на П-1, П-2, П-3 — зварювання. На полицях — стрічка EPDM, модулі лежать довгими сторонами; зверху на стику — притиск П33. Стики зсередини — силікон. На 4 ліхтарі (318 модулів): ${COV.q.JL} профілів, ${nf(COV.q.JKG/1000,1)} т.`}),nrm(sg));
        [-1,1].forEach(sd=>instAlong(a0,a1,rectS(0.035,0.003,sd*0.0275,0.0065),MT.epdm,ys,c.mr[k],()=>({t:'Стрічка EPDM під раму модуля',d:`40×3${tg('u')}, по одній під кожен модуль. ${nf(COV.q.EPM,0)} м на 4 ліхтарі (318 модулів).`}),nrm(sg)));
        const cl=[], ce=[];
        [UP2,UP3].forEach(u=>ed.forEach(([y,f])=>{ cl.push([pt(sg,u,dE+MOD.T+0.006,clY(y,f)),qS(sg)]); ce.push(f>0); }));
        instObj(MT.gCl,MT.clamp,cl,c.md[k],i=>ce[i]?{t:'Притиск крайній Z33',d:`На торці ряду; ${COV.q.CLE} на 4 ліхтарі (318 модулів).`}:{t:'Притиск середній П33 на стику',d:`540 мм від торців модуля (ZNSHINE 477–596), болт M8 A2 у профіль${tg('u')}. ${COV.q.CLM} на 4 ліхтарі (318 модулів).`});
        const rd=new THREE.Mesh(new THREE.BoxGeometry(LEN+0.02,0.004,0.24),MT.pn.fl); rd.quaternion.copy(qS(sg)); rd.position.copy(pt(sg,0.10,dE+MOD.T+0.004,YM)); rd.castShadow=true; c.md[k].add(rd);
        inf(rd,'Коник над верхніми краями модулів',`${nf(COV.q.RIDG,0)} м на 4 ліхтарі, з ущільнювачем. Там, де модулів немає (прохід у В1), — профнастил під коником${tg('u')}.`); }); });
    KS.forEach(k=>modsInst(c.md[k],(sg,yc)=>[pt(sg,0.02+MOD.L/2,dE+MOD.T/2,yc),qS(sg)],modInfo(`Панель замість даху: лежить довгими сторонами на профілях під стиками через EPDM, стики зсередини — силікон${tg('u')}; верх ≈${nf(Z0A+dE+MOD.T,2)} м над покрівлею. Потрібне письмове погодження ZNSHINE.`,false,k),k));
    const und=x=>Z0A-(x/cs)*sn+0.10*cs, gp=[[-CURB.out,CURB.top],[CURB.out,CURB.top],[CURB.out,und(CURB.out)],[0,Z0A+0.10/cs],[-CURB.out,und(CURB.out)]];
    [[YA,YA+0.01],[YB-0.01,YB]].forEach(([a,b])=>{ const m=prismXZ(gp,a,b,MT.pn.gm); c.add(m); inf(m,'Закриття трикутного торця','Гладкий лист 0,5 мм, ≈1 м² на торець.'); });
    v1.add(c); return c;
  };
  g.covPN=cover('pn'); g.covSW=cover('sw'); g.covPA=coverPA();
  // ================= ВАРІАНТ 2: накладання на наявний ліхтар
  const v2g=grpL(root,'v2'); glazing(grpL(v2g,'v2glass'),MT.glass,false); frameInto(grpL(v2g,'v2frame'),false);
  g.v2m={}; g.v2r={}; KS.forEach(k=>{ g.v2m[k]=new THREE.Group(); g.v2r[k]=new THREE.Group(); v2g.add(g.v2m[k],g.v2r[k]); });
  const s=Math.sin(GL.th), c2=Math.cos(GL.th), off=MOD.gapN+MOD.T/2, q2=sg=>quatB(new V3(0,0,sg>0?-1:1),new V3(sg*s,c2,0),new V3(sg*c2,-s,0));
  const um=MOD.u0+MOD.L/2;
  KS.forEach(k=>{ modsInst(g.v2m[k],(sg,yc)=>[W(sg*(um*c2+off*s),yc,GL.ridge-um*s+off*c2),q2(sg)],modInfo(`Вертикально на склінні ${nf(GL.th/D2R,0)}°, 0,12 м над склінням${tg('u')}.`,true,k),k);
    [-1,1].forEach(sg=>{ const list=MDk(k)[sg>0?'E':'W']; runs(list).forEach(r=>{ const ra=r[0][0]-0.1, rb=r[r.length-1][0]+MOD.W+0.1;
      [MOD.u0+MOD.cl,MOD.u0+MOD.L-MOD.cl].forEach(u=>{ const o2=MOD.gapN-0.0205, x=sg*(u*c2+o2*s), z=GL.ridge-u*s+o2*c2;
        const r_=along(W(x,ra,z),W(x,rb,z),rectS(0.041,0.041),MT.rail,new V3(sg*s,c2,0)); g.v2r[k].add(r_);
        inf(r_,`Рейка 41×41 · ${id}`,`2 на схил у зоні притисків ZNSHINE — ${nf(u,2)} м від гребеня по схилу; ${nf(rb-ra,1)} м. На що спирати рейку — не вирішено: полікарбонат не несучий${tg('n')}.`); }); }); }); });
  return g;
}
const LG28=LANS.map(buildLantern);
const L2=LANS[1];

// ---------- спрощені каркаси roof28 (бортик-бокс, дах-призма, модулі й рейки каркасів) ховаємо, коли показана детальна модель
const HIDE=[];
if(G.r28c) G.r28c.children.forEach(o=>{ const u=o.userData.info; if(u&&typeof u!=='function'&&/^Каркас ліхтаря/.test(u.t||'')) HIDE.push(o); });
KS.forEach(k=>R28.VG[k].children.forEach(o=>{ const u=o.userData.info; if(typeof u!=='function') return; let t=''; try{ t=u(0).t||''; }catch(e){} if(/^Модуль на каркасі ліхтаря|^Рейка 41×41 під модулями каркаса/.test(t)) HIDE.push(o); }));

// ---------- видимість: варіант покриття, розкладка В1/В2, етап
let stAnim=null;
function setDemo(t){ const lift=t*3.2;
  GH.mats.forEach(m=>{ m.opacity=m.userData.op0*(1-0.82*t); m.depthWrite=t<0.5&&m.userData.op0>=1; });
  LG28.forEach(g=>{ g.ghost.position.y=lift; g.ghost.traverse(o=>{ if(o.isMesh) o.castShadow=t<0.5; }); }); need=true; }
const COVS=g=>[g.covPN,g.covSW,g.covPA];
function resetOffsets(){ LG28.forEach(g=>{ g.covPur.position.y=0; COVS(g).forEach(c=>{ c.position.y=0; KS.forEach(q=>c.md[q].position.y=0); }); KS.forEach(q=>{ g.v2m[q].position.y=0; g.v2r[q].position.y=0; }); }); }
const VAR=()=>{ const vv=state.lay.l28v; return {vv,v:vv==='v2'?2:1,cov:vv==='v2'?'none':vv}; };
function applyVar28(){ const {v,cov}=VAR(), st=state.lay.l28s, cv=v===1, k=KK();
  LG28.forEach(g=>{ g.v1.visible=v===1; g.v2.visible=v===2;
    g.covPur.visible=cv&&st===2; g.covPN.visible=cv&&st===2&&cov==='pn'; g.covSW.visible=cv&&st===2&&cov==='sw'; g.covPA.visible=cv&&st===2&&cov==='pa';
    COVS(g).forEach(c=>KS.forEach(q=>{ c.mr[q].visible=q===k; c.md[q].visible=q===k; }));
    g.ghost.visible=v===1&&st<2; KS.forEach(q=>{ g.v2m[q].visible=st===2&&q===k; g.v2r[q].visible=st===2&&q===k; }); });
  setDemo(v===1&&st>0?1:0); need=true; }
function applyLook(){ const tr=state.lay.l28tr?0.55:0, cov=[...Object.values(MT.pn),...Object.values(MT.sw),...MT.tops.pn,...MT.tops.sw], mod=[MT.mMod,MT.mModL,MT.mSideM,MT.epdm];
  const set=(m,op)=>{ const t=op<0.999; if(m.transparent!==t||Math.abs(m.opacity-op)>1e-3){ m.transparent=t; m.opacity=op; m.depthWrite=!t||op>0.7; m.needsUpdate=true; } };
  cov.forEach(m=>set(m,1-tr)); mod.forEach(m=>set(m,1-0.72*tr)); need=true; }
function sync28(){ const on=ON(); LGR.visible=on; HIDE.forEach(o=>o.visible=!on);
  if(!on&&stAnim) stAnim=null;
  if(!stAnim) applyVar28();
  const cb=$('#cams button[data-c="lan28"]'); if(cb) cb.hidden=!on; }
const sv28=setVis; setVis=function(){ sv28.apply(this,arguments); sync28(); };

// ---------- етапи: як є → демонтаж → готово; ▶ по кроках з анімацією
const EZ=x=>x<=0?0:x>=1?1:(x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2);
function barSt(st){ document.querySelectorAll('#l28bar [data-s]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.s===st))); }
function stageFrame(now){ if(!stAnim) return; const t=(now-stAnim.s)/1000; if(t<0){ requestAnimationFrame(stageFrame); return; }
  const {v,cov}=VAR(), cv=v===1, k=KK(); let done, st;
  if(v===1){ setDemo(EZ((t-0.8)/2.6));
    const ap=EZ((t-3.6)/1.3), ac=EZ((t-4.8)/1.3), am=EZ((t-6.0)/2.4);
    LG28.forEach(g=>{ g.ghost.visible=t<3.6;
      g.covPur.visible=cv&&t>=3.6; g.covPur.position.y=2.2*(1-ap);
      const c={pn:g.covPN,sw:g.covSW,pa:g.covPA}[cov];
      COVS(g).forEach(x=>{ x.visible=false; });
      if(c){ c.visible=t>=4.8; c.position.y=2.2*(1-ac); c.md[k].visible=t>=6.0; c.md[k].position.y=3.0*(1-am)-c.position.y; } });
    st=t<0.8?0:t<3.6?1:2; done=t>8.6; }
  else { const am=EZ((t-0.8)/2.4);
    LG28.forEach(g=>{ g.v2m[k].visible=t>=0.8; g.v2m[k].position.y=3.0*(1-am); g.v2r[k].visible=t>=0.8; g.v2r[k].position.y=3.0*(1-am); });
    st=t<0.8?0:2; done=t>3.4; }
  if(st!==state.lay.l28s){ state.lay.l28s=st; barSt(st); }
  need=true;
  if(done){ stAnim=null; state.lay.l28s=2; resetOffsets(); apply(); save(); return; }
  requestAnimationFrame(stageFrame); }
function playStages(){ state.lay.l28s=0; resetOffsets(); applyVar28(); barSt(0); stAnim={s:performance.now()+300}; requestAnimationFrame(stageFrame); }

// ---------- показники: модулі й генерація — розкладка 28.10 (В1 / В2), вартість — кошторис покриття 28.10 (318 модулів на 4 ліхтарях)
const ST28=['як є','демонтаж','готово'];
const K28=()=>{ const {vv}=VAR(), k=KK(), V=R28.D.V[k], fr=V.frame, inS=fr.filter(m=>m[5]>=0), C=COV.cmp[vv];
  const s0=inS.reduce((a,m)=>a+m[4],0), s2=inS.reduce((a,m)=>a+m[4]*KV2[m[1]],0), kwh=V.sum.frame.mwh*1000*(vv==='v2'&&s0?s2/s0:1);   // МВт·год каркасів — з розкладки 28.10 (з утратою на різну освітленість у стрінгах)
  return {k,name:NM28[vv],n:fr.length,st:inS.length,lit:fr.length-inS.length,kw:inS.length*MOD.P,gen:kwh,tot:C.tot,pkw:C.pkw,pre:vv==='v2'?'від ':''}; };
function kpiHTML(){ const K=K28();
  return `<span class="t">Ліхтарі · ${K.name} · ${VN[K.k]}</span><span><b>${nf(K.n)}</b> модулів (${nf(K.st)} у мережу + ${nf(K.lit)} на освітлення)</span><span><b>${nf(K.kw,1)}</b> кВтп</span><span><b>${nf(K.gen/1000,1)}</b> МВт·год/рік</span><span>кошторис 28.10: <b>${K.pre}${nf(K.tot)} $</b> · ${K.pre}${nf(K.pkw)} $/кВт (318 модулів)</span><span class="l28br"></span>`; }
function barHTML(){ const {vv,v}=VAR(), st=state.lay.l28s, b=(a,t,on,ttl)=>`<button type="button" ${a} aria-pressed="${!!on}"${ttl?` title="${esc(ttl)}"`:''}>${esc(t)}</button>`;
  return b('data-v="pa"','А · панелі',vv==='pa','Панелі замість даху: профілі під стиками, EPDM, силікон')+b('data-v="pn"','Б · профнастил',vv==='pn','Прогони, профнастил ПК-20, міні-рейки')+b('data-v="sw"','Б · сендвіч',vv==='sw','Прогони, сендвіч 100 мм, рейки на кронштейнах')+b('data-v="v2"','2 · на скло',vv==='v2','Ліхтар лишається, модулі поверх скління')
    +'<span class="sep" aria-hidden="true"></span>'+b('data-s="0"','Як є',st===0)+(v===1?b('data-s="1"','Демонтаж',st===1):'')+b('data-s="2"','Готово',st===2)+b('data-play="1"','▶ По кроках',false,'Етапи по черзі, з анімацією')
    +'<span class="sep" aria-hidden="true"></span>'+b('data-tr="1"','Прозоро',state.lay.l28tr,'Покриття і модулі ліхтарів напівпрозорі'); }
function bindBar(bar){
  bar.querySelectorAll('[data-v]').forEach(x=>x.onclick=()=>{ stAnim=null; resetOffsets(); state.lay.l28v=x.dataset.v; state.lay.l28s=2; apply(); save(); });
  bar.querySelectorAll('[data-s]').forEach(x=>x.onclick=()=>{ stAnim=null; resetOffsets(); state.lay.l28s=+x.dataset.s; apply(); save(); });
  bar.querySelectorAll('[data-play]').forEach(x=>x.onclick=()=>playStages());
  bar.querySelectorAll('[data-tr]').forEach(x=>x.onclick=()=>{ state.lay.l28tr=!state.lay.l28tr; x.setAttribute('aria-pressed',String(!!state.lay.l28tr)); applyLook(); save(); }); }
const hud28=hudCtx; hudCtx=function(){ hud28.apply(this,arguments); const bar=$('#l28bar'); if(!bar) return;
  if(!R28.ON()){ bar.hidden=true; return; }
  const m=$('#modes');
  const b=document.createElement('button'); b.type='button'; b.dataset.m='l28'; b.textContent='Ліхтарі в деталях'; b.title='Конструкція ліхтарів: покриття, прогони, кріплення модулів, етапи'; b.setAttribute('aria-pressed',String(!!state.lay.l28));
  b.onclick=()=>{ state.lay.l28=!state.lay.l28; stAnim=null; resetOffsets(); apply(); save(); }; m.appendChild(b); m.hidden=false;
  bar.hidden=!state.lay.l28; if(!bar.hidden){ bar.innerHTML=barHTML(); bindBar(bar); }
  if(state.lay.l28){ const l=$('#legend'); if(l){ l.insertAdjacentHTML('afterbegin',kpiHTML()); l.hidden=false; } } };

// ---------- панель «Загальне»: блок ліхтарів одразу після таблиці варіантів даху
function paneHTML(){ const K=K28(), q=COV.q, {vv}=VAR(), keys=['pa','pn','sw','v2'], L1=LANS[0];
  const cur=x=>x===vv?'cur':'', row=(tt,f,cls)=>`<tr class="${cls||''}"><td>${tt}</td>${keys.map(x=>`<td class="${cur(x)}">${f(COV.cmp[x],x)}</td>`).join('')}</tr>`;
  return `<div class="l28w"><h3 class="l28h">Ліхтарі в деталях · ${K.name} · етап: ${ST28[state.lay.l28s]}</h3>
  <p class="src">Скління знімаємо до каркаса 13° (бортик 3,66 м, каркас 3,0 м), далі одне з трьох покриттів — або модулі поверх скління (варіант 2). Модулі на ліхтарях — ті самі місця, що в розкладці ${VN[K.k]}: ${nf(K.n)} (${nf(K.st)} у мережу, ${nf(K.lit)} на освітлення), ${nf(K.gen/1000,1)} МВт·год за рік. Кошторис покриття — 28.10, на 318 модулів (усі місця без проходів); варіант, етап і ▶ — над моделлю.</p>
  <table class="cmp"><thead><tr><th></th>${keys.map(x=>`<th class="ours">${NM28[x]}</th>`).join('')}</tr></thead><tbody>
  ${row('Під ключ, $ без ПДВ (318 модулів)',(x,k_)=>`${k_==='v2'?'від ':''}${nf(x.tot)}`,'tot')}${row('$ за 1 кВт',(x,k_)=>`${k_==='v2'?'від ':''}${nf(x.pkw)}`)}
  ${row('Генерація 318 модулів, кВт·год за рік (розрахунок 28.10)',x=>nf(x.gen))}
  ${row('Що врахувати',(x,k_)=>({pa:'профілі під стиками — умовно; письмове погодження ZNSHINE',pn:'міні-рейки: ≈45 мм від рами до покриття, ZNSHINE радить ≥ 115',sw:'з утепленням; рейки на кронштейнах 0,12 м',v2:'на що спирати рейки — не вирішено; цех темнішає'}[k_]))}</tbody></table>
  <p class="src">Осі ліхтарів — X ${LANS.map(L=>nf(L.xc,2)).join(' · ')} м: на ≈1,5 м східніше центру арок, як у розрізі 1-1, РП, на знімку Google Maps і фото 123924 (перевірка 28.10). Власник казав «по центру» — якщо рулетка покаже інше (від ендови до бортика з обох боків: зараз ≈${nf(L1.xc-1.83-L1.a,1)} і ${nf(L1.b-L1.xc-1.83,1)} м, по центру було б ≈7,2 і 7,2), ліхтарі й розкладку переставимо.</p></div>`; }
const pz28=panelPZ; panelPZ=function(){ const h=pz28.apply(this,arguments); if(!ON()) return h; const i=h.indexOf('</table>'); return i<0?paneHTML()+h:h.slice(0,i+8)+paneHTML()+h.slice(i+8); };

// ---------- вид «Ліхтар» (Л2 зблизька, південний торець)
VIEWS.lan28={t:'Ліхтар',p:[L2.xc-8.5,L2.zb+6.2,-(L2.y0-7.5)],c:[L2.xc+0.8,L2.zb+0.4,-(L2.y0+9)]};
{ const cams=$('#cams'), b=document.createElement('button'); b.type='button'; b.dataset.c='lan28'; b.textContent=VIEWS.lan28.t; b.setAttribute('aria-pressed','false');
  b.onclick=()=>{ cams.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); goCam('lan28'); };
  const nd=cams.querySelector('button[data-c="node"]'); if(nd) cams.insertBefore(b,nd); else cams.appendChild(b); }
window.__twin.lan28={LG28,LANS,MDS,HIDE,playStages,ON,COV};
applyLook(); apply();
} }
