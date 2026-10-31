import {reflow} from './model';
import type {DesignDocument,DesignNode,Page} from './model';
import {validatedVersionDocument,VERSION_REVIEW_LIMITS} from './version-review';
import {reconcileRemovedDocumentCover} from './document-cover';
import {removeCollection,removeVariable} from './design-systems';
import {validateDocumentPrototypeAudio} from './prototype-audio';
import {validateDocumentPassThrough} from './pass-through';
import {validateDocumentBackgroundBlur} from './background-blur';
import {validateDocumentNetworks} from './vector-network';
import {validateDocumentPrototypeInputs} from './prototype-input';
import {validateSlotSources} from './component-slots';
import {validateDocumentCornerSmoothing} from './corner-smoothing';
import {progressiveEffectEntries} from './progressive-blur';
import {validateDocumentSurfaces} from './surface-paint';

/** `ours` is always the target (main) and `theirs` the incoming branch. */
export type MergeSide='ours'|'theirs';
export type MergeConflictKind='value'|'item-delete'|'order'|'layer'|'layer-delete'|'layer-order'|'page-delete'|'reference'|'cycle';
export interface MergeConflict {id:string;kind:MergeConflictKind;label:string;detail:string;ours:string;theirs:string;pageId?:string;nodeId?:string;fields?:string[];}
export interface MergeResult {document:DesignDocument;conflicts:MergeConflict[];unresolved:string[];warnings:string[];validationError?:string;}
export const MERGE_LIMITS={visits:100_000_000,conflicts:5000,rounds:32} as const;
interface Located {node:DesignNode;pageId:string;}
type Resolutions=Readonly<Record<string,MergeSide>>;
type Bag=Record<string,unknown>;
interface Context {resolutions:Resolutions;conflicts:Map<string,MergeConflict>;warnings:string[];visits:number;}
const other=(side:MergeSide):MergeSide=>side==='ours'?'theirs':'ours';
const plain=(v:unknown):v is Bag=>!!v&&typeof v==='object'&&!Array.isArray(v);
function equal(c:Context,a:unknown,b:unknown):boolean{if(++c.visits>MERGE_LIMITS.visits)throw Error('This merge exceeds its property budget. Export both versions and compare them separately.');if(a===b)return true;if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;if(Array.isArray(a)||Array.isArray(b)){if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(!equal(c,a[i],b[i]))return false;return true;}const x=a as Bag,y=b as Bag,keys=Object.keys(x).filter(k=>x[k]!==undefined);if(keys.length!==Object.keys(y).filter(k=>y[k]!==undefined).length)return false;for(const k of keys)if(!equal(c,x[k],y[k]))return false;return true;}
const sameList=(a:readonly string[],b:readonly string[])=>a.length===b.length&&a.every((v,i)=>v===b[i]);
/** Value summaries are short and never contain embedded image or font bytes. */
export function mergeValueSummary(v:unknown):string{if(v===undefined||v===null)return 'not set';if(typeof v==='string')return v.startsWith('data:')?'embedded asset':v===''?'empty':v.length>60?v.slice(0,57)+'…':v;if(typeof v==='number'||typeof v==='boolean')return String(v);if(Array.isArray(v))return `${v.length} item${v.length===1?'':'s'}`;return 'changed value';}
function pick(c:Context,conflict:MergeConflict):MergeSide{if(!c.conflicts.has(conflict.id)){if(c.conflicts.size>=MERGE_LIMITS.conflicts)throw Error('This merge has more than 5,000 conflicts. Update the branch in smaller steps.');c.conflicts.set(conflict.id,conflict);}return c.resolutions[conflict.id]??'ours';}
/** Stable sequence merge. The side that kept the base order hosts the other's moves; additions follow their nearest predecessor. */
export function mergeSequence(base:readonly string[],ours:readonly string[],theirs:readonly string[],keep:ReadonlySet<string>,preferred?:MergeSide):{order:string[];conflict:boolean}{
 const inBase=new Set(base),inOurs=new Set(ours),inTheirs=new Set(theirs),common=(list:readonly string[],a:Set<string>,b:Set<string>)=>list.filter(id=>a.has(id)&&b.has(id)),b=common(base,inOurs,inTheirs),o=common(ours,inBase,inTheirs),t=common(theirs,inBase,inOurs),oursMoved=!sameList(b,o),theirsMoved=!sameList(b,t),conflict=oursMoved&&theirsMoved&&!sameList(o,t);
 const primary=preferred?(preferred==='ours'?ours:theirs):sameList(ours,base)||theirsMoved&&!oursMoved?theirs:ours,secondary=primary===ours?theirs:ours,present=new Set(primary.filter(id=>keep.has(id))),after=new Map<string|null,string[]>();
 for(const list of [secondary,base]){let anchor:string|null=null;for(const id of list){if(present.has(id)){anchor=id;continue;}if(!keep.has(id))continue;present.add(id);const queue=after.get(anchor)??[];queue.push(id);after.set(anchor,queue);anchor=id;}}
 const order:string[]=[],emit=(id:string|null)=>{for(const next of after.get(id)??[]){order.push(next);emit(next);}};emit(null);for(const id of primary)if(keep.has(id)){order.push(id);emit(id);}
 return {order,conflict};
}
const keyedArray=(v:unknown):v is {id:string}[]=>Array.isArray(v)&&new Set(v.map(e=>plain(e)&&typeof e.id==='string'?e.id:Symbol())).size===v.length;
/** Fields holding cross-references as one unit: partial field merges would pair unrelated identifiers. */
const ATOMIC_FIELDS=new Set(['fileCover','componentLibraries','libraryPublication','motion','background','prototypeSettings']);
const COLLECTION_LABELS:Record<string,string>={variables:'Variable',styles:'Style',variableCollections:'Variable collection',componentSets:'Component set',colors:'Color styles',comments:'Comment',flows:'Prototype flow',guides:'Guide',layoutGuideStyles:'Layout guide style',motionStyles:'Motion style',fonts:'Embedded font',slides:'Slide',whiteboard:'Whiteboard',stickies:'Sticky note',connectors:'Connector',tables:'Table',mindMaps:'Mind map'};
const itemName=(key:string,item:unknown)=>`${COLLECTION_LABELS[key]??key}${plain(item)&&typeof item.name==='string'?` “${item.name}”`:''}`;
function mergeValue(c:Context,b:unknown,o:unknown,t:unknown,path:string,label:string,key:string,pageId?:string):unknown{
 if(equal(c,o,t))return o;if(equal(c,b,o))return t;if(equal(c,b,t))return o;
 if(!ATOMIC_FIELDS.has(key)){if(keyedArray(o)&&keyedArray(t)&&(b===undefined||keyedArray(b)))return mergeKeyed(c,(b??[]) as {id:string}[],o,t,path,key,pageId);if(plain(o)&&plain(t)&&(b===undefined||plain(b))){const result:Bag={},base=(b??{}) as Bag;for(const k of new Set([...Object.keys(o),...Object.keys(t)])){const value=mergeValue(c,base[k],o[k],t[k],path+'/'+k,label,k,pageId);if(value!==undefined)result[k]=value;}return result;}}
 return pick(c,{id:'value:'+path,kind:'value',label,detail:'Both sides changed this value.',ours:mergeValueSummary(o),theirs:mergeValueSummary(t),pageId})==='ours'?o:t;
}
function mergeKeyed(c:Context,b:{id:string}[],o:{id:string}[],t:{id:string}[],path:string,key:string,pageId?:string){
 const byId=(list:{id:string}[])=>new Map(list.map(v=>[v.id,v])),bm=byId(b),om=byId(o),tm=byId(t),out=new Map<string,unknown>();
 for(const id of new Set([...bm.keys(),...om.keys(),...tm.keys()])){
  const bi=bm.get(id),oi=om.get(id),ti=tm.get(id),name=itemName(key,oi??ti??bi),itemPath=path+'/'+id;
  if(oi&&ti){out.set(id,mergeValue(c,bi,oi,ti,itemPath,name,key,pageId));continue;}
  if(!oi&&!ti)continue;
  if(!bi){out.set(id,oi??ti);continue;}
  const kept=(oi??ti)!,deleter:MergeSide=oi?'theirs':'ours';if(equal(c,bi,kept))continue;
  const side=pick(c,{id:'value:'+itemPath,kind:'item-delete',label:name,detail:`${deleter==='ours'?'Main':'The branch'} deleted this item and ${deleter==='ours'?'the branch':'main'} changed it.`,ours:oi?'keep changed item':'keep deletion',theirs:ti?'keep changed item':'keep deletion',pageId});if(side!==deleter)out.set(id,kept);
 }
 const ids=(l:{id:string}[])=>l.map(v=>v.id),keep=new Set(out.keys());let merged=mergeSequence(ids(b),ids(o),ids(t),keep);
 if(merged.conflict){const side=pick(c,{id:'order:'+path,kind:'order',label:`${COLLECTION_LABELS[key]??key} order`,detail:'Both sides reordered these items differently.',ours:'main order',theirs:'branch order',pageId});merged=mergeSequence(ids(b),ids(o),ids(t),keep,side);}
 return merged.order.map(id=>out.get(id));
}
/** Coupled properties merge as one unit; a torn vector, rich-text or paint stack is worse than a reported conflict. */
const FIELD_GROUPS:Record<string,string>=Object.fromEntries(Object.entries({'position in the layer tree':['parentId','__page'],'vector geometry':['path','points','contours','closed','pathWidth','pathHeight','vectorNetwork','fillRule'],'text content':['text','textRuns','paragraphStyles','textOutline'],'fill':['fill','paints','gradient','image'],'stroke':['stroke','strokes','strokeWidth'],'position':['x','y'],'size':['width','height']}).flatMap(([group,fields])=>fields.map(field=>[field,group])));
const SET_FIELDS=new Set(['overrideKeys','slotOverrides']);
const setMerge=(b:string[]=[],o:string[]=[],t:string[]=[])=>{const inBase=new Set(b),inTheirs=new Set(t);return [...new Set([...o.filter(k=>!inBase.has(k)||inTheirs.has(k)),...t.filter(k=>!inBase.has(k))])];};
const wrap=(l:Located)=>({...l.node,__page:l.pageId}) as unknown as Bag;
function mergeNode(c:Context,id:string,b:Located|undefined,o:Located,t:Located):Located{
 const base=b?wrap(b):{},ours=wrap(o),theirs=wrap(t),groups=new Map<string,string[]>();
 for(const field of new Set([...Object.keys(ours),...Object.keys(theirs),...Object.keys(base)])){if(field==='id')continue;const group=FIELD_GROUPS[field]??field,list=groups.get(group)??[];list.push(field);groups.set(group,list);}
 const result:Bag={...ours},conflicted:string[][]=[],labels:string[]=[];
 for(const [group,fields] of groups){
  const oursChanged=fields.some(f=>!equal(c,base[f],ours[f])),theirsChanged=fields.some(f=>!equal(c,base[f],theirs[f]));
  if(!theirsChanged)continue;
  if(!oursChanged||fields.every(f=>equal(c,ours[f],theirs[f]))){if(!oursChanged)for(const f of fields){if(theirs[f]===undefined)delete result[f];else result[f]=theirs[f];}continue;}
  if(fields.length===1&&SET_FIELDS.has(fields[0])){result[fields[0]]=setMerge(base[fields[0]] as string[],ours[fields[0]] as string[],theirs[fields[0]] as string[]);continue;}
  conflicted.push(fields);labels.push(group);
 }
 if(conflicted.length){const single=conflicted.length===1&&conflicted[0].length===1,field=conflicted[0][0],side=pick(c,{id:'layer:'+id,kind:'layer',label:`Layer “${o.node.name}”`,detail:`Both sides changed ${labels.join(', ')}.`,fields:labels,ours:single?mergeValueSummary(ours[field]):'main values',theirs:single?mergeValueSummary(theirs[field]):'branch values',pageId:o.pageId,nodeId:id});if(side==='theirs')for(const f of conflicted.flat()){if(theirs[f]===undefined)delete result[f];else result[f]=theirs[f];}}
 const pageId=result.__page as string;delete result.__page;return {node:result as unknown as DesignNode,pageId};
}
function indexNodes(doc:DesignDocument){const map=new Map<string,Located>();for(const page of doc.pages)for(const node of page.nodes){if(map.has(node.id))throw Error('Branch merge requires unique layer identities.');if(map.size>=VERSION_REVIEW_LIMITS.layers)throw Error('Branch merge supports up to 100,000 layers per file.');map.set(node.id,{node,pageId:page.id});}return map;}
function childrenOf(nodes:ReadonlyMap<string,Located>){const map=new Map<string,string[]>();for(const [id,{node}] of nodes)if(node.parentId){const list=map.get(node.parentId)??[];list.push(id);map.set(node.parentId,list);}return map;}
function subtree(children:ReadonlyMap<string,string[]>,root:string){const out=new Set([root]),stack=[root];while(stack.length)for(const id of children.get(stack.pop()!)??[])if(!out.has(id)){out.add(id);stack.push(id);}return out;}
/** Deletion conflicts report the highest deleted layer: keeping it restores the keeper's whole subtree. */
function deletionConflicts(c:Context,deleter:MergeSide,B:Map<string,Located>,D:Map<string,Located>,K:Map<string,Located>,deleterPages:ReadonlySet<string>,keep:Set<string>){
 const keeper=other(deleter),deleted=new Set<string>();for(const id of B.keys())if(!D.has(id)&&deleterPages.has(B.get(id)!.pageId))deleted.add(id);
 const baseChildren=childrenOf(B),keptChildren=childrenOf(K),edited=(id:string)=>{const k=K.get(id),b=B.get(id);if(!k)return false;return !b||k.pageId!==b.pageId||!equal(c,k.node,b.node);},handled=new Set<string>();
 const consider=(root:string)=>{const basePart=[...subtree(baseChildren,root)].filter(id=>deleted.has(id)),keptPart=K.has(root)?[...subtree(keptChildren,root)]:[];basePart.forEach(id=>handled.add(id));keptPart.forEach(id=>handled.add(id));const touched=[...basePart,...keptPart].filter(edited);if(!touched.length)return;const name=(K.get(root)??B.get(root))!.node.name,side=pick(c,{id:'delete:'+root,kind:'layer-delete',label:`Layer “${name}”`,detail:`${deleter==='ours'?'Main':'The branch'} deleted this layer and ${keeper==='ours'?'main':'the branch'} changed ${touched.length===1?'it':touched.length+' layers inside it'}.`,ours:deleter==='ours'?'keep deletion':'keep layers',theirs:deleter==='theirs'?'keep deletion':'keep layers',pageId:B.get(root)!.pageId,nodeId:root});if(side===keeper){for(const id of keptPart)keep.add(id);for(const id of touched)keep.add(id);}};
 for(const id of deleted){const parent=B.get(id)!.node.parentId;if(!parent||!deleted.has(parent))consider(id);}
 for(const id of deleted)if(!handled.has(id)&&edited(id))consider(id);
}
const pageNodeIds=(page:Page|undefined)=>page?page.nodes.map(n=>n.id):[];
function pageEdited(c:Context,base:Page,kept:Page){const {nodes:a,...ax}=base,{nodes:b,...bx}=kept;if(!equal(c,ax,bx)||a.length!==b.length)return true;for(let i=0;i<a.length;i++)if(!equal(c,a[i],b[i]))return true;return false;}
/** Final stacking uses a flat skeleton, then per-parent order: stacking is only meaningful among siblings. */
function mergeNodeOrder(c:Context,pageId:string,ids:readonly string[],finals:ReadonlyMap<string,Located>,base:Page|undefined,ours:Page|undefined,theirs:Page|undefined){
 const b=pageNodeIds(base),o=pageNodeIds(ours),t=pageNodeIds(theirs),keep=new Set(ids),order=mergeSequence(b,o,t,keep).order,placed=new Set(order),parents=new Map<string,string[]>();
 for(const id of ids)if(!placed.has(id))order.push(id);
 for(const id of order){const parent=finals.get(id)!.node.parentId??'',list=parents.get(parent)??[];list.push(id);parents.set(parent,list);}
 for(const [parent,siblings] of parents){if(siblings.length<2)continue;const members=new Set(siblings),inB=new Set(b),inO=new Set(o),inT=new Set(t),common=(list:readonly string[])=>list.filter(id=>members.has(id)&&inB.has(id)&&inO.has(id)&&inT.has(id)),bs=common(b),os=common(o),ts=common(t),oursMoved=!sameList(bs,os),theirsMoved=!sameList(bs,ts);let desired:string[]|undefined;
  if(oursMoved&&theirsMoved&&!sameList(os,ts)){const name=parent?finals.get(parent)?.node.name??'layer':'page root';desired=pick(c,{id:'layer-order:'+pageId+':'+parent,kind:'layer-order',label:`Stacking in “${name}”`,detail:'Both sides reordered these sibling layers differently.',ours:'main stacking',theirs:'branch stacking',pageId})==='ours'?os:ts;}else if(theirsMoved&&!oursMoved)desired=ts;else if(oursMoved)desired=os;
  if(!desired)continue;const slots=new Set(desired);let next=0;for(let i=0;i<order.length;i++)if(slots.has(order[i]))order[i]=desired[next++];}
 return order;
}
const pruneComponentSets=(doc:DesignDocument,ids:ReadonlySet<string>)=>{if(doc.componentSets)doc.componentSets=doc.componentSets.flatMap(set=>{if(!ids.has(set.containerId))return [];if(set.variants.every(v=>ids.has(v.componentId)))return [set];const variants=set.variants.filter(v=>ids.has(v.componentId));return variants.length?[{...set,variants,defaultComponentId:variants.some(v=>v.componentId===set.defaultComponentId)?set.defaultComponentId:variants[0].componentId}]:[];});};
/** Document-level parse plus the structural validators the editor enforces on every commit. */
export function validateMergedDocument(doc:DesignDocument){const d=validatedVersionDocument(doc);validateDocumentPrototypeAudio(d);validateDocumentPassThrough(d);validateDocumentBackgroundBlur(d);validateDocumentNetworks(d);validateDocumentPrototypeInputs(d);validateSlotSources(d);validateDocumentCornerSmoothing(d);progressiveEffectEntries(d);validateDocumentSurfaces(d);return d;}
/** Pure three-way merge. Inputs are never mutated; `resolutions` maps conflict IDs to a side and unresolved conflicts preview as `ours`. */
export function mergeDocuments(baseInput:DesignDocument,oursInput:DesignDocument,theirsInput:DesignDocument,resolutions:Resolutions={}):MergeResult{
 const base=validatedVersionDocument(baseInput),ours=validatedVersionDocument(oursInput),theirs=validatedVersionDocument(theirsInput),c:Context={resolutions,conflicts:new Map(),warnings:[],visits:0};
 for(const value of Object.values(resolutions))if(value!=='ours'&&value!=='theirs')throw Error('Choose main or branch for every conflict.');
 const B=indexNodes(base),O=indexNodes(ours),T=indexNodes(theirs),basePages=new Map(base.pages.map(p=>[p.id,p])),oursPages=new Map(ours.pages.map(p=>[p.id,p])),theirsPages=new Map(theirs.pages.map(p=>[p.id,p]));
 // Pages first: a page deletion decides the fate of every layer it owned.
 const finalPages=new Map<string,Page>();
 for(const id of new Set([...basePages.keys(),...oursPages.keys(),...theirsPages.keys()])){const b=basePages.get(id),o=oursPages.get(id),t=theirsPages.get(id);if(!o&&!t)continue;if(o&&t||!b){finalPages.set(id,(o??t)!);continue;}const kept=(o??t)!,deleter:MergeSide=o?'theirs':'ours';if(!pageEdited(c,b,kept))continue;if(pick(c,{id:'page:'+id,kind:'page-delete',label:`Page “${b.name}”`,detail:`${deleter==='ours'?'Main':'The branch'} deleted this page and ${deleter==='ours'?'the branch':'main'} changed it.`,ours:o?'keep page':'keep deletion',theirs:t?'keep page':'keep deletion',pageId:id})!==deleter)finalPages.set(id,kept);}
 const draft:Bag={...ours};for(const key of new Set([...Object.keys(base),...Object.keys(ours),...Object.keys(theirs)])){if(['id','updatedAt','format','version','pages'].includes(key))continue;const b=(base as unknown as Bag)[key],o=(ours as unknown as Bag)[key],t=(theirs as unknown as Bag)[key],value=mergeValue(c,b,o,t,'document/'+key,itemName(key,undefined),key);if(value===undefined)delete draft[key];else draft[key]=value;}
 const keep=new Set<string>();deletionConflicts(c,'ours',B,O,T,new Set(oursPages.keys()),keep);deletionConflicts(c,'theirs',B,T,O,new Set(theirsPages.keys()),keep);
 const finals=new Map<string,Located>();
 for(const id of new Set([...B.keys(),...O.keys(),...T.keys()])){const b=B.get(id),o=O.get(id),t=T.get(id);if(o&&t)finals.set(id,mergeNode(c,id,b,o,t));else if(!b){const added=(o??t)!;finals.set(id,{...added,node:{...added.node}});}else if(o||t){const kept=(o??t)!,deleterPages=o?theirsPages:oursPages;if(keep.has(id)||!deleterPages.has(b.pageId)&&finalPages.has(b.pageId))finals.set(id,{...kept,node:{...kept.node}});}}
 const place=()=>{let budget=finals.size*4+16,changed=true;while(changed&&budget-->0){changed=false;for(const [id,f] of [...finals]){const parent=f.node.parentId;if((!parent||finals.has(parent))&&finalPages.has(f.pageId))continue;const alt=[O.get(id),T.get(id)].find(a=>a&&(!a.node.parentId||finals.has(a.node.parentId))&&finalPages.has(a.pageId));if(alt){f.node={...f.node,parentId:alt.node.parentId};f.pageId=alt.pageId;}else finals.delete(id);changed=true;}}};
 const breakCycles=()=>{for(let round=0;round<MERGE_LIMITS.rounds;round++){const settled=new Set<string>();let cycle:string[]|undefined;for(const start of finals.keys()){if(settled.has(start))continue;const trail:string[]=[],on=new Set<string>();let id:string|null|undefined=start;while(id&&finals.has(id)&&!settled.has(id)){if(on.has(id)){cycle=trail.slice(trail.indexOf(id));break;}on.add(id);trail.push(id);id=finals.get(id)!.node.parentId;}trail.forEach(i=>settled.add(i));if(cycle)break;}if(!cycle)return;const anchor=[...cycle].sort()[0],side=pick(c,{id:'cycle:'+anchor,kind:'cycle',label:`Layer “${finals.get(anchor)!.node.name}”`,detail:'Each side moved these layers inside the other, which would create a loop.',ours:'main hierarchy',theirs:'branch hierarchy',nodeId:anchor}),source=side==='ours'?O:T;for(const id of cycle){const f=finals.get(id)!,s=source.get(id)??(side==='ours'?T:O).get(id);if(s){f.node={...f.node,parentId:s.node.parentId};f.pageId=s.pageId;}}}throw Error('The merged layer hierarchy could not be resolved.');};
 place();breakCycles();
 // A deleted target is a conflict only when a surviving reference needs it.
 const removals:{kind:'variable'|'collection';item:unknown;id:string}[]=[],handled=new Set<string>(),list=(key:string)=>(Array.isArray(draft[key])?draft[key]:[]) as {id:string;collectionId?:string;values?:Record<string,unknown>;name?:string}[],find=(doc:DesignDocument,key:string,id:string)=>((doc as unknown as Bag)[key] as {id:string}[]|undefined)?.find(v=>v.id===id);
 for(let round=0;round<MERGE_LIMITS.rounds;round++){
  const refs=new Map<string,{kind:'component'|'variable'|'style'|'collection';target:string;count:number}>(),note=(kind:'component'|'variable'|'style'|'collection',target:string)=>{const key=kind+':'+target;if(handled.has(key))return;const entry=refs.get(key)??{kind,target,count:0};entry.count++;refs.set(key,entry);},variables=new Set(list('variables').map(v=>v.id)),styles=new Set(list('styles').map(v=>v.id)),collections=new Set(list('variableCollections').map(v=>v.id));
  for(const {node:n} of finals.values()){if(n.type==='instance'&&n.componentId&&!n.instanceRootId&&!finals.has(n.componentId))note('component',n.componentId);for(const id of Object.values(n.variableBindings??{}))if(typeof id==='string'&&!variables.has(id))note('variable',id);for(const id of Object.values(n.styleIds??{}))if(typeof id==='string'&&!styles.has(id))note('style',id);}
  for(const v of list('variables')){if(v.collectionId&&!collections.has(v.collectionId))note('collection',v.collectionId);for(const value of Object.values(v.values??{}))if(plain(value)&&typeof value.alias==='string'&&!variables.has(value.alias))note('variable',value.alias);}
  if(!refs.size)break;
  for(const ref of refs.values()){const key={variable:'variables',style:'styles',collection:'variableCollections'}[ref.kind as 'variable'],inOurs=ref.kind==='component'?O.has(ref.target):!!find(ours,key,ref.target),inTheirs=ref.kind==='component'?T.has(ref.target):!!find(theirs,key,ref.target);handled.add(ref.kind+':'+ref.target);if(inOurs===inTheirs){c.warnings.push(`A ${ref.kind} reference points to an item that is unavailable on both sides.`);continue;}const keeper:MergeSide=inOurs?'ours':'theirs',deleter=other(keeper),item=ref.kind==='component'?(keeper==='ours'?O:T).get(ref.target)!.node:find(keeper==='ours'?ours:theirs,key,ref.target)! as {id:string;name?:string},name=(item as {name?:string}).name??ref.kind,side=pick(c,{id:'ref:'+ref.kind+':'+ref.target,kind:'reference',label:`${ref.kind[0].toUpperCase()+ref.kind.slice(1)} “${name}”`,detail:`${deleter==='ours'?'Main':'The branch'} deleted this ${ref.kind} and ${ref.count} surviving reference${ref.count===1?' still needs':'s still need'} it.`,ours:keeper==='ours'?'keep it':'keep deletion',theirs:keeper==='theirs'?'keep it':'keep deletion'});
   if(side===keeper){if(ref.kind==='component'){const K=keeper==='ours'?O:T;for(const id of subtree(childrenOf(K),ref.target)){const f=K.get(id)!;if(!finals.has(id))finals.set(id,{...f,node:{...f.node}});}place();breakCycles();}else draft[key]=[...list(key),structuredClone(item)];}
   else if(ref.kind==='style'){for(const {node:n} of finals.values())for(const [kind,id] of Object.entries(n.styleIds??{}))if(id===ref.target){n.styleIds={...n.styleIds};delete n.styleIds[kind as keyof typeof n.styleIds];}}
   else if(ref.kind!=='component')removals.push({kind:ref.kind as 'variable'|'collection',item:structuredClone(item),id:ref.target});
  }
 }
 // A child always lives on its root's page, even when one side moved the parent away.
 const rootPage=new Map<string,string>(),pageOf=(id:string):string=>{const known=rootPage.get(id);if(known)return known;const trail:string[]=[];let current=finals.get(id)!;while(current.node.parentId&&finals.has(current.node.parentId)&&!rootPage.has(current.node.id)){trail.push(current.node.id);current=finals.get(current.node.parentId)!;}const page=rootPage.get(current.node.id)??current.pageId;rootPage.set(current.node.id,page);for(const v of trail)rootPage.set(v,page);return page;};
 const members=new Map<string,string[]>();for(const id of finals.keys()){const page=pageOf(id);finals.get(id)!.pageId=page;const ids=members.get(page)??[];ids.push(id);members.set(page,ids);}
 let order=mergeSequence(base.pages.map(p=>p.id),ours.pages.map(p=>p.id),theirs.pages.map(p=>p.id),new Set(finalPages.keys()));
 if(order.conflict)order=mergeSequence(base.pages.map(p=>p.id),ours.pages.map(p=>p.id),theirs.pages.map(p=>p.id),new Set(finalPages.keys()),pick(c,{id:'order:pages',kind:'order',label:'Page order',detail:'Both sides reordered pages differently.',ours:'main order',theirs:'branch order'}));
 const pages=order.order.map(id=>{const b=basePages.get(id),o=oursPages.get(id),t=theirsPages.get(id),{nodes:_o,...oursFields}=o??({} as Page),{nodes:_t,...theirsFields}=t??({} as Page),{nodes:_b,...baseFields}=b??({} as Page),fields:Bag=o&&t?{...oursFields}:{...(o??t)!,nodes:undefined};if(o&&t)for(const key of new Set([...Object.keys(baseFields),...Object.keys(oursFields),...Object.keys(theirsFields)])){if(key==='id')continue;const value=mergeValue(c,(baseFields as Bag)[key],(oursFields as Bag)[key],(theirsFields as Bag)[key],'page/'+id+'/'+key,`${COLLECTION_LABELS[key]??key} on “${o.name}”`,key,id);if(value===undefined)delete fields[key];else fields[key]=value;}const ids=mergeNodeOrder(c,id,members.get(id)??[],finals,b,o,t);return {...fields,id,nodes:ids.map(n=>finals.get(n)!.node)} as Page;});
 const merged={...draft,id:ours.id,updatedAt:ours.updatedAt,format:ours.format,version:ours.version,pages} as DesignDocument;
 pruneComponentSets(merged,new Set(finals.keys()));reconcileRemovedDocumentCover(ours,merged);
 for(const removal of removals){if(removal.kind==='variable'){(merged.variables??=[]).push(removal.item as NonNullable<DesignDocument['variables']>[number]);removeVariable(merged,removal.id);}else{(merged.variableCollections??=[]).push(removal.item as NonNullable<DesignDocument['variableCollections']>[number]);removeCollection(merged,removal.id);}}
 for(const page of merged.pages){const b=basePages.get(page.id),o=oursPages.get(page.id),t=theirsPages.get(page.id);if(b&&o&&t&&pageEdited(c,b,o)&&pageEdited(c,b,t))reflow(page.nodes);}
 const conflicts=[...c.conflicts.values()],unresolved=conflicts.filter(v=>!resolutions[v.id]).map(v=>v.id);let validationError:string|undefined;try{validateMergedDocument(merged);}catch(error){validationError=error instanceof Error?error.message:'The merged project is invalid.';}
 return {document:merged,conflicts,unresolved,warnings:c.warnings,...(validationError?{validationError}:{})};
}
/** Final gate: every conflict answered and the project passes the same validators as a saved file. */
export function committedMerge(result:MergeResult){if(result.unresolved.length)throw Error(`Resolve ${result.unresolved.length} remaining conflict${result.unresolved.length===1?'':'s'} before merging.`);if(result.validationError)throw Error('The merged project is invalid: '+result.validationError);return validateMergedDocument(result.document);}
