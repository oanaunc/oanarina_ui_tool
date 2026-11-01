import type {DesignDocument, DesignNode} from './model';
import {parseDocument} from './model';
import {detachEditedBindings} from './design-systems';
import {richTextNodeKey,textStyleFields,validateTextRuns} from './rich-text';
import type {TextRun} from './rich-text';
import {setSpecText,specTexts} from './spec';
import type {SpecTextSpot} from './spec';

export const TEXT_SEARCH_LIMIT = 10000;
export interface TextSearchOptions {
  query:string; scope:'document'|'page'|'selection'; pageId:string; selectionIds:string[];
  caseSensitive:boolean; wholeWord:boolean; includeHidden:boolean;
}
export interface TextMatch {
  pageId:string; nodeId:string; pageName:string; nodeName:string;
  start:number; end:number; sourceText:string; locked:boolean; hidden:boolean;
  /** Set when the match is in a spec block, whose writing lives in the block and not in the layer. */
  spot?:SpecTextSpot;
}
export interface TextSearchResult {documentId:string; matches:TextMatch[]; limited:boolean;}
const word = /[\p{L}\p{N}\p{M}\p{Pc}]/u;
function before(text:string, at:number){return [...text.slice(Math.max(0,at-2),at)].at(-1)??'';}
function after(text:string, at:number){return String.fromCodePoint(text.codePointAt(at)??0);}
function hierarchy(nodes:DesignNode[]){
  const byId=new Map(nodes.map(n=>[n.id,n])), cache=new Map<string,{locked:boolean;hidden:boolean}>();
  return (node:DesignNode)=>{
    const trail:DesignNode[]=[],seen=new Set<string>();let current:DesignNode|undefined=node;
    while(current&&!cache.has(current.id)&&!seen.has(current.id)){trail.push(current);seen.add(current.id);current=byId.get(current.parentId??'');}
    let flags=current?(cache.get(current.id)??{locked:true,hidden:true}):{locked:false,hidden:false};
    for(const n of trail.reverse()){flags={locked:flags.locked||n.locked,hidden:flags.hidden||!n.visible};cache.set(n.id,flags);}
    return cache.get(node.id)!;
  };
}
function selectionTree(nodes:DesignNode[], ids:string[]){
  const children=new Map<string, string[]>();for(const n of nodes)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n.id);children.set(n.parentId,list);}
  const result=new Set(ids),queue=[...ids];for(let i=0;i<queue.length;i++)for(const id of children.get(queue[i])??[])if(!result.has(id)){result.add(id);queue.push(id);}
  return result;
}
/** Literal Unicode search. No user-supplied regular expression is executed. */
export function findDocumentText(doc:DesignDocument, options:TextSearchOptions):TextSearchResult {
  if(typeof options.query!=='string'||options.query.length>512||!['document','page','selection'].includes(options.scope)||!doc.pages.some(p=>p.id===options.pageId))throw Error('Choose a valid search scope and up to 512 search characters.');
  const matches:TextMatch[]=[],result={documentId:doc.id,matches,limited:false};if(!options.query)return result;
  const escaped=options.query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp(escaped,options.caseSensitive?'gu':'giu');
  for(const page of doc.pages){
    if(options.scope!=='document'&&page.id!==options.pageId)continue;
    const flags=hierarchy(page.nodes),selected=options.scope==='selection'?selectionTree(page.nodes,options.selectionIds):undefined;
    for(const n of page.nodes){
      if(n.type!=='text'&&n.type!=='spec'||selected&&!selected.has(n.id))continue;
      const state=flags(n);if(state.hidden&&!options.includeHidden)continue;
      for(const {text,...spot} of n.type==='spec'?specTexts(n.spec?.blocks??[]):[{text:n.text,block:undefined}]){pattern.lastIndex=0;
        for(let m=pattern.exec(text);m;m=pattern.exec(text)){
          const start=m.index,end=start+m[0].length;
          if(options.wholeWord&&(word.test(before(text,start))||word.test(after(text,end))))continue;
          if(matches.length===TEXT_SEARCH_LIMIT){result.limited=true;return result;}
          matches.push({pageId:page.id,nodeId:n.id,pageName:page.name,nodeName:n.name,start,end,sourceText:text,...state,...(spot.block?{spot:spot as SpecTextSpot}:{})});
        }
      }
    }
  }
  return result;
}

