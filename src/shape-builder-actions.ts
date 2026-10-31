import {editWithOwnedDelivery} from './owned-edit-delivery';
import {create} from 'zustand';
import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {getPreferences,subscribePreferences} from './preferences';
import {prepareShapeBuilder,shapeBuilderOutput,applyShapeBuilder} from './shape-builder';
import type {ShapeBuilderPlan,BuilderOperation} from './shape-builder';
import {useMaskView} from './mask-view';
import {useCanvasGradient} from './canvas-gradient';
import {useCanvasImageCrop} from './canvas-image-crop';
import {useVectorBend} from './vector-bend';
import {useVectorCut} from './vector-cut';
import {useVectorEraser} from './vector-eraser';
import {useVectorLasso} from './vector-lasso';
import {useMultiVector} from './multi-vector';
import {useWidthView} from './variable-width-actions';
import {useNetworkView} from './vector-network-actions';
import {identity,multiply,nodeMatrix} from './transforms';
const modes=[useCanvasGradient,useCanvasImageCrop,useVectorBend,useVectorCut,useVectorEraser,useVectorLasso,useMultiVector,useWidthView,useNetworkView];
const localModes=()=>[useMaskView.getState().preview,useMaskView.getState().outlines,...modes.map(store=>store.getState().context)];
let builderEpoch=0;
export interface BuilderProof{epoch:number;editor:ColorEditContext;tool:string;zoom:number;pan:{x:number;y:number};scale:number;vectorEditId:string|null;outlines:boolean;modes:unknown[];valid:boolean;}
export function builderProof():BuilderProof{const s=useEditor.getState();return {epoch:builderEpoch,editor:captureColorContext(s),tool:s.tool,zoom:s.zoom,pan:{...s.pan},scale:getPreferences().uiScale,vectorEditId:s.vectorEditId,outlines:s.outlines,modes:localModes(),valid:true};}
export function sameBuilderProof(p:BuilderProof){const s=useEditor.getState(),current=localModes();return p.valid&&p.epoch===builderEpoch&&sameColorContext(p.editor,s)&&p.tool===s.tool&&p.zoom===s.zoom&&p.pan.x===s.pan.x&&p.pan.y===s.pan.y&&p.scale===getPreferences().uiScale&&p.vectorEditId===s.vectorEditId&&p.outlines===s.outlines&&p.modes.every((v,i)=>v===current[i]);}
export function builderTarget(p:BuilderProof){const s=useEditor.getState();if(typeof document!=='undefined'&&document.hidden||!sameBuilderProof(p)||s.mode!=='design'||s.home||s.modal||s.uiHidden||s.motionOpen||s.outlines||!['move','scale'].includes(s.tool))throw Error('Open Shape builder again on the visible Design canvas with Motion closed.');return prepareShapeBuilder(s.doc,s.pageId,s.selection);}
export interface BuilderContext{proof:BuilderProof;plan:ShapeBuilderPlan;operation:BuilderOperation;regions:number[];valid:boolean;}
export function sameBuilderContext(c:BuilderContext){return c.valid&&sameBuilderProof(c.proof)&&c.proof.modes.every(v=>!v)&&!useEditor.getState().vectorEditId;}
interface BuilderView{context:BuilderContext|null;activate:(proof:BuilderProof)=>void;reset:()=>void;choose:(context:BuilderContext,regions:number[],operation?:BuilderOperation)=>void;operation:(context:BuilderContext,value:BuilderOperation)=>void;}
function current(c:BuilderContext){if(useShapeBuilder.getState().context!==c||!sameBuilderContext(c))throw Error('The Shape builder session changed. Start again.');builderTarget(c.proof);}
function renew(c:BuilderContext,patch:Partial<BuilderContext>){c.valid=false;builderEpoch++;return {...c,...patch,proof:builderProof(),valid:true};}
export const useShapeBuilder=create<BuilderView>((set,get)=>({context:null,activate:proof=>{const plan=builderTarget(proof);for(const mode of modes)mode.getState().reset();useMaskView.getState().reset();useEditor.getState().set({vectorEditId:null,vectorSelection:[]});const st=useEditor.getState();if(!sameColorContext(proof.editor,st)||proof.tool!==st.tool||proof.zoom!==st.zoom||proof.pan.x!==st.pan.x||proof.pan.y!==st.pan.y||proof.scale!==getPreferences().uiScale||proof.outlines!==st.outlines)throw Error('The source changed while opening Shape builder. Try again.');const old=get().context;if(old)old.valid=false;builderEpoch++;set({context:{proof:builderProof(),plan,operation:'merge',regions:[],valid:true}});},reset:()=>{const c=get().context;if(c)c.valid=false;builderEpoch++;set({context:null});},choose:(c,regions,operation=c.operation)=>{current(c);if(!['merge','extract','subtract'].includes(operation)||regions.length>c.plan.arrangement.regions.length||new Set(regions).size!==regions.length||regions.some(id=>!Number.isSafeInteger(id)||!c.plan.arrangement.regions[id]))throw Error('Select existing Shape builder regions.');set({context:renew(c,{regions:[...regions],operation})});},operation:(c,value)=>{current(c);if(!['merge','extract','subtract'].includes(value))throw Error('Choose a supported Shape builder operation.');set({context:renew(c,{operation:value})});}}));
const check=()=>{const c=useShapeBuilder.getState().context;if(c&&!sameBuilderContext(c))useShapeBuilder.getState().reset();};
useEditor.subscribe(check);subscribePreferences(check);useMaskView.subscribe(check);for(const store of modes)store.subscribe(check);
/** A complete candidate is installed only after source/session validation; the store provides one Undo. */
export function commitShapeBuilder(c:BuilderContext){current(c);shapeBuilderOutput(c.plan,c.operation,c.regions);const oldNodes=c.proof.editor.doc.pages.find(p=>p.id===c.plan.pageId)!.nodes,oldMap=new Map(oldNodes.map(n=>[n.id,n])),lineage:string[]=[];let ancestor=c.plan.parentId?oldMap.get(c.plan.parentId):undefined;while(ancestor){lineage.unshift(ancestor.id);ancestor=ancestor.parentId?oldMap.get(ancestor.parentId):undefined;}let outputs:ReturnType<typeof applyShapeBuilder>=[];let expected:[string,string][]=[];
 editWithOwnedDelivery(d=>{outputs=applyShapeBuilder(d,c.plan,c.operation,c.regions);expected=outputs.map(n=>[n.id,JSON.stringify(n)]);},d=>{const nodes=d.pages.find(p=>p.id===c.plan.pageId)!.nodes,map=new Map(nodes.map(n=>[n.id,n]));if(c.plan.sourceIds.some(id=>map.has(id)))throw Error('A controller retained a source layer. Detach it before Shape builder.');for(const [id,value] of expected)if(JSON.stringify(map.get(id))!==value)throw Error('A controller changed the built geometry. No changes were applied.');let matrix=identity;for(const id of lineage){const n=map.get(id);if(!n)throw Error('The common source ancestry changed.');matrix=multiply(matrix,nodeMatrix(n,n.parentId?map.get(n.parentId):undefined));}if(c.plan.parentId){const parent=map.get(c.plan.parentId)!;matrix=multiply(matrix,[1,0,0,1,-parent.x,-parent.y]);}if(JSON.stringify(matrix)!==JSON.stringify(c.plan.matrix))throw Error('A controller moved the common source coordinates. No changes were applied.');},()=>({selection:outputs.map(n=>n.id)}));if(useShapeBuilder.getState().context===c)useShapeBuilder.getState().reset();return outputs.map(n=>n.id);
}

/** Controls observe transitions synchronously, including local-mode away/back cycles. */
export function subscribeBuilderProof(listener:()=>void){const off=[useEditor.subscribe(listener),subscribePreferences(listener),useMaskView.subscribe(listener),useShapeBuilder.subscribe(listener),...modes.map(store=>store.subscribe(listener))];return()=>off.forEach(stop=>stop());}
