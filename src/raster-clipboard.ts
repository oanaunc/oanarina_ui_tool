/** Native input is normalized PNG. Revalidate before allocating a layer or mutating a project. */
export async function readClipboardRaster(data:string){
 const fail=()=>Error('Invalid clipboard PNG. Copy the image again.'),prefix='data:image/png;base64,';
 if(data.length>20_000_000||!data.startsWith(prefix))throw fail();
 const body=data.slice(prefix.length),unpadded=body.replace(/={1,2}$/,'');
 if(body.length<44||body.length%4!==0||/[^A-Za-z0-9+/]/.test(unpadded))throw fail();
 const header=Uint8Array.from(atob(body.slice(0,44)),character=>character.charCodeAt(0)),view=new DataView(header.buffer);
 if([137,80,78,71,13,10,26,10].some((value,index)=>header[index]!==value)||view.getUint32(8)!==13||String.fromCharCode(...header.slice(12,16))!=='IHDR')throw fail();
 const checkSize=(width:number,height:number)=>{if(!width||!height||width>8192||height>8192||width*height>16_000_000)throw Error('Clipboard images support up to 8192 pixels per side and 16 million pixels. Resize the image first.');};
 checkSize(view.getUint32(16),view.getUint32(20));
 const image=new Image();
 await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Invalid clipboard PNG. Copy the image again.'));image.src=data;});
 const width=image.naturalWidth,height=image.naturalHeight;
 checkSize(width,height);
 return {image:data,width,height};
}
