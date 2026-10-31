import {descendants,parseDocument,uid} from './model';
import type {DesignDocument,DesignNode,Page} from './model';
import {createPrototypeState,prototypeDocument,prototypeFrames,reactionsFor} from './prototype';
import type {PrototypeAction} from './prototype';
import {bytesToBase64,decryptPrototype,encryptPrototype,validatePrototypeCipher} from './prototype-crypto';
import type {PrototypeCipher} from './prototype-crypto';
import type {FontAsset} from './font-data';
import {strToU8,zipSync} from 'fflate';
/** A self-contained prototype file: a validated snapshot plus the real presentation player. There is no hosted link. */
export const PROTOTYPE_FORMAT='forma-prototype',PROTOTYPE_VERSION=1,PROTOTYPE_DATA_ID='forma-prototype-data',PROTOTYPE_FILE_BYTES=60_000_000;
export interface PrototypePayload {title:string;pageId:string;startFrameId?:string;exportedAt:string;document:DesignDocument;}
export type PrototypeEnvelope={format:typeof PROTOTYPE_FORMAT;version:typeof PROTOTYPE_VERSION;payload:PrototypePayload}|{format:typeof PROTOTYPE_FORMAT;version:typeof PROTOTYPE_VERSION;encrypted:PrototypeCipher};
export interface PrototypeRuntime {js:string;css:string;}
export interface PrototypeSnapshotReport {frames:number;layers:number;pagesOmitted:number;commentsOmitted:number;layersOmitted:number;fontsEmbedded:number;fontsRestricted:string[];}
/** Review metadata and file plumbing that a viewer has no use for. Rendering fields stay. */
const privateNodeFields=['annotations','developmentStatus','readyForDevelopment','devResources','exportSettings','exportGhost','detachedFrom','layoutGuides','layoutGuideBindings','layoutGuideStyleId','componentMetadata','widget','widgetAction','widgetField','widgetHover','linkCard','slidePoll','slidePrototypeEmbed'] as const;
const actionComponents=(actions:PrototypeAction[]|undefined,out:Set<string>)=>{for(const a of actions??[]){if(a.componentId)out.add(a.componentId);for(const b of a.branches??[])actionComponents(b.actions,out);}};
/** Components this page renders or can switch to, including nested instances and every variant in a used set. */
function requiredComponents(document:DesignDocument,page:Page){
 const byId=new Map(document.pages.flatMap(p=>p.nodes.map(n=>[n.id,n] as const))),needed=new Set<string>(),queue:string[]=[];
 const scan=(nodes:DesignNode[])=>{const found=new Set<string>();for(const n of nodes){if(n.componentId)found.add(n.componentId);for(const r of reactionsFor(n))actionComponents(r.actions,found);}for(const id of found)if(!needed.has(id)){needed.add(id);queue.push(id);}};
 scan(page.nodes);
 while(queue.length){const id=queue.pop()!,set=document.componentSets?.find(s=>s.variants.some(v=>v.componentId===id));for(const other of [...(set?.variants.map(v=>v.componentId)??[]),...(set?[set.containerId]:[])])if(!needed.has(other)){needed.add(other);queue.push(other);}if(!byId.has(id))continue;const owner=document.pages.find(p=>p.nodes.some(n=>n.id===id))!,ids=new Set(descendants(owner.nodes,[id]));scan(owner.nodes.filter(n=>ids.has(n.id)));}
 return needed;
}
function scrubNode(n:DesignNode){const copy={...n};for(const key of privateNodeFields)delete copy[key];return copy;}
/** Keep only the roots that hold a presentable frame or a needed component; loose canvas scraps do not ship. */
function presentedNodes(page:Page,needed:Set<string>){
 const rootOf=(n:DesignNode)=>{const seen=new Set<string>();let at=n;while(at.parentId&&!seen.has(at.id)){seen.add(at.id);const parent=page.nodes.find(p=>p.id===at.parentId);if(!parent)break;at=parent;}return at.id;},roots=new Set<string>();
 for(const f of prototypeFrames(page))roots.add(rootOf(f));for(const n of page.nodes)if(needed.has(n.id))roots.add(rootOf(n));
 const kept=new Set(descendants(page.nodes,[...roots]));return page.nodes.filter(n=>kept.has(n.id));
}
/** Other pages contribute component definitions only, as roots, so their names and artwork stay behind. */
function componentNodes(page:Page,needed:Set<string>){const roots=page.nodes.filter(n=>needed.has(n.id)),kept=new Set(descendants(page.nodes,roots.map(n=>n.id))),rootIds=new Set(roots.map(n=>n.id));return page.nodes.filter(n=>kept.has(n.id)).map(n=>rootIds.has(n.id)&&!(n.parentId&&kept.has(n.parentId))?{...n,parentId:null}:n);}
export function prototypeSnapshot(document:DesignDocument,pageId:string,options:{fonts?:readonly FontAsset[];startFrameId?:string;exportedAt?:string}={}){
 if((document.workspace??'design')!=='design')throw Error('Prototype files are made from Design files. Slides, Sites and Whiteboards have their own export.');
 const page=document.pages.find(p=>p.id===pageId);if(!page)throw Error('This prototype page was removed.');const frames=prototypeFrames(page);if(!frames.length)throw Error('Add a frame to this page before exporting a prototype.');if(options.startFrameId!==undefined&&!frames.some(f=>f.id===options.startFrameId))throw Error('Choose a starting frame on this page.');
 const needed=requiredComponents(document,page),nodes=presentedNodes(page,needed).map(scrubNode),title=[document.name,page.name].filter(Boolean).join(' · ').slice(0,300),fonts=options.fonts??document.fonts??[],embedded=fonts.filter(f=>f.embeddable!==false);
 const pages:Page[]=[{id:page.id,name:page.name,nodes,comments:[],...(page.motion?{motion:page.motion}:{}),...(page.flows?{flows:page.flows}:{}),...(page.prototypeSettings?{prototypeSettings:page.prototypeSettings}:{}),...(page.background?{background:page.background}:{})}];
 document.pages.forEach((p,index)=>{if(p.id===page.id)return;const kept=componentNodes(p,needed);if(kept.length)pages.push({id:p.id,name:'Components '+(index+1),nodes:kept.map(scrubNode),comments:[]});});
 const snapshot:DesignDocument={format:'oanarina-ui',version:2,id:uid(),name:document.name,pages,colors:[],updatedAt:options.exportedAt??new Date().toISOString(),workspace:'design',...(document.colorProfile?{colorProfile:document.colorProfile}:{}),...(document.shaders?{shaders:document.shaders}:{}),...(document.motionStyles?{motionStyles:document.motionStyles}:{}),...(document.componentSets?{componentSets:document.componentSets.filter(s=>s.variants.some(v=>needed.has(v.componentId)))}:{}),...(document.variableCollections?{variableCollections:document.variableCollections}:{}),...(document.variables?{variables:document.variables}:{}),...(document.variableModes?{variableModes:document.variableModes}:{}),...(document.styles?{styles:document.styles}:{}),...(embedded.length?{fonts:embedded}:{})};
 const payload:PrototypePayload={title,pageId:page.id,exportedAt:snapshot.updatedAt,document:snapshot,...(options.startFrameId?{startFrameId:options.startFrameId}:{})};
 validatedPayload(JSON.parse(JSON.stringify(payload)));
 const report:PrototypeSnapshotReport={frames:frames.length,layers:pages.reduce((sum,p)=>sum+p.nodes.length,0),pagesOmitted:document.pages.length-1,commentsOmitted:document.pages.reduce((sum,p)=>sum+p.comments.length,0),layersOmitted:page.nodes.length-nodes.length,fontsEmbedded:embedded.length,fontsRestricted:[...new Set(fonts.filter(f=>f.embeddable===false).map(f=>f.family))]};
 return {payload,report};
}
/** The same checks an opened .oui gets, plus a real first state, so a file that cannot play is refused before it plays. */
function validatedPayload(value:unknown):PrototypePayload{
 const p=value as PrototypePayload;if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!['title','pageId','startFrameId','exportedAt','document'].includes(k))||typeof p.title!=='string'||p.title.length>300||typeof p.pageId!=='string'||typeof p.exportedAt!=='string'||p.startFrameId!==undefined&&typeof p.startFrameId!=='string')throw Error('This prototype file is damaged.');
 const document=parseDocument(JSON.stringify(p.document)),page=document.pages.find(x=>x.id===p.pageId);if(!page||!prototypeFrames(page).length||p.startFrameId!==undefined&&!page.nodes.some(n=>n.id===p.startFrameId))throw Error('This prototype file has no playable frame.');
 prototypeDocument(document,createPrototypeState(page,p.startFrameId));return {...p,document};
}
export const parsePrototypePayload=(raw:string)=>{let value:unknown;try{value=JSON.parse(raw);}catch{throw Error('This prototype file is damaged.');}return validatedPayload(value);};
export function parsePrototypeEnvelope(raw:string):{kind:'plain';payload:PrototypePayload}|{kind:'encrypted';cipher:PrototypeCipher}{
 if(typeof raw!=='string'||raw.length>PROTOTYPE_FILE_BYTES)throw Error('This prototype file is damaged.');let e:{format?:unknown;version?:unknown;payload?:unknown;encrypted?:unknown};try{e=JSON.parse(raw);}catch{throw Error('This prototype file is damaged.');}
 if(!e||typeof e!=='object'||e.format!==PROTOTYPE_FORMAT)throw Error('This prototype file is damaged.');if(e.version!==PROTOTYPE_VERSION)throw Error('This prototype file needs a newer player.');if((e.payload===undefined)===(e.encrypted===undefined))throw Error('This prototype file is damaged.');
 return e.encrypted!==undefined?{kind:'encrypted',cipher:validatePrototypeCipher(e.encrypted)}:{kind:'plain',payload:validatedPayload(e.payload)};
}
export const openPrototypeCipher=async(cipher:PrototypeCipher,password:string)=>parsePrototypePayload(await decryptPrototype(cipher,password));
export const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** JSON stays inert inside a script element: nothing a layer name contains can close it or open a comment. */
export const scriptJson=(value:unknown)=>JSON.stringify(value).replace(/[<>&\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
const inlineScript=(js:string)=>js.replace(/<\/(script)/gi,'<\\/$1').replace(/<!--/g,'<\\!--');
const inlineStyle=(css:string)=>css.replace(/<\/(style)/gi,'<\\/$1');
const sha256=async(text:string)=>bytesToBase64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))));
/** default-src 'none' with no connect target: the page cannot load or send anything. Only this exact script may run. */
export const prototypePolicy=(scriptHash:string)=>["default-src 'none'",`script-src 'sha256-${scriptHash}'`,"style-src 'unsafe-inline'",'img-src data: blob:','media-src data: blob:','font-src data:','connect-src data: blob:',"object-src 'none'","base-uri 'none'","form-action 'none'"].join('; ');
export async function prototypeFile(runtime:PrototypeRuntime,payload:PrototypePayload,password?:string){
 const body=JSON.stringify(payload),header={format:PROTOTYPE_FORMAT,version:PROTOTYPE_VERSION};
 const envelope=password===undefined?{...header,payload}:{...header,encrypted:await encryptPrototype(body,password)};
 const js=inlineScript(runtime.js),title=password===undefined?payload.title:'Protected prototype';
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(prototypePolicy(await sha256(js)))}"><meta name="referrer" content="no-referrer"><title>${escapeHtml(title||'Prototype')}</title><style>${inlineStyle(runtime.css)}</style></head><body><div id="root"></div><script type="application/json" id="${PROTOTYPE_DATA_ID}">${scriptJson(envelope)}</script><script>${js}</script></body></html>`;
 if(new TextEncoder().encode(html).byteLength>PROTOTYPE_FILE_BYTES)throw Error('This prototype is larger than the 60 MB file limit. Reduce embedded images or video.');return html;
}
/** Where the person will host the file. Nothing here is fetched; it only fills in the snippet. */
export function validatePrototypeLocation(value:string){const location=value.trim();if(!location||location.length>2048||/[\s\u0000-\u001f"'<>`\\]/.test(location))throw Error('Enter the file name or https:// address you will host it at.');const scheme=location.match(/^([a-z][a-z0-9+.-]*):/i)?.[1].toLowerCase();if(scheme&&!['http','https'].includes(scheme)||location.startsWith('//'))throw Error('Use a relative path or an http(s) address.');return location;}
export function prototypeEmbed(options:{location:string;title:string;width:number;height:number}){
 const location=validatePrototypeLocation(options.location),bound=(v:number)=>{if(!Number.isFinite(v)||v<120||v>4096)throw Error('Use an embed size of 120–4,096 px.');return Math.round(v);};
 return `<iframe src="${escapeHtml(location)}" title="${escapeHtml(options.title||'Prototype')}" width="${bound(options.width)}" height="${bound(options.height)}" style="border:0;max-width:100%" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" allow="fullscreen"></iframe>`;
}
/** The saved download. A ZIP keeps the existing native save formats unchanged, and the README travels with the file. */
export function prototypeArchive(html:string,options:{protected:boolean;embed:string}){
 const readme=['Forma prototype export','','prototype.html is the whole prototype. It works offline and loads nothing from the network.','Open it directly, or put it on any web host you control. There is no hosted Forma link yet; a server-backed link will arrive separately.',...(options.protected?['','This copy is encrypted with AES-256-GCM. Keep the password separately. Anyone with both the file and the password can read everything in it, and a weak password can be guessed.','A protected file must be opened from https:// or directly from this device, because browsers offer encryption only on secure pages.']:['','This copy is not encrypted. Anyone with the file can read everything in it, including hidden layers on the exported page.']),'','Nothing a viewer does here reaches the design file, including any notes they make.','','Embed code:',options.embed,''].join('\n');
 return zipSync({'prototype.html':strToU8(html),'README.txt':strToU8(readme)},{level:6});
}
