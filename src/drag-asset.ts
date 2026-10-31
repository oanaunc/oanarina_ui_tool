/** WebKit turns a dragged export preview into a real file promise, but a blob image has no file name of its own.
 * The shell asks for this name when the drag starts, so no renderer message is added. */
let name='';
export const rememberDragAsset=(next:string)=>{name=next;};
export const dragAssetName=()=>name;
