import {create} from 'zustand';
import {blankDocument} from '../model';
import type {DesignDocument} from '../model';
/** Stands in for the editor store inside an exported file. Only what the presentation reads exists here.
 * There is no editor to return to, so closing is ignored and the presentation stays open. */
export interface PlayerEditor {doc:DesignDocument;pageId:string;selection:string[];mode:string;home:boolean;motionOpen:boolean;motionTime:number;motionPlaying:boolean;modal:string|null;uiHidden:boolean;fontRevision:number;toast:string;set:(patch:Partial<PlayerEditor>)=>void;}
const initial=blankDocument();
export const useEditor=create<PlayerEditor>(set=>({doc:initial,pageId:initial.pages[0].id,selection:[],mode:'design',home:false,motionOpen:false,motionTime:0,motionPlaying:false,modal:'present',uiHidden:false,fontRevision:0,toast:'',set:patch=>{const {modal:_ignored,...rest}=patch;set(rest);}}));
