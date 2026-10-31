import {importImages,openSelectedProject} from './files';
import {ImportInputError} from './import-task';
import {useEditor} from './store';

/** Finder drops on the canvas. One document opens through the same path as File > Open, so a project that
 * replaces the window keeps its review and guarded retention. Images import where they land. */
const DOCUMENT=/\.(oui|fig|pdf|sketch)$/i;
/** WebKit decodes these on Mac but the document format embeds only PNG, JPEG, WebP and GIF. */
const CONVERTED=['image/heic','image/heif','image/tiff','image/bmp','image/avif'];
export const DROP_LIMITS={bytes:20_000_000,side:16384,pixels:80_000_000} as const;
export const dropConvertsImage=(file:Pick<File,'type'>)=>CONVERTED.includes(file.type);
export function droppedDocument(files:readonly Pick<File,'name'>[]){if(files.some(f=>DOCUMENT.test(f.name))&&files.length>1)throw new ImportInputError('Drop one project, .fig, PDF or Sketch file at a time. Images can be dropped together.');return files.length===1&&DOCUMENT.test(files[0].name);}
/** Decoded once, drawn to sRGB and re-encoded, so the rest of the import sees an ordinary validated PNG. */
export async function dropToPng(file:File){
 if(file.size>DROP_LIMITS.bytes)throw new ImportInputError('Choose images smaller than 20 MB each.');
 let bitmap:ImageBitmap;try{bitmap=await createImageBitmap(file);}catch{throw new ImportInputError(`This device could not decode ${file.name}. Choose PNG, JPEG, WebP, GIF or SVG.`);}
 try{
  const {width,height}=bitmap;if(!width||!height||width>DROP_LIMITS.side||height>DROP_LIMITS.side||width*height>DROP_LIMITS.pixels)throw new ImportInputError('Choose an image within 16,384 pixels per edge and 80 million pixels.');
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d')!.drawImage(bitmap,0,0);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new ImportInputError(`${file.name} could not be converted to PNG.`);
  return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.png',{type:'image/png'});
 }finally{bitmap.close();}
}
/** World point under the pointer, for placing dropped images. */
export function dropPoint(clientX:number,clientY:number,canvas:Element|null){const s=useEditor.getState(),box=canvas?.getBoundingClientRect();if(!box||!s.zoom)return undefined;return {x:(clientX-box.left-s.pan.x)/s.zoom,y:(clientY-box.top-s.pan.y)/s.zoom};}
export async function dropFiles(files:File[],at?:{x:number;y:number}){
 if(!files.length)return;
 if(droppedDocument(files))return openSelectedProject(files[0]);
 return importImages(await Promise.all(files.map(file=>dropConvertsImage(file)?dropToPng(file):file)),at);
}
