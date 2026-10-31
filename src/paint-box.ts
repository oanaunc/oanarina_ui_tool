import type {DesignNode} from './model';
import {arrowStyle} from './arrowheads';
import {fillsFor,strokesFor} from './paints';

/** The local box a paint maps to. Paths and text map to their drawn bounds, which can differ from the layer box. */
export interface PaintBox {x:number;y:number;width:number;height:number;}
export type PaintRole='fill'|'stroke';
export const layerPaintBox=(n:Pick<DesignNode,'width'|'height'>):PaintBox=>({x:0,y:0,width:n.width,height:n.height});
export const paintsForRole=(n:DesignNode,role:PaintRole)=>role==='fill'?fillsFor(n):strokesFor(n).map(s=>s.paint);
/** Fills and most strokes use the painted element's own bounds; strokes drawn in layer space use the layer box. Reading the element keeps handles on what the renderer really does. */
export function measuredPaintBox(n:DesignNode,paintId:string,role:PaintRole):PaintBox{const whole=layerPaintBox(n),stroke=role==='stroke'?strokesFor(n).find(s=>s.paint.id===paintId):undefined;if(typeof document==='undefined'||stroke&&(stroke.edgeWidths||arrowStyle(n,'start')!=='none'||arrowStyle(n,'end')!=='none'))return whole;const layer=document.querySelector('#forma-design-canvas [data-node-id="'+CSS.escape(n.id)+'"]'),url=role==='fill'?`url(#fill-${n.id}-${paintId})`:`url(#stroke-${n.id}-${stroke?.id})`,element=layer&&[...layer.querySelectorAll<SVGGraphicsElement>('[fill],[stroke]')].find(el=>el.getAttribute('fill')===url||el.getAttribute('stroke')===url);if(!element)return whole;const b=element.getBBox();return {x:b.x,y:b.y,width:b.width,height:b.height};}
