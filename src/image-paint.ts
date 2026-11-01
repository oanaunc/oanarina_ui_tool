import type {Paint} from './paints';
/** Optional fields keep version-1 and version-2 paint stacks readable. */
export const imageAdjustmentKeys=['exposure','contrast','saturation','temperature','tint','highlights','shadows'] as const;
export type ImageAdjustment=typeof imageAdjustmentKeys[number];
export type ImageAdjustments=Partial<Record<ImageAdjustment,number>>;
export function validateImageAdjustments(value:ImageAdjustments){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([key,v])=>!imageAdjustmentKeys.includes(key as ImageAdjustment)||typeof v!=='number'||!Number.isFinite(v)||v< -1||v>1))throw Error('Image adjustments must be numbers between −1 and 1.');
}
export function imageHasAdjustments(p:Pick<Paint,'adjustments'>){return imageAdjustmentKeys.some(key=>(p.adjustments?.[key]??0)!==0);}
/** Tone transfer in sRGB. Exposure spans ±2 stops; shadow/highlight weights taper into the midtones. */
export function imageToneTable(adjustments:ImageAdjustments={}){
 validateImageAdjustments(adjustments);const gain=2**((adjustments.exposure??0)*2),contrast=2**((adjustments.contrast??0)*2);
 return Array.from({length:257},(_,i)=>{const v=i/256,shadow=(1-v)**3,highlight=v**3;const lifted=v+(adjustments.shadows??0)*shadow*.25+(adjustments.highlights??0)*highlight*.25;return Math.min(1,Math.max(0,(lifted*gain-.5)*contrast+.5));});
}
export function imageChannelOffsets(adjustments:ImageAdjustments={}){
 validateImageAdjustments(adjustments);const t=(adjustments.temperature??0)*.12,g=(adjustments.tint??0)*.1;return [t+g/2,-g,-t+g/2] as const;
}
/** A saved crop no box and scale can state: where the image's unit square lands in the layer's unit box, as [a,b,c,d,e,f]. It stretches, turns and shears freely, and it follows the layer when resized. */
export type ImageMatrix=[number,number,number,number,number,number];
export function validateImageMatrix(m:unknown){if(m===undefined)return;if(!Array.isArray(m)||m.length!==6||m.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e6)||Math.abs(m[0]*m[3]-m[1]*m[2])<1e-12)throw Error('Invalid image transform.');}
export const imageMatrixInUse=(p:Paint)=>p.scaleMode==='crop'?p.imageMatrix:undefined;
export function imagePaintGeometry(p:Paint,width:number,height:number){
 const m=imageMatrixInUse(p);if(m)return {tile:false,width:1,height:1,x:0,y:0,patternWidth:1,patternHeight:1,viewBox:`0 0 ${width} ${height}`,aspect:'none',transform:`matrix(${m[0]*width} ${m[1]*height} ${m[2]*width} ${m[3]*height} ${m[4]*width} ${m[5]*height})`,patternTransform:undefined};
 const scale=p.scale??1,tile=p.scaleMode==='tile',w=(p.imageWidth??width)*scale,h=(p.imageHeight??height)*scale;
 return {tile,width:tile?w:width*scale,height:tile?h:height*scale,x:tile?0:p.offsetX??0,y:tile?0:p.offsetY??0,patternWidth:tile?w:1,patternHeight:tile?h:1,viewBox:tile?`0 0 ${w} ${h}`:`0 0 ${width} ${height}`,aspect:p.scaleMode==='stretch'?'none':p.scaleMode==='fit'?'xMidYMid meet':'xMidYMid slice',transform:tile?undefined:`rotate(${p.angle} ${width/2} ${height/2})`,patternTransform:tile?`rotate(${p.angle}) translate(${p.offsetX??0} ${p.offsetY??0})`:undefined};
}
export function resetImageTransform():Partial<Paint>{return {scaleMode:'fill',imageMatrix:undefined,scale:1,angle:0,offsetX:0,offsetY:0};}
export function embeddedImageInfo(data:string){
 const match=/^data:(image\/(?:png|jpeg|webp|gif|svg\+xml));base64,([A-Za-z0-9+/]*={0,2})$/.exec(data);if(!match||match[2].length%4!==0)throw Error('The embedded image is not valid base64.');
 const bytes=match[2].length/4*3-(match[2].endsWith('==')?2:match[2].endsWith('=')?1:0),extension=match[1]==='image/jpeg'?'jpg':match[1]==='image/svg+xml'?'svg':match[1].slice(6);
 return {mime:match[1],bytes,extension,payload:match[2]};
}
export function imageByteLabel(bytes:number){return bytes<1000?`${bytes} bytes`:bytes<1_000_000?`${(bytes/1000).toFixed(1)} KB`:`${(bytes/1_000_000).toFixed(2)} MB`;}
/** Validate the new optional fields on ordinary store edits as well as file import. */
export function validateDocumentImageAdjustments(document:{pages?:unknown}){
 if(!Array.isArray(document.pages))return;
 for(const page of document.pages)if(Array.isArray(page?.nodes))for(const node of page.nodes){
  const paints=[...(Array.isArray(node?.paints)?node.paints:[]),...(Array.isArray(node?.strokes)?node.strokes.map((s:{paint?:unknown})=>s?.paint):[])];
  for(const paint of paints)if(paint?.adjustments!==undefined)validateImageAdjustments(paint.adjustments);
 }
}
/** The source image rotates after its offsets, so pointer panning uses the inverse angle. */
export function imageCropPatch(p:Paint,width:number,dx:number,dy:number,kind:'pan'|'scale'):Partial<Paint>{
 if(![width,dx,dy,p.angle].every(Number.isFinite)||width<=0)throw Error('Invalid crop movement.');
 if(kind==='scale')return {scaleMode:'crop',imageMatrix:undefined,scale:Math.max(.01,Math.min(10,(p.scale??1)+dx/width))};
 const a=p.angle*Math.PI/180,x=dx*Math.cos(a)+dy*Math.sin(a),y=-dx*Math.sin(a)+dy*Math.cos(a);
 return {scaleMode:'crop',imageMatrix:undefined,offsetX:Math.max(-1e6,Math.min(1e6,(p.offsetX??0)+x)),offsetY:Math.max(-1e6,Math.min(1e6,(p.offsetY??0)+y))};
}
