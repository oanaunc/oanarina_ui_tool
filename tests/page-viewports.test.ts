import {afterEach,describe,expect,it,vi} from 'vitest';
import {defaultPageCamera,MAX_PAGE_VIEWS,PAGE_VIEWPORT_KEY,PageViewportCache,parsePageViewports} from '../src/page-viewports';
import {blankDocument} from '../src/model';
import {useEditor} from '../src/store';
import {DesktopDocumentTracker} from '../src/desktop-lifecycle';
function storage(){const data=new Map<string,string>(),writes:string[]=[];return {data,writes,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);writes.push(value);}};}
const camera=(zoom=2)=>({zoom,pan:{x:100,y:-200}});
afterEach(()=>{useEditor.getState().disablePageViewports();vi.useRealTimers();});

describe('device-local page view cache',()=>{
 it('decodes only bounded camera primitives and valid identifiers, skipping invalid or future records',()=>{
  const good={documentId:'doc',pageId:'page',...camera(),updatedAt:10},bad=[{...good,pageId:'\0bad'},{...good,pageId:'x'.repeat(257)},{...good,pageId:'large',pan:{x:1e8,y:0}},{...good,pageId:'zero',zoom:0},{...good,pageId:'future',updatedAt:100000}];const data=parsePageViewports(JSON.stringify({version:1,views:[{...good,privateDocument:{text:'Do not preserve'}},...bad],lastPages:[good]}),20);expect(data.views).toEqual([good]);expect(data.lastPages).toEqual([{documentId:'doc',pageId:'page',updatedAt:10}]);for(const raw of ['{','null','{}',JSON.stringify({version:2,views:[],lastPages:[]})])expect(parsePageViewports(raw).views).toEqual([]);expect(parsePageViewports(' '.repeat(1_500_001)).views).toEqual([]);
 });
 it('evicts older cameras and page choices independently at a fixed bound',()=>{
  vi.useFakeTimers();const disk=storage();let time=10;const cache=new PageViewportCache(()=>disk,()=>time++);for(let i=0;i<MAX_PAGE_VIEWS+5;i++)cache.rememberCamera('doc'+i,'page',camera());cache.flush();const data=JSON.parse(disk.data.get(PAGE_VIEWPORT_KEY)!);expect(data.views).toHaveLength(MAX_PAGE_VIEWS);expect(data.lastPages).toHaveLength(MAX_PAGE_VIEWS);expect(data.views.some((r:any)=>r.documentId==='doc0')).toBe(false);expect(data.views[0].documentId).toBe('doc1004');
 });
 it('debounces changes, keeps tuple identities distinct and does not write merely from reading or lifecycle flush',()=>{
  vi.useFakeTimers();const disk=storage(),cache=new PageViewportCache(()=>disk,()=>10);expect(cache.camera('a','b')).toBeUndefined();cache.flush();expect(disk.writes).toHaveLength(0);cache.rememberCamera('a|b','c',camera(2));cache.rememberCamera('a','b|c',camera(3));vi.advanceTimersByTime(249);expect(disk.writes).toHaveLength(0);vi.advanceTimersByTime(1);expect(disk.writes).toHaveLength(1);const reopened=new PageViewportCache(()=>disk,()=>10);expect(reopened.camera('a|b','c')!.zoom).toBe(2);expect(reopened.camera('a','b|c')!.zoom).toBe(3);
 });
 it('merges different windows without replacing unrelated records and uses the latest same-key edit',()=>{
  vi.useFakeTimers();const disk=storage();let time=10;const a=new PageViewportCache(()=>disk,()=>time),b=new PageViewportCache(()=>disk,()=>time);a.rememberCamera('doc','one',camera(1));time=11;b.rememberCamera('doc','two',camera(2));b.flush();a.flush();expect(parsePageViewports(disk.data.get(PAGE_VIEWPORT_KEY)!,20).views).toHaveLength(2);time=12;a.rememberCamera('doc','one',camera(3));time=13;b.rememberCamera('doc','one',camera(4));b.flush();a.flush();expect(new PageViewportCache(()=>disk,()=>20).camera('doc','one')!.zoom).toBe(4);
 });
 it('updates the last-page choice when a window edits its already active camera after another window navigates',()=>{
  vi.useFakeTimers();const disk=storage();let time=10;const a=new PageViewportCache(()=>disk,()=>time),b=new PageViewportCache(()=>disk,()=>time);a.rememberCamera('doc','one',camera(1));a.flush();time=20;b.rememberCamera('doc','two',camera(2));b.flush();time=30;a.rememberCamera('doc','one',camera(3));a.flush();expect(new PageViewportCache(()=>disk,()=>40).lastPage('doc')).toBe('one');
 });
 it('keeps an ephemeral independent camera when storage is unavailable and refuses invalid writes',()=>{
  vi.useFakeTimers();const cache=new PageViewportCache(()=>{throw Error('Denied');},()=>10);cache.rememberCamera('doc','page',camera(2));cache.flush();const copy=cache.camera('doc','page')!;copy.pan.x=999;expect(cache.camera('doc','page')).toEqual(camera(2));cache.rememberCamera('doc','page',{zoom:Infinity,pan:{x:0,y:0}});expect(cache.camera('doc','page')).toEqual(camera(2));expect(cache.lastPage('doc')).toBe('page');
 });
 it('flushes pending changes on pagehide and hidden events, with no empty startup write',()=>{
  vi.useFakeTimers();const disk=storage(),cache=new PageViewportCache(()=>disk,()=>10),document=Object.assign(new EventTarget(),{visibilityState:'hidden'}),target=Object.assign(new EventTarget(),{document}) as unknown as Window,detach=cache.attach(target);target.dispatchEvent(new Event('pagehide'));expect(disk.writes).toHaveLength(0);cache.rememberCamera('doc','page',camera());document.dispatchEvent(new Event('visibilitychange'));expect(disk.writes).toHaveLength(1);cache.rememberPage('doc','other');target.dispatchEvent(new Event('pagehide'));expect(disk.writes).toHaveLength(2);detach();
 });
});

