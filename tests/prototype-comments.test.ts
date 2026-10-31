import {beforeEach,expect,it} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import {useEditor} from '../src/store';
import {commentOnlyEdit,createPrototypeComment,presentedFramePoint,prototypeCommentWriteAllowed,prototypeFrameThreads,sameArtworkSource,samePresentedContext} from '../src/prototype-comments';
import {commentAnchorLookup,commentCatalog,commentPosition,createComment,filterCommentCatalog,resolveComment,validateDocumentCommentThreads} from '../src/comment-threads';
import {useLocalFlowPresentation,presentLocalLinkedFlow} from '../src/local-flow-presentation';
import {duplicateDocumentPage} from '../src/pages';
import {captureColorContext} from '../src/color-edit-context';
import type {DesignDocument} from '../src/model';
const now='2026-10-31T12:30:00.000Z',id='00000000-0000-4000-8000-000000000001' as const;
function fixture(){const d=blankDocument();d.fonts=[];d.pages[0].id='one';d.pages[0].nodes=[node('frame',{id:'home',name:'Home',x:100,y:50,width:300,height:600}),node('rectangle',{id:'box',parentId:'home',x:120,y:70,width:50,height:50}),node('frame',{id:'other',name:'Other',x:500,y:50,width:300,height:600})];return d;}
const load=(d=fixture())=>{useEditor.getState().load(d);return useEditor.getState().doc;};
beforeEach(()=>{useLocalFlowPresentation.getState().clear();useEditor.getState().set({modal:null,mode:'design',home:false,uiHidden:false,motionOpen:false});});

