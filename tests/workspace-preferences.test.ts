import {describe,expect,it} from 'vitest';
import {resizeCanvasNodes} from '../src/canvas-geometry';
import {exportStem} from '../src/export-naming';
import {defaultFileMetadata,queryLocalFiles,validateFileBrowserState} from '../src/file-browser';
import {blankDocument,node} from '../src/model';
import {expiredTrashIds} from '../src/trash-retention';
import {decodeWorkspacePreferences,defaultWorkspacePreferences,validateWorkspacePreferences} from '../src/workspace-preferences';

const rectangle=(id:string,extra={})=>node('rectangle',{id,name:id,x:100,y:50,width:100,height:40,...extra});
const pick=(nodes:ReturnType<typeof rectangle>[],id:string)=>nodes.find(n=>n.id===id)!;
const DAY=86400000,NOW=Date.parse('2026-10-31T00:00:00Z');
function entry(id:string,patch:Partial<ReturnType<typeof defaultFileMetadata>>={}){const doc=blankDocument();doc.id=id;doc.name=id;return {doc,metadata:{...defaultFileMetadata(id),...patch}};}

describe('workspace preference validation',()=>{
 it('rejects unknown fields, bad enums and bad toggles',()=>{expect(()=>validateWorkspacePreferences({...defaultWorkspacePreferences,extra:true})).toThrow('fields');expect(()=>validateWorkspacePreferences({...defaultWorkspacePreferences,trashRetentionDays:5})).toThrow('Trash');expect(()=>validateWorkspacePreferences({...defaultWorkspacePreferences,exportDestination:'cloud'})).toThrow('destination');expect(()=>validateWorkspacePreferences({...defaultWorkspacePreferences,exportNaming:'x'})).toThrow('naming');expect(()=>validateWorkspacePreferences({...defaultWorkspacePreferences,flipWhileResizing:'yes'})).toThrow('toggle');expect(()=>validateWorkspacePreferences([])).toThrow('object');});
 it('falls back to defaults for corrupt storage, keeps known values and ignores fields from a newer version',()=>{expect(decodeWorkspacePreferences('{bad')).toBe(defaultWorkspacePreferences);expect(decodeWorkspacePreferences(JSON.stringify({version:2,values:{}}))).toBe(defaultWorkspacePreferences);expect(decodeWorkspacePreferences(JSON.stringify({version:1,values:{exportNaming:'nope'}}))).toBe(defaultWorkspacePreferences);expect(decodeWorkspacePreferences('x'.repeat(3000))).toBe(defaultWorkspacePreferences);expect(decodeWorkspacePreferences(JSON.stringify({version:1,values:{flipWhileResizing:true,future:1}})).flipWhileResizing).toBe(true);});
});

