import {afterEach,test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../project';
import {blankDocument,node,parseDocument} from '../../src/model';
import type {DesignDocument} from '../../src/model';
import {insertInstance,synchronizeComponents,combineVariants} from '../../src/components-model';
import {createReaction} from '../../src/prototype';
import {setKeyframe} from '../../src/motion';
import {createWhiteboardDocument,addSticky,addConnector} from '../../src/whiteboard';
import {createSlideDocument} from '../../src/slides';
const dirs:string[]=[];
afterEach(async()=>{for(const dir of dirs.splice(0))await fs.rm(dir,{recursive:true,force:true});});
async function setup(document=blankDocument()){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-mcp-pages-'));dirs.push(dir);const file=path.join(dir,'pages.oui');
 await fs.writeFile(file,JSON.stringify(parseDocument(JSON.stringify(document)),null,2)+'\n');
 return {file,project:await Project.open(file)};
}
function componentFixture(){
 const d=blankDocument(),page=d.pages[0],main=node('component',{name:'Button',width:120,height:40}),label=node('text',{name:'Label',parentId:main.id,text:'Original',textRuns:[{start:0,end:8,fontWeight:700}]}),target=node('frame',{name:'Destination',x:700});
 page.nodes=[main,label,target];main.targetId=target.id;main.text=target.id;const reaction=createReaction();reaction.actions[0].targetId=target.id;main.reactions=[reaction];
 const instance=insertInstance(d,page.id,main.id,{x:250,y:40});synchronizeComponents(d);
 page.background={color:'#aabbcc',opacity:.4,visible:true};page.comments=[{id:'comment',text:'Keep me',x:20,y:30,resolved:false}];page.guides=[{id:'guide',axis:'x',position:50}];page.flows=[{id:'flow',name:'Start',description:'',frameId:target.id}];setKeyframe(page,target.id,'x',0,700);
 d.pages.push({id:'other',name:'Other',nodes:[],comments:[]});return {d,pageId:page.id,main,label,target,instance};
}
test('duplicate_page saves fresh graph IDs and metadata, preserves local links, and undo restores the original file graph',async()=>{
 const {d,pageId,main,target}=componentFixture(),{project,file}=await setup(d),before=await project.read();
 const duplicated=await project.apply(before.revision,[{op:'duplicate_page',pageId}]),result=(duplicated.results as any[])[0],copy=duplicated.document.pages[1],originalIds=new Set(before.document.pages.flatMap(p=>[p.id,...p.nodes.map(n=>n.id)]));
 assert.equal(result.pageId,copy.id);assert.equal(result.index,1);assert.equal(copy.name,before.document.pages[0].name+' copy');assert.ok(!originalIds.has(copy.id));assert.ok(copy.nodes.every(n=>!originalIds.has(n.id)));
 const copiedMain=copy.nodes.find(n=>n.type==='component')!,copiedTarget=copy.nodes.find(n=>n.name==='Destination')!,copiedInstance=copy.nodes.find(n=>n.type==='instance')!,copiedChild=copy.nodes.find(n=>n.instanceRootId===copiedInstance.id)!;
 assert.equal(copiedInstance.componentId,copiedMain.id);assert.equal(copiedInstance.sourceId,copiedMain.id);assert.ok(copy.nodes.some(n=>n.id===copiedChild.sourceId&&n.parentId===copiedMain.id));assert.equal(copiedMain.targetId,copiedTarget.id);assert.equal(copiedMain.reactions![0].actions[0].targetId,copiedTarget.id);assert.equal(copiedMain.text,target.id);
 assert.deepEqual(copy.background,d.pages[0].background);assert.notEqual(copy.comments[0].id,d.pages[0].comments[0].id);assert.notEqual(copy.guides![0].id,d.pages[0].guides![0].id);assert.equal(copy.flows![0].frameId,copiedTarget.id);assert.equal(copy.motion!.tracks[0].nodeId,copiedTarget.id);
 const disk=parseDocument(await fs.readFile(file,'utf8'));assert.deepEqual(disk,duplicated.document);assert.deepEqual((await Project.open(file).then(p=>p.read())).document,disk);
 const edited=await project.apply(duplicated.revision,[{op:'update_node',pageId:copy.id,nodeId:copiedMain.id,properties:{fill:'#ee3300'}}]);assert.equal(edited.document.pages[1].nodes.find(n=>n.id===copiedInstance.id)!.fill,'#ee3300');assert.equal(edited.document.pages[0].nodes.find(n=>n.id===main.id)!.fill,main.fill);
 const undoEdit=await project.undo(edited.revision);assert.deepEqual(undoEdit.document.pages,duplicated.document.pages);const undone=await project.undo(undoEdit.revision);assert.deepEqual(undone.document.pages,before.document.pages);assert.equal((await project.read()).revision,undone.revision);
});
test('a source edit and shorter rich text before duplicate_page share one derived checkpoint and preserve future inheritance',async()=>{
 const {d,pageId,main,label}=componentFixture(),{project,file}=await setup(d),before=await project.read();
 const saved=await project.apply(before.revision,[{op:'update_node',pageId,nodeId:label.id,properties:{text:'Hi'}},{op:'update_node',pageId,nodeId:main.id,properties:{fill:'#123456'}},{op:'duplicate_page',pageId}]);
 for(const page of saved.document.pages.slice(0,2)){const source=page.nodes.find(n=>n.type==='component')!,inst=page.nodes.find(n=>n.type==='instance')!,text=page.nodes.find(n=>n.type==='text'&&n.instanceRootId===inst.id)!;assert.equal(inst.fill,'#123456');assert.ok(!inst.overrideKeys?.includes('fill'));assert.equal(text.text,'Hi');assert.ok(text.textRuns?.every(r=>r.end<=2));assert.ok(!text.overrideKeys?.includes('text'));assert.equal(inst.componentId,source.id);}
 const copy=saved.document.pages[1],copyMain=copy.nodes.find(n=>n.type==='component')!,copyLabel=copy.nodes.find(n=>n.type==='text'&&n.parentId===copyMain.id)!,copyInstance=copy.nodes.find(n=>n.type==='instance')!;
 const later=await project.apply(saved.revision,[{op:'update_node',pageId:copy.id,nodeId:copyLabel.id,properties:{text:'Later'}}]);assert.equal(later.document.pages[1].nodes.find(n=>n.instanceRootId===copyInstance.id)!.text,'Later');assert.equal(later.document.pages[0].nodes.find(n=>n.id===label.id)!.text,'Hi');assert.deepEqual(parseDocument(await fs.readFile(file,'utf8')),later.document);
 const firstUndo=await project.undo(later.revision),secondUndo=await project.undo(firstUndo.revision);assert.deepEqual(secondUndo.document.pages,before.document.pages);
});
test('copied instances of external mains retain remapped interactions while unoverridden paints still follow source edits',async()=>{
 const d=blankDocument(),page=d.pages[0],target=node('frame',{name:'Local target'}),main=node('component',{name:'External',targetId:target.id}),label=node('text',{parentId:main.id,text:'Inherited'}),reaction=createReaction();reaction.actions[0].targetId=target.id;main.reactions=[reaction];d.pages.push({id:'defs',name:'Definitions',nodes:[main,label],comments:[]});page.nodes=[target];insertInstance(d,page.id,main.id);synchronizeComponents(d);
 const {project}=await setup(d),before=await project.read(),saved=await project.apply(before.revision,[{op:'duplicate_page',pageId:page.id}]),copy=saved.document.pages[1],instance=copy.nodes.find(n=>n.type==='instance')!,copiedTarget=copy.nodes.find(n=>n.type==='frame')!;
 assert.equal(instance.componentId,main.id);assert.equal(instance.targetId,copiedTarget.id);assert.equal(instance.reactions![0].actions[0].targetId,copiedTarget.id);assert.ok(instance.overrideKeys?.includes('targetId'));assert.ok(instance.overrideKeys?.includes('reactions'));assert.ok(!instance.overrideKeys?.includes('fill'));
 const changed=await project.apply(saved.revision,[{op:'update_node',pageId:'defs',nodeId:main.id,properties:{fill:'#aabbcc'}}]),updated=changed.document.pages[1].nodes.find(n=>n.id===instance.id)!;assert.equal(updated.fill,'#aabbcc');assert.equal(updated.targetId,copiedTarget.id);assert.equal(updated.reactions![0].actions[0].targetId,copiedTarget.id);assert.ok(!updated.overrideKeys?.includes('fill'));
});
test('reorder_page uses exact final positions and same-position reorder preserves bytes, revision, mtime and undo history',async()=>{
 const d=blankDocument();d.pages.push({id:'two',name:'Two',nodes:[],comments:[]},{id:'three',name:'Three',nodes:[],comments:[]});const {project,file}=await setup(d),initial=await project.read();
 const moved=await project.apply(initial.revision,[{op:'reorder_page',pageId:d.pages[0].id,index:2}]);assert.deepEqual(moved.document.pages.map(p=>p.id),['two','three',d.pages[0].id]);assert.deepEqual((await project.read()).document.pages.map(p=>p.id),['two','three',d.pages[0].id]);
 const raw=await fs.readFile(file,'utf8'),stat=await fs.stat(file),noop=await project.apply(moved.revision,[{op:'reorder_page',pageId:'three',index:1}]);assert.equal(noop.revision,moved.revision);assert.equal(await fs.readFile(file,'utf8'),raw);assert.equal((await fs.stat(file)).mtimeMs,stat.mtimeMs);assert.deepEqual(noop.document,moved.document);
 const undone=await project.undo(noop.revision);assert.deepEqual(undone.document.pages,d.pages);await assert.rejects(project.undo(undone.revision),/No MCP transaction/);
 const combined=await project.apply(undone.revision,[{op:'reorder_page',pageId:'three',index:2},{op:'reorder_page',pageId:'three',index:0},{op:'rename_page',pageId:'two',name:'Renamed'}]);assert.deepEqual(combined.document.pages.map(p=>p.id),['three',d.pages[0].id,'two']);assert.equal(combined.document.pages[2].name,'Renamed');const undoCombined=await project.undo(combined.revision);assert.deepEqual(undoCombined.document.pages,d.pages);
});
test('invalid late page operations roll back a whole batch and stale no-op revisions still reject',async()=>{
 const d=blankDocument();d.pages.push({id:'two',name:'Two',nodes:[],comments:[]});const {project,file}=await setup(d),before=await project.read(),changed=await project.apply(before.revision,[{op:'rename_document',name:'Prior successful edit'}]),raw=await fs.readFile(file,'utf8');
 await assert.rejects(project.apply(changed.revision,[{op:'duplicate_page',pageId:d.pages[0].id},{op:'reorder_page',pageId:'two',index:100}]),/available page position/);assert.equal(await fs.readFile(file,'utf8'),raw);
 for(const index of [-1,.5,NaN,Infinity])await assert.rejects(project.apply(changed.revision,[{op:'reorder_page',pageId:'two',index}]));
 await assert.rejects(project.apply(before.revision,[{op:'reorder_page',pageId:'two',index:1}]),/Revision conflict/);assert.equal(await fs.readFile(file,'utf8'),raw);const undone=await project.undo(changed.revision);assert.equal(undone.document.name,before.document.name);assert.deepEqual(undone.document.pages,before.document.pages);await assert.rejects(project.undo(undone.revision),/No MCP transaction/);
});
test('delete_page protects surviving component/prototype references and succeeds only after explicit unlinking in the same batch',async()=>{
 const d=blankDocument(),main=node('component',{name:'Main'}),target=node('frame',{name:'Target'});d.pages[0].nodes=[main,target];d.pages.push({id:'other',name:'Other',nodes:[],comments:[]});const instance=insertInstance(d,'other',main.id),reaction=createReaction();reaction.actions=[{id:'conditional',type:'conditional',branches:[{condition:'true',actions:[{id:'jump',type:'navigate',targetId:target.id}]}]}];const link=node('rectangle',{reactions:[reaction]});d.pages[1].nodes.push(link);synchronizeComponents(d);
 const {project,file}=await setup(d),before=await project.read(),raw=await fs.readFile(file,'utf8');await assert.rejects(project.apply(before.revision,[{op:'rename_page',pageId:'other',name:'Should roll back'},{op:'delete_page',pageId:d.pages[0].id}]),/Other pages still use/);assert.equal(await fs.readFile(file,'utf8'),raw);
 const saved=await project.apply(before.revision,[{op:'delete_node',pageId:'other',nodeId:instance},{op:'delete_node',pageId:'other',nodeId:link.id},{op:'delete_page',pageId:d.pages[0].id}]);assert.deepEqual(saved.document.pages.map(p=>p.id),['other']);assert.equal(saved.document.pages[0].nodes.length,0);const undone=await project.undo(saved.revision);assert.deepEqual(undone.document.pages,before.document.pages);
});
test('whiteboard and owned component-set metadata survive duplicate/save/delete/undo without copying global votes or timer',async()=>{
 const d=createWhiteboardDocument(),page=d.pages[0],a=addSticky(d,page.id,{x:0,y:0}),b=addSticky(d,page.id,{x:300,y:0});addConnector(d,page.id,a,b);const mainA=node('component',{name:'A'}),mainB=node('component',{name:'B',x:300});page.nodes.push(mainA,mainB);combineVariants(d,page.id,[mainA.id,mainB.id]);d.whiteboard!.timer={duration:60,remaining:30,running:false};d.whiteboard!.voting={id:'vote',title:'Choice',limit:1,active:true,votes:[{nodeId:a,voter:'me',count:1}]};
 const {project,file}=await setup(d),before=await project.read(),saved=await project.apply(before.revision,[{op:'duplicate_page',pageId:page.id}]),copy=saved.document.pages[1],ids=new Set(copy.nodes.map(n=>n.id));assert.equal(saved.document.whiteboard!.stickies.length,4);assert.equal(saved.document.whiteboard!.connectors.length,2);assert.equal(saved.document.componentSets!.length,2);const connector=saved.document.whiteboard!.connectors[1];assert.ok(ids.has(connector.fromId)&&ids.has(connector.toId));assert.deepEqual(saved.document.whiteboard!.voting,before.document.whiteboard!.voting);assert.deepEqual(saved.document.whiteboard!.timer,before.document.whiteboard!.timer);assert.deepEqual(parseDocument(await fs.readFile(file,'utf8')),saved.document);
 const removed=await project.apply(saved.revision,[{op:'delete_page',pageId:copy.id}]);assert.equal(removed.document.whiteboard!.stickies.length,2);assert.equal(removed.document.whiteboard!.connectors.length,1);assert.equal(removed.document.componentSets!.length,1);const undone=await project.undo(removed.revision);assert.deepEqual(undone.document.pages,saved.document.pages);assert.deepEqual(undone.document.whiteboard,saved.document.whiteboard);assert.deepEqual(undone.document.componentSets,saved.document.componentSets);
});
test('active presentation deck duplication and deletion refuse atomically while page order can change',async()=>{
 const d=createSlideDocument();d.pages.push({id:'notes',name:'Notes',nodes:[],comments:[]});const {project,file}=await setup(d),before=await project.read(),raw=await fs.readFile(file,'utf8');for(const op of ['duplicate_page','delete_page'] as const){await assert.rejects(project.apply(before.revision,[{op:'rename_document',name:'Blocked'},{op,pageId:d.slides!.pageId}]),/presentation deck page/);assert.equal(await fs.readFile(file,'utf8'),raw);}const saved=await project.apply(before.revision,[{op:'reorder_page',pageId:d.slides!.pageId,index:1}]);assert.equal(saved.document.slides!.pageId,d.slides!.pageId);assert.equal(saved.document.pages[1].id,d.slides!.pageId);
});
test('duplicate_page enforces the shared 1000-page limit without altering saved content',async()=>{
 const d=blankDocument();for(let i=1;i<1000;i++)d.pages.push({id:'page-'+i,name:'Page '+i,nodes:[],comments:[]});const {project,file}=await setup(d),before=await project.read(),raw=await fs.readFile(file,'utf8');await assert.rejects(project.apply(before.revision,[{op:'duplicate_page',pageId:d.pages[0].id}]),/1,000 pages/);assert.equal(await fs.readFile(file,'utf8'),raw);
});
