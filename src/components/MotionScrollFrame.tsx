import {validateDocumentProgressiveBlur} from '../progressive-blur';
import {useLayoutEffect,useMemo,useRef} from 'react';
import type {DesignNode} from '../model';
import {motionFrameNodes} from '../motion-presentation';
import type {MotionFrameScene} from '../motion-presentation';
import {clampMotionScroll,motionScrollNodes,motionScrollScene} from '../motion-scroll';
import type {MotionScrollScene,ScrollPoint} from '../motion-scroll';
import {Artwork} from './Artwork';
export default function MotionScrollFrame({scene,nodes,offset,time,style,onScene,onInteraction,plane=true}:{scene:MotionFrameScene;nodes:DesignNode[];offset:ScrollPoint;time:number;style:React.CSSProperties;onScene:(scene:MotionScrollScene,host:HTMLDivElement)=>void;onInteraction:NonNullable<React.ComponentProps<typeof Artwork>['onInteraction']>;plane?:boolean}){
 const geometry=useMemo(()=>{try{return {scene:motionScrollScene(nodes,scene.id)};}catch(error){return {error:error instanceof Error?error.message:String(error)};}},[nodes,scene.id]),root=useRef<HTMLDivElement>(null),scroll=geometry.scene;
 useLayoutEffect(()=>{const host=root.current?.parentElement;if(plane&&scroll&&host instanceof HTMLDivElement)onScene(scroll,host);},[scroll,plane,onScene]);
 if(!scroll)return <div className="prototype-error" role="alert">{geometry.error}</div>;
 let art:DesignNode[];try{const adjusted=motionScrollNodes(scroll,clampMotionScroll(scroll,offset));validateDocumentProgressiveBlur({pages:[{nodes:adjusted}]});art=motionFrameNodes(scene,adjusted);}catch(error){return <div className="prototype-error" role="alert">{error instanceof Error?error.message:String(error)}</div>;}const svg=<svg className={'prototype-art'+(plane?' motion-scroll-art':'')} data-prototype-frame={scene.id} data-motion-frame-time={time} viewBox={`0 0 ${scene.width} ${scene.height}`} width={scene.width} height={scene.height} style={style}><g transform={`matrix(${scene.transform.join(' ')})`}><Artwork nodes={art} onInteraction={(e,key,type)=>onInteraction(e,scene.originals.get(key)??key,type)}/></g></svg>;
 return plane?<div ref={root} className="motion-scroll-plane" data-motion-scroll-min={`${scroll.min.x},${scroll.min.y}`} style={{width:scene.width+scroll.max.x-scroll.min.x,height:scene.height+scroll.max.y-scroll.min.y}}>{svg}</div>:svg;
}
