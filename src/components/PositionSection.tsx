import {AlignCenterHorizontal,AlignCenterVertical,AlignEndHorizontal,AlignEndVertical,AlignHorizontalDistributeCenter,AlignStartHorizontal,AlignStartVertical,AlignVerticalDistributeCenter,FlipHorizontal2,FlipVertical2,Pin,RotateCw} from 'lucide-react';
import {runCommand} from '../commands';
import {notifyError} from '../files';
import {isLocked} from '../model';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {AngleGlyph} from './InspectorParts';
import {ConstraintEditor} from './LayoutEditor';
import NumberField from './NumberField';
const horizontal=[[AlignStartVertical,'left'],[AlignCenterVertical,'center'],[AlignEndVertical,'right']] as const,vertical=[[AlignStartHorizontal,'top'],[AlignCenterHorizontal,'middle'],[AlignEndHorizontal,'bottom']] as const;
export default function PositionSection({n,sel,nodes,parent,origin,patch,patchLayout,layoutLocked}:{n:DesignNode;sel:DesignNode[];nodes:DesignNode[];parent?:DesignNode;origin:{x:number;y:number};patch:(p:Partial<DesignNode>)=>void;patchLayout:(p:Partial<DesignNode>)=>void;layoutLocked:boolean}){
 const s=useEditor(),locked=sel.some(v=>isLocked(v,nodes)),cannotAlign=!sel.length||locked||sel.length===1&&!n.parentId;
 const group=(label:string,items:typeof horizontal|typeof vertical)=><div className="icon-group" role="group" aria-label={label}>{items.map(([Icon,dir])=><button key={dir} disabled={cannotAlign} aria-label={'Align '+dir} title={'Align '+dir} onClick={e=>{try{s.align(dir,e.shiftKey?'parent':'auto');}catch(error){notifyError(error);}}}><Icon size={13}/></button>)}</div>;
 return <section className="inspector-section position-section" aria-label="Position"><div className="section-title"><span>Position</span></div>
  <div className="inspector-row groups">{group('Align horizontally',horizontal)}{group('Align vertically',vertical)}{sel.length>1&&<div className="icon-group" role="group" aria-label="Distribute"><button disabled={sel.length<3} title="Distribute horizontally" aria-label="Distribute horizontally" onClick={()=>runCommand('distribute-x')}><AlignHorizontalDistributeCenter size={13}/></button><button disabled={sel.length<3} title="Distribute vertically" aria-label="Distribute vertically" onClick={()=>runCommand('distribute-y')}><AlignVerticalDistributeCenter size={13}/></button></div>}</div>
  <div className="inspector-row with-tool"><NumberField label="X" value={n.x-origin.x} onChange={x=>patch({x:x+origin.x})}/><NumberField label="Y" value={n.y-origin.y} onChange={y=>patch({y:y+origin.y})}/><fieldset className="plain-fieldset" disabled={layoutLocked}><label className="icon-toggle" title={parent?'Ignore auto layout':'Only layers inside a frame can ignore auto layout'}><input type="checkbox" aria-label="Ignore auto layout" disabled={!parent} checked={n.ignoreLayout??false} onChange={e=>patchLayout({ignoreLayout:e.target.checked})}/><Pin size={12}/></label></fieldset></div>
  <fieldset className="plain-fieldset" disabled={layoutLocked}><ConstraintEditor n={n} parent={parent} patch={patchLayout}/></fieldset>
  <div className="inspector-row rotation-row"><NumberField label="Rotation" glyph={<AngleGlyph/>} suffix="°" value={n.rotation} onChange={rotation=>patch({rotation})}/><div className="icon-group" role="group" aria-label="Rotate and flip"><button disabled={locked} aria-label="Rotate 90° right" title="Rotate 90° right" onClick={()=>runCommand('rotate-right')}><RotateCw size={13}/></button><button disabled={locked} aria-label="Flip horizontal" title="Flip horizontal" onClick={()=>runCommand('flip-x')}><FlipHorizontal2 size={13}/></button><button disabled={locked} aria-label="Flip vertical" title="Flip vertical" onClick={()=>runCommand('flip-y')}><FlipVertical2 size={13}/></button></div></div>
 </section>;
}