describe('camera integration stays outside document history',()=>{
 it('restores page switches, generic pageId navigation and same-ID reopen without changing project state or native dirty status',()=>{
  const doc=blankDocument();doc.pages.push({id:'second',name:'Second',nodes:[],comments:[]});useEditor.getState().load(doc);useEditor.getState().enablePageViewports();const tracker=new DesktopDocumentTracker();tracker.mark(doc);const original=useEditor.getState().doc;useEditor.getState().set(camera(2));useEditor.getState().selectPage('second');expect(useEditor.getState()).toMatchObject(defaultPageCamera());useEditor.getState().set(camera(3));useEditor.getState().set({pageId:doc.pages[0].id});expect(useEditor.getState()).toMatchObject(camera(2));useEditor.getState().load(structuredClone(doc));expect(useEditor.getState()).toMatchObject({...camera(2),pageId:doc.pages[0].id,viewportRestored:true});expect(useEditor.getState().doc).toEqual(original);expect(useEditor.getState().past).toEqual([]);expect(tracker.state(useEditor.getState().doc).dirty).toBe(false);expect(useEditor.getState().doc).not.toHaveProperty('pan');
 });
 it('normalizes a document replacement to a real page before recording any camera context',()=>{
  const first=blankDocument(),replacement=blankDocument();useEditor.getState().load(first);useEditor.getState().enablePageViewports();useEditor.getState().set(camera(2));useEditor.getState().edit(d=>Object.assign(d,replacement));expect(useEditor.getState().pageId).toBe(replacement.pages[0].id);expect(useEditor.getState()).toMatchObject(defaultPageCamera());useEditor.getState().undo();expect(useEditor.getState().pageId).toBe(first.pages[0].id);expect(useEditor.getState()).toMatchObject(camera(2));
 });
 it('copies a duplicated page camera, starts new pages fresh, and restores cameras when undo/redo changes the page ID',()=>{
  const doc=blankDocument();useEditor.getState().load(doc);useEditor.getState().enablePageViewports();useEditor.getState().set(camera(2));useEditor.getState().duplicatePage();expect(useEditor.getState()).toMatchObject(camera(2));useEditor.getState().set(camera(3));useEditor.getState().undo();expect(useEditor.getState()).toMatchObject({...camera(2),pageId:doc.pages[0].id});useEditor.getState().addPage();expect(useEditor.getState()).toMatchObject(defaultPageCamera());const second=useEditor.getState().pageId;useEditor.getState().set(camera(4));useEditor.getState().edit(d=>{d.pages=d.pages.filter(p=>p.id===second);});useEditor.getState().undo();useEditor.getState().selectPage(doc.pages[0].id);useEditor.getState().redo();expect(useEditor.getState()).toMatchObject({...camera(4),pageId:second});
 });
});
