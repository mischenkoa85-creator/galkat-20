
// ---------- node view: click a module / triangle / ballast → exploded assembly, drawing, wiring
const NODE={m:null, kind:'pv', e:0, view:'exp', parts:[], num:{}, ids:[], tw:0, hl:null};
const nodeRank={}; [...rowsMap.keys()].sort((a,b)=>a-b).forEach((k,i)=>{ nodeRank[k]=i+1; });
let nR=null, nS=null, nCam=null, nCtl=null, nRoot=null, nGuide=null, nNeed=true;
const NMAT={};
function nodeMats(){ if(NMAT.roof) return NMAT;
  Object.assign(NMAT,{ roof:lam(0xaeb3b5), mat:lam(0x2c2c2c), tri:std(0xb9c0c4,0.75,0.35), ball:lam(0x9d9a93), conn:std(0xa8b0b5,0.75,0.35), spoil:std(0xc2c8cb,0.5,0.5,{side:THREE.DoubleSide}),
    pvTop:MAT.pvL.clone(), frame:lam(0x3a4650), back:lam(0x2a2f33), clamp:std(0xe9edef,0.85,0.25), scrB:std(0xf0c030,0.8,0.3), scrT:std(0xe0662a,0.8,0.3), scrC:std(0x3a86d8,0.8,0.3),
    blk:lam(0x5c6166), seal:lam(0x151515), gofra:lam(0x23282b), cabP:lam(0xff8c1a), cabM:lam(0x111111), bond:lam(0x2fc24a), jb:lam(0x1d2124), prof:lam(0x8d989e) });
  NMAT.pvTop.transparent=false; NMAT.pvTop.opacity=1; NMAT.pvTop.depthWrite=true; return NMAT; }

function nodeInit(){ if(nR) return true; const cv=$('#nodecv');
  try{ nR=new THREE.WebGLRenderer({canvas:cv,antialias:true}); }catch(e){ return false; }
  nR.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); nR.outputEncoding=THREE.sRGBEncoding;
  nS=new THREE.Scene(); nCam=new THREE.PerspectiveCamera(35,1,0.05,60);
  nS.add(new THREE.HemisphereLight(0xeef3ff,0x8a8f7a,0.8)); const dl=new THREE.DirectionalLight(0xfff3dd,0.85); dl.position.set(2,4,3); nS.add(dl);
  nCtl=new THREE.OrbitControls(nCam,cv); nCtl.addEventListener('change',()=>{ nNeed=true; });
  new ResizeObserver(nodeResize).observe($('#nodewrap'));
  new MutationObserver(()=>{ nodeBg(); nNeed=true; }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ nodeBg(); nNeed=true; });
  nodeBg(); nodeFrame(); requestAnimationFrame(nodeLoop); return true; }
function nodeBg(){ if(nS) nS.background=new THREE.Color(css('--scene')||'#dce4e6'); }
function nodeResize(){ if(!nR) return; const w=$('#nodewrap').clientWidth, h=$('#nodewrap').clientHeight; if(!w||!h) return; nR.setSize(w,h,false); nCam.aspect=w/h; nCam.updateProjectionMatrix(); nNeed=true; }
function nodeFrame(){ nCam.position.set(2.9,2.15,3.75); nCtl.target.set(0,0.95,0); nCtl.update(); nNeed=true; }

const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function nMesh(geo,mat,x,y,z){ const o=new THREE.Mesh(geo,mat); o.position.set(x,y,z); return o; }
function nTube(a,b,r,mat){ const d=b.clone().sub(a), L=d.length(); const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,8),mat); o.position.copy(a).addScaledVector(d,0.5); o.quaternion.setFromUnitVectors(V3(0,1,0),d.normalize()); return o; }
function nScrew(mat,x,y,z){ const g=new THREE.Group(); g.add(nMesh(new THREE.CylinderGeometry(0.006,0.006,0.06,8),mat,0,0,0)); g.add(nMesh(new THREE.CylinderGeometry(0.014,0.014,0.01,10),mat,0,0.035,0)); g.position.set(x,y,z); return g; }
function nPvMesh(w,d){ const M=NMAT; return new THREE.Mesh(new THREE.BoxGeometry(w,PV_T,d),[M.frame,M.frame,M.pvTop,M.back,M.frame,M.frame]); }

