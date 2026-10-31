import {readFileSync} from 'node:fs';
import {brotliCompressSync,constants,crc32,inflateRawSync} from 'node:zlib';
import {describe,expect,it} from 'vitest';
import {brotliDecode} from '../src/brotli-decode';
import {BROTLI_DICTIONARY_DEFLATED} from '../src/brotli-dictionary';

const compress=(input:Uint8Array,quality:number,mode:number=constants.BROTLI_MODE_GENERIC,lgwin=22)=>new Uint8Array(brotliCompressSync(input,{params:{[constants.BROTLI_PARAM_QUALITY]:quality,[constants.BROTLI_PARAM_MODE]:mode,[constants.BROTLI_PARAM_LGWIN]:lgwin,[constants.BROTLI_PARAM_SIZE_HINT]:input.length}}));
function random(seed:number){let x=seed>>>0||1;return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x;};}
const text=(n:number,seed:number)=>{const next=random(seed),words=['the','design','interface','<div class="','function ',' of the ','Time','HTTP','. This','&nbsp;','https://','color','width','height',' and ','information','available','Unicode éè 中文 ','عربي'];let out='';while(out.length<n)out+=words[next()%words.length]+(next()%3?' ':'\n');return new TextEncoder().encode(out);};
const binary=(n:number,seed:number)=>{const next=random(seed),out=new Uint8Array(n);let i=0;while(i<n){if(i>32&&next()%4===0){const span=1+next()%Math.min(i,4096),length=Math.min(4+next()%400,n-i);for(let j=0;j<length;j++,i++)out[i]=out[i-span];}else out[i++]=next()&255;}return out;};
const same=(a:Uint8Array,b:Uint8Array)=>a.length===b.length&&a.every((v,i)=>v===b[i]);

describe('brotli decoder',()=>{
 it('holds the published dictionary',()=>{const raw=inflateRawSync(Buffer.from(BROTLI_DICTIONARY_DEFLATED,'base64'));expect(raw.length).toBe(122784);expect(crc32(raw)).toBe(0x5136cb04);});
 it('matches the reference encoder on text, at every quality that uses the dictionary and contexts',()=>{for(const quality of [0,1,2,4,5,9,10,11])for(const seed of [1,2,3]){const input=text(3000+seed*7000,seed*91);expect(same(brotliDecode(compress(input,quality,constants.BROTLI_MODE_TEXT),1<<22,input.length),input),`q${quality} s${seed}`).toBe(true);}},60000);
 it('matches the reference encoder on binary data and small windows',()=>{for(const [quality,lgwin] of [[11,10],[11,16],[9,18],[5,24],[1,12],[11,22]])for(const seed of [5,6]){const input=binary(40000+seed*5000,seed*17);expect(same(brotliDecode(compress(input,quality,constants.BROTLI_MODE_FONT,lgwin),1<<22),input),`q${quality} w${lgwin}`).toBe(true);}},60000);
 it('decodes a real font and data that does not compress',()=>{const font=new Uint8Array(readFileSync('public/fonts/dmsans-0.ttf'));expect(same(brotliDecode(compress(font,9,constants.BROTLI_MODE_FONT),1<<24,font.length),font)).toBe(true);const noise=new Uint8Array(70000),next=random(9);for(let i=0;i<noise.length;i++)noise[i]=next();expect(same(brotliDecode(compress(noise,11),1<<20,noise.length),noise)).toBe(true);expect(brotliDecode(compress(new Uint8Array(0),11),16).length).toBe(0);},60000);
 it('refuses output past the limit, wrong sizes and damaged streams without hanging',()=>{const input=new Uint8Array(1<<20).fill(7),stream=compress(input,5);expect(stream.length).toBeLessThan(200);expect(()=>brotliDecode(stream,1<<16)).toThrow();expect(()=>brotliDecode(stream,1<<21,1<<19)).toThrow();const sample=compress(text(5000,4),11),next=random(77);for(let i=0;i<400;i++){const broken=sample.slice(0,1+next()%sample.length);broken[next()%broken.length]^=1<<(next()%8);try{brotliDecode(broken,1<<18);}catch(error){expect(String(error)).toMatch(/Brotli/);}}},60000);
});
