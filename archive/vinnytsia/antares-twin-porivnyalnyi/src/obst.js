// ================= Обстеження 26.10.2026: будівлі й елементи за фото, точки зйомки (src/obst.js; вставляється в app.js разом з montage.js)
// Розміри — оцінка за фото, де не виміряно — так і підписано. Розрахунок генерації (тіні) цими елементами ще не оновлено.
{
const OB=grp('obst',G.site);
const om=(c,o)=>std(c,o||{});
const OBM={brick:om(0xd9d6cc), conc:om(lin(0x9a9993)), steel:om(0x8d989f,{metalness:0.5,roughness:0.45}), rust:om(0x8f6a4c,{roughness:0.7}), white:om(0xeceeee,{roughness:0.5}),
  dark:om(0x3b4248), cream:om(0xe8e0cb,{roughness:0.6}), cable:om(0x1d2125,{roughness:0.55}), fan:om(0x6d757b,{metalness:0.4,roughness:0.5})};
const fn=id=>{ const i=FOTO.p.findIndex(p=>p[0]===id); return i<0?'':'№ '+(i+1); };
const info=(o,t,d)=>{ o.userData.info={t,d}; PICK.push({o}); return o; };
const RX=X=>roofZ(Math.max(0,Math.min(96.64,X)));
// --- західна будівля з білої цегли: вища за дах цеху
{ const x0=-12.15, x1=-0.15, y0=-0.5, y1=96.59, top=HV+6.8;
  // кладка: 10 рядів на 1 м (потовщена цегла 88 мм + шов), ложки по 250 мм — щоб у двійнику можна було порахувати ряди, як на фото
  const bt=(rx,ry)=>{ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.fillStyle='#e2dfd6'; x.fillRect(0,0,256,256); x.fillStyle='#bdb8ab';
    for(let r=0;r<10;r++){ const y=r*25.6; x.fillRect(0,y,256,2.2); for(let k=0;k<4;k++) x.fillRect(((k*64+(r%2)*32)%256),y,2.2,25.6); }
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); t.anisotropy=8; return t; };
  const bm=(rx,ry)=>std(0xffffff,{map:bt(rx,ry),roughness:0.9});
  const b=mesh(new THREE.BoxGeometry(x1-x0,top,y1-y0),[bm(y1-y0,top),bm(y1-y0,top),OBM.conc,OBM.conc,bm(x1-x0,top),bm(x1-x0,top)],OB); b.position.set((x0+x1)/2,top/2,-(y0+y1)/2);
  info(b,'Західна будівля з білої цегли — вища за дах цеху',`≈6,8 м над покрівлею цеху: 63 ряди потовщеної цегли по ≈100 мм (фото ${fn('123945')}) + фартух і парапет; верх ≈20,6 м від землі. Ширина й довжина не виміряні — у моделі 12 м і на всю довжину цеху. Тіні від неї в розрахунку генерації ще не враховано.`);
  info(box(0.06,2.1,1.0,OBM.dark,-0.2,HV+1.05,-86.5,OB),'Двері із західної будівлі на дах цеху',`Фото ${fn('123945')}, ${fn('123946')}: лишити прохід від дверей; поруч — кондиціонери на стіні. Положення — за фото.`); }
