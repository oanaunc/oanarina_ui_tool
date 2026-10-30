import { afterEach, expect, it, vi } from 'vitest';
import { decodeFigFile } from '../src/fig-container';
import { FIG_LIMITS } from '../src/fig-limits';

afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
function installWorker(reply=true){
  const instances:MockWorker[]=[];
  class MockWorker {
    onmessage:((event:any)=>void)|null=null;
    onerror:((event:any)=>void)|null=null;
    terminated=false;
    constructor(){instances.push(this);}
    terminate(){this.terminated=true;}
    postMessage(bytes:Uint8Array,transfer:ArrayBuffer[]){
      const received=structuredClone(bytes,{transfer});
      if(reply)queueMicrotask(()=>this.onmessage?.({data:{ok:true,decoded:{version:106,message:{bytes:received},images:{}}}}));
    }
  }
  vi.stubGlobal('Worker',MockWorker);
  return instances;
}
it('copies exact bytes for Buffer views/subclasses without invoking overridden slice or detaching source memory',async()=>{
  const workers=installWorker();
  class View extends Uint8Array { override slice():never {throw new Error('User slice must never execute');} }
  for(const original of [new View([1,2,3]),Buffer.from([5,6,7,8]).subarray(1,3)]){
    const expected=Array.from(original),length=original.buffer.byteLength;
    const decoded=await decodeFigFile(original);
    expect(decoded.message.bytes).toEqual(new Uint8Array(expected));
    expect(Array.from(original)).toEqual(expected);expect(original.buffer.byteLength).toBe(length);
  }
  expect(workers.every(w=>w.terminated)).toBe(true);
});
it('terminates the independent worker at the work limit and on abort, allowing a subsequent decode',async()=>{
  vi.useFakeTimers();const workers=installWorker(false);
  const pending=decodeFigFile(new Uint8Array([1]));const rejected=expect(pending).rejects.toThrow(/15-second work limit/);
  await vi.advanceTimersByTimeAsync(FIG_LIMITS.workerTimeoutMs);await rejected;expect(workers[0].terminated).toBe(true);
  const controller=new AbortController(),cancelled=decodeFigFile(new Uint8Array([1]),{signal:controller.signal});controller.abort();
  await expect(cancelled).rejects.toMatchObject({name:'AbortError'});expect(workers[1].terminated).toBe(true);
  installWorker();await expect(decodeFigFile(new Uint8Array([2]))).resolves.toMatchObject({version:106});
});
it('refuses oversized/aborted input before a worker is created',async()=>{
  const workers=installWorker(),controller=new AbortController();controller.abort();
  await expect(decodeFigFile(new Uint8Array(),{signal:controller.signal})).rejects.toMatchObject({name:'AbortError'});
  await expect(decodeFigFile(new Uint8Array(FIG_LIMITS.inputBytes+1))).rejects.toThrow(/50 MB/);
  expect(workers).toHaveLength(0);
});
