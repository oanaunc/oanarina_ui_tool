import {useEditor} from '../store';
import {useId,useMemo} from 'react';
import type {DesignDocument,Page} from '../model';
import {thumbnailBounds,thumbnailNodes,thumbnailPlacement} from '../page-thumbnail';
import {Artwork} from './Artwork';
import './page-thumbnail.css';

export default function PageThumbnail({page,doc,anchor,id}:{page:Page;doc:DesignDocument;anchor:{left:number;right:number;top:number};id:string}){
 const theme=useEditor(s=>s.theme);
 const scope=useId(),nodes=useMemo(()=>thumbnailNodes(page.nodes,scope,doc.pages.flatMap(p=>p.nodes)),[page.nodes,scope,doc]),bounds=useMemo(()=>thumbnailBounds(page.nodes),[page.nodes]),placement=thumbnailPlacement(anchor,{width:window.innerWidth,height:window.innerHeight});
 return <div className={'page-thumbnail theme-'+theme} id={id} role="tooltip" style={placement} data-preview-page={page.id}>
  <div className="page-thumbnail-caption"><strong>{page.name}</strong><span>{page.nodes.length?'Static artwork · fit to content':'Empty page'}</span></div>
  <div className="page-thumbnail-art" aria-hidden="true">{page.nodes.length?<svg xmlns="http://www.w3.org/2000/svg" viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" focusable="false"><Artwork live nodes={nodes}/></svg>:<span>No artwork on this page</span>}</div>
 </div>;
}
