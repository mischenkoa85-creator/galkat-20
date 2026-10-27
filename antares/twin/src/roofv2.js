// ================= Дах цеху за розрізом 1-1 (27.10.2026) і модулі на ліхтарях — src/roofv2.js, дані ROOFV2 (calc/v2/twin_v2_export.py)
// Покрівля — грані по ≈3 м за DWG замовника (ендови +15,90, гребені 17,66 і 18,15). Два сценарії ліхтаря, поки його не обміряно:
//  Б (типово) — ліхтар 3,40 × 1,74 м за РП, модулі книжково рівно по схилах (запит власника 27.10, 07:52); дах 1 782 модулі;
//  А — ліхтар 2,87 м за розрізом, гребінь 1,5 м (оцінка), «доміки» над ліхтарем (07:29); дах 1 936 модулів.
// Сонце: тіні (західна будівля, ліхтарі, парапети, рама кондиціонерів, сходи) і потужність цих модулів, дуги сонця за сезонами з годинами.
{
const R2=ROOFV2, SC=Object.assign({A:R2.A,B:R2.B},R2.C?{C:R2.C,D:R2.D,E:R2.E}:{}), LM=2.384, DM=1.303;
const LFD=(R2.V3&&R2.V3.lanf)||{}; const LF={};   // v3 · ліхтарі розібрати → каркас 13° або 22°, модулі вертикально (lanfdata.js ← calc/v3/lanf_twin_export.py, 27.10 вечір)
const LK=k=>'CDE'.includes(k)?'C':k;   // C, D, E — один ліхтар (v3, за рулеткою 27.10), різні варіанти розкладки А / Б / В
const SLAB={A:'«ліхтар 2,87»',B:'«ліхтар 3,40»',C:'v3 · А (усі місця)',D:'v3 · Б (від 1 050 кВт·год/м²)',E:'v3 · В (від 1 100 кВт·год/м²)'};
const LTXT={A:'ліхтар 2,87 за розрізом',B:'ліхтар 3,40 × 1,74 за РП',C:'ліхтар 3,66 × 1,89 за рулеткою, дефлектори за супутником'};
if(state.lay.v2===undefined) state.lay.v2=true; if(!state.lay.lanSc||(SC.C&&!state.lay.v3seen)){ state.lay.lanSc=SC.C?'C':'B'; if(SC.C) state.lay.lanMods=false; state.lay.v3seen=true; }   // v3: ліхтарі світлопрозорі — модулі на них лише за рішенням власника if(state.lay.lanMods===undefined) state.lay.lanMods=true;
const LFL={'12':'за фото','17':'на око'}, LF0=LFD['12']?12:+Object.keys(LFD)[0]||0;   // 27.10, 23:08: власник — каркас 3,0 м, кутники 16–18° на око; за 4 фото — ≈12°
if(state.lay.lanF===undefined) state.lay.lanF=state.lay.lan13?13:0;
if(LF0&&(!state.lay.v36seen||!LFD[state.lay.lanF]&&state.lay.lanF)){ state.lay.lanSc='C'; state.lay.lanF=LF0; state.lay.lanMods=false; state.lay.v36seen=true; }   // кути 13°/22° замінено на 12° (фото) і 17° (на око власника)
const sc=()=>SC[state.lay.lanSc]&&!(SC.C&&'AB'.includes(state.lay.lanSc))?state.lay.lanSc:(SC.C?'C':'B');   // ранкові сценарії 27.10 (ліхтар 3,40 і 2,87 · «домік») замінено обмірами v3 — у двійнику більше не показуємо
const V2ON=()=>state.proj==='ours'&&!!state.lay.v2&&['pz','sun'].includes(effSec())&&!state.lay.rad;
const LFK=()=>(V2ON()&&sc()==='C'&&LF[state.lay.lanF])?String(state.lay.lanF):'';   // активний каркас: '13', '22' або ''
const L13ON=()=>!!LFK();
const RG=grp('roofv2',G.ours), LG=grp('lanv2',G.site);
const SUNV2=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5,metalness:0.1});
// ---------- старі ліхтарі-коробки і вентиляцію (прибрано 26.10) ховаємо; тіні вентиляції не рахуємо
G.site.children.filter(o=>o.material===MAT.lan||o.material===MAT.obs).forEach(o=>o.visible=false); OBSC.length=0;
// ---------- перешкоди для тіней (як у розрахунку calc/v2/roof_v2.py)
{ const AC=S.ac||{x0:67.2,x1:69.6,y0:6.5,y1:21,h:2.2}, zA=Math.max(roofZ(AC.x0),roofZ(AC.x1)); OBX.push([-12.15,-0.15,-0.5,96.59,0,HV+6.8],[AC.x0,AC.x1,AC.y0,AC.y1,Math.min(roofZ(AC.x0),roofZ(AC.x1))-0.1,zA+AC.h],[58.4,65.6,-2.45,-0.5,0,19.8],[110,124,-5,26,0,13.2],
  [66,71,-2.7,-0.95,0,2.4],[55.9,58.35,-3.2,-0.75,0,2.6],[42.6,46.6,-3.3,-0.9,0,2.6],[79.5,85.5,-2.3,-0.5,0,3.7],[25.6,31.4,96.59,98.2,0,4.6]);
  if(BS) BS.K.forEach(k=>OBX.push([k.box[0],k.box[1],k.box[2],k.box[3],0,3.2])); }
// ---------- ліхтарі обох сценаріїв (двосхилі, фото 123334, 123924, 123951)
const lanM=std(0xe6ebe2,{metalness:0.05,roughness:0.25,transparent:true,opacity:0.6,depthWrite:false}), lanE=std(0x9da3a6,{roughness:0.8});   // схили — світлопрозорий полікарбонат (фото 27.10)
const fnL=(...ids)=>ids.map(id=>FOTO.p.findIndex(p=>p[0]===id)+1).filter(n=>n>0).join(', ');
const LANO={A:[],B:[],C:[]};
['A','B'].concat(SC.C?['C']:[]).forEach(k=>SC[k].lan.forEach((l,i)=>{ const [x0,x1,y0,y1,zb,h]=l, xc=(x0+x1)/2, z0=Math.min(roofZ(x0),roofZ(x1))-0.3;
  const shp=new THREE.Shape([new THREE.Vector2(x0,z0),new THREE.Vector2(x1,z0),new THREE.Vector2(x1,zb),new THREE.Vector2(xc,zb+h),new THREE.Vector2(x0,zb)]);
  const o=mesh(new THREE.ExtrudeGeometry(shp,{depth:y1-y0,bevelEnabled:false}),[lanE,lanM],LG); o.position.z=-y1; LANO[k].push(o);
  o.userData.info={t:`Світловий ліхтар ${i+1} — ${k==='C'?'за рулеткою 27.10: 3,66 × 1,89 м':k==='B'?'за РП: 3,40 × 1,74 м':'за розрізом 1-1: 2,87 м, гребінь ≈1,5 м (оцінка)'}`,
    d:`${nf(x1-x0,2)} × ${nf(y1-y0,1)} м, гребінь на ${nf(h,2)} м над основою (+${nf(zb+h,2)}), схили ${nf(Math.atan2(h,(x1-x0)/2)/D2R,0)}°. ${k==='B'?'На розрізі 1-1 у цьому місці — плита 2,87 м: ймовірно, отвір, а ліхтар ширший (центри РП і розрізу розходяться на 0,03–0,46 м). ':''}Обміри 27.10 (рулетка, фото № ${fnL('111904','111907','111925')}): гребінь ≈1,89 м над покрівлею, по низу ≈3,66 м — ${k==='C'?'розрахунок v3 — саме за цими обмірами':`у цьому сценарії — ${k==='B'?'3,40 × 1,74':'2,87 × 1,5'}`}. Схили — світлопрозорий полікарбонат в алюмінієвих профілях, під ліхтарем сітка (фото № ${fnL('111955','112136','112235','112242')}): модулі на ліхтарях затінять цех. Щипці — сталевий лист.`}; PICK.push({o}); }));
