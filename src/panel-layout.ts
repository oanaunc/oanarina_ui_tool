export type PanelSide='left'|'right';
export interface PanelPreference{width:number|null;collapsed:boolean}
export interface PanelLayout{version:1;left:PanelPreference;right:PanelPreference}
export const PANEL_LAYOUT_KEY='oui-panel-layout';
export const PANEL_LIMITS={left:{min:160,max:480},right:{min:200,max:480}} as const;
export const PANEL_RAIL=28,PANEL_SEPARATOR=6,MIN_CANVAS=240;
export type PanelLayoutAction='toggle-left-sidebar'|'toggle-right-sidebar'|'reset-sidebar-layout';
export const PANEL_LAYOUT_EVENT='forma-panel-layout';
/** A cancelable, fixed-action request. A mounted editor acknowledges it; Home/Slides do not. */
export function dispatchPanelLayout(action:PanelLayoutAction):boolean{return !window.dispatchEvent(new CustomEvent(PANEL_LAYOUT_EVENT,{detail:action,cancelable:true}));}
export function defaultPanelLayout():PanelLayout{return{version:1,left:{width:null,collapsed:false},right:{width:null,collapsed:false}};}
export function parsePanelLayout(raw:string|null):PanelLayout{
 if(raw===null)return defaultPanelLayout();
 if(raw.length>2048)throw Error('Invalid sidebar settings.');
 const value:unknown=JSON.parse(raw);
 if(!value||typeof value!=='object'||Array.isArray(value)||(value as PanelLayout).version!==1)throw Error('Invalid sidebar settings.');
 const result=defaultPanelLayout();
 for(const side of ['left','right'] as const){const p=(value as PanelLayout)[side],limit=PANEL_LIMITS[side];if(!p||typeof p!=='object'||Array.isArray(p)||typeof p.collapsed!=='boolean'||!(p.width===null||typeof p.width==='number'&&Number.isFinite(p.width)&&p.width>=limit.min&&p.width<=limit.max))throw Error('Invalid sidebar settings.');result[side]={width:p.width===null?null:Math.round(p.width),collapsed:p.collapsed};}
 return result;
}
export function readPanelLayout():{layout:PanelLayout;warning:string}{try{return{layout:parsePanelLayout(localStorage.getItem(PANEL_LAYOUT_KEY)),warning:''};}catch{return{layout:defaultPanelLayout(),warning:'Saved sidebar settings could not be read. Using defaults in this window.'};}}
export function writePanelLayout(layout:PanelLayout):string{try{const checked=parsePanelLayout(JSON.stringify(layout));localStorage.setItem(PANEL_LAYOUT_KEY,JSON.stringify(checked));return '';}catch{return 'Sidebar settings apply in this window, but could not be saved on this device.';}}
/** Desired widths survive temporary viewport clamping. No document or camera state is involved. */
export function resolvePanelLayout(layout:PanelLayout,viewportWidth:number,physicalWidth=viewportWidth){
 const width=Number.isFinite(viewportWidth)?Math.max(0,viewportWidth):1512,compact=physicalWidth<=700;
 const defaults=compact?{left:151,right:240}:width<=850?{left:185,right:205}:width<=1150?{left:206,right:225}:{left:232,right:251};
 let left=layout.left.collapsed?PANEL_RAIL:layout.left.width??defaults.left,right=layout.right.collapsed?PANEL_RAIL:layout.right.width??defaults.right;
 if(compact){left=layout.left.collapsed?PANEL_RAIL:Math.min(left,Math.max(80,width-160));return{left,right:Math.max(80,Math.min(240,width-16)),compact,leftMax:PANEL_LIMITS.left.max,rightMax:PANEL_LIMITS.right.max};}
 const available=Math.max(0,width-MIN_CANVAS-2*PANEL_SEPARATOR),leftMin=layout.left.collapsed?PANEL_RAIL:PANEL_LIMITS.left.min,rightMin=layout.right.collapsed?PANEL_RAIL:PANEL_LIMITS.right.min;
 let excess=Math.max(0,left+right-available);
 // Honor the narrower requested panel first. Re-proportioning both sides on
 // every drag update makes a newly chosen width jump backwards when the
 // opposite panel still has a larger, temporarily clamped desired width.
 if(excess>0){
  if(left===right){const slack=(left-leftMin)+(right-rightMin),fraction=slack?Math.min(1,excess/slack):0;left-=fraction*(left-leftMin);right-=fraction*(right-rightMin);}
  else if(left>right){const take=Math.min(excess,left-leftMin);left-=take;excess-=take;right-=Math.min(excess,right-rightMin);}
  else{const take=Math.min(excess,right-rightMin);right-=take;excess-=take;left-=Math.min(excess,left-leftMin);}
 }
 left=Math.round(left);right=Math.min(Math.round(right),Math.floor(available-left));
 return{left,right,compact,leftMax:Math.max(PANEL_LIMITS.left.min,Math.min(PANEL_LIMITS.left.max,Math.floor(available-right))),rightMax:Math.max(PANEL_LIMITS.right.min,Math.min(PANEL_LIMITS.right.max,Math.floor(available-left)))};
}
