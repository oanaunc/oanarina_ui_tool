import {useLayoutEffect,useMemo,useState} from 'react';
import {useEditor} from '../store';
import {usePreferences} from '../preferences';
import {builderProof,builderTarget,sameBuilderProof,subscribeBuilderProof,useShapeBuilder,commitShapeBuilder} from '../shape-builder-actions';
import {shapeBuilderOutput} from '../shape-builder';
import type {BuilderOperation} from '../shape-builder';
import {notifyError} from '../files';
import './shape-builder.css';
export default function ShapeBuilderControls(){
 const s=useEditor(),prefs=usePreferences(),view=useShapeBuilder(),c=view.context,[epoch,setEpoch]=useState({}),[error,setError]=useState(''),proof=useMemo(()=>builderProof(),[s.doc,s.pageId,s.selection,s.mode,s.modal,s.home,s.uiHidden,s.motionOpen,s.motionTime,s.fontRevision,s.tool,s.vectorEditId,s.outlines,s.zoom,s.pan.x,s.pan.y,prefs.uiScale,c,epoch]),life=useMemo(()=>({mounted:false}),[proof]);
 useLayoutEffect(()=>{life.mounted=true;const captured=c,check=()=>{if(proof.valid&&(!sameBuilderProof(proof)||useShapeBuilder.getState().context!==captured)){proof.valid=false;setEpoch({});}},interrupt=()=>{proof.valid=false;setEpoch({});},hidden=()=>{if(document.hidden)interrupt();},off=subscribeBuilderProof(check);window.addEventListener('blur',interrupt);window.addEventListener('resize',interrupt);document.addEventListener('visibilitychange',hidden);return()=>{life.mounted=false;off();window.removeEventListener('blur',interrupt);window.removeEventListener('resize',interrupt);document.removeEventListener('visibilitychange',hidden);};},[proof,life,c]);
 const run=(fn:()=>void)=>{try{if(!life.mounted||document.hidden||!sameBuilderProof(proof)||useShapeBuilder.getState().context!==c)throw Error('The Shape builder controls changed. Try the current controls.');fn();setError('');}catch(e){setError(e instanceof Error?e.message:String(e));notifyError(e);}};
 let reason='';if(!c)try{builderTarget(proof);}catch(e){reason=e instanceof Error?e.message:String(e);}
 const review=useMemo(()=>{if(!c||!c.regions.length)return null;try{return {result:shapeBuilderOutput(c.plan,c.operation,c.regions),error:''};}catch(e){return {result:null,error:e instanceof Error?e.message:String(e)};}},[c]);
 return <div className="shape-builder-controls" onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&(e.target as HTMLElement).closest('button'))e.stopPropagation();}}>
 {!c?<><button className="outline-button" disabled={!!reason} onClick={()=>run(()=>view.activate(proof))}>Start Shape builder</button><p className="inspector-note">{reason||'Regions from consecutive shapes. A region keeps the fill and stroke of the topmost shape over it, and an unfilled open path divides what it crosses. Plain rectangles use exact geometry; other shapes use curve booleans, limited to 8 shapes and 64 regions.'}</p></>:<>
 <p className="inspector-note">{c.plan.sourceIds.length} source shapes · {c.plan.arrangement.regions.length} regions. Drag to pick regions; Option-drag chooses subtraction. Nothing changes until Apply.</p>
 <label>Operation<select aria-label="Shape builder operation" value={c.operation} onChange={e=>run(()=>view.operation(c,e.target.value as BuilderOperation))}><option value="merge">Merge picked regions</option><option value="extract">Extract one region</option><option value="subtract">Subtract picked regions</option></select></label>
 <label>Regions<select multiple size={5} aria-label="Shape builder regions" value={c.regions.map(String)} onChange={e=>{const ids=[...e.currentTarget.selectedOptions].map(o=>Number(o.value));run(()=>view.choose(c,ids));}}>{c.plan.arrangement.regions.map(r=><option key={r.id} value={r.id}>Region {r.id+1} · {r.sources.length} {r.sources.length===1?'source':'sources'} · {Number(r.area.toPrecision(6))} px²</option>)}</select></label>
 <div className="button-row"><button className="outline-button" onClick={()=>run(()=>view.choose(c,c.plan.arrangement.regions.map(r=>r.id)))}>Pick all regions</button><button className="outline-button" disabled={!c.regions.length} onClick={()=>run(()=>view.choose(c,[]))}>Clear picked regions</button></div>
 <p className="inspector-note">{review?.error||review?.result?review?.error||`${c.regions.length} picked · ${review!.result!.outputs.length} resulting path layers. ${review!.result!.outputs.length?'Unpicked area remains as an editable path.':'All selected source geometry will be removed.'}`:'Pick at least one region. Extract needs exactly one.'}</p>
 <button className="primary" disabled={!review?.result} onClick={()=>run(()=>commitShapeBuilder(c))}>Apply Shape builder</button><button className="outline-button" onClick={()=>run(()=>view.reset())}>Cancel Shape builder</button>
 <p className="inspector-note">Apply replaces the selected source layers and their metadata with ordinary editable paths. A line goes where it borders a region; what runs beyond every region stays as a line. One Undo restores every original source. Split edges can show native antialiasing differences.</p>
 </>}{error&&<p role="alert">{error}</p>}
 </div>;
}
