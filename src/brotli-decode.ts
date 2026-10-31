import {inflateSync} from 'fflate';
import {BROTLI_DICTIONARY_DEFLATED} from './brotli-dictionary';

/**
 * RFC 7932 decoder, whole buffer to whole buffer. WebKit has no Brotli DecompressionStream, and WOFF2 needs one to
 * read a font's own tables. Every length is bounded by `maxOutput` before it is written, so a hostile stream fails
 * instead of growing without limit. Compression lives elsewhere; nothing here writes Brotli.
 */
const WINDOW_GAP=16,ROOT_BITS=8,MAX_CODE=15,DICTIONARY_BYTES=122784;
const fail=(why:string):never=>{throw Error('Invalid Brotli stream: '+why+'.');};

class Bits {
 pos=0;val=0;bits=0;
 constructor(readonly data:Uint8Array,readonly end:number){}
 fill(){while(this.bits<=24&&this.pos<this.end){this.val|=this.data[this.pos++]<<this.bits;this.bits+=8;}}
 peek(n:number){return n?(this.val&(n===32?-1:(1<<n)-1))>>>0:0;}
 /** Reading past the end only fails if those missing bits are actually consumed. */
 drop(n:number){if(n>this.bits)fail('input ended early');this.val>>>=n;if(n===32)this.val=0;this.bits-=n;}
 read(n:number):number{if(!n)return 0;if(n>24){const low=this.read(16);return low+this.read(n-16)*65536;}this.fill();const v=this.peek(n);this.drop(n);return v;}
 align(){const skip=this.bits&7;if(skip&&this.read(skip))fail('nonzero padding');}
 /** Unread whole bytes go back to the byte stream, which is how uncompressed and metadata blocks are copied. */
 unfill(){this.align();this.pos-=this.bits>>3;this.val=0;this.bits=0;}
}

/** Two-level canonical table: 8 root bits, then a subtable for each longer prefix. Entry: value<<5 | isLink<<4 | bits. */
function codeTable(lengths:Uint8Array,size:number){
 const count=new Int32Array(MAX_CODE+2);let used=0,only=0;for(let i=0;i<size;i++)if(lengths[i]){count[lengths[i]]++;used++;only=i;}
 if(!used)fail('empty prefix code');
 if(used===1)return new Int32Array(1<<ROOT_BITS).fill(only<<5);
 const next=new Int32Array(MAX_CODE+2);let code=0,kraft=0;for(let len=1;len<=MAX_CODE;len++){code=(code+count[len-1])<<1;next[len]=code;kraft+=count[len]<<(MAX_CODE-len);}if(kraft!==1<<MAX_CODE)fail('incomplete prefix code');
 const reverse=(value:number,len:number)=>{let out=0;for(let i=0;i<len;i++){out=(out<<1)|(value&1);value>>=1;}return out;};
 const longest=new Uint8Array(1<<ROOT_BITS),rows:[number,number,number][]=[];for(let sym=0;sym<size;sym++){const len=lengths[sym];if(!len)continue;const rev=reverse(next[len]++,len);rows.push([sym,len,rev]);if(len>ROOT_BITS)longest[rev&255]=Math.max(longest[rev&255],len-ROOT_BITS);}
 let total=1<<ROOT_BITS;const offset=new Int32Array(1<<ROOT_BITS);for(let i=0;i<1<<ROOT_BITS;i++)if(longest[i]){offset[i]=total;total+=1<<longest[i];}
 const table=new Int32Array(total);for(let i=0;i<1<<ROOT_BITS;i++)if(longest[i])table[i]=(offset[i]<<5)|16|longest[i];
 for(const [sym,len,rev] of rows){if(len<=ROOT_BITS){const entry=(sym<<5)|len;for(let at=rev;at<1<<ROOT_BITS;at+=1<<len)table[at]=entry;continue;}const low=rev&255,high=rev>>>ROOT_BITS,sub=len-ROOT_BITS,span=1<<longest[low],entry=(sym<<5)|sub;for(let at=high;at<span;at+=1<<sub)table[offset[low]+at]=entry;}
 return table;
}
function symbol(b:Bits,table:Int32Array){b.fill();let entry=table[b.val&255];if(entry&16){b.drop(ROOT_BITS);entry=table[(entry>>>5)+(b.val&((1<<(entry&15))-1))];}b.drop(entry&15);return entry>>>5;}

