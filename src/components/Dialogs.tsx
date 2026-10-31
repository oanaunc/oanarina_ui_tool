import BrandDialogs from './BrandDialogs';
import LearningDialog from './EditorLearning';
import LocalToolDialog,{isLocalToolModal} from './LocalToolDialog';
import PrototypeShare from './PrototypeShare';
import ResourceLibrary from './ResourceLibrary';
import SketchImport from './SketchImport';
import LocalPlugins from './LocalPlugins';
import CodeLayerEditor from './CodeLayerEditor';
import ComponentPlayground from './ComponentPlayground';
import PdfImportReview from './PdfImportReview';
import DesignJsonReview from './DesignJsonReview';
import DesignJsonImportButton from './DesignJsonImportButton';
import LocalNavigationLinks from './LocalNavigationLinks';
import VersionHistory from './VersionHistory';
import BranchesDialog from './BranchesDialog';
import {DocumentRecoveryDialog,SafeModePluginsNotice,StorageRecoveryDialog} from './StorageRecovery';
import {isSafeMode} from '../startup-health';
import SaveVersion from './SaveVersion';
import DocumentCoverDialog from './DocumentCoverDialog';
import ShortcutHelp from './ShortcutHelp';
import RepeatLayersDialog from './RepeatLayersDialog';
import SliceManager from './SliceManager';
import KeyboardSelectionBox from './KeyboardSelectionBox';
import VectorOffsetDialog from './VectorOffsetDialog';
import StrokeOutlineDialog from './StrokeOutlineDialog';
import VectorSeparationDialog from './VectorSeparationDialog';
import DocumentOutline from './DocumentOutline';
import KeyboardInsertDialog from './KeyboardInsertDialog';
import AssetUsageAudit from './AssetUsageAudit';
import {getPreferences} from '../preferences';
import FigImportReport from './FigImportReport';
import {clearFigImportReport,getFigImportReport} from '../fig-import';
import FileInformation from './FileInformation';
import MoveLayersDialog from './MoveLayersDialog';
import TextSearch from './TextSearch';
import ActionPalette from './ActionPalette';
import Preferences from './Preferences';
import ReleaseNotes from './ReleaseNotes';
import SvgImportReview from './SvgImportReview';
import McpSetup from './McpSetup';
import ExportDialog from './ExportDialog';
import PrototypePresentation from './PrototypePresentation';
import DesignSystemsEditor from './DesignSystemsEditor';
import ComponentManager from './ComponentEditor';
import {useEffect,useState} from 'react';
import {ChevronRight,ExternalLink,X,Layers} from 'lucide-react';
import {FEATURE_COUNT,APP_VERSION} from '../feature-meta';
import {useEditor} from '../store';
import {formatNumber,t} from '../i18n';
import {cancelSvgImport,getSvgImportRequest,exportArtwork,notifyError,openProject} from '../files';
import FontLibrary from './FontLibrary';
import LocalCommentsDialog from './LocalCommentsDialog';
import TemplateGallery from './TemplateGallery';
import IconLibrary from './IconLibrary';
interface Feature {id:string;name:string;category:string;status:string;priority:string;notes:string;}
export default function Dialogs(){const s=useEditor(),[query,setQuery]=useState(''),[value,setValue]=useState(''),[features,setFeatures]=useState<Feature[]>([]),[category,setCategory]=useState('All'),[filter,setFilter]=useState('All'),[scale,setScale]=useState(1),[includeGuides,setIncludeGuides]=useState(false),[format,setFormat]=useState<'svg'|'png'|'jpg'>(()=>getPreferences().defaultExportFormat);
 const page=s.doc.pages.find(p=>p.id===s.pageId)!,n=page.nodes.find(n=>s.selection.includes(n.id)),modal=s.modal;
 useEffect(()=>{const report=getFigImportReport();if(report&&(modal!=='fig-import-report'||report.document.id!==s.doc.id))clearFigImportReport();const request=getSvgImportRequest();if(request&&(modal!=='svg-import'||request.documentId!==s.doc.id))cancelSvgImport();},[modal,s.doc.id]);
 useEffect(()=>{setQuery('');setCategory('All');setFilter('All');setValue(modal==='rename-file'?s.doc.name:modal==='rename-page'?page.name:modal==='rename'?n?.name??'':modal==='text-link'?n?.hyperlink??'':'');if(modal==='roadmap')fetch('./features.json').then(r=>r.json()).then((rows:Feature[])=>setFeatures(rows.filter(f=>f.status!=='retired'))).catch(notifyError);},[modal]);
 useEffect(()=>{if(s.modal==='export')setFormat(getPreferences().defaultExportFormat);},[s.modal]);
 if(!modal)return null;
 if(modal==='learning')return <LearningDialog/>;
 if(isLocalToolModal(modal))return <LocalToolDialog modal={modal}/>;
 if(modal==='local-plugins')return isSafeMode()?<SafeModePluginsNotice/>:<LocalPlugins key={s.doc.id}/>;
 if(modal==='code-layer')return <CodeLayerEditor key={s.doc.id}/>;
 if(modal==='component-playground')return <ComponentPlayground/>;
 if(modal==='sketch-import'||modal==='sketch-import-review')return <SketchImport key={s.doc.id+modal}/>;
 if(modal==='pdf-import-review')return <PdfImportReview key={s.doc.id}/>;
 if(modal==='design-json-review')return <DesignJsonReview key={s.doc.id}/>;
 if(modal==='local-links')return <LocalNavigationLinks key={s.doc.id}/>;
 if(modal==='icons')return <IconLibrary key={s.doc.id}/>;
 if(modal==='share-prototype')return <PrototypeShare key={s.doc.id}/>;
 if(modal==='resource-library')return <ResourceLibrary key={s.doc.id}/>;
 if(modal==='templates')return <TemplateGallery key={s.doc.id}/>;
 if(modal==='comments'||modal.startsWith('comment:'))return <LocalCommentsDialog key={s.doc.id+':'+modal}/>;
 const close=()=>{if(modal==='fig-import-report')clearFigImportReport();if(modal==='svg-import')cancelSvgImport();else s.set({modal:null});};
 if(modal==='text-search')return <TextSearch key={s.doc.id}/>;
 if(modal==='move-to-page')return <MoveLayersDialog/>;
 if(modal==='branches')return <BranchesDialog key={s.doc.id}/>;
 if(modal==='storage')return <StorageRecoveryDialog/>;
 if(modal==='document-recovery')return <DocumentRecoveryDialog/>;
 if(modal==='history')return <VersionHistory key={s.doc.id}/>;
 if(modal==='present')return <PrototypePresentation/>;
 if(modal==='file-cover')return <DocumentCoverDialog/>;
 if(modal==='document-outline')return <DocumentOutline/>;
 if(modal==='slices')return <SliceManager/>;
 if(modal==='selection-box')return <KeyboardSelectionBox/>;
 if(modal==='vector-offset')return <VectorOffsetDialog/>;
 if(modal==='stroke-outline')return <StrokeOutlineDialog/>;
 if(modal==='vector-separation')return <VectorSeparationDialog/>;
 if(modal.startsWith('brand-'))return <BrandDialogs modal={modal}/>;
 if(modal==='repeat-layers')return <RepeatLayersDialog/>;
 if(modal==='keyboard-insert')return <KeyboardInsertDialog/>;

 const title=modal==='asset-usage'?'Local asset usage':modal==='fig-import-report'?'Design file import report':modal==='file-info'?'File information':modal==='release-notes'?'Release notes':modal==='preferences'?'Preferences':modal==='svg-import'?'Import SVG':modal==='mcp'?'Free local MCP automation':modal==='variables'?'Variables and modes':modal==='styles'?'Local design styles':modal==='delete-component'?'Delete main component?':modal==='components'?'Components and variants':modal==='text-link'?'Link this text.':modal==='fonts'?'Every idea has a type.':modal==='actions'?'What would you like to do?':modal==='roadmap'?'The complete feature register':modal==='interchange'?'Your ideas, in both directions.':modal==='export'?'Export your design':modal==='shortcuts'?'A little less clicking.':modal==='history'?'Version history':modal==='snapshot'?'Save a version':modal==='comments'?'Comments':modal==='colors'?'Styles & colors':modal==='about'?'Forma':modal.startsWith('comment:')?'Leave a note':modal.startsWith('rename')?'Give it a name':'Forma';
 const rename=()=>{if(!value.trim())return;if(modal==='rename-file')s.edit(d=>{d.name=value.trim();});if(modal==='rename-page')s.edit(d=>{d.pages.find(p=>p.id===s.pageId)!.name=value.trim();});if(modal==='rename')s.patch(s.selection,{name:value.trim()});close();};
 const rows=features.filter(f=>(category==='All'||f.category===category)&&(filter==='All'||f.status===filter)&&(`${f.id} ${f.name} ${f.category}`).toLowerCase().includes(query.toLowerCase()));

 return <div className="modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}><div role="dialog" aria-modal="true" aria-label={t(title)} className={'dialog '+(['preferences','svg-import','fig-import-report','roadmap','shortcuts','fonts','components','variables','styles','asset-usage','mcp'].includes(modal)?'wide-dialog':'') } onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}if(e.key==='Tab'){const list=[...e.currentTarget.querySelectorAll<HTMLElement>(modal==='shortcuts'?'button:not([disabled]):not([tabindex="-1"]),input,select,textarea,a[href],[tabindex="0"]':'button:not([disabled]),input,select,textarea,a[href]')];const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
 <header className="dialog-header"><div><span className="eyebrow">OANARINA FORMA</span><h2>{t(title)}</h2></div><button aria-label={t('Close dialog')} onClick={close}><X size={18}/></button></header>
 <div className="dialog-body">
 {modal==='variables'&&<DesignSystemsEditor tab="variables"/>}
 {modal==='styles'&&<DesignSystemsEditor tab="styles"/>}
 {modal==='asset-usage'&&<AssetUsageAudit key={s.doc.id}/>}
 {modal==='components'&&<ComponentManager/>}
 {modal==='mcp'&&<McpSetup/>}
 {modal==='svg-import'&&<SvgImportReview/>}
 {modal==='fig-import-report'&&<FigImportReport/>}
 {modal==='preferences'&&<Preferences/>}
 {modal==='release-notes'&&<ReleaseNotes/>}
 {modal==='file-info'&&<FileInformation key={s.doc.id}/>}
 {modal==='delete-component'&&<><p>{t('Instances will keep their current appearance and become disconnected. Undo or Restore main component can recover the link.')}</p><button className="primary-button" onClick={()=>{s.remove();close();}}>{t('Delete main component')}</button><button className="outline-button" onClick={close}>{t('Keep component')}</button></>}
 {modal==='fonts'&&<FontLibrary/>}
 {modal==='text-link'&&<form onSubmit={e=>{e.preventDefault();if(value&&!/^https?:\/\//i.test(value)){s.set({toast:t('Use an https:// or http:// link.')});return;}s.patch(s.selection,{hyperlink:value||undefined});close();}}><input type="url" aria-label={t('Text hyperlink')} autoFocus placeholder="https://example.com" value={value} onChange={e=>setValue(e.target.value)}/><div className="button-row"><button className="primary-button" type="submit">{t('Save link')}</button><button className="outline-button" type="button" onClick={()=>{s.patch(s.selection,{hyperlink:undefined});close();}}>{t('Remove link')}</button></div></form>}

 {modal.startsWith('rename')&&<form onSubmit={e=>{e.preventDefault();rename();}}><input aria-label={t('Name')} autoFocus value={value} onFocus={e=>e.currentTarget.select()} onChange={e=>setValue(e.target.value)}/><button className="primary-button" type="submit">{t('Save name')}</button></form>}
 {modal==='actions'&&<ActionPalette onClose={close}/>}
 {modal==='roadmap'&&<><p className="dialog-description">{t('{count} individually named requirements. This is the implementation plan, with honest status for every item. Category references still need individual in-app verification.',{count:formatNumber(features.length)})}</p><div className="roadmap-stats">{['implemented','partial','planned'].map(status=><div key={status}><strong>{formatNumber(features.filter(f=>f.status===status).length)}</strong><span>{t(status)}</span></div>)}</div><div className="roadmap-filters"><input autoFocus aria-label={t('Search feature register')} placeholder={t('Search {count} requirements…',{count:formatNumber(features.length)})} value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label={t('Feature category')} value={category} onChange={e=>setCategory(e.target.value)}><option value="All">{t('All')}</option>{[...new Set(features.map(f=>f.category))].map(c=><option key={c}>{c}</option>)}</select><select aria-label={t('Feature status')} value={filter} onChange={e=>setFilter(e.target.value)}>{['All','implemented','partial','planned'].map(f=><option key={f} value={f}>{t(f)}</option>)}</select></div><p className="muted">{t('{count} requirements found',{count:formatNumber(rows.length)})}</p><div className="feature-list">{rows.map(f=><div className="feature-row" key={f.id}><code>{f.id}</code><div><strong>{f.name}</strong><small>{f.category}{f.notes?' · '+f.notes:''}</small></div><span className={'status '+f.status}>{t(f.status)}</span></div>)}</div></>}
 {modal==='interchange'&&<><p className="dialog-description">Open supported binary <code>.fig</code> Design files or offline design JSON through File → Open. Design JSON conversion has a reduction review before opening and never fetches remote assets. Save converted projects as .oui; binary .fig export is not available.</p><div className="button-row"><button className="primary-button" onClick={()=>{close();void openProject();}}>Open design file…</button><DesignJsonImportButton/></div><div className="transfer-card"><Layers size={22}/><div><h3>SVG exchange</h3><p>Export SVG here to use your artwork in other design tools. Place an SVG to review supported editable shapes, paths, text and hierarchy, or choose a sanitized visual asset. Unsupported SVG features are reported.</p><button className="text-button" onClick={()=>exportArtwork('svg')}>Export SVG <ExternalLink size={12}/></button></div></div></>}
 {modal==='export'&&<ExportDialog format={format} setFormat={setFormat} scale={scale} setScale={setScale} includeGuides={includeGuides} setIncludeGuides={setIncludeGuides}/>}
 {modal==='shortcuts'&&<ShortcutHelp/>}
 {modal==='snapshot'&&<SaveVersion/>}
 {modal==='colors'&&<><p className="dialog-description">{t('A shared palette for this document. Apply a color from the inspector.')}</p>{s.doc.colors.map((c,i)=><div className="palette-row" key={i}><input aria-label={t('{name} color',{name:c.name})} type="color" value={c.value} onChange={e=>s.edit(d=>{d.colors[i].value=e.target.value;})}/><input aria-label={t('{name} name',{name:c.name})} defaultValue={c.name} onBlur={e=>{if(e.target.value)s.edit(d=>{d.colors[i].name=e.target.value;});}}/><code>{c.value}</code><button title={t('Remove color')} onClick={()=>s.edit(d=>{d.colors.splice(i,1);})}><X size={13}/></button></div>)}<button className="outline-button" onClick={()=>s.edit(d=>d.colors.push({name:'New color',value:'#c8b9ee'}))}>{t('Add color')}</button></>}
 {modal==='about'&&<div className="about"><img src="./app-icon-v2.png" width="76" height="76" alt="Forma icon"/><h3>{t('A little space for big ideas.')}</h3><p>{t('Forma · {version} preview',{version:APP_VERSION})}<br/>{t('Created by Oana Rinaldi')}</p><p className="dialog-description">{t('An independent, local-first design editor for Mac. This preview is not a complete design suite.')}</p><button className="outline-button" onClick={()=>s.set({modal:'roadmap'})}>{t('Explore all {count} requirements',{count:formatNumber(FEATURE_COUNT)})} <ChevronRight size={14}/></button></div>}
 </div></div></div>;
}
export {default as Home} from './Home';
