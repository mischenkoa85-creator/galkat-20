// ================= Електрика складу і АБК + стрінги всіх груп одним стилем (src/elecwa.js; дані ELECWA — calc/ep04/wh_abk.py, ELECSTR — calc/ep04/strings_all.py)
// Власник 04.11, 16:58 — «електрика з АБК та зі складу ніяк не прорахована і не показана»; 17:19 — «знову вийшла херня, якась цвітна, незрозуміла… розділи все це на стрінги,
// порахуй кількість стрінгів… підключення цих стрінгів до щитків… в одному стилі, однаково».
// Один стиль для всіх груп (дах, ліхтарі, фасади й козирок, склад, АБК): колір модуля — контейнер, куди йде щит (К-3, К-1, К-4, К-5; АБК — свій інвертор);
// сусідні стрінги — темний і світлий тон того самого кольору; кабель стрінга до щита — тонка темна лінія того самого кольору; над щитом — табличка «щит → контейнер · стрінгів · кВтп».
// Склад: лінії Al до ШВ К-3 / К-1 (стіна складу → траншея через проїзд → кут цеху → лоток по східному фасаду).
// АБК: кабелі стрінгів моделі АБК (у тон АБК), лотки, інвертор Deye, лінія AC за вибраним варіантом. Кнопка — та сама «Електрика» в «Об'єкті».
{ const EW=typeof ELECWA!=='undefined'?ELECWA:null, ES=typeof ELECSTR!=='undefined'?ELECSTR:null, E4w=window.__twin.elec04, Aw=window.__twin.abk, EPw=window.__twin.EPX;
const CDw=window.__twin.cleanDbg, FPw=window.__twin.facpv, L28w=window.__twin.lan28, R28w=window.__twin.r28;
if(EW&&ES&&E4w&&CDw){
const g=grp('elecwa',G.ours), g2=grp('elecwa2',G.ours); g.visible=g2.visible=false;   // g — етап 1 (фасади, ліхтарі, склад, АБК), g2 — етап 2 (дах В1)
const KCw={'K-1':0xc0392b,'K-3':0xe67e22}, nf1=v=>nf(v,1), nf2=v=>nf(v,2);
const mk=c=>new THREE.MeshStandardMaterial({color:lin(c),roughness:0.45});
const tubeW=(pts,mat,r,info)=>{ if(pts.length<2) return null; const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'catmullrom',0.0),Math.max(16,pts.length*8),r,8,false),mat);
  m.castShadow=false; g.add(m); if(info){ m.userData.info=info; PICK.push({o:m,when:()=>g.visible}); } return m; };
const dashW=(a,b,mat,r)=>{ const L=a.distanceTo(b), n=Math.max(1,Math.round(L/0.8)); for(let j=0;j<n;j+=2){ const p0=a.clone().lerp(b,j/n), p1=a.clone().lerp(b,Math.min(1,(j+1)/n)); tubeW([p0,p1],mat,r); } };
// ---------- склад: лінії Al до ШВ
const WHL={};
EW.wh.forEach(w=>{ const mat=mk(KCw[w.K]||0x888888), P=w.pts.map(p=>W(p[0],p[1],p[2]+(p[2]===0?0.05:0)));
  const info={t:`Лінія Al ${w.id} → ${w.K} (ТП-5913) · склад, етап 1`,d:`${w.ns} стрінгів по 11, ${nf1(w.kwp)} кВтп. Al 2 × 1×${w.S} мм², ${nf1(w.L)} м (раніше ${nf1(w.L_old)} м — до старих місць контейнерів), ΔU ${nf2(w.du)} % при STC, втрати ${nf2(w.pk)} кВт (≈${nf(w.e,0)} кВт·год за рік). Траса умовна: спуск по стіні складу → траншея ${nf1(w.trench)} м через проїзд уздовж південного торця ТП-5913 → підйом на кут цеху → лоток по східному фасаду над ТП-5913 разом із лініями фасадів → ШВ ${w.K}. Траншея чи повітряний перехід — уточнити.`};
  tubeW([P[0],P[1]],mat,0.05,info);                                 // спуск по стіні
  for(let i=1;i<4;i++) dashW(P[i],P[i+1],mat,0.05);                 // траншея — пунктиром
  const hit=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P.slice(1,5),false,'catmullrom',0.0),48,0.35,6,false),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); g.add(hit); hit.userData.info=info; PICK.push({o:hit,when:()=>g.visible});
  WHL[w.id]=tubeW(P.slice(4),mat,0.05,info); });
