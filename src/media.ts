import type {DesignNode} from './model';
import {embeddedImageInfo} from './image-paint';
export interface EmbeddedVideo {kind:'video';data:string;mime:'video/mp4'|'video/webm';width:number;height:number;duration:number;poster:string;posterTime:number;startTime:number;loop:boolean;muted:boolean;autoplay:boolean;}
export const VIDEO_BYTE_LIMIT=20_000_000,VIDEO_POSTER_LIMIT=2_000_000,VIDEO_DURATION_LIMIT=3600;
export function videoDataInfo(data:string){
 const match=/^data:(video\/(?:mp4|webm));base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);if(!match||match[2].length%4)throw Error('Video must be an embedded MP4 or WebM asset.');
 const bytes=match[2].length/4*3-(match[2].endsWith('==')?2:match[2].endsWith('=')?1:0);if(bytes<12||bytes>VIDEO_BYTE_LIMIT)throw Error('Choose a video between 12 bytes and 20 MB.');
 const header=atob(match[2].slice(0,Math.min(48,match[2].length)));if(match[1]==='video/mp4'?header.slice(4,8)!=='ftyp':![0x1a,0x45,0xdf,0xa3].every((v,i)=>header.charCodeAt(i)===v))throw Error('The video container does not match its declared format.');
 return {mime:match[1] as EmbeddedVideo['mime'],bytes,payload:match[2],extension:match[1]==='video/mp4'?'mp4':'webm'};
}
export function validateVideo(value:unknown):asserts value is EmbeddedVideo{
 const m=value as EmbeddedVideo;if(!m||typeof m!=='object'||Array.isArray(m)||m.kind!=='video'||Object.keys(m).some(k=>!['kind','data','mime','width','height','duration','poster','posterTime','startTime','loop','muted','autoplay'].includes(k)))throw Error('Invalid video metadata.');
 if(typeof m.data!=='string'||videoDataInfo(m.data).mime!==m.mime)throw Error('Invalid embedded video format.');
 if(![m.width,m.height].every(v=>Number.isInteger(v)&&v>0&&v<=4096)||m.width*m.height>8_000_000||!Number.isFinite(m.duration)||m.duration<=0||m.duration>VIDEO_DURATION_LIMIT)throw Error('Video supports up to 4096 pixels per edge, 8 million pixels and one hour.');
 for(const k of ['startTime','posterTime'] as const)if(!Number.isFinite(m[k])||m[k]<0||m[k]>=m.duration)throw Error('Video start and poster times must be within its duration.');
 if(['loop','muted','autoplay'].some(k=>typeof m[k as 'loop']!=='boolean'))throw Error('Invalid video playback option.');
 if(typeof m.poster!=='string')throw Error('A video needs an embedded poster.');const poster=embeddedImageInfo(m.poster);if(!['image/png','image/jpeg'].includes(poster.mime)||!poster.bytes||poster.bytes>VIDEO_POSTER_LIMIT)throw Error('Video poster must be PNG or JPEG up to 2 MB.');
}
export function validateDocumentMedia(doc:{pages?:unknown}){if(!Array.isArray(doc.pages))return;for(const p of doc.pages)if(Array.isArray(p?.nodes))for(const n of p.nodes)if(n?.media!==undefined){if(n.type!=='image')throw Error('Video metadata belongs to image layers.');validateVideo(n.media);if(n.image!==n.media.poster)throw Error('Video image fallback must match its poster.');}}
export function mediaExportWarnings(nodes:readonly DesignNode[]){const warnings:string[]=[];if(nodes.some(n=>n.media))warnings.push('Embedded video exports use the saved poster frame. Video playback, timing and audio are not included in SVG, PNG or JPG.');if(nodes.some(n=>n.image?.startsWith('data:image/gif;')||n.paints?.some(p=>p.image?.startsWith('data:image/gif;'))||n.strokes?.some(s=>s.paint.image?.startsWith('data:image/gif;'))))warnings.push('Animated GIF source is retained in SVG. PNG and JPG are still images; SVG animation support depends on the viewer.');return warnings;}
export function originalVideoBlob(media:EmbeddedVideo){validateVideo(media);const info=videoDataInfo(media.data),raw=atob(info.payload),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return {blob:new Blob([bytes],{type:info.mime}),extension:info.extension};}