function setLanGeo(){ const k=V2ON()?sc():'B', S=SC[k], dm=k==='A'&&V2ON()&&state.lay.lanMods, l13=L13ON();
  Object.keys(LANO).forEach(q=>LANO[q].forEach(o=>o.visible=LK(k)===q&&!l13));
  LANG.length=0; S.lan.forEach((l,i)=>{ const L={xc:(l[0]+l[1])/2,hw:(l[1]-l[0])/2,y0:l[2],y1:l[3],zb:l[4],h:l[5]};
    if(dm){ const g=S.dom.geo[i], t=Math.tan(S.dom.th*D2R); L.dm={zr:g.zr+0.033,hw:S.dom.hs+0.01,t}; L.y0=Math.min(L.y0,g.y0); L.y1=Math.max(L.y1,g.y0+g.n*1.325); }
    if(l13){ const D=LFD[LFK()], f=D.F[i]; L.hw=D.hw; L.zb=f[4]+0.14; L.h=D.hw*Math.tan(D.tilt*D2R); L.y0=f[1]; L.y1=f[2]; }   // каркас 13° + рейка 0,12 + модуль — як DSM у calc/v3/lan22.py
    LANG.push(L); });
  ZTOP=Math.max(...LANG.map(L=>Math.max(L.zb+L.h,L.dm?L.dm.zr:0)))+0.6; }
// ---------- модулі даху на гранях (книжково вздовж будівлі, по 2 на грань)
function modM(xa,xb,y,lift,th){ const za=roofZ(xa)+0.12, zb=roofZ(xb)+0.12, ang=Math.atan2(zb-za,xb-xa), L=Math.hypot(xb-xa,zb-za)-0.02;
  _q.setFromAxisAngle(ZA,ang); const up=new V3(-Math.sin(ang),Math.cos(ang),0);
  _p.copy(W((xa+xb)/2,y,(za+zb)/2)).addScaledVector(up,0.0165+lift); _M.compose(_p,_q,_s.set(L-(lift?0.1:0),th,LM-0.02-(lift?0.1:0))); return _M; }
const RCOL={shade:0xb4461b,ac:0x7a3fa0,portal:0x7a3fa0,door:0x7a3fa0,exit:0x7a3fa0,str:0xc9781c,defl:0x6b4a2e,thr:0x8f9aa1};
const WHY={shade:'тінь понад 15 % за рік (західна будівля, ліхтар, рама кондиціонерів, сусідні грані)',ac:'рама кондиціонерів 14,5 × 2,4 м + 1 м для обслуговування або прохід від виходу на дах до рами',portal:'стійки сталевого порталу на південному краї',door:'прохід від дверей західної будівлі',str:'найслабше місце — прибрано, щоб модулі ділились на стрінги по 11',exit:'вихід на дах і портал (X 62–70 — за фото й супутником, уточнити) або прохід від виходу до рами',defl:'дефлектор, «грибок» або труба на даху + 0,3 м (за супутником Google і РП)',thr:'опромінення нижче порогу цього варіанта — у варіанті не ставимо'};
const rmMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.55,depthWrite:false});
const RM={};   // RM[k] = {ok:[], rem:[], im, rim, grp}
Object.keys(SC).forEach(k=>{ const S=SC[k], g=grp('v2r'+k,RG), ok=S.mods.filter(m=>m[3]==='ok'), rem=S.mods.filter(m=>RCOL[m[3]]);
  const im=inst(BOX,MAT.pvPo,ok.length,g); ok.forEach((m,i)=>{ im.setMatrixAt(i,modM(m[0],m[1],m[2],0,0.033)); im.setColorAt(i,white); }); im.instanceMatrix.needsUpdate=true;
  const rg=grp('v2rr'+k,g), rim=inst(BOX,rmMat,rem.length,rg,false); rem.forEach((m,i)=>{ rim.setMatrixAt(i,modM(m[0],m[1],m[2],0.03,0.02)); rim.setColorAt(i,new THREE.Color(RCOL[m[3]])); }); rim.instanceMatrix.needsUpdate=true;
  const B=S.base, tot=`Дах цеху ${LK(k)==='C'?`${SLAB[k]}`:k==='B'?'(ліхтар 3,40 × 1,74 за РП)':'(ліхтар 2,87 за розрізом 1-1)'}: ${nf(B.n)} модулів = ${B.st} стрінгів × 11, ${nf(B.kwp,1)} кВтп, ${nf(B.mwh,1)} МВт·год за рік (${nf(B.y)} кВт·год/кВтп)${B.mism!=null?`, з втратами на різну освітленість у стрінгах (−${nf(B.mism,2)} %)`:''}.`;
  im.userData.info=i=>{ const m=ok[i]; return {t:`Модуль даху · ${SLAB[k]}${m[7]!=null&&m[7]>=0?` · стрінг ${m[7]+1}`:''}`,d:`На грані покрівлі, книжково вздовж будівлі, 0,12 м над покрівлею. ≈${nf(m[4])} кВт·год за рік (${nf(m[4]/0.73)} на 1 кВтп), тінь забирає ${nf(m[5]||0,1)} %${m[6]!=null?`; опромінення площини модуля ${nf(m[6])} кВт·год/м²`:''}. ${tot}`}; };
  rim.userData.info=i=>{ const m=rem[i]; return {t:`Прибрано: ${WHY[m[3]]}`,d:`${m[4]!=null?`Тут модуль дав би ≈${nf(m[4]||0)} кВт·год за рік${m[5]!=null?` (тінь ${nf(m[5],1)} %)`:''}${m[6]!=null?`, опромінення ${nf(m[6])} кВт·год/м²`:''}. `:''}${tot}`}; };
  PICK.push({o:im,when:()=>g.visible},{o:rim,when:()=>rg.visible});
  RM[k]={ok,rem,im,rim,g,rg}; });
// ---------- А: «доміки» над ліхтарями 2,87 (два модулі книжково сходяться над гребенем, винос 0,10 м)
const DG=grp('v2dA',RG), DA=SC.A.dom, thA=DA.th*D2R, cA=Math.cos(thA), sA=Math.sin(thA);
const dmods=DA.mods, dIm=inst(BOX,MAT.pvL,dmods.length,DG);
function domM(m,lift){ const g=DA.geo[m[0]-1], sg=m[1]==='E'?1:-1, u=LM/2; _q.setFromAxisAngle(ZA,-sg*thA);
  _p.set(g.xc+sg*(0.01+u*cA+0.0165*sA),g.zr-u*sA+0.0165*cA+lift,-(m[2]+DM/2)); _M.compose(_p,_q,_s.set(LM-0.01,0.033,DM-0.02)); return _M; }
