import {packedProject} from './image-sharing';
import {create} from 'zustand';
import {useEditor} from './store';
import type {DesignDocument} from './model';
import {brandAsset,brandExportPlan,brandOf,brandTemplate} from './brand-assets';
import type {BrandImage} from './brand-assets';
import {brandImageKey} from './brand-sheet';
import {exportBrandPackage,parseBrandPackage} from './brand-package';
import {exportAssetBatch,layerExportJob} from './export-delivery';
import type {ExportJob} from './export-delivery';
import {EXPORT_ASSET_LIMIT} from './export-plan';
import {desktopDocuments} from './desktop-lifecycle';
import {createLocalFolder,listLocalFiles,openDocumentForEditing,saveDocument,updateFileMetadata} from './repository';
import {readImageAsset} from './image-asset';
import {download} from './files';
export type BrandTab='assets'|'templates'|'kit'|'layers';
interface BrandView {tab:BrandTab;checked:string[];historyAssetId:string|null;set:(p:Partial<Omit<BrandView,'set'>>)=>void;}
/** Panel state only. It is never written to a document. */
export const useBrandView=create<BrandView>(set=>({tab:'assets',checked:[],historyAssetId:null,set}));
export function brandActionIssue(){const s=useEditor.getState();if(!s.doc.brand)return 'Open a brand project first.';if(s.home||s.uiHidden||s.motionOpen||s.mode!=='design')return 'Close Motion and use the visible Design canvas before changing brand assets.';return '';}
/** Every panel action goes through the store, so locks, brand values and Undo apply exactly as they do on the canvas. */
export function brandEdit<T>(fn:(d:DesignDocument)=>T,toast?:string):T{const issue=brandActionIssue();if(issue)throw Error(issue);let result:T;useEditor.getState().edit(d=>{result=fn(d);});if(toast)useEditor.getState().set({toast});return result!;}
export function showBrandTab(tab:BrandTab){const s=useEditor.getState(),brand=s.doc.brand;useBrandView.getState().set({tab});if(!brand||tab==='layers'||tab==='kit')return;const pageId=tab==='assets'?brand.assetPageId:brand.templatePageId;if(s.pageId!==pageId)s.selectPage(pageId);}
export function showBrandAsset(id:string){const s=useEditor.getState(),brand=brandOf(s.doc),asset=brandAsset(s.doc,id);if(s.pageId!==brand.assetPageId)s.selectPage(brand.assetPageId);useEditor.getState().set({selection:[asset.frameId],mode:'design'});useEditor.getState().findSelection();}
export function showBrandTemplate(id:string){const s=useEditor.getState(),brand=brandOf(s.doc),t=brandTemplate(s.doc,id);if(s.pageId!==brand.templatePageId)s.selectPage(brand.templatePageId);useEditor.getState().set({selection:[t.frameId],mode:'design'});useEditor.getState().findSelection();}
export function showBrandLayer(pageId:string,nodeId:string){const s=useEditor.getState();if(s.pageId!==pageId)s.selectPage(pageId);useEditor.getState().set({selection:[nodeId],mode:'design'});useEditor.getState().findSelection();}
/** Keep this window's edits: native builds open a new window, browsers save recovery before switching. */
export async function openBrandProject(doc:DesignDocument){const before=useEditor.getState();if(typeof window!=='undefined'&&window.desktop?.openDocument){if(!await window.desktop.openDocument(packedProject(doc)))throw Error('The new brand project window could not be opened.');useEditor.getState().set({toast:'Brand project opened in a new window'});return;}const mustRetain=desktopDocuments.state(before.doc).dirty||before.past.length>0&&before.savedAt!==before.doc.updatedAt;try{const retained=await saveDocument(before.doc);if(!retained&&mustRetain)throw Error('The current edited project cannot be retained.');}catch(e){if(mustRetain)throw Error('Save a .oui backup of the current edits before creating another file.',{cause:e});}const opened=await openDocumentForEditing(doc);desktopDocuments.mark(opened.document,true);useBrandView.getState().set({tab:'assets',checked:[],historyAssetId:null});useEditor.getState().load(opened.document);useEditor.getState().set({modal:null,toast:opened.warning??'New local brand project'});}
/** Read attached images once, keyed by file name, so spreadsheet cells can name them. */
export async function readBrandImages(files:readonly File[]){if(files.length>200)throw Error('Attach up to 200 images.');if(files.reduce((n,f)=>n+f.size,0)>40_000_000)throw Error('Attach up to 40 MB of images at a time.');const out=new Map<string,BrandImage>();for(const file of files){const key=brandImageKey(file.name);if(out.has(key))throw Error(`Two attached images are named “${file.name}”.`);const image=await readImageAsset(file);out.set(key,{image:image.image,width:image.imageWidth,height:image.imageHeight,name:file.name});}return out;}
export interface BrandExportOptions {format:'png'|'jpg'|'svg';scale:number;approvedOnly:boolean;}
/** Render real frames through the shared delivery pipeline. Page, Motion and selection are checked before any bytes are produced. */
export function brandExportJobs(ids:readonly string[],options:BrandExportOptions){const issue=brandActionIssue();if(issue)throw Error(issue);const s=useEditor.getState(),brand=brandOf(s.doc);if(s.pageId!==brand.assetPageId)s.selectPage(brand.assetPageId);const plan=brandExportPlan(useEditor.getState().doc,ids,{approvedOnly:options.approvedOnly});if(!plan.length)throw Error(options.approvedOnly?'None of these assets are approved yet.':'Choose at least one asset.');if(plan.length>EXPORT_ASSET_LIMIT)throw Error(`Export up to ${EXPORT_ASSET_LIMIT} assets at a time. Narrow the filter or select fewer assets.`);return plan.map((entry):ExportJob=>({...layerExportJob(entry.frameId,{id:'brand-export',format:options.format,scale:options.scale,suffix:'',bounds:'frame',includeGuides:false,...(options.format==='jpg'?{quality:.92}:{})}),name:`${entry.fileBase}.${options.format}`}));}
export async function exportBrandAssets(ids:readonly string[],options:BrandExportOptions,onProgress?:(done:number,total:number)=>void,signal?:AbortSignal){const jobs=brandExportJobs(ids,options),s=useEditor.getState();const saved=await exportAssetBatch({name:s.doc.name+' assets',documentName:s.doc.name,pageName:'Assets',jobs},onProgress,signal);return {saved,count:jobs.length};}
export async function saveBrandPackage(){const s=useEditor.getState(),pkg=exportBrandPackage(s.doc);return download(s.doc.name.replace(/[/\\:*?"<>|]+/g,' ').trim()+'.formabrand.json',JSON.stringify(pkg),'application/json');}
export async function readBrandPackageFile(file:File){if(file.size>20_000_000)throw Error('Brand packages support up to 20 MB.');return parseBrandPackage(await file.text());}
/** Campaign folders are the local file browser's folders; this only reads and writes that metadata. */
export async function brandCampaignState(){const s=useEditor.getState();await saveDocument(s.doc);const {entries,organization}=await listLocalFiles(),entry=entries.find(e=>e.doc.id===s.doc.id);return {folders:organization.folders,folderId:entry?.metadata.folderId??null,revision:entry?.metadata.revision};}
export async function moveBrandToCampaign(folderId:string|null,revision?:number){const s=useEditor.getState();await saveDocument(s.doc);await updateFileMetadata(s.doc.id,{folderId},revision);}
export async function createBrandCampaign(name:string){const folder=await createLocalFolder(name),state=await brandCampaignState();await moveBrandToCampaign(folder.id,state.revision);return folder.id;}
