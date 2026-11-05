// ================= Контейнери детально (src/bessdet.js, 05.11.2026): закладні, заземлення, перемички, вводи — за томом 8 «УЗЕ» (26.10.2026)
// Фп-1: плита 7 058 × 3 438 × 250, верх +0,300; 4 закладні МН-1 300 × 300 × 16 під кутові фітинги. Заземлення: контур зі смуги 25 × 4 оцинк. на 1 м від плити,
// на глибині 0,5 м (29 м на контейнер), 4 вертикальні заземлювачі G-16/30 по 3 м, перемички Cu 95 від закладної до точки GND M12 контейнера.
// Контур заземлення показується в «Накопичувачах» з «Лінії AC»; закладні й перемички — завжди.
{ if(window.__twin.clean){
const L=6.058, WD=2.438, SL=[L+1,WD+1], LP=[SL[0]/2+1,SL[1]/2+1];
const MB={pl:std(lin(0x6d757b),{metalness:0.6,roughness:0.4}), zn:std(lin(0x9ccc3c),{metalness:0.3,roughness:0.5}), cu:std(lin(0xc0703a),{metalness:0.6,roughness:0.35}),
  el:std(lin(0x8a6a3a),{metalness:0.5,roughness:0.4}), p110:std(lin(0x3a3f44),{roughness:0.7}), p63:std(lin(0xe0782b),{roughness:0.6})};
const BOX=(w,h,d,m,x,y,z,g)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=false; o.receiveShadow=true; g.add(o); return o; };
const CN=[];
scene.traverse(o=>{ const u=o.userData&&o.userData.info; if(o.isMesh&&u&&typeof u==='object'&&/^K-[1345] · Golen/.test(u.t||'')&&o.parent) CN.push({id:u.t.slice(0,3),g:o.parent}); });
const EG=[], INF=(o,t,d)=>{ o.userData.info={t,d}; PICK.push({o,when:()=>o.visible&&o.parent&&o.parent.visible}); };
CN.forEach(({id,g})=>{ const P=new THREE.Group(), E=new THREE.Group(); P.name='bessdet'; g.add(P); g.add(E); EG.push(E);
  // закладні МН-1 під кутовими фітингами (верх плити = низ контейнера)
  [-1,1].forEach(sx=>[-1,1].forEach(sz=>INF(BOX(0.3,0.016,0.3,MB.pl,sx*(L/2-0.15),0.004,sz*(WD/2-0.15),P),`Закладна МН-1 · ${id}`,'300 × 300 × 16 з 4 анкерами Ø16 під кутовий фітинг; фітинг приварюється після встановлення (том 8, вузол А).')));
  // контур заземлення: смуга 25 × 4 на 1 м від плити, на глибині 0,5 м (показано на поверхні); 4 заземлювачі по кутах
  const y=-0.29;
  [[0,LP[1],2*LP[0],0.025],[0,-LP[1],2*LP[0],0.025],[LP[0],0,0.025,2*LP[1]],[-LP[0],0,0.025,2*LP[1]]].forEach(([x,z,w,d])=>INF(BOX(w,0.004,d,MB.zn,x,y,z,E),`Контур заземлення · ${id}`,`Смуга 25 × 4 оцинкована на 1 м від плити, на глибині 0,5 м (у моделі — на поверхні): ${nf(2*(2*LP[0]+2*LP[1]),1)} м; 4 вертикальні заземлювачі G-16/30 по 3 м; опір — вимірювання з протоколом. Контейнери поруч — контури з'єднати (уточнюється).`));
  [-1,1].forEach(sx=>[-1,1].forEach(sz=>INF(BOX(0.06,0.04,0.06,MB.el,sx*LP[0],y+0.02,sz*LP[1],E),`Заземлювач G-16/30 · ${id}`,'Сталь з мідним покриттям Ø16, 3 м, по куту контуру.')));
  // перемички Cu 95: закладна — точка GND M12 контейнера (по діагоналі)
  [[-1,-1],[1,1]].forEach(([sx,sz])=>{ const a=new V3(sx*(L/2-0.15),0.02,sz*(WD/2+0.02)), b=new V3(sx*(L/2-0.4),0.25,sz*(WD/2+0.02));
    const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,new V3((a.x+b.x)/2,0.06,a.z),b]),12,0.008,6,false),MB.cu); m.castShadow=false; P.add(m);
    INF(m,`Перемичка Cu 95 · ${id}`,'Гнучкий провідник Cu 95 мм² з наконечниками M12: закладна МН-1 — точка GND контейнера; ще одна — до контуру заземлення.'); });
});
const sv=setVis; setVis=function(){ sv.apply(this,arguments); const on=state.sec==='uze'&&state.lay.uAC!==false; EG.forEach(e=>e.visible=on); };
window.__twin.bessdet={CN:CN.map(c=>c.id)};
} }
