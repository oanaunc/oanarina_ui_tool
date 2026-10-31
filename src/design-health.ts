import type {DesignDocument} from './model';
import {fillsFor} from './paints';
import {auditColors} from './audit-colors';
import type {ColorAudit} from './audit-colors';
import {auditContrast} from './audit-contrast';
import type {ContrastAudit} from './audit-contrast';
import {auditTokens} from './audit-tokens';
import type {TokenAudit} from './audit-tokens';
import {auditDetachedInstances,auditUnusedStyles,detachedLabels} from './audit-assets';
import type {DetachedAudit,StyleAudit} from './audit-assets';
import {transferReport,transferTargets} from './transfer-compatibility';
import type {TransferReport} from './transfer-compatibility';
import {documentIndexes} from './audit-index';
import type {AuditLayer} from './audit-index';
/** One headless reading of a document. Statuses are rule counts, not a quality score: "clear" only means no rule fired. */
export type HealthStatus='clear'|'review'|'attention';
export interface HealthCategory {id:HealthTab;label:string;status:HealthStatus;count:number;summary:string;}
export type HealthTab='contrast'|'colors'|'tokens'|'styles'|'instances'|'hygiene'|'transfer';
export interface HygieneFinding {id:string;label:string;layers:AuditLayer[];count:number;advice:string;}
export interface HygieneAudit {findings:HygieneFinding[];fontFamilies:string[];fontSizes:number[];layers:number;pages:number;embeddedImageBytes:number;}
export interface DesignHealth {generatedFrom:{name:string;updatedAt:string};categories:HealthCategory[];contrast:ContrastAudit;colors:ColorAudit;tokens:TokenAudit;styles:StyleAudit;instances:DetachedAudit;hygiene:HygieneAudit;transfer:TransferReport;}
const DEFAULT_NAME=/^(Frame|Group|Rectangle|Ellipse|Line|Arrow|Polygon|Star|Text|Path|Image|Section|Slice)( \d+)?$/;
const FONT_FAMILY_ADVISORY=4,FONT_SIZE_ADVISORY=10;
export function auditHygiene(doc:DesignDocument):HygieneAudit{
 const hidden:AuditLayer[]=[],empty:AuditLayer[]=[],named:AuditLayer[]=[],invisible:AuditLayer[]=[],families=new Set<string>(),sizes=new Set<number>(),images=new Set<string>();let layers=0;
 for(const index of documentIndexes(doc)){const parents=new Set(index.page.nodes.map(n=>n.parentId));for(const n of index.page.nodes){layers++;const managed=index.managed(n);if(n.type==='text'&&n.text.trim()){families.add(n.fontFamily);sizes.add(n.fontSize);for(const r of n.textRuns??[]){if(r.fontFamily)families.add(r.fontFamily);if(r.fontSize)sizes.add(r.fontSize);}}for(const p of fillsFor(n))if(p.type==='image'&&p.image)images.add(p.image);if(n.image)images.add(n.image);if(managed)continue;
  if(!n.visible)hidden.push(index.layer(n));else if(n.opacity===0)invisible.push(index.layer(n));
  if(['frame','group'].includes(n.type)&&!parents.has(n.id)&&!fillsFor(n).some(p=>p.visible&&p.opacity>0)&&!n.slotInstance)empty.push(index.layer(n));
  if(DEFAULT_NAME.test(n.name)&&(n.parentId===null||['frame','section','component'].includes(n.type)))named.push(index.layer(n));
 }}
 const findings=[{id:'hidden',label:'Hidden layers',layers:hidden,advice:'Review whether these layers are still needed. Hidden layers still ship in .oui files.'},{id:'invisible',label:'Visible layers at 0% opacity',layers:invisible,advice:'These layers render nothing but still receive pointer events.'},{id:'empty',label:'Empty unpainted containers',layers:empty,advice:'These frames and groups have no children and no visible fill.'},{id:'default-names',label:'Top-level or container layers with default names',layers:named,advice:'Named layers make handoff, search and audits easier to read.'}].filter(f=>f.layers.length).map(f=>({...f,count:f.layers.length}));
 return {findings,fontFamilies:[...families].sort(),fontSizes:[...sizes].sort((a,b)=>a-b),layers,pages:doc.pages.length,embeddedImageBytes:[...images].reduce((sum,value)=>sum+Math.floor(value.length*.75),0)};
}
const plural=(n:number,one:string,many=one+'s')=>n+' '+(n===1?one:many);
const status=(attention:number,review:number):HealthStatus=>attention?'attention':review?'review':'clear';
export function buildDesignHealth(doc:DesignDocument):DesignHealth{
 const contrast=auditContrast(doc),colors=auditColors(doc),tokens=auditTokens(doc),styles=auditUnusedStyles(doc),instances=auditDetachedInstances(doc),hygiene=auditHygiene(doc),transfer=transferReport(doc);
 const fails=contrast.findings.filter(f=>f.level==='fail').length,skipped=contrast.findings.filter(f=>f.level==='not-evaluated').length,broken=tokens.issues.filter(i=>['missing-variable','missing-style','wrong-style-kind'].includes(i.kind)).length,orphans=instances.findings.filter(f=>f.kind==='orphaned').length,hygieneCount=hygiene.findings.reduce((sum,f)=>sum+f.count,0),typeSprawl=Number(hygiene.fontFamilies.length>FONT_FAMILY_ADVISORY)+Number(hygiene.fontSizes.length>FONT_SIZE_ADVISORY);
 const categories:HealthCategory[]=[
  {id:'contrast',label:'Contrast',status:status(fails,skipped),count:fails+skipped,summary:plural(fails,'failure')+', '+skipped+' not evaluated, of '+plural(contrast.evaluated+skipped,'text layer')},
  {id:'colors',label:'Duplicate colors',status:status(0,colors.groups.length+colors.paletteDuplicates),count:colors.groups.length+colors.paletteDuplicates,summary:plural(colors.groups.length,'duplicate group')+' across '+plural(colors.uniqueColors,'unique color')},
  {id:'tokens',label:'Token consistency',status:status(broken,tokens.issues.length),count:tokens.issues.length,summary:plural(tokens.issues.length,'finding')+(tokens.coverage===null?'':', '+Math.round(tokens.coverage*100)+'% of checked values linked')},
  {id:'styles',label:'Unused styles',status:status(0,styles.unused),count:styles.unused,summary:styles.complete?plural(styles.unused,'unused style')+' of '+styles.rows.length:'Scan incomplete. Unused status withheld.'},
  {id:'instances',label:'Detached instances',status:status(orphans,instances.findings.length),count:instances.findings.length,summary:plural(instances.findings.length,'finding')+' across '+plural(instances.instances,'instance')},
  {id:'hygiene',label:'Layer hygiene',status:status(0,hygieneCount+typeSprawl),count:hygieneCount+typeSprawl,summary:plural(hygieneCount,'layer')+' to review, '+plural(hygiene.fontFamilies.length,'font family','font families')+', '+plural(hygiene.fontSizes.length,'font size')},
  {id:'transfer',label:'Transfer',status:status(0,transfer.findings.length),count:transfer.findings.length,summary:plural(transfer.findings.length,'reduced feature')},
 ];
 return {generatedFrom:{name:doc.name,updatedAt:doc.updatedAt},categories,contrast,colors,tokens,styles,instances,hygiene,transfer};
}
const layerRow=(l:AuditLayer)=>({page:l.pageName,layer:l.nodeName,type:l.type,hidden:l.hidden,locked:l.locked,managed:l.managed});
/** Layer names and color values only. Embedded images, fonts, comments and text beyond a short preview are excluded. */
export function healthJson(h:DesignHealth){return JSON.stringify({format:'forma-design-health',version:1,document:h.generatedFrom,categories:h.categories,contrast:{evaluated:h.contrast.evaluated,complete:h.contrast.complete,findings:h.contrast.findings.map(({layer,fixColor:_,...f})=>({...f,...layerRow(layer)}))},colors:{uniqueColors:h.colors.uniqueColors,literalUsages:h.colors.literalUsages,linkedUsages:h.colors.linkedUsages,paletteDuplicates:h.colors.paletteDuplicates,groups:h.colors.groups.map(({usages,...g})=>({...g,layers:g.layers}))},tokens:{checkedFields:h.tokens.checkedFields,boundFields:h.tokens.boundFields,issues:h.tokens.issues.map(({layer,id:_,...i})=>({...i,...layerRow(layer)}))},styles:h.styles,instances:{instances:h.instances.instances,mains:h.instances.mains,findings:h.instances.findings.map(({layer,...f})=>({...f,...layerRow(layer)}))},hygiene:{...h.hygiene,findings:h.hygiene.findings.map(f=>({id:f.id,label:f.label,count:f.count,advice:f.advice,layers:f.layers.slice(0,200).map(layerRow)}))},transfer:{...h.transfer,findings:h.transfer.findings.map(f=>({...f,layers:f.layers.map(layerRow)}))}},null,2);}
export function healthMarkdown(h:DesignHealth){const lines=['# Design health report: '+h.generatedFrom.name,'','Saved '+h.generatedFrom.updatedAt+'. Rule counts from saved document data, not a quality score.','','| Area | Status | Summary |','| --- | --- | --- |',...h.categories.map(c=>'| '+c.label+' | '+c.status+' | '+c.summary+' |'),''];
 const section=(title:string,rows:string[],limit=100)=>{if(!rows.length)return;lines.push('## '+title,'',...rows.slice(0,limit).map(r=>'- '+r),...(rows.length>limit?['- …and '+(rows.length-limit)+' more']:[]),'');};
 section('Contrast failures',h.contrast.findings.filter(f=>f.level==='fail').map(f=>f.layer.pageName+' / '+f.layer.nodeName+': '+f.ratio!.toFixed(2)+':1, needs '+f.required+':1'));
 section('Contrast not evaluated',h.contrast.findings.filter(f=>f.level==='not-evaluated').map(f=>f.layer.pageName+' / '+f.layer.nodeName+': '+f.reason));
 section('Duplicate colors',h.colors.groups.map(g=>(g.kind==='near'?'Near: ':'Exact: ')+g.hexes.join(', ')+' ('+g.literal+' unlinked, '+g.linked+' linked)'));
 section('Token consistency',h.tokens.issues.map(i=>i.layer.pageName+' / '+i.layer.nodeName+' '+i.field+': '+i.kind+(i.suggestion?' → '+i.suggestion.name:'')));
 section('Unused styles',h.styles.rows.filter(r=>r.status==='unreferenced').map(r=>r.kind+': '+r.name));
 section('Detached instances',h.instances.findings.map(f=>f.layer.pageName+' / '+f.layer.nodeName+': '+detachedLabels[f.kind]+' ('+f.componentName+')'));
 section('Layer hygiene',h.hygiene.findings.map(f=>f.label+': '+f.count));
 section('Transfer',h.transfer.findings.map(f=>f.label+' ('+f.count+'): '+transferTargets.map(t=>t.label+' '+f.outcomes[t.id]).join(', ')+'. '+f.note));
 return lines.join('\n');
}
