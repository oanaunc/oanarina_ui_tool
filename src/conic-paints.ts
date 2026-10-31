import {sampleGradient} from './paints';
import type {Paint} from './paints';
export const ANGULAR_WEDGE_LIMIT=720;
export interface DiamondQuadrant {points:string;x1:number;y1:number;x2:number;y2:number;}
export interface AngularWedge {points:string;color:string;opacity:number;}
const round=(v:number)=>Math.round(v*1e6)/1e6;
const hex=(v:number)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');
/** Reach of the polygons in normalized box units: past every corner from any center a stored paint can hold. */
const REACH=8;
/** t=(|u|+|v|)/radius is linear inside each rotated quadrant, so four linear gradients reproduce it exactly at any scale. */
export function diamondQuadrants(p:Pick<Paint,'angle'|'cx'|'cy'|'radius'>):DiamondQuadrant[]{const a=p.angle*Math.PI/180,u={x:Math.cos(a),y:Math.sin(a)},v={x:-Math.sin(a),y:Math.cos(a)},radius=Math.max(.001,p.radius),c={x:p.cx,y:p.cy},at=(i:number,j:number)=>({x:c.x+u.x*i+v.x*j,y:c.y+u.y*i+v.y*j});return [[1,1],[-1,1],[-1,-1],[1,-1]].map(([s,t])=>{const corners=[at(0,0),at(s*REACH,0),at(s*REACH,t*REACH),at(0,t*REACH)],end=at(s*radius/2,t*radius/2);return {points:corners.map(q=>round(q.x)+','+round(q.y)).join(' '),x1:round(c.x),y1:round(c.y),x2:round(end.x),y2:round(end.y)};});}
/** Stop positions stay wedge boundaries so hard stops keep their exact angle; each interval gets one wedge per visible color step. */
export function angularWedges(p:Pick<Paint,'angle'|'cx'|'cy'|'stops'>):AngularWedge[]{const positions=[...new Set([0,1,...p.stops.map(s=>Math.max(0,Math.min(1,s.position)))])].sort((a,b)=>a-b),intervals:{from:number;to:number;steps:number}[]=[];for(let i=1;i<positions.length;i++){const from=positions[i-1],to=positions[i],span=to-from,edge=span*.001,a=sampleGradient(p.stops,from+edge),b=sampleGradient(p.stops,to-edge),delta=Math.max(...a.slice(0,3).map((v,c)=>Math.abs(v-b[c])),Math.abs(a[3]-b[3])*255);intervals.push({from,to,steps:Math.max(1,Math.ceil(span*8),Math.min(Math.ceil(delta),Math.ceil(span*ANGULAR_WEDGE_LIMIT)))});}const base=p.angle*Math.PI/180,rim=(t:number)=>{const a=base+t*2*Math.PI;return round(p.cx+Math.cos(a)*REACH)+','+round(p.cy+Math.sin(a)*REACH);};return intervals.flatMap(({from,to,steps})=>Array.from({length:steps},(_,i)=>{const start=from+(to-from)*i/steps,end=from+(to-from)*(i+1)/steps,color=sampleGradient(p.stops,(start+end)/2);return {points:round(p.cx)+','+round(p.cy)+' '+rim(start)+' '+rim(end),color:'#'+color.slice(0,3).map(hex).join(''),opacity:round(color[3])};}));}