const LENGTH_CODE_ORDER=[1,2,3,4,0,5,17,6,16,7,8,9,10,11,12,13,14,15],LENGTH_PREFIX_BITS=[2,2,2,3,2,2,2,4,2,2,2,3,2,2,2,4],LENGTH_PREFIX_VALUE=[0,4,3,2,0,4,3,1,0,4,3,2,0,4,3,5];
function complexCode(b:Bits,alphabet:number,skip:number){
 const meta=new Uint8Array(18);let space=32,found=0;for(let i=skip;i<18;i++){b.fill();const low=b.val&15,value=LENGTH_PREFIX_VALUE[low];b.drop(LENGTH_PREFIX_BITS[low]);meta[LENGTH_CODE_ORDER[i]]=value;if(value){space-=32>>value;found++;if(space<=0)break;}}
 if(found!==1&&space!==0)fail('bad code length code');
 const reader=codeTable(meta,18),lengths=new Uint8Array(alphabet);let at=0,previous=8,repeat=0,repeatLength=0,budget=32768;
 while(at<alphabet&&budget>0){const code=symbol(b,reader);if(code<16){repeat=0;lengths[at++]=code;if(code){previous=code;budget-=32768>>code;}continue;}const extra=code-14,value=code===16?previous:0;if(repeatLength!==value){repeat=0;repeatLength=value;}const before=repeat;if(repeat>0)repeat=(repeat-2)<<extra;repeat+=b.read(extra)+3;const add=repeat-before;if(at+add>alphabet)fail('code length overrun');lengths.fill(value,at,at+add);at+=add;if(value)budget-=add<<(15-value);}
 if(budget!==0)fail('unbalanced code lengths');return codeTable(lengths,alphabet);
}
function prefixCode(b:Bits,alphabet:number){
 const skip=b.read(2);if(skip!==1)return complexCode(b,alphabet,skip);
 const count=b.read(2)+1,width=32-Math.clz32(alphabet-1),symbols=Array.from({length:count},()=>{const v=b.read(width);if(v>=alphabet)fail('symbol out of range');return v;});if(new Set(symbols).size!==count)fail('repeated symbol');
 const lengths=new Uint8Array(alphabet);if(count===1)lengths[symbols[0]]=1;else if(count===2)symbols.forEach(s=>lengths[s]=1);else if(count===3){lengths[symbols[0]]=1;lengths[symbols[1]]=lengths[symbols[2]]=2;}else if(b.read(1)){lengths[symbols[0]]=1;lengths[symbols[1]]=2;lengths[symbols[2]]=lengths[symbols[3]]=3;}else symbols.forEach(s=>lengths[s]=2);
 return codeTable(lengths,alphabet);
}
/** 1..256 and similar small counts. */
function varByte(b:Bits){if(!b.read(1))return 0;const n=b.read(3);return n?(1<<n)+b.read(n):1;}
const BLOCK_BASE=[1,5,9,13,17,25,33,41,49,65,81,97,113,145,177,209,241,305,369,497,753,1265,2289,4337,8433,16625],BLOCK_EXTRA=[2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,7,8,9,10,11,12,13,24];
const blockLength=(b:Bits,table:Int32Array)=>{const code=symbol(b,table);return BLOCK_BASE[code]+b.read(BLOCK_EXTRA[code]);};
interface Blocks {types:number;left:number;type:number;last:number;typeCode?:Int32Array;lengthCode?:Int32Array;}
function blocks(b:Bits):Blocks{const types=varByte(b)+1;if(types<2)return {types,left:2**31,type:0,last:1};const typeCode=prefixCode(b,types+2),lengthCode=prefixCode(b,26);return {types,left:blockLength(b,lengthCode),type:0,last:1,typeCode,lengthCode};}
function switchBlock(b:Bits,row:Blocks){const code=symbol(b,row.typeCode!);const next=code===0?row.last:code===1?row.type+1:code-2;row.last=row.type;row.type=next%row.types;row.left=blockLength(b,row.lengthCode!);}
function contextMap(b:Bits,size:number,trees:number){const map=new Uint8Array(size);const run=b.read(1)?b.read(4)+1:0,code=prefixCode(b,trees+run);for(let i=0;i<size;){const sym=symbol(b,code);if(sym===0)map[i++]=0;else if(sym<=run){let zeros=(1<<sym)+b.read(sym);if(i+zeros>size)fail('context map overrun');while(zeros--)map[i++]=0;}else map[i++]=sym-run;}
 if(b.read(1)){const front=Uint8Array.from({length:256},(_,i)=>i);for(let i=0;i<size;i++){const at=map[i],value=front[at];map[i]=value;front.copyWithin(1,0,at);front[0]=value;}}return map;}

