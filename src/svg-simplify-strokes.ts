import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
import type {DesignNode} from './model';
import {strokesFor,validateStrokeStack} from './paints';
import {hasArrowheads} from './arrowheads';
import {validateSvgStrokeOutlineSource} from './svg-stroke-outlines';
export const SVG_SIMPLIFY_STROKE_LIMITS={layers:20_000,targets:128} as const;
const visible=(n:DesignNode)=>strokesFor(n).filter(s=>s.visible&&s.paint.visible&&s.paint.opacity>0&&(s.width>0||s.edgeWidths?.some(v=>v>0)));
/** Lines and marker strokes render centered regardless of their saved alignment. */
export function svgAlignedStrokeTargets(nodes:DesignNode[]){return nodes.filter(n=>!n.exportGhost&&n.visible&&n.opacity>0&&!['line','arrow'].includes(n.type)&&!hasArrowheads(n)&&visible(n).some(s=>s.align!=='center'));}
export interface SimplifiedSvgStroke {path:string;width:number;alignment:'inside'|'outside';}
/** Exact centerline substitution for square rectangles and complete circles only. */
export function svgSimplifiedStrokePlan(nodes:DesignNode[]){
 if(nodes.length>20_000)throw Error('SVG stroke simplification supports at most 20,000 exported layers.');const targets=svgAlignedStrokeTargets(nodes);if(targets.length>128)throw Error('Simplify at most 128 aligned strokes per SVG.');const plan=new Map<string,SimplifiedSvgStroke>();if(!targets.length)return plan;
 if(nodes.some(n=>n.mask))throw Error('SVG stroke simplification does not support mask runs. Disable Simplify aligned strokes.');validateSvgStrokeOutlineSource(nodes,targets);
 const parents=new Set(nodes.filter(n=>n.parentId).map(n=>n.parentId));
 for(const n of targets){const stacks=strokesFor(n);validateStrokeStack(stacks);if(stacks.length!==1||parents.has(n.id)||!['rectangle','ellipse'].includes(n.type))throw Error('Simplify aligned strokes supports one uniform saved stroke on a leaf square-corner rectangle or complete circle.');const s=stacks[0];if(s.variableWidth||s.edgeWidths||s.dash.length||s.paint.type!=='solid'||n.cornerSmoothing||n.radius||n.corners?.some(v=>v!==0))throw Error('Simplify aligned strokes requires solid undashed strokes without point widths, edge widths, rounding or smoothing.');const w=s.width;if(![n.width,n.height,w].every(v=>Number.isFinite(v)&&v>0&&v<=1e6)||s.align==='center')throw Error('Use a finite positive aligned stroke.');if(s.align==='inside'&&w>=Math.min(n.width,n.height)/2||s.align==='outside'&&w>Math.min(n.width,n.height))throw Error('Simplify stroke weight must be less than half the smaller dimension inside, or at most that dimension outside.');
  const offset=s.align==='inside'?w/2:-w/2;let path='';
  if(n.type==='rectangle'){if(s.join!=='miter'||s.miterLimit<Math.SQRT2)throw Error('Square rectangle simplification requires a miter join with limit at least √2.');const l=offset,r=n.width-offset,b=n.height-offset;path=`M${l} ${l}H${r}V${b}H${l}Z`;}
  else {if(n.width!==n.height||(n.arcSweep??360)!==360||(n.arcInner??0)!==0)throw Error('Simplify aligned ellipse strokes requires a complete circle without an inner arc.');const c=n.width/2,r=c-offset;path=`M${c-r} ${c}A${r} ${r} 0 1 0 ${c+r} ${c}A${r} ${r} 0 1 0 ${c-r} ${c}Z`;}
  plan.set(n.id,{path,width:w,alignment:s.align});
 }
 return plan;
}
/** Replace only the alignment wrapper, preserving source fill geometry/order and affine groups. */
export function simplifySvgStrokeMarkup(raw:string,plan:ReadonlyMap<string,SimplifiedSvgStroke>){if(!plan.size)return raw;if(raw.length>100_000_000)throw Error('SVG simplification exceeds 100 MB.');const xml=new DOMParser({onError:(_level,message)=>{throw Error('SVG stroke simplification failed: '+message);}}).parseFromString(raw,'image/svg+xml'),seen=new Set<string>();
 for(const owner of Array.from(xml.getElementsByTagName('g'))){const id=owner.getAttribute('data-node-id'),entry=id?plan.get(id):undefined;if(!entry)continue;if(seen.has(id!))throw Error('Duplicate SVG stroke simplification owner.');let count=0;for(const shape of Array.from(owner.getElementsByTagName('path'))){const parent=shape.parentNode;if(!parent||parent.nodeType!==1)continue;const wrapper=parent as import('@xmldom/xmldom').Element,attribute=entry.alignment==='inside'?'clip-path':'mask',reference=`url(#${entry.alignment==='inside'?'local-clip-':'outside-mask-'}${id})`;if(wrapper.getAttribute(attribute)!==reference||shape.getAttribute('stroke-width')!==String(entry.width*2))continue;shape.setAttribute('d',entry.path);shape.setAttribute('stroke-width',String(entry.width));wrapper.removeAttribute(attribute);count++;}if(count!==1)throw Error('The SVG alignment wrapper changed; simplification refused.');seen.add(id!);}
 const references=new Set<string>(),resources=new Map<string,import('@xmldom/xmldom').Element>();for(const el of Array.from(xml.getElementsByTagName('*'))){if(el.hasAttribute('id'))resources.set(el.getAttribute('id')!,el);for(const a of Array.from(el.attributes))references.add(a.value);}for(const [id,entry] of plan){const resource=(entry.alignment==='inside'?'local-clip-':'outside-mask-')+id,el=resources.get(resource);if(el&&!references.has(`url(#${resource})`))el.parentNode?.removeChild(el);}
 if(seen.size!==plan.size)throw Error('An SVG stroke simplification target was not rendered.');return new XMLSerializer().serializeToString(xml);
}