dmods.forEach((m,i)=>{ dIm.setMatrixAt(i,domM(m,0)); dIm.setColorAt(i,m[5]?white:lin(0xe0a040)); }); dIm.instanceMatrix.needsUpdate=true;
{ const seg=[], posts=[];
  DA.geo.forEach(g=>{ const y0=g.y0-0.05, y1=g.y0+g.n*1.325+0.05; [-1,1].forEach(sg=>{ [0.54,LM-0.54].forEach(u=>seg.push([g.xc+sg*(0.01+u*cA-0.05*sA),g.zr-u*sA-0.05*cA,y0,y1]));
      const xp=g.xc+sg*DA.hs; for(let y=y0+0.1;y<=y1;y+=2.65) posts.push([xp,y,roofZ(xp),g.zr-LM*sA-0.04]); }); });
  const fr=inst(BOX,MAT.zn,seg.length,DG); seg.forEach(([x,z,y0,y1],i)=>{ _M.compose(_p.set(x,z,-(y0+y1)/2),QI,_s.set(0.041,0.041,y1-y0)); fr.setMatrixAt(i,_M); }); fr.instanceMatrix.needsUpdate=true;
  const ps=inst(BOX,MAT.zn,posts.length,DG); posts.forEach(([x,y,z0,z1],i)=>{ _M.compose(_p.set(x,(z0+z1)/2,-y),QI,_s.set(0.08,Math.max(0.05,z1-z0),0.08)); ps.setMatrixAt(i,_M); }); ps.instanceMatrix.needsUpdate=true;
  const K=DA.K, t=`«Доміки» над 4 ліхтарями 2,87 м: ${K.places} місць, ${K.n} модулів = ${K.st} стрінги, ${nf(K.kwp,1)} кВтп, ${nf(K.mwh,1)} МВт·год (схід ${nf(K.E)}, захід ${nf(K.W)} кВт·год/кВтп); модулі даху від їхньої тіні −${nf(K.roof_loss,1)} → чистими +${nf(K.net,1)}. Кут ${nf(K.tilt,1)}°, гребінь на ${nf(K.ridge,2)} м над основою ліхтаря.`;
  dIm.userData.info=i=>{ const m=dmods[i]; return {t:`«Домік» над ліхтарем ${m[0]}: схил на ${m[1]==='E'?'схід':'захід'} ${nf(K.tilt,0)}°${m[5]?'':' · поза стрінгами'}`,d:`Книжково, верхній край біля гребеня «доміку». ≈${nf(m[3])} кВт·год за рік (${nf(m[3]/0.73)} на 1 кВтп), тінь ${nf(m[4],1)} %.${m[5]?'':' Не входить у стрінг по 11 — на освітлення напряму (ідея власника 07:41).'} ${t}`}; };
  fr.userData.info={t:'Рама «доміку» — схема',d:`2 рейки на схил уздовж ліхтаря, стійки по краях ліхтаря через ≈2,65 м до ферм / плит (не до ліхтаря). Вітер на «домік» ≈2 м на +19,6 м і сніг, що з'їжджає на модулі даху, — перевірити в КМ. ${t}`}; ps.userData.info=fr.userData.info;
  PICK.push({o:dIm,when:()=>DG.visible},{o:fr,when:()=>DG.visible}); }
// ---------- Б: книжково рівно по схилах ліхтаря 3,40 × 1,74 (верхні краї біля гребеня, нижні — біля основи)
const FL={}; ['B'].concat(SC.C?['C']:[]).forEach(FK=>{ const FG2=grp('v2f'+FK,RG), FB=SC[FK].flush, thB=FB.th*D2R, cB=Math.cos(thB), sB=Math.sin(thB);
const fmods=FB.mods, fIm=inst(BOX,MAT.pvL,fmods.length,FG2), lzB=l=>{ const L=SC[FK].lan[l-1]; return [(L[0]+L[1])/2,L[4],L[5]]; };
function flM(m){ const [xc,zb,h]=lzB(m[0]), sg=m[1]==='E'?1:-1, sa=0.02+LM/2, o=0.12+0.0165; _q.setFromAxisAngle(ZA,-sg*thB);
  _p.set(xc+sg*(sa*cB+o*sB),zb+h-sa*sB+o*cB,-(m[2]+DM/2)); _M.compose(_p,_q,_s.set(LM-0.01,0.033,DM-0.02)); return _M; }
fmods.forEach((m,i)=>{ fIm.setMatrixAt(i,flM(m)); fIm.setColorAt(i,m[5]?white:lin(0xe0a040)); }); fIm.instanceMatrix.needsUpdate=true;
{ const seg=[]; SC[FK].lan.forEach((l,li)=>{ const ms=fmods.filter(m=>m[0]===li+1); if(!ms.length) return; const [xc,zb,h]=lzB(li+1), y0=Math.min(...ms.map(m=>m[2]))-0.05, y1=Math.max(...ms.map(m=>m[2]))+DM+0.05;
    [-1,1].forEach(sg=>[0.02+0.54,0.02+LM-0.54].forEach(sa=>seg.push([xc+sg*(sa*cB+0.06*sB),zb+h-sa*sB+0.06*cB,y0,y1]))); });
  const fr=inst(BOX,MAT.zn,seg.length,FG2); seg.forEach(([x,z,y0,y1],i)=>{ _M.compose(_p.set(x,z,-(y0+y1)/2),QI,_s.set(0.041,0.041,y1-y0)); fr.setMatrixAt(i,_M); }); fr.instanceMatrix.needsUpdate=true;
  const K=FB.K, t=`Книжково по схилах 4 ліхтарів ${FK==='C'?'3,66 × 1,89 (рулетка 27.10; схили світлопрозорі — цех стане темнішим)':'3,40 × 1,74 (РП)'}: ${K.places} місць, ${K.n} модулів = ${K.st} стрінги, ${nf(K.kwp,1)} кВтп, ${nf(K.mwh,1)} МВт·год (схід ${nf(K.E)}, захід ${nf(K.W)} кВт·год/кВтп); модулі даху від їхньої тіні −${nf(K.roof_loss,1)} → чистими +${nf(K.net,1)}. ${K.left} модулів поза стрінгами (${nf(K.left_mwh,1)} МВт·год) — на освітлення під ліхтарем.`;
  fIm.userData.info=i=>{ const m=fmods[i]; return {t:`Модуль на схилі ліхтаря ${m[0]}: на ${m[1]==='E'?'схід':'захід'} ${nf(FB.th,0)}°${m[5]?'':' · поза стрінгами'}`,d:`Книжково, 0,12 м над схилом; верхній край — на 20 мм від гребеня, унизу лишається ${FK==='C'?'≈0,23 м':'29 мм'}. ≈${nf(m[3])} кВт·год за рік (${nf(m[3]/0.73)} на 1 кВтп), тінь ${nf(m[4],1)} %.${m[5]?'':' Не входить у стрінг по 11 — на світлодіоди під ліхтарем напряму (ідея власника 07:41).'} ${t}`}; };
  fr.userData.info={t:'Рейки на схилі ліхтаря — схема',d:`2 рейки на схил горизонтально вздовж ліхтаря (поперек довгої сторони модуля, як в інструкції ZNSHINE), притиски на довгих сторонах на 540 мм від кінців. Кріплення — до каркаса ліхтаря або його опорної рами; чи витримає каркас — немає в даних. Кут 46° — погодити з ZNSHINE. ${t}`};
  PICK.push({o:fIm,when:()=>FG2.visible},{o:fr,when:()=>FG2.visible}); }
  FL[FK]={FG2,FB,fmods,fIm}; });
const FLK=k=>FL[LK(k)]||FL.B;