const INSERT_BASE=[0,1,2,3,4,5,6,8,10,14,18,26,34,50,66,98,130,194,322,578,1090,2114,6210,22594],INSERT_EXTRA=[0,0,0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,7,8,9,10,12,14,24];
const COPY_BASE=[2,3,4,5,6,7,8,9,10,12,14,18,22,30,38,54,70,102,134,198,326,582,1094,2118],COPY_EXTRA=[0,0,0,0,0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,7,8,9,10,24];
const INSERT_CELL=[0,0,0,0,8,8,0,16,8,16,16],COPY_CELL=[0,8,0,8,0,8,16,0,16,8,16];
const RING_INDEX=[1,2,3,4,1,1,1,1,1,1,2,2,2,2,2,2],RING_DELTA=[0,0,0,0,-1,1,-2,2,-3,3,-1,1,-2,2,-3,3];

const repeatPair=(a:number,b:number)=>Array.from({length:64},(_,i)=>i%2?b:a);
const UTF8_FIRST=Uint8Array.from([0,0,0,0,0,0,0,0,0,4,4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,12,16,12,12,20,12,16,24,28,12,12,32,12,36,12,44,44,44,44,44,44,44,44,44,44,32,32,24,40,28,12,12,48,52,52,52,48,52,52,52,48,52,52,52,52,52,48,52,52,52,52,52,48,52,52,52,52,52,24,12,28,12,12,12,56,60,60,60,56,60,60,60,56,60,60,60,60,60,56,60,60,60,60,60,56,60,60,60,60,60,24,12,28,12,0,...repeatPair(0,1),...repeatPair(2,3)]);
const UTF8_SECOND=Uint8Array.from({length:256},(_,i)=>i<33?0:i<48?1:i<58?2:i<65?1:i<91?2:i<97?1:i<123?3:i<127?1:i<224?0:2);
const SIGNED=Uint8Array.from({length:256},(_,i)=>i===0?0:i<16?1:i<64?2:i<128?3:i<192?4:i<240?5:i<255?6:7);

