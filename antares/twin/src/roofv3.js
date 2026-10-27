// ================= v3 (27.10.2026, вечір): дах за обмірами і супутником — src/roofv3.js (дані ROOFV2.C/D/E/V3 ← calc/v3/twin_v3_export.py)
// Дефлектори, «грибочки» й труби на даху цеху — за супутниковим знімком Google (до 2026) і РП; ліхтарі 3,66 × 1,89 і парапети 1,37 — рулетка 27.10.
// Варіанти розкладки: А — усі вільні місця, Б — від 1 050 кВт·год/м², В — від 1 100 кВт·год/м² (перемикач над моделлю). Карта опромінення 0,5 м — у «Сонці» → «Радіація, м²».
{
const R2=ROOFV2, D3=R2.V3; if(D3){
const v2=()=>window.__twin.v2;
const DG3=grp('defl3',G.site);
const dfM={base:std(lin(0x4a4f53),{roughness:0.8}), cap:std(lin(0x9b5a33),{roughness:0.7,metalness:0.2}), capW:std(lin(0xd9dcde),{roughness:0.5,metalness:0.3})};
const LIVE=D3.defl.filter(o=>o[6]==='є'||o[6]==='уточнити');
const DFTXT=o=>`№ ${o[0]} · X ${nf(o[1],1)}, Y ${nf(o[2],1)} м · Ø${nf(o[3],2)} м, висота ${nf(o[4],1)} м · джерело: ${o[5]} · ${o[6]}.`;
LIVE.forEach(o=>{ const [n,x,y,d,h,src,st]=o, z=roofZ(x), big=d>=0.9, hb=big?h*0.55:h;
  const b=mesh(new THREE.CylinderGeometry(d*0.32,d*0.36,hb,14),dfM.base,DG3); b.position.set(x,z+hb/2,-y);
  const parts=[b];
  if(big){ const c=mesh(new THREE.ConeGeometry(d/2,h-hb,18),st==='є'&&src.includes('тінню')?dfM.cap:dfM.capW,DG3); c.position.set(x,z+hb+(h-hb)/2,-y); parts.push(c); }
  parts.forEach(p=>{ p.userData.info={t:big?'Дефлектор / «грибок» на даху цеху':'Труба на даху цеху (з РП)',d:`${DFTXT(o)} Навколо — 0,3 м без модулів. Розмір і висота — з РП або типові (Ø1,2 × 1,6 м), де на супутнику видно лише сам об'єкт.`}; PICK.push({o:p,when:()=>DG3.visible}); }); });
const CYL=LIVE.map(o=>{ const z=roofZ(o[1]); return [o[1],o[2],o[3]/2,z-0.05,z+o[4]]; });
const on3=()=>{ const t=v2(); return t&&t.V2ON()&&t.LK(t.sc())==='C'; };
// тіні в «Сонці»: дефлектори — циліндри (OBSC; roofv2 litV2 їх враховує)
function sync(){ const a=on3(); DG3.visible=a&&state.proj==='ours'; OBSC.length=0; if(a) CYL.forEach(c=>OBSC.push(c)); }
const sv3=setVis; setVis=function(){ sv3.apply(this,arguments); sync(); };
// ---------- панель «Загальне» для v3
const LFD=D3.lanf||{}; const VV=D3.vars, keys=['C','D','E'], NM={C:'А · усі місця',D:'Б · від 1 050',E:'В · від 1 100'}, LV=D3.lanv, ND=D3.nodefl;
window.__twin.v3panel=function(k){ const cur=q=>q===k?'cur':'', row=(t,f,cls)=>`<tr class="${cls||''}"><td>${t}</td>${keys.map(q=>`<td class="${cur(q)}">${f(VV[q],q)}</td>`).join('')}</tr>`;
  const A=VV.C, B=VV.D, C=VV.E, dAB=A.n-B.n, eAB=A.mwh-B.mwh, F=R2.fac.tot, S=R2.B;
  const cost=nf(D3.cost), val=nf(D3.val*100,1);
  return `<div class="ph"><span class="eyebrow ours">Наш варіант Б · v3 · обміри, супутник, карта опромінення · 27.10</span><h2>${nf(VV[k].n)} модулів на даху цеху · ${nf(VV[k].mwh,1)} МВт·год</h2>
  <p>Перераховано за всім, що є: розріз 1-1 (DWG), РП, супутник Google, фото й рулетка 27.10. Ліхтарі ${nf(D3.lan.w,2)} × ${nf(D3.lan.h,2)} м, торцеві парапети ${nf(D3.par,2)} м, ${LIVE.length} дефлекторів і труб на даху (за супутником і РП), рама кондиціонерів, вихід і портал. Кожне місце під модуль має своє опромінення, кВт·год/м² за рік; варіанти відрізняються порогом.</p></div>
  <table class="cmp"><thead><tr><th></th>${keys.map(q=>`<th class="ours">${NM[q]}</th>`).join('')}</tr></thead><tbody>
  ${row('Модулів = стрінгів × 11',v=>`${nf(v.n)} = ${v.st}`)}${row('кВтп',v=>nf(v.kwp,1))}${row('МВт·год за рік',v=>`<b>${nf(v.mwh,1)}</b>`,'tot')}
  ${row('кВт·год/кВтп',v=>nf(v.y))}${row('Опромінення модулів, кВт·год/м²',v=>nf(v.irr))}${row('Різна освітленість у стрінгах',v=>`−${nf(v.mism,2)} %`)}
  ${row('Вартість модулів під ключ (≈'+cost+' $/шт)',v=>`≈${nf(v.cost/1000,0)} тис. $`)}${row('Ефект за рік',v=>`≈${nf(v.rev/1000,0)} тис. $`)}${row('Окупність цієї частини',v=>`${nf(v.pb,1)} р.`)}</tbody></table>
  <p class="src">Від Б до А — ще ${nf(dAB)} модулів і ${nf(eAB,1)} МВт·год (${nf(eAB*1000/dAB/0.73)} кВт·год/кВтп): окупаються за ≈${nf(dAB*D3.cost/(eAB*1000*D3.val),1)} р. Тому найвигідніше — <b>А: ставити на всі вільні місця</b>; Б і В дають кращий кВт·год на модуль, але менше енергії і грошей. Ціна 1 кВт·год — 7,00 грн з ПДВ (оцінка власника), ККД PCS 97,5 %; ≈${cost} $ на модуль — частина СЕС кошторису під ключ 26.10 без УЗЕ (оцінка).</p>
  <div class="blk"><h3>Що змінилося проти ранку 27.10</h3><p class="src">Ранкова розкладка (ліхтар 3,40 × 1,74, без дефлекторів): ${nf(S.base.n)} модулів, ${nf(S.base.mwh,1)} МВт·год. Тепер:<br>
  • <b>Дефлектори.</b> На супутнику і фото 27.10 вони на даху (у розрахунку 26.10 їх прибрали). Під них і 0,3 м навколо — ${nf(R2.C.mods.filter(m=>m[3]==='defl').length)} місць.${ND?` Якщо при заміні покрівлі дефлектори приберуть або перенесуть: А — ${nf(ND[0].n)} модулів, ${nf(ND[0].mwh,1)} МВт·год (+${nf(ND[0].n-A.n)} модулів, +${nf(ND[0].mwh-A.mwh,1)}).`:''}<br>
  • <b>Ліхтарі вищі й ширші</b> (1,89 і 3,66 м замість 1,74 і 3,40): більше тіні на сусідні грані і на 0,25 м ширша смуга без модулів.<br>
  • <b>Парапети 1,37 м</b> замість 1,2 — трохи більше тіні в першому і останньому рядах.<br>
  • Стрінги — у межах однієї грані (однаковий кут і бік), втрати на різну освітленість пораховано по кроках 10 хв.</p></div>
  ${Object.keys(LFD).length?(()=>{ const KS=Object.keys(LFD).sort((a,b)=>a-b), LFL={'12':'за фото','17':'на око'}, X=LFD[KS[0]], SH=X.shade, M=X.mount, C=X.cost, cur=k==='C'?String(state.lay.lanF||''):'';
    const lanSh=v=>SH.none-v, row=(t,a,fn,cls)=>`<tr class="${cls||''}"><td>${t}</td><td class="${cur===''?'cur':''}">${a}</td>${KS.map(q=>`<td class="${cur===q?'cur':''}">${fn(LFD[q],q)}</td>`).join('')}</tr>`;
    const best=KS.reduce((a,q)=>LFD[q].K.roof+LFD[q].K.mwh>LFD[a].K.roof+LFD[a].K.mwh?q:a,KS[0]);
    return `<div class="blk"><h3>Ліхтарі розібрати → модулі на сталевому каркасі (27.10, вечір)</h3>
  <p class="src">Скління й дерев'яну конструкцію ліхтарів знімаємо, на сталевому каркасі шириною ${nf(2*M.frame_half,1)} м по низу (власник) — нова покрівля, зверху вертикально по 1 ряду модулів на схил. Кут кутників каркаса за 4 фото зсередини — ≈12° (11,6–13,1°; перевірка — скло ліхтаря на тих самих фото 47–48°), власник на око — 16–18°: пораховано обидва, тіні — наживо в «Сонці» (перемикачі над моделлю).</p>
  <table class="cmp"><thead><tr><th></th><th class="ours">Ліхтарі як зараз (1,89 м)</th>${KS.map(q=>`<th class="ours">Каркас ${q}°${LFL[q]?' · '+LFL[q]:''}</th>`).join('')}</tr></thead><tbody>
  ${row('Гребінь каркаса над низом каркаса','—',D=>nf(D.mount.frame_rise,2)+' м')}
  ${row('Звис модулів за край каркаса / консоль під нижню рейку','—',D=>`${nf(D.mount.edge-D.mount.frame_half,2)} / ${nf(D.mount.console,2)} м`)}
  ${row('Модулів на місці ліхтарів = стрінгів','—',D=>`${D.K.n} = ${D.K.st}`)}
  ${row('Вони дають, МВт·год за рік','—',D=>`<b>${nf(D.K.mwh,1)}</b> (${nf(D.K.y)} кВт·год/кВтп)`)}
  ${row('Тінь на самих цих модулях','—',D=>`−${nf((1-D.K.mwh/D.K.un)*100,1)} %`)}
  ${row('Тінь від ліхтарів на модулі даху',`−${nf(lanSh(SH.base),1)} МВт·год`,(D,q)=>`−${nf(lanSh(SH['t'+q]),1)} (на ${nf((1-lanSh(SH['t'+q])/lanSh(SH.base))*100)} % менше)`)}
  ${row('Дах цеху, 1 639 модулів, МВт·год',nf(A.mwh,1),D=>nf(D.K.roof,1))}
  ${row('Дах + ліхтарі',`${nf(A.n)} · ${nf(A.mwh,1)}`,D=>`${nf(A.n+D.K.n)} · <b>${nf(D.K.roof+D.K.mwh,1)}</b>`,'tot')}</tbody></table>
  <p class="src"><b>Чи зникне затінення?</b> Не повністю, але вдвічі менше: ліхтарі зараз забирають у модулів даху ${nf(lanSh(SH.base),1)} МВт·год за рік, на каркасі ${KS.map(q=>`${q}° — ${nf(lanSh(SH['t'+q]),1)}`).join(', ')}. Решта тіні на даху — −${nf(X.roof_un-SH.none,1)} МВт·год — від західної будівлі, дефлекторів, парапетів, рами кондиціонерів і граней арки; від ліхтарів вона не залежить. Різниця між ${KS.join('° і ')}° — ${nf(Math.abs((LFD[KS[0]].K.roof+LFD[KS[0]].K.mwh)-(LFD[KS[KS.length-1]].K.roof+LFD[KS[KS.length-1]].K.mwh)),1)} МВт·год за рік (більше — при ${best}°): схили дивляться на схід і захід, що положистіше — то більше сонця опівдні.</p>
  <p class="src">Монтаж однаковий: стрінг — 11 сусідніх модулів одного схилу одного ліхтаря, кабелів між ліхтарями немає; по 1 щиту PV 7/1 біля торця ліхтаря; залишки сходу й заходу — спільний стрінг (Л2-7, Л3-7, Л4-7), порожніх місць — ${X.K.places-X.K.n}. Рейки 41×41 — 2 на схил у зоні притисків ZNSHINE (540 мм від торців модуля): ${nf(M.rail,1)} м; нижня рейка — за краєм каркаса, на консолях ≈0,3 м. Кошторис під ключ 27.10 — ${nf(C.tot)} $ без ПДВ, однаковий для обох кутів; ціни розбирання скління і нової покрівлі прорізу ще немає.</p>
  <p>${KS.map(q=>`<button type="button" class="lnk lftg" data-t="${q}">Каркас ${q}°${LFL[q]?' ('+LFL[q]+')':''}</button> · `).join('')}<button type="button" class="lnk lftg" data-t="0">Ліхтарі як зараз</button></p></div>`; })():''}
  <div class="blk"><h3>Модулі на склі ліхтарів, як є (довідково)</h3><p class="src">Книжково по схилах ${nf(LV.tilt,0)}°: ${nf(LV.n)} модулів = ${LV.st} стрінги, ${nf(LV.kwp,1)} кВтп, ${nf(LV.mwh,1)} МВт·год (${nf(LV.y)} кВт·год/кВтп). Ліхтарі світлопрозорі — цех стане темнішим; рішення за вами. Перемикач «На ліхтарях» — над моделлю.</p></div>
  <div class="blk"><h3>Ще уточнити рулеткою</h3><p class="src">1) Рама кондиціонерів — від виходу на дах (зараз ±2 м; під нею 2 дефлектори з супутника, мабуть, знято). 2) Вихід і портал: за фото й супутником X ≈62–70 м — від східного краю даху. 3) Північний парапет (прийнято як південний, 1,37 м). 4) Які дефлектори лишаються після заміни покрівлі — список з номерами в описі кожного (натисніть на дефлектор).</p>
  <p><button type="button" class="lnk" id="v3rad">Карта опромінення кВт·год/м² →</button></p></div>`; };
document.addEventListener('click',e=>{ if(e.target&&e.target.id==='v3rad'){ state.sec='sun'; state.lay.rad=true; apply(); save(); }
  const lb=e.target&&e.target.closest&&e.target.closest('.lftg'); if(lb){ state.lay.lanSc='C'; state.lay.lanF=+lb.dataset.t; if(state.lay.lanF) state.lay.lanMods=false; apply(); save(); } });
window.__twin.v3init=()=>{};
window.__twin.v3={DG3,LIVE,CYL,sync}; apply();
} }
