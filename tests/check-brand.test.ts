import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {zipSync,strToU8} from 'fflate';
import {scanApp,scanDist,IncompleteScan} from '../scripts/check-brand.mjs';

// Built from parts so this test source is not itself a stray occurrence of the words it plants.
const word='fig'+'ma',other='fig'+'jam';
let root:string;
beforeEach(()=>{root=fs.mkdtempSync(path.join(os.tmpdir(),'forma-brand-'));});
afterEach(()=>{fs.rmSync(root,{recursive:true,force:true});});
const write=(relative:string,content:string|Uint8Array)=>{const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);return file;};
const clean=()=>{write('dist/index.html','<!doctype html>');return path.join(root,'dist');};
const repeated=(text:string)=>text.repeat(400);
const cli=(...args:string[])=>spawnSync(process.execPath,['scripts/check-brand.mjs',...args],{encoding:'utf8'});

describe('dist scan',()=>{
 it('passes a clean folder and counts what it read',()=>{const {hits,stats}=scanDist(clean());expect(hits).toEqual([]);expect(stats.files).toBe(1);});
 it('finds the name in any letter case in contents, JSON, source maps and file names',()=>{const dist=clean();write('dist/a.js',`const x="${word.toUpperCase()}"`);write('dist/b.json',JSON.stringify({value:other}));write('dist/c.js.map',`{"sources":["${word}.ts"]}`);write(`dist/assets/${word}-chunk.js`,'clean');const {hits}=scanDist(dist);expect(hits.map(h=>h.where+'|'+h.kind)).toEqual(expect.arrayContaining(['dist/a.js|ASCII','dist/b.json|ASCII','dist/c.js.map|ASCII',`dist/assets/${word}-chunk.js|file name`]));});
 it('finds UTF-16 in both byte orders',()=>{const dist=clean();write('dist/le.bin',Buffer.from(`pad ${word}`,'utf16le'));write('dist/be.bin',Buffer.from(`pad ${other}`,'utf16le').swap16());const {hits}=scanDist(dist);expect(hits.map(h=>h.where+'|'+h.kind).sort()).toEqual(['dist/be.bin|UTF-16','dist/le.bin|UTF-16']);});
 it('unpacks a compressed zip whose raw bytes do not show the name',()=>{const dist=clean(),archive=zipSync({'README.md':[strToU8(repeated(`line about ${word} `)),{level:9}]});expect(Buffer.from(archive).toString('latin1').toLowerCase()).not.toContain(word);write('dist/tool.zip',archive);const {hits}=scanDist(dist);expect(hits.some(h=>h.where==='dist/tool.zip!/README.md'&&h.kind==='ASCII')).toBe(true);});
 it('reads entry names and nested zips',()=>{const dist=clean(),inner=zipSync({'notes.txt':[strToU8(repeated(other)),{level:9}]}),outer=zipSync({[`${word}.txt`]:strToU8('clean'),'inner.zip':[inner,{level:0}]});write('dist/outer.zip',outer);const {hits}=scanDist(dist);expect(hits.map(h=>h.where+'|'+h.kind)).toEqual(expect.arrayContaining([`dist/outer.zip!/${word}.txt|file name`,'dist/outer.zip!/inner.zip!/notes.txt|ASCII']));});
 it('treats an unreadable zip as a hit rather than skipping it',()=>{const dist=clean();write('dist/broken.zip','not an archive');expect(scanDist(dist).hits.map(h=>h.kind)).toEqual(['unreadable archive']);});
 it('fails closed on a missing or empty folder',()=>{expect(()=>scanDist(path.join(root,'missing'))).toThrow(IncompleteScan);fs.mkdirSync(path.join(root,'empty'));expect(()=>scanDist(path.join(root,'empty'))).toThrow(IncompleteScan);});
});

const plist=(body:string)=>`<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleName</key><string>${body}</string></dict></plist>`;
function bundle(){for(const [file,content] of Object.entries({'Forma.app/Contents/Info.plist':plist('Forma'),'Forma.app/Contents/MacOS/Tool':'clean binary','Forma.app/Contents/PlugIns/Quick.appex/Contents/Info.plist':plist('Quick'),'Forma.app/Contents/PlugIns/Quick.appex/Contents/MacOS/Quick':'clean','Forma.app/Contents/Resources/editor/index.html':'<!doctype html>'}))write(file,content);return path.join(root,'Forma.app');}
describe.runIf(process.platform==='darwin')('app scan',()=>{
 it('passes a clean bundle and reads every property list',()=>{const {hits,stats}=scanApp(bundle());expect(hits).toEqual([]);expect(stats.propertyLists).toBe(2);});
 it('finds the name in the executable, an extension and a nested zip',()=>{const app=bundle();write('Forma.app/Contents/MacOS/Tool',Buffer.concat([Buffer.from([0xca,0xfe]),Buffer.from(word)]));write('Forma.app/Contents/PlugIns/Quick.appex/Contents/MacOS/Quick',Buffer.from(other,'utf16le'));write('Forma.app/Contents/Resources/editor/tool.zip',zipSync({'a.txt':[strToU8(repeated(word)),{level:9}]}));const places=scanApp(app).hits.map(h=>h.where);expect(places).toEqual(expect.arrayContaining(['Forma.app/Contents/MacOS/Tool','Forma.app/Contents/PlugIns/Quick.appex/Contents/MacOS/Quick','Forma.app/Contents/Resources/editor/tool.zip!/a.txt']));});
 it('reads a binary property list as text',()=>{const app=bundle(),file=write('Forma.app/Contents/PlugIns/Quick.appex/Contents/Info.plist',plist(word));spawnSync('/usr/bin/plutil',['-convert','binary1',file]);expect(scanApp(app).hits.some(h=>h.kind==='Info.plist')).toBe(true);});
 it('fails closed when a required part of the bundle is missing',()=>{const app=bundle();fs.rmSync(path.join(app,'Contents/PlugIns'),{recursive:true});expect(()=>scanApp(app)).toThrow(IncompleteScan);});
});

describe('command line',()=>{
 it('exits 0 on clean output and 1 on a hit, listing it',()=>{const dist=clean();expect(cli('--dist',dist).status).toBe(0);write('dist/a.js',word);const failed=cli('--dist',dist);expect(failed.status).toBe(1);expect(failed.stderr).toContain('a.js');});
 it('exits 2 without scanning when the folder is missing or an argument is wrong',()=>{expect(cli('--dist',path.join(root,'missing')).status).toBe(2);expect(cli('--unknown').status).toBe(2);});
});
