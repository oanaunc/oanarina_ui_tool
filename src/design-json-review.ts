import {captureColorContext,sameColorContext} from './color-edit-context';
import {useEditor} from './store';
import type {FigImportResult} from './fig-import';
export interface DesignJsonReview {result:FigImportResult;origin:ReturnType<typeof captureColorContext>;valid:boolean;applying:boolean;resolve:(value:DesignJsonReview|null)=>void;dispose:()=>void;}
let pending:DesignJsonReview|undefined;
export const getDesignJsonReview=()=>pending;
export function cancelDesignJsonReview(expected:DesignJsonReview){if(pending!==expected)return;pending=undefined;expected.dispose();expected.resolve(null);if(useEditor.getState().modal==='design-json-review')useEditor.getState().set({modal:null});}
export function checkDesignJsonReview(expected:DesignJsonReview){if(pending!==expected||!expected.valid||!sameColorContext(expected.origin,useEditor.getState()))throw new DOMException('Design JSON import review changed.','AbortError');}
export function confirmDesignJsonReview(expected:DesignJsonReview){checkDesignJsonReview(expected);if(expected.applying)return;expected.applying=true;expected.resolve(expected);}
export function finishDesignJsonReview(expected:DesignJsonReview){if(pending!==expected)return;pending=undefined;expected.dispose();}
export function requestDesignJsonReview(result:FigImportResult){if(pending)cancelDesignJsonReview(pending);return new Promise<DesignJsonReview|null>(resolve=>{const s=useEditor.getState();let off=()=>{};const request:DesignJsonReview={result,origin:captureColorContext({...s,modal:'design-json-review'}),valid:true,applying:false,resolve,dispose(){request.valid=false;off();}};pending=request;off=useEditor.subscribe(live=>{if(!sameColorContext(request.origin,live))cancelDesignJsonReview(request);});s.set({modal:'design-json-review'});});}