function nodeBuild(m){ nodeMats(); const M=NMAT;
  if(nRoot){ nS.remove(nRoot); nRoot.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  nRoot=new THREE.Group(); nS.add(nRoot); NODE.parts=[];
  const add=(id,obj,dir,parent)=>{ (parent||nRoot).add(obj); NODE.parts.push({id,obj,parent:parent||nRoot,base:obj.position.clone(),dir:dir||V3(0,0,0)}); return obj; };
  const xs=[-HALF,0,HALF];
  if(m.part==='R'){
    add('roof',nMesh(new THREE.BoxGeometry(3.3,0.02,2.3),M.roof,0,-0.01,0));
    const gMat=new THREE.BoxGeometry(0.32,0.006,0.32), gBal=new THREE.BoxGeometry(0.3,0.06,0.3);
    xs.forEach(x=>{
      [-0.5,0.5].forEach(z=>{
        add('mat',nMesh(gMat,M.mat,x,0.003,z),V3(0,0.14,0));
        add('ball',nMesh(gBal,M.ball,x,0.066,z),V3(0,0.82,0));
        add('scrB',nScrew(M.scrB,x,0.1,z),V3(0,1.12,0)); });
      add('tri',nMesh(triGeo,M.tri,x,0,0),V3(0,0.3,0));
      [-0.62,0,0.62].forEach(z=>add('scrT',nScrew(M.scrT,x,0.05,z),V3(0,0.56,0))); });
    const cg=nMesh(new THREE.BoxGeometry(HALF,0.03,0.04),M.conn,-HALF/2,0.05,-0.72); add('conn',cg,V3(0,0.55,-0.25));
    [-HALF/2-0.45,-HALF/2+0.45].forEach(x=>add('scrC',nScrew(M.scrC,x,0.085,-0.72),V3(0,0.75,-0.25)));
    const sp=nMesh(new THREE.BoxGeometry(2.45,0.4,0.004),M.spoil,0,0.27,-0.69); sp.rotation.x=17.5*D2R; add('spoil',sp,V3(0,0.45,-0.5));
    // module on the 15° tilt with its own junction box and cable leads
    const mg=new THREE.Group(); mg.position.set(0,HC,0); mg.rotation.x=TILT; mg.add(nPvMesh(PV_L,PV_W));
    mg.add(nMesh(new THREE.BoxGeometry(0.14,0.02,0.1),M.jb,0.45,-PV_T/2-0.012,-0.25));
    mg.add(nTube(V3(0.45,-0.04,-0.25),V3(1.46,-0.04,-0.25),0.007,M.cabP)); mg.add(nTube(V3(0.45,-0.04,-0.28),V3(-1.46,-0.04,-0.28),0.007,M.cabM));
    add('pv',mg,V3(0,1.4,0));
    xs.forEach(x=>{ const cx=x===0?0:Math.sign(x)*1.19; [-1,1].forEach(s=>{ const pt=V3(cx,PV_T/2+0.014,s*(PV_W/2-0.025)).applyEuler(mg.rotation).add(mg.position);
      const c=nMesh(new THREE.BoxGeometry(0.06,0.026,0.05),M.clamp,pt.x,pt.y,pt.z); c.rotation.x=TILT; add('clamp',c,V3(0,1.95,0)); }); });
    // string cable in the corrugated tube under the upper profile; bonding wire along the bases
    const gf=new THREE.Group(); gf.position.set(0,0.52,-0.72); gf.add(nTube(V3(-1.35,0,0),V3(1.35,0,0),0.022,M.gofra)); gf.add(nTube(V3(-1.5,0,0),V3(1.5,0,0),0.009,M.cabP)); add('cab',gf,V3(0,0.95,-0.35));
    const bg=new THREE.Group(); bg.position.set(0,0.05,0.8); bg.add(nTube(V3(-1.5,0,0),V3(1.5,0,0),0.008,M.bond)); [-1.0,1.0].forEach(x=>bg.add(nMesh(new THREE.BoxGeometry(0.06,0.014,0.035),M.bond,x,0.012,0))); add('bond',bg,V3(0,0.22,0.5));
  } else {
    const wg=new THREE.Group(); wg.rotation.x=m.slope*D2R; nRoot.add(wg);
    const Wd=m.land?PV_W:PV_L, Ld=m.land?PV_L:PV_W, du=Ld/2-0.3, dv=Wd/2-0.25;
    add('roofp',nMesh(new THREE.BoxGeometry(3.3,0.03,2.5),M.prof,0,-0.015,0),null,wg);
    const gB=new THREE.BoxGeometry(0.31,0.05,0.1), gS=new THREE.CylinderGeometry(0.07,0.07,0.004,16);
    [-1,1].forEach(sx=>[-1,1].forEach(sz=>{ add('seal',nMesh(gS,M.seal,sx*du,0.002,sz*dv),V3(0,0.12,0),wg); add('blk',nMesh(gB,M.blk,sx*du,0.025,sz*dv),V3(0,0.36,0),wg);
      const c=nMesh(new THREE.BoxGeometry(0.06,0.026,0.05),M.clamp,sx*du,0.07+PV_T/2+0.014,sz*(Wd/2-0.02)); add('clamp',c,V3(0,1.35,0),wg); }));
    const mg=new THREE.Group(); mg.position.set(0,0.07,0); mg.add(nPvMesh(Ld,Wd));
    mg.add(nMesh(new THREE.BoxGeometry(0.14,0.02,0.1),M.jb,Ld*0.2,-PV_T/2-0.012,-0.2));
    mg.add(nTube(V3(Ld*0.2,-0.04,-0.2),V3(Ld/2+0.3,-0.04,-0.2),0.007,M.cabP)); mg.add(nTube(V3(Ld*0.2,-0.04,-0.23),V3(-Ld/2-0.3,-0.04,-0.23),0.007,M.cabM));
    add('pv',mg,V3(0,0.95,0),wg); }
  nGuide=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(NODE.parts.length*6),3)),new THREE.LineBasicMaterial({color:0x7d8b92,transparent:true,opacity:0.55}));
  nGuide.frustumCulled=false; nRoot.add(nGuide); nodeUpdate(); }

