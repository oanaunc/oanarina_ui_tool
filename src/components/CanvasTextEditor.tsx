import {useLayoutEffect,useRef,useState} from 'react';
import type {ClipboardEvent,CSSProperties,KeyboardEvent,RefObject} from 'react';
import {canvasListKey} from '../list-editing';
import {canvasFormatKey} from '../text-format-keys';
import {smartCanvasInput} from '../smart-text';
import {textEditorColor,textEditPatch} from '../text-defaults';
import {displayColor} from '../color-profile';
import {getPreferences} from '../preferences';
import {commands} from '../commands';
import {getKeyboardPreferences,textFormatShortcut} from '../keyboard-preferences';
import {replaceRichText} from '../rich-text';
import {currentTextRules,textEditorShift,textLinePx} from '../text-layout';
import {buildTextSurface,hasStyledRuns,insertAtSelection,surfaceField} from '../text-surface';
import type {TextField} from '../text-surface';
import {useEditor} from '../store';
import type {DesignNode} from '../model';
import './canvas-text-editor.css';
/** 'select' takes all the words, 'end' parks the caret after them, and a number is the source offset under the pointer. */
export type TextEntry='select'|'end'|number;
/** Words appear where they will land: the editor takes the layer's own type, and the painted layer steps aside while it is open. */
export default function CanvasTextEditor({n,style,entry,canvas,onClose}:{n:DesignNode;style:CSSProperties;entry:RefObject<TextEntry>;canvas:RefObject<SVGSVGElement|null>;onClose:()=>void}){
 const s=useEditor(),field=useRef<HTMLTextAreaElement&HTMLDivElement>(null),rich=useRef(hasStyledRuns(n)).current,draft=useRef(n.text),profile=s.doc.colorProfile,grows=(n.textResize??'fixed')==='auto-width',limit=grows&&n.maxWidth?n.maxWidth:undefined,[size,setSize]=useState<{width:number;height:number;wrapped?:boolean}|null>(null),lineHeight=textLinePx(n),shift=useRef(textEditorShift(n,rich)).current;
 const input=():TextField=>rich?surfaceField(field.current!):field.current!;
 const measure=()=>{const el=field.current;if(!el)return;const {width,height,whiteSpace,overflowWrap}=el.style;el.style.wordBreak=currentTextRules(n)&&/[\uac00-\ud7a3]/.test(input().value)?'keep-all':'';el.style.whiteSpace=grows?'pre':whiteSpace;el.style.width=grows?'0':Math.max(40,n.width)+'px';el.style.height='0';const natural=Math.ceil(el.scrollWidth)+2,wrapped=limit!==undefined&&natural>limit;if(wrapped){el.style.whiteSpace='pre-wrap';el.style.overflowWrap='break-word';el.style.width=limit+'px';}const next={width:wrapped?limit:grows?natural:Math.max(40,n.width),height:Math.max(lineHeight,el.scrollHeight),wrapped};Object.assign(el.style,{width,height,whiteSpace,overflowWrap});setSize(current=>current?.width===next.width&&current.height===next.height&&current.wrapped===next.wrapped?current:next);};
 useLayoutEffect(()=>{const el=field.current;if(!el)return;if(rich){buildTextSurface(el,n,profile);el.focus({preventScroll:true});draft.current=n.text;}measure();const box=input();if(entry.current==='select'){if(rich)box.setSelectionRange(0,box.value.length);else el.select();}else{const at=typeof entry.current==='number'?Math.min(entry.current,box.value.length):box.value.length;box.setSelectionRange(at,at);}},[]);
 const commit=(value:string)=>{if(value===''&&!n.instanceRootId){const id=n.id;s.edit(d=>{const page=d.pages.find(p=>p.id===s.pageId)!;page.nodes=page.nodes.filter(v=>v.id!==id);});const live=useEditor.getState();live.set({selection:live.selection.filter(v=>v!==id)});}else s.patch([n.id],{...(n.textRuns?.length||n.paragraphStyles?.length?replaceRichText(n,value):{}),...textEditPatch(n,value),...(value!==n.text?{textLayoutVersion:2 as const}:{})});onClose();};
 const refresh=()=>{if(!rich)return;const el=field.current!,box=input(),{selectionStart,selectionEnd}=box,live=useEditor.getState(),current=live.doc.pages.find(p=>p.id===live.pageId)?.nodes.find(v=>v.id===n.id);if(!current)return;buildTextSurface(el,current,profile);box.setSelectionRange(selectionStart,selectionEnd);measure();};
 const typed=(native?:Event)=>{draft.current=smartCanvasInput(n,input(),draft.current,(native??{}) as InputEvent,getPreferences().smartTextSubstitution);measure();};
 const keys=(e:KeyboardEvent<HTMLElement>)=>{if(e.key==='Escape'||e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();e.currentTarget.blur();const svg=canvas.current;if(svg){svg.setAttribute('data-quiet-focus','');svg.addEventListener('blur',()=>svg.removeAttribute('data-quiet-focus'),{once:true});svg.focus({preventScroll:true});}}else if(canvasFormatKey(e,n,s.patch,input(),textFormatShortcut(e.nativeEvent,commands,getKeyboardPreferences(commands)))||canvasListKey(e,n,s.patch,input()))refresh();else if(rich&&e.key==='Enter'&&!e.altKey&&!e.nativeEvent.isComposing){e.preventDefault();insertAtSelection(field.current!,'\n');typed();}e.stopPropagation();};
 const box:CSSProperties={...style,transform:style.transform+' translateY('+shift+'px)',width:size?.width??Math.max(40,n.width),height:Math.max(size?.height??0,grows?0:n.height,lineHeight),textAlign:n.textAlign};
 return <><style>{`[data-node-id="${n.id}"]{visibility:hidden}`}</style>{rich?<div ref={field} role="textbox" aria-multiline="true" aria-label="Edit text" dir={n.textDirection??'auto'} contentEditable="plaintext-only" suppressContentEditableWarning spellCheck={false} className="canvas-text-editor canvas-text-surface" onInput={e=>typed(e.nativeEvent)} onPaste={(e:ClipboardEvent<HTMLElement>)=>{e.preventDefault();insertAtSelection(e.currentTarget,e.clipboardData.getData('text/plain'));typed();}} onBlur={()=>commit(surfaceField(field.current!).value)} onKeyDown={keys} style={{...box,whiteSpace:grows&&!size?.wrapped?'pre':'pre-wrap',overflowWrap:grows&&!size?.wrapped?'normal':'break-word',lineHeight:n.lineHeightPx!==undefined||currentTextRules(n)?lineHeight+'px':n.lineHeight}}/>:<textarea ref={field} aria-label="Edit text" dir={n.textDirection??'auto'} autoFocus wrap={grows&&!size?.wrapped?'off':'soft'} spellCheck={false} className="canvas-text-editor" onFocus={e=>{draft.current=e.currentTarget.value;}} onInput={e=>typed(e.nativeEvent)} style={{...box,fontWeight:n.fontWeight,fontStyle:n.fontStyle??'normal',letterSpacing:n.letterSpacing,lineHeight:lineHeight+'px',color:displayColor(textEditorColor(n),profile)}} defaultValue={n.text} onBlur={e=>commit(e.target.value)} onKeyDown={keys}/>}</>;
}
