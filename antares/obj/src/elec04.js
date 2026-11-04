// ================= Електрика етапів 1 і 2 (аналіз 04.11.2026): щити PV 7/1, траси ліній Al до контейнерів, спуски, ШВ
// Дані — src/elec04data.js (calc: розподіл щитів між ТП-5913 і ТП-6923 за мінімумом «кабель + втрати за 25 років», ≤ 12 входів на контейнер).
// Кнопка «Електрика» поруч з етапами в «Об'єкті»; показує елементи вибраного етапу (етап 1 — фасади, ліхтарі, склад; етап 2 — дах В1).
{ const E4=typeof ELEC04!=='undefined'?ELEC04:null, STx=window.__twin&&window.__twin.stages, R28=window.__twin&&window.__twin.r28, STG=()=>state.lay.stg;
  if(E4&&STx){
  const g=grp('elec04',G.ours); g.visible=false;
  const KC={'K-1':0xc0392b,'K-3':0xe67e22,'K-4':0x7b5bd6,'K-5':0x1aa3b4}, KO={'K-1':-0.18,'K-3':-0.06,'K-4':0.06,'K-5':0.18};
  const MM={}, Mk=k=>MM[k]||(MM[k]=new THREE.MeshStandardMaterial({color:lin(KC[k]),roughness:0.45}));
  const boxM=std(lin(0xd8dde0),{roughness:0.5,metalness:0.1}), trayM=std(lin(0x9aa3a8),{roughness:0.6,metalness:0.4});
  const PART={1:[],2:[]}, TPN={'K-1':'ТП-5913','K-3':'ТП-5913','K-4':'ТП-6923','K-5':'ТП-6923'};
  const rz=x=>roofZ(Math.max(0,Math.min(96.64,x)));
  const tube=(pts,k,st,info,r=0.08)=>{ if(pts.length<2) return; const c=new THREE.CatmullRomCurve3(pts,false,'catmullrom',0.0);
    const m=new THREE.Mesh(new THREE.TubeGeometry(c,Math.max(8,pts.length*2),r,6,false),Mk(k)); m.castShadow=false; g.add(m); PART[st].push(m);
    if(info){ m.userData.info=info; PICK.push({o:m,when:()=>g.visible&&m.visible}); } return m; };
  // траса по даху: точки через 1 м, висота — над покрівлею по профілю арок; паралельні лінії різних контейнерів — зі зсувом
  const roofPts=(pp,k)=>{ const out=[]; const o=KO[k];
    for(let i=0;i<pp.length-1;i++){ const [x0,y0]=pp[i], [x1,y1]=pp[i+1], L=Math.hypot(x1-x0,y1-y0), n=Math.max(1,Math.ceil(L)), hor=Math.abs(y1-y0)<1e-6;
      for(let j=0;j<(i===pp.length-2?n+1:n);j++){ const t=j/n, x=x0+(x1-x0)*t+(hor?0:o), y=y0+(y1-y0)*t+(hor?o:0); out.push(W(x,y,rz(x)+0.28)); } }
    return out; };
  const nfL=v=>nf(v,1);
  const bInfo=b=>({t:`${b.id} · щит PV 7/1 · етап ${b.st} → ${b.K} (${TPN[b.K]})`,d:`${b.ns} стрінгів по 11 модулів, ${nfL(b.kwp)} кВтп, 1 вхід DC/DC 60 кВт. Лінія Al 2 × 1×${b.S} мм², ${nfL(b.L)} м до ШВ, падіння напруги ${nf(b.du,2)} % при STC. ${b.z==='lan'?'Стрінги ліхтаря — уздовж схилів по 11 модулів (Л1 — 6, Л2–Л4 — по 7, один із них через гребінь). ':''}Переріз — мінімум «кабель + втрати за 25 років» (аналіз 04.11).`});
  const rInfo=r=>({t:`Лінія Al ${r.id} → ${r.K} · етап ${r.st}`,d:`По ${r.d==='E'?'проходах і смугах даху до спуску на сході (Y 63,8), далі фасадом до ШВ біля контейнера':'проходах і смугах даху до спуску на північному заході, далі стіною цеху, дахом ТП-6923 і містком над приямком на берму до ШВ'}. Лоток з кришкою на траверсах на баластних блоках.`});
  // щити даху і ліхтарів + траси
  const BB=new THREE.BoxGeometry(0.8,0.9,0.36);
  E4.boxes.forEach(b=>{ let o;
    if(b.z==='roof'||b.z==='lan'){ const x=b.X, y=b.Y, z=rz(x); o=new THREE.Mesh(BB,boxM); o.position.copy(W(x,y,z+0.62)); g.add(o);
      const s=new THREE.Mesh(new THREE.BoxGeometry(0.82,0.08,0.38),Mk(b.K)); s.position.copy(W(x,y,z+1.11)); g.add(s); PART[b.st].push(o,s); }
    else if(b.z==='fac'){ const S=b.f==='S'; o=new THREE.Mesh(BB,boxM); if(S){ o.position.set(b.s,3.0,0.5+0.2); } else { o.rotation.y=Math.PI/2; o.position.set(96.64+0.2,3.0,-b.s); } g.add(o); PART[1].push(o);
      const s=new THREE.Mesh(new THREE.BoxGeometry(0.82,0.08,0.38),Mk(b.K)); s.position.copy(o.position); s.position.y+=0.49; s.rotation.copy(o.rotation); g.add(s); PART[1].push(s); }
    else { o=new THREE.Mesh(BB,boxM); o.position.copy(W(b.X,b.Y,1.2)); g.add(o); PART[1].push(o); }
    o.userData.info=bInfo(b); PICK.push({o,when:()=>g.visible&&o.visible}); });
  E4.routes.forEach(r=>tube(roofPts(r.pts,r.K),r.K,r.st,rInfo(r)));
  // спуски: схід (Y 63,8) → ШВ К-1 / К-3; північний захід (X 10) → дах ТП-6923 → місток → берма → ШВ К-4 / К-5
  const [ex,ey]=E4.DE, [nx,ny]=E4.DN, sh=E4.shv;
  const descE=(k,st)=>{ const o=KO[k]; return [W(ex,ey+o,rz(ex)+0.28),W(96.64+0.25,ey+o,rz(96.64)+0.3),W(96.64+0.25,ey+o,0.6),W(sh[k][0]-0.2,ey+o,0.3),W(sh[k][0]-0.2,sh[k][1],0.3),W(sh[k][0],sh[k][1],0.9)]; };
  const descN=(k)=>{ const o=KO[k]; return [W(nx+o,ny,rz(nx)+0.28),W(nx+o,96.59+0.25,rz(nx)+0.3),W(nx+o,96.59+0.25,4.7),W(nx+o,107.0,4.7),W(nx+o,107.3,4.7),W(nx+o,109.6,2.5),W(sh[k][0],109.9,2.4),W(sh[k][0],sh[k][1],2.4)]; };
  const nN=E4.boxes.filter(b=>b.K==='K-4'||b.K==='K-5').length, n1N=E4.boxes.filter(b=>(b.K==='K-4'||b.K==='K-5')&&b.st===1).length;
  const used={1:new Set(),2:new Set()}; E4.routes.forEach(r=>used[r.st].add(r.K+r.d));
  [1,2].forEach(st=>used[st].forEach(kd=>{ const k=kd.slice(0,3), d=kd.slice(3); if(st===2&&used[1].has(kd)) return;
    tube(d==='E'?descE(k):descN(k),k,st,{t:d==='E'?`Спуск Сх → ШВ ${k}`:`Спуск ПнЗх → ШВ ${k}`,d:d==='E'?'Лоток зі спуску на сході даху (Y 63,8) по фасаду до ШВ біля контейнера; будується в етапі 1 під усі лінії даху.':`Лоток на ${nN} ліній: північна стіна цеху → дах ТП-6923 → місток над приямком → берма +1,8 м → ШВ біля К-4 / К-5. ${n1N?'Будується в етапі 1 одразу під етап 2.':'Будується в етапі 2: в етапі 1 ліній PV до ТП-6923 немає (К-4, К-5 працюють лише від мережі).'}`},0.12); }));
  // фасадні лінії: південний фасад → кут → східний фасад над ТП-5913 → ШВ К-3; східний фасад → ШВ К-1
  E4.boxes.filter(b=>b.z==='fac').forEach(b=>{ const k=b.K, o=KO[k];
    const pts=b.f==='S'?[new V3(b.s,3.5,0.5+0.25),new V3(96.64+0.3,3.5,0.5+0.25),new V3(96.64+0.3,6.0,-0.5),new V3(96.64+0.3,6.0,-(sh[k][1]-1)),new V3(sh[k][0],0.9,-sh[k][1])]
      :[new V3(96.64+0.25,3.5,-b.s),new V3(96.64+0.25,3.5+o,-(sh[k][1]+(b.s>sh[k][1]?1:-1))),new V3(sh[k][0],0.9,-sh[k][1])];
    tube(pts,k,1,{t:`Лінія Al ${b.id} → ${k} · етап 1`,d:`Фасад ${b.f==='S'?'південний: лоток уздовж фасаду на ≈3,5 м, далі по східному фасаду над ТП-5913':'східний'}; Al 2 × 1×${b.S} мм², ${nfL(b.L)} м, падіння ${nf(b.du,2)} %.`}); });
  // ШВ біля контейнерів
  Object.entries(sh).forEach(([k,p])=>{ const h=k==='K-4'||k==='K-5'?1.8:0; const o=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.3,0.45),Mk(k)); o.position.copy(W(p[0],p[1],h+0.65)); g.add(o); PART[1].push(o);
    o.userData.info={t:`ШВ ${k} — шафа вводу PV біля контейнера`,d:`Перехід Al → Cu 1×50 на 12 входів DC/DC, ПЗІП T2 на кожному вході, шина PE. Входів зайнято: ${E4.inp[k]} з 12, DC ${nf(E4.kwp[k])} кВтп.`}; PICK.push({o,when:()=>g.visible}); });
  // видимість: кнопка «Електрика» у режимі етапів, розділ «Об'єкт»
  const onE=()=>!!state.lay.e04&&state.sec==='pz'&&state.proj==='ours'&&!!(R28&&R28.ON());
  const sv4=setVis; setVis=function(){ sv4.apply(this,arguments); const on=onE(); g.visible=on; if(!on) return; const s=STG();
    PART[1].forEach(o=>o.visible=s!=='2'); PART[2].forEach(o=>o.visible=s!=='1'); need=true; };
  const hud4=hudCtx; hudCtx=function(){ hud4.apply(this,arguments); if(state.sec!=='pz'||!(R28&&R28.ON())) return; const m=$('#modes'); if(!m) return;
    const b=document.createElement('button'); b.type='button'; b.textContent='Електрика'; b.title='Щити PV, лінії до контейнерів, спуски (аналіз 04.11)'; b.setAttribute('aria-pressed',String(!!state.lay.e04));
    b.onclick=()=>{ state.lay.e04=!state.lay.e04; apply(); save(); }; if(m.querySelector('button')){ const sp=document.createElement('span'); sp.className='sep'; sp.setAttribute('aria-hidden','true'); m.appendChild(sp); } m.appendChild(b); m.hidden=false;   // після етапів, як кнопка розділу шаблону
    const l=$('#legend'); if(l&&state.lay.e04){ const s=STG(), n=st=>E4.boxes.filter(x=>x.st===st).length;
      l.insertAdjacentHTML('beforeend',`<span class="e4">Електрика: щитів ${s==='2'?n(2):s==='1'?n(1):n(1)+n(2)} · ${['K-3','K-1','K-4','K-5'].filter(k=>E4.boxes.some(x=>x.K===k&&(s==='all'||String(x.st)===s))).map(k=>`<i class="sw" style="background:#${new THREE.Color(KC[k]).getHexString()}"></i>${k}`).join(' ')} · лінії Al 120</span>`); } };
  window.__twin.elec04={g,PART,E4};
  if(window.__twin.clean) apply();   // чиста збірка: перший apply() був до цього модуля — кнопка «Електрика» і її шар з'являються одразу
  } }
