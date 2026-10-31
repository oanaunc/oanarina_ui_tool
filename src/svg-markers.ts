import {cubicContours} from './geometry';
export interface SvgMarkerSpot {kind:'start'|'mid'|'end';x:number;y:number;angle:number;}
type Vector={x:number;y:number};
const toward=(a:Vector,b:Vector):Vector|undefined=>{const x=b.x-a.x,y=b.y-a.y;return Math.hypot(x,y)>1e-9?{x,y}:undefined;};
const degrees=(v:Vector)=>Math.atan2(v.y,v.x)*180/Math.PI;
/** SVG's auto orientation: the bisector of the direction in and the direction out. */
function bisect(into:Vector|undefined,out:Vector|undefined){const a=into??out,b=out??into;if(!a||!b)return 0;const la=Math.hypot(a.x,a.y),lb=Math.hypot(b.x,b.y),sum={x:a.x/la+b.x/lb,y:a.y/la+b.y/lb};return Math.hypot(sum.x,sum.y)>1e-9?degrees(sum):degrees(a)+90;}
const MARKER_SPOT_LIMIT=20_000;
/** Each vertex of a path with its marker kind and direction. The first vertex of the whole path is start and the last is end. */
export function svgMarkerSpots(data:string):SvgMarkerSpot[]{
 const spots:SvgMarkerSpot[]=[],contours=cubicContours(data);
 contours.forEach(contour=>{
  const nodes=[contour.start,...contour.curves.map(c=>c.to)],leaving=contour.curves.map((c,i)=>toward(nodes[i],c.c1)??toward(nodes[i],c.c2)??toward(nodes[i],c.to)),arriving=contour.curves.map((c,i)=>toward(c.c2,c.to)??toward(c.c1,c.to)??toward(nodes[i],c.to)),last=contour.curves.length;
  nodes.forEach((p,i)=>{const into=i>0?arriving[i-1]:contour.closed?arriving[last-1]:undefined,out=i<last?leaving[i]:contour.closed?leaving[0]:undefined;spots.push({kind:'mid',x:p.x,y:p.y,angle:bisect(into,out)});if(spots.length>MARKER_SPOT_LIMIT)throw Error('This path has too many marker positions.');});
 });
 if(spots.length){spots[0].kind='start';spots[spots.length-1].kind='end';}return spots;
}
