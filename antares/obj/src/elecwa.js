// ================= Електрика складу і АБК + стрінги всіх груп одним стилем (src/elecwa.js; дані ELECWA — calc/ep04/wh_abk.py, ELECSTR — calc/ep04/strings_all.py)
// Власник 04.11, 16:58 — «електрика з АБК та зі складу ніяк не прорахована і не показана»; 17:19 — «знову вийшла херня, якась цвітна, незрозуміла… розділи все це на стрінги,
// порахуй кількість стрінгів… підключення цих стрінгів до щитків… в одному стилі, однаково».
// Один стиль для всіх груп (дах, ліхтарі, фасади й козирок, склад, АБК): колір модуля — контейнер, куди йде щит (К-3, К-1, К-4, К-5; АБК — свій інвертор);
// сусідні стрінги — темний і світлий тон того самого кольору; кабель стрінга до щита — тонка темна лінія того самого кольору; над щитом — табличка «щит → контейнер · стрінгів · кВтп».
// Склад і АБК (05.11): щити на стінах, лінії Al до ШВ К-3 / К-1 у траншеї через проїзд між ТП-5913 і АБК (calc/ep04/abk_wh.py).
// АБК: кабелі стрінгів моделі АБК (кольором контейнера), лотки, щити ЩА-1 / ЩА-2 замість інвертора. Кнопка — та сама «Електрика» в «Об'єкті».
{ const EW=typeof ELECWA!=='undefined'?ELECWA:null, ES=typeof ELECSTR!=='undefined'?ELECSTR:null, E4w=window.__twin.elec04, Aw=window.__twin.abk, EPw=window.__twin.EPX;
const CDw=window.__twin.cleanDbg, FPw=window.__twin.facpv, L28w=window.__twin.lan28, R28w=window.__twin.r28;
if(EW&&ES&&E4w&&CDw){
const g=grp('elecwa',G.ours), g2=grp('elecwa2',G.ours), gE=grp('elecwaE',G.ours); g.visible=g2.visible=gE.visible=false;   // gE — лінії складу й інвертор АБК (шар «Електрика»)   // g — етап 1 (фасади, ліхтарі, склад, АБК), g2 — етап 2 (дах В1)
const KCw={'K-1':0xc0392b,'K-3':0xe67e22}, nf1=v=>nf(v,1), nf2=v=>nf(v,2);
const mk=c=>new THREE.MeshStandardMaterial({color:lin(c),roughness:0.45});
const tubeW=(pts,mat,r,info)=>{ if(pts.length<2) return null; const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'catmullrom',0.0),Math.max(16,pts.length*8),r,8,false),mat);
  m.castShadow=false; gE.add(m); if(info){ m.userData.info=info; PICK.push({o:m,when:()=>gE.visible}); } return m; };
const dashW=(a,b,mat,r)=>{ const L=a.distanceTo(b), n=Math.max(1,Math.round(L/0.8)); for(let j=0;j<n;j+=2){ const p0=a.clone().lerp(b,j/n), p1=a.clone().lerp(b,Math.min(1,(j+1)/n)); tubeW([p0,p1],mat,r); } };
// ---------- склад і АБК → ШВ К-3 / К-1 (05.11, calc/ep04/abk_wh.py): щити на стінах, лотки стрінгів складу, лоток і спуск ліній АБК, траншея в проїзді між ТП-5913 і АБК
const trayMw=new THREE.MeshStandardMaterial({color:lin('#9aa7b3'),roughness:0.4,metalness:0.45}), trenchM=new THREE.MeshBasicMaterial({color:lin('#8a6a3a'),transparent:true,opacity:0.8,depthWrite:false});
const barW=(a,b,w,h,mat,info)=>{ const L=a.distanceTo(b); if(L<1e-3) return null; const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,L),mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); m.castShadow=false; gE.add(m);
  if(info){ m.userData.info=info; PICK.push({o:m,when:()=>gE.visible}); } return m; };
const polyW=(pts,w,h,mat,info)=>{ for(let i=0;i<pts.length-1;i++) barW(W(...pts[i]),W(...pts[i+1]),w,h,mat,info); };
const C=EW.consts||{DEP:0.7}, KNw=k=>String(k).replace('K','К');
// лінії: над землею — суцільно, у траншеї — пунктиром на рівні землі
const isRopeW=(a,b)=>(EW.ropes||[]).some(r=>[0,1,2].every(j=>Math.abs(r.a[j]-a[j])<1e-3&&Math.abs(r.b[j]-b[j])<1e-3));   // відрізок лінії = трос (за списком тросів розрахунку)
const lineW=(o,info)=>{ const mat=mk(KCw[o.K]||0x888888), P=o.pts.map(p=>W(p[0],p[1],p[2]<0?0.06:p[2]));
  for(let i=0;i<P.length-1;i++){ const a=o.pts[i], b=o.pts[i+1], under=a[2]<0&&b[2]<0, rope=isRopeW(a,b);
    if(under) dashW(P[i],P[i+1],mat,0.045); else if(rope){ const m=P[i].clone().lerp(P[i+1],0.5); m.y-=0.25; tubeW(new THREE.QuadraticBezierCurve3(P[i],m,P[i+1]).getPoints(16),mat,0.045,info); } else tubeW([P[i],P[i+1]],mat,0.045,info); }
  const hit=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P,false,'catmullrom',0.0),Math.max(48,P.length*8),0.3,6,false),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  gE.add(hit); hit.userData.info=info; PICK.push({o:hit,when:()=>gE.visible}); };
const WHL={};
EW.wh.forEach(w=>{ const info={t:`Лінія Al ${w.id} → ШВ ${KNw(w.K)} (ТП-5913) · склад, етап 1`,d:`${w.ns} стрінгів по 11, ${nf1(w.kwp)} кВтп. Al 2 × 1×${w.S} мм², ${nf1(w.L)} м, ΔU ${nf2(w.du)} % при STC, втрати ${nf2(w.pk)} кВт (≈${nf(w.e,0)} кВт·год за рік). ${EW.mode==='air'?`Від щита по стіні вгору → лотком під карнизом складу до стійки на куті C1 → тросом через проїзд на південну стіну цеху → лотком на 5,0 м по східному фасаду над ТП-5913 → ШВ ${KNw(w.K)}.`:`Від щита по стіні вниз → у траншеї (труба ПНД Ø63, глибина 0,7 м) уздовж північної стіни складу → через проїзд → уздовж західної стіни АБК → на захід до траншеї AC контейнерів → ШВ ${KNw(w.K)} на стіні цеху.`}`};
  lineW(w,info); WHL[w.id]=true;
  const ti={t:`Лоток 100×50 стрінгів до ${w.id} · склад`,d:w.wall==='AB'?`Стрінги скатів A і B — під модулями вгору до верхнього (північного) краю, лотком уздовж краю ${nf1(w.tray_m.edge)} м і по стіні вниз ${nf1(w.tray_m.wall)} м до щита. Кріплення до профнастилу через 1,5 м, на стіні — кронштейни через 1,0 м.`:`Стрінги з торців рядів — під модулями вгору до гребеня, лотком по гребеню ${nf1(w.tray_m.edge)} м (спільний для ЩС-С2 і ЩС-С3), по північному скату ${nf1(w.tray_m.slope)} м і по стіні ${nf1(w.tray_m.wall)} м до щита. Кріплення до профнастилу через 1,5 м, на стіні — кронштейни.`};
  Object.values(w.trays).forEach(pl=>polyW(pl,0.1,0.05,trayMw,ti)); });
