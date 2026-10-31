import type {DesignDocument,DesignNode,Page} from './model';
import {descendants} from './model';
import {buildAssetUsageIndex} from './asset-usage';
import type {AssetKind,AssetStatus} from './asset-usage';
import {canInstantiate,insertInstance} from './components-model';
import {documentIndexes,pageIndex} from './audit-index';
import type {AuditLayer} from './audit-index';
/** Audits of style definitions and component links. They inspect saved references only and never guess at external consumers. */
export interface DetachedProvenance {componentId:string;componentName:string;}
export type StyleAuditKind='paint'|'text'|'effect'|'stroke'|'guide';
export interface StyleAuditRow {id:string;kind:StyleAuditKind;name:string;description:string;status:AssetStatus;references:number;removable:boolean;blocked?:string;}
export interface StyleAudit {rows:StyleAuditRow[];unused:number;complete:boolean;warnings:string[];publishedLibrary:boolean;}
const styleKinds:Partial<Record<AssetKind,StyleAuditKind>>={'paint-style':'paint','text-style':'text','effect-style':'effect','stroke-style':'stroke','guide-style':'guide'};
const installedStyleIds=(d:DesignDocument)=>new Set((d.componentLibraries??[]).flatMap(l=>Object.values(l.maps.style??{})));
export function auditUnusedStyles(doc:DesignDocument):StyleAudit{
 const index=buildAssetUsageIndex(doc),installed=installedStyleIds(doc),publishedLibrary=!!doc.libraryPublication,rows:StyleAuditRow[]=[];
 for(const a of index.assets){const kind=styleKinds[a.kind];if(!kind||!a.defined)continue;const library=installed.has(a.id),blocked=library?'This style belongs to an installed library. Manage it from that library.':a.status==='uncertain'?'The scan could not prove this style is unused.':undefined;rows.push({id:a.id,kind,name:a.name,description:a.description,status:a.status,references:a.references,removable:a.status==='unreferenced'&&!library,...(blocked?{blocked}:{})});}
 rows.sort((a,b)=>Number(b.status==='unreferenced')-Number(a.status==='unreferenced')||a.name.localeCompare(b.name));
 return {rows,unused:rows.filter(r=>r.status==='unreferenced').length,complete:index.complete,warnings:index.warnings,publishedLibrary};
}
/** Draft mutator. Re-proves each style is still unreferenced in the draft; one stale ID refuses the whole removal. */
export function removeUnusedStyles(d:DesignDocument,ids:readonly string[]){
 if(!ids.length||ids.length>20000)throw Error('Choose unused styles to remove.');const audit=auditUnusedStyles(d),rows=new Map(audit.rows.map(r=>[r.id,r])),chosen=new Set(ids);
 if(!audit.complete)throw Error('The usage scan is incomplete, so nothing was removed.');for(const id of chosen)if(!rows.get(id)?.removable)throw Error('A selected style is now in use or was already removed. Nothing changed.');
 const before=(d.styles?.length??0)+(d.layoutGuideStyles?.length??0);d.styles=d.styles?.filter(s=>!chosen.has(s.id));d.layoutGuideStyles=d.layoutGuideStyles?.filter(s=>!chosen.has(s.id));return before-(d.styles?.length??0)-(d.layoutGuideStyles?.length??0);
}
export type DetachedKind='recorded'|'recorded-missing-main'|'likely'|'orphaned';
export const detachedLabels:Record<DetachedKind,string>={recorded:'Detached from a main component','recorded-missing-main':'Detached; main component was deleted',likely:'Same name and structure as a main component',orphaned:'Instance whose main component is missing'};
export interface DetachedFinding {kind:DetachedKind;layer:AuditLayer;componentId?:string;componentName:string;descendants:number;structureMatches:boolean;restorable:boolean;blocked?:string;}
export interface DetachedAudit {findings:DetachedFinding[];instances:number;mains:number;}
function childMap(page:Page){const children=new Map<string,DesignNode[]>();for(const n of page.nodes)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}return children;}
/** Ordered type tree of a subtree, excluding its root, capped so a huge layer stays cheap. */
function structure(id:string,children:Map<string,DesignNode[]>){const parts:string[]=[],stack:[string,number][]=[[id,0]],seen=new Set<string>();while(stack.length&&parts.length<5000){const [current,depth]=stack.pop()!;if(seen.has(current))continue;seen.add(current);const list=children.get(current)??[];for(const child of list)parts.push(depth+':'+child.type);for(const child of [...list].reverse())stack.push([child.id,depth+1]);}return parts.join('|');}
const comparable=(n:DesignNode)=>n.type==='frame'||n.type==='group';
export function auditDetachedInstances(doc:DesignDocument):DetachedAudit{
 const indexes=documentIndexes(doc),mains=new Map<string,{node:DesignNode;signature:string}>(),byName=new Map<string,string[]>(),findings:DetachedFinding[]=[];let instances=0;
 const trees=new Map(indexes.map(index=>[index.page.id,childMap(index.page)]));
 const size=(pageId:string,id:string)=>{const children=trees.get(pageId)!,seen=new Set<string>(),stack=[id];while(stack.length){const current=stack.pop()!;for(const child of children.get(current)??[])if(!seen.has(child.id)){seen.add(child.id);stack.push(child.id);}}return seen.size;};
 for(const index of indexes){const children=trees.get(index.page.id)!;for(const n of index.page.nodes)if(n.type==='component'){mains.set(n.id,{node:n,signature:structure(n.id,children)});const list=byName.get(n.name.toLowerCase())??[];list.push(n.id);byName.set(n.name.toLowerCase(),list);}}
 for(const index of indexes){const children=trees.get(index.page.id)!;for(const n of index.page.nodes){
  if(n.type==='instance'&&!n.instanceRootId){instances++;if(!n.componentId||!mains.has(n.componentId)){const layer=index.layer(n);findings.push({kind:'orphaned',layer,componentName:'Missing main component',descendants:size(index.page.id,n.id),structureMatches:false,restorable:false,blocked:layer.locked?'Unlock this layer first.':undefined});}continue;}
  if(n.instanceRootId||!comparable(n)&&!n.detachedFrom||index.managed(n))continue;
  const blocked=index.locked(n)?'Unlock this layer first.':undefined;
  if(n.detachedFrom){const main=mains.get(n.detachedFrom.componentId),signature=structure(n.id,children);findings.push({kind:main?'recorded':'recorded-missing-main',layer:index.layer(n),componentId:n.detachedFrom.componentId,componentName:main?.node.name??n.detachedFrom.componentName,descendants:size(index.page.id,n.id),structureMatches:!!main&&main.signature===signature,restorable:!!main&&!blocked,blocked:blocked??(main?undefined:'The main component no longer exists.')});continue;}
  if(!children.get(n.id)?.length)continue;
  const candidates=byName.get(n.name.toLowerCase().replace(/ \/ instance$/,''));if(!candidates)continue;const signature=structure(n.id,children),match=candidates.find(id=>mains.get(id)!.signature===signature);if(match)findings.push({kind:'likely',layer:index.layer(n),componentId:match,componentName:mains.get(match)!.node.name,descendants:size(index.page.id,n.id),structureMatches:true,restorable:!blocked,blocked});
 }}
 return {findings,instances,mains:mains.size};
}
/** Replaces a detached frame with a fresh instance at the same paint position and keeps the root layer ID. */
export function restoreDetachedInstance(d:DesignDocument,pageId:string,nodeId:string,componentId:string){
 const page=d.pages.find(p=>p.id===pageId),n=page?.nodes.find(n=>n.id===nodeId);if(!page||!n||!['frame','group'].includes(n.type))throw Error('This detached layer no longer exists.');
 const index=pageIndex(page);if(index.locked(n))throw Error('Unlock this layer first.');if(index.managed(n))throw Error('Detach the parent instance before relinking this layer.');canInstantiate(d,componentId,n.parentId);
 if(descendants(page.nodes,[nodeId]).includes(componentId))throw Error('This layer contains its main component.');if(n.slotInstance||n.mask||n.booleanOp)throw Error('Release this layer’s slot, mask or boolean role before relinking it.');
 const main=d.pages.flatMap(p=>p.nodes).find(m=>m.id===componentId)!,removed=new Set(descendants(page.nodes,[nodeId])),position=page.nodes.indexOf(n),{parentId,x,y,width,height,name,visible,opacity,rotation}=n;
 page.nodes=page.nodes.filter(item=>!removed.has(item.id));insertInstance(d,pageId,componentId,{id:nodeId,parentId,x,y,name,visible,opacity,rotation,...(width!==main.width||height!==main.height?{width,height}:{})});
 const fresh=page.nodes.pop()!;page.nodes.splice(Math.min(position,page.nodes.length),0,fresh);return nodeId;
}
/** Marks a detached frame as intentional by dropping only its provenance; the artwork is untouched. */
export function dismissDetached(d:DesignDocument,pageId:string,nodeId:string){const n=d.pages.find(p=>p.id===pageId)?.nodes.find(n=>n.id===nodeId);if(!n?.detachedFrom)throw Error('This layer has no detach record.');delete n.detachedFrom;}
/** Orphaned instances keep their artwork as an independent frame through the normal detach path. */
export {detachInstance as detachOrphan} from './components-model';
