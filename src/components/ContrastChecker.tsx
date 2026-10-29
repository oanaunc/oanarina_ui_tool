import {useState} from 'react';
import type {DesignNode} from '../model';
import {fillsFor} from '../paints';
import {contrastRatio,contrastResults} from '../contrast';
import './contrast.css';

/** An explicit color-pair check, not a claim about an automatically sampled canvas. */
export default function ContrastChecker({selection}:{selection:DesignNode[]}){
 const [foreground,setForeground]=useState('#202027'),[background,setBackground]=useState('#ffffff'),[opacity,setOpacity]=useState(100);
 const [foregroundInput,setForegroundInput]=useState(foreground),[backgroundInput,setBackgroundInput]=useState(background),[message,setMessage]=useState('');
 const valid=/^#[0-9a-f]{6}$/i.test(foregroundInput)&&/^#[0-9a-f]{6}$/i.test(backgroundInput);
 const ratio=contrastRatio(foreground,background,opacity/100),result=contrastResults(ratio);
 const paint=selection.length===1?fillsFor(selection[0]).filter(p=>p.visible&&p.opacity>0):[];
 const selected=paint.length===1&&paint[0].type==='solid'?paint[0]:undefined;
 const colorField=(label:string,value:string,input:string,setValue:(v:string)=>void,setInput:(v:string)=>void)=><label className="contrast-color"><span>{label}</span><div><input aria-label={label+' picker'} type="color" value={value} onChange={e=>{setValue(e.target.value);setInput(e.target.value);}}/><input aria-label={label+' hex'} type="text" value={input} spellCheck={false} maxLength={7} aria-invalid={!/^#[0-9a-f]{6}$/i.test(input)} onChange={e=>{const text=e.target.value;setInput(text);if(/^#[0-9a-f]{6}$/i.test(text))setValue(text);}} onBlur={()=>setInput(value)}/></div></label>;
 const useSelected=(target:'foreground'|'background')=>{if(!selected)return;if(target==='foreground'){setForeground(selected.color);setForegroundInput(selected.color);setOpacity(selected.opacity*100);}else{setBackground(selected.color);setBackgroundInput(selected.color);}setMessage(target==='foreground'?'Selected solid paint copied, including paint opacity.':'Selected color copied as an opaque background.');};
 return <details className="contrast-checker"><summary>Color contrast checker</summary><div className="contrast-checker-body">
 <p className="inspector-note">Check an explicit color pair. The background is opaque; foreground opacity is composited over it.</p>
 {colorField('Foreground',foreground,foregroundInput,setForeground,setForegroundInput)}
 {colorField('Background',background,backgroundInput,setBackground,setBackgroundInput)}
 <label className="contrast-opacity">Foreground opacity %<input type="number" aria-label="Contrast foreground opacity" min={0} max={100} step={1} value={opacity} onChange={e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value))setOpacity(Math.max(0,Math.min(100,value)));}}/></label>
 <div className="button-row"><button className="outline-button" disabled={!selected} onClick={()=>useSelected('foreground')}>Use selected paint</button><button className="outline-button" disabled={!selected} onClick={()=>useSelected('background')}>Use as background</button></div>
 <p className="inspector-note">Select one layer with one visible solid paint to copy its values. Canvas backgrounds, group opacity, blends, effects, strokes and rich text are not sampled.</p>
 <div className="contrast-preview" style={{background,color:foreground}} aria-hidden="true"><span style={{opacity:opacity/100}}>Aa · Design for everyone</span></div>
 {!valid&&<p role="alert">Enter six-digit hex colors to calculate contrast.</p>}
 {valid&&<><output className="contrast-ratio" aria-label="Contrast ratio" aria-live="polite">{ratio.toFixed(3)}:1</output>
 <div className="contrast-results">{([['Normal text AA',result.normalAA,4.5],['Normal text AAA',result.normalAAA,7],['Large text AA',result.largeAA,3],['Large text AAA',result.largeAAA,4.5]] as const).map(([label,passes,target])=><div key={label}><span>{label} · {target}:1</span><strong className={passes?'contrast-pass':'contrast-fail'}>{passes?'Pass':'Fail'}</strong></div>)}</div></>}
 <p className="inspector-note">Large text: at least 24 CSS px, or 18⅔ CSS px bold. Results use the full ratio before rounding and do not certify a design's accessibility.</p>
 <a className="text-button" href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank" rel="noreferrer">WCAG contrast guidance ↗</a>
 {message&&<p role="status" className="inspector-note">{message}</p>}
 </div></details>;
}
