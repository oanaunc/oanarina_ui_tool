import {useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {ArrowLeftRight,Minus,Plus} from 'lucide-react';
import NumberField from './NumberField';
import {displayColor} from '../color-profile';
import {mixHex} from '../colors';
import {useEditor} from '../store';
import type {Paint} from '../paints';
type Stop=Paint['stops'][number];
const alphaHex=(opacity:number)=>Math.round(Math.max(0,Math.min(1,opacity))*255).toString(16).padStart(2,'0');
const sorted=(stops:Stop[])=>[...stops].sort((a,b)=>a.position-b.position);
/** The color a new stop needs so that adding it leaves the ramp looking the same. */
export function stopAt(stops:Stop[],position:number):Omit<Stop,'id'>{const order=sorted(stops),after=order.find(s=>s.position>=position)??order.at(-1)!,before=[...order].reverse().find(s=>s.position<=position)??order[0],span=after.position-before.position,t=span>0?(position-before.position)/span:0;return {position,color:mixHex(before.color,after.color,t),opacity:before.opacity+(after.opacity-before.opacity)*t};}
/** The middle of the widest gap between stops. */
export function openPosition(stops:Stop[]){const order=sorted(stops);let best=.5,width=0;for(let i=1;i<order.length;i++){const gap=order[i].position-order[i-1].position;if(gap>width){width=gap;best=order[i-1].position+gap/2;}}return best;}
/** One bar for the whole ramp: drag a marker to move a stop, click the bar to add one. The list below holds exact values. */
export default function GradientStops({paint:p,prefix,onChange,color}:{paint:Paint;prefix:string;onChange:(patch:Partial<Paint>)=>void;color:(stop:Stop,index:number,tools:ReactNode)=>ReactNode}){
 const profile=useEditor(s=>s.doc.colorProfile),bar=useRef<HTMLDivElement>(null),[draft,setDraft]=useState<{id:string;position:number}>(),[active,setActive]=useState<string>();
 const shown=p.stops.map(s=>draft?.id===s.id?{...s,position:draft.position}:s),ramp=sorted(shown).map(s=>`${displayColor(s.color,profile)}${alphaHex(s.opacity)} ${s.position*100}%`).join(',');
 const at=(x:number)=>{const box=bar.current!.getBoundingClientRect();return Math.max(0,Math.min(1,(x-box.left)/box.width));};
 const place=(id:string,position:number)=>onChange({stops:p.stops.map(s=>s.id===id?{...s,position}:s)});
 const add=(position:number)=>{const id=crypto.randomUUID();setActive(id);onChange({stops:[...p.stops,{id,...stopAt(p.stops,position)}]});};
 const remove=(id:string)=>{if(p.stops.length>2)onChange({stops:p.stops.filter(s=>s.id!==id)});};
 return <>
  <div className="gradient-bar" ref={bar} role="group" aria-label={prefix+' gradient stops'} onPointerDown={e=>{if(e.button===0&&e.target===e.currentTarget.firstChild)add(at(e.clientX));}}>
   <i style={{backgroundImage:`linear-gradient(to right,${ramp})`}}/>
   {shown.map((stop,i)=><button key={stop.id} type="button" role="slider" className={'gradient-marker'+(active===stop.id?' active':'')} aria-label={`${prefix} stop ${i+1} marker`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stop.position*100)} style={{left:stop.position*100+'%',color:displayColor(stop.color,profile)}}
    onPointerDown={e=>{e.preventDefault();e.stopPropagation();e.currentTarget.focus();e.currentTarget.setPointerCapture(e.pointerId);setActive(stop.id);setDraft({id:stop.id,position:stop.position});}}
    onPointerMove={e=>{if(draft?.id===stop.id&&e.currentTarget.hasPointerCapture(e.pointerId))setDraft({id:stop.id,position:at(e.clientX)});}}
    onPointerUp={()=>{if(draft?.id===stop.id){setDraft(undefined);if(draft.position!==p.stops[i].position)place(stop.id,draft.position);}}}
    onPointerCancel={()=>setDraft(undefined)}
    onKeyDown={e=>{const step=e.shiftKey?.1:.01;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();place(stop.id,Math.max(0,Math.min(1,stop.position+(e.key==='ArrowRight'?step:-step))));}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopPropagation();remove(stop.id);}}}/>)}
  </div>
  <div className="gradient-stops-title"><span>Stops</span><button type="button" className="paint-tool" title="Reverse" aria-label="Reverse" onClick={()=>onChange({stops:p.stops.map(s=>({...s,position:1-s.position}))})}><ArrowLeftRight size={12}/></button><button type="button" className="paint-tool" title="Add stop" aria-label="Add stop" onClick={()=>add(openPosition(p.stops))}><Plus size={12}/></button></div>
  <div className="gradient-stops">{p.stops.map((stop,i)=><div className={'gradient-stop'+(active===stop.id?' active':'')} key={stop.id} onFocus={()=>setActive(stop.id)}><NumberField label={`${prefix} stop ${i+1} position %`} value={stop.position*100} min={0} max={100} onChange={v=>place(stop.id,v/100)}/>{color(stop,i,<button type="button" className="paint-tool" title="Remove gradient stop" disabled={p.stops.length<=2} onClick={()=>remove(stop.id)}><Minus size={12}/></button>)}</div>)}</div>
 </>;
}
