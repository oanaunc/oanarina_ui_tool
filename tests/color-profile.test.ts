import {describe,expect,it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {unzlibSync} from 'fflate';
import {blankDocument,node,parseDocument} from '../src/model';
import {displayColor,displaySvgMarkup,outsideSrgb,p3ToSrgbHex,srgbToP3Hex,validateColorProfile} from '../src/color-profile';
import {displayP3IccProfile} from '../src/display-p3-icc';
import {canvasBackgroundImage} from '../src/canvas-background';
import {pngColorProfile,tagPngDataUrl,validatePngColorProfile} from '../src/png-color-profile';
import {exportCanvasSpace} from '../src/export-delivery';
import {createEffect} from '../src/effects';
import {createPaint} from '../src/paints';
import {Artwork} from '../src/components/Artwork';
import {useEditor} from '../src/store';
import {defaultSurface,surfaceTile} from '../src/surface-paint';
import type {NoiseSource} from '../src/surface-paint';
const png=()=>Uint8Array.from(atob((surfaceTile(defaultSurface('noise') as NoiseSource).image).split(',')[1]),c=>c.charCodeAt(0));
function chunks(bytes:Uint8Array){const out:{type:string;data:Uint8Array}[]=[],v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let i=8;i<bytes.length;){const n=v.getUint32(i);out.push({type:String.fromCharCode(...bytes.subarray(i+4,i+8)),data:bytes.slice(i+8,i+8+n)});i+=n+12;}return out;}
const s15=(view:DataView,at:number)=>view.getInt32(at)/65536;
describe('document profile',()=>{
 it('accepts only sRGB, Display P3 or absence',()=>{for(const v of [undefined,'srgb','display-p3'])expect(()=>validateColorProfile(v)).not.toThrow();for(const v of ['p3','adobe-rgb',1,null])expect(()=>validateColorProfile(v)).toThrow();});
 it('persists through the document format',()=>{const d=blankDocument();d.colorProfile='display-p3';expect(parseDocument(JSON.stringify(d)).colorProfile).toBe('display-p3');});
});
describe('color math',()=>{
 it('matches the engine conversions measured in Chromium and WebKit',()=>{expect(srgbToP3Hex('#ff0000')).toBe('#ea3323');expect(p3ToSrgbHex('#ff0000')).toBe('#ff0000');expect(p3ToSrgbHex('#33cc1a')).toBe('#00d000');});
 it('keeps neutrals fixed and round-trips in-gamut colors',()=>{for(const c of ['#000000','#ffffff','#808080'])expect(srgbToP3Hex(c)).toBe(c);const back=p3ToSrgbHex(srgbToP3Hex('#336699'));for(const i of [1,3,5])expect(Math.abs(parseInt(back.slice(i,i+2),16)-parseInt('#336699'.slice(i,i+2),16))).toBeLessThanOrEqual(1);});
 it('finds real P3-only colors',()=>{expect(outsideSrgb('#ff0000')).toBe(true);expect(outsideSrgb('#00ff00')).toBe(true);expect(outsideSrgb('#808080')).toBe(false);expect(outsideSrgb(srgbToP3Hex('#ff0000'))).toBe(false);expect(outsideSrgb('none')).toBe(false);});
});
describe('display output',()=>{
 it('leaves sRGB untouched and writes P3 coordinates, including alpha and non-color values',()=>{expect(displayColor('#FF0000',undefined)).toBe('#FF0000');expect(displayColor('#ff0000','srgb')).toBe('#ff0000');expect(displayColor('#ff8000','display-p3')).toBe('color(display-p3 1 0.502 0)');expect(displayColor('#ff000080','display-p3')).toBe('color(display-p3 1 0 0 / 0.502)');for(const v of ['none','transparent','url(#a)'])expect(displayColor(v,'display-p3')).toBe(v);});
 it('rewrites generated tile markup and canvas backgrounds only for P3',()=>{expect(displaySvgMarkup('<rect fill="#ff0000" stroke="none"/>','display-p3')).toBe('<rect fill="color(display-p3 1 0 0)" stroke="none"/>');expect(displaySvgMarkup('<rect fill="#ff0000"/>','srgb')).toBe('<rect fill="#ff0000"/>');const bg={color:'#ff0000',opacity:.5,visible:true};expect(canvasBackgroundImage(bg)).toContain('rgba(255,0,0,0.5)');expect(canvasBackgroundImage(bg,'display-p3')).toContain('color(display-p3 1 0 0 / 0.5)');});
 it('applies to solid, gradient, shadow and text-run colors in shared Artwork, and only for P3 files',()=>{const fill=createPaint('#ff0000'),gradient={...createPaint('#00ff00','linear')},n=node('rectangle',{id:'a',paints:[fill,gradient],stroke:'',strokes:[],effects:[{...createEffect(),color:'#0000ff'}]}),text=node('text',{id:'t',fill:'#000000',text:'A',textRuns:[{start:0,end:1,style:{fill:'#00ff00'}}]});const html=()=>renderToStaticMarkup(createElement('svg',null,createElement(Artwork,{nodes:[n,text]})));const state=useEditor.getState(),original=state.doc;const plain=html();expect(plain).toContain('#ff0000');expect(plain).not.toContain('display-p3');useEditor.setState({doc:{...original,colorProfile:'display-p3'}});try{const wide=html();expect(wide).toContain('fill="color(display-p3 1 0 0)"');expect(wide).toContain('stop-color="color(display-p3 0 1 0)"');expect(wide).toContain('flood-color="color(display-p3 0 0 1)"');expect(wide).not.toContain('fill="#ff0000"');}finally{useEditor.setState({doc:original});}});
});
describe('Display P3 ICC profile',()=>{
 const icc=displayP3IccProfile(),view=new DataView(icc.buffer),tag=(name:string)=>{const count=view.getUint32(128);for(let i=0;i<count;i++){const at=132+i*12;if(String.fromCharCode(...icc.subarray(at,at+4))===name)return {offset:view.getUint32(at+4),size:view.getUint32(at+8)};}throw Error('Missing '+name);};
 it('has a well-formed ICC v4 display header and bounded tags',()=>{expect(view.getUint32(0)).toBe(icc.length);expect(icc[8]).toBe(4);expect(String.fromCharCode(...icc.subarray(12,24))).toBe('mntrRGB XYZ ');expect(String.fromCharCode(...icc.subarray(36,40))).toBe('acsp');const count=view.getUint32(128);expect(count).toBe(10);for(let i=0;i<count;i++){const size=view.getUint32(132+i*12+8),offset=view.getUint32(132+i*12+4);expect(offset%4).toBe(0);expect(offset+size).toBeLessThanOrEqual(icc.length);}});
 it('carries D50-adapted P3 primaries that sum to the D50 white and the sRGB transfer curve',()=>{const column=(name:string)=>[0,1,2].map(i=>s15(view,tag(name).offset+8+i*4)),[r,g,b]=['rXYZ','gXYZ','bXYZ'].map(column);expect(r[0]).toBeCloseTo(.5151,3);expect(r[1]).toBeCloseTo(.2412,3);expect(g[1]).toBeCloseTo(.6922,3);expect(b[2]).toBeCloseTo(.7842,3);[.9642,1,.8249].forEach((v,i)=>expect(r[i]+g[i]+b[i]).toBeCloseTo(v,2));const curve=tag('rTRC').offset;expect(tag('gTRC').offset).toBe(curve);expect(String.fromCharCode(...icc.subarray(curve,curve+4))).toBe('para');expect(s15(view,curve+12)).toBeCloseTo(2.4,4);});
 it('names itself in its description',()=>{const t=tag('desc');expect(String.fromCharCode(...icc.subarray(t.offset+28,t.offset+t.size)).replace(/\0/g,'')).toContain('Display P3');});
});
describe('PNG tagging',()=>{
 it('adds cICP and iCCP before pixels and keeps image data byte-identical',()=>{const source=png(),tagged=pngColorProfile(source,'display-p3'),list=chunks(tagged),names=list.map(c=>c.type);expect(names.slice(0,5)).toEqual(['IHDR','cICP','iCCP','gAMA','cHRM']);expect(names.indexOf('iCCP')).toBeLessThan(names.indexOf('IDAT'));expect([...list.find(c=>c.type==='cICP')!.data]).toEqual([12,13,0,1]);const profile=list.find(c=>c.type==='iCCP')!.data,zero=profile.indexOf(0);expect(String.fromCharCode(...profile.subarray(0,zero))).toBe('Display P3');expect(profile[zero+1]).toBe(0);expect([...unzlibSync(profile.subarray(zero+2))]).toEqual([...displayP3IccProfile()]);expect([...list.find(c=>c.type==='IDAT')!.data]).toEqual([...chunks(source).find(c=>c.type==='IDAT')!.data]);});
 it('replaces any earlier tag, so retagging is idempotent and never stacks',()=>{const once=pngColorProfile(png(),'display-p3'),twice=pngColorProfile(once,'display-p3');expect([...twice]).toEqual([...once]);const srgb=chunks(pngColorProfile(once,'srgb')).map(c=>c.type);expect(srgb).toContain('sRGB');expect(srgb).not.toContain('iCCP');expect(srgb).not.toContain('cICP');expect(chunks(pngColorProfile(once,'none')).map(c=>c.type)).toEqual(['IHDR','IDAT','IEND']);});
 it('tags generated data URLs and validates the profile choice',()=>{const url='data:image/png;base64,'+btoa(String.fromCharCode(...png()));expect(atob(tagPngDataUrl(url,'display-p3').split(',')[1])).toContain('cICP');expect(()=>validatePngColorProfile('display-p3')).not.toThrow();expect(()=>validatePngColorProfile('adobe-rgb')).toThrow();});
});
describe('export canvas space',()=>{
 it('renders wide only where the output can carry it',()=>{expect(exportCanvasSpace({format:'png',pngColorProfile:'display-p3'})).toBe('display-p3');expect(exportCanvasSpace({format:'jpg',documentProfile:'display-p3'})).toBe('display-p3');expect(exportCanvasSpace({format:'png',pngColorProfile:'srgb',documentProfile:'display-p3'})).toBe('srgb');expect(exportCanvasSpace({format:'png',pngColorProfile:'none',documentProfile:'display-p3'})).toBe('srgb');expect(exportCanvasSpace({format:'png'})).toBe('srgb');expect(exportCanvasSpace({format:'jpg'})).toBe('srgb');});
});
