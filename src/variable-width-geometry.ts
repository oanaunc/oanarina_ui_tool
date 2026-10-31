import type {DesignNode,VectorContour,VectorPoint} from './model';

type P={x:number;y:number};
type Cubic=[P,P,P,P];
/** One cross section of a band. `n` is the +1 side's unit normal; left/right are half widths on the +1/−1 sides. */
export interface WidthFrame {c:P;n:P;t:P;left:number;right:number;}
export interface WidthSegment {start:number;end:number;curved:boolean;frames:WidthFrame[];length:number;frameAt:(t:number)=>WidthFrame;parameters:number[];}
const TILE_BUDGET=8192;
const HANDLE_EPSILON=1e-10,near=(h:P|undefined)=>!h||Math.hypot(h.x,h.y)<=HANDLE_EPSILON;
const lerp=(a:P,b:P,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export function halfWidths(p:VectorPoint,base:number){const width=base*(p.widthScale??1),bias=p.widthBias??0;return {left:width/2*(1+bias),right:width/2*(1-bias)};}
export function contourCubics(n:Pick<DesignNode,'width'|'height'|'pathWidth'|'pathHeight'>,c:VectorContour):({cubic:Cubic;curved:boolean;start:number;end:number})[]{
 const sx=n.width/(n.pathWidth||n.width),sy=n.height/(n.pathHeight||n.height),scale=(p:P)=>({x:p.x*sx,y:p.y*sy}),count=c.points.length,total=c.closed?count:count-1,out:{cubic:Cubic;curved:boolean;start:number;end:number}[]=[];
 for(let i=0;i<total;i++){const a=c.points[i],j=(i+1)%count,b=c.points[j],curved=!near(a.out)||!near(b.in);out.push({cubic:[scale(a),scale({x:a.x+(a.out?.x??0),y:a.y+(a.out?.y??0)}),scale({x:b.x+(b.in?.x??0),y:b.y+(b.in?.y??0)}),scale(b)],curved,start:i,end:j});}
 return out;
}
export function cubicAt(c:Cubic,t:number){const u=1-t,a=u*u*u,b=3*u*u*t,d=3*u*t*t,e=t*t*t;return {x:a*c[0].x+b*c[1].x+d*c[2].x+e*c[3].x,y:a*c[0].y+b*c[1].y+d*c[2].y+e*c[3].y};}
function derivative(c:Cubic,t:number){const u=1-t,a=3*u*u,b=6*u*t,d=3*t*t;return {x:a*(c[1].x-c[0].x)+b*(c[2].x-c[1].x)+d*(c[3].x-c[2].x),y:a*(c[1].y-c[0].y)+b*(c[2].y-c[1].y)+d*(c[3].y-c[2].y)};}
/** Unit tangent; a zero derivative (retracted handle or cusp) reads the direction the curve actually takes there. */
export function cubicTangent(c:Cubic,t:number):P{let d=derivative(c,t),l=Math.hypot(d.x,d.y);if(l<1e-9){const a=cubicAt(c,Math.max(0,t-1e-3)),b=cubicAt(c,Math.min(1,t+1e-3));d={x:b.x-a.x,y:b.y-a.y};l=Math.hypot(d.x,d.y);}return l?{x:d.x/l,y:d.y/l}:{x:1,y:0};}
const normalOf=(t:P)=>({x:-t.y,y:t.x});
/** Cumulative chord table; widths interpolate along real length, so a taper reads the same on any parameterization. */
function lengthTable(c:Cubic,steps=48){const table=[0];let last=c[0];for(let i=1;i<=steps;i++){const p=cubicAt(c,i/steps);table.push(table[i-1]+Math.hypot(p.x-last.x,p.y-last.y));last=p;}return table;}
function lengthAt(table:number[],t:number){const steps=table.length-1,at=Math.min(steps-1,Math.floor(t*steps)),f=t*steps-at;return table[at]+(table[at+1]-table[at])*f;}
export function cubicLength(c:Cubic){return lengthTable(c).at(-1)!;}
/** Parameter at a fraction of real length. */
export function cubicParameterAt(c:Cubic,fraction:number){const table=lengthTable(c),target=fraction*table.at(-1)!;let i=1;while(i<table.length-1&&table[i]<target)i++;const span=table[i]-table[i-1],steps=table.length-1;return (i-1+(span?(target-table[i-1])/span:0))/steps;}
/** Parameter at a fraction of a contour segment's real length. A straight segment's split parameter is that fraction itself. */
export const segmentParameter=(segment:{cubic:Cubic;curved:boolean},fraction:number)=>segment.curved?cubicParameterAt(segment.cubic,fraction):fraction;
function parameters(c:Cubic,maxTurn:number,minLength:number,depth=6){const out=[0],visit=(a:number,b:number,level:number)=>{const ta=cubicTangent(c,a),tb=cubicTangent(c,b),m=(a+b)/2,tm=cubicTangent(c,m),turn=Math.max(Math.abs(Math.atan2(ta.x*tm.y-ta.y*tm.x,ta.x*tm.x+ta.y*tm.y)),Math.abs(Math.atan2(tm.x*tb.y-tm.y*tb.x,tm.x*tb.x+tm.y*tb.y))),p=cubicAt(c,a),q=cubicAt(c,b);if(level<depth&&(level<1||turn>maxTurn/2&&Math.hypot(q.x-p.x,q.y-p.y)>minLength)){visit(a,m,level+1);visit(m,b,level+1);}else out.push(b);};visit(0,1,0);return out;}
/** Cross sections along each segment. Straight segments keep their two exact end frames. */
export function contourSegments(n:Pick<DesignNode,'width'|'height'|'pathWidth'|'pathHeight'>,c:VectorContour,base:number,maxTurn=Math.PI/15):WidthSegment[]{
 return contourCubics(n,c).map(({cubic,curved,start,end})=>{const a=c.points[start],b=c.points[end],wa=halfWidths(a,base),wb=halfWidths(b,base);
  if(!curved){const t=cubicTangent([cubic[0],cubic[0],cubic[3],cubic[3]],.5),frame=(p:P,w:{left:number;right:number})=>({c:p,t,n:normalOf(t),...w}),frames=[frame(cubic[0],wa),frame(cubic[3],wb)];return {start,end,curved:false,length:Math.hypot(cubic[3].x-cubic[0].x,cubic[3].y-cubic[0].y),frames,frameAt:(u:number)=>({...frames[0],c:lerp(cubic[0],cubic[3],u),left:wa.left+(wb.left-wa.left)*u,right:wa.right+(wb.right-wa.right)*u}),parameters:[0,1]};}
  const table=lengthTable(cubic),length=table.at(-1)!,frameAt=(t:number)=>{const u=length?lengthAt(table,t)/length:t,tangent=cubicTangent(cubic,t);return {c:t===0?cubic[0]:t===1?cubic[3]:cubicAt(cubic,t),t:tangent,n:normalOf(tangent),left:wa.left+(wb.left-wa.left)*u,right:wa.right+(wb.right-wa.right)*u};},list=parameters(cubic,maxTurn,Math.max(.25,length/64));
  return {start,end,curved:true,length,frames:list.map(frameAt),frameAt,parameters:list};});
}
const off=(f:WidthFrame,side:number)=>{const h=side>0?f.left:f.right;return {x:f.c.x+f.n.x*h*side,y:f.c.y+f.n.y*h*side};};
export const frameOffset=off;
function signedArea(ps:P[]){let area=0;for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];area+=a.x*b.y-a.y*b.x;}return area;}
function crossing(a:P,b:P,c:P,d:P){const r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},den=r.x*s.y-r.y*s.x;if(Math.abs(den)<1e-12)return null;const t=((c.x-a.x)*s.y-(c.y-a.y)*s.x)/den,u=((c.x-a.x)*r.y-(c.y-a.y)*r.x)/den;return t>0&&t<1&&u>0&&u<1?lerp(a,b,t):null;}
function check(p:P){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e6||Math.abs(p.y)>1e6)throw Error('Variable-width outline exceeds ±1,000,000.');}
/** The side of a curved piece: a positively wound tile between centerline and offset. Inside a tight bend the radials cross, and both lobes are tiled apart. */
function curvedTile(paths:string[],a:WidthFrame,b:WidthFrame,mid:WidthFrame,side:number){
 const o0=off(a,side),o1=off(b,side),m=off(mid,side);for(const p of [o0,o1,m])check(p);
 const control={x:2*m.x-(o0.x+o1.x)/2,y:2*m.y-(o0.y+o1.y)/2},turned=crossing(a.c,o0,b.c,o1);
 const emit=(ps:P[])=>{const area=signedArea(ps);if(Math.abs(area)<1e-12)return;paths.push('M'+(area<0?ps.slice().reverse():ps).map(p=>p.x+' '+p.y).join('L')+'Z');};
 if(turned){emit([a.c,b.c,turned]);emit([turned,o0,o1]);return;}
 const area=signedArea([a.c,o0,control,o1,b.c]);if(Math.abs(area)<1e-12)return;
 paths.push(area>0?`M${a.c.x} ${a.c.y}L${o0.x} ${o0.y}Q${control.x} ${control.y} ${o1.x} ${o1.y}L${b.c.x} ${b.c.y}Z`:`M${b.c.x} ${b.c.y}L${o1.x} ${o1.y}Q${control.x} ${control.y} ${o0.x} ${o0.y}L${a.c.x} ${a.c.y}Z`);
}
/** Each tile reads a true midpoint on the offset curve, so its quadratic side lies on the envelope at three points. */
function curvedBand(paths:string[],s:WidthSegment){for(let i=0;i+1<s.frames.length;i++){const a=s.frames[i],b=s.frames[i+1],m=s.frameAt((s.parameters[i]+s.parameters[i+1])/2);for(const side of [1,-1])if(side>0?a.left>0||b.left>0:a.right>0||b.right>0)curvedTile(paths,a,b,m,side);}}
export interface BandStyle {cap:'butt'|'round'|'square';join:'miter'|'round'|'bevel';miterLimit:number;}
/** Every piece is wound positively and rendered by one nonzero fill, so the band is their exact union and alpha applies once. */
export function bandPath(n:Pick<DesignNode,'width'|'height'|'pathWidth'|'pathHeight'|'contours'>,base:number,style:BandStyle){
 const paths:string[]=[],polygon=(ps:P[])=>{let area=0;for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];check(a);area+=a.x*b.y-a.y*b.x;}if(Math.abs(area)<1e-12)return;if(area<0)ps=ps.slice().reverse();paths.push('M'+ps.map(p=>p.x+' '+p.y).join('L')+'Z');},sector=(center:P,a:P,b:P,radius:number)=>{if(radius>0)paths.push(`M${center.x} ${center.y}L${a.x} ${a.y}A${radius} ${radius} 0 0 1 ${b.x} ${b.y}Z`);};
 let turn=Math.PI/15,total=0;for(const c of n.contours!)for(const s of contourSegments(n,c,base))total+=s.frames.length;if(total*2>TILE_BUDGET)turn*=Math.min(4,total*2/TILE_BUDGET);
 for(const c of n.contours!){const segments=contourSegments(n,c,base,turn),count=segments.length;
  for(const s of segments){if(s.curved)curvedBand(paths,s);else {const [a,b]=s.frames;polygon([off(a,1),off(b,1),off(b,-1),off(a,-1)]);}}
  const join=(a:WidthSegment,b:WidthSegment)=>{const fa=a.frames.at(-1)!,fb=b.frames[0],center=fa.c,cross=fa.n.x*fb.n.y-fa.n.y*fb.n.x;for(const side of [-1,1])polygon([center,off(fa,side),off(fb,side)]);const outer=cross>1e-12?-1:cross< -1e-12?1:0;if(!outer)return;const radius=outer>0?fa.left:fa.right;
   if(style.join==='round'){if(outer<0)sector(center,off(fa,-1),off(fb,-1),radius);else sector(center,off(fb,1),off(fa,1),radius);}
   else if(style.join==='miter'&&radius>0){const cosine=fa.t.x*fb.t.x+fa.t.y*fb.t.y,half=Math.sqrt(Math.max(0,(1+cosine)/2));if(half>0&&1/half<=style.miterLimit){const p=off(fa,outer),q=off(fb,outer),den=fa.t.x*fb.t.y-fa.t.y*fb.t.x;if(Math.abs(den)>1e-12){const s=((q.x-p.x)*fb.t.y-(q.y-p.y)*fb.t.x)/den,tip={x:p.x+fa.t.x*s,y:p.y+fa.t.y*s};polygon([center,p,tip,q]);}}}};
  for(let i=0;i+1<count;i++)join(segments[i],segments[i+1]);if(c.closed){if(count)join(segments[count-1],segments[0]);continue;}
  for(const start of [true,false]){const frame=start?segments[0].frames[0]:segments[count-1].frames.at(-1)!,radius=(frame.left+frame.right)/2;if(!radius||style.cap==='butt')continue;const a=off(frame,1),b=off(frame,-1),direction=start?-1:1,tangent={x:frame.t.x*direction,y:frame.t.y*direction},center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(style.cap==='square')polygon([a,b,{x:b.x+tangent.x*radius,y:b.y+tangent.y*radius},{x:a.x+tangent.x*radius,y:a.y+tangent.y*radius}]);else sector(center,start?a:b,start?b:a,radius);}
 }
 return paths.join('');
}
/** Exact split of a contour segment at parameter t. The new anchor interpolates width along real length and never moves the line. */
export function splitContourSegment(c:VectorContour,index:number,t:number):{contour:VectorContour;anchor:number}{
 const count=c.points.length,next=(index+1)%count,a=c.points[index],b=c.points[next],curved=!near(a.out)||!near(b.in),h1={x:a.x+(a.out?.x??0),y:a.y+(a.out?.y??0)},h2={x:b.x+(b.in?.x??0),y:b.y+(b.in?.y??0)},ab=lerp(a,h1,t),bc=lerp(h1,h2,t),cd=lerp(h2,b,t),abc=lerp(ab,bc,t),bcd=lerp(bc,cd,t),p=lerp(abc,bcd,t),table=lengthTable([a,h1,h2,b]),total=table.at(-1)!,fraction=curved&&total?lengthAt(table,t)/total:t;
 const scale=(a.widthScale??1)+((b.widthScale??1)-(a.widthScale??1))*fraction,bias=(a.widthBias??0)+((b.widthBias??0)-(a.widthBias??0))*fraction,point:VectorPoint={x:curved?p.x:a.x+(b.x-a.x)*t,y:curved?p.y:a.y+(b.y-a.y)*t,widthScale:scale,...(bias?{widthBias:bias}:{}),...(curved?{in:{x:abc.x-p.x,y:abc.y-p.y},out:{x:bcd.x-p.x,y:bcd.y-p.y},mode:'aligned' as const}:{})};
 const points=c.points.slice();if(curved){points[index]={...a,out:{x:ab.x-a.x,y:ab.y-a.y}};points[next]={...b,in:{x:cd.x-b.x,y:cd.y-b.y}};}
 points.splice(index+1,0,point);return {contour:{...c,points},anchor:index+1};
}
