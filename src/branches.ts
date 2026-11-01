import {compareVersionDocuments} from './version-review';
import type {VersionComparison} from './version-review';
import type {DesignDocument} from './model';
import {mergeDocuments} from './branch-merge';
import type {MergeResult,MergeSide} from './branch-merge';
import {validateVersionAuthor} from './local-profile';
import type {VersionAuthor} from './local-profile';

export type BranchLifecycle='active'|'merged'|'archived';
export interface BranchReview {at:string;revision:string;author?:VersionAuthor;note?:string;}
export interface BranchRecord {id:string;name:string;createdAt:string;baseAt:string;status:BranchLifecycle;author?:VersionAuthor;review?:BranchReview;mergedAt?:string;archivedAt?:string;}
export interface BranchFile {mainId:string;protected:boolean;branches:BranchRecord[];}
export interface BranchRegistry {version:1;files:BranchFile[];}
export const BRANCH_LIMITS={perFile:50,files:5000,name:80} as const;
export const BRANCH_REGISTRY_KEY='branch-registry-v1';
export const branchBaseKey=(id:string)=>'branch-base-v1:'+id;
const validId=(id:unknown):id is string=>typeof id==='string'&&id.length>0&&id.length<=500&&!/[\u0000-\u001f]/.test(id);
const validDate=(date:unknown):date is string=>typeof date==='string'&&date.length<=64&&Number.isFinite(Date.parse(date));
export function branchName(value:string){const name=typeof value==='string'?value.trim():'';if(!name||name.length>BRANCH_LIMITS.name||/[\u0000-\u001f\u007f-\u009f]/.test(name))throw Error(`Branch names need 1–${BRANCH_LIMITS.name} plain characters.`);if(name.toLocaleLowerCase()==='main')throw Error('“main” is reserved for the original file.');return name;}
/** Registry is device-local organization data; a malformed record never touches any document. */
export function validateBranchRegistry(value:unknown):BranchRegistry{
 if(value===undefined)return {version:1,files:[]};
 const invalid=()=>Error('Local branch records are invalid. Your documents have not been changed.'),data=value as BranchRegistry;
 if(!data||typeof data!=='object'||data.version!==1||!Array.isArray(data.files)||data.files.length>BRANCH_LIMITS.files)throw invalid();
 const mains=new Set<string>(),branches=new Set<string>();
 for(const file of data.files){if(!file||!validId(file.mainId)||mains.has(file.mainId)||typeof file.protected!=='boolean'||!Array.isArray(file.branches)||file.branches.length>BRANCH_LIMITS.perFile)throw invalid();mains.add(file.mainId);
  for(const b of file.branches){if(!b||!validId(b.id)||branches.has(b.id)||b.id===file.mainId||typeof b.name!=='string'||!b.name||b.name.length>BRANCH_LIMITS.name||/[\u0000-\u001f]/.test(b.name)||!validDate(b.createdAt)||!validDate(b.baseAt)||!['active','merged','archived'].includes(b.status)||b.mergedAt!==undefined&&!validDate(b.mergedAt)||b.archivedAt!==undefined&&!validDate(b.archivedAt)||b.review?.note!==undefined&&(typeof b.review.note!=='string'||b.review.note.length>2000))throw invalid();branches.add(b.id);validateVersionAuthor(b.author);if(b.review!==undefined){if(!b.review||!validDate(b.review.at)||!validDate(b.review.revision))throw invalid();validateVersionAuthor(b.review.author);}}}
 for(const id of branches)if(mains.has(id))throw invalid();
 return structuredClone(data);
}
export function findBranch(registry:BranchRegistry,branchId:string){for(const file of registry.files){const branch=file.branches.find(b=>b.id===branchId);if(branch)return {file,branch};}return undefined;}
export const fileFor=(registry:BranchRegistry,mainId:string)=>registry.files.find(f=>f.mainId===mainId);
export const branchDocumentIds=(registry:BranchRegistry)=>new Set(registry.files.flatMap(f=>f.branches.map(b=>b.id)));
/** Forking needs the identities a later merge depends on; refuse now rather than strand work. */
export function assertForkable(doc:DesignDocument){const seen=new Set<string>();for(const page of doc.pages)for(const node of page.nodes){if(seen.has(node.id))throw Error('This file repeats layer identities across pages. Duplicate the affected pages before branching.');seen.add(node.id);}}
export type BranchState='up-to-date'|'ahead'|'behind'|'diverged'|'conflicts'|'merged'|'archived';
export interface BranchStatus {state:BranchState;ahead:number;behind:number;conflicts:number;reviewed:boolean;label:string;}
const sameIdentity=(older:DesignDocument,newer:DesignDocument)=>({...older,id:newer.id});
const changeCount=(c:VersionComparison)=>c.added+c.removed+c.changed+c.pagesAdded+c.pagesRemoved+c.pagesChanged+c.documentFields.length;
export const compareBranchSides=(older:DesignDocument,newer:DesignDocument,options?:Parameters<typeof compareVersionDocuments>[2])=>compareVersionDocuments(sameIdentity(older,newer),newer,options);
const plural=(n:number,word:string)=>`${n} ${word}${n===1?'':'s'}`;
/** Pure status from real content: base→branch is ahead, base→main is behind, overlap comes from the merge itself. */
export function branchStatus(record:BranchRecord,base:DesignDocument,main:DesignDocument,branch:DesignDocument,merge?:MergeResult):BranchStatus{
 const ahead=changeCount(compareBranchSides(base,branch,{limit:1})),behind=changeCount(compareBranchSides(base,main,{limit:1})),conflicts=ahead&&behind?(merge??mergeDocuments(base,main,branch)).conflicts.length:0,reviewed=record.review?.revision===branch.updatedAt;
 const state:BranchState=record.status==='archived'?'archived':record.status==='merged'?'merged':conflicts?'conflicts':ahead&&behind?'diverged':ahead?'ahead':behind?'behind':'up-to-date';
 const label={archived:'Archived',merged:'Merged',conflicts:`${plural(conflicts,'conflict')} with main`,diverged:`${plural(ahead,'change')} ahead · ${behind} behind main`,ahead:`${plural(ahead,'change')} ahead of main`,behind:`${plural(behind,'change')} behind main`,'up-to-date':'Up to date with main'}[state];
 return {state,ahead,behind,conflicts,reviewed,label};
}
/** Protection requires a review of this exact branch revision and an answered conflict for every overlap. */
export function mergeBlock(file:Pick<BranchFile,'protected'>,record:BranchRecord,branch:DesignDocument,result:MergeResult,answers:Readonly<Record<string,MergeSide>>){
 if(record.status==='archived')return 'Restore this archived branch before merging.';
 const open=result.conflicts.filter(c=>!answers[c.id]).length;if(open)return `Resolve ${plural(open,'remaining conflict')} before merging.`;
 if(result.validationError)return 'The merged project would be invalid: '+result.validationError;
 if(file.protected&&record.review?.revision!==branch.updatedAt)return 'Main is protected. Mark this branch revision as reviewed before merging.';
 return '';
}
