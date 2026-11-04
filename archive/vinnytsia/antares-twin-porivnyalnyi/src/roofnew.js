// ================= Дах цеху 26.10 (src/roofnew.js; дані ROOF26 — /work/sun/roof_new.py, roof_final.py, lantern_gable.py)
// Вентиляцію з даху прибрано (власник 26.10, 21:50): +нові місця; прибрано біля рами кондиціонерів, під стійками порталу, 4 колонки в тіні західної будівлі,
// найслабші під стрінги по 11. Окремий шар — варіант «доміки» над ліхтарями (22:11).
{
const RG=grp('roof26',G.ours), GG=grp('lan26',G.ours), R=ROOF26, B=R.base, GB=R.gable, K=(a,y)=>a.toFixed(3)+'_'+y.toFixed(3);
const IDX=new Map(); OM.forEach((m,i)=>IDX.set(K(m.Xa,m.Y),i));
const NEWM=R.mods.filter(m=>m[3]==='new'), REM=R.mods.filter(m=>!['old','new'].includes(m[3]));
const remIdx=REM.map(m=>IDX.get(K(m[0],m[2]))).filter(i=>i!==undefined), SAVE=remIdx.map(i=>{ const M=new M4(); ourMods.getMatrixAt(i,M); return M; });
const VENTS=G.site.children.filter(o=>o.material===MAT.obs);
function modM(xa,xb,y,lift,th){ const za=roofZ(xa)+0.104, zb=roofZ(xb)+0.104, ang=Math.atan2(zb-za,xb-xa), L=Math.hypot(xb-xa,zb-za)-0.02;
  _q.setFromAxisAngle(ZA,ang); const up=new V3(-Math.sin(ang),Math.cos(ang),0);
  _p.copy(W((xa+xb)/2,y,(za+zb)/2)).addScaledVector(up,0.0175+lift); _M.compose(_p,_q,_s.set(L-(lift?0.1:0),th,2.384-(lift?0.1:0))); return _M; }
// ---------- нові модулі (зеленуваті) і позначки прибраних
const nm=inst(BOX,MAT.pvPo,Math.max(1,NEWM.length),RG), tint=new THREE.Color(0xa6e3bd);
NEWM.forEach((m,i)=>{ nm.setMatrixAt(i,modM(m[0],m[1],m[2],0,0.035)); nm.setColorAt(i,tint); }); nm.instanceMatrix.needsUpdate=true;
const RCOL={west:0xb4461b,ac:0x7a3fa0,portal:0x7a3fa0,str:0xc9781c};
const rmMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.55,depthWrite:false});
const rm=inst(BOX,rmMat,Math.max(1,REM.length),RG,false);
REM.forEach((m,i)=>{ rm.setMatrixAt(i,modM(m[0],m[1],m[2],0.03,0.02)); rm.setColorAt(i,new THREE.Color(RCOL[m[3]])); }); rm.instanceMatrix.needsUpdate=true;
const WHY={west:'тінь західної будівлі (вища за дах на ≈6,8 м)',ac:'зона рами з 11 кондиціонерами: рама + 1 м, прохід від виходу на дах, труби',portal:'стійки сталевого порталу на південному краї',str:'найслабше місце — прибрано, щоб модулі ділились на стрінги по 11'};
const tot=`Дах цеху 26.10: ${nf(B.n)} модулів = ${B.st} стрінгів × 11, ${nf(B.kwp,1)} кВтп, ${nf(B.mwh,1)} МВт·год за рік (було 1 773 і ${nf(R.old_v.mwh,1)} у тій самій моделі з тінню західної будівлі). Нових місць ${R.cnt.new_all}, прибрано: західна стіна ${R.cnt.west}, кондиціонери ${R.cnt.ac}, портал ${R.cnt.portal}, під стрінги ${R.cnt.str} (1 773 + ${R.cnt.new_all} − ${R.cnt.west+R.cnt.ac+R.cnt.portal+R.cnt.str} = ${nf(B.n)}).`;
nm.userData.info=i=>{ const m=NEWM[i]; return {t:'Нове місце 26.10 — тут стояла вентиляція',d:`≈${nf(m[4])} кВт·год за рік (${nf(m[4]/0.73)} на 1 кВтп), тінь ${nf(m[5],1)} %. ${tot}`}; };
rm.userData.info=i=>{ const m=REM[i]; return {t:`Прибрано 26.10: ${WHY[m[3]]}`,d:`Тут модуль дав би ≈${nf(m[4])} кВт·год за рік (тінь ${nf(m[5],1)} %). ${tot}`}; };
PICK.push({o:nm,when:()=>RG.visible},{o:rm,when:()=>RG.visible});
// ---------- контури зон (кондиціонери, портал)
R.zones.forEach(z=>{ const pts=[], add=(x,y)=>pts.push(W(x,y,roofZ(x)+0.2));
  for(let x=z.x[0];x<=z.x[1];x+=0.25) add(x,z.y[0]); for(let x=z.x[1];x>=z.x[0];x-=0.25) add(x,z.y[1]);
  const g=new THREE.BufferGeometry().setFromPoints(pts), ln=new THREE.LineLoop(g,new THREE.LineBasicMaterial({color:0x7a3fa0})); RG.add(ln); });
