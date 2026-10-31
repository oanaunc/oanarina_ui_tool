import {useEffect,useRef,useState} from 'react';
import {useEditor} from '../store';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {iconLabel,iconSvg,readIconCatalog} from '../icon-library';
import {ICON_DETECTION_LIMITS,selectedIconSignature} from '../icon-detection';
import Detector from '../icon-detection.worker?worker';

type Result={id:number;status:string;loading?:boolean;names?:string[];icons?:number;previews?:Record<string,string>};
/** A local geometry match, not semantic recognition or an ownership attribution. */
export default function AutomaticIconMatch({nodeId,isCurrent}:{nodeId:string;isCurrent:()=>boolean}){
 const s=useEditor(),[retry,setRetry]=useState(0),[result,setResult]=useState<Result>({id:0,status:'Preparing icon match…'}),[page,setPage]=useState(0),serial=useRef(0),active=useRef<{id:number;cancel:()=>void}|null>(null);
 useEffect(()=>{
  const id=++serial.current,origin=captureColorContext(useEditor.getState()),controller=new AbortController();let worker:Worker|undefined,timer:ReturnType<typeof setTimeout>|undefined,current=true,off=()=>{};
  const clean=()=>{controller.abort();if(timer)clearTimeout(timer);worker?.terminate();worker=undefined;off();if(active.current?.id===id)active.current=null;};
  const canceled=(status:string)=>{if(!current)return;current=false;clean();setResult({id,status});};
  active.current={id,cancel:()=>canceled('Icon matching canceled. Retry for the current selection.')};setPage(0);
  if(s.mode!=='inspect'||s.modal||s.home||s.uiHidden||s.motionOpen){setResult({id,status:'Use Inspect with dialogs and Motion closed to match stored vector geometry.'});clean();return;}
  let signature:ReturnType<typeof selectedIconSignature>;
  try{signature=selectedIconSignature(s.doc.pages.find(p=>p.id===s.pageId)!.nodes,nodeId);}catch(error){setResult({id,status:error instanceof Error?error.message:'This selection cannot be matched.'});clean();return;}
  off=useEditor.subscribe(live=>{if(!sameColorContext(origin,live))canceled('The inspection source changed. Retry for the current selection.');});
  setResult({id,status:'Matching installed icon geometry…',loading:true});timer=setTimeout(()=>canceled('Icon matching exceeded its 15-second limit. Retry with a smaller icon.'),ICON_DETECTION_LIMITS.milliseconds);
  void(async()=>{try{
   const catalog=await readIconCatalog(await fetch('./icon-catalog.json',{signal:controller.signal}),controller.signal);if(!current||!isCurrent()||!sameColorContext(origin,useEditor.getState()))return;
   worker=new Detector();worker.onerror=event=>{event.preventDefault();canceled('The local icon matcher could not finish. Retry to restart it.');};worker.onmessage=event=>{if(!current||event.data?.id!==id||!isCurrent()||!sameColorContext(origin,useEditor.getState()))return;const value=event.data?.result,names=value?.names,known=new Map(catalog.icons.map(i=>[i.name,i]));if(event.data.ok!==true||!Array.isArray(names)||names.length>catalog.icons.length||new Set(names).size!==names.length||names.some(n=>typeof n!=='string'||!known.has(n))||value.icons!==catalog.icons.length||value.tolerance!==ICON_DETECTION_LIMITS.tolerance){canceled('The installed geometry could not be matched within its limits.');return;}current=false;clean();setResult({id,status:names.length?`${names.length} matching catalog ${names.length===1?'entry':'entries'} out of ${catalog.icons.length}.`:`No matching geometry in ${catalog.icons.length} installed Lucide icons.`,names,icons:catalog.icons.length,previews:Object.fromEntries(names.map(n=>[n,iconSvg(known.get(n)!,32,'#8c78b1',2)]))});};worker.postMessage({id,catalog,signature});
  }catch{if(current&&!controller.signal.aborted)canceled('The installed icon catalog is unavailable. Retry to reload it.');}})();
  return()=>{current=false;clean();};
 },[s.doc,s.pageId,s.mode,s.modal,s.home,s.uiHidden,s.motionOpen,nodeId,retry]);
 const names=result.names??[],pages=Math.ceil(names.length/20),offset=Math.min(page,Math.max(0,pages-1))*20;
 return <section className="inspector-section" aria-label="Automatic icon geometry match" onKeyDown={e=>{if(e.key===' '||e.key==='Enter')e.stopPropagation();}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter')e.stopPropagation();}}><h3>Automatic icon match</h3><p role="status">{result.status}</p>{result.loading?<button className="outline-button" onClick={()=>{if(active.current?.id===result.id)active.current.cancel();}}>Cancel icon matching</button>:<button className="outline-button" onClick={()=>setRetry(v=>v+1)}>Retry icon matching</button>}{names.length>0&&<ul>{names.slice(offset,offset+20).map(name=><li key={name}>{result.previews?.[name]&&<img width={24} height={24} alt="" src={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(result.previews[name])}/>}<span>{iconLabel(name)}</span></li>)}</ul>}{pages>1&&<div className="button-row"><button disabled={offset===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Previous icon matches</button><span>{offset+1}–{Math.min(offset+20,names.length)} of {names.length}</span><button disabled={offset+20>=names.length} onClick={()=>setPage(p=>p+1)}>Next icon matches</button></div>}<p className="inspector-note">Offline catalog geometry comparison in the container’s normalized 24 × 24 viewport, within 0.0001 units. Names, colors, stroke weight, root pose and semantic meaning are not matched. Multiple results remain ambiguous; a match is not proof of origin or licensing. Source artwork and Undo are unchanged.</p><a href="./licenses/lucide.txt" target="_blank" rel="noopener noreferrer">Installed Lucide license</a></section>;
}
