import type {FileChooser,Page} from '@playwright/test';
type ProjectFile=Parameters<FileChooser['setFiles']>[0];
/** Opening parses the file in a worker, so the previous document stays live for a moment. This returns once the chosen project has replaced it, with fresh history. */
export async function chooseProject(page:Page,chooser:Promise<FileChooser>,file:ProjectFile){await page.evaluate(async()=>{const path='/src/store.ts',{useEditor}=await import(path),w=window as any,doc=useEditor.getState().doc;w.projectOpened=false;const off=useEditor.subscribe((s:any)=>{if(s.doc===doc||s.past.length||s.future.length)return;w.projectOpened=true;off();});});await(await chooser).setFiles(file);await page.waitForFunction(()=>(window as any).projectOpened);}
