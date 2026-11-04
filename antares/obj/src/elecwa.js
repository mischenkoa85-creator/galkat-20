// ================= Електрика складу і АБК (src/elecwa.js; дані ELECWA — calc/ep04/wh_abk.py): власник 04.11, 16:58 — «електрика з АБК та зі складу ніяк не прорахована і не показана»
// Склад: стрінги кольором, кабелі стрінгів до щитів ЩС-С1…С3, лінії Al до ШВ К-3 / К-1 (стіна складу → траншея через проїзд → кут цеху → лоток по східному фасаду).
// АБК: стрінги кольором (11 по 12), кабелі стрінгів, лотки, інвертор Deye, лінія AC за вибраним варіантом. Кнопка — та сама «Електрика» в «Об'єкті».
{ const EW=typeof ELECWA!=='undefined'?ELECWA:null, E4w=window.__twin.elec04, Aw=window.__twin.abk, EPw=window.__twin.EPX;
if(EW&&E4w){
const g=grp('elecwa',G.ours); g.visible=false;
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
// ---------- склад: стрінги — кольором і кабелем до щита
const PALw=['#2f6fdb','#e0782b','#2c9a5b','#c23b6b','#7b5bd6','#c9a227','#1aa3b4','#d9534f','#5c8f2f','#a0522d','#3a7ca5','#e377c2','#8c6d31','#17becf','#6b4c9a','#b5651d'].map(c=>lin(c));
const whStr=[], _m4=new THREE.Matrix4(), _p=new V3(), _qq=new THREE.Quaternion(), _sc=new V3();
if(EPw&&EP&&EP.whi){ EPw.strings.forEach((s,si)=>{ if(s.r) return; const b=EPw.boxes[s.b]; if(!b||!WB[b.n]) return;
    const pts=s.m.map(j=>EP.whi[j]).filter(Boolean).map(([w,k])=>{ WHI[w].im.getMatrixAt(k,_m4); _m4.decompose(_p,_qq,_sc); return _p.clone().add(new V3(0,0.12,0)); });
    whStr.push({si,id:s.id,box:b.n,K:WB[b.n].K,n:s.m.length,keys:s.m.map(j=>EP.whi[j]).filter(Boolean).map(a=>a.join(':')),pts}); });
  whStr.forEach((s,i)=>{ const col=PALw[i%PALw.length], mt=new THREE.MeshBasicMaterial({color:col}), w=WB[s.box];
    const home=W(w.X,w.Y,1.2), a=s.pts[0], z=s.pts[s.pts.length-1];
    const info={t:`Стрінг складу ${s.id} → ${s.box} → ${s.K}`,d:`${s.n} модулів ZNSHINE 730 Вт послідовно (Uхх при −30 °C ≈ 620 В ≤ 660 В входу DC/DC). Кабель 1×6 по міні-рейках і краю скату до щита ${s.box} на північній стіні складу.`};
    if(s.pts.length>1) tubeW(s.pts,mt,0.025,info);
    tubeW([a,new V3(a.x,a.y,home.z+0.4),home],mt,0.02); tubeW([z,new V3(z.x,z.y,home.z+0.4),home],mt,0.02); }); }
function paintWH(on){ if(!EP||!EP.whs) return; const map=new Map(); whStr.forEach((s,i)=>s.keys.forEach(k=>map.set(k,PALw[i%PALw.length])));
  WHI.forEach((w,wi)=>{ for(let k=0;k<w.n;k++){ w.im.setColorAt(k,on&&map.has(wi+':'+k)?map.get(wi+':'+k):white); } if(w.im.instanceColor) w.im.instanceColor.needsUpdate=true; }); }
// ---------- АБК: стрінги кольором, кабелі стрінгів (група str моделі АБК), інвертор і лотки (група elec)
let abkPainted=false;
function paintABK(on){ if(!Aw||!Aw.MODS) return;
  if(on){ Aw.MODS.forEach(r=>{ if(!r.mesh) return; const m=Aw.strMat(r.k||1); r.mesh.material=m; r.mesh.userData.base=m; }); abkPainted=true; }
  else if(abkPainted){ const pv=(typeof PVA!=='undefined'&&PVA)?PVA:null; Aw.MODS.forEach(r=>{ if(!r.mesh) return; const m=pv||r.mesh.userData.face0; r.mesh.material=m; r.mesh.userData.base=m; }); abkPainted=false; } }
const AB=EW.abk;
if(Aw){ const iv=AB.pos, lb=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex(['Deye SUN-100K-G03 · АБК',`${AB.strings} стрінгів по ${AB.L} · ${nf1(AB.kwp)} кВтп`],512,128,'#2b6f8f'),depthTest:false,transparent:true}));
  lb.scale.set(0.13,0.0325,1); lb.material.sizeAttenuation=false; lb.position.copy(W(iv.x,iv.y,iv.z0+2.2)); lb.renderOrder=18; g.add(lb);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); hit.position.copy(W(iv.x,iv.y,iv.z0+0.4)); g.add(hit);
  hit.userData.info={t:'АБК · інвертор Deye SUN-100K-G03 (ДБН, 132 модулі)',d:`${AB.n} модулів, ${nf1(AB.kwp)} кВтп, ≈${nf1(AB.mwh)} МВт·год за рік. ${AB.strings} стрінгів по ${AB.L} на ${AB.nmppt} MPPT; Uхх при −30 °C ${nf(AB.voc30,0)} В ≤ 1 000 В, Uмп при 70 °C ${nf(AB.vmp70,0)} В ≥ 200 В. Кабель 1×6: «+» ${nf(AB.dc.plus,0)} м, «−» ${nf(AB.dc.minus,0)} м, перемички ${nf(AB.dc.jump,0)} м (${AB.dc.njump}); втрати DC ≈${nf2(AB.dc.du)} % (≈${nf(AB.dc.e,0)} кВт·год за рік). Лотки 100×50 — ${nf1(AB.tray)} м. AC ${nf1(AB.iac)} А: варіант 1 — СІП-4 4×70 ${nf1(AB.var1.L)} м до ТП-5913, ΔU ${nf2(AB.var1.du)} %; варіант 3 — ≈${nf1(AB.var3.L)} м до К-3 / К-1, ΔU ${nf2(AB.var3.du)} %.`};
  PICK.push({o:hit,when:()=>g.visible}); }
