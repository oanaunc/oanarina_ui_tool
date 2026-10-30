import type {DesignDocument,DesignNode} from './model';
import {effectiveVisible} from './model';
import {validateDocumentCover} from './document-cover';
import {identity,inverseMatrix,worldMatrix,visualBounds} from './transforms';
import {validateExportHierarchy,visibleExportNodes} from './svg-export-options';
import {withoutSliceSubtrees} from './slices';
import {currentTextOutline} from './text-outline';
import {textFontRequests} from './rich-text';
import {fontAssetKey,selectFontAssets} from './font-data';
import type {FontAsset} from './font-data';
export const COVER_NODE_LIMIT=500,COVER_BYTE_LIMIT=4_000_000;
export function coverByteLength(value:string){return new TextEncoder().encode(value).byteLength;}
/** IDs only exist in this render snapshot. Opaque source IDs never become URL fragments. */
export function coverPreviewNodes(nodes:DesignNode[],scope:string){const prefix='file-cover-'+scope.replace(/[^a-zA-Z0-9_-]/g,'_'),ids=new Map(nodes.map((n,i)=>[n.id,prefix+'-n'+i]));return nodes.map(n=>({...n,id:ids.get(n.id)!,parentId:n.parentId?ids.get(n.parentId)??null:null,paints:n.paints?.map((p,j)=>({...p,id:'p'+j})),strokes:n.strokes?.map((s,j)=>({...s,id:'s'+j,paint:{...s.paint,id:'sp'+j}}))}));}
export function coverPreviewScene(doc:DesignDocument,scope:string,choice=doc.fileCover){
 validateDocumentCover({...doc,fileCover:choice});const page=choice?doc.pages.find(p=>p.id===choice.pageId)!:doc.pages[0];if(!page)return undefined;
 if(page.nodes.length>COVER_NODE_LIMIT)throw Error('File covers support pages with up to 500 layers.');
 if(coverByteLength(JSON.stringify(page.nodes))>COVER_BYTE_LIMIT)throw Error('The cover page artwork exceeds the 4 MB preview limit.');
 // Normalize root parent semantics before hierarchy work, including valid empty imported IDs.
 const cloned=coverPreviewNodes(page.nodes,scope);validateExportHierarchy(cloned);const selectedIndex=choice?page.nodes.findIndex(n=>n.id===choice.frameId):-1,n=cloned[selectedIndex];
 if(n&&(!effectiveVisible(n,cloned)||n.width<=0||n.height<=0))throw Error('The cover frame must have visible, positive-sized bounds.');
 const nodes=visibleExportNodes(withoutSliceSubtrees(cloned));if(!nodes.length&&!choice)return undefined;
 const viewport=n?{x:0,y:0,width:n.width,height:n.height}:visualBounds(nodes),transform=n?inverseMatrix(worldMatrix(n,cloned)):identity;
 if(!Object.values(viewport).every(Number.isFinite)||viewport.width<=0||viewport.height<=0||viewport.width>1e7||viewport.height>1e7)throw Error('The cover viewport exceeds supported finite bounds.');
 return {nodes,viewport,transform,background:page.background,chosen:!!choice,pageId:page.id};
}
/** A cached file must not borrow a differently loaded same-family face for measurement. */
export function coverFontAssets(nodes:DesignNode[],embedded:FontAsset[],registered:FontAsset[]){
 const usage=textFontRequests(nodes.filter(n=>n.type==='text'&&currentTextOutline(n)===undefined)),authoredFamilies=new Set(embedded.map(a=>a.family)),proof=(assets:FontAsset[],request:typeof usage[number])=>selectFontAssets(assets.map(a=>({...a,embeddable:true})),[request]),same=(a:FontAsset[],b:FontAsset[])=>a.length===b.length&&a.every(face=>b.some(other=>fontAssetKey(other)===fontAssetKey(face)&&other.data===face.data));
 const used=new Set(usage.map(u=>u.family)),descriptors=new Map<string,FontAsset>();for(const face of embedded){if(!used.has(face.family))continue;const key=fontAssetKey(face),previous=descriptors.get(key);if(previous&&(previous.data!==face.data||(previous.embeddable===false)!==(face.embeddable===false)))throw Error('Conflicting authored font faces use the same descriptor. Resolve duplicate fonts before rendering this cover.');descriptors.set(key,face);}
 for(const request of usage){const actual=proof(registered,request);if(actual.some(face=>registered.find(a=>fontAssetKey(a)===fontAssetKey(face))?.embeddable===false))throw Error('An authored or loaded font does not permit embedding in this cover.');if(!authoredFamilies.has(request.family))continue;const authored=proof(embedded,request);if(authored.some(face=>embedded.find(a=>fontAssetKey(a)===fontAssetKey(face))?.embeddable===false))throw Error('An authored font does not permit embedding in this cover.');if(!same(authored,actual))throw Error('Open this file to load its authored fonts before rendering this text cover. A conflicting face weight, style or subset may still be loaded; reload Forma if the conflict remains.');}
 return [...selectFontAssets(embedded,usage),...selectFontAssets(registered.filter(a=>!authoredFamilies.has(a.family)),usage)];
}