const SIZE_BITS=[0,0,0,0,10,10,11,11,10,10,10,10,10,9,9,8,7,7,8,7,7,6,6,5,5],WORD_OFFSET=new Int32Array(26);for(let i=4;i<25;i++)WORD_OFFSET[i+1]=WORD_OFFSET[i]+(SIZE_BITS[i]?i<<SIZE_BITS[i]:0);
const AFFIX_TEXT='\x01 \x02, \x08 of the \x04 of \x02s \x01.\x05 and \x04 in \x01"\x04 to \x02">\x01\n\x02. \x01]\x05 for \x03 a \x06 that \x01\'\x06 with \x06 from \x04 by \x01(\x06. The \x04 on \x04 as \x04 is \x04ing \x02\n\t\x01:\x03ed \x02="\x04 at \x03ly \x01,\x02=\'\x05.com/\x07. This \x05 not \x03er \x03al \x04ful \x04ive \x05less \x04est \x04ize \x02\xc2\xa0\x04ous \x05 the \x02e \x00';
const AFFIX_AT=[0,2,5,14,19,22,24,30,35,37,42,45,47,50,52,58,62,69,71,78,85,90,92,99,104,109,114,119,122,124,128,131,136,140,142,145,151,159,165,169,173,178,183,189,194,199,202,207,213,216];
const TRANSFORMS=[49,0,49,49,0,0,0,0,0,49,12,49,49,10,0,49,0,47,0,0,49,4,0,0,49,0,3,49,10,49,49,0,6,49,13,49,49,1,49,1,0,0,49,0,1,0,10,0,49,0,7,49,0,9,48,0,0,49,0,8,49,0,5,49,0,10,49,0,11,49,3,49,49,0,13,49,0,14,49,14,49,49,2,49,49,0,15,49,0,16,0,10,49,49,0,12,5,0,49,0,0,1,49,15,49,49,0,18,49,0,17,49,0,19,49,0,20,49,16,49,49,17,49,47,0,49,49,4,49,49,0,22,49,11,49,49,0,23,49,0,24,49,0,25,49,7,49,49,1,26,49,0,27,49,0,28,0,0,12,49,0,29,49,20,49,49,18,49,49,6,49,49,0,21,49,10,1,49,8,49,49,0,31,49,0,32,47,0,3,49,5,49,49,9,49,0,10,1,49,10,8,5,0,21,49,11,0,49,10,10,49,0,30,0,0,5,35,0,49,47,0,2,49,10,17,49,0,36,49,0,33,5,0,0,49,10,21,49,10,5,49,0,37,0,0,30,49,0,38,0,11,0,49,0,39,0,11,49,49,0,34,49,11,8,49,10,12,0,0,21,49,0,40,0,10,12,49,0,41,49,0,42,49,11,17,49,0,43,0,10,5,49,11,10,0,0,34,49,10,33,49,0,44,49,11,5,45,0,49,0,0,33,49,10,30,49,11,30,49,0,46,49,11,1,49,10,34,0,10,33,0,11,30,0,11,1,49,11,33,49,11,21,49,11,12,0,11,5,49,11,34,0,11,12,0,10,30,0,11,34,0,10,34];
const affixBytes=(index:number)=>{const at=AFFIX_AT[index],size=AFFIX_TEXT.charCodeAt(at);return Uint8Array.from({length:size},(_,i)=>AFFIX_TEXT.charCodeAt(at+1+i));};
let dictionary:Uint8Array|undefined;
function words(){if(dictionary)return dictionary;const inflated=inflateSync(Uint8Array.from(atob(BROTLI_DICTIONARY_DEFLATED),c=>c.charCodeAt(0)));if(inflated.length!==DICTIONARY_BYTES)fail('dictionary size');return dictionary=inflated;}
/** Reference ToUpperCase: bytes, not code points, because the output must match the encoder's. */
function upper(out:Uint8Array,at:number){const c=out[at];if(c<0xc0){if(c>=97&&c<=122)out[at]^=32;return 1;}if(c<0xe0){out[at+1]^=32;return 2;}out[at+2]^=5;return 3;}
/** Writes one transformed word and returns its length; every room check happens before the first byte. */
function dictionaryWord(out:Uint8Array,at:number,length:number,id:number){
 const bits=SIZE_BITS[length];if(!bits)fail('no such dictionary length');const index=id&((1<<bits)-1),transform=id>>>bits;if(transform>=121)fail('no such transform');
 const prefix=affixBytes(TRANSFORMS[transform*3]),type=TRANSFORMS[transform*3+1],suffix=affixBytes(TRANSFORMS[transform*3+2]),start=WORD_OFFSET[length]+index*length,dropEnd=type>=1&&type<=9?type:0,dropStart=type>=12?type-11:0,size=Math.max(0,length-dropEnd-dropStart),total=prefix.length+size+suffix.length;
 if(at+total>out.length)fail('output limit reached');out.set(prefix,at);let w=at+prefix.length;const source=words(),begin=start+Math.min(dropStart,length);for(let i=0;i<size;i++)out[w+i]=source[begin+i];
 if(type===10&&size)upper(out,w);else if(type===11){let i=w;const end=w+size;while(i<end)i+=upper(out,i);}w+=size;out.set(suffix,w);return total;}

