import {describe,expect,it} from 'vitest';
import {commands} from '../src/commands';
import {activeRailEntry,chooseRailEntry,railKeyTarget,railToolCommands,useEditorRail} from '../src/editor-rail';
import {connectionDetail,connectionLabel,fileSaveStatus} from '../src/editor-status';
import {fileTabTarget,fileTabUrl} from '../src/file-tabs';
import {decodeFirstRun,firstRunOffer} from '../src/first-run';
import {blankDocument,node} from '../src/model';
import {motionTimelineSummary} from '../src/motion-summary';
import {useEditor} from '../src/store';
import {setToolbeltMode,toggleDrawMode,useToolbelt} from '../src/toolbelt';

describe('editor rail',()=>{
 it('every Tools entry is a real command',()=>{for(const id of railToolCommands)expect(commands.some(c=>c[0]===id),id).toBe(true);});
 it('derives the active entry and rejects unknown entries',()=>{expect(activeRailEntry(null,'layers')).toBe('file');expect(activeRailEntry(null,'assets')).toBe('assets');expect(activeRailEntry('tools','assets')).toBe('tools');expect(()=>chooseRailEntry('agents' as never)).toThrow('Unknown');});
 it('wraps arrows and ignores other keys',()=>{expect(railKeyTarget('ArrowDown',3,4)).toBe(0);expect(railKeyTarget('ArrowUp',0,4)).toBe(3);expect(railKeyTarget('Home',2,4)).toBe(0);expect(railKeyTarget('End',0,4)).toBe(3);expect(railKeyTarget('a',0,4)).toBeNull();});
 it('leaves the overlay when any path changes the left tab',()=>{chooseRailEntry('variables');expect(useEditorRail.getState().overlay).toBe('variables');useEditor.getState().set({leftTab:'assets'});expect(useEditorRail.getState().overlay).toBeNull();chooseRailEntry('file');expect(useEditor.getState().leftTab).toBe('layers');});
});

describe('toolbelt mode',()=>{
 it('switches tools without touching the document and refuses while Motion is open',()=>{const s=useEditor.getState(),doc=s.doc;s.set({tool:'move',motionOpen:true});expect(()=>setToolbeltMode('draw')).toThrow('Close Motion');expect(useToolbelt.getState().mode).toBe('design');s.set({motionOpen:false});toggleDrawMode();expect(useToolbelt.getState().mode).toBe('draw');expect(useEditor.getState().tool).toBe('pencil');expect(useEditor.getState().doc).toBe(doc);toggleDrawMode();expect(useEditor.getState().tool).toBe('move');expect(()=>setToolbeltMode('dev' as never)).toThrow('Design or Draw');});
 it('keeps a drawing tool already chosen',()=>{const s=useEditor.getState();s.set({tool:'pen'});setToolbeltMode('draw');expect(useEditor.getState().tool).toBe('pen');setToolbeltMode('design');});
});

describe('file save status',()=>{
 const at='2026-10-31T10:00:00.000Z',base={updatedAt:at,recoveryAt:'',savedAt:'',recoveryFailed:false};
 it('orders failure, project save, recovery and pending states',()=>{expect(fileSaveStatus({...base,recoveryAt:at,savedAt:at,recoveryFailed:true}).state).toBe('failed');expect(fileSaveStatus({...base,recoveryAt:at,savedAt:at}).state).toBe('file');expect(fileSaveStatus({...base,recoveryAt:at}).state).toBe('local');expect(fileSaveStatus(base).state).toBe('saving');});
 it('treats an older saved stamp as changed work and survives a bad date',()=>{expect(fileSaveStatus({...base,savedAt:'2026-10-30T10:00:00.000Z',recoveryAt:at}).state).toBe('local');expect(fileSaveStatus({...base,updatedAt:'bad',recoveryAt:'bad'}).label).toBe('Saved locally');});
 it('never names a file path',()=>{for(const s of [fileSaveStatus({...base,savedAt:at}),fileSaveStatus({...base,recoveryAt:at})])expect(s.detail).not.toMatch(/\/Users|\/private/);});
});

describe('connection state',()=>{
 it('states offline consequences without implying an account or server',()=>{expect(connectionLabel(true)).toBe('On your Mac');expect(connectionLabel(false)).toContain('Offline');expect(connectionDetail(false)).toContain('Editing and local saves keep working');expect(connectionDetail(true)).not.toMatch(/account|server|sync/i);});
});

describe('file tab targets',()=>{
 it('round-trips ids through the fragment only',()=>{const url=fileTabUrl('a b/c','http://127.0.0.1:5203/index.html?x=1#old');expect(url).toBe('http://127.0.0.1:5203/index.html#forma-file=a%20b%2Fc');expect(fileTabTarget(new URL(url).hash)).toBe('a b/c');});
 it('ignores malformed fragments',()=>{for(const hash of ['','#other','#forma-file=','#forma-file=%E0%A4%A','#forma-file=a&b=c','#forma-file=%00x','#forma-file='+'a'.repeat(2000)])expect(fileTabTarget(hash)).toBeUndefined();});
});

describe('first run receipt',()=>{
 it('offers only to an empty library without a receipt',()=>{expect(firstRunOffer(null,0)).toBe('pending');expect(firstRunOffer(null,3)).toBe('existing');expect(firstRunOffer('dismissed',0)).toBe('dismissed');expect(firstRunOffer('pending',3)).toBe('pending');});
 it('reads corrupt or unknown receipts as finished',()=>{expect(decodeFirstRun(null)).toBeNull();expect(decodeFirstRun('{')).toBe('dismissed');expect(decodeFirstRun(JSON.stringify({version:9,state:'pending'}))).toBe('dismissed');expect(decodeFirstRun(JSON.stringify({version:1,state:'other'}))).toBe('dismissed');expect(decodeFirstRun(JSON.stringify({version:1,state:'pending'}))).toBe('pending');});
});

describe('motion timeline summary',()=>{
 const n=[node('rectangle',{id:'a',name:'Card'})];
 it('summarizes an empty timeline, singular counts and missing layers',()=>{expect(motionTimelineSummary({duration:2,fps:24,loop:false,tracks:[]} as never,n).sentence).toBe('No keyframes yet. 2 s at 24 fps.');const one=motionTimelineSummary({duration:1.5,fps:30,loop:true,tracks:[{id:'t',nodeId:'a',property:'x',keyframes:[{id:'k',time:.5,value:1,easing:'linear'}]},{id:'u',nodeId:'gone',property:'y',keyframes:[]}]} as never,n);expect(one.sentence).toBe('2 tracks on 2 layers, 1 keyframe. 1.5 s at 30 fps, looping.');expect(one.rows[0].text).toBe('Card, x: 1 keyframe at 0.5 s');expect(one.rows[1].text).toBe('Missing layer, y: 0 keyframes');});
 it('bounds long lists and reports the remainder',()=>{const tracks=Array.from({length:130},(_,i)=>({id:'t'+i,nodeId:'a',property:'x',keyframes:[]})),out=motionTimelineSummary({duration:1,fps:30,loop:false,tracks} as never,n);expect(out.rows).toHaveLength(100);expect(out.hidden).toBe(30);});
});

describe('document independence',()=>{
 it('adds nothing to a blank document',()=>{const raw=JSON.stringify(blankDocument());for(const word of ['ownerName','toolbelt','exportNaming','trashRetention'])expect(raw).not.toContain(word);});
});
