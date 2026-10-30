import DesignPdfExport from './DesignPdfExport';
import {useEditor} from '../store';
import {CopySvgSelection,LayerExportSettings,BatchExports,CombinedExport} from './LayerExports';
export default function ExportDialog({format,setFormat,scale,setScale,includeGuides,setIncludeGuides}:{format:'svg'|'png'|'jpg';setFormat:(v:'svg'|'png'|'jpg')=>void;scale:number;setScale:(v:number)=>void;includeGuides:boolean;setIncludeGuides:(v:boolean)=>void}){
 const s=useEditor(),page=s.doc.pages.find(p=>p.id===s.pageId)!,target=s.selection.length===1?page.nodes.find(n=>n.id===s.selection[0]):undefined;
 if(target)return <><LayerExportSettings key={target.id} id={target.id} dialog/><CopySvgSelection/><DesignPdfExport/><BatchExports/></>;
 return <><CombinedExport format={format} setFormat={setFormat} scale={scale} setScale={setScale} includeGuides={includeGuides} setIncludeGuides={setIncludeGuides}/><CopySvgSelection/><DesignPdfExport/><BatchExports/></>;
}