// --- парапети цеху: торці (південь, північ) — уздовж арок, схід — низький з огорожею
{ const top=1.2, pts=[]; for(let x=0;x<=96.64+1e-9;x+=0.5) pts.push(new THREE.Vector2(Math.min(x,96.64),RX(x)+top));
  const sh=new THREE.Shape([new THREE.Vector2(-0.15,HV-0.3),new THREE.Vector2(96.64,HV-0.3)].concat(pts.reverse()));
  const g=new THREE.ExtrudeGeometry(sh,{depth:0.25,bevelEnabled:false});
  [[0.25,'південний'],[-96.59,'північний']].forEach(([z,nm])=>{ const m=mesh(g,OBM.conc,OB); m.position.z=z;
    info(m,`Парапет — ${nm} торець цеху`,`${nm==='південний'?`Рулетка 27.10: ≈1,37 м в ендові, ≈1,65 м на уступі біля сталевої стійки (фото № ${fn('113629').slice(2)}, ${fn('113649').slice(2)}); по парапету — кабель на кліпсах (фото № ${fn('113634').slice(2)}). У моделі й розрахунку тіней поки 1,2 м. `:''}≈1,2 м над покрівлею біля ендов (за кладкою сусідньої стіни, фото ${fn('123945')}); уздовж арок іде уступами (фото ${fn('124411')}), у моделі — плавно. Бетон з металевим фартухом. Як опору для кріплення чи страховки — лише після обстеження.`); });
  const e=box(0.25,0.8,97.09,OBM.conc,96.515,HV+0.1,-48.045,OB);
  info(e,'Парапет — східний край','≈0,5 м над покрівлею, по верху — огорожа з труб ≈1,1 м (фото '+fn('123646')+', '+fn('143858')+'). Висоти — оцінка за фото.');
  box(0.05,0.05,97,OBM.steel,96.5,HV+1.1,-48.045,OB);
  const n=Math.floor(97/2.4)+1, po=inst(new THREE.BoxGeometry(0.045,0.6,0.045),OBM.steel,n,OB);
  for(let i=0;i<n;i++){ _M.compose(new V3(96.5,HV+0.8,-(-0.5+i*2.4)),QI,ONE); po.setMatrixAt(i,_M); } }
