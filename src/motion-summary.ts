import type {DesignNode} from './model';
import type {Timeline} from './motion';
const SUMMARY_ROWS=100;
const seconds=(value:number)=>Number(value.toFixed(2))+' s';
const count=(n:number,word:string)=>n+' '+word+(n===1?'':'s');
/** Reads the saved timeline as text, so assistive technology does not depend on the keyframe grid. */
export function motionTimelineSummary(motion:Timeline,nodes:readonly DesignNode[]){const names=new Map(nodes.map(n=>[n.id,n.name])),keys=motion.tracks.reduce((sum,t)=>sum+t.keyframes.length,0),layers=new Set(motion.tracks.map(t=>t.nodeId)).size,sentence=motion.tracks.length?`${count(motion.tracks.length,'track')} on ${count(layers,'layer')}, ${count(keys,'keyframe')}. ${seconds(motion.duration)} at ${motion.fps} fps${motion.loop?', looping':''}.`:`No keyframes yet. ${seconds(motion.duration)} at ${motion.fps} fps.`,rows=motion.tracks.slice(0,SUMMARY_ROWS).map(t=>{const first=t.keyframes[0]?.time,last=t.keyframes.at(-1)?.time;return {id:t.id,text:`${names.get(t.nodeId)??'Missing layer'}, ${t.property}: ${count(t.keyframes.length,'keyframe')}${first===undefined?'':first===last?' at '+seconds(first):` from ${seconds(first)} to ${seconds(last!)}`}`};});return {sentence,rows,hidden:Math.max(0,motion.tracks.length-rows.length)};}
