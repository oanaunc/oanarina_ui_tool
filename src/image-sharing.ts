import type {DesignNode} from './model';
import type {Paint} from './paints';
/** A repeated embedded image is one image. In memory every use shares one string, and a saved project writes it once:
 * the first use keeps its data and names a key, and later uses name that key. Parsing restores them before any
 * validator runs, so nothing else in the app sees the saved form. An older build opens such a file with the later
 * uses empty, which it already draws as replaceable placeholders. */
export const IMAGE_SHARING={minChars:4096,expandedChars:400_000_000} as const;
interface Pages {pages?:{nodes?:DesignNode[]}[];}
const painted=(n:DesignNode):Paint[]=>[...(Array.isArray(n.paints)?n.paints:[]),...(Array.isArray(n.strokes)?n.strokes.map(s=>s?.paint):[])].filter(p=>p&&typeof p==='object');
function* imagePaints(doc:Pages){if(!Array.isArray(doc.pages))return;for(const page of doc.pages)if(Array.isArray(page?.nodes))for(const n of page.nodes)if(n&&typeof n==='object')yield* painted(n);}
const shareable=(p:Paint)=>typeof p.image==='string'&&p.image.length>=IMAGE_SHARING.minChars;
/** Points every use at one string and returns the characters the extra copies took. */
export function shareImages(doc:object){const seen=new Map<string,string>();let repeated=0;for(const p of imagePaints(doc as Pages)){if(!shareable(p))continue;const first=seen.get(p.image!);if(first===undefined)seen.set(p.image!,p.image!);else{repeated+=first.length;p.image=first;}}return repeated;}
/** Restores saved uses in place. A use whose data is missing, or more uses than memory can hold, refuses the file. */
export function unpackImages(doc:Pages){const kept=new Map<number,string>();let expanded=0;for(const p of imagePaints(doc)){if(p.imageKey!==undefined){if(!Number.isSafeInteger(p.imageKey)||typeof p.image!=='string'||!p.image||kept.has(p.imageKey))throw Error('Invalid shared image.');kept.set(p.imageKey,p.image);delete p.imageKey;}else if(p.imageCopy!==undefined){const data=kept.get(p.imageCopy);if(data===undefined||p.image)throw Error('Invalid shared image.');p.image=data;delete p.imageCopy;expanded+=data.length;if(expanded>IMAGE_SHARING.expandedChars)throw Error('This file exceeds the 50 MB project limit.');}}}
/** A copy of the document holding each repeated image once. The source and everything it shares stay untouched. */
export function packImages<T extends object>(doc:T):T{
 const uses=new Map<string,number>();for(const p of imagePaints(doc as Pages))if(shareable(p))uses.set(p.image!,(uses.get(p.image!)??0)+1);if(![...uses.values()].some(count=>count>1))return doc;
 const keys=new Map<string,number>();let next=0;const pack=(p:Paint):Paint=>{if(!shareable(p)||uses.get(p.image!)!<2)return p;const key=keys.get(p.image!);if(key!==undefined)return {...p,image:'',imageCopy:key};keys.set(p.image!,next);return {...p,imageKey:next++};};
 return {...doc,pages:(doc as Pages).pages!.map(page=>({...page,nodes:page.nodes?.map(n=>!n||typeof n!=='object'?n:{...n,...(Array.isArray(n.paints)?{paints:n.paints.map(p=>p&&typeof p==='object'?pack(p):p)}:{}),...(Array.isArray(n.strokes)?{strokes:n.strokes.map(s=>s?.paint&&typeof s.paint==='object'?{...s,paint:pack(s.paint)}:s)}:{})})}))};
}
export const packedProject=(doc:object,space?:number)=>JSON.stringify(packImages(doc),null,space);
/** What a saved copy of the document costs, for every limit stated in project bytes. */
export const projectBytes=(doc:object)=>new TextEncoder().encode(packedProject(doc)).length;
/** Like structuredClone for plain documents, except that strings stay shared, so Undo holds an image once however many steps it spans. */
export {plainClone as cloneDocumentValue} from './plain-clone';
