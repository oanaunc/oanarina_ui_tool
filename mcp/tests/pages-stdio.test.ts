import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
const mcpRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data=(result:any)=>{assert.notEqual(result.isError,true,JSON.stringify(result));return JSON.parse(result.content[0].text);};
test('actual stdio schema exposes page operations, validates positions/keys and persists generated identities with one undo',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-mcp-page-wire-')),file=path.join(dir,'pages.oui'),transport=new StdioClientTransport({command:process.execPath,args:[path.join(mcpRoot,'node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(mcpRoot,'tsconfig.json'),path.join(mcpRoot,'server.ts'),'--project',file,'--create'],stderr:'pipe'}),client=new Client({name:'forma-page-operations-test',version:'1.0.0'});let errors='';transport.stderr?.on('data',c=>errors+=String(c));
 try{
  await client.connect(transport);const tools=await client.listTools();assert.equal(tools.tools.length,11);const schema=JSON.stringify(tools.tools.find(t=>t.name==='apply_operations')!.inputSchema);assert.ok(schema.includes('duplicate_page'));assert.ok(schema.includes('reorder_page'));
  const initial=data(await client.callTool({name:'inspect_project',arguments:{}})),pageId=initial.pages[0].id;
  const created=data(await client.callTool({name:'apply_operations',arguments:{revision:initial.revision,operations:[{op:'create_node',pageId,type:'rectangle',properties:{name:'Editable source',fill:'#112233'}},{op:'create_page',id:'other',name:'Other'}]}}));
  const copied=data(await client.callTool({name:'apply_operations',arguments:{revision:created.revision,operations:[{op:'duplicate_page',pageId}]}})),copyId=copied.results[0].pageId;assert.notEqual(copyId,pageId);assert.equal(copied.results[0].index,1);
  const moved=data(await client.callTool({name:'apply_operations',arguments:{revision:copied.revision,operations:[{op:'reorder_page',pageId:copyId,index:2},{op:'rename_page',pageId:copyId,name:'Copied page'}]}}));let saved=JSON.parse(await fs.readFile(file,'utf8'));assert.deepEqual(saved.pages.map((p:any)=>p.id),[pageId,'other',copyId]);assert.equal(saved.pages[2].name,'Copied page');assert.notEqual(saved.pages[2].nodes[0].id,saved.pages[0].nodes[0].id);assert.equal(saved.pages[2].nodes[0].fill,'#112233');
  const raw=await fs.readFile(file,'utf8'),noop=data(await client.callTool({name:'apply_operations',arguments:{revision:moved.revision,operations:[{op:'reorder_page',pageId:copyId,index:2}]}}));assert.equal(noop.revision,moved.revision);assert.equal(await fs.readFile(file,'utf8'),raw);
  for(const op of [{op:'reorder_page',pageId:copyId,index:-1},{op:'reorder_page',pageId:copyId,index:.5},{op:'reorder_page',pageId:copyId,index:100},{op:'duplicate_page',pageId,name:'Not supported'},{op:'duplicate_page',pageId,path:'/etc/passwd'}]){const bad=await client.callTool({name:'apply_operations',arguments:{revision:moved.revision,operations:[op]}});assert.equal(bad.isError,true,JSON.stringify(op));assert.equal(await fs.readFile(file,'utf8'),raw);}
  const stale=await client.callTool({name:'apply_operations',arguments:{revision:created.revision,operations:[{op:'reorder_page',pageId:copyId,index:2}]}});assert.equal(stale.isError,true);assert.match((stale.content as any)[0].text,/Revision conflict/);
  const undone=data(await client.callTool({name:'undo_transaction',arguments:{revision:noop.revision}}));saved=JSON.parse(await fs.readFile(file,'utf8'));assert.deepEqual(saved.pages.map((p:any)=>p.id),[pageId,copyId,'other']);assert.notEqual(saved.pages[1].name,'Copied page');assert.equal(data(await client.callTool({name:'validate_project',arguments:{}})).revision,undone.revision);assert.equal(errors,'');
 }finally{await client.close();await transport.close();await fs.rm(dir,{recursive:true,force:true});}
});
