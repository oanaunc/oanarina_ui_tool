import {describe,it,expect} from 'vitest';
import {readClipboardRaster} from '../src/raster-clipboard';

function header(width:number,height:number){const bytes=new Uint8Array(33);bytes.set([137,80,78,71,13,10,26,10]);const view=new DataView(bytes.buffer);view.setUint32(8,13);bytes.set([73,72,68,82],12);view.setUint32(16,width);view.setUint32(20,height);return 'data:image/png;base64,'+btoa(String.fromCharCode(...bytes));}
describe('native normalized PNG boundary',()=>{
 it('rejects wrong MIME, missing data, invalid base64 and giant payloads before allocating an Image',async()=>{
  for(const value of ['data:image/svg+xml;base64,PHN2Zy8+','data:image/png;base64,','data:image/png;base64,'+'!'.repeat(44),'data:image/png;base64,'+'A'.repeat(20_000_000)])await expect(readClipboardRaster(value)).rejects.toThrow('Invalid clipboard PNG');
 });
 it('checks PNG signature, IHDR and pixel budgets before decoding',async()=>{
  await expect(readClipboardRaster('data:image/png;base64,'+'A'.repeat(44))).rejects.toThrow('Invalid clipboard PNG');
  for(const [w,h] of [[0,2],[8193,1],[4001,4000],[1,0]])await expect(readClipboardRaster(header(w,h))).rejects.toThrow('8192 pixels per side');
 });
});
