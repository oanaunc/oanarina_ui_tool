import {blankDocument,isLocked,node,parseDocument} from './model';
import type {DesignDocument,DesignNode} from './model';
import {allNodes,hydrateLegacyInstances,subtree} from './components-model';
import {remapCopiedComponentSets,remapCopiedNodes,swapPropertyIds} from './clipboard';
import {copyWhiteboardSelection,emptyWhiteboard,pasteWhiteboardSelection} from './whiteboard';
import {exportSelection,point,reparentPreservingWorld,worldMatrix} from './transforms';
import type {Matrix} from './transforms';
import {fontAssetKey,selectFontAssets} from './font-data';
import {textFontRequests} from './rich-text';
import type {SlideRole} from './slides';

export const CLIPBOARD_LIMIT=20_000_000;
export interface DesignClipboard {format:'forma-clipboard';version:1;project:DesignDocument;roots:string[];origin:{x:number;y:number};warnings:string[];slideRoles?:Record<string,SlideRole>;}
const clone=<T,>(value:T):T=>structuredClone(value);
function bounded(raw:string){if(new TextEncoder().encode(raw).length>CLIPBOARD_LIMIT)throw Error('This selection exceeds the 20 MB clipboard limit. Copy fewer layers or use a .oui file.');}
function limit(doc:DesignDocument){if(allNodes(doc).length>20000)throw Error('Clipboard supports at most 20,000 layers including dependencies.');}
export function assertClipboardCutSafe(doc:DesignDocument,pageId:string,selection:string[]){
 const page=doc.pages.find(p=>p.id===pageId);if(!page)throw Error('The source page no longer exists.');if(page.nodes.some(n=>selection.includes(n.id)&&isLocked(n,page.nodes)))throw Error('Unlock the selected layers before cutting.');const copied=copyWhiteboardSelection(doc,pageId,selection),ids=new Set(copied.ids),mains=new Set(page.nodes.filter(n=>ids.has(n.id)&&n.type==='component').map(n=>n.id));
 if(!mains.size)return;const nodes=allNodes(doc),swaps=swapPropertyIds(nodes),references=(actions:NonNullable<DesignNode['reactions']>[number]['actions']):boolean=>actions.some(a=>mains.has(a.componentId??'')||(a.branches??[]).some(b=>references(b.actions)));
 const used=nodes.some(n=>!ids.has(n.id)&&(mains.has(n.componentId??'')||(n.componentMetadata?.properties??[]).some(p=>p.type==='instance-swap'&&mains.has(String(p.defaultValue)))||(swaps[n.componentId??'']??[]).some(id=>mains.has(String(n.propertyValues?.[id]??'')))||(n.reactions??[]).some(r=>references(r.actions))));
 if(used)throw Error('Instances or other layers still use this main component. Copy it, or move it within the project instead of cutting it.');
 if(doc.componentSets?.some(s=>!ids.has(s.containerId)&&s.variants.some(v=>mains.has(v.componentId))))throw Error('This main is still part of a component set. Copy it, or remove it from the set before cutting.');
}
function closedReferences(doc:DesignDocument){
 const nodes=new Map(allNodes(doc).map(n=>[n.id,n])),variables=new Set(doc.variables?.map(v=>v.id)),styles=new Map(doc.styles?.map(s=>[s.id,s])),guides=new Set(doc.layoutGuideStyles?.map(s=>s.id)),collections=new Map(doc.variableCollections?.map(c=>[c.id,c]));
 const missing=()=>{throw Error('Clipboard contains an unresolved reference. Restore missing definitions or detach affected layers before copying.');};
 for(const n of nodes.values()){
  if(n.componentId&&nodes.get(n.componentId)?.type!=='component'||n.sourceId&&!nodes.has(n.sourceId)||n.instanceRootId&&nodes.get(n.instanceRootId)?.type!=='instance')missing();
  for(const p of n.componentMetadata?.properties??[])if(!nodes.has(p.targetId)||p.type==='instance-swap'&&nodes.get(String(p.defaultValue))?.type!=='component')missing();
  for(const [id,value] of Object.entries(n.propertyValues??{})){const p=nodes.get(n.componentId??'')?.componentMetadata?.properties?.find(p=>p.id===id);if(!p||p.type==='instance-swap'&&nodes.get(String(value))?.type!=='component')missing();}
  if(Object.values(n.variableBindings??{}).some(id=>!variables.has(id!))||Object.entries(n.styleIds??{}).some(([kind,id])=>styles.get(id!)?.type!==kind)||n.layoutGuideStyleId&&!guides.has(n.layoutGuideStyleId)||Object.entries(n.variableModes??{}).some(([id,mode])=>!collections.get(id)?.modes.some(m=>m.id===mode)))missing();
  if(n.targetId&&!nodes.has(n.targetId))missing();for(const r of n.reactions??[])for(const a of r.actions)if(['conditional','set-variable'].includes(a.type)||a.targetId&&!nodes.has(a.targetId)||a.componentId&&nodes.get(a.componentId)?.type!=='component')missing();
 }
 for(const set of doc.componentSets??[]){const container=nodes.get(set.containerId),variants=new Set(set.variants.map(v=>v.componentId));if(!container||!variants.has(set.defaultComponentId)||variants.size!==set.variants.length||set.variants.some(v=>nodes.get(v.componentId)?.type!=='component'||nodes.get(v.componentId)?.parentId!==container.id))missing();}
}
/** Only selected artwork and the definitions it references enter the system pasteboard. */
export function makeDesignClipboard(source:DesignDocument,pageId:string,selection:string[]):DesignClipboard{
 source=clone(source);hydrateLegacyInstances(source);
 const page=source.pages.find(p=>p.id===pageId);if(!page)throw Error('The source page no longer exists.');
 const copied=copyWhiteboardSelection(source,pageId,selection);if(!copied.ids.length)throw Error('Select a layer to copy.');
 const primary=new Map(exportSelection(page.nodes,copied.ids).map(n=>[n.id,clone(n)])),dependencies=new Map<string,DesignNode>(),all=new Map(allNodes(source).map(n=>[n.id,n])),warnings:string[]=[];
 for(const n of primary.values())if(n.exportGhost){Object.assign(n,{componentId:null,sourceId:undefined,instanceRootId:undefined,overrideKeys:undefined,componentMetadata:undefined,propertyValues:undefined,variableBindings:undefined,styleIds:undefined,layoutGuideStyleId:undefined,layout:'none',sizingX:'fixed',sizingY:'fixed'});delete n.exportGhost;}
 const queue=[...primary.values()],visited=new Set<string>(),swapIds=swapPropertyIds(allNodes(source));
 for(let i=0;i<queue.length;i++){
  const n=queue[i];if(visited.has(n.id))continue;visited.add(n.id);if(visited.size>20000)throw Error('Clipboard supports at most 20,000 layers including dependencies.');
  const refs=[n.componentId,...(n.componentMetadata?.properties??[]).filter(p=>p.type==='instance-swap').map(p=>String(p.defaultValue)),...(swapIds[n.componentId??'']??[]).map(id=>String(n.propertyValues?.[id]??''))];
  for(const id of refs){const main=all.get(id??'');if(!main||main.type!=='component')continue;const set=source.componentSets?.find(s=>s.variants.some(v=>v.componentId===main.id)),root=all.get(set?.containerId??main.id)??main,owner=source.pages.find(p=>p.nodes.some(n=>n.id===root.id))!,nodes=subtree(owner,root.id),target=nodes.some(n=>primary.has(n.id))?primary:dependencies;
   for(const node of nodes)if(!target.has(node.id)){const copy=clone(node);target.set(node.id,copy);queue.push(copy);}else if(target===primary&&primary.get(node.id)?.type==='group'&&node.type!=='group'){primary.set(node.id,clone(node));}
  }
 }
 for(const id of primary.keys())dependencies.delete(id);
 const normalize=(nodes:DesignNode[])=>{const ids=new Set(nodes.map(n=>n.id));for(const n of nodes)if(!ids.has(n.parentId??''))n.parentId=null;return remapCopiedNodes(nodes,new Map(nodes.map(n=>[n.id,n.id])),swapPropertyIds(allNodes(source)));};
 const selected=normalize([...primary.values()]),deps=normalize([...dependencies.values()]),roots=selected.filter(n=>!n.parentId).map(n=>n.id),originalRoots=roots.map(id=>page.nodes.find(n=>n.id===id)).filter((n):n is DesignNode=>!!n),copiedIds=new Set(copied.ids),logicalRoots=page.nodes.filter(n=>copiedIds.has(n.id)&&!copiedIds.has(n.parentId??'')),parent=logicalRoots.length&&logicalRoots.every(n=>n.parentId===logicalRoots[0].parentId)?page.nodes.find(n=>n.id===logicalRoots[0].parentId):undefined;
 const world=new Map(originalRoots.map(n=>[n.id,worldMatrix(n,page.nodes)]));reparentPreservingWorld(selected,roots,null,world);
 const doc:DesignDocument={...blankDocument(),id:source.id,name:'Copied layers',pages:[{id:page.id,name:'Copied layers',nodes:selected,comments:[]}],componentSets:clone(source.componentSets?.filter(s=>[...primary.keys(),...dependencies.keys()].includes(s.containerId)&&s.variants.every(v=>primary.has(v.componentId)||dependencies.has(v.componentId)))??[])};
 if(deps.length)doc.pages.push({id:crypto.randomUUID(),name:'Clipboard component dependencies',nodes:deps,comments:[]});
 const nodes=allNodes(doc),ids=new Set(nodes.map(n=>n.id)),styleIds=new Set(nodes.flatMap(n=>Object.values(n.styleIds??{}))),guideIds=new Set(nodes.map(n=>n.layoutGuideStyleId)),variableIds=new Set(nodes.flatMap(n=>Object.values(n.variableBindings??{})));
 doc.styles=clone(source.styles?.filter(s=>styleIds.has(s.id))??[]);doc.layoutGuideStyles=clone(source.layoutGuideStyles?.filter(s=>guideIds.has(s.id))??[]);
 let added=true;while(added){added=false;for(const v of source.variables??[])if(variableIds.has(v.id))for(const value of Object.values(v.values))if(typeof value==='object'&&!variableIds.has(value.alias)){variableIds.add(value.alias);added=true;}}
 doc.variables=clone(source.variables?.filter(v=>variableIds.has(v.id))??[]);const collections=new Set(doc.variables.map(v=>v.collectionId));doc.variableCollections=clone(source.variableCollections?.filter(c=>collections.has(c.id))??[]);
 for(const n of nodes){const owner=source.pages.find(p=>p.nodes.some(a=>a.id===n.id));if(owner){
   const lineage:DesignNode[]=[];let current=owner.nodes.find(a=>a.id===n.id);
   if(n.parentId){if(current)lineage.push(current);}else while(current){lineage.unshift(current);current=owner.nodes.find(a=>a.id===current!.parentId);}
   const inherited:Record<string,string>=Object.assign({},source.variableModes,...lineage.slice(0,-1).map(n=>n.variableModes)),external=Object.fromEntries(Object.entries(inherited).filter(([id])=>collections.has(id)));
   // External context must not become authored component/instance modes: synchronization
   // must still propagate future main edits without imposing a library ancestor's mode.
   if(!n.parentId&&['component','instance'].includes(n.type)&&Object.keys(external).length){const wrapper=node('group',{name:'Copied variable context',x:n.x,y:n.y,width:n.width,height:n.height,fill:'none',stroke:'',strokeWidth:0,paints:[],strokes:[],variableModes:external});doc.pages.find(p=>p.nodes.includes(n))!.nodes.unshift(wrapper);n.parentId=wrapper.id;}
   const modes:Record<string,string>=Object.assign({},n.parentId?{}:source.variableModes,...(n.parentId?lineage.slice(-1):lineage).map(n=>n.variableModes));n.variableModes=Object.fromEntries(Object.entries(modes).filter(([id])=>collections.has(id)));
  }
  if(n.targetId&&!ids.has(n.targetId)){n.targetId=null;warnings.push('Links outside the copied layers were omitted.');}
  if(n.reactions)n.reactions=n.reactions.map(r=>({...r,actions:r.actions.filter(a=>{const keep=!['conditional','set-variable'].includes(a.type)&&(!a.targetId||ids.has(a.targetId))&&(!a.componentId||ids.has(a.componentId));if(!keep)warnings.push('External or variable-dependent prototype actions were omitted.');return keep;})}));
 }
 const records=clone(copied.records),validConnectors=records.connectors.filter(c=>ids.has(c.fromId)&&ids.has(c.toId));if(validConnectors.length!==records.connectors.length)warnings.push('Connectors to uncopied objects are ordinary editable paths.');records.connectors=validConnectors;records.mindMaps=records.mindMaps.map(m=>({...m,connectorIds:m.connectorIds.filter(id=>validConnectors.some(c=>c.id===id))}));
 doc.whiteboard={...emptyWhiteboard(),stickies:records.stickies,tables:records.tables,connectors:records.connectors,mindMaps:records.mindMaps,drawings:records.drawings};
 doc.fonts=selectFontAssets(source.fonts??[],[...textFontRequests(nodes),...(doc.styles??[]).filter(s=>s.type==='text').map(s=>({family:s.value.fontFamily??'Inter',weight:s.value.fontAxes?.wght??s.value.fontWeight??400,style:s.value.fontStyle==='italic'||(s.value.fontAxes?.ital??0)>=.5?'italic' as const:'normal' as const}))]);
 roots.splice(0,roots.length,...doc.pages[0].nodes.filter(n=>!n.parentId).map(n=>n.id));limit(doc);closedReferences(doc);const payload:DesignClipboard={format:'forma-clipboard',version:1,project:parseDocument(JSON.stringify(doc)),roots,origin:parent?point(worldMatrix(parent,page.nodes),0,0):{x:0,y:0},warnings:[...new Set(warnings)],slideRoles:Object.fromEntries((source.slides?.slides??[]).flatMap(s=>Object.entries(s.roles)).filter(([id])=>primary.has(id)))};bounded(JSON.stringify(payload));return payload;
}
export function parseDesignClipboard(raw:string):DesignClipboard{
 bounded(raw);const value=JSON.parse(raw) as DesignClipboard;if(value?.format!=='forma-clipboard'||value.version!==1)throw Error('This clipboard format is not supported.');
 value.project=parseDocument(JSON.stringify(value.project));limit(value.project);hydrateLegacyInstances(value.project);closedReferences(value.project);if(value.project.fonts?.some(f=>f.embeddable===false))throw Error('Non-embeddable font files cannot be transferred through the clipboard.');const first=value.project.pages[0],roots=first.nodes.filter(n=>!n.parentId).map(n=>n.id);
 if(!Array.isArray(value.roots)||!value.roots.length||new Set(value.roots).size!==value.roots.length||value.roots.length!==roots.length||value.roots.some(id=>!roots.includes(id))||!value.origin||![value.origin.x,value.origin.y].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6)||!Array.isArray(value.warnings)||value.warnings.length>100||value.warnings.some(w=>typeof w!=='string'||w.length>500))throw Error('Invalid clipboard selection.');
 if(value.slideRoles!==undefined&&(!value.slideRoles||typeof value.slideRoles!=='object'||Array.isArray(value.slideRoles)||Object.entries(value.slideRoles).some(([id,role])=>!first.nodes.some(n=>n.id===id)||!['title','subtitle','body','accent'].includes(role))))throw Error('Invalid clipboard slide roles.');return value;
}
/** Mutates a draft only; callers validate the complete result before committing it. */
export function pasteDesignClipboard(destination:DesignDocument,pageId:string,payload:DesignClipboard,parentId?:string,reuseLocallyProvenReferences=false){
 const source=parseDesignClipboard(JSON.stringify(payload));hydrateLegacyInstances(destination);const page=destination.pages.find(p=>p.id===pageId);if(!page)throw Error('The destination page no longer exists.');const parent=page.nodes.find(n=>n.id===parentId);
 if(parentId&&(!parent||!['frame','group','section','component'].includes(parent.type)||parent.instanceRootId||isLocked(parent,page.nodes)))throw Error('Choose an unlocked container outside instances.');
 // The caller may prove an exact earlier local Copy from this editing session. A payload's
 // document ID alone is never authority to reuse coincident destination identifiers.
 const doc=source.project,reused=new Set<string>(),existingNodes=new Map(allNodes(destination).map(n=>[n.id,n]));
 if(reuseLocallyProvenReferences&&doc.id===destination.id)for(const p of doc.pages.slice(1)){for(const root of p.nodes.filter(n=>!n.parentId||n.type==='component'))if(existingNodes.get(root.id)?.type===root.type)for(const n of subtree(p,root.id))reused.add(n.id);for(const root of p.nodes.filter(n=>!n.parentId))if(!existingNodes.has(root.id)&&subtree(p,root.id).filter(n=>n.id!==root.id).every(n=>reused.has(n.id)))reused.add(root.id);}
 const map=new Map(allNodes(doc).map(n=>[n.id,reused.has(n.id)?n.id:crypto.randomUUID()])),remap=(id:string)=>map.get(id)??id,library=new Map<string,string>();
 for(const list of [doc.styles,doc.variables,doc.variableCollections,doc.layoutGuideStyles])for(const item of list??[])library.set(item.id,crypto.randomUUID());for(const c of doc.variableCollections??[])for(const m of c.modes)library.set(m.id,crypto.randomUUID());
 const libraries=[doc.styles??[],doc.variables??[],doc.variableCollections??[],doc.layoutGuideStyles??[]],destLibraries=[destination.styles??[],destination.variables??[],destination.variableCollections??[],destination.layoutGuideStyles??[]],reuseLibraries=reuseLocallyProvenReferences&&doc.id===destination.id&&libraries.every((list,i)=>list.every(item=>destLibraries[i].some(d=>d.id===item.id)))&&(doc.variableCollections??[]).every(c=>c.modes.every(m=>destination.variableCollections?.find(d=>d.id===c.id)?.modes.some(d=>d.id===m.id)));
 if(reuseLibraries)for(const id of library.keys())library.set(id,id);
 const lib=(id:string)=>library.get(id)??id,copies=remapCopiedNodes(allNodes(doc).filter(n=>!reused.has(n.id)),map,swapPropertyIds(allNodes(doc)));
 for(const n of copies){if(n.styleIds)n.styleIds=Object.fromEntries(Object.entries(n.styleIds).map(([k,id])=>[k,lib(id!)]));if(n.layoutGuideStyleId)n.layoutGuideStyleId=lib(n.layoutGuideStyleId);if(n.variableBindings)n.variableBindings=Object.fromEntries(Object.entries(n.variableBindings).map(([k,id])=>[k,lib(id!)]));if(n.variableModes)n.variableModes=Object.fromEntries(Object.entries(n.variableModes).map(([k,id])=>[lib(k),lib(id)]));}
 if(!reuseLibraries){destination.styles=[...destination.styles??[],...(doc.styles??[]).map(s=>({...clone(s),id:lib(s.id)}))];destination.layoutGuideStyles=[...destination.layoutGuideStyles??[],...(doc.layoutGuideStyles??[]).map(s=>({...clone(s),id:lib(s.id)}))];
 destination.variableCollections=[...destination.variableCollections??[],...(doc.variableCollections??[]).map(c=>({...clone(c),id:lib(c.id),defaultModeId:lib(c.defaultModeId),modes:c.modes.map(m=>({...m,id:lib(m.id)}))}))];destination.variables=[...destination.variables??[],...(doc.variables??[]).map(v=>({...clone(v),id:lib(v.id),collectionId:lib(v.collectionId),values:Object.fromEntries(Object.entries(v.values).map(([id,value])=>[lib(id),typeof value==='object'?{alias:lib(value.alias)}:value]))}))];}
 const primaryIds=new Set(doc.pages[0].nodes.map(n=>remap(n.id))),selected=copies.filter(n=>primaryIds.has(n.id)),deps=copies.filter(n=>!primaryIds.has(n.id));page.nodes.push(...selected);
 if(deps.length)destination.pages.push({id:crypto.randomUUID(),name:'Pasted component dependencies',nodes:deps,comments:[]});
 const targetOrigin=parent?point(worldMatrix(parent,page.nodes),0,0):{x:0,y:0},dx=parent?targetOrigin.x-source.origin.x+24:24,dy=parent?targetOrigin.y-source.origin.y+24:24,world=new Map(source.roots.map(id=>{const node=doc.pages[0].nodes.find(n=>n.id===id)!,matrix=worldMatrix(node,doc.pages[0].nodes);matrix[4]+=dx;matrix[5]+=dy;return[remap(id),matrix] as [string,Matrix];}));
 reparentPreservingWorld(page.nodes,source.roots.map(remap),parentId??null,world);destination.componentSets=[...destination.componentSets??[],...remapCopiedComponentSets((doc.componentSets??[]).filter(s=>!reused.has(s.containerId)),map)];
 pasteWhiteboardSelection(destination,pageId,{documentId:doc.id,pageId:doc.pages[0].id,...doc.whiteboard!},map);
 const slide=destination.slides?.slides.find(s=>s.frameId===parentId);if(slide)for(const [id,role] of Object.entries(source.slideRoles??{}))slide.roles[remap(id)]=role;
 if(doc.fonts?.length){const existing=new Map((destination.fonts??[]).map(f=>[fontAssetKey(f),f]));for(const font of doc.fonts){const previous=existing.get(fontAssetKey(font));if(previous&&previous.data!==font.data)throw Error('The destination has a different embedded '+font.family+' font face. Resolve the font conflict before pasting.');existing.set(fontAssetKey(font),clone(font));}destination.fonts=[...existing.values()];}
 if(new TextEncoder().encode(JSON.stringify(destination)).length>50_000_000)throw Error('Pasting would exceed the 50 MB project limit. Paste into a smaller project.');parseDocument(JSON.stringify(destination));return source.roots.map(remap);
}
