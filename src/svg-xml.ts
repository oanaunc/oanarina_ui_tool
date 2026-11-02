/** The XML prolog of an SVG. Illustrator writes its namespaces as internal entities, so those are expanded here, as plain
 * text with limits, before any parser sees the file. External entities and DTDs are never read. */
export interface SvgXmlIssue {code:string;message:string;}
export const SVG_XML_LIMITS={entities:256,entityChars:65536,name:256,depth:8,references:100000,output:24_000_000} as const;
const PREDEFINED=new Set(['amp','lt','gt','quot','apos']);
/** The `;` closing a reference, looked for only as far as an entity name may run and never past another ampersand, so a run of bare ampersands stays linear. */
const referenceEnd=(text:string,amp:number)=>{const stop=Math.min(text.length,amp+SVG_XML_LIMITS.name+2);for(let i=amp+1;i<stop;i++){const c=text[i];if(c===';')return i;if(c==='&'||c==='<'||c===' ')return -1;}return -1;};
const skipSpace=(text:string,at:number)=>{while(at<text.length&&text[at].trim()==='')at++;return at;};
/** Linear: each entity declaration, comment and instruction is consumed once. */
function parseSubset(text:string,entities:Map<string,string>,issues:SvgXmlIssue[]){
 let at=0;while(at<text.length){at=skipSpace(text,at);if(at>=text.length)break;
  if(text.startsWith('<!--',at)){const end=text.indexOf('-->',at+4);if(end<0)throw Error('Invalid SVG XML: unterminated comment.');at=end+3;continue;}
  if(text.startsWith('<?',at)){const end=text.indexOf('?>',at+2);if(end<0)throw Error('Invalid SVG XML: unterminated instruction.');at=end+2;continue;}
  if(text[at]==='%'){const end=text.indexOf(';',at);if(end<0)break;at=end+1;issues.push({code:'doctype-reduced',message:'Parameter entities in a document type were not read.'});continue;}
  if(!text.startsWith('<!',at))throw Error('Invalid SVG XML: unreadable document type.');
  let end=at+2,quote='';for(;end<text.length;end++){const c=text[end];if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='>')break;}if(end>=text.length)throw Error('Invalid SVG XML: unterminated document type.');
  const declaration=text.slice(at,end);at=end+1;if(declaration.startsWith('<!ENTITY')){const parameter=/^<!ENTITY\s+%/.test(declaration),match=/^<!ENTITY\s+(?:%\s+)?([^\s"'%]+)\s+(?:"([^"]*)"|'([^']*)'|(SYSTEM|PUBLIC)\b)/.exec(declaration);if(!match)throw Error('Invalid SVG XML: unreadable entity declaration.');if(match[4]){issues.push({code:'external-reference',message:'External entities are never fetched.'});if(!parameter&&!entities.has(match[1]))entities.set(match[1],'');continue;}if(parameter){issues.push({code:'doctype-reduced',message:'Parameter entities in a document type were not read.'});continue;}const value=match[2]??match[3]??'';if(value.length>SVG_XML_LIMITS.entityChars)throw Error('An SVG entity is too large.');if(entities.size>=SVG_XML_LIMITS.entities)throw Error('SVG declares too many entities.');if(!entities.has(match[1]))entities.set(match[1],value);}else if(declaration.startsWith('<!ATTLIST')&&/#FIXED|\s(?:"[^"]*"|'[^']*')\s*$/.test(declaration))issues.push({code:'doctype-reduced',message:'Default attributes in a document type were not applied.'});
 }
}
/** Replacement text with nested references resolved. Cycles refuse; `budget` bounds the total reference count across the document. */
function expand(name:string,entities:Map<string,string>,budget:{references:number;output:number},stack:string[]):string{
 if(stack.includes(name)||stack.length>=SVG_XML_LIMITS.depth)throw Error('SVG entities refer to each other too deeply.');const text=entities.get(name)!;let out='',at=0;
 for(;;){const open=text.indexOf('&',at);if(open<0){out+=text.slice(at);break;}const close=referenceEnd(text,open),key=close<0?'':text.slice(open+1,close);out+=text.slice(at,open);if(key&&entities.has(key)){if(--budget.references<0)throw Error('SVG entity expansion exceeds the supported size.');const inner=expand(key,entities,budget,[...stack,name]);if((budget.output-=inner.length)<0)throw Error('SVG entity expansion exceeds the supported size.');out+=inner;at=close+1;}else{out+='&';at=open+1;}}
 return out;
}
/** References in markup and text; CDATA, comments and instructions pass through untouched, as XML requires. */
function expandBody(body:string,entities:Map<string,string>){
 const out:string[]=[],budget={references:SVG_XML_LIMITS.references,output:SVG_XML_LIMITS.output-body.length},spans=[{open:'<![CDATA[',close:']]>',next:-2},{open:'<!--',close:'-->',next:-2},{open:'<?',close:'?>',next:-2}];let at=0,from=0;
 while(from<body.length){const amp=body.indexOf('&',from);if(amp<0)break;let skip:typeof spans[number]|undefined;for(const span of spans){if(span.next!==-1&&span.next<from)span.next=body.indexOf(span.open,from);if(span.next>=0&&span.next<amp&&(!skip||span.next<skip.next))skip=span;}if(skip){const end=body.indexOf(skip.close,skip.next);if(end<0)break;from=end+skip.close.length;continue;}
  const close=referenceEnd(body,amp),key=close<0?'':body.slice(amp+1,close);if(key&&!PREDEFINED.has(key)&&key[0]!=='#'&&entities.has(key)){if(--budget.references<0)throw Error('SVG entity expansion exceeds the supported size.');const value=expand(key,entities,budget,[]);if((budget.output-=value.length)<0)throw Error('SVG entity expansion exceeds the supported size.');out.push(body.slice(at,amp),value);at=from=close+1;}else from=amp+1;}
 out.push(body.slice(at));
 return out.join('');
}
export function prepareSvgXml(raw:string):{text:string;issues:SvgXmlIssue[]}{
 const issues:SvgXmlIssue[]=[];let at=raw.charCodeAt(0)===0xfeff?1:0;
 for(;;){at=skipSpace(raw,at);if(raw.startsWith('<?',at)){const end=raw.indexOf('?>',at+2);if(end<0)return {text:raw,issues};if(/^<\?xml-stylesheet\b/i.test(raw.slice(at,at+20))&&/\bhref\s*=/i.test(raw.slice(at,end)))issues.push({code:'external-reference',message:'Linked stylesheets are never fetched.'});at=end+2;continue;}if(raw.startsWith('<!--',at)){const end=raw.indexOf('-->',at+4);if(end<0)return {text:raw,issues};at=end+3;continue;}break;}
 if(!/^<!DOCTYPE\b/i.test(raw.slice(at,at+10)))return {text:raw,issues};
 let end=at+9,quote='',subsetStart=-1,subsetEnd=-1;for(;end<raw.length;end++){const c=raw[end];if(quote){if(c===quote)quote='';continue;}if(subsetStart>=0&&subsetEnd<0){if(raw.startsWith('<!--',end)){const close=raw.indexOf('-->',end+4);if(close<0)throw Error('Invalid SVG XML: unterminated comment.');end=close+2;continue;}if(c===']'){subsetEnd=end;continue;}if(c==='"'||c==="'")quote=c;continue;}if(c==='"'||c==="'")quote=c;else if(c==='[')subsetStart=end+1;else if(c==='>')break;}
 if(end>=raw.length)throw Error('Invalid SVG XML: unterminated document type.');
 const entities=new Map<string,string>();if(subsetStart>=0&&subsetEnd>=0)parseSubset(raw.slice(subsetStart,subsetEnd),entities,issues);
 const body=raw.slice(end+1);return {text:raw.slice(0,at)+(entities.size?expandBody(body,entities):body),issues};
}
