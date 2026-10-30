import type {DesignNode,VectorContour} from './model';

export interface BendPoint {x:number;y:number;}
export interface BendSegment {key:string;contour:number;start:number;end:number;controls:[BendPoint,BendPoint,BendPoint,BendPoint];}
const validPoint=<T extends BendPoint>(p:T):T=>{if(!p||![p.x,p.y].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6))throw Error('The bend exceeds the vector coordinate limit.');return p;};

/** Cubic controls match contourPath, except a true line uses its equivalent linear cubic. */
export function bendSegment(n:DesignNode,key:string):BendSegment{
 if(n.type!=='path'||n.booleanOp||!n.contours)throw Error('Enter point editing on a contour path to bend a segment.');
 if(!/^\d+:\d+$/.test(key))throw Error('This vector segment is no longer available.');
 const [ci,start]=key.split(':').map(Number),c=n.contours[ci],end=c?(start+1)%c.points.length:0;
 if(!c||!Number.isSafeInteger(ci)||!Number.isSafeInteger(start)||c.points.length<2||start>=c.points.length||!c.closed&&start===c.points.length-1)throw Error('This vector segment is no longer available.');
 const a=validPoint(c.points[start]),b=validPoint(c.points[end]),curved=!!(a.out||b.in);
 const ca=curved?{x:a.x+(a.out?.x??0),y:a.y+(a.out?.y??0)}:{x:a.x+(b.x-a.x)/3,y:a.y+(b.y-a.y)/3};
 const cb=curved?{x:b.x+(b.in?.x??0),y:b.y+(b.in?.y??0)}:{x:b.x-(b.x-a.x)/3,y:b.y-(b.y-a.y)/3};
 validPoint(ca);validPoint(cb);
 return {key,contour:ci,start,end,controls:[{x:a.x,y:a.y},ca,cb,{x:b.x,y:b.y}]};
}
export function bendSegmentKeys(n:DesignNode){if(n.type!=='path'||!n.contours||n.booleanOp)return [];return n.contours.flatMap((c,ci)=>c.points.length<2?[]:Array.from({length:c.points.length-(c.closed?0:1)},(_,pi)=>`${ci}:${pi}`));}
export function cubicPoint(c:readonly BendPoint[],t:number):BendPoint{if(c.length!==4||!Number.isFinite(t)||t<0||t>1)throw Error('Invalid bend parameter.');const a=1-t;return {x:a*a*a*c[0].x+3*a*a*t*c[1].x+3*a*t*t*c[2].x+t*t*t*c[3].x,y:a*a*a*c[0].y+3*a*a*t*c[1].y+3*a*t*t*c[2].y+t*t*t*c[3].y};}
/** Search in canvas coordinates, so nonuniformly scaled paths still pick the visible segment. */
export function nearestBendParameter(controls:readonly BendPoint[],position:BendPoint){validPoint(position);controls.forEach(validPoint);const distance=(t:number)=>{const p=cubicPoint(controls,t);return (p.x-position.x)**2+(p.y-position.y)**2;};let best=.5,bestDistance=Infinity;const steps=48;for(let i=0;i<=steps;i++){const t=i/steps,d=distance(t);if(d<bestDistance){best=t;bestDistance=d;}}let low=Math.max(0,best-1/steps),high=Math.min(1,best+1/steps);for(let i=0;i<24;i++){const a=low+(high-low)/3,b=high-(high-low)/3;if(distance(a)<distance(b))high=b;else low=a;}return Math.max(.08,Math.min(.92,(low+high)/2));}
/** Minimum squared handle movement that translates the grabbed cubic point by delta. Anchors do not move. */
export function bendVectorSegment(n:DesignNode,key:string,t:number,delta:BendPoint):VectorContour[]{
 const segment=bendSegment(n,key);validPoint(delta);if(!Number.isFinite(t)||t<.08||t>.92)throw Error('Bend the interior of a segment, away from its anchors.');
 if(delta.x===0&&delta.y===0)return n.contours!;
 const w1=3*(1-t)**2*t,w2=3*(1-t)*t*t,denominator=w1*w1+w2*w2,[a,ca,cb,b]=segment.controls;
 const out=validPoint({x:ca.x-a.x+delta.x*w1/denominator,y:ca.y-a.y+delta.y*w1/denominator});
 const incoming=validPoint({x:cb.x-b.x+delta.x*w2/denominator,y:cb.y-b.y+delta.y*w2/denominator});
 validPoint({x:a.x+out.x,y:a.y+out.y});validPoint({x:b.x+incoming.x,y:b.y+incoming.y});
 const contours=n.contours!.slice(),contour={...contours[segment.contour],points:contours[segment.contour].points.slice()};contours[segment.contour]=contour;
 contour.points[segment.start]={...contour.points[segment.start],out,mode:'independent'};
 contour.points[segment.end]={...contour.points[segment.end],in:incoming,mode:'independent'};
 return contours;
}