// АБК: лоток ліній від щитів по нижньому даху на захід, через парапет і по західній стіні вниз (один лоток на дві лінії); лінії — як у складу
if(EW.abk&&EW.abk.length){ const a0=EW.abk[0]; polyW(a0.tray.slice(1),0.1,0.05,trayMw,{t:'Лоток 100×50 ліній АБК → К-3 / К-1',d:EW.mode==='air'?(EW.consts.ABKR==='roof'?'Дві лінії Al від ЩА-1 і ЩА-2: по нижньому даху вздовж стіни основного блоку на захід (опори з блоком через 1,5 м), через західний парапет — і з кута АБК одразу тросом на фасад цеху.':'Дві лінії Al від ЩА-1 і ЩА-2: по нижньому даху вздовж стіни основного блоку на захід (опори з блоком через 1,5 м), через західний парапет, по західній стіні на 10 м (між рядами вікон) до північного кута і вниз до троса на 6,6 м.'):'Дві лінії Al від ЩА-1 і ЩА-2: по нижньому даху вздовж стіни основного блоку на захід (опори з блоком через 1,5 м), через західний парапет і по стіні вниз на кронштейнах до траншеї.'});
  EW.abk.forEach(o=>lineW(o,{t:`Лінія Al ${o.id} → ШВ ${KNw(o.K)} (ТП-5913) · АБК, етап 1`,d:`${o.ns} стрінгів по 11 (S${o.strings.join(', S')}), ${nf1(o.kwp)} кВтп, ≈${nf1(o.mwh)} МВт·год за рік. Al 2 × 1×${o.S} мм², ${nf1(o.L)} м, ΔU ${nf2(o.du)} % при STC. ${EW.mode==='air'?(EW.consts.ABKR==='roof'?`Від щита на стіні надбудови — лотком по нижньому даху, через західний парапет → з кута АБК тросом прямо на східний фасад цеху над прибудовою ТП-5913 → вниз до лотка 5,0 м → ШВ ${KNw(o.K)}.`:`Від щита на стіні надбудови — лотком по нижньому даху, через західний парапет, по західній стіні на 10 м до північного кута → тросом через двір південніше К-3 на стіну цеху → лотком на 5,0 м → ШВ ${KNw(o.K)}.`):`Від щита на стіні надбудови — лотком по нижньому даху і по західній стіні вниз → траншея вздовж західної стіни АБК → на захід через двір до траншеї AC → ШВ ${KNw(o.K)}.`}`})); }
// повітряні переходи (05.11, 23:20 — власник: «навіщо копати, пустимо повітряну лінію»): трос, стійка, лотки по стінах і фасаду цеху на 5,0 м
if(EW.mode==='air'){ const CS=EW.consts, ropeM=new THREE.MeshStandardMaterial({color:lin('#5b6770'),roughness:0.4,metalness:0.6}), seen=new Set();
  const isRope=isRopeW, ABR=CS.ABKR==='roof';
  const ti={t:'Лоток 100×50 / 200×50 ліній Al · склад і АБК',d:'По стінах на кронштейнах через 1,0 м: під карнизом складу до стійки троса, '+(ABR?'з троса АБК вниз по фасаду цеху (9,6 → 5,0 м), ':'по західній стіні АБК на 10 м, ')+'по східному фасаду цеху на 5,0 м над прибудовою ТП-5913 (нижче наявних кабелів 5,6 і 6,1 м; на ділянці з 5 лініями — 200×50), спуски до ШВ.'};
  EW.wh.concat(EW.abk||[]).forEach(o=>{ const P=o.pts; for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1]; if(isRope(a,b)) continue;
    const onAbkRoof=a[0]>108.6&&b[0]>108.6&&a[2]>9.9; if(onAbkRoof) continue; const k=a.map(v=>v.toFixed(2)).join()+'|'+b.map(v=>v.toFixed(2)).join(); if(seen.has(k)) continue; seen.add(k);
    const wide=(EW.fac||[]).some(f=>f.n>3&&Math.abs(a[0]-CS.XF)<1e-3&&Math.abs(b[0]-CS.XF)<1e-3&&Math.min(a[1],b[1])>=Math.min(f.a[1],f.b[1])-1e-3&&Math.max(a[1],b[1])<=Math.max(f.a[1],f.b[1])+1e-3&&Math.abs(a[2]-CS.HF)<1e-3);
    barW(W(a[0],a[1],a[2]-0.03),W(b[0],b[1],b[2]-0.03),wide?0.2:0.1,0.05,trayMw,ti); } });
  (EW.ropes||[]).forEach(r=>{ const a=W(r.a[0],r.a[1],r.a[2]+0.12), b=W(r.b[0],r.b[1],r.b[2]+0.12), m=a.clone().lerp(b,0.5); m.y-=0.25;
    const cv=new THREE.QuadraticBezierCurve3(a,m,b), tb=new THREE.Mesh(new THREE.TubeGeometry(cv,24,0.012,6,false),ropeM); gE.add(tb);
    const inf={t:`Повітряний перехід на тросі · ${r.who} · ${r.n} ${r.n===1?'лінія':'лінії'} Al`,d:`Трос Ø6 у ПВХ з талрепами між анкерами на стінах (${r.who==='склад'?'стійка на куті складу C1 → південна стіна цеху':ABR?'кут АБК під парапетом → східний фасад цеху, над дахом прибудови ТП-5913':'північно-західний кут АБК → східна стіна цеху, південніше К-3'}), проліт ${nf1(r.L)} м; лінії підвішено стяжками з нержавіючої сталі через 0,5 м. ${r.who==='склад'||!ABR?'Кріплення на 6,6 м, провис до 0,3 м — над проїздом не нижче 6 м.':`Кріплення ${nf1(r.a[2])} / ${nf1(r.b[2])} м (на фасаді — нижче модулів, що тут від 10,3 м), провис до 0,3 м — над дахом прибудови ≈4,8 м, над проїздом ≈9,3 м.`} Кабель Al з УФ-стійкою оболонкою.`};
    tb.userData.info=inf; PICK.push({o:tb,when:()=>gE.visible}); });
  if(CS.POST){ const p=CS.POST; barW(W(p[0],p[1],4.75),W(p[0],p[1],CS.HR+0.25),0.06,0.06,ropeM,{t:'Стійка троса на куті складу C1',d:'Труба / профіль з розкосами на анкерах: від карниза 5,0 м до 6,6 м — трос через проїзд іде не нижче 6 м.'}); } }
// траншея: нова — смугою на землі; спільна з траншеєю AC контейнерів — лише труби
(EW.trench||[]).concat((EW.shared||[]).map(s=>({...s,sh:1}))).forEach(sg=>{ const a=W(sg.a[0],sg.a[1],0.09), b=W(sg.b[0],sg.b[1],0.09);
  barW(a,b,0.4+0.06*(sg.n-1),0.02,trenchM,{t:sg.sh?'Траншея AC контейнерів — спільна':'Траншея 0,4 × 0,8 м · склад і АБК → ТП-5913',d:`${sg.n} ${sg.n===1?'лінія':sg.n<5?'лінії':'ліній'} Al у трубах ПНД Ø63 (по трубі на лінію), глибина 0,7 м, пісок, сигнальна стрічка. ${sg.sh?'Тут траншея вже є під лінії AC контейнерів до ТП-5913 — додаються лише труби.':'Копати — після обстеження підземних мереж ТП-5913 у проїзді і покриття.'}`}); });
