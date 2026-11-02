import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {GitBranch,ShieldCheck,X} from 'lucide-react';
import {useEditor} from '../store';
import {mergeDocuments,committedMerge} from '../branch-merge';
import type {MergeResult,MergeSide} from '../branch-merge';
import {branchStatus,mergeBlock} from '../branches';
import type {BranchRecord,BranchStatus} from '../branches';
import {createBranch,deleteArchivedBranch,readBranchParts,recordBranchReview,setBranchLifecycle,setMainProtection} from '../branch-repository';
import type {BranchParts} from '../branch-repository';
import {openBranchDocument,refreshBranchSession,useBranchSession} from '../branch-session';
import VersionChangeReview from './VersionChangeReview';
import './version-history.css';
import './branches.css';

type Answers=Record<string,MergeSide>;
function ConflictList({plan,answers,choose}:{plan:MergeResult;answers:Answers;choose:(id:string,side:MergeSide)=>void}){
 return <section aria-label="Merge conflicts"><h4>{plan.conflicts.length} conflict{plan.conflicts.length===1?'':'s'}</h4>{!!plan.conflicts.length&&<div className="button-row"><button className="outline-button" onClick={()=>plan.conflicts.forEach(c=>choose(c.id,'ours'))}>Keep main for all</button><button className="outline-button" onClick={()=>plan.conflicts.forEach(c=>choose(c.id,'theirs'))}>Use branch for all</button></div>}
  <ol className="branch-conflicts">{plan.conflicts.map(c=><li key={c.id}><fieldset><legend>{c.label}</legend><p>{c.detail}</p><label><input type="radio" name={'conflict-'+c.id} checked={answers[c.id]==='ours'} onChange={()=>choose(c.id,'ours')}/>Main: {c.ours}</label><label><input type="radio" name={'conflict-'+c.id} checked={answers[c.id]==='theirs'} onChange={()=>choose(c.id,'theirs')}/>Branch: {c.theirs}</label></fieldset></li>)}</ol></section>;
}
function Review({parts,onDone,onBack,refresh}:{parts:BranchParts;onDone:(message:string)=>void;onBack:()=>void;refresh:()=>void}){
 const main=useEditor(s=>s.doc),[note,setNote]=useState(parts.record.review?.note??''),[answers,setAnswers]=useState<Answers>({}),[side,setSide]=useState<'branch'|'main'>('branch'),[error,setError]=useState(''),[reviewed,setReviewed]=useState(parts.record.review),[busy,setBusy]=useState(false),file=useBranchSession(v=>v.file);
 const result=useMemo(()=>{try{return {plan:mergeDocuments(parts.base,main,parts.branch,answers)};}catch(e){return {error:e instanceof Error?e.message:String(e)};}},[parts,main,answers]),plan=result.plan;
 const record={...parts.record,review:reviewed},block=plan?mergeBlock(file??parts.file,record,parts.branch,plan,answers):result.error??'',status=useMemo(()=>{try{return branchStatus(record,parts.base,main,parts.branch,plan);}catch{return undefined;}},[parts,main,plan,reviewed]),compared=side==='branch'?parts.branch:main,older=useMemo(()=>({...parts.base,id:compared.id}),[parts,compared]);
 const markReviewed=async()=>{setBusy(true);setError('');try{const next=await recordBranchReview(parts.record.id,parts.branch.updatedAt,note);setReviewed(next.review);await refreshBranchSession();}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const merge=async()=>{setBusy(true);setError('');try{if(!plan||block)throw Error(block||'This merge is unavailable.');const live=useEditor.getState();if(live.doc!==main)throw Error('Main changed. Review this merge again.');const merged=committedMerge(plan);live.restoreVersion(merged,true);await setBranchLifecycle(parts.record.id,'merged');await refreshBranchSession();refresh();onDone(`“${parts.record.name}” merged into main. Undo is available.`);}catch(e){setError(e instanceof Error?e.message:String(e));setBusy(false);}};
 return <section aria-label={'Review '+parts.record.name}><div className="branch-review-heading"><button className="text-button" onClick={onBack}>← All branches</button><h3>Review “{parts.record.name}”</h3></div>
  {status&&<p role="status">{status.label}{status.reviewed?' · Reviewed at this revision':''}</p>}
  {reviewed?.note&&<p role="note">Review note: {reviewed.note}</p>}
  {result.error&&<p role="alert">{result.error}</p>}
  {plan&&<ConflictList plan={plan} answers={answers} choose={(id,value)=>setAnswers(a=>({...a,[id]:value}))}/>}
  {plan?.warnings.map(w=><p role="note" key={w}>{w}</p>)}
  <div role="group" aria-label="Compared side" className="button-row"><button className="outline-button" aria-pressed={side==='branch'} onClick={()=>setSide('branch')}>Branch changes</button><button className="outline-button" aria-pressed={side==='main'} onClick={()=>setSide('main')}>Main changes since branching</button></div>
  <VersionChangeReview key={side} heading={side==='branch'?'Base → branch':'Base → main'} older={older} current={compared} pageId={compared.pages[0].id}/>
  {error&&<p role="alert">{error}</p>}
  {block&&<p role="status">{block}</p>}
  <label>Review note<textarea aria-label="Review note" maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/></label>
  <div className="button-row"><button className="outline-button" disabled={busy||parts.record.review?.revision===parts.branch.updatedAt&&!!reviewed&&note===(reviewed.note??'')} onClick={()=>void markReviewed()}>Mark as reviewed</button><button className="primary-button" disabled={busy||!!block} onClick={()=>void merge()}>Merge into main</button></div>
 </section>;
}
export default function BranchesDialog(){
 const s=useEditor(),session=useBranchSession(),heading=useId(),dialog=useRef<HTMLDivElement>(null),[name,setName]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[review,setReview]=useState<BranchParts|null>(null),[rows,setRows]=useState<Record<string,BranchStatus>>({}),[revision,setRevision]=useState(0),alive=useRef(true);
 const close=()=>useEditor.getState().set({modal:null});
 useLayoutEffect(()=>{alive.current=true;dialog.current?.querySelector<HTMLElement>('button')?.focus();return()=>{alive.current=false;};},[]);
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');try{await fn();}catch(e){if(alive.current)setError(e instanceof Error?e.message:String(e));}finally{if(alive.current)setBusy(false);}};
 const inBranch=session.role==='branch'&&session.documentId===s.doc.id,branches=session.documentId===s.doc.id?session.file?.branches??[]:[],openable=branches.filter(b=>b.status!=='archived'),archived=branches.filter(b=>b.status==='archived');
 useEffect(()=>{void refreshBranchSession();},[]);
 const openReview=(id:string)=>run(async()=>{const parts=await readBranchParts(id);if(alive.current)setReview(parts);});
 useEffect(()=>{const pending=session.reviewing;if(pending&&session.role==='main'&&session.documentId===s.doc.id){useBranchSession.setState({reviewing:undefined});void openReview(pending);}},[session.reviewing,session.role,session.documentId]);
 // Status comes from real comparisons, one branch per turn so a long list never blocks the dialog.
 useEffect(()=>{if(inBranch||review)return;let current=true;const doc=s.doc;void(async()=>{for(const record of openable){await new Promise(r=>setTimeout(r));if(!current)return;try{const parts=await readBranchParts(record.id);if(!current)return;const next=branchStatus(record,parts.base,doc,parts.branch);setRows(r=>({...r,[record.id]:next}));}catch(e){if(current)setRows(r=>({...r,[record.id]:{state:'up-to-date',ahead:0,behind:0,conflicts:0,reviewed:false,label:e instanceof Error?e.message:'Status unavailable'}}));}}})();return()=>{current=false;};},[inBranch,review,s.doc,revision,branches.length,branches.map(b=>b.status).join()]);
 const create=()=>run(async()=>{const created=await createBranch(s.doc,name);setName('');await refreshBranchSession();const switched=await openBranchDocument(created.document.id);useEditor.getState().set({modal:null,toast:switched?`Now editing branch “${created.record.name}”. Main is unchanged.`:`Branch “${created.record.name}” opened in its own window.`});});
 const open=(record:BranchRecord)=>run(async()=>{await openBranchDocument(record.id);useEditor.getState().set({modal:null});});
 const lifecycle=(record:BranchRecord,next:'archived'|'active')=>run(async()=>{await setBranchLifecycle(record.id,next);await refreshBranchSession();setRevision(v=>v+1);setStatus(next==='archived'?`“${record.name}” archived. Restore it any time.`:`“${record.name}” reopened.`);});
 const remove=(record:BranchRecord)=>run(async()=>{await deleteArchivedBranch(record.id);await refreshBranchSession();setStatus(`“${record.name}” removed from this device.`);});
 const protect=(enabled:boolean)=>run(async()=>{await setMainProtection(s.doc.id,enabled);await refreshBranchSession();setStatus(enabled?'Main is protected. Edits now happen on branches and merges need a review.':'Main protection is off.');});
 const toMain=(thenReview?:string)=>run(async()=>{const mainId=session.file!.mainId;const switched=await openBranchDocument(mainId);if(switched){useBranchSession.setState({reviewing:thenReview});if(!thenReview)close();}else useEditor.getState().set({modal:null,toast:'Main opened in its own window. Review and merge from its Branches dialog.'});});
 return <div className="modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={heading} className="dialog wide-dialog branches-dialog" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),select,input:not([disabled]),[tabindex="0"]')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
  <header className="dialog-header"><div><span className="eyebrow">LOCAL FILE BRANCHES</span><h2 id={heading}>Branches</h2></div><button aria-label="Close dialog" onClick={close}><X size={18}/></button></header>
  <div className="dialog-body">
   {error&&<p role="alert">{error}</p>}{status&&!error&&<p role="status">{status}</p>}
   {review?<Review parts={review} onBack={()=>{setReview(null);setRevision(v=>v+1);}} refresh={()=>setRevision(v=>v+1)} onDone={message=>useEditor.getState().set({modal:null,toast:message})}/>
   :inBranch?<><p className="dialog-description">You are editing the branch <strong>{session.branch!.name}</strong>. Main stays unchanged until you merge from it.</p><div className="button-row"><button className="outline-button" disabled={busy} onClick={()=>void toMain()}>Switch to main</button><button className="primary-button" disabled={busy} onClick={()=>void toMain(session.branch!.id)}>Review and merge</button>{session.branch!.status!=='active'&&<button className="outline-button" disabled={busy} onClick={()=>void lifecycle(session.branch!,'active')}>Reopen branch</button>}</div></>
   :<><p className="dialog-description">Branches are separate working copies on this device. Each keeps the design it started from so changes merge by layer, with an explicit choice wherever main and the branch disagree. Branches stay out of .oui saves; back up important work.</p>
    <label className="branch-protection"><input type="checkbox" disabled={busy} checked={!!session.file?.protected&&session.documentId===s.doc.id} onChange={e=>void protect(e.target.checked)}/><ShieldCheck size={14}/>Protect main: refuse direct edits and require a reviewed branch to merge</label>
    <form className="branch-create" onSubmit={e=>{e.preventDefault();void create();}}><label>New branch name<input aria-label="New branch name" maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><button className="primary-button" type="submit" disabled={busy||!name.trim()}><GitBranch size={14}/>Create branch</button></form>
    {!openable.length&&!archived.length&&<p>No branches yet.</p>}
    {!!openable.length&&<ol className="branch-list" aria-label="Local branches">{openable.map(b=><li key={b.id}><div><strong>{b.name}</strong><span className={'branch-state branch-state-'+(rows[b.id]?.state??'loading')}>{b.status==='merged'?'Merged':rows[b.id]?.label??'Checking…'}</span></div><div className="button-row"><button className="outline-button" disabled={busy} aria-label={'Open '+b.name} onClick={()=>void open(b)}>Open</button><button className="outline-button" disabled={busy} aria-label={'Review '+b.name} onClick={()=>void openReview(b.id)}>Review</button><button className="outline-button" disabled={busy} aria-label={'Archive '+b.name} onClick={()=>void lifecycle(b,'archived')}>Archive</button></div></li>)}</ol>}
    {!!archived.length&&<><h3>Archived</h3><ol className="branch-list" aria-label="Archived branches">{archived.map(b=><li key={b.id}><div><strong>{b.name}</strong><span className="branch-state">Archived</span></div><div className="button-row"><button className="outline-button" disabled={busy} aria-label={'Restore '+b.name} onClick={()=>void lifecycle(b,'active')}>Restore</button><button className="outline-button" disabled={busy} aria-label={'Delete '+b.name} onClick={()=>void remove(b)}>Delete from device</button></div></li>)}</ol></>}</>}
  </div>
 </div></div>;
}
export function BranchIndicator(){
 const session=useBranchSession(),docId=useEditor(s=>s.doc.id),set=useEditor(s=>s.set);
 if(session.documentId!==docId||session.role==='plain')return null;
 const label=session.role==='branch'?session.branch!.name:'main';
 return <button className="branch-indicator" title="Open Branches" aria-label={`Branches: on ${label}${session.file?.protected&&session.role==='main'?', protected':''}`} onClick={()=>set({modal:'branches'})}><GitBranch size={12}/><span>{label}</span>{session.role==='main'&&session.file?.protected&&<ShieldCheck size={12}/>}</button>;
}
