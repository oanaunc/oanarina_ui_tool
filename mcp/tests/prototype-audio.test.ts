import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {Project} from '../project.ts';
import {blankDocument,node} from '../../src/model.ts';
import {audioDataUrl} from '../../src/prototype-audio.ts';
import {exportPageSvg} from '../svg.tsx';
import {pcmWav} from '../../tests/helpers/audio-fixture.ts';
test('source MCP retains validated local PCM data, edits owned settings atomically, rejects malformed/locked ownership, and static SVG omits bytes',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-prototype-audio-'));try{const d=blankDocument();d.fonts=[];const audio={kind:'wav-pcm16' as const,data:audioDataUrl(pcmWav()),sampleRate:8000,channels:1 as const,frames:80,loop:false,volume:1};d.pages[0].nodes=[node('frame',{id:'frame',prototypeAudio:audio})];const file=path.join(dir,'audio.oui');await fs.writeFile(file,JSON.stringify(d));const project=await Project.open(file),before=await project.read(),changed=await project.apply(before.revision,[{op:'update_node',pageId:d.pages[0].id,nodeId:'frame',properties:{prototypeAudio:{...audio,volume:.5,loop:true}}}]);assert.equal(changed.document.pages[0].nodes[0].prototypeAudio?.volume,.5);const svg=exportPageSvg(changed.document,d.pages[0].id);assert.ok(svg.warnings.some(w=>w.includes('Prototype audio')));assert.ok(!svg.svg.includes(audio.data));const raw=await fs.readFile(file,'utf8');await assert.rejects(project.apply(changed.revision,[{op:'rename_document',name:'No partial rename'},{op:'update_node',pageId:d.pages[0].id,nodeId:'frame',properties:{prototypeAudio:{...audio,frames:81}}}]));assert.equal(await fs.readFile(file,'utf8'),raw);const undone=await project.undo(changed.revision);assert.deepEqual(undone.document.pages[0].nodes[0].prototypeAudio,audio);const locked=await project.apply(undone.revision,[{op:'update_node',pageId:d.pages[0].id,nodeId:'frame',properties:{locked:true}}]);await assert.rejects(project.apply(locked.revision,[{op:'update_node',pageId:d.pages[0].id,nodeId:'frame',properties:{prototypeAudio:{...audio,loop:true}}}]),/Unlock/);}finally{await fs.rm(dir,{recursive:true,force:true});}});


test('default source MCP wire reads omit audio bytes while explicit includeAssets retains exact authorized project data',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'forma-audio-wire-')),file=path.join(directory,'audio.oui'),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const d=blankDocument();d.fonts=[];const audio={kind:'wav-pcm16' as const,data:audioDataUrl(pcmWav()),sampleRate:8000,channels:1 as const,frames:80,loop:false,volume:1};d.pages[0].nodes=[node('frame',{id:'frame',prototypeAudio:audio})];await fs.writeFile(file,JSON.stringify(d));
 const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(root,'tsconfig.json'),path.join(root,'server.ts'),'--project',file],stderr:'pipe'}),client=new Client({name:'audio-redaction-test',version:'1.0.0'});let stderr='';transport.stderr?.on('data',c=>stderr+=String(c));const read=(r:any)=>{assert.notEqual(r.isError,true);return JSON.parse(r.content[0].text);};
 try{await client.connect(transport);const safe=read(await client.callTool({name:'read_document',arguments:{}}));assert.equal(safe.assetsOmitted,true);assert.equal(safe.document.pages[0].nodes[0].prototypeAudio.data,'[embedded asset omitted]');assert.ok(!JSON.stringify(safe).includes(audio.data));assert.equal(safe.document.pages[0].nodes[0].prototypeAudio.frames,80);
 const nodes=read(await client.callTool({name:'read_nodes',arguments:{pageId:d.pages[0].id}}));assert.equal(nodes.nodes[0].prototypeAudio.data,'[embedded asset omitted]');
 const full=read(await client.callTool({name:'read_document',arguments:{includeAssets:true}}));assert.equal(full.assetsOmitted,false);assert.deepEqual(full.document.pages[0].nodes[0].prototypeAudio,audio);const fullNodes=read(await client.callTool({name:'read_nodes',arguments:{pageId:d.pages[0].id,includeAssets:true}}));assert.deepEqual(fullNodes.nodes[0].prototypeAudio,audio);assert.equal(await fs.readFile(file,'utf8'),JSON.stringify(d));assert.equal(stderr,'');
 }finally{await client.close();await transport.close();await fs.rm(directory,{recursive:true,force:true});}
});
