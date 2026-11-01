import type {Matrix} from './transforms';
/** Bounded readers shared by the .fig scene mapper. Every value here comes from an untrusted file. */
export type Raw=Record<string,unknown>;
export const object=(v:unknown):Raw=>{if(!v||typeof v!=='object'||Array.isArray(v)||v instanceof Uint8Array)throw Error('Invalid design file object.');return v as Raw;};
export const optional=(v:unknown)=>v===undefined?{}:object(v);
export const list=(v:unknown,max=20000):unknown[]=>{if(v===undefined)return [];if(!Array.isArray(v)||v.length>max)throw Error('Invalid or oversized design file list.');return v;};
export const number=(v:unknown,fallback?:number)=>{if(fallback!==undefined&&(v===undefined||v===Infinity||v===-Infinity))return fallback;if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e6)throw Error('Invalid design file numeric value.');return v;};
export const flag=(v:unknown,fallback:boolean)=>{if(v===undefined)return fallback;if(typeof v!=='boolean')throw Error('Invalid design file flag.');return v;};
export const string=(v:unknown,fallback='')=>{if(v===undefined)return fallback;if(typeof v!=='string'||v.length>1_000_000)throw Error('Invalid or oversized design file string.');return v;};
export const guid=(v:unknown)=>{const o=object(v),part=(n:unknown)=>{if(typeof n==='number'&&Number.isSafeInteger(n)&&n>=0)return String(n);if(typeof n==='string'&&n.length>0&&n.length<=20&&!/[^0-9]/.test(n))return n;throw Error('Invalid design file node identity.');};return part(o.sessionID)+':'+part(o.localID);};
export const matrix=(v:unknown):Matrix=>{const o=optional(v);return [number(o.m00,1),number(o.m10,0),number(o.m01,0),number(o.m11,1),number(o.m02,0),number(o.m12,0)];};
export const bytes=(v:unknown)=>{if(v instanceof Uint8Array)return v;const a=list(v,2_000_000);if(a.some(n=>!Number.isInteger(n)||Number(n)<0||Number(n)>255))throw Error('Invalid design file byte vector.');return Uint8Array.from(a as number[]);};
export const color=(v:unknown)=>{const o=object(v),channel=(k:'r'|'g'|'b')=>{const n=number(o[k]);if(n<0||n>1)throw Error('Invalid design file color.');return Math.round(n*255).toString(16).padStart(2,'0');};return {hex:'#'+channel('r')+channel('g')+channel('b'),alpha:number(o.a,1)};};
/** An absent reference stays absent rather than becoming an identity. */
export const reference=(v:unknown)=>{const o=optional(v);return o.guid===undefined?undefined:guid(o.guid);};
