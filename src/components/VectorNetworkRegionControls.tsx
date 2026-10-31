import {useRef,useState} from 'react';
import type {DesignNode} from '../model';
import {fillsFor} from '../paints';
import {connectNetworkVertices} from '../vector-network-geometry';
import {useNetworkView,commitNetwork,paintNetworkRegion} from '../vector-network-actions';
import type {NetworkContext} from '../vector-network-actions';
/** Local candidate receipts also invalidate retained callbacks when the editor source is unchanged. */
export default function VectorNetworkRegionControls({n,active,run}:{n:DesignNode;active:NetworkContext;run:(fn:()=>void)=>void}){
 const [candidate,setCandidate]=useState({from:'',to:''}),current=useRef(candidate);current.current=candidate;
 const g=n.vectorNetwork!,view=useNetworkView(),region=g.version===2?g.regions[0]:undefined,selected=!!region&&active.region===region.id,paint=fillsFor(n)[0],filled=!!paint?.visible&&paint.opacity>0;
 const choose=(field:'from'|'to',value:string)=>run(()=>{if(current.current!==candidate)throw Error('The connection choice changed. Try again.');const next={...candidate,[field]:value};current.current=next;setCandidate(next);});
 return <fieldset className="network-region-controls" style={{border:0,padding:0,minInlineSize:0}}><legend>Cycle region</legend>
 <p className="inspector-note">One simple cycle can receive one solid fill. Branches remain stroke-only; holes and multiple regions are not supported.</p>
 {region&&<><button className="outline-button" aria-pressed={selected} onClick={()=>run(()=>{if(useNetworkView.getState().context!==active)throw Error('The network editing session changed.');view.choose('region',region.id);})}>Select cycle region</button>
 {selected&&<><label>Region fill color<input type="color" aria-label="Region fill color" value={paint?.color??'#c8b9ee'} onChange={e=>run(()=>paintNetworkRegion(active,true,e.target.value))}/></label><button className="outline-button" disabled={filled} onClick={()=>run(()=>paintNetworkRegion(active,true))}>Fill selected region</button><button className="outline-button" disabled={!filled} onClick={()=>run(()=>paintNetworkRegion(active,false))}>Remove region fill</button><p className="inspector-note">Removing fill keeps this region available for refill. Remove fill before deleting a boundary edge or flattening.</p></>}
 </>}
 {(['from','to'] as const).map(field=><label key={field}>{field==='from'?'Connect from':'Connect to'}<select aria-label={'Network connect '+field} value={candidate[field]} onChange={e=>choose(field,e.target.value)}><option value="">Choose a vertex</option>{g.vertices.map((v,i)=><option key={v.id} value={v.id}>Vertex {i+1}</option>)}</select></label>)}
 <button className="outline-button" disabled={!candidate.from||!candidate.to||candidate.from===candidate.to} onClick={()=>run(()=>{if(current.current!==candidate)throw Error('The connection choice changed. Try again.');commitNetwork(active,connectNetworkVertices(g,candidate.from,candidate.to,{edge:crypto.randomUUID(),region:crypto.randomUUID()}));})}>Connect existing vertices</button>
 <p className="inspector-note">A connection within one tree creates the first region. Connections that create a second cycle, cross or overlap existing geometry refuse.</p>
 </fieldset>;
}