// --- рама кондиціонерів: 14,5 × 2,4 × 2,2 м (розміри — власник 27.10, 11:35); положення — за фото 27.10 (оцінка ±2 м)
{ const A=S.ac||{x0:67.2,x1:69.6,y0:6.5,y1:21,h:2.2}, X0=A.x0, X1=A.x1, Y0=A.y0, Y1=A.y1, L=Y1-Y0, Xc=(X0+X1)/2, top=Math.max(RX(X0),RX(X1))+A.h, deck=top-1.6;
  const legs=[], NL=6, parts=[];
  for(let k=0;k<NL;k++){ const y=Y0+0.15+k*(L-0.3)/(NL-1); [X0+0.05,X1-0.05].forEach(x=>{ const z0=RX(x), h=deck-z0; parts.push(box(0.08,h,0.08,OBM.white,x,z0+h/2,-y,OB));
      parts.push(box(0.45,0.03,0.45,OBM.conc,x,z0+0.015,-y,OB)); });
    if(k<NL-1){ const yb=y+(L-0.3)/(NL-1)/2; [X0+0.05,X1-0.05].forEach(x=>{ const z0=RX(x), h=deck-z0, len=Math.hypot(h*0.75,(L-0.3)/(NL-1)/2);
        [-1,1].forEach(sg=>{ const b=box(0.05,len,0.05,OBM.white,x,z0+h*0.62,-(yb+sg*(L-0.3)/(NL-1)/4),OB); b.rotation.x=sg*Math.atan2((L-0.3)/(NL-1)/2,h*0.75); parts.push(b); }); }); } }
  [X0+0.05,X1-0.05].forEach(x=>parts.push(box(0.1,0.12,L,OBM.white,x,deck-0.06,-(Y0+Y1)/2,OB)));
  for(let k=0;k<NL;k++){ const y=Y0+0.15+k*(L-0.3)/(NL-1); parts.push(box(X1-X0,0.1,0.08,OBM.white,Xc,deck-0.05,-y,OB)); }
  const inf=`Рама ${nf(A.L||L,1)} × ${nf(A.W||X1-X0,1)} м, висота з блоками ${nf(A.h,1)} м (розміри — власник 27.10). Біла сталева рама на стійках з підкосами, опори на латках; два ряди зовнішніх блоків Midea: уздовж заходу — двовентиляторні (вентилятори на захід), уздовж сходу — блоки з бічними решітками, біля південного кінця — великі блоки VRF; труби в утепленні йдуть у короб під рамою. Положення — за фото 27.10: на схід від дефлекторів, південніше ліхтаря 4, від виходу на дах праворуч (X ${nf(X0,1)}–${nf(X1,1)}, Y ${nf(Y0,1)}–${nf(Y1,1)} м, оцінка ±2 м) — звірити рулеткою від виходу. Модулі даху — не ближче 1 м; тінь рами на сусідні модулі в розрахунку врахована.`;
  parts.forEach(o=>info(o,'Рама зовнішніх блоків кондиціонерів',inf));
  const unit=(x,y,w,d,h,face,fans)=>{ const u=box(d,h,w,OBM.white,x,deck+h/2,-y,OB); info(u,'Зовнішній блок кондиціонера на рамі',inf);
    if(fans) [h*0.25,-h*0.25].forEach(dz=>{ const f=mesh(new THREE.CylinderGeometry(w*0.36,w*0.36,0.02,20),OBM.fan,OB,false); f.rotation.z=Math.PI/2; f.position.set(x+face*(d/2+0.01),deck+h/2+dz,-y); });
    else { const g=box(0.02,h*0.8,w*0.8,OBM.steel,x+face*(d/2+0.005),deck+h/2,-y,OB); } };
  const NW=13; for(let k=0;k<NW;k++) unit(X0+0.25,Y0+0.6+k*(L-1.2)/(NW-1),0.95,0.4,1.4,-1,true);
  [[1.3,1.6],[1.3,1.6],[1.3,1.6]].forEach(([w,h],k)=>unit(X1-0.45,Y0+0.8+k*1.4,w,0.75,h,1,false));
  for(let k=0;k<8;k++) unit(X1-0.5,Y0+5.2+k*1.15,1.0,0.7,1.5,1,false);
  const duct=box(0.6,0.3,1.2,OBM.steel,Xc,deck-0.35,-(Y0+1.2),OB); info(duct,'Короб труб під рамою кондиціонерів',inf);
  // північний торець (фото 27.10, 11:29–11:30): 4 щитки 2 × 2 з прозорими дверцятами, під ними кабелі в білих гофрах
  const eb=std(lin(0x6f7a80),{roughness:0.5}), eg=std(lin(0x9fb6c4),{roughness:0.15,metalness:0.2,transparent:true,opacity:0.7});
  [[-0.21,0.25],[0.21,0.25],[-0.21,0.72],[0.21,0.72]].forEach(([dx,dz])=>{ info(box(0.4,0.44,0.2,eb,Xc+dx,deck+dz,-(Y1+0.12),OB),'Щитки живлення кондиціонерів (північний торець рами)',
    `4 щитки 2 × 2 з прозорими дверцятами на північному торці рами, кабелі в білих гофрах під ними (фото № ${fn('112942').slice(2)}, ${fn('113009').slice(2)}). Між опорами торця ≈2,20 м (рулетка, фото № ${fn('113002').slice(2)}). Розміри щитків — оцінка.`);
    box(0.34,0.36,0.01,eg,Xc+dx,deck+dz,-(Y1+0.225),OB); }); }
// --- водостічна воронка біля південного парапету (фото 27.10): центр ≈0,87 м від стіни; ендова — оцінка за фото
{ const x=72, y=0.25+0.87, z=RX(x); const c=mesh(new THREE.CylinderGeometry(0.22,0.26,0.16,16),OBM.rust,OB); c.position.set(x,z+0.08,-y);
  const r=mesh(new THREE.TorusGeometry(0.45,0.03,6,24),OBM.dark,OB); r.rotation.x=Math.PI/2; r.position.set(x,z+0.02,-y);
  [c,r].forEach(o=>info(o,'Водостічна воронка (лівневка)',`Чавунний ковпак із сіткою в ендові біля південного парапету; центр ≈0,87 м від стіни парапету (рулетка, фото № ${fn('113707').slice(2)}, ${fn('113713').slice(2)}, ${fn('113720').slice(2)}). Ендова (X ≈72 м) — оцінка за фото. Біля воронки модулі не ставити: обійти ≈0,5 м. Інші воронки в моделі ще не нанесено.`)); }
