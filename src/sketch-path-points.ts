import type {VectorPoint} from './model';
import {SKETCH_LIMITS,SketchImportError} from './sketch-limits';
type P={x:number;y:number};
const fail=():never=>{throw new SketchImportError('geometry');};
const bounded=(n:unknown):number=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1e6?fail():n;
function coordinate(value:unknown):P{if(typeof value!=='string')fail();const match=/^\{\s*([-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?),\s*([-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?)\s*\}$/i.exec(value as string);if(!match)fail();return{x:bounded(Number(match![1])),y:bounded(Number(match![2]))};}
const enabled=(v:unknown)=>v===undefined?false:typeof v==='boolean'?v:fail();
/** Archived official curveMode 0=None,1=Straight,2=Mirrored,3=Asymmetric,4=Disconnected.
 * API curveFrom is incoming and curveTo outgoing; saved normalized controls are absolute,
 * while Forma stores anchor-relative vectors. Geometry is never recomputed from the mode. */
export function sketchShapePathPoints(values:unknown,width:number,height:number,origin:P={x:0,y:0}):VectorPoint[]{
 if(!Array.isArray(values)||values.length<2||values.length>SKETCH_LIMITS.points)fail();for(const n of [width,height,origin.x,origin.y])bounded(n);if(width<0||height<0)fail();
 const scaled=(v:P)=>{const p={x:bounded(v.x*width),y:bounded(v.y*height)};bounded(origin.x+p.x);bounded(origin.y+p.y);return p;};
 return (values as unknown[]).map(value=>{if(!value||typeof value!=='object'||Array.isArray(value))fail();const raw=value as Record<string,unknown>;if(raw._class!==undefined&&raw._class!=='curvePoint'||raw.cornerRadius!==undefined&&raw.cornerRadius!==0)fail();const q=coordinate(raw.point);if(q.x<0||q.x>1||q.y<0||q.y>1)fail();const at=scaled(q),from=enabled(raw.hasCurveFrom),to=enabled(raw.hasCurveTo),mode=raw.curveMode;
  if(mode!==undefined&&(!Number.isInteger(mode)||![0,1,2,3,4].includes(mode as number))||((mode===undefined||mode===0||mode===1)&&(from||to)))fail();
  const p:VectorPoint={...at},handle=(v:unknown)=>{const end=scaled(coordinate(v));return{x:bounded(end.x-at.x),y:bounded(end.y-at.y)};};if(from)p.in=handle(raw.curveFrom);if(to)p.out=handle(raw.curveTo);
  if(mode===2||mode===3){if(!from||!to)fail();const a=p.in!,b=p.out!,la=Math.hypot(a.x,a.y),lb=Math.hypot(b.x,b.y),epsilon=1e-8*Math.max(1,la,lb);if(mode===2){if(Math.hypot(a.x+b.x,a.y+b.y)>epsilon)fail();p.mode='mirrored';}else{if(la&&lb&&(Math.abs(a.x/la*b.y/lb-a.y/la*b.x/lb)>1e-8||a.x/la*b.x/lb+a.y/la*b.y/lb>1e-8))fail();p.mode='aligned';}}
  else if(mode===4)p.mode='independent';return p;
 });
}
