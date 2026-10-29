import {test,expect} from '@playwright/test';
import {blankDocument,node} from '../../src/model';
for(const activeFirst of [true,false])test(`migrates the newest recovery copy independently of legacy key order (${activeFirst?'active first':'active last'})`,async({page})=>{
 const recent=blankDocument();recent.name='Newest recovery';recent.updatedAt='2026-10-29T12:00:00.000Z';recent.pages[0].nodes=[node('rectangle',{name:'Newest recovery rectangle'})];
 const stale=structuredClone(recent);stale.name='Stale recent file';stale.updatedAt='2026-10-28T12:00:00.000Z';stale.pages[0].nodes[0].name='Stale rectangle';
 await page.addInitScript(({recent,stale,activeFirst})=>{if(localStorage.getItem('review-fixture'))return;const copies: [string,unknown][]=[['oui-active',recent],['oui-doc-'+stale.id,stale]];if(!activeFirst)copies.reverse();for(const [key,value] of copies)localStorage.setItem(key,JSON.stringify(value));localStorage.setItem('review-fixture','true');},{recent,stale,activeFirst});
 await page.goto('/');await expect(page.locator('.layer-name').getByText('Newest recovery rectangle',{exact:true})).toBeVisible();await expect(page.locator('.layer-name').getByText('Stale rectangle',{exact:true})).toHaveCount(0);
 await page.reload();await expect(page.locator('.layer-name').getByText('Newest recovery rectangle',{exact:true})).toBeVisible();
});
test('caps named snapshots transactionally when saves overlap @development-module',async({page})=>{
 const doc=blankDocument();await page.goto('/');
 const snapshots=await page.evaluate(async doc=>{const repository=await import('/src/repository.ts');await Promise.all(Array.from({length:25},(_,i)=>repository.saveSnapshot(doc,'Version '+i)));return repository.listSnapshots(doc.id);},doc);
 expect(snapshots).toHaveLength(20);expect(new Set(snapshots.map((s:{id:string})=>s.id)).size).toBe(20);
});