// щити складу: підказки з новими лініями
const WB={}; EW.wh.forEach(w=>WB[w.id]=w);
E4w.g.traverse(o=>{ const inf=o.userData&&o.userData.info; if(!inf||typeof inf!=='object'||!inf.t) return; const id=(inf.t.match(/^(ЩС-С\d)/)||[])[1]; if(!id||!WB[id]) return; const w=WB[id];
  o.userData.info={t:`${id} · щит PV 7/1 складу · етап 1 → ${w.K} (ТП-5913)`,d:`${w.ns} стрінгів по 11, ${nf1(w.kwp)} кВтп, 1 вхід DC/DC 60 кВт. На північній стіні складу. Лінія Al 2 × 1×${w.S} мм², ${nf1(w.L)} м до ШВ, ΔU ${nf2(w.du)} %. Стрінги складу — кольором на модулях.`}; });
const AB=EW.abk;
if(Aw){ const iv=AB.pos;
  const hit=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); hit.position.copy(W(iv.x,iv.y,iv.z0+0.4)); g.add(hit);
  hit.userData.info={t:'АБК · інвертор Deye SUN-100K-G03 (ДБН, 132 модулі)',d:`${AB.n} модулів, ${nf1(AB.kwp)} кВтп, ≈${nf1(AB.mwh)} МВт·год за рік. ${AB.strings} стрінгів по ${AB.L} на ${AB.nmppt} MPPT; Uхх при −30 °C ${nf(AB.voc30,0)} В ≤ 1 000 В, Uмп при 70 °C ${nf(AB.vmp70,0)} В ≥ 200 В. Кабель 1×6: «+» ${nf(AB.dc.plus,0)} м, «−» ${nf(AB.dc.minus,0)} м, перемички ${nf(AB.dc.jump,0)} м (${AB.dc.njump}); втрати DC ≈${nf2(AB.dc.du)} % (≈${nf(AB.dc.e,0)} кВт·год за рік). Лотки 100×50 — ${nf1(AB.tray)} м. AC ${nf1(AB.iac)} А: варіант 1 — СІП-4 4×70 ${nf1(AB.var1.L)} м до ТП-5913, ΔU ${nf2(AB.var1.du)} %; варіант 3 — ≈${nf1(AB.var3.L)} м до К-3 / К-1, ΔU ${nf2(AB.var3.du)} %.`};
  PICK.push({o:hit,when:()=>g.visible}); }
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
const AB0=EW.abk; BX['АБК']={id:'Інвертор АБК',z:'abk',st:1,K:'ABK',ns:AB0.strings,kwp:AB0.kwp,pos:W(AB0.pos.x,AB0.pos.y,AB0.pos.z0+0.3),ss:[]};
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
// АБК (етап 1): 11 стрінгів по 12 на інвертор Deye (модель АБК, ДБН)
if(Aw&&Aw.MODS){ const by={}; Aw.MODS.forEach(r=>{ if(r.mesh&&r.k) (by[r.k]=by[r.k]||[]).push(r.mesh); });
  Object.keys(by).map(Number).sort((a,b)=>a-b).forEach(k=>addS({id:'АБК-'+String(k).padStart(2,'0'),src:'S'+k,k,z:'abk',box:'АБК',mem:by[k],P:by[k].map(m=>m.getWorldPosition(new V3()))})); }
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
    const p0=can?F.P(sc,hc-0.3,ZC):F.P(sc,hc,ZC); return [p0,F.P(sc,3.8,ZC),FR[fb].P(b.s,3.8,ZC),BT(b)]; },
  wh(s,b){ const B=w=>[w.x,-w.z,w.y], i=s.P.reduce((a,p,j)=>Math.abs(p.x-b.pos.x)<Math.abs(s.P[a].x-b.pos.x)?j:a,0), [X,Y,h]=B(s.P[i]);
    // по рядах модулів цього стовпця до північного краю даху складу (висота — за модулями), далі краєм до щита і вниз по стіні
    const col=S.wh.g.map(g=>g.qc).filter(q=>Math.abs(q[0]-X)<0.8&&q[1]>=Y-0.05).sort((a,c)=>a[1]-c[1]), n=col.length?col[col.length-1]:[X,Y,h], Ye=n[1]+0.75, he=n[2]+0.08;
    const o=[W(X,Y,h+0.08)]; col.forEach(q=>{ if(q[1]>Y+0.05) o.push(W(X,q[1],q[2]+0.08)); }); o.push(W(X,Ye,he),W(b.pos.x,Ye,he),W(b.pos.x,Ye,1.95),BT(b)); return o; } };
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
  if(Aw&&Aw.strMat) Object.keys(Aw.STRO||{}).forEach(k=>{ const mt=Aw.strMat(+k); if(on){ abkCol=abkCol||{}; if(!abkCol[k]) abkCol[k]=mt.color.clone(); mt.color.copy(CBM.ABK.color); } else if(abkCol&&abkCol[k]) mt.color.copy(abkCol[k]); }); };
