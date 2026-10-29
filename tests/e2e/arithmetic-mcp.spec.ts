import {test,expect} from '@playwright/test';
test('inspector arithmetic validates, clamps, nudges and persists with undo',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'New design file',exact:true}).click();await page.getByRole('button',{name:'Rectangle tool',exact:true}).click();await page.mouse.move(450,300);await page.mouse.down();await page.mouse.move(600,400);await page.mouse.up();
 const width=page.getByRole('spinbutton',{name:'W',exact:true});await width.fill('(40 + 20) * 3');await width.press('Enter');await expect(width).toHaveValue('180');
 await width.fill('/2');await width.press('Enter');await expect(width).toHaveValue('90');await width.fill('1 / 0');await width.press('Enter');await expect(width).toHaveValue('90');await expect(width).toHaveAttribute('aria-invalid','true');
 await width.fill('-30');await width.press('Enter');await expect(width).toHaveValue('1');await width.focus();await width.press('Shift+ArrowUp');await width.press('Enter');await expect(width).toHaveValue('11');
 await width.fill('999');await width.press('Escape');await width.press('Tab');await expect(width).toHaveValue('11');
 await page.locator('[data-canvas]').click({position:{x:20,y:20}});await page.keyboard.press('Meta+z');await page.locator('.layer-row').filter({hasText:'Rectangle'}).click();await expect(width).toHaveValue('1');
 await page.waitForTimeout(800);await page.reload();await page.locator('.layer-row').filter({hasText:'Rectangle'}).click();await expect(width).toHaveValue('1');
});
test('MCP setup is reachable and downloads a standalone server',async({page})=>{
 await page.goto('/');await page.getByRole('menuitem',{name:'Resources',exact:true}).click();await page.getByRole('menuitem',{name:'Free local MCP automation…',exact:true}).click();await expect(page.getByRole('heading',{name:'Free local MCP automation',exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'MCP server path'}).fill('/Users/example/Oanarina/server.mjs');await page.getByRole('textbox',{name:'MCP project path'}).fill('/Users/example/Design.oui');const config=JSON.parse(await page.locator('.mcp-setup pre').innerText());expect(config.mcpServers['oanarina-ui'].args).toEqual(['/Users/example/Oanarina/server.mjs','--project','/Users/example/Design.oui']);
 const download=page.waitForEvent('download');await page.getByRole('link',{name:'Download Oanarina MCP',exact:true}).click();expect((await download).suggestedFilename()).toBe('oanarina-mcp.zip');await expect(page.getByText(/Live synchronization with the editor is still being built/)).toBeVisible();
});
