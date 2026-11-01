import type {DesignDocument,DesignNode} from './model';
import {applyDesignSystems,bindingTypeOf,styleFields,styleSlotKind} from './design-systems';
import type {BindingField,DesignStyle,DesignVariable,StyleKind,StyleSlot} from './design-systems';
import {fillsFor,strokesFor} from './paints';
import {colorDistance,documentIndexes,hexColor,pageIndex} from './audit-index';
import type {AuditLayer,PageIndex} from './audit-index';
import {generatedLayerIds} from './audit-colors';
/** Compares saved literal layer values to local tokens in the layer's own effective modes. */
export type TokenIssueKind='unbound-match'|'off-token'|'style-match'|'missing-variable'|'missing-style'|'wrong-style-kind'|'scope-mismatch';
export const tokenIssueLabels:Record<TokenIssueKind,string>={'unbound-match':'Equal to a token but not linked','off-token':'Close to a token','style-match':'Equal to a style but not linked','missing-variable':'Link to a missing variable','missing-style':'Link to a missing style','wrong-style-kind':'Style link of the wrong kind','scope-mismatch':'Variable scope excludes this field'};
export interface TokenSuggestion {type:'variable'|'style';id:string;name:string;value:string;kind?:StyleKind;}
export interface TokenIssue {id:string;kind:TokenIssueKind;field:string;layer:AuditLayer;value:string;suggestion?:TokenSuggestion;alternatives:number;changesAppearance:boolean;blocked?:string;}
export interface TokenAudit {issues:TokenIssue[];checkedFields:number;boundFields:number;coverage:number|null;warnings:string[];}
const NUMERIC=['radius','gap','padding','fontSize','opacity','strokeWidth'] as const;
type AuditField='fill'|'stroke'|typeof NUMERIC[number];
const FIELDS:AuditField[]=['fill','stroke',...NUMERIC];
const colorValue=(v:string)=>v.toLowerCase();
export function literalField(n:DesignNode,field:AuditField):string|number|undefined{
 if(field==='fill'){const p=fillsFor(n)[0];return p?.visible&&p.type==='solid'&&!p.surface&&hexColor(p.color)?colorValue(p.color):undefined;}
 if(field==='stroke'){const s=strokesFor(n)[0];return s?.visible&&s.width>0&&s.paint.visible&&s.paint.type==='solid'&&!s.paint.surface&&hexColor(s.paint.color)?colorValue(s.paint.color):undefined;}
 if(field==='radius')return n.radius>0&&['frame','rectangle','component','image'].includes(n.type)&&(!n.corners||n.corners.every(c=>c===n.radius))?n.radius:undefined;
 if(field==='gap')return n.layout!=='none'&&n.gapX===undefined&&n.gapY===undefined&&n.justifyContent!=='space-between'?n.gap:undefined;
 if(field==='padding')return n.layout!=='none'&&n.paddings===undefined?n.padding:undefined;
 if(field==='fontSize')return n.type==='text'?n.fontSize:undefined;
 if(field==='opacity')return n.opacity<1?n.opacity:undefined;
 const s=strokesFor(n)[0];return s?.visible&&s.width>0?s.width:undefined;
}
const linkedStyle=(n:DesignNode,field:AuditField)=>field==='fill'?n.styleIds?.paint:field==='stroke'?n.styleIds?.strokePaint??n.styleIds?.stroke:field==='strokeWidth'?n.styleIds?.stroke:field==='fontSize'?n.styleIds?.text:undefined;
type ResolvedTable=Map<string,{variable:DesignVariable;value:string|number}[]>;
/** Every variable resolved once per distinct effective mode set, using a map so large token files stay linear. */
function tokenTable(d:DesignDocument,modes:Record<string,string>,byId:Map<string,DesignVariable>,collections:Map<string,{id:string;defaultModeId:string}>):ResolvedTable{
 const table:ResolvedTable=new Map();
 for(const variable of byId.values()){if(variable.type!=='color'&&variable.type!=='number')continue;let current:DesignVariable|undefined=variable,value:unknown,hops=0;while(current&&hops++<256){const c=collections.get(current.collectionId);if(!c)break;const raw:unknown=current.values[modes[c.id]??d.variableModes?.[c.id]??c.defaultModeId]??current.values[c.defaultModeId];if(raw&&typeof raw==='object'){current=byId.get((raw as {alias:string}).alias);continue;}value=raw;break;}if(value===undefined||typeof value==='boolean')continue;const key=String(typeof value==='string'?colorValue(value):value),list=table.get(key)??[];list.push({variable,value:typeof value==='string'?colorValue(value):value as number});table.set(key,list);}
 return table;
}
function effectiveModes(n:DesignNode,index:PageIndex,memo:Map<string,Record<string,string>>){const trail:DesignNode[]=[],seen=new Set<string>();let current:DesignNode|undefined=n;while(current&&!memo.has(current.id)&&!seen.has(current.id)){seen.add(current.id);trail.push(current);current=current.parentId?index.byId.get(current.parentId):undefined;}let value:Record<string,string>=current?memo.get(current.id)??{}:{};for(const item of trail.reverse()){if(item.variableModes)value={...value,...item.variableModes};memo.set(item.id,value);}return memo.get(n.id)!;}
const allowed=(v:DesignVariable,field:string)=>!v.scopes.length||v.scopes.includes(field);
const tolerance=(field:AuditField,value:number)=>field==='opacity'?.03:Math.max(1,Math.abs(value)*.05);
const textDefaults:Partial<Record<keyof DesignNode,unknown>>={fontStyle:'normal',verticalAlign:'top',textResize:'fixed',decorations:[],paragraphSpacing:0,paragraphIndent:0,smallCaps:false,textCase:'original',textPosition:'normal',textDirection:'auto',textWrap:'normal',hangingQuotes:false,hangingPunctuation:false,textVerticalTrim:'none',listItemSpacing:0,listHanging:false,listStyle:'none',fontFallbacks:[]};
/** Style equality is proved by applying the style to a scratch layer, because text styles reset unspecified fields. */
function styleMatches(n:DesignNode,style:DesignStyle){const scratch=structuredClone(n);scratch.styleIds={[style.type]:style.id};scratch.variableBindings=undefined;const probe={pages:[{id:'p',name:'',nodes:[scratch],comments:[]}],styles:[style],variables:[],variableCollections:[]} as unknown as DesignDocument;try{applyDesignSystems(probe);}catch{return false;}const same=(field:keyof DesignNode)=>JSON.stringify(scratch[field]??textDefaults[field]??null)===JSON.stringify(n[field]??textDefaults[field]??null);return styleFields[style.type].every(same);}
const styleKey=(n:DesignNode)=>[n.fontFamily,n.fontSize,n.fontWeight].join('\0');
export function auditTokens(doc:DesignDocument):TokenAudit{
 const byId=new Map((doc.variables??[]).map(v=>[v.id,v])),collections=new Map((doc.variableCollections??[]).map(c=>[c.id,c])),styles=new Map((doc.styles??[]).map(s=>[s.id,s])),issues:TokenIssue[]=[],tables=new Map<string,ResolvedTable>(),generated=generatedLayerIds(doc),warnings:string[]=[],hasTokens=byId.size>0||styles.size>0;let checkedFields=0,boundFields=0,serial=0;
 const textStyles=new Map<string,DesignStyle[]>(),paintStyles=new Map<string,DesignStyle[]>(),effectStyles=(doc.styles??[]).filter(s=>s.type==='effect');
 for(const s of doc.styles??[]){if(s.type==='text'){const key=[s.value.fontFamily,s.value.fontSize,s.value.fontWeight].join('\0'),list=textStyles.get(key)??[];list.push(s);textStyles.set(key,list);}if(s.type==='paint'){const paints=s.value.paints,color=paints?.length===1&&paints[0].type==='solid'?paints[0].color:!paints&&hexColor(s.value.fill)?s.value.fill:undefined;if(color){const list=paintStyles.get(colorValue(color))??[];list.push(s);paintStyles.set(colorValue(color),list);}}}
 const push=(issue:Omit<TokenIssue,'id'>)=>{issues.push({...issue,id:'issue-'+serial++});};
 for(const index of documentIndexes(doc)){const memo=new Map<string,Record<string,string>>();for(const n of index.page.nodes){
  if(n.type==='slice')continue;const layer=index.layer(n),blocked=layer.locked?'Unlock this layer first.':undefined;
  for(const [field,id] of Object.entries(n.variableBindings??{}))if(id){const v=byId.get(id);if(!v)push({kind:'missing-variable',field,layer,value:id,alternatives:0,changesAppearance:false,blocked:blocked??(layer.managed?'Edit the main component.':undefined)});else if(!allowed(v,field))push({kind:'scope-mismatch',field,layer,value:v.name,alternatives:0,changesAppearance:false,blocked:'Change the variable scope or bind another variable.'});}
  for(const [kind,id] of Object.entries(n.styleIds??{}))if(id){const style=styles.get(id);if(!style)push({kind:'missing-style',field:kind,layer,value:id,alternatives:0,changesAppearance:false,blocked:blocked??(layer.managed?'Edit the main component.':undefined)});else if(style.type!==styleSlotKind(kind))push({kind:'wrong-style-kind',field:kind,layer,value:style.name,alternatives:0,changesAppearance:false,blocked:blocked??(layer.managed?'Edit the main component.':undefined)});}
  if(layer.managed||n.type==='instance'||generated.has(n.id)||n.media)continue;
  const modes=effectiveModes(n,index,memo),key=JSON.stringify(Object.entries(modes).sort());let table=tables.get(key);if(!table){table=tokenTable(doc,modes,byId,collections);tables.set(key,table);}
  for(const field of FIELDS){
   const value=literalField(n,field);if(value===undefined)continue;checkedFields++;const types=bindingTypeOf(field);
   if(n.variableBindings?.[field as BindingField]||linkedStyle(n,field)){boundFields++;continue;}if(!hasTokens)continue;
   const exact=(table.get(String(value))??[]).filter(t=>t.variable.type===types&&allowed(t.variable,field));
   if(exact.length){const v=exact[0].variable;push({kind:'unbound-match',field,layer,value:String(value),suggestion:{type:'variable',id:v.id,name:v.name,value:String(value)},alternatives:exact.length-1,changesAppearance:false,blocked});continue;}
   if(field==='fill'&&typeof value==='string'){const paint=paintStyles.get(value)?.find(s=>fillsFor(n).length===1&&fillsFor(n)[0].opacity===1&&styleMatches(n,s));if(paint){push({kind:'style-match',field,layer,value,suggestion:{type:'style',id:paint.id,name:paint.name,value,kind:'paint'},alternatives:0,changesAppearance:false,blocked});continue;}}
   let best:{variable:DesignVariable;value:string|number;distance:number}|undefined;
   for(const list of table.values())for(const t of list){if(t.variable.type!==types||!allowed(t.variable,field))continue;const distance=typeof value==='number'?typeof t.value==='number'?Math.abs(t.value-value):Infinity:typeof t.value==='string'?colorDistance(value,t.value):Infinity;if(distance<(best?.distance??Infinity))best={...t,distance};}
   if(best&&(typeof value==='number'?best.distance<=tolerance(field,value):best.distance<=3))push({kind:'off-token',field,layer,value:String(value),suggestion:{type:'variable',id:best.variable.id,name:best.variable.name,value:String(best.value)},alternatives:0,changesAppearance:true,blocked});
  }
  if(n.type==='text'&&!n.styleIds?.text&&!n.textRuns?.length){const style=textStyles.get(styleKey(n))?.find(s=>styleMatches(n,s));if(style)push({kind:'style-match',field:'text style',layer,value:n.fontFamily+' '+n.fontSize+'/'+n.fontWeight,suggestion:{type:'style',id:style.id,name:style.name,value:style.name,kind:'text'},alternatives:0,changesAppearance:false,blocked});}
  if(n.effects?.length&&!n.styleIds?.effect){const style=effectStyles.find(s=>JSON.stringify(s.value.effects?.map(({id:_,...e})=>e))===JSON.stringify(n.effects!.map(({id:_,...e})=>e)));if(style)push({kind:'style-match',field:'effect style',layer,value:n.effects.length+' effects',suggestion:{type:'style',id:style.id,name:style.name,value:style.name,kind:'effect'},alternatives:0,changesAppearance:false,blocked});}
 }}
 return {issues,checkedFields,boundFields,coverage:checkedFields?boundFields/checkedFields:null,warnings};
}
export interface TokenFixResult {applied:number;skipped:number;changed:{pageId:string;nodeId:string;field:string}[];}
/** Draft mutator. Issues are revalidated against the draft, so a stale report row is skipped rather than misapplied. */
export function applyTokenFixes(d:DesignDocument,issues:readonly TokenIssue[]):TokenFixResult{
 if(!issues.length||issues.length>20000)throw Error('Choose findings to fix.');let applied=0,skipped=0;const changed:TokenFixResult['changed']=[],indexes=new Map<string,PageIndex>();
 for(const issue of issues){
  const page=d.pages.find(p=>p.id===issue.layer.pageId);if(!page){skipped++;continue;}const index=indexes.get(page.id)??pageIndex(page);indexes.set(page.id,index);const n=index.byId.get(issue.layer.nodeId);
  if(!n||index.locked(n)||issue.blocked){skipped++;continue;}const managed=index.managed(n)||n.type==='instance';
  if(issue.kind==='missing-variable'){if(!managed&&n.variableBindings?.[issue.field as BindingField]===issue.value){delete n.variableBindings[issue.field as BindingField];applied++;changed.push({pageId:page.id,nodeId:n.id,field:issue.field});}else skipped++;continue;}
  if(issue.kind==='missing-style'||issue.kind==='wrong-style-kind'){const kind=issue.field as StyleSlot;if(!managed&&n.styleIds?.[kind]){delete n.styleIds[kind];applied++;changed.push({pageId:page.id,nodeId:n.id,field:issue.field});}else skipped++;continue;}
  const target=issue.suggestion;if(!target||managed){skipped++;continue;}
  if(target.type==='variable'){const field=issue.field as AuditField,v=d.variables?.find(v=>v.id===target.id);if(!v||n.variableBindings?.[field as BindingField]||linkedStyle(n,field)||String(literalField(n,field))!==issue.value){skipped++;continue;}(n.variableBindings??={})[field as BindingField]=v.id;}
  else{const kind=target.kind!;if(!d.styles?.some(s=>s.id===target.id&&s.type===kind)||n.styleIds?.[kind]){skipped++;continue;}(n.styleIds??={})[kind]=target.id;}
  applied++;changed.push({pageId:page.id,nodeId:n.id,field:issue.field});
 }
 if(!applied)throw Error('These findings are stale, locked or managed. Nothing changed.');
 return {applied,skipped,changed};
}
