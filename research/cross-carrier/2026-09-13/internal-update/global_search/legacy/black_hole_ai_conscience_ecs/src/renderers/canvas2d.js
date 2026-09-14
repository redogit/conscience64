
export class Canvas2DRenderer {
  static async create(canvas) { return new Canvas2DRenderer(canvas); }
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("Canvas 2D unavailable.");
    this.kind = "Canvas 2D";
  }
  resize() {
    const dpr=Math.min(devicePixelRatio||1,2);
    const w=Math.max(2,Math.floor(this.canvas.clientWidth*dpr));
    const h=Math.max(2,Math.floor(this.canvas.clientHeight*dpr));
    if(this.canvas.width!==w || this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  }
  render(items) {
    this.resize();
    const c=this.ctx, w=this.canvas.width, h=this.canvas.height, m=Math.min(w,h);
    c.fillStyle="#05070e"; c.fillRect(0,0,w,h);
    for(const d of items){
      const x=w/2+d.x*m/2, y=h/2-d.y*m/2, r=Math.max(1,d.radius*m/2);
      const g=c.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,d.fill); g.addColorStop(1,d.edge||d.fill);
      c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=g; c.fill();
      if(d.ring){c.beginPath();c.arc(x,y,r*1.55,0,Math.PI*2);c.strokeStyle=d.ring;c.lineWidth=Math.max(1,r*.08);c.stroke();}
    }
  }
}
