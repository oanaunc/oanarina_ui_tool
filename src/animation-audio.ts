import {canonicalPcmWav,fillPcmAudio,inspectPcmWav,prototypeAudioBytes} from './prototype-audio';
import type {PrototypeAudio} from './prototype-audio';
import type {DesignNode} from './model';
/** Sound for one export. It is decoded for that export only and never written into the document. */
export interface AnimationSoundtrack {name:string;bytes:Uint8Array;loop:boolean;volume:number;}
export interface SoundtrackChoice {id:string;name:string;audio:PrototypeAudio;}
export const ANIMATION_AUDIO_RATE=48000;
/** Attachments on the exported frames and their ancestors, in layer order. */
export function soundtrackChoices(nodes:DesignNode[],selection:string[]):SoundtrackChoice[]{const map=new Map(nodes.map(n=>[n.id,n])),seen=new Set<string>(),out:SoundtrackChoice[]=[];for(const id of selection){let at=map.get(id),depth=0;while(at&&depth++<64&&!seen.has(at.id)){seen.add(at.id);if(at.prototypeAudio)out.push({id:at.id,name:at.name,audio:at.prototypeAudio});at=map.get(at.parentId??'');}}return out;}
export const attachedSoundtrack=(c:SoundtrackChoice):AnimationSoundtrack=>({name:c.name,bytes:prototypeAudioBytes(c.audio),loop:c.audio.loop,volume:c.audio.volume});
/** Validates a picked file exactly like prototype audio; nothing is kept once the export ends. */
export function pickedSoundtrack(name:string,bytes:Uint8Array):AnimationSoundtrack{return {name,bytes:canonicalPcmWav(bytes).bytes,loop:false,volume:1};}
/** Pure mix to the export rate: mono becomes both channels, shorter sound loops or ends in silence, and only upsampling occurs because sources stop at 48 kHz. */
export function mixSoundtrack(source:Float32Array[],sampleRate:number,duration:number,loop:boolean,volume:number,rate=ANIMATION_AUDIO_RATE):[Float32Array,Float32Array]{if(!source.length||source.length>2||source.some(c=>c.length!==source[0].length)||!Number.isFinite(sampleRate)||sampleRate<=0||!Number.isFinite(duration)||duration<=0||!(volume>=0&&volume<=1))throw Error('Choose a valid soundtrack.');const frames=Math.round(duration*rate),left=new Float32Array(frames),right=new Float32Array(frames),a=source[0],b=source[1]??a,length=a.length,ratio=sampleRate/rate,sample=(c:Float32Array,at:number)=>{if(at<length)return c[at];return loop?c[at%length]:0;};if(length)for(let i=0;i<frames;i++){const position=i*ratio;if(!loop&&position>=length)break;const low=Math.floor(position),t=position-low;left[i]=(sample(a,low)*(1-t)+sample(a,low+1)*t)*volume;right[i]=(sample(b,low)*(1-t)+sample(b,low+1)*t)*volume;}return [left,right];}
export async function decodeSoundtrack(track:AnimationSoundtrack,duration:number,signal:AbortSignal){const info=inspectPcmWav(track.bytes,true),channels=Array.from({length:info.channels},()=>new Float32Array(info.frames));await fillPcmAudio(track.bytes,channels,signal);return mixSoundtrack(channels,info.sampleRate,duration,track.loop,track.volume);}
