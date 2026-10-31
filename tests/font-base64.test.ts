import {expect,it} from 'vitest';
import {bytesToBase64} from '../src/font-data';
it('keeps arbitrary font bytes identical across internal chunks and all final padding lengths',()=>{
 for(const length of [0,1,2,3,24575,24576,24577,24578,73729]){const bytes=Uint8Array.from({length},(_,i)=>(i*37+Math.floor(i/256))%256);expect(bytesToBase64(bytes.buffer)).toBe(Buffer.from(bytes).toString('base64'));}
});
