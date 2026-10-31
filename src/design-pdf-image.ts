import type {DesignNode} from './model';
import type {Paint} from './paints';
import type {PathContour} from './geometry';
import type {Matrix} from './transforms';
export interface PdfImagePlan {data:string;fit:'cover'|'contain'|'stretch';rect:{x:number;y:number;width:number;height:number};transform:Matrix;}
/** Same placement as imagePaintGeometry: a box scaled and offset inside the layer, turned about the layer center. */
export function planPdfImage(p:Paint,n:DesignNode):PdfImagePlan{const scale=p.scale??1,radians=(p.angle||0)*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians),cx=n.width/2,cy=n.height/2;return {data:p.image!,fit:p.scaleMode==='stretch'?'stretch':p.scaleMode==='fit'?'contain':'cover',rect:{x:p.offsetX??0,y:p.offsetY??0,width:n.width*scale,height:n.height*scale},transform:[c,s,-s,c,cx-c*cx+s*cy,cy-s*cx-c*cy]};}
const rectangle=(x:number,y:number,w:number,h:number):PathContour=>{const line=(a:{x:number;y:number},b:{x:number;y:number})=>({c1:a,c2:b,to:b});const p=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];return {start:p[0],closed:true,curves:[line(p[0],p[1]),line(p[1],p[2]),line(p[2],p[3]),line(p[3],p[0])]} as PathContour;};
/** The box clips a cover crop the way an SVG slice does; the picture rectangle is where the whole image lands. */
export function imageRectangles(plan:Pick<PdfImagePlan,'fit'|'rect'>,imageWidth:number,imageHeight:number){const {rect,fit}=plan,factor=fit==='stretch'?1:fit==='contain'?Math.min(rect.width/imageWidth,rect.height/imageHeight):Math.max(rect.width/imageWidth,rect.height/imageHeight),width=fit==='stretch'?rect.width:imageWidth*factor,height=fit==='stretch'?rect.height:imageHeight*factor;return {box:[rectangle(rect.x,rect.y,rect.width,rect.height)],picture:{x:rect.x+(rect.width-width)/2,y:rect.y+(rect.height-height)/2,width,height}};}
