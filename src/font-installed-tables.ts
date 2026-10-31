import {useEffect,useMemo,useState} from 'react';
import {MAX_FONT_BYTES,bytesToBase64} from './font-data';
import type {FontAsset} from './font-data';
import {sfntFromTables} from './font-woff2';

/** Layout and naming tables of one installed face, base64 per table. `legacy` lists older mechanisms that also shape text. */
export interface InstalledFontTables {GSUB?:string;GPOS?:string;name?:string;cmap?:string;fvar?:string;legacy?:string[];}
export const INSTALLED_TABLE_BYTES=4_000_000;
export interface InstalledFontLayout {asset:FontAsset;
 /** Core Text shapes this face with AAT or a kern table, so missing GSUB/GPOS entries say nothing about what it can do. */
 featuresUnknown:boolean;}
const TAGS=['GSUB','GPOS','name','cmap','fvar'] as const;
const BASE64=/^[A-Za-z0-9+/]+={0,2}$/;
/** The shell is trusted but this is still a boundary: only named tables, bounded, and nothing is kept outside this session's memory. */
export function installedFontLayout(family:string,italic:boolean,raw:unknown):InstalledFontLayout|undefined{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return undefined;const value=raw as Record<string,unknown>,legacy=Array.isArray(value.legacy)?value.legacy.filter((v):v is string=>v==='morx'||v==='kern'):[],rows:{tag:string;bytes:Uint8Array}[]=[];let total=0;
 for(const tag of TAGS){const text=value[tag];if(text===undefined)continue;if(typeof text!=='string'||!text||text.length>INSTALLED_TABLE_BYTES*1.4||!BASE64.test(text))return undefined;const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));total+=bytes.length;rows.push({tag,bytes});}
 if(!rows.some(r=>r.tag==='name')||total>MAX_FONT_BYTES)return undefined;
 const has=(tag:string)=>rows.some(r=>r.tag===tag);return {asset:{family,weight:'400',style:italic?'italic':'normal',data:'data:font/ttf;base64,'+bytesToBase64(sfntFromTables(rows)),source:'user'},featuresUnknown:(legacy.includes('morx')&&!has('GSUB'))||(legacy.includes('kern')&&!has('GPOS'))};
}
const cache=new Map<string,InstalledFontLayout|null>(),pending=new Set<string>(),listeners=new Set<()=>void>();
const announce=()=>listeners.forEach(fn=>fn());
const key=(family:string,italic:boolean)=>family+'\u0000'+italic;
async function request(family:string,italic:boolean){const id=key(family,italic),read=typeof window==='undefined'?undefined:window.desktop?.fontTables;if(!read||cache.has(id)||pending.has(id))return;pending.add(id);let result:InstalledFontLayout|null=null;try{result=installedFontLayout(family,italic,await read(family,italic))??null;}catch{/* The measured notes remain for a face Core Text will not describe. */}pending.delete(id);cache.set(id,result);announce();}
if(typeof window!=='undefined')window.addEventListener?.('oanarina-system-fonts-changed',()=>{cache.clear();announce();});
export interface InstalledFontRequest {family:string;italic:boolean;}
/** Faces the shell can describe for these requests, once it has answered. Browsers have no such path and get an empty list. */
export function useInstalledFontLayouts(requests:readonly InstalledFontRequest[]){const [revision,setRevision]=useState(0),signature=JSON.stringify(requests.slice(0,8).map(r=>[r.family,r.italic]));useEffect(()=>{const bump=()=>setRevision(v=>v+1);listeners.add(bump);return ()=>{listeners.delete(bump);};},[]);useEffect(()=>{for(const [family,italic] of JSON.parse(signature) as [string,boolean][])void request(family,italic);},[signature,revision]);return useMemo(()=>(JSON.parse(signature) as [string,boolean][]).flatMap(([family,italic])=>{const row=cache.get(key(family,italic));return row?[row]:[];}),[signature,revision]);}
