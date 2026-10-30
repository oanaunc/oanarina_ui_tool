import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
/** Permanent invalidation includes away/back source or editor transitions. */
export function captureVersionAction(modal='history'){
 const origin=captureColorContext(useEditor.getState()),controller=new AbortController();let valid=origin.modal===modal&&!origin.home&&!origin.uiHidden&&!origin.motionOpen;
 if(!valid)throw Error('Open local version history with Motion closed before changing saved versions.');
 const stop=useEditor.subscribe(live=>{if(!sameColorContext(origin,live)){valid=false;controller.abort();}});
 return {origin,signal:controller.signal,check(){const live=useEditor.getState();if(!valid||!sameColorContext(origin,live))throw Error('The version target changed. Reopen version history and review again.');return live;},dispose(){valid=false;controller.abort();stop();}};
}
