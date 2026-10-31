import {inflateSync} from 'node:zlib';
import type {Project} from './project';
import {createPaint} from '../src/paints';

export const PNG_IMPORT_LIMITS={bytes:20_000_000,pixels:16_000_000,side:16384,chunks:4096} as const;
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(bytes:Uint8Array){let value=0xffffffff;for(const b of bytes)value=crcTable[(value^b)&255]^(value>>>8);return (value^0xffffffff)>>>0;}
function validText(data:Buffer){const separator=data.indexOf(0);if(separator<1||separator>79||data.lastIndexOf(0)!==separator)return false;const keyword=data.subarray(0,separator);return keyword[0]!==32&&keyword.at(-1)!==32&&keyword.every((byte,i)=>(byte>=32&&byte<=126||byte>=161)&&(byte!==32||keyword[i-1]!==32));}
const COLOR_DEPTHS:Record<number,{channels:number;depths:number[]}>={0:{channels:1,depths:[1,2,4,8,16]},2:{channels:3,depths:[8,16]},3:{channels:1,depths:[1,2,4,8]},4:{channels:2,depths:[8,16]},6:{channels:4,depths:[8,16]}};
const ADAM7=[[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]];
/** Each scanline's filter byte position, pass by pass, so interlaced data gets the same checks. */
function scanlines(width:number,height:number,bits:number,interlaced:boolean){const rows:number[]=[];let at=0;const pass=(w:number,h:number)=>{if(!w||!h)return;const bytes=Math.ceil(w*bits/8);for(let y=0;y<h;y++){rows.push(at);at+=bytes+1;}};if(interlaced)for(const [x,y,dx,dy] of ADAM7)pass(Math.ceil((width-x)/dx),Math.ceil((height-y)/dy));else pass(width,height);return {rows,expected:at};}
/** Static PNG of every standard color type and depth. No browser, URL or filesystem access. */
export function inspectImportPng(dataUrl:string){
 if(typeof dataUrl!=='string'||dataUrl.length>Math.ceil(PNG_IMPORT_LIMITS.bytes/3)*4+22)throw Error('PNG import supports at most 20 MB of decoded bytes.');
 const match=/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);if(!match||match[1].length%4)throw Error('Provide a canonical base64 data:image/png asset, not a URL or filesystem path.');
 const bytes=Buffer.from(match[1],'base64');if(bytes.length>PNG_IMPORT_LIMITS.bytes||bytes.toString('base64')!==match[1])throw Error('Invalid or oversized PNG base64.');
 if(bytes.length<57||!bytes.subarray(0,8).equals(signature))throw Error('Invalid PNG signature or truncated file.');
 let offset=8,count=0,width=0,height=0,color=0,depth=0,interlaced=false,paletteEntries=0,header=false,ended=false,sawData=false,closedData=false;const compressed:Buffer[]=[];
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
   color=data[9];depth=data[8];interlaced=data[12]===1;if(!Object.hasOwn(COLOR_DEPTHS,color)||!COLOR_DEPTHS[color].depths.includes(depth)||data[10]!==0||data[11]!==0||data[12]>1)throw Error('This PNG uses a nonstandard color type, depth, compression, filter or interlace method.');
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
   if((kind==='sRGB'&&(length!==1||data[0]>3))||(kind==='gAMA'&&(length!==4||data.readUInt32BE(0)===0))||(kind==='cHRM'&&length!==32)||(kind==='pHYs'&&(length!==9||data[8]>1))||(kind==='tEXt'&&(length>4096||!validText(data)))||(kind==='bKGD'&&length!==(color===3?1:color===0||color===4?2:6))||(kind==='tRNS'&&(color===4||color===6||color===0&&length!==2||color===2&&length!==6||color===3&&(!length||length>paletteEntries)))||(kind==='PLTE'&&(!length||length%3||length/3>Math.min(256,color===3?2**depth:256))))throw Error('Invalid PNG metadata.');if(kind==='PLTE')paletteEntries=length/3;
   if(sawData&&kind!=='tEXt')throw Error('PNG color and pixel metadata must precede image data.');
  }
  offset=end;if(ended)break;
 }
 if(!ended)throw Error('PNG is missing its ending.');
 if(color===3&&!ancillary.has('PLTE'))throw Error('An indexed PNG needs a palette.');
 if((color===0||color===4)&&ancillary.has('PLTE'))throw Error('A grayscale PNG cannot carry a palette.');
 const {rows,expected}=scanlines(width,height,COLOR_DEPTHS[color].channels*depth,interlaced),input=Buffer.concat(compressed);let output:Buffer;
 try{const result=inflateSync(input,{maxOutputLength:expected,info:true}) as unknown as {buffer:Buffer;engine:{bytesWritten:number}};output=result.buffer;if(result.engine.bytesWritten!==input.length)throw Error('Trailing compressed image bytes.');}catch{throw Error('PNG pixel data is invalid or exceeds its declared dimensions.');}
 if(output.length!==expected)throw Error('PNG pixel data does not match its declared dimensions.');
 for(const at of rows)if(output[at]>4)throw Error('Invalid PNG scanline filter.');
 return {width,height,bytes:bytes.length};
}
const SOF=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
/** Walks the marker structure only: no pixels are decoded here, and the editor decodes the bytes like any other image. */
export function inspectImportJpeg(dataUrl:string){const match=/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);if(!match||match[1].length%4)throw Error('Provide a canonical base64 data:image/jpeg URL.');const bytes=Buffer.from(match[1],'base64');if(bytes.length>PNG_IMPORT_LIMITS.bytes||bytes.toString('base64')!==match[1])throw Error('Invalid or oversized JPEG base64.');if(bytes.length<4||bytes[0]!==0xff||bytes[1]!==0xd8)throw Error('Invalid JPEG signature.');let at=2,width=0,height=0,count=0,scans=0;for(;;){if(++count>PNG_IMPORT_LIMITS.chunks)throw Error('JPEG has too many segments.');if(at+2>bytes.length||bytes[at]!==0xff)throw Error('Truncated or malformed JPEG segment.');while(bytes[at+1]===0xff&&at+2<bytes.length)at++;const marker=bytes[at+1];if(marker===0xd9){if(at+2!==bytes.length)throw Error('JPEG has trailing bytes after its end.');break;}if(marker===0xd8||marker===0)throw Error('Malformed JPEG marker.');if(marker>=0xd0&&marker<=0xd7||marker===1){at+=2;continue;}if(at+4>bytes.length)throw Error('Truncated JPEG segment.');const length=bytes.readUInt16BE(at+2),end=at+2+length;if(length<2||end>bytes.length)throw Error('Truncated JPEG segment.');if(SOF.has(marker)){if(width||length<8)throw Error('JPEG needs exactly one frame header.');height=bytes.readUInt16BE(at+5);width=bytes.readUInt16BE(at+7);if(!width||!height)throw Error('JPEG needs real dimensions.');if(width>PNG_IMPORT_LIMITS.side||height>PNG_IMPORT_LIMITS.side||width*height>PNG_IMPORT_LIMITS.pixels)throw Error('Image import supports sides up to 16,384 pixels and 16 million pixels total.');}at=end;if(marker===0xda){scans++;while(at<bytes.length){const next=bytes.indexOf(0xff,at);if(next<0||next+1>=bytes.length)throw Error('JPEG has no end marker.');const after=bytes[next+1];if(after===0||after>=0xd0&&after<=0xd7){at=next+2;continue;}at=next;break;}}}if(!width||!scans)throw Error('JPEG is missing its frame or image data.');return {width,height,bytes:bytes.length};}
const imageKind=(dataUrl:string)=>typeof dataUrl==='string'&&dataUrl.startsWith('data:image/jpeg;')?'jpeg':'png';
export const inspectImportImage=(dataUrl:string)=>imageKind(dataUrl)==='jpeg'?inspectImportJpeg(dataUrl):inspectImportPng(dataUrl);
export interface ImportPngRequest {revision:string;pageId:string;dataUrl:string;name?:string;x?:number;y?:number;displayWidth?:number;}
/** One existing revision-checked transaction and one undo entry; never reads an asset path. */
export async function importPngAsset(project:Project,input:ImportPngRequest){
 const {width,height,bytes}=inspectImportImage(input.dataUrl),kind=imageKind(input.dataUrl),displayWidth=input.displayWidth??width,displayHeight=height*displayWidth/width,name=input.name??(kind==='jpeg'?'Imported JPEG':'Imported PNG'),x=input.x??0,y=input.y??0;
 if(typeof name!=='string'||!name.trim()||name.length>500||![x,y].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6)||![displayWidth,displayHeight].every(n=>Number.isFinite(n)&&n>=.1&&n<=16384))throw Error('Choose a nonempty name, finite position and display dimensions between 0.1 and 16,384.');
 const saved=await project.apply(input.revision,[{op:'create_node',pageId:input.pageId,type:'image',properties:{name,x,y,width:displayWidth,height:displayHeight,fill:'',paints:[{...createPaint('#ffffff','image'),id:'imported-png',image:input.dataUrl,imageWidth:width,imageHeight:height,scaleMode:'fit'}]}}]);
 return {revision:saved.revision,nodeId:(saved.results as {nodeId:string}[])[0].nodeId,mime:'image/'+kind,bytes,naturalWidth:width,naturalHeight:height,width:displayWidth,height:displayHeight,warnings:['Static PNG and JPEG import only. This edits the scoped saved project; an open Forma window with no unsaved changes reloads it.']};
}