// ================= стрінги → щити: один стиль для всіх груп
const KN=k=>k==='ABK'?'АБК':String(k).replace('K','К'), TPN={'K-1':'ТП-5913','K-3':'ТП-5913','K-4':'ТП-6923','K-5':'ТП-6923'};
const HUE={'K-3':'#e67e22','K-1':'#c0392b','K-4':'#7b5bd6','K-5':'#1aa3b4','ABK':'#2e5b7a'}, GREY='#c9ced2';   // контейнери — як у ліній; АБК — окремий синьо-сірий (перевірено на розрізнення при дальтонізмі)
const smx=(h,t,a)=>new THREE.Color(h).lerp(new THREE.Color(t),a);
const TNh={}, TN={}, CBM={}; Object.entries(HUE).forEach(([k,h])=>{ TNh[k]=[smx(h,'#000',0.0),smx(h,'#fff',0.34),smx(h,'#000',0.24)].map(c=>'#'+c.getHexString()); TN[k]=TNh[k].map(c=>lin(c));
  CBM[k]=new THREE.MeshStandardMaterial({color:lin('#'+smx(h,'#000',0.42).getHexString()),roughness:0.6,side:THREE.DoubleSide}); });
const GRYc=lin(GREY), EMAT=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5,metalness:0.08});   // матеріал модулів у режимі «Електрика»: колір — на екземпляр
const ABMk={}, abkMat=(k,t)=>ABMk[k+t]||(ABMk[k+t]=new THREE.MeshStandardMaterial({color:TN[k][t],roughness:0.5,metalness:0.08}));
// ---------- щити: місце (з шару elec04) і дані
const BX={}; E4w.E4.boxes.forEach(b=>BX[b.id]={...b,ss:[]});
E4w.g.traverse(o=>{ const inf=o.userData&&o.userData.info; if(!inf||typeof inf!=='object'||!inf.t) return; const id=inf.t.split(' ')[0]; if(BX[id]&&!BX[id].pos) BX[id].pos=o.position.clone(); });
// ---------- стрінги: {id, z, st, box, K, mem:[[сітка, k]] або [сітка АБК], P:[точки, три]}
const STR=[], _m4=new THREE.Matrix4(), _p=new V3(), _q=new THREE.Quaternion(), _s=new V3();
const S=CDw.SETS, qcV=q=>W(q[0],q[1],q[2]);
const addS=o=>{ const b=BX[o.box]; if(!b) return; o.K=b.K; o.st=b.st; STR.push(o); b.ss.push(o); };
// дах В1 (етап 2): центри модулів з розкладки → найближчий екземпляр (сітка 1 м)
{ const R=S.roof, H=new Map(); R.g.forEach((q,i)=>{ const key=Math.round(q.qc[0])+':'+Math.round(q.qc[1]); (H.get(key)||H.set(key,[]).get(key)).push(i); });
  const near=(x,y)=>{ let bi=-1, bd=0.6; for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) (H.get((Math.round(x)+dx)+':'+(Math.round(y)+dy))||[]).forEach(i=>{ const q=R.g[i].qc, d=Math.hypot(q[0]-x,q[1]-y); if(d<bd){ bd=d; bi=i; } }); return bi; };
  ES.roof.forEach(s=>{ const ii=s.m.map(([x,y])=>near(x,y)).filter(i=>i>=0); addS({id:s.id,z:'roof',box:s.box,mem:ii.map(i=>R.ref[i]),Q:ii.map(i=>R.g[i].qc),P:ii.map(i=>qcV(R.g[i].qc))}); }); }
// ліхтарі (етап 1): ліхтар — за найближчою віссю, схил — бік від осі, місце — Y
if(L28w){ const Ln=S.lan, LX=L28w.LANS.map(L=>L.xc), B={};
  Ln.g.forEach((q,i)=>{ const x=q.qc[0], fr=LX.reduce((a,c,j)=>Math.abs(c-x)<Math.abs(LX[a]-x)?j:a,0)+1, sd=x>LX[fr-1]?'E':'W'; (B[fr+sd]=B[fr+sd]||[]).push(i); });
  ES.lan.forEach(s=>{ const ii=s.m.map(([sd,y])=>{ let bi=-1, bd=0.4; (B[s.fr+sd]||[]).forEach(i=>{ const d=Math.abs(Ln.g[i].qc[1]-y); if(d<bd){ bd=d; bi=i; } }); return bi; }).filter(i=>i>=0);
    addS({id:s.id,z:'lan',box:s.box,mem:ii.map(i=>Ln.ref[i]),Q:ii.map(i=>Ln.g[i].qc),P:ii.map(i=>qcV(Ln.g[i].qc))}); }); }
// фасади і козирок (етап 1): екземпляри facpv за індексами розкладки; назви стрінгів — ПФ (південь), СФ (схід), КЗ (козирок)
const FNAME=t=>{ const n=+t.slice(1); return (t[0]==='С'?'ПФ-':t[0]==='В'?'СФ-':'КЗ-')+(t[0]==='К'?n:String(n).padStart(2,'0')); };
if(FPw){ const FS={}, put=(t,im,i,sc,hc,f,can)=>{ const o=FS[t]||(FS[t]={id:FNAME(t),src:t,z:'fac',box:(ES.fac[t]||{}).box,mem:[],F:[],P:[]}); o.mem.push([im,i]); o.F.push([f,sc,hc,can]); };
  FPw.IDX.L.forEach((k,i)=>{ const m=FPw.V[k]; if(m[6]) put(m[6],FPw.pvL,i,m[1]+m[3]/2,m[2]+m[4]/2,m[0],0); });
  FPw.IDX.P.forEach((k,i)=>{ const m=FPw.V[k]; if(m[6]) put(m[6],FPw.pvP,i,m[1]+m[3]/2,m[2]+m[4]/2,m[0],0); });
  FPw.C.forEach((m,i)=>{ if(m[5]) put(m[5],FPw.pc,i,m[3],m[2],m[0],1); });
  Object.values(FS).sort((a,b)=>a.id.localeCompare(b.id,'uk',{numeric:true})).forEach(o=>{ o.mem.forEach(([im,i])=>{ im.getMatrixAt(i,_m4); _m4.decompose(_p,_q,_s); o.P.push(_p.clone()); }); addS(o); }); }
// склад (етап 1): стрінги робочого варіанта Б (EPX), r = 0 — склад
const WHx={}; if(EPw&&EP&&EP.whi){ let n=0; EPw.strings.forEach(s=>{ if(s.r) return; const b=EPw.boxes[s.b]; if(!b||!BX[b.n]) return;
    const mem=s.m.map(j=>EP.whi[j]).filter(Boolean).map(([w,k])=>[WHI[w].im,k]);
    addS({id:'СК-'+String(++n).padStart(2,'0'),src:s.id,z:'wh',box:b.n,mem,P:mem.map(([im,k])=>{ im.getMatrixAt(k,_m4); _m4.decompose(_p,_q,_s); return _p.clone(); })}); }); }
// АБК (етап 1): 12 стрінгів по 11 → щити ЩА-1 / ЩА-2 → К-3 / К-1 (05.11, без інвертора)
if(Aw&&Aw.MODS){ const by={}, SBX={}; Aw.MODS.forEach(r=>{ if(r.mesh&&r.k) (by[r.k]=by[r.k]||[]).push(r.mesh); }); ((Aw.DB&&Aw.DB.strings)||[]).forEach(s=>SBX[s.k]='ЩА-'+s.mppt);   // 05.11: стрінг → щит ЩА-1 / ЩА-2
  Object.keys(by).map(Number).sort((a,b)=>a-b).forEach(k=>addS({id:'АБК-'+String(k).padStart(2,'0'),src:'S'+k,k,z:'abk',box:SBX[k]||'ЩА-1',mem:by[k],P:by[k].map(m=>m.getWorldPosition(new V3()))})); }