// ---------- v3 · ліхтарі розібрати → нова покрівля на сталевому каркасі 13° або 22°, модулі вертикально по 1 ряду на схил (calc/v3/lan13_mount.py, lanf_twin_export.py)
if(SC.C) Object.keys(LFD).forEach(TK=>{ const L13D=LFD[TK]; const G13=grp('v2lf'+TK,RG), Gg=grp('v2lfg'+TK,G13), th=L13D.tilt*D2R, c=Math.cos(th), s=Math.sin(th), K=L13D.K, MT=L13D.mount, FR=L13D.F, STR=L13D.strings;
  const roofM=std(0x6f777c,{roughness:0.9}), endM=std(0x9da3a6,{roughness:0.8});
  const T=`Ліхтарі розібрати, на каркасі ≈${nf(L13D.tilt,0)}° — ${nf(K.n)} модулів = ${K.st} стрінги по 11, ${nf(K.kwp,2)} кВтп, ${nf(K.mwh,1)} МВт·год за рік (${nf(K.y)} кВт·год/кВтп, тінь −${nf((1-K.mwh/K.un)*100,1)} %). Стрінг — 11 сусідніх модулів одного схилу одного ліхтаря, без кабелів між ліхтарями; по 1 щиту PV 7/1 біля торця ліхтаря. Дах цеху з нижчими ліхтарями — ${nf(K.roof,1)} МВт·год (+${nf(K.roof-SC.C.sum.mwh,1)}).`;
  const ANG=`Кут кутників каркаса: за 4 фото зсередини ≈12° (№ ${fnL('112235','112237','112242','112246')}: 11,6–13,1° на обох схилах; скло ліхтаря на тих самих фото — 47–48°), власник на око — 16–18°; тут — ${nf(L13D.tilt,0)}°. Ширина каркаса по низу — ${nf(2*L13D.mount.frame_half,1)} м (власник), гребінь каркаса на ${nf(L13D.mount.frame_rise,2)} м вище низу. Від кута ці модулі дають ${Object.keys(LFD).map(q=>`${q}° — ${nf(LFD[q].K.mwh,1)}`).join(', ')} МВт·год за рік — виміряти рівнем.`;
  FR.forEach((f,i)=>{ const [xc,y0,y1,zb,ze,zr]=f, hw=L13D.mount.frame_half||1.5, x0=xc-hw, x1=xc+hw, z0=Math.min(roofZ(x0),roofZ(x1))-0.3, zr2=zr-0.02, ze2=zr2-hw*Math.tan(th);
    const shp=new THREE.Shape([new THREE.Vector2(x0,z0),new THREE.Vector2(x1,z0),new THREE.Vector2(x1,ze2),new THREE.Vector2(xc,zr2),new THREE.Vector2(x0,ze2)]);
    const o=mesh(new THREE.ExtrudeGeometry(shp,{depth:y1-y0,bevelEnabled:false}),[endM,roofM],G13); o.position.z=-y1;
    o.userData.info={t:`Ліхтар ${i+1}: скління знято, нова покрівля на каркасі ≈${nf(L13D.tilt,0)}°`,d:`Каркас по низу ${nf(x1-x0,1)} м, ${nf(y1-y0,1)} м уздовж; модулі з рейками — до ${nf(zr-zb+0.16,2)} м над покрівлею біля ліхтаря (зараз гребінь 1,89). Полікарбонат і дерев'яну конструкцію знімаємо, сталевий каркас лишається, зверху — нова покрівля прорізу (≈${nf(L13D.cost.area)} м² на 4 ліхтарі; ціни ще немає). ${ANG} Цех стане темнішим — освітлення замість ліхтарів окремо. ${T}`};
    PICK.push({o,when:()=>G13.visible}); });
  const use=L13D.mods.filter(m=>m[4]>=0), gh=L13D.mods.filter(m=>m[4]<0);
  const mM=(m,lift,tk)=>{ const f=FR[m[0]-1], sg=m[1]==='E'?1:-1, sa=0.02+LM/2, o=0.12+0.0165+lift; _q.setFromAxisAngle(ZA,-sg*th);
    _p.set(f[0]+sg*(sa*c+o*s),f[5]-sa*s+o*c,-(m[2]+DM/2)); _M.compose(_p,_q,_s.set(LM-0.01,tk||0.033,DM-0.02)); return _M; };
  const col=i=>white;
  const L13M=MAT.pvL.clone(), im=inst(BOX,L13M,use.length,G13); use.forEach((m,i)=>im.setMatrixAt(i,mM(m,0))); im.instanceMatrix.needsUpdate=true;   // колір екземплярів — лише в paintV2 (див. нижче)
  const gim=inst(BOX,rmMat,gh.length,Gg,false); gh.forEach((m,i)=>{ gim.setMatrixAt(i,mM(m,0.03,0.02)); gim.setColorAt(i,new THREE.Color(0x8f9aa1)); }); gim.instanceMatrix.needsUpdate=true;
  const seg=[]; MT.runs.forEach(([l,sd,y0,y1])=>{ const f=FR[l-1], sg=sd==='E'?1:-1; [0.02+L13D.cl,0.02+LM-L13D.cl].forEach(sa=>seg.push([f[0]+sg*(sa*c+0.06*s),f[5]-sa*s+0.06*c,y0-0.1,y1+0.1])); });
  const fr=inst(BOX,MAT.zn,seg.length,G13); seg.forEach(([x,z,y0,y1],i)=>{ _M.compose(_p.set(x,z,-(y0+y1)/2),QI,_s.set(0.041,0.041,y1-y0)); fr.setMatrixAt(i,_M); }); fr.instanceMatrix.needsUpdate=true;
  im.userData.info=i=>{ const m=use[i], S=STR[m[4]], sh=m[5]>0?(1-m[3]/m[5])*100:0; return {t:`Модуль на місці ліхтаря ${m[0]} · ${m[1]==='E'?'схід':'захід'} ${nf(L13D.tilt,0)}° · стрінг ${S[0]}`,
    d:`Вертикально (довгою стороною вгору по схилу), верхній край — біля гребеня, нижній виступає за край ліхтаря на ≈0,5 м. ≈${nf(m[3])} кВт·год за рік (${nf(m[3]/0.73)} на 1 кВтп), тінь ${nf(sh,1)} %. Стрінг ${S[0]}: ${S[2]} модулів${S[1].includes('+')?' — спільний схід + захід біля торця ліхтаря':''}, ${nf(S[3],2)} МВт·год, різна освітленість −${nf(S[4],1)} %. ${T}`}; };
  gim.userData.info=i=>{ const m=gh[i]; return {t:`Місце без модуля · ліхтар ${m[0]}, ${m[1]==='E'?'схід':'захід'}`,d:`Залишок ліхтаря не набирає стрінг по 11 (схід + захід разом) — щоб не тягнути кабелі між ліхтарями, місце лишаємо порожнім. Тут модуль дав би ≈${nf(m[3])} кВт·год за рік. Усього таких місць ${K.places-K.n}; якби об'єднати залишки між ліхтарями — ${nf(K.max.n)} модулів, ${nf(K.max.mwh,1)} МВт·год. ${T}`}; };
  fr.userData.info={t:`Рейки на каркасі ліхтаря — 2 на схил`,d:`Профіль 41×41 уздовж ліхтаря на ${nf(MT.up,2)} і ${nf(MT.lo,2)} м від осі (по горизонталі) — у зоні притисків ZNSHINE: 540 мм від торців модуля (дозволено 477–596). Рейок ${nf(MT.rail,1)} м (+5 % — 830 м), притисків середніх ${nf(MT.mid)}, кінцевих ${nf(MT.end)}, кронштейни до поперечних балок каркаса — крок 1,5 м до замірів. Якщо проліт каркаса ≈3,1 м — нижня рейка на коротких консолях ≈0,27 м. У кошторисі 27.10 — поз. 1.3.2, ${nf(L13D.cost.lan_mount)} $. ${ANG}`};
  PICK.push({o:im,when:()=>G13.visible},{o:gim,when:()=>Gg.visible},{o:fr,when:()=>G13.visible});
  LF[TK]={G13,Gg,use,gh,im,gim,fr,col,M:L13M,S:{K:{n:K.n,roof_loss:SC.C.sum.mwh-K.roof},sum:{mo:L13D.mo,un:K.un},l13:true,tilt:L13D.tilt}}; });