// ---------- таблички над щитами (розмір — у метрах сцени: здалеку дрібні, зблизька читаються)
function tagTex(l1,l2,hex){ const h=150, c=document.createElement('canvas'), x=c.getContext('2d'), F1='700 54px system-ui,sans-serif', F2='500 40px system-ui,sans-serif';
  x.font=F1; let w=x.measureText(l1).width; x.font=F2; w=Math.ceil(Math.max(w,x.measureText(l2).width)+76); c.width=w; c.height=h;
  x.fillStyle='rgba(255,255,255,0.96)'; x.fillRect(0,0,w,h); x.fillStyle=hex; x.fillRect(0,0,26,h); x.strokeStyle=hex; x.lineWidth=6; x.strokeRect(3,3,w-6,h-6);
  x.fillStyle='#1d2a33'; x.font=F1; x.textBaseline='top'; x.fillText(l1,48,14); x.font=F2; x.fillStyle='#3f4a52'; x.fillText(l2,48,84);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.userData={ar:w/h}; return t; }
const pl=(n,a,b,c)=>{ const d=n%10, h=n%100; return d===1&&h!==11?a:d>=2&&d<=4&&(h<12||h>14)?b:c; }, strW=n=>pl(n,'стрінг','стрінги','стрінгів'), shW=n=>pl(n,'щит','щити','щитів');
Object.values(BX).forEach(b=>{ if(!b.pos||!b.ss.length) return; const n=b.ss.length, kw=b.ss.reduce((a,s)=>a+s.mem.length,0)*0.73;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTex(`${b.z==='abk'?'Інвертор АБК':b.id} → ${b.z==='abk'?'ТП-5913':KN(b.K)}`,`${n} ${strW(n)} · ${nf1(kw)} кВтп`,HUE[b.K]),depthWrite:false,transparent:true}));
  const sc=b.z==='abk'?1.5:1.35, ar=sp.material.map.userData.ar||3.7; sp.scale.set(0.67*sc*ar,0.67*sc,1); sp.renderOrder=20;
  const dz=b.z==='fac'?-1.5:b.z==='wh'?1.4:b.z==='abk'?3.4:1.65; sp.position.copy(b.pos).add(new V3(0,dz,0)); if(b.z==='fac'){ const out=b.f==='S'?new V3(0,0,0.55):new V3(0.55,0,0); sp.position.add(out); }
  sp.userData.info={t:`${b.z==='abk'?'Інвертор АБК Deye SUN-100K-G03':b.id+' · щит PV 7/1'} → ${b.z==='abk'?'ТП-5913 (варіант 1)':KN(b.K)+' ('+TPN[b.K]+')'}`,d:`${n} ${strW(n)}: ${b.ss.map(s=>s.id).join(', ')}. ${nf1(kw)} кВтп.${b.L?` Лінія Al 2 × 1×${b.S} мм², ${nf1(b.L)} м, ΔU ${nf2(b.du)} %.`:''}`};
  PICK.push({o:sp,when:()=>sp.parent&&sp.parent.visible}); (b.st===2?g2:g).add(sp); });
