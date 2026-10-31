/** Plain-text facts about a library file. Saved in `.oui`, copied into its snapshots, and never treated as a link or markup. */
export interface LibraryFileMetadata {owner?:string;license?:string;contact?:string;tags?:string[];}
export const LIBRARY_FILE_LIMITS={owner:200,license:200,contact:400,tag:40,tags:20} as const;
const controls=/[\u0000-\u001f\u007f-\u009f]/;
const field=(value:unknown,max:number,label:string)=>{if(typeof value!=='string'||!value.trim()||value!==value.trim()||value.length>max||controls.test(value))throw Error('Library '+label+' must be plain text up to '+max+' characters.');};
export function validateLibraryFileMetadata(value:unknown):asserts value is LibraryFileMetadata|undefined{
 if(value===undefined)return;if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['owner','license','contact','tags'].includes(k)))throw Error('Invalid library file metadata.');const v=value as LibraryFileMetadata;
 if(v.owner!==undefined)field(v.owner,LIBRARY_FILE_LIMITS.owner,'owner');if(v.license!==undefined)field(v.license,LIBRARY_FILE_LIMITS.license,'license');if(v.contact!==undefined)field(v.contact,LIBRARY_FILE_LIMITS.contact,'contact');
 if(v.tags!==undefined){if(!Array.isArray(v.tags)||!v.tags.length||v.tags.length>LIBRARY_FILE_LIMITS.tags||new Set(v.tags).size!==v.tags.length)throw Error('A library file supports 1 to 20 distinct tags.');v.tags.forEach(t=>field(t,LIBRARY_FILE_LIMITS.tag,'tag'));}
}
export function validateExcludedCollections(value:unknown):asserts value is string[]|undefined{if(value===undefined)return;if(!Array.isArray(value)||!value.length||value.length>1000||new Set(value).size!==value.length||value.some(id=>typeof id!=='string'||!id||id.length>512||controls.test(id)))throw Error('Invalid unpublished variable collections.');}
/** Drops empty fields so a cleared form removes the optional key instead of saving blanks. */
export function libraryFileMetadataFromForm(form:{owner:string;license:string;contact:string;tags:string}):LibraryFileMetadata|undefined{const tags=[...new Set(form.tags.split(',').map(t=>t.trim()).filter(Boolean))],value:LibraryFileMetadata={};for(const key of ['owner','license','contact'] as const){const text=form[key].trim();if(text)value[key]=text;}if(tags.length)value.tags=tags;validateLibraryFileMetadata(value);return Object.keys(value).length?value:undefined;}
