import {mapFigScene} from '../../src/fig-scene';
/** Decoded records in the shape a real file stores them, for tests that skip the container. */
export const id=(n:number)=>({sessionID:1,localID:n}),at=(x:number,y:number)=>({m00:1,m01:0,m02:x,m10:0,m11:1,m12:y});
export const raw=(type:string,n:number,parent:number,fields:Record<string,unknown>={})=>({guid:id(n),type,parentIndex:{guid:id(parent),position:String(n).padStart(4,'0')},name:type+n,size:{x:40,y:40},transform:at(0,0),visible:true,...fields});
export const scene=(nodes:Record<string,unknown>[],images:Record<string,Uint8Array>={},blobs:{bytes:Uint8Array}[]=[])=>({images,message:{blobs,nodeChanges:[{guid:id(1),type:'DOCUMENT'},{guid:id(2),type:'CANVAS',name:'Page',parentIndex:{guid:id(1),position:'a'}},...nodes]}});
/** A distinct valid PNG for each seed: a private chunk tells them apart, so the bytes hash and compare differently. */
export const png=(seed=0)=>{const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/mXPo5QAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0));if(!seed)return bytes;const extra=new Uint8Array(bytes.length+13),view=new DataView(extra.buffer),split=bytes.length-12;extra.set(bytes.subarray(0,split));view.setUint32(split,1);extra.set([116,69,88,116,seed],split+4);let crc=0xffffffff;for(let i=split+4;i<split+9;i++){crc^=extra[i];for(let j=0;j<8;j++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;}view.setUint32(split+9,(crc^0xffffffff)>>>0);extra.set(bytes.subarray(split),split+13);return extra;};
export const imagePaint=(hash:number,fields:Record<string,unknown>={})=>({type:'IMAGE',visible:true,opacity:1,image:{hash:Array(20).fill(hash)},imageScaleMode:'FILL',...fields});
export const hashName=(hash:number)=>hash.toString(16).padStart(2,'0').repeat(20);
export const solid=(r=0,g=0,b=0)=>({type:'SOLID',visible:true,opacity:1,color:{r,g,b,a:1}});
export const mapped=(...nodes:Record<string,unknown>[])=>mapFigScene(scene(nodes) as never,'File');
export const layers=(...nodes:Record<string,unknown>[])=>mapped(...nodes).document.pages[0].nodes;
export const textRaw=(n:number,fields:Record<string,unknown>={})=>raw('TEXT',n,2,{name:'T',fontSize:16,fontName:{family:'Inter',style:'Regular'},lineHeight:{units:'PIXELS',value:20},textData:{characters:'Words'},...fields});
export function commands(ops:[number,number[]][]){const out:number[]=[];for(const [op,values] of ops){out.push(op);for(const value of values){const buffer=new ArrayBuffer(4);new DataView(buffer).setFloat32(0,value,true);out.push(...new Uint8Array(buffer));}}return Uint8Array.from(out);}