const _gw=new THREE.Vector3();
function nodeUpdate(){ if(!nRoot) return; const e=NODE.e, s=e*e*(3-2*e);
  NODE.parts.forEach(p=>{ p.obj.position.copy(p.base).addScaledVector(p.dir,s); });
  nRoot.updateMatrixWorld(true);
  const a=nGuide.geometry.attributes.position.array; NODE.parts.forEach((p,i)=>{ _gw.copy(p.base); p.parent.localToWorld(_gw); nRoot.worldToLocal(_gw); a[i*6]=_gw.x; a[i*6+1]=_gw.y; a[i*6+2]=_gw.z;
    p.obj.getWorldPosition(_gw); nRoot.worldToLocal(_gw); a[i*6+3]=_gw.x; a[i*6+4]=_gw.y; a[i*6+5]=_gw.z; });
  nGuide.geometry.attributes.position.needsUpdate=true; nGuide.visible=s>0.02; }
function nodeBadges(){ const w=$('#nodewrap').clientWidth, h=$('#nodewrap').clientHeight, box=$('#nodebadges'); if(!w) return; const pts=[];
  NODE.ids.forEach(id=>{ const list=NODE.parts.filter(p=>p.id===id); if(!list.length) return; const c=V3(0,0,0); list.forEach(p=>{ p.obj.getWorldPosition(_gw); c.add(_gw); }); c.multiplyScalar(1/list.length); c.y+=0.05;
    c.project(nCam); const el=box.querySelector('[data-b="'+id+'"]'); if(!el) return; pts.push({el,x:(c.x+1)/2*w,y:(1-c.y)/2*h,ok:c.z<1}); });
  for(let it=0;it<6;it++) for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){ const dx=pts[j].x-pts[i].x, dy=pts[j].y-pts[i].y, d=Math.hypot(dx,dy); if(d<22){ const k=(22-d)/2+0.5, ux=d>0.1?dx/d:1, uy=d>0.1?dy/d:0; pts[i].x-=ux*k; pts[i].y-=uy*k; pts[j].x+=ux*k; pts[j].y+=uy*k; } }
  pts.forEach(q=>{ q.el.style.display=q.ok?'':'none'; q.el.style.transform=`translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px)`; }); }
function nodeLoop(){ requestAnimationFrame(nodeLoop); if(!nNeed||!nR) return; const pane=document.querySelector('[data-pane="node"]'); if(!pane||pane.hidden||NODE.view!=='exp'||$('#node-body').hidden) return;
  nNeed=false; nodeUpdate(); nR.render(nS,nCam); nodeBadges(); }
function nodeSetE(e){ NODE.e=Math.max(0,Math.min(1,e)); $('#nodee').value=Math.round(NODE.e*100); nNeed=true; }
function nodeTween(to,ms,done){ cancelAnimationFrame(NODE.tw); const from=NODE.e, t0=performance.now();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ nodeSetE(to); if(done) done(); return; }
  const tick=n=>{ const u=Math.min(1,(n-t0)/ms); nodeSetE(from+(to-from)*u); if(u<1) NODE.tw=requestAnimationFrame(tick); else if(done) done(); }; NODE.tw=requestAnimationFrame(tick); }
$('#nodee').addEventListener('input',e=>{ cancelAnimationFrame(NODE.tw); nodeSetE(+e.target.value/100); });
$('#nodeplay').addEventListener('click',()=>{ nodeTween(1,1700,()=>setTimeout(()=>nodeTween(0,1500),700)); });
function nodeHL(id){ NODE.hl=id; const set=(mat,on)=>{ if(mat&&mat.emissive) mat.emissive.setHex(on?0x6a4800:0x000000); };
  NODE.parts.forEach(p=>p.obj.traverse(o=>{ if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(mm=>set(mm,id&&p.id===id)); }));
  $$('#nodetable tr[data-part]').forEach(r=>r.classList.toggle('on',r.dataset.part===id)); $$('#nodebadges .nb').forEach(b=>b.classList.toggle('dim',!!id&&b.dataset.b!==id)); nNeed=true; }