// ---------- ліхтарі — двосхилі (фото 123334, 123924, 123951), як на будівлі; у моделі 25.10 були коробки
const lanM=std(0xc4c8c8,{metalness:0.45,roughness:0.5}), lanE=std(0x9da3a6,{roughness:0.8}), LH=GB.h;
G.site.children.filter(o=>o.material===MAT.lan).forEach(o=>o.visible=false);
S.lan.forEach(l=>{ const xc=(l[0]+l[1])/2, zb=Math.max(roofZ(l[0]),roofZ(l[1])), z0=Math.min(roofZ(l[0]),roofZ(l[1]))-0.3;
  const sh=new THREE.Shape([new THREE.Vector2(l[0],z0),new THREE.Vector2(l[1],z0),new THREE.Vector2(l[1],zb),new THREE.Vector2(xc,zb+LH),new THREE.Vector2(l[0],zb)]);
  const g=new THREE.ExtrudeGeometry(sh,{depth:l[3]-l[2],bevelEnabled:false}); const o=mesh(g,[lanE,lanM],G.site); o.position.z=-l[3];
  o.userData.info={t:'Світловий ліхтар — двосхилий',d:`${nf(l[1]-l[0],1)} × ${nf(l[3]-l[2],1)} м, гребінь ≈${nf(LH,2)} м над покрівлею (креслення), схили ≈${nf(GB.tilt,0)}° (на фото ≈40–45°), покриті профільованим листом. Обміряти.`}; PICK.push({o}); });
// ---------- варіант: модулі на схилах ліхтарів «доміком»
const th=GB.tilt*D2R, c=Math.cos(th), sn=Math.sin(th), LAN=GB.lans, GM=GB.mods.filter(m=>m[5]), GD=GB.mods.filter(m=>!m[5]);
const gm=inst(BOX,MAT.pvP,Math.max(1,GM.length),GG), gd=inst(BOX,rmMat,Math.max(1,GD.length),GG,false);
const lz=l=>{ const L=LAN[l-1]; return [(L.x0+L.x1)/2, Math.max(roofZ(L.x0),roofZ(L.x1))]; };
function gM(m,thick){ const [xc,zb]=lz(m[0]), sg=m[1]==='E'?1:-1, u=GB.u0+1.192; _q.setFromAxisAngle(ZA,-sg*th);
  _p.set(xc+sg*u*c, zb+LH-u*sn+GB.offn-0.0165/c, -(m[2]+1.303/2)); _M.compose(_p,_q,_s.set(2.384,thick,1.303)); return _M; }
