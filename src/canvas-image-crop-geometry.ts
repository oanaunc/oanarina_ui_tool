import type {DesignNode} from './model';
import type {Paint} from './paints';
import {validatePaint} from './paints';
import {imageCropPatch} from './image-paint';
import {inverseMatrix,point,worldMatrix} from './transforms';
import {layerPaintBox} from './paint-box';
export type CropCorner='nw'|'ne'|'se'|'sw';
export type CanvasCropKind='pan'|'scale'|`window:${CropCorner}`;
export function validateCanvasCropGeometry(n:DesignNode,p:Paint,nodes:DesignNode[],box=layerPaintBox(n)){
 if(n.media)throw Error('Video layers paint their poster, so it has no crop handles here.');
 if(![n.width,n.height].every(v=>Number.isFinite(v)&&v>0&&v<=1e6)||![box.x,box.y,box.width,box.height].every(Number.isFinite)||!(box.width>0&&box.height>0))throw Error('Images map to the drawn shape, and this one has no area. Give it width and height first.');
 validatePaint(p);if(p.type!=='image'||!p.image||!p.visible||p.opacity<=0)throw Error('Choose a visible embedded image fill.');
 if(!Number.isFinite(p.angle)||Math.abs(p.angle)>3600||![p.offsetX??0,p.offsetY??0].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6)||(p.scale??1)<.01||(p.scale??1)>10)throw Error('Canvas crop supports scale 1–1,000%, offsets within ±1,000,000 and angles within ±3,600°.');
 const m=worldMatrix(n,nodes);inverseMatrix(m);if(m.some(v=>!Number.isFinite(v))||[[0,0],[n.width,0],[0,n.height],[n.width,n.height]].some(([x,y])=>{const p=point(m,x,y);return !Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e9||Math.abs(p.y)>1e9;}))throw Error('This crop hierarchy exceeds finite canvas bounds. Reduce its transform first.');
}
/** The size scale 1 gives the image element: the layer, or one source-sized tile. */
const baseSize=(n:Pick<DesignNode,'width'|'height'>,p:Paint)=>p.scaleMode==='tile'?{width:p.imageWidth??n.width,height:p.imageHeight??n.height}:{width:n.width,height:n.height};
/** Fill keeps its first placement until moved, when it becomes Crop. Fit, Stretch and Tile keep their mode. */
export const cropKeepsMode=(p:Paint)=>!!p.scaleMode&&p.scaleMode!=='fill'&&p.scaleMode!=='crop';
export function canvasCropPatch(n:DesignNode,p:Paint,nodes:DesignNode[],dx:number,dy:number,kind:CanvasCropKind,box=layerPaintBox(n)):Partial<Paint>{
 validateCanvasCropGeometry(n,p,nodes,box);if(![dx,dy].every(Number.isFinite)||kind!=='pan'&&kind!=='scale')throw Error('Invalid canvas crop movement.');const m=inverseMatrix(worldMatrix(n,nodes)),localX=m[0]*dx+m[2]*dy,localY=m[1]*dx+m[3]*dy,tile=p.scaleMode==='tile',x=tile?localX:localX*n.width/box.width,y=tile?localY:localY*n.height/box.height,scaleMode=cropKeepsMode(p)?{}:{scaleMode:'crop' as const};
 if(kind==='pan'){const {scaleMode:_,...moved}=imageCropPatch(p,n.width,x,y,'pan');return {...scaleMode,...moved};}
 const a=p.angle*Math.PI/180,px=x*Math.cos(a)+y*Math.sin(a),py=-x*Math.sin(a)+y*Math.cos(a),{width,height}=baseSize(n,p),delta=(px*width+py*height)/(width*width+height*height);
 return {...scaleMode,scale:Math.max(.01,Math.min(10,(p.scale??1)+delta))};
}
/** The image element's corners, in layer-local axes. A tile shows its first repeat. */
export function canvasCropSourceCorners(n:Pick<DesignNode,'width'|'height'>,p:Paint,box=layerPaintBox(n)){const a=p.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),scale=p.scale??1,{width,height}=baseSize(n,p),ox=p.offsetX??0,oy=p.offsetY??0;if(p.scaleMode==='tile')return [[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>{const px=ox+width*scale*x,py=oy+height*scale*y;return {x:c*px-s*py,y:s*px+c*py};});const cx=n.width/2,cy=n.height/2;return [[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>{const px=ox+width*scale*x-cx,py=oy+height*scale*y-cy;return {x:box.x+(cx+c*px-s*py)*box.width/n.width,y:box.y+(cy+s*px+c*py)*box.height/n.height};});}
/** Why the crop window itself cannot move: resizing must keep the picture still, which needs the source size and a plain box. */
export function cropWindowIssue(n:DesignNode,p:Paint,nodes:DesignNode[]){if(!['rectangle','image'].includes(n.type))return 'Resize the crop window on rectangles and image layers.';if(nodes.some(c=>c.parentId===n.id))return 'Crop windows resize on layers without children.';const parent=nodes.find(c=>c.id===n.parentId);if(parent&&parent.layout&&parent.layout!=='none')return 'This layer is placed by auto layout, so its crop window follows its parent.';if(n.flipX||n.flipY||(n.motionScaleX??1)!==1||(n.motionScaleY??1)!==1)return 'Remove flips before resizing the crop window.';if(p.scaleMode&&p.scaleMode!=='fill'&&p.scaleMode!=='crop')return 'Resize the crop window in Fill or Crop mode.';if(!((p.imageWidth??0)>0&&(p.imageHeight??0)>0))return 'Choose the image again so its size is known, then resize the crop window.';return '';}
export interface CropWindowPatch {node:Pick<DesignNode,'x'|'y'|'width'|'height'>;paint:Pick<Paint,'scaleMode'|'scale'|'offsetX'|'offsetY'>;}
/** Moves one window corner and leaves the picture exactly where it is. A slice-fit image's size follows the element's longer ratio, so one scale is enough. Null holds the last valid draft. */
export function cropWindowPatch(n:DesignNode,p:Paint,nodes:DesignNode[],corner:CropCorner,dx:number,dy:number):CropWindowPatch|null{
 const issue=cropWindowIssue(n,p,nodes);if(issue)throw Error(issue);validateCanvasCropGeometry(n,p,nodes);if(![dx,dy].every(Number.isFinite))throw Error('Invalid crop window movement.');
 const inverse=inverseMatrix(worldMatrix(n,nodes)),x=inverse[0]*dx+inverse[2]*dy,y=inverse[1]*dx+inverse[3]*dy,left=corner.endsWith('w')?x:0,right=n.width+(corner.endsWith('e')?x:0),top=corner.startsWith('n')?y:0,bottom=n.height+(corner.startsWith('s')?y:0),width=right-left,height=bottom-top;if(width<1||height<1)return null;
 const iw=p.imageWidth!,ih=p.imageHeight!,scale=p.scale??1,fitted=Math.max(n.width*scale/iw,n.height*scale/ih),nextScale=fitted/Math.max(width/iw,height/ih);if(nextScale<.01||nextScale>10)return null;
 const a=p.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),turn=(v:{x:number;y:number},sign:number)=>({x:c*v.x-sign*s*v.y,y:sign*s*v.x+c*v.y}),before={x:n.width/2,y:n.height/2},after={x:left+width/2,y:top+height/2},element={x:(p.offsetX??0)+n.width*scale/2-before.x,y:(p.offsetY??0)+n.height*scale/2-before.y},spun=turn(element,1),picture={x:before.x+spun.x,y:before.y+spun.y},back=turn({x:picture.x-after.x,y:picture.y-after.y},-1);
 const r=n.rotation*Math.PI/180,mx=after.x-before.x,my=after.y-before.y,cx=n.x+before.x+mx*Math.cos(r)-my*Math.sin(r),cy=n.y+before.y+mx*Math.sin(r)+my*Math.cos(r);
 return {node:{x:cx-width/2,y:cy-height/2,width,height},paint:{scaleMode:'crop',scale:nextScale,offsetX:back.x+width/2-width*nextScale/2,offsetY:back.y+height/2-height*nextScale/2}};
}
