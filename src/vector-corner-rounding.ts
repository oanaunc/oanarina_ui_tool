import type {VectorContour,VectorPoint} from './model';

type P={x:number;y:number};
type Cubic=[P,P,P,P];
export const CORNER_ROUNDING_LIMITS={curvedCorners:4096,samples:64,bisections:32,lengthSamples:64} as const;
const add=(a:P,b:P,k=1)=>({x:a.x+b.x*k,y:a.y+b.y*k});
const sub=(a:P,b:P)=>({x:a.x-b.x,y:a.y-b.y});
const lerp=(a:P,b:P,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const size=(v:P)=>Math.hypot(v.x,v.y);
const dot=(a:P,b:P)=>a.x*b.x+a.y*b.y;
const cross=(a:P,b:P)=>a.x*b.y-a.y*b.x;
const unit=(v:P)=>{const l=size(v);return {x:v.x/l,y:v.y/l};};
const nonzero=(h:P|undefined)=>!!h&&size(h)>1e-8;
function at(c:Cubic,t:number){const a=lerp(c[0],c[1],t),b=lerp(c[1],c[2],t),d=lerp(c[2],c[3],t),e=lerp(a,b,t),f=lerp(b,d,t);return lerp(e,f,t);}
function derivative(c:Cubic,t:number){const u=1-t,a=sub(c[1],c[0]),b=sub(c[2],c[1]),d=sub(c[3],c[2]);return {x:3*(u*u*a.x+2*u*t*b.x+t*t*d.x),y:3*(u*u*a.y+2*u*t*b.y+t*t*d.y)};}
/** A collapsed handle has no first derivative at its anchor; the limit direction comes from just inside the curve. */
function tangent(c:Cubic,t:number){const d=derivative(c,t);if(size(d)>1e-9)return unit(d);const inside=derivative(c,t<.5?t+1e-4:t-1e-4);return size(inside)>1e-12?unit(inside):unit(sub(c[3],c[0]));}
function divide(c:Cubic,t:number):[Cubic,Cubic]{const a=lerp(c[0],c[1],t),b=lerp(c[1],c[2],t),d=lerp(c[2],c[3],t),e=lerp(a,b,t),f=lerp(b,d,t),g=lerp(e,f,t);return [[c[0],a,e,g],[g,f,d,c[3]]];}
/** Exact de Casteljau restriction: kept curve pieces are the source curve, not an approximation of it. */
function restrict(c:Cubic,from:number,to:number):Cubic{const tail=from>0?divide(c,from)[1]:c;return to<1?divide(tail,(to-from)/(1-from))[0]:tail;}
const reverse=(c:Cubic):Cubic=>[c[3],c[2],c[1],c[0]];
function halfway(c:Cubic){const lengths=[0];let previous=c[0];for(let i=1;i<=CORNER_ROUNDING_LIMITS.lengthSamples;i++){const p=at(c,i/CORNER_ROUNDING_LIMITS.lengthSamples);lengths.push(lengths[i-1]+size(sub(p,previous)));previous=p;}const total=lengths.at(-1)!;let i=lengths.findIndex(l=>l>=total/2);if(i<1)i=1;const span=lengths[i]-lengths[i-1];return {length:total,t:(i-1+(span>0?(total/2-lengths[i-1])/span:0))/CORNER_ROUNDING_LIMITS.lengthSamples};}
interface Side {curve:Cubic;limit:number;sign:number;}
const offset=(side:Side,s:number,r:number)=>{const t=tangent(side.curve,s);return add(at(side.curve,s),{x:-t.y*side.sign,y:t.x*side.sign},r);};
function intersection(a:P,b:P,c:P,d:P){const e=sub(b,a),f=sub(d,c),denominator=cross(e,f);if(Math.abs(denominator)<1e-14)return;const g=sub(c,a),t=cross(g,f)/denominator,u=cross(g,e)/denominator;return t>=-1e-9&&t<=1+1e-9&&u>=-1e-9&&u<=1+1e-9?{t,u}:undefined;}
/** A tangent circle's center lies on both offset curves, so the fillet is a crossing of those offsets. */
function tangentCircle(a:Side,b:Side,r:number){const count=CORNER_ROUNDING_LIMITS.samples,params=(limit:number)=>Array.from({length:count+1},(_,i)=>limit*(i/count)**2),sa=params(a.limit),sb=params(b.limit),oa=sa.map(s=>offset(a,s,r)),ob=sb.map(s=>offset(b,s,r));let best:{s:number;t:number;score:number}|undefined;for(let i=0;i<count;i++)for(let j=0;j<count;j++){const hit=intersection(oa[i],oa[i+1],ob[j],ob[j+1]);if(!hit)continue;const s=sa[i]+(sa[i+1]-sa[i])*hit.t,t=sb[j]+(sb[j+1]-sb[j])*hit.u,score=s/a.limit+t/b.limit;if(!best||score<best.score)best={s,t,score};}if(!best)return;
 let {s,t}=best;const h=1e-6;for(let i=0;i<16;i++){const f=sub(offset(a,s,r),offset(b,t,r));if(size(f)<1e-10)break;const ds=sub(offset(a,Math.min(a.limit,s+h),r),offset(a,Math.max(0,s-h),r)),dt=sub(offset(b,Math.min(b.limit,t+h),r),offset(b,Math.max(0,t-h),r)),ws=Math.min(a.limit,s+h)-Math.max(0,s-h),wt=Math.min(b.limit,t+h)-Math.max(0,t-h),j1={x:ds.x/ws,y:ds.y/ws},j2={x:-dt.x/wt,y:-dt.y/wt},determinant=cross(j1,j2);if(Math.abs(determinant)<1e-12)break;s=Math.max(0,Math.min(a.limit,s-cross(f,j2)/determinant));t=Math.max(0,Math.min(b.limit,t-cross(j1,f)/determinant));}
 return size(sub(offset(a,s,r),offset(b,t,r)))<1e-6?{s,t,center:offset(a,s,r)}:undefined;}
function fit(a:Side,b:Side,radius:number){const direct=tangentCircle(a,b,radius);if(direct)return {...direct,radius};let low=0,high=radius,best:(ReturnType<typeof tangentCircle>&{radius:number})|undefined;for(let i=0;i<CORNER_ROUNDING_LIMITS.bisections;i++){const r=(low+high)/2,found=tangentCircle(a,b,r);if(found){best={...found,radius:r};low=r;}else high=r;}return best;}
interface Fillet {enter:number;leave:number;anchors:VectorPoint[];}
/** Circular arc from one tangent point to the other; each cubic spans at most a quarter turn. */
function arcAnchors(start:P,stop:P,center:P,direction:P,leaving:P,sweep:number,radius:number):VectorPoint[]{const pieces=Math.max(1,Math.ceil(Math.abs(sweep)/(Math.PI/2+1e-9))),step=sweep/pieces,h=4/3*Math.tan(Math.abs(step)/4)*radius,turn=(v:P,a:number)=>({x:v.x*Math.cos(a)-v.y*Math.sin(a),y:v.x*Math.sin(a)+v.y*Math.cos(a)}),from=sub(start,center),anchors:VectorPoint[]=[];for(let i=0;i<=pieces;i++){const position=i===0?start:i===pieces?stop:add(center,turn(from,step*i)),d=i===pieces?leaving:turn(direction,step*i);anchors.push({...position,...(i>0?{in:{x:-d.x*h,y:-d.y*h}}:{}),...(i<pieces?{out:{x:d.x*h,y:d.y*h}}:{}),mode:i>0&&i<pieces?'aligned':'independent'});}return anchors;}
const segment=(a:VectorPoint,b:VectorPoint):Cubic=>[{x:a.x,y:a.y},add(a,a.out??{x:0,y:0}),add(b,b.in??{x:0,y:0}),{x:b.x,y:b.y}];
const straight=(a:VectorPoint,b:VectorPoint)=>!nonzero(a.out)&&!nonzero(b.in);
function filletCorner(previous:VectorPoint,p:VectorPoint,next:VectorPoint,radius:number):Fillet{
 const incoming=segment(previous,p),outgoing=segment(p,next),a=halfway(reverse(incoming)),b=halfway(outgoing);if(a.length<1e-8||b.length<1e-8)throw Error('Remove duplicate corner points first.');
 const toward=tangent(reverse(incoming),0),away=tangent(outgoing,0),theta=Math.acos(Math.max(-1,Math.min(1,dot(toward,away))));if(theta<1e-5||Math.PI-theta<1e-5)throw Error('Select a corner with a nonzero angle.');
 if(straight(previous,p)&&straight(p,next)){const trim=Math.min(radius/Math.tan(theta/2),a.length/2,b.length/2),r=trim*Math.tan(theta/2),start=add(p,toward,trim),stop=add(p,away,trim),direction={x:-toward.x,y:-toward.y},side=cross(toward,away)>0?1:-1,center=add(start,{x:-toward.y*side,y:toward.x*side},r);return {enter:1-trim/a.length,leave:trim/b.length,anchors:arcAnchors(start,stop,center,direction,away,(side>0?-1:1)*(Math.PI-theta),r)};}
 const side=cross(toward,away)>0?1:-1,first:Side={curve:reverse(incoming),limit:a.t,sign:side},second:Side={curve:outgoing,limit:b.t,sign:-side},found=fit(first,second,radius);if(!found)throw Error('This corner is too tight to round. Add points or use a smaller radius.');
 const start=at(first.curve,found.s),stop=at(second.curve,found.t),direction=(()=>{const t=tangent(first.curve,found.s);return {x:-t.x,y:-t.y};})(),leaving=tangent(second.curve,found.t),sweep=Math.atan2(cross(direction,leaving),dot(direction,leaving));if(Math.abs(sweep)<1e-6||sweep*side>0)throw Error('The adjoining curves turn too sharply to round this corner. Use a smaller radius.');
 return {enter:1-found.s,leave:found.t,anchors:arcAnchors(start,stop,found.center,direction,leaving,sweep,found.radius)};
}
/** Selected corners consume at most half of each adjoining segment's arc length, so neighbors never overlap. */
export function roundContourCorners(c:VectorContour,ci:number,selected:ReadonlySet<string>,radius:number):VectorContour{
 const n=c.points.length,fillets=new Map<number,Fillet>();
 for(let pi=0;pi<n;pi++){if(!selected.has(`${ci}:${pi}`))continue;if(!c.closed&&(pi===0||pi===n-1))throw Error('Open endpoints cannot be rounded.');fillets.set(pi,filletCorner(c.points[(pi-1+n)%n],c.points[pi],c.points[(pi+1)%n],radius));}
 if(!fillets.size)return c;const points:VectorPoint[]=[];
 const handles=(i:number)=>{const a=c.points[i],b=c.points[(i+1)%n],from=fillets.get(i)?.leave??0,to=fillets.get((i+1)%n)?.enter??1;if(straight(a,b))return {};const piece=restrict(segment(a,b),from,to);return {out:sub(piece[1],piece[0]),in:sub(piece[2],piece[3])};};
 const trimmed=(i:number)=>fillets.has((i+1)%n)||fillets.has(i);
 for(let pi=0;pi<n;pi++){const f=fillets.get(pi),left=c.closed||pi>0?(pi-1+n)%n:-1,right=c.closed||pi<n-1?pi:-1;if(!f){const p={...c.points[pi]};if(left>=0&&trimmed(left))p.in=handles(left).in;if(right>=0&&trimmed(right))p.out=handles(right).out;if(p.mode==='mirrored'&&(left>=0&&trimmed(left)||right>=0&&trimmed(right)))p.mode='aligned';points.push(p);continue;}const anchors=f.anchors.map(p=>({...p}));anchors[0].in=handles(left).in;anchors.at(-1)!.out=handles(right).out;points.push(...anchors);}
 return {...c,points};
}
