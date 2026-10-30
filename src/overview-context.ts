import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import type {CanvasCamera} from './canvas-navigation';

export interface OverviewEditorContext extends ColorEditContext,CanvasCamera {tool:string;vectorEditId:string|null;motionPlaying:boolean;autoKey:boolean;}
export interface OverviewContext {origin:ColorEditContext;tool:string;vectorEditId:string|null;motionPlaying:boolean;autoKey:boolean;uiScale:number;camera:CanvasCamera;valid:boolean;}
export function captureOverviewContext(s:OverviewEditorContext,uiScale:number):OverviewContext{return {origin:captureColorContext(s),tool:s.tool,vectorEditId:s.vectorEditId,motionPlaying:s.motionPlaying,autoKey:s.autoKey,uiScale,camera:{zoom:s.zoom,pan:{...s.pan}},valid:true};}
export function sameOverviewContext(c:OverviewContext,s:OverviewEditorContext,uiScale:number){return c.valid&&sameColorContext(c.origin,s)&&c.tool===s.tool&&c.vectorEditId===s.vectorEditId&&c.motionPlaying===s.motionPlaying&&c.autoKey===s.autoKey&&c.uiScale===uiScale&&c.camera.zoom===s.zoom&&c.camera.pan.x===s.pan.x&&c.camera.pan.y===s.pan.y;}
export function overviewAvailable(s:ColorEditContext){return !s.home&&!s.uiHidden&&!s.modal&&s.doc.workspace!=='slides';}
