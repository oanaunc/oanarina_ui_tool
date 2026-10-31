import {create} from 'zustand';
import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {useCanvasImageCrop} from './canvas-image-crop';
import {useCanvasGradient} from './canvas-gradient';
import {useMaskView} from './mask-view';
import {useVectorBend} from './vector-bend';
import {useVectorCut} from './vector-cut';
import {getPreferences,subscribePreferences} from './preferences';
import {repeatSource,planLayerRepeat,assertRepeatDerived} from './repeat-layers';
import {liveFromRepeat,setLiveRepeat} from './live-repeat';
import type {RepeatOptions,RepeatPlan} from './repeat-layers';
export interface RepeatContext {editor:ColorEditContext;id:string;kind:RepeatOptions['kind'];tool:string;zoom:number;pan:{x:number;y:number};uiScale:number;}
interface RepeatView {context:RepeatContext|null;plan:RepeatPlan|null;reset:()=>void;}
export const useRepeatView=create<RepeatView>(set=>({context:null,plan:null,reset:()=>set({context:null,plan:null})}));
function editorTarget(){const s=useEditor.getState();if(s.home||s.uiHidden||s.mode!=='design'||s.motionOpen||s.vectorEditId||s.selection.length!==1||!['move','scale'].includes(s.tool)||s.outlines)throw Error('Select one source on the visible Design canvas, with Motion, outlines and point editing closed.');return repeatSource(s.doc,s.pageId,s.selection[0]);}
export function openRepeat(kind:RepeatOptions['kind']){const s=useEditor.getState();editorTarget();if(s.modal&&s.modal!=='actions')throw Error('Close the current dialog before repeating layers.');useCanvasImageCrop.getState().reset();useCanvasGradient.getState().reset();useVectorBend.getState().reset();useVectorCut.getState().reset();useMaskView.getState().reset();s.set({modal:'repeat-layers'});const live=useEditor.getState(),context:RepeatContext={editor:captureColorContext(live),id:live.selection[0],kind,tool:live.tool,zoom:live.zoom,pan:{...live.pan},uiScale:getPreferences().uiScale};useRepeatView.setState({context,plan:null});}
export function sameRepeatContext(c:RepeatContext){const s=useEditor.getState(),mask=useMaskView.getState();return useRepeatView.getState().context===c&&sameColorContext(c.editor,s)&&c.tool===s.tool&&c.zoom===s.zoom&&c.pan.x===s.pan.x&&c.pan.y===s.pan.y&&c.uiScale===getPreferences().uiScale&&!s.vectorEditId&&!s.outlines&&!mask.outlines&&!mask.preview&&!useCanvasGradient.getState().context&&!useCanvasImageCrop.getState().context&&!useVectorBend.getState().context&&!useVectorCut.getState().context;}
export function previewRepeat(c:RepeatContext,o:RepeatOptions){if(!sameRepeatContext(c)||o.kind!==c.kind)throw Error('The repeat target changed. Close and start again.');editorTarget();const plan=planLayerRepeat(c.editor.doc,c.editor.pageId,c.id,o);if(!sameRepeatContext(c))throw Error('The repeat target changed.');useRepeatView.setState({plan});return plan;}
/** Stores the reviewed settings on the source instead of writing copies. */
export function commitLiveRepeat(c:RepeatContext,plan:RepeatPlan,options:RepeatOptions){if(!sameRepeatContext(c)||useRepeatView.getState().plan!==plan)throw Error('The repeat preview changed. Review it again.');editorTarget();const s=useEditor.getState(),nodes=c.editor.doc.pages.find(p=>p.id===c.editor.pageId)!.nodes,live=liveFromRepeat(options,nodes.find(n=>n.id===c.id)!,nodes);s.edit(d=>setLiveRepeat(d,c.editor.pageId,c.id,live));useEditor.getState().set({selection:[c.id],modal:null});useRepeatView.getState().reset();}
export function commitRepeat(c:RepeatContext,plan:RepeatPlan){if(!sameRepeatContext(c)||useRepeatView.getState().plan!==plan||plan.document!==c.editor.doc||plan.pageId!==c.editor.pageId||plan.sourceId!==c.id)throw Error('The repeat preview changed. Review it again.');editorTarget();const s=useEditor.getState();s.edit(d=>{d.pages.find(p=>p.id===c.editor.pageId)!.nodes=structuredClone(plan.nodes);},d=>assertRepeatDerived(plan,d));s.set({selection:[c.id,...plan.rootIds],modal:null});useRepeatView.getState().reset();}
useEditor.subscribe(()=>{const v=useRepeatView.getState();if(v.context&&!sameRepeatContext(v.context))v.reset();});
subscribePreferences(()=>{const v=useRepeatView.getState();if(v.context&&!sameRepeatContext(v.context))v.reset();});
for(const mode of [useMaskView,useCanvasGradient,useCanvasImageCrop,useVectorBend,useVectorCut])mode.subscribe(()=>{const v=useRepeatView.getState();if(v.context&&!sameRepeatContext(v.context))v.reset();});
