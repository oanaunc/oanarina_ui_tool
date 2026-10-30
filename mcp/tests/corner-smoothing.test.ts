import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project';
import {exportPageSvg} from '../svg';

test('corner smoothing persists through source MCP, changes exported geometry and validates atomically with Undo',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-smoothing-'));
 try{
  const project=await Project.open(path.join(dir,'smoothed.oui'),true),initial=await project.read(),pageId=initial.document.pages[0].id;
  const created=await project.apply(initial.revision,[{op:'create_node',pageId,id:'box',type:'rectangle',properties:{width:200,height:150,radius:30,fill:'#ff0000'}}]);
  const circular=exportPageSvg(created.document,pageId).svg;
  const updated=await project.apply(created.revision,[{op:'update_node',pageId,nodeId:'box',properties:{cornerSmoothing:.8}}]);
  assert.equal(updated.document.pages[0].nodes[0].cornerSmoothing,.8);
  const smooth=exportPageSvg(updated.document,pageId).svg;
  assert.notEqual(smooth,circular);assert.match(smooth,/[cC]/);
  assert.deepEqual((await project.read()).document.pages,updated.document.pages);
  for(const cornerSmoothing of [-.1,1.1,null,'0.5']){
   await assert.rejects(project.apply(updated.revision,[{op:'rename_document',name:'Never commit'},{op:'update_node',pageId,nodeId:'box',properties:{cornerSmoothing}}]));
   assert.deepEqual((await project.read()).document,updated.document);
  }
  await assert.rejects(project.apply(updated.revision,[{op:'update_node',pageId,nodeId:'box',properties:{type:'path',booleanOp:'union',cornerSmoothing:.5}}]));
  assert.deepEqual((await project.read()).document,updated.document);
  const undone=await project.undo(updated.revision);
  assert.deepEqual(undone.document.pages,created.document.pages);
  assert.equal(exportPageSvg(undone.document,pageId).svg,circular);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
