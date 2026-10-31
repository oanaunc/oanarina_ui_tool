import {ArrowDown,ArrowRight,Grid2X2,Maximize2,MoveHorizontal,MoveVertical,Plus,Square} from 'lucide-react';
import {containers} from '../model';
import type {DesignNode} from '../model';
import AspectLockControl from './AspectLockControl';
import {IconSegments} from './InspectorParts';
import {AdvancedLayoutEditor,SizingEditor} from './LayoutEditor';
import NumberField from './NumberField';
/** W and H sit outside the locked fieldset, because Motion keyframes them while the layout settings stay closed. */
export default function LayoutSection({n,parent,patch,patchLayout,layoutLocked}:{n:DesignNode;parent?:DesignNode;patch:(p:Partial<DesignNode>)=>void;patchLayout:(p:Partial<DesignNode>)=>void;layoutLocked:boolean}){
 const container=containers.includes(n.type);
 return <section className="inspector-section layout-section" aria-label="Layout"><div className="section-title"><span>Layout</span>{container&&<fieldset className="plain-fieldset" disabled={layoutLocked}><button title="Auto layout direction" onClick={()=>patchLayout({layout:n.layout==='none'?'horizontal':'none'})}><Plus size={14}/></button></fieldset>}</div>
  {n.type==='text'&&<IconSegments label="Text resizing" value={n.textResize??'fixed'} onChange={value=>patch({textResize:value as DesignNode['textResize']})} options={[['auto-width','Auto width',<MoveHorizontal size={13}/>],['auto-height','Auto height',<MoveVertical size={13}/>],['fixed','Fixed size',<Maximize2 size={12}/>]]}/>}
  {container&&<fieldset className="plain-fieldset" disabled={layoutLocked}><IconSegments label="Layout flow" value={n.layout} onChange={value=>patchLayout({layout:value as DesignNode['layout'],...(value==='grid'?{wrap:false}:{})})} options={[['none','Free',<Square size={12}/>],['horizontal','Row',<ArrowRight size={13}/>],['vertical','Stack',<ArrowDown size={13}/>],['grid','Grid',<Grid2X2 size={12}/>]]}/></fieldset>}
  <div className="inspector-row with-tool"><NumberField label="W" value={n.width} min={1} onChange={width=>patch({width,sizingX:'fixed'})}/><NumberField label="H" value={n.height} min={1} onChange={height=>patch({height,sizingY:'fixed'})}/><fieldset className="plain-fieldset" disabled={layoutLocked}><AspectLockControl n={n} patch={patchLayout}/></fieldset></div>
  {container&&<label className="check-row"><input type="checkbox" checked={n.clip} onChange={e=>patch({clip:e.target.checked})}/>Clip content</label>}
  <fieldset className="plain-fieldset" disabled={layoutLocked}>{layoutLocked&&container&&<p className="inspector-note">Close Motion and unlock this hierarchy to edit layout. Managed layers use their main component.</p>}<SizingEditor key={n.id} n={n} parent={parent} patch={patchLayout}/>{container&&n.layout!=='none'&&<AdvancedLayoutEditor n={n} patch={patchLayout}/>}</fieldset>
 </section>;
}
