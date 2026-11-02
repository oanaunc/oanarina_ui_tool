import {packedProject} from './image-sharing';
import {descendants,isLocked,parseDocument,uid} from './model';
import type {DesignDocument,DesignNode,Page} from './model';
import {allNodes,hydrateLegacyInstances} from './components-model';
import {copyWhiteboardSelection} from './whiteboard';
import {effectsFor} from './effects';
import {maskForNode} from './masks';
import {reparentPreservingWorld,worldMatrix} from './transforms';
import type {PrototypeAction} from './prototype';
import {visibleLayerRows} from './selection';

export interface MoveLayersRequest {sourcePageId:string;destinationPageId:string;nodeIds:string[];}
export interface RemovedConnection {pageId:string;nodeId:string;name:string;count:number;}
/** `inherited` names what the layers stop receiving from the parent they leave. `belowMask` says they landed under a page-level mask on the destination so it does not mask them. */
export interface MoveLayersResult {document:DesignDocument;rootIds:string[];nodeIds:string[];flowCount:number;trackCount:number;commentCount:number;removedConnections:RemovedConnection[];inherited:string[];guidePins:number;belowMask:boolean;validate:(doc:DesignDocument)=>void;}
const clone=<T,>(v:T):T=>structuredClone(v);
function validated(doc:DesignDocument){const raw=packedProject(doc);if(new TextEncoder().encode(raw).length>50_000_000)throw Error('This move would exceed the 50 MB project limit.');return parseDocument(raw);}
const fail=(message:string):never=>{throw Error(message);};
function page(doc:DesignDocument,id:string){return doc.pages.find(p=>p.id===id)??fail('A selected page is no longer available.');}
function actions(list:PrototypeAction[]):PrototypeAction[]{return list.flatMap(a=>[a,...(a.branches??[]).flatMap(b=>actions(b.actions))]);}
const pageLocal=(a:PrototypeAction)=>['navigate','open-overlay','swap-overlay','scroll-to','change-variant','play-audio'].includes(a.type)&&!!a.targetId;
function localTargets(n:DesignNode){return [...(n.targetId?[n.targetId]:[]),...(n.reactions??[]).flatMap(r=>actions(r.actions).filter(pageLocal).map(a=>a.targetId!))];}
function withoutCrossing(list:PrototypeAction[],crossing:(id:string)=>boolean,removed:()=>void):PrototypeAction[]{return list.flatMap(a=>{if(pageLocal(a)&&crossing(a.targetId!)){removed();return [];}if(!a.branches)return [a];const branches=a.branches.map(b=>({...b,actions:withoutCrossing(b.actions,crossing,removed)}));return a.branches.some(b=>b.actions.length)&&!branches.some(b=>b.actions.length)?[]:[{...a,branches}];});}
/** Connections stay within a page. Both ends moving keeps one; an end left behind loses that action, and a reaction with nothing left to do goes too. */
function removeSplitConnections(doc:DesignDocument,moved:Set<string>){const owner=new Map(doc.pages.flatMap(p=>p.nodes.map(n=>[n.id,p.id] as const))),removed:RemovedConnection[]=[];for(const p of doc.pages)for(const n of p.nodes){const crossing=(id:string)=>(moved.has(n.id)||moved.has(id))&&owner.get(id)!==p.id;let count=0;if(n.targetId&&crossing(n.targetId)){n.targetId=null;count++;}if(n.reactions){const next=n.reactions.flatMap(r=>{const before=count,list=withoutCrossing(r.actions,crossing,()=>count++);return count>before&&!list.length?[]:[{...r,actions:list}];});if(count)n.reactions=next;}if(count)removed.push({pageId:p.id,nodeId:n.id,name:n.name,count});}return removed;}
function checkLocalLinks(doc:DesignDocument,moved:Set<string>){const owner=new Map(doc.pages.flatMap(p=>p.nodes.map(n=>[n.id,p.id] as const)));for(const p of doc.pages)for(const n of p.nodes)for(const id of localTargets(n))if((moved.has(n.id)||moved.has(id))&&owner.get(id)!==p.id)fail('This move would split a page-local prototype connection. Move its source and destination together, or remove the connection first.');}
function sameGeometry(a:DesignNode,ap:Page,b:DesignNode,bp:Page){const am=worldMatrix(a,ap.nodes),bm=worldMatrix(b,bp.nodes);return [...am,a.width,a.height].every((v,i)=>Math.abs(v-[...bm,b.width,b.height][i])<=1e-7+1e-9*Math.abs(v));}
function sameSettings(a:NonNullable<Page['motion']>,b:NonNullable<Page['motion']>){return a.duration===b.duration&&a.fps===b.fps&&a.loop===b.loop;}

