import {packedProject} from './image-sharing';
import {descendants,isLocked,parseDocument} from './model';
import type {DesignDocument,DesignNode,Page} from './model';
import {allNodes,hydrateLegacyInstances} from './components-model';
import {copyWhiteboardSelection} from './whiteboard';
import {effectsFor} from './effects';
import {maskForNode} from './masks';
import {reparentPreservingWorld,worldMatrix} from './transforms';
import type {PrototypeAction} from './prototype';
import {visibleLayerRows} from './selection';

export interface MoveLayersRequest {sourcePageId:string;destinationPageId:string;nodeIds:string[];}
export interface MoveLayersResult {document:DesignDocument;rootIds:string[];nodeIds:string[];flowCount:number;trackCount:number;validate:(doc:DesignDocument)=>void;}
const clone=<T,>(v:T):T=>structuredClone(v);
function validated(doc:DesignDocument){const raw=packedProject(doc);if(new TextEncoder().encode(raw).length>50_000_000)throw Error('This move would exceed the 50 MB project limit.');return parseDocument(raw);}
const fail=(message:string):never=>{throw Error(message);};
function page(doc:DesignDocument,id:string){return doc.pages.find(p=>p.id===id)??fail('A selected page is no longer available.');}
function actions(list:PrototypeAction[]):PrototypeAction[]{return list.flatMap(a=>[a,...(a.branches??[]).flatMap(b=>actions(b.actions))]);}
function localTargets(n:DesignNode){return [...(n.targetId?[n.targetId]:[]),...(n.reactions??[]).flatMap(r=>actions(r.actions).filter(a=>['navigate','open-overlay','swap-overlay','scroll-to','change-variant','play-audio'].includes(a.type)&&a.targetId).map(a=>a.targetId!))];}
function checkLocalLinks(doc:DesignDocument,moved:Set<string>){const owner=new Map(doc.pages.flatMap(p=>p.nodes.map(n=>[n.id,p.id] as const)));for(const p of doc.pages)for(const n of p.nodes)for(const id of localTargets(n))if((moved.has(n.id)||moved.has(id))&&owner.get(id)!==p.id)fail('This move would split a page-local prototype connection. Move its source and destination together, or remove the connection first.');}
function sameGeometry(a:DesignNode,ap:Page,b:DesignNode,bp:Page){const am=worldMatrix(a,ap.nodes),bm=worldMatrix(b,bp.nodes);return [...am,a.width,a.height].every((v,i)=>Math.abs(v-[...bm,b.width,b.height][i])<=1e-7+1e-9*Math.abs(v));}
function sameSettings(a:NonNullable<Page['motion']>,b:NonNullable<Page['motion']>){return a.duration===b.duration&&a.fps===b.fps&&a.loop===b.loop;}

/** Identity-preserving same-document move. Context that cannot be retained
 * without changing other artwork is refused; no hidden copies or detachments. */
