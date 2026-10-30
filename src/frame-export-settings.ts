export type ArtworkFormat='svg'|'png'|'jpg';
export interface FrameExportSetting {id:string;format:ArtworkFormat;scale:number;suffix:string;bounds:'frame'|'artwork';includeGuides:boolean;}
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
  if(!['svg','png','jpg'].includes(item.format)||!Number.isInteger(item.scale)||item.scale<1||item.scale>4||!['frame','artwork'].includes(item.bounds)||typeof item.includeGuides!=='boolean')throw Error('Use SVG, PNG or JPG, a 1×–4× scale, and valid export bounds.');
  if(typeof item.suffix!=='string'||item.suffix.length>64||/[\u0000-\u001f\u007f-\u009f/\\<>:"|?*]/.test(item.suffix))throw Error('An export suffix supports up to 64 characters without filename separators or control characters.');
 }
}
export function validateDocumentExportSettings(document:{pages?:unknown}){
 if(!Array.isArray(document.pages))return;
 for(const page of document.pages)if(page&&Array.isArray(page.nodes))for(const n of page.nodes)if(n&&typeof n==='object')validateFrameExportSettings(n.exportSettings);
}
export function frameExportFilename(name:string,setting:FrameExportSetting){
 validateFrameExportSettings([setting]);
 const stem=name.replace(/[\u0000-\u001f\u007f-\u009f/\\<>:"|?*]/g,'-').replace(/^\.+|[. ]+$/g,'').trim().slice(0,160)||'Frame';
 return stem+setting.suffix+'.'+setting.format;
}
