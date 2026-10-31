import type {Page} from '@playwright/test';
/** Opens a secondary section of the Design tab. One the layer already uses, or one left open, stays as it is. */
export async function openSection(page:Page,name:string){const summary=page.locator('.inspector-more details>summary').filter({hasText:new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first();await summary.waitFor();if(!await summary.evaluate(s=>(s.parentElement as HTMLDetailsElement).open))await summary.click();}
/** Opens the advanced type settings behind the sliders icon in Typography. */
export async function openTextOptions(page:Page){const button=page.getByRole('button',{name:'More text options',exact:true});await button.waitFor();if(await button.getAttribute('aria-expanded')!=='true')await button.click();}
/** The panel shows export settings once a layer has one, so a layer without any gets its default first. */
export async function addExportSetting(page:Page){const first=page.getByRole('group',{name:'Export setting 1',exact:true});if(await first.count())return;await page.getByRole('button',{name:'Add export setting',exact:true}).click();await first.waitFor();}
/** Opens the document colors, style and variable rows behind the style icon of Fill or Typography. */
export async function openStyles(page:Page,name:'Fill styles'|'Text styles'){const button=page.getByRole('button',{name,exact:true}).first();await button.waitFor();if(await button.getAttribute('aria-expanded')!=='true')await button.click();}
/** Opens the chip of a solid fill, which holds its type, order and duplicate controls. */
export async function openFill(page:Page,index=1){const chip=page.getByRole('button',{name:new RegExp(`^Fill ${index} (color picker|settings)$`)}).first();await chip.waitFor();if(await chip.getAttribute('aria-expanded')!=='true')await chip.click();}
