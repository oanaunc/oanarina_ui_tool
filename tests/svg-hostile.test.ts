import {describe,expect,it} from 'vitest';
import {isSvgMarkup} from '../src/clipboard-svg';
import {parseEditableSvg} from '../src/svg-import';
import {parseSvgStylesheet,svgMediaMatches} from '../src/svg-css';
import {substituteVars,svgColor,svgLength} from '../src/svg-values';
import {prepareSvgXml} from '../src/svg-xml';
/** Small files that once ran for seconds or froze the app. Each has a clock on it, so a backtracking pattern or an unpaid loop fails here. */
const NS='xmlns="http://www.w3.org/2000/svg"',wrap=(body:string)=>`<svg ${NS} width="100" height="100" viewBox="0 0 100 100">${body}</svg>`,parse=(body:string)=>parseEditableSvg(wrap(body),'Hostile',{x:0,y:0}),codes=(r:ReturnType<typeof parse>)=>r.issues.map(i=>i.code),context={font:16,rem:16,vw:100,vh:100};
const timed=<T>(limit:number,run:()=>T)=>{const started=performance.now(),out=run(),spent=performance.now()-started;expect(spent,`took ${Math.round(spent)} ms`).toBeLessThan(limit);return out;};
describe('main-thread text checks',()=>{
 it('reads paste text in a few milliseconds whatever it holds',()=>{
  expect(timed(50,()=>isSvgMarkup('<!doctype svg '+'[]'.repeat(40)))).toBe(false);
  expect(timed(50,()=>isSvgMarkup('</svg>'+'<!---->'.repeat(26)+'x'))).toBe(false);
  expect(timed(50,()=>isSvgMarkup('<!doctype svg '+'[]'.repeat(500000)))).toBe(false);
  expect(timed(50,()=>isSvgMarkup('<svg></svg>'+'<!---->'.repeat(500000)+'x'))).toBe(false);
  expect(timed(50,()=>isSvgMarkup('<?'.repeat(500000)))).toBe(false);
  expect(timed(50,()=>isSvgMarkup('<!--'.repeat(500000)))).toBe(false);
  expect(timed(50,()=>isSvgMarkup('<svg '+'a'.repeat(5_000_000)))).toBe(false);
  expect(timed(50,()=>isSvgMarkup('<svg></svg>'+'-->'.repeat(500000)))).toBe(false);
 });
 it('still knows real markup',()=>{for(const text of ['<svg></svg>','  <svg width="1">a</svg>\n','<?xml version="1.0"?><svg></svg>','<!-- a --><!DOCTYPE svg><svg></svg><!-- b --> <!-- c -->','<!DOCTYPE svg PUBLIC "a>" "b" [<!ENTITY n "]>"><!-- ]> -->]>\n<svg></svg>','<svg:svg></svg:svg>'])expect(isSvgMarkup(text),text).toBe(true);for(const text of ['','plain','<svgx></svgx>','<!doctype html><svg></svg>','<svg></svg> tail','<!doctype svgx><svg></svg>'])expect(isSvgMarkup(text),text).toBe(false);});
 it('expands entities in time linear to the file',()=>{
  const amps='&'.repeat(1_000_000);expect(timed(300,()=>prepareSvgXml(`<!DOCTYPE svg [<!ENTITY a "b">]><svg>${amps}</svg>`).text.length)).toBeGreaterThan(1_000_000);
  expect(timed(300,()=>prepareSvgXml(`<!DOCTYPE svg [<!ENTITY a "${'&'.repeat(65000)}">]><svg>&a;</svg>`).text.length)).toBeGreaterThan(65000);
  expect(prepareSvgXml(`<!DOCTYPE svg [<!ENTITY a "b">]><svg>&a;&amp;&#65;&b;</svg>`).text).toBe('<svg>b&amp;&#65;&b;</svg>');
 });
});
describe('values',()=>{
 const digits='1'.repeat(80000),letters='a'.repeat(80000);
 it('rejects long values without backtracking',()=>{
  expect(timed(100,()=>svgLength(digits+'!',100,context))).toBeUndefined();
  expect(timed(100,()=>svgLength('calc('+letters+')',100,context))).toBeUndefined();
  expect(timed(100,()=>svgLength('calc('+'1'.repeat(4000)+'!)',100,context))).toBeUndefined();
  expect(timed(100,()=>svgLength('calc('+'a'.repeat(4000)+')',100,context))).toBeUndefined();
  expect(timed(100,()=>svgColor('rgb('+digits+')'))).toBeUndefined();
  expect(timed(300,()=>codes(parse(`<rect width="9" height="9" fill="url(${' '.repeat(3200)}"/>`)).length)).toBeGreaterThanOrEqual(0);
  expect(timed(300,()=>parse(`<rect width="9" height="9" style="fill:url(${' '.repeat(60000)}"/>`).nodes.length)).toBe(2);
  expect(timed(300,()=>parse(`<rect width="9" height="9" style="filter:${'a'.repeat(4000)}"/>`).nodes.length)).toBe(2);
  expect(timed(300,()=>parse(`<rect width="${digits}!" height="9"/>`).issues.length)).toBeGreaterThan(0);
 });
 it('parses attribute selectors and media queries in linear time',()=>{
  expect(timed(300,()=>parseSvgStylesheet(`[${letters}|${letters}!]{fill:red}`,()=>{}).rules.length)).toBe(0);
  expect(timed(300,()=>parseSvgStylesheet(`[a${' '.repeat(80000)}!]{fill:red}`,()=>{}).rules.length)).toBe(0);
  expect(parseSvgStylesheet('[a="b]"],[c|d],[e~=f i],[|g],[*|h],[i ^= j],[k*=l],[m$=n],[o|=p]{fill:red}',()=>{}).rules.length).toBe(9);const r=parse('<style>[data-k*="id"]{fill:#0a0}</style><rect data-k="mid" width="9" height="9"/>');expect(r.nodes.find(n=>n.type==='rectangle')?.paints?.[0].color).toBe('#00aa00');
  expect(timed(300,()=>svgMediaMatches(`(${'a'.repeat(4000)}<`,{width:9,height:9}))).toBe(false);
  expect(timed(300,()=>svgMediaMatches(' '.repeat(4000)+'!',{width:9,height:9}))).toBe(false);
  expect(timed(300,()=>parseSvgStylesheet(`@media ${' '.repeat(80000)}x{a{fill:red}}`,()=>{}).rules.length)).toBe(0);
  expect(timed(300,()=>parseSvgStylesheet(`@media a${' '.repeat(80000)}and${' '.repeat(80000)}b{a{fill:red}}`,()=>{}).rules.length)).toBe(0);
  expect(timed(300,()=>parseSvgStylesheet(`@supports ${' '.repeat(3000)}(fill:red){a{fill:red}}`,()=>{}).rules.length)).toBe(1);
 });
 it('leaves one odd value out instead of failing the import',()=>{
  expect(svgColor('color(display-p3 1e999 1e999 0)')).toBeUndefined();expect(svgColor('lab(1e300 1e300 1e300)')).toBeUndefined();expect(svgColor('hsl(1e999 0% 0%)')).toBeUndefined();
  expect(svgLength('5constructor',100,context)).toBeUndefined();expect(svgLength('5__proto__',100,context)).toBeUndefined();expect(svgLength('1e999',100,context)).toBeUndefined();
  const r=parse('<g fill="#00aa00"><rect id="a" width="9" height="9" fill="color(display-p3 1e999 1e999 0)"/></g><rect id="b" width="5constructor" height="9"/><rect id="c" width="9" height="9" font-family="\'\'" /><text y="9" font-family=",,">A</text>');expect(r.nodes.find(n=>n.name==='a')?.paints?.[0].color).toBe('#00aa00');expect(codes(r)).toEqual(expect.arrayContaining(['attribute-invalid','font-family-invalid']));
 });
 it('never recurses through context paint',()=>{const r=parse('<defs><marker id="m" markerWidth="9" markerHeight="9"><path d="M0 0H9V9Z" fill="context-fill"/></marker></defs><path d="M0 0L9 9" stroke="#000" fill="context-fill" marker-end="url(#m)"/>');expect(codes(r)).toContain('paint-context');const plain=parse('<defs><marker id="m" markerWidth="9" markerHeight="9"><path d="M0 0H9V9Z" fill="context-stroke"/></marker></defs><path d="M0 0L9 9" stroke="#ff0000" fill="none" marker-end="url(#m)"/>');expect(plain.nodes.some(n=>n.paints?.[0]?.color==='#ff0000')).toBe(true);});
 it('reads a paint with many fallbacks without recursing',()=>{const r=timed(300,()=>parse(`<rect width="9" height="9" style="fill:${'url(#a) '.repeat(6000)}#0a0"/>`));expect(r.nodes.length).toBe(2);});
});
describe('work budgets',()=>{
 it('stops fallback doubling that prints nothing',()=>{
  const chain=Array.from({length:30},(_,i)=>`--v${i}:var(--v${i+1},)var(--v${i+1},);`).join(''),css=`<style>:root{${chain}}rect{fill:var(--v0,#00aa00)}</style>`,r=timed(1500,()=>parse(`${css}<rect width="9" height="9"/>`));expect(r.nodes.find(n=>n.type==='rectangle')?.paints?.[0].color).toBe('#00aa00');expect(codes(r)).toContain('css-var-limit');
  const many=timed(4000,()=>parse(`${css}${'<rect width="9" height="9"/>'.repeat(3000)}`));expect(many.nodes.length).toBeGreaterThan(1000);
  const nested='var(--x,'.repeat(5000)+'#000'+')'.repeat(5000);expect(timed(100,()=>substituteVars(nested,()=>undefined))).toBeUndefined();
  let calls=0;expect(timed(500,()=>substituteVars('var(--a)',name=>{calls++;return `var(${name}x,)var(${name}y,)`;}))).toBeUndefined();expect(calls).toBeLessThan(20000);
 });
 it('pays for declarations shared by many rules',()=>{const declarations=Array.from({length:50000},(_,i)=>`--p${i}:1`).join(';'),selectors=Array.from({length:5000},()=>'*').join(','),r=timed(6000,()=>parse(`<style>${selectors}{${declarations}}</style>${'<rect width="1" height="1"/>'.repeat(200)}`));expect(r.nodes.length).toBeGreaterThan(1);expect(codes(r)).toContain('css-unsupported');});
 it('counts sibling lookups once per parent',()=>{const rules=Array.from({length:5000},(_,i)=>`rect:nth-child(${i+1}){opacity:.5}`).join(''),rects='<rect width="1" height="1"/>'.repeat(2000),r=timed(6000,()=>parse(`<style>${rules}</style><g>${rects}</g>`));expect(r.nodes.filter(n=>n.type==='rectangle')).toHaveLength(2000);expect(r.nodes.filter(n=>n.type==='rectangle').every(n=>n.opacity===.5)).toBe(true);});
 it('stops clip chains that multiply',()=>{const levels=Array.from({length:8},(_,i)=>`<clipPath id="c${i}">${Array.from({length:6},(_,k)=>`<rect x="${k}" width="50" height="50" clip-path="url(#c${i+1})"/>`).join('')}</clipPath>`).join(''),r=timed(8000,()=>parse(`<defs>${levels}<clipPath id="c8"><rect width="60" height="60"/></clipPath></defs><rect width="9" height="9" fill="#000" clip-path="url(#c0)"/>`));expect(r.nodes.find(n=>n.type==='rectangle')?.visible).toBe(true);expect(codes(r)).toContain('clip-unsupported');});
 it('shares one allowance across nested SVG images and reads each once',()=>{let leaf=wrap('<rect width="9" height="9"/>');for(let level=0;level<3;level++){const image=`<image href="data:image/svg+xml;base64,${btoa(leaf)}" width="9" height="9"/>`;leaf=wrap(image.repeat(12));}const r=timed(8000,()=>parseEditableSvg(leaf,'Fan',{x:0,y:0}));expect(codes(r)).toContain('image-unsupported');expect(r.nodes.length).toBeLessThan(20000);});
 it('refuses a layer bomb nested in an image cleanly',()=>{const bomb=wrap([...Array.from({length:14},(_,i)=>`<g id="a${i}"><use href="#a${i+1}"/><use href="#a${i+1}"/></g>`),'<rect id="a14" width="1" height="1"/>'].join('').replace(/^/,'<defs>')+'</defs><use href="#a0"/>'),image=`<image href="data:image/svg+xml;base64,${btoa(bomb)}" width="9" height="9"/>`,r=timed(8000,()=>parse(image.repeat(30)));expect(codes(r)).toContain('image-unsupported');});
});
describe('missing fonts',()=>{
 it('falls to the browser default unless the file names a generic',()=>{const r=parse('<text y="9" font-family="NoSuchFamily">A</text><text y="19" font-family="NoSuchFamily, sans-serif">B</text><text y="29" font-family="NoSuchFamily, system-ui, sans-serif">C</text>'),texts=r.nodes.filter(n=>n.type==='text');expect(texts[0].fontFallbacks).toEqual(['serif']);expect(texts[1].fontFallbacks).toEqual(['sans-serif']);expect(texts[2].fontFallbacks).toBeUndefined();});
});
