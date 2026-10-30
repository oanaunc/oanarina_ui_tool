/** Optional .oui document metadata. Bounds apply equally to files and local UI. */
export const DOCUMENT_DESCRIPTION_LIMIT=10_000;
const forbiddenControls=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
export function validateDocumentMetadata(document:{description?:unknown}){
 const value=document.description;
 if(value!==undefined&&(typeof value!=='string'||value.length>DOCUMENT_DESCRIPTION_LIMIT||forbiddenControls.test(value)))throw Error('File description must be plain text up to 10,000 characters, without disallowed control characters.');
}
/** Plain text is preserved literally; only line endings and empty clearing normalize. */
export function normalizedDocumentDescription(value:string):string|undefined{
 validateDocumentMetadata({description:value});const normalized=value.replace(/\r\n?/g,'\n');return normalized.trim()?normalized:undefined;
}
export interface DescriptionSnapshot {id:string;description?:string;}
/** Call on an editor draft. Validation/conflict checks happen before mutation. */
export function applyDocumentDescription(document:DescriptionSnapshot,value:string,expected?:DescriptionSnapshot){
 const next=normalizedDocumentDescription(value);
 if(expected&&(document.id!==expected.id||document.description!==expected.description))throw Error('This file or its description changed. Reopen File information before saving.');
 if(document.description===next)return false;
 if(next===undefined)delete document.description;else document.description=next;
 return true;
}
