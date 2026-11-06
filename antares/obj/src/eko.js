// ================= Розділ «Економіка» (src/eko.js, 06.11.2026) — дані KALK з калькулятора ses-uze-modul (calc/eko/kalk_twin.py)
// Власник 06.11: економіку рахуємо лише з пільгою ч. 10 ст. 58-1, 4 і 8 контейнерів, контейнер під ключ, споживання 1 100 / 3 000 / 5 000 МВт·год.
// Етап 1 — СЕС етапу 1 + 4 контейнери, «Разом» — весь об'єкт + 4 або 8 контейнерів, «Етап 2» — приріст до етапу 1. Перемикачі спільні з «Сценаріями».
{ if(window.__twin.clean&&typeof KALK!=='undefined'){
const ST=window.__twin.stages, K=KALK;
const usd=v=>nf(Math.round(v))+' $', kusd=v=>Math.abs(v)<1?'0 $':Math.abs(v)>=1e6?nf(v/1e6,Math.abs(v)%1e6?1:0)+' млн $':nf(Math.round(v/1000))+' тис. $', yr=v=>v==null?'—':nf(v,1)+' р.';
const tb=$('#tabs'), bt=document.createElement('button'); bt.type='button'; bt.setAttribute('role','tab'); bt.dataset.s='eko'; bt.textContent='Економіка'; tb.appendChild(bt);
bt.onclick=()=>{ state.sec='eko'; if(state.sheet==='peek') sheetSet('half'); apply(); };
if(!ONSECS.includes('eko')) ONSECS.push('eko');
{ const st=document.createElement('style'); st.textContent=`.eko{display:contents} .eko > .wide,.eko > .ph,.eko > .kpis{grid-column:1/-1} .eko .seg{margin:4px 0 2px;display:inline-flex} .eko .kb{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 6px} .eko .kb button{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:5px 10px;font:inherit;font-size:12.5px;color:var(--ink)} .eko .kb button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)} .eko .ph{display:block} .eko .cv{max-width:760px} .eko .cmp td.n{font-family:var(--mono)} .eko tr.cur td{background:var(--surface-2)}
.eko .bar{display:inline-block;height:6px;border-radius:3px;background:var(--accent);opacity:.7;vertical-align:middle;margin-left:6px}
.eko .note{font-size:12px;color:var(--ink-3);margin:4px 0 0} .eko .ass{margin:0;padding:0;list-style:none;display:grid;gap:5px;font-size:12.5px;color:var(--ink-2)} .eko .ass b{color:var(--ink);font-weight:600}
.eko .cv .l2{fill:none;stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4} .eko .cv .z{stroke:var(--ink-2);stroke-width:1} .eko .cv .pb{fill:var(--accent);stroke:var(--surface);stroke-width:2}
.eko .cv .dl{font:600 11px var(--font)} .eko .cv .dl.a{fill:var(--accent)} .eko .cv .dl.b{fill:var(--ink-3)}`; document.head.appendChild(st); }
const RN_={lim:'видача до 2 МВт',zero:'нульовий експорт'}, kont=n=>n%10===1&&n%100!==11?'контейнер':[2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?'контейнери':'контейнерів';
const hor=()=>K.in.horyzont_rokiv, okv=v=>v!=null&&v<=hor()?v:null;
// вибір: споживання і режим — спільні зі «Сценаріями»; кількість контейнерів — для всього об'єкта (етап 1 — завжди 4)
function sel(){ const i=Math.min(Math.max(+(state.lay.scI??1),0),K.sc.length-1), r=state.lay.scR||'lim', S=K.sc[i], nV=[...new Set(S.vse.map(x=>x.n))].filter(n=>n).sort((a,b)=>a-b);
  const n=nV.includes(+state.lay.ekoN)?+state.lay.ekoN:nV[0], g=(arr,k)=>arr.find(x=>x.n===k&&x.rezhym===r); return {i,r,S,n,nV,g}; }
function pick(){ const {S,n,g}=sel(), a=g(S.e1,4), a0=g(S.e1,0), b=g(S.vse,n), b0=g(S.vse,0), stg=state.lay.stg;
  const lab=(x,t)=>Object.assign({},x,{nm:t,ok:okv(x.okupnist)});
  if(stg==='1') return {x:lab(a,'Етап 1 + 4 контейнери'),ref:lab(a0,'Етап 1 без накопичувачів'),ttl:'Етап 1 · АБК, фасади, ліхтарі, склад + 4 контейнери',kwp:K.kwp.e1,nb:4,kod:'e1'};
  if(stg==='2'){ const cum=b.cum.map((v,k)=>v-a.cum[k]); let pb=null; for(let k=1;k<cum.length;k++) if(cum[k]>=0&&cum[k-1]<0){ pb=k-1+(-cum[k-1])/(cum[k]-cum[k-1]); break; }
    const d={nm:`Етап 2 — приріст${n>4?` (+${n-4} ${kont(n-4)})`:''}`,capex:{ses:b.capex.ses-a.capex.ses,uze:b.capex.uze-a.capex.uze,ems:b.capex.ems-a.capex.ems,inshe:(b.capex.inshe||0)-(a.capex.inshe||0),razom:b.capex.razom-a.capex.razom},
      efekt_usd:b.efekt_usd-a.efekt_usd,efekt_ses_usd:b.efekt_ses_usd-a.efekt_ses_usd,om:b.om-a.om,om1:b.om1-a.om1,npv:b.npv-a.npv,irr:null,cum,ok:pb,okupnist:pb,
      mwh:Object.fromEntries(Object.keys(b.mwh).map(k=>[k,b.mwh[k]-a.mwh[k]])),tsykly_rik:null,dni:null,zamina_roky:[]};
    return {x:d,ref:null,ttl:`Етап 2 · дах цеху — приріст до етапу 1`,kwp:K.kwp.vse-K.kwp.e1,nb:n-4,kod:'d2'}; }
  return {x:lab(b,`Весь об'єкт + ${n} ${kont(n)}`),ref:lab(b0,'Весь об\'єкт без накопичувачів'),ttl:`Весь об'єкт · етапи 1 і 2 + ${n} ${kont(n)}`,kwp:K.kwp.vse,nb:n,kod:'vse'}; }
function panelEKO(){ const {i,r,S,n,nV,g}=sel(), P=pick(), x=P.x, I=K.in, f0=v=>nf(v,0), f1=v=>nf(v,1), mln=v=>(v<0?'−':'')+nf(Math.abs(v)/1e6,2);
  const per=K.period.map(d=>d.split('-').reverse().join('.')).join(' – '), ef1=x.efekt_usd-x.om, M=x.mwh, gen=M.pl+M.pb+M.px+M.pc;
  const kb=`<div class="kb" role="group" aria-label="Споживання за рік">${K.sc.map((s_,k)=>`<button type="button" data-sci="${k}" aria-pressed="${k===i}">${nf(s_.mwh)} МВт·год</button>`).join('')}</div>
  <div class="kb" role="group" aria-label="Видача в мережу">${[['lim','Видача до 2 МВт'],['zero','Нульовий експорт']].map(([k,t])=>`<button type="button" data-scr="${k}" aria-pressed="${k===r}">${t}</button>`).join('')}</div>
  ${state.lay.stg==='1'?'<p class="note">Етап 1 — 4 контейнери. 8 — лише для всього об\'єкта.</p>':`<div class="kb" role="group" aria-label="Контейнерів на весь об'єкт">${nV.map(k=>`<button type="button" data-ekon="${k}" aria-pressed="${k===n}">${k} ${kont(k)}</button>`).join('')}</div>`}`;
  const kp=`<div class="kpis"><div class="kpi"><span class="k">Капвитрати</span><span class="v">${f0(x.capex.razom/1000)} <small>тис. $</small></span><span class="s">СЕС ${kusd(x.capex.ses)}${x.capex.uze?` · контейнери ${kusd(x.capex.uze)}`:''}${x.capex.ems?` · EMS ${kusd(x.capex.ems)}`:''}${x.capex.inshe?` · робот ${kusd(x.capex.inshe)}`:''} · без ПДВ</span></div>
  <div class="kpi"><span class="k">Ефект за рік</span><span class="v">${f0(x.efekt_usd/1000)} <small>тис. $</small></span><span class="s">з нього СЕС ${kusd(x.efekt_ses_usd)} · мінус обслуговування ${kusd(x.om)} → ${kusd(ef1)}${x.om1!==x.om?` (1-й рік обслуговування ${kusd(x.om1)})`:''}</span></div>
  <div class="kpi"><span class="k">Окупність</span><span class="v">${x.ok!=null?f1(x.ok)+' <small>року</small>':'<small>не окупається за '+hor()+' років</small>'}</span><span class="s">${x.irr!=null?`IRR ${f1(x.irr)} %`:'з заміною батарей і експлуатацією'}</span></div>
  <div class="kpi"><span class="k">NPV за ${hor()} років</span><span class="v">${mln(x.npv)} <small>млн $</small></span><span class="s">ставка ${nf(I.stavka_pct)} %</span></div></div>`;
  const row=(t,sm,v,cur)=>v?`<tr class="${cur?'cur':''}"><td class="w">${t}<small>${sm}</small></td><td class="n">${f0(v.capex.razom/1000)}</td><td class="n">${f0(v.efekt_usd/1000)}</td><td class="n">${okv(v.okupnist)!=null?f1(v.okupnist):'—'}</td><td class="n">${mln(v.npv)}</td><td class="n">${v.irr!=null?f1(v.irr)+' %':'—'}</td></tr>`:'';
  const rows=row('Етап 1 + 4 контейнери',`${f1(K.kwp.e1)} кВтп · АБК, фасади, ліхтарі, склад`,g(S.e1,4),P.kod==='e1')+row('Етап 1 без накопичувачів',`${f1(K.kwp.e1)} кВтп`,g(S.e1,0),false)
    +nV.map(k=>row(`Весь об'єкт + ${k} ${kont(k)}`,`${f1(K.kwp.vse)} кВтп · етапи 1 і 2`,g(S.vse,k),(P.kod==='vse'||P.kod==='d2')&&k===n)).join('')+row('Весь об\'єкт без накопичувачів',`${f1(K.kwp.vse)} кВтп`,g(S.vse,0),false);
  const enr=[['Генерація СЕС',gen],['з неї — у мережу',M.px],['з неї — обрізано (нікуди віддати)',M.pc],['Розряд накопичувачів',M.bl+M.bx],['з нього — у мережу',M.bx],['Купівля з мережі',M.gl+M.gb],['з неї — на заряд накопичувачів',M.gb]].filter(q=>Math.abs(q[1])>=0.5||q[0]==='Генерація СЕС');
  const zam=x.zamina_roky&&x.zamina_roky.length?`${x.zamina_roky.map(y=>y+'-й').join(', ')} рік · ${nf(P.nb*I.uze_zamina_usd)} $`:'';
  const ass=[['Споживання',`${nf(S.mwh)} МВт·год за рік (сценарій власника), у середньому ${nf(S.kw)} кВт, зимою на ${nf(I.zyma_lito_pct)} % більше, ніж улітку, цілодобово — погодинних даних АСКОЕ немає`],
    ['Ціни',`РДН погодинно ${per} + передача, диспетчеризація і розподіл ДТЕК на дату кожної доби; ціни відомі наперед — верхня межа керування (EMS)`],
    ['Закон',`лише з пільгою ч. 10 ст. 58-1: передача і розподіл на заряд з мережі — тільки з різниці місячного відбору і відпуску накопичувачів`],
    ['Сонце',`генерація груп цього двійника (${nf(K.kwp.vse,1)} кВтп, ≈${nf(K.gen.vse)} МВт·год за рік), форма доби — за орієнтацією кожної групи`],
    ['Капвитрати',`СЕС ${nf(I.capex_ses_usd_kwp)} $/кВтп (кошторис під ключ 26.10); контейнер під ключ ${nf(I.capex_uze_usd)} $ (${K.pr.capex_uze_usd}); EMS ${nf(I.capex_ems_usd)} $${I.capex_inshe_usd?`; робот для очищення модулів ${nf(I.capex_inshe_usd)} $ (з доставкою і розмитненням, у кожному варіанті з СЕС)`:''}; без ПДВ`],
    ['Накопичувачі',`${nf(I.uze_kw)} кВт / ${nf(I.uze_kwh)} кВт·год, розряд до ${nf(I.uze_dod_pct)} %, ККД циклу ${nf(I.uze_kkd_pct)} %, до ${nf(I.uze_tsykliv_doba)} циклів на добу; знос ${nf(K.znos,2)} грн/кВт·год — заміна батарей ${nf(I.uze_zamina_usd)} $ на контейнер за ${nf(I.uze_resurs_tsykliv)} циклів (умовно) або ${nf(I.uze_strok_rokiv)} років`],
    ['Видача',`до ${nf(I.vydacha_stsenarii_kw)} кВт — сценарій, ТУ немає; продаж за РДН`],
    ['Обслуговування',I.servis_usd_rik!=null?`${nf(I.servis_usd_rik)} $ на рік з другого року, перший рік ${nf(I.servis_rik1_usd??I.servis_usd_rik)} $ (власник, 06.11) — сервіс, витратні, роботи, ремонти; однакове для всіх варіантів`:`${nf(I.ekspl_pct,2)} % капвитрат на рік`],
    ['Фінанси',`горизонт ${hor()} років, ставка ${nf(I.stavka_pct)} %, деградація модулів ${nf(I.degr_ses_pct,1)} % на рік`],
    ['Не враховано','ПДВ, мито, кредит, небаланси, реактивна енергія, резерв від відключень, втрата ємності батарей з роками, мідні лінії до ТП для контейнерів 5–8']];
  const need=['Погодинні дані АСКОЕ за 12–36 місяців по трьох точках обліку — замість сценаріїв споживання','Договірна потужність — зараз відбір з мережі не обмежено','ТУ на видачу 2 МВт','Статус активного споживача і окремий облік накопичувачів (ч. 5 ст. 58-1)','Гарантія Golen: ресурс циклів і залишкова ємність','Місце і лінії до ТП для контейнерів 5–8'];
  return `<div class="eko"><div class="ph"><span class="eyebrow ours">Економіка · ${RN_[r]} · ${nf(S.mwh)} МВт·год</span><h2>${P.ttl}</h2>
  <p>${f1(P.kwp)} кВтп${P.nb>0?` · ${P.kod==='d2'?'+':''}${P.nb} ${kont(P.nb)} по ${nf(I.uze_kw)} кВт / ${nf(I.uze_kwh)} кВт·год`:''} · ефект ${usd(x.efekt_usd)} на рік · окупність ${x.ok!=null?nf(x.ok,1)+' року':'— не окупається'}. Розрахунок ${K.date.split('-').reverse().join('.')}, з пільгою ч. 10 ст. 58-1.</p></div>
  <div class="blk wide">${kb}</div>${kp}
  <div class="blk wide"><h3>Накопичений грошовий потік</h3>${chart({n:P.kod==='d2'?'етап 2':`${P.nb} конт.`,l:x.nm,cum:x.cum,ok:x.ok,zam:x.zamina_roky},P.ref?{n:'лише СЕС',l:P.ref.nm,cum:P.ref.cum}:null)}${zam?`<p class="note">Заміна батарей: ${zam}.</p>`:''}</div>
  <div class="blk wide"><h3>Варіанти · ${nf(S.mwh)} МВт·год, ${RN_[r]}</h3><div class="tw"><table class="cmp an"><thead><tr><th>Варіант</th><th>Капвитрати, тис. $</th><th>Ефект, тис. $/рік</th><th>Окупність, років</th><th>NPV, млн $</th><th>IRR</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="note">Інші обсяги споживання і окупність додаткових контейнерів — «Сценарії»; доба накопичувачів — «Арбітраж».</p></div>
  <div class="blk"><h3>Енергія за рік</h3><table class="cmp an"><tbody>${enr.map(([t,v])=>`<tr><td class="w">${t}</td><td class="n">${f1(v)} МВт·год</td></tr>`).join('')}
  <tr><td class="w">Споживання цеху</td><td class="n">${nf(S.mwh)} МВт·год</td></tr>${x.tsykly_rik?`<tr><td class="w">Циклів накопичувачів</td><td class="n">${nf(x.tsykly_rik)} за рік · ${nf(x.dni['2'])} діб з двома</td></tr>`:''}</tbody></table></div>
  <div class="blk"><h3>Звідки цифри</h3><ul class="ass">${ass.map(([k,t])=>`<li><b>${k}:</b> ${t}</li>`).join('')}</ul></div>
  <div class="blk"><h3>Щоб розрахунок став остаточним</h3><ul class="open">${need.map(t=>`<li>${t}</li>`).join('')}</ul></div></div>`; }
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
  <div class="lg"><span><i class="ln c"></i>${A.l||A.n}</span>${B?`<span><i class="ln" style="background:var(--ink-3)"></i>${B.l||B.n}</span>`:''}<span>рік 0 — капвитрати; далі ефект мінус обслуговування${A.zam&&A.zam.length?` і заміна батарей у ${A.zam.join(', ')}-й рік`:''}</span></div>`; }
function bindChart(A,B){ const cv=$('#ekoCv'); if(!cv) return; const svg=cv.querySelector('svg'), hit=$('#ekoHit'), hx=$('#ekoHx'), tip=$('#ekoTip'), n=A.cum.length-1;
  const mv=e=>{ const R=svg.getBoundingClientRect(), vb=svg.viewBox.baseVal, x=(e.clientX-R.left)/R.width*vb.width, l=58, w=vb.width-58-86, i=Math.max(0,Math.min(n,Math.round((x-l)/w*n))), px=l+w*i/n;
    hx.setAttribute('x1',px); hx.setAttribute('x2',px); hx.style.display=''; tip.style.display=''; tip.innerHTML=`<b>Рік ${i}</b><br>${A.n}: ${usd(A.cum[i])}${B?`<br>${B.n}: ${usd(B.cum[i])}`:''}`;
    const tx=px/vb.width*R.width; tip.style.left=Math.min(R.width-tip.offsetWidth-4,Math.max(0,tx+10))+'px'; tip.style.top='8px'; };
  hit.addEventListener('pointermove',mv); hit.addEventListener('pointerdown',mv); hit.addEventListener('pointerleave',()=>{ hx.style.display='none'; tip.style.display='none'; }); }
const ap0=apply; apply=function(){ if(state.sec!=='eko') return ap0.apply(this,arguments);
  state.sec='pz'; try{ ap0.apply(this,arguments); } finally{ state.sec='eko'; }
  document.querySelectorAll('#tabs button').forEach(b=>{ const on=b.dataset.s==='eko'; b.setAttribute('aria-selected',on?'true':'false'); if(on){ const x=b.offsetLeft-tb.clientWidth/2+b.offsetWidth/2; tb.scrollTo({left:Math.max(0,x)}); } });
  const pane=$('#pane'); pane.innerHTML=panelEKO();
  pane.querySelectorAll('[data-sci]').forEach(b=>b.onclick=()=>{ state.lay.scI=+b.dataset.sci; apply(); });
  pane.querySelectorAll('[data-scr]').forEach(b=>b.onclick=()=>{ state.lay.scR=b.dataset.scr; apply(); });
  pane.querySelectorAll('[data-ekon]').forEach(b=>b.onclick=()=>{ state.lay.ekoN=+b.dataset.ekon; apply(); });
  const P=pick(); bindChart({n:P.x.nm,cum:P.x.cum},P.ref?{n:P.ref.nm,cum:P.ref.cum}:null); save(); };
window.__twin.apply=apply; window.__twin.eko={panelEKO,pick};
try{ const s=JSON.parse(localStorage.getItem('antares-twin-v1')||'null'); if(s&&s.sec==='eko'){ state.sec='eko'; apply(); } }catch(e){}
} }
