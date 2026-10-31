import {editWithOwnedDelivery} from '../owned-edit-delivery';
import './component-documentation.css';
import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useEditor} from '../store';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {documentationChoices,prepareComponentDocumentation,applyComponentDocumentation,validateComponentDocumentation} from '../component-documentation';
import type {DocumentationPlan} from '../component-documentation';
import type {DesignDocument} from '../model';
const message=(e:unknown)=>e instanceof Error?e.message:String(e);
interface Draft {title:string;allVariants:boolean;open:boolean;plan?:DocumentationPlan;source?:DesignDocument;reviewProof?:{valid:boolean};}
/** Inline review uses no app modal or hidden page controller. All saved output is ordinary artwork. */
export function ComponentDocumentation({mainId,owner,isCurrent}:{mainId:string;owner?:'assets';isCurrent?:()=>boolean}){
 const s=useEditor(),choices=useMemo(()=>{try{return {value:documentationChoices(s.doc,mainId)};}catch(error){return {error:message(error)};}},[s.doc,mainId]);
 const [draft,setDraft]=useState<Draft>({title:choices.value?.title??'Component documentation',allVariants:false,open:false}),currentDraft=useRef(draft),[error,setError]=useState('');
 const proof=useMemo(()=>({origin:captureColorContext(s),fontRevision:s.fontRevision,leftTab:s.leftTab,valid:true}),[s,mainId,owner]);
 useLayoutEffect(()=>{proof.valid=sameColorContext(proof.origin,useEditor.getState());const off=useEditor.subscribe(live=>{if(!sameColorContext(proof.origin,live)||live.fontRevision!==proof.fontRevision||owner==='assets'&&live.leftTab!==proof.leftTab)proof.valid=false;});return()=>{proof.valid=false;off();};},[proof,owner]);
 const blocked=s.mode!=='design'||s.motionOpen||!!s.modal||s.home||s.uiHidden||!!s.doc.workspace&&s.doc.workspace!=='design';
 const guard=()=>{const live=useEditor.getState();if(blocked||!proof.valid||!sameColorContext(proof.origin,live)||live.fontRevision!==proof.fontRevision||live.modal||live.mode!=='design'||live.motionOpen||owner==='assets'&&live.leftTab!=='assets'||isCurrent&&!isCurrent()||currentDraft.current!==draft)throw Error('The documentation source or review choices changed. Retry with the current controls.');return live;};
 const publish=(next:Draft)=>{currentDraft.current=next;setDraft(next);};
 const run=(action:()=>void)=>{try{action();setError('');}catch(e){setError(message(e));}};
 const change=(patch:Partial<Draft>)=>run(()=>{guard();publish({...draft,...patch,plan:undefined,source:undefined,reviewProof:undefined});});
 const activation=(e:React.KeyboardEvent)=>{if(e.key===' '||e.key==='Enter')e.stopPropagation();};
 const review=()=>run(()=>{const live=guard();if(!choices.value)throw Error(choices.error??'This component is unavailable.');const plan=prepareComponentDocumentation(live.doc,mainId,{title:draft.title,allVariants:draft.allVariants});guard();publish({...draft,plan,source:live.doc,reviewProof:proof});});
 const generate=()=>run(()=>{const live=guard(),plan=draft.plan;if(!plan||draft.source!==live.doc||!draft.reviewProof?.valid)throw Error('Review the current documentation page before generating it.');editWithOwnedDelivery(d=>applyComponentDocumentation(d,plan),d=>validateComponentDocumentation(d,plan),()=>({pageId:plan.pageId,selection:[],vectorEditId:null,vectorSelection:[],pan:{x:24,y:24},zoom:.75,leftTab:'layers'}));publish({...draft,open:false,plan:undefined,source:undefined,reviewProof:undefined});});
 return <section className="component-documentation" aria-label="Component documentation" onKeyDown={activation} onKeyUp={activation}>
  <button type="button" className="outline-button" disabled={blocked} onClick={()=>change({open:!draft.open})}>{draft.open?'Close documentation review':'Create documentation page'}</button>
  {draft.open&&<div className="component-documentation-review"><p>Generate an editable sibling page. Documentation text is a snapshot; fresh instance examples stay linked to the selected mains and their defaults in the new page’s variable modes. Selected instance overrides are excluded.</p>
   {choices.error?<p role="status">{choices.error}</p>:<><label>Documentation page name<input aria-label="Documentation page name" value={draft.title} maxLength={200} onChange={e=>change({title:e.target.value})}/></label>
   {choices.value?.set&&<label><input type="checkbox" aria-label="Document all variants" checked={draft.allVariants} disabled={choices.value.variantCount>32} onChange={e=>change({allVariants:e.target.checked})}/> Include all {choices.value.variantCount} variants (maximum 32)</label>}
   <p>No remote publishing or automatic regeneration. Slot-bearing, circular, oversized and unsupported automatic ancestor contexts refuse before adding a page.</p>
   <button type="button" onClick={review} disabled={blocked}>Review documentation page</button>
   {draft.plan&&draft.source===s.doc&&draft.reviewProof?.valid&&<><p role="status">{draft.plan.exampleCount} linked example{draft.plan.exampleCount===1?'':'s'} · {draft.plan.layerCount} editable layers · {draft.plan.pageName}</p><button type="button" className="primary" onClick={generate} disabled={blocked}>Generate documentation page</button></>}</>}
  </div>}{error&&<p role="alert">{error}</p>}
 </section>;
}
