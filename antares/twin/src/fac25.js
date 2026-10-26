// ================= Фасадні козирки 25° на південному і східному фасадах (src/fac25.js; дані FAC25 — /work/sun/fac25.py, 26.10.2026)
// Розкладка «максимально» за запитом власника: ряди по суцільних смугах стіни, модуль 2384 × 1303 довгим боком уздовж стіни, виліт 1,18 м.
{
const FG25=grp('fac25',G.ours); const B=FAC25.beta*D2R, DM=1.303, LM=2.384, cb=Math.cos(B), sb=Math.sin(B);
const RN={S:'Південний фасад',E:'Східний фасад'};
const rowOf=(f,r)=>FAC25.rows.find(x=>x.f===f&&x.row===r);
const L=FAC25.mods, n=L.length;
const pv=inst(BOX,MAT.pvL,Math.max(1,L.filter(m=>m[0]==='S').length),FG25), pe=inst(BOX,MAT.pvP,L.filter(m=>m[0]==='E').length,FG25);
// консоль-трикутник у точках ¼ довжини модуля (2 на модуль, ≈1,2 м): 2 пластини на стіні (верхня — розтяг, нижня — упор), рейка під модулем, підкіс; затиски на довгих боках
const MN=FAC25.mount||{}, zn=MAT.zn, clM=std(lin(0x3a3f44),{metalness:0.5,roughness:0.45}), anM=std(lin(0x8f989e),{metalness:0.7,roughness:0.35});
const nc=n*2, arm=inst(BOX,zn,nc,FG25), strut=inst(BOX,zn,nc,FG25), plate=inst(BOX,zn,nc*2,FG25), anc=inst(BOX,anM,nc*4,FG25,false), clp=inst(BOX,clM,nc*2,FG25,false);
const q=new THREE.Quaternion(), e=new THREE.Euler(), M=new THREE.Matrix4(), ps=new V3(), sc=new V3(); let iS=0,iE=0,ia=0,ist=0,ipl=0,ian=0,icl=0; const IDX={S:[],E:[]};
const FR={S:{P:(s,h,o)=>new V3(s,h,0.5+o),al:new V3(1,0,0)}, E:{P:(s,h,o)=>new V3(96.64+o,h,-s),al:new V3(0,0,-1)}};
const xA=new V3(), yA=new V3(), zA=new V3();
function bar(im,i,a,b,w,t,al){ xA.subVectors(b,a); const len=xA.length(); xA.normalize(); zA.copy(al); yA.crossVectors(zA,xA).normalize(); zA.crossVectors(xA,yA);
  M.makeBasis(xA,yA,zA); M.scale(sc.set(len,t,w)); M.setPosition(ps.addVectors(a,b).multiplyScalar(0.5)); im.setMatrixAt(i,M); }
function blk(im,i,c,f,dA,dH,dO){ const al=FR[f].al; xA.copy(al); yA.set(0,1,0); zA.crossVectors(xA,yA); M.makeBasis(xA,yA,zA); M.scale(sc.set(dA,dH,dO)); M.setPosition(c); im.setMatrixAt(i,M); }
const tB=Math.tan(B), D_=MN.d||0.9, OC=MN.oc||0.93;
L.forEach((m,k)=>{ const [f,r,top,s]=m, F=FR[f], oc=DM*cb/2, hc=top-DM*sb/2;
  if(f==='S'){ ps.set(s,hc,0.5+oc); q.setFromEuler(e.set(B,0,0)); sc.set(LM,0.035,DM); M.compose(ps,q,sc); pv.setMatrixAt(iS,M); IDX.S[iS++]=k; }
  else { ps.set(96.64+oc,hc,-s); q.setFromEuler(e.set(0,0,-B)); sc.set(DM,0.035,LM); M.compose(ps,q,sc); pe.setMatrixAt(iE,M); IDX.E[iE++]=k; }
  [-(LM+0.02)/4,(LM+0.02)/4].forEach(dx=>{ const sc_=s+dx;
    const a0=F.P(sc_,top-0.06,0.03), a1=F.P(sc_,top-0.06-tB*1.19,1.22); bar(arm,ia++,a0,a1,0.041,0.041,F.al);                 // рейка С 41×41 під модулем
    const b0=F.P(sc_,top-0.06-D_,0.03), b1=F.P(sc_,top-0.06-tB*OC-0.03,OC); bar(strut,ist++,b0,b1,0.041,0.041,F.al);           // підкіс
    blk(plate,ipl++,F.P(sc_,top-0.08,0.006),f,0.12,0.22,0.012); blk(plate,ipl++,F.P(sc_,top-0.06-D_,0.006),f,0.12,0.16,0.012); // пластини на стіні
    [[0,top-0.02],[0,top-0.14],[-0.035,top-0.06-D_],[0.035,top-0.06-D_]].forEach(([da,h])=>blk(anc,ian++,F.P(sc_+da,h,0.02),f,0.022,0.022,0.03));   // анкери: 2 у верхній пластині, 2 у нижній
    [0.03,DM*cb-0.03].forEach(o=>{ const h=top-tB*o+0.035; blk(clp,icl++,F.P(sc_,h,o),f,0.05,0.035,0.05); }); });   // затиски на довгих боках модуля
});
for(let i=0;i<pv.count;i++) pv.setColorAt(i,white); for(let i=0;i<pe.count;i++) pe.setColorAt(i,white);   // той самий матеріал, що й модулі даху з instanceColor
[pv,pe,arm,strut,plate,anc,clp].forEach(o=>o.instanceMatrix.needsUpdate=true);
const T=FAC25.tot, nf0=v=>nf(v,0);
const info=f=>id=>{ const m=L[IDX[f][id]], R=rowOf(m[0],m[1]);
  return {t:`Козирок 25° — ${RN[f]}, ряд на ${nf(m[2],2)} м (${R.why})`, d:`Модуль 730 Вт: ≈${nf0(m[4])} кВт·год за рік (≈${nf0(m[4]/0.73)} на 1 кВтп). Ряд: ${R.n} модулів, ${nf(R.kwh/1000,1)} МВт·год, тінь від будівель і рядів вище забирає ${nf(R.loss,1)} %. Усього на фасадах ${T.all.n} модулів (3 нижні ряди сходу прибрано 26.10), ${nf(T.all.kwp,1)} кВтп, ${nf(T.all.kwh/1000,1)} МВт·год за рік. Окремий розрахунок 26.10 — у «Сонці» двійника не враховано.`}; };
pv.userData.info=info('S'); pe.userData.info=info('E');
const cinf={t:'Консоль козирка — концепція 26.10 (не розрахунок КМ)',d:`Через ≈1,2 м, у точках ¼ довжини модуля (2 на модуль). Рейка С 41×41 під модулем і підкіс — сталь оцинкована; на стіні 2 пластини: верхня тягне, нижня впирається, плече ${nf(D_,2)} м — обидві в межах однієї стінової панелі. Орієнтовно на консоль (Київ, сніг 1,55 кПа, вітер ≈0,73 кПа на 15 м): розрахунково вниз ${nf(MN.V1||4.6,1)} кН, вгору ${nf(-(MN.V2||-2.1),1)} кН; верхні анкери — розтяг ${nf(MN.A_ten||3,1)} кН і зріз ${nf(MN.A_shear||3.3,1)} кН на пару. Куди кріпити (панелі чи колони) — після обстеження стіни і випробування анкерів.`};
[arm,strut,plate,anc,clp].forEach(o=>o.userData.info=cinf);
[pv,pe,arm,strut,plate].forEach(o=>PICK.push({o,when:()=>FG25.visible}));
// видимість: «Наш Б», розділи «Загальне» і «Сонце» (крім режиму «Радіація, м²»), перемикач у «Загальному»
if(state.lay.fac25===undefined) state.lay.fac25=true;
const sv1=setVis; setVis=function(){ sv1.apply(this,arguments); const s=effSec(); FG25.visible=state.proj==='ours'&&!!state.lay.fac25&&(s==='pz'||(s==='sun'&&!state.lay.rad)); };
const hud1=hudCtx; hudCtx=function(){ hud1.apply(this,arguments); if(state.sec!=='pz'||state.proj!=='ours') return;
  const m=$('#modes'), b=document.createElement('button'); b.type='button'; b.dataset.m='fac25'; b.textContent=`Фасади 25° · +${T.all.n}`; b.setAttribute('aria-pressed',String(!!state.lay.fac25));
  b.onclick=()=>{ state.lay.fac25=!state.lay.fac25; apply(); save(); }; m.appendChild(b); m.hidden=false; };
window.__twin.fac25={FG25,T}; hudCtx(); setVis();
}
