class Canvas:
    def __init__(self,w,h):
        self.w=w;self.h=h;self.im=Image.new('RGB',(w,h),BG);self.d=ImageDraw.Draw(self.im)
        self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="Microsoft JhengHei,sans-serif"><rect width="100%" height="100%" fill="{BG}"/>']
    def text(self,x,y,t,size=22,color=INK,bold=False,anchor='start'):
        f=ImageFont.truetype(BOLD if bold else FONT,size);w=self.d.textlength(t,font=f)
        self.d.text((x-(w/2 if anchor=='middle' else w if anchor=='end' else 0),y),t,font=f,fill=color,anchor='lt')
        self.svg.append(f'<text x="{x}" y="{y+size*.9}" font-size="{size}" fill="{color}" font-weight="{700 if bold else 400}" text-anchor="{anchor}">{html.escape(t)}</text>')
    def rect(self,x,y,w,h,c,stroke=None,lw=1):
        self.d.rectangle((x,y,x+w,y+h),fill=c,outline=stroke,width=round(lw))
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c or "none"}" stroke="{stroke or "none"}" stroke-width="{lw}"/>')
    def line(self,points,c=INK,lw=2,dash=False):
        if dash:
            for a,b in zip(points,points[1:]):
                n=max(1,math.ceil(math.dist(a,b)/8))
                for i in range(0,n,2):self.d.line([(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n) for j in (i,min(n,i+1))],fill=c,width=round(lw))
        else:self.d.line(points,fill=c,width=round(lw))
        pts=' '.join(f'{x:.1f},{y:.1f}' for x,y in points)
        self.svg.append(f'<polyline points="{pts}" fill="none" stroke="{c}" stroke-width="{lw}"'+(' stroke-dasharray="8 8"' if dash else '')+'/>')
    def circle(self,x,y,r,c=None,stroke=None,lw=2):
        self.d.ellipse((x-r,y-r,x+r,y+r),fill=c,outline=stroke,width=round(lw))
        self.svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c or "none"}" stroke="{stroke or "none"}" stroke-width="{lw}"/>')
    def image(self,im,x,y):
        self.im.paste(im,(round(x),round(y)));b=io.BytesIO();im.save(b,format='PNG',optimize=True)
        self.svg.append(f'<image x="{x}" y="{y}" width="{im.width}" height="{im.height}" xlink:href="data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}"/>')
    def save(self,stem):
        self.im.save(OUT/(stem+'.png'),optimize=True)
        (OUT/(stem+'.svg')).write_bytes(('\n'.join(self.svg+['</svg>'])).encode())

def base_plan(source,w,h,box):
    x0,y0,x1,y1=box;s=min(w/(x1-x0),h/(y1-y0));im=Image.new('RGB',(w,h),'#ffffff');d=ImageDraw.Draw(im)
    p=lambda x,y:((x-x0)*s,(y-y0)*s)
    for z,g,*xy in source['triangles']:
        if max(xy[::2])<x0 or min(xy[::2])>x1 or max(xy[1::2])<y0 or min(xy[1::2])>y1:continue
        g=g if z<2 else max(163,g-17)
        d.polygon([p(*xy[i:i+2]) for i in (0,2,4)],fill=(g,g+min(2,255-g),g+min(3,255-g)))
    for x,y,ww,dd in source['walls']:
        if ww*dd<.5:continue
        a,b=p(x,y),p(x+ww,y+dd);d.rectangle((*a,*b),fill='#899197')
    # Windows are identified by the retained plan edges, not bearing surfaces for speakers.
    for a,b in [((1085,375),(1085,580)),((1085,650),(1085,880))]:d.line([p(*a),p(*b)],fill='#79a9b9',width=max(2,round(s*3)))
    return im,s

def arrow(d,a,b,color=INK,lw=3):
    d.line([a,b],color,lw);angle=math.atan2(b[1]-a[1],b[0]-a[0]);r=12
    d.line([(b[0]-r*math.cos(angle-.5),b[1]-r*math.sin(angle-.5)),b,(b[0]-r*math.cos(angle+.5),b[1]-r*math.sin(angle+.5))],color,lw)