// --- сталевий портал на південному краї (балки виступають за парапет)
{ const z=RX(59.3), H=3.4, posts=[[58,0.6],[60.6,0.6],[58,2.6],[60.6,2.6]];
  const parts=[]; posts.forEach(([x,y])=>parts.push(box(0.15,H,0.15,OBM.steel,x,z+H/2,-y,OB)));
  [0.6,2.6].forEach(y=>parts.push(box(2.75,0.2,0.15,OBM.steel,59.3,z+H,-y,OB)));
  [58,60.6].forEach(x=>parts.push(box(0.15,0.2,4.6,OBM.steel,x,z+H-0.45,-(0.5),OB)));
  parts.forEach(o=>info(o,'Сталевий портал на південному краї даху',`Фото ${fn('124309')}, ${fn('124315')}: балки виходять за парапет — схоже на раму для підйому вантажів. Вантажопідйомність невідома (таблички на фото не видно). Розміри — оцінка.`)); }
// --- зовнішні сходи і ДГУ — деталізовано у fasad.js
// --- існуючі кабелі на кронштейнах («лапках») уздовж східного і північного фасадів, 2 яруси
{ const route=(h,o)=>new THREE.CatmullRomCurve3([[96.64+o,30],[96.64+o,92],[96.64+o,95.9],[96.0,96.59+o],[92,96.59+o],[0.6,96.59+o]].map(([x,y])=>W(x,y,h)),false,'catmullrom',0.05);
  const tiers=[[5.6,0.2,0.045],[6.1,0.2,0.06]], inf=`Фото ${fn('143858')}, ${fn('144002')}, ${fn('144004')}: 2 яруси кабелів на кронштейнах, ≈5,6 і 6,1 м від землі (оцінка за фото). Трасу між фото не простежено — у моделі від ТП-5913 уздовж східного фасаду і всього північного до північно-західного кута (на фото ${fn('144221')} кабель видно і там). Можна використати під лінії УЗЕ: з'ясувати, що це за кабелі, чи є місце на кронштейнах і яке на них навантаження.`;
  tiers.forEach(([h,o,r])=>{ const c=route(h,o); info(mesh(new THREE.TubeGeometry(c,600,r,6,false),OBM.cable,OB),'Існуючі кабелі на фасаді (кронштейни-«лапки»)',inf);
    const L=c.getLength(), n=Math.floor(L/1.2), br=inst(new THREE.BoxGeometry(0.06,0.05,1),OBM.steel,n,OB,false);
    for(let i=0;i<n;i++){ const t=i/n, p=c.getPointAt(t), tg=c.getTangentAt(t), nx=new V3(-tg.z,0,tg.x).normalize();   // кронштейн — від стіни до кабелю
      _q.setFromUnitVectors(new V3(0,0,1),nx); _M.compose(p.clone().addScaledVector(nx,-o/2+0.02).add(new V3(0,-r-0.03,0)),_q,new V3(1,1,o+0.05)); br.setMatrixAt(i,_M); } }); }

