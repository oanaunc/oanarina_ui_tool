import {test, expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {blankDocument, node} from '../../src/model';
import type {DesignDocument} from '../../src/model';
import {createPaint} from '../../src/paints';
import {setKeyframe} from '../../src/motion';

function fixture() {
  const d = blankDocument(); d.fonts = [];
  d.pages[0].nodes = [node('rectangle', {id: 'box', name: 'Native box', x: 80, y: 100, width: 300, height: 120, opacity: .4, paints: [{...createPaint('#123456'), opacity: .5}]}), node('text', {id: 'label', name: 'Native label', x: 480, y: 100, width: 200, height: 80, text: 'Literal private body', fontFamily: 'system-ui', fontSize: 24, lineHeight: 1.5, letterSpacing: 1.2, textAutoSize: 'fixed'})];
  return d;
}
async function open(page: Page, d: DesignDocument = fixture(), mockClipboard = false) {
  const saves: string[] = [];
  await page.exposeFunction('platformSave', (raw: string) => {saves.push(raw); return true;});
  await page.addInitScript(({d, mockClipboard}) => {
    const w = window as any;
    w.desktop = {bootstrap: async () => ({kind: 'file', raw: JSON.stringify(d)}), ready: async () => true, reportDocument: async () => true, fonts: async () => [], save: async (_n: string, raw: string) => w.platformSave(raw), onCommand: () => () => {}, onDocument: () => () => {}};
    if (mockClipboard) {w.platformWrites = []; Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: async (text: string) => {w.platformWrites.push(text);}}});}
  }, {d, mockClipboard});
  await page.goto('/'); await expect(page.locator('svg.canvas')).toBeVisible();
  return saves;
}
async function inspect(page: Page, name = 'Native box') {await page.getByRole('treeitem', {name, exact: true}).click(); await page.getByRole('button', {name: 'Inspect', exact: true}).click(); await expect(page.getByRole('region', {name: 'Native platform properties'})).toBeVisible();}
async function save(page: Page, saves: string[]) {const count = saves.length; await page.locator('svg.canvas').focus(); await page.keyboard.press('Meta+s'); await expect.poll(() => saves.length).toBe(count + 1); return JSON.parse(saves.at(-1)!);}
async function snapshot(page: Page) {return page.evaluate(async () => {const path = '/src/store.ts', {useEditor} = await import(path), s = useEditor.getState(); return {doc: s.doc, past: s.past.length};});}

