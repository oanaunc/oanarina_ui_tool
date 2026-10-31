import type {DesignNode,VectorContour,VectorPoint} from './model';
import {geometry,pathContours,pathProperties} from './geometry';

type P={x:number;y:number};
export const TEXT_PATH_SHAPES=['path','ellipse','rectangle','polygon','star'] as const;
export const canBecomeTextPath=(n:Pick<DesignNode,'type'>)=>(TEXT_PATH_SHAPES as readonly string[]).includes(n.type);
const flipHandles=(p:VectorPoint):VectorPoint=>{const {in:before,out:after,...rest}=p;return {...rest,...(after?{in:after}:{}),...(before?{out:before}:{})};};
/** Files saved by earlier builds opened loops by repeating the start anchor; returning to a path closes those. */
export function reclosedContour(c:VectorContour):VectorContour{const a=c.points[0],b=c.points.at(-1)!;if(c.closed||c.points.length<3||Math.hypot(a.x-b.x,a.y-b.y)>1e-6)return c;return {...c,closed:true,points:[{...a,...(b.in?{in:b.in}:{})},...c.points.slice(1,-1)]};}
/** A closed contour keeps its first anchor, so the seam stays where it was. */
export function reversedContour(c:VectorContour):VectorContour{const points=c.points.slice().reverse().map(flipHandles);return {...c,points:c.closed?[points.at(-1)!,...points.slice(0,-1)]:points};}
/** Shapes bake their own pose first, matching Edit vector points, so the text follows what is on screen. */
export function baselineGeometry(n:DesignNode):Partial<DesignNode>{if(n.type==='path')return {contours:n.contours??pathContours(n)};if(!canBecomeTextPath(n))throw Error('Choose a vector shape for text on path.');const path=geometry(n);let props:Partial<DesignNode>;try{props=pathProperties(path);}finally{path.remove();}return {...props,contours:pathContours({...n,...props}),radius:0,corners:undefined,cornerSmoothing:undefined};}
export interface LengthMeasure {getTotalLength():number;getPointAtLength(length:number):P;}
/** Coarse scan then bisection, so a long baseline does not need a dense table per pointer move. */
export function nearestPathLength(path:LengthMeasure,target:P,samples=200){const total=path.getTotalLength();if(!(total>0))return 0;const distance=(l:number)=>{const p=path.getPointAtLength(l);return Math.hypot(p.x-target.x,p.y-target.y);};let best=0,score=Infinity;for(let i=0;i<=samples;i++){const l=total*i/samples,d=distance(l);if(d<score){score=d;best=l;}}let step=total/samples;while(step>total/1e5){for(const l of [best-step,best+step]){if(l<0||l>total)continue;const d=distance(l);if(d<score){score=d;best=l;}}step/=2;}return best;}
export const offsetPercent=(length:number,total:number)=>total>0?Math.max(0,Math.min(100,Math.round(length/total*1000)/10)):0;
