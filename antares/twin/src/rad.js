// ================= Сонячна радіація на кожен м² за рік (src/rad.js; дані RADD — розрахунок /work/sun/irr.py, 26.10.2026)
// Розділ «Сонце і генерація» → режим «Радіація, м²»: квадрати 1 × 1 м на даху цеху, даху складу і фасадах (Пд, Сх, Пн).
{
const RG=grp('rad',G.site); RG.visible=false;
const RC=['#f7a062','#ea7428','#cf550c','#a94006','#7f2f04','#561f02'], RCL=RC.map(c=>lin(c));
const cls=e=>RADD.cl.reduce((k,t)=>k+(e>=t?1:0),0);
const RMAT=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const PL=new THREE.PlaneGeometry(1,1), PH=PL.clone().rotateX(-Math.PI/2);
const NM={roof:'Дах цеху',S:'Південний фасад',N:'Північний фасад',E:'Східний фасад',whA:'Склад, частина A',whB:'Склад, частина B',whC1:'Склад, частина C1'};
const GHI=RADD.ghi, nf0=v=>nf(v,0), q=new THREE.Quaternion(), eu=new THREE.Euler(), sc=new V3(), ps=new V3(), M=new THREE.Matrix4(), GAP=0.97;
const RXp=X=>roofZ(Math.max(0,Math.min(96.64,X)))+1.2;
function build(k){ const C=RADD.cells[k], list=[];
  for(let j=0;j<C.ny;j++) for(let i=0;i<C.nx;i++){ const n=j*C.nx+i, e=C.e[n]; if(!e||(C.w&&C.w[n]==='1')) continue; list.push([i,j,n]); }
  const im=new THREE.InstancedMesh(k==='roof'||k.startsWith('wh')?PH:PL,RMAT,list.length); im.userData.cells=list; im.frustumCulled=false;
  list.forEach(([i,j,n],m)=>{ const s=C.s0+i, t=C.t0+j;
    if(k==='roof'){ const x0=Math.max(-0.15,s-0.5), x1=Math.min(96.64,s+0.5), y0=Math.max(-0.5,t-0.5), y1=Math.min(96.59,t+0.5), z0=roofZ(x0)+0.07, z1=roofZ(x1)+0.07;
      ps.set((x0+x1)/2,(z0+z1)/2,-(y0+y1)/2); q.setFromEuler(eu.set(0,0,Math.atan2(z1-z0,x1-x0))); sc.set(Math.hypot(x1-x0,z1-z0),1,(y1-y0)); }
    else if(k.startsWith('wh')){ const p=k.slice(2), y0=t-0.5, y1=t+0.5, z0=WHF[p](s,y0)+0.07, z1=WHF[p](s,y1)+0.07;
      ps.set(s,(z0+z1)/2,-t); q.setFromEuler(eu.set(Math.atan2(z1-z0,1),0,0)); sc.set(1,1,Math.hypot(1,z1-z0)); }
    else { const top=k==='E'?HV+0.5:RXp(s), h0=t-0.5, h1=Math.min(top,t+0.5), a0=k==='E'?Math.max(-0.5,s-0.5):Math.max(-0.15,s-0.5), a1=k==='E'?Math.min(96.59,s+0.5):Math.min(96.64,s+0.5), c=(a0+a1)/2, hc=(h0+h1)/2;
      if(k==='S'){ ps.set(c,hc,0.57); q.identity(); } else if(k==='N'){ ps.set(c,hc,-96.66); q.setFromEuler(eu.set(0,Math.PI,0)); } else { ps.set(96.71,hc,-c); q.setFromEuler(eu.set(0,Math.PI/2,0)); }
      sc.set((a1-a0)*GAP,(h1-h0)*GAP,1); }
    M.compose(ps,q,sc); im.setMatrixAt(m,M); im.setColorAt(m,RCL[cls(C.e[n])]); });
  im.instanceMatrix.needsUpdate=true; im.instanceColor.needsUpdate=true; RG.add(im);
  im.userData.info=id=>{ const [i,j,n]=list[id], e=C.e[n], l=C.l[n], s=C.s0+i, t=C.t0+j, F=['S','N','E'].includes(k);
    const where=k==='roof'||k.startsWith('wh')?`X ${nf(s,1)}, Y ${nf(t,1)}`:`${k==='E'?'Y':'X'} ${nf(s,1)} м, висота ${nf(t-0.5,0)}–${nf(t+0.5,0)} м`;
    return {t:`${NM[k]}: ${where}`, d:`${nf0(e)} кВт·год/м² за рік — ${nf0(e/GHI*100)} % від горизонтальної площини без тіні (${nf0(GHI)}). Тінь і закрите небо забирають ${l} %.${F?' Вертикальна площина.':''}`}; };
  PICK.push({o:im,when:()=>RG.visible}); return im; }
['roof','S','N','E','whA','whB','whC1'].forEach(build);
// ---------- режим у розділі «Сонце і генерація»
const radOn=()=>effSec()==='sun'&&state.sec!=='mis'&&!!state.lay.rad;
const hud0=hudCtx; hudCtx=function(){ hud0.apply(this,arguments); if(!(effSec()==='sun'&&state.sec!=='mis')) return;
  const L=state.lay, m=$('#modes'), b=document.createElement('button'); b.type='button'; b.dataset.m='rad'; b.textContent=innerWidth<760?'Радіація':'Радіація, м²';
  m.querySelectorAll('button').forEach(x=>{ if(L.rad) x.setAttribute('aria-pressed','false'); x.addEventListener('click',()=>{ L.rad=false; },{capture:true}); });
  b.setAttribute('aria-pressed',String(!!L.rad)); b.onclick=()=>{ L.rad=!L.rad; apply(); save(); }; m.appendChild(b); m.hidden=false; if(L.rad) requestAnimationFrame(()=>{ m.scrollLeft=m.scrollWidth; });
  if(L.rad){ const lg=$('#legend'); lg.hidden=false; lg.innerHTML=`<span class="t">Сонце за рік, кВт·год/м²</span>`+RC.map((c,i)=>`<span><i class="sw" style="background:${c}"></i>${RADD.cln[i]}</span>`).join(''); } };
const sv0=setVis; setVis=function(){ sv0.apply(this,arguments); const on=radOn(); RG.visible=on; if(on){ G.rp.visible=false; G.ours.visible=false; WHI.forEach(w=>w.im.visible=false); } };
function radPanel(){ const S=RADD.st, SN={roof:'Дах цеху',whA:'Склад A, 11° на пд',whB:'Склад B, 11° на пд',whC1:'Склад C1, 2 схили 22°',S:'Фасад Пд',E:'Фасад Сх',N:'Фасад Пн'}, row=k=>{ const s=S[k]; return `<tr><td>${SN[k]}</td><td>${nf0(s.area)}</td><td><b>${nf0(s.mean)}</b></td><td>${nf0(s.p10)}–${nf0(s.max)}</td><td>${nf0(s.mean/GHI*100)} %</td></tr>`; };
  const big=k=>{ const s=S[k]; return nf0(s.cls[4]+s.cls[5]); };
  return `<div class="ph"><span class="eyebrow ours">Сонце на кожен м² · за рік</span><h2>Сонячна радіація на дах і фасади</h2></div>
  <div class="blk"><div class="stats"><div class="stat"><div class="v">${nf0(S.roof.mean)}</div><div class="k">дах цеху, кВт·год/м² у середньому</div></div><div class="stat"><div class="v">${nf0(S.S.mean)}</div><div class="k">південний фасад</div></div><div class="stat"><div class="v">${nf0(S.E.mean)}</div><div class="k">східний фасад</div></div><div class="stat"><div class="v">${nf0(S.N.mean)}</div><div class="k">північний фасад — ${nf0(S.N.mean/S.roof.mean*100)} % від даху</div></div></div></div>
  <div class="blk"><h3>По поверхнях</h3><table class="cmp"><thead><tr><th>Поверхня</th><th>м²</th><th>середня</th><th>10 %–макс.</th><th>від гориз.</th></tr></thead><tbody>${['roof','whA','whB','whC1','S','E','N'].map(row).join('')}</tbody></table>
  <p class="src">м² — вільна площа: на даху без ліхтарів, перешкод і рами кондиціонерів; на фасадах без вікон, воріт і того, що стоїть упритул (ТП, тамбури, сходи, ДГУ). «10 %–макс.»: 10 % площі мають менше першого числа. Горизонтальна площина без тіні — ${nf0(GHI)} кВт·год/м² (Meteonorm 8.1).</p></div>
  <div class="blk"><h3>Площа за класами, м²</h3><table class="cmp"><thead><tr><th>кВт·год/м²</th><th>дах</th><th>склад</th><th>Пд</th><th>Сх</th><th>Пн</th></tr></thead><tbody>${RADD.cln.map((c,i)=>{ const v=[S.roof.cls[i],S.whA.cls[i]+S.whB.cls[i]+S.whC1.cls[i],S.S.cls[i],S.E.cls[i],S.N.cls[i]];
    return `<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${RC[i]};margin-right:6px"></i>${c}</td>${v.map(x=>`<td>${x?nf0(x):'—'}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>
  <div class="blk"><h3>Що видно</h3><p class="src" style="font-size:13px;color:var(--ink-2)">Північний фасад отримує ≈${nf0(S.N.mean)} кВт·год/м² — у ${nf(S.roof.mean/S.N.mean,1)} раза менше за дах: майже лише розсіяне світло. Південний — ≈${nf0(S.S.mean)}, східний — ≈${nf0(S.E.mean)}. На даху: уздовж західної будівлі біля стіни −45 %, за 4 м −28 %, за 7 м −13 %; смуга 0,5 м під південним парапетом −65 %, наступний метр −17 %; під північним парапетом −23 %; під східним −33 %. ≥ 1 100 кВт·год/м² — ${nf0(S.roof.cls[4]+S.roof.cls[5])} м² даху з ${nf0(S.roof.area)}. Найкраще — південні схили складу A і B (≈1 250).</p>
  <p class="src">Розрахунок 26.10: клімат і модель як у генерації двійника (Meteonorm 8.1, ясні і хмарні дні під місячні суми, крок 10 хв, альбедо 0,2) + тінь розсіяного світла від будівель і парапетів. Тіні — від західної будівлі (≈6,8 м над дахом, ширина умовна), парапетів, ліхтарів, 42 перешкод, рами кондиціонерів, ТП, адмінкорпусу, сходів, ДГУ, контейнерів УЗЕ. Дерева й далекі будинки не враховано. Розміри за фото — оцінка. Наступний крок — розкладка панелей за цією картою.</p></div>`; }
const ps0=panelSun; panelSun=function(){ return radOn()?radPanel():ps0.apply(this,arguments); };
window.__twin.rad={RG,on:()=>{ state.lay.rad=true; apply(); }};
if(state.lay.rad) apply();
}
