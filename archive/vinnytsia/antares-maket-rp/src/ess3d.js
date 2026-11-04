// ---------- ESS: деталізація майданчиків УЗЕ (профілі, шафи з АКБ, навіс, контейнер LES-H20)
// Усі деталі збираються в «деталізатор» Det: коробки/циліндри у локальній системі шафи (u — вперед, v — убік),
// потім зливаються в кілька мешів на матеріал (мало draw-call-ів). Внутрішня компоновка схематична.
let ED=null;
function essMats(){ if(ED) return ED; const L=lam, B=c=>new THREE.MeshBasicMaterial({color:c});
  ED={ dark:L(0x2a3036), dark2:L(0x3b444c), steel:L(0xb8c0c6), panel:L(0xf3f5f6), glass:L(0x16222b), led:B(0x3ddc84), ledR:B(0xe0352b), ledY:B(0xf2b705),
    red:L(0xc4372b), yel:L(0xf0b400), blue:L(0x2f7fd1), pipeR:L(0xd2503f), cu:L(0xb9733a), mod:L(0x424c56), modF:L(0x7e8c97), orange:L(0xe07a00),
    rib:L(0xd0d6da), bolt:L(0x9aa3a8), gutter:L(0xaab3b8), concrete:L(0xb4b0a7), skid:L(0x39434b) };
  ED.shell=[MAT.gal,MAT.mps,MAT.sm,MAT.cont,MAT.boxPV,MAT.boxAKB,ED.panel,ED.rib];
  ED.shell.forEach(m=>{ m.userData.op0=m.opacity; });
  return ED; }
class Det{
  constructor(F){ this.F=F||{ox:0,oy:0,ux:1,uy:0,vx:0,vy:1}; this.m=new Map(); }
  _push(mat,geo,X,y,Y){ geo.translate(X,y,-Y); const g=geo.index?geo.toNonIndexed():geo; let a=this.m.get(mat); if(!a){ a={p:[],n:[]}; this.m.set(mat,a); }
    a.p.push(g.attributes.position.array); a.n.push(g.attributes.normal.array); g.dispose(); if(g!==geo) geo.dispose(); }
  _XY(u,v){ const F=this.F; return [F.ox+u*F.ux+v*F.vx, F.oy+u*F.uy+v*F.vy]; }
  box(mat,su,sy,sv,u,y,v){ const F=this.F, [X,Y]=this._XY(u,v);
    const wx=su*Math.abs(F.ux)+sv*Math.abs(F.vx), wy=su*Math.abs(F.uy)+sv*Math.abs(F.vy); this._push(mat,new THREE.BoxGeometry(wx,sy,wy),X,y,Y); }
  // циліндр; ax: 'y' вгору, 'u' уздовж u, 'v' уздовж v
  cyl(mat,r,h,u,y,v,ax,seg){ const F=this.F, [X,Y]=this._XY(u,v), g=new THREE.CylinderGeometry(r,r,h,seg||10);
    if(ax==='u'||ax==='v'){ const alongX=ax==='u'?Math.abs(F.ux)===1:Math.abs(F.vx)===1; if(alongX) g.rotateZ(Math.PI/2); else g.rotateX(Math.PI/2); }
    this._push(mat,g,X,y,Y); }
  finish(group,info,list){ const out=[]; this.m.forEach((a,mat)=>{ let n=0; a.p.forEach(x=>n+=x.length); const P=new Float32Array(n), N=new Float32Array(n); let o=0;
      a.p.forEach((x,i)=>{ P.set(x,o); N.set(a.n[i],o); o+=x.length; });
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('normal',new THREE.BufferAttribute(N,3));
      const me=new THREE.Mesh(g,mat); me.castShadow=mat!==ED.led&&mat!==ED.ledR&&mat!==ED.ledY; me.receiveShadow=true; group.add(me); if(info) info_(me,info); if(list) list.push(me); out.push(me); });
    return out; }
}
const info_=(o,t)=>info(o,t);
function mergeDet(d,s){ s.m.forEach((a,mat)=>{ const t=d.m.get(mat)||{p:[],n:[]}; t.p.push(...a.p); t.n.push(...a.n); d.m.set(mat,t); }); }
// фасадна/бокова поверхня-табличка (канвас-текстура); n — зовнішня нормаль у площині XY світу
const _labTex={};
function labelPlane(F,lines,w,h,u,y,v,nx,ny,o){ o=o||{}; const key=lines.join('|')+(o.bg||'')+(o.fg||'');
  let mat=_labTex[key]; if(!mat){ const c=document.createElement('canvas'), x=c.getContext('2d'); c.width=Math.round(512*(o.sq?1:1)); c.height=Math.round(512*h/w);
    x.fillStyle=o.bg||'rgba(255,255,255,0)'; x.fillRect(0,0,c.width,c.height);
    if(o.warn){ const k=c.height; [0,1,2].forEach(i=>{ const cx=c.width/2+(i-1)*k*1.25, cy=k/2; x.fillStyle='#f2c200'; x.strokeStyle='#1b1b1b'; x.lineWidth=k*0.05; x.beginPath(); x.moveTo(cx,cy-k*0.42); x.lineTo(cx+k*0.46,cy+k*0.38); x.lineTo(cx-k*0.46,cy+k*0.38); x.closePath(); x.fill(); x.stroke(); x.fillStyle='#1b1b1b';
        if(i===0){ x.fillRect(cx-k*0.03,cy-k*0.14,k*0.06,k*0.28); x.fillRect(cx-k*0.03,cy+k*0.2,k*0.06,k*0.06); } else if(i===1){ x.beginPath(); x.moveTo(cx+k*0.06,cy-k*0.22); x.lineTo(cx-k*0.1,cy+k*0.05); x.lineTo(cx,cy+k*0.05); x.lineTo(cx-k*0.06,cy+k*0.3); x.lineTo(cx+k*0.12,cy-k*0.04); x.lineTo(cx+k*0.02,cy-k*0.04); x.closePath(); x.fill(); } else { x.fillRect(cx-k*0.16,cy-k*0.04,k*0.32,k*0.2); x.fillRect(cx-k*0.1,cy-k*0.12,k*0.06,k*0.08); x.fillRect(cx+k*0.04,cy-k*0.12,k*0.06,k*0.08); } }); }
    else { x.fillStyle=o.fg||'#1a232a'; x.textAlign='center'; x.textBaseline='middle'; const n=lines.length, fs=Math.min(c.height/n*0.7, 64*(o.fs||1));
      lines.forEach((t,i)=>{ x.font=`${i===0?'600':'500'} ${i===0?fs:fs*0.62}px "Onest","Segoe UI",sans-serif`; x.fillText(t,c.width/2,c.height*(i+0.5)/n); }); }
    const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=4;
    mat=_labTex[key]=new THREE.MeshBasicMaterial({map:tex,transparent:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,depthWrite:false}); }
  const g=new THREE.PlaneGeometry(w,h); g.rotateY(nx>0?Math.PI/2:nx<0?-Math.PI/2:ny>0?Math.PI:0);
  const m=new THREE.Mesh(g,mat), [X,Y]=[F.ox+u*F.ux+v*F.vx+nx*0.004, F.oy+u*F.uy+v*F.vy+ny*0.004]; m.position.set(X,y,-Y); m.renderOrder=2; return m; }

