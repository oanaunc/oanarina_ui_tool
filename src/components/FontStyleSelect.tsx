import {useEffect,useState} from 'react';
import {getFontCatalog} from '../fonts';
import type {FontFamily} from '../font-downloads';
import {fontStyleChoices,fontStyleKey,installedFontStyles,namedFontStyles} from '../font-styles';
import type {NamedFontStyle} from '../font-styles';
import type {DesignNode} from '../model';
import {GlyphSelect} from './InspectorParts';
import {useEditor} from '../store';
export default function FontStyleSelect({n,patch}:{n:DesignNode;patch:(p:Partial<DesignNode>)=>void}){const assets=useEditor(s=>s.doc.fonts),[catalog,setCatalog]=useState<FontFamily[]>([]),[installed,setInstalled]=useState<{family:string;faces:NamedFontStyle[]}>();useEffect(()=>{let live=true;getFontCatalog().then(value=>{if(live)setCatalog(value);}).catch(()=>{});return()=>{live=false;};},[]);const known=namedFontStyles(n.fontFamily,catalog,assets??[]),ask=!known.length&&catalog.length>0&&!!window.desktop?.fontFaces;useEffect(()=>{if(!ask)return;let live=true;window.desktop!.fontFaces!(n.fontFamily).then(value=>{if(live)setInstalled({family:n.fontFamily,faces:installedFontStyles(value)});}).catch(()=>{});return()=>{live=false;};},[ask,n.fontFamily]);const italic=n.fontStyle==='italic'||n.fontStyle==='oblique' as string,choices=fontStyleChoices(known.length?known:installed?.family===n.fontFamily?installed.faces:[],n.fontWeight,italic);return <GlyphSelect label="Font style" value={fontStyleKey(n.fontWeight,italic)} onChange={key=>{const choice=choices.find(c=>c.key===key);if(choice)patch({fontWeight:choice.weight,fontStyle:choice.italic?'italic':'normal'});}}>{choices.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</GlyphSelect>;}
