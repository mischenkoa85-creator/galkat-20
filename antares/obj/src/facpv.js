// ================= Фасадні модулі (src/facpv.js; дані FACPV — calc/fac_v2.py: s_opt.py, gen_s.py, combo.py; 27.10.2026 — висота будівлі за розрізом 1-1)
// Рішення власника 21:32: південний фасад — вертикально впритул (низ ≥ 4 м), східний — козирок 25° під парапетом + вертикально нижче.
{
const FG=grp('facpv',G.ours), B=25*D2R, DM=1.303, LM=2.384, cb=Math.cos(B), sb=Math.sin(B), tB=Math.tan(B), OFF=0.10;
const RN={S:'Південний фасад',E:'Східний фасад'}, T=FACPV.tot, MN=FACPV.mount||{}, VM=FACPV.vmount||{}, nf0=v=>nf(v,0);
const FR={S:{P:(s,h,o)=>new V3(s,h,0.5+o),al:new V3(1,0,0)}, E:{P:(s,h,o)=>new V3(96.64+o,h,-s),al:new V3(0,0,-1)}};
const xA=new V3(), yA=new V3(), zA=new V3(), M=new THREE.Matrix4(), ps=new V3(), sc=new V3(), q=new THREE.Quaternion(), e=new THREE.Euler();
function bar(im,i,a,b,w,t,al){ xA.subVectors(b,a); const len=xA.length(); xA.normalize(); zA.copy(al); yA.crossVectors(zA,xA).normalize(); zA.crossVectors(xA,yA);
  M.makeBasis(xA,yA,zA); M.scale(sc.set(len,t,w)); M.setPosition(ps.addVectors(a,b).multiplyScalar(0.5)); im.setMatrixAt(i,M); }
function blk(im,i,c,f,dA,dH,dO){ xA.copy(FR[f].al); yA.set(0,1,0); zA.crossVectors(xA,yA); M.makeBasis(xA,yA,zA); M.scale(sc.set(dA,dH,dO)); M.setPosition(c); im.setMatrixAt(i,M); }
const zn=MAT.zn, clM=std(lin(0x3a3f44),{metalness:0.5,roughness:0.45}), anM=std(lin(0x8f989e),{metalness:0.7,roughness:0.35});
// ---------- вертикальні модулі: альбомні — 2 вертикальні рейки у точках ¼ довжини, книжкові — 2 горизонтальні; на кожну рейку 2 кронштейни з анкером
const V=FACPV.vert, VL=V.filter(m=>m[3]>2), VP=V.filter(m=>m[3]<2);
const pvL=inst(BOX,MAT.pvL,Math.max(1,VL.length),FG), pvP=inst(BOX,MAT.pvP,Math.max(1,VP.length),FG), vr=inst(BOX,zn,V.length*2,FG,false), vbr=inst(BOX,anM,V.length*4,FG,false), vcl=inst(BOX,clM,V.length*4,FG,false);
let iL=0,iP=0,ir=0,ib=0,ic=0; const IDX={L:[],P:[]};
V.forEach((m,k)=>{ const [f,s,h,W,H]=m, F=FR[f], sc_=s+W/2, hc=h+H/2, land=W>2;
  blk(land?pvL:pvP,land?iL:iP,F.P(sc_,hc,OFF),f,W,H,0.035); if(land) IDX.L[iL++]=k; else IDX.P[iP++]=k;
  [-1,1].forEach(sg=>{ const d=(LM+0.02)/4*sg;
    if(land){ const a=F.P(sc_+d,h-0.05,OFF-0.04), b=F.P(sc_+d,h+H+0.05,OFF-0.04); bar(vr,ir++,a,b,0.041,0.041,new V3(0,0,0).add(F.al));
      [h+0.12,h+H-0.12].forEach(hh=>blk(vbr,ib++,F.P(sc_+d,hh,0.03),f,0.05,0.06,0.06));
      [h,h+H].forEach(hh=>blk(vcl,ic++,F.P(sc_+d,hh,OFF+0.02),f,0.05,0.035,0.035)); }
    else { const hh=hc+d, a=F.P(s-0.05,hh,OFF-0.04), b=F.P(s+W+0.05,hh,OFF-0.04); bar(vr,ir++,a,b,0.041,0.041,new V3(0,1,0));
      [s+0.12,s+W-0.12].forEach(ss=>blk(vbr,ib++,F.P(ss,hh,0.03),f,0.06,0.05,0.06));
      [s,s+W].forEach(ss=>blk(vcl,ic++,F.P(ss,hh,OFF+0.02),f,0.035,0.05,0.035)); } }); });
// ---------- козирок 25° під парапетом (схід): консоль-трикутник у точках ¼ довжини модуля
const C=FACPV.can, pc=inst(BOX,MAT.pvP,Math.max(1,C.length),FG), nc=C.length*2;
const arm=inst(BOX,zn,nc,FG), strut=inst(BOX,zn,nc,FG), plate=inst(BOX,zn,nc*2,FG), anc=inst(BOX,anM,nc*4,FG,false), clp=inst(BOX,clM,nc*2,FG,false);
let ia=0,ist=0,ipl=0,ian=0,icl=0; const D_=MN.d||0.9, OC=MN.oc||0.93;
C.forEach((m,k)=>{ const [f,r,top,s]=m, F=FR[f], oc=DM*cb/2, hc=top-DM*sb/2;
  ps.set(96.64+oc,hc,-s); q.setFromEuler(e.set(0,0,-B)); sc.set(DM,0.035,LM); M.compose(ps,q,sc); pc.setMatrixAt(k,M);
  [-(LM+0.02)/4,(LM+0.02)/4].forEach(dx=>{ const s_=s+dx;
    bar(arm,ia++,F.P(s_,top-0.06,0.03),F.P(s_,top-0.06-tB*1.19,1.22),0.041,0.041,F.al);
    bar(strut,ist++,F.P(s_,top-0.06-D_,0.03),F.P(s_,top-0.06-tB*OC-0.03,OC),0.041,0.041,F.al);
    blk(plate,ipl++,F.P(s_,top-0.08,0.006),f,0.12,0.22,0.012); blk(plate,ipl++,F.P(s_,top-0.06-D_,0.006),f,0.12,0.16,0.012);
    [[0,top-0.02],[0,top-0.14],[-0.035,top-0.06-D_],[0.035,top-0.06-D_]].forEach(([da,h])=>blk(anc,ian++,F.P(s_+da,h,0.02),f,0.022,0.022,0.03));
    [0.03,DM*cb-0.03].forEach(o=>blk(clp,icl++,F.P(s_,top-tB*o+0.035,o),f,0.05,0.035,0.05)); }); });
[pvL,pvP,pc].forEach(im=>{ for(let i=0;i<im.count;i++) im.setColorAt(i,white); });
[pvL,pvP,vr,vbr,vcl,pc,arm,strut,plate,anc,clp].forEach(o=>o.instanceMatrix.needsUpdate=true);
// ---------- підписи при натисканні
const SN=FACPV.strings||{}; const totTxt=`Фасади: південь вертикально ${T.S.n} модулів (${SN.S||'—'} стрінгів по 11), ${nf(T.S.kwh/1000,1)} МВт·год; схід — козирок ${T.Ec.n} + вертикально ${T.Ev.n} (${(SN.Ec||0)+(SN.Ev||0)} стрінгів), ${nf(T.E.kwh/1000,1)} МВт·год. Разом ${T.all.n} модулів, ${nf(T.all.kwp,1)} кВтп, ${nf(T.all.kwh/1000,1)} МВт·год за рік (перераховано 27.10 на висоту будівлі за розрізом 1-1: козирок сходу на +${nf(C.length?C[0][2]:0,2)} м, верх парапету +${nf(FACPV.ze||0,2)}). У «Сонці» — тіні й потужність наживо.`;
const vinf=list=>id=>{ const m=V[list[id]], [f,s,h,W,H,kwh,sl]=m;
  return {t:`${RN[f]}: модуль вертикально, ${W>2?'альбомно':'книжково'}, ${nf(h,2)}–${nf(h+H,2)} м${sl?' · стрінг '+sl:''}`, d:`≈${nf0(kwh)} кВт·год за рік (≈${nf0(kwh/0.73)} на 1 кВтп). Кріплення: 2 рейки С 41×41 у точках ¼ довжини, 4 кронштейни з анкерами, 4 затиски; зазор до стіни ≈0,1 м. ${totTxt}`}; };
pvL.userData.info=vinf(IDX.L); pvP.userData.info=vinf(IDX.P);
pc.userData.info=id=>{ const m=C[id], R=(FACPV.rows||[])[0]||{}; return {t:`Східний фасад: козирок 25° під парапетом${m[5]?' · стрінг '+m[5]:''}`, d:`Модуль ≈${nf0(m[4])} кВт·год за рік (≈${nf0(m[4]/0.73)} на 1 кВтп). Ряд: ${T.Ec.n} модулів, ${nf(T.Ec.kwh/1000,1)} МВт·год. ${totTxt}`}; };
const vmi={t:'Кріплення вертикальних модулів — концепція 26.10',d:`Снігу немає — лише вітер: відрив біля кутів ≈${nf(VM.Wk||3.2,1)} кН на модуль (розрахунково ${nf(VM.Wd||4.8,1)}), ≈${nf(VM.anc_t||1.2,1)} кН на анкер; вага модуля ${nf(VM.Gk||0.36,2)} кН. На стіну ≈${nf(VM.wall||0.16,2)} кН на 1 м ряду — у 13 разів менше, ніж від козирка.`};
[vr,vbr,vcl].forEach(o=>o.userData.info=vmi);
const cinf={t:'Консоль козирка — концепція 26.10 (не розрахунок КМ)',d:`Через ≈1,2 м, у точках ¼ довжини модуля. Рейка С 41×41 і підкіс; 2 пластини на стіні з плечем ${nf(D_,2)} м у межах однієї панелі. Орієнтовно: вниз ${nf(MN.V1||4.6,1)} кН, вгору ${nf(-(MN.V2||-2.1),1)} кН; верхні анкери — розтяг ${nf(MN.A_ten||3,1)} кН. Нижня пластина консолі — від ${nf((C.length?C[0][2]:0)-0.06-D_,2)} м; найвищі вікна сходу — до 11,2 м (за фото).`};
[arm,strut,plate,anc,clp].forEach(o=>o.userData.info=cinf);
[pvL,pvP,pc,vr,arm,strut,plate].forEach(o=>PICK.push({o,when:()=>FG.visible}));
// ---------- видимість і перемикач
if(state.lay.fac25===undefined) state.lay.fac25=true;
const sv1=setVis; setVis=function(){ sv1.apply(this,arguments); const s=effSec(); FG.visible=state.proj==='ours'&&!!state.lay.fac25&&(s==='pz'||(s==='sun'&&!state.lay.rad)); };
const hud1=hudCtx; hudCtx=function(){ hud1.apply(this,arguments); if(state.sec!=='pz'||state.proj!=='ours') return;
  const m=$('#modes'), b=document.createElement('button'); b.type='button'; b.dataset.m='fac25'; b.textContent=`Фасади · +${T.all.n}`; b.setAttribute('aria-pressed',String(!!state.lay.fac25));
  b.onclick=()=>{ state.lay.fac25=!state.lay.fac25; apply(); save(); }; m.appendChild(b); m.hidden=false; };
window.__twin.facpv={FG,T,pvL,pvP,pc,IDX}; hudCtx(); setVis();
}
