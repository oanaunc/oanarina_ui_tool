import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {textFontRequests} from '../src/rich-text';
import type {DesignDocument} from '../src/model';

export const INSTALLED_FONT_LIMITS={files:20_000,depth:6,faces:64,nameTable:2_000_000,fileHeader:65_536,tables:256} as const;
const scanned=new Set(['.ttf','.otf','.ttc','.otc']),sfnt=new Set(['00010000','4f54544f','74727565','74797031']);
export interface FontFace {family:string;style:string;}
export interface InstalledFonts {families:{family:string;styles:string[]}[];filesRead:number;filesSkipped:number;truncated:boolean;}
/** Fixed per-user and system font folders. Tools take no paths, and results never contain one. */
export function installedFontDirectories(platform=process.platform,home=os.homedir(),env:NodeJS.ProcessEnv=process.env){
 if(platform==='darwin')return ['/System/Library/Fonts','/Library/Fonts',path.join(home,'Library/Fonts')];
 if(platform==='win32')return [path.join(env.WINDIR??'C:\\Windows','Fonts'),...(env.LOCALAPPDATA?[path.join(env.LOCALAPPDATA,'Microsoft/Windows/Fonts')]:[])];
 return ['/usr/share/fonts','/usr/local/share/fonts',path.join(home,'.fonts'),path.join(home,'.local/share/fonts')];
}
const clean=(value:string)=>{const text=value.replace(/\p{Cc}/gu,'').trim();return text&&text.length<=256&&!text.startsWith('.')?text:undefined;};
function decode(bytes:Buffer,platform:number){if(platform===1)return bytes.every(b=>b<128)?bytes.toString('latin1'):undefined;if(bytes.length%2)return undefined;return Buffer.from(bytes).swap16().toString('utf16le');}
/** Prefer US English Windows names, the same records system font menus show. Malformed tables yield nothing. */
export function parseNameTable(table:Buffer):Partial<FontFace>{
 if(table.length<6)return {};const count=table.readUInt16BE(2),base=table.readUInt16BE(4);if(6+count*12>table.length)return {};const best=new Map<number,{rank:number;text:string}>();
 for(let i=0;i<count;i++){const at=6+i*12,platform=table.readUInt16BE(at),language=table.readUInt16BE(at+4),id=table.readUInt16BE(at+6),length=table.readUInt16BE(at+8),offset=base+table.readUInt16BE(at+10);
  if(![1,2,16,17].includes(id)||offset+length>table.length||![0,1,3].includes(platform))continue;const rank=platform===3?language===0x409?4:1:platform===0?3:language===0?2:0;if(!rank||rank<=(best.get(id)?.rank??0))continue;const text=decode(table.subarray(offset,offset+length),platform),value=text===undefined?undefined:clean(text);if(value)best.set(id,{rank,text:value});}
 return {family:best.get(16)?.text??best.get(1)?.text,style:best.get(17)?.text??best.get(2)?.text};
}
async function readExactly(handle:Pick<fs.FileHandle,'read'>,offset:number,length:number){const buffer=Buffer.alloc(length),{bytesRead}=await handle.read(buffer,0,length,offset);return bytesRead===length?buffer:undefined;}
async function faceNames(handle:Pick<fs.FileHandle,'read'>,offset:number):Promise<Partial<FontFace>>{
 const head=await readExactly(handle,offset,12);if(!head||!sfnt.has(head.toString('hex',0,4)))return {};const tables=head.readUInt16BE(4);if(tables>INSTALLED_FONT_LIMITS.tables)return {};
 const records=await readExactly(handle,offset+12,tables*16);if(!records)return {};
 for(let i=0;i<tables;i++){const at=i*16;if(records.toString('latin1',at,at+4)!=='name')continue;const start=records.readUInt32BE(at+8),length=records.readUInt32BE(at+12);if(!length||length>INSTALLED_FONT_LIMITS.nameTable)return {};const table=await readExactly(handle,start,length);return table?parseNameTable(table):{};}
 return {};
}
/** Reads only sfnt directories and name tables. No outlines are parsed and no font bytes are returned. */
export async function fontFileFaces(handle:Pick<fs.FileHandle,'read'>):Promise<FontFace[]>{
 const head=await readExactly(handle,0,12);if(!head)return [];let offsets=[0];
 if(head.toString('latin1',0,4)==='ttcf'){const count=head.readUInt32BE(8);if(!count||count>INSTALLED_FONT_LIMITS.faces)return [];const table=await readExactly(handle,12,count*4);if(!table)return [];offsets=Array.from({length:count},(_,i)=>table.readUInt32BE(i*4));}
 const faces:FontFace[]=[];for(const offset of offsets){const names=await faceNames(handle,offset);if(names.family)faces.push({family:names.family,style:names.style??'Regular'});}return faces;
}
export async function scanInstalledFonts(directories:string[]):Promise<InstalledFonts>{
 const families=new Map<string,Set<string>>();let filesRead=0,filesSkipped=0,truncated=false;
 const walk=async(directory:string,depth:number)=>{let entries;try{entries=await fs.readdir(directory,{withFileTypes:true});}catch{return;}
  for(const entry of entries){if(filesRead+filesSkipped>=INSTALLED_FONT_LIMITS.files){truncated=true;return;}const full=path.join(directory,entry.name);
   if(entry.isDirectory()){if(depth<INSTALLED_FONT_LIMITS.depth)await walk(full,depth+1);continue;}
   if(!entry.isFile()||!scanned.has(path.extname(entry.name).toLowerCase()))continue;
   try{const handle=await fs.open(full,'r');try{const faces=await fontFileFaces(handle);if(faces.length)filesRead++;else filesSkipped++;for(const face of faces){const styles=families.get(face.family)??new Set<string>();styles.add(face.style);families.set(face.family,styles);}}finally{await handle.close();}}catch{filesSkipped++;}
  }};
 for(const directory of directories)await walk(directory,0);
 return {families:[...families].map(([family,styles])=>({family,styles:[...styles].sort()})).sort((a,b)=>a.family.localeCompare(b.family)),filesRead,filesSkipped,truncated};
}
let cached:{at:number;key:string;value:Promise<InstalledFonts>}|undefined;
/** A short memo so pagination does not rescan, while newly installed fonts still appear within seconds. */
export function installedFonts(directories=installedFontDirectories(),now=Date.now()){const key=directories.join('\0');if(!cached||cached.key!==key||now-cached.at>5000)cached={at:now,key,value:scanInstalledFonts(directories)};return cached.value;}
export function documentFontFamilies(document:DesignDocument){return [...new Set(textFontRequests(document.pages.flatMap(p=>p.nodes)).map(r=>r.family))].sort();}
export async function queryInstalledFonts(options:{query?:string;offset:number;limit:number},document?:DesignDocument,directories?:string[]){
 const scan=await installedFonts(directories),needle=options.query?.trim().toLowerCase(),filtered=needle?scan.families.filter(f=>f.family.toLowerCase().includes(needle)):scan.families,lower=new Set(scan.families.map(f=>f.family.toLowerCase())),embedded=new Set((document?.fonts??[]).map(f=>f.family.toLowerCase()));
 return {platform:process.platform,total:filtered.length,offset:options.offset,families:filtered.slice(options.offset,options.offset+options.limit),filesRead:scan.filesRead,filesSkipped:scan.filesSkipped,
  notices:['Family names come from fonts in the standard system and per-user folders of the machine running this server. macOS on-demand and legacy .dfont fonts are not listed. A listed font is not a license to embed it.',...(scan.truncated?['Stopped after 20,000 font files; this list may be incomplete.']:[])],
  ...(document?{documentFamilies:documentFontFamilies(document).map(family=>({family,installed:lower.has(family.toLowerCase()),embedded:embedded.has(family.toLowerCase())}))}:{})};
}