/** Identity-preserving same-document move. Layers leave their parent as they would in the Layers panel, so its clipping, opacity and animation stop applying and the review says so. Variable modes are carried, because a layer's own colors should not change by moving it. Only moves that would change artwork left behind, or that cannot keep world geometry, are refused; no hidden copies or detachments. */
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
 const inherited=new Set<string>(),expectedMasks=new Map<string,string|undefined>();
 for(const root of roots){
  if(isLocked(root,source.nodes)&&(!connectorGlyphs.has(root.id)||requested.has(root.id)))fail('Unlock the selected layers and their ancestors before moving them.');
  if(root.instanceRootId&&!ids.has(root.instanceRootId))fail('Move the complete instance, or detach it before moving generated child layers.');
  const mask=maskForNode(source.nodes,root.id);
  if(mask?.id===root.id){if(source.nodes.some(n=>n.parentId===root.parentId&&n.id!==root.id&&maskForNode(source.nodes,n.id)?.id===root.id&&!ids.has(n.id)))fail('Move this mask with its masked artwork, or the group that holds them. The artwork left behind would lose its mask.');}
  else if(mask&&!ids.has(mask.id))inherited.add('mask');
  expectedMasks.set(root.id,mask&&ids.has(mask.id)?mask.id:undefined);
  if(root.parentId){const m=worldMatrix(source.nodes.find(n=>n.id===root.parentId)!,source.nodes);if(Math.abs(m[0]*m[3]-m[1]*m[2])<1e-12)fail('The parent transform is collapsed. Restore its scale before moving layers between pages.');}
  let ancestor=source.nodes.find(n=>n.id===root.parentId);const seen=new Set<string>(),modes:Record<string,string>={};
  while(ancestor&&!ids.has(ancestor.id)){
   if(seen.has(ancestor.id))fail('Cyclic layer hierarchy.');seen.add(ancestor.id);
   if(ancestor.type==='component'||ancestor.type==='instance'||ancestor.instanceRootId||ancestor.booleanOp)fail('Move the containing component, instance or Boolean object instead of changing its owned structure.');
   if(ancestor.locked)fail('Unlock the selected layers and their ancestors before moving them.');
   if(ancestor.prototypeScroll&&ancestor.prototypeScroll!=='none')inherited.add('scrolling');
   if(ancestor.clip)inherited.add('clipping');if(!ancestor.visible)inherited.add('hidden state');if(ancestor.opacity!==1)inherited.add('opacity');if(effectsFor(ancestor).some(e=>e.visible))inherited.add('effects');if(ancestor.blendMode&&ancestor.blendMode!=='normal'&&ancestor.blendMode!=='pass-through'||ancestor.isolate)inherited.add('blending');if(maskForNode(source.nodes,ancestor.id))inherited.add('mask');if(source.motion?.tracks.some(t=>t.nodeId===ancestor!.id))inherited.add('animation');
   for(const [collection,mode] of Object.entries(ancestor.variableModes??{}))modes[collection]??=mode;
   ancestor=source.nodes.find(n=>n.id===ancestor!.parentId);
  }
  if(Object.keys(modes).length)root.variableModes={...modes,...root.variableModes};
  if(root.parentId&&root.prototypePosition&&root.prototypePosition!=='normal'){delete root.prototypePosition;inherited.add('fixed or sticky position');}
 }
 // A pin needs its guide's frame above it. One left behind cannot hold, so it is cleared here and reported instead of vanishing in the next layout pass.
 let guidePins=0;for(const n of source.nodes.filter(n=>ids.has(n.id))){const bindings=n.layoutGuideBindings;if(!bindings)continue;for(const axis of ['x','y'] as const)if(bindings[axis]&&!ids.has(bindings[axis].ownerId)){delete bindings[axis];guidePins++;inherited.add('guide pins');}if(!Object.keys(bindings).length)delete n.layoutGuideBindings;}
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
 if(tracks.length&&target.motion?.tracks.length&&!sameSettings(source.motion!,target.motion)&&Math.max(...tracks.flatMap(t=>t.keyframes.map(k=>k.time)))>target.motion.duration)fail('These layers animate past the end of the destination timeline. Lengthen that timeline before moving them.');
 for(const root of roots)if(tracks.some(t=>descendants(source.nodes,[root.id]).includes(t.nodeId))&&root.parentId){const parent=source.nodes.find(n=>n.id===root.parentId)!,m=worldMatrix(parent,source.nodes);if(Math.abs(m[0]-1)>1e-9||Math.abs(m[1])>1e-9||Math.abs(m[2])>1e-9||Math.abs(m[3]-1)>1e-9)fail('Animated layers can only leave translation-only ancestors. Move their transformed container instead.');}
 const flows=source.flows?.filter(f=>ids.has(f.frameId))??[];
 for(const f of flows)if(target.flows?.some(t=>t.id===f.id))f.id=uid();
 if(tracks.length){const occupied=new Set((target.motion?.tracks??[]).flatMap(t=>[t.id,...t.keyframes.map(k=>k.id)]));for(const t of tracks){if(occupied.has(t.id))t.id=uid();for(const k of t.keyframes)if(occupied.has(k.id))k.id=uid();}}
 const comments=source.comments.filter(c=>c.anchor&&ids.has(c.anchor.nodeId)),taken=new Set(target.comments.map(c=>c.id));for(const c of comments)if(taken.has(c.id))c.id=uid();
 const coordinates=new Map(source.nodes.filter(n=>ids.has(n.id)).map(n=>[n.id,{x:n.x,y:n.y}]));
 const matrices=new Map(roots.map(n=>[n.id,worldMatrix(n,source.nodes)]));
 const transforms=roots.map(n=>({node:n,before:clone(n)}));
 reparentPreservingWorld(source.nodes,roots.filter(n=>n.parentId!==null).map(n=>n.id),null,matrices);
 // The generic reparent command conservatively overrides all instance transform
 // fields. A page move must keep unchanged fields live with the main instead.
 for(const {node:n,before:old} of transforms){const keys=new Set(old.overrideKeys??[]);for(const field of ['rotation','flipX','flipY','motionScaleX','motionScaleY'] as const){const fallback=field==='flipX'||field==='flipY'?false:field==='rotation'?0:1,a=old[field]??fallback,b=n[field]??fallback;if(a===b||typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<1e-9){(n as unknown as Record<string,unknown>)[field]=old[field];}else if(n.type==='instance')keys.add(field);}if(n.type==='instance')n.overrideKeys=[...keys];}
 const moving=roots.flatMap(root=>{const owned=new Set(descendants(source.nodes,[root.id]));return source.nodes.filter(n=>owned.has(n.id));});for(const root of roots){if(root.sizingX==='fill')root.sizingX='fixed';if(root.sizingY==='fill')root.sizingY='fixed';}
 // A page-level mask would take anything placed above it, so moved layers land just below the lowest one.
 const lowestMask=target.nodes.findIndex(n=>!n.parentId&&n.mask),belowMask=lowestMask>=0;
 source.nodes=source.nodes.filter(n=>!ids.has(n.id));target.nodes.splice(belowMask?lowestMask:target.nodes.length,0,...moving);for(const root of roots)if(!root.mask&&maskForNode(target.nodes,root.id)?.id!==expectedMasks.get(root.id))fail('This selection puts artwork above a mask that does not mask it. Group the mask with its own artwork before moving them.');
 if(comments.length){source.comments=source.comments.filter(c=>!comments.includes(c));target.comments.push(...comments);}
 if(doc.fileCover?.pageId===source.id&&ids.has(doc.fileCover.frameId))doc.fileCover={pageId:target.id,frameId:doc.fileCover.frameId};
 if(flows.length){source.flows=source.flows!.filter(f=>!ids.has(f.frameId));(target.flows??=[]).push(...flows);}
 if(tracks.length){source.motion!.tracks=source.motion!.tracks.filter(t=>!ids.has(t.nodeId));if(!target.motion)target.motion={...clone(source.motion!),tracks:[]};else if(!target.motion.tracks.length)Object.assign(target.motion,{duration:source.motion!.duration,fps:source.motion!.fps,loop:source.motion!.loop});for(const t of tracks)if(t.property==='x'||t.property==='y'){const n=moving.find(n=>n.id===t.nodeId)!,delta=n[t.property]-coordinates.get(n.id)![t.property];for(const k of t.keyframes)k.value=Number(k.value)+delta;}target.motion.tracks.push(...tracks);}
 // Existing cross-page metadata is accepted by parts of the legacy schema;
 // refuse a move that would silently take ownership of someone else's record.
 for(const p of doc.pages)if(p.id!==target.id){if(p.flows?.some(f=>ids.has(f.frameId))||p.motion?.tracks.some(t=>ids.has(t.nodeId)))fail('Another page has flow or timeline metadata for these layers. Resolve that ownership before moving them.');}
 const removedConnections=removeSplitConnections(doc,ids);checkLocalLinks(doc,ids);
 const validate=(next:DesignDocument)=>{
  validated(next);checkLocalLinks(next,ids);const nextTarget=page(next,target.id),original=page(before,source.id);
  for(const n of original.nodes.filter(n=>ids.has(n.id))){const moved=nextTarget.nodes.find(a=>a.id===n.id);if(!moved||!sameGeometry(n,original,moved,nextTarget))fail('The component/layout update would change the moved artwork geometry. Move its containing frame/group instead.');}
  // Baking a main's old ancestor transform must not change linked artwork on
  // other pages when the shared component engine runs.
  for(const p of before.pages)for(const n of p.nodes)if(!ids.has(n.id)&&(ids.has(n.componentId??'')||ids.has(n.sourceId??''))){const np=next.pages.find(p=>p.nodes.some(a=>a.id===n.id)),nn=np?.nodes.find(a=>a.id===n.id);if(!np||!nn||!sameGeometry(n,p,nn,np))fail('Moving this main would change linked instances. Move the containing frame/group instead.');}
 };
 validate(doc);return {document:doc,rootIds:roots.map(n=>n.id),nodeIds:[...ids],flowCount:flows.length,trackCount:tracks.length,commentCount:comments.length,removedConnections,inherited:[...inherited],guidePins,belowMask,validate};
}
