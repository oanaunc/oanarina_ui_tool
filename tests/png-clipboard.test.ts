import {describe,it,expect} from 'vitest';
import {pngClipboardDimensions,renderClipboardPng} from '../src/png-clipboard';
import {commands,matchesShortcut} from '../src/commands';

describe('bounded Copy as PNG',()=>{
 it('uses exactly the official 2× output and rejects edge/pixel limits before raster allocation',()=>{
  expect(pngClipboardDimensions(20,10)).toEqual({width:40,height:20});
  expect(pngClipboardDimensions(12.2,4.1)).toEqual({width:25,height:9});
  expect(pngClipboardDimensions(4096,1)).toEqual({width:8192,height:2});
  expect(pngClipboardDimensions(2000,2000)).toEqual({width:4000,height:4000});
  for(const [w,h] of [[4096.1,1],[2000.1,2000],[Infinity,1],[NaN,1],[0,1],[-1,2]])expect(()=>pngClipboardDimensions(w,h)).toThrow('2× output');
 });
 it('validates surface dimensions before touching a browser decoder or canvas',async()=>{
  for(const [width,height] of [[8193,1],[4001,4000],[0,1],[2.5,1]])await expect(renderClipboardPng('<svg/>',{width,height})).rejects.toThrow('dimensions');
 });
 it('reserves Shift Command C without colliding with Copy or other registered shortcuts',()=>{
  const action=commands.find(c=>c[0]==='copy-as-png')!;expect(action.slice(1)).toEqual(['Copy as PNG','Edit','⇧⌘C']);
  expect(commands.filter(c=>c[3]===action[3])).toHaveLength(1);
  const event={key:'C',code:'KeyC',metaKey:true,ctrlKey:false,altKey:false,shiftKey:true};
  expect(matchesShortcut(event,action[3])).toBe(true);expect(matchesShortcut(event,'⌘C')).toBe(false);
 });
});
