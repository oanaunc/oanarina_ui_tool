import type {DesignNode} from '../model';
import {isLocked} from '../model';
import {useEditor} from '../store';
import {planLayerRepeat} from '../repeat-layers';
import {repeatFromLive,setLiveRepeat} from '../live-repeat';
import type {LiveRepeat} from '../live-repeat';
import NumberField from './NumberField';
import {notifyError} from '../files';
import {t} from '../i18n';
/** Numbers stay editable after Apply; Expand writes ordinary layers, Remove keeps only the source. */
export default function LiveRepeatControls({n}:{n:DesignNode}){
 const s=useEditor(),o=n.liveRepeat;if(!o)return null;const nodes=s.doc.pages.find(p=>p.id===s.pageId)!.nodes,blocked=s.mode!=='design'||s.motionOpen||isLocked(n,nodes);
 const save=(next:LiveRepeat|undefined)=>{try{useEditor.getState().edit(d=>setLiveRepeat(d,s.pageId,n.id,next));}catch(error){notifyError(error);}};
 const expand=()=>{try{const live=useEditor.getState(),plain=structuredClone(live.doc),page=plain.pages.find(p=>p.id===live.pageId)!,source=page.nodes.find(v=>v.id===n.id)!,options=repeatFromLive(source.liveRepeat!,source,page.nodes);delete source.liveRepeat;const plan=planLayerRepeat(plain,page.id,n.id,options);live.edit(d=>{d.pages.find(p=>p.id===page.id)!.nodes=structuredClone(plan.nodes);});live.set({selection:[n.id,...plan.rootIds]});}catch(error){notifyError(error);}};
 const field=(label:string,value:number,update:(v:number)=>LiveRepeat,min=-1e6,max=1e6)=><NumberField key={label} label={label} value={value} min={min} max={max} onChange={v=>save(update(v))}/>;
 return <fieldset className="live-repeat-controls" disabled={blocked} style={{border:0,padding:0,minInlineSize:0}}><legend>{t(o.kind==='linear'?'Live linear repeat':'Live radial repeat')}</legend>
 {field(t('Live repeat count'),o.count,v=>({...o,count:Math.round(v)}),2,64)}
 {o.kind==='linear'?<>{field(t('Live repeat X step'),o.dx,v=>({...o,dx:v}))}{field(t('Live repeat Y step'),o.dy,v=>({...o,dy:v}))}</>:<>{field(t('Live repeat pivot X offset'),o.offsetX,v=>({...o,offsetX:v}))}{field(t('Live repeat pivot Y offset'),o.offsetY,v=>({...o,offsetY:v}))}{field(t('Live repeat angle'),o.angle,v=>({...o,angle:v}),-3600,3600)}<label className="check-row"><input type="checkbox" aria-label={t('Rotate live copies')} checked={o.rotateCopies} onChange={e=>save({...o,rotateCopies:e.target.checked})}/>{t('Rotate live copies')}</label></>}
 <div className="button-row"><button className="outline-button" onClick={expand}>{t('Expand to layers')}</button><button className="outline-button" onClick={()=>save(undefined)}>{t('Remove repeat')}</button></div><p className="inspector-note">{t('Every copy follows this layer, including its edits and Motion. Copies select this layer; expand them to edit one on its own.')}</p></fieldset>;
}
