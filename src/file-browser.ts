import {parseDocument} from './model';
import {brandSearchText} from './brand-assets';
import type {DesignDocument} from './model';
export interface LocalFolder {id:string;name:string;createdAt:string;}
export interface LocalFileMetadata {id:string;folderId:string|null;starred:boolean;pinned:boolean;archived:boolean;trashedAt?:string;deleted?:boolean;lastOpenedAt?:string;revision:number;}
export interface FileBrowserState {version:1;folders:LocalFolder[];files:LocalFileMetadata[];}
export interface LocalFileEntry {doc:DesignDocument;metadata:LocalFileMetadata;}
export type FileView='recent'|'all'|'drafts'|'starred'|'pinned'|'archive'|'trash';
export type FileSort='modified-desc'|'modified-asc'|'name-asc'|'name-desc'|'opened-desc';
export interface FileBrowserPreferences {layout:'grid'|'list';sort:FileSort;type:'all'|'design'|'whiteboard'|'slides'|'brand';}
export const localFileType=(doc:Pick<DesignDocument,'brand'|'workspace'>)=>doc.brand?'brand':doc.workspace??'design';
export const FILE_BROWSER_PREFERENCES_KEY='oui-file-browser';
export const defaultFileBrowserPreferences:FileBrowserPreferences={layout:'grid',sort:'modified-desc',type:'all'};
const validId=(id:unknown):id is string=>typeof id==='string'&&id.length>0&&id.length<=500&&!/[\u0000-\u001f]/.test(id);
const validDate=(date:unknown):date is string=>typeof date==='string'&&Number.isFinite(Date.parse(date));
export function localName(value:string,kind='Name'){const name=value.trim();if(!name||name.length>120||/[\u0000-\u001f]/.test(name))throw Error(`${kind} must contain 1–120 characters without control characters.`);return name;}
export function defaultFileMetadata(id:string):LocalFileMetadata{if(!validId(id))throw Error('Invalid local file identity.');return{id,folderId:null,starred:false,pinned:false,archived:false,revision:0};}
/** Organization is local metadata, never a document schema extension. */
export function validateFileBrowserState(value:unknown):FileBrowserState{
 if(value===undefined)return{version:1,folders:[],files:[]};
 const invalid=()=>Error('Local file organization is invalid. Your saved projects have not been removed.');
 if(!value||typeof value!=='object'||Array.isArray(value))throw invalid();const s=value as FileBrowserState;
 if(s.version!==1||!Array.isArray(s.folders)||s.folders.length>200||!Array.isArray(s.files)||s.files.length>10000)throw invalid();
 const folders=new Set<string>(),files=new Set<string>();
 for(const f of s.folders){if(!f||!validId(f.id)||folders.has(f.id)||typeof f.name!=='string'||f.name!==localName(f.name,'Folder name')||!validDate(f.createdAt))throw invalid();folders.add(f.id);}
 for(const f of s.files){if(!f||!validId(f.id)||files.has(f.id)||!(f.folderId===null||typeof f.folderId==='string'&&folders.has(f.folderId))||typeof f.starred!=='boolean'||typeof f.pinned!=='boolean'||typeof f.archived!=='boolean'||!Number.isSafeInteger(f.revision)||f.revision<0||f.trashedAt!==undefined&&!validDate(f.trashedAt)||f.lastOpenedAt!==undefined&&!validDate(f.lastOpenedAt)||f.deleted!==undefined&&typeof f.deleted!=='boolean'||f.deleted&&!f.trashedAt)throw invalid();files.add(f.id);}
 return structuredClone(s);
}
export function fileMetadata(state:FileBrowserState,id:string){return state.files.find(f=>f.id===id)??defaultFileMetadata(id);}
export function cloneLocalDocument(doc:DesignDocument,name=doc.name+' copy'):DesignDocument{
 // Internal references are document-scoped and intentionally stay intact. Only
 // the document identity changes; no project or snapshot shares mutable objects.
 const copy=parseDocument(JSON.stringify(doc));copy.id=crypto.randomUUID();copy.name=localName(name,'File name');copy.updatedAt=new Date().toISOString();return copy;
}
export function queryLocalFiles(entries:readonly LocalFileEntry[],options:{view:FileView;folderId?:string|null;query?:string;type?:FileBrowserPreferences['type'];sort?:FileSort}):LocalFileEntry[]{
 const query=(options.query??'').trim().toLocaleLowerCase();
 return entries.filter(({doc,metadata:m})=>!m.deleted&&(options.view==='trash'?!!m.trashedAt:!m.trashedAt)&&(options.view==='archive'?m.archived:options.view==='trash'||!m.archived)&&(options.view!=='drafts'||!m.folderId)&&(options.view!=='starred'||m.starred)&&(options.view!=='pinned'||m.pinned)&&(options.folderId===undefined||m.folderId===options.folderId)&&(!options.type||options.type==='all'||localFileType(doc)===options.type)&&(doc.name.toLocaleLowerCase().includes(query)||!!doc.brand&&!!query&&brandSearchText(doc).includes(query))).sort((a,b)=>{
  if(options.view!=='trash'&&a.metadata.pinned!==b.metadata.pinned)return a.metadata.pinned?-1:1;
  let order=0;switch(options.sort??'modified-desc'){
   case'name-asc':order=a.doc.name.localeCompare(b.doc.name,undefined,{numeric:true,sensitivity:'base'});break;
   case'name-desc':order=b.doc.name.localeCompare(a.doc.name,undefined,{numeric:true,sensitivity:'base'});break;
   case'modified-asc':order=a.doc.updatedAt.localeCompare(b.doc.updatedAt);break;
   case'opened-desc':order=(b.metadata.lastOpenedAt??b.doc.updatedAt).localeCompare(a.metadata.lastOpenedAt??a.doc.updatedAt);break;
   default:order=b.doc.updatedAt.localeCompare(a.doc.updatedAt);
  }return order||a.doc.id.localeCompare(b.doc.id);
 });
}
export function readFileBrowserPreferences():FileBrowserPreferences{try{const raw=localStorage.getItem(FILE_BROWSER_PREFERENCES_KEY);if(!raw||raw.length>1000)return{...defaultFileBrowserPreferences};const data=JSON.parse(raw);if(data?.version!==1)return{...defaultFileBrowserPreferences};const v=data.values;return{layout:v?.layout==='list'?'list':'grid',sort:['modified-desc','modified-asc','name-asc','name-desc','opened-desc'].includes(v?.sort)?v.sort:'modified-desc',type:['all','design','whiteboard','slides','brand'].includes(v?.type)?v.type:'all'};}catch{return{...defaultFileBrowserPreferences};}}
export function saveFileBrowserPreferences(value:FileBrowserPreferences){try{localStorage.setItem(FILE_BROWSER_PREFERENCES_KEY,JSON.stringify({version:1,values:value}));}catch{/* Browser preferences do not block project actions. */}}