// ---------- table of parts
function nodeRows(m){ const R=m.part==='R';
  if(R) return [
   ['pv','Фотомодуль Shinefar SF-M21/G132710, 710 Вт, 2384×1303×35','1','1 260','Лежить на верхніх полицях трьох трикутників під кутом 15°, притиснутий з довгих сторін'],
   ['clamp','Притиски W35 / Z33 з кріпленням А2','6 позицій','2 520 + 3 232','За спец. разом 5 752 ≈ 2 на трикутник; гайка М8, 2,5–3,3 Н·м'],
   ['tri','Трикутник BalZn15-1568.1470 «Південь 15°», Zn','3 (2 спільні)','2 698','Стоїть на матах; 3 метизи на трикутник'],
   ['conn','Сполучник Bal15 Zn Spol-15Zn-700','1','1 953','Через один трикутник, 2 метизи'],
   ['ball','Баласт B300300-60.Zn бетонний, ≈ 13 кг','6 (≈ 78 кг)','5 396','2 на трикутник; блок прикручують до основи трикутника'],
   ['mat','Мат гумовий 320×320×3','6','5 396','2 на трикутник, між покрівлею й основою'],
   ['spoil','Спойлер-профнастил Vitr-240×2450 Zn','1','1 260','Вітровий щиток з півночі'],
   ['scrT','Метизи кріплення трикутників, поз. 1.10','9','8 094','3 на трикутник; отвори Ø5–6,5 мм (АБ арк. 6)'],
   ['scrC','Метизи кріплення сполучників, поз. 1.9','2','3 906','2 на сполучник'],
   ['scrB','Метизи кріплення баластів R-LX 6,3×5×50, поз. 1.8','6','5 396','1 на блок, момент 3–4 Н·м'],
   ['cab','Кабель стрінга H1Z2Z2-K 1×6 у гофротрубі d40','вздовж ряду','23,1 км','Під верхнім профілем ряду; UV-стійка гофра'],
   ['bond','Провід зрівнювання ПВ-3 1×6, наконечники DT(G)-6','вздовж ряду','2 100 м','Рама модуля → контур, з двох сторін ряду']];
  return [
   ['pv','Фотомодуль Shinefar SF-M21/G132710, 710 Вт, 2384×1303×35','1','180',`Паралельно скату ${m.slope}°, ${m.land?'альбомно':'портрет'}; на чотирьох блоках`],
   ['blk','Блок Light_P50-310','4','640 (у макеті 720)','Прикручений до профнастилу складу'],
   ['clamp','Притиски Z33 / П30 з кріпленням А2','≈ 4','260 + 442','На рамі модуля над блоками'],
   ['seal','Каучуковий герметик','4 отвори','180 уп.','У місцях кріплення блоків до профнастилу'],
   ['roofp','Існуюча покрівля складу (профнастил)','—','—',`Скат ${m.slope}°`]]; }
function nodeTable(m){ const rows=nodeRows(m); NODE.ids=rows.map(r=>r[0]).filter(id=>id!=='roof'&&NODE.parts.some(p=>p.id===id)); NODE.num={}; let k=0; rows.forEach(r=>{ if(NODE.ids.includes(r[0])) NODE.num[r[0]]=++k; });
  $('#nodetable').innerHTML=`<div class="tw"><table class="spec"><thead><tr><th>№</th><th>Елемент і кріплення</th><th>У вузлі</th><th>Спец.</th></tr></thead><tbody>`+
   rows.map(r=>`<tr data-part="${r[0]}"><td class="n">${NODE.num[r[0]]?`<span class="nbn">${NODE.num[r[0]]}</span>`:'—'}</td><td>${r[1]}<div class="small" style="margin:2px 0 0">${r[4]}</div></td><td class="n">${r[2]}</td><td class="n">${r[3]}</td></tr>`).join('')+`</tbody></table></div>`;
  $$('#nodetable tr[data-part]').forEach(tr=>{ tr.addEventListener('click',()=>nodeHL(NODE.hl===tr.dataset.part?null:tr.dataset.part)); tr.addEventListener('mouseenter',()=>{ if(matchMedia('(hover: hover)').matches) nodeHL(tr.dataset.part); }); tr.addEventListener('mouseleave',()=>{ if(matchMedia('(hover: hover)').matches) nodeHL(null); }); });
  const box=$('#nodebadges'); box.innerHTML=NODE.ids.map(id=>`<span class="nb" data-b="${id}">${NODE.num[id]}</span>`).join(''); }

// ---------- notes under the table
function nodeNotes(m){ const R=m.part==='R', n=strLen[m.b+'.'+m.s], out=[];
  if(R){ out.push(`Середнє на один модуль за специфікацією (÷ 1 260): трикутників 2,14 · блоків і метизів баласту по 4,28 (≈ 56 кг баласту) · метизів трикутників 6,42 · сполучників 1,55 (3,10 метиза). У вузлі з трьох опор — повний комплект на кожну, тому цифри вище.`);
    out.push(`Ряд стоїть на покрівлі з ухилом ${nf(Math.abs(m.roll),1)}° вздовж арки — трикутник нахилено разом з нею.`);
    if(Math.abs(m.roll)>10) out.push(['c',`<b>К7.</b> Ухил понад 10°: баласт RUDNIK розрахований на плаский дах, розрахунку на зсув немає.`]);
    else if(Math.abs(m.roll)>5) out.push(['w',`<b>К7.</b> Ухил понад 5°: розрахунку баласту на зсув немає.`]);
    out.push('Місця метизів на макеті схематичні: на кресленнях виробника їх не наведено, кількість взято зі специфікації АБ арк. 8.'); }
  else { out.push('Кріпильних гвинтів блоків до профнастилу в переліку поз. 2.1–2.4 окремо не наведено; у специфікації 640 блоків на 180 модулів (3,6 на модуль), у макеті — 4 на модуль.'); out.push(['n','<b>У5.</b> Ціну кріплення складу обґрунтовано ресурсом баластної системи 15° для модуля 2278×1134.']); }
  $('#nodenotes').innerHTML=NT(out); }

