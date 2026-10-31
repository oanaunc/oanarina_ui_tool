import {editWithOwnedDelivery} from '../owned-edit-delivery';
import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useEditor} from '../store';
import {getPreferences,subscribePreferences,usePreferences} from '../preferences';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {inspectTextBoolean,prepareTextBoolean,validateTextBooleanReview,applyTextBoolean,validateTextBooleanResult} from '../boolean-text';
import type {TextBooleanOperation,TextBooleanPlan} from '../boolean-text';
import {notifyError} from '../files';
import './boolean-text.css';
interface Draft{operation:TextBooleanOperation;plan?:TextBooleanPlan;proof?:{valid:boolean};}
export default function BooleanTextControls(){
 const s=useEditor(),prefs=usePreferences(),[epoch,refresh]=useState({}),[draft,setDraft]=useState<Draft>({operation:'union'}),current=useRef(draft),[error,setError]=useState(''),proof=useMemo(()=>({origin:captureColorContext(s),fontRevision:s.fontRevision,scale:prefs.uiScale,valid:true}),[s.doc,s.pageId,s.selection,s.mode,s.modal,s.motionOpen,s.motionTime,s.home,s.uiHidden,s.fontRevision,prefs.uiScale,epoch]),life=useMemo(()=>({mounted:false}),[proof]);
 useLayoutEffect(()=>{life.mounted=true;const check=()=>{const live=useEditor.getState();if(proof.valid&&(!sameColorContext(proof.origin,live)||live.fontRevision!==proof.fontRevision||getPreferences().uiScale!==proof.scale)){proof.valid=false;refresh({});}},interrupt=()=>{proof.valid=false;refresh({});},hidden=()=>{if(document.hidden)interrupt();},off=useEditor.subscribe(check),pref=subscribePreferences(check);window.addEventListener('blur',interrupt);window.addEventListener('resize',interrupt);document.addEventListener('visibilitychange',hidden);return()=>{life.mounted=false;off();pref();window.removeEventListener('blur',interrupt);window.removeEventListener('resize',interrupt);document.removeEventListener('visibilitychange',hidden);};},[proof,life]);
 const guard=()=>{const live=useEditor.getState();if(!life.mounted||!proof.valid||document.hidden||!sameColorContext(proof.origin,live)||live.fontRevision!==proof.fontRevision||getPreferences().uiScale!==proof.scale||live.home||live.modal||live.uiHidden||live.motionOpen||live.mode!=='design'||current.current!==draft)throw Error('The outlined-text Boolean source or review changed. Use the current controls and review again.');return live;};
 const publish=(next:Draft)=>{current.current=next;setDraft(next);};
 const run=(fn:()=>void)=>{try{fn();setError('');}catch(e){setError(e instanceof Error?e.message:String(e));notifyError(e);}};
 const review=()=>run(()=>{const live=guard(),plan=prepareTextBoolean(live.doc,live.pageId,live.selection,draft.operation);guard();publish({...draft,plan,proof});});
 const apply=()=>run(()=>{const live=guard(),plan=draft.plan;if(!plan||!draft.proof?.valid)throw Error('Review the current outlined-text Boolean before applying it.');validateTextBooleanReview(live.doc,plan);guard();editWithOwnedDelivery(d=>applyTextBoolean(d,plan),d=>validateTextBooleanResult(d,plan),()=>({selection:[plan.groupId],vectorEditId:null,vectorSelection:[]}));publish({operation:draft.operation});});
 let reason='';try{if(s.mode!=='design'||s.home||s.modal||s.uiHidden||s.motionOpen)throw Error('Use the visible Design canvas with Motion and dialogs closed.');inspectTextBoolean(s.doc,s.pageId,s.selection);}catch(e){reason=e instanceof Error?e.message:String(e);}
 const plan=draft.plan&&draft.proof?.valid?draft.plan:undefined;
 return <div className="boolean-text-controls" onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&(e.target as Element).closest('button'))e.stopPropagation();}}>
 <p className="inspector-note">Convert supported text to real vector glyph operands, then create a live Boolean group. Text will stop being editable as text; one Undo restores every original layer and its metadata.</p>
 <label>Operation<select aria-label="Outlined text Boolean operation" value={draft.operation} onChange={e=>{const operation=e.target.value as TextBooleanOperation;run(()=>{guard();if(!['union','subtract','intersect','exclude'].includes(operation))throw Error('Choose an available Boolean operation.');publish({operation});});}}><option value="union">Union</option><option value="subtract">Subtract from first layer</option><option value="intersect">Intersect</option><option value="exclude">Exclude overlap</option></select></label>
 {reason&&<p className="inspector-note">{reason}</p>}
 <button className="outline-button" disabled={!!reason} onClick={review}>Review outlined text Boolean</button>
 {plan&&<><p className="inspector-note">{plan.textCount} text {plan.textCount===1?'layer':'layers'} · {plan.characterCount} characters · {plan.inputAnchors} input / {plan.resultAnchors} result anchors · {Number(plan.area.toPrecision(6))} px² parent-coordinate area.</p><p className="inspector-note">Apply replaces text layers with glyph paths inside the Boolean group. Layer order determines subtraction. The existing Boolean engine serializes paths to five decimal places; unhinted vector edges can differ from native hinted text pixels.</p><button className="primary" onClick={apply}>Apply outlined text Boolean</button></>}
 <p className="inspector-note">Partial static-TTF subset: plain single-line ASCII, exact loaded face, simple glyphs, same opaque solid fill, no strokes. Unsupported shaping, fonts, controllers and geometry refuse; no fallback boxes or screenshots.</p>
 {error&&<p role="alert">{error}</p>}
 </div>;
}
