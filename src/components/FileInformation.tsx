import {useId,useState} from 'react';
import {applyDocumentDescription,DOCUMENT_DESCRIPTION_LIMIT,normalizedDocumentDescription} from '../document-metadata';
import {useEditor} from '../store';
import ColorProfileControl from './ColorProfileControl';
import './file-information.css';

export default function FileInformation(){
 const s=useEditor(),doc=s.doc,[original]=useState(()=>({id:doc.id,description:doc.description})),[description,setDescription]=useState(doc.description??''),[edited,setEdited]=useState(false),[error,setError]=useState(''),hint=useId();
 let validation='',next:string|undefined;try{next=normalizedDocumentDescription(description);}catch(e){validation=(e as Error).message;}
 const changed=edited&&!validation&&next!==original.description,workspace=doc.workspace==='whiteboard'?'Whiteboard':doc.workspace==='slides'?'Presentation':'Design';
 const close=()=>s.set({modal:null});
 const save=(e:React.FormEvent)=>{e.preventDefault();try{if(!changed)return;s.edit(d=>{applyDocumentDescription(d,description,original);});close();}catch(e){setError(e instanceof Error?e.message:'Unable to save file description.');}};
 return <form className="file-information" onSubmit={save}>
  <dl className="file-information-facts">
   <div><dt>File name</dt><dd>{doc.name}</dd></div>
   <div><dt>Project ID</dt><dd><input aria-label="Project ID" readOnly value={doc.id} onFocus={e=>e.currentTarget.select()}/></dd></div>
   <div><dt>Workspace</dt><dd>{workspace}</dd></div><div><dt>Project format</dt><dd>.oui · version {doc.version}</dd></div>
   <div><dt>Pages</dt><dd>{doc.pages.length.toLocaleString()}</dd></div><div><dt>Layers</dt><dd>{doc.pages.reduce((count,page)=>count+page.nodes.length,0).toLocaleString()}</dd></div>
   <div className="file-information-modified"><dt>Last changed</dt><dd><time dateTime={doc.updatedAt}>{new Date(doc.updatedAt).toLocaleString()}</time></dd></div>
  </dl>
  <ColorProfileControl/>
  <label className="file-information-description"><span>File description</span><textarea aria-label="File description" aria-describedby={hint} autoFocus rows={6} maxLength={DOCUMENT_DESCRIPTION_LIMIT} value={description} onChange={e=>{setDescription(e.target.value);setEdited(true);setError('');}} placeholder="What is this file for?"/></label>
  <div className="file-information-help" id={hint}><span>Plain text, saved with your .oui project.</span><span>{description.length.toLocaleString()} / {DOCUMENT_DESCRIPTION_LIMIT.toLocaleString()}</span></div>
  {(error||validation)&&<p className="file-information-error" role="alert">{error||validation}</p>}
  <div className="button-row"><button className="primary-button" type="submit" disabled={!changed}>Save description</button><button className="outline-button" type="button" disabled={!description.length&&(edited||original.description===undefined)} onClick={()=>{setDescription('');setEdited(true);setError('');}}>Clear description</button><button className="outline-button" type="button" onClick={close}>Cancel</button></div>
 </form>;
}
