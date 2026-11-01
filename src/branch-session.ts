import {packedProject} from './image-sharing';
import {create} from 'zustand';
import {readBranchRegistry} from './branch-repository';
import {fileFor,findBranch} from './branches';
import type {BranchFile,BranchRecord} from './branches';
import {desktopDocuments,setDocumentLabel} from './desktop-lifecycle';
import {documentById,markDocumentOpened,saveDocument,subscribeRepository} from './repository';
import {setEditGuard,useEditor} from './store';

export const MAIN_PROTECTED_MESSAGE='Main is protected. Create or open a branch to change this file.';
export interface BranchSession {documentId:string;role:'plain'|'main'|'branch';file?:BranchFile;branch?:BranchRecord;reviewing?:string;}
export const useBranchSession=create<BranchSession>(()=>({documentId:'',role:'plain'}));
let generation=0;
export async function refreshBranchSession(){const id=useEditor.getState().doc.id,ticket=++generation;try{const registry=await readBranchRegistry();if(ticket!==generation||useEditor.getState().doc.id!==id)return;const found=findBranch(registry,id),file=found?.file??fileFor(registry,id);useBranchSession.setState({documentId:id,role:found?'branch':file?'main':'plain',file,branch:found?.branch},false);}catch{if(ticket===generation)useBranchSession.setState({documentId:id,role:'plain',file:undefined,branch:undefined});}}
export function branchEditRefusal(session:BranchSession,documentId:string){if(session.documentId!==documentId)return undefined;if(session.role==='main'&&session.file?.protected)return MAIN_PROTECTED_MESSAGE;if(session.role==='branch'&&session.branch&&session.branch.status!=='active')return `This branch is ${session.branch.status}. Reopen it from Branches to keep editing.`;return undefined;}
/** Branch context follows the open document and repository notices from other windows. */
export function watchBranchSession(){setEditGuard(doc=>branchEditRefusal(useBranchSession.getState(),doc.id));setDocumentLabel(doc=>{const s=useBranchSession.getState();return s.documentId===doc.id&&s.branch?`${doc.name} · ${s.branch.name}`:doc.name;});void refreshBranchSession();const offDoc=useEditor.subscribe((state,previous)=>{if(state.doc.id!==previous.doc.id){useBranchSession.setState({documentId:'',role:'plain',file:undefined,branch:undefined,reviewing:undefined});void refreshBranchSession();}}),offRepository=subscribeRepository(()=>void refreshBranchSession());return()=>{offDoc();offRepository();setEditGuard(undefined);setDocumentLabel(undefined);};}
/** Retains the outgoing document before switching; native windows stay one document each. */
export async function openBranchDocument(id:string,fit=true){
 const live=useEditor.getState(),mustRetain=desktopDocuments.state(live.doc).dirty||live.past.length>0&&live.savedAt!==live.doc.updatedAt;
 try{if(!await saveDocument(live.doc)&&mustRetain)throw Error();}catch{if(mustRetain)throw Error('Your current edits could not be kept in local recovery. Save a .oui backup before switching.');}
 const doc=await documentById(id,{includeTrashed:true});if(!doc)throw Error('This branch document is unavailable.');await markDocumentOpened(doc.id);
 const desktop=window.desktop as typeof window.desktop&{openDocument?:(raw:string)=>Promise<unknown>};if(desktop?.openDocument){await desktop.openDocument(packedProject(doc));return false;}
 useEditor.getState().load(doc);if(fit)setTimeout(()=>{if(useEditor.getState().doc.id===doc.id)useEditor.getState().fit();},0);return true;
}
