import {download} from './files';
import {useEditor} from './store';
import {getWorkspacePreferences} from './workspace-preferences';
interface SavePicker {showSaveFilePicker?:(options:{suggestedName:string})=>Promise<{createWritable:()=>Promise<{write:(data:Blob)=>Promise<void>;close:()=>Promise<void>;abort?:()=>Promise<void>}>}>;}
const picker=()=>(window as unknown as SavePicker).showSaveFilePicker;
/** The Mac app always uses its own save panel, so this choice only exists where a browser offers a picker. */
export const exportPickerAvailable=()=>!window.desktop&&typeof picker()==='function';
/** A cancelled picker reports no delivery. An expired user gesture falls back visibly to browser downloads. */
export async function deliverExport(name:string,data:Blob):Promise<boolean>{
 if(getWorkspacePreferences().exportDestination!=='ask'||!exportPickerAvailable())return download(name,data);
 let writable:Awaited<ReturnType<Awaited<ReturnType<NonNullable<SavePicker['showSaveFilePicker']>>>['createWritable']>>|undefined;
 try{const handle=await picker()!({suggestedName:name});writable=await handle.createWritable();await writable.write(data);await writable.close();return true;}
 catch(e){await writable?.abort?.().catch(()=>{});const reason=e instanceof DOMException?e.name:'';if(reason==='AbortError')return false;if(reason==='SecurityError'||reason==='NotAllowedError'){const saved=await download(name,data);useEditor.getState().set({toast:'The save prompt was unavailable, so this export went to browser downloads.'});return saved;}throw e;}
}