// ---------- тони: сусідні стрінги одного кольору — різні тони того самого кольору (темний, світлий, середній — лише де двох не вистачає); сусідство — модулі ближче 2,7 м
let toneConf=0; const confZ={};
// модулі «торкаються»: ближче 1,45 м (довгим боком) або до 2,6 м, якщо посередині між ними немає іншого модуля (коротким боком); через ряд — не сусіди
const OCC=new Map(), _mid=new V3(), ck=(x,y,z)=>Math.floor(x)+'|'+Math.floor(y)+'|'+Math.floor(z);
STR.forEach(s=>s.P.forEach(p=>{ const k=ck(p.x,p.y,p.z); (OCC.get(k)||OCC.set(k,[]).get(k)).push(p); }));
const occ=m=>{ for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) for(let dz=-1;dz<=1;dz++){ const L=OCC.get(ck(m.x+dx,m.y+dy,m.z+dz)); if(L&&L.some(p=>p.distanceToSquared(m)<0.2)) return true; } return false; };
{ const byK={}; STR.forEach(s=>{ s.c=s.P.reduce((a,p)=>a.add(p),new V3()).divideScalar(Math.max(1,s.P.length)); (byK[s.K]=byK[s.K]||[]).push(s); });
  Object.values(byK).forEach(L=>{ L.sort((a,b)=>a.c.x-b.c.x||a.c.z-b.c.z);
    const adj=(a,b)=>a.c.distanceTo(b.c)<40&&a.P.some(p=>b.P.some(q=>{ const d2=p.distanceToSquared(q); return d2<2.1||(d2<6.8&&!occ(_mid.addVectors(p,q).multiplyScalar(0.5))); })); L.forEach(s=>s.nb=[]);
    L.forEach((s,i)=>{ for(let j=0;j<i;j++) if(adj(s,L[j])){ s.nb.push(L[j]); L[j].nb.push(s); } });
    const cost=(s,t)=>s.nb.filter(n=>n.t===t).length;
    L.forEach(s=>{ s.t=null; });   // DSatur: спершу стрінг з найбільшим числом різних тонів у сусідів
    for(let n=0;n<L.length;n++){ let bs=null, bk=-1; L.forEach(s=>{ if(s.t!=null) return; const k=new Set(s.nb.filter(x=>x.t!=null).map(x=>x.t)).size*100+s.nb.length; if(k>bk){ bk=k; bs=s; } });
      const c=[0,1,2].map(t=>cost(bs,t)); bs.t=c[0]===0?0:c[1]===0?1:c[2]===0?2:c.indexOf(Math.min(...c)); }
    for(let it=0;it<8;it++){ let ch=0; L.forEach(s=>{ const c=[0,1,2].map(t=>cost(s,t)), m=Math.min(...c); if(c[s.t]>m){ s.t=c.indexOf(m); ch++; } }); if(!ch) break; }
    L.forEach(s=>{ const c=cost(s,s.t); toneConf+=c; if(c) confZ[s.z]=(confZ[s.z]||0)+c; delete s.nb; }); }); toneConf/=2; }
// ---------- кабелі: тонкі темні лінії кольору контейнера (одна лінія = пара «+» і «−» 1×6 від крайнього модуля стрінга до щита); перемички стрінга — дугою
function TB(){ const P=[],N=[],I=[]; let nv=0; const d=new V3(), u=new V3(), v=new V3(), UP=new V3(0,1,0), AX=new V3(1,0,0);
  return { seg(a,b,r){ d.subVectors(b,a); const L=d.length(); if(L<1e-4) return; d.divideScalar(L); u.crossVectors(d,Math.abs(d.y)<0.9?UP:AX).normalize(); v.crossVectors(d,u);
      for(let j=0;j<4;j++){ const an=(j+0.5)*Math.PI/2, c=Math.cos(an), sn=Math.sin(an), nx=u.x*c+v.x*sn, ny=u.y*c+v.y*sn, nz=u.z*c+v.z*sn;
        P.push(a.x+nx*r,a.y+ny*r,a.z+nz*r,b.x+nx*r,b.y+ny*r,b.z+nz*r); N.push(nx,ny,nz,nx,ny,nz); }
      for(let j=0;j<4;j++){ const a0=nv+j*2, a1=nv+((j+1)%4)*2; I.push(a0,a1,a0+1,a0+1,a1,a1+1); } nv+=8; },
    line(pts,r){ for(let i=0;i<pts.length-1;i++) this.seg(pts[i],pts[i+1],r); },
    mesh(mat){ if(!nv) return null; const ge=new THREE.BufferGeometry(); ge.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); ge.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
      ge.setIndex(nv>65000?new THREE.Uint32BufferAttribute(I,1):new THREE.Uint16BufferAttribute(I,1)); const m=new THREE.Mesh(ge,mat); m.castShadow=m.receiveShadow=false; m.frustumCulled=false; return m; } }; }
const TBS={}, tbOf=(st,K)=>TBS[st+K]||(TBS[st+K]={st,K,b:TB()}), RC=0.03;
const rzW=x=>roofZ(Math.max(0,Math.min(96.64,x))), BT=b=>b.pos.clone().add(new V3(0,0.46,0));   // верх щита
const arc=(a,b,up)=>{ const m=a.clone().lerp(b,0.5); m.y=Math.max(a.y,b.y)+up; const o=[]; for(let i=0;i<=16;i++){ const t=i/16, s1=1-t; o.push(new V3(s1*s1*a.x+2*s1*t*m.x+t*t*b.x,s1*s1*a.y+2*s1*t*m.y+t*t*b.y,s1*s1*a.z+2*s1*t*m.z+t*t*b.z)); } return o; };
const route={
  roof(s,b){ const i=s.Q.reduce((a,q,j)=>Math.abs(q[1]-b.Y)+Math.abs(q[0]-b.X)<Math.abs(s.Q[a][1]-b.Y)+Math.abs(s.Q[a][0]-b.X)?j:a,0), [X,Y,h]=s.Q[i], ho=h-rzW(X)+0.07, o=[W(X,Y,h+0.07),W(X,b.Y,h+0.07)];
    const n=Math.max(1,Math.ceil(Math.abs(b.X-X))); for(let j=1;j<=n;j++){ const x=X+(b.X-X)*j/n; o.push(W(x,b.Y,rzW(x)+ho)); } o.push(BT(b)); return o; },
  lan(s,b){ const i=s.Q.reduce((a,q,j)=>Math.abs(q[1]-b.Y)<Math.abs(s.Q[a][1]-b.Y)?j:a,0), [X,Y,h]=s.Q[i]; return [W(X,Y,h+0.07),W(X,b.Y,h+0.07),W(b.X,b.Y,h+0.07),BT(b)]; },
  fac(s,b){ const FR=FPw.FR, fb=b.f==='S'?'S':'E', ZC=0.27, i=s.F.reduce((a,f,j)=>Math.abs(f[1]-b.s)+Math.abs(f[2]-3.8)<Math.abs(s.F[a][1]-b.s)+Math.abs(s.F[a][2]-3.8)?j:a,0), [f,sc,hc,can]=s.F[i], F=FR[f];
    const p0=can?F.P(sc,hc-0.3,ZC):F.P(sc,hc,ZC);
    if(b.roof){ const top=f==='S'?rzW(sc)+1.0:rzW(96.4)+0.8; return [p0,F.P(sc,top,ZC),W(f==='S'?sc:96.5,f==='S'?-0.3:sc,top+0.25),BT(b)]; }   // 05.11: щит на даху — угору за модулями і через парапет
    return [p0,F.P(sc,3.8,ZC),FR[fb].P(b.s,3.8,ZC),BT(b)]; },
  wh(s,b){ const B=w=>[w.x,-w.z,w.y], i=s.P.reduce((a,p,j)=>Math.abs(p.x-b.pos.x)<Math.abs(s.P[a].x-b.pos.x)?j:a,0), [X,Y,h]=B(s.P[i]), w=WHB[s.box];
    // 05.11: під модулями вгору по скату до верхнього краю (A, B) або гребеня (C1, C2) → лотком до щита → по північному скату і стіні вниз
    const col=S.wh.g.map(g=>g.qc).filter(q=>Math.abs(q[0]-X)<0.8&&q[1]>=Y-0.05).sort((a,c)=>a[1]-c[1]), n=col.length?col[col.length-1]:[X,Y,h];
    const o=[W(X,Y,h+0.08)]; col.forEach(q=>{ if(q[1]>Y+0.05) o.push(W(X,q[1],q[2]+0.08)); });
    if(!w) { o.push(W(X,n[1]+0.75,n[2]+0.08),BT(b)); return o; }
    if(w.wall==='C'){ const zr=x=>5+9*(x<146.1?0.4040:0.3057)+0.12; o.push(W(X,-15.3,zr(X)),W(w.X,-15.3,zr(w.X)),W(w.X,-6.7,5.17),W(w.X,-6.4,4.9),BT(b)); return o; }
    const E=w.trays.edge, x0=Math.min(X,w.X), x1=Math.max(X,w.X), mid=E.filter(p=>p[0]>x0+0.05&&p[0]<x1-0.05).sort((p,q)=>X<w.X?p[0]-q[0]:q[0]-p[0]);
    o.push(W(X,n[1]+0.75,n[2]+0.1)); mid.forEach(p=>o.push(W(p[0],p[1],p[2]))); o.push(W(w.X,w.trays.wall[0][1],w.trays.wall[0][2]),BT(b)); return o; } };