// ---------- шафа АКБ Galaxy261L (корпус, двері, жалюзі, вентилятори) + схема всередині
function galaxyDet(d,y0,D,W,H){ const E=essMats(), hb=0.1, ht=0.06, f=D/2;
  d.box(E.dark,D-0.05,hb,W-0.05,0,y0+hb/2,0);
  d.box(MAT.gal,D,H-hb-ht,W,0,y0+(hb+H-ht)/2,0);
  d.box(E.panel,D+0.05,ht,W+0.05,0,y0+H-ht/2,0);
  [-0.28,0.28].forEach(v=>{ d.cyl(E.dark,0.17,0.05,-0.22,y0+H+0.025,v); d.cyl(E.steel,0.15,0.012,-0.22,y0+H+0.056,v); d.box(E.dark,0.30,0.012,0.012,-0.22,y0+H+0.064,v); d.box(E.dark,0.012,0.012,0.30,-0.22,y0+H+0.064,v); });
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>d.box(E.dark,0.05,0.04,0.05,a*(D/2-0.05),y0+H+0.02,b*(W/2-0.05)));
  const dy0=0.3, dy1=H-0.3, ym=y0+(dy0+dy1)/2, dh=dy1-dy0;
  [-1,1].forEach(s=>d.box(E.panel,0.012,dh,W/2-0.04,f+0.006,ym,s*W/4));
  d.box(E.dark,0.004,dh,0.02,f+0.002,ym,0);
  [-0.07,0.07].forEach(s=>{ d.box(E.dark,0.03,0.3,0.022,f+0.027,ym,s); d.box(E.dark,0.02,0.03,0.022,f+0.017,ym+0.12,s); d.box(E.dark,0.02,0.03,0.022,f+0.017,ym-0.12,s); });
  for(let i=0;i<6;i++) d.box(E.dark,0.014,0.012,W-0.22,f+0.007,y0+0.13+i*0.028,0);
  d.box(E.led,0.006,0.018,W-0.3,f+0.003,y0+H-0.17,0);
  d.box(E.glass,0.008,0.12,0.2,f+0.016,y0+1.35,-W/4); d.box(E.led,0.006,0.014,0.014,f+0.022,y0+1.31,-W/4-0.06);
  [-1,1].forEach(s=>{ for(let i=0;i<8;i++) d.box(E.dark,D*0.5,0.012,0.008,-0.1,y0+0.34+i*0.05,s*(W/2+0.003)); });
  // всередині: два стовпи АКБ-модулів, трубки рідинного охолодження, блок BMS/PDU, чиллер
  for(let c=-1;c<=1;c+=2) for(let i=0;i<7;i++){ const y=y0+0.34+i*0.175, v=c*0.27; d.box(E.mod,0.9,0.14,0.44,-0.06,y,v); d.box(E.modF,0.012,0.12,0.42,0.39,y,v); d.box(E.led,0.008,0.012,0.012,0.397,y+0.035,v+0.15); d.box(E.dark,0.012,0.012,0.12,0.4,y-0.03,v); }
  d.cyl(E.blue,0.018,1.35,-0.55,y0+0.95,-0.035); d.cyl(E.pipeR,0.018,1.35,-0.55,y0+0.95,0.035);
  d.box(E.blue,0.04,0.03,0.4,-0.55,y0+1.5,-0.035); d.box(E.pipeR,0.04,0.03,0.4,-0.55,y0+1.43,0.035);
  d.box(E.orange,0.8,0.16,0.9,-0.1,y0+1.62,0); d.box(E.dark2,0.9,0.14,0.9,-0.06,y0+0.19,0); d.box(E.dark,0.012,0.1,0.5,0.4,y0+1.62,0); }
