const numberPattern=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const numeric=(n:number)=>{if(!Number.isFinite(n)||Math.abs(n)>1e6)throw Error('SVG coordinates exceed the supported range.');return n;};
/** Reject malformed path numbers/commands before Paper parses any geometry. */
export function validateSvgPathData(raw:string){if(typeof raw!=='string')throw Error('Enter SVG path data.');if(raw.length>2_000_000)throw Error('SVG path is too large.');const token=/[a-df-z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi,parts=raw.match(token)??[];if(raw.replace(token,'').replace(/[\s,]/g,''))throw Error('Invalid SVG path data.');if(parts.length>100000)throw Error('SVG path has too many coordinates.');if(!parts.length||!/^m$/i.test(parts[0]??''))throw Error('SVG paths must start with moveto.');const arity:Record<string,number>={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};for(let i=0;i<parts.length;){const command=parts[i++].toUpperCase(),count=arity[command];if(count===undefined)throw Error('Invalid SVG path command.');let n=0;while(i<parts.length&&numberPattern.test(parts[i])){const value=numeric(Number(parts[i++]));if(command==='A'&&(n%7===3||n%7===4)&&value!==0&&value!==1)throw Error('Invalid SVG arc flag.');if(command==='A'&&(n%7===0||n%7===1)&&value<0)throw Error('Invalid SVG arc radius.');n++;}if(count===0?n!==0:n===0||n%count!==0)throw Error('Invalid SVG path arguments.');}}
const ARITY:Record<string,number>={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};
const numberAt=/[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
const space=(c:string)=>c===' '||c==='\t'||c==='\n'||c==='\r'||c==='\f';
/** What a browser draws from path data, in a form Paper reads the same way: arc flags taken one digit at a time, a
 * zero-radius or zero-length arc as a line, and every segment before the first error. Out-of-range numbers still refuse. */
export function readSvgPath(raw:string):{data:string;truncated:boolean}{
 if(typeof raw!=='string')throw Error('Enter SVG path data.');if(raw.length>2_000_000)throw Error('SVG path is too large.');
 const out:string[]=[];let at=0,command='',count=0,truncated=false;const n=raw.length;
 const skip=(comma:boolean)=>{while(at<n&&space(raw[at]))at++;if(comma&&raw[at]===','){at++;while(at<n&&space(raw[at]))at++;}};
 const number=()=>{numberAt.lastIndex=at;const m=numberAt.exec(raw);if(!m)return;at=numberAt.lastIndex;return numeric(Number(m[0]));};
 const flag=()=>{const c=raw[at];if(c!=='0'&&c!=='1')return;at++;return c==='1'?1:0;};
 const lead=()=>{skip(false);return at>=n;};
 if(lead())return {data:'',truncated:false};
 if(raw[at]!=='M'&&raw[at]!=='m')return {data:'',truncated:true};
 for(;;){
  if(lead())break;const c=raw[at];let letter='';
  if(/[A-Za-z]/.test(c)){if(c==='e'||c==='E'||ARITY[c.toUpperCase()]===undefined){truncated=true;break;}at++;letter=c;}
  else if(!command||command==='Z'||command==='z'){truncated=true;break;}
  else letter=command==='M'&&count?'L':command==='m'&&count?'l':command;
  const upper=letter.toUpperCase(),arity=ARITY[upper];
  if(arity===0){out.push('Z');command=letter;count=1;if(out.length>100000)throw Error('SVG path has too many coordinates.');continue;}
  const before=at,values:number[]=[];let failed=false;
  for(let i=0;i<arity&&!failed;i++){skip(i>0);const value=upper==='A'&&(i===3||i===4)?flag():number();if(value===undefined)failed=true;else values.push(value);}
  if(failed){at=before;truncated=true;break;}
  if(out.length+arity>100000)throw Error('SVG path has too many coordinates.');
  if(upper==='A'&&(!values[0]||!values[1]))out.push((letter==='a'?'l':'L')+values[5]+' '+values[6]);
  else if(upper==='A')out.push(letter+Math.abs(values[0])+' '+Math.abs(values[1])+' '+values[2]+' '+values[3]+' '+values[4]+' '+values[5]+' '+values[6]);
  else out.push(letter+values.join(' '));
  command=letter;count=1;skip(true);
 }
 return {data:out.join(''),truncated};
}
