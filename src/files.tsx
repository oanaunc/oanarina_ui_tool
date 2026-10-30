import {formatExportSvg,svgTextNodes,validateExportHierarchy,visibleExportNodes} from './svg-export-options';
import type {SvgExportSettings} from './svg-export-options';
import {mediaExportWarnings} from './media';
import {exportCombinedArtwork,exportLayerArtwork} from './export-delivery';
import {importFigBytes,setFigImportReport} from './fig-import';
import {openDocumentForEditing,saveDocument} from './repository';
import {desktopDocuments,markDesktopSaved} from './desktop-lifecycle';
import type {DesktopBootstrap,DesktopDocumentState} from './desktop-lifecycle';
import {exportSelection,visualBounds} from './transforms';
import type {Matrix} from './transforms';
import type {FrameExportSetting} from './frame-export-settings';
import {sampleMotion} from './motion';
import {insertInstance} from './components-model';
import {renderToStaticMarkup} from 'react-dom/server';
import {assetsForUsage,fontCssForUsage,projectFontUsage,textFontUsage} from './fonts';
import {serializeFontDocument} from './font-data';
import {Artwork} from './components/Artwork';
import {LayoutGuideOverlay} from './components/LayoutGuides';
import {node,parseDocument} from './model';
import type {EditableSvgImport} from './svg-import';
import type {DesignNode} from './model';
import type {NativeClipboardRead} from './native-clipboard';
import {currentPage,useEditor} from './store';
declare global { interface Window {desktop?:{save:(name:string,data:string,base64?:boolean,saveAs?:boolean)=>Promise<boolean>;open:()=>Promise<string|null>;onCommand:(fn:(id:string)=>void)=>()=>void;fonts?:()=>Promise<string[]>;onDocument:(fn:(raw:string)=>boolean|Promise<boolean>)=>()=>void;newWindow?:(command?:string)=>Promise<boolean>;openDocument?:(raw:string)=>Promise<boolean>;openDocumentIds?:()=>Promise<string[]>;bootstrap?:()=>Promise<DesktopBootstrap>;ready?:()=>Promise<boolean>;reportDocument?:(state:DesktopDocumentState)=>Promise<boolean>;onSaveRequested?:(fn:()=>Promise<boolean>)=>()=>void;onStateRequested?:(fn:()=>DesktopDocumentState|Promise<DesktopDocumentState>)=>()=>void;beginClipboard?:(event:Event,id:string)=>void;clipboardWrite?:(representations:{nodes:string;svg:string;text:string}|{png:string})=>Promise<boolean>;clipboardRead?:()=>Promise<NativeClipboardRead>;};} }
export async function download(name:string,data:string|Blob,mime='text/plain',saveAs=false){
 if(window.desktop){const b=typeof data==='string'?data:await data.arrayBuffer().then(b=>{let s='';new Uint8Array(b).forEach(v=>s+=String.fromCharCode(v));return btoa(s);});return window.desktop.save(name,b,typeof data!=='string',saveAs);}
 const url=URL.createObjectURL(typeof data==='string'?new Blob([data],{type:mime}):data);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);return true;
}
export function serializedProject(){const s=useEditor.getState();return serializeFontDocument(s.doc,assetsForUsage(projectFontUsage(s.doc),s.doc.fonts));}
export async function saveProject(saveAs=false):Promise<boolean>{try{const s=useEditor.getState(),doc=s.doc,raw=serializeFontDocument(doc,assetsForUsage(projectFontUsage(doc),doc.fonts));if(!await download(doc.name+'.oui',raw,'application/json',saveAs))return false;if(useEditor.getState().doc.id===doc.id)s.set({savedAt:doc.updatedAt,toast:'Project saved'});await markDesktopSaved(doc);return true;}catch(e){notifyError(e);return false;}}
export function notifyError(e:unknown){useEditor.getState().set({toast:e instanceof Error?e.message:'Something went wrong.'});}
let openIntent=0;let pendingProjectOpen:AbortController|undefined;
export async function openSelectedProject(file:File){
 pendingProjectOpen?.abort();const intent=++openIntent;
 if(file.size>=50_000_000)throw Error('Choose a project smaller than 50 MB.');
 const before=useEditor.getState(),controller=new AbortController();pendingProjectOpen=controller;
 const current=()=>intent===openIntent&&useEditor.getState().doc===before.doc&&useEditor.getState().home===before.home&&useEditor.getState().pageId===before.pageId;
 const off=useEditor.subscribe(()=>{if(!current())controller.abort();});
 try{
  const isFig=/\.fig$/i.test(file.name),result=isFig?await importFigBytes(new Uint8Array(await file.arrayBuffer()),file.name,controller.signal):undefined;
  function stale(){if(!current())throw Error('The project changed while reading this file. Open it again.');}
  stale();
  const source=result?.document??parseDocument(await file.text());stale();
  try{const retained=before.home&&!before.past.length&&!before.recoveryAt?true:await saveDocument(before.doc,controller.signal);if(!retained&&before.past.length&&before.savedAt!==before.doc.updatedAt)throw Error('The current edited project cannot be retained. Save a .oui backup before opening another file.');}catch(error){controller.signal.throwIfAborted();if(before.past.length&&before.savedAt!==before.doc.updatedAt)throw Error('Your current edits could not be kept in local recovery. Save a .oui backup before opening another file.',{cause:error});}stale();
  const opened=await openDocumentForEditing(source,controller.signal);stale();
  off();desktopDocuments.mark(opened.document,isFig);useEditor.getState().load(opened.document);
  if(result){setFigImportReport({...result,document:opened.document});useEditor.getState().set({modal:'fig-import-report',toast:'Figma file imported as a new .oui project.'});}
  if(opened.warning)useEditor.getState().set({toast:opened.warning,recoveryAt:''});
  setTimeout(()=>{if(useEditor.getState().doc.id===opened.document.id)useEditor.getState().fit();},0);
 }finally{off();if(pendingProjectOpen===controller)pendingProjectOpen=undefined;}
}
export async function openProject(){try{if(window.desktop){const raw=await window.desktop.open();if(raw){const opened=await openDocumentForEditing(parseDocument(raw));useEditor.getState().load(opened.document);if(opened.warning)useEditor.getState().set({toast:opened.warning,recoveryAt:''});}}else pickFile('.oui,.json,.fig',async files=>openSelectedProject(files[0]));}catch(e){notifyError(e);}}
export function pickFile(accept:string,fn:(files:File[])=>void|Promise<void>){const input=document.createElement('input');input.type='file';input.accept=accept;input.multiple=accept.includes('image');input.hidden=true;document.body.appendChild(input);input.onchange=()=>{const files=[...(input.files??[])];input.remove();if(files.length)Promise.resolve(fn(files)).catch(notifyError);};input.addEventListener('cancel',()=>input.remove(),{once:true});input.click();}
export function exportSvg(nodes:DesignNode[],viewport?:{x:number;y:number;width:number;height:number},includeGuides=false,options?:{transform?:Matrix;scale?:number;dimensions?:{width:number;height:number};svg?:SvgExportSettings}){validateExportHierarchy(nodes);nodes=visibleExportNodes(nodes);const b=viewport??visualBounds(nodes),art=<><Artwork nodes={svgTextNodes(nodes,options?.svg)} hyperlinks/>{includeGuides&&<LayoutGuideOverlay nodes={nodes}/>}</>,fontCss=fontCssForUsage(textFontUsage(nodes),useEditor.getState().doc.fonts).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');return formatExportSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${options?.dimensions?.width??Math.ceil(b.width*(options?.scale??1))}" height="${options?.dimensions?.height??Math.ceil(b.height*(options?.scale??1))}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}">${mediaExportWarnings(nodes).map(w=>`<desc>${w}</desc>`).join('')}<style>${fontCss}</style>${renderToStaticMarkup(options?.transform?<g transform={`matrix(${options.transform.join(' ')})`}>{art}</g>:art)}</svg>`,options?.svg);}

export function exportNodes(){const s=useEditor.getState(),page=currentPage(),ns=s.motionOpen?sampleMotion(page.nodes,page.motion,s.motionTime):page.nodes;return exportSelection(ns,s.selection);}
export async function exportArtwork(format:'svg'|'png'|'jpg',scale=1,includeGuides=false){try{return await exportCombinedArtwork(format,scale,includeGuides);}catch(e){notifyError(e);return false;}}
/** Snapshot the frame, settings, geometry and embedded-font SVG before any asynchronous image or save operation. */
export async function exportFrameArtwork(id:string,setting:FrameExportSetting){const n=currentPage().nodes.find(n=>n.id===id);if(!n||n.type!=='frame')throw Error('Select one existing frame.');return exportLayerArtwork(id,setting);}
export async function importImages(files:File[]){for(const file of files){if(file.size>20_000_000)throw Error('Choose an image smaller than 20 MB.');
 if(file.name.toLowerCase().endsWith('.svg')){await importSvg(await file.text(),file.name);continue;}
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Choose PNG, JPEG, WebP, GIF or SVG.');
 const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result as string);r.onerror=()=>reject(Error('Unable to read image.'));r.readAsDataURL(file);});const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(Error('Invalid image.'));img.src=data;});useEditor.getState().add('image',{name:file.name,image:data,x:150,y:150,width:img.width,height:img.height});}}
