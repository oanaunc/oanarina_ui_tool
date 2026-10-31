import {captureColorContext,sameColorContext} from './color-edit-context';
import {useEditor} from './store';
import type {FigImportResult} from './fig-import';
export interface FigmaRestReview {result:FigImportResult;origin:ReturnType<typeof captureColorContext>;valid:boolean;applying:boolean;resolve:(value:FigmaRestReview|null)=>void;dispose:()=>void;}
let pending:FigmaRestReview|undefined;
export const getFigmaRestReview=()=>pending;
export function cancelFigmaRestReview(expected:FigmaRestReview){if(pending!==expected)return;pending=undefined;expected.dispose();expected.resolve(null);if(useEditor.getState().modal==='figma-rest-review')useEditor.getState().set({modal:null});}
export function checkFigmaRestReview(expected:FigmaRestReview){if(pending!==expected||!expected.valid||!sameColorContext(expected.origin,useEditor.getState()))throw new DOMException('REST import review changed.','AbortError');}
export function confirmFigmaRestReview(expected:FigmaRestReview){checkFigmaRestReview(expected);if(expected.applying)return;expected.applying=true;expected.resolve(expected);}
export function finishFigmaRestReview(expected:FigmaRestReview){if(pending!==expected)return;pending=undefined;expected.dispose();}
export function requestFigmaRestReview(result:FigImportResult){if(pending)cancelFigmaRestReview(pending);return new Promise<FigmaRestReview|null>(resolve=>{const s=useEditor.getState();let off=()=>{};const request:FigmaRestReview={result,origin:captureColorContext({...s,modal:'figma-rest-review'}),valid:true,applying:false,resolve,dispose(){request.valid=false;off();}};pending=request;off=useEditor.subscribe(live=>{if(!sameColorContext(request.origin,live))cancelFigmaRestReview(request);});s.set({modal:'figma-rest-review'});});}