// ---------- шафа мікромережі FFD POWER (STS · PCS · IT 500 кВА · EMS)
function ffdDet(d,y0,D,W,H){ const E=essMats(), hb=0.1, ht=0.06, f=D/2;
  d.box(E.dark,D-0.05,hb,W-0.05,0,y0+hb/2,0);
  d.box(MAT.mps,D,H-hb-ht,W,0,y0+(hb+H-ht)/2,0);
  d.box(E.panel,D+0.05,ht,W+0.05,0,y0+H-ht/2,0);
  [-0.4,0.4].forEach(v=>{ d.cyl(E.dark,0.2,0.05,-0.15,y0+H+0.025,v); d.cyl(E.steel,0.18,0.012,-0.15,y0+H+0.056,v); d.box(E.dark,0.36,0.012,0.012,-0.15,y0+H+0.064,v); d.box(E.dark,0.012,0.012,0.36,-0.15,y0+H+0.064,v); });
  d.cyl(E.dark,0.012,0.12,0.35,y0+H+0.06,W/2-0.12); d.cyl(E.ledR,0.032,0.04,0.35,y0+H+0.14,W/2-0.12); d.cyl(E.ledY,0.032,0.04,0.35,y0+H+0.18,W/2-0.12); d.cyl(E.led,0.032,0.04,0.35,y0+H+0.22,W/2-0.12);
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>d.box(E.dark,0.05,0.04,0.05,a*(D/2-0.05),y0+H+0.02,b*(W/2-0.05)));
  const dy0=0.32, dy1=H-0.32, ym=y0+(dy0+dy1)/2, dh=dy1-dy0;
  [-1,1].forEach(s=>d.box(E.panel,0.012,dh,W/2-0.04,f+0.006,ym,s*W/4));
  d.box(E.dark,0.004,dh,0.02,f+0.002,ym,0);
  [-0.06,0.06].forEach(s=>{ d.box(E.dark,0.03,0.34,0.024,f+0.027,ym,s); d.box(E.dark,0.02,0.03,0.024,f+0.017,ym+0.14,s); d.box(E.dark,0.02,0.03,0.024,f+0.017,ym-0.14,s); });
  for(let i=0;i<7;i++) d.box(E.dark,0.014,0.012,W-0.3,f+0.007,y0+0.13+i*0.026,0);
  for(let i=0;i<7;i++) d.box(E.dark,0.014,0.012,W-0.3,f+0.007,y0+H-0.3+i*0.026-0.0,0);
  d.box(E.glass,0.008,0.16,0.28,f+0.016,y0+1.0,-W/4); d.box(E.led,0.006,0.014,0.014,f+0.022,y0+0.94,-W/4-0.1);
  d.cyl(E.red,0.035,0.03,f+0.018,y0+0.7,-W/4,'u'); d.cyl(E.yel,0.045,0.01,f+0.012,y0+0.7,-W/4,'u');
  [-1,1].forEach(s=>{ for(let i=0;i<9;i++) d.box(E.dark,D*0.55,0.012,0.008,-0.05,y0+0.34+i*0.05,s*(W/2+0.003)); });
  // всередині: IT 500 кВА (осердя і три котушки), PCS (шухляди з індикацією), STS (автомати, шини)
  const v1=-W/2+0.3, v2=0, v3=W/2-0.3;
  d.box(E.dark2,0.5,0.9,0.46,-0.1,y0+0.62,v1); [-0.15,0,0.15].forEach(o=>d.cyl(E.cu,0.095,0.7,-0.1,y0+0.62,v1+o)); d.box(E.dark2,0.5,0.14,0.46,-0.1,y0+1.14,v1);
  for(let i=0;i<7;i++){ const y=y0+0.33+i*0.2; d.box(E.mod,0.8,0.17,0.5,-0.06,y,v2); d.box(E.modF,0.012,0.15,0.48,0.34,y,v2); d.box(E.led,0.008,0.012,0.012,0.346,y+0.04,v2+0.18); }
  for(let i=0;i<4;i++){ d.box(E.dark,0.12,0.2,0.1,0.2,y0+0.5+i*0.3,v3-0.1); d.box(E.orange,0.03,0.05,0.04,0.28,y0+0.5+i*0.3,v3-0.1); }
  [-0.12,0,0.12].forEach(o=>d.box(E.cu,0.02,1.4,0.03,-0.35,y0+0.95,v3+o)); d.box(E.dark,0.012,0.1,0.3,0.34,y0+1.78,v3); }
