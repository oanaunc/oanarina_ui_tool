import {runCommand} from './commands';
import {useEditor} from './store';
import {useBrushLibrary} from './brush-library';
import {useVectorBend} from './vector-bend';
import {useVectorCut} from './vector-cut';
import {useVectorEraser} from './vector-eraser';
import {useVectorLasso} from './vector-lasso';
import {builderProof,useShapeBuilder} from './shape-builder-actions';

export type VectorToolKind='bend'|'cut'|'eraser'|'lasso';
const vectorTools:Record<VectorToolKind,{getState:()=>{activate:(id:string)=>void;reset:()=>void}}>={bend:useVectorBend,cut:useVectorCut,eraser:useVectorEraser,lasso:useVectorLasso};
const focusCanvas=()=>{if(typeof document!=='undefined')document.querySelector<SVGSVGElement>('#forma-design-canvas')?.focus({preventScroll:true});};
/** The inspector's canvas tools need point editing and the Move tool; this reaches them in one step from a drawing tool. */
export function startVectorTool(kind:VectorToolKind){if(!Object.hasOwn(vectorTools,kind))throw Error('Choose an available illustration tool.');const s=useEditor.getState(),id=s.vectorEditId??(s.selection.length===1?s.selection[0]:'');if(!id)throw Error('Select one vector, then choose a drawing tool.');if(s.home||s.modal||s.uiHidden||s.motionOpen||s.mode!=='design')throw Error('Open the Design canvas with Motion closed to use drawing tools.');s.set({tool:'move'});if(!useEditor.getState().vectorEditId)runCommand('edit-vector');if(useEditor.getState().vectorEditId!==id)return false;for(const view of Object.values(vectorTools))view.getState().reset();vectorTools[kind].getState().activate(id);focusCanvas();return true;}
export function editVectorPoints(){const s=useEditor.getState();if(s.vectorEditId)return true;if(s.selection.length!==1)throw Error('Select one vector, then choose a drawing tool.');s.set({tool:'move'});runCommand('edit-vector');return !!useEditor.getState().vectorEditId;}
/** Shape builder reads the live selection, so a refusal here leaves the current tool and document alone. */
export function startShapeBuilder(){const s=useEditor.getState(),tool=s.tool;if(s.selection.length<2)throw Error('Select two or more overlapping shapes for Shape builder.');s.set({tool:'move'});try{useShapeBuilder.getState().activate(builderProof());}catch(error){useEditor.getState().set({tool});throw error;}focusCanvas();}
export function chooseBrushPreset(id:string){useBrushLibrary.getState().choose(id);runCommand('tool-brush');}
