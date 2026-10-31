import {parseDocument,uid} from './model';
import type {DesignDocument} from './model';

export interface RepairReport {document:DesignDocument;removedPages:number;removedLayers:number;removedComments:number;removedSettings:string[];reparentedLayers:number;}
const plain=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const isValid=(doc:unknown)=>{try{parseDocument(JSON.stringify(doc));return true;}catch{return false;}};
const hasCycle=(nodes:{id:string;parentId:string|null}[])=>{const parents=new Map(nodes.map(n=>[n.id,n.parentId])),clean=new Set<string>(),broken:string[]=[];for(const start of parents.keys()){const seen=new Set<string>();let id:string|null|undefined=start;while(id&&parents.has(id)&&!clean.has(id)){if(seen.has(id)){broken.push(id);break;}seen.add(id);id=parents.get(id);}seen.forEach(v=>clean.add(v));}return broken;};
/** Keeps every part that passes the full validators and drops the rest with a count. The damaged source is never changed. */
export function repairDocument(source:unknown):RepairReport{
 if(!plain(source)||source.format!=='oanarina-ui'||![1,2].includes(source.version as number)||!Array.isArray(source.pages))throw Error('This data is not a supported Forma project, so there is nothing to repair.');
 const date=typeof source.updatedAt==='string'&&Number.isFinite(Date.parse(source.updatedAt))?source.updatedAt:new Date().toISOString(),colors=Array.isArray(source.colors)&&source.colors.every(c=>plain(c)&&typeof c.name==='string'&&/^#[0-9a-f]{6}$/i.test(String(c.value)))?source.colors:[],shell={format:'oanarina-ui',version:2,id:typeof source.id==='string'&&source.id.trim()?source.id:uid(),name:typeof source.name==='string'?source.name:'Recovered file',colors,updatedAt:date},report={removedPages:0,removedLayers:0,removedComments:0,removedSettings:[] as string[],reparentedLayers:0},pages:Record<string,unknown>[]=[],pageIds=new Set<string>(),nodeIds=new Set<string>();
 const pageShell=(page:Record<string,unknown>,nodes:unknown[],comments:unknown[])=>({id:page.id,name:typeof page.name==='string'?page.name:'Recovered page',nodes,comments});
 for(const page of source.pages){if(!plain(page)||typeof page.id!=='string'||pageIds.has(page.id)||!Array.isArray(page.nodes)){report.removedPages++;continue;}pageIds.add(page.id);
  const comments=Array.isArray(page.comments)?page.comments.filter(c=>isValid({...shell,pages:[pageShell(page,[],[c])]})):[];report.removedComments+=(Array.isArray(page.comments)?page.comments.length:0)-comments.length;
  let nodes=page.nodes as Record<string,unknown>[];
  if(!isValid({...shell,pages:[pageShell(page,nodes,comments)]})){const kept=nodes.filter(n=>{if(!plain(n)||typeof n.id!=='string'||nodeIds.has(n.id))return false;return isValid({...shell,pages:[pageShell(page,[{...n,parentId:null,sourceId:undefined,instanceRootId:undefined}],[])]});});report.removedLayers+=nodes.length-kept.length;const present=new Set(kept.map(n=>n.id as string));nodes=kept.map(n=>{if(n.parentId&&!present.has(n.parentId as string)){report.reparentedLayers++;return {...n,parentId:null};}return n;});for(const id of hasCycle(nodes as {id:string;parentId:string|null}[])){const at=nodes.findIndex(n=>n.id===id);nodes[at]={...nodes[at],parentId:null};report.reparentedLayers++;}}
  for(const n of nodes)if(plain(n)&&typeof n.id==='string')nodeIds.add(n.id);
  const repaired:Record<string,unknown>=pageShell(page,nodes,comments);for(const key of Object.keys(page)){if(key in repaired)continue;const value=page[key];if(isValid({...shell,pages:[{...repaired,[key]:value}]}))repaired[key]=value;else report.removedSettings.push(key);}
  if(isValid({...shell,pages:[repaired]}))pages.push(repaired);else{report.removedPages++;report.removedLayers+=nodes.length;}}
 if(!pages.length)throw Error('No page of this project could be recovered.');
 const doc:Record<string,unknown>={...shell,pages};for(const key of Object.keys(source)){if(key in doc)continue;const next={...doc,[key]:source[key]};if(isValid(next))doc[key]=source[key];else report.removedSettings.push(key);}
 return {...report,document:parseDocument(JSON.stringify(doc))};
}
export function repairSummary(r:Omit<RepairReport,'document'>){const parts=[r.removedPages&&`${r.removedPages} page${r.removedPages===1?'':'s'}`,r.removedLayers&&`${r.removedLayers} layer${r.removedLayers===1?'':'s'}`,r.removedComments&&`${r.removedComments} comment${r.removedComments===1?'':'s'}`,r.removedSettings.length&&`${r.removedSettings.length} setting${r.removedSettings.length===1?'':'s'}`].filter(Boolean);return parts.length?`Removed ${parts.join(', ')} that could not be validated.`:'Nothing had to be removed.';}
