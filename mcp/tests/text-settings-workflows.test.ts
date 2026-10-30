import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project';
test('whole-text background is validated, saved and atomically undoable through MCP',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-text-bg-'));try{const file=path.join(dir,'text.oui'),project=await Project.open(file,true),initial=await project.read(),pageId=initial.document.pages[0].id,created=await project.apply(initial.revision,[{op:'create_node',pageId,id:'label',type:'text',properties:{text:'“Meaning” …',textBackground:'#ffeecc'}}]);assert.equal(created.document.pages[0].nodes[0].textBackground,'#ffeecc');const before=await fs.readFile(file,'utf8');await assert.rejects(project.apply(created.revision,[{op:'rename_document',name:'Do not commit'},{op:'update_node',pageId,nodeId:'label',properties:{textBackground:'url(bad)'}}]));assert.equal(await fs.readFile(file,'utf8'),before);const updated=await project.apply(created.revision,[{op:'update_node',pageId,nodeId:'label',properties:{textBackground:'#123456'}}]);const undone=await project.undo(updated.revision);assert.deepEqual(undone.document.pages,created.document.pages);}finally{await fs.rm(dir,{recursive:true,force:true});}});
