import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import {readVideoAsset} from './video-asset';
import {addEmbeddedVideo} from './media-workflows';
import {notifyError,pickFile} from './files';
export async function importVideoFile(file:File){const before=captureColorContext(useEditor.getState());if(before.home||before.modal||before.motionOpen||before.doc.workspace==='slides')throw Error('Open a Design or Whiteboard canvas and close dialogs and Motion before placing video.');const controller=new AbortController(),off=useEditor.subscribe(s=>{if(!sameColorContext(before,s))controller.abort();});try{const media=await readVideoAsset(file,controller.signal);if(!sameColorContext(before,useEditor.getState()))throw Error('The video target changed during decoding. Place it again.');off();let id='';useEditor.getState().edit(d=>{id=addEmbeddedVideo(d,before.pageId,media,file.name);});useEditor.getState().set({selection:[id],toast:'Video embedded. Static exports use its saved poster frame.'});}finally{off();}}
export function chooseVideo(){pickFile('video/mp4,video/webm',files=>importVideoFile(files[0]).catch(notifyError));}
