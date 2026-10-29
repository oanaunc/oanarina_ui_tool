import {useState} from 'react';
import {useEditor} from '../store';
import type {DesignNode} from '../model';
import {transformVectorPoints} from '../vector-operations';
import {runCommand} from '../commands';
export default function VectorPointTools({n}:{n:DesignNode}){const s=useEditor(),[scale,setScale]=useState('100'),[rotation,setRotation]=useState('0');
 const transform=(options:{scaleX?:number;scaleY?:number;rotation?:number})=>{try{s.patch([n.id],transformVectorPoints(n,s.vectorSelection,options));}catch(error){s.set({toast:error instanceof Error?error.message:String(error)});}};
 return <div><p className="inspector-note">{s.vectorSelection.length} selected points</p><div className="button-row"><button className="outline-button" onClick={()=>runCommand('vector-join')}>Join</button><button className="outline-button" onClick={()=>runCommand('vector-smooth-join')}>Smooth join</button></div><div className="button-row"><button className="outline-button" onClick={()=>runCommand('vector-split')}>Split at points</button><button className="outline-button" onClick={()=>runCommand('vector-heal')}>Delete and heal</button></div><label>Point group scale %<input aria-label="Point group scale percent" type="number" value={scale} onChange={e=>setScale(e.target.value)}/></label><button className="outline-button" disabled={!s.vectorSelection.length} onClick={()=>transform({scaleX:Number(scale)/100,scaleY:Number(scale)/100})}>Scale selected points</button><label>Point group rotation<input aria-label="Point group rotation" type="number" value={rotation} onChange={e=>setRotation(e.target.value)}/></label><button className="outline-button" disabled={!s.vectorSelection.length} onClick={()=>transform({rotation:Number(rotation)})}>Rotate selected points</button></div>;
}
