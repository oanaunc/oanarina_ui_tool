import {node} from '../../src/model';
import {createPaint,createStroke} from '../../src/paints';
import {withNetworkRegion} from '../../src/vector-network-region';
import type {VectorNetwork} from '../../src/vector-network-geometry';
import {networkNodePatch} from '../../src/vector-network';
export function regionGraph():VectorNetwork{return withNetworkRegion({vertices:[{id:'a',x:20,y:20},{id:'b',x:180,y:20},{id:'c',x:180,y:150},{id:'d',x:20,y:150},{id:'tip',x:240,y:70},{id:'inner',x:70,y:100},{id:'u',x:250,y:140},{id:'v',x:290,y:180}],edges:[{id:'ab',from:'a',to:'b',fromHandle:{x:40,y:-10},toHandle:{x:-40,y:-10}},{id:'bc',from:'b',to:'c'},{id:'cd',from:'c',to:'d'},{id:'da',from:'d',to:'a'},{id:'branch',from:'b',to:'tip',fromHandle:{x:40,y:0},toHandle:{x:0,y:-20}},{id:'inside',from:'d',to:'inner',fromHandle:{x:20,y:-10},toHandle:{x:-10,y:10}},{id:'tree',from:'u',to:'v',fromHandle:{x:0,y:30},toHandle:{x:-15,y:0}}]},'region');}
export function regionNode(){const stroke={...createStroke('#d32f2f'),width:12,cap:'round' as const,join:'round' as const},n=node('path',{id:'region-node',name:'Region network',x:0,y:0,width:320,height:220,pathWidth:320,pathHeight:220,fill:'#4477cc',paints:[createPaint('#4477cc')],strokes:[stroke]});return {...n,...networkNodePatch(n,regionGraph())};}
