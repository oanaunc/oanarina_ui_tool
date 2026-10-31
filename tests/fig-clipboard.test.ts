import {describe,expect,it} from 'vitest';
import {decodeFigContainerInWorker} from '../src/fig-container-core';
import {figClipboardBytes,figClipboardMessage,figClipboardRoots,isFigClipboardHtml} from '../src/fig-clipboard';
import {makeDesignClipboard,pasteDesignClipboard} from '../src/clipboard-transfer';
import {mapFigScene} from '../src/fig-scene';
import {blankDocument,parseDocument} from '../src/model';
import {encodeMessage,encodeSchema,figCanvas} from './helpers/fig-fixture';
import {liveMessage,liveSchema} from './helpers/fig-live-fixture';
const base64=(bytes:Uint8Array)=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
const canvas=(message:Record<string,unknown>)=>figCanvas({schema:encodeSchema(liveSchema),message:encodeMessage(message,liveSchema)});
const wrap=(bytes:Uint8Array)=>`<meta charset='utf-8'><div data-buffer="<!--(copy)${base64(bytes)}(/copy)-->"></div>`;
const convert=(bytes:Uint8Array)=>{const decoded=decodeFigContainerInWorker(bytes);return mapFigScene({...decoded,message:figClipboardMessage(decoded.message as Record<string,unknown>)},'Pasted layers');};
describe('.fig clipboard paste (self-authored fixtures only)',()=>{
 it('recognizes the payload by its own header and refuses other bytes before any conversion',()=>{
  expect(isFigClipboardHtml('<b>hello</b>')).toBe(false);expect(isFigClipboardHtml(undefined)).toBe(false);expect(isFigClipboardHtml(wrap(canvas(liveMessage())))).toBe(true);
  expect(()=>figClipboardBytes('<div>AAAAAAAAAAAAAAAAAAAAAAAA</div>')).toThrow(/not supported/);expect(()=>figClipboardBytes('<div>ZmlnLWtpd2===</div>')).toThrow(/could not be read/);
  expect(new TextDecoder().decode(figClipboardBytes(wrap(canvas(liveMessage()))).subarray(0,8))).toBe('fig-kiwi');
 });
 it('reads a whole copied page through the same mapper as a .fig file, keeping live instances',()=>{
  const out=convert(figClipboardBytes(wrap(canvas(liveMessage())))),roots=figClipboardRoots(out.document)!;expect(out.summary.instances).toBeGreaterThan(0);expect(roots.roots.length).toBeGreaterThan(0);
  const destination=blankDocument(),payload=makeDesignClipboard(out.document,roots.pageId,roots.roots),ids=pasteDesignClipboard(destination,destination.pages[0].id,payload);parseDocument(JSON.stringify(destination));
  expect(ids).toHaveLength(roots.roots.length);expect(destination.pages[0].nodes.some(n=>n.type==='instance')).toBe(true);expect(destination.pages.flatMap(p=>p.nodes).some(n=>n.type==='component')).toBe(true);
 });
 it('gives layers whose parent stayed behind one visible page',()=>{
  const message=liveMessage(),nodes=(message.nodeChanges as Record<string,any>[]).filter(n=>!['DOCUMENT','CANVAS'].includes(n.type)||false);
  const out=convert(canvas({...message,nodeChanges:nodes}));expect(out.document.pages[0].name).toBe('Pasted layers');expect(out.document.pages[0].nodes.some(n=>!n.parentId)).toBe(true);
 });
 it('reads a copy stored only on an internal canvas, and refuses an empty clipboard',()=>{
  const id={sessionID:1,localID:1},page={sessionID:1,localID:2},message=figClipboardMessage({nodeChanges:[{guid:id,type:'DOCUMENT'},{guid:page,type:'CANVAS',internalOnly:true,parentIndex:{guid:id,position:'a'}},{guid:{sessionID:1,localID:3},type:'RECTANGLE',parentIndex:{guid:page,position:'a'}}]});
  expect((message.nodeChanges as Record<string,unknown>[])[1].internalOnly).toBe(false);expect(()=>figClipboardMessage({nodeChanges:[]})).toThrow(/empty/);expect(()=>figClipboardMessage({nodeChanges:[{guid:id,type:'DOCUMENT'}]})).toThrow(/no layers/);
 });
 it('leaves malformed scene input to the existing refusals, before anything reaches a document',()=>{
  const message=liveMessage();(message.nodeChanges as Record<string,any>[]).push({guid:{sessionID:7,localID:900},type:'TEXT',parentIndex:{guid:{sessionID:7,localID:900},position:'a'}});expect(()=>convert(canvas(message))).toThrow();
 });
});
