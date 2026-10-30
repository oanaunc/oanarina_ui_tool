import type {DesignNode} from './model';
import type {VectorSeparation} from './vector-separation';
import {applyVectorSeparation} from './vector-separation';
import {exportSelection,visualBounds} from './transforms';
import {exportSvg} from './files';
/** Image documents isolate preview definitions from the live editor. No document/store mutations. */
export function vectorSeparationPreview(nodes:DesignNode[],id:string,plan:VectorSeparation){const original=exportSelection(nodes,[id]);if(original.length>2000)throw Error('Separation preview exceeds 2,000 context layers.');const result=structuredClone(original);applyVectorSeparation(result,id,plan);const a=visualBounds(original),b=visualBounds(result),padding=Math.max(2,Math.max(a.width,a.height,b.width,b.height)*.04),x=Math.min(a.x,b.x)-padding,y=Math.min(a.y,b.y)-padding,viewport={x,y,width:Math.max(a.x+a.width,b.x+b.width)-x+padding,height:Math.max(a.y+a.height,b.y+b.height)-y+padding},src=(ns:DesignNode[])=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(exportSvg(ns,viewport,false,{dimensions:{width:600,height:360}}));return {original:src(original),result:src(result)};}