test('platform choice, density interpretation, real clipboard and search preserve file and Undo', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']); const saves = await open(page); await inspect(page); const before = await snapshot(page), region = page.getByRole('region', {name: 'Native platform properties'});
  await expect(region).toContainText('300 pt'); await expect(region).toContainText('#12345680');
  await page.getByLabel('Inspection platform').selectOption('android'); await page.getByLabel('Canvas units per logical unit').fill('3');
  await expect(region).toContainText('100 dp'); await expect(region).toContainText('#80123456'); await page.getByLabel('Search platform properties').fill('Width');
  await page.getByRole('button', {name: 'Copy platform properties', exact: true}).click(); const copy = await page.evaluate(() => navigator.clipboard.readText());
  expect(copy).toContain('Width: 100 dp'); expect(copy).toContain('Canvas units per dp: 3'); expect(copy).not.toContain('Fill color:'); expect(copy).toContain('Review limits:');
  expect(await snapshot(page)).toEqual(before); expect((await save(page, saves)).pages).toEqual(before.doc.pages);
});
test('text inspection presents baseline sp, em spacing, font limits and excludes literal body from copied references', async ({page}) => {
  await open(page, fixture(), true); await inspect(page, 'Native label'); await page.getByLabel('Inspection platform').selectOption('android'); await page.getByLabel('Canvas units per logical unit').fill('2');
  const region = page.getByRole('region', {name: 'Native platform properties'}); await expect(region).toContainText('12 sp'); await expect(region).toContainText('18 sp'); await expect(region).toContainText('0.05 em'); await expect(region).toContainText('confirm target-platform availability');
  await page.getByRole('button', {name: 'Copy platform properties', exact: true}).click(); const copy = await page.evaluate(() => (window as any).platformWrites[0]); expect(copy).not.toContain('Literal private body'); expect(copy).toContain('font scale 1');
});
test('sampled Motion and base selection use their actual values without changing saved geometry', async ({page}) => {
  const d = fixture(); setKeyframe(d.pages[0], 'box', 'width', 0, 300); setKeyframe(d.pages[0], 'box', 'width', 1, 600);
  const saves = await open(page, d); await inspect(page); await page.evaluate(() => window.dispatchEvent(new CustomEvent('command', {detail: 'motion'}))); await page.getByRole('button', {name: 'Native box width keyframe 2', exact: true}).click();
  const region = page.getByRole('region', {name: 'Native platform properties'}); await expect(region).toContainText('600 pt'); await expect(region).toContainText('Sampled Motion at 1.000 s.');
  await page.getByLabel('Inspect value source').selectOption('base'); await expect(region).toContainText('300 pt'); await expect(region).toContainText('Base document values.'); expect((await save(page, saves)).pages[0].nodes[0].width).toBe(300);
});
test('retained option and source-selection handlers refuse before clipboard transmission and fresh controls recover', async ({page}) => {
  await open(page, fixture(), true); await inspect(page); const before = await snapshot(page);
  await page.getByRole('button', {name: 'Copy platform properties', exact: true}).evaluate(async el => {const k = Object.keys(el).find(k => k.startsWith('__reactProps$'))!, copy = (el as any)[k].onClick, input = document.querySelector('[aria-label="Canvas units per logical unit"]')!, p = Object.keys(input).find(k => k.startsWith('__reactProps$'))!; (input as any)[p].onChange({target: {value: '2'}}); await copy();});
  const region = page.getByRole('region', {name: 'Native platform properties'}); await expect(region.getByRole('status')).toContainText('source or options changed'); expect(await page.evaluate(() => (window as any).platformWrites)).toEqual([]);
  await page.getByRole('button', {name: 'Copy platform properties', exact: true}).evaluate(async el => {const k = Object.keys(el).find(k => k.startsWith('__reactProps$'))!, copy = (el as any)[k].onClick, input = document.querySelector('[aria-label="Inspect value source"]')!, p = Object.keys(input).find(k => k.startsWith('__reactProps$'))!; (input as any)[p].onChange({target: {value: 'base'}}); await copy();});
  await expect(region.getByRole('status')).toContainText('source or options changed'); expect(await page.evaluate(() => (window as any).platformWrites)).toEqual([]);
  await page.getByRole('button', {name: 'Copy platform properties', exact: true}).click(); expect((await page.evaluate(() => (window as any).platformWrites)).length).toBe(1); expect(await snapshot(page)).toEqual(before);
});
test('mode cycles invalidate retained reports and choosing a different selected layer refreshes values', async ({page}) => {
  await open(page, fixture(), true); await page.getByRole('treeitem', {name: 'Native box', exact: true}).click(); await page.getByRole('treeitem', {name: 'Native label', exact: true}).click({modifiers: ['Meta']}); await page.getByRole('button', {name: 'Inspect', exact: true}).click();
  await page.getByRole('button', {name: 'Copy platform properties', exact: true}).evaluate(async el => {const k = Object.keys(el).find(k => k.startsWith('__reactProps$'))!, copy = (el as any)[k].onClick, path = '/src/store.ts', {useEditor} = await import(path); useEditor.getState().set({mode: 'design'}); useEditor.getState().set({mode: 'inspect'}); await copy();});
  expect(await page.evaluate(() => (window as any).platformWrites)).toEqual([]); await page.getByLabel('Inspected selected layer').selectOption('label'); await expect(page.getByRole('region', {name: 'Native platform properties'})).toContainText('24 pt'); await page.getByRole('button', {name: 'Copy platform properties', exact: true}).click(); expect((await page.evaluate(() => (window as any).platformWrites[0]))).toContain('Native label');
});
test('invalid ratios refuse and denied clipboard gives selectable fallback without project edits', async ({page}) => {
  await open(page); await inspect(page); const before = await snapshot(page); await page.getByLabel('Canvas units per logical unit').fill('0'); await expect(page.getByRole('region', {name: 'Native platform properties'}).getByRole('alert')).toContainText('logical unit'); await expect(page.getByRole('button', {name: 'Copy platform properties', exact: true})).toHaveCount(0);
  await page.getByLabel('Canvas units per logical unit').fill('1'); await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: async () => {throw Error('Denied');}}})); await page.getByRole('button', {name: 'Copy platform properties', exact: true}).click(); await expect(page.getByRole('region', {name: 'Native platform properties'}).getByRole('status')).toContainText('Select and copy'); expect(await snapshot(page)).toEqual(before);
});
test('native Space button activation works at 125% UI scale in a short viewport', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('oui-preferences', JSON.stringify({version: 1, values: {uiScale: 1.25}}))); await page.setViewportSize({width: 1100, height: 620}); await open(page, fixture(), true); await inspect(page); const before = await snapshot(page);
  await page.getByRole('button', {name: 'Copy platform properties', exact: true}).focus(); await page.keyboard.press('Space'); await expect.poll(() => page.evaluate(() => (window as any).platformWrites.length)).toBe(1); expect(await snapshot(page)).toEqual(before);
});

for (const failure of [false, true]) test('late clipboard '+(failure?'failure':'success')+' cannot replace status after source/options cycles', async ({page}) => {
  await open(page, fixture(), true); await inspect(page);
  await page.evaluate(() => {const w=window as any;navigator.clipboard.writeText=()=>new Promise<void>((resolve,reject)=>{w.finishPlatformCopy=(failure:boolean)=>failure?reject(Error('Denied')):resolve();});});
  await page.getByRole('button',{name:'Copy platform properties',exact:true}).click();
  await page.getByLabel('Inspect value source').selectOption('base');
  await page.getByLabel('Inspect value source').selectOption('canvas');
  await page.evaluate(failure=>(window as any).finishPlatformCopy(failure),failure);
  await expect(page.getByRole('region',{name:'Native platform properties'}).getByRole('status')).toHaveCount(0);
  await page.evaluate(()=>{navigator.clipboard.writeText=async(text:string)=>{(window as any).platformWrites.push(text);};});
  await page.getByRole('button',{name:'Copy platform properties',exact:true}).click();
  await expect(page.getByRole('region',{name:'Native platform properties'}).getByRole('status')).toContainText('Copied platform');
});

test('same-event source chooser away/back refuses the old receipt and fresh controls recover without unrelated renders',async({page})=>{
 await open(page,fixture(),true);await inspect(page);
 await page.getByRole('button',{name:'Copy platform properties',exact:true}).evaluate(async el=>{const k=Object.keys(el).find(k=>k.startsWith('__reactProps$'))!,copy=(el as any)[k].onClick,input=document.querySelector('[aria-label="Inspect value source"]')!,p=Object.keys(input).find(k=>k.startsWith('__reactProps$'))!,change=(input as any)[p].onChange;change({target:{value:'base'}});change({target:{value:'canvas'}});await copy();});
 expect(await page.evaluate(()=>(window as any).platformWrites)).toEqual([]);
 await page.getByRole('button',{name:'Copy platform properties',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).platformWrites.length)).toBe(1);
});
