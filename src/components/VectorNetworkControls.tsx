import VectorNetworkRegionControls from './VectorNetworkRegionControls';
import {useCanvasGradient} from '../canvas-gradient';
import {useCanvasImageCrop} from '../canvas-image-crop';
import {useLayoutEffect,useMemo,useState} from 'react';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {subscribePreferences,usePreferences} from '../preferences';
import {useMaskView} from '../mask-view';
import {networkProof,sameNetworkContext,networkTarget,convertNetwork,flattenNetwork,commitNetwork,useNetworkView} from '../vector-network-actions';
import {contoursToNetwork,networkNodePatch,validateDocumentNetworks} from '../vector-network';
import {deleteNetworkEdges,deleteNetworkVertices,moveNetworkVertices,setNetworkHandle} from '../vector-network-geometry';
import NumberField from './NumberField';
import {notifyError} from '../files';
export default function VectorNetworkControls({n}:{n:DesignNode}){
 const [epoch,setEpoch]=useState({}),s=useEditor(),prefs=usePreferences(),view=useNetworkView(),mask=useMaskView(),proof=useMemo(()=>networkProof(n.id),[s.doc,s.pageId,s.selection,s.mode,s.home,s.modal,s.uiHidden,s.motionOpen,s.motionTime,s.vectorEditId,s.outlines,s.tool,s.zoom,s.pan.x,s.pan.y,prefs.uiScale,n.id,mask.preview,mask.outlines,view.context,epoch]),life=useMemo(()=>({mounted:false}),[proof]);
 useLayoutEffect(()=>{life.mounted=true;const captured=view.context,check=()=>{if(proof.valid&&(!sameNetworkContext(proof)||useNetworkView.getState().context!==captured)){proof.valid=false;setEpoch({});}},a=useEditor.subscribe(check),b=subscribePreferences(check),m=useMaskView.subscribe(check),g=useCanvasGradient.subscribe(check),i=useCanvasImageCrop.subscribe(check),v=useNetworkView.subscribe(check);return()=>{life.mounted=false;a();b();m();g();i();v();};},[proof,life]);
 const check=()=>{if(document.hidden||!life.mounted||!sameNetworkContext(proof))throw Error('The network target changed. Select it again.');};
 const action=(fn:()=>void)=>{try{check();fn();}catch(e){notifyError(e);}};
 const active=view.context?.id===n.id?view.context:null,g=n.vectorNetwork,vertex=g?.vertices.find(v=>v.id===active?.vertex),edge=g?.edges.find(e=>e.id===active?.edge);
 let reason='';if(!g)try{networkTarget(proof,false);const patch=networkNodePatch(n,contoursToNetwork(n));validateDocumentNetworks({...s.doc,pages:s.doc.pages.map(p=>p.id===s.pageId?{...p,nodes:p.nodes.map(v=>v.id===n.id?{...v,...patch}:v)}:p)});}catch(e){reason=e instanceof Error?e.message:String(e);}
 const edit=(fn:()=>import('../vector-network-geometry').VectorNetwork)=>action(()=>{if(!active||useNetworkView.getState().context!==active)throw Error('Enable network editing again.');commitNetwork(active,fn());});
 return <div className="vector-network-controls" onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&(e.target as HTMLElement).closest('button'))e.stopPropagation();}}>
 {!g?<><button className="outline-button" disabled={!!reason} onClick={()=>action(()=>convertNetwork(proof))}>Convert to stroke network</button><p className="inspector-note">{reason||'Creates shared vertices from the contours. Crossings become explicit junctions, coincident anchors weld, and every enclosed face becomes a region; a nested contour becomes a hole. Fills stay on the faces they covered.'}</p></>:<>
 <p className="inspector-note">{g.vertices.length} vertices · {g.edges.length} edges. {g.version===1?'Stroke forest; connect two vertices to create a region.':g.version===2?'One region plus stroke branches.':`${g.regions.length} ${g.regions.length===1?'region':'regions'} plus stroke branches.`}</p>
 <button className="outline-button" aria-pressed={!!active} onClick={()=>action(()=>{if(active){if(useNetworkView.getState().context!==active)throw Error('The editing session changed.');view.reset();}else view.activate(n.id);})}>{active?'Finish network editing':'Edit network'}</button>
 {active&&<><VectorNetworkRegionControls key={'network-region:'+n.id} n={n} active={active} run={action}/><label>Network vertex<select aria-label="Network vertex" value={active.vertex??''} onChange={e=>action(()=>view.choose('vertex',e.target.value))}><option value="" disabled>Select a vertex</option>{g.vertices.map((v,i)=><option key={v.id} value={v.id}>Vertex {i+1}</option>)}</select></label>
 <label>Network edge<select aria-label="Network edge" value={active.edge??''} onChange={e=>action(()=>view.choose('edge',e.target.value))}><option value="" disabled>Select an edge</option>{g.edges.map((e,i)=><option key={e.id} value={e.id}>Edge {i+1}</option>)}</select></label>
 <button className="outline-button" aria-pressed={active.branch} onClick={()=>action(()=>{if(useNetworkView.getState().context!==active)throw Error('The editing session changed.');view.arm(!active.branch);})}>Draw network branch</button>
 <p className="inspector-note">{active.branch?'Drag from a visible edge to split it exactly and add a straight branch, or drag from a vertex.':'Drag a vertex to move every incident edge. Select an edge to expose its two independent handles. Delete removes a selected edge or vertex; the last edge requires deleting the layer.'}</p>
 {vertex&&<button className="outline-button" onClick={()=>edit(()=>deleteNetworkVertices(g,[vertex.id]))}>Delete selected network vertex</button>}
 {vertex&&(['x','y'] as const).map(axis=><NumberField key={JSON.stringify([n.id,vertex.id,axis,vertex[axis]])} label={'Network vertex '+axis.toUpperCase()} value={vertex[axis]} min={-995000} max={995000} onChange={value=>edit(()=>moveNetworkVertices(g,[vertex.id],{x:axis==='x'?value-vertex.x:0,y:axis==='y'?value-vertex.y:0}))}/>)}
 {edge&&<><button className="outline-button" disabled={g.edges.length===1} onClick={()=>edit(()=>deleteNetworkEdges(g,[edge.id]))}>Delete selected network edge</button>{(['fromHandle','toHandle'] as const).map(side=><fieldset key={side} style={{border:0,padding:0,minInlineSize:0}}><legend>{side==='fromHandle'?'Start':'End'} edge handle offsets</legend>{(['x','y'] as const).map(axis=><NumberField key={JSON.stringify([n.id,edge.id,side,axis,edge[side]?.[axis]])} label={'Network '+(side==='fromHandle'?'start':'end')+' handle '+axis.toUpperCase()} value={edge[side]?.[axis]??0} min={-995000} max={995000} onChange={value=>edit(()=>setNetworkHandle(g,edge.id,side,{x:edge[side]?.x??0,y:edge[side]?.y??0,[axis]:value}))}/>)}</fieldset>)}</>}
 </>}
 <button className="outline-button" onClick={()=>action(()=>flattenNetwork(proof))}>Flatten network to contours</button><p className="inspector-note">Flatten retains stroke geometry and splits shared junctions into independent contour endpoints. Filled regions stay filled; each further paint stack becomes its own layer below the stroke. Undo restores the graph. SVG exports appearance; editable Figma Bridge transfer requires flattening first.</p>
 </>}
 </div>;
}
