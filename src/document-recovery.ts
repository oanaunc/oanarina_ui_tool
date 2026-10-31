import {create} from 'zustand';
import type {DesignDocument} from './model';
import {activeDocument,activeDocumentId,documentById,importLocalDocuments,rawStoredDocument} from './repository';
import {useEditor} from './store';

export interface DamagedDocument {id:string;name:string;reason:string;}
export const useDamagedDocument=create<{target:DamagedDocument|null}>(()=>({target:null}));
export function reportDamagedDocument(id:string,name:string,error?:unknown){const reason=error instanceof Error?error.message:'This stored file failed validation.';useDamagedDocument.setState({target:{id,name,reason}});useEditor.getState().set({modal:'document-recovery'});}
const storedName=(raw:unknown)=>{const name=(raw as {name?:unknown}|undefined)?.name;return typeof name==='string'?name.slice(0,120):'Unnamed file';};
async function intercept<T>(id:string|undefined,error:unknown):Promise<T|null>{if(!id)throw error;const raw=await rawStoredDocument(id).catch(()=>undefined);if(raw===undefined)throw error;reportDamagedDocument(id,storedName(raw),error);return null;}
/** Stored data that fails validation opens the recovery choices; storage failures keep their normal path. */
export async function guardedActiveDocument(){try{return await activeDocument();}catch(error){return intercept<DesignDocument>(await activeDocumentId().catch(()=>undefined),error);}}
export async function guardedDocumentById(id:string,options?:Parameters<typeof documentById>[1]){try{return await documentById(id,options);}catch(error){return intercept<DesignDocument>(id,error);}}
/** Recovered data always becomes a new file; the damaged record stays exactly as it was. */
export async function openRecoveredCopy(document:DesignDocument,name:string){const [copy]=await importLocalDocuments([JSON.stringify({...document,name:name.slice(0,120)})]);const desktop=window.desktop as typeof window.desktop&{openDocument?:(raw:string)=>Promise<unknown>};if(desktop?.openDocument){await desktop.openDocument(JSON.stringify(copy));useEditor.getState().set({modal:null});}else{useEditor.getState().load(copy);useEditor.getState().set({modal:null});}useDamagedDocument.setState({target:null});return copy;}
