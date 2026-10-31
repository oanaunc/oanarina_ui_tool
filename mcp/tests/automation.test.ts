import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Project} from '../project';
const mcpRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
function run(args:string[],input=''){const result=spawnSync(process.execPath,[path.join(mcpRoot,'node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(mcpRoot,'tsconfig.json'),path.join(mcpRoot,'automation.ts'),...args],{input,encoding:'utf8'});return {status:result.status,out:result.stdout,err:result.stderr};}
const ok=(result:ReturnType<typeof run>)=>{assert.equal(result.status,0,result.err);return JSON.parse(result.out);};
test('command line automation inspects, applies atomically, reads, exports and undoes the same project',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-automation-')),file=path.join(dir,'cli.oui');await Project.open(file,true);const base=['--project',file],info=ok(run([...base,'inspect'])),pageId=info.pages[0].id;
 const applied=ok(run([...base,'apply','--revision',info.revision],JSON.stringify([{op:'create_node',pageId,type:'rectangle',id:'cli-card',properties:{name:'Scripted card',width:40,height:20}}])));assert.deepEqual(applied.results,[{nodeId:'cli-card'}]);
 assert.deepEqual(ok(run([...base,'read-nodes','--page',pageId,'--query','scripted'])).nodes.map((n:{id:string})=>n.id),['cli-card']);
 assert.match(ok(run([...base,'export-svg','--page',pageId])).svg,/<svg/);assert.equal(ok(run([...base,'validate'])).revision,applied.revision);assert.equal(ok(run([...base,'undo-status'])).entries,1);
 const undone=ok(run([...base,'undo','--revision',applied.revision]));assert.equal(ok(run([...base,'inspect'])).pages[0].nodes,0);assert.equal(ok(run([...base,'undo-status'])).entries,0);assert.equal(ok(run([...base,'inspect'])).revision,undone.revision);});
test('command line automation refuses bad input without writing',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-automation-bad-')),file=path.join(dir,'cli.oui');await Project.open(file,true);const raw=await fs.readFile(file,'utf8'),base=['--project',file],info=ok(run([...base,'inspect']));
 for(const [args,input,pattern] of [[[...base,'apply','--revision',info.revision],'not json',/JSON array/],[[...base,'apply','--revision',info.revision],'{"op":"rename_document","name":"x"}',/JSON array/],[[...base,'apply','--revision',info.revision],'[{"op":"shell","command":"rm"}]',/valid operations/],[[...base,'apply','--revision','0'.repeat(64)],'[{"op":"rename_document","name":"x"}]',/Revision conflict/],[[...base,'apply'],'[]',/--revision is required/],[[...base,'unknown'],'',/Choose one command/],[[...base,'inspect','--eval','x'],'',/Unknown option/],[['inspect'],'',/--project is required/],[['--project','relative.oui','inspect'],'',/absolute path/],[[...base,'undo','--revision',info.revision],'',/No MCP transaction/]] as [string[],string,RegExp][]){const result=run(args,input);assert.equal(result.status,1,args.join(' '));assert.match(JSON.parse(result.err).error,pattern);assert.equal(result.out,'');}
 assert.equal(await fs.readFile(file,'utf8'),raw);assert.match(run(['--help']).out,/local automation/);});
