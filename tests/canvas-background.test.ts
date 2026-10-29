import {describe,it,expect} from 'vitest';
import {blankDocument,parseDocument} from '../src/model';
import {canvasBackgroundImage} from '../src/canvas-background';
import {createFigmaMock} from './helpers/figma-mock';

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
 it('transfers single solid page backgrounds through the bridge API contract mock',async()=>{
  const d=blankDocument();d.pages[0].background={color:'#ff0080',opacity:.25,visible:false};const mock=createFigmaMock();const imported=await mock.importDocument(d);expect(imported.type).toBe('imported');
  const page=mock.pages.find((p:any)=>p.name===d.pages[0].name)!;expect(page.backgrounds).toEqual([{type:'SOLID',color:{r:1,g:0,b:128/255},opacity:.25,visible:false}]);
  mock.api.currentPage=page;const exported=await mock.exportDocument('page');expect(exported.type).toBe('exported');expect(parseDocument(JSON.stringify(exported.data)).pages[0].background).toEqual(d.pages[0].background);
 });
 it('rejects invalid bridge background metadata without creating pages',async()=>{
  const d=blankDocument();(d.pages[0] as any).background={color:'url(secret)',opacity:1,visible:true};const mock=createFigmaMock(),count=mock.pages.length;
  const result=await mock.importDocument(d);expect(result.type).toBe('error');expect(mock.pages).toHaveLength(count);
 });
});
