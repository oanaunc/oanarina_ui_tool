import {create} from 'zustand';
/** Editing-only canvas visibility. Never enters .oui, history or artwork exports. */
export const useAnnotationView=create<{visible:boolean;setVisible:(value:boolean)=>void}>(set=>({visible:false,setVisible:visible=>set({visible})}));
