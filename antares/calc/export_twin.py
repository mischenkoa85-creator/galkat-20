import json, math
R=json.load(open('calc/roof_final.json')); G=json.load(open('calc/lantern_gable.json'))
out={k:R[k] for k in ('zones','base','old_v','cnt','COL','wh','total','ep','drop','base0')}; out['mods']=R['mods']
V=G['var']['flush45']; M=V['mods']; T=V['T']; keep=set()
for s in 'EW':
    ms=sorted([i for i,m in enumerate(M) if m[1]==s], key=lambda i:-M[i][3]); keep|=set(ms[:len(ms)//11*11])
h=T['h']; c=math.cos(math.atan(h/1.7)); u0=max(0.02,(1.7/c-2.384)/2)
out['gable']=dict(tilt=T['tilt'], h=h, u0=round(u0,3), offn=round(0.183/c,3), T=T, lans=G['lans'], alt={k:G['var'][k]['T'] for k in ('flush40','gable10')},
  mods=[[m[0], m[1], m[2], round(m[3]), m[4], 1 if i in keep else 0] for i,m in enumerate(M)],
  keep=dict(n=len(keep), kwp=round(len(keep)*0.73,1), mwh=round(sum(M[i][3] for i in keep)/1000,1)))
out['gable']['keep']['net']=round(out['gable']['keep']['mwh']-T['roof_loss'],1)
open('src/roofnewdata.js','w',encoding='utf-8').write('const ROOF26='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';')
print('ok', out['cnt'], out['gable']['keep'])
