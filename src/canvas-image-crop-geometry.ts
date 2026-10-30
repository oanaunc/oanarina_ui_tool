import type {DesignNode} from './model';
import type {Paint} from './paints';
import {validatePaint} from './paints';
import {imageCropPatch} from './image-paint';
import {inverseMatrix,point,worldMatrix} from './transforms';
export type CanvasCropKind='pan'|'scale';
/** These shapes have the same full paint bounding box as their stored layer rectangle. */
export function validateCanvasCropGeometry(n:DesignNode,p:Paint,nodes:DesignNode[]){
 if(!['image','rectangle','frame','group','component','section','ellipse'].includes(n.type)||n.type==='ellipse'&&Math.abs(n.arcSweep??360)<359.999||n.booleanOp||n.media)throw Error('Canvas crop supports rectangular image/shape/container fills and complete ellipses. Use the inspector preview for text, paths or partial arcs.');
 if(![n.width,n.height].every(v=>Number.isFinite(v)&&v>0&&v<=1e6))throw Error('Restore positive layer dimensions before cropping.');
 validatePaint(p);if(p.type!=='image'||!p.image||!p.visible||p.opacity<=0)throw Error('Choose a visible embedded image fill.');
 if(p.scaleMode&&p.scaleMode!=='fill'&&p.scaleMode!=='crop')throw Error('Choose Fill or Crop image mode before cropping on canvas. Fit, Tile and Stretch remain available in the inspector.');
 if(!Number.isFinite(p.angle)||Math.abs(p.angle)>3600||![p.offsetX??0,p.offsetY??0].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6)||(p.scale??1)<.01||(p.scale??1)>10)throw Error('Canvas crop supports scale 1–1,000%, offsets within ±1,000,000 and angles within ±3,600°.');
 const m=worldMatrix(n,nodes);inverseMatrix(m);if(m.some(v=>!Number.isFinite(v))||[[0,0],[n.width,0],[0,n.height],[n.width,n.height]].some(([x,y])=>{const p=point(m,x,y);return !Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e9||Math.abs(p.y)>1e9;}))throw Error('This crop hierarchy exceeds finite canvas bounds. Reduce its transform first.');
}
export function canvasCropPatch(n:DesignNode,p:Paint,nodes:DesignNode[],dx:number,dy:number,kind:CanvasCropKind):Partial<Paint>{
 validateCanvasCropGeometry(n,p,nodes);if(![dx,dy].every(Number.isFinite)||!['pan','scale'].includes(kind))throw Error('Invalid canvas crop movement.');const m=inverseMatrix(worldMatrix(n,nodes)),x=m[0]*dx+m[2]*dy,y=m[1]*dx+m[3]*dy;
 if(kind==='pan')return imageCropPatch(p,n.width,x,y,'pan');
 const a=p.angle*Math.PI/180,px=x*Math.cos(a)+y*Math.sin(a),py=-x*Math.sin(a)+y*Math.cos(a),delta=(px*n.width+py*n.height)/(n.width*n.width+n.height*n.height);
 return {scaleMode:'crop',scale:Math.max(.01,Math.min(10,(p.scale??1)+delta))};
}
/** The image element's corner after its own saved rotation, in layer-local axes. */
export function canvasCropSourceCorners(n:Pick<DesignNode,'width'|'height'>,p:Paint){const a=p.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),cx=n.width/2,cy=n.height/2;return [[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>{const px=(p.offsetX??0)+n.width*(p.scale??1)*x-cx,py=(p.offsetY??0)+n.height*(p.scale??1)*y-cy;return {x:cx+c*px-s*py,y:cy+s*px+c*py};});}
