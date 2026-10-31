import { test, expect } from '@playwright/test';
import { figZip, figCanvas, encodeSchema, fixtureSchema } from '../helpers/fig-fixture';

test.beforeEach(async({page})=>{
  // Also apply to the worker response: executable schema compilation would be blocked.
  await page.route('**/*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,headers:{...response.headers(),'Content-Security-Policy':"default-src 'self'; script-src 'self'; worker-src 'self'; connect-src 'none'"}});
  });
  await page.goto('/tests/fixtures/fig-decoder.html');
});
test('production worker decodes synthetic archive offline under no-eval CSP and preserves input bytes',async({page})=>{
  const remote:string[]=[];page.on('request',r=>{if(!r.url().startsWith(new URL(page.url()).origin))remote.push(r.url());});
  const bytes=figZip({zstd:true});
  await page.getByLabel('Design file').setInputFiles({name:'synthetic.fig',mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});
  await page.getByRole('button',{name:'Decode',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Synthetic café');
  const result=JSON.parse(await page.getByRole('status').innerText());
  expect(result).toMatchObject({version:106,retainedInput:bytes.length});expect(result.message.nodeChanges[0].unsigned64).toBe('18446744073709551615');expect(result.images).toHaveLength(1);expect(remote).toEqual([]);
});
test('hostile embedded schema and corrupt archives are rejected in the worker without executing names',async({page})=>{
  const definitions=structuredClone(fixtureSchema);definitions[2].fields[0].name='__proto__';
  for(const bytes of [figCanvas({schema:encodeSchema(definitions)}),figZip().subarray(0,40)]){
    await page.getByLabel('Design file').setInputFiles({name:'unsafe.fig',mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});
    await page.getByRole('button',{name:'Decode',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Error:');
  }
  expect(await page.evaluate(()=>Object.prototype.hasOwnProperty.call(Object.prototype,'polluted'))).toBe(false);
});
test('cancel terminates pending decoding and a later import still succeeds',async({page})=>{
  await page.getByLabel('Design file').setInputFiles({name:'cancel.fig',mimeType:'application/octet-stream',buffer:Buffer.from(figZip({zstd:true}))});
  // The real clicks share a task boundary before the newly spawned worker can reply.
  await page.evaluate(()=>{(document.querySelector('#decode') as HTMLButtonElement).click();(document.querySelector('#cancel') as HTMLButtonElement).click();});
  await expect(page.getByRole('status')).toContainText('AbortError');
  await page.getByRole('button',{name:'Decode',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Synthetic café');
});
