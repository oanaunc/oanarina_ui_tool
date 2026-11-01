import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,Check,Plus,Search,SlidersHorizontal} from 'lucide-react';
import ColorPicker from './ColorPicker';
import {deleteStyle,nextStyleName,renameStyle,setStyleColor,setStylePaint,styleEditable,styleEditing,styleFills,stylePaint,styleFolder,styleIsSolid,swatchBackground} from '../color-styles';
import {assignSelectedStyle,assignStrokePaintStyle,createSelectedStrokeStyle,createSelectedStyle,validateDesignAssignment} from '../design-system-actions';
import type {AssignmentResult} from '../design-system-actions';
import {notifyError} from '../files';
import {disabledLibraryDefinitions} from '../library-lifecycle';
import type {DesignDocument,DesignNode} from '../model';
import {strokesFor} from '../paints';
import type {Paint} from '../paints';
import {useEditor} from '../store';
import {PaintControls,PaintTypeSelect} from './PaintEditor';
type View={kind:'list'}|{kind:'create'}|{kind:'edit';id:string};
const styleKinds=['solid','linear','radial','angular','diamond'];
/** The saved side of the color panel: find a style, apply it, save the current fill or stroke as a new one, or change one everywhere it is used. */
export default function ColorStylesPanel({n,create=false,onDone,role='fill'}:{n:DesignNode;create?:boolean;onDone?:()=>void;role?:'fill'|'stroke'}){
 const s=useEditor(),[view,show]=useState<View>(create?{kind:'create'}:styleEditing.id?{kind:'edit',id:styleEditing.id}:{kind:'list'}),setView=(next:View)=>{styleEditing.id=next.kind==='edit'?next.id:'';show(next);},[query,setQuery]=useState(''),[name,setName]=useState(()=>nextStyleName(s.doc.styles?.filter(v=>v.type==='paint'))),[description,setDescription]=useState(''),field=useRef<HTMLInputElement>(null);
 const disabled=useMemo(()=>disabledLibraryDefinitions(s.doc).styles,[s.doc.componentLibraries]),linked=role==='stroke'?n.styleIds?.strokePaint:n.styleIds?.paint,noun=role==='stroke'?'stroke':'fill',all=(s.doc.styles??[]).filter(v=>v.type==='paint'&&(!disabled.has(v.id)||v.id===linked)),q=query.trim().toLowerCase(),shown=all.filter(v=>(v.name+' '+v.description).toLowerCase().includes(q));
 useLayoutEffect(()=>{if(view.kind==='create'){field.current?.focus();field.current?.select();}},[view.kind]);
 const assign=(fn:(d:DesignDocument)=>AssignmentResult)=>{try{const live=useEditor.getState();if(live.motionOpen)throw Error('Close Motion before changing styles.');let result:AssignmentResult;live.edit(d=>{result=fn(d);},d=>validateDesignAssignment(d,result));return result!;}catch(e){notifyError(e);return undefined;}};
 const edit=(fn:(d:DesignDocument)=>void)=>{try{useEditor.getState().edit(fn);return true;}catch(e){notifyError(e);return false;}};
 const save=()=>{const clean=name.trim();if(!clean){notifyError(Error('Give the style a name.'));return;}const live=useEditor.getState();if(!assign(d=>{const made=role==='stroke'?createSelectedStrokeStyle(d,live.pageId,live.selection,n.id):createSelectedStyle(d,live.pageId,live.selection,n.id,'paint');d.styles!.find(v=>v.id===made.id)!.name=clean;if(description.trim())d.styles!.find(v=>v.id===made.id)!.description=description.trim();return made;}))return;setQuery('');setDescription('');setView({kind:'list'});onDone?.();};
 if(view.kind==='create')return <form className="color-styles" aria-label="Create color style" onSubmit={e=>{e.preventDefault();save();}}>
  <div className="color-styles-title"><button type="button" aria-label="Back to color styles" title="Back" onClick={()=>setView({kind:'list'})}><ArrowLeft size={13}/></button><strong>New color style</strong></div>
  <label className="color-style-field"><span>Name</span><input ref={field} aria-label="Style name" value={name} maxLength={512} onChange={e=>setName(e.target.value)}/></label>
  <label className="color-style-field"><span>Description</span><input aria-label="Style description" value={description} maxLength={4096} onChange={e=>setDescription(e.target.value)}/></label>
  <div className="color-style-preview"><i style={{background:swatchBackground({value:role==='stroke'?{paints:strokesFor(n).slice(0,1).map(v=>v.paint)}:{fill:n.fill,paints:n.paints}})}}/><span>Uses this layer’s {noun}</span></div>
  <button type="submit" className="color-style-primary">Create style</button><small>Use a slash in the name to make a folder, like Brand/Olive.</small>
 </form>;
 if(view.kind==='edit'){const style=all.find(v=>v.id===view.id);if(!style){setView({kind:'list'});return null;}const paint=stylePaint(style),count=s.doc.pages.flatMap(p=>p.nodes).filter(v=>v.styleIds?.paint===style.id||v.styleIds?.strokePaint===style.id).length,change=(patch:Partial<Paint>)=>{edit(d=>setStylePaint(d,style.id,patch));};return <div className="color-styles" role="group" aria-label={'Edit style '+style.name}>
  <div className="color-styles-title"><button type="button" aria-label="Back to color styles" title="Back" onClick={()=>setView({kind:'list'})}><ArrowLeft size={13}/></button><strong>Edit style</strong></div>
  <label className="color-style-field"><span>Name</span><input key={style.name} aria-label="Style name" defaultValue={style.name} maxLength={512} onBlur={e=>{if(e.target.value!==style.name&&!edit(d=>renameStyle(d,style.id,e.target.value)))e.target.value=style.name;}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>
  <label className="color-style-field"><span>Description</span><input key={style.description} aria-label="Style description" defaultValue={style.description} maxLength={4096} onBlur={e=>{if(e.target.value!==style.description)edit(d=>renameStyle(d,style.id,style.name,e.target.value));}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>
  {styleEditable(style)?<><PaintTypeSelect paint={styleFills(style)[0]} n={n} prefix={'Style '+style.name} kinds={styleKinds} onChange={change}/>{styleIsSolid(style)?<ColorPicker inline prefix={'Style '+style.name} color={paint.color} opacity={paint.opacity} onChange={(color,alpha)=>{if(!edit(d=>setStyleColor(d,style.id,color,alpha??paint.opacity)))throw Error('This style could not be changed.');}}/>:<PaintControls n={n} fill handles={false} prefix={'Style '+style.name} paint={styleFills(style)[0]} onChange={change}/>}</>:<p className="inspector-note">This style holds more than one color. Change it in Manage styles.</p>}
  <p className="inspector-note">{count===1?'Used by 1 layer.':`Used by ${count} layers.`} Changes reach all of them.</p>
  <div className="button-row"><button type="button" className="text-button" onClick={()=>{if(edit(d=>deleteStyle(d,style.id)))setView({kind:'list'});}}>Delete style</button></div>
 </div>;}
 let last='';
 return <div className="color-styles" role="group" aria-label="Color styles">
  <div className="color-styles-search"><Search size={12}/><input aria-label="Search color styles" placeholder="Search styles" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" aria-label="Create color style" title={'Create a style from this '+noun} onClick={()=>{setName(nextStyleName(all));setView({kind:'create'});}}><Plus size={14}/></button></div>
  {all.length===0?<div className="color-styles-empty"><p>No color styles yet. Save this {noun} to use it on other layers.</p><button type="button" className="color-style-primary" onClick={()=>setView({kind:'create'})}>Save this color</button></div>:shown.length===0?<p className="color-styles-empty">No styles match.</p>:<div className="color-style-list" role="list">{shown.map(style=>{const {folder,label}=styleFolder(style.name),head=folder!==last&&folder?<div className="color-style-folder">{folder}</div>:null;last=folder;return <div key={style.id} role="listitem">{head}<div className={'color-style-row'+(linked===style.id?' active':'')}><button type="button" className="color-style-apply" aria-label={'Apply style '+style.name} aria-pressed={linked===style.id} title={style.description||style.name} onClick={()=>{const live=useEditor.getState();assign(d=>role==='stroke'?assignStrokePaintStyle(d,live.pageId,live.selection,style.id):assignSelectedStyle(d,live.pageId,live.selection,'paint',style.id));}}><i style={{background:swatchBackground(style)}}/><span>{label}</span>{linked===style.id&&<Check size={12}/>}</button><button type="button" className="color-style-edit" aria-label={'Edit style '+style.name} title="Edit style" onClick={()=>setView({kind:'edit',id:style.id})}><SlidersHorizontal size={12}/></button></div></div>;})}</div>}
 </div>;
}
