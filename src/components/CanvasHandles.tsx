import {resizeCursor} from '../canvas-chrome';
import type {ShapeHandle,SpacingHandle} from '../canvas-handles';
const handleKey=(h:{id:string;key:string})=>h.id+':'+h.key;
/** Editing handles for padding, gaps, corners and arcs. Every size divides by zoom, so they hold one screen size. */
export default function CanvasHandles({spacing,shapes,hot,active,zoom,turn,onSpacing,onShape}:{spacing:SpacingHandle[];shapes:ShapeHandle[];hot?:string;active?:string;zoom:number;turn:number;onSpacing:(e:React.PointerEvent,h:SpacingHandle)=>void;onShape:(e:React.PointerEvent,h:ShapeHandle)=>void}){
 const dragging=active!==undefined,lit=spacing.find(h=>dragging?h.key===active:handleKey(h)===hot),family=(h:SpacingHandle)=>h.group??handleKey(h),zones=lit?spacing.filter(h=>family(h)===family(lit)):[],bars=dragging?zones:spacing,marks=dragging?shapes.filter(h=>h.key===active):shapes;
 return <g className="canvas-handles" data-canvas-handles>
  {zones.map(h=><polygon key={handleKey(h)} data-spacing-zone={h.key} points={h.zone.map(p=>p.x+','+p.y).join(' ')} fill="var(--measure)" fillOpacity={.2} pointerEvents="none"/>)}
  {bars.map(h=>{const cursor=resizeCursor(h.axis==='x'?'e':'n',turn),line={x1:h.from.x,y1:h.from.y,x2:h.to.x,y2:h.to.y};return <g key={handleKey(h)} data-spacing-handle={h.key} data-handle-layer={h.id} style={{cursor}} onPointerDown={e=>onSpacing(e,h)}><line {...line} stroke="#ffffff" strokeWidth={4/zoom} strokeLinecap="round"/><line {...line} stroke="var(--measure)" strokeWidth={2/zoom} strokeLinecap="round"/><line {...line} stroke="transparent" strokeWidth={13/zoom} strokeLinecap="round"><title>{h.key.startsWith('gap')?'Gap':'Padding'}: {Math.round(h.value*100)/100}. Drag to change it.</title></line></g>;})}
  {marks.map(h=><g key={handleKey(h)} data-shape-handle={h.key} data-handle-layer={h.id} style={{cursor:'pointer'}} onPointerDown={e=>onShape(e,h)}><circle cx={h.x} cy={h.y} r={4/zoom} fill="#ffffff" stroke={h.key.startsWith('smart')?'var(--measure)':'var(--selection)'} strokeWidth={1.5/zoom}/><circle cx={h.x} cy={h.y} r={7/zoom} fill="transparent"><title>{h.label}</title></circle></g>)}
 </g>;
}
