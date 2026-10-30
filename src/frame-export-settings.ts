import {validatePngColorProfile} from './png-color-profile';
import type {PngColorProfile} from './png-color-profile';
import {validateSvgExportSettings} from './svg-export-settings';
import type {SvgExportSettings} from './svg-export-settings';
export type ArtworkFormat='svg'|'png'|'jpg';
export interface FrameExportSetting {id:string;format:ArtworkFormat;scale:number;suffix:string;bounds:'frame'|'artwork';includeGuides:boolean;quality?:number;pngColorProfile?:PngColorProfile;sizing?:{axis:'width'|'height';value:number};svg?:SvgExportSettings;includeHidden?:boolean;includeOverlaps?:boolean;}
export const FRAME_EXPORT_SETTING_LIMIT=20;
export function defaultFrameExportSetting(id='default'):FrameExportSetting{return {id,format:'svg',scale:1,suffix:'',bounds:'frame',includeGuides:false};}
/** Saved profiles are data only. Validate them at both import and editor transaction boundaries. */
export function validateFrameExportSettings(value:unknown):asserts value is FrameExportSetting[]|undefined{
 if(value===undefined)return;
 if(!Array.isArray(value)||value.length>FRAME_EXPORT_SETTING_LIMIT)throw Error('A layer supports at most 20 export settings.');
 const ids=new Set<string>();
 for(const item of value){
  if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Invalid layer export setting.');
  if(typeof item.id!=='string'||!item.id.trim()||item.id.length>128||ids.has(item.id))throw Error('Export settings require distinct local IDs.');ids.add(item.id);
  if(!['svg','png','jpg'].includes(item.format)||!Number.isFinite(item.scale)||item.scale<.01||item.scale>64||!['frame','artwork'].includes(item.bounds)||typeof item.includeGuides!=='boolean')throw Error('Use SVG, PNG or JPG, a 0.01×–64× scale, and valid export bounds.');
  if(item.quality!==undefined&&(!Number.isFinite(item.quality)||item.quality<.1||item.quality>1))throw Error('JPEG quality must be between 10% and 100%.');
  validateSvgExportSettings(item.svg);validatePngColorProfile(item.pngColorProfile);for(const key of ['includeHidden','includeOverlaps'])if(item[key]!==undefined&&typeof item[key]!=='boolean')throw Error('Export visibility and overlap options must be booleans.');
  if(item.sizing!==undefined&&(!item.sizing||typeof item.sizing!=='object'||Array.isArray(item.sizing)||!['width','height'].includes(item.sizing.axis)||!Number.isInteger(item.sizing.value)||item.sizing.value<1||item.sizing.value>16384||Object.keys(item.sizing).some(key=>!['axis','value'].includes(key))))throw Error('An export width or height must be a whole number from 1 to 16,384 pixels.');
  if(typeof item.suffix!=='string'||item.suffix.length>64||/[\u0000-\u001f\u007f-\u009f/\\<>:"|?*]/.test(item.suffix))throw Error('An export suffix supports up to 64 characters without filename separators or control characters.');
 }
}
export function validateDocumentExportSettings(document:{pages?:unknown}){
 if(!Array.isArray(document.pages))return;
 for(const page of document.pages)if(page&&Array.isArray(page.nodes))for(const n of page.nodes)if(n&&typeof n==='object')validateFrameExportSettings(n.exportSettings);
}
export function frameExportFilename(name:string,setting:FrameExportSetting){
 validateFrameExportSettings([setting]);
 return exportFilename(name,setting.suffix,setting.format,'Frame');
}
/** Portable UTF-8 names are bounded for the Mac save panel and ZIP extraction. */
export function exportFilename(name:string,suffix='',extension='zip',fallback='Artwork'){
 if(!/^[a-z0-9]+$/i.test(extension))throw Error('Invalid export filename extension.');
 const clean=(value:string)=>value.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f/\\<>:"|?*\u202a-\u202e\u2066-\u2069]/g,'-').replace(/[\ud800-\udfff]/gu,'-');
 const truncate=(value:string,max:number)=>{let out='',bytes=0;for(const char of Array.from(value)){const size=new TextEncoder().encode(char).length;if(bytes+size>max)break;out+=char;bytes+=size;}return out;};
 let stem=clean(name).replace(/^\.+|[. ]+$/g,'').trim()||fallback;
 if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem))stem='_'+stem;
 const tail=truncate(clean(suffix),160),budget=240-new TextEncoder().encode('.'+extension+tail).length;
 return (truncate(stem,budget).replace(/[. ]+$/g,'')||fallback)+tail+'.'+extension;
}
