import {useEffect,useRef} from 'react';
import {getFigImportReport} from '../fig-import';
import type {FigImportSummary} from '../fig-scene';
import {useEditor} from '../store';
import {formatNumber,t} from '../i18n';
function figImportKept(s?:FigImportSummary){if(!s)return [];const line=(count:number,text:Parameters<typeof t>[0])=>count>0?[t(text,{count:formatNumber(count)})]:[];return [...line(s.instances,'{count} live instances'),...line(s.detachedInstances,'{count} instances stayed as plain layers'),...line(s.componentSets,'{count} variant sets'),...line(s.autoLayouts,'{count} auto layout frames'),...line(s.reducedLayouts,'{count} auto layout frames stayed positioned'),...line(s.variables,'{count} variables'),...line(s.styles,'{count} styles'),...line(s.reactions,'{count} prototype interactions'),...line(s.editablePaths,'{count} vectors with editable anchors')];}
export default function FigImportReport(){
 const report=getFigImportReport(),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{button.current?.focus();},[]);
 if(!report)return <p>No Figma import report is available.</p>;
 const groups=new Map<string,{message:string;count:number}>();
 for(const issue of report.issues){const key=issue.code+'\0'+issue.message,group=groups.get(key);if(group)group.count++;else if(groups.size<200)groups.set(key,{message:issue.message,count:1});}
 const kept=figImportKept(report.summary);
 return <><p className="dialog-description"><strong>{report.document.name}</strong> opened as a separate Forma project. Your original Figma file is unchanged. Save a <code>.oui</code> copy to keep editing.</p>
 <p>{report.document.pages.length} pages · {report.document.pages.reduce((sum,p)=>sum+p.nodes.length,0)} layers</p>
 <p>{report.complete?'No known feature reductions were detected. Compare important details with the original.':'Some Figma features require review; see the format-specific notices below.'}</p>
 {kept.length>0&&<section aria-label={t('Kept live in Forma')}><h3>{t('Kept live in Forma')}</h3><ul>{kept.map(line=><li key={line}>{line}</li>)}</ul></section>}
 {report.issues.length>0&&<section aria-label="Figma import notices"><h3>Review these changes</h3><ul>{[...groups].map(([key,group])=><li key={key}>{group.message}{group.count>1?` (${group.count} layers)`:''}</li>)}</ul>{groups.size===200&&<p>Showing the first 200 distinct notices.</p>}</section>}
 <p className="small-note">{report.source==='rest'?'This offline REST JSON subset uses editable text with available fonts. Image references use explicit gray placeholders. API retrieval, external assets, rich glyph layout and live component linkage are not imported.':'Original text shapes can preserve appearance until you edit typography or layout. Editable text then uses available fonts. This importer supports a subset of Figma Design files, tested with generated files; binary .fig export is not available.'}</p>
 <button ref={button} className="primary-button" onClick={()=>useEditor.getState().set({modal:null})}>Continue editing</button></>;
}
