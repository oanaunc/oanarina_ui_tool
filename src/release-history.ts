export interface ReleaseEntry {version:string;channel:'development'|'preview';title:string;notes:string[];limits:string[];download?:{url:string;sha256:string;bytes:number;notarized:boolean};}
export interface ReleaseHistory {schemaVersion:1;asOf:string;releases:ReleaseEntry[];}
const short=(value:unknown,max:number):value is string=>typeof value==='string'&&value.length>0&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
const lines=(value:unknown):value is string[]=>Array.isArray(value)&&value.length<=30&&value.every(v=>short(v,1200));
export function parseReleaseHistory(value:unknown):ReleaseHistory {
 const data=value as ReleaseHistory;if(!data||data.schemaVersion!==1||!/^\d{4}-\d{2}-\d{2}$/.test(data.asOf)||!Array.isArray(data.releases)||!data.releases.length||data.releases.length>50)throw Error('The bundled release history is invalid.');
 const versions=new Set<string>();const releases=data.releases.map(r=>{
  if(!r||!short(r.version,64)||!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(r.version)||versions.has(r.version)||!['development','preview'].includes(r.channel)||!short(r.title,160)||!lines(r.notes)||!lines(r.limits))throw Error('The bundled release history contains an invalid entry.');versions.add(r.version);
  let download:ReleaseEntry['download'];if(r.download){const d=r.download;let url:URL;try{url=new URL(d.url);}catch{throw Error('The release download link is invalid.');}if(r.channel!=='preview'||url.origin!=='https://www.oanarinaldi.com'||!/^\/downloads\/ui-tool\/[a-zA-Z0-9_.-]+\.dmg$/.test(url.pathname)||url.username||url.password||url.search||url.hash||!/^[a-f0-9]{64}$/.test(d.sha256)||!Number.isSafeInteger(d.bytes)||d.bytes<=0||d.bytes>2_000_000_000||typeof d.notarized!=='boolean')throw Error('The release download metadata is invalid.');download={url:url.href,sha256:d.sha256,bytes:d.bytes,notarized:d.notarized};}
  return {version:r.version,channel:r.channel,title:r.title,notes:[...r.notes],limits:[...r.limits],...(download?{download}:{})};
 });return {schemaVersion:1,asOf:data.asOf,releases};
}