// ---------- SM (обмеження генерації / Zero Export) і шафи ЩР на фасаді
function smDet(d,y0,D,W,H){ const E=essMats(), f=D/2;
  d.box(MAT.sm,D,H,W,0,y0+H/2,0); d.box(E.panel,D+0.04,0.03,W+0.04,0,y0+H+0.015,0);
  d.box(E.panel,0.01,H-0.12,W-0.1,f+0.005,y0+H/2,0); d.box(E.dark,0.025,0.16,0.02,f+0.022,y0+H/2,W/2-0.1);
  d.box(E.glass,0.006,0.14,0.2,f+0.012,y0+H*0.7,-0.05); d.box(E.led,0.005,0.012,0.012,f+0.017,y0+H*0.7-0.04,-0.12);
  for(let i=0;i<3;i++) d.cyl(E.dark,0.015,0.1,-0.12+i*0.12,y0-0.0+0.02,0,'y'); }
function wallBoxDet(d,y0,D,W,H,mat,hood){ const E=essMats(), f=D/2;
  d.box(mat,D,H,W,0,y0+H/2,0); d.box(E.dark,D+0.04,0.03,W+0.06,0.02,y0+H+0.015,0);
  d.box(E.panel,0.008,H-0.1,W-0.1,f+0.004,y0+H/2,0); d.box(E.dark,0.02,0.14,0.02,f+0.016,y0+H/2,W/2-0.09);
  const n=Math.max(3,Math.round(W/0.12)); for(let i=0;i<n;i++) d.cyl(E.dark,0.014,0.09,0,y0-0.035,-W/2+0.07+i*((W-0.14)/(n-1)),'y',8); }

