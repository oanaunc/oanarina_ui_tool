import {useEffect,useState} from 'react';
import {getFontCatalog} from '../fonts';
import type {FontFamily} from '../font-downloads';
import {fontStyleChoices,fontStyleKey,namedFontStyles} from '../font-styles';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
export default function FontStyleSelect({n,patch}:{n:DesignNode;patch:(p:Partial<DesignNode>)=>void}){const assets=useEditor(s=>s.doc.fonts),[catalog,setCatalog]=useState<FontFamily[]>([]);useEffect(()=>{let live=true;getFontCatalog().then(value=>{if(live)setCatalog(value);}).catch(()=>{});return()=>{live=false;};},[]);const italic=n.fontStyle==='italic'||n.fontStyle==='oblique' as string,choices=fontStyleChoices(namedFontStyles(n.fontFamily,catalog,assets??[]),n.fontWeight,italic);return <label className="system-field"><span>Font style</span><select aria-label="Font style" value={fontStyleKey(n.fontWeight,italic)} onChange={e=>{const choice=choices.find(c=>c.key===e.target.value);if(choice)patch({fontWeight:choice.weight,fontStyle:choice.italic?'italic':'normal'});}}>{choices.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></label>;}
