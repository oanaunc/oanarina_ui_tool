import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project.ts';
import {blankDocument,node} from '../../src/model.ts';
import {contoursToNetwork,networkNodePatch} from '../../src/vector-network.ts';
test('source MCP preserves graph on safe pose updates and Undo, refuses topology/style and unknown graph patches atomically',async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-network-'));try{const d=blankDocument(),n=node('path',{id:'graph',fill:'none',contours:[{closed:false,points:[{x:0,y:0},{x:100,y:50}]}]});Object.assign(n,networkNodePatch(n,contoursToNetwork(n)));d.pages[0].nodes=[n];const file=path.join(dir,'graph.oui');await fs.writeFile(file,JSON.stringify(d));const project=await Project.open(file),before=await project.read(),moved=await project.apply(before.revision,[{op:'update_node',pageId:d.pages[0].id,nodeId:n.id,properties:{x:80,width:320}}]);assert.deepEqual(moved.document.pages[0].nodes[0].vectorNetwork,n.vectorNetwork);const raw=await fs.readFile(file,'utf8');for(const properties of [{fill:'#ffffff'},{contours:[{closed:false,points:[{x:0,y:0},{x:10,y:10}]}]},{vectorNetwork:n.vectorNetwork}]){await assert.rejects(project.apply(moved.revision,[{op:'rename_document',name:'Must remain atomic'},{op:'update_node',pageId:d.pages[0].id,nodeId:n.id,properties}]));assert.equal(await fs.readFile(file,'utf8'),raw);}const undone=await project.undo(moved.revision);assert.equal(undone.document.pages[0].nodes[0].x,n.x);assert.deepEqual(undone.document.pages[0].nodes[0].vectorNetwork,n.vectorNetwork);}finally{await fs.rm(dir,{recursive:true,force:true});}});