/** Decompresses `data`; `expected` is the known size when there is one, and any other size is an error. */
export function brotliDecode(data:Uint8Array,maxOutput:number,expected?:number):Uint8Array{
 if(expected!==undefined&&expected>maxOutput)fail('declared size exceeds the limit');
 const b=new Bits(data,data.length);let window=16;if(b.read(1)){let n=b.read(3);if(n)window=17+n;else{n=b.read(3);if(n===1)fail('large windows are not supported');window=n?8+n:17;}}
 const limit=(2**window)-WINDOW_GAP;let store=new Uint8Array(expected??Math.min(maxOutput,Math.max(1<<16,data.length*8))),pos=0,ringAt=0;const ring=[16,15,11,4];
 const grow=(need:number)=>{if(pos+need<=store.length||store.length>=maxOutput||expected!==undefined)return;const grown=new Uint8Array(Math.min(maxOutput,Math.max(pos+need,store.length*2)));grown.set(store.subarray(0,pos));store=grown;},room=(need:number)=>{grow(need);if(pos+need>store.length)fail('output limit reached');};
 for(let last=false;!last;){
  last=!!b.read(1);if(last&&b.read(1))break;
  const nibbles=b.read(2);
  if(nibbles===3){if(b.read(1))fail('reserved bit set');const bytes=b.read(2);let skip=0;for(let i=0;i<bytes;i++){const v=b.read(8);if(i===bytes-1&&bytes>1&&!v)fail('padded metadata length');skip|=v<<(i*8);}if(bytes)skip+=1;b.unfill();if(b.pos+skip>data.length)fail('metadata overruns input');b.pos+=skip;continue;}
  let left=0;for(let i=0;i<nibbles+4;i++){const v=b.read(4);if(i===nibbles+3&&nibbles>0&&!v)fail('padded block length');left|=v*16**i;}left+=1;
  if(!last&&b.read(1)){b.unfill();if(b.pos+left>data.length)fail('uncompressed block overruns input');room(left);store.set(data.subarray(b.pos,b.pos+left),pos);pos+=left;b.pos+=left;continue;}
  const L=blocks(b),I=blocks(b),D=blocks(b),postfix=b.read(2),direct=b.read(4)<<postfix,modes=Uint8Array.from({length:L.types},()=>b.read(2));
  const literalTrees=varByte(b)+1,literalMap=literalTrees>1?contextMap(b,64*L.types,literalTrees):new Uint8Array(64*L.types),distanceTrees=varByte(b)+1,distanceMap=distanceTrees>1?contextMap(b,4*D.types,distanceTrees):new Uint8Array(4*D.types);
  const literal=Array.from({length:literalTrees},()=>prefixCode(b,256)),command=Array.from({length:I.types},()=>prefixCode(b,704)),distanceAlphabet=16+direct+(48<<postfix),distance=Array.from({length:distanceTrees},()=>prefixCode(b,distanceAlphabet)),postfixMask=(1<<postfix)-1;
  while(left>0){
   if(!I.left)switchBlock(b,I);I.left--;
   const cmd=symbol(b,command[I.type]),cell=cmd>>>6,insertCode=INSERT_CELL[cell]+((cmd>>>3)&7),copyCode=COPY_CELL[cell]+(cmd&7),insert=INSERT_BASE[insertCode]+b.read(INSERT_EXTRA[insertCode]);let copy=COPY_BASE[copyCode]+b.read(COPY_EXTRA[copyCode]);
   if(insert>left)fail('insert length overruns block');room(insert);
   for(let i=0;i<insert;i++){if(!L.left)switchBlock(b,L);L.left--;const p1=pos>0?store[pos-1]:0,p2=pos>1?store[pos-2]:0,mode=modes[L.type],context=mode===0?p1&63:mode===1?p1>>>2:mode===2?UTF8_FIRST[p1]|UTF8_SECOND[p2]:(SIGNED[p1]<<3)|SIGNED[p2];store[pos++]=symbol(b,literal[literalMap[64*L.type+context]]);}
   left-=insert;if(left<=0)break;
   let code=0;if(cmd>=128){if(!D.left)switchBlock(b,D);D.left--;const context=copy>4?3:copy-2;code=symbol(b,distance[distanceMap[4*D.type+context]]);}
   let span:number;if(code<16){span=ring[(ringAt-RING_INDEX[code])&3]+RING_DELTA[code];if(span<=0)fail('distance out of range');}else if(code<16+direct)span=code-15;else{const rest=code-16-direct,bits=1+(rest>>>(postfix+1)),high=rest>>>postfix,low=rest&postfixMask,base=((2+(high&1))*2**bits)-4;span=(base+b.read(bits))*2**postfix+low+direct+1;}
   const reach=Math.min(pos,limit);
   if(span<=reach){if(copy>left)fail('copy overruns block');room(copy);for(let i=0;i<copy;i++,pos++)store[pos]=store[pos-span];if(code){ring[ringAt&3]=span;ringAt++;}}
   else{if(copy<4||copy>24)fail('no such dictionary length');const id=span-reach-1;if(id>=2**31)fail('distance out of range');grow(copy+64);const size=dictionaryWord(store,pos,copy,id);if(size>left)fail('word overruns block');pos+=size;copy=size;}
   left-=copy;
  }
 }
 if(expected!==undefined&&pos!==expected)fail('size differs from the declared size');
 return store.subarray(0,pos);
}
