import {useEffect,useState} from 'react';
import {ALargeSmall,AlignCenter,AlignJustify,AlignLeft,AlignRight,ChevronDown,SlidersHorizontal,SwatchBook,Type} from 'lucide-react';
import {runCommand} from '../commands';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {textEditPatch} from '../text-defaults';
import {DesignSystemInspector} from './DesignSystemsEditor';
import FontPicker from './FontPicker';
import FontStyleSelect from './FontStyleSelect';
import {IconSegments,LetterSpacingGlyph,LineHeightGlyph,VerticalAlignGlyph} from './InspectorParts';
import NumberField from './NumberField';
import RichTextInspector from './RichTextInspector';
import TextVariants from './TextVariants';
const sizes=[10,11,12,13,14,15,16,20,24,32,36,40,48,64,96,128];
/** Someone setting type across layers keeps the advanced settings open as they move between them. */
let advancedOpen=false;
export default function TypographySection({n,patch}:{n:DesignNode;patch:(p:Partial<DesignNode>)=>void}){
 const s=useEditor(),bound=!!(n.styleIds?.text||n.variableBindings?.text||n.variableBindings?.fontSize),[styles,setStyles]=useState(bound),[more,setMore]=useState(advancedOpen);
 useEffect(()=>{if(bound)setStyles(true);},[bound]);
 return <section className="inspector-section typography-section" aria-label="Typography"><div className="section-title"><span>Typography</span><span className="section-actions"><button className="font-library-button" aria-label="Browse Google & Mac fonts" title="Browse Google & Mac fonts" onClick={()=>s.set({modal:'fonts'})}><ALargeSmall size={14}/></button><button aria-label="Text styles" aria-expanded={styles} title="Text styles and variables" onClick={()=>setStyles(!styles)}><SwatchBook size={13}/></button></span></div>
  {styles&&<div className="paint-styles"><DesignSystemInspector n={n} only="text"/></div>}
  <FontPicker n={n} patch={patch}/>
  <div className="inspector-row even"><FontStyleSelect key={'font-style:'+n.id} n={n} patch={patch}/><div className="size-field"><NumberField label="Font size" value={n.fontSize} min={1} glyph={<Type size={11}/>} onChange={fontSize=>patch({fontSize})}/><label className="icon-select" title="Common sizes"><ChevronDown size={10}/><select aria-label="Common sizes" value="" onChange={e=>{if(e.target.value)patch({fontSize:Number(e.target.value)});}}><option value="" disabled hidden>Size</option>{sizes.map(size=><option key={size} value={size}>{size}</option>)}</select></label></div></div>
  <div className="inspector-row even"><NumberField label="Line height" glyph={<LineHeightGlyph/>} value={n.lineHeight} min={.1} step={.1} onChange={lineHeight=>patch({lineHeight,lineHeightPx:undefined})}/><NumberField label="Tracking" glyph={<LetterSpacingGlyph/>} value={n.letterSpacing} step={.1} onChange={letterSpacing=>patch({letterSpacing})}/></div>
  <div className="type-align-row"><IconSegments label="Text alignment" value={n.textAlign} onChange={value=>patch({textAlign:value as DesignNode['textAlign']})} options={[['left','left',<AlignLeft size={13}/>],['center','center',<AlignCenter size={13}/>],['right','right',<AlignRight size={13}/>],['justify','justify',<AlignJustify size={13}/>]]}/><IconSegments label="Vertical text alignment" value={n.verticalAlign??'top'} onChange={value=>patch({verticalAlign:value as DesignNode['verticalAlign']})} options={[['top','top',<VerticalAlignGlyph at="top"/>],['middle','middle',<VerticalAlignGlyph at="middle"/>],['bottom','bottom',<VerticalAlignGlyph at="bottom"/>]]}/><button className="inspector-tool" aria-label="More text options" aria-expanded={more} title="More text options" onClick={()=>{advancedOpen=!more;setMore(!more);}}><SlidersHorizontal size={12}/></button></div>
  {more&&<div className="type-advanced" role="group" aria-label="Advanced type settings">
   <div className="segmented text-formatting">{[['text-bold','B'],['text-italic','I'],['text-underline','U'],['text-strike','S']].map(([id,label])=><button key={id} title={id.slice(5)} aria-label={'Text '+id.slice(5)} onClick={()=>runCommand(id)}>{label}</button>)}</div>
   <select aria-label="Font weight" value={n.fontWeight} onChange={e=>patch({fontWeight:Number(e.target.value)})}>{[300,400,500,600,700,800].map(w=><option key={w} value={w}>{w}</option>)}</select>
   <div className="field-grid"><NumberField label="Paragraph gap" value={n.paragraphSpacing??0} min={0} onChange={paragraphSpacing=>patch({paragraphSpacing})}/><NumberField label="Indent" value={n.paragraphIndent??0} min={0} onChange={paragraphIndent=>patch({paragraphIndent})}/><NumberField label="Max lines" value={n.maxLines??0} min={0} onChange={maxLines=>patch({maxLines:Math.round(maxLines)})}/><select aria-label="Text overflow" value={n.textOverflow??'visible'} onChange={e=>patch({textOverflow:e.target.value as DesignNode['textOverflow']})}><option value="visible">Show overflow</option><option value="ellipsis">Truncate with …</option></select></div>
   <select aria-label="List style" value={n.listStyle??'none'} onChange={e=>patch({listStyle:e.target.value as DesignNode['listStyle']})}><option value="none">No list</option><option value="bullet">Bulleted list</option><option value="number">Numbered list</option></select>
   <label className="check-row"><input type="checkbox" checked={n.clip} onChange={e=>patch({clip:e.target.checked})}/>Clip text to bounds</label>
   <button className="text-button" onClick={()=>runCommand('text-link')}>{n.hyperlink?'Edit hyperlink':'Add hyperlink'}</button>
   <textarea aria-label="Text content" dir={n.textDirection??'auto'} key={n.id+n.text} defaultValue={n.text} onBlur={e=>{if(e.target.value!==n.text)patch(textEditPatch(n,e.target.value));}}/>
   <h4>Character formatting</h4><TextVariants n={n}/><RichTextInspector n={n}/>
  </div>}
 </section>;
}
