import type {DesignNode,VectorContour,VectorPoint} from './model';

type P={x:number;y:number};
type Cubic=[P,P,P,P];
/** `exactCorners` is the per-layer budget for tangent-circle solves on curved sides. A layer past it draws all its curved corners with the plain fit, so its look does not depend on point order. */
export const CORNER_ROUNDING_LIMITS={curvedCorners:4096,exactCorners:128,samples:12,bisections:8,lengthSamples:32,refineSteps:6} as const;
const add=(a:P,b:P,k=1)=>({x:a.x+b.x*k,y:a.y+b.y*k});
const sub=(a:P,b:P)=>({x:a.x-b.x,y:a.y-b.y});
const lerp=(a:P,b:P,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const size=(v:P)=>Math.hypot(v.x,v.y);
const dot=(a:P,b:P)=>a.x*b.x+a.y*b.y;
const cross=(a:P,b:P)=>a.x*b.y-a.y*b.x;
const unit=(v:P)=>{const l=size(v);return {x:v.x/l,y:v.y/l};};
const turn=(v:P,a:number)=>({x:v.x*Math.cos(a)-v.y*Math.sin(a),y:v.x*Math.sin(a)+v.y*Math.cos(a)});
const nonzero=(h:P|undefined)=>!!h&&size(h)>1e-8;
function at(c:Cubic,t:number){const u=1-t,a=u*u*u,b=3*u*u*t,d=3*u*t*t,e=t*t*t;return {x:a*c[0].x+b*c[1].x+d*c[2].x+e*c[3].x,y:a*c[0].y+b*c[1].y+d*c[2].y+e*c[3].y};}
function derivative(c:Cubic,t:number){const u=1-t,a=3*u*u,b=6*u*t,d=3*t*t;return {x:a*(c[1].x-c[0].x)+b*(c[2].x-c[1].x)+d*(c[3].x-c[2].x),y:a*(c[1].y-c[0].y)+b*(c[2].y-c[1].y)+d*(c[3].y-c[2].y)};}
/** A collapsed handle has no first derivative at its anchor; the limit direction comes from just inside the curve. */
function tangent(c:Cubic,t:number){const d=derivative(c,t);if(size(d)>1e-9)return unit(d);const inside=derivative(c,t<.5?t+1e-4:t-1e-4);return size(inside)>1e-12?unit(inside):unit(sub(c[3],c[0]));}
function divide(c:Cubic,t:number):[Cubic,Cubic]{const a=lerp(c[0],c[1],t),b=lerp(c[1],c[2],t),d=lerp(c[2],c[3],t),e=lerp(a,b,t),f=lerp(b,d,t),g=lerp(e,f,t);return [[c[0],a,e,g],[g,f,d,c[3]]];}
/** Exact de Casteljau restriction: kept curve pieces are the source curve, not an approximation of it. */
function restrict(c:Cubic,from:number,to:number):Cubic{const tail=from>0?divide(c,from)[1]:c;return to<1?divide(tail,(to-from)/(1-from))[0]:tail;}
const reverse=(c:Cubic):Cubic=>[c[3],c[2],c[1],c[0]];
interface Measure {length:number;table?:number[];}
function measure(c:Cubic,line:boolean):Measure{if(line)return {length:size(sub(c[3],c[0]))};const count=CORNER_ROUNDING_LIMITS.lengthSamples,table=[0];let px=c[0].x,py=c[0].y,total=0;for(let i=1;i<=count;i++){const t=i/count,u=1-t,a=u*u*u,b=3*u*u*t,d=3*u*t*t,e=t*t*t,x=a*c[0].x+b*c[1].x+d*c[2].x+e*c[3].x,y=a*c[0].y+b*c[1].y+d*c[2].y+e*c[3].y;total+=Math.hypot(x-px,y-py);table.push(total);px=x;py=y;}return {length:total,table};}
function paramAt(m:Measure,length:number){if(!m.table)return m.length>0?Math.min(1,length/m.length):0;let i=m.table.findIndex(l=>l>=length);if(i<0)return 1;if(i<1)i=1;const span=m.table[i]-m.table[i-1];return (i-1+(span>0?(length-m.table[i-1])/span:0))/CORNER_ROUNDING_LIMITS.lengthSamples;}
function lengthAt(m:Measure,t:number){if(!m.table)return m.length*t;const f=t*CORNER_ROUNDING_LIMITS.lengthSamples,i=Math.min(CORNER_ROUNDING_LIMITS.lengthSamples-1,Math.floor(f));return m.table[i]+(m.table[i+1]-m.table[i])*(f-i);}
interface Side {curve:Cubic;limit:number;sign:number;}
const offset=(side:Side,s:number,r:number)=>{const t=tangent(side.curve,s);return add(at(side.curve,s),{x:-t.y*side.sign,y:t.x*side.sign},r);};
function intersection(a:P,b:P,c:P,d:P){const e=sub(b,a),f=sub(d,c),denominator=cross(e,f);if(Math.abs(denominator)<1e-14)return;const g=sub(c,a),t=cross(g,f)/denominator,u=cross(g,e)/denominator;return t>=-1e-9&&t<=1+1e-9&&u>=-1e-9&&u<=1+1e-9?{t,u}:undefined;}
/** Newton steps from a nearby pair of tangent points to the exact circle. */
function refine(a:Side,b:Side,r:number,s:number,t:number){const h=1e-6;for(let i=0;i<CORNER_ROUNDING_LIMITS.refineSteps;i++){const f=sub(offset(a,s,r),offset(b,t,r));if(size(f)<1e-10)break;const ds=sub(offset(a,Math.min(a.limit,s+h),r),offset(a,Math.max(0,s-h),r)),dt=sub(offset(b,Math.min(b.limit,t+h),r),offset(b,Math.max(0,t-h),r)),ws=Math.min(a.limit,s+h)-Math.max(0,s-h),wt=Math.min(b.limit,t+h)-Math.max(0,t-h),j1={x:ds.x/ws,y:ds.y/ws},j2={x:-dt.x/wt,y:-dt.y/wt},determinant=cross(j1,j2);if(Math.abs(determinant)<1e-12)break;const nextS=Math.max(0,Math.min(a.limit,s-cross(f,j2)/determinant)),nextT=Math.max(0,Math.min(b.limit,t-cross(j1,f)/determinant));if(nextS===s&&nextT===t)break;s=nextS;t=nextT;}
 return size(sub(offset(a,s,r),offset(b,t,r)))<1e-6?{s,t,center:offset(a,s,r)}:undefined;}
/** A tangent circle's center lies on both offset curves, so the fillet is a crossing of those offsets. */
function tangentCircle(a:Side,b:Side,r:number){const count=CORNER_ROUNDING_LIMITS.samples,params=(limit:number)=>Array.from({length:count+1},(_,i)=>limit*(i/count)**2),sa=params(a.limit),sb=params(b.limit),oa=sa.map(s=>offset(a,s,r)),ob=sb.map(s=>offset(b,s,r));let best:{s:number;t:number;score:number}|undefined;for(let i=0;i<count;i++)for(let j=0;j<count;j++){const hit=intersection(oa[i],oa[i+1],ob[j],ob[j+1]);if(!hit)continue;const s=sa[i]+(sa[i+1]-sa[i])*hit.t,t=sb[j]+(sb[j+1]-sb[j])*hit.u,score=s/a.limit+t/b.limit;if(!best||score<best.score)best={s,t,score};}if(!best)return;
 return refine(a,b,r,best.s,best.t);}
/** The likely tangent points usually converge at once, so the search runs only when they do not. A radius too big to fit halves toward the largest that does, starting from what the sides could hold, in a few rounds because this runs on every render. */
function fit(a:Side,b:Side,radius:number,guess:[number,number],most:number){const direct=refine(a,b,radius,guess[0],guess[1])??tangentCircle(a,b,radius);if(direct)return {...direct,radius};let low=0,high=Math.min(radius,most),best:(ReturnType<typeof tangentCircle>&{radius:number})|undefined;for(let i=0;i<CORNER_ROUNDING_LIMITS.bisections;i++){const r=(low+high)/2,found=(best&&refine(a,b,r,best.s,best.t))??tangentCircle(a,b,r);if(found){best={...found,radius:r};low=r;}else high=r;}return best;}
interface Fillet {enter:number;leave:number;anchors:VectorPoint[];}
/** Circular arc from one tangent point to the other; each cubic spans at most a quarter turn. */
function arcAnchors(start:P,stop:P,center:P,direction:P,leaving:P,sweep:number,radius:number):VectorPoint[]{const pieces=Math.max(1,Math.ceil(Math.abs(sweep)/(Math.PI/2+1e-9))),step=sweep/pieces,h=4/3*Math.tan(Math.abs(step)/4)*radius,from=sub(start,center),anchors:VectorPoint[]=[];for(let i=0;i<=pieces;i++){const position=i===0?start:i===pieces?stop:add(center,turn(from,step*i)),d=i===pieces?leaving:turn(direction,step*i);anchors.push({...position,...(i>0?{in:{x:-d.x*h,y:-d.y*h}}:{}),...(i<pieces?{out:{x:d.x*h,y:d.y*h}}:{}),mode:i>0&&i<pieces?'aligned':'independent'});}return anchors;}
const segment=(a:VectorPoint,b:VectorPoint):Cubic=>[{x:a.x,y:a.y},add(a,a.out??{x:0,y:0}),add(b,b.in??{x:0,y:0}),{x:b.x,y:b.y}];
const straight=(a:VectorPoint,b:VectorPoint)=>!nonzero(a.out)&&!nonzero(b.in);
/** A straight side with even control points, so its curve parameter and its length agree. */
const side=(a:VectorPoint,b:VectorPoint):Cubic=>straight(a,b)?[{x:a.x,y:a.y},lerp(a,b,1/3),lerp(a,b,2/3),{x:b.x,y:b.y}]:segment(a,b);
const neighbor=(c:VectorContour,pi:number,step:number)=>c.points[(pi+step+c.points.length)%c.points.length];
/** The directions leaving a vertex along each side and the angle between them. Undefined means the vertex has no corner: an open end, a smooth point, a reversal or a repeated point. */
export function cornerAngle(c:VectorContour,pi:number){const n=c.points.length;if(n<2||!c.closed&&(pi===0||pi===n-1))return undefined;const p=c.points[pi],incoming=segment(neighbor(c,pi,-1),p),outgoing=segment(p,neighbor(c,pi,1));if(size(sub(incoming[3],incoming[0]))<1e-8&&straight(neighbor(c,pi,-1),p)||size(sub(outgoing[3],outgoing[0]))<1e-8&&straight(p,neighbor(c,pi,1)))return undefined;const toward=tangent(reverse(incoming),0),away=tangent(outgoing,0),theta=Math.acos(Math.max(-1,Math.min(1,dot(toward,away))));return theta<1e-5||Math.PI-theta<1e-5?undefined:{toward,away,theta};}
interface CornerPlan {radius:number;incoming:Cubic;outgoing:Cubic;before:Measure;after:Measure;lines:boolean;toward:P;away:P;theta:number;wanted:number;}
function planCorner(previous:VectorPoint,p:VectorPoint,next:VectorPoint,radius:number):CornerPlan{
 const incoming=side(previous,p),outgoing=side(p,next),lines=straight(previous,p)&&straight(p,next),before=measure(reverse(incoming),straight(previous,p)),after=measure(outgoing,straight(p,next));if(before.length<1e-8||after.length<1e-8)throw Error('Remove duplicate corner points first.');
 const toward=tangent(reverse(incoming),0),away=tangent(outgoing,0),theta=Math.acos(Math.max(-1,Math.min(1,dot(toward,away))));if(theta<1e-5||Math.PI-theta<1e-5)throw Error('Select a corner with a nonzero angle.');
 return {radius,incoming,outgoing,before,after,lines,toward,away,theta,wanted:radius/Math.tan(theta/2)};
}
const meet=(a:P,d:P,b:P,e:P)=>{const n=cross(d,e);if(Math.abs(n)<1e-12)return;const t=cross(sub(b,a),e)/n;return t>=0?add(a,d,t):undefined;};
interface CornerArc {start:P;stop:P;center:P;radius:number;direction:P;leaving:P;sweep:number;}
interface CornerSide {curve:Cubic;measure:Measure;length:number;reach:number;}
/** The corner curve for any angle. Smoothing s keeps the middle (1-s) of the arc and eases out of each side over (1+s) tangent lengths, which is the familiar profile at a right angle. Sides run from the vertex outward. */
function smoothAnchors(arc:CornerArc,first:CornerSide,second:CornerSide,smoothing:number){
 const s=Math.min(smoothing,first.reach/first.length-1,second.reach/second.length-1),{start,stop,center,radius,direction,leaving,sweep}=arc;if(s<=1e-6)return;
 const sign=Math.sign(sweep),alpha=Math.abs(sweep)*s/2,inner=add(center,turn(sub(start,center),sign*alpha)),outer=add(center,turn(sub(stop,center),-sign*alpha)),entering=turn(direction,sign*alpha),exiting=turn(leaving,-sign*alpha),a=paramAt(first.measure,first.length*(1+s)),b=paramAt(second.measure,second.length*(1+s)),from=at(first.curve,a),to=at(second.curve,b),fromDirection=tangent(first.curve,a),toDirection=tangent(second.curve,b);
 const c=meet(from,{x:-fromDirection.x,y:-fromDirection.y},inner,{x:-entering.x,y:-entering.y})??lerp(from,inner,.5),d=meet(to,{x:-toDirection.x,y:-toDirection.y},outer,exiting)??lerp(to,outer,.5),remaining=sweep-sign*2*alpha,middle:VectorPoint[]=Math.abs(remaining)>1e-6?arcAnchors(inner,outer,center,entering,exiting,remaining,radius):[{...inner,mode:'aligned'}];
 middle[0].in=sub(c,inner);middle.at(-1)!.out=sub(d,outer);const anchors:VectorPoint[]=[{...from,out:sub(lerp(from,c,2/3),from),mode:'independent'},...middle,{...to,in:sub(lerp(to,d,2/3),to),mode:'independent'}];return {a,b,anchors};
}
/** The fallback for curved sides: the corner's length is measured along each side and a single cubic joins the two points along their tangents. It costs next to nothing and never fails, though the curve is not a true circle. */
function plainFillet(plan:CornerPlan,first:Side,second:Side,reachIn:number,reachOut:number,smoothing:number):Fillet{const trim=Math.min(plan.wanted*(1+smoothing),reachIn,reachOut),s=paramAt(plan.before,trim),t=paramAt(plan.after,trim),start=at(first.curve,s),stop=at(second.curve,t),along=tangent(first.curve,s),leaving=tangent(second.curve,t),chord=size(sub(stop,start)),sweep=Math.abs(Math.atan2(cross({x:-along.x,y:-along.y},leaving),dot({x:-along.x,y:-along.y},leaving))),h=sweep>1e-3&&Math.PI-sweep>1e-3?Math.min(chord,4/3*Math.tan(sweep/4)*chord/(2*Math.sin(sweep/2))):chord/3;return {enter:1-s,leave:t,anchors:[{...start,out:{x:-along.x*h,y:-along.y*h},mode:'independent'},{...stop,in:{x:-leaving.x*h,y:-leaving.y*h},mode:'independent'}]};}
function filletCorner(plan:CornerPlan,reachIn:number,reachOut:number,smoothing:number,exact:boolean,strict:boolean):Fillet{
 const {toward,away,theta,incoming,outgoing,before,after}=plan,turning=cross(toward,away)>0?1:-1,first:Side={curve:reverse(incoming),limit:paramAt(before,reachIn),sign:turning},second:Side={curve:outgoing,limit:paramAt(after,reachOut),sign:-turning};let arc:CornerArc,s:number,t:number;
 if(plan.lines){const p=incoming[3],trim=Math.min(plan.wanted,reachIn,reachOut),r=trim*Math.tan(theta/2),start=add(p,toward,trim);s=trim/before.length;t=trim/after.length;arc={start,stop:add(p,away,trim),center:add(start,{x:-toward.y*turning,y:toward.x*turning},r),radius:r,direction:{x:-toward.x,y:-toward.y},leaving:away,sweep:(turning>0?-1:1)*(Math.PI-theta)};}
 else{const found=exact?fit(first,second,plan.radius,[paramAt(before,Math.min(plan.wanted,reachIn)),paramAt(after,Math.min(plan.wanted,reachOut))],2*Math.min(reachIn,reachOut)*Math.tan(theta/2)):undefined;if(!found){if(strict)throw Error('This corner is too tight to round. Add points or use a smaller radius.');return plainFillet(plan,first,second,reachIn,reachOut,smoothing);}s=found.s;t=found.t;const start=at(first.curve,s),stop=at(second.curve,t),along=tangent(first.curve,s),direction={x:-along.x,y:-along.y},leaving=tangent(second.curve,t),sweep=Math.atan2(cross(direction,leaving),dot(direction,leaving));if(Math.abs(sweep)<1e-6||sweep*turning>0){if(strict)throw Error('The adjoining curves turn too sharply to round this corner. Use a smaller radius.');return plainFillet(plan,first,second,reachIn,reachOut,smoothing);}arc={start,stop,center:found.center,radius:found.radius,direction,leaving,sweep};}
 const smooth=smoothing>0?smoothAnchors(arc,{curve:first.curve,measure:before,length:lengthAt(before,s),reach:reachIn},{curve:second.curve,measure:after,length:lengthAt(after,t),reach:reachOut},smoothing):undefined;
 return smooth?{enter:1-smooth.a,leave:smooth.b,anchors:smooth.anchors}:{enter:1-s,leave:t,anchors:arcAnchors(arc.start,arc.stop,arc.center,arc.direction,arc.leaving,arc.sweep,arc.radius)};
}
export interface CornerOptions {smoothing?:number;strict?:boolean;fit?:'half'|'shared';exact?:boolean;}
/** How much of a side a corner may spend. Half keeps every corner independent. Shared lets a corner beside a sharp one use the whole side and splits a side between two rounded corners in proportion. */
function reachOf(plans:Map<number,CornerPlan>,count:number,fit:CornerOptions['fit'],pi:number,step:-1|1){const plan=plans.get(pi)!,length=step<0?plan.before.length:plan.after.length;if(fit==='half')return length/2;const other=plans.get((pi+step+count)%count)?.wanted;return other?length*plan.wanted/(plan.wanted+other):length;}
function plansFor(c:VectorContour,radiusOf:(pi:number)=>number,strict:boolean,only?:readonly number[]){const n=c.points.length,plans=new Map<number,CornerPlan>();for(const pi of only??c.points.keys()){const radius=radiusOf(pi);if(!(radius>0))continue;if(!c.closed&&(pi===0||pi===n-1)){if(strict)throw Error('Open endpoints cannot be rounded.');continue;}try{plans.set(pi,planCorner(c.points[(pi-1+n)%n],c.points[pi],c.points[(pi+1)%n],radius));}catch(error){if(strict)throw error;}}return plans;}
/** Every rounded corner of one contour. Live rendering is not strict: a corner that cannot take the radius stays sharp instead of refusing to draw. */
export function roundedCorners(c:VectorContour,radiusOf:(pi:number)=>number,{smoothing=0,strict=false,fit='shared',exact=true}:CornerOptions={}):VectorContour{
 const n=c.points.length;if(n<2)return c;const plans=plansFor(c,radiusOf,strict),fillets=new Map<number,Fillet>();
 for(const [pi,plan] of plans)fillets.set(pi,filletCorner(plan,reachOf(plans,n,fit,pi,-1),reachOf(plans,n,fit,pi,1),smoothing,exact,strict));
 if(!fillets.size)return c;const points:VectorPoint[]=[];
 const handles=(i:number)=>{const a=c.points[i],b=c.points[(i+1)%n],from=fillets.get(i)?.leave??0,to=fillets.get((i+1)%n)?.enter??1;if(straight(a,b))return {};const piece=restrict(segment(a,b),from,to);return {out:sub(piece[1],piece[0]),in:sub(piece[2],piece[3])};};
 const trimmed=(i:number)=>fillets.has((i+1)%n)||fillets.has(i);
 for(let pi=0;pi<n;pi++){const f=fillets.get(pi),left=c.closed||pi>0?(pi-1+n)%n:-1,right=c.closed||pi<n-1?pi:-1;if(!f){const p={...c.points[pi]};if(left>=0&&trimmed(left))p.in=handles(left).in;if(right>=0&&trimmed(right))p.out=handles(right).out;if(p.mode==='mirrored'&&(left>=0&&trimmed(left)||right>=0&&trimmed(right)))p.mode='aligned';points.push(p);continue;}const anchors=f.anchors.map(p=>({...p}));anchors[0].in=handles(left).in;anchors.at(-1)!.out=handles(right).out;points.push(...anchors);}
 return {...c,points};
}
/** Selected corners consume at most half of each adjoining segment's arc length, so neighbors never overlap. */
export function roundContourCorners(c:VectorContour,ci:number,selected:ReadonlySet<string>,radius:number):VectorContour{return roundedCorners(c,pi=>selected.has(`${ci}:${pi}`)?radius:0,{strict:true,fit:'half'});}
/** The radius that actually fits at one corner, in the contour's units. A value past what fits is kept but drawn at the largest that does. Only this corner and its neighbors are read, so a handle on a long contour stays cheap. */
export function fittedCornerRadius(c:VectorContour,pi:number){const n=c.points.length,plans=plansFor(c,i=>c.points[i].radius??0,false,[...new Set([(pi-1+n)%n,pi,(pi+1)%n])]),plan=plans.get(pi);return plan?Math.min(plan.wanted,reachOf(plans,n,'shared',pi,-1),reachOf(plans,n,'shared',pi,1))*Math.tan(plan.theta/2):0;}
export function validateCornerRadius(value:unknown){if(value!==undefined&&(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e6))throw Error('A corner radius must be a number from 0 to 1,000,000.');}
export function hasCornerRadii(contours:readonly VectorContour[]|undefined){return !!contours?.some(c=>c.points.some(p=>p.radius));}
const baseContours=(n:Pick<DesignNode,'contours'|'points'|'closed'>):VectorContour[]|undefined=>n.contours??(n.points?.some(p=>p.radius)?[{closed:!!n.closed,points:n.points}]:undefined);
/** Live corners belong to ordinary contour paths. Boolean results and network graphs have no contour anchors to hold them. */
export function hasLiveCorners(n:Pick<DesignNode,'type'|'contours'|'points'|'closed'|'booleanOp'|'vectorNetwork'>){return n.type==='path'&&!n.booleanOp&&!n.vectorNetwork&&hasCornerRadii(baseContours(n));}
const rounded=new WeakMap<object,Map<string,VectorContour[]>>();
/** Edits can change points in place inside one transaction, so a cached curve is checked against the values it came from. */
function fingerprint(contours:readonly VectorContour[]){let hash=7;const mix=(v:number)=>{hash=(hash*33+v*4096)%1000000007;};for(const c of contours){mix(c.closed?1:2);for(const p of c.points){mix(p.x);mix(p.y);mix(p.radius??0);mix(p.in?.x??0);mix(p.in?.y??0);mix(p.out?.x??0);mix(p.out?.y??0);}}return hash;}
const curvedCorners=(contours:readonly VectorContour[])=>{let count=0;for(const c of contours){const n=c.points.length;c.points.forEach((p,pi)=>{if(p.radius&&(nonzero(p.in)||nonzero(p.out)||nonzero(c.points[(pi-1+n)%n].out)||nonzero(c.points[(pi+1)%n].in)))count++;});}return count;};
/** Corners are measured in layer units, so a resized path keeps round corners at an unchanged radius. The result returns to path coordinates, where the shared artwork path is written. */
export function liveCornerContours(n:DesignNode,owner:object=n.contours??n.points):VectorContour[]|undefined{
 if(!hasLiveCorners(n))return undefined;const source=baseContours(n)!,sx=n.width/(n.pathWidth||n.width||1),sy=n.height/(n.pathHeight||n.height||1);if(!Number.isFinite(sx)||!Number.isFinite(sy)||!sx||!sy)return undefined;
 const cache=rounded.get(owner)??new Map<string,VectorContour[]>(),key=`${sx}:${sy}:${n.cornerSmoothing??0}:${fingerprint(source)}`,hit=cache.get(key);if(hit)return hit;
 const exact=curvedCorners(source)<=CORNER_ROUNDING_LIMITS.exactCorners,map=(p:{x:number;y:number},x:number,y:number)=>({x:p.x*x,y:p.y*y}),scale=(p:VectorPoint,x:number,y:number):VectorPoint=>{const {radius:_,...plain}=p;return {...plain,...map(p,x,y),...(p.in?{in:map(p.in,x,y)}:{}),...(p.out?{out:map(p.out,x,y)}:{})};};
 const contours=source.map(c=>{const points=c.points.map(p=>scale(p,sx,sy)),out=roundedCorners({...c,points},pi=>c.points[pi].radius??0,{smoothing:n.cornerSmoothing??0,exact});return {...out,points:out.points.map(p=>scale(p,1/sx,1/sy))};});if(cache.size>=8)cache.clear();cache.set(key,contours);rounded.set(owner,cache);return contours;
}
