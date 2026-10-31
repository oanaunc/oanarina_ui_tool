import {ImportInputError} from './import-task';
import type {DesignDocument} from './model';
/** Figma's copy places a base64 fig-kiwi message between (figma) markers in the HTML flavor. This shape comes from public
 * third-party research, not from a Figma specification, and no real clipboard capture is in the tests. */
const BLOCK=/\(figma\)\s*([A-Za-z0-9+/=\s]{16,})\s*\(\/figma\)/;
const INPUT_LIMIT=20_000_000;
export const isFigmaClipboardHtml=(html:string|undefined)=>!!html&&html.length<=INPUT_LIMIT&&html.includes('(figma)')&&html.includes('(/figma)');
export function figmaClipboardBytes(html:string):Uint8Array{
 if(html.length>INPUT_LIMIT)throw Error('Clipboard content exceeds 20 MB.');const text=BLOCK.exec(html)?.[1].replace(/\s/g,'');
 if(!text||text.length%4===1||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw new ImportInputError('This Figma clipboard content could not be read. Copy as SVG in Figma, then paste again.');
 let binary:string;try{binary=atob(text);}catch{throw new ImportInputError('This Figma clipboard content could not be read. Copy as SVG in Figma, then paste again.');}
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));if(new TextDecoder().decode(bytes.subarray(0,8))!=='fig-kiwi')throw new ImportInputError('This clipboard format is not supported. Copy as SVG in Figma, then paste again.');return bytes;
}
type Raw=Record<string,unknown>;
const key=(value:unknown)=>{const g=value as {sessionID?:unknown;localID?:unknown}|undefined;return g&&g.sessionID!==undefined?`${g.sessionID}:${g.localID}`:undefined;};
/** A copy need not carry its source document. Layers whose parent stayed behind, and copies stored only on an internal canvas, gain one
 * visible page, so the ordinary scene mapper reads a clipboard message without any clipboard-specific conversion rules. */
export function figClipboardMessage(message:Raw):Raw{
 const records=Array.isArray(message.nodeChanges)?(message.nodeChanges as Raw[]).map(r=>({...r})):[];if(!records.length)throw Error('The Figma clipboard is empty.');
 const ids=new Set(records.map(r=>key(r.guid))),holder=(r:Raw)=>r.type==='DOCUMENT'||r.type==='CANVAS',parent=(r:Raw)=>key((r.parentIndex as Raw|undefined)?.guid),orphans=records.filter(r=>!holder(r)&&(!parent(r)||!ids.has(parent(r)))),used=new Set(records.filter(r=>r.phase!=='REMOVED').map(parent));
 const visible=records.filter(r=>r.type==='CANVAS'&&r.internalOnly!==true&&r.isPageDivider!==true&&used.has(key(r.guid)));
 let page:Raw|undefined=orphans.length||!visible.length?undefined:visible[0];
 if(!page&&!orphans.length){const internal=records.find(r=>r.type==='CANVAS'&&used.has(key(r.guid)));if(!internal)throw Error('The Figma clipboard has no layers Forma can paste.');internal.internalOnly=false;page=internal;}
 if(orphans.length){const guid={sessionID:4294967295,localID:4294967295};page={guid,type:'CANVAS',name:'Pasted from Figma'};records.push(page);orphans.forEach((r,i)=>{r.parentIndex={guid,position:String((r.parentIndex as Raw|undefined)?.position??i.toString().padStart(8,'0'))};});}
 return {...message,nodeChanges:records};
}
const SHELF='Imported components';
/** The first page with pasted layers. A page of mains kept for live instances is a dependency of the paste, not part of it. */
export function figClipboardRoots(document:DesignDocument){const page=document.pages.find(p=>p.name!==SHELF&&p.nodes.some(n=>!n.parentId))??document.pages.find(p=>p.nodes.some(n=>!n.parentId));return page?{pageId:page.id,roots:page.nodes.filter(n=>!n.parentId).map(n=>n.id)}:undefined;}
