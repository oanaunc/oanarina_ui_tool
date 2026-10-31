import {test, expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {blankDocument, node} from '../../src/model';
import type {DesignDocument} from '../../src/model';
import {setKeyframe} from '../../src/motion';
function fixture() {
  const d = blankDocument(); d.fonts = [];
  d.pages[0].nodes = [node('frame', {id: 'parent', name: 'Comparison frame', x: 100, y: 100, width: 400, height: 300}), node('rectangle', {id: 'a', name: 'Selected card', parentId: 'parent', x: 130, y: 140, width: 80, height: 60}), node('rectangle', {id: 'b', name: 'Other card', x: 600, y: 150, width: 120, height: 80})];
  return d;
}
async function open(page: Page, d: DesignDocument = fixture(), mock = false) {
  const saves: string[] = []; await page.exposeFunction('spacingSave', (raw: string) => {saves.push(raw); return true;});
  await page.addInitScript(({d, mock}) => {const w = window as any; w.desktop = {bootstrap: async () => ({kind: 'file', raw: JSON.stringify(d)}), ready: async () => true, reportDocument: async () => true, fonts: async () => [], save: async (_n: string, raw: string) => w.spacingSave(raw), onCommand: () => () => {}, onDocument: () => () => {}}; if (mock) {w.spacingWrites = []; Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: async (text: string) => {w.spacingWrites.push(text);}}});}}, {d, mock});
  await page.goto('/'); await expect(page.locator('svg.canvas')).toBeVisible(); return saves;
}
async function inspect(page: Page, name = 'Selected card') {await page.getByRole('treeitem', {name, exact: true}).click(); await page.getByRole('button', {name: 'Inspect', exact: true}).click(); await expect(page.getByRole('region', {name: 'Spacing inspection'})).toBeVisible();}
async function snapshot(page: Page) {return page.evaluate(async () => {const p = '/src/store.ts', {useEditor} = await import(p), s = useEditor.getState(); return {doc: s.doc, past: s.past.length};});}
const region = (page: Page) => page.getByRole('region', {name: 'Spacing inspection'});
const row = (page: Page, name: string) => region(page).locator('.spacing-property-row').filter({has: page.getByText(name, {exact: true})});
test('parent comparison shows real box insets, selectable diagram and copied reference without editing or save changes', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']); const saves = await open(page); await inspect(page); const before = await snapshot(page);
  await expect(row(page, 'Bounding-box left inset')).toContainText('30 px'); await expect(row(page, 'Bounding-box top inset')).toContainText('40 px'); await expect(row(page, 'Bounding-box right inset')).toContainText('290 px'); await expect(region(page).getByRole('img', {name: 'Layout-box spacing diagram'})).toBeVisible();
  await page.getByRole('button', {name: 'Copy spacing reference', exact: true}).click(); const text = await page.evaluate(() => navigator.clipboard.readText()); expect(text).toContain('Selected card → Comparison frame'); expect(text).toContain('Bounding-box left inset: 30 px'); expect(text).toContain('exclude strokes');
  expect(await snapshot(page)).toEqual(before); await page.locator('svg.canvas').focus(); await page.keyboard.press('Meta+s'); await expect.poll(() => saves.length).toBe(1); expect(JSON.parse(saves[0]).pages).toEqual(before.doc.pages);
});
test('choosing an independent layer reports directional offsets and genuine axis gap/overlap', async ({page}) => {
  await open(page); await inspect(page); await page.getByLabel('Spacing comparison layer').selectOption({label: 'Other card'});
  await expect(row(page, 'Horizontal gap')).toContainText('390 px'); await expect(row(page, 'Vertical overlap')).toContainText('50 px'); await expect(row(page, 'Left-edge offset')).toContainText('-470 px'); await expect(region(page).getByText('Bounding-box left inset', {exact: true})).toHaveCount(0);
});
test('target search and paging stay bounded and a numeric zero layer identity remains selectable', async ({page}) => {
  const d = fixture(); d.pages[0].nodes.push(node('rectangle', {id: '0', name: 'Zero identity target', x: 900, width: 40}), ...Array.from({length: 125}, (_, i) => node('rectangle', {id: 'target' + i, name: 'Remote target ' + String(i).padStart(3, '0'), visible: false, x: 1200 + i * 10, width: 5})));
  await open(page, d); await inspect(page); await page.getByLabel('Search spacing layers').fill('Remote target'); expect(await page.getByLabel('Spacing comparison layer').locator('option').count()).toBeLessThanOrEqual(102); await page.getByRole('button', {name: 'Next spacing targets'}).click(); await page.getByLabel('Spacing comparison layer').selectOption({label: 'Remote target 124'}); await expect(region(page)).toContainText('Dashed: Remote target 124');
  await page.getByLabel('Search spacing layers').fill('Zero identity'); await page.getByLabel('Spacing comparison layer').selectOption({label: 'Zero identity target'}); await expect(region(page)).toContainText('Dashed: Zero identity target'); await expect(row(page, 'Horizontal gap')).toContainText('690 px');
});
test('sampled versus base Motion spacing matches moved geometry and preserves the saved source', async ({page}) => {
  const d = fixture(); setKeyframe(d.pages[0], 'a', 'x', 0, 130); setKeyframe(d.pages[0], 'a', 'x', 1, 230); await open(page, d); await inspect(page); await page.evaluate(() => window.dispatchEvent(new CustomEvent('command', {detail: 'motion'}))); await page.getByRole('button', {name: 'Selected card x keyframe 2', exact: true}).click();
  await expect(region(page)).toContainText('Sampled Motion at 1.000 s.'); await expect(row(page, 'Bounding-box left inset')).toContainText('130 px'); await page.getByLabel('Inspect value source').selectOption('base'); await expect(row(page, 'Bounding-box left inset')).toContainText('30 px'); expect((await snapshot(page)).doc.pages[0].nodes[1].x).toBe(130);
});
test('retained target/source callbacks refuse and fresh report controls recover without document changes', async ({page}) => {
  await open(page, fixture(), true); await inspect(page); const before = await snapshot(page);
  await page.getByRole('button', {name: 'Copy spacing reference', exact: true}).evaluate(async el => {const k = Object.keys(el).find(k => k.startsWith('__reactProps$'))!, fn = (el as any)[k].onClick, input = document.querySelector('[aria-label="Spacing comparison layer"]')!, p = Object.keys(input).find(k => k.startsWith('__reactProps$'))!, option = [...input.querySelectorAll('option')].find(o => o.textContent === 'Other card')!; (input as any)[p].onChange({target: {value: option.value}}); await fn();});
  await expect(region(page).getByRole('status')).toContainText('source or options changed'); expect(await page.evaluate(() => (window as any).spacingWrites)).toEqual([]);
  await page.getByRole('button', {name: 'Copy spacing reference', exact: true}).evaluate(async el => {const k = Object.keys(el).find(k => k.startsWith('__reactProps$'))!, fn = (el as any)[k].onClick, p = '/src/store.ts', {useEditor} = await import(p); useEditor.getState().set({mode: 'design'}); useEditor.getState().set({mode: 'inspect'}); await fn();});
  expect(await page.evaluate(() => (window as any).spacingWrites)).toEqual([]); await page.getByRole('button', {name: 'Copy spacing reference', exact: true}).click(); expect(await page.evaluate(() => (window as any).spacingWrites.length)).toBe(1); expect(await snapshot(page)).toEqual(before);
});
test('multi-selection defaults to the other selected layer and inspection switching leaves one current section', async ({page}) => {
  await open(page); await page.getByRole('treeitem', {name: 'Selected card', exact: true}).click(); await page.getByRole('treeitem', {name: 'Other card', exact: true}).click({modifiers: ['Meta']}); await page.getByRole('button', {name: 'Inspect', exact: true}).click(); await expect(region(page)).toContainText('Dashed: Other card'); await page.getByLabel('Inspected selected layer').selectOption('b'); await expect(region(page)).toHaveCount(1); await expect(region(page)).toContainText('Dashed: Selected card'); await expect(row(page, 'Left-edge offset')).toContainText('470 px');
});
test('late clipboard failure cannot update a replacement target and denied copies retain a selectable fallback', async ({page}) => {
  await open(page, fixture(), true); await inspect(page); await page.evaluate(() => {navigator.clipboard.writeText = () => new Promise<void>((_resolve, reject) => {(window as any).finishSpacingCopy = () => reject(Error('Denied'));});}); await page.getByRole('button', {name: 'Copy spacing reference', exact: true}).click(); await page.getByLabel('Spacing comparison layer').selectOption({label: 'Other card'}); await page.evaluate(() => (window as any).finishSpacingCopy()); await expect(region(page).getByRole('status')).toHaveCount(0);
  await page.evaluate(() => {navigator.clipboard.writeText = async () => {throw Error('Denied');};}); await page.getByRole('button', {name: 'Copy spacing reference', exact: true}).click(); await expect(region(page).getByRole('status')).toContainText('Select and copy');
});
test('native Space copies the current report in a short 125% sidebar without panning', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('oui-preferences', JSON.stringify({version: 1, values: {uiScale: 1.25}}))); await page.setViewportSize({width: 1100, height: 620}); await open(page, fixture(), true); await inspect(page); const before = await snapshot(page); await page.getByRole('button', {name: 'Copy spacing reference', exact: true}).focus(); await page.keyboard.press('Space'); await expect.poll(() => page.evaluate(() => (window as any).spacingWrites.length)).toBe(1); expect(await snapshot(page)).toEqual(before);
});

