import {constants} from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export const UNDO_HISTORY_LIMITS={entries:20,bytes:250_000_000} as const;
export interface UndoEntry {id:string;before:string;after:string;bytes:number;createdAt:string;}
interface Manifest {format:'forma-mcp-undo';version:1;documentId:string;entries:UndoEntry[];}
type ProjectReader=(handle:fs.FileHandle)=>Promise<string>;
const entryId=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,revision=/^[a-f0-9]{64}$/,MANIFEST='manifest.json';
const validEntry=(value:unknown):value is UndoEntry=>{const e=value as UndoEntry;return !!e&&typeof e==='object'&&Object.keys(e).length===5&&entryId.test(e.id)&&revision.test(e.before)&&revision.test(e.after)&&Number.isSafeInteger(e.bytes)&&e.bytes>0&&typeof e.createdAt==='string'&&e.createdAt.length<=64;};
/** Hidden sibling of the scoped project. Holds pre-transaction copies, so it is as private as the project. */
export const undoHistoryDirectory=(file:string)=>path.join(path.dirname(file),'.'+path.basename(file)+'.oanarina-mcp-history');
/** Bounded on-disk stack. Callers hold the project lock, so processes never interleave a read and rewrite.
 * An entry is undoable only while the file is byte-identical to that entry's result: a Forma save or any
 * other external change stops the stack instead of undoing across work this history never saw. */
export class UndoHistory {
 readonly directory:string;
 constructor(file:string,private read:ProjectReader,private maxBytes:number=UNDO_HISTORY_LIMITS.bytes){this.directory=undoHistoryDirectory(file);}
 private async ensure(){await fs.mkdir(this.directory,{mode:0o700}).catch((e:NodeJS.ErrnoException)=>{if(e.code!=='EEXIST')throw e;});const info=await fs.lstat(this.directory);if(!info.isDirectory())throw Error('Undo history location is not a private directory.');}
 private async replace(name:string,raw:string){const temp=path.join(this.directory,'.'+randomUUID()+'.tmp');try{const handle=await fs.open(temp,'wx',0o600);try{await handle.writeFile(raw,'utf8');await handle.sync();}finally{await handle.close();}await fs.rename(temp,path.join(this.directory,name));}catch(e){await fs.unlink(temp).catch(()=>{});throw e;}const directory=await fs.open(this.directory,'r');try{await directory.sync();}finally{await directory.close();}}
 private async readFile(name:string,limit?:number){const handle=await fs.open(path.join(this.directory,name),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK|constants.O_NOCTTY);try{const stat=await handle.stat();if(!stat.isFile()||limit!==undefined&&stat.size>limit)throw Error('Undo history file is not a bounded regular file.');return await this.read(handle);}finally{await handle.close();}}
 /** Missing and damaged history are both empty: they can only refuse Undo, never alter the project. */
 private async manifest(documentId:string):Promise<{entries:UndoEntry[];damaged:boolean}>{
  let raw:string;try{raw=await this.readFile(MANIFEST,1_000_000);}catch(e){return {entries:[],damaged:(e as NodeJS.ErrnoException).code!=='ENOENT'};}
  try{const value=JSON.parse(raw) as Manifest;if(value.format!=='forma-mcp-undo'||value.version!==1||typeof value.documentId!=='string'||!Array.isArray(value.entries)||value.entries.length>UNDO_HISTORY_LIMITS.entries||!value.entries.every(validEntry))throw Error('Invalid manifest');return {entries:value.documentId===documentId?value.entries:[],damaged:false};}catch{return {entries:[],damaged:true};}
 }
 private write(documentId:string,entries:UndoEntry[]){const manifest:Manifest={format:'forma-mcp-undo',version:1,documentId,entries};return this.replace(MANIFEST,JSON.stringify(manifest)+'\n');}
 /** A crash after staging but before the project rename leaves a top entry the file never reached. */
 private live(entries:UndoEntry[],current:string){const top=entries.at(-1);return top&&top.after!==current&&top.before===current?entries.slice(0,-1):entries;}
 private unreferenced(entries:UndoEntry[]){return fs.readdir(this.directory).then(names=>Promise.all(names.filter(n=>n.endsWith('.json')&&n!==MANIFEST&&!entries.some(e=>e.id+'.json'===n)).map(n=>fs.unlink(path.join(this.directory,n)).catch(()=>{})))).catch(()=>{});}
 async status(current:string,documentId:string){const {entries:saved,damaged}=await this.manifest(documentId),entries=this.live(saved,current),top=entries.at(-1);return {entries:entries.length,bytes:entries.reduce((sum,e)=>sum+e.bytes,0),undoAvailable:top?.after===current,...(top&&top.after!==current?{notice:'The project changed after the latest MCP transaction, so MCP Undo is stopped to protect that work.'}:{}),...(damaged?{notice:'Saved MCP Undo history is unreadable and is ignored; it is replaced by the next successful transaction.'}:{}),oldestAt:entries[0]?.createdAt,latestAt:top?.createdAt};}
 /** Snapshot validation happens here, before the caller derives a document from it. */
 async target(current:string,documentId:string){
  const {entries:saved,damaged}=await this.manifest(documentId),entries=this.live(saved,current),entry=entries.at(-1);
  if(!entry)throw Error(damaged?'No MCP transaction to undo: saved Undo history is unreadable.':'No MCP transaction to undo for this project.');
  if(entry.after!==current)throw Error('No MCP transaction to undo: the project changed after the latest MCP transaction, for example through a Forma save. Undo is refused to protect that work.');
  let raw:string;try{raw=await this.readFile(entry.id+'.json');}catch{throw Error('No MCP transaction to undo: its saved copy is missing or unreadable.');}
  return {entry,entries,raw};
 }
 /** Call before the project rename. Durable first, so a crash can lose an Undo but never strand a claimed one. */
 async stage(raw:string,before:string,after:string,documentId:string,bytes:number){
  await this.ensure();const {entries:saved}=await this.manifest(documentId),prior=this.live(saved,before),continuing=prior.at(-1)?.after===before?prior:[],entry:UndoEntry={id:randomUUID(),before,after,bytes,createdAt:new Date().toISOString()};
  await this.replace(entry.id+'.json',raw);
  let entries=[...continuing,entry];while(entries.length>1&&(entries.length>UNDO_HISTORY_LIMITS.entries||entries.reduce((sum,e)=>sum+e.bytes,0)>this.maxBytes))entries=entries.slice(1);
  try{await this.write(documentId,entries);}catch(e){await fs.unlink(path.join(this.directory,entry.id+'.json')).catch(()=>{});throw e;}
  return {commit:()=>this.unreferenced(entries),rollback:async()=>{await this.write(documentId,prior);await this.unreferenced(prior);}};
 }
 /** The restored document gets a fresh timestamp, so the previous entry now ends at the new revision. */
 async finishUndo(target:{entry:UndoEntry;entries:UndoEntry[]},revisionAfter:string,documentId:string){const entries=target.entries.slice(0,-1),previous=entries.at(-1);await this.write(documentId,previous?.after===target.entry.before?[...entries.slice(0,-1),{...previous,after:revisionAfter}]:[]);await this.unreferenced(entries);}
 async clear(){await fs.rm(this.directory,{recursive:true,force:true});}
}
