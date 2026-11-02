import {View} from './font-view';
import type {GlyphPoint} from './ttf-outline';
/** Compact Font Format outlines for OpenType `OTTO` files. Type 2 charstrings run as drawing only: hints are skipped, and nothing but path operators reaches the result. */
export const CFF_OUTLINE_LIMITS={stack:513,calls:16,work:200000,points:8192,contours:512,dictionary:64,fonts:256} as const;
function fail(message:string):never{throw Error('SVG text outlines: '+message);}
interface Index {count:number;end:number;item:(i:number)=>View;}
function readIndex(v:View,at:number):Index{const count=v.u16(at);if(!count)return {count,end:at+2,item:()=>fail('invalid CFF index entry.')};const size=v.u8(at+2);if(size<1||size>4)fail('invalid CFF index.');const first=at+3,base=first+(count+1)*size-1,offset=(i:number)=>{let value=0;for(let k=0;k<size;k++)value=value*256+v.u8(first+i*size+k);return value;},last=offset(count);if(offset(0)!==1||last<1)fail('invalid CFF index.');v.check(base+1,last-1);return {count,end:base+last,item:i=>{if(i<0||i>=count)fail('invalid CFF index entry.');const a=offset(i),b=offset(i+1);if(a<1||b<a||b>last)fail('invalid CFF index offsets.');return v.slice(base+a,b-a);}};}
/** A real number is binary-coded decimal: one digit or symbol per nibble, ended by 0xf. */
function readReal(v:View,at:number){let text='';for(let i=0;i<64;i++){const b=v.u8(at++);for(const n of [b>>4,b&15]){if(n===15){const value=Number(text);if(!Number.isFinite(value))fail('invalid CFF number.');return {value,at};}if(n===13)fail('invalid CFF number.');text+=n<10?String(n):n===10?'.':n===11?'E':n===12?'E-':'-';}}return fail('invalid CFF number.');}
function readDict(v:View){const out=new Map<number,number[]>();let at=0,stack:number[]=[];while(at<v.length){const b=v.u8(at++);if(b<=21){const op=b===12?1200+v.u8(at++):b;out.set(op,stack);stack=[];continue;}if(b===28){stack.push(v.s16(at));at+=2;}else if(b===29){stack.push(v.s32(at));at+=4;}else if(b===30){const real=readReal(v,at);stack.push(real.value);at=real.at;}else if(b>=32&&b<=246)stack.push(b-139);else if(b>=247&&b<=250)stack.push((b-247)*256+v.u8(at++)+108);else if(b>=251&&b<=254)stack.push(-(b-251)*256-v.u8(at++)-108);else fail('invalid CFF dictionary.');if(stack.length>CFF_OUTLINE_LIMITS.dictionary)fail('invalid CFF dictionary.');}return out;}
const OP={charset:15,charStrings:17,private:18,subrs:19,matrix:1207,charstringType:1206,syntheticBase:1220,ros:1230,fdArray:1236,fdSelect:1237} as const;
const bias=(count:number)=>count<1240?107:count<33900?1131:32768;
/** StandardEncoding as SID ranges: seac names its two parts by these codes, which the charset turns into glyphs. */
const STANDARD_RANGES=[[32,126,1],[161,175,96],[177,180,111],[182,189,115],[191,191,123],[193,200,124],[202,203,132],[205,208,134],[225,225,138],[227,227,139],[232,235,140],[241,241,144],[245,245,145],[248,251,146]];
const standardSid=(code:number)=>{for(const [lo,hi,sid] of STANDARD_RANGES)if(code>=lo&&code<=hi)return sid+code-lo;return fail('a composite glyph names an unknown standard character.');};
/** One effective 1/unitsPerEm matrix, or refusal: a sheared or rescaled charstring space would need a transform this font's other tables never state. */
function checkMatrix(top:number[]|undefined,face:number[]|undefined,units:number){const valid=(m:number[])=>m.length===6&&m.every(Number.isFinite);for(const m of [top,face])if(m&&!valid(m))fail('invalid CFF font matrix.');const a=top??[.001,0,0,.001,0,0],b=face??[1,0,0,1,0,0],m=top&&face?[b[0]*a[0]+b[1]*a[2],b[0]*a[1]+b[1]*a[3],b[2]*a[0]+b[3]*a[2],b[2]*a[1]+b[3]*a[3],b[4]*a[0]+b[5]*a[2]+a[4],b[4]*a[1]+b[5]*a[3]+a[5]]:face&&!top?b:a,scale=m[0]*units;if(Math.abs(scale-1)>1e-4||Math.abs(m[3]*units-1)>1e-4||Math.abs(m[1])>1e-9||Math.abs(m[2])>1e-9||Math.abs(m[4])>1e-9||Math.abs(m[5])>1e-9)fail('this CFF font matrix does not match its em size.');}
export function parseCff(table:View,glyphCount:number,units:number){
 if(table.u8(0)!==1)fail('only CFF version 1 outlines are supported.');
 const names=readIndex(table,table.u8(2)),tops=readIndex(table,names.end),strings=readIndex(table,tops.end),globals=readIndex(table,strings.end);if(names.count!==1||tops.count!==1)fail('a CFF font set is not supported.');
 const top=readDict(tops.item(0)),typeOf=top.get(OP.charstringType)?.[0]??2;if(typeOf!==2)fail('only Type 2 charstrings are supported.');if(top.has(OP.syntheticBase))fail('synthetic CFF fonts are not supported.');
 const charStrings=readIndex(table,top.get(OP.charStrings)?.[0]??fail('the CFF font has no charstrings.'));if(charStrings.count!==glyphCount)fail('the CFF glyph count disagrees with the font.');
 const cid=top.has(OP.ros),localSubrs=(d:Map<number,number[]>)=>{const p=d.get(OP.private);if(!p)return undefined;const [size,offset]=p;if(p.length!==2)fail('invalid CFF private dictionary.');const inner=readDict(table.slice(offset,size)),at=inner.get(OP.subrs)?.[0];return at===undefined?undefined:readIndex(table,offset+at);};
 const locals:(Index|undefined)[]=[],owner=new Uint8Array(glyphCount);
 if(cid){const fonts=readIndex(table,top.get(OP.fdArray)?.[0]??fail('the CID font has no font dictionaries.'));if(!fonts.count||fonts.count>CFF_OUTLINE_LIMITS.fonts)fail('invalid CID font dictionaries.');for(let i=0;i<fonts.count;i++){const d=readDict(fonts.item(i));checkMatrix(top.get(OP.matrix),d.get(OP.matrix),units);locals.push(localSubrs(d));}
  const at=top.get(OP.fdSelect)?.[0]??fail('the CID font has no font selection.'),format=table.u8(at);if(format===0){table.check(at+1,glyphCount);for(let i=0;i<glyphCount;i++)owner[i]=table.u8(at+1+i);}else if(format===3){const ranges=table.u16(at+1);if(!ranges)fail('invalid CID font selection.');table.check(at+3,ranges*3+2);if(table.u16(at+3)!==0||table.u16(at+3+ranges*3)!==glyphCount)fail('invalid CID font selection.');let previous=0;for(let i=0;i<ranges;i++){const first=table.u16(at+3+i*3),next=table.u16(at+6+i*3);if(i&&first<=previous||next<=first||next>glyphCount)fail('invalid CID font selection.');previous=first;owner.fill(table.u8(at+5+i*3),first,next);}}else fail('unsupported CID font selection format.');for(let i=0;i<glyphCount;i++)if(owner[i]>=fonts.count)fail('a glyph names a missing font dictionary.');
 }else{checkMatrix(top.get(OP.matrix),undefined,units);locals.push(localSubrs(top));}
 let sids:Map<number,number>|undefined;const glyphForSid=(sid:number)=>{if(!sids){sids=new Map([[0,0]]);const at=top.get(OP.charset)?.[0]??0;if(at===0)for(let i=1;i<Math.min(glyphCount,229);i++)sids.set(i,i);else if(at<=2)fail('composite glyphs in a predefined expert charset are unsupported.');else{const format=table.u8(at);let gid=1,cursor=at+1;if(format===0)for(;gid<glyphCount;gid++,cursor+=2)sids.set(table.u16(cursor),gid);else if(format===1||format===2)while(gid<glyphCount){const first=table.u16(cursor),left=format===1?table.u8(cursor+2):table.u16(cursor+2);cursor+=format===1?3:4;for(let i=0;i<=left&&gid<glyphCount;i++)sids.set(first+i,gid++);}else fail('invalid CFF charset.');}}const found=sids.get(sid);if(!found)fail('a composite glyph part is missing from this font.');return found;};
 return {contours(id:number){
  const contours:GlyphPoint[][]=[];let points=0,work=0;
  const draw=(gid:number,ox:number,oy:number,part:boolean)=>{
   const stack:number[]=[],local=locals[owner[gid]];let x=ox,y=oy,stems=0,sized=false,open:GlyphPoint[]|undefined;
   const add=(px:number,py:number,on:boolean)=>{if(!Number.isFinite(px)||!Number.isFinite(py)||Math.abs(px)>1e6||Math.abs(py)>1e6)fail('glyph coordinates exceed the supported range.');if(++points>CFF_OUTLINE_LIMITS.points)fail('glyph point budget exceeded.');open!.push({x:px,y:py,on});};
   const close=()=>{if(open&&open.length>1){const a=open[0],z=open.at(-1)!;if(z.x===a.x&&z.y===a.y&&open.at(-2)!.on)open.pop();if(open.length>1){if(contours.length>=CFF_OUTLINE_LIMITS.contours)fail('glyph contour budget exceeded.');contours.push(open);}}open=undefined;};
   const move=(dx:number,dy:number)=>{close();x+=dx;y+=dy;open=[];add(x,y,true);},line=(dx:number,dy:number)=>{if(!open)fail('a CFF outline draws before it moves.');x+=dx;y+=dy;add(x,y,true);};
   const curve=(a:number,b:number,c:number,d:number,e:number,f:number)=>{if(!open)fail('a CFF outline draws before it moves.');const x1=x+a,y1=y+b,x2=x1+c,y2=y1+d;x=x2+e;y=y2+f;add(x1,y1,false);add(x2,y2,false);add(x,y,true);};
   /* The first stack-clearing operator may carry the glyph width below its own arguments; hmtx is what lays out, so it is dropped. */
   const width=(extra:boolean)=>{if(!sized){sized=true;if(extra)stack.shift();}};
   const need=(ok:boolean)=>{if(!ok)fail('malformed CFF charstring.');};
   const hints=()=>{width(stack.length%2===1);need(stack.length%2===0);stems+=stack.length/2;stack.length=0;};
   const seac=()=>{if(cid||part)fail('this composite glyph form is not valid here.');const [adx,ady,base,accent]=stack;if(![base,accent].every(v=>Number.isInteger(v)&&v>=0&&v<=255))fail('invalid composite glyph parts.');close();draw(glyphForSid(standardSid(base)),ox,oy,true);draw(glyphForSid(standardSid(accent)),ox+adx,oy+ady,true);};
   const alternate=(horizontal:boolean)=>{need(stack.length>0);for(const d of stack){if(horizontal)line(d,0);else line(0,d);horizontal=!horizontal;}};
   const turning=(horizontal:boolean)=>{const n=stack.length;need(n>=4&&(n%4===0||n%4===1));for(let i=0;i+4<=n;i+=4){const last=n-i===5?stack[i+4]:0;if(horizontal)curve(stack[i],0,stack[i+1],stack[i+2],last,stack[i+3]);else curve(0,stack[i],stack[i+1],stack[i+2],stack[i+3],last);horizontal=!horizontal;}};
   const escape=(op:number)=>{const s=stack,n=s.length;switch(op){
    case 34:need(n===7);curve(s[0],0,s[1],s[2],s[3],0);curve(s[4],0,s[5],-s[2],s[6],0);break;
    case 35:need(n===13);curve(s[0],s[1],s[2],s[3],s[4],s[5]);curve(s[6],s[7],s[8],s[9],s[10],s[11]);break;
    case 36:need(n===9);curve(s[0],s[1],s[2],s[3],s[4],0);curve(s[5],0,s[6],s[7],s[8],-(s[1]+s[3]+s[7]));break;
    case 37:{need(n===11);const dx=s[0]+s[2]+s[4]+s[6]+s[8],dy=s[1]+s[3]+s[5]+s[7]+s[9],wide=Math.abs(dx)>Math.abs(dy);curve(s[0],s[1],s[2],s[3],s[4],s[5]);curve(s[6],s[7],s[8],s[9],wide?s[10]:-dx,wide?-dy:s[10]);break;}
    case 9:need(n>0);s[n-1]=Math.abs(s[n-1]);return;case 14:need(n>0);s[n-1]=-s[n-1];return;
    case 10:case 11:case 12:case 24:{need(n>1);const b=s.pop()!,a=s.pop()!;s.push(op===10?a+b:op===11?a-b:op===12?a/b:a*b);return;}
    case 18:need(n>0);s.pop();return;case 27:need(n>0);s.push(s[n-1]);return;case 28:need(n>1);[s[n-1],s[n-2]]=[s[n-2],s[n-1]];return;
    default:fail('unsupported CFF charstring operator.');
   }s.length=0;};
   const run=(v:View,depth:number):boolean=>{let at=0;while(at<v.length){if(++work>CFF_OUTLINE_LIMITS.work)fail('CFF charstring work budget exceeded.');const b=v.u8(at++);
    if(b>=32||b===28){let value:number;if(b===28){value=v.s16(at);at+=2;}else if(b<=246)value=b-139;else if(b<=250)value=(b-247)*256+v.u8(at++)+108;else if(b<=254)value=-(b-251)*256-v.u8(at++)-108;else{value=v.s32(at)/65536;at+=4;}if(stack.length>=CFF_OUTLINE_LIMITS.stack)fail('CFF charstring stack exceeded.');stack.push(value);continue;}
    const s=stack,n=s.length;switch(b){
     case 1:case 3:case 18:case 23:hints();break;
     case 19:case 20:hints();at+=Math.ceil(stems/8);v.check(0,at);break;
     case 21:width(n>2);need(s.length===2);move(s[0],s[1]);break;
     case 22:width(n>1);need(s.length===1);move(s[0],0);break;
     case 4:width(n>1);need(s.length===1);move(0,s[0]);break;
     case 5:need(n>0&&n%2===0);for(let i=0;i<n;i+=2)line(s[i],s[i+1]);break;
     case 6:alternate(true);break;case 7:alternate(false);break;
     case 8:need(n>0&&n%6===0);for(let i=0;i<n;i+=6)curve(s[i],s[i+1],s[i+2],s[i+3],s[i+4],s[i+5]);break;
     case 24:{need(n>=8&&(n-2)%6===0);let i=0;for(;i+2<n;i+=6)curve(s[i],s[i+1],s[i+2],s[i+3],s[i+4],s[i+5]);line(s[i],s[i+1]);break;}
     case 25:{need(n>=8&&(n-6)%2===0);let i=0;for(;i+6<n;i+=2)line(s[i],s[i+1]);curve(s[i],s[i+1],s[i+2],s[i+3],s[i+4],s[i+5]);break;}
     case 26:{need(n>=4&&(n%4===0||n%4===1));let i=n%4,first=i?s[0]:0;for(;i<n;i+=4){curve(first,s[i],s[i+1],s[i+2],0,s[i+3]);first=0;}break;}
     case 27:{need(n>=4&&(n%4===0||n%4===1));let i=n%4,first=i?s[0]:0;for(;i<n;i+=4){curve(s[i],first,s[i+1],s[i+2],s[i+3],0);first=0;}break;}
     case 30:turning(false);break;case 31:turning(true);break;
     case 10:case 29:{const list=b===10?local:globals;if(!list||!n)fail('invalid CFF subroutine call.');if(depth>=CFF_OUTLINE_LIMITS.calls)fail('CFF subroutine depth exceeded.');if(run(list.item(s.pop()!+bias(list.count)),depth+1))return true;continue;}
     case 11:return false;
     case 12:escape(v.u8(at++));continue;
     case 14:width(n===1||n===5);need(s.length===0||s.length===4);if(s.length===4)seac();close();s.length=0;return true;
     default:fail('unsupported CFF charstring operator.');
    }s.length=0;}return false;};
   run(charStrings.item(gid),0);close();
  };
  draw(id,0,0,false);return contours;
 }};
}
