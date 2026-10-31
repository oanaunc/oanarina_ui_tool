import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import type {DynamicStroke} from './dynamic-stroke';
import {hasDynamicStroke,validateDocumentDynamicStrokes} from './dynamic-stroke';
import {strokesFor} from './paints';
import {detachEditedBindings} from './design-systems';
import {useMaskView} from './mask-view';
export interface DynamicStrokeProof {origin:ColorEditContext;valid:boolean;}
export function dynamicStrokeProof():DynamicStrokeProof{return {origin:captureColorContext(useEditor.getState()),valid:true};}
export function applyDynamicStroke(proof:DynamicStrokeProof,id:string,value:DynamicStroke|undefined){const s=useEditor.getState(),view=useMaskView.getState();if(!proof.valid||!sameColorContext(proof.origin,s)||s.mode!=='design'||s.home||s.modal||s.uiHidden||s.motionOpen||s.outlines||view.preview||view.outlines||s.doc.workspace&&s.doc.workspace!=='design'||s.selection.length!==1||s.selection[0]!==id)throw Error('Select the current unlocked Design path with Motion and mask inspection closed before changing dynamic strokes.');const page=s.doc.pages.find(p=>p.id===s.pageId)!,lookup=new Map(page.nodes.map(n=>[n.id,n])),n=lookup.get(id);if(!n)throw Error('The dynamic stroke source no longer exists.');let owner= n;const seen=new Set<string>();while(owner){if(seen.has(owner.id)||seen.size>=256)throw Error('Dynamic stroke ancestry exceeds its supported budget.');seen.add(owner.id);if(owner.locked||!owner.visible||owner.instanceRootId||owner.type==='instance'||owner.type==='component')throw Error('Unlock and show the path and its ancestors outside components before changing dynamic strokes.');const parent=owner.parentId?lookup.get(owner.parentId):undefined;if(!parent)break;owner=parent;}
 if(value===undefined&&!hasDynamicStroke(n))return false;
 const strokes=structuredClone(strokesFor(n));if(strokes.length!==1)throw Error('Dynamic strokes require exactly one saved stroke.');if(value===undefined)delete strokes[0].dynamic;else strokes[0].dynamic={...value};if(JSON.stringify(strokes)===JSON.stringify(n.strokes))return false;const candidate={...n,strokes},draft={...s.doc,pages:s.doc.pages.map(p=>p.id===s.pageId?{...p,nodes:p.nodes.map(v=>v.id===id?candidate:v)}:p)};validateDocumentDynamicStrokes(draft);
 s.edit(d=>{const target=d.pages.find(p=>p.id===s.pageId)!.nodes.find(v=>v.id===id)!;const patch={strokes};detachEditedBindings(target,patch);target.strokes=strokes;},d=>{const target=d.pages.find(p=>p.id===s.pageId)?.nodes.find(v=>v.id===id);if(!target||JSON.stringify(target.strokes)!==JSON.stringify(strokes)||JSON.stringify(target.contours)!==JSON.stringify(n.contours))throw Error('A style, binding or derived operation replaced this dynamic stroke. No changes were applied.');});return true;
}
