import type {EditorPreferences} from './preferences';
import {defaultPreferences} from './preferences';
import {defaultSnapping,pixelSnapUnit,snapMove} from './guides';
import type {SnapPreferences,GuideLine} from './guides';
import type {DesignNode} from './model';
import {snapVectorPoint} from './vector-snapping';
import type {VectorSnapIndex} from './vector-snapping';
export type LocalSnapping=Pick<EditorPreferences,'pixelSnapping'|'objectSnapping'|'vectorGeometrySnapping'>;
export const snappingPreferenceKey=(p:Readonly<LocalSnapping>)=>JSON.stringify([p.pixelSnapping,p.objectSnapping,p.vectorGeometrySnapping]);
/** The saved master switch always wins. Guides/layout remain saved-document channels. */
export function effectiveSnapping(document:Partial<SnapPreferences>|undefined,local:Readonly<LocalSnapping>=defaultPreferences):SnapPreferences{
 const effective={...defaultSnapping,...document};
 if(local.pixelSnapping!=='document')effective.pixel=local.pixelSnapping;
 if(local.objectSnapping!=='document')effective.objects=effective.centers=effective.frames=effective.spacing=local.objectSnapping==='on';
 if(local.vectorGeometrySnapping!=='document')effective.vectorPoints=local.vectorGeometrySnapping==='on';
 return effective;
}
/** Follow-document means the alignment the file actually shows; drawing no longer ignores it. */
export function snapExplicitPixel(position:{x:number;y:number},document:Partial<SnapPreferences>|undefined,local:Readonly<LocalSnapping>){
 const mode=local.pixelSnapping==='document'?{...defaultSnapping,...document}.pixel:local.pixelSnapping;
 if(document?.enabled===false||mode==='none')return position;
 const unit=pixelSnapUnit(mode);return {x:Math.round(position.x/unit)*unit,y:Math.round(position.y/unit)*unit};
}
/** Explicit local overrides opt drawing endpoints into existing object/vector solvers. */
export function snapDrawingEndpoint(o:{position:{x:number;y:number};nodes:DesignNode[];zoom:number;document?:Partial<SnapPreferences>;local:Readonly<LocalSnapping>;geometry?:VectorSnapIndex;disabled?:boolean}):{point:{x:number;y:number};lines:GuideLine[]}{
 if(o.disabled||o.document?.enabled===false)return {point:o.position,lines:[]};
 if(o.local.vectorGeometrySnapping==='on'&&o.geometry){const hit=snapVectorPoint(o.geometry,o.position,o.zoom);if(hit)return {point:hit.point,lines:[]};}
 if(o.local.objectSnapping==='on'){const snapped=snapMove({nodes:o.nodes,movingIds:[],box:{...o.position,width:0,height:0},dx:0,dy:0,zoom:o.zoom,preferences:{enabled:true,objects:true,centers:true,frames:true,spacing:false,guides:false,layout:false,pixel:o.local.pixelSnapping==='document'?'none':o.local.pixelSnapping}});return {point:{x:o.position.x+snapped.dx,y:o.position.y+snapped.dy},lines:snapped.lines};}
 return {point:snapExplicitPixel(o.position,o.document,o.local),lines:[]};
}
