import {test,expect} from '@playwright/test';
test('focusing and blurring an arithmetic result preserves full precision and undo history',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'New design file',exact:true}).click();await page.getByRole('button',{name:'Rectangle tool',exact:true}).click();await page.mouse.move(450,300);await page.mouse.down();await page.mouse.move(600,400);await page.mouse.up();
 const x=page.getByRole('spinbutton',{name:'X',exact:true}),original=await x.inputValue();await x.fill('1/3');await x.press('Enter');await expect(x).toHaveValue('0.333333');
 await x.focus();await x.press('Tab');await expect(x).toHaveValue('0.333333');
 await page.locator('[data-canvas]').click({position:{x:20,y:20}});await page.keyboard.press('Meta+z');await page.locator('.layer-row').filter({hasText:'Rectangle'}).click();await expect(x).toHaveValue(original);
});
