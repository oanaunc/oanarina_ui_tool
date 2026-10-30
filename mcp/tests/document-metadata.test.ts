import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data=(result:any)=>{assert.notEqual(result.isError,true,JSON.stringify(result));return JSON.parse(result.content[0].text);};

test('actual MCP metadata/read/replace preserves bounded description, rejects invalid writes atomically and undoes clearing',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'forma-description-wire-')),file=path.join(directory,'metadata.oui'),transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(root,'tsconfig.json'),path.join(root,'server.ts'),'--project',file,'--create'],stderr:'pipe'}),client=new Client({name:'forma-document-metadata-test',version:'1.0.0'});let errors='';transport.stderr?.on('data',c=>errors+=String(c));
 try{
  await client.connect(transport);assert.equal((await client.listTools()).tools.length,10);const initial=data(await client.callTool({name:'inspect_project',arguments:{}}));assert.ok(!('description' in initial));const full=data(await client.callTool({name:'read_document',arguments:{includeAssets:true}})),description='data:image/png;base64,This is literal description prose\n<script>not executable</script> 🪷';full.document.description=description;full.document.unknownMetadata={description:'data:font/ttf;base64,BBBB'};
  const replaced=data(await client.callTool({name:'replace_document',arguments:{revision:full.revision,document:full.document}}));assert.equal(JSON.parse(await fs.readFile(file,'utf8')).description,description);const metadata=data(await client.callTool({name:'inspect_project',arguments:{}}));assert.equal(metadata.description,description);assert.equal(metadata.revision,replaced.revision);const redacted=data(await client.callTool({name:'read_document',arguments:{includeAssets:false}})).document;assert.equal(redacted.description,description);assert.equal(redacted.unknownMetadata.description,'[embedded asset omitted]');
  const validRaw=await fs.readFile(file,'utf8');for(const invalid of [null,123,{},'x'.repeat(10001),'bad\0text','bad\u0085text']){const result=await client.callTool({name:'replace_document',arguments:{revision:replaced.revision,document:{...full.document,description:invalid}}});assert.equal(result.isError,true);assert.match((result.content as any)[0].text,/description/);assert.equal(await fs.readFile(file,'utf8'),validRaw);assert.equal(data(await client.callTool({name:'inspect_project',arguments:{}})).revision,replaced.revision);}
  const stale=await client.callTool({name:'replace_document',arguments:{revision:initial.revision,document:{...full.document,description:'Stale'}}});assert.equal(stale.isError,true);assert.equal(await fs.readFile(file,'utf8'),validRaw);
  const undone=data(await client.callTool({name:'undo_transaction',arguments:{revision:replaced.revision}}));assert.ok(!('description' in JSON.parse(await fs.readFile(file,'utf8'))));const restore=data(await client.callTool({name:'replace_document',arguments:{revision:undone.revision,document:full.document}}));delete full.document.description;const cleared=data(await client.callTool({name:'replace_document',arguments:{revision:restore.revision,document:full.document}}));assert.ok(!('description' in data(await client.callTool({name:'inspect_project',arguments:{}}))));await client.callTool({name:'undo_transaction',arguments:{revision:cleared.revision}});assert.equal(data(await client.callTool({name:'inspect_project',arguments:{}})).description,description);assert.equal(errors,'');
 }finally{await client.close();await transport.close();await fs.rm(directory,{recursive:true,force:true});}
});
