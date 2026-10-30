import {describe,expect,it} from 'vitest';
import {applyDocumentDescription,DOCUMENT_DESCRIPTION_LIMIT,normalizedDocumentDescription,validateDocumentMetadata} from '../src/document-metadata';
import {blankDocument,parseDocument} from '../src/model';
import {serializeFontDocument} from '../src/font-data';
import {cloneLocalDocument} from '../src/file-browser';
import {useEditor} from '../src/store';

describe('optional portable document description',()=>{
 it('opens absent legacy v1/v2 fields unchanged and preserves bounded literal multiline Unicode text',()=>{
  for(const version of [1,2]){const doc={...blankDocument(),version};expect(parseDocument(JSON.stringify(doc))).not.toHaveProperty('description');}
  const doc=blankDocument();doc.description='  Notes 🪷\n<script>literal text</script>\twith tabs\r\nand CRLF  ';const raw=serializeFontDocument(doc,[]);expect(parseDocument(raw).description).toBe(doc.description);expect(cloneLocalDocument(doc).description).toBe(doc.description);
  doc.description='x'.repeat(DOCUMENT_DESCRIPTION_LIMIT);expect(parseDocument(JSON.stringify(doc)).description).toHaveLength(DOCUMENT_DESCRIPTION_LIMIT);
 });
 it('rejects malformed, oversized and forbidden-control descriptions before any draft mutation',()=>{
  for(const value of [null,1,false,[],{},'x'.repeat(DOCUMENT_DESCRIPTION_LIMIT+1),'bad\0text','bad\u000btext','bad\u007ftext','bad\u0085text','bad\u009ftext']){const doc=blankDocument();expect(()=>parseDocument(JSON.stringify({...doc,description:value}))).toThrow(/description/);expect(()=>validateDocumentMetadata({description:value})).toThrow(/description/);const before=JSON.stringify(doc);expect(()=>applyDocumentDescription(doc,value as string)).toThrow();expect(JSON.stringify(doc)).toBe(before);}
 });
 it('normalizes UI line endings, clears empty text, preserves literal formatting and returns true only for real changes',()=>{
  expect(normalizedDocumentDescription(' \r\n\t')).toBeUndefined();expect(normalizedDocumentDescription(' First\r\nSecond\rThird ')).toBe(' First\nSecond\nThird ');const doc=blankDocument();expect(applyDocumentDescription(doc,'')).toBe(false);expect(applyDocumentDescription(doc,'Text')).toBe(true);expect(applyDocumentDescription(doc,'Text')).toBe(false);expect(applyDocumentDescription(doc,' \n')).toBe(true);expect(doc).not.toHaveProperty('description');
 });
 it('refuses stale document/description snapshots atomically',()=>{
  const doc={id:'current',description:'Other edit'},before={...doc};for(const snapshot of [{id:'old',description:'Other edit'},{id:'current',description:'Before edit'}]){expect(()=>applyDocumentDescription(doc,'New draft',snapshot)).toThrow(/changed/);expect(doc).toEqual(before);}
 });
 it('creates one editor Undo edit and empty/no-op submissions preserve timestamp/history',()=>{
  const s=()=>useEditor.getState();s().load(blankDocument());const before=s().doc,original={id:before.id,description:before.description};s().edit(d=>{applyDocumentDescription(d,'About this file',original);});expect(s().doc.description).toBe('About this file');expect(s().past).toHaveLength(1);const saved=s().doc;s().edit(d=>{applyDocumentDescription(d,'About this file');});expect(s().doc).toBe(saved);expect(s().past).toHaveLength(1);s().undo();expect(s().doc).toBe(before);s().redo();expect(s().doc.description).toBe('About this file');s().edit(d=>{applyDocumentDescription(d,'');});expect(s().doc).not.toHaveProperty('description');s().undo();expect(s().doc.description).toBe('About this file');
 });
});
