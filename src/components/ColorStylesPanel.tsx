import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,Check,Plus,Search,SlidersHorizontal} from 'lucide-react';
import ColorPicker from './ColorPicker';
import {deleteStyle,nextStyleName,renameStyle,setStyleColor,styleEditing,stylePaint,styleFolder,styleIsSolid,swatchBackground} from '../color-styles';
import {assignSelectedStyle,createSelectedStyle,validateDesignAssignment} from '../design-system-actions';
import type {AssignmentResult} from '../design-system-actions';
import {notifyError} from '../files';
import {disabledLibraryDefinitions} from '../library-lifecycle';
import type {DesignDocument,DesignNode} from '../model';
import {useEditor} from '../store';
type View={kind:'list'}|{kind:'create'}|{kind:'edit';id:string};
/** The saved side of the color panel: find a style, apply it, save the current fill as a new one, or change one everywhere it is used. */
export default function ColorStylesPanel({n,create=false,onDone}:{n:DesignNode;create?:boolean;onDone?:()=>void}){
 const s=useEditor(),[view,show]=useState<View>(create?{kind:'create'}:styleEditing.id?{kind:'edit',id:styleEditing.id}:{kind:'list'}),setView=(next:View)=>{styleEditing.id=next.kind==='edit'?next.id:'';show(next);},[query,setQuery]=useState(''),[name,setName]=useState(()=>nextStyleName(s.doc.styles?.filter(v=>v.type==='paint'))),[description,setDescription]=useState(''),field=useRef<HTMLInputElement>(null);
 const disabled=useMemo(()=>disabledLibraryDefinitions(s.doc).styles,[s.doc.componentLibraries]),linked=n.styleIds?.paint,all=(s.doc.styles??[]).filter(v=>v.type==='paint'&&(!disabled.has(v.id)||v.id===linked)),q=query.trim().toLowerCase(),shown=all.filter(v=>(v.name+' '+v.description).toLowerCase().includes(q));
 useLayoutEffect(()=>{if(view.kind==='create'){field.current?.focus();field.current?.select();}},[view.kind]);
 const assign=(fn:(d:DesignDocument)=>AssignmentResult)=>{try{const live=useEditor.getState();if(live.motionOpen)throw Error('Close Motion before changing styles.');let result:AssignmentResult;live.edit(d=>{result=fn(d);},d=>validateDesignAssignment(d,result));return result!;}catch(e){notifyError(e);return undefined;}};
 const edit=(fn:(d:DesignDocument)=>void)=>{try{useEditor.getState().edit(fn);return true;}catch(e){notifyError(e);return false;}};
 const save=()=>{const clean=name.trim();if(!clean){notifyError(Error('Give the style a name.'));return;}const live=useEditor.getState();if(!assign(d=>{const made=createSelectedStyle(d,live.pageId,live.selection,n.id,'paint');d.styles!.find(v=>v.id===made.id)!.name=clean;if(description.trim())d.styles!.find(v=>v.id===made.id)!.description=description.trim();return made;}))return;setQuery('');setDescription('');setView({kind:'list'});onDone?.();};
 if(view.kind==='create')return <form className="color-styles" aria-label="Create color style" onSubmit={e=>{e.preventDefault();save();}}>
  <div className="color-styles-title"><button type="button" aria-label="Back to color styles" title="Back" onClick={()=>setView({kind:'list'})}><ArrowLeft size={13}/></button><strong>New color style</strong></div>
  <label className="color-style-field"><span>Name</span><input ref={field} aria-label="Style name" value={name} maxLength={512} onChange={e=>setName(e.target.value)}/></label>
  <label className="color-style-field"><span>Description</span><input aria-label="Style description" value={description} maxLength={4096} onChange={e=>setDescription(e.target.value)}/></label>
  <div className="color-style-preview"><i style={{background:swatchBackground({value:{fill:n.fill,paints:n.paints}})}}/><span>Uses this layer’s fill</span></div>
  <button type="submit" className="color-style-primary">Create style</button><small>Use a slash in the name to make a folder, like Brand/Olive.</small>
 </form>;
 if(view.kind==='edit'){const style=all.find(v=>v.id===view.id);if(!style){setView({kind:'list'});return null;}const paint=stylePaint(style),count=s.doc.pages.flatMap(p=>p.nodes).filter(v=>v.styleIds?.paint===style.id).length;return <div className="color-styles" role="group" aria-label={'Edit style '+style.name}>
  <div className="color-styles-title"><button type="button" aria-label="Back to color styles" title="Back" onClick={()=>setView({kind:'list'})}><ArrowLeft size={13}/></button><strong>Edit style</strong></div>
  <label className="color-style-field"><span>Name</span><input key={style.name} aria-label="Style name" defaultValue={style.name} maxLength={512} onBlur={e=>{if(e.target.value!==style.name&&!edit(d=>renameStyle(d,style.id,e.target.value)))e.target.value=style.name;}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>
  <label className="color-style-field"><span>Description</span><input key={style.description} aria-label="Style description" defaultValue={style.description} maxLength={4096} onBlur={e=>{if(e.target.value!==style.description)edit(d=>renameStyle(d,style.id,style.name,e.target.value));}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>
  {styleIsSolid(style)?<ColorPicker inline prefix={'Style '+style.name} color={paint.color} opacity={paint.opacity} onChange={(color,alpha)=>{if(!edit(d=>setStyleColor(d,style.id,color,alpha??paint.opacity)))throw Error('This style could not be changed.');}}/>:<p className="inspector-note">This style holds more than one color. Change it in Manage styles.</p>}
  <p className="inspector-note">{count===1?'Used by 1 layer.':`Used by ${count} layers.`} Changes reach all of them.</p>
  <div className="button-row"><button type="button" className="text-button" onClick={()=>{if(edit(d=>deleteStyle(d,style.id)))setView({kind:'list'});}}>Delete style</button></div>
 </div>;}
 let last='';
 return <div className="color-styles" role="group" aria-label="Color styles">
  <div className="color-styles-search"><Search size={12}/><input aria-label="Search color styles" placeholder="Search styles" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" aria-label="Create color style" title="Create a style from this fill" onClick={()=>{setName(nextStyleName(all));setView({kind:'create'});}}><Plus size={14}/></button></div>
  {all.length===0?<div className="color-styles-empty"><p>No color styles yet. Save this fill to use it on other layers.</p><button type="button" className="color-style-primary" onClick={()=>setView({kind:'create'})}>Save this color</button></div>:shown.length===0?<p className="color-styles-empty">No styles match.</p>:<div className="color-style-list" role="list">{shown.map(style=>{const {folder,label}=styleFolder(style.name),head=folder!==last&&folder?<div className="color-style-folder">{folder}</div>:null;last=folder;return <div key={style.id} role="listitem">{head}<div className={'color-style-row'+(linked===style.id?' active':'')}><button type="button" className="color-style-apply" aria-label={'Apply style '+style.name} aria-pressed={linked===style.id} title={style.description||style.name} onClick={()=>{const live=useEditor.getState();assign(d=>assignSelectedStyle(d,live.pageId,live.selection,'paint',style.id));}}><i style={{background:swatchBackground(style)}}/><span>{label}</span>{linked===style.id&&<Check size={12}/>}</button><button type="button" className="color-style-edit" aria-label={'Edit style '+style.name} title="Edit style" onClick={()=>setView({kind:'edit',id:style.id})}><SlidersHorizontal size={12}/></button></div></div>;})}</div>}
 </div>;
}
