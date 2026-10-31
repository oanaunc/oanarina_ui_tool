import {useLayoutEffect,useRef,useState} from 'react';
import type {CSSProperties,RefObject} from 'react';
import {canvasListKey} from '../list-editing';
import {canvasFormatKey} from '../text-format-keys';
import {smartCanvasInput} from '../smart-text';
import {textEditorColor,textEditPatch} from '../text-defaults';
import {displayColor} from '../color-profile';
import {getPreferences} from '../preferences';
import {useEditor} from '../store';
import type {DesignNode} from '../model';
import './canvas-text-editor.css';
export type TextEntry='select'|'end';
/** Words appear where they will land: the editor takes the layer's own type, and the painted layer steps aside while it is open. */
export default function CanvasTextEditor({n,style,entry,canvas,onClose}:{n:DesignNode;style:CSSProperties;entry:RefObject<TextEntry>;canvas:RefObject<SVGSVGElement|null>;onClose:()=>void}){
 const s=useEditor(),field=useRef<HTMLTextAreaElement>(null),draft=useRef(n.text),profile=s.doc.colorProfile,grows=(n.textResize??'fixed')==='auto-width',[size,setSize]=useState<{width:number;height:number}|null>(null),lineHeight=n.lineHeightPx??n.lineHeight*n.fontSize;
 const measure=()=>{const el=field.current;if(!el)return;const {width,height}=el.style;el.style.width=grows?'0':Math.max(40,n.width)+'px';el.style.height='0';const next={width:grows?Math.ceil(el.scrollWidth)+2:Math.max(40,n.width),height:Math.max(lineHeight,el.scrollHeight)};el.style.width=width;el.style.height=height;setSize(current=>current?.width===next.width&&current.height===next.height?current:next);};
 useLayoutEffect(()=>{const el=field.current;if(!el)return;measure();if(entry.current==='select')el.select();else el.setSelectionRange(el.value.length,el.value.length);},[]);
 const commit=(value:string)=>{if(value===''&&!n.instanceRootId){const id=n.id;s.edit(d=>{const page=d.pages.find(p=>p.id===s.pageId)!;page.nodes=page.nodes.filter(v=>v.id!==id);});const live=useEditor.getState();live.set({selection:live.selection.filter(v=>v!==id)});}else s.patch([n.id],textEditPatch(n,value));onClose();};
 return <><style>{`[data-node-id="${n.id}"]{visibility:hidden}`}</style><textarea ref={field} aria-label="Edit text" dir={n.textDirection??'auto'} autoFocus wrap={grows?'off':'soft'} spellCheck={false} className="canvas-text-editor" onFocus={e=>{draft.current=e.currentTarget.value;}} onInput={e=>{draft.current=smartCanvasInput(n,e.currentTarget,draft.current,e.nativeEvent as InputEvent,getPreferences().smartTextSubstitution);measure();}} style={{...style,width:size?.width??Math.max(40,n.width),height:Math.max(size?.height??0,grows?0:n.height,lineHeight),fontWeight:n.fontWeight,fontStyle:n.fontStyle??'normal',letterSpacing:n.letterSpacing,lineHeight:lineHeight+'px',textAlign:n.textAlign,color:displayColor(textEditorColor(n),profile)}} defaultValue={n.text} onBlur={e=>commit(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'||e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();e.currentTarget.blur();const svg=canvas.current;if(svg){svg.setAttribute('data-quiet-focus','');svg.addEventListener('blur',()=>svg.removeAttribute('data-quiet-focus'),{once:true});svg.focus({preventScroll:true});}}else if(!canvasFormatKey(e,n,s.patch))canvasListKey(e,n,s.patch);e.stopPropagation();}}/></>;
}
