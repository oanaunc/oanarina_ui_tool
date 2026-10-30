import {getPreferences} from './preferences';
import type {DesignDocument,DesignNode,Page} from './model';
import {effectiveVisible,isLocked} from './model';
import {exportSelection,identity,inverseMatrix,multiply,nodeMatrix,visualBounds} from './transforms';
import type {Matrix} from './transforms';
import {frameExportGeometry} from './frame-delivery';
import {defaultFrameExportSetting,validateFrameExportSettings} from './frame-export-settings';
import type {FrameExportSetting} from './frame-export-settings';
export const EXPORT_ASSET_LIMIT=200,EXPORT_BYTE_LIMIT=100_000_000;
export type ExportTargetMode='layers'|'frames'|'slices'|'configured';
export function defaultLayerExportSetting(n:DesignNode):FrameExportSetting{const preferences=getPreferences(),format='defaultExportFormat' in preferences?preferences.defaultExportFormat:'svg';return {...defaultFrameExportSetting(),format:format==='png'||format==='jpg'?format:'svg',bounds:(n.type==='frame'||n.type==='slice'?'frame':'artwork') as FrameExportSetting['bounds']};}
export function setLayerExportSettings(doc:DesignDocument,pageId:string,id:string,settings:FrameExportSetting[]){
 validateFrameExportSettings(settings);const page=doc.pages.find(p=>p.id===pageId),n=page?.nodes.find(n=>n.id===id);if(!page||!n)throw Error('The export layer is missing.');
 if(isLocked(n,page.nodes))throw Error('Unlock the layer and its ancestors before editing export settings.');n.exportSettings=structuredClone(settings);
}
export function validateLayerExportSettings(doc:DesignDocument,pageId:string,id:string,settings:FrameExportSetting[]){const n=doc.pages.find(p=>p.id===pageId)?.nodes.find(n=>n.id===id);if(!n||JSON.stringify(n.exportSettings)!==JSON.stringify(settings))throw Error('A managed layer overwrote these export profiles. Edit its main component or detach the instance.');}
function layerWorldMatrix(page:Page,id:string){
 const map=new Map(page.nodes.map(n=>[n.id,n])),lineage:DesignNode[]=[],seen=new Set<string>();let n=map.get(id);
 if(!n)throw Error('The export layer is missing.');
 while(n){if(seen.has(n.id)||seen.size>=256)throw Error('Export supports up to 256 ancestor levels without cycles.');seen.add(n.id);lineage.push(n);if(n.parentId&&!map.has(n.parentId))throw Error('An export ancestor is missing.');n=map.get(n.parentId??'');}
 let matrix:Matrix=identity,parent:DesignNode|undefined;for(const n of lineage.reverse()){matrix=multiply(matrix,nodeMatrix(n,parent));if(matrix.some(v=>!Number.isFinite(v)))throw Error('The export hierarchy has nonfinite geometry.');parent=n;}return matrix;
}
export function layerExportGeometry(page:Page,id:string,bounds:FrameExportSetting['bounds']){
 const n=page.nodes.find(n=>n.id===id);if(!n)throw Error('The export layer is missing.');if(!effectiveVisible(n,page.nodes))throw Error('Make the layer and its ancestors visible before exporting.');
 if(n.type==='frame')return frameExportGeometry(page,id,bounds);
 const matrix=layerWorldMatrix(page,id);
 if(n.type==='slice'||bounds==='frame'){
  if(n.width<=0||n.height<=0)throw Error('Layer bounds require positive width and height. Use artwork bounds for a stroked line.');
  return {nodes:n.type==='slice'?page.nodes.filter(n=>n.type!=='slice'):exportSelection(page.nodes,[id]),viewport:{x:0,y:0,width:n.width,height:n.height},transform:inverseMatrix(matrix)};
 }
 const nodes=exportSelection(page.nodes,[id]),viewport=visualBounds(nodes);if(![viewport.x,viewport.y,viewport.width,viewport.height].every(Number.isFinite)||viewport.width<=0||viewport.height<=0)throw Error('The artwork bounds are not finite and positive.');return {nodes,viewport,transform:undefined};
}
export function exportDimensions(width:number,height:number,setting:FrameExportSetting){
 validateFrameExportSettings([setting]);if(![width,height].every(v=>Number.isFinite(v)&&v>0))throw Error('Export bounds must be finite and positive.');
 const scale=setting.sizing?setting.sizing.value/(setting.sizing.axis==='width'?width:height):setting.scale,w=setting.sizing?.axis==='width'?setting.sizing.value:Math.ceil(width*scale),h=setting.sizing?.axis==='height'?setting.sizing.value:Math.ceil(height*scale);
 if(!Number.isFinite(scale)||!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<1||h<1||setting.format!=='svg'&&(w>16384||h>16384||w*h>80_000_000))throw Error('Export is too large: use at most 16,384 pixels per edge and 80 million pixels.');return {width:w,height:h,scale};
}
export function exportTargets(page:Page,ids:readonly string[],mode:ExportTargetMode){
 if(!['layers','frames','slices','configured'].includes(mode))throw Error('Choose a valid batch export mode.');const chosen=new Set(ids),available=new Set(page.nodes.map(n=>n.id));if(ids.some(id=>!available.has(id)))throw Error('The export selection changed. Select existing layers again.');
 const targets=page.nodes.filter(n=>mode==='configured'?!!n.exportSettings?.length:chosen.has(n.id)&&(mode==='layers'||n.type===(mode==='frames'?'frame':'slice')));
 if(!targets.length)throw Error(mode==='configured'?'Save at least one layer export profile first.':'Select matching layers before exporting.');
 const jobs:{id:string;name:string;setting:FrameExportSetting}[]=[];for(const n of targets)for(const setting of n.exportSettings??[defaultLayerExportSetting(n)]){if(jobs.length>=EXPORT_ASSET_LIMIT)throw Error('A batch supports between 1 and 200 configured assets. Narrow the selection or profiles.');jobs.push({id:n.id,name:n.name,setting:structuredClone(setting)});}
 if(!jobs.length||jobs.length>EXPORT_ASSET_LIMIT)throw Error('A batch supports between 1 and 200 configured assets. Narrow the selection or profiles.');return jobs;
}
