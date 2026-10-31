import type {DesignNode} from './model';
import {layerScale,resizeGroupContents} from './scale-apply';
import type {useEditor} from './store';
export {layerScale};
/** Typing W or H on a group resizes what it holds from its top-left corner, in one Undo step. */
export function typeGroupSize(s:ReturnType<typeof useEditor.getState>,g:DesignNode,p:Partial<DesignNode>){const width=p.width??g.width,height=p.height??g.height,sx=g.width>0?width/g.width:0,sy=g.height>0?height/g.height:0;if(sx===1&&sy===1)return;s.edit(d=>{const page=d.pages.find(v=>v.id===s.pageId)!;resizeGroupContents(page,g.id,sx,sy,g.x,g.y);});}
