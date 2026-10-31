import type {DesignNode,Page} from './model';
import {effectiveVisible} from './model';
import {exportSelection,visualBounds} from './transforms';
import {exportVisibility,validateExportHierarchy} from './svg-export-options';
import {exportDimensions,layerExportGeometry,EXPORT_ASSET_LIMIT} from './export-plan';
export const PDF_PIXEL_LIMIT=80_000_000;
export type DesignPdfMode='artwork'|'selected-frames'|'page-frames';
export interface DesignPdfOptions {mode:DesignPdfMode;scale:number;includeHidden:boolean;includeGuides:boolean;includeOverlaps:boolean;vector?:boolean;}
export interface DesignPdfPagePlan {id:string;name:string;nodes:DesignNode[];viewport:{x:number;y:number;width:number;height:number};transform?:import('./transforms').Matrix;width:number;height:number;scale:number;}
/** Pure, ordered geometry plan; PDF pages ignore layer export profiles. */
export function designPdfPlan(page:Page,ids:readonly string[],options:DesignPdfOptions):DesignPdfPagePlan[]{
 if(!['artwork','selected-frames','page-frames'].includes(options.mode)||!Number.isFinite(options.scale)||options.scale<.25||options.scale>4||[options.includeHidden,options.includeGuides,options.includeOverlaps].some(v=>typeof v!=='boolean')||options.vector!==undefined&&typeof options.vector!=='boolean')throw Error('Choose valid PDF page and resolution options.');
 const available=new Set(page.nodes.map(n=>n.id));if(ids.some(id=>!available.has(id)))throw Error('The PDF selection changed. Select existing layers again.');
 validateExportHierarchy(page.nodes);const nodes=exportVisibility(page.nodes,options.includeHidden),snapshot={...page,nodes},selected=new Set(ids),map=new Map(nodes.map(n=>[n.id,n]));
 const size=(width:number,height:number)=>{if(width*.75>14400||height*.75>14400)throw Error('PDF pages support at most 14,400 points per edge. Export smaller frames.');return exportDimensions(width,height,{id:'pdf',format:'png',scale:options.scale,includeGuides:options.includeGuides,bounds:'frame',suffix:''});};
 if(options.mode==='artwork'){
  const artwork=exportSelection(nodes,[...ids]);if(!artwork.some(n=>n.type!=='slice'&&!n.exportGhost&&effectiveVisible(n,artwork)))throw Error('Add visible artwork before exporting a PDF.');const viewport=visualBounds(artwork);return [{id:'artwork',name:ids.length?'Selected artwork':page.name,nodes:artwork,viewport,...size(viewport.width,viewport.height)}];
 }
 const eligible=(n:DesignNode)=>{if(n.type!=='frame'||!effectiveVisible(n,nodes))return false;if(options.mode==='selected-frames')return selected.has(n.id);let parent=map.get(n.parentId??'');while(parent){if(['frame','component','instance'].includes(parent.type))return false;parent=map.get(parent.parentId??'');}return true;},frames=nodes.filter(eligible);
 if(!frames.length)throw Error(options.mode==='selected-frames'?'Select at least one visible frame before exporting a PDF.':'Add a visible outermost frame to this page before exporting a PDF.');if(frames.length>EXPORT_ASSET_LIMIT)throw Error('A PDF supports up to 200 pages. Select fewer frames.');
 const plans=frames.map(n=>{const geometry=layerExportGeometry(snapshot,n.id,'frame',options.includeOverlaps);return {id:n.id,name:n.name,...geometry,...size(geometry.viewport.width,geometry.viewport.height)};});
 if(plans.reduce((total,p)=>total+p.width*p.height,0)>PDF_PIXEL_LIMIT)throw Error('PDF raster artwork exceeds 80 million pixels in total. Reduce resolution or export fewer pages.');return plans;
}