// ---------- сонце: геометрія модулів для тіней (та сама модель, що в розділі «Сонце»)
const BLDv=(x,y,z)=>[x,y,z];
function mkGeom(c,n,ha,hb){ const la=Math.hypot(...ha), lb=Math.hypot(...hb), A=la>=lb?ha:hb, B=la>=lb?hb:ha, s=[];
  [-0.75,-0.25,0.25,0.75].forEach(u=>[-0.5,0.5].forEach(v=>s.push(c.map((x,i)=>x+A[i]*u+B[i]*v+n[i]*0.012)))); return {qc:c,n,a:ha,b:hb,a2:la*la,b2:lb*lb,s}; }
const GV={roof:[],lan:[],fac:[],can:[]}, VS={roof:null,lan:null,fac:null,can:null}, FMAP=[], LIDX=[];   // LIDX: модуль на ліхтарі → індекс у GV.lan (−1 — поза стрінгами, на освітлення)
const FP=window.__twin.facpv||null;
function buildGV(){ const k=sc(); GV.roof=meshGeoms(RM[k].im,RM[k].ok.length); LIDX.length=0; GV.lan=[]; if(L13ON()){ const O=LF[LFK()]; GV.lan=meshGeoms(O.im,O.use.length); O.use.forEach((m,i)=>LIDX.push(i)); } else if(state.lay.lanMods){ const F=FLK(k), all=k==='A'?meshGeoms(dIm,dmods.length):meshGeoms(F.fIm,F.fmods.length), ms=k==='A'?dmods:F.fmods; ms.forEach((m,i)=>{ LIDX.push(m[5]?GV.lan.length:-1); if(m[5]) GV.lan.push(all[i]); }); }
  GV.fac=[]; GV.can=[]; FMAP.length=0;
  if(FP&&state.lay.fac25){ FACPV.vert.forEach((m,j)=>{ const [f,s,h,Wd,Hd]=m, sc_=s+Wd/2, hc=h+Hd/2;
      const c=f==='S'?[sc_,-0.5-0.10-0.035,hc]:[96.64+0.10+0.035,sc_,hc], n=f==='S'?[0,-1,0]:[1,0,0], ha=f==='S'?[Wd/2,0,0]:[0,Wd/2,0], hb=[0,0,Hd/2];
      GV.fac.push(mkGeom(c,n,ha,hb)); });
    GV.can=meshGeoms(FP.pc,FACPV.can.length); }
  Object.keys(VS).forEach(q=>VS[q]=new Float32Array(GV[q].length)); }
function litV2(g,set,d){ let lit=0; for(const o of g.s){ let hit;
    if(set==='roof'||set==='lan') hit=shopRoofHit(o,d)||OBX.some(b=>rayBox(o,d,b))||OBSC.some(c=>rayCyl(o,d,c));
    else hit=OBX.some(b=>rayBox(o,d,b))||TPB.some(b=>rayBox(o,d,b))||(set==='fac'&&GV.can.some(q=>quadHit(o,d,q)));
    if(!hit) lit++; } return lit/g.s.length; }
const CFG25={P:0.730,U:25,eta:0.235,L:LOSS};
const _sa=stepAll; const EMPTY=[];
stepAll=function(st,wx,store,acc,wt){ if(!V2ON()||acc) return _sa(st,wx,store,acc,wt);
  const keep=GEN.ours; GEN.ours=EMPTY; let r; try{ r=_sa(st,wx,store,acc,wt); } finally{ GEN.ours=keep; }
  const d=[st[1],st[2],st[3]], live=store===GSTATE, S={};
  ['roof','lan','fac','can'].forEach(q=>{ const L=GV[q], f=live?VS[q]:new Float32Array(L.length); L.forEach((g,i)=>{ f[i]=dot3(d,g.n)>0?litV2(g,q,d):0; }); S[q]=f; });
  const P=[powerStep(GV.roof,S.roof,st,wx,MCFG.ours),powerStep(GV.lan,S.lan,st,wx,sc()==='A'?CFG25:MCFG.ours),powerStep(GV.fac,S.fac,st,wx,MCFG.ours),powerStep(GV.can,S.can,st,wx,MCFG.whours)];
  const Pc=P.reduce((a,b)=>a+b.Pc,0), Po=P.reduce((a,b)=>a+b.Po,0), n=P.reduce((a,b)=>add4(a,b.n),[0,0,0,0]);
  r.ours={Pc:r.ours.Pc+Pc, Pa:r.ours.Pa+wx.p*Pc+(1-wx.p)*Po, n:add4(r.ours.n,n)};
  r.shop.ours=wx.p*(P[0].Pc+P[1].Pc)+(1-wx.p)*(P[0].Po+P[1].Po); return r; };
const _gn=genNow; genNow=function(){ const r=_gn(); if(V2ON()&&!wxStep(state.day,state.hour)){ Object.values(VS).forEach(a=>a&&a.fill(0)); const N=GV.roof.length+GV.lan.length+GV.fac.length+GV.can.length+GEN.wh.length; r.ours={Pc:0,Pa:0,n:[0,0,0,N]}; } return r; };
// фарбування: тінь зараз / тінь за рік (річні дані — розрахунок calc/v2)
function paintV2(on){ const k=sc(), yr=on&&state.lay.sunYear, R=RM[k];
  R.im.material=on?SUNV2:MAT.pvPo; const RSH=k==='C'&&LFK()&&LFD[LFK()].roofSh; R.ok.forEach((m,i)=>R.im.setColorAt(i,!on?white:yr?lcol((RSH?RSH[i]:(m[5]||0))/100):fcol(VS.roof[i]??1))); R.im.instanceColor.needsUpdate=true;   // «Тінь за рік»: при каркасі 13°/22° — річна тінь даху з calc/v3/shade_lan.py
  const im=k==='A'?dIm:FLK(k).fIm, ms=k==='A'?dmods:FLK(k).fmods; im.material=on?SUNV2:MAT.pvL;
  if(!L13ON()){ ms.forEach((m,i)=>im.setColorAt(i,!m[5]?(on?lin(0xc3c8cc):lin(0xe0a040)):!on?white:yr?lcol(m[4]/100):fcol(VS.lan&&LIDX[i]>=0?VS.lan[LIDX[i]]:1))); im.instanceColor.needsUpdate=true; }
  Object.keys(LF).forEach(q=>{ const O=LF[q], l=on&&LFK()===q; O.im.material=l?SUNV2:O.M; O.use.forEach((m,i)=>O.im.setColorAt(i,!l?O.col(i):yr?lcol(m[5]>0?1-m[3]/m[5]:0):fcol(VS.lan&&VS.lan[i]!=null?VS.lan[i]:1))); O.im.instanceColor.needsUpdate=true; });
  if(FP){ const f=FP; [f.pvL,f.pvP,f.pc].forEach(o=>{ if(o) o.material=on&&!yr?SUNV2:(o===f.pvL?MAT.pvL:MAT.pvP); });
    if(f.IDX){ ['L','P'].forEach(t=>{ const o=t==='L'?f.pvL:f.pvP; f.IDX[t].forEach((k_,i)=>o.setColorAt(i,on&&!yr&&VS.fac&&VS.fac.length?fcol(VS.fac[k_]):white)); o.instanceColor.needsUpdate=true; });
      FACPV.can.forEach((m,i)=>f.pc.setColorAt(i,on&&!yr&&VS.can&&VS.can.length?fcol(VS.can[i]):white)); f.pc.instanceColor.needsUpdate=true; } }
  need=true; }
