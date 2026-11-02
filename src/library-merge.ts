import type {DesignDocument,DesignNode} from './model';
/** Three-way merge for a library asset this file edited after installing it. The saved baseline is the common ancestor, so a change on one side is never a conflict. When both sides changed the same value, your edit stays and the path is reported. */
export interface LibraryMergeReport {fromLibrary:number;fromFile:number;both:number;bothPaths:string[];}
export const emptyMergeReport=():LibraryMergeReport=>({fromLibrary:0,fromFile:0,both:0,bothPaths:[]});
const plain=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const identified=(v:unknown):v is {id:string}[]=>Array.isArray(v)&&v.every(item=>plain(item)&&typeof item.id==='string')&&new Set(v.map(item=>(item as {id:string}).id)).size===v.length;
const same=(a:unknown,b:unknown)=>a===b||JSON.stringify(a)===JSON.stringify(b);
function value(base:unknown,mine:unknown,theirs:unknown,path:string,report:LibraryMergeReport):unknown{
 if(same(mine,theirs))return mine;if(same(mine,base)){report.fromLibrary++;return theirs;}if(same(theirs,base)){report.fromFile++;return mine;}
 report.both++;if(report.bothPaths.length<24)report.bothPaths.push(path);return mine;}
function merge(base:unknown,mine:unknown,theirs:unknown,path:string,report:LibraryMergeReport,depth:number):unknown{
 if(depth>64)return value(base,mine,theirs,path,report);
 if(plain(mine)&&plain(theirs)&&(plain(base)||base===undefined)){const out:Record<string,unknown>={},b=base??{};for(const key of new Set([...Object.keys(theirs),...Object.keys(mine)])){const next=merge(b[key],mine[key],theirs[key],path?path+'.'+key:key,report,depth+1);if(next!==undefined)out[key]=next;}return out;}
 if(identified(mine)&&identified(theirs)&&(identified(base)||base===undefined))return mergeList(base??[],mine,theirs,path,report,depth);
 return value(base,mine,theirs,path,report);}
/** Theirs sets the order. Rows only you added stay at the end, so a merge can't reorder what the library rearranged. */
function mergeList(base:{id:string}[],mine:{id:string}[],theirs:{id:string}[],path:string,report:LibraryMergeReport,depth:number){const b=new Map(base.map(v=>[v.id,v])),m=new Map(mine.map(v=>[v.id,v])),t=new Map(theirs.map(v=>[v.id,v])),out:unknown[]=[];
 for(const id of [...t.keys(),...[...m.keys()].filter(id=>!t.has(id))]){const inBase=b.has(id),inMine=m.has(id),inTheirs=t.has(id),label=path+'['+id+']';
  if(inMine&&inTheirs){out.push(merge(b.get(id),m.get(id),t.get(id),label,report,depth+1));continue;}
  if(inTheirs){if(!inBase){report.fromLibrary++;out.push(t.get(id));}else if(same(t.get(id),b.get(id)))report.fromFile++;else{report.both++;if(report.bothPaths.length<24)report.bothPaths.push(label);out.push(t.get(id));}continue;}
  if(!inBase){report.fromFile++;out.push(m.get(id));}else if(same(m.get(id),b.get(id)))report.fromLibrary++;else{report.both++;if(report.bothPaths.length<24)report.bothPaths.push(label);out.push(m.get(id));}}
 return out;}
export function mergeLibraryValue(base:unknown,mine:unknown,theirs:unknown,report=emptyMergeReport()){return {value:merge(base,mine,theirs,'',report,0),report};}
type NodeAsset={pageId:string;nodes:DesignNode[];sets:NonNullable<DesignDocument['componentSets']>};
/** Writes a merged component back in document space. Asset data stores positions relative to its root, and the root keeps where this file placed it. */
export function writeMergedNodes(d:DesignDocument,merged:NodeAsset,installed:NodeAsset,rootId:string){const page=d.pages.find(p=>p.nodes.some(n=>n.id===rootId));if(!page)throw Error('The merged library definition is missing.');const root=page.nodes.find(n=>n.id===rootId)!,owned=new Set(installed.nodes.map(n=>n.id)),current=new Map(page.nodes.filter(n=>owned.has(n.id)).map(n=>[n.id,n])),keep=new Set(merged.nodes.map(n=>n.id)),rows=merged.nodes.map(n=>({...n,x:n.x+root.x,y:n.y+root.y,...(current.get(n.id)?.locked!==undefined?{locked:current.get(n.id)!.locked}:{locked:false})})) as DesignNode[],parents=new Set(rows.map(n=>n.id));for(const n of rows)if(n.parentId&&!parents.has(n.parentId))throw Error('A layer you added sits inside a layer this update removes. Replace or keep the asset instead of merging.');if(!keep.has(rootId))throw Error('The merged library definition is missing its root.');const at=page.nodes.findIndex(n=>owned.has(n.id)),rest=page.nodes.filter(n=>!owned.has(n.id));rest.splice(Math.max(0,Math.min(at,rest.length)),0,...rows);page.nodes=rest;if(merged.sets.length){const ids=new Set(merged.sets.map(s=>s.id));d.componentSets=[...(d.componentSets??[]).filter(s=>!ids.has(s.id)),...merged.sets];}}
