import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {componentPropertyRelevance,setHideIrrelevantProperties} from '../component-property-visibility';
import {groupedComponentProperties,setInstanceProperty} from '../component-workflows';
import {isLocked} from '../model';
import type {DesignNode} from '../model';
import type {ComponentProperty} from '../components-model';
import {useEditor} from '../store';
import {notifyError} from '../files';
import {SwapOptions} from './ComponentWorkflowControls';

/** Fresh rendered controls recover; any retained receipt stays permanently invalid. */
function usePropertyProof(id:string,modal:string|null,isCurrent?:()=>boolean){const s=useEditor(),proof=useMemo(()=>({origin:captureColorContext(s),valid:true,id}),[s,id,modal,isCurrent]);
 useLayoutEffect(()=>{proof.valid=sameColorContext(proof.origin,useEditor.getState());const off=useEditor.subscribe(live=>{if(!sameColorContext(proof.origin,live))proof.valid=false;});return()=>{proof.valid=false;off();};},[proof]);
 return ()=>{const live=useEditor.getState();if(isCurrent&&!isCurrent()||!proof.valid||!sameColorContext(proof.origin,live)||live.modal!==modal||live.mode!=='design'||live.home||live.uiHidden||live.motionOpen)throw Error('The component editing context changed. Review the current controls and retry.');return live;};
}
export function ComponentRelevanceSetting({main,setId,isCurrent}:{main:DesignNode;setId?:string;isCurrent:()=>boolean}){const check=usePropertyProof(main.id,'components',isCurrent),s=useEditor();return <label className="check-row"><input aria-label="Hide irrelevant properties" type="checkbox" checked={main.componentMetadata?.hideIrrelevantProperties===true} onChange={e=>{try{check();s.edit(d=>setHideIrrelevantProperties(d,main.id,e.target.checked,setId));}catch(error){notifyError(error);}}}/>Hide irrelevant properties<small>Hide instance controls whose artwork is hidden. Visibility controls stay available to restore their own layer.</small></label>;}

export function InstancePropertyControls({root,properties}:{root:DesignNode;properties:ComponentProperty[]}){const s=useEditor(),check=usePropertyProof(root.id,null),generation=useRef(0),[view,setView]=useState({show:false,generation:0}),show=view.show,ticket=view.generation,checkVisible=()=>{check();if(ticket!==generation.current)throw Error('The property visibility changed. Review the current controls and retry.');},rows=useMemo(()=>componentPropertyRelevance(s.doc,root.id,properties),[s.doc,root.id,properties]),hidden=rows.filter(r=>r.hidden),reasons=new Map(rows.map(r=>[r.property.id,r.reason])),page=s.doc.pages.find(p=>p.nodes.some(n=>n.id===root.id)),disabled=s.modal!==null||s.mode!=='design'||s.motionOpen||!!page&&isLocked(root,page.nodes);
 const visible=rows.filter(r=>show||!r.hidden).map(r=>r.property);
 return <div className="instance-property-controls" onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&(e.target as HTMLElement).tagName==='BUTTON')e.stopPropagation();}}>
 {hidden.length>0&&<label className="check-row"><input aria-label="Show irrelevant properties" type="checkbox" checked={show} disabled={s.modal!==null||s.mode!=='design'||s.motionOpen} onChange={e=>{try{checkVisible();setView({show:e.target.checked,generation:++generation.current});}catch(error){notifyError(error);}}}/>Show irrelevant properties ({hidden.length})</label>}
 {!rows.length&&<p className="small-note">No exposed properties are available in this bounded component inspection.</p>}
 <fieldset disabled={disabled} style={{border:0,padding:0,margin:0}}>{groupedComponentProperties(visible).map(group=><fieldset key={group.name} className="component-property-group"><legend>{group.name||'Properties'}</legend>{group.properties.map(prop=>{const value=root.propertyValues?.[prop.id]??prop.defaultValue,change=(value:string|boolean)=>{try{checkVisible();s.edit(d=>setInstanceProperty(d,root.id,prop.id,value));}catch(error){notifyError(error);}};return <label className="system-field" key={prop.id}><span>{prop.name}</span>{prop.type==='boolean'?<input aria-label={'Property '+prop.name} type="checkbox" checked={Boolean(value)} onChange={e=>change(e.target.checked)}/>:prop.type==='text'?<input aria-label={'Property '+prop.name} value={String(value)} onChange={e=>change(e.target.value)}/>:<select aria-label={'Property '+prop.name} value={String(value)} onChange={e=>change(e.target.value)}><SwapOptions preferred={prop.preferredValues} value={String(value)}/></select>}{prop.description&&<small>{prop.description}</small>}{reasons.get(prop.id)&&<small>{reasons.get(prop.id)}</small>}</label>;})}</fieldset>)}</fieldset>
 </div>;
}
