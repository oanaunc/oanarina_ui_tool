import {parsePanelLayout} from './panel-layout';
import type {PanelLayout} from './panel-layout';
/** Named editor arrangements. Device-local preferences only: never serialized in .oui and never touch a document. */
export const WORKSPACE_LAYOUTS_KEY='forma-workspace-layouts-v1';
export const WORKSPACE_LAYOUT_LIMIT=24;
export interface WorkspaceView {leftTab:'layers'|'assets';rulers:boolean;grid:boolean;outlines:boolean;minimap:boolean;scrollbars:boolean;}
export interface WorkspaceLayout {id:string;name:string;panels:PanelLayout;view:WorkspaceView;}
const keys=['id','name','panels','view'],viewKeys=['leftTab','rulers','grid','outlines','minimap','scrollbars'];
export function validateWorkspaceName(value:unknown):string{if(typeof value!=='string')throw Error('Enter a layout name.');const name=value.trim();if(!name||name.length>80||/[\u0000-\u001f\u007f-\u009f]/.test(name))throw Error('Enter a layout name of 1 to 80 characters.');return name;}
function validateLayout(value:unknown):WorkspaceLayout{
 const v=value as WorkspaceLayout;if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k))||typeof v.id!=='string'||!v.id||v.id.length>128)throw Error('Invalid workspace layout.');
 const view=v.view;if(!view||typeof view!=='object'||Array.isArray(view)||Object.keys(view).sort().join()!==[...viewKeys].sort().join()||!['layers','assets'].includes(view.leftTab)||viewKeys.slice(1).some(k=>typeof view[k as keyof WorkspaceView]!=='boolean'))throw Error('Invalid workspace layout.');
 return {id:v.id,name:validateWorkspaceName(v.name),panels:parsePanelLayout(JSON.stringify(v.panels)),view:{...view}};
}
export function parseWorkspaceLayouts(raw:string|null):WorkspaceLayout[]{if(raw===null)return [];if(raw.length>64000)throw Error('Invalid workspace layouts.');const data=JSON.parse(raw);if(!data||data.version!==1||!Array.isArray(data.layouts)||data.layouts.length>WORKSPACE_LAYOUT_LIMIT)throw Error('Invalid workspace layouts.');const layouts=data.layouts.map(validateLayout);if(new Set(layouts.map((l:WorkspaceLayout)=>l.id)).size!==layouts.length)throw Error('Invalid workspace layouts.');return layouts;}
export function readWorkspaceLayouts():{layouts:WorkspaceLayout[];warning:string}{try{return {layouts:parseWorkspaceLayouts(localStorage.getItem(WORKSPACE_LAYOUTS_KEY)),warning:''};}catch{return {layouts:[],warning:'Saved workspace layouts could not be read.'};}}
export function writeWorkspaceLayouts(layouts:readonly WorkspaceLayout[]){const raw=JSON.stringify({version:1,layouts});parseWorkspaceLayouts(raw);try{localStorage.setItem(WORKSPACE_LAYOUTS_KEY,raw);}catch{throw Error('Workspace layouts could not be saved. Allow local storage or free some space.');}}
export function addWorkspaceLayout(layouts:readonly WorkspaceLayout[],layout:WorkspaceLayout){if(layouts.length>=WORKSPACE_LAYOUT_LIMIT)throw Error('You can save up to '+WORKSPACE_LAYOUT_LIMIT+' workspace layouts.');const name=validateWorkspaceName(layout.name);if(layouts.some(l=>l.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('A layout with this name already exists.');return [...layouts,{...layout,name}];}
