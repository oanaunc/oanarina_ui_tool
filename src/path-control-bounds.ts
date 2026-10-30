import {variableWidthBounds} from './variable-width';
import type {DesignNode} from './model';

/** A cubic lies inside its control hull. This conservative box keeps out-of-frame point edits in artwork exports. */
export function pathControlBounds(n:DesignNode){
 if(n.type!=='path'||!n.contours)return null;
 const width=variableWidthBounds(n);if(width)return width;
 const sx=n.width/(n.pathWidth||n.width||1),sy=n.height/(n.pathHeight||n.height||1);let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 const add=(x:number,y:number)=>{x*=sx;y*=sy;if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('The vector export bounds are not finite.');minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);};
 for(const c of n.contours){for(let i=0;i<c.points.length;i++){const p=c.points[i];add(p.x,p.y);if(p.in&&(i>0||c.closed))add(p.x+p.in.x,p.y+p.in.y);if(p.out&&(i<c.points.length-1||c.closed))add(p.x+p.out.x,p.y+p.out.y);}}
 return minX===Infinity?null:{x:minX,y:minY,width:maxX-minX,height:maxY-minY};
}
