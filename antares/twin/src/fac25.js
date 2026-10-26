// ================= Фасадні козирки 25° на південному і східному фасадах (src/fac25.js; дані FAC25 — /work/sun/fac25.py, 26.10.2026)
// Розкладка «максимально» за запитом власника: ряди по суцільних смугах стіни, модуль 2384 × 1303 довгим боком уздовж стіни, виліт 1,18 м.
{
const FG25=grp('fac25',G.ours); const B=FAC25.beta*D2R, DM=1.303, LM=2.384, cb=Math.cos(B), sb=Math.sin(B);
const RN={S:'Південний фасад',E:'Східний фасад'};
const rowOf=(f,r)=>FAC25.rows.find(x=>x.f===f&&x.row===r);
const L=FAC25.mods, n=L.length;
const pv=inst(BOX,MAT.pvL,L.filter(m=>m[0]==='S').length,FG25), pe=inst(BOX,MAT.pvP,L.filter(m=>m[0]==='E').length,FG25);
const stM=std(lin(0x5e676d),{metalness:0.5,roughness:0.5}), br=inst(BOX,stM,n*4,FG25);
const q=new THREE.Quaternion(), e=new THREE.Euler(), M=new THREE.Matrix4(), ps=new V3(), sc=new V3(); let iS=0,iE=0,ib=0; const SY=1.0-DM*sb-0.04, SL=Math.hypot(DM*cb,SY), SA=Math.atan2(SY,DM*cb); const IDX={S:[],E:[]};
L.forEach((m,k)=>{ const [f,r,top,s]=m, oc=DM*cb/2, hc=top-DM*sb/2;
  if(f==='S'){ ps.set(s,hc,0.5+oc); q.setFromEuler(e.set(B,0,0)); sc.set(LM,0.035,DM); M.compose(ps,q,sc); pv.setMatrixAt(iS,M); IDX.S[iS++]=k;
    [-LM/2+0.35,LM/2-0.35].forEach(dx=>{ ps.set(s+dx,hc-0.04,0.5+oc); sc.set(0.05,0.06,DM); M.compose(ps,q,sc); br.setMatrixAt(ib++,M);   // кронштейн під модулем
      ps.set(s+dx,top-0.5-DM*sb/2-0.02,0.5+DM*cb/2); q.setFromEuler(e.set(-SA,0,0)); sc.set(0.05,0.05,SL); M.compose(ps,q,sc); br.setMatrixAt(ib++,M); q.setFromEuler(e.set(B,0,0)); }); }   // підкіс від стіни (на 1 м нижче верху) до краю
  else { ps.set(96.64+oc,hc,-s); q.setFromEuler(e.set(0,0,-B)); sc.set(DM,0.035,LM); M.compose(ps,q,sc); pe.setMatrixAt(iE,M); IDX.E[iE++]=k;
    [-LM/2+0.35,LM/2-0.35].forEach(dz=>{ ps.set(96.64+oc,hc-0.04,-s+dz); sc.set(DM,0.06,0.05); M.compose(ps,q,sc); br.setMatrixAt(ib++,M);
      ps.set(96.64+DM*cb/2,top-0.5-DM*sb/2-0.02,-s+dz); q.setFromEuler(e.set(0,0,SA)); sc.set(SL,0.05,0.05); M.compose(ps,q,sc); br.setMatrixAt(ib++,M); q.setFromEuler(e.set(0,0,-B)); }); } });
for(let i=0;i<pv.count;i++) pv.setColorAt(i,white); for(let i=0;i<pe.count;i++) pe.setColorAt(i,white);   // той самий матеріал, що й модулі даху з instanceColor
[pv,pe,br].forEach(o=>o.instanceMatrix.needsUpdate=true);
const T=FAC25.tot, nf0=v=>nf(v,0);
const info=f=>id=>{ const m=L[IDX[f][id]], R=rowOf(m[0],m[1]);
  return {t:`Козирок 25° — ${RN[f]}, ряд на ${nf(m[2],2)} м (${R.why})`, d:`Модуль 730 Вт: ≈${nf0(m[4])} кВт·год за рік (≈${nf0(m[4]/0.73)} на 1 кВтп). Ряд: ${R.n} модулів, ${nf(R.kwh/1000,1)} МВт·год, тінь від будівель і рядів вище забирає ${nf(R.loss,1)} %. Усього на фасадах ${T.all.n} модулів, ${nf(T.all.kwp,1)} кВтп, ${nf(T.all.kwh/1000,1)} МВт·год за рік. Окремий розрахунок 26.10 — у «Сонці» двійника не враховано.`}; };
pv.userData.info=info('S'); pe.userData.info=info('E'); br.userData.info={t:'Кронштейн козирка (умовно)',d:'Конструкцію кріплення до бетонних панелей стіни ще не розроблено — у 3D показано схематично.'};
[pv,pe,br].forEach(o=>PICK.push({o,when:()=>FG25.visible}));
// видимість: «Наш Б», розділи «Загальне» і «Сонце» (крім режиму «Радіація, м²»), перемикач у «Загальному»
if(state.lay.fac25===undefined) state.lay.fac25=true;
const sv1=setVis; setVis=function(){ sv1.apply(this,arguments); const s=effSec(); FG25.visible=state.proj==='ours'&&!!state.lay.fac25&&(s==='pz'||(s==='sun'&&!state.lay.rad)); };
const hud1=hudCtx; hudCtx=function(){ hud1.apply(this,arguments); if(state.sec!=='pz'||state.proj!=='ours') return;
  const m=$('#modes'), b=document.createElement('button'); b.type='button'; b.dataset.m='fac25'; b.textContent=`Фасади 25° · +${T.all.n}`; b.setAttribute('aria-pressed',String(!!state.lay.fac25));
  b.onclick=()=>{ state.lay.fac25=!state.lay.fac25; apply(); save(); }; m.appendChild(b); m.hidden=false; };
window.__twin.fac25={FG25,T}; hudCtx(); setVis();
}
