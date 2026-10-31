import {useMemo} from 'react';
import {groupedComponentProperties} from '../component-workflows';
import {goToMain,locate} from '../components-model';
import {exposedNestedInstances,isNestedInMain,nestedPropertyValue,setNestedExposure,setNestedInstanceProperty,swapNestedInstance} from '../nested-instances';
import {isLocked} from '../model';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {notifyError} from '../files';
import {t} from '../i18n';
import {SwapOptions} from './ComponentWorkflowControls';

function NestedControls({n}:{n:DesignNode}){const s=useEditor(),main=goToMain(s.doc,n.id),found=locate(s.doc,n.id),set=s.doc.componentSets?.find(set=>set.variants.some(v=>v.componentId===n.componentId)),current=set?.variants.find(v=>v.componentId===n.componentId),properties=locate(s.doc,n.componentId??'')?.node.componentMetadata?.properties??[],disabled=s.modal!==null||s.mode!=='design'||s.motionOpen||!!found&&isLocked(n,found.page.nodes),label=n.name,run=(change:Parameters<typeof s.edit>[0])=>{try{s.edit(change);}catch(error){notifyError(error);}};
 return <fieldset className="component-property-group" disabled={disabled} aria-label={t('Nested instance')+' '+label}><legend>{label}</legend>
 <label className="system-field"><span>{t('Swap nested instance')}</span><select aria-label={t('Swap nested instance')+' '+label} value={n.componentId??''} onChange={e=>run(d=>swapNestedInstance(d,n.id,e.target.value))}><SwapOptions preferred={main?.node.componentMetadata?.preferredInstances} value={n.componentId??''}/></select></label>
 {set&&set.propertyNames.map(name=><label className="system-field" key={name}><span>{name}</span><select aria-label={'Nested variant '+name+' '+label} value={current?.values[name]??''} onChange={e=>{const values={...current?.values,[name]:e.target.value},match=set.variants.find(v=>set.propertyNames.every(k=>v.values[k]===values[k]))??set.variants.find(v=>v.values[name]===e.target.value);if(match)run(d=>swapNestedInstance(d,n.id,match.componentId));}}>{[...new Set(set.variants.map(v=>v.values[name]))].map(v=><option key={v}>{v}</option>)}</select></label>)}
 {groupedComponentProperties(properties).flatMap(group=>group.properties).map(prop=>{const value=nestedPropertyValue(s.doc,n,prop),change=(value:string|boolean)=>run(d=>setNestedInstanceProperty(d,n.id,prop.id,value)),name='Nested property '+prop.name+' '+label;return <label className="system-field" key={prop.id}><span>{prop.name}</span>{prop.type==='boolean'?<input aria-label={name} type="checkbox" checked={Boolean(value)} onChange={e=>change(e.target.checked)}/>:prop.type==='text'?<input aria-label={name} value={String(value)} onChange={e=>change(e.target.value)}/>:<select aria-label={name} value={String(value)} onChange={e=>change(e.target.value)}><SwapOptions preferred={prop.preferredValues} value={String(value)}/></select>}</label>;})}
 </fieldset>;}
/** The selected nested instance edits only this outer instance. */
export function SelectedNestedInstance({n}:{n:DesignNode}){return n.type==='instance'&&n.instanceRootId?<NestedControls key={n.id} n={n}/>:null;}
/** Nested instances the main chose to expose appear on the outer instance. */
export function ExposedNestedInstances({root}:{root:DesignNode}){const s=useEditor(),list=useMemo(()=>exposedNestedInstances(s.doc,root.id),[s.doc,root.id]);return list.length?<div aria-label={t('Exposed nested instances')}>{list.map(n=><NestedControls key={n.id} n={n}/>)}</div>:null;}
export function NestedExposureToggle({n}:{n:DesignNode}){const s=useEditor();if(!isNestedInMain(s.doc,n))return null;return <label className="check-row"><input aria-label={t('Expose properties to instances')} type="checkbox" checked={n.exposeNestedProperties===true} disabled={s.mode!=='design'||s.motionOpen} onChange={e=>{try{s.edit(d=>setNestedExposure(d,n.id,e.target.checked));}catch(error){notifyError(error);}}}/>{t('Expose properties to instances')}</label>;}
