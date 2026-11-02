import type {Matrix} from './transforms';
import {identity,multiply} from './transforms';
import {svgNamedColors} from './svg-css';
/** CSS value grammar for SVG import: lengths, calc(), colors, var() and transform lists. Every reader here checks a
 * value's length first, uses no pattern that can backtrack, and returns undefined rather than throwing on text it
 * cannot read, so a caller can do what a browser does: ignore it. */
export const SVG_VALUE_LIMITS={length:4096,color:1024,transform:65536,font:8192,css:65536} as const;
export interface SvgLengthContext {font:number;rem:number;vw:number;vh:number;ex?:()=>number;}
const number=String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?`,plain=new RegExp(`^(${number})([a-z%]*)$`,'i'),measure=new RegExp(`${number}[a-z%]*`,'iy');
const blank=(c:string)=>c===' '||c==='\t'||c==='\n'||c==='\r'||c==='\f';
const FIXED:Record<string,number>={'':1,px:1,pt:96/72,pc:16,in:96,cm:96/2.54,mm:96/25.4,q:96/101.6};
function unit(name:string,reference:number,c:SvgLengthContext):number|undefined{const u=name.toLowerCase();if(Object.hasOwn(FIXED,u))return FIXED[u];switch(u){case '%':return reference/100;case 'em':case 'ic':return c.font;case 'ex':return c.ex?.()??c.font/2;case 'ch':return c.font/2;case 'cap':return c.font*.7;case 'lh':return c.font*1.2;case 'rem':return c.rem;case 'rlh':return c.rem*1.2;case 'vw':case 'svw':case 'lvw':case 'dvw':return c.vw/100;case 'vh':case 'svh':case 'lvh':case 'dvh':return c.vh/100;case 'vmin':case 'svmin':case 'lvmin':case 'dvmin':return Math.min(c.vw,c.vh)/100;case 'vmax':case 'svmax':case 'lvmax':case 'dvmax':return Math.max(c.vw,c.vh)/100;}return undefined;}
/** The tokens of a math expression, read by hand so a long word cannot restart a scan at every letter. */
function calcTokens(raw:string):string[]|undefined{const out:string[]=[];let at=0;while(at<raw.length){const c=raw[at];if(blank(c)){at++;continue;}if(c==='('||c===')'||c==='*'||c==='/'||c===','){out.push(c);at++;}else{measure.lastIndex=at;const m=measure.exec(raw);if(m){out.push(m[0]);at=measure.lastIndex;}else if((c==='+'||c==='-')&&!/[a-z]/i.test(raw[at+1]??'')){out.push(c);at++;}else{const start=at;while(at<raw.length&&/[a-z-]/i.test(raw[at]))at++;if(at===start||raw[at]!=='(')return;at++;out.push(raw.slice(start,at));}}if(out.length>400)return;}return out;}
/** calc(), min(), max() and clamp() over numbers that already resolve to user units. */
function calcValue(raw:string,leaf:(value:number,unit:string)=>number|undefined):number|undefined{
 const tokens=calcTokens(raw);if(!tokens)return;
 let at=0;const fail=()=>{throw 0;},value=(depth:number):number=>{if(depth>32)fail();const t=tokens[at++];if(t===undefined)return fail() as never;if(t==='(')return close(sum(depth+1));if(t==='-'){return -value(depth+1);}if(t==='+')return value(depth+1);if(t.endsWith('(')){const name=t.slice(0,-1).toLowerCase(),args=[sum(depth+1)];while(tokens[at]===','){at++;args.push(sum(depth+1));}close(0);if(name==='calc'&&args.length===1)return args[0];if(name==='min')return Math.min(...args);if(name==='max')return Math.max(...args);if(name==='clamp'&&args.length===3)return Math.max(args[0],Math.min(args[1],args[2]));return fail() as never;}const m=plain.exec(t);if(!m)return fail() as never;const out=leaf(Number(m[1]),m[2]);return out===undefined?fail() as never:out;},close=(v:number)=>{if(tokens[at++]!==')')fail();return v;},product=(depth:number)=>{let v=value(depth);for(;;){const t=tokens[at];if(t==='*'){at++;v*=value(depth);}else if(t==='/'){at++;v/=value(depth);}else return v;}},sum=(depth:number):number=>{let v=product(depth);for(;;){const t=tokens[at];if(t==='+'){at++;v+=product(depth);}else if(t==='-'){at++;v-=product(depth);}else if(t&&/^[+-]/.test(t)&&t.length>1)v+=product(depth);else return v;}};
 try{const out=sum(0);return at===tokens.length&&Number.isFinite(out)?out:undefined;}catch{return undefined;}
}
export function svgLength(raw:string,reference:number,c:SvgLengthContext):number|undefined{if(raw.length>SVG_VALUE_LIMITS.length)return;const text=raw.trim(),m=plain.exec(text);let out:number|undefined;if(m){const factor=unit(m[2],reference,c);out=factor===undefined?undefined:Number(m[1])*factor;}else if(/^(?:calc|min|max|clamp)\(/i.test(text))out=calcValue(text,(value,name)=>{const factor=unit(name,reference,c);return factor===undefined?undefined:value*factor;});return out!==undefined&&Number.isFinite(out)?out:undefined;}
const clamp=(v:number,low=0,high=1)=>Math.max(low,Math.min(high,v));
const hex=(rgb:number[])=>'#'+rgb.map(v=>Math.round(clamp(v)*255).toString(16).padStart(2,'0')).join('');
/** A color only exists if every channel came out as a number; huge inputs can cancel to NaN inside a conversion. */
const finished=(rgb:number[]|undefined,alpha:number)=>rgb&&rgb.every(Number.isFinite)?{color:hex(rgb),alpha}:undefined;
const percentOr=(raw:string,scale:number):number|undefined=>{if(raw==='none')return 0;const m=plain.exec(raw);if(!m||m[2]&&m[2]!=='%')return;const out=Number(m[1])*(m[2]?scale/100:1);return Number.isFinite(out)?out:undefined;};
function hue(raw:string):number|undefined{if(raw==='none')return 0;const m=plain.exec(raw);if(!m)return;const v=Number(m[1]);if(!Number.isFinite(v))return;switch(m[2].toLowerCase()){case '':case 'deg':return v;case 'grad':return v*.9;case 'rad':return v*180/Math.PI;case 'turn':return v*360;}return undefined;}
/** The arguments of a color function: channels, then alpha after a slash or as a fourth comma value. */
function channels(body:string):{parts:string[];alpha:number}|undefined{const slash=body.indexOf('/'),main=(slash<0?body:body.slice(0,slash)).trim(),parts=main.split(/[\s,]+/).filter(Boolean);let raw=slash<0?undefined:body.slice(slash+1).trim();if(raw===undefined&&parts.length===4&&main.includes(','))raw=parts.pop();if(parts.length!==3)return;const alpha=raw===undefined?1:percentOr(raw,1);return alpha===undefined?undefined:{parts,alpha:clamp(alpha)};}
const hslRgb=(h:number,s:number,l:number)=>{const a=s*Math.min(l,1-l),f=(n:number)=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return [f(0),f(8),f(4)];};
const encode=(v:number)=>{const a=Math.abs(v);return Math.sign(v)*(a<=.0031308?a*12.92:1.055*a**(1/2.4)-.055);};
const decode=(v:number)=>{const a=Math.abs(v);return Math.sign(v)*(a<=.04045?a/12.92:((a+.055)/1.055)**2.4);};
const fromXyz65=(x:number,y:number,z:number)=>[3.2409699*x-1.5373832*y-.4986108*z,-.9692436*x+1.8759675*y+.0415551*z,.0556301*x-.203977*y+1.0569715*z].map(encode);
const fromOklab=(l:number,a:number,b:number)=>{const L=(l+.3963377774*a+.2158037573*b)**3,M=(l-.1055613458*a-.0638541728*b)**3,S=(l-.0894841775*a-1.291485548*b)**3;return [4.0767416621*L-3.3077115913*M+.2309699292*S,-1.2684380046*L+2.6097574011*M-.3413193965*S,-.0041960863*L-.7034186147*M+1.707614701*S].map(encode);};
const fromLab=(l:number,a:number,b:number)=>{const fy=(l+16)/116,fx=fy+a/500,fz=fy-b/200,f=(t:number)=>t>6/29?t**3:3*(6/29)**2*(t-4/29),x=.96422*f(fx),y=f(fy),z=.82521*f(fz);return fromXyz65(.9555766*x-.0230393*y+.0631636*z,-.0282895*x+1.0099416*y+.0210077*z,.0122982*x-.020483*y+1.3299098*z);};
function modernColor(name:string,body:string):{color:string;alpha:number}|undefined{
 if(name==='color'){const space=/^\s*([\w-]+)\s+(.*)$/.exec(body);if(!space)return;const read=channels(space[2]);if(!read)return;const v=read.parts.map(p=>percentOr(p,1));if(v.some(x=>x===undefined))return;const [a,b,c]=v as number[];let rgb:number[]|undefined;if(space[1]==='srgb')rgb=[a,b,c];else if(space[1]==='srgb-linear')rgb=[a,b,c].map(encode);else if(space[1]==='display-p3'){const [r,g,l]=[a,b,c].map(decode);rgb=[1.2249402*r-.2249402*g,-.0420569*r+1.0420569*g,-.0196376*r-.0786361*g+1.0982735*l].map(encode);}else if(space[1]==='xyz'||space[1]==='xyz-d65')rgb=fromXyz65(a,b,c);return finished(rgb,read.alpha);}
 const read=channels(body);if(!read)return;const [p,q,r]=read.parts;let rgb:number[]|undefined;
 if(name==='hwb'){const h=hue(p),w=percentOr(q,1),b=percentOr(r,1);if(h===undefined||w===undefined||b===undefined)return;const sum=w+b;rgb=sum>=1?[w/sum,w/sum,w/sum]:hslRgb((h%360+360)%360,1,.5).map(v=>v*(1-w-b)+w);}
 else if(name==='lab'){const l=percentOr(p,100),a=percentOr(q,125),b=percentOr(r,125);if(l===undefined||a===undefined||b===undefined)return;rgb=fromLab(l,a,b);}
 else if(name==='lch'){const l=percentOr(p,100),c=percentOr(q,150),h=hue(r);if(l===undefined||c===undefined||h===undefined)return;rgb=fromLab(l,c*Math.cos(h*Math.PI/180),c*Math.sin(h*Math.PI/180));}
 else if(name==='oklab'){const l=percentOr(p,1),a=percentOr(q,.4),b=percentOr(r,.4);if(l===undefined||a===undefined||b===undefined)return;rgb=fromOklab(l,a,b);}
 else if(name==='oklch'){const l=percentOr(p,1),c=percentOr(q,.4),h=hue(r);if(l===undefined||c===undefined||h===undefined)return;rgb=fromOklab(l,c*Math.cos(h*Math.PI/180),c*Math.sin(h*Math.PI/180));}
 return finished(rgb,read.alpha);
}
const named:Record<string,string>={black:'#000000',white:'#ffffff',red:'#ff0000',lime:'#00ff00',blue:'#0000ff',yellow:'#ffff00',cyan:'#00ffff',aqua:'#00ffff',magenta:'#ff00ff',fuchsia:'#ff00ff',gray:'#808080',grey:'#808080',silver:'#c0c0c0',maroon:'#800000',olive:'#808000',green:'#008000',purple:'#800080',teal:'#008080',navy:'#000080',orange:'#ffa500',pink:'#ffc0cb',rebeccapurple:'#663399'};
/** Every CSS color form a browser reads except color-mix() and relative colors. */
export function svgColor(raw:string):{color:string;alpha:number}|undefined{
 if(raw.length>SVG_VALUE_LIMITS.color)return;const text=raw.trim().toLowerCase();if(text==='transparent')return {color:'#000000',alpha:0};const known=Object.hasOwn(named,text)?named[text]:Object.hasOwn(svgNamedColors,text)?svgNamedColors[text]:undefined;if(known)return {color:known,alpha:1};
 if(/^#[\da-f]{3,4}$/.test(text)){const long='#'+[...text.slice(1)].map(c=>c+c).join('');return {color:long.slice(0,7),alpha:long.length===9?parseInt(long.slice(7),16)/255:1};}if(/^#[\da-f]{6}(?:[\da-f]{2})?$/.test(text))return {color:text.slice(0,7),alpha:text.length===9?parseInt(text.slice(7),16)/255:1};
 const call=/^([a-z0-9-]+)\((.*)\)$/s.exec(text);if(!call)return;const [,name,body]=call;
 if(name==='light-dark'){let depth=0;for(let i=0;i<body.length;i++){if(body[i]==='(')depth++;else if(body[i]===')')depth--;else if(body[i]===','&&!depth)return svgColor(body.slice(0,i));}return;}
 if(name==='rgb'||name==='rgba'){const read=channels(body);if(!read)return;const v=read.parts.map(p=>percentOr(p,255));if(v.some(x=>x===undefined))return;return finished((v as number[]).map(x=>x/255),read.alpha);}
 if(name==='hsl'||name==='hsla'){const read=channels(body);if(!read)return;const h=hue(read.parts[0]),s=percentOr(read.parts[1],1),l=percentOr(read.parts[2],1);if(h===undefined||s===undefined||l===undefined)return;const scale=/%/.test(read.parts[1])||read.parts[1]==='none'?1:.01,lightness=/%/.test(read.parts[2])||read.parts[2]==='none'?1:.01;return finished(hslRgb((h%360+360)%360,clamp(s*scale),clamp(l*lightness)),read.alpha);}
 return modernColor(name,body);
}
const VAR_LIMIT={depth:32,length:65536,steps:10000} as const;
/** What one substitution may spend. Fallbacks can double with every level and still print nothing, so length alone cannot stop them. */
export interface SvgVarBudget {left:number;}
function closeParen(text:string,open:number){let depth=0,quote='';for(let i=open;i<text.length;i++){const c=text[i];if(quote){if(c==='\\')i++;else if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='(')depth++;else if(c===')'&&!--depth)return i;}return -1;}
/** Replaces var() through the inherited custom properties. A cycle, a missing name with no fallback or runaway growth makes the whole value invalid. */
export function substituteVars(value:string,lookup:(name:string)=>string|undefined,stack:string[]=[],budget:SvgVarBudget={left:VAR_LIMIT.steps},depth=0):string|undefined{
 if(!/var\(/i.test(value))return value;budget.left-=1+(value.length>>6);if(budget.left<0||stack.length>VAR_LIMIT.depth||depth>VAR_LIMIT.depth)return;const lower=value.toLowerCase();let out='',at=0;
 for(;;){const low=lower.indexOf('var(',at);if(low<0){out+=value.slice(at);break;}const end=closeParen(value,low+3);if(end<0)return;out+=value.slice(at,low);const body=value.slice(low+4,end),comma=body.indexOf(','),name=(comma<0?body:body.slice(0,comma)).trim(),fallback=comma<0?undefined:body.slice(comma+1);if(!name.startsWith('--'))return;
  let piece:string|undefined;if(!stack.includes(name)){const found=lookup(name);if(found!==undefined)piece=substituteVars(found,lookup,[...stack,name],budget,depth+1);}if(piece===undefined&&fallback!==undefined&&budget.left>=0)piece=substituteVars(fallback.trim(),lookup,stack,budget,depth+1);if(piece===undefined)return;out+=piece;if(out.length>VAR_LIMIT.length)return;at=end+1;}
 return out;
}
const ANGLE=new RegExp(`^(${number})(deg|grad|rad|turn)?$`,'i');
function angle(raw:string):number|undefined{if(raw.length>SVG_VALUE_LIMITS.length)return;const text=raw.trim();const m=ANGLE.exec(text);if(m){const v=Number(m[1]);return m[2]?.toLowerCase()==='rad'?v:m[2]?.toLowerCase()==='turn'?v*2*Math.PI:m[2]?.toLowerCase()==='grad'?v*Math.PI/200:v*Math.PI/180;}if(!/^calc\(/i.test(text))return;return calcValue(text,(value,name)=>{const u=name.toLowerCase();return u===''||u==='deg'?value*Math.PI/180:u==='rad'?value:u==='turn'?value*2*Math.PI:u==='grad'?value*Math.PI/200:undefined;});}
/** Numbers may touch with no separator, as in translate(0-464), which optimizers write. */
const args=(body:string)=>{const out:string[]=[];let depth=0,current='';const flush=()=>{if(!current)return;if(current.includes('('))out.push(current);else out.push(...current.match(new RegExp(`${number}[a-z%]*|[^\\s]+`,'gi'))??[]);current='';};for(const c of body){if(c==='(')depth++;else if(c===')')depth--;if(!depth&&(c===','||c===' '||c==='\t'||c==='\n'||c==='\r'))flush();else current+=c;}flush();return out;};
export interface SvgTransformBox {width:number;height:number;}
/** Attribute and CSS transform lists share one reader: bare numbers read as user units and degrees, as the attribute has always allowed. Percentages need the reference box. */
export function svgTransformList(raw:string,box:SvgTransformBox={width:0,height:0},c:SvgLengthContext={font:16,rem:16,vw:0,vh:0}):Matrix|undefined{
 if(raw.length>SVG_VALUE_LIMITS.transform)return;let out:Matrix=[...identity],at=0,count=0;const text=raw.trim();if(!text||text==='none')return out;
 while(at<text.length){while(at<text.length&&(text[at]===','||text[at].trim()===''))at++;if(at>=text.length)break;const name=/^[A-Za-z][A-Za-z0-9]*/.exec(text.slice(at,at+24))?.[0];if(!name)return;const open=at+name.length;if(text[open]!=='(')return;const end=closeParen(text,open);if(end<0||++count>100)return;const values=args(text.slice(open+1,end)),len=(v:string|undefined,reference:number)=>v===undefined?0:svgLength(v,reference,c),n=(v:string|undefined)=>{if(v===undefined)return;const m=plain.exec(v.trim());if(m&&!m[2])return Number(m[1]);if(m&&m[2]==='%')return Number(m[1])/100;return calcValue(v,(x,u)=>u?undefined:x);};let m:Matrix;
  switch(name.toLowerCase()){
   case 'matrix':{if(values.length!==6)return;const v=values.map(n);if(v.some(x=>x===undefined))return;m=[...v] as Matrix;break;}
   case 'matrix3d':{if(values.length!==16)return;const v=values.map(n);if(v.some(x=>x===undefined))return;const f=v as number[];if(f[2]||f[3]||f[6]||f[7]||f[8]||f[9]||f[11]||f[10]!==1||f[15]!==1)return;m=[f[0],f[1],f[4],f[5],f[12],f[13]];break;}
   case 'translate':case 'translate3d':{if(!values.length||values.length>(name.length>9?3:2))return;const x=len(values[0],box.width),y=len(values[1],box.height);if(x===undefined||y===undefined)return;m=[1,0,0,1,x,y];break;}
   case 'translatex':{const x=len(values[0],box.width);if(x===undefined||values.length!==1)return;m=[1,0,0,1,x,0];break;}
   case 'translatey':{const y=len(values[0],box.height);if(y===undefined||values.length!==1)return;m=[1,0,0,1,0,y];break;}
   case 'translatez':m=[...identity];break;
   case 'scale':case 'scale3d':{if(!values.length||values.length>(name.length>5?3:2))return;const x=n(values[0]),y=values[1]===undefined?x:n(values[1]);if(x===undefined||y===undefined)return;m=[x,0,0,y,0,0];break;}
   case 'scalex':{const x=n(values[0]);if(x===undefined||values.length!==1)return;m=[x,0,0,1,0,0];break;}
   case 'scaley':{const y=n(values[0]);if(y===undefined||values.length!==1)return;m=[1,0,0,y,0,0];break;}
   case 'rotate':case 'rotatez':{if(values.length!==1&&values.length!==3)return;const r=angle(values[0]);if(r===undefined)return;const s=Math.sin(r),co=Math.cos(r);m=[co,s,-s,co,0,0];if(values.length===3){const x=n(values[1]),y=n(values[2]);if(x===undefined||y===undefined)return;m=multiply(multiply([1,0,0,1,x,y],m),[1,0,0,1,-x,-y]);}break;}
   case 'skew':{if(!values.length||values.length>2)return;const a=angle(values[0]),b=values[1]===undefined?0:angle(values[1]);if(a===undefined||b===undefined)return;m=[1,Math.tan(b),Math.tan(a),1,0,0];break;}
   case 'skewx':{const a=angle(values[0]??'');if(a===undefined||values.length!==1)return;m=[1,0,Math.tan(a),1,0,0];break;}
   case 'skewy':{const a=angle(values[0]??'');if(a===undefined||values.length!==1)return;m=[1,Math.tan(a),0,1,0,0];break;}
   default:return;}
  out=multiply(out,m);if(out.some(v=>!Number.isFinite(v)))return;at=end+1;}
 return out;
}
export const svgAngle=angle;
/** The longhands of the `font` shorthand. A system font keyword has no size here, so it reads as unset. */
export function fontShorthand(raw:string):Record<string,string>|undefined{
 if(raw.length>SVG_VALUE_LIMITS.font)return;
 const parts:string[]=[];let quote='',depth=0,current='';for(const c of raw.trim()){if(quote){current+=c;if(c===quote)quote='';continue;}if(c==='"'||c==="'"){quote=c;current+=c;continue;}if(c==='(')depth++;if(c===')')depth--;if(!depth&&/\s/.test(c)){if(current)parts.push(current);current='';continue;}current+=c;}if(current)parts.push(current);
 const out:Record<string,string>={'font-style':'normal','font-variant':'normal','font-weight':'normal','font-stretch':'normal'},style=/^(?:italic|oblique|normal)$/i,weight=/^(?:bold|bolder|lighter|\d{3})$/i,variant=/^small-caps$/i,stretch=/^(?:(?:ultra-|extra-|semi-)?(?:condensed|expanded))$/i,size=/^(?:xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|larger|smaller)$/i;
 let i=0;for(;i<parts.length;i++){const p=parts[i];if(style.test(p)){if(p.toLowerCase()!=='normal')out['font-style']=p;}else if(weight.test(p))out['font-weight']=p;else if(variant.test(p))out['font-variant']=p;else if(stretch.test(p))out['font-stretch']=p;else break;}
 const head=parts[i];if(head===undefined)return;const slash=head.indexOf('/'),sized=slash<0?head:head.slice(0,slash);if(!size.test(sized)&&!plain.test(sized)&&!/^calc\(/i.test(sized))return;out['font-size']=sized;i++;if(slash<0&&parts[i]==='/')i+=2;else if(slash<0&&parts[i]?.startsWith('/'))i++;else if(head.endsWith('/'))i++;const family=parts.slice(i).join(' ');if(!family)return;out['font-family']=family;return out;
}