// ---------- drawing (section and plan) as inline SVG
function nodeDrawing(m){ const R=m.part==='R', N=NODE.num; const bn=(id,x,y)=>N[id]?`<g class="bn"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7.5"/><text x="${x.toFixed(1)}" y="${(y+3.2).toFixed(1)}">${N[id]}</text></g>`:'';
  const S=R?205:150, ox=190, oy=R?206:170, P=(z,y)=>[ox+z*S,oy-y*S], f=v=>v.toFixed(1);
  const rc=(z0,y0,z1,y1,c)=>{ const a=P(z0,y1), b=P(z1,y0); return `<rect class="${c}" x="${f(a[0])}" y="${f(a[1])}" width="${f(Math.abs(b[0]-a[0]))}" height="${f(Math.max(1.4,b[1]-a[1]))}"/>`; };
  const ln=(z0,y0,z1,y1,c)=>{ const a=P(z0,y0), b=P(z1,y1); return `<line class="${c}" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`; };
  const tx=(z,y,t,c)=>{ const a=P(z,y); return `<text class="${c||''}" x="${f(a[0])}" y="${f(a[1])}" text-anchor="middle">${t}</text>`; };
  let sec='';
  if(R){ const th=TILT, T=PV_T, W=PV_W, cy=HC; const rot=(b,y)=>[y*Math.sin(th)+b*Math.cos(th), cy+y*Math.cos(th)-b*Math.sin(th)];
    const q=[[-W/2,-T/2],[W/2,-T/2],[W/2,T/2],[-W/2,T/2]].map(([b,y])=>rot(b,y)).map(p=>P(p[0],p[1]).map(f).join(',')).join(' ');
    sec+=rc(-0.9,-0.06,0.9,0,'rf')+ln(-0.9,0,0.9,0,'ln');
    [0.5,-0.5].forEach(z=>{ sec+=rc(z-0.16,0,z+0.16,0.006,'gr')+rc(z-0.15,0.036,z+0.15,0.096,'gr'); });
    sec+=rc(-0.784,0.006,0.784,0.036,'ln')+rc(0.61,0.036,0.65,0.165,'ln')+rc(-0.65,0.036,-0.61,0.47,'ln')+ln(0.63,0.135,-0.63,0.465,'th');
    sec+=`<polygon class="bl" points="${q}"/>`;
    [-1,1].forEach(s=>{ const p=rot(s*(W/2-0.025),T/2+0.014), a=P(p[0],p[1]); sec+=`<circle cx="${f(a[0])}" cy="${f(a[1])}" r="3.4" fill="var(--ink)"/>`; });
    sec+=ln(-0.75,0.08,-0.63,0.46,'th')+rc(-0.74,0.035,-0.70,0.065,'gr');
    const g1=P(-0.70,0.54); sec+=`<circle cx="${f(g1[0])}" cy="${f(g1[1])}" r="4.6" fill="#23282b"/><circle cx="${f(g1[0])}" cy="${f(g1[1])}" r="1.8" fill="#ff8c1a"/>`;
    const g2=P(0.8,0.045); sec+=`<circle cx="${f(g2[0])}" cy="${f(g2[1])}" r="3" fill="#2fc24a"/>`;
    [0.5,-0.5].forEach(z=>{ sec+=ln(z,0.1,z,0.034,'th'); }); sec+=ln(0,0.05,0,0.012,'th');
    sec+=ln(-0.784,-0.11,0.784,-0.11,'dm')+ln(-0.784,-0.085,-0.784,-0.135,'dm')+ln(0.784,-0.085,0.784,-0.135,'dm')+tx(0,-0.19,'1568 (основа трикутника)','t2');
    const a15=P(0.55,0.15); sec+=`<text class="t2" x="${f(a15[0]+6)}" y="${f(a15[1]-4)}">15°</text>`;
    sec+=bn('pv',...P(0,0.74-0.3))+bn('clamp',...P(0.69,0.31))+bn('tri',...P(0.0,0.2))+bn('conn',...P(-0.88,0.05))+bn('ball',...P(0.5,0.19))+bn('mat',...P(0.5,-0.03))+bn('spoil',...P(-0.86,0.46))+bn('scrB',...P(-0.5,0.19))+bn('scrT',...P(0,0.1))+bn('cab',...P(-0.84,0.62))+bn('bond',...P(0.8,0.13));
  } else { const sl=m.slope*D2R, Wd=m.land?PV_W:PV_L, Ld=m.land?PV_L:PV_W, dv=Wd/2-0.25, T=PV_T;
    const rot=(b,y)=>[b,y];
    const poly=pts=>pts.map(p=>{ const r=rot(p[0],p[1]); return P(r[0],r[1]).map(f).join(','); }).join(' ');
    sec+=`<polygon class="rf" points="${poly([[-1.2,-0.1],[1.2,-0.1],[1.2,0],[-1.2,0]])}"/>`+`<polyline class="ln" points="${poly([[-1.2,0],[1.2,0]])}"/>`;
    [-1,1].forEach(s=>{ sec+=`<polygon class="gr" points="${poly([[s*dv-0.05,0],[s*dv+0.05,0],[s*dv+0.05,0.05],[s*dv-0.05,0.05]])}"/>`; });
    sec+=`<polygon class="bl" points="${poly([[-Wd/2,0.07-T/2],[Wd/2,0.07-T/2],[Wd/2,0.07+T/2],[-Wd/2,0.07+T/2]])}"/>`;
    [-1,1].forEach(s=>{ const r=rot(s*(Wd/2-0.02),0.07+T/2+0.014), a=P(r[0],r[1]); sec+=`<circle cx="${f(a[0])}" cy="${f(a[1])}" r="3.4" fill="var(--ink)"/>`; });
    const hl=(b,y)=>{ const r=rot(b,y); return P(r[0],r[1]); };
    sec+=bn('pv',...hl(0,0.35))+bn('blk',...hl(dv,-0.15))+bn('clamp',...hl(-dv-0.0,0.22))+bn('seal',...hl(0.0,-0.1))+bn('roofp',...hl(-0.85,-0.08));
    sec+=`<text class="t2" x="14" y="256">розріз у площині скату ${m.slope}° · північ ліворуч</text>`; }
  const secSvg=`<svg class="dwg" viewBox="0 0 380 262" role="img" aria-label="Розріз вузла кріплення"><text x="8" y="14">Розріз поперек ряду · погляд із заходу</text><text class="t2" x="8" y="26">північ ліворуч, південь праворуч</text>${sec}</svg>`;
  // plan
  const S2=104, px=190, py=150, P2=(x,z)=>[px+x*S2,py+z*S2], g=P2;
  const r2=(x0,z0,x1,z1,c,x)=>{ const a=g(x0,z0), b=g(x1,z1); return `<rect class="${c}" ${x||''} x="${f(Math.min(a[0],b[0]))}" y="${f(Math.min(a[1],b[1]))}" width="${f(Math.abs(b[0]-a[0]))}" height="${f(Math.abs(b[1]-a[1]))}"/>`; };
  const l2=(x0,z0,x1,z1,c)=>{ const a=g(x0,z0), b=g(x1,z1); return `<line class="${c}" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`; };
  const t2=(x,z,t,c,an)=>{ const a=g(x,z); return `<text class="${c||''}" x="${f(a[0])}" y="${f(a[1])}" text-anchor="${an||'middle'}">${t}</text>`; };
  const bn2=(id,x,z)=>{ const a=g(x,z); return bn(id,a[0],a[1]); };
  let pl='';
  if(R){ const xs=[-HALF,0,HALF];
    pl+=r2(-PV_L/2,-PV_W/2,PV_L/2,PV_W/2,'bl','fill-opacity=".38"');
    xs.forEach(x=>{ pl+=l2(x,-0.784,x,0.784,'th'); [-0.5,0.5].forEach(z=>{ pl+=r2(x-0.16,z-0.16,x+0.16,z+0.16,'rf','stroke-dasharray="3 2"')+r2(x-0.15,z-0.15,x+0.15,z+0.15,'gr','fill-opacity=".55"'); const a=g(x,z); pl+=`<circle cx="${f(a[0])}" cy="${f(a[1])}" r="2.6" fill="#f0c030" stroke="var(--ink)" stroke-width=".6"/>`; });
      [-0.62,0,0.62].forEach(z=>{ const a=g(x+0.07,z); pl+=`<circle cx="${f(a[0])}" cy="${f(a[1])}" r="2.2" fill="#e0662a" stroke="var(--ink)" stroke-width=".6"/>`; });
      [-1,1].forEach(s=>{ const cx=x===0?0:Math.sign(x)*1.19; pl+=r2(cx-0.03,s*(PV_W/2-0.025)-0.025,cx+0.03,s*(PV_W/2-0.025)+0.025,'ln','style="fill:var(--ink)"'); }); });
    pl+=r2(-HALF,-0.74,0,-0.70,'gr')+[-HALF/2-0.45,-HALF/2+0.45].map(x=>{ const a=g(x,-0.72); return `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="2.4" fill="#3a86d8" stroke="var(--ink)" stroke-width=".6"/>`; }).join('');
    pl+=l2(-1.225,-0.69,1.225,-0.69,'th')+l2(-1.35,-0.76,1.35,-0.76,'cb')+l2(-1.5,0.8,1.5,0.8,'bd');
    pl+=l2(-PV_L/2,-1.0,PV_L/2,-1.0,'dm')+l2(-PV_L/2,-1.04,-PV_L/2,-0.96,'dm')+l2(PV_L/2,-1.04,PV_L/2,-0.96,'dm')+t2(0,-1.06,'2384','t2');
    pl+=l2(1.55,-PV_W/2,1.55,PV_W/2,'dm')+l2(1.51,-PV_W/2,1.59,-PV_W/2,'dm')+l2(1.51,PV_W/2,1.59,PV_W/2,'dm')+`<text class="t2" transform="translate(${f(g(1.64,0)[0])},${f(g(1.64,0)[1])}) rotate(90)" text-anchor="middle">1303</text>`;
    pl+=l2(0,0.98,HALF,0.98,'dm')+l2(0,0.94,0,1.02,'dm')+l2(HALF,0.94,HALF,1.02,'dm')+t2(HALF/2,1.1,'1207,5 · крок опор','t2')+`<text class="t2" x="8" y="280">крок рядів 2100 (поперек)</text>`;
    pl+=bn2('pv',0.55,0.05)+bn2('clamp',-0.66,0.60)+bn2('tri',-HALF+0.12,0.35)+bn2('conn',-HALF/2,-0.72+0.0)+bn2('ball',-0.34,0.5)+bn2('mat',0.36,-0.5)+bn2('spoil',0.9,-0.69)+bn2('scrT',0.0+0.07,-0.37)+bn2('scrC',-HALF/2+0.45,-0.72)+bn2('scrB',0.18,0.5)+bn2('cab',1.2,-0.8)+bn2('bond',1.2,0.8);
  } else { const Ld=m.land?PV_L:PV_W, Wd=m.land?PV_W:PV_L, du=Ld/2-0.3, dv=Wd/2-0.25, sc=Math.min(1,2.9/Ld);
    const G2=(x,z)=>[px+x*S2*sc,py+z*S2*sc*(Wd>Ld?0.62:1)]; const rr2=(x0,z0,x1,z1,c,x)=>{ const a=G2(x0,z0), b=G2(x1,z1); return `<rect class="${c}" ${x||''} x="${f(Math.min(a[0],b[0]))}" y="${f(Math.min(a[1],b[1]))}" width="${f(Math.abs(b[0]-a[0]))}" height="${f(Math.abs(b[1]-a[1]))}"/>`; };
    pl+=rr2(-Ld/2,-Wd/2,Ld/2,Wd/2,'bl','fill-opacity=".38"');
    [-1,1].forEach(sx=>[-1,1].forEach(sz=>{ pl+=rr2(sx*du-0.155,sz*dv-0.05,sx*du+0.155,sz*dv+0.05,'gr','fill-opacity=".7"'); const c=G2(sx*du,sz*(Wd/2-0.02)); pl+=`<rect x="${f(c[0]-3)}" y="${f(c[1]-3)}" width="6" height="6" fill="var(--ink)"/>`; }));
    const b1=G2(0,0); pl+=`<text class="t2" x="${f(b1[0])}" y="${f(b1[1])}" text-anchor="middle">${nf(Ld*1000)} × ${nf(Wd*1000)}</text><text class="t2" x="8" y="280">${m.land?'альбомно':'портрет'}, вигляд зверху вздовж скату</text>`;
    const pb=(id,x,z)=>{ const a=G2(x,z); return bn(id,a[0],a[1]); }; pl+=pb('pv',0,0.14)+pb('blk',du,-dv+0.15)+pb('clamp',-du,dv)+pb('seal',-du+0.35,-dv+0.15)+pb('roofp',0,Wd/2+0.12); }
  const planSvg=`<svg class="dwg" viewBox="0 0 380 286" role="img" aria-label="План вузла кріплення"><text x="8" y="14">План · вигляд зверху</text><text class="t2" x="8" y="26">північ угорі (умовно), розміри в мм</text>${pl}</svg>`;
  const leg=`<div class="legend">${R?'<span><i style="background:#f0c030"></i>гвинти баласту</span><span><i style="background:#e0662a"></i>метизи трикутників</span><span><i style="background:#3a86d8"></i>метизи сполучника</span><span><i style="background:#ff8c1a"></i>кабель стрінга</span><span><i style="background:#2fc24a"></i>зрівнювання</span>':'<span><i style="background:#5c6166"></i>блоки</span><span><i style="background:var(--ink)"></i>притиски</span>'}</div>`;
  return secSvg+planSvg+leg+`<p class="small">Номери збігаються з таблицею на вкладці «Розбір». Геометрію взято з макета; розміри з підписами — зі специфікації АБ арк. 8.</p>`; }