const _gp=genPaint; genPaint=function(on){ _gp(on); if(V2ON()||!on) paintV2(on&&V2ON()); };
// ---------- рік і потужність станції в режимі 27.10
const YR0=YR?JSON.parse(JSON.stringify({tot:YR.tot,mo:YR.mo})):null, KWP0=KWP.ours;
function v2Sum(){ const k=sc(), S=SC[k], L=L13ON()?LF[LFK()].S:state.lay.lanMods?(k==='A'?S.dom:S.flush):null, F=R2.fac, FT=F.tot;
  const roofLoss=L?L.K.roof_loss:0, rf=1-roofLoss/S.sum.mwh, moF=[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>(state.lay.fac25?(F.mo.S[i]+F.mo.Ev[i]+F.mo.Ec[i])/1000:0));
  const whMo=YR0?YR0.mo.ours.map((v,i)=>(v-YR0.mo.oursShop[i])/1000):Array(12).fill(0);
  const mo=S.sum.mo.map((v,i)=>v*rf+(L?L.sum.mo[i]:0)+moF[i]+whMo[i]), shopMo=S.sum.mo.map((v,i)=>v*rf+(L?L.sum.mo[i]:0));
  const n={roof:S.base.n,lan:L?L.K.n:0,fac:state.lay.fac25?FT.all.n:0,wh:GEN.wh.length};
  return {k,n,N:n.roof+n.lan+n.fac+n.wh,mo,shopMo,un:(S.sum.un+(L?L.sum.un:0))*1000+moF.reduce((a,b)=>a+b,0)*1000+whMo.reduce((a,b)=>a+b,0)*1000,roofLoss,L}; }
function yrApply(){ if(!YR0) return; Object.assign(YR.tot,YR0.tot); YR.mo.ours=YR0.mo.ours.slice(); YR.mo.oursShop=YR0.mo.oursShop.slice(); KWP.ours=KWP0;
  if(!V2ON()) return; const v=v2Sum(); YR.mo.ours=v.mo.map(x=>Math.round(x*1000)); YR.mo.oursShop=v.shopMo.map(x=>Math.round(x*1000));
  YR.tot.ours=YR.mo.ours.reduce((a,b)=>a+b,0); YR.tot.oursShop=YR.mo.oursShop.reduce((a,b)=>a+b,0); YR.tot.oursUn=Math.round(v.un); KWP.ours=+(v.N*0.73).toFixed(2); }
// ---------- дуги сонця за сезонами з годинами (Київ; вісь Y будівлі — азимут 4°)
const SPG=new THREE.Group(); scene.add(SPG); const SPC=[0xd08a1a,0xe8b23a,0xc77a2a,0x6f8fb3];
function skyPt(day,h,R){ const s=sunPos(DAYS[day][1],DAYS[day][2],h); if(s.alt<=0) return null; const e=Math.sin(s.az)*Math.cos(s.alt), nn=Math.cos(s.az)*Math.cos(s.alt), sx=e*Math.cos(4*D2R)-nn*Math.sin(4*D2R), sy=e*Math.sin(4*D2R)+nn*Math.cos(4*D2R);
  return sun.target.position.clone().addScaledVector(new V3(sx,Math.sin(s.alt),-sy).normalize(),R); }
const HLAB={};
function hourSprite(t,col){ const key=t+col; if(!HLAB[key]) HLAB[key]=new THREE.SpriteMaterial({map:labelTex([t],256,96,col,'rgba(255,255,255,0.85)'),depthTest:false,transparent:true}); const sp=new THREE.Sprite(HLAB[key]); sp.material.sizeAttenuation=false; sp.scale.set(0.068,0.026,1); sp.renderOrder=5; return sp; }
const dotG=new THREE.SphereGeometry(1.1,10,8);
drawSunPath=function(){ if(sunPath){ scene.remove(sunPath); sunPath.geometry.dispose(); sunPath=null; }
  while(SPG.children.length){ const o=SPG.children.pop(); if(o.geometry&&o.geometry!==dotG) o.geometry.dispose(); }
  const SUN=effSec()==='sun';
  DAYS.forEach((dd,di)=>{ const cur=di===state.day; if(!cur&&!SUN) return; const pts=[]; for(let h=3;h<=22;h+=1/6){ const p=skyPt(di,h,175); if(p) pts.push(p); }
    if(pts.length<2) return; const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),cur?new THREE.LineDashedMaterial({color:SPC[di],dashSize:4,gapSize:3}):new THREE.LineBasicMaterial({color:SPC[di],transparent:true,opacity:0.45}));
    if(cur) ln.computeLineDistances(); SPG.add(ln);
    if(SUN){ for(let h=4;h<=21;h++){ const p=skyPt(di,h,175); if(!p) continue; const dot=new THREE.Mesh(dotG,new THREE.MeshBasicMaterial({color:SPC[di],transparent:!cur,opacity:cur?1:0.5})); dot.position.copy(p); SPG.add(dot);
        if(cur&&h%3===0){ const sp=hourSprite(h+':00','#7a4a08'); sp.position.copy(p).add(new V3(0,4,0)); SPG.add(sp); } }
      const sp=hourSprite(dd[0],'#'+new THREE.Color(SPC[di]).getHexString()), nn=skyPt(di,12.2+(kyivOffset(2026,dd[1],dd[2])-2),175); if(nn){ sp.position.copy(nn).add(new V3(0,9,0)); SPG.add(sp); } } }); need=true; };
// ---------- шлях сонця в панелі: схід, полудень, захід за сезонами; полярна діаграма з горизонтом точки біля західної стіни
function dayInfo(di){ const dd=DAYS[di]; let rise=null,set=null,noon=null,mx=-1; for(let h=3;h<=22;h+=1/60){ const s=sunPos(dd[1],dd[2],h); if(s.alt>0){ if(rise===null) rise={h,az:s.az}; set={h,az:s.az}; } if(s.alt>mx){ mx=s.alt; noon={h,alt:s.alt,az:s.az}; } } return {rise,set,noon,len:set&&rise?set.h-rise.h:0}; }
const DINFO=DAYS.map((d,i)=>dayInfo(i));
const HORPT=[3.5,48];
const HORZ=(()=>{ const out=[], o=[HORPT[0],HORPT[1],roofZ(HORPT[0])+0.3]; for(let a=0;a<360;a+=5){ const az=a*D2R, bx=Math.sin(az)*Math.cos(4*D2R)-Math.cos(az)*Math.sin(4*D2R), by=Math.sin(az)*Math.sin(4*D2R)+Math.cos(az)*Math.cos(4*D2R); let mx=0;
    for(let t=0.5;t<=140;t+=0.5){ const X=o[0]+bx*t, Y=o[1]+by*t; let z=-1; if(X>=SHOP[0]&&X<=SHOP[1]&&Y>=SHOP[2]&&Y<=SHOP[3]) z=roofSurf(X,Y); for(const b of OBX) if(X>=b[0]&&X<=b[1]&&Y>=b[2]&&Y<=b[3]) z=Math.max(z,b[5]); if(z>o[2]) mx=Math.max(mx,Math.atan2(z-o[2],t)); } out.push(mx); } return out; })();
