import {afterEach,describe,expect,it,vi} from 'vitest';
import {defaultPanelLayout,MIN_CANVAS,PANEL_LAYOUT_KEY,PANEL_SEPARATOR,parsePanelLayout,readPanelLayout,resolvePanelLayout,writePanelLayout} from '../src/panel-layout';
afterEach(()=>vi.unstubAllGlobals());
describe('device-local sidebar layout',()=>{
 it('validates bounded primitive settings without retaining unknown data',()=>{
  const layout=defaultPanelLayout();layout.left.width=320;layout.right.collapsed=true;
  expect(parsePanelLayout(JSON.stringify({...layout,document:{secret:'ignored'}}))).toEqual(layout);
  expect(parsePanelLayout(null)).toEqual(defaultPanelLayout());
  for(const bad of ['{','null','[]','{}',' '.repeat(2049),JSON.stringify({...layout,version:2}),JSON.stringify({...layout,left:{width:0,collapsed:false}}),JSON.stringify({...layout,right:{width:481,collapsed:false}}),JSON.stringify({...layout,right:{width:null,collapsed:'false'}})])expect(()=>parsePanelLayout(bad)).toThrow();
 });
 it('keeps original responsive defaults until a user chooses a width',()=>{
  const layout=defaultPanelLayout();for(const [viewport,left,right] of [[1512,232,251],[1000,206,225],[800,185,205],[390,151,240]])expect(resolvePanelLayout(layout,viewport)).toMatchObject({left,right});
 });
 it('clamps only effective widths to preserve canvas room and restores desired widths when space returns',()=>{
  const layout=defaultPanelLayout();layout.left.width=480;layout.right.width=480;const before=structuredClone(layout);
  for(const width of [701,730,800,900,1000]){const effective=resolvePanelLayout(layout,width);expect(width-effective.left-effective.right-2*PANEL_SEPARATOR).toBeGreaterThanOrEqual(MIN_CANVAS);expect(effective.left).toBeGreaterThanOrEqual(160);expect(effective.right).toBeGreaterThanOrEqual(200);}
  expect(resolvePanelLayout(layout,1512)).toMatchObject({left:480,right:480});expect(layout).toEqual(before);
  layout.left.collapsed=true;expect(resolvePanelLayout(layout,701)).toMatchObject({left:28,right:421});
 });
 it('does not write on read and reports unavailable/corrupt storage honestly',()=>{
  const data=new Map<string,string>(),setItem=vi.fn((key:string,value:string)=>data.set(key,value));vi.stubGlobal('localStorage',{getItem:(key:string)=>data.get(key)??null,setItem});
  expect(readPanelLayout()).toEqual({layout:defaultPanelLayout(),warning:''});expect(setItem).not.toHaveBeenCalled();const layout=defaultPanelLayout();layout.left.width=350;expect(writePanelLayout(layout)).toBe('');expect(readPanelLayout().layout).toEqual(layout);expect(data.has(PANEL_LAYOUT_KEY)).toBe(true);
  data.set(PANEL_LAYOUT_KEY,'corrupt');expect(readPanelLayout().warning).toContain('could not be read');
  vi.stubGlobal('localStorage',{getItem(){throw Error('Denied');},setItem(){throw Error('Denied');}});expect(readPanelLayout().layout).toEqual(defaultPanelLayout());expect(writePanelLayout(layout)).toContain('could not be saved');
 });
});
