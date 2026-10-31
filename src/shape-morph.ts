import {cubicContours,scaledLocalPath} from './geometry';
import type {PathContour} from './geometry';
import type {DesignNode,VectorContour,VectorPoint} from './model';
type Point={x:number;y:number};
interface Segment {a:Point;c1:Point;c2:Point;b:Point;}
interface Loop {closed:boolean;segments:Segment[];}
const SHAPES=new Set(['rectangle','ellipse','polygon','star','path']),CURVE_LIMIT=1024,PLANS=64;
const between=(a:Point,b:Point,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
/** Layers match by name within a family, so a rectangle can become an ellipse of the same name. */
export const smartFamily=(n:DesignNode)=>SHAPES.has(n.type)?'shape':n.type;
const morphable=(n:DesignNode)=>SHAPES.has(n.type)&&!n.vectorNetwork&&!n.booleanOp&&!n.mask&&!n.textPath;
/** Unit space, so size keeps animating through the ordinary width and height. */
function loops(n:DesignNode):Loop[]{const sx=n.width||1,sy=n.height||1,unit=(p:Point)=>({x:p.x/sx,y:p.y/sy});return cubicContours(scaledLocalPath(n)).filter(c=>c.curves.length).map((c:PathContour)=>{let at=unit(c.start);const segments=c.curves.map(curve=>{const segment={a:at,c1:unit(curve.c1),c2:unit(curve.c2),b:unit(curve.to)};at=segment.b;return segment;});return {closed:c.closed,segments};});}
const reach=(s:Segment)=>Math.hypot(s.c1.x-s.a.x,s.c1.y-s.a.y)+Math.hypot(s.c2.x-s.c1.x,s.c2.y-s.c1.y)+Math.hypot(s.b.x-s.c2.x,s.b.y-s.c2.y);
/** De Casteljau at the midpoint: the curve is unchanged and gains one anchor. */
function split(s:Segment):[Segment,Segment]{const p=between(s.a,s.c1,.5),q=between(s.c1,s.c2,.5),r=between(s.c2,s.b,.5),u=between(p,q,.5),v=between(q,r,.5),m=between(u,v,.5);return [{a:s.a,c1:p,c2:u,b:m},{a:m,c1:v,c2:r,b:s.b}];}
function grow(list:Segment[],count:number){const out=[...list];while(out.length<count){let longest=0,size=-1;out.forEach((s,i)=>{const r=reach(s);if(r>size){size=r;longest=i;}});out.splice(longest,1,...split(out[longest]));}return out;}
const area=(list:Segment[])=>list.reduce((sum,s)=>sum+s.a.x*s.b.y-s.b.x*s.a.y,0);
const reversed=(list:Segment[])=>[...list].reverse().map(s=>({a:s.b,c1:s.c2,c2:s.c1,b:s.a}));
const distance=(a:Segment[],b:Segment[])=>a.reduce((sum,s,i)=>sum+(s.a.x-b[i].a.x)**2+(s.a.y-b[i].a.y)**2+(s.b.x-b[i].b.x)**2+(s.b.y-b[i].b.y)**2,0);
/** Same anchor count, same direction, and the starting point that travels least. */
function align(a:Loop,b:Loop){const count=Math.max(a.segments.length,b.segments.length);if(a.closed!==b.closed||count>CURVE_LIMIT)return undefined;const from=grow(a.segments,count);let to=grow(b.segments,count);if(a.closed){if(area(from)*area(to)<0)to=reversed(to);let best=0,least=Infinity;for(let offset=0;offset<count;offset++){const turned=[...to.slice(offset),...to.slice(0,offset)],d=distance(from,turned);if(d<least){least=d;best=offset;}}to=[...to.slice(best),...to.slice(0,best)];}else if(distance(from,reversed(to))<distance(from,to))to=reversed(to);return {closed:a.closed,from,to};}
export type MorphPlan=NonNullable<ReturnType<typeof align>>[];
const plans=new Map<string,MorphPlan|null>();
export function morphPlan(before:DesignNode,n:DesignNode):MorphPlan|undefined{if(!morphable(before)||!morphable(n))return undefined;const a=scaledLocalPath(before),b=scaledLocalPath(n),key=[before.width,before.height,n.width,n.height,a,b].join('|');let plan=plans.get(key);if(plan===undefined){const first=loops(before),second=loops(n);plan=first.length&&first.length===second.length?first.map((loop,i)=>align(loop,second[i])) as MorphPlan:null;if(plan?.some(item=>!item))plan=null;if(plans.size>=PLANS)plans.delete(plans.keys().next().value!);plans.set(key,plan);}return plan??undefined;}
/** Unit-space plan at one moment, written as an ordinary contour stack in the layer's own size. */
export function morphContours(plan:MorphPlan,width:number,height:number,t:number):VectorContour[]{const sized=(p:Point)=>({x:p.x*width,y:p.y*height});return plan.map(({closed,from,to})=>{const anchors=from.map((s,i)=>sized(between(s.a,to[i].a,t))),points:VectorPoint[]=anchors.map(p=>({...p}));if(!closed)points.push(sized(between(from.at(-1)!.b,to.at(-1)!.b,t)));from.forEach((s,i)=>{const start=points[i],end=points[(i+1)%points.length],c1=sized(between(s.c1,to[i].c1,t)),c2=sized(between(s.c2,to[i].c2,t));start.out={x:c1.x-start.x,y:c1.y-start.y};end.in={x:c2.x-end.x,y:c2.y-end.y};});return {closed,points};});}
const sameShape=(a:DesignNode,b:DesignNode)=>a.type===b.type&&['rectangle'].includes(a.type)||scaledLocalPath({...a,width:1,height:1,pathWidth:a.pathWidth??a.width,pathHeight:a.pathHeight??a.height})===scaledLocalPath({...b,width:1,height:1,pathWidth:b.pathWidth??b.width,pathHeight:b.pathHeight??b.height});
/** Writes the in-between outline onto a sampled copy. Different topologies cross-fade rather than pop; a layer outside this family is left to its other animation. */
export function animateShape(before:DesignNode,n:DesignNode,out:DesignNode,progress:number,fade:number,parentId:string|null):DesignNode|undefined{if(progress>=1||!morphable(before)||!morphable(n)||sameShape(before,n))return undefined;const plan=morphPlan(before,n);if(plan){const t=Math.max(-.5,Math.min(1.5,progress));out.type='path';out.contours=morphContours(plan,out.width,out.height,t);out.points=[];out.closed=undefined;out.path='';out.pathWidth=out.width;out.pathHeight=out.height;out.radius=0;out.corners=undefined;out.cornerSmoothing=undefined;out.fillRule=n.fillRule??(n.type==='ellipse'||before.type==='ellipse'?'evenodd':'nonzero');out.pointCount=undefined;out.innerRadius=undefined;out.arcStart=undefined;out.arcSweep=undefined;out.arcInner=undefined;return undefined;}const full=out.opacity;out.opacity=full*fade;return {...before,id:'exiting-shape-'+n.id,parentId,x:out.x,y:out.y,width:out.width,height:out.height,rotation:out.rotation,visible:out.visible,opacity:full*(1-fade)};}
