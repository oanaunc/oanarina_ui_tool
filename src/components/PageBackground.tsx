import {useEffect,useState} from 'react';
import {useEditor} from '../store';
import NumberField from './NumberField';
import type {Page} from '../model';

export default function PageBackground({page}:{page:Page}){
 const s=useEditor(),color=page.background?.color??(s.theme==='light'?'#e9e7ec':'#242328'),[value,setValue]=useState(color),[error,setError]=useState('');
 useEffect(()=>{setValue(color);setError('');},[page.id,color]);
 const patch=(change:Partial<NonNullable<Page['background']>>)=>s.edit(d=>{const p=d.pages.find(p=>p.id===page.id)!;p.background={color,opacity:1,visible:true,...p.background,...change};});
 return <div className="page-background" title="Canvas only. Frame fills, prototypes and artwork exports keep their own backgrounds."><div className="page-background-row"><input aria-label="Canvas background picker" type="color" value={color} onChange={e=>patch({color:e.target.value})}/><input aria-label="Canvas background hex" spellCheck={false} value={value} maxLength={7} aria-invalid={!!error} onChange={e=>{setValue(e.target.value);setError('');}} onBlur={()=>{if(!/^#[0-9a-f]{6}$/i.test(value)){setError('Use a six-digit hex color.');setValue(color);return;}if(value.toLowerCase()!==color.toLowerCase())patch({color:value});}}/><NumberField label="Canvas background opacity %" min={0} max={100} value={(page.background?.opacity??1)*100} onChange={value=>patch({opacity:value/100})}/></div>
 <label className="check-row"><input aria-label="Show canvas background" type="checkbox" checked={page.background?.visible??true} onChange={e=>patch({visible:e.target.checked})}/>Show background</label>
 <button className="text-button" disabled={!page.background} onClick={()=>s.edit(d=>{delete d.pages.find(p=>p.id===page.id)!.background;})}>Use theme background</button>
 {error&&<p role="alert">{error}</p>}
 </div>;
}
