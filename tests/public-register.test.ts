import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {publicRegister,registerMarkdown} from '../scripts/public-register.mjs';
import {FEATURE_COUNT} from '../src/feature-meta';

const working=JSON.parse(readFileSync('public/features.json','utf8'));
const rows=publicRegister(working);
it('keeps every open row and drops retired ones and removed work',()=>{expect(rows.length).toBe(working.filter((r:any)=>r.status!=='retired').length);expect(rows.some((r:any)=>r.status==='retired')).toBe(false);expect(rows.every((r:any)=>!('source' in r)&&!('verification' in r))).toBe(true);});
it('carries no reference name or link, including in the Markdown copy',()=>{const text=JSON.stringify(rows)+registerMarkdown(rows);expect(text).not.toMatch(/fig(?:ma|jam)|https?:\/\/help\./i);});
it('says nothing about the removed bridge and keeps what a mixed sentence says about other paths',()=>{expect(JSON.stringify(rows)).not.toMatch(/\bBridge\b/);const line=rows.find((r:any)=>r.name==='Line-height unit conversion');expect(line.notes).toContain('SVG and source MCP.');});
it('the requirement count the app shows is the public one',()=>{expect(FEATURE_COUNT).toBe(rows.length);});
