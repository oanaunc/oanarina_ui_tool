import {captureColorContext,sameColorContext} from './color-edit-context';
import {useEditor} from './store';
import {beginImportTask} from './import-task';
import type {ImportFormat} from './import-task';
/** Store subscriptions invalidate permanently, including away-and-back transitions. */
export function beginImportSession(format:ImportFormat,files:number,bytes:number){const origin=captureColorContext(useEditor.getState()),task=beginImportTask(format,files,bytes);let disposed=false;const off=useEditor.subscribe(live=>{if(!sameColorContext(origin,live))task.abort();});return {origin,task,check(){task.check();if(disposed||!sameColorContext(origin,useEditor.getState()))throw new DOMException('Import target changed.','AbortError');return useEditor.getState();},dispose(){if(!disposed){disposed=true;off();}}};}
