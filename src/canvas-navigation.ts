export interface CanvasCamera {zoom:number;pan:{x:number;y:number};}
export const MAX_CAMERA_HISTORY=100;
export const CAMERA_GESTURE_GAP=400;
const copy=(camera:CanvasCamera):CanvasCamera=>({zoom:camera.zoom,pan:{...camera.pan}});
const same=(a:CanvasCamera,b:CanvasCamera)=>a.zoom===b.zoom&&a.pan.x===b.pan.x&&a.pan.y===b.pan.y;
/** Ephemeral history for one current document/page. Never part of document undo or storage. */
export class CanvasNavigation {
 private views:CanvasCamera[]=[];private index=0;private lastGesture:number|undefined;
 get previous(){return this.index>0;}
 get next(){return this.index<this.views.length-1;}
 reset(camera:CanvasCamera){this.views=[copy(camera)];this.index=0;this.lastGesture=undefined;}
 record(before:CanvasCamera,after:CanvasCamera,now:number,discrete=false){
  if(!this.views.length)this.reset(before);if(same(before,after))return;
  const coalesce=!discrete&&!this.next&&this.lastGesture!==undefined&&now-this.lastGesture>=0&&now-this.lastGesture<CAMERA_GESTURE_GAP;
  this.views=this.views.slice(0,this.index+1);
  if(coalesce)this.views[this.index]=copy(after);else{this.views.push(copy(after));this.index++;}
  if(this.views.length>MAX_CAMERA_HISTORY){this.views.shift();this.index--;}
  this.lastGesture=discrete?undefined:now;
 }
 move(direction:-1|1):CanvasCamera|undefined {const index=this.index+direction;this.lastGesture=undefined;if(index<0||index>=this.views.length)return;this.index=index;return copy(this.views[index]);}
}
