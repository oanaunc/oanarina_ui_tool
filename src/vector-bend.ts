import {create} from 'zustand';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {effectiveVisible,isLocked} from './model';
import {useEditor} from './store';
import {bendSegment,bendSegmentKeys,bendVectorSegment} from './vector-bend-geometry';
import type {BendPoint} from './vector-bend-geometry';
import {canvasVectorInPath} from './canvas-geometry';

export interface BendContext {editor:ColorEditContext;id:string;tool:string;zoom:number;pan:{x:number;y:number};}
export function captureBendContext(id:string):BendContext{const s=useEditor.getState(),nodes=s.doc.pages.find(p=>p.id===s.pageId)!.nodes,n=nodes.find(n=>n.id===id);if(s.home||s.modal||s.uiHidden||s.motionOpen||s.mode!=='design'||s.doc.workspace==='slides'||s.vectorEditId!==id||!s.selection.includes(id)||!['move','scale'].includes(s.tool)||!n||isLocked(n,nodes)||!effectiveVisible(n,nodes)||n.instanceRootId||!bendSegmentKeys(n).length)throw Error('Select an unlocked contour path outside instances, with Motion closed, to bend its segments.');if(n.width<=0||n.height<=0)throw Error('Restore this path size before bending its segments.');for(const key of bendSegmentKeys(n))bendSegment(n,key);canvasVectorInPath(n,nodes,0,0);return {editor:captureColorContext(s),id,tool:s.tool,zoom:s.zoom,pan:{...s.pan}};}
export function sameBendContext(c:BendContext){const s=useEditor.getState();return sameColorContext(c.editor,s)&&s.vectorEditId===c.id&&s.tool===c.tool&&s.zoom===c.zoom&&s.pan.x===c.pan.x&&s.pan.y===c.pan.y;}
export function commitVectorBend(context:BendContext,key:string,t:number,delta:BendPoint){if(!sameBendContext(context))throw Error('The bend target changed. Start the drag again.');captureBendContext(context.id);const s=useEditor.getState(),source=s.doc.pages.find(p=>p.id===context.editor.pageId)!.nodes.find(n=>n.id===context.id)!,contours=bendVectorSegment(source,key,t,delta),expected=JSON.stringify(contours);s.edit(doc=>{doc.pages.find(p=>p.id===context.editor.pageId)!.nodes.find(n=>n.id===context.id)!.contours=contours;},doc=>{const n=doc.pages.find(p=>p.id===context.editor.pageId)?.nodes.find(n=>n.id===context.id);if(!n||JSON.stringify(n.contours)!==expected)throw Error('This geometry is controlled by its component or workspace. Edit the source instead.');});}
interface BendView {context:BendContext|null;activate:(id:string)=>void;reset:()=>void;}
/** Tool state and its previews are editor-only; neither exports nor .oui documents read it. */
export const useVectorBend=create<BendView>(set=>({context:null,activate:id=>set({context:captureBendContext(id)}),reset:()=>set({context:null})}));
useEditor.subscribe(()=>{const v=useVectorBend.getState();if(v.context&&!sameBendContext(v.context))v.reset();});
