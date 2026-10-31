import type {Paint} from './paints';
import {inverseMatrix,point} from './transforms';
import type {Matrix} from './transforms';
import {LINEAR_GRADIENT_LIMITS} from './linear-gradient';
/** A paint transform maps the layer's unit square into paint space, so handles come from its inverse.
 * Returns false when Forma cannot state the geometry exactly and the caller must report an approximation. */
export function applyFigGradient(p:Paint,m:Matrix):boolean{
 let inverse:Matrix;try{inverse=inverseMatrix(m);}catch{return false;}
 const near=(a:number,b:number)=>Math.abs(a-b)<=1e-5,origin=point(inverse,.5,.5),x=point(inverse,1,.5),y=point(inverse,.5,1),ux={x:x.x-origin.x,y:x.y-origin.y},uy={x:y.x-origin.x,y:y.y-origin.y},rx=Math.hypot(ux.x,ux.y),ry=Math.hypot(uy.x,uy.y),conformal=near(rx,ry)&&Math.abs(ux.x*uy.x+ux.y*uy.y)<=1e-5*Math.max(1e-9,rx*ry);
 if(p.type==='linear'){const start=point(inverse,0,.5),end=x,inside=[start.x,start.y,end.x,end.y].every(v=>Number.isFinite(v)&&Math.abs(v)<=LINEAR_GRADIENT_LIMITS.coordinate),length=Math.hypot(end.x-start.x,end.y-start.y);p.angle=Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI;if(!inside||length<LINEAR_GRADIENT_LIMITS.minLength)return false;p.linearStart=start;p.linearEnd=end;return true;}
 if(![origin.x,origin.y,rx].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e4)||rx<=0)return false;
 p.cx=origin.x;p.cy=origin.y;p.radius=rx;p.angle=Math.atan2(ux.y,ux.x)*180/Math.PI;
 return conformal;
}
/** Crop transforms map the layer into image space: the window size and origin give the placed image directly.
 * Forma crop draws a cover-fitted box scaled by `scale`, so the same placement is stated in those terms. */
export function figImageCrop(m:Matrix,width:number,height:number,imageWidth:number,imageHeight:number):{scale:number;offsetX:number;offsetY:number}|undefined{
 const u=m[0],v=m[3];if(!(u>0)||!(v>0)||Math.abs(m[1])+Math.abs(m[2])>1e-6||!(width>0)||!(height>0))return;
 const placedWidth=width/u,placedHeight=height/v;if(Math.abs(placedWidth/placedHeight-imageWidth/imageHeight)>.005*imageWidth/imageHeight)return;
 const cover=Math.max(width/imageWidth,height/imageHeight),scale=(placedWidth/imageWidth)/cover;if(!Number.isFinite(scale)||scale<.01||scale>1000)return;
 const offsetX=-m[4]*placedWidth-(width*scale-placedWidth)/2,offsetY=-m[5]*placedHeight-(height*scale-placedHeight)/2;return Math.abs(offsetX)<=1e6&&Math.abs(offsetY)<=1e6?{scale,offsetX,offsetY}:undefined;
}
