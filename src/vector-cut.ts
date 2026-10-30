import {create} from 'zustand';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {vectorCutMatrix} from './vector-cut-space';
import {point} from './transforms';
import {bendSegment,bendSegmentKeys} from './vector-bend-geometry';
import {cutVectorSegment,validateVectorCutSource} from './vector-cut-geometry';
import {useEditor} from './store';
import {useVectorBend} from './vector-bend';
import {useCanvasGradient} from './canvas-gradient';
import {useCanvasImageCrop} from './canvas-image-crop';
import {useMaskView} from './mask-view';
import {getPreferences,subscribePreferences} from './preferences';
export interface VectorCutContext {editor:ColorEditContext;id:string;tool:string;zoom:number;pan:{x:number;y:number};uiScale:number;valid:boolean;}
function target(id:string,allowInspection=false){const s=useEditor.getState(),nodes=s.doc.pages.find(p=>p.id===s.pageId)?.nodes??[],lookup=new Map(nodes.map(n=>[n.id,n])),n=lookup.get(id);if(!allowInspection&&(useMaskView.getState().preview||useMaskView.getState().outlines||useCanvasImageCrop.getState().context||useCanvasGradient.getState().context)||s.outlines||s.home||s.modal||s.uiHidden||s.motionOpen||s.mode!=='design'||s.doc.workspace&&s.doc.workspace!=='design'||s.selection.length!==1||s.selection[0]!==id||s.vectorEditId!==id||!['move','scale'].includes(s.tool)||!n||nodes.some(child=>child.parentId===id))throw Error('Select one visible unlocked contour path outside instances in Design point editing, with Motion closed.');let owner:typeof n|undefined=n,depth=0;const seen=new Set<string>();while(owner){if(seen.has(owner.id)||depth>64||owner.booleanOp)throw Error('Cut supports at most 64 acyclic ancestors, without live booleans.');seen.add(owner.id);if(owner.locked||!owner.visible||owner.instanceRootId||owner.id!==n.id&&owner.type==='instance')throw Error('Unlock and detach this vector hierarchy and make it visible before cutting.');if(owner.parentId&&!lookup.has(owner.parentId))throw Error('The vector owner is missing.');owner=lookup.get(owner.parentId??'');depth++;}validateVectorCutSource(n);const matrix=vectorCutMatrix(n,nodes,lookup);for(const key of bendSegmentKeys(n))for(const p of bendSegment(n,key).controls){const world=point(matrix,p.x,p.y);if(![world.x,world.y].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6))throw Error('The visible cut geometry exceeds ±1,000,000 canvas coordinates.');}return n;}
export function sameVectorCutContext(c:VectorCutContext){const s=useEditor.getState();return c.valid&&sameColorContext(c.editor,s)&&s.vectorEditId===c.id&&s.tool===c.tool&&s.zoom===c.zoom&&s.pan.x===c.pan.x&&s.pan.y===c.pan.y&&getPreferences().uiScale===c.uiScale;}
interface CutView {context:VectorCutContext|null;activate:(id:string)=>void;reset:()=>void;}
export const useVectorCut=create<CutView>((set,get)=>({context:null,activate:id=>{target(id,true);useMaskView.getState().reset();useCanvasImageCrop.getState().reset();useCanvasGradient.getState().reset();const s=useEditor.getState();useVectorBend.getState().reset();const old=get().context;if(old)old.valid=false;set({context:{editor:captureColorContext(s),id,tool:s.tool,zoom:s.zoom,pan:{...s.pan},uiScale:getPreferences().uiScale,valid:true}});},reset:()=>{const old=get().context;if(old)old.valid=false;set({context:null});}}));
useEditor.subscribe(()=>{const v=useVectorCut.getState();if(v.context&&!sameVectorCutContext(v.context))v.reset();});
subscribePreferences(()=>{const v=useVectorCut.getState();if(v.context&&!sameVectorCutContext(v.context))v.reset();});
useVectorBend.subscribe(v=>{if(v.context&&useVectorCut.getState().context)useVectorCut.getState().reset();});
export function commitVectorCut(c:VectorCutContext,key:string,t:number){if(useVectorCut.getState().context!==c||!sameVectorCutContext(c))throw Error('The cut target changed. Enable Cut path again.');const source=target(c.id),result=cutVectorSegment(source,key,t),expected=JSON.stringify({...source,contours:result.contours});useEditor.getState().edit(doc=>{doc.pages.find(p=>p.id===c.editor.pageId)!.nodes.find(n=>n.id===c.id)!.contours=result.contours;},doc=>{const n=doc.pages.find(p=>p.id===c.editor.pageId)?.nodes.find(n=>n.id===c.id);if(!n||JSON.stringify(n)!==expected)throw Error('A component or layout controller changed this cut. Edit the source or detach it first.');});useEditor.getState().set({vectorSelection:result.endpoints});return result;}

useMaskView.subscribe(v=>{if((v.preview||v.outlines)&&useVectorCut.getState().context)useVectorCut.getState().reset();});

useCanvasImageCrop.subscribe(v=>{if(v.context&&useVectorCut.getState().context)useVectorCut.getState().reset();});
useCanvasGradient.subscribe(v=>{if(v.context&&useVectorCut.getState().context)useVectorCut.getState().reset();});
