import {node,parseDocument,isLocked} from './model';
import type {DesignDocument,Page} from './model';
import {canInstantiate,insertInstance,synchronizeComponents} from './components-model';
import {defaultPlaygroundConfig,deriveComponentPlayground,playgroundSourceIndex} from './component-playground';
import {prototypeDocument} from './prototype';
import {visualBounds} from './transforms';
import {libraryDigest} from './library-digest';
export type {DocumentationLink} from './documentation-link';

export const DOCUMENTATION_LIMITS={variants:32,newNodes:4000,text:200000,extent:100000,exampleExtent:4096,closureNodes:1500,closureMains:32} as const;
const clone=<T,>(v:T):T=>structuredClone(v);
const message=(e:unknown)=>String(e instanceof Error?e.message:e).replaceAll('Playground','Documentation').replaceAll('playground','documentation');
const runtime={frameId:'',history:[],overlays:[],values:{},variants:{}};
function sourceIndex(source:DesignDocument){try{return playgroundSourceIndex(source);}catch(e){throw Error(message(e));}}
export function documentationChoices(source:DesignDocument,mainId:string){
 const index=sourceIndex(source),main=index.byId.get(mainId);
 if(source.workspace&&source.workspace!=='design')throw Error('Component documentation pages require a Design file.');
 if(main?.type!=='component'||main.instanceRootId)throw Error('Choose an available ordinary main component.');
 if(isLocked(main,[...index.byId.values()]))throw Error('Unlock the main component and its ancestors before generating documentation.');
 let visits=0;const sets=(source.componentSets??[]).filter(set=>{let found=false;for(const v of set.variants){if(++visits>10000)throw Error('Documentation variant inspection exceeds 10,000 memberships.');if(v.componentId===mainId)found=true;}return found;});
 if(sets.length>1)throw Error('This main has ambiguous component-set membership.');
 const set=sets[0];return {main,set,title:(set?.name??main.name).slice(0,170)+' — documentation',variantCount:set?.variants.length??1};
}
export interface DocumentationOptions {title:string;allVariants:boolean;}
export interface DocumentationPlan {pageId:string;pageName:string;exampleCount:number;layerCount:number;mainIds:readonly string[];}
interface PrivatePlan {source:DesignDocument;sourceRaw:string;page:Page;pageRaw:string;}
const plans=new WeakMap<DocumentationPlan,PrivatePlan>();
/** Everything the page's captured text was written from. Examples are live instances, so artwork changes need no update. */
function documentationFingerprint(index:ReturnType<typeof sourceIndex>,set:NonNullable<DesignDocument['componentSets']>[number]|undefined,mainIds:readonly string[]){return libraryDigest(JSON.stringify([set?.description??'',mainIds.map(id=>{const main=index.byId.get(id),variant=set?.variants.find(v=>v.componentId===id),meta=main?.componentMetadata;return [id,main?.name,variant?.values,variant?.description,meta?.description,meta?.documentation,(meta?.properties??[]).map(p=>[p.group,p.name,p.type,p.type==='instance-swap'?index.byId.get(String(p.defaultValue))?.name:p.defaultValue,p.description])];})]));}
export type DocumentationState={pageId:string;name:string;state:'current'|'stale'|'unavailable';reason?:string};
/** Linked pages for a main or any variant of its set, with whether their captured text still matches the source. */
export function linkedDocumentationPages(source:DesignDocument,mainId:string):DocumentationState[]{const set=source.componentSets?.find(s=>s.variants.some(v=>v.componentId===mainId)),family=new Set([mainId,...set?.variants.map(v=>v.componentId)??[]]);return source.pages.filter(p=>p.documentation&&family.has(p.documentation.mainId)).slice(0,16).map(page=>{const link=page.documentation!;try{const choices=documentationChoices(source,link.mainId),index=sourceIndex(source),ids=link.allVariants&&choices.set?choices.set.variants.map(v=>v.componentId):[link.mainId];return {pageId:page.id,name:page.name,state:documentationFingerprint(index,choices.set,ids)===link.fingerprint?'current':'stale'};}catch(e){return {pageId:page.id,name:page.name,state:'unavailable',reason:message(e)};}});}
function sameOriginal(source:DesignDocument,derived:DesignDocument,pageId:string){const copy={...derived,pages:derived.pages.filter(p=>p.id!==pageId)};if(JSON.stringify(copy)!==JSON.stringify(source))throw Error('The source definitions need their normal layout/font refresh first. Retry after the editor has updated.');}
function derive(doc:DesignDocument){synchronizeComponents(doc);return prototypeDocument(doc,runtime);}
/** Prepares an ordinary page, never mutating the source or granting a privileged edit path. */
export function prepareComponentDocumentation(source:DesignDocument,mainId:string,options:DocumentationOptions):DocumentationPlan {
 const choices=documentationChoices(source,mainId),index=sourceIndex(source);
 if(!options||Object.keys(options).some(k=>!['title','allVariants'].includes(k))||typeof options.title!=='string'||!options.title.trim()||options.title.length>200||/[\u0000-\u001f\u007f-\u009f]/.test(options.title)||typeof options.allVariants!=='boolean')throw Error('Use a nonempty page title up to 200 characters.');
 if(source.pages.length>=1000)throw Error('The document has reached its 1,000-page limit.');
 const mainIds=options.allVariants&&choices.set?choices.set.variants.map(v=>v.componentId):[mainId];
 if(mainIds.length>32||new Set(mainIds).size!==mainIds.length)throw Error('Generate at most 32 distinct variants in one documentation page.');
 const sourceRaw=JSON.stringify(source);if(sourceRaw.length*2*(mainIds.length+2)>100_000_000)throw Error('Documentation source and example inspection exceeds its conservative 100 MB cumulative work budget. Generate fewer variants.');
 const closure=new Set<string>(),mains=new Set<string>();let estimate=0;
 for(const id of mainIds){const n=index.byId.get(id);if(n?.type!=='component'||n.instanceRootId)throw Error('A selected variant main is missing.');if(isLocked(n,[...index.byId.values()]))throw Error('Unlock every selected variant and its ancestors first.');canInstantiate(source,id,null);
  // Existing cycle/slot/ancestor-aware component derivation preflights the complete closure.
  let result:ReturnType<typeof deriveComponentPlayground>;try{result=deriveComponentPlayground(source,defaultPlaygroundConfig(id));}catch(e){throw Error(message(e));}
  estimate+=result.page.nodes.length;if(estimate>4000)throw Error('Documentation examples exceed 4,000 layers.');
  for(const p of result.document.pages)if(p.id!==result.page.id)for(const n of p.nodes){closure.add(n.id);if(n.type==='component'&&!n.instanceRootId)mains.add(n.id);}
  if(closure.size>1500||mains.size>32)throw Error('The combined documentation closure exceeds 1,500 layers or 32 mains.');
 }
 const owner=(id:string)=>{let n=index.byId.get(id);while(n){if(n.type==='component'&&!n.instanceRootId)return n.id;n=n.parentId?index.byId.get(n.parentId):undefined;}return undefined;};
 for(const id of closure){const n=index.byId.get(id)!;if(n.media)throw Error('Documentation examples do not support video-owned component closures.');for(const binding of Object.values(n.layoutGuideBindings??{}))if(binding&&owner(binding.ownerId)!==owner(n.id))throw Error('Documentation examples require guide bindings owned inside their component definition.');}
 const working=clone(source),page:Page={id:crypto.randomUUID(),name:options.title.trim(),nodes:[],comments:[]};working.pages.push(page);
 let textSize=0;const text=(name:string,value:string,size=16)=>{textSize+=value.length;if(textSize>200000)throw Error('Documentation text exceeds 200,000 characters.');const n=node('text',{name,text:value,x:48,y:48,width:1000,height:24,fontSize:size,textResize:'auto-height',fill:'#202027',stroke:'',strokeWidth:0});page.nodes.push(n);return n;};
 const title=text('Documentation title',page.name,36),note=text('Documentation linkage notice','Text captured at generation. Examples are live linked instances with main defaults in this page’s variable modes. Selected instance overrides and ancestor appearance are not copied. Edit this page freely. When the component changes, the component inspector offers an update, which replaces this generated text and these examples and keeps layers you added.'+(choices.set?.description?'\nComponent set description: '+choices.set.description:''));
 const examples:{id:string;labelId:string}[]=[];
 for(const id of mainIds){const main=index.byId.get(id)!,variant=choices.set?.variants.find(v=>v.componentId===id),lines=[main.name,variant?Object.entries(variant.values).map(([k,v])=>k+': '+v).join(' · '):'',variant?.description??'',main.componentMetadata?.description??'',main.componentMetadata?.documentation?'Documentation: '+main.componentMetadata.documentation:'','Properties (this variant):',...(main.componentMetadata?.properties??[]).map(p=>`${p.group?p.group+' / ':''}${p.name} [${p.type}] = ${(p.type==='instance-swap'?(index.byId.get(String(p.defaultValue))?.name??'Unavailable main'):String(p.defaultValue))}${p.description?' — '+p.description:''}`)].filter(Boolean);
  const label=text('Component example description',lines.join('\n'));examples.push({id:insertInstance(working,page.id,id,{x:48,y:0,parentId:null,propertyValues:{}}),labelId:label.id});
 }
 // Allocate real IDs once; later normal synchronization reuses them.
 let derived=derive(working);sameOriginal(source,derived,page.id);let generated=derived.pages.find(p=>p.id===page.id)!;
 if(generated.nodes.length>4000)throw Error('Documentation exceeds 4,000 new layers.');
 const finalTitle=generated.nodes.find(n=>n.id===title.id)!,notice=generated.nodes.find(n=>n.id===note.id)!;let y=finalTitle.y+finalTitle.height+24;notice.y=y;y+=notice.height+40;
 for(const example of examples){const children=new Set([example.id]);for(let pass=0;pass<64;pass++){let changed=false;for(const n of generated.nodes)if(n.parentId&&children.has(n.parentId)&&!children.has(n.id)){children.add(n.id);changed=true;}if(!changed)break;}
  const rows=generated.nodes.filter(n=>children.has(n.id)),bounds=visualBounds(rows),label=generated.nodes.find(n=>n.id===example.labelId)!;
  if(![bounds.x,bounds.y,bounds.width,bounds.height].every(Number.isFinite)||bounds.width>4096||bounds.height>4096)throw Error('An example has unavailable or oversized visual bounds (maximum 4,096 per side).');
  label.y=y;y+=label.height+24;const dx=48-bounds.x,dy=y-bounds.y;for(const n of rows){n.x+=dx;n.y+=dy;}y+=bounds.height+64;
 }
 if(y>100000)throw Error('Documentation exceeds its 100,000-unit page extent.');
 const expected=JSON.stringify(generated.nodes.map(n=>[n.id,n.x,n.y,n.width,n.height]));derived=derive(derived);sameOriginal(source,derived,page.id);generated=derived.pages.find(p=>p.id===page.id)!;
 if(expected!==JSON.stringify(generated.nodes.map(n=>[n.id,n.x,n.y,n.width,n.height])))throw Error('This component’s layout changes after placement; use a fixed independent main before generating documentation.');
 generated.documentation={mainId,allVariants:options.allVariants,fingerprint:documentationFingerprint(index,choices.set,mainIds),layerIds:[title.id,note.id,...examples.flatMap(e=>[e.labelId,e.id])]};const validated=parseDocument(JSON.stringify(derived)),final=validated.pages.find(p=>p.id===page.id)!;
 if(final.nodes.some(n=>![n.x,n.y,n.width,n.height].every(Number.isFinite)||Math.abs(n.x)>100000||Math.abs(n.y)>100000))throw Error('Documentation geometry exceeds its finite page budget.');
 const plan:DocumentationPlan=Object.freeze({pageId:final.id,pageName:final.name,exampleCount:mainIds.length,layerCount:final.nodes.length,mainIds:Object.freeze([...mainIds])});plans.set(plan,{source,sourceRaw,page:clone(final),pageRaw:JSON.stringify(final)});return plan;
}
/** Call only within ordinary store.edit; existing pages are never overwritten. */
export function applyComponentDocumentation(doc:DesignDocument,plan:DocumentationPlan){const p=plans.get(plan);if(!p||JSON.stringify(doc)!==p.sourceRaw)throw Error('The documentation source changed. Review a fresh page plan.');if(doc.pages.some(page=>page.id===p.page.id))throw Error('The documentation page already exists.');doc.pages.push(clone(p.page));}
export function validateComponentDocumentation(doc:DesignDocument,plan:DocumentationPlan){const p=plans.get(plan);if(!p||JSON.stringify(doc.pages.find(page=>page.id===plan.pageId))!==p.pageRaw)throw Error('The documentation page changed during derivation. Nothing was added.');sameOriginal(p.source,doc,plan.pageId);}
export interface DocumentationUpdatePlan {pageId:string;pageName:string;exampleCount:number;replaced:number;kept:number;}
const updates=new WeakMap<DocumentationUpdatePlan,{raw:string;plan:DocumentationPlan;}>();
const ownedLayers=(page:Page)=>{const ids=new Set(page.documentation?.layerIds??[]);for(let grew=true;grew;){grew=false;for(const n of page.nodes)if(n.parentId&&ids.has(n.parentId)&&!ids.has(n.id)){ids.add(n.id);grew=true;}}return ids;};
/** Rebuilds the page's generated layers from the current source, on request. Layers someone added stay. */
export function prepareDocumentationUpdate(source:DesignDocument,pageId:string):DocumentationUpdatePlan{const page=source.pages.find(p=>p.id===pageId),link=page?.documentation;if(!page||!link)throw Error('This page has no component documentation link.');const owned=ownedLayers(page),reduced={...source,pages:source.pages.filter(p=>p!==page)};if(!reduced.pages.length)throw Error('A documentation page needs its source on another page.');const plan=prepareComponentDocumentation(reduced,link.mainId,{title:page.name,allVariants:link.allVariants}),update:DocumentationUpdatePlan=Object.freeze({pageId,pageName:page.name,exampleCount:plan.exampleCount,replaced:page.nodes.filter(n=>owned.has(n.id)).length,kept:page.nodes.filter(n=>!owned.has(n.id)).length});updates.set(update,{raw:JSON.stringify(source),plan});return update;}
export function applyDocumentationUpdate(doc:DesignDocument,update:DocumentationUpdatePlan){const u=updates.get(update),p=u&&plans.get(u.plan);if(!u||!p||JSON.stringify(doc)!==u.raw)throw Error('The documentation source changed. Review the update again.');const page=doc.pages.find(v=>v.id===update.pageId)!,owned=ownedLayers(page);page.nodes=[...clone(p.page.nodes),...page.nodes.filter(n=>!owned.has(n.id))];page.documentation=clone(p.page.documentation);}
export function validateDocumentationUpdate(doc:DesignDocument,update:DocumentationUpdatePlan){const u=updates.get(update),page=doc.pages.find(v=>v.id===update.pageId);if(!u||!page?.documentation||page.documentation.layerIds.some(id=>!page.nodes.some(n=>n.id===id)))throw Error('The documentation page changed during derivation. Nothing was updated.');}