/** Linear splice of ordered matches and rich runs; replacement inherits the first matched character. */
export function replaceTextMatches(n:DesignNode, ranges:Pick<TextMatch,'start'|'end'|'sourceText'>[], replacement:string){
  validateTextRuns(n.text,n.textRuns);const oldRuns=n.textRuns??[],runs:TextRun[]=[],parts:string[]=[];let cursor=0,length=0,index=0;
  const append=(from:number,to:number)=>{
    if(to<=from)return;parts.push(n.text.slice(from,to));while(index<oldRuns.length&&oldRuns[index].end<=from)index++;
    let j=index;while(j<oldRuns.length&&oldRuns[j].start<to){const r=oldRuns[j],a=Math.max(from,r.start),b=Math.min(to,r.end);if(b>a)runs.push({...structuredClone(r),start:length+a-from,end:length+b-from});if(r.end>to)break;j++;}index=j;length+=to-from;
  };
  for(const m of ranges){
    if(m.sourceText!==n.text||!Number.isInteger(m.start)||!Number.isInteger(m.end)||m.start<cursor||m.end<=m.start||m.end>n.text.length)throw Error('Search results changed. Search again.');
    if(m.start>0&&/[\uD800-\uDBFF]/.test(n.text[m.start-1])&&/[\uDC00-\uDFFF]/.test(n.text[m.start])||m.end<n.text.length&&/[\uD800-\uDBFF]/.test(n.text[m.end-1])&&/[\uDC00-\uDFFF]/.test(n.text[m.end]))throw Error('A replacement cannot split a Unicode character.');
    append(cursor,m.start);while(index<oldRuns.length&&oldRuns[index].end<=m.start)index++;
    const inherited=oldRuns[index];if(replacement.length&&inherited&&inherited.start<=m.start&&inherited.end>m.start)runs.push({...structuredClone(inherited),start:length,end:length+replacement.length});
    parts.push(replacement);length+=replacement.length;cursor=m.end;
  }
  append(cursor,n.text.length);const text=parts.join(''),merged:TextRun[]=[];
  for(const r of runs){const last=merged.at(-1);if(last&&last.end===r.start&&JSON.stringify(textStyleFields.map(k=>last[k]))===JSON.stringify(textStyleFields.map(k=>r[k])))last.end=r.end;else merged.push(r);}
  validateTextRuns(text,merged);return {text,textRuns:merged};
}
/** A spec holds plain marked-up text, so each block or cell is one string with no runs to carry. */
function replaceInSpec(n:DesignNode,matches:TextMatch[],replacement:string){
  let blocks=n.spec?.blocks??[];const spots=new Map<string,TextMatch[]>();for(const m of matches){const key=JSON.stringify(m.spot),list=spots.get(key)??[];list.push(m);spots.set(key,list);}
  const shown=specTexts(blocks);for(const list of spots.values()){const spot=list[0].spot,now=shown.find(v=>spot&&v.block===spot.block&&v.row===spot.row&&v.column===spot.column);if(!spot||!now||list.some(m=>m.sourceText!==now.text))throw Error('Search results changed. Search again.');blocks=setSpecText(blocks,spot,replaceTextMatches({text:now.text} as DesignNode,list,replacement).text);}
  if(n.spec)n.spec={...n.spec,blocks};return matches.length;
}
export interface TextReplacementPlan {expected:Map<string,{text:string;textRuns:TextRun[]}>;replaced:number;skipped:number;}
/** Called only on an uncommitted editor candidate. Locked matches are explicitly skipped. */
export function applyTextReplacements(doc:DesignDocument, result:TextSearchResult, replacement:string):TextReplacementPlan {
  if(doc.id!==result.documentId||result.limited||typeof replacement!=='string'||replacement.length>100000||result.matches.length>TEXT_SEARCH_LIMIT)throw Error('Refine the search before replacing; use at most 100,000 replacement characters.');
  const growth=result.matches.reduce((sum,m)=>sum+Math.max(0,replacement.length-(m.end-m.start)),0);if(growth>1000000)throw Error('This replacement adds too much text at once. Narrow the scope or replace fewer matches.');
  const grouped=new Map<string,TextMatch[]>();for(const match of result.matches){const list=grouped.get(richTextNodeKey(match.pageId,match.nodeId))??[];list.push(match);grouped.set(richTextNodeKey(match.pageId,match.nodeId),list);}
  const expected:TextReplacementPlan['expected']=new Map();let replaced=0,skipped=0;
  for(const page of doc.pages){const flags=hierarchy(page.nodes);for(const n of page.nodes){const matches=grouped.get(richTextNodeKey(page.id,n.id));if(!matches)continue;
    if(n.type==='spec'){grouped.delete(richTextNodeKey(page.id,n.id));if(flags(n).locked){skipped+=matches.length;continue;}replaced+=replaceInSpec(n,matches,replacement);continue;}
    if(n.type!=='text'||matches.some(m=>m.pageId!==page.id||m.sourceText!==n.text||m.locked!==flags(n).locked))throw Error('Search results changed. Search again.');
    grouped.delete(richTextNodeKey(page.id,n.id));if(flags(n).locked){skipped+=matches.length;continue;}
    const patch=replaceTextMatches(n,matches,replacement);if(patch.text===n.text)continue;
    detachEditedBindings(n,patch);Object.assign(n,patch);expected.set(richTextNodeKey(page.id,n.id),structuredClone(patch));replaced+=matches.length;
    for(const sticky of doc.whiteboard?.stickies??[])if(sticky.authorId===n.id)sticky.author=patch.text;
    for(const connector of doc.whiteboard?.connectors??[])if(connector.labelId===n.id)connector.label=patch.text;
  }}
  if(grouped.size)throw Error('A matched layer was removed. Search again.');return {expected,replaced,skipped};
}
/** Check generated/component propagation and file validity before the single Undo transaction commits. */
export function validateTextReplacement(doc:DesignDocument, plan:TextReplacementPlan){
  const pending=new Set(plan.expected.keys());for(const p of doc.pages)for(const n of p.nodes){const expected=plan.expected.get(richTextNodeKey(p.id,n.id));if(!expected)continue;pending.delete(richTextNodeKey(p.id,n.id));if(n.text!==expected.text||JSON.stringify(n.textRuns??[])!==JSON.stringify(expected.textRuns))throw Error('A managed text value would overwrite this replacement. Edit its component property or workspace control instead.');}
  if(pending.size)throw Error('A replaced text layer disappeared during layout.');
  const raw=JSON.stringify(doc,null,2);if(new TextEncoder().encode(raw).byteLength>=50000000)throw Error('The replaced project exceeds the 50 MB saved-file limit.');parseDocument(raw);
}