const WHB={}; EW.wh.forEach(w=>WHB[w.id]=w);
let jumps=0;
STR.forEach(s=>{ const b=BX[s.box]; if(s.z==='abk'||!b||!b.pos||!s.P.length) return; const T=tbOf(s.st,s.K).b;
  T.line(route[s.z](s,b),RC);
  // перемички: порядок модулів — ланцюжком від крайнього (найближчий сусід); розрив > 6 м — дуга (прогалини в 1–2 модулі кабель іде по рейці, не малюю)
  const P=s.P, c=s.c, left=P.map((_,i)=>i); let cur=left.reduce((a,i)=>P[i].distanceTo(c)>P[a].distanceTo(c)?i:a,0); left.splice(left.indexOf(cur),1);
  while(left.length){ let bi=0; left.forEach((i,j)=>{ if(P[i].distanceTo(P[cur])<P[left[bi]].distanceTo(P[cur])) bi=j; }); const nx=left.splice(bi,1)[0], L=P[cur].distanceTo(P[nx]);
    if(L>6){ T.line(arc(P[cur],P[nx],Math.min(3,0.8+L*0.045)),RC*0.8); jumps++; s.jmp=(s.jmp||0)+1; } cur=nx; } });
Object.values(TBS).forEach(t=>{ const m=t.b.mesh(CBM[t.K]); if(m) (t.st===2?g2:g).add(m); });
// ---------- контур стрінга: край модуля, за яким немає модуля того самого стрінга, — тонка темна лінія (однаково для всіх груп)
const GM=new Map(); Object.values(S).forEach(X=>X.ref.forEach(([im,k],i)=>{ let q=GM.get(im); if(!q) GM.set(im,q=[]); q[k]=X.g[i]; }));
const bv=v=>new V3(v[0],v[2],-v[1]), OLM=new THREE.MeshStandardMaterial({color:lin('#1f2a30'),roughness:0.7,side:THREE.DoubleSide}), OL={1:TB(),2:TB()};
const _abkG=m=>{ const g=m.geometry; if(!g.boundingBox) g.computeBoundingBox(); const bb=g.boundingBox, M=m.matrixWorld, y=bb.max.y, cx=(bb.min.x+bb.max.x)/2, cz=(bb.min.z+bb.max.z)/2;
  const c=new V3(cx,y,cz).applyMatrix4(M), a=new V3(bb.max.x,y,cz).applyMatrix4(M).sub(c), b=new V3(cx,y,bb.max.z).applyMatrix4(M).sub(c), n=new V3().crossVectors(a,b).normalize(); if(n.y<0) n.negate(); return {c,a,b,n}; };
STR.forEach(s=>{ const Q=s.z==='abk'?s.mem.map(m=>{ m.updateWorldMatrix(true,false); return _abkG(m); }):s.mem.map(([im,k])=>{ const g0=(GM.get(im)||[])[k]; if(!g0) return null; return {c:W(g0.qc[0],g0.qc[1],g0.qc[2]),a:bv(g0.a),b:bv(g0.b),n:bv(g0.n)}; }).filter(Boolean);
  const T=OL[s.st], t=new V3(), e0=new V3(), e1=new V3();
  Q.forEach((q,i)=>{ const lift=q.n.clone().multiplyScalar(0.03);
    [[q.a,q.b],[q.a.clone().negate(),q.b],[q.b,q.a],[q.b.clone().negate(),q.a]].forEach(([d,e])=>{ t.copy(q.c).addScaledVector(d,2);
      if(Q.some((r,j)=>j!==i&&r.c.distanceToSquared(t)<0.12)) return;
      e0.copy(q.c).add(d).sub(e).add(lift); e1.copy(q.c).add(d).add(e).add(lift); T.seg(e0,e1,0.022); }); }); });
[1,2].forEach(st=>{ const m=OL[st].mesh(OLM); if(m) (st===2?g2:g).add(m); });

// АБК: власні кабелі моделі (змійка, «+», «−») — змійку по модулях ховаю, «+» — у темний тон АБК (як кабелі інших груп), «−» лишається чорним
const abkCab=[]; if(Aw&&Aw.STRO) Object.values(Aw.STRO).forEach(L=>L.forEach(m=>{ const r=m.geometry&&m.geometry.parameters&&m.geometry.parameters.radius; abkCab.push([m,r>0.016]); }));
let abkCol=null; const abkCabSet=on=>{ abkCab.forEach(([m,chain])=>{ if(chain) m.visible=!on; });
  if(Aw&&Aw.strMat) Object.keys(Aw.STRO||{}).forEach(k=>{ const mt=Aw.strMat(+k), sk=STR.find(x=>x.z==='abk'&&x.k===+k), cm=CBM[sk?sk.K:'ABK']||CBM.ABK; if(on){ abkCol=abkCol||{}; if(!abkCol[k]) abkCol[k]=mt.color.clone(); mt.color.copy(cm.color); } else if(abkCol&&abkCol[k]) mt.color.copy(abkCol[k]); }); };
// ---------- таблички над щитами (розмір — у метрах сцени: здалеку дрібні, зблизька читаються)
function tagTex(l1,l2,hex){ const h=150, c=document.createElement('canvas'), x=c.getContext('2d'), F1='700 54px system-ui,sans-serif', F2='500 40px system-ui,sans-serif';
  x.font=F1; let w=x.measureText(l1).width; x.font=F2; w=Math.ceil(Math.max(w,x.measureText(l2).width)+76); c.width=w; c.height=h;
  x.fillStyle='rgba(255,255,255,0.96)'; x.fillRect(0,0,w,h); x.fillStyle=hex; x.fillRect(0,0,26,h); x.strokeStyle=hex; x.lineWidth=6; x.strokeRect(3,3,w-6,h-6);
  x.fillStyle='#1d2a33'; x.font=F1; x.textBaseline='top'; x.fillText(l1,48,14); x.font=F2; x.fillStyle='#3f4a52'; x.fillText(l2,48,84);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.userData={ar:w/h}; return t; }
