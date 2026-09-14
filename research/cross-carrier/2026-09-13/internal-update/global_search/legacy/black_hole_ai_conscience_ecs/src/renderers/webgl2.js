
function shader(gl,type,src){
  const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)||"shader compile failed");
  return s;
}
function program(gl,vs,fs){
  const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||"program link failed");
  return p;
}
function rgb(hex){const h=hex.replace("#","");return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255];}
export class WebGL2Renderer {
  static async create(canvas){return new WebGL2Renderer(canvas);}
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext("webgl2",{alpha:false,antialias:true});
    if(!this.gl)throw new Error("WebGL2 unavailable.");
    this.kind="WebGL2";
    const gl=this.gl;
    this.p=program(gl,`#version 300 es
      in vec2 aPos;in float aSize;in vec3 aColor;uniform float uAspect;out vec3 vColor;
      void main(){gl_Position=vec4(aPos.x/uAspect,aPos.y,0.,1.);gl_PointSize=aSize;vColor=aColor;}`,
      `#version 300 es
      precision highp float;in vec3 vColor;out vec4 o;
      void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);if(r>1.)discard;float a=smoothstep(1.,.35,r);o=vec4(vColor*a,1.);}`
    );
    this.buf=gl.createBuffer();
    this.aPos=gl.getAttribLocation(this.p,"aPos");this.aSize=gl.getAttribLocation(this.p,"aSize");
    this.aColor=gl.getAttribLocation(this.p,"aColor");this.uAspect=gl.getUniformLocation(this.p,"uAspect");
  }
  resize(){
    const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(2,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(2,Math.floor(this.canvas.clientHeight*dpr));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  }
  render(items){
    this.resize();const gl=this.gl,min=Math.min(this.canvas.width,this.canvas.height),data=new Float32Array(items.length*6);let i=0;
    gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(.02,.027,.055,1);gl.clear(gl.COLOR_BUFFER_BIT);
    for(const d of items){const c=rgb(d.fill);data[i++]=d.x;data[i++]=d.y;data[i++]=Math.max(2,d.radius*min);data[i++]=c[0];data[i++]=c[1];data[i++]=c[2];}
    gl.useProgram(this.p);gl.uniform1f(this.uAspect,this.canvas.width/this.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.aPos);gl.vertexAttribPointer(this.aPos,2,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(this.aSize);gl.vertexAttribPointer(this.aSize,1,gl.FLOAT,false,24,8);
    gl.enableVertexAttribArray(this.aColor);gl.vertexAttribPointer(this.aColor,3,gl.FLOAT,false,24,12);
    gl.drawArrays(gl.POINTS,0,items.length);
  }
}