// ================= точки зйомки: станції (підпис — номери фото), стрілки погляду; натискання — фото і камера на місце зйомки
const FG=new THREE.Group(); scene.add(FG); FG.name='foto';
const isSt=p=>p[4]==='S'&&p[1]===63&&p[2]>-2;   // з верхнього майданчика сходів
const ABKZ=(x,y)=>y<20.3?10.0:13.2+1.3*Math.max(0,1-((x-118.25)/9.75)**2);   // дах АБК: південний блок 10,0; основний — арка 13,2 + 1,3 (оцінка)
const ONR=p=>p[4]==='R'||p[4]==='L'||p[4]==='B', hOf=p=>ONR(p)?RX(p[1])+1.6:p[4]==='A'?ABKZ(p[1],p[2])+1.6:isSt(p)?RX(63)+2.8:p[4]==='T'?5.4:1.6;   // A — дах адмінкорпусу (арка, оцінка)
const ST=new Map(); FOTO.p.forEach((p,i)=>{ const k=p[1]+','+p[2]; if(!ST.has(k)) ST.set(k,[]); ST.get(k).push(i); });
const rng=ns=>{ const o=[]; let a=ns[0],b=ns[0]; for(const n of ns.slice(1)){ if(n===b+1) b=n; else { o.push(a===b?a:a+'–'+b); a=b=n; } } o.push(a===b?a:a+'–'+b); return o.join(', '); };
function pillTex(txt,col){ const c=document.createElement('canvas'), x=c.getContext('2d'); x.font='700 40px system-ui,sans-serif'; const w=Math.ceil(x.measureText(txt).width)+64; c.width=w; c.height=64;
  x.font='700 40px system-ui,sans-serif'; x.fillStyle=col; x.beginPath(); x.arc(32,32,30,Math.PI/2,Math.PI*1.5); x.lineTo(w-32,2); x.arc(w-32,32,30,-Math.PI/2,Math.PI/2); x.closePath(); x.fill();
  x.fillStyle='#fff'; x.textBaseline='middle'; x.fillText(txt,32,34); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return [t,w/64]; }
