import {validatePassThroughExportSource} from './pass-through';
import {shaderExportWarnings} from './shader-export';
import {openSketchProjectFile,getSketchReview,cancelSketchReview} from './sketch-import';
import {openPdfProjectFile,getPdfImportReview,cancelPdfImportReview} from './pdf-import';
import {validateDocumentNetworks} from './vector-network';
import {validateBackgroundBlurExportSource} from './background-blur';
import {currentTextOutline} from './text-outline';
import {svgOutlinedTextPlan} from './svg-text-outlines';
import {isFigmaRestJson,importFigmaRestJson,FIGMA_REST_LIMITS} from './figma-rest-import';
import {getFigmaRestReview,requestFigmaRestReview,checkFigmaRestReview,finishFigmaRestReview,cancelFigmaRestReview} from './figma-rest-review';
import type {FigmaRestReview} from './figma-rest-review';
import {textPathExportWarnings} from './text-path-bounds';
import {validateDocumentTextPaths} from './text-path';
import {importRasterHeader} from './import-raster-header';
import {captureColorContext,sameColorContext} from './color-edit-context';
import {beginImportSession} from './import-session';
import {ImportInputError,readImportFile,decodeImportImage,svgImportFailureReason} from './import-task';
import {embeddedImageInfo} from './image-paint';
import {drawingDefaults} from './preferences';
import {svgSimplifiedStrokePlan,simplifySvgStrokeMarkup} from './svg-simplify-strokes';
import {svgStrokeOutlineNodes} from './svg-stroke-outlines';
import {fontFamilyStack} from './font-fallback';
import {formatExportSvg,svgTextNodes,validateSvgExportSettings,validateExportHierarchy,visibleExportNodes} from './svg-export-options';
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
import {assetsForUsage,fontCssForUsage,projectFontUsage,textFontUsage,activeRegisteredFontAssetsForFamilies} from './fonts';
import {serializeFontDocument} from './font-data';
import {Artwork} from './components/Artwork';
import {LayoutGuideOverlay} from './components/LayoutGuides';
import {node,parseDocument} from './model';
import type {EditableSvgImport} from './svg-import';
import type {DesignNode} from './model';
import type {NativeClipboardRead} from './native-clipboard';
import {currentPage,useEditor} from './store';
declare global { interface Window {desktop?:{save:(name:string,data:string,base64?:boolean,saveAs?:boolean)=>Promise<boolean>;open:()=>Promise<string|null>;onCommand:(fn:(id:string)=>void)=>()=>void;fonts?:()=>Promise<string[]>;onDocument:(fn:(raw:string)=>boolean|Promise<boolean>)=>()=>void;newWindow?:(command?:string)=>Promise<boolean>;openDocument?:(raw:string)=>Promise<boolean>;openDocumentIds?:()=>Promise<string[]>;bootstrap?:()=>Promise<DesktopBootstrap>;ready?:()=>Promise<boolean>;reportDocument?:(state:DesktopDocumentState)=>Promise<boolean>;onSaveRequested?:(fn:()=>Promise<boolean>)=>()=>void;onStateRequested?:(fn:()=>DesktopDocumentState|Promise<DesktopDocumentState>)=>()=>void;beginClipboard?:(event:Event,id:string)=>void;clipboardWrite?:(representations:{nodes:string;svg:string;text:string}|{png:string})=>Promise<boolean>;clipboardRead?:()=>Promise<NativeClipboardRead>;};} }
export async function download(name:string,data:string|Blob,mime='text/plain',saveAs=false,beforeSave?:()=>void){
 if(window.desktop){const b=typeof data==='string'?data:await data.arrayBuffer().then(b=>{let s='';new Uint8Array(b).forEach(v=>s+=String.fromCharCode(v));return btoa(s);});beforeSave?.();return window.desktop.save(name,b,typeof data!=='string',saveAs);}
 beforeSave?.(); const url=URL.createObjectURL(typeof data==='string'?new Blob([data],{type:mime}):data);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);return true;
}
export function serializedProject(){const s=useEditor.getState();return serializeFontDocument(s.doc,assetsForUsage(projectFontUsage(s.doc),s.doc.fonts));}
export async function saveProject(saveAs=false):Promise<boolean>{try{const s=useEditor.getState(),doc=s.doc,raw=serializeFontDocument(doc,assetsForUsage(projectFontUsage(doc),doc.fonts));if(!await download(doc.name+'.oui',raw,'application/json',saveAs))return false;if(useEditor.getState().doc.id===doc.id)s.set({savedAt:doc.updatedAt,toast:'Project saved'});await markDesktopSaved(doc);return true;}catch(e){notifyError(e);return false;}}
export function notifyError(e:unknown){useEditor.getState().set({toast:e instanceof Error?e.message:'Something went wrong.'});}
export async function openSelectedProject(file:File){
 const pendingSketch=getSketchReview();if(pendingSketch)cancelSketchReview(pendingSketch);if(/\.sketch$/i.test(file.name))return openSketchProjectFile(file);
 const pendingPdf=getPdfImportReview();if(pendingPdf)cancelPdfImportReview(pendingPdf);if(/\.pdf$/i.test(file.name))return openPdfProjectFile(file);
 const pendingRest=getFigmaRestReview();if(pendingRest)cancelFigmaRestReview(pendingRest);
 const isFig=/\.fig$/i.test(file.name),session=beginImportSession(isFig?'fig':'project',1,file.size),{task}=session,before=useEditor.getState();
 try{
  if(file.size>=50_000_000)throw new ImportInputError('Choose a project smaller than 50 MB.');
  const raw=await readImportFile(file,isFig?'bytes':'text',task.signal,bytes=>task.update({bytes}));session.check();
  await task.checkpoint('validating');session.check();
  const result=isFig?await importFigBytes(new Uint8Array(raw as ArrayBuffer),file.name,task.signal,stage=>task.update({stage})):undefined;
  let source=result?.document;
  if(!isFig){const json=JSON.parse(raw as string);if(isFigmaRestJson(json)){task.update({format:'rest'});if(file.size>FIGMA_REST_LIMITS.bytes)throw new ImportInputError('Choose Figma REST JSON smaller than 20 MB.');const converted=importFigmaRestJson(json,file.name.replace(/\.json$/i,''));session.check();session.dispose();task.finish();const review=await requestFigmaRestReview(converted);return review?openReviewedFigmaRest(review):undefined;}source=parseDocument(raw as string);}session.check();if(!source)throw new ImportInputError('The selected project could not be converted.');
  await task.checkpoint('retaining');session.check();
  const mustRetain=desktopDocuments.state(before.doc).dirty||before.past.length>0&&before.savedAt!==before.doc.updatedAt;
  try{const retained=await saveDocument(before.doc,task.signal);if(!retained&&mustRetain)throw new ImportInputError('The current edited project cannot be retained. Save a .oui backup before opening another file.');}catch(error){task.signal.throwIfAborted();if(mustRetain)throw new ImportInputError('Your current edits could not be kept in local recovery. Save a .oui backup before opening another file.');}session.check();
  await task.checkpoint('opening');session.check();const opened=await openDocumentForEditing(source,task.signal);session.check();
  session.dispose();task.finish();desktopDocuments.mark(opened.document,isFig);useEditor.getState().load(opened.document);
  if(result){setFigImportReport({...result,document:opened.document});useEditor.getState().set({modal:'fig-import-report',toast:'Figma file imported as a new .oui project.'});}
  if(opened.warning)useEditor.getState().set({toast:opened.warning,recoveryAt:''});
  const loaded=useEditor.getState();setTimeout(()=>{if(useEditor.getState().doc===loaded.doc&&useEditor.getState().pageId===loaded.pageId)useEditor.getState().fit();},0);
 }catch(error){const reason=task.fail(error);if(!task.signal.aborted)throw new Error(reason??'The import could not finish.');}finally{session.dispose();}
}
/** Review confirmation uses a fresh abortable delivery session; no source mutation before every validation succeeds. */
async function openReviewedFigmaRest(review:FigmaRestReview){
 checkFigmaRestReview(review);const session=beginImportSession('rest',1,0),{task}=session,before=useEditor.getState();
 try{
  await task.checkpoint('validating');session.check();checkFigmaRestReview(review);const source=parseDocument(JSON.stringify(review.result.document));
  await task.checkpoint('retaining');session.check();const mustRetain=desktopDocuments.state(before.doc).dirty||before.past.length>0&&before.savedAt!==before.doc.updatedAt;
  try{const retained=await saveDocument(before.doc,task.signal);if(!retained&&mustRetain)throw Error();}catch{task.signal.throwIfAborted();if(mustRetain)throw new ImportInputError('Your current edits could not be kept in local recovery. Save a .oui backup before opening another file.');}session.check();checkFigmaRestReview(review);
  await task.checkpoint('opening');session.check();const opened=await openDocumentForEditing(source,task.signal);session.check();checkFigmaRestReview(review);
  session.dispose();task.finish();finishFigmaRestReview(review);desktopDocuments.mark(opened.document,true);useEditor.getState().load(opened.document);setFigImportReport({...review.result,document:opened.document,source:'rest'});useEditor.getState().set({modal:'fig-import-report',toast:opened.warning??'Figma REST JSON imported as a new .oui project.'});
  const loaded=useEditor.getState();setTimeout(()=>{if(useEditor.getState().doc===loaded.doc&&useEditor.getState().pageId===loaded.pageId)useEditor.getState().fit();},0);
 }catch(error){const reason=task.fail(error);cancelFigmaRestReview(review);if(!task.signal.aborted)throw new Error(reason??'The REST JSON import could not finish.');}finally{session.dispose();}
}
/** Capture before opening the chooser; source transitions invalidate permanently even if it returns later. */
export function chooseFigmaRestJson(expected=captureColorContext(useEditor.getState())){
 if(!sameColorContext(expected,useEditor.getState())||expected.modal!==null&&expected.modal!=='figma')return;
 if(expected.modal==='figma')useEditor.getState().set({modal:null});
 const origin=captureColorContext(useEditor.getState()),input=document.createElement('input');let valid=true,done=false;
 input.type='file';input.accept='.json';input.hidden=true;document.body.appendChild(input);
 const off=useEditor.subscribe(live=>{if(!sameColorContext(origin,live)){valid=false;off();}});
 const dispose=()=>{done=true;valid=false;off();input.remove();};
 input.onchange=()=>{if(done)return;const file=input.files?.[0],current=valid&&sameColorContext(origin,useEditor.getState());dispose();if(file&&current)void openSelectedProject(file).catch(notifyError);};
 input.addEventListener('cancel',dispose,{once:true});try{input.click();}catch{dispose();}
}
export async function openProject(){try{if(window.desktop){const raw=await window.desktop.open();if(raw){const opened=await openDocumentForEditing(parseDocument(raw));useEditor.getState().load(opened.document);if(opened.warning)useEditor.getState().set({toast:opened.warning,recoveryAt:''});}}else pickFile('.oui,.json,.fig,.pdf,.sketch',async files=>openSelectedProject(files[0]));}catch(e){notifyError(e);}}
export function pickFile(accept:string,fn:(files:File[])=>void|Promise<void>){const input=document.createElement('input');input.type='file';input.accept=accept;input.multiple=accept.includes('image');input.hidden=true;document.body.appendChild(input);input.onchange=()=>{const files=[...(input.files??[])];input.remove();if(files.length)Promise.resolve(fn(files)).catch(notifyError);};input.addEventListener('cancel',()=>input.remove(),{once:true});input.click();}
export function prepareSvgTextOutlines(nodes:DesignNode[]){const s=useEditor.getState();return svgOutlinedTextPlan(nodes,{embedded:s.doc.fonts??[],registered:activeRegisteredFontAssetsForFamilies(nodes.filter(n=>n.type==='text'&&currentTextOutline(n)===undefined).map(n=>n.fontFamily)),ready:typeof document!=='undefined'&&document.fonts.status==='loaded'});}
export function exportSvg(nodes:DesignNode[],viewport?:{x:number;y:number;width:number;height:number},includeGuides=false,options?:{transform?:Matrix;scale?:number;dimensions?:{width:number;height:number};svg?:SvgExportSettings}){validateSvgExportSettings(options?.svg);validateDocumentNetworks({pages:[{nodes}]});validateExportHierarchy(nodes);validateDocumentTextPaths({pages:[{nodes}]});nodes=visibleExportNodes(nodes);const outlined=options?.svg?.textMode==='outline'?(includeGuides?(()=>{throw Error('SVG text outlines do not support generated layout-guide labels. Turn guides off.');})():prepareSvgTextOutlines(nodes)):undefined;if(outlined)nodes=outlined.nodes;const b=viewport??outlined?.bounds??visualBounds(nodes);nodes=svgStrokeOutlineNodes(nodes,options?.svg?.outlineStrokes);const simplified=options?.svg?.simplifyStrokes?svgSimplifiedStrokePlan(nodes):new Map();const rasterScale=options?.dimensions?options.dimensions.width/Math.max(1e-6,b.width):options?.scale??1,art=<><Artwork nodes={svgTextNodes(nodes,options?.svg)} hyperlinks rasterScale={rasterScale}/>{includeGuides&&<LayoutGuideOverlay nodes={nodes}/>}</>,fontCss=(options?.svg?.textMode==='outline'?'':fontCssForUsage(textFontUsage(nodes),useEditor.getState().doc.fonts)).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');return formatExportSvg(simplifySvgStrokeMarkup(`<svg xmlns="http://www.w3.org/2000/svg" width="${options?.dimensions?.width??Math.ceil(b.width*(options?.scale??1))}" height="${options?.dimensions?.height??Math.ceil(b.height*(options?.scale??1))}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}">${[...(nodes.some(n=>n.prototypeInput)?['Prototype form simulation is omitted; this SVG contains saved base artwork only.']:[]),...mediaExportWarnings(nodes),...textPathExportWarnings(nodes),...shaderExportWarnings(nodes,useEditor.getState().doc)].map(w=>`<desc>${w}</desc>`).join('')}<style>${fontCss}</style>${renderToStaticMarkup(options?.transform?<g transform={`matrix(${options.transform.join(' ')})`}>{art}</g>:art)}</svg>`,simplified),options?.svg);}

export function exportNodes(){const s=useEditor.getState(),page=currentPage(),ns=s.motionOpen?sampleMotion(page.nodes,page.motion,s.motionTime):page.nodes;const result=exportSelection(ns,s.selection);validateBackgroundBlurExportSource(ns,result);validatePassThroughExportSource(ns,result);return result;}
export async function exportArtwork(format:'svg'|'png'|'jpg',scale=1,includeGuides=false){try{return await exportCombinedArtwork(format,scale,includeGuides);}catch(e){notifyError(e);return false;}}
/** Snapshot the frame, settings, geometry and embedded-font SVG before any asynchronous image or save operation. */
export async function exportFrameArtwork(id:string,setting:FrameExportSetting){const n=currentPage().nodes.find(n=>n.id===id);if(!n||n.type!=='frame')throw Error('Select one existing frame.');return exportLayerArtwork(id,setting);}
export async function importImages(files:File[]){
 if(!files.length)return;
 const svg=files.filter(file=>/\.svg$/i.test(file.name));
 if(svg.length===1&&files.length===1){const session=beginImportSession('svg',1,files[0].size),{task}=session;try{if(session.check().doc.workspace==='slides')throw new ImportInputError('Use the Slides Image button to place images on the active slide. Generic artwork import is available in Design and Whiteboard.');if(files[0].size>20_000_000)throw new ImportInputError('Choose an SVG smaller than 20 MB.');const raw=await readImportFile(files[0],'text',task.signal,bytes=>task.update({bytes}));session.check();session.dispose();task.finish();await importSvg(raw as string,files[0].name);}catch(error){const reason=task.fail(error);if(!task.signal.aborted)throw new Error(reason??'SVG import could not finish.');}finally{session.dispose();}return;}
 const session=beginImportSession('raster',files.length,files.reduce((sum,f)=>sum+f.size,0)),{task}=session;
 try{
  const s=session.check();if(s.doc.workspace==='slides')throw new ImportInputError('Use the Slides Image button to place images on the active slide. Generic artwork import is available in Design and Whiteboard.');if(s.home||s.uiHidden||s.motionOpen||s.modal||s.mode!=='design')throw new ImportInputError('Use the visible Design canvas with Motion and dialogs closed to import artwork.');
  if(svg.length)throw new ImportInputError('Import one SVG at a time to review editable layers or a sanitized visual asset. Import raster images as a separate batch.');
  if(files.length>32||files.reduce((sum,f)=>sum+f.size,0)>32_000_000)throw new ImportInputError('Import at most 32 images and 32 MB of source bytes per batch.');
  if((s.doc.pages.find(p=>p.id===s.pageId)?.nodes.length??20_000)+files.length>20_000)throw new ImportInputError('This batch would exceed the 20,000-layer page limit.');
  const imported:DesignNode[]=[];let bytes=0,pixels=0;
  for(const [i,file] of files.entries()){
   if(file.size>20_000_000)throw new ImportInputError('Choose images smaller than 20 MB each.');
   if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw new ImportInputError('Choose PNG, JPEG, WebP, GIF or a separate SVG file.');
   task.update({file:i+1,stage:'reading'});const data=await readImportFile(file,'data',task.signal,n=>task.update({bytes:bytes+n})) as string;session.check();bytes+=file.size;
   await task.checkpoint('validating');session.check();const info=embeddedImageInfo(data);if(info.bytes!==file.size||info.mime!==file.type)throw new ImportInputError('The selected image bytes do not match their declared file type.');
   const header=importRasterHeader(data);if(pixels+header.width*header.height>80_000_000)throw new ImportInputError('This image batch exceeds 80 million decoded pixels. Import smaller batches.');
   await task.checkpoint('decoding');const size=await decodeImportImage(data,task.signal);session.check();pixels+=size.width*size.height;if(pixels>80_000_000)throw new ImportInputError('This image batch exceeds 80 million decoded pixels. Import smaller batches.');
   imported.push(node('image',{...drawingDefaults('image'),name:file.name,image:data,x:150,y:150,width:size.width,height:size.height}));
  }
  await task.checkpoint('validating');const live=session.check(),candidate=structuredClone(live.doc),page=candidate.pages.find(p=>p.id===live.pageId);if(!page)throw new ImportInputError('The destination page no longer exists.');page.nodes.push(...imported);if(new TextEncoder().encode(JSON.stringify(candidate)).byteLength>=50_000_000)throw new ImportInputError('The imported project would exceed the 50 MB readable-file limit.');parseDocument(JSON.stringify(candidate));session.check();
  session.dispose();live.edit(d=>{const target=d.pages.find(p=>p.id===live.pageId);if(!target)throw new ImportInputError('The destination page no longer exists.');target.nodes.push(...structuredClone(imported));parseDocument(JSON.stringify(d));});task.finish();live.set({selection:imported.map(n=>n.id),toast:`${imported.length} image${imported.length===1?'':'s'} imported. Undo is available.`});
 }catch(error){const reason=task.fail(error);if(!task.signal.aborted)throw new Error(reason??'Image import could not finish.');}finally{session.dispose();}
}
export interface SvgImportRequest {raw:string;name:string;documentId:string;pageId:string;result?:EditableSvgImport;error?:string;resolve:()=>void;valid:boolean;applying:boolean;origin:ReturnType<typeof captureColorContext>;dispose:()=>void;}
let svgImportRequest:SvgImportRequest|undefined;
let svgImportLoading=false;
export function getSvgImportRequest(){return svgImportRequest;}
export function cancelSvgImport(expected?:SvgImportRequest){const request=svgImportRequest;if(expected&&expected!==request)return;svgImportRequest=undefined;request?.dispose();if(useEditor.getState().modal==='svg-import')useEditor.getState().set({modal:null});request?.resolve();}
export async function importSvg(raw:string,name='Imported SVG'){
 if(svgImportRequest||svgImportLoading)throw Error('Finish the current SVG import before opening another.');svgImportLoading=true;
 const session=beginImportSession('svg',1,new TextEncoder().encode(raw).length),{task}=session;let result:EditableSvgImport|undefined,error:string|undefined;
 try{
  if(new TextEncoder().encode(raw).length>20_000_000)throw new ImportInputError('Choose an SVG smaller than 20 MB.');
  const source=session.check();if(source.doc.workspace==='slides')throw new ImportInputError('SVG review is available in Design and Whiteboard. Use the Slides Image button for raster images on the active slide.');if(source.home||source.uiHidden||source.motionOpen||source.modal||source.mode!=='design')throw new ImportInputError('Use the visible Design canvas with Motion and dialogs closed to import SVG.');
  await task.checkpoint('validating');const {parseEditableSvg}=await import('./svg-import');session.check();try{result=parseEditableSvg(raw,name);}catch(e){error=svgImportFailureReason(e);}
  session.check();session.dispose();task.finish();svgImportLoading=false;
  await new Promise<void>(resolve=>{const before=useEditor.getState();let off=()=>{};const request:SvgImportRequest={raw,name,documentId:before.doc.id,pageId:before.pageId,result,error,resolve,valid:true,applying:false,origin:captureColorContext({...before,modal:'svg-import'}),dispose:()=>{request.valid=false;off();}};svgImportRequest=request;off=useEditor.subscribe(live=>{if(!request.applying&&!sameColorContext(request.origin,live))cancelSvgImport(request);});before.set({modal:'svg-import'});});
 }catch(e){const reason=task.fail(e);if(!task.signal.aborted)throw new Error(reason??'SVG import could not finish.');}finally{session.dispose();svgImportLoading=false;}
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
export async function confirmSvgImport(mode:'editable'|'visual',expected?:SvgImportRequest){
 const request=svgImportRequest;if(!request||expected&&expected!==request)throw Error('No matching SVG import is pending.');const s=useEditor.getState();if(!request.valid||!sameColorContext(request.origin,s))throw Error('The project or import context changed. Cancel and import this SVG again.');
 if(mode==='editable'&&!request.result)throw Error('Editable import is unavailable for this SVG.');
 const imported=mode==='editable'?structuredClone(request.result!.nodes):[sanitizedSvgNode(request.raw,request.name)],rootId=mode==='editable'?request.result!.rootId:imported[0].id,candidate=structuredClone(s.doc),page=candidate.pages.find(p=>p.id===request.pageId);if(!page)throw Error('The target page no longer exists.');page.nodes.push(...imported);if(new TextEncoder().encode(JSON.stringify(candidate)).byteLength>=50_000_000)throw Error('The SVG would exceed the 50 MB project limit.');parseDocument(JSON.stringify(candidate));
 request.applying=true;try{s.edit(d=>{const target=d.pages.find(p=>p.id===request.pageId);if(!target)throw Error('The target page no longer exists.');target.nodes.push(...structuredClone(imported));parseDocument(JSON.stringify(d));});}finally{request.applying=false;}request.dispose();
 svgImportRequest=undefined;s.set({modal:null,pageId:request.pageId,selection:[rootId],toast:mode==='editable'?'Editable SVG imported. Undo is available.':'Sanitized SVG visual asset imported. Undo is available.'});request.resolve();const loaded=useEditor.getState();setTimeout(()=>{if(useEditor.getState().doc===loaded.doc&&useEditor.getState().pageId===loaded.pageId&&JSON.stringify(useEditor.getState().selection)===JSON.stringify(loaded.selection))useEditor.getState().fit(true);},0);
}

export function cssFor(n:DesignNode){return `${n.prototypeInput?'/* Prototype form controls are omitted; saved base artwork only. */\n':''}${n.textPath?'/* Curved text baseline and start offset require SVG; not reproduced by this CSS rule. */\n':''}${n.strokes?.some(s=>s.edgeWidths)?'/* Independent edge strokes: not reproduced by this CSS rule; use SVG export. */\n':''}${n.textVerticalTrim==='cap-height'?'/* Vertical cap-height trim: measured SVG baselines; not reproduced by this CSS rule. */\n':''}${n.hangingQuotes?'/* Hanging quotation marks: measured SVG offsets; not reproduced by this CSS rule. */\n':''}${n.layoutGuideBindings&&Object.keys(n.layoutGuideBindings).length?'/* Responsive guide bindings: saved geometry only; recreate responsive relationships separately. */\n':''}${n.accessibilityLabel?'/* Accessibility label: '+n.accessibilityLabel.replaceAll('*/','* /')+' */\n':''}/* ${n.name.replaceAll('*/','')} */\n.${n.name.toLowerCase().replace(/[^a-z0-9]/g,'-')} {\n  width: ${n.width}px;\n  height: ${n.height}px;\n  ${n.type==='text'?'color':'background'}: ${n.fill};\n  border-radius: ${n.radius}px;${n.stroke&&!n.strokes?.some(s=>s.edgeWidths)?`\n  border: ${n.strokeWidth}px solid ${n.stroke};`:''}${n.opacity<1?`\n  opacity: ${n.opacity};`:''}${n.type==='text'?`\n  ${n.textWrap&&n.textWrap!=='normal'?'text-wrap: '+n.textWrap+'; /* browser approximation */\n  ':''}${n.textDirection&&n.textDirection!=='auto'?'direction: '+n.textDirection+';\n  ':''}${n.textBackground?'background-color: '+n.textBackground+';\n  ':''}font-family: ${fontFamilyStack(n)};\n  font-size: ${n.fontSize}px;\n  font-weight: ${n.fontWeight};\n  line-height: ${n.lineHeightPx===undefined?n.lineHeight:n.lineHeightPx+'px'};\n  letter-spacing: ${n.letterSpacing}px;`:''}${n.layout!=='none'?`\n  display: ${n.layout==='grid'?'grid':'flex'};\n  ${n.layout==='grid'?`grid-template-columns: repeat(${n.columns}, 1fr)`:`flex-direction: ${n.layout==='horizontal'?'row':'column'}`};\n  gap: ${n.gap}px;\n  padding: ${n.padding}px;`:''}\n}`;}
export function createInstance(id:string){const s=useEditor.getState();let instance='';try{s.edit(d=>{instance=insertInstance(d,s.pageId,id);});s.set({selection:[instance]});}catch(e){notifyError(e);}}
export const makeNode=node;
