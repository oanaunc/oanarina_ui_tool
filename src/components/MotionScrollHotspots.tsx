import {useMemo} from 'react';
import type {DesignNode} from '../model';
import {motionFrameNodes,motionRenderNames} from '../motion-presentation';
import type {MotionFrameScene} from '../motion-presentation';
import {motionScrollNodes,motionScrollScene} from '../motion-scroll';
import type {ScrollPoint} from '../motion-scroll';
import {reactionsFor} from '../prototype';
import {createPaint} from '../paints';
import {Artwork} from './Artwork';
/** Highlights share the real clip/mask tree, but have isolated render-only definitions. */
export default function MotionScrollHotspots({scene,nodes,reserved,offset,x,y,width,height}:{scene:MotionFrameScene;nodes:DesignNode[];reserved:DesignNode[];offset:ScrollPoint;x:number;y:number;width:number;height:number}){
 const names=useMemo(()=>motionRenderNames(nodes.filter(n=>scene.ids.has(n.id)),reserved,scene.names.get(scene.id)+'-hints'),[scene,reserved]),paint=useMemo(()=>({...createPaint('#aa8de1'),opacity:.27}),[]);
 try{const scroll=motionScrollScene(nodes,scene.id),adjusted=motionScrollNodes(scroll,offset),children=new Map<string,DesignNode[]>(),masks=new Set<string>();for(const n of adjusted){if(n.parentId){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}if(n.mask)masks.add(n.id);}const queue=[...masks];for(let i=0;i<queue.length;i++)for(const n of children.get(queue[i])??[])if(!masks.has(n.id)){masks.add(n.id);queue.push(n.id);}const highlights=adjusted.map(n=>masks.has(n.id)?n:{...n,fill:'none',stroke:'',strokes:[],paints:reactionsFor(n).some(r=>r.enabled)?[paint]:[],effects:[],shadow:false,blur:0}),art=motionFrameNodes({...scene,names},highlights);return <svg className="prototype-hotspots" aria-hidden="true" width={width} height={height} viewBox={`0 0 ${width} ${height}`}><svg x={x} y={y} width={scene.width} height={scene.height} viewBox={`0 0 ${scene.width} ${scene.height}`} overflow="hidden"><g transform={`matrix(${scene.transform.join(' ')})`}><Artwork nodes={art}/></g></svg></svg>;}catch{return null;}
}
