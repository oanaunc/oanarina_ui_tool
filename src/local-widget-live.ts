import {useMemo} from 'react';
import {create} from 'zustand';
import {descendants} from './model';
import type {DesignNode} from './model';
import {widgetLayers} from './local-widget-document';
import type {WidgetMenuItem,WidgetState,WidgetView} from './local-widget-manifest';
/** What hover, timer and drag-step runs produce. It stays out of the document, so these runs add no Undo step, never mark the file edited, cannot cancel a gesture and never reach an export. saved records the state it grew from: when the saved state moves on, the live view is dropped. */
export interface WidgetLiveView {saved:string;state:WidgetState;view:WidgetView;menu:WidgetMenuItem[];}
export const useWidgetLive=create<{views:Record<string,WidgetLiveView>}>(()=>({views:{}}));
export const setLiveWidget=(id:string,live:WidgetLiveView)=>useWidgetLive.setState(s=>({views:{...s.views,[id]:live}}));
export function clearLiveWidget(id:string){if(useWidgetLive.getState().views[id])useWidgetLive.setState(s=>{const views={...s.views};delete views[id];return {views};});}
export function clearLiveWidgets(){if(Object.keys(useWidgetLive.getState().views).length)useWidgetLive.setState({views:{}});}
/** The state a new run starts from: the live one while it still follows the saved one. */
export function liveWidgetState(id:string,state:WidgetState){const live=useWidgetLive.getState().views[id];return live&&live.saved===JSON.stringify(state)?live.state:state;}
export const liveLayerId=(frameId:string,index:number)=>frameId+'~live'+index;
/** A layer a live view adds has no document node, so anything that takes an ID from the canvas answers with its widget instead. Saved IDs can hold any text, so only a showing live view counts. */
export function liveLayerOwner(id:string):string;
export function liveLayerOwner(id:string|undefined|null):string|undefined;
export function liveLayerOwner(id:string|undefined|null){const at=id?.indexOf('~live')??-1,owner=id?.slice(0,at);return at>0&&owner&&useWidgetLive.getState().views[owner]?owner:id??undefined;}
/** Display nodes only. Each generated layer keeps the ID of the one it replaces, so selection and retained canvas elements carry over. */
export function liveWidgetNodes(nodes:DesignNode[],views:Record<string,WidgetLiveView>):DesignNode[]{let out=nodes;for(const [id,live] of Object.entries(views)){const frame=out.find(n=>n.id===id);if(!frame?.widget)continue;const old=new Set(descendants(out,[id]).filter(v=>v!==id)),before=out.filter(n=>old.has(n.id)),parts=widgetLayers(frame,live.view).map((n,i)=>({...n,id:before[i]?.type===n.type?before[i].id:liveLayerId(id,i)})),rest=out.filter(n=>!old.has(n.id));rest.splice(rest.findIndex(n=>n.id===id)+1,0,...parts);out=rest;}return out;}
export function useWidgetLiveNodes(nodes:DesignNode[]){const views=useWidgetLive(s=>s.views);return useMemo(()=>Object.keys(views).length?liveWidgetNodes(nodes,views):nodes,[nodes,views]);}
