import {useCanvasGradient} from '../canvas-gradient';
import {useEffect,useMemo} from 'react';
import type {DesignNode} from '../model';
import {canvasNameIndex,placeCanvasNames} from '../canvas-names';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {useEditor} from '../store';
import {usePreferences} from '../preferences';
import {useCanvasImageCrop} from '../canvas-image-crop';
const fontFamily='Inter, system-ui, sans-serif';
let measurement:CanvasRenderingContext2D|null=null;
function measure(text:string){measurement??=document.createElement('canvas').getContext('2d');if(!measurement)return {width:text.length*8};measurement.font='11px '+fontFamily;measurement.direction='ltr';const m=measurement.measureText(text);return {width:m.width,left:Math.min(0,-m.actualBoundingBoxLeft),right:Math.max(m.width,m.actualBoundingBoxRight),ascent:Math.max(11,m.actualBoundingBoxAscent),descent:Math.max(3,m.actualBoundingBoxDescent)};}
/** Editor-only names. Artwork and exports never read this overlay. */
export default function CanvasNames({nodes,zoom,onNode}:{nodes:DesignNode[];zoom:number;onNode:(e:React.PointerEvent,id:string)=>void}){
 const s=useEditor(),prefs=usePreferences(),crop=useCanvasImageCrop(),gradient=useCanvasGradient(),excluded=useMemo(()=>new Set([...(s.doc.whiteboard?.stickies.map(n=>n.frameId)??[]),...(s.doc.whiteboard?.tables.map(n=>n.frameId)??[]),...(s.doc.slides?.slides.map(n=>n.frameId)??[])]),[s.doc]),index=useMemo(()=>canvasNameIndex(nodes,excluded),[nodes,excluded]),names=useMemo(()=>placeCanvasNames(index,zoom,{frames:prefs.showFrameNames,sections:prefs.showSectionNames},measure),[index,zoom,prefs.showFrameNames,prefs.showSectionNames,s.fontRevision]),proof=useMemo(()=>({context:captureColorContext(s),tool:s.tool,zoom:s.zoom,pan:s.pan,valid:true}),[s.doc,s.pageId,s.selection,s.mode,s.home,s.modal,s.uiHidden,s.motionOpen,s.motionTime,s.tool,s.zoom,s.pan]);
 useEffect(()=>useEditor.subscribe(current=>{if(!sameColorContext(proof.context,current)||current.tool!==proof.tool||current.zoom!==proof.zoom||current.pan!==proof.pan)proof.valid=false;}),[proof]);
 const interactive=s.mode==='design'&&!s.motionOpen&&!s.modal&&!s.home&&!s.uiHidden&&!s.vectorEditId&&!crop.context&&!gradient.context&&['move','scale'].includes(s.tool)&&s.doc.workspace!=='slides';
 return <g data-canvas-names="true">{names.map(n=><text key={n.id} data-canvas-node-name={n.type} data-canvas-name-id={n.id} x={0} y={0} transform={'translate('+n.x+' '+n.y+') scale('+1/zoom+')'} fontFamily={fontFamily} textAnchor="start" direction="ltr" unicodeBidi="isolate" fill={n.type==='component'?'#b89af3':'#a29da9'} fontSize={11} pointerEvents={interactive&&!n.locked?'visiblePainted':'none'} style={{userSelect:'none',cursor:interactive&&!n.locked?'move':undefined}} onPointerDown={e=>{const current=useEditor.getState();if(!interactive||n.locked||!proof.valid||!sameColorContext(proof.context,current)||current.tool!==proof.tool||current.zoom!==proof.zoom||current.pan!==proof.pan||useCanvasImageCrop.getState().context||useCanvasGradient.getState().context){e.preventDefault();e.stopPropagation();return;}onNode(e,n.id);}} onDoubleClick={e=>{e.preventDefault();e.stopPropagation();}}><title>{n.title}</title>{n.text}</text>)}</g>;
}