function polarSVG(){ const S=300,c=S/2,R=128, P=(az,alt)=>{ const r=R*(1-alt/(Math.PI/2)); return [c+r*Math.sin(az),c-r*Math.cos(az)]; };
  let g=`<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="var(--line)"/>`+[30,60].map(a=>`<circle cx="${c}" cy="${c}" r="${R*(1-a/90)}" fill="none" stroke="var(--line)" stroke-dasharray="2 3"/><text x="${c+3}" y="${c-R*(1-a/90)+11}" font-size="9" fill="var(--ink-3)">${a}°</text>`).join('');
  [['Пн',0],['Сх',90],['Пд',180],['Зх',270]].forEach(([t,a])=>{ const [x,y]=P(a*D2R,-0.12); g+=`<text x="${x}" y="${y+3}" text-anchor="middle" font-size="10" fill="var(--ink-3)">${t}</text>`; });
  { const hp=HORZ.map((h,i)=>P(i*5*D2R,h)); hp.push(hp[0]); const op=[]; for(let a=360;a>=0;a-=5) op.push(P(a*D2R,0));
    g+=`<path d="${hp.concat(op).map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join('')}Z" fill="rgba(110,120,130,0.28)" stroke="none"/><path d="${hp.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join('')}" fill="none" stroke="#7b8790" stroke-width="1"/>`; }
  DAYS.forEach((dd,di)=>{ const pts=[]; for(let h=3;h<=22;h+=1/6){ const s=sunPos(dd[1],dd[2],h); if(s.alt>0) pts.push(P(s.az,s.alt)); }
    const col='#'+new THREE.Color(SPC[di]).getHexString(); g+=`<path d="${pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join('')}" fill="none" stroke="${col}" stroke-width="${di===state.day?2.6:1.3}" opacity="${di===state.day?1:0.65}"/>`;
    for(let h=5;h<=20;h++){ const s=sunPos(dd[1],dd[2],h); if(s.alt<=0) continue; const [x,y]=P(s.az,s.alt); g+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${di===state.day?2.4:1.6}" fill="${col}"/>`;
      if(di===state.day&&h%3===0) g+=`<text x="${(x+5).toFixed(1)}" y="${(y-4).toFixed(1)}" font-size="9.5" fill="var(--ink-2)">${h}</text>`; } });
  { const [x,y]=SUNNOW.alt>0?P(SUNNOW.az,SUNNOW.alt):[c,c]; g+=`<circle id="pSun" cx="${x}" cy="${y}" r="6" fill="#ffc94a" stroke="#b07a00" style="${SUNNOW.alt>0?'':'display:none'}"/>`; }
  return `<svg class="gchart" viewBox="0 0 ${S} ${S}" style="max-width:300px" role="img" aria-label="Шлях сонця над Антаресом за сезонами, з горизонтом точки на даху біля західної стіни">${g}</svg>`; }
function sunPathBlock(){ const rows=DAYS.map((dd,i)=>{ const D=DINFO[i]; return `<tr${i===state.day?' class="tot"':''}><td>${dd[0]} · ${SEASN[i].toLowerCase()}</td><td>${hhmm(D.rise.h)} · ${nf(D.rise.az/D2R,0)}°</td><td>${hhmm(D.noon.h)} · <b>${nf(D.noon.alt/D2R,1)}°</b></td><td>${hhmm(D.set.h)} · ${nf(D.set.az/D2R,0)}°</td><td>${nf(Math.floor(D.len))} год ${nf(Math.round((D.len%1)*60))} хв</td></tr>`; }).join('');
  const wmax=Math.max(...HORZ.slice(45,63))/D2R;
  return `<div class="blk" id="sunpath"><h3>Як іде сонце над Антаресом</h3><div>${polarSVG()}</div>
   <div class="plg">${DAYS.map((d,i)=>`<span><i style="background:#${new THREE.Color(SPC[i]).getHexString()}"></i>${d[0]}</span>`).join('')}<span><i style="background:rgba(110,120,130,0.4)"></i>горизонт з даху біля західної стіни</span></div>
   <table class="cmp"><thead><tr><th>День</th><th>Схід · азимут</th><th>Полудень · висота</th><th>Захід · азимут</th><th>День триває</th></tr></thead><tbody>${rows}</tbody></table>
   <p class="src">Київ, 50,46° пн. ш.; час — київський (літній з останньої неділі березня). Азимут від півночі за годинниковою стрілкою; будівля повернута на 4°: торці дивляться на південь і північ, схили граней — на схід і захід. Сіра зона — що закриває небо з точки на даху за 4 м від західної стіни: будівля за нею піднімається до ${nf(wmax,0)}° на заході, тому сонце після обіду ховається там раніше, ніж за обрій, — через це 4 колонки біля стіни прибрано. На моделі дуги чотирьох днів, крапки — щогодини, підписи — через 3 години.</p></div>`; }
const _su=sunUI; sunUI=function(){ _su(); const el=document.getElementById('pSun'); if(!el) return; if(SUNNOW.alt>0){ const r=128*(1-SUNNOW.alt/(Math.PI/2)); el.setAttribute('cx',(150+r*Math.sin(SUNNOW.az)).toFixed(1)); el.setAttribute('cy',(150-r*Math.cos(SUNNOW.az)).toFixed(1)); el.style.display=''; } else el.style.display='none'; };
const _ps=panelSun; panelSun=function(){ let h=_ps(); const T=state.sunTab||'day';
  if(V2ON()){ const v=v2Sum(), K=v.L&&v.L.K;
    const blk=`<div class="blk"><h3>Наш Б · дах за розрізом 1-1 (27.10)</h3><p class="src">У «Сонці» — модулі 27.10: дах ${nf(v.n.roof)} (${LTXT[LK(v.k)]}${LK(v.k)==='C'?`, ${SLAB[v.k]}`:''})${v.n.lan?`, ${v.L&&v.L.l13?`на місці ліхтарів ${nf(v.n.lan)} (каркас ${nf(v.L.tilt,0)}°, вертикально)`:`на ліхтарях ${nf(v.n.lan)} (${v.k==='A'?'«доміки»':'книжково по схилах'})`}`:''}${v.n.fac?`, фасади ${nf(v.n.fac)}`:''}, склад ${nf(v.n.wh)} — разом ${nf(v.N)} модулів, ${nf(v.N*0.73,1)} кВтп. Тіні рахуються наживо: західна будівля, ліхтарі, парапети, рама кондиціонерів, сходи, козирок над вертикальними модулями сходу. «За рік» — з розрахунку ${LK(v.k)==='C'?'v3 (calc/v3, 27.10, вечір)':`27.10 (calc/v2, ${R2.date})`}${v.roofLoss>0?`, мінус тінь від модулів на ліхтарях (−${nf(v.roofLoss,1)} МВт·год на даху)`:v.roofLoss<0?`, плюс менше тіні від нижчих ліхтарів (+${nf(-v.roofLoss,1)} МВт·год на даху)`:''}. Перемикач ліхтаря — над моделлю.</p></div>`;
    h=h.replace('<div class="blk">',blk+'<div class="blk">');
    if(T==='year') h=h.replace(/1[\s  ]953/g,nf(v.N)).replace(/1[\s  ]425,69/g,nf(v.N*0.73,1)); }
  if(T==='day'){ const i=h.indexOf('<div class="blk"><h3>Обидва проєкти за добу'); h=i>0?h.slice(0,i)+sunPathBlock()+h.slice(i):h+sunPathBlock(); }
  return h; };