export function moveDocumentLayers(input:DesignDocument,request:MoveLayersRequest):MoveLayersResult{
 const doc=validated(input);hydrateLegacyInstances(doc);const before=clone(doc),source=page(doc,request.sourcePageId),target=page(doc,request.destinationPageId);
 if(source===target)fail('Choose another destination page.');
 if(doc.slides?.pageId===source.id||doc.slides?.pageId===target.id)fail('Move presentation artwork with the Slides workspace controls. Deck pages are not supported by Move to page.');
 if(!Array.isArray(request.nodeIds)||!request.nodeIds.length||request.nodeIds.length>20000||request.nodeIds.some(id=>!source.nodes.some(n=>n.id===id)))fail('Select existing layers on the current page.');
 const requested=new Set(request.nodeIds);if(source.nodes.some(n=>requested.has(n.id)&&isLocked(n,source.nodes)))fail('Unlock the selected layers and their ancestors before moving them.');
 const ids=new Set(copyWhiteboardSelection(doc,source.id,request.nodeIds).ids),roots=visibleLayerRows(source.nodes,[]).filter(n=>ids.has(n.id)&&!ids.has(n.parentId??'')).reverse(),connectorGlyphs=new Set((doc.whiteboard?.connectors??[]).flatMap(c=>[c.labelId,c.startArrowId,c.endArrowId]));
 if([...ids].some(id=>!source.nodes.some(n=>n.id===id)))fail('This selection shares whiteboard ownership with another page. Keep the complete logical object on one page before moving it.');
 if(!roots.length)fail('Select layers to move.');
 if(target.nodes.length+ids.size>20000)fail('The destination would exceed 20,000 layers. Choose another page.');
 if(target.nodes.some(n=>!n.parentId&&n.mask))fail('The destination has a page-level sibling mask. Group that mask and its artwork before moving layers here.');
 for(const root of roots){
  if(isLocked(root,source.nodes)&&(!connectorGlyphs.has(root.id)||requested.has(root.id)))fail('Unlock the selected layers and their ancestors before moving them.');
  if(root.instanceRootId&&!ids.has(root.instanceRootId))fail('Move the complete instance, or detach it before moving generated child layers.');
  if(maskForNode(source.nodes,root.id))fail('Move the containing mask group instead of a mask source or masked sibling.');
  if(root.parentId){const m=worldMatrix(source.nodes.find(n=>n.id===root.parentId)!,source.nodes);if(Math.abs(m[0]*m[3]-m[1]*m[2])<1e-12)fail('The parent transform is collapsed. Restore its scale before moving layers between pages.');}
  let ancestor=source.nodes.find(n=>n.id===root.parentId);const seen=new Set<string>();
  while(ancestor&&!ids.has(ancestor.id)){
   if(seen.has(ancestor.id))fail('Cyclic layer hierarchy.');seen.add(ancestor.id);
   if(ancestor.type==='component'||ancestor.type==='instance'||ancestor.instanceRootId||ancestor.booleanOp)fail('Move the containing component, instance or Boolean object instead of changing its owned structure.');
   if(ancestor.prototypeScroll&&ancestor.prototypeScroll!=='none'||root.prototypePosition&&root.prototypePosition!=='normal')fail('This layer depends on a prototype scroll or positioned container. Move the containing frame instead.');
   if(ancestor.locked)fail('Unlock the selected layers and their ancestors before moving them.');
   if(ancestor.clip||!ancestor.visible||ancestor.opacity!==1||effectsFor(ancestor).some(e=>e.visible)||ancestor.blendMode&&ancestor.blendMode!=='normal'&&ancestor.blendMode!=='pass-through'||ancestor.isolate||Object.keys(ancestor.variableModes??{}).length||maskForNode(source.nodes,ancestor.id))fail('This layer inherits clipping, masking, appearance or variable modes. Move its containing frame/group to preserve that context.');
   if(source.motion?.tracks.some(t=>t.nodeId===ancestor!.id))fail('This layer inherits ancestor animation. Move the animated container together with its children.');
   ancestor=source.nodes.find(n=>n.id===ancestor!.parentId);
  }
 }
 for(const set of doc.componentSets??[]){const owned=[set.containerId,set.defaultComponentId,...set.variants.map(v=>v.componentId)];if(owned.some(id=>ids.has(id))&&!owned.every(id=>ids.has(id)))fail('Move the complete component set, including its container and every variant.');}
 for(const n of allNodes(doc))for(const prop of n.componentMetadata?.properties??[])if(ids.has(n.id)!==ids.has(prop.targetId))fail('This move would split a component property from its target. Move the complete main component.');
 const board=doc.whiteboard;if(board){
  const complete=(owned:string[],message:string)=>{if(owned.some(id=>ids.has(id))&&!owned.every(id=>ids.has(id)))fail(message);};
  for(const s of board.stickies)complete([s.frameId,s.textId,s.authorId],'Move the complete sticky note.');
  for(const t of board.tables)complete([t.frameId,...t.cells.flatMap(c=>[c.rectId,c.textId])],'Move the complete table.');
  for(const c of board.connectors)complete([c.nodeId,c.labelId,c.startArrowId,c.endArrowId,c.fromId,c.toId],'A connector and both endpoints must stay on one page. Select both connected objects together.');
  for(const m of board.mindMaps){const owned=[m.rootId,...m.nodeIds,...m.connectorIds.flatMap(id=>{const c=board.connectors.find(c=>c.id===id);return c?[c.nodeId,c.labelId,c.startArrowId,c.endArrowId,c.fromId,c.toId]:[fail('This mind map has an unavailable connector.')];})];complete(owned,'Move the complete mind map, including its connectors and topics.');}
 }
 const tracks=source.motion?.tracks.filter(t=>ids.has(t.nodeId))??[];
 if(tracks.length&&target.motion&&!sameSettings(source.motion!,target.motion))fail('The two pages have different timeline duration, frame rate or loop settings. Match those settings before moving animated layers.');
 for(const root of roots)if(tracks.some(t=>descendants(source.nodes,[root.id]).includes(t.nodeId))&&root.parentId){const parent=source.nodes.find(n=>n.id===root.parentId)!,m=worldMatrix(parent,source.nodes);if(Math.abs(m[0]-1)>1e-9||Math.abs(m[1])>1e-9||Math.abs(m[2])>1e-9||Math.abs(m[3]-1)>1e-9)fail('Animated layers can only leave translation-only ancestors. Move their transformed container instead.');}
 const flows=source.flows?.filter(f=>ids.has(f.frameId))??[];
 if(flows.some(f=>target.flows?.some(t=>t.id===f.id)))fail('The destination already contains a flow with this ID. Choose another page.');
 if(tracks.length){const occupied=new Set((target.motion?.tracks??[]).flatMap(t=>[t.id,...t.keyframes.map(k=>k.id)]));if(tracks.some(t=>[t.id,...t.keyframes.map(k=>k.id)].some(id=>occupied.has(id))))fail('The destination timeline has conflicting track or keyframe IDs. Choose another page.');}
 const coordinates=new Map(source.nodes.filter(n=>ids.has(n.id)).map(n=>[n.id,{x:n.x,y:n.y}]));
 const matrices=new Map(roots.map(n=>[n.id,worldMatrix(n,source.nodes)]));
 const transforms=roots.map(n=>({node:n,before:clone(n)}));
 reparentPreservingWorld(source.nodes,roots.filter(n=>n.parentId!==null).map(n=>n.id),null,matrices);
 // The generic reparent command conservatively overrides all instance transform
 // fields. A page move must keep unchanged fields live with the main instead.
 for(const {node:n,before:old} of transforms){const keys=new Set(old.overrideKeys??[]);for(const field of ['rotation','flipX','flipY','motionScaleX','motionScaleY'] as const){const fallback=field==='flipX'||field==='flipY'?false:field==='rotation'?0:1,a=old[field]??fallback,b=n[field]??fallback;if(a===b||typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<1e-9){(n as unknown as Record<string,unknown>)[field]=old[field];}else if(n.type==='instance')keys.add(field);}if(n.type==='instance')n.overrideKeys=[...keys];}
 const moving=roots.flatMap(root=>{const owned=new Set(descendants(source.nodes,[root.id]));return source.nodes.filter(n=>owned.has(n.id));});for(const root of roots){if(root.sizingX==='fill')root.sizingX='fixed';if(root.sizingY==='fill')root.sizingY='fixed';}
 source.nodes=source.nodes.filter(n=>!ids.has(n.id));target.nodes.push(...moving);if(doc.fileCover?.pageId===source.id&&ids.has(doc.fileCover.frameId))doc.fileCover={pageId:target.id,frameId:doc.fileCover.frameId};
 if(flows.length){source.flows=source.flows!.filter(f=>!ids.has(f.frameId));(target.flows??=[]).push(...flows);}
 if(tracks.length){source.motion!.tracks=source.motion!.tracks.filter(t=>!ids.has(t.nodeId));if(!target.motion)target.motion={...clone(source.motion!),tracks:[]};for(const t of tracks)if(t.property==='x'||t.property==='y'){const n=moving.find(n=>n.id===t.nodeId)!,delta=n[t.property]-coordinates.get(n.id)![t.property];for(const k of t.keyframes)k.value=Number(k.value)+delta;}target.motion.tracks.push(...tracks);}
 // Existing cross-page metadata is accepted by parts of the legacy schema;
 // refuse a move that would silently take ownership of someone else's record.
 for(const p of doc.pages)if(p.id!==target.id){if(p.flows?.some(f=>ids.has(f.frameId))||p.motion?.tracks.some(t=>ids.has(t.nodeId)))fail('Another page has flow or timeline metadata for these layers. Resolve that ownership before moving them.');}
 checkLocalLinks(doc,ids);
 const validate=(next:DesignDocument)=>{
  validated(next);checkLocalLinks(next,ids);const nextTarget=page(next,target.id),original=page(before,source.id);
  for(const n of original.nodes.filter(n=>ids.has(n.id))){const moved=nextTarget.nodes.find(a=>a.id===n.id);if(!moved||!sameGeometry(n,original,moved,nextTarget))fail('The component/layout update would change the moved artwork geometry. Move its containing frame/group instead.');}
  // Baking a main's old ancestor transform must not change linked artwork on
  // other pages when the shared component engine runs.
  for(const p of before.pages)for(const n of p.nodes)if(!ids.has(n.id)&&(ids.has(n.componentId??'')||ids.has(n.sourceId??''))){const np=next.pages.find(p=>p.nodes.some(a=>a.id===n.id)),nn=np?.nodes.find(a=>a.id===n.id);if(!np||!nn||!sameGeometry(n,p,nn,np))fail('Moving this main would change linked instances. Move the containing frame/group instead.');}
 };
 validate(doc);return {document:doc,rootIds:roots.map(n=>n.id),nodeIds:[...ids],flowCount:flows.length,trackCount:tracks.length,validate};
}