GM.forEach((m,i)=>{ gm.setMatrixAt(i,gM(m,0.033)); gm.setColorAt(i,white); }); gm.instanceMatrix.needsUpdate=true;
GD.forEach((m,i)=>{ gd.setMatrixAt(i,gM(m,0.02)); gd.setColorAt(i,new THREE.Color(0xc9781c)); }); gd.instanceMatrix.needsUpdate=true;
// рейки поперек довгої сторони модуля (уздовж ліхтаря), 2 на схил, у зоні притисків 477–596 мм від торців
const seg=[];
LAN.forEach((l,li)=>{ const [xc,zb]=lz(li+1), ms=GB.mods.filter(m=>m[0]===li+1), y0=Math.min(...ms.map(m=>m[2]))-0.05, y1=Math.max(...ms.map(m=>m[2]))+1.303+0.05;
  [-1,1].forEach(sg=>[GB.u0+0.54,GB.u0+2.384-0.54].forEach(u=>seg.push([xc+sg*u*c, zb+LH-u*sn+GB.offn-0.033/c-0.03, y0, y1]))); });
const fr=inst(BOX,MAT.zn,seg.length,GG);
seg.forEach(([x,z,y0,y1],i)=>{ _M.compose(_p.set(x,z,-(y0+y1)/2),QI,_s.set(0.041,0.041,y1-y0)); fr.setMatrixAt(i,_M); }); fr.instanceMatrix.needsUpdate=true;
const GK=GB.keep, A40=GB.alt.flush40, A10=GB.alt.gable10, gtot=`Варіант: модулі на схилах 4 ліхтарів (${nf(GB.tilt,0)}°, схід і захід): ${GK.n} модулів = ${GK.n/11} стрінгів, ${nf(GK.kwp,1)} кВтп, ${nf(GK.mwh,1)} МВт·год за рік; модулі даху від їхньої тіні втрачають ${nf(GB.T.roof_loss,1)} → чистими +${nf(GK.net,1)}. Якщо схили 40° (оцінка за фото) — трохи більше. Перед рішенням: чи ліхтарі ще дають світло, димовидалення, несуча здатність каркаса ліхтаря.`;
gm.userData.info=i=>{ const m=GM[i]; return {t:`Модуль на ліхтарі ${m[0]}: схил на ${m[1]==='E'?'схід':'захід'} ${nf(GB.tilt,0)}°`,d:`Книжково, на 0,15 м над листом ліхтаря; ≈${nf(m[3])} кВт·год за рік (${nf(m[3]/0.73)} на 1 кВтп), тінь ${nf(m[4],1)} %. ${gtot}`}; };
gd.userData.info=i=>({t:'Ліхтар 1: місце не зайняте — під стрінги по 11',d:`Ліхтар 1 по обіді затіняє західна будівля. ${gtot}`});
fr.userData.info={t:'Рейки на схилі ліхтаря — схема',d:`2 рейки 41×41 на схил уздовж ліхтаря, поперек довгої сторони модуля (як в інструкції ZNSHINE), кріплення до каркаса ліхтаря крізь лист з ущільненням. Несучу здатність каркаса перевірити. ${gtot}`};
PICK.push({o:gm,when:()=>GG.visible},{o:gd,when:()=>GG.visible},{o:fr,when:()=>GG.visible});
// ---------- видимість, приховування старих модулів і вентиляції
if(state.lay.roof26===undefined) state.lay.roof26=true; if(state.lay.lan26===undefined) state.lay.lan26=false;
let hid=false;
function hide(on){ if(on===hid) return; hid=on; remIdx.forEach((i,k)=>ourMods.setMatrixAt(i,on?ZERO:SAVE[k])); ourMods.instanceMatrix.needsUpdate=true; VENTS.forEach(v=>v.visible=!on); }
const sv2=setVis; setVis=function(){ sv2.apply(this,arguments); const pz=state.proj==='ours'&&effSec()==='pz', on=pz&&!!state.lay.roof26;
  RG.visible=on; GG.visible=pz&&!!state.lay.lan26; hide(on); };
