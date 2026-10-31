import {useEffect,useRef,useState} from 'react';
import {colorHsv,colorString,hsvColor,parseColor} from '../colors';
import type {ColorMode} from '../colors';
import {clearRecentColors,rememberColor,useRecentColors} from '../recent-colors';
import './color-picker.css';
import CanvasColorSampler from './CanvasColorSampler';
import {getPreferences} from '../preferences';
import {useEditor} from '../store';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {displayColor,outsideSrgb,p3ToSrgbHex,srgbToP3Hex} from '../color-profile';

/** The first color commit turns a legacy fill into a stored paint and remounts this row; the picker stays open through that and through dialogs. */
let openPicker='';
export default function ColorPicker({color,opacity,onChange,prefix,trailing}:{color:string;opacity:number;onChange:(color:string,alpha?:number)=>void;prefix:string;trailing?:React.ReactNode}){
 const pickerKey=prefix+'|'+useEditor(s=>s.selection.join()),[open,setOpen]=useState(()=>openPicker===pickerKey);
 const profile=useEditor(s=>s.doc.colorProfile);
 const screenAbort=useRef<AbortController|null>(null),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;screenAbort.current?.abort();};},[]);
 const [sampling,setSampling]=useState(false),[screenBusy,setScreenBusy]=useState(false),sampleButton=useRef<HTMLButtonElement>(null);
 const [draft,setDraft]=useState({color,opacity}),[mode,setMode]=useState<ColorMode>(()=>getPreferences().colorPickerFormat),[error,setError]=useState('');
 const [hsv,setHsvDraft]=useState(()=>colorHsv(color)),hsvRef=useRef(hsv);
 const value=useRef(draft),active=useRef(false),base=useRef({color,opacity}),baseHsv=useRef(hsv),square=useRef<HTMLDivElement>(null),recent=useRecentColors();
 const update=(next:typeof draft,exact?:typeof hsv)=>{value.current=next;setDraft(next);const c=colorHsv(next.color),resolved=exact??{...c,h:c.s===0?hsvRef.current.h:c.h,s:c.v===0?hsvRef.current.s:c.s};hsvRef.current=resolved;setHsvDraft(resolved);};
 useEffect(()=>{active.current=false;base.current={color,opacity};const next=color===value.current.color?hsvRef.current:colorHsv(color);baseHsv.current=next;update({color,opacity},next);},[color,opacity]);
 const cancel=()=>{active.current=false;update(base.current,baseHsv.current);};
 const start=()=>{base.current={color,opacity};baseHsv.current={...hsvRef.current};active.current=true;};
 const closeSampler=()=>{setSampling(false);queueMicrotask(()=>sampleButton.current?.focus());};
 useEffect(()=>{window.addEventListener('blur',cancel);return()=>window.removeEventListener('blur',cancel);},[]);
 const accept=(next= value.current)=>{active.current=false;try{if(next.color.toLowerCase()!==color.toLowerCase()||next.opacity!==opacity){onChange(next.color,next.opacity);rememberColor(next.color);}update(next);base.current=next;baseHsv.current={...hsvRef.current};setError('');}catch(e){cancel();setError(e instanceof Error?e.message:'Color could not be changed.');}};
 const setHsv=(patch:Partial<typeof hsv>)=>{const next={...hsvRef.current,...patch};next.s=Math.max(0,Math.min(1,next.s));next.v=Math.max(0,Math.min(1,next.v));update({...value.current,color:hsvColor(next.h,next.s,next.v)},next);};
 const pointer=(e:React.PointerEvent)=>{const r=square.current!.getBoundingClientRect();setHsv({s:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),v:1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))});};
 const screen=async()=>{
  const EyeDropper=(window as unknown as {EyeDropper?:new()=>{open:(options:{signal:AbortSignal})=>Promise<{sRGBHex:string}>}}).EyeDropper;
  if(!EyeDropper){setError('Screen sampling is unavailable in this browser. Use Sample canvas color.');return;}
  screenAbort.current?.abort();const controller=new AbortController(),origin=captureColorContext(useEditor.getState());screenAbort.current=controller;
  const unsubscribe=useEditor.subscribe(s=>{if(!sameColorContext(origin,s))controller.abort();});
  setScreenBusy(true);
  try{const result=await new EyeDropper().open({signal:controller.signal});if(controller.signal.aborted||!sameColorContext(origin,useEditor.getState()))return;if(!/^#[a-f\d]{6}$/i.test(result.sRGBHex))throw Error('Invalid sampled color.');const sampled=useEditor.getState().doc.colorProfile==='display-p3'?srgbToP3Hex(result.sRGBHex):result.sRGBHex;onChange(sampled,opacity);rememberColor(sampled);setError('');}
  catch(e){if(!controller.signal.aborted&&!(e instanceof DOMException&&e.name==='AbortError'))setError(e instanceof Error?e.message:'Screen color could not be sampled.');}
  finally{unsubscribe();if(screenAbort.current===controller){screenAbort.current=null;if(mounted.current)setScreenBusy(false);}}
 };

 const range=(label:string,min:number,max:number,step:number,current:number,change:(n:number)=>void,style?:React.CSSProperties)=><label className="color-picker-range"><span>{label}</span><input aria-label={prefix+' '+label} type="range" min={min} max={max} step={step} value={current} style={style} onPointerDown={start} onChange={e=>change(Number(e.currentTarget.value))} onPointerUp={()=>accept()} onBlur={()=>{if(active.current)accept();}} onKeyUp={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))accept();}} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();}else if(!active.current)start();}} onPointerCancel={cancel}/><span className="color-picker-output" aria-hidden="true">{Math.round(current)}</span></label>;
 return <div className="forma-color-picker" onKeyDown={e=>{if(e.key==='Escape'&&active.current){e.preventDefault();e.stopPropagation();cancel();}}}>
  <div className="paint-color-row"><button type="button" className="paint-color-chip" aria-label={prefix+' color picker'} aria-expanded={open} title="Open the color picker" style={{background:displayColor(draft.color,profile)}} onClick={()=>{openPicker=open?'':pickerKey;setOpen(!open);}}/><input aria-label={prefix+' color value'} key={color+mode} defaultValue={colorString(color,mode)} onBlur={e=>{const result=parseColor(e.currentTarget.value,mode);if(result){accept({color:result.color,opacity:result.alpha??opacity});e.currentTarget.removeAttribute('aria-invalid');}else{e.currentTarget.setAttribute('aria-invalid','true');setError('Enter a valid '+mode+' color.');}}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/>{trailing}</div>
  {open&&<div className="forma-color-picker-panel">
  <div ref={square} className="color-picker-square" role="slider" tabIndex={0} aria-label={prefix+' saturation and brightness'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hsv.s*100)} aria-valuetext={`${Math.round(hsv.s*100)}% saturation, ${Math.round(hsv.v*100)}% brightness`} style={{backgroundColor:displayColor(hsvColor(hsv.h,1,1),profile)}} onPointerDown={e=>{e.preventDefault();e.currentTarget.focus();start();e.currentTarget.setPointerCapture(e.pointerId);pointer(e);}} onPointerMove={e=>{if(active.current&&e.currentTarget.hasPointerCapture(e.pointerId))pointer(e);}} onPointerUp={e=>{if(active.current){pointer(e);accept();}if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={cancel} onLostPointerCapture={()=>{if(active.current)cancel();}} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||e.metaKey||e.ctrlKey||e.altKey)return;e.preventDefault();e.stopPropagation();const step=e.shiftKey?.1:.01,next={...hsv};if(e.key==='ArrowRight')next.s+=step;if(e.key==='ArrowLeft')next.s-=step;if(e.key==='ArrowUp')next.v+=step;if(e.key==='ArrowDown')next.v-=step;setHsv(next);accept(value.current);}}><i style={{left:hsv.s*100+'%',top:(1-hsv.v)*100+'%'}}/></div>
  {range('Hue',0,359,1,hsv.h,h=>setHsv({h}),{background:'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)'})}
  {range('Saturation %',0,100,1,hsv.s*100,s=>setHsv({s:s/100}))}
  {range('Brightness %',0,100,1,hsv.v*100,v=>setHsv({v:v/100}))}
  {range('Alpha %',0,100,1,draft.opacity*100,a=>update({...value.current,opacity:a/100}))}
  <div className="paint-color-format"><input type="color" aria-label={prefix+' color'} value={draft.color} onChange={e=>accept({...draft,color:e.target.value})}/><select aria-label={prefix+' color format'} value={mode} onChange={e=>setMode(e.currentTarget.value as ColorMode)}>{['HEX','RGB','HSL','HSB'].map(v=><option key={v}>{v}</option>)}</select></div>
  <details className="recent-color-details"><summary>Recent colors</summary><div className="recent-color-swatches">{recent.map(c=><button key={c} title={c} aria-label={prefix+' recent '+c} style={{background:c}} onClick={()=>accept({...draft,color:c})}/>)}</div>{recent.length>0?<button onClick={clearRecentColors}>Clear recent colors</button>:<small>No recent colors on this device.</small>}</details>
  <div className="button-row"><button ref={sampleButton} onClick={()=>setSampling(true)}>Sample canvas color</button><button disabled={screenBusy} onClick={()=>{void screen();}}>Sample screen color</button></div>
  </div>}
  {profile==='display-p3'&&<p className="inspector-note" data-color-gamut={outsideSrgb(draft.color)?'outside-srgb':'inside-srgb'}>Display P3 file: values are P3 coordinates.{outsideSrgb(draft.color)?` Outside sRGB; sRGB exports and sRGB displays clip it to ${p3ToSrgbHex(draft.color).toUpperCase()}.`:' Inside sRGB.'}</p>}
  {sampling&&<CanvasColorSampler onPick={(c,a)=>accept({color:c,opacity:a})} onClose={closeSampler}/>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
