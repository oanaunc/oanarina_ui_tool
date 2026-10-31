import {describe,expect,it,vi} from 'vitest';
import {announceError,isFailureMessage,subscribeErrorAnnouncements} from '../src/error-announcements';
import {contrastRatio,setSystemAccent,systemAccentTokens} from '../src/interface-accessibility';
import {pinchCamera,pinchScale} from '../src/trackpad-pinch';
import {defaultWorkspacePreferences,decodeWorkspacePreferences,validateWorkspacePreferences} from '../src/workspace-preferences';
import {requestVersionLink,subscribeVersionLink,takeVersionLink} from '../src/version-link-request';
import {useEditor} from '../src/store';
import {keyboardPathProps} from '../src/keyboard-insert';
import {blankDocument,parseDocument} from '../src/model';

describe('system accent tokens',()=>{
 const surfaces={dark:['#2c2b30','#343338','#242328'],light:['#ffffff','#f4f2f6','#e9e7ec']};
 for(const hex of ['#007aff','#ffd60a','#000000','#ffffff','#ff3b30','#8e8e93','#34c759'])it(`${hex} clears 4.5:1 in both themes`,()=>{
  const t=systemAccentTokens(hex);
  for(const surface of surfaces.dark)expect(contrastRatio(t.dark,surface)).toBeGreaterThanOrEqual(4.5);
  for(const surface of surfaces.light)expect(contrastRatio(t.light,surface)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(t.dark,t.onDark)).toBeGreaterThanOrEqual(4.5);expect(contrastRatio(t.light,t.onLight)).toBeGreaterThanOrEqual(4.5);
 });
 it('refuses anything but a plain hex color',()=>{for(const value of ['red','#12','#1234567','url(x)',7,null])expect(()=>setSystemAccent(value)).toThrow();expect(setSystemAccent('#007AFF')).toBe(true);});
});
describe('failure announcements',()=>{
 it('recognizes failure wording and leaves success alone',()=>{
  for(const text of ['Local recovery could not be saved. Save a .oui backup before closing.','The Mac clipboard was not updated. No layers were cut.','This file is no longer available in local storage.','The Mac clipboard has no supported layers, SVG, image or text.','Export failed.','Fonts loaded, but text reflow was not applied: x'])expect(isFailureMessage(text),text).toBe(true);
  for(const text of ['Layers pasted. Undo is available.','Saved file changed outside Forma and was reloaded. Undo is available.','Exported to your chosen folder.','Reverted to the saved file.'])expect(isFailureMessage(text),text).toBe(false);
 });
 it('announces a failing toast once, even when notifyError reported it too',()=>{
  const heard=vi.fn(),off=subscribeErrorAnnouncements(heard);
  announceError('Export failed one');useEditor.getState().set({toast:'Export failed one'});useEditor.getState().set({toast:'Layers pasted. Undo is available.'});useEditor.getState().set({toast:'Export failed two'});off();
  expect(heard.mock.calls.map(c=>c[0])).toEqual(['Export failed one','Export failed two']);
 });
});
describe('pinch speed',()=>{
 it('scales the gesture and keeps a pinch out and back neutral',()=>{expect(pinchScale(1.5,1)).toBe(1.5);expect(pinchScale(2,2)).toBe(4);expect(pinchScale(1,2)).toBe(1);expect(pinchScale(0,2)).toBe(0);});
 it('keeps the zoom limits at any speed',()=>{expect(pinchCamera(1,{zoom:1,pan:{x:0,y:0}},pinchScale(10,2),0,0)?.zoom).toBe(8);});
});
describe('new device preferences',()=>{
 it('defaults, and accepts files saved before these fields existed',()=>{expect(decodeWorkspacePreferences(JSON.stringify({version:1,values:{trashRetentionDays:30}}))).toMatchObject({trashRetentionDays:30,pinchZoom:true,pinchSpeed:1,outlineStyle:'shapes',statusSeconds:4});});
 it('refuses values outside the offered choices',()=>{for(const patch of [{pinchSpeed:9},{outlineStyle:'wire'},{statusSeconds:1},{pinchZoom:'yes'}])expect(()=>validateWorkspacePreferences({...defaultWorkspacePreferences,...patch})).toThrow();});
});
describe('external version link hand-off',()=>{
 it('is taken once and notifies an open dialog',()=>{const seen=vi.fn(),off=subscribeVersionLink(seen);requestVersionLink('forma-version:x');off();expect(seen).toHaveBeenCalledOnce();expect(takeVersionLink()).toBe('forma-version:x');expect(takeVersionLink()).toBe('');});
});
describe('keyboard path creation',()=>{
 it('builds a real path in local coordinates that survives Undo and a save',()=>{
  const d=blankDocument();useEditor.getState().load(d);const props=keyboardPathProps('Notch','10,20 130,20 70,110',true);
  expect(props).toMatchObject({x:10,y:20,width:120,height:90,pathWidth:120,pathHeight:90,path:'M0 0 L120 0 L60 90 Z'});
  useEditor.getState().add('path',props);const after=useEditor.getState().doc;expect(after.pages[0].nodes.at(-1)).toMatchObject({type:'path',name:'Notch'});
  expect(parseDocument(JSON.stringify(after)).pages[0].nodes.at(-1)?.path).toBe('M0 0 L120 0 L60 90 Z');
  useEditor.getState().undo();expect(useEditor.getState().doc.pages[0].nodes).toHaveLength(0);
 });
 it('leaves an open path unfilled',()=>{expect(keyboardPathProps('Line','0,0 10,10',false)).toMatchObject({fill:'none',path:'M0 0 L10 10'});});
 it('refuses malformed points before any edit',()=>{for(const text of ['','5,5','1 2 3','a,b 1,1','1,1 1,1','1,2,3 4,5','1e9,0 1,1'])expect(()=>keyboardPathProps('Bad',text,true),text).toThrow();expect(()=>keyboardPathProps(' ','0,0 1,1',true)).toThrow();});
});
