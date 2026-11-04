# crop with coordinate grid (full-res pixel coords) for picking points
import sys
from PIL import Image, ImageDraw, ImageFont
FD='/tmp/claude-0/-home-claude/48137fe6-4c58-5aa6-90c7-d55006f4596f/scratchpad/artifact-files/9faf1b11-04e1-4470-acaf-f54d7b58cfce/foto/'
FT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
def grid(name, x0, y0, x1, y1, step=50, zoom=1.0, out=None):
    im=Image.open(FD+name+'.jpg').convert('RGB').crop((x0,y0,x1,y1))
    if zoom!=1: im=im.resize((int((x1-x0)*zoom), int((y1-y0)*zoom)))
    d=ImageDraw.Draw(im)
    for x in range((x0//step+1)*step, x1, step):
        X=(x-x0)*zoom; d.line([(X,0),(X,im.size[1])], fill=(255,255,0) if x%(step*2)==0 else (0,255,255), width=1); d.text((X+2,2), str(x), fill=(255,255,0), font=FT)
    for y in range((y0//step+1)*step, y1, step):
        Y=(y-y0)*zoom; d.line([(0,Y),(im.size[0],Y)], fill=(255,255,0) if y%(step*2)==0 else (0,255,255), width=1); d.text((2,Y+2), str(y), fill=(255,255,0), font=FT)
    out=out or f'ph/g_{name}_{x0}_{y0}.jpg'; im.save(out, quality=90); return out
if __name__=='__main__':
    a=sys.argv[1:]; print(grid(a[0], *map(int,a[1:5]), step=int(a[5]) if len(a)>5 else 50, zoom=float(a[6]) if len(a)>6 else 1.0))
