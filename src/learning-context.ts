import {captureColorContext,sameColorContext} from './color-edit-context';
import {useEditor} from './store';
import {getPreferences,subscribePreferences} from './preferences';
export function learningContext(){const s=useEditor.getState();return {editor:captureColorContext(s),tool:s.tool,leftTab:s.leftTab,uiScale:getPreferences().uiScale};}
export type LearningContext=ReturnType<typeof learningContext>;
export function sameLearningContext(context:LearningContext){const s=useEditor.getState();return sameColorContext(context.editor,s)&&s.tool===context.tool&&s.leftTab===context.leftTab&&getPreferences().uiScale===context.uiScale;}
/** A permanent source receipt. Callers own disposal and local-choice tickets separately. */
export function captureLearningSession(onInvalid?:()=>void){const context=learningContext();let valid=true;const check=()=>{if(valid&&!sameLearningContext(context)){valid=false;onInvalid?.();}},a=useEditor.subscribe(check),b=subscribePreferences(check);return {context,current:()=>valid&&sameLearningContext(context),dispose:()=>{valid=false;a();b();}};}
/** A tour may close its own dialog, but any other observed departure still refuses. */
export function closeLearningForTour(start:()=>void){const origin=learningContext();if(origin.editor.modal!=='learning')throw Error('Open Learning before starting the canvas tour.');let valid=true;const expected={...origin,editor:{...origin.editor,modal:null}},check=()=>{if(!sameLearningContext(expected))valid=false;},a=useEditor.subscribe(check),b=subscribePreferences(check);try{useEditor.getState().set({modal:null});if(!valid||!sameLearningContext(expected))throw Error('The canvas context changed. Open Learning again.');start();}finally{a();b();}}
