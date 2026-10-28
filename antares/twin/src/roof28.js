// ================= Дах 28.10 без ліхтарів: два варіанти розкладки — src/roof28.js (дані ROOF28 ← calc/roof_nolan/twin28_export.py)
// Ліхтарі розібрано, на сталевих каркасах 13° (бортик 0,30) — нова покрівля і модулі вертикально по 1 ряду на схил; 11 труб за фото; лівневки.
// В1 — з проходами і відступами (IFC 2021 § 1205.3, FK Bauaufsicht; арк. 9 і 11 креслення ЕСЕ-2610-01-ПК), В2 — максимальний (арк. 10).
// Модулі поза стрінгами по 11 — теж ставляться, на освітлення цеху (рішення власника 28.10, 12:19). Показується в «Загальному»; «Сонце» — стан 27.10.
{ const D=(typeof ROOF28!=='undefined')?ROOF28:null; if(D){
const LM=2.384, DM=1.303, KS=['1','2'];
const VN={'1':'В1 · з проходами','2':'В2 · максимальний'}, VL={'1':'варіант 1 — з проходами і відступами','2':'варіант 2 — максимальний, без проходів'};
if(state.lay.r28===undefined) state.lay.r28='1';
const ON=()=>state.proj==='ours'&&!!state.lay.r28&&state.sec==='pz';
const G28=grp('r28',G.ours), GC=grp('r28c',G28);
const ZAX=new V3(0,0,1), Pv=new V3(), Sv=new V3(), Qv=new Q(), Mv=new M4();
// бокс на грані покрівлі від xa до xb (як modM у roofv2.js): lift — над покрівлею, th — товщина, ly — вздовж будівлі
function onRoof(xa,xb,y,lift,th,ly){ const za=roofZ(xa)+lift, zb=roofZ(xb)+lift, ang=Math.atan2(zb-za,xb-xa), L=Math.hypot(xb-xa,zb-za);
  Qv.setFromAxisAngle(ZAX,ang); const up=new V3(-Math.sin(ang),Math.cos(ang),0);
  Pv.copy(W((xa+xb)/2,y,(za+zb)/2)).addScaledVector(up,th/2); return Mv.compose(Pv,Qv,Sv.set(L,th,ly)); }
// смуга по гранях від x0 до x1 (ламана за переломами профілю)
function segs(x0,x1){ const c=[x0,...D.xs.filter(x=>x>x0+1e-3&&x<x1-1e-3),x1], out=[]; for(let i=0;i+1<c.length;i++) out.push([c[i],c[i+1]]); return out; }
// ---------- каркаси 13° на місці ліхтарів: бортик, нова покрівля
const curbM=std(lin(0x8a8f93),{roughness:0.85}), froofM=std(lin(0x5d6468),{roughness:0.8}), railM=MAT.zn||std(lin(0xb9c0c5),{metalness:0.6,roughness:0.4});
const CB=1.83;   // бортик 3,66 м по низу (рулетка 27.10, фото 111925); каркас 3,0 м — на ньому
D.frames.forEach(F=>{ const h=F.half, zr0=Math.min(roofZ(F.xc-CB),roofZ(F.xc+CB))-0.05;
  const cb=box(2*CB,F.ze-zr0,F.y1-F.y0,curbM,F.xc,(zr0+F.ze)/2,-(F.y0+F.y1)/2,GC);
  const shp=new THREE.Shape([new THREE.Vector2(F.xc-h-0.05,F.ze-0.02),new THREE.Vector2(F.xc+h+0.05,F.ze-0.02),new THREE.Vector2(F.xc,F.zr+0.01)]);
  const rf=mesh(new THREE.ExtrudeGeometry(shp,{depth:F.y1-F.y0,bevelEnabled:false}),froofM,GC); rf.position.z=-F.y1;
  const inf={t:`Каркас ліхтаря ${F.id} — 13°, нова покрівля`,d:`Скління ліхтаря знято; на сталевому каркасі ${nf(2*h,1)} м по низу — двосхила покрівля ${nf(F.tilt,0)}° на бортику 3,66 м по низу, ${nf(F.ze-F.zb,2)} м заввишки (власник 28.10, 10:20), гребінь +${nf(F.zr,2)}. Довжина ${nf(F.y1-F.y0,1)} м (Y ${nf(F.y0,2)}–${nf(F.y1,2)}). Вісь — за розрізом 1-1, РП і Google Maps: на ≈1,5 м східніше центру арки (перевірено 28.10 по знімку і фото 123924). Модулі — вертикально по 1 ряду на схил, на 2 рейках 41×41 (540 мм від торців модуля), нижня рейка — на консолях за краєм каркаса (звис модулів ≈0,8 м).`};
  cb.userData.info=inf; rf.userData.info=inf; PICK.push({o:cb,when:()=>GC.visible},{o:rf,when:()=>GC.visible}); });
// ---------- 11 труб вентиляції (фото 26–27.10) і лівневки
const pM=std(lin(0x4a4f53),{roughness:0.8}), capM=std(lin(0xd9dcde),{roughness:0.5,metalness:0.3});
D.pipes.forEach(([n,x,y,d,h,src])=>{ const z=roofZ(x), big=d>=0.9, hb=big?h*0.55:h;
  const b=mesh(new THREE.CylinderGeometry(d*0.32,d*0.36,hb,14),pM,GC); b.position.set(x,z+hb/2,-y); const parts=[b];
  if(big){ const c=mesh(new THREE.ConeGeometry(d/2,h-hb,18),capM,GC); c.position.set(x,z+hb+(h-hb)/2,-y); parts.push(c); }
  parts.forEach(p=>{ p.userData.info={t:`Труба вентиляції Д${n}`,d:`X ${nf(x,1)}, Y ${nf(y,1)} м · Ø${nf(d,2)}, висота ${nf(h,1)} м. Є на фото: ${src}. Модулі — від 0,5 м (В1) або 0,3 м (В2) від стінки труби.`}; PICK.push({o:p,when:()=>GC.visible}); }); });
const drM=std(lin(0x2a78d6),{roughness:0.6}), drQ=std(lin(0x9cc3ef),{roughness:0.6});
D.drains.forEach(([id,x,y,st])=>{ const o=mesh(new THREE.CylinderGeometry(0.28,0.28,0.05,18),st==='уточнити'?drQ:drM,GC,false); o.position.set(x,roofZ(x)+0.03,-y);
  o.userData.info={t:`Лівневка ${id}`,d:`X ${nf(x,1)}, Y ${nf(y,1)} м · ${st}. У В1 — 0,6 м без модулів навколо; лівневки в ендовах, модулі ендов не перетинають.`}; PICK.push({o,when:()=>GC.visible}); });
// ---------- варіанти: модулі на гранях, на каркасах, на освітлення; проходи й відступи
const litM=std(lin(0xe8b23a),{roughness:0.45,metalness:0.1}), pathM=new THREE.MeshBasicMaterial({color:0x2e8b57,transparent:true,opacity:0.42,depthWrite:false}),
      perM=new THREE.MeshBasicMaterial({color:0x8cc98c,transparent:true,opacity:0.3,depthWrite:false});
const VG={};
KS.forEach(k=>{ const V=D.V[k], g=grp('r28v'+k,G28), S=V.sum;
  const tot=`${VL[k]}: у стрінгах ${nf(S.st.n)} модулів (${S.st.st} × 11), ${nf(S.st.kwp,1)} кВтп, ${nf(S.st.mwh,1)} МВт·год за рік; на освітлення ${S.lit.n}; усього ${nf(S.all)} модулів (≈${nf(S.pct,0)} % покрівлі).`;
  // модулі даху
  const rs=V.roof.filter(m=>m[4]>=0), rl=V.roof.filter(m=>m[4]<0);
  const im=inst(BOX,MAT.pvPo,rs.length,g), il=inst(BOX,litM,rl.length,g);
  rs.forEach((m,i)=>{ im.setMatrixAt(i,onRoof(m[0],m[1],m[2],0.12,0.033,LM-0.02)); im.setColorAt(i,white); }); im.instanceMatrix.needsUpdate=true;
  rl.forEach((m,i)=>il.setMatrixAt(i,onRoof(m[0],m[1],m[2],0.12,0.033,LM-0.02))); il.instanceMatrix.needsUpdate=true;
  im.userData.info=i=>{ const m=rs[i]; return {t:`Модуль даху · ${VN[k]} · стрінг ${m[4]+1}`,d:`ZNSHINE 730 Вт, короткою стороною поперек грані, 0,12 м над покрівлею. ≈${nf(m[3])} кВт·год за рік (${nf(m[3]/0.73)} на 1 кВтп). ${tot}`}; };
  il.userData.info=i=>{ const m=rl[i]; return {t:`Модуль поза стрінгами · ${VN[k]} — на освітлення цеху`,d:`Не складає стрінг по 11 — ставиться і підключається до світлодіодного освітлення (DC), рішення власника 28.10. Потенційно ≈${nf(m[3])} кВт·год за рік — у міру навантаження освітлення. ${tot}`}; };
  PICK.push({o:im,when:()=>g.visible},{o:il,when:()=>g.visible});
  // модулі на каркасах 13° (площина — як у calc/v3/lan22.py, режим V1: низ модуля 0,16 над площиною від карниза каркаса)
  const fs=V.frame.filter(m=>m[5]>=0), fl=V.frame.filter(m=>m[5]<0);
  const fM=(m)=>{ const F=D.frames[m[0]-1], sg=m[1]==='E'?1:-1, th=F.tilt*D2R, tg=Math.tan(th), uc=0.02+LM/2, dc=uc*Math.cos(th), zc=F.ze+(F.hw-dc)*tg+F.thk-0.0165;
    Qv.setFromAxisAngle(ZAX,-sg*th); Pv.copy(W(F.xc+sg*dc,(m[2]+m[3])/2,zc)); return Mv.compose(Pv,Qv,Sv.set(LM-0.02,0.033,DM-0.02)); };
  const fim=inst(BOX,MAT.pvPo,fs.length,g), fil=inst(BOX,litM,fl.length,g);
  fs.forEach((m,i)=>{ fim.setMatrixAt(i,fM(m)); fim.setColorAt(i,white); }); fim.instanceMatrix.needsUpdate=true;
  fl.forEach((m,i)=>fil.setMatrixAt(i,fM(m))); fil.instanceMatrix.needsUpdate=true;
  const fInfo=(m,lit)=>({t:`Модуль на каркасі ліхтаря Л${m[0]} · ${m[1]==='E'?'схід':'захід'} 13° · ${lit?'поза стрінгами — на освітлення':`стрінг Л ${m[5]+1}`}`,
    d:`Вертикально, 1 ряд на схил; стрінг — у межах одного ліхтаря. ≈${nf(m[4])} кВт·год за рік (${nf(m[4]/0.73)} на 1 кВтп)${lit?' — потенційно, на світлодіодне освітлення цеху':''}. ${tot}`});
  fim.userData.info=i=>fInfo(fs[i],false); fil.userData.info=i=>fInfo(fl[i],true);
  PICK.push({o:fim,when:()=>g.visible},{o:fil,when:()=>g.visible});
  // рейки 41×41 під модулями каркасів (по безперервних ділянках)
  const rails=[]; D.frames.forEach((F,li)=>['E','W'].forEach(sd=>{ const ms=V.frame.filter(m=>m[0]===li+1&&m[1]===sd).sort((a,b)=>a[2]-b[2]); let s0=null,s1=null;
    const flush=()=>{ if(s0!==null) [0.54,LM-0.54].forEach(u=>rails.push([F,sd,u+0.02,s0-0.05,s1+0.05])); };
    ms.forEach(m=>{ if(s0===null||m[2]>s1+0.1){ flush(); s0=m[2]; } s1=m[3]; }); flush(); }));
  const ri=inst(BOX,railM,rails.length,g);
  rails.forEach(([F,sd,u,y0,y1],i)=>{ const sg=sd==='E'?1:-1, th=F.tilt*D2R, d=u*Math.cos(th), z=F.ze+(F.hw-d)*Math.tan(th)+F.thk-0.033-0.0205;
    Qv.setFromAxisAngle(ZAX,-sg*th); Pv.copy(W(F.xc+sg*d,(y0+y1)/2,z)); ri.setMatrixAt(i,Mv.compose(Pv,Qv,Sv.set(0.041,0.041,y1-y0))); }); ri.instanceMatrix.needsUpdate=true;
  ri.userData.info=()=>({t:'Рейка 41×41 під модулями каркаса',d:'2 рейки на схил уздовж ліхтаря, у зоні притисків ZNSHINE (540 мм від торців модуля); нижня — на консолях за краєм каркаса. Крок консолей — за КМ.'}); PICK.push({o:ri,when:()=>g.visible});
  // проходи й відступи — смуги на гранях
  const zs=[]; V.zones.forEach(z=>segs(z[0],z[1]).forEach(([a,b])=>zs.push([a,b,z])));
  const zp=zs.filter(q=>q[2][4]==='path'), zq=zs.filter(q=>q[2][4]!=='path');
  [[zp,pathM],[zq,perM]].forEach(([arr,mt])=>{ if(!arr.length) return; const zi=inst(BOX,mt,arr.length,g,false);
    arr.forEach(([a,b,z],i)=>zi.setMatrixAt(i,onRoof(a,b,(z[2]+z[3])/2,0.015,0.01,z[3]-z[2]))); zi.instanceMatrix.needsUpdate=true;
    zi.userData.info=i=>{ const z=arr[i][2]; return {t:z[4]==='path'?`Прохід / протипожежний розрив`:`Відступ без модулів`,d:`${z[5]}. ${k==='1'?'Правила — IFC 2021 § 1205.3 (прохід ≥ 1,22 м через ≤ 45,7 м, від краю ≥ 1,83 м) і FK Bauaufsicht (поля ≤ 40 м, смуги 2,5 м); окремих українських цифр для СЕС на покрівлі не знайдено.':''}`}; };
    PICK.push({o:zi,when:()=>g.visible}); });
  VG[k]=g; });
// ---------- видимість: у «Загальному» замість даху 27.10 (ліхтарі, дефлектори v3, розкладки 25.10 і 27.10)
const sv=setVis; setVis=function(){ sv.apply(this,arguments); const on=ON();
  G28.visible=on; KS.forEach(k=>VG[k].visible=on&&state.lay.r28===k);
  if(G.lanv2) G.lanv2.visible=!on; if(G.roofv2&&on) G.roofv2.visible=false;
  const t3=window.__twin.v3; if(t3&&on) t3.DG3.visible=false;
  if(on){ ourMods.visible=false; lagMesh.visible=false; if(oBZ.boxes) oBZ.boxes.visible=false; ['blk','mat','sl','cp','rods','xp','ang','cl','an'].forEach(q=>{ if(OUR[q]) OUR[q].visible=false; }); } };
// ---------- перемикачі над моделлю і легенда
const hud=hudCtx; hudCtx=function(){ hud.apply(this,arguments); if(state.proj!=='ours'||state.sec!=='pz') return;
  const m=$('#modes'); if(!m) return;
  if(state.lay.r28) m.querySelectorAll('button').forEach(b=>{ if(/^(v2|sc[A-E]|lf\d+|lanM)$/.test(b.dataset.m||'')) b.remove(); });
  const add=(key,t,on,fn)=>{ const b=document.createElement('button'); b.type='button'; b.dataset.m=key; b.textContent=t; b.setAttribute('aria-pressed',String(!!on)); b.onclick=()=>{ fn(); apply(); save(); }; m.appendChild(b); };
  KS.forEach(k=>add('r28_'+k,`Дах 28.10 · ${VN[k]} · ${nf(D.V[k].sum.all)}`,state.lay.r28===k,()=>{ state.lay.r28=state.lay.r28===k?'':k; }));
  m.hidden=false;
  if(ON()){ const V=D.V[state.lay.r28], S=V.sum, l=$('#legend');
    l.innerHTML=`<span class="t">Дах 28.10 · ${VN[state.lay.r28]}</span><span>${nf(S.st.n)} у стрінгах · ${nf(S.st.mwh,1)} МВт·год</span><span><i class="sw" style="background:#e8b23a"></i>поза стрінгами — на освітлення (${S.lit.n})</span>${V.zones.some(z=>z[4]==='path')?'<span><i class="sw" style="background:#2e8b57"></i>прохід / розрив</span>':''}<span><i class="sw" style="background:#8cc98c"></i>відступ</span><span><i class="sw" style="background:#5d6468"></i>каркас ліхтаря 13°</span><span><i class="sw" style="background:#4a4f53"></i>труби (11)</span><span><i class="sw" style="background:#2a78d6"></i>лівневки</span>`; l.hidden=false; } };
// ---------- панель «Загальне»
const pz=panelPZ; panelPZ=function(){ if(!ON()) return pz.apply(this,arguments);
  const v2=state.lay.v2; state.lay.v2=false; const h=pz.apply(this,arguments); state.lay.v2=v2;   // нижче — порівняння проєктів без блоків 27.10
  const k=state.lay.r28, A=D.V['1'], B=D.V['2'], cur=q=>q===k?'cur':'';
  const row=(t,f,cls)=>`<tr class="${cls||''}"><td>${t}</td>${KS.map(q=>`<td class="${cur(q)}">${f(D.V[q],q)}</td>`).join('')}</tr>`;
  const ka=A.chk, kb=B.chk, px=ka.paths.filter(p=>p.kind==='Пн–Пд'), py=ka.paths.filter(p=>p.kind==='Сх–Зх');
  return `<div class="ph"><span class="eyebrow ours">Дах цеху 28.10 · без ліхтарів · два варіанти розкладки</span><h2>${nf(D.V[k].sum.all)} модулів · ${nf(D.V[k].sum.st.mwh,1)} МВт·год у мережу</h2>
  <p>Скління ліхтарів знято, на каркасах — нова покрівля 13° на бортику 0,30 м і модулі вертикально по 1 ряду на схил. На даху — 11 труб (усі видно на фото 26–27.10), лівневки, рама кондиціонерів, вихід на дах. Модулі, що не складають стрінг по 11, теж ставляться — на освітлення цеху (жовті). Креслення — ЕСЕ-2610-01-ПК, арк. 9–11.</p></div>
  <table class="cmp"><thead><tr><th></th><th class="ours">В1 · з проходами</th><th class="ours">В2 · максимальний</th></tr></thead><tbody>
  ${row('У стрінгах (мережа): модулів = стрінгів',V=>`${nf(V.sum.st.n)} = ${V.sum.st.st}`)}${row('кВтп',V=>nf(V.sum.st.kwp,1))}${row('МВт·год за рік',V=>`<b>${nf(V.sum.st.mwh,1)}</b>`,'tot')}
  ${row('з них каркаси ліхтарів',V=>`${V.sum.frame.n} · ${nf(V.sum.frame.mwh,1)}`)}${row('На освітлення (потенційно, МВт·год)',V=>`${V.sum.lit.n} · ${nf(V.sum.lit.mwh,1)}`)}
  ${row('Усього модулів',V=>`<b>${nf(V.sum.all)}</b> · ${nf(V.sum.st.kwp+V.sum.lit.kwp,1)} кВтп`,'tot')}${row('Зайнято покрівлі',V=>`≈${nf(V.sum.pct,0)} %`)}
  ${row('Від стіни / парапетів (Зх · Сх · Пд · Пн), м',V=>[V.chk.west,V.chk.east,V.chk.south,V.chk.north].map(x=>nf(x,2)).join(' · '))}
  ${row('Найбільше поле без проходу, м',V=>`${nf(V.chk.field_max_dx,1)} × ${nf(V.chk.field_max_dy,1)}`)}</tbody></table>
  <p class="src"><b>В1</b> — відступ 1,83 м від стіни західної будівлі і парапетів (IFC 2021 § 1205.3.1: обидві осі будівлі > 76,2 м), два проходи Сх–Зх ${nf(Math.min(...py.map(p=>p.got)),2)} м (поля ≤ 40 м, FK Bauaufsicht), два Пн–Пд ${nf(Math.min(...px.map(p=>p.got)),2)}–${nf(Math.max(...px.map(p=>p.got)),2)} м уздовж ендов осей 7 і 10 (IFC § 1205.3.2), зони біля виходу (${nf(ka.exit,1)} м), дверей (${nf(ka.door,1)}), рами кондиціонерів (${nf(ka.ac,1)}), труб (${nf(ka.pipes,2)}), лівневок (${nf(ka.drains,1)}). Перевірено по кожному модулю.
  <b>В2</b> — модулі всюди, де можна фізично: без проходів, одне поле ≈${nf(kb.field_max_dx,0)} × ${nf(kb.field_max_dy,0)} м; обслуговування — лише по ендовах. Правил В1 не виконує — погоджувати з ДСНС / експертизою.</p>
  <div class="blk"><h3>Що ще відкрито</h3><p class="src">1) ДБН В.2.6-220 п. 5.1.3: обладнання понад 30 % площі покриття не допускається — модулі займають ≈${nf(A.sum.pct,0)} % (В1) і ≈${nf(B.sum.pct,0)} % (В2); потрібна позиція експертизи. 2) Клас горючості мембрани ТПО (сертифікат Broof(t1)): якщо горюча — проходи Пн–Пд 2,5 м, кабелі DC лише в закритих металевих лотках (ППБУ розд. IV гл. 1 п. 1.18). 3) Чи ліхтарі були частиною димовидалення цеху. 4) Друга пожежна драбина (ДБН В.1.1-7 п. 8.5: периметр ≈388 м — 2 виходи), чи двері західної будівлі — евакуаційний вихід. 5) Напруга й потужність світлодіодного освітлення під модулі поза стрінгами.</p>
  <p class="src">Генерація — модель v3 (Meteonorm 8.1, тінь від західної будівлі, парапетів, рами, труб і каркасів), стрінги по 11 з утратою від різної освітленості. Живі тіні в «Сонці» — поки для стану 27.10.</p>
  <p>${KS.map(q=>`<button type="button" class="lnk r28tg" data-t="${q}">${VN[q]}</button>`).join(' · ')} · <button type="button" class="lnk r28tg" data-t="">Дах 27.10 (як було)</button></p></div>`+h; };
// ---------- рядок сонця внизу: цифри 28.10 замість станції 27.10 (живих тіней для 28.10 ще немає)
const su=sunUI; sunUI=function(){ su.apply(this,arguments); if(!ON()) return; const el=$('#now'); if(!el) return; const S=D.V[state.lay.r28].sum, sun=(el.innerHTML.match(/<span class="sun">.*?<\/span>/)||[''])[0];
  el.innerHTML=`<span class="who ours">Дах 28.10 · ${VN[state.lay.r28]}</span>${sun}<span>${nf(S.all)} модулів: у стрінгах <b class="num">${nf(S.st.n)}</b>, на освітлення ${S.lit.n}</span><span>за рік <b class="num">${nf(S.st.mwh,1)} МВт·год</b> у мережу</span>`; };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('.r28tg'); if(b){ state.lay.r28=b.dataset.t; apply(); save(); } });
window.__twin.r28={D,VG,G28,ON}; apply();
} }
