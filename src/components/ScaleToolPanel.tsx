import {useMemo,useState} from 'react';
import {canvasSelectionBounds} from '../canvas-geometry';
import {notifyError} from '../files';
import {isLocked} from '../model';
import type {DesignNode} from '../model';
import {scaleCanvasSelection} from '../scale-tool';
import type {ScaleAnchor} from '../scale-tool';
import {useEditor} from '../store';
import NumberField from './NumberField';
const points=[0,.5,1] as const,names=['top','middle','bottom'],sides=['left','center','right'],round=(v:number)=>Math.round(v*100)/100;
let remembered:ScaleAnchor=[0,0];
/** What the K tool is doing, in numbers: the size and factor follow a drag as it happens, and typing here scales the same way. */
export default function ScaleToolPanel({nodes}:{nodes:DesignNode[]}){
 const s=useEditor(),page=s.doc.pages.find(p=>p.id===s.pageId)!,[anchor,setAnchor]=useState(remembered),start=useMemo(()=>canvasSelectionBounds(page.nodes,s.selection),[page.nodes,s.selection]),box=canvasSelectionBounds(nodes,s.selection),factor=box.width/start.width,locked=s.motionOpen||page.nodes.some(n=>s.selection.includes(n.id)&&isLocked(n,page.nodes));
 const scale=(by:number)=>{try{if(by===1)return;s.edit(d=>{const target=d.pages.find(p=>p.id===s.pageId)!;target.nodes=scaleCanvasSelection(target.nodes,s.selection,by,anchor,target.motion);});}catch(error){notifyError(error);}};
 return <section className="inspector-section scale-tool-panel" aria-label="Scale"><div className="section-title"><span>Scale</span></div><fieldset className="plain-fieldset" disabled={locked}><div className="scale-tool-row"><div className="scale-anchor" role="group" aria-label="Scale from">{points.flatMap((y,row)=>points.map((x,column)=>{const label=row===1&&column===1?'Scale from center':`Scale from ${names[row]} ${sides[column]}`;return <button key={label} type="button" aria-label={label} title={label} aria-pressed={anchor[0]===x&&anchor[1]===y} onClick={()=>{remembered=[x,y];setAnchor(remembered);}}/>;}))}</div><div className="scale-tool-fields"><div className="inspector-row even"><NumberField label="Scaled width" glyph="W" value={round(box.width)} min={.01} onChange={width=>scale(width/box.width)}/><NumberField label="Scaled height" glyph="H" value={round(box.height)} min={.01} onChange={height=>scale(height/box.height)}/></div><div className="inspector-row even"><NumberField key={start.width} label="Scale factor" glyph="×" value={round(factor)} min={.01} step={.1} onChange={scale}/></div></div></div></fieldset></section>;
}