it('maps a scaled, scrolled click into page space and refuses collapsed or unbounded rectangles',()=>{
 expect(presentedFramePoint({x:100,y:50},{left:10,top:20,width:150,height:300},{width:300,height:600},{x:85,y:170})).toEqual({x:250,y:350});
 expect(()=>presentedFramePoint({x:0,y:0},{left:0,top:0,width:0,height:10},{width:1,height:1},{x:0,y:0})).toThrow('not visible');
 expect(()=>presentedFramePoint({x:0,y:0},{left:0,top:0,width:1,height:1},{width:2e7,height:1},{x:1,y:0})).toThrow('outside');
});
it('anchors to the frame axes as a marked thread and follows frame moves, staying findable after reopen',()=>{
 const d=fixture();createPrototypeComment(d,'one',{frameId:'home',x:250,y:350,text:'Tighten this',author:'Reviewer'},id,now);const c=d.pages[0].comments[0];
 expect(c).toMatchObject({surface:'prototype',anchor:{nodeId:'home',x:150,y:300},x:250,y:350,author:'Reviewer',createdAt:now,resolved:false});
 const back=parseDocument(JSON.stringify(d));expect(back.pages[0].comments[0]).toEqual(c);
 back.pages[0].nodes[0].x+=40;const lookup=commentAnchorLookup(back.pages[0].nodes),p=commentPosition(back.pages[0].comments[0],lookup);expect(p).toMatchObject({x:290,y:350,status:'Prototype comment; follows its frame'});
});
it('refuses missing pages, missing or non-frame targets, collapsed frames, blank text and identity reuse without changing the page',()=>{
 const d=fixture(),before=structuredClone(d.pages[0].comments),base={x:120,y:60,text:'x',author:'R'};
 expect(()=>createPrototypeComment(d,'none',{...base,frameId:'home'})).toThrow('page was removed');
 expect(()=>createPrototypeComment(d,'one',{...base,frameId:'gone'})).toThrow('frame was removed');
 expect(()=>createPrototypeComment(d,'one',{...base,frameId:'box'})).toThrow('frame was removed');
 expect(()=>createPrototypeComment(d,'one',{...base,frameId:'home',text:'  '})).toThrow('comment text');
 expect(()=>createPrototypeComment(d,'one',{...base,frameId:'home',author:'  '})).toThrow('display name');
 d.pages[0].nodes[0].motionScaleX=0;expect(()=>createPrototypeComment(d,'one',{...base,frameId:'home'})).toThrow('collapsed');d.pages[0].nodes[0].motionScaleX=undefined;
 createPrototypeComment(d,'one',{...base,frameId:'home'},id,now);expect(()=>createPrototypeComment(d,'one',{...base,frameId:'home'},id,now)).toThrow('Duplicate');
 d.pages[0].comments=before;expect(d.pages[0].comments).toEqual([]);
});
it('rejects a forged surface or a surface without an anchor before a document opens',()=>{
 for(const extra of [{surface:'hosted',anchor:{nodeId:'home',x:0,y:0}},{surface:'prototype'}]){const d=fixture();d.pages[0].comments=[{id:'c',x:1,y:1,text:'x',resolved:false,...extra} as never];expect(()=>validateDocumentCommentThreads(d)).toThrow('surface');expect(()=>parseDocument(JSON.stringify(d))).toThrow();}
});
it('keeps untouched and non-prototype threads byte-identical',()=>{
 const d=fixture();createComment(d,'one',{text:'Design note',author:'R',x:10,y:10},id,now);expect(JSON.stringify(d.pages[0].comments[0])).not.toContain('surface');
 const legacy=fixture();legacy.pages[0].comments=[{id:'l',x:1,y:1,text:'old',resolved:false}];expect(JSON.parse(JSON.stringify(parseDocument(JSON.stringify(legacy)))).pages[0].comments).toEqual([{id:'l',x:1,y:1,text:'old',resolved:false}]);
});
it('lists threads for a frame and its layers with canvas ordinals, in frame coordinates, and leaves other surfaces out',()=>{
 const d=fixture(),[home]=d.pages[0].nodes;createComment(d,'one',{text:'free',author:'R',x:150,y:150},'free',now);createPrototypeComment(d,'one',{frameId:'home',x:250,y:350,text:'a',author:'R'},id,now);createComment(d,'one',{text:'layer',author:'R',x:130,y:80,anchor:{nodeId:'box',x:10,y:10}},'layer',now);createPrototypeComment(d,'one',{frameId:'other',x:510,y:60,text:'b',author:'R'},'00000000-0000-4000-8000-000000000002',now);
 const out=prototypeFrameThreads(d.pages[0].nodes,d.pages[0].comments,home);expect(out.threads.map(v=>[v.ordinal,v.thread.text,v.x,v.y])).toEqual([[2,'a',150,300],[3,'layer',30,30]]);expect(out).toMatchObject({hidden:0,overflow:0});
 d.pages[0].comments.push({...d.pages[0].comments[1]});const dup=prototypeFrameThreads(d.pages[0].nodes,d.pages[0].comments,home);expect(dup.threads.map(v=>v.thread.text)).toEqual(['layer']);expect(dup.hidden).toBe(2);
});
it('bounds the presentation list and reports the remainder',()=>{
 const d=fixture();for(let i=0;i<205;i++)createComment(d,'one',{text:'t'+i,author:'R',x:120,y:60,anchor:{nodeId:'home',x:20,y:10}},'t'+i as never,now);const out=prototypeFrameThreads(d.pages[0].nodes,d.pages[0].comments,d.pages[0].nodes[0]);expect(out.threads).toHaveLength(200);expect(out.overflow).toBe(5);
});
it('filters the file-wide list to prototype threads and survives page duplication with remapped anchors',()=>{
 const d=fixture();createComment(d,'one',{text:'design',author:'R',x:1,y:1},'design',now);createPrototypeComment(d,'one',{frameId:'home',x:120,y:60,text:'proto',author:'R'},id,now);
 const entries=commentCatalog(d).entries;expect(filterCommentCatalog(entries,'prototype','','').matches.map(e=>e.thread.text)).toEqual(['proto']);
 const out=duplicateDocumentPage(d,'one'),copy=out.document.pages.find(p=>p.id===out.pageId)!,source=copy.comments.find(c=>c.text==='proto')!;expect(source.surface).toBe('prototype');expect(source.anchor!.nodeId).not.toBe('home');expect(copy.nodes.some(n=>n.id===source.anchor!.nodeId&&n.name==='Home')).toBe(true);
});
it('a comment write is one ordinary Undo step, joined to its source, and never joins an artwork edit',()=>{
 const from=load();useEditor.getState().set({modal:'present'});const past=useEditor.getState().past.length,change=commentOnlyEdit(useEditor,d=>{createPrototypeComment(d,'one',{frameId:'home',x:150,y:80,text:'One step',author:'R'},id,now);})!;
 expect(change.from).toBe(from);expect(change.to).toBe(useEditor.getState().doc);expect(useEditor.getState().past).toHaveLength(past+1);expect(sameArtworkSource(from,change.to)).toBe(true);
 expect(useEditor.getState().doc.pages[0].nodes).toEqual(from.pages[0].nodes);
 useEditor.getState().undo();expect(useEditor.getState().doc).toBe(from);expect(useEditor.getState().doc.pages[0].comments).toEqual([]);useEditor.getState().redo();expect(useEditor.getState().doc).toBe(change.to);
 useEditor.getState().edit(d=>{d.pages[0].nodes[1].x+=5;});const moved=useEditor.getState().doc;expect(sameArtworkSource(change.to,moved)).toBe(false);expect(sameArtworkSource(from,moved)).toBe(false);
});
it('an unchanged write returns nothing and a failed write leaves no history',()=>{
 const from=load(),past=useEditor.getState().past.length;expect(commentOnlyEdit(useEditor,()=>{})).toBeNull();expect(()=>commentOnlyEdit(useEditor,d=>{createPrototypeComment(d,'one',{frameId:'gone',x:0,y:0,text:'x',author:'R'});})).toThrow('frame was removed');expect(useEditor.getState().doc).toBe(from);expect(useEditor.getState().past).toHaveLength(past);
});
it('resolving a thread twice from presentation stays joined and only records real changes',()=>{
 load();createPrototypeComment(useEditor.getState().doc,'one',{frameId:'home',x:150,y:80,text:'x',author:'R'},id,now);const start=useEditor.getState().doc;useEditor.getState().set({modal:'present'});const change=commentOnlyEdit(useEditor,d=>resolveComment(d,'one',id,true))!;expect(sameArtworkSource(start,change.to)).toBe(true);expect(commentOnlyEdit(useEditor,d=>resolveComment(d,'one',id,true))).toBeNull();
});
it('compares presented contexts through a comment join but not through other context changes',()=>{
 const from=load();useEditor.getState().set({modal:'present',selection:['home']});const origin=captureColorContext(useEditor.getState());commentOnlyEdit(useEditor,d=>{createPrototypeComment(d,'one',{frameId:'home',x:150,y:80,text:'x',author:'R'},id,now);});const live=useEditor.getState();
 expect(from).not.toBe(live.doc);expect(samePresentedContext(origin,live)).toBe(true);expect(samePresentedContext(origin,{...live,selection:[]})).toBe(true);expect(samePresentedContext(origin,{...live,mode:'inspect'})).toBe(false);expect(samePresentedContext(origin,{...live,modal:null})).toBe(false);expect(samePresentedContext(origin,{...live,doc:structuredClone(live.doc)})).toBe(false);
});
it('a linked flow presentation survives a comment write and still closes for an artwork edit',()=>{
 const d=fixture();d.pages[0].flows=[{id:'flow',name:'Main',frameId:'home',description:''}];const doc=load(d);presentLocalLinkedFlow(doc,'one','flow');expect(useEditor.getState().modal).toBe('present');
 const change=commentOnlyEdit(useEditor,next=>{createPrototypeComment(next,'one',{frameId:'home',x:150,y:80,text:'x',author:'R'},id,now);})!;expect(useEditor.getState().modal).toBe('present');expect(useLocalFlowPresentation.getState().request?.document).toBe(change.to);
 useEditor.getState().undo();expect(useEditor.getState().modal).toBe('present');expect(useLocalFlowPresentation.getState().request?.document).toBe(doc);
 useEditor.getState().edit(next=>{next.pages[0].nodes[1].x+=5;});expect(useLocalFlowPresentation.getState().request).toBeNull();expect(useEditor.getState().modal).toBeNull();
});
it('allows writes only in an editable presentation',()=>{
 const doc=load() as DesignDocument,base={modal:'present',home:false,uiHidden:false,motionOpen:false,mode:'design',doc};expect(prototypeCommentWriteAllowed(base)).toBe(true);expect(prototypeCommentWriteAllowed({...base,mode:'prototype'})).toBe(true);
 for(const change of [{modal:null},{home:true},{uiHidden:true},{motionOpen:true},{mode:'inspect'},{doc:{...doc,workspace:'slides'} as DesignDocument}])expect(prototypeCommentWriteAllowed({...base,...change})).toBe(false);
});
