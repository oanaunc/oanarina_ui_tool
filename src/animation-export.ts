import {refusePassThroughPlayback} from './pass-through';
import {GIFEncoder,applyPalette,quantize} from 'gifenc';
import {visualBounds} from './transforms';
import type {DesignNode} from './model';
import {sampleMotion} from './motion';
import type {Timeline} from './motion';
import {exportSvg} from './files';
export type AnimationFormat='gif'|'webm'|'mp4';
export function recordingMime(format:AnimationFormat){if(format==='gif')return 'image/gif';if(typeof MediaRecorder==='undefined')return null;const options=format==='mp4'?['video/mp4','video/mp4;codecs=avc1.42E01E']:['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'];return options.find(type=>MediaRecorder.isTypeSupported(type))??null;}
export interface AnimationExportOptions {format:AnimationFormat;scale:number;duration:number;fps:number;quality:number;loop:boolean;transparent:boolean;signal:AbortSignal;onProgress:(value:number)=>void;}
export async function renderAnimation(nodes:DesignNode[],motion:Timeline,options:AnimationExportOptions){refusePassThroughPlayback(nodes);const {format,scale,duration,fps,signal}=options,mime=recordingMime(format);if(!mime)throw Error(format.toUpperCase()+' recording is not supported by this browser. GIF is available.');if(!nodes.length)throw Error('Select artwork to animate.');const count=Math.max(2,Math.ceil(duration*fps));if(count>1800)throw Error('Use a shorter duration or lower frame rate (maximum 1,800 frames per export).');
 const sampled=Array.from({length:33},(_,i)=>visualBounds(sampleMotion(nodes,motion,duration*i/32))),b={x:Math.min(...sampled.map(b=>b.x)),y:Math.min(...sampled.map(b=>b.y)),width:0,height:0};b.width=Math.max(...sampled.map(p=>p.x+p.width))-b.x;b.height=Math.max(...sampled.map(p=>p.y+p.height))-b.y;
 const width=Math.max(1,Math.ceil(b.width*scale)),height=Math.max(1,Math.ceil(b.height*scale));if(width>4096||height>4096||width*height>8_000_000)throw Error('Animation is too large. Select a smaller frame or reduce export scale.');const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:format==='gif',alpha:format==='gif'})!;
 let failure:Error|undefined;const check=()=>{if(failure)throw failure;if(signal.aborted)throw new DOMException('Animation export cancelled.','AbortError');};
 const draw=async(time:number)=>{check();const svg=exportSvg(sampleMotion(nodes,motion,time),b),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Unable to render animation artwork.'));image.src=url;});check();ctx.clearRect(0,0,width,height);if(!options.transparent||format!=='gif'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);}ctx.drawImage(image,0,0,width,height);}finally{URL.revokeObjectURL(url);}};
 if(format==='gif'){const gif=GIFEncoder();for(let frame=0;frame<count;frame++){await draw(duration*frame/(count-1));const rgba=ctx.getImageData(0,0,width,height).data,palette=quantize(rgba,Math.max(2,options.quality-1)),indices=applyPalette(rgba,palette);for(let i=0;i<indices.length;i++)indices[i]=options.transparent&&rgba[i*4+3]<128?0:indices[i]+1;gif.writeFrame(indices,width,height,{palette:[[0,0,0],...palette],delay:duration*1000/count,repeat:options.loop?0:-1,transparent:options.transparent,transparentIndex:0,dispose:2});options.onProgress((frame+1)/count);await new Promise(resolve=>setTimeout(resolve,0));}gif.finish();return new Blob([gif.bytes()],{type:mime});}
 // Capture after the recorder starts. A static canvas can otherwise produce only
 // an empty video header if its first paint happened before capture began.
 const stream=canvas.captureStream(fps);
 const track=stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
 const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:options.quality>=256?8_000_000:options.quality>=128?4_000_000:1_500_000});
 const chunks:BlobPart[]=[];
 let rejectRecording:(reason:unknown)=>void=()=>{};
 const stopped=new Promise<Blob>((resolve,reject)=>{
  rejectRecording=reject;
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>chunks.length?resolve(new Blob(chunks,{type:mime})):reject(Error('Video encoder returned no frames.'));
  recorder.onerror=()=>{failure=Error('Video encoding failed.');reject(failure);};
 });
 void stopped.catch(()=>{});
 const aborted=()=>{rejectRecording(new DOMException('Animation export cancelled.','AbortError'));if(recorder.state!=='inactive')recorder.stop();};
 signal.addEventListener('abort',aborted,{once:true});
 try {
  check();
  recorder.start();
  const start=performance.now();
  for(let frame=0;frame<count;frame++){
   check();await draw(duration*frame/(count-1));
   // requestFrame is optional in WebKit; automatic capture remains enabled.
   if(typeof track.requestFrame==='function')track.requestFrame();
   options.onProgress((frame+1)/count);
   const wait=start+(frame+1)*duration*1000/count-performance.now();
   if(wait>0)await new Promise(resolve=>setTimeout(resolve,wait));
  }
  check();recorder.stop();const blob=await stopped;options.onProgress(1);return blob;
 } finally {
  signal.removeEventListener('abort',aborted);
  if(recorder.state!=='inactive')recorder.stop();
  stream.getTracks().forEach(track=>track.stop());
 }
}
