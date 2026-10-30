import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project';
import {node} from '../../src/model';
import {setKeyframe} from '../../src/motion';

test('source MCP replacement persists editor Bézier data and Undo while malformed curves leave file bytes unchanged',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-motion-workflows-'));
 try{const file=path.join(dir,'motion.oui'),project=await Project.open(file,true),initial=await project.read(),d=structuredClone(initial.document),p=d.pages[0],frame=node('frame',{name:'Animated screen'}),child=node('rectangle',{name:'Moving child',parentId:frame.id,x:20,width:40});p.nodes=[frame,child];setKeyframe(p,child.id,'x',0,20);setKeyframe(p,child.id,'x',1,120);p.motion!.tracks[0].keyframes[0].easing=[.15,-2,.8,3];const saved=await project.replace(initial.revision,d),reopened=await Project.open(file),read=await reopened.read();assert.deepEqual(read.document.pages[0].motion,saved.document.pages[0].motion);assert.deepEqual(read.document.pages[0].nodes,saved.document.pages[0].nodes);const before=await fs.readFile(file,'utf8');for(const curve of [[2,0,.5,1],[.2,11,.8,1],[.2,0,.8],[.2,0,NaN,1]]){const bad=structuredClone(saved.document);bad.pages[0].motion!.tracks[0].keyframes[0].easing=curve as [number,number,number,number];await assert.rejects(project.replace(saved.revision,bad));assert.equal(await fs.readFile(file,'utf8'),before);}const undone=await project.undo(saved.revision);assert.deepEqual(undone.document.pages,initial.document.pages);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
