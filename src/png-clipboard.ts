/** Copy-as-PNG uses 2× output, bounded before allocating a raster surface. */
export const PNG_CLIPBOARD_LIMIT=20_000_000;
export function pngClipboardDimensions(width:number,height:number){
 const w=Math.ceil(width*2),h=Math.ceil(height*2);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w>8192||h>8192||w*h>16_000_000)throw Error('Copy as PNG supports 2× output up to 8192 pixels per side and 16 million pixels. Select less artwork.');
 return {width:w,height:h};
}
/** Render the same standalone SVG used by artwork export. A PNG stays transparent. */
export async function renderClipboardPng(svg:string,size:{width:number;height:number}){
 const {width,height}=size;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||width*height>16_000_000)throw Error('Clipboard PNG dimensions exceed the image limit.');
 const image=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 try{
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Unable to render the selected artwork as PNG.'));image.src=url;});
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');if(!context)throw Error('PNG rendering is unavailable.');
  context.drawImage(image,0,0,width,height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Unable to encode the selected artwork as PNG.')),'image/png'));
  if(Math.ceil(blob.size/3)*4+'data:image/png;base64,'.length>PNG_CLIPBOARD_LIMIT)throw Error('Copy as PNG exceeds the 20 MB encoded clipboard limit. Select less artwork.');
  const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(Error('Unable to read clipboard PNG.'));reader.onerror=()=>reject(Error('Unable to read clipboard PNG.'));reader.readAsDataURL(blob);});
  if(!data.startsWith('data:image/png;base64,')||data.length>PNG_CLIPBOARD_LIMIT)throw Error('Invalid or oversized clipboard PNG.');
  return data;
 }finally{URL.revokeObjectURL(url);}
}
