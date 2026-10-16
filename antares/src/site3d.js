// ---------- деталізація майданчика: фасади цеху (вікна, ворота, цоколь), ТП (двері, жалюзі, дах, заземлення),
// блискавкозахист (дріт на тримачах, спуски з затискачами), колодязі заземлювачів, огорожі й знаки біля УЗЕ.
// Усе схематичне: у проєкті цих деталей немає, вигляд типовий. Збирається через Det (мало draw-call-ів).
essMats();
const S3={ glass:std(0x3a6a8c,0.35,0.15), frame:lam(0xdfe3e6), gate:lam(0x3f6a8f), gateS:lam(0xf0b400), plinth:lam(0x6b7177), door:lam(0x4c5961), louv:lam(0x2f383f),
  slat:lam(0xaab3b9), yel:lam(0xf0b400), handle:lam(0xc7ced3), slab:lam(0x5e6368), apron:lam(0xc7c4bb), pe:lam(0x7fb800), peY:lam(0xf0d000), hood:lam(0x7d878d),
  fence:lam(0xf0b400), black:lam(0x1d2124), red:lam(0xc4372b), well:lam(0xa9a59c,{side:THREE.DoubleSide}), iron:lam(0x3d4348), clip:lam(0x52595e) };
// межі стіни: вісь 'x' — стіна йде вздовж X (Y = const), 'y' — вздовж Y (X = const); dir — зовнішня нормаль
function wallOf(d,axis,c,dir){ return (mat,wid,hgt,thk,t,zc,off)=>{ const o=c+dir*off; d.box(mat, axis==='y'?thk:wid, hgt, axis==='y'?wid:thk, axis==='y'?o:t, zc, axis==='y'?t:o); }; }
function textSign(text,w,h,bg,fg,x,z,Y,rotY,parent){ const c=document.createElement('canvas'); c.width=256; c.height=Math.round(256*h/w); const g=c.getContext('2d');
  g.fillStyle=bg; g.fillRect(0,0,c.width,c.height); g.fillStyle=fg; g.font=`700 ${Math.round(c.height*0.58)}px "JetBrains Mono", ui-monospace, monospace`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,c.width/2,c.height/2+2);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t})); m.position.set(x,z,-Y); m.rotation.y=rotY; parent.add(m); return m; }
const ROT={xp:Math.PI/2, xm:-Math.PI/2, yp:Math.PI, ym:0};   // зовнішня нормаль +X, −X, +Y(світ −z), −Y(світ +z)

// ---- цех: цоколь, стрічкові вікна, ворота
{ const dW=new Det(), dF=new Det(), dG=new Det(), dP=new Det(), L=SHOP[3]-SHOP[2];
  const walls=[ {n:'S',axis:'x',c:SHOP[2],dir:-1,x0:3,x1:93,gates:[12,42,72],skip:[]},
                {n:'N',axis:'x',c:SHOP[3],dir:1,x0:27,x1:93,gates:[40,72],skip:[[-1,24.5]]},
                {n:'W',axis:'y',c:SHOP[0],dir:-1,x0:4,x1:92,gates:[30,65],skip:[]},
                {n:'E',axis:'y',c:SHOP[1],dir:1,x0:3,x1:93,gates:[],skip:[]} ];
  walls.forEach(w=>{ const f=(d)=>wallOf(d,w.axis,w.c,w.dir), fw=f(dW), ff=f(dF), fg=f(dG), fp=f(dP);
    const t0=w.axis==='x'?SHOP[0]:SHOP[2], t1=w.axis==='x'?SHOP[1]:SHOP[3];
    fp(S3.plinth,t1-t0,1.0,0.1,(t0+t1)/2,0.5,0.0);                 // цоколь
    fp(S3.frame,t1-t0,0.28,0.2,(t0+t1)/2,HV-0.9,0.02);                // карнизний пояс
    for(let t=w.x0;t<=w.x1;t+=6){ if(w.gates.some(g=>Math.abs(g-t)<3)) { /* вікна можуть бути й над воротами */ }
      ff(S3.frame,3.9,1.5,0.1,t,10.1,0.04); fw(S3.glass,3.6,1.2,0.06,t,10.1,0.1); }
    w.gates.forEach(g=>{ fg(S3.gate,4.2,4.6,0.14,g,2.3,0.07); fg(S3.gateS,4.2,0.25,0.04,g,0.3,0.16); fg(S3.gateS,4.2,0.25,0.04,g,4.2,0.16); fg(S3.handle,0.12,0.9,0.06,g+1.7,1.2,0.17); }); });
  dW.finish(G.bld,'Стрічкові вікна цеху\nумовно: у проєкті вікна й ворота цеху не наведені'); dF.finish(G.bld); dG.finish(G.bld,'Ворота цеху 4,2 × 4,6 м (умовно)'); dP.finish(G.bld,'Цоколь і карнизний пояс цеху (умовно)'); }

