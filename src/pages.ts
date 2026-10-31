import {reconcileRemovedDocumentCover} from './document-cover';
import {parseDocument} from './model';
import type {DesignDocument,Page} from './model';
import {allNodes,hydrateLegacyInstances} from './components-model';
import {remapCopiedComponentSets,remapCopiedNodes,swapPropertyIds} from './clipboard';
import {copyWhiteboardSelection,pasteWhiteboardSelection} from './whiteboard';
import type {PrototypeAction,PrototypeReaction} from './prototype';

const fresh=()=>crypto.randomUUID();
const clone=<T,>(value:T):T=>structuredClone(value);
function validated(doc:DesignDocument){
 const raw=JSON.stringify(doc);
 if(new TextEncoder().encode(raw).length>50_000_000)throw Error('This change would exceed the 50 MB project limit. Use a smaller project.');
 return parseDocument(raw);
}
function sourceDraft(doc:DesignDocument){const draft=validated(doc);hydrateLegacyInstances(draft);return draft;}
function findPage(doc:DesignDocument,id:string){const page=doc.pages.find(p=>p.id===id);if(!page)throw Error('This page no longer exists.');return page;}
function copyName(pages:Page[],name:string){const base=(name.slice(0,980)||'Page')+' copy';let result=base,index=2;const used=new Set(pages.map(p=>p.name));while(used.has(result))result=base+' '+index++;return result;}
function mapAction(a:PrototypeAction,map:Map<string,string>):PrototypeAction{
 const out=clone(a);out.id=fresh();
 if(a.targetId)out.targetId=map.get(a.targetId)??a.targetId;
 if(a.componentId)out.componentId=map.get(a.componentId)??a.componentId;
 if(a.branches)out.branches=a.branches.map(branch=>({...clone(branch),actions:branch.actions.map(action=>mapAction(action,map))}));
 return out;
}
function mapReactions(reactions:PrototypeReaction[],map:Map<string,string>){return reactions.map(r=>({...clone(r),id:fresh(),actions:r.actions.map(a=>mapAction(a,map))}));}
function actionReferences(actions:PrototypeAction[],ids:Set<string>):boolean{return actions.some(a=>ids.has(a.targetId??'')||ids.has(a.componentId??'')||(a.branches??[]).some(b=>actionReferences(b.actions,ids)));}
function changedActionReferences(actions:PrototypeAction[],map:Map<string,string>):boolean{return actions.some(a=>!!a.targetId&&map.has(a.targetId)||!!a.componentId&&map.has(a.componentId)||(a.branches??[]).some(b=>changedActionReferences(b.actions,map)));}
function hasSplitSet(doc:DesignDocument,ids:Set<string>){return doc.componentSets?.some(s=>[s.containerId,s.defaultComponentId,...s.variants.map(v=>v.componentId)].some(id=>ids.has(id))&&![s.containerId,s.defaultComponentId,...s.variants.map(v=>v.componentId)].every(id=>ids.has(id)));}
function hasSplitMindMap(doc:DesignDocument,ids:Set<string>){const board=doc.whiteboard;return board?.mindMaps.some(m=>{const owned=[m.rootId,...m.nodeIds,...m.connectorIds.flatMap(id=>{const c=board.connectors.find(c=>c.id===id);return c?[c.nodeId,c.labelId,c.startArrowId,c.endArrowId,c.fromId,c.toId]:[];})];return owned.some(id=>ids.has(id))&&!owned.every(id=>ids.has(id));});}

/** Pure, validated page copy. Internal layer references follow the copy; external
 * references and shared library identities stay within the original document. */
