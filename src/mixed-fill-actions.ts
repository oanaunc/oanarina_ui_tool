import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {applyMixedFillPlan,planMixedFills,validateMixedFillPlan} from './mixed-fills';
import type {MixedFillOperation,MixedStackRole} from './mixed-fills';
export interface MixedFillContext {editor:ColorEditContext;valid:boolean;}
export const captureMixedFillContext=():MixedFillContext=>({editor:captureColorContext(useEditor.getState()),valid:true});
export function commitMixedFills(c:MixedFillContext,op:MixedFillOperation,role:MixedStackRole='fill'){const s=useEditor.getState();if(!c.valid||!sameColorContext(c.editor,s)||s.mode!=='design'||s.motionOpen||s.home||s.uiHidden||s.modal||s.doc.workspace==='slides')throw Error('The fill selection changed. Use the current Design selection with Motion closed.');const plan=planMixedFills(s.doc,s.pageId,s.selection,op,role);if(!plan.changes.size)return false;s.edit(d=>applyMixedFillPlan(d,plan),d=>validateMixedFillPlan(d,plan));return true;}
