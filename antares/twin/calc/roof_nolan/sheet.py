import sys
from PIL import Image, ImageDraw, ImageFont
FD='/tmp/claude-0/-home-claude/48137fe6-4c58-5aa6-90c7-d55006f4596f/scratchpad/artifact-files/9faf1b11-04e1-4470-acaf-f54d7b58cfce/foto/'
FT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
def sheet(names, w=400, out='ph/sheet.jpg', crop=None):
    ims=[]
    for n in names:
        im=Image.open(FD+n+'.jpg').convert('RGB')
        if crop: im=im.crop(crop)
        im=im.resize((w,int(im.size[1]*w/im.size[0]))); d=ImageDraw.Draw(im); d.rectangle([0,0,w,18],fill=(0,0,0)); d.text((3,1),n[-6:],fill=(255,255,0),font=FT); ims.append(im)
    H=max(i.size[1] for i in ims); S=Image.new('RGB',(sum(i.size[0]+6 for i in ims),H),'white'); x=0
    for i in ims: S.paste(i,(x,0)); x+=i.size[0]+6
    S.save(out,quality=85); return out
if __name__=='__main__':
    print(sheet(sys.argv[2:], out=sys.argv[1]))
