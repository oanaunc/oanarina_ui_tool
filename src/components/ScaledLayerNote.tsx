import {notifyError} from '../files';
import {t} from '../i18n';
import type {DesignNode} from '../model';
import {applyLayerScale,layerScale,scaleApplyRefusal} from '../scale-apply';
import {useEditor} from '../store';
const percent=(v:number)=>Math.round(Math.abs(v)*1000)/10;
const px=(v:number)=>Math.round(Math.abs(v)*100)/100;
/** Scaled layers keep their authored numbers, so the panel states what is on the canvas and offers to make those numbers real. */
export default function ScaledLayerNote({n}:{n:DesignNode}){const s=useEditor(),scale=layerScale(n);if(!scale)return null;const page=s.doc.pages.find(p=>p.id===s.pageId),refusal=page?scaleApplyRefusal(page,n.id):'',disabled=s.motionOpen||s.mode!=='design';return <div className="inspector-note" role="note"><p>{t('Shown at {x}% × {y}% · {width} × {height} px on canvas. Fields show the size before scale.',{x:percent(scale.x),y:percent(scale.y),width:px(n.width*scale.x),height:px(n.height*scale.y)})}</p><button className="text-button" disabled={disabled||Boolean(refusal)} title={refusal?t(refusal):undefined} onClick={()=>{try{s.edit(d=>applyLayerScale(d,s.pageId,n.id));}catch(error){notifyError(error);}}}>{t('Apply scale to values')}</button>{refusal&&<small>{t(refusal)}</small>}</div>;}
