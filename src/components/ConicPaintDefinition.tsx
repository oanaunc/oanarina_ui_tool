import {memo} from 'react';
import {angularWedges,diamondQuadrants} from '../conic-paints';
import type {Paint} from '../paints';
/** Crisp edges keep adjacent polygons free of antialiased seams, including over transparent stops. */
function ConicContent({paint:p,id}:{paint:Paint;id:string}){if(p.type==='angular')return <>{angularWedges(p).map((w,i)=><polygon key={i} points={w.points} fill={w.color} fillOpacity={w.opacity} shapeRendering="crispEdges"/>)}</>;const stops=[...p.stops].sort((a,b)=>a.position-b.position).map(s=><stop key={s.id} offset={s.position} stopColor={s.color} stopOpacity={s.opacity}/>);return <>{diamondQuadrants(p).map((q,i)=><g key={i}><linearGradient id={`${id}-q${i}`} gradientUnits="userSpaceOnUse" x1={q.x1} y1={q.y1} x2={q.x2} y2={q.y2}>{stops}</linearGradient><polygon points={q.points} fill={`url(#${id}-q${i})`} shapeRendering="crispEdges"/></g>)}</>;}
const Content=memo(ConicContent,(a,b)=>a.id===b.id&&a.paint===b.paint);
/** Resolution-independent angular and diamond paints in the same normalized box as linear and radial ones. */
export function ConicPaintDefinition({paint:p,id,width,height,userSpace=false}:{paint:Paint;id:string;width:number;height:number;userSpace?:boolean}){const w=Math.max(.001,width),h=Math.max(.001,height);return <pattern id={id} width={userSpace?w:1} height={userSpace?h:1} patternUnits={userSpace?'userSpaceOnUse':undefined} patternContentUnits={userSpace?'userSpaceOnUse':'objectBoundingBox'}><g transform={userSpace?`scale(${w} ${h})`:undefined}><Content paint={p} id={id}/></g></pattern>;}
