import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data=(result:any)=>{assert.notEqual(result.isError,true,JSON.stringify(result));return JSON.parse(result.content[0].text);};

test('real MCP frame export profiles survive saved transactions and Undo; malformed replacement is atomic',{timeout:15000},async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'forma-export-profile-wire-')),file=path.join(directory,'synthetic-frame.oui');
 // The optional standalone entry point lets release verification exercise these
 // same protocol assertions against the exact extracted public ZIP, without a build.
 const standalone=process.env.FORMA_MCP_TEST_SERVER;
 const args=standalone?[path.resolve(standalone),'--project',file,'--create']:[path.join(root,'node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(root,'tsconfig.json'),path.join(root,'server.ts'),'--project',file,'--create'];
 const transport=new StdioClientTransport({command:process.execPath,args,cwd:directory,env:{NODE_PATH:'',NODE_OPTIONS:''},stderr:'pipe'}),client=new Client({name:'forma-frame-export-profile-test',version:'1.0.0'});let errors='';transport.stderr?.on('data',chunk=>errors+=String(chunk));
 try{
  await client.connect(transport);assert.equal((await client.listTools()).tools.length,11);
  const initial=data(await client.callTool({name:'inspect_project',arguments:{}})),pageId=initial.pages[0].id;
  const created=data(await client.callTool({name:'apply_operations',arguments:{revision:initial.revision,operations:[{op:'create_node',pageId,id:'frame',type:'frame',properties:{name:'Profile source',width:120,height:80}}]}}));
  const full=data(await client.callTool({name:'read_document',arguments:{includeAssets:true}}));assert.equal(full.revision,created.revision);
  const profiles=[{id:'png-profile',format:'png',pngColorProfile:'srgb',scale:2,suffix:'@2x',bounds:'frame',includeGuides:false},{id:'vector-profile',format:'svg',scale:1,suffix:'-vector',bounds:'artwork',includeGuides:true,svg:{textMode:'text',includeLayerIds:true,preserveAttributes:false},includeHidden:true,includeOverlaps:false},{id:'custom-profile',format:'jpg',scale:1.25,suffix:'-custom',bounds:'frame',includeGuides:false,sizing:{axis:'width',value:300},quality:.2}];
  full.document.pages[0].nodes[0].exportSettings=profiles;
  const profiled=data(await client.callTool({name:'replace_document',arguments:{revision:full.revision,document:full.document}}));
  const before=data(await client.callTool({name:'read_document',arguments:{includeAssets:true}}));assert.equal(before.revision,profiled.revision);assert.deepEqual(before.document.pages[0].nodes[0].exportSettings,profiles);
  const changed=data(await client.callTool({name:'apply_operations',arguments:{revision:before.revision,operations:[{op:'update_node',pageId,nodeId:'frame',properties:{name:'Saved transaction',width:240}}]}}));
  const validRaw=await fs.readFile(file,'utf8'),saved=JSON.parse(validRaw);assert.equal(saved.pages[0].nodes[0].name,'Saved transaction');assert.equal(saved.pages[0].nodes[0].width,240);assert.deepEqual(saved.pages[0].nodes[0].exportSettings,profiles);assert.equal(createHash('sha256').update(validRaw).digest('hex'),changed.revision);
  const malformed=structuredClone(saved);malformed.pages[0].nodes[0].exportSettings[0].scale=.005;
  const rejected=await client.callTool({name:'replace_document',arguments:{revision:changed.revision,document:malformed}});assert.equal(rejected.isError,true);assert.match((rejected.content as any)[0].text,/export|scale|0.01×–64×/i);
  assert.equal(await fs.readFile(file,'utf8'),validRaw);assert.equal(data(await client.callTool({name:'inspect_project',arguments:{}})).revision,changed.revision);assert.deepEqual(await fs.readdir(directory),['synthetic-frame.oui']);
  for(const options of [{svg:{includeLayerIds:1}},{svg:{textMode:'remote'}},{includeHidden:'yes'},{includeOverlaps:1},{pngColorProfile:'display-p3'}]){const invalid=structuredClone(saved);Object.assign(invalid.pages[0].nodes[0].exportSettings[1],options);const rejection=await client.callTool({name:'replace_document',arguments:{revision:changed.revision,document:invalid}});assert.equal(rejection.isError,true);assert.equal(await fs.readFile(file,'utf8'),validRaw);assert.equal(data(await client.callTool({name:'inspect_project',arguments:{}})).revision,changed.revision);}
  const undone=data(await client.callTool({name:'undo_transaction',arguments:{revision:changed.revision}})),restored=JSON.parse(await fs.readFile(file,'utf8'));assert.deepEqual(restored.pages,before.document.pages);assert.deepEqual(restored.pages[0].nodes[0].exportSettings,profiles);assert.equal(restored.pages[0].nodes[0].name,'Profile source');assert.equal(restored.pages[0].nodes[0].width,120);assert.equal(data(await client.callTool({name:'validate_project',arguments:{}})).revision,undone.revision);assert.equal(errors,'');
 }finally{await client.close();await transport.close();await fs.rm(directory,{recursive:true,force:true});}
});
