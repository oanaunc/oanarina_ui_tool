import type {Element as XmlElement} from '@xmldom/xmldom';
import type {Effect} from './effects';
/** Design tools write shadows as a fixed primitive chain. Reading that chain gives editable effects; a chain with any
 * other primitive is reported and left out, because a partial filter would be neither the source look nor editable. */
type Color=(raw:string)=>{color:string;alpha:number}|undefined;
interface Shadow {dx:number;dy:number;blur:number;spread:number;color:string;alpha:number;inner:boolean;}
const fresh=():Shadow=>({dx:0,dy:0,blur:0,spread:0,color:'#000000',alpha:1,inner:false});
const scalar=(el:XmlElement,key:string,fallback=0)=>{const raw=el.getAttribute(key);if(raw===null||raw==='')return fallback;const n=Number(raw.trim().split(/[\s,]+/)[0]);return Number.isFinite(n)?n:fallback;};
const hex=(v:number)=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0');
const clamp=(v:number,low:number,high:number)=>Math.max(low,Math.min(high,v));
const toEffect=(s:Shadow):Effect=>({id:crypto.randomUUID(),type:s.inner?'inner-shadow':'drop-shadow',visible:true,color:s.color,opacity:clamp(s.alpha,0,1),x:clamp(s.dx,-10000,10000),y:clamp(s.dy,-10000,10000),radius:clamp(s.blur,0,1000),spread:clamp(s.spread,-1000,1000)});
export interface SvgFilterResult {effects:Effect[];reduced:string[];supported:boolean;}
export function svgFilterEffects(filter:XmlElement,primitives:XmlElement[],color:Color):SvgFilterResult{
 const out:Effect[]=[],reduced:string[]=[];let shadow:Shadow|undefined,matrixApplied=false;void filter;
 const finish=()=>{if(shadow)out.push(toEffect(shadow));shadow=undefined;matrixApplied=false;};
 for(const p of primitives){const kind=p.localName||p.tagName,input=p.getAttribute('in')??'',result=p.getAttribute('result')??'';
  if(kind==='feFlood'){if(result==='BackgroundImageFix')continue;const c=color(p.getAttribute('flood-color')??'black');shadow??=fresh();if(c){shadow.color=c.color;shadow.alpha=c.alpha*scalar(p,'flood-opacity',1);}continue;}
  if(kind==='feColorMatrix'){if(result==='hardAlpha'||input==='SourceAlpha'){shadow??=fresh();if(input==='SourceAlpha'&&result!=='hardAlpha')continue;continue;}const values=(p.getAttribute('values')??'').trim().split(/[\s,]+/).map(Number);if((p.getAttribute('type')??'matrix')!=='matrix'||values.length!==20||values.some(v=>!Number.isFinite(v)))return {effects:[],reduced,supported:false};shadow??=fresh();shadow.color='#'+hex(values[4])+hex(values[9])+hex(values[14]);shadow.alpha=values[18];matrixApplied=true;continue;}
  if(kind==='feMorphology'){shadow??=fresh();const radius=scalar(p,'radius');shadow.spread=(p.getAttribute('operator')??'erode')==='dilate'?radius:-radius;continue;}
  if(kind==='feOffset'){shadow??=fresh();shadow.dx=scalar(p,'dx');shadow.dy=scalar(p,'dy');continue;}
  if(kind==='feGaussianBlur'){const radius=scalar(p,'stdDeviation')*2;if(input==='BackgroundImageFix'||input==='BackgroundImage'){reduced.push('Background blur was omitted; Forma applies it to root-level shapes only.');continue;}if(!shadow){out.push({id:crypto.randomUUID(),type:'layer-blur',visible:true,color:'#000000',opacity:1,x:0,y:0,radius:clamp(radius,0,1000),spread:0});continue;}shadow.blur=radius;continue;}
  if(kind==='feComposite'){const op=p.getAttribute('operator');if(op==='arithmetic'&&scalar(p,'k2')===-1&&scalar(p,'k3')===1){shadow??=fresh();shadow.inner=true;continue;}if(op==='out')continue;return {effects:[],reduced,supported:false};}
  if(kind==='feDropShadow'){const c=color(p.getAttribute('flood-color')??'black');out.push(toEffect({...fresh(),dx:scalar(p,'dx',2),dy:scalar(p,'dy',2),blur:scalar(p,'stdDeviation',2)*2,color:c?.color??'#000000',alpha:(c?.alpha??1)*scalar(p,'flood-opacity',1)}));continue;}
  if(kind==='feBlend'||kind==='feMerge'){if(shadow&&(matrixApplied||shadow.blur||shadow.dx||shadow.dy||shadow.spread)){finish();}else shadow=undefined;continue;}
  return {effects:[],reduced,supported:false};}
 finish();return {effects:out,reduced,supported:out.length>0||reduced.length>0};
}
