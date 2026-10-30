import {effectiveDevelopmentStatus} from './development-status';
import type {DesignDocument,Page} from './model';
import {descendants,effectiveVisible,isLocked} from './model';
import {managedLayer,planLayerMove} from './layer-operations';
import {inverseMatrix,point} from './transforms';
import {layerTreeIndex,flattenLayerTree} from './layer-tree-index';
import {commentAnchorLookup,commentPosition} from './comment-threads';
import type {NodeKind} from './model';
export type LayerStatusFilter='all'|'exportable'|'ready'|'completed'|'prototype'|'comments';
function section(page:Page,id:string){const n=page.nodes.find(n=>n.id===id);if(n?.type!=='section')throw Error('Choose an existing section.');return n;}
function editable(page:Page,id:string){const n=section(page,id);if(isLocked(n,page.nodes))throw Error('Unlock the section and its ancestors first.');if(managedLayer(n,page.nodes))throw Error('Detach the instance before changing its managed sections.');return n;}
export function renameSection(page:Page,id:string,title:string){const n=editable(page,id);if(typeof title!=='string'||!title.trim()||title.length>512||/[\u0000-\u001f\u007f]/.test(title))throw Error('Use a section title of 1–512 characters without control characters.');n.name=title;}
export function setSectionReady(page:Page,id:string,ready:boolean){if(typeof ready!=='boolean')throw Error('Choose a valid development status.');const n=editable(page,id);delete n.developmentStatus;if(ready)n.readyForDevelopment=true;else delete n.readyForDevelopment;}
export function sectionContents(page:Page,id:string){section(page,id);return page.nodes.filter(n=>n.parentId===id&&effectiveVisible(n,page.nodes)&&!isLocked(n,page.nodes)).reverse().map(n=>n.id);}
export function nestSection(doc:DesignDocument,pageId:string,id:string,parentId:string|null){const p=doc.pages.find(p=>p.id===pageId);if(!p)throw Error('The section page is missing.');const source=editable(p,id);if(parentId)section(p,parentId);const parent=p.nodes.find(n=>n.id===parentId),oldParent=p.nodes.find(n=>n.id===source.parentId);if(parent&&parent.layout!=='none'&&!source.ignoreLayout||oldParent&&oldParent.layout!=='none'&&!source.ignoreLayout)throw Error('Move sections outside auto layout or enable absolute positioning first.');const relevant=new Set(descendants(p.nodes,[id]));for(const root of [source,parent]){let current=root;const seen=new Set<string>();while(current&&!seen.has(current.id)){seen.add(current.id);relevant.add(current.id);current=p.nodes.find(n=>n.id===current!.parentId);}}if(p.motion?.tracks.some(t=>relevant.has(t.nodeId)))throw Error('Remove motion tracks from the section hierarchy before moving it.');if(doc.workspace&&doc.workspace!=='design')throw Error('Move sections using this control in Design files.');p.nodes=planLayerMove(p.nodes,[id],parentId,'inside',doc);}
export function sectionLink(doc:DesignDocument,pageId:string,id:string){const p=doc.pages.find(p=>p.id===pageId);if(!p)throw Error('The section page is missing.');section(p,id);const value='forma-section:'+encodeURIComponent(JSON.stringify([doc.id,pageId,id]));if(value.length>4096)throw Error('These identifiers exceed the local section link size limit.');return value;}
export function resolveSectionLink(doc:DesignDocument,value:string){if(typeof value!=='string'||value.length>4096||!value.startsWith('forma-section:'))throw Error('Paste a local Forma section link.');let ids:unknown;try{ids=JSON.parse(decodeURIComponent(value.slice(14)));}catch{throw Error('Invalid local section link.');}if(!Array.isArray(ids)||ids.length!==3||ids.some(id=>typeof id!=='string'))throw Error('Invalid local section link.');if(ids[0]!==doc.id)throw Error('This section belongs to another file. Open that file first.');const page=doc.pages.find(p=>p.id===ids[1]);if(!page)throw Error('The linked page no longer exists.');const n=section(page,ids[2]);return {pageId:page.id,nodeId:n.id};}
/** The filter intersects current pin positions, including durable anchors and legacy page positions. */
export function layerStatusMatches(page:Page,status:LayerStatusFilter){
 const nodes=page.nodes,ids=new Set<string>();if(status==='all')return new Set(nodes.map(n=>n.id));
 if(status==='comments'&&page.comments.length>10_000)throw Error('The layer comment filter supports up to 10,000 pins per page. Use the Comments list to inspect this legacy page.');
 const flowIds=new Set(page.flows?.map(f=>f.frameId)??[]),lookup=status==='comments'?commentAnchorLookup(nodes):undefined,pins=status==='comments'?page.comments.map(c=>commentPosition(c,lookup!)).sort((a,b)=>a.x-b.x):[];let checks=0;if(pins.some(p=>!p.valid))throw Error('Some saved comment positions cannot be displayed. Use the Comments list to inspect them before filtering layers.');
 const firstPin=(x:number)=>{let low=0,high=pins.length;while(low<high){const mid=(low+high)>>>1;if(pins[mid].x<x)low=mid+1;else high=mid;}return low;};
 for(const n of nodes){let match=false;
  if(status==='exportable')match=n.type==='slice'||!!n.exportSettings?.length;
  else if(status==='ready'||status==='completed')match=effectiveDevelopmentStatus(n)===status;
  else if(status==='prototype')match=!!n.targetId||!!n.reactions?.some(r=>r.actions.length)||flowIds.has(n.id);
  else if(status==='comments'&&pins.length){const matrix=lookup!.matrix(n.id);if(!matrix)throw Error('Comment intersection cannot inspect this hierarchy within its transform limits. Use the Comments list.');try{const inverse=inverseMatrix(matrix),corners=[[0,0],[n.width,0],[n.width,n.height],[0,n.height]].map(([x,y])=>point(matrix,x,y)),minX=Math.min(...corners.map(p=>p.x)),maxX=Math.max(...corners.map(p=>p.x)),minY=Math.min(...corners.map(p=>p.y)),maxY=Math.max(...corners.map(p=>p.y));for(let i=firstPin(minX);i<pins.length&&pins[i].x<=maxX;i++){if(++checks>2_000_000)throw Error('The comment intersection filter exceeds its two-million-candidate limit. Narrow this page before filtering.');const c=pins[i];if(c.y<minY||c.y>maxY)continue;const p=point(inverse,c.x,c.y);if(p.x>=-1e-7&&p.y>=-1e-7&&p.x<=n.width+1e-7&&p.y<=n.height+1e-7){match=true;break;}}}catch(error){if(error instanceof Error&&error.message.includes('candidate limit'))throw error;/* Degenerate transforms contain no inspectable pin area. */}}
  if(match)ids.add(n.id);
 }
 return ids;
}
export function filterStatusLayerRows(page:Page,collapsed:string[],query:string,type:NodeKind|'all',status:LayerStatusFilter){return flattenLayerTree(layerTreeIndex(page.nodes),{collapsed,query,type,matches:status==='all'?undefined:layerStatusMatches(page,status)}).map(item=>item.node);}
