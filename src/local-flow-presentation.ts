import {create} from 'zustand';
import type {DesignDocument} from './model';
import {useEditor} from './store';
import {resolveLocalNavigationLink} from './local-navigation-links';
import {sameArtworkSource} from './prototype-comments';
export interface LocalFlowPresentation {document:DesignDocument;pageId:string;flowId:string;}
export const useLocalFlowPresentation=create<{request:LocalFlowPresentation|null;clear:()=>void}>(set=>({request:null,clear:()=>set({request:null})}));
/** Install only after navigation has committed; never modify authored flows or prototype settings. */
export function presentLocalLinkedFlow(document:DesignDocument,pageId:string,flowId:string){const s=useEditor.getState();if(s.doc!==document||s.pageId!==pageId||s.home||s.uiHidden||s.motionOpen||s.mode!=='design'||s.modal)throw Error('The linked prototype context changed.');resolveLocalNavigationLink(document,{kind:'flow',documentId:document.id,pageId,flowId});useLocalFlowPresentation.setState({request:{document,pageId,flowId}});s.set({modal:'present'});}
useEditor.subscribe(s=>{let request=useLocalFlowPresentation.getState().request;if(request&&s.doc!==request.document&&sameArtworkSource(request.document,s.doc)){request={...request,document:s.doc};useLocalFlowPresentation.setState({request});}if(request&&(s.doc!==request.document||s.pageId!==request.pageId||s.modal!=='present'||s.home||s.uiHidden||s.motionOpen||s.mode!=='design')){useLocalFlowPresentation.getState().clear();if(s.modal==='present')s.set({modal:null});}});
