// ================= Фасадні модулі (src/facpv.js; дані FACPV — calc/fac_v2.py: s_opt.py, gen_s.py, combo.py; 27.10.2026 — висота будівлі за розрізом 1-1)
// Рішення власника 21:32: південний фасад — вертикально впритул (низ ≥ 4 м), східний — козирок 25° під парапетом + вертикально нижче.
{
const FG=grp('facpv',G.ours), B=25*D2R, DM=1.303, LM=2.384, cb=Math.cos(B), sb=Math.sin(B), tB=Math.tan(B), OFF=0.1765;   // середина модуля від стіни: спинка рейки 119 + рейка 41 + ½ рами 33 (кубики фасаду 04.11)
const FN=typeof FACNODE!=='undefined'?FACNODE:null, RX=LM/2-0.54, BY=0.45, KM=FN?FN.mods.kozyrok:null;   // рейки 540 мм від торців, кронштейни ±450 мм
const RN={S:'Південний фасад',E:'Східний фасад'}, T=FACPV.tot, MN=FACPV.mount||{}, VM=FACPV.vmount||{}, nf0=v=>nf(v,0);
const FR={S:{P:(s,h,o)=>new V3(s,h,0.5+o),al:new V3(1,0,0)}, E:{P:(s,h,o)=>new V3(96.64+o,h,-s),al:new V3(0,0,-1)}};
const xA=new V3(), yA=new V3(), zA=new V3(), M=new THREE.Matrix4(), ps=new V3(), sc=new V3(), q=new THREE.Quaternion(), e=new THREE.Euler();
function bar(im,i,a,b,w,t,al){ xA.subVectors(b,a); const len=xA.length(); xA.normalize(); zA.copy(al); yA.crossVectors(zA,xA).normalize(); zA.crossVectors(xA,yA);
  M.makeBasis(xA,yA,zA); M.scale(sc.set(len,t,w)); M.setPosition(ps.addVectors(a,b).multiplyScalar(0.5)); im.setMatrixAt(i,M); }
function blk(im,i,c,f,dA,dH,dO){ xA.copy(FR[f].al); yA.set(0,1,0); zA.crossVectors(xA,yA); M.makeBasis(xA,yA,zA); M.scale(sc.set(dA,dH,dO)); M.setPosition(c); im.setMatrixAt(i,M); }
const zn=MAT.zn, clM=std(lin(0x3a3f44),{metalness:0.5,roughness:0.45}), anM=std(lin(0x8f989e),{metalness:0.7,roughness:0.35});
// ---------- вертикальні модулі: альбомні — 2 вертикальні рейки 540 мм від торців, книжкові — 2 горизонтальні; на кожну рейку 2 кронштейни з анкером (кубики фасаду 04.11)
const V=FACPV.vert, VL=V.filter(m=>m[3]>2), VP=V.filter(m=>m[3]<2);
const pvL=inst(BOX,MAT.pvL,Math.max(1,VL.length),FG), pvP=inst(BOX,MAT.pvP,Math.max(1,VP.length),FG), vr=inst(BOX,zn,V.length*2,FG,false), vbr=inst(BOX,anM,V.length*4,FG,false), vcl=inst(BOX,clM,V.length*4,FG,false);
let iL=0,iP=0,ir=0,ib=0,ic=0; const IDX={L:[],P:[]};
V.forEach((m,k)=>{ const [f,s,h,W,H]=m, F=FR[f], sc_=s+W/2, hc=h+H/2, land=W>2;
  blk(land?pvL:pvP,land?iL:iP,F.P(sc_,hc,OFF),f,W,H,0.035); if(land) IDX.L[iL++]=k; else IDX.P[iP++]=k;
  [-1,1].forEach(sg=>{ const d=RX*sg, zr=OFF-0.0165-0.0205;
    if(land){ const a=F.P(sc_+d,hc-0.7,zr), b=F.P(sc_+d,hc+0.7,zr); bar(vr,ir++,a,b,0.041,0.041,new V3(0,0,0).add(F.al));
      [hc-BY,hc+BY].forEach(hh=>blk(vbr,ib++,F.P(sc_+d+sg*0.0255,hh,0.09),f,0.005,0.08,0.18));
      [h,h+H].forEach(hh=>blk(vcl,ic++,F.P(sc_+d,hh,OFF+0.02),f,0.08,0.035,0.037)); }
    else { const hh=hc+d, a=F.P(sc_-0.7,hh,zr), b=F.P(sc_+0.7,hh,zr); bar(vr,ir++,a,b,0.041,0.041,new V3(0,1,0));
      [sc_-BY,sc_+BY].forEach(ss=>blk(vbr,ib++,F.P(ss,hh+sg*0.0255,0.09),f,0.08,0.005,0.18));
      [s,s+W].forEach(ss=>blk(vcl,ic++,F.P(ss,hh,OFF+0.02),f,0.035,0.08,0.037)); } }); });
// ---------- козирок 25° під парапетом (схід): консоль і підкіс 540 мм від торців модуля, геометрія — з кубиків фасаду (FACNODE.mods.kozyrok)
const C=FACPV.can, pc=inst(BOX,MAT.pvP,Math.max(1,C.length),FG), nc=C.length*2;
const arm=inst(BOX,zn,nc,FG), strut=inst(BOX,zn,nc,FG), plate=inst(BOX,zn,nc*2,FG), anc=inst(BOX,anM,nc*4,FG,false), clp=inst(BOX,clM,nc*2,FG,false);
let ia=0,ist=0,ipl=0,ian=0,icl=0; const D_=MN.d||0.9, OC=MN.oc||0.93;
const KC=KM?KM.c.map(v=>v/1000):[0,-0.238,0.668], KTOP=KM?KM.ymax/1000:0.067, PZ=0.06;   // центр модуля від центру верхньої пластини; верх модуля над пластиною
C.forEach((m,k)=>{ const [f,r,top,s]=m, F=FR[f], ph=top-KTOP, out=F.P(0,0,1).sub(F.P(0,0,0)), up=new V3(0,1,0);
  const xl=out.clone().multiplyScalar(cb).addScaledVector(up,-sb), yl=out.clone().multiplyScalar(sb).addScaledVector(up,cb), zl=new V3().crossVectors(out,up);
  M.makeBasis(xl,yl,zl); M.scale(sc.set(DM,0.035,LM)); M.setPosition(F.P(s,ph+KC[1]+0.0165*cb,KC[2]+0.0165*sb)); pc.setMatrixAt(k,M);
  [-RX,RX].forEach(dx=>{ const s_=s+dx;
    bar(arm,ia++,F.P(s_,ph,PZ),F.P(s_,ph-1.38*sb,PZ+1.38*cb),0.041,0.041,F.al);
    bar(strut,ist++,F.P(s_,ph-D_,PZ),F.P(s_,ph-OC*tB,PZ+OC),0.041,0.041,F.al);
    blk(plate,ipl++,F.P(s_,ph,0.006),f,0.12,0.22,0.012); blk(plate,ipl++,F.P(s_,ph-D_,0.006),f,0.12,0.16,0.012);
    [ph+0.075,ph-0.075,ph-D_+0.05,ph-D_-0.05].forEach(h=>blk(anc,ian++,F.P(s_,h,0.02),f,0.022,0.022,0.03));
    [-1,1].forEach(se=>{ const u=KC[2]+0.0165*sb+se*(DM/2)*cb, v=ph+KC[1]+0.0165*cb-se*(DM/2)*sb; blk(clp,icl++,F.P(s_,v+0.03,u),f,0.08,0.035,0.05); }); }); });
[pvL,pvP,pc].forEach(im=>{ for(let i=0;i<im.count;i++) im.setColorAt(i,white); });
[pvL,pvP,vr,vbr,vcl,pc,arm,strut,plate,anc,clp].forEach(o=>o.instanceMatrix.needsUpdate=true);
// ---------- підписи при натисканні
const SN=FACPV.strings||{}; const totTxt=`Фасади: південь вертикально ${T.S.n} модулів (${SN.S||'—'} стрінгів по 11), ${nf(T.S.kwh/1000,1)} МВт·год; схід — козирок ${T.Ec.n} + вертикально ${T.Ev.n} (${(SN.Ec||0)+(SN.Ev||0)} стрінгів), ${nf(T.E.kwh/1000,1)} МВт·год. Разом ${T.all.n} модулів, ${nf(T.all.kwp,1)} кВтп, ${nf(T.all.kwh/1000,1)} МВт·год за рік (перераховано 27.10 на висоту будівлі за розрізом 1-1: козирок сходу на +${nf(C.length?C[0][2]:0,2)} м, верх парапету +${nf(FACPV.ze||0,2)}). У «Сонці» — тіні й потужність наживо.`;
const vinf=list=>id=>{ const m=V[list[id]], [f,s,h,W,H,kwh,sl]=m;
  return {t:`${RN[f]}: модуль вертикально, ${W>2?'альбомно':'книжково'}, ${nf(h,2)}–${nf(h+H,2)} м${sl?' · стрінг '+sl:''}`, d:`≈${nf0(kwh)} кВт·год за рік (≈${nf0(kwh/0.73)} на 1 кВтп). Кріплення (кубики фасаду 04.11): 2 рейки 41×41×2,0 540 мм від торців, 4 кронштейни 60×180×5 з анкером M10, 4 крайні притиски Al 80 мм, трос безпеки; тильне скло 164 мм від стіни. Ближче — видно кожну деталь. ${totTxt}`}; };
pvL.userData.info=vinf(IDX.L); pvP.userData.info=vinf(IDX.P);
pc.userData.info=id=>{ const m=C[id], R=(FACPV.rows||[])[0]||{}; return {t:`Східний фасад: козирок 25° під парапетом${m[5]?' · стрінг '+m[5]:''}`, d:`Модуль ≈${nf0(m[4])} кВт·год за рік (≈${nf0(m[4]/0.73)} на 1 кВтп). Ряд: ${T.Ec.n} модулів, ${nf(T.Ec.kwh/1000,1)} МВт·год. ${totTxt}`}; };
const vmi={t:'Кріплення вертикальних модулів — розрахунок за ДБН 04.11',d:`2 рейки 41×41×2,0 (540 мм від торців), 4 кронштейни 60×180×5 з анкером M10, 4 крайні притиски Al 80 мм (M8×50, 16–20 Н·м), заземлювальна пластина, трос безпеки Ø3. Вітер за ДБН В.1.2-2:2006: відрив до 0,63 кПа біля кутів (перевірка EN — 1,53 кПа); анкер M10 — до 2,8 кН на розтяг, 0,12 кН зріз. Маса кріплення ≈10 кг на модуль. Анкери — за випробуваннями (стіна — ФБС або залізобетон).`};
[vr,vbr,vcl].forEach(o=>o.userData.info=vmi);
const cinf={t:'Козирок 25° — розрахунок за ДБН 04.11',d:`2 консолі 41×41×2,5 L 1 410 і 2 підкоси на модуль, пластини 120×220×12 і 120×160×12 на ${nf(D_,2)} м нижче, по 2 хімічні анкери M12. Сніг за ДБН ${nf(1.77,2)} кПа (μ = 1): підкіс — стиск 2,2 кН, консоль — 31 % несучої здатності, верхні анкери — розтяг 1,0 і зріз 0,9 кН; при подвійному снігу — 1,9 / 1,7 кН. Маса кріплення ≈25 кг на модуль.`};
[arm,strut,plate,anc,clp].forEach(o=>o.userData.info=cinf);
[pvL,pvP,pc,vr,arm,strut,plate].forEach(o=>PICK.push({o,when:()=>FG.visible}));
// ---------- видимість і перемикач
if(state.lay.fac25===undefined) state.lay.fac25=true;
const sv1=setVis; setVis=function(){ sv1.apply(this,arguments); const s=effSec(); FG.visible=state.proj==='ours'&&!!state.lay.fac25&&(s==='pz'||(s==='sun'&&!state.lay.rad)); };
const hud1=hudCtx; hudCtx=function(){ hud1.apply(this,arguments); if(state.sec!=='pz'||state.proj!=='ours') return;
  const m=$('#modes'), b=document.createElement('button'); b.type='button'; b.dataset.m='fac25'; b.textContent=`Фасади · +${T.all.n}`; b.setAttribute('aria-pressed',String(!!state.lay.fac25));
  b.onclick=()=>{ state.lay.fac25=!state.lay.fac25; apply(); save(); }; m.appendChild(b); m.hidden=false; };
window.__twin.facpv={FG,T,pvL,pvP,pc,IDX,V,C,FR,vr,vbr,vcl,arm,strut,plate,anc,clp,KTOP}; hudCtx(); setVis();
}
