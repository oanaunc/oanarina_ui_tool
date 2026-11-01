import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project';
import {specMarkdown} from '../../src/spec';
test('an agent writes a spec as markdown, reads it back, and frames and images survive the round trip',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-spec-'));
 try{const project=await Project.open(path.join(dir,'spec.oui'),true);let r=await project.read();const page=r.document.pages[0];
  const made=await project.apply(r.revision,[{op:'create_node',pageId:page.id,id:'spec-1',type:'spec',properties:{name:'Brief',width:700}},{op:'create_node',pageId:page.id,id:'screen',type:'frame',properties:{name:'Screen',x:900,width:320,height:200}}]);
  const applied=await project.apply(made.revision,[{op:'update_spec',pageId:page.id,nodeId:'spec-1',markdown:'# Brief\n\n- one\n- [ ] two\n\n[Screen](forma://layer/screen)'}]);r=await project.read();assert.equal(r.revision,applied.revision);
  const spec=r.document.pages[0].nodes.find(n=>n.id==='spec-1')!;assert.deepEqual(spec.spec!.blocks.map(b=>b.kind),['heading','bullet','todo','frame']);assert.equal(specMarkdown(spec.spec!.blocks),'# Brief\n\n- one\n- [ ] two\n\n[Screen](forma://layer/screen)');assert.ok(spec.height>200,'a live frame sets the page height');
  const toggled=await project.apply(r.revision,[{op:'update_spec',pageId:page.id,nodeId:'spec-1',markdown:'<details open>\n<summary>More</summary>\n\n- held\n\n[Screen](forma://layer/screen)\n\n</details>'}]);r=await project.read();assert.equal(r.revision,toggled.revision);const held=r.document.pages[0].nodes.find(n=>n.id==='spec-1')!;assert.deepEqual(held.spec!.blocks.map(b=>b.kind),['toggle']);assert.equal(specMarkdown(held.spec!.blocks),'<details open>\n<summary>More</summary>\n\n- held\n\n[Screen](forma://layer/screen)\n\n</details>');assert.ok(held.height>200,'a frame inside an open toggle still sets the page height');
  await assert.rejects(project.apply(r.revision,[{op:'update_spec',pageId:page.id,nodeId:'screen',markdown:'x'}]),/not a spec/);
  await assert.rejects(project.apply(r.revision,[{op:'update_node',pageId:page.id,nodeId:'spec-1',properties:{spec:{version:1,blocks:[{id:'a',kind:'nope'}]}}}]),/Invalid spec/);
  assert.equal((await project.read()).revision,r.revision);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
