import {describe,expect,it} from 'vitest';
import {isSvgMarkup} from '../src/clipboard-svg';
import {CODE_LAYER_PAINTER} from '../src/code-layer-paint';
import {codeLayerDocument,defaultCodeLayer} from '../src/code-layer';
import {dropConvertsImage,droppedDocument} from '../src/file-drop';
import {dragAssetName,rememberDragAsset} from '../src/drag-asset';
import {desktopDocumentState} from '../src/desktop-lifecycle';
import {setUntouchedPlaceholder} from '../src/startup-health';
import {useEditor} from '../src/store';

describe('clipboard SVG text',()=>{
 it('takes only a whole SVG document',()=>{
  expect(isSvgMarkup('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBe(true);
  expect(isSvgMarkup('  <?xml version="1.0"?>\n<!-- exported -->\n<!DOCTYPE svg PUBLIC "x" "y">\n<svg width="1"><rect/></svg>\n')).toBe(true);
  expect(isSvgMarkup('<svg><rect/></svg>\n<!-- end -->')).toBe(true);
  for(const text of ['use <svg> here','<svg>','<svgfoo></svgfoo>','<div><svg></svg></div>','<svg></svg> trailing words','',undefined])expect(isSvgMarkup(text)).toBe(false);
 });
});
describe('Finder drops',()=>{
 const named=(...names:string[])=>names.map(name=>({name}));
 it('routes one document and refuses documents mixed into a batch',()=>{
  for(const name of ['A.oui','A.FIG','A.pdf','A.sketch'])expect(droppedDocument(named(name))).toBe(true);
  expect(droppedDocument(named('a.png','b.png'))).toBe(false);
  expect(droppedDocument(named('a.svg'))).toBe(false);
  expect(()=>droppedDocument(named('a.png','b.oui'))).toThrow('at a time');
  expect(()=>droppedDocument(named('a.pdf','b.pdf'))).toThrow('at a time');
 });
 it('converts only formats the document cannot embed',()=>{
  for(const type of ['image/heic','image/heif','image/tiff','image/bmp','image/avif'])expect(dropConvertsImage({type})).toBe(true);
  for(const type of ['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','','text/plain'])expect(dropConvertsImage({type})).toBe(false);
 });
});
describe('dragged asset name',()=>{
 it('is answered only while a drag is remembered',()=>{rememberDragAsset('Card.png');expect(dragAssetName()).toBe('Card.png');rememberDragAsset('');expect(dragAssetName()).toBe('');});
});
describe('code layer capture',()=>{
 it('falls back to the DOM painter only when the canvas is tainted',()=>{
  const html=codeLayerDocument(defaultCodeLayer());
  expect(html).toContain('async function paintDom(');
  expect(html).toContain("if(error?.name!=='SecurityError')throw error;dataUrl=await paintDom(w,h,m.scale,paint);");
  expect(CODE_LAYER_PAINTER).not.toMatch(/fetch|XMLHttpRequest|localStorage/);
 });
 it('escapes its patterns through two template literals',()=>{
  expect(CODE_LAYER_PAINTER).toContain('/\\s/.test(raw[i])');
  expect(()=>new Function(CODE_LAYER_PAINTER.replace('async function paintDom','return async function paintDom'))).not.toThrow();
 });
});
describe('safe mode window report',()=>{
 it('marks the untouched placeholder and nothing else',()=>{
  const doc=useEditor.getState().doc;
  expect(desktopDocumentState().placeholder).toBeUndefined();
  setUntouchedPlaceholder(doc);expect(desktopDocumentState().placeholder).toBe(true);
  useEditor.getState().edit(d=>{d.name='Edited in safe mode';});expect(desktopDocumentState().placeholder).toBeUndefined();
  setUntouchedPlaceholder({});
 });
});
