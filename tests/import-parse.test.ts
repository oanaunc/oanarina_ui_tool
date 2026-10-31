import {afterEach,expect,it,vi} from 'vitest';
import {importParseError,parseProjectInWorker,parseSvgInWorker,validateDocumentInWorker} from '../src/import-parse';
import {importFailureReason} from '../src/import-task';
import {blankDocument} from '../src/model';
class FakeWorker {static made:FakeWorker[]=[];onmessage:((e:{data:unknown})=>void)|null=null;onerror:(()=>void)|null=null;onmessageerror:(()=>void)|null=null;terminated=0;posted:any[]=[];constructor(){FakeWorker.made.push(this);}postMessage(m:unknown){this.posted.push(m);}terminate(){this.terminated++;}send(data:unknown){this.onmessage?.({data});}}
const start=()=>{FakeWorker.made=[];vi.stubGlobal('Worker',FakeWorker);};
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('Cancel terminates the parser at once and ignores a late result',async()=>{
 start();const abort=new AbortController(),pending=parseProjectInWorker('{}',abort.signal),worker=FakeWorker.made[0];abort.abort();await expect(pending).rejects.toMatchObject({name:'AbortError'});expect(worker.terminated).toBe(1);worker.onmessage?.({data:{kind:'done',result:{rest:true}}});
 await expect(parseSvgInWorker('<svg/>','x',abort.signal)).rejects.toMatchObject({name:'AbortError'});expect(FakeWorker.made).toHaveLength(1);
});
it('resolves each job through one owned worker and terminates it',async()=>{
 start();const doc=blankDocument(),pending=validateDocumentInWorker(doc),worker=FakeWorker.made[0];expect(worker.posted[0]).toMatchObject({kind:'validate'});worker.send({kind:'done',result:doc});await expect(pending).resolves.toBe(doc);expect(worker.terminated).toBe(1);
});
it('keeps the error class that picks the fixed message, and no parser excerpt',async()=>{
 start();const pending=parseProjectInWorker('nope');FakeWorker.made[0].send({kind:'error',name:'SyntaxError',message:'Unexpected token n in private text'});const error=await pending.catch(e=>e);expect(error).toBeInstanceOf(SyntaxError);expect(importFailureReason(error,'validating')).toBe('The selected project is not valid JSON. Export a new .oui copy from the original app.');
 expect(importParseError('RangeError','x')).toBeInstanceOf(RangeError);expect(importParseError('TypeError','x').constructor).toBe(Error);
});
it('stops a hung parser at the work limit and reports a worker that cannot start',async()=>{
 start();vi.useFakeTimers();const pending=parseProjectInWorker('{}'),rejected=expect(pending).rejects.toThrow(/60-second/);await vi.advanceTimersByTimeAsync(60_000);await rejected;expect(FakeWorker.made[0].terminated).toBe(1);
 vi.useRealTimers();const failing=parseSvgInWorker('<svg/>','x');FakeWorker.made[1].onerror?.();await expect(failing).rejects.toThrow(/Unable to start/);
});