const pl=(n,a,b,c)=>{ const d=n%10, h=n%100; return d===1&&h!==11?a:d>=2&&d<=4&&(h<12||h>14)?b:c; }, strW=n=>pl(n,'стрінг','стрінги','стрінгів'), shW=n=>pl(n,'щит','щити','щитів');
Object.values(BX).forEach(b=>{ if(!b.pos||!b.ss.length) return; const n=b.ss.length, kw=b.ss.reduce((a,s)=>a+s.mem.length,0)*0.73;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTex(`${b.id} → ${KN(b.K)}`,`${n} ${strW(n)} · ${nf1(kw)} кВтп`,HUE[b.K]),depthWrite:false,transparent:true}));
  const sc=1.35, ar=sp.material.map.userData.ar||3.7; sp.scale.set(0.67*sc*ar,0.67*sc,1); sp.renderOrder=20;
  const dz=b.z==='fac'&&!b.roof?-1.5:b.z==='wh'?1.4:b.z==='abk'?1.4:1.65; sp.position.copy(b.pos).add(new V3(0,dz,0)); if(b.z==='fac'&&!b.roof){ const out=b.f==='S'?new V3(0,0,0.55):new V3(0.55,0,0); sp.position.add(out); }
  sp.userData.info={t:`${b.id} · щит PV 7/1 → ${KN(b.K)} (${TPN[b.K]})`,d:`${n} ${strW(n)}: ${b.ss.map(s=>s.id).join(', ')}. ${nf1(kw)} кВтп.${b.L?` Лінія Al 2 × 1×${b.S} мм², ${nf1(b.L)} м, ΔU ${nf2(b.du)} %.`:''}`};
  PICK.push({o:sp,when:()=>sp.parent&&sp.parent.visible}); (b.st===2?g2:g).add(sp); });
// ---------- підказки модулів у режимі «Електрика»: стрінг → щит → контейнер
const MI=new Map(), sTip=s=>{ const b=BX[s.box], n=s.mem.length;
  return {t:`Стрінг ${s.id} → ${s.box} → ${KN(s.K)}`,d:`${n} модулів послідовно, ${nf1(n*0.73)} кВтп${s.src?` (у розкладці — ${s.src})`:''}. Кабель стрінга «+» і «−» 1×6 від крайнього модуля до щита${s.jmp?`; перемичок між частинами стрінга — ${s.jmp}`:''}. ${`Щит ${s.box}: ${b.ss.length} ${strW(b.ss.length)}, ${nf1(b.kwp)} кВтп, лінія Al ${nf1(b.L)} м до ШВ ${KN(s.K)} (${TPN[s.K]}).`}`}; };
STR.forEach(s=>{ if(s.z==='abk') s.mem.forEach(m=>MI.set(m,s)); else s.mem.forEach(([im,k])=>{ let q=MI.get(im); if(!q) MI.set(im,q=new Map()); q.set(k,s); }); });
let ON=false;
MI.forEach((q,im)=>{ const u0=im.userData.info; im.userData.info=function(id){ if(ON){ const s=q instanceof Map?q.get(id):q; if(s) return sTip(s); } return typeof u0==='function'?u0.apply(this,arguments):u0; }; });
S.lit.ref.forEach(([im])=>{ if(MI.has(im)||im.userData._litW) return; const u0=im.userData.info; im.userData._litW=1; im.userData.info=function(id){ if(ON) return {t:'Модуль на освітлення',d:'Не входить у стрінги СЕС — окреме живлення освітлення (сірий у режимі «Електрика»).'}; return typeof u0==='function'?u0.apply(this,arguments):u0; }; });
// ---------- фарбування модулів
const ORIG=new Map(), ABO=new Map(), ALLI=new Set(); Object.values(S).forEach(X=>X.ref.forEach(([im])=>ALLI.add(im)));
function paint(on){ if(on){ ALLI.forEach(im=>{ ORIG.set(im,im.material); im.material=EMAT; for(let i=0;i<im.count;i++) im.setColorAt(i,GRYc); });
    STR.forEach(s=>{ const c=TN[s.K][s.t||0]; if(s.z==='abk') s.mem.forEach(m=>{ if(!ABO.has(m)) ABO.set(m,[m.material,m.userData.base]); const mt=abkMat(s.K,s.t||0); m.material=mt; m.userData.base=mt; }); else s.mem.forEach(([im,k])=>im.setColorAt(k,c)); });
    ALLI.forEach(im=>{ if(im.instanceColor) im.instanceColor.needsUpdate=true; }); abkCabSet(true); }
  else { ORIG.forEach((m,im)=>{ im.material=m; for(let i=0;i<im.count;i++) im.setColorAt(i,white); if(im.instanceColor) im.instanceColor.needsUpdate=true; }); ORIG.clear();
    ABO.forEach(([m,b],me)=>{ me.material=m; me.userData.base=b; }); ABO.clear(); abkCabSet(false); if(CDw.statusPaint) CDw.statusPaint(); } }
// ---------- підсумки по групах
const GRP=[['fac','Фасади і козирок',1,'південь → К-3, схід і козирок → К-1'],['lan','Ліхтарі Л1–Л4',1,'усі → К-3 / К-1 (ТП-5913)'],['wh','Склад',1,'→ К-3 / К-1 (ТП-5913)'],['abk','АБК',1,'2 щити → К-3 / К-1 (ТП-5913)'],['roof','Дах цеху В1',2,'захід → К-4 / К-5, схід → К-3 / К-1']];
const gsum=z=>{ const L=STR.filter(s=>s.z===z), bx=Object.values(BX).filter(b=>b.ss.length&&b.ss[0].z===z); return {nb:bx.length,ns:L.length,nm:L.reduce((a,s)=>a+s.mem.length,0),kw:L.reduce((a,s)=>a+s.mem.length,0)*0.73,L:bx.reduce((a,b)=>a+(b.L||0),0),du:bx.reduce((a,b)=>Math.max(a,b.du||0),0),bx}; };
const SUM=Object.fromEntries(GRP.map(([z])=>[z,gsum(z)]));
const chk=Object.values(BX).filter(b=>b.ns!=null&&b.ss.length!==b.ns).map(b=>`${b.id}: ${b.ss.length} з ${b.ns}`);
// ---------- «Накопичувачі»: як під'єднано по етапах (власник 04.11, 18:04: етап 1 — усе PV на одну пару контейнерів, друга пара — лише мережа; етап 2 — дах)
const puW=panelUZE; panelUZE=function(){ const html=puW.apply(this,arguments), B=E4w.E4.boxes, var2=(E4w.E4.var||'1')==='2';
  const cnt=(K,st)=>{ const L=B.filter(b=>b.K===K&&b.st===st); return {n:L.length,ns:L.reduce((a,b)=>a+b.ns,0),kw:L.reduce((a,b)=>a+b.kwp,0),z:[...new Set(L.map(b=>({fac:'фасади',wh:'склад',lan:'ліхтарі',roof:'дах',abk:'АБК'})[b.z]))].join(', ')}; };
  const rows=['K-3','K-1','K-4','K-5'].map(K=>{ const a=cnt(K,1), c=cnt(K,2);
    return `<tr><td class="w"><i class="sw" style="background:${HUE[K]}"></i>${KN(K)}<span class="stg">${TPN[K]}</span></td><td style="white-space:normal">${a.n?`${a.n} ${shW(a.n)} · ${a.ns} ${strW(a.ns)} · ${nf1(a.kw)} кВтп<small>${a.z}</small>`:'без панелей — лише мережа<small>заряд і розряд (активний споживач)</small>'}</td><td style="white-space:normal">${c.n?`+${c.n} ${shW(c.n)} · ${c.ns} ${strW(c.ns)} · ${nf1(c.kw)} кВтп<small>дах</small>`:'—'}</td><td>${a.n+c.n} з 12</td></tr>`; }).join('');
  const f$=v=>nf(v,0)+' $';
  return html+`<div class="blk wide"><h3>Як під'єднано — по етапах</h3><div class="tw"><table class="cmp an"><thead><tr><th>Контейнер</th><th>Етап 1</th><th>Етап 2</th><th>Входи PV</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="src"><b>AC</b> — кожен контейнер (PCS 500 кВт) окремою лінією до РУ-0,4 кВ своєї ТП: ВВГнг 3 × (6 × 1×120) + N 4 × 1×95 + PE 2 × 1×95 за вимогою Golen, автомат 800 А на початку лінії; К-3, К-1 — до ТП-5913, К-4, К-5 — вводом у північну стіну ТП-6923. <b>DC</b> — від щитів PV лінії Al до шафи вводу PV біля контейнера (перехід на мідь 1×50, ПЗІП T2) і далі на входи DC/DC по 60 кВт.
  ${var2?`Етап 1: усі панелі етапу 1 (фасади, склад, ліхтарі, АБК) — на К-3 / К-1 біля ТП-5913; К-4 / К-5 біля ТП-6923 — без панелей, працюють від мережі (заряд у дешеві години, розряд у пікові). Етап 2: дах — захід на К-4 / К-5, схід на вільні входи К-3 / К-1; лоток спуску до ТП-6923 будується в етапі 2.`:''}</p>
  <p class="src">Для роботи К-4 / К-5 від мережі в етапі 1 ще потрібні: дозволена потужність заряду від ДТЕК і запас трансформатора ТП-6923, тариф (зонний або ціни РДН) і погодинне споживання цеху з АСКОЕ — від них графік заряду / розряду і ефект.</p></div>`; };