// ---------- wiring from the module to the board
function nodeWiring(m){ const n=strLen[m.b+'.'+m.s], ms=BOARD_MS(m.b), pad=D.pads.find(p=>p.id==='MS-'+ms), uoc=n*56.2; const R=m.part==='R';
  const cw=Math.min(18,(344-(n-1)*3)/n); let ch=''; for(let i=0;i<n;i++) ch+=`<rect class="bl" x="${(18+i*(cw+3)).toFixed(1)}" y="40" width="${cw.toFixed(1)}" height="15"/>`;
  const x1=18, x2=18+n*(cw+3)-3, box=(y,h,t1,t2,c)=>`<rect class="ln" x="26" y="${y}" width="328" height="${h}" style="fill:var(--panel)"/><text x="190" y="${y+16}" text-anchor="middle">${t1}</text><text class="t2" x="190" y="${y+30}" text-anchor="middle">${t2}</text>`;
  const rope=!R?`<text class="t2" x="190" y="114" text-anchor="middle">склад → трос 15 м → цех</text>`:'';
  const svg=`<svg class="dwg" viewBox="0 0 380 330" role="img" aria-label="Схема розводки від модуля до ТП">
   <text x="8" y="16">Стрінг ${m.s} · ${n} модулів послідовно</text>${ch}
   <text x="${x1}" y="34">+</text><text x="${(x2-6).toFixed(1)}" y="34">−</text>
   <path class="cb" d="M${x1+4} 55 V72 H60 V122"/><path class="ln" d="M${x2-4} 55 V72 H320 V122" stroke="#111" stroke-width="2.2"/>
   <text class="t2" x="190" y="90" text-anchor="middle">H1Z2Z2-K 1×6</text><text class="t2" x="190" y="102" text-anchor="middle">гофра d40, до 288 м</text>${rope}
   ${box(122,40,`ЩР-PV(${m.b}) · 10 стрінгів`,'запобіжники gPV 25 А / 1 000 В на «+» і «−», ОПН T1+T2')}
   <path class="ln" d="M190 162 V184"/>
   ${box(184,40,`MS-${ms} · шафа мікромережі FFD POWER 500 кВт`,`10 MPPT · ${nf(pad.kwp,1)} кВтп · STS, PCS, EMS`)}
   <path class="ln" d="M190 224 V246"/>
   ${box(246,40,`ЩР-УЗЕ(AC)-${ms} → ${pad.tp}`,'АВВГнгд 4×240 по кабельросту на фасаді')}
   <path class="bd" d="M10 40 V310 H26" stroke-dasharray="4 3"/>
   <text class="t2" x="190" y="312" text-anchor="middle" style="fill:#2fc24a">зрівнювання ПВ-3 1×6 → контур → БЗ</text></svg>`;
  const L=[]; L.push(`<b>Стрінг ${m.s}</b> щита ЩР-PV(${m.b}) — ${n} модулів, до ${pad.id} (${pad.tp}).`);
  L.push(`Напруга холостого ходу при −25 °C ≈ ${nf(uoc,0)} В (≈ 56,2 В на модуль); запобіжники й роз’єднувачі в щиті — на 1 000 В.`);
  if(uoc>1000) L.push(['c',`<b>К1.</b> ${n} модулів дають ≈ ${nf(uoc,0)} В — вище 1 000 В.`]);
  L.push(R?'Кабель стрінга: вертикально — по металоконструкціях рядів, горизонтально — у гофротрубі d40 під верхнім профілем ряду (рис. «Розбір», елемент «Кабель»).':'Склад: кабель стрінга йде по покрівлі до тросового переходу на цех, далі по краю покрівлі до ЩР-PV на фасаді.');
  L.push('Рама модуля з’єднується проводом ПВ-3 1×6 з наконечниками DT(G)-6 з контуром зрівнювання; контур об’єднано з блискавкозахистом.');
  L.push(['w','<b>С4.</b> Провід 6 мм² замалий для зв’язку з блискавкозахистом (потрібно ≥ 16 мм² Cu).']);
  return svg+NT(L); }

