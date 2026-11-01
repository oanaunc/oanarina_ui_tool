import {useEffect,useState} from 'react';
import {ChevronDown} from 'lucide-react';
export function Section({name,children,action}:{name:string;children:React.ReactNode;action?:React.ReactNode}){return <section className="inspector-section"><div className="section-title"><span>{name}</span>{action}</div>{children}</section>;}
/** Disclosures opened by hand stay open from layer to layer, like the fuller layout controls. */
const remembered=new Set<string>();
/** A secondary section after Export, or inside More options. It starts closed unless the selected layer already uses it. */
export function MoreSection({name,scope,active=false,children}:{name:string;scope:string;active?:boolean;children:React.ReactNode}){
 const [open,setOpen]=useState(active||remembered.has(name));
 useEffect(()=>{setOpen(active||remembered.has(name));},[active,scope,name]);
 return <details className="inspector-disclosure more-section" open={open}><summary onClick={e=>{e.preventDefault();if(open)remembered.delete(name);else remembered.add(name);setOpen(!open);}} onKeyDown={e=>{if(['Enter',' '].includes(e.key))e.stopPropagation();}} onKeyUp={e=>{if(['Enter',' '].includes(e.key))e.stopPropagation();}}>{name}</summary><div className="more-body">{children}</div></details>;
}
let moreOpen=false;
export const moreOptionsOpen=()=>moreOpen;
/** Tools most layers never need. Opening it holds from layer to layer, as the sections inside do. */
export function MoreOptions({children}:{children:React.ReactNode}){const [open,setOpen]=useState(moreOpen);return <details className="inspector-more-options" open={open}><summary onClick={e=>{e.preventDefault();moreOpen=!open;setOpen(!open);}} onKeyDown={e=>{if(['Enter',' '].includes(e.key))e.stopPropagation();}} onKeyUp={e=>{if(['Enter',' '].includes(e.key))e.stopPropagation();}}>More options</summary><div className="inspector-more">{children}</div></details>;}
/** A native dropdown with a leading glyph, so the choice list stays the platform's. */
export function GlyphSelect({label,glyph,value,onChange,title,children}:{label:string;glyph?:React.ReactNode;value:string|number;onChange:(value:string)=>void;title?:string;children:React.ReactNode}){return <label className={'glyph-select'+(glyph?' has-glyph':'')} title={title??label}>{glyph&&<span className="field-glyph" aria-hidden="true">{glyph}</span>}<select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{children}</select><ChevronDown size={10} aria-hidden="true"/></label>;}
/** One choice from a row of icons; each button keeps a spoken name. */
export function IconSegments({label,value,onChange,options}:{label:string;value:string;onChange:(value:string)=>void;options:[string,string,React.ReactNode][]}){return <div className="icon-group" role="group" aria-label={label}>{options.map(([option,name,icon])=><button key={option} aria-label={name} aria-pressed={value===option} title={name} className={value===option?'active':''} onClick={()=>onChange(option)}>{icon}</button>)}</div>;}
/** An icon that opens a native dropdown, for choices that sit in a section title. */
export function IconSelect({label,icon,value,onChange,active=false,children}:{label:string;icon:React.ReactNode;value:string;onChange:(value:string)=>void;active?:boolean;children:React.ReactNode}){return <label className={'icon-select'+(active?' active':'')} title={label}>{icon}<select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{children}</select></label>;}
const glyph=(body:React.ReactNode)=><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{body}</svg>;
export const AngleGlyph=()=>glyph(<><path d="M2 10h8M2 10l6.5-7.5"/><path d="M6 10a4 4 0 0 0-1.2-2.8"/></>);
export const CornerGlyph=()=>glyph(<path d="M2 10V6a4 4 0 0 1 4-4h4"/>);
export const CheckerGlyph=()=>glyph(<><rect x="2" y="2" width="8" height="8" rx="1"/><path fill="currentColor" stroke="none" d="M2 2h4v4H2zM6 6h4v4H6z"/></>);
export const LineHeightGlyph=()=>glyph(<><path d="M2 2h8M2 10h8"/><path d="M4 8l2-4 2 4M4.7 6.8h2.6"/></>);
export const LetterSpacingGlyph=()=>glyph(<><path d="M1.5 2v8M10.5 2v8"/><path d="M4 8l2-4 2 4M4.7 6.8h2.6"/></>);
export const ConstraintXGlyph=()=>glyph(<><path d="M2 3v6M2 6h8"/><path d="M8 4.5L10 6 8 7.5"/></>);
export const ConstraintYGlyph=()=>glyph(<><path d="M3 2h6M6 2v8"/><path d="M4.5 8L6 10l1.5-2"/></>);
export const GapGlyph=()=>glyph(<><path d="M2 2v8M10 2v8"/><path d="M6 4v4"/></>);
export const PaddingXGlyph=()=>glyph(<><path d="M2 2v8M10 2v8"/><rect x="4.5" y="3.5" width="3" height="5" rx=".6"/></>);
export const PaddingYGlyph=()=>glyph(<><path d="M2 2h8M2 10h8"/><rect x="3.5" y="4.5" width="5" height="3" rx=".6"/></>);
export const VerticalAlignGlyph=({at}:{at:'top'|'middle'|'bottom'})=>{const y=at==='top'?3.5:at==='middle'?5:6.5;return glyph(<><path d="M2 1.5h8M2 10.5h8"/><path d={`M3.5 ${y}h5M4.5 ${y+1.8}h3`}/></>);};
