let metrics:CanvasRenderingContext2D|null=null;
/** A screen-sized mode badge remains readable over either light or dark artwork. */
export default function CanvasPaintHint({origin,zoom,mode,label}:{origin:{x:number;y:number};zoom:number;mode:'gradient'|'crop'|'cut'|'eraser';label?:string}){
 const text=label??(mode==='eraser'?'Vector eraser · Drag · Esc':mode==='cut'?'Cut path · Choose point · Esc':mode==='gradient'?'Gradient handles · Tab / arrows · Esc':'Canvas crop · drag / scale · Esc');metrics??=document.createElement('canvas').getContext('2d');if(metrics)metrics.font='11px Inter, system-ui, sans-serif';const width=(metrics?.measureText(text).width??text.length*7)+12;
 return <g data-paint-mode-hint={mode} transform={`translate(${origin.x} ${origin.y+18/zoom}) scale(${1/zoom})`} pointerEvents="none"><rect x={-4} y={-14} width={width} height={20} rx={3} fill="var(--panel)"/><text x={2} y={0} fontFamily="Inter, system-ui, sans-serif" fontSize={11} fill="var(--text)">{text}</text></g>;
}