// ---------- панель «Загальне»
const _pz=panelPZ; panelPZ=function(){ const h=_pz.apply(this,arguments); if(!V2ON()) return h; const k=sc(), A=SC.A, B=SC.B, F=R2.fac.tot;
  if(LK(k)==='C'&&window.__twin.v3panel) return window.__twin.v3panel(k)+h;
  const row=(t,a,b,cls)=>`<tr class="${cls||''}"><td>${t}</td><td class="${k==='A'?'cur':''}">${a}</td><td class="${k==='B'?'cur':''}">${b}</td></tr>`;
  const tA=A.base.n+A.dom.K.n, tB=B.base.n+B.flush.K.n, mA=A.base.mwh-A.dom.K.roof_loss+A.dom.K.mwh, mB=B.base.mwh-B.flush.K.roof_loss+B.flush.K.mwh;
  return `<div class="ph"><span class="eyebrow ours">Наш варіант Б · дах за розрізом 1-1 · 27.10</span><h2>${nf(k==='B'?tB:tA)} модулів на даху цеху і ліхтарях</h2><p>Покрівля — грані по ≈3 м за кресленням замовника (ендови +15,90, гребені +17,66 і +18,15), а не гладкі арки. Ліхтар обміряно рулеткою 27.10: гребінь ≈1,89 м над покрівлею, по низу ≈3,66 м, схили — світлопрозорий полікарбонат (модулі на ліхтарях затінять цех). Розрахунок поки за двома сценаріями (3,40 × 1,74 і 2,87 × 1,5) — перемикач над моделлю; під обміри ще не перераховано.</p></div>
   <table class="cmp"><thead><tr><th></th><th class="ours">Ліхтар 2,87 · «домік»</th><th class="ours">Ліхтар 3,40 · книжково</th></tr></thead><tbody>
   ${row('Ліхтар','2,87 м, гребінь ≈1,5 (оцінка)','3,40 × 1,74 м (РП)')}${row('Дах, модулів',`${nf(A.base.n)} = ${A.base.st} стр.`,`${nf(B.base.n)} = ${B.base.st} стр.`)}
   ${row('Дах, МВт·год',nf(A.base.mwh,1),nf(B.base.mwh,1))}${row('На ліхтарях',`${A.dom.K.n} · ${nf(A.dom.K.mwh,1)} МВт·год`,`${B.flush.K.n} · ${nf(B.flush.K.mwh,1)} МВт·год`)}
   ${row('Тінь від них на дах',`−${nf(A.dom.K.roof_loss,1)}`,`−${nf(B.flush.K.roof_loss,1)}`)}${row('Дах + ліхтарі',`${nf(tA)} · ${nf(mA,1)} МВт·год`,`${nf(tB)} · ${nf(mB,1)} МВт·год`,'tot')}
   ${row('+ фасади, склад',`${nf(F.all.n)} + 176`,`${nf(F.all.n)} + 176`)}${row('Уся станція',`${nf(tA+F.all.n+176)} · ${nf((tA+F.all.n+176)*0.73,1)} кВтп`,`${nf(tB+F.all.n+176)} · ${nf((tB+F.all.n+176)*0.73,1)} кВтп`,'tot')}</tbody></table>
   <p class="src">Фасади перераховано на висоту з розрізу (будівля на ≈2 м вища, ніж у моделі 26.10): південь ${nf(F.S.n)} вертикально, схід — козирок ${nf(F.Ec.n)} + ${nf(F.Ev.n)} вертикально; ${nf(F.all.kwh/1000,1)} МВт·год. Вікна — за фото 26.10; на розрізі на стіні сходу є позначки 7,23 і 10,13 м — можливо, вікна вищі на ≈0,5 м, звірити. Потужність PCS для ≈${nf(((k==="B"?tB:tA)+F.all.n+176)*0.73,0)} кВтп — перевірити. Генерація і тіні — у «Сонці».</p>
   <p class="src">Нижче — розкладка 25.10 на старій моделі арок, з якої виходили.</p>`+h; };
// ---------- перемикачі над моделлю
const _hud=hudCtx; hudCtx=function(){ _hud.apply(this,arguments); const s=state.sec; if(state.proj!=='ours'||!(s==='pz'||effSec()==='sun')||state.lay.rad) return;
  const m=$('#modes'), add=(key,t,on,fn)=>{ const b=document.createElement('button'); b.type='button'; b.dataset.m=key; b.textContent=t; b.setAttribute('aria-pressed',String(!!on)); b.onclick=()=>{ fn(); CURVE_RESET(); apply(); save(); }; m.appendChild(b); };
  add('v2',`Дах 27.10 · ${nf(SC[sc()].base.n)}`,state.lay.v2,()=>state.lay.v2=!state.lay.v2);
  if(state.lay.v2){ if(SC.C){ add('scC','v3 · А усі місця',sc()==='C',()=>state.lay.lanSc='C'); add('scD','Б · від 1 050',sc()==='D',()=>state.lay.lanSc='D'); add('scE','В · від 1 100',sc()==='E',()=>state.lay.lanSc='E'); }
    if(!SC.C){ add('scB','Ліхтар 3,40',sc()==='B',()=>state.lay.lanSc='B'); add('scA','Ліхтар 2,87 · «домік»',sc()==='A',()=>state.lay.lanSc='A'); }
    if(sc()==='C') Object.keys(LF).sort((a,b)=>a-b).forEach(q=>add('lf'+q,`Ліхтарі → каркас ${q}°${LFL[q]?' ('+LFL[q]+')':''} · +${nf(LFD[q].K.n)}`,LFK()===q,()=>{ state.lay.lanF=String(state.lay.lanF)===q?0:+q; if(state.lay.lanF) state.lay.lanMods=false; }));
    add('lanM',`${LK(sc())==='C'?'На склі ліхтарів':'На ліхтарях'} · +${nf(SC[sc()][sc()==='A'?'dom':'flush'].K.n)}`,state.lay.lanMods&&!L13ON(),()=>{ state.lay.lanMods=!state.lay.lanMods; if(state.lay.lanMods) state.lay.lanF=0; }); }
  m.hidden=false;
  if(effSec()==='sun'&&V2ON()&&state.lay.lanMods&&!state.lay.sunPlain){ const l=$('#legend'); if(l&&!l.hidden) l.insertAdjacentHTML('beforeend','<span><i class="sw" style="background:#c3c8cc"></i>на ліхтарях поза стрінгами</span>'); }
  if(s==='pz'&&V2ON()){ const l=$('#legend'); l.innerHTML=`<span class="t">Наш Б · ${LK(sc())==='C'?SLAB[sc()]:'дах за розрізом 1-1'}</span><span>${nf(SC[sc()].base.n)} модулів на гранях</span>${LK(sc())==='C'?'<span><i class="sw" style="background:#6b4a2e"></i>дефлектори, труби</span><span><i class="sw" style="background:#8f9aa1"></i>нижче порогу варіанта</span>':'<span><i class="sw" style="background:#b4461b"></i>прибрано: тінь</span>'}<span><i class="sw" style="background:#7a3fa0"></i>кондиціонери, портал, двері</span><span><i class="sw" style="background:#c9781c"></i>під стрінги</span><span><i class="sw" style="background:#e0a040"></i>поза стрінгами — на освітлення</span>${L13ON()?`<span>на місці ліхтарів ${nf(LFD[LFK()].K.n)} модулів, каркас ${LFK()}°, стрінги по 11 — номер стрінга в описі модуля</span>`:''}`; l.hidden=false; } };
function CURVE_RESET(){ Object.keys(CURVE).forEach(q=>delete CURVE[q]); GNOW=null; }
// ---------- видимість
let lastKey='';
const _sv=setVis; setVis=function(){ _sv.apply(this,arguments); const on=V2ON(), k=sc(), sun=effSec()==='sun';
  RG.visible=on; Object.keys(RM).forEach(q=>{ RM[q].g.visible=on&&k===q; RM[q].rg.visible=RM[q].g.visible&&!sun; });
  DG.visible=on&&k==='A'&&!!state.lay.lanMods; Object.keys(FL).forEach(q=>FL[q].FG2.visible=on&&k!=='A'&&LK(k)===q&&!!state.lay.lanMods&&!L13ON());
  Object.keys(LF).forEach(q=>{ LF[q].G13.visible=LFK()===q; LF[q].Gg.visible=LFK()===q&&!sun; });
  if(on){ ourMods.visible=false; lagMesh.visible=false; if(oBZ.boxes) oBZ.boxes.visible=false; ['blk','mat','sl','cp','rods','xp','ang','cl','an'].forEach(q=>{ if(OUR[q]) OUR[q].visible=false; }); } setLanGeo();
  const key=[on,k,state.lay.lanMods,state.lay.fac25,LFK()].join('|'); if(key!==lastKey){ lastKey=key; buildGV(); CURVE_RESET(); }
  yrApply(); if(!on) paintV2(false); };
window.__twin.v2={SC,RM,GV,VS,V2ON,v2Sum,DINFO,HORZ,LK,SLAB,FL,sc,L13ON,LF,LFK,LFD}; if(window.__twin.v3init) window.__twin.v3init(); apply();
}
