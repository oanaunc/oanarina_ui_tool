import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {blankDocument,node} from '../../src/model';

test('page backgrounds edit persist inherit hide reset undo and stay outside artwork export',async({page})=>{
 const doc=blankDocument();doc.pages[0].nodes=[node('rectangle',{name:'Export shape',fill:'#123456'})];
 await page.addInitScript(d=>localStorage.setItem('oui-active',JSON.stringify(d)),doc);await page.goto('/');
 const hex=page.getByRole('textbox',{name:'Canvas background hex',exact:true});await expect(hex).toBeVisible();await hex.fill('#ff0080');await hex.press('Tab');
 await expect(page.locator('.canvas-wrap')).toHaveCSS('background-image','linear-gradient(rgb(255, 0, 128), rgb(255, 0, 128))');
 const opacity=page.getByRole('spinbutton',{name:'Canvas background opacity %',exact:true});await opacity.fill('25');await opacity.press('Tab');
 await expect(page.locator('.canvas-wrap')).toHaveCSS('background-image','linear-gradient(rgba(255, 0, 128, 0.25), rgba(255, 0, 128, 0.25))');
 await page.getByRole('button',{name:'Add page',exact:true}).click();await expect(hex).toHaveValue('#ff0080');await expect(opacity).toHaveValue('25');
 await page.getByRole('checkbox',{name:'Show canvas background',exact:true}).uncheck();await expect(page.locator('.canvas-wrap')).toHaveCSS('background-image','none');
 await page.getByRole('button',{name:'Use theme background',exact:true}).click();await expect(opacity).toHaveValue('100');
 await page.getByRole('menuitem',{name:'Edit',exact:true}).click();await page.getByRole('menuitem',{name:/^Undo/}).click();await expect(opacity).toHaveValue('25');await expect(page.getByRole('checkbox',{name:'Show canvas background',exact:true})).not.toBeChecked();
 await page.getByRole('button',{name:/Page 1/}).click();await expect(page.locator('.canvas-wrap')).not.toHaveCSS('background-image','none');
 let download=page.waitForEvent('download');await page.keyboard.press('Meta+s');const saved=JSON.parse(await fs.readFile((await (await download).path())!,'utf8'));
 expect(saved.pages.map((p:any)=>p.background)).toEqual([{color:'#ff0080',opacity:.25,visible:true},{color:'#ff0080',opacity:.25,visible:false}]);
 download=page.waitForEvent('download');await page.getByRole('button',{name:'Export page',exact:true}).click();const svg=await fs.readFile((await (await download).path())!,'utf8');expect(svg).toContain('#123456');expect(svg).not.toContain('#ff0080');
 await fs.mkdir('build/screenshots',{recursive:true});await hex.scrollIntoViewIfNeeded();await page.screenshot({path:'build/screenshots/canvas-background.png'});
});