export interface SvgImportRequest {raw:string;name:string;documentId:string;pageId:string;result?:EditableSvgImport;error?:string;resolve:()=>void;}
let svgImportRequest:SvgImportRequest|undefined;
let svgImportLoading=false;
export function getSvgImportRequest(){return svgImportRequest;}
export function cancelSvgImport(){const request=svgImportRequest;svgImportRequest=undefined;if(useEditor.getState().modal==='svg-import')useEditor.getState().set({modal:null});request?.resolve();}
export async function importSvg(raw:string,name='Imported SVG'){
 if(new TextEncoder().encode(raw).length>20_000_000)throw Error('Choose an SVG smaller than 20 MB.');
 if(svgImportRequest||svgImportLoading)throw Error('Finish the current SVG import before opening another.');svgImportLoading=true;
 const before=useEditor.getState(),documentId=before.doc.id,pageId=before.pageId;let result:EditableSvgImport|undefined,error:string|undefined;
 try{const {parseEditableSvg}=await import('./svg-import');result=parseEditableSvg(raw,name);}catch(e){error=(e as Error).message;}finally{svgImportLoading=false;}
 if(useEditor.getState().doc.id!==documentId)throw Error('The project changed while reading this SVG. Import it again.');
 await new Promise<void>(resolve=>{svgImportRequest={raw,name,documentId,pageId,result,error,resolve};useEditor.getState().set({modal:'svg-import'});});
}
/** The visual route deliberately remains separate from editable layer parsing. */
function sanitizedSvgNode(raw:string,name:string){
 if(/<!DOCTYPE|<!ENTITY/i.test(raw))throw Error('SVG document types and custom entities are not supported.');
 const xml=new DOMParser().parseFromString(raw,'image/svg+xml');if(xml.querySelector('parsererror')||xml.documentElement.localName!=='svg'||xml.documentElement.namespaceURI&&xml.documentElement.namespaceURI!=='http://www.w3.org/2000/svg')throw Error('Invalid SVG. Choose a well-formed SVG file.');
 const allowed=new Set(['svg','g','defs','path','rect','ellipse','circle','line','polyline','polygon','text','tspan','linearGradient','radialGradient','stop','clipPath','mask','filter','feGaussianBlur','feDropShadow','title','desc']);
 const elements=[...xml.querySelectorAll('*')];if(elements.length>10000)throw Error('SVG exceeds 10,000 elements.');
 for(const el of elements){let depth=0,parent=el.parentElement;while(parent){if(++depth>80)throw Error('SVG nesting exceeds 80 levels.');parent=parent.parentElement;}if(!allowed.has(el.localName)){el.remove();continue;}for(const a of [...el.attributes])if(/^on/i.test(a.name)||a.localName==='href'||/url\(\s*['"]?(?!#)/i.test(a.value)||a.name==='style'){el.removeAttribute(a.name);}}
 const root=xml.documentElement,viewBox=root.getAttribute('viewBox')?.split(/[ ,]+/).map(Number);const width=parseFloat(root.getAttribute('width')||'')||viewBox?.[2]||300,height=parseFloat(root.getAttribute('height')||'')||viewBox?.[3]||150;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>1e6||height>1e6)throw Error('SVG viewport dimensions are invalid.');
 root.setAttribute('xmlns','http://www.w3.org/2000/svg');root.setAttribute('width',String(width));root.setAttribute('height',String(height));const svg=new XMLSerializer().serializeToString(root);const data='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
 return node('image',{name,x:120,y:120,width,height,image:data});
}
export async function confirmSvgImport(mode:'editable'|'visual'){
 const request=svgImportRequest;if(!request)throw Error('No SVG import is pending.');const s=useEditor.getState();if(s.doc.id!==request.documentId)throw Error('The project changed. Cancel and import this SVG again.');
 if(mode==='editable'&&!request.result)throw Error('Editable import is unavailable for this SVG.');
 const imported=mode==='editable'?structuredClone(request.result!.nodes):[sanitizedSvgNode(request.raw,request.name)],rootId=mode==='editable'?request.result!.rootId:imported[0].id,candidate=structuredClone(s.doc),page=candidate.pages.find(p=>p.id===request.pageId);if(!page)throw Error('The target page no longer exists.');page.nodes.push(...imported);parseDocument(JSON.stringify(candidate));
 s.edit(d=>{const target=d.pages.find(p=>p.id===request.pageId);if(!target)throw Error('The target page no longer exists.');target.nodes.push(...structuredClone(imported));parseDocument(JSON.stringify(d));});
 svgImportRequest=undefined;s.set({modal:null,pageId:request.pageId,selection:[rootId],toast:mode==='editable'?'Editable SVG imported. Undo is available.':'Sanitized SVG visual asset imported. Undo is available.'});request.resolve();setTimeout(()=>{if(useEditor.getState().doc.id===request.documentId)useEditor.getState().fit(true);},0);
}

export function cssFor(n:DesignNode){return `${n.layoutGuideBindings&&Object.keys(n.layoutGuideBindings).length?'/* Responsive guide bindings: saved geometry only; recreate responsive relationships separately. */\n':''}${n.accessibilityLabel?'/* Accessibility label: '+n.accessibilityLabel.replaceAll('*/','* /')+' */\n':''}/* ${n.name.replaceAll('*/','')} */\n.${n.name.toLowerCase().replace(/[^a-z0-9]/g,'-')} {\n  width: ${n.width}px;\n  height: ${n.height}px;\n  ${n.type==='text'?'color':'background'}: ${n.fill};\n  border-radius: ${n.radius}px;${n.stroke?`\n  border: ${n.strokeWidth}px solid ${n.stroke};`:''}${n.opacity<1?`\n  opacity: ${n.opacity};`:''}${n.type==='text'?`\n  ${n.textDirection&&n.textDirection!=='auto'?'direction: '+n.textDirection+';\n  ':''}${n.textBackground?'background-color: '+n.textBackground+';\n  ':''}font-family: "${n.fontFamily}";\n  font-size: ${n.fontSize}px;\n  font-weight: ${n.fontWeight};\n  line-height: ${n.lineHeightPx===undefined?n.lineHeight:n.lineHeightPx+'px'};\n  letter-spacing: ${n.letterSpacing}px;`:''}${n.layout!=='none'?`\n  display: ${n.layout==='grid'?'grid':'flex'};\n  ${n.layout==='grid'?`grid-template-columns: repeat(${n.columns}, 1fr)`:`flex-direction: ${n.layout==='horizontal'?'row':'column'}`};\n  gap: ${n.gap}px;\n  padding: ${n.padding}px;`:''}\n}`;}
export function createInstance(id:string){const s=useEditor.getState();let instance='';try{s.edit(d=>{instance=insertInstance(d,s.pageId,id);});s.set({selection:[instance]});}catch(e){notifyError(e);}}
export const makeNode=node;
