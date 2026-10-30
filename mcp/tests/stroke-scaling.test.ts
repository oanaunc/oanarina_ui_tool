import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project.ts';
import {blankDocument,node} from '../../src/model.ts';
test('optional authored stroke scale policy persists in source MCP; malformed batch is atomic and Undo restores',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-stroke-scaling-'));try{const d=blankDocument();d.fonts=[];d.pages[0].nodes=[node('rectangle',{id:'shape'})];const file=path.join(dir,'stroke.oui');await fs.writeFile(file,JSON.stringify(d));const p=await Project.open(file),first=await p.read(),changed=await p.apply(first.revision,[{op:'update_node',pageId:d.pages[0].id,nodeId:'shape',properties:{strokeScaleMode:'fixed'}}]);assert.equal(changed.document.pages[0].nodes[0].strokeScaleMode,'fixed');const raw=await fs.readFile(file,'utf8');await assert.rejects(p.apply(changed.revision,[{op:'rename_document',name:'Must roll back'},{op:'update_node',pageId:d.pages[0].id,nodeId:'shape',properties:{strokeScaleMode:'invalid'}}]));assert.equal(await fs.readFile(file,'utf8'),raw);assert.equal((await p.undo(changed.revision)).document.pages[0].nodes[0].strokeScaleMode,undefined);}finally{await fs.rm(dir,{recursive:true,force:true});}});
