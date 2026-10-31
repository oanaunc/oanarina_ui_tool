import type {Paint} from './paints';
import type {PaintBox} from './paint-box';
import {linearGradientAngle,linearGradientPoints} from './linear-gradient';

type Matrix=readonly [number,number,number,number,number,number];
const apply=(m:Matrix,x:number,y:number)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
const turn=(x:number,y:number,degrees:number)=>{const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:c*x-s*y,y:s*x+c*y};};
/**
 * A stroke paint keeps its place on the canvas when its shape becomes a filled path with different bounds. Linear gradients and
 * images move exactly under any rotation or uniform box. Reflection and nonuniform scale cannot be written in these paint fields,
 * so radial sizes and image frames follow the width, which is why those cases are named in the outline dialog.
 */
export function outlinedPaint(p:Paint,from:PaintBox,m:Matrix,to:PaintBox):Paint{
 const point=(u:number,v:number)=>{const q=apply(m,from.x+u*from.width,from.y+v*from.height);return {x:(q.x-to.x)/to.width,y:(q.y-to.y)/to.height};},rotation=Math.atan2(m[1],m[0])*180/Math.PI;
 if(p.type==='linear'){const [a,b]=linearGradientPoints(p),next={...p,linearStart:point(a.x,a.y),linearEnd:point(b.x,b.y)};return {...next,angle:linearGradientAngle(next)};}
 if(p.type==='radial'||p.type==='angular'||p.type==='diamond'){const c=point(p.cx,p.cy);return {...p,cx:Math.max(-1,Math.min(2,c.x)),cy:Math.max(-1,Math.min(2,c.y)),radius:Math.max(.01,Math.min(2,p.radius*from.width/to.width)),angle:p.angle+rotation};}
 if(p.type!=='image')return p;
 const angle=p.angle+rotation,ox=p.offsetX??0,oy=p.offsetY??0,scale=p.scale??1;
 if(p.surface){const q=apply(m,ox,oy);return {...p,angle,offsetX:q.x-to.x,offsetY:q.y-to.y};}
 if(p.scaleMode==='tile'){const origin=turn(ox,oy,p.angle),q=apply(m,origin.x,origin.y),back=turn(q.x-to.x,q.y-to.y,-angle);return {...p,angle,offsetX:back.x,offsetY:back.y};}
 const w=from.width,h=from.height,iw=p.imageWidth,ih=p.imageHeight,elementW=w*scale,elementH=h*scale,picture=iw&&ih?Math.max(elementW/iw,elementH/ih):0,nextScale=Math.max(.01,Math.min(10,picture?picture/Math.max(to.width/iw!,to.height/ih!):scale*w/to.width)),offset=turn(ox+w*scale/2-w/2,oy+h*scale/2-h/2,p.angle),center=apply(m,from.x+w/2+offset.x,from.y+h/2+offset.y),back=turn(center.x-(to.x+to.width/2),center.y-(to.y+to.height/2),-angle);
 return {...p,angle,scaleMode:!p.scaleMode||p.scaleMode==='fill'?'crop':p.scaleMode,scale:nextScale,offsetX:back.x+to.width/2-to.width*nextScale/2,offsetY:back.y+to.height/2-to.height*nextScale/2};
}
