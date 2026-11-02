/** Prototype expressions name variables in text, as a bare name or var("name or ID"). This finds those spans so a library update can follow a variable that moved. Strings other than a var() argument, literals and function names are never touched. */
interface Span {start:number;end:number;name:string;quoted:boolean;}
const reserved=new Set(['true','false']);
const plainName=/^[A-Za-z_$][A-Za-z0-9_$]*$/;
function spans(source:string):Span[]{const out:Span[]=[],tokens:{kind:string;text:string;start:number;end:number}[]=[];let pos=0;
 while(pos<source.length){if(/\s/.test(source[pos])){pos++;continue;}const rest=source.slice(pos);let match:RegExpMatchArray|null,kind='op';
  if(source[pos]==='"'){match=rest.match(/^"(?:[^"\\]|\\.)*"/);kind='string';}
  else if(match=rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/))kind='number';
  else if(match=rest.match(/^[A-Za-z_$][A-Za-z0-9_$]*/))kind='name';
  else match=rest.match(/^(?:===|!==|==|!=|>=|<=|&&|\|\||[+\-*/%><!(),])/);
  if(!match)return [];tokens.push({kind,text:match[0],start:pos,end:pos+match[0].length});pos+=match[0].length;}
 tokens.forEach((t,i)=>{const next=tokens[i+1]?.text;if(t.kind==='name'&&next!=='('&&!reserved.has(t.text))out.push({start:t.start,end:t.end,name:t.text,quoted:false});
  else if(t.kind==='name'&&t.text==='var'&&next==='('&&tokens[i+2]?.kind==='string'&&tokens[i+3]?.text===')'){const s=tokens[i+2];try{const name=JSON.parse(s.text);if(typeof name==='string')out.push({start:s.start,end:s.end,name,quoted:true});}catch{/* A malformed string stays as authored. */}}});
 return out;}
/** The names and IDs this expression reads. A computed var() argument can't be known, so it isn't listed. */
export function expressionVariableNames(source:unknown):string[]{return typeof source==='string'?[...new Set(spans(source).map(s=>s.name))]:[];}
/** A bare name stays bare when the new name can be one; otherwise it becomes var("…"), which every name can use. */
export function renameExpressionVariables(source:string,rename:(name:string)=>string|undefined):string{let out='',at=0;for(const s of spans(source)){const next=rename(s.name);if(next===undefined||next===s.name)continue;out+=source.slice(at,s.start)+(s.quoted?JSON.stringify(next):plainName.test(next)&&!reserved.has(next)?next:`var(${JSON.stringify(next)})`);at=s.end;}return at?out+source.slice(at):source;}
interface ExpressionAction {expression?:string;branches?:{condition?:string;actions:ExpressionAction[]}[];}
/** Every expression and branch condition inside a list of prototype actions, with a way to replace each. */
export function visitActionExpressions(actions:readonly ExpressionAction[],visit:(source:string,replace:(next:string)=>void)=>void,depth=0){if(depth>16)return;for(const a of actions){if(typeof a.expression==='string')visit(a.expression,next=>{a.expression=next;});for(const b of a.branches??[]){if(typeof b.condition==='string'&&b.condition)visit(b.condition,next=>{b.condition=next;});visitActionExpressions(b.actions,visit,depth+1);}}}
/** Renames expressions in every reaction of these layers. Returns how many expressions changed. */
export function renameLayerExpressions(nodes:readonly {reactions?:{actions:ExpressionAction[]}[]}[],rename:(name:string)=>string|undefined){let changed=0;for(const n of nodes)for(const r of n.reactions??[])visitActionExpressions(r.actions,(source,replace)=>{const next=renameExpressionVariables(source,rename);if(next!==source){replace(next);changed++;}});return changed;}