test('retained indexed target selection cannot resolve an old list after search and fresh equal-choice controls recover',async({page})=>{
 const d=fixture();d.pages[0].nodes.push(...Array.from({length:125},(_,i)=>node('rectangle',{id:'remote'+i,name:'Remote '+String(i).padStart(3,'0'),visible:false,x:1000+i*10})));
 await open(page,d,true);await inspect(page);
 await page.getByLabel('Spacing comparison layer').evaluate(el=>{const key=Object.keys(el).find(k=>k.startsWith('__reactProps$'))!,old=(el as any)[key].onChange,input=document.querySelector('[aria-label="Search spacing layers"]')!,p=Object.keys(input).find(k=>k.startsWith('__reactProps$'))!;(input as any)[p].onChange({target:{value:'Remote'}});old({target:{value:'2'}});});
 await expect(region(page)).toContainText('Dashed: Comparison frame');
 await expect(region(page).getByRole('status')).toContainText('source or options changed');
 await page.getByLabel('Spacing comparison layer').selectOption({label:'Remote 000'});await expect(region(page)).toContainText('Dashed: Remote 000');
 await page.getByLabel('Spacing comparison layer').evaluate(el=>{const key=Object.keys(el).find(k=>k.startsWith('__reactProps$'))!;(el as any)[key].onChange({target:{value:(el as HTMLSelectElement).value}});});
 await page.getByRole('button',{name:'Copy spacing reference',exact:true}).click();expect(await page.evaluate(()=>(window as any).spacingWrites.length)).toBe(1);
});

test('the measure selector reaches painted bounds and rotated-parent padding and reports refusals',async({page})=>{await open(page);await inspect(page);const section=page.getByRole('region',{name:'Spacing inspection',exact:true}),measure=section.getByRole('combobox',{name:'Spacing measure',exact:true});await measure.selectOption('painted');await expect(section).not.toContainText('unavailable');await measure.selectOption('parent');await expect(section.getByRole('alert').or(section.getByText('inset',{exact:false}).first())).toBeVisible();await measure.selectOption('box');await expect(section.getByText('Horizontal',{exact:false}).first()).toBeVisible();});
