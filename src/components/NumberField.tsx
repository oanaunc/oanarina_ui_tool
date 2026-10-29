import {useEffect,useState} from 'react';
import {numericExpression} from '../guides';

/** Arithmetic is parsed locally; input never reaches JavaScript evaluation. */
export default function NumberField({label,value,onChange,min,max,step=1}:{label:string;value:number;onChange:(v:number)=>void;min?:number;max?:number;step?:number}){
 const display=(n:number)=>String(Number(n.toFixed(6))),[text,setText]=useState(display(value)),[error,setError]=useState('');
 useEffect(()=>{setText(display(value));setError('');},[value]);
 const clamp=(n:number)=>Math.min(max??Infinity,Math.max(min??-Infinity,n));
 const commit=()=>{if(text===display(value)){setError('');return;}try{const n=clamp(numericExpression(text,value));setText(display(n));setError('');if(n!==value)onChange(n);}catch(e){setError(e instanceof Error?e.message:'Enter a number.');setText(display(value));}};
 return <label className="number-field"><span>{label}</span><input aria-label={label} role="spinbutton" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-invalid={!!error} title={error||'Arithmetic: 120 + 8, (40 * 3), +8, /2. Arrow keys adjust; Shift ×10, Option ×0.1.'} value={text} onChange={e=>{setText(e.target.value);setError('');}} onBlur={commit} onKeyDown={e=>{
  if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();e.currentTarget.value=display(value);setText(display(value));setError('');}
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();try{const n=clamp(numericExpression(text,value)+(e.key==='ArrowUp'?1:-1)*step*(e.shiftKey?10:e.altKey?0.1:1));setText(display(n));setError('');}catch{setError('Enter a valid expression before adjusting.');}}
 }}/></label>;
}
