import type {DesignDocument} from './model';
import {cloneLocalDocument,fileMetadata} from './file-browser';
import {localVersionAuthor} from './local-profile';
import {repositoryRead,repositoryWrite,storedValue} from './repository';
import {validatedVersionDocument} from './version-review';
import {assertForkable,BRANCH_LIMITS,BRANCH_REGISTRY_KEY,branchBaseKey,branchName,fileFor,findBranch,validateBranchRegistry} from './branches';
import type {BranchFile,BranchLifecycle,BranchRecord,BranchRegistry} from './branches';

const readRegistry=async(tx:IDBTransaction)=>validateBranchRegistry(await storedValue(tx.objectStore('metadata').get(BRANCH_REGISTRY_KEY)));
const writeRegistry=(tx:IDBTransaction,registry:BranchRegistry)=>{validateBranchRegistry(registry);tx.objectStore('metadata').put(registry,BRANCH_REGISTRY_KEY);};
const ensureFile=(registry:BranchRegistry,mainId:string)=>{let file=fileFor(registry,mainId);if(!file){if(registry.files.length>=BRANCH_LIMITS.files)throw Error('This device has reached the local branch record limit.');file={mainId,protected:false,branches:[]};registry.files.push(file);}return file;};
export const readBranchRegistry=()=>repositoryRead(readRegistry);
/** Forks atomically: main, its base snapshot, the branch copy and the registry commit together or not at all. */
export async function createBranch(main:DesignDocument,name:string,signal?:AbortSignal){
 const label=branchName(name),safe=validatedVersionDocument(main);assertForkable(safe);const author=localVersionAuthor();
 return repositoryWrite(async(tx,state)=>{const registry=await readRegistry(tx);if(findBranch(registry,safe.id))throw Error('Switch to main before creating a branch. Branches cannot be nested.');const meta=fileMetadata(state,safe.id);if(meta.deleted||meta.trashedAt)throw Error('Restore this file from Trash before branching.');const file=ensureFile(registry,safe.id);if(file.branches.length>=BRANCH_LIMITS.perFile)throw Error('A file keeps up to 50 local branches. Delete archived branches first.');if(file.branches.some(b=>b.name.toLocaleLowerCase()===label.toLocaleLowerCase()))throw Error('A branch with this name already exists.');const document=cloneLocalDocument(safe,safe.name),now=new Date().toISOString(),record:BranchRecord={id:document.id,name:label,createdAt:now,baseAt:safe.updatedAt,status:'active',...(author?{author}:{})};tx.objectStore('documents').put(safe);tx.objectStore('documents').add(document);tx.objectStore('metadata').put(safe,branchBaseKey(document.id));file.branches.push(record);writeRegistry(tx,registry);return {record,document};},signal);
}
export interface BranchParts {record:BranchRecord;file:BranchFile;base:DesignDocument;branch:DesignDocument;}
/** Both sides are revalidated on every read; damaged records stop here, before any mutation. */
export async function readBranchParts(branchId:string):Promise<BranchParts>{
 const stored=await repositoryRead(async tx=>{const found=findBranch(await readRegistry(tx),branchId);if(!found)throw Error('This branch is no longer available.');const [base,branch]=await Promise.all([storedValue<DesignDocument|undefined>(tx.objectStore('metadata').get(branchBaseKey(branchId))),storedValue<DesignDocument|undefined>(tx.objectStore('documents').get(branchId))]);return {found,base,branch};});
 if(!stored.base||!stored.branch)throw Error('This branch is missing stored data. The main file is unchanged.');
 return {record:stored.found.branch,file:stored.found.file,base:validatedVersionDocument(stored.base),branch:validatedVersionDocument(stored.branch)};
}
export async function updateBranch(branchId:string,patch:(record:BranchRecord,file:BranchFile)=>void){return repositoryWrite(async tx=>{const registry=await readRegistry(tx),found=findBranch(registry,branchId);if(!found)throw Error('This branch is no longer available.');patch(found.branch,found.file);writeRegistry(tx,registry);return structuredClone(found.branch);});}
export function setBranchLifecycle(branchId:string,status:BranchLifecycle){const now=new Date().toISOString();return updateBranch(branchId,record=>{record.status=status;if(status==='archived')record.archivedAt=now;else delete record.archivedAt;if(status==='merged')record.mergedAt=now;else if(status==='active')delete record.mergedAt;});}
/** A review stamps one exact branch revision. Any later branch edit needs a fresh review. */
export function recordBranchReview(branchId:string,revision:string){const author=localVersionAuthor();return updateBranch(branchId,record=>{record.review={at:new Date().toISOString(),revision,...(author?{author}:{})};});}
export async function setMainProtection(mainId:string,enabled:boolean){return repositoryWrite(async tx=>{const registry=await readRegistry(tx);if(findBranch(registry,mainId))throw Error('Protection applies to a main file, not to a branch.');ensureFile(registry,mainId).protected=enabled;writeRegistry(tx,registry);return enabled;});}
/** Only archived branches can be removed; the base snapshot and working copy leave together. */
export async function deleteArchivedBranch(branchId:string){return repositoryWrite(async tx=>{const registry=await readRegistry(tx),found=findBranch(registry,branchId);if(!found)throw Error('This branch is no longer available.');if(found.branch.status!=='archived')throw Error('Archive this branch before deleting it.');found.file.branches=found.file.branches.filter(b=>b.id!==branchId);tx.objectStore('documents').delete(branchId);tx.objectStore('metadata').delete(branchBaseKey(branchId));writeRegistry(tx,registry);});}