// ---------- підказки модулів у режимі «Електрика»: стрінг → щит → контейнер
const MI=new Map(), sTip=s=>{ const b=BX[s.box], n=s.mem.length;
  return {t:`Стрінг ${s.id} → ${b.z==='abk'?'інвертор АБК':s.box} → ${b.z==='abk'?'ТП-5913':KN(s.K)}`,d:`${n} модулів послідовно, ${nf1(n*0.73)} кВтп${s.src?` (у розкладці — ${s.src})`:''}. Кабель стрінга «+» і «−» 1×6 від крайнього модуля до ${b.z==='abk'?'інвертора':'щита'}${s.jmp?`; перемичок між частинами стрінга — ${s.jmp}`:''}. ${b.z==='abk'?`Інвертор: ${b.ss.length} стрінгів, ${nf1(b.kwp)} кВтп.`:`Щит ${s.box}: ${b.ss.length} ${strW(b.ss.length)}, ${nf1(b.kwp)} кВтп, лінія Al ${nf1(b.L)} м до ШВ ${KN(s.K)} (${TPN[s.K]}).`}`}; };
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
const GRP=[['fac','Фасади і козирок',1,'південь → К-3, схід і козирок → К-1'],['lan','Ліхтарі Л1–Л4',1,'усі → К-3 / К-1 (ТП-5913)'],['wh','Склад',1,'→ К-3 / К-1 (ТП-5913)'],['abk','АБК',1,'свій інвертор → ТП-5913'],['roof','Дах цеху В1',2,'захід → К-4 / К-5, схід → К-3 / К-1']];
const gsum=z=>{ const L=STR.filter(s=>s.z===z), bx=Object.values(BX).filter(b=>b.ss.length&&b.ss[0].z===z); return {nb:bx.length,ns:L.length,nm:L.reduce((a,s)=>a+s.mem.length,0),kw:L.reduce((a,s)=>a+s.mem.length,0)*0.73,L:bx.reduce((a,b)=>a+(b.L||0),0),du:bx.reduce((a,b)=>Math.max(a,b.du||0),0),bx}; };
const SUM=Object.fromEntries(GRP.map(([z])=>[z,gsum(z)]));
const chk=Object.values(BX).filter(b=>b.ns!=null&&b.ss.length!==b.ns).map(b=>`${b.id}: ${b.ss.length} з ${b.ns}`);
// ---------- «Накопичувачі»: як під'єднано по етапах (власник 04.11, 18:04: етап 1 — усе PV на одну пару контейнерів, друга пара — лише мережа; етап 2 — дах)
const puW=panelUZE; panelUZE=function(){ const html=puW.apply(this,arguments), B=E4w.E4.boxes, var2=(E4w.E4.var||'1')==='2';
  const cnt=(K,st)=>{ const L=B.filter(b=>b.K===K&&b.st===st); return {n:L.length,ns:L.reduce((a,b)=>a+b.ns,0),kw:L.reduce((a,b)=>a+b.kwp,0),z:[...new Set(L.map(b=>({fac:'фасади',wh:'склад',lan:'ліхтарі',roof:'дах'})[b.z]))].join(', ')}; };
  const rows=['K-3','K-1','K-4','K-5'].map(K=>{ const a=cnt(K,1), c=cnt(K,2);
    return `<tr><td class="w"><i class="sw" style="background:${HUE[K]}"></i>${KN(K)}<span class="stg">${TPN[K]}</span></td><td style="white-space:normal">${a.n?`${a.n} ${shW(a.n)} · ${a.ns} ${strW(a.ns)} · ${nf1(a.kw)} кВтп<small>${a.z}</small>`:'без панелей — лише мережа<small>заряд і розряд (активний споживач)</small>'}</td><td style="white-space:normal">${c.n?`+${c.n} ${shW(c.n)} · ${c.ns} ${strW(c.ns)} · ${nf1(c.kw)} кВтп<small>дах</small>`:'—'}</td><td>${a.n+c.n} з 12</td></tr>`; }).join('');
  const f$=v=>nf(v,0)+' $';
  return html+`<div class="blk wide"><h3>Як під'єднано — по етапах</h3><div class="tw"><table class="cmp an"><thead><tr><th>Контейнер</th><th>Етап 1</th><th>Етап 2</th><th>Входи PV</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="src"><b>AC</b> — кожен контейнер (PCS 500 кВт) окремою лінією до РУ-0,4 кВ своєї ТП: ВВГнг 3 × (6 × 1×120) + N 4 × 1×95 + PE 2 × 1×95 за вимогою Golen, автомат 800 А на початку лінії; К-3, К-1 — до ТП-5913, К-4, К-5 — вводом у північну стіну ТП-6923. <b>DC</b> — від щитів PV лінії Al до шафи вводу PV біля контейнера (перехід на мідь 1×50, ПЗІП T2) і далі на входи DC/DC по 60 кВт.
  ${var2?`Етап 1: усі панелі етапу 1 (фасади, склад, ліхтарі) — на К-3 / К-1 біля ТП-5913; К-4 / К-5 біля ТП-6923 — без панелей, працюють від мережі (заряд у дешеві години, розряд у пікові). Етап 2: дах — захід на К-4 / К-5, схід на вільні входи К-3 / К-1; лоток спуску до ТП-6923 будується в етапі 2.`:''}</p>
  <p class="src">Для роботи К-4 / К-5 від мережі в етапі 1 ще потрібні: дозволена потужність заряду від ДТЕК і запас трансформатора ТП-6923, тариф (зонний або ціни РДН) і погодинне споживання цеху з АСКОЕ — від них графік заряду / розряду і ефект.</p></div>`; };
