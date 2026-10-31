import {ImportInputError} from './import-task';
import type {DesignDocument} from './model';
/** A design app's copy can carry a base64 fig-kiwi message in the HTML flavor. The payload's own header identifies it, so no app
 * name or wrapper is assumed. This shape comes from public third-party research, and no real clipboard capture is in the tests. */
const SIGNATURE='ZmlnLWtpd2',PAYLOAD=/ZmlnLWtpd2[A-Za-z0-9+/=\s]*/,INPUT_LIMIT=20_000_000,UNREADABLE='This .fig clipboard content could not be read. Copy as SVG in the source app, then paste again.';
export const isFigClipboardHtml=(html:string|undefined)=>!!html&&html.length<=INPUT_LIMIT&&html.includes('<')&&html.includes(SIGNATURE);
export function figClipboardBytes(html:string):Uint8Array{
 if(html.length>INPUT_LIMIT)throw Error('Clipboard content exceeds 20 MB.');const text=PAYLOAD.exec(html)?.[0].replace(/\s/g,'');
 if(!text)throw new ImportInputError('This clipboard format is not supported. Copy as SVG in the source app, then paste again.');
 if(text.length%4===1||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw new ImportInputError(UNREADABLE);
 let binary:string;try{binary=atob(text);}catch{throw new ImportInputError(UNREADABLE);}
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
type Raw=Record<string,unknown>;
const key=(value:unknown)=>{const g=value as {sessionID?:unknown;localID?:unknown}|undefined;return g&&g.sessionID!==undefined?`${g.sessionID}:${g.localID}`:undefined;};
/** A copy need not carry its source document. Layers whose parent stayed behind, and copies stored only on an internal canvas, gain one
 * visible page, so the ordinary scene mapper reads a clipboard message without any clipboard-specific conversion rules. */
export function figClipboardMessage(message:Raw):Raw{
 const records=Array.isArray(message.nodeChanges)?(message.nodeChanges as Raw[]).map(r=>({...r})):[];if(!records.length)throw Error('The clipboard is empty.');
 const ids=new Set(records.map(r=>key(r.guid))),holder=(r:Raw)=>r.type==='DOCUMENT'||r.type==='CANVAS',parent=(r:Raw)=>key((r.parentIndex as Raw|undefined)?.guid),orphans=records.filter(r=>!holder(r)&&(!parent(r)||!ids.has(parent(r)))),used=new Set(records.filter(r=>r.phase!=='REMOVED').map(parent));
 const visible=records.filter(r=>r.type==='CANVAS'&&r.internalOnly!==true&&r.isPageDivider!==true&&used.has(key(r.guid)));
 let page:Raw|undefined=orphans.length||!visible.length?undefined:visible[0];
 if(!page&&!orphans.length){const internal=records.find(r=>r.type==='CANVAS'&&used.has(key(r.guid)));if(!internal)throw Error('The clipboard has no layers Forma can paste.');internal.internalOnly=false;page=internal;}
 if(orphans.length){const guid={sessionID:4294967295,localID:4294967295};page={guid,type:'CANVAS',name:'Pasted layers'};records.push(page);orphans.forEach((r,i)=>{r.parentIndex={guid,position:String((r.parentIndex as Raw|undefined)?.position??i.toString().padStart(8,'0'))};});}
 return {...message,nodeChanges:records};
}
const SHELF='Imported components';
/** The first page with pasted layers. A page of mains kept for live instances is a dependency of the paste, not part of it. */
export function figClipboardRoots(document:DesignDocument){const page=document.pages.find(p=>p.name!==SHELF&&p.nodes.some(n=>!n.parentId))??document.pages.find(p=>p.nodes.some(n=>!n.parentId));return page?{pageId:page.id,roots:page.nodes.filter(n=>!n.parentId).map(n=>n.id)}:undefined;}
