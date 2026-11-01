import fs from 'node:fs';
import path from 'node:path';
import {inflateSync} from 'fflate';
import {decompress} from 'fzstd';
import {describe,expect,it} from 'vitest';
import {decodeKiwiSchema} from '../src/fig-kiwi';
import {importerFiles,scanImporterFields,schemaNames} from './helpers/fig-field-scan';
import checked from './helpers/fig-verified-names.json';
/** Our own guesses once passed our own tests, so names are checked against the schema a real file embeds. The file itself
 * stays out of the repository. Set FORMA_REFERENCE_FILE to a real canvas, or keep one at build/fig-import-reference/canvas.fig
 * in this checkout or a parent. Without one, the checked list below still fails any name that was never verified. */
const ledger=path.resolve(import.meta.dirname,'helpers/fig-verified-names.json');
function referenceFile(){if(process.env.FORMA_REFERENCE_FILE)return process.env.FORMA_REFERENCE_FILE;for(let dir=process.cwd();;dir=path.dirname(dir)){const file=path.join(dir,'build/fig-import-reference/canvas.fig');if(fs.existsSync(file))return file;if(dir===path.dirname(dir))return;}}
function embeddedSchema(file:string){const b=new Uint8Array(fs.readFileSync(file)),v=new DataView(b.buffer,b.byteOffset,b.byteLength),size=v.getUint32(12,true),chunk=b.subarray(16,16+size);return schemaNames(decodeKiwiSchema(v.getUint32(16,true)===0xfd2fb528?decompress(chunk):inflateSync(chunk)).definitions);}
const scan=scanImporterFields(),file=referenceFile(),reads=[...new Set(scan.fields.map(f=>f.name))].sort(),values=Object.fromEntries([...new Set(scan.values.map(v=>v.field))].sort().map(field=>[field,[...new Set(scan.values.filter(v=>v.field===field).map(v=>v.value))].sort()]));
const notFields=(schema:ReturnType<typeof schemaNames>)=>scan.fields.filter(f=>!schema.fields.has(f.name)).map(f=>f.name+' in '+f.file);
const notValues=(schema:ReturnType<typeof schemaNames>)=>scan.values.filter(v=>schema.enums.has(v.field)&&!schema.enums.get(v.field)!.has(v.value)).map(v=>v.field+'='+v.value+' in '+v.file);
describe('every name the importer reads',()=>{
 it('is found by the scan, with no read it cannot name',()=>{expect(importerFiles().length).toBeGreaterThan(8);expect(reads.length).toBeGreaterThan(200);expect(scan.unresolved).toEqual([]);});
 it('was verified against an embedded schema',()=>{expect(reads).toEqual(checked.fields);expect(values).toEqual(checked.values);});
 it.skipIf(!file)('exists in the schema a real file embeds',()=>{const schema=embeddedSchema(file!);expect(schema.fields.size).toBeGreaterThan(1000);expect(notFields(schema)).toEqual([]);expect(notValues(schema)).toEqual([]);if(process.env.FORMA_RECORD_NAMES)fs.writeFileSync(ledger,JSON.stringify({fields:reads,values},null,1)+'\n');});
 it('catches a wrong field and a wrong value',()=>{const probe=path.resolve(import.meta.dirname,'../src/fig-probe.ts'),found=scanImporterFields([],{[probe]:"import {string} from './fig-values';import type {Raw} from './fig-values';export const read=(raw:Raw)=>{const mode=string(raw.maskTypo);return raw.textCase==='SHOUTING'||mode==='X';};"}),schema={fields:new Set(['textCase']),enums:new Map([['textCase',new Set(['UPPER'])]])};expect(found.fields.map(f=>f.name).filter(n=>!schema.fields.has(n))).toEqual(['maskTypo']);expect(found.values.filter(v=>schema.enums.has(v.field)&&!schema.enums.get(v.field)!.has(v.value)).map(v=>v.value)).toEqual(['SHOUTING']);});
});
