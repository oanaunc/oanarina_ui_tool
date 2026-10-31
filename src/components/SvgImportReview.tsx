import {formatNumber} from '../i18n';
import {svgImportFailureReason} from '../import-task';
import {useEffect,useRef,useState} from 'react';
import {Artwork} from './Artwork';
import {cancelSvgImport,confirmSvgImport,getSvgImportRequest} from '../files';
import './svg-import.css';
export default function SvgImportReview(){const request=getSvgImportRequest(),[error,setError]=useState(''),[busy,setBusy]=useState(false),first=useRef<HTMLButtonElement>(null),visual=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setError('');(first.current?.disabled?visual.current:first.current)?.focus();},[request]);
 if(!request)return <p>No SVG import is pending.</p>;
 const result=request.result,choose=async(mode:'editable'|'visual')=>{setBusy(true);setError('');try{await confirmSvgImport(mode,request!);}catch(e){setError(svgImportFailureReason(e));}finally{setBusy(false);}};
 return <div className="svg-import-review"><p className="dialog-description"><strong>{request.name}</strong> · Choose editable layers or a sanitized visual asset. Nothing is added until you choose.</p>
 {result?<><p>{formatNumber(result.nodes.length)} editable layers · {result.width} × {result.height}{result.complete?' · No known feature reductions were detected.':` · ${result.issues.length} import ${result.issues.length===1?'notice':'notices'}.`}</p>{result.nodes.length<1000&&<svg aria-label="Editable SVG preview" className="svg-import-preview" viewBox={`${result.nodes[0].x} ${result.nodes[0].y} ${result.width} ${result.height}`}><Artwork live nodes={result.nodes}/></svg>}{result.issues.length>0&&<section aria-label="SVG import notices" className="svg-import-notices"><h3>Review these changes</h3><ul>{result.issues.map((issue,i)=><li key={i}><strong>{issue.element?issue.element+': ':''}{issue.message}</strong><small>{issue.code}</small></li>)}</ul></section>}</>:<p role="alert" className="svg-import-error">Editable import is unavailable: {request.error}</p>}
 <p className="small-note">Editable import preserves supported shapes, paths, text and hierarchy. Fonts and SVG viewers can change appearance. The visual option keeps one image layer and removes active content, external resources and unsupported markup; sanitization can change its appearance. Use File → Open for supported binary .fig Design files.</p>
 {error&&<p role="alert" className="svg-import-error">{error}</p>}<div className="button-row"><button ref={first} className="primary-button" disabled={busy||!result||result.nodes.length<2} onClick={()=>void choose('editable')}>Import editable layers</button><button ref={visual} className="outline-button" disabled={busy} onClick={()=>void choose('visual')}>Import sanitized visual asset</button><button className="outline-button" disabled={busy} onClick={()=>cancelSvgImport(request)}>Cancel SVG import</button></div></div>;
}
