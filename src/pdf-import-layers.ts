import type {PDFPageProxy} from 'pdfjs-dist';
import {parseDocument} from './model';
import type {DesignDocument} from './model';
import {PDF_IMPORT_LIMITS} from './pdf-import-plan';
import type {PdfRasterPlan} from './pdf-import-plan';
import {pdfVectorPage} from './pdf-import-vector';
import type {PdfEmbeddedImage,PdfShading,PdfTextItem,PdfVectorResult} from './pdf-import-vector';
import type {Matrix} from './transforms';
type Objects=PDFPageProxy['objs'];
const hold=(store:Objects,id:string)=>{try{return store.has(id)?store.get(id):undefined;}catch{return undefined;}};
/** RGB and grayscale samples expand to canvas RGBA. Bitmaps draw directly. */
async function encodeImage(value:{width:number;height:number;kind?:number;data?:ArrayLike<number>;bitmap?:CanvasImageSource}):Promise<PdfEmbeddedImage|undefined>{
 const {width,height}=value;if(!width||!height||width*height>PDF_IMPORT_LIMITS.pagePixels)return;const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');if(!context)return;
 try{if(value.bitmap)context.drawImage(value.bitmap,0,0);else if(value.data){const out=context.createImageData(width,height),d=value.data,rgba=out.data;if(value.kind===3)rgba.set(d as Uint8ClampedArray);else if(value.kind===2){for(let i=0,j=0;i<width*height;i++){rgba[j++]=d[i*3];rgba[j++]=d[i*3+1];rgba[j++]=d[i*3+2];rgba[j++]=255;}}else if(value.kind===1){const row=Math.ceil(width/8);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const v=(d[y*row+(x>>3)]>>(7-(x&7)))&1?255:0,j=(y*width+x)*4;rgba[j]=rgba[j+1]=rgba[j+2]=v;rgba[j+3]=255;}}else return;context.putImageData(out,0,0);}else return;
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)return;const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let at=0;at<bytes.length;at+=32768)binary+=String.fromCharCode(...bytes.subarray(at,at+32768));return {data:'data:image/png;base64,'+btoa(binary),width,height};
 }finally{canvas.width=canvas.height=0;}
}
/** Runs after the page rendered, when PDF.js has resolved the images and fonts the operator list names. */
export async function pdfPageLayers(page:PDFPageProxy,operators:{fnArray:number[];argsArray:unknown[][]},OPS:Record<string,number>,plan:PdfRasterPlan,check:()=>void):Promise<PdfVectorResult>{
 try{const viewport=page.getViewport({scale:96/72}),content=await page.getTextContent();check();const objs=page.objs,common=page.commonObjs,find=(id:string)=>hold(id.startsWith('g_')?common:objs,id)??hold(objs,id)??hold(common,id),images=new Map<string,PdfEmbeddedImage>();let bytes=0;
  for(let i=0;i<operators.fnArray.length;i++){const fn=operators.fnArray[i],inline=fn===OPS.paintInlineImageXObject;if(fn!==OPS.paintImageXObject&&!inline)continue;const key=inline?'inline:'+i:String(operators.argsArray[i][0]);if(images.has(key))continue;const raw=inline?operators.argsArray[i][0]:find(key);if(!raw||typeof raw!=='object')continue;const encoded=await encodeImage(raw as Parameters<typeof encodeImage>[0]);check();if(!encoded)continue;bytes+=encoded.data.length;if(bytes>PDF_IMPORT_LIMITS.pngBytes*1.4)return {reason:'more image data than one page holds'};images.set(key,encoded);}
  const text:PdfTextItem[]=content.items.flatMap(item=>{if(!('str' in item)||!item.str)return [];const font=find(item.fontName) as {name?:string}|undefined;return [{str:item.str,transform:item.transform as number[],width:item.width,font:font?.name??content.styles[item.fontName]?.fontFamily??'Inter'}];});
  return pdfVectorPage({fnArray:operators.fnArray,argsArray:operators.argsArray,ops:OPS,viewport:viewport.transform as Matrix,width:plan.width,height:plan.height,text,images,shading:id=>find(id) as PdfShading|undefined});
 }catch(error){if(error instanceof DOMException&&error.name==='AbortError')throw error;check();return {reason:'content that could not be read'};}
}
/** Pages that convert replace their image; a page that cannot convert keeps it and says why. Nothing is opened unvalidated. */
export function pdfEditableDocument(images:DesignDocument,layered:PdfVectorResult[]):{editable?:DesignDocument;notes:string[]}{
 const notes:string[]=[];let converted=0;const candidate=structuredClone(images);candidate.pages.forEach((page,i)=>{const result=layered[i];if(!result||'reason' in result){notes.push(page.name+': '+(result?.reason??'content that could not be read'));return;}const root=result.nodes[0];root.name=page.name;page.nodes=result.nodes;converted++;});
 if(!converted)return {notes};try{const raw=JSON.stringify(candidate);if(new TextEncoder().encode(raw).byteLength>=48_000_000)return {notes:['The editable layers exceed the project size limit.']};return {editable:parseDocument(raw),notes};}catch{return {notes:['The editable layers could not be validated.']};}
}
