import {inflateSync} from 'node:zlib';
import type {Project} from './project';
import {createPaint} from '../src/paints';

export const PNG_IMPORT_LIMITS={bytes:20_000_000,pixels:16_000_000,side:16384,chunks:4096} as const;
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(bytes:Uint8Array){let value=0xffffffff;for(const b of bytes)value=crcTable[(value^b)&255]^(value>>>8);return (value^0xffffffff)>>>0;}
function validText(data:Buffer){const separator=data.indexOf(0);if(separator<1||separator>79||data.lastIndexOf(0)!==separator)return false;const keyword=data.subarray(0,separator);return keyword[0]!==32&&keyword.at(-1)!==32&&keyword.every((byte,i)=>(byte>=32&&byte<=126||byte>=161)&&(byte!==32||keyword[i-1]!==32));}
/** A deliberately bounded static true-color subset. No browser, URL or filesystem access. */
export function inspectImportPng(dataUrl:string){
 if(typeof dataUrl!=='string'||dataUrl.length>Math.ceil(PNG_IMPORT_LIMITS.bytes/3)*4+22)throw Error('PNG import supports at most 20 MB of decoded bytes.');
 const match=/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);if(!match||match[1].length%4)throw Error('Provide a canonical base64 data:image/png asset, not a URL or filesystem path.');
 const bytes=Buffer.from(match[1],'base64');if(bytes.length>PNG_IMPORT_LIMITS.bytes||bytes.toString('base64')!==match[1])throw Error('Invalid or oversized PNG base64.');
 if(bytes.length<57||!bytes.subarray(0,8).equals(signature))throw Error('Invalid PNG signature or truncated file.');
 let offset=8,count=0,width=0,height=0,channels=0,header=false,ended=false,sawData=false,closedData=false;const compressed:Buffer[]=[];
 const ancillary=new Set<string>();
 while(offset<bytes.length){
  if(++count>PNG_IMPORT_LIMITS.chunks||bytes.length-offset<12)throw Error('PNG has too many chunks or a truncated chunk.');
  const length=bytes.readUInt32BE(offset),end=offset+12+length;if(end>bytes.length)throw Error('Truncated PNG chunk.');
  const kind=bytes.toString('latin1',offset+4,offset+8);if(!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(kind))throw Error('Invalid PNG chunk type.');
  if(crc(bytes.subarray(offset+4,end-4))!==bytes.readUInt32BE(end-4))throw Error('PNG chunk checksum failed.');
  const data=bytes.subarray(offset+8,end-4);
  if(!header&&kind!=='IHDR')throw Error('PNG must begin with its image header.');
  if(kind==='IHDR'){
   if(header||length!==13)throw Error('Invalid or duplicate PNG image header.');header=true;width=data.readUInt32BE(0);height=data.readUInt32BE(4);
   if(!width||!height||width>PNG_IMPORT_LIMITS.side||height>PNG_IMPORT_LIMITS.side||width*height>PNG_IMPORT_LIMITS.pixels)throw Error('PNG import supports sides up to 16,384 pixels and 16 million pixels total.');
   if(data[8]!==8||![2,6].includes(data[9])||data[10]!==0||data[11]!==0||data[12]!==0)throw Error('PNG import currently supports noninterlaced 8-bit RGB or RGBA files. Convert indexed, grayscale, 16-bit or interlaced images in the editor.');channels=data[9]===6?4:3;
  }else if(kind==='IDAT'){
   if(closedData)throw Error('PNG image data chunks must be consecutive.');sawData=true;compressed.push(data);
  }else if(kind==='IEND'){
   if(length!==0||!sawData||end!==bytes.length)throw Error('Invalid PNG ending, missing image data or trailing bytes.');ended=true;
  }else{
   if(sawData)closedData=true;
   // Compressed profiles/text and animation streams are intentionally excluded.
   if(!['sRGB','gAMA','cHRM','pHYs','tEXt','bKGD','tRNS','PLTE'].includes(kind))throw Error('Unsupported PNG metadata or animation chunk: '+kind+'. Export a plain static RGB/RGBA PNG.');
   if(['sRGB','gAMA','cHRM'].includes(kind)&&ancillary.has('PLTE')||kind==='PLTE'&&(ancillary.has('bKGD')||ancillary.has('tRNS')))throw Error('Invalid PNG color/palette metadata ordering.');
   if(kind!=='tEXt'&&ancillary.has(kind))throw Error('Duplicate PNG metadata chunk.');ancillary.add(kind);
   if((kind==='sRGB'&&(length!==1||data[0]>3))||(kind==='gAMA'&&(length!==4||data.readUInt32BE(0)===0))||(kind==='cHRM'&&length!==32)||(kind==='pHYs'&&(length!==9||data[8]>1))||(kind==='tEXt'&&(length>4096||!validText(data)))||(kind==='bKGD'&&(length!==6||[0,2,4].some(i=>data.readUInt16BE(i)>255)))||(kind==='tRNS'&&(channels!==3||length!==6||[0,2,4].some(i=>data.readUInt16BE(i)>255)))||(kind==='PLTE'&&(!length||length>768||length%3)))throw Error('Invalid PNG metadata.');
   if(sawData&&kind!=='tEXt')throw Error('PNG color and pixel metadata must precede image data.');
  }
  offset=end;if(ended)break;
 }
 if(!ended)throw Error('PNG is missing its ending.');
 const rowBytes=width*channels,expected=(rowBytes+1)*height,input=Buffer.concat(compressed);let output:Buffer;
 try{const result=inflateSync(input,{maxOutputLength:expected,info:true}) as unknown as {buffer:Buffer;engine:{bytesWritten:number}};output=result.buffer;if(result.engine.bytesWritten!==input.length)throw Error('Trailing compressed image bytes.');}catch{throw Error('PNG pixel data is invalid or exceeds its declared dimensions.');}
 if(output.length!==expected)throw Error('PNG pixel data does not match its declared dimensions.');
 for(let row=0;row<height;row++)if(output[row*(rowBytes+1)]>4)throw Error('Invalid PNG scanline filter.');
 return {width,height,bytes:bytes.length};
}
export interface ImportPngRequest {revision:string;pageId:string;dataUrl:string;name?:string;x?:number;y?:number;displayWidth?:number;}
/** One existing revision-checked transaction and one undo entry; never reads an asset path. */
export async function importPngAsset(project:Project,input:ImportPngRequest){
 const {width,height,bytes}=inspectImportPng(input.dataUrl),displayWidth=input.displayWidth??width,displayHeight=height*displayWidth/width,name=input.name??'Imported PNG',x=input.x??0,y=input.y??0;
 if(typeof name!=='string'||!name.trim()||name.length>500||![x,y].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6)||![displayWidth,displayHeight].every(n=>Number.isFinite(n)&&n>=.1&&n<=16384))throw Error('Choose a nonempty name, finite position and display dimensions between 0.1 and 16,384.');
 const saved=await project.apply(input.revision,[{op:'create_node',pageId:input.pageId,type:'image',properties:{name,x,y,width:displayWidth,height:displayHeight,fill:'',paints:[{...createPaint('#ffffff','image'),id:'imported-png',image:input.dataUrl,imageWidth:width,imageHeight:height,scaleMode:'fit'}]}}]);
 return {revision:saved.revision,nodeId:(saved.results as {nodeId:string}[])[0].nodeId,mime:'image/png',bytes,naturalWidth:width,naturalHeight:height,width:displayWidth,height:displayHeight,warnings:['Static 8-bit RGB/RGBA PNG import only. This edits the scoped saved project; reopen it in Forma. No live synchronization or MCP raster export is added.']};
}