const DOT=(()=>{ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d'); x.fillStyle='#fff'; x.beginPath(); x.arc(16,16,14,0,7); x.fill(); return new THREE.CanvasTexture(c); })();
const SPR=[], DIRP=[], DIRC=[], STO=[]; let stHid=null;
const stHide=i=>{ if(stHid) stHid.forEach(o=>o.visible=true); stHid=i==null?null:STO[i]; if(stHid) stHid.forEach(o=>o.visible=false); };
ST.forEach((idx)=>{ const p=FOTO.p[idx[0]], col=FOTO.g[p[4]][1], pos=W(p[1],p[2],hOf(p)), [t,asp]=pillTex('📷 '+rng(idx.map(i=>i+1)),col);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true})); s.material.sizeAttenuation=false; s.scale.set(0.026*asp,0.026,1); s.center.set(0.5,-0.25);
  s.position.copy(pos); s.renderOrder=19; s.userData.fi=idx; s.userData.asp=asp; FG.add(s); SPR.push(s);
  const dot=new THREE.Points(new THREE.BufferGeometry().setFromPoints([pos]),new THREE.PointsMaterial({color:lin(col),size:9,sizeAttenuation:false,map:DOT,alphaTest:0.5,depthTest:false,transparent:true})); dot.renderOrder=18; FG.add(dot); idx.forEach(i=>STO[i]=[s,dot]);
  idx.forEach(i=>{ const q=FOTO.p[i]; if(q[3]==null) return; const a=q[3]*D2R, e=W(q[1]+Math.sin(a)*5,q[2]+Math.cos(a)*5,hOf(q)); DIRP.push(pos.clone(),e); const c=new THREE.Color(lin(col)); DIRC.push(c,c); }); });
{ const g=new THREE.BufferGeometry().setFromPoints(DIRP); g.setAttribute('color',new THREE.Float32BufferAttribute(DIRC.flatMap(c=>[c.r,c.g,c.b]),3)); FG.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true}))); }
const cur=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(),new V3()]),new THREE.LineBasicMaterial({color:0xd64545,depthTest:false})); cur.renderOrder=20; cur.visible=false; FG.add(cur);
// перемикач «Фото» у верхньому рядку
const FKEY='antares-twin-foto'; let fOn=true; try{ fOn=localStorage.getItem(FKEY)!=='0'; }catch(e){}
const fb=document.createElement('button'); fb.type='button'; fb.className='hbtn fchip'; fb.id='fotoChip'; fb.title='Точки зйомки фото обстеження 26 і 27.10.2026'; fb.innerHTML='📷&#xFE0E;<span>Фото</span>';
const hrow=$('#misChip').parentNode; hrow.insertBefore(fb,$('#misChip'));
const fst=document.createElement('style'); fst.textContent=`.hbtn.fchip{display:inline-flex;align-items:center;gap:4px;padding:0 9px;white-space:nowrap;font-weight:600}.hbtn.fchip[aria-pressed="true"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}
.fview{position:absolute;right:10px;top:62px;z-index:9;width:min(42%,500px);max-height:calc(100% - 72px);background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.18);overflow:hidden;display:flex;flex-direction:column}
.fview .fi{position:relative;background:#111;aspect-ratio:4/3;flex:1 1 auto;min-height:90px} .fview img,.fview video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block} .fview .fi a{position:absolute;inset:0;z-index:1}
.fview .fn{padding:8px 10px 2px;display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--ink-2)} .fview .fn b{color:#fff;border-radius:6px;padding:1px 7px;font-size:12.5px}
.fview .fc{padding:2px 10px 8px;font-size:13.5px;color:var(--ink);line-height:1.35} .fview .fb{display:flex;gap:6px;padding:0 10px 10px} .fview .fb button{height:30px;min-width:34px;border-radius:8px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);font-size:13px;padding:0 10px}
.fview .fb .sp{flex:1} .fview .miss{color:#ccc;font-size:13px;padding:20px;text-align:center}
@media (max-width:760px){ .hbtn.fchip{padding:0 7px} .hbtn.fchip span{display:none} .fview{left:6px;right:6px;width:auto;top:48px;max-height:calc(100% - 54px)} .fview .fi{flex:0 0 auto;aspect-ratio:auto;height:28vh} .fview .fc{font-size:12.5px} }`; document.head.appendChild(fst);
const fv=document.createElement('div'); fv.className='fview'; fv.hidden=true; $('#view').appendChild(fv);
const DIRN=['Пн','ПнСх','Сх','ПдСх','Пд','ПдЗх','Зх','ПнЗх'];
let fI=-1;
function fShow(i,fly=true){ fI=(i+FOTO.p.length)%FOTO.p.length; const p=FOTO.p[fI], col=FOTO.g[p[4]][1], dt=p[7]||'20261026', vid=!p[7]&&p[0]==='123910', src='foto/'+dt+'_'+p[0]+(vid?'.mp4':'.jpg');
  const media=vid?`<video src="${src}" autoplay loop muted playsinline poster="foto/20261026_123910.jpg"></video>`:`<a href="${src}" target="_blank" rel="noopener" title="Відкрити фото повністю"></a><img src="${src}" alt="${esc(p[5])}">`;
  fv.innerHTML=`<div class="fi">${media}</div><div class="fn"><b style="background:${col}">№ ${fI+1}</b><span>${dt.slice(6,8)}.${dt.slice(4,6)} ${p[0].slice(0,2)}:${p[0].slice(2,4)} · ${esc(FOTO.g[p[4]][0])}${p[3]==null?'':' · погляд '+DIRN[Math.floor(((p[3]+22.5)%360)/45)]}</span></div>
  <div class="fc">${esc(p[5])}</div><div class="fb"><button type="button" data-f="-1" aria-label="Попереднє фото">‹</button><button type="button" data-f="1" aria-label="Наступне фото">›</button><span class="sp"></span><button type="button" data-f="go">Камера сюди</button><button type="button" data-f="x" aria-label="Закрити фото">×</button></div>`;
  const im=fv.querySelector('img,video'); if(im) im.onerror=()=>{ fv.querySelector('.fi').innerHTML='<div class="miss">Фото немає в цій версії двійника — воно є в приватній версії і на Google Диску (папка «Фото антаріс»).</div>'; };
  fv.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{ const a=b.dataset.f; if(a==='x') fClose(); else if(a==='go') fFly(fI); else fShow(fI+(+a)); });
  fv.hidden=false; const pos=W(p[1],p[2],hOf(p)); if(p[3]!=null){ const a=p[3]*D2R; cur.geometry.setFromPoints([pos,W(p[1]+Math.sin(a)*12,p[2]+Math.cos(a)*12,hOf(p))]); cur.visible=true; } else cur.visible=false;
  SPR.forEach(o=>o.material.opacity=0.4); controls.maxPolarAngle=Math.PI*0.6; requestAnimationFrame(fOff); if(fly) fFly(fI); else stHide(null); need=true; }