window.__twin.elecwa={g,g2,gE,STR,BX,SUM,jumps,chk,paint,TN:TNh,toneConf,confZ};
// ---------- видимість: «Електрика» (state.lay.e04, «Об'єкт») — лінії складу, інвертор; «Стрінги» (state.lay.str) — окремий шар у всіх розділах (власник 04.11, 23:05)
const onE=()=>!!state.lay.e04&&state.sec==='pz'&&state.proj==='ours'&&!!(R28w&&R28w.ON());
const onW=()=>!!state.lay.str&&state.sec!=='mis'&&state.proj==='ours'&&!!(R28w&&R28w.ON());
const svW=setVis; setVis=function(){ svW.apply(this,arguments); const on=onW(), s=state.lay.stg; g.visible=on&&s!=='2'; g2.visible=on&&s!=='1'; gE.visible=onE()&&s!=='2';
  if(Aw&&Aw.groups){ if(Aw.groups.str) Aw.groups.str.visible=g.visible; if((g.visible||gE.visible)&&Aw.groups.elec) Aw.groups.elec.visible=true; }
  if(on!==ON){ ON=on; paint(on); } need=true; };
// ---------- шари над моделлю (у кожному розділі): стан модулів · стрінги · радіація — по одному (усі фарбують модулі чи поверхні)
const statOnW=()=>(state.sec==='sun'?state.lay.stat!==false:state.lay.stat===true)&&!state.lay.rad&&!state.lay.str;
const LAYS=[['stat','Стан модулів','Колір модуля — на сонці, частково в тіні, у тіні, ніч — на вибраний час',statOnW,()=>{ if(statOnW()) state.lay.stat=false; else { state.lay.stat=true; state.lay.rad=false; state.lay.str=false; } }],
  ['str','Стрінги','Стрінги кольором контейнера щита, кабелі стрінгів до щитів, таблички щитів',()=>!!state.lay.str,()=>{ state.lay.str=!state.lay.str; if(state.lay.str){ state.lay.rad=false; state.lay.stat=false; } }],
  ['rad','Радіація','Сонце за рік на кожен м² поверхонь, кВт·год/м²; модулі сховано',()=>!!state.lay.rad,()=>{ state.lay.rad=!state.lay.rad; if(state.lay.rad) state.lay.str=false; }]];
// ---------- легенда: стрінги
const hudW=hudCtx; hudCtx=function(){ hudW.apply(this,arguments); const m=$('#modes');
  if(m&&state.sec!=='mis'&&R28w&&R28w.ON()){ if(m.querySelector('button')){ const sp=document.createElement('span'); sp.className='sep'; sp.setAttribute('aria-hidden','true'); m.appendChild(sp); }
    LAYS.forEach(([k,t,ttl,on,fn])=>{ const b=document.createElement('button'); b.type='button'; b.dataset.lay=k; b.textContent=t; b.title=ttl; b.setAttribute('aria-pressed',String(on())); b.onclick=()=>{ fn(); apply(); save(); }; m.appendChild(b); }); m.hidden=false; }
  if(CDw.legendLayer) CDw.legendLayer();
  if(!onW()) return; const l=$('#legend'); if(!l) return; l.hidden=false; const s=state.lay.stg;
  const z=s==='2'?['roof']:s==='1'?['fac','lan','wh','abk']:['fac','lan','wh','abk','roof'], ns=z.reduce((a,k)=>a+SUM[k].ns,0), sw=c=>`<i class="sw" style="background:${c}"></i>`;
  l.insertAdjacentHTML('beforeend',`<span class="e4">Стрінгів: ${nf(ns)} · колір — контейнер щита, ${sw(TNh['K-3'][0])}${sw(TNh['K-3'][2])}${sw(TNh['K-3'][1])} сусідні стрінги — різні тони одного кольору, контур — межа стрінга · ${sw(GREY)}освітлення · лінія — кабель стрінга до щита</span>`); };
// ---------- панель «Об'єкт»: стрінги → щити → контейнери
// ---------- «Електрика → Шафи (Al → Cu)»: шафи вводу PV біля контейнерів (06.11)
const shvB=()=>{ const m5=state.lay.m5||{}; if(m5.s!=='el'||m5.sub!=='shv'||typeof ELEC04==='undefined') return ''; const st=state.lay.stg, B=ELEC04.boxes.filter(b=>st==='all'||String(b.st)===st);
  const KS=['K-3','K-1','K-4','K-5'], far=b=>b.z==='wh'||b.z==='abk', TP={'K-3':'ТП-5913','K-1':'ТП-5913','K-4':'ТП-6923','K-5':'ТП-6923'};
  const rows=KS.map(K=>{ const L=B.filter(b=>b.K===K), n1=L.filter(b=>b.st===1).length, n2=L.filter(b=>b.st===2).length, f3=L.filter(far).length, s185=L.filter(b=>b.S===185).length;
    return `<tr><td class="w"><i class="sw" style="background:${HUE[K]}"></i> ШВ ${KN(K)}<span class="stg">${TP[K]}</span></td><td>${n1||'—'}</td><td>${n2||'—'}</td><td>${L.length} з 12</td><td>${L.length-f3||'—'}</td><td>${f3||'—'}</td><td>${L.length?(L.length-s185)+' × 120'+(s185?' · '+s185+' × 185':''):'—'}</td></tr>`; }).join('');
  return `<div class="blk wide"><h3>Шафи вводу PV біля контейнерів (Al → Cu)</h3><div class="tw"><table class="cmp an"><thead><tr><th>Шафа</th><th>Ліній, етап 1</th><th>Ліній, етап 2</th><th>Входів DC/DC</th><th>ПЗІП F2</th><th>ПЗІП F3</th><th>Лінії Al, мм²</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="src">У шафі кожна лінія Al (2 × 1×120, найдовші — 2 × 1×185) переходить на мідь 1×50 (2 × 6 м до входу DC/DC контейнера), з ПЗІП: F2 тип 2 — лінії з даху й фасадів цеху, F3 тип 1+2 — лінії з інших будівель (склад, АБК). Кожен щит PV — на свій вхід MPPT. ШВ К-3, К-1 — на стіні цеху між цехом і контейнерами; К-4, К-5 — біля контейнерів на бермі.</p></div>`; };