// ---------- open / switch views
function nodeView(v){ NODE.view=v; $$('.seg [data-nv]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.nv===v))); $$('[data-nview]').forEach(d=>{ d.hidden=d.dataset.nview!==v; }); $('#nodeexp').hidden=v!=='exp'; if(v==='exp'){ nodeResize(); nNeed=true; } }
$$('.seg [data-nv]').forEach(b=>b.addEventListener('click',()=>nodeView(b.dataset.nv)));
$('#t-node').addEventListener('click',()=>{ nNeed=true; setTimeout(nodeResize,30); });
function openNode(m,kind){ if(!nodeInit()){ $('#node-empty').textContent='WebGL недоступний — розбір вузла не відкрити.'; $('#t-node').click(); return; }
  NODE.m=m; NODE.kind=kind||'pv'; $('#t-node').click(); $('#node-empty').hidden=true; $('#node-body').hidden=false; $('#node-ctl').hidden=false; $('#node-ctl-empty').hidden=true;
  const R=m.part==='R';
  $('#node-title').innerHTML=`<span>Вузол</span>Модуль ${m.i+1} · ЩР-PV(${m.b}) · стрінг ${m.s}`;
  $('#node-sub').textContent=R?`Дах цеху · ряд ${nodeRank[m.Y.toFixed(1)]} з ${rowsMap.size} (Y = ${nf(m.Y,1)} м), відрізок з ${m.seg.length} модулів, позиція ${m.j+1}, ухил ряду ${nf(Math.abs(m.roll),1)}°`:`Склад · скат ${m.slope}° · ${m.land?'альбомно':'портрет'} · X = ${nf(m.X,1)} м, Y = ${nf(m.Y,1)} м`;
  nodeBg(); nodeMats(); nodeBuild(m); nodeTable(m); nodeNotes(m);
  $('[data-nview="dwg"]').innerHTML=nodeDrawing(m); $('[data-nview="wire"]').innerHTML=nodeWiring(m);
  nodeView('exp'); nodeFrame(); nodeSetE(0); nodeResize();
  const want={pv:'pv',tri:'tri',ball:'ball',mat:'mat',conn:'conn',spoil:'spoil'}[NODE.kind];
  setTimeout(()=>{ nodeTween(1,1700); },250); if(want&&NODE.ids.includes(want)) nodeHL(want); else nodeHL(null);
  if(matchMedia('(max-width: 860px)').matches) $('[data-pane="node"]').scrollIntoView({behavior:'smooth',block:'start'}); }
function openNodeFromHit(hit){ const o=hit.object, id=hit.instanceId; let m=null, kind='pv';
  if(o.userData.list){ m=o.userData.list[id]; }
  else if(o.userData.mods){ m=o.userData.mods[id]; kind=o===triIM?'tri':o===balIM?'ball':o===spoIM?'spoil':o===conIM?'conn':'mat'; }
  if(m) openNode(m,kind); }
window.__dbg=Object.assign(window.__dbg||{},{openNode,NODE});
