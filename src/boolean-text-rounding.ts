import type {DesignNode} from './model';
import type {Matrix} from './transforms';
/** Bounds only known decimal serialization stages, not the numerical error of Paper's algorithms. */
export const TEXT_BOOLEAN_ROUNDING={maximumWorldAxisError:.01,maximumCondition:10000,glyphUnit:.000001,paperUnit:.00001} as const;
const norm=(a:number,b:number,c:number,d:number)=>Math.max(Math.abs(a)+Math.abs(c),Math.abs(b)+Math.abs(d));
function linear(a:number,b:number,c:number,d:number){const size=norm(a,b,c,d),det=Math.abs(a*d-b*c),condition=size*norm(d,-b,-c,a)/det;if(![size,det,condition].every(Number.isFinite)||det<=0||condition>10000)throw Error('Outlined text Boolean: the source transform is collapsed or too ill-conditioned (maximum condition 10,000).');return size;}
export function textBooleanSerializationEnvelope(common:Matrix,sources:readonly DesignNode[]){if(common.some(v=>!Number.isFinite(v)))throw Error('Outlined text Boolean: the common transform is not finite.');const amplification=linear(common[0],common[1],common[2],common[3]);let maximum=0;
 for(const n of sources){const angle=n.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),sx=(n.flipX?-1:1)*(n.motionScaleX??1),sy=(n.flipY?-1:1)*(n.motionScaleY??1),own=linear(c*sx,s*sx,-s*sy,c*sy),bx=n.type==='path'?Math.abs(n.width/(n.pathWidth||n.width||1)):1,by=n.type==='path'?Math.abs(n.height/(n.pathHeight||n.height||1)):1,basis=Math.max(bx,by);if(![bx,by].every(v=>Number.isFinite(v)&&v>0)||basis/Math.min(bx,by)>10000)throw Error('Outlined text Boolean: the path basis is collapsed, nonfinite or too ill-conditioned (maximum condition 10,000).');
  // Text: glyph6 before own transform, baked operand5 and live result5. Vectors: conservative
  // contour5 before path-basis/own transforms and result5. Boolean intermediates aren't serialized.
  const error=n.type==='text'?.0000005*own+.00001:.000005*basis*own+.000005,value=amplification*error;if(!Number.isFinite(value)||value>.01)throw Error('Outlined text Boolean: transform amplification exceeds the 0.01 design-unit decimal-rounding budget. Reduce ancestor/operand scale before reviewing.');maximum=Math.max(maximum,value);
 }
 return {maximumWorldAxisError:maximum,amplification};
}
