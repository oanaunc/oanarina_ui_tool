import {create} from 'zustand';
import type {AnnotationPoint} from './annotation-measure';
/** Editing-only canvas state. Never enters .oui, history or artwork exports. */
export type AnnotationPlacement='note'|'measure';
export const useAnnotationView=create<{visible:boolean;details:boolean;placing:AnnotationPlacement|null;request:{nodeId:string;at:AnnotationPoint}|null;setVisible:(value:boolean)=>void;setDetails:(value:boolean)=>void;setPlacing:(value:AnnotationPlacement|null)=>void;setRequest:(value:{nodeId:string;at:AnnotationPoint}|null)=>void}>(set=>({visible:false,details:false,placing:null,request:null,setVisible:visible=>set({visible}),setDetails:details=>set({details}),setPlacing:placing=>set({placing}),setRequest:request=>set({request})}));
