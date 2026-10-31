import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project';
import {prototypeInputFixture} from '../../tests/helpers/prototype-input-fixture';
test('source form definitions persist and malformed typed/default changes refuse the complete MCP batch atomically',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-form-source-'));try{const file=path.join(dir,'synthetic.oui'),doc=prototypeInputFixture();await fs.writeFile(file,JSON.stringify(doc));const project=await Project.open(file),before=await project.read(),after=await project.apply(before.revision,[{op:'update_node',pageId:doc.pages[0].id,nodeId:'text',properties:{prototypeInput:{version:1,kind:'text',variableId:'name',label:'Updated input',maxLength:30}}}]);assert.equal(after.document.pages[0].nodes.find(n=>n.id==='text')!.prototypeInput!.label,'Updated input');const raw=await fs.readFile(file,'utf8');await assert.rejects(project.apply(after.revision,[{op:'rename_document',name:'Must roll back'},{op:'update_node',pageId:doc.pages[0].id,nodeId:'text',properties:{prototypeInput:{version:1,kind:'checkbox',variableId:'name',label:'Wrong type'}}}]),/variable type/);assert.equal(await fs.readFile(file,'utf8'),raw);const undo=await project.undo(after.revision);assert.deepEqual({...undo.document,updatedAt:''},{...before.document,updatedAt:''});}finally{await fs.rm(dir,{recursive:true,force:true});}});
