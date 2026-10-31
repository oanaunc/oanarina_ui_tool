import {create} from 'zustand';
import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {effectiveVisible,isLocked} from './model';
import type {DesignNode} from './model';
import {managedLayer} from './layer-operations';
import {fillsFor,strokesFor} from './paints';
import type {Paint} from './paints';
import {measuredPaintBox,paintsForRole} from './paint-box';
import type {PaintBox,PaintRole} from './paint-box';
export const gradientPaints=paintsForRole;
import {detachEditedBindings} from './design-systems';
import {validateCanvasGradient,gradientAppearanceKey} from './canvas-gradient-geometry';
import {getPreferences} from './preferences';
import {useMaskView} from './mask-view';
import {useVectorBend} from './vector-bend';
import {useCanvasImageCrop} from './canvas-image-crop';
export type GradientRole=PaintRole;
export interface CanvasGradientContext {editor:ColorEditContext;id:string;paintId:string;role:GradientRole;box:PaintBox;tool:string;zoom:number;pan:{x:number;y:number};uiScale:number;}
function target(id:string,paintId:string,role:GradientRole,measured?:PaintBox){const s=useEditor.getState(),nodes=s.doc.pages.find(p=>p.id===s.pageId)?.nodes??[],n=nodes.find(n=>n.id===id);if(!n||s.home||s.uiHidden||s.modal||s.motionOpen||s.mode!=='design'||s.doc.workspace&&s.doc.workspace!=='design'||s.selection.length!==1||s.selection[0]!==id||s.vectorEditId||!['move','scale'].includes(s.tool)||s.outlines||isLocked(n,nodes)||!effectiveVisible(n,nodes)||n.type==='instance'||managedLayer(n,nodes))throw Error('Select one visible unlocked gradient fill outside instances in Design mode, with Motion, outlines and point editing closed.');const matches=gradientPaints(n,role).filter(p=>p.id===paintId);if(matches.length!==1)throw Error('Choose an unambiguous gradient again.');let parent=nodes.find(p=>p.id===n.parentId),depth=0;while(parent){if(++depth>64||parent.booleanOp)throw Error('Gradient handles need at most 64 ancestors and no live boolean ancestor.');parent=nodes.find(p=>p.id===parent!.parentId);}const box=measured??measuredPaintBox(n,paintId,role);validateCanvasGradient(n,matches[0],nodes,box);return {n,nodes,paint:matches[0],box};}
export function captureCanvasGradient(id:string,paintId:string,role:GradientRole='fill'):CanvasGradientContext{const s=useEditor.getState(),{box}=target(id,paintId,role);return {editor:captureColorContext(s),id,paintId,role,box,tool:s.tool,zoom:s.zoom,pan:{...s.pan},uiScale:getPreferences().uiScale};}
export function sameCanvasGradient(c:CanvasGradientContext){const s=useEditor.getState();return sameColorContext(c.editor,s)&&!s.vectorEditId&&!s.outlines&&s.tool===c.tool&&s.zoom===c.zoom&&s.pan.x===c.pan.x&&s.pan.y===c.pan.y&&getPreferences().uiScale===c.uiScale;}
export function commitCanvasGradient(c:CanvasGradientContext,patch:Partial<Paint>){if(!sameCanvasGradient(c))throw Error('The gradient target changed. Start again.');const {n,nodes,paint}=target(c.id,c.paintId,c.role,c.box),allowed=paint.type==='linear'?['linearStart','linearEnd','angle','stops']:paint.type==='radial'?['cx','cy','radius','stops']:['cx','cy','radius','angle','stops'];if(Object.keys(patch).some(k=>!allowed.includes(k)))throw Error('Invalid gradient handle patch.');if(patch.stops&&(patch.stops.length!==paint.stops.length||patch.stops.some((s,i)=>s.id!==paint.stops[i].id||s.color!==paint.stops[i].color||s.opacity!==paint.stops[i].opacity)))throw Error('A handle changes stop positions only; use the inspector to change stop colors or membership.');const next={...paint,...patch};validateCanvasGradient(n,next,nodes,c.box);if(gradientAppearanceKey(next)===gradientAppearanceKey(paint))return;const paints=c.role==='fill'?fillsFor(n).map(p=>p.id===c.paintId?next:structuredClone(p)):undefined,strokes=c.role==='stroke'?strokesFor(n).map(s=>s.paint.id===c.paintId?{...structuredClone(s),paint:next}:structuredClone(s)):undefined,change:Partial<DesignNode>=paints?{paints,fill:paints.find(p=>p.visible)?.color??'none',gradient:false}:{strokes},expected=JSON.stringify(paints??strokes),box=JSON.stringify([n.x,n.y,n.width,n.height,n.rotation,n.flipX,n.flipY,n.motionScaleX,n.motionScaleY]);useEditor.getState().edit(doc=>{const n=doc.pages.find(p=>p.id===c.editor.pageId)!.nodes.find(n=>n.id===c.id)!;detachEditedBindings(n,change);Object.assign(n,change);},doc=>{const n=doc.pages.find(p=>p.id===c.editor.pageId)?.nodes.find(n=>n.id===c.id);if(!n||JSON.stringify(c.role==='fill'?n.paints:n.strokes)!==expected||JSON.stringify([n.x,n.y,n.width,n.height,n.rotation,n.flipX,n.flipY,n.motionScaleX,n.motionScaleY])!==box)throw Error('A component or layout controller changed this gradient. Edit its source or detach it first.');});}
interface GradientView {context:CanvasGradientContext|null;activate:(id:string,paintId:string,role?:GradientRole)=>void;reset:()=>void;}
export const useCanvasGradient=create<GradientView>(set=>({context:null,activate:(id,paintId,role='fill')=>{const context=captureCanvasGradient(id,paintId,role);useCanvasImageCrop.getState().reset();useMaskView.getState().reset();useVectorBend.getState().reset();set({context});},reset:()=>set({context:null})}));
useEditor.subscribe(()=>{const v=useCanvasGradient.getState();if(v.context&&!sameCanvasGradient(v.context))v.reset();});
useCanvasImageCrop.subscribe(v=>{if(v.context&&useCanvasGradient.getState().context)useCanvasGradient.getState().reset();});
useMaskView.subscribe(v=>{if((v.preview||v.outlines)&&useCanvasGradient.getState().context)useCanvasGradient.getState().reset();});
useVectorBend.subscribe(v=>{if(v.context&&useCanvasGradient.getState().context)useCanvasGradient.getState().reset();});
