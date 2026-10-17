
// ---------- generation estimate: kW for the chosen moment, daily curves per season, months
var energyReady=false;
const GEN={PSTC:0.710, GAM:-0.0030, KT:0.030, IAM:0.05, DIF:0.95, LOW:0.04, DER:0.926, CAP:500, OVER:0.15, ALB:0.2, UI:0.15, UY:0.08, kw:null, r:null, seasons:null, months:null, done:false};
const T_MAX=[0,1,7,15,21,24,26,26,20,13,6,1], T_MIN=[-5,-5,-1,5,10,14,16,15,10,5,1,-3];
const GHI_TYP=[0.75,1.45,2.75,4.1,5.4,5.7,5.7,5.0,3.5,2.0,0.85,0.55];   // kWh/m²/day on horizontal, Kyiv, approximate climate values
const MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const MSH=['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];
const SEAS=[['Зима','12-21','21 грудня'],['Весна','03-20','20 березня'],['Літо','06-21','21 червня'],['Осінь','09-23','23 вересня']];
const PVSYST_YEAR=1182761, KWP=1022.4;
const _gq=new THREE.Quaternion(), _gp=new THREE.Vector3(), _gs=new THREE.Vector3(), _gn=new THREE.Vector3();
const NRM=MODS.map(m=>{ m.mat.decompose(_gp,_gq,_gs); _gn.set(0,1,0).applyQuaternion(_gq); return [_gn.x,_gn.y,_gn.z]; });
const MSIDX=MODS.map(m=>BOARD_MS(m.b)-1);
const doyOf=ds=>{ const [Y,M,Dd]=ds.split('-').map(Number); return Math.round((Date.UTC(Y,M-1,Dd)-Date.UTC(Y,0,0))/86400000); };
const interp=(arr,doy)=>{ const x=(doy-1)/365*12-0.5, i=Math.floor(x), f=x-i; return arr[((i%12)+12)%12]*(1-f)+arr[(((i+1)%12)+12)%12]*f; };
const tAmb=(doy,h)=>{ const mx=interp(T_MAX,doy), mn=interp(T_MIN,doy); return (mx+mn)/2+(mx-mn)/2*Math.cos(2*Math.PI*(h-15)/24); };
const sunVec=(az,el)=>[Math.sin(az*D2R)*Math.cos(el*D2R), Math.sin(el*D2R), -Math.cos(az*D2R)*Math.cos(el*D2R)];
function clearSky(el,doy){ if(el<=0.3) return {dni:0,dhi:0,ghi:0}; const sn=Math.sin(el*D2R), am=1/(sn+0.50572*Math.pow(el+6.07995,-1.6364)), e0=1+0.033*Math.cos(2*Math.PI*doy/365);
  const dni=1353*e0*Math.pow(0.7,Math.pow(am,0.678)), tb=dni/(1361*e0), dhi=Math.max(0,1361*e0*sn*(0.271-0.294*tb)); return {dni,dhi,ghi:dni*sn+dhi}; }
const modP=(G,ta)=>{ if(G<=0) return 0; const tc=ta+GEN.KT*G; return GEN.PSTC*(G/1000)*Math.max(0,1+GEN.GAM*(tc-25))*(1-GEN.LOW*Math.max(0,1-G/1000)); };
// monthly clear-sky daily irradiation on the horizontal plane → share of clear days that reproduces the typical month
const CLR_DAY=(function(){ const y=new Date().getFullYear(); return MSH.map((_,m)=>{ const ds=`${y}-${String(m+1).padStart(2,'0')}-15`, doy=doyOf(ds); let s=0; for(let t=0;t<1440;t+=10){ const q=solar(localToUTC(ds,t)); s+=clearSky(q.el,doy).ghi*10/60/1000; } return s; }); })();
const fClearOf=doy=>Math.max(0,Math.min(1,(interp(GHI_TYP,doy)/interp(CLR_DAY,doy)-GEN.OVER)/(1-GEN.OVER)));
function calcStation(s,doy,hr,frac){ const cs=clearSky(s.el,doy), f=fClearOf(doy), ta=tAmb(doy,hr);
  const r={clear:0,over:0,typ:0,shade:0,groups:[],ta,f,dni:cs.dni,ghi:cs.ghi}; const gc=[0,0,0], go=[0,0,0]; let pu=0, pc=0;
  if(cs.ghi>0){ const d=sunVec(s.az,s.el), ghiO=GEN.OVER*cs.ghi;
    for(let i=0;i<MODS.length;i++){ const n=NRM[i], cos=Math.max(0,n[0]*d[0]+n[1]*d[1]+n[2]*d[2]), dif=GEN.DIF*cs.dhi*(1+n[1])/2, rf=GEN.DIF*GEN.ALB*cs.ghi*(1-n[1])/2, beam=cos>0.03?cs.dni*cos*Math.max(0,1-GEN.IAM*(1/cos-1)):0, fr=frac?frac[i]:0;
      const a=modP(beam+dif+rf,ta), b=modP(beam*(1-fr)+dif+rf,ta), c=modP(GEN.DIF*ghiO*((1+n[1])/2+GEN.ALB*(1-n[1])/2),ta); pu+=a; pc+=b; gc[MSIDX[i]]+=b; go[MSIDX[i]]+=c; } }
  for(let g=0;g<3;g++){ const C=Math.min(GEN.CAP,gc[g]*GEN.DER), O=Math.min(GEN.CAP,go[g]*GEN.DER); r.groups.push({c:C,o:O,t:f*C+(1-f)*O}); r.clear+=C; r.over+=O; }
  r.typ=f*r.clear+(1-f)*r.over; r.shade=pu>0?(pu-pc)/pu:0; return r; }
energyReady=true;

// ---------- readout for the chosen date and time
const kwf=v=>nf(v,0);
function genChip(){ if(!energyReady||!GEN.r) return ''; return `<span>⚡ <b>≈ ${kwf(GEN.r.typ)} кВт</b></span>`; }
function genInstant(s,state){ if(!energyReady) return; const doy=doyOf(dateIn.value), hr=+timeIn.value/60, r=calcStation(s,doy,hr,state&&state.frac); GEN.r=r;
  const el=$('#gen'); if(!el) return;
  if(s.el<=0.3||r.clear<=0){ el.innerHTML=`<div class="genbig"><b>0 кВт</b><span>сонце під горизонтом або дуже низько</span></div>`; return; }
  const cap=KWP, pc=v=>(Math.min(100,v/cap*100)).toFixed(1);
  el.innerHTML=`<div class="genbig"><b>≈ ${kwf(r.typ)} кВт</b><span>очікувано · ±${Math.round(GEN.UI*100)} %: ${kwf(r.typ*(1-GEN.UI))}–${kwf(r.typ*(1+GEN.UI))} кВт</span></div>`+
   `<div class="gbar" role="img" aria-label="Діапазон потужності від ${kwf(r.over)} до ${kwf(r.clear)} кВт"><span class="band" style="left:${pc(r.over)}%;width:${(pc(r.clear)-pc(r.over)).toFixed(1)}%"></span><span class="mark" style="left:${pc(r.typ)}%"></span></div>`+
   `<div class="gscale"><span>0</span><span>${kwf(cap/2)}</span><span>1 022 кВтп</span></div>`+
   `<dl class="kv"><dt>Залежно від хмар</dt><dd>від ${kwf(r.over)} (суцільна хмарність) до ${kwf(r.clear)} кВт (ясно)</dd>`+
   [0,1,2].map(g=>`<dt>MS-${g+1}</dt><dd>≈ ${kwf(r.groups[g].t)} кВт · від ${kwf(r.groups[g].o)} до ${kwf(r.groups[g].c)}</dd>`).join('')+
   `<dt>Втрати від затінення</dt><dd>${fmt(r.shade*100,1)} % при ясному небі</dd><dt>Повітря</dt><dd>${fmt(r.ta,0)} °C · ясне небо в ${Math.round(r.f*100)} % часу (за місячною нормою)</dd></dl>`; }

// ---------- daily curves and months (time-sliced so the page stays responsive)
function dayTasks(ds,t0,t1,step){ const out=[]; for(let t=t0;t<=t1;t+=step){ const s=solar(localToUTC(ds,t)); if(s.el>0.3) out.push({ds,t,s}); } return out; }
function runEnergy(){ const y=(dateIn.value||String(new Date().getFullYear())).slice(0,4); const tasks=[], S=SEAS.map(([n,md,lab],i)=>({n,lab,ds:`${y}-${md}`,pts:[]})), Mo=MSH.map((n,m)=>({n,m,ds:`${y}-${String(m+1).padStart(2,'0')}-15`,pts:[]}));
  S.forEach((o,i)=>dayTasks(o.ds,180,1380,30).forEach(t=>tasks.push(Object.assign(t,{dst:o.pts,step:30}))));
  Mo.forEach(o=>dayTasks(o.ds,180,1380,60).forEach(t=>tasks.push(Object.assign(t,{dst:o.pts,step:60}))));
  let k=0; const tot=tasks.length, prog=$('#seasons .small');
  const slice=()=>{ const t0=performance.now(); while(k<tot&&performance.now()-t0<30){ const q=tasks[k++], d=sunVec(q.s.az,q.s.el), st=computeShade(d[0],-d[2],d[1]); q.dst.push({t:q.t,r:calcStation(q.s,doyOf(q.ds),q.t/60,st.frac)}); }
    if(k<tot){ if(prog) prog.textContent=`Рахую затінення на 16 діб… ${Math.round(k/tot*100)} %`; setTimeout(slice,0); } else finish(S,Mo); };
  setTimeout(slice,50); }
function energyOf(pts,step,key){ return pts.reduce((a,p)=>a+p.r[key]*step/60,0); }
function finish(S,Mo){ S.forEach(o=>{ o.E={clear:energyOf(o.pts,30,'clear'),over:energyOf(o.pts,30,'over'),typ:energyOf(o.pts,30,'typ')}; });
  Mo.forEach(o=>{ const d=MDAYS[o.m]; o.E={clear:energyOf(o.pts,60,'clear')*d,over:energyOf(o.pts,60,'over')*d,typ:energyOf(o.pts,60,'typ')*d}; o.u=[0.25,0.15,0.15,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.15,0.25][o.m]; });
  GEN.seasons=S; GEN.months=Mo; GEN.done=true; renderSeasons(); renderMonths(); renderTables(); }
const mwh=v=>nf(v/1000,v/1000<10?2:1);

// ---------- charts (plain SVG, series colour from --s1, band from --sun)
function seasonSVG(o,i,ymax){ const W=190,H=124,L=30,R=6,T=8,B=20, x=t=>L+(t-240)/(1320-240)*(W-L-R), y=v=>H-B-v/ymax*(H-T-B);
  const up=o.pts.map(p=>`${x(p.t).toFixed(1)},${y(p.r.clear).toFixed(1)}`), dn=o.pts.slice().reverse().map(p=>`${x(p.t).toFixed(1)},${y(p.r.over).toFixed(1)}`);
  const ty=[0,ymax/2,ymax]; let g=ty.map(v=>`<line class="${v?'grid':'axis'}" x1="${L}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${L-4}" y="${(y(v)+3).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
  g+=[6,12,18].map(h=>`<text x="${x(h*60).toFixed(1)}" y="${H-6}" text-anchor="middle">${h}</text>`).join('');
  const cur=dateIn.value===o.ds?`<line class="cur" x1="${x(+timeIn.value).toFixed(1)}" x2="${x(+timeIn.value).toFixed(1)}" y1="${T}" y2="${H-B}"/>`:'';
  return `<svg class="gsvg" viewBox="0 0 ${W} ${H}" data-i="${i}" role="img" aria-label="${o.n}: добова крива потужності, кВт">${g}<polygon class="band" points="${up.concat(dn).join(' ')}"/><polyline class="line" points="${o.pts.map(p=>`${x(p.t).toFixed(1)},${y(p.r.typ).toFixed(1)}`).join(' ')}"/>${cur}<line class="xh" data-xh y1="${T}" y2="${H-B}" style="display:none"/><rect data-hit x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent"/></svg>`; }
function renderSeasons(){ const S=GEN.seasons; if(!S) return; const ymax=Math.max(100,Math.ceil(Math.max(...S.map(o=>Math.max(...o.pts.map(p=>p.r.clear))))/100)*100);
  $('#seasons').innerHTML=S.map((o,i)=>`<div class="sch"><h5>${o.n} · ${o.lab}</h5><p>≈ ${mwh(o.E.typ)} МВт·год за добу<br>від ${mwh(o.E.over)} до ${mwh(o.E.clear)}</p>${seasonSVG(o,i,ymax)}</div>`).join('')+`<p class="small" style="grid-column:1/-1;margin:0">Вісь — кВт, година доби (Київ). Наведіть курсор або торкніться кривої.</p>`;
  $$('#seasons .gsvg').forEach(sv=>{ const o=S[+sv.dataset.i], hit=sv.querySelector('[data-hit]'), xh=sv.querySelector('[data-xh]');
    const move=e=>{ const r=sv.getBoundingClientRect(), vx=(e.clientX-r.left)/r.width*190; const t=240+(vx-30)/(190-30-6)*1080; let b=null; o.pts.forEach(p=>{ if(!b||Math.abs(p.t-t)<Math.abs(b.t-t)) b=p; }); if(!b) return;
      const px=30+(b.t-240)/1080*(190-36); xh.setAttribute('x1',px); xh.setAttribute('x2',px); xh.style.display=''; const tip=gtip(); tip.hidden=false;
      tip.textContent=`${o.n} · ${String(Math.floor(b.t/60)).padStart(2,'0')}:${String(b.t%60).padStart(2,'0')}\nочікувано ${kwf(b.r.typ)} кВт\nвід ${kwf(b.r.over)} до ${kwf(b.r.clear)} кВт`; tip.style.left=Math.min(e.clientX+12,innerWidth-170)+'px'; tip.style.top=(e.clientY+12)+'px'; };
    hit.addEventListener('pointermove',move); hit.addEventListener('pointerdown',move); hit.addEventListener('pointerleave',()=>{ xh.style.display='none'; gtip().hidden=true; }); }); }
function gtip(){ let t=$('#gtip'); if(!t){ t=document.createElement('div'); t.id='gtip'; t.className='gtip'; t.hidden=true; document.body.appendChild(t); } return t; }
function renderMonths(){ const Mo=GEN.months; if(!Mo) return; const W=378,H=176,L=40,R=8,T=16,B=26; const vals=Mo.map(o=>o.E.typ/1000), tot=Mo.reduce((a,o)=>a+o.E.typ,0), ymax=Math.ceil(Math.max(...Mo.map((o,i)=>vals[i]*(1+o.u)))/20)*20;
  const bw=(W-L-R)/12, x=i=>L+i*bw, y=v=>H-B-v/ymax*(H-T-B);
  let g=[0,ymax/2,ymax].map(v=>`<line class="${v?'grid':'axis'}" x1="${L}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${L-4}" y="${(y(v)+3).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
  const peak=vals.indexOf(Math.max(...vals));
  Mo.forEach((o,i)=>{ const v=vals[i], x0=x(i)+bw*0.18, w=bw*0.64, cx=x(i)+bw/2, hi=v*(1+o.u), lo=v*(1-o.u);
    g+=`<rect class="bar" data-m="${i}" x="${x0.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${(H-B-y(v)).toFixed(1)}" rx="3"/><line class="wh" x1="${cx.toFixed(1)}" x2="${cx.toFixed(1)}" y1="${y(hi).toFixed(1)}" y2="${y(lo).toFixed(1)}"/><line class="wh" x1="${(cx-3).toFixed(1)}" x2="${(cx+3).toFixed(1)}" y1="${y(hi).toFixed(1)}" y2="${y(hi).toFixed(1)}"/><line class="wh" x1="${(cx-3).toFixed(1)}" x2="${(cx+3).toFixed(1)}" y1="${y(lo).toFixed(1)}" y2="${y(lo).toFixed(1)}"/><text x="${cx.toFixed(1)}" y="${H-10}" text-anchor="middle">${o.n}</text>`; });
  g+=`<text class="lbl" x="${(x(peak)+bw/2).toFixed(1)}" y="${(y(vals[peak]*(1+Mo[peak].u))-4).toFixed(1)}" text-anchor="middle">${nf(vals[peak],0)}</text>`;
  const perKwp=tot/KWP, diff=(tot/PVSYST_YEAR-1)*100;
  $('#months').innerHTML=`<p class="small" style="margin:0 0 4px"><b>Рік ≈ ${nf(tot/1000,0)} МВт·год</b> (±${Math.round(GEN.UY*100)} %: ${nf(tot*(1-GEN.UY)/1000,0)}–${nf(tot*(1+GEN.UY)/1000,0)}) · ${nf(perKwp,0)} кВт·год/кВтп. У PVsyst проєкту — ${nf(PVSYST_YEAR/1000,0)} МВт·год (1 157 кВт·год/кВтп): наша оцінка на ${fmt(Math.abs(diff),0)} % ${diff<0?'нижча':'вища'}.</p>`+
   `<svg class="gsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Генерація по місяцях, МВт·год">${g}<text x="${L}" y="9">МВт·год за місяць · лінії — типовий розкид між роками</text></svg>`;
  $$('#months [data-m]').forEach(b=>{ const o=Mo[+b.dataset.m]; const mv=e=>{ const t=gtip(); t.hidden=false; t.textContent=`${o.n}\nочікувано ${mwh(o.E.typ)} МВт·год (±${Math.round(o.u*100)} %)\nясний місяць ${mwh(o.E.clear)} · хмарний ${mwh(o.E.over)}`; t.style.left=Math.min(e.clientX+12,innerWidth-190)+'px'; t.style.top=(e.clientY+12)+'px'; };
    b.addEventListener('pointermove',mv); b.addEventListener('pointerdown',mv); b.addEventListener('pointerleave',()=>{ gtip().hidden=true; }); });
  $('#genfoot').innerHTML=`<b>Як рахується.</b> Ясне небо — за Meinel (повітряна маса Kasten–Young), розсіяна складова — за Liu–Jordan, відбиття землі 20 %. Кожен з 1 440 модулів має свій нахил із макета (ряди цеху повернуті вздовж арки) і свою частку затінення з п’яти променів; діоди обходу не враховано. Втрати на кут падіння (IAM, b₀ = 0,05) і при малій освітленості — 4 %. Комірка = повітря + 0,030·G, температурний коефіцієнт −0,30 %/°C (прийнято, не з паспорта). Втрати: забруднення, розбіжність, кабелі DC 2,15 %, інвертор 98 % — разом коефіцієнт 0,926; обмеження 500 кВт на кожну групу MS. «Очікувано» — суміш ясного й суцільно хмарного (15 % ясного) так, щоб дати середню місячну радіацію Києва (наближені кліматичні значення, не вимірювання). Розкид «від–до» — від суцільної хмарності до ясного неба. Орієнтовна похибка: ±15 % для середньої години, ±8 % для річної суми. Для точнішої оцінки потрібні дані PVGIS або Meteonorm за конкретною адресою.`; }
function renderTables(){ const S=GEN.seasons, Mo=GEN.months; const row=a=>`<tr>${a.map((c,i)=>`<td${i?' class="n"':''}>${c}</td>`).join('')}</tr>`;
  $('#gtabbody').innerHTML=`<div class="tw"><table class="spec"><thead><tr><th>Доба</th><th>Очікувано, МВт·год</th><th>Від</th><th>До</th></tr></thead><tbody>${S.map(o=>row([`${o.n}, ${o.lab}`,mwh(o.E.typ),mwh(o.E.over),mwh(o.E.clear)])).join('')}</tbody></table></div>`+
   `<div class="tw"><table class="spec"><thead><tr><th>Місяць</th><th>Очікувано, МВт·год</th><th>±, %</th><th>Ясно</th><th>Хмарно</th></tr></thead><tbody>${Mo.map(o=>row([o.n,mwh(o.E.typ),Math.round(o.u*100),mwh(o.E.clear),mwh(o.E.over)])).join('')}</tbody></table></div>`; }
runEnergy(); updateSun();
