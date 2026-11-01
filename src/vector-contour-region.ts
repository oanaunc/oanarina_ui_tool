import paper from 'paper/dist/paper-core.js';
import type {DesignNode} from './model';
import {contourPath} from './geometry';
import {fillsFor} from './paints';
import {canvasPointInNode} from './canvas-geometry';

const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
/** The filled region of a path under a canvas point, as the anchor keys that move it: the innermost closed contour holding the point, with any holes it surrounds. A point over a hole is outside every region. */
export function contourRegionAt(n:DesignNode,nodes:DesignNode[],p:{x:number;y:number}):string[]|null{if(n.type!=='path'||!n.contours?.length||!fillsFor(n).some(v=>v.visible&&v.opacity>0))return null;const local=canvasPointInNode(n,nodes,p),at=new scope.Point(local.x*(n.pathWidth||n.width||1)/(n.width||1),local.y*(n.pathHeight||n.height||1)/(n.height||1));scope.activate();const shapes=n.contours.flatMap((c,index)=>{if(!c.closed||c.points.length<3)return [];const item=scope.PathItem.create(contourPath(c.points,true));item.remove();return [{index,item,area:Math.abs((item as paper.Path).area)}];}),whole=scope.PathItem.create(n.contours.filter(c=>c.closed).map(c=>contourPath(c.points,true)).join(' ')||'M0 0');whole.remove();whole.fillRule=n.fillRule??'nonzero';if(!whole.contains(at))return null;const around=shapes.filter(s=>s.item.contains(at)).sort((a,b)=>a.area-b.area)[0];if(!around)return null;const holes=shapes.filter(s=>s.index!==around.index&&s.area<around.area&&around.item.contains(s.item.interiorPoint)&&!whole.contains(s.item.interiorPoint));return [around,...holes].flatMap(s=>n.contours![s.index].points.map((_,i)=>`${s.index}:${i}`));}
