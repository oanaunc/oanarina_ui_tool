import type {DesignDocument,DesignNode} from './model';
import {contrastRatio} from './contrast';
import {fillsFor} from './paints';
import type {Paint} from './paints';
import {axisAligned,documentIndexes,hexColor,hexToHsl,hslToHex,pageIndex,rgbToHex,hexToRgb} from './audit-index';
import type {AuditBox,AuditLayer,PageIndex} from './audit-index';
/** Automatic WCAG 1.4.3 estimate from saved layer data. Anything it cannot prove is "not evaluated", never a pass. */
export type ContrastLevel='fail'|'aa'|'aaa'|'not-evaluated';
export interface ContrastFinding {layer:AuditLayer;text:string;level:ContrastLevel;ratio:number|null;required:number;large:boolean;foreground:string|null;background:string|null;reason:string;notes:string[];fixColor?:string;fixBlocked?:string;}
export interface ContrastAudit {findings:ContrastFinding[];evaluated:number;complete:boolean;warnings:string[];}
export const LARGE_TEXT_PX=24,LARGE_BOLD_TEXT_PX=56/3;
export const isLargeText=(size:number,weight:number)=>size>=LARGE_TEXT_PX||size>=LARGE_BOLD_TEXT_PX&&weight>=700;
const flatten=(top:[number,number,number],alpha:number,base:[number,number,number])=>top.map((v,i)=>v*alpha+base[i]*(1-alpha)) as [number,number,number];
const preview=(s:string)=>s.length>80?s.slice(0,80)+'…':s;
type Surface={kind:'none'}|{kind:'solid';colors:{hex:string;alpha:number}[]}|{kind:'complex';reason:string};
/** Paint index 0 renders on top. A gradient yields each stop so a later minimum is a worst case over the ramp. */
function surface(n:DesignNode,baseAlpha:number):Surface{
 if(n.media)return {kind:'complex',reason:'video surface'};
 const paints=fillsFor(n).filter(p=>p.visible&&p.opacity>0);if(!paints.length)return {kind:'none'};
 const top=paints[0];if(top.type==='image')return {kind:'complex',reason:'image paint'};
 if(paints.length>1&&paints.some(p=>p.type!=='solid'))return {kind:'complex',reason:'stacked gradient or image paints'};
 const solid=(p:Paint)=>({hex:p.color,alpha:p.opacity*baseAlpha});
 if(top.type==='solid'){if(!hexColor(top.color))return {kind:'complex',reason:'unreadable paint color'};if(paints.length===1)return {kind:'solid',colors:[solid(top)]};let base:[number,number,number]=hexToRgb(paints.at(-1)!.color),cover=paints.at(-1)!.opacity;for(const p of [...paints.slice(0,-1)].reverse()){const rgb=hexToRgb(p.color);base=flatten(rgb,p.opacity,base);cover=p.opacity+cover*(1-p.opacity);}return {kind:'solid',colors:[{hex:rgbToHex(...base),alpha:cover*baseAlpha}]};}
 const stops=top.stops.filter(s=>hexColor(s.color));if(!stops.length)return {kind:'complex',reason:'gradient without stops'};return {kind:'solid',colors:stops.map(s=>({hex:s.color,alpha:s.opacity*top.opacity*baseAlpha}))};
}
const blended=(n:DesignNode)=>!!n.blendMode&&!['normal','pass-through'].includes(n.blendMode);
const backdrop=(n:DesignNode)=>!!n.effects?.some(e=>e.visible!==false&&e.type==='background-blur');
const touches=(a:AuditBox,b:AuditBox)=>a.x<b.right&&b.x<a.right&&a.y<b.bottom&&b.y<a.bottom;
const covers=(outer:AuditBox,inner:AuditBox)=>outer.x<=inner.x+.01&&outer.y<=inner.y+.01&&outer.right>=inner.right-.01&&outer.bottom>=inner.bottom-.01;
/** Walks painter order downward. A partial overlap or complex paint withholds the result instead of guessing. */
function backgroundFor(index:PageIndex,text:DesignNode,position:number,budget:{work:number}):{colors:string[];reason:string;notes:string[];describe:string}{
 const box=index.box(text),layers:{colors:{hex:string;alpha:number}[]}[]=[],notes:string[]=[];let opaque=false;
 if(text.textBackground)return {colors:[text.textBackground.toLowerCase()],reason:'',notes:['Saved text background used.'],describe:text.textBackground.toLowerCase()};
 for(let j=position-1;j>=0&&!opaque;j--){
  budget.work++;const n=index.order[j];if(n.type==='text'||n.type==='slice'||n.type==='line'||n.type==='arrow'||!index.visible(n))continue;const other=index.box(n);if(!touches(other,box))continue;
  const result=surface(n,index.opacity(n));if(result.kind==='none')continue;
  const name='“'+preview(n.name)+'”';
  if(result.kind==='complex')return {colors:[],reason:'Background '+name+' uses '+result.reason+'.',notes,describe:''};
  if(blended(n))return {colors:[],reason:'Background '+name+' uses a blend mode.',notes,describe:''};
  if(n.mask)return {colors:[],reason:'Background '+name+' is a mask source.',notes,describe:''};
  if(backdrop(n))return {colors:[],reason:'Background '+name+' uses background blur.',notes,describe:''};
  if(!covers(other,box))return {colors:[],reason:name+' only partly covers this text.',notes,describe:''};
  if(!axisAligned(index.matrix(n)))return {colors:[],reason:'Background '+name+' is rotated.',notes,describe:''};
  if(['ellipse','polygon','star','path'].includes(n.type))return {colors:[],reason:'Background '+name+' is not rectangular.',notes,describe:''};
  layers.push({colors:result.colors});if(result.colors.every(c=>c.alpha>=.999))opaque=true;
 }
 let base:string[]=[];
 if(!opaque){const b=index.page.background;if(!b||!b.visible||b.opacity<1)return {colors:[],reason:'No opaque layer sits behind this text; the canvas follows the app theme.',notes,describe:''};base=[b.color.toLowerCase()];}
 else base=layers.pop()!.colors.map(c=>c.hex.toLowerCase());
 for(const layer of layers.reverse())base=[...new Set(base.flatMap(under=>layer.colors.map(c=>rgbToHex(...flatten(hexToRgb(c.hex),c.alpha,hexToRgb(under))))))];
 if(base.length>64)base=base.slice(0,64);
 if(base.length>1)notes.push('Worst gradient stop of the background used.');
 return {colors:base,reason:'',notes,describe:base[0]};
}
/** Nearest lightness in the same hue that clears the target, or undefined if neither direction reaches it. */
export function suggestPassingColor(foreground:string,background:string,target:number,opacity=1){
 if(!hexColor(foreground)||!hexColor(background)||!Number.isFinite(target)||target<1||target>21)throw Error('Enter valid colors and a contrast target.');
 const [h,s,l]=hexToHsl(foreground);let best:string|undefined,distance=Infinity;
 for(const direction of [-1,1])for(let step=1;step<=100;step++){const lightness=l+direction*step/100;if(lightness<0||lightness>1)break;const candidate=hslToHex(h,s,lightness);if(contrastRatio(candidate,background,opacity)>=target){if(step<distance){distance=step;best=candidate;}break;}}
 return best;
}
const fixBlockReason=(n:DesignNode,index:PageIndex)=>index.locked(n)?'Unlock this layer to change its color.':index.managed(n)?'Edit the main component to change this color.':n.variableBindings?.fill?'This fill is bound to a variable. Edit the token instead.':n.styleIds?.paint?'This fill uses a paint style. Edit the style instead.':n.textRuns?.some(r=>r.fill)?'Mixed text colors need a manual edit.':fillsFor(n).filter(p=>p.visible).length!==1||fillsFor(n).find(p=>p.visible)?.type!=='solid'?'Only one solid text fill can be adjusted automatically.':undefined;
export function auditContrast(doc:DesignDocument,limits:{maxWork?:number}={}):ContrastAudit{
 const maxWork=limits.maxWork??8_000_000,findings:ContrastFinding[]=[],warnings=new Set<string>(),budget={work:0};let evaluated=0,complete=true;
 for(const index of documentIndexes(doc)){
  const positions=new Map(index.order.map((n,i)=>[n.id,i]));
  for(const n of index.order){
   if(n.type!=='text'||!n.text.trim()||!index.visible(n)||n.opacity<=0)continue;
   if(budget.work>maxWork){complete=false;warnings.add('Audit work limit reached. Later text layers were not evaluated.');break;}
   const size=n.fontSize,weight=n.fontWeight,large=isLargeText(size,weight),base={layer:index.layer(n),text:preview(n.text),large,required:large?3:4.5};
   const skip=(reason:string,notes:string[]=[]):void=>{findings.push({...base,level:'not-evaluated',ratio:null,foreground:null,background:null,reason,notes});};
   if(blended(n)){skip('This text uses a blend mode.');continue;}if(n.mask){skip('This text is a mask source.');continue;}
   const paints=surface(n,1);if(paints.kind==='none'){skip('This text has no visible fill.');continue;}if(paints.kind==='complex'){skip('This text uses '+paints.reason+'.');continue;}
   const bg=backgroundFor(index,n,positions.get(n.id)!,budget);if(!bg.colors.length){skip(bg.reason,bg.notes);continue;}
   const notes=[...bg.notes],alpha=index.opacity(n),runs=(n.textRuns??[]).filter(r=>r.end>r.start),samples=runs.length?runs.map(r=>({fill:r.fill,size:r.fontSize??size,weight:r.fontWeight??weight})):[{fill:undefined as string|undefined,size,weight}];
   if(paints.colors.length>1)notes.push('Worst gradient stop of the text fill used.');if(runs.length)notes.push('Worst text range used.');if(n.effects?.some(e=>e.visible!==false))notes.push('Layer effects are not included in this ratio.');if(alpha<1)notes.push('Layer and ancestor opacity included.');
   let worst:{ratio:number;required:number;large:boolean;fg:string;bg:string}|undefined;
   for(const sample of samples)for(const fg of sample.fill?[{hex:sample.fill,alpha:1}]:paints.colors)for(const back of bg.colors){const isLarge=isLargeText(sample.size,sample.weight),required=isLarge?3:4.5,ratio=contrastRatio(fg.hex.toLowerCase(),back,Math.min(1,fg.alpha*alpha));if(!worst||ratio/required<worst.ratio/worst.required)worst={ratio,required,large:isLarge,fg:fg.hex.toLowerCase(),bg:back};}
   if(!worst){skip('No readable text color.');continue;}evaluated++;
   const aaa=worst.large?4.5:7,level:ContrastLevel=worst.ratio<worst.required?'fail':worst.ratio<aaa?'aa':'aaa',blocked=level==='fail'?fixBlockReason(n,index):undefined,fixColor=level==='fail'&&!blocked?suggestPassingColor(worst.fg,worst.bg,worst.required,Math.min(1,alpha)):undefined;
   findings.push({...base,large:worst.large,required:worst.required,level,ratio:worst.ratio,foreground:worst.fg,background:worst.bg,reason:'',notes,...(fixColor?{fixColor}:{}),...(level==='fail'&&!fixColor?{fixBlocked:blocked??'No lightness in this hue reaches the target.'}:{})});
  }
 }
 return {findings,evaluated,complete,warnings:[...warnings]};
}
/** Draft mutator for one text color. Refuses bound, managed, locked and mixed text rather than detaching silently. */
export function applyContrastFix(d:DesignDocument,pageId:string,nodeId:string,color:string){
 if(!hexColor(color))throw Error('Choose a valid replacement color.');const page=d.pages.find(p=>p.id===pageId),n=page?.nodes.find(n=>n.id===nodeId);if(!page||!n||n.type!=='text')throw Error('This text layer no longer exists.');
 const reason=fixBlockReason(n,pageIndex(page));if(reason)throw Error(reason);const paints=structuredClone(fillsFor(n)),i=paints.findIndex(p=>p.visible);paints[i].color=color.toLowerCase();n.paints=paints;n.fill=color.toLowerCase();
}
