import {roundedPolygonPath} from './basic-shapes';
import paper from 'paper/dist/paper-core.js';
import {bounds,descendants} from './model';
import type {DesignNode,VectorPoint,VectorContour} from './model';
const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
const number=(v:number)=>Math.round(v*100000)/100000;
export function cornerPath(w:number,h:number,radii:number[]){
 const max=Math.min(w,h)/2,[tl,tr,br,bl]=radii.map(r=>Math.max(0,Math.min(max,r)));
 return `M${tl} 0H${w-tr}A${tr} ${tr} 0 0 1 ${w} ${tr}V${h-br}A${br} ${br} 0 0 1 ${w-br} ${h}H${bl}A${bl} ${bl} 0 0 1 0 ${h-bl}V${tl}A${tl} ${tl} 0 0 1 ${tl} 0Z`;
}
export function ellipsePath(n:DesignNode){
 const rx=n.width/2,ry=n.height/2,start=(n.arcStart??0)*Math.PI/180,sweep=Math.max(-360,Math.min(360,n.arcSweep??360)),inner=Math.max(0,Math.min(.999,n.arcInner??0)),direction=sweep>=0?1:0;
 const p=(a:number,r=1)=>`${number(rx+Math.cos(a)*rx*r)} ${number(ry+Math.sin(a)*ry*r)}`;
 const arc=(from:number,to:number,r:number,dir:number)=>`A${rx*r} ${ry*r} 0 ${Math.abs(to-from)>Math.PI?1:0} ${dir} ${p(to,r)}`;
 const end=start+sweep*Math.PI/180;
 if(Math.abs(sweep)>=359.999){let d=`M${p(start)}${arc(start,start+Math.PI,1,1)}${arc(start+Math.PI,start+2*Math.PI,1,1)}Z`;if(inner)d+=`M${p(start,inner)}${arc(start,start-Math.PI,inner,0)}${arc(start-Math.PI,start-2*Math.PI,inner,0)}Z`;return d;}
 let d=`M${p(start)}${arc(start,end,1,direction)}`;if(inner)d+=`L${p(end,inner)}${arc(end,start,inner,1-direction)}Z`;else d+=`L${rx} ${ry}Z`;return d;
}
export function shapePoints(n:DesignNode):{x:number;y:number}[]{const star=n.type==='star',count=Math.max(3,Math.min(100,Math.round(n.pointCount??(star?5:6))))*(star?2:1);return Array.from({length:count},(_,i)=>{const a=i*Math.PI*2/count-Math.PI/2,r=star&&i%2?Math.max(.01,Math.min(.99,n.innerRadius??.43)):1;return {x:n.width/2+Math.cos(a)*n.width/2*r,y:n.height/2+Math.sin(a)*n.height/2*r};});}
export function contourPath(points:VectorPoint[],closed=false){
 if(!points.length)return '';const at=(p:{x:number;y:number})=>`${number(p.x)} ${number(p.y)}`;let d='M'+at(points[0]);
 for(let i=1;i<points.length+(closed?1:0);i++){const a=points[(i-1)%points.length],b=points[i%points.length];if(a.out||b.in)d+=`C${at({x:a.x+(a.out?.x??0),y:a.y+(a.out?.y??0)})} ${at({x:b.x+(b.in?.x??0),y:b.y+(b.in?.y??0)})} ${at(b)}`;else d+='L'+at(b);}
 return d+(closed?'Z':'');
}
export function localPath(n:DesignNode):string {
 if(n.type==='path')return n.contours!==undefined?n.contours.map(c=>contourPath(c.points,c.closed)).join(' '):n.points.length?contourPath(n.points,n.closed):n.path;
 if(n.type==='ellipse')return ellipsePath(n);
 if(n.type==='polygon'||n.type==='star')return n.radius>0?roundedPolygonPath(shapePoints(n),n.radius):contourPath(shapePoints(n),true);
 if(n.type==='line'||n.type==='arrow')return n.points.length?contourPath(n.points,false):`M0 0L${n.width} ${n.height}`;
 return cornerPath(n.width,n.height,n.corners??[n.radius,n.radius,n.radius,n.radius]);
}
export function geometry(n:DesignNode):paper.PathItem {
 if(['text','image','slice'].includes(n.type))throw Error('Convert text to outlines or select vector shapes for this operation.');
 scope.activate();const p=scope.PathItem.create(localPath(n)||'M0 0');p.remove();p.fillRule=n.fillRule??(n.type==='ellipse'?'evenodd':'nonzero');
 if(n.type==='path'||['line','arrow'].includes(n.type)&&n.points.length>1){p.scale(n.width/(n.pathWidth||n.width||1),n.height/(n.pathHeight||n.height||1),new scope.Point(0,0));}
 if(n.flipX||n.flipY||n.motionScaleX!==undefined||n.motionScaleY!==undefined)p.scale((n.flipX?-1:1)*(n.motionScaleX??1),(n.flipY?-1:1)*(n.motionScaleY??1),new scope.Point(n.width/2,n.height/2));
 p.translate(new scope.Point(n.x,n.y));if(n.rotation)p.rotate(n.rotation,new scope.Point(n.x+n.width/2,n.y+n.height/2));return p;
}
export function pathProperties(p:paper.PathItem):Partial<DesignNode>{const b=p.bounds,x=b.x,y=b.y,width=Math.max(.001,b.width),height=Math.max(.001,b.height);p.translate(new scope.Point(-x,-y));return {type:'path',x,y,width,height,pathWidth:width,pathHeight:height,path:p.pathData,points:[],contours:undefined,closed:undefined,rotation:0,flipX:false,flipY:false,motionScaleX:undefined,motionScaleY:undefined};}
export function combineGeometry(nodes:DesignNode[],op:'union'|'subtract'|'intersect'|'exclude'){
 if(!nodes.length)throw Error('Select vector shapes.');let result=geometry(nodes[0]);
 for(const n of nodes.slice(1)){const other=geometry(n);const previous=result;result=op==='union'?result.unite(other,{insert:false}):op==='subtract'?result.subtract(other,{insert:false}):op==='intersect'?result.intersect(other,{insert:false}):result.exclude(other,{insert:false});previous.remove();other.remove();}
 return result;
}
export function updateBooleans(nodes:DesignNode[]){
 for(const parent of nodes.filter(n=>n.booleanOp).reverse()){
  const children=nodes.filter(n=>n.parentId===parent.id&&n.visible);if(!children.length){parent.path='';continue;}
  const result=combineGeometry(children,parent.booleanOp!);const props=pathProperties(result);Object.assign(parent,props);result.remove();
 }
}
export function geometricArea(n:DesignNode){const p=geometry(n);if(p.fillRule==='evenodd')p.reorient(false);const a=Math.abs((p as paper.Path|paper.CompoundPath).area);p.remove();return a;}
export function pathContours(n:DesignNode):VectorContour[]{scope.activate();const p=scope.PathItem.create(localPath(n)||'M0 0');p.remove();const paths=p instanceof scope.CompoundPath?p.children as paper.Path[]:[p as paper.Path];return paths.map(path=>({closed:path.closed,points:path.segments.map(s=>({x:s.point.x,y:s.point.y,in:{x:s.handleIn.x,y:s.handleIn.y},out:{x:s.handleOut.x,y:s.handleOut.y},mode:'mirrored'}))}));}
export function vectorOperation(n:DesignNode,operation:'smooth'|'simplify'|'reverse'|'close'|'open'|'flatten'){
 const p=geometry(n);if(operation==='smooth')p.smooth({type:'catmull-rom',factor:.5});if(operation==='simplify')p.simplify(1.5);if(operation==='reverse')p.reverse();if(operation==='flatten')p.flatten(.4);
 if(operation==='close'||operation==='open'){if(p instanceof scope.CompoundPath)for(const child of p.children as paper.Path[])child.closed=operation==='close';else (p as paper.Path).closed=operation==='close';}
 const props=pathProperties(p);p.remove();return props;
}
export function flattenGeometry(nodes:DesignNode[],selected:string[]){const ids=descendants(nodes,selected),operands=nodes.filter(n=>{if(!ids.includes(n.id)||['group','frame','section','component','instance'].includes(n.type))return false;let parent=nodes.find(a=>a.id===n.parentId);while(parent){if(parent.booleanOp&&ids.includes(parent.id))return false;parent=nodes.find(a=>a.id===parent!.parentId);}return true;});if(!operands.length)throw Error('Select vector layers.');
 scope.activate();const paths=operands.filter(n=>!n.booleanOp||selected.includes(n.id)).map(n=>geometry(n));const combined=new scope.CompoundPath({insert:false});for(const p of paths){if(p instanceof scope.CompoundPath)for(const child of [...p.children])combined.addChild(child);else combined.addChild(p);}
 const result=pathProperties(combined);combined.remove();return result;
}
export function normalizedRootSelection(nodes:DesignNode[],ids:string[]){return nodes.filter(n=>ids.includes(n.id)&&!ids.some(id=>id!==n.id&&descendants(nodes,[id]).includes(n.id)));}
export function selectionBounds(nodes:DesignNode[]){return bounds(nodes);}

export function insertVectorPoint(n:DesignNode,world:{x:number;y:number}){const p=geometry(n);const location=p.getNearestLocation(new scope.Point(world.x,world.y));if(!location)throw Error('No vector segment found.');location.path.divideAt(location);const props=pathProperties(p);p.remove();const converted={...n,...props};return {...props,contours:pathContours(converted)};}

const scaledPaths=new Map<string,string>();
export function scaledLocalPath(n:DesignNode){const data=localPath(n);if(!['path','line','arrow'].includes(n.type)||(!n.pathWidth&&!n.pathHeight))return data;const sx=n.width/(n.pathWidth||n.width||1),sy=n.height/(n.pathHeight||n.height||1);if(sx===1&&sy===1)return data;const key=data+'@'+sx+':'+sy;if(scaledPaths.has(key))return scaledPaths.get(key)!;scope.activate();const p=scope.PathItem.create(data||'M0 0');p.remove();p.scale(sx,sy,new scope.Point(0,0));const result=p.pathData;p.remove();if(scaledPaths.size>500)scaledPaths.clear();scaledPaths.set(key,result);return result;}