// ---- ТП: двері, жалюзі, дах із виносом, відмостка, смуга заземлення, написи
function tpDetail(tp,wallDef,doors,louvres,label,signs){
  const [X0,X1,Y0,Y1]=tp.b, h=tp.h, d=new Det(), dr=new Det(), ds=new Det();
  // дах із виносом і витяжні ковпаки
  d.box(S3.slab,X1-X0+0.5,0.22,Y1-Y0+0.5,(X0+X1)/2,h+0.11,(Y0+Y1)/2);
  d.box(S3.plinth,X1-X0+0.04,0.6,Y1-Y0+0.04,(X0+X1)/2,0.3,(Y0+Y1)/2);
  // відмостка з вільних боків
  const ap=1.2; wallDef.forEach(w=>{ if(w.axis==='y') d.box(S3.apron,ap,0.1,Y1-Y0+2*ap,w.c+w.dir*ap/2,0.05,(Y0+Y1)/2); else d.box(S3.apron,X1-X0+2*ap,0.1,ap,(X0+X1)/2,0.05,w.c+w.dir*ap/2); });
  wallDef.forEach(w=>{ const f=wallOf(dr,w.axis,w.c,w.dir), fs=wallOf(ds,w.axis,w.c,w.dir), fd=wallOf(d,w.axis,w.c,w.dir);
    const len=w.axis==='y'?Y1-Y0:X1-X0, mid=w.axis==='y'?(Y0+Y1)/2:(X0+X1)/2;
    // смуга заземлення ТП: жовто-зелена, на висоті 0,3 м уздовж стіни
    fd(S3.pe,len,0.04,0.02,mid,0.25,0.012); for(let k=0;k<=len;k+=4) fd(S3.peY,0.5,0.045,0.025,mid-len/2+k,0.25,0.014);
    (doors[w.n]||[]).forEach(([t,kind])=>{ const big=kind==='T', ww=big?2.2:1.1, hh=big?2.6:2.2;
      f(S3.door,ww,hh,0.1,t,hh/2,0.05); f(S3.louv,ww-0.3,0.18,0.04,t,hh-0.35,0.1); f(S3.handle,0.06,0.25,0.06,t+ww/2-0.2,1.1,0.12);
      if(big){ f(S3.door,0.05,hh,0.06,t,hh/2,0.11); }
      fs(S3.yel,0.32,0.32,0.02,t+ww/2+0.45,1.8,0.04); fs(S3.black,0.06,0.2,0.025,t+ww/2+0.45,1.78,0.06); });
    (louvres[w.n]||[]).forEach(t=>{ const zc=h-0.75; f(S3.louv,1.5,0.8,0.1,t,zc,0.05); for(let k=0;k<5;k++) f(S3.slat,1.4,0.04,0.05,t,zc-0.3+k*0.15,0.1); });
  });
  // витяжні ковпаки на даху
  const nh=Math.max(2,Math.round((Y1-Y0)/12)); for(let k=0;k<nh;k++){ const u=(X0+X1)/2, v=Y0+(Y1-Y0)*(k+0.5)/nh; d.box(S3.hood,1.4,0.5,0.9,u,h+0.47,v); d.box(S3.louv,1.2,0.3,0.92,u,h+0.47,v); }
  d.finish(G.bld,label); dr.finish(G.bld,label+'\nдвері й вентиляційні жалюзі (умовно)'); ds.finish(G.bld,'Знаки безпеки на дверях ТП'); }
// ТП-5913 (2 × ТМЗ-2500): зовнішній фасад +X, торці
tpDetail(TPS[2],[{axis:'y',c:103.0,dir:1,n:'E'},{axis:'x',c:-0.4,dir:-1,n:'S'},{axis:'x',c:34.6,dir:1,n:'N'}],
  {E:[[3.5,'L'],[9,'T'],[16,'H'],[22.5,'T'],[29,'L']],N:[[99.8,'L']]},{E:[6.2,12.6,19.2,25.8,31.8]},'ТП-5913 · 2 × ТМЗ-2500\nЩР-УЗЕ(AC)-1, -2 усередині');
