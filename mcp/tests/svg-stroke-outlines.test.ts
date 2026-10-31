import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project.ts';
import {blankDocument,node} from '../../src/model.ts';
import {defaultFrameExportSetting} from '../../src/frame-export-settings.ts';
test('SVG outline export options persist through source MCP and reject malformed updates atomically',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-svg-outline-'));try{const d=blankDocument();d.fonts=[];d.pages[0].nodes=[node('rectangle',{id:'target'})];const file=path.join(dir,'test.oui');await fs.writeFile(file,JSON.stringify(d));const p=await Project.open(file),before=await p.read(),setting={...defaultFrameExportSetting(),svg:{outlineStrokes:true}},after=await p.apply(before.revision,[{op:'update_node',pageId:d.pages[0].id,nodeId:'target',properties:{exportSettings:[setting]}}]);assert.equal(after.document.pages[0].nodes[0].exportSettings![0].svg!.outlineStrokes,true);const raw=await fs.readFile(file,'utf8');await assert.rejects(p.apply(after.revision,[{op:'rename_document',name:'Must roll back'},{op:'update_node',pageId:d.pages[0].id,nodeId:'target',properties:{exportSettings:[{...setting,svg:{outlineStrokes:'wrong'}}]}}]));assert.equal(await fs.readFile(file,'utf8'),raw);assert.equal((await p.undo(after.revision)).document.pages[0].nodes[0].exportSettings,undefined);}finally{await fs.rm(dir,{recursive:true,force:true});}});
