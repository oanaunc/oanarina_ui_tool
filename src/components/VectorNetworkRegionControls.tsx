import {useRef,useState} from 'react';
import type {DesignNode} from '../model';
import {fillsFor} from '../paints';
import {connectNetworkVertices,mergeNetworkRegions} from '../vector-network-geometry';
import {t} from '../i18n';
import {useNetworkView,commitNetwork,editNetworkRegionPaints,paintNetworkRegion} from '../vector-network-actions';
import type {NetworkContext} from '../vector-network-actions';
import {FillEditor} from './PaintEditor';
/** Local candidate receipts also invalidate retained callbacks when the editor source is unchanged. */
export default function VectorNetworkRegionControls({n,active,run}:{n:DesignNode;active:NetworkContext;run:(fn:()=>void)=>void}){
 const [candidate,setCandidate]=useState({from:'',to:''}),current=useRef(candidate);current.current=candidate;
 const g=n.vectorNetwork!,view=useNetworkView(),regions=g.version===1?[]:g.version===2?[{id:g.regions[0].id,paints:fillsFor(n)}]:g.regions.map(r=>({id:r.id,paints:r.paints??[]})),region=regions.find(r=>r.id===active.region),paint=region?.paints[0],filled=!!region?.paints.some(p=>p.visible&&p.opacity>0);
 const choose=(field:'from'|'to',value:string)=>run(()=>{if(current.current!==candidate)throw Error('The connection choice changed. Try again.');const next={...candidate,[field]:value};current.current=next;setCandidate(next);});
 const neighbours=g.version===3&&region?(()=>{const own=new Set(g.regions.find(r=>r.id===region.id)!.loops.flat().map(b=>b.edgeId));return g.regions.flatMap((r,i)=>r.id!==region.id&&r.loops.flat().some(b=>own.has(b.edgeId))?[{id:r.id,index:i}]:[]);})():[];
 const select=(id:string)=>run(()=>{if(useNetworkView.getState().context!==active)throw Error('The network editing session changed.');view.choose('region',id);});
 return <fieldset className="network-region-controls" style={{border:0,padding:0,minInlineSize:0}}><legend>Regions</legend>
 <p className="inspector-note">Click inside any enclosed face on the canvas, or choose it here. Each face has its own fill; a nested island is a hole in the face around it, and branches stay stroke-only.</p>
 {regions.length===1&&<button className="outline-button" aria-pressed={!!region} onClick={()=>select(regions[0].id)}>Select cycle region</button>}
 {regions.length>1&&<label>Network region<select aria-label="Network region" value={active.region??''} onChange={e=>select(e.target.value)}><option value="" disabled>Select a region</option>{regions.map((r,i)=><option key={r.id} value={r.id}>Region {i+1}{r.paints.some(p=>p.visible&&p.opacity>0)?' · filled':''}</option>)}</select></label>}
 {region&&<><label>Region fill color<input type="color" aria-label="Region fill color" value={paint?.color??'#c8b9ee'} onChange={e=>run(()=>paintNetworkRegion(active,true,e.target.value))}/></label><button className="outline-button" disabled={filled} onClick={()=>run(()=>paintNetworkRegion(active,true))}>Fill selected region</button><button className="outline-button" disabled={!filled} onClick={()=>run(()=>paintNetworkRegion(active,false))}>Remove region fill</button><p className="inspector-note">Removing fill keeps this region available for refill. Deleting a boundary merges the faces around it, or removes the region when nothing stays enclosed.</p>
 {neighbours.map(v=><button key={v.id} className="outline-button" onClick={()=>run(()=>commitNetwork(active,mergeNetworkRegions(g,[region.id,v.id])))}>{t('Merge with region')} {v.index+1}</button>)}
 <div className="network-region-paints" data-network-region-paints={region.id}><FillEditor n={{...n,fill:paint?.color??'none',gradient:false,paints:region.paints}} patch={p=>{if(p.paints)run(()=>editNetworkRegionPaints(active,region.id,p.paints!));}}/></div></>}
 {(['from','to'] as const).map(field=><label key={field}>{field==='from'?'Connect from':'Connect to'}<select aria-label={'Network connect '+field} value={candidate[field]} onChange={e=>choose(field,e.target.value)}><option value="">Choose a vertex</option>{g.vertices.map((v,i)=><option key={v.id} value={v.id}>Vertex {i+1}</option>)}</select></label>)}
 <button className="outline-button" disabled={!candidate.from||!candidate.to||candidate.from===candidate.to} onClick={()=>run(()=>{if(current.current!==candidate)throw Error('The connection choice changed. Try again.');commitNetwork(active,connectNetworkVertices(g,candidate.from,candidate.to,{edge:crypto.randomUUID(),region:crypto.randomUUID()}));})}>Connect existing vertices</button>
 <p className="inspector-note">Connecting splits a face in two, and both parts keep its paint. A connection that crosses an edge adds a junction there. Overlapping an existing edge refuses.</p>
 </fieldset>;
}