function fFly(i){ const p=FOTO.p[i], pos=W(p[1],p[2],hOf(p)); stHide(p[3]==null?null:i); if(p[3]==null){ goTo({p:[pos.x+14,pos.y+12,pos.z+14],c:[pos.x,pos.y-2,pos.z]}); return; }
  const a=p[3]*D2R, pitch=ONR(p)||p[4]==='A'?-0.08:isSt(p)?-0.35:0.14, dx=Math.sin(a), dz=-Math.cos(a), L=12; if(isSt(p)) pos.z=3.4;   // камера — за зовнішнім краєм сходів
  camera.fov=(p[6]||23)<20?72:58; camera.updateProjectionMatrix();   // ширше, як на фото (EXIF: 13 мм — надширокий, 23 мм — основний)
  goTo({p:[pos.x-dx*0.3,pos.y,pos.z-dz*0.3],c:[pos.x+dx*L*Math.cos(pitch),pos.y+L*Math.sin(pitch),pos.z+dz*L*Math.cos(pitch)]}); }
function fClose(){ fv.hidden=true; fI=-1; cur.visible=false; stHide(null); SPR.forEach(o=>o.material.opacity=1); if(camera.fov!==38){ camera.fov=38; camera.updateProjectionMatrix(); } fOff(); controls.maxPolarAngle=Math.PI*0.495; need=true; }
// центр кадру — у вільній від фото частині 3D (на ПК фото справа, на телефоні — зверху)
function fOff(){ if(fv.hidden){ if(camera.view&&camera.view.enabled){ camera.clearViewOffset(); need=true; } return; }
  const c=canvas.getBoundingClientRect(), r=fv.getBoundingClientRect(), w=c.width, h=c.height; if(!w||!h) return;
  if(r.width<0.7*w) camera.setViewOffset(w,h,(r.width+10)/2,0,w,h); else camera.setViewOffset(w,h,0,-(r.bottom-c.top)/2,w,h); need=true; }
const sprSz=()=>{ const H=canvas.clientHeight||500, k=(innerWidth<760?21:25)/(1.77*H); SPR.forEach(o=>{ const asp=o.userData.asp; o.scale.set(k*asp,k,1); }); need=true; };   // ≈18 px на ПК, 15 px на телефоні
new ResizeObserver(()=>{ sprSz(); if(!fv.hidden) requestAnimationFrame(fOff); }).observe(canvas); sprSz();
function fVis(){ const on=fOn&&effSec()!=='bud'; FG.visible=on; fb.setAttribute('aria-pressed',String(fOn)); fb.hidden=effSec()==='bud'; if(!on) fClose(); need=true; }
fb.onclick=()=>{ fOn=!fOn; try{ localStorage.setItem(FKEY,fOn?'1':'0'); }catch(e){} fVis(); };
const apply0=apply; apply=function(){ apply0.apply(this,arguments); fVis(); }; if(window.__twin.apply) window.__twin.apply=apply; fVis();
window.addEventListener('keydown',e=>{ if(fv.hidden) return; if(e.key==='ArrowRight') fShow(fI+1); else if(e.key==='ArrowLeft') fShow(fI-1); else if(e.key==='Escape') fClose(); });
// натискання на станцію — перше фото станції (повторне — наступне на ній)
let fd=null; canvas.addEventListener('pointerdown',e=>{ fd=[e.clientX,e.clientY]; },true);
canvas.addEventListener('pointerup',e=>{ if(!FG.visible||!fd||Math.hypot(e.clientX-fd[0],e.clientY-fd[1])>(e.pointerType==='touch'?12:5)) return; const r=canvas.getBoundingClientRect();
  mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(mouse,camera); const h=ray.intersectObjects(SPR,false); if(!h.length) return;
  e.stopImmediatePropagation(); const idx=h[0].object.userData.fi, k=idx.indexOf(fI); hideTip(); fShow(k>=0?idx[(k+1)%idx.length]:idx[0]); },true);
window.__twin.foto={show:fShow,close:fClose,FG,SPR,OB};
}
