import type {DesignDocument,DesignNode} from './model';
import {fillsFor,strokesFor} from './paints';
import type {Paint} from './paints';
import {addCollection,addVariable,resolveVariable} from './design-systems';
import {colorDistance,documentIndexes,hexColor,pageIndex} from './audit-index';
import type {AuditLayer,PageIndex} from './audit-index';
/** Duplicate color audit over saved paints. Near matches are CIE76 distance; 2.3 is roughly one just-noticeable step. */
export type ColorChannel='fill'|'stroke'|'gradient'|'text-range';
export interface ColorUsage {hex:string;channel:ColorChannel;layer:AuditLayer;linked:boolean;bindable:boolean;}
export interface TokenRef {id:string;name:string;}
export interface ColorGroup {id:string;kind:'exact'|'near';canonical:string;hexes:string[];usages:ColorUsage[];literal:number;linked:number;layers:number;blocked:number;spread:number;variables:TokenRef[];styles:TokenRef[];palette:string[];}
export interface ColorAudit {groups:ColorGroup[];uniqueColors:number;literalUsages:number;linkedUsages:number;paletteDuplicates:number;warnings:string[];}
export const NEAR_COLOR_DISTANCE=3,NEAR_COLOR_LIMIT=2000;
export const generatedLayerIds=(d:DesignDocument)=>new Set([...(d.slides?.slides.map(s=>s.frameId)??[]),...(d.whiteboard?.stickies.map(s=>s.frameId)??[]),...(d.whiteboard?.tables.map(t=>t.frameId)??[])]);
function paintUsages(p:Paint,first:boolean,channel:'fill'|'stroke',linked:boolean,add:(hex:string,channel:ColorChannel,linked:boolean,bindable:boolean)=>void){if(!p.visible)return;if(p.type==='solid'){if(hexColor(p.color))add(p.color.toLowerCase(),channel,linked&&first,first&&!p.surface);}else if(['linear','radial','angular','diamond'].includes(p.type))for(const stop of p.stops??[])if(hexColor(stop.color))add(stop.color.toLowerCase(),'gradient',linked,false);}
export function nodeColorUsages(n:DesignNode,layer:AuditLayer){
 const usages:ColorUsage[]=[],add=(hex:string,channel:ColorChannel,linked:boolean,bindable:boolean)=>usages.push({hex,channel,layer,linked,bindable});
 if(n.type==='slice'||n.media)return usages;
 fillsFor(n).forEach((p,i)=>paintUsages(p,i===0,'fill',Boolean(n.variableBindings?.fill||n.styleIds?.paint),add));
 strokesFor(n).filter(s=>s.visible&&s.width>0).forEach((s,i)=>paintUsages(s.paint,i===0,'stroke',Boolean(n.variableBindings?.stroke||n.styleIds?.stroke),add));
 if(n.type==='text')for(const r of n.textRuns??[])if(hexColor(r.fill))add(r.fill.toLowerCase(),'text-range',false,false);
 return usages;
}
const defaultValue=(d:DesignDocument,id:string)=>{try{const value=resolveVariable(d,id).value;return hexColor(value)?value.toLowerCase():undefined;}catch{return undefined;}};
const styleColor=(style:{value:Partial<DesignNode>})=>{const paints=style.value.paints;if(paints?.length===1&&paints[0].type==='solid')return paints[0].color.toLowerCase();if(!paints&&hexColor(style.value.fill))return style.value.fill.toLowerCase();return undefined;};
function colorTokens(d:DesignDocument){const variables=new Map<string,TokenRef[]>(),styles=new Map<string,TokenRef[]>(),palette=new Map<string,string[]>(),push=<T,>(map:Map<string,T[]>,key:string,value:T)=>{const list=map.get(key)??[];list.push(value);map.set(key,list);};for(const v of d.variables??[])if(v.type==='color'){const value=defaultValue(d,v.id);if(value)push(variables,value,{id:v.id,name:v.name});}for(const s of d.styles??[])if(s.type==='paint'){const value=styleColor(s);if(value)push(styles,value,{id:s.id,name:s.name});}for(const c of d.colors??[])if(hexColor(c.value))push(palette,c.value.toLowerCase(),c.name);return {variables,styles,palette};}
export function auditColors(doc:DesignDocument,options:{nearDistance?:number}={}):ColorAudit{
 const nearDistance=options.nearDistance??NEAR_COLOR_DISTANCE;if(!Number.isFinite(nearDistance)||nearDistance<0||nearDistance>40)throw Error('Near-color distance must be between 0 and 40.');
 const byHex=new Map<string,ColorUsage[]>(),tokens=colorTokens(doc),generated=generatedLayerIds(doc),warnings:string[]=[];let literalUsages=0,linkedUsages=0;
 for(const index of documentIndexes(doc))for(const n of index.page.nodes)for(const usage of nodeColorUsages(n,index.layer(n))){if(generated.has(n.id))usage.layer={...usage.layer,managed:true};const list=byHex.get(usage.hex)??[];list.push(usage);byHex.set(usage.hex,list);if(usage.linked)linkedUsages++;else literalUsages++;}
 const group=(kind:ColorGroup['kind'],canonical:string,hexes:string[]):ColorGroup=>{const usages=hexes.flatMap(h=>byHex.get(h)??[]),literal=usages.filter(u=>!u.linked),spread=Math.max(0,...hexes.map(h=>colorDistance(canonical,h)));return {id:kind+':'+canonical,kind,canonical,hexes,usages,literal:literal.length,linked:usages.length-literal.length,layers:new Set(usages.map(u=>u.layer.nodeId)).size,blocked:literal.filter(u=>u.layer.locked||u.layer.managed).length,spread,variables:hexes.flatMap(h=>tokens.variables.get(h)??[]),styles:hexes.flatMap(h=>tokens.styles.get(h)??[]),palette:hexes.flatMap(h=>tokens.palette.get(h)??[])};};
 const groups:ColorGroup[]=[],all=new Set([...byHex.keys(),...tokens.variables.keys(),...tokens.styles.keys(),...tokens.palette.keys()]);
 for(const hex of all){const usages=byHex.get(hex)??[],literal=usages.filter(u=>!u.linked),layers=new Set(literal.map(u=>u.layer.nodeId)).size,definitions=(tokens.variables.get(hex)?.length??0)+(tokens.styles.get(hex)?.length??0)+(tokens.palette.get(hex)?.length??0);if(layers>=2||literal.length&&definitions>=1||definitions>=2)groups.push(group('exact',hex,[hex]));}
 const weight=(hex:string)=>(tokens.variables.get(hex)?.length?1e7:0)+(tokens.styles.get(hex)?.length?1e6:0)+(byHex.get(hex)?.length??0);let ranked=[...all].sort((a,b)=>weight(b)-weight(a)||a.localeCompare(b));
 if(ranked.length>NEAR_COLOR_LIMIT){warnings.push('Near-color comparison covers the '+NEAR_COLOR_LIMIT+' most used colors of '+ranked.length+'.');ranked=ranked.slice(0,NEAR_COLOR_LIMIT);}
 const claimed=new Set<string>();if(nearDistance>0)for(const seed of ranked){if(claimed.has(seed))continue;const near=ranked.filter(hex=>hex!==seed&&!claimed.has(hex)&&colorDistance(seed,hex)<=nearDistance);if(!near.length)continue;claimed.add(seed);near.forEach(hex=>claimed.add(hex));groups.push(group('near',seed,[seed,...near]));}
 groups.sort((a,b)=>b.literal-a.literal||a.id.localeCompare(b.id));
 const seen=new Set<string>();let paletteDuplicates=0;for(const c of doc.colors??[]){const key=c.value.toLowerCase();if(seen.has(key))paletteDuplicates++;seen.add(key);}
 return {groups,uniqueColors:byHex.size,literalUsages,linkedUsages,paletteDuplicates,warnings};
}
export type ColorMergeTarget={kind:'literal'}|{kind:'variable';name:string}|{kind:'style';name:string}|{kind:'existing-variable';id:string}|{kind:'existing-style';id:string};
export interface ColorMergeResult {canonical:string;changedLayers:number;linkedLayers:number;skippedLocked:number;skippedManaged:number;tokenId?:string;changed:{pageId:string;nodeId:string}[];}
const mergeable=(n:DesignNode,index:PageIndex,generated:Set<string>)=>index.locked(n)?'locked':index.managed(n)||n.type==='instance'||generated.has(n.id)?'managed':'ok';
function targetName(name:string){const value=name.trim();if(!value||value.length>256||/[\u0000-\u001f]/.test(value))throw Error('Enter a token name up to 256 characters.');return value;}
/** Draft mutator for one Undo step. Linked channels stay on their token; nothing is created unless a layer really changes. */
export function applyColorMerge(d:DesignDocument,hexes:readonly string[],canonical:string,target:ColorMergeTarget):ColorMergeResult{
 if(!hexColor(canonical)||!hexes.length||hexes.length>512||hexes.some(h=>!hexColor(h)))throw Error('Choose valid colors to merge.');canonical=canonical.toLowerCase();const members=new Set(hexes.map(h=>h.toLowerCase())),generated=generatedLayerIds(d);
 if(target.kind==='existing-variable'){const v=d.variables?.find(v=>v.id===target.id);if(!v||v.type!=='color')throw Error('This color variable no longer exists.');canonical=defaultValue(d,v.id)??canonical;}
 if(target.kind==='existing-style'){const style=d.styles?.find(s=>s.id===target.id&&s.type==='paint'),value=style&&styleColor(style);if(!value)throw Error('This paint style no longer has one solid color.');canonical=value;}
 if(target.kind==='variable'||target.kind==='style')targetName(target.name);
 const plan:{n:DesignNode;pageId:string}[]=[];let skippedLocked=0,skippedManaged=0;
 for(const page of d.pages){const index=pageIndex(page);for(const n of page.nodes){const usages=nodeColorUsages(n,index.layer(n)).filter(u=>members.has(u.hex)&&!u.linked);if(!usages.length)continue;const state=mergeable(n,index,generated);if(state==='locked')skippedLocked++;else if(state==='managed')skippedManaged++;else plan.push({n,pageId:page.id});}}
 if(!plan.length)throw Error(skippedLocked||skippedManaged?'Every matching layer is locked or managed by a component. Nothing changed.':'No unlinked layers use these colors.');
 let tokenId=target.kind==='existing-variable'||target.kind==='existing-style'?target.id:undefined;
 if(target.kind==='variable'){const collection=d.variableCollections?.[0]?.id??addCollection(d,'Colors'),id=addVariable(d,collection,'color',targetName(target.name)),v=d.variables!.find(v=>v.id===id)!;for(const mode of Object.keys(v.values))v.values[mode]=canonical;tokenId=id;}
 if(target.kind==='style'){tokenId=crypto.randomUUID();(d.styles??=[]).push({id:tokenId,name:targetName(target.name),description:'',type:'paint',value:{fill:canonical,gradient:false}});}
 const bindVariable=target.kind==='variable'||target.kind==='existing-variable',bindStyle=target.kind==='style'||target.kind==='existing-style',changed:ColorMergeResult['changed']=[];let linkedLayers=0;
 for(const {n,pageId} of plan){
  const fills=structuredClone(fillsFor(n)),strokes=structuredClone(strokesFor(n)),recolor=(p:Paint)=>{let hit=false;if(!p.visible)return hit;if(p.type==='solid'&&members.has(p.color.toLowerCase())){p.color=canonical;hit=true;}else if(p.type!=='solid'&&p.type!=='image')for(const stop of p.stops??[])if(members.has(stop.color.toLowerCase())){stop.color=canonical;hit=true;}return hit;};
  const fillLinked=Boolean(n.variableBindings?.fill||n.styleIds?.paint),strokeLinked=Boolean(n.variableBindings?.stroke||n.styleIds?.stroke);let linked=false,fillHit=false,strokeHit=false;
  fills.forEach((p,i)=>{if(i===0&&fillLinked)return;const hit=recolor(p);fillHit=fillHit||hit;if(hit&&i===0&&p.type==='solid'&&!p.surface){if(bindVariable){(n.variableBindings??={}).fill=tokenId;linked=true;}else if(bindStyle&&fills.filter(f=>f.visible).length===1&&fills.length===1&&p.opacity===1){(n.styleIds??={}).paint=tokenId;linked=true;}}});
  strokes.filter(s=>s.visible&&s.width>0).forEach((s,i)=>{if(i===0&&strokeLinked)return;const hit=recolor(s.paint);strokeHit=strokeHit||hit;if(hit&&i===0&&s.paint.type==='solid'&&!s.paint.surface&&bindVariable){(n.variableBindings??={}).stroke=tokenId;linked=true;}});
  if(fillHit){n.paints=fills;if(fills[0]?.type==='solid')n.fill=fills[0].color;}if(strokeHit){n.strokes=strokes;if(strokes[0]?.paint.type==='solid')n.stroke=strokes[0].paint.color;}
  const runs=n.textRuns?.map(r=>r.fill&&members.has(r.fill.toLowerCase())?{...r,fill:canonical}:r);if(JSON.stringify(runs)!==JSON.stringify(n.textRuns))n.textRuns=runs;
  if(linked)linkedLayers++;changed.push({pageId,nodeId:n.id});
 }
 return {canonical,changedLayers:changed.length,linkedLayers,skippedLocked,skippedManaged,tokenId,changed};
}
/** Automatic derivation can overwrite a managed color; refuse the whole merge rather than report a false success. */
export function validateColorMerge(d:DesignDocument,hexes:readonly string[],result:ColorMergeResult){const old=new Set(hexes.map(h=>h.toLowerCase()).filter(h=>h!==result.canonical));for(const {pageId,nodeId} of result.changed){const n=d.pages.find(p=>p.id===pageId)?.nodes.find(n=>n.id===nodeId);if(!n||nodeColorUsages(n,{} as AuditLayer).some(u=>!u.linked&&old.has(u.hex)))throw Error('A managed color would overwrite this merge. Nothing changed.');}}
export function removeDuplicatePaletteEntries(d:DesignDocument){const seen=new Set<string>(),before=d.colors.length;d.colors=d.colors.filter(c=>{const key=c.value.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});if(d.colors.length===before)throw Error('This palette has no duplicate colors.');return before-d.colors.length;}
