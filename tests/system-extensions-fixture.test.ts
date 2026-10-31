import {readFileSync,statSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {parseDocument} from '../src/model';

/** scripts/smoke-mac-extensions.sh feeds this file to Quick Look and Spotlight; it must stay a real, valid project. */
describe('system extension fixture',()=>{
 const file=new URL('./fixtures/system-extensions.oui',import.meta.url);
 it('is a valid synthetic project with the strings the smoke searches for',()=>{
  const doc=parseDocument(readFileSync(file,'utf8'));
  expect(doc.name).toBe('Synthetic Atlas Study');
  expect(doc.pages.map(p=>p.name)).toEqual(['Mobile drafts','Archive notes']);
  expect(doc.pages.flatMap(p=>p.nodes).filter(n=>n.type==='text').map(n=>n.text).join(' ')).toContain('Quartzite harbor lanterns');
 });
 it('stays small and holds no external reference',()=>{
  expect(statSync(file).size).toBeLessThan(40_000);
  expect(readFileSync(file,'utf8')).not.toMatch(/https?:\/\/|file:\/\//);
 });
});
