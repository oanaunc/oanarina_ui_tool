import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {blankDocument,node} from '../../src/model';
import {createPaint} from '../../src/paints';
import {prepareLibraryPublication} from '../../src/local-library-package';
import {prepareLibraryInstall,applyLibraryInstall,finalizeLibraryInstall} from '../../src/local-library-install';
import {omitAssets} from '../server';
import {fixturePng,pngDataUrl} from './png-fixture';

test('asset-omitted reads redact opaque library baselines without parsing or rewriting ordinary prose',()=>{const record={kind:'component',sourceId:'source',sourceFingerprint:'a'.repeat(64),baseline:'{"image":"data:image/png;base64,AAAA"}'};assert.equal(omitAssets(record).baseline,'[library edit baseline omitted]');assert.equal(omitAssets({baseline:'Ordinary user prose'}).baseline,'Ordinary user prose');assert.equal(record.baseline,'{"image":"data:image/png;base64,AAAA"}');});
test('real default document read cannot expose image bytes inside saved library baseline strings',async()=>{
 const source=blankDocument(),asset=pngDataUrl(fixturePng());source.pages[0].nodes=[node('component',{id:'image-main',name:'Image main',paints:[{...createPaint('#ffffff','image'),image:asset,imageWidth:2,imageHeight:2}]})];const snapshot=prepareLibraryPublication(source,{name:'Image library',description:'Synthetic fixture',version:1}),consumer=blankDocument(),plan=prepareLibraryInstall(consumer,snapshot);applyLibraryInstall(consumer,plan);finalizeLibraryInstall(consumer,plan);const baseline=consumer.componentLibraries![0].assets[0].baseline;assert.ok(baseline.includes(asset));
 const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-library-redaction-')),file=path.join(dir,'consumer.oui');await fs.writeFile(file,JSON.stringify(consumer));const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(root,'tsconfig.json'),path.join(root,'server.ts'),'--project',file],stderr:'pipe'}),client=new Client({name:'library-redaction',version:'1'});let stderr='';transport.stderr?.on('data',chunk=>stderr+=String(chunk));const read=(r:any)=>{assert.notEqual(r.isError,true,JSON.stringify(r));return JSON.parse(r.content[0].text);};
 try{await client.connect(transport);const raw=await fs.readFile(file,'utf8'),safe=read(await client.callTool({name:'read_document',arguments:{}}));assert.equal(safe.assetsOmitted,true);assert.equal(safe.document.componentLibraries[0].assets[0].baseline,'[library edit baseline omitted]');assert.ok(!JSON.stringify(safe).includes(asset));assert.ok(!JSON.stringify(safe).includes('base64,'));const full=read(await client.callTool({name:'read_document',arguments:{includeAssets:true}}));assert.equal(full.assetsOmitted,false);assert.equal(full.document.componentLibraries[0].assets[0].baseline,baseline);assert.equal(full.document.pages.flatMap((p:any)=>p.nodes).find((n:any)=>n.name==='Image main').paints[0].image,asset);
 const refused=await client.callTool({name:'replace_document',arguments:{revision:safe.revision,document:safe.document}});assert.equal(refused.isError,true);assert.equal(await fs.readFile(file,'utf8'),raw);assert.equal(stderr,'');
 }finally{await client.close();await transport.close();await fs.rm(dir,{recursive:true,force:true});}
});
