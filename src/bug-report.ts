import {strToU8,zipSync} from 'fflate';
import type {DesignDocument} from './model';
import {defaultPreferences} from './preferences';
import type {EditorPreferences} from './preferences';
import {redactErrorText} from './error-log';
import type {LoggedError} from './error-log';
/** Bundle builder. Document data is structural counts only, unless documentRaw is supplied by an explicit per-bundle opt-in. */
export const BUG_DESCRIPTION_LIMIT=4000;
export interface DocumentShape {workspace:string;pages:number;layers:number;layersByType:Record<string,number>;maxDepth:number;comments:number;variables:number;collections:number;styles:number;components:number;instances:number;embeddedFonts:number;images:number;motionTracks:number;reactions:number;serializedBytes:number;}
/** Counts only. Names, text, colors, IDs, paths and media are deliberately unreachable from this return value. */
export function documentShape(doc:DesignDocument):DocumentShape{
 const layersByType:Record<string,number>={};let layers=0,maxDepth=0,comments=0,images=0,reactions=0,motionTracks=0;
 for(const page of doc.pages){comments+=page.comments.length;motionTracks+=page.motion?.tracks?.length??0;const parents=new Map(page.nodes.map(n=>[n.id,n.parentId])),depths=new Map<string,number>();for(const n of page.nodes){layers++;layersByType[n.type]=(layersByType[n.type]??0)+1;if(n.image)images++;reactions+=n.reactions?.length??0;const trail:string[]=[];let id:string|null|undefined=n.id;while(id&&!depths.has(id)&&!trail.includes(id)&&trail.length<4096){trail.push(id);id=parents.get(id);}let depth=id?depths.get(id)??0:0;for(const item of trail.reverse())depths.set(item,++depth);maxDepth=Math.max(maxDepth,depths.get(n.id)??0);}}
 return {workspace:doc.workspace??'design',pages:doc.pages.length,layers,layersByType,maxDepth,comments,variables:doc.variables?.length??0,collections:doc.variableCollections?.length??0,styles:doc.styles?.length??0,components:layersByType.component??0,instances:layersByType.instance??0,embeddedFonts:doc.fonts?.length??0,images,motionTracks,reactions,serializedBytes:new Blob([JSON.stringify(doc)]).size};
}
/** Only numbers, booleans and fixed enums pass; free text and default colors or fonts could describe the user's work. */
export function safePreferences(preferences:Readonly<EditorPreferences>){const out:Record<string,string|number|boolean>={};for(const key of Object.keys(defaultPreferences) as (keyof EditorPreferences)[]){const value=preferences[key];if(key.startsWith('default'))continue;if(typeof value==='number'||typeof value==='boolean'||typeof value==='string'&&/^[a-z-]{1,16}$/i.test(value))out[key]=value;}return out;}
/** Every name a thrown message could echo. Bounded so an enormous file cannot stall the bundle. */
export function knownDocumentStrings(doc:DesignDocument,limit=20000){const strings=new Set<string>([doc.name,doc.description??'']);for(const page of doc.pages){strings.add(page.name);for(const n of page.nodes){if(strings.size>=limit)break;strings.add(n.name);if(n.text)strings.add(n.text);if(n.fontFamily)strings.add(n.fontFamily);}for(const c of page.comments)strings.add(c.text);}for(const v of doc.variables??[])strings.add(v.name);for(const s of doc.styles??[])strings.add(s.name);return [...strings].filter(s=>s.length>=3).sort((a,b)=>b.length-a.length);}
export interface BugReportInput {description:string;app:{version:string;features:number};environment:{platform:'mac-app'|'browser';userAgent:string;screen:string;viewport:string;pixelRatio:number};state:{mode:string;motionOpen:boolean;selectionCount:number;zoom:number;undoDepth:number};preferences:Readonly<EditorPreferences>;recentCommands:readonly string[];errors:readonly LoggedError[];storage:{localStorageKeys:number;localStorageBytes:number};doc:DesignDocument;createdAt:string;}
export function buildBugReport(input:BugReportInput,includedDocument:boolean){
 if(input.description.length>BUG_DESCRIPTION_LIMIT)throw Error('Shorten the description to '+BUG_DESCRIPTION_LIMIT+' characters.');const known=knownDocumentStrings(input.doc);
 return {format:'forma-bug-report',version:1,createdAt:input.createdAt,description:input.description.trim(),app:input.app,environment:input.environment,editor:input.state,preferences:safePreferences(input.preferences),recentCommands:input.recentCommands.filter(id=>/^[a-z][a-z0-9-]{0,95}$/.test(id)).slice(0,20),errors:input.errors.slice(0,50).map(e=>({...e,message:redactErrorText(e.message,known)})),storage:input.storage,documentShape:documentShape(input.doc),includesDocument:includedDocument};
}
/** The optional document is a separate named file, so its presence is visible in any archive listing. */
export function bugBundleFiles(report:ReturnType<typeof buildBugReport>,documentRaw?:string){
 if(!!documentRaw!==report.includesDocument)throw Error('The bundle document choice changed. Create the bundle again.');const files:Record<string,Uint8Array>={'report.json':strToU8(JSON.stringify(report,null,2)),'README.txt':strToU8('Forma bug report bundle. Forma saved this file on your device and did not send it anywhere. Share it only if you choose to.\n'+(documentRaw?'document.oui is a complete copy of your project, including its text, images and comments.\n':'It contains no project content: only counts, app settings and redacted errors.\n'))};if(documentRaw)files['document.oui']=strToU8(documentRaw);return files;
}
export const bugBundleBytes=(files:Record<string,Uint8Array>)=>zipSync(files,{level:6});