export function duplicateDocumentPage(input:DesignDocument,pageId:string): {document:DesignDocument;pageId:string;notice?:string}{
 const doc=sourceDraft(input),source=findPage(doc,pageId);
 if(doc.pages.length>=1000)throw Error('A project can contain up to 1,000 pages.');
 if(doc.slides?.pageId===pageId)throw Error('A presentation deck page cannot be duplicated here. Duplicate individual slides in the presentation workspace.');
 const ids=new Set(source.nodes.map(n=>n.id)),map=new Map(source.nodes.map(n=>[n.id,fresh()])),page=clone(source),definitions=new Map(allNodes(doc).filter(n=>n.type==='component').map(n=>[n.id,n]));
 if(hasSplitSet(doc,ids))throw Error('This page shares a component set with another page. Move the complete set onto one page before duplicating.');
 if(hasSplitMindMap(doc,ids))throw Error('This page shares a mind map with another page. Move the complete map onto one page before duplicating.');
 page.id=fresh();page.name=copyName(doc.pages,source.name);
 page.nodes=remapCopiedNodes(source.nodes,map,swapPropertyIds(allNodes(doc)));const guideCopies=new Map<string,string>();
 // Remap only schema references; user strings, URLs, expressions, variable IDs
 // and unrecognized metadata containing an "id" key are ordinary data.
 for(let i=0;i<page.nodes.length;i++){
  const original=source.nodes[i],copy=page.nodes[i];
  if(original.reactions)copy.reactions=mapReactions(original.reactions,map);
  if(original.layoutGuides)copy.layoutGuides=original.layoutGuides.map(g=>{const id=original.layoutGuideStyleId&&doc.layoutGuideStyles?.some(s=>s.id===original.layoutGuideStyleId)?g.id:fresh();guideCopies.set(copy.id+'\0'+g.id,id);return {...clone(g),id};});
  if(original.sourceId&&!map.has(original.sourceId)){
   const keys=new Set(copy.overrideKeys??[]);
   if(original.targetId&&map.has(original.targetId))keys.add('targetId');
   if(original.componentId&&map.has(original.componentId))keys.add('componentId');
   if(original.reactions?.some(r=>changedActionReferences(r.actions,map)))keys.add('reactions');
   copy.overrideKeys=[...keys];
  }
  if(original.type==='instance'&&original.componentId&&!map.has(original.componentId))for(const prop of definitions.get(original.componentId)?.componentMetadata?.properties??[]){
   if(prop.type!=='instance-swap')continue;
   const value=Object.hasOwn(original.propertyValues??{},prop.id)?original.propertyValues![prop.id]:prop.defaultValue;
   if(typeof value==='string'&&map.has(value))copy.propertyValues={...copy.propertyValues,[prop.id]:map.get(value)!};
  }
 }
 for(const copy of page.nodes)for(const binding of Object.values(copy.layoutGuideBindings??{}))binding.guideId=guideCopies.get(binding.ownerId+'\0'+binding.guideId)??binding.guideId;
 page.comments=source.comments.map(c=>({...clone(c),id:fresh(),...(c.replies?{replies:c.replies.map(r=>({...clone(r),id:fresh()}))}:{}),...(c.anchor?{anchor:{...c.anchor,nodeId:map.get(c.anchor.nodeId)??c.anchor.nodeId}}:{})}));
 if(source.guides)page.guides=source.guides.map(g=>({...clone(g),id:fresh()}));
 if(source.flows)page.flows=source.flows.map(f=>({...clone(f),id:fresh(),frameId:map.get(f.frameId)??f.frameId}));
 if(source.motion)page.motion={...clone(source.motion),tracks:source.motion.tracks.map(t=>({...clone(t),id:fresh(),nodeId:map.get(t.nodeId)??t.nodeId,keyframes:t.keyframes.map(k=>({...clone(k),id:fresh()}))}))};
 doc.pages.splice(doc.pages.indexOf(source)+1,0,page);
 const sets=remapCopiedComponentSets(doc.componentSets??[],map);if(sets.length)(doc.componentSets??=[]).push(...sets);
 const records=copyWhiteboardSelection(doc,source.id,source.nodes.map(n=>n.id)).records;pasteWhiteboardSelection(doc,page.id,records,map);
 const copiedLibraryDefinition=input.componentLibraries?.some(l=>Object.values(l.maps.node).some(id=>ids.has(id)));
 return {document:validated(doc),pageId:page.id,...(copiedLibraryDefinition?{notice:'Library definitions on the copied page are local copies. Publication and update ownership remain with the original definitions.'}:{})};
}

/** Destination index is the page's final zero-based position. */
export function reorderDocumentPage(input:DesignDocument,pageId:string,index:number):DesignDocument{
 const doc=validated(input),page=findPage(doc,pageId);
 if(!Number.isInteger(index)||index<0||index>=doc.pages.length)throw Error('Choose an available page position.');
 const current=doc.pages.indexOf(page);if(current===index)return input;
 doc.pages.splice(current,1);doc.pages.splice(index,0,page);return validated(doc);
}

/** Refuse deletion when any surviving layer or page metadata still uses the
 * removed artwork. No detach, reference dropping or silent reassignment. */
export function removeDocumentPage(input:DesignDocument,pageId:string):DesignDocument{
 const doc=sourceDraft(input),page=findPage(doc,pageId);
 if(doc.pages.length<=1)throw Error('Keep at least one page in the project.');
 if(doc.slides?.pageId===pageId)throw Error('The presentation deck page cannot be deleted here. Manage its slides in the presentation workspace.');
 const ids=new Set(page.nodes.map(n=>n.id)),swaps=swapPropertyIds(allNodes(doc));
 const linked=doc.pages.filter(p=>p.id!==pageId).some(p=>
  p.flows?.some(f=>ids.has(f.frameId))||p.motion?.tracks.some(t=>ids.has(t.nodeId))||p.nodes.some(n=>
   [n.componentId,n.sourceId,n.instanceRootId,n.targetId].some(id=>!!id&&ids.has(id))||
   (n.componentMetadata?.properties??[]).some(prop=>ids.has(prop.targetId)||prop.type==='instance-swap'&&ids.has(String(prop.defaultValue)))||
   (swaps[n.componentId??'']??[]).some(id=>ids.has(String(n.propertyValues?.[id]??'')))||
   (n.reactions??[]).some(r=>actionReferences(r.actions,ids))));
 if(linked)throw Error('Other pages still use layers or component definitions on this page. Remove those references or move the definitions before deleting it.');
 if(hasSplitSet(doc,ids))throw Error('This page shares a component set with another page. Move the complete set onto one page before deleting.');
 if(hasSplitMindMap(doc,ids))throw Error('This page shares a mind map with another page. Move the complete map onto one page before deleting.');
 doc.pages=doc.pages.filter(p=>p.id!==pageId);
 if(doc.componentSets)doc.componentSets=doc.componentSets.filter(s=>!ids.has(s.containerId));
 if(doc.whiteboard){const b=doc.whiteboard;if(b.codeBlocks)b.codeBlocks=b.codeBlocks.filter(c=>!ids.has(c.frameId));b.stickies=b.stickies.filter(s=>!ids.has(s.frameId));b.tables=b.tables.filter(t=>!ids.has(t.frameId));const removedConnectors=new Set(b.connectors.filter(c=>ids.has(c.nodeId)).map(c=>c.id));b.connectors=b.connectors.filter(c=>!removedConnectors.has(c.id));b.mindMaps=b.mindMaps.filter(m=>!ids.has(m.rootId));b.drawings=b.drawings.filter(d=>!ids.has(d.nodeId));if(b.voting)b.voting.votes=b.voting.votes.filter(v=>!ids.has(v.nodeId));}
 reconcileRemovedDocumentCover(input,doc);return validated(doc);
}
