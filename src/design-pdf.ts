import type {ExportJob} from './export-delivery';
import {renderExportJob,exportImageSources} from './export-delivery';
import {EXPORT_BYTE_LIMIT,EXPORT_ASSET_LIMIT} from './export-plan';
import {designPdfPlan,PDF_PIXEL_LIMIT} from './design-pdf-plan';
import type {DesignPdfOptions} from './design-pdf-plan';
import {useEditor} from './store';
import {sampleMotion} from './motion';
import {download,exportSvg} from './files';
import {exportFilename} from './frame-export-settings';
export interface DesignPdfSnapshot {name:string;title:string;pages:{name:string;width:number;height:number;job:ExportJob}[];}
function check(signal?:AbortSignal){if(signal?.aborted)throw Error('PDF export cancelled.');}
/** Entire source/font/image snapshot is prepared before the first await. */
export function prepareDesignPdf(options:DesignPdfOptions):DesignPdfSnapshot{
 const s=useEditor.getState(),page=s.doc.pages.find(p=>p.id===s.pageId);if(!page)throw Error('The PDF page is missing.');if(s.doc.workspace==='slides')throw Error('Use Slides PDF export for a slide deck.');
 const sampled=s.motionOpen?{...page,nodes:sampleMotion(page.nodes,page.motion,s.motionTime)}:page,plans=designPdfPlan(sampled,s.selection,options);let sourceBytes=0;
 const pages=plans.map(plan=>{const svg=exportSvg(plan.nodes,plan.viewport,options.includeGuides,{transform:plan.transform,dimensions:{width:plan.width,height:plan.height}});sourceBytes+=new TextEncoder().encode(svg).byteLength;if(sourceBytes>EXPORT_BYTE_LIMIT)throw Error('PDF source artwork exceeds 100 MB. Export fewer pages.');const job:ExportJob={width:plan.width,height:plan.height,scale:plan.scale,images:exportImageSources(plan.nodes),format:'png',name:'page.png',svg};
 return {name:plan.name,width:plan.viewport.width*.75,height:plan.viewport.height*.75,job};});
 return {name:exportFilename(s.doc.name,'','pdf'),title:s.doc.name,pages};
}
export async function renderDesignPdf(source:DesignPdfSnapshot,onProgress?:(done:number,total:number)=>void,signal?:AbortSignal):Promise<Uint8Array>{
 check(signal);if(!source.pages.length||source.pages.length>EXPORT_ASSET_LIMIT)throw Error('Choose between 1 and 200 PDF pages.');
 const snapshot={...source,pages:source.pages.map(p=>({...p,job:{...p.job,images:p.job.images?[...p.job.images]:undefined}}))};let sourceBytes=0,totalPixels=0;
 for(const p of snapshot.pages){if(![p.width,p.height].every(v=>Number.isFinite(v)&&v>0&&v<=14400)||p.job.format!=='png'||![p.job.width,p.job.height].every(v=>Number.isSafeInteger(v)&&v>0&&v<=16384)||typeof p.job.svg!=='string'||!Number.isFinite(p.job.scale)||p.job.scale<=0)throw Error('PDF pages require finite dimensions up to 14,400 points and PNG artwork.');totalPixels+=p.job.width*p.job.height;if(totalPixels>PDF_PIXEL_LIMIT)throw Error('PDF raster artwork exceeds 80 million pixels in total. Reduce resolution or export fewer pages.');sourceBytes+=new TextEncoder().encode(p.job.svg).byteLength;if(sourceBytes>EXPORT_BYTE_LIMIT)throw Error('PDF source artwork exceeds 100 MB.');}
 const {PDFDocument}=await import('pdf-lib'),pdf=await PDFDocument.create();check(signal);pdf.setTitle(snapshot.title);pdf.setCreator('Forma by Oanarina');pdf.setSubject('Flattened design pages. Text, links and media playback are rasterized.');let total=0;
 for(const [i,p] of snapshot.pages.entries()){check(signal);const bytes=await renderExportJob(p.job,signal);check(signal);total+=bytes.byteLength;if(total>EXPORT_BYTE_LIMIT)throw Error('PDF image data exceeds 100 MB. Export fewer pages.');const image=await pdf.embedPng(bytes);check(signal);const page=pdf.addPage([p.width,p.height]);page.drawImage(image,{x:0,y:0,width:p.width,height:p.height});onProgress?.(i+1,snapshot.pages.length);}
 check(signal);const bytes=await pdf.save();check(signal);if(bytes.byteLength>EXPORT_BYTE_LIMIT)throw Error('The PDF exceeds 100 MB. Export fewer pages.');return bytes;
}
export async function exportDesignPdf(source:DesignPdfSnapshot,onProgress?:(done:number,total:number)=>void,signal?:AbortSignal){const name=exportFilename(source.name.replace(/\.pdf$/i,''),'','pdf'),bytes=await renderDesignPdf(source,onProgress,signal);check(signal);return download(name,new Blob([new Uint8Array(bytes).buffer],{type:'application/pdf'}));}
