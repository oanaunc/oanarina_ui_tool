import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFigmaMock} from '../helpers/figma-mock';
import {parseDocument} from '../../src/model';
import {openTextOptions} from './inspector-helpers';

test('the downloadable bridge archive contains the current component transfer implementation',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Transfer from Figma',exact:true}).click();
 const download=page.waitForEvent('download');await page.getByRole('link',{name:'Download plugin',exact:true}).click();
 const path=(await (await download).path())!;
 const packaged=execFileSync('/usr/bin/unzip',['-p',path,'figma-plugin/code.js'],{encoding:'utf8'});
 expect(packaged).toBe(await fs.readFile('figma-plugin/code.js','utf8'));
 const guide=execFileSync('/usr/bin/unzip',['-p',path,'figma-plugin/README.md'],{encoding:'utf8'});
 expect(guide).toContain('are not real Figma component acceptance');
 expect(guide).toContain('https://www.oanarinaldi.com/ui-tool-guide.html#canvas-backgrounds');
 expect(guide).not.toContain('https://github.com/oanaunc/oanarina_ui_tool');
});

test('a mock-API exported instance opens through the bridge UI, survives source edits, override reset and portable saving',async({page})=>{
 const mock=createFigmaMock(),api=mock.api,main=api.createComponent(),label=api.createText();
 main.name='Main button';main.appendChild(label);label.name='Caption';label.characters='Original';
 const inherited=main.createInstance(),custom=main.createInstance();inherited.name='Inherited button';inherited.x=300;custom.name='Custom button';custom.x=600;custom.children[0].characters='Personal';
 const exported=await mock.exportDocument('page');expect(exported.type).toBe('exported');
 const document=parseDocument(JSON.stringify(exported.data)),copy=document.pages[0].nodes.find(n=>n.sourceId===label.id&&n.instanceRootId===custom.id)!;
 await page.goto('/');await page.getByRole('button',{name:'Transfer from Figma',exact:true}).click();
 const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Import from Figma',exact:true}).click();
 await (await chooser).setFiles({name:'Component API-contract fixture.oui',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(document))});
 await expect(page.locator(`[data-layer-id="${label.id}"]`)).toBeVisible();await page.locator(`[data-layer-id="${label.id}"]`).click();
 await openTextOptions(page);const content=page.getByRole('textbox',{name:'Text content',exact:true});await content.fill('Edited main');await content.press('Tab');
 const inheritedCopy=document.pages[0].nodes.find(n=>n.sourceId===label.id&&n.instanceRootId===inherited.id)!;
 await page.locator(`[data-layer-id="${inheritedCopy.id}"]`).click();await expect(content).toHaveValue('Edited main');
 await page.locator(`[data-layer-id="${copy.id}"]`).click();await expect(content).toHaveValue('Personal');
 await page.getByRole('button',{name:'Reset this layer',exact:true}).click();await expect(content).toHaveValue('Edited main');
 const download=page.waitForEvent('download');await page.keyboard.press('Meta+s');
 const saved=parseDocument(await fs.readFile((await (await download).path())!,'utf8'));
 expect(saved.pages[0].nodes.find(n=>n.id===copy.id)).toMatchObject({sourceId:label.id,instanceRootId:custom.id,text:'Edited main',overrideKeys:[]});
});