window.__twin.elecwa={g,g2,STR,BX,SUM,jumps,chk,paint,TN:TNh,toneConf,confZ};
// ---------- видимість: кнопка «Електрика» (state.lay.e04) у «Об'єкті», режим етапів
const onW=()=>!!state.lay.e04&&state.sec==='pz'&&state.proj==='ours'&&!!(R28w&&R28w.ON());
const svW=setVis; setVis=function(){ svW.apply(this,arguments); const on=onW(), s=state.lay.stg; g.visible=on&&s!=='2'; g2.visible=on&&s!=='1';
  if(Aw&&Aw.groups){ if(Aw.groups.str) Aw.groups.str.visible=g.visible; if(g.visible&&Aw.groups.elec) Aw.groups.elec.visible=true; }
  if(on!==ON){ ON=on; paint(on); } need=true; };
// ---------- легенда: стрінги
const hudW=hudCtx; hudCtx=function(){ hudW.apply(this,arguments); if(!onW()) return; const l=$('#legend'); if(!l) return; const s=state.lay.stg;
  const z=s==='2'?['roof']:s==='1'?['fac','lan','wh','abk']:['fac','lan','wh','abk','roof'], ns=z.reduce((a,k)=>a+SUM[k].ns,0), sw=c=>`<i class="sw" style="background:${c}"></i>`;
  l.insertAdjacentHTML('beforeend',`<span class="e4">Стрінгів: ${nf(ns)} · колір — контейнер щита, ${sw(TNh['K-3'][0])}${sw(TNh['K-3'][2])}${sw(TNh['K-3'][1])} сусідні стрінги — різні тони одного кольору, контур — межа стрінга · ${z.includes('abk')?sw(HUE.ABK)+'АБК (інвертор) · ':''}${sw(GREY)}освітлення · лінія — кабель стрінга до щита</span>`); };
