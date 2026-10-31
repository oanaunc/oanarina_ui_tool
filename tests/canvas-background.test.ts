import {describe,it,expect} from 'vitest';
import {blankDocument,parseDocument} from '../src/model';
import {canvasBackgroundImage} from '../src/canvas-background';

describe('optional per-page canvas backgrounds',()=>{
 it('preserves compatible older documents and persisted color/opacity/visibility',()=>{
  const d=blankDocument();expect(parseDocument(JSON.stringify(d)).pages[0].background).toBeUndefined();d.pages[0].background={color:'#ff0080',opacity:.25,visible:true};
  expect(parseDocument(JSON.stringify(d)).pages[0].background).toEqual(d.pages[0].background);
  expect(canvasBackgroundImage(d.pages[0].background)).toBe('linear-gradient(rgba(255,0,128,0.25),rgba(255,0,128,0.25))');
  expect(canvasBackgroundImage({...d.pages[0].background,visible:false})).toBeUndefined();expect(canvasBackgroundImage(undefined)).toBeUndefined();
 });
 it('rejects malformed optional metadata before document load',()=>{
  for(const background of [null,[],{color:'red',opacity:1,visible:true},{color:'#ffffff',opacity:NaN,visible:true},{color:'#ffffff',opacity:2,visible:true},{color:'#ffffff',opacity:1,visible:'yes'}]){
   const d=blankDocument();(d.pages[0] as any).background=background;expect(()=>parseDocument(JSON.stringify(d))).toThrow('Invalid canvas background');
  }
 });
});
