import type {DesignNode} from './model';
export function constrainedSize(n:DesignNode,width:number,height:number,aspect=false){if(!Number.isFinite(width)||!Number.isFinite(height))throw Error('Invalid layer size.');if(!aspect||n.width<=0||n.height<=0)return {width:Math.max(n.minWidth??1,Math.min(n.maxWidth??1e6,width)),height:Math.max(n.minHeight??1,Math.min(n.maxHeight??1e6,height))};const low=Math.max((n.minWidth??1)/n.width,(n.minHeight??1)/n.height),high=Math.min((n.maxWidth??1e6)/n.width,(n.maxHeight??1e6)/n.height);if(low>high)throw Error('The aspect ratio conflicts with the layer size limits.');const factor=Math.max(low,Math.min(high,width/n.width));return {width:n.width*factor,height:n.height*factor};}
export function constrainAspectPatch(n:DesignNode,p:Partial<DesignNode>):Partial<DesignNode>{
 if(p.aspectLocked===true&&n.type==='text'&&n.textResize&&n.textResize!=='fixed')p={...p,textResize:'fixed'};
 if(!(p.aspectLocked??n.aspectLocked))return p.aspectLocked===false?{...p,layoutAspectRatio:undefined}:p;
 if(p.width!==undefined&&p.height!==undefined)return p.width>0&&p.height>0?{...p,layoutAspectRatio:p.width/p.height}:p;
 if(p.width===undefined&&p.height===undefined)return p.aspectLocked===true&&n.width>0&&n.height>0?{...p,layoutAspectRatio:n.width/n.height}:p;
 const ratio=n.width>0&&n.height>0?n.width/n.height:n.layoutAspectRatio;if(!ratio||!Number.isFinite(ratio))return p;
 const basis={...n,width:ratio,height:1},factor=p.width!==undefined?p.width/ratio:p.height!,next=constrainedSize(basis,ratio*factor,factor,true);
 return {...p,...next,layoutAspectRatio:ratio,sizingX:'fixed',sizingY:'fixed'};
}
