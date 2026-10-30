import type {DesignNode} from './model';
import type {StrokeStyle} from './paints';

export type EdgeWidths=[number,number,number,number];
export const edgeNames=['Top','Right','Bottom','Left'] as const;
export function validateEdgeWidths(value:unknown):asserts value is EdgeWidths|undefined{if(value!==undefined&&(!Array.isArray(value)||value.length!==4||value.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e6)))throw Error('Edge stroke widths must contain Top, Right, Bottom and Left values between 0 and 1,000,000.');}
export function validateEdgeStrokeStyle(s:StrokeStyle){validateEdgeWidths(s.edgeWidths);if(s.edgeWidths&&(s.dash.length||s.join!=='miter'||s.cap!=='butt'))throw Error('Independent edge strokes require solid lines, miter joins and butt caps. Disable independent edges before changing dashes, joins or caps.');}
export function edgeStrokeIssue(n:DesignNode){if(!['rectangle','image','frame','component','instance','group','section'].includes(n.type)||n.booleanOp)return 'Independent edges support square box shapes only. Disable independent edges before changing this shape.';if(n.radius!==0||n.corners?.some(v=>v!==0))return 'Set all corner radii to zero, or disable independent edges before rounding this box.';if(n.arrowStart&&n.arrowStart!=='none'||n.arrowEnd&&n.arrowEnd!=='none')return 'Remove arrowheads or disable independent edges first.';return '';}
/** Optional nested fields are checked on ordinary edits, imports and headless transactions. */
export function validateDocumentEdgeStrokes(document:{pages?:unknown}){if(!Array.isArray(document.pages))return;for(const page of document.pages)if(Array.isArray(page?.nodes))for(const n of page.nodes)if(Array.isArray(n?.strokes)){for(const s of n.strokes){if(s?.edgeWidths===undefined)continue;validateEdgeWidths(s.edgeWidths);validateEdgeStrokeStyle(s);const issue=edgeStrokeIssue(n);if(issue)throw Error(issue);}if(n.strokes[0]?.edgeWidths&&n.variableBindings?.strokeWidth)throw Error('Unbind the uniform stroke-width variable before using independent edge widths.');}}
export function effectiveStrokeWidth(s:StrokeStyle){return s.edgeWidths?Math.max(...s.edgeWidths):s.width;}
export function edgeStrokeOutsets(s:StrokeStyle):EdgeWidths{const factor=s.align==='inside'?0:s.align==='center'?.5:1;return (s.edgeWidths??[s.width,s.width,s.width,s.width]).map(v=>v*factor) as EdgeWidths;}
export function strokeBoxOutsets(strokes:StrokeStyle[]):EdgeWidths{const out:EdgeWidths=[0,0,0,0];for(const s of strokes)if(s.visible){const edges=edgeStrokeOutsets(s);for(let i=0;i<4;i++)out[i]=Math.max(out[i],edges[i]);}return out;}
/** A single even-odd ring avoids translucent overlap at unequal-width corners. */
export function edgeStrokePath(n:Pick<DesignNode,'width'|'height'>,s:StrokeStyle){if(!s.edgeWidths||!s.edgeWidths.some(v=>v>0))return '';const [t,r,b,l]=s.edgeWidths,inside=s.align==='outside'?0:s.align==='center'?.5:1,outside=1-inside,w=n.width,h=n.height;
 const outer={l:-l*outside,t:-t*outside,r:w+r*outside,b:h+b*outside};let il=l*inside,ir=r*inside,it=t*inside,ib=b*inside;
 // Oversized opposing edges consume the interior proportionally; they never invert the hole.
 if(il+ir>w){const k=w/(il+ir);il*=k;ir*=k;}if(it+ib>h){const k=h/(it+ib);it*=k;ib*=k;}
 const rect=(l:number,t:number,r:number,b:number)=>`M${l} ${t}H${r}V${b}H${l}Z`,hole=w-il-ir>1e-9&&h-it-ib>1e-9?rect(il,it,w-ir,h-ib):'';return rect(outer.l,outer.t,outer.r,outer.b)+hole;
}
