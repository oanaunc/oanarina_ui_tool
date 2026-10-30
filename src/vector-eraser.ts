import {create} from 'zustand';
import {useEditor} from './store';
import {captureColorContext} from './color-edit-context';
import {getPreferences,subscribePreferences} from './preferences';
import {sameVectorCutContext,useVectorCut,validateVectorCutTarget} from './vector-cut';
import type {VectorCutContext} from './vector-cut';
import {useVectorBend} from './vector-bend';
import {useCanvasGradient} from './canvas-gradient';
import {useCanvasImageCrop} from './canvas-image-crop';
import {useMaskView} from './mask-view';
import {vectorCutMatrix} from './vector-cut-space';
import {eraseVectorStroke,validateVectorEraserSource} from './vector-eraser-geometry';
import type {EraserBrush,EraserShape} from './vector-eraser-geometry';
export interface VectorEraserContext extends VectorCutContext {diameter:number;shape:EraserShape;}
interface EraserView {context:VectorEraserContext|null;diameter:number;shape:EraserShape;activate:(id:string)=>void;configure:(diameter:number,shape:EraserShape)=>void;reset:()=>void;}
export const useVectorEraser=create<EraserView>((set,get)=>({context:null,diameter:32,shape:'round',configure:(diameter,shape)=>{if(!Number.isFinite(diameter)||diameter<1||diameter>500||!['round','square'].includes(shape))throw Error('Choose a round or square eraser, sized 1–500 canvas units.');get().reset();set({diameter,shape});},activate:id=>{validateVectorCutTarget(id,true,validateVectorEraserSource);get().reset();useVectorCut.getState().reset();useVectorBend.getState().reset();useCanvasGradient.getState().reset();useCanvasImageCrop.getState().reset();useMaskView.getState().reset();const s=useEditor.getState();set({context:{editor:captureColorContext(s),id,tool:s.tool,zoom:s.zoom,pan:{...s.pan},uiScale:getPreferences().uiScale,valid:true,diameter:get().diameter,shape:get().shape}});},reset:()=>{const c=get().context;if(c)c.valid=false;set({context:null});}}));
export const sameVectorEraserContext=(c:VectorEraserContext)=>useVectorEraser.getState().context===c&&!useEditor.getState().outlines&&sameVectorCutContext(c);
useEditor.subscribe(()=>{const v=useVectorEraser.getState();if(v.context&&!sameVectorEraserContext(v.context))v.reset();});
subscribePreferences(()=>{const v=useVectorEraser.getState();if(v.context&&!sameVectorEraserContext(v.context))v.reset();});
for(const view of [useVectorCut,useVectorBend,useCanvasGradient,useCanvasImageCrop])view.subscribe(v=>{if(v.context&&useVectorEraser.getState().context)useVectorEraser.getState().reset();});
useMaskView.subscribe(v=>{if((v.preview||v.outlines)&&useVectorEraser.getState().context)useVectorEraser.getState().reset();});
export function commitVectorEraser(c:VectorEraserContext,points:EraserBrush['points']){if(!sameVectorEraserContext(c))throw Error('The eraser target changed. Enable it again.');const source=validateVectorCutTarget(c.id,false,validateVectorEraserSource),nodes=c.editor.doc.pages.find(p=>p.id===c.editor.pageId)!.nodes,contours=eraseVectorStroke(source,vectorCutMatrix(source,nodes),{points,diameter:c.diameter,shape:c.shape});if(contours===source.contours)return false;const expected=JSON.stringify({...source,contours});useEditor.getState().edit(doc=>{doc.pages.find(p=>p.id===c.editor.pageId)!.nodes.find(n=>n.id===c.id)!.contours=contours;},doc=>{const n=doc.pages.find(p=>p.id===c.editor.pageId)?.nodes.find(n=>n.id===c.id);if(!n||JSON.stringify(n)!==expected)throw Error('A component or layout controller changed this erasure. Edit the source first.');});useEditor.getState().set({vectorSelection:[]});return true;}
