import type {DesignNode} from './model';
import type {Paint} from './paints';
import {validatePaint} from './paints';
import {inverseMatrix,point,worldMatrix} from './transforms';
import {linearGradientPoints,linearGradientAngle,LINEAR_GRADIENT_LIMITS} from './linear-gradient';
export type GradientHandle='start'|'end'|'move'|'center'|'radius'|`stop:${string}`;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function validateCanvasGradient(n:DesignNode,p:Paint,nodes:DesignNode[]){
 if(!['image','rectangle','frame','group','component','section','ellipse'].includes(n.type)||n.type==='ellipse'&&Math.abs(n.arcSweep??360)<359.999||n.booleanOp||n.media)throw Error('Canvas gradient handles support full-box shape/container fills and complete ellipses. Text, paths, partial arcs and live booleans need different paint-box mapping.');
 if(![n.width,n.height].every(v=>Number.isFinite(v)&&v>0&&v<=1e6))throw Error('Restore positive layer dimensions before editing gradient handles.');validatePaint(p);
 if(!['linear','radial','diamond','angular'].includes(p.type)||!p.visible||p.opacity<=0||p.stops.length<2||new Set(p.stops.map(s=>s.id)).size!==p.stops.length)throw Error('Choose one visible gradient fill with at least two distinct stop IDs.');
 if(p.type!=='linear'&&(!(p.cx>=-1&&p.cx<=2&&p.cy>=-1&&p.cy<=2)||p.type!=='angular'&&(p.radius<.01||p.radius>2)||p.type!=='radial'&&!Number.isFinite(p.angle)))throw Error('Radial canvas handles support center −100…200% and radius 1…200%.');
 const m=worldMatrix(n,nodes);inverseMatrix(m);const reach=p.type==='angular'?ANGULAR_RING:p.radius,ps=p.type==='linear'?linearGradientPoints(p):[{x:p.cx-reach,y:p.cy-reach},{x:p.cx+reach,y:p.cy+reach}];const axis=gradientAxis(p).map(v=>point(m,v.x*n.width,v.y*n.height));if(Math.hypot(axis[1].x-axis[0].x,axis[1].y-axis[0].y)<1e-7)throw Error('Gradient handles collapse at this layer scale. Increase the layer or gradient length first.');if(m.some(v=>!Number.isFinite(v))||ps.some(v=>{const p=point(m,v.x*n.width,v.y*n.height);return !Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e9||Math.abs(p.y)>1e9;}))throw Error('Gradient handles exceed finite canvas bounds. Reduce the hierarchy transform first.');
}
/** Angular paints have no length, so their handles sit on a fixed ring. */
export const ANGULAR_RING=.5;
const turn=(p:Paint,reach:number,degrees=p.angle)=>({x:p.cx+reach*Math.cos(degrees*Math.PI/180),y:p.cy+reach*Math.sin(degrees*Math.PI/180)});
export function gradientAxis(p:Paint){return p.type==='linear'?linearGradientPoints(p):p.type==='radial'?[{x:p.cx,y:p.cy},{x:p.cx+p.radius,y:p.cy}] as const:[{x:p.cx,y:p.cy},turn(p,p.type==='angular'?ANGULAR_RING:p.radius)] as const;}
const wrapped=(degrees:number)=>{const v=((degrees+180)%360+360)%360-180;return v===-180?180:v;};
/** Null holds the last valid draft when endpoints approach a degenerate line. */
export function gradientHandlePatch(n:DesignNode,p:Paint,nodes:DesignNode[],handle:GradientHandle,dx:number,dy:number):Partial<Paint>|null{
 validateCanvasGradient(n,p,nodes);if(![dx,dy].every(Number.isFinite))throw Error('Invalid gradient movement.');const checked=(patch:Partial<Paint>)=>{validateCanvasGradient(n,{...p,...patch},nodes);return patch;},m=inverseMatrix(worldMatrix(n,nodes)),x=(m[0]*dx+m[2]*dy)/n.width,y=(m[1]*dx+m[3]*dy)/n.height;
 if(handle.startsWith('stop:')&&p.type==='angular'){const id=handle.slice(5),stop=p.stops.find(s=>s.id===id);if(!stop)throw Error('This gradient stop no longer exists.');const from=turn(p,ANGULAR_RING,p.angle+stop.position*360),to={x:from.x+x,y:from.y+y},sweep=wrapped((Math.atan2(to.y-p.cy,to.x-p.cx)-Math.atan2(from.y-p.cy,from.x-p.cx))*180/Math.PI);return checked({stops:p.stops.map(s=>s.id===id?{...s,position:clamp(s.position+sweep/360,0,1)}:s)});}
 if(handle.startsWith('stop:')){const id=handle.slice(5),stop=p.stops.find(s=>s.id===id);if(!stop)throw Error('This gradient stop no longer exists.');const [a,b]=gradientAxis(p),wm=worldMatrix(n,nodes),localX=(b.x-a.x)*n.width,localY=(b.y-a.y)*n.height,vx=wm[0]*localX+wm[2]*localY,vy=wm[1]*localX+wm[3]*localY,position=clamp(stop.position+(dx*vx+dy*vy)/(vx*vx+vy*vy),0,1);return checked({stops:p.stops.map(s=>s.id===id?{...s,position}:s)});}
 if(p.type==='linear'){
  const [a,b]=linearGradientPoints(p);let start={...a},end={...b};if(handle==='start')start={x:clamp(a.x+x,-10,10),y:clamp(a.y+y,-10,10)};else if(handle==='end')end={x:clamp(b.x+x,-10,10),y:clamp(b.y+y,-10,10)};else if(handle==='move'){const dx=clamp(x,-10-Math.min(a.x,b.x),10-Math.max(a.x,b.x)),dy=clamp(y,-10-Math.min(a.y,b.y),10-Math.max(a.y,b.y));start={x:a.x+dx,y:a.y+dy};end={x:b.x+dx,y:b.y+dy};}else throw Error('Choose a linear endpoint, line center or stop handle.');
  if(Math.hypot(end.x-start.x,end.y-start.y)<LINEAR_GRADIENT_LIMITS.minLength)return null;const patch={linearStart:start,linearEnd:end};return checked({...patch,angle:linearGradientAngle({...p,...patch})});
 }
 if(handle==='center')return checked({cx:clamp(p.cx+x,-1,2),cy:clamp(p.cy+y,-1,2)});if(handle==='radius'&&p.type==='radial')return checked({radius:clamp(Math.hypot(p.radius+x,y),.01,2)});if(handle==='radius'){const tip=gradientHandlePoint(p,'radius'),vx=tip.x+x-p.cx,vy=tip.y+y-p.cy,length=Math.hypot(vx,vy);if(length<1e-6)return null;const angle=wrapped(Math.atan2(vy,vx)*180/Math.PI);return checked(p.type==='angular'?{angle}:{angle,radius:clamp(length,.01,2)});}throw Error('Choose a center, size or stop handle.');
}
export function gradientHandlePoint(p:Paint,handle:GradientHandle){const [a,b]=gradientAxis(p);if(handle==='start'||handle==='center')return a;if(handle==='end'||handle==='radius')return b;if(handle==='move')return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};const stop=p.stops.find(s=>`stop:${s.id}`===handle);if(!stop)throw Error('Gradient handle is missing.');if(p.type==='angular')return turn(p,ANGULAR_RING,p.angle+stop.position*360);return {x:a.x+(b.x-a.x)*stop.position,y:a.y+(b.y-a.y)*stop.position};}
export function gradientAppearanceKey(p:Paint){return JSON.stringify({geometry:p.type==='linear'?linearGradientPoints(p):p.type==='radial'?[p.cx,p.cy,p.radius]:[p.cx,p.cy,p.radius,p.angle],stops:p.stops.map(s=>s.position)});}
