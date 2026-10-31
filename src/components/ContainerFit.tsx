import {useState} from 'react';
import {t} from '../i18n';
import {useEditor} from '../store';
import {isLocked} from '../model';
import {managedLayer} from '../layer-operations';
import {finalizeFrameFit,prepareFrameFitForEdit} from '../frame-actions';
import {planSectionFit} from '../group-bounds';
import {setContainerAutoFit} from '../group-auto-bounds';
const blocked=(s:ReturnType<typeof useEditor.getState>,id:string)=>{const page=s.doc.pages.find(p=>p.id===s.pageId)!,n=page.nodes.find(v=>v.id===id);return !n||isLocked(n,page.nodes)||managedLayer(n,page.nodes)||s.motionOpen;};
export function SectionFit({id}:{id:string}){const s=useEditor(),[error,setError]=useState('');return <><button className="outline-button" disabled={blocked(s,id)} onClick={()=>{try{let plan:ReturnType<typeof planSectionFit>;s.edit(d=>{const page=d.pages.find(p=>p.id===s.pageId)!;plan=planSectionFit(page.nodes,id,d);page.nodes=prepareFrameFitForEdit(plan);},d=>finalizeFrameFit(d,s.pageId,plan));setError('');}catch(e){setError((e as Error).message);}}}>{t('Fit section to contents')}</button>{error&&<p role="alert">{error}</p>}</>;}
/** Opt-in, saved in the file: the box follows its direct children on later edits, in the same Undo step as the edit. */
export function ContainerAutoFit({id}:{id:string}){const s=useEditor(),n=s.doc.pages.find(p=>p.id===s.pageId)!.nodes.find(v=>v.id===id),[error,setError]=useState(''),[draft,setDraft]=useState(String(n?.autoFit?.padding??0));if(!n||s.doc.workspace&&s.doc.workspace!=='design')return null;const write=(padding:number|null)=>{try{s.edit(d=>setContainerAutoFit(d.pages.find(p=>p.id===s.pageId)!,id,padding));setError('');}catch(e){setError((e as Error).message);}},disabled=blocked(s,id);return <div className="container-auto-fit"><label className="check-row"><input type="checkbox" aria-label={t('Keep fitted to contents')} disabled={disabled} checked={!!n.autoFit} onChange={e=>write(e.target.checked?Number(draft)||0:null)}/>{t('Keep fitted to contents')}</label>{n.autoFit&&<label>{t('Fit padding')}<input aria-label={t('Fit padding')} type="number" min="0" max="10000" disabled={disabled} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={()=>{const value=Number(draft);if(value!==n.autoFit?.padding)write(Number.isFinite(value)?value:-1);}}/></label>}{error&&<p role="alert">{error}</p>}</div>;}
