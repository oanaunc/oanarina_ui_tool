import type {DesignDocument,DesignNode} from './model';
import {parseDocument} from './model';
import {fillsFor,strokesFor} from './paints';
import {detachEditedBindings} from './design-systems';

const hex=(color:unknown):color is string=>typeof color==='string'&&/^#[a-f\d]{6}$/i.test(color);
/** Linear closure/ancestry analysis; selected containers include their descendants once. */
export function colorSelection(nodes:DesignNode[],ids:readonly string[]){
 const byId=new Map(nodes.map(n=>[n.id,n])),children=new Map<string,string[]>(),chosen=new Set<string>(),queue=[...ids];
 for(const n of nodes)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n.id);children.set(n.parentId,list);}
 for(let i=0;i<queue.length;i++){const id=queue[i];if(chosen.has(id)||!byId.has(id))continue;chosen.add(id);queue.push(...children.get(id)??[]);}
 const flags=new Map<string,boolean>();
 const locked=(n:DesignNode)=>{const trail:DesignNode[]=[],seen=new Set<string>();let p:DesignNode|undefined=n;while(p&&!flags.has(p.id)&&!seen.has(p.id)){trail.push(p);seen.add(p.id);p=byId.get(p.parentId??'');}let value=p?(flags.get(p.id)??true):false;for(const n of trail.reverse()){value=value||n.locked;flags.set(n.id,value);}return flags.get(n.id)!;};
 return nodes.filter(n=>chosen.has(n.id)).map(n=>({node:n,locked:locked(n)}));
}
/** Visible fill/gradient/stroke/text-range RGB values, independent of layer opacity. */
export function nodeColors(n:DesignNode){
 const out:string[]=[];
 const paint=(p:ReturnType<typeof fillsFor>[number])=>{if(!p.visible)return;if(p.type==='solid'&&hex(p.color))out.push(p.color.toLowerCase());else if(['linear','radial','angular','diamond'].includes(p.type))for(const s of p.stops)if(hex(s.color))out.push(s.color.toLowerCase());};
 // Slices are export regions and have no rendered surface.
 if(n.type!=='slice'){fillsFor(n).forEach(paint);strokesFor(n).filter(s=>s.visible&&s.width>0).forEach(s=>paint(s.paint));}
 if(n.type==='text')for(const r of n.textRuns??[])if(hex(r.fill))out.push(r.fill.toLowerCase());
 return out;
}
export interface SelectionColor {color:string;uses:number;layers:number;lockedLayers:number;}
export function selectionColors(nodes:DesignNode[],ids:readonly string[]){const colors=new Map<string,SelectionColor>();for(const {node,locked} of colorSelection(nodes,ids)){const seen=new Set<string>();for(const color of nodeColors(node)){let item=colors.get(color);if(!item){item={color,uses:0,layers:0,lockedLayers:0};colors.set(color,item);}item.uses++;if(!seen.has(color)){item.layers++;if(locked)item.lockedLayers++;seen.add(color);}}}return [...colors.values()].sort((a,b)=>b.layers-a.layers||a.color.localeCompare(b.color));}
export interface ColorReplacementPlan {pageId:string;expected:Map<string,Partial<DesignNode>>;changed:number;skipped:number;}
export function replaceSelectionColor(doc:DesignDocument,pageId:string,ids:readonly string[],before:string,after:string):ColorReplacementPlan{
 if(!hex(before)||!hex(after))throw Error('Choose a valid RGB color.');before=before.toLowerCase();after=after.toLowerCase();const page=doc.pages.find(p=>p.id===pageId);const available=new Set(page?.nodes.map(n=>n.id)??[]);if(!page||!ids.length||ids.length>20000||ids.some(id=>!available.has(id)))throw Error('Select existing layers on this page.');
 const expected=new Map<string,Partial<DesignNode>>();let skipped=0;
 for(const {node:n,locked} of colorSelection(page.nodes,ids)){
  if(!nodeColors(n).includes(before))continue;if(locked){skipped++;continue;}if(before===after)continue;
  const oldPaints=fillsFor(n),oldStrokes=strokesFor(n),paints=structuredClone(oldPaints),strokes=structuredClone(oldStrokes);
  const change=(p:typeof paints[number])=>{if(!p.visible)return;if(p.type==='solid'&&p.color.toLowerCase()===before)p.color=after;else if(['linear','radial','angular','diamond'].includes(p.type))for(const stop of p.stops)if(stop.color.toLowerCase()===before)stop.color=after;};
  paints.forEach(change);strokes.filter(s=>s.visible&&s.width>0).forEach(s=>change(s.paint));
  const patch:Partial<DesignNode>={};
  if(JSON.stringify(paints)!==JSON.stringify(oldPaints)){patch.paints=paints;if(paints[0]?.type==='solid'&&paints[0].color!==oldPaints[0]?.color)patch.fill=paints[0].color;}
  if(JSON.stringify(strokes)!==JSON.stringify(oldStrokes)){patch.strokes=strokes;if(strokes[0]?.paint.type==='solid'&&strokes[0].paint.color!==oldStrokes[0]?.paint.color)patch.stroke=strokes[0].paint.color;}
  const runs=n.textRuns?.map(r=>r.fill?.toLowerCase()===before?{...r,fill:after}:r);if(JSON.stringify(runs)!==JSON.stringify(n.textRuns))patch.textRuns=runs;
  if(!Object.keys(patch).length)continue;
  detachEditedBindings(n,patch);Object.assign(n,patch);expected.set(n.id,structuredClone(patch));
 }
 return {pageId,expected,changed:expected.size,skipped};
}
export function validateColorReplacement(doc:DesignDocument,plan:ColorReplacementPlan){const nodes=new Map((doc.pages.find(p=>p.id===plan.pageId)?.nodes??[]).map(n=>[n.id,n]));for(const [id,patch] of plan.expected){const n=nodes.get(id);if(!n||Object.entries(patch).some(([key,value])=>JSON.stringify(n[key as keyof DesignNode])!==JSON.stringify(value)))throw Error('A managed color would overwrite this change. Edit its component property or workspace control.');}const raw=JSON.stringify(doc);if(new TextEncoder().encode(raw).length>=50_000_000)throw Error('The changed project exceeds the saved-file limit.');parseDocument(raw);}
