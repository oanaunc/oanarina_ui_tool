import type {DesignNode} from './model';
import {worldMatrix} from './transforms';
type Point={x:number;y:number};
/** Components, instances and their contents wear the component color; everything else wears the selection color. Both are theme tokens. */
export const isComponentLayer=(n:DesignNode)=>n.type==='component'||n.type==='instance'||!!n.instanceRootId;
export const chromeTone=(n:DesignNode|undefined)=>n&&isComponentLayer(n)?'var(--component)':'var(--selection)';
export const selectionTone=(selected:DesignNode[])=>selected.length>0&&selected.every(isComponentLayer)?'var(--component)':'var(--selection)';
const CURSORS=['ew-resize','nwse-resize','ns-resize','nesw-resize'],HANDLE_ANGLE:Record<string,number>={e:0,w:0,se:45,nw:45,s:90,n:90,sw:135,ne:135};
/** The arrow follows the layer's own rotation, so a turned layer still shows which way a handle pulls. */
export function resizeCursor(handle:string,rotation=0){const angle=((HANDLE_ANGLE[handle]+rotation)%180+180)%180;return CURSORS[Math.round(angle/45)%4];}
export function selectionRotation(selected:DesignNode[],nodes:DesignNode[]){if(selected.length!==1)return 0;const m=worldMatrix(selected[0],nodes);return Math.atan2(m[1],m[0])*180/Math.PI;}
/** An inline drawing, so no image file ships with the app. The bow of the arrow points away from the corner it sits on. */
export function rotateCursor(degrees:number){const arc='M7 18Q7 7 18 7M4 15l3 3 3-3M15 4l3 3-3 3',draw=(stroke:string,width:number)=>`<path d='${arc}' fill='none' stroke='${stroke}' stroke-width='${width}' stroke-linecap='round' stroke-linejoin='round'/>`,svg=`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g transform='rotate(${Math.round(degrees)} 12 12)'>${draw('#ffffff',4)}${draw('#000000',1.6)}</g></svg>`;return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, alias`;}
const CORNER_BASE:Record<string,number>={nw:0,ne:90,se:180,sw:270};
const unit=(a:Point,b:Point,fallback:Point)=>{const x=a.x-b.x,y=a.y-b.y,length=Math.hypot(x,y);return length>1e-9?{x:x/length,y:y/length}:fallback;};
export interface RotationZone {corner:'nw'|'ne'|'se'|'sw';points:string;cursor:string;}
/** Hot areas just outside each corner, shaped as an L so the layer's own interior stays clickable. The top-left one stops short of a frame name, which stays draggable. */
export function rotationZones(corners:Point[],zoom:number,rotation=0,keepNameClear=false):RotationZone[]{const reach=16/zoom,names=['nw','ne','se','sw'] as const;return names.map((corner,i)=>{const c=corners[i],out=unit(c,corners[(i+1)%4],{x:i===0||i===3?-1:1,y:0}),up=unit(c,corners[(i+3)%4],{x:-out.y,y:out.x}),at=(a:number,b:number)=>{const x=c.x+out.x*a*reach+up.x*b*reach,y=c.y+out.y*a*reach+up.y*b*reach;return x+','+y;},shape=keepNameClear&&corner==='nw'?[[0,1],[1,1],[1,-1],[0,-1]]:[[-1,1],[1,1],[1,-1],[0,-1],[0,0],[-1,0]];return {corner,points:shape.map(([a,b])=>at(a,b)).join(' '),cursor:rotateCursor(CORNER_BASE[corner]+rotation)};});}
/** The keyboard-focusable part of the northeast zone: square, and clear of the corner resize handle. */
export function rotationHandleBox(corners:Point[],zoom:number){const c=corners[1],out=unit(c,corners[0],{x:1,y:0}),up=unit(c,corners[2],{x:-out.y,y:out.x}),near=6/zoom,far=16/zoom,at=(a:number,b:number)=>(c.x+out.x*a+up.x*b)+','+(c.y+out.y*a+up.y*b);return [at(near,near),at(far,near),at(far,far),at(near,far)].join(' ');}
/** Below this on-screen size handles step outside the layer, so its middle stays free to pick up. Handles use the returned box; the selection outline keeps the real one. */
const GRAB_CORE=20;
export function grabOutline(corners:Point[],zoom:number){const pushX=Math.max(0,GRAB_CORE-Math.hypot(corners[1].x-corners[0].x,corners[1].y-corners[0].y)*zoom)/2/zoom,pushY=Math.max(0,GRAB_CORE-Math.hypot(corners[3].x-corners[0].x,corners[3].y-corners[0].y)*zoom)/2/zoom;if(!pushX&&!pushY)return corners;const along=unit(corners[1],corners[0],{x:1,y:0}),down=unit(corners[3],corners[0],{x:-along.y,y:along.x});return corners.map((c,i)=>{const x=(i===0||i===3?-1:1)*pushX,y=(i<2?-1:1)*pushY;return {x:c.x+along.x*x+down.x*y,y:c.y+along.y*x+down.y*y};});}
/** A resize strip lies along the whole edge, leaving the corner squares free. */
export function resizeEdge(a:Point,b:Point,zoom:number){const along=unit(b,a,{x:1,y:0}),normal={x:-along.y,y:along.x},half=4/zoom,inset=Math.min(half,Math.hypot(b.x-a.x,b.y-a.y)/2),from={x:a.x+along.x*inset,y:a.y+along.y*inset},to={x:b.x-along.x*inset,y:b.y-along.y*inset};return [[from,1],[to,1],[to,-1],[from,-1]].map(([p,side])=>{const q=p as Point,s=side as number;return (q.x+normal.x*half*s)+','+(q.y+normal.y*half*s);}).join(' ');}
