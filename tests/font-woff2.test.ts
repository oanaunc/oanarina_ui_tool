import fs from 'node:fs';
import {describe,expect,it} from 'vitest';
import {featureAvailability,fontAxisChoices,inspectFontTables,readFontTables} from '../src/font-table-metadata';
import {inspectFontFeatureAsset} from '../src/font-feature-metadata';
import {installedFontLayout} from '../src/font-installed-tables';
import {fontTableBytes,sfntFromTables,woff2LayoutTables} from '../src/font-woff2';
import type {FontAsset} from '../src/font-data';
import {VARIABLE_FONT_FAMILY,variableFontBytes} from './support/variable-font';
import {encodeWoff2} from './support/woff2';

const file=(name:string)=>{const b=fs.readFileSync('public/fonts/'+name);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) as ArrayBuffer;};
const asWoff2=(sfnt:ArrayBuffer,family:string,weight='400'):FontAsset=>({family,weight,data:'data:font/woff2;base64,'+Buffer.from(encodeWoff2(sfnt)).toString('base64'),source:'google'});
const tableList=(sfnt:ArrayBuffer)=>{const v=new DataView(sfnt);return Array.from({length:v.getUint16(4)},(_,i)=>String.fromCharCode(...new Uint8Array(sfnt,12+i*16,4)));};

describe('WOFF2 tables',()=>{
 it('reads the same features, reach and names as the uncompressed file, without its outlines',()=>{const sfnt=file('inter-3.ttf'),plain=readFontTables(sfnt),reduced=woff2LayoutTables(encodeWoff2(sfnt).buffer as ArrayBuffer),read=readFontTables(reduced);expect(tableList(reduced).sort()).toEqual(['GPOS','GSUB','cmap','name'].filter(t=>tableList(sfnt).includes(t)).sort());expect(read.features).toEqual(plain.features);expect(read.features.length).toBeGreaterThan(5);for(const tag of ['liga','tnum','kern'])expect(read.reach(tag,'office AV 1234')).toBe(plain.reach(tag,'office AV 1234'));expect(reduced.byteLength).toBeLessThan(sfnt.byteLength);});
 it('reads variable axes and named instances',()=>{const plain=readFontTables(variableFontBytes()),choices=fontAxisChoices([asWoff2(variableFontBytes(),VARIABLE_FONT_FAMILY,'100 900')],false);expect(choices.source).toBe('tables');expect(choices.axes.map(a=>a.tag)).toEqual(plain.axes.filter(a=>!a.hidden).map(a=>a.tag));expect(choices.instances.length).toBeGreaterThan(0);});
 it('feeds feature declarations and availability notes',()=>{const asset=asWoff2(file('inter-3.ttf'),'Compressed');expect(inspectFontFeatureAsset(asset)).toMatchObject({known:true});expect(inspectFontFeatureAsset(asset).tags).toContain('kern');expect(inspectFontTables(asset).tables).toBeTruthy();expect(featureAvailability([asset],'kern','AV AV')).toMatchObject({known:true,declared:true});});
 it('stays unknown and says so for damaged files, and never throws into the inspector',()=>{const bytes=encodeWoff2(file('inter-3.ttf'));bytes[400]^=255;bytes[401]^=255;const broken:FontAsset={family:'Broken',weight:'400',data:'data:font/woff2;base64,'+Buffer.from(bytes).toString('base64')};expect(inspectFontTables(broken).tables).toBeUndefined();expect(inspectFontTables(broken).reason).toContain('compressed');expect(featureAvailability([broken],'kern','AV').known).toBe(false);expect(()=>fontTableBytes('data:font/woff2;base64,AAAA')).toThrow('compressed');expect(()=>fontTableBytes('data:image/png;base64,AAAA')).toThrow();});
 it('refuses a declared size above the limit before allocating it',()=>{const bytes=encodeWoff2(file('inter-3.ttf'));const huge=new Uint8Array(bytes);huge[12]=0xff;huge[13]=0xff;expect(()=>woff2LayoutTables(huge.buffer as ArrayBuffer)).toThrow();});
});
describe('installed face tables from the shell',()=>{
 const tables=(sfnt:ArrayBuffer)=>{const v=new DataView(sfnt),out:Record<string,string>={};for(let i=0;i<v.getUint16(4);i++){const r=12+i*16,tag=String.fromCharCode(...new Uint8Array(sfnt,r,4));if(['GSUB','GPOS','name','cmap','fvar'].includes(tag))out[tag]=Buffer.from(new Uint8Array(sfnt,v.getUint32(r+8),v.getUint32(r+12))).toString('base64');}return out;};
 it('becomes an in-memory face the shared parser reads, with no outlines',()=>{const sfnt=file('inter-3.ttf'),layout=installedFontLayout('Installed',false,tables(sfnt))!;expect(layout.featuresUnknown).toBe(false);expect(inspectFontTables(layout.asset).tables!.features).toEqual(readFontTables(sfnt).features);const rebuilt=fontTableBytes(layout.asset.data);expect(tableList(rebuilt)).not.toContain('glyf');});
 it('reads axes of an installed variable face',()=>{const layout=installedFontLayout('Installed V',false,tables(variableFontBytes()))!;expect(fontAxisChoices([layout.asset],false).source).toBe('tables');});
 it('keeps features unknown when Core Text shapes with AAT or a kern table instead',()=>{const {name,cmap}=tables(file('inter-3.ttf'));expect(installedFontLayout('Aat',false,{name,cmap,legacy:['morx']})!.featuresUnknown).toBe(true);expect(installedFontLayout('Old',false,{name,cmap,legacy:['kern']})!.featuresUnknown).toBe(true);expect(installedFontLayout('Both',false,{...tables(file('inter-3.ttf')),legacy:['kern','morx']})!.featuresUnknown).toBe(false);});
 it('refuses anything but named bounded tables',()=>{for(const raw of [null,[],{},{name:1},{name:'%%%'},{GSUB:'AAAA'}])expect(installedFontLayout('X',false,raw)).toBeUndefined();const {name}=tables(file('inter-3.ttf'));expect(installedFontLayout('X',false,{name,cmap:'A'.repeat(6_000_000)})).toBeUndefined();});
 it('builds a directory the parser accepts from loose tables',()=>{const sfnt=sfntFromTables([{tag:'name',bytes:new Uint8Array(6)}]);expect(tableList(sfnt)).toEqual(['name']);});
});
