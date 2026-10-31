import {describe,expect,it} from 'vitest';
import {isSvgMarkup} from '../src/clipboard-svg';
import {CODE_LAYER_PAINTER} from '../src/code-layer-paint';
import {codeLayerDocument,defaultCodeLayer} from '../src/code-layer';
import {dropConvertsImage,droppedDocument} from '../src/file-drop';
import {dragAssetName,rememberDragAsset} from '../src/drag-asset';
import {desktopDocumentState} from '../src/desktop-lifecycle';
import {installedFontStyles} from '../src/font-styles';
import {parseScreenColor,receiveScreenColor,subscribeScreenColor} from '../src/screen-color';
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
describe('installed font faces',()=>{
 it('orders upright before italic and keeps the first face of each weight',()=>{
  const list=installedFontStyles([{label:'Bold',weight:700,italic:false},{label:'Light Oblique',weight:300,italic:true},{label:'Light',weight:300,italic:false},{label:'Heavy duplicate',weight:700,italic:false}]);
  expect(list.map(f=>f.label)).toEqual(['Light','Bold','Light Oblique']);
 });
 it('ignores anything malformed from the shell',()=>{
  expect(installedFontStyles('nope')).toEqual([]);expect(installedFontStyles(null)).toEqual([]);
  expect(installedFontStyles([null,{label:'',weight:400,italic:false},{label:'x',weight:0,italic:false},{label:'x',weight:'400',italic:false},{label:'x',weight:400},{label:'y'.repeat(81),weight:400,italic:false}])).toEqual([]);
  expect(installedFontStyles(Array.from({length:100},(_,i)=>({label:'F'+i,weight:i+1,italic:false})))).toHaveLength(64);
 });
});
describe('native screen color',()=>{
 const sample={srgb:'#336699',p3:'#3a6596'};
 it('refuses a malformed shell value',()=>{for(const value of [null,'#336699',{},{srgb:'#336699'},{srgb:'#33669',p3:'#000000'},{srgb:'red',p3:'#000000'}])expect(()=>parseScreenColor(value)).toThrow('Invalid sampled color.');});
 it('gives the color to the newest open picker and keeps the file profile',()=>{
  const first:string[]=[],second:string[]=[],offFirst=subscribeScreenColor(c=>first.push(c)),offSecond=subscribeScreenColor(c=>second.push(c));
  receiveScreenColor(sample);expect(second).toEqual(['#336699']);expect(first).toEqual([]);
  useEditor.setState({doc:{...useEditor.getState().doc,colorProfile:'display-p3'}});
  receiveScreenColor(sample);expect(second).toEqual(['#336699','#3a6596']);
  useEditor.setState({doc:{...useEditor.getState().doc,colorProfile:undefined}});
  offSecond();receiveScreenColor(sample);expect(first).toEqual(['#336699']);offFirst();
 });
 it('reports the sample when no picker is open',()=>{receiveScreenColor(sample);expect(useEditor.getState().toast).toContain('#336699');});
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
