import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import fs from 'node:fs/promises';
import {blankDocument,node} from '../../src/model';
import type {DesignDocument} from '../../src/model';

function fixture(){const doc=blankDocument();doc.name='Description fixture';doc.pages[0].nodes=[node('rectangle',{name:'Unchanged shape',x:123,y:45})];return doc;}
async function open(page:Page,doc=fixture()){await page.addInitScript(d=>localStorage.setItem('oui-active',JSON.stringify(d)),doc);await page.goto('/');await expect(page.getByRole('treeitem',{name:'Unchanged shape',exact:true})).toBeVisible();return doc;}
async function info(page:Page){await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'File information…',exact:true}).click();await expect(page.getByRole('dialog',{name:'File information',exact:true})).toBeVisible();return page.getByRole('textbox',{name:'File description',exact:true});}
async function save(page:Page){await page.locator('svg.canvas').focus();const pending=page.waitForEvent('download');await page.keyboard.press('Meta+s');const path=await(await pending).path();return fs.readFile(path!,'utf8');}
async function openFile(page:Page,doc:unknown){const chooser=page.waitForEvent('filechooser');await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:/^Open project…/}).click();await(await chooser).setFiles({name:'description.oui',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});}

test('File information and Actions are reachable, show real read-only facts and do not edit project/history',async({page})=>{
 const doc=await open(page),before=await save(page);const field=await info(page);await expect(field).toBeFocused();await expect(field).toHaveValue('');await expect(page.getByRole('textbox',{name:'Project ID',exact:true})).toHaveValue(doc.id);await expect(page.getByRole('textbox',{name:'Project ID',exact:true})).toHaveAttribute('readonly','');for(const text of ['Description fixture','Design','.oui · version 2','Pages1','Layers1'])await expect(page.locator('.file-information-facts')).toContainText(text);await expect(page.getByRole('button',{name:'Save description',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await save(page)).toBe(before);await page.keyboard.press('Meta+z');expect(await save(page)).toBe(before);
 await page.keyboard.press('Meta+k');await page.getByRole('combobox',{name:'Search actions',exact:true}).fill('File information');await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'File information'})).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();
});

test('literal multiline description saves with one undo, portable open and recovery reload',async({page})=>{
 const doc=await open(page),text='Release notes 🪷\n<script>literal, not HTML</script>\nhttps://example.com remains plain text';let field=await info(page);await field.fill(text);await expect(page.locator('.file-information script,.file-information a')).toHaveCount(0);await page.getByRole('button',{name:'Save description',exact:true}).click();let saved=JSON.parse(await save(page)) as DesignDocument;expect(saved.description).toBe(text);expect(saved.id).toBe(doc.id);expect(saved.pages).toEqual(doc.pages);
 await page.keyboard.press('Meta+z');field=await info(page);await expect(field).toHaveValue('');await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+Shift+z');field=await info(page);await expect(field).toHaveValue(text);await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:/^New design file/}).click();await expect(page.locator('.layer-row')).toHaveCount(0);await openFile(page,saved);await expect(page.getByRole('treeitem',{name:'Unchanged shape',exact:true})).toBeVisible();field=await info(page);await expect(field).toHaveValue(text);await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.waitForTimeout(850);await page.reload();await expect(page.getByRole('treeitem',{name:'Unchanged shape',exact:true})).toBeVisible();field=await info(page);await expect(field).toHaveValue(text);
});

test('Clear requires Save, Cancel/Escape discard drafts, and empty saving removes the optional field with undo',async({page})=>{
 const doc=fixture();doc.description='Keep this description';await open(page,doc);const before=await save(page);let field=await info(page);await page.getByRole('button',{name:'Clear description',exact:true}).click();await expect(field).toHaveValue('');await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await save(page)).toBe(before);
 field=await info(page);await field.fill('Discard my draft');await field.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);expect(await save(page)).toBe(before);
 field=await info(page);await field.fill(' \n\t ');await page.getByRole('button',{name:'Save description',exact:true}).click();expect(JSON.parse(await save(page))).not.toHaveProperty('description');await page.keyboard.press('Meta+z');expect(JSON.parse(await save(page)).description).toBe(doc.description);await page.keyboard.press('Meta+Shift+z');expect(JSON.parse(await save(page))).not.toHaveProperty('description');
});

test('UI length cap and invalid imported metadata cannot mutate the current project',async({page})=>{
 const doc=await open(page),field=await info(page);await expect(field).toHaveAttribute('maxlength','10000');await field.fill('x'.repeat(10000));await page.getByRole('button',{name:'Save description',exact:true}).click();let good=JSON.parse(await save(page));expect(good.description).toHaveLength(10000);const before=await save(page);
 for(const value of [null,'x'.repeat(10001),'bad\0text']){await openFile(page,{...doc,description:value});await expect(page.locator('.toast')).toContainText('File description must be plain text');expect(await save(page)).toBe(before);}
});


test('restoring an older named snapshot removes newer optional description and one undo restores it',async({page})=>{
 await open(page);await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'Save a named version…',exact:true}).click();await page.getByRole('textbox',{name:'Version name',exact:true}).fill('Before description');await page.getByRole('button',{name:'Save local version',exact:true}).click();await expect(page.getByRole('dialog',{name:'Version history'})).toBeVisible();await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 const field=await info(page);await field.fill('After snapshot');await page.getByRole('button',{name:'Save description',exact:true}).click();await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'Version history',exact:true}).click();await page.getByRole('button',{name:'Restore',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(JSON.parse(await save(page))).not.toHaveProperty('description');await page.keyboard.press('Meta+z');expect(JSON.parse(await save(page)).description).toBe('After snapshot');
});


test('imported CRLF/CR and whitespace metadata stay byte-identical until explicit edit or Clear',async({page})=>{
 const doc=fixture();doc.description='First\r\nSecond\rThird';await open(page,doc);const before=await save(page);let field=await info(page);await expect(field).toHaveValue('First\nSecond\nThird');await expect(page.getByRole('button',{name:'Save description',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await save(page)).toBe(before);
 for(const text of ['  \t\r\n','']){await openFile(page,{...doc,description:text});await expect.poll(async()=>JSON.parse(await save(page)).description).toBe(text);field=await info(page);await expect(page.getByRole('button',{name:'Save description',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Clear description',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Clear description',exact:true}).click();await expect(page.getByRole('button',{name:'Save description',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Save description',exact:true}).click();expect(JSON.parse(await save(page))).not.toHaveProperty('description');await page.keyboard.press('Meta+z');expect(JSON.parse(await save(page)).description).toBe(text);}
});