textSign('ТП-5913',2.4,0.6,'#2446a3','#ffffff',103.07,4.1,17,ROT.xp,G.bld);
// ТП-6923 (ТМЗ-2500): фасад +Y
tpDetail(TPS[0],[{axis:'x',c:107.1,dir:1,n:'N'},{axis:'y',c:-0.5,dir:-1,n:'W'}],{N:[[4,'T'],[9.5,'L'],[14.5,'H']],W:[[101.5,'L']]},{N:[7,12,17.2]},'ТП-6923 · ТМЗ-2500\nЩР-УЗЕ(AC)-3 усередині');
textSign('ТП-6923',2.4,0.6,'#2446a3','#ffffff',9.5,4.1,107.17,ROT.yp,G.bld);
{ const t=TPS[1], d=new Det(), f=wallOf(d,'y',24.2,1); d.box(S3.slab,4.7+0.4,0.2,2.8+0.4,(19.5+24.2)/2,3.6,98); f(S3.door,1.1,2.2,0.1,98,1.1,0.05); f(S3.louv,1.0,0.5,0.06,98,2.85,0.05); d.finish(G.bld,'Прибудова ТП-6923 (умовно)'); }

// ---- блискавкозахист: дріт Ø8 на тримачах — справжні відрізки замість ліній; затискачі спусків
const WIRE_M=lam(0x2c9fc4);
const wireMats=[]; for(let i=0;i<wirePairs.length;i+=2){ const a=wirePairs[i], b=wirePairs[i+1], dv=b.clone().sub(a), L=dv.length(); if(L<1e-4) continue;
  wireMats.push(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),dv.normalize()),new THREE.Vector3(L,1,1))); }
const wireIM=info(inst(new THREE.BoxGeometry(1,0.034,0.034),WIRE_M,wireMats,G.lps,false),'Блискавкоприймальний дріт алюмінієвий Ø8 на тримачах H-303\n(на макеті трохи товстіший)');
wireLine.visible=false;
const clipIM=info(inst(merge([cylG(0.026,0.04,10,'y',0,0,0), cylG(0.05,0.012,10,'y',0,-0.02,0)]),S3.clip,clipM,G.down,false),'Тримач спуску (затискач) через ≈ 1,2 м по фасаду');
const peIM=info(inst(cylG(0.026,0.3,10,'y',0,0,0),S3.pe,peM,G.down,false),'Жовто-зелене маркування спуску біля контрольної коробки');
const wellIM=info(inst(merge([cylG(0.3,0.6,16,'y',0,-0.25,0), cylG(0.34,0.04,16,'y',0,0.04,0)]),S3.well,wellM,G.downUG,false),'Оглядовий колодязь заземлювача: стержень G-16/30 з затискачем, смуга W-25×4');

// ---- УЗЕ: захисні стовпчики, знаки, вогнегасник
{ const d=new Det(), dsg=new Det();
  D.pads.forEach(p=>{ const alongY=p.axis==='y'; const bx0=p.x0-1.0, bx1=p.x1+1.0, by0=p.y0-1.0, by1=p.y1+1.0;
    [[bx0,by0],[bx1,by0],[bx0,by1],[bx1,by1]].forEach(([X,Y])=>{ d.cyl(S3.fence,0.07,0.95,X,0.475,Y,'y',10); d.cyl(S3.black,0.072,0.12,X,0.75,Y,'y',10); });
    // вогнегасник на стійці і табличка біля майданчика
    const fx=alongY?p.x1+1.5:(p.x0+p.x1)/2, fy=alongY?(p.y0+p.y1)/2:p.y0-1.5;
    d.cyl(S3.black,0.03,1.2,fx,0.6,fy,'y',6); d.box(S3.red,0.4,0.55,0.3,fx,1.35,fy); d.cyl(S3.black,0.06,0.15,fx,1.7,fy,'y',8);
    dsg.box(S3.yel,0.5,0.5,0.03,fx,2.05,fy); dsg.box(S3.black,0.1,0.28,0.035,fx,2.03,fy); });
  d.finish(G.essE,'Захисні стовпчики по периметру майданчика УЗЕ й пост із вогнегасником (схематично)\nпроти протипожежних рішень у проєкті див. зауваження К4'); dsg.finish(G.essE); }
