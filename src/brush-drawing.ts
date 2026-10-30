import {validateDocumentProgressiveBlur} from './progressive-blur';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {useEditor} from './store';
import {getPreferences,subscribePreferences} from './preferences';
import {parseDocument} from './model';
import {point} from './transforms';
import type {Matrix} from './transforms';
import {indexBrushScene,brushParentAt,brushParentSpace} from './brush-scene';
import type {BrushScene} from './brush-scene';
import {useBrushLibrary} from './brush-library';
import {validateBrushPreset} from './brush-presets';
import type {BrushPreset} from './brush-presets';
import {materializeBrush} from './brush-geometry';
import type {BrushSample} from './brush-geometry';
import {useMaskView} from './mask-view';
import {useCanvasImageCrop} from './canvas-image-crop';
import {useCanvasGradient} from './canvas-gradient';
import {useVectorBend} from './vector-bend';
import {useVectorCut} from './vector-cut';
import {useVectorEraser} from './vector-eraser';
import {useMultiVector} from './multi-vector';
import {useVectorLasso} from './vector-lasso';
import {useWidthView} from './variable-width-actions';
let activeBrushContext:BrushContext|null=null;
export interface BrushContext {editor:ColorEditContext;zoom:number;pan:{x:number;y:number};uiScale:number;preset:BrushPreset;parentId:string|null;groupId:string;scene:BrushScene;parentInverse:Matrix;parentOrigin:{x:number;y:number};valid:boolean;}
export function brushContextIssue(){const s=useEditor.getState();if(s.tool!=='brush'||s.home||s.uiHidden||s.modal||s.mode!=='design'||s.motionOpen||s.vectorEditId||s.outlines||s.doc.workspace&&s.doc.workspace!=='design')return 'Use Brush in the Design canvas with Motion, outlines and point editing closed.';if(useMaskView.getState().outlines||useMaskView.getState().preview||useCanvasImageCrop.getState().context||useCanvasGradient.getState().context||useVectorBend.getState().context||useVectorCut.getState().context||useVectorEraser.getState().context||useVectorLasso.getState().context||useMultiVector.getState().context||useWidthView.getState().context)return 'Finish the active canvas editing mode before drawing a brush stroke.';return '';}
export function activateBrushTool(){const s=useEditor.getState();if(s.home||s.uiHidden||s.modal||s.mode!=='design'||s.motionOpen||s.outlines||s.doc.workspace&&s.doc.workspace!=='design')throw Error('Open Design with Motion and outlines closed to use Brush.');for(const v of [useCanvasImageCrop,useCanvasGradient,useVectorBend,useVectorCut,useVectorEraser,useVectorLasso,useMultiVector,useWidthView])v.getState().reset();useMaskView.getState().reset();s.set({tool:'brush',vectorEditId:null,vectorSelection:[]});}
/** Hit-tested containers are validated, never silently skipped to another owner when locked. */
export function captureBrushContext(position:{x:number;y:number},parentId?:string|null):BrushContext {const issue=brushContextIssue();if(issue)throw Error(issue);if(parentId==='')throw Error('Brush destinations need a nonempty layer ID.');const s=useEditor.getState(),nodes=s.doc.pages.find(p=>p.id===s.pageId)!.nodes,scene=indexBrushScene(nodes),parent=parentId===undefined?brushParentAt(scene,position):parentId?scene.lookup.get(parentId):undefined;if(parentId&&!parent)throw Error('The brush destination is missing.');const space=brushParentSpace(scene,parent?.id??null),preset=useBrushLibrary.getState().settings;validateBrushPreset(preset);if(activeBrushContext)activeBrushContext.valid=false;const context:BrushContext={editor:captureColorContext(s),zoom:s.zoom,pan:{...s.pan},uiScale:getPreferences().uiScale,preset,parentId:parent?.id??null,groupId:crypto.randomUUID(),scene,parentInverse:space.inverse,parentOrigin:space.origin,valid:true};activeBrushContext=context;return context;}
export function sameBrushContext(c:BrushContext){const s=useEditor.getState();return c.valid&&activeBrushContext===c&&!brushContextIssue()&&sameColorContext(c.editor,s)&&s.zoom===c.zoom&&s.pan.x===c.pan.x&&s.pan.y===c.pan.y&&getPreferences().uiScale===c.uiScale&&useBrushLibrary.getState().settings===c.preset;}
export function brushSampleInParent(c:BrushContext,p:{x:number;y:number},pressure:number):BrushSample{const local=point(c.parentInverse,p.x,p.y);return {x:local.x+c.parentOrigin.x,y:local.y+c.parentOrigin.y,pressure};}
export function brushDrawingPlan(c:BrushContext,samples:readonly BrushSample[]){if(!sameBrushContext(c))throw Error('The brush drawing context changed. Start a new stroke.');const nodes=c.scene.nodes;brushParentSpace(c.scene,c.parentId);if(c.parentId&&c.scene.entries.get(c.parentId)!.depth>62)throw Error('Brush destinations support at most 62 container levels, leaving two levels for the stroke group and stamps.');const additions=materializeBrush(samples,c.preset,c.groupId,c.parentId);if(nodes.length+additions.length>20000)throw Error('The brush stroke would exceed 20,000 page layers.');if(additions.some(n=>c.scene.ids.has(n.id)))throw Error('The brush stroke ID is already used.');const next=[...nodes,...additions];validateDocumentProgressiveBlur({...c.editor.doc,pages:c.editor.doc.pages.map(p=>p.id===c.editor.pageId?{...p,nodes:next}:p)});return {nodes:next,additions};}
export function commitBrushDrawing(c:BrushContext,samples:readonly BrushSample[]){const plan=brushDrawingPlan(c,samples),candidate=structuredClone(c.editor.doc);candidate.pages.find(p=>p.id===c.editor.pageId)!.nodes=plan.nodes;parseDocument(JSON.stringify(candidate));const expected=JSON.stringify(plan.additions),before=JSON.stringify(c.editor.doc.pages.find(p=>p.id===c.editor.pageId)!.nodes),s=useEditor.getState();s.edit(doc=>{doc.pages.find(p=>p.id===c.editor.pageId)!.nodes.push(...structuredClone(plan.additions));},doc=>{const nodes=doc.pages.find(p=>p.id===c.editor.pageId)!.nodes,ids=new Set(plan.additions.map(n=>n.id));if(JSON.stringify(nodes.filter(n=>ids.has(n.id)))!==expected||JSON.stringify(nodes.filter(n=>!ids.has(n.id)))!==before)throw Error('A layout or component controller changed the brush stroke. Draw in an ordinary container instead.');});c.valid=false;useEditor.getState().set({selection:[c.groupId],tool:getPreferences().keepDrawingTool?'brush':'move'});return c.groupId;}

export function subscribeBrushModes(listener:()=>void){const off=[useMaskView,useCanvasImageCrop,useCanvasGradient,useVectorBend,useVectorCut,useVectorEraser,useMultiVector,useVectorLasso,useWidthView].map(v=>v.subscribe(listener));return()=>off.forEach(stop=>stop());}
const invalidateBrush=()=>{const c=activeBrushContext;if(c&&!sameBrushContext(c)){c.valid=false;activeBrushContext=null;}};useEditor.subscribe(invalidateBrush);useBrushLibrary.subscribe(invalidateBrush);subscribePreferences(invalidateBrush);subscribeBrushModes(invalidateBrush);
