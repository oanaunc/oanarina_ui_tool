import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useEditor} from '../store';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {captureTemplateAction,insertTemplate,openTemplate} from '../template-actions';
import {findResourceDocument,illustrationNodes,RESOURCE_LICENSE,resourceGuides,resourceIllustrations,resourceKits,resourceTutorials} from '../resource-library';
import type {ResourceDocument,ResourceGuide,ResourceIllustration} from '../resource-library';
import DocumentCoverPreview from './DocumentCoverPreview';
import {useDocumentDialogFocus} from './useDocumentDialogFocus';
import './resource-library.css';
const tabs=[['kits','UI kits'],['illustrations','Illustrations'],['tutorials','Tutorials'],['guides','Guides']] as const;
type Tab=typeof tabs[number][0];
const dataUrl=(svg:string)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
export default function ResourceLibrary(){
 const s=useEditor(),root=useRef<HTMLDivElement>(null),pending=useRef(false),alive=useRef(true),[tab,setTab]=useState<Tab>('kits'),[query,setQuery]=useState(''),[chosen,setChosen]=useState<string>(resourceKits[0].id),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useDocumentDialogFocus(root);
 const context=useMemo(()=>({origin:captureColorContext(s),valid:true}),[s]);
 useLayoutEffect(()=>{context.valid=sameColorContext(context.origin,useEditor.getState());const off=useEditor.subscribe(live=>{if(!sameColorContext(context.origin,live))context.valid=false;});return()=>{context.valid=false;off();};},[context]);
 useLayoutEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const close=()=>useEditor.getState().set({modal:null}),words=query.trim().toLocaleLowerCase(),matches=(r:{name:string;description:string})=>(r.name+' '+r.description).toLocaleLowerCase().includes(words);
 const list:readonly (ResourceDocument|ResourceIllustration|ResourceGuide)[]=(tab==='kits'?resourceKits:tab==='illustrations'?resourceIllustrations:tab==='tutorials'?resourceTutorials:resourceGuides).filter(matches);
 const selected=list.find(r=>r.id===chosen)??list[0],document_=useMemo(()=>selected&&'create' in selected?selected.create():null,[selected]),preview=useMemo(()=>document_?{...document_,fileCover:undefined}:null,[document_]);
 const run=(fn:()=>Promise<void>|void)=>{if(pending.current)return;pending.current=true;setBusy(true);setError('');void(async()=>{try{await fn();}catch(e){if(alive.current)setError(e instanceof Error?e.message:String(e));}finally{pending.current=false;if(alive.current)setBusy(false);}})();};
 const open=(resource:ResourceDocument)=>run(async()=>{const proof=captureTemplateAction();try{await openTemplate(proof,resource.create(),resource.name);}finally{proof.dispose();}});
 const insert=(resource:ResourceDocument)=>run(()=>{const proof=captureTemplateAction();try{const d=resource.create();insertTemplate(proof,d,d.pages[0].id);}finally{proof.dispose();}});
 const place=(illustration:ResourceIllustration)=>run(()=>{const live=useEditor.getState();if(!context.valid||!sameColorContext(context.origin,live)||live.mode!=='design'||live.home||live.motionOpen||live.uiHidden||live.doc.workspace==='slides')throw Error('Open a Design or Whiteboard canvas in Design mode, then try again.');const page=live.doc.pages.find(p=>p.id===live.pageId)!,imported=illustrationNodes(illustration,80,80),roots=imported.nodes.filter(n=>!n.parentId).map(n=>n.id);if(page.nodes.length+imported.nodes.length>20000)throw Error('This page has no room for more layers.');live.edit(d=>{d.pages.find(p=>p.id===live.pageId)!.nodes.push(...imported.nodes);});const next=useEditor.getState();next.set({selection:roots,modal:null,tool:'move',vectorEditId:null,vectorSelection:[],toast:illustration.name+' inserted as editable vectors'});next.findSelection();});
 const openGuideTutorial=(id:string)=>{const resource=findResourceDocument(id);if(resource)open(resource);};
 return <div className="modal-backdrop"><div ref={root} role="dialog" aria-modal="true" aria-label="UI kits, illustrations and tutorials" tabIndex={-1} className="dialog wide-dialog resource-library" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(['Enter',' '].includes(e.key)&&(e.target as Element).closest('button'))e.stopPropagation();}}><header className="dialog-header"><h2>UI kits, illustrations and tutorials</h2><button aria-label="Close resource library" onClick={close}>Close</button></header><div className="dialog-body">
 <p className="dialog-description">Everything here is installed with Forma and works offline. {RESOURCE_LICENSE}</p>
 <div className="resource-filters"><div role="tablist" aria-label="Resource type">{tabs.map(([id,name])=><button key={id} role="tab" aria-selected={tab===id} onClick={()=>{setTab(id);setError('');}}>{name}</button>)}</div><label>Search resources<input data-initial-focus aria-label="Search resources" maxLength={200} value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
 {error&&<p role="alert">{error}</p>}
 <div className="resource-columns"><div className="resource-list" aria-label="Resources">{list.map(r=><button key={r.id} aria-pressed={selected?.id===r.id} onClick={()=>{setChosen(r.id);setError('');}}>{'svg' in r&&<img alt="" src={dataUrl(r.svg)}/>}<strong>{r.name}</strong><small>{r.description}</small></button>)}{!list.length&&<p>No resources match this search.</p>}</div>
 {selected&&<section className="resource-detail" aria-label="Selected resource"><h3>{selected.name}</h3><p>{selected.description}</p>
 {'svg' in selected&&<><img className="resource-art" alt={'Preview of '+selected.name} src={dataUrl(selected.svg)}/><div className="button-row"><button className="primary-button" disabled={busy} onClick={()=>place(selected)}>Insert on this page</button></div></>}
 {'create' in selected&&preview&&<><div className="resource-art"><DocumentCoverPreview doc={preview}/></div><div className="button-row"><button className="primary-button" disabled={busy} onClick={()=>open(selected)}>Open as new file</button>{tab==='kits'&&<button className="outline-button" disabled={busy} onClick={()=>insert(selected)}>Insert on this page</button>}</div></>}
 {'sections' in selected&&<article>{selected.sections.map(section=><div key={section.heading}><h4>{section.heading}</h4><p>{section.body}</p></div>)}{selected.tutorial&&<div className="button-row"><button className="outline-button" disabled={busy} onClick={()=>openGuideTutorial(selected.tutorial!)}>Open the related tutorial</button></div>}</article>}
 </section>}</div>
 </div></div></div>;
}
