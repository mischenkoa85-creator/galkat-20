// ---------- Записка: перерахунок сум у євро за курсом
(function noteInit(){
  const root=document.querySelector('[data-pane="note"]'); if(!root) return;
  const DEF={E:50.31,U:44.89};
  const rate={E:DEF.E,U:DEF.U};
  try{ const s=JSON.parse(localStorage.getItem('ant-rate')||'null'); if(s&&s.E>0&&s.U>0){rate.E=s.E;rate.U=s.U;} }catch(e){}
  const iE=root.querySelector('#rE'), iU=root.querySelector('#rU');
  const nf=(x,d)=>x.toLocaleString('uk-UA',{minimumFractionDigits:d,maximumFractionDigits:d});
  function toEur(c,v){ if(c==='EUR')return v; if(c==='UAH')return v/rate.E; if(c==='UAHk')return v*1000/rate.E; if(c==='USD')return v*rate.U/rate.E; return NaN; }
  function fmt(x,f){
    switch(f){
      case 'm': return nf(x/1e6,2)+' млн €';
      case 'k0': return nf(x/1e3,0);
      case 'd0': return (x>=0?'+':'−')+nf(Math.abs(x)/1e3,0);
      case 'e0': return nf(x,0);
      case 'e0u': return nf(x,0)+' €';
      case 'e3': return nf(x,3)+' €';
      default: return nf(x/1e3,0)+' тис. €';
    }
  }
  function render(){
    const val={}, els=[...root.querySelectorAll('.cv')];
    els.forEach(el=>{ if(el.dataset.c){ let x=toEur(el.dataset.c,+el.dataset.v); if(el.dataset.per) x/=+el.dataset.per; if(el.id) val[el.id]=x; el.textContent=fmt(x,el.dataset.f); } });
    els.forEach(el=>{
      if(el.dataset.ref){ el.textContent=fmt(val[el.dataset.ref],el.dataset.f); }
    });
    els.forEach(el=>{
      if(el.dataset.sum){ let t=0; el.dataset.sum.split(',').forEach(k=>{ const neg=k[0]==='-'; const id=neg?k.slice(1):k; t+=(neg?-1:1)*val[id]; }); if(el.id) val[el.id]=t; el.textContent=fmt(t,el.dataset.f); }
    });
  }
  function sync(){ iE.value=rate.E; iU.value=rate.U; }
  function onIn(){ const e=parseFloat(iE.value), u=parseFloat(iU.value); if(e>0&&u>0){ rate.E=e; rate.U=u; try{localStorage.setItem('ant-rate',JSON.stringify(rate));}catch(x){} render(); } }
  iE.addEventListener('input',onIn); iU.addEventListener('input',onIn);
  root.querySelector('#rReset').addEventListener('click',()=>{ rate.E=DEF.E; rate.U=DEF.U; try{localStorage.removeItem('ant-rate');}catch(x){} sync(); render(); });
  sync(); render();
})();