describe('flip while resizing',()=>{
 it('keeps the clamped result unless flip is requested',()=>{const r=rectangle('a'),out=pick(resizeCanvasNodes([r],['a'],'e',-300,0),'a');expect(out.width).toBe(1);expect(out.flipX).toBeFalsy();});
 it('does nothing different until the handle crosses the opposite edge',()=>{const r=rectangle('a');expect(resizeCanvasNodes([r],['a'],'e',-40,0,{flip:true})).toEqual(resizeCanvasNodes([r],['a'],'e',-40,0));});
 it('mirrors across the anchored edge on each handle',()=>{const east=pick(resizeCanvasNodes([rectangle('a')],['a'],'e',-130,0,{flip:true}),'a');expect(east).toMatchObject({x:70,width:30,flipX:true,y:50,height:40});const west=pick(resizeCanvasNodes([rectangle('a')],['a'],'w',130,0,{flip:true}),'a');expect(west).toMatchObject({x:200,width:30,flipX:true});const south=pick(resizeCanvasNodes([rectangle('a')],['a'],'s',0,-60,{flip:true}),'a');expect(south).toMatchObject({y:30,height:20,flipY:true,flipX:false});const north=pick(resizeCanvasNodes([rectangle('a')],['a'],'n',0,60,{flip:true}),'a');expect(north).toMatchObject({y:90,height:20,flipY:true});});
 it('crossing back on an already flipped layer clears the flag and flips both axes on a corner',()=>{expect(pick(resizeCanvasNodes([rectangle('a',{flipX:true})],['a'],'w',-130,0,{flip:true}),'a').flipX).toBe(false);const corner=pick(resizeCanvasNodes([rectangle('a')],['a'],'se',-130,-60,{flip:true}),'a');expect(corner).toMatchObject({x:70,width:30,y:30,height:20,flipX:true,flipY:true});});
 it('preserves rotation and scales proportionally with aspect and around the center',()=>{const turned=pick(resizeCanvasNodes([rectangle('a',{rotation:30})],['a'],'e',-130*Math.cos(Math.PI/6),-130*Math.sin(Math.PI/6),{flip:true}),'a');expect(turned.flipX).toBe(true);expect(turned.rotation).toBeCloseTo(30,6);expect(turned.width).toBeCloseTo(30,6);const aspect=pick(resizeCanvasNodes([rectangle('a')],['a'],'e',-150,0,{flip:true,aspect:true}),'a');expect(aspect).toMatchObject({width:50,height:20,flipX:true,flipY:true});const center=pick(resizeCanvasNodes([rectangle('a')],['a'],'e',-80,0,{flip:true,center:true}),'a');expect(center).toMatchObject({x:120,width:60,flipX:true});});
 it('moves children with a flipped frame and refuses text, groups and scale-tool drags',()=>{const frame=node('frame',{id:'f',name:'f',x:100,y:0,width:100,height:100}),child=rectangle('c',{parentId:'f',x:110,y:10,width:10,height:10}),moved=resizeCanvasNodes([frame,child],['f'],'e',-130,0,{flip:true});expect(pick(moved,'f')).toMatchObject({x:70,width:30,flipX:true});expect(pick(moved,'c').x).toBe(80);const text=node('text',{id:'t',name:'t',text:'x',x:0,y:0,width:100,height:40});expect(pick(resizeCanvasNodes([text],['t'],'e',-300,0,{flip:true}),'t').flipX).toBeFalsy();expect(pick(resizeCanvasNodes([rectangle('a')],['a'],'e',-300,0,{flip:true,scaleContents:true}),'a').flipX).toBeFalsy();});
 it('never produces a zero size when released exactly on the opposite edge or a hair past it',()=>{for(const dx of [-100,-100.2]){const out=pick(resizeCanvasNodes([rectangle('a')],['a'],'e',dx,0,{flip:true}),'a');expect(out.width).toBeGreaterThanOrEqual(1);}});
 it('mirrors a multi-selection around its box and leaves text selections clamped',()=>{const a=rectangle('a',{x:0,y:0,width:50,height:50}),b=rectangle('b',{x:100,y:0,width:50,height:50}),out=resizeCanvasNodes([a,b],['a','b'],'e',-300,0,{flip:true});expect(pick(out,'a').flipX).toBe(true);expect(pick(out,'b').flipX).toBe(true);expect(pick(out,'a').rotation).toBeCloseTo(0,6);expect(pick(out,'b').x).toBeLessThan(pick(out,'a').x);const t=node('text',{id:'t',name:'t',text:'x',x:100,y:0,width:50,height:50});expect(pick(resizeCanvasNodes([a,t],['a','t'],'e',-300,0,{flip:true}),'a').flipX).toBeFalsy();});
});

describe('export naming',()=>{
 it('prefixes the layer name without touching suffix handling',()=>{const context={document:'Doc',page:'Page 1'};expect(exportStem('layer','Card',context)).toBe('Card');expect(exportStem('document-layer','Card',context)).toBe('Doc - Card');expect(exportStem('page-layer','Card',context)).toBe('Page 1 - Card');expect(()=>exportStem('x' as never,'Card',context)).toThrow('Invalid');});
});

describe('Trash retention',()=>{
 const ago=(days:number)=>new Date(NOW-days*DAY).toISOString();
 it('keeps everything when retention is off and rejects invalid input',()=>{expect(expiredTrashIds([entry('a',{trashedAt:ago(900)})],0,NOW)).toEqual([]);expect(()=>expiredTrashIds([],-1,NOW)).toThrow('Invalid');expect(()=>expiredTrashIds([],1.5,NOW)).toThrow('Invalid');});
 it('selects only trash past the age, never open, live, future or already deleted files',()=>{const entries=[entry('old',{trashedAt:ago(31)}),entry('edge',{trashedAt:ago(30)}),entry('recent',{trashedAt:ago(1)}),entry('live'),entry('open',{trashedAt:ago(99)}),entry('future',{trashedAt:ago(-5)}),entry('gone',{trashedAt:ago(99),deleted:true}),entry('bad',{trashedAt:'not a date'})];expect(expiredTrashIds(entries,30,NOW,['open'])).toEqual(['old']);});
});

describe('file ownership metadata',()=>{
 it('validates owner labels and stays optional for legacy state',()=>{expect(validateFileBrowserState({version:1,folders:[],files:[defaultFileMetadata('a')]}).files[0].ownerName).toBeUndefined();expect(validateFileBrowserState({version:1,folders:[],files:[{...defaultFileMetadata('a'),ownerName:'Oana'}]}).files[0].ownerName).toBe('Oana');for(const ownerName of ['',' ','x'.repeat(121),'a\u0001',7])expect(()=>validateFileBrowserState({version:1,folders:[],files:[{...defaultFileMetadata('a'),ownerName}]})).toThrow('invalid');});
 it('sorts by owner, then name, with unrecorded owners last and pins first',()=>{const entries=[entry('none'),entry('zoe',{ownerName:'Zoe'}),entry('b',{ownerName:'ana'}),entry('a',{ownerName:'Ana'}),entry('pin',{pinned:true})];expect(queryLocalFiles(entries,{view:'all',sort:'owner-asc'}).map(e=>e.doc.id)).toEqual(['pin','a','b','zoe','none']);});
});

