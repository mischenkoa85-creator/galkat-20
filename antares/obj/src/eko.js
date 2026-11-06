// ================= Розділ «Економіка» (src/eko.js, 05.11.2026) — дані EKO з розрахунку ses-uze-modul (calc/eko/eko_twin.py)
// Власник 05.11: «зроби повну 3D-модель» → «Економіка в моделі». Етап 1 — план етапу 1 (754,8 кВтп + 4 контейнери), «Разом» — весь об'єкт,
// «Етап 2» — приріст етапу 2 до етапу 1. Режим видачі — перемикач у панелі. Модель на екрані — як в «Об'єкті».
{ if(window.__twin.clean&&typeof EKO!=='undefined'){
const ST=window.__twin.stages, E=EKO;
const usd=v=>nf(Math.round(v))+' $', kusd=v=>Math.abs(v)<1?'0 $':Math.abs(v)>=1e6?nf(v/1e6,Math.abs(v)%1e6?1:0)+' млн $':nf(Math.round(v/1000))+' тис. $', yr=v=>v==null?'—':nf(v,1)+' р.';
const tb=$('#tabs'), bt=document.createElement('button'); bt.type='button'; bt.setAttribute('role','tab'); bt.dataset.s='eko'; bt.textContent='Економіка'; tb.appendChild(bt);
bt.onclick=()=>{ state.sec='eko'; if(state.sheet==='peek') sheetSet('half'); apply(); };
if(!ONSECS.includes('eko')) ONSECS.push('eko');
if(!state.lay.ekoM) state.lay.ekoM=E.rec.mode;
{ const st=document.createElement('style'); st.textContent=`.eko{display:contents} .eko > .wide,.eko > .ph,.eko > .kpis{grid-column:1/-1} .eko .seg{margin:4px 0 2px;display:inline-flex} .eko .ph{display:block} .eko .cv{max-width:760px} .eko .cmp td.n{font-family:var(--mono)} .eko tr.cur td{background:var(--surface-2)}
.eko .bar{display:inline-block;height:6px;border-radius:3px;background:var(--accent);opacity:.7;vertical-align:middle;margin-left:6px}
.eko .note{font-size:12px;color:var(--ink-3);margin:4px 0 0} .eko .ass{margin:0;padding:0;list-style:none;display:grid;gap:5px;font-size:12.5px;color:var(--ink-2)} .eko .ass b{color:var(--ink);font-weight:600}
.eko .cv .l2{fill:none;stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4} .eko .cv .z{stroke:var(--ink-2);stroke-width:1} .eko .cv .pb{fill:var(--accent);stroke:var(--surface);stroke-width:2}
.eko .cv .dl{font:600 11px var(--font)} .eko .cv .dl.a{fill:var(--accent)} .eko .cv .dl.b{fill:var(--ink-3)}`; document.head.appendChild(st); }
const V=()=>E.var[state.lay.ekoM]||E.var[E.rec.mode];
// вибір за етапом: 1 — план етапу 1; all — весь об'єкт; 2 — приріст (весь об'єкт мінус етап 1)
function pick(){ const vv=V(), stg=state.lay.stg, a=vv.plan, b=vv.max;
  if(stg==='1') return {x:a,ttl:'Етап 1 · АБК, фасади, ліхтарі, склад + 4 контейнери',kod:'plan'};
  if(stg==='2'){ const d={n:'Етап 2 — приріст',pv:b.pv-a.pv,nb:0,cap:{ses:b.cap.ses-a.cap.ses,uze:0,ems:0,razom:b.cap.razom-a.cap.razom},ef:b.ef-a.ef,om:b.om-a.om,npv:b.npv-a.npv,ses:b.ses-a.ses,out:b.out-a.out,grid:b.grid-a.grid,dis:0,cyc:0,irr:null};
    d.ok=d.ef-d.om>0?d.cap.razom/(d.ef-d.om):null; d.cum=b.cum.map((v,i)=>v-a.cum[i]); return {x:d,ttl:'Етап 2 · дах цеху — приріст до етапу 1',kod:'d2'}; }
  return {x:b,ttl:'Весь об\'єкт · етапи 1 і 2 + 4 контейнери',kod:'max'}; }
// крива: накопичений грошовий потік за роками
function chart(A,B){ const W=640,H=230,l=58,r=86,t=14,b=28, all=[...A.cum,...(B?B.cum:[])], y0=Math.min(0,...all), y1=Math.max(...all), n=A.cum.length-1;
  const X=i=>l+(W-l-r)*i/n, Y=v=>t+(H-t-b)*(1-(v-y0)/(y1-y0||1)), step=Math.pow(10,Math.floor(Math.log10((y1-y0)/4))), st=[1,2,2.5,5,10].map(k=>k*step).find(s=>(y1-y0)/s<=6);
  let g=''; for(let v=Math.ceil(y0/st)*st; v<=y1; v+=st) g+=`<line class="gl" x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ya" x="${l-6}" y="${Y(v)+3}">${kusd(v)}</text>`;
  for(let i=0;i<=n;i+=n>10?5:1) g+=`<text class="xa" x="${X(i)}" y="${H-8}">${i}</text>`;
  const path=c=>c.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(''), pb=A.ok!=null&&A.ok<=n?A.ok:null;
  return `<div class="cv" id="ekoCv" data-n="${n}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Накопичений грошовий потік за роками">${g}
  <line class="z" x1="${l}" x2="${W-r}" y1="${Y(0)}" y2="${Y(0)}"/>${B?`<path class="l2" d="${path(B.cum)}"/><text class="dl b" x="${W-r+6}" y="${Y(B.cum[n])+4}">${B.n}</text>`:''}
  <path class="lc" d="${path(A.cum)}"/><text class="dl a" x="${W-r+6}" y="${Y(A.cum[n])+4}">${A.n}</text>${pb!=null?`<circle class="pb" cx="${X(pb)}" cy="${Y(0)}" r="5"/><text class="xa" x="${X(pb)}" y="${Y(0)-9}">окупність ${nf(pb,1)}</text>`:''}
  <line class="hx" id="ekoHx" x1="0" x2="0" y1="${t}" y2="${H-b}" style="display:none"/><rect x="${l}" y="${t}" width="${W-l-r}" height="${H-t-b}" fill="transparent" id="ekoHit"/></svg><div class="ctip" id="ekoTip" style="display:none"></div></div>
  <div class="lg"><span><i class="ln c"></i>${A.n}</span>${B?`<span><i class="ln" style="background:var(--ink-3)"></i>${B.n} — без накопичувачів</span>`:''}<span>рік 0 — капвитрати; далі ефект мінус експлуатація${A.zam&&A.zam.length?`, у рік ${A.zam.join(', ')} — заміна УЗЕ`:''}</span></div>`; }
function bindChart(A,B){ const cv=$('#ekoCv'); if(!cv) return; const svg=cv.querySelector('svg'), hit=$('#ekoHit'), hx=$('#ekoHx'), tip=$('#ekoTip'), n=A.cum.length-1;
  const mv=e=>{ const R=svg.getBoundingClientRect(), vb=svg.viewBox.baseVal, x=(e.clientX-R.left)/R.width*vb.width, l=58, w=vb.width-58-86, i=Math.max(0,Math.min(n,Math.round((x-l)/w*n))), px=l+w*i/n;
    hx.setAttribute('x1',px); hx.setAttribute('x2',px); hx.style.display=''; tip.style.display=''; tip.innerHTML=`<b>Рік ${i}</b><br>${A.n}: ${usd(A.cum[i])}${B?`<br>${B.n}: ${usd(B.cum[i])}`:''}`;
    const tx=px/vb.width*R.width; tip.style.left=Math.min(R.width-tip.offsetWidth-4,Math.max(0,tx+10))+'px'; tip.style.top='8px'; };
  hit.addEventListener('pointermove',mv); hit.addEventListener('pointerdown',mv); hit.addEventListener('pointerleave',()=>{ hx.style.display='none'; tip.style.display='none'; }); }
function panelEKO(){ const vv=V(), P=pick(), x=P.x, m=state.lay.ekoM, mN=E.modes.find(q=>q[0]===m)[1], f0=v=>nf(v,0), f1=v=>nf(v,1);
  const seg=`<div class="seg" role="group" aria-label="Режим видачі в мережу">${E.modes.map(([k,t])=>`<button type="button" data-ekom="${k}" aria-pressed="${k===m}">${k==='lim'?'Видача до 2 000 кВт':t}</button>`).join('')}</div>`;
  const ef1=x.ef-x.om;
  const kp=`<div class="kpis"><div class="kpi"><span class="k">Капвитрати</span><span class="v">${f0(x.cap.razom/1000)} <small>тис. $</small></span><span class="s">СЕС ${kusd(x.cap.ses)}${x.cap.uze?` · УЗЕ і EMS ${kusd(x.cap.uze+x.cap.ems)}`:''}</span></div>
  <div class="kpi"><span class="k">Ефект за рік</span><span class="v">${f0(x.ef/1000)} <small>тис. $</small></span><span class="s">мінус експлуатація ${kusd(x.om)} → ${kusd(ef1)}</span></div>
  <div class="kpi"><span class="k">Окупність</span><span class="v">${x.ok!=null?f1(x.ok):'—'} <small>${x.ok!=null&&Math.round(x.ok*10)%10?'року':'років'}</small></span><span class="s">${x.irr!=null?`IRR ${f1(x.irr)} %`:'проста, без дисконтування'}</span></div>
  <div class="kpi"><span class="k">NPV за 20 років</span><span class="v">${f0(x.npv/1000)} <small>тис. $</small></span><span class="s">ставка 10 %</span></div></div>`;
  const order=['plan','half','max','min'], rowsV=order.map(k=>{ const v=vv[k]; if(!v) return ''; const cur=(P.kod===k)||(P.kod==='d2'&&k==='max');
    return `<tr class="${cur?'cur':''}"><td class="w">${v.n}<small>${k==='plan'?'АБК, фасади, ліхтарі, склад':k==='max'?'етапи 1 і 2':k==='half'?'половина модулів, 4 контейнери':'без накопичувачів'}</small></td><td class="n">${f1(v.pv)}</td><td class="n">${v.nb?v.nb+' × 500':'—'}</td><td class="n">${f0(v.cap.razom/1000)}</td><td class="n">${f0(v.ef/1000)}</td><td class="n">${v.ok!=null?f1(v.ok):'—'}</td><td class="n">${v.irr!=null?f1(v.irr)+' %':'—'}</td><td class="n">${f0(v.npv/1000)}</td></tr>`; }).join('');
  const opt=vv.opt&&vv.max&&Math.abs(vv.opt.pv-vv.max.pv)<0.1&&vv.opt.nb===vv.max.nb;
  const B=P.kod==='d2'?null:vv.min;
  const enr=[['Генерація СЕС',x.ses],['з неї — у мережу',x.out],['Розряд накопичувачів',x.dis],['Купівля з мережі',x.grid]].filter(r=>r[1]||r[0]==='Генерація СЕС');
  const sm=Math.max(...E.sens.map(r=>r[3]||0));
  const sens=E.sens.map(r=>`<tr${r[0].startsWith('Базов')?' class="cur"':''}><td class="w">${r[0].replace(' -',' −')}</td><td class="n">${f0(r[1]/1000)}</td><td class="n">${f0(r[2]/1000)}</td><td class="n">${f1(r[3])}<span class="bar" style="width:${Math.round(48*r[3]/sm)}px"></span></td></tr>`).join('');
  const hist=E.hist.map(h=>`<tr><td class="w">${h[0]}<small>${h[1]} діб${h[1]<365?' (неповний рік)':''}</small></td><td class="n">${f0(h[4]/1000)}</td><td class="n">${nf(h[5],2)}</td></tr>`).join('');
  return `<div class="eko"><div class="ph"><span class="eyebrow ours">Економіка · ${mN.toLowerCase()}</span><h2>${P.ttl}</h2>
  <p>${f1(x.pv)} кВтп${x.nb?' · накопичувачі '+x.nb+' × 500 кВт / 1 205 кВт·год':''} · ефект ${usd(x.ef)} на рік · окупність ${x.ok!=null?nf(x.ok,1)+' року':'—'}. Розрахунок модуля «СЕС + УЗЕ» від ${E.date.split('-').reverse().join('.')}: погодинно за рік ${E.period.map(d=>d.split('-').reverse().join('.')).join(' – ')}.</p>${seg}</div>
  ${kp}
  <div class="blk wide"><h3>Накопичений грошовий потік</h3>${chart(x,B)}</div>
  <div class="blk wide"><h3>Розміри СЕС і накопичувачів · ${mN.toLowerCase()}</h3><div class="tw"><table class="cmp an"><thead><tr><th>Варіант</th><th>СЕС, кВтп</th><th>УЗЕ, кВт</th><th>Капвитрати, тис. $</th><th>Ефект, тис. $/рік</th><th>Окупність, років</th><th>IRR</th><th>NPV, тис. $</th></tr></thead><tbody>${rowsV}</tbody></table></div>
  <p class="note">${opt?'Оптимальний за NPV розмір збігається з «Весь об\'єкт». ':''}Видача до 2 000 кВт дає ${kusd((E.var.lim.max.ef-E.var.zero.max.ef))} на рік більше, ніж нульовий експорт: надлишок сонячних годин іде в мережу.</p></div>
  <div class="blk"><h3>Енергія за рік</h3><table class="cmp an"><tbody>${enr.map(([t,v])=>`<tr><td class="w">${t}</td><td class="n">${f1(v)} МВт·год</td></tr>`).join('')}
  <tr><td class="w">Споживання цеху</td><td class="n">${E.cons?nf(E.cons,0):'—'} МВт·год</td></tr>${x.cyc?`<tr><td class="w">Циклів накопичувачів</td><td class="n">${x.cyc} за рік</td></tr>`:''}</tbody></table></div>
  <div class="blk"><h3>Від чого залежить окупність · весь об'єкт, видача до 2 000 кВт</h3><table class="cmp an"><thead><tr><th>Зміна</th><th>Ефект, тис. $</th><th>NPV, тис. $</th><th>Окупність</th></tr></thead><tbody>${sens}</tbody></table></div>
  <div class="blk"><h3>Ефект при цінах різних років · весь об'єкт</h3><table class="cmp an"><thead><tr><th>Рік</th><th>Ефект, тис. $</th><th>Курс, грн/$</th></tr></thead><tbody>${hist}</tbody></table></div>
  <div class="blk"><h3>Звідки цифри</h3><ul class="ass">${E.ass.map(([k,t])=>`<li><b>${k}:</b> ${t}</li>`).join('')}</ul></div>
  <div class="blk"><h3>Щоб розрахунок став остаточним</h3><ul class="open">${E.need.map(t=>`<li>${t}</li>`).join('')}</ul></div></div>`; }
const ap0=apply; apply=function(){ if(state.sec!=='eko') return ap0.apply(this,arguments);
  state.sec='pz'; try{ ap0.apply(this,arguments); } finally{ state.sec='eko'; }
  document.querySelectorAll('#tabs button').forEach(b=>{ const on=b.dataset.s==='eko'; b.setAttribute('aria-selected',on?'true':'false'); if(on){ const x=b.offsetLeft-tb.clientWidth/2+b.offsetWidth/2; tb.scrollTo({left:Math.max(0,x)}); } });
  const pane=$('#pane'); pane.innerHTML=panelEKO();
  pane.querySelectorAll('[data-ekom]').forEach(b=>b.onclick=()=>{ state.lay.ekoM=b.dataset.ekom; apply(); });
  const P=pick(); bindChart(P.x,P.kod==='d2'?null:V().min); save(); };
window.__twin.apply=apply; window.__twin.eko={panelEKO,pick};
try{ const s=JSON.parse(localStorage.getItem('antares-twin-v1')||'null'); if(s&&s.sec==='eko'){ state.sec='eko'; apply(); } }catch(e){}
} }