// ---------- контейнер LES-H20-1205W500C-PS-EU (габарит 20 ft прийнято, уточнити за паспортом)
function contDet(d,y0){ const E=essMats(), L=6.058, Wd=2.438, H=2.896, hf=0.18;
  d.box(E.skid,L,0.14,Wd,0,y0+0.07,0); [-1,1].forEach(s=>d.box(E.skid,L-0.2,0.1,0.18,0,y0+0.05,s*(Wd/2-0.5)));
  d.box(MAT.cont,L,H-0.14,Wd,0,y0+0.14+(H-0.14)/2,0);
  // гофра стін (вертикальні ребра на довгих сторонах)
  const nr=Math.floor((L-0.7)/0.11); for(let i=0;i<nr;i++){ const u=-L/2+0.35+i*0.11; [-1,1].forEach(s=>d.box(E.rib,0.045,H-0.5,0.012,u,y0+0.14+(H-0.14)/2,s*(Wd/2+0.006))); }
  // кутові фітинги, верхня й нижня рами
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([a,b])=>{ d.box(E.dark2,0.16,0.12,0.16,a*(L/2-0.05),y0+H-0.06,b*(Wd/2-0.05)); d.box(E.dark2,0.16,0.12,0.16,a*(L/2-0.05),y0+0.2,b*(Wd/2-0.05)); });
  d.box(E.dark2,L,0.08,0.1,0,y0+H-0.04,Wd/2-0.05); d.box(E.dark2,L,0.08,0.1,0,y0+H-0.04,-Wd/2+0.05);
  // дах: вентиляційні грибки, світлова сигналізація
  [-1.8,0,1.8].forEach(u=>{ d.cyl(E.dark,0.12,0.1,u,y0+H+0.05,-0.6); d.cyl(E.steel,0.14,0.02,u,y0+H+0.11,-0.6); });
  d.box(E.dark2,1.0,0.06,0.5,-2.2,y0+H+0.03,0.5); d.cyl(E.ledR,0.04,0.08,L/2-0.2,y0+H+0.1,Wd/2-0.2);
  // торець з двостулковими дверима (на +u)
  const f=L/2; d.box(E.panel,0.02,H-0.5,Wd/2-0.12,f+0.01,y0+0.14+(H-0.14)/2,-Wd/4+0.0); d.box(E.panel,0.02,H-0.5,Wd/2-0.12,f+0.01,y0+0.14+(H-0.14)/2,Wd/4);
  d.box(E.dark,0.008,H-0.45,0.02,f+0.004,y0+0.14+(H-0.14)/2,0);
  [-0.5,-0.15,0.15,0.5].forEach(v=>{ d.cyl(E.steel,0.012,H-0.6,f+0.035,y0+0.14+(H-0.14)/2,v); d.box(E.dark,0.03,0.12,0.05,f+0.04,y0+1.4,v); });
  [-0.95,0.95].forEach(v=>[0.5,1.4,2.3].forEach(y=>d.box(E.dark,0.03,0.12,0.05,f+0.02,y0+y,v)));
  // довга сторона v+ (до обслуговування): сервісні двері, дві HVAC-установки, шафа пожежогасіння, ввід кабелів
  const sv=Wd/2;
  d.box(E.panel,0.9,H-0.7,0.025,-1.2,y0+0.14+(H-0.5)/2,sv+0.012); d.box(E.dark,0.04,0.04,0.05,-0.88,y0+1.35,sv+0.04); d.box(E.glass,0.3,0.4,0.01,-1.2,y0+1.95,sv+0.028);
  [0.35,1.75].forEach(u=>{ d.box(E.dark2,1.1,0.9,0.22,u,y0+2.05,sv+0.11); d.cyl(E.dark,0.3,0.03,u-0.0,y0+2.05,sv+0.23,'v',16); d.cyl(E.steel,0.26,0.01,u,y0+2.05,sv+0.245,'v',16); d.box(E.dark,0.012,0.5,0.012,u,y0+2.05,sv+0.255); d.box(E.dark,0.5,0.012,0.012,u,y0+2.05,sv+0.255); for(let i=0;i<5;i++) d.box(E.dark,1.0,0.012,0.012,u,y0+1.7+i*0.02,sv+0.221); });
  d.box(E.red,0.5,0.7,0.2,2.5,y0+0.9,sv+0.1); d.box(E.panel,0.4,0.55,0.01,2.5,y0+0.9,sv+0.205);
  d.box(E.dark2,0.7,0.5,0.2,-2.55,y0+0.7,sv+0.1); for(let i=0;i<5;i++) d.cyl(E.dark,0.025,0.1,-2.8+i*0.1,y0+0.38,sv+0.12,'y',8);
  // схема всередині: стійки АКБ вздовж обох довгих стін, прохід, відсік PCS/STS біля дверей
  for(let s=-1;s<=1;s+=2) for(let k=0;k<5;k++){ const u=-2.35+k*0.78; for(let i=0;i<8;i++){ d.box(E.mod,0.64,0.22,0.9,u,y0+0.4+i*0.27,s*0.72); d.box(E.modF,0.64,0.2,0.012,u,y0+0.4+i*0.27,s*0.27); d.box(E.led,0.012,0.012,0.012,u+0.2,y0+0.43+i*0.27,s*0.275); } }
  d.box(E.dark2,0.9,2.2,1.6,2.35,y0+1.25,0); for(let i=0;i<6;i++) d.box(E.modF,0.012,0.2,1.4,2.8,y0+0.5+i*0.32,0);
  d.cyl(E.blue,0.03,2.2,-2.85,y0+1.3,-0.4); d.cyl(E.pipeR,0.03,2.2,-2.85,y0+1.3,0.4); }

