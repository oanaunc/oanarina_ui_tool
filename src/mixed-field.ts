import type {DesignNode} from './model';
import {useEditor} from './store';
type Field='x'|'y'|'width'|'height'|'rotation';
/** Per-layer edits go through the normal patch path, so children and constraints follow, and count as one Undo. */
export function applyEach(ids:readonly string[],field:Field,change:(current:number,layer:DesignNode)=>number,extra:Partial<DesignNode>={}){
 const start=useEditor.getState(),base=start.past;
 for(const id of ids){const live=useEditor.getState(),n=live.doc.pages.find(p=>p.id===live.pageId)?.nodes.find(v=>v.id===id);if(n)live.patch([id],{[field]:change(n[field],n),...extra});}
 const end=useEditor.getState();if(end.past.length>base.length+1&&base.every((doc,i)=>end.past[i]===doc))useEditor.setState({past:end.past.slice(0,base.length+1)});
}
/** Props for a number field showing a value that several selected layers may not share. `parentOf` lets a typed percentage read each layer's own parent. */
export const mixedField=(sel:DesignNode[],field:Field,extra?:Partial<DesignNode>,parentOf?:(n:DesignNode)=>DesignNode|undefined)=>sel.length>1?{mixed:new Set(sel.map(n=>n[field])).size>1,onEach:(change:(current:number)=>number)=>applyEach(sel.map(n=>n.id),field,change,extra),...(parentOf&&(field==='width'||field==='height')?{onEachPercent:(change:(current:number,base:number|undefined)=>number)=>applyEach(sel.map(n=>n.id),field,(current,n)=>change(current,parentOf(n)?.[field]),extra)}:{})}:{};
