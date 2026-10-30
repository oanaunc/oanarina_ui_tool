import {Download} from 'lucide-react';
import {useEditor} from '../store';
import {exportArtwork} from '../files';
import {GuideExportOption} from './LayoutGuides';
import {FrameExportSettings} from './FrameDelivery';
export default function ExportDialog({format,setFormat,scale,setScale,includeGuides,setIncludeGuides}:{format:'svg'|'png'|'jpg';setFormat:(v:'svg'|'png'|'jpg')=>void;scale:number;setScale:(v:number)=>void;includeGuides:boolean;setIncludeGuides:(v:boolean)=>void}){
 const s=useEditor(),page=s.doc.pages.find(p=>p.id===s.pageId)!,frame=s.selection.length===1?page.nodes.find(n=>n.id===s.selection[0]&&n.type==='frame'):undefined;
 if(frame)return <FrameExportSettings key={frame.id} id={frame.id} dialog/>;
 return <><GuideExportOption value={includeGuides} onChange={setIncludeGuides}/><p className="dialog-description">{s.selection.length?`${s.selection.length} selected layer(s)`:'All layers on the current page'}</p><div className="field-grid"><select aria-label="Export file format" value={format} onChange={e=>setFormat(e.target.value as typeof format)}><option value="svg">SVG · vector</option><option value="png">PNG · transparent</option><option value="jpg">JPG · white background</option></select><select aria-label="Export resolution" value={scale} onChange={e=>setScale(Number(e.target.value))}>{[1,2,3,4].map(v=><option key={v} value={v}>{v}× resolution</option>)}</select></div><button className="primary-button" onClick={()=>exportArtwork(format,scale,includeGuides)}><Download size={15}/>Export {format.toUpperCase()}</button></>;
}
