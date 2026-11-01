import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {blankDocument,node} from '../../src/model';
import {createPaint} from '../../src/paints';
import {openMoreOptions} from './inspector-helpers';

test('explicit contrast pair checks thresholds and alpha without modifying the design',async({page})=>{
 const doc=blankDocument(),text=node('text',{name:'Contrast label',text:'Accessible colors',fill:'#777777'});doc.pages[0].nodes=[text];
 await page.addInitScript(d=>localStorage.setItem('oui-active',JSON.stringify(d)),doc);await page.goto('/');
 const checker=page.locator('.contrast-checker');await checker.locator('summary').click();
 await checker.getByRole('textbox',{name:'Foreground hex',exact:true}).fill('#000000');
 await expect(checker.getByLabel('Contrast ratio',{exact:true})).toHaveText('21.000:1');
 await expect(checker.locator('.contrast-results')).toContainText('Normal text AAA · 7:1Pass');
 await checker.getByRole('textbox',{name:'Foreground hex',exact:true}).fill('#777777');
 await expect(checker.getByLabel('Contrast ratio',{exact:true})).toHaveText('4.478:1');
 await expect(checker.locator('.contrast-results>div').first()).toHaveText('Normal text AA · 4.5:1Fail');
 await checker.getByRole('textbox',{name:'Foreground hex',exact:true}).fill('#000000');
 await checker.getByRole('spinbutton',{name:'Contrast foreground opacity',exact:true}).fill('50');
 await expect(checker.getByLabel('Contrast ratio',{exact:true})).toHaveText('3.977:1');
 await checker.getByRole('textbox',{name:'Foreground hex',exact:true}).fill('#zzzzzz');
 await expect(checker.getByRole('alert')).toBeVisible();await expect(checker.getByLabel('Contrast ratio',{exact:true})).toHaveCount(0);
 await checker.getByRole('textbox',{name:'Foreground hex',exact:true}).press('Tab');
 await expect(checker.getByRole('textbox',{name:'Foreground hex',exact:true})).toHaveValue('#000000');
 const download=page.waitForEvent('download');await page.keyboard.press('Meta+s');const saved=JSON.parse(await fs.readFile((await (await download).path())!,'utf8'));
 expect(saved.pages[0].nodes).toEqual(doc.pages[0].nodes);
});

test('paint values can be copied explicitly and complex paints are not misrepresented as an audit',async({page})=>{
 const doc=blankDocument(),solid=node('rectangle',{name:'Solid paint',paints:[{...createPaint('#000000'),opacity:.5}]}),gradient=node('rectangle',{name:'Gradient paint',x:300,paints:[createPaint('#ff0000','linear')]});doc.pages[0].nodes=[solid,gradient];
 await page.addInitScript(d=>localStorage.setItem('oui-active',JSON.stringify(d)),doc);await page.goto('/');await page.locator(`[data-layer-id="${solid.id}"]`).click();await openMoreOptions(page);
 const checker=page.locator('.contrast-checker');await checker.locator('summary').click();await checker.getByRole('button',{name:'Use selected paint',exact:true}).click();
 await expect(checker.getByRole('spinbutton',{name:'Contrast foreground opacity',exact:true})).toHaveValue('50');
 await expect(checker.getByLabel('Contrast ratio',{exact:true})).toHaveText('3.977:1');
 await page.locator(`[data-layer-id="${gradient.id}"]`).click();await expect(checker.getByRole('button',{name:'Use selected paint',exact:true})).toBeDisabled();
 await expect(checker).toContainText('Canvas backgrounds, group opacity, blends, effects, strokes and rich text are not sampled.');
 await checker.scrollIntoViewIfNeeded();await fs.mkdir('build/screenshots',{recursive:true});await page.screenshot({path:'build/screenshots/contrast-checker.png'});
});
