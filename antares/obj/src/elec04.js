// ================= Електрика етапів 1 і 2: щити PV 7/1, лотки з лініями Al до контейнерів, спуски, ШВ (src/elec04.js)
// Дані — src/elec04data.js (calc/ep04: final.py → twin_export.py → prohody.py). 05.11.2026 — перевірка проходів на моделі і нова розводка:
//  • лотки й щити не посередині проходів, а біля краю: смуги Пд і Пн — на парапеті (кронштейни), схід — на парапеті (край поля зайнятий трубами Д36, Д57),
//    захід — на блоках біля краю поля; проходи Пн–Пд — біля східного краю; проходи Сх–Зх — біля південного краю, щит на рамі над лотком (власник 05.11);
//  • уздовж ендови — лише між ліхтарями Л1 і Л2 (з цієї ділянки іншого виходу немає), на підставках біля краю, вісь стоку вільна;
//  • щити південного фасаду — на даху біля парапету (власник 05.11; ЩФ-5/6 сходу знято 06.11), на фасаді лотка немає;
//  • спуски — у простінках: схід Y 53,9 (проміжок у модулях фасаду і козирку, навпроти К-3), північ X 11,95;
//  • ШВ К-3 / К-1 — на стіні цеху навпроти торців контейнерів (3 м до контейнера на землі вільні), ШВ К-5 — біля східного торця (не між К-4 і К-5);
//  • переходи через лотки на ходових смугах — жовті містки.
// Кнопка «Електрика» поруч з етапами в «Об'єкті»; показує елементи вибраного етапу (етап 1 — фасади, ліхтарі, склад; етап 2 — дах В1).
{ const E4=typeof ELEC04!=='undefined'?ELEC04:null, STx=window.__twin&&window.__twin.stages, R28=window.__twin&&window.__twin.r28, STG=()=>state.lay.stg;
  if(E4&&STx){
  const g=grp('elec04',G.ours); g.visible=false;
  const KC={'K-1':0xc0392b,'K-3':0xe67e22,'K-4':0x7b5bd6,'K-5':0x1aa3b4};
  const MM={}, Mk=k=>MM[k]||(MM[k]=new THREE.MeshStandardMaterial({color:lin(KC[k]),roughness:0.45}));
  const boxM=std(lin(0xd8dde0),{roughness:0.5,metalness:0.1}), trayM=std(lin(0x9aa3a8),{roughness:0.55,metalness:0.45}), lidM=std(lin(0xb9c0c4),{roughness:0.5,metalness:0.35}),
    blkM=std(lin(0x8f9294),{roughness:0.95}), brM=std(lin(0x6d757b),{roughness:0.5,metalness:0.5}), stepM=std(lin(0xe0b020),{roughness:0.6,metalness:0.2}),
    zoneM=new THREE.MeshBasicMaterial({color:lin(0x2e8b57),transparent:true,opacity:0.22,depthWrite:false,side:THREE.DoubleSide}),
    hitM=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  const PART={1:[],2:[]}, TPN={'K-1':'ТП-5913','K-3':'ТП-5913','K-4':'ТП-6923','K-5':'ТП-6923'};
  const [YS,Y1,Y2,YN]=E4.lines.Y, [XW,XV,,,XE]=E4.lines.X;
  const rz=x=>roofZ(Math.max(0,Math.min(96.64,x))), nfL=v=>nf(v,1), TW={'100×50':[0.10,0.05],'200×50':[0.20,0.05],'300×100':[0.30,0.10],'400×100':[0.40,0.10]};
  // ---------- злиті коробки (лотки, кришки, блоки, кронштейни, містки) — по одній сітці на матеріал і етап
  const MB={}, mbOf=(st,m)=>MB[st+'|'+m.uuid]||(MB[st+'|'+m.uuid]={st,m,P:[],N:[],I:[]});
  const _x=new V3(), _y=new V3(), _z=new V3();
  function cub(st,m,c,X,Y,Z,sx,sy,sz){ const b=mbOf(st,m), v0=b.P.length/3, hx=sx/2, hy=sy/2, hz=sz/2;
    [[X,1],[X,-1],[Y,1],[Y,-1],[Z,1],[Z,-1]].forEach(([n,sg],f)=>{ const nn=n.clone().multiplyScalar(sg), [a,bb]=f<2?[Y,Z]:f<4?[Z,X]:[X,Y], ha=f<2?hy:f<4?hz:hx, hb=f<2?hz:f<4?hx:hy, hn=f<2?hx:f<4?hy:hz, s0=b.P.length/3;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([i,j])=>{ const p=c.clone().addScaledVector(nn,hn).addScaledVector(a,i*ha*sg).addScaledVector(bb,j*hb); b.P.push(p.x,p.y,p.z); b.N.push(nn.x,nn.y,nn.z); });
      b.I.push(s0,s0+1,s0+2,s0,s0+2,s0+3); }); }
  // коробка між двома точками: X — уздовж, Z — ширина (вектор side), Y — висота
  function bar(st,m,a,b,w,h,side,up=0){ const d=b.clone().sub(a), L=d.length(); if(L<1e-4) return; _x.copy(d).divideScalar(L); _z.copy(side).addScaledVector(_x,-side.dot(_x)).normalize(); _y.crossVectors(_z,_x).normalize();
    const c=a.clone().add(b).multiplyScalar(0.5).addScaledVector(_y,h/2+up); cub(st,m,c,_x.clone(),_y.clone(),_z.clone(),L,h,w); }
  const HITS=[];
  function hit(a,b,w,info,st){ const d=b.clone().sub(a), L=d.length(); if(L<0.2) return; const o=new THREE.Mesh(new THREE.BoxGeometry(L,0.5,Math.max(0.5,w+0.3)),hitM);
    o.position.copy(a).add(b).multiplyScalar(0.5); o.position.y+=0.15; o.quaternion.setFromUnitVectors(new V3(1,0,0),d.normalize()); g.add(o); PART[st].push(o); o.userData.info=info; PICK.push({o,when:()=>g.visible&&o.visible}); }
  const SX=new V3(0,0,1), SZ=new V3(1,0,0);   // ширина: для відрізків уздовж X — по плановому Y (вісь three Z), уздовж Y — по X
  // висота лотка над покрівлею: на блоках — блок 0,06 + траверса 0,04; на парапеті — 0,30 на кронштейнах; ендова — на підставках 0,25
  const zOf=(m,x,y)=>m==='par'?rz(x)+0.30:(Math.abs(x-XV)<1e-3&&y>Y1-0.01)?rz(x)+0.25:rz(x)+0.10;
  const mntT={par:'на кронштейнах на парапеті (без блоків на ходовій смузі)',blk:'на траверсах на баластних блоках біля краю поля'};
  const zn=(a,b)=>Math.abs(a[1]-b[1])<1e-6?(Math.abs(a[1]-YS)<1e-3?'смуга Пд, біля парапету':Math.abs(a[1]-YN)<1e-3?'смуга Пн, біля парапету':'прохід Сх–Зх, біля південного краю'):
    (Math.abs(a[0]-XW)<1e-3?'смуга Зх, біля краю поля':Math.abs(a[0]-XE)<1e-3?'смуга Сх, біля парапету':Math.abs(a[0]-XV)<1e-3?'уздовж ендови між Л1 і Л2, на підставках біля краю':'прохід Пн–Пд, біля східного краю');
  const ids=(a,b)=>E4.routes.filter(r=>r.pts.some((p,i)=>i<r.pts.length-1&&((Math.abs(p[0]-a[0])<0.02&&Math.abs(p[1]-a[1])<0.02)||onSeg(a,b,p,r.pts[i+1])))).map(r=>r.id);
  function onSeg(a,b,p,q){ const h=Math.abs(a[1]-b[1])<1e-6; if(h){ if(Math.abs(p[1]-a[1])>0.02||Math.abs(q[1]-a[1])>0.02) return false; const m=(a[0]+b[0])/2; return m>Math.min(p[0],q[0])-0.01&&m<Math.max(p[0],q[0])+0.01; }
    if(Math.abs(p[0]-a[0])>0.02||Math.abs(q[0]-a[0])>0.02) return false; const m=(a[1]+b[1])/2; return m>Math.min(p[1],q[1])-0.01&&m<Math.max(p[1],q[1])+0.01; }
  // ---------- лотки на даху за відрізками
  E4.segs.forEach(s=>{ const [w,h]=TW[s.w]||[0.1,0.05], hor=Math.abs(s.a[1]-s.b[1])<1e-6, side=hor?SX:SZ, st=s.st;
    const L=Math.abs(s.b[0]-s.a[0])+Math.abs(s.b[1]-s.a[1]), n=hor?Math.max(1,Math.ceil(L)):1, P=[];
    for(let i=0;i<=n;i++){ const t=i/n, x=s.a[0]+(s.b[0]-s.a[0])*t, y=s.a[1]+(s.b[1]-s.a[1])*t; P.push(W(x,y,zOf(s.m,x,y))); }
    for(let i=0;i<n;i++){ bar(st,trayM,P[i],P[i+1],w,h,side); bar(st,lidM,P[i],P[i+1],w+0.02,0.006,side,h); }
    // опори: блок з траверсою через 1,3 м або кронштейн на парапеті через 1,0 м
    const k=s.m==='par'?1.0:1.3, m=Math.max(1,Math.round(L/k));
    for(let i=0;i<=m;i++){ const t=i/m, x=s.a[0]+(s.b[0]-s.a[0])*t, y=s.a[1]+(s.b[1]-s.a[1])*t, z=zOf(s.m,x,y), c=W(x,y,z), ax=hor?new V3(1,0,0):new V3(0,0,-1), sd=hor?SX.clone():SZ.clone();
      if(s.m==='par'){ const toW=hor?(Math.abs(y-YS)<1e-3?new V3(0,0,1):new V3(0,0,-1)):new V3(1,0,0); cub(st,brM,c.clone().addScaledVector(toW,w/2+0.03).add(new V3(0,-0.02,0)),ax,new V3(0,1,0),sd,0.04,0.12,0.06); }
      else { const zr=rz(x); cub(st,blkM,W(x,y,zr+0.03),ax,new V3(0,1,0),sd,0.30,0.06,0.30); cub(st,brM,W(x,y,zr+0.08),ax,new V3(0,1,0),sd,0.041,0.041,w+0.1);
        if(Math.abs(x-XV)<1e-3&&y>Y1-0.01) cub(st,brM,W(x,y,zr+0.17),ax,new V3(0,1,0),sd,0.041,0.16,0.041); } }
    const li=ids(s.a,s.b);
    hit(P[0],P[P.length-1],w,{t:`Лоток ${s.w} з кришкою · ${s.n} ${s.n===1?'лінія':s.n<5?'лінії':'ліній'} · етап ${st}`,d:`${zn(s.a,s.b)[0].toUpperCase()+zn(s.a,s.b).slice(1)}; ${mntT[s.m]||''}. ${nfL(L)} м. Лінії Al: ${li.join(', ')||'—'}. Ширина лотка — під кінцеву кількість ліній обох етапів.`},st); });
  // ---------- переходи через лотки (жовті містки) і короткі лотки стрінгів через смугу біля щитів
  const step=(x,y,along,st,info)=>{ const z=rz(x)+0.18, c=W(x,y,z), ax=along==='x'?new V3(1,0,0):new V3(0,0,-1), sd=along==='x'?SX.clone():SZ.clone();
    cub(st,stepM,c,ax,new V3(0,1,0),sd,0.9,0.03,1.0); cub(st,stepM,c.clone().addScaledVector(ax,0.55).add(new V3(0,-0.07,0)),ax,new V3(0,1,0),sd,0.25,0.02,1.0); cub(st,stepM,c.clone().addScaledVector(ax,-0.55).add(new V3(0,-0.07,0)),ax,new V3(0,1,0),sd,0.25,0.02,1.0);
    const o=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.5,1.2),hitM); o.position.copy(c); if(along!=='x') o.rotation.y=Math.PI/2; g.add(o); PART[st].push(o); o.userData.info=info; PICK.push({o,when:()=>g.visible&&o.visible}); };
  const CRN={'Пд':'смугу Пд','Пн':'смугу Пн','Зх':'смугу Зх','Сх':'смугу Сх','Сх–Зх':'прохід Сх–Зх','Пн–Пд':'прохід Пн–Пд'};
  E4.cross.forEach(([nm,x,y,st])=>{ const along=(nm==='Пн–Пд'||nm==='Сх')?'y':'x';   // хода по смузі: Пд, Пн, Сх–Зх — уздовж X; Пн–Пд, Сх — уздовж Y
    step(x,y,along,st,{t:`Перехід через лоток · ${CRN[nm]||nm} · етап ${st}`,d:'Лоток тут перетинає ходову смугу або вихід з проходу — над ним сталевий місток з рифленого листа 1,2 м з пандусами, щоб не спотикатися і не ставати на кришку.'}); });
  // ---------- щити PV
  const BB=new THREE.BoxGeometry(0.6,0.5,0.2), rbox=[];   // 07.11: корпус щита PV 7/1 600 × 500 × 200 (calc/ep04/shchyt_pv.py)
  const tagBox=(o,b,extra)=>{ o.userData.info={t:`${b.id} · щит PV 7/1 · етап ${b.st} → ${b.K} (${TPN[b.K]})`,d:`${b.ns} стрінгів по 11 модулів, ${nfL(b.kwp)} кВтп, 1 вхід DC/DC 60 кВт. ${extra} Лінія Al 2 × 1×${b.S} мм², ${nfL(b.L)} м до ШВ, падіння напруги ${nf(b.du,2)} % при STC. Переріз — мінімум «кабель + втрати за 25 років».`}; PICK.push({o,when:()=>g.visible&&o.visible}); };
  const cap=(o,b,st)=>{ const s=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.05,0.22),Mk(b.K)); s.position.copy(o.position); s.position.y+=0.275; s.rotation.copy(o.rotation); g.add(s); PART[st].push(s); };
  E4.boxes.forEach(b=>{ let o=null, ex='';
    const onRoof=b.z==='roof'||b.z==='lan'||b.roof;
    if(onRoof){ const x=b.X, y=b.Y; o=new THREE.Mesh(BB,boxM);
      if(Math.abs(x-XE)<1e-3&&b.roof){ o.rotation.y=Math.PI/2; o.position.copy(W(96.39-0.35,y,rz(96.4)+0.62)); ex='На даху біля східного парапету, на рамі з 4 блоками (за прибудовою ТП-5913 на фасаді місця немає); стрінги — угору за модулями фасаду і через парапет.';
        [[-0.3,-0.45],[0.3,-0.45],[-0.3,0.45],[0.3,0.45]].forEach(([dx,dy])=>cub(b.st,blkM,W(96.04+dx,y+dy,rz(96.4)+0.03),new V3(1,0,0),new V3(0,1,0),SX.clone(),0.3,0.06,0.3)); }
      else if(Math.abs(y-YS)<1e-3){ o.position.copy(W(x,-0.25+0.11,rz(x)+0.60)); ex=b.roof?'На даху на південному парапеті (кронштейни): стрінги фасаду — угору за модулями (зазор 0,16 м) і через парапет у щит; на фасаді лотка немає.':'На південному парапеті (кронштейни): ходова смуга лишається вільною; стрінги з краю поля — коротким лотком через смугу з перехідним містком.'; }
      else if(Math.abs(y-YN)<1e-3){ o.position.copy(W(x,96.34-0.11,rz(x)+0.60)); ex='На північному парапеті (кронштейни); стрінги з краю поля — коротким лотком через смугу з перехідним містком.'; }
      else { o.position.copy(W(x,y+0.15,rz(x)+0.70)); ex=b.z==='lan'?'Біля ліхтаря, на південному краю проходу Сх–Зх, на рамі над лотком (4 блоки).':'На південному краю проходу Сх–Зх, на рамі над лотком (4 блоки): тінь падає в прохід, не на модулі; стрінги з північного поля — через прохід лотком з містком.';
        [[-0.42,-0.1],[0.42,-0.1],[-0.42,0.42],[0.42,0.42]].forEach(([dx,dy])=>{ cub(b.st,blkM,W(x+dx,y+dy,rz(x)+0.03),new V3(1,0,0),new V3(0,1,0),SX.clone(),0.3,0.06,0.3); cub(b.st,brM,W(x+dx,y+dy,rz(x)+0.17),new V3(1,0,0),new V3(0,1,0),SX.clone(),0.041,0.22,0.041); }); }
      g.add(o); PART[b.st].push(o); cap(o,b,b.st); rbox.push(b);
      // короткий лоток стрінгів від краю поля через смугу до щита + місток (дах; фасадні стрінги ідуть через парапет)
      if(b.z==='roof'){ let y0=null, y1=null;
        if(Math.abs(y-YS)<1e-3){ y0=2.29; y1=-0.05; } else if(Math.abs(y-YN)<1e-3){ y0=93.88; y1=96.15; } else if(Math.abs(y-Y1)<1e-3){ y0=33.65; y1=y+0.3; } else if(Math.abs(y-Y2)<1e-3){ y0=65.0; y1=y+0.3; }
        if(y0!==null){ const xs=x+0.6; bar(b.st,trayM,W(xs,y0,rz(xs)+0.10),W(xs,y1,rz(xs)+0.10),0.1,0.05,SZ); bar(b.st,lidM,W(xs,y0,rz(xs)+0.10),W(xs,y1,rz(xs)+0.10),0.12,0.006,SZ,0.05);
          step(xs,(y0+y1)/2,'x',b.st,{t:`Стрінги до ${b.id} через ходову смугу · етап ${b.st}`,d:`Короткий лоток 100×50 з кришкою від краю поля до щита (${nf(Math.abs(y1-y0),1)} м) і місток над ним, щоб смуга лишалась прохідною.`}); } } }
    else if(b.z==='fac'){ o=new THREE.Mesh(BB,boxM); o.rotation.y=Math.PI/2; o.position.set(96.64+0.12,3.0,-b.s); g.add(o); PART[1].push(o); cap(o,b,1); ex='На східному фасаді на 3,0 м (тут немає воріт і вікон).'; }
    else if(b.z==='abk'){ o=new THREE.Mesh(BB,boxM); o.position.copy(W(b.X,b.Y+0.1,(b.z0||10.55)+0.25)); g.add(o); PART[1].push(o); cap(o,b,1);
      ex='На північній стіні надбудови АБК над нижнім дахом (+10,55), там, де сходяться лотки стрінгів. Лінія — лотком по нижньому даху на захід, через західний парапет, з кута АБК тросом прямо на східний фасад цеху над прибудовою ТП-5913, вниз до лотка на 5,0 м і до ШВ. Щит — на окремий вільний вхід MPPT контейнера.'; }
    else { o=new THREE.Mesh(BB,boxM); o.position.copy(W(b.X,b.wall==='AB'?b.Y-0.1:b.Y+0.05,1.25));   // 07.11: корпус 200 мм — задньою стінкою до стіни складу g.add(o); PART[1].push(o); cap(o,b,1);
      ex=b.z==='whn'?`На північній стіні складу, низ на 1,0 м — обслуговування з проїзду. Опція етапу 1: стрінги північних скатів C1 / C2 — під модулями вгору до гребеня, лотком до спуску на західному торці і під карнизом до щита; окремий вхід MPPT ${String(b.K).replace('K','К')}. Лінія — як у щитів складу: під карнизом до стійки на куті C1, тросом через проїзд, лотком по фасаду цеху.`:`На північній стіні складу, низ на 1,0 м — обслуговування з проїзду. Стрінги — під модулями вгору до ${b.wall==='AB'?'верхнього краю скату':'гребеня'}, лотком до щита і по стіні вниз. Лінія — лотком під карнизом до стійки на куті C1, тросом через проїзд на південну стіну цеху і лотком на 5,0 м по східному фасаду над ТП-5913 до ШВ.`; }
    tagBox(o,b,ex); });
  // ---------- спуски, лотки по фасаду, ШВ
  const sh=E4.shv, [ex,ey]=E4.DE, [nx,ny]=E4.DN, nE=E4.boxes.filter(b=>(b.K==='K-3'||b.K==='K-1')&&(b.z==='roof'||b.z==='lan'||b.roof)).length,
    nE1=E4.boxes.filter(b=>b.K==='K-1'&&(b.z==='roof'||b.z==='lan'||b.roof)).length, nN=E4.boxes.filter(b=>b.K==='K-4'||b.K==='K-5').length, n1N=E4.boxes.filter(b=>(b.K==='K-4'||b.K==='K-5')&&b.st===1).length;
  const TWn=n=>n<=3?'100×50':n<=6?'200×50':n<=18?'300×100':'400×100', twd=n=>TW[TWn(n)];
  const vtray=(pts,n,st,side,info)=>{ const [w,h]=twd(n); for(let i=0;i<pts.length-1;i++){ bar(st,trayM,pts[i],pts[i+1],w,h,side); bar(st,lidM,pts[i],pts[i+1],w+0.02,0.006,side,h);
      const d=pts[i+1].clone().sub(pts[i]), L=d.length(), m=Math.max(1,Math.round(L/1.0)); for(let j=0;j<=m;j++){ const c=pts[i].clone().lerp(pts[i+1],j/m); cub(st,brM,c,new V3(1,0,0),new V3(0,1,0),new V3(0,0,1),0.05,0.05,0.05); } }
    for(let i=0;i<pts.length-1;i++) hit(pts[i],pts[i+1],twd(n)[0],info,st); };
  const zE=rz(96.4);
  // схід: парапет → фасад у простінку Y 53,9 → ШВ К-3 (Y 53,3); гілка К-1 — по фасаду на 3,5 м до Y 62,7 і вниз до ШВ К-1
  vtray([W(ex,ey,zE+0.30),W(96.64+0.12,ey,zE+0.95),W(96.64+0.12,ey,3.5),W(96.64+0.12,ey,2.25)],nE,1,new V3(0,0,1),{t:`Спуск Сх · ${nE} ліній · етап 1`,d:`Лоток ${TWn(nE)} через парапет і по східному фасаду в простінку між вікнами (Y ${nf(ey,1)}): тут немає модулів фасаду (ряди 10,3 і 12,7 м) і козирка. Унизу — ШВ К-3 на стіні навпроти торця контейнера.`});
  vtray([W(96.64+0.12,ey,3.5),W(96.64+0.12,sh['K-1'][1],3.5),W(96.64+0.12,sh['K-1'][1],2.25)],nE1,1,new V3(0,-1,0),{t:`Гілка Сх → ШВ К-1 · ${nE1} ліній · етап 1`,d:'По фасаду на 3,5 м (нижче наявних ярусів кабелів 5,6 і 6,1 м; воріт і вікон тут немає) до ШВ К-1 на стіні навпроти торця К-1.'});
  // лотки східного фасаду від щитів ЩФ (Y > 34,6) до ШВ К-1
  E4.boxes.filter(b=>b.z==='fac'&&!b.roof).forEach(b=>vtray([W(96.64+0.12,b.s,3.5),W(96.64+0.12,sh[b.K][1],3.5)],1,1,new V3(0,-1,0),{t:`Лоток ${b.id} → ШВ ${b.K} · етап 1`,d:`По східному фасаду на 3,5 м від щита до ШВ (${nf(Math.abs(sh[b.K][1]-b.s),1)} м); Al 2 × 1×${b.S}.`}));
  // північ: парапет → стіна цеху в простінку X 11,95 → дах ТП-6923 → місток над приямком → берма → ШВ К-4 (захід) і К-5 (схід)
  const stN=n1N?1:2, zN=rz(nx);
  vtray([W(nx,ny,zN+0.30),W(nx,96.59+0.12,zN+0.95),W(nx,96.59+0.12,4.75),W(nx,107.0,4.75),W(nx,107.3,4.75),W(nx,109.6,2.5),W(nx,109.95,2.45)],nN,stN,new V3(1,0,0),{t:`Спуск ПнЗх · ${nN} ліній · етап ${stN}`,d:`Лоток ${TWn(nN)} через парапет, по північній стіні цеху в простінку між вікнами (X ${nf(nx,2)}), дахом ТП-6923, містком над приямком на берму +1,8 м. ${n1N?'Будується в етапі 1.':'Будується в етапі 2: в етапі 1 ліній PV до ТП-6923 немає (К-4, К-5 працюють лише від мережі).'}`});
  const nK4=E4.boxes.filter(b=>b.K==='K-4').length, nK5=E4.boxes.filter(b=>b.K==='K-5').length;
  vtray([W(nx,109.95,2.45),W(sh['K-4'][0],109.95,2.45),W(sh['K-4'][0],sh['K-4'][1]-0.3,2.45)],nK4,stN,new V3(0,0,1),{t:`Лоток на бермі → ШВ К-4 · ${nK4} ліній`,d:'Уздовж краю берми (за огородженням) до західного торця К-4.'});
  vtray([W(nx,109.95,2.45),W(sh['K-5'][0],109.95,2.45),W(sh['K-5'][0],sh['K-5'][1]-0.3,2.45)],nK5,stN,new V3(0,0,1),{t:`Лоток на бермі → ШВ К-5 · ${nK5} ліній`,d:'Уздовж краю берми до східного торця К-5 — ШВ не стоїть у проміжку між К-4 і К-5.'});
  // ШВ і Cu 1×50 у трубах під майданчиком до входів PV контейнера
  const PVK={}; (typeof BS!=='undefined'&&BS?BS.K:[]).forEach(k=>{ if(k.pv) PVK[k.id]=k.pv[0]; }); PVK['K-4']=[4.2,111.6]; PVK['K-5']=[12.0,111.6];
  const dash=(a,b,mat,st)=>{ const L=a.distanceTo(b), n=Math.max(1,Math.round(L/0.7)), d=b.clone().sub(a).normalize(), sd=new V3(0,1,0).cross(d); if(sd.lengthSq()<1e-6) sd.set(0,0,1);
    for(let j=0;j<n;j+=2) bar(st,mat,a.clone().lerp(b,j/n),a.clone().lerp(b,Math.min(1,(j+1)/n)),0.06,0.06,sd.normalize()); };
  Object.entries(sh).forEach(([k,p])=>{ const berm=k==='K-4'||k==='K-5', h0=berm?1.8:0, o=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.3,0.45),Mk(k));
    if(berm) o.position.copy(W(p[0],p[1],h0+0.65)); else { o.rotation.y=Math.PI/2; o.position.copy(W(96.64+0.25,p[1],1.45)); }
    g.add(o); PART[1].push(o);
    o.userData.info={t:`ШВ ${k} — шафа вводу PV біля контейнера`,d:`${berm?'На бермі біля '+(k==='K-4'?'західного':'східного')+' торця контейнера.':'На стіні цеху навпроти торця контейнера: 3 м між стіною і контейнером на землі лишаються вільними (вільна зона Golen — погодити).'} Перехід Al → Cu 1×50 на 12 входів DC/DC, ПЗІП T2 на кожному вході, шина PE. Входів зайнято: ${E4.inp[k]} з 12, DC ${nf(E4.kwp[k])} кВтп. Cu 1×50 — у трубах ПНД Ø63 під майданчиком до вводів PV у дні контейнера.`};
    PICK.push({o,when:()=>g.visible});
    const q=PVK[k]; if(q){ const a=berm?W(p[0],p[1],h0-0.15):W(96.64+0.25,p[1],-0.15), b=W(q[0],q[1],h0-0.15); dash(a,W(q[0],p[1],h0-0.15),brM,1); dash(W(q[0],p[1],h0-0.15),b,brM,1); } });
  // ---------- ходові смуги і проходи даху (зелені): що має лишатися вільним
  { const RI=[-0.13,96.49,-0.25,96.34], Z=[[RI[0],RI[1],RI[2],2.29,'Пд'],[RI[0],RI[1],93.88,RI[3],'Пн'],[RI[0],2.185,RI[2],RI[3],'Зх'],[93.785,RI[1],RI[2],RI[3],'Сх'],
      [RI[0],RI[1],31.14,33.65,'Сх–Зх'],[RI[0],RI[1],62.50,65.01,'Сх–Зх'],[35.74,37.78,RI[2],RI[3],'Пн–Пд'],[53.35,56.11,RI[2],RI[3],'Пн–Пд']];
    const LZ=(R28&&R28.D&&R28.D.frames)||[]; const inLan=(x,y)=>LZ.some(f=>y>=f.y0-0.3&&y<=f.y1+0.3&&Math.abs(x-f.xc)<=f.hw+0.1);
    const P=[], I=[]; Z.forEach(([x0,x1,y0,y1])=>{ const nx_=Math.max(1,Math.ceil((x1-x0)/1.0)), ny_=Math.max(1,Math.ceil((y1-y0)/1.0));
      for(let i=0;i<nx_;i++) for(let j=0;j<ny_;j++){ const xa=x0+(x1-x0)*i/nx_, xb=x0+(x1-x0)*(i+1)/nx_, ya=y0+(y1-y0)*j/ny_, yb=y0+(y1-y0)*(j+1)/ny_; if(inLan((xa+xb)/2,(ya+yb)/2)) continue;
        const v=P.length/3; [[xa,ya],[xb,ya],[xb,yb],[xa,yb]].forEach(([x,y])=>{ const p=W(x,y,rz(x)+0.025); P.push(p.x,p.y,p.z); }); I.push(v,v+1,v+2,v,v+2,v+3); } });
    const ge=new THREE.BufferGeometry(); ge.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); ge.setIndex(I); const zm=new THREE.Mesh(ge,zoneM); zm.renderOrder=2; zm.name='e04zones'; g.add(zm);
    zm.userData.info={t:'Ходові смуги і проходи даху',d:'Зелені — те, що має лишатися вільним: відступи від парапетів 1,83 м, проходи Пн–Пд 1,22 м, протипожежні розриви Сх–Зх 2,49 м. Лотки і щити — біля краю, ширину, що лишається, показано в «Електрика → Лінії і лотки».'}; }
  // ---------- злиті сітки
  Object.values(MB).forEach(b=>{ if(!b.I.length) return; const ge=new THREE.BufferGeometry(); ge.setAttribute('position',new THREE.Float32BufferAttribute(b.P,3)); ge.setAttribute('normal',new THREE.Float32BufferAttribute(b.N,3));
    ge.setIndex(b.P.length/3>65000?new THREE.Uint32BufferAttribute(b.I,1):new THREE.Uint16BufferAttribute(b.I,1)); const m=new THREE.Mesh(ge,b.m); m.castShadow=false; m.receiveShadow=true; g.add(m); PART[b.st].push(m); });
  // ---------- видимість: кнопка «Електрика» у режимі етапів, розділ «Об'єкт»
  const onE=()=>!!state.lay.e04&&state.sec==='pz'&&state.proj==='ours'&&!!(R28&&R28.ON());
  const sv4=setVis; setVis=function(){ sv4.apply(this,arguments); const on=onE(); g.visible=on; if(!on) return; const s=STG();
    PART[1].forEach(o=>o.visible=s!=='2'); PART[2].forEach(o=>o.visible=s!=='1'); need=true; };
  const hud4=hudCtx; hudCtx=function(){ hud4.apply(this,arguments); if(state.sec!=='pz'||!(R28&&R28.ON())) return; const m=$('#modes'); if(!m) return;
    const b=document.createElement('button'); b.type='button'; b.textContent='Електрика'; b.title='Щити PV, лотки і лінії до контейнерів, спуски, ШВ'; b.setAttribute('aria-pressed',String(!!state.lay.e04));
    b.onclick=()=>{ state.lay.e04=!state.lay.e04; apply(); save(); }; if(m.querySelector('button')){ const sp=document.createElement('span'); sp.className='sep'; sp.setAttribute('aria-hidden','true'); m.appendChild(sp); } m.appendChild(b); m.hidden=false;
    const l=$('#legend'); if(l&&state.lay.e04){ const s=STG(), n=st=>E4.boxes.filter(x=>x.st===st).length, nc=st=>E4.cross.filter(c=>s==='all'||String(c[3])===s).length+(s==='1'?0:E4.boxes.filter(b=>b.z==='roof').length);
      l.insertAdjacentHTML('beforeend',`<span class="e4">Електрика: щитів ${s==='2'?n(2):s==='1'?n(1):n(1)+n(2)} · ${['K-3','K-1','K-4','K-5'].filter(k=>E4.boxes.some(x=>x.K===k&&(s==='all'||String(x.st)===s))).map(k=>`<i class="sw" style="background:#${new THREE.Color(KC[k]).getHexString()}"></i>${k}`).join(' ')} · <i class="sw" style="background:#9aa3a8"></i>лотки · <i class="sw" style="background:#e0b020"></i>переходи (${nc(1)}) · <i class="sw" style="background:#7fbf9a"></i>має лишатися вільним</span>`); } };
  window.__twin.elec04={g,PART,E4};
  if(window.__twin.clean) apply();   // чиста збірка: перший apply() був до цього модуля — кнопка «Електрика» і її шар з'являються одразу
  } }
