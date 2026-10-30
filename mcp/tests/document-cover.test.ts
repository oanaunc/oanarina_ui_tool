import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project';
import {blankDocument,node} from '../../src/model';
test('source project transactions clear a removed cover atomically, preserve Undo and refuse malformed replacement',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-cover-source-'));try{const file=path.join(dir,'cover.oui'),d=blankDocument();d.pages[0].nodes=[node('frame',{id:'cover'})];d.fileCover={pageId:d.pages[0].id,frameId:'cover'};await fs.writeFile(file,JSON.stringify(d));const p=await Project.open(file),before=await p.read(),removed=await p.apply(before.revision,[{op:'delete_node',pageId:d.pages[0].id,nodeId:'cover'}]);assert.equal(removed.document.fileCover,undefined);const undone=await p.undo(removed.revision);assert.deepEqual(undone.document.fileCover,d.fileCover);const raw=await fs.readFile(file,'utf8');await assert.rejects(p.replace(undone.revision,{...undone.document,fileCover:{pageId:'missing',frameId:'cover'}}),/cover/);assert.equal(await fs.readFile(file,'utf8'),raw);}finally{await fs.rm(dir,{recursive:true,force:true});}});
