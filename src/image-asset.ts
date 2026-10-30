import {embeddedImageInfo} from './image-paint';
export const MAX_IMAGE_BYTES=20_000_000;
export async function readImageAsset(file:File){
 if(file.size>MAX_IMAGE_BYTES)throw Error('Choose an image smaller than 20 MB.');
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Choose a PNG, JPEG, WebP or GIF image.');
 const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(Error('Could not read image.'));reader.onerror=()=>reject(Error('Could not read image.'));reader.readAsDataURL(file);});
 const info=embeddedImageInfo(data);if(info.bytes!==file.size||info.mime!==file.type)throw Error('The image data could not be read completely.');
 const image=new Image();try{await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Invalid image.'));image.src=data;});if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>16384||image.naturalHeight>16384||image.naturalWidth*image.naturalHeight>80_000_000)throw Error('Choose an image up to 16,384 pixels per side and 80 million pixels.');return {image:data,imageWidth:image.naturalWidth,imageHeight:image.naturalHeight};}finally{image.onload=null;image.onerror=null;image.src='';}
}
/** Decode the embedded asset verbatim, without transform, resampling, or adjustment. */
export function originalImageBlob(data:string){const info=embeddedImageInfo(data);if(info.bytes>MAX_IMAGE_BYTES)throw Error('The original image exceeds the 20 MB asset limit.');const raw=atob(info.payload),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return {blob:new Blob([bytes],{type:info.mime}),extension:info.extension};}