// ---------- панель «Об'єкт»: стрінги → щити → контейнери
const ppW=panelPZ; panelPZ=function(){ const html=ppW.apply(this,arguments); if(!state.lay.e04) return html;
  const tot=st=>{ const L=GRP.filter(r=>st==null||r[2]===st).map(r=>SUM[r[0]]); return {nb:L.reduce((a,x)=>a+x.nb,0),ns:L.reduce((a,x)=>a+x.ns,0),nm:L.reduce((a,x)=>a+x.nm,0),kw:L.reduce((a,x)=>a+x.kw,0),L:L.reduce((a,x)=>a+x.L,0)}; };
  const row=(n,sub,x,bold)=>`<tr${bold?' style="font-weight:600"':''}><td class="w">${n}${sub?`<span class="stg">${sub}</span>`:''}</td><td>${nf(x.nb)}</td><td>${nf(x.ns)}</td><td>${nf(x.nm)}</td><td>${nf1(x.kw)}</td><td>${x.L?nf(x.L,0):'—'}</td></tr>`;
  const rows=GRP.filter(r=>r[2]===1).map(r=>row(r[1],`етап 1 · ${r[3]}`,{...SUM[r[0]],nb:r[0]==='abk'?1:SUM[r[0]].nb})).join('')+row('Етап 1 разом','щити PV і інвертор АБК',{...tot(1),nb:tot(1).nb},true)
    +row(GRP[4][1],`етап 2 · ${GRP[4][3]}`,SUM.roof)+row("Весь об'єкт",'',tot(null),true);
  const det=GRP.map(([z,n])=>{ const bx=SUM[z].bx.slice().sort((a,b)=>a.id.localeCompare(b.id,'uk',{numeric:true})); if(!bx.length) return '';
    return `<tr><td colspan="4" style="font-weight:600;padding-top:8px">${n}</td></tr>`+bx.map(b=>`<tr><td class="w"><i class="sw" style="background:${HUE[b.K]}"></i> ${b.z==='abk'?'Інвертор АБК':b.id}<span class="stg">→ ${b.z==='abk'?'ТП-5913':KN(b.K)+' · Al '+nf1(b.L)+' м · ΔU '+nf2(b.du)+' %'}</span></td><td>${b.ss.length}</td><td style="text-align:left;white-space:normal">${b.ss.map(s=>s.id).join(', ')}</td></tr>`).join(''); }).join('');
  const AB=EW.abk, v=state.lay.abkV==='3'?AB.var3:AB.var1, vn=state.lay.abkV==='3'?'варіант 3 — до К-3 / К-1':state.lay.abkV==='2'?'варіант 2 — власний накопичувач, без лінії до ТП':'варіант 1 — до щита СЕС у ТП-5913';
  return html+`<div class="blk"><h3>Електрика: стрінги → щити PV → контейнери</h3>
  <p class="src">На моделі: колір модуля — контейнер, куди йде щит; сусідні стрінги — різні тони того самого кольору (основний, світлий, темний), темний контур — межа стрінга; тонка лінія — кабель стрінга «+» і «−» 1×6 до щита; над щитом — табличка. Натисніть модуль — стрінг і щит.</p>
  <table class="cmp an"><thead><tr><th>Група</th><th>Щитів</th><th>Стрінгів</th><th>Модулів</th><th>кВтп</th><th>Лінії Al, м</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="src">Стрінги по 11 модулів ZNSHINE 730 Вт (АБК — по 12 на інвертор Deye). Щит PV 7/1 — до 7 стрінгів, 1 вхід DC/DC 60 кВт; лінії Al 2 × 1×120 мм² (одна 185) до ШВ біля контейнера, довжини з запасом 5 % + 4 м. Ліхтарі — 27 стрінгів (Л1 — 6, Л2–Л4 — по 7) і 19 модулів на освітлення; у кошторисі 04.11 було 28 — виправлено в розрахунку щитів. Склад перераховано під нові місця К-3 / К-1: ${EW.wh.map(w=>`${w.id} ${nf1(w.L)} м`).join(', ')}; траншея через проїзд ≈${nf(EW.trench,0)} м (чи повітряний перехід — уточнити).${chk.length?` Розбіжність зі щитами: ${chk.join('; ')}.`:''}</p>
  <details><summary>Щити по одному — які стрінги куди</summary><table class="cmp an"><thead><tr><th>Щит</th><th>Стрінгів</th><th>Стрінги</th></tr></thead><tbody>${det}</tbody></table></details>
  <table class="cmp an"><thead><tr><th>АБК · Deye SUN-100K-G03</th><th>Значення</th></tr></thead><tbody>
  <tr><td class="w">Модулі і стрінги<span class="stg">етап 1 · ДБН, ${AB.nmppt} MPPT</span></td><td>${AB.n} · ${AB.strings} × ${AB.L} · ${nf1(AB.kwp)} кВтп</td></tr>
  <tr><td class="w">Напруга стрінга<span class="stg">межі інвертора 200–1 000 В</span></td><td>Uхх −30 °C ${nf(AB.voc30,0)} В · Uмп 70 °C ${nf(AB.vmp70,0)} В</td></tr>
  <tr><td class="w">Кабель DC 1×6<span class="stg">«+» / «−» / перемички</span></td><td>${nf(AB.dc.plus,0)} / ${nf(AB.dc.minus,0)} / ${nf(AB.dc.jump,0)} м · втрати ${nf2(AB.dc.du)} %</td></tr>
  <tr><td class="w">Лотки 100×50<span class="stg">дах АБК, стіни</span></td><td>${nf1(AB.tray)} м</td></tr>
  <tr><td class="w">AC ${nf1(AB.iac)} А<span class="stg">${vn}</span></td><td>${state.lay.abkV==='2'?'—':`СІП-4 4×70 ${nf1(v.L)} м · ΔU ${nf2(v.du)} % · ≈${nf(v.e,0)} кВт·год/рік`}</td></tr></tbody></table>
  <p class="src">Стрінги даху, ліхтарів і фасадів — calc/ep04/strings_all.py (розкладка двійника → щити розрахунку 04.11); склад — розкладка стрінгів складу і calc/ep04/wh_abk.py; АБК — abk/abk_dbn.json (модель K1, ДБН 28.10).</p></div>`; };
apply();
} }