const ppW=panelPZ; panelPZ=function(){ const html=ppW.apply(this,arguments); if(!state.lay.e04&&!state.lay.str) return html;
  const tot=st=>{ const L=GRP.filter(r=>st==null||r[2]===st).map(r=>SUM[r[0]]); return {nb:L.reduce((a,x)=>a+x.nb,0),ns:L.reduce((a,x)=>a+x.ns,0),nm:L.reduce((a,x)=>a+x.nm,0),kw:L.reduce((a,x)=>a+x.kw,0),L:L.reduce((a,x)=>a+x.L,0)}; };
  const row=(n,sub,x,bold)=>`<tr${bold?' style="font-weight:600"':''}><td class="w">${n}${sub?`<span class="stg">${sub}</span>`:''}</td><td>${nf(x.nb)}</td><td>${nf(x.ns)}</td><td>${nf(x.nm)}</td><td>${nf1(x.kw)}</td><td>${x.L?nf(x.L,0):'—'}</td></tr>`;
  const rows=GRP.filter(r=>r[2]===1).map(r=>row(r[1],`етап 1 · ${r[3]}`,SUM[r[0]])).join('')+row('Етап 1 разом','щити PV',{...tot(1),nb:tot(1).nb},true)
    +row(GRP[4][1],`етап 2 · ${GRP[4][3]}`,SUM.roof)+row("Весь об'єкт",'',tot(null),true);
  const det=GRP.map(([z,n])=>{ const bx=SUM[z].bx.slice().sort((a,b)=>a.id.localeCompare(b.id,'uk',{numeric:true})); if(!bx.length) return '';
    return `<tr><td colspan="4" style="font-weight:600;padding-top:8px">${n}</td></tr>`+bx.map(b=>`<tr><td class="w"><i class="sw" style="background:${HUE[b.K]}"></i> ${b.id}<span class="stg">→ ${KN(b.K)+' · Al '+nf1(b.L)+' м · ΔU '+nf2(b.du)+' %'}</span></td><td>${b.ss.length}</td><td style="text-align:left;white-space:normal">${b.ss.map(s=>s.id).join(', ')}</td></tr>`).join(''); }).join('');
  const AB=EW.abk||[], AD=(Aw&&Aw.DB)||{}, Q=EW.q||{}, TRN=(EW.trench||[]).reduce((a,x)=>a+x.L,0);
  const EL_=`<div class="blk"><h3>Електрика: стрінги → щити PV → контейнери</h3>
  <p class="src">На моделі: колір модуля — контейнер, куди йде щит; сусідні стрінги — різні тони того самого кольору (основний, світлий, темний), темний контур — межа стрінга; тонка лінія — кабель стрінга «+» і «−» 1×6 до щита; над щитом — табличка. Натисніть модуль — стрінг і щит.</p>
  <table class="cmp an"><thead><tr><th>Група</th><th>Щитів</th><th>Стрінгів</th><th>Модулів</th><th>кВтп</th><th>Лінії Al, м</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="src">Стрінги по 11 модулів ZNSHINE 730 Вт (АБК — теж по 11, у К-3 / К-1). Щит PV 7/1 — до 7 стрінгів, 1 вхід DC/DC 60 кВт; лінії Al 2 × 1×120 мм² (${(typeof ELEC04!=='undefined'?ELEC04.boxes:[]).filter(b=>b.S===185).map(b=>b.id||('дах → '+KN(b.K))).join(', ')} — 2 × 1×185) до ШВ біля контейнера, довжини з запасом 5 % + 4 м. Ліхтарі — 27 стрінгів (Л1 — 6, Л2–Л4 — по 7) і 19 модулів на освітлення; у кошторисі 04.11 було 28 — виправлено в розрахунку щитів. Склад і АБК (05.11): щити на стінах, лінії до ШВ — ${EW.wh.concat(EW.abk||[]).map(w=>`${w.id} ${nf1(w.L)} м`).join(', ')}; ${EW.mode==='air'?`без траншеї: троси через проїзд (${(EW.ropes||[]).map(r=>nf1(r.L)+' м').join(', ')}) і лоток на 5,0 м по східному фасаду цеху.`:`нова траншея ≈${nf((EW.trench||[]).reduce((a,x)=>a+x.L,0),0)} м (проїзд між ТП-5913 і АБК, уздовж складу) — після обстеження підземних мереж.`}${chk.length?` Розбіжність зі щитами: ${chk.join('; ')}.`:''}</p>
  <details><summary>Щити по одному — які стрінги куди</summary><table class="cmp an"><thead><tr><th>Щит</th><th>Стрінгів</th><th>Стрінги</th></tr></thead><tbody>${det}</tbody></table></details>
  <table class="cmp an"><thead><tr><th>АБК і склад → К-3 / К-1</th><th>Значення</th></tr></thead><tbody>
  <tr><td class="w">АБК: модулі і стрінги<span class="stg">етап 1 · ДБН, без інвертора (05.11)</span></td><td>132 · 12 × 11 · ${nf1(AB.reduce((a,o)=>a+o.kwp,0))} кВтп</td></tr>
  <tr><td class="w">АБК: щити<span class="stg">на стіні надбудови над нижнім дахом</span></td><td>${AB.map(o=>`${o.id} → ${KN(o.K)}: ${o.ns} стрінгів, Al ${nf1(o.L)} м, ΔU ${nf2(o.du)} %`).join('<br>')}</td></tr>
  <tr><td class="w">АБК: кабель 1×6<span class="stg">«+» / «−» / перемички</span></td><td>${AD.dc?`${nf(AD.dc.plus,0)} / ${nf(AD.dc.minus,0)} / ${nf(AD.dc.jump,0)} м`:'—'} · лотки стрінгів ${nf1(AD.tray_len||0)} м</td></tr>
  <tr><td class="w">Склад: щити<span class="stg">на північній стіні, низ на 1,0 м</span></td><td>${EW.wh.map(w=>`${w.id} → ${KN(w.K)}: ${w.ns} стрінгів, Al ${nf1(w.L)} м, ΔU ${nf2(w.du)} %`).join('<br>')}</td></tr>
  <tr><td class="w">Склад: кабель 1×6 і лотки<span class="stg">край / гребінь, північний скат, стіна</span></td><td>${nf(Q.str_wh||0,0)} м · лотки ${nf1(EW.wh.reduce((a,w)=>a+w.tray_m.edge+w.tray_m.slope+w.tray_m.wall,0))} м</td></tr>
  ${EW.mode==='air'?`<tr><td class="w">Повітряні переходи<span class="stg">трос Ø6: склад — 6,6 м${EW.consts.ABKR==='roof'?', АБК — з даху 10,0 / 9,6 м':''}</span></td><td>${(EW.ropes||[]).map(r=>`${r.who}: ${nf1(r.L)} м, ${r.n} лін.`).join(' · ')} · лоток по фасаду цеху на 5,0 м ${nf1(Q.L_fac||0)} м</td></tr>`:`<tr><td class="w">Траншея 0,4 × 0,8 м<span class="stg">проїзд між ТП-5913 і АБК, уздовж складу</span></td><td>нова ${nf1(TRN)} м · у траншеї AC ${nf1(Q.shared||0)} м · труби ПНД Ø63 ${nf(Q.pipe||0,0)} м</td></tr>`}</tbody></table>
  <p class="src">Стрінги даху, ліхтарів і фасадів — calc/ep04/strings_all.py (розкладка двійника → щити розрахунку 04.11); склад — розкладка стрінгів складу і calc/ep04/abk_wh.py; АБК — calc/v3/abk_dc.py (модель K1, ДБН; 12 стрінгів по 11 у К-3 / К-1).</p></div>`; return shvB()+EL_+html; };   // 06.11: у «Електриці» спершу електрика, потім загальні дані
apply();
} }