const hud2=hudCtx; hudCtx=function(){ hud2.apply(this,arguments); if(state.sec!=='pz'||state.proj!=='ours') return;
  const m=$('#modes'); [['roof26',`Дах 26.10 · ${nf(B.n)}`],['lan26',`На ліхтарях · +${GK.n}`]].forEach(([k,t])=>{ const b=document.createElement('button'); b.type='button'; b.dataset.m=k; b.textContent=t; b.setAttribute('aria-pressed',String(!!state.lay[k]));
    b.onclick=()=>{ state.lay[k]=!state.lay[k]; apply(); save(); }; m.appendChild(b); }); m.hidden=false;
  if(state.lay.roof26){ const l=$('#legend'); l.innerHTML=`<span class="t">Наш варіант Б · дах 26.10</span><span>${nf(B.n)} модулів на даху цеху + ${R.wh.n} склад</span><span><i class="sw" style="background:#7fcf9c"></i>нові (де була вентиляція)</span><span><i class="sw" style="background:#b4461b"></i>прибрано</span><span><i class="sw" style="background:#7a3fa0"></i>кондиціонери, портал</span>`+(state.lay.lan26?`<span><i class="sw" style="background:#2f6fdb"></i>на ліхтарях +${GK.n}</span>`:''); l.hidden=false; } };
const pz1=panelPZ; panelPZ=function(){ const h=pz1.apply(this,arguments); if(state.proj!=='ours'||!state.lay.roof26) return h; const T=R.total;
  return `<div class="ph"><span class="eyebrow ours">Наш варіант Б · дах цеху 26.10</span><h2>${nf(B.n)} модулів на даху цеху = ${B.st} стрінгів × 11</h2><p>Вентиляцію з даху прибрано (власник 26.10). Враховано раму з 11 кондиціонерами, портал, тінь західної будівлі.</p></div>`
   +`<dl class="kv"><dt>Дах цеху</dt><dd>${nf(B.n)} × 730 Вт<small>було 1 773; ${nf(B.kwp,1)} кВтп</small></dd><dt>Генерація даху</dt><dd>${nf(B.mwh,1)} МВт·год<small>${nf(B.y)} кВт·год/кВтп; розкладка 25.10 у тій самій моделі — ${nf(R.old_v.mwh,1)}</small></dd>`
   +`<dt>Нові місця</dt><dd>+${R.cnt.new_all}<small>де стояла вентиляція (${R.cnt.new_all-R.cnt.new} з них прибрано під стрінги)</small></dd><dt>Прибрано</dt><dd>−${R.cnt.west+R.cnt.ac+R.cnt.portal+R.cnt.str}<small>західна стіна ${R.cnt.west}, кондиціонери ${R.cnt.ac}, портал ${R.cnt.portal}, під стрінги ${R.cnt.str}</small></dd>`
   +`<dt>Уся станція</dt><dd>${nf(T.n)} модулів<small>дах ${nf(B.n)} + склад ${R.wh.n} + фасади 319 = ${T.st} стрінгів, ${nf(T.kwp,1)} кВтп, ≈${nf(T.mwh,0)} МВт·год</small></dd>`
   +`<dt>Варіант: на ліхтарях</dt><dd>+${GK.n} модулів<small>на схилах 4 ліхтарів «доміком», ${nf(GB.tilt,0)}°: +${nf(GK.net,1)} МВт·год чистими; після рішень про світло, димовидалення і каркас ліхтарів</small></dd></dl>`
   +`<p class="src">Нижче — розкладка 25.10, з якої виходили (у шарі «Дах 26.10» на моделі: зеленуваті — нові, червоні — прибрані).</p>`+h; };
window.__twin.roof26={RG,GG,B,GK}; hudCtx(); setVis();
}
