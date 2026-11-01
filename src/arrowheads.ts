import type {DesignNode,VectorPoint} from './model';
export const arrowheadStyles=['none','open','triangle','diamond','circle','bar'] as const;
export type ArrowheadStyle=typeof arrowheadStyles[number];
export const arrowStyle=(n:DesignNode,end:'start'|'end'):ArrowheadStyle=>end==='start'?n.arrowStart??'none':n.arrowEnd??(n.type==='arrow'?'open':'none');
export function validateArrowheads(n:{arrowStart?:unknown;arrowEnd?:unknown;arrowSize?:unknown}){for(const key of ['arrowStart','arrowEnd'] as const)if(n[key]!==undefined&&!arrowheadStyles.includes(n[key] as ArrowheadStyle))throw Error('Invalid arrowhead style.');if(n.arrowSize!==undefined&&(typeof n.arrowSize!=='number'||!Number.isFinite(n.arrowSize)||n.arrowSize<1||n.arrowSize>1000))throw Error('Arrowhead size must be between 1 and 1,000.');}
export function validateDocumentArrowheads(document:{pages?:unknown}){if(!Array.isArray(document.pages))return;for(const page of document.pages)if(Array.isArray(page?.nodes))for(const n of page.nodes){validateArrowheads(n);if(Array.isArray(n?.contours))for(const c of n.contours)if(c&&typeof c==='object')validateArrowheads(c);}}
export interface ArrowTip {x:number;y:number;angle:number;}
const openContours=(n:DesignNode)=>n.type==='path'?(n.contours??[]).filter(c=>!c.closed&&c.points.length>1):[];
function tipsOf(n:DesignNode,ps:VectorPoint[]):{start:ArrowTip;end:ArrowTip}{
 const sx=n.type==='path'||n.points.length>1?n.width/(n.pathWidth||n.width||1):1,sy=n.type==='path'||n.points.length>1?n.height/(n.pathHeight||n.height||1):1;
 const first=ps[0],last=ps.at(-1)!,firstNext=ps.find((p,i)=>i>0&&Math.hypot((p.x-first.x)*sx,(p.y-first.y)*sy)>1e-8);let lastPrevious:VectorPoint|undefined;for(let i=ps.length-2;i>=0;i--)if(Math.hypot((ps[i].x-last.x)*sx,(ps[i].y-last.y)*sy)>1e-8){lastPrevious=ps[i];break;}
 const direction=(p:VectorPoint,h:VectorPoint['in'],fallback:VectorPoint|undefined,reverse=false)=>{const hx=(h?.x??0)*sx,hy=(h?.y??0)*sy;if(Math.hypot(hx,hy)>1e-8)return Math.atan2(-hy,-hx);if(fallback)return Math.atan2((p.y-fallback.y)*sy,(p.x-fallback.x)*sx);return reverse?Math.PI:0;};
 return {start:{x:first.x*sx,y:first.y*sy,angle:direction(first,first.out,firstNext,true)},end:{x:last.x*sx,y:last.y*sy,angle:direction(last,last.in,lastPrevious)}};
}
export function arrowTips(n:DesignNode):{start:ArrowTip;end:ArrowTip}|undefined{
 const contour=openContours(n)[0];if(!['line','arrow'].includes(n.type)&&!contour)return;
 return tipsOf(n,contour?.points??(n.points.length>1?n.points:[{x:0,y:0},{x:n.width,y:n.height}]));
}
export interface ArrowHead {key:string;end:'start'|'end';style:ArrowheadStyle;size:number;tip:ArrowTip;}
/** Every head a layer draws, in stacking order. The first open path takes the layer's settings, and later ones their own. */
export function arrowHeads(n:DesignNode):ArrowHead[]{
 const out:ArrowHead[]=[],tips=arrowTips(n);if(!tips)return out;
 for(const end of ['start','end'] as const){const style=arrowStyle(n,end);if(style!=='none')out.push({key:end,end,style,size:n.arrowSize??12,tip:tips[end]});}
 openContours(n).slice(1).forEach((contour,index)=>{if(!contour.arrowStart&&!contour.arrowEnd)return;const own=tipsOf(n,contour.points);for(const end of ['start','end'] as const){const style=end==='start'?contour.arrowStart:contour.arrowEnd;if(style&&style!=='none')out.push({key:end+(index+1),end,style,size:contour.arrowSize??n.arrowSize??12,tip:own[end]});}});
 return out;
}
export const hasArrowheads=(n:DesignNode)=>arrowStyle(n,'start')!=='none'||arrowStyle(n,'end')!=='none'||openContours(n).slice(1).some(c=>c.arrowStart&&c.arrowStart!=='none'||c.arrowEnd&&c.arrowEnd!=='none');
export function arrowheadPath(style:ArrowheadStyle,size:number){switch(style){case 'open':return `M${-size} ${-size/2}L0 0L${-size} ${size/2}`;case 'triangle':return `M0 0L${-size} ${-size/2}L${-size} ${size/2}Z`;case 'diamond':return `M0 0L${-size/2} ${-size/2}L${-size} 0L${-size/2} ${size/2}Z`;case 'circle':return `M${-size} 0A${size/2} ${size/2} 0 1 0 0 0A${size/2} ${size/2} 0 1 0 ${-size} 0Z`;case 'bar':return `M0 ${-size/2}L0 ${size/2}`;default:return '';}}
/** Conservative local painted bounds include the inherited stroke around open/bar heads. */
export function arrowheadBoxes(n:DesignNode,strokeWidth:number){if(!strokeWidth)return [];const result:{x:number;y:number;width:number;height:number}[]=[];for(const {style,size,tip} of arrowHeads(n)){const pad=style==='open'||style==='bar'?strokeWidth*1.5:0,depth=style==='bar'?0:size,cos=Math.cos(tip.angle),sin=Math.sin(tip.angle),points=[[-depth-pad,-size/2-pad],[pad,-size/2-pad],[pad,size/2+pad],[-depth-pad,size/2+pad]].map(([x,y])=>({x:tip.x+x*cos-y*sin,y:tip.y+x*sin+y*cos})),x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));result.push({x,y,width:Math.max(...points.map(p=>p.x))-x,height:Math.max(...points.map(p=>p.y))-y});}return result;}
/** Emit in the layer coordinate space so every head shares stroke gradient/image coordinates. */
export function orientedArrowheadPath(style:ArrowheadStyle,size:number,tip:ArrowTip){const c=Math.cos(tip.angle),s=Math.sin(tip.angle),at=(x:number,y:number)=>`${tip.x+x*c-y*s} ${tip.y+x*s+y*c}`,line=(points:number[][],closed=false)=>'M'+points.map(([x,y])=>at(x,y)).join('L')+(closed?'Z':'');switch(style){case 'open':return line([[-size,-size/2],[0,0],[-size,size/2]]);case 'triangle':return line([[0,0],[-size,-size/2],[-size,size/2]],true);case 'diamond':return line([[0,0],[-size/2,-size/2],[-size,0],[-size/2,size/2]],true);case 'bar':return line([[0,-size/2],[0,size/2]]);case 'circle':{const x=tip.x-size/2*c,y=tip.y-size/2*s;return `M${x-size/2} ${y}A${size/2} ${size/2} 0 1 0 ${x+size/2} ${y}A${size/2} ${size/2} 0 1 0 ${x-size/2} ${y}Z`;}default:return '';}}