// ---------- видимість: разом із кнопкою «Електрика» (state.lay.e04), «Об'єкт», етап 1 або весь об'єкт
const onW=()=>!!state.lay.e04&&state.sec==='pz'&&state.proj==='ours'&&state.lay.stg!=='2';
let wasOn=false;
const svW=setVis; setVis=function(){ svW.apply(this,arguments); const on=onW(); g.visible=on;
  if(Aw&&Aw.groups){ if(Aw.groups.str) Aw.groups.str.visible=on; if(on&&Aw.groups.elec) Aw.groups.elec.visible=true; }
  if(on!==wasOn){ paintWH(on); paintABK(on); wasOn=on; } else if(on){ paintABK(true); }
  need=true; };
// ---------- панель «Об'єкт»: блок «Електрика» з усіма групами етапу 1 і дахом етапу 2
const ppW=panelPZ; panelPZ=function(){ const html=ppW.apply(this,arguments); if(!state.lay.e04) return html;
  const B=E4w.E4.boxes, grpB=z=>B.filter(b=>b.z===z), sum=(L,k)=>L.reduce((a,b)=>a+(b[k]||0),0), mx=(L,k)=>L.reduce((a,b)=>Math.max(a,b[k]||0),0);
  const row=(n,st,L,extra)=>`<tr><td class="w">${n}<span class="stg">етап ${st}${extra?' · '+extra:''}</span></td><td>${nf(L.length)}</td><td>${nf(sum(L,'ns'))}</td><td>${nf1(sum(L,'kwp'))}</td><td>${nf(sum(L,'L'),0)}</td><td>${nf2(mx(L,'du'))}</td></tr>`;
  const wh=EW.wh.map(w=>({...w}));
  const rows=[row('Фасади цеху',1,grpB('fac'),'Al 120, південь → К-3, схід → К-1'),row('Ліхтарі',1,grpB('lan'),'Л1–Л3 → К-4 / К-5, Л4 → К-1'),
    row("Склад",1,wh,`траса умовна: спільна траншея через проїзд ≈${nf(EW.trench,0)} м`),row('Дах цеху В1',2,grpB('roof'),'захід → К-4 / К-5, схід → К-3 / К-1')].join('');
  const v=state.lay.abkV==='3'?AB.var3:AB.var1, vn=state.lay.abkV==='3'?'варіант 3 — до К-3 / К-1':state.lay.abkV==='2'?'варіант 2 — власний накопичувач, без лінії до ТП':'варіант 1 — до щита СЕС у ТП-5913';
  return html+`<div class="blk"><h3>Електрика: стрінги → щити PV → лінії → контейнери</h3><table class="cmp an"><thead><tr><th>Група</th><th>Щитів</th><th>Стрінгів</th><th>кВтп</th><th>Лінії Al, м</th><th>ΔU макс., %</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="src">Щити PV 7/1, 1 вхід DC/DC 60 кВт на щит; лінії Al 2 × 1×120 мм² (одна 185), довжини — з запасом 5 % + 4 м. Склад перераховано 04.11 під нові місця К-3 / К-1: ${EW.wh.map(w=>`${w.id} ${nf1(w.L)} м (було ${nf(w.L_old,0)})`).join(', ')}.</p>
  <table class="cmp an"><thead><tr><th>АБК · Deye SUN-100K-G03</th><th>Значення</th></tr></thead><tbody>
  <tr><td class="w">Модулі і стрінги<span class="stg">етап 1 · ДБН, ${AB.nmppt} MPPT</span></td><td>${AB.n} · ${AB.strings} × ${AB.L} · ${nf1(AB.kwp)} кВтп</td></tr>
  <tr><td class="w">Напруга стрінга<span class="stg">межі інвертора 200–1 000 В</span></td><td>Uхх −30 °C ${nf(AB.voc30,0)} В · Uмп 70 °C ${nf(AB.vmp70,0)} В</td></tr>
  <tr><td class="w">Кабель DC 1×6<span class="stg">«+» / «−» / перемички</span></td><td>${nf(AB.dc.plus,0)} / ${nf(AB.dc.minus,0)} / ${nf(AB.dc.jump,0)} м · втрати ${nf2(AB.dc.du)} %</td></tr>
  <tr><td class="w">Лотки 100×50<span class="stg">дах АБК, стіни</span></td><td>${nf1(AB.tray)} м</td></tr>
  <tr><td class="w">AC ${nf1(AB.iac)} А<span class="stg">${vn}</span></td><td>${state.lay.abkV==='2'?'—':`СІП-4 4×70 ${nf1(v.L)} м · ΔU ${nf2(v.du)} % · ≈${nf(v.e,0)} кВт·год/рік`}</td></tr></tbody></table>
  <p class="src">Склад: ${EW.note}. Розрахунок — calc/ep04/wh_abk.py (склад), abk/abk_dbn.json (АБК, модель K1, ДБН 28.10).</p></div>`; };
window.__twin.elecwa={g,whStr,paintWH,paintABK};
apply();
} }
