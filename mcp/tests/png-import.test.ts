import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {inspectImportPng,importPngAsset} from '../png-import';
import {Project} from '../project';
import {fixturePng,pngChunk,pngDataUrl,pngHeader,pngSignature} from './png-fixture';

test('valid static RGB/RGBA PNGs retain bytes, dimensions and supported color metadata',()=>{
 const png=fixturePng();assert.deepEqual(inspectImportPng(pngDataUrl(png)),{width:2,height:2,bytes:png.length});
 const rgb=Buffer.concat([pngSignature,pngChunk('IHDR',pngHeader(1,1,2)),pngChunk('sRGB',Buffer.from([0])),pngChunk('tRNS',Buffer.from([0,255,0,0,0,0])),pngChunk('IDAT',deflateSync(Buffer.from([4,255,0,0]))),pngChunk('IEND')]);assert.equal(inspectImportPng(pngDataUrl(rgb)).width,1);
});
test('malformed structure, CRC, filters, dimensions and bounded decompression refuse before importing',()=>{
 const header=pngChunk('IHDR',pngHeader()),data=pngChunk('IDAT',deflateSync(Buffer.alloc(18))),end=pngChunk('IEND'),make=(chunks:Buffer[])=>pngDataUrl(Buffer.concat([pngSignature,...chunks]));
 const corrupted=fixturePng();corrupted[corrupted.length-1]^=1;
 const cases=[pngDataUrl(corrupted),pngDataUrl(fixturePng().subarray(0,-1)),pngDataUrl(Buffer.concat([fixturePng(),Buffer.from([0])])),make([header,header,data,end]),make([data,header,end]),make([header,data]),make([header,pngChunk('IDAT',deflateSync(Buffer.from([5,...new Array(17).fill(0)]))),end]),make([header,pngChunk('IDAT',deflateSync(Buffer.alloc(100000))),end]),make([header,pngChunk('IDAT',deflateSync(Buffer.alloc(17))),end]),make([header,pngChunk('IDAT',Buffer.concat([deflateSync(Buffer.alloc(18)),Buffer.from([0])])),end]),make([pngChunk('IHDR',pngHeader(16384,16384)),data,end]),make([pngChunk('IHDR',pngHeader(0,2)),data,end]),make([header,pngChunk('IDAT',data),end]),make([header,data,pngChunk('tEXt',Buffer.from('Label\0value')),data,end])];
 for(const asset of cases)assert.throws(()=>inspectImportPng(asset));
 const types=['acTL','iCCP','zTXt','iTXt','ABCD','\u00c9HDR'];for(const type of types)assert.throws(()=>inspectImportPng(make([header,pngChunk(type),data,end])));
 assert.throws(()=>inspectImportPng(make([header,...Array.from({length:4096},()=>pngChunk('tEXt',Buffer.from('A\0B'))),data,end])),/too many/);
 const h=pngHeader();h[12]=2;assert.throws(()=>inspectImportPng(make([pngChunk('IHDR',h),data,end])),/nonstandard/);
 for(const type of [1,5,7])assert.throws(()=>inspectImportPng(make([pngChunk('IHDR',pngHeader(2,2,type)),data,end])),/nonstandard/);
 assert.throws(()=>inspectImportPng(make([pngChunk('IHDR',pngHeader(2,2,3)),pngChunk('IDAT',deflateSync(Buffer.alloc(6))),end])),/palette/);
 for(const asset of ['https://example.com/image.png','/tmp/image.png','data:image/svg+xml;base64,AAAA','data:image/png;base64,AB=='])assert.throws(()=>inspectImportPng(asset));
});
test('palette color ordering and Latin-1 text keyword rules reject malformed ancillary data',()=>{
 const header=pngChunk('IHDR',pngHeader()),palette=pngChunk('PLTE',Buffer.from([255,0,0])),data=pngChunk('IDAT',deflateSync(Buffer.alloc(18))),end=pngChunk('IEND'),make=(chunks:Buffer[])=>pngDataUrl(Buffer.concat([pngSignature,header,...chunks,data,end]));
 const gamma=Buffer.alloc(4);gamma.writeUInt32BE(45455);const chroma=Buffer.alloc(32),rgb=pngHeader(2,2,2);
 for(const color of [pngChunk('sRGB',Buffer.from([0])),pngChunk('gAMA',gamma),pngChunk('cHRM',chroma)])assert.throws(()=>inspectImportPng(make([palette,color])),/ordering/);
 for(const kind of ['bKGD','tRNS'])assert.throws(()=>inspectImportPng(pngDataUrl(Buffer.concat([pngSignature,pngChunk('IHDR',rgb),pngChunk(kind,Buffer.alloc(6)),palette,pngChunk('IDAT',deflateSync(Buffer.alloc(14))),end]))),/ordering/);
 for(const value of ['Label\0value\0extra',' Label\0value','Label \0value','Two  spaces\0value','Bad\nkey\0value','Bad\u0080key\0value'])assert.throws(()=>inspectImportPng(make([pngChunk('tEXt',Buffer.from(value,'latin1'))])),/metadata/);
 assert.equal(inspectImportPng(make([pngChunk('gAMA',gamma),palette,pngChunk('bKGD',Buffer.alloc(6)),pngChunk('tEXt',Buffer.from('Label\0line1\nline2'))])).width,2);
});
test('PNG image import is a persisted single transaction with redacted reads, atomic failure and Undo',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-png-import-'));try{const project=await Project.open(path.join(dir,'art.oui'),true),before=await project.read(),pageId=before.document.pages[0].id,raw=await fs.readFile(project.file,'utf8'),asset=pngDataUrl(fixturePng());
 await assert.rejects(importPngAsset(project,{revision:before.revision,pageId,dataUrl:asset.slice(0,-4)}));assert.equal(await fs.readFile(project.file,'utf8'),raw);await assert.rejects(project.undo(before.revision),/No MCP/);
 const imported=await importPngAsset(project,{revision:before.revision,pageId,dataUrl:asset,name:'Four colors',x:12,y:24,displayWidth:120}),after=await project.read(),n=after.document.pages[0].nodes[0];assert.equal(n.type,'image');assert.equal(n.name,'Four colors');assert.equal(n.x,12);assert.equal(n.y,24);assert.equal(n.width,120);assert.equal(n.height,120);assert.equal(n.paints![0].image,asset);assert.equal(n.image,'');assert.equal(JSON.stringify(after.document).split(asset).length-1,1);assert.deepEqual(n.paints![0].imageWidth,2);assert.equal(imported.nodeId,n.id);assert.ok(!JSON.stringify(imported).includes(asset));
 const persisted=await fs.readFile(project.file,'utf8');await assert.rejects(importPngAsset(project,{revision:before.revision,pageId,dataUrl:asset}),/Revision conflict/);await assert.rejects(importPngAsset(project,{revision:after.revision,pageId:'missing',dataUrl:asset}),/Page not found/);await assert.rejects(importPngAsset(project,{revision:after.revision,pageId,dataUrl:asset,displayWidth:Infinity}));assert.equal(await fs.readFile(project.file,'utf8'),persisted);
 assert.deepEqual((await project.undo(after.revision)).document.pages,before.document.pages);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('real stdio image tool exposes strict path-free schema, imports and rolls back through normal Undo',async()=>{
 const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-png-wire-')),file=path.join(dir,'wire.oui'),transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(root,'tsconfig.json'),path.join(root,'server.ts'),'--project',file,'--create'],stderr:'pipe'}),client=new Client({name:'png-test',version:'1'});let stderr='';transport.stderr?.on('data',chunk=>stderr+=String(chunk));const read=(r:any)=>{assert.notEqual(r.isError,true,JSON.stringify(r));return JSON.parse(r.content[0].text);};
 try{await client.connect(transport);assert.ok((await client.listTools()).tools.some(t=>t.name==='import_image_asset'));const before=read(await client.callTool({name:'inspect_project',arguments:{}})),pageId=before.pages[0].id,args={revision:before.revision,pageId,dataUrl:pngDataUrl(fixturePng())};const raw=await fs.readFile(file,'utf8');for(const invalid of [{...args,path:'/tmp/private.png'},{...args,dataUrl:'file:///tmp/private.png'},{...args,dataUrl:'https://example.com/image.png'}])assert.equal((await client.callTool({name:'import_image_asset',arguments:invalid})).isError,true);assert.equal(await fs.readFile(file,'utf8'),raw);
 const added=read(await client.callTool({name:'import_image_asset',arguments:args}));assert.equal(added.naturalWidth,2);const redacted=read(await client.callTool({name:'read_nodes',arguments:{pageId}}));assert.equal(redacted.nodes[0].paints[0].image,'[embedded asset omitted]');const full=read(await client.callTool({name:'read_nodes',arguments:{pageId,includeAssets:true}}));assert.equal(full.nodes[0].paints[0].image,args.dataUrl);read(await client.callTool({name:'undo_transaction',arguments:{revision:added.revision}}));assert.equal(read(await client.callTool({name:'inspect_project',arguments:{}})).pages[0].nodes,0);assert.equal(stderr,'');
 }finally{await client.close();await transport.close();await fs.rm(dir,{recursive:true,force:true});}
});