// ---------- профнастил ПС-20 (хвилястий) по похилій площині
function corrSheet(F,u0,u1,v0,v1,yAt,mat){ const pitch=0.1375, hh=0.02, t=0.004, nU=Math.round((u1-u0)/pitch), pts=[];
  for(let i=0;i<nU;i++){ const a=u0+i*pitch; pts.push([a,0],[a+pitch*0.18,hh],[a+pitch*0.5,hh],[a+pitch*0.68,0]); } pts.push([u1,0]);
  const P=[], idx=[], sx=(u,y,v)=>{ const X=F.ox+u*F.ux+v*F.vx, Y=F.oy+u*F.uy+v*F.vy; return [X,y,-Y]; }; let k=0;
  const quad=(a,b,c,d2)=>{ P.push(...a,...b,...c,...d2); idx.push(k,k+1,k+2,k,k+2,k+3); k+=4; };
  for(let i=0;i<pts.length-1;i++){ const [ua,ya]=pts[i], [ub,yb]=pts[i+1];
    quad(sx(ua,yAt(v0)+ya,v0),sx(ub,yAt(v0)+yb,v0),sx(ub,yAt(v1)+yb,v1),sx(ua,yAt(v1)+ya,v1));
    quad(sx(ua,yAt(v0)+ya-t,v0),sx(ub,yAt(v0)+yb-t,v0),sx(ub,yAt(v1)+yb-t,v1),sx(ua,yAt(v1)+ya-t,v1)); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; return m; }

// ---------- майданчики УЗЕ
let ESSXR=false; const essSheets=[];
function essVisApply(){ essCab.forEach(m=>{ if(ESSV!=='cab') m.visible=false; }); essSheets.forEach(m=>{ if(ESSXR) m.visible=false; }); }
function setEssXray(on){ ESSXR=on; essMats(); ED.shell.forEach(m=>{ m.transparent=on; m.opacity=on?0.16:(m.userData.op0===undefined?1:m.userData.op0); m.depthWrite=!on; m.needsUpdate=true; });
  $$('#essview button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.xv===(on?'in':'out')))); applyStep(); requestRender(); }
function buildEssPads(){ const E=essMats();
  D.pads.forEach(p=>{ const alongY=p.axis==='y';
    const cu=alongY?(p.y0+p.y1)/2:(p.x0+p.x1)/2, cv=alongY?(p.x0+p.x1)/2:(p.y0+p.y1)/2;
    const L2W=(u,v)=>alongY?[cv+v,cu+u]:[cu+u,cv+v];
    const Fp=alongY?{ox:cv,oy:cu,ux:0,uy:1,vx:1,vy:0}:{ox:cu,oy:cv,ux:1,uy:0,vx:0,vy:1};   // u — уздовж довгої сторони, v — упоперек (v>0 — від будівлі для MS-1/2)
    const bxUV=(u0,u1,v0,v1,z0,z1,mat,par)=>{ const a=L2W(u0,v0), b=L2W(u1,v1); return boxXY(Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1]),z0,z1,mat,par); };
    const len=(alongY?p.y1-p.y0:p.x1-p.x0), wid=(alongY?p.x1-p.x0:p.y1-p.y0);
    info(bxUV(-len/2,len/2,-wid/2,wid/2,-0.25,-0.005,MAT.cushion,G.essF),`${p.id}: ущільнена піщано-щебенева подушка 250 мм\nмайданчик ${nf(len,1)} × ${nf(wid,1)} м (ЕТР арк. 2)`);
    // лежні ЛЖ-16 з монтажними петлями
    { const d=new Det(Fp); SLP.forEach(u0=>{ const u=u0-4.545; d.box(E.concrete,0.3,0.45,1.6,u,0.225,0); [-0.5,0.5].forEach(v=>{ d.box(E.dark,0.02,0.1,0.02,u,0.5,v-0.03); d.box(E.dark,0.02,0.1,0.02,u,0.5,v+0.03); d.box(E.dark,0.02,0.02,0.08,u,0.56,v); }); });
      d.finish(G.essF,'Лежень залізобетонний ЛЖ-16, 430 кг\n9 шт на групу (серія 3.407.1-157)'); }
    // рама РМ-1 (двотаврово/швелерні профілі: стінка + полиці)
    { const d=new Det(Fp), z0=0.45, z1=0.61; const web=(u0,u1,v0,v1)=>d.box(MAT.frame,u1-u0,z1-z0,v1-v0,(u0+u1)/2,(z0+z1)/2,(v0+v1)/2);
      [-0.675,0.675].forEach(v=>{ web(-4.545,4.545,v-0.003,v+0.003); web(-4.545,4.545,v-0.032,v+0.032); d.box(MAT.frame,9.09,0.008,0.064,0,z0+0.004,v); d.box(MAT.frame,9.09,0.008,0.064,0,z1-0.004,v); });
      [-4.545,4.545].forEach(u=>{ d.box(MAT.frame,0.006,z1-z0,1.28,u,(z0+z1)/2,0); d.box(MAT.frame,0.064,0.008,1.28,u,z0+0.004,0); d.box(MAT.frame,0.064,0.008,1.28,u,z1-0.004,0); });
      [-3,-1.5,0,1.5,3].forEach(u=>[-0.675,0.675].forEach(v=>d.cyl(E.bolt,0.011,0.02,u,z1+0.008,v)));
      d.finish(G.essF,`${p.id}: рама РМ-1 під шафами`); }
    // фундаменти ФМ-1, закладні, анкерні болти
    const FM=[[-4.725,1.1,2.75],[0,1.1,2.75],[4.725,1.1,2.75],[-4.725,-1.1,3.0],[4.725,-1.1,3.0]];
    { const d=new Det(Fp); FM.forEach(([u,v])=>{ d.box(MAT.fm,0.35,1.4,0.35,u,-0.5,v); d.box(MAT.fm,0.6,0.1,0.6,u,-1.25,v); }); d.finish(G.essF,'Фундамент ФМ-1, бетон С20/25 F100\nзакладна З-1, болти М16×600'); }
    // навіс: стійки □120×120×4 з опорною плитою, болтами і ребрами; прогони (прямокутна труба) з торцевими плитами; профнастил ПС-20; жолоб і водостік
    const hAt=v=>0.2+2.75+(1.1-v)/2.2*0.25+0.04;
    { const d=new Det(Fp);
      FM.forEach(([u,v,h])=>{ d.box(E.steel,0.26,0.012,0.26,u,0.2+0.006,v); [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([a,b])=>{ d.cyl(E.bolt,0.008,0.09,u+a*0.1,0.2+0.05,v+b*0.1); d.cyl(E.bolt,0.014,0.012,u+a*0.1,0.2+0.018,v+b*0.1,'y',6); });
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>d.box(E.steel,a?0.008:0.06,0.11,a?0.06:0.008,u+a*0.064,0.2+0.07,v+b*0.064));
        d.box(MAT.col,0.12,h,0.12,u,0.2+h/2,v); d.box(E.steel,0.15,0.01,0.15,u,0.2+h+0.005,v); });
      d.finish(G.essE,`Стійка навісу □120×120×4, на опорній плиті з 4 болтами; h = 2,75 / 3,0 м`,essCab);
      const d2=new Det(Fp); [-1.1,0,1.1].forEach(v=>{ const y=hAt(v); d2.box(MAT.col,9.38,0.08,0.08,0,y,v); [-4.69,4.69].forEach(u=>d2.box(E.steel,0.008,0.12,0.12,u,y,v)); });
      [1.1,-1.1].forEach(v=>FM.filter(q=>Math.abs(q[1]-v)<0.01).forEach(([u])=>d2.box(E.steel,0.14,0.012,0.14,u,hAt(v)-0.046,v)));
      d2.finish(G.essE,'Прогін навісу з прямокутної труби, на стійках через опорні плити',essCab);
      const d3=new Det(Fp); const gy=hAt(1.1)+0.04; // жолоб на нижньому (v>0) краї
      d3.box(E.gutter,9.5,0.012,0.14,0,gy-0.1,1.28); d3.box(E.gutter,9.5,0.08,0.008,0,gy-0.06,1.35); d3.box(E.gutter,9.5,0.1,0.008,0,gy-0.05,1.21); d3.cyl(E.gutter,0.035,hAt(1.1)+0.0,4.6,(gy-0.1)/2,1.3,'y');
      d3.finish(G.essE,'Жолоб і водостічна труба навісу',essCab); }
    const sh=corrSheet(Fp,-4.875,4.875,-1.25,1.25,v=>hAt(v)+0.05,MAT.sheet); sh.material.side=THREE.DoubleSide; G.essE.add(sh); essCab.push(sh); essSheets.push(sh); info(sh,`${p.id}: навіс з профнастилу ПС-20, 9,75 × 2,5 м\nстійки 3,0 / 2,75 м`); bMeshes.push(sh);
    // шафи (положення з ЕТР арк. 2): фронт — у бік від будівлі
    const top=0.61, Hc=1.85, fr=alongY?[1,0]:[0,-1];
    const FF=(b)=>{ const cx=(b[0]+b[1])/2, cy=(b[2]+b[3])/2, dd=alongY?b[1]-b[0]:b[3]-b[2], ww=alongY?b[3]-b[2]:b[1]-b[0];
      return [{ox:cx,oy:cy,ux:fr[0],uy:fr[1],vx:alongY?0:1,vy:alongY?1:0},dd,ww]; };
    { const d=new Det(); const lab=[];
      p.gal.forEach((g,i)=>{ const [F,dd,ww]=FF(g); const dm=new Det(F); galaxyDet(dm,top,dd,ww,Hc);
        mergeDet(d,dm);
        lab.push(labelPlane(F,['Galaxy261L','261 кВт·год · LFP · IP54'],0.86,0.2,dd/2,top+1.46,ww/4,fr[0],fr[1],{fg:'#12202b'})); lab.push(labelPlane(F,[''],0.5,0.09,dd/2,top+1.67,0,fr[0],fr[1],{warn:true})); });
      d.finish(G.essE,`${p.id}: Galaxy261L (5 шаф)\nLFP 261 кВт·год на шафу, рідинне охолодження, IP54\nвнутрішня компоновка на моделі схематична`,essCab); lab.forEach(m=>{ G.essE.add(m); essCab.push(m); }); }
    { const [F,dd,ww]=FF(p.mps), d=new Det(F); ffdDet(d,top,dd,ww,Hc);
      d.finish(G.essE,`${p.id}: шафа мікромережі FFD POWER 500 кВт\nSTS · PCS · IT 500 кВА · 10 MPPT · EMS\n${nf(p.kwp,1)} кВтп → ${p.tp}\nвнутрішня компоновка на моделі схематична`,essCab).forEach(()=>{});
      [labelPlane(F,['FFD POWER 500 кВт','STS · PCS · IT 500 кВА · EMS'],1.1,0.24,dd/2,top+1.4,0,fr[0],fr[1],{fg:'#12202b',fs:0.8}),labelPlane(F,[''],0.5,0.09,dd/2,top+1.72,0,fr[0],fr[1],{warn:true})].forEach(m=>{ G.essE.add(m); essCab.push(m); }); }
    { const d=new Det(); p.sm.forEach(g=>{ const [F,dd,ww]=FF(g), dm=new Det(F); smDet(dm,top,dd,ww,1.2); mergeDet(d,dm); }); d.finish(G.essE,`${p.id}: пристрій обмеження генерації SM / щит керування`); }
    // варіант: контейнер LES-H20 (LES-H20-1205W500C-PS-EU, габарит 20 ft прийнято)
    { const Fc=alongY?Fp:{ox:cu,oy:cv,ux:1,uy:0,vx:0,vy:-1}, d=new Det(Fc); contDet(d,0.61); d.finish(G.essC,`${p.id}: контейнер LES-H20-1205W500C-PS-EU\n500 кВт / ≈1 205 кВт·год, 768 В, 12 PV-входів\nSTS за комплектацією; габарит 20 ft прийнято, уточнити за паспортом\n${nf(p.kwp,1)} кВтп → ${p.tp}\nвнутрішня компоновка на моделі схематична`);
      G.essC.add(labelPlane(Fc,['LES-H20','500 кВт · ≈1 205 кВт·год'],1.8,0.42,1.2,0.61+0.95,1.221,Fc.vx,Fc.vy,{fg:'#14323f',fs:1.0})); }
    // ЩР-PV і ЩР-АКБ: на фасаді (MS-1/2) або на стійці (MS-3)
    p.pv.forEach((b,i)=>{ const X=(b[0]+b[1])/2, Y=(b[2]+b[3])/2, d=new Det(alongY?{ox:96.74,oy:Y,ux:1,uy:0,vx:0,vy:1}:{ox:X,oy:120.13,ux:0,uy:-1,vx:1,vy:0}); wallBoxDet(d,1.15,0.16,0.5,0.6,MAT.boxPV); d.finish(G.essE,`${p.pvn[i]} · WRP18-3\n10 ОПН T1+T2, 20 запобіжників gPV 25 А / 1000 В`); });
    { const a=p.akb, Xa=(a[0]+a[1])/2, Ya=(a[2]+a[3])/2, d=new Det(alongY?{ox:96.86,oy:Ya,ux:1,uy:0,vx:0,vy:1}:{ox:Xa,oy:120.25,ux:0,uy:-1,vx:1,vy:0}); wallBoxDet(d,0.9,0.4,1.0,0.8,MAT.boxAKB); d.finish(G.essE,`${p.akbn} · GT 80-100-40 IP66\n5 роз’єднувачів + NH2 gPV 250 А / 1000 В`); }
    if(!alongY){ [[31.85,120.3],[36.2,120.3]].forEach(q=>boxXY(q[0]-0.04,q[0]+0.04,q[1]-0.04,q[1]+0.04,0,1.9,MAT.col,G.essE)); }
    const t=new THREE.Object3D(); const c=L2W(0,0); t.position.set(c[0],top+Hc+0.3,-c[1]); G.essE.add(t); essTags.push([t,p]); }); }
const W2=w=>w/4;
